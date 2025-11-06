/**
 * CalOohPay - Calculate Out-of-Hours Pay
 * 
 * This module provides programmatic access to CalOohPay's core functionality.
 * For CLI usage, use the `caloohpay` command instead.
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { OnCallUser, OnCallPeriod, OnCallPaymentsCalculator } from 'caloohpay';
 * 
 * const user = new OnCallUser(
 *   'user-id',
 *   'John Doe',
 *   [
 *     new OnCallPeriod(
 *       new Date('2024-08-01T10:00:00'),
 *       new Date('2024-08-05T10:00:00'),
 *       'Europe/London'
 *     )
 *   ]
 * );
 * 
 * const calculator = new OnCallPaymentsCalculator();
 * const compensation = calculator.calculateOnCallPayment(user);
 * console.log(`Total compensation: £${compensation}`);
 * ```
 */

// Constants
export * from './Constants';

// Core Calculator
export { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';

// CLI entry points / helpers
export { calOohPay, extractOnCallUsersFromFinalSchedule } from './CalOohPay';

// Models
export { OnCallPeriod } from './OnCallPeriod';
export { OnCallUser } from './OnCallUser';

// Utilities
export { CsvWriter } from './CsvWriter';
export { coerceSince, coerceUntil, convertTimezone } from './DateUtilities';

// Environment and logger helpers
export { sanitiseEnvVariable } from './EnvironmentController';
export type { Logger } from './logger/Logger';
export { maskCliOptions } from './logger/utils';

// Types
export type { CommandLineOptions } from './CommandLineOptions';
export type { Environment } from './EnvironmentController';
export type { FinalSchedule } from './FinalSchedule';
export type { OnCallCompensation } from './OnCallCompensation';
export type { PagerdutySchedule } from './PagerdutySchedule';
export type { ScheduleEntry } from './ScheduleEntry';
export type { User } from './User';
