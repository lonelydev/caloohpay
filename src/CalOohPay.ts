#!/usr/bin/env node
import { api } from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { CommandLineOptions } from './CommandLineOptions';
import { ConfigLoader } from './config/ConfigLoader';
import { FALLBACK_SCHEDULE_TIMEZONE } from './Constants';
import { CsvWriter } from './CsvWriter';
import { coerceSince, coerceUntil, toLocaTzIsoStringWithOffset } from './DateUtilities';
import { Environment, sanitiseEnvVariable } from './EnvironmentController';
import { FinalSchedule } from './FinalSchedule';
import { ConsoleLogger } from './logger/ConsoleLogger';
import { Logger } from './logger/Logger';
import { maskCliOptions } from './logger/utils';
import { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';
import { OnCallPeriod } from './OnCallPeriod';
import { OnCallUser } from './OnCallUser';
import { PagerdutySchedule } from './PagerdutySchedule';
import { ScheduleEntry } from './ScheduleEntry';
import { InputValidator } from './validation/InputValidator';

/**
 * PagerDuty API request parameters for schedule queries.
 * 
 * @remarks
 * These parameters are passed to the PagerDuty API when fetching schedule data.
 * The time_zone parameter is optional - if omitted, PagerDuty uses the schedule's
 * default timezone.
 */
interface PagerDutyScheduleParams {
    /** Whether to include overflow schedules */
    overflow: boolean;
    /** Start date/time in ISO 8601 format */
    since: string;
    /** End date/time in ISO 8601 format */
    until: string;
    /** Optional IANA timezone identifier to override schedule's default timezone */
    time_zone?: string;
}

/**
 * Summary result from processing schedules.
 * 
 * @remarks
 * This interface provides aggregate metrics from a calOohPay execution,
 * useful for testing, monitoring, and integration scenarios.
 * 
 * @since 2.1.0
 */
export interface CalOohPayResult {
    /** Number of schedules successfully processed */
    schedulesProcessed: number;
    /** Total number of unique users across all schedules */
    totalUsers: number;
    /** Total compensation amount in GBP across all schedules */
    totalCompensation: number;
}

dotenv.config();

const yargsInstance = yargs(hideBin(process.argv));

// Only parse CLI when executing this file directly. Exporting `calOohPay`
// means tests can import it without triggering CLI parsing.
if (require.main === module) {
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
        .check((argv: Partial<CommandLineOptions>) => {
            // Use centralized validation
            if (argv.since) {
                InputValidator.validateDateString(argv.since as string, 'since');
            }
            if (argv.until) {
                InputValidator.validateDateString(argv.until as string, 'until');
            }
            if (argv.since && argv.until) {
                InputValidator.validateDateRange(argv.since as string, argv.until as string);
            }
            if (argv.rotaIds) {
                InputValidator.validateScheduleIds(argv.rotaIds as string);
            }
            if (argv.timeZoneId) {
                InputValidator.validateTimezone(argv.timeZoneId as string);
            }
            if (argv.outputFile) {
                InputValidator.validateFilePath(argv.outputFile as string);
            }
            return true;
        })
        .coerce('since', coerceSince)
        .coerce('until', coerceUntil)
        .parseSync() as CommandLineOptions;

    (async () => {
        const logger = new ConsoleLogger();
        try {
            await calOohPay(argv, logger);
        } catch (error) {
            // Ensure error is an Error instance for proper logging
            const errorToLog = error instanceof Error ? error : new Error(String(error));
            logger.error(errorToLog);
            process.exitCode = 1;
        }
    })();
}

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
        scheduleEntry.user?.id || '',
        scheduleEntry.user?.summary || '',
        [onCallPeriod]
    );
    return onCallUser;
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
export function extractOnCallUsersFromFinalSchedule(finalSchedule: FinalSchedule, timeZone: string): Record<string, OnCallUser> {
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
 * Builds PagerDuty API request parameters for schedule queries.
 * 
 * @param cliOptions - Command line options containing date range and optional timezone override
 * @returns Request parameters object for PagerDuty API
 * 
 * @remarks
 * The time_zone parameter is only included if explicitly provided by the user via CLI.
 * When omitted, PagerDuty API uses the schedule's default timezone.
 * 
 * @example
 * ```typescript
 * const params = buildScheduleRequestParams({
 *   rotaIds: 'PXXXXXX',
 *   since: '2024-01-01T00:00:00Z',
 *   until: '2024-01-31T23:59:59Z',
 *   timeZoneId: 'America/New_York'
 * });
 * // Returns: { overflow: false, since: '...', until: '...', time_zone: 'America/New_York' }
 * ```
 * 
 * @since 2.1.0
 */
function buildScheduleRequestParams(cliOptions: CommandLineOptions): PagerDutyScheduleParams {
    const params: PagerDutyScheduleParams = {
        overflow: false,
        since: cliOptions.since,
        until: cliOptions.until
    };
    
    // Only include time_zone parameter if user explicitly provided it
    // PagerDuty API will use the schedule's default timezone if this is omitted
    if (cliOptions.timeZoneId) {
        params.time_zone = cliOptions.timeZoneId;
    }
    
    return params;
}

/**
 * Determines the effective timezone for OOH calculations with fallback priority.
 * 
 * @param cliTimezone - Timezone from CLI option (highest priority)
 * @param scheduleTimezone - Timezone from PagerDuty schedule
 * @returns The effective timezone identifier to use for calculations
 * 
 * @remarks
 * Priority order:
 * 1. CLI option (user override) - if provided
 * 2. Schedule's timezone from PagerDuty API - if available
 * 3. Fallback constant (FALLBACK_SCHEDULE_TIMEZONE) - as last resort
 * 
 * @example
 * ```typescript
 * // CLI override takes precedence
 * determineEffectiveTimezone('America/New_York', 'Europe/London')
 * // Returns: 'America/New_York'
 * 
 * // Uses schedule timezone when no CLI override
 * determineEffectiveTimezone(undefined, 'Europe/London')
 * // Returns: 'Europe/London'
 * 
 * // Falls back to constant when neither provided
 * determineEffectiveTimezone(undefined, undefined)
 * // Returns: 'Europe/London' (FALLBACK_SCHEDULE_TIMEZONE)
 * ```
 * 
 * @since 2.1.0
 */
function determineEffectiveTimezone(
    cliTimezone: string | undefined,
    scheduleTimezone: string | undefined
): string {
    return cliTimezone || scheduleTimezone || FALLBACK_SCHEDULE_TIMEZONE;
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
 * @since 2.1.0 - Added optional return type for testing and monitoring
 */
export async function calOohPay(
    cliOptions: CommandLineOptions, 
    logger?: Logger,
    returnResults = false
): Promise<CalOohPayResult | undefined> {
    const log = logger || new ConsoleLogger();
    log.table?.(maskCliOptions(cliOptions));
    
    // Load compensation rates from config file or use defaults
    const configLoader = new ConfigLoader();
    const rates = configLoader.loadRates();
    
    // Get API token from CLI option or environment variable
    const sanitisedEnvVars: Environment = sanitiseEnvVariable(process.env, cliOptions.key);
    
    const pagerDutyApi = api({ token: sanitisedEnvVars.API_TOKEN });
    
    // Initialize CSV writer if output file is specified
    let csvWriter: CsvWriter | undefined;
    if (cliOptions.outputFile) {
        csvWriter = new CsvWriter(cliOptions.outputFile, log);
        // Delete existing file to start fresh for this run
        csvWriter.deleteIfExists();
        log.info(`Output will be written to: ${cliOptions.outputFile}`);
    }
    
    const rotaIds = cliOptions.rotaIds.split(',');
    
    // Track metrics for optional return
    let schedulesProcessed = 0;
    const processedUserIds = new Set<string>();
    let totalCompensation = 0;
    
    // Process schedules sequentially to avoid race conditions
    for (let i = 0; i < rotaIds.length; i++) {
        // eslint-disable-next-line security/detect-object-injection -- i is loop counter, rotaIds is from validated CLI input
        const rotaId = rotaIds[i].trim();
        const isFirstSchedule = i === 0;
        
        try {
            // Build API request parameters using helper function
            const requestParams = buildScheduleRequestParams(cliOptions);
            
            // Fetch schedule data from PagerDuty API using destructuring like the original code
            const { data } = await pagerDutyApi.get(`/schedules/${rotaId}`, {
                data: requestParams
            });
            
            // Check for API error response
            // SECURITY: Sanitize error object to prevent logging sensitive data
            if (data.error) {
                const sanitizedError = {
                    message: data.error.message || 'Unknown error',
                    code: data.error.code || data.error.status || 'unknown',
                    // Exclude any fields that might contain tokens or sensitive data
                };
                throw new Error(`PagerDuty API error for schedule ${rotaId}: ${JSON.stringify(sanitizedError)}`);
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
            
            log.info('-'.repeat(process.stdout.columns || 80));
            log.info(`Schedule name: ${scheduleData.name}`);
            log.info(`Schedule URL: ${scheduleData.html_url}`);
            
            // Determine effective timezone using helper function
            const effectiveTimeZone = determineEffectiveTimezone(
                cliOptions.timeZoneId,
                scheduleData.time_zone
            );
            log.info(`Using timezone: ${effectiveTimeZone}`);
            if (cliOptions.timeZoneId && scheduleData.time_zone && cliOptions.timeZoneId !== scheduleData.time_zone) {
                log.info(`Note: CLI timezone (${cliOptions.timeZoneId}) overrides schedule timezone (${scheduleData.time_zone})`);
            }
            
            const onCallUsers = extractOnCallUsersFromFinalSchedule(scheduleData.final_schedule, effectiveTimeZone);
            const listOfOnCallUsers = Object.values(onCallUsers);

            const calculator = new OnCallPaymentsCalculator(rates.weekdayRate, rates.weekendRate);
            const auditableRecords = calculator.getAuditableOnCallPaymentRecords(listOfOnCallUsers);
            
            // Track metrics for optional return
            schedulesProcessed++;
            for (const [userId, compensation] of Object.entries(auditableRecords)) {
                processedUserIds.add(userId);
                totalCompensation += compensation.totalCompensation;
            }
            
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
            
            // Output summary using logger
            log.info('User, TotalComp, Mon-Thu, Fri-Sun');
            for (const [, onCallCompensation] of Object.entries(auditableRecords)) {
                log.info(`${onCallCompensation.OnCallUser.name}, ${onCallCompensation.totalCompensation}, ${onCallCompensation.OnCallUser.getTotalOohWeekDays()}, ${onCallCompensation.OnCallUser.getTotalOohWeekendDays()}`);
            }
        } catch (error) {
            // Ensure error is an Error instance for proper logging
            const errorToLog = error instanceof Error ? error : new Error(String(error));
            log.error(errorToLog, { scheduleId: rotaId });
            throw error; // Re-throw original error to preserve stack trace
        }
    }
    
    // Return metrics if requested (useful for testing and monitoring)
    if (returnResults) {
        return {
            schedulesProcessed,
            totalUsers: processedUserIds.size,
            totalCompensation
        };
    }
}

// maskCliOptions is provided by ./logger/utils.ts

