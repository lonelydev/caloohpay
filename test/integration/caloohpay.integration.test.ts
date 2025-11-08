import * as fs from 'fs';
import * as path from 'path';

import * as pdjs from '@pagerduty/pdjs';

import { calOohPay } from '@src/CalOohPay';
import { MockLogger } from '../doubles/MockLogger';
import { jest, describe, beforeAll, beforeEach, afterEach, afterAll, it, expect } from '@jest/globals';

const mockPagerDutyResponse = (scheduleId: string) => ({
    data: {
        schedule: {
            name: `Test Schedule ${scheduleId}`,
            html_url: `https://pagerduty.test/schedules/${scheduleId}`,
            time_zone: 'Europe/London',
            final_schedule: {
                name: 'Layer 1',
                rendered_schedule_entries: [
                    {
                        start: new Date('2024-08-01T18:00:00Z'),
                        end: new Date('2024-08-02T09:00:00Z'),
                        user: { id: 'P1', summary: 'Alice' }
                    },
                    {
                        start: new Date('2024-08-03T18:00:00Z'),
                        end: new Date('2024-08-04T09:00:00Z'),
                        user: { id: 'P2', summary: 'Bob' }
                    }
                ]
            }
        }
    }
});

const createMockApi = (): ReturnType<typeof pdjs.api> => ({
    get: async (url: string) => {
        const scheduleId = url.split('/').pop() ?? 'UNKNOWN';
        return mockPagerDutyResponse(scheduleId);
    }
    // Other HTTP verbs are unused in tests but required by the type
    // signature, so provide no-op stubs via type coercion below.
} as unknown as ReturnType<typeof pdjs.api>);

describe('calOohPay integration (mocked PagerDuty)', () => {
    const outDir = path.join(__dirname, '..', 'test-output');
    const outFile = path.join(outDir, 'integration-output.csv');
    let apiSpy: jest.SpiedFunction<typeof pdjs.api>;

    beforeAll(() => {
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    });
    beforeEach(() => {
        apiSpy = jest.spyOn(pdjs, 'api').mockImplementation(() => createMockApi());
    });
    afterEach(() => {
        apiSpy.mockRestore();
        if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('generates CSV and logs schedule info', async () => {
    const logger = new MockLogger();
        await calOohPay({
            rotaIds: 'SCHED1',
            since: '2024-08-01T00:00:00Z',
            until: '2024-08-31T23:59:59Z',
            timeZoneId: undefined,
            key: 'fake-key-1234567890123456789',
            outputFile: outFile,
            help: false,
        }, logger);

        // CSV file should exist and contain schedule name
        expect(fs.existsSync(outFile)).toBe(true);
        const contents = fs.readFileSync(outFile, 'utf8');
        expect(contents).toContain('Test Schedule SCHED1');

        // Logger should have recorded schedule info
        const found = logger.infos.find((entry) =>
            String(entry.message).includes('Schedule name')
        );
        expect(found).toBeDefined();
    });

    it('handles multiple schedules and appends sections for subsequent schedules', async () => {
    const logger = new MockLogger();
        const multiOutFile = path.join(outDir, 'integration-multi-output.csv');
        if (fs.existsSync(multiOutFile)) fs.unlinkSync(multiOutFile);

        await calOohPay({
            rotaIds: 'SCHED1,SCHED2',
            since: '2024-08-01T00:00:00Z',
            until: '2024-08-31T23:59:59Z',
            timeZoneId: undefined,
            key: 'fake-key-1234567890123456789',
            outputFile: multiOutFile,
            help: false,
        }, logger);

        expect(fs.existsSync(multiOutFile)).toBe(true);
        const contents = fs.readFileSync(multiOutFile, 'utf8');
        // Should contain two schedule name entries
        const scheduleNameCount = (contents.match(/Schedule name:,Test Schedule/g) || []).length;
        expect(scheduleNameCount).toBe(2);

        // Header row should appear twice (one per schedule section)
        const headerCount = (contents.match(/User,Total Compensation/g) || []).length;
        expect(headerCount).toBe(2);

        // Clean up
        fs.unlinkSync(multiOutFile);
    });
});
