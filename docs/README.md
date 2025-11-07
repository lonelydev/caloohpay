# CalOohPay Documentation

This directory contains documentation for CalOohPay.

## 📁 Directory Structure

```
docs/
├── index.md                    # Main documentation homepage
├── api/                        # Auto-generated API documentation (excluded from git)
│   ├── README.md              # API docs entry point
│   ├── CalOohPay/             # Core modules documentation
│   ├── OnCallPaymentsCalculator/
│   ├── CsvWriter/
│   └── ...                    # Other modules
├── v1.0.0-RELEASE.md          # v1.0.0 release documentation
└── v2.0.0-RELEASE.md          # v2.0.0 release documentation
```

## 🚀 Viewing Documentation

### Online (GitHub Pages)

The latest API documentation is automatically deployed to GitHub Pages:

**URL**: https://lonelydev.github.io/caloohpay/

### Locally

Generate and view documentation locally:

```bash
# Generate documentation
npm run docs

# Generate and serve (opens in browser at http://localhost:8080)
npm run docs:serve

# Watch mode (regenerates on file changes)
npm run docs:watch
```

## 🔧 How It Works

### Documentation Generation

1. **TypeDoc** scans the TypeScript source code in `src/`
2. Extracts JSDoc comments, type information, and code structure
3. Generates markdown files in `docs/api/`
4. Excludes test files and private members

### GitHub Pages Deployment

The `.github/workflows/docs.yml` workflow:
1. Triggers on pushes to `main` branch
2. Builds the TypeScript project
3. Generates documentation using TypeDoc
4. Deploys to GitHub Pages

### Configuration

Documentation settings are in `typedoc.json`:
- Entry points: All files in `src/`
- Output directory: `docs/api/`
- Excludes: Tests, node_modules, private members
- Plugins: typedoc-plugin-markdown for markdown output

## ✍️ Writing Documentation

### JSDoc Comments

Add JSDoc comments to your code for better documentation:

```typescript
/**
 * Calculates the total on-call compensation for a user.
 * 
 * @param user - The on-call user with their periods
 * @returns Total compensation in GBP
 * 
 * @example
 * ```typescript
 * const compensation = calculator.calculateOnCallPayment(user);
 * console.log(`Total: £${compensation}`);
 * ```
 */
calculateOnCallPayment(user: OnCallUser): number {
  // Implementation
}
```

### Documentation Tags

Commonly used JSDoc tags:
- `@param` - Parameter description
- `@returns` - Return value description
- `@example` - Usage example
- `@throws` - Exceptions thrown
- `@deprecated` - Mark as deprecated
- `@see` - Cross-reference to related items

## 📝 Updating Documentation

Documentation is automatically regenerated when:

1. Code changes are pushed to `main`
2. The GitHub Actions workflow runs
3. You run `npm run docs` locally

No manual updates to `docs/api/` are needed - it's all automatic!

## 🐛 Troubleshooting

### Documentation Not Updating

1. Check GitHub Actions workflow status
2. Ensure GitHub Pages is enabled in repository settings
3. Verify the workflow has proper permissions

### Local Generation Fails

```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try generating again
npm run docs
```

### Missing Documentation

- Ensure functions/classes have JSDoc comments
- Check that files aren't excluded in `typedoc.json`
- Verify exports are public (not private)

## 📚 Resources

- [TypeDoc Documentation](https://typedoc.org/)
- [JSDoc Reference](https://jsdoc.app/)
- [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

---

**Last Updated**: October 2025  
**Maintained By**: CalOohPay Contributors
