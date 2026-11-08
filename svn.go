package main

import (
	"bytes"
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

// createSVNCommand creates an SVN command with console window hidden on Windows
func createSVNCommand(args ...string) *exec.Cmd {
	cmd := exec.Command("svn", args...)
	// Hide console window on Windows
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: CREATE_NO_WINDOW,
		}
	}
	return cmd
}

// createSVNCommandContext creates an SVN command with context and console window hidden on Windows
func createSVNCommandContext(ctx context.Context, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, "svn", args...)
	// Hide console window on Windows
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: CREATE_NO_WINDOW,
		}
	}
	return cmd
}

// SVN XML response structures
type SVNStatus struct {
	XMLName xml.Name    `xml:"status"`
	Target  []SVNTarget `xml:"target"`
}

type SVNTarget struct {
	Path  string     `xml:"path,attr"`
	Entry []SVNEntry `xml:"entry"`
}

type SVNEntry struct {
	Path        string         `xml:"path,attr"`
	WCStatus    SVNWCStatus    `xml:"wc-status"`
	ReposStatus SVNReposStatus `xml:"repos-status,omitempty"`
	// Custom field for file modification time (not from SVN XML, added by our code)
	FileModTime string `xml:"-" json:"fileModTime,omitempty"`
}

type SVNWCStatus struct {
	Item     string `xml:"item,attr"`
	Props    string `xml:"props,attr,omitempty"`
	Revision string `xml:"revision,attr,omitempty"`
	Date     string `xml:"date,attr,omitempty"`
}

type SVNReposStatus struct {
	Item  string `xml:"item,attr"`
	Props string `xml:"props,attr,omitempty"`
}

type SVNLog struct {
	XMLName  xml.Name      `xml:"log"`
	LogEntry []SVNLogEntry `xml:"logentry"`
}

type SVNLogEntry struct {
	Revision string   `xml:"revision,attr"`
	Author   string   `xml:"author"`
	Date     string   `xml:"date"`
	Message  string   `xml:"msg"`
	Paths    SVNPaths `xml:"paths"`
}

type SVNPaths struct {
	Path []SVNPath `xml:"path"`
}

type SVNPath struct {
	Action   string `xml:"action,attr"`
	Kind     string `xml:"kind,attr,omitempty"`
	PropMods string `xml:"prop-mods,attr,omitempty"`
	TextMods string `xml:"text-mods,attr,omitempty"`
	Value    string `xml:",chardata"`
}

type SVNInfo struct {
	XMLName xml.Name       `xml:"info"`
	Entry   []SVNInfoEntry `xml:"entry"`
}

type SVNInfoEntry struct {
	Path        string        `xml:"path,attr"`
	Kind        string        `xml:"kind,attr"`
	Revision    string        `xml:"revision,attr"`
	URL         string        `xml:"url"`
	RelativeURL string        `xml:"relative-url"`
	Repository  SVNRepository `xml:"repository"`
	WCInfo      SVNWCInfo     `xml:"wc-info"`
	Commit      SVNCommit     `xml:"commit"`
}

type SVNRepository struct {
	Root string `xml:"root"`
	UUID string `xml:"uuid"`
}

type SVNWCInfo struct {
	WCRootAbspath string `xml:"wcroot-abspath"`
	Schedule      string `xml:"schedule"`
	Depth         string `xml:"depth"`
}

type SVNCommit struct {
	Revision string `xml:"revision,attr"`
	Author   string `xml:"author"`
	Date     string `xml:"date"`
}

// Cache structures for performance optimization
type CacheEntry struct {
	Result    interface{}
	Timestamp time.Time
	TTL       time.Duration
}

type SVNCache struct {
	entries map[string]*CacheEntry
	mutex   sync.RWMutex
}

// Connection pool for SVN operations
type SVNConnectionPool struct {
	semaphore    chan struct{}
	maxConn      int
	currentConns int
	mutex        sync.Mutex
}

// Debouncer for preventing overlapping operations
type Debouncer struct {
	operations map[string]*time.Timer
	mutex      sync.RWMutex
}

type SVNList struct {
	XMLName xml.Name       `xml:"lists"`
	List    []SVNListEntry `xml:"list"`
}

type SVNListEntry struct {
	Path  string        `xml:"path,attr"`
	Entry []SVNListItem `xml:"entry"`
}

type SVNListItem struct {
	Kind   string    `xml:"kind,attr"`
	Name   string    `xml:"name"`
	Size   string    `xml:"size,omitempty"`
	Commit SVNCommit `xml:"commit"`
}

// Log cache structures for disk-based caching
type LogCache struct {
	CacheVersion string                       `json:"cacheVersion"`
	LastUpdated  time.Time                    `json:"lastUpdated"`
	Repositories map[string]*CachedRepository `json:"repositories"`
}

type CachedRepository struct {
	LastCachedRevision int           `json:"lastCachedRevision"`
	LastUpdated        time.Time     `json:"lastUpdated"`
	Entries            []SVNLogEntry `json:"entries"`
	RepositoryURL      string        `json:"repositoryURL"`
}

// Log cache manager
type LogCacheManager struct {
	cachePath string
	mutex     sync.RWMutex
}

// NewLogCacheManager creates a new LogCacheManager instance
func NewLogCacheManager(cachePath string) *LogCacheManager {
	return &LogCacheManager{
		cachePath: cachePath,
	}
}

// Global instances for performance optimization
var (
	globalSVNCache      *SVNCache
	globalConnPool      *SVNConnectionPool
	globalDebouncer     *Debouncer
	globalLogCache      *LogCacheManager
	globalCacheInitOnce sync.Once
)

// Initialize global performance components
func initGlobalSVNComponents() {
	globalCacheInitOnce.Do(func() {
		// Calculate optimal concurrency based on hardware
		optimalConcurrency := calculateOptimalSVNConcurrency()

		globalSVNCache = &SVNCache{
			entries: make(map[string]*CacheEntry),
		}
		// Start background cleanup routine for memory management
		globalSVNCache.StartCleanupRoutine()
		globalConnPool = &SVNConnectionPool{
			semaphore: make(chan struct{}, optimalConcurrency),
			maxConn:   optimalConcurrency,
		}
		globalDebouncer = &Debouncer{
			operations: make(map[string]*time.Timer),
		}
		globalLogCache = &LogCacheManager{
			cachePath: filepath.Join(`C:\`, "Titan", "cache", "Titan.logs.json"),
		}
		// Ensure cache directory exists
		if err := os.MkdirAll(filepath.Dir(globalLogCache.cachePath), 0755); err != nil {
			log.Printf("Warning: Failed to create cache directory: %v", err)
		}
	})
}

// calculateOptimalSVNConcurrency determines the best concurrency level for SVN operations
func calculateOptimalSVNConcurrency() int {
	numCPU := runtime.NumCPU()

	// Base calculation: 3-4 operations per CPU core for I/O bound SVN operations
	baseConcurrency := numCPU * 3

	// Set reasonable bounds
	minConcurrency := 8  // Minimum for responsiveness
	maxConcurrency := 50 // Maximum to prevent system overload

	// Adjust based on available memory
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	// Available memory in MB
	availableMemMB := int(memStats.Sys / 1024 / 1024)

	// Each concurrent SVN operation uses roughly 15-25MB
	memoryLimitedConcurrency := availableMemMB / 20

	// Use the more conservative limit
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

	return optimalConcurrency
}

// SVN wrapper struct with performance enhancements
type SVNWrapper struct {
	workingDir string
	cache      *SVNCache
	connPool   *SVNConnectionPool
	debouncer  *Debouncer
}

// Create new SVN wrapper with performance optimizations
func NewSVNWrapper(workingDir string) *SVNWrapper {
	initGlobalSVNComponents()
	return &SVNWrapper{
		workingDir: workingDir,
		cache:      globalSVNCache,
		connPool:   globalConnPool,
		debouncer:  globalDebouncer,
	}
}

// Cache methods for performance optimization
func (c *SVNCache) Get(key string) (interface{}, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	entry, exists := c.entries[key]
	if !exists {
		return nil, false
	}

	// Check if entry has expired
	if time.Since(entry.Timestamp) > entry.TTL {
		// Clean up expired entry in background
		go func() {
			c.mutex.Lock()
			delete(c.entries, key)
			c.mutex.Unlock()
		}()
		return nil, false
	}

	return entry.Result, true
}

func (c *SVNCache) Set(key string, value interface{}, ttl time.Duration) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.entries[key] = &CacheEntry{
		Result:    value,
		Timestamp: time.Now(),
		TTL:       ttl,
	}
}

func (c *SVNCache) Delete(key string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	delete(c.entries, key)
}

// ClearByPrefix removes all cache entries that start with the given prefix
func (c *SVNCache) ClearByPrefix(prefix string) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	keysToDelete := make([]string, 0)
	for key := range c.entries {
		if strings.HasPrefix(key, prefix) {
			keysToDelete = append(keysToDelete, key)
		}
	}

	for _, key := range keysToDelete {
		delete(c.entries, key)
	}
}

// Background cleanup for expired entries and memory management
func (c *SVNCache) StartCleanupRoutine() {
	go func() {
		ticker := time.NewTicker(60 * time.Second) // Clean up every minute
		defer ticker.Stop()

		for range ticker.C {
			c.cleanupExpiredEntries()
		}
	}()
}

func (c *SVNCache) cleanupExpiredEntries() {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	now := time.Now()
	expiredKeys := make([]string, 0)

	// Find expired entries
	for key, entry := range c.entries {
		if now.Sub(entry.Timestamp) > entry.TTL {
			expiredKeys = append(expiredKeys, key)
		}
	}

	// Remove expired entries
	for _, key := range expiredKeys {
		delete(c.entries, key)
	}

	// Memory pressure management: if cache is too large, remove oldest entries
	maxCacheSize := 1000 // Maximum number of cache entries
	if len(c.entries) > maxCacheSize {
		// Convert to slice for sorting by timestamp
		type cacheItem struct {
			key       string
			timestamp time.Time
		}

		items := make([]cacheItem, 0, len(c.entries))
		for key, entry := range c.entries {
			items = append(items, cacheItem{key: key, timestamp: entry.Timestamp})
		}

		// Sort by timestamp (oldest first)
		for i := 0; i < len(items)-1; i++ {
			for j := i + 1; j < len(items); j++ {
				if items[i].timestamp.After(items[j].timestamp) {
					items[i], items[j] = items[j], items[i]
				}
			}
		}

		// Remove oldest entries to get back to reasonable size
		targetSize := maxCacheSize - 100 // Remove extra to reduce frequency of cleanup
		for i := 0; i < len(items)-targetSize; i++ {
			delete(c.entries, items[i].key)
		}
	}
}

// Connection pool methods
func (p *SVNConnectionPool) Acquire(ctx context.Context) error {
	select {
	case p.semaphore <- struct{}{}:
		p.mutex.Lock()
		p.currentConns++
		p.mutex.Unlock()
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (p *SVNConnectionPool) Release() {
	select {
	case <-p.semaphore:
		p.mutex.Lock()
		if p.currentConns > 0 {
			p.currentConns--
		}
		p.mutex.Unlock()
	default:
		// Should not happen, but prevents deadlock
	}
}

// Debouncer methods
func (d *Debouncer) Debounce(key string, delay time.Duration, fn func()) {
	d.mutex.Lock()
	defer d.mutex.Unlock()

	// Cancel existing timer if present
	if timer, exists := d.operations[key]; exists {
		timer.Stop()
	}

	// Create new timer
	d.operations[key] = time.AfterFunc(delay, func() {
		// Remove from map when executing
		d.mutex.Lock()
		delete(d.operations, key)
		d.mutex.Unlock()
		fn()
	})
}

// Execute SVN command and return XML output
func (s *SVNWrapper) executeCommand(args ...string) ([]byte, error) {
	// Add --xml flag for XML output
	args = append(args, "--xml")

	// If no explicit path is provided in the arguments, add the working directory
	// This ensures SVN operates on the correct path without changing directories
	hasPath := false
	for _, arg := range args {
		if !strings.HasPrefix(arg, "-") && arg != "status" && arg != "log" && arg != "info" && arg != "list" && arg != "update" {
			hasPath = true
			break
		}
	}
	if !hasPath && s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	}

	cmd := createSVNCommand(args...)
	// Don't change the working directory - use absolute paths instead

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("svn command failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return nil, fmt.Errorf("svn command failed: %s", err.Error())
	}

	return output, nil
}

// Convert XML to JSON
func xmlToJSON(xmlData []byte, v interface{}) ([]byte, error) {
	err := xml.Unmarshal(xmlData, v)
	if err != nil {
		return nil, fmt.Errorf("failed to parse XML: %s", err.Error())
	}

	jsonData, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to convert to JSON: %s", err.Error())
	}

	return jsonData, nil
}

// SVN Status
func (s *SVNWrapper) Status(paths ...string) ([]byte, error) {
	args := []string{"status"}
	args = append(args, paths...)

	xmlData, err := s.executeCommand(args...)
	if err != nil {
		return nil, err
	}

	var status SVNStatus
	return xmlToJSON(xmlData, &status)
}

// SVN Log
func (s *SVNWrapper) Log(limit int, author string, isVerbose bool, paths ...string) ([]byte, error) {
	args := []string{"log", "--xml"}

	// Add author search if provided
	if author != "" {
		args = append(args, "--search", author)
	}

	// Add limit only if provided (> 0)
	if limit > 0 {
		args = append(args, "--limit", fmt.Sprintf("%d", limit))
	}

	// Add stop-on-copy to avoid crossing branch boundaries
	args = append(args, "--stop-on-copy")

	// Add verbose flag if requested
	if isVerbose {
		args = append(args, "-v")
	}

	args = append(args, paths...)

	xmlData, err := s.executeCommand(args...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute svn log: %w", err)
	}

	var svnLog SVNLog
	err = xml.Unmarshal(xmlData, &svnLog)
	if err != nil {
		return nil, fmt.Errorf("failed to parse SVN log XML: %w", err)
	}

	jsonData, err := json.MarshalIndent(svnLog, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to convert SVN log to JSON: %w", err)
	}

	return jsonData, nil
}

// LogSinceRevision fetches SVN log entries since a specific revision
func (s *SVNWrapper) LogSinceRevision(path string, startRevision int, author string, isVerbose bool) ([]byte, error) {
	args := []string{"log", "--xml"}

	// Add author search if provided
	if author != "" {
		args = append(args, "--search", author)
	}

	// Add revision range: startRevision to HEAD
	args = append(args, "-r", fmt.Sprintf("%d:HEAD", startRevision))

	// Add stop-on-copy to avoid crossing branch boundaries
	args = append(args, "--stop-on-copy")

	// Add verbose flag if requested
	if isVerbose {
		args = append(args, "-v")
	}

	args = append(args, path)

	xmlData, err := s.executeCommand(args...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute svn log since revision %d: %w", startRevision, err)
	}

	var svnLog SVNLog
	err = xml.Unmarshal(xmlData, &svnLog)
	if err != nil {
		return nil, fmt.Errorf("failed to parse SVN log XML: %w", err)
	}

	jsonData, err := json.MarshalIndent(svnLog, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to convert SVN log to JSON: %w", err)
	}

	return jsonData, nil
}

// LogMultiplePaths executes SVN log for multiple working copy paths in parallel
// This solves the SVN limitation: "When specifying working copy paths, only one target may be given"
func (s *SVNWrapper) LogMultiplePaths(limit int, author string, isVerbose bool, paths ...string) ([]byte, error) {
	if len(paths) == 0 {
		return nil, fmt.Errorf("no paths provided")
	}

	// If only one path, use the existing single-path method
	if len(paths) == 1 {
		return s.Log(limit, author, isVerbose, paths[0])
	}

	// Calculate optimal concurrency for SVN log operations
	maxConcurrency := calculateOptimalConcurrency()
	if maxConcurrency > len(paths) {
		maxConcurrency = len(paths)
	}

	// Channel for results
	type logResult struct {
		path   string
		result *SVNLog
		err    error
	}

	resultsChan := make(chan logResult, len(paths))
	semaphore := make(chan struct{}, maxConcurrency)

	// Start goroutines for each path
	var wg sync.WaitGroup
	for _, path := range paths {
		wg.Add(1)
		go func(p string) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Execute SVN log for this path
			jsonData, err := s.Log(limit, author, isVerbose, p)
			if err != nil {
				resultsChan <- logResult{path: p, result: nil, err: err}
				return
			}

			// Parse the JSON back to SVNLog struct for merging
			var svnLog SVNLog
			if err := json.Unmarshal(jsonData, &svnLog); err != nil {
				resultsChan <- logResult{path: p, result: nil, err: fmt.Errorf("failed to parse log result for %s: %w", p, err)}
				return
			}

			resultsChan <- logResult{path: p, result: &svnLog, err: nil}
		}(path)
	}

	// Wait for all goroutines and close the channel
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect results
	var allEntries []SVNLogEntry
	var errors []string
	successfulPaths := []string{}

	for result := range resultsChan {
		if result.err != nil {
			errors = append(errors, fmt.Sprintf("Failed to get log for %s: %v", result.path, result.err))
			log.Printf("SVN Log error for path %s: %v", result.path, result.err)
			continue
		}

		if result.result != nil {
			allEntries = append(allEntries, result.result.LogEntry...)
			successfulPaths = append(successfulPaths, result.path)
		}
	}

	// Log results summary
	if len(errors) > 0 {
		log.Printf("SVN Log completed with %d successes and %d errors. Successful paths: %v",
			len(successfulPaths), len(errors), successfulPaths)
	} else {
		log.Printf("SVN Log completed successfully for %d paths: %v", len(successfulPaths), successfulPaths)
	}

	// If no successful results but have errors, return the first error
	if len(allEntries) == 0 && len(errors) > 0 {
		return nil, fmt.Errorf("failed to get log from any branch: %s", strings.Join(errors, "; "))
	}

	// Sort all entries by date (newest first)
	sort.Slice(allEntries, func(i, j int) bool {
		// Parse dates for proper comparison
		dateI, errI := time.Parse(time.RFC3339, allEntries[i].Date)
		dateJ, errJ := time.Parse(time.RFC3339, allEntries[j].Date)

		// If parsing fails, fall back to string comparison
		if errI != nil || errJ != nil {
			return allEntries[i].Date > allEntries[j].Date
		}

		return dateI.After(dateJ)
	})

	// Apply limit after merging and sorting if specified
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
		return nil, fmt.Errorf("failed to convert merged SVN log to JSON: %w", err)
	}

	return jsonData, nil
}

// SVN Info
func (s *SVNWrapper) Info(paths ...string) ([]byte, error) {
	args := []string{"info"}
	args = append(args, paths...)

	xmlData, err := s.executeCommand(args...)
	if err != nil {
		return nil, err
	}

	var info SVNInfo
	return xmlToJSON(xmlData, &info)
}

// SVN List
func (s *SVNWrapper) List(paths ...string) ([]byte, error) {
	args := []string{"list"}
	args = append(args, "-v") // verbose to include commit info
	args = append(args, paths...)

	xmlData, err := s.executeCommand(args...)
	if err != nil {
		return nil, err
	}

	var list SVNList
	return xmlToJSON(xmlData, &list)
}

// getFileStatus returns the SVN status of a single file
func (s *SVNWrapper) getFileStatus(filePath string) (string, error) {
	args := []string{"status", "--xml", filePath}

	xmlData, err := s.executeCommand(args...)
	if err != nil {
		return "", fmt.Errorf("failed to get file status for %q: %w", filePath, err)
	}

	var status SVNStatus
	err = xml.Unmarshal(xmlData, &status)
	if err != nil {
		return "", fmt.Errorf("failed to parse status XML for %q: %w", filePath, err)
	}

	// Extract status from the XML structure
	if len(status.Target) > 0 && len(status.Target[0].Entry) > 0 {
		return status.Target[0].Entry[0].WCStatus.Item, nil
	}

	return "normal", nil
}

// isBinary checks if the file content contains binary data
func isBinary(data []byte) bool {
	// Simple binary detection - check for null bytes in first 8KB
	checkSize := len(data)
	if checkSize > 8192 {
		checkSize = 8192
	}

	for i := 0; i < checkSize; i++ {
		if data[i] == 0 {
			return true
		}
	}
	return false
}

// createUnversionedFileDiff creates a pseudo-diff for unversioned files showing all content as new
func (s *SVNWrapper) createUnversionedFileDiff(filePath string) (string, error) {
	// Validate the file path is within allowed directories (security check)
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return "", fmt.Errorf("invalid file path: %w", err)
	}

	// Ensure the path is within the working directory to prevent path traversal attacks
	workingAbsPath, err := filepath.Abs(s.workingDir)
	if err != nil {
		return "", fmt.Errorf("invalid working directory: %w", err)
	}

	if !strings.HasPrefix(absPath, workingAbsPath) {
		return "", fmt.Errorf("file path outside working directory")
	}

	// Check file size before reading to prevent memory issues
	fileInfo, err := os.Stat(absPath)
	if err != nil {
		return "", fmt.Errorf("failed to get file info: %w", err)
	}

	const maxFileSize = 50 * 1024 * 1024 // 50MB limit for diff view
	if fileInfo.Size() > maxFileSize {
		return "", fmt.Errorf("file too large for diff view: %d bytes (max: %d)", fileInfo.Size(), maxFileSize)
	}

	// Read the file content (using modern Go API)
	content, err := os.ReadFile(absPath)
	if err != nil {
		return "", fmt.Errorf("failed to read unversioned file: %w", err)
	}

	// Check if file is binary
	if isBinary(content) {
		return fmt.Sprintf("Binary file %s (not shown in diff)", filepath.Base(filePath)), nil
	}

	// Create a diff-like output showing the entire file as new content
	var diff strings.Builder

	// Add file headers similar to SVN diff format
	diff.WriteString(fmt.Sprintf("--- %s\t(nonexistent)\n", filepath.Base(filePath)))
	diff.WriteString(fmt.Sprintf("+++ %s\t(working copy)\n", filepath.Base(filePath)))

	// Split content into lines
	lines := strings.Split(string(content), "\n")

	// If file is empty, show empty file diff
	if len(lines) == 1 && lines[0] == "" {
		diff.WriteString("@@ -0,0 +1,0 @@\n")
		return diff.String(), nil
	}

	// Add hunk header
	diff.WriteString(fmt.Sprintf("@@ -0,0 +1,%d @@\n", len(lines)))

	// Add all lines as additions
	for _, line := range lines {
		// Handle the last empty line that split() creates
		if line == "" && lines[len(lines)-1] == line {
			continue
		}
		diff.WriteString(fmt.Sprintf("+%s\n", line))
	}

	// Add "No newline at end of file" if the file doesn't end with newline
	if len(content) > 0 && content[len(content)-1] != '\n' {
		diff.WriteString("\\ No newline at end of file\n")
	}

	return diff.String(), nil
}

// SVN Diff (returns plain text, not XML)
func (s *SVNWrapper) Diff(paths ...string) (string, error) {
	// Handle single file case with status checking for unversioned files
	if len(paths) == 1 {
		filePath := paths[0]

		// Check if file exists first
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			return "", fmt.Errorf("file does not exist: %s", filePath)
		}

		// Get the file status
		status, err := s.getFileStatus(filePath)
		if err != nil {
			// If we can't get status, fall back to normal diff behavior
			log.Printf("Warning: Could not get file status for %s, falling back to normal diff: %v", filePath, err)
		} else if status == "unversioned" {
			// Handle unversioned files by creating a pseudo-diff
			return s.createUnversionedFileDiff(filePath)
		}
	}

	// Normal SVN diff for versioned files or multiple files
	args := []string{"diff"}
	args = append(args, paths...)

	// If no paths provided, use working directory
	if len(paths) == 0 && s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	}

	// Remove --xml flag for diff
	cmd := createSVNCommand(args...)
	// Don't change directory - use absolute paths

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			// Check if it's an unversioned file error and try to handle it
			stderr := string(exitError.Stderr)
			if strings.Contains(stderr, "is not under version control") && len(paths) == 1 {
				// This is an unversioned file, create pseudo-diff
				return s.createUnversionedFileDiff(paths[0])
			}
			return "", fmt.Errorf("svn diff failed: %s, stderr: %s", err.Error(), stderr)
		}
		return "", fmt.Errorf("svn diff failed: %s", err.Error())
	}

	return string(output), nil
}

// SVN Cat - retrieves file contents at a specific revision
// Supports both local file paths and repository paths (starting with '/')
func (s *SVNWrapper) Cat(filePath string, revision string) (string, error) {
	// Default to BASE revision if not specified
	if revision == "" {
		revision = "BASE"
	}

	// Check if this is a repository path (starts with '/') or local path
	if strings.HasPrefix(filePath, "/") {
		// Repository path - construct full repository URL
		repositoryRoot, err := s.getRepositoryRootURL()
		if err != nil {
			return "", fmt.Errorf("failed to get repository root URL: %v", err)
		}

		// Construct full repository URL by combining root + path
		// Remove leading slash from path to avoid double slashes
		repositoryPath := strings.TrimPrefix(filePath, "/")
		fullRepositoryURL := repositoryRoot + "/" + repositoryPath

		// Execute svn cat with full repository URL
		args := []string{"cat", "-r", revision, fullRepositoryURL}
		cmd := createSVNCommand(args...)

		output, err := cmd.Output()
		if err != nil {
			if exitError, ok := err.(*exec.ExitError); ok {
				stderr := string(exitError.Stderr)
				// Handle case where file doesn't exist at specified revision
				if strings.Contains(stderr, "does not exist") || strings.Contains(stderr, "path not found") {
					return "", nil // File doesn't exist at this revision
				}
				return "", fmt.Errorf("svn cat failed for repository URL %s: %s, stderr: %s", fullRepositoryURL, err.Error(), stderr)
			}
			return "", fmt.Errorf("svn cat failed for repository URL %s: %s", fullRepositoryURL, err.Error())
		}

		return string(output), nil
	}

	// Local path - use existing logic with filesystem checks
	// Check if file exists first
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", fmt.Errorf("file does not exist: %s", filePath)
	}

	// Check if file is versioned
	status, err := s.getFileStatus(filePath)
	if err != nil {
		return "", fmt.Errorf("could not get file status for %s: %v", filePath, err)
	}

	// Handle unversioned files - return empty content for BASE
	if status == "unversioned" {
		if revision == "BASE" {
			return "", nil // No BASE version for unversioned files
		}
		// For WORKING revision of unversioned files, read file content
		if revision == "WORKING" {
			content, err := os.ReadFile(filePath)
			if err != nil {
				return "", fmt.Errorf("failed to read unversioned file %s: %v", filePath, err)
			}
			return string(content), nil
		}
		return "", fmt.Errorf("cannot get revision %s for unversioned file: %s", revision, filePath)
	}

	// Handle deleted files - they don't exist in WORKING but may exist in BASE
	if status == "deleted" && revision == "WORKING" {
		return "", nil // Deleted files have no WORKING content
	}

	// For versioned files, use svn cat
	args := []string{"cat", "-r", revision, filePath}
	cmd := createSVNCommand(args...)

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			stderr := string(exitError.Stderr)
			// Handle case where file doesn't exist at specified revision
			if strings.Contains(stderr, "does not exist") || strings.Contains(stderr, "path not found") {
				return "", nil // File doesn't exist at this revision
			}
			return "", fmt.Errorf("svn cat failed: %s, stderr: %s", err.Error(), stderr)
		}
		return "", fmt.Errorf("svn cat failed: %s", err.Error())
	}

	return string(output), nil
}

// getRepositoryRootURL retrieves the repository root URL from the working copy with caching
func (s *SVNWrapper) getRepositoryRootURL() (string, error) {
	// Create cache key based on working directory
	cacheKey := fmt.Sprintf("repo_root:%s", s.workingDir)

	// Check cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if rootURL, ok := cached.(string); ok {
			if rootURL == "" {
				// Cached negative result
				log.Printf("[SVN-CACHE] Repository root URL negative cache hit for: %s", s.workingDir)
				return "", fmt.Errorf("repository root URL not available (cached failure)")
			}
			log.Printf("[SVN-CACHE] Repository root URL cache hit for: %s", s.workingDir)
			return rootURL, nil
		}
	}

	log.Printf("[SVN-CACHE] Repository root URL cache miss for: %s", s.workingDir)

	// Cache miss - execute svn info
	args := []string{"info", "--xml"}

	// Use working directory if available
	if s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	} else {
		args = append(args, ".")
	}

	cmd := createSVNCommand(args...)

	output, err := cmd.Output()
	if err != nil {
		// Cache negative results for shorter duration to avoid repeated failures
		s.cache.Set(cacheKey, "", 30*time.Second)
		log.Printf("[SVN-CACHE] Cached negative result for repository root URL: %s", s.workingDir)
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("svn info failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return "", fmt.Errorf("svn info failed: %s", err.Error())
	}

	var svnInfo SVNInfo
	err = xml.Unmarshal(output, &svnInfo)
	if err != nil {
		return "", fmt.Errorf("failed to parse SVN info XML: %w", err)
	}

	if len(svnInfo.Entry) == 0 {
		return "", fmt.Errorf("no entries found in SVN info")
	}

	repositoryRoot := svnInfo.Entry[0].Repository.Root

	// Cache successful result for 5 minutes (repository root rarely changes)
	s.cache.Set(cacheKey, repositoryRoot, 5*time.Minute)
	log.Printf("[SVN-CACHE] Cached repository root URL for %s: %s", s.workingDir, repositoryRoot)

	return repositoryRoot, nil
}

// getWorkingCopyURL retrieves the full working copy URL from the working copy with caching
func (s *SVNWrapper) getWorkingCopyURL() (string, error) {
	// Create cache key based on working directory
	cacheKey := fmt.Sprintf("wc_url:%s", s.workingDir)

	// Check cache first
	if cached, found := s.cache.Get(cacheKey); found {
		if workingCopyURL, ok := cached.(string); ok {
			if workingCopyURL == "" {
				// Cached negative result
				log.Printf("[SVN-CACHE] Working copy URL negative cache hit for: %s", s.workingDir)
				return "", fmt.Errorf("working copy URL not available (cached failure)")
			}
			log.Printf("[SVN-CACHE] Working copy URL cache hit for: %s", s.workingDir)
			return workingCopyURL, nil
		}
	}

	log.Printf("[SVN-CACHE] Working copy URL cache miss for: %s", s.workingDir)

	// Cache miss - execute svn info
	args := []string{"info", "--xml"}

	// Use working directory if available
	if s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	} else {
		args = append(args, ".")
	}

	cmd := createSVNCommand(args...)

	output, err := cmd.Output()
	if err != nil {
		// Cache negative results for shorter duration to avoid repeated failures
		s.cache.Set(cacheKey, "", 30*time.Second)
		log.Printf("[SVN-CACHE] Cached negative result for working copy URL: %s", s.workingDir)
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("svn info failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return "", fmt.Errorf("svn info failed: %s", err.Error())
	}

	var svnInfo SVNInfo
	err = xml.Unmarshal(output, &svnInfo)
	if err != nil {
		return "", fmt.Errorf("failed to parse SVN info XML: %w", err)
	}

	if len(svnInfo.Entry) == 0 {
		return "", fmt.Errorf("no entries found in SVN info")
	}

	// Use the URL field instead of Repository.Root to get the full working copy URL
	workingCopyURL := svnInfo.Entry[0].URL

	// Cache successful result for 5 minutes (working copy URL rarely changes)
	s.cache.Set(cacheKey, workingCopyURL, 5*time.Minute)
	log.Printf("[SVN-CACHE] Cached working copy URL for %s: %s", s.workingDir, workingCopyURL)

	return workingCopyURL, nil
}

// GetFileContent retrieves file content for both old (BASE) and new (WORKING) versions
func (s *SVNWrapper) GetFileContent(filePath string) (oldContent string, newContent string, err error) {
	// Get BASE version (old content)
	oldContent, err = s.Cat(filePath, "BASE")
	if err != nil {
		// For unversioned files, this is expected
		oldContent = ""
	}

	// Get WORKING version (new content)
	status, statusErr := s.getFileStatus(filePath)
	if statusErr != nil {
		err = fmt.Errorf("could not get file status: %v", statusErr)
		return
	}

	if status == "deleted" {
		// Deleted files have no working content
		newContent = ""
	} else {
		// Read current file content
		content, readErr := os.ReadFile(filePath)
		if readErr != nil {
			err = fmt.Errorf("failed to read working file: %v", readErr)
			return
		}
		newContent = string(content)
	}

	return oldContent, newContent, nil
}

// GetFileContentAtRevision retrieves file content for a specific revision vs previous revision
func (s *SVNWrapper) GetFileContentAtRevision(filePath string, revision string) (oldContent string, newContent string, err error) {
	// Parse revision number for previous revision calculation
	revNum := 0
	if revision != "" && revision != "HEAD" {
		// Remove 'r' prefix if present and parse revision number
		revStr := strings.TrimPrefix(revision, "r")
		revNum, err = strconv.Atoi(revStr)
		if err != nil {
			return "", "", fmt.Errorf("invalid revision format: %s", revision)
		}
	}

	// Get content at current revision
	newContent, err = s.Cat(filePath, revision)
	if err != nil {
		return "", "", fmt.Errorf("failed to get content at revision %s: %v", revision, err)
	}

	// Calculate previous revision
	var prevRevision string
	if revNum > 1 {
		prevRevision = strconv.Itoa(revNum - 1)
	} else {
		// For revision 1 or HEAD, old content is empty (file didn't exist before)
		oldContent = ""
		return oldContent, newContent, nil
	}

	// Get content at previous revision
	oldContent, err = s.Cat(filePath, prevRevision)
	if err != nil {
		// File might not have existed in previous revision (new file)
		oldContent = ""
		err = nil // Don't treat this as an error
	}

	return oldContent, newContent, nil
}

// SVN Update
func (s *SVNWrapper) Update(paths ...string) ([]byte, error) {
	args := []string{"update", "--accept", "postpone"}
	args = append(args, paths...)

	// If no paths provided, use working directory
	if len(paths) == 0 && s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	}

	// Update doesn't support --xml, execute without it
	cmd := createSVNCommand(args...)
	// Don't change directory - use absolute paths

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("svn update failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return nil, fmt.Errorf("svn update failed: %s", err.Error())
	}

	// Create a simple JSON response with the update output
	result := map[string]interface{}{
		"output":  string(output),
		"success": true,
	}

	jsonData, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to convert update result to JSON: %s", err.Error())
	}

	return jsonData, nil
}

// SVN Commit
func (s *SVNWrapper) Commit(message string, paths ...string) (string, error) {
	args := []string{"commit", "-m", message}
	args = append(args, paths...)

	// If no paths provided, use working directory
	if len(paths) == 0 && s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	}

	// Commit doesn't support --xml, return plain text
	cmd := createSVNCommand(args...)
	// Don't change directory - use absolute paths

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("svn commit failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return "", fmt.Errorf("svn commit failed: %s", err.Error())
	}

	return string(output), nil
}

// SVN Add
func (s *SVNWrapper) Add(paths ...string) (string, error) {
	args := []string{"add"}
	args = append(args, paths...)

	// If no paths provided, use working directory
	if len(paths) == 0 && s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	}

	// Add doesn't support --xml, return plain text
	cmd := createSVNCommand(args...)
	// Don't change directory - use absolute paths

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("svn add failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return "", fmt.Errorf("svn add failed: %s", err.Error())
	}

	return string(output), nil
}

// Check if directory is SVN working copy
func (s *SVNWrapper) IsWorkingCopy() bool {
	// Try to run svn info to check if it's a working copy
	// This works for both root directories and subdirectories
	cmd := createSVNCommand("info", s.workingDir)
	err := cmd.Run()
	return err == nil
}

// GetRevisionsBehind returns the number of revisions the working copy is behind the repository
// Enhanced with caching, connection pooling, and exponential backoff
// Uses optimized svn info --show-item approach for better performance
func (s *SVNWrapper) GetRevisionsBehind() (int, error) {
	// Create cache key based on working directory
	cacheKey := fmt.Sprintf("revisions_behind:%s", s.workingDir)

	// Check cache first (TTL of 30 seconds for revision status)
	if cached, found := s.cache.Get(cacheKey); found {
		if result, ok := cached.(int); ok {
			return result, nil
		}
		// If cached value is an error, return it
		if err, ok := cached.(error); ok {
			return 0, err
		}
	}

	// Acquire connection from pool with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := s.connPool.Acquire(ctx); err != nil {
		// Cache the connection timeout error
		connErr := fmt.Errorf("connection pool timeout")
		s.cache.Set(cacheKey, connErr, 5*time.Second) // Shorter TTL for errors
		return 0, connErr
	}
	defer s.connPool.Release()

	// Execute optimized revision check with retry logic
	var revisionsBehind int
	var finalErr error

	for attempt := 0; attempt < 3; attempt++ {
		// Create fresh context for each attempt
		cmdCtx, cmdCancel := context.WithTimeout(context.Background(), 5*time.Second) // Faster timeout for simple commands
		defer cmdCancel()

		// Get working copy revision
		cmdWorking := createSVNCommandContext(cmdCtx, "info", "--show-item", "revision", s.workingDir)
		workingOutput, err := cmdWorking.Output()

		if err != nil {
			finalErr = s.handleSVNError(err, cmdCtx, "svn info")
			if finalErr.Error() == "disconnected" || finalErr.Error() == "not an SVN working copy" {
				s.cache.Set(cacheKey, finalErr, s.getErrorCacheTTL(finalErr))
				return 0, finalErr
			}
			// Continue with retry for other errors
		} else {
			// Parse working copy revision
			workingRevStr := strings.TrimSpace(string(workingOutput))
			var workingRev int
			if _, parseErr := fmt.Sscanf(workingRevStr, "%d", &workingRev); parseErr != nil {
				finalErr = fmt.Errorf("invalid working copy revision: %s", workingRevStr)
				break // Don't retry parse errors
			}

			// Get HEAD revision
			cmdHead := createSVNCommandContext(cmdCtx, "info", "--show-item", "revision", "-r", "HEAD", s.workingDir)
			headOutput, err := cmdHead.Output()

			if err != nil {
				finalErr = s.handleSVNError(err, cmdCtx, "svn info HEAD")
				if finalErr.Error() == "disconnected" {
					s.cache.Set(cacheKey, finalErr, 10*time.Second)
					return 0, finalErr
				}
				// Continue with retry for other errors
			} else {
				// Parse HEAD revision
				headRevStr := strings.TrimSpace(string(headOutput))
				var headRev int
				if _, parseErr := fmt.Sscanf(headRevStr, "%d", &headRev); parseErr != nil {
					finalErr = fmt.Errorf("invalid HEAD revision: %s", headRevStr)
					break // Don't retry parse errors
				}

				// Calculate revisions behind
				if workingRev < headRev {
					// Get the actual count of revisions using svn log
					// Use a separate context with same timeout for log command
					logCtx, logCancel := context.WithTimeout(context.Background(), 5*time.Second)
					defer logCancel()

					cmdLog := createSVNCommandContext(logCtx, "log", "-q", "--incremental",
						"-r", fmt.Sprintf("%d:%d", workingRev+1, headRev), s.workingDir)
					logOutput, err := cmdLog.Output()

					if err != nil {
						// Log the error for debugging
						log.Printf("SVN log failed for %s (rev %d:%d): %v", s.workingDir, workingRev+1, headRev, err)

						// DO NOT fall back to arithmetic - it's incorrect
						// Instead, return an error indicating we couldn't get accurate count
						finalErr = fmt.Errorf("unable to count revisions: %v", err)

						// Try a simpler approach: just check if there are ANY commits
						// This is faster and might succeed where full log fails
						checkCtx, checkCancel := context.WithTimeout(context.Background(), 2*time.Second)
						defer checkCancel()

						cmdCheck := createSVNCommandContext(checkCtx, "log", "-q", "--limit", "1",
							"-r", fmt.Sprintf("%d:%d", workingRev+1, headRev), s.workingDir)
						if checkOutput, checkErr := cmdCheck.Output(); checkErr == nil {
							// If we got output, there's at least one revision
							if len(strings.TrimSpace(string(checkOutput))) > 0 {
								// Return -1 to indicate "some revisions behind but count unknown"
								revisionsBehind = -1
							} else {
								revisionsBehind = 0
							}
							finalErr = nil
						} else {
							// If even the simple check fails, we really can't determine status
							break
						}
					} else {
						// Count lines that start with 'r' (revision lines)
						lines := strings.Split(string(logOutput), "\n")
						revisionCount := 0
						for _, line := range lines {
							trimmed := strings.TrimSpace(line)
							if strings.HasPrefix(trimmed, "r") && len(trimmed) > 1 {
								// Verify it's a revision line (e.g., "r12345 | author | date")
								if strings.Contains(trimmed, " | ") {
									revisionCount++
								}
							}
						}
						revisionsBehind = revisionCount
					}
				} else {
					revisionsBehind = 0
				}

				// Cache successful result for 30 seconds
				s.cache.Set(cacheKey, revisionsBehind, 30*time.Second)
				return revisionsBehind, nil
			}
		}

		// Exponential backoff before retry (except for last attempt)
		if attempt < 2 {
			backoffDuration := time.Duration(250*(1<<attempt)) * time.Millisecond // 250ms, 500ms
			select {
			case <-time.After(backoffDuration):
				continue
			case <-ctx.Done():
				// Main context cancelled, abort retries
				finalErr = ctx.Err()
				break
			}
		}
	}

	// Cache the final error for 5 seconds to prevent immediate retry storms
	s.cache.Set(cacheKey, finalErr, 5*time.Second)
	return 0, finalErr
}

// handleSVNError processes SVN command errors and returns appropriate error messages
func (s *SVNWrapper) handleSVNError(err error, ctx context.Context, command string) error {
	// Check for timeout error
	if ctx.Err() == context.DeadlineExceeded {
		return fmt.Errorf("disconnected")
	}

	if exitError, ok := err.(*exec.ExitError); ok {
		stderr := string(exitError.Stderr)
		// Check for common connection errors
		if strings.Contains(stderr, "Unable to connect") ||
			strings.Contains(stderr, "Could not connect") ||
			strings.Contains(stderr, "Connection refused") ||
			strings.Contains(stderr, "Host is unreachable") ||
			strings.Contains(stderr, "No route to host") {
			return fmt.Errorf("disconnected")
		}
		// Check if it's not an SVN working copy
		if strings.Contains(stderr, "is not a working copy") ||
			strings.Contains(stderr, "not a working copy") ||
			strings.Contains(stderr, "W155007") {
			return fmt.Errorf("not an SVN working copy")
		}
		return fmt.Errorf("%s failed: %s", command, stderr)
	}
	return fmt.Errorf("%s failed: %s", command, err.Error())
}

// getErrorCacheTTL returns appropriate cache TTL based on error type
func (s *SVNWrapper) getErrorCacheTTL(err error) time.Duration {
	switch err.Error() {
	case "not an SVN working copy":
		return 120 * time.Second // Longer TTL for persistent errors
	case "disconnected":
		return 10 * time.Second // Medium TTL for connection errors
	default:
		return 5 * time.Second // Short TTL for transient errors
	}
}

// ClearCacheForPath removes cache entries for a specific path
func (s *SVNWrapper) ClearCacheForPath(path string) {
	cacheKeyPrefix := fmt.Sprintf("revisions_behind:%s", path)
	s.cache.ClearByPrefix(cacheKeyPrefix)
}

// GetRevisionsBehindWithBypass returns the number of revisions behind with optional cache bypass
func (s *SVNWrapper) GetRevisionsBehindWithBypass(bypassCache bool) (int, error) {
	// If bypass cache is requested, clear the cache first
	if bypassCache {
		s.ClearCacheForPath(s.workingDir)
	}

	// Call the regular method which will now bypass cache
	return s.GetRevisionsBehind()
}

// Get SVN version
func GetSVNVersion() (string, error) {
	cmd := createSVNCommand("--version", "--quiet")
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get SVN version: %s", err.Error())
	}

	return strings.TrimSpace(string(output)), nil
}

// SVNStatusDetailed returns detailed SVN status including conflicts and remote changes
func (s *SVNWrapper) StatusDetailed(includeNormal bool, paths ...string) ([]byte, error) {
	// First try with remote status (-u flag)
	args := []string{"status", "--xml", "-u"} // --xml for XML output, -u shows remote status
	if includeNormal {
		args = append(args, "-v") // -v shows all files including normal status
	}
	args = append(args, paths...)

	xmlData, err := s.executeCommand(args...)
	if err != nil {
		// If remote status fails (network issues, etc.), try without -u flag
		argsLocal := []string{"status", "--xml"} // Only local status
		if includeNormal {
			argsLocal = append(argsLocal, "-v") // -v shows all files including normal status
		}
		argsLocal = append(argsLocal, paths...)

		xmlData, err = s.executeCommand(argsLocal...)
		if err != nil {
			return nil, fmt.Errorf("SVN status failed (both remote and local): %w", err)
		}
	}

	var status SVNStatus
	// First, parse the XML to get the status data
	err = xml.Unmarshal(xmlData, &status)
	if err != nil {
		log.Printf("[SVN-DEBUG] XML parsing failed: %v", err)
		return nil, fmt.Errorf("failed to parse SVN status XML: %w", err)
	}

	// Filter out unwanted files if includeNormal is false
	if !includeNormal {
		log.Printf("[SVN-DEBUG] Filtering out unwanted files from results")
		s.filterUnwantedFiles(&status)
	} else {
		log.Printf("[SVN-DEBUG] Including all files (includeNormal=true)")
	}

	// Enhance the status data with real file modification times
	err = s.addFileModificationTimes(&status)
	if err != nil {
		log.Printf("[SVN-DEBUG] Warning: Could not add file modification times: %v", err)
		// Continue with the data we have, don't fail the entire operation
	}

	// Convert to JSON
	jsonData, err := json.MarshalIndent(status, "", "  ")
	if err != nil {
		log.Printf("[SVN-DEBUG] JSON marshaling failed: %v", err)
		return nil, fmt.Errorf("failed to convert SVN status to JSON: %w", err)
	}

	log.Printf("[SVN-DEBUG] JSON data length: %d bytes", len(jsonData))

	// Parse JSON to count entries for debugging
	var debugStatus map[string]interface{}
	if err := json.Unmarshal(jsonData, &debugStatus); err == nil {
		if target, ok := debugStatus["target"].([]interface{}); ok {
			totalEntries := 0
			for _, t := range target {
				if targetMap, ok := t.(map[string]interface{}); ok {
					if entries, ok := targetMap["entry"].([]interface{}); ok {
						totalEntries += len(entries)
					}
				}
			}
			log.Printf("[SVN-DEBUG] Found %d file entries across %d targets", totalEntries, len(target))
		}
	}

	return jsonData, nil
}

// SVNRevert reverts changes to specified paths
func (s *SVNWrapper) Revert(paths ...string) (string, error) {
	args := []string{"revert", "-R"} // -R for recursive
	args = append(args, paths...)

	// If no paths provided, use working directory
	if len(paths) == 0 && s.workingDir != "" && s.workingDir != "." {
		args = append(args, s.workingDir)
	}

	// Revert doesn't support --xml, return plain text
	cmd := createSVNCommand(args...)

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("svn revert failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return "", fmt.Errorf("svn revert failed: %s", err.Error())
	}

	return string(output), nil
}

// SVNAddWithKeywords adds files to SVN with keywords property, using --parents and --auto-props
func (s *SVNWrapper) AddWithKeywords(paths ...string) (string, error) {
	if len(paths) == 0 {
		return "", fmt.Errorf("no paths provided")
	}

	// Sort paths to ensure directories are processed before their contents
	sortedPaths := s.sortPathsByDependency(paths)

	// Preprocess files to fix line ending issues
	normalizedFiles := []string{}
	preprocessErrors := []string{}

	for _, path := range sortedPaths {
		wasNormalized, err := s.preprocessFileForSVN(path)
		if err != nil {
			preprocessErrors = append(preprocessErrors, fmt.Sprintf("Warning: Failed to preprocess %s: %v", filepath.Base(path), err))
		} else if wasNormalized {
			normalizedFiles = append(normalizedFiles, filepath.Base(path))
		}
	}

	// First, add files with --parents and --auto-props
	// The --auto-props flag will apply properties from the SVN configuration
	addOutput, err := s.AddWithFlags(sortedPaths, "--parents", "--auto-props")
	if err != nil {
		// Check if the error is related to line endings and provide a helpful message
		if strings.Contains(err.Error(), "inconsistent newlines") || strings.Contains(err.Error(), "Inconsistent line ending") {
			return "", fmt.Errorf("line ending error (after normalization attempt): %w. This may require manual fixing of the file", err)
		}
		return "", err
	}

	// Get the list of files that were actually added (excluding directories)
	addedFiles := []string{}
	for _, path := range sortedPaths {
		// Check if it's a file (not a directory)
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			// Verify the file is now under version control by checking its status
			statusCmd := createSVNCommand("status", "--xml", path)
			statusOutput, statusErr := statusCmd.Output()
			if statusErr == nil && len(statusOutput) > 0 {
				// Parse to check if file is now added (status = "added")
				if strings.Contains(string(statusOutput), "item=\"added\"") {
					addedFiles = append(addedFiles, path)
				}
			}
		}
	}

	// Now set keywords property on successfully added files
	// This ensures we only set properties on files that are actually under version control
	keywordErrors := []string{}
	keywordSuccesses := 0

	for _, path := range addedFiles {
		// Set the keywords property
		cmd := createSVNCommand("propset", "svn:keywords", "Id Author Date Revision URL HeadURL", path)
		output, err := cmd.CombinedOutput()

		if err != nil {
			// Check if the error is because keywords were already set by auto-props
			if !strings.Contains(string(output), "already has") {
				keywordErrors = append(keywordErrors, fmt.Sprintf("Failed to set keywords for %s: %v (output: %s)", path, err, string(output)))
			}
		} else {
			keywordSuccesses++
		}
	}

	result := addOutput

	// Add information about preprocessed files
	if len(normalizedFiles) > 0 {
		result = result + fmt.Sprintf("\nNormalized line endings in %d files: %s", len(normalizedFiles), strings.Join(normalizedFiles, ", "))
	}
	if len(preprocessErrors) > 0 {
		result = result + "\n" + strings.Join(preprocessErrors, "\n")
	}

	if keywordSuccesses > 0 {
		result = result + fmt.Sprintf("\nSet keywords property on %d files", keywordSuccesses)
	}
	if len(keywordErrors) > 0 {
		result = result + "\nKeyword property warnings:\n" + strings.Join(keywordErrors, "\n")
	}

	return result, nil
}

// SVNDelete removes files from version control
func (s *SVNWrapper) Delete(paths ...string) (string, error) {
	args := []string{"delete"}
	args = append(args, paths...)

	// Delete doesn't support --xml, return plain text
	cmd := createSVNCommand(args...)

	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("svn delete failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return "", fmt.Errorf("svn delete failed: %s", err.Error())
	}

	return string(output), nil
}

// AddWithFlags adds files to SVN with custom flags
func (s *SVNWrapper) AddWithFlags(paths []string, flags ...string) (string, error) {
	args := []string{"add"}
	args = append(args, flags...)
	args = append(args, paths...)

	cmd := createSVNCommand(args...)
	output, err := cmd.Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("svn add with flags failed: %s, stderr: %s", err.Error(), string(exitError.Stderr))
		}
		return "", fmt.Errorf("svn add with flags failed: %s", err.Error())
	}
	return string(output), nil
}

// AddWithExplicitKeywords adds files to SVN and explicitly sets keywords without relying on auto-props
func (s *SVNWrapper) AddWithExplicitKeywords(paths ...string) (string, error) {
	if len(paths) == 0 {
		return "", fmt.Errorf("no paths provided")
	}

	// Sort paths to ensure directories are processed before their contents
	sortedPaths := s.sortPathsByDependency(paths)

	// Preprocess files to fix line ending issues
	normalizedFiles := []string{}
	preprocessErrors := []string{}

	for _, path := range sortedPaths {
		wasNormalized, err := s.preprocessFileForSVN(path)
		if err != nil {
			preprocessErrors = append(preprocessErrors, fmt.Sprintf("Warning: Failed to preprocess %s: %v", filepath.Base(path), err))
		} else if wasNormalized {
			normalizedFiles = append(normalizedFiles, filepath.Base(path))
		}
	}

	// Add with --parents but NOT --auto-props to have full control
	addOutput, err := s.AddWithFlags(sortedPaths, "--parents")
	if err != nil {
		// Check if the error is related to line endings and provide a helpful message
		if strings.Contains(err.Error(), "inconsistent newlines") || strings.Contains(err.Error(), "Inconsistent line ending") {
			return "", fmt.Errorf("line ending error (after normalization attempt): %w. This may require manual fixing of the file", err)
		}
		return "", err
	}

	// Immediately set keywords on all non-directory files
	keywordResults := []string{}
	for _, path := range sortedPaths {
		// Skip directories
		if info, err := os.Stat(path); err == nil && info.IsDir() {
			continue
		}

		// Set keywords property
		cmd := createSVNCommand("propset", "svn:keywords", "Id Author Date Revision URL HeadURL", path)
		if err := cmd.Run(); err == nil {
			keywordResults = append(keywordResults, fmt.Sprintf("Set keywords on: %s", filepath.Base(path)))
		}
	}

	result := addOutput

	// Add information about preprocessed files
	if len(normalizedFiles) > 0 {
		result = result + fmt.Sprintf("\nNormalized line endings in %d files: %s", len(normalizedFiles), strings.Join(normalizedFiles, ", "))
	}
	if len(preprocessErrors) > 0 {
		result = result + "\n" + strings.Join(preprocessErrors, "\n")
	}

	if len(keywordResults) > 0 {
		result = result + "\n" + strings.Join(keywordResults, "\n")
	}

	return result, nil
}

// sortPathsByDependency sorts paths so directories come before their contents
func (s *SVNWrapper) sortPathsByDependency(paths []string) []string {
	// Create a copy to avoid modifying the original slice
	sortedPaths := make([]string, len(paths))
	copy(sortedPaths, paths)

	// Sort by path depth (number of separators) and lexicographically
	// This ensures parent directories are processed before child files/directories
	sort.Slice(sortedPaths, func(i, j int) bool {
		pathI := filepath.Clean(sortedPaths[i])
		pathJ := filepath.Clean(sortedPaths[j])

		// Count path separators to determine depth
		depthI := len(strings.Split(pathI, string(filepath.Separator)))
		depthJ := len(strings.Split(pathJ, string(filepath.Separator)))

		// If depths are different, sort by depth (shallower first)
		if depthI != depthJ {
			return depthI < depthJ
		}

		// If same depth, sort lexicographically
		return pathI < pathJ
	})

	return sortedPaths
}

// StatusForPaths gets fresh SVN status for specific paths after operations
func (s *SVNWrapper) StatusForPaths(paths []string) ([]byte, error) {
	if len(paths) == 0 {
		return nil, fmt.Errorf("no paths provided")
	}

	// Use detailed status to get comprehensive information
	return s.StatusDetailed(false, paths...)
}

// LineEndingType represents different line ending types
type LineEndingType int

const (
	LineEndingUnknown LineEndingType = iota
	LineEndingLF                     // Unix/Linux (\n)
	LineEndingCRLF                   // Windows (\r\n)
	LineEndingCR                     // Old Mac (\r)
	LineEndingMixed                  // Mixed line endings
)

// detectLineEndings analyzes a file to determine its line ending type
func detectLineEndings(filePath string) (LineEndingType, error) {
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return LineEndingUnknown, err
	}

	// If file is empty or has no line breaks, it's not an issue
	if len(content) == 0 || (!bytes.Contains(content, []byte("\n")) && !bytes.Contains(content, []byte("\r"))) {
		return LineEndingLF, nil // Default to LF for empty files
	}

	hasCRLF := bytes.Contains(content, []byte("\r\n"))
	hasLF := bytes.Contains(content, []byte("\n"))
	hasCR := bytes.Contains(content, []byte("\r"))

	// Check for mixed line endings
	crlfCount := bytes.Count(content, []byte("\r\n"))
	lfCount := bytes.Count(content, []byte("\n"))
	crCount := bytes.Count(content, []byte("\r"))

	// Adjust counts to avoid double-counting CRLF
	pureLFCount := lfCount - crlfCount
	pureCRCount := crCount - crlfCount

	// If more than one type exists, it's mixed
	typeCount := 0
	if crlfCount > 0 {
		typeCount++
	}
	if pureLFCount > 0 {
		typeCount++
	}
	if pureCRCount > 0 {
		typeCount++
	}

	if typeCount > 1 {
		return LineEndingMixed, nil
	}

	// Determine single type
	if hasCRLF {
		return LineEndingCRLF, nil
	} else if hasLF {
		return LineEndingLF, nil
	} else if hasCR {
		return LineEndingCR, nil
	}

	return LineEndingUnknown, nil
}

// normalizeLineEndings fixes inconsistent line endings in a file
func normalizeLineEndings(filePath string, targetType LineEndingType) error {
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return err
	}

	// If file is empty, nothing to normalize
	if len(content) == 0 {
		return nil
	}

	var normalized []byte
	switch targetType {
	case LineEndingLF:
		// Convert all line endings to LF
		normalized = bytes.ReplaceAll(content, []byte("\r\n"), []byte("\n"))
		normalized = bytes.ReplaceAll(normalized, []byte("\r"), []byte("\n"))
	case LineEndingCRLF:
		// Convert all line endings to CRLF
		// First normalize to LF, then convert to CRLF
		temp := bytes.ReplaceAll(content, []byte("\r\n"), []byte("\n"))
		temp = bytes.ReplaceAll(temp, []byte("\r"), []byte("\n"))
		normalized = bytes.ReplaceAll(temp, []byte("\n"), []byte("\r\n"))
	case LineEndingCR:
		// Convert all line endings to CR (rarely used)
		normalized = bytes.ReplaceAll(content, []byte("\r\n"), []byte("\r"))
		normalized = bytes.ReplaceAll(normalized, []byte("\n"), []byte("\r"))
	default:
		return fmt.Errorf("unsupported target line ending type")
	}

	// Only write if content changed
	if !bytes.Equal(content, normalized) {
		return ioutil.WriteFile(filePath, normalized, 0644)
	}

	return nil
}

// getPreferredLineEndingType returns the preferred line ending type for the current OS
func getPreferredLineEndingType() LineEndingType {
	if runtime.GOOS == "windows" {
		return LineEndingCRLF
	}
	return LineEndingLF
}

// preprocessFileForSVN checks and normalizes file line endings before adding to SVN
func (s *SVNWrapper) preprocessFileForSVN(filePath string) (bool, error) {
	// Skip directories
	if info, err := os.Stat(filePath); err != nil {
		return false, err
	} else if info.IsDir() {
		return false, nil // Not a file, no preprocessing needed
	}

	// Skip binary files (basic check by extension)
	ext := strings.ToLower(filepath.Ext(filePath))
	binaryExtensions := []string{".exe", ".dll", ".so", ".dylib", ".bin", ".zip", ".tar", ".gz", ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".ico", ".bmp"}
	for _, binExt := range binaryExtensions {
		if ext == binExt {
			return false, nil // Skip binary files
		}
	}

	// Detect current line endings
	currentType, err := detectLineEndings(filePath)
	if err != nil {
		return false, fmt.Errorf("failed to detect line endings in %s: %w", filePath, err)
	}

	// If mixed line endings detected, normalize them
	if currentType == LineEndingMixed {
		preferredType := getPreferredLineEndingType()
		err = normalizeLineEndings(filePath, preferredType)
		if err != nil {
			return false, fmt.Errorf("failed to normalize line endings in %s: %w", filePath, err)
		}
		return true, nil // File was modified
	}

	return false, nil // File was not modified
}

// setEOLStyle sets the svn:eol-style property on files to handle line endings automatically
func (s *SVNWrapper) setEOLStyle(filePath string, eolStyle string) error {
	// Skip directories
	if info, err := os.Stat(filePath); err != nil {
		return err
	} else if info.IsDir() {
		return nil // Skip directories
	}

	// Set the svn:eol-style property
	cmd := createSVNCommand("propset", "svn:eol-style", eolStyle, filePath)
	return cmd.Run()
}

// setEOLStyleOnFiles sets svn:eol-style property on multiple files
func (s *SVNWrapper) setEOLStyleOnFiles(paths []string, eolStyle string) []string {
	results := []string{}
	for _, path := range paths {
		if err := s.setEOLStyle(path, eolStyle); err == nil {
			results = append(results, fmt.Sprintf("Set eol-style=%s on: %s", eolStyle, filepath.Base(path)))
		}
	}
	return results
}

// AddWithKeywordsAndEOL adds files to SVN with both keywords and eol-style properties
func (s *SVNWrapper) AddWithKeywordsAndEOL(paths ...string) (string, error) {
	if len(paths) == 0 {
		return "", fmt.Errorf("no paths provided")
	}

	// Sort paths to ensure directories are processed before their contents
	sortedPaths := s.sortPathsByDependency(paths)

	// Preprocess files to fix line ending issues
	normalizedFiles := []string{}
	preprocessErrors := []string{}

	for _, path := range sortedPaths {
		wasNormalized, err := s.preprocessFileForSVN(path)
		if err != nil {
			preprocessErrors = append(preprocessErrors, fmt.Sprintf("Warning: Failed to preprocess %s: %v", filepath.Base(path), err))
		} else if wasNormalized {
			normalizedFiles = append(normalizedFiles, filepath.Base(path))
		}
	}

	// Add files with --parents (don't use --auto-props to have full control)
	addOutput, err := s.AddWithFlags(sortedPaths, "--parents")
	if err != nil {
		// Check if the error is related to line endings and provide a helpful message
		if strings.Contains(err.Error(), "inconsistent newlines") || strings.Contains(err.Error(), "Inconsistent line ending") {
			return "", fmt.Errorf("line ending error (after normalization attempt): %w. This may require manual fixing of the file", err)
		}
		return "", err
	}

	// Get file paths (not directories) for property setting
	filePaths := []string{}
	for _, path := range sortedPaths {
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			filePaths = append(filePaths, path)
		}
	}

	// Set both keywords and eol-style properties
	keywordResults := []string{}
	eolStyleResults := []string{}
	errors := []string{}

	for _, path := range filePaths {
		// Set keywords property
		keywordCmd := createSVNCommand("propset", "svn:keywords", "Id Author Date Revision URL HeadURL", path)
		if err := keywordCmd.Run(); err == nil {
			keywordResults = append(keywordResults, filepath.Base(path))
		}

		// Set eol-style property to native (adapts to OS)
		eolCmd := createSVNCommand("propset", "svn:eol-style", "native", path)
		if err := eolCmd.Run(); err == nil {
			eolStyleResults = append(eolStyleResults, filepath.Base(path))
		} else {
			errors = append(errors, fmt.Sprintf("Failed to set eol-style on %s: %v", filepath.Base(path), err))
		}
	}

	// Build result message
	result := addOutput

	// Add information about preprocessed files
	if len(normalizedFiles) > 0 {
		result = result + fmt.Sprintf("\nNormalized line endings in %d files: %s", len(normalizedFiles), strings.Join(normalizedFiles, ", "))
	}
	if len(preprocessErrors) > 0 {
		result = result + "\n" + strings.Join(preprocessErrors, "\n")
	}

	if len(keywordResults) > 0 {
		result = result + fmt.Sprintf("\nSet keywords on %d files: %s", len(keywordResults), strings.Join(keywordResults, ", "))
	}
	if len(eolStyleResults) > 0 {
		result = result + fmt.Sprintf("\nSet eol-style=native on %d files: %s", len(eolStyleResults), strings.Join(eolStyleResults, ", "))
	}
	if len(errors) > 0 {
		result = result + "\nProperty warnings:\n" + strings.Join(errors, "\n")
	}

	return result, nil
}

// addFileModificationTimes enhances SVN status data with real file modification times
func (s *SVNWrapper) addFileModificationTimes(status *SVNStatus) error {
	if status == nil {
		return fmt.Errorf("status is nil")
	}

	for targetIdx := range status.Target {
		target := &status.Target[targetIdx]

		for entryIdx := range target.Entry {
			entry := &target.Entry[entryIdx]

			// Get file modification time from filesystem
			if entry.Path != "" {
				// Convert relative path to absolute if needed
				filePath := entry.Path
				if !filepath.IsAbs(filePath) {
					// If path is relative, make it relative to working directory
					if s.workingDir != "" && s.workingDir != "." {
						filePath = filepath.Join(s.workingDir, filePath)
					}
				}

				// Get file info to retrieve modification time
				if fileInfo, err := os.Stat(filePath); err == nil {
					// Format the modification time in a user-friendly format
					// Using RFC3339 format for consistency and parsing capability
					modTime := fileInfo.ModTime().Format(time.RFC3339)
					entry.FileModTime = modTime
				} else {
					// If we can't get file info, use a default message
					// This might happen for deleted files or files that don't exist on disk
					entry.FileModTime = "Unknown"
					log.Printf("[SVN-DEBUG] Could not get file modification time for %s: %v", filePath, err)
				}
			}
		}
	}

	return nil
}

// filterUnwantedFiles removes entries with "normal", "none", "external" or empty status from SVN status results
// This provides additional filtering to exclude files that shouldn't appear in commit interfaces
// Only files with meaningful changes (modified, added, deleted, unversioned, missing, or normal with property changes) are kept
func (s *SVNWrapper) filterUnwantedFiles(status *SVNStatus) {
	if status == nil {
		return
	}

	// Filter out normal files from each target
	for targetIdx := range status.Target {
		target := &status.Target[targetIdx]
		filteredEntries := make([]SVNEntry, 0, len(target.Entry))

		for _, entry := range target.Entry {
			var shouldKeep bool

			// Handle different statuses differently
			switch entry.WCStatus.Item {
			case "external":
				// Always filter external entries regardless of properties
				shouldKeep = false
			case "normal", "none", "":
				// For normal/none/empty entries, only keep if they have meaningful property changes
				// Be more strict: only keep if props are not empty, not "normal", not "none"
				hasPropertyChanges := entry.WCStatus.Props != "" &&
					entry.WCStatus.Props != "normal" &&
					entry.WCStatus.Props != "none"
				shouldKeep = hasPropertyChanges
			default:
				// Keep all other statuses (modified, added, deleted, unversioned, missing, etc.)
				shouldKeep = true
			}

			if shouldKeep {
				filteredEntries = append(filteredEntries, entry)
			}
		}

		target.Entry = filteredEntries
	}
}

// ========== LOG CACHE MANAGEMENT METHODS ==========

// LoadLogCache loads the log cache from disk
func (lcm *LogCacheManager) LoadLogCache() (*LogCache, error) {
	lcm.mutex.RLock()
	defer lcm.mutex.RUnlock()

	// Check if cache file exists
	if _, err := os.Stat(lcm.cachePath); os.IsNotExist(err) {
		// Return empty cache if file doesn't exist
		return &LogCache{
			CacheVersion: "1.0",
			LastUpdated:  time.Now(),
			Repositories: make(map[string]*CachedRepository),
		}, nil
	}

	// Read cache file
	data, err := ioutil.ReadFile(lcm.cachePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read cache file: %w", err)
	}

	// Parse JSON
	var cache LogCache
	if err := json.Unmarshal(data, &cache); err != nil {
		// If cache is corrupted, return empty cache
		log.Printf("Warning: Log cache corrupted, creating new cache: %v", err)
		return &LogCache{
			CacheVersion: "1.0",
			LastUpdated:  time.Now(),
			Repositories: make(map[string]*CachedRepository),
		}, nil
	}

	// Validate cache version
	if cache.CacheVersion != "1.0" {
		log.Printf("Warning: Cache version mismatch, creating new cache")
		return &LogCache{
			CacheVersion: "1.0",
			LastUpdated:  time.Now(),
			Repositories: make(map[string]*CachedRepository),
		}, nil
	}

	// Initialize repositories map if nil
	if cache.Repositories == nil {
		cache.Repositories = make(map[string]*CachedRepository)
	}

	return &cache, nil
}

// SaveLogCache saves the log cache to disk
func (lcm *LogCacheManager) SaveLogCache(cache *LogCache) error {
	lcm.mutex.Lock()
	defer lcm.mutex.Unlock()

	if cache == nil {
		return fmt.Errorf("cache cannot be nil")
	}

	// Update last updated time
	cache.LastUpdated = time.Now()

	// Marshal to JSON with indentation for readability
	data, err := json.MarshalIndent(cache, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal cache to JSON: %w", err)
	}

	// Write to temporary file first for atomic operation
	tempPath := lcm.cachePath + ".tmp"
	if err := ioutil.WriteFile(tempPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write temporary cache file: %w", err)
	}

	// Atomic rename
	if err := os.Rename(tempPath, lcm.cachePath); err != nil {
		// Clean up temp file on failure
		os.Remove(tempPath)
		return fmt.Errorf("failed to rename cache file: %w", err)
	}

	return nil
}

// GetCachedLogs retrieves cached log entries for a repository
func (lcm *LogCacheManager) GetCachedLogs(repoURL string) ([]SVNLogEntry, int, error) {
	cache, err := lcm.LoadLogCache()
	if err != nil {
		return nil, 0, err
	}

	repo, exists := cache.Repositories[repoURL]
	if !exists {
		// No cache for this repository
		return []SVNLogEntry{}, 0, nil
	}

	// Validate that cached repository URL matches current repository URL
	// This replaces time-based expiration with intelligent URL-based validation
	if repo.RepositoryURL != repoURL {
		log.Printf("Repository URL changed for cache key %s: cached=%s, current=%s - invalidating cache", 
			repoURL, repo.RepositoryURL, repoURL)
		return []SVNLogEntry{}, 0, nil
	}

	// URL matches - return cached data (no time expiration)
	log.Printf("Using cached log entries for %s (last updated: %v, %d entries)", 
		repoURL, repo.LastUpdated.Format("2006-01-02 15:04:05"), len(repo.Entries))
	return repo.Entries, repo.LastCachedRevision, nil
}

// UpdateLogCache updates the cache with new log entries
func (lcm *LogCacheManager) UpdateLogCache(repoURL string, newEntries []SVNLogEntry) error {
	cache, err := lcm.LoadLogCache()
	if err != nil {
		return err
	}

	repo, exists := cache.Repositories[repoURL]
	if !exists {
		repo = &CachedRepository{
			RepositoryURL: repoURL,
			Entries:       []SVNLogEntry{},
		}
		cache.Repositories[repoURL] = repo
	}

	// Update repository data
	repo.LastUpdated = time.Now()
	repo.RepositoryURL = repoURL // Always ensure URL is current

	// Merge new entries with existing ones
	existingMap := make(map[string]SVNLogEntry)
	for _, entry := range repo.Entries {
		existingMap[entry.Revision] = entry
	}

	// Add new entries that don't exist
	for _, newEntry := range newEntries {
		if _, exists := existingMap[newEntry.Revision]; !exists {
			repo.Entries = append(repo.Entries, newEntry)
		}
	}

	// Sort entries by revision (descending for newest first)
	sort.Slice(repo.Entries, func(i, j int) bool {
		revI, errI := strconv.Atoi(repo.Entries[i].Revision)
		revJ, errJ := strconv.Atoi(repo.Entries[j].Revision)
		if errI != nil || errJ != nil {
			// Fallback to string comparison if not numeric
			return repo.Entries[i].Revision > repo.Entries[j].Revision
		}
		return revI > revJ
	})

	// Update last cached revision (highest revision)
	if len(repo.Entries) > 0 {
		if highestRev, err := strconv.Atoi(repo.Entries[0].Revision); err == nil {
			repo.LastCachedRevision = highestRev
		}
	}

	// Limit cache size to prevent excessive memory usage (keep latest 10,000 entries)
	const maxCacheSize = 10000
	if len(repo.Entries) > maxCacheSize {
		repo.Entries = repo.Entries[:maxCacheSize]
		log.Printf("Cache size limited to %d entries for repository %s", maxCacheSize, repoURL)
	}

	return lcm.SaveLogCache(cache)
}

// InvalidateLogCache clears the cache for a specific repository
func (lcm *LogCacheManager) InvalidateLogCache(repoURL string) error {
	cache, err := lcm.LoadLogCache()
	if err != nil {
		return err
	}

	delete(cache.Repositories, repoURL)
	return lcm.SaveLogCache(cache)
}

// ClearAllCache clears the entire log cache
func (lcm *LogCacheManager) ClearAllCache() error {
	cache := &LogCache{
		CacheVersion: "1.0",
		LastUpdated:  time.Now(),
		Repositories: make(map[string]*CachedRepository),
	}
	return lcm.SaveLogCache(cache)
}

// GetCacheStats returns cache statistics
func (lcm *LogCacheManager) GetCacheStats() (map[string]interface{}, error) {
	cache, err := lcm.LoadLogCache()
	if err != nil {
		return nil, err
	}

	stats := make(map[string]interface{})
	stats["cacheVersion"] = cache.CacheVersion
	stats["lastUpdated"] = cache.LastUpdated
	stats["repositoryCount"] = len(cache.Repositories)

	totalEntries := 0
	for repoURL, repo := range cache.Repositories {
		totalEntries += len(repo.Entries)
		repoStats := map[string]interface{}{
			"entryCount":         len(repo.Entries),
			"lastUpdated":        repo.LastUpdated,
			"lastCachedRevision": repo.LastCachedRevision,
			"repositoryURL":      repo.RepositoryURL,
		}
		stats["repository_"+repoURL] = repoStats
	}

	stats["totalEntries"] = totalEntries

	// File size information
	if fileInfo, err := os.Stat(lcm.cachePath); err == nil {
		stats["cacheFileSizeBytes"] = fileInfo.Size()
		stats["cacheFileSizeMB"] = float64(fileInfo.Size()) / (1024 * 1024)
	}

	return stats, nil
}
