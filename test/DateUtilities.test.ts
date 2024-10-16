import { toLocaTzIsoStringWithOffset } from '../src/DateUtilities';
import {describe, expect, test} from '@jest/globals';

describe('DateUtilities.toLocaTzIsoStringWithOffset', () => {
    test('should convert UTC date to local ISO string with timezone offset', () => {
        const date = new Date('2023-10-01T12:00:00Z');
        const result = toLocaTzIsoStringWithOffset(date);
        const expectedLocalISOTime = '2023-10-01T13:00:00+01:00';
        expect(result).toBe(expectedLocalISOTime);
    });

    test('should handle dates with positive timezone offsets', () => {
        const date = new Date('2023-10-01T12:00:00+02:00');
        const result = toLocaTzIsoStringWithOffset(date);
        const expectedLocalISOTime = '2023-10-01T11:00:00+01:00';
        expect(result).toBe(expectedLocalISOTime);
    });

    test('should handle dates with negative timezone offsets', () => {
        const date = new Date('2023-10-01T12:00:00-05:00');
        const result = toLocaTzIsoStringWithOffset(date);
        const expectedLocalISOTime = '2023-10-01T18:00:00+01:00';
        expect(result).toBe(expectedLocalISOTime);
    });
});