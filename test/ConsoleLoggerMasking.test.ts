import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

import { ConsoleLogger } from '@src/logger/ConsoleLogger';

describe('ConsoleLogger - Sensitive Data Masking', () => {
    let logger: ConsoleLogger;
    let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
    let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
    let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
    let consoleDebugSpy: jest.SpiedFunction<typeof console.debug>;
    let consoleTableSpy: jest.SpiedFunction<typeof console.table>;

    beforeEach(() => {
        logger = new ConsoleLogger();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        consoleTableSpy = jest.spyOn(console, 'table').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('String masking', () => {
        it('should mask API tokens (20+ alphanumeric characters) in info messages', () => {
            logger.info('Using token: u+1234567890abcdefghij for API call');
            
            expect(consoleLogSpy).toHaveBeenCalledWith('Using token: **** for API call');
        });

        it('should mask multiple tokens in the same message', () => {
            logger.info('Token1: abcd1234567890efghij and Token2: xyz9876543210abcdefgh');
            
            const call = consoleLogSpy.mock.calls[0][0] as string;
            expect(call).toContain('****');
            expect(call).not.toContain('abcd1234567890efghij');
            expect(call).not.toContain('xyz9876543210abcdefgh');
        });

        it('should mask token in "token: value" pattern', () => {
            logger.info('Authentication token: secret123');
            
            expect(consoleLogSpy).toHaveBeenCalledWith('Authentication token: ****');
        });

        it('should mask key in "key=value" pattern', () => {
            logger.warn('API key=mysecretkey123');
            
            expect(consoleWarnSpy).toHaveBeenCalledWith('API key: ****');
        });

        it('should mask password in messages', () => {
            logger.error('Login failed with password: secretpass123');
            
            expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed with password: ****');
        });

        it('should mask secret in messages', () => {
            logger.debug('Shared secret=topSecret456');
            
            expect(consoleDebugSpy).toHaveBeenCalledWith('Shared secret: ****');
        });

        it('should not mask short strings (less than 20 chars)', () => {
            logger.info('Short value: abc123');
            
            expect(consoleLogSpy).toHaveBeenCalledWith('Short value: abc123');
        });

        it('should handle messages without sensitive data', () => {
            logger.info('Processing schedule PXXXXXX');
            
            expect(consoleLogSpy).toHaveBeenCalledWith('Processing schedule PXXXXXX');
        });
    });

    describe('Object masking', () => {
        it('should mask key property in metadata objects', () => {
            logger.info('API request', { key: 'secretApiKey12345', rotaId: 'PXXXXXX' });
            
            const call = consoleLogSpy.mock.calls[0];
            expect(call[0]).toBe('API request');
            expect(call[1]).toEqual({ key: '****', rotaId: 'PXXXXXX' });
        });

        it('should mask token property', () => {
            logger.warn('Authentication', { token: 'bearer_token_12345', userId: 'U123' });
            
            const meta = consoleWarnSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.token).toBe('****');
            expect(meta.userId).toBe('U123');
        });

        it('should mask password property', () => {
            logger.error('Login attempt', { username: 'admin', password: 'secret123' });
            
            const meta = consoleErrorSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.password).toBe('****');
            expect(meta.username).toBe('admin');
        });

        it('should mask api_token property', () => {
            logger.debug('Config', { api_token: 'my_api_token_value', endpoint: 'https://api.example.com' });
            
            const meta = consoleDebugSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.api_token).toBe('****');
            expect(meta.endpoint).toBe('https://api.example.com');
        });

        it('should mask apiKey property (camelCase)', () => {
            logger.info('Settings', { apiKey: 'camelCaseApiKey123', timeout: 5000 });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.apiKey).toBe('****');
            expect(meta.timeout).toBe(5000);
        });

        it('should mask authorization property', () => {
            logger.info('Headers', { authorization: 'Bearer xyz123', contentType: 'application/json' });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.authorization).toBe('****');
            expect(meta.contentType).toBe('application/json');
        });

        it('should mask nested objects', () => {
            logger.info('Complex config', {
                database: { host: 'localhost', password: 'dbpass123' },
                api: { key: 'apikey456', endpoint: '/api/v1' }
            });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            const db = meta.database as Record<string, unknown>;
            const api = meta.api as Record<string, unknown>;
            
            expect(db.password).toBe('****');
            expect(db.host).toBe('localhost');
            expect(api.key).toBe('****');
            expect(api.endpoint).toBe('/api/v1');
        });

        it('should mask arrays of objects', () => {
            logger.info('Multiple configs', {
                credentials: [
                    { name: 'prod', token: 'prodToken123456789012' },
                    { name: 'dev', token: 'devToken1234567890123' }
                ]
            });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            const creds = meta.credentials as Record<string, unknown>[];
            
            expect(creds[0].token).toBe('****');
            expect(creds[0].name).toBe('prod');
            expect(creds[1].token).toBe('****');
            expect(creds[1].name).toBe('dev');
        });

        it('should mask tokens in string values within objects', () => {
            logger.info('Response', { 
                message: 'Auth successful with token abcd1234567890efghijklmn',
                status: 200 
            });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.message).toBe('Auth successful with token: ****');
            expect(meta.status).toBe(200);
        });
    });

    describe('Error masking', () => {
        it('should mask tokens in Error stack traces', () => {
            const error = new Error('API failed with token: abcd1234567890efghijklmn');
            error.stack = 'Error: API failed with token: abcd1234567890efghijklmn\n    at test.js:1:1';
            
            logger.error(error);
            
            const logged = consoleErrorSpy.mock.calls[0][0] as string;
            expect(logged).toContain('****');
            expect(logged).not.toContain('abcd1234567890efghijklmn');
        });

        it('should mask tokens in error messages without stack', () => {
            const error = new Error('Token validation failed: xyz9876543210abcdefgh');
            delete error.stack;
            
            logger.error(error);
            
            const logged = consoleErrorSpy.mock.calls[0][0] as string;
            expect(logged).toContain('****');
            expect(logged).not.toContain('xyz9876543210abcdefgh');
        });

        it('should mask string error messages', () => {
            logger.error('Authentication error with key: secretkey123456789012');
            
            expect(consoleErrorSpy).toHaveBeenCalledWith('Authentication error with key: ****');
        });

        it('should mask error metadata objects', () => {
            logger.error('Request failed', { 
                error: 'Unauthorized',
                token: 'failed_token_12345678901234',
                url: '/api/schedules'
            });
            
            const meta = consoleErrorSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.token).toBe('****');
            expect(meta.error).toBe('Unauthorized');
            expect(meta.url).toBe('/api/schedules');
        });
    });

    describe('Table masking', () => {
        it('should mask sensitive data in console.table output', () => {
            const data = [
                { name: 'Config 1', apiKey: 'key123456789012345678', active: true },
                { name: 'Config 2', apiKey: 'key987654321098765432', active: false }
            ];
            
            logger.table(data);
            
            const logged = consoleTableSpy.mock.calls[0][0] as Record<string, unknown>[];
            expect(logged[0].apiKey).toBe('****');
            expect(logged[1].apiKey).toBe('****');
            expect(logged[0].name).toBe('Config 1');
            expect(logged[1].name).toBe('Config 2');
        });

        it('should mask object properties in table', () => {
            const data = {
                production: { key: 'prodKey123456789012', env: 'prod' },
                staging: { key: 'stagingKey123456789', env: 'staging' }
            };
            
            logger.table(data);
            
            const logged = consoleTableSpy.mock.calls[0][0] as Record<string, Record<string, unknown>>;
            expect(logged.production.key).toBe('****');
            expect(logged.staging.key).toBe('****');
            expect(logged.production.env).toBe('prod');
        });

        it('should fallback to log if table throws', () => {
            consoleTableSpy.mockImplementation(() => {
                throw new Error('table failed');
            });
            
            const data = { token: 'shouldBeMasked12345678901234' };
            logger.table(data);
            
            expect(consoleLogSpy).toHaveBeenCalled();
            const logged = consoleLogSpy.mock.calls[0][0] as Record<string, unknown>;
            expect(logged.token).toBe('****');
        });
    });

    describe('Case-insensitive key matching', () => {
        it('should mask KEY (uppercase)', () => {
            logger.info('Data', { KEY: 'secretValue123', value: 'safe' });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.KEY).toBe('****');
        });

        it('should mask Token (mixed case)', () => {
            logger.info('Data', { Token: 'secretToken123', value: 'safe' });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.Token).toBe('****');
        });

        it('should mask bearer_token', () => {
            logger.info('Auth', { bearer_token: 'bearerValue123', user: 'admin' });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.bearer_token).toBe('****');
        });

        it('should mask apiSecret', () => {
            logger.info('Secrets', { apiSecret: 'mySecret123', region: 'us-east-1' });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.apiSecret).toBe('****');
        });
    });

    describe('Performance and edge cases', () => {
        it('should handle null values', () => {
            logger.info('Test', { key: null, value: 'safe' });
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.key).toBe('****'); // Still masked even if null
        });

        it('should handle undefined values', () => {
            logger.info('Test', { value: undefined });
            
            expect(consoleLogSpy).toHaveBeenCalled();
            // Should not throw
        });

        it('should handle empty objects', () => {
            logger.info('Empty', {});
            
            expect(consoleLogSpy).toHaveBeenCalledWith('Empty', {});
        });

        it('should handle empty strings', () => {
            logger.info('');
            
            expect(consoleLogSpy).toHaveBeenCalledWith('');
        });

        it('should handle deeply nested objects', () => {
            const deepObj = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                secret: 'deepSecret123'
                            }
                        }
                    }
                }
            };
            
            logger.info('Deep', deepObj);
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            const level1 = meta.level1 as Record<string, unknown>;
            const level2 = level1.level2 as Record<string, unknown>;
            const level3 = level2.level3 as Record<string, unknown>;
            const level4 = level3.level4 as Record<string, unknown>;
            
            expect(level4.secret).toBe('****');
        });

        it('should handle circular references gracefully', () => {
            const obj: Record<string, unknown> = { key: 'value123', name: 'test' };
            obj.self = obj; // Create circular reference
            
            logger.info('Circular', obj);
            
            const meta = consoleLogSpy.mock.calls[0][1] as Record<string, unknown>;
            expect(meta.self).toBe('[Circular]');
            expect(meta.name).toBe('test');
            expect(meta.key).toBe('****'); // Key should still be masked
        });
    });
});
