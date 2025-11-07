import { WEEKDAY_RATE, WEEKEND_RATE } from "./Constants";
import { OnCallCompensation } from "./OnCallCompensation";
import { OnCallUser } from "./OnCallUser";

/**
 * Calculates on-call compensation for users based on their OOH (Out of Hours) shifts.
 * 
 * This class implements the business logic for computing monetary compensation
 * for on-call duty. It applies fixed rates for weekday and weekend OOH shifts
 * and provides methods for both simple payment calculations and detailed
 * auditable records.
 * 
 * @category Core
 * 
 * @remarks
 * ## Compensation Rates
 * 
 * - **Weekdays** (Monday-Thursday): £50 per OOH day
 * - **Weekends** (Friday-Sunday): £75 per OOH day
 * 
 * These rates are static and can be accessed via:
 * - {@link OnCallPaymentsCalculator.WeekDayRate}
 * - {@link OnCallPaymentsCalculator.WeekEndRate}
 * 
 * ## Calculation Formula
 * 
 * ```
 * Total Compensation = (Weekday OOH Days × £50) + (Weekend OOH Days × £75)
 * ```
 * 
 * ## Validation
 * 
 * All calculation methods validate input to ensure:
 * - User object is defined
 * - User has on-call periods assigned
 * 
 * @example
 * ```typescript
 * const calculator = new OnCallPaymentsCalculator();
 * 
 * // Simple payment calculation
 * const amount = calculator.calculateOnCallPayment(user);
 * console.log(`Total compensation: £${amount}`);
 * 
 * // Batch calculation for multiple users
 * const payments = calculator.calculateOnCallPayments([user1, user2, user3]);
 * console.log(payments); // { 'user-id-1': 275, 'user-id-2': 150, ... }
 * 
 * // Detailed auditable records
 * const records = calculator.getAuditableOnCallPaymentRecords([user1, user2]);
 * // Includes full user details and breakdown
 * ```
 */
export class OnCallPaymentsCalculator {
    /**
     * Compensation rate for weekday (Mon-Thu) OOH shifts.
     * Fixed at £50 per OOH weekday.
     */
    public static readonly WeekDayRate: number = WEEKDAY_RATE;
    
    /**
     * Compensation rate for weekend (Fri-Sun) OOH shifts.
     * Fixed at £75 per OOH weekend day.
     */
    public static readonly WeekEndRate: number = WEEKEND_RATE;

    /**
     * Validates that an OnCallUser is properly initialized for calculation.
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
        if (!onCallUser) {
            throw new Error(
                "Cannot calculate payment: OnCallUser is undefined. " +
                "Ensure user object is properly initialized before calling calculation methods."
            );
        }
        if (!onCallUser.onCallPeriods || onCallUser.onCallPeriods.length === 0) {
            throw new Error(
                `Cannot calculate payment for user '${onCallUser.id}' (${onCallUser.name || 'unnamed'}): ` +
                `No on-call periods defined. User must have at least one OnCallPeriod assigned.`
            );
        }
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
        return (onCallUser.getTotalOohWeekDays() * OnCallPaymentsCalculator.WeekDayRate) + 
            (onCallUser.getTotalOohWeekendDays() * OnCallPaymentsCalculator.WeekEndRate);
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
                    (onCallUser.getTotalOohWeekDays() * OnCallPaymentsCalculator.WeekDayRate) + 
                    (onCallUser.getTotalOohWeekendDays() * OnCallPaymentsCalculator.WeekEndRate)
            }
        }
        
        return onCallCompensations;
    }
}
