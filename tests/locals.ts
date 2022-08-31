import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Getter, Mutation, Action, Module, StoreModule } from '../src'
import { ignore } from './utils/utils'

class BaseLocalModule extends StoreModule {
  value = 5

  get x (): number {
    return this.coreGetValue()
  }

  set x (value: number) {
    this.coreSetValue(value)
  }

  @Getter
  getValue (): number {
    return this.coreGetValue()
  }

  @Mutation
  setValue (value: number): void {
    this.coreSetValue(value)
  }

  @Mutation
  setValueBy (x: number, y: number): void {
    this.coreSetValueBy(x, y)
  }

  @Action
  tryGetValue (): Promise<number> {
    return Promise.resolve(this.coreGetValue())
  }

  @Action
  trySetValue (value: number): Promise<void> {
    return new Promise(resolve => { this.coreSetValue(value); resolve() })
  }

  coreGetValue (): number {
    // Direct state read
    return this.value
  }

  coreSetValue (value: number): void {
    // Direct state write
    this.value = value
  }

  coreSetValueBy (x: number, y: number): void {
    // Direct state write
    this.value = x * y
  }
}

@Module
class ClosedLocalModule extends BaseLocalModule {
  @Getter
  getX (): number {
    return this.coreGetX()
  }

  @Mutation
  setX (value: number): void {
    this.coreSetX(value)
  }

  @Action
  tryGetX (): Promise<number> {
    return Promise.resolve(this.coreGetX())
  }

  @Action
  trySetX (value: number): Promise<void> {
    return new Promise(resolve => { this.coreSetX(value); resolve() })
  }

  @Action
  tryAccessX (): Promise<number> {
    return Promise.resolve(this.coreAccessX())
  }

  @Action
  tryMutateX (value: number): Promise<void> {
    return new Promise(resolve => { this.coreMutateX(value); resolve() })
  }

  @Action
  actionGetX (): Promise<number> {
    return this.coreTryGetX()
  }

  @Action
  actionSetX (value: number): Promise<void> {
    return this.coreTrySetX(value)
  }

  coreGetX (): number {
    // Read by getter
    return this.x
  }

  coreSetX (value: number): void {
    // Write by setter
    this.x = value
  }

  coreAccessX (): number {
    return this.getX()
  }

  coreMutateX (value: number): void {
    return this.setX(value)
  }

  coreTryGetX (): Promise<number> {
    return this.tryGetX()
  }

  coreTrySetX (value: number): Promise<void> {
    return this.trySetX(value)
  }

  get badWriting (): number {
    this.coreSetValue(1)

    return this.coreGetValue()
  }

  get badSetting (): number {
    this.coreSetX(1)

    return this.coreGetX()
  }

  get badMutating (): number {
    this.coreMutateX(1)

    return this.coreAccessX()
  }

  get badActing (): number {
    this.coreTrySetX(1).catch(_error => undefined)

    return this.coreGetX()
  }

  @Getter
  failWriting (): number {
    this.coreSetValue(1)

    return this.coreGetValue()
  }

  @Getter
  failSetting (): number {
    this.coreSetX(1)

    return this.coreGetX()
  }

  @Getter
  failMutating (): number {
    this.coreMutateX(1)

    return this.coreAccessX()
  }

  @Getter
  failActing (): number {
    this.coreTrySetX(1).catch(_error => undefined)

    return this.coreGetX()
  }

  @Mutation
  mutantActingUp (): void {
    this.coreTrySetX(1).catch(_error => undefined)
  }
}

@Module({ openState: true })
class OpenLocalModule extends BaseLocalModule { }

Vue.use(Vuex)

const store = new Store({})
const closed = new ClosedLocalModule({ store })
const open = new OpenLocalModule({ store })

test('Direct local function call', () => {
  expect(() => { closed.coreGetValue() })
    .toThrow(/^\[decoration-vuex\]: Calling local function/u)
})

test('Getting value via accessors', () => {
  expect(closed.x).toBe(5)
})

test('Setting value via accessors', () => {
  expect(closed.x = 6).toBe(6)
  expect(closed.x).toBe(6)
})

test('Accessing value', () => {
  expect(closed.getValue()).toBe(6)
})

test('Mutating value', () => {
  expect(() => closed.setValue(7)).not.toThrow()
  expect(closed.getValue()).toBe(7)
})

test('Multiply value via mutator', () => {
  expect(() => closed.setValueBy(7, 2)).not.toThrow()
  expect(closed.getValue()).toBe(7 * 2)
})

test('Action accessing value', async () => {
  await expect(closed.tryGetValue()).resolves.toBe(7 * 2)
})

test('Action mutating value in closed state', async () => {
  await expect(closed.trySetValue(8))
    .rejects.toThrow(/^\[decoration-vuex\]: Cannot modify the state outside mutations/u)
  await expect(closed.tryGetValue()).resolves.toBe(7 * 2)
})

test('Action mutating value in open state', async () => {
  await expect(open.tryGetValue()).resolves.toBe(5)
  await expect(open.trySetValue(7)).resolves.not.toThrow()
  await expect(open.tryGetValue()).resolves.toBe(7)
})

test('Getting X', () => {
  expect(closed.getX()).toBe(7 * 2)
})

test('Setting X', () => {
  expect(() => { closed.setX(8) }).not.toThrow()
  expect(closed.getX()).toBe(8)
})

test('Action getting X', async () => {
  await expect(closed.tryGetX()).resolves.toBe(8)
})

test('Action setting X', async () => {
  await expect(closed.trySetX(9)).resolves.not.toThrow()
  await expect(closed.tryGetX()).resolves.toBe(9)
})

test('Action accessing X', async () => {
  await expect(closed.tryAccessX()).resolves.toBe(9)
})

test('Action mutating X', async () => {
  await expect(closed.tryMutateX(10)).resolves.not.toThrow()
  await expect(closed.tryAccessX()).resolves.toBe(10)
})

test('Action using action to get X', async () => {
  await expect(closed.actionGetX()).resolves.toBe(10)
})

test('Action using action to set X', async () => {
  await expect(closed.actionSetX(11)).resolves.not.toThrow()
  await expect(closed.actionGetX()).resolves.toBe(11)
})

test('Writing through getter', () => {
  expect(() => { ignore(closed.badWriting) })
    .toThrow(/^\[decoration-vuex\]: Cannot modify the state outside mutations/u)
})

test('Setting through getter', () => {
  expect(() => { ignore(closed.badSetting) })
    .toThrow(/^\[decoration-vuex\]: Calling setter for/u)
})

test('Mutating through getter', () => {
  expect(() => { ignore(closed.badMutating) })
    .toThrow(/^\[decoration-vuex\]: Calling mutation/u)
})

test('Acting through getter', () => {
  expect(() => { ignore(closed.badActing) })
    .toThrow(/^\[decoration-vuex\]: Calling action/u)
})

test('Writing through accessor', () => {
  expect(() => { closed.failWriting() })
    .toThrow(/^\[decoration-vuex\]: Cannot modify the state outside mutations/u)
})

test('Setting through accessor', () => {
  expect(() => { closed.failSetting() })
    .toThrow(/^\[decoration-vuex\]: Calling setter for/u)
})

test('Mutating through accessor', () => {
  expect(() => { closed.failMutating() })
    .toThrow(/^\[decoration-vuex\]: Calling mutation/u)
})

test('Acting through accessor', () => {
  expect(() => { closed.failActing() })
    .toThrow(/^\[decoration-vuex\]: Calling action/u)
})

test('Acting through mutation', () => {
  expect(() => { closed.mutantActingUp() })
    .toThrow(/^\[decoration-vuex\]: Calling action/u)
})
