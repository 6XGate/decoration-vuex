import { test, expect } from '@jest/globals'
import { ObservableLogger } from '../src'
import type { Logger, LoggerEvent, LoggerEventHandler } from '../src'

const inner = new ObservableLogger()
const logger = new ObservableLogger(inner)

test('Logger#assert', () => {
  expect.assertions(8)

  const onTruthyAssert = (event: LoggerEvent): void => {
    expect(event.name).toBe('assert')
    expect(event.args.condition).toBeTruthy()
    expect((event.args['...data'] as unknown[]).join(' ')).toBe("won't assert")
  }

  logger.on('assert', onTruthyAssert)
  expect(() => logger.assert(true, "won't assert")).not.toThrow()
  logger.off('assert', onTruthyAssert)

  const onFalsyAssert = (event: LoggerEvent): void => {
    expect(event.name).toBe('assert')
    expect(event.args.condition).toBeFalsy()
    expect((event.args['...data'] as unknown[]).join(' ')).toBe('will assert')
  }

  logger.on('assert', onFalsyAssert)
  expect(() => logger.assert(false, 'will assert')).toThrow()
  logger.off('assert', onFalsyAssert)
})

test('Logger#count', () => {
  expect.assertions(14)

  const onFirstInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe(undefined)
    expect(event.args['[[Count]]']).toBe(1)
  }

  logger.on('count', onFirstInvoke)
  logger.count()
  logger.off('count', onFirstInvoke)

  const onSecondInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe(undefined)
    expect(event.args['[[Count]]']).toBe(2)
  }

  logger.on('count', onSecondInvoke)
  logger.count()
  logger.off('count', onSecondInvoke)

  const onResetInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('countReset')
    expect(event.args.label).toBe(undefined)
  }
  const onResetAltInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe(undefined)
    expect(event.args['[[Count]]']).toBe(0)
  }

  logger.on('count', onResetAltInvoke)
  logger.on('countReset', onResetInvoke)
  logger.countReset()
  logger.off('countReset', onResetInvoke)
  logger.off('count', onResetAltInvoke)

  const onPostResetInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe(undefined)
    expect(event.args['[[Count]]']).toBe(1)
  }

  logger.on('count', onPostResetInvoke)
  logger.count()
  logger.off('count', onPostResetInvoke)
})

test('Logger#count(label)', () => {
  expect.assertions(14)

  const onFirstInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe('test')
    expect(event.args['[[Count]]']).toBe(1)
  }

  logger.on('count', onFirstInvoke)
  logger.count('test')
  logger.off('count', onFirstInvoke)

  const onSecondInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe('test')
    expect(event.args['[[Count]]']).toBe(2)
  }

  logger.on('count', onSecondInvoke)
  logger.count('test')
  logger.off('count', onSecondInvoke)

  const onResetInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('countReset')
    expect(event.args.label).toBe('test')
  }
  const onResetAltInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe('test')
    expect(event.args['[[Count]]']).toBe(0)
  }

  logger.on('count', onResetAltInvoke)
  logger.on('countReset', onResetInvoke)
  logger.countReset('test')
  logger.off('countReset', onResetInvoke)
  logger.off('count', onResetAltInvoke)

  const onPostResetInvoke = (event: LoggerEvent): void => {
    expect(event.name).toBe('count')
    expect(event.args.label).toBe('test')
    expect(event.args['[[Count]]']).toBe(1)
  }

  logger.on('count', onPostResetInvoke)
  logger.count('test')
  logger.off('count', onPostResetInvoke)
})

test('Logger#table', () => {
  expect.assertions(3)

  const props = ['hey']
  const data = { hey: 'hello' }

  const onTable = (event: LoggerEvent): void => {
    expect(event.name).toBe('table')
    expect(event.args.tabularData).toBe(data)
    expect(event.args.properties).toBe(props)
  }

  logger.on('table', onTable)
  logger.table(data, props)
  logger.off('table', onTable)
})

test('Logger message', () => {
  expect.assertions(30) // 6 * 2 + 6 * 3

  const cache = new Map<keyof Logger, LoggerEventHandler>()

  const onMessage = (level: keyof Logger): LoggerEventHandler => {
    let handler = cache.get(level)
    if (handler) {
      return handler
    }

    handler = (event: LoggerEvent) => {
      expect(event.name).toBe('message')
      expect(event.args.level).toBe(level)
      expect((event.args['...data'] as unknown[]).join(' ')).toBe(`message at ${level} level`)
    }

    cache.set(level, handler)

    return handler
  }

  const onTrace = (event: LoggerEvent): void => {
    expect(event.name).toBe('trace')
    expect((event.args['...data'] as unknown[]).join(' ')).toBe('message at trace level')
  }

  const onDebug = (event: LoggerEvent): void => {
    expect(event.name).toBe('debug')
    expect((event.args['...data'] as unknown[]).join(' ')).toBe('message at debug level')
  }

  const onInfo = (event: LoggerEvent): void => {
    expect(event.name).toBe('info')
    expect((event.args['...data'] as unknown[]).join(' ')).toBe('message at info level')
  }

  const onLog = (event: LoggerEvent): void => {
    expect(event.name).toBe('log')
    expect((event.args['...data'] as unknown[]).join(' ')).toBe('message at log level')
  }

  const onWarn = (event: LoggerEvent): void => {
    expect(event.name).toBe('warn')
    expect((event.args['...data'] as unknown[]).join(' ')).toBe('message at warn level')
  }

  const onError = (event: LoggerEvent): void => {
    expect(event.name).toBe('error')
    expect((event.args['...data'] as unknown[]).join(' ')).toBe('message at error level')
  }

  logger.on('trace', onTrace)
  logger.on('debug', onDebug)
  logger.on('info', onInfo)
  logger.on('log', onLog)
  logger.on('warn', onWarn)
  logger.on('error', onError)

  logger.on('message', onMessage('trace'))
  logger.trace('message at trace level')
  logger.off('message', onMessage('trace'))

  logger.on('message', onMessage('debug'))
  logger.debug('message at debug level')
  logger.off('message', onMessage('debug'))

  logger.on('message', onMessage('info'))
  logger.info('message at info level')
  logger.off('message', onMessage('info'))

  logger.on('message', onMessage('log'))
  logger.log('message at log level')
  logger.off('message', onMessage('log'))

  logger.on('message', onMessage('warn'))
  logger.warn('message at warn level')
  logger.off('message', onMessage('warn'))

  logger.on('message', onMessage('error'))
  logger.error('message at error level')
  logger.off('message', onMessage('error'))

  logger.off('trace', onTrace)
  logger.off('debug', onDebug)
  logger.off('info', onInfo)
  logger.off('log', onLog)
  logger.off('warn', onWarn)
  logger.off('error', onError)
})

test('Logger#off(not set)', () => {
  const onTrace = (): void => { console.trace() }

  expect(() => { inner.off('trace', onTrace) }).not.toThrow()
})
