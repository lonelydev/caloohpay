# Publishing Guide

This document outlines the steps to publish CalOohPay to npm.

## Table of Contents

- [Manual Release Process](#manual-release-process)
- [Automated Release (Future)](#automated-release-future)
- [NPM Token Setup](#npm-token-setup)
- [Pre-Publishing Checklist](#pre-publishing-checklist)
- [Troubleshooting](#troubleshooting)

## Manual Release Process

CalOohPay uses a semi-automated release script to streamline the publishing process.

### Quick Start

```bash
# 1. Update package.json version and CHANGELOG.md
# 2. Commit your changes
git add .
git commit -m "chore: prepare release v2.1.0"

# 3. Run the release script
./release-and-publish.sh 2.1.0
```

### Detailed Steps

#### 1. Prepare the Release

Ensure all changes for the release are complete:

- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] TypeScript compiles cleanly (`npm run typecheck`)
- [ ] Version number updated in `package.json`
- [ ] `CHANGELOG.md` updated with changes for this version
- [ ] Documentation is up to date (README.md, docs/, etc.)
- [ ] Security vulnerabilities checked (`npm audit`)

#### 2. Commit Release Changes

```bash
# Stage all changes
git add package.json CHANGELOG.md docs/ README.md

# Commit with conventional commit message
git commit -m "chore: prepare release v2.1.0

- Update version to 2.1.0
- Update CHANGELOG with release notes
- Update documentation"
```

#### 3. Run the Release Script

The `release-and-publish.sh` script automates the tagging, pushing, and publishing process:

```bash
./release-and-publish.sh 2.1.0
```

**What the script does:**

1. ✓ Validates semantic version format
2. ✓ Checks working tree is clean
3. ✓ Verifies package.json version matches
4. ✓ Ensures tag doesn't already exist
5. ✓ Runs tests
6. ✓ Runs build
7. ✓ Creates annotated git tag (e.g., `v2.1.0`)
8. ✓ Pushes current branch to remote
9. ✓ Pushes tag to remote
10. ✓ Publishes to npm (requires npm login)

#### 4. Create GitHub Release

After the script completes successfully, create a GitHub release:

1. Go to https://github.com/lonelydev/caloohpay/releases/new
2. Select the tag that was just pushed (e.g., `v2.1.0`)
3. Use the version as the release title (e.g., "v2.1.0")
4. Copy relevant sections from CHANGELOG.md into the release notes
5. Publish the release

### Manual Publishing (Without Script)

If you prefer to publish manually without the script:

```bash
# 1. Ensure you're logged into npm
npm login

# 2. Create and push git tag
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0

# 3. Publish to npm
npm publish

# 4. Create GitHub release (see step 4 above)
```

## Automated Release (Future)

We plan to add automated npm publishing via GitHub Actions. This will:

- Trigger when a GitHub release is created
- Automatically run tests, build, and publish to npm
- Require `NPM_TOKEN` secret configured in repository settings

See [NPM Token Setup](#npm-token-setup) below for configuration details.

## NPM Token Setup

For automated publishing (or for contributors who need to publish), an npm authentication token is required.

### For Repository Maintainers

#### 1. Create an npm Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Click your profile icon → "Access Tokens"
3. Click "Generate New Token" → "Classic Token"
4. Select token type:
   - **Automation** - for GitHub Actions (read and publish)
   - **Publish** - for CLI publishing from trusted environments
5. Copy the generated token (it won't be shown again)

#### 2. Add Token to GitHub Repository

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the token from step 1
6. Click **Add secret**

#### 3. Token Permissions

The `NPM_TOKEN` should have:

- **Read and Publish** access to the `caloohpay` package
- For scoped packages: ensure the token has access to the organization
- Recommended: Use an "Automation" token for GitHub Actions

### For Local Development

Contributors don't need the `NPM_TOKEN` for development. It's only required for:

- Publishing releases to npm (maintainers only)
- Automated GitHub Actions workflows

For local testing of the package:

```bash
# Build and link locally
npm run build
npm link

# Test the CLI
caloohpay --help

# Unlink when done
npm unlink -g caloohpay
```

### Token Security

- **Never commit** npm tokens to the repository
- Tokens in GitHub Secrets are encrypted and only accessible to Actions
- Rotate tokens periodically (every 90 days recommended)
- Use "Automation" tokens with minimal required permissions
- Revoke tokens immediately if compromised

## Pre-Publishing Checklist

Before running `./release-and-publish.sh`:

- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] TypeScript compiles cleanly (`npm run typecheck`)
- [ ] Version number updated in `package.json`
- [ ] `CHANGELOG.md` updated with changes
- [ ] Documentation is up to date
- [ ] README.md has correct installation instructions
- [ ] All dependencies are up to date
- [ ] Security vulnerabilities checked (`npm audit`)
- [ ] All changes committed to git
- [ ] Working tree is clean (`git status`)

### Verify Package Contents

Before publishing, check what will be included:

```bash
# See what will be published
npm pack --dry-run

# Or create a tarball to inspect
npm pack
tar -tzf caloohpay-*.tgz
rm caloohpay-*.tgz
```

## Troubleshooting

### "Tag already exists" Error

```bash
# Delete local tag
git tag -d v2.1.0

# Delete remote tag (use with caution)
git push origin :refs/tags/v2.1.0
```

### "Not logged into npm" Error

```bash
# Log in to npm
npm login

# Verify login
npm whoami
```

### "Version mismatch" Error

Ensure `package.json` version matches the version you're trying to release:

```bash
# Check current version
node -p "require('./package.json').version"

# Update if needed
npm version 2.1.0 --no-git-tag-version
```

### "Tests failed" Error

All tests must pass before releasing:

```bash
# Run tests
npm test

# Fix any failing tests, then try again
```

### "Build failed" Error

```bash
# Clean and rebuild
rm -rf dist
npm run build

# Check for TypeScript errors
npm run typecheck
```

### Permission Denied for npm Publish

Ensure you have publish permissions for the package:

1. Check you're logged in: `npm whoami`
2. Verify package name in package.json
3. For scoped packages: ensure you're a member of the organization
4. Contact package maintainers for access if needed

