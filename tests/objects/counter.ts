import { sValidator } from '@hono/standard-validator';
import * as z from 'zod';

import { hondo, HondoRouter } from '~/index';

const router = new HondoRouter()
    .get('/count', async (ctx) => {
        return ctx.json({ count: (await ctx.var.state.storage.get<number>('count')) ?? 0 });
    })
    .post(
        '/add',
        sValidator('query', z.object({ amount: z.coerce.number().int() })),
        async (ctx) => {
            const { amount } = ctx.req.valid('query');
            const current = (await ctx.var.state.storage.get<number>('count')) ?? 0;
            const newCount = current + amount;
            await ctx.var.state.storage.put('count', newCount);
            return ctx.json({ count: newCount });
        },
    )
    .post(
        '/schedule',
        sValidator('query', z.object({ time: z.coerce.number().int() })),
        async (ctx) => {
            await ctx.var.state.storage.setAlarm(Date.now() + 1000);
            return ctx.json({ success: true });
        },
    );

export const Counter = hondo(router, {
    alarm: async (durable) => {
        await durable.state.storage.delete('count');
    },
});
