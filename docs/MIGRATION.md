# Electron to Wails migration

The `migration-go` branch implements the Go/Wails backend and Svelte frontend tracked by [issue #18](https://github.com/ArrushC/Titan/issues/18). A successful build alone does not establish feature parity. Keep the migration PR in draft until the Windows acceptance checks below are completed.

## Existing installations

1. Close Titan and back up `C:\Titan` and any existing Titan user-data directory. Keep backups private because integration tokens may be present.
2. Keep the Electron installer available for rollback. The Wails application does not automatically import the old `Titan.config.json`, targets file, or Electron browser storage.
3. Install/start the Wails build. It uses `Titan.app.json`, `Titan.branches.json`, and `Titan.scripts.json` under `C:\Titan`, plus `%APPDATA%\Titan\state.json` for UI state. Existing Wails configurations use these same paths.
4. Re-create branch folders/working-copy paths in **Branches**, and copy the relevant preferences, Trello credentials, ignored-path patterns, and commit templates through **Settings**. Do not rename the old config to the new filenames: their schemas differ.
5. Verify scripts and their configured directory. Validate every working-copy path with `svn info` before your first commit.
6. Test with a disposable SVN repository/working copy before using your normal repositories. To roll back, close Wails, reinstall Electron, and restore the backed-up Electron configuration; do not overwrite working-copy changes.

## Acceptance checks before merging/releasing

Automated CI must pass Svelte/TypeScript checks, frontend regression tests, the production frontend build, Go tests/vet, and the Windows executable/NSIS build.

Complete these manual checks on Windows against a disposable SVN repository:

- [ ] Fresh install launches with WebView2, creates configuration, and restarts with saved UI state.
- [ ] Add/edit/remove branch folders and working copies; refresh status, including forced refresh and disconnected paths.
- [ ] Edit commit variables (name, description, default, required), cancel and save; duplicate names display an error without crashing.
- [ ] Stage modified, added, deleted, and unversioned files; inspect working-copy diffs and historical diffs.
- [ ] Commit to one and multiple branches, verify revision output and updates; exercise revert/conflict handling.
- [ ] Edit settings, color values, and ignored paths; confirm persistence after restart.
- [ ] Run a trusted test script; verify output, failure reporting, and working directory.
- [ ] If used, verify Trello board/card lookup and invalid credentials.
- [ ] Confirm dialogs open/close without errors; check keyboard navigation and virtualized log row actions.
- [ ] Install, upgrade, and uninstall the NSIS package; verify backup/rollback instructions.

Known remaining limitations: Windows-only paths/process handling, manual configuration migration and updates, unsigned release artifacts, and existing Svelte accessibility/CSS warnings. These are explicit release considerations, not completed acceptance checks.
