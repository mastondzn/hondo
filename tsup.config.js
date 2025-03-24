import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    external: ['cloudflare:workers'],
    tsconfig: './tsconfig.lib.json',
    dts: true,
    sourcemap: true,
    clean: true,
});
