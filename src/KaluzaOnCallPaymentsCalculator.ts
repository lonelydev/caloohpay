import { IOnCallPaymentsCalculator } from "./IOnCallPaymentsCalculator";
import { Days } from "./Days";
import { OnCallUser } from "./OnCallUser";

function wasPersonOnCallOOH(dateToCheck: Date, onCallUntilDate: Date): boolean {
    /**
     * was the person OnCall after 6pm on dateToCheck
     * was the diff between onCallUntilDate and dateToCheck > 12 hours
     * then the person was on-call OOH for the night of dateToCheck
     */
    const onCallDurationInHours = dateDiffInHours(onCallUntilDate, dateToCheck);
    // check if dateToCheck with time 1800 is within the range of dateToCheck and onCallUntilDate
    var dateToCheckEvening = new Date(dateToCheck);
    dateToCheckEvening.setHours(18);
    if (dateToCheckEvening > dateToCheck && dateToCheckEvening < onCallUntilDate){ //&& onCallDurationInHours > 14) {
        return true;
    }
    return false;
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
                /**
                 * for every date check if the person was on-call in the evenings after 6pm
                 * and on-call for hours from 0-10am. Then the person was on-call OOH for 1 night
                 *
                 * https://stackoverflow.com/questions/2250036/how-to-determine-if-it-is-day-or-night-in-javascript
                 */

                /**
                 * given a date range, calculate number of days where the shift started after 6pm
                 * and was longer than 12 hours.
                 * If true, then increment a counter corresponding to userOohDays[day] 
                 * where day is the day of the week. This will be used to calculate the payment later.
                 * For every key in userOohDays, onCallPayment += userOohDays[key] * onCallRates[key]  
                 */
                //console.log(curDate);
                if (wasPersonOnCallOOH(curDate, onCallUser.onCallPeriods[i].until)) {
                    //console.log("curDate.getDay() as Days %s", curDate.getDay() as Days);
                    onCallDays[curDate.getDay() as Days] += 1;
                }
                curDate.setDate(curDate.getDate() + 1);
            }
        }
        // Calculate payment based on onCallDays and onCallRates
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
