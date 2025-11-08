# Security Guidelines

## Sensitive Data Protection

CalOohPay implements multiple layers of defense to prevent sensitive information (API tokens, passwords, secrets) from being logged in clear text.

### Multi-Layer Security Architecture

#### Layer 1: Automatic Logger Masking

**File**: `src/logger/ConsoleLogger.ts`

All logging is automatically protected:

- Masks strings ≥20 characters that look like tokens
- Masks object properties with sensitive keys (token, key, password, secret, etc.)
- Recursively processes nested objects with circular reference protection
- Case-insensitive pattern matching

**Usage**: Just use the logger normally - protection is automatic

```typescript
logger.info('Processing with token:', apiToken); // Automatically masked
logger.error('Error:', errorObject); // Sensitive properties masked
```

#### Layer 2: Error Sanitization Utility

**File**: `src/logger/utils.ts`

Explicit sanitization for error messages:

```typescript
import { sanitizeError } from './logger/utils';

try {
    // risky operation
} catch (error) {
    const safe = sanitizeError(error);
    logger.error(safe); // Extra protection layer
    throw new Error(safe);
}
```

Features:

- Comprehensive regex patterns for token, key, password, secret, authorization
- Handles variable names with digits (token1, apiKey2, etc.)
- Supports multiple separator formats (`:`, `=`, whitespace)
- Preserves error structure while removing sensitive data

#### Layer 3: Input Validation Without Metadata Leakage

**File**: `src/validation/InputValidator.ts`

Validates without revealing sensitive information:

```typescript
// ✅ GOOD: No metadata leakage
throw new Error('API token appears invalid or incomplete');

// ❌ BAD: Reveals token length
throw new Error(`API token appears too short (${length} characters)`);
```

#### Layer 4: API Error Response Sanitization

**File**: `src/CalOohPay.ts`

PagerDuty API errors are sanitized before logging:

```typescript
const sanitizedError = {
    message: error.message,
    code: error.code || error.status,
    // SECURITY: Exclude potentially sensitive fields:
    // - details, token, request_id, url, headers
};
logger.error('PagerDuty API error:', sanitizedError);
```

#### Layer 5: Documentation & Best Practices

All sensitive data handling code includes security comments and documentation.

### Best Practices for Developers

1. **Always Use ConsoleLogger**
   - Don't use `console.log()` directly
   - Don't bypass the logger for debugging
   - The logger provides automatic protection

2. **Validate Without Leaking Metadata**
   - Don't include token/password lengths in errors
   - Don't include format details in validation messages
   - Use generic error messages

3. **Sanitize Before Logging Errors**
   - Use `sanitizeError()` for external API errors
   - Create sanitized error objects for logging
   - Never log raw error objects from APIs

4. **Code Review Checklist**
   - [ ] No `console.log()` calls in production code
   - [ ] Error messages don't reveal token length/format
   - [ ] API errors are sanitized before logging
   - [ ] Sensitive object properties are masked
   - [ ] Error handlers use sanitizeError()

5. **Testing Sensitive Data Handling**
   - Test that tokens are masked in logs
   - Test that error messages don't leak metadata
   - Test circular reference handling
   - Test various token/key formats

### Security Testing

Run security-focused tests:

```bash
npm test -- ConsoleLoggerMasking.test.ts
npm test -- LoggerMasking.test.ts
npm test -- InputValidator.test.ts
```

### Incident Response

If sensitive data is accidentally logged:

1. Rotate the exposed credentials immediately
2. Review all log aggregation systems
3. Update security layers if needed
4. Add tests to prevent recurrence

### References

- PagerDuty API Access Keys: https://support.pagerduty.com/docs/api-access-keys
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
