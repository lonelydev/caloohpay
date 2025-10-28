#!/usr/bin/env node
import { api } from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';
import { hideBin } from 'yargs/helpers';
import yargs from "yargs";
import { OnCallUser } from './OnCallUser';
import { OnCallPeriod } from './OnCallPeriod';
import { FinalSchedule } from './FinalSchedule';
import { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';
import { ScheduleEntry } from './ScheduleEntry';
import { CommandLineOptions } from './CommandLineOptions.js';
import { Environment, sanitiseEnvVariable } from './EnvironmentController.js';
import { toLocaTzIsoStringWithOffset, coerceSince, coerceUntil} from './DateUtilities.js';
import { DateTime } from "luxon";
import { CsvWriter } from './CsvWriter.js';

dotenv.config();

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
    .option('timeZoneId', {
        type: 'string',
        demandOption: false,
        alias: 't',
        description: 'Override the timezone for OOH calculations. If not specified, uses the schedule\'s timezone from PagerDuty.\n' + 
        'Refer https://developer.pagerduty.com/docs/1afe25e9c94cb-types#time-zone for valid timezone IDs.',
    })
    .option('since', {
        type: 'string',
        alias: 's',
        description: 'start of the schedule period (inclusive).\n' +
        'You can choose to specify this in YYYY-MM-DD format and the default time string "00:00:00" will be appended to it by the program.',
        example: '2021-08-01'
    })
    .default('s', function firstDayOfPreviousMonth(): string {
        const today = new Date();
        return toLocaTzIsoStringWithOffset(new Date(new Date(today.getFullYear(), (today.getMonth() - 1), 1)));
    }, 'the first day of the previous month')
    .option('until', {
        type: 'string',
        alias: 'u',
        description: 'end of the schedule period (inclusive) in https://en.wikipedia.org/wiki/ISO_8601 format' +
        'You can choose to specify this in YYYY-MM-DD format. The default time string "23:59:59" will be appended to it by the program.',
        example: '2021-08-31'
    })
    .default('u', function lastDayOfPreviousMonth(): string {
        const today = new Date();
        return toLocaTzIsoStringWithOffset(new Date(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
                10)
        ));
    }, 'the first day of the this month')
    .option('key', {
        type: 'string',
        demandOption: false,
        alias: 'k',
        description: 'API_TOKEN to override environment variable API_TOKEN.\n' + 
        'Get your API User token from \n' + 
        'My Profile -> User Settings -> API Access -> Create New API User Token'
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
    .example([
        ['caloohpay -r "PQRSTUV,PSTUVQR,PTUVSQR"', 
            'Calculates on-call payments for the comma separated pagerduty scheduleIds.\n'+ 
            'Uses each schedule\'s timezone from PagerDuty. The default period is the previous month.'],
        ['caloohpay -r "PQRSTUV" -s "2021-08-01" -u "2021-09-01"', 
            'Calculates on-call payments for the schedules with the given scheduleIds for the month of August 2021.'],
        ['caloohpay -r "PQRSTUV" -t "America/New_York"', 
            'Overrides the schedule timezone and calculates OOH using America/New_York timezone.'],
    ])
    .help()
    .check((argv) => {
        if (argv.since && !Date.parse(argv.since)) {
            throw new Error("Invalid date format for since");
        }
        if (argv.until && !Date.parse(argv.until)) {
            throw new Error("Invalid date format for until");
        }
        if (argv.since && argv.until && DateTime.fromISO(argv.since) > DateTime.fromISO(argv.until)) {
            throw new Error("Since cannot be greater than Until");
        }
        return true;
    })
    .coerce('since', coerceSince)
    .coerce('until', coerceUntil)
    .argv as CommandLineOptions;

calOohPay(argv).catch((error: Error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

function getOnCallUserFromScheduleEntry(scheduleEntry: ScheduleEntry, timeZone: string): OnCallUser {
    const onCallPeriod = new OnCallPeriod(scheduleEntry.start, scheduleEntry.end, timeZone);
    const onCallUser = new OnCallUser(
        scheduleEntry.user?.id || "",
        scheduleEntry.user?.summary || "", [onCallPeriod]);
    return onCallUser
}

function extractOnCallUsersFromFinalSchedule(finalSchedule: FinalSchedule, timeZone: string): Record<string, OnCallUser> {
    const onCallUsers: Record<string, OnCallUser> = {};
    if (finalSchedule.rendered_schedule_entries) {
        finalSchedule.rendered_schedule_entries.forEach(scheduleEntry => {
            const onCallUser = getOnCallUserFromScheduleEntry(scheduleEntry, timeZone);
            if (onCallUser.id in onCallUsers) {
                onCallUsers[onCallUser.id].addOnCallPeriods(onCallUser.onCallPeriods);
            } else {
                onCallUsers[onCallUser.id] = onCallUser;
            }
        });
    }
    return onCallUsers;
}

async function calOohPay(cliOptions: CommandLineOptions): Promise<void> {
    console.table(cliOptions);
    
    // Get API token from CLI option or environment variable
    const sanitisedEnvVars: Environment = sanitiseEnvVariable(process.env, cliOptions.key);
    const pagerDutyApi = api({ token: sanitisedEnvVars.API_TOKEN });
    
    // Initialize CSV writer if output file is specified
    let csvWriter: CsvWriter | undefined;
    if (cliOptions.outputFile) {
        csvWriter = new CsvWriter(cliOptions.outputFile);
        // Delete existing file to start fresh for this run
        csvWriter.deleteIfExists();
        console.log(`Output will be written to: ${cliOptions.outputFile}`);
    }
    
    const rotaIds = cliOptions.rotaIds.split(',');
    
    // Process schedules sequentially to avoid race conditions
    for (let i = 0; i < rotaIds.length; i++) {
        const rotaId = rotaIds[i];
        const isFirstSchedule = i === 0;
        
        try {
            const { data } = await pagerDutyApi.get(`/schedules/${rotaId}`, {
                data: {
                    overflow: false,
                    since: cliOptions.since,
                    time_zone: cliOptions.timeZoneId,
                    until: cliOptions.until
                }
            });
            
            console.log('-'.repeat(process.stdout.columns || 80));
            console.log("Schedule name: %s", data.schedule.name);
            console.log("Schedule URL: %s", data.schedule.html_url);
            
            // Use CLI timezone if provided, otherwise use schedule's timezone from API
            const effectiveTimeZone = cliOptions.timeZoneId || data.schedule.time_zone || 'UTC';
            console.log("Using timezone: %s", effectiveTimeZone);
            if (cliOptions.timeZoneId && data.schedule.time_zone && cliOptions.timeZoneId !== data.schedule.time_zone) {
                console.log("Note: CLI timezone (%s) overrides schedule timezone (%s)", 
                    cliOptions.timeZoneId, data.schedule.time_zone);
            }
            
            const onCallUsers = extractOnCallUsersFromFinalSchedule(data.schedule.final_schedule, effectiveTimeZone);
            const listOfOnCallUsers = Object.values(onCallUsers);

            const calculator = new OnCallPaymentsCalculator();
            const auditableRecords = calculator.getAuditableOnCallPaymentRecords(listOfOnCallUsers);
            
            // Write to CSV if output file is specified
            if (csvWriter) {
                csvWriter.writeScheduleData(
                    data.schedule.name,
                    data.schedule.html_url,
                    effectiveTimeZone,
                    auditableRecords,
                    !isFirstSchedule // Append for all schedules after the first
                );
            }
            
            // Always output to console as well
            console.log("User, TotalComp, Mon-Thu, Fri-Sun");

            for (const [userId, onCallCompensation] of Object.entries(auditableRecords)) {
                console.log("%s, %d, %d, %d",
                    onCallCompensation.OnCallUser.name,
                    onCallCompensation.totalCompensation,
                    onCallCompensation.OnCallUser.getTotalOohWeekDays(),
                    onCallCompensation.OnCallUser.getTotalOohWeekendDays());
            }
        } catch (error) {
            console.error("Error processing schedule %s: %s", rotaId, error);
            throw error; // Re-throw to be caught by the main error handler
        }
    }
}

