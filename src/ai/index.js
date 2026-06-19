// ═══════════════════════════════════════════════════════════
//  AI LAYER — high-level game calls
// ═══════════════════════════════════════════════════════════
// The only module the game (TavernTales.jsx) imports. It composes the
// transport (./client.js) with the prompts (./prompts.js) and guarantees a
// safe fallback shape for every call, so the UI never sees raw model output.

import { aiChat, safeJ } from "./client.js";
import {
  dmSys, CRISIS_SYS, WHISPER_SYS, CHAR_SYS, DM_SYS, WORLD_SYS,
} from "./prompts.js";

// Single-shot helper: one user message in, raw text out.
const ask = (sys, msg, tokens) => aiChat(sys, [{ role: "user", content: msg }], tokens);

// Generate the next story beat. `history` is prior [{role,content}] turns.
export const callDM = async (room, history, msg) =>
  safeJ(
    await aiChat(dmSys(room), [...history, { role: "user", content: msg }], 920),
    {
      narration: "The party presses into the unknown, tension mounting.",
      choices: [
        { id: "a", text: "Press forward boldly", risk: "high" },
        { id: "b", text: "Hang back and observe", risk: "low" },
        { id: "c", text: "Try something clever", risk: "medium" },
        { id: "d", text: "Ask for outside help", risk: "medium" },
      ],
      drinkRule: "Everyone takes 1 sip to steady their nerves.",
      repShift: { heroic: 0, reckless: 0, unified: 0, generous: 0 },
      isEpilogue: false,
      hiddenThread: "",
    }
  );

export const judgeCrisis = async (crisis, sol) =>
  safeJ(
    await ask(CRISIS_SYS, `Crisis:"${crisis}". Solution:"${sol || "nothing"}".`, 280),
    { score: "poor", narration: "The party fumbles the crisis spectacularly.", drinks: 2, boon: "" }
  );

export const getWhispers = async (room) =>
  safeJ(
    await ask(
      WHISPER_SYS,
      `Players:${JSON.stringify(room.players.map(p=>({id:p.id,name:p.name,role:p.role,class:p.class})))}. Scene:${room.currentBeat?.narration?.slice(0,100)||"start"}.`,
      300
    ),
    []
  );

export const fillChar = async (name, cls) =>
  safeJ(
    await ask(
      CHAR_SYS,
      cls ? `Player:"${name}", class:"${cls}". Take it somewhere unexpected.` : `Player:"${name}". Make it wild.`,
      380
    ),
    null
  );

export const fillDM = async (h) =>
  safeJ(await ask(DM_SYS, h || "Fresh DM.", 260), null);

export const fillWorld = async (h) =>
  safeJ(await ask(WORLD_SYS, h || "Fresh world.", 300), null);
