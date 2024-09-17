# React SWSR(ServiceWorker Side Rendering)

SWSR is a solution which could let your application render in service worker and respond full html for navigation as same as SSR.

## Concepts

### App

Root component of application, exported as default.

### Worker

Data fetching functions which run in service worker.

## Usage

### Worker

`worker.js` is some data fetching functions which run in service worker.

```js
export const random = () =>
  fetch("/random").then((response) => response.json());

export const random2 = () =>
  fetch("/random").then((response) => response.json());
```

### App

`<App />` is the root component of application, exported as default.

```tsx
import { Use, useStreamChunks } from "@react-swsr/runtime";
import { random, random2 } from "./worker";

export default () => {
  const chunks = useStreamChunks<{ random: number; random2: number }>() || {
    random: random(),
    random2: random2(),
  };

  return (
    <>
      <h1>SWSR Demo</h1>

      <Use
        chunk={chunks.random}
        pending={<p>Random loading...</p>}
        rejected={(error) => <p>Failed to fetch random: {error}</p>}
      >
        {(random) => <p>Random: {random}</p>}
      </Use>

      <Use
        chunk={chunks.random2}
        pending={<p>Random2 loading...</p>}
        rejected={(error) => <p>Failed to fetch random: {error}</p>}
      >
        {(random) => {
          return <p>Random2: {random}</p>;
        }}
      </Use>
    </>
  );
};
```

### Configuration

```ts
// rsbuild.config.ts
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
          html: "/stream/index.html",
          app: "./src/pages/stream/app.tsx",
          worker: "./src/pages/stream/worker.ts",
        },
        {
          mode: "string",
          name: "string",
          html: "/string/index.html",
          app: "./src/pages/string/app.tsx",
          worker: "./src/pages/string/worker.ts",
        },
      ],
    }),
  ],
  source: {
    entry: {
      main: "./src/pages/main/index.tsx",
      stream: "./src/pages/stream/index.tsx",
      string: "./src/pages/string/index.tsx",
    },
  },
  html: {
    outputStructure: "nested", // use nested directory structure, because the scope of service worker is based on path.
  },
});
```

### Hydration

```tsx
import { createRoot, hydrateRoot } from "react-dom/client";
import { getSwsrInfo } from "@react-swsr/runtime";
import App from "./app";

const root = document.getElementById("root")!;
if (getSwsrInfo().hit) {
  // hydrate like SSR
  hydrateRoot(root, <App />);
} else {
  // if not hit, fallback to CSR
  createRoot(root).render(<App />);
}
```
