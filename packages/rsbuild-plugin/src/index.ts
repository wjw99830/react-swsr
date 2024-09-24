import { RsbuildPlugin } from "@rsbuild/core";
import {
  ISwsrRspackPluginOptions,
  SwsrRspackPlugin,
  SwsrRspackPluginName,
} from "@react-swsr/rspack-plugin";

export const SwsrRsbuildPluginName = "SwsrRsbuildPlugin";

export function swsr(options: ISwsrRspackPluginOptions[]): RsbuildPlugin {
  return {
    name: SwsrRsbuildPluginName,
    setup(api) {
      api.modifyBundlerChain((chain, { HtmlPlugin }) => {
        for (const option of options) {
          chain
            .plugin(`${SwsrRspackPluginName}(${option.entry || "default"})`)
            .use(
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
