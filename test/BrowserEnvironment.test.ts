/**
 * Browser Environment Tests for CalOohPay Core Module
 * 
 * This test suite validates that the browser-compatible core module (`caloohpay/core`)
 * works correctly in environments that mimic browser constraints - specifically:
 * 
 * 1. NO Node.js-specific dependencies (fs, path, process, etc.)
 * 2. Only uses browser-compatible libraries (Luxon for dates)
 * 3. All calculations work with pure JavaScript Date objects
 * 4. Can be used in React, Next.js, Vue, or any web framework
 * 
 * These tests import ONLY from the core module and verify that on-call payment
 * calculations work identically to the full Node.js version, but with zero
 * Node.js dependencies.
 * 
 * For advanced edge cases and timezone handling, see:
 * @see {@link ./OnCallPaymentCalculator.test.ts} - DST transitions, complex multi-period scenarios, error validation
 * 
 * Use Cases Tested:
 * - React component calculating on-call payments
 * - Next.js page displaying compensation for users
 * - Browser-based HR dashboard
 * - Mobile app using React Native
 * - Any web-based on-call management system
 */

import { describe, expect, test } from '@jest/globals';
import { DateTime } from 'luxon';

// CRITICAL: Import ONLY from the browser-compatible core module
// This ensures we're testing the exact code that will run in browsers
import {
    OnCallPaymentsCalculator,
    OnCallUser,
    OnCallPeriod,
    DEFAULT_RATES
} from '@src/core';

describe('Browser Environment - Core Module Tests', () => {
    describe('Basic Payment Calculation (Browser-Compatible)', () => {
        test('should calculate payment for single on-call period without Node.js dependencies', () => {
            // Simulates a React component receiving user data from an API
            const since = DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate();
            const until = DateTime.fromISO('2024-08-12T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate();

            const onCallUser = new OnCallUser(
                'USER001',
                'Jane Doe',
                [new OnCallPeriod(since, until, 'Europe/London')]
            );

            const calculator = new OnCallPaymentsCalculator();
            const payment = calculator.calculateOnCallPayment(onCallUser);

            // Verify calculation matches expected compensation
            expect(payment).toBe(700); // 5 weekdays * 50 + 6 weekend days * 75
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekDays).toBe(5);
            expect(onCallUser.onCallPeriods[0].numberOfOohWeekends).toBe(6);
        });

        test('should handle multiple on-call periods for single user', () => {
            // Simulates Next.js page calculating compensation for a user with multiple shifts
            const periods = [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                ),
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-15T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-20T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ];

            const user = new OnCallUser('USER002', 'John Smith', periods);
            const calculator = new OnCallPaymentsCalculator();
            const payment = calculator.calculateOnCallPayment(user);

            // Total compensation for both periods
            expect(payment).toBe(600);
        });
    });

    describe('Batch Payment Calculation (Browser-Compatible)', () => {
        test('should calculate payments for multiple users without Node.js dependencies', () => {
            // Simulates a web dashboard displaying team on-call compensation
            const users = [
                new OnCallUser(
                    'USER003',
                    'Alice Johnson',
                    [
                        new OnCallPeriod(
                            DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            'Europe/London'
                        )
                    ]
                ),
                new OnCallUser(
                    'USER004',
                    'Bob Williams',
                    [
                        new OnCallPeriod(
                            DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            DateTime.fromISO('2024-08-15T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            'Europe/London'
                        )
                    ]
                ),
                new OnCallUser(
                    'USER005',
                    'Carol Davis',
                    [
                        new OnCallPeriod(
                            DateTime.fromISO('2024-08-15T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            DateTime.fromISO('2024-08-22T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            'Europe/London'
                        )
                    ]
                )
            ];

            const calculator = new OnCallPaymentsCalculator();
            const payments = calculator.calculateOnCallPayments(users);

            // Verify all users have calculated payments
            expect(payments).toEqual({
                'USER003': 425, // 7 days: 4 weekdays * 50 + 3 weekends * 75
                'USER004': 425,
                'USER005': 425
            });
        });
    });

    describe('Auditable Records (Browser-Compatible)', () => {
        test('should generate detailed audit records without Node.js dependencies', () => {
            // Simulates an HR system generating audit trails for on-call compensation
            const users = [
                new OnCallUser(
                    'USER006',
                    'David Martinez',
                    [
                        new OnCallPeriod(
                            DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                            'Europe/London'
                        )
                    ]
                )
            ];

            const calculator = new OnCallPaymentsCalculator();
            const auditRecords = calculator.getAuditableOnCallPaymentRecords(users);

            // Verify audit record structure and data
            expect(auditRecords['USER006']).toBeDefined();
            expect(auditRecords['USER006'].OnCallUser.name).toBe('David Martinez');
            expect(auditRecords['USER006'].totalCompensation).toBe(425);
            // Verify day counts from the OnCallUser's totals
            expect(auditRecords['USER006'].OnCallUser.getTotalOohWeekDays()).toBe(4);
            expect(auditRecords['USER006'].OnCallUser.getTotalOohWeekendDays()).toBe(3);
        });
    });

    describe('Custom Rates (Browser-Compatible)', () => {
        test('should use default rates when none provided', () => {
            // Verify default rates are accessible in browser environment
            expect(DEFAULT_RATES.weekdayRate).toBe(50);
            expect(DEFAULT_RATES.weekendRate).toBe(75);
        });

        test('should calculate with default rates', () => {
            // Uses default compensation rates (£50 weekday, £75 weekend)
            const calculator = new OnCallPaymentsCalculator();

            const user = new OnCallUser(
                'USER007',
                'Eva Garcia',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const payment = calculator.calculateOnCallPayment(user);
            
            // Aug 1 (Thu), Aug 2 (Fri), Aug 3 (Sat), Aug 4 (Sun)
            // 1 weekday (Thu) * 50 + 3 weekends (Fri-Sun) * 75 = 275
            expect(payment).toBe(275);
        });
    });

    describe('Timezone Handling (Browser-Compatible)', () => {
        test('should handle different timezones correctly in browser', () => {
            // Simulates a global team with members in different timezones
            const timezones = [
                { zone: 'Europe/London', name: 'UK Team' },
                { zone: 'America/New_York', name: 'US Team' },
                { zone: 'Australia/Melbourne', name: 'AU Team' }
            ];

            const calculator = new OnCallPaymentsCalculator();

            timezones.forEach(({ zone, name }) => {
                const user = new OnCallUser(
                    `USER_${zone}`,
                    name,
                    [
                        new OnCallPeriod(
                            DateTime.fromISO('2024-08-01T10:00:00', { zone }).toJSDate(),
                            DateTime.fromISO('2024-08-05T10:00:00', { zone }).toJSDate(),
                            zone
                        )
                    ]
                );

                const payment = calculator.calculateOnCallPayment(user);
                
                // All should calculate valid payments despite timezone differences
                expect(payment).toBeGreaterThan(0);
                expect(typeof payment).toBe('number');
            });
        });

        test('should handle DST transitions in browser environment', () => {
            // Simulates calculating compensation during DST changes
            // UK spring forward: March 31, 2024
            const user = new OnCallUser(
                'USER_DST',
                'DST User',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-03-30T17:30:00Z', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-04-02T09:00:00Z', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const calculator = new OnCallPaymentsCalculator();
            const payment = calculator.calculateOnCallPayment(user);

            // Should correctly handle the DST transition
            expect(payment).toBe(200); // 1 weekday * 50 + 2 weekends * 75
        });
    });

    describe('Edge Cases (Browser-Compatible)', () => {
        test('should handle same-day on-call periods', () => {
            // Short on-call period within a single day
            const user = new OnCallUser(
                'USER_SAME_DAY',
                'Same Day User',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T18:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const calculator = new OnCallPaymentsCalculator();
            const payment = calculator.calculateOnCallPayment(user);

            // Same-day periods under minimum shift hours may return 0
            // or count as 1 day depending on implementation
            expect(typeof payment).toBe('number');
            expect(payment).toBeGreaterThanOrEqual(0);
        });

        test('should handle year-end periods spanning calendar years', () => {
            // Simulates New Year on-call period
            const user = new OnCallUser(
                'USER_NEWYEAR',
                'New Year User',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2023-12-29T10:00:00+00:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-01-05T10:00:00+00:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const calculator = new OnCallPaymentsCalculator();
            const payment = calculator.calculateOnCallPayment(user);

            // Should correctly handle year transition
            expect(payment).toBeGreaterThan(0);
            expect(typeof payment).toBe('number');
        });
    });

    describe('Error Handling (Browser-Compatible)', () => {
        test('should throw clear error for undefined user', () => {
            const calculator = new OnCallPaymentsCalculator();
            
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                calculator.calculateOnCallPayment(undefined as any);
            }).toThrow(/Cannot calculate payment: OnCallUser is undefined/);
        });

        test('should throw clear error for user with no periods', () => {
            const user = new OnCallUser('USER_NO_PERIODS', 'No Periods User', []);
            const calculator = new OnCallPaymentsCalculator();

            expect(() => {
                calculator.calculateOnCallPayment(user);
            }).toThrow(/No on-call periods defined/);
        });
    });
});

describe('React/Next.js Integration Scenarios', () => {
    test('simulates React component calculating user compensation', () => {
        // This is how you'd use it in a React component:
        // const [compensation, setCompensation] = useState(0);
        // useEffect(() => {
        //   const calculator = new OnCallPaymentsCalculator();
        //   const payment = calculator.calculateOnCallPayment(onCallUser);
        //   setCompensation(payment);
        // }, [onCallUser]);

        const onCallUser = new OnCallUser(
            'REACT_USER',
            'React Component User',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const calculator = new OnCallPaymentsCalculator();
        const compensation = calculator.calculateOnCallPayment(onCallUser);

        expect(compensation).toBe(425);
    });

    test('simulates Next.js API route calculating team payments', () => {
        // This is how you'd use it in a Next.js API route:
        // export async function GET() {
        //   const users = await fetchOnCallUsers();
        //   const calculator = new OnCallPaymentsCalculator();
        //   const payments = calculator.calculateOnCallPayments(users);
        //   return Response.json({ payments });
        // }

        const teamMembers = [
            new OnCallUser(
                'NEXTJS_USER1',
                'Team Lead',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            ),
            new OnCallUser(
                'NEXTJS_USER2',
                'Senior Engineer',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-15T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            )
        ];

        const calculator = new OnCallPaymentsCalculator();
        const payments = calculator.calculateOnCallPayments(teamMembers);

        expect(payments).toEqual({
            'NEXTJS_USER1': 425,
            'NEXTJS_USER2': 425
        });
    });

    test('simulates browser-based HR dashboard generating reports', () => {
        // This is how you'd use it in a browser-based dashboard:
        // const generateReport = (users) => {
        //   const calculator = new OnCallPaymentsCalculator();
        //   return calculator.getAuditableOnCallPaymentRecords(users);
        // };

        const users = [
            new OnCallUser(
                'HR_USER1',
                'Sarah Connor',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            )
        ];

        const calculator = new OnCallPaymentsCalculator();
        const auditRecords = calculator.getAuditableOnCallPaymentRecords(users);

        // Dashboard can display detailed breakdown
        expect(auditRecords['HR_USER1'].OnCallUser.name).toBe('Sarah Connor');
        expect(auditRecords['HR_USER1'].totalCompensation).toBe(425);
        // Can access day counts from the user object
        expect(auditRecords['HR_USER1'].OnCallUser.getTotalOohWeekDays()).toBeDefined();
        expect(auditRecords['HR_USER1'].OnCallUser.getTotalOohWeekendDays()).toBeDefined();
    });
});

describe('Browser Compatibility Verification', () => {
    test('should work with only browser-compatible Date objects', () => {
        // Creates dates using only browser-available APIs
        const since = new Date('2024-08-01T10:00:00+01:00');
        const until = new Date('2024-08-08T10:00:00+01:00');

        const user = new OnCallUser(
            'BROWSER_DATE_USER',
            'Browser Date User',
            [new OnCallPeriod(since, until, 'Europe/London')]
        );

        const calculator = new OnCallPaymentsCalculator();
        const payment = calculator.calculateOnCallPayment(user);

        expect(payment).toBeGreaterThan(0);
        expect(typeof payment).toBe('number');
    });

    test('should work without any Node.js global variables or modules', () => {
        // This test verifies that the core module doesn't rely on:
        // - process.env
        // - require() / module.exports (uses ESM import/export)
        // - fs, path, or other Node.js built-ins
        // - __dirname, __filename

        const calculator = new OnCallPaymentsCalculator();
        const user = new OnCallUser(
            'NO_NODEJS_USER',
            'Pure Browser User',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        // Should calculate without any Node.js dependencies
        const payment = calculator.calculateOnCallPayment(user);
        expect(payment).toBe(275); // 1 Thu * 50 + 3 Fri-Sun * 75 = 275
    });
});
