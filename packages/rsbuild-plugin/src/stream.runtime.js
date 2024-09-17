/** @param {string[]} chunks  */
function __SWSR_CREATE_CONNECTIONS__(chunks) {
  window.__SWSR_CHUNK_CONNECTIONS__ = chunks.reduce((o, chunk) => {
    o[chunk] = __SWSR_CREATE_CONNECTION__();
    return o;
  }, {});
}

function __SWSR_CREATE_CONNECTION__() {
  const o = { status: 0 };

  o.promise = new Promise((resolve, reject) => {
    o.resolve = (value) => {
      o.status = 1;
      o.data = value;
      resolve(value);
    };
    o.reject = (message) => {
      o.status = 2;
      const error = new Error(message);
      error.name = 'SwsrChunkError';
      o.error = error;
      reject(error);
    };
  });

  return o;
}
