# Changelog

All notable changes to CalOohPay will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Configurable Compensation Rates**: Support for custom weekday and weekend rates via `.caloohpay.json` configuration file
  - `ConfigLoader` class to load and validate configuration from file system
  - `RatesConfig` interface defining rate structure (weekdayRate, weekendRate, currency)
  - Support for project-level and user-level config file locations
  - Automatic fallback to default rates (£50/£75) when no config file exists
  - Comprehensive validation of rate values with helpful error messages
- **Enhanced OnCallPaymentsCalculator**: Now accepts custom rates via constructor parameters while maintaining backward compatibility with default rates
- **New Validation Methods**: Added `validatePositiveNumber()` and `validateNonEmptyString()` to InputValidator for configuration validation
- Example configuration file: `.caloohpay.json.example`

### Changed

- `OnCallPaymentsCalculator` constructor now accepts optional `weekdayRate` and `weekendRate` parameters
- Updated programmatic API to support custom rates
- Enhanced documentation with configuration guides and examples

## [2.0.0] - 2025-10-25

### 🚀 Major Features

#### Full Timezone Support for Distributed Teams

This release brings comprehensive timezone handling to CalOohPay, making it perfect for distributed teams working across multiple timezones.

**Key Highlights:**
- Automatic timezone detection from PagerDuty schedules
- Optional timezone override via CLI
- Accurate OOH calculations respecting schedule timezones
- Daylight saving time handling
- Support for all IANA timezone identifiers

### Breaking Changes

⚠️ **Important**: This is a major version with breaking changes

- **--timeZoneId behavior changed**: Previously defaulted to local timezone, now optional and overrides schedule timezone from PagerDuty API
- **Default timezone source**: Now uses timezone from PagerDuty schedule instead of local system timezone
- **OnCallPeriod constructor**: Now requires timezone parameter (defaults to 'UTC' if not provided)

#### Migration Guide

If you were relying on the old behavior where calculations used your local timezone:

**Before (v1.0.0):**
```bash
caloohpay -r "SCHEDULE_ID"  # Used local timezone
```

**After (v2.0.0):**
```bash
# Uses schedule's timezone from PagerDuty (recommended)
caloohpay -r "SCHEDULE_ID"

# Or explicitly set to your local timezone if needed
caloohpay -r "SCHEDULE_ID" -t "Europe/London"
```

### Added

- Time zone field in PagerdutySchedule interface to capture timezone from API
- Luxon DateTime integration throughout codebase for timezone-aware operations
- New `timeZone` property in OnCallPeriod class
- 7 new timezone-specific tests in TimezoneHandling.test.ts
- Console output now displays active timezone
- Warning message when CLI timezone overrides schedule timezone
- Comprehensive timezone documentation in README

### Changed

- CommandLineOptions.timeZoneId is now optional
- OnCallPeriod constructor signature: added timezone parameter
- DateUtilities functions now use Luxon instead of native Date
- All date/time calculations are now timezone-aware
- CLI examples updated to reflect new timezone behavior

### Fixed

- OOH calculations now respect schedule timezone for distributed teams
- Accurate day/night classification across timezones
- Proper handling of timezone offsets and DST transitions

### Tests

- Total test count: 27 (up from 20)
- New timezone handling tests: 7
- All tests passing with timezone support
- Added tests for: Europe/London, America/New_York, Asia/Tokyo, UTC, DST transitions

---

## [1.0.0] - 2025-10-25

### 🎉 Initial Stable Release

First stable release of CalOohPay with core functionality for single-timezone teams.

### Features

- **Schedule Fetching**: Retrieve on-call schedules from PagerDuty API
- **Multi-Schedule Support**: Process multiple schedules simultaneously
- **Date Range Flexibility**: Custom or automatic date ranges (defaults to previous month)
- **Payment Calculation**: Separate rates for weekdays (£50) and weekends (£75)
- **Auditable Output**: User names, total compensation, and day breakdowns
- **API Key Override**: Use `--key` option to override environment variable API token
- **Environment Configuration**: Store API token in .env file

### CLI Options

- `--rota-ids` / `-r`: PagerDuty schedule ID(s), comma-separated (required)
- `--since` / `-s`: Start date in YYYY-MM-DD format
- `--until` / `-u`: End date in YYYY-MM-DD format
- `--timeZoneId` / `-t`: Timezone ID (defaults to local timezone in v1.0.0)
- `--key` / `-k`: API token override
- `--output-file` / `-o`: Output file path
- `--help` / `-h`: Show help

### Technical Details

- **Language**: TypeScript
- **Runtime**: Node.js v14+
- **Testing**: Jest with 20 comprehensive tests
- **Date Handling**: Native JavaScript Date objects
- **CLI Framework**: Yargs

### Known Limitations

- Uses local system timezone for all calculations
- Not suitable for distributed teams across multiple timezones
- Single compensation rate structure (not configurable)

---

## Release Notes

### Choosing the Right Version

#### Use v1.0.0 if:
- ✅ Your team works in a single timezone
- ✅ You want stable, tested behavior
- ✅ You don't need PagerDuty schedule timezone integration
- ✅ You prefer simpler timezone handling

#### Use v2.0.0 if:
- ✅ Your team is distributed across multiple timezones
- ✅ You want accurate OOH calculations per schedule timezone
- ✅ You need PagerDuty timezone integration
- ✅ You handle daylight saving time transitions
- ✅ You want the latest features and improvements

### Installation

#### Installing Specific Version

```bash
# Clone the repository
git clone https://github.com/lonelydev/caloohpay.git
cd caloohpay

# For v1.0.0 (stable, single-timezone)
git checkout v1.0.0
npm install
npm run build
npm link

# For v2.0.0 (latest, multi-timezone)
git checkout v2.0.0
npm install
npm run build
npm link
```

### Upgrading from v1.0.0 to v2.0.0

1. **Backup your current setup** (optional but recommended)
2. **Review the breaking changes** section above
3. **Update your scripts** if you relied on local timezone behavior
4. **Test with a single schedule** before processing multiple schedules
5. **Verify output** matches expected timezone behavior

### Support

If you encounter issues with either version:
- Check the version-specific documentation in the README
- Review the [troubleshooting guide](README.md#-troubleshooting)
- Create an issue on [GitHub](https://github.com/lonelydev/caloohpay/issues)

### Future Releases

See the [Development Roadmap](README.md#-development-roadmap) for planned features.

[2.0.0]: https://github.com/lonelydev/caloohpay/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/lonelydev/caloohpay/releases/tag/v1.0.0
