---
name: docs-sync
description: Check that README, CONTRIBUTING, AGENTS.md and TypeDoc/JSDoc examples still match the code (exports, commands, config filenames, rates). Use after API, CLI or tooling changes, or before a release.
---

# Docs sync

Docs drift quickly here: this repo once documented `eslint.config.cjs` and `src/pgapi.ts`, neither of which exist.

## Steps

1. **Generate API docs**: `npm run docs`. Fix any TypeDoc warnings about missing or broken `{@link}` references. Output goes to `docs/api/` (gitignored; don't commit it).
2. **Exports vs examples**: for every `import { … } from 'caloohpay…'` in `README.md`, `src/core.ts`, `src/node.ts` and `src/index.ts`, check the symbol is exported from that entry point (core vs node vs main).
3. **CLI flags**: compare the README "CLI Reference" with the yargs options in `src/CalOohPay.ts` / `src/CommandLineOptions.ts` (`npm run build && node dist/src/CalOohPay.js --help`).
4. **Commands and filenames**: every `npm run <script>` mentioned in README, CONTRIBUTING.md, PUBLISHING.md and AGENTS.md exists in `package.json`. Every referenced path exists (`git ls-files | grep <name>`), e.g. `eslint.config.mjs`.
5. **Numbers**: rates, 17:30 cut-off, 6h minimum and Mon–Thu/Fri–Sun split match `src/Constants.ts`. The README's test count should not be stale (`npm test` prints the real total).
6. **Report** each mismatch as `doc:line → actual`, then fix the docs (not the code) unless the code is the bug. Commit as `docs: …`.
