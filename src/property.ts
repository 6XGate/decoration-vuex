import type { VueDecorator } from "vue-class-component";
import { createDecorator } from "vue-class-component";
import { mapGetters, mapMutations } from "vuex";
import { getModuleName } from "./store-modules";
import type { StoreModule } from "./store-modules";

export type PropertyType<M extends StoreModule, K extends keyof M> = M[K];

export function MapProperty<M extends StoreModule, K extends keyof M>(module: M, state: K): VueDecorator {
    return createDecorator((options, key) => {
        const getters = mapGetters(getModuleName(module), { get: state as string });
        const setters = mapMutations(getModuleName(module), { set: state as string });

        // TODO: Determine test to cover both cases.
        const computed = (options.computed || (options.computed = {}));
        computed[key] = {
            get: getters.get,
            set: setters.set,
        };
    });
}
