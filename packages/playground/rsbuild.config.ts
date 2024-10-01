import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { swsr } from '@react-swsr/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    swsr({
      app: './src/pages/target/app.tsx',
      worker: './src/pages/target/worker.ts',
      html: { filename: 'target.html' },
    }),
  ],
  source: {
    preEntry: ['./src/global.css'],
    entry: {
      main: './src/pages/main/index.tsx',
      target: './src/pages/target/index.tsx',
    },
  },
  server: {
    open: false,
  },
  dev: {
    writeToDisk: true,
    hmr: false,
    liveReload: false,
  },
});
