import { readFileSync } from "fs";
import { posix } from "path";
import { ContentPlaceholder, MinifiedStreamRuntime } from "./constants";
import { ScriptPlaceholder } from "../../shared";

interface IEntryVars {
  mode: "string" | "stream";
  app: string;
  worker: string;
  route: string | RegExp;
}

export function createEntry({ mode, app, worker, route }: IEntryVars) {
  const codeTemplate = readFileSync(
    posix.join(__dirname, "./entry.template.jsx")
  ).toString();
  return codeTemplate
    .replace(/{{mode}}/g, mode)
    .replace("{{app}}", app)
    .replace("{{worker}}", worker)
    .replace("{{routeString}}", typeof route === "string" ? route : "")
    .replace(
      "{{routeRegExp}}",
      typeof route !== "string" ? route.source : "^ $"
    )
    .replace("{{ContentPlaceholder}}", ContentPlaceholder)
    .replace("{{ScriptPlaceholder}}", ScriptPlaceholder)
    .replace("{{StreamRuntime}}", MinifiedStreamRuntime);
}
