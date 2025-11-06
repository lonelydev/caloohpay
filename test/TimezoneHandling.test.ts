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

describe('DST transition edge cases', () => {
    describe('Europe/London DST transitions', () => {
        test('should handle spring forward (GMT to BST) - clocks advance 1 hour', () => {
            // DST starts: Last Sunday in March at 1:00 AM GMT -> 2:00 AM BST
            // March 31, 2024: Clocks spring forward
            const since = new Date('2024-03-29T17:30:00+00:00'); // Friday evening before DST
            const until = new Date('2024-04-01T09:00:00+01:00'); // Monday morning after DST
            const period = new OnCallPeriod(since, until, 'Europe/London');
            
            expect(period.timeZone).toBe('Europe/London');
            // Fri, Sat, Sun (with DST transition), no Monday as ends at 9am
            expect(period.numberOfOohWeekends).toBe(3);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle fall back (BST to GMT) - clocks retreat 1 hour', () => {
            // DST ends: Last Sunday in October at 2:00 AM BST -> 1:00 AM GMT
            // October 27, 2024: Clocks fall back (extra hour)
            const since = new Date('2024-10-25T17:30:00+01:00'); // Friday evening in BST
            const until = new Date('2024-10-28T09:00:00+00:00'); // Monday morning in GMT
            const period = new OnCallPeriod(since, until, 'Europe/London');
            
            expect(period.timeZone).toBe('Europe/London');
            // Fri, Sat, Sun (with DST transition - Sunday is 25 hours long)
            expect(period.numberOfOohWeekends).toBe(3);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle shift spanning midnight during spring forward DST', () => {
            // Shift that spans the actual DST transition hour
            const since = new Date('2024-03-31T00:00:00+00:00'); // Sunday midnight before DST
            const until = new Date('2024-03-31T04:00:00+01:00'); // Sunday 4am after DST (only 3 actual hours)
            const period = new OnCallPeriod(since, until, 'Europe/London');
            
            expect(period.timeZone).toBe('Europe/London');
            // This is a same-day shift, doesn't span to next day, so should not count
            expect(period.numberOfOohWeekends).toBe(0);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle shift ending right at DST transition', () => {
            // Shift ending at the DST transition moment
            const since = new Date('2024-03-30T19:00:00+00:00'); // Saturday evening 7pm
            const until = new Date('2024-03-31T02:00:00+01:00'); // Sunday 2am after DST (6 hours actual)
            const period = new OnCallPeriod(since, until, 'Europe/London');
            
            expect(period.timeZone).toBe('Europe/London');
            expect(period.numberOfOohWeekends).toBe(1); // Saturday
            expect(period.numberOfOohWeekDays).toBe(0);
        });
    });

    describe('America/New_York DST transitions', () => {
        test('should handle spring forward (EST to EDT)', () => {
            // DST starts: Second Sunday in March at 2:00 AM EST -> 3:00 AM EDT
            // March 10, 2024: Clocks spring forward
            const since = new Date('2024-03-08T17:30:00-05:00'); // Friday evening in EST
            const until = new Date('2024-03-11T09:00:00-04:00'); // Monday morning in EDT
            const period = new OnCallPeriod(since, until, 'America/New_York');
            
            expect(period.timeZone).toBe('America/New_York');
            // Fri, Sat, Sun (with DST transition)
            expect(period.numberOfOohWeekends).toBe(3);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle fall back (EDT to EST)', () => {
            // DST ends: First Sunday in November at 2:00 AM EDT -> 1:00 AM EST
            // November 3, 2024: Clocks fall back
            const since = new Date('2024-11-01T17:30:00-04:00'); // Friday evening in EDT
            const until = new Date('2024-11-04T09:00:00-05:00'); // Monday morning in EST
            const period = new OnCallPeriod(since, until, 'America/New_York');
            
            expect(period.timeZone).toBe('America/New_York');
            // Fri, Sat, Sun (with extra hour)
            expect(period.numberOfOohWeekends).toBe(3);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle shift during the repeated hour in fall back', () => {
            // The hour from 1:00 AM to 2:00 AM occurs twice during fall back
            const since = new Date('2024-11-03T00:00:00-04:00'); // Sunday midnight in EDT
            const until = new Date('2024-11-03T03:00:00-05:00'); // Sunday 3am in EST (after transition)
            const period = new OnCallPeriod(since, until, 'America/New_York');
            
            expect(period.timeZone).toBe('America/New_York');
            // Same-day shift, shouldn't count
            expect(period.numberOfOohWeekends).toBe(0);
            expect(period.numberOfOohWeekDays).toBe(0);
        });
    });

    describe('Australia/Melbourne DST transitions (Southern Hemisphere)', () => {
        test('should handle spring forward (AEST to AEDT) in October', () => {
            // DST starts: First Sunday in October at 2:00 AM AEST -> 3:00 AM AEDT
            // October 6, 2024: Clocks spring forward
            const since = new Date('2024-10-04T17:30:00+10:00'); // Friday evening in AEST
            const until = new Date('2024-10-07T09:00:00+11:00'); // Monday morning in AEDT
            const period = new OnCallPeriod(since, until, 'Australia/Melbourne');
            
            expect(period.timeZone).toBe('Australia/Melbourne');
            // Fri, Sat, Sun (with DST transition)
            expect(period.numberOfOohWeekends).toBe(3);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle fall back (AEDT to AEST) in April', () => {
            // DST ends: First Sunday in April at 3:00 AM AEDT -> 2:00 AM AEST
            // April 7, 2024: Clocks fall back (extra hour)
            const since = new Date('2024-04-05T17:30:00+11:00'); // Friday evening in AEDT
            const until = new Date('2024-04-08T09:00:00+10:00'); // Monday morning in AEST
            const period = new OnCallPeriod(since, until, 'Australia/Melbourne');
            
            expect(period.timeZone).toBe('Australia/Melbourne');
            // Fri, Sat, Sun (with extra hour on Sunday)
            expect(period.numberOfOohWeekends).toBe(3);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle multi-week shift in Australia/Melbourne during summer', () => {
            // Long shift during AEDT (summer time)
            const since = new Date('2024-12-20T17:30:00+11:00'); // Friday evening (AEDT)
            const until = new Date('2025-01-03T09:00:00+11:00'); // Friday morning (AEDT)
            const period = new OnCallPeriod(since, until, 'Australia/Melbourne');
            
            expect(period.timeZone).toBe('Australia/Melbourne');
            // Weekends: Fri 20, Sat 21, Sun 22, Fri 27, Sat 28, Sun 29
            // Jan 3 (Fri) is not counted because shift ends at 9am, before 17:30 threshold
            expect(period.numberOfOohWeekends).toBe(6);
            // Weekdays: Mon 23, Tue 24, Wed 25 (Christmas), Thu 26, Mon 30, Tue 31, Wed 1, Thu 2
            expect(period.numberOfOohWeekDays).toBe(8);
        });

        test('should correctly calculate OOH during Australian winter (AEST)', () => {
            // Standard time period (no DST)
            const since = new Date('2024-07-05T17:30:00+10:00'); // Friday evening in AEST
            const until = new Date('2024-07-08T09:00:00+10:00'); // Monday morning in AEST
            const period = new OnCallPeriod(since, until, 'Australia/Melbourne');
            
            expect(period.timeZone).toBe('Australia/Melbourne');
            expect(period.numberOfOohWeekends).toBe(3); // Fri, Sat, Sun
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle shift spanning both October DST transition and weekdays', () => {
            // Shift that includes DST transition and multiple weekdays
            const since = new Date('2024-10-03T17:30:00+10:00'); // Thursday evening before DST
            const until = new Date('2024-10-08T09:00:00+11:00'); // Tuesday morning after DST
            const period = new OnCallPeriod(since, until, 'Australia/Melbourne');
            
            expect(period.timeZone).toBe('Australia/Melbourne');
            // Weekends: Fri 4, Sat 5, Sun 6 (with DST)
            // Note: Thursday is a weekday (Mon-Thu), Friday-Sunday are weekends
            expect(period.numberOfOohWeekends).toBe(3); // Fri, Sat, Sun
            // Weekdays: Thu 3, Mon 7
            expect(period.numberOfOohWeekDays).toBe(2); // Thu, Mon
        });

        test('should handle edge case of New Year spanning DST period', () => {
            // New Year's shift during AEDT
            const since = new Date('2024-12-31T17:30:00+11:00'); // Tuesday evening (AEDT)
            const until = new Date('2025-01-02T09:00:00+11:00'); // Thursday morning (AEDT)
            const period = new OnCallPeriod(since, until, 'Australia/Melbourne');
            
            expect(period.timeZone).toBe('Australia/Melbourne');
            // Tue 31, Wed 1
            expect(period.numberOfOohWeekDays).toBe(2);
            expect(period.numberOfOohWeekends).toBe(0);
        });
    });

    describe('Edge cases around midnight during DST', () => {
        test('should handle shift starting at midnight during spring DST transition', () => {
            // Europe/London: Shift starting right when clocks change
            const since = new Date('2024-03-31T00:00:00+00:00'); // Sunday midnight (before DST)
            const until = new Date('2024-04-01T09:00:00+01:00'); // Monday morning (after DST)
            const period = new OnCallPeriod(since, until, 'Europe/London');
            
            expect(period.timeZone).toBe('Europe/London');
            expect(period.numberOfOohWeekends).toBe(1); // Sunday
            expect(period.numberOfOohWeekDays).toBe(0); // Monday ends too early
        });

        test('should handle very short shift crossing DST boundary', () => {
            // A 3-hour shift that becomes 2 hours due to DST spring forward
            const since = new Date('2024-03-31T00:30:00+00:00'); // Sunday 12:30am before DST
            const until = new Date('2024-03-31T03:30:00+01:00'); // Sunday 3:30am after DST (only 2 real hours)
            const period = new OnCallPeriod(since, until, 'Europe/London');
            
            expect(period.timeZone).toBe('Europe/London');
            // Too short (< 6 hours) and same day
            expect(period.numberOfOohWeekends).toBe(0);
            expect(period.numberOfOohWeekDays).toBe(0);
        });

        test('should handle exactly 6-hour shift during fall back DST (becomes 7 hours)', () => {
            // A shift that's exactly 6 hours by the clock but 7 actual hours due to fall back
            const since = new Date('2024-10-27T00:00:00+01:00'); // Sunday midnight in BST
            const until = new Date('2024-10-27T06:00:00+00:00'); // Sunday 6am in GMT (7 actual hours)
            const period = new OnCallPeriod(since, until, 'Europe/London');
            
            expect(period.timeZone).toBe('Europe/London');
            // Same day shift, shouldn't count even if > 6 hours
            expect(period.numberOfOohWeekends).toBe(0);
            expect(period.numberOfOohWeekDays).toBe(0);
        });
    });
});
