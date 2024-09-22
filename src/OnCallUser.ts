
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
