export type RenderingTarget = 'string' | 'stream';

export const RenderingTarget = typeof self === 'undefined' ? undefined : self.__SWSR_RENDERING_TARGET__;

declare global {
  interface Window {
    __SWSR_RENDERING_TARGET__?: RenderingTarget;
  }
}
