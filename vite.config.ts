import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// `BASE_PATH` env var is set by the GitHub Actions workflow so the asset URLs
// are correct on GitHub Pages (which serves from /<repo-name>/). Locally it
// defaults to "/".
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  plugins: [vue()],
  base,
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
});
