import type { RollupAliasOptions } from "@rollup/plugin-alias";
import alias from "@rollup/plugin-alias";
import { merge } from "lodash";
import type { InputOptions } from "rollup";
import type { Mutable } from "type-fest";
import type { RollerContext } from "../build-base";
import { RollerPlugin } from "../plugins";

type AliasEntries = Required<RollupAliasOptions>["entries"];

export class AliasPlugin extends RollerPlugin {
    private options!: RollupAliasOptions;
    private entries!: null|AliasEntries;
    private isEnabled!: boolean;

    enabled(): boolean {
        return this.isEnabled;
    }

    prepare(roll: Mutable<RollerContext>): void {
        this.reset();
        roll.alias = (entries, options) => {
            this.options = merge(this.options, options);
            this.entries = entries;
            this.isEnabled = true;
        };
    }

    input(): InputOptions {
        const options = this.entries ? { ...this.options, entries: this.entries } : this.options;

        return { plugins: [alias(options)] };
    }

    private reset(): void {
        this.options = {};
        this.entries = null;
        this.isEnabled = false;
    }
}

declare module "../build-base" {
    export interface RollerContext {
        readonly alias: (entries: AliasEntries, options?: RollupAliasOptions) => void;
    }
}
