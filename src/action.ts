import type Vue from "vue";
import type { VueDecorator } from "vue-class-component";
import { createDecorator } from "vue-class-component";
import { mapActions } from "vuex";
import type { LocalAction } from "./details";
import type { StoreModule } from "./store-modules";
import { getModuleName } from "./store-modules";

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalAction<M>>;

export function Action<M extends StoreModule>(_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> {
    if (typeof descriptor !== "object" || typeof descriptor.value !== "function") {
        throw new TypeError("Only functions may be decorated with @Action");
    }

    Object.defineProperty(descriptor.value, "#action", {
        configurable: false,
        enumerable:   false,
        writable:     false,
        value:        true,
    });

    return descriptor;
}

export type ActionType<M extends StoreModule, K extends keyof M> = M[K] extends LocalAction<M> ?
    (this: Vue, ...args: Parameters<M[K]>) => ReturnType<M[K]> : never;

export function MapAction<M extends StoreModule, K extends keyof M>(module: M, action: K): VueDecorator {
    return createDecorator((options, key) => {
        const mappings = mapActions(getModuleName(module), {
            [key]: (dispatch, ...args: unknown[]) => dispatch(action as string, args),
        });

        // TODO: Determine test to cover both cases.
        const methods = (options.methods || (options.methods = {}));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        methods[key] = mappings[key]!;
    });
}
