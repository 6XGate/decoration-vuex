import type { TestInterface } from "ava";
import storeTest from "ava";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Getter, Mutation, Action, Module, StoreModule } from "../src";

@Module
class SetterModule extends StoreModule {
    value = 5;

    get x(): number {
        return this.value;
    }

    set x(value: number) {
        this.value = value;
    }

    @Getter
    // eslint-disable-next-line class-methods-use-this
    getMagic(): number {
        return 15;
    }

    @Getter
    getX(): number {
        return this.value;
    }

    @Mutation
    setX(value: number): void {
        this.value = value;
    }

    @Mutation
    setWith(x: number, y: number): void {
        this.value = x * y;
    }

    @Mutation
    readsState(): void { this.value = this.value * 2 }

    @Mutation
    callsGetter(): void { this.value = this.x * 2 }

    @Mutation
    callsAccessor(): void { this.value = this.getMagic() }

    @Mutation
    callsSetter(value: number): void { this.x = value }

    @Mutation
    callsMutation(value: number): void { this.setX(value) }

    @Mutation
    callsAction(value: number): void { this.tryMake(value).catch(_error => undefined) }

    @Action
    tryMake(value: number): Promise<void> {
        return Promise.resolve(this.setX(value));
    }
}

const test = storeTest as TestInterface<{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    store: Store<unknown>;
    module: SetterModule;
}>;

test.before(t => {
    Vue.use(Vuex);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const store = new Store({});
    const module = new SetterModule({ store });

    t.context = { store, module };
});

test.serial("Mutation with value", t => {
    t.is(t.context.module.value, 5);
    t.notThrows(() => { t.context.module.setX(8) });

    t.is(t.context.module.value, t.context.module.x);
    t.is(t.context.module.x, 8);
});

test.serial("Mutation with inputs", t => {
    t.notThrows(() => { t.context.module.setWith(5, 2) });

    t.is(t.context.module.value, 5 * 2);
});

test.serial("Mutation reads state", t => {
    const value = t.context.module.value;
    t.notThrows(() => { t.context.module.readsState() });

    t.is(t.context.module.value, value * 2);
});

test.serial("Mutation calls getter", t => {
    const value = t.context.module.x;
    t.notThrows(() => { t.context.module.callsGetter() });

    t.is(t.context.module.value, value * 2);
});

test.serial("Mutation calls accessor", t => {
    t.notThrows(() => { t.context.module.callsAccessor() });

    t.is(t.context.module.value, t.context.module.getMagic());
});

test.serial("Mutation calls setter", t => {
    t.notThrows(() => { t.context.module.callsSetter(6) });

    t.is(t.context.module.x, 6);
});

test.serial("Mutation calls mutation", t => {
    t.notThrows(() => { t.context.module.callsMutation(7) });

    t.is(t.context.module.x, 7);
});

test.serial("Mutation calls action", t => {
    const value = t.context.module.x;
    t.throws(
        () => { t.context.module.callsAction(8) },
        { instanceOf: Error, message: /^\[classy-vuex\]: Calling action/u },
    );

    t.is(t.context.module.x, value);
});
