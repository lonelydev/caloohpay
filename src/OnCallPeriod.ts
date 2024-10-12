export class OnCallPeriod {

    public readonly since: Date;
    public readonly until: Date;

    private _numberOfWeekDays: number = 0;
    private _numberOfWeekendDays: number = 0;

    constructor (s:Date, u:Date) {
        this.since = s;
        this.until = u;
        this.initializeWeekDayAndWeekendDayCount();
    }

    private initializeWeekDayAndWeekendDayCount() {
        let curDate = new Date(this.since);
        while (curDate < this.until) {
            if (this.isWeekDay(curDate.getDay())) {
                this._numberOfWeekDays++;
            } else {
                this._numberOfWeekendDays++;
            }
            curDate.setDate(curDate.getDate() + 1);
        }
    }

    public get numberOfWeekDays(): number {
        return this._numberOfWeekDays;
    }

    private set numberOfWeekDays(value: number) {
        this._numberOfWeekDays = value;
    }

    public get numberOfWeekendDays(): number {
        return this._numberOfWeekendDays;
    }

    public set numberOfWeekendDays(value: number) {
        this._numberOfWeekendDays = value;
    }

    private isWeekDay(dayNum: number): boolean {
        return dayNum > 0 && dayNum < 5;
    }
}
