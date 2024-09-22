"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const KaluzaOnCallPaymentsCalculator_1 = require("../src/KaluzaOnCallPaymentsCalculator");
(0, globals_1.describe)('KaluzaOnCallPaymentsCalculator', () => {
    (0, globals_1.test)('should calculate the payment for an on call user', () => {
        const onCallUser = {
            id: '1',
            name: 'John Doe',
            onCallPeriods: [
                { since: new Date('2021-01-01'), until: new Date('2021-01-02') }
            ]
        };
        const onCallRates = {
            SUNDAY: 75,
            MONDAY: 50,
            TUESDAY: 50,
            WEDNESDAY: 50,
            THURSDAY: 50,
            FRIDAY: 75,
            SATURDAY: 75,
        };
        const calculator = new KaluzaOnCallPaymentsCalculator_1.KaluzaOnCallPaymentsCalculator(onCallRates);
        (0, globals_1.expect)(calculator.calculateOnCallPayment(onCallUser)).toBe(125);
    });
});
