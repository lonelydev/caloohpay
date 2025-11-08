/* eslint-disable security/detect-non-literal-fs-filename -- Test file: all file paths are controlled test fixtures */

import { afterEach,beforeEach, describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import * as path from 'path';

import { CsvWriter } from '@src/CsvWriter';
import type { OnCallCompensation } from '@src/OnCallCompensation';
import { OnCallPeriod } from '@src/OnCallPeriod';
import { OnCallUser } from '@src/OnCallUser';

const testOutputDir = path.join(__dirname, 'test-output');
const testFilePath = path.join(testOutputDir, 'test-output.csv');

/**
 * Test suite for CsvWriter functionality
 * 
 * Comprehensive tests covering:
 * - Basic CSV file creation and data formatting
 * - Multiple user handling and schedule appending
 * - Special character escaping (commas, quotes, newlines)
 * - Unicode and international character support
 * - Edge cases: empty data, long strings, mixed special characters
 * - Directory creation and file system operations
 * - RFC 4180 CSV compliance
 */
describe('CsvWriter', () => {
    let csvWriter: CsvWriter;

    beforeEach(() => {
        // Ensure test output directory exists
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }
        csvWriter = new CsvWriter(testFilePath);
        csvWriter.deleteIfExists();
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    test('should create CSV file with schedule data', () => {
        const onCallUser = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const auditableRecords: Record<string, OnCallCompensation> = {
            '1': {
                OnCallUser: onCallUser,
                totalCompensation: 275
            }
        };

        csvWriter.writeScheduleData(
            'Engineering Team',
            'https://example.pagerduty.com/schedules/ABC123',
            'Europe/London',
            auditableRecords,
            false
        );

        expect(csvWriter.fileExists()).toBe(true);

        const content = fs.readFileSync(testFilePath, 'utf8');
        expect(content).toContain('Schedule name:,Engineering Team');
        expect(content).toContain('Schedule URL:,https://example.pagerduty.com/schedules/ABC123');
        expect(content).toContain('Using timezone:,Europe/London');
        expect(content).toContain('User,Total Compensation (£),Weekdays (Mon-Thu),Weekends (Fri-Sun)');
        expect(content).toContain('John Doe,275,');
    });

    test('should handle multiple users in CSV output', () => {
        const onCallUser1 = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const onCallUser2 = new OnCallUser(
            '2',
            'Jane Smith',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const auditableRecords: Record<string, OnCallCompensation> = {
            '1': {
                OnCallUser: onCallUser1,
                totalCompensation: 275
            },
            '2': {
                OnCallUser: onCallUser2,
                totalCompensation: 200
            }
        };

        csvWriter.writeScheduleData(
            'Engineering Team',
            'https://example.pagerduty.com/schedules/ABC123',
            'Europe/London',
            auditableRecords,
            false
        );

        const content = fs.readFileSync(testFilePath, 'utf8');
        expect(content).toContain('John Doe,275,');
        expect(content).toContain('Jane Smith,200,');
    });

    test('should append multiple schedules to the same file', () => {
        const onCallUser1 = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const onCallUser2 = new OnCallUser(
            '2',
            'Jane Smith',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-08T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const auditableRecords1: Record<string, OnCallCompensation> = {
            '1': {
                OnCallUser: onCallUser1,
                totalCompensation: 275
            }
        };

        const auditableRecords2: Record<string, OnCallCompensation> = {
            '2': {
                OnCallUser: onCallUser2,
                totalCompensation: 200
            }
        };

        // Write first schedule
        csvWriter.writeScheduleData(
            'Engineering Team Alpha',
            'https://example.pagerduty.com/schedules/ABC123',
            'Europe/London',
            auditableRecords1,
            false
        );

        // Append second schedule
        csvWriter.writeScheduleData(
            'Engineering Team Beta',
            'https://example.pagerduty.com/schedules/DEF456',
            'America/New_York',
            auditableRecords2,
            true
        );

        const content = fs.readFileSync(testFilePath, 'utf8');
        
        // Check first schedule
        expect(content).toContain('Schedule name:,Engineering Team Alpha');
        expect(content).toContain('John Doe,275,');
        
        // Check second schedule
        expect(content).toContain('Schedule name:,Engineering Team Beta');
        expect(content).toContain('Jane Smith,200,');
        expect(content).toContain('America/New_York');
    });

    test('should escape CSV special characters in names', () => {
        const onCallUser = new OnCallUser(
            '1',
            'Doe, John "Johnny"',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const auditableRecords: Record<string, OnCallCompensation> = {
            '1': {
                OnCallUser: onCallUser,
                totalCompensation: 275
            }
        };

        csvWriter.writeScheduleData(
            'Team Name, with comma',
            'https://example.pagerduty.com/schedules/ABC123',
            'Europe/London',
            auditableRecords,
            false
        );

        const content = fs.readFileSync(testFilePath, 'utf8');
        
        // Check that comma in schedule name is escaped
        expect(content).toContain('"Team Name, with comma"');
        
        // Check that user name with comma and quotes is properly escaped
        expect(content).toContain('"Doe, John ""Johnny"""');
    });

    test('should create directories if they do not exist', () => {
        const nestedPath = path.join(testOutputDir, 'nested', 'dir', 'output.csv');
        const nestedCsvWriter = new CsvWriter(nestedPath);

        const onCallUser = new OnCallUser(
            '1',
            'John Doe',
            [
                new OnCallPeriod(
                    DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                    'Europe/London'
                )
            ]
        );

        const auditableRecords: Record<string, OnCallCompensation> = {
            '1': {
                OnCallUser: onCallUser,
                totalCompensation: 275
            }
        };

        nestedCsvWriter.writeScheduleData(
            'Engineering Team',
            'https://example.pagerduty.com/schedules/ABC123',
            'Europe/London',
            auditableRecords,
            false
        );

        expect(nestedCsvWriter.fileExists()).toBe(true);
        expect(fs.existsSync(nestedPath)).toBe(true);

        // Clean up
        fs.unlinkSync(nestedPath);
        fs.rmdirSync(path.join(testOutputDir, 'nested', 'dir'));
        fs.rmdirSync(path.join(testOutputDir, 'nested'));
    });

    test('should handle empty auditable records', () => {
        const auditableRecords: Record<string, OnCallCompensation> = {};

        csvWriter.writeScheduleData(
            'Empty Schedule',
            'https://example.pagerduty.com/schedules/EMPTY',
            'UTC',
            auditableRecords,
            false
        );

        const content = fs.readFileSync(testFilePath, 'utf8');
        expect(content).toContain('Schedule name:,Empty Schedule');
        expect(content).toContain('User,Total Compensation (£),Weekdays (Mon-Thu),Weekends (Fri-Sun)');
        
        // Should have header but no data rows
        const lines = content.split('\n').filter(line => line.trim() !== '');
        expect(lines.length).toBe(4); // 3 schedule info lines + 1 header
    });

    test('should delete existing file when deleteIfExists is called', () => {
        // Create a file first
        fs.writeFileSync(testFilePath, 'test content', 'utf8');
        expect(fs.existsSync(testFilePath)).toBe(true);

        // Delete it
        csvWriter.deleteIfExists();
        expect(fs.existsSync(testFilePath)).toBe(false);

        // Calling again should not throw error
        expect(() => csvWriter.deleteIfExists()).not.toThrow();
    });

    test('should correctly report file existence', () => {
        expect(csvWriter.fileExists()).toBe(false);

        fs.writeFileSync(testFilePath, 'test', 'utf8');
        expect(csvWriter.fileExists()).toBe(true);

        fs.unlinkSync(testFilePath);
        expect(csvWriter.fileExists()).toBe(false);
    });

    describe('Special character edge cases', () => {
        test('should handle Unicode characters in user names', () => {
            const onCallUser = new OnCallUser(
                '1',
                'José García-Müller 李明',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                'International Team 🌍',
                'https://example.pagerduty.com/schedules/ABC123',
                'Europe/London',
                auditableRecords,
                false
            );

            const content = fs.readFileSync(testFilePath, 'utf8');
            expect(content).toContain('José García-Müller 李明');
            expect(content).toContain('International Team 🌍');
        });

        test('should handle newlines in schedule names', () => {
            const onCallUser = new OnCallUser(
                '1',
                'John Doe',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                'Team Name\nWith Newline',
                'https://example.pagerduty.com/schedules/ABC123',
                'Europe/London',
                auditableRecords,
                false
            );

            const content = fs.readFileSync(testFilePath, 'utf8');
            // Newlines should be wrapped in quotes
            expect(content).toContain('"Team Name\nWith Newline"');
        });

        test('should handle very long user names', () => {
            const longName = 'A'.repeat(500) + ', B' + 'C'.repeat(500);
            const onCallUser = new OnCallUser(
                '1',
                longName,
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                'Engineering Team',
                'https://example.pagerduty.com/schedules/ABC123',
                'Europe/London',
                auditableRecords,
                false
            );

            const content = fs.readFileSync(testFilePath, 'utf8');
            expect(content).toContain(longName);
            // Should be quoted due to comma
            expect(content).toContain(`"${longName}"`);
        });

        test('should handle multiple consecutive quotes in user names', () => {
            const onCallUser = new OnCallUser(
                '1',
                'John """Triple Quote""" Doe',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                'Engineering Team',
                'https://example.pagerduty.com/schedules/ABC123',
                'Europe/London',
                auditableRecords,
                false
            );

            const content = fs.readFileSync(testFilePath, 'utf8');
            // Each quote should be doubled
            expect(content).toContain('John """"""Triple Quote"""""" Doe');
        });

        test('should handle empty strings gracefully', () => {
            const onCallUser = new OnCallUser(
                '1',
                '',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                '',
                'https://example.pagerduty.com/schedules/ABC123',
                'Europe/London',
                auditableRecords,
                false
            );

            expect(csvWriter.fileExists()).toBe(true);
            const content = fs.readFileSync(testFilePath, 'utf8');
            expect(content).toContain('Schedule name:,');
            expect(content).toContain(',275,'); // Empty name followed by compensation
        });

        test('should handle tabs and other whitespace characters', () => {
            const onCallUser = new OnCallUser(
                '1',
                'John\tDoe\r\nSenior Engineer',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                'Engineering Team',
                'https://example.pagerduty.com/schedules/ABC123',
                'Europe/London',
                auditableRecords,
                false
            );

            const content = fs.readFileSync(testFilePath, 'utf8');
            // Should be quoted due to newline
            expect(content).toContain('"John\tDoe\r\nSenior Engineer"');
        });

        test('should handle URLs with special characters', () => {
            const onCallUser = new OnCallUser(
                '1',
                'John Doe',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                'Engineering Team',
                'https://example.pagerduty.com/schedules/ABC123?filter=active&sort=name,asc',
                'Europe/London',
                auditableRecords,
                false
            );

            const content = fs.readFileSync(testFilePath, 'utf8');
            // URL with comma should be quoted
            expect(content).toContain('"https://example.pagerduty.com/schedules/ABC123?filter=active&sort=name,asc"');
        });

        test('should handle mixed special characters in single field', () => {
            const onCallUser = new OnCallUser(
                '1',
                'Doe, "Johnny" O\'Malley\nSr. Engineer',
                [
                    new OnCallPeriod(
                        DateTime.fromISO('2024-08-01T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        DateTime.fromISO('2024-08-05T10:00:00+01:00', { zone: 'Europe/London' }).toJSDate(),
                        'Europe/London'
                    )
                ]
            );

            const auditableRecords: Record<string, OnCallCompensation> = {
                '1': {
                    OnCallUser: onCallUser,
                    totalCompensation: 275
                }
            };

            csvWriter.writeScheduleData(
                'Team, "Alpha" Squad\nPrimary',
                'https://example.pagerduty.com/schedules/ABC123',
                'Europe/London',
                auditableRecords,
                false
            );

            const content = fs.readFileSync(testFilePath, 'utf8');
            // Both should be properly quoted and escaped
            expect(content).toContain('"Team, ""Alpha"" Squad\nPrimary"');
            expect(content).toContain('"Doe, ""Johnny"" O\'Malley\nSr. Engineer"');
        });
    });
});
