import { Configuration, RspackOptionsNormalized, Target } from "@rspack/core";
import { pick } from "lodash";

export function isWebCompiler(target: Target | undefined) {
  if (!target) {
    // default is web
    return true;
  }

  if (typeof target === "string") {
    return target === "web";
  }

  if (Array.isArray(target)) {
    return target.includes("web");
  }

  return false;
}

export function getInheritedOptions(
  options: RspackOptionsNormalized
): Configuration {
  return {
    ...pick(options, "devtool", "context", "mode", "resolve", "module"),
    output: pick(
      options.output,
      "path",
      "publicPath",
      "pathinfo",
      "hashFunction"
    ),
    optimization: pick(options.optimization, "minimize"),
  };
}
