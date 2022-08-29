import storeTest from 'ava'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { getModuleName, Module, StoreModule } from '../src'
import type { TestInterface } from 'ava'

@Module
class RenamedModule extends StoreModule {
  value = 5
}

const test = storeTest as TestInterface<{
  store: Store<{ myModule: RenamedModule }>;
  module: RenamedModule;
}>

test.before(t => {
  Vue.use(Vuex)

  const store = new Store<{ myModule: RenamedModule }>({})
  const module = new RenamedModule({ store, name: 'myModule' })

  t.context = { store, module }
})

test('Using custom module name', t => {
  t.true(t.context.store.state.myModule instanceof RenamedModule, 'myModule is not a RenamedModule')
  t.is(getModuleName(t.context.store.state.myModule), 'myModule')
  t.is(getModuleName(t.context.module), 'myModule')
  t.is(t.context.module.value, 5)
})
