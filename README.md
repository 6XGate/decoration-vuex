# Decoration for Vuex

Create type-safe class-based Vuex modules in TypeScript

![Lint test](https://github.com/6XGate/decoration-vuex/workflows/Lint%20test/badge.svg?branch=develop)
![Test coverage](https://github.com/6XGate/decoration-vuex/workflows/Test%20coverage/badge.svg?branch=develop)
![Build test](https://github.com/6XGate/decoration-vuex/workflows/Build%20test/badge.svg?branch=develop)

## License

_Decoration for Vuex_ is licensed under the [MIT](LICENSE) license.

## Getting Started

### Requirements

- [Vue](https://vuejs.org/)
- [Vuex](https://vuex.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- Your environment must support ECMAScript
  [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) or provide a polyfill
  of similar functionality.

### Installation

#### Bundler or ts-node build

If you want to use _Decoration_ with a bundler like [webpack](https://webpack.js.org/) or
[rollup](https://rollupjs.org/), or with [ts-node](https://github.com/TypeStrong/ts-node);

- Install _Decoration for Vuex_ with your favorite package manager;
    - [npm](https://www.npmjs.com/); `npm install --save-dev decoration-vuex`.
    - [yarn](https://yarnpkg.com/); `yarn add decoration-vuex --dev`
    - [pnpm](https://pnpm.js.org/); `pnpm add -D decoration-vuex`
- Install _Vuex_ with your favorite package manager;
    - [npm](https://www.npmjs.com/); `npm install --save-dev vuex`.
    - [yarn](https://yarnpkg.com/); `yarn add vuex --dev`
    - [pnpm](https://pnpm.js.org/); `pnpm add -D vuex`

- Enable experimental decorator support in TypeScript
    - In `tsconfig.json`:
        ```json
        {
            "compilerOptions": {
                "experimentalDecorators": true
            }
        }
        ```
    - On the command-line using `--experimentalDecorators`.

#### Browser ready or CDN build

If you wish to use _Decoration_ in an environment that does not use a bundler or modules; you have two options

- Download the `decoration-vuex.iife.js` file from the latest release and include it in your project.
- Link to it from UNPKG CDN `https://unpkg.com/decoration-vuex/dist/index.iife.js` or
  `https://unpkg.com/decoration-vuex@{version}/dist/index.iife.js`. See [UNPKG](https://unpkg.com/) for more versioning
  options.
- Link to it from JSDELIVR CDN `https://cdn.jsdelivr.net/npm/decoration-vuex/dist/index.iife.js` or
  `https://cdn.jsdelivr.net/npm/decoration-vuex@{version}/dist/index.iife.js`. See [JSDELIVR](https://www.jsdelivr.com/)
  for more versioning options.

##### Browser ready or CDN requirements

You must also include [lodash](https://lodash.com/) to use _Decoration_ in the browser ready or CDN build.

### Creating your first module

With _Decoration_, Vuex modules are written as classes and decorated to indicate what certain members will do.

```ts
// store.ts
import { Store } from "vuex";

export const store = new Store({}); 
```

```ts
// counter.ts
import { Module, StoreModule, Mutation } from "decoration-vuex";
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

### Using your first module

_Decoration_ modules are accessed in Vue component by directly referencing the module instance. This even includes any
state, getters, mutations, or actions mapped into the component. The `mapState`, `mapGetters`, `mapMutations`, and
`mapActions` helpers are not needed, but are supported.

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

## Core Concepts

### Module constructor

When creating a module; if you define a module constructor, it must receive a `RegisterOptions` object and pass it on
the super constructor.

```ts
import { Module, StoreModule, RegisterOptions } from "decoration-vuex";

@Module
class Counter extends StoreModule {
    count: number;
    
    constructor(options: RegisterOptions, initialCount = 0) {
        super(options);
        
        this.count = initialCount;
    }
}
```

### State

#### Defining the state

The state of a _Decoration_ defined module is the properties assigned to it at construction or when defining the class.
As with the state of a regular Vuex module, the state will become part of the store when registered. It will them become
reactive and must follow the same rules as regular Vuex state. New properties may not be added after instantiation, when
registration occurs, nor should they be removed. By requiring all modules extend `StoreModule`, this ensures the state
is created as if it is a plain object.

```ts
import { Module, StoreModule, RegisterOptions } from "decoration-vuex";

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

Also, any other method defined in the class may be utilized by the constructor since the module is not yet registered to
Vuex.

```ts
import { Module, StoreModule, RegisterOptions } from "decoration-vuex";

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

#### Accessing the state

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

### Mutations

The only way to actually change the state of a module with using a mutation. In _Decoration_, mutations are decorated
with the `@Mutation`. Within a mutation you may read and alter any state of the module. Mutations may even receive
parameters, known as a payload.

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

Mutations may also access property getters and setters and call other mutations defined on the class.

```ts
@Module
class Counter extends StoreModule {
    count = 0;
    
    get next() {
        return this.count + 1;
    }

    @Mutation
    goNext(): void {
        // Access the next getter.
        this.value = this.next;  
    }
}
```

### Getters

There are times when you need to get computed information based on the state of the store using getters. In
_Decoration_, getters are defined in two ways. Simplest as property getters and for more functionality, you can use
getter functions.

#### Property getters

Property getters are simple ECMAScript getters, which may be paired with a setter. As with Vuex getters, they may not
alter the state, but can read any part of it. They may also access other getters, both properties and functions.

```ts
@Module
class Counter extends StoreModule {
    count = 0;
    
    get next() {
        return this.count + 1;
    }

    get square() {
        return this.count * this.count;
    }

    get halfSquare() {
        // Accessing the square getter
        return this.square / 2;
    }
}
```

#### Getter functions

Sometimes you need to provide more information to a getter to complete its calculation. This is where getter functions
come in.  In _Decoration_, getter methods are decorated with `@Getter`. They may to read the state and call other
getters, but may take inputs to complete their job.

```ts
@Module
class Counter extends StoreModule {
    count = 3;

    @Getter
    pow(by: number) {
        return this.count ** pow;
    }
}

const counter = new Counter({ store });

console.log(counter.pow(2)); // 9
```

The same rules that apply to getter properties apply to getter functions.

### Setters

If you want to make a getter property read and write; you will have to provide a setter for that property. Setters are
just property setters that have been registered as a mutation in Vuex. They also must follow the same rules as mutations
but will provide an improved experience when used.

```ts
@Module
class Counter extends StoreModule {
    count = 0;
    
    get next() {
        return this.count + 1;
    }
    
    get at(): number {
        return this.count;  
    }
    
    set at(value: number) {
        this.count = value;  
    }
}

const counter = new Counter({ store });
counter.at = 7;

console.log(counter.at); // 7
```

### Actions

Actions in _Decoration_ work the same as in Vuex with little difference. In _Decoration_, actions are decorated with
`@Action`. They can read the state, use getters, call mutations, and assign to properties that use setters. They can
also call other actions. As with Vuex, actions may be asynchronous and must return a `Promise`.

```ts
@Module
class Counter extends StoreModule {
    count = 0;
    
    get next() {
        return this.count + 1;
    }
    
    get at(): number {
        return this.count;  
    }
    
    set at(value: number) {
        this.count = value;  
    }

    @Action
    async getServerValue(): Promise<number> {
        const newCount = await fetch("https://example.com/count");
        this.at = newCount;

        return newCount;
    }
}

const counter = new Counter({ store });

// If the server returns 5, then log will print 5.
counter.getServerValue().then(value => console.log(value));
```

### Local Functions

Vuex modules are meant to provide a source of truth for your application state, but can also do the same for any logic
related to that state. _Decoration_ allows the use of undecorated methods with the module class for such a purpose.
These local functions may be used to write common logic used by other parts of the store.

```ts
@Module
class Counter extends StoreModule {
    count = 0;
    
    get next() {
        return this.count + 1;
    }
    
    get at(): number {
        return this.count;  
    }
    
    set at(value: number) {
        this.count = value;  
    }
    
    @Action
    async syncWithServer(): Promise<number> {
        this.at = await this.getServerValue();  
    }

    @Action
    async isInSyncWithServer(): Promise<boolean> {
      const server = await this.getServerValue();
      
      return server === this.at;
    }

    private getServerValue(): Promise<number> {
        return fetch("https://example.com/count");
    }
}
```

#### Local function caveats

Although local functions can be powerful; and may use other public functions, there are a few caveats to be aware of
using local functions.

- **Local functions cannot be called publicly**

  They may only be used by other methods in the class and should be marked `private`.

- **Local functions must obey the same rules as the caller**

  For example; if you call a local function within a mutation, that function cannot call an action.

### Watchers

Watches provide a more straight forward means to watch any specific state on a module. Simply decorate a function with
`@Watch` and provide it with the path of the state to watch. You may provide additional options from
[Vue `vm.$watch` method](https://vuejs.org/v2/api/#vm-watch).

```ts
@Module
class Counter extends StoreModule {
    count = 0;
    
    get at(): number {
        return this.count;  
    }
    
    set at(value: number) {
        this.count = value;  
    }

    @Watch("count")
    onCountChanged(value: number) {
        console.log(value);
    }
}
```

#### Watcher caveats

Watchers may provide powerful capabilities, but may be better served by other functions of a module. The following
caveats should be considered when using watchers.

- **Watchers may not be directly called any other member of the class**
- Even though watchers receive the public interface, **watchers should not call anything on `this`**

Watchers are best used for debugging, logging, and back-end storage features. Setters, mutations, and actions should be
used to handle most other use-cases.

### Inheritance

A module may inherit functionality from another class, provided that it eventually inherits `StoreModule`. It is
currently untested whether the base classes may be decorated with `@Module`, but the bottom most class that will be
registered with the Vuex store must be. All members in the base classes should be decorated based on their indented use
case.

```ts
// Not decorated
class BaseModule<T extends object> extends StoreModule {
    items: T[];
    current: T;
    
    @Mutation
    show(item: T) { this.current = item }
    
    @Mutation
    refresh(items: T[]) { this.items = items }

    @Action
    async get(id: string): Promise<T> { this.show(await this.query({ id })[0])  }

    @Action
    async all(selector: Partial<T>) { this.refresh(await this.query()) }

    @Action
    async query(selector: Partial<T>): Promise<T[]> { /* ... */ }
}

@Module
class ProductModule extends BaseModule<Product> {
    
}

const products = new ProductModule({ store });
```

## Options

### Module options

The following options may be provided when decorating a class as a module.

```ts
export interface ModuleOptions {
  /** Makes the state publicly mutable by defining setters for each top level property */
  openState?: boolean;
}
```

#### Open state modules

An open state module is a module that allows directly mutating the state publicly or from actions. This is done by
registering mutations for each top level field of the class. This provides a simple and convenient means to expose the
module state to alteration, but lessens the safety of have a protected state must be altered with explicit setters and
mutations.

```ts
@Module({ openState: true })
class Counter extends StoreModule {
    count = 0;
    
    @Action
    async syncWithServer(): Promise<number> {
        this.count = await fetch(/* ... */);
    }
}

const counter = new Counter({ store });

console.log(counter.count); // 0
counter.count = 5;
console.log(counter.count); // 5
```

##### Open state caveats

Although having an open state is useful, it is only effective for top-level properties. Any properties of objects at the
top-level of the module will still be protected by Vuex.

```ts
@Module({ openState: true })
class Counter extends StoreModule {
    data = {
      count: 0,
      lastUpdated: now(),
    };
    
    @Action
    async syncWithServer(): Promise<number> {
        // ERROR! Cannot modify state outside of a mutation
        this.data.count = await fetch(/* ... */);
    }
}

const counter = new Counter({ store });

console.log(counter.count); // 0
// ERROR! Cannot modify state outside of a mutation
counter.data.count = 5;
console.log(counter.count); // 0
```

In general, open state should be avoided except on simplest of modules.

### Register options

The following options can or must be provided when instantiating a module. At minimal, the `store` must be provided.

```ts
export interface RegisterOptions {
    /** The store to which the module will be registered */
    store: Store<any>;
    /** Optionally rename the module; otherwise, its class name and a unique ID are used */
    name?: string;
}
```

## Access restrictions

To maintain the safety and features of Vuex module when defining them with _Decoration_, certain members of a module may
be off limits when interacted with publicly or from decorated methods. The following methods will only have access to
the listed features.

- **Public consumer**

  Can read the state and call all other methods except local functions or watchers.

- **Getters**

  Can do the following

    - Read the state.
    - Use other properties with getters.
    - Call other getter methods.

- **Mutations and setters**

  Can do the following

    - Read and alter the state at any level.
    - Use properties with getters.
    - Call getter methods.
    - Use other properties with setters.
    - Call other mutations.

- **Actions**

  Can do the following

    - Read the state
    - Use properties with getters and call getter methods.
    - Use properties with setters and call mutations.
    - Call other actions.

  If the module is open state, then altering the top-level of the state is possible.

- **Local functions**

  Must abide to the same limits as the caller.

- **Watchers**

  Has access to the public interface, but should avoid interacting with the module.

## Version 2 breaking changes

- To support any version of Vuex, it is now a peer dependency and must be installed manually.
- Mapper support removed.
- Using decorated module from Vuex `state`, `getters`, `commit`, or `dispatch` is not longer supported. Modules should
  be used directly.
- Watchers no longer support array indices.

## Acknowledgements

- Inspired by [Vuex Class Modules](https://github.com/championswimmer/vuex-module-decorators).
- Uses the following development tools:
    - The [TypeScript](https://www.typescriptlang.org/) language
    - [NYC](https://istanbul.js.org/)
    - [Awa](https://github.com/avajs/ava) testing framework
    - [ESLint](https://eslint.org/) pluggable linter
    - [Husky](https://typicode.github.io/husky/#/) for easy Git hooks.
    - [Rollup.js](https://rollupjs.org/) package bundler.

## Roadmap

There is currently no roadmap per se for _Decoration_, but the [PLANS](PLANS.md) file tracks ideas for the future of
_Decoration_. If an issue was filed, it may appear in the plans file.
