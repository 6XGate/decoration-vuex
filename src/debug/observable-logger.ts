import type { Logger } from './logger'

export type LoggerEventNames = keyof Logger | 'message'

export type LoggerEvent = {
  name: LoggerEventNames;
  args: { [arg: string]: unknown };
}

export type LoggerEventHandler = (event: LoggerEvent) => void

const kNoLabel = Symbol('[[No Label]]')

export class ObservableLogger implements Logger {
  private readonly handlers = new Map<LoggerEventNames, Set<LoggerEventHandler>>()
  private readonly counters = new Map<string | symbol, number>()
  private readonly base: null | Logger

  constructor (base?: Logger) {
    this.base = base ?? null
  }

  on (name: LoggerEventNames, handler: LoggerEventHandler): void {
    let handlers = this.handlers.get(name)
    if (!handlers) {
      handlers = new Set<LoggerEventHandler>()
      this.handlers.set(name, handlers)
    }

    handlers.add(handler)
  }

  off (name: LoggerEventNames, handler: LoggerEventHandler): void {
    const handlers = this.handlers.get(name)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  assert (condition?: boolean, ...data: unknown[]): void {
    this.dispatch({
      name: 'assert',
      args: {
        condition,
        '...data': data
      }
    })

    if (!condition) {
      throw new Error(data.join(' '))
    }
  }

  count (label?: string): void {
    const value = 1 + (this.counters.get(label ?? kNoLabel) ?? 0)

    this.dispatch({
      name: 'count',
      args: { label, '[[Count]]': value }
    })

    this.counters.set(label ?? kNoLabel, value)

    this.base && this.base.count(label)
  }

  countReset (label?: string): void {
    this.dispatch({
      name: 'countReset',
      args: { label }
    })
    this.dispatch({
      name: 'count',
      args: { label, '[[Count]]': 0 }
    })

    this.counters.delete(label ?? kNoLabel)

    this.base && this.base.countReset(label)
  }

  debug (...data: unknown[]): void {
    this.dispatch({
      name: 'debug',
      args: { '...data': data }
    })
    this.dispatch({
      name: 'message',
      args: {
        'level': 'debug',
        '...data': data
      }
    })

    this.base && this.base.debug(...data)
  }

  error (...data: unknown[]): void {
    this.dispatch({
      name: 'error',
      args: { '...data': data }
    })
    this.dispatch({
      name: 'message',
      args: {
        'level': 'error',
        '...data': data
      }
    })

    this.base && this.base.error(...data)
  }

  info (...data: unknown[]): void {
    this.dispatch({
      name: 'info',
      args: { '...data': data }
    })
    this.dispatch({
      name: 'message',
      args: {
        'level': 'info',
        '...data': data
      }
    })

    this.base && this.base.info(...data)
  }

  log (...data: unknown[]): void {
    this.dispatch({
      name: 'log',
      args: { '...data': data }
    })
    this.dispatch({
      name: 'message',
      args: {
        'level': 'log',
        '...data': data
      }
    })

    this.base && this.base.log(...data)
  }

  table (tabularData?: unknown, properties?: string[]): void {
    this.dispatch({
      name: 'table',
      args: {
        tabularData,
        properties
      }
    })

    this.base && this.base.table(tabularData, properties)
  }

  trace (...data: unknown[]): void {
    this.dispatch({
      name: 'trace',
      args: { '...data': data }
    })
    this.dispatch({
      name: 'message',
      args: {
        'level': 'trace',
        '...data': data
      }
    })

    this.base && this.base.trace(...data)
  }

  warn (...data: unknown[]): void {
    this.dispatch({
      name: 'warn',
      args: { '...data': data }
    })
    this.dispatch({
      name: 'message',
      args: {
        'level': 'warn',
        '...data': data
      }
    })

    this.base && this.base.warn(...data)
  }

  private dispatch (event: LoggerEvent): void {
    const handlers = this.handlers.get(event.name)
    if (handlers) {
      for (const handler of handlers) {
        handler(event)
      }
    }
  }
}
