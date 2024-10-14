import {api} from '@pagerduty/pdjs';
import * as dotenv from 'dotenv';
import { OnCallUser } from './OnCallUser';
import { OnCallPeriod } from './OnCallPeriod';
import { KaluzaOnCallPaymentsCalculator } from './KaluzaOnCallPaymentsCalculator';
import { ScheduleEntry } from './ScheduleEntry';
import { FinalSchedule } from './FinalSchedule';

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

        let onCallUsers = extractOnCallUsersFromFinalSchedule(data.schedule.final_schedule);
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

    function extractOnCallUsersFromFinalSchedule(finalSchedule: FinalSchedule): Record<string,OnCallUser> {
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
    
    function getOnCallUserFromScheduleEntry(scheduleEntry: ScheduleEntry): OnCallUser {
        let onCallPeriod = new OnCallPeriod(scheduleEntry.start, scheduleEntry.end);
        let onCallUser = new OnCallUser(
            scheduleEntry.user?.id || "", 
            scheduleEntry.user?.summary || "", [onCallPeriod]);
        return onCallUser
    }