import * as fs from 'fs';
import * as path from 'path';
import { OnCallCompensation } from './OnCallCompensation';

/**
 * Writes on-call payment data to a CSV file compatible with Google Sheets.
 */
export class CsvWriter {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    /**
     * Writes schedule information and compensation data to a CSV file.
     * 
     * @param scheduleName - Name of the PagerDuty schedule
     * @param scheduleUrl - URL to the schedule in PagerDuty
     * @param timezone - Timezone used for calculations
     * @param auditableRecords - Record of user compensations
     * @param append - Whether to append to existing file (for multiple schedules)
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
        for (const [userId, onCallCompensation] of Object.entries(auditableRecords)) {
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
     * Escapes special characters in CSV values.
     * Wraps values in quotes if they contain commas, quotes, or newlines.
     * 
     * @param value - The value to escape
     * @returns Escaped CSV value
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
     * Writes content to the CSV file.
     * Creates directories if they don't exist.
     * 
     * @param content - Content to write
     * @param append - Whether to append or overwrite
     */
    private writeToFile(content: string, append: boolean): void {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write or append to file
            if (append) {
                fs.appendFileSync(this.filePath, '\n' + content, 'utf8');
            } else {
                fs.writeFileSync(this.filePath, content, 'utf8');
            }
        } catch (error) {
            throw new Error(`Failed to write to file ${this.filePath}: ${error}`);
        }
    }

    /**
     * Checks if the CSV file already exists.
     * 
     * @returns True if file exists, false otherwise
     */
    fileExists(): boolean {
        return fs.existsSync(this.filePath);
    }

    /**
     * Deletes the CSV file if it exists.
     */
    deleteIfExists(): void {
        if (this.fileExists()) {
            fs.unlinkSync(this.filePath);
        }
    }
}
