import type { InputOptions, OutputOptions, RollupOptions } from "rollup";
import type { MergeStrategies } from "./merge";
import { ignore, mergeInput, mergeMaybeArray, replace } from "./merge";

export type Configuration = "dev" | "prod";
export type Target = "cjs" | "esm" | "amd" | "umd" | "iife";
export type BuildVariables = {
    configuration: Configuration;
    target: Target;
    env: typeof process.env;
    name: string;
    inPath: string;
    outPath: string;
    typings?: string;
};

export type SimpleGlobals = { [library: string]: string };

export interface RollerContextBase {
    readonly globals: (globals: SimpleGlobals) => void;
    readonly input: (input: InputOptions) => void;
    readonly output: (output: OutputOptions) => void;
    readonly override: (overrides: RollupOptions) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RollerContext extends RollerContextBase {
    // Empty for extension.
}

export interface RollerContextData {
    input: InputOptions;
    output: OutputOptions;
    globals: SimpleGlobals;
    overrides: RollupOptions;
}

/** The merge strategies for the output configuration. Anything not listed is automatically `ignore`. */
export const outputStrategies: MergeStrategies = {
    // ### Core functionality
    dir:     replace,
    file:    replace,
    format:  replace,
    globals: ignore,
    name:    replace,
    plugins: mergeMaybeArray,

    // ### Advanced functionality
    assetFileNames:          replace,
    banner:                  replace,
    footer:                  replace,
    chunkFileNames:          replace,
    compact:                 replace,
    entryFileNames:          replace,
    extend:                  replace,
    hoistTransitiveImports:  replace,
    inlineDynamicImports:    replace,
    interop:                 replace,
    intro:                   replace,
    outro:                   replace,
    manualChunks:            replace,
    minifyInternalExports:   replace,
    paths:                   replace,
    preserveModules:         replace,
    preserveModulesRoot:     replace,
    sourcemap:               ignore,
    sourcemapExcludeSources: replace,
    sourcemapFile:           replace,
    sourcemapPathTransform:  replace,

    // ### Danger zone
    exports: replace,
};

/** The merge strategies for input configuration. Anything not listed is automatically `ignore`. */
export const inputStrategies: MergeStrategies = {
    // ### Core functionality
    external: ignore,
    input:    mergeInput,
    plugins:  mergeMaybeArray,

    // ### Advanced functionality
    onwarn:                  replace,
    preserveEntrySignatures: replace,
    strictDeprecations:      replace,
};

/** The merge strategies for roller configuration. Anything not listed is automatically `ignore`. */
export const coreStrategies: MergeStrategies = {
    ...inputStrategies,
    output: outputStrategies,
};
