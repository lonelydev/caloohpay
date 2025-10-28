import { FinalSchedule } from "./FinalSchedule.js";

/**
 * Represents a complete PagerDuty schedule with its configuration and entries.
 * 
 * This is the top-level interface for a PagerDuty schedule object returned by the API.
 * It contains both the schedule metadata (name, URL, timezone) and the actual
 * rendered schedule entries showing who was on-call and when.
 * 
 * @category Models
 * 
 * @remarks
 * This interface maps directly to the PagerDuty API's schedule response format.
 * The timezone specified here is crucial for accurate OOH (Out of Hours) calculations,
 * as it determines when "end of work day" occurs for different teams.
 * 
 * @see {@link https://developer.pagerduty.com/api-reference/|PagerDuty API - Get Schedule}
 * 
 * @example
 * ```typescript
 * const schedule: PagerdutySchedule = {
 *   name: 'Engineering Primary On-Call',
 *   html_url: 'https://yourcompany.pagerduty.com/schedules/PXXXXXX',
 *   time_zone: 'Europe/London',
 *   final_schedule: {
 *     name: 'Layer 1',
 *     rendered_schedule_entries: [...]
 *   }
 * };
 * ```
 */
export interface PagerdutySchedule {
    /**
     * The human-readable name of the schedule.
     * As configured in PagerDuty's schedule settings.
     * 
     * @example 'Engineering Primary On-Call'
     */
    name: string;
    
    /**
     * Direct URL to view the schedule in PagerDuty's web interface.
     * Useful for creating links in reports or CSV output.
     * 
     * @example 'https://yourcompany.pagerduty.com/schedules/PXXXXXX'
     */
    html_url: string;
    
    /**
     * IANA timezone identifier for the schedule.
     * Defines the schedule's working hours and is crucial for OOH calculations.
     * Can be overridden via command-line options if needed.
     * 
     * @example 'Europe/London', 'America/New_York', 'Asia/Tokyo'
     */
    time_zone: string;
    
    /**
     * The rendered final schedule containing all on-call entries.
     * This is the processed schedule after all rotations and overrides
     * have been applied for the requested time period.
     */
    final_schedule: FinalSchedule;
}
