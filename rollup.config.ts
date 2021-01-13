import path from "path";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import Roller from "./build/roller";
import pkg from "./package.json";

const roller = new Roller([
    { target: "dev", build: "cjs" },
    { target: "dev", build: "esm" },
    { target: "dev", build: "iife" },
    { target: "prod", build: "cjs" },
    { target: "prod", build: "esm" },
    { target: "prod", build: "iife" },
]);

// ### Common
roller.globals(() => true, () => ({
    "lodash":              "_",
    "vue":                 "Vue",
    "vue-class-component": "VueClassComponent",
    "vuex":                "Vuex",
}));
roller.input(() => true, () => ({
    input: "src/index.ts",
}));

// ### Production builds
roller.output(({ target }) => target === "prod", () => ({
    plugins: [terser()],
}));

// ### CommonJS configuration ("main")
roller.input(({ build }) => build === "cjs", () => ({
    plugins: [
        typescript({
            module:        "esnext",
            target:        "es2015",
            noEmitOnError: true,
        }),
    ],
}));
roller.output(({ build }) => build === "cjs", () => ({
    file:   pkg.main,
    format: "commonjs",
}));

// ### Module configuration ("module")
roller.input(({ build }) => build === "esm", () => ({
    plugins: [
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
}));
roller.output(({ build }) => build === "esm", () => ({
    dir:            path.dirname(pkg.module),
    entryFileNames: path.basename(pkg.module),
    format:         "esm",
}));

// ### Browser configuration ("browser")
roller.input(({ build }) => build === "iife", () => ({
    plugins: [
        typescript({
            module:        "esnext",
            target:        "es2015",
            noEmitOnError: true,
        }),
    ],
}));
roller.output(({ build }) => build === "iife", () => ({
    file:   pkg.browser,
    name:   "DecorationVuex",
    format: "iife",
}));

export default roller.build();
