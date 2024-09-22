import { OnCallUser } from "./OnCallUser";


export interface IOnCallPaymentsCalculator {
    calculateOnCallPayment(onCallUser: OnCallUser): number;
}
