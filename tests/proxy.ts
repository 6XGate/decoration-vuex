import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Module, ObservableLogger, setLogger, StoreModule } from '../src'

@Module
class TestModule extends StoreModule {
  value!: number
  tryDelete = 2
}

TestModule.prototype.value = 2

Vue.use(Vuex)

setLogger(new ObservableLogger())

// eslint-disable-next-line @typescript-eslint/naming-convention
const store = new Store<{ TestModule: TestModule }>({})
const module = new TestModule({ store })

test('Not trapped', () => {
  expect(Reflect.isExtensible(module)).toBe(false)
  expect(() => { Object.defineProperty(module, '__test', { value: 2 }) }).toThrow()
  // @ts-expect-error Testing that delete fails
  expect(() => { delete module.tryDelete }).toThrow()
  expect(() => { Object.setPrototypeOf(module, null) }).toThrow()
})

test('Passes traps', () => {
  expect(module.value).toBe(2)
})
