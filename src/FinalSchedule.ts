import { UserOncall } from './UserOncall';


export interface FinalSchedule {
    name: String;
    rendered_schedule_entries: UserOncall[];
}
