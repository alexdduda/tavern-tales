// ════════════════════════════════════════════════════════════════
//  STORAGE ADAPTER
//  In the Claude artifact sandbox, window.storage is provided.
//  Standalone we use a shared key-value store so every device in the
//  room sees the same game state.
//
//  The store is served by the Vite dev server itself (see the
//  "tavern-sync" plugin in vite.config.js) at the same-origin "/store"
//  endpoint — so any phone that can open the app can also sync through
//  it. No accounts, no external services, no API keys.
//
//  Want true cross-internet play (friends in other cities)? Swap this
//  remote client for Supabase — see README "Multiplayer Backend".
// ════════════════════════════════════════════════════════════════

const hasNativeStorage =
  typeof window !== "undefined" &&
  window.storage &&
  typeof window.storage.get === "function";

// ── Shared store over the local network (via the Vite /store endpoint) ──
const remote = {
  async get(key) {
    const r = await fetch(`/store?key=${encodeURIComponent(key)}`);
    return await r.json(); // { key, value } | null
  },
  async set(key, value) {
    const r = await fetch("/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return await r.json();
  },
};

export const storage = hasNativeStorage ? window.storage : remote;
