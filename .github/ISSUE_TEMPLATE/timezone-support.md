---
name: Proper Timezone Support
about: Technical debt - Implement proper timezone handling across the application
title: '[TECH DEBT] Implement proper multi-timezone support'
labels: enhancement, technical-debt
assignees: ''
---

## Problem
Currently, the application uses native JavaScript `Date` operations which depend on the system timezone. Tests pass by forcing `TZ=Europe/London` in CI, but this is not a scalable solution for teams distributed across multiple timezones.

## Current Implementation Issues
- `OnCallPeriod.ts` uses native Date methods (`.getDate()`, `.getDay()`, `.setDate()`)
- Date calculations are timezone-dependent and can shift day boundaries
- CI tests require hardcoded timezone environment variable
- Won't work correctly for teams in different timezones than Europe/London

## Proposed Solutions

### Option 1: Refactor to use Luxon throughout (Recommended)
- Replace all native Date operations in `OnCallPeriod.ts` with Luxon DateTime
- Use timezone-aware date arithmetic
- Accept timezone as parameter in OnCallPeriod constructor
- Maintain timezone context throughout calculations

**Pros:**
- Already using Luxon as dependency
- Explicit timezone handling
- Better developer experience with clearer intent

**Cons:**
- Requires refactoring existing logic
- Need to update tests

### Option 2: Normalize to UTC (Most Robust)
- Convert all input dates to UTC at boundaries
- Perform all calculations in UTC
- Convert to specific timezone only for display/output
- Add timezone parameter to API calls

**Pros:**
- Simplifies internal logic
- Single source of truth
- Industry best practice

**Cons:**
- Larger refactor
- Need to carefully handle timezone conversions at boundaries

### Option 3: Accept timezone parameter
- Keep current implementation but make timezone explicit
- Pass timezone context through the calculation chain
- Use Luxon to convert dates maintaining timezone

## Affected Files
- `src/OnCallPeriod.ts` - Main calculation logic
- `src/OnCallPaymentsCalculator.ts` - Payment calculations
- `src/DateUtilities.ts` - Date helper functions
- `test/OnCallPaymentCalculator.test.ts` - Test suite
- `.github/workflows/main.yml` - CI configuration (remove TZ hardcode)

## Acceptance Criteria
- [ ] All date calculations work correctly regardless of system timezone
- [ ] Tests pass in CI without hardcoded TZ environment variable
- [ ] Support for multiple timezones (not just Europe/London)
- [ ] Clear documentation on timezone handling
- [ ] API accepts timezone parameter for schedule calculations
- [ ] Existing functionality preserved (backward compatible if possible)

## Testing Considerations
- Test with different system timezones (UTC, America/New_York, Asia/Tokyo, etc.)
- Test edge cases around DST transitions
- Test month boundaries in different timezones
- Ensure payment calculations are timezone-accurate

## References
- PagerDuty API timezone handling: https://developer.pagerduty.com/docs/1afe25e9c94cb-types#time-zone
- Luxon documentation: https://moment.github.io/luxon/#/
- Related CI fix: `.github/workflows/main.yml` TZ=Europe/London workaround
