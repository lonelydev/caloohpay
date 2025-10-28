/**
 * Environment configuration for API authentication.
 * 
 * Stores validated environment variables needed for the application to function,
 * primarily the PagerDuty API authentication token.
 * 
 * @category Models
 * 
 * @example
 * ```typescript
 * const env: Environment = {
 *   API_TOKEN: 'your-pagerduty-api-token'
 * };
 * ```
 */
export interface Environment {
    /**
     * PagerDuty API authentication token.
     * Required for all API calls to PagerDuty.
     * Should be a valid PagerDuty REST API token with appropriate permissions.
     * 
     * @see {@link https://support.pagerduty.com/docs/api-access-keys|PagerDuty API Access Keys}
     */
    API_TOKEN: string;
}

/**
 * Validates and sanitizes environment variables for API access.
 * 
 * This function ensures that the required API token is available, either from
 * the environment variables or a command-line override. It prioritizes the
 * command-line provided key over the environment variable.
 * 
 * @category Utilities
 * 
 * @param envVars - Node.js process environment variables
 * @param apiKeyOverride - Optional API key provided via command-line (takes precedence)
 * 
 * @returns Validated Environment object with API_TOKEN
 * 
 * @throws {Error} If neither environment variable nor override provides an API token
 * 
 * @example
 * ```typescript
 * // Using environment variable
 * const env = sanitiseEnvVariable(process.env);
 * 
 * // Using command-line override
 * const env = sanitiseEnvVariable(process.env, 'cli-provided-token');
 * ```
 */
export function sanitiseEnvVariable(envVars: NodeJS.ProcessEnv, apiKeyOverride?: string): Environment {
    const apiToken = apiKeyOverride || envVars.API_TOKEN;
    
    if (!apiToken) {
        throw new Error('PagerDuty API token is required. ' +
            'Set the API_TOKEN environment variable or use the --key/-k option.\n' +
            'Get your token from: My Profile -> User Settings -> API Access -> Create New API User Token'
        );
    }
    
    return {
        API_TOKEN: apiToken,
    };
}

