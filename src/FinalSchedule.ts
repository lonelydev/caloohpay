import { UserOncall } from './UserOncall';

/**
 * Represents the final rendered schedule from PagerDuty.
 * 
 * This interface corresponds to the `final_schedule` object in PagerDuty's API response.
 * It contains the complete list of on-call entries after all rotations, overrides,
 * and schedule rules have been applied for the requested time period.
 * 
 * @category Models
 * 
 * @remarks
 * The final schedule is the authoritative source for who was on-call during
 * specific time periods. It reflects the actual schedule after all manual
 * overrides and exceptions have been applied.
 * 
 * @see {@link https://developer.pagerduty.com/api-reference/|PagerDuty API - Schedules}
 * 
 * @example
 * ```typescript
 * const finalSchedule: FinalSchedule = {
 *   name: 'Primary On-Call Rotation',
 *   rendered_schedule_entries: [
 *     {
 *       start: new Date('2024-08-01T17:30:00Z'),
 *       end: new Date('2024-08-05T09:00:00Z'),
 *       user: { id: 'PXXXXXX', summary: 'John Doe' }
 *     },
 *     // ... more entries
 *   ]
 * };
 * ```
 */
export interface FinalSchedule {
    /**
     * The name of the schedule layer or the overall schedule name.
     * Typically matches the schedule name configured in PagerDuty.
     */
    name: string;
    
    /**
     * Array of all on-call entries in the schedule for the requested period.
     * Each entry represents a continuous period when a specific user was on-call.
     * Entries are ordered chronologically and may cover different users.
     */
    rendered_schedule_entries: UserOncall[];
}

