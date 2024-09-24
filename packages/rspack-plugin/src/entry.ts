import { readFileSync } from "fs";
import { posix } from "path";
import { ContentPlaceholder, MinifiedStreamRuntime } from "./constants";
import { ScriptPlaceholder } from "../../shared";

interface IEntryVars {
  mode: "string" | "stream";
  app: string;
  worker: string;
  templatePattern: string;
}

export function createEntry({
  mode,
  app,
  worker,
  templatePattern,
}: IEntryVars) {
  const codeTemplate = readFileSync(
    posix.join(__dirname, "./entry.template.jsx")
  ).toString();
  return codeTemplate
    .replace(/{{mode}}/g, mode)
    .replace("{{app}}", app)
    .replace("{{worker}}", worker)
    .replace("{{templatePattern}}", templatePattern)
    .replace("{{ContentPlaceholder}}", ContentPlaceholder)
    .replace("{{ScriptPlaceholder}}", ScriptPlaceholder)
    .replace("{{StreamRuntime}}", MinifiedStreamRuntime);
}
