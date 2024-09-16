
export enum Days {
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
}

const onCallRates: Record<Days, number> = {
    [Days.SUNDAY]: 75,
    [Days.MONDAY]: 50,
    [Days.TUESDAY]: 50,
    [Days.WEDNESDAY]: 50,
    [Days.THURSDAY]: 50,
    [Days.FRIDAY]: 75,
    [Days.SATURDAY]: 75,
}

export class OnCallPeriod {
    since: Date;
    until: Date;

    constructor(s = new Date(), u = new Date((new Date()).getDate() + 1)) {
        this.since = s;
        this.until = u;
    }
}

export class OnCallUser {
    id: string;
    name: string;
    onCallPeriods: OnCallPeriod[];

    constructor(id: string, name: string, periods: OnCallPeriod[]){
        this.id = id;
        this.name = name;
        this.onCallPeriods = {...periods};
    }

    toString(){
        console.log("(%s) %s was on call during: ", this.id, this.name);
        this.onCallPeriods.forEach(ocp => 
            console.log("From %s to %s",ocp.since, ocp.until))
    }
}

export interface IOnCallPaymentsCalculator {
    calculateOnCallPayment(onCallUser: OnCallUser): number;
}

export class KaluzaOnCallPaymentsCalculator implements IOnCallPaymentsCalculator {
    onCallRates: Record<Days, number>;

    constructor(onCallRates: Record<Days,number>){
        this.onCallRates = onCallRates;
    }

    calculateOnCallPayment(onCallUser: OnCallUser): number {
        if (!onCallUser){
            throw new Error("User undefined!");
        }
        onCallUser.onCallPeriods.forEach(ocp => {
            let curDate = ocp.since;
            while(curDate <= ocp.until){
                /**
                 * for every date check if the person was on-call in the evenings after 6pm
                 * and on-call for hours from 0-10am. Then the person was on-call OOH for 1 night
                 * 
                 * https://stackoverflow.com/questions/2250036/how-to-determine-if-it-is-day-or-night-in-javascript
                 * start simple by just counting days.
                 */
            }
        })
        return 1;
    }

} 