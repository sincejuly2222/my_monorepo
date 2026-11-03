import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: "src/auto-imports.d.ts",
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dts: "src/components.d.ts",
      resolvers: [ElementPlusResolver()],
    }),
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    server: {
      deps: {
        inline: [/element-plus/],
      },
    },
  },
});
