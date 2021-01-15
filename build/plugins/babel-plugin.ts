import type { RollupBabelInputPluginOptions, RollupBabelOutputPluginOptions } from "@rollup/plugin-babel";
import { getBabelInputPlugin, getBabelOutputPlugin } from "@rollup/plugin-babel";
import { isArray, isObject, isString, merge } from "lodash";
import type { InputOptions, OutputOptions } from "rollup";
import type { Mutable } from "type-fest";
import type { BuildVariables, RollerContext, RollerContextData } from "../build-base";
import { RollerPlugin } from "../plugins";

export class BabelPlugin extends RollerPlugin {
    private options!: RollupBabelInputPluginOptions|RollupBabelOutputPluginOptions;
    private onOutput!: boolean;
    private forceEnabled!: boolean;

    enabled(data: RollerContextData): boolean {
        if (this.forceEnabled) {
            return true;
        }

        if (data.input.input) {
            if (isString(data.input.input)) {
                return (/\.jsx?$/u).test(data.input.input);
            }

            if (isArray(data.input.input)) {
                for (const input of data.input.input) {
                    if ((/\.jsx?$/u).test(input)) {
                        return true;
                    }
                }

                return false;
            }

            if (isObject(data.input.input)) {
                for (const path of Object.values(data.input.input)) {
                    if ((/\.jsx?$/u).test(path)) {
                        return true;
                    }
                }

                return false;
            }
        }

        return false;
    }

    prepare(roll: Mutable<RollerContext>, variables: BuildVariables): void {
        this.reset(variables);
        roll.babel = (options, onOutput) => {
            this.options = merge(this.options, options);
            this.onOutput = Boolean(onOutput);
            this.forceEnabled = true;
        };
    }

    input(): InputOptions {
        return this.onOutput ? {} : { plugins: [getBabelInputPlugin(this.options)] };
    }

    output(): OutputOptions {
        return this.onOutput ? { plugins: [getBabelOutputPlugin(this.options)] } : {};
    }

    private reset(variables: BuildVariables): void {
        this.options = ([ "cjs", "esm" ]).includes(variables.target) ?
            {
                presets: ["@babel/preset-env"],
                plugins: [[ "@babel/plugin-transform-runtime", { useESModules: variables.target === "esm" } ]],
            } : {
                presets: ["@babel/preset-env"],
            };

        this.onOutput = false;
        this.forceEnabled = false;
    }
}

declare module "../build-base" {
    export interface RollerContext {
        readonly babel: (options: RollupBabelInputPluginOptions|RollupBabelOutputPluginOptions, onOutput?: boolean) => void;
    }
}
