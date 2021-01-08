import type { RegisterOptions } from "../options";
import type { StoreModule } from "../store-modules";
import { makeProxyFactory } from "./factory";

class StoreModuleStaticHandler<M extends typeof StoreModule> implements ProxyHandler<M> {
    // eslint-disable-next-line @typescript-eslint/naming-convention,class-methods-use-this
    construct(Target: M, args: [RegisterOptions]): InstanceType<M> {
        type S = InstanceType<M>;

        const instance = new Target(...args) as S;
        const factory = makeProxyFactory(Target, instance);

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
