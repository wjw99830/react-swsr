import { posix } from "path";
import * as cheerio from "cheerio";
import { existsSync, mkdirSync, writeFile, writeFileSync } from "fs";
import type { Callback } from "@rspack/lite-tapable";
import {
  Compilation,
  Compiler,
  Configuration,
  HtmlRspackPlugin,
  rspack,
  RspackPluginInstance,
  Stats,
  Watching,
} from "@rspack/core";
import { ScriptPlaceholder } from "../../shared";
import merge from "webpack-merge";
import { logger } from "rslog";
import { createEntry } from "./entry";
import {
  ContentPlaceholder,
  EntryDirName,
  SwsrRspackPluginName,
} from "./constants";
import { getInheritedOptions, isWebCompiler } from "./utils";
import type { IHtmlPluginHooks } from "./html";
import type { RequiredDeep } from "type-fest";

export { SwsrRspackPluginName } from "./constants";

export interface ISwsrRspackPluginHtmlOptions {
  /**
   * match the corresponding html file to inline into swsr.js
   * @default true
   */
  match?: true | ((outputName: string) => boolean);
  /**
   * match the corresponding navigation request by pathname of `URL` object in service worker
   * @default /index\.html$/
   */
  pattern?: RegExp;
  /**
   * inject some html content for rendering
   * @default rspack.HtmlRspackPlugin.getCompilationHooks
   */
  getPluginHooks?(compilation: Compilation): unknown;
}

export interface ISwsrRspackPluginOptions {
  /** rendering mode */
  mode: "string" | "stream";
  /** path of worker module which relative to compiler context */
  worker: string;
  /** path of application root component which relative to compiler context */
  app: string;
  html?: ISwsrRspackPluginHtmlOptions;
  /**
   * entry name of swsr compiler
   * @default ""
   */
  entry?: string;
  /**
   * select root element for application rendering
   * @default "#root"
   */
  selector?: string;
  /**
   * output filename of swsr bundle
   * @default "swsr.js"
   */
  filename?: string;
  /** bundler configuration */
  bundler?: Configuration;
}

export class SwsrRspackPlugin implements RspackPluginInstance {
  private options: RequiredDeep<Omit<ISwsrRspackPluginOptions, "bundler">> &
    Pick<ISwsrRspackPluginOptions, "bundler">;

  constructor(options: ISwsrRspackPluginOptions) {
    this.options = {
      entry: "",
      selector: "#root",
      filename: "swsr.js",
      ...options,
      html: {
        match: true,
        pattern: /index\.html$/,
        getPluginHooks: HtmlRspackPlugin.getCompilationHooks,
        ...options.html,
      },
    };
  }

  apply(compiler: Compiler) {
    const options = compiler.options;
    if (!isWebCompiler(options.target)) {
      return;
    }

    const {
      mode,
      app,
      worker,
      entry,
      selector,
      filename,
      html,
      bundler = {},
    } = this.options;
    const swsrCompilerName = entry ? `${entry}-swsr` : "swsr";

    if (!existsSync(EntryDirName)) {
      mkdirSync(EntryDirName);
    }

    const entryPath = `${EntryDirName}/${entry ? `${entry}.` : ""}entry.jsx`;
    const entryContent = createEntry({
      mode,
      app: posix.join(compiler.context, app),
      worker: posix.join(compiler.context, worker),
      templatePattern: html.pattern.source,
    });

    writeFileSync(entryPath, entryContent);

    const swsrCompiler = rspack(
      merge<Configuration>(
        // default
        {
          name: swsrCompilerName,
          target: ["webworker", "es5"],
          module: {
            generator: {
              asset: {
                emit: false,
              },
            },
          },
          output: { filename },
          optimization: { splitChunks: false },
          entry: entryPath,
        },
        // inherited from web compiler
        getInheritedOptions(options),
        // custom
        bundler
      )
    );

    const onRun: Callback<Error, Stats> = (e, stats) => {
      if (e) {
        logger.error(`Compile failed (${swsrCompilerName})`, e);
        return;
      }

      if (!stats) {
        logger.error(
          `Compile successfully, but stats not generated (${swsrCompilerName})`
        );
        return;
      }

      if (stats.hasErrors()) {
        // only print entry's error
        const errors = stats.compilation.errors.filter((it) =>
          it.message.includes("/node_modules/.swsr/")
        );
        if (errors.length) {
          errors.forEach((it) =>
            logger.error(`Compile failed (${swsrCompilerName})\n${it.message}`)
          );
        } else {
          logger.error(
            `Compile failed (${swsrCompilerName}). It seems that some error occured in the web compiler, check its errors.`
          );
        }
        return;
      }

      logger.ready(
        `Compiled in ${
          stats.endTime! - stats.startTime!
        }ms (${swsrCompilerName})`
      );
    };

    let watching: Watching | undefined;
    function watch() {
      const start = () => (watching = swsrCompiler.watch({}, onRun));

      if (watching) {
        watching.close(start);
      } else {
        start();
      }
    }

    let initialized: true | undefined;
    function start() {
      if (!initialized) {
        initialized = true;
        if (options.mode === "development") {
          watch();
        } else {
          swsrCompiler.run(onRun);
        }
      }
    }

    compiler.hooks.thisCompilation.tap(SwsrRspackPluginName, (compilation) => {
      const match = (outputName: string) =>
        html.match === true || html.match(outputName);
      const hooks = html.getPluginHooks(compilation) as IHtmlPluginHooks;

      // defer to async
      hooks.alterAssetTags.tap(SwsrRspackPluginName, (ctx) => {
        if (match(ctx.outputName)) {
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
      hooks.beforeEmit.tap(SwsrRspackPluginName, (ctx) => {
        if (match(ctx.outputName)) {
          const $ = cheerio.load(ctx.html);
          $(selector).append(ContentPlaceholder);
          $("body").append(ScriptPlaceholder);
          ctx.html = $.html() || ctx.html;
        }
        return ctx;
      });

      // inline html content to swsr.js
      hooks.afterEmit.tap(SwsrRspackPluginName, (ctx) => {
        if (match(ctx.outputName)) {
          const templateContent = compilation
            .getAsset(ctx.outputName)
            ?.source.source()
            .toString();

          if (!templateContent) {
            logger.error("Failed to read html source after emit");
            return ctx;
          }

          writeFile(
            entryPath,
            entryContent.replace(
              "{{templateContent}}",
              templateContent.replace("`", "\\`")
            ),
            (err) => {
              if (err) {
                logger.error(`Failed to write entry file to ${entryPath}`, err);
                return;
              }

              setTimeout(start, 300);
            }
          );
        }

        return ctx;
      });
    });
  }
}
