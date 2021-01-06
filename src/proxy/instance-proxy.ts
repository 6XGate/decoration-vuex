import { isSymbol } from "lodash";
import type {
    LocalAccessor,
    LocalFunction,
    LocalGetter, LocalMutation,
    LocalSetter,
    ModuleDefinition,
    ProxyAccess,
    ProxyContext,
    ProxyKind,
} from "../details";
import type { RegisterOptions } from "../options";
import type { StoreModule } from "../store-modules";
import { msg } from "../utils";

type MemberProxy<M extends StoreModule> = (receiver: M) => unknown;
type ProxySetter<M extends StoreModule> = (key: string|keyof M, value: M[keyof M], receiver: M, handler: LocalSetter<M>) => void;
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
    private readonly setter: ProxySetter<M>;
    private readonly restate: null|ProxyRestate<M>;
    private readonly proxies = new Map<string|keyof M, MemberProxy<M>>();

    constructor(kind: ProxyKind, context: ProxyContext<M>, options: RegisterOptions, definition: ModuleDefinition<M>) {
        super();

        this.definition = definition;
        this.options = options;
        this.context = context;
        this.namespace = kind === "public" ? `${options.name}/` : "";

        // State
        this.restate = this.definition.options.openState || kind === "mutation" ? this.getStateSetter(kind) : null;

        // Getters
        for (const [ key, handler ] of this.definition.getters.entries()) {
            this.proxies.set(key, this.getGetter(kind, key, context, handler));
        }

        // Setters
        this.setter = this.getSetter(kind, context);

        // Accessors
        for (const [ key, member ] of this.definition.accessors.entries()) {
            this.proxies.set(key, this.getAccessor(kind, key, context, member));
        }

        // Mutations
        for (const [ key, member ] of this.definition.mutations.entries()) {
            this.proxies.set(key, this.getMutation(kind, key, context, member));
        }

        // Actions
        for (const key of this.definition.actions.keys()) {
            this.proxies.set(key, this.getAction(kind, key, context));
        }

        // Watchers
        for (const key of this.definition.watchers.keys()) {
            this.proxies.set(key,
                () => () => { throw new Error(msg(`Watcher "${key as string}" may not be called directly.`)) });
        }

        // Local functions
        for (const [ key, member ] of this.definition.locals.entries()) {
            this.proxies.set(key, this.getLocalFunction(kind, key, context, member));
        }
    }

    get(target: M, key: keyof M, receiver: M): unknown {
        // Short-circuit; state, or local and prototype inherited symbol accessed fields.
        if (isSymbol(key) || Object.prototype.hasOwnProperty.call(target, key)) {
            return target[key];
        }

        // Callables
        const proxy = this.proxies.get(key);
        if (proxy) {
            return proxy.call(this, receiver);
        }

        // Any other prototype inherited field.
        return target[key];
    }

    set(target: M, key: keyof M, value: M[typeof key], receiver: M): boolean {
        // Short-circuit; state, or local and prototype inherited symbol accessed fields.
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            if (isSymbol(key)) {
                target[key] = value as M[typeof key];

                return true;
            }

            if (this.restate) {
                this.restate(key, value);

                return true;
            }

            throw new Error(msg("Cannot modify the state outside mutations."));
        }

        const handler = this.definition.setters.get(key);
        if (handler) {
            this.setter(key, value, receiver, handler);

            return true;
        }

        console.warn(msg(`Cannot modify property ${key as string} of store.`));

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

    private getGetter(_kind: ProxyKind, key: string|keyof M, context: ProxyContext<M>, handler: LocalGetter<M>): MemberProxy<M> {
        if (context.getters) {
            return () => context.getters?.[`${this.namespace}get__${key as string}`];
        }

        return receiver => handler.call(receiver);
    }

    private getSetter(kind: ProxyKind, context: ProxyContext<M>): ProxySetter<M> {
        if (context.commit) {
            return (key, value) => {
                context.commit?.(`${this.namespace}set__${key as string}`, value);
            };
        }

        if (kind === "mutation") {
            return (_key, value, receiver, handler) => handler.call(receiver, value);
        }

        return key => { throw new Error(msg(`Calling setter for "${key as string}" at inappropriate time.`)) };
    }

    private getAccessor(_kind: ProxyKind, key: string|keyof M, context: ProxyContext<M>, member: LocalAccessor<M>): MemberProxy<M> {
        if (context.getters) {
            return () => (...payload: unknown[]) =>
                (context.getters?.[`${this.namespace}${key as string}`] as ProxyAccess)(payload);
        }

        return receiver => (...payload: unknown[]) => member.call(receiver, ...payload) as unknown;
    }

    private getMutation(kind: ProxyKind, key: string|keyof M, context: ProxyContext<M>, member: LocalMutation<M>): MemberProxy<M> {
        if (context.commit) {
            return () => (...payload: unknown[]) => { context.commit?.(`${this.namespace}${key as string}`, payload) };
        }

        if (kind === "mutation") {
            return receiver => (...payload: unknown[]) => member.call(receiver, ...payload);
        }

        return () => () => { throw new Error(msg(`Calling mutation "${key as string}" at inappropriate time.`)) };
    }

    private getAction(_kind: ProxyKind, key: string|keyof M, context: ProxyContext<M>): MemberProxy<M> {
        return context.dispatch ?
            () => (...payload: unknown[]) => context.dispatch?.(`${this.namespace}${key as string}`, payload) :
            () => () => { throw new Error(msg(`Calling action "${key as string}" at inappropriate time.`)) };
    }

    // eslint-disable-next-line class-methods-use-this
    private getLocalFunction(kind: ProxyKind, key: string|keyof M, _context: ProxyContext<M>, member: LocalFunction<M>): MemberProxy<M> {
        return kind !== "public" ?
            receiver => (...args: unknown[]) => member.call(receiver, ...args) :
            () => () => { throw new Error(msg(`Calling local function "${key as string}" at inappropriate time.`)) };
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
