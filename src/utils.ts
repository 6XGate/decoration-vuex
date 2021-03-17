
// eslint-disable-next-line @typescript-eslint/unbound-method
export const hasOwnProperty = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty) as
    // eslint-disable-next-line @typescript-eslint/ban-types
    (target: Object, key: PropertyKey) => boolean;

export function msg(message: string): string {
    return `[decoration-vuex]: ${message}`;
}

/** Gets the value of a property by a dot notated path, not supporting array indexers. */
export function getByPath(value: unknown, path: string, defaultValue?: unknown): unknown {
    return path.split(".").filter(Boolean).reduce((previous, key) => {
        try {
            const next = (previous as Record<string, unknown>)[key];

            return next !== undefined && next !== null ? next : defaultValue;
        } catch {
            return defaultValue;
        }
    }, value);
}
