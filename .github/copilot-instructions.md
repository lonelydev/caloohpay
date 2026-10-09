# Copilot instructions

The full agent guide for this repo is [AGENTS.md](../AGENTS.md) — read it first. Non-negotiables:

- `src/core.ts` and its imports stay browser-safe: no `fs`, `path`, `process`, `dotenv`, `yargs`, `@pagerduty/pdjs`. Node-only code goes through `src/node.ts`.
- Strict TypeScript, no `any`. Relative imports inside `src/`.
- Never log `API_TOKEN` / `--key`; use `maskCliOptions` / `sanitizeError` from `src/logger/utils.ts`.
- Tests are Jest, BDD-named (`given …` / `should …`), and never hit the network (mock `pdjs.api`).
- Public export changes update `test/ExportStructure.test.ts`, JSDoc, and `CHANGELOG.md`.
- Conventional Commits (commitlint-enforced). Run `npm run verify` before finishing.
- Don't edit `dist/` or `docs/api/`; don't bump versions or publish unless asked.
