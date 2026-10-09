---
name: add-export
description: Add, change or remove a public export of the caloohpay package (src/core.ts, src/node.ts). Use when a class, function, constant or type becomes part of the public API.
---

# Add or change a public export

Public API = whatever `src/core.ts` (`caloohpay/core`, browser-safe) and `src/node.ts` (`caloohpay/node`, Node-only) export. `src/index.ts` re-exports `node.ts`.

## Steps

1. **Decide the entry point.** If the symbol (or anything it imports) touches `fs`, `path`, `process`, `dotenv`, `yargs` or `@pagerduty/pdjs`, it goes in `src/node.ts`. Otherwise `src/core.ts`. Never import Node-only modules into core.
2. **Removing or renaming an export is a breaking change.** Stop and ask the user before doing it.
3. **Export it** with the same grouped, commented style as the surrounding `export` blocks. Use `export type { … }` for types.
4. **Document it.** JSDoc on the symbol with a description and an `@example`; add `@category` if neighbours use one.
5. **Update the export tests**: `test/ExportStructure.test.ts` and `test/LibraryExports.test.ts`. A core export must also be reachable from `node` and the main index; follow the existing assertions.
6. **Behaviour tests** for the symbol itself, BDD style (`describe('given …')` / `it('should …')`).
7. **CHANGELOG.md**: add an entry under `## [Unreleased]` (Added / Changed / Removed).
8. **Verify**: `npm run verify` must pass. For a core export also run the `browser-safety-check` skill.
