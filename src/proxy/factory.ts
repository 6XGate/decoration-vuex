import type { SetRequired } from "type-fest";
import type { GetterTree, Module, Store } from "vuex";
import { getLogger } from "../debug/logger";
import type {
    LocalAccessor,
    LocalAction,
    LocalMember,
    LocalMutation,
    LocalWatcher,
    ProxyContext,
    ProxyKind,
    WatchDescriptor,
} from "../details";
import { ModuleDefinition } from "../details";
import { StoreModule } from "../store-modules";
import { getByPath, msg } from "../utils";
import { makeInstanceProxy } from "./instance-proxy";

type CompleteModule<S, R> = SetRequired<Module<S, R>, "namespaced"|"state"|"getters"|"mutations"|"actions">;

class StoreModuleProxyFactory<M extends typeof StoreModule> {
    private readonly definition: ModuleDefinition<InstanceType<M>>;
    private readonly instance: InstanceType<M>;
    private readonly cache = new Map<ProxyKind, InstanceType<M>>();

    constructor(constructor: M, instance: InstanceType<M>) {
        type S = InstanceType<M>;

        this.definition = new ModuleDefinition<InstanceType<M>>(constructor["@options"] || {});
        this.instance = instance;

        // Register state, which will be needed for openState modules.
        for (const [ key, value ] of Object.entries(instance)) {
            if (value instanceof StoreModule) {
                this.definition.references.set(key as keyof S, value);

                this.definition.members.set(key as keyof S, "reference");

                // Redefine the sub-module property as an immutable property so it cannot be reactive.
                Object.defineProperty(instance, key, {
                    configurable: false,
                    enumerable:   false,
                    writable:     false,
                    value,
                });
            } else {
                this.definition.state.add(key as keyof S);

                this.definition.members.set(key as keyof S, "state");
            }
        }

        // Register all other members on the prototype chain.
        const bases = StoreModuleProxyFactory.getModuleChain(constructor);
        for (const base of bases) {
            for (const key of Object.getOwnPropertyNames(base.prototype)) {
                if (key === "constructor") {
                    // eslint-disable-next-line no-continue
                    continue;
                }

                const kind = this.definition.members.get(key);

                // Getters and setters.
                const descriptor = Object.getOwnPropertyDescriptor(base.prototype, key);
                if  (descriptor && typeof descriptor.get === "function") {
                    if (kind && kind !== "getter") {
                        throw new Error(msg(`Previous member ${key} was ${kind} and cannot be changed`));
                    }

                    this.definition.members.set(key, "getter");

                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    this.definition.getters.set(key, descriptor.get);
                    if (typeof descriptor.set === "function") {
                        // eslint-disable-next-line @typescript-eslint/unbound-method
                        this.definition.setters.set(key, descriptor.set);
                    }

                    // eslint-disable-next-line no-continue
                    continue;
                }

                // Other part, make sure they are functions.
                const value = base.prototype[key as keyof StoreModule] as LocalMember<InstanceType<M>>;
                if (typeof value !== "function") {
                    getLogger().warn(msg(`Module prototype has property ${key} that is neither get/set or a function`));

                    // eslint-disable-next-line no-continue
                    continue;
                }

                if (StoreModuleProxyFactory.isAccessor(value)) {
                    if (kind && kind !== "accessor") {
                        throw new Error(msg(`Previous member ${key} was ${kind} and cannot be changed`));
                    }

                    this.definition.members.set(key, "accessor");
                    this.definition.accessors.set(key, value);
                } else if (StoreModuleProxyFactory.isMutation(value)) {
                    if (kind && kind !== "mutation") {
                        throw new Error(msg(`Previous member ${key} was ${kind} and cannot be changed`));
                    }

                    this.definition.members.set(key, "mutation");
                    this.definition.mutations.set(key, value);
                } else if (StoreModuleProxyFactory.isAction(value)) {
                    if (kind && kind !== "action") {
                        throw new Error(msg(`Previous member ${key} was ${kind} and cannot be changed`));
                    }

                    this.definition.members.set(key, "action");
                    this.definition.actions.set(key, value);
                } else if (StoreModuleProxyFactory.isWatcher(value)) {
                    if (kind && kind !== "watcher") {
                        throw new Error(msg(`Previous member ${key} was ${kind} and cannot be changed`));
                    }

                    this.definition.members.set(key, "watcher");
                    this.definition.watchers.set(key, value["#watch"]);
                } else {
                    if (kind && kind !== "local") {
                        throw new Error(msg(`Previous member ${key} was ${kind} and cannot be changed`));
                    }

                    this.definition.members.set(key, "local");
                    this.definition.locals.set(key, value);
                }
            }
        }

        this.registerModule();
    }

    makePublicProxy(): InstanceType<M> {
        const { store, name }: { store: Store<Record<string, unknown>>; name: string } = this.instance["#options"];

        return this.getProxy({ ...store, state: store.state[name] as InstanceType<M> }, "public");
    }

    private static getModuleChain<T extends typeof StoreModule>(bottom: T): T[] {
        type MaybeModuleClass = T|undefined|null;

        const modules = [] as T[];

        let module = bottom as MaybeModuleClass;
        while (module) {
            modules.push(module);

            if (module.prototype === StoreModule.prototype) {
                return modules.reverse();
            }

            module = Object.getPrototypeOf(module) as MaybeModuleClass;
        }

        throw new Error(msg("Module class must be derived from StoreModule"));
    }

    private static isAccessor<T extends StoreModule>(member: LocalMember<T>): member is LocalAccessor<T> & { ["#accessor"]: true } {
        return (member as LocalAccessor<T>)["#accessor"] || false;
    }

    private static isMutation<T extends StoreModule>(member: LocalMember<T>): member is LocalMutation<T> & { ["#mutation"]: true } {
        return (member as LocalMutation<T>)["#mutation"] || false;
    }

    private static isAction<T extends StoreModule>(member: LocalMember<T>): member is LocalAction<T> & { ["#action"]: true } {
        return (member as LocalAction<T>)["#action"] || false;
    }

    private static isWatcher<T extends StoreModule>(member: LocalMember<T>): member is LocalWatcher<T> & { ["#watch"]: WatchDescriptor<T> } {
        return Boolean((member as LocalWatcher<T>)["#watch"]);
    }

    private registerModule(): void {
        type S = InstanceType<M>;

        const { store, name }: { store: Store<Record<string, unknown>>; name: string } = this.instance["#options"];

        const module: CompleteModule<S, unknown> = {
            namespaced: true,
            state:      () => this.instance,
            getters:    {},
            mutations:  {},
            actions:    {},
            modules:    {},
        };

        // State mutations
        if (this.definition.options.openState) {
            for (const key of this.definition.state) {
                module.mutations[`${key as string}`] = (state, payload: S[typeof key]) => { state[key] = payload };
            }
        }

        // Getters and setters
        for (const [ key, getter ] of this.definition.getters.entries()) {
            module.getters[key as string] = (state, getters: GetterTree<S, unknown>) => {
                const getterProxy = this.getProxy({ state, getters }, "getter");

                return getter.call(getterProxy);
            };

            // const setter = key in this.moduleDefinition.setters && this.moduleDefinition.setters[key];
            const setter = this.definition.setters.get(key);
            if (setter) {
                module.mutations[key as string] = (state, payload: unknown) => {
                    const mutationProxy = this.getProxy({ state }, "mutation");

                    setter.call(mutationProxy, payload);
                };
            }
        }

        // Accessors
        for (const [ key, accessor ] of this.definition.accessors.entries()) {
            module.getters[key as string] = (state, getters: GetterTree<S, unknown>) => {
                const getterProxy = this.getProxy({ state, getters }, "getter");

                return (...args: unknown[]) => accessor.call(getterProxy, ...args) as unknown;
            };
        }

        // Mutations
        for (const [ key, mutation ] of this.definition.mutations.entries()) {
            module.mutations[key as string] = (state, payload: undefined|unknown[]) => {
                const mutationProxy = this.getProxy({ state }, "mutation");

                /* istanbul ignore next */ // Safety against undefined, but no way to test in TypeScript.
                payload = payload || [];

                mutation.apply(mutationProxy, payload);
            };
        }

        // Actions
        for (const [ key, action ] of this.definition.actions.entries()) {
            module.actions[key as string] = (context, payload: undefined|unknown[]) => {
                const actionProxy = this.getProxy({ ...context }, "action");

                /* istanbul ignore next */ // Safety against undefined, but no way to test in TypeScript.
                payload = payload || [];

                return action.apply(actionProxy, payload);
            };
        }

        // Watchers
        for (const descriptor of this.definition.watchers.values()) {
            const getter = (state: Record<string, unknown>): unknown => getByPath(state, `${name}.${descriptor.path}`);
            const watcher = (newValue: unknown, oldValue: unknown): void => {
                const proxy = this.makePublicProxy();

                descriptor.callback.call(proxy, newValue, oldValue);
            };

            store.watch(getter, watcher, descriptor.options);
        }

        if (store.state[name]) {
            throw new Error(msg(`Module "${name}" is already registered.`));
        } else {
            store.registerModule(name, module);
        }
    }

    private getProxy(context: ProxyContext<InstanceType<M>>, kind: ProxyKind): InstanceType<M> {
        const proxy = this.cache.get(kind);

        return proxy || this.makeProxy(context, kind);
    }

    private makeProxy(context: ProxyContext<InstanceType<M>>, kind: ProxyKind): InstanceType<M> {
        const proxy = makeInstanceProxy(this.instance, kind, context, this.definition);
        this.cache.set(kind, proxy);

        return proxy;
    }
}

export function makeProxyFactory<M extends typeof StoreModule>(constructor: M, instance: InstanceType<M>): StoreModuleProxyFactory<M> {
    return new StoreModuleProxyFactory<M>(constructor, instance);
}
