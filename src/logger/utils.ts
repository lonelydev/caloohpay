import { CommandLineOptions } from '../../src/CommandLineOptions';

export function maskCliOptions(cliOptions: CommandLineOptions): CommandLineOptions {
    const cloned = { ...cliOptions } as CommandLineOptions;
    if ((cloned as any).key) {
        (cloned as any).key = '****';
    }
    return cloned;
}
