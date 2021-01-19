import type { ModuleOptions } from "./options";
import { makeStaticProxy } from "./proxy/static-proxy";
import type { StoreModule } from "./store-modules";

function isConstructor(arg: unknown): arg is typeof StoreModule {
    return typeof arg === "function";
}

interface StoreModuleDecorator {
    <M extends typeof StoreModule>(constructor: M): M;
}

function moduleDecorator(moduleOptions?: ModuleOptions): StoreModuleDecorator {
    return <M extends typeof StoreModule>(constructor: M): M => {
        Object.defineProperty(constructor, "@options", {
            configurable: false,
            enumerable:   false,
            writable:     false,
            value:        moduleOptions,
        });

        return makeStaticProxy<M>(constructor);
    };
}

/* eslint-disable @typescript-eslint/naming-convention */
export function Module<M extends typeof StoreModule>(constructor: M): M;
export function Module(options?: ModuleOptions): StoreModuleDecorator;
export function Module(arg?: ModuleOptions|typeof StoreModule): StoreModuleDecorator|typeof StoreModule {
    return isConstructor(arg) ? moduleDecorator()(arg) : moduleDecorator(arg);
}
/* eslint-enable @typescript-eslint/naming-convention */
