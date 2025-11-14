# Publishing Checklist

This document outlines the steps to publish CalOohPay to npm.

## Pre-Publishing Checklist

- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] TypeScript compiles cleanly (`npm run typecheck`)
- [ ] Version number updated in `package.json`
- [ ] `CHANGELOG.md` updated with changes
- [ ] Documentation is up to date
- [ ] README.md has correct installation instructions
- [ ] All dependencies are up to date
- [ ] Security vulnerabilities checked (`npm audit`)

## Publishing Steps

### 1. Verify Package Contents

```bash
# See what will be published
npm pack --dry-run

# Or actually create a tarball to inspect
npm pack
tar -tzf caloohpay-*.tgz
rm caloohpay-*.tgz
```

## Test local installation

```bash
# Build the package

npm run build

npm link

# Try running it
caloohpay --help

# Unlink when done
npm unlink -g caloohpay

```

## Publish

```bash
npm login
# Enter your npm credentials

# For first publish, use --access public
npm publish --access public
```

## Subsequent publishes

```bash
# Update version first (choose one)
npm version patch  # 2.0.0 -> 2.0.1
npm version minor  # 2.0.0 -> 2.1.0
npm version major  # 2.0.0 -> 3.0.0

# This will:
# 1. Update package.json version
# 2. Create a git commit
# 3. Create a git tag

# Then publish
npm publish

# Push changes and tags to GitHub
git push && git push --tags
```

### Post-Publish

