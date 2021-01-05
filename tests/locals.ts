import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Getter, Mutation, Action, Module, StoreModule } from "../src";

class BaseLocalModule extends StoreModule {
    value = 5;

    get x(): number {
        return this.coreGetValue();
    }

    set x(value: number) {
        this.coreSetValue(value);
    }

    @Getter
    getValue(): number {
        return this.coreGetValue();
    }

    @Mutation
    setValue(value: number): void {
        this.coreSetValue(value);
    }

    @Mutation
    setValueBy(x: number, y: number): void {
        this.coreSetValueBy(x, y);
    }

    @Action
    tryGetValue(): Promise<number> {
        return Promise.resolve(this.coreGetValue());
    }

    @Action
    trySetValue(value: number): Promise<void> {
        return new Promise(resolve => { this.coreSetValue(value); resolve() });
    }

    coreGetValue(): number {
        // Direct state read
        return this.value;
    }

    coreSetValue(value: number): void {
        // Direct state write
        this.value = value;
    }

    coreSetValueBy(x: number, y: number): void {
        // Direct state write
        this.value = x * y;
    }
}

@Module
class ClosedLocalModule extends BaseLocalModule {
    @Getter
    getX(): number {
        return this.coreGetX();
    }

    @Mutation
    setX(value: number): void {
        this.coreSetX(value);
    }

    @Action
    tryGetX(): Promise<number> {
        return Promise.resolve(this.coreGetX());
    }

    @Action
    trySetX(value: number): Promise<void> {
        return new Promise(resolve => { this.coreSetX(value); resolve() });
    }

    @Action
    tryAccessX(): Promise<number> {
        return Promise.resolve(this.coreAccessX());
    }

    @Action
    tryMutateX(value: number): Promise<void> {
        return new Promise(resolve => { this.coreMutateX(value); resolve() });
    }

    @Action
    actionGetX(): Promise<number> {
        return this.coreTryGetX();
    }

    @Action
    actionSetX(value: number): Promise<void> {
        return this.coreTrySetX(value);
    }

    coreGetX(): number {
        // Read by getter
        return this.x;
    }

    coreSetX(value: number): void {
        // Write by setter
        this.x = value;
    }

    coreAccessX(): number {
        return this.getX();
    }

    coreMutateX(value: number): void {
        return this.setX(value);
    }

    coreTryGetX(): Promise<number> {
        return this.tryGetX();
    }

    coreTrySetX(value: number): Promise<void> {
        return this.trySetX(value);
    }

    get badWriting(): number {
        this.coreSetValue(1);

        return this.coreGetValue();
    }

    get badSetting(): number {
        this.coreSetX(1);

        return this.coreGetX();
    }

    get badMutating(): number {
        this.coreMutateX(1);

        return this.coreAccessX();
    }

    get badActing(): number {
        this.coreTrySetX(1).catch(_error => undefined);

        return this.coreGetX();
    }

    @Getter
    failWriting(): number {
        this.coreSetValue(1);

        return this.coreGetValue();
    }

    @Getter
    failSetting(): number {
        this.coreSetX(1);

        return this.coreGetX();
    }

    @Getter
    failMutating(): number {
        this.coreMutateX(1);

        return this.coreAccessX();
    }

    @Getter
    failActing(): number {
        this.coreTrySetX(1).catch(_error => undefined);

        return this.coreGetX();
    }

    @Mutation
    mutantActingUp(): void {
        this.coreTrySetX(1).catch(_error => undefined);
    }
}

@Module({ openState: true })
class OpenLocalModule extends BaseLocalModule { }

const test = storeTest as TestInterface<{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    store: Store<unknown>;
    closed: ClosedLocalModule;
    open: OpenLocalModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const store = new Store({});
    const closed = new ClosedLocalModule({ store });
    const open = new OpenLocalModule({ store });

    t.context = { store, open, closed };
});

test.serial("Direct local function call", t => {
    t.throws(
        () => { t.context.closed.coreGetValue() },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling local function/u },
    );
});

test.serial("Getting value", t => {
    t.notThrows(() => { t.is(t.context.closed.x, 5) });
});

test.serial("Setting value", t => {
    t.notThrows(() => { t.context.closed.x = 6 });
    t.is(t.context.closed.x, 6);
});

test.serial("Accessing value", t => {
    t.notThrows(() => { t.is(t.context.closed.getValue(), 6) });
});

test.serial("Mutating value", t => {
    t.notThrows(() => { t.context.closed.setValue(7) });
    t.is(t.context.closed.getValue(), 7);
});

test.serial("Multiply value", t => {
    t.notThrows(() => { t.context.closed.setValueBy(7, 2) });
    t.is(t.context.closed.getValue(), 7 * 2);
});

test.serial("Action accessing value", async t => {
    await t.notThrowsAsync(async () => { t.is(await t.context.closed.tryGetValue(), 7 * 2) });
});

test.serial("Action mutating value in closed state", async t => {
    await t.throwsAsync(
        () => t.context.closed.trySetValue(8),
        { instanceOf: Error, message: /^\[classy-vuex\]: Cannot modify the state outside mutations/u },
    );
    t.is(await t.context.closed.tryGetValue(), 7 * 2);
});

test.serial("Action mutating value in open state", async t => {
    t.is(await t.context.open.tryGetValue(), 5);
    await t.notThrowsAsync(() => t.context.open.trySetValue(7));
    t.is(await t.context.open.tryGetValue(), 7);
});

test.serial("Getting X", t => {
    t.notThrows(() => { t.is(t.context.closed.getX(), 7 * 2) });
});

test.serial("Setting X", t => {
    t.notThrows(() => t.context.closed.setX(8));
    t.is(t.context.closed.getX(), 8);
});

test.serial("Action getting X", async t => {
    await t.notThrowsAsync(async () => t.is(await t.context.closed.tryGetX(), 8));
});

test.serial("Action setting X", async t => {
    await t.notThrowsAsync(() => t.context.closed.trySetX(9));
    t.is(await t.context.closed.tryGetX(), 9);
});

test.serial("Action accessing X", async t => {
    await t.notThrowsAsync(async () => t.is(await t.context.closed.tryAccessX(), 9));
});

test.serial("Action mutating X", async t => {
    await t.notThrowsAsync(() => t.context.closed.tryMutateX(10));
    t.is(await t.context.closed.tryAccessX(), 10);
});

test.serial("Action using action to get X", async t => {
    await t.notThrowsAsync(async () => t.is(await t.context.closed.actionGetX(), 10));
});

test.serial("Action using action to set X", async t => {
    await t.notThrowsAsync(() => t.context.closed.actionSetX(11));
    t.is(await t.context.closed.actionGetX(), 11);
});

test.serial("Writing through getter", t => {
    t.throws(
        () => { t.is(t.context.closed.badWriting, NaN) },
        { instanceOf: Error, message: /^\[classy-vuex\]: Cannot modify the state outside mutations/u },
    );
});

test.serial("Setting through getter", t => {
    t.throws(
        () => { t.is(t.context.closed.badSetting, NaN) },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling setter for/u },
    );
});

test.serial("Mutating through getter", t => {
    t.throws(
        () => { t.is(t.context.closed.badMutating, NaN) },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling mutation/u },
    );
});

test.serial("Acting through getter", t => {
    t.throws(
        () => { t.is(t.context.closed.badActing, NaN) },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling action/u },
    );
});

test.serial("Writing through accessor", t => {
    t.throws(
        () => { t.context.closed.failWriting() },
        { instanceOf: Error, message: /^\[classy-vuex\]: Cannot modify the state outside mutations/u },
    );
});

test.serial("Setting through accessor", t => {
    t.throws(
        () => { t.context.closed.failSetting() },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling setter for/u },
    );
});

test.serial("Mutating through accessor", t => {
    t.throws(
        () => { t.context.closed.failMutating() },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling mutation/u },
    );
});

test.serial("Acting through accessor", t => {
    t.throws(
        () => { t.context.closed.failActing() },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling action/u },
    );
});

test.serial("Acting through mutation", t => {
    t.throws(
        () => { t.context.closed.mutantActingUp() },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling action/u },
    );
});
