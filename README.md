# React SWSR(ServiceWorker Side Rendering)

SWSR is a solution which could let your application render in service worker and respond full html for navigation as same as SSR.

## Usage

### Worker

`worker.js` is a module that run in ServiceWorker environment. It should export some functions to fetch data for rendering. Optionally, it could export `match` and `onResponse` functions to match the corresponding navigation request and do something before responding with `Response` object.

```ts
import { getComments, getPost } from './api';

/** match the corresponding navigation request */
export const match = (request: Request) => {
  const url = new URL(request.url);
  return url.pathname.endsWith('/target');
};

/** called when rendering is finished, ready to respond with `Response` object */
export const onResponse = (response: Response) => {
  console.log('onResponse', response);
};

export const post = getPost;

export const comments = getComments;
```

### App

`<App />` is the root component of application, exported as default.

```tsx
import { Use, useChunks } from '@react-swsr/runtime';
import { getPost, getComments } from './api';
import { Skeleton } from '../../components/skeleton';
import type { IComment, IPost } from '../../typings/json-placeholder';

export default () => {
  const chunks = useChunks<{ post: IPost; comments: IComment[] }>() || {
    post: getPost(new Request(location.href)),
    comments: getComments(new Request(location.href)),
  };

  return (
    <>
      <header>
        <h1>JSON Placeholder</h1>
      </header>
      <main>
        <section>
          <h2>Post</h2>
          <hr />
          <Use chunk={chunks.post} pending={<Skeleton />} rejected={(error) => <p>Failed to fetch post: {error}</p>}>
            {(post) => <Post data={post} />}
          </Use>
        </section>
        <section>
          <h2>Comments</h2>
          <hr />
          <Use
            chunk={chunks.comments}
            pending={<Skeleton />}
            rejected={(error) => <p>Failed to fetch comments: {error}</p>}
          >
            {(comments) => <Comments data={comments} />}
          </Use>
        </section>
      </main>
    </>
  );
};
```

### Configuration

```ts
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { swsr } from '@react-swsr/rsbuild-plugin';

export default defineConfig({
  source: {
    entry: {
      main: './src/pages/main/index.tsx',
      target: './src/pages/target/index.tsx',
    },
  },
  plugins: [
    pluginReact(),
    swsr({
      // root component of application
      app: './src/pages/target/app.tsx',
      // ServiceWorker module
      worker: './src/pages/target/worker.ts',
      // html configurations
      html: {
        // match the corresponding html which emitted by html plugin(e.g. `html-rspack-plugin`) and inline to `swsr.js`
        filename: 'target.html',
      },
    }),
  ],
});
```

### Hydration

```tsx
import { createRoot, hydrateRoot } from 'react-dom/client';
import { RenderingTarget } from '@react-swsr/runtime';
import App from './app';

const root = document.getElementById('root')!;
if (RenderingTarget) {
  // hydrate like SSR
  hydrateRoot(root, <App />);
} else {
  // if not hit, fallback to CSR
  createRoot(root).render(<App />);
}
```

## Rendering Target

Worker prefer to using `renderToStream`. But in some browsers that don't support readable byte stream, use `renderToString` as fallback.

We can get current rendering target by `RenderingTarget` exported from `@react-swsr/runtime`.
