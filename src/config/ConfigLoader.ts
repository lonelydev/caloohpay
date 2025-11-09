import * as fs from 'fs';
import * as path from 'path';
import type { CalOohPayConfig, RatesConfig } from './RatesConfig';
import { DEFAULT_RATES } from './RatesConfig';
import { InputValidator } from '../validation/InputValidator';

/**
 * Loads and validates CalOohPay configuration from file system.
 * 
 * This module handles loading the optional `.caloohpay.json` configuration file
 * from the project root. If no config file exists, it gracefully falls back to
 * default rates, ensuring the application works out-of-the-box.
 * 
 * @category Configuration
 * 
 * @remarks
 * Configuration loading follows this priority:
 * 1. `.caloohpay.json` in current working directory
 * 2. `.caloohpay.json` in user's home directory
 * 3. Default rates from Constants.ts
 * 
 * @example
 * ```typescript
 * import { ConfigLoader } from './config/ConfigLoader';
 * 
 * const loader = new ConfigLoader();
 * const rates = loader.loadRates();
 * 
 * console.log(`Weekday rate: ${rates.weekdayRate}`);
 * console.log(`Weekend rate: ${rates.weekendRate}`);
 * ```
 */
export class ConfigLoader {
    /**
     * Configuration file name to search for.
     * @private
    
     */
    private static readonly CONFIG_FILENAME = '.caloohpay.json';

    /**
     * Loads compensation rates from config file or defaults.
     * 
     * Attempts to load configuration from `.caloohpay.json` in the following locations:
     * 1. Current working directory (`process.cwd()`)
     * 2. User's home directory
     * 
     * If no config file is found or parsing fails, returns default rates.
     * 
     * @returns {RatesConfig} Validated compensation rates configuration
     * 
     * @throws {Error} If config file exists but contains invalid rate values
     * 
     * @remarks
     * Silent fallback behavior:
     * - Missing config file → Use defaults (no error)
     * - Invalid JSON → Use defaults (logs warning)
     * - Invalid rate values → Throws error (business logic violation)
     * 
     * @example
     * ```typescript
     * const loader = new ConfigLoader();
     * const rates = loader.loadRates();
     * 
     * // Use rates in calculator
     * const calculator = new OnCallPaymentsCalculator(
     *   rates.weekdayRate,
     *   rates.weekendRate
     * );
     * ```
     */
    loadRates(): RatesConfig {
        const config = this.loadConfig();
        
        if (!config) {
            return DEFAULT_RATES;
        }

        return this.validateAndExtractRates(config);
    }

    /**
     * Attempts to load configuration from file system.
     * 
     * Searches for `.caloohpay.json` in multiple locations and returns
     * the first valid configuration found.
     * 
     * @private
     * @returns {CalOohPayConfig | null} Parsed configuration or null if not found
     * 
     * @remarks
     * Search order:
     * 1. `process.cwd()/.caloohpay.json`
     * 2. `~/. caloohpay.json` (user home directory)
     * 
     * JSON parsing errors are caught and logged, returning null to trigger
     * fallback to default rates.
     */
    private loadConfig(): CalOohPayConfig | null {
        const searchPaths = this.getConfigSearchPaths();

        for (const configPath of searchPaths) {
            const config = this.tryLoadConfigFile(configPath);
            if (config) {
                return config;
            }
        }

        return null;
    }

    /**
     * Returns prioritized list of paths to search for config file.
     * 
     * @private
     * @returns {string[]} Array of absolute file paths to check
     * 
     * @remarks
     * Priority order:
     * 1. Current working directory (allows per-project customization)
     * 2. User home directory (allows user-wide defaults)
     */
    private getConfigSearchPaths(): string[] {
        const paths: string[] = [];

        // Current working directory
        paths.push(path.join(process.cwd(), ConfigLoader.CONFIG_FILENAME));

        // User home directory
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
            paths.push(path.join(homeDir, ConfigLoader.CONFIG_FILENAME));
        }

        return paths;
    }

    /**
     * Attempts to load and parse a single config file.
     * 
     * @private
     * @param {string} filePath - Absolute path to config file
     * @returns {CalOohPayConfig | null} Parsed config or null if loading fails
     * 
     * @remarks
     * Returns null in these cases:
     * - File doesn't exist
     * - File is not readable
     * - JSON parsing fails
     * 
     * Errors are logged to console but don't throw, allowing graceful fallback.
     */
    private tryLoadConfigFile(filePath: string): CalOohPayConfig | null {
        try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath constructed from known safe paths
            if (!fs.existsSync(filePath)) {
                return null;
            }

            // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath constructed from known safe paths
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const config = JSON.parse(fileContent) as CalOohPayConfig;

            return config;
        } catch (error) {
            // Invalid JSON or read error - log and continue to fallback
            console.warn(`Warning: Failed to load config from ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Validates and extracts rates from loaded configuration.
     * 
     * Ensures that the configuration contains valid rate values and returns
     * a normalized RatesConfig object.
     * 
     * @private
     * @param {CalOohPayConfig} config - Loaded configuration object
     * @returns {RatesConfig} Validated rates configuration
     * 
     * @throws {Error} If rates are missing or invalid
     * 
     * @remarks
     * Validation checks:
     * - `rates` object exists
     * - `weekdayRate` is a positive number
     * - `weekendRate` is a positive number
     * - `currency` is a non-empty string (if provided)
     * 
     * Uses centralized InputValidator for consistency.
     */
    private validateAndExtractRates(config: CalOohPayConfig): RatesConfig {
        if (!config.rates) {
            throw new Error('Config file must contain a "rates" object');
        }

        const { weekdayRate, weekendRate, currency } = config.rates;

        // Validate weekday rate
        if (weekdayRate === undefined || weekdayRate === null) {
            throw new Error('Config rates.weekdayRate is required');
        }
        InputValidator.validatePositiveNumber(weekdayRate, 'rates.weekdayRate');

        // Validate weekend rate
        if (weekendRate === undefined || weekendRate === null) {
            throw new Error('Config rates.weekendRate is required');
        }
        InputValidator.validatePositiveNumber(weekendRate, 'rates.weekendRate');

        // Validate currency (optional)
        if (currency !== undefined && currency !== null) {
            InputValidator.validateNonEmptyString(currency, 'rates.currency');
        }

        return {
            weekdayRate,
            weekendRate,
            currency: currency || DEFAULT_RATES.currency
        };
    }
}
