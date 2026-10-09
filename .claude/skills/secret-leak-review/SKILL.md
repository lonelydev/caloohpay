---
name: secret-leak-review
description: Review a diff or the codebase for leaks of the PagerDuty API token (API_TOKEN, --key) through logs, errors, CSV output or committed files. Use on any change touching logging, CLI options, error handling or environment variables.
---

# Secret-leak review

The only secret is the PagerDuty token: `API_TOKEN` env var or `-k/--key` CLI option. The safe paths are in `src/logger/utils.ts`: `maskCliOptions(cliOptions)` and `sanitizeError(error)`, plus the masking in `src/logger/ConsoleLogger.ts`. `sanitiseEnvVariable` in `src/EnvironmentController.ts` validates the token and must never echo it.

## Steps

1. **Scope**: review `git diff main...HEAD` (or the files the user names). For a full audit, review all of `src/`.
2. **Grep for risky sinks**:

   ```bash
   grep -nE "console\.(log|error|warn|info|debug)" src
   grep -nE "process\.env|API_TOKEN|cliOptions|\.key\b" src
   ```

3. **For each hit**, check that what is logged or thrown cannot contain the token:
   - CLI options are logged only through `maskCliOptions`.
   - Caught errors are logged only through `sanitizeError` (PagerDuty client errors can carry request headers).
   - Error messages built from `process.env` or `cliOptions` do not interpolate the token.
   - The token is not written to CSV (`src/CsvWriter.ts`) or any file.
4. **Committed files**: `git ls-files | grep -E "(^|/)\.env"` must list only `.env.example`, and that file must have an empty `API_TOKEN=`. Check the diff for long opaque strings assigned to `API_TOKEN`, `token` or `key`, including in tests and docs.
5. **Tests**: new logging paths need a masking test in the style of `test/ConsoleLoggerMasking.test.ts` / `test/LoggerMasking.test.ts`.
6. **Report** findings as `file:line: sink → why it can leak → suggested fix`. For a broader pass, also run the built-in `/security-review`.
