import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Module, StoreModule } from "../src";

const VALUE = Symbol("value");

@Module
class SymbolModule extends StoreModule {
    [VALUE] = 5;
}

const test = storeTest as TestInterface<{
    store: Store<unknown>;
    module: SymbolModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    const store = new Store({});
    const module = new SymbolModule({ store });

    t.context = { store, module };
});

test("Getting symbol property", t => {
    t.is(t.context.module[VALUE], 5);
});

test("Setting symbol property", t => {
    t.context.module[VALUE] = 7;

    t.is(t.context.module[VALUE], 7);
});
