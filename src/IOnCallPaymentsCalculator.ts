import { OnCallCompensation } from "./OnCallCompensation";
import { OnCallUser } from "./OnCallUser";


export interface IOnCallPaymentsCalculator {
    calculateOnCallPayment(onCallUser: OnCallUser): number;
    calculateOnCallPayments(onCallUsers: OnCallUser[]): Record<string, number>;
}
