import { sValidator } from '@hono/standard-validator';
import * as z from 'zod';

import { hondo, HondoRouter } from '~/index';

const fields = () => ({ count: 0 });

const router = new HondoRouter<typeof fields>()
    .get('/count', (ctx) => {
        return ctx.json({ count: ctx.var.durable.count });
    })
    .post('/add', sValidator('query', z.object({ amount: z.coerce.number().int() })), (ctx) => {
        const { amount } = ctx.req.valid('query');
        ctx.var.durable.count = ctx.var.durable.count + amount;
        return ctx.json({ count: ctx.var.durable.count });
    })
    .post(
        '/schedule',
        sValidator('query', z.object({ time: z.coerce.number().int() })),
        async (ctx) => {
            await ctx.var.state.storage.setAlarm(Date.now() + 1000);
            return ctx.json({ success: true });
        },
    );

export const CounterViaFields = hondo(router, {
    fields,
    alarm: (durable) => {
        durable.count = 0;
    },
});
