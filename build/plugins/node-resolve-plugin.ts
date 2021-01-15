import type { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import resolve from "@rollup/plugin-node-resolve";
import { merge } from "lodash";
import type { InputOptions } from "rollup";
import type { Mutable } from "type-fest";
import type { RollerContext } from "../build-base";
import { RollerPlugin } from "../plugins";

export class NodeResolvePlugin extends RollerPlugin {
    options!: RollupNodeResolveOptions;

    // eslint-disable-next-line class-methods-use-this
    enabled(): boolean {
        return true;
    }

    prepare(roll: Mutable<RollerContext>): void {
        this.options = {};
        roll.resolve = options => {
            this.options = merge(this.options, options);
        };
    }

    input(): InputOptions {
        return { plugins: [resolve(this.options)] };
    }
}

declare module "../build-base" {
    export interface RollerContext {
        readonly resolve: (options: RollupNodeResolveOptions) => void;
    }
}
