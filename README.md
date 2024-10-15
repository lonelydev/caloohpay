# Introduction

In some organisations, engineers get compensated for going *on-call outside of working hours*.

I have a couple of teams at Kaluza that I look after. Both with at least 4 people on the rota. Similarly, we have an *incident commander* rota. And every month, managers have to fill in a spreadsheet for payroll to account for our OOH (out of hours) on-call so that we all get compensated at the end of the month for on-call. This sounds like a simple thing, and it is. Just that it takes about 5 minutes of reconciliation per team's on-call rota. 
And if your team is geographically distributed, then you probably have more than one sheet to fill as each location might have a different payroll and could even have different on-call rates and maybe they even get compensated an additional amount every time they respond to an actual incident by the hour! Who knows?!

That is a lot of productive minutes lost doing the same thing every month. 1 manager with two teams, could take 10 minutes. So imagine having 24 of them do this monthly! 240 minutes of doing mundane things for the company when that could have been invested in more useful, creative work, like building the next big thing!

That's why I wrote `caloohpay` - a thing that calculates OOH Pay.

## How to get started?

This is a basic [Typescript project that runs on node](https://nodejs.org/en/learn/getting-started/nodejs-with-typescript).

Checkout `package.json` for the `npm` tasks used to build and run the project.

Don't forget to run `npm install` to install all dependencies, including [Pager Duty's JS Client](https://github.com/PagerDuty/pdjs).

1. Clone this repository locally
2. Create `.env` file with the key-value pair for `API_TOKEN` taken from Your Pagerduty Profile > User Settings > Create API User Token

Your `.env` file should look something like this:

```sh
API_TOKEN=u+IrTEYvqbPOc4dMNLyR
```

3. Run `npm install`
4. Run `npm link`
5. Run `caloohpay help`

### Tests with ts-jest

Followed instructions on [jest via ts-jest](https://jestjs.io/docs/getting-started#via-ts-jest).

## PagerDuty API User Token

Login to pagerduty, hover over your profile icon, go to *My Profile*. Then go to *User Settings* where you can see a button that reads, *Create API User Token*. Remember to store the API Key in something like 1Password so that you can retrieve it securely for later. And make sure you don't commit that to your git repository.

## The CLI

```sh
caloohpay [options] <args>

Options:
      --version      Show version number  [boolean]
  -r, --rota-ids     1 scheduleId or multiple scheduleIds separated by comma  [string] [required]
  -t, --timeZoneId   the timezone id of the schedule. Refer https://developer.pagerduty.com/docs/1afe25e9c94cb-types#time-zone for details.  [string]
  -s, --since        start of the schedule period (inclusive) in https://en.wikipedia.org/wiki/ISO_8601 format  [string]
  -u, --until        end of the schedule period (inclusive) in https://en.wikipedia.org/wiki/ISO_8601 format  [string]
  -k, --key          API_TOKEN to override environment variable API_TOKEN.
                     Get your API User token from
                     My Profile -> User Settings -> API Access -> Create New API User Token  [string]
  -o, --output-file  the path to the file where you want the on-call payments table printed  [string]
      --help         Show help  [boolean]

Examples:
  caloohpay -r "PQRSTUV,PSTUVQR,PTUVSQR"                                                Calculates on-call payments for the comma separated pagerduty scheduleIds. The default timezone is the local timezone. The default period is the previous month.
  caloohpay -r "PQRSTUV" -s "2021-08-01T00:00:00+01:00" -u "2021-09-01T10:00:00+01:00"  Calculates on-call payments for the schedules with the given scheduleIds for the month of August 2021.

```

## What works?

The solution currently accepts `rotaIds` and assigns defaults to the start and end dates if it isn't provided: 

- `since` : first day of the previous month with time starting at `00:00:00` in local time
- `until` : first day of the current month with the time `10:00:00` in local time

The latter is set to the value it is to ensure the calculator includes the evening of the last day of the previous month.

## What is to come?

- allow CLI to accept just date in YYYYMMDD format. Allow the script to automatically creates the time range.
- allow weekday and weekends to be configurable
- allow weekday rates and weekend rates to be configurable
- add some colour to console output
- add file generation for output
- make installable package
- host this on our internal developer platform and schedule it to run monthly and create a CSV file of auditable on call payment records and send it to the finance team

## References

- [Time Zones on PagerDuty](https://developer.pagerduty.com/docs/1afe25e9c94cb-types)
- [Time Zones in Javascript](https://stackoverflow.com/a/54500197/2262959)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [ts-node docs](https://typestrong.org/ts-node/docs/)
- [yargs documentation - not beginner friendly](https://yargs.js.org/docs/)
- [Retrieve time zones in nodejs environments](https://stackoverflow.com/a/44096051/2262959)