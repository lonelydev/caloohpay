import {api} from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';
import { OnCallUser } from './OnCallUser';
import { OnCallPeriod } from './OnCallPeriod';

dotenv.config();

interface Environment {
    API_TOKEN: string;
}

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

const sinceDate:string = "2024-08-01T00:00:00+01:00";
const untilDate:string = "2024-08-31T23:59:59+01:00";
const kafkaScheduleId:string = "PSNB4LV";
const incidentCommanderScheduleId = "PBV22PW";
const infraPlatScheduleId = "PNMPHEA";

pd.get(`/schedules/${incidentCommanderScheduleId}`, 
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
        // this is the list of all the users that might have been originally on-call for this schedule
        // this is not the final on-call schedule users
        // console.log("%d users are on-call for this schedule between %s and %s", 
        //     data.schedule.users.length,
        //     sinceDate,
        //     untilDate);
        // console.log("On-call users: ");    
        // data.schedule.users.forEach((user: User) => {
        //     console.log("%s (%s)", user.summary, user.id);
        // });
        let onCallUsers = getOnCallUsersInDateRange(data.schedule.final_schedule, sinceDate, untilDate);
        displayOnCallUsers(onCallUsers);
        //displayFinalSchedule(data.schedule.final_schedule, sinceDate, untilDate);
    })
    .catch(console.error);



export function displayFinalSchedule(finalSchedule: FinalSchedule, sinceDate: string, untilDate: string){
    if(finalSchedule == null || typeof finalSchedule == 'undefined'){
        console.error("Could not render final schedule! It is undefined or null.");
    }
    if(finalSchedule.rendered_schedule_entries){
        console.log("**********");
        finalSchedule.rendered_schedule_entries
        .forEach(element => {
            console.log("%s (%s) was on call from %s to %s", element.user?.summary, element.user?.id, element.start, element.end);
        });
        console.log("**********");

    }
}

function getOnCallUsersInDateRange(finalSchedule: FinalSchedule, sinceDate: string, untilDate: string): Record<string,OnCallUser> {
    let onCallUsers: Record<string,OnCallUser> = {};
    if(finalSchedule.rendered_schedule_entries){
        finalSchedule.rendered_schedule_entries.forEach(scheduleEntry => {
            let onCallUser = getOnCallUserFromScheduleEntry(scheduleEntry);
            if(onCallUsers[onCallUser.id]){
                onCallUsers[onCallUser.id].onCallPeriods.push(onCallUser.onCallPeriods[0]);
            } else {
                onCallUsers[onCallUser.id] = onCallUser;
            }
        });
    }
    return onCallUsers;
}

interface ScheduleEntry {
    user?: User,
    start: Date,
    end: Date   
}

function getOnCallUserFromScheduleEntry(scheduleEntry: ScheduleEntry): OnCallUser {
    return {
        id: scheduleEntry.user?.id || "",
        name: scheduleEntry.user?.summary || "",
        onCallPeriods: [
            new OnCallPeriod(scheduleEntry.start, scheduleEntry.end)
        ]
    };
}

function displayOnCallUsers(onCallUsers: Record<string,OnCallUser>){
    console.log("On call users: ");
    for (const [userId, onCallUser] of Object.entries(onCallUsers)) {
        console.log("%s was on call for the following periods:", onCallUser.name);
        onCallUser.onCallPeriods.forEach(ocp => {
            console.log("From %s to %s", ocp.since, ocp.until);
        });
    }
}

