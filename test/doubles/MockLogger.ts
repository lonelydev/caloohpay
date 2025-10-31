import { Logger } from '../../src/logger/Logger';

export class MockLogger implements Logger {
    public infos: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    public warns: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    public errors: Array<{ message: string | Error; meta?: Record<string, unknown> }> = [];
    public debugs: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    public tables: any[] = [];

    info(message: string, meta?: Record<string, unknown>): void {
        this.infos.push({ message, meta });
    }
    warn(message: string, meta?: Record<string, unknown>): void {
        this.warns.push({ message, meta });
    }
    error(message: string | Error, meta?: Record<string, unknown>): void {
        this.errors.push({ message, meta });
    }
    debug(message: string, meta?: Record<string, unknown>): void {
        this.debugs.push({ message, meta });
    }
    table(data: unknown): void {
        this.tables.push(data);
    }
}
