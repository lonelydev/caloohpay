import { describe, expect, it } from '@jest/globals';

import { OnCallPeriod } from '@src/OnCallPeriod';
import { OnCallUser } from '@src/OnCallUser';
import { InputValidator } from '@src/validation/InputValidator';

describe('InputValidator', () => {
    describe('validateDateString', () => {
        it('should accept valid ISO date strings', () => {
            expect(() => InputValidator.validateDateString('2024-01-15', 'testDate')).not.toThrow();
            expect(() => InputValidator.validateDateString('2024-01-15T00:00:00Z', 'testDate')).not.toThrow();
            expect(() => InputValidator.validateDateString('2024-12-31T23:59:59+00:00', 'testDate')).not.toThrow();
        });

        it('should reject invalid date strings', () => {
            expect(() => InputValidator.validateDateString('invalid-date', 'testDate'))
                .toThrow('Invalid date format for testDate');
            expect(() => InputValidator.validateDateString('2024-13-45', 'testDate'))
                .toThrow('Invalid date format for testDate');
            expect(() => InputValidator.validateDateString('not a date', 'testDate'))
                .toThrow('Invalid date format for testDate');
        });

        it('should reject empty date strings', () => {
            expect(() => InputValidator.validateDateString('', 'testDate'))
                .toThrow('testDate date is required');
        });

        it('should provide helpful error messages', () => {
            expect(() => InputValidator.validateDateString('bad-date', 'since'))
                .toThrow(/Expected ISO 8601 format/);
        });
    });

    describe('validateDateRange', () => {
        it('should accept valid date ranges', () => {
            expect(() => InputValidator.validateDateRange('2024-01-01', '2024-01-31')).not.toThrow();
            expect(() => InputValidator.validateDateRange('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z')).not.toThrow();
        });

        it('should reject when since is greater than until', () => {
            expect(() => InputValidator.validateDateRange('2024-02-01', '2024-01-01'))
                .toThrow(/cannot be greater than/);
        });

        it('should accept when since equals until', () => {
            expect(() => InputValidator.validateDateRange('2024-01-15', '2024-01-15')).not.toThrow();
        });

        it('should validate both dates in the range', () => {
            expect(() => InputValidator.validateDateRange('invalid', '2024-01-31'))
                .toThrow('Invalid date format for since');
            expect(() => InputValidator.validateDateRange('2024-01-01', 'invalid'))
                .toThrow('Invalid date format for until');
        });
    });

    describe('validateScheduleId', () => {
        it('should accept valid schedule IDs', () => {
            expect(() => InputValidator.validateScheduleId('PXXXXXX')).not.toThrow();
            expect(() => InputValidator.validateScheduleId('ABC123')).not.toThrow();
            expect(() => InputValidator.validateScheduleId('P123456')).not.toThrow();
        });

        it('should reject empty schedule IDs', () => {
            expect(() => InputValidator.validateScheduleId(''))
                .toThrow('Schedule ID is required');
            expect(() => InputValidator.validateScheduleId('   '))
                .toThrow('Schedule ID is required');
        });

        it('should reject schedule IDs with invalid characters', () => {
            expect(() => InputValidator.validateScheduleId('PXXXX-XX'))
                .toThrow('Invalid schedule ID format');
            expect(() => InputValidator.validateScheduleId('PX X'))
                .toThrow('Invalid schedule ID format');
            expect(() => InputValidator.validateScheduleId('PX@XX'))
                .toThrow('Invalid schedule ID format');
        });

        it('should provide helpful error messages', () => {
            expect(() => InputValidator.validateScheduleId('invalid-id'))
                .toThrow(/should contain only letters and numbers/);
        });
    });

    describe('validateScheduleIds', () => {
        it('should accept valid comma-separated schedule IDs', () => {
            const ids = InputValidator.validateScheduleIds('PXXXXXX,PYYYYYY');
            expect(ids).toEqual(['PXXXXXX', 'PYYYYYY']);
        });

        it('should trim whitespace from schedule IDs', () => {
            const ids = InputValidator.validateScheduleIds('PXXXXXX , PYYYYYY , PZZZZZZ');
            expect(ids).toEqual(['PXXXXXX', 'PYYYYYY', 'PZZZZZZ']);
        });

        it('should accept single schedule ID', () => {
            const ids = InputValidator.validateScheduleIds('PXXXXXX');
            expect(ids).toEqual(['PXXXXXX']);
        });

        it('should reject empty schedule ID list', () => {
            expect(() => InputValidator.validateScheduleIds(''))
                .toThrow('At least one schedule ID is required');
            expect(() => InputValidator.validateScheduleIds('   '))
                .toThrow('At least one schedule ID is required');
        });

        it('should reject if any ID in list is invalid', () => {
            expect(() => InputValidator.validateScheduleIds('PXXXXXX,invalid-id,PYYYYYY'))
                .toThrow(/Invalid schedule ID at position 2/);
        });

        it('should provide position information in error messages', () => {
            expect(() => InputValidator.validateScheduleIds('PXXXXXX,,PYYYYYY'))
                .toThrow(/position 2/);
        });
    });

    describe('validateTimezone', () => {
        it('should accept valid IANA timezone identifiers', () => {
            expect(() => InputValidator.validateTimezone('Europe/London')).not.toThrow();
            expect(() => InputValidator.validateTimezone('America/New_York')).not.toThrow();
            expect(() => InputValidator.validateTimezone('Asia/Tokyo')).not.toThrow();
            expect(() => InputValidator.validateTimezone('UTC')).not.toThrow();
        });

        it('should reject invalid timezone identifiers', () => {
            expect(() => InputValidator.validateTimezone('Invalid/Timezone'))
                .toThrow('Invalid timezone');
            expect(() => InputValidator.validateTimezone('NotATimezone'))
                .toThrow('Invalid timezone');
            expect(() => InputValidator.validateTimezone('Bad/Zone/Name'))
                .toThrow('Invalid timezone');
        });

        it('should reject empty timezone', () => {
            expect(() => InputValidator.validateTimezone(''))
                .toThrow('Timezone is required');
            expect(() => InputValidator.validateTimezone('   '))
                .toThrow('Timezone is required');
        });

        it('should provide helpful error messages with examples', () => {
            expect(() => InputValidator.validateTimezone('BadTimezone'))
                .toThrow(/Examples: "Europe\/London"/);
        });
    });

    describe('validateOnCallUser', () => {
        it('should accept valid OnCallUser', () => {
            const period = new OnCallPeriod(
                new Date('2024-01-01T00:00:00Z'),
                new Date('2024-01-31T23:59:59Z'),
                'UTC'
            );
            const user = new OnCallUser('USER123', 'John Doe', [period]);
            expect(() => InputValidator.validateOnCallUser(user)).not.toThrow();
        });

        it('should reject null or undefined user', () => {
            expect(() => InputValidator.validateOnCallUser(null))
                .toThrow('OnCallUser is undefined');
            expect(() => InputValidator.validateOnCallUser(undefined))
                .toThrow('OnCallUser is undefined');
        });

        it('should reject user without ID', () => {
            const period = new OnCallPeriod(
                new Date('2024-01-01T00:00:00Z'),
                new Date('2024-01-31T23:59:59Z'),
                'UTC'
            );
            const user = new OnCallUser('', 'John Doe', [period]);
            expect(() => InputValidator.validateOnCallUser(user))
                .toThrow('missing required "id" field');
        });

        it('should reject user without name', () => {
            const period = new OnCallPeriod(
                new Date('2024-01-01T00:00:00Z'),
                new Date('2024-01-31T23:59:59Z'),
                'UTC'
            );
            const user = new OnCallUser('USER123', '', [period]);
            expect(() => InputValidator.validateOnCallUser(user))
                .toThrow('missing required "name" field');
        });

        it('should reject user without on-call periods', () => {
            const user = new OnCallUser('USER123', 'John Doe', []);
            expect(() => InputValidator.validateOnCallUser(user))
                .toThrow('No on-call periods defined');
        });

        it('should provide user context in error messages', () => {
            const user = new OnCallUser('USER123', 'John Doe', []);
            expect(() => InputValidator.validateOnCallUser(user))
                .toThrow(/USER123.*John Doe/);
        });
    });

    describe('sanitizeString', () => {
        it('should trim whitespace from strings', () => {
            expect(InputValidator.sanitizeString('  test  ')).toBe('test');
            expect(InputValidator.sanitizeString('\ttab\t')).toBe('tab');
            expect(InputValidator.sanitizeString('\nline\n')).toBe('line');
        });

        it('should return default value for empty strings', () => {
            expect(InputValidator.sanitizeString('', 'default')).toBe('default');
            expect(InputValidator.sanitizeString('   ', 'default')).toBe('');
        });

        it('should return empty string as default when not specified', () => {
            expect(InputValidator.sanitizeString('')).toBe('');
        });
    });

    describe('validateApiToken', () => {
        it('should accept valid API tokens', () => {
            expect(() => InputValidator.validateApiToken('u+ABC123xyz789012345678')).not.toThrow();
            expect(() => InputValidator.validateApiToken('a'.repeat(40))).not.toThrow();
        });

        it('should reject empty tokens', () => {
            expect(() => InputValidator.validateApiToken(''))
                .toThrow('API token is required');
            expect(() => InputValidator.validateApiToken('   '))
                .toThrow('API token is required');
        });

        it('should reject tokens that are too short without revealing length', () => {
            expect(() => InputValidator.validateApiToken('short'))
                .toThrow('API token appears invalid or incomplete');
            expect(() => InputValidator.validateApiToken('a'.repeat(10)))
                .toThrow('API token appears invalid or incomplete');
        });

        it('should provide helpful error messages without metadata leakage', () => {
            expect(() => InputValidator.validateApiToken(''))
                .toThrow(/Set API_TOKEN environment variable/);
            expect(() => InputValidator.validateApiToken('short'))
                .toThrow(/typically 20\+ characters/);
            // Verify no token length is revealed in error message
            expect(() => InputValidator.validateApiToken('abc123'))
                .toThrow(/invalid or incomplete/);
        });
    });

    describe('validateFilePath', () => {
        it('should accept valid file paths', () => {
            expect(() => InputValidator.validateFilePath('./output/report.csv')).not.toThrow();
            expect(() => InputValidator.validateFilePath('/usr/local/data/file.txt')).not.toThrow();
            expect(() => InputValidator.validateFilePath('relative/path/file.json')).not.toThrow();
        });

        it('should reject empty file paths', () => {
            expect(() => InputValidator.validateFilePath(''))
                .toThrow('Output file path is required');
            expect(() => InputValidator.validateFilePath('   '))
                .toThrow('Output file path is required');
        });

        it('should reject paths with invalid characters', () => {
            expect(() => InputValidator.validateFilePath('file<name>.txt'))
                .toThrow('Invalid characters in file path');
            expect(() => InputValidator.validateFilePath('file>name.txt'))
                .toThrow('Invalid characters in file path');
            expect(() => InputValidator.validateFilePath('file|name.txt'))
                .toThrow('Invalid characters in file path');
            expect(() => InputValidator.validateFilePath('file:name.txt'))
                .toThrow('Invalid characters in file path');
        });

        it('should provide helpful error messages', () => {
            expect(() => InputValidator.validateFilePath(''))
                .toThrow(/Please provide a valid file path/);
        });
    });
});
