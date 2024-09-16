# Introduction

In some organisations, engineers get compensated for going *on-call outside of working hours*. I have a couple of teams at Kaluza that I look after. Both with at least 4 people on the rota. We also have an incident commander rota. And every month, us managers have to fill in a spreadsheet for payroll to account for our on-call so that we all get paid at the end of the month for both on-call and our primary job. This sounds like a simple thing, and it is. Just that it takes about 5 minutes per team. If your team is geographically distributed, then you have more than one sheet to fill as each location has a different payroll and on-call rates and things.

## How to get started?

This is a basic [Typescript project that runs on node](https://nodejs.org/en/learn/getting-started/nodejs-with-typescript).

Checkout `package.json` for the `npm` tasks used to build and run the project.

Don't forget to run `npm install` to install all dependencies, including [Pager Duty's JS Client](https://github.com/PagerDuty/pdjs).

## PagerDuty API User Token

Login to pagerduty, hover over your profile icon, go to *My Profile*. Then go to *User Settings* where you can see a button that reads, *Create API User Token*. Remember to store the API Key in something like 1Password so that you can retrieve it securely for later. And make sure you don't commit that to your git repository.
