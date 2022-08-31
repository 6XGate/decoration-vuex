import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Getter, Mutation, Action, Module, StoreModule } from '../src'
import { ignore } from './utils/utils'

@Module
class AccessorModule extends StoreModule {
  value = 5

  get x (): number {
    return this.value
  }

  set x (value: number) {
    this.value = value
  }

  @Getter
  getX (): number {
    return this.x
  }

  @Getter
  getPow (by: number): number {
    return this.x ** by
  }

  @Getter
  getMany (first: number, second: number): [ number, number, number ] {
    return [first, second, this.x]
  }

  @Getter
  failSetter (): number {
    this.x += 5

    return this.x
  }

  @Getter
  failMutations (): number {
    this.inc()

    return this.x
  }

  @Getter
  failAction (): number {
    this.tryInc().catch(_error => undefined)

    return this.x
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
const module = new AccessorModule({ store })

test('Getting by accessor', () => {
  expect(module.getX()).toBe(5)
})

test('Getting computed value', () => {
  expect(module.getPow(3)).toBe(125)
})

test('Accessor with many inputs', () => {
  expect(module.getMany(1, 2)).toStrictEqual([1, 2, 5])
})

test('Accessor calling setter', () => {
  const value = module.value
  expect(() => { ignore(module.failSetter()) })
    .toThrow(/^\[decoration-vuex\]: Calling setter for/u)

  expect(module.value).toBe(value)
})

test('Accessor calling mutation', () => {
  const value = module.value
  expect(() => { ignore(module.failMutations()) })
    .toThrow(/^\[decoration-vuex\]: Calling mutation/u)

  expect(module.value).toBe(value)
})

test('Accessor calling action', () => {
  const value = module.value
  expect(() => { ignore(module.failAction()) })
    .toThrow(/^\[decoration-vuex\]: Calling action/u)

  expect(module.value).toBe(value)
})
