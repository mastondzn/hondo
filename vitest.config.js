import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import paths from 'vite-tsconfig-paths';

export default defineWorkersConfig({
    plugins: [paths()],
    test: {
        globals: true,
        poolOptions: {
            workers: {
                singleWorker: true,
                isolatedStorage: true,
                main: './tests/worker.ts',
                miniflare: {
                    compatibilityDate: '2025-03-10',
                    durableObjects: {
                        COUNTER: { className: 'Counter' },
                        COUNTER2: { className: 'CounterViaFields' },
                    },
                },
            },
        },
    },
});
