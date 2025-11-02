import { describe, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

import { OnCallPeriod } from '@src/OnCallPeriod';

describe('Timezone handling for distributed teams', () => {
    test('should correctly calculate OOH for a shift in Europe/London timezone', () => {
        // Friday 8pm to Monday 10am in London
        const since = new Date('2024-09-20T20:00:00+01:00');
        const until = new Date('2024-09-23T10:00:00+01:00');
        const period = new OnCallPeriod(since, until, 'Europe/London');
        
        expect(period.timeZone).toBe('Europe/London');
        expect(period.numberOfOohWeekends).toBe(3); // Fri, Sat, Sun
        expect(period.numberOfOohWeekDays).toBe(0);
    });

    test('should correctly calculate OOH for a shift in America/New_York timezone', () => {
        // A shift that spans work hours and evening in New York timezone
        const since = new Date('2024-08-28T10:00:00-04:00'); // Wednesday 10am
        const until = new Date('2024-09-02T10:00:00-04:00'); // Monday 10am
        const period = new OnCallPeriod(since, until, 'America/New_York');
        
        expect(period.timeZone).toBe('America/New_York');
        expect(period.numberOfOohWeekDays).toBe(2); // Wed, Thu
        expect(period.numberOfOohWeekends).toBe(3); // Fri, Sat, Sun
    });

    test('should correctly calculate OOH for a shift in Asia/Tokyo timezone', () => {
        // Test with Tokyo timezone (UTC+9)
        const since = new Date('2024-08-01T10:00:00+09:00');
        const until = new Date('2024-08-12T10:00:00+09:00');
        const period = new OnCallPeriod(since, until, 'Asia/Tokyo');
        
        expect(period.timeZone).toBe('Asia/Tokyo');
        // Aug 1 is Thursday, Aug 12 is Monday
        // Should count Thu, Fri, Sat, Sun, Mon, Tue, Wed, Thu, Fri, Sat, Sun
        expect(period.numberOfOohWeekDays).toBe(5); // Thu, Mon, Tue, Wed, Thu
        expect(period.numberOfOohWeekends).toBe(6); // Fri, Sat, Sun, Fri, Sat, Sun
    });

    test('should use UTC timezone when explicitly specified', () => {
        const since = new Date('2024-09-20T20:00:00Z');
        const until = new Date('2024-09-23T10:00:00Z');
        const period = new OnCallPeriod(since, until, 'UTC');
        
        expect(period.timeZone).toBe('UTC');
        expect(period.numberOfOohWeekends).toBe(3);
        expect(period.numberOfOohWeekDays).toBe(0);
    });

    test('should handle daylight saving time transitions correctly', () => {
        // Test a period that includes DST transition in Europe/London
        // BST to GMT transition typically occurs in late October
        const since = new Date('2024-10-25T10:00:00+01:00'); // Still in BST (Friday)
        const until = new Date('2024-10-28T10:00:00+00:00'); // After GMT transition (Monday)
        const period = new OnCallPeriod(since, until, 'Europe/London');
        
        expect(period.timeZone).toBe('Europe/London');
        // Oct 25 is Friday, Oct 26 is Saturday, Oct 27 is Sunday - all counted
        expect(period.numberOfOohWeekends).toBe(3); // Fri, Sat, Sun
        expect(period.numberOfOohWeekDays).toBe(0);
    });

    test('should correctly identify weekdays vs weekends in different timezones', () => {
        // What is Monday morning in New York is already Monday afternoon in Tokyo
        const nySince = DateTime.fromISO('2024-09-23T00:00:00', { zone: 'America/New_York' });
        const nyUntil = DateTime.fromISO('2024-09-24T10:00:00', { zone: 'America/New_York' });
        
        const nyPeriod = new OnCallPeriod(
            nySince.toJSDate(), 
            nyUntil.toJSDate(), 
            'America/New_York'
        );
        
        expect(nyPeriod.timeZone).toBe('America/New_York');
        expect(nyPeriod.numberOfOohWeekDays).toBe(1); // Monday
        expect(nyPeriod.numberOfOohWeekends).toBe(0);
    });

    test('should default to UTC when no timezone is provided', () => {
        const since = new Date('2024-09-20T20:00:00Z');
        const until = new Date('2024-09-23T10:00:00Z');
        const period = new OnCallPeriod(since, until); // No timezone specified
        
        expect(period.timeZone).toBe('UTC');
    });
});
