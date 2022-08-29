import storeTest from 'ava'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Module, Mutation, ObservableLogger, StoreModule, Watch } from '../src'
import type { RegisterOptions, LoggerEvent } from '../src'
import type { TestInterface } from 'ava'

function makeContext () {
  Vue.use(Vuex)

  const store = new Store({})

  const logger = new ObservableLogger()

  @Module
  class SubModule extends StoreModule {
    main: MainModule
    value = 5

    constructor (options: RegisterOptions, main: MainModule) {
      super(options)
      this.main = main
    }

    @Watch('value')

    onValueChanged (val: number): void {
      logger.log(val)
    }

    @Mutation
    inc (by: number): void {
      this.value += by
    }
  }

  @Module({ openState: true })
  class MainModule extends StoreModule {
    subModule = new SubModule({ store }, this)
    value = 6

    @Watch('value')

    onValueChanged (val: number): void {
      logger.log(val)
    }
  }

  return {
    store,
    logger,
    main: new MainModule({ store })
  }
}

const test = storeTest as TestInterface<ReturnType<typeof makeContext>>

test.before(t => {
  t.context = makeContext()
})

test('submodule descriptor', t => {
  const descriptor = Object.getOwnPropertyDescriptor(t.context.main, 'subModule')
  const subModule = t.context.main.subModule

  t.truthy(descriptor)
  if (descriptor) {
    t.false(descriptor.configurable)
    t.false(descriptor.enumerable)
    t.false(descriptor.writable)
    t.is(descriptor.value, subModule)
  }

  t.throws(() => {
    // @ts-expect-error Trying to reassign this to test immutability
    t.context.main.subModule = 5
  }, {
    instanceOf: TypeError,
    message: '[decoration-vuex]: Sub-module reference subModule is immutable'
  })

  t.is(t.context.main.subModule, subModule)

  t.plan(7)
})

test('main descriptor, cyclic references', t => {
  const descriptor = Object.getOwnPropertyDescriptor(t.context.main.subModule, 'main')
  const main = t.context.main.subModule.main

  t.truthy(descriptor)
  if (descriptor) {
    t.false(descriptor.configurable)
    t.false(descriptor.enumerable)
    t.false(descriptor.writable)
    t.is(descriptor.value, main)
  }

  t.throws(() => {
    // @ts-expect-error Trying to reassign this to test immutability
    t.context.main.subModule.main = 5
  }, {
    instanceOf: TypeError,
    message: '[decoration-vuex]: Sub-module reference main is immutable'
  })

  t.is(t.context.main.subModule.main, main)

  t.plan(7)
})

test('read heir state', t => new Promise(resolve => {
  t.is(t.context.main.value, 6)
  t.is(t.context.main.subModule.value, 5)
  t.is(t.context.main.subModule.main.value, 6)

  const onLog = (log: LoggerEvent): void => {
    t.is(log.name, 'log')
    t.deepEqual(log.args['...data'], [7])
    t.context.logger.off('log', onLog)

    resolve()
  }

  t.context.logger.on('log', onLog)

  t.context.main.subModule.inc(2)

  t.is(t.context.main.subModule.value, 7)
}))
