import loggerTest from "ava";
import type { TestInterface } from "ava";
import type { Logger, LoggerEvent, LoggerEventHandler } from "../src";
import { ObservableLogger } from "../src";

const test = loggerTest as TestInterface<{
    logger: ObservableLogger;
    inner: ObservableLogger;
}>;

test.before(t => {
    const inner = new ObservableLogger();

    t.context = {
        logger: new ObservableLogger(inner),
        inner,
    };
});

test("Logger#assert", t => {
    t.plan(8);

    const onTruthyAssert = (event: LoggerEvent): void => {
        t.is(event.name, "assert");
        t.truthy(event.args.condition);
        t.is((event.args["...data"] as unknown[]).join(" "), "won't assert");
    };

    t.context.logger.on("assert", onTruthyAssert);
    t.notThrows(() => t.context.logger.assert(true, "won't assert"));
    t.context.logger.off("assert", onTruthyAssert);

    const onFalsyAssert = (event: LoggerEvent): void => {
        t.is(event.name, "assert");
        t.falsy(event.args.condition);
        t.is((event.args["...data"] as unknown[]).join(" "), "will assert");
    };

    t.context.logger.on("assert", onFalsyAssert);
    t.throws(() => t.context.logger.assert(false, "will assert"));
    t.context.logger.off("assert", onFalsyAssert);
});

test("Logger#count", t => {
    t.plan(14);

    const onFirstInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, undefined);
        t.is(event.args["[[Count]]"], 1);
    };

    t.context.logger.on("count", onFirstInvoke);
    t.context.logger.count();
    t.context.logger.off("count", onFirstInvoke);

    const onSecondInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, undefined);
        t.is(event.args["[[Count]]"], 2);
    };

    t.context.logger.on("count", onSecondInvoke);
    t.context.logger.count();
    t.context.logger.off("count", onSecondInvoke);

    const onResetInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "countReset");
        t.is(event.args.label, undefined);
    };
    const onResetAltInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, undefined);
        t.is(event.args["[[Count]]"], 0);
    };

    t.context.logger.on("count", onResetAltInvoke);
    t.context.logger.on("countReset", onResetInvoke);
    t.context.logger.countReset();
    t.context.logger.off("countReset", onResetInvoke);
    t.context.logger.off("count", onResetAltInvoke);

    const onPostResetInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, undefined);
        t.is(event.args["[[Count]]"], 1);
    };

    t.context.logger.on("count", onPostResetInvoke);
    t.context.logger.count();
    t.context.logger.off("count", onPostResetInvoke);
});

test("Logger#count(label)", t => {
    t.plan(14);

    const onFirstInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, "test");
        t.is(event.args["[[Count]]"], 1);
    };

    t.context.logger.on("count", onFirstInvoke);
    t.context.logger.count("test");
    t.context.logger.off("count", onFirstInvoke);

    const onSecondInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, "test");
        t.is(event.args["[[Count]]"], 2);
    };

    t.context.logger.on("count", onSecondInvoke);
    t.context.logger.count("test");
    t.context.logger.off("count", onSecondInvoke);

    const onResetInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "countReset");
        t.is(event.args.label, "test");
    };
    const onResetAltInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, "test");
        t.is(event.args["[[Count]]"], 0);
    };

    t.context.logger.on("count", onResetAltInvoke);
    t.context.logger.on("countReset", onResetInvoke);
    t.context.logger.countReset("test");
    t.context.logger.off("countReset", onResetInvoke);
    t.context.logger.off("count", onResetAltInvoke);

    const onPostResetInvoke = (event: LoggerEvent): void => {
        t.is(event.name, "count");
        t.is(event.args.label, "test");
        t.is(event.args["[[Count]]"], 1);
    };

    t.context.logger.on("count", onPostResetInvoke);
    t.context.logger.count("test");
    t.context.logger.off("count", onPostResetInvoke);
});

test("Logger#table", t => {
    t.plan(3);

    const props = ["hey"];
    const data = { hey: "hello" };

    const onTable = (event: LoggerEvent): void => {
        t.is(event.name, "table");
        t.is(event.args.tabularData, data);
        t.is(event.args.properties, props);
    };

    t.context.logger.on("table", onTable);
    t.context.logger.table(data, props);
    t.context.logger.off("table", onTable);
});

test("Logger message", t => {
    t.plan(30); // 6 * 2 + 6 * 3

    const cache = new Map<keyof Logger, LoggerEventHandler>();

    const onMessage = (level: keyof Logger): LoggerEventHandler => {
        let handler = cache.get(level);
        if (handler) {
            return handler;
        }

        handler = (event: LoggerEvent) => {
            t.is(event.name, "message");
            t.is(event.args.level, level);
            t.is((event.args["...data"] as unknown[]).join(" "), `message at ${level} level`);
        };

        cache.set(level, handler);

        return handler;
    };

    const onTrace = (event: LoggerEvent): void => {
        t.is(event.name, "trace");
        t.is((event.args["...data"] as unknown[]).join(" "), "message at trace level");
    };

    const onDebug = (event: LoggerEvent): void => {
        t.is(event.name, "debug");
        t.is((event.args["...data"] as unknown[]).join(" "), "message at debug level");
    };

    const onInfo = (event: LoggerEvent): void => {
        t.is(event.name, "info");
        t.is((event.args["...data"] as unknown[]).join(" "), "message at info level");
    };

    const onLog = (event: LoggerEvent): void => {
        t.is(event.name, "log");
        t.is((event.args["...data"] as unknown[]).join(" "), "message at log level");
    };

    const onWarn = (event: LoggerEvent): void => {
        t.is(event.name, "warn");
        t.is((event.args["...data"] as unknown[]).join(" "), "message at warn level");
    };

    const onError = (event: LoggerEvent): void => {
        t.is(event.name, "error");
        t.is((event.args["...data"] as unknown[]).join(" "), "message at error level");
    };

    t.context.logger.on("trace", onTrace);
    t.context.logger.on("debug", onDebug);
    t.context.logger.on("info", onInfo);
    t.context.logger.on("log", onLog);
    t.context.logger.on("warn", onWarn);
    t.context.logger.on("error", onError);

    t.context.logger.on("message", onMessage("trace"));
    t.context.logger.trace("message at trace level");
    t.context.logger.off("message", onMessage("trace"));

    t.context.logger.on("message", onMessage("debug"));
    t.context.logger.debug("message at debug level");
    t.context.logger.off("message", onMessage("debug"));

    t.context.logger.on("message", onMessage("info"));
    t.context.logger.info("message at info level");
    t.context.logger.off("message", onMessage("info"));

    t.context.logger.on("message", onMessage("log"));
    t.context.logger.log("message at log level");
    t.context.logger.off("message", onMessage("log"));

    t.context.logger.on("message", onMessage("warn"));
    t.context.logger.warn("message at warn level");
    t.context.logger.off("message", onMessage("warn"));

    t.context.logger.on("message", onMessage("error"));
    t.context.logger.error("message at error level");
    t.context.logger.off("message", onMessage("error"));

    t.context.logger.off("trace", onTrace);
    t.context.logger.off("debug", onDebug);
    t.context.logger.off("info", onInfo);
    t.context.logger.off("log", onLog);
    t.context.logger.off("warn", onWarn);
    t.context.logger.off("error", onError);
});

test("Logger#off(not set)", t => {
    const onTrace = (): void => { console.trace() };

    t.notThrows(() => { t.context.inner.off("trace", onTrace) });
});
