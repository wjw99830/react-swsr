import { getSwsrInfo } from "./info";
import { log } from "./internal";

export function inspect() {
  if (typeof window === "undefined") {
    throw new Error("Cannot invoke `inspect` outside browser.");
  }

  const runtime = getSwsrInfo();

  if (runtime.enabled) {
    log(
      "SWSR " +
        (runtime.mode
          ? `running on ${runtime.mode} mode`
          : "is enabled, but not hit")
    );
  }
}
