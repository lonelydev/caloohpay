import {api} from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';

dotenv.config();

interface Environment {
    API_TOKEN: string;
}

function sanitiseEnvVariable(envVars: NodeJS.ProcessEnv): Environment {
    if (!envVars.API_TOKEN){
        throw new Error("API_TOKEN not defined");
    }
    return {
        API_TOKEN: envVars.API_TOKEN,
    };
}

const sanitisedEnvVars: Environment = sanitiseEnvVariable(process.env);

const pd = api({token: sanitisedEnvVars.API_TOKEN});

const sinceDate:string = "2024-08-01";
const untilDate:string = "2024-08-31";

pd.get('/schedules/PBV22PW', 
    {data: {
        overflow: false,
        since: sinceDate,
        time_zone: "Europe/London",
        until: untilDate
    }}
    )
    .then(
        ({data, resource, response, next}) => {
        console.log("Schedule name: %s", data.schedule.name);
        console.log("Schedule URL: %s", data.schedule.html_url);
        displayFinalSchedule(data.schedule.final_schedule, sinceDate, untilDate);
    })
    .catch(console.error);

export interface User {
    type: string,
    id: string,
    summary?: string,
    self?: string,
    html_url?: string
}

export interface UserOncall {
    start: Date,
    end: Date,
    user?: User
}

export interface FinalSchedule {
    name: String,
    rendered_schedule_entries: UserOncall[]
}

export function displayFinalSchedule(finalSchedule: FinalSchedule, sinceDate: string, untilDate: string){
    if(finalSchedule == null || typeof finalSchedule == 'undefined'){
        console.error("Could not render final schedule! It is undefined or null.");
    }
    if(finalSchedule.rendered_schedule_entries){
        console.log("%d people were on-call for this schedule between %s and %s", 
            finalSchedule.rendered_schedule_entries.length,
            sinceDate,
            untilDate);
        console.log("**********");
        finalSchedule.rendered_schedule_entries
        .forEach(element => {
            console.log("%s (%s) was on call from %s to %s", element.user?.summary, element.user?.id, element.start, element.end);
        });
        console.log("**********");

    }
}
/**
 * user can go on-call multiple times in a month. 
 * 1 user will have a list of periods where they were oncall.
 */


