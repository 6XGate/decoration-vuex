import { isSymbol } from "lodash";
import type { ModuleDefinition, ProxyAccess, ProxyContext, ProxyKind } from "../details";
import type { RegisterOptions } from "../options";
import type { StoreModule } from "../store-modules";
import { msg } from "../utils";

type MemberProxy<M extends StoreModule> = (target: M) => unknown;
type ProxySetter = (key: string, value: unknown) => void;
type ProxyRestate<M extends StoreModule> = (key: keyof M, value: M[typeof key]) => void;

class BaseHandler<M extends StoreModule> implements ProxyHandler<M> {
    // eslint-disable-next-line class-methods-use-this
    isExtensible(): boolean {
        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    defineProperty(): boolean {
        console.warn(msg("defineProperty may not be used to modify or add new properties to modules"));

        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    deleteProperty(): boolean {
        console.warn(msg("Properties may not be deleted from modules"));

        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    setPrototypeOf(): boolean {
        console.warn(msg("The prototype of a module cannot be changed"));

        return false;
    }
}

class StoreModuleHandler<M extends StoreModule> extends BaseHandler<M> implements ProxyHandler<M> {
    private readonly definition: ModuleDefinition<M>;
    private readonly options: RegisterOptions;
    private readonly context: ProxyContext<M>;
    private readonly namespace: string;
    private readonly setter: ProxySetter;
    private readonly restate: null|ProxyRestate<M>;
    private readonly proxies = new Map<string|keyof M, MemberProxy<M>>();

    constructor(kind: ProxyKind, context: ProxyContext<M>, options: RegisterOptions, definition: ModuleDefinition<M>) {
        super();

        const isPublicProxy = kind === "public";

        this.definition = definition;
        this.options = options;
        this.context = context;
        this.namespace = kind === "public" ? `${options.name}/` : "";

        // State
        this.restate = this.definition.options.openState || kind === "mutation" ? this.getStateSetter(kind) : null;

        // Getters
        for (const key of this.definition.getters.keys()) {
            this.proxies.set(key, context.getters ?
                () => context.getters?.[`${this.namespace}get__${key as string}`] :
                () => { throw new Error(msg(`Calling getter for "${key as string}" at inappropriate time.`)) });
        }

        // Setters
        this.setter = context.commit ?
            (key: string, payload?: unknown) => { context.commit?.(`${this.namespace}set__${key}`, payload) } :
            (key: string) => { throw new Error(msg(`Calling setter for "${key}" at inappropriate time.`)) };

        // Accessors
        for (const key of this.definition.accessors.keys()) {
            this.proxies.set(key, context.getters ?
                () => (...payload: unknown[]) => (context.getters?.[`${this.namespace}${key as string}`] as ProxyAccess)(payload) :
                () => () => { throw new Error(msg(`Calling getter "${key as string}" at inappropriate time.`)) },
            );
        }

        // Mutations
        for (const key of this.definition.mutations.keys()) {
            this.proxies.set(key, context.commit ?
                () => (...payload: unknown[]) => { context.commit?.(`${this.namespace}${key as string}`, payload) } :
                () => () => { throw new Error(msg(`Calling mutation "${key as string}" at inappropriate time.`)) },
            );
        }

        // Actions
        for (const key of this.definition.actions.keys()) {
            this.proxies.set(key, context.dispatch ?
                () => (...payload: unknown[]) => context.dispatch?.(`${this.namespace}${key as string}`, payload) :
                () => () => { throw new Error(msg(`Calling action "${key as string}" at inappropriate time.`)) },
            );
        }

        // Watchers
        for (const key of this.definition.watchers.keys()) {
            this.proxies.set(key,
                () => () => { throw new Error(msg(`Watcher "${key as string}" may not be called directly.`)) });
        }

        // Local functions
        for (const [ key, member ] of this.definition.locals.entries()) {
            this.proxies.set(key, !isPublicProxy ?
                (target: M) => (...args: unknown[]) => member.call(target, ...args) :
                () => () => { throw new Error(msg(`Calling local function "${key as string}" at inappropriate time.`)) },
            );
        }
    }

    get(target: M, p: keyof M): unknown {
        // Short-circuit; state, or local and prototype inherited symbol accessed fields.
        if (isSymbol(p) || Object.prototype.hasOwnProperty.call(target, p)) {
            return target[p];
        }

        // Callables
        const proxy = this.proxies.get(p);
        if (proxy) {
            return proxy.call(this, target);
        }

        // Any other prototype inherited field.
        return target[p];
    }

    set(target: M, p: keyof M, value: unknown): boolean {
        // Short-circuit; state, or local and prototype inherited symbol accessed fields.
        if (Object.prototype.hasOwnProperty.call(target, p)) {
            if (isSymbol(p)) {
                target[p] = value as M[typeof p];

                return true;
            }

            if (this.restate) {
                this.restate(p, value as M[typeof p]);

                return true;
            }

            console.warn(msg("Cannot modify the state outside mutations."));

            return false;
        }

        if (this.definition.setters.has(p)) {
            this.setter(p as string, value);

            return true;
        }

        console.warn(msg(`Cannot modify property ${p as string} of store.`));

        return false;
    }

    private getStateSetter(kind: ProxyKind): null|ProxyRestate<M> {
        const { store, name } = this.options;

        switch (kind) {
        case "public":
            return (key: keyof M, value: M[typeof key]): void => { store.commit(`${name}/set__${key as string}`, value) };
        case "mutation":
            return (key: keyof M, value: M[typeof key]): void => { this.context.state[key] = value };
        case "action":
            return (key: keyof M, value: M[typeof key]): void => { this.context.commit?.(`set__${key as string}`, value) };
        default:
            return null;
        }
    }
}

export function makeInstanceProxy<M extends StoreModule>(
    instance: M,
    kind: ProxyKind,
    context: ProxyContext<M>,
    options: RegisterOptions,
    definition: ModuleDefinition<M>,
): M {
    return new Proxy(instance, new StoreModuleHandler<M>(kind, context, options, definition));
}

// Proxies
// - Using provided context
//   - PublicProxy, mimics the class interface without local functions and with read/maybe write state.
//   - GetterProxy, mimics the class interface without actions, mutations, or setters and with readonly state.
//   - MutationProxy, mimics the class interface without getters, accessors, actions, mutations, or setters and with read/write state.
//   - ActionProxy, mimics the class interface with read/maybe write state.
// - Using the store instance
//   - VuexProxy, wraps the module to be part of a Vuex.Store.
