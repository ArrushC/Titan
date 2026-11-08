package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"sync"
	"syscall"
	"time"
)

// ScriptInfo represents information about a script file
type ScriptInfo struct {
	Name         string    `json:"name"`
	Path         string    `json:"path"`
	Extension    string    `json:"extension"`
	Size         int64     `json:"size"`
	ModifiedTime time.Time `json:"modifiedTime"`
	LastExecuted string    `json:"lastExecuted,omitempty"`
}

// ScriptExecutionRequest represents a request to execute scripts
type ScriptExecutionRequest struct {
	ScriptPaths []string `json:"scriptPaths"`
	BranchPaths []string `json:"branchPaths"`
}

// ScriptExecutionResult represents the result of a script execution
type ScriptExecutionResult struct {
	ScriptName string `json:"scriptName"`
	BranchPath string `json:"branchPath"`
	Success    bool   `json:"success"`
	Output     string `json:"output"`
	Error      string `json:"error,omitempty"`
	StartTime  string `json:"startTime"`
	EndTime    string `json:"endTime"`
}

// ScriptManager handles script discovery and execution
type ScriptManager struct {
	scriptsPath  string
	scriptConfig *ScriptConfig
}

// NewScriptManager creates a new script manager
func NewScriptManager(scriptsPath string, scriptConfig *ScriptConfig) *ScriptManager {
	if scriptsPath == "" {
		scriptsPath = "C:\\Titan\\scripts"
	}
	return &ScriptManager{
		scriptsPath:  scriptsPath,
		scriptConfig: scriptConfig,
	}
}

// GetScripts returns all scripts in the scripts directory
func (sm *ScriptManager) GetScripts() ([]ScriptInfo, error) {
	log.Printf("[ScriptManager] GetScripts called, scripts path: %s", sm.scriptsPath)

	// Ensure scripts directory exists
	if err := os.MkdirAll(sm.scriptsPath, 0755); err != nil {
		log.Printf("[ScriptManager] Failed to create scripts directory: %v", err)
		return nil, fmt.Errorf("failed to create scripts directory: %w", err)
	}

	var scripts []ScriptInfo

	// Read directory
	entries, err := os.ReadDir(sm.scriptsPath)
	if err != nil {
		log.Printf("[ScriptManager] Failed to read scripts directory: %v", err)
		return nil, fmt.Errorf("failed to read scripts directory: %w", err)
	}

	log.Printf("[ScriptManager] Found %d entries in scripts directory", len(entries))

	// Get execution history map for quick lookup
	executionMap := make(map[string]string)
	if sm.scriptConfig != nil && sm.scriptConfig.ExecutionHistory != nil {
		for _, exec := range sm.scriptConfig.ExecutionHistory {
			// Only store the first (most recent) execution for each script
			if _, exists := executionMap[exec.ScriptName]; !exists {
				executionMap[exec.ScriptName] = exec.ExecutedAt
			}
		}
	}

	// Process each file
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Check if it's a supported script file
		ext := strings.ToLower(filepath.Ext(info.Name()))
		if !sm.isSupportedScriptExtension(ext) {
			continue
		}

		scriptInfo := ScriptInfo{
			Name:         info.Name(),
			Path:         filepath.Join(sm.scriptsPath, info.Name()),
			Extension:    ext,
			Size:         info.Size(),
			ModifiedTime: info.ModTime(),
		}

		// Add last execution time if available
		if lastExec, exists := executionMap[info.Name()]; exists {
			scriptInfo.LastExecuted = lastExec
		}

		scripts = append(scripts, scriptInfo)
		log.Printf("[ScriptManager] Added script: %s (extension: %s, size: %d)", scriptInfo.Name, scriptInfo.Extension, scriptInfo.Size)
	}

	// Sort by name by default
	sort.Slice(scripts, func(i, j int) bool {
		return scripts[i].Name < scripts[j].Name
	})

	log.Printf("[ScriptManager] Returning %d scripts", len(scripts))
	return scripts, nil
}

// isSupportedScriptExtension checks if the file extension is supported
func (sm *ScriptManager) isSupportedScriptExtension(ext string) bool {
	supportedExtensions := []string{".bat", ".cmd", ".ps1", ".sh"}
	for _, supported := range supportedExtensions {
		if ext == supported {
			return true
		}
	}
	return false
}

// OutputCallback is a function that receives output chunks as they arrive
type OutputCallback func(output string, isError bool)

// ExecuteScript executes a single script in a specific branch directory with additional parameters
func (sm *ScriptManager) ExecuteScript(scriptPath string, branchPath string, branchId string, branchFolder string, branchVersion string) (*ScriptExecutionResult, error) {
	log.Printf("[ScriptManager] ExecuteScript called - Script: %s, Branch: %s", scriptPath, branchPath)

	// Validate script path
	if !sm.isValidScriptPath(scriptPath) {
		log.Printf("[ScriptManager] Invalid script path: %s", scriptPath)
		return nil, fmt.Errorf("invalid script path: %s", scriptPath)
	}

	// Check if script file exists
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		log.Printf("[ScriptManager] Script file does not exist: %s", scriptPath)
		return nil, fmt.Errorf("script file does not exist: %s", scriptPath)
	}

	// Validate branch path
	if _, err := os.Stat(branchPath); err != nil {
		log.Printf("[ScriptManager] Invalid branch path: %s, error: %v", branchPath, err)
		return nil, fmt.Errorf("invalid branch path: %s", branchPath)
	}

	result := &ScriptExecutionResult{
		ScriptName: filepath.Base(scriptPath),
		BranchPath: branchPath,
		StartTime:  time.Now().Format(time.RFC3339),
	}

	// Determine how to execute based on extension
	ext := strings.ToLower(filepath.Ext(scriptPath))
	var cmd *exec.Cmd

	log.Printf("[ScriptManager] Script extension: %s", ext)

	switch ext {
	case ".bat", ".cmd":
		log.Printf("[ScriptManager] Executing BAT/CMD script")
		cmd = exec.Command("cmd.exe", "/C", scriptPath, branchId, branchFolder, branchVersion, branchPath)
		// Hide console window on Windows
		if runtime.GOOS == "windows" {
			cmd.SysProcAttr = &syscall.SysProcAttr{
				CreationFlags: CREATE_NO_WINDOW,
			}
		}
	case ".ps1":
		log.Printf("[ScriptManager] Executing PowerShell script")
		cmd = exec.Command("powershell.exe", "-ExecutionPolicy", "Bypass", "-File", scriptPath, branchId, branchFolder, branchVersion, branchPath)
		// Hide console window on Windows
		if runtime.GOOS == "windows" {
			cmd.SysProcAttr = &syscall.SysProcAttr{
				CreationFlags: CREATE_NO_WINDOW,
			}
		}
	case ".sh":
		if runtime.GOOS == "windows" {
			log.Printf("[ScriptManager] Executing SH script with bash (Windows)")
			// Try to use Git Bash or WSL
			cmd = exec.Command("bash", scriptPath, branchId, branchFolder, branchVersion, branchPath)
			// Hide console window on Windows
			cmd.SysProcAttr = &syscall.SysProcAttr{
				CreationFlags: CREATE_NO_WINDOW,
			}
		} else {
			log.Printf("[ScriptManager] Executing SH script with sh")
			cmd = exec.Command("sh", scriptPath, branchId, branchFolder, branchVersion, branchPath)
		}
	default:
		log.Printf("[ScriptManager] Unsupported script type: %s", ext)
		return nil, fmt.Errorf("unsupported script type: %s", ext)
	}

	// Set working directory to branch path
	cmd.Dir = branchPath
	log.Printf("[ScriptManager] Working directory: %s", branchPath)

	// Set environment variables
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("TITAN_BRANCH_PATH=%s", branchPath),
		fmt.Sprintf("TITAN_SCRIPT_NAME=%s", filepath.Base(scriptPath)),
	)

	// Log command details
	log.Printf("[ScriptManager] Command: %s %v", cmd.Path, cmd.Args)
	log.Printf("[ScriptManager] Executing script...")

	// Capture output
	output, err := cmd.CombinedOutput()
	result.EndTime = time.Now().Format(time.RFC3339)
	result.Output = string(output)

	if err != nil {
		log.Printf("[ScriptManager] Script execution failed: %v", err)
		log.Printf("[ScriptManager] Script output: %s", result.Output)
		result.Success = false
		result.Error = err.Error()
		// Include output in error if available
		if result.Output != "" {
			result.Error = fmt.Sprintf("%s\nOutput: %s", err.Error(), result.Output)
		}
	} else {
		log.Printf("[ScriptManager] Script executed successfully")
		result.Success = true
	}

	// Limit output size for storage
	if len(result.Output) > 1000 {
		log.Printf("[ScriptManager] Truncating output from %d to 1000 characters", len(result.Output))
		result.Output = result.Output[:1000] + "\n... (output truncated)"
	}

	log.Printf("[ScriptManager] Returning result: Success=%v", result.Success)
	return result, nil
}

// ExecuteScriptWithCallback executes a single script with real-time output streaming
func (sm *ScriptManager) ExecuteScriptWithCallback(scriptPath string, branchPath string, branchId string, branchFolder string, branchVersion string, outputCallback OutputCallback) (*ScriptExecutionResult, error) {
	log.Printf("[ScriptManager] ExecuteScriptWithCallback called - Script: %s, Branch: %s", scriptPath, branchPath)

	// Validate script path
	if !sm.isValidScriptPath(scriptPath) {
		log.Printf("[ScriptManager] Invalid script path: %s", scriptPath)
		return nil, fmt.Errorf("invalid script path: %s", scriptPath)
	}

	// Check if script file exists
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		log.Printf("[ScriptManager] Script file does not exist: %s", scriptPath)
		return nil, fmt.Errorf("script file does not exist: %s", scriptPath)
	}

	// Validate branch path
	if _, err := os.Stat(branchPath); err != nil {
		log.Printf("[ScriptManager] Invalid branch path: %s, error: %v", branchPath, err)
		return nil, fmt.Errorf("invalid branch path: %s", branchPath)
	}

	result := &ScriptExecutionResult{
		ScriptName: filepath.Base(scriptPath),
		BranchPath: branchPath,
		StartTime:  time.Now().Format(time.RFC3339),
	}

	// Determine how to execute based on extension
	ext := strings.ToLower(filepath.Ext(scriptPath))
	var cmd *exec.Cmd

	log.Printf("[ScriptManager] Script extension: %s", ext)

	switch ext {
	case ".bat", ".cmd":
		log.Printf("[ScriptManager] Executing BAT/CMD script")
		cmd = exec.Command("cmd.exe", "/C", scriptPath, branchId, branchFolder, branchVersion, branchPath)
		// Hide console window on Windows
		if runtime.GOOS == "windows" {
			cmd.SysProcAttr = &syscall.SysProcAttr{
				CreationFlags: CREATE_NO_WINDOW,
			}
		}
	case ".ps1":
		log.Printf("[ScriptManager] Executing PowerShell script")
		cmd = exec.Command("powershell.exe", "-ExecutionPolicy", "Bypass", "-File", scriptPath, branchId, branchFolder, branchVersion, branchPath)
		// Hide console window on Windows
		if runtime.GOOS == "windows" {
			cmd.SysProcAttr = &syscall.SysProcAttr{
				CreationFlags: CREATE_NO_WINDOW,
			}
		}
	case ".sh":
		if runtime.GOOS == "windows" {
			log.Printf("[ScriptManager] Executing SH script with bash (Windows)")
			// Try to use Git Bash or WSL
			cmd = exec.Command("bash", scriptPath, branchId, branchFolder, branchVersion, branchPath)
			// Hide console window on Windows
			cmd.SysProcAttr = &syscall.SysProcAttr{
				CreationFlags: CREATE_NO_WINDOW,
			}
		} else {
			log.Printf("[ScriptManager] Executing SH script with sh")
			cmd = exec.Command("sh", scriptPath, branchId, branchFolder, branchVersion, branchPath)
		}
	default:
		log.Printf("[ScriptManager] Unsupported script type: %s", ext)
		return nil, fmt.Errorf("unsupported script type: %s", ext)
	}

	// Set working directory to branch path
	cmd.Dir = branchPath
	log.Printf("[ScriptManager] Working directory: %s", branchPath)

	// Set environment variables
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("TITAN_BRANCH_PATH=%s", branchPath),
		fmt.Sprintf("TITAN_SCRIPT_NAME=%s", filepath.Base(scriptPath)),
	)

	// Get stdout and stderr pipes
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stderr pipe: %w", err)
	}

	// Start the command
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start command: %w", err)
	}

	// Collect all output for the final result
	var outputBuilder strings.Builder
	var errorBuilder strings.Builder
	var outputMutex sync.Mutex
	var wg sync.WaitGroup

	// Read stdout
	wg.Add(1)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			outputMutex.Lock()
			outputBuilder.WriteString(line + "\n")
			outputMutex.Unlock()
			if outputCallback != nil {
				outputCallback(line+"\n", false)
			}
		}
	}()

	// Read stderr
	wg.Add(1)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			outputMutex.Lock()
			errorBuilder.WriteString(line + "\n")
			outputMutex.Unlock()
			if outputCallback != nil {
				outputCallback(line+"\n", true)
			}
		}
	}()

	// Wait for command to complete
	err = cmd.Wait()
	wg.Wait()
	result.EndTime = time.Now().Format(time.RFC3339)

	// Combine stdout and stderr for final output
	fullOutput := outputBuilder.String()
	if errorOutput := errorBuilder.String(); errorOutput != "" {
		if fullOutput != "" {
			fullOutput += "\n"
		}
		fullOutput += errorOutput
	}
	result.Output = fullOutput

	if err != nil {
		log.Printf("[ScriptManager] Script execution failed: %v", err)
		result.Success = false
		result.Error = err.Error()
		if result.Output != "" {
			result.Error = fmt.Sprintf("%s\nOutput: %s", err.Error(), result.Output)
		}
	} else {
		log.Printf("[ScriptManager] Script executed successfully")
		result.Success = true
	}

	// Limit output size for storage
	if len(result.Output) > 1000 {
		log.Printf("[ScriptManager] Truncating output from %d to 1000 characters", len(result.Output))
		result.Output = result.Output[:1000] + "\n... (output truncated)"
	}

	log.Printf("[ScriptManager] Returning result: Success=%v", result.Success)
	return result, nil
}

// isValidScriptPath validates that the script path is within the scripts directory
func (sm *ScriptManager) isValidScriptPath(scriptPath string) bool {
	// Clean and resolve the path
	cleanPath := filepath.Clean(scriptPath)
	absPath, err := filepath.Abs(cleanPath)
	if err != nil {
		return false
	}

	// Ensure it's within the scripts directory
	absScriptsPath, err := filepath.Abs(sm.scriptsPath)
	if err != nil {
		return false
	}

	// Check if the path starts with the scripts directory
	if !strings.HasPrefix(absPath, absScriptsPath) {
		return false
	}

	// Check if file exists and is a regular file
	info, err := os.Stat(absPath)
	if err != nil || info.IsDir() {
		return false
	}

	// Check extension
	ext := strings.ToLower(filepath.Ext(absPath))
	return sm.isSupportedScriptExtension(ext)
}

// GetScriptContent reads the content of a script file
func (sm *ScriptManager) GetScriptContent(scriptPath string) (string, error) {
	if !sm.isValidScriptPath(scriptPath) {
		return "", fmt.Errorf("invalid script path: %s", scriptPath)
	}

	file, err := os.Open(scriptPath)
	if err != nil {
		return "", fmt.Errorf("failed to open script: %w", err)
	}
	defer file.Close()

	// Limit file size to prevent memory issues
	const maxSize = 1 * 1024 * 1024 // 1MB
	limited := io.LimitReader(file, maxSize)

	content, err := io.ReadAll(limited)
	if err != nil {
		return "", fmt.Errorf("failed to read script: %w", err)
	}

	return string(content), nil
}

// GetExecutionHistoryJSON returns the execution history as JSON
func (sm *ScriptManager) GetExecutionHistoryJSON() (string, error) {
	if sm.scriptConfig == nil || sm.scriptConfig.ExecutionHistory == nil {
		return "[]", nil
	}

	jsonBytes, err := json.Marshal(sm.scriptConfig.ExecutionHistory)
	if err != nil {
		return "", fmt.Errorf("failed to marshal execution history: %w", err)
	}

	return string(jsonBytes), nil
}
