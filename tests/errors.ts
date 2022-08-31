import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Action, getLogger, Getter, Module, Mutation, ObservableLogger, setLogger, StoreModule, Watch } from '../src'
import { ignore } from './utils/utils'

Vue.use(Vuex)

const store = new Store({})

test("Changing method type: wasn't getter", () => {
  expect(() => {
    class Base extends StoreModule {
      @Action
      time (): Promise<void> {
        ignore(this)

        return Promise.resolve(undefined)
      }
    }

    @Module
    class Derived extends Base {
      // @ts-expect-error Changing member type
      override get time (): number {
        ignore(this)

        return Math.random() * 2
      }
    }

    ignore(new Derived({ store }))
  }).toThrow('[decoration-vuex]: Previous member time was action and cannot be changed')
})

test("Changing method type: wasn't accessor", () => {
  expect(() => {
    class Base extends StoreModule {
      @Action
      time (): Promise<void> {
        ignore(this)

        return Promise.resolve(undefined)
      }
    }

    @Module
    class Derived extends Base {
      @Getter
      // @ts-expect-error Changing member type
      override time (): number {
        ignore(this)

        return Math.random() * 2
      }
    }

    ignore(new Derived({ store }))
  }).toThrow('[decoration-vuex]: Previous member time was action and cannot be changed')
})

test("Changing method type: wasn't mutation", () => {
  expect(() => {
    class Base extends StoreModule {
      @Action
      time (): Promise<void> {
        ignore(this)

        return Promise.resolve(undefined)
      }
    }

    @Module
    class Derived extends Base {
      @Mutation
      // @ts-expect-error Changing member type
      override time (): void {
        ignore(this)
      }
    }

    ignore(new Derived({ store }))
  }).toThrow('[decoration-vuex]: Previous member time was action and cannot be changed')
})

test("Changing method type: wasn't action", () => {
  expect(() => {
    class Base extends StoreModule {
      @Mutation
      time (): void {
        ignore(this)
      }
    }

    @Module
    class Derived extends Base {
      @Action
      override time (): Promise<void> {
        ignore(this)

        return Promise.resolve(undefined)
      }
    }

    ignore(new Derived({ store }))
  }).toThrow('[decoration-vuex]: Previous member time was mutation and cannot be changed')
})

test("Changing method type: wasn't watcher", () => {
  expect(() => {
    class Base extends StoreModule {
      test = 2

      @Mutation
      time (): void {
        ignore(this)
      }
    }

    @Module
    class Derived extends Base {
      @Watch('test')
      // @ts-expect-error Changing member type
      override time (_value: number, _old: number): void {
        ignore(this)
      }
    }

    ignore(new Derived({ store }))
  }).toThrow('[decoration-vuex]: Previous member time was mutation and cannot be changed')
})

test("Changing method type: wasn't local", () => {
  expect(() => {
    class Base extends StoreModule {
      test = 2

      @Mutation
      time (): void {
        ignore(this)
      }
    }

    @Module
    class Derived extends Base {
      override time (): void {
        ignore(this)
      }
    }

    ignore(new Derived({ store }))
  }).toThrow('[decoration-vuex]: Previous member time was mutation and cannot be changed')
})

test('Non function or getter on prototype chain', cb => {
  expect.hasAssertions()

  const original = getLogger()
  try {
    const logger = new ObservableLogger()
    logger.on('message', event => {
      expect(event.name).toBe('message')
      expect(event.args.level).toBe('warn')
      expect((event.args['...data'] as string[]).join(' ')).toMatch(/^\[decoration-vuex\]: Module prototype has property /u)

      cb()
    })

    setLogger(logger)

    class Base extends StoreModule {
      test!: undefined | number

      @Mutation
      time (): void {
        ignore(this)
      }
    }

    Base.prototype.test = 2

    @Module
    class Derived extends Base {
      @Mutation
      override time (): void {
        ignore(this)
      }
    }

    ignore(new Derived({ store }))
  } finally {
    setLogger(original)
  }
})

test('Not derived from StoreModule', () => {
  expect(() => {
    class Base {
      // @ts-expect-error Not derived from StoreModule
      @Mutation
      time (): void {
        ignore(this)
      }
    }

    // @ts-expect-error Not derived from StoreModule
    @Module
    class Derived extends Base {
      // @ts-expect-error Not derived from StoreModule
      @Mutation
      override time (): void {
        ignore(this)
      }
    }

    // @ts-expect-error Not derived from StoreModule
    ignore(new Derived({ store }))
  }).toThrow('[decoration-vuex]: Module class must be derived from StoreModule')
})

test('Module registered twice', () => {
  expect(() => {
    @Module
    class Derived extends StoreModule {
      @Mutation
      time (): void {
        ignore(this)
      }
    }

    ignore(new Derived({ store, name: 'Derived' }))
    ignore(new Derived({ store, name: 'Derived' }))
  }).toThrow(/^\[decoration-vuex\]: Module /u)
})

test('Module registered twice, without name is okay', () => {
  @Module
  class Derived extends StoreModule {
    @Mutation
    time (): void {
      ignore(this)
    }
  }

  expect(new Derived({ store })).toBeInstanceOf(Derived)
  expect(new Derived({ store })).toBeInstanceOf(Derived)
})

test('Bad decoration: getter', () => {
  expect(() => {
    @Module
    class BadModule extends StoreModule {
      // @ts-expect-error Bad decoration
      @Getter
        value = 2
    }

    ignore(BadModule)
  }).toThrow('Only functions may be decorated with @Getter')
})

test('Bad decoration: mutation', () => {
  expect(() => {
    @Module
    class BadModule extends StoreModule {
      // @ts-expect-error Bad decoration
      @Mutation
        value = 2
    }

    ignore(BadModule)
  }).toThrow('Only functions may be decorated with @Mutation')
})

test('Bad decoration: action', () => {
  expect(() => {
    @Module
    class BadModule extends StoreModule {
      // @ts-expect-error Bad decoration
      @Action
        value = 2
    }

    ignore(BadModule)
  }).toThrow('Only functions may be decorated with @Action')
})

test('Bad decoration: watch', () => {
  expect(() => {
    @Module
    class BadModule extends StoreModule {
      // @ts-expect-error Bad decoration
      @Watch('value')
        value = 2
    }

    ignore(BadModule)
  }).toThrow('Only functions may be decorated with @Watch')
})

test('No such property', () => {
  expect(() => {
    @Module
    class GoodModule extends StoreModule {
      value = 2
    }

    const goodModule = new GoodModule({ store })

    // @ts-expect-error No such property
    goodModule.count = 2
  }).toThrow('[decoration-vuex]: Cannot add or modify property count of store.')
})
