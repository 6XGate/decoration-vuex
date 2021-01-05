import type { Store } from "vuex";

export interface RegisterOptions {
    /** The store */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store: Store<any>;
    /** Optionally rename the module */
    name?: string;
}

export interface ModuleOptions {
    /** Makes the state publicly mutable by defining setter mutations */
    openState?: boolean;
}

export type ResolvedRegisterOptions = Required<RegisterOptions>;
