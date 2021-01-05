import path from "path";
import typescript from "@rollup/plugin-typescript";
import { makeExternals, msg } from "./build/utilities";
import pkg from "./package.json";

/** @type {"prod"|"dev"} */
const target = process.env.TARGET || "dev";

const globals = {
    "lodash": "_",
    "vuex":   "Vuex",
    "vue":    "Vue",
};

/** @type {import('rollup').RollupOptions} */
const rollupConfig = {
    input:    "src/index.ts",
    external: makeExternals(globals),
    plugins:  [
        typescript({
            module:         "esnext",
            target:         "es2015",
            noEmitOnError:  true,
            declaration:    true,
            declarationDir: path.dirname(pkg.typings),
            outDir:         "./dist/",
            rootDir:        "./src/",
            include:        ["./src/**/*.ts"],
        }),
    ],
    output: [
        {
            dir:            path.dirname(pkg.main),
            entryFileNames: path.basename(pkg.main),
            format:         "commonjs",
            sourcemap:      true,
        },
        {
            dir:            path.dirname(pkg.module),
            entryFileNames: path.basename(pkg.module),
            format:         "esm",
            sourcemap:      true,
        },
    ],
};

const targets = {
    dev: () => {

    },
    prod: () => {

    },
};

if (target in targets) {
    targets[target]();
} else {
    throw new Error(msg(`Build target ${target} does not exist`));
}

export default rollupConfig;
