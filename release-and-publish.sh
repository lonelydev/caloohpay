#!/usr/bin/env bash

# Release and Publish Script for CalOohPay
# Usage: ./release-and-publish.sh <version>
# Example: ./release-and-publish.sh 2.1.0

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

print_error() {
    echo -e "${RED}✖ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

# Check if version argument is provided
if [ -z "$1" ]; then
    print_error "Version number is required"
    echo "Usage: $0 <version>"
    echo "Example: $0 2.1.0"
    exit 1
fi

VERSION=$1

# Validate semantic version format (basic check)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    print_error "Invalid semantic version format: $VERSION"
    echo "Expected format: MAJOR.MINOR.PATCH (e.g., 2.1.0)"
    echo "Or with pre-release: MAJOR.MINOR.PATCH-LABEL (e.g., 2.1.0-beta.1)"
    exit 1
fi

TAG="v$VERSION"

print_info "Starting release process for version $VERSION"
echo ""

# Check if we're on a clean working tree
if ! git diff-index --quiet HEAD --; then
    print_error "Working tree is not clean. Please commit or stash your changes first."
    git status --short
    exit 1
fi

print_success "Working tree is clean"

# Check if package.json version matches
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if [ "$PACKAGE_VERSION" != "$VERSION" ]; then
    print_error "Version mismatch!"
    echo "  package.json version: $PACKAGE_VERSION"
    echo "  Requested version:    $VERSION"
    echo ""
    echo "Please update package.json version to match, then commit before running this script."
    exit 1
fi

print_success "package.json version matches: $VERSION"

# Check if tag already exists locally
if git rev-parse "$TAG" >/dev/null 2>&1; then
    print_error "Tag $TAG already exists locally"
    echo "Use 'git tag -d $TAG' to delete it if you want to recreate it"
    exit 1
fi

# Check if tag already exists on remote
if git ls-remote --tags origin | grep -q "refs/tags/$TAG"; then
    print_error "Tag $TAG already exists on remote"
    exit 1
fi

print_success "Tag $TAG does not exist yet"

# Run tests
print_info "Running tests..."
if ! npm test -- --passWithNoTests; then
    print_error "Tests failed. Aborting release."
    exit 1
fi
print_success "All tests passed"

# Run build
print_info "Running build..."
if ! npm run build; then
    print_error "Build failed. Aborting release."
    exit 1
fi
print_success "Build completed successfully"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Confirm before proceeding
echo ""
print_warning "Ready to release version $VERSION"
echo "  • Create tag: $TAG"
echo "  • Push branch: $CURRENT_BRANCH"
echo "  • Push tag: $TAG to remote"
echo "  • Publish to npm"
echo ""
read -p "Do you want to proceed? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Release cancelled"
    exit 0
fi

# Create annotated tag
print_info "Creating tag $TAG..."
git tag -a "$TAG" -m "Release $VERSION"
print_success "Tag $TAG created"

# Push current branch to remote
print_info "Pushing branch $CURRENT_BRANCH to remote..."
git push origin "$CURRENT_BRANCH"
print_success "Branch pushed to remote"

# Push tag to remote
print_info "Pushing tag $TAG to remote..."
git push origin "$TAG"
print_success "Tag pushed to remote"

# Check if user is logged into npm
print_info "Checking npm authentication..."
if ! npm whoami >/dev/null 2>&1; then
    print_error "You are not logged into npm"
    echo "Please run 'npm login' first, then re-run this script"
    exit 1
fi

NPM_USER=$(npm whoami)
print_success "Logged into npm as: $NPM_USER"

# Publish to npm
print_info "Publishing to npm..."
if npm publish; then
    print_success "Successfully published $VERSION to npm"
else
    print_error "npm publish failed"
    echo ""
    print_warning "The tag has been pushed to GitHub, but npm publish failed."
    print_warning "You may need to publish manually with: npm publish"
    exit 1
fi

# Final success message
echo ""
print_success "Release $VERSION completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "  • Create a GitHub release at: https://github.com/lonelydev/caloohpay/releases/new?tag=$TAG"
echo "  • Check npm package: https://www.npmjs.com/package/caloohpay"
echo ""
