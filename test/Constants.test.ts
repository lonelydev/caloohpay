import { describe, expect, test } from '@jest/globals';

import {
    CURRENCY_NAME,
    CURRENCY_SYMBOL,
    DEFAULT_TIMEZONE,
    END_OF_WORK_HOUR,
    END_OF_WORK_MINUTE,
    EXAMPLE_TIMEZONES,
    FALLBACK_SCHEDULE_TIMEZONE,
    MILLISECONDS_PER_HOUR,
    MIN_SHIFT_HOURS,
    WEEKDAY_END,
    WEEKDAY_RATE,
    WEEKDAY_START,
    WEEKEND_RATE
} from '@src/Constants';

describe('Constants', () => {
    describe('Compensation Rates', () => {
        test('WEEKDAY_RATE should be 50', () => {
            expect(WEEKDAY_RATE).toBe(50);
        });

        test('WEEKEND_RATE should be 75', () => {
            expect(WEEKEND_RATE).toBe(75);
        });

        test('Weekend rate should be higher than weekday rate', () => {
            expect(WEEKEND_RATE).toBeGreaterThan(WEEKDAY_RATE);
        });
    });

    describe('Timezone Constants', () => {
        test('DEFAULT_TIMEZONE should be UTC', () => {
            expect(DEFAULT_TIMEZONE).toBe('UTC');
        });

        test('FALLBACK_SCHEDULE_TIMEZONE should be Europe/London', () => {
            expect(FALLBACK_SCHEDULE_TIMEZONE).toBe('Europe/London');
        });

        test('EXAMPLE_TIMEZONES should contain valid IANA timezone identifiers', () => {
            expect(EXAMPLE_TIMEZONES).toContain('America/New_York');
            expect(EXAMPLE_TIMEZONES).toContain('Europe/London');
            expect(EXAMPLE_TIMEZONES).toContain('Asia/Tokyo');
        });

        test('EXAMPLE_TIMEZONES should be readonly array', () => {
            expect(Array.isArray(EXAMPLE_TIMEZONES)).toBe(true);
            expect(EXAMPLE_TIMEZONES.length).toBeGreaterThan(0);
        });
    });

    describe('Work Schedule Constants', () => {
        test('END_OF_WORK_HOUR should be 17 (5 PM)', () => {
            expect(END_OF_WORK_HOUR).toBe(17);
        });

        test('END_OF_WORK_MINUTE should be 30', () => {
            expect(END_OF_WORK_MINUTE).toBe(30);
        });

        test('MIN_SHIFT_HOURS should be 6', () => {
            expect(MIN_SHIFT_HOURS).toBe(6);
        });

        test('MIN_SHIFT_HOURS should be positive', () => {
            expect(MIN_SHIFT_HOURS).toBeGreaterThan(0);
        });
    });

    describe('Day Classification Constants', () => {
        test('WEEKDAY_START should be 1 (Monday)', () => {
            expect(WEEKDAY_START).toBe(1);
        });

        test('WEEKDAY_END should be 4 (Thursday)', () => {
            expect(WEEKDAY_END).toBe(4);
        });

        test('WEEKDAY_START should be less than WEEKDAY_END', () => {
            expect(WEEKDAY_START).toBeLessThan(WEEKDAY_END);
        });

        test('Day range should span Monday through Thursday', () => {
            const expectedRange = WEEKDAY_END - WEEKDAY_START + 1;
            expect(expectedRange).toBe(4); // Mon, Tue, Wed, Thu
        });
    });

    describe('Time Conversion Constants', () => {
        test('MILLISECONDS_PER_HOUR should be 3600000', () => {
            expect(MILLISECONDS_PER_HOUR).toBe(60 * 60 * 1000);
            expect(MILLISECONDS_PER_HOUR).toBe(3600000);
        });

        test('MILLISECONDS_PER_HOUR should correctly convert hours to milliseconds', () => {
            const hours = 2;
            const milliseconds = hours * MILLISECONDS_PER_HOUR;
            expect(milliseconds).toBe(7200000);
        });
    });

    describe('Currency Constants', () => {
        test('CURRENCY_SYMBOL should be £', () => {
            expect(CURRENCY_SYMBOL).toBe('£');
        });

        test('CURRENCY_NAME should be GBP', () => {
            expect(CURRENCY_NAME).toBe('GBP');
        });

        test('Currency symbol should be a non-empty string', () => {
            expect(CURRENCY_SYMBOL).toBeTruthy();
            expect(typeof CURRENCY_SYMBOL).toBe('string');
        });

        test('Currency name should be a non-empty string', () => {
            expect(CURRENCY_NAME).toBeTruthy();
            expect(typeof CURRENCY_NAME).toBe('string');
        });
    });

    describe('Constants Integration', () => {
        test('Work schedule constants should form valid time: 17:30', () => {
            const timeString = `${END_OF_WORK_HOUR}:${END_OF_WORK_MINUTE.toString().padStart(2, '0')}`;
            expect(timeString).toBe('17:30');
        });

        test('Compensation calculation formula should be consistent', () => {
            const weekdayHours = 1;
            const weekendHours = 3;
            const expectedTotal = (weekdayHours * WEEKDAY_RATE) + (weekendHours * WEEKEND_RATE);
            expect(expectedTotal).toBe(275); // 1*50 + 3*75
        });

        test('Minimum shift in milliseconds should be calculable', () => {
            const minShiftMs = MIN_SHIFT_HOURS * MILLISECONDS_PER_HOUR;
            expect(minShiftMs).toBe(21600000); // 6 hours in milliseconds
        });
    });
});
