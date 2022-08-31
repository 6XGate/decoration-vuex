import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Module, StoreModule } from '../src'

const kValue = Symbol('value')

@Module
class SymbolModule extends StoreModule {
  [kValue] = 5
}

Vue.use(Vuex)

const store = new Store({})
const module = new SymbolModule({ store })

test('Getting symbol property', () => {
  expect(module[kValue]).toBe(5)
})

test('Setting symbol property', () => {
  module[kValue] = 7

  expect(module[kValue]).toBe(7)
})
