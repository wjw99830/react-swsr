# React SWSR(ServiceWorker Side Rendering)

SWSR is a solution which could let your application render in service worker and respond full html for navigation as same as SSR.

## Usage

### Worker

`worker.js` is some data fetching functions which run in service worker.

```ts
import type { IComment, IPost } from '../../typings/json-placeholder';

const getPostIdByRequest = (req: Request) => new URL(req.url).searchParams.get('id');

export const getPost = (req: Request) =>
  fetch(`https://jsonplaceholder.typicode.com/posts/${getPostIdByRequest(req)}`).then(
    (response) => response.json() as Promise<IPost>
  );

export const getComments = (req: Request) =>
  fetch(`https://jsonplaceholder.typicode.com/posts/${getPostIdByRequest(req)}/comments`).then(
    (response) => response.json() as Promise<IComment[]>
  );
```

### App

`<App />` is the root component of application, exported as default.

```tsx
import { Use, useStreamChunks } from '@react-swsr/runtime';
import { getPost, getComments } from './worker';
import { Skeleton } from '../../components/skeleton';
import type { IComment, IPost } from '../../typings/json-placeholder';

export default () => {
  const chunks = useStreamChunks<{ getPost: IPost; getComments: IComment[] }>() || {
    getPost: getPost(new Request(location.href)),
    getComments: getComments(new Request(location.href)),
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

          <Use
            chunk={chunks.getPost}
            pending={
              <>
                <Skeleton Tag="h2" width={400} height={36} />
                <Skeleton Tag="p" width="100%" />
                <Skeleton Tag="p" width="100%" />
              </>
            }
            rejected={(error) => <p>Failed to fetch post: {error}</p>}
          >
            {(post) => (
              <>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
              </>
            )}
          </Use>
        </section>

        <section>
          <h2>Comments</h2>
          <hr />

          <Use
            chunk={chunks.getComments}
            pending={new Array(5).fill(0).map((_, index) => (
              <section key={index} className="comment">
                <Skeleton Tag="p" className="comment-name" width={256} />
                <Skeleton Tag="p" className="comment-body" width="100%" />
                <Skeleton Tag="p" className="comment-body" width="100%" />
              </section>
            ))}
            rejected={(error) => <p>Failed to fetch comments: {error}</p>}
          >
            {(comments) =>
              comments.map((it) => (
                <section key={it.id} className="comment">
                  <p className="comment-name">{it.name}</p>
                  <p className="comment-body">{it.body}</p>
                </section>
              ))
            }
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
  plugins: [
    pluginReact(),
    swsr([
      {
        // entry name of swsr compiler
        entry: 'stream',
        // rendering mode
        mode: 'stream',
        // path of application root component which relative to compiler context
        app: './src/pages/stream/app.tsx',
        // path of worker module which relative to compiler context
        worker: './src/pages/stream/worker.ts',
        // output filename of swsr bundle
        filename: 'stream/swsr.js',
        html: {
          // match the corresponding html file to inline into swsr.js
          filename: 'stream/index.html',
          // match the navigation request
          route: /stream\/(index(\.html?)?)?/,
        },
      },
      {
        // entry name of swsr compiler
        entry: 'string',
        // rendering mode
        mode: 'string',
        // path of application root component which relative to compiler context
        app: './src/pages/string/app.tsx',
        // path of worker module which relative to compiler context
        worker: './src/pages/string/worker.ts',
        // output filename of swsr bundle
        filename: 'string/swsr.js',
        html: {
          // match the corresponding html file to inline into swsr.js
          filename: 'string/index.html',
          // match the navigation request
          route: /string\/(index(\.html?)?)?/,
        },
      },
    ]),
  ],
  source: {
    entry: {
      main: './src/pages/main/index.tsx',
      stream: './src/pages/stream/index.tsx',
      string: './src/pages/string/index.tsx',
    },
  },
  html: {
    outputStructure: 'nested', // usually use nested directory structure, because the scope of service worker is based on pathname.
  },
});
```

### Hydration

```tsx
import { createRoot, hydrateRoot } from 'react-dom/client';
import { getSwsrInfo } from '@react-swsr/runtime';
import App from './app';

const root = document.getElementById('root')!;
if (getSwsrInfo().hit) {
  // hydrate like SSR
  hydrateRoot(root, <App />);
} else {
  // if not hit, fallback to CSR
  createRoot(root).render(<App />);
}
```
