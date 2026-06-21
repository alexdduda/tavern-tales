import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ── tavern-sync ──────────────────────────────────────────────
// A tiny shared key-value store baked into the dev server, so every phone
// on the network syncs through the same origin that serves the app. No extra
// process, no accounts, no API keys. State lives in memory: restarting the
// dev server clears all rooms (fine for a play session).
//   GET  /store?key=ROOM   -> { key, value } | null
//   POST /store {key,value} -> { key, value }
function tavernSync() {
  const store = new Map();
  return {
    name: "tavern-sync",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith("/store")) return next();
        res.setHeader("Content-Type", "application/json");

        if (req.method === "GET") {
          const key = new URL(req.url, "http://x").searchParams.get("key");
          const value = store.get(key);
          res.end(JSON.stringify(value != null ? { key, value } : null));
          return;
        }
        if (req.method === "POST") {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            try {
              const { key, value } = JSON.parse(body || "{}");
              store.set(key, value);
              res.end(JSON.stringify({ key, value }));
            } catch {
              res.statusCode = 400;
              res.end("null");
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end("null");
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tavernSync()],
  server: {
    port: 5174,
    host: true,
    // Allow the Cloudflare quick-tunnel host so internet play works
    // (`npm run tunnel`). LAN IPs are allowed by default.
    allowedHosts: [".trycloudflare.com"],
    // Proxy the local Ollama server so the browser calls same-origin "/ollama"
    // and never hits CORS. The AI client (src/ai/client.js) targets "/ollama".
    proxy: {
      "/ollama": {
        target: process.env.OLLAMA_HOST || "http://localhost:11434",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ollama/, ""),
        // Ollama 403s any browser Origin that isn't localhost. When the app is
        // reached over a tunnel the Origin is the public host, so strip it —
        // Ollama then sees an ordinary server-side request and allows it.
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
        },
      },
    },
  },
});
