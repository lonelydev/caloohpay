/**
 * Configuration interface for on-call compensation rates.
 * 
 * This module defines the structure for configurable compensation rates,
 * allowing organizations to customize weekday and weekend rates based on
 * their compensation policies.
 * 
 * @category Configuration
 * 
 * @remarks
 * Rates can be configured via a `.caloohpay.json` file in the project root.
 * If no config file exists, the application falls back to default rates.
 * 
 * @example
 * ```typescript
 * // .caloohpay.json
 * {
 *   "rates": {
 *     "weekdayRate": 60,
 *     "weekendRate": 90,
 *     "currency": "USD"
 *   }
 * }
 * ```
 */

/**
 * Configuration structure for compensation rates.
 * 
 * Defines the monetary compensation for out-of-hours on-call duty,
 * distinguishing between weekday and weekend rates.
 * 
 * @interface
 * 
 * @property {number} weekdayRate - Compensation for OOH weekday shifts (Monday-Thursday)
 * @property {number} weekendRate - Compensation for OOH weekend shifts (Friday-Sunday)
 * @property {string} [currency] - Currency code (e.g., 'GBP', 'USD', 'EUR'). Optional.
 * 
 * @example
 * ```typescript
 * const defaultRates: RatesConfig = {
 *   weekdayRate: 50,
 *   weekendRate: 75,
 *   currency: 'GBP'
 * };
 * ```
 */
export interface RatesConfig {
    /**
     * Compensation rate for out-of-hours weekday shifts (Monday-Thursday).
     * 
     * @type {number}
     * @remarks Must be a positive number. Represents the monetary amount per OOH weekday.
     */
    weekdayRate: number;

    /**
     * Compensation rate for out-of-hours weekend shifts (Friday-Sunday).
     * 
     * @type {number}
     * @remarks Must be a positive number. Represents the monetary amount per OOH weekend day.
     * Note: Friday is considered a weekend day for compensation purposes.
     */
    weekendRate: number;

    /**
     * Currency code for the compensation rates.
     * 
     * @type {string}
     * @default 'GBP'
     * @remarks Should follow ISO 4217 currency codes (e.g., 'GBP', 'USD', 'EUR', 'JPY').
     */
    currency?: string;
}

/**
 * Complete application configuration structure.
 * 
 * Root configuration object that can be extended with additional
 * settings beyond just rates (e.g., timezone defaults, output preferences).
 * 
 * @interface
 * 
 * @property {RatesConfig} rates - Compensation rate configuration
 * 
 * @example
 * ```typescript
 * // .caloohpay.json
 * {
 *   "rates": {
 *     "weekdayRate": 50,
 *     "weekendRate": 75,
 *     "currency": "GBP"
 *   }
 * }
 * ```
 */
export interface CalOohPayConfig {
    /**
     * Compensation rates configuration.
     * 
     * @type {RatesConfig}
     * @remarks Required field containing weekday and weekend rate settings.
     */
    rates: RatesConfig;
}

/**
 * Default compensation rates used when no config file is present.
 * 
 * These values maintain backward compatibility with the original
 * hard-coded rates from Constants.ts.
 * 
 * @type {RatesConfig}
 * 
 * @remarks
 * - Weekdays (Mon-Thu): £50 per OOH day
 * - Weekends (Fri-Sun): £75 per OOH day
 * - Currency: GBP (British Pounds)
 * 
 * @example
 * ```typescript
 * import { DEFAULT_RATES } from './config/RatesConfig';
 * 
 * const calculator = new OnCallPaymentsCalculator(
 *   DEFAULT_RATES.weekdayRate,
 *   DEFAULT_RATES.weekendRate
 * );
 * ```
 */
export const DEFAULT_RATES: RatesConfig = {
    weekdayRate: 50,
    weekendRate: 75,
    currency: 'GBP'
};
