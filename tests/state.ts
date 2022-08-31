import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Module, StoreModule } from '../src'

class ModuleCommon extends StoreModule {
  value = 5
}

@Module
class ClosedStateModule extends ModuleCommon { }

@Module({ openState: true })
class OpenStateModule extends ModuleCommon { }

Vue.use(Vuex)

const store = new Store({})
const closed = new ClosedStateModule({ store })
const open = new OpenStateModule({ store })

test('Getting property on closed state', () => {
  expect(closed.value).toBe(5)
})

test('Setting property on closed state', () => {
  expect(() => { closed.value = 7 })
    .toThrow(/^\[decoration-vuex\]: Cannot modify the state outside mutations/u)

  expect(closed.value).toBe(5)
})

test('Getting property on open state', () => {
  expect(closed.value).toBe(5)
})

test('Setting property on open state', () => {
  expect(() => { open.value = 7 }).not.toThrow()

  expect(open.value).toBe(7)
})
