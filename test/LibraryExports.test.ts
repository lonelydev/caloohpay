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
    expect(compensation).toBeGreaterThan(0);
    expect(typeof compensation).toBe('number');
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
    expect(payments['1']).toBeGreaterThan(0);
    expect(payments['2']).toBeGreaterThan(0);
  });
});
