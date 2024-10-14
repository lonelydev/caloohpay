#!/usr/bin/env node
import { api } from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';
import { hideBin } from 'yargs/helpers';
import yargs, { Argv, ArgumentsCamelCase } from "yargs";

dotenv.config();

interface Environment {
    API_TOKEN: string;
}

function sanitiseEnvVariable(envVars: NodeJS.ProcessEnv): Environment {
    if (!envVars.API_TOKEN) {
        throw new Error("API_TOKEN not defined");
    }
    return {
        API_TOKEN: envVars.API_TOKEN,
    };
}

const sanitisedEnvVars: Environment = sanitiseEnvVariable(process.env);

const yargsInstance = yargs(hideBin(process.argv));

const argv: CommandLineOptions = yargsInstance
    .wrap(yargsInstance.terminalWidth())
    .usage('$0 [options] <args>')
    .option('rota-ids', {
        alias: 'r',
        describe: '1 scheduleId or multiple scheduleIds separated by comma',
        type: 'string',
        demandOption: true,
        example: 'R1234567,R7654321'
    })
    .option('since', {
        type: 'string',
        alias: 's',
        description: 'start of the schedule period',
    })
    .default('s', function firstDayOfPreviousMonth(): string {
        let today = new Date();
        return new Date(Date.UTC(today.getUTCFullYear(), (today.getUTCMonth() - 1), 1)).toISOString();
    })
    .option('until', {
        type: 'string',
        alias: 'u',
        description: 'end of the schedule period',
    })
    .default('u', function lastDayOfPreviousMonth(): string {
        let today = new Date();
        return new Date(
            Date.UTC(
                today.getUTCFullYear(),
                today.getUTCMonth(),
                0,
                23,
                59,
                59)
        ).toISOString();
    })
    .option('key', {
        type: 'string',
        demandOption: false,
        alias: 'k',
        description: 'this command line argument API_TOKEN to override environment variable API_TOKEN'
    })
    .option('output-file', {
        type: 'string',
        demandOption: false,
        alias: 'o',
        description: 'the path to the file where you want the on-call payments table printed'
    })
    .option('help', {
        type: 'boolean',
        alias: 'h',
        description: 'Show help'
    })
    .help()
    .check((argv) => {
        if (argv.since && !Date.parse(argv.since)) {
            throw new Error("Invalid date format for since");
        }
        if (argv.until && !Date.parse(argv.until)) {
            throw new Error("Invalid date format for until");
        }
        return true;
    }).argv as CommandLineOptions;

    calOohPay(argv);


interface CommandLineOptions {
    rotaIds: string;
    since: string;
    until: string;
    key: string;
    outputFile: string;
    help: boolean;
}


function calOohPay(cliOptions: CommandLineOptions) {
    const pagerDutyApi = api({ token: sanitisedEnvVars.API_TOKEN });
    console.log("CLI Options: %s", JSON.stringify(cliOptions));
// invoke the pd api to get schedule data
    for (let rotaId of cliOptions.rotaIds.split(',')) {
        console.log(`fetching schedule data for rotaId: ${rotaId}`);
         pagerDutyApi
            .get(`/schedules/${rotaId}`,
                {
                    data: {
                        overflow: false,
                        since: cliOptions.since,
                        time_zone: "Europe/London",
                        until: cliOptions.until
                    }
                }
            ).then(
                ({ data, resource, response, next }) => {
                    console.log("Schedule name: %s", data.schedule.name);
                    console.log("Schedule URL: %s", data.schedule.html_url);
                }
            ).catch(
                (error) => {
                    console.error("Error: %s", error);
                }
            );
    }
}
