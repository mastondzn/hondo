import type { Schema } from 'hono';
import type { ClientRequest } from 'hono/client';
import type { HonoBase } from 'hono/hono-base';

// stolen types from hono/client, they don't export "Client"

type PathToChain<
    Path extends string,
    E extends Schema,
    Original extends string = Path,
> = Path extends `/${infer P}`
    ? PathToChain<P, E, Path>
    : Path extends `${infer P}/${infer R}`
      ? { [K in P]: PathToChain<R, E, Original> }
      : Record<
            Path extends '' ? 'index' : Path,
            ClientRequest<E extends Record<string, unknown> ? E[Original] : never>
        >;

export type Client<T> =
    // eslint-disable-next-line ts/no-explicit-any
    T extends HonoBase<any, infer S, any>
        ? S extends Record<infer K, Schema>
            ? K extends string
                ? PathToChain<K, S>
                : never
            : never
        : never;

export type SomeFunction = (...args: unknown[]) => unknown;
