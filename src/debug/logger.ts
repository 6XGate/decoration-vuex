/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Logger {
    assert(condition?: boolean, ...data: any[]): void;
    count(label?: string): void;
    countReset(label?: string): void;
    debug(...data: any[]): void;
    error(...data: any[]): void;
    info(...data: any[]): void;
    log(...data: any[]): void;
    table(tabularData?: any, properties?: string[]): void;
    trace(...data: any[]): void;
    warn(...data: any[]): void;
}

let logger: Logger = console;

export function getLogger(): Logger {
    return logger;
}

export function setLogger(newLogger: Logger): Logger {
    const original = logger;
    logger = newLogger;

    return original;
}
