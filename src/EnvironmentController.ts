
export interface Environment {
    API_TOKEN: string;
}

export function sanitiseEnvVariable(envVars: NodeJS.ProcessEnv, apiKeyOverride?: string): Environment {
    const apiToken = apiKeyOverride || envVars.API_TOKEN;
    
    if (!apiToken) {
        throw new Error("API_TOKEN not defined. Please set API_TOKEN environment variable or use --key option.");
    }
    
    return {
        API_TOKEN: apiToken,
    };
}
