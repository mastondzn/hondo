import type { UnionToIntersection } from 'hono/utils/types';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono';
import { type ClientRequestOptions, hc } from 'hono/client';

import type { Client, SomeFunction } from './types';

export interface HondoOptions<
    // eslint-disable-next-line ts/no-empty-object-type
    TFields extends Record<string, unknown> = {},
    TDurable = TFields &
        DurableObject<Cloudflare.Env> & {
            env: Cloudflare.Env;
            state: DurableObjectState;
        },
> {
    /**
     * Function that returns the fields to be added to the durable object
     * @example () => ({ counter: 0 })
     */
    fields?: () => TFields;

    /**
     * Do something in the constructor of the durable object
     * For example: durable.ctx.blockConcurrencyWhile(...)
     */
    init?: (durable: TDurable) => void;

    /**
     * Do something when the alarm is triggered after a ctx.storage.setAlarm()
     * @see https://developers.cloudflare.com/durable-objects/api/base/#alarm
     */
    alarm?: (durable: TDurable, alarmInfo?: AlarmInvocationInfo) => void | Promise<void>;

    /** @see https://developers.cloudflare.com/durable-objects/api/base/#websocketclose */
    webSocketClose?: (
        durable: TDurable,
        ws: WebSocket,
        code: number,
        reason: string,
        wasClean: boolean,
    ) => void | Promise<void>;

    /** @see https://developers.cloudflare.com/durable-objects/api/base/#websocketerror */
    webSocketError?: (durable: TDurable, ws: WebSocket, error: unknown) => void | Promise<void>;

    /** @see https://developers.cloudflare.com/durable-objects/api/base/#websocketmessage */
    webSocketMessage?: (
        durable: TDurable,
        ws: WebSocket,
        message: string | ArrayBuffer,
    ) => void | Promise<void>;
}

interface Variables<TFields extends Record<string, unknown>> {
    durable: DurableObject<Cloudflare.Env> & TFields;
    state: DurableObjectState;
    env: Cloudflare.Env;
}

export interface HondoEnv<TFields extends Record<string, unknown>> {
    Variables: Variables<TFields>;
}

export function hondo<
    TFields extends Record<string, unknown>,
    THondoEnv extends HondoEnv<TFields>,
    TRouter extends Hono<THondoEnv>,
>(router: TRouter, options: HondoOptions<TFields> = {}) {
    return class Hondo extends DurableObject<Cloudflare.Env> {
        public env: Cloudflare.Env;
        public state: DurableObjectState;
        public router: TRouter;
        public ctx: DurableObjectState;

        constructor(state: DurableObjectState, env: Cloudflare.Env) {
            super(state, env);
            this.env = env;
            this.state = state;
            this.ctx = state;

            const fields =
                (typeof options.fields === 'function' ? options.fields() : options.fields) ?? {};
            Object.assign(this, fields);

            // @ts-expect-error ts cant resolve the type of the fields
            this.router = new Hono<THondoEnv>()
                .use('*', async (ctx, next) => {
                    ctx.set('durable', this);
                    ctx.set('state', this.state);
                    ctx.set('env', this.env);
                    return next();
                })
                .route('/', router);

            // @ts-expect-error ts cant resolve the type of the fields
            options.init?.(this);
        }

        fetch(request: Request): Response | Promise<Response> {
            return this.router.fetch(request);
        }

        alarm(alarmInfo?: AlarmInvocationInfo): void | Promise<void> {
            // @ts-expect-error ts cant resolve the type of the fields
            return options.alarm?.(this, alarmInfo);
        }

        webSocketClose(
            ws: WebSocket,
            code: number,
            reason: string,
            wasClean: boolean,
        ): void | Promise<void> {
            // @ts-expect-error ts cant resolve the type of the fields
            return options.webSocketClose?.(this, ws, code, reason, wasClean);
        }

        webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {
            // @ts-expect-error ts cant resolve the type of the fields
            return options.webSocketError?.(this, ws, error);
        }

        webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> {
            // @ts-expect-error ts cant resolve the type of the fields
            return options.webSocketMessage?.(this, ws, message);
        }

        static clientForStub(
            stub: DurableObjectStub,
            options?: Omit<ClientRequestOptions, 'webSocket' | 'fetch'>,
        ): UnionToIntersection<Client<TRouter>> {
            return hc<TRouter>('http://do', {
                fetch: stub.fetch.bind(stub),
                ...options,
            });
        }
    };
}

export class HondoRouter<
    // eslint-disable-next-line ts/no-empty-object-type
    TFields extends Record<string, unknown> | (() => Record<string, unknown>) = {},
> extends Hono<HondoEnv<TFields extends SomeFunction ? ReturnType<TFields> : TFields>> {}
