# Classy Vuex

Create type-safe class-based Vuex stores in TypeScript

# Getting Started

## Requirements

- [Vue](https://vuejs.org/)
- [Vuex](https://vuex.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- Your project must be built with TypeScript by bundler such as [webpack](https://webpack.js.org/), or used in
  [Node.js](https://nodejs.org/).
- Your environment must support ECMAScript
  [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) or provide a polyfill
  of similar functionality.

## Installation

- Install _Classy Vuex_ with your favorite package manager;
    - NPM; `npm install --save-dev classy-vuex`.
    - Yarm; `yarn add classy-vuex --dev`

## Creating your first module.

With Classy, Vuex modules are written as classes and decorated to indicate what certain members will do.

```ts
    // store.ts
    import { Store } from "vuex";

    export const store = new Store({}); 
```

```ts
    // counter.ts
    import { Module, StoreModule, Mutation } from "classy-vuex";
    import { store } from "./store";
    
    @Module
    class Counter extends StoreModule {
        count = 0;
    
        @Mutation
        increment(): void {
            this.count++;
        }
    }

    export const counter = new Counter({ store });
```

## Using your first module

Classy modules are accessed in Vue component by directly referencing the module instance. This even includes any state,
getters, mutations, or actions mapped into the component. The `mapState`, `mapGetters`, `mapMutations`, and `mapActions`
helpers are not used.

```ts
    // MyComponent.vue (script part)
    import { counter } from "./counter.ts"

    export default Vue.extend({
        name: "MyComponent",
        computed: {
            count(): number { return counter.count },
        },
        methods: {
            increment(): void { counter.increment() },
        },
    });
```

# Core Concepts

## Module Constructor

When creating a module; if you define a module constructor, it must receive a `RegisterOptions` object and pass it on
the super constructor.

```ts
    import { Module, StoreModule, RegisterOptions } from "classy-vuex";

    @Module
    class Counter extends StoreModule {
        count: number;
        
        constructor(options: RegisterOptions, initialCount = 0) {
            super(options);
            
            this.count = initialCount;
        }
    }
```

## State

### Defining the State

The state of a Classy defined module is the properties assigned to it at construction or when defining the class. As
with the state of a regular Vuex module, the state will become part of the store when registered.  It will them become
reactive and must follow the same rules as regular Vuex state. New properties may not be added after instantiation, when
registration occurs, nor should they be removed. By requiring all modules extend `StoreModule`, this ensures the state
is created as if it is a plain object.

```ts
    import { Module, StoreModule, RegisterOptions } from "classy-vuex";

    @Module
    class Counter extends StoreModule {
        count: number;
        resets = 0; // This is part of the state of the module.
        
        constructor(options: RegisterOptions, initialCount = 0) {
            super(options);

          // This is part of the state of the module.
            this.count = initialCount;
        }
    }
```

All normal properties will become part of the state of the module. The only exception is any property defined with `get`
and `set` or using ECMAScript `Symbol`s. `get` and `set` are used to define other features of a module. `Symbols` are
ignored by Vuex and provide a means to store any data you don't want to be reactive.

```ts
    import { Module, StoreModule, RegisterOptions } from "classy-vuex";

    const RESETS = Symbol("resets");

    @Module
    class Counter extends StoreModule {
        count: number;
        [RESETS] = 0; // This will not be part of the state, but is accessible anywhere within the module or outside
                      // with the symbol.
        
        constructor(options: RegisterOptions, initialCount = 0) {
            super(options);

          // This is part of the state of the module.
            this.count = initialCount;
        }
      
        // This will not be part of the state, but will be part of the module's `getters` in Vuex. 
        get reset(): number {
            return [RESETS];
        }
    }
```

As with normal Vuex modules, the state cannot be altered outside a mutation.

### Accessing the state

Accessing the state within a Vue component or even other code is as simple as referencing the module instance.

```ts
    import { counter } from "./counter";

    console.log(counter.count); // 0
    counter.increment();
    console.log(counter.count); // 1

    Vue.extend({
        computed: { count(): number { return counter.count } },
        methods:  { increment(): void { return counter.increment() } },
        mounted() {
            console.log(this.count); // n
            this.increment();
            console.log(this.count); // n + 1
        }
    })
```

## Mutations

The only way to actually change the state of a module with using a mutation. In _Classy_, mutations are decorated with
the `@Mutation`. Within a mutation you may alter any state of the module. Mutations may even receive parameters, known
as a payload.

```ts
    @Module
    class Counter extends StoreModule {
        count = 0;

        @Mutation
        reset(): void {
            this.count = 0; 
        }
    
        @Mutation
        increment(by = 1): void {
            this.count += by;
        }
    }
```


## Getters and Setters


## Actions


