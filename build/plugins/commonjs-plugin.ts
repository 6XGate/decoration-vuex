import type { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import commonjs from "@rollup/plugin-commonjs";
import { merge } from "lodash";
import type { InputOptions } from "rollup";
import type { Mutable } from "type-fest";
import type { RollerContext } from "../build-base";
import { RollerPlugin } from "../plugins";

export class CommonjsPlugin extends RollerPlugin {
    options!: RollupCommonJSOptions;

    // eslint-disable-next-line class-methods-use-this
    enabled(): boolean {
        return true;
    }

    prepare(roll: Mutable<RollerContext>): void {
        this.options = {};
        roll.commonJs = options => {
            this.options = merge(this.options, options);
        };
    }

    input(): InputOptions {
        return { plugins: [commonjs(this.options)] };
    }
}

declare module "../build-base" {
    export interface RollerContext {
        readonly commonJs: (options: RollupCommonJSOptions) => void;
    }
}
