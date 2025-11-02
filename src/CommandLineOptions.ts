/**
 * Configuration options for the CalOohPay command-line interface.
 * 
 * Defines all the parameters that can be provided when running the CLI tool
 * to calculate on-call payments. These options control which schedules to query,
 * the time period to analyze, authentication, and output preferences.
 * 
 * @category Models
 * 
 * @example
 * ```typescript
 * const options: CommandLineOptions = {
 *   rotaIds: 'SCHEDULE1,SCHEDULE2',
 *   since: '2024-08-01',
 *   until: '2024-08-31',
 *   timeZoneId: 'Europe/London',
 *   key: 'api-key-here',
 *   outputFile: 'output/payments.csv',
 *   help: false
 * };
 * ```
 */
export interface CommandLineOptions {
    /**
     * Comma-separated list of PagerDuty schedule IDs to analyze.
     * Each schedule will be processed independently and results combined.
     * 
     * @example 'PXXXXXX,PYYYYYY'
     */
    rotaIds: string;
    
    /**
     * Start date for the analysis period in ISO format (YYYY-MM-DD).
     * Will be coerced to midnight (00:00:00) in the schedule's timezone.
     * 
     * @example '2024-08-01'
     */
    since: string;
    
    /**
     * End date for the analysis period in ISO format (YYYY-MM-DD).
     * Will be coerced to end of day (23:59:59.999) in the schedule's timezone.
     * 
     * @example '2024-08-31'
     */
    until: string;
    
    /**
     * Optional IANA timezone identifier to override the schedule's default timezone.
     * If not provided, uses the timezone configured in PagerDuty schedule.
     * 
     * @example 'America/New_York' or 'Asia/Tokyo'
     */
    timeZoneId?: string;
    
    /**
     * PagerDuty API authentication token.
     * Can also be provided via API_TOKEN environment variable.
     * Command-line value takes precedence over environment variable.
     */
    key?: string;
    
    /**
     * Path to the output CSV file for payroll data.
     * File will be created with Google Sheets compatible format.
     * Directory will be created if it doesn't exist.
     * 
     * @example 'output/august-2024-payments.csv'
     */
    outputFile?: string;
    
    /**
     * Whether to display help information.
     * When true, shows usage instructions and exits without processing.
     */
    help?: boolean;
}

