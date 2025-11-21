/**
 * CalOohPay Node.js - Node.js-Specific Exports
 * 
 * This module provides Node.js-specific functionality including:
 * - File system-based configuration loading
 * - CSV file writing
 * - PagerDuty API integration
 * - CLI helpers
 * 
 * These exports require a Node.js environment and will not work in browsers.
 * 
 * @packageDocumentation
 * 
 * @example
 * Using ConfigLoader in Node.js:
 * ```typescript
 * import { ConfigLoader, OnCallPaymentsCalculator } from 'caloohpay/node';
 * 
 * const loader = new ConfigLoader();
 * const rates = loader.loadRates();
 * 
 * const calculator = new OnCallPaymentsCalculator(
 *   rates.weekdayRate,
 *   rates.weekendRate
 * );
 * ```
 * 
 * @example
 * Using CsvWriter:
 * ```typescript
 * import { CsvWriter } from 'caloohpay/node';
 * 
 * const writer = new CsvWriter('./output.csv');
 * writer.writeScheduleData(
 *   scheduleName,
 *   scheduleUrl,
 *   timezone,
 *   compensationRecords,
 *   false
 * );
 * ```
 */

// ============================================================================
// Re-export all core functionality
// ============================================================================
export * from './core';

// ============================================================================
// Node.js-Specific Configuration
// ============================================================================
export { ConfigLoader } from './config/ConfigLoader';

// ============================================================================
// Node.js-Specific Utilities
// ============================================================================
export { CsvWriter } from './CsvWriter';
export { coerceSince, coerceUntil } from './DateUtilities';
export { sanitiseEnvVariable } from './EnvironmentController';

// ============================================================================
// CLI Integration (requires @pagerduty/pdjs, yargs, dotenv)
// ============================================================================
export { calOohPay, extractOnCallUsersFromFinalSchedule } from './CalOohPay';
export type { CalOohPayResult } from './CalOohPay';

// ============================================================================
// Logger Interfaces
// ============================================================================
export type { Logger } from './logger/Logger';
export { maskCliOptions } from './logger/utils';

// ============================================================================
// Node.js-Specific Types
// ============================================================================
export type { CommandLineOptions } from './CommandLineOptions';
export type { Environment } from './EnvironmentController';
