import { readFileSync } from 'fs';
import { posix } from 'path';
import { ContentPlaceholder, MinifiedStreamRuntime } from './constants';
import { ScriptPlaceholder } from '../../shared';

interface IEntryVars {
  app: string;
  worker: string;
}

export function createEntry({ app, worker }: IEntryVars) {
  const codeTemplate = readFileSync(posix.join(__dirname, './entry.template.jsx')).toString();
  return codeTemplate
    .replace('{{app}}', app)
    .replace('{{worker}}', worker)
    .replace('{{ContentPlaceholder}}', ContentPlaceholder)
    .replace('{{ScriptPlaceholder}}', ScriptPlaceholder)
    .replace('{{StreamRuntime}}', MinifiedStreamRuntime);
}
