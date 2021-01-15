import { promises as fs } from "fs";
import path from "path";
import { camelCase, get, size } from "lodash";
import type { SimpleGlobals } from "./build-base";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Target = [ "cjs", "esm", "amd", "umd", "iife" ] as const;
export type Target = typeof Target[number];

export function msg(message: string): string {
    return `[build]: ${message}`;
}

export function makeExternals(globals: SimpleGlobals): string[] {
    return Object.keys(globals);
}

export async function findPackageDotJson(): Promise<string> {
    let at = process.cwd();
    let parts = path.parse(at);
    while (parts.base.length !== 0 && parts.root !== parts.dir) {
        const jsonPath = path.join(at, "package.json");
        try {
            // eslint-disable-next-line no-await-in-loop
            await fs.stat(jsonPath);

            return jsonPath;
        } catch {
            // Ignored...
        }

        at = path.resolve(path.join(at, ".."));
        parts = path.parse(at);
    }

    throw new Error("Missing package.json");
}

export type MinimalPackageDotJson = {
    name?: string;
    typings?: string;
    roller?: {
        name?: string;
        input?: string;
        targets?: { [P in Target]?: string };
    };

    [other: string]: unknown;
};

export type Outputs = { [P in Target]?: string };

export type PackageConfiguration = { name: string; input: string; outputs: Outputs; typings?: string };

function parseValue(value: string, packageInfo: MinimalPackageDotJson): undefined|string {
    return value.startsWith("#") ? get(packageInfo, value.slice(1)) as undefined|string : value;
}

export async function readPackageConfig(): Promise<PackageConfiguration> {
    const jsonPath = await findPackageDotJson();
    const packageInfo = await import(jsonPath) as MinimalPackageDotJson;

    if (!packageInfo.name) {
        throw new Error(msg("Missing name: require('package.json').name'"));
    }

    if (!packageInfo.roller) {
        throw new Error(msg("Missing roller configuration: require('package.json').roller'"));
    }

    if (!packageInfo.roller.input) {
        throw new Error(msg("Missing roller input: require('package.json').roller.input'"));
    }

    const name = packageInfo.roller.name ?
        parseValue(packageInfo.roller.name, packageInfo) || camelCase(packageInfo.name) :
        camelCase(packageInfo.name);

    const input = parseValue(packageInfo.roller.input, packageInfo);
    if (!input) {
        throw new Error(msg(`Input references non-existent package.json value at ${packageInfo.roller.input}`));
    }

    if (!packageInfo.roller.targets) {
        throw new Error(msg("Missing roller targets: require('package.json').roller.targets'"));
    }

    const outputs = {} as Outputs;
    for (const target of Target) {
        const value = packageInfo.roller.targets[target];
        if (value) {
            const outPath = parseValue(value, packageInfo);
            if (outPath) {
                outputs[target] = outPath;
            } else {
                value.startsWith("#") ?
                    console.warn(msg(`Target ${target} references non-existent package.json value at ${value}`)) :
                    console.warn(msg(`Target ${target} specified empty path`));
            }
        }
    }

    if (size(outputs) === 0) {
        throw new Error(msg("No targets specified: require('package.json').roller.targets'"));
    }

    return {
        name,
        input:   packageInfo.roller.input,
        outputs,
        typings: packageInfo.typings,
    };
}
