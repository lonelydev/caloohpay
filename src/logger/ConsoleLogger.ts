import { Logger } from './Logger';

/**
 * Console logger implementation with automatic sensitive data masking.
 * 
 * All output is automatically scanned for potential sensitive information
 * including API tokens, passwords, and other secrets, which are masked
 * before being written to the console.
 * 
 * @remarks
 * Security features:
 * - Automatically masks strings that look like API tokens (20+ alphanumeric chars)
 * - Masks object properties with sensitive keys (token, key, password, secret, etc.)
 * - Recursively masks nested objects
 * - Prevents accidental logging of sensitive data in error messages and metadata
 * 
 * @category Logging
 */
export class ConsoleLogger implements Logger {
    /**
     * List of property names that should always be masked.
     * Case-insensitive matching is used.
     */
    private readonly sensitiveKeys = [
        'key',
        'token', 
        'password',
        'secret',
        'api_token',
        'apikey',
        'api_key',
        'auth',
        'authorization',
        'bearer'
    ];

    /**
     * Masks sensitive data in any value (string, object, or other).
     * 
     * @param data - Data to mask
     * @param visited - WeakSet to track visited objects and prevent infinite recursion
     * @returns Masked copy of the data
     */
    private maskSensitiveData(data: unknown, visited = new WeakSet<object>()): unknown {
        if (typeof data === 'string') {
            return this.maskString(data);
        }
        if (data && typeof data === 'object') {
            // Prevent infinite recursion from circular references
            if (visited.has(data)) {
                return '[Circular]';
            }
            visited.add(data);
            
            if (Array.isArray(data)) {
                return data.map(item => this.maskSensitiveData(item, visited));
            }
            return this.maskObject(data as Record<string, unknown>, visited);
        }
        return data;
    }

    /**
     * Masks potential tokens and secrets in strings.
     * 
     * Looks for patterns that resemble API tokens or other secrets:
     * - Sequences of 20+ alphanumeric characters (typical token length)
     * - Patterns like "token: value" or "key=value"
     * 
     * @param str - String to mask
     * @returns String with sensitive data replaced with '****'
     */
    private maskString(str: string): string {
        return str
            // Mask potential tokens (20+ alphanumeric/base64 characters)
            .replace(/\b[A-Za-z0-9+/]{20,}\b/g, '****')
            // Mask "token: value" or "token=value" patterns
            .replace(/token[:\s=]+['"]?([^'"\s,}]+)['"]?/gi, 'token: ****')
            // Mask "key: value" or "key=value" patterns
            .replace(/key[:\s=]+['"]?([^'"\s,}]+)['"]?/gi, 'key: ****')
            // Mask "password: value" or "password=value" patterns
            .replace(/password[:\s=]+['"]?([^'"\s,}]+)['"]?/gi, 'password: ****')
            // Mask "secret: value" or "secret=value" patterns
            .replace(/secret[:\s=]+['"]?([^'"\s,}]+)['"]?/gi, 'secret: ****');
    }

    /**
     * Masks sensitive properties in objects.
     * 
     * Creates a deep copy of the object with sensitive properties masked.
     * Recursively processes nested objects and arrays.
     * 
     * @param obj - Object to mask
     * @param visited - WeakSet to track visited objects and prevent infinite recursion
     * @returns New object with sensitive properties masked
     */
    private maskObject(obj: Record<string, unknown>, visited = new WeakSet<object>()): Record<string, unknown> {
        const masked: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(obj)) {
            // Check if key is sensitive
            const isSensitiveKey = this.sensitiveKeys.some(
                sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase())
            );
            
            if (isSensitiveKey) {
                masked[key] = '****';
            } else if (value && typeof value === 'object') {
                // Prevent infinite recursion
                if (visited.has(value)) {
                    masked[key] = '[Circular]';
                } else {
                    visited.add(value);
                    if (Array.isArray(value)) {
                        masked[key] = value.map(item => this.maskSensitiveData(item, visited));
                    } else {
                        masked[key] = this.maskObject(value as Record<string, unknown>, visited);
                    }
                }
            } else if (typeof value === 'string') {
                masked[key] = this.maskString(value);
            } else {
                masked[key] = value;
            }
        }
        
        return masked;
    }

    info(message: string, meta?: Record<string, unknown>): void {
        const maskedMessage = this.maskString(message);
        if (meta) {
            console.log(maskedMessage, this.maskSensitiveData(meta));
        } else {
            console.log(maskedMessage);
        }
    }
    
    warn(message: string, meta?: Record<string, unknown>): void {
        const maskedMessage = this.maskString(message);
        if (meta) {
            console.warn(maskedMessage, this.maskSensitiveData(meta));
        } else {
            console.warn(maskedMessage);
        }
    }
    
    error(message: string | Error, meta?: Record<string, unknown>): void {
        if (message instanceof Error) {
            const maskedStack = this.maskString(message.stack || message.message);
            console.error(maskedStack);
        } else {
            const maskedMessage = this.maskString(message);
            if (meta) {
                console.error(maskedMessage, this.maskSensitiveData(meta));
            } else {
                console.error(maskedMessage);
            }
        }
    }
    
    debug(message: string, meta?: Record<string, unknown>): void {
        const maskedMessage = this.maskString(message);
        if (meta) {
            console.debug(maskedMessage, this.maskSensitiveData(meta));
        } else {
            console.debug(maskedMessage);
        }
    }
    
    table(data: unknown): void {
        // console.table can throw on some objects; guard it
        try {
            const maskedData = this.maskSensitiveData(data);
            // console.table accepts any tabular data (array, object, etc)
            // Type assertion is safe here as we handle errors in catch block
            console.table(maskedData as Record<string, unknown> | unknown[]);
        } catch {
            // fallback to logging the object
            console.log(this.maskSensitiveData(data));
        }
    }
}
