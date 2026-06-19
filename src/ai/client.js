// ═══════════════════════════════════════════════════════════
//  MODEL CLIENT — local Ollama (gemma4)
// ═══════════════════════════════════════════════════════════
// Inside Anthropic's artifact sandbox the AI calls hit Claude for free.
// Standalone we run a LOCAL model instead: no API key, no per-token cost,
// and nothing leaves the machine. Point this at any Ollama model via env.
//
//   VITE_OLLAMA_MODEL   model tag        (default: gemma4)
//   VITE_OLLAMA_URL     ollama base url  (default: /ollama — the Vite proxy)
//
// The browser talks to "/ollama", which vite.config.js proxies to
// http://localhost:11434, so there are no CORS headaches in dev.

const MODEL    = import.meta.env?.VITE_OLLAMA_MODEL || "gemma4";
const ENDPOINT = (import.meta.env?.VITE_OLLAMA_URL || "/ollama") + "/api/chat";

// One round-trip to the model.
//   system    — system prompt string (optional)
//   messages  — chat history: [{role:"user"|"assistant", content}]
//   tokens    — response budget (maps to Ollama's num_predict)
//
// Notes that matter for gemma:
//   • format:"json" — every prompt in this game demands JSON, so force it.
//   • think:false   — gemma is a reasoning model; left on, its hidden
//     reasoning trace eats the whole token budget and `content` comes back
//     empty. Disabling it gives clean, fast JSON.
export const aiChat = async (system, messages, tokens = 900) => {
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        think: false,
        format: "json",
        messages: system
          ? [{ role: "system", content: system }, ...messages]
          : messages,
        options: { num_predict: tokens },
      }),
    });
    const d = await r.json();
    return d.message?.content || "";
  } catch {
    return "";
  }
};

// Tolerant JSON parse: strips stray code fences, returns `fb` on bad output.
export const safeJ = (t, fb) => {
  try { return JSON.parse((t || "").replace(/```json|```/g, "").trim()); }
  catch { return fb; }
};
