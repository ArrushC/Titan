# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Titan** is a Wails v2 desktop application that provides a modern GUI for SVN (Subversion) version control. It combines a Go backend with a Svelte 5/TypeScript frontend, featuring real-time WebSocket communication for live updates and a reactive UI for managing SVN repositories.

## Technology Stack

### Backend (Go 1.23)
- **Wails v2.10.2**: Desktop application framework for building native apps with web technologies
- **Gorilla WebSocket v1.5.3**: Real-time WebSocket server for live updates
- **Native SVN Integration**: Command-line SVN wrapper with XML parsing and JSON serialization
- **Event System**: Structured WebSocket event handling with typed messages

### Frontend
- **Svelte 5.35.0**: Modern reactive UI framework using runes (`$state`, `$derived`)
- **TypeScript 5.8.3**: Type-safe development with auto-generated Wails bindings
- **TailwindCSS 4.1.11**: Utility-first CSS via Vite plugin
- **Vite 6.0.0**: Fast development server and build tool

## Project Structure

```
Titan/
├── main.go                 # Entry point, Wails app initialization
├── app.go                  # Main App struct, frontend API methods
├── svn.go                  # SVN command wrapper and XML parsing
├── websocket.go            # WebSocket server and client management
├── data_provider.go        # Interface for WebSocket data access
├── config.go               # Configuration management (app & branch configs)
├── scripts.go              # Script discovery and execution functionality
├── utils.go                # Utility functions (icon mappings, etc.)
├── build/                  # Build assets and platform configs
│   ├── appicon.png         # Application icon
│   └── windows/            # Windows-specific build files
├── frontend/
│   ├── src/
│   │   ├── App.svelte      # Main app component
│   │   ├── Branches.svelte # Branch list component
│   │   ├── Commit.svelte   # Commit interface (see commit-feature.md)
│   │   ├── Scripts.svelte  # Script management interface
│   │   ├── Settings.svelte # Settings interface
│   │   ├── stores/
│   │   │   └── app.svelte.ts  # Global state using Svelte 5 runes
│   │   ├── components/     # Reusable UI components
│   │   └── utils/
│   │       ├── AppConfig.ts    # App configuration class
│   │       ├── BranchConfig.ts # Branch configuration class
│   │       └── ScriptConfig.ts # Script configuration class
│   ├── wailsjs/            # Auto-generated bindings (DO NOT EDIT)
│   └── vite.config.ts      # Vite configuration
└── wails.json              # Wails framework configuration
```

## Common Development Commands

### Quick Start
```bash
# Install frontend dependencies (first time setup)
cd frontend && npm install && cd ..

# Start development mode with hot reload
wails dev

# Run frontend only (useful for UI development)
cd frontend && npm run dev
```


### Building & Testing
```bash
# TypeScript type checking
cd frontend && npm run check

# Build frontend for production
cd frontend && npm run build

# Build desktop application (Windows - prevents console window)
wails build -ldflags="-H windowsgui"

# Build for production with optimizations
wails build -ldflags="-w -s -H windowsgui"
```

### Platform-Specific Builds
```bash
# Windows with NSIS installer (GUI app without console)
wails build -nsis -ldflags="-H windowsgui"

# macOS Universal Binary
wails build -platform darwin/universal

# Linux
wails build -platform linux/amd64
```

## Architecture & Key Patterns

### Application Lifecycle
1. **Startup**: Go backend initializes, starts WebSocket server on random port
2. **Frontend Connection**: Svelte app connects to WebSocket using port from backend
3. **Configuration Loading**: App, branch, and script configs loaded from JSON files
4. **Real-time Updates**: WebSocket broadcasts SVN changes and events
5. **Shutdown**: Graceful cleanup of WebSocket connections and resources

### Backend Architecture

#### DataProvider Interface Pattern
The app uses a clean interface pattern for data operations:
```go
type DataProvider interface {
    SVNStatus(paths []string) (string, error)
    SVNLog(limit int, isVerbose bool, paths []string) (string, error)
    SVNInfo(paths []string) (string, error)
    // ... other operations
}
```

#### Configuration System
- **App Config** (`Titan.app.json`): Global settings, integrations, ignored paths
- **Branch Config** (`Titan.branches.json`): SVN repository paths and metadata
- **Script Config** (`Titan.scripts.json`): Script execution history
- All configs use debounced auto-save with TypeScript classes in frontend

#### SVN Integration
- Executes SVN commands via `exec.Command`
- Parses XML output into Go structs
- Converts to JSON for frontend consumption
- Handles both stdout and stderr for comprehensive error reporting
- Supports concurrent operations with configurable concurrency limits

### Frontend Architecture

#### State Management (Svelte 5 Runes)
```typescript
// stores/app.svelte.ts uses modern rune syntax
const state = $state({
    appConfig: null,
    branchConfig: null,
    scriptConfig: null,
    ws: null,
    wsConnected: false
});
```

#### WebSocket Protocol
Commands sent as JSON:
```json
{
    "command": "svn_status",
    "path": "/path/to/repo"
}
```

Available commands:
- `svn_status`: Get working copy status
- `svn_log`: Get commit history
- `svn_info`: Get repository information
- `svn_update`: Update working copy
- `svn_commit`: Commit changes
- `svn_diff`: Get file differences

### Adding New Features

#### Backend Feature Addition
1. Add method to `App` struct in `app.go`
2. Implement core logic in appropriate file (`svn.go`, `websocket.go`, `scripts.go`)
3. Add WebSocket command handler if needed
4. Run `wails dev` to regenerate TypeScript bindings

#### Frontend Feature Addition
1. Import generated methods from `wailsjs/go/main/App`
2. Create Svelte 5 components using runes for state
3. Use TailwindCSS v4 for styling
4. Connect to WebSocket events if real-time updates needed

## Configuration Files

Configuration files are stored in `C:\Titan\` on Windows (or appropriate config directory on other platforms).

### Titan.app.json
```json
{
    "integrations": {
        "trello": {
            "key": "your-trello-api-key",
            "token": "your-trello-token"
        }
    },
    "ignoredPaths": {
        "unknown": ["*.tmp", "*.log"],
        "modified": ["generated/*", "build/*"]
    }
}
```

### Titan.branches.json
```json
{
    "folders": {
        "folder-name": {
            "color": "#FF5733",
            "branchIds": ["branch-id-1", "branch-id-2"]
        }
    },
    "branches": {
        "branch-id-1": {
            "branchVersion": "Branch Name",
            "branchPath": "C:\\SVN\\project\\trunk"
        }
    }
}
```

### Titan.scripts.json
```json
{
    "executionHistory": {
        "script-name.bat": {
            "C:\\SVN\\project\\trunk": "2024-01-20T10:30:00Z"
        }
    }
}
```

## Important Notes

- **Development Mode**: Uses `http://localhost:34115` by default (configurable in `wails.json`)
- **Auto-generated Files**: Never edit files in `frontend/wailsjs/` - they're regenerated on each build
- **SVN Working Directory**: All SVN commands execute from the specified path parameter
- **Graceful Shutdown**: WebSocket connections are properly closed on app exit
- **Concurrent Operations**: SVN operations use hardware-optimized concurrency limits
- **Windows Build Flags**: Always use `-ldflags="-H windowsgui"` for Windows builds to prevent console window. Wails does not support ldflags configuration in `wails.json` (known limitation), so flags must be passed via command line

## Code Organization Principles

1. **Separation of Concerns**: SVN logic in `svn.go`, WebSocket in `websocket.go`, scripts in `scripts.go`
2. **Type Safety**: Go structs mapped to TypeScript interfaces via Wails
3. **Error Handling**: All SVN operations return both data and error for proper handling
4. **Real-time First**: WebSocket events drive UI updates for responsive experience

## Security Considerations

- SVN commands are executed with user privileges
- No credentials stored in application (relies on system SVN auth)
- WebSocket server binds to localhost only
- Configuration files stored in user's config directory
- Script execution is sandboxed to selected branch paths

## Common Issues & Solutions

1. **WebSocket Connection Failed**: Check if port is already in use or firewall blocking
2. **SVN Commands Fail**: Ensure SVN CLI is installed and in PATH
3. **Build Errors**: Run `go mod tidy` and `cd frontend && npm install`
4. **Type Errors**: Regenerate bindings with `wails dev`
5. **Script Execution Fails**: Check script permissions and path validity

## Commit Feature Implementation

The Commit.svelte component implements a comprehensive commit interface with the following features:
- Parallel SVN status fetching for selected branches
- Variable-based commit message templating
- Two-table workflow (selection table → staged table)
- File diff viewing capability
- Automatic handling of unversioned/missing files
- Grouped commits by branch path
- Real-time commit progress tracking

See `commit-feature.md` for detailed requirements and implementation guidelines.

#### Script Management
- Discovers scripts in `C:\Titan\Scripts` directory
- Supports various script types (.bat, .cmd, .ps1, .py, .sh)
- Executes scripts with branch paths as working directories
- Tracks execution history and results

## Development Reminders

- **Frontend Testing**:
  - I will test frontend features with npm run dev, please do not run this command
- **Command Restrictions**:
  - Never run `wails dev` nor `git add` nor `git commit` commands

[Rest of the existing content remains unchanged...]