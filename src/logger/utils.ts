import { CommandLineOptions } from '../CommandLineOptions';

/**
 * Masks sensitive API key in CLI options before logging.
 * 
 * @param cliOptions - The command line options to mask
 * @returns A copy of the options with the API key masked as '****'
 * 
 * @remarks
 * Creates a shallow copy to avoid mutating the original options.
 * Only masks the key if it exists.
 */
export function maskCliOptions(cliOptions: CommandLineOptions): CommandLineOptions {
    const cloned = { ...cliOptions };
    if (cloned.key) {
        cloned.key = '****';
    }
    return cloned;
}
