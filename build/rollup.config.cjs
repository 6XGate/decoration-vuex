require("ts-node").register();

try {
    module.exports = require("../rollup.config");
} catch (_error) {
    const roller = require("./roller").default;

    module.exports = roller(() => undefined);
}
