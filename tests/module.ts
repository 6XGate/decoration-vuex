import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { getModuleName, Module, StoreModule } from '../src'
import type { RegisterOptions } from '../src'

@Module
class TestModule extends StoreModule {
  value: number

  constructor (options: RegisterOptions, initialValue = 0) {
    super(options)

    this.value = initialValue
  }
}

Vue.use(Vuex)

const store = new Store<{ [key: string]: TestModule }>({})
const module = new TestModule({ store }, 5)

test('create', () => {
  const name = getModuleName(module)
  expect(store.state[name]).toBeInstanceOf(TestModule)
  expect(getModuleName(store.state[name] as TestModule)).toMatch(/TestModule#\d+/u)
  expect(getModuleName(module)).toMatch(/TestModule#\d+/u)
})

test('state', () => {
  expect(module.value).toBe(5)
})
