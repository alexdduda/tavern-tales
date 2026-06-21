import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ── tavern-sync ──────────────────────────────────────────────
// A tiny shared key-value store baked into the dev server, so every phone
// on the network syncs through the same origin that serves the app. No extra
// process, no accounts, no API keys.
//
// State is persisted to .tavern-store.json (read on every request, written
// atomically on every change). This means restarting the dev server — e.g.
// after a config change — does NOT wipe in-progress rooms, and any instance
// shares the same data. Delete the file to clear all rooms.
//   GET  /store?key=ROOM   -> { key, value } | null
//   POST /store {key,value} -> { key, value }
function tavernSync() {
  const FILE = fileURLToPath(new URL("./.tavern-store.json", import.meta.url));
  const read = () => {
    try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return {}; }
  };
  const write = (obj) => {
    const tmp = FILE + ".tmp";
    writeFileSync(tmp, JSON.stringify(obj));
    renameSync(tmp, FILE); // atomic: never leaves a half-written file
  };
  return {
    name: "tavern-sync",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith("/store")) return next();
        res.setHeader("Content-Type", "application/json");

        if (req.method === "GET") {
          const key = new URL(req.url, "http://x").searchParams.get("key");
          const value = read()[key];
          res.end(JSON.stringify(value != null ? { key, value } : null));
          return;
        }
        if (req.method === "POST") {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            try {
              const { key, value } = JSON.parse(body || "{}");
              const store = read();
              store[key] = value;
              write(store);
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
    // Fail loudly if 5174 is taken instead of silently moving to 5175 — the
    // tunnel points at 5174, and a drifted port would split the shared store.
    strictPort: true,
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
