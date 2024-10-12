import {describe, expect, test} from '@jest/globals';
import { KaluzaOnCallPaymentsCalculator } from "../src/KaluzaOnCallPaymentsCalculator";
import { Days } from '../src/Days';
import { OnCallPeriod } from '../src/OnCallPeriod';

describe('should be able to initialise OnCallPeriod', () => {
    test('- when OnCallPeriod is initialised', () => {
        const onCallPeriod = new OnCallPeriod(new Date('2024-08-01T00:00:00+01:00'), new Date('2024-08-12T10:00:00+01:00'));
        expect(onCallPeriod.since).toStrictEqual(new Date('2024-08-01T00:00:00+01:00'));
        expect(onCallPeriod.until).toStrictEqual(new Date('2024-08-12T10:00:00+01:00'));
    });
})

describe('should calculate the payment for an on call user', () => {
    
    const onCallRates: number[] = [
        75,
        50,
        50,
        50,
        50,
        75,
        75
    ];
    test('- when person continues to be on-call from end of Month to 12th of subsequent month', () => {
        const onCallUser = {
            id: '1',
            name: 'John Doe',
            onCallPeriods: [
                new OnCallPeriod(new Date('2024-08-01T00:00:00+01:00'), new Date('2024-08-12T10:00:00+01:00'))
            ]
        };
        
        const calculator = new KaluzaOnCallPaymentsCalculator(onCallRates);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(700);
    });

    test('- when person starts to be on-call from start of Month 10am to 12th of that month', () => {
        const onCallUser = {
            id: '1',
            name: 'John Doe',
            onCallPeriods: [
                new OnCallPeriod(new Date('2024-08-01T10:00:00+01:00'), 
                        new Date('2024-08-12T10:00:00+01:00'))
            ]
        };
        
        const calculator = new KaluzaOnCallPaymentsCalculator(onCallRates);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(700);
    });

    test('- when person starts to be on-call from middle of Month 10am to end of that month', () => {
        const onCallUser = {
            id: '1',
            name: 'John Doe',
            onCallPeriods: [
                new OnCallPeriod(new Date('2024-08-28T10:00:00+01:00'), new Date('2024-08-31T23:59:59+01:00'))
            ]
        };
        
        const calculator = new KaluzaOnCallPaymentsCalculator(onCallRates);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(250);
    });

    test('- when multiple people are on-call from start of Month 10am to end of that month', () => {
        const onCallUsers = [
            {
                id: '1PF7DNAV',
                name: 'YW Oncall',
                onCallPeriods: [
                    new OnCallPeriod(new Date('2024-08-01T00:00:00+01:00'), new Date('2024-08-06T10:00:00+01:00')),
                    new OnCallPeriod(new Date('2024-08-28T10:00:00+01:00'), new Date('2024-09-01T00:00:00+01:00'))
                ]
            },
            {
                id: 'PGO3DTM',
                name: 'SK Oncall',
                onCallPeriods: [
                    new OnCallPeriod(new Date('2024-08-06T10:00:00+01:00'), 
                            new Date('2024-08-15T10:00:00+01:00')),
                        new OnCallPeriod(new Date('2024-08-16T10:00:00+01:00'), 
                            new Date('2024-08-21T10:00:00+01:00'))
                ]
            },
            {
                id: 'PINI77A',
                name: 'EG Oncall',
                onCallPeriods: [
                    new OnCallPeriod(new Date('2024-08-15T00:00:00+01:00'), 
                        new Date('2024-08-16T10:00:00+01:00'))
                ]
            },
            {
                id: 'PJXZDBT',
                name: 'CE Oncall',
                onCallPeriods: [
                    new OnCallPeriod(new Date('2024-08-21T10:00:00+01:00'), new Date('2024-08-28T10:00:00+01:00'))
                ]
            }
        ];
        
        const calculator = new KaluzaOnCallPaymentsCalculator(onCallRates);
        expect(calculator.calculateOnCallPayments(onCallUsers)).toStrictEqual({
            "1PF7DNAV": 575,
            "PGO3DTM": 850,
            "PINI77A": 50,
            "PJXZDBT": 425,
        });
    });
});
