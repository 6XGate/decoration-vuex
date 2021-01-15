import type { RollupOptions } from "rollup";
import type { ReadonlyDeep } from "type-fest";
import type {
    BuildVariables,
    Configuration,
    RollerContext,
    RollerContextData,
    Target,
    RollerContextBase,
} from "./build-base";
import { coreStrategies, inputStrategies, outputStrategies } from "./build-base";
import { merge } from "./merge";
import type { RollerPlugin } from "./plugins";
import { defaultPlugins } from "./plugins/builtin-plugins";
import { makeExternals, readPackageConfig } from "./utils";

export type { BuildVariables, Configuration, RollerContext, RollerContextData, Target } from "./build-base";
export { RollerPlugin } from "./plugins";

function makeDefaultContextData(variables: BuildVariables): RollerContextData {
    return {
        input: {
            input: variables.inPath,
        },
        output: {
            name:      variables.name,
            file:      variables.outPath,
            sourcemap: true,
            format:    variables.target,
        },
        globals:   { },
        overrides: { },
    };
}

function makeContext(data: RollerContextData): RollerContextBase {
    return {
        globals: globals => {
            data.globals = { ...data.globals, ...globals };
        },
        input: input => {
            merge(inputStrategies, data.input, input);
        },
        output: output => {
            merge(outputStrategies, data.output, output);
            if (output.dir) {
                delete data.output.file;
            }
        },
        override: overrides => {
            merge(coreStrategies, data.overrides, overrides);
        },
    };
}

export type BuildConfiguration = (variables: ReadonlyDeep<BuildVariables>, roll: RollerContext) => void;

interface Roller {
    (config: BuildConfiguration): Promise<RollupOptions[]>;
    extend: (plugin: RollerPlugin) => void;
}

/** Plug-in registry, with defaults. */
// NOTE: This order is important.
const plugins: RollerPlugin[] = [...defaultPlugins];

const roller: Roller = async (config: BuildConfiguration): Promise<RollupOptions[]> => {
    const pkgConfig = await readPackageConfig();

    const results: RollerContextData[] = [];
    for (const [ target, outPath ] of Object.entries(pkgConfig.outputs) as [ Target, string ][]) {
        const variables: ReadonlyDeep<BuildVariables> = Object.freeze({
            configuration: (process.env.CONFIGURATION || "dev") as Configuration,
            target,
            env:           process.env,
            name:          pkgConfig.name,
            inPath:        pkgConfig.input,
            outPath,
            typings:       pkgConfig.typings,
        });

        const data = makeDefaultContextData(variables);
        const context = makeContext(data) as RollerContext;
        for (const plugin of plugins) {
            plugin.prepare(context, variables);
        }

        config(variables, context);

        for (const plugin of plugins) {
            if (plugin.enabled(data, variables)) {
                data.globals = { ...data.globals, ...plugin.globals() };
                data.input = merge(inputStrategies, data.input, plugin.input());
                data.output = merge(outputStrategies, data.output, plugin.output());
                data.overrides = merge(coreStrategies, data.overrides, plugin.overrides());
            }
        }

        if (data.output.format === "umd" || data.output.format === "iife") {
            data.output.globals = { ...data.globals };
        }

        data.input.external = makeExternals(data.globals);
        results.push(data);
    }

    return results.map(result => merge(coreStrategies, { ...result.input, output: result.output }, result.overrides));
};

roller.extend = plugin => plugins.push(plugin);

export default roller;
