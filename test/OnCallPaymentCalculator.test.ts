import { describe, expect, test } from '@jest/globals';
import { DateTime } from "luxon";

import { OnCallPaymentsCalculator } from '@src/OnCallPaymentsCalculator';
import { OnCallPeriod } from '@src/OnCallPeriod';
import { OnCallUser } from '@src/OnCallUser';

const testTimeZone = 'Europe/London';

describe('understanding luxon', () => {
    test('should be able to use luxon to convert date to specific timezone', () => {
        const luxonDate = DateTime.fromISO('2023-10-01T12:00:00+01:00', { zone: 'Europe/London' });
        const timezone = luxonDate.zoneName;
        const utcDate = luxonDate.setZone('UTC');
        const offset = luxonDate.offset;
        expect(offset).toBe(60);
        expect(timezone).toBe('Europe/London');
        expect(utcDate.toISO()).toBe('2023-10-01T11:00:00.000Z');
    });
});

describe('should calculate the payment for an on call user', () => {
    test('- when person continues to be on-call from end of Month to 12th of subsequent month', () => {
        const luxonSince = DateTime.fromISO('2024-07-31T23:00:00+01:00', { zone: 'Europe/London' });
        const luxonUntil = DateTime.fromISO('2024-08-12T10:00:00+01:00', { zone: 'Europe/London' });
        const since = luxonSince.toJSDate();
        const until = luxonUntil.toJSDate();

        const onCallUser = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(since, until, testTimeZone)
            ]
        );

        const calculator = new OnCallPaymentsCalculator();
        expect(onCallUser.onCallPeriods).toBeDefined();
        expect(onCallUser.onCallPeriods.length).toBe(1);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(6);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(6);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(750);
    });

    test('- when person starts to be on-call from start of Month 10am to 12th of that month', () => {
        const luxonSince = DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' });
        const luxonUntil = DateTime.fromISO('2024-08-12T10:00:00+01:00', { zone: 'Europe/London' });
        const since = luxonSince.toJSDate();
        const until = luxonUntil.toJSDate();
        const onCallUser = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(since, until, testTimeZone)
            ]
        );

        const calculator = new OnCallPaymentsCalculator();
        expect(onCallUser.onCallPeriods).toBeDefined();
        expect(onCallUser.onCallPeriods.length).toBe(1);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(5);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(6);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(700);
    });

    test('- when person starts to be on-call from 28th of August 10am to end of August', () => {

        const since = DateTime.fromISO('2024-08-28T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate();
        const until = DateTime.fromISO('2024-08-31T23:59:59+01:00', { zone: 'Europe/London' }).toJSDate();
        const onCallUser = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(since, until, testTimeZone)
            ]
        );

        const calculator = new OnCallPaymentsCalculator();
        expect(onCallUser.onCallPeriods).toBeDefined();
        expect(onCallUser.onCallPeriods.length).toBe(1);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(2);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(1);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(175);
    });

    test('- when person starts to be on-call from 28th of Month 10am to 2nd of next month', () => {
        const since = DateTime.fromISO('2024-08-28T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate();
        const until = DateTime.fromISO('2024-09-02T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate();
        const onCallUser = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(since, until, testTimeZone)
            ]
        );

        const calculator = new OnCallPaymentsCalculator();
        expect(onCallUser.onCallPeriods).toBeDefined();
        expect(onCallUser.onCallPeriods.length).toBe(1);
        expect(onCallUser.onCallPeriods[0].since).toEqual(since);
        expect(onCallUser.onCallPeriods[0].until).toEqual(until);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(2);
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(3);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(325);
    });

    test('- when multiple people are on-call from start of Month 10am to end of that month', () => {
        const onCallUsers = [
            new OnCallUser(
                '1PF7DNAV',
                'YW Oncall',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T00:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-06T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    ),
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-28T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-09-01T00:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    )
                ]
            ),
            new OnCallUser(
                'PGO3DTM',
                'SK Oncall',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-06T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-15T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                        )
                    ,
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-16T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-21T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    )
                ]
            ),
            new OnCallUser(
                'PINI77A',
                'EG Oncall',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-15T00:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-16T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    )
                ]
            ),
            new OnCallUser(
                'PJXZDBT',
                'CE Oncall',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-21T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-28T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    )
                ]
            )
        ];

        const calculator = new OnCallPaymentsCalculator();
        expect(calculator.calculateOnCallPayments(onCallUsers)).toStrictEqual({
            "1PF7DNAV": 575,
            "PGO3DTM": 850,
            "PINI77A": 50,
            "PJXZDBT": 425,
        });
    });
});

describe('should be able to audit the payment for an on call user', () => {
    test('- when multiple people are on-call from start of Month 10am to end of that month', () => {
        const onCallUsers = [
            new OnCallUser(
                '1PF7DNAV',
                'YW Oncall',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T00:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-06T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    ),
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-28T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-09-01T00:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    )
                ]
            ),
            new OnCallUser(
                'PGO3DTM',
                'SK Oncall',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-06T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-15T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    ),
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-16T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-21T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        testTimeZone
                    )
                ]
            )
        ];

        expect(onCallUsers.length).toBe(2);
        expect(onCallUsers[0].id).toBe('1PF7DNAV');
        expect(onCallUsers[0].getTotalOohWeekDays()).toBe(4);
        const calculator = new OnCallPaymentsCalculator();
        const audit = calculator.getAuditableOnCallPaymentRecords(onCallUsers);
        expect(audit['1PF7DNAV'].OnCallUser.getTotalOohWeekDays()).toBe(4);
        expect(audit['1PF7DNAV'].OnCallUser.getTotalOohWeekendDays()).toBe(5);
        expect(audit['1PF7DNAV'].totalCompensation).toBe(575);
        expect(audit['PGO3DTM'].totalCompensation).toBe(850);
    });
});

describe('DST Transition Edge Cases', () => {
    describe('UK/Europe Summer Time (BST) Transitions', () => {
        test('should handle spring forward DST transition (clocks go forward)', () => {
            // UK clocks go forward on last Sunday of March at 1:00 AM -> 2:00 AM
            // 2024: March 31st, 1:00 AM becomes 2:00 AM
            const since = DateTime.fromISO('2024-03-30T17:30:00Z', { zone: 'Europe/London' }).toJSDate();
            const until = DateTime.fromISO('2024-04-02T09:00:00Z', { zone: 'Europe/London' }).toJSDate();
            
            const onCallUser = new OnCallUser('1', 'DST Spring User', [
                new OnCallPeriod(since, until, 'Europe/London')
            ]);
            
            const calculator = new OnCallPaymentsCalculator();
            // Should count Saturday 30th, Sunday 31st (DST), Monday 1st
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(1); // Monday
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(2); // Sat, Sun
            expect(calculator.calculateOnCallPayment(onCallUser)).toBe(200); // 1*50 + 2*75
        });

        test('should handle fall back DST transition (clocks go back)', () => {
            // UK clocks go back on last Sunday of October at 2:00 AM -> 1:00 AM
            // 2024: October 27th, 2:00 AM becomes 1:00 AM (extra hour)
            const since = DateTime.fromISO('2024-10-26T17:30:00Z', { zone: 'Europe/London' }).toJSDate();
            const until = DateTime.fromISO('2024-10-29T09:00:00Z', { zone: 'Europe/London' }).toJSDate();
            
            const onCallUser = new OnCallUser('1', 'DST Fall User', [
                new OnCallPeriod(since, until, 'Europe/London')
            ]);
            
            const calculator = new OnCallPaymentsCalculator();
            // Should count Saturday 26th, Sunday 27th (DST), Monday 28th
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(1); // Monday
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(2); // Sat, Sun
            expect(calculator.calculateOnCallPayment(onCallUser)).toBe(200); // 1*50 + 2*75
        });

        test('should handle period spanning DST spring transition', () => {
            // Period covering the entire DST transition week
            const since = DateTime.fromISO('2024-03-25T17:30:00Z', { zone: 'Europe/London' }).toJSDate();
            const until = DateTime.fromISO('2024-04-01T09:00:00Z', { zone: 'Europe/London' }).toJSDate();
            
            const onCallUser = new OnCallUser('1', 'DST Span User', [
                new OnCallPeriod(since, until, 'Europe/London')
            ]);
            
            const calculator = new OnCallPaymentsCalculator();
            // Mon 25, Tue 26, Wed 27, Thu 28, Fri 29, Sat 30, Sun 31 (DST)
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(4); // Mon-Thu
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(3); // Fri-Sun
            expect(calculator.calculateOnCallPayment(onCallUser)).toBe(425); // 4*50 + 3*75
        });
    });

    describe('US Daylight Saving Time Transitions', () => {
        test('should handle US spring forward (second Sunday of March)', () => {
            // US clocks go forward on second Sunday of March at 2:00 AM -> 3:00 AM
            // 2024: March 10th
            const since = DateTime.fromISO('2024-03-09T17:30:00-05:00', { zone: 'America/New_York' }).toJSDate();
            const until = DateTime.fromISO('2024-03-12T09:00:00-04:00', { zone: 'America/New_York' }).toJSDate();
            
            const onCallUser = new OnCallUser('1', 'US DST Spring User', [
                new OnCallPeriod(since, until, 'America/New_York')
            ]);
            
            const calculator = new OnCallPaymentsCalculator();
            // Saturday 9th, Sunday 10th (DST), Monday 11th
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(1); // Monday
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(2); // Sat, Sun
            expect(calculator.calculateOnCallPayment(onCallUser)).toBe(200);
        });

        test('should handle US fall back (first Sunday of November)', () => {
            // US clocks go back on first Sunday of November at 2:00 AM -> 1:00 AM
            // 2024: November 3rd
            const since = DateTime.fromISO('2024-11-02T17:30:00-04:00', { zone: 'America/New_York' }).toJSDate();
            const until = DateTime.fromISO('2024-11-05T09:00:00-05:00', { zone: 'America/New_York' }).toJSDate();
            
            const onCallUser = new OnCallUser('1', 'US DST Fall User', [
                new OnCallPeriod(since, until, 'America/New_York')
            ]);
            
            const calculator = new OnCallPaymentsCalculator();
            // Saturday 2nd, Sunday 3rd (DST), Monday 4th
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(1); // Monday
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(2); // Sat, Sun
            expect(calculator.calculateOnCallPayment(onCallUser)).toBe(200);
        });
    });
});

describe('Australia/Melbourne Timezone Edge Cases', () => {
    const melbourneTimeZone = 'Australia/Melbourne';

    test('should calculate payment correctly in Australia/Melbourne timezone', () => {
        // Standard work week in Melbourne (AEST UTC+10)
        const since = DateTime.fromISO('2024-06-03T17:30:00+10:00', { zone: melbourneTimeZone }).toJSDate();
        const until = DateTime.fromISO('2024-06-10T09:00:00+10:00', { zone: melbourneTimeZone }).toJSDate();
        
        const onCallUser = new OnCallUser('1', 'Melbourne User', [
            new OnCallPeriod(since, until, melbourneTimeZone)
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        // Mon 3, Tue 4, Wed 5, Thu 6, Fri 7, Sat 8, Sun 9
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(4); // Mon-Thu
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(3); // Fri-Sun
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(425); // 4*50 + 3*75
    });

    test('should handle Melbourne spring DST transition (clocks go forward)', () => {
        // Melbourne clocks go forward first Sunday of October at 2:00 AM -> 3:00 AM
        // 2024: October 6th, 2:00 AM becomes 3:00 AM
        const since = DateTime.fromISO('2024-10-05T17:30:00+10:00', { zone: melbourneTimeZone }).toJSDate();
        const until = DateTime.fromISO('2024-10-08T09:00:00+11:00', { zone: melbourneTimeZone }).toJSDate();
        
        const onCallUser = new OnCallUser('1', 'Melbourne Spring DST', [
            new OnCallPeriod(since, until, melbourneTimeZone)
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        // Saturday 5th, Sunday 6th (DST), Monday 7th
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(1); // Monday
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(2); // Sat, Sun
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(200);
    });

    test('should handle Melbourne autumn DST transition (clocks go back)', () => {
        // Melbourne clocks go back first Sunday of April at 3:00 AM -> 2:00 AM
        // 2024: April 7th, 3:00 AM becomes 2:00 AM
        const since = DateTime.fromISO('2024-04-06T17:30:00+11:00', { zone: melbourneTimeZone }).toJSDate();
        const until = DateTime.fromISO('2024-04-09T09:00:00+10:00', { zone: melbourneTimeZone }).toJSDate();
        
        const onCallUser = new OnCallUser('1', 'Melbourne Autumn DST', [
            new OnCallPeriod(since, until, melbourneTimeZone)
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        // Saturday 6th, Sunday 7th (DST), Monday 8th
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(1); // Monday
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(2); // Sat, Sun
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(200);
    });

    test('should handle period spanning Melbourne DST transition', () => {
        // Period spanning the October DST transition
        const since = DateTime.fromISO('2024-10-01T17:30:00+10:00', { zone: melbourneTimeZone }).toJSDate();
        const until = DateTime.fromISO('2024-10-08T09:00:00+11:00', { zone: melbourneTimeZone }).toJSDate();
        
        const onCallUser = new OnCallUser('1', 'Melbourne DST Span', [
            new OnCallPeriod(since, until, melbourneTimeZone)
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        // Tue 1, Wed 2, Thu 3, Fri 4, Sat 5, Sun 6 (DST), Mon 7
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(4); // Tue-Thu + Mon
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(3); // Fri-Sun
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(425);
    });

    test('should handle Southern Hemisphere winter (no DST) in Melbourne', () => {
        // Winter period in Melbourne (AEST UTC+10, no DST)
        const since = DateTime.fromISO('2024-07-01T17:30:00+10:00', { zone: melbourneTimeZone }).toJSDate();
        const until = DateTime.fromISO('2024-07-08T09:00:00+10:00', { zone: melbourneTimeZone }).toJSDate();
        
        const onCallUser = new OnCallUser('1', 'Melbourne Winter', [
            new OnCallPeriod(since, until, melbourneTimeZone)
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        // Mon 1, Tue 2, Wed 3, Thu 4, Fri 5, Sat 6, Sun 7
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(4); // Mon-Thu
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(3); // Fri-Sun
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(425);
    });

    test('should handle Southern Hemisphere summer (DST active) in Melbourne', () => {
        // Summer period in Melbourne (AEDT UTC+11, DST active)
        const since = DateTime.fromISO('2024-01-08T17:30:00+11:00', { zone: melbourneTimeZone }).toJSDate();
        const until = DateTime.fromISO('2024-01-15T09:00:00+11:00', { zone: melbourneTimeZone }).toJSDate();
        
        const onCallUser = new OnCallUser('1', 'Melbourne Summer', [
            new OnCallPeriod(since, until, melbourneTimeZone)
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        // Mon 8, Tue 9, Wed 10, Thu 11, Fri 12, Sat 13, Sun 14
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(4); // Mon-Thu
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(3); // Fri-Sun
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(425);
    });

    test('should handle year-end period spanning timezones in Melbourne', () => {
        // New Year period in Melbourne (summer, DST active)
        const since = DateTime.fromISO('2023-12-30T17:30:00+11:00', { zone: melbourneTimeZone }).toJSDate();
        const until = DateTime.fromISO('2024-01-02T09:00:00+11:00', { zone: melbourneTimeZone }).toJSDate();
        
        const onCallUser = new OnCallUser('1', 'Melbourne New Year', [
            new OnCallPeriod(since, until, melbourneTimeZone)
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        // Sat 30, Sun 31, Mon 1
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(1); // Monday
        expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(2); // Sat, Sun
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(200);
    });
});

describe('Cross-timezone Comparison Edge Cases', () => {
    test('should calculate same UTC period differently in different timezones', () => {
        // Same UTC period, different timezone interpretations
        const utcSince = '2024-06-03T07:30:00Z'; // 17:30 UK, 17:30 Melbourne (AEST)
        const utcUntil = '2024-06-09T23:00:00Z';  // 00:00 UK next day, 09:00 Melbourne
        
        const londonUser = new OnCallUser('1', 'London User', [
            new OnCallPeriod(
                DateTime.fromISO(utcSince, { zone: 'Europe/London' }).toJSDate(),
                DateTime.fromISO(utcUntil, { zone: 'Europe/London' }).toJSDate(),
                'Europe/London'
            )
        ]);
        
        const melbourneUser = new OnCallUser('2', 'Melbourne User', [
            new OnCallPeriod(
                DateTime.fromISO(utcSince, { zone: 'Australia/Melbourne' }).toJSDate(),
                DateTime.fromISO(utcUntil, { zone: 'Australia/Melbourne' }).toJSDate(),
                'Australia/Melbourne'
            )
        ]);
        
        const calculator = new OnCallPaymentsCalculator();
        
        // Results may differ due to day boundaries in local timezones
        const londonPayment = calculator.calculateOnCallPayment(londonUser);
        const melbournePayment = calculator.calculateOnCallPayment(melbourneUser);
        
        // Both should have valid payments
        expect(londonPayment).toBeGreaterThan(0);
        expect(melbournePayment).toBeGreaterThan(0);
        
        // Verify the day counts
        expect(londonUser.onCallPeriods[0].numberOfOohWeekDays).toBeDefined();
        expect(melbourneUser.onCallPeriods[0].numberOfOohWeekDays).toBeDefined();
    });
});

describe('Error Handling and Validation', () => {
    const calculator = new OnCallPaymentsCalculator();

    describe('validateOnCallUser', () => {
        test('should throw descriptive error when user is undefined', () => {
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                calculator.calculateOnCallPayment(undefined as any);
            }).toThrow(
                "Cannot calculate payment: OnCallUser is undefined. " +
                "Ensure user object is properly initialized before calling calculation methods."
            );
        });

        test('should throw descriptive error when user has no on-call periods', () => {
            const userWithNoPeriods = new OnCallUser('USER123', 'Test User', []);
            
            expect(() => {
                calculator.calculateOnCallPayment(userWithNoPeriods);
            }).toThrow(
                "Cannot calculate payment for user 'USER123' (Test User): " +
                "No on-call periods defined. User must have at least one OnCallPeriod assigned."
            );
        });

        test('should throw descriptive error for unnamed user with no periods', () => {
            const userWithNoPeriods = new OnCallUser('USER456', '', []);
            
            expect(() => {
                calculator.calculateOnCallPayment(userWithNoPeriods);
            }).toThrow(
                'OnCallUser with id "USER456" is missing required "name" field. ' +
                'Each user must have a displayable name for reporting.'
            );
        });

        test('should include user ID in error message for context', () => {
            const userWithNoPeriods = new OnCallUser('PXXXXXX', 'John Doe', []);
            
            expect(() => {
                calculator.calculateOnCallPayment(userWithNoPeriods);
            }).toThrow(/user 'PXXXXXX'/);
        });

        test('should include user name in error message for context', () => {
            const userWithNoPeriods = new OnCallUser('USER789', 'Jane Smith', []);
            
            expect(() => {
                calculator.calculateOnCallPayment(userWithNoPeriods);
            }).toThrow(/Jane Smith/);
        });
    });

    describe('calculateOnCallPayments batch validation', () => {
        test('should fail fast on first invalid user in batch', () => {
            const validUser = new OnCallUser('USER1', 'Valid User', [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]);
            const invalidUser = new OnCallUser('USER2', 'Invalid User', []);
            
            expect(() => {
                calculator.calculateOnCallPayments([validUser, invalidUser]);
            }).toThrow(/Cannot calculate payment for user 'USER2'/);
        });
    });

    describe('getAuditableOnCallPaymentRecords validation', () => {
        test('should provide clear error for undefined user in audit records', () => {
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                calculator.getAuditableOnCallPaymentRecords([undefined as any]);
            }).toThrow(
                "Cannot calculate payment: OnCallUser is undefined. " +
                "Ensure user object is properly initialized before calling calculation methods."
            );
        });

        test('should provide clear error for user without periods in audit records', () => {
            const userWithNoPeriods = new OnCallUser('AUDIT123', 'Audit User', []);
            
            expect(() => {
                calculator.getAuditableOnCallPaymentRecords([userWithNoPeriods]);
            }).toThrow(
                "Cannot calculate payment for user 'AUDIT123' (Audit User): " +
                "No on-call periods defined. User must have at least one OnCallPeriod assigned."
            );
        });
    });
});
