/**
 * CalOohPay - Calculate Out-of-Hours Pay
 * 
 * This is the main entry point that exports all functionality.
 * For browser/web applications, use 'caloohpay/core' instead.
 * For Node.js-specific features, use 'caloohpay/node'.
 * 
 * @packageDocumentation
 * 
 * @remarks
 * ## Package Structure (v2.1.0+)
 * 
 * CalOohPay now provides three import paths:
 * 
 * - **`caloohpay`** - Everything (backward compatible, Node.js only)
 * - **`caloohpay/core`** - Browser-compatible core (calculator, models, utilities)
 * - **`caloohpay/node`** - Node.js-specific features (ConfigLoader, CsvWriter, API)
 * 
 * @example
 * Node.js usage (backward compatible):
 * ```typescript
 * import { ConfigLoader, OnCallPaymentsCalculator } from 'caloohpay';
 * 
 * const loader = new ConfigLoader();
 * const rates = loader.loadRates();
 * const calculator = new OnCallPaymentsCalculator(rates.weekdayRate, rates.weekendRate);
 * ```
 * 
 * @example
 * Browser/Next.js usage (new in v2.1.0):
 * ```typescript
 * import { OnCallUser, OnCallPeriod, OnCallPaymentsCalculator } from 'caloohpay/core';
 * 
 * const user = new OnCallUser('id', 'John Doe', [
 *   new OnCallPeriod(startDate, endDate, 'Europe/London')
 * ]);
 * 
 * const calculator = new OnCallPaymentsCalculator(60, 90);
 * const amount = calculator.calculateOnCallPayment(user);
 * ```
 */

// ============================================================================
// Re-export everything from node.ts for backward compatibility
// This maintains the existing API for Node.js users
// ============================================================================
export * from './node';
