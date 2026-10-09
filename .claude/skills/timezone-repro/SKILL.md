---
name: timezone-repro
description: Turn a timezone or DST bug report (wrong OOH day count or pay for some team or date range) into a failing test, then fix it. Use when on-call results differ by timezone, around clock changes, or at month boundaries.
---

# Reproduce a timezone bug

OOH days are computed per day in the schedule's IANA timezone using Luxon (`OnCallPeriod.getOohDaysInPeriod`). Bugs usually come from day boundaries shifting, DST (23h/25h days), or a wrong zone being applied. The CLI takes the zone from the PagerDuty schedule unless `-t/--timeZoneId` overrides it.

## Steps

1. **Collect the facts** from the report: IANA timezone, shift `since`/`until` as ISO timestamps (with offsets), expected vs actual weekday/weekend OOH counts or amount. Ask for any that are missing; don't guess a timezone.
2. **Write the reproduction as a test** in `test/TimezoneHandling.test.ts` (pure `OnCallPeriod`/`OnCallPaymentsCalculator`, no network). Follow its `DST transition edge cases` structure: one `describe` per zone, explicit UTC instants like `new Date('2024-03-30T18:00:00Z')`, assertions on `numberOfOohWeekDays` and `numberOfOohWeekends`.
3. **Run it** (`npx jest test/TimezoneHandling.test.ts`) and confirm it fails with the reported symptom. If it passes, the bug is elsewhere (schedule zone detection or `-t` override in `src/CalOohPay.ts`, or `convertTimezone` in `src/DateUtilities.ts`); say so and widen the reproduction there.
4. **Fix** in `src/OnCallPeriod.ts` (or `DateUtilities.ts`), keeping the domain rules in `src/Constants.ts` unchanged. See the `change-ooh-rule` skill if a rule itself must change.
5. **Check neighbours**: run a southern-hemisphere zone (`Australia/Melbourne`), a no-DST zone (`Asia/Tokyo`) and a half-hour offset zone through the same case.
6. **Verify** with `npm run verify`, and add a CHANGELOG `Fixed` entry under `[Unreleased]`.
