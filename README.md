# 🏰 Tavern Tales

An AI-powered adventure drinking game for **2–8 players**. Think Dungeons & Dragons crossed with Mafia and Jackbox — an AI Dungeon Master narrates an endless branching story while players debate, vote, roll dice, bet sips, and try to root out a hidden traitor.

Built as a single React component. Each player joins on their own device with a 4-letter room code.

---

## Game Modes

| Players | Mode | Description |
|--------|------|-------------|
| 2 | **Co-op or Traitor** | ~80% co-op (both Heroes); ~20% chance one is secretly the Traitor. Neither player is told which. Split votes broken by the dice. |
| 3–5 | **Traitor** | One secret Traitor tries to make the party fail. |
| 6–7 | **Traitor + Wild Card** | Adds a Wild Card playing for themselves. |
| 8 | **Traitor + 2 Wild Cards** | Maximum chaos. |

## Core Loop

`Debate (60s) → Vote → Bet → Roll d20 → Resolution`

The d20 modifies every outcome: 1–10 means drinks and HP loss, 11–19 is success, 20 lets you give out sips.

## Mechanics

- **Hidden roles** — Hero, Traitor, Wild Card, revealed only at the epilogue
- **Private whispers** — the DM secretly messages players every 3 beats
- **Tribunal** — vote once per game to exile a suspected traitor
- **Betting** — wager sips on whether your vote wins
- **Fate cards** — Reroll, Plot Twist, Redirect (one use each)
- **Reputation** — 4 hidden axes the world reacts to
- **Crisis events** — timed emergencies every 4 beats
- **Death states** — Ghost → Relic → DM's Agent
- **Blue Shell** — the lowest-HP player can derail any scene

---

## Quick Start

The Dungeon Master runs on a **local model via [Ollama](https://ollama.com)** — no API key, no cost, nothing leaves your machine.

```bash
# 1. install Ollama, then pull the model
ollama pull gemma4

# 2. run the app (Vite proxies the browser to Ollama — no CORS setup needed)
npm install
npm run dev
```

Open http://localhost:5174

Use a different model? Set `VITE_OLLAMA_MODEL` (any Ollama tag) in a `.env` file. See `.env.example`.

## Run the Simulation Suite

```bash
npm run sim
```

Runs 1,400 headless games (200 per player count, 2–8) and asserts every mechanical invariant: role distribution, HP/drink bounds, death-state transitions, blue-shell uniqueness, reputation clamping, tie-breaking, tribunal logic, and epilogue termination.

---

## ⚙️ Two Things To Configure

This was built inside Anthropic's artifact sandbox, which provided two things for free that you wire up yourself when running standalone:

### 1. The AI Model — local via Ollama (`src/ai/`)

In the sandbox the AI calls hit Claude for free. Standalone, the game runs a **local model** instead, so there's no API key to manage and no per-token cost.

The AI layer lives in its own module:

```
src/ai/
├── client.js    ← transport: aiChat() → Ollama /api/chat (+ safeJ)
├── prompts.js   ← every system prompt (dmSys, CHAR_SYS, WORLD_SYS, …)
└── index.js     ← callDM, judgeCrisis, getWhispers, fillChar/DM/World
```

Setup is just two steps (see Quick Start): `ollama pull gemma4`, then `npm run dev`. The browser calls same-origin `/ollama`, which `vite.config.js` proxies to `localhost:11434` — no CORS, no keys. Swap the model with `VITE_OLLAMA_MODEL`.

Gemma is a reasoning model, so `client.js` sends `think:false` (otherwise the hidden reasoning trace consumes the token budget and the JSON comes back empty) and `format:"json"` to keep output parseable.

### 2. Multiplayer Backend (`src/storage.js`)

The game syncs state via `window.storage`. **This works out of the box for same-network play** — a tiny shared key-value store (`tavernSync` in `vite.config.js`) is baked into the dev server, and `storage.js` points at its `/store` endpoint. No accounts, no API keys.

So for friends **in the same room / on the same WiFi**, there's nothing to set up — see [Playing With Friends](#-playing-with-friends) below.

> State lives in memory, so restarting the dev server clears all rooms (fine for a session). For **cross-internet play** (friends in other cities), either expose the dev server with a tunnel (e.g. `cloudflared tunnel --url http://localhost:5174`) or swap `storage.js` for **Supabase** (free tier is plenty):

```js
// src/storage.js — Supabase version (only needed for play across the internet)
import { createClient } from "@supabase/supabase-js";
const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export const storage = {
  async get(key) {
    const { data } = await sb.from("rooms").select("value").eq("key", key).single();
    return data ? { key, value: data.value } : null;
  },
  async set(key, value) {
    await sb.from("rooms").upsert({ key, value });
    return { key, value };
  },
};
```

```sql
create table rooms (key text primary key, value text, updated_at timestamptz default now());
alter table rooms enable row level security;
create policy "public" on rooms for all using (true) with check (true);
```

---

## 🎲 Playing With Friends

Everyone on the **same WiFi**, each on their own phone — zero extra setup:

1. **On your (the host's) laptop**, start everything:
   ```bash
   ollama pull gemma4   # once
   npm install          # once
   npm run dev
   ```
   Vite prints a **Network** URL like `http://192.168.1.89:5174/`.
2. **Friends open that Network URL** on their phones (same WiFi). Everyone joins the same 4-letter room code.
3. Play. Only your laptop runs the AI (gemma4) and holds game state — friends' phones just read and submit moves, so they need nothing installed.

Notes:
- Keep the host laptop awake and on the same network for the whole game.
- First AI beat is slow while gemma4 loads into memory (~30s); after that it's quick.
- macOS may ask to allow incoming connections the first time — say yes.

### Friends in other cities (over the internet)

Same as above, but expose your laptop with a free [Cloudflare quick tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) — no account, no router config.

```bash
brew install cloudflared   # once

npm run dev                # terminal 1 — keep running
npm run tunnel             # terminal 2 — keep running
```

`npm run tunnel` prints a public URL like `https://random-words.trycloudflare.com`. **Share that** instead of the LAN IP — friends anywhere open it and join with the room code. Everything (game state + the gemma4 AI) still runs only on your laptop; the tunnel just forwards to it.

- The tunnel URL changes every time you restart it — share the current one.
- Both terminals must stay open and the laptop awake for the whole game.

---

## Project Structure

```
tavern-tales/
├── index.html
├── package.json
├── vite.config.js
├── sim.mjs              ← simulation/test suite
├── README.md
└── src/
    ├── main.jsx         ← React entry
    ├── TavernTales.jsx  ← the game (component tree + rules)
    ├── storage.js       ← storage adapter (swap for Supabase)
    └── ai/              ← AI layer (local Ollama model)
        ├── client.js    ← Ollama transport + safeJ
        ├── prompts.js   ← all system prompts
        └── index.js     ← high-level DM calls (imported by the game)
```

## License

MIT
