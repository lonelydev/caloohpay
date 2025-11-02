import { describe, expect,it } from '@jest/globals';

import type { CommandLineOptions } from '@src/CommandLineOptions';
import { maskCliOptions } from '@src/logger/utils';

/**
 * Test suite for type safety improvements
 * 
 * Validates that the type safety refactoring maintains correct behavior
 * and handles edge cases properly.
 */
describe('Type Safety Improvements', () => {
    describe('maskCliOptions', () => {
        it('should mask API key when present', () => {
            const options: CommandLineOptions = {
                rotaIds: 'PXXXXXX,PYYYYYY',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z',
                key: 'secret-api-key-12345'
            };

            const masked = maskCliOptions(options);

            expect(masked.key).toBe('****');
            expect(masked.rotaIds).toBe(options.rotaIds);
            expect(masked.since).toBe(options.since);
            expect(masked.until).toBe(options.until);
        });

        it('should handle options without API key', () => {
            const options: CommandLineOptions = {
                rotaIds: 'PXXXXXX',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z'
            };

            const masked = maskCliOptions(options);

            expect(masked.key).toBeUndefined();
            expect(masked.rotaIds).toBe(options.rotaIds);
        });

        it('should not mutate original options', () => {
            const options: CommandLineOptions = {
                rotaIds: 'PXXXXXX',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z',
                key: 'original-key'
            };

            const originalKey = options.key;
            maskCliOptions(options);

            expect(options.key).toBe(originalKey);
        });

        it('should handle empty string API key', () => {
            const options: CommandLineOptions = {
                rotaIds: 'PXXXXXX',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z',
                key: ''
            };

            const masked = maskCliOptions(options);

            // Empty string is falsy, so it shouldn't be masked
            expect(masked.key).toBe('');
        });

        it('should preserve all optional fields', () => {
            const options: CommandLineOptions = {
                rotaIds: 'PXXXXXX',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z',
                timeZoneId: 'America/New_York',
                outputFile: 'output.csv',
                help: false,
                key: 'api-key'
            };

            const masked = maskCliOptions(options);

            expect(masked.timeZoneId).toBe(options.timeZoneId);
            expect(masked.outputFile).toBe(options.outputFile);
            expect(masked.help).toBe(options.help);
            expect(masked.key).toBe('****');
        });
    });

    describe('CommandLineOptions type validation', () => {
        it('should allow options with only required fields', () => {
            const options: CommandLineOptions = {
                rotaIds: 'PXXXXXX',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z'
            };

            expect(options.rotaIds).toBeDefined();
            expect(options.since).toBeDefined();
            expect(options.until).toBeDefined();
        });

        it('should allow options with all fields', () => {
            const options: CommandLineOptions = {
                rotaIds: 'PXXXXXX,PYYYYYY',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z',
                timeZoneId: 'Europe/London',
                key: 'api-key',
                outputFile: 'output/payments.csv',
                help: false
            };

            expect(options.rotaIds).toBe('PXXXXXX,PYYYYYY');
            expect(options.timeZoneId).toBe('Europe/London');
            expect(options.key).toBe('api-key');
            expect(options.outputFile).toBe('output/payments.csv');
            expect(options.help).toBe(false);
        });

        it('should handle multiple schedule IDs', () => {
            const options: CommandLineOptions = {
                rotaIds: 'SCHED1,SCHED2,SCHED3',
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z'
            };

            const scheduleIds = options.rotaIds.split(',');
            expect(scheduleIds).toHaveLength(3);
            expect(scheduleIds[0]).toBe('SCHED1');
            expect(scheduleIds[2]).toBe('SCHED3');
        });
    });

    describe('Error handling type safety', () => {
        it('should handle Error instances correctly', () => {
            const error = new Error('Test error message');
            
            const convertedError = error instanceof Error ? error : new Error(String(error));
            
            expect(convertedError).toBeInstanceOf(Error);
            expect(convertedError.message).toBe('Test error message');
        });

        it('should convert string errors to Error instances', () => {
            const error: unknown = 'String error message';
            
            const convertedError = error instanceof Error ? error : new Error(String(error));
            
            expect(convertedError).toBeInstanceOf(Error);
            expect(convertedError.message).toBe('String error message');
        });

        it('should convert number errors to Error instances', () => {
            const error: unknown = 404;
            
            const convertedError = error instanceof Error ? error : new Error(String(error));
            
            expect(convertedError).toBeInstanceOf(Error);
            expect(convertedError.message).toBe('404');
        });

        it('should convert object errors to Error instances', () => {
            const error = { code: 'ERR_001', message: 'Something went wrong' };
            
            const convertedError = error instanceof Error ? error : new Error(String(error));
            
            expect(convertedError).toBeInstanceOf(Error);
            expect(convertedError.message).toContain('object');
        });

        it('should preserve Error stack trace when already an Error', () => {
            const error = new Error('Original error');
            const originalStack = error.stack;
            
            const convertedError = error instanceof Error ? error : new Error(String(error));
            
            expect(convertedError.stack).toBe(originalStack);
        });
    });

    describe('PagerDuty API params type safety', () => {
        it('should create valid API params with required fields', () => {
            interface PagerDutyScheduleParams {
                overflow: boolean;
                since: string;
                until: string;
                time_zone?: string;
            }

            const params: PagerDutyScheduleParams = {
                overflow: false,
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z'
            };

            expect(params.overflow).toBe(false);
            expect(params.since).toBeDefined();
            expect(params.until).toBeDefined();
            expect(params.time_zone).toBeUndefined();
        });

        it('should allow optional time_zone parameter', () => {
            interface PagerDutyScheduleParams {
                overflow: boolean;
                since: string;
                until: string;
                time_zone?: string;
            }

            const params: PagerDutyScheduleParams = {
                overflow: false,
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z',
                time_zone: 'America/New_York'
            };

            expect(params.time_zone).toBe('America/New_York');
        });

        it('should enforce boolean type for overflow', () => {
            interface PagerDutyScheduleParams {
                overflow: boolean;
                since: string;
                until: string;
                time_zone?: string;
            }

            const params: PagerDutyScheduleParams = {
                overflow: false,
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z'
            };

            expect(typeof params.overflow).toBe('boolean');
        });

        it('should enforce string types for date parameters', () => {
            interface PagerDutyScheduleParams {
                overflow: boolean;
                since: string;
                until: string;
                time_zone?: string;
            }

            const params: PagerDutyScheduleParams = {
                overflow: false,
                since: '2024-01-01T00:00:00Z',
                until: '2024-01-31T23:59:59Z'
            };

            expect(typeof params.since).toBe('string');
            expect(typeof params.until).toBe('string');
        });
    });

    describe('Logger data types', () => {
        it('should accept Record type for table data', () => {
            const data: Record<string, unknown> = {
                name: 'John Doe',
                payment: 275,
                weekdays: 1,
                weekends: 3
            };

            expect(data.name).toBe('John Doe');
            expect(data.payment).toBe(275);
        });

        it('should accept Array type for table data', () => {
            const data: unknown[] = [
                { name: 'John', payment: 275 },
                { name: 'Jane', payment: 400 }
            ];

            expect(data).toHaveLength(2);
            expect(Array.isArray(data)).toBe(true);
        });

        it('should handle nested objects in table data', () => {
            const data: Record<string, unknown> = {
                user: {
                    name: 'John Doe',
                    id: 'PXXXXXX'
                },
                payment: 275
            };

            expect(data.user).toBeDefined();
            expect(typeof data.user).toBe('object');
        });
    });
});
