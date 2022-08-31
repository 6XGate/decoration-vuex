import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { getModuleName, Module, StoreModule } from '../src'

@Module
class RenamedModule extends StoreModule {
  value = 5
}

Vue.use(Vuex)

const store = new Store<{ myModule: RenamedModule }>({})
const module = new RenamedModule({ store, name: 'myModule' })

test('Using custom module name', () => {
  expect(store.state.myModule instanceof RenamedModule).toBe(true)
  expect(getModuleName(store.state.myModule)).toBe('myModule')
  expect(getModuleName(module)).toBe('myModule')
  expect(module.value).toBe(5)
})
