/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestInterface } from "ava";
import storeTest from "ava";
import { uniqueId } from "lodash";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import { Action, getLogger, Getter, Module, Mutation, ObservableLogger, setLogger, StoreModule, Watch } from "../src";

const ignore = (..._ignore: unknown[]): void => undefined;

const test = storeTest as TestInterface<{
    store: Store<unknown>;
}>;

test.before(t => {
    Vue.use(Vuex);

    t.context.store = new Store({});
});

test("Changing method type: wasn't getter", t => {
    t.throws(() => {
        class Base extends StoreModule {
            @Action
            time(): Promise<void> {
                ignore(this);

                return Promise.resolve(undefined);
            }
        }

        @Module
        class Derived extends Base {
            // @ts-expect-error Changing member type
            get time(): number {
                ignore(this);

                return Math.random() * 2;
            }
        }

        ignore(new Derived({ store: t.context.store, name: uniqueId("test") }));
    }, {
        instanceOf: Error,
        message:    "[decoration-vuex]: Previous member time was action and cannot be changed",
    });
});

test("Changing method type: wasn't accessor", t => {
    t.throws(() => {
        class Base extends StoreModule {
            @Action
            time(): Promise<void> {
                ignore(this);

                return Promise.resolve(undefined);
            }
        }

        @Module
        class Derived extends Base {
            @Getter
            // @ts-expect-error Changing member type
            time(): number {
                ignore(this);

                return Math.random() * 2;
            }
        }

        ignore(new Derived({ store: t.context.store, name: uniqueId("test") }));
    }, {
        instanceOf: Error,
        message:    "[decoration-vuex]: Previous member time was action and cannot be changed",
    });
});

test("Changing method type: wasn't mutation", t => {
    t.throws(() => {
        class Base extends StoreModule {
            @Action
            time(): Promise<void> {
                ignore(this);

                return Promise.resolve(undefined);
            }
        }

        @Module
        class Derived extends Base {
            @Mutation
            // @ts-expect-error Changing member type
            time(): void {
                ignore(this);
            }
        }

        ignore(new Derived({ store: t.context.store, name: uniqueId("test") }));
    }, {
        instanceOf: Error,
        message:    "[decoration-vuex]: Previous member time was action and cannot be changed",
    });
});

test("Changing method type: wasn't action", t => {
    t.throws(() => {
        class Base extends StoreModule {
            @Mutation
            time(): void {
                ignore(this);
            }
        }

        @Module
        class Derived extends Base {
            @Action
            time(): Promise<void> {
                ignore(this);

                return Promise.resolve(undefined);
            }
        }

        ignore(new Derived({ store: t.context.store, name: uniqueId("test") }));
    }, {
        instanceOf: Error,
        message:    "[decoration-vuex]: Previous member time was mutation and cannot be changed",
    });
});

test("Changing method type: wasn't watcher", t => {
    t.throws(() => {
        class Base extends StoreModule {
            test = 2;

            @Mutation
            time(): void {
                ignore(this);
            }
        }

        @Module
        class Derived extends Base {
            @Watch("test")
            // @ts-expect-error Changing member type
            time(_value: number, _old: number): void {
                ignore(this);
            }
        }

        ignore(new Derived({ store: t.context.store, name: uniqueId("test") }));
    }, {
        instanceOf: Error,
        message:    "[decoration-vuex]: Previous member time was mutation and cannot be changed",
    });
});

test("Changing method type: wasn't local", t => {
    t.throws(() => {
        class Base extends StoreModule {
            test = 2;

            @Mutation
            time(): void {
                ignore(this);
            }
        }

        @Module
        class Derived extends Base {
            time(): void {
                ignore(this);
            }
        }

        ignore(new Derived({ store: t.context.store, name: uniqueId("test") }));
    }, {
        instanceOf: Error,
        message:    "[decoration-vuex]: Previous member time was mutation and cannot be changed",
    });
});

test.serial("Non function or getter on prototype chain", t => {
    t.plan(3);

    const original = getLogger();
    try {
        const logger = new ObservableLogger();
        logger.on("message", event => {
            t.is(event.name, "message");
            t.is(event.args.level, "warn");
            t.regex((event.args["...data"] as string[]).join(" "), /^\[decoration-vuex\]: Module prototype has property /u);
        });

        setLogger(logger);

        class Base extends StoreModule {
            test!: undefined|number;

            @Mutation
            time(): void {
                ignore(this);
            }
        }

        Base.prototype.test = 2;

        @Module
        class Derived extends Base {
            @Mutation
            time(): void {
                ignore(this);
            }
        }

        ignore(new Derived({ store: t.context.store, name: uniqueId("test") }));
    } finally {
        setLogger(original);
    }
});

test("Not derived from StoreModule", t => {
    t.throws(() => {
        class Base {
            // @ts-expect-error Not derived from StoreModule
            @Mutation
            time(): void {
                ignore(this);
            }
        }

        // @ts-expect-error Not derived from StoreModule
        @Module
        class Derived extends Base {
            // @ts-expect-error Not derived from StoreModule
            @Mutation
            time(): void {
                ignore(this);
            }
        }

        // @ts-expect-error Not derived from StoreModule
        ignore(new Derived({ store: t.context.store }));
    }, {
        instanceOf: Error,
        message:    "[decoration-vuex]: Module class must be derived from StoreModule",
    });
});

test("Module registered twice", t => {
    t.throws(() => {
        @Module
        class Derived extends StoreModule {
            @Mutation
            time(): void {
                ignore(this);
            }
        }

        ignore(new Derived({ store: t.context.store }));
        ignore(new Derived({ store: t.context.store }));
    }, {
        instanceOf: Error,
        message:    /^\[decoration-vuex\]: Module /u,
    });
});

test("Bad decoration: getter", t => {
    t.throws(() => {
        @Module
        class BadModule extends StoreModule {
            // @ts-expect-error Bad decoration
            @Getter
            value = 2;
        }

        ignore(BadModule);
    }, {
        instanceOf: TypeError,
        message:    "Only functions may be decorated with @Getter",
    });
});

test("Bad decoration: mutation", t => {
    t.throws(() => {
        @Module
        class BadModule extends StoreModule {
            // @ts-expect-error Bad decoration
            @Mutation
            value = 2;
        }

        ignore(BadModule);
    }, {
        instanceOf: TypeError,
        message:    "Only functions may be decorated with @Mutation",
    });
});

test("Bad decoration: action", t => {
    t.throws(() => {
        @Module
        class BadModule extends StoreModule {
            // @ts-expect-error Bad decoration
            @Action
            value = 2;
        }

        ignore(BadModule);
    }, {
        instanceOf: TypeError,
        message:    "Only functions may be decorated with @Action",
    });
});

test("Bad decoration: watch", t => {
    t.throws(() => {
        @Module
        class BadModule extends StoreModule {
            // @ts-expect-error Bad decoration
            @Watch("value")
            value = 2;
        }

        ignore(BadModule);
    }, {
        instanceOf: TypeError,
        message:    "Only functions may be decorated with @Watch",
    });
});

test("No such property", t => {
    t.throws(() => {
        @Module
        class GoodModule extends StoreModule {
            value = 2;
        }

        const goodModule = new GoodModule({ store: t.context.store });

        // @ts-expect-error No such property
        goodModule.count = 2;
    }, {
        instanceOf: ReferenceError,
        message:    "[decoration-vuex]: Cannot add or modify property count of store.",
    });
});
