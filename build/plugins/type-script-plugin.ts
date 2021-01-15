import type { RollupTypescriptOptions } from "@rollup/plugin-typescript";
import typescript from "@rollup/plugin-typescript";
import { isArray, isObject, isString, merge } from "lodash";
import type { InputOptions } from "rollup";
import type { Mutable } from "type-fest";
import type { RollerContext, RollerContextData } from "../build-base";
import { RollerPlugin } from "../plugins";

export class TypeScriptPlugin extends RollerPlugin {
    private options!: RollupTypescriptOptions;

    // eslint-disable-next-line class-methods-use-this
    enabled(data: RollerContextData): boolean {
        if (data.input.input) {
            if (isString(data.input.input)) {
                return (/\.tsx?$/u).test(data.input.input);
            }

            if (isArray(data.input.input)) {
                for (const input of data.input.input) {
                    if ((/\.tsx?$/u).test(input)) {
                        return true;
                    }
                }

                return false;
            }

            if (isObject(data.input.input)) {
                for (const path of Object.values(data.input.input)) {
                    if ((/\.tsx?$/u).test(path)) {
                        return true;
                    }
                }

                return false;
            }
        }

        return false;
    }

    prepare(roll: Mutable<RollerContext>): void {
        this.reset();
        roll.typescript = options => {
            this.options = merge(this.options, options);
        };
    }

    input(): InputOptions {
        return { plugins: [typescript(this.options)] };
    }

    private reset(): void {
        this.options = {
            module:        "esnext",
            target:        "es2015",
            noEmitOnError: true,
        };
    }
}

declare module "../build-base" {
    export interface RollerContext {
        readonly typescript: (options: RollupTypescriptOptions) => void;
    }
}
