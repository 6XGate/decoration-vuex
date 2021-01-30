import type { TestInterface } from "ava";
import storeTest from "ava";
import { identity } from "lodash";
import Vue from "vue";
import Component from "vue-class-component";
import Vuex, { mapActions, mapGetters, mapMutations, mapState, Store } from "vuex";
import type { StateType, PropertyType, GetterType, MutationType, ActionType } from "../src";
import {
    Module,
    StoreModule,
    Getter,
    Mutation,
    Action,
    MapState,
    MapProperty,
    MapGetter,
    MapMutation,
    MapAction,
    getModuleName,
} from "../src";

const ignore = (..._ignore: unknown[]): void => undefined;

const makeContext = identity(() => {
    Vue.use(Vuex);

    const store = new Store({});

    @Module
    class TestModule extends StoreModule {
        value = 5;

        get next(): number {
            return this.value + 1;
        }

        @Getter
        pow(by: number): number {
            return this.value ** by;
        }

        get x(): number {
            return this.value;
        }

        set x(value: number) {
            this.value = value;
        }

        @Mutation
        inc(by = 1): void {
            this.value += by;
        }

        @Action
        increment(by = 1): Promise<number> {
            return new Promise<number>(resolve => {
                this.inc(by);

                resolve(this.value);
            });
        }

        @Action
        async incrementOne(): Promise<number> {
            return this.increment(1);
        }
    }

    const module = new TestModule({ store });

    return { store, module };
});

const test = storeTest as TestInterface<ReturnType<typeof makeContext>>;

test.before(t => { t.context = makeContext() });

test.serial("Decorator mappers", async t => {
    @Component
    class Comp extends Vue {
        @MapState(t.context.module, "value")
        readonly value!: StateType<typeof t.context.module, "value">;

        @MapGetter(t.context.module, "next")
        readonly next!: GetterType<typeof t.context.module, "next">;

        @MapGetter(t.context.module, "pow")
        readonly pow!: GetterType<typeof t.context.module, "pow">;

        @MapProperty(t.context.module, "x")
        x!: PropertyType<typeof t.context.module, "x">;

        @MapMutation(t.context.module, "inc")
        readonly inc!: MutationType<typeof t.context.module, "inc">;

        @MapAction(t.context.module, "increment")
        readonly increment!: ActionType<typeof t.context.module, "increment">;

        @MapAction(t.context.module, "incrementOne")
        readonly incrementOne!: ActionType<typeof t.context.module, "incrementOne">;
    }

    const comp = new Comp({ store: t.context.store });

    t.is(comp.value, 5);
    t.is(comp.next, 6);
    t.is(comp.pow(2), 25);
    t.true(typeof comp.inc === "function");
    t.true(typeof comp.increment === "function");

    t.is(comp.x, 5);
    t.notThrows(() => { comp.x = 6 });
    t.is(comp.value, 6);

    t.notThrows(() => { comp.inc() });
    t.is(comp.value, 7);
    t.is(comp.next, 8);

    await t.notThrowsAsync(async () => { await comp.increment(2) });
    t.is(comp.value, 9);
    t.is(comp.next, 10);

    await t.notThrowsAsync(async () => { await comp.incrementOne() });
    t.is(comp.value, 10);
    t.is(comp.next, 11);
});

test.serial("Function mappers", async t => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const Comp2 = Vue.extend({
        computed: {
            ...mapState(getModuleName(t.context.module), ["value"]) as
                { value(): number },
            ...mapGetters(getModuleName(t.context.module), [ "next", "pow" ]) as
                { next(): number; pow(): (by: number) => number },
        },
        methods: {
            ...mapMutations(getModuleName(t.context.module), ["inc"]) as
                { inc(args?: [number?]): void },
            ...mapActions(getModuleName(t.context.module), [ "increment", "incrementOne" ]) as
                { increment(args?: [number?]): Promise<void>; incrementOne(): Promise<void> },
        },
    });

    const comp2 = new Comp2({ store: t.context.store });

    t.is(comp2.value, 10);
    t.is(comp2.next, 11);
    t.is(comp2.pow(2), 100);
    t.true(typeof comp2.inc === "function");
    t.true(typeof comp2.increment === "function");

    t.notThrows(() => { comp2.inc() });
    t.is(comp2.value, 11);
    t.is(comp2.next, 12);

    await t.notThrowsAsync(async () => { await comp2.increment([2]) });
    t.is(comp2.value, 13);
    t.is(comp2.next, 14);

    await t.notThrowsAsync(async () => { await comp2.incrementOne() });
    t.is(comp2.value, 14);
    t.is(comp2.next, 15);
});

test("First decorator: state", t => {
    t.notThrows(() => {
        @Component
        class Comp extends Vue {
            @MapState(t.context.module, "value")
            readonly value!: StateType<typeof t.context.module, "value">;
        }

        ignore(Comp);
    });
});

test("First decorator: property", t => {
    t.notThrows(() => {
        @Component
        class Comp extends Vue {
            @MapProperty(t.context.module, "x")
            readonly value!: StateType<typeof t.context.module, "value">;
        }

        ignore(Comp);
    });
});

test("First decorator: getter", t => {
    t.notThrows(() => {
        @Component
        class Comp extends Vue {
            @MapGetter(t.context.module, "pow")
            readonly pow!: GetterType<typeof t.context.module, "pow">;
        }

        ignore(Comp);
    });
});

test("First decorator: mutation", t => {
    t.notThrows(() => {
        @Component
        class Comp extends Vue {
            @MapMutation(t.context.module, "inc")
            readonly inc!: MutationType<typeof t.context.module, "inc">;
        }

        ignore(Comp);
    });
});

test("First decorator: action", t => {
    t.notThrows(() => {
        @Component
        class Comp extends Vue {
            @MapAction(t.context.module, "increment")
            readonly increment!: ActionType<typeof t.context.module, "increment">;
        }

        ignore(Comp);
    });
});
