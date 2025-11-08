# CalOohPay API Documentation

Welcome to the CalOohPay API documentation! This documentation is auto-generated from the TypeScript source code and provides comprehensive details about all classes, interfaces, functions, and types used in CalOohPay.

## 📚 About CalOohPay

CalOohPay is a command-line tool that automates the calculation of out-of-hours (OOH) on-call compensation for engineering teams using PagerDuty schedules.

## 🔍 Quick Navigation

### Core Modules

- **[CalOohPay](CalOohPay/README.md)** - Main entry point and CLI orchestration
- **[OnCallPaymentsCalculator](OnCallPaymentsCalculator/README.md)** - Compensation calculation logic
- **[OnCallPeriod](OnCallPeriod/README.md)** - Represents an on-call shift period with OOH detection
- **[OnCallUser](OnCallUser/README.md)** - User model with on-call periods

### Configuration

- **[ConfigLoader](config/ConfigLoader/README.md)** - Loads and validates `.caloohpay.json` config file
- **[RatesConfig](config/RatesConfig/README.md)** - Configuration interfaces for compensation rates

### Data Models

- **[OnCallCompensation](OnCallCompensation/README.md)** - Compensation record for a user
- **[FinalSchedule](FinalSchedule/README.md)** - PagerDuty schedule data structure
- **[ScheduleEntry](ScheduleEntry/README.md)** - Individual schedule entry
- **[PagerdutySchedule](PagerdutySchedule/README.md)** - Schedule interface with timezone
- **[User](User/README.md)** - User interface from PagerDuty
- **[UserOncall](UserOncall/README.md)** - User on-call data structure

### Utilities

- **[CsvWriter](CsvWriter/README.md)** - CSV file generation for payroll systems
- **[DateUtilities](DateUtilities/README.md)** - Date and timezone manipulation functions
- **[EnvironmentController](EnvironmentController/README.md)** - Environment variable management
- **[CommandLineOptions](CommandLineOptions/README.md)** - CLI options interface

## 🚀 Getting Started

### For Users

If you're looking to use CalOohPay as a CLI tool, please refer to the main [README](https://github.com/lonelydev/caloohpay#readme).

### For Developers

This API documentation is useful if you're:

- Contributing to CalOohPay
- Understanding the codebase architecture
- Building integrations or extensions
- Debugging or troubleshooting issues

## 📖 Key Concepts

### Out-of-Hours (OOH) Detection

The core logic for determining if a shift qualifies as out-of-hours is in the `OnCallPeriod` class. A shift is considered OOH if:

1. It spans multiple days (doesn't start and end on the same day)
2. It extends past 17:30 (5:30 PM)
3. It's longer than 6 hours

### Compensation Calculation

Compensation rates can be customized via a `.caloohpay.json` configuration file or use the default rates:

- **Weekdays (Mon-Thu)**: £50 per day (default `WEEKDAY_RATE` constant)
- **Weekends (Fri-Sun)**: £75 per day (default `WEEKEND_RATE` constant)

#### Using Custom Rates

Create a `.caloohpay.json` file in your project root or home directory:

```json
{
  "rates": {
    "weekdayRate": 60,
    "weekendRate": 90,
    "currency": "USD"
  }
}
```

The `OnCallPaymentsCalculator` accepts rates via constructor, allowing you to:

- Use default rates (backward compatible)
- Load custom rates from config file
- Programmatically set rates per calculator instance

See the [Configuration Guide](https://github.com/lonelydev/caloohpay#-compensation-rates) in the README for more details.

### Timezone Support

CalOohPay uses [Luxon](https://moment.github.io/luxon/) for timezone-aware date/time operations. All calculations respect the schedule's timezone from PagerDuty, with optional CLI override support.

## 🏗️ Architecture Overview

```text
CalOohPay (CLI Entry Point)
    ↓
PagerDuty API Client
    ↓
Schedule Data Processing
    ↓
OnCallUser + OnCallPeriod Models
    ↓
OnCallPaymentsCalculator
    ↓
Output (Console + CSV)
```

## 📝 Code Examples

### Calculating Compensation (Default Rates)

```typescript
import { OnCallUser } from './OnCallUser';
import { OnCallPeriod } from './OnCallPeriod';
import { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';

const user = new OnCallUser(
  'user-id',
  'John Doe',
  [
    new OnCallPeriod(
      new Date('2024-08-01T10:00:00'),
      new Date('2024-08-05T10:00:00'),
      'Europe/London'
    )
  ]
);

const calculator = new OnCallPaymentsCalculator();
const compensation = calculator.calculateOnCallPayment(user);
console.log(`Total compensation: £${compensation}`);
```

### Using Custom Rates Programmatically

```typescript
import { ConfigLoader } from './config/ConfigLoader';
import { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';

// Load rates from .caloohpay.json
const loader = new ConfigLoader();
const rates = loader.loadRates();

// Create calculator with custom rates
const calculator = new OnCallPaymentsCalculator(
  rates.weekdayRate,
  rates.weekendRate
);

const compensation = calculator.calculateOnCallPayment(user);
console.log(`Total: ${rates.currency} ${compensation}`);
```

### Generating CSV Reports

```typescript
import { CsvWriter } from './CsvWriter';

const writer = new CsvWriter('./output.csv');
writer.writeScheduleData(
  'Engineering Team',
  'https://example.pagerduty.com/schedules/ABC',
  'Europe/London',
  auditableRecords,
  false
);
```

## 🔗 External Resources

- **Main Repository**: [github.com/lonelydev/caloohpay](https://github.com/lonelydev/caloohpay)
- **Issue Tracker**: [GitHub Issues](https://github.com/lonelydev/caloohpay/issues)
- **PagerDuty API**: [developer.pagerduty.com](https://developer.pagerduty.com/api-reference/)
- **Luxon Documentation**: [moment.github.io/luxon](https://moment.github.io/luxon/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/lonelydev/caloohpay#contributing) for details.

## 📄 License

CalOohPay is licensed under the ISC License. See the [LICENSE](https://github.com/lonelydev/caloohpay/blob/main/LICENSE) file for details.

---

**Documentation Version**: 2.0.0  
**Last Updated**: Auto-generated from source code  
**Generated by**: [TypeDoc](https://typedoc.org/) with [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown)
