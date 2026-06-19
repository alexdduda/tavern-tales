// ════════════════════════════════════════════════════════════════
//  STORAGE ADAPTER
//  In the Claude artifact sandbox, window.storage is provided.
//  Standalone (Vite/GitHub), we fall back to a shared backend.
//
//  For true cross-device multiplayer you need a shared store.
//  Options, in order of simplicity:
//   1. Supabase (recommended) — see README "Multiplayer Backend"
//   2. Firebase Realtime DB
//   3. Any key-value REST endpoint
//
//  Below is a localStorage shim for SINGLE-DEVICE testing only
//  (pass-the-phone on one browser). Swap in a real backend for
//  separate-device play.
// ════════════════════════════════════════════════════════════════

const hasNativeStorage =
  typeof window !== "undefined" &&
  window.storage &&
  typeof window.storage.get === "function";

// ── Single-device localStorage shim (for dev/testing) ──
const localShim = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v ? { key, value: v } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};

export const storage = hasNativeStorage ? window.storage : localShim;
