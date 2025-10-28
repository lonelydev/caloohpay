import { OnCallPeriod } from "./OnCallPeriod";

/**
 * Represents a user and their on-call duty periods with calculated compensation metrics.
 * 
 * This class is the primary data structure for tracking a user's on-call assignments
 * and computing their out-of-hours (OOH) work. It aggregates multiple on-call periods
 * and provides summary statistics for weekday and weekend OOH shifts.
 * 
 * @category Core
 * 
 * @remarks
 * The class distinguishes between:
 * - **Weekdays** (Monday-Thursday): Paid at £50 per OOH day
 * - **Weekends** (Friday-Sunday): Paid at £75 per OOH day
 * 
 * An OOH day is counted when a shift:
 * 1. Spans across days (not same-day start and end)
 * 2. Extends past end of work hours (17:30)
 * 3. Is longer than 6 hours
 * 
 * @example
 * ```typescript
 * const user = new OnCallUser(
 *   'PXXXXXX',
 *   'John Doe',
 *   [
 *     new OnCallPeriod(
 *       new Date('2024-08-01T17:30:00Z'),
 *       new Date('2024-08-05T09:00:00Z'),
 *       'Europe/London'
 *     )
 *   ]
 * );
 * 
 * console.log(user.getTotalOohWeekDays());     // 1 (Thursday)
 * console.log(user.getTotalOohWeekendDays());  // 3 (Fri, Sat, Sun)
 * ```
 */
export class OnCallUser {
    /** 
     * Unique identifier for the user from PagerDuty.
     * @example 'PXXXXXX'
     */
    public id: string;
    
    /** 
     * Display name of the user.
     * @example 'John Doe'
     */
    public name: string;
    
    /** 
     * Private storage for all on-call periods assigned to this user.
     * Use the getter or methods to access/modify.
     */
    private _onCallPeriods: Array<OnCallPeriod> = [];

    /**
     * Creates a new OnCallUser instance.
     * 
     * @param id - PagerDuty user ID
     * @param name - User's display name
     * @param periods - Array of on-call periods for this user
     */
    constructor(id: string, name: string, periods: OnCallPeriod[]) {
        this.id = id;
        this.name = name;
        this._onCallPeriods = periods;
    }

    /**
     * Gets all on-call periods for this user.
     * 
     * @returns Read-only array of on-call periods
     */
    public get onCallPeriods(): OnCallPeriod[] {
        return this._onCallPeriods;
    }
    
    /**
     * Adds a single on-call period to the user's schedule.
     * 
     * @param period - The on-call period to add
     * 
     * @example
     * ```typescript
     * user.addOnCallPeriod(new OnCallPeriod(start, end, 'Europe/London'));
     * ```
     */
    public addOnCallPeriod(period: OnCallPeriod): void {
        this._onCallPeriods.push(period);
    }

    /**
     * Adds multiple on-call periods to the user's schedule.
     * 
     * @param periods - Array of on-call periods to add
     * 
     * @example
     * ```typescript
     * user.addOnCallPeriods([period1, period2, period3]);
     * ```
     */
    public addOnCallPeriods(periods: OnCallPeriod[]): void {
        this._onCallPeriods = this._onCallPeriods.concat(periods);
    }

    /**
     * Returns a human-readable string representation of the user and their on-call schedule.
     * 
     * @returns Formatted string with user details and all on-call periods
     * 
     * @example
     * ```typescript
     * console.log(user.toString());
     * // Output:
     * // (PXXXXXX) John Doe was on call during:
     * // On call period from Thu Aug 01 2024 17:30:00 to Mon Aug 05 2024 09:00:00 (Europe/London)
     * // Number of OOH Weekdays (Mon-Thu): 1
     * // Number of OOH Weekends (Fri-Sun): 3
     * ```
     */
    toString(): string {
        const periodsInfo = this._onCallPeriods
            .map(ocp => ocp.toString())
            .join('\n');
        return `(${this.id}) ${this.name} was on call during:\n${periodsInfo}`;
    }

    /**
     * Calculates the total number of out-of-hours weekdays (Monday-Thursday).
     * 
     * Sums up all OOH weekdays across all on-call periods for this user.
     * Each qualifying OOH day on Mon-Thu counts as one unit at £50 compensation.
     * 
     * @returns Total count of OOH weekdays
     * 
     * @example
     * ```typescript
     * const weekdayCount = user.getTotalOohWeekDays();
     * const weekdayCompensation = weekdayCount * 50; // £50 per weekday
     * ```
     */
    public getTotalOohWeekDays(): number {
        return this._onCallPeriods.reduce((acc, ocp) => acc + ocp.numberOfOohWeekDays, 0);
    }

    /**
     * Calculates the total number of out-of-hours weekend days (Friday-Sunday).
     * 
     * Sums up all OOH weekend days across all on-call periods for this user.
     * Each qualifying OOH day on Fri-Sun counts as one unit at £75 compensation.
     * 
     * @returns Total count of OOH weekend days
     * 
     * @example
     * ```typescript
     * const weekendCount = user.getTotalOohWeekendDays();
     * const weekendCompensation = weekendCount * 75; // £75 per weekend day
     * ```
     */
    public getTotalOohWeekendDays(): number {
        return this._onCallPeriods.reduce((acc, ocp) => acc + ocp.numberOfOohWeekends, 0);
    }
}

