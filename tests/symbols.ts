import storeTest from 'ava'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Module, StoreModule } from '../src'
import type { TestInterface } from 'ava'

const kValue = Symbol('value')

@Module
class SymbolModule extends StoreModule {
  [kValue] = 5
}

const test = storeTest as TestInterface<{
  store: Store<unknown>;
  module: SymbolModule;
}>

test.before(t => {
  Vue.use(Vuex)

  const store = new Store({})
  const module = new SymbolModule({ store })

  t.context = { store, module }
})

test('Getting symbol property', t => {
  t.is(t.context.module[kValue], 5)
})

test('Setting symbol property', t => {
  t.context.module[kValue] = 7

  t.is(t.context.module[kValue], 7)
})
