import { DateTime } from 'luxon';

/**
 * Converts a given date to a local ISO string with timezone offset.
 *
 * This function takes a `Date` object and returns a string in the ISO 8601 format
 * with the local timezone offset included. The resulting string will be in the format
 * `YYYY-MM-DDTHH:mm:ss±HH:MM`.
 *
 * @param date - The `Date` object to be converted.
 * @returns A string representing the local ISO time with timezone offset.
 */
export function toLocaTzIsoStringWithOffset(date: Date): string {
    const dt = DateTime.fromJSDate(date);
    return dt.toISO() || date.toISOString();
}

/**
 * Converts a given date to a specified timezone.
 *
 * @param date - The date to be converted. Can be a Date object or a string representing a date.
 * @param timeZoneId - The IANA timezone identifier (e.g., "America/New_York", "Europe/London").
 * @returns A new Date object representing the same moment in time in the specified timezone.
 */
export function convertTimezone(date: Date | string, timeZoneId: string): DateTime {
    const sourceDate = typeof date === "string" ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
    return sourceDate.setZone(timeZoneId);
}

/**
 * Coerces a given date string to a local date with time set to midnight and returns it as an ISO string with timezone offset.
 *
 * @param value - The date string to be coerced.
 * @returns The coerced date as an ISO string with timezone offset.
 */
export function coerceSince(value: string): string {
    const dt = DateTime.fromISO(value).startOf('day');
    return dt.toISO() || value;
}

/**
 * Adjusts the given date string to the end of the day (23:59:59.999) in the local timezone
 * and returns it as an ISO string with timezone offset.
 *
 * @param value - The date string to be adjusted.
 * @returns The adjusted date string in ISO format with timezone offset.
 */
export function coerceUntil(value: string): string {
    const dt = DateTime.fromISO(value).endOf('day');
    return dt.toISO() || value;
}