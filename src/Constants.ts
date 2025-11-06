/**
 * Application-wide constants for CalOohPay.
 * 
 * This module centralizes all hard-coded values used throughout the application,
 * making them easier to modify and maintain. Changes to business rules or
 * configuration can be made in one place rather than scattered across the codebase.
 * 
 * @category Configuration
 * 
 * @remarks
 * Constants are organized into logical groups:
 * - Compensation rates
 * - Timezone defaults
 * - Work schedule definitions
 * 
 * @example
 * ```typescript
 * import { WEEKDAY_RATE, DEFAULT_TIMEZONE } from './Constants';
 * 
 * const payment = oohDays * WEEKDAY_RATE;
 * const schedule = getSchedule(DEFAULT_TIMEZONE);
 * ```
 */

/**
 * Compensation rate for out-of-hours weekday shifts (Monday-Thursday).
 * Fixed at £50 per OOH weekday.
 * 
 * @constant
 * @type {number}
 */
export const WEEKDAY_RATE = 50;

/**
 * Compensation rate for out-of-hours weekend shifts (Friday-Sunday).
 * Fixed at £75 per OOH weekend day.
 * 
 * Note: Friday is considered a weekend day for compensation purposes.
 * 
 * @constant
 * @type {number}
 */
export const WEEKEND_RATE = 75;

/**
 * Default timezone used when no timezone is specified.
 * Uses UTC as a neutral baseline for global operations.
 * 
 * @constant
 * @type {string}
 */
export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Fallback timezone used in CalOohPay when schedule timezone is not available.
 * 
 * Note: This default may be reviewed for international usage.
 * Consider using UTC for global tools or making this configurable.
 * 
 * @constant
 * @type {string}
 * @deprecated Consider using DEFAULT_TIMEZONE or making timezone explicit
 */
export const FALLBACK_SCHEDULE_TIMEZONE = 'Europe/London';

/**
 * Example timezone identifiers for documentation and testing.
 * These represent common timezones used across different regions.
 * 
 * @constant
 * @type {ReadonlyArray<string>}
 * 
 * @see {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA Time Zone Database}
 */
export const EXAMPLE_TIMEZONES = [
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney',
    'America/Los_Angeles'
] as const;

/**
 * Hour when the standard work day ends (5:30 PM in 24-hour format).
 * Used to determine if shifts qualify as out-of-hours.
 * 
 * @constant
 * @type {number}
 */
export const END_OF_WORK_HOUR = 17;

/**
 * Minute component of end-of-work time (17:30).
 * 
 * @constant
 * @type {number}
 */
export const END_OF_WORK_MINUTE = 30;

/**
 * Minimum shift duration in hours to qualify as out-of-hours work.
 * Shifts shorter than this are not counted for compensation.
 * 
 * @constant
 * @type {number}
 */
export const MIN_SHIFT_HOURS = 6;

/**
 * First day of the week range considered "weekday" for compensation.
 * Monday = 1 in Luxon's day numbering (1-7, where 1 = Monday, 7 = Sunday).
 * 
 * @constant
 * @type {number}
 */
export const WEEKDAY_START = 1; // Monday

/**
 * Last day of the week range considered "weekday" for compensation.
 * Thursday = 4 in Luxon's day numbering.
 * 
 * Note: Friday (5) is considered a weekend day for compensation purposes.
 * 
 * @constant
 * @type {number}
 */
export const WEEKDAY_END = 4; // Thursday (inclusive)

/**
 * Conversion factor: milliseconds per hour.
 * Used for time duration calculations.
 * 
 * @constant
 * @type {number}
 */
export const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * Currency symbol used in CSV output and reports.
 * 
 * @constant
 * @type {string}
 */
export const CURRENCY_SYMBOL = '£';

/**
 * Currency name for documentation purposes.
 * 
 * @constant
 * @type {string}
 */
export const CURRENCY_NAME = 'GBP';
