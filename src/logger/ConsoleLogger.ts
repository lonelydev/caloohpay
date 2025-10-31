import { Logger } from './Logger';

export class ConsoleLogger implements Logger {
    info(message: string, meta?: Record<string, unknown>): void {
        if (meta) {
            console.log(message, meta);
        } else {
            console.log(message);
        }
    }
    warn(message: string, meta?: Record<string, unknown>): void {
        if (meta) {
            console.warn(message, meta);
        } else {
            console.warn(message);
        }
    }
    error(message: string | Error, meta?: Record<string, unknown>): void {
        if (message instanceof Error) {
            console.error(message.stack || message.message);
        } else {
            if (meta) {
                console.error(message, meta);
            } else {
                console.error(message);
            }
        }
    }
    debug(message: string, meta?: Record<string, unknown>): void {
        if (meta) {
            console.debug(message, meta);
        } else {
            console.debug(message);
        }
    }
    table(data: unknown): void {
        // console.table can throw on some objects; guard it
        try {
            // eslint-disable-next-line no-console
            console.table(data as any);
        } catch (err) {
            // fallback to logging the object
            console.log(data);
        }
    }
}
