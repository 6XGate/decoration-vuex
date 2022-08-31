import test from 'ava'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Module, ObservableLogger, setLogger, StoreModule } from '../src'
import type { TestInterface } from 'ava'

@Module
class TestModule extends StoreModule {
  value!: number
  tryDelete = 2
}

TestModule.prototype.value = 2

// const test = storeTest as TestInterface<{
//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   store: Store<{ TestModule: TestModule }>;
//   module: TestModule;
// }>

test.before(t => {
  Vue.use(Vuex)

  setLogger(new ObservableLogger())

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const store = new Store<{ TestModule: TestModule }>({})
  const module = new TestModule({ store })

  t.context = { store, module }
})

test('Not trapped', t => {
  t.false(Reflect.isExtensible(t.context.module))
  t.throws(() => { Object.defineProperty(t.context.module, '__test', { value: 2 }) })
  // @ts-expect-error Testing that delete fails
  t.throws(() => { delete t.context.module.tryDelete })
  t.throws(() => { Object.setPrototypeOf(t.context.module, null) })
})

test('Passes traps', t => {
  t.is(t.context.module.value, 2)
})
