import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { Getter, Mutation, Action, Module, StoreModule } from '../src'

@Module
class SetterModule extends StoreModule {
  value = 5

  get x (): number {
    return this.value
  }

  set x (value: number) {
    this.value = value
  }

  @Getter

  getMagic (): number {
    return 15
  }

  @Getter
  getX (): number {
    return this.value
  }

  @Mutation
  setX (value: number): void {
    this.value = value
  }

  @Mutation
  setWith (x: number, y: number): void {
    this.value = x * y
  }

  @Mutation
  readsState (): void { this.value = this.value * 2 }

  @Mutation
  callsGetter (): void { this.value = this.x * 2 }

  @Mutation
  callsAccessor (): void { this.value = this.getMagic() }

  @Mutation
  callsSetter (value: number): void { this.x = value }

  @Mutation
  callsMutation (value: number): void { this.setX(value) }

  @Mutation
  callsAction (value: number): void { this.tryMake(value).catch(_error => undefined) }

  @Action
  tryMake (value: number): Promise<void> {
    return Promise.resolve(this.setX(value))
  }
}

Vue.use(Vuex)

const store = new Store({})
const module = new SetterModule({ store })

test('Mutation with value', () => {
  expect(module.value).toBe(5)
  expect(() => { module.setX(8) }).not.toThrow()

  expect(module.value).toBe(module.x)
  expect(module.x).toBe(8)
})

test('Mutation with inputs', () => {
  expect(() => { module.setWith(5, 2) }).not.toThrow()

  expect(module.value).toBe(5 * 2)
})

test('Mutation reads state', () => {
  const value = module.value
  expect(() => { module.readsState() }).not.toThrow()

  expect(module.value).toBe(value * 2)
})

test('Mutation calls getter', () => {
  const value = module.x
  expect(() => { module.callsGetter() }).not.toThrow()

  expect(module.value).toBe(value * 2)
})

test('Mutation calls accessor', () => {
  expect(() => { module.callsAccessor() }).not.toThrow()

  expect(module.value).toBe(module.getMagic())
})

test('Mutation calls setter', () => {
  expect(() => { module.callsSetter(6) }).not.toThrow()

  expect(module.x).toBe(6)
})

test('Mutation calls mutation', () => {
  expect(() => { module.callsMutation(7) }).not.toThrow()

  expect(module.x).toBe(7)
})

test('Mutation calls action', () => {
  const value = module.x
  expect(() => { module.callsAction(8) })
    .toThrow(/^\[decoration-vuex\]: Calling action/u)

  expect(module.x).toBe(value)
})
