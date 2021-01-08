import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import type { RegisterOptions } from "../src";
import { getModuleName, Module, StoreModule } from "../src";

@Module
class TestModule extends StoreModule {
    value: number;

    constructor(options: RegisterOptions, initialValue = 0) {
        super(options);

        this.value = initialValue;
    }
}

const test = storeTest as TestInterface<{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    store: Store<{ TestModule: TestModule }>;
    module: TestModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const store = new Store<{ TestModule: TestModule }>({});
    const module = new TestModule({ store }, 5);

    t.context = { store, module };
});

test("create", t => {
    t.true(t.context.store.state.TestModule instanceof TestModule, "TestModule is not a TestModule");
    t.is(getModuleName(t.context.store.state.TestModule), "TestModule");
    t.is(getModuleName(t.context.module), "TestModule");
});

test("state", t => {
    t.is(t.context.module.value, 5);
});
