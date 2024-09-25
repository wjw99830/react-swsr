import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { swsr } from "@react-swsr/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginReact(),
    swsr([
      {
        entry: "stream",
        mode: "stream",
        html: {
          filename: "stream/index.html",
          route: /stream\/(index(\.html?)?)?/,
        },
        app: "./src/pages/stream/app.tsx",
        worker: "./src/pages/stream/worker.ts",
        filename: "stream/swsr.js",
      },
      {
        entry: "string",
        mode: "string",
        html: {
          filename: "string/index.html",
          route: /string\/(index(\.html?)?)?/,
        },
        app: "./src/pages/string/app.tsx",
        worker: "./src/pages/string/worker.ts",
        filename: "string/swsr.js",
      },
    ]),
  ],
  source: {
    preEntry: ["./src/global.ts", "./src/global.css"],
    entry: {
      main: "./src/pages/main/index.tsx",
      stream: "./src/pages/stream/index.tsx",
      string: "./src/pages/string/index.tsx",
    },
  },
  html: {
    outputStructure: "nested",
    template: "./src/template.html",
  },
  output: {
    polyfill: "usage",
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
