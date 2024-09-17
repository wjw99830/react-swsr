import { ScriptPlaceholder } from "../../shared";
import { ISwsrInfo } from "./typings";

export function getSwsrInfo(): ISwsrInfo {
  if (typeof window === "undefined") {
    throw new Error("Cannot invoke `getSwsrInfo` outside browser.");
  }

  const mode = window.__SWSR_MODE__;
  const hit = !!mode;

  return {
    enabled:
      hit ||
      !!document.body.innerHTML.includes(ScriptPlaceholder) /** fallback */,
    hit,
    mode,
  };
}

declare global {
  const __SWSR__: boolean;

  interface Window {
    __SWSR_MODE__?: "string" | "stream";
  }
}
