import { RsbuildPlugin } from '@rsbuild/core';
import { ISwsrRspackPluginOptions, SwsrRspackPlugin } from '@react-swsr/rspack-plugin';

const SwsrRsbuildPluginName = 'SwsrRsbuildPlugin';

export function swsr(options: ISwsrRspackPluginOptions | ISwsrRspackPluginOptions[]): RsbuildPlugin {
  return {
    name: SwsrRsbuildPluginName,
    setup(api) {
      api.modifyBundlerChain((chain, { HtmlPlugin }) => {
        const normalized = Array.isArray(options) ? options : [options];
        for (const option of normalized) {
          chain.plugin(`${SwsrRsbuildPluginName}(${option.entry || 'default'})`).use(
            new SwsrRspackPlugin({
              ...option,
              html: {
                getPluginHooks: HtmlPlugin.getHooks,
                ...option.html,
              },
            })
          );
        }
      });
    },
  };
}
