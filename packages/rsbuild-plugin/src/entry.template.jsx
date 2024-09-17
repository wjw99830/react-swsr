import { renderToReadableStream, renderToString } from "react-dom/server";
import { __internal__ } from "@react-swsr/runtime";
import App from "{{app}}";

const { StreamContext, StringContext, log } = __internal__;
const worker = require("{{worker}}");
const Version = "{{version}}";
const ContentPlaceholder = "{{ContentPlaceholder}}";
const ScriptPlaceholder = "{{ScriptPlaceholder}}";
const TemplateUrl = "{{template}}";
const StreamEnding = "__SWSR_STREAM_ENDING__";
const StreamEndingRegex = new RegExp(`${StreamEnding}$`);
const decoder = new TextDecoder();
const encoder = new TextEncoder();

addEventListener("install", () => {
  skipWaiting();
});

addEventListener("activate", (e) => {
  e.waitUntil(
    caches.open("swsr").then((cache) => {
      cache.delete(TemplateUrl);
      return fetch(TemplateUrl).then((response) => {
        if (response.status === 200) {
          /* @__PURE__ */ log("Activated");
          return cache.put(TemplateUrl, response);
        }

        /* @__PURE__ */ log("Failed to fetch " + TemplateUrl);
      });
    })
  );
});

addEventListener("fetch", (e) => {
  const request = e.request;
  e.respondWith(
    caches.open("swsr").then((cache) =>
      cache.match(request).then((response) => {
        if (response) {
          return response.text().then((template) => {
            if (
              !Version ||
              template.includes(`<!-- __SWSR_VERSION_${Version}__ -->`)
            ) {
              return render(template)
                .then(
                  (response) =>
                    new Response(response, {
                      status: 200,
                      headers: {
                        "Content-Type": "text/html",
                        ...("{{mode}}" === "stream"
                          ? { "Transfer-Encoding": "chunked" }
                          : {}),
                      },
                    })
                )
                .catch((error) => {
                  console.error(error);
                  /* @__PURE__ */ log(
                    "Failed to render due to error above, fallback to CSR"
                  );
                  return fetch(request);
                });
            }

            return fetch(request);
          });
        }

        return fetch(request);
      })
    )
  );
});

function render(template) {
  if ("{{mode}}" === "string") {
    return new Promise((resolve, reject) => {
      try {
        resolve(renderToStringHTML(template));
      } catch (error) {
        reject(error);
      }
    });
  }

  return renderToStreamingHTML(template);
}

/**
 *
 * @param {string} template
 * @returns {string}
 */
function renderToStringHTML(template) {
  const keys = Object.keys(worker);
  const promises = keys.map((key) => worker[key]());
  return Promise.all(promises).then((values) => {
    const chunks = values.reduce((chunks, value, i) => {
      chunks[keys[i]] = value;
      return chunks;
    }, {});
    const content = renderToString(
      <StringContext.Provider value={{ chunks }}>
        <App />
      </StringContext.Provider>
    );
    return template
      .replace(ContentPlaceholder, content)
      .replace(
        ScriptPlaceholder,
        `<script id="swsr-runtime">window.__SWSR_MODE__='string';window.__SWSR_CHUNKS__=${JSON.stringify(
          chunks
        )};</script>`
      );
  });
}

/**
 *
 * @param {string} template
 * @returns {Promise<ReadableStream>}
 */
function renderToStreamingHTML(template) {
  const keys = Object.keys(worker);
  /** @type {{ key: string; promise: Promise<unknown> }[]} */
  const chunks = keys.map((key) => ({ key, promise: worker[key]() }));
  const ts = new TransformStream(
    undefined,
    { highWaterMark: 0 },
    { highWaterMark: 0 }
  );
  const writer = ts.writable.getWriter();

  // Inject scripts for client <Suspense /> rendering
  chunks.forEach(({ key, promise }) => {
    promise.then(
      (value) =>
        writer.write(
          encoder.encode(
            `<script>window.__SWSR_CHUNK_CONNECTIONS__.${key}.resolve(${JSON.stringify(
              value
            )})</script>`
          )
        ),
      (error) =>
        writer.write(
          encoder.encode(
            `<script>window.__SWSR_CHUNK_CONNECTIONS__.${key}.reject(${
              typeof error?.message === "undefined"
                ? ""
                : JSON.stringify(error.message)
            })</script>`
          )
        )
    );
  });

  return renderToReadableStream(
    <>
      <StreamContext.Provider
        value={{
          chunks: chunks.reduce((map, chunk) => {
            map[chunk.key] = chunk.promise;
            return map;
          }, {}),
        }}
      >
        <App />
      </StreamContext.Provider>
      {StreamEnding}
    </>
  ).then((rs) => {
    let shellReady = false;
    let shell = "";
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
          shell += content.replace(StreamEndingRegex, "");
          shellReady = true;
          const html = template
            .replace(ContentPlaceholder, shell)
            .replace(
              ScriptPlaceholder,
              `<script id="swsr-runtime">window.__SWSR_MODE__='stream';{{StreamRuntime}};__SWSR_CREATE_CONNECTIONS__(${JSON.stringify(
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
