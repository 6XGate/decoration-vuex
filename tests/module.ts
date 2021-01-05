import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import type { Store } from "vuex";
import Vuex from "vuex";
import { Action, Getter, Module, Mutation, StoreModule } from "../src";

@Module
class TestModule extends StoreModule {
    value = 5;

    get sqr(): number { return this.value * this.value }

    get x(): number { return this.value }

    set x(value: number) { this.value = value }

    get bad(): number {
        this.value *= 2;

        return this.value;
    }

    @Getter
    pow(ex: number): number {
        return this.value ** ex;
    }

    @Mutation
    inc(): void {
        this.value += 1;
    }

    @Mutation
    badMutation(): void {
        console.log(this.x);
    }

    @Action
    tryValue(): Promise<[number, number]> {
        return Promise.resolve([ this.value, this.x ]);
    }

    @Action
    async mutatingAction(): Promise<void> {
        this.inc();

        await Promise.resolve();
    }

    @Action
    chainedAction(): Promise<[number, number]> {
        return this.tryValue();
    }

    @Action
    async badAction(): Promise<void> {
        this.value = 5;

        await Promise.resolve();
    }
}

const test = storeTest as TestInterface<{
    store: Store<Record<string, unknown>>;
    module: TestModule;
}>;

Vue.use(Vuex);

test.before(t => {
    const store = new Vuex.Store<Record<string, unknown>>({});
    const module = new TestModule({ store });

    t.context = { store, module };
});

test("create", t => {
    t.true(t.context.store.state.TestModule instanceof TestModule, "testModule is not a TestModule");
});

test("state", t => {
    t.is(t.context.module.value, 5);
});

test("bad-state-manipulation", t => {
    t.throws(
        () => { t.context.module.value = 6 },
        { instanceOf: Error },
    );
});

test("getters", t => {
    t.is(t.context.module.sqr, 5 * 5);
});

test("bad-getters", t => {
    t.throws(
        () => t.context.module.bad,
        { instanceOf: Error },
    );
});

test("accessors", t => {
    t.is(t.context.module.pow(3), 5 * 5 * 5);
});

test("properties", t => {
    t.context.module.x = 10;

    t.is(t.context.module.value, 10);
    t.is(t.context.module.x, 10);
    t.is(t.context.module.sqr, 100);
});

test("mutations", t => {
    t.context.module.inc();

    t.is(t.context.module.value, 11);
    t.is(t.context.module.x, 11);
    t.is(t.context.module.sqr, 121);
});

test("bad-mutations", t => {
    t.throws(
        () => { t.context.module.badMutation() },
        { instanceOf: Error },
    );
});

test("actions", async t => {
    t.deepEqual(await t.context.module.tryValue(), [ 11, 11 ]);
    await t.notThrowsAsync(() => t.context.module.mutatingAction());
    t.deepEqual(await t.context.module.chainedAction(), [ 12, 12 ]);
});

test("bad-actions", async t => {
    await t.throwsAsync(
        () => t.context.module.badAction(),
        { instanceOf: Error },
    );
});
