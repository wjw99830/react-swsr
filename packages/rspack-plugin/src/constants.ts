import { posix } from "path/posix";

export const ContentPlaceholder = "<!-- __SWSR_CONTENT_PLACEHOLDER__ -->";
export const EntryDirName = posix.resolve("node_modules/.swsr");
export const SwsrRspackPluginName = "SwsrRspackPlugin";
export const MinifiedStreamRuntime =
  'function __SWSR_CREATE_CONNECTIONS__(_){window.__SWSR_CHUNK_CONNECTIONS__=_.reduce(function(_,r){return _[r]=__SWSR_CREATE_CONNECTION__(),_},{})}function __SWSR_CREATE_CONNECTION__(){var _={status:0};return _.promise=new Promise(function(r,n){_.resolve=function(n){_.status=1,_.data=n,r(n)},_.reject=function(r){_.status=2;var t=Error(r);t.name="SwsrChunkError",_.error=t,n(t)}}),_}';
