# Claude Code — Project Notes

This file orients Claude Code (or any contributor) working on Tavern Tales.

## What this is
A React drinking/adventure game. Game logic, UI, and the state machine live in
`src/TavernTales.jsx` (one `App` export). The AI layer is a separate module under
`src/ai/` so prompt/model work never reloads the big component file.

## Architecture at a glance
- **No router.** A `screen` state value (`S.HOME`, `S.RULES`, `S.CHAR`, `S.LOBBY`, `S.DM`, `S.GAME`) drives which screen renders.
- **State lives in shared storage**, polled every 2.2s. The host writes; clients read and mirror. The game calls `window.storage` directly; `main.jsx` installs the `src/storage.js` adapter onto it at startup (unless the sandbox already provided one).
- **Multiplayer store**: `storage.js` talks to a same-origin `/store` endpoint served by the `tavernSync` plugin in `vite.config.js` (in-memory KV). Works across any device on the LAN with no accounts. For internet play, `npm run tunnel` (Cloudflare quick tunnel; `allowedHosts` already permits `*.trycloudflare.com`) — or swap `storage.js` for Supabase.
- **The host is authoritative** — only the host calls the AI, rolls dice, and resolves beats. Clients submit votes/bets into shared state.
- **AI layer** (`src/ai/`) runs a **local model via Ollama** (default `gemma4`) — no API key, no per-token cost, nothing leaves the machine:
  - `client.js` — transport. `aiChat(system, messages, tokens)` hits Ollama `/api/chat` with `format:"json"` and `think:false` (gemma is a reasoning model; left on, its hidden reasoning eats the token budget and `content` returns empty). Plus `safeJ`.
  - `prompts.js` — all system prompts (`dmSys`, `CHAR_SYS`, `DM_SYS`, `WORLD_SYS`, `WHISPER_SYS`, `CRISIS_SYS`).
  - `index.js` — the only AI file `TavernTales.jsx` imports: `callDM`, `judgeCrisis`, `getWhispers`, `fillChar`, `fillDM`, `fillWorld`, each with a safe fallback shape.
  - The browser calls same-origin `/ollama`, proxied to `localhost:11434` by `vite.config.js` (no CORS). Override model/URL via `VITE_OLLAMA_MODEL` / `VITE_OLLAMA_URL`.
- **Design system** is a single `C` color object + a `CSS` string of keyframes/utility classes injected once in `App`.

## Key invariants (verified by sim.mjs — run `npm run sim`)
- 2 players → co-op (0 traitors). 3+ → exactly 1 traitor. 6+ → 1 wild card. 8 → 2.
- HP always 0–10. drinkCount never negative.
- Death chain: alive → ghost → relic → agent.
- Exactly one Blue Shell among living players each beat.
- Reputation axes clamped to −10…+10.
- Split votes are broken by `roll % tied.length`.
- Game always reaches an epilogue (isEpilogue) within the beat cap.

## Before deploying (see README)
1. Run Ollama where the app can reach it (or point `VITE_OLLAMA_URL` at a hosted model gateway).
2. LAN play works as-is (built-in `/store`). For internet play, tunnel the dev server or swap `src/storage.js` for Supabase.

## Common tasks
- **Tune difficulty:** edit the `TIERS` array (dice → drinks/HP mapping).
- **Change role counts:** the `assignRoles`/`begin` logic in `DMScreen`.
- **Add a fate card:** extend `playFate` + the role-reveal card list + the in-game pill row.
- **Adjust pacing:** crisis fires on `beatCount % 4`; epilogue triggers at `beatCount >= 9`.

## Style
Keep it single-file unless a piece is clearly reusable. Match the terse,
high-density formatting already present. Run `npm run sim` after any change to
game logic.
