import { merge } from "lodash";
import type { OutputOptions } from "rollup";
import type { Options } from "rollup-plugin-terser";
import { terser } from "rollup-plugin-terser";
import type { Mutable } from "type-fest";
import type { BuildVariables, RollerContext, RollerContextData } from "../build-base";
import { RollerPlugin } from "../plugins";

export class TerserPlugin extends RollerPlugin {
    private options!: Options;
    private forceEnabled!: boolean;

    enabled(_data: RollerContextData, variables: BuildVariables): boolean {
        return variables.configuration === "prod" || this.forceEnabled;
    }

    prepare(roll: Mutable<RollerContext>): void {
        this.reset();
        roll.tenser = options => {
            this.options = merge(this.options, options);
            this.forceEnabled = true;
        };
    }

    output(): OutputOptions {
        return { plugins: [terser(this.options)] };
    }

    private reset(): void {
        this.options = {};
        this.forceEnabled = false;
    }
}

declare module "../build-base" {
    export interface RollerContext {
        readonly tenser: (options: Options) => void;
    }
}
