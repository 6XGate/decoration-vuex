import type { InputOptions, OutputOptions, RollupOptions } from "rollup";
import type { BuildVariables, RollerContext, RollerContextData, SimpleGlobals } from "./build-base";

export class RollerPlugin {
    /** Determines whether the plug-in is enabled. */
    // eslint-disable-next-line class-methods-use-this
    enabled(_data: RollerContextData, _vars: BuildVariables): boolean {
        return false;
    }

    /** Prepares the plugin, resetting options, and adding extension methods to the roller context. */
    // eslint-disable-next-line class-methods-use-this
    prepare(_roll: RollerContext, _vars: BuildVariables): void {
        // Does nothing by default.
    }

    /** Defines additional input options to merge. */
    // eslint-disable-next-line class-methods-use-this
    input(): InputOptions {
        // Defines additional input options.
        return { };
    }

    /** Defines additional output options to merge. */
    // eslint-disable-next-line class-methods-use-this
    output(): OutputOptions {
        // Defines additional output options.
        return { };
    }

    /** Defines additional globals to merge. */
    // eslint-disable-next-line class-methods-use-this
    globals(): SimpleGlobals {
        // Defines additional output options.
        return { };
    }

    /** Defines additional rollup configuration options to merge. */
    // eslint-disable-next-line class-methods-use-this
    overrides(): RollupOptions {
        // Defines additional output options.
        return { };
    }
}
