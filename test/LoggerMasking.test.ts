import type { CommandLineOptions } from '@src/CommandLineOptions';
import { maskCliOptions } from '@src/logger/utils';

describe('maskCliOptions', () => {
    it('masks key when present', () => {
        const opts: CommandLineOptions = { rotaIds: 'P1', key: 'secret', since: '2020-01-01', until: '2020-01-02' };
        const masked = maskCliOptions(opts);
        expect(masked.key).toBe('****');
        expect(masked.rotaIds).toBe('P1');
    });
    it('does not modify when no key', () => {
        const opts: CommandLineOptions = { rotaIds: 'P1', since: '2020-01-01', until: '2020-01-02' };
        const masked = maskCliOptions(opts);
        expect(masked.key).toBeUndefined();
    });
});
