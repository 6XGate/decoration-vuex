import path from "path";
import rolete from "@rolete/rolete";

export default rolete(({ target, outPath, typings }, { typescript, output }) => {
    if (!typings) {
        throw new Error("Missing typing output path");
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
            declarationDir: path.dirname(typings),
            outDir:         path.dirname(outPath),
            rootDir:        "./src/",
            include:        ["./src/**/*.ts"],
        });
    }
});
