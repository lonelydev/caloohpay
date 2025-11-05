import {describe, expect, test} from '@jest/globals';

import { coerceSince, coerceUntil, convertTimezone } from '@src/DateUtilities';

describe('DateUtilities.toLocaTzIsoStringWithOffset', () => {
    const testTimezone = 'Europe/London';

    test('should convert UTC date to specified timezone ISO string with timezone offset', () => {
        const dateFromISOStringZ = new Date('2023-10-01T12:00:00Z');
        const testDateConvertedToLondonTz = convertTimezone(dateFromISOStringZ, testTimezone);
        const expectedLondonISOTime = testDateConvertedToLondonTz.toISO();
        expect(expectedLondonISOTime).toBe('2023-10-01T13:00:00.000+01:00');
    });

    test('should handle dates with positive timezone offsets', () => {
        const date = new Date('2023-10-01T12:00:00+02:00');
        const londonTzDate = convertTimezone(date, testTimezone);
        const expectedLondonISOTime = londonTzDate.toISO();
        expect(expectedLondonISOTime).toBe('2023-10-01T11:00:00.000+01:00');
    });

    test('should handle dates with negative timezone offsets', () => {
        const date = new Date('2023-10-01T12:00:00-05:00');
        const londonTzDate = convertTimezone(date, testTimezone);
        const expectedLondonISOTime = londonTzDate.toISO();
        expect(expectedLondonISOTime).toBe('2023-10-01T18:00:00.000+01:00');
    });
});

describe('DateUtilities.coerceSince', () => {
    test('should coerce date string to start of day', () => {
        const result = coerceSince('2024-08-01');
        expect(result).toMatch(/^2024-08-01T00:00:00\.000/);
    });

    test('should coerce ISO datetime to start of day', () => {
        const result = coerceSince('2024-08-01T14:30:00Z');
        expect(result).toMatch(/^2024-08-01T00:00:00\.000/);
    });

    test('should throw error for invalid date format', () => {
        expect(() => coerceSince('invalid-date')).toThrow('Invalid date format: invalid-date');
    });

    test('should throw error for empty string', () => {
        expect(() => coerceSince('')).toThrow('Invalid date format: ');
    });

    test('should throw error with reason for unparseable format', () => {
        expect(() => coerceSince('not-a-date')).toThrow(/Reason:/);
    });

    test('should handle leap year dates', () => {
        const result = coerceSince('2024-02-29');
        expect(result).toMatch(/^2024-02-29T00:00:00\.000/);
    });
});

describe('DateUtilities.coerceUntil', () => {
    test('should coerce date string to end of day', () => {
        const result = coerceUntil('2024-08-31');
        expect(result).toMatch(/^2024-08-31T23:59:59\.999/);
    });

    test('should coerce ISO datetime to end of day', () => {
        const result = coerceUntil('2024-08-31T10:00:00Z');
        expect(result).toMatch(/^2024-08-31T23:59:59\.999/);
    });

    test('should throw error for invalid date format', () => {
        expect(() => coerceUntil('not-a-date')).toThrow('Invalid date format: not-a-date');
    });

    test('should throw error for empty string', () => {
        expect(() => coerceUntil('')).toThrow('Invalid date format: ');
    });

    test('should throw error with reason for unparseable format', () => {
        expect(() => coerceUntil('2024-13-01')).toThrow(/Reason:/);
    });

    test('should handle last day of year', () => {
        const result = coerceUntil('2024-12-31');
        expect(result).toMatch(/^2024-12-31T23:59:59\.999/);
    });
});