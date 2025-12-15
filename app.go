package main

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"regexp"
	goruntime "runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"Titan/internal/storage"

	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx                context.Context
	wsServer           *WebSocketServer
	svn                *SVNWrapper
	scriptManager      *ScriptManager
	appConfigPath      string
	branchConfigPath   string
	scriptConfigPath   string
	logCacheConfigPath string
	logCacheManager    *LogCacheManager
	appConfig          AppConfig
	branchConfig       BranchConfig
	scriptConfig       ScriptConfig
	dataStore          map[string]interface{}
	dataMutex          sync.RWMutex
	shutdownOnce       sync.Once
	store              *storage.StateStore
}

// NewApp creates a new App application struct
func NewApp(store *storage.StateStore) *App {
	app := &App{
		svn:                NewSVNWrapper("."), // Default to current directory
		appConfigPath:      "C:\\Titan\\Titan.app.json",
		branchConfigPath:   "C:\\Titan\\Titan.branches.json",
		scriptConfigPath:   "C:\\Titan\\Titan.scripts.json",
		logCacheConfigPath: "C:\\Titan\\Titan.logs.json",
		dataStore:          make(map[string]interface{}),
		store:              store,
	}

	// Initialize log cache manager
	app.logCacheManager = NewLogCacheManager(app.logCacheConfigPath)

	// Pass app reference to WebSocket server (it implements DataProvider)
	app.wsServer = NewWebSocketServer(app)

	return app
}

// calculateOptimalConcurrency determines the best concurrency level based on system resources
func calculateOptimalConcurrency() int {
	numCPU := goruntime.NumCPU()

	// Base calculation: 2-4 operations per CPU core
	// This balances CPU usage with I/O wait times for SVN operations
	baseConcurrency := numCPU * 3

	// Set reasonable bounds based on system capabilities
	minConcurrency := 8  // Minimum for responsiveness
	maxConcurrency := 50 // Maximum to prevent system overload

	// Adjust based on available memory (rough estimation)
	// Each SVN operation may use 10-20MB of memory
	var memStats goruntime.MemStats
	goruntime.ReadMemStats(&memStats)

	// Available memory in MB (rough calculation)
	availableMemMB := int(memStats.Sys / 1024 / 1024)

	// Each concurrent operation needs roughly 20MB
	memoryLimitedConcurrency := availableMemMB / 20

	// Use the smaller of CPU-based or memory-based limits
	optimalConcurrency := baseConcurrency
	if memoryLimitedConcurrency < baseConcurrency {
		optimalConcurrency = memoryLimitedConcurrency
	}

	// Apply bounds
	if optimalConcurrency < minConcurrency {
		optimalConcurrency = minConcurrency
	}
	if optimalConcurrency > maxConcurrency {
		optimalConcurrency = maxConcurrency
	}

	log.Printf("Hardware-based concurrency calculation: CPU cores=%d, optimal=%d (min=%d, max=%d)",
		numCPU, optimalConcurrency, minConcurrency, maxConcurrency)

	return optimalConcurrency
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize configs from files asynchronously for faster startup
	var wg sync.WaitGroup
	wg.Add(3)

	// Load app config asynchronously
	go func() {
		defer wg.Done()
		if err := a.loadConfig(a.appConfigPath, &a.appConfig); err != nil {
			log.Printf("Failed to load app config: %v", err)
		}
	}()

	// Load branch config asynchronously
	go func() {
		defer wg.Done()
		if err := a.loadConfig(a.branchConfigPath, &a.branchConfig); err != nil {
			log.Printf("Failed to load branch config: %v", err)
		}
	}()

	// Load script config asynchronously
	go func() {
		defer wg.Done()
		if err := a.loadConfig(a.scriptConfigPath, &a.scriptConfig); err != nil {
			log.Printf("Failed to load script config: %v", err)
		}
	}()

	// Wait for all configs to load
	wg.Wait()

	// Initialize script manager with config
	scriptsPath := a.scriptConfig.Settings.ScriptsPath
	if scriptsPath == "" {
		scriptsPath = "C:\\Titan\\scripts"
	}
	a.scriptManager = NewScriptManager(scriptsPath, &a.scriptConfig)

	// Start WebSocket server in a goroutine with synchronization
	wsReady := make(chan bool, 1)
	go func() {
		if err := a.wsServer.Start("5000"); err != nil {
			log.Printf("Failed to start WebSocket server: %v", err)
			wsReady <- false
		} else {
			wsReady <- true
		}
	}()

	// Wait for WebSocket server to be ready
	if <-wsReady {
		log.Println("WebSocket server started on port 5000")
	} else {
		log.Println("WebSocket server failed to start")
	}
}

// Handle second instance launch - bring existing instance to front
func (a *App) onSecondInstance(secondInstanceData options.SecondInstanceData) {
	log.Println("Second instance detected, bringing main window to front")
	// Bring the main window to front and focus
	runtime.WindowShow(a.ctx)
	runtime.WindowSetAlwaysOnTop(a.ctx, true)
	runtime.WindowSetAlwaysOnTop(a.ctx, false) // Reset to normal behavior after bringing to front
}

// Generic config loader/saver
func (a *App) loadConfig(filePath string, config interface{}) error {
	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		// File doesn't exist, create it with default values
		return a.createDefaultConfig(filePath, config)
	}

	// File exists, load it
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open config file %s: %w", filePath, err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	if err := decoder.Decode(config); err != nil {
		return fmt.Errorf("failed to decode config file %s: %w", filePath, err)
	}

	return nil
}

// Create default config file based on struct tags or zero values
func (a *App) createDefaultConfig(filePath string, config interface{}) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory %s: %w", dir, err)
	}

	// Initialize with default values from struct tags or zero values
	a.initializeDefaults(config)

	// Save the default config
	return a.saveConfig(filePath, config)
}

// Initialize config with default values based on json tags or zero values
func (a *App) initializeDefaults(config interface{}) {
	v := reflect.ValueOf(config)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	if v.Kind() != reflect.Struct {
		return
	}

	t := v.Type()
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		fieldType := t.Field(i)

		// Skip unexported fields
		if !field.CanSet() {
			continue
		}

		// Handle nested structs
		if field.Kind() == reflect.Struct {
			a.initializeDefaults(field.Addr().Interface())
			continue
		}

		// Handle maps
		if field.Kind() == reflect.Map && field.IsNil() {
			field.Set(reflect.MakeMap(field.Type()))
			continue
		}

		// Handle slices
		if field.Kind() == reflect.Slice && field.IsNil() {
			field.Set(reflect.MakeSlice(field.Type(), 0, 0))
			continue
		}

		// Get default value from json tag if available
		jsonTag := fieldType.Tag.Get("json")
		if jsonTag != "" && jsonTag != "-" {
			// You can extend this to parse default values from custom tags
			// For now, we'll just ensure the field is initialized with zero value
			if field.IsZero() {
				switch field.Kind() {
				case reflect.String:
					field.SetString("")
				case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
					field.SetInt(0)
				case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
					field.SetUint(0)
				case reflect.Bool:
					field.SetBool(false)
				}
			}
		}
	}
}

// Generic config saver
func (a *App) saveConfig(filePath string, config interface{}) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory %s: %w", dir, err)
	}

	// Marshal to JSON with indentation
	jsonBytes, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Write to file
	if err := os.WriteFile(filePath, jsonBytes, 0644); err != nil {
		return fmt.Errorf("failed to write config file %s: %w", filePath, err)
	}

	return nil
}

// Get config as JSON string
func (a *App) getConfigAsString(filePath string, config interface{}) (string, error) {
	if err := a.loadConfig(filePath, config); err != nil {
		return "", err
	}

	jsonBytes, err := json.Marshal(config)
	if err != nil {
		return "", fmt.Errorf("failed to marshal config to JSON: %w", err)
	}

	return string(jsonBytes), nil
}

// Public methods for app config
func (a *App) GetAppConfig() string {
	configStr, err := a.getConfigAsString(a.appConfigPath, &a.appConfig)
	if err != nil {
		// Handle error appropriately - you might want to log it
		checkError(err)
	}
	return configStr
}

func (a *App) SaveAppConfig(configJSON string) error {
	if err := json.Unmarshal([]byte(configJSON), &a.appConfig); err != nil {
		return fmt.Errorf("failed to unmarshal app config JSON: %w", err)
	}

	return a.saveConfig(a.appConfigPath, &a.appConfig)
}

// Public methods for branch config
func (a *App) GetBranchConfig() string {
	// Use in-memory config instead of reloading from file
	// This prevents overwriting recent saves
	jsonBytes, err := json.Marshal(&a.branchConfig)
	if err != nil {
		checkError(err)
		return ""
	}

	return string(jsonBytes)
}

func (a *App) SaveBranchConfig(configJSON string) error {
	// Create a fresh BranchConfig struct to ensure clean unmarshal
	var newBranchConfig BranchConfig
	if err := json.Unmarshal([]byte(configJSON), &newBranchConfig); err != nil {
		return fmt.Errorf("failed to unmarshal branch config JSON: %w", err)
	}

	// Replace the in-memory config with the new one
	a.branchConfig = newBranchConfig

	// Save to file
	return a.saveConfig(a.branchConfigPath, &a.branchConfig)
}

// Alternative versions that return errors instead of panicking
func (a *App) GetAppConfigSafe() (string, error) {
	return a.getConfigAsString(a.appConfigPath, &a.appConfig)
}

func (a *App) GetBranchConfigSafe() (string, error) {
	return a.getConfigAsString(a.branchConfigPath, &a.branchConfig)
}

// Utility method to reload config from file (useful for external changes)
func (a *App) ReloadAppConfig() error {
	return a.loadConfig(a.appConfigPath, &a.appConfig)
}

func (a *App) ReloadBranchConfig() error {
	return a.loadConfig(a.branchConfigPath, &a.branchConfig)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// sendWebSocketMessage sends a message to all connected WebSocket clients (internal use only)
func (a *App) sendWebSocketMessage(message string) error {
	if a.wsServer == nil {
		return fmt.Errorf("WebSocket server not initialized")
	}

	return a.wsServer.SendMessage(message)
}

// GetWebSocketPort returns the port the WebSocket server is running on
func (a *App) GetWebSocketPort() string {
	return "5000"
}

// stopWebSocketServer stops the WebSocket server (internal use only)
func (a *App) stopWebSocketServer() error {
	if a.wsServer == nil {
		return fmt.Errorf("WebSocket server not initialized")
	}

	return a.wsServer.Stop()
}

// restartWebSocketServer restarts the WebSocket server (internal use only)
func (a *App) restartWebSocketServer() error {
	if a.wsServer == nil {
		return fmt.Errorf("WebSocket server not initialized")
	}

	if err := a.wsServer.Stop(); err != nil {
		log.Printf("Error stopping WebSocket server: %v", err)
	}

	// Start WebSocket server in a goroutine
	go func() {
		if err := a.wsServer.Start("8080"); err != nil {
			log.Printf("Failed to restart WebSocket server: %v", err)
		}
	}()

	return nil
}

// SVN Operations - Frontend exposed methods

// SetSVNWorkingDirectory sets the working directory for SVN operations
func (a *App) SetSVNWorkingDirectory(path string) error {
	a.svn = NewSVNWrapper(path)
	return nil
}

// GetSVNVersion returns the SVN version
func (a *App) GetSVNVersion() (string, error) {
	return GetSVNVersion()
}

// CheckSVNWorkingCopy checks if current directory is an SVN working copy
func (a *App) CheckSVNWorkingCopy() bool {
	return a.svn.IsWorkingCopy()
}

// SVNStatus returns SVN status as JSON
func (a *App) SVNStatus(paths []string) (string, error) {
	jsonData, err := a.svn.Status(paths...)
	if err != nil {
		return "", err
	}

	// Cache the latest status
	a.setData("svn:lastStatus", string(jsonData))
	a.setData("svn:lastStatusPaths", paths)
	a.setData("svn:lastStatusTime", time.Now().Format(time.RFC3339))

	// Notify WebSocket clients that new status is available
	if a.wsServer != nil {
		a.sendWebSocketMessage(fmt.Sprintf(`{"type":"svn:status:updated","paths":%v}`, paths))
	}

	return string(jsonData), nil
}

// SVNLog returns SVN log as JSON with optional author filtering
// Automatically handles multiple working copy paths using parallel execution
func (a *App) SVNLog(limit int, isVerbose bool, paths []string, includeAllAuthors bool) (string, error) {
	// Get author from config, but skip if includeAllAuthors is true
	author := ""
	if !includeAllAuthors {
		author = a.appConfig.Subversion.Author
	}

	// Use LogMultiplePaths which handles both single and multiple paths efficiently
	// This solves the SVN limitation: "When specifying working copy paths, only one target may be given"
	jsonData, err := a.svn.LogMultiplePaths(limit, author, isVerbose, paths...)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// SVNLogCached returns SVN log with incremental caching for improved performance
func (a *App) SVNLogCached(limit int, isVerbose bool, paths []string, includeAllAuthors bool) (map[string]interface{}, error) {
	// Get author from config, but skip if includeAllAuthors is true
	author := ""
	if !includeAllAuthors {
		author = a.appConfig.Subversion.Author
	}

	result := make(map[string]interface{})

	// Incremental cache-aware fetching
	var allCachedEntries []SVNLogEntry
	var allIncrementalEntries []SVNLogEntry
	repoURLs := make(map[string]string) // path -> repoURL mapping

	// Process each path to implement incremental caching
	for _, path := range paths {
		// Get repository URL for this path
		repoURL, err := a.getRepositoryURLForPath(path)
		if err != nil {
			log.Printf("Warning: Could not get repository URL for path %s: %v", path, err)
			// For paths without repository URLs, fetch fresh data
			jsonData, err := a.svn.LogMultiplePaths(limit, author, isVerbose, path)
			if err != nil {
				log.Printf("Error fetching fresh data for %s: %v", path, err)
				continue
			}
			var svnLog SVNLog
			if err := json.Unmarshal(jsonData, &svnLog); err == nil {
				allIncrementalEntries = append(allIncrementalEntries, svnLog.LogEntry...)
			}
			continue
		}
		repoURLs[path] = repoURL

		// Check cache using App's cache manager
		cachedEntries, lastCachedRev, err := a.logCacheManager.GetCachedLogs(repoURL)
		if err != nil {
			log.Printf("Warning: Cache error for %s: %v", repoURL, err)
			// Fall back to fresh fetch for this path
			jsonData, err := a.svn.LogMultiplePaths(limit, author, isVerbose, path)
			if err != nil {
				log.Printf("Error fetching fresh data for %s: %v", path, err)
				continue
			}
			var svnLog SVNLog
			if err := json.Unmarshal(jsonData, &svnLog); err == nil {
				allIncrementalEntries = append(allIncrementalEntries, svnLog.LogEntry...)
			}
			continue
		}

		// Add cached entries to result
		if len(cachedEntries) > 0 {
			allCachedEntries = append(allCachedEntries, cachedEntries...)
		}

		// Fetch incremental data - only logs newer than last cached revision
		var incrementalEntries []SVNLogEntry
		if lastCachedRev > 0 {
			// Fetch only new logs since the last cached revision
			jsonData, err := a.svn.LogSinceRevision(path, lastCachedRev+1, author, isVerbose)
			if err != nil {
				log.Printf("Warning: Failed to fetch incremental logs for %s since revision %d: %v", path, lastCachedRev+1, err)
			} else {
				var svnLog SVNLog
				if err := json.Unmarshal(jsonData, &svnLog); err == nil {
					incrementalEntries = svnLog.LogEntry
				}
			}
		} else {
			// No cache exists, fetch initial set of logs
			jsonData, err := a.svn.LogMultiplePaths(limit, author, isVerbose, path)
			if err != nil {
				log.Printf("Warning: Failed to fetch initial logs for %s: %v", path, err)
			} else {
				var svnLog SVNLog
				if err := json.Unmarshal(jsonData, &svnLog); err == nil {
					incrementalEntries = svnLog.LogEntry
				}
			}
		}

		// Update cache with new entries
		if len(incrementalEntries) > 0 {
			pathEntries := a.filterEntriesForPath(incrementalEntries, path)

			// Count how many of these entries are actually new (not already cached)
			newEntriesCount := a.countNewEntries(cachedEntries, pathEntries)

			if err := a.logCacheManager.UpdateLogCache(repoURL, pathEntries); err != nil {
				log.Printf("Warning: Failed to update cache for %s: %v", repoURL, err)
			} else if newEntriesCount > 0 {
				log.Printf("Cached %d new log entries for %s (had %d cached, fetched %d incremental)",
					newEntriesCount, path, len(cachedEntries), len(pathEntries))
			}
			allIncrementalEntries = append(allIncrementalEntries, incrementalEntries...)
		}
	}

	// Merge cached and incremental entries
	mergedData := a.mergeLogEntries(allCachedEntries, allIncrementalEntries, limit)

	result["data"] = mergedData

	return result, nil
}

// SVNInfo returns SVN info as JSON
func (a *App) SVNInfo(paths []string) (string, error) {
	jsonData, err := a.svn.Info(paths...)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// SVNList returns SVN list as JSON
func (a *App) SVNList(paths []string) (string, error) {
	jsonData, err := a.svn.List(paths...)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// SVNDiff returns SVN diff as plain text
func (a *App) SVNDiff(paths []string) (string, error) {
	return a.svn.Diff(paths...)
}

// SVNGetFileContent returns both old and new content for a file
// Supports both repository paths (from SVN log) and local paths
// filePath: either a repository path like "/branches/project/file.txt" or local path
// revision: revision number for historical diffs
// workingPath: optional local working directory path for context (used when filePath is a repository path)
func (a *App) SVNGetFileContent(filePath string, revision string, workingPath string) (map[string]interface{}, error) {
	var oldContent, newContent string
	var err error

	// Check if this is a repository path (starts with '/') or local path
	if strings.HasPrefix(filePath, "/") {
		// Repository path - need working directory context for SVN operations
		var svnWrapper *SVNWrapper

		if workingPath != "" {
			// Use provided working path
			svnWrapper = NewSVNWrapper(workingPath)
		} else {
			// Use current SVN wrapper or fallback
			svnWrapper = a.svn
			if svnWrapper == nil {
				svnWrapper = NewSVNWrapper(".")
			}
		}

		if revision != "" {
			// Repository path with revision: get content at revision vs previous revision
			// Use the repository path directly with SVN cat commands
			oldContent, newContent, err = svnWrapper.GetFileContentAtRevision(filePath, revision)
		} else {
			return nil, fmt.Errorf("repository paths require a revision number")
		}
	} else {
		// Local path - use existing logic
		svnWrapper := NewSVNWrapper(filepath.Dir(filePath))

		if revision != "" {
			// Revision-based diff: get content at revision vs previous revision
			oldContent, newContent, err = svnWrapper.GetFileContentAtRevision(filePath, revision)
		} else {
			// Working copy diff: get BASE vs WORKING content
			oldContent, newContent, err = svnWrapper.GetFileContent(filePath)
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get file content: %v", err)
	}

	result := map[string]interface{}{
		"oldContent": oldContent,
		"newContent": newContent,
		"success":    true,
	}

	return result, nil
}

// SVNUpdate performs SVN update and returns result as JSON
func (a *App) SVNUpdate(paths []string) (string, error) {
	jsonData, err := a.svn.Update(paths...)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// SVNUpdateBranches updates multiple branches individually and returns results
func (a *App) SVNUpdateBranches(paths []string) (string, error) {
	results := make([]map[string]interface{}, 0, len(paths))

	for _, path := range paths {
		// Create a new SVN wrapper for each path
		svnWrapper := NewSVNWrapper(path)

		// Update this specific branch
		jsonData, err := svnWrapper.Update()
		result := map[string]interface{}{
			"path": path,
		}

		if err != nil {
			result["success"] = false
			result["error"] = err.Error()
		} else {
			result["success"] = true
			result["output"] = string(jsonData)

			// Clear cache for this path after successful update
			svnWrapper.ClearCacheForPath(path)
		}

		results = append(results, result)
	}

	// Convert results to JSON
	jsonBytes, err := json.Marshal(map[string]interface{}{
		"results":       results,
		"totalBranches": len(paths),
		"successCount": func() int {
			count := 0
			for _, result := range results {
				if success, ok := result["success"].(bool); ok && success {
					count++
				}
			}
			return count
		}(),
	})

	if err != nil {
		return "", fmt.Errorf("failed to marshal results: %w", err)
	}

	return string(jsonBytes), nil
}

// SVNCommit performs SVN commit and returns result
func (a *App) SVNCommit(message string, paths []string) (string, error) {
	return a.svn.Commit(message, paths...)
}

// SVNAdd adds files to SVN and returns result
func (a *App) SVNAdd(paths []string) (string, error) {
	return a.svn.Add(paths...)
}

// SVNStatusDetailed returns detailed SVN status including conflicts and remote changes
func (a *App) SVNStatusDetailed(paths []string, includeNormal bool) (string, error) {
	jsonData, err := a.svn.StatusDetailed(includeNormal, paths...)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// SVNStatusForPaths gets fresh SVN status for specific paths after operations
func (a *App) SVNStatusForPaths(paths []string) (string, error) {
	jsonData, err := a.svn.StatusForPaths(paths)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// SVNRevert reverts changes to specified paths
func (a *App) SVNRevert(paths []string) (string, error) {
	return a.svn.Revert(paths...)
}

// SVNAddWithKeywords adds files to SVN with keywords property
func (a *App) SVNAddWithKeywords(paths []string) (string, error) {
	return a.svn.AddWithKeywords(paths...)
}

// SVNAddWithKeywordsAndEOL adds files to SVN with both keywords and eol-style properties
func (a *App) SVNAddWithKeywordsAndEOL(paths []string) (string, error) {
	return a.svn.AddWithKeywordsAndEOL(paths...)
}

// SVNDelete removes files from version control
func (a *App) SVNDelete(paths []string) (string, error) {
	return a.svn.Delete(paths...)
}

// GetFileModificationTime returns the modification time of a file
func (a *App) GetFileModificationTime(filePath string) (string, error) {
	info, err := os.Stat(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to get file info: %w", err)
	}
	return info.ModTime().Format(time.RFC3339), nil
}

// SVNCommitMultiBranch performs commit on multiple branch groups with variable interpolation
func (a *App) SVNCommitMultiBranch(commitGroups []map[string]interface{}) (string, error) {
	if len(commitGroups) == 0 {
		return "", fmt.Errorf("no commit groups provided")
	}

	results := make([]map[string]interface{}, 0, len(commitGroups))
	totalGroups := len(commitGroups)
	successCount := 0

	for i, group := range commitGroups {
		groupResult := map[string]interface{}{
			"groupIndex":  i + 1,
			"totalGroups": totalGroups,
		}

		// Extract data from group
		branchPath, ok := group["branchPath"].(string)
		if !ok || branchPath == "" {
			groupResult["success"] = false
			groupResult["error"] = "Invalid or missing branch path"
			results = append(results, groupResult)
			continue
		}

		commitMessage, ok := group["commitMessage"].(string)
		if !ok || commitMessage == "" {
			groupResult["success"] = false
			groupResult["error"] = "Invalid or missing commit message"
			results = append(results, groupResult)
			continue
		}

		filePaths, ok := group["filePaths"].([]interface{})
		if !ok || len(filePaths) == 0 {
			groupResult["success"] = false
			groupResult["error"] = "No files provided for commit"
			results = append(results, groupResult)
			continue
		}

		// Convert file paths to string slice
		filePathStrings := make([]string, len(filePaths))
		for j, path := range filePaths {
			if pathStr, ok := path.(string); ok {
				filePathStrings[j] = pathStr
			} else {
				groupResult["success"] = false
				groupResult["error"] = fmt.Sprintf("Invalid file path at index %d", j)
				results = append(results, groupResult)
				continue
			}
		}

		groupResult["branchPath"] = branchPath
		groupResult["fileCount"] = len(filePathStrings)

		// Pass through branch metadata if provided
		if branchFolder, ok := group["branchFolder"].(string); ok {
			groupResult["branchFolder"] = branchFolder
		}
		if branchVersion, ok := group["branchVersion"].(string); ok {
			groupResult["branchVersion"] = branchVersion
		}

		// Create SVN wrapper for this branch path
		svnWrapper := NewSVNWrapper(branchPath)

		// Sanitize commit message (replace backticks and quotes with single quotes)
		sanitizedMessage := strings.ReplaceAll(commitMessage, "`", "'")
		sanitizedMessage = strings.ReplaceAll(sanitizedMessage, "\"", "'")

		// Commit the files
		commitOutput, err := svnWrapper.Commit(sanitizedMessage, filePathStrings...)
		if err != nil {
			groupResult["success"] = false
			groupResult["error"] = err.Error()
		} else {
			groupResult["success"] = true
			groupResult["output"] = commitOutput

			// Extract revision number from output if possible
			// Use regex to match "Committed revision 12345." or similar patterns
			revisionRegex := regexp.MustCompile(`Committed revision (\d+)`)
			matches := revisionRegex.FindStringSubmatch(commitOutput)

			if len(matches) > 1 {
				revision := matches[1]
				groupResult["revision"] = revision
				log.Printf("Extracted revision using regex: %s", revision)
			} else {
				// Fallback: Try line-by-line parsing
				if strings.Contains(commitOutput, "Committed revision") {
					// Log for debugging
					log.Printf("Regex failed, trying line-by-line parsing. Output: %s", commitOutput)

					lines := strings.Split(commitOutput, "\n")
					for _, line := range lines {
						if strings.Contains(line, "Committed revision") {
							// Log for debugging
							log.Printf("Found revision line: %s", line)

							// Extract just the number from "Committed revision 12345."
							parts := strings.Split(line, " ")
							for i, part := range parts {
								if part == "revision" && i+1 < len(parts) {
									// Get the next part and remove any trailing punctuation
									revision := strings.TrimSuffix(parts[i+1], ".")
									revision = strings.TrimSpace(revision)
									// Verify it's a number
									if _, err := strconv.Atoi(revision); err == nil {
										groupResult["revision"] = revision
										log.Printf("Extracted revision: %s", revision)
										break
									} else {
										log.Printf("Failed to parse revision number: %s, error: %v", revision, err)
									}
								}
							}
							break
						}
					}
				} else {
					// Log if no revision found in output
					log.Printf("No 'Committed revision' found in output: %s", commitOutput)
				}
			}

			successCount++
		}

		results = append(results, groupResult)

		// Add delay between commits (configurable via AppConfig)
		if i < len(commitGroups)-1 { // Don't delay after the last group
			maxDelaySeconds := 1.5 // Default delay
			if appConfig := a.appConfig; appConfig.Commit.MaxCommitDelay > 0 {
				maxDelaySeconds = appConfig.Commit.MaxCommitDelay
			}
			time.Sleep(time.Duration(maxDelaySeconds * float64(time.Second)))
		}

		// Send progress update via WebSocket
		progressData := map[string]interface{}{
			"type":         "commit:progress",
			"currentGroup": i + 1,
			"totalGroups":  totalGroups,
			"successCount": successCount,
			"result":       groupResult,
		}
		if progressJson, err := json.Marshal(progressData); err == nil {
			a.sendWebSocketMessage(string(progressJson))
		}
	}

	// Prepare final response
	finalResult := map[string]interface{}{
		"results":      results,
		"totalGroups":  totalGroups,
		"successCount": successCount,
		"completed":    true,
	}

	jsonBytes, err := json.Marshal(finalResult)
	if err != nil {
		return "", fmt.Errorf("failed to marshal commit results: %w", err)
	}

	return string(jsonBytes), nil
}

// SelectDirectory opens a directory selection dialog with optional default path
func (a *App) SelectDirectory(defaultPath string) (string, error) {
	options := runtime.OpenDialogOptions{
		Title:            "Change Branch Path",
		DefaultDirectory: defaultPath,
	}

	selectedPath, err := runtime.OpenDirectoryDialog(a.ctx, options)
	if err != nil {
		return "", fmt.Errorf("failed to open directory dialog: %w", err)
	}

	return selectedPath, nil
}

// OpenFolderInExplorer opens a folder in the system's file explorer
func (a *App) OpenFolderInExplorer(path string) error {
	// Check if path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("path does not exist: %s", path)
	}

	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "windows":
		// Use explorer.exe to open the folder
		cmd = exec.Command("explorer.exe", path)
	case "darwin":
		// Use open command on macOS
		cmd = exec.Command("open", path)
	case "linux":
		// Use xdg-open on Linux
		cmd = exec.Command("xdg-open", path)
	default:
		return fmt.Errorf("unsupported platform: %s", goruntime.GOOS)
	}

	// Run the command
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to open folder: %w", err)
	}

	// We use Start() instead of Run() to avoid blocking
	// Let the OS handle the process lifecycle
	return nil
}

// DataProvider interface implementation (internal methods)

// getData retrieves a value from the shared data store (internal use only)
func (a *App) getData(key string) interface{} {
	a.dataMutex.RLock()
	defer a.dataMutex.RUnlock()
	return a.dataStore[key]
}

// setData stores a value in the shared data store (internal use only)
func (a *App) setData(key string, value interface{}) {
	a.dataMutex.Lock()
	defer a.dataMutex.Unlock()
	a.dataStore[key] = value

	// Optionally notify frontend of data change
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "data:changed", map[string]interface{}{
			"key":   key,
			"value": value,
		})
	}
}

// deleteData removes a value from the shared data store (internal use only)
func (a *App) deleteData(key string) {
	a.dataMutex.Lock()
	defer a.dataMutex.Unlock()
	delete(a.dataStore, key)

	// Optionally notify frontend of data removal
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "data:deleted", key)
	}
}

// getAllData returns a copy of all data in the store (internal use only)
func (a *App) getAllData() map[string]interface{} {
	a.dataMutex.RLock()
	defer a.dataMutex.RUnlock()

	// Create a copy to prevent external modifications
	dataCopy := make(map[string]interface{})
	for k, v := range a.dataStore {
		dataCopy[k] = v
	}
	return dataCopy
}

// Secure frontend-exposed data methods

// GetSafeData retrieves safe data for frontend access
func (a *App) GetSafeData(key string) interface{} {
	// Only allow specific safe keys
	safeKeys := map[string]bool{
		"svn:lastStatus":     true,
		"svn:lastStatusTime": true,
		"app:version":        true,
		"app:theme":          true,
	}

	if !safeKeys[key] {
		return nil
	}

	return a.getData(key)
}

// SetSafeData stores safe data from frontend
func (a *App) SetSafeData(key string, value interface{}) {
	// Only allow specific safe keys that frontend can modify
	safeKeys := map[string]bool{
		"app:theme":     true,
		"app:language":  true,
		"user:settings": true,
	}

	if !safeKeys[key] {
		return
	}

	a.setData(key, value)
}

// notifyFrontend sends an event to the frontend through Wails runtime (internal use only)
func (a *App) notifyFrontend(eventName string, data interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, eventName, data)
	}
}

// performShutdown ensures shutdown only happens once
func (a *App) performShutdown() {
	a.shutdownOnce.Do(func() {
		log.Println("Performing application shutdown...")
		// Stop the WebSocket server
		if err := a.stopWebSocketServer(); err != nil {
			log.Printf("Error stopping WebSocket server: %v", err)
		}
		log.Println("Application shutdown complete")
	})
}

// shutdown is called when the app is being closed
func (a *App) shutdown(ctx context.Context) {
	// Flush the state store first
	if a.store != nil {
		_ = a.store.Flush()
		runtime.LogInfo(ctx, "App shutdown: state flushed")
	}

	// Then perform the regular shutdown
	a.performShutdown()
}

// Script Management Methods

// GetScripts returns all available scripts as JSON
func (a *App) GetScripts() (string, error) {
	if a.scriptManager == nil {
		return "[]", fmt.Errorf("script manager not initialized")
	}

	scripts, err := a.scriptManager.GetScripts()
	if err != nil {
		return "[]", err
	}

	jsonBytes, err := json.Marshal(scripts)
	if err != nil {
		return "[]", fmt.Errorf("failed to marshal scripts: %w", err)
	}

	return string(jsonBytes), nil
}

// GetScriptContent returns the content of a specific script
func (a *App) GetScriptContent(scriptPath string) (string, error) {
	if a.scriptManager == nil {
		return "", fmt.Errorf("script manager not initialized")
	}

	return a.scriptManager.GetScriptContent(scriptPath)
}

// GetScriptExecutionHistory returns the script execution history as JSON
func (a *App) GetScriptExecutionHistory() (string, error) {
	if a.scriptManager == nil {
		return "[]", fmt.Errorf("script manager not initialized")
	}

	return a.scriptManager.GetExecutionHistoryJSON()
}

// New Script Config Methods for Frontend

// GetScriptsConfig returns the full scripts configuration as JSON
func (a *App) GetScriptsConfig() (string, error) {
	jsonBytes, err := json.Marshal(a.scriptConfig)
	if err != nil {
		return "", fmt.Errorf("failed to marshal script config: %w", err)
	}
	return string(jsonBytes), nil
}

// SaveScriptsConfig saves the scripts configuration from JSON string
func (a *App) SaveScriptsConfig(jsonString string) error {
	var config ScriptConfig
	if err := json.Unmarshal([]byte(jsonString), &config); err != nil {
		return fmt.Errorf("failed to unmarshal script config: %w", err)
	}

	a.scriptConfig = config

	// Update script manager with new path
	if a.scriptManager != nil && config.Settings.ScriptsPath != "" {
		a.scriptManager.scriptsPath = config.Settings.ScriptsPath
	}

	return a.saveConfig(a.scriptConfigPath, &a.scriptConfig)
}

// GetAvailableScripts returns list of available scripts as JSON
func (a *App) GetAvailableScripts() (string, error) {
	return a.GetScripts()
}

// resolveBranchMetadata resolves branch metadata from the branch path
func (a *App) resolveBranchMetadata(branchPath string) (id string, branchFolder string, branchVersion string) {
	// Set default values
	id = ""
	branchFolder = ""
	branchVersion = ""

	// Find the branch by path
	for branchId, branch := range a.branchConfig.Branches {
		if branch.BranchPath == branchPath {
			id = branchId
			branchVersion = branch.BranchVersion

			// Find the folder containing this branch
			for folderName, folder := range a.branchConfig.Folders {
				for _, branchIdInFolder := range folder.BranchIds {
					if branchIdInFolder == branchId {
						branchFolder = folderName
						break
					}
				}
				if branchFolder != "" {
					break
				}
			}

			break
		}
	}

	return
}

// ExecuteScriptsDirectly executes scripts and emits events instead of WebSocket
func (a *App) ExecuteScriptsDirectly(scriptPaths []string, branchPaths []string) error {
	log.Printf("[ExecuteScriptsDirectly] Called with %d scripts and %d branches", len(scriptPaths), len(branchPaths))

	if a.scriptManager == nil {
		log.Printf("[ExecuteScriptsDirectly] Error: script manager not initialized")
		return fmt.Errorf("script manager not initialized")
	}

	if len(scriptPaths) == 0 || len(branchPaths) == 0 {
		log.Printf("[ExecuteScriptsDirectly] Error: no scripts or branches selected")
		return fmt.Errorf("no scripts or branches selected")
	}

	log.Printf("[ExecuteScriptsDirectly] Scripts: %v", scriptPaths)
	log.Printf("[ExecuteScriptsDirectly] Branches: %v", branchPaths)

	// Execute in a goroutine to not block UI
	go func() {
		log.Printf("[ExecuteScriptsDirectly] Starting goroutine execution")
		var results []ScriptExecutionResult
		var successCount int

		// Execute each script on each branch
		for _, scriptPath := range scriptPaths {
			scriptName := filepath.Base(scriptPath)
			log.Printf("[ExecuteScriptsDirectly] Processing script: %s", scriptName)

			for _, branchPath := range branchPaths {
				log.Printf("[ExecuteScriptsDirectly] Executing on branch: %s", branchPath)

				// Resolve branch metadata
				id, branchFolder, branchVersion := a.resolveBranchMetadata(branchPath)
				log.Printf("[ExecuteScriptsDirectly] Branch metadata - ID: %s, Folder: %s, Version: %s", id, branchFolder, branchVersion)

				// Emit execution start event
				log.Printf("[ExecuteScriptsDirectly] Emitting script:executing event")
				runtime.EventsEmit(a.ctx, "script:executing", map[string]string{
					"script": scriptName,
					"branch": branchPath,
				})

				// Define output callback for real-time streaming
				outputCallback := func(output string, isError bool) {
					runtime.EventsEmit(a.ctx, "script:output", map[string]interface{}{
						"script":  scriptName,
						"branch":  branchPath,
						"output":  output,
						"isError": isError,
					})
				}

				log.Printf("[ExecuteScriptsDirectly] Calling scriptManager.ExecuteScriptWithCallback")
				result, err := a.scriptManager.ExecuteScriptWithCallback(scriptPath, branchPath, id, branchFolder, branchVersion, outputCallback)
				if err != nil {
					log.Printf("[ExecuteScriptsDirectly] Script execution error: %v", err)
					result = &ScriptExecutionResult{
						ScriptName: scriptName,
						BranchPath: branchPath,
						Success:    false,
						Error:      err.Error(),
						StartTime:  time.Now().Format(time.RFC3339),
						EndTime:    time.Now().Format(time.RFC3339),
					}
				} else {
					log.Printf("[ExecuteScriptsDirectly] Script executed successfully")
				}

				if result.Success {
					successCount++
				}

				results = append(results, *result)

				// Emit execution result event
				log.Printf("[ExecuteScriptsDirectly] Emitting script:result event")
				runtime.EventsEmit(a.ctx, "script:result", result)
			}

			// Update execution history in ScriptConfig
			outputSample := ""
			if len(results) > 0 {
				outputSample = results[len(results)-1].Output
				if len(outputSample) > 200 {
					outputSample = outputSample[:200] + "..."
				}
			}

			execution := ScriptExecution{
				ScriptName:   scriptName,
				ExecutedAt:   time.Now().Format(time.RFC3339),
				BranchPaths:  branchPaths,
				Success:      successCount > 0,
				OutputSample: outputSample,
			}

			// Add to execution history
			a.scriptConfig.ExecutionHistory = append([]ScriptExecution{execution}, a.scriptConfig.ExecutionHistory...)

			// Trim to max history size
			if maxSize := a.scriptConfig.Settings.MaxHistorySize; maxSize > 0 && len(a.scriptConfig.ExecutionHistory) > maxSize {
				a.scriptConfig.ExecutionHistory = a.scriptConfig.ExecutionHistory[:maxSize]
			}
		}

		// Save updated config
		if err := a.saveConfig(a.scriptConfigPath, &a.scriptConfig); err != nil {
			log.Printf("[ExecuteScriptsDirectly] Failed to save script execution history: %v", err)
		}

		// Emit completion event
		log.Printf("[ExecuteScriptsDirectly] Emitting script:execution:complete event with %d results", len(results))
		runtime.EventsEmit(a.ctx, "script:execution:complete", results)
		log.Printf("[ExecuteScriptsDirectly] Goroutine execution completed")
	}()

	log.Printf("[ExecuteScriptsDirectly] Function returning (goroutine started)")
	return nil
}

// GetScriptContentDirect returns the content of a specific script
func (a *App) GetScriptContentDirect(scriptPath string) (string, error) {
	return a.GetScriptContent(scriptPath)
}

// Nudge forces a 1-pixel resize to trigger WebView2 viewport recalculation
// This fixes the 125% zoom issue after minimize/restore on Windows
func (a *App) Nudge() {
	w, h := runtime.WindowGetSize(a.ctx)
	runtime.WindowSetSize(a.ctx, w+1, h+1)
	runtime.WindowSetSize(a.ctx, w, h)
}

// ClearScriptHistory clears the script execution history
func (a *App) ClearScriptHistory() error {
	a.scriptConfig.ExecutionHistory = []ScriptExecution{}
	return a.saveConfig(a.scriptConfigPath, &a.scriptConfig)
}

// GetBranchSVNStatuses returns SVN status for multiple branches
func (a *App) GetBranchSVNStatuses(branchIds []string) (map[string]interface{}, error) {
	return a.getBranchSVNStatusesWithCacheBypass(branchIds, false)
}

// GetBranchSVNStatusesWithFreshCheck returns SVN status for multiple branches with cache bypass
func (a *App) GetBranchSVNStatusesWithFreshCheck(branchIds []string) (map[string]interface{}, error) {
	return a.getBranchSVNStatusesWithCacheBypass(branchIds, true)
}

// getBranchSVNStatusesWithCacheBypass internal method that handles cache bypass
func (a *App) getBranchSVNStatusesWithCacheBypass(branchIds []string, bypassCache bool) (map[string]interface{}, error) {
	results := make(map[string]interface{})
	resultsMutex := &sync.Mutex{}

	// Use a WaitGroup to wait for all goroutines to complete
	var wg sync.WaitGroup

	// Create a semaphore to limit concurrent SVN operations based on hardware
	// This prevents overwhelming the system while maximizing performance
	optimalConcurrency := calculateOptimalConcurrency()
	semaphore := make(chan struct{}, optimalConcurrency)

	for _, branchId := range branchIds {
		// Check if branch exists in config
		branch, exists := a.branchConfig.Branches[branchId]
		if !exists {
			results[branchId] = map[string]interface{}{
				"error": "Branch not found in config",
			}
			continue
		}

		if branch.BranchPath == "" {
			results[branchId] = map[string]interface{}{
				"error": "No path configured",
			}
			continue
		}

		wg.Add(1)
		go func(id string, path string) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Create a new SVN wrapper for this specific path
			svnWrapper := NewSVNWrapper(path)

			// Get the number of revisions behind (with optional cache bypass)
			var revisionsBehind int
			var err error
			if bypassCache {
				revisionsBehind, err = svnWrapper.GetRevisionsBehindWithBypass(true)
			} else {
				revisionsBehind, err = svnWrapper.GetRevisionsBehind()
			}

			// Store the result
			resultsMutex.Lock()
			defer resultsMutex.Unlock()

			if err != nil {
				if err.Error() == "not an SVN working copy" {
					fmt.Printf("SVN Error for branch %s (path: %s): %s\n", id, path, err.Error())
					results[id] = map[string]interface{}{
						"error": "No SVN",
					}
				} else if err.Error() == "disconnected" {
					fmt.Printf("SVN Disconnected for branch %s (path: %s): %s\n", id, path, err.Error())
					results[id] = map[string]interface{}{
						"error": "Disconnected",
					}
				} else {
					// For other errors, return the error message and log it
					fmt.Printf("SVN Error for branch %s (path: %s): %s\n", id, path, err.Error())
					results[id] = map[string]interface{}{
						"error": err.Error(),
					}
				}
			} else {
				results[id] = map[string]interface{}{
					"revisionsBehind": revisionsBehind,
				}
			}
		}(branchId, branch.BranchPath)
	}

	// Wait for all goroutines to complete
	wg.Wait()

	return results, nil
}

// ========== LOG CACHE HELPER METHODS ==========

// getRepositoryURLForPath gets the full working copy URL for a given working copy path
func (a *App) getRepositoryURLForPath(path string) (string, error) {
	// Create SVN wrapper for this path
	svnWrapper := NewSVNWrapper(path)

	// Get the full working copy URL instead of just the repository root
	return svnWrapper.getWorkingCopyURL()
}

// mergeLogEntries merges cached and fresh log entries, removing duplicates and applying limit
func (a *App) mergeLogEntries(cachedEntries, freshEntries []SVNLogEntry, limit int) string {
	// Create a map to track unique entries by revision
	entryMap := make(map[string]SVNLogEntry)

	// Add cached entries
	for _, entry := range cachedEntries {
		entryMap[entry.Revision] = entry
	}

	// Add fresh entries (will overwrite cached if same revision)
	for _, entry := range freshEntries {
		entryMap[entry.Revision] = entry
	}

	// Convert back to slice
	var allEntries []SVNLogEntry
	for _, entry := range entryMap {
		allEntries = append(allEntries, entry)
	}

	// Sort by revision (descending - newest first)
	sort.Slice(allEntries, func(i, j int) bool {
		revI, errI := strconv.Atoi(allEntries[i].Revision)
		revJ, errJ := strconv.Atoi(allEntries[j].Revision)
		if errI != nil || errJ != nil {
			// Fallback to string comparison
			return allEntries[i].Revision > allEntries[j].Revision
		}
		return revI > revJ
	})

	// Apply limit if specified
	if limit > 0 && len(allEntries) > limit {
		allEntries = allEntries[:limit]
	}

	// Create merged result
	mergedLog := SVNLog{
		XMLName:  xml.Name{Local: "log"},
		LogEntry: allEntries,
	}

	// Convert to JSON
	jsonData, err := json.MarshalIndent(mergedLog, "", "  ")
	if err != nil {
		log.Printf("Error marshaling merged log entries: %v", err)
		return "{\"LogEntry\":[]}"
	}

	return string(jsonData)
}

// filterEntriesForPath filters log entries that are relevant to a specific path
func (a *App) filterEntriesForPath(entries []SVNLogEntry, path string) []SVNLogEntry {
	// For now, return all entries. In the future, we could filter based on
	// the changed paths in each log entry to be more precise
	// This would require analyzing entry.Paths.Path array
	return entries
}

// countNewEntries counts how many entries from newEntries are not already in cachedEntries
func (a *App) countNewEntries(cachedEntries, newEntries []SVNLogEntry) int {
	// Create a map of cached revision numbers for fast lookup
	cachedRevisions := make(map[string]bool)
	for _, entry := range cachedEntries {
		cachedRevisions[entry.Revision] = true
	}

	// Count entries that are not already cached
	newCount := 0
	for _, entry := range newEntries {
		if !cachedRevisions[entry.Revision] {
			newCount++
		}
	}

	return newCount
}

// Cache management methods exposed to frontend

// GetLogCacheStats returns cache statistics for the UI
func (a *App) GetLogCacheStats() (map[string]interface{}, error) {
	return a.logCacheManager.GetCacheStats()
}

// InvalidateLogCacheForPath clears cache for a specific path
func (a *App) InvalidateLogCacheForPath(path string) error {
	repoURL, err := a.getRepositoryURLForPath(path)
	if err != nil {
		return fmt.Errorf("failed to get repository URL for path %s: %w", path, err)
	}

	return a.logCacheManager.InvalidateLogCache(repoURL)
}

// ClearAllLogCache clears all cached log data
func (a *App) ClearAllLogCache() error {
	return a.logCacheManager.ClearAllCache()
}

// SVN operations implementation for DataProvider interface
