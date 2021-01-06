import type { LocalAction } from "./details";
import type { StoreModule } from "./store-modules";

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalAction<M>>;

export function Action<M extends StoreModule>(_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> {
    if (typeof descriptor.value === "function") {
        descriptor.value.__action__ = true;
    }

    return descriptor;
}
