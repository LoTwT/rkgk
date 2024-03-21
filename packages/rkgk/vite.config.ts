import { URL, fileURLToPath } from "node:url"
import path from "node:path"
import { type Plugin, defineConfig } from "vite"
import Vue from "@vitejs/plugin-vue"
import Dts from "vite-plugin-dts"
import AutoImport from "unplugin-auto-import/vite"
import Unocss from "unocss/vite"
import MagicString from "magic-string"

export default defineConfig({
  plugins: [
    Vue(),
    AutoImport({
      imports: ["vue"],
    }),
    Dts(),
    Unocss({
      mode: "dist-chunk",
    }),
    VitePluginInlineCSS(),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  build: {
    lib: {
      name: "rkgk",
      entry: {
        index: "src/index.ts",
      },
      formats: ["es"],
    },
    cssCodeSplit: true,
    sourcemap: true,
    rollupOptions: {
      external: ["vue", "unocss"],
      output: {
        globals: {
          vue: "Vue",
        },
        preserveModules: true,
        format: "es",
      },
    },
  },
})

function VitePluginInlineCSS(): Plugin {
  return {
    name: "vite:rkgk-inline-css",
    apply: "build",
    enforce: "post",
    renderChunk: (code, chunk) => {
      if (!chunk.viteMetadata) return
      const { importedCss } = chunk.viteMetadata

      if (importedCss.size === 0) return

      const ms = new MagicString(code)

      for (const cssFileName of importedCss) {
        let cssFilePath = path
          .relative(path.dirname(chunk.fileName), cssFileName)
          .replaceAll(/[/\\]+/g, "/")
        cssFilePath = cssFilePath.startsWith(".")
          ? cssFilePath
          : `./${cssFilePath}`
        ms.prepend(`import '${cssFilePath}';\n`)
      }

      return {
        code: ms.toString(),
        map: ms.generateMap(),
      }
    },
  }
}
