import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockApiPlugin } from './mock/plugin.ts';

export default defineConfig({
  base: './',
  plugins: [react(), mockApiPlugin()],
  server: { host: '0.0.0.0', port: 8080, strictPort: true, allowedHosts: ['sandboxshop.thddns.net'] },
  preview: { host: '0.0.0.0', port: 8080, strictPort: true, allowedHosts: ['sandboxshop.thddns.net'] },
});
