import type Vue from "vue";
import type { VueDecorator } from "vue-class-component";
import { createDecorator } from "vue-class-component";
import { mapMutations } from "vuex";
import type { LocalMutation } from "./details";
import type { StoreModule } from "./store-modules";
import { getModuleName } from "./store-modules";

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalMutation<M>>;

export function Mutation<M extends StoreModule>(_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> {
    if (typeof descriptor !== "object" || typeof descriptor.value !== "function") {
        throw new TypeError("Only functions may be decorated with @Mutation");
    }

    Object.defineProperty(descriptor.value, "#mutation", {
        configurable: false,
        enumerable:   false,
        writable:     false,
        value:        true,
    });

    return descriptor;
}

export type MutationType<M extends StoreModule, K extends keyof M> = M[K] extends LocalMutation<M> ?
    (this: Vue, ...args: Parameters<M[K]>) => void : never;

export function MapMutation<M extends StoreModule, K extends keyof M>(module: M, action: K): VueDecorator {
    return createDecorator((options, key) => {
        const mappings = mapMutations(getModuleName(module), {
            [key]: (commit, ...args: unknown[]) => { commit(action as string, args) },
        });

        // TODO: Determine test to cover both cases.
        const methods = (options.methods || (options.methods = {}));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        methods[key] = mappings[key]!;
    });
}
