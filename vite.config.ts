import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// @ts-ignore - optional dependency
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let componentTagger: any;
  try {
    const mod = await import('lovable-tagger');
    componentTagger = mod.componentTagger;
  } catch {
    componentTagger = undefined;
  }
  return ({
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger && componentTagger(),
      process.env.ANALYZE === 'true' && visualizer({ open: false, filename: 'dist/analyze.html', brotliSize: true })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          }
        }
      },
      chunkSizeWarningLimit: 1200
    }
  });
});
