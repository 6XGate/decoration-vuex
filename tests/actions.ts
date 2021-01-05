import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Getter, Mutation, Action, Module, StoreModule } from "../src";

class BaseActionModule extends StoreModule {
    value = 5;

    get x(): number {
        return this.value;
    }

    set x(value: number) {
        this.value = value;
    }

    @Getter
    getX(): number {
        return this.value;
    }

    @Mutation
    setX(value: number): void {
        this.value = value;
    }

    @Action
    tryGetValue(): Promise<number> {
        return Promise.resolve(this.value);
    }

    @Action
    trySetValue(value: number): Promise<void> {
        return new Promise(resolve => { this.value = value; resolve() });
    }

    @Action
    tryGetX(): Promise<number> {
        return Promise.resolve(this.x);
    }

    @Action
    trySetX(value: number): Promise<void> {
        return new Promise(resolve => { this.x = value; resolve() });
    }

    @Action
    tryAccessX(): Promise<number> {
        return Promise.resolve(this.getX());
    }

    @Action
    tryMutateX(value: number): Promise<void> {
        return new Promise(resolve => { this.setX(value); resolve() });
    }

    @Action
    tryMultiplyToX(left: number, right: number): Promise<void> {
        return new Promise(resolve => { this.setX(left * right); resolve() });
    }
}

@Module
class ClosedStateActionModule extends BaseActionModule { }

@Module({ openState: true })
class OpenStateActionModule extends BaseActionModule { }

const test = storeTest as TestInterface<{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    store: Store<unknown>;
    closed: ClosedStateActionModule;
    open: OpenStateActionModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const store = new Store({});
    const closed = new ClosedStateActionModule({ store });
    const open = new OpenStateActionModule({ store });

    t.context = { store, open, closed };
});

test.serial("Getting value", async t => {
    await t.notThrowsAsync(() => t.context.closed.tryGetValue());
    t.is(t.context.closed.value, await t.context.closed.tryGetValue());
    t.is(t.context.closed.value, 5);
});

test.serial("Setting value in closed state", async t => {
    await t.throwsAsync(
        () => t.context.closed.trySetValue(6),
        { instanceOf: Error, message: /^\[classy-vuex\]: Cannot modify the state outside mutations/u },
    );

    t.is(t.context.closed.value, await t.context.closed.tryGetValue());
    t.is(t.context.closed.value, 5);
});

test.serial("Setting value in open state", async t => {
    await t.notThrowsAsync(() => t.context.open.trySetValue(7));
    t.is(t.context.open.value, await t.context.open.tryGetValue());
    t.is(t.context.open.value, 7);
});

test.serial("Getting value by getter", async t => {
    await t.notThrowsAsync(() => t.context.closed.tryGetX());
    t.is(await t.context.closed.tryGetValue(), await t.context.closed.tryGetX());
});

test.serial("Setting value by setter", async t => {
    await t.notThrowsAsync(() => t.context.closed.trySetX(9));
    t.is(await t.context.closed.tryGetX(), 9);
});

test.serial("Getting value by accessor", async t => {
    await t.notThrowsAsync(() => t.context.closed.tryAccessX());
    t.is(await t.context.closed.tryGetValue(), await t.context.closed.tryAccessX());
});

test.serial("Setting value by mutation", async t => {
    await t.notThrowsAsync(() => t.context.closed.tryMutateX(11));
    t.is(await t.context.closed.tryGetX(), 11);
});

test.serial("Setting value with inputs", async t => {
    await t.notThrowsAsync(() => t.context.closed.tryMultiplyToX(11, 12));
    t.is(await t.context.closed.tryGetX(), 11 * 12);
});
