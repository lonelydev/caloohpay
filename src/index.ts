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

// Core Calculator
export { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';

// Models
export { OnCallUser } from './OnCallUser';
export { OnCallPeriod } from './OnCallPeriod';

// Utilities
export { CsvWriter } from './CsvWriter';
export { convertTimezone, coerceSince, coerceUntil } from './DateUtilities';

// Types
export type { OnCallCompensation } from './OnCallCompensation';
export type { CommandLineOptions } from './CommandLineOptions';
export type { PagerdutySchedule } from './PagerdutySchedule';
export type { FinalSchedule } from './FinalSchedule';
export type { ScheduleEntry } from './ScheduleEntry';
export type { User } from './User';
export type { Environment } from './EnvironmentController';
