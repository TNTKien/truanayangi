import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import counterConfig from './counter/public-config.json';

export default defineConfig({
  base: '/',
  plugins: [react(), cloudflare()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  define: {
    'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify(''),
    'process.env.NEXT_PUBLIC_COUNTER_API_URL': JSON.stringify(
      process.env.NEXT_PUBLIC_COUNTER_API_URL || counterConfig.apiUrl,
    ),
  },
});
