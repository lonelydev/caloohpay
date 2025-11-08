import { CommandLineOptions } from '../CommandLineOptions';

/**
 * Masks sensitive API key in CLI options before logging.
 * 
 * @param cliOptions - The command line options to mask
 * @returns A copy of the options with the API key masked as '****'
 * 
 * @remarks
 * Creates a shallow copy to avoid mutating the original options.
 * Only masks the key if it exists.
 */
export function maskCliOptions(cliOptions: CommandLineOptions): CommandLineOptions {
    const cloned = { ...cliOptions };
    if (cloned.key) {
        cloned.key = '****';
    }
    return cloned;
}

/**
 * Sanitizes error messages by masking potential tokens and sensitive data.
 * 
 * Removes or masks sensitive information that might appear in error messages,
 * stack traces, or error objects before they are logged or displayed.
 * 
 * @param error - Error object or string to sanitize
 * @returns Sanitized error message string with sensitive data masked
 * 
 * @remarks
 * Security features:
 * - Masks potential API tokens (20+ alphanumeric characters)
 * - Masks "token: value" and "token=value" patterns
 * - Masks "key: value" and "key=value" patterns
 * - Masks "password: value" and "password=value" patterns
 * - Masks "secret: value" and "secret=value" patterns
 * - Preserves stack trace structure while masking sensitive data
 * 
 * @example
 * ```typescript
 * const error = new Error('API failed with token: abc123xyz789');
 * const safe = sanitizeError(error);
 * // Returns: "API failed with token: ****"
 * 
 * const message = 'Authentication key=secretKey123 invalid';
 * const safe2 = sanitizeError(message);
 * // Returns: "Authentication key: **** invalid"
 * ```
 * 
 * @category Security
 * @since 2.1.0
 */
export function sanitizeError(error: Error | string): string {
    // Get the message - use stack for Error objects to preserve trace structure
    const message = error instanceof Error ? (error.stack || error.message) : error;
    
    return message
        // Mask potential tokens (20+ alphanumeric/base64 characters)
        .replace(/\b[A-Za-z0-9+/]{20,}\b/g, '****')
        // Mask "token: value" or "token=value" patterns (with various separators)
        .replace(/(token\w*)\s*[:\s=]+\s*['"]?([^'"\s,}]+)['"]?/gi, '$1: ****')
        // Mask "key: value" or "key=value" patterns
        .replace(/(key\w*)\s*[:\s=]+\s*['"]?([^'"\s,}]+)['"]?/gi, '$1: ****')
        // Mask "password: value" or "password=value" patterns
        .replace(/(password\w*)\s*[:\s=]+\s*['"]?([^'"\s,}]+)['"]?/gi, '$1: ****')
        // Mask "secret: value" or "secret=value" patterns
        .replace(/(secret\w*)\s*[:\s=]+\s*['"]?([^'"\s,}]+)['"]?/gi, '$1: ****')
        // Mask "authorization: value" or "authorization=value" patterns
        .replace(/(authorization\w*)\s*[:\s=]+\s*['"]?([^'"\s,}]+)['"]?/gi, '$1: ****')
        // Mask "bearer value" patterns
        .replace(/bearer\s+([A-Za-z0-9+/]+)/gi, 'bearer ****');
}
