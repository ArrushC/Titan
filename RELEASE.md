# Release Mechanism

The release mechanism is based on the guide in this [GitHub repository](https://github.com/iffy/electron-updater-example/tree/master).

1. Merge the version branch into the main branch.
2. On the main branch, run the following commands:

```bash
git tag v[SEMANTIC_VERSION_NUMBER]
git push origin --tags
```