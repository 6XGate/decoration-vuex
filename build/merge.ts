import path from "path";
import { isFunction, isNil, isObject, isString } from "lodash";
import type { InputOption } from "rollup";
import { msg } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MergeStrategy = (target: any, source: any) => any;
export type MergeStrategies = { [property: string]: MergeStrategy|MergeStrategies };

function chunkNameOf(fileName: string): string {
    const parts = path.parse(fileName);
    parts.ext = "";

    return path.format(parts);
}

type FileMap = { [chunk: string]: string };

function fileArrayToMap(input: readonly string[]): FileMap {
    const map = {} as FileMap;
    for (const entry of input) {
        map[chunkNameOf(entry)] = entry;
    }

    return map;
}

export function mergeInput(target: InputOption, source: InputOption): InputOption {
    if (isNil(source)) {
        return target;
    }

    if (isNil(target)) {
        if (!isString(source) && !Array.isArray(source) && !isObject(source)) {
            throw new TypeError(msg("`input` must be a string, array, or object"));
        }

        return source;
    }

    if (Array.isArray(target)) {
        if (Array.isArray(source)) {
            return [ ...target, ...source ];
        }

        if (typeof source === "object") {
            return { ...fileArrayToMap(target), ...source };
        }

        if (isString(source)) {
            return [ ...target, source ];
        }

        throw new TypeError(msg("`input` must be a string, array, or object"));
    }

    if (typeof target === "object") {
        if (Array.isArray(source)) {
            return { ...target, ...fileArrayToMap(source) };
        }

        if (typeof source === "object") {
            return { ...target, ...source };
        }

        if (isString(source)) {
            return { ...target, [chunkNameOf(source)]: source };
        }

        throw new TypeError(msg("`input` must be a string, array, or object"));
    }

    if (Array.isArray(source)) {
        return [ target, ...source ];
    }

    if (typeof source === "object") {
        return { [chunkNameOf(target)]: target, ...source };
    }

    if (isString(source)) {
        return [ target, source ];
    }

    throw new TypeError(msg("`input` must be a string, array, or object"));
}

export function mergeMaybeArray<T>(target: undefined|null|T|T[], source: undefined|null|T|T[]): undefined|null|T|T[] {
    if (isNil(target)) {
        return source;
    }

    if (isNil(source)) {
        return target;
    }

    if (Array.isArray(target)) {
        Array.isArray(source) ?
            target.push(...source) :
            target.push(source);

        return target;
    }

    return Array.isArray(source) ?
        [ target, ...source ] :
        [ target, source ];
}

export function ignore<T>(target: undefined|null|T, _source: undefined|null|T): undefined|null|T {
    return target;
}

export function replace<T>(_target: undefined|null|T, source: undefined|null|T): undefined|null|T {
    return source;
}

export function merge<T>(strategies: MergeStrategies, target: T, source: T): T {
    for (const [ name, strategy ] of Object.entries(strategies)) {
        if (isFunction(strategy)) {
            if (name in target) {
                if (name in source) {
                    target[name as keyof T] = strategy(target[name as keyof T], source[name as keyof T]) as T[keyof T];
                }
            } else if (name in source) {
                const value = strategy(undefined, source[name as keyof T]) as T[keyof T];
                if (!isNil(value)) {
                    target[name as keyof T] = value;
                }
            }
        } else {
            const base = target[name as keyof T] as unknown as null|undefined|T[keyof T];
            const input = source[name as keyof T] as unknown as null|undefined|T[keyof T];

            target[name as keyof T] = merge<T[keyof T]>(strategy, base || {} as T[keyof T], input || {} as T[keyof T]);
        }
    }

    return target;
}
