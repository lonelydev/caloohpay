/**
 * Tests for v2.1.0 modular export structure.
 * 
 * Verifies that:
 * - Core exports work without Node.js dependencies
 * - Node exports include all Node.js-specific functionality
 * - Main index maintains backward compatibility
 */

import { describe, expect, it } from '@jest/globals';

// Import from core (browser-compatible)
import * as CoreExports from '../src/core';

// Import from node (Node.js-specific)
import * as NodeExports from '../src/node';

// Import from main index (backward compatible)
import * as MainExports from '../src/index';

describe('Export Structure (v2.1.0)', () => {
    describe('caloohpay/core - Browser-compatible exports', () => {
        it('should export calculator classes', () => {
            expect(CoreExports.OnCallPaymentsCalculator).toBeDefined();
            expect(typeof CoreExports.OnCallPaymentsCalculator).toBe('function');
        });

        it('should export model classes', () => {
            expect(CoreExports.OnCallUser).toBeDefined();
            expect(CoreExports.OnCallPeriod).toBeDefined();
            expect(typeof CoreExports.OnCallUser).toBe('function');
            expect(typeof CoreExports.OnCallPeriod).toBe('function');
        });

        it('should export constants', () => {
            expect(CoreExports.WEEKDAY_RATE).toBeDefined();
            expect(CoreExports.WEEKEND_RATE).toBeDefined();
            expect(CoreExports.DEFAULT_RATES).toBeDefined();
            expect(typeof CoreExports.WEEKDAY_RATE).toBe('number');
            expect(typeof CoreExports.WEEKEND_RATE).toBe('number');
        });

        it('should export utilities', () => {
            expect(CoreExports.InputValidator).toBeDefined();
            expect(CoreExports.convertTimezone).toBeDefined();
        });

        it('should NOT export Node.js-specific modules', () => {
            // These should not be in core exports
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((CoreExports as any).ConfigLoader).toBeUndefined();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((CoreExports as any).CsvWriter).toBeUndefined();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((CoreExports as any).calOohPay).toBeUndefined();
        });

        it('should work without fs or path dependencies', () => {
            // This test verifies that importing core doesn't require Node.js modules
            const { OnCallPaymentsCalculator, OnCallUser, OnCallPeriod, DEFAULT_RATES } = CoreExports;
            
            // Create instances to verify no runtime dependencies
            const calculator = new OnCallPaymentsCalculator(
                DEFAULT_RATES.weekdayRate,
                DEFAULT_RATES.weekendRate
            );
            
            const period = new OnCallPeriod(
                new Date('2024-01-01T18:00:00Z'),
                new Date('2024-01-02T09:00:00Z'),
                'UTC'
            );
            
            const user = new OnCallUser('test-id', 'Test User', [period]);
            
            // Should calculate without errors
            const amount = calculator.calculateOnCallPayment(user);
            expect(typeof amount).toBe('number');
            expect(amount).toBeGreaterThan(0);
        });
    });

    describe('caloohpay/node - Node.js-specific exports', () => {
        it('should export all core functionality', () => {
            // Should include everything from core
            expect(NodeExports.OnCallPaymentsCalculator).toBeDefined();
            expect(NodeExports.OnCallUser).toBeDefined();
            expect(NodeExports.OnCallPeriod).toBeDefined();
            expect(NodeExports.DEFAULT_RATES).toBeDefined();
        });

        it('should export Node.js-specific modules', () => {
            expect(NodeExports.ConfigLoader).toBeDefined();
            expect(NodeExports.CsvWriter).toBeDefined();
            expect(NodeExports.calOohPay).toBeDefined();
            expect(typeof NodeExports.ConfigLoader).toBe('function');
            expect(typeof NodeExports.CsvWriter).toBe('function');
            expect(typeof NodeExports.calOohPay).toBe('function');
        });

        it('should export CLI utilities', () => {
            expect(NodeExports.extractOnCallUsersFromFinalSchedule).toBeDefined();
            expect(NodeExports.coerceSince).toBeDefined();
            expect(NodeExports.coerceUntil).toBeDefined();
            expect(NodeExports.sanitiseEnvVariable).toBeDefined();
            expect(NodeExports.maskCliOptions).toBeDefined();
        });
    });

    describe('caloohpay - Main index (backward compatibility)', () => {
        it('should export everything for backward compatibility', () => {
            // Should have both core and node exports
            expect(MainExports.OnCallPaymentsCalculator).toBeDefined();
            expect(MainExports.ConfigLoader).toBeDefined();
            expect(MainExports.CsvWriter).toBeDefined();
            expect(MainExports.calOohPay).toBeDefined();
        });

        it('should maintain v2.0.x API', () => {
            // All v2.0.x exports should still work
            const requiredExports = [
                'OnCallPaymentsCalculator',
                'OnCallUser',
                'OnCallPeriod',
                'ConfigLoader',
                'CsvWriter',
                'calOohPay',
                'InputValidator',
                'DEFAULT_RATES',
                'WEEKDAY_RATE',
                'WEEKEND_RATE'
            ];
            
            for (const exportName of requiredExports) {
                expect(MainExports[exportName as keyof typeof MainExports]).toBeDefined();
            }
        });
    });

    describe('Practical Usage Examples', () => {
        it('should support browser-style usage with core exports', () => {
            const { OnCallPaymentsCalculator, OnCallUser, OnCallPeriod } = CoreExports;
            
            // Simulating browser usage with hardcoded rates
            const calculator = new OnCallPaymentsCalculator(60, 90);
            
            const user = new OnCallUser('browser-user', 'Jane Doe', [
                new OnCallPeriod(
                    new Date('2024-08-01T18:00:00Z'),
                    new Date('2024-08-05T09:00:00Z'),
                    'America/New_York'
                )
            ]);
            
            const amount = calculator.calculateOnCallPayment(user);
            expect(amount).toBeGreaterThan(0);
        });

        it('should support Node.js usage with ConfigLoader', () => {
            const { ConfigLoader, OnCallPaymentsCalculator } = NodeExports;
            
            const loader = new ConfigLoader();
            const rates = loader.loadRates();
            
            const calculator = new OnCallPaymentsCalculator(
                rates.weekdayRate,
                rates.weekendRate
            );
            
            expect(calculator).toBeInstanceOf(OnCallPaymentsCalculator);
        });

        it('should support existing v2.0.x code without changes', () => {
            // This is how v2.0.x users import
            const { ConfigLoader, OnCallPaymentsCalculator } = MainExports;
            
            const loader = new ConfigLoader();
            const rates = loader.loadRates();
            const calculator = new OnCallPaymentsCalculator(rates.weekdayRate, rates.weekendRate);
            
            expect(calculator).toBeInstanceOf(OnCallPaymentsCalculator);
        });
    });
});
