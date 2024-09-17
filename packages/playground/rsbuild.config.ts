import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { swsr } from "@react-swsr/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginReact(),
    swsr({
      filename: "[name]/index.swsr.js",
      entries: [
        {
          mode: "stream",
          name: "stream",
          html: `/stream/index.html`,
          app: "./src/pages/stream/app.tsx",
          worker: "./src/pages/stream/worker.ts",
        },
        {
          mode: "string",
          name: "string",
          html: `/string/index.html`,
          app: "./src/pages/string/app.tsx",
          worker: "./src/pages/string/worker.ts",
        },
      ],
    }),
  ],
  source: {
    preEntry: ["./src/global.ts"],
    entry: {
      main: "./src/pages/main/index.tsx",
      stream: "./src/pages/stream/index.tsx",
      string: "./src/pages/string/index.tsx",
    },
  },
  html: {
    outputStructure: "nested",
  },
  server: {
    open: false,
    proxy: {
      "/random": {
        target: "http://localhost:3000",
        bypass: function (req, res) {
          if (req.url === "/random") {
            const random = Math.floor(Math.random() * 1000);
            res.setHeader("Content-Type", "application/json");
            res.end("" + random);
            return "/random";
          }
        },
      },
    },
  },
  dev: {
    writeToDisk: true,
    hmr: false,
    liveReload: false,
  },
});
