export class OnCallPeriod {

    readonly since: Date;
    readonly until: Date;
    
    private _numberOfOohWeekDays: number = 0;
    private _numberOfOohWeekendDays: number = 0;

    constructor (s:Date, u:Date) {
        this.since = new Date(s);
        this.until = new Date(u);
        this.initializeOohWeekDayAndWeekendDayCount();
    }

    private initializeOohWeekDayAndWeekendDayCount() {
        let curDate = new Date(this.since);
        while (curDate < this.until) {
            if (OnCallPeriod.wasPersonOnCallOOH(curDate, this.until)) {
                if (OnCallPeriod.isWeekDay(curDate.getDay())) {
                    this._numberOfOohWeekDays++;
                } else {
                    this._numberOfOohWeekendDays++;
                }
            }
            
            curDate.setDate(curDate.getDate() + 1);
        }
    }

    public get numberOfOOhWeekDays(): number {
        return this._numberOfOohWeekDays;
    }

    public get numberOfOohWeekendDays(): number {
        return this._numberOfOohWeekendDays;
    }

    private static isWeekDay(dayNum: number): boolean {
        return dayNum > 0 && dayNum < 5;
    }
    
    private static wasPersonOnCallOOH(dateToCheck: Date, onCallUntilDate: Date): boolean {
        var dateToCheckEvening = new Date(dateToCheck);
        dateToCheckEvening.setHours(18);
        return (dateToCheckEvening > dateToCheck && dateToCheckEvening < onCallUntilDate)
    }

    toString() {
        console.log("On call period from %s to %s", this.since, this.until);
        console.log("Number of OOH Weekdays (Mon-Thu): %d", this.numberOfOOhWeekDays);
        console.log("Number of OOH Weekends (Fri-Sun): %d", this.numberOfOohWeekendDays);
    }
}
