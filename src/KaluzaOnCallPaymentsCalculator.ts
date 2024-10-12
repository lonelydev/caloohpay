import { IOnCallPaymentsCalculator } from "./IOnCallPaymentsCalculator";
import { OnCallCompensation } from "./OnCallCompensation";
import { OnCallUser } from "./OnCallUser";

function wasPersonOnCallOOH(dateToCheck: Date, onCallUntilDate: Date): boolean {
    var dateToCheckEvening = new Date(dateToCheck);
    dateToCheckEvening.setHours(18);
    return (dateToCheckEvening > dateToCheck && dateToCheckEvening < onCallUntilDate)
}

export function dateDiffInHours(until: Date, since: Date): number {
    return Math.round(Math.abs(until.getTime()) - Math.abs(since.getTime())) / (1000 * 60 * 60);
}

function validateOnCallUser(onCallUser: OnCallUser): void {
    if (!onCallUser) {
        throw new Error("User undefined!");
    }
    if (!onCallUser.onCallPeriods) {
        throw new Error("No on call periods defined!");
    }
}

export class KaluzaOnCallPaymentsCalculator implements IOnCallPaymentsCalculator {
    public static WeekDayRate: number = 50;
    public static WeekEndRate: number = 75;

    /**
     * The calculator works on the assumption that the request was made with full date time format
     * i.e. since is YYYY-MM-DDT00:00:00+01:00 AND until is YYYY-MM-DDT23:59:59+01:00
     */
    calculateOnCallPayment(onCallUser: OnCallUser): number {
        validateOnCallUser(onCallUser);
        return (onCallUser.getTotalOohWeekDays() * KaluzaOnCallPaymentsCalculator.WeekDayRate) + 
            (onCallUser.getTotalOohWeekendDays() * KaluzaOnCallPaymentsCalculator.WeekEndRate);
    }

    calculateOnCallPayments(onCallUsers: OnCallUser[]): Record<string, number> {
        let payments: Record<string, number> = {};
        for (let i = 0; i < onCallUsers.length; i++) {
            payments[onCallUsers[i].id] = this.calculateOnCallPayment(onCallUsers[i]);
        }
        return payments;
    }

    getAuditableOnCallPaymentRecords(onCallUsers: OnCallUser[]): Record<string, OnCallCompensation> {
        /**
         * for every OnCallUser item, create an OnCallCompensation object
         * calculate number of weekdays and weekends that the person was on call
         */
        let onCallCompensations: Record<string, OnCallCompensation> = {};
        for (let onCallUser of onCallUsers) {
            validateOnCallUser(onCallUser);
            onCallCompensations[onCallUser.id] = {
                OnCallUser: onCallUser,
                totalCompensation: 
                    (onCallUser.getTotalOohWeekDays() * KaluzaOnCallPaymentsCalculator.WeekDayRate) + 
                    (onCallUser.getTotalOohWeekendDays() * KaluzaOnCallPaymentsCalculator.WeekEndRate)
            }
        }
        
        return onCallCompensations;
    }
}
