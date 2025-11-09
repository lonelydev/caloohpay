/**
 * CalOohPay - Calculate Out-of-Hours Pay
 * 
 * This module provides programmatic access to CalOohPay's core functionality.
 * For CLI usage, use the `caloohpay` command instead.
 * 
 * @packageDocumentation
 * 
 * @example
 * Basic usage with default rates:
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
 * 
 * @example
 * Using custom rates from config file:
 * ```typescript
 * import { ConfigLoader, OnCallPaymentsCalculator } from 'caloohpay';
 * 
 * const loader = new ConfigLoader();
 * const rates = loader.loadRates();
 * 
 * const calculator = new OnCallPaymentsCalculator(
 *   rates.weekdayRate,
 *   rates.weekendRate
 * );
 * 
 * const compensation = calculator.calculateOnCallPayment(user);
 * console.log(`Total: ${rates.currency} ${compensation}`);
 * ```
 */

// Constants
export * from './Constants';

// Configuration
export { ConfigLoader } from './config/ConfigLoader';
export type { CalOohPayConfig, RatesConfig } from './config/RatesConfig';
export { DEFAULT_RATES } from './config/RatesConfig';

// Core Calculator
export { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';

// CLI entry points / helpers
export { calOohPay, extractOnCallUsersFromFinalSchedule } from './CalOohPay';
export type { CalOohPayResult } from './CalOohPay';

// Models
export { OnCallPeriod } from './OnCallPeriod';
export { OnCallUser } from './OnCallUser';

// Utilities
export { CsvWriter } from './CsvWriter';
export { coerceSince, coerceUntil, convertTimezone } from './DateUtilities';
export { InputValidator } from './validation/InputValidator';

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
export type { UserOncall } from './UserOncall';
