---
name: browser-safety-check
description: Audit that src/core.ts and everything it imports stay browser-safe (no Node-only APIs or dependencies). Read-only. Use after touching core code or adding a core export.
---

# Browser-safety audit for `caloohpay/core`

`src/core.ts` must work in browsers, so it and its transitive imports must not use `fs`, `path`, `os`, `process`, `dotenv`, `yargs` or `@pagerduty/pdjs`. This skill only reports; it does not edit.

## Steps

1. **List the modules reachable from core.** Start at `src/core.ts` and follow each relative import (`./X`, `./dir/X`) recursively. Currently: `Constants`, `config/RatesConfig`, `OnCallPaymentsCalculator`, `OnCallPeriod`, `OnCallUser`, `DateUtilities`, `validation/InputValidator`, and the type-only modules.
2. **Grep that set** for forbidden usage:

   ```bash
   grep -nE "from ['\"](node:)?(fs|path|os|child_process)['\"]|require\(|process\.|from ['\"](dotenv|yargs|@pagerduty/pdjs)['\"]" <files>
   ```

3. **Check for leaks via shared files.** `DateUtilities.ts` is exported to core (`convertTimezone`) but also holds Node-side helpers (`coerceSince`, `coerceUntil`). Make sure nothing Node-only is imported at module top level there.
4. **Run the guard tests**: `npx jest test/BrowserEnvironment.test.ts test/ExportStructure.test.ts`.
5. **Report** each finding as `file:line: what`, plus the module chain from `core.ts` that pulls it in. If clean, say so explicitly.

## Fixing a leak

Move the Node-only symbol to a module that only `src/node.ts` imports, or pass the value in as a parameter. Don't add a runtime `typeof window` guard to paper over it.
