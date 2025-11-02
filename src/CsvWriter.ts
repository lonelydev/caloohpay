import * as fs from 'fs';
import * as path from 'path';

import { Logger } from './logger/Logger';
import { OnCallCompensation } from './OnCallCompensation';

/**
 * Writes on-call payment data to CSV files in a Google Sheets compatible format.
 * 
 * This class handles the generation of properly formatted CSV files suitable for
 * import into payroll systems, spreadsheet applications (especially Google Sheets),
 * and audit purposes. It includes automatic directory creation, special character
 * escaping, and support for multi-schedule reports.
 * 
 * @category Utilities
 * 
 * @remarks
 * ## CSV Format
 * 
 * The generated CSV includes:
 * - **Schedule metadata**: Name, URL, and timezone
 * - **Compensation table**: User name, total compensation, weekday count, weekend count
 * - **Proper escaping**: Handles commas, quotes, and newlines in data
 * 
 * ## Google Sheets Compatibility
 * 
 * - Uses UTF-8 encoding
 * - Properly escapes special characters per RFC 4180
 * - Formats currency as plain numbers (no symbols)
 * - Includes clear headers for easy import
 * 
 * ## Multi-Schedule Support
 * 
 * The class supports appending data from multiple schedules to a single file,
 * automatically separating each schedule's data with blank lines for readability.
 * 
 * @example
 * ```typescript
 * const writer = new CsvWriter('output/august-payments.csv');
 * 
 * // Write first schedule
 * writer.writeScheduleData(
 *   'Engineering On-Call',
 *   'https://company.pagerduty.com/schedules/PXXXXXX',
 *   'Europe/London',
 *   auditableRecords,
 *   false  // Create new file
 * );
 * 
 * // Append second schedule
 * writer.writeScheduleData(
 *   'SRE On-Call',
 *   'https://company.pagerduty.com/schedules/PYYYYYY',
 *   'America/New_York',
 *   moreRecords,
 *   true  // Append to existing file
 * );
 * ```
 * 
 * @see {@link https://tools.ietf.org/html/rfc4180|RFC 4180 - CSV Format Specification}
 */
export class CsvWriter {
    /** 
     * Absolute or relative path to the output CSV file.
     * Directory will be created automatically if it doesn't exist.
     */
    private filePath: string;

    /**
     * Creates a new CsvWriter instance.
     * 
     * @param filePath - Path where the CSV file should be written
     * 
     * @example
     * ```typescript
     * const writer = new CsvWriter('./output/payments.csv');
     * ```
     */
    private logger?: Logger;

    constructor(filePath: string, logger?: Logger) {
        this.filePath = filePath;
        this.logger = logger;
    }

    /**
     * Writes a complete schedule's data to the CSV file.
     * 
     * Generates a formatted CSV section containing schedule metadata and a table
     * of user compensation data. Can either create a new file or append to an
     * existing one for multi-schedule reports.
     * 
     * @param scheduleName - Human-readable name of the PagerDuty schedule
     * @param scheduleUrl - Direct URL to the schedule in PagerDuty
     * @param timezone - IANA timezone identifier used for OOH calculations
     * @param auditableRecords - Compensation records for all users in the schedule
     * @param append - If true, appends to existing file; if false, creates new file
     * 
     * @throws {Error} If file write operation fails
     * 
     * @remarks
     * ### CSV Structure
     * ```
     * Schedule name:,Engineering Primary On-Call
     * Schedule URL:,https://company.pagerduty.com/schedules/PXXXXXX
     * Using timezone:,Europe/London
     * 
     * User,Total Compensation (£),Weekdays (Mon-Thu),Weekends (Fri-Sun)
     * John Doe,275,1,3
     * Jane Smith,400,2,4
     * ...
     * ```
     * 
     * ### Append Behavior
     * - When `append=false`: Overwrites any existing file
     * - When `append=true`: Adds data to end of file with separator line
     * - Use append for combining multiple schedules into one report
     * 
     * @example
     * ```typescript
     * const writer = new CsvWriter('august-payments.csv');
     * 
     * // First schedule - create file
     * writer.writeScheduleData(
     *   'Engineering On-Call',
     *   'https://company.pagerduty.com/schedules/PXXXXXX',
     *   'Europe/London',
     *   engineeringRecords,
     *   false
     * );
     * 
     * // Second schedule - append
     * writer.writeScheduleData(
     *   'SRE On-Call',
     *   'https://company.pagerduty.com/schedules/PYYYYYY',
     *   'America/New_York',
     *   sreRecords,
     *   true
     * );
     * ```
     */
    writeScheduleData(
        scheduleName: string,
        scheduleUrl: string,
        timezone: string,
        auditableRecords: Record<string, OnCallCompensation>,
        append: boolean = false
    ): void {
        const lines: string[] = [];

        // Add schedule information
        lines.push(`Schedule name:,${this.escapeCsvValue(scheduleName)}`);
        lines.push(`Schedule URL:,${this.escapeCsvValue(scheduleUrl)}`);
        lines.push(`Using timezone:,${this.escapeCsvValue(timezone)}`);
        lines.push(''); // Empty line for spacing

        // Add header row
        lines.push('User,Total Compensation (£),Weekdays (Mon-Thu),Weekends (Fri-Sun)');

        // Add user compensation data
        for (const [, onCallCompensation] of Object.entries(auditableRecords)) {
            const userName = this.escapeCsvValue(onCallCompensation.OnCallUser.name);
            const totalComp = onCallCompensation.totalCompensation;
            const weekdays = onCallCompensation.OnCallUser.getTotalOohWeekDays();
            const weekends = onCallCompensation.OnCallUser.getTotalOohWeekendDays();
            
            lines.push(`${userName},${totalComp},${weekdays},${weekends}`);
        }

        // Add empty line between schedules if appending
        if (append) {
            lines.push('');
        }

        this.writeToFile(lines.join('\n'), append);
    }

    /**
     * Escapes special characters in CSV values according to RFC 4180.
     * 
     * Ensures that values containing commas, quotes, or newlines are properly
     * escaped so they don't break the CSV structure when imported into
     * spreadsheet applications or parsed by CSV libraries.
     * 
     * @private
     * @param value - The string value to escape
     * @returns Properly escaped CSV value, quoted if necessary
     * 
     * @remarks
     * ### Escaping Rules
     * 
     * 1. **Empty values**: Return empty string
     * 2. **Contains comma, quote, or newline**: 
     *    - Wrap entire value in double quotes
     *    - Escape any internal quotes by doubling them (\" becomes \"\")
     * 3. **Simple values**: Return as-is
     * 
     * @example
     * ```typescript
     * escapeCsvValue('John Doe')           // 'John Doe'
     * escapeCsvValue('Doe, John')          // '"Doe, John"'
     * escapeCsvValue('John "JD" Doe')      // '"John ""JD"" Doe"'
     * escapeCsvValue('Line1\nLine2')       // '"Line1\nLine2"'
     * ```
     */
    private escapeCsvValue(value: string): string {
        if (!value) {
            return '';
        }

        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
    }

    /**
     * Writes content to the CSV file with automatic directory creation.
     * 
     * Handles file system operations including:
     * - Creating parent directories if they don't exist
     * - Writing new file or appending to existing
     * - UTF-8 encoding for proper character support
     * 
     * @private
     * @param content - The CSV content to write
     * @param append - If true, appends to existing file; if false, overwrites
     * 
     * @throws {Error} If directory creation or file write operation fails
     * 
     * @remarks
     * ### Directory Handling
     * Uses `fs.mkdirSync` with `recursive: true` to create nested directories
     * automatically. For example, 'reports/2024/august/payments.csv' will
     * create all intermediate directories.
     * 
     * ### File Operations
     * - **New file**: Uses `fs.writeFileSync` to create or overwrite
     * - **Append**: Uses `fs.appendFileSync` with newline separator
     * - **Encoding**: Always uses UTF-8 for universal compatibility
     * 
     * @example
     * ```typescript
     * // Creates 'output/reports/' directories if needed
     * writeToFile('User,Amount\nJohn,275', false);
     * 
     * // Appends to existing file
     * writeToFile('Jane,400', true);
     * ```
     */
    private writeToFile(content: string, append: boolean): void {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Write or append to file. When appending, avoid adding an extra
            // blank line if the file already ends with a newline.
            if (append && fs.existsSync(this.filePath)) {
                fs.appendFileSync(this.filePath, '\n' + content, 'utf8');
            } else {
                fs.writeFileSync(this.filePath, content, 'utf8');
            }

            if (this.logger) {
                this.logger.info(`Wrote CSV to ${this.filePath}`, { append });
            }
        } catch (error) {
            throw new Error(`Failed to write to file ${this.filePath}: ${error}`);
        }
    }

    /**
     * Checks whether the CSV file already exists on the filesystem.
     * 
     * @returns `true` if file exists, `false` otherwise
     * 
     * @example
     * ```typescript
     * if (writer.fileExists()) {
     *   console.log('File already exists - appending data');
     * } else {
     *   console.log('Creating new file');
     * }
     * ```
     */
    fileExists(): boolean {
        return fs.existsSync(this.filePath);
    }

    /**
     * Deletes the CSV file if it exists.
     * 
     * Useful for cleanup or ensuring a fresh start before generating new reports.
     * Does nothing if the file doesn't exist (no error thrown).
     * 
     * @example
     * ```typescript
     * // Clean up before generating new report
     * writer.deleteIfExists();
     * writer.writeScheduleData(...);  // Creates fresh file
     * ```
     */
    deleteIfExists(): void {
        if (this.fileExists()) {
            fs.unlinkSync(this.filePath);
        }
    }
}
