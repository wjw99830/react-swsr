import { ReactNode, useMemo, Suspense } from 'react';
import { ESwsrChunkStatus, SwsrChunk } from './chunks';

export interface IUseProps<T> {
  chunk: SwsrChunk<T>;
  pending?: ReactNode;
  rejected?: ReactNode | ((error: string | undefined) => ReactNode);
  children?: (data: T) => ReactNode;
}

export function Use<T>({ chunk, pending, rejected, children }: IUseProps<T>) {
  const reader = useMemo(() => createReader(chunk), [chunk]);

  return (
    <Suspense fallback={pending}>
      <Read reader={reader} rejected={rejected}>
        {children}
      </Read>
    </Suspense>
  );
}

interface IReadProps<T> extends Pick<IUseProps<T>, 'children' | 'rejected'> {
  reader: () => ChunkState<T>;
}

function Read<T>({ reader, children, rejected }: IReadProps<T>) {
  const state = reader();

  if (state.status === ESwsrChunkStatus.Pending) {
    throw state.promise;
  }

  if (state.status === ESwsrChunkStatus.Resolved) {
    return children?.(state.data);
  }

  return typeof rejected === 'function' ? rejected?.(state.error) : rejected;
}

type ChunkState<T> =
  | {
      status: ESwsrChunkStatus.Pending;
      promise: Promise<T>;
    }
  | {
      status: ESwsrChunkStatus.Resolved;
      data: T;
    }
  | {
      status: ESwsrChunkStatus.Rejected;
      error: string | undefined;
    };

function createReader<T>(chunk: SwsrChunk<T>): () => ChunkState<T> {
  let status: ESwsrChunkStatus;
  let data: T | undefined;
  let error: string | undefined;

  if (chunk instanceof Promise) {
    status = ESwsrChunkStatus.Pending;
    chunk
      .then((_data) => {
        data = _data;
        status = ESwsrChunkStatus.Resolved;
      })
      .catch((_error) => {
        error = (_error as Error | undefined)?.message;
        status = ESwsrChunkStatus.Rejected;
      });
  } else if (chunk instanceof Error) {
    status = ESwsrChunkStatus.Rejected;
    error = chunk.message;
  } else {
    status = ESwsrChunkStatus.Resolved;
    data = chunk;
  }

  return () => {
    if (status === ESwsrChunkStatus.Pending) {
      return { status, promise: chunk as Promise<T> };
    }

    if (status === ESwsrChunkStatus.Resolved) {
      return { status, data: data! };
    }

    return { status, error: error! };
  };
}
