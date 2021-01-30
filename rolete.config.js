import path from "path";
import rolete from "@rolete/rolete";

// noinspection JSUnusedGlobalSymbols
export default rolete(({ packageJson, target, outPath }, { typescript, output }) => {
    const typesPath = packageJson.types || packageJson.typings;
    if (!typesPath) {
        throw new Error("Missing type declaration output path");
    }

    if (!outPath) {
        throw new Error(`Missing output path for "${target}"`);
    }

    // ### Module configuration ("module")
    if (target === "esm") {
        output({
            dir:            path.dirname(outPath),
            entryFileNames: path.basename(outPath),
        });
        typescript({
            module:         "esnext",
            target:         "es2015",
            noEmitOnError:  true,
            declaration:    true,
            declarationDir: path.dirname(typesPath),
            outDir:         path.dirname(outPath),
            rootDir:        "./src/",
            include:        ["./src/**/*.ts"],
        });
    }
});
