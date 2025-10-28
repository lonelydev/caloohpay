import { User } from './User';

/**
 * Represents a single on-call schedule entry from PagerDuty.
 * 
 * A schedule entry defines a continuous period when a specific user is assigned
 * to on-call duty. This is the core building block for tracking who was on-call
 * and when, which is then used to calculate compensation.
 * 
 * @category Models
 * 
 * @remarks
 * Schedule entries are returned by PagerDuty's schedule API and represent
 * the rendered schedule after applying all overrides and rotations.
 * 
 * @example
 * ```typescript
 * const entry: ScheduleEntry = {
 *   user: {
 *     id: 'PXXXXXX',
 *     type: 'user_reference',
 *     summary: 'John Doe'
 *   },
 *   start: new Date('2024-08-01T17:30:00Z'),
 *   end: new Date('2024-08-02T09:00:00Z')
 * };
 * ```
 */
export interface ScheduleEntry {
    /**
     * The PagerDuty user assigned to this on-call period.
     * May be undefined if the shift is unassigned or was deleted.
     */
    user?: User;
    
    /**
     * Start date and time of the on-call shift.
     * Represents when the user's on-call duty begins.
     * Timezone is typically UTC as received from PagerDuty API.
     */
    start: Date;
    
    /**
     * End date and time of the on-call shift.
     * Represents when the user's on-call duty concludes.
     * Timezone is typically UTC as received from PagerDuty API.
     */
    end: Date;
}

