import { PerformanceMonitor } from './performance.js';

export class SocketManager {
    constructor(io, logger) {
        this.io = io;
        this.logger = logger;
        this.performanceMonitor = new PerformanceMonitor();
        
        // Event batching for high-frequency events
        this.eventBatches = new Map();
        this.batchInterval = 50; // 50ms batching window
        
        // Connection pooling
        this.connectionPool = new Map();
        this.maxConnectionsPerClient = 5;
        
        // Rate limiting
        this.rateLimits = new Map();
        this.setupRateLimiting();
    }

    setupRateLimiting() {
        this.rateLimitConfig = {
            'svn-info-single': { maxRequests: 10, window: 1000 }, // 10 requests per second
            'svn-status-single': { maxRequests: 5, window: 1000 }, // 5 requests per second
            'svn-logs-selected': { maxRequests: 2, window: 5000 }, // 2 requests per 5 seconds
            'default': { maxRequests: 20, window: 1000 } // Default: 20 requests per second
        };
    }

    handleConnection(socket) {
        const clientId = socket.handshake.address;
        
        // Track connection
        if (!this.connectionPool.has(clientId)) {
            this.connectionPool.set(clientId, new Set());
        }
        
        const connections = this.connectionPool.get(clientId);
        if (connections.size >= this.maxConnectionsPerClient) {
            this.logger.warn(`Client ${clientId} exceeded max connections`);
            socket.disconnect(true);
            return;
        }
        
        connections.add(socket.id);
        
        // Setup optimized event handlers
        this.setupEventHandlers(socket);
        
        // Cleanup on disconnect
        socket.on('disconnect', () => {
            connections.delete(socket.id);
            if (connections.size === 0) {
                this.connectionPool.delete(clientId);
            }
            this.cleanupClient(socket.id);
        });
    }

    setupEventHandlers(socket) {
        // Wrap all event handlers with rate limiting and performance monitoring
        const events = [
            'svn-info-single',
            'svn-status-single',
            'svn-update-single',
            'svn-logs-selected',
            'svn-commit',
            'watcher-branches-update',
            'svn-files-add-delete',
            'svn-files-revert'
        ];

        events.forEach(event => {
            const originalHandler = socket._events[event];
            if (originalHandler) {
                socket.removeAllListeners(event);
                socket.on(event, this.wrapHandler(event, originalHandler, socket));
            }
        });
    }

    wrapHandler(eventName, handler, socket) {
        return async (data, callback) => {
            // Rate limiting check
            if (!this.checkRateLimit(socket.id, eventName)) {
                this.emitError(socket, `Rate limit exceeded for ${eventName}`, 'warning');
                if (callback) callback({ success: false, error: 'Rate limit exceeded' });
                return;
            }

            // Performance monitoring
            const endTimer = this.performanceMonitor.startOperation(`socket_${eventName}`);

            try {
                await handler.call(socket, data, callback);
            } catch (error) {
                this.logger.error(`Error in ${eventName} handler:`, error);
                this.emitError(socket, `Error processing ${eventName}`, 'error');
                if (callback) callback({ success: false, error: error.message });
            } finally {
                endTimer();
            }
        };
    }

    checkRateLimit(socketId, event) {
        const config = this.rateLimitConfig[event] || this.rateLimitConfig.default;
        const key = `${socketId}_${event}`;
        const now = Date.now();

        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, []);
        }

        const requests = this.rateLimits.get(key);
        const windowStart = now - config.window;
        
        // Remove old requests
        const recentRequests = requests.filter(time => time > windowStart);
        
        if (recentRequests.length >= config.maxRequests) {
            return false;
        }

        recentRequests.push(now);
        this.rateLimits.set(key, recentRequests);
        return true;
    }

    // Batch emit for high-frequency events
    batchEmit(event, data, socketId = null) {
        const key = `${event}_${socketId || 'broadcast'}`;
        
        if (!this.eventBatches.has(key)) {
            this.eventBatches.set(key, {
                event,
                socketId,
                data: [],
                timer: null
            });
        }

        const batch = this.eventBatches.get(key);
        batch.data.push(data);

        // Clear existing timer
        if (batch.timer) {
            clearTimeout(batch.timer);
        }

        // Set new timer
        batch.timer = setTimeout(() => {
            this.flushBatch(key);
        }, this.batchInterval);
    }

    flushBatch(key) {
        const batch = this.eventBatches.get(key);
        if (!batch || batch.data.length === 0) return;

        const endTimer = this.performanceMonitor.startOperation(`batch_emit_${batch.event}`);

        try {
            if (batch.socketId) {
                const socket = this.io.sockets.sockets.get(batch.socketId);
                if (socket) {
                    socket.emit(batch.event, batch.data);
                }
            } else {
                this.io.emit(batch.event, batch.data);
            }
        } finally {
            endTimer();
        }

        // Clear batch
        batch.data = [];
        clearTimeout(batch.timer);
        batch.timer = null;
    }

    // Optimized emit methods
    emitMessage(socket, description, type = "info", duration = 3000) {
        // Batch non-critical messages
        if (type === 'info' || type === 'success') {
            this.batchEmit('notification-batch', { 
                description, 
                type, 
                duration: type === "error" ? 0 : duration,
                timestamp: Date.now()
            }, socket.id);
        } else {
            // Emit errors immediately
            socket.emit("notification", { 
                description, 
                type, 
                duration: 0 
            });
        }
    }

    emitError(socket, description, type = 'error') {
        this.emitMessage(socket, description, type, 0);
    }

    emitBranchInfo(socket, branchId, branchInfo, baseRevision) {
        socket.emit("branch-info-single", { id: branchId, info: branchInfo, baseRevision });
    }

    emitBranchStatus(socket, branchId, branchStatus) {
        socket.emit("branch-status-single", { id: branchId, status: branchStatus });
    }

    // Broadcast optimizations
    broadcastToRoom(room, event, data) {
        const endTimer = this.performanceMonitor.startOperation(`broadcast_${event}`);
        
        try {
            this.io.to(room).emit(event, data);
        } finally {
            endTimer();
        }
    }

    // Cleanup
    cleanupClient(socketId) {
        // Clean up rate limit data
        for (const key of this.rateLimits.keys()) {
            if (key.startsWith(socketId)) {
                this.rateLimits.delete(key);
            }
        }

        // Flush any pending batches
        for (const [key, batch] of this.eventBatches) {
            if (batch.socketId === socketId) {
                this.flushBatch(key);
                this.eventBatches.delete(key);
            }
        }
    }

    // Get performance metrics
    getMetrics() {
        return {
            performance: this.performanceMonitor.getMetrics(),
            connections: {
                total: this.io.sockets.sockets.size,
                byClient: Array.from(this.connectionPool.entries()).map(([client, sockets]) => ({
                    client,
                    connections: sockets.size
                }))
            },
            rateLimiting: {
                activeClients: this.rateLimits.size
            }
        };
    }
}