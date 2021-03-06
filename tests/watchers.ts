import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import type { LoggerEvent } from "../src";
import { getLogger, Module, Mutation, ObservableLogger, setLogger, StoreModule, Watch } from "../src";

@Module
class WatchingModule extends StoreModule {
    value = 5;
    deep = { value: 2 };

    // eslint-disable-next-line class-methods-use-this
    get break(): number {
        throw new Error("break");
    }

    @Mutation
    inc(by: number): void {
        this.value += by;
    }

    @Mutation
    incDeep(by: number): void {
        this.deep.value += by;
    }

    @Watch("value")
    // eslint-disable-next-line class-methods-use-this
    onValueChange(newValue: number): void {
        getLogger().log(newValue);
    }

    @Watch("deep.value")
    // eslint-disable-next-line class-methods-use-this
    onDeepValueChange(newValue: number): void {
        getLogger().log(newValue);
    }

    @Watch("break")
    // eslint-disable-next-line class-methods-use-this
    onBreakChange(newValue: number): void {
        getLogger().log(newValue);
    }
}

const test = storeTest as TestInterface<{
    store: Store<unknown>;
    module: WatchingModule;
    logger: ObservableLogger;
}>;

test.before(t => {
    Vue.use(Vuex);
    const logger =  new ObservableLogger();
    const store = new Store({});

    setLogger(logger);

    t.context = {
        module: new WatchingModule({ store }),
        logger,
        store,
    };
});

test.serial("Direct watcher call", t => {
    t.throws(() => {
        t.context.module.onValueChange(5);
    }, {
        instanceOf: Error,
        message:    /\[decoration-vuex\]: Watcher /u,
    });
});

test.serial("Trigger watcher", t => new Promise<void>(resolve => {
    const onLog = (log: LoggerEvent): void => {
        t.is(log.name, "log");
        t.deepEqual(log.args["...data"], [6]);
        t.context.logger.off("log", onLog);

        resolve();
    };

    t.context.logger.on("log", onLog);
    t.context.module.inc(1);
}));

test.serial("Trigger deep watcher", t => new Promise<void>(resolve => {
    const onLog = (log: LoggerEvent): void => {
        t.is(log.name, "log");
        t.deepEqual(log.args["...data"], [3]);
        t.context.logger.off("log", onLog);

        resolve();
    };

    t.context.logger.on("log", onLog);
    t.context.module.incDeep(1);
}));
