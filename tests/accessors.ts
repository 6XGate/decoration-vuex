import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Getter, Mutation, Action, Module, StoreModule } from "../src";

const ignore = (..._ignore: unknown[]): void => undefined;

@Module
class AccessorModule extends StoreModule {
    value = 5;

    get x(): number {
        return this.value;
    }

    set x(value: number) {
        this.value = value;
    }

    @Getter
    getX(): number {
        return this.x;
    }

    @Getter
    getPow(by: number): number {
        return this.x ** by;
    }

    @Getter
    getMany(first: number, second: number): [ number, number, number ] {
        return [ first, second, this.x ];
    }

    @Getter
    failSetter(): number {
        this.x += 5;

        return this.x;
    }

    @Getter
    failMutations(): number {
        this.inc();

        return this.x;
    }

    @Getter
    failAction(): number {
        this.tryInc().catch(_error => undefined);

        return this.x;
    }

    @Mutation
    inc(): void { this.value++ }

    @Action
    tryInc(): Promise<void> {
        return Promise.resolve(this.inc());
    }
}

const test = storeTest as TestInterface<{
    store: Store<unknown>;
    module: AccessorModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    const store = new Store({});
    const module = new AccessorModule({ store });

    t.context = { store, module };
});

test("Getting by accessor", t => {
    t.is(t.context.module.getX(), 5);
});

test("Getting computed value", t => {
    t.is(t.context.module.getPow(3), 125);
});

test("Accessor with many inputs", t => {
    t.deepEqual(t.context.module.getMany(1, 2), [ 1, 2, 5 ]);
});

test("Accessor calling setter", t => {
    const value = t.context.module.value;
    t.throws(
        () => { ignore(t.context.module.failSetter()) },
        { instanceOf: Error, message: /^\[decoration-vuex\]: Calling setter for/u },
    );

    t.is(t.context.module.value, value);
});

test("Accessor calling mutation", t => {
    const value = t.context.module.value;
    t.throws(
        () => { ignore(t.context.module.failMutations()) },
        { instanceOf: Error, message: /^\[decoration-vuex\]: Calling mutation/u },
    );

    t.is(t.context.module.value, value);
});

test("Accessor calling action", t => {
    const value = t.context.module.value;
    t.throws(
        () => { ignore(t.context.module.failAction()) },
        { instanceOf: Error, message: /^\[decoration-vuex\]: Calling action/u },
    );

    t.is(t.context.module.value, value);
});
