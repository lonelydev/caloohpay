import { WEEKDAY_RATE, WEEKEND_RATE } from "./Constants";
import { OnCallCompensation } from "./OnCallCompensation";
import { OnCallUser } from "./OnCallUser";
import { InputValidator } from "./validation/InputValidator";

/**
 * Calculates on-call compensation for users based on their OOH (Out of Hours) shifts.
 * 
 * This class implements the business logic for computing monetary compensation
 * for on-call duty. It supports configurable rates for weekday and weekend OOH shifts
 * and provides methods for both simple payment calculations and detailed
 * auditable records.
 * 
 * @category Core
 * 
 * @remarks
 * ## Compensation Rates
 * 
 * Rates can be configured in two ways:
 * 
 * 1. **Via Constructor** - Pass custom rates when creating the calculator
 * 2. **Via Config File** - Use `.caloohpay.json` for organization-wide settings
 * 3. **Default Rates** - Falls back to:
 *    - **Weekdays** (Monday-Thursday): £50 per OOH day
 *    - **Weekends** (Friday-Sunday): £75 per OOH day
 * 
 * These default rates maintain backward compatibility and can be accessed via:
 * - {@link OnCallPaymentsCalculator.WeekDayRate}
 * - {@link OnCallPaymentsCalculator.WeekEndRate}
 * 
 * ## Calculation Formula
 * 
 * ```
 * Total Compensation = (Weekday OOH Days × Weekday Rate) + (Weekend OOH Days × Weekend Rate)
 * ```
 * 
 * ## Validation
 * 
 * All calculation methods validate input to ensure:
 * - User object is defined
 * - User has on-call periods assigned
 * - Rates are positive numbers (when provided)
 * 
 * @example
 * ```typescript
 * // Using default rates
 * const calculator = new OnCallPaymentsCalculator();
 * const amount = calculator.calculateOnCallPayment(user);
 * 
 * // Using custom rates
 * const customCalculator = new OnCallPaymentsCalculator(60, 90);
 * const customAmount = customCalculator.calculateOnCallPayment(user);
 * 
 * // Using rates from config file
 * const loader = new ConfigLoader();
 * const rates = loader.loadRates();
 * const configCalculator = new OnCallPaymentsCalculator(
 *   rates.weekdayRate,
 *   rates.weekendRate
 * );
 * ```
 */
export class OnCallPaymentsCalculator {
    /**
     * Default compensation rate for weekday (Mon-Thu) OOH shifts.
     * Fixed at £50 per OOH weekday.
     * 
     * @static
     * @readonly
     */
    public static readonly WeekDayRate: number = WEEKDAY_RATE;
    
    /**
     * Default compensation rate for weekend (Fri-Sun) OOH shifts.
     * Fixed at £75 per OOH weekend day.
     * 
     * @static
     * @readonly
     */
    public static readonly WeekEndRate: number = WEEKEND_RATE;

    /**
     * Instance-level weekday rate (configurable per calculator instance).
     * 
     * @private
     */
    private readonly weekdayRate: number;

    /**
     * Instance-level weekend rate (configurable per calculator instance).
     * 
     * @private
     */
    private readonly weekendRate: number;

    /**
     * Creates a new OnCallPaymentsCalculator with optional custom rates.
     * 
     * @param {number} [weekdayRate] - Custom weekday rate (defaults to WEEKDAY_RATE from Constants)
     * @param {number} [weekendRate] - Custom weekend rate (defaults to WEEKEND_RATE from Constants)
     * 
     * @throws {Error} If provided rates are not positive numbers
     * 
     * @example
     * ```typescript
     * // Use default rates
     * const defaultCalculator = new OnCallPaymentsCalculator();
     * 
     * // Use custom rates (e.g., USD rates)
     * const usdCalculator = new OnCallPaymentsCalculator(60, 90);
     * 
     * // Use rates from config
     * const config = new ConfigLoader().loadRates();
     * const configCalculator = new OnCallPaymentsCalculator(
     *   config.weekdayRate,
     *   config.weekendRate
     * );
     * ```
     */
    constructor(weekdayRate?: number, weekendRate?: number) {
        // Use provided rates or fall back to defaults
        this.weekdayRate = weekdayRate !== undefined ? weekdayRate : OnCallPaymentsCalculator.WeekDayRate;
        this.weekendRate = weekendRate !== undefined ? weekendRate : OnCallPaymentsCalculator.WeekEndRate;

        // Validate rates
        InputValidator.validatePositiveNumber(this.weekdayRate, 'weekdayRate');
        InputValidator.validatePositiveNumber(this.weekendRate, 'weekendRate');
    }

    /**
     * Validates that an OnCallUser is properly initialized for calculation.
     * 
     * Uses centralized validation from InputValidator.
     * 
     * @private
     * @param onCallUser - The user to validate
     * @throws {Error} If user is undefined or has no on-call periods
     * 
     * @remarks
     * This validation ensures data integrity before performing calculations.
     * Called automatically by all calculation methods.
     */
    private validateOnCallUser(onCallUser: OnCallUser): void {
        InputValidator.validateOnCallUser(onCallUser);
    }

    /**
     * Calculates the total compensation for a single user's on-call duty.
     * 
     * Computes payment based on the user's OOH weekday and weekend day counts,
     * applying the standard rates (£50 for weekdays, £75 for weekends).
     * 
     * @param onCallUser - The user with calculated on-call periods
     * @returns Total compensation amount in GBP (£)
     * 
     * @throws {Error} If user is undefined or has no on-call periods
     * 
     * @remarks
     * **Assumption**: The input user's date range spans complete days.
     * - `since` should be YYYY-MM-DDT00:00:00 (start of day)
     * - `until` should be YYYY-MM-DDT23:59:59 (end of day)
     * 
     * This ensures accurate day counting in the schedule's timezone.
     * 
     * @example
     * ```typescript
     * const user = new OnCallUser('PXXXXXX', 'John Doe', [
     *   new OnCallPeriod(startDate, endDate, 'Europe/London')
     * ]);
     * 
     * const calculator = new OnCallPaymentsCalculator();
     * const payment = calculator.calculateOnCallPayment(user);
     * // Returns: (1 × £50) + (3 × £75) = £275
     * ```
     */
    calculateOnCallPayment(onCallUser: OnCallUser): number {
        this.validateOnCallUser(onCallUser);
        return (onCallUser.getTotalOohWeekDays() * this.weekdayRate) + 
            (onCallUser.getTotalOohWeekendDays() * this.weekendRate);
    }

    /**
     * Calculates compensation for multiple users in batch.
     * 
     * Processes an array of users and returns a mapping of user IDs to their
     * compensation amounts. Useful for generating payroll reports.
     * 
     * @param onCallUsers - Array of users with calculated on-call periods
     * @returns Record mapping user IDs to compensation amounts
     * 
     * @throws {Error} If any user is undefined or has no on-call periods
     * 
     * @example
     * ```typescript
     * const users = [user1, user2, user3];
     * const payments = calculator.calculateOnCallPayments(users);
     * 
     * // Result: { 'PXXXXXX': 275, 'PYYYYYY': 150, 'PZZZZZZ': 400 }
     * 
     * // Use for payroll
     * for (const [userId, amount] of Object.entries(payments)) {
     *   console.log(`User ${userId}: £${amount}`);
     * }
     * ```
     */
    calculateOnCallPayments(onCallUsers: OnCallUser[]): Record<string, number> {
        const payments: Record<string, number> = {};
        for (const onCallUser of onCallUsers) {
            payments[onCallUser.id] = this.calculateOnCallPayment(onCallUser);
        }
        return payments;
    }

    /**
     * Generates detailed auditable compensation records for multiple users.
     * 
     * Creates comprehensive records that include both the full user object
     * (with all on-call periods and breakdowns) and the calculated compensation.
     * These records are suitable for audit trails, detailed reports, and CSV export.
     * 
     * @param onCallUsers - Array of users with calculated on-call periods
     * @returns Record mapping user IDs to detailed compensation records
     * 
     * @throws {Error} If any user is undefined or has no on-call periods
     * 
     * @remarks
     * Each record in the result contains:
     * - Complete OnCallUser object with all periods
     * - Breakdown of weekday and weekend OOH days
     * - Calculated total compensation
     * 
     * This format is used by the CSV export functionality and provides
     * full transparency for payroll auditing.
     * 
     * @example
     * ```typescript
     * const records = calculator.getAuditableOnCallPaymentRecords([user1, user2]);
     * 
     * // Result structure:
     * // {
     * //   'PXXXXXX': {
     * //     OnCallUser: user1,  // Full object with periods
     * //     totalCompensation: 275
     * //   },
     * //   'PYYYYYY': {
     * //     OnCallUser: user2,
     * //     totalCompensation: 150
     * //   }
     * // }
     * 
     * // Access details for audit
     * const record = records['PXXXXXX'];
     * console.log(`User: ${record.OnCallUser.name}`);
     * console.log(`Weekdays: ${record.OnCallUser.getTotalOohWeekDays()}`);
     * console.log(`Weekends: ${record.OnCallUser.getTotalOohWeekendDays()}`);
     * console.log(`Total: £${record.totalCompensation}`);
     * ```
     */
    getAuditableOnCallPaymentRecords(onCallUsers: OnCallUser[]): Record<string, OnCallCompensation> {
        /**
         * for every OnCallUser item, create an OnCallCompensation object
         * calculate number of weekdays and weekends that the person was on call
         */
        const onCallCompensations: Record<string, OnCallCompensation> = {};
        for (const onCallUser of onCallUsers) {
            this.validateOnCallUser(onCallUser);
            onCallCompensations[onCallUser.id] = {
                OnCallUser: onCallUser,
                totalCompensation: 
                    (onCallUser.getTotalOohWeekDays() * this.weekdayRate) + 
                    (onCallUser.getTotalOohWeekendDays() * this.weekendRate)
            }
        }
        
        return onCallCompensations;
    }
}
