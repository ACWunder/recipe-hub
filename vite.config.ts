import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const isProd = process.env.NODE_ENV === "production";
  const isReplit = process.env.REPL_ID !== undefined;

  const plugins: any[] = [react()];

  // Replit-only dev plugins: only load when running in Replit and not in production
  if (!isProd && isReplit) {
    try {
      const runtimeErrorOverlay = await import(
        "@replit/vite-plugin-runtime-error-modal"
      );
      plugins.push(runtimeErrorOverlay.default());
    } catch {}

    try {
      const cartographer = await import("@replit/vite-plugin-cartographer");
      plugins.push(cartographer.cartographer());
    } catch {}

    try {
      const devBanner = await import("@replit/vite-plugin-dev-banner");
      plugins.push(devBanner.devBanner());
    } catch {}
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
