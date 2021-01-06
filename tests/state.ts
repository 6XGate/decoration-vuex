import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Module, StoreModule } from "../src";

class ModuleCommon extends StoreModule {
    value = 5;
}

@Module
class ClosedStateModule extends ModuleCommon { }

@Module({ openState: true })
class OpenStateModule extends ModuleCommon { }

const test = storeTest as TestInterface<{
    store: Store<unknown>;
    closed: ClosedStateModule;
    open: OpenStateModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    const store = new Store({});
    const closed = new ClosedStateModule({ store });
    const open = new OpenStateModule({ store });

    t.context = { store, closed, open };
});

test("Getting property on closed state", t => {
    t.is(t.context.closed.value, 5);
});

test("Setting property on closed state", t => {
    t.throws(
        () => { t.context.closed.value = 7 },
        { instanceOf: Error, message: /^\[decoration-vuex\]: Cannot modify the state outside mutations/u },
    );

    t.is(t.context.closed.value, 5);
});

test("Getting property on open state", t => {
    t.is(t.context.closed.value, 5);
});

test("Setting property on open state", t => {
    t.notThrows(() => { t.context.open.value = 7 });

    t.is(t.context.open.value, 7);
});
