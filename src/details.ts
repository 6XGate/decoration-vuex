import type { ModuleOptions } from './options'
import type { StoreModule } from './store-modules'
import type { WatchOptions } from 'vue'
import type { Commit, Dispatch } from 'vuex'

export type ProxyKind = 'public' | 'getter' | 'mutation' | 'action'

export type LocalGetter<M extends StoreModule> = (this: M) => unknown
export type LocalSetter<M extends StoreModule> = (this: M, value: unknown) => void

export interface LocalAccessor<M extends StoreModule> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (this: M, ...args: any[]): any;
  ['#accessor']?: undefined | true;
}

export interface LocalMutation<M extends StoreModule> {

  (this: M, ...args: any[]): void;
  ['#mutation']?: undefined | true;
}

export interface LocalAction<M extends StoreModule> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (this: M, ...args: any[]): Promise<any>;
  ['#action']?: undefined | true;
}

export interface LocalWatcher<M extends StoreModule> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (this: M, newValue: any, oldValue?: any): void;
  ['#watch']?: undefined | WatchDescriptor<M>;
}

export type WatchDescriptor<M extends StoreModule> = {
  callback: LocalWatcher<M>;
  path: string;
  options?: WatchOptions;
}

export type LocalFunction<M extends StoreModule> = (this: M, ...args: unknown[]) => unknown

export type LocalMember<M extends StoreModule> =
    StoreModule[keyof StoreModule] | LocalAccessor<M> | LocalMutation<M> | LocalAction<M> | LocalWatcher<M> | LocalFunction<M>

export type ProxyAccess = (...args: unknown[]) => unknown

type MemberKind = 'state' | 'reference' | 'getter' | 'accessor' | 'mutation' | 'action' | 'watcher' | 'local'

export class ModuleDefinition<M extends StoreModule> {
  state = new Set<keyof M>()
  references = new Map<string | keyof M, StoreModule>()
  getters = new Map<string | keyof M, LocalGetter<M>>()
  setters = new Map<string | keyof M, LocalSetter<M>>()
  accessors = new Map<string | keyof M, LocalAccessor<M>>()
  mutations = new Map<string | keyof M, LocalMutation<M>>()
  actions = new Map<string | keyof M, LocalAction<M>>()
  watchers = new Map<string | keyof M, WatchDescriptor<M>>()
  locals = new Map<string | keyof M, LocalFunction<M>>()
  members = new Map<string | keyof M, MemberKind>()
  options: ModuleOptions

  constructor (options: ModuleOptions) {
    this.options = options
  }
}

export interface ProxyContext<M extends StoreModule> {
  state: M;
  getters?: Record<string, unknown>;
  commit?: Commit;
  dispatch?: Dispatch;
}
