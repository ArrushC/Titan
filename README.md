# Titan

Titan is a Windows desktop client for Subversion (SVN). It brings working-copy status, branch management, commits, diffs, history, custom scripts, and optional Trello integration into one application.

This branch contains the **3.0 Go/Wails migration**, with a Svelte 5, TypeScript, and Tailwind CSS frontend. The previous Electron/React implementation remains on `main` until the migration is reviewed and merged. See [migration and acceptance checks](docs/MIGRATION.md) before upgrading an existing installation.

## Requirements

- Windows 10/11 x64 and Microsoft Edge WebView2 Runtime.
- Subversion command-line tools: `svn --version` must work from your terminal. Authenticate against your repositories with the SVN CLI before using Titan.
- For development: Go 1.23 or later, Node.js 24 LTS, npm, and Wails CLI v2.10.2 (matching `go.mod`).
- For an installer: NSIS 3, with `makensis` on `PATH`.

Windows is the current supported build target. The backend uses Windows process attributes and `C:\Titan` paths; macOS/Linux release support is not yet implemented.

## Development

From the repository root:

```powershell
go install github.com/wailsapp/wails/v2/cmd/wails@v2.10.2
go mod download
npm ci --prefix frontend
wails doctor
wails dev
```

Ensure Go's bin directory is on `PATH`. Wails starts the Go backend, generates frontend bindings, and serves the frontend. A frontend-only Vite page cannot perform desktop/SVN operations without Wails bindings.

## Checks and builds

```powershell
npm run check --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
go test ./...
go vet ./...
wails build -clean -platform windows/amd64 -nsis -ldflags="-w -s -H windowsgui"
```

Build the frontend before running Go tests: `main.go` embeds `frontend/dist`. Output executables and the NSIS installer are placed in `build/bin`. For an executable without an installer, omit `-nsis` or run `build-windows.bat`.

Pull requests and pushes to `main`/`migration-go` run these checks on Windows and upload build artifacts. [Release instructions](docs/RELEASING.md) describe the separate tag-triggered draft release workflow.

## Configuration

On first launch Titan creates configuration files under `C:\Titan`; the current user must be able to write there.

| File | Purpose |
| --- | --- |
| `Titan.app.json` | SVN author, Trello integration, ignored paths, commit variables/templates, theme |
| `Titan.branches.json` | Named folders and SVN working-copy paths |
| `Titan.scripts.json` | Script settings and execution history |
| `Titan.logs.json` and `cache\Titan.logs.json` | SVN log caches |
| `%APPDATA%\Titan\state.json` | Persisted UI state |

Use **Branches** to add existing working copies and **Settings** to edit application preferences. Ignored-path patterns are regular expressions (for example, `\.tmp$`), not shell globs. Trello is optional; its key and token are stored in `Titan.app.json`, so keep configuration backups private. Scripts default to `C:\Titan\scripts` and execute with your user permissions in selected working copies.

## Troubleshooting

- **No SVN / disconnected:** check `svn --version`, the working-copy path, and CLI authentication.
- **Configuration cannot be saved:** check write permission to `C:\Titan` and validate the JSON. Back up files before editing them manually.
- **Desktop build fails:** run `wails doctor`, check WebView2/NSIS installation, and reinstall frontend dependencies with `npm ci --prefix frontend`.
- **Go reports missing frontend assets:** run `npm run build --prefix frontend` first.

Do not hand-edit `frontend/wailsjs`; Wails generates these bindings from the Go API.
