import { IOnCallPaymentsCalculator } from "./IOnCallPaymentsCalculator";
import { Days } from "./Days";
import { OnCallUser } from "./OnCallUser";

function wasPersonOnCallOOH(dateToCheck: Date, onCallUntilDate: Date): boolean {
    const onCallDurationInHours = dateDiffInHours(onCallUntilDate, dateToCheck);
    var dateToCheckEvening = new Date(dateToCheck);
    dateToCheckEvening.setHours(18);
    return (dateToCheckEvening > dateToCheck && dateToCheckEvening < onCallUntilDate)
}

export function dateDiffInHours(until: Date, since: Date): number {
    return Math.round(Math.abs(until.getTime()) - Math.abs(since.getTime())) / (1000 * 60 * 60);
}

export class KaluzaOnCallPaymentsCalculator implements IOnCallPaymentsCalculator {
    onCallRates: Record<Days, number>;

    constructor(onCallRates: Record<Days, number>) {
        this.onCallRates = onCallRates;
    }

    /**
     * The calculator works on the assumption that the request was made with full date time format
     * i.e. since is YYYY-MM-DDT00:00:00+01:00 AND until is YYYY-MM-DDT23:59:59+01:00
     */
    calculateOnCallPayment(onCallUser: OnCallUser): number {
        if (!onCallUser) {
            throw new Error("User undefined!");
        }
        let onCallDays: Record<Days, number> = {
            [Days.SUNDAY]: 0,
            [Days.MONDAY]: 0,
            [Days.TUESDAY]: 0,
            [Days.WEDNESDAY]: 0,
            [Days.THURSDAY]: 0,
            [Days.FRIDAY]: 0,
            [Days.SATURDAY]: 0,
        }
        for (let i = 0; i < onCallUser.onCallPeriods.length; i++) {
            if (onCallUser.onCallPeriods[i].since > onCallUser.onCallPeriods[i].until) {
                throw new Error("Invalid date range!");
            }

            let curDate = onCallUser.onCallPeriods[i].since;
            while (curDate < onCallUser.onCallPeriods[i].until) {
                if (wasPersonOnCallOOH(curDate, onCallUser.onCallPeriods[i].until)) {
                    //console.log("curDate.getDay() as Days %s", curDate.getDay() as Days);
                    onCallDays[curDate.getDay() as Days] += 1;
                }
                curDate.setDate(curDate.getDate() + 1);
            }
        }
        let totalPayment = 0;
        for (const day in onCallDays) {
            // convert string day to number
            let dayNum = +day;
            totalPayment += onCallDays[dayNum as Days] * this.onCallRates[dayNum as Days];
        }
        return totalPayment;
    }

    calculateOnCallPayments(onCallUsers: OnCallUser[]): Record<string, number> {
        let payments: Record<string, number> = {};
        for (let i = 0; i < onCallUsers.length; i++) {
            payments[onCallUsers[i].id] = this.calculateOnCallPayment(onCallUsers[i]);
        }
        return payments;
    }
}
