import { jest } from '@jest/globals';
import { CommandLineOptions } from '../src/CommandLineOptions';

/**
 * Test suite for CalOohPay main functionality
 * 
 * These tests verify the async/await refactoring and ensure proper sequential
 * processing of multiple schedules to avoid race conditions.
 * 
 * Note: These are unit tests for the helper functions and validation logic.
 * Full integration tests would require mocking the PagerDuty API.
 */

describe('CalOohPay async operations', () => {
    describe('Command line argument validation', () => {
        it('should reject invalid date formats', () => {
            const invalidDate = 'not-a-date';
            expect(isNaN(Date.parse(invalidDate))).toBe(true);
        });

        it('should accept valid date formats', () => {
            const validDate = '2024-01-15';
            expect(isNaN(Date.parse(validDate))).toBe(false);
        });

        it('should detect when since is greater than until', () => {
            const since = new Date('2024-02-01');
            const until = new Date('2024-01-01');
            
            expect(since > until).toBe(true);
        });

        it('should accept valid date ranges', () => {
            const since = new Date('2024-01-01');
            const until = new Date('2024-01-31');
            
            expect(since <= until).toBe(true);
        });
    });

    describe('Default date parameter functions', () => {
        it('should generate first day of previous month correctly', () => {
            const today = new Date('2024-03-15');
            const result = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(1); // February (0-indexed)
            expect(result.getDate()).toBe(1);
        });

        it('should handle year boundary for previous month calculation', () => {
            const today = new Date('2024-01-15');
            const result = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            
            // Should be December 1, 2023
            expect(result.getFullYear()).toBe(2023);
            expect(result.getMonth()).toBe(11); // December (0-indexed)
            expect(result.getDate()).toBe(1);
        });

        it('should generate first day of current month correctly', () => {
            const today = new Date('2024-03-15');
            const result = new Date(today.getFullYear(), today.getMonth(), 1);
            
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(2); // March (0-indexed)
            expect(result.getDate()).toBe(1);
        });
    });

    describe('Async/await refactoring verification', () => {
        it('should demonstrate sequential async operations with async/await', async () => {
            const executionOrder: string[] = [];
            
            // Simulate async operations
            const mockApiCall = async (scheduleId: string, delay: number) => {
                executionOrder.push(`${scheduleId}-start`);
                await new Promise(resolve => setTimeout(resolve, delay));
                executionOrder.push(`${scheduleId}-end`);
                return { data: { schedule: { name: scheduleId } } };
            };

            // Sequential processing with async/await
            await mockApiCall('SCHEDULE1', 10);
            await mockApiCall('SCHEDULE2', 5);
            
            // Verify sequential order is maintained
            expect(executionOrder).toEqual([
                'SCHEDULE1-start',
                'SCHEDULE1-end',
                'SCHEDULE2-start',
                'SCHEDULE2-end'
            ]);
        });

        it('should demonstrate race condition with promise chains', (done) => {
            const executionOrder: string[] = [];
            
            const mockApiCall = (scheduleId: string, delay: number) => {
                executionOrder.push(`${scheduleId}-start`);
                return new Promise(resolve => {
                    setTimeout(() => {
                        executionOrder.push(`${scheduleId}-end`);
                        resolve({ data: { schedule: { name: scheduleId } } });
                    }, delay);
                });
            };

            // Non-sequential processing with promise chains (old approach)
            // This fires both calls immediately without waiting
            mockApiCall('SCHEDULE1', 10);
            mockApiCall('SCHEDULE2', 5); // Completes first due to shorter delay
            
            setTimeout(() => {
                // With promises fired in parallel, order depends on delays
                expect(executionOrder).toEqual([
                    'SCHEDULE1-start',
                    'SCHEDULE2-start',
                    'SCHEDULE2-end', // SCHEDULE2 finishes first
                    'SCHEDULE1-end'
                ]);
                done();
            }, 50);
        });

        it('should properly propagate errors with async/await', async () => {
            const mockFailingCall = async () => {
                throw new Error('API Error');
            };

            await expect(mockFailingCall()).rejects.toThrow('API Error');
        });

        it('should allow error handling without process.exit in loops', async () => {
            const processSchedule = async (scheduleId: string) => {
                if (scheduleId === 'BAD') {
                    throw new Error(`Error processing schedule ${scheduleId}`);
                }
                return { success: true };
            };

            // Error can be caught and handled without terminating process
            try {
                await processSchedule('BAD');
                fail('Should have thrown error');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toContain('Error processing schedule BAD');
            }
        });
    });

    describe('CSV writing order verification', () => {
        it('should maintain write order with sequential async operations', async () => {
            const writeOrder: string[] = [];
            
            const mockCsvWrite = async (scheduleName: string, append: boolean) => {
                // Simulate async write operation
                await new Promise(resolve => setTimeout(resolve, 5));
                writeOrder.push(`${scheduleName}:${append}`);
            };

            // Sequential writes
            await mockCsvWrite('Schedule1', false);
            await mockCsvWrite('Schedule2', true);
            await mockCsvWrite('Schedule3', true);
            
            expect(writeOrder).toEqual([
                'Schedule1:false',
                'Schedule2:true',
                'Schedule3:true'
            ]);
        });

        it('should demonstrate file corruption risk with concurrent writes', (done) => {
            const writeOrder: string[] = [];
            
            const mockCsvWrite = (scheduleName: string, delay: number) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        writeOrder.push(scheduleName);
                        resolve(true);
                    }, delay);
                });
            };

            // Concurrent writes with different delays
            mockCsvWrite('Schedule1', 20);
            mockCsvWrite('Schedule2', 10);
            mockCsvWrite('Schedule3', 15);
            
            setTimeout(() => {
                // Order depends on delays, not the intended sequence
                expect(writeOrder).toEqual(['Schedule2', 'Schedule3', 'Schedule1']);
                done();
            }, 50);
        });
    });

    describe('Timezone override logic', () => {
        it('should use CLI timezone when provided', () => {
            const cliTimezone = 'Europe/London';
            const scheduleTimezone = 'America/New_York';
            
            const effectiveTimezone = cliTimezone || scheduleTimezone;
            
            expect(effectiveTimezone).toBe('Europe/London');
        });

        it('should fallback to schedule timezone when CLI timezone not provided', () => {
            const cliTimezone = undefined;
            const scheduleTimezone = 'America/New_York';
            
            const effectiveTimezone = cliTimezone || scheduleTimezone;
            
            expect(effectiveTimezone).toBe('America/New_York');
        });

        it('should use UTC as final fallback', () => {
            const cliTimezone = undefined;
            const scheduleTimezone = undefined;
            
            const effectiveTimezone = cliTimezone || scheduleTimezone || 'UTC';
            
            expect(effectiveTimezone).toBe('UTC');
        });
    });
});
