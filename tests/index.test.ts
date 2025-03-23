import { env, runDurableObjectAlarm } from 'cloudflare:test';

import { Counter, CounterViaFields } from './objects';

declare module 'cloudflare:test' {
    interface ProvidedEnv {
        COUNTER: DurableObjectNamespace;
        COUNTER2: DurableObjectNamespace;
    }
}

describe('counter', () => {
    it('should work', async () => {
        const id = env.COUNTER.idFromName('foo');
        const stub = env.COUNTER.get(id);
        const client = Counter.clientForStub(stub);

        const response = await client.count.$get();
        const { count } = await response.json();

        expect(count).toBe(0);
        const neww = await (await client.add.$post({ query: { amount: '5' } })).json();
        expect(neww.count).toBe(5);

        // schedule an alarm
        const res = await client.schedule.$post({ query: { time: Date.now().toString(10) } });
        await res.json();

        // Run the alarm
        const ran = await runDurableObjectAlarm(stub);
        expect(ran).toBe(true);

        const newww = await (await client.count.$get()).json();
        expect(newww.count).toBe(0);
    });
});

describe('counterViaFields', () => {
    it('should work', async () => {
        const id = env.COUNTER2.idFromName('foo');
        const stub = env.COUNTER2.get(id);
        const client = CounterViaFields.clientForStub(stub);

        const response = await client.count.$get();
        const { count } = await response.json();

        expect(count).toBe(0);
        const neww = await (await client.add.$post({ query: { amount: '5' } })).json();
        expect(neww.count).toBe(5);

        // schedule an alarm
        const res = await client.schedule.$post({ query: { time: Date.now().toString(10) } });
        await res.json();

        // Run the alarm
        const ran = await runDurableObjectAlarm(stub);
        expect(ran).toBe(true);

        const newww = await (await client.count.$get()).json();
        expect(newww.count).toBe(0);
    });
});
