import { posix } from 'path';
import * as cheerio from 'cheerio';
import { existsSync, mkdirSync, writeFile, writeFileSync } from 'fs';
import type { Callback } from '@rspack/lite-tapable';
import {
  Compilation,
  Compiler,
  Configuration,
  HtmlRspackPlugin,
  rspack,
  RspackPluginInstance,
  Stats,
  Watching,
} from '@rspack/core';
import { ScriptPlaceholder } from '../../shared';
import merge from 'webpack-merge';
import { logger } from 'rslog';
import { createEntry } from './entry';
import { ContentPlaceholder, EntryDirName, SwsrRspackPluginName } from './constants';
import { getInheritedOptions, isWebCompiler } from './utils';
import type { IHtmlPluginHooks } from './html';
import type { RequiredDeep } from 'type-fest';

export interface ISwsrRspackPluginHtmlOptions {
  /**
   * Match the corresponding html which emitted by html plugin(e.g. `html-rspack-plugin`) and inline to `swsr.js`
   * @default "index.html"
   */
  filename?: string | RegExp;
  /**
   * Inject some html content for rendering
   * @default rspack.HtmlRspackPlugin.getCompilationHooks
   */
  getPluginHooks?(compilation: Compilation): unknown;
}

export interface ISwsrRspackPluginOptions {
  /** ServiceWorker module */
  worker: string;
  /** Root component of application */
  app: string;
  /**
   * Entry name of swsr compiler
   * @default ""
   */
  entry?: string;
  /**
   * Root element for react rendering
   * @default "#root"
   */
  selector?: string;
  /**
   * Output filename of swsr bundle
   * @default "swsr.js"
   */
  filename?: string;
  /** Html configuration */
  html?: ISwsrRspackPluginHtmlOptions;
  /** Bundler configuration */
  bundler?: Configuration;
}

export class SwsrRspackPlugin implements RspackPluginInstance {
  private options: RequiredDeep<Omit<ISwsrRspackPluginOptions, 'bundler'>> & Pick<ISwsrRspackPluginOptions, 'bundler'>;

  constructor(options: ISwsrRspackPluginOptions) {
    this.options = {
      entry: '',
      selector: '#root',
      filename: 'swsr.js',
      ...options,
      html: {
        filename: 'index.html',
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

    const { app, worker, entry, selector, filename, html, bundler = {} } = this.options;
    const swsrCompilerName = entry ? `swsr-${entry}` : 'swsr';

    if (!existsSync(EntryDirName)) {
      mkdirSync(EntryDirName);
    }

    const entryPath = `${EntryDirName}/${entry ? `${entry}.` : ''}entry.jsx`;
    const entryContent = createEntry({
      app: posix.join(compiler.context, app),
      worker: posix.join(compiler.context, worker),
    });

    writeFileSync(entryPath, entryContent);

    const swsrCompiler = rspack(
      merge<Configuration>(
        // default
        {
          name: swsrCompilerName,
          target: ['webworker', 'es5'],
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
        logger.error(`Compile successfully, but stats not generated (${swsrCompilerName})`);
        return;
      }

      if (stats.hasErrors()) {
        // only print entry's error
        const errors = stats.compilation.errors.filter((it) => it.message.includes('/node_modules/.swsr/'));
        if (errors.length) {
          errors.forEach((it) => logger.error(`Compile failed (${swsrCompilerName})\n${it.message}`));
        } else {
          logger.error(
            `Compile failed (${swsrCompilerName}). It seems that some error occured in the web compiler, check its errors.`
          );
        }
        return;
      }

      logger.ready(`Compiled in ${stats.endTime! - stats.startTime!}ms (${swsrCompilerName})`);
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
        if (options.mode === 'development') {
          watch();
        } else {
          swsrCompiler.run(onRun);
        }
      }
    }

    compiler.hooks.thisCompilation.tap(SwsrRspackPluginName, (compilation) => {
      const match = (outputName: string) =>
        typeof html.filename === 'string' ? html.filename === outputName : html.filename.test(outputName);

      const hooks = html.getPluginHooks(compilation) as IHtmlPluginHooks;

      // insert swsr placeholders
      hooks.beforeEmit.tap(SwsrRspackPluginName, (ctx) => {
        if (match(ctx.outputName)) {
          const $ = cheerio.load(ctx.html);
          $(selector).append(ContentPlaceholder);
          $('body').append(ScriptPlaceholder);
          ctx.html = $.html() || ctx.html;
        }
        return ctx;
      });

      // find corresponding outputName
      let outputName = 'index.html';
      hooks.afterEmit.tap(SwsrRspackPluginName, (ctx) => {
        if (match(ctx.outputName)) {
          outputName = ctx.outputName;
        }

        return ctx;
      });

      // inline html content to swsr.js
      compilation.hooks.afterProcessAssets.tap(SwsrRspackPluginName, (assets) => {
        const template = assets[outputName]?.source().toString();

        if (!template) {
          logger.error('Failed to get html asset, outputName=' + outputName);
          return;
        }

        writeFile(entryPath, entryContent.replace('{{template}}', template.replace('`', '\\`')), (err) => {
          if (err) {
            logger.error(`Failed to write entry file to ${entryPath}`, err);
            return;
          }
        });
      });

      // start swsr compiling
      compiler.hooks.done.tap(SwsrRspackPluginName, start);
    });
  }
}
