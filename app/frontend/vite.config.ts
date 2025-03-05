import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {'@': new URL('./src', import.meta.url).pathname},
  },
  server: {
    host: true,
    port: 3000,
  },
  optimizeDeps: {
    // ethers is only reached through a dynamic import(), so Vite does not see it
    // when it pre-bundles on boot. It would discover it the first time someone
    // clicks Connect, re-run the optimizer mid-session, and answer every
    // already-loaded module with "504 Outdated Optimize Dep". Declaring it up
    // front means the optimizer runs exactly once.
    include: ['ethers'],
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        // ethers plus its crypto dependencies are by far the heaviest thing we
        // ship. Splitting by package — rather than by entry module — keeps
        // @noble/* and friends in the wallet chunk instead of leaking into the
        // one every visitor downloads.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (/node_modules\/(ethers|@noble|@adraffy|aes-js|@scure)/.test(id)) {
            return 'wallet';
          }

          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) {
            return 'react';
          }

          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
  },
});
