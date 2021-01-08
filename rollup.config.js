import path from "path";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import { makeExternals, msg } from "./build/utilities";
import pkg from "./package.json";

/** @type {"prod"|"dev"} */
const target = process.env.TARGET || "dev";

const globals = {
    "lodash":              "_",
    "vue":                 "Vue",
    "vue-class-component": "VueClassComponent",
    "vuex":                "Vuex",
};

/** @type {{ cjs: import('rollup').OutputOptions, esm: import('rollup').OutputOptions }} */
const outputs = {
    cjs: {
        dir:            path.dirname(pkg.main),
        entryFileNames: path.basename(pkg.main),
        format:         "commonjs",
        sourcemap:      true,
    },
    esm: {
        dir:            path.dirname(pkg.module),
        entryFileNames: path.basename(pkg.module),
        format:         "esm",
        sourcemap:      true,
    },
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
    output: [ outputs.cjs, outputs.esm ],
};

const targets = {
    dev: () => {

    },
    prod: () => {
        outputs.cjs.plugins = [ ...(outputs.cjs.plugins || []), terser() ];
        outputs.esm.plugins = [ ...(outputs.esm.plugins || []), terser() ];
    },
};

if (target in targets) {
    targets[target]();
} else {
    throw new Error(msg(`Build target ${target} does not exist`));
}

// noinspection JSUnusedGlobalSymbols
export default rollupConfig;
