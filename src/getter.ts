import type { VueDecorator } from "vue-class-component";
import { createDecorator } from "vue-class-component";
import { mapGetters } from "vuex";
import type { LocalAccessor } from "./details";
import type { StoreModule } from "./store-modules";
import { getModuleName } from "./store-modules";

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalAccessor<M>>;

export function Getter<M extends StoreModule>(_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> {
    if (typeof descriptor !== "object" || typeof descriptor.value !== "function") {
        throw new TypeError("Only functions may be decorated with @Getter");
    }

    descriptor.value.__accessor__ = true;

    return descriptor;
}

export type GetterType<M extends StoreModule, K extends keyof M> = M[K];

export function MapGetter<M extends StoreModule, K extends keyof M>(module: M, state: K): VueDecorator {
    return createDecorator((options, key) => {
        const mappings = mapGetters(getModuleName(module), { [key]: state as string });

        // TODO: Determine test to cover both cases.
        const computed = (options.computed || (options.computed = {}));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        computed[key] = mappings[key]!;
    });
}
