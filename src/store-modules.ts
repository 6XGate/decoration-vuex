import type { ModuleOptions, RegisterOptions, ResolvedRegisterOptions } from './options'

let baseId = 1
function getNextId (): number {
  return baseId++
}

export class StoreModule {
  static ['@options']?: ModuleOptions;
  ['#options']!: ResolvedRegisterOptions

  constructor (options: RegisterOptions) {
    // Record the options on the object in a way that it cannot be made reactive.
    Object.defineProperty(this, '#options', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: { ...options, name: options.name ?? `${this.constructor.name}#${getNextId()}` }
    })
  }
}

export function getModuleName (module: StoreModule): string {
  return module['#options'].name
}
