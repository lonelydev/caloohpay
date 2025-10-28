import { OnCallUser } from "./OnCallUser";

/**
 * Represents the compensation details for a user's on-call duty.
 * 
 * This interface combines the user's on-call information with their calculated
 * total compensation amount. It serves as an auditable record linking a user
 * to their payment for a specific period.
 * 
 * @category Models
 * 
 * @example
 * ```typescript
 * const compensation: OnCallCompensation = {
 *   OnCallUser: user,
 *   totalCompensation: 325 // £325 for 2 weekdays + 3 weekends
 * };
 * ```
 */
export interface OnCallCompensation {
    /** 
     * The user who was on-call, including their ID, name, and all on-call periods.
     * Contains the complete breakdown of weekday and weekend shifts.
     */
    OnCallUser: OnCallUser;
    
    /** 
     * Total monetary compensation in GBP (£) for all on-call periods.
     * Calculated as: (weekdays × £50) + (weekends × £75)
     */
    totalCompensation: number;
}

