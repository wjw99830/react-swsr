export function register(url: string) {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register(url);
  }
}

export * from "./chunks";
export * from "./info";
export * from "./inspect";
export * from "./use";
export { ISwsrInfo, SwsrChunk, SwsrChunks } from "./typings";

export * as __internal__ from "./internal";
