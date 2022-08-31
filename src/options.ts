import type { Store } from 'vuex'

export interface RegisterOptions {
  /** The store to which the module will be registered */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: Store<any>;
  /** Optionally rename the module; otherwise, its class name is used */
  name?: string;
}

export interface ModuleOptions {
  /** Makes the state publicly mutable by defining setters for each top level property */
  openState?: boolean;
}

export type ResolvedRegisterOptions = Required<RegisterOptions>
