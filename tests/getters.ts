import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Mutation, Action, Module, StoreModule } from "../src";

@Module
class GetterModule extends StoreModule {
    value = 5;

    get x(): number { return this.value }

    get sqr(): number { return this.value * this.value }

    get goodUsingGetter(): number {
        return this.x;
    }

    get badUsingMutation(): number {
        this.inc();

        return 0;
    }

    get badUsingAction(): number {
        this.tryInc().catch(_error => undefined);

        return 0;
    }

    @Mutation
    inc(): void { this.value++ }

    @Action
    tryInc(): Promise<void> {
        return Promise.resolve(this.inc());
    }
}

const test = storeTest as TestInterface<{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    store: Store<unknown>;
    module: GetterModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const store = new Store({});
    const module = new GetterModule({ store });

    t.context = { store, module };
});

test("Getting basic value", t => {
    t.is(t.context.module.x, 5);
});

test("Getting computed value", t => {
    t.is(t.context.module.sqr, 25);
});

test("Getter calling getter", t => {
    t.is(t.context.module.goodUsingGetter, 5);
});

test("Getter calling mutation", t => {
    const value = t.context.module.value;
    t.throws(
        () => { console.log(t.context.module.badUsingMutation) },
        { instanceOf: Error, message: /^\[decoration-vuex\]: Calling mutation/u },
    );

    t.is(t.context.module.value, value);
});

test("Getter calling action", t => {
    const value = t.context.module.value;
    t.throws(
        () => { console.log(t.context.module.badUsingAction) },
        { instanceOf: Error, message: /^\[decoration-vuex\]: Calling action/u },
    );

    t.is(t.context.module.value, value);
});
