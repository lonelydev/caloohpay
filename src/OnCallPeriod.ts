import { DateTime } from 'luxon';

export class OnCallPeriod {
    // Constants for day classification
    private static readonly WEEKDAY_START = 1; // Monday
    private static readonly WEEKDAY_END = 4;   // Thursday (inclusive)
    
    // Constants for shift validation
    private static readonly END_OF_WORK_HOUR = 17;
    private static readonly END_OF_WORK_MINUTE = 30;
    private static readonly MIN_SHIFT_HOURS = 6;
    private static readonly MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

    readonly since: Date;
    readonly until: Date;
    readonly timeZone: string;

    private _numberOfOohWeekDays: number = 0;
    private _numberOfOohWeekends: number = 0;

    constructor(s: Date, u: Date, timeZone: string = 'UTC') {
        this.since = new Date(s);
        this.until = new Date(u);
        this.timeZone = timeZone;
        this.initializeOohWeekDayAndWeekendDayCount();
    }

    private initializeOohWeekDayAndWeekendDayCount() {
        let curDateTime = DateTime.fromJSDate(this.since, { zone: this.timeZone });
        const untilDateTime = DateTime.fromJSDate(this.until, { zone: this.timeZone });
        
        while (curDateTime < untilDateTime) {
            // Check if there's an OOH shift from this day to the end of the period
            if (OnCallPeriod.wasPersonOnCallOOH(curDateTime, untilDateTime, this.timeZone)) {
                if (OnCallPeriod.isWeekDay(curDateTime.weekday)) {
                    this._numberOfOohWeekDays++;
                } else {
                    this._numberOfOohWeekends++;
                }
            }
            curDateTime = curDateTime.plus({ days: 1 });
        }
    }

    public get numberOfOohWeekDays(): number {
        return this._numberOfOohWeekDays;
    }

    public get numberOfOohWeekends(): number {
        return this._numberOfOohWeekends;
    }

    /**
     * Determines if the given day number corresponds to a weekday.
     * Luxon uses 1 for Monday through 7 for Sunday
     *
     * @param dayNum - The number representing the day of the week (1 for Monday, ..., 7 for Sunday).
     * @returns `true` if the day number corresponds to a weekday (Monday to Thursday), otherwise `false`.
     */
    private static isWeekDay(dayNum: number): boolean {
        return dayNum >= OnCallPeriod.WEEKDAY_START && dayNum <= OnCallPeriod.WEEKDAY_END;
    }

    /**
     * Determines if a person was on call during OOH (Out of Hours) period.
     * OOH is defined as shifts that:
     * 1. Span across days (not same day start and end)
     * 2. Extend past end of work hours (17:30)
     * 3. Are longer than 6 hours
     * 
     * @param since start of the shift as Luxon DateTime in the schedule's timezone
     * @param until end of the shift as Luxon DateTime in the schedule's timezone
     * @param timeZone IANA timezone identifier for the schedule
     * @returns true if the person was on call OOH, false otherwise
     */
    private static wasPersonOnCallOOH(since: DateTime, until: DateTime, timeZone: string): boolean {
        return (OnCallPeriod.doesShiftSpanEveningTillNextDay(since, until) &&
            OnCallPeriod.isShiftLongerThan6Hours(since, until));
    }

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

    private static isShiftLongerThan6Hours(since: DateTime, until: DateTime): boolean {
        const shiftDurationMs = until.toMillis() - since.toMillis();
        const minShiftDurationMs = OnCallPeriod.MIN_SHIFT_HOURS * OnCallPeriod.MILLISECONDS_PER_HOUR;
        return shiftDurationMs >= minShiftDurationMs;
    }

    private static doesShiftSpanDays(since: DateTime, until: DateTime): boolean {
        /**
         * if the dates are not the same, then the shift spans days
         * this is to cover all cases, whether the shift since is end of a month
         * and until is early in the next month.
         */
        return (since.day !== until.day) || (since.month !== until.month) || (since.year !== until.year);
    }

    toString(): string {
        return `On call period from ${this.since} to ${this.until} (${this.timeZone})\n` +
               `Number of OOH Weekdays (Mon-Thu): ${this.numberOfOohWeekDays}\n` +
               `Number of OOH Weekends (Fri-Sun): ${this.numberOfOohWeekends}`;
    }
}
