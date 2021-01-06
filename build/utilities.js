/**
 * @param {string} message
 * @returns {string}
 */
export function msg(message) {
    return `[build]: ${message}`;
}

/**
 * Converts the `globals` to `external`.
 * @param {import('rollup').GlobalsOption} globals
 * @returns {string[]}
 */
export function makeExternals(globals) {
    return Object.keys(globals);
}
