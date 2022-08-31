import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Mutation, Action, Module, StoreModule } from '../src'

@Module
class GetterModule extends StoreModule {
  value = 5

  get x (): number { return this.value }

  get sqr (): number { return this.value * this.value }

  get goodUsingGetter (): number {
    return this.x
  }

  get badUsingMutation (): number {
    this.inc()

    return 0
  }

  get badUsingAction (): number {
    this.tryInc().catch(_error => undefined)

    return 0
  }

  @Mutation
  inc (): void { this.value++ }

  @Action
  tryInc (): Promise<void> {
    return Promise.resolve(this.inc())
  }
}

Vue.use(Vuex)

const store = new Store({})
const module = new GetterModule({ store })

test('Getting basic value', () => {
  expect(module.x).toBe(5)
})

test('Getting computed value', () => {
  expect(module.sqr).toBe(25)
})

test('Getter calling getter', () => {
  expect(module.goodUsingGetter).toBe(5)
})

test('Getter calling mutation', () => {
  const value = module.value
  expect(() => { console.log(module.badUsingMutation) })
    .toThrow(/^\[decoration-vuex\]: Calling mutation/u)

  expect(module.value).toBe(value)
})

test('Getter calling action', () => {
  const value = module.value
  expect(() => { console.log(module.badUsingAction) })
    .toThrow(/^\[decoration-vuex\]: Calling action/u)

  expect(module.value).toBe(value)
})
