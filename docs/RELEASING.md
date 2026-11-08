# Releasing Titan 3

The release pipeline builds the Wails application, not Electron. Windows x64 is the supported target.

1. Complete the checks in [MIGRATION.md](MIGRATION.md), review the migration PR, and merge it into `main`.
2. Set the frontend version in `frontend/package.json` and its lockfile. Set the numeric Windows product version in `wails.json` (`info.productVersion`, for example `3.0.0`). Use a prerelease tag such as `v3.0.0-beta.3` for beta builds; the Windows numeric version does not include the suffix.
3. On the reviewed commit, create and push the version tag:

   ```sh
   git tag v3.0.0-beta.3
   git push origin v3.0.0-beta.3
   ```

4. The release workflow runs the reusable Windows validation/build job. Only after checks pass does it create a **draft** GitHub release containing the executable, NSIS installer, and `SHA256SUMS.txt`.
5. Download the artifacts and smoke-test installation, launch, upgrade, and uninstall on Windows. Review generated release notes and publish the draft when ready.

The workflow does not sign binaries or publish releases automatically. No Electron auto-update manifest is generated; this Wails migration currently requires manual installation of new releases. Existing Electron users should follow the migration guide.

PR artifacts are available from the **Validate Wails application** workflow without creating a release or tag. If draft creation needs retrying after a draft already exists, inspect the existing draft and upload the validated artifacts manually; do not create another tag for the same version.
