import { test, expect } from '@jest/globals'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { getLogger, Module, Mutation, ObservableLogger, setLogger, StoreModule, Watch } from '../src'
import type { LoggerEvent } from '../src'

@Module
class WatchingModule extends StoreModule {
  value = 5
  deep = { value: 2 }

  get break (): number {
    throw new Error('break')
  }

  @Mutation
  inc (by: number): void {
    this.value += by
  }

  @Mutation
  incDeep (by: number): void {
    this.deep.value += by
  }

  @Watch('value')

  onValueChange (newValue: number): void {
    getLogger().log(newValue)
  }

  @Watch('deep.value')

  onDeepValueChange (newValue: number): void {
    getLogger().log(newValue)
  }

  @Watch('break')

  onBreakChange (newValue: number): void {
    getLogger().log(newValue)
  }
}

Vue.use(Vuex)

const logger = new ObservableLogger()
const store = new Store({})

setLogger(logger)

const module = new WatchingModule({ store })

test('Direct watcher call', () => {
  expect(() => { module.onValueChange(5) })
    .toThrow(/\[decoration-vuex\]: Watcher /u)
})

test('Trigger watcher', () => new Promise<void>(resolve => {
  try {
    const onLog = (log: LoggerEvent): void => {
      expect(log.name).toBe('log')
      expect(log.args['...data']).toEqual([6])
      logger.off('log', onLog)

      resolve()
    }

    logger.on('log', onLog)
    module.inc(1)
  } finally {
    expect.assertions(2)
  }
}))

test('Trigger deep watcher', () => new Promise<void>(resolve => {
  try {
    const onLog = (log: LoggerEvent): void => {
      expect(log.name).toBe('log')
      expect(log.args['...data']).toEqual([3])
      logger.off('log', onLog)

      resolve()
    }

    logger.on('log', onLog)
    module.incDeep(1)
  } finally {
    expect.assertions(2)
  }
}))
