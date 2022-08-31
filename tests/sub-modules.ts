import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Module, Mutation, ObservableLogger, StoreModule, Watch } from '../src'
import type { RegisterOptions, LoggerEvent } from '../src'

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

const main = new MainModule({ store })

test('submodule descriptor', () => {
  const descriptor = Object.getOwnPropertyDescriptor(main, 'subModule')
  const subModule = main.subModule

  expect(descriptor).toBeTruthy()
  if (descriptor) {
    expect(descriptor.configurable).toBe(false)
    expect(descriptor.enumerable).toBe(false)
    expect(descriptor.writable).toBe(false)
    expect(descriptor.value).toBe(subModule)
  }

  expect(() => {
    // @ts-expect-error Trying to reassign this to test immutability
    main.subModule = 5
  }).toThrowError({
    instanceOf: TypeError,
    message: '[decoration-vuex]: Sub-module reference subModule is immutable'
  })

  expect(main.subModule).toBe(subModule)

  expect.assertions(7)
})

test('main descriptor, cyclic references', () => {
  const descriptor = Object.getOwnPropertyDescriptor(main.subModule, 'main')
  const innerMain = main.subModule.main

  expect(descriptor).toBeTruthy()
  if (descriptor) {
    expect(descriptor.configurable).toBe(false)
    expect(descriptor.enumerable).toBe(false)
    expect(descriptor.writable).toBe(false)
    expect(descriptor.value).toBe(innerMain)
  }

  expect(() => {
    // @ts-expect-error Trying to reassign this to test immutability
    innerMain.subModule.main = 5
  }).toThrow('[decoration-vuex]: Sub-module reference main is immutable')

  expect(innerMain.subModule.main).toBe(innerMain)

  expect.assertions(7)
})

test('read heir state', () => new Promise<void>(resolve => {
  expect(main.value).toBe(6)
  expect(main.subModule.value).toBe(5)
  expect(main.subModule.main.value).toBe(6)

  const onLog = (log: LoggerEvent): void => {
    expect(log.name).toBe('log')
    expect(log.args['...data']).toEqual([7])
    logger.off('log', onLog)

    resolve()
  }

  logger.on('log', onLog)

  main.subModule.inc(2)

  expect(main.subModule.value).toBe(7)
}))
