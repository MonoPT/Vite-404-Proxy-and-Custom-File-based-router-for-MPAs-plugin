import { defineConfig } from 'vite'
import viteMod from "./vite-module";

export default defineConfig({
  plugins: [viteMod({proxyServer: 'http://example.com', pagesFolder: "pages"})],
  appType: "mpa"
})