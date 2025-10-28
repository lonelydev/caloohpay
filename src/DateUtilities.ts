import { DateTime } from 'luxon';

/**
 * Converts a JavaScript Date to an ISO string with timezone offset.
 *
 * This function takes a standard JavaScript `Date` object and returns a string
 * in the ISO 8601 format with the local timezone offset included. The format
 * will be `YYYY-MM-DDTHH:mm:ss±HH:MM`.
 * 
 * Uses Luxon's DateTime for timezone-aware formatting. Falls back to the
 * standard JavaScript toISOString() if Luxon conversion fails.
 *
 * @category Utilities
 * 
 * @param date - The JavaScript Date object to convert
 * @returns ISO 8601 formatted string with timezone offset
 * 
 * @example
 * ```typescript
 * const date = new Date('2024-08-01T14:30:00Z');
 * const isoString = toLocaTzIsoStringWithOffset(date);
 * // Returns: '2024-08-01T14:30:00.000Z' or with local offset like '2024-08-01T15:30:00.000+01:00'
 * ```
 */
export function toLocaTzIsoStringWithOffset(date: Date): string {
    const dt = DateTime.fromJSDate(date);
    return dt.toISO() || date.toISOString();
}

/**
 * Converts a date to a specific timezone and returns a Luxon DateTime.
 *
 * Takes either a JavaScript Date object or an ISO string and converts it to
 * the specified timezone. The returned DateTime object preserves the same
 * moment in time but represents it in the target timezone.
 * 
 * @category Utilities
 *
 * @param date - The date to convert (Date object or ISO string)
 * @param timeZoneId - IANA timezone identifier (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")
 * @returns Luxon DateTime object in the specified timezone
 * 
 * @remarks
 * This function is crucial for accurate OOH calculations as it ensures
 * that "end of work day" (17:30) is evaluated in the schedule's local timezone,
 * not in UTC or the server's timezone.
 * 
 * ### Timezone Handling
 * - Input can be Date or ISO string (both are converted properly)
 * - Output is always a Luxon DateTime for consistent timezone operations
 * - Preserves the exact moment in time (UTC timestamp unchanged)
 * - Only the representation timezone changes
 * 
 * @example
 * ```typescript
 * // Convert UTC time to London time
 * const utcDate = new Date('2024-08-01T16:30:00Z');
 * const londonTime = convertTimezone(utcDate, 'Europe/London');
 * console.log(londonTime.toString()); // Shows as 17:30 in British Summer Time
 * 
 * // Convert ISO string to New York time
 * const nyTime = convertTimezone('2024-08-01T16:30:00Z', 'America/New_York');
 * console.log(nyTime.toString()); // Shows as 12:30 in Eastern Daylight Time
 * ```
 * 
 * @see {@link https://moment.github.io/luxon/#/zones|Luxon Timezone Documentation}
 */
export function convertTimezone(date: Date | string, timeZoneId: string): DateTime {
    const sourceDate = typeof date === "string" ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    return sourceDate.setZone(timeZoneId);
}

/**
 * Coerces a date string to the start of day (midnight) and returns ISO string with timezone.
 *
 * Takes a date string (typically YYYY-MM-DD or ISO format) and normalizes it
 * to the beginning of that day (00:00:00.000). Useful for ensuring date range
 * queries start at the very beginning of the specified date.
 * 
 * @category Utilities
 *
 * @param value - The date string to coerce (ISO format or YYYY-MM-DD)
 * @returns ISO string representing midnight on the specified date
 * 
 * @remarks
 * This function is used in the CLI to normalize the `--since` parameter,
 * ensuring that calculations start at the exact beginning of the day in
 * the schedule's timezone.
 * 
 * ### Behavior
 * - Parses input as ISO string
 * - Sets time to 00:00:00.000 (start of day)
 * - Returns full ISO format with timezone
 * - Falls back to original value if parsing fails
 * 
 * @example
 * ```typescript
 * coerceSince('2024-08-01');
 * // Returns: '2024-08-01T00:00:00.000+01:00' (or relevant timezone)
 * 
 * coerceSince('2024-08-01T14:30:00Z');
 * // Returns: '2024-08-01T00:00:00.000Z'
 * ```
 */
export function coerceSince(value: string): string {
    const dt = DateTime.fromISO(value).startOf('day');
    return dt.toISO() || value;
}

/**
 * Coerces a date string to the end of day (23:59:59.999) and returns ISO string.
 *
 * Takes a date string and normalizes it to the very last millisecond of that day.
 * Ensures that date range queries include all events occurring during the
 * specified end date, up to but not including midnight of the next day.
 * 
 * @category Utilities
 *
 * @param value - The date string to coerce (ISO format or YYYY-MM-DD)
 * @returns ISO string representing the last millisecond of the specified date
 * 
 * @remarks
 * This function is used in the CLI to normalize the `--until` parameter,
 * ensuring that calculations include all shifts ending on the specified date,
 * even those ending at 23:59.
 * 
 * ### Behavior
 * - Parses input as ISO string
 * - Sets time to 23:59:59.999 (end of day)
 * - Returns full ISO format with timezone
 * - Falls back to original value if parsing fails
 * 
 * ### Important for OOH Calculations
 * Using end-of-day ensures that overnight shifts ending early on the
 * final day are still included in the calculation period.
 * 
 * @example
 * ```typescript
 * coerceUntil('2024-08-31');
 * // Returns: '2024-08-31T23:59:59.999+01:00' (or relevant timezone)
 * 
 * coerceUntil('2024-08-31T10:00:00Z');
 * // Returns: '2024-08-31T23:59:59.999Z'
 * ```
 */
export function coerceUntil(value: string): string {
    const dt = DateTime.fromISO(value).endOf('day');
    return dt.toISO() || value;
}