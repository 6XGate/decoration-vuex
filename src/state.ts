import type { VueDecorator } from "vue-class-component";
import { createDecorator } from "vue-class-component";
import { mapState } from "vuex";
import { getModuleName } from "./store-modules";
import type { StoreModule } from "./store-modules";

export type StateType<M extends StoreModule, K extends keyof M> = M[K];

export function MapState<M extends StoreModule, K extends keyof M>(module: M, state: K): VueDecorator {
    return createDecorator((options, key) => {
        const mappings = mapState(getModuleName(module), { [key]: state as string });

        const computed = (options.computed || (options.computed = {}));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        computed[key] = mappings[key]!;
    });
}
