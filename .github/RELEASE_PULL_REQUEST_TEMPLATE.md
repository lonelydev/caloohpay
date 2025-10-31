# Release PR Template

## 📚 Release v2.0.0: Comprehensive Release Documentation

This PR includes the release documentation and version management for CalOohPay v2.0.0.

### Changes Included

#### 1. Version Bump (commit b6a2758)

- Updated `package.json` from v1.0.0 to v2.0.0
- Tagged as v2.0.0

#### 2. Release Documentation (commit 1c076ac)

- **CHANGELOG.md**: Comprehensive changelog with both v1.0.0 and v2.0.0 release notes
- **docs/v1.0.0-RELEASE.md**: Complete installation and usage guide for v1.0.0
- **docs/v2.0.0-RELEASE.md**: Migration guide and documentation for v2.0.0

### 🏷️ Git Tags Created

- `v1.0.0` - Tagged at commit 9af9959 (pre-timezone version)

- `v2.0.0` - Tagged at commit b6a2758 (with timezone support)

Both tags have been pushed to the remote repository.

### 📖 Documentation Highlights

#### CHANGELOG.md

- Breaking changes clearly documented

- Migration guide from v1.0.0 to v2.0.0

- Version selection criteria to help users choose

- Installation instructions for specific versions

#### v1.0.0-RELEASE.md (302 lines)

- Complete installation guide for v1.0.0

- Usage examples and CLI options

- Known limitations (single timezone)

- Troubleshooting guide

- Upgrade path to v2.0.0

#### v2.0.0-RELEASE.md (475 lines)

- Breaking changes detailed

- New timezone features and examples

- Comprehensive migration guide

- Supported timezones list

- Best practices for distributed teams

- Daylight saving time handling

### 🎯 User Benefits

Users can now:

1. **Choose the right version** based on their needs

2. **Easily upgrade** from v1.0.0 to v2.0.0 with clear migration steps

3. **Install specific versions** using git tags

4. **Understand breaking changes** before upgrading

5. **Get timezone support** for distributed teams (v2.0.0)

### ✅ Verification

- ✅ All 27 tests passing

- ✅ Build successful

- ✅ Git tags pushed to remote

- ✅ Documentation reviewed for accuracy

- ✅ CommitLint passed

### 📦 Next Steps After Merge

1. Create GitHub releases for v1.0.0 and v2.0.0 using the documentation

2. Consider publishing to npm (optional)

3. Update README badges (optional)

---

**Related Commits:**

- b6a2758: Version bump to 2.0.0

- 1c076ac: Release documentation

- 4b0c71b: Timezone feature implementation (in main)

**Closes**: Related to timezone support feature

