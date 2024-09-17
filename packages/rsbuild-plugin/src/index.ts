import { posix } from "path";
import * as cheerio from "cheerio";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { HtmlRspackPlugin, RsbuildPlugin, type Rspack } from "@rsbuild/core";
import { ScriptPlaceholder } from "../../shared";

const EnvironmentName = "swsr";
const EntryDirName = posix.resolve("./node_modules/.swsr");
const ContentPlaceholder = "<!-- __SWSR_CONTENT_PLACEHOLDER__ -->";
const MinifiedStreamRuntime =
  'function __SWSR_CREATE_CONNECTIONS__(_){window.__SWSR_CHUNK_CONNECTIONS__=_.reduce(function(_,r){return _[r]=__SWSR_CREATE_CONNECTION__(),_},{})}function __SWSR_CREATE_CONNECTION__(){var _={status:0};return _.promise=new Promise(function(r,n){_.resolve=function(n){_.status=1,_.data=n,r(n)},_.reject=function(r){_.status=2;var t=Error(r);t.name="SwsrChunkError",_.error=t,n(t)}}),_}';

export const SwsrPluginName = "SwsrPlugin";

export interface ISwsrEntryOptions {
  mode: "string" | "stream";
  name: string;
  html: string;
  worker: string;
  app: string;
}

export interface ISwsrPluginOptions {
  entries: ISwsrEntryOptions[];
  /** @default "#root" */
  selector?: string;
  /** @default "[name].swsr.js" */
  filename?: string;
  version?: string;
}

class SwsrRspackPlugin implements Rspack.RspackPluginInstance {
  constructor(
    private html: typeof HtmlRspackPlugin,
    private options: ISwsrPluginOptions
  ) {}

  apply(compiler: Rspack.Compiler) {
    compiler.hooks.thisCompilation.tap(SwsrPluginName, (compilation) => {
      const enabled = (plugin: HtmlRspackPlugin) =>
        this.options.entries.some(
          (it) => it.name === plugin.options?.entryName
        );

      const hooks = this.html.getHooks(compilation);

      // defer to async
      hooks.alterAssetTags.tap(SwsrPluginName, (ctx) => {
        if (enabled(ctx.plugin)) {
          ctx.assetTags.scripts.forEach((script) => {
            if (script.attributes.defer) {
              delete script.attributes.defer;
              script.attributes.async = true;
            }
          });
        }
        return ctx;
      });

      // insert swsr placeholders
      hooks.beforeEmit.tap(SwsrPluginName, (ctx) => {
        if (enabled(ctx.plugin)) {
          const $ = cheerio.load(ctx.html);
          $(this.options.selector || "#root").append(ContentPlaceholder);

          $("body").append(ScriptPlaceholder);

          if (this.options.version) {
            $("head").prepend(
              `<!-- __SWSR_VERSION_${this.options.version}__ -->`
            );
          }

          ctx.html = $.html() || ctx.html;
        }
        return ctx;
      });
    });
  }
}

export function swsr(options: ISwsrPluginOptions): RsbuildPlugin {
  return {
    name: SwsrPluginName,
    setup(api) {
      api.modifyBundlerChain((chain, { HtmlPlugin }) => {
        chain.plugin("swsr").use(new SwsrRspackPlugin(HtmlPlugin, options));
      });

      // init environment
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          source: { define: { __SWSR__: false } },
          environments: {
            web: {},
            swsr: {
              source: { define: { __SWSR__: true } },
              output: {
                overrideBrowserslist: [
                  "Chrome >= 45",
                  "Firefox >= 44",
                  "Edge >= 17",
                  "Safari >= 11.1",
                  "iOS >= 11.3",
                ],
                target: "web-worker",
                emitAssets: false,
                distPath: { js: "" },
                filename: {
                  js: options.filename || "[name].swsr.js",
                },
              },
            },
          },
        });
      });

      // list entries
      api.modifyEnvironmentConfig((config, { name }) => {
        if (name !== EnvironmentName) {
          return;
        }

        if (!existsSync(EntryDirName)) {
          mkdirSync(EntryDirName);
        }

        config.source.entry = options.entries.reduce<Record<string, string>>(
          (entries, entry) => {
            const entryPath = `${EntryDirName}/${entry.name}.entry.jsx`;
            writeFileSync(
              entryPath,
              createWorkerEntry({
                mode: entry.mode,
                version: options.version || "",
                app: posix.resolve(entry.app),
                worker: posix.resolve(entry.worker),
                template: entry.html,
              })
            );
            entries[entry.name] = entryPath;
            return entries;
          },
          {}
        );
      });
    },
  };
}

interface IWorkerEntryVars {
  mode: "string" | "stream";
  template: string;
  app: string;
  worker: string;
  version: string;
}

function createWorkerEntry({
  mode,
  template,
  app,
  worker,
  version,
}: IWorkerEntryVars) {
  const codeTemplate = readFileSync(
    posix.join(__dirname, "./entry.template.jsx")
  ).toString();
  return codeTemplate
    .replace(/{{mode}}/g, mode)
    .replace("{{template}}", template)
    .replace("{{app}}", app)
    .replace("{{worker}}", worker)
    .replace("{{version}}", version)
    .replace("{{ContentPlaceholder}}", ContentPlaceholder)
    .replace("{{ScriptPlaceholder}}", ScriptPlaceholder)
    .replace("{{StreamRuntime}}", MinifiedStreamRuntime);
}
