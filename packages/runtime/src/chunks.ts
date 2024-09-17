import { useContext } from "react";
import { StreamContext, StringContext } from "./internal";
import { ESwsrChunkStatus, SwsrChunks } from "./typings";

export function useStreamChunks<T extends object>() {
  const ctx = useContext(StreamContext);
  return typeof window === "undefined"
    ? (ctx?.chunks as SwsrChunks<T> | undefined)
    : getStreamChunks<T>();
}

export function useStringChunks<T extends object>() {
  const ctx = useContext(StringContext);
  return typeof window === "undefined"
    ? (ctx?.chunks as T | undefined)
    : getStringChunks<T>();
}

function getStreamChunks<T extends object>(): SwsrChunks<T> | undefined {
  const chunks: Record<string, unknown> = {};
  const conns = window.__SWSR_CHUNK_CONNECTIONS__;

  if (conns) {
    Object.keys(conns).forEach((key) => {
      const bridge = conns[key];
      if (bridge.status === ESwsrChunkStatus.Pending) {
        chunks[key] = bridge.promise;
      }

      if (bridge.status === ESwsrChunkStatus.Resolved) {
        chunks[key] = bridge.data;
      }

      if (bridge.status === ESwsrChunkStatus.Rejected) {
        chunks[key] = bridge.error;
      }
    });

    return chunks as SwsrChunks<T>;
  }
}

function getStringChunks<T extends object>(): T {
  return window.__SWSR_CHUNKS__ as T;
}

interface ISwsrChunkConnection {
  status: ESwsrChunkStatus;
  promise: Promise<unknown>;
  data?: unknown;
  error?: Error;
}

declare global {
  interface Window {
    __SWSR_CHUNK_CONNECTIONS__?: Record<string, ISwsrChunkConnection>;
    __SWSR_CHUNKS__?: Record<string, unknown>;
  }
}
