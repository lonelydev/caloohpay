import { FinalSchedule } from "./FinalSchedule.js";

export interface PagerdutySchedule {
    name: string;
    html_url: string;
    time_zone: string;
    final_schedule: FinalSchedule;
}