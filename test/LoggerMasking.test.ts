import { describe, expect, it } from '@jest/globals';
import type { CommandLineOptions } from '@src/CommandLineOptions';
import { maskCliOptions, sanitizeError } from '@src/logger/utils';

describe('maskCliOptions', () => {
    it('masks key when present', () => {
        const opts: CommandLineOptions = { rotaIds: 'P1', key: 'secret', since: '2020-01-01', until: '2020-01-02' };
        const masked = maskCliOptions(opts);
        expect(masked.key).toBe('****');
        expect(masked.rotaIds).toBe('P1');
    });
    it('does not modify when no key', () => {
        const opts: CommandLineOptions = { rotaIds: 'P1', since: '2020-01-01', until: '2020-01-02' };
        const masked = maskCliOptions(opts);
        expect(masked.key).toBeUndefined();
    });
});

describe('sanitizeError', () => {
    describe('String sanitization', () => {
        it('should mask API tokens (20+ characters) in error messages', () => {
            const message = 'API call failed with token: abcd1234567890efghijklmn';
            const sanitized = sanitizeError(message);
            
            expect(sanitized).toBe('API call failed with token: ****');
            expect(sanitized).not.toContain('abcd1234567890efghijklmn');
        });

        it('should mask multiple tokens in the same message', () => {
            const message = 'Auth failed: token1=xyz9876543210abcdefgh and token2=abc1234567890efghij';
            const sanitized = sanitizeError(message);
            
            expect(sanitized).toContain('token1: ****');
            expect(sanitized).toContain('token2: ****');
            expect(sanitized).not.toContain('xyz9876543210abcdefgh');
            expect(sanitized).not.toContain('abc1234567890efghij');
        });

        it('should mask "token: value" pattern', () => {
            expect(sanitizeError('Error with token: secretValue123'))
                .toBe('Error with token: ****');
        });

        it('should mask "token=value" pattern', () => {
            expect(sanitizeError('Failed: token=mySecretToken'))
                .toBe('Failed: token: ****');
        });

        it('should mask "key: value" pattern', () => {
            expect(sanitizeError('Invalid key: apiKey12345'))
                .toBe('Invalid key: ****');
        });

        it('should mask "key=value" pattern', () => {
            expect(sanitizeError('Request key=secretKey123'))
                .toBe('Request key: ****');
        });

        it('should mask "password: value" pattern', () => {
            expect(sanitizeError('Login failed with password: myPass123'))
                .toBe('Login failed with password: ****');
        });

        it('should mask "secret: value" pattern', () => {
            expect(sanitizeError('Config has secret: topSecret456'))
                .toBe('Config has secret: ****');
        });

        it('should mask "authorization: value" pattern', () => {
            const result = sanitizeError('Auth failed: authorization: Bearer token123');
            // Both 'authorization: Bearer' and 'bearer token123' patterns are matched
            expect(result).toContain('authorization: ****');
        });

        it('should mask "bearer token" pattern', () => {
            expect(sanitizeError('Invalid bearer abc123xyz789'))
                .toBe('Invalid bearer ****');
        });

        it('should handle case-insensitive patterns', () => {
            // The regex preserves the original case of the keyword
            expect(sanitizeError('ERROR with TOKEN: secret123'))
                .toBe('ERROR with TOKEN: ****');
            expect(sanitizeError('Failed KEY=myKey456'))
                .toBe('Failed KEY: ****');
        });

        it('should not mask short strings (less than 20 chars)', () => {
            const message = 'Error code: 12345';
            expect(sanitizeError(message)).toBe(message);
        });

        it('should preserve message structure while masking', () => {
            const message = 'API request to /users failed with token: xyz1234567890abcdefgh. Status: 401';
            const sanitized = sanitizeError(message);
            
            expect(sanitized).toContain('/users failed with token: ****');
            expect(sanitized).toContain('Status: 401');
        });
    });

    describe('Error object sanitization', () => {
        it('should sanitize Error objects using their stack trace', () => {
            const error = new Error('Failed with token: abcd1234567890efghijklmn');
            error.stack = 'Error: Failed with token: abcd1234567890efghijklmn\n    at test.js:1:1';
            
            const sanitized = sanitizeError(error);
            
            expect(sanitized).toContain('Failed with token: ****');
            expect(sanitized).not.toContain('abcd1234567890efghijklmn');
            expect(sanitized).toContain('at test.js:1:1');
        });

        it('should use message when stack is not available', () => {
            const error = new Error('Auth failed with key: secretKey123456789012');
            delete error.stack;
            
            const sanitized = sanitizeError(error);
            
            expect(sanitized).toBe('Auth failed with key: ****');
        });

        it('should handle errors with multiple sensitive values', () => {
            const error = new Error('Multiple issues: token=abc123xyz789012345 and password=secret123456789012');
            
            const sanitized = sanitizeError(error);
            
            expect(sanitized).not.toContain('abc123xyz789012345');
            expect(sanitized).not.toContain('secret123456789012');
            expect(sanitized).toContain('token: ****');
            expect(sanitized).toContain('password: ****');
        });

        it('should preserve stack trace structure', () => {
            const error = new Error('API error');
            error.stack = 'Error: API error with token xyz1234567890abcdefgh\n' +
                         '    at apiCall (api.ts:10:5)\n' +
                         '    at main (index.ts:5:3)';
            
            const sanitized = sanitizeError(error);
            
            expect(sanitized).toContain('at apiCall (api.ts:10:5)');
            expect(sanitized).toContain('at main (index.ts:5:3)');
            expect(sanitized).toContain('token: ****');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty strings', () => {
            expect(sanitizeError('')).toBe('');
        });

        it('should handle messages without sensitive data', () => {
            const message = 'Simple error message';
            expect(sanitizeError(message)).toBe(message);
        });

        it('should handle messages with only safe data', () => {
            const message = 'Schedule PXXXXXX not found. Status: 404';
            expect(sanitizeError(message)).toBe(message);
        });

        it('should handle complex error messages with URLs', () => {
            const message = 'GET https://api.example.com/schedules?token=abc123xyz789012345 failed';
            const sanitized = sanitizeError(message);
            
            expect(sanitized).not.toContain('abc123xyz789012345');
            expect(sanitized).toContain('https://api.example.com/schedules');
        });

        it('should handle JSON-like error messages', () => {
            const message = '{"error": "Unauthorized", "token": "xyz1234567890abcdefgh"}';
            const sanitized = sanitizeError(message);
            
            expect(sanitized).not.toContain('xyz1234567890abcdefgh');
            // The token value gets masked, resulting in "token": "****"
            expect(sanitized).toContain('"token": "****"');
        });

        it('should handle quoted values', () => {
            const message = 'Error: token="secretToken123456789012"';
            const sanitized = sanitizeError(message);
            
            expect(sanitized).toContain('token: ****');
            expect(sanitized).not.toContain('secretToken123456789012');
        });
    });

    describe('Real-world scenarios', () => {
        it('should sanitize PagerDuty API error with token', () => {
            const error = 'PagerDuty API returned 401: Invalid token u+1234567890abcdefghij';
            const sanitized = sanitizeError(error);
            
            expect(sanitized).not.toContain('u+1234567890abcdefghij');
            expect(sanitized).toContain('PagerDuty API returned 401');
        });

        it('should sanitize authentication header leakage', () => {
            const error = 'Request failed with headers: {authorization: Bearer xyz9876543210abcdefgh}';
            const sanitized = sanitizeError(error);
            
            expect(sanitized).not.toContain('xyz9876543210abcdefgh');
            expect(sanitized).toContain('authorization: ****');
        });

        it('should sanitize environment variable leakage', () => {
            const error = 'Missing API_TOKEN environment variable (current value: abc123xyz789012345678)';
            const sanitized = sanitizeError(error);
            
            // The long token value should be masked as it's 20+ characters
            expect(sanitized).not.toContain('abc123xyz789012345678');
        });

        it('should sanitize multiple credential types in one message', () => {
            const error = 'Auth failed: token=abc123456789012345, password=pass987654321098, secret=sec1234567890123';
            const sanitized = sanitizeError(error);
            
            expect(sanitized).toContain('token: ****');
            expect(sanitized).toContain('password: ****');
            expect(sanitized).toContain('secret: ****');
            expect(sanitized).not.toContain('abc123456789012345');
            expect(sanitized).not.toContain('pass987654321098');
            expect(sanitized).not.toContain('sec1234567890123');
        });
    });
});
