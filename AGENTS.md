# AGENTS.md

Guide for AI coding agents (Claude Code, Copilot, Codex, Cursor, etc.) working in this repo.
Humans: see [CONTRIBUTING.md](CONTRIBUTING.md) — this file is the condensed, agent-oriented version.

## What this is

`caloohpay` is a TypeScript CLI **and** npm library that calculates out-of-hours (OOH) on-call
compensation from PagerDuty schedules. The calculation core must run in browsers; the CLI,
file I/O and PagerDuty client are Node-only.

## Commands

All commands run from the repo root. Node LTS (CI uses `lts/*`), npm.

| Task | Command | Notes |
| ---- | ------- | ----- |
| Install | `npm ci` | |
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| Lint | `npm run lint` | `npm run lint:ci` additionally fails on warnings |
| Lint autofix | `npm run lint:fix` | |
| All tests | `npm test` | Jest, `--runInBand`, ~3s, no network or token needed |
| One test file | `npx jest test/OnCallPeriod.test.ts` | |
| One test by name | `npx jest -t "should calculate"` | |
| Build | `npm run build` | cleans `dist/`, typechecks, compiles |
| Full gate | `npm run verify` | lint + test + build — run before declaring done |
| API docs | `npm run docs` | TypeDoc → `docs/api/` (gitignored) |
| Run CLI locally | `npm run build && node dist/src/CalOohPay.js --help` | real runs need `API_TOKEN` (see `.env.example`) |

## Layout

```text
src/
  core.ts          # browser-safe public entry  → `caloohpay/core`
  node.ts          # re-exports core + Node-only APIs → `caloohpay/node`
  index.ts         # re-exports node.ts (backward compat) → `caloohpay`
  CalOohPay.ts     # CLI entry (yargs) + calOohPay() orchestration; PagerDuty via @pagerduty/pdjs
  OnCallPeriod.ts  # OOH day counting — the core business rule lives here
  OnCallUser.ts    # user + their periods
  OnCallPaymentsCalculator.ts  # days × rates, auditable records
  Constants.ts     # rates, work-hours cut-off, weekday range, currency
  DateUtilities.ts # timezone conversion, --since/--until coercion
  CsvWriter.ts     # Node-only CSV output
  config/          # RatesConfig (types + DEFAULT_RATES, browser-safe), ConfigLoader (fs, Node-only)
  validation/      # InputValidator
  logger/          # Logger interface, ConsoleLogger, secret masking utils
test/              # Jest specs, mirrors src/; test/integration/ mocks PagerDuty
dist/              # build output — generated, never edit
docs/api/          # TypeDoc output — generated, never edit
```

Data flow (CLI): `CalOohPay.ts` → PagerDuty API → `FinalSchedule` entries → `OnCallUser`/`OnCallPeriod`
→ `OnCallPaymentsCalculator` → console and/or `CsvWriter`.

## Domain rules (don't change without being asked)

Defined in `src/Constants.ts`, applied in `src/OnCallPeriod.ts`:

- A day counts as OOH when the shift on it runs past **17:30** local time into the next day
  **and** is at least **6 hours** long.
- Mon–Thu are **weekdays** (£50); **Fri–Sun are weekend** (£75). Friday being "weekend" is intentional.
- Day evaluation happens in the schedule's IANA timezone (Luxon). DST edge cases are tested.
- Rates are overridable via constructor args or `.caloohpay.json` (cwd, then `~`), see `.caloohpay.json.example`.

## Invariants

1. **`src/core.ts` and anything it imports must stay browser-safe**: no `fs`, `path`, `process`,
   `dotenv`, `yargs`, `@pagerduty/pdjs`. Node-only code is exported from `src/node.ts`.
   `test/BrowserEnvironment.test.ts` and `test/ExportStructure.test.ts` guard this.
2. **Public API changes** (adding/removing exports in `core.ts`/`node.ts`) must update
   `test/ExportStructure.test.ts` / `test/LibraryExports.test.ts`, carry JSDoc with an `@example`,
   and be noted in `CHANGELOG.md`. Removing or renaming an export is a breaking change — ask first.
3. **Never log secrets.** `API_TOKEN` / `--key` must go through `maskCliOptions` / `sanitizeError`
   in `src/logger/utils.ts`. Don't add `console.log` of options, env, or raw API errors.
4. **No `any`.** Strict TypeScript; prefer `readonly`, union/discriminated types, early returns.
5. Inside `src/`, use **relative imports** (`./Foo`), never `src/...`. Tests may import `../src/...`
   or use the `@src/*` Jest alias.
6. Tests must not hit the network. Mock PagerDuty with `jest.spyOn(pdjs, 'api')` as in
   `test/integration/caloohpay.integration.test.ts`. Use `test/doubles/MockLogger.ts` for logging.

## Conventions

- **Tests**: BDD-style names — `describe('given …')` / `it('should …')`, Arrange-Act-Assert.
  Test business logic, public APIs, CLI flows and error paths; skip trivial getters.
  A behaviour change needs a test that fails before and passes after.
- **Style**: async/await only; descriptive errors with context; no silent `catch`;
  comments explain *why*. ESLint flat config is `eslint.config.mjs`.
- **CLI**: exit codes 0 success / 1 error / 130 interrupt; actionable error messages.
- **Dependencies**: keep minimal; prefer Node built-ins; never add Node-only deps to core code paths.
- **Commits**: Conventional Commits, enforced by commitlint (`feat:`, `fix:`, `docs:`, `test:`,
  `refactor:`, `chore:`, optional scope e.g. `fix(csv): …`). Branches: `feat/…`, `fix/…`, `docs/…`.

## Git hooks (Husky)

- `pre-commit`: `npm run lint:fix && npm run typecheck` — **may modify files**; re-stage if it does.
- `pre-push`: `npm run build && npm test`.
- `commit-msg`: commitlint.
Don't bypass with `--no-verify`.

## Don't

- Edit `dist/`, `docs/api/`, or `package-lock.json` by hand.
- Bump `version` in `package.json`, create tags/releases, or run `npm publish` / `release-and-publish.sh`
  unless explicitly asked — release flow is in [PUBLISHING.md](PUBLISHING.md).
- Create `.env` with real tokens or commit one.

## Definition of done

1. `npm run verify` passes (lint, 350+ tests, build).
2. New/changed behaviour has tests; public API changes have JSDoc and a CHANGELOG entry.
3. Docs (README / this file) updated if commands, CLI flags or invariants changed.
