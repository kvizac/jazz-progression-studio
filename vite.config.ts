import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'studio-development-entry',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const request = req as { url?: string };
        if (request.url === '/' || request.url?.indexOf('/?') === 0) request.url = '/studio.html' + request.url.slice(1);
        next();
      });
    },
  }],
  base: './',
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
  build: {
    target: ['es2020', 'safari14'],
    sourcemap: false,
    rollupOptions: { input: 'studio.html' },
  },
  test: { environment: 'node' },
});
