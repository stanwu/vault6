import { defineConfig } from "electron-vite";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "mock-aws-s3": resolve(__dirname, "src/shims/empty.ts"),
        "aws-sdk": resolve(__dirname, "src/shims/empty.ts"),
        nock: resolve(__dirname, "src/shims/empty.ts")
      }
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        external: ["@journeyapps/sqlcipher"],
        input: {
          main: resolve(__dirname, "src/main.ts")
        },
        output: {
          format: "cjs",
          entryFileNames: "main.js"
        }
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        "mock-aws-s3": resolve(__dirname, "src/shims/empty.ts"),
        "aws-sdk": resolve(__dirname, "src/shims/empty.ts"),
        nock: resolve(__dirname, "src/shims/empty.ts")
      }
    },
    build: {
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        external: ["@journeyapps/sqlcipher"],
        input: {
          preload: resolve(__dirname, "src/preload.ts")
        },
        output: {
          format: "cjs",
          entryFileNames: "preload.js"
        }
      }
    }
  },
  renderer: {
    root: "../renderer",
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "../renderer/index.html")
        }
      }
    }
  }
});
