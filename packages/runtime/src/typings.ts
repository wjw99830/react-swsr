export interface ISwsrInfo {
  enabled: boolean;
  hit: boolean;
  mode: "string" | "stream" | undefined;
}

export interface IStreamContext {
  chunks: SwsrChunks<object>;
}

export type SwsrChunk<T> = Promise<T> | T | Error;

export type SwsrChunks<T extends object> = {
  [K in keyof T]: SwsrChunk<T[K]>;
};

export interface IStringContext {
  chunks: object;
}

export const enum ESwsrChunkStatus {
  Pending,
  Resolved,
  Rejected,
}
