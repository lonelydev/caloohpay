/**
 * CalOohPay Core - Browser-Compatible Exports
 * 
 * This module provides the core calculation engine and models that work
 * in any JavaScript environment (browser, Node.js, Deno, etc.).
 * 
 * No Node.js-specific dependencies (fs, path, process, etc.) are included.
 * Perfect for use in web applications, React, Next.js, Vue, etc.
 * 
 * @packageDocumentation
 * 
 * @example
 * Using in a browser/Next.js application:
 * ```typescript
 * import { 
 *   OnCallUser, 
 *   OnCallPeriod, 
 *   OnCallPaymentsCalculator,
 *   DEFAULT_RATES 
 * } from 'caloohpay/core';
 * 
 * // Create on-call periods
 * const user = new OnCallUser(
 *   'user-id',
 *   'John Doe',
 *   [
 *     new OnCallPeriod(
 *       new Date('2024-08-01T18:00:00Z'),
 *       new Date('2024-08-05T09:00:00Z'),
 *       'Europe/London'
 *     )
 *   ]
 * );
 * 
 * // Calculate compensation with custom rates
 * const calculator = new OnCallPaymentsCalculator(60, 90);
 * const amount = calculator.calculateOnCallPayment(user);
 * 
 * console.log(`Compensation: $${amount}`);
 * ```
 * 
 * @example
 * Using with React state:
 * ```typescript
 * import { OnCallPaymentsCalculator, DEFAULT_RATES } from 'caloohpay/core';
 * 
 * function CompensationCalculator() {
 *   const [weekdayRate, setWeekdayRate] = useState(DEFAULT_RATES.weekdayRate);
 *   const [weekendRate, setWeekendRate] = useState(DEFAULT_RATES.weekendRate);
 *   
 *   const calculator = new OnCallPaymentsCalculator(weekdayRate, weekendRate);
 *   // ... rest of component
 * }
 * ```
 */

// ============================================================================
// Constants - Pure data, no dependencies
// ============================================================================
export * from './Constants';

// ============================================================================
// Configuration Types - Browser-compatible interfaces
// ============================================================================
export type { CalOohPayConfig, RatesConfig } from './config/RatesConfig';
export { DEFAULT_RATES } from './config/RatesConfig';

// ============================================================================
// Core Calculator - Pure calculation logic
// ============================================================================
export { OnCallPaymentsCalculator } from './OnCallPaymentsCalculator';

// ============================================================================
// Models - Domain objects with business logic
// ============================================================================
export { OnCallPeriod } from './OnCallPeriod';
export { OnCallUser } from './OnCallUser';

// ============================================================================
// Utilities - Browser-compatible helpers
// ============================================================================
export { convertTimezone } from './DateUtilities';
export { InputValidator } from './validation/InputValidator';

// ============================================================================
// Types - TypeScript interfaces and types
// ============================================================================
export type { OnCallCompensation } from './OnCallCompensation';
export type { ScheduleEntry } from './ScheduleEntry';
export type { User } from './User';
export type { UserOncall } from './UserOncall';
export type { FinalSchedule } from './FinalSchedule';
export type { PagerdutySchedule } from './PagerdutySchedule';
