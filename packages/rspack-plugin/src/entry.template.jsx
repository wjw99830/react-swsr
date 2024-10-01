import { renderToReadableStream, renderToString } from 'react-dom/server';

const Target = (() => {
  try {
    new ReadableStream({ type: 'bytes' });
    return 'stream';
  } catch (error) {
    return 'string';
  }
})();

self.__SWSR_RENDERING_TARGET__ = Target;

const { SwsrContext } = require('@react-swsr/runtime').__internal__;
const { default: App } = require('{{app}}');
const { match = defaultMatch, onResponse, onRenderError, ...worker } = require('{{worker}}');

const ContentPlaceholder = '{{ContentPlaceholder}}';
const ScriptPlaceholder = '{{ScriptPlaceholder}}';
const Template = `{{template}}`;
const StreamEnding = '__SWSR_STREAM_ENDING__';
const StreamEndingRegex = new RegExp(`${StreamEnding}$`);

const decoder = new TextDecoder();
const encoder = new TextEncoder();

addEventListener('fetch', (e) => {
  /** @type {Request} */
  const request = e.request;

  e.respondWith(
    request.mode === 'navigate' && match(request)
      ? render(Template, request)
          .then((body) => {
            const response = new Response(body, {
              status: 200,
              headers: {
                'Content-Type': 'text/html',
                ...(Target === 'stream' ? { 'Transfer-Encoding': 'chunked' } : {}),
              },
            });
            onResponse?.(response);
            return response;
          })
          .catch((error) => {
            onRenderError?.(error);
            return fetch(request);
          })
      : fetch(request)
  );
});

/**
 *
 * @param {string} template
 * @param {Request} request
 * @returns
 */
function render(template, request) {
  if (Target === 'string') {
    return new Promise((resolve, reject) => {
      try {
        resolve(renderToStringHTML(template, request));
      } catch (error) {
        reject(error);
      }
    });
  }

  return renderToStreamingHTML(template, request);
}

/**
 *
 * @param {string} template
 * @param {Request} request
 * @returns {string}
 */
function renderToStringHTML(template, request) {
  const keys = Object.keys(worker);
  const promises = keys.map((key) => worker[key](request));
  return Promise.all(promises).then((values) => {
    const chunks = values.reduce((chunks, value, i) => {
      chunks[keys[i]] = value;
      return chunks;
    }, {});
    const content = renderToString(
      <SwsrContext.Provider value={chunks}>
        <App />
      </SwsrContext.Provider>
    );
    return template
      .replace(ContentPlaceholder, content)
      .replace(
        ScriptPlaceholder,
        `<script id="swsr-runtime">window.__SWSR_RENDERING_TARGET__='string';window.__SWSR_CHUNKS__=${JSON.stringify(
          chunks
        )};</script>`
      );
  });
}

/**
 *
 * @param {string} template
 * @param {Request} request
 * @returns {Promise<ReadableStream>}
 */
function renderToStreamingHTML(template, request) {
  const keys = Object.keys(worker);
  /** @type {{ key: string; promise: Promise<unknown> }[]} */
  const chunks = keys.map((key) => ({ key, promise: worker[key](request) }));
  const ts = new TransformStream(undefined, { highWaterMark: 0 }, { highWaterMark: 0 });
  const writer = ts.writable.getWriter();

  // Inject scripts for client <Suspense /> rendering
  chunks.forEach(({ key, promise }) => {
    promise.then(
      (value) =>
        writer.write(
          encoder.encode(`<script>window.__SWSR_CHUNK_CONNECTIONS__.${key}.resolve(${JSON.stringify(value)})</script>`)
        ),
      (error) =>
        writer.write(
          encoder.encode(
            `<script>window.__SWSR_CHUNK_CONNECTIONS__.${key}.reject(${
              typeof error?.message === 'undefined' ? '' : JSON.stringify(error.message)
            })</script>`
          )
        )
    );
  });

  return renderToReadableStream(
    <>
      <SwsrContext.Provider
        value={chunks.reduce((map, chunk) => {
          map[chunk.key] = chunk.promise;
          return map;
        }, {})}
      >
        <App />
      </SwsrContext.Provider>
      {StreamEnding}
    </>
  ).then((rs) => {
    let shellReady = false;
    let shell = '';
    const reader = rs.getReader();
    reader.read().then(function onRead({ done, value }) {
      if (done) {
        writer.close();
        return;
      }

      const content = decoder.decode(value);
      if (!shellReady) {
        if (content.match(StreamEndingRegex)) {
          // Shell is ready, inject the whole shell to template and send it
          shell += content.replace(StreamEndingRegex, '');
          shellReady = true;
          const html = template
            .replace(ContentPlaceholder, shell)
            .replace(
              ScriptPlaceholder,
              `<script id="swsr-runtime">window.__SWSR_RENDERING_TARGET__='stream';{{StreamRuntime}};__SWSR_CREATE_CONNECTIONS__(${JSON.stringify(
                keys
              )});</script>`
            );
          writer.write(encoder.encode(html));
        } else {
          // Shell isn't ready, keep collecting
          shell += content;
        }
      } else {
        // After shell ready, send async chunks directly
        writer.write(value);
      }

      return reader.read().then(onRead);
    });

    return ts.readable;
  });
}

/**
 *
 * @param {Request} request
 * @returns {boolean}
 */
function defaultMatch(request) {
  const { pathname } = new URL(request.url);
  return pathname.match(/^\/(index(\.html?)?)?$/);
}
