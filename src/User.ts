/**
 * Represents a PagerDuty user entity.
 * 
 * This interface matches the structure of user objects returned by the PagerDuty API.
 * It contains identifying information and URLs for a user who may be assigned
 * to on-call shifts in a schedule.
 * 
 * @category Models
 * 
 * @see {@link https://developer.pagerduty.com/api-reference/|PagerDuty API Reference}
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   type: 'user_reference',
 *   id: 'PXXXXXX',
 *   summary: 'John Doe',
 *   self: 'https://api.pagerduty.com/users/PXXXXXX',
 *   html_url: 'https://yourcompany.pagerduty.com/users/PXXXXXX'
 * };
 * ```
 */
export interface User {
    /**
     * The type of PagerDuty object.
     * Typically 'user' or 'user_reference' for user entities.
     */
    type: string;
    
    /**
     * Unique identifier for the user in PagerDuty.
     * Format: Starts with 'P' followed by alphanumeric characters.
     * 
     * @example 'PXXXXXX'
     */
    id: string;
    
    /**
     * Optional display name or summary of the user.
     * Usually the user's full name as configured in PagerDuty.
     * 
     * @example 'John Doe'
     */
    summary?: string;
    
    /**
     * Optional API URL to retrieve full user details.
     * Can be used to fetch additional user information from PagerDuty.
     * 
     * @example 'https://api.pagerduty.com/users/PXXXXXX'
     */
    self?: string;
    
    /**
     * Optional web URL to view the user's profile in PagerDuty.
     * Direct link to the user's page in the PagerDuty web interface.
     * 
     * @example 'https://yourcompany.pagerduty.com/users/PXXXXXX'
     */
    html_url?: string;
}

