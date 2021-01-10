export type SimpleGlobals = { [library: string]: string };

export function msg(message: string): string {
    return `[build]: ${message}`;
}

export function makeExternals(globals: SimpleGlobals): string[] {
    return Object.keys(globals);
}
