import { User } from './User';

export interface ScheduleEntry {
    user?: User;
    start: Date;
    end: Date;
}
