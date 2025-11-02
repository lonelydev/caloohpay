import {describe, expect, test} from '@jest/globals';

import { convertTimezone } from '../src/DateUtilities';

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