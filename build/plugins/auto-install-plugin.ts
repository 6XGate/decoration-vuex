import type { RollupAutoInstallOptions } from "@rollup/plugin-auto-install";
import auto from "@rollup/plugin-auto-install";
import { merge } from "lodash";
import type { InputOptions } from "rollup";
import type { Mutable } from "type-fest";
import type { RollerContext } from "../build-base";
import { RollerPlugin } from "../plugins";

export class AutoInstallPlugin extends RollerPlugin {
    isEnabled!: boolean;
    options!: RollupAutoInstallOptions;

    enabled(): boolean {
        return this.isEnabled;
    }

    prepare(roll: Mutable<RollerContext>): void {
        this.reset();
        roll.autoInstall = options => {
            this.isEnabled = true;
            this.options = merge(this.options, options);
        };
    }

    input(): InputOptions {
        return { plugins: [auto(this.options)] };
    }

    private reset(): void {
        this.isEnabled = false;
        this.options = {};
    }
}

declare module "../build-base" {
    export interface RollerContext {
        readonly autoInstall: (options: RollupAutoInstallOptions) => void;
    }
}
