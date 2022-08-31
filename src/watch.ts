import type { LocalWatcher } from './details'
import type { StoreModule } from './store-modules'
import type { WatchOptions } from 'vue'

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalWatcher<M>>

interface WatchDecorator {
    <M extends StoreModule>(target: M, key: string, descriptor: Descriptor<M>): Descriptor<M>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Watch (path: string, options?: WatchOptions): WatchDecorator {
  return <M extends StoreModule>(_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> => {
    if (typeof descriptor !== 'object' || typeof descriptor.value !== 'function') {
      throw new TypeError('Only functions may be decorated with @Watch')
    }

    Object.defineProperty(descriptor.value, '#watch', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: {
        callback: descriptor.value,
        options,
        path
      }
    })

    return descriptor
  }
}
