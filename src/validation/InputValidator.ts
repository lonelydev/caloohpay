import { DateTime } from 'luxon';

import type { OnCallUser } from '../OnCallUser';

/**
 * Centralized input validation module for CalOohPay application.
 * 
 * Provides consistent validation rules and error messages across all parts of the application.
 * All validation methods throw descriptive errors with context when validation fails.
 * 
 * @category Validation
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class InputValidator {
    /**
     * Validates a date string can be parsed as a valid date.
     * 
     * @param dateString - The date string to validate
     * @param fieldName - Name of the field being validated (for error messages)
     * @throws {Error} If date string is invalid or cannot be parsed
     * 
     * @example
     * ```typescript
     * InputValidator.validateDateString('2024-01-15', 'since'); // OK
     * InputValidator.validateDateString('invalid', 'since');     // throws Error
     * ```
     */
    static validateDateString(dateString: string, fieldName: string): void {
        if (!dateString) {
            throw new Error(`${fieldName} date is required but was not provided`);
        }

        if (!Date.parse(dateString)) {
            throw new Error(
                `Invalid date format for ${fieldName}: "${dateString}". ` +
                `Expected ISO 8601 format (e.g., "2024-01-15" or "2024-01-15T00:00:00Z")`
            );
        }
    }

    /**
     * Validates a date range ensuring 'since' is not greater than 'until'.
     * 
     * @param since - Start date string (ISO format)
     * @param until - End date string (ISO format)
     * @throws {Error} If since > until or if dates are invalid
     * 
     * @example
     * ```typescript
     * InputValidator.validateDateRange('2024-01-01', '2024-01-31'); // OK
     * InputValidator.validateDateRange('2024-02-01', '2024-01-01'); // throws Error
     * ```
     */
    static validateDateRange(since: string, until: string): void {
        this.validateDateString(since, 'since');
        this.validateDateString(until, 'until');

        const sinceDate = DateTime.fromISO(since);
        const untilDate = DateTime.fromISO(until);

        if (sinceDate > untilDate) {
            throw new Error(
                `Invalid date range: 'since' (${since}) cannot be greater than 'until' (${until}). ` +
                `Please ensure the start date comes before the end date.`
            );
        }
    }

    /**
     * Validates PagerDuty schedule ID format.
     * 
     * PagerDuty schedule IDs typically start with 'P' followed by alphanumeric characters.
     * This validates basic format and non-empty strings.
     * 
     * @param scheduleId - The schedule ID to validate
     * @throws {Error} If schedule ID is invalid
     * 
     * @example
     * ```typescript
     * InputValidator.validateScheduleId('PXXXXXX');  // OK
     * InputValidator.validateScheduleId('');         // throws Error
     * InputValidator.validateScheduleId('   ');      // throws Error
     * ```
     */
    static validateScheduleId(scheduleId: string): void {
        if (!scheduleId || scheduleId.trim().length === 0) {
            throw new Error(
                'Schedule ID is required but was empty or whitespace. ' +
                'Please provide a valid PagerDuty schedule ID (e.g., "PXXXXXX")'
            );
        }

        // Basic format validation - PagerDuty IDs are typically alphanumeric
        const validIdPattern = /^[A-Z0-9]+$/i;
        if (!validIdPattern.test(scheduleId.trim())) {
            throw new Error(
                `Invalid schedule ID format: "${scheduleId}". ` +
                `Schedule IDs should contain only letters and numbers (e.g., "PXXXXXX", "ABC123")`
            );
        }
    }

    /**
     * Validates a comma-separated list of schedule IDs.
     * 
     * @param scheduleIds - Comma-separated schedule IDs
     * @returns Array of validated and trimmed schedule IDs
     * @throws {Error} If any schedule ID is invalid
     * 
     * @example
     * ```typescript
     * const ids = InputValidator.validateScheduleIds('PXXXXXX,PYYYYYY');
     * // Returns: ['PXXXXXX', 'PYYYYYY']
     * ```
     */
    static validateScheduleIds(scheduleIds: string): string[] {
        if (!scheduleIds || scheduleIds.trim().length === 0) {
            throw new Error(
                'At least one schedule ID is required. ' +
                'Provide schedule IDs as comma-separated values (e.g., "PXXXXXX,PYYYYYY")'
            );
        }

        const ids = scheduleIds.split(',').map(id => id.trim());

        if (ids.length === 0) {
            throw new Error('No valid schedule IDs found after parsing input');
        }

        // Validate each individual ID
        ids.forEach((id, index) => {
            try {
                this.validateScheduleId(id);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(
                    `Invalid schedule ID at position ${index + 1}: ${errorMessage}`
                );
            }
        });

        return ids;
    }

    /**
     * Validates an IANA timezone identifier.
     * 
     * Note: This performs basic validation. For comprehensive timezone validation,
     * use Luxon's DateTime.local().setZone() and check if zone.isValid.
     * 
     * @param timezone - IANA timezone identifier (e.g., 'Europe/London', 'America/New_York')
     * @throws {Error} If timezone is invalid or unsupported
     * 
     * @example
     * ```typescript
     * InputValidator.validateTimezone('Europe/London');      // OK
     * InputValidator.validateTimezone('Invalid/Timezone');   // throws Error
     * ```
     */
    static validateTimezone(timezone: string): void {
        if (!timezone || timezone.trim().length === 0) {
            throw new Error(
                'Timezone is required but was empty. ' +
                'Please provide a valid IANA timezone identifier (e.g., "Europe/London", "America/New_York")'
            );
        }

        // Use Luxon to validate the timezone
        const testDate = DateTime.local().setZone(timezone);
        if (!testDate.isValid) {
            throw new Error(
                `Invalid timezone: "${timezone}". ` +
                `Please use a valid IANA timezone identifier. ` +
                `Examples: "Europe/London", "America/New_York", "Asia/Tokyo". ` +
                `See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`
            );
        }
    }

    /**
     * Validates an OnCallUser object for payment calculations.
     * 
     * Ensures the user has all required data for accurate payment calculation.
     * 
     * @param onCallUser - The user object to validate
     * @throws {Error} If user is undefined, missing required fields, or has no on-call periods
     * 
     * @example
     * ```typescript
     * const user = new OnCallUser('PXXXXXX', 'John Doe', [period]);
     * InputValidator.validateOnCallUser(user); // OK
     * 
     * InputValidator.validateOnCallUser(null); // throws Error
     * ```
     */
    static validateOnCallUser(onCallUser: OnCallUser | null | undefined): void {
        if (!onCallUser) {
            throw new Error(
                'Cannot calculate payment: OnCallUser is undefined. ' +
                'Ensure user object is properly initialized before calling calculation methods.'
            );
        }

        if (!onCallUser.id || onCallUser.id.trim().length === 0) {
            throw new Error(
                'OnCallUser is missing required "id" field. ' +
                'Each user must have a valid PagerDuty user ID.'
            );
        }

        if (!onCallUser.name || onCallUser.name.trim().length === 0) {
            throw new Error(
                `OnCallUser with id "${onCallUser.id}" is missing required "name" field. ` +
                'Each user must have a displayable name for reporting.'
            );
        }

        if (!onCallUser.onCallPeriods || onCallUser.onCallPeriods.length === 0) {
            throw new Error(
                `Cannot calculate payment for user '${onCallUser.id}' (${onCallUser.name}): ` +
                `No on-call periods defined. User must have at least one OnCallPeriod assigned.`
            );
        }
    }

    /**
     * Sanitizes a string input by trimming whitespace.
     * 
     * @param input - The string to sanitize
     * @param defaultValue - Optional default value if input is empty after trimming
     * @returns Sanitized string
     * 
     * @example
     * ```typescript
     * InputValidator.sanitizeString('  test  ');        // 'test'
     * InputValidator.sanitizeString('   ', 'default');  // 'default'
     * ```
     */
    static sanitizeString(input: string, defaultValue = ''): string {
        if (!input) {
            return defaultValue;
        }
        return input.trim();
    }

    /**
     * Validates an API token format.
     * 
     * Basic validation for PagerDuty API tokens. Real validation happens
     * when making API calls, but this catches obvious issues early.
     * 
     * @param token - API token to validate
     * @throws {Error} If token is missing or appears invalid
     * 
     * @example
     * ```typescript
     * InputValidator.validateApiToken('u+ABC123xyz789');  // OK
     * InputValidator.validateApiToken('');                // throws Error
     * ```
     */
    static validateApiToken(token: string): void {
        if (!token || token.trim().length === 0) {
            throw new Error(
                'PagerDuty API token is required. ' +
                'Set API_TOKEN environment variable or provide --key option. ' +
                'Get your token from: My Profile → User Settings → API Access → Create New API User Token'
            );
        }

        // PagerDuty tokens are typically at least 20 characters
        // SECURITY: Don't reveal exact token length to avoid metadata leakage
        if (token.trim().length < 20) {
            throw new Error(
                'API token appears invalid or incomplete. ' +
                'Valid PagerDuty API tokens are typically 20+ characters. ' +
                'Please verify your token is complete and correct.'
            );
        }
    }

    /**
     * Validates a file path for output.
     * 
     * Basic validation to ensure path is not empty and doesn't contain
     * obviously invalid characters.
     * 
     * @param filePath - The file path to validate
     * @throws {Error} If file path is invalid
     * 
     * @example
     * ```typescript
     * InputValidator.validateFilePath('./output/report.csv');  // OK
     * InputValidator.validateFilePath('');                     // throws Error
     * ```
     */
    static validateFilePath(filePath: string): void {
        if (!filePath || filePath.trim().length === 0) {
            throw new Error(
                'Output file path is required but was empty. ' +
                'Please provide a valid file path (e.g., "./output/report.csv")'
            );
        }

        // Check for invalid characters (basic check for common issues)
        // eslint-disable-next-line no-control-regex
        const invalidCharsPattern = /[<>:"|?*\x00-\x1F]/;
        if (invalidCharsPattern.test(filePath)) {
            throw new Error(
                `Invalid characters in file path: "${filePath}". ` +
                `File paths cannot contain: < > : " | ? * or control characters`
            );
        }
    }

    /**
     * Validates that a number is positive (greater than 0).
     * 
     * Used for validating configuration values that must be positive,
     * such as compensation rates.
     * 
     * @param {number} value - The number to validate
     * @param {string} fieldName - Name of the field being validated (for error messages)
     * 
     * @throws {Error} If value is not a number, NaN, or not positive
     * 
     * @category Validation
     * 
     * @example
     * ```typescript
     * InputValidator.validatePositiveNumber(50, 'weekdayRate');     // OK
     * InputValidator.validatePositiveNumber(0, 'weekdayRate');      // throws Error
     * InputValidator.validatePositiveNumber(-10, 'weekdayRate');    // throws Error
     * InputValidator.validatePositiveNumber(NaN, 'weekdayRate');    // throws Error
     * ```
     */
    static validatePositiveNumber(value: number, fieldName: string): void {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(
                `${fieldName} must be a valid number. Received: ${value}`
            );
        }

        if (value <= 0) {
            throw new Error(
                `${fieldName} must be a positive number (greater than 0). Received: ${value}`
            );
        }
    }

    /**
     * Validates that a string is non-empty (after trimming whitespace).
     * 
     * Used for validating required string fields like currency codes.
     * 
     * @param {string} value - The string to validate
     * @param {string} fieldName - Name of the field being validated (for error messages)
     * 
     * @throws {Error} If value is not a string or is empty after trimming
     * 
     * @category Validation
     * 
     * @example
     * ```typescript
     * InputValidator.validateNonEmptyString('GBP', 'currency');      // OK
     * InputValidator.validateNonEmptyString('  USD  ', 'currency');  // OK (trimmed)
     * InputValidator.validateNonEmptyString('', 'currency');         // throws Error
     * InputValidator.validateNonEmptyString('   ', 'currency');      // throws Error
     * ```
     */
    static validateNonEmptyString(value: string, fieldName: string): void {
        if (typeof value !== 'string') {
            throw new Error(
                `${fieldName} must be a string. Received: ${typeof value}`
            );
        }

        if (value.trim().length === 0) {
            throw new Error(
                `${fieldName} cannot be empty`
            );
        }
    }
}
