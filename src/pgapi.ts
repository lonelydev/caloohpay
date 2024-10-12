import {api} from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';
import { OnCallUser } from './OnCallUser';
import { OnCallPeriod } from './OnCallPeriod';
import { KaluzaOnCallPaymentsCalculator } from './KaluzaOnCallPaymentsCalculator';

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

        let onCallUsers = getOnCallUsersInDateRange(data.schedule.final_schedule, sinceDate, untilDate);
        let kOnCallPaymentsCalculator = new KaluzaOnCallPaymentsCalculator();
        let listOfOnCallUsers = Object.values(onCallUsers);
        
        let auditableRecords = kOnCallPaymentsCalculator.getAuditableOnCallPaymentRecords(listOfOnCallUsers);
        console.log("User, TotalComp, Mon-Thu, Fri-Sun");

        for (const [userId, onCallCompensation] of Object.entries(auditableRecords)) {
            console.log("%s, %d, %d, %d", 
                onCallCompensation.OnCallUser.name, 
                onCallCompensation.totalCompensation,
                onCallCompensation.OnCallUser.getTotalOohWeekDays(),
                onCallCompensation.OnCallUser.getTotalOohWeekendDays());
        }
    })
    .catch(console.error);

    function getOnCallUsersInDateRange(finalSchedule: FinalSchedule, sinceDate: string, untilDate: string): Record<string,OnCallUser> {
        let onCallUsers: Record<string,OnCallUser> = {};
        if(finalSchedule.rendered_schedule_entries){
            finalSchedule.rendered_schedule_entries.forEach(scheduleEntry => {
                let onCallUser = getOnCallUserFromScheduleEntry(scheduleEntry);
                if(onCallUser.id in onCallUsers){
                    onCallUsers[onCallUser.id].addOnCallPeriods(onCallUser.onCallPeriods);
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
        let onCallPeriod = new OnCallPeriod(scheduleEntry.start, scheduleEntry.end);
        let onCallUser = new OnCallUser(
            scheduleEntry.user?.id || "", 
            scheduleEntry.user?.summary || "", [onCallPeriod]);
        return onCallUser
    }


// export function displayFinalSchedule(finalSchedule: FinalSchedule, sinceDate: string, untilDate: string){
//     if(finalSchedule == null || typeof finalSchedule == 'undefined'){
//         console.error("Could not render final schedule! It is undefined or null.");
//     }
//     if(finalSchedule.rendered_schedule_entries){
//         console.log("**********");
//         finalSchedule.rendered_schedule_entries
//         .forEach(element => {
//             console.log("%s (%s) was on call from %s to %s", element.user?.summary, element.user?.id, element.start, element.end);
//         });
//         console.log("**********");

//     }
// }


// function displayOnCallUsers(onCallUsers: Record<string,OnCallUser>){
//     console.log("On call users: ");
//     for (const [userId, onCallUser] of Object.entries(onCallUsers)) {
//         console.log("%s was on call for the following periods:", onCallUser.name);
//         onCallUser.onCallPeriods.forEach(ocp => {
//             console.log("From %s to %s", ocp.since, ocp.until);
//         });
//     }
// }

