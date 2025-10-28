import { describe, expect, test } from '@jest/globals';
import {
  OnCallPaymentsCalculator,
  OnCallUser,
  OnCallPeriod,
  CsvWriter,
  convertTimezone,
  coerceSince,
  coerceUntil
} from '../src/index';
import { DateTime } from 'luxon';

describe('Library Exports', () => {
  test('should export OnCallPaymentsCalculator', () => {
    const calculator = new OnCallPaymentsCalculator();
    expect(calculator).toBeInstanceOf(OnCallPaymentsCalculator);
    expect(typeof calculator.calculateOnCallPayment).toBe('function');
  });

  test('should export OnCallUser', () => {
    const user = new OnCallUser('1', 'Test User', []);
    expect(user).toBeInstanceOf(OnCallUser);
    expect(user.id).toBe('1');
    expect(user.name).toBe('Test User');
  });

  test('should export OnCallPeriod', () => {
    const period = new OnCallPeriod(
      new Date('2024-08-01T10:00:00'),
      new Date('2024-08-05T10:00:00'),
      'Europe/London'
    );
    expect(period).toBeInstanceOf(OnCallPeriod);
    expect(period.timeZone).toBe('Europe/London');
  });

  test('should export CsvWriter', () => {
    const writer = new CsvWriter('./test-output.csv');
    expect(writer).toBeInstanceOf(CsvWriter);
  });

  test('should export DateUtilities functions', () => {
    expect(typeof convertTimezone).toBe('function');
    expect(typeof coerceSince).toBe('function');
    expect(typeof coerceUntil).toBe('function');
  });

  test('should allow programmatic usage', () => {
    // Create a user with on-call periods
    const user = new OnCallUser(
      'user-1',
      'John Doe',
      [
        new OnCallPeriod(
          DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
          DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
          'Europe/London'
        )
      ]
    );

    // Calculate compensation
    const calculator = new OnCallPaymentsCalculator();
    const compensation = calculator.calculateOnCallPayment(user);

    // Verify calculation
    // Aug 1 (Thu) 10:00 to Aug 5 (Mon) 10:00
    // OOH Days: Aug 1 (Thu), Aug 2 (Fri), Aug 3 (Sat), Aug 4 (Sun)
    // Weekdays: Thu (1) = £50
    // Weekends: Fri, Sat, Sun (3) = £225
    // Total: £275
    expect(compensation).toBe(275);
    expect(user.getTotalOohWeekDays()).toBe(1);
    expect(user.getTotalOohWeekendDays()).toBe(3);
  });

  test('should work with multiple users', () => {
    const users = [
      new OnCallUser(
        '1',
        'User One',
        [
          new OnCallPeriod(
            DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
            DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
            'Europe/London'
          )
        ]
      ),
      new OnCallUser(
        '2',
        'User Two',
        [
          new OnCallPeriod(
            DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
            DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
            'Europe/London'
          )
        ]
      )
    ];

    const calculator = new OnCallPaymentsCalculator();
    const payments = calculator.calculateOnCallPayments(users);

    expect(Object.keys(payments).length).toBe(2);
    
    // User One: Aug 1 (Thu) to Aug 5 (Mon)
    // OOH: Thu, Fri, Sat, Sun = 1 weekday + 3 weekends = £50 + £225 = £275
    expect(payments['1']).toBe(275);
    
    // User Two: Aug 5 (Mon) to Aug 8 (Thu)
    // OOH: Mon, Tue, Wed = 3 weekdays = £150
    expect(payments['2']).toBe(150);
  });

  test('should calculate auditable records with correct compensation', () => {
    const user = new OnCallUser(
      'user-1',
      'Jane Doe',
      [
        new OnCallPeriod(
          DateTime.fromISO('2024-08-28T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
          DateTime.fromISO('2024-09-02T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
          'Europe/London'
        )
      ]
    );

    const calculator = new OnCallPaymentsCalculator();
    const auditableRecords = calculator.getAuditableOnCallPaymentRecords([user]);

    expect(auditableRecords['user-1']).toBeDefined();
    
    // Aug 28 (Wed) to Sep 2 (Mon)
    // OOH: Wed, Thu, Fri, Sat, Sun = 2 weekdays + 3 weekends
    const record = auditableRecords['user-1'];
    expect(record.OnCallUser.getTotalOohWeekDays()).toBe(2);
    expect(record.OnCallUser.getTotalOohWeekendDays()).toBe(3);
    // 2 * £50 + 3 * £75 = £100 + £225 = £325
    expect(record.totalCompensation).toBe(325);
  });
});
