import type { LocalAction } from './details'
import type { StoreModule } from './store-modules'

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalAction<M>>

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Action<M extends StoreModule> (_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> {
  if (typeof descriptor !== 'object' || typeof descriptor.value !== 'function') {
    throw new TypeError('Only functions may be decorated with @Action')
  }

  Object.defineProperty(descriptor.value, '#action', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: true
  })

  return descriptor
}
