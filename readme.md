# hondo

Enhanced Cloudflare Durable Objects with hono.

## Installation

```bash
pnpm install @mastondzn/hondo hono
```

## Usage

```typescript
import { env } from 'cloudflare:workers';
import { hondo, HondoRouter } from 'hondo';

const router = new HondoRouter().get('/count', async (ctx) => {
    const count = await ctx.var.state.storage.get<number>('count');
    return ctx.json({ count: count ?? 0 });
});

const Counter = hondo(router);

export default {
    fetch: async () => {
        const id = env.COUNTER.idFromName('foo');
        const stub = env.COUNTER.get(id);
        // type-safe client like hono/client
        const client = Counter.clientForStub(stub);

        // get back a typed response
        const response = await client.count.$get();
        const { count } = await response.json();
        return new Response(`Count: ${count}`);
    },
} satisfies ExportedHandler;

export { Counter };
```
