import type { WatchOptions } from "vue";
import type { LocalWatcher } from "./details";
import type { StoreModule } from "./store-modules";

type Descriptor<M extends StoreModule> = TypedPropertyDescriptor<LocalWatcher<M>>;

interface WatchDecorator {
    <M extends StoreModule>(target: M, key: string, descriptor: Descriptor<M>): Descriptor<M>;
}

export function Watch(path: string, options?: WatchOptions): WatchDecorator {
    return <M extends StoreModule>(_target: M, _key: string, descriptor: Descriptor<M>): Descriptor<M> => {
        if (typeof descriptor !== "object" || typeof descriptor.value !== "function") {
            throw new TypeError("Only functions may be decorated with @Watch");
        }

        descriptor.value.__watch__ = {
            callback: descriptor.value,
            path,
            options,
        };

        return descriptor;
    };
}
