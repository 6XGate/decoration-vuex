import type { StoreModuleConstructor } from "../module";
import type { RegisterOptions } from "../options";
import type { StoreModule } from "../store-modules";
import { makeProxyFactory } from "./factory";

class StoreModuleStaticHandler<M extends StoreModuleConstructor> implements ProxyHandler<M> {
    // eslint-disable-next-line class-methods-use-this,@typescript-eslint/naming-convention,@typescript-eslint/no-explicit-any
    construct(Target: M, args: [RegisterOptions, ...any[]]): InstanceType<M> {
        type S = InstanceType<M>;

        const instance = new Target(...args) as S;
        const factory = makeProxyFactory(Target, instance);

        Object.seal(instance);

        return factory.makePublicProxy();
    }
}

const cache = new StoreModuleStaticHandler<typeof StoreModule>();
function handler<M extends typeof StoreModule>(): StoreModuleStaticHandler<M> {
    return cache;
}

export function makeStaticProxy<M extends typeof StoreModule>(module: M): M {
    return new Proxy(module, handler<M>());
}
