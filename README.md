# CalOohPay - Calculate Out-of-Hours Pay

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PagerDuty](https://img.shields.io/badge/PagerDuty-06AC38?style=flat&logo=pagerduty&logoColor=white)](https://www.pagerduty.com/)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/swcraftsperson)

A command-line tool that automates the calculation of out-of-hours (OOH) on-call compensation for engineering teams using PagerDuty schedules.

## 🚀 What It Does

CalOohPay eliminates the manual work of calculating on-call payments by:
- **Fetching schedule data** directly from PagerDuty API
- **Calculating compensation** based on weekday vs weekend rates
- **Supporting multiple teams** and schedules simultaneously  
- **Providing auditable records** for payroll processing
- **Handling timezone conversions** automatically

### The Problem It Solves

In many organizations, engineers get compensated for going *on-call outside of working hours*. Managers typically spend 5-10 minutes per team each month reconciling on-call rotas for payroll. With multiple teams and distributed locations, this manual process quickly becomes time-consuming and error-prone.

**CalOohPay automates this entire process**, turning hours of manual work into a single command.

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **PagerDuty API User Token** ([How to get one](#-pagerduty-api-setup))

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/lonelydev/caloohpay.git
cd caloohpay

# Install dependencies
npm install

# Build the project
npm run build

# Link globally for CLI usage
npm link
```

### 2. Configuration

Create a `.env` file in the project root:

```bash
# .env
API_TOKEN=your_pagerduty_api_token_here
```

### 3. Basic Usage

#### CLI Usage

```bash
# Get help
caloohpay --help

# Calculate payments for a single schedule (previous month)
caloohpay -r "PQRSTUV"

# Calculate for multiple schedules with custom date range
caloohpay -r "PQRSTUV,PSTUVQR" -s "2024-01-01" -u "2024-01-31"
```

#### Programmatic Usage

CalOohPay can also be used as a library in your Node.js applications:

```typescript
import { OnCallUser, OnCallPeriod, OnCallPaymentsCalculator } from 'caloohpay';

// Create a user with on-call periods
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

// Calculate compensation
const calculator = new OnCallPaymentsCalculator();
const compensation = calculator.calculateOnCallPayment(user);
console.log(`Total compensation: £${compensation}`);
```

See the [API Documentation](https://lonelydev.github.io/caloohpay/) for more details on programmatic usage.

## 💰 Compensation Rates

| Period | Rate | 
|--------|------|
| **Weekdays** (Mon-Thu) | £50 per day |
| **Weekends** (Fri-Sun) | £75 per day |

> **Note**: Compensation rates are defined in `src/Constants.ts` and can be modified there. The calculator references these centralized constants via `WEEKDAY_RATE` and `WEEKEND_RATE`.

npm run dev
npm run docs:serve
npm run docs:watch
## Development and contributing

Development, testing, contributor workflow and git-hook guidance has moved to [CONTRIBUTING.md](CONTRIBUTING.md). Please read that document for detailed setup and contribution instructions, including how to run tests, lint, generate docs, and prepare a pull request.

Note on ESLint configuration: this project uses ESLint v9 with a flat config file located at `eslint.config.cjs` (instead of legacy `.eslintrc.json`). If you need to adjust lint rules or add new shareable configs, update `eslint.config.cjs` and run `npm run lint` to validate your changes.

## 🔧 Troubleshooting

### Common Issues

**"Command not found: caloohpay"**
- Run `npm link` after building
- Restart your terminal
- Check if `dist/src/CalOohPay.js` exists

**"Invalid API Token"**
- Verify your `.env` file contains the correct token
- Ensure no extra spaces or quotes around the token
- Check token permissions in PagerDuty

**"No schedule entries found"**
- Verify the schedule ID is correct
- Check the date range includes on-call periods
- Ensure you have permissions to view the schedule

## 📝 Finding Schedule IDs

Schedule IDs can be found in PagerDuty:
1. Navigate to **People** → **On-Call Schedules**
2. Click on your schedule
3. The ID is in the URL: `https://yourcompany.pagerduty.com/schedules/PQRSTUV`

## 🔑 PagerDuty API Setup

To fetch schedule data from PagerDuty, you need an **API User Token** that provides the same permissions as your user account.

### Getting Your API Token

1. **Login to PagerDuty**
2. **Navigate to Profile**: Hover over your profile icon → **My Profile**
3. **Access Settings**: Go to **User Settings**
4. **Create Token**: Click **Create API User Token**
5. **Secure Storage**: Store the token securely (e.g., 1Password, environment variable)

⚠️ **Security Warning**: Never commit your API token to version control!

## 📖 CLI Reference

### Command Syntax

```bash
caloohpay [options] <args>
```

### Options

| Option | Short | Description | Required | Default |
|--------|-------|-------------|----------|---------|
| `--rota-ids` | `-r` | PagerDuty schedule ID(s), comma-separated | ✅ | - |
| `--timeZoneId` | `-t` | Override schedule timezone for OOH calculations | ❌ | Schedule's timezone from PagerDuty |
| `--since` | `-s` | Start date (YYYY-MM-DD format) | ❌ | First day of previous month |
| `--until` | `-u` | End date (YYYY-MM-DD format) | ❌ | First day of current month |
| `--key` | `-k` | API token override | ❌ | From `.env` file |
| `--output-file` | `-o` | Output file path | ❌ | Console output |
| `--help` | `-h` | Show help | ❌ | - |

### Usage Examples

```bash
# Basic usage - single schedule, previous month
caloohpay -r "PQRSTUV"

# Multiple schedules
caloohpay -r "PQRSTUV,PSTUVQR,PTUVSQR"

# Custom date range
caloohpay -r "PQRSTUV" -s "2024-01-01" -u "2024-01-31"

# Override timezone (useful for distributed teams or testing)
caloohpay -r "PQRSTUV" -t "America/New_York"

# Override API token (useful for CI/CD or multiple accounts)
caloohpay -r "PQRSTUV" -k "your_api_token_here"

# Save to CSV file (Google Sheets compatible)
caloohpay -r "PQRSTUV" -o "./payroll-report.csv"

# Multiple schedules to CSV
caloohpay -r "PQRSTUV,PSTUVQR" -o "./monthly-oncall-report.csv"
```

### Sample Output

```
┌─────────────────┬─────────────────────────────────────┐
│ rotaIds         │ 'PQRSTUV'                           │
│ timeZoneId      │ 'Europe/London'                     │
│ since           │ '2024-10-01T00:00:00.000+01:00'    │
│ until           │ '2024-11-01T10:00:00.000Z'         │
└─────────────────┴─────────────────────────────────────┘
────────────────────────────────────────
Schedule name: Engineering Team Alpha
Schedule URL: https://company.pagerduty.com/schedules/PQRSTUV
Using timezone: Europe/London
User, TotalComp, Mon-Thu, Fri-Sun
John Smith, 275, 3, 2
Jane Doe, 200, 4, 0
Bob Wilson, 150, 3, 0
```

### CSV Output Format

When using the `--output-file` option, CalOohPay generates a Google Sheets compatible CSV file containing all schedule information and compensation data.

#### CSV Structure

```text
Schedule name:,Engineering Team Alpha
Schedule URL:,https://company.pagerduty.com/schedules/PQRSTUV
Using timezone:,Europe/London

User,Total Compensation (£),Weekdays (Mon-Thu),Weekends (Fri-Sun)
John Smith,275,3,2
Jane Doe,200,4,0
Bob Wilson,150,3,0
```

#### Features

- **Google Sheets Compatible**: Open directly in Google Sheets or Excel
- **Multiple Schedules**: When processing multiple schedules, each is appended to the same file
- **Special Character Handling**: Automatically escapes commas, quotes, and newlines in names
- **Payroll Ready**: Format designed for easy import into payroll systems

#### Example Usage

```bash
# Single schedule to CSV
caloohpay -r "PQRSTUV" -o "./august-oncall.csv"

# Multiple schedules to one file
caloohpay -r "TEAM_A,TEAM_B,TEAM_C" -o "./all-teams-august.csv"

# Custom date range with CSV output
caloohpay -r "PQRSTUV" -s "2024-01-01" -u "2024-01-31" -o "./january-oncall.csv"
```

The tool will always output to both the console AND the CSV file, so you can verify the data while generating reports.

## ✅ Current Features

### What Works

- ✅ **Schedule Fetching**: Retrieves data from PagerDuty API
- ✅ **Multi-Schedule Support**: Process multiple schedules simultaneously
- ✅ **Date Range Flexibility**: Custom or automatic date ranges
- ✅ **Full Timezone Support**: Uses schedule timezone from PagerDuty with optional CLI override
- ✅ **Distributed Teams**: Accurate OOH calculations across different timezones
- ✅ **Payment Calculation**: Separate rates for weekdays/weekends
- ✅ **Auditable Output**: User names, total compensation, and day breakdowns
- ✅ **CSV Export**: Google Sheets compatible file output for payroll systems
- ✅ **Comprehensive Testing**: 35 unit tests including timezone and CSV handling

### Default Behavior

- **Since Date**: First day of previous month at `00:00:00` (local time)
- **Until Date**: First day of current month at `10:00:00` (local time)
- **Timezone**: Uses schedule's timezone from PagerDuty API (can be overridden with `--timeZoneId`)
- **Output**: Console table format

> The `until` time is set to 10:00:00 to ensure evening shifts from the last day of the previous month are included.

### Timezone Handling for Distributed Teams

CalOohPay now provides full support for distributed teams working across different timezones:

#### How It Works

1. **Automatic Timezone Detection**: The tool automatically retrieves each schedule's timezone from the PagerDuty API
2. **Accurate OOH Calculations**: All out-of-hours calculations are performed in the schedule's timezone, ensuring correct day/night classification
3. **Optional Override**: Use `--timeZoneId` to override the schedule timezone for testing or special cases

#### Examples

```bash
# Let the tool use the schedule's timezone from PagerDuty (recommended)
caloohpay -r "SCHEDULE_ID"

# Override for a team in New York
caloohpay -r "SCHEDULE_ID" -t "America/New_York"

# Override for a team in Tokyo
caloohpay -r "SCHEDULE_ID" -t "Asia/Tokyo"

# Override for UTC calculations
caloohpay -r "SCHEDULE_ID" -t "UTC"
```

#### Supported Timezones

All IANA timezone identifiers are supported, including:

- `America/New_York`, `America/Los_Angeles`, `America/Chicago`
- `Europe/London`, `Europe/Paris`, `Europe/Berlin`
- `Asia/Tokyo`, `Asia/Singapore`, `Asia/Kolkata`
- `Australia/Sydney`, `Pacific/Auckland`
- And many more...

Refer to [PagerDuty's timezone documentation](https://developer.pagerduty.com/docs/1afe25e9c94cb-types#time-zone) for the complete list.

## 🚧 Development Roadmap

### Completed Features

- [x] **API Key Override**: CLI option `--key` to override API token ✅
- [x] **Full Timezone Support**: Uses schedule timezone from PagerDuty with optional override ✅
- [x] **CSV Output**: Google Sheets compatible file generation for payroll systems ✅

### Planned Features

- [ ] **Configurable Rates**: Custom weekday/weekend rates via config file
- [ ] **Enhanced Output**: Colored console output and better formatting
- [ ] **Package Distribution**: NPM package for easier installation
- [ ] **Automation**: Scheduled monthly runs with automated reporting

### Long-term Vision

- [ ] **Multi-platform Payroll**: Support different payroll systems
- [ ] **Incident Response Bonus**: Additional compensation for actual incident responses
- [ ] **Web Interface**: Simple web UI for non-technical users
- [ ] **Reporting Dashboard**: Historical payment tracking and analytics

## 📚 Technical References

- **[API Documentation](https://lonelydev.github.io/caloohpay/)** - Auto-generated API docs (GitHub Pages)
- [PagerDuty API Documentation](https://developer.pagerduty.com/api-reference/)
- [PagerDuty Time Zones](https://developer.pagerduty.com/docs/1afe25e9c94cb-types#time-zone)
- [Luxon.js Documentation](https://moment.github.io/luxon/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [TypeScript with Node.js](https://nodejs.org/en/learn/getting-started/nodejs-with-typescript)
- [Yargs Command Line Parser](https://yargs.js.org/docs/)

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [issues](https://github.com/lonelydev/caloohpay/issues)
3. Create a new issue with detailed information

## ☕ Sponsor This Project

If CalOohPay has saved you time and made your life easier, consider supporting its development!

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=☕&slug=swcraftsperson&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://buymeacoffee.com/swcraftsperson)

Your support helps me:

- 🚀 Continue developing new features
- 🐛 Fix bugs and improve stability
- 📚 Maintain documentation
- 💡 Explore new ideas and integrations

Every coffee counts and is greatly appreciated! ☕

---

**Made with ❤️ for engineering teams who deserve fair compensation for their on-call dedication.**
