import type { AsyncSeriesWaterfallHook } from "@rspack/lite-tapable";

export interface IHtmlPluginTag {
  tagName: string;
  attributes: Record<string, string | boolean | undefined | null>;
  voidTag: boolean;
  innerHTML?: string;
}

export interface IHtmlPluginHooks {
  alterAssetTags: AsyncSeriesWaterfallHook<
    [{ assetTags: { scripts: IHtmlPluginTag[] }; outputName: string }]
  >;
  beforeEmit: AsyncSeriesWaterfallHook<[{ html: string; outputName: string }]>;
  afterEmit: AsyncSeriesWaterfallHook<[{ outputName: string }]>;
}
