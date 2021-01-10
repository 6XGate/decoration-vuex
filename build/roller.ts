import type { InputOptions, OutputOptions, RollupOptions } from "rollup";
import type { MergeStrategies } from "./merge";
import { ignore, merge, mergeInput, mergeMaybeArray, replace } from "./merge";
import type { SimpleGlobals } from "./utils";
import { makeExternals, msg } from "./utils";

export type Targets = "dev" | "prod";
export type Configuration = { target: Targets; build: string };
export type Conditional = (config: Configuration) => boolean;
export type GlobalsCallback = () => SimpleGlobals;
export type InputCallback = () => InputOptions;
export type OutputCallback = () => OutputOptions;
export type OverrideCallback = () => RollupOptions;

/** Contains the merge strategy for roller configuration. Anything not listed is automatically `ignore`. */
const coreStrategies: MergeStrategies = {
    external: ignore,
    input:    mergeInput,
    plugins:  mergeMaybeArray,
    onwarn:   replace,
    output:   {
        dir:                     replace,
        file:                    replace,
        format:                  replace,
        globals:                 ignore,
        name:                    replace,
        plugins:                 mergeMaybeArray,
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
    },
    preserveEntrySignatures: replace,
    strictDeprecations:      replace,
};

/** Roller configuration context */
class RollerContext {
    globals: SimpleGlobals;
    config: RollupOptions;

    constructor() {
        this.globals = {};
        this.config = { output: { sourcemap: true } };
    }

    merge(data: RollupOptions): this {
        merge(coreStrategies, this.config, data);

        return this;
    }
}

/** Rollup configuration builder */
export default class Roller {
    private readonly configurations: Configuration[];
    private readonly target = (process.env.TARGET || "dev") as Targets;
    private readonly builds = new Map<string, Set<string>>();
    private readonly globalsCallbacks = new Map<Conditional, GlobalsCallback>();
    private readonly inputCallbacks = new Map<Conditional, InputCallback>();
    private readonly outputCallbacks = new Map<Conditional, OutputCallback>();
    private readonly overrideCallbacks = new Map<Conditional, OverrideCallback>();

    constructor(configurations: Configuration[]) {
        this.configurations = configurations;

        this.generateBuildSets();
    }

    globals(condition: Conditional, globals: GlobalsCallback): this {
        this.globalsCallbacks.set(condition, globals);

        return this;
    }

    input(condition: Conditional, input: InputCallback): this {
        this.inputCallbacks.set(condition, input);

        return this;
    }

    output(condition: Conditional, output: OutputCallback): this {
        this.outputCallbacks.set(condition, output);

        return this;
    }

    override(condition: Conditional, override: OverrideCallback): this {
        this.overrideCallbacks.set(condition, override);

        return this;
    }

    build(): RollupOptions[] {
        const builds = this.builds.get(this.target) || null;
        if (builds === null || builds.size === 0) {
            throw new Error(msg(`Nothing configured for ${this.target}`));
        }

        /** @type {RollerContext[]} */
        const contexts = [];
        for (const build of builds) {
            const context = new RollerContext();
            const config = { target: this.target, build };

            for (const [ condition, callback ] of this.globalsCallbacks) {
                if (condition(config)) {
                    context.globals = { ...context.globals, ...callback() };
                }
            }

            for (const [ condition, callback ] of this.inputCallbacks) {
                if (condition(config)) {
                    context.merge(callback());
                }
            }

            for (const [ condition, callback ] of this.outputCallbacks) {
                if (condition(config)) {
                    context.merge({ output: callback() });
                }
            }

            for (const [ condition, callback ] of this.overrideCallbacks) {
                if (condition(config)) {
                    context.merge(callback());
                }
            }

            context.config.external = makeExternals(context.globals);

            if (context.config.output) {
                if (Array.isArray(context.config.output)) {
                    throw new Error("Not expecting options to be an array");
                }

                if (context.config.output.format === "umd" || context.config.output.format === "iife") {
                    context.config.output.globals = { ...context.globals };
                }
            }

            contexts.push(context);
        }

        return contexts.map(context => context.config);
    }

    private generateBuildSets(): void {
        for (const config of this.configurations) {
            const builds = this.getBuildSet(config);

            builds.add(config.build);
        }
    }

    private getBuildSet(config: Configuration): Set<string> {
        const set = this.builds.get(config.target) || null;
        if (set !== null) {
            return set;
        }

        const newSet = new Set<string>();
        this.builds.set(config.target, newSet);

        return newSet;
    }
}
