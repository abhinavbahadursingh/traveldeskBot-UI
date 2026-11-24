import { defineConfig, type Plugin, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import { bookingsApi, gstApi } from './server/api';

// Dashboard API: reads/writes the bot's SQLite DB directly (server/api.ts).
const api: Plugin = {
  name: 'traveldesk-api',
  configureServer(server) { server.middlewares.use(bookingsApi); server.middlewares.use(gstApi); },
  configurePreviewServer(server) { server.middlewares.use(bookingsApi); server.middlewares.use(gstApi); },
};

// /book: the bot's web booking service (python -m traveldesk.web).
const bookService: Record<string, ProxyOptions> = {
  '^/api/book/': { target: process.env.TRAVELDESK_WEB_URL || 'http://127.0.0.1:8787', changeOrigin: true },
};

export default defineConfig({
  plugins: [react(), api],
  server: { proxy: bookService },
  preview: { proxy: bookService },
});
