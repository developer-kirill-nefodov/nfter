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

          // siwe drags in @spruceid/siwe-parser → apg-js, which is as big as the
          // parser itself. It belongs with the wallet code, not in the chunk a
          // visitor downloads before they have even seen the login form.
          if (
            /node_modules\/(ethers|siwe|@spruceid|apg-js|@stablelib|@noble|@adraffy|aes-js|@scure)/.test(
              id,
            )
          ) {
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
