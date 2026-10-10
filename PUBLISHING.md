# Publishing Guide

This document outlines the steps to publish CalOohPay to npm.

## Table of Contents

- [Automated Release (Recommended)](#automated-release-recommended)
- [Manual Release Process (Alternative)](#manual-release-process-alternative)
- [NPM Token Setup](#npm-token-setup)
- [Pre-Publishing Checklist](#pre-publishing-checklist)
- [Troubleshooting](#troubleshooting)

## Automated Release (Recommended)

CalOohPay uses GitHub Actions to automatically publish to npm when you create a GitHub release.

### Quick Start

```bash
# 1. Update package.json version and CHANGELOG.md
# 2. Commit your changes
git add .
git commit -m "chore: prepare release v2.1.0"

# 3. Push to main branch
git push origin main

# 4. Create a GitHub release
# Go to: https://github.com/lonelydev/caloohpay/releases/new
# - Tag: v2.1.0
# - Title: v2.1.0
# - Description: Copy from CHANGELOG.md
# - Click "Publish release"

# 5. Approve the staged version with 2FA (see "Approving a Staged Release" below).
#    The version is NOT live on npm until you do this.
```
The GitHub Actions workflow will automatically:
1. Run all tests
2. Run linting and type checking
3. Build the package
4. Stage the package on npm (it is not live yet)
5. Create a summary with the npm package link and the approval command

### How It Works

The automated publishing workflow (`.github/workflows/publish.yml`) triggers when you publish a GitHub release:

1. **Trigger**: Publishing a GitHub release
2. **Tests**: Runs `npm test`, `npm run lint`, `npm run typecheck`
3. **Build**: Runs `npm run build`
4. **Stage**: Runs `npm stage publish` with the `NPM_TOKEN` secret. The version is uploaded but not public until a maintainer approves it
5. **Verification**: Checks package contents before publishing

### Approving a Staged Release

`NPM_TOKEN` is a stage-only token, so the workflow can only *stage* a version. A maintainer approves it with 2FA, either:

- on [npmjs.com](https://www.npmjs.com/): open the package, go to the **Staged Packages** tab and click **Approve**; or
- with the CLI (npm 11.15.0 or later, Node 22.14.0 or later):

```bash
npm stage list caloohpay
npm stage view <stage-id>      # optional: inspect before approving
npm stage approve <stage-id>   # prompts for 2FA, then the version goes live
```

Use `npm stage reject <stage-id>` to discard a staged version. Afterwards confirm with `npm view caloohpay version`.

### Prerequisites

- `NPM_TOKEN` must be configured in repository secrets (see [NPM Token Setup](#npm-token-setup))
- All tests must pass
- Version in `package.json` must match the release tag

### Docs-Only Release Override

The publish workflow blocks releases when the diff between the current tag and the previous tag contains only documentation, tests, CI, or config changes.

If you intentionally want to publish a docs-only release, set the `ALLOW_DOCS_ONLY_PUBLISH` environment variable to `true` for the `publish` job in `.github/workflows/publish.yml`.

Example:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    env:
      ALLOW_DOCS_ONLY_PUBLISH: 'true'
```

Use this only when the npm package should still be republished even though no code changes were detected.

For normal releases, leave this unset so the workflow continues to fail fast on docs-only changes.

### Workflow File

The automation is defined in `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run tests, lint, typecheck
      - Build package
      - Publish to npm (using NPM_TOKEN)
```

## Manual Release Process (Alternative)

If you prefer not to use the automated GitHub Actions workflow, you can use the release script.

### Using the Release Script

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

## NPM Token Setup

For automated publishing via GitHub Actions, an npm authentication token is required.

### For Repository Maintainers

#### 1. Create an npm Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Click your profile icon → "Access Tokens"
3. Click "Generate New Token" → "Granular Access Token"
4. Configure it:
   - **Name**: for example `caloohpay-npm-publish`
   - **Bypass two-factor authentication**: leave **off**. Staging never needs 2FA, and a stage-only token cannot publish directly anyway.
   - **Packages and scopes**: **Read and write (stage only)**, restricted to the `caloohpay` package only. No organisation permissions.
   - **Expiration**: at most 90 days. Set a reminder to rotate it; an expired token makes the workflow fail at the staging step.
5. Copy the generated token (it won't be shown again)

#### 2. Add Token to GitHub Repository

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the token from step 1
6. Click **Add secret**

To avoid leaving the token in shell history or chat, you can instead run `gh secret set NPM_TOKEN` in your own terminal; it prompts for the value.

#### 3. Token Permissions

The `NPM_TOKEN` should have:

- **Read and write (stage only)** access to the `caloohpay` package, and nothing else
- 2FA bypass **off**
- An expiry of 90 days or less

A stage-only token still keeps other package write permissions (such as moving dist-tags and deprecating versions), so keep its scope narrow. `npm publish` with this token fails with `E_STAGE_REQUIRED`; the workflow uses `npm stage publish`. npm plans to end direct publishing with bypass-2FA tokens in January 2027, so avoid those. [Trusted publishing](https://docs.npmjs.com/trusted-publishers) is an alternative that needs no stored token.

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

### `E_STAGE_REQUIRED` Error

The token is stage-only and something ran `npm publish`. In CI the workflow must use `npm stage publish`. If you publish by hand from your own logged-in session (for example `release-and-publish.sh`), use your own login, not the CI token.

### Workflow fails at "Stage package on npm"

Check, in order: the `NPM_TOKEN` secret exists (`gh secret list`), the token has not expired (90 day maximum), and it is scoped to `caloohpay` with **Read and write (stage only)**. Create a new token, update the secret, then re-run the failed job (`gh run rerun <run-id> --failed`).

### The workflow is green but the new version is not on npm

Expected: the workflow only stages the version. Approve it, see [Approving a Staged Release](#approving-a-staged-release).

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

