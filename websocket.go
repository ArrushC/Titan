package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type WebSocketServer struct {
	upgrader     websocket.Upgrader
	clients      map[*websocket.Conn]*ClientInfo
	mu           sync.RWMutex
	server       *http.Server
	ctx          context.Context
	cancel       context.CancelFunc
	dataProvider DataProvider
}

type ClientInfo struct {
	conn       *websocket.Conn
	lastPong   time.Time
	isAlive    bool
	writeMutex sync.Mutex
}

// safeWriteMessage writes a message to the connection with mutex protection and timeout
func (ci *ClientInfo) safeWriteMessage(messageType int, data []byte) error {
	ci.writeMutex.Lock()
	defer ci.writeMutex.Unlock()
	
	// Set write deadline to prevent indefinite blocking
	ci.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	
	return ci.conn.WriteMessage(messageType, data)
}

func NewWebSocketServer(dataProvider DataProvider) *WebSocketServer {
	return &WebSocketServer{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		clients:      make(map[*websocket.Conn]*ClientInfo),
		dataProvider: dataProvider,
	}
}

func (ws *WebSocketServer) Start(port string) error {
	ws.ctx, ws.cancel = context.WithCancel(context.Background())
	
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", ws.handleWebSocket)
	
	ws.server = &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}
	
	// Start heartbeat monitoring
	go ws.startHeartbeat()
	
	go func() {
		log.Printf("WebSocket server starting on port %s", port)
		if err := ws.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("WebSocket server error: %v", err)
		}
	}()
	
	return nil
}

func (ws *WebSocketServer) Stop() error {
	if ws.cancel != nil {
		ws.cancel()
	}
	
	ws.mu.Lock()
	for client := range ws.clients {
		client.Close()
	}
	ws.clients = make(map[*websocket.Conn]*ClientInfo)
	ws.mu.Unlock()
	
	if ws.server != nil {
		// Use a timeout context for shutdown
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		err := ws.server.Shutdown(shutdownCtx)
		if err != nil {
			log.Printf("WebSocket server shutdown error: %v", err)
		}
		return err
	}
	
	return nil
}

func (ws *WebSocketServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := ws.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()
	
	// Set up client info
	clientInfo := &ClientInfo{
		conn:     conn,
		lastPong: time.Now(),
		isAlive:  true,
	}
	
	ws.mu.Lock()
	ws.clients[conn] = clientInfo
	ws.mu.Unlock()
	
	defer func() {
		ws.mu.Lock()
		delete(ws.clients, conn)
		ws.mu.Unlock()
	}()
	
	// Set up pong handler
	conn.SetPongHandler(func(string) error {
		ws.mu.Lock()
		if info, exists := ws.clients[conn]; exists {
			info.lastPong = time.Now()
			info.isAlive = true
		}
		ws.mu.Unlock()
		return nil
	})
	
	// Set read deadline
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	
	for {
		select {
		case <-ws.ctx.Done():
			return
		default:
			_, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("WebSocket error: %v", err)
				}
				return
			}
			
			// Reset read deadline on each message
			conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			
			// Handle incoming message
			ws.handleMessage(conn, message)
		}
	}
}

func (ws *WebSocketServer) broadcastMessage(messageType int, message []byte) {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	
	for client, info := range ws.clients {
		if !info.isAlive {
			continue
		}
		err := info.safeWriteMessage(messageType, message)
		if err != nil {
			log.Printf("Error broadcasting message: %v", err)
			client.Close()
			info.isAlive = false
		}
	}
}

func (ws *WebSocketServer) SendMessage(message string) error {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	
	for client, info := range ws.clients {
		if !info.isAlive {
			continue
		}
		err := info.safeWriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			log.Printf("Error sending message: %v", err)
			client.Close()
			info.isAlive = false
		}
	}
	
	return nil
}

// startHeartbeat starts the heartbeat mechanism
func (ws *WebSocketServer) startHeartbeat() {
	ticker := time.NewTicker(30 * time.Second) // Send ping every 30 seconds
	defer ticker.Stop()
	
	for {
		select {
		case <-ws.ctx.Done():
			return
		case <-ticker.C:
			ws.pingClients()
		}
	}
}

// pingClients sends ping messages to all connected clients
func (ws *WebSocketServer) pingClients() {
	ws.mu.Lock()
	defer ws.mu.Unlock()
	
	now := time.Now()
	
	for client, info := range ws.clients {
		// Mark client as potentially dead if no pong received in 60 seconds
		if now.Sub(info.lastPong) > 60*time.Second {
			info.isAlive = false
			log.Printf("Client marked as dead - no pong received")
			client.Close()
			delete(ws.clients, client)
			continue
		}
		
		// Send ping
		if err := info.safeWriteMessage(websocket.PingMessage, nil); err != nil {
			log.Printf("Error sending ping: %v", err)
			info.isAlive = false
			client.Close()
			delete(ws.clients, client)
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (ws *WebSocketServer) handleMessage(conn *websocket.Conn, message []byte) {
	log.Printf("Received message: %s", string(message))

	// Parse message as JSON to handle complex requests
	var msgData map[string]interface{}
	if err := json.Unmarshal(message, &msgData); err != nil {
		// Fallback to string-based commands for backward compatibility
		msgStr := string(message)
		ws.handleStringCommand(conn, msgStr)
		return
	}

	// Handle structured commands
	if cmdType, ok := msgData["command"].(string); ok {
		ws.handleStructuredCommand(conn, cmdType, msgData)
	} else {
		ws.sendJSON(conn, map[string]interface{}{"type": "error", "message": "Invalid command format"})
	}
}

// handleStringCommand handles simple string-based commands for backward compatibility
func (ws *WebSocketServer) handleStringCommand(conn *websocket.Conn, msgStr string) {
	switch {
	case msgStr == "get:status":
		// Return cached SVN status if available
		if cachedStatus := ws.dataProvider.getData("svn:lastStatus"); cachedStatus != nil {
			response := map[string]interface{}{
				"type": "cached_status",
				"data": cachedStatus,
				"time": ws.dataProvider.getData("svn:lastStatusTime"),
			}
			ws.sendJSON(conn, response)
		} else {
			ws.sendJSON(conn, map[string]string{"type": "error", "message": "No cached status available"})
		}

	case msgStr == "get:data":
		// Return all shared data
		allData := ws.dataProvider.getAllData()
		ws.sendJSON(conn, map[string]interface{}{"type": "all_data", "data": allData})

	case msgStr == "check:svn":
		// Check if current directory is SVN working copy
		isWorkingCopy := ws.dataProvider.CheckSVNWorkingCopy()
		ws.sendJSON(conn, map[string]interface{}{"type": "svn_check", "is_working_copy": isWorkingCopy})

	case msgStr == "refresh:status":
		// Trigger SVN status refresh through the data provider
		go func() {
			status, err := ws.dataProvider.SVNStatus([]string{"."})
			if err != nil {
				ws.sendJSON(conn, map[string]interface{}{"type": "error", "message": err.Error()})
			} else {
				ws.sendJSON(conn, map[string]interface{}{"type": "status_refreshed", "data": status})
			}
		}()

	// Script-related WebSocket commands removed - now using direct Go functions

	default:
		// Echo back unknown messages
		ws.sendJSON(conn, map[string]interface{}{"type": "echo", "message": msgStr})
	}
}

// handleStructuredCommand handles complex JSON-based commands
func (ws *WebSocketServer) handleStructuredCommand(conn *websocket.Conn, cmdType string, msgData map[string]interface{}) {
	switch cmdType {
	case "commit:variables:update":
		// Handle commit variable updates for cross-client synchronization
		if branchPath, ok := msgData["branchPath"].(string); ok {
			if variables, ok := msgData["variables"].(map[string]interface{}); ok {
				// Broadcast to all other clients
				broadcastData := map[string]interface{}{
					"type":       "commit:variables:updated",
					"branchPath": branchPath,
					"variables":  variables,
					"timestamp":  time.Now().Unix(),
				}
				
				// Send to all clients except the sender
				ws.broadcastToOthers(conn, broadcastData)
				
				// Acknowledge to sender
				ws.sendJSON(conn, map[string]interface{}{
					"type":    "commit:variables:ack",
					"success": true,
				})
			} else {
				ws.sendJSON(conn, map[string]interface{}{
					"type":    "error",
					"message": "Invalid variables data",
				})
			}
		} else {
			ws.sendJSON(conn, map[string]interface{}{
				"type":    "error",
				"message": "Branch path required",
			})
		}

	case "commit:status:request":
		// Handle commit status fetching request
		if branchPaths, ok := msgData["branchPaths"].([]interface{}); ok {
			// Start background status fetching
			go func() {
				ws.sendJSON(conn, map[string]interface{}{
					"type":    "commit:status:started",
					"message": "Status fetching started",
				})

				// This would integrate with the SVN status fetching logic
				// For now, just acknowledge
				ws.sendJSON(conn, map[string]interface{}{
					"type":         "commit:status:progress",
					"totalBranches": len(branchPaths),
					"completed":     0,
				})
			}()
		} else {
			ws.sendJSON(conn, map[string]interface{}{
				"type":    "error",
				"message": "Branch paths required",
			})
		}

	default:
		ws.sendJSON(conn, map[string]interface{}{"type": "error", "message": "Unknown command: " + cmdType})
	}
}

// sendJSON sends a JSON response to a specific connection
func (ws *WebSocketServer) sendJSON(conn *websocket.Conn, data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		return
	}
	
	// Find the client info for this connection
	ws.mu.RLock()
	clientInfo, exists := ws.clients[conn]
	ws.mu.RUnlock()
	
	if !exists || !clientInfo.isAlive {
		log.Printf("Cannot send JSON: client not found or not alive")
		return
	}
	
	if err := clientInfo.safeWriteMessage(websocket.TextMessage, jsonData); err != nil {
		log.Printf("Error sending JSON message: %v", err)
		// Mark client as dead on write error
		ws.mu.Lock()
		if info, exists := ws.clients[conn]; exists {
			info.isAlive = false
		}
		ws.mu.Unlock()
	}
}

// broadcastToOthers sends a message to all connected clients except the specified one
func (ws *WebSocketServer) broadcastToOthers(excludeConn *websocket.Conn, data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("Error marshaling JSON for broadcast: %v", err)
		return
	}

	ws.mu.RLock()
	defer ws.mu.RUnlock()
	
	for client, info := range ws.clients {
		if client != excludeConn && info.isAlive {
			err := info.safeWriteMessage(websocket.TextMessage, jsonData)
			if err != nil {
				log.Printf("Error broadcasting message: %v", err)
				client.Close()
				info.isAlive = false
			}
		}
	}
}