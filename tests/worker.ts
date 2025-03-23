export default {
    fetch: (_: Request): Response => {
        return new Response('Hello, World!');
    },
} satisfies ExportedHandler;

export * from './objects';
