import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Mutation, Action, Module, StoreModule } from '../src'

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

Vue.use(Vuex)

const store = new Store({})
const module = new SetterModule({ store })

test('Setting by setter', () => {
  expect(() => { module.x = 6 }).not.toThrow()

  expect(module.x).toBe(6)
})

test('Setter calling setter', () => {
  expect(() => { module.goodSetter = 7 }).not.toThrow()

  expect(module.goodSetter).toBe(7)
})

test('Setter calling mutation', () => {
  expect(() => { module.goodMutate = 8 }).not.toThrow()

  expect(module.goodMutate).toBe(8)
})

test('Setter calling action', () => {
  expect(() => { module.badAction = 9 })
    .toThrow(/^\[decoration-vuex\]: Calling action/u)

  expect(module.badAction).toBe(8)
})
