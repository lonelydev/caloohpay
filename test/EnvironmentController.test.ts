import { describe, expect, test } from '@jest/globals';

import { sanitiseEnvVariable } from '@src/EnvironmentController';

describe('EnvironmentController', () => {
    describe('sanitiseEnvVariable', () => {
        test('should return API_TOKEN from environment variables when no override provided', () => {
            const envVars = { API_TOKEN: 'env-token-123' };
            const result = sanitiseEnvVariable(envVars);
            expect(result.API_TOKEN).toBe('env-token-123');
        });

        test('should use API key override when provided', () => {
            const envVars = { API_TOKEN: 'env-token-123' };
            const result = sanitiseEnvVariable(envVars, 'override-token-456');
            expect(result.API_TOKEN).toBe('override-token-456');
        });

        test('should use API key override even when env var is not set', () => {
            const envVars = {};
            const result = sanitiseEnvVariable(envVars, 'override-token-789');
            expect(result.API_TOKEN).toBe('override-token-789');
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
            const envVars = { API_TOKEN: 'env-token' };
            const result = sanitiseEnvVariable(envVars, 'cli-override-token');
            expect(result.API_TOKEN).toBe('cli-override-token');
        });
    });
});
