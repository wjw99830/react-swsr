import { useContext } from 'react';
import { SwsrContext } from './internal';

export type SwsrChunk<T> = Promise<T> | T | Error;

export type SwsrChunks<T extends object> = {
  [K in keyof T]: SwsrChunk<T[K]>;
};

export function useChunks<T extends object>() {
  const chunks = useContext(SwsrContext);
  return typeof window === 'undefined'
    ? (chunks as SwsrChunks<T> | null)
    : getStringChunks<T>() || getStreamChunks<T>();
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
export const enum ESwsrChunkStatus {
  Pending,
  Resolved,
  Rejected,
}
