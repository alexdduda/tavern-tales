import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    // Proxy the local Ollama server so the browser calls same-origin "/ollama"
    // and never hits CORS. The AI client (src/ai/client.js) targets "/ollama".
    proxy: {
      "/ollama": {
        target: process.env.OLLAMA_HOST || "http://localhost:11434",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ollama/, ""),
      },
    },
  },
});
