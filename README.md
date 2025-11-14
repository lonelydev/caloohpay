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
- **PagerDuty API User Token** ([How to get one](#📟-pagerduty-api-setup))

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

CalOohPay can also be used as a library in your Node.js applications. See the [API Documentation](https://lonelydev.github.io/caloohpay/) for comprehensive guides and examples including:

- Using custom compensation rates
- Programmatic configuration
- Advanced calculator usage
- Integration examples

Basic example:

```typescript
import { OnCallPaymentsCalculator } from 'caloohpay';

const calculator = new OnCallPaymentsCalculator();
const compensation = calculator.calculateOnCallPayment(user);
```

More details in [OnCallPaymentsCalculator](https://lonelydev.github.io/caloohpay/classes/OnCallPaymentsCalculator.OnCallPaymentsCalculator.htmll) documentation.

## 💰 Compensation Rates

### Default Rates

| Period | Rate |
|--------|------|
| **Weekdays** (Mon-Thu) | £50 per day |
| **Weekends** (Fri-Sun) | £75 per day |

### Customizing Rates

You can customize compensation rates by creating a `.caloohpay.json` file:

```json
{
  "rates": {
    "weekdayRate": 60,
    "weekendRate": 90,
    "currency": "USD"
  }
}
```

The tool searches for this file in:

1. Current working directory (project-specific rates)
2. Home directory `~/.caloohpay.json` (user-wide defaults)
3. Built-in defaults if no config found

Example config file: [.caloohpay.json.example](https://github.com/lonelydev/caloohpay/blob/main/.caloohpay.json.example)

## Development and contributing

Development, testing, contributor workflow and git-hook guidance has moved to [CONTRIBUTING.md](https://github.com/lonelydev/caloohpay/blob/main/CONTRIBUTING.md). Please read that document for detailed setup and contribution instructions, including how to run tests, lint, generate docs, and prepare a pull request.

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

## 📟 PagerDuty API Setup

To fetch schedule data from PagerDuty, you need an **API User Token** that provides the same permissions as your user account.

### Getting Your API Token

1. **Login to PagerDuty**
2. **Navigate to Profile**: Hover over your profile icon → **My Profile**
3. **Access Settings**: Go to **User Settings**
4. **Create Token**: Click **Create API User Token**
5. **Secure Storage**: Store the token securely (e.g., 1Password, environment variable)

⚠️ **Security Warning**: Never commit your API token to version control!

## 📖 CLI Reference

### Quick Reference

```bash
caloohpay -r "SCHEDULE_ID" [options]
```

**Common Options:**

- `-r, --rota-ids` - Schedule ID(s) (required)
- `-s, --since` - Start date (YYYY-MM-DD)
- `-u, --until` - End date (YYYY-MM-DD)
- `-o, --output-file` - Save to CSV file
- `-t, --timeZoneId` - Override timezone
- `-k, --key` - API token override

**Examples:**

```bash
# Basic usage
caloohpay -r "PQRSTUV"

# Multiple schedules to CSV
caloohpay -r "TEAM_A,TEAM_B" -o "./monthly-report.csv"

# Custom date range
caloohpay -r "PQRSTUV" -s "2024-01-01" -u "2024-01-31"
```

## ✅ Current Features

- ✅ **PagerDuty Integration**: Fetches schedules with automatic timezone detection
- ✅ **Multi-Schedule Support**: Process multiple schedules simultaneously
- ✅ **Configurable Rates**: Custom weekday/weekend rates via `.caloohpay.json`
- ✅ **Timezone Support**: Accurate OOH calculations for distributed teams
- ✅ **CSV Export**: Google Sheets compatible payroll files
- ✅ **Comprehensive Testing**: 328+ unit tests with full coverage

### Quick Timezone Example

```bash
# Automatic timezone detection (recommended)
caloohpay -r "SCHEDULE_ID"

# Override timezone if needed
caloohpay -r "SCHEDULE_ID" -t "America/New_York"
```

## 🚧 Development Roadmap

**Recently Completed:**

- ✅ Configurable rates via config file
- ✅ Full timezone support with automatic detection
- ✅ CSV export for payroll systems

**Coming Soon:**

- Enhanced console output with colors
- NPM package distribution
- Automated monthly reporting

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

1. Check the [troubleshooting section](#🔧-troubleshooting)
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
