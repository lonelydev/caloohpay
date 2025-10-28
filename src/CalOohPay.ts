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
import { PagerdutySchedule } from './PagerdutySchedule.js';

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
    .parseSync() as CommandLineOptions;

// Wrap the async call in an IIFE (Immediately Invoked Function Expression)
// to ensure Node.js waits for the async operations to complete
(async () => {
    try {
        await calOohPay(argv);
        process.exit(0); // Explicit success exit
    } catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
    }
})();

/**
 * Converts a single PagerDuty schedule entry into an OnCallUser object.
 * 
 * This helper function creates an OnCallPeriod from the schedule entry's start and end times,
 * then wraps it in an OnCallUser object with the user's information.
 * 
 * @param scheduleEntry - A schedule entry from PagerDuty containing user and time information
 * @param timeZone - The IANA timezone identifier to use for OOH calculations (e.g., 'America/New_York', 'Europe/London')
 * @returns An OnCallUser object containing the user's information and a single OnCallPeriod
 * 
 * @remarks
 * - If the schedule entry has no user information, empty strings are used as defaults
 * - The timezone is critical for accurate out-of-hours (OOH) calculation
 * - The returned OnCallUser will have exactly one OnCallPeriod
 * 
 * @example
 * ```typescript
 * const scheduleEntry = {
 *   start: new Date('2024-01-01T18:00:00Z'),
 *   end: new Date('2024-01-02T09:00:00Z'),
 *   user: { id: 'PXXXXXX', summary: 'John Doe' }
 * };
 * const onCallUser = getOnCallUserFromScheduleEntry(scheduleEntry, 'Europe/London');
 * // Returns OnCallUser with OOH hours calculated for London timezone
 * ```
 * 
 * @see {@link OnCallUser}
 * @see {@link OnCallPeriod}
 * @see {@link ScheduleEntry}
 */
function getOnCallUserFromScheduleEntry(scheduleEntry: ScheduleEntry, timeZone: string): OnCallUser {
    const onCallPeriod = new OnCallPeriod(scheduleEntry.start, scheduleEntry.end, timeZone);
    const onCallUser = new OnCallUser(
        scheduleEntry.user?.id || "",
        scheduleEntry.user?.summary || "", [onCallPeriod]);
    return onCallUser
}

/**
 * Extracts and consolidates on-call users from a PagerDuty final schedule.
 * 
 * This function processes all schedule entries from a PagerDuty final schedule and creates
 * a dictionary of OnCallUser objects, consolidating multiple time periods for the same user
 * into a single OnCallUser with multiple OnCallPeriods.
 * 
 * @param finalSchedule - The final schedule object from PagerDuty containing rendered schedule entries
 * @param timeZone - The IANA timezone identifier to use for OOH calculations across all entries
 * @returns A Record mapping user IDs to OnCallUser objects with their consolidated on-call periods
 * 
 * @remarks
 * Key behaviors:
 * - Multiple schedule entries for the same user are consolidated into one OnCallUser
 * - Each unique user ID becomes a key in the returned Record
 * - If a user appears multiple times, their OnCallPeriods are accumulated
 * - Empty schedule (no entries) returns an empty Record
 * - All periods use the same timezone for consistency
 * 
 * Algorithm:
 * 1. Initialize empty dictionary of users
 * 2. For each schedule entry:
 *    - Convert entry to OnCallUser with single period
 *    - If user already exists, add the new period to their existing periods
 *    - If user is new, add them to the dictionary
 * 3. Return consolidated dictionary
 * 
 * @example
 * ```typescript
 * const finalSchedule = {
 *   rendered_schedule_entries: [
 *     { start: new Date('2024-01-01T18:00:00Z'), end: new Date('2024-01-02T09:00:00Z'),
 *       user: { id: 'USER1', summary: 'John Doe' } },
 *     { start: new Date('2024-01-02T18:00:00Z'), end: new Date('2024-01-03T09:00:00Z'),
 *       user: { id: 'USER1', summary: 'John Doe' } },
 *     { start: new Date('2024-01-03T18:00:00Z'), end: new Date('2024-01-04T09:00:00Z'),
 *       user: { id: 'USER2', summary: 'Jane Smith' } }
 *   ]
 * };
 * const users = extractOnCallUsersFromFinalSchedule(finalSchedule, 'Europe/London');
 * // Returns: { 'USER1': OnCallUser with 2 periods, 'USER2': OnCallUser with 1 period }
 * ```
 * 
 * @see {@link FinalSchedule}
 * @see {@link OnCallUser}
 * @see {@link getOnCallUserFromScheduleEntry}
 */
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

/**
 * Main function to calculate out-of-hours (OOH) on-call payments for PagerDuty schedules.
 * 
 * This asynchronous function orchestrates the entire on-call payment calculation workflow:
 * - Authenticates with PagerDuty API
 * - Fetches schedule data for one or more schedules sequentially
 * - Calculates OOH compensation for each user
 * - Outputs results to console and optionally to CSV file
 * 
 * @param cliOptions - Command line options containing schedule IDs, date range, timezone, and output settings
 * @returns A Promise that resolves when all schedules have been processed
 * 
 * @throws {Error} If API authentication fails, schedule fetch fails, or CSV write fails
 * 
 * @remarks
 * ### Sequential Processing (Race Condition Fix)
 * This function uses `async/await` to process schedules **sequentially** rather than concurrently.
 * This design choice prevents:
 * - Race conditions when writing to the same CSV file
 * - Unpredictable output order
 * - Interleaved console output from multiple schedules
 * 
 * ### Authentication
 * API token is retrieved from:
 * 1. CLI option (`--key` or `-k`) if provided
 * 2. Environment variable `API_TOKEN` otherwise
 * 
 * ### Timezone Handling
 * The effective timezone for OOH calculations is determined by priority:
 * 1. CLI option (`--timeZoneId` or `-t`) if provided (overrides schedule timezone)
 * 2. Schedule's timezone from PagerDuty API
 * 3. 'UTC' as fallback
 * 
 * ### CSV Output
 * If `outputFile` is specified:
 * - Existing file is deleted before processing first schedule
 * - First schedule writes create new file (append=false)
 * - Subsequent schedules append to existing file (append=true)
 * - All schedules write to the same file sequentially
 * 
 * ### Error Handling
 * - Each schedule is processed in a try-catch block
 * - Errors include specific schedule ID for debugging
 * - First error stops processing and propagates to top-level handler
 * - Top-level handler logs error and exits with code 1
 * 
 * @example
 * ```typescript
 * // Process single schedule with default settings
 * await calOohPay({
 *   rotaIds: 'PXXXXXX',
 *   since: '2024-01-01T00:00:00Z',
 *   until: '2024-01-31T23:59:59Z',
 *   timeZoneId: undefined,
 *   key: undefined,
 *   outputFile: undefined
 * });
 * 
 * // Process multiple schedules with CSV output
 * await calOohPay({
 *   rotaIds: 'PXXXXXX,PYYYYYY,PZZZZZZ',
 *   since: '2024-01-01T00:00:00Z',
 *   until: '2024-01-31T23:59:59Z',
 *   timeZoneId: 'Europe/London',
 *   key: 'your-api-token',
 *   outputFile: './output/oncall-payments.csv'
 * });
 * ```
 * 
 * @see {@link CommandLineOptions}
 * @see {@link OnCallPaymentsCalculator}
 * @see {@link CsvWriter}
 * @see {@link extractOnCallUsersFromFinalSchedule}
 * 
 * @since 2.0.0 - Refactored to use async/await for sequential processing
 */
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
        const rotaId = rotaIds[i].trim();
        const isFirstSchedule = i === 0;
        
        try {
            // Fetch schedule data from PagerDuty API using destructuring like the original code
            const { data } = await pagerDutyApi.get(`/schedules/${rotaId}`, {
                data: {
                    overflow: false,
                    since: cliOptions.since,
                    time_zone: cliOptions.timeZoneId,
                    until: cliOptions.until
                }
            });
            
            // Check for API error response
            if (data.error) {
                throw new Error(`PagerDuty API error for schedule ${rotaId}: ${JSON.stringify(data.error)}`);
            }
            
            // PDJS returns: {data, resource, response, next}
            // data contains the full response: { schedule: {...} }
            if (!data.schedule) {
                throw new Error(
                    `Invalid API response for schedule ${rotaId}: Missing 'schedule' property. ` +
                    `Response contains: ${Object.keys(data).join(', ')}`
                );
            }
            
            const scheduleData: PagerdutySchedule = data.schedule;
            
            console.log('-'.repeat(process.stdout.columns || 80));
            console.log("Schedule name: %s", scheduleData.name);
            console.log("Schedule URL: %s", scheduleData.html_url);
            
            // Use CLI timezone if provided, otherwise use schedule's timezone from API
            const effectiveTimeZone = cliOptions.timeZoneId || scheduleData.time_zone || 'UTC';
            console.log("Using timezone: %s", effectiveTimeZone);
            if (cliOptions.timeZoneId && scheduleData.time_zone && cliOptions.timeZoneId !== scheduleData.time_zone) {
                console.log("Note: CLI timezone (%s) overrides schedule timezone (%s)", 
                    cliOptions.timeZoneId, scheduleData.time_zone);
            }
            
            const onCallUsers = extractOnCallUsersFromFinalSchedule(scheduleData.final_schedule, effectiveTimeZone);
            const listOfOnCallUsers = Object.values(onCallUsers);

            const calculator = new OnCallPaymentsCalculator();
            const auditableRecords = calculator.getAuditableOnCallPaymentRecords(listOfOnCallUsers);
            
            // Write to CSV if output file is specified
            if (csvWriter) {
                csvWriter.writeScheduleData(
                    scheduleData.name,
                    scheduleData.html_url,
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

