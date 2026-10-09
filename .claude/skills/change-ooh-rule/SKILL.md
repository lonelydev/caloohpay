---
name: change-ooh-rule
description: Change how out-of-hours on-call compensation is calculated (cut-off time, minimum shift length, weekday/weekend split, default rates). Use for any edit to money-affecting logic in Constants.ts or OnCallPeriod.ts.
---

# Change an out-of-hours rule

Current rules (do not change without being asked):

- A day is OOH when the shift on it runs past **17:30** local time into the next day **and** lasts **at least 6 hours**.
- **Mon–Thu** = weekday (£50). **Fri–Sun** = weekend (£75). Friday as weekend is intentional.
- Days are evaluated in the schedule's IANA timezone (Luxon).

Values live in `src/Constants.ts`; the logic is in `src/OnCallPeriod.ts` (`getOohDaysInPeriod`, `wasPersonOnCallOOH`, `isWeekDay`); payment is in `src/OnCallPaymentsCalculator.ts`.

## Steps

1. **Confirm the intended rule** with the user if the request is ambiguous. This changes people's pay.
2. **Write a failing test first** in `test/OnCallPeriod.test.ts` or `test/OnCallPaymentCalculator.test.ts`. Include at least one timezone case and one DST transition (see `test/TimezoneHandling.test.ts` for the pattern). Run `npx jest <file>` and confirm it fails for the right reason.
3. **Make the change** in `src/Constants.ts` and/or `src/OnCallPeriod.ts`. Keep constants as the single source of truth; do not hard-code numbers in the logic.
4. **Update every place that quotes the numbers**: JSDoc in `Constants.ts`, `OnCallPeriod.ts`, `OnCallPaymentsCalculator.ts`; the rates table in `README.md`; `.caloohpay.json.example` if defaults change.
5. **CHANGELOG.md**: entry under `## [Unreleased]`. A change to computed pay is user-visible; call it out explicitly.
6. **Verify**: `npm run verify`.
