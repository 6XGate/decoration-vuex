import type { VueDecorator } from "vue-class-component";
import { createDecorator } from "vue-class-component";
import { mapGetters } from "vuex";
import type { LocalAccessor } from "./details";
import type { StoreModule } from "./store-modules";
import { getModuleName } from "./store-modules";

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalAccessor<M>>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export function Getter<M extends StoreModule>(_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> {
    if (typeof descriptor !== "object" || typeof descriptor.value !== "function") {
        throw new TypeError("Only functions may be decorated with @Getter");
    }

    Object.defineProperty(descriptor.value, "#accessor", {
        configurable: false,
        enumerable:   false,
        writable:     false,
        value:        true,
    });

    return descriptor;
}

export type GetterType<M extends StoreModule, K extends keyof M> = M[K];

// eslint-disable-next-line @typescript-eslint/naming-convention
export function MapGetter<M extends StoreModule, K extends keyof M>(module: M, state: K): VueDecorator {
    return createDecorator((options, key) => {
        const mappings = mapGetters(getModuleName(module), { [key]: state as string });

        const computed = (options.computed || (options.computed = {}));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        computed[key] = mappings[key]!;
    });
}
