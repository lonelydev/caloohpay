import { OnCallCompensation } from "./OnCallCompensation";
import { OnCallUser } from "./OnCallUser";

export class OnCallPaymentsCalculator {
    public static readonly WeekDayRate: number = 50;
    public static readonly WeekEndRate: number = 75;

    private validateOnCallUser(onCallUser: OnCallUser): void {
        if (!onCallUser) {
            throw new Error("User undefined!");
        }
        if (!onCallUser.onCallPeriods) {
            throw new Error("No on call periods defined!");
        }
    }

    /**
     * The calculator works on the assumption that the request was made with full date time format
     * i.e. since is YYYY-MM-DDT00:00:00+01:00 AND until is YYYY-MM-DDT23:59:59+01:00
     */
    calculateOnCallPayment(onCallUser: OnCallUser): number {
        this.validateOnCallUser(onCallUser);
        return (onCallUser.getTotalOohWeekDays() * OnCallPaymentsCalculator.WeekDayRate) + 
            (onCallUser.getTotalOohWeekendDays() * OnCallPaymentsCalculator.WeekEndRate);
    }

    calculateOnCallPayments(onCallUsers: OnCallUser[]): Record<string, number> {
        const payments: Record<string, number> = {};
        for (const onCallUser of onCallUsers) {
            payments[onCallUser.id] = this.calculateOnCallPayment(onCallUser);
        }
        return payments;
    }

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
