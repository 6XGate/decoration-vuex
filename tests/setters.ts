import storeTest from 'ava'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Mutation, Action, Module, StoreModule } from '../src'
import type { TestInterface } from 'ava'

@Module
class SetterModule extends StoreModule {
  value = 5

  get x (): number {
    return this.value
  }

  set x (value: number) {
    this.value = value
  }

  get goodSetter (): number {
    return this.x
  }

  set goodSetter (value: number) {
    this.x = value
  }

  get goodMutate (): number {
    return this.x
  }

  set goodMutate (value: number) {
    this.make(value)
  }

  get badAction (): number {
    return this.x
  }

  set badAction (value: number) {
    this.tryMake(value).catch(_error => undefined)
  }

  @Mutation
  make (by: number): void { this.value = by }

  @Action
  tryMake (by: number): Promise<void> {
    return Promise.resolve(this.make(by))
  }
}

const test = storeTest as TestInterface<{
  store: Store<unknown>;
  module: SetterModule;
}>

test.before(t => {
  Vue.use(Vuex)

  const store = new Store({})
  const module = new SetterModule({ store })

  t.context = { store, module }
})

test('Setting by setter', t => {
  t.notThrows(() => { t.context.module.x = 6 })

  t.is(t.context.module.x, 6)
})

test('Setter calling setter', t => {
  t.notThrows(() => { t.context.module.goodSetter = 7 })

  t.is(t.context.module.goodSetter, 7)
})

test('Setter calling mutation', t => {
  t.notThrows(() => { t.context.module.goodMutate = 8 })

  t.is(t.context.module.goodMutate, 8)
})

test('Setter calling action', t => {
  t.throws(
    () => { t.context.module.badAction = 9 },
    { instanceOf: Error, message: /^\[decoration-vuex\]: Calling action/u }
  )

  t.is(t.context.module.badAction, 8)
})
