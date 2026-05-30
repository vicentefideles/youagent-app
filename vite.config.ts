import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Necessário para @telnyx/webrtc (usa modules Node.js no browser: events, buffer, etc.)
    nodePolyfills({
      include: ['events', 'buffer', 'process', 'util', 'stream', 'crypto'],
      globals: { Buffer: true, process: true, global: true },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
