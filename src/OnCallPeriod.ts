import { DateTime } from 'luxon';

/**
 * Represents a continuous on-call period with automatic OOH (Out of Hours) calculation.
 * 
 * This class encapsulates the business logic for determining whether on-call shifts
 * qualify as "out of hours" work and categorizing them into weekdays vs. weekends.
 * It uses timezone-aware date handling to ensure accurate calculations across
 * different geographical locations.
 * 
 * @category Core
 * 
 * @remarks
 * ## OOH Qualification Criteria
 * 
 * A shift qualifies as OOH (Out of Hours) if it meets ALL of the following:
 * 1. **Spans Days**: Start and end are on different calendar days
 * 2. **After Work Hours**: Extends past 17:30 (end of work day)
 * 3. **Minimum Duration**: Lasts at least 6 hours
 * 
 * ## Day Classification
 * 
 * - **Weekdays** (Mon-Thu): Compensated at £50 per OOH day
 * - **Weekends** (Fri-Sun): Compensated at £75 per OOH day
 * 
 * Note: Friday is considered a weekend day for compensation purposes.
 * 
 * ## Timezone Handling
 * 
 * All date calculations respect the provided timezone to ensure accurate
 * determination of "end of work day" and day boundaries. This is critical
 * for distributed teams across multiple timezones.
 * 
 * @example
 * ```typescript
 * // Create a period for Thursday 5pm to Monday 9am (UK time)
 * const period = new OnCallPeriod(
 *   new Date('2024-08-01T17:30:00+01:00'),
 *   new Date('2024-08-05T09:00:00+01:00'),
 *   'Europe/London'
 * );
 * 
 * console.log(period.numberOfOohWeekDays);    // 1 (Thursday)
 * console.log(period.numberOfOohWeekends);    // 3 (Friday, Saturday, Sunday)
 * // Monday is excluded as shift ends at 09:00 (before 17:30)
 * ```
 */
export class OnCallPeriod {
    // Constants for day classification
    /** Monday (Luxon uses 1-7, where 1 = Monday) */
    private static readonly WEEKDAY_START = 1; // Monday
    /** Thursday (inclusive as a weekday) */
    private static readonly WEEKDAY_END = 4;   // Thursday (inclusive)
    
    // Constants for shift validation
    /** Hour when work day ends (5:30 PM = 17:30) */
    private static readonly END_OF_WORK_HOUR = 17;
    /** Minute component of end of work day (17:30) */
    private static readonly END_OF_WORK_MINUTE = 30;
    /** Minimum shift duration in hours to qualify as OOH */
    private static readonly MIN_SHIFT_HOURS = 6;
    /** Conversion factor for hours to milliseconds */
    private static readonly MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

    /** Start date/time of the on-call period */
    readonly since: Date;
    /** End date/time of the on-call period */
    readonly until: Date;
    /** IANA timezone identifier (e.g., 'Europe/London', 'America/New_York') */
    readonly timeZone: string;

    /** Calculated count of OOH weekdays (Mon-Thu) in this period */
    private _numberOfOohWeekDays = 0;
    /** Calculated count of OOH weekend days (Fri-Sun) in this period */
    private _numberOfOohWeekends = 0;

    /**
     * Creates a new OnCallPeriod and automatically calculates OOH days.
     * 
     * The constructor immediately analyzes the period to determine which days
     * qualify as out-of-hours work, categorizing them into weekdays and weekends.
     * 
     * @param s - Start date/time of the on-call period
     * @param u - End date/time of the on-call period
     * @param timeZone - IANA timezone identifier (defaults to 'UTC')
     * 
     * @example
     * ```typescript
     * const period = new OnCallPeriod(
     *   new Date('2024-08-01T17:00:00Z'),
     *   new Date('2024-08-04T09:00:00Z'),
     *   'Europe/London'
     * );
     * ```
     */
    constructor(s: Date, u: Date, timeZone = 'UTC') {
        this.since = new Date(s);
        this.until = new Date(u);
        this.timeZone = timeZone;
        this.initializeOohWeekDayAndWeekendDayCount();
    }

    /**
     * Initializes the count of OOH weekdays and weekends for this period.
     * 
     * Uses a functional approach to collect all OOH days and categorize them
     * into weekdays and weekends. This makes the logic easier to test and reason about.
     * 
     * @private
     * @remarks
     * This method is called automatically by the constructor. It walks through
     * the period day by day in the schedule's timezone to ensure accurate
     * day boundaries and work-hour calculations.
     */
    private initializeOohWeekDayAndWeekendDayCount() {
        const oohDays = this.getOohDaysInPeriod();
        this._numberOfOohWeekDays = oohDays.filter(dt => OnCallPeriod.isWeekDay(dt.weekday)).length;
        this._numberOfOohWeekends = oohDays.filter(dt => !OnCallPeriod.isWeekDay(dt.weekday)).length;
    }

    /**
     * Collects all days in the period that qualify as out-of-hours work.
     * 
     * Iterates through each day from start to end, checking if there was qualifying
     * OOH work on that day. Returns an array of DateTime objects representing
     * each OOH day.
     * 
     * @private
     * @returns Array of DateTime objects for each day with OOH work
     * 
     * @remarks
     * This pure function approach makes the logic more testable and easier to understand.
     * It separates the iteration logic from the categorization logic, following the
     * Single Responsibility Principle.
     * 
     * @example
     * ```typescript
     * // Internal usage - returns array like:
     * // [DateTime('2024-08-01'), DateTime('2024-08-02'), DateTime('2024-08-03')]
     * ```
     */
    private getOohDaysInPeriod(): DateTime[] {
        const oohDays: DateTime[] = [];
        let curDateTime = DateTime.fromJSDate(this.since, { zone: this.timeZone });
        const untilDateTime = DateTime.fromJSDate(this.until, { zone: this.timeZone });
        
        while (curDateTime < untilDateTime) {
            // Check if there's an OOH shift from this day to the end of the period
            if (OnCallPeriod.wasPersonOnCallOOH(curDateTime, untilDateTime)) {
                oohDays.push(curDateTime);
            }
            curDateTime = curDateTime.plus({ days: 1 });
        }
        
        return oohDays;
    }

    /**
     * Gets the number of OOH weekdays (Monday-Thursday) in this period.
     * 
     * @returns Count of OOH weekdays
     */
    public get numberOfOohWeekDays(): number {
        return this._numberOfOohWeekDays;
    }

    /**
     * Gets the number of OOH weekend days (Friday-Sunday) in this period.
     * 
     * @returns Count of OOH weekend days
     */
    public get numberOfOohWeekends(): number {
        return this._numberOfOohWeekends;
    }

    /**
     * Determines if the given day number corresponds to a weekday.
     * 
     * Luxon uses 1 for Monday through 7 for Sunday. Weekdays for compensation
     * purposes are Monday (1) through Thursday (4). Friday is considered a
     * weekend day for compensation.
     *
     * @private
     * @param dayNum - The number representing the day of the week (1-7, where 1 = Monday)
     * @returns `true` if the day is Monday-Thursday, `false` if Friday-Sunday
     * 
     * @example
     * ```typescript
     * OnCallPeriod.isWeekDay(1);  // true  (Monday)
     * OnCallPeriod.isWeekDay(4);  // true  (Thursday)
     * OnCallPeriod.isWeekDay(5);  // false (Friday - weekend rate)
     * OnCallPeriod.isWeekDay(7);  // false (Sunday)
     * ```
     */
    private static isWeekDay(dayNum: number): boolean {
        return dayNum >= OnCallPeriod.WEEKDAY_START && dayNum <= OnCallPeriod.WEEKDAY_END;
    }

    /**
     * Determines if a person was on call during Out of Hours (OOH) period.
     * 
     * A shift qualifies as OOH if it meets ALL the following criteria:
     * 1. Spans across multiple days (not a same-day shift)
     * 2. Extends past the end of work hours (17:30)
     * 3. Is at least 6 hours in duration
     * 
     * @private
     * @param since - Start of the shift as Luxon DateTime in the schedule's timezone
     * @param until - End of the shift as Luxon DateTime in the schedule's timezone
     * @param timeZone - IANA timezone identifier for the schedule
     * @returns `true` if the shift qualifies as OOH, `false` otherwise
     * 
     * @remarks
     * This method is the core business logic for OOH determination. It ensures
     * that only substantial overnight shifts are counted, filtering out:
     * - Short shifts (< 6 hours)
     * - Same-day shifts (even if they end late)
     * - Shifts that end before 17:30
     */
    private static wasPersonOnCallOOH(since: DateTime, until: DateTime): boolean {
        return (OnCallPeriod.doesShiftSpanEveningTillNextDay(since, until) &&
            OnCallPeriod.isShiftLongerThan6Hours(since, until));
    }

    /**
     * Checks if a shift spans from evening into the next day.
     * 
     * A shift spans evening to next day if it:
     * - Continues past the end of work hours (17:30), AND
     * - Covers multiple calendar days
     * 
     * @private
     * @param since - Start of the shift
     * @param until - End of the shift
     * @returns `true` if shift extends past 17:30 and spans days, `false` otherwise
     * 
     * @remarks
     * This handles both cases:
     * - Shifts starting during work hours (e.g., 16:00-22:00)
     * - Shifts starting after work hours (e.g., 20:00-08:00)
     */
    private static doesShiftSpanEveningTillNextDay(since: DateTime, until: DateTime): boolean {
        /**
         * a shift could start during working hours and end after the working hours
         * a shift could start after working hours and end after the working hours
         */
        const endOfWorkingHours = since.set({ 
            hour: OnCallPeriod.END_OF_WORK_HOUR, 
            minute: OnCallPeriod.END_OF_WORK_MINUTE,
            second: 0,
            millisecond: 0
        });
        return (endOfWorkingHours < until) && 
            OnCallPeriod.doesShiftSpanDays(since, until);
    }

    /**
     * Checks if a shift is longer than the minimum 6-hour threshold.
     * 
     * @private
     * @param since - Start of the shift
     * @param until - End of the shift
     * @returns `true` if shift duration >= 6 hours, `false` otherwise
     * 
     * @remarks
     * The 6-hour minimum ensures that only substantial on-call periods
     * are compensated, filtering out brief handover periods or short shifts.
     */
    private static isShiftLongerThan6Hours(since: DateTime, until: DateTime): boolean {
        const shiftDurationMs = until.toMillis() - since.toMillis();
        const minShiftDurationMs = OnCallPeriod.MIN_SHIFT_HOURS * OnCallPeriod.MILLISECONDS_PER_HOUR;
        return shiftDurationMs >= minShiftDurationMs;
    }

    /**
     * Checks if a shift spans multiple calendar days.
     * 
     * Compares day, month, and year to handle edge cases like month/year boundaries.
     * 
     * @private
     * @param since - Start of the shift
     * @param until - End of the shift
     * @returns `true` if shift crosses day boundary, `false` if same day
     * 
     * @remarks
     * This comprehensive check ensures accuracy even when:
     * - Shift crosses month boundary (e.g., Jan 31 to Feb 1)
     * - Shift crosses year boundary (e.g., Dec 31 to Jan 1)
     */
    private static doesShiftSpanDays(since: DateTime, until: DateTime): boolean {
        /**
         * if the dates are not the same, then the shift spans days
         * this is to cover all cases, whether the shift since is end of a month
         * and until is early in the next month.
         */
        return (since.day !== until.day) || (since.month !== until.month) || (since.year !== until.year);
    }

    /**
     * Returns a human-readable string representation of this on-call period.
     * 
     * Includes the date range, timezone, and breakdown of OOH days by category.
     * 
     * @returns Formatted multi-line string describing the period
     * 
     * @example
     * ```typescript
     * console.log(period.toString());
     * // Output:
     * // On call period from Thu Aug 01 2024 17:30:00 to Mon Aug 05 2024 09:00:00 (Europe/London)
     * // Number of OOH Weekdays (Mon-Thu): 1
     * // Number of OOH Weekends (Fri-Sun): 3
     * ```
     */
    toString(): string {
        return `On call period from ${this.since} to ${this.until} (${this.timeZone})\n` +
               `Number of OOH Weekdays (Mon-Thu): ${this.numberOfOohWeekDays}\n` +
               `Number of OOH Weekends (Fri-Sun): ${this.numberOfOohWeekends}`;
    }
}
