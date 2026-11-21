import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// BRECA — Camada 1 (PWA)
// Sem plugins de telemetria. O build é estático e roda 100% no dispositivo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
    },
  },
})
