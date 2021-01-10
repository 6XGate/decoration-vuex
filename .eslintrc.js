module.exports = {
    root: true,
    env:  {
        browser: false,
        worker:  true,
        node:    true,
        es6:     true,
    },
    plugins: [
        "@typescript-eslint",
        "import",
    ],
    extends: [
        "eslint:recommended",
        "plugin:import/warnings",
        "plugin:import/errors",
        "plugin:node/recommended",
    ],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType:  "module",
    },
    rules: {
        // Turned off because node/recommended accidentally? turned it on
        "no-process-exit": "off",

        // # ESLint rules

        // ## Possible Errors
        "no-await-in-loop":            "error",
        "no-loss-of-precision":        "error",
        "no-promise-executor-return":  "error",
        "no-template-curly-in-string": "error",
        "no-unsafe-optional-chaining": "error",
        "no-useless-backreference":    "error",

        // ## Best Practices
        "accessor-pairs":               [ "error", { enforceForClassMembers: true } ],
        "array-callback-return":        "error",
        "block-scoped-var":             "error",
        "class-methods-use-this":       "warn",
        "consistent-return":            "error",
        "curly":                        [ "error", "all" ],
        "default-case":                 "error",
        "default-param-last":           "error",
        "dot-location":                 "error",
        "dot-notation":                 "warn",
        "eqeqeq":                       "error",
        "grouped-accessor-pairs":       [ "error", "getBeforeSet" ],
        "guard-for-in":                 "error",
        "no-alert":                     "error",
        "no-caller":                    "error",
        "no-constructor-return":        "error",
        "no-div-regex":                 "error",
        "no-else-return":               "error",
        "no-eq-null":                   "error",
        "no-eval":                      "error",
        "no-extend-native":             "error",
        "no-extra-bind":                "warn",
        "no-labels":                    "error",
        "no-floating-decimal":          "error",
        "no-implicit-coercion":         "error",
        "no-implicit-globals":          "error",
        "no-implied-eval":              "error",
        "no-iterator":                  "error",
        "no-lone-blocks":               "error",
        "no-loop-func":                 "error",
        "no-multi-spaces":              "off",
        "no-multi-str":                 "error",
        "no-new":                       "error",
        "no-new-func":                  "error",
        "no-new-wrappers":              "error",
        "no-octal-escape":              "warn",
        "no-proto":                     "error",
        "no-return-assign":             "error",
        "no-return-await":              "error",
        "no-script-url":                "error",
        "no-self-compare":              "error",
        "no-sequences":                 "error",
        "no-throw-literal":             "error",
        "no-unmodified-loop-condition": "error",
        "no-unused-expressions":        [ "warn", { allowShortCircuit: true, allowTernary: true } ],
        "no-useless-call":              "error",
        "no-useless-concat":            "error",
        "no-useless-return":            "error",
        "no-void":                      "error",
        "prefer-promise-reject-errors": "error",
        "prefer-regex-literals":        "warn",
        "radix":                        [ "error", "as-needed" ],
        "require-await":                "error",
        "require-unicode-regexp":       "error",
        "wrap-iife":                    [ "error", "inside" ],
        "yoda":                         [ "error", "never", { exceptRange: true } ],

        // ## Strict mode
        "strict": "error",

        // ## Variables
        "no-label-var":         "error",
        "no-shadow":            "warn",
        "no-unused-vars":       [ "error", { argsIgnorePattern: "^_" } ],
        "no-use-before-define": "error",

        // ## Stylistic Issues
        "array-bracket-newline":           [ "error", { multiline: true } ],
        "array-bracket-spacing":           [ "error", "always", { singleValue: false } ],
        "array-element-newline":           [ "error", "consistent" ],
        "block-spacing":                   "error",
        "brace-style":                     [ "error", "1tbs", { allowSingleLine: true } ],
        "camelcase":                       [ "error", { properties: "never", ignoreImports: true } ],
        "comma-dangle":                    [ "error", "always-multiline" ],
        "comma-spacing":                   "error",
        "comma-style":                     [ "error", "last" ],
        "computed-property-spacing":       [ "error", "never" ],
        "eol-last":                        [ "error", "always" ],
        "func-call-spacing":               [ "error", "never" ],
        "func-name-matching":              "warn",
        "indent":                          [ "error", 4, { flatTernaryExpressions: true } ],
        "key-spacing":                     [ "error", { afterColon: true, align: "value" } ],
        "keyword-spacing":                 [ "error", { before: true, after: true } ],
        "linebreak-style":                 [ "error", "unix" ],
        "lines-between-class-members":     [ "error", "always", { exceptAfterSingleLine: true } ],
        "new-cap":                         "error",
        "new-parens":                      "error",
        "no-array-constructor":            "error",
        "no-continue":                     "warn",
        "no-lonely-if":                    "error",
        "no-mixed-operators":              "warn",
        "no-multi-assign":                 "error",
        "no-multiple-empty-lines":         "error",
        "no-nested-ternary":               "warn",
        "no-new-object":                   "error",
        "no-tabs":                         "error",
        "no-trailing-spaces":              "error",
        "no-unneeded-ternary":             "warn",
        "no-whitespace-before-property":   "error",
        "object-curly-newline":            [ "error", { multiline: true, consistent: true } ],
        "object-curly-spacing":            [ "error", "always" ],
        "object-property-newline":         [ "error", { allowAllPropertiesOnSameLine: true } ],
        "one-var":                         [ "error", "never" ],
        "operator-linebreak":              [ "error", "after" ],
        "padding-line-between-statements": [ "error", { blankLine: "always", prev: "*", next: "return" } ],
        "prefer-exponentiation-operator":  "error",
        "prefer-object-spread":            "warn",
        "quote-props":                     [ "error", "consistent" ],
        "quotes":                          [ "error", "double", { avoidEscape: true } ],
        "semi":                            [ "error", "always", { omitLastInOneLineBlock: true } ],
        "semi-spacing":                    "error",
        "semi-style":                      "error",
        "space-before-blocks":             "error",
        "space-before-function-paren":     [
            "error", {
                "anonymous":  "always",
                "named":      "never",
                "asyncArrow": "always",
            },
        ],
        "space-in-parens":      "error",
        "space-infix-ops":      "error",
        "space-unary-ops":      "error",
        "spaced-comment":       [ "error", "always", { block: { balanced: true } } ],
        "switch-colon-spacing": "error",
        "template-tag-spacing": [ "error", "never" ],
        "unicode-bom":          [ "error", "never" ],
        "wrap-regex":           "warn",

        // ## ECMAScript 6
        "arrow-body-style":        [ "error", "as-needed" ],
        "arrow-parens":            [ "error", "as-needed" ],
        "arrow-spacing":           "error",
        "generator-star-spacing":  "error",
        "no-confusing-arrow":      [ "error", { allowParens: true } ],
        "no-useless-computed-key": "warn",
        "no-useless-constructor":  "error",
        "no-useless-rename":       "error",
        "no-var":                  "error",
        "prefer-const":            "warn",
        "prefer-numeric-literals": "error",
        "prefer-rest-params":      "warn",
        "prefer-spread":           "warn",
        "prefer-template":         "warn",
        "rest-spread-spacing":     [ "error", "never" ],
        "symbol-description":      "error",
        "template-curly-spacing":  [ "error", "never" ],
        "yield-star-spacing":      "error",

        // # Import

        // ## Static analysis
        "import/no-absolute-path":         "error",
        "import/no-dynamic-require":       "error",
        "import/no-webpack-loader-syntax": "error",
        "import/no-self-import":           "error",
        "import/no-useless-path-segments": "error",

        // ## Helpful warnings
        "import/no-mutable-exports": "error",
        "import/no-unused-modules":  "error",

        // ## Module systems
        "import/no-amd": "error",

        // ## Style guide
        "import/first":                       "error",
        "import/order":                       [ "error", { alphabetize: { order: "asc" } } ],
        "import/newline-after-import":        "error",
        "import/no-named-default":            "error",
        "import/no-anonymous-default-export": "error",

        // # Node

        // ## Possible Errors
        "node/no-missing-import":      "off",
        "node/no-missing-require":     "off",
        "node/no-new-require":         "error",
        "node/no-path-concat":         "error",
        "node/no-unpublished-import":  "off",
        "node/no-unpublished-require": "off",
    },
    overrides: [
        {
            // Make sure `.cjs` files are processed.
            files: ["*.cjs"],
        },
        {
            files: [ "./build/**/*.js", "./rollup.*.js" ],
            rules: {
                "node/no-unsupported-features/es-syntax": [
                    "error", {
                        ignores: ["modules"],
                    },
                ],
            },
        },
        {
            files:   [ "*.ts", "*.vue" ],
            env:     { "browser": true },
            extends: [
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                "plugin:import/typescript",
            ],
            parser:        "@typescript-eslint/parser",
            parserOptions: {
                project:         "./tsconfig.json",
                tsconfigRootDir: __dirname,
            },
            settings: {
                "import/parsers": {
                    "@typescript-eslint/parser": [".ts"],
                },
            },
            rules: {
                // # Stylistic Issues
                "new-cap": [
                    "error", {
                        capIsNewExceptions: [
                            "Component",
                            "Prop",
                            "PropSync",
                            "Model",
                            "Watch",
                            "Provide",
                            "Inject",
                            "ProvideReactive",
                            "InjectReactive",
                            "Emit",
                            "Ref",
                            "Module",
                            "State",
                            "MapState",
                            "Getter",
                            "MapGetter",
                            "Mutation",
                            "MapMutation",
                            "Action",
                            "MapAction",
                            "MapProperty",
                        ],
                    },
                ],

                // # Off for TypeScript take over
                "brace-style":                 "off",
                "camelcase":                   "off",
                "comma-dangle":                "off",
                "comma-spacing":               "off",
                "default-param-last":          "off",
                "dot-notation":                "off",
                "func-call-spacing":           "off",
                "indent":                      "off",
                "keyword-spacing":             "off",
                "lines-between-class-members": "off",
                "no-array-constructor":        "off",
                "no-empty-function":           "off",
                "no-implied-eval":             "off",
                "no-loop-func":                "off",
                "no-loss-of-precision":        "off",
                "no-shadow":                   "off",
                "no-throw-literal":            "off",
                "no-unused-expressions":       "off",
                "no-unused-vars":              "off",
                "no-use-before-define":        "off",
                "no-useless-constructor":      "off",
                "quotes":                      "off",
                "require-await":               "off",
                "semi":                        "off",
                "space-before-function-paren": "off",
                "space-infix-ops":             "off",
                "import/no-duplicates":        "off",

                // # Tuned for use under TypeScript and Electron
                "node/no-unsupported-features/es-syntax": [
                    "error", {
                        version: ">=12.18.0",
                        ignores: [ "dynamicImport", "modules" ],
                    },
                ],

                // # TypeScript

                // ## Standard rules
                "@typescript-eslint/array-type":                     "error",
                "@typescript-eslint/ban-tslint-comment":             "error",
                "@typescript-eslint/ban-types":                      "warn",
                "@typescript-eslint/class-literal-property-style":   "error",
                "@typescript-eslint/consistent-type-assertions":     "error",
                "@typescript-eslint/consistent-type-imports":        "error",
                "@typescript-eslint/explicit-function-return-type":  [ "error", { allowExpressions: true } ],
                "@typescript-eslint/explicit-member-accessibility":  [ "error", { accessibility: "no-public" } ],
                "@typescript-eslint/explicit-module-boundary-types": "off",
                "@typescript-eslint/member-delimiter-style":         "error",
                "@typescript-eslint/naming-convention":              [
                    "warn",
                    {
                        selector:           "default",
                        format:             ["camelCase"],
                        leadingUnderscore:  "allow",
                        trailingUnderscore: "allow",
                    },
                    {
                        selector:  "function",
                        format:    [ "camelCase", "PascalCase" ],
                        modifiers: ["global"],
                    },
                    {
                        selector:           "variable",
                        format:             [ "camelCase", "UPPER_CASE", "PascalCase" ],
                        modifiers:          ["global"],
                        leadingUnderscore:  "allow",
                        trailingUnderscore: "allow",
                    },
                    {
                        selector:           "variable",
                        format:             [ "camelCase", "UPPER_CASE" ],
                        leadingUnderscore:  "allow",
                        trailingUnderscore: "allow",
                    },
                    {
                        selector: "typeLike",
                        format:   ["PascalCase"],
                    },
                    {
                        selector:           ["property"],
                        format:             [ "camelCase", "snake_case" ],
                        leadingUnderscore:  "allowSingleOrDouble",
                        trailingUnderscore: "allowSingleOrDouble",
                    },
                ],
                "@typescript-eslint/no-base-to-string":                      "error",
                "@typescript-eslint/no-non-null-asserted-optional-chain":    "error",
                "@typescript-eslint/no-empty-interface":                     "warn",
                "@typescript-eslint/no-implicit-any-catch":                  "error",
                "@typescript-eslint/no-invalid-void-type":                   "error",
                "@typescript-eslint/no-misused-promises":                    [ "error", { checksVoidReturn: false } ],
                "@typescript-eslint/no-parameter-properties":                "error",
                "@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
                "@typescript-eslint/no-unnecessary-condition":               "warn",
                "@typescript-eslint/no-unnecessary-qualifier":               "warn",
                "@typescript-eslint/no-unnecessary-type-arguments":          "warn",
                "@typescript-eslint/no-unnecessary-type-constraint":         "warn",
                "@typescript-eslint/no-var-requires":                        "off",
                "@typescript-eslint/prefer-includes":                        "warn",
                "@typescript-eslint/prefer-literal-enum-member":             "warn",
                "@typescript-eslint/prefer-readonly":                        "warn",
                "@typescript-eslint/prefer-regexp-exec":                     "error",
                "@typescript-eslint/prefer-string-starts-ends-with":         "warn",
                "@typescript-eslint/restrict-template-expressions":          [
                    "error", {
                        allowNumber:  true,
                        allowBoolean: false,
                        allowAny:     false,
                        allowNullish: true,
                    },
                ],

                // ## ESLint and import replacement rules
                "@typescript-eslint/brace-style":                 [ "error", "1tbs", { allowSingleLine: true } ],
                "@typescript-eslint/comma-dangle":                [ "error", "always-multiline" ],
                "@typescript-eslint/comma-spacing":               "error",
                "@typescript-eslint/default-param-last":          "error",
                "@typescript-eslint/dot-notation":                "warn",
                "@typescript-eslint/func-call-spacing":           [ "error", "never" ],
                "@typescript-eslint/indent":                      [ "error", 4, { flatTernaryExpressions: true } ],
                "@typescript-eslint/keyword-spacing":             [ "error", { before: true, after: true } ],
                "@typescript-eslint/lines-between-class-members": [ "error", "always", { exceptAfterSingleLine: true } ],
                "@typescript-eslint/no-array-constructor":        "error",
                "@typescript-eslint/no-duplicate-imports":        "error",
                "@typescript-eslint/no-empty-function":           "error",
                "@typescript-eslint/no-implied-eval":             "error",
                "@typescript-eslint/no-loop-func":                "error",
                "@typescript-eslint/no-loss-of-precision":        "error",
                "@typescript-eslint/no-shadow":                   "warn",
                "@typescript-eslint/no-throw-literal":            "error",
                "@typescript-eslint/no-unused-expressions":       [
                    "warn", {
                        allowShortCircuit: true,
                        allowTernary:      true,
                    },
                ],
                "@typescript-eslint/no-unused-vars":         [ "error", { argsIgnorePattern: "^_" } ],
                "@typescript-eslint/no-use-before-define":   "error",
                "@typescript-eslint/no-useless-constructor": "warn",
                "@typescript-eslint/quotes":                 [ "error", "double", { avoidEscape: true } ],
                "@typescript-eslint/require-await":          "error",
                "@typescript-eslint/semi":                   [
                    "error", "always", {
                        omitLastInOneLineBlock: true,
                    },
                ],
                "@typescript-eslint/space-before-function-paren": [
                    "error", {
                        anonymous:  "always",
                        named:      "never",
                        asyncArrow: "always",
                    },
                ],
                "@typescript-eslint/space-infix-ops": "error",

                // # Import

                // ## Module systems
                "import/no-commonjs": "error",

                // ## Style guide
                "import/extensions": [
                    "error", "never", {
                        "svg": "always",
                        "vue": "always",
                    },
                ],
            },
        },
    ],
};
