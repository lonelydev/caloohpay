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

    private _numberOfOohWeekDays: number = 0;
    private _numberOfOohWeekends: number = 0;

    // TODO: Refactor to use Luxon timezone-aware operations throughout
    // Current implementation uses native Date methods which depend on system timezone
    // This works with TZ=Europe/London in CI but needs proper multi-timezone support
    // See: https://github.com/lonelydev/caloohpay/issues - create issue for proper timezone handling
    constructor(s: Date, u: Date) {
        this.since = new Date(s);
        this.until = new Date(u);
        this.initializeOohWeekDayAndWeekendDayCount();
    }

    private initializeOohWeekDayAndWeekendDayCount() {
        const curDate = new Date(this.since);
        while (curDate < this.until) {
            if (OnCallPeriod.wasPersonOnCallOOH(curDate, this.until)) {
                if (OnCallPeriod.isWeekDay(curDate.getDay())) {
                    this._numberOfOohWeekDays++;
                } else {
                    this._numberOfOohWeekends++;
                }
            }
            curDate.setDate(curDate.getDate() + 1);
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
     *
     * @param dayNum - The number representing the day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday).
     * @returns `true` if the day number corresponds to a weekday (Monday to Thursday), otherwise `false`.
     */
    private static isWeekDay(dayNum: number): boolean {
        return dayNum >= OnCallPeriod.WEEKDAY_START && dayNum <= OnCallPeriod.WEEKDAY_END;
    }

    /**
     * Currently works on the assumption that dates don't have anything to do with timezones
     * and anything after 6pm in whichever timezone the date is in is considered evening.
     * @param since start of the shift
     * @param until end of the shift
     * @returns true if the person was on call OOH, false otherwise
     */
    private static wasPersonOnCallOOH(since: Date, until: Date): boolean {
        return (OnCallPeriod.doesShiftSpanEveningTillNextDay(since, until) &&
            OnCallPeriod.isShiftLongerThan6Hours(since, until));
    }

    private static doesShiftSpanEveningTillNextDay(since: Date, until: Date): boolean {
        /**
         * a shift could start during working hours and end after the working hours
         * a shift could start after working hours and end after the working hours
         */
        const endOfWorkingHours = new Date(since);
        endOfWorkingHours.setHours(OnCallPeriod.END_OF_WORK_HOUR, OnCallPeriod.END_OF_WORK_MINUTE);
        return (endOfWorkingHours < until) && 
            OnCallPeriod.doesShiftSpanDays(since, until);
    }

    private static isShiftLongerThan6Hours(date: Date, onCallUntilDate: Date): boolean {
        const shiftDurationMs = onCallUntilDate.getTime() - date.getTime();
        const minShiftDurationMs = OnCallPeriod.MIN_SHIFT_HOURS * OnCallPeriod.MILLISECONDS_PER_HOUR;
        return shiftDurationMs >= minShiftDurationMs;
    }

    private static doesShiftSpanDays(since: Date, until: Date): boolean {
        /**
         * if the dates are not the same, then the shift spans days
         * this is to cover all cases, whether the shift since is end of a month
         * and until is early in the next month.
         */
        return (since.getDate() !== until.getDate());
    }

    toString(): string {
        return `On call period from ${this.since} to ${this.until}\n` +
               `Number of OOH Weekdays (Mon-Thu): ${this.numberOfOohWeekDays}\n` +
               `Number of OOH Weekends (Fri-Sun): ${this.numberOfOohWeekends}`;
    }
}
