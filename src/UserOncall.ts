import { User } from './User';

/**
 * Represents a user's on-call assignment period as returned by PagerDuty API.
 * 
 * This interface is used when parsing schedule entries from the PagerDuty API.
 * It's similar to ScheduleEntry but specifically used in the context of
 * rendered_schedule_entries from the API response.
 * 
 * @category Models
 * 
 * @remarks
 * This type is part of the raw PagerDuty API response structure and is
 * transformed into OnCallPeriod objects for internal calculation purposes.
 * 
 * @see {@link ScheduleEntry} for the processed version
 * @see {@link OnCallPeriod} for the calculation-ready version
 * 
 * @example
 * ```typescript
 * const userOncall: UserOncall = {
 *   start: new Date('2024-08-01T17:30:00Z'),
 *   end: new Date('2024-08-05T09:00:00Z'),
 *   user: {
 *     id: 'PXXXXXX',
 *     type: 'user_reference',
 *     summary: 'Jane Smith'
 *   }
 * };
 * ```
 */
export interface UserOncall {
    /**
     * Start date and time of the on-call assignment.
     * Typically in UTC as received from PagerDuty API.
     */
    start: Date;
    
    /**
     * End date and time of the on-call assignment.
     * Typically in UTC as received from PagerDuty API.
     */
    end: Date;
    
    /**
     * The PagerDuty user assigned to this on-call period.
     * May be undefined for vacant or deleted shifts.
     */
    user?: User;
}

