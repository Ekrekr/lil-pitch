import path from "path";
import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";

export default defineConfig({
  server: {
    port: process.env.PORT as unknown as number,
  },
  plugins: [vercel()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
