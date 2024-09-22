import {describe, expect, test} from '@jest/globals';
import { KaluzaOnCallPaymentsCalculator } from "../src/KaluzaOnCallPaymentsCalculator";
import { Days } from '../src/Days';

describe('should calculate the payment for an on call user', () => {
    test('- when person continues to be on-call from end of Month to 12th of subsequent month', () => {
        const onCallUser = {
            id: '1',
            name: 'John Doe',
            onCallPeriods: [
                {since: new Date('2024-08-01T00:00:00+01:00'), 
                    until: new Date('2024-08-12T10:00:00+01:00')}
            ]
        };
        const onCallRates: Record<Days, number> = {
            [Days.SUNDAY]: 75,
            [Days.MONDAY]: 50,
            [Days.TUESDAY]: 50,
            [Days.WEDNESDAY]: 50,
            [Days.THURSDAY]: 50,
            [Days.FRIDAY]: 75,
            [Days.SATURDAY]: 75,
        };
        const calculator = new KaluzaOnCallPaymentsCalculator(onCallRates);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(700);
    });

    test('- when person starts to be on-call from start of Month 10am to 12th of that month', () => {
        const onCallUser = {
            id: '1',
            name: 'John Doe',
            onCallPeriods: [
                {since: new Date('2024-08-01T10:00:00+01:00'), 
                    until: new Date('2024-08-12T10:00:00+01:00')}
            ]
        };
        const onCallRates: Record<Days, number> = {
            [Days.SUNDAY]: 75,
            [Days.MONDAY]: 50,
            [Days.TUESDAY]: 50,
            [Days.WEDNESDAY]: 50,
            [Days.THURSDAY]: 50,
            [Days.FRIDAY]: 75,
            [Days.SATURDAY]: 75,
        };
        const calculator = new KaluzaOnCallPaymentsCalculator(onCallRates);
        expect(calculator.calculateOnCallPayment(onCallUser)).toBe(700);
    });
});
