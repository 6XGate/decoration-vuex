import { hasOwnProperty, msg } from '../utils'
import type {
  LocalAccessor,
  LocalFunction,
  LocalGetter, LocalMutation,
  LocalSetter,
  ModuleDefinition,
  ProxyAccess,
  ProxyContext,
  ProxyKind
} from '../details'
import type { ResolvedRegisterOptions } from '../options'
import type { StoreModule } from '../store-modules'

type MemberProxy<M extends StoreModule> = (receiver: M) => unknown
type ProxySetter<M extends StoreModule> = (key: string | keyof M, value: M[keyof M], receiver: M, handler: LocalSetter<M>) => void
type ProxyRestate<M extends StoreModule> = (key: keyof M, value: M[typeof key]) => void

class StoreModuleHandler<M extends StoreModule> implements ProxyHandler<M> {
  private readonly definition: ModuleDefinition<M>
  private readonly options: ResolvedRegisterOptions
  private readonly context: ProxyContext<M>
  private readonly namespace: string
  private readonly setter: ProxySetter<M>
  private readonly restate: null | ProxyRestate<M>
  private readonly proxies = new Map<string | keyof M, MemberProxy<M>>()

  constructor (kind: ProxyKind, context: ProxyContext<M>, options: ResolvedRegisterOptions, definition: ModuleDefinition<M>) {
    this.definition = definition
    this.options = options
    this.context = context
    this.namespace = kind === 'public' ? `${options.name}/` : ''

    // State
    this.restate = this.definition.options.openState || kind === 'mutation' ? this.getStateSetter(kind) : null

    // Getters
    for (const [key, handler] of this.definition.getters.entries()) {
      this.proxies.set(key, this.getGetter(kind, key, context, handler))
    }

    // Setters
    this.setter = this.getSetter(kind, context)

    // Accessors
    for (const [key, member] of this.definition.accessors.entries()) {
      this.proxies.set(key, this.getAccessor(kind, key, context, member))
    }

    // Mutations
    for (const [key, member] of this.definition.mutations.entries()) {
      this.proxies.set(key, this.getMutation(kind, key, context, member))
    }

    // Actions
    for (const key of this.definition.actions.keys()) {
      this.proxies.set(key, this.getAction(kind, key, context))
    }

    // Watchers
    for (const key of this.definition.watchers.keys()) {
      this.proxies.set(key,
        () => () => { throw new Error(msg(`Watcher "${key as string}" may not be called directly.`)) })
    }

    // Local functions
    for (const [key, member] of this.definition.locals.entries()) {
      this.proxies.set(key, this.getLocalFunction(kind, key, context, member))
    }
  }

  get (target: M, key: string | symbol, receiver: M): unknown {
    // Short-circuit; state, or local and prototype inherited symbol accessed fields.
    if (typeof key === 'symbol' || hasOwnProperty(target, key)) {
      return target[key as keyof M]
    }

    // Callables
    const proxy = this.proxies.get(key)
    if (proxy) {
      return proxy.call(this, receiver)
    }

    // Any other prototype inherited field.
    return target[key as keyof M]
  }

  set (target: M, key: string | symbol, value: unknown, receiver: M): boolean {
    // Short-circuit; state, or local and prototype inherited symbol accessed fields.
    if (hasOwnProperty(target, key)) {
      if (typeof key === 'symbol') {
        target[key as keyof M] = value as M[keyof M]

        return true
      }

      if (this.definition.references.get(key as keyof M)) {
        throw new TypeError(msg(`Sub-module reference ${key} is immutable`))
      }

      if (this.restate) {
        this.restate(key as keyof M, value as M[keyof M])

        return true
      }

      throw new TypeError(msg('Cannot modify the state outside mutations.'))
    }

    const handler = this.definition.setters.get(key as keyof M)
    if (handler) {
      this.setter(key as keyof M, value as M[keyof M], receiver, handler)

      return true
    }

    throw new TypeError(msg(`Cannot add or modify property ${key as string} of store.`))
  }

  private getStateSetter (kind: ProxyKind): null | ProxyRestate<M> {
    const { store, name } = this.options

    switch (kind) {
      case 'public':
        return (key: keyof M, value: M[typeof key]): void => { store.commit(`${name}/${key as string}`, value) }
      case 'mutation':
        return (key: keyof M, value: M[typeof key]): void => { this.context.state[key] = value }
      case 'action':
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return (key: keyof M, value: M[typeof key]): void => { this.context.commit!(key as string, value) }
        /* istanbul ignore next */
      default:
        return null
    }
  }

  private getGetter (_kind: ProxyKind, key: string | keyof M, context: ProxyContext<M>, handler: LocalGetter<M>): MemberProxy<M> {
    if (context.getters) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return () => context.getters![`${this.namespace}${key as string}`]
    }

    return receiver => handler.call(receiver)
  }

  private getSetter (kind: ProxyKind, context: ProxyContext<M>): ProxySetter<M> {
    if (context.commit) {
      return (key, value) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        context.commit!(`${this.namespace}${key as string}`, value)
      }
    }

    if (kind === 'mutation') {
      return (_key, value, receiver, handler) => handler.call(receiver, value)
    }

    return key => { throw new Error(msg(`Calling setter for "${key as string}" at inappropriate time.`)) }
  }

  private getAccessor (_kind: ProxyKind, key: string | keyof M, context: ProxyContext<M>, member: LocalAccessor<M>): MemberProxy<M> {
    if (context.getters) {
      return () => (...payload: unknown[]) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (context.getters![`${this.namespace}${key as string}`] as ProxyAccess)(...payload)
    }

    return receiver => (...payload: unknown[]) => member.call(receiver, ...payload) as unknown
  }

  private getMutation (kind: ProxyKind, key: string | keyof M, context: ProxyContext<M>, member: LocalMutation<M>): MemberProxy<M> {
    if (context.commit) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return () => (...payload: unknown[]) => { context.commit!(`${this.namespace}${key as string}`, payload) }
    }

    if (kind === 'mutation') {
      return receiver => (...payload: unknown[]) => member.call(receiver, ...payload)
    }

    return () => () => { throw new Error(msg(`Calling mutation "${key as string}" at inappropriate time.`)) }
  }

  private getAction (_kind: ProxyKind, key: string | keyof M, context: ProxyContext<M>): MemberProxy<M> {
    return context.dispatch
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? () => (...payload: unknown[]) => context.dispatch!(`${this.namespace}${key as string}`, payload)
      : () => () => { throw new Error(msg(`Calling action "${key as string}" at inappropriate time.`)) }
  }

  private getLocalFunction (kind: ProxyKind, key: string | keyof M, _context: ProxyContext<M>, member: LocalFunction<M>): MemberProxy<M> {
    return kind !== 'public'
      ? receiver => (...args: unknown[]) => member.call(receiver, ...args)
      : () => () => { throw new Error(msg(`Calling local function "${key as string}" at inappropriate time.`)) }
  }
}

export function makeInstanceProxy<M extends StoreModule> (
  instance: M,
  kind: ProxyKind,
  context: ProxyContext<M>,
  definition: ModuleDefinition<M>
): M {
  return new Proxy(instance, new StoreModuleHandler<M>(kind, context, instance['#options'], definition))
}

// Proxies
// - Using provided context
//   - PublicProxy, mimics the class interface without local functions and with read/maybe write state.
//   - GetterProxy, mimics the class interface without actions, mutations, or setters and with readonly state.
//   - MutationProxy, mimics the class interface without getters, accessors, actions, mutations, or setters and with read/write state.
//   - ActionProxy, mimics the class interface with read/maybe write state.
// - Using the store instance
//   - VuexProxy, wraps the module to be part of a Vuex.Store.
