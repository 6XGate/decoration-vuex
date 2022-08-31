import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Getter, Mutation, Action, Module, StoreModule } from '../src'

class BaseActionModule extends StoreModule {
  value = 5

  get x (): number {
    return this.value
  }

  set x (value: number) {
    this.value = value
  }

  @Getter
  getX (): number {
    return this.value
  }

  @Mutation
  setX (value: number): void {
    this.value = value
  }

  @Action
  tryGetValue (): Promise<number> {
    return Promise.resolve(this.value)
  }

  @Action
  trySetValue (value: number): Promise<void> {
    return new Promise(resolve => { this.value = value; resolve() })
  }

  @Action
  tryGetX (): Promise<number> {
    return Promise.resolve(this.x)
  }

  @Action
  trySetX (value: number): Promise<void> {
    return new Promise(resolve => { this.x = value; resolve() })
  }

  @Action
  tryAccessX (): Promise<number> {
    return Promise.resolve(this.getX())
  }

  @Action
  tryMutateX (value: number): Promise<void> {
    return new Promise(resolve => { this.setX(value); resolve() })
  }

  @Action
  tryMultiplyToX (left: number, right: number): Promise<void> {
    return new Promise(resolve => { this.setX(left * right); resolve() })
  }
}

@Module
class ClosedStateActionModule extends BaseActionModule { }

@Module({ openState: true })
class OpenStateActionModule extends BaseActionModule { }

Vue.use(Vuex)

const store = new Store({})
const closed = new ClosedStateActionModule({ store })
const open = new OpenStateActionModule({ store })

test('Getting value', async () => {
  await expect(closed.tryGetValue()).resolves.toBe(closed.value)
  expect(closed.value).toBe(5)
})

test('Setting value in closed state', async () => {
  await expect(closed.trySetValue(6)).rejects
    .toThrow(/^\[decoration-vuex\]: Cannot modify the state outside mutations/u)

  await expect(closed.tryGetValue()).resolves.toBe(closed.value)
  expect(closed.value).toBe(5)
})

test('Setting value in open state', async () => {
  await expect(open.trySetValue(7)).resolves.toBeUndefined()
  await expect(open.tryGetValue()).resolves.toBe(open.value)
  expect(open.value).toBe(7)
})

test('Getting value by getter', async () => {
  const expected = await closed.tryGetValue()
  await expect(closed.tryGetX()).resolves.toBe(expected)
})

test('Setting value in action by setter', async () => {
  await expect(closed.trySetX(9)).resolves.toBeUndefined()
  await expect(closed.tryGetX()).resolves.toBe(9)
})

test('Getting value by accessor', async () => {
  const expected = await closed.tryAccessX()
  await expect(closed.tryGetValue()).resolves.toBe(expected)
})

test('Setting value in action by mutation', async () => {
  await expect(closed.tryMutateX(11)).resolves.toBeUndefined()
  await expect(closed.tryGetX()).resolves.toBe(11)
})

test('Setting value in action with inputs', async () => {
  await expect(closed.tryMultiplyToX(11, 12)).resolves.toBeUndefined()
  await expect(closed.tryGetX()).resolves.toBe(11 * 12)
})
