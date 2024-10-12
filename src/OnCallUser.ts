import { OnCallPeriod } from "./OnCallPeriod";

export class OnCallUser {
    id: string;
    name: string;
    onCallPeriods: OnCallPeriod[];

    constructor(id: string, name: string, periods: OnCallPeriod[]) {
        this.id = id;
        this.name = name;
        this.onCallPeriods = { ...periods };
    }

    toString() {
        console.log("(%s) %s was on call during: ", this.id, this.name);
        this.onCallPeriods.forEach(ocp => console.log("From %s to %s", ocp.since, ocp.until));
    }
}
