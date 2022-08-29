import storeTest from 'ava'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { getModuleName, Module, StoreModule } from '../src'
import type { RegisterOptions } from '../src'
import type { TestInterface } from 'ava'

@Module
class TestModule extends StoreModule {
  value: number

  constructor (options: RegisterOptions, initialValue = 0) {
    super(options)

    this.value = initialValue
  }
}

const test = storeTest as TestInterface<{
  store: Store<{ [key: string]: TestModule }>;
  module: TestModule;
}>

test.before(t => {
  Vue.use(Vuex)

  const store = new Store<{ [key: string]: TestModule }>({})
  const module = new TestModule({ store }, 5)

  t.context = { store, module }
})

test('create', t => {
  const name = getModuleName(t.context.module)
  t.true(t.context.store.state[name] instanceof TestModule, 'TestModule is not a TestModule')
  t.regex(getModuleName(t.context.store.state[name] as TestModule), /TestModule#\d+/u)
  t.regex(getModuleName(t.context.module), /TestModule#\d+/u)
})

test('state', t => {
  t.is(t.context.module.value, 5)
})
