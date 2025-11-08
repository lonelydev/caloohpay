/* eslint-disable security/detect-non-literal-fs-filename -- Test file: all file paths are controlled test fixtures */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader } from '@src/config/ConfigLoader';
import { DEFAULT_RATES } from '@src/config/RatesConfig';

describe('ConfigLoader', () => {
    const testOutputDir = path.join(__dirname, '../test-output');
    const testConfigPath = path.join(testOutputDir, '.caloohpay.json');
    
    beforeEach(() => {
        // Ensure test output directory exists
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }
        
        // Clean up any existing test config
        if (fs.existsSync(testConfigPath)) {
            fs.unlinkSync(testConfigPath);
        }
    });

    afterEach(() => {
        // Clean up test config
        if (fs.existsSync(testConfigPath)) {
            fs.unlinkSync(testConfigPath);
        }
    });

    describe('loadRates', () => {
        it('should return default rates when no config file exists', () => {
            const loader = new ConfigLoader();
            const rates = loader.loadRates();

            expect(rates).toEqual(DEFAULT_RATES);
            expect(rates.weekdayRate).toBe(50);
            expect(rates.weekendRate).toBe(75);
            expect(rates.currency).toBe('GBP');
        });

        it('should load custom rates from config file', () => {
            // Create a test config file
            const config = {
                rates: {
                    weekdayRate: 60,
                    weekendRate: 90,
                    currency: 'USD'
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            // Mock process.cwd() to return test directory
            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                const rates = loader.loadRates();

                expect(rates.weekdayRate).toBe(60);
                expect(rates.weekendRate).toBe(90);
                expect(rates.currency).toBe('USD');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should use default currency when not specified in config', () => {
            const config = {
                rates: {
                    weekdayRate: 100,
                    weekendRate: 150
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                const rates = loader.loadRates();

                expect(rates.weekdayRate).toBe(100);
                expect(rates.weekendRate).toBe(150);
                expect(rates.currency).toBe('GBP'); // Default currency
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should fallback to defaults when config file has invalid JSON', () => {
            // Create invalid JSON file
            fs.writeFileSync(testConfigPath, '{ invalid json');

            const originalCwd = process.cwd;
            const originalWarn = console.warn;
            const warnings: string[] = [];
            console.warn = (...args: unknown[]) => warnings.push(args.join(' '));
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                const rates = loader.loadRates();

                expect(rates).toEqual(DEFAULT_RATES);
                expect(warnings.length).toBeGreaterThan(0);
                expect(warnings[0]).toContain('Failed to load config');
            } finally {
                process.cwd = originalCwd;
                console.warn = originalWarn;
            }
        });

        it('should throw error when rates object is missing', () => {
            const config = {
                // Missing rates object
                otherProperty: 'value'
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                expect(() => loader.loadRates()).toThrow('Config file must contain a "rates" object');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should throw error when weekdayRate is missing', () => {
            const config = {
                rates: {
                    // Missing weekdayRate
                    weekendRate: 75
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                expect(() => loader.loadRates()).toThrow('rates.weekdayRate is required');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should throw error when weekendRate is missing', () => {
            const config = {
                rates: {
                    weekdayRate: 50
                    // Missing weekendRate
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                expect(() => loader.loadRates()).toThrow('rates.weekendRate is required');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should throw error when weekdayRate is not a positive number', () => {
            const config = {
                rates: {
                    weekdayRate: -50,
                    weekendRate: 75
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                expect(() => loader.loadRates()).toThrow('rates.weekdayRate must be a positive number');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should throw error when weekendRate is not a positive number', () => {
            const config = {
                rates: {
                    weekdayRate: 50,
                    weekendRate: 0
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                expect(() => loader.loadRates()).toThrow('rates.weekendRate must be a positive number');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should throw error when weekdayRate is not a number', () => {
            const config = {
                rates: {
                    weekdayRate: 'not-a-number' as unknown as number,
                    weekendRate: 75
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                expect(() => loader.loadRates()).toThrow('rates.weekdayRate must be a valid number');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should throw error when currency is empty string', () => {
            const config = {
                rates: {
                    weekdayRate: 50,
                    weekendRate: 75,
                    currency: ''
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                expect(() => loader.loadRates()).toThrow('rates.currency cannot be empty');
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should accept various currency codes', () => {
            const currencies = ['GBP', 'USD', 'EUR', 'JPY', 'AUD', 'CAD'];

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                for (const currency of currencies) {
                    const config = {
                        rates: {
                            weekdayRate: 50,
                            weekendRate: 75,
                            currency
                        }
                    };
                    fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

                    const loader = new ConfigLoader();
                    const rates = loader.loadRates();

                    expect(rates.currency).toBe(currency);
                }
            } finally {
                process.cwd = originalCwd;
            }
        });

        it('should handle fractional rates correctly', () => {
            const config = {
                rates: {
                    weekdayRate: 52.50,
                    weekendRate: 78.75,
                    currency: 'GBP'
                }
            };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

            const originalCwd = process.cwd;
            process.cwd = () => testOutputDir;

            try {
                const loader = new ConfigLoader();
                const rates = loader.loadRates();

                expect(rates.weekdayRate).toBe(52.50);
                expect(rates.weekendRate).toBe(78.75);
            } finally {
                process.cwd = originalCwd;
            }
        });
    });
});
