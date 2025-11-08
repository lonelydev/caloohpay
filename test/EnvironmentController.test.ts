import { describe, expect, test } from '@jest/globals';

import { sanitiseEnvVariable } from '@src/EnvironmentController';

describe('EnvironmentController', () => {
    describe('sanitiseEnvVariable', () => {
        test('should return API_TOKEN from environment variables when no override provided', () => {
            const envVars = { API_TOKEN: 'env-token-1234567890123456789' };
            const result = sanitiseEnvVariable(envVars);
            expect(result.API_TOKEN).toBe('env-token-1234567890123456789');
        });

        test('should use API key override when provided', () => {
            const envVars = { API_TOKEN: 'env-token-1234567890123456789' };
            const result = sanitiseEnvVariable(envVars, 'override-token-456789012345678901234');
            expect(result.API_TOKEN).toBe('override-token-456789012345678901234');
        });

        test('should use API key override even when env var is not set', () => {
            const envVars = {};
            const result = sanitiseEnvVariable(envVars, 'override-token-789012345678901234567');
            expect(result.API_TOKEN).toBe('override-token-789012345678901234567');
        });

        test('should throw error when neither env var nor override is provided', () => {
            const envVars = {};
            expect(() => sanitiseEnvVariable(envVars)).toThrow(
                'PagerDuty API token is required'
            );
        });

        test('should throw error when env var is undefined and no override provided', () => {
            const envVars = { API_TOKEN: undefined };
            expect(() => sanitiseEnvVariable(envVars)).toThrow(
                'PagerDuty API token is required'
            );
        });

        test('should prioritize override over environment variable', () => {
            const envVars = { API_TOKEN: 'env-token-1234567890123456789' };
            const result = sanitiseEnvVariable(envVars, 'cli-override-token123456789012345');
            expect(result.API_TOKEN).toBe('cli-override-token123456789012345');
        });

        test('should throw error when API token is too short', () => {
            const envVars = {};
            expect(() => sanitiseEnvVariable(envVars, 'short'))
                .toThrow('API token appears invalid or incomplete');
        });
    });
});
