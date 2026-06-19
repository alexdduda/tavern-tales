// ════════════════════════════════════════════════════════════════
//  TAVERN TALES — Headless Simulation Harness
//  Mirrors the exact deterministic logic from TavernTales.jsx
//  AI calls are replaced with a scripted fake DM so we can verify
//  every mechanical code path across 2–8 players.
// ════════════════════════════════════════════════════════════════

// ── Constants (copied verbatim from the app) ──
const DS = { ALIVE:"alive", GHOST:"ghost", RELIC:"relic", AGENT:"agent" };
const R  = { HERO:"hero", TRAITOR:"traitor", WILD:"wildcard" };

const uid   = () => Math.random().toString(36).slice(2,10);
const d20   = () => Math.floor(Math.random()*20)+1;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

const TIERS = [
  {max:1,  label:"CRITICAL FAIL",  drinks:3,  hp:-2},
  {max:5,  label:"BAD FAILURE",    drinks:2,  hp:-1},
  {max:10, label:"PARTIAL FAIL",   drinks:1,  hp: 0},
  {max:15, label:"PARTIAL SUCCESS",drinks:0,  hp: 0},
  {max:19, label:"SUCCESS",        drinks:0,  hp: 0},
  {max:20, label:"CRITICAL HIT",   drinks:-2, hp: 1},
];
const getTier = n => TIERS.find(t => n <= t.max) || TIERS[5];
const makeRep = () => ({heroic:0, reckless:0, unified:0, generous:0});

// ── Assertion tracking ──
let PASS = 0, FAIL = 0;
const errors = [];
function check(cond, msg) {
  if (cond) PASS++;
  else { FAIL++; errors.push(msg); }
}

// ── Fake DM: deterministic beat generator ──
// Returns the same shape the real callDM returns.
function fakeDM(beatCount, forceEpilogue) {
  const isEpi = forceEpilogue || beatCount >= 9;
  if (isEpi) {
    return {
      narration: "And so the tale concludes. Each hero met their fate. Quests resolved, debts paid.",
      choices: [],
      drinkRule: "",
      repShift: {heroic:0,reckless:0,unified:0,generous:0},
      isEpilogue: true,
      hiddenThread: "The innkeeper was the villain all along.",
    };
  }
  // random rep shifts in -2..2
  const rs = () => Math.floor(Math.random()*5)-2;
  return {
    narration: `Beat ${beatCount}: the party faces a choice in the gloom.`,
    choices: [
      {id:"a", text:"Charge in", risk:"high"},
      {id:"b", text:"Sneak around", risk:"low"},
      {id:"c", text:"Parley", risk:"medium"},
      {id:"d", text:"Improvise wildly", risk:"medium"},
    ],
    drinkRule: "Whoever hesitated drinks 1.",
    repShift: {heroic:rs(),reckless:rs(),unified:rs(),generous:rs()},
    isEpilogue: false,
    hiddenThread: "",
  };
}

// ── Role assignment (verbatim logic from DMScreen.begin) ──
function assignRoles(players) {
  const n = players.length;
  const TWO_PLAYER_TRAITOR_CHANCE = 0.20;
  const twoPlayerTraitor = n === 2 && Math.random() < TWO_PLAYER_TRAITOR_CHANCE;
  const coop = n < 3 && !twoPlayerTraitor;
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const wild2 = n >= 8;
  const assigned = players.map(p => {
    const si = shuffled.findIndex(s => s.id === p.id);
    let role = R.HERO;
    if (twoPlayerTraitor) {
      role = si===0 ? R.TRAITOR : R.HERO;
    } else if (!coop) {
      role = si===0 ? R.TRAITOR : (n>=6 && si===1) ? R.WILD : (wild2 && si===2) ? R.WILD : R.HERO;
    }
    return { ...p, role, blueShell:false };
  });
  return { players: assigned, coop };
}

// ── Vote resolution + tie-break (verbatim from resolve()) ──
function resolveBeat(room, votes, bets, beat) {
  const tally = {};
  Object.values(votes).forEach(v => { tally[v] = (tally[v]||0)+1; });
  const sortedTally = Object.entries(tally).sort((a,b) => b[1]-a[1]);
  const topCount = sortedTally[0]?.[1] || 0;
  const tied = sortedTally.filter(([,c]) => c===topCount).map(([id]) => id);
  const roll = d20();
  const t = getTier(roll);
  const winId = tied.length>1 ? tied[roll % tied.length] : (sortedTally[0]?.[0] || "a");
  const winner = beat.choices.find(c => c.id===winId);
  const wasTie = tied.length>1;

  // Reputation shift
  const rep = room.reputation || makeRep();
  const nextBeat = fakeDM(room.beatCount + 1);
  const shift = nextBeat.repShift || {};
  const newRep = {
    heroic:  clamp((rep.heroic||0)+(shift.heroic||0),  -10,10),
    reckless:clamp((rep.reckless||0)+(shift.reckless||0),-10,10),
    unified: clamp((rep.unified||0)+(shift.unified||0), -10,10),
    generous:clamp((rep.generous||0)+(shift.generous||0),-10,10),
  };

  // Player updates (verbatim logic)
  const updated = room.players.map(p => {
    let {hp, drinkCount, deathState} = p;
    const voted = votes[p.id];
    const bet = bets[p.id];
    if (voted && voted !== winId) drinkCount++;
    if (t.drinks > 0) { drinkCount += t.drinks; hp = Math.max(0, hp + t.hp); }
    if (t.hp > 0) hp = Math.min(10, hp + t.hp);
    if (bet) { const won = voted===winId; if (!won) drinkCount += bet; }
    if (hp<=0 && deathState===DS.ALIVE) deathState=DS.GHOST;
    else if (hp<=0 && deathState===DS.GHOST) deathState=DS.RELIC;
    else if (hp<=0 && deathState===DS.RELIC) deathState=DS.AGENT;
    return { ...p, hp:Math.max(0,hp), drinkCount, deathState };
  });

  // Blue shell to lowest HP alive
  const alv = updated.filter(p => p.deathState===DS.ALIVE);
  if (alv.length) {
    const low = alv.reduce((a,b) => a.hp<b.hp ? a : b);
    updated.forEach(p => { p.blueShell = p.id===low.id; });
  }

  // Crisis trigger
  const fireCrisis = (room.beatCount % 4 === 0) && room.beatCount > 1 && !nextBeat.isEpilogue;

  return {
    players: updated,
    reputation: newRep,
    nextBeat,
    winId, winner, wasTie, roll, tier:t,
    crisisActive: fireCrisis,
    beatCount: room.beatCount + 1,
  };
}

// ── Tribunal resolution (verbatim) ──
function resolveTribunal(players, tribVotes) {
  const tally = {};
  Object.values(tribVotes).forEach(v => { tally[v]=(tally[v]||0)+1; });
  const exId = Object.entries(tally).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const exiled = players.find(p => p.id===exId);
  const wasTraitor = exiled?.role===R.TRAITOR;
  const updated = players.map(p => {
    if (p.id===exId) return {...p, deathState:DS.GHOST, drinkCount:p.drinkCount+(wasTraitor?5:0)};
    if (!wasTraitor) return {...p, drinkCount:p.drinkCount+3};
    return p;
  });
  return { players:updated, exiled:exiled?.name, wasTraitor };
}

// ── Simulate one full game ──
function simulateGame(numPlayers, seed) {
  // Build players
  let players = [];
  for (let i=0; i<numPlayers; i++) {
    players.push({
      id: uid(), name:`P${i+1}`, class:`Class${i+1}`,
      ability:"x", flaw:"y", secretQuest:"z",
      hp:10, drinkCount:0, deathState:DS.ALIVE,
      fateCards:["reroll","plot_twist","redirect"],
    });
  }

  // Assign roles
  const { players:rolePlayers, coop } = assignRoles(players);
  players = rolePlayers;

  // ── Role distribution checks ──
  const traitors = players.filter(p=>p.role===R.TRAITOR).length;
  const wilds    = players.filter(p=>p.role===R.WILD).length;
  const heroes   = players.filter(p=>p.role===R.HERO).length;

  if (numPlayers < 3) {
    // 2 players: either co-op (0 traitors) or one secret traitor (~20% of games)
    if (numPlayers === 2 && !coop) {
      check(traitors===1, `2p traitor game: exactly 1 traitor (got ${traitors})`);
      check(wilds===0, `2p traitor game: no wild cards (got ${wilds})`);
      check(heroes===1, `2p traitor game: 1 hero (got ${heroes})`);
    } else {
      check(coop===true, `${numPlayers}p: should be co-op`);
      check(traitors===0, `${numPlayers}p: co-op must have 0 traitors (got ${traitors})`);
      check(wilds===0, `${numPlayers}p: co-op must have 0 wild cards (got ${wilds})`);
      check(heroes===numPlayers, `${numPlayers}p: co-op all heroes (got ${heroes})`);
    }
  } else {
    check(coop===false, `${numPlayers}p: should NOT be co-op`);
    check(traitors===1, `${numPlayers}p: exactly 1 traitor (got ${traitors})`);
    if (numPlayers >= 8)      check(wilds===2, `${numPlayers}p: 2 wild cards (got ${wilds})`);
    else if (numPlayers >= 6) check(wilds===1, `${numPlayers}p: 1 wild card (got ${wilds})`);
    else                      check(wilds===0, `${numPlayers}p: 0 wild cards (got ${wilds})`);
    check(heroes+traitors+wilds===numPlayers, `${numPlayers}p: roles sum to player count`);
  }

  // ── Run game loop ──
  let room = {
    players, coop, reputation:makeRep(),
    beatCount:1, currentBeat:fakeDM(1),
  };

  let beatsPlayed = 0;
  let tribunalUsed = false;
  let crisisCount = 0;
  let tieCount = 0;
  const maxBeats = 15; // safety cap

  while (!room.currentBeat.isEpilogue && beatsPlayed < maxBeats) {
    beatsPlayed++;
    const beat = room.currentBeat;
    const alive = room.players.filter(p=>p.deathState===DS.ALIVE);

    // Each alive player votes (randomly). Ghosts can still vote (half weight not modeled in tally).
    const votes = {};
    room.players.forEach(p => {
      // Traitor tends to vote against; here just random across 4 choices
      votes[p.id] = beat.choices[Math.floor(Math.random()*beat.choices.length)].id;
    });

    // Some players bet (1-3 sips), ~40% chance
    const bets = {};
    room.players.forEach(p => {
      if (Math.random() < 0.4) bets[p.id] = Math.floor(Math.random()*3)+1;
    });

    // Occasionally call a tribunal (only non-coop, once per game, 3+ alive)
    if (!coop && !tribunalUsed && alive.length>=3 && Math.random()<0.25) {
      tribunalUsed = true;
      const tv = {};
      alive.forEach(p => {
        const others = alive.filter(o=>o.id!==p.id);
        tv[p.id] = others[Math.floor(Math.random()*others.length)].id;
      });
      const tr = resolveTribunal(room.players, tv);
      room.players = tr.players;
      check(typeof tr.wasTraitor==="boolean", `${numPlayers}p: tribunal returns boolean`);
    }

    // Resolve the beat
    const res = resolveBeat(room, votes, bets, beat);
    if (res.wasTie) tieCount++;
    if (res.crisisActive) crisisCount++;

    // Validate invariants after resolution
    res.players.forEach(p => {
      check(p.hp>=0 && p.hp<=10, `${numPlayers}p beat${beatsPlayed}: HP in range (got ${p.hp} for ${p.name})`);
      check(p.drinkCount>=0, `${numPlayers}p beat${beatsPlayed}: drinkCount non-negative`);
      check([DS.ALIVE,DS.GHOST,DS.RELIC,DS.AGENT].includes(p.deathState), `${numPlayers}p: valid death state`);
    });
    // Exactly one blue shell among alive (or zero if none alive)
    const aliveAfter = res.players.filter(p=>p.deathState===DS.ALIVE);
    const shells = res.players.filter(p=>p.blueShell).length;
    if (aliveAfter.length>0) check(shells===1, `${numPlayers}p beat${beatsPlayed}: exactly 1 blue shell (got ${shells})`);

    // Rep in range
    Object.entries(res.reputation).forEach(([k,v]) => {
      check(v>=-10 && v<=10, `${numPlayers}p: rep ${k} in range (got ${v})`);
    });

    // Winner must be a valid choice
    check(beat.choices.some(c=>c.id===res.winId), `${numPlayers}p beat${beatsPlayed}: winner is a real choice`);

    // Advance
    room.players = res.players;
    room.reputation = res.reputation;
    room.currentBeat = res.nextBeat;
    room.beatCount = res.beatCount;
  }

  // ── End-of-game checks ──
  check(room.currentBeat.isEpilogue, `${numPlayers}p: game reached epilogue (played ${beatsPlayed} beats)`);
  check(room.currentBeat.hiddenThread.length>0, `${numPlayers}p: epilogue has hidden thread`);
  check(beatsPlayed < maxBeats, `${numPlayers}p: game ended before safety cap`);

  return {
    numPlayers, coop, beatsPlayed, tribunalUsed, crisisCount, tieCount,
    heroes, traitors, wilds,
    finalStandings: [...room.players].sort((a,b)=>b.drinkCount-a.drinkCount).map(p=>({name:p.name,drinks:p.drinkCount,hp:p.hp,state:p.deathState,role:p.role})),
  };
}

// ════════════════════════════════════════════════════════════════
//  RUN: 2–8 players, multiple iterations each
// ════════════════════════════════════════════════════════════════
console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║          TAVERN TALES — GAME SIMULATION SUITE            ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

// ── Verify the 2-player traitor probability (~20%) ──
(() => {
  const N = 20000;
  let traitorGames = 0;
  for (let i=0; i<N; i++) {
    const two = [{id:uid()},{id:uid()}];
    const { coop } = assignRoles(two.map(p=>({...p,hp:10,drinkCount:0,deathState:DS.ALIVE})));
    if (!coop) traitorGames++;
  }
  const rate = (traitorGames/N)*100;
  console.log(`2-player traitor odds: ${rate.toFixed(1)}% of games have a traitor (target ~20%)`);
  check(rate > 17 && rate < 23, `2p traitor rate should be ~20% (got ${rate.toFixed(1)}%)`);
  console.log("");
})();

const ITER = 200; // games per player count
const summary = {};

for (let n=2; n<=8; n++) {
  let totalBeats=0, totalCrises=0, totalTies=0, tribunals=0, deaths=0;
  for (let i=0; i<ITER; i++) {
    const result = simulateGame(n, i);
    totalBeats += result.beatsPlayed;
    totalCrises += result.crisisCount;
    totalTies += result.tieCount;
    if (result.tribunalUsed) tribunals++;
    deaths += result.finalStandings.filter(p=>p.state!=="alive").length;
  }
  summary[n] = {
    avgBeats:(totalBeats/ITER).toFixed(1),
    avgCrises:(totalCrises/ITER).toFixed(2),
    avgTies:(totalTies/ITER).toFixed(2),
    tribunalRate:((tribunals/ITER)*100).toFixed(0)+"%",
    avgDeaths:(deaths/ITER).toFixed(2),
  };
}

console.log("Per-player-count averages (over " + ITER + " games each):\n");
console.log("Players │ Mode    │ AvgBeats │ AvgCrises │ AvgTies │ Tribunal │ AvgDeaths");
console.log("────────┼─────────┼──────────┼───────────┼─────────┼──────────┼──────────");
for (let n=2; n<=8; n++) {
  const s = summary[n];
  const mode = n<3 ? "Co-op  " : "Traitor";
  console.log(
    `   ${n}    │ ${mode} │   ${s.avgBeats.padStart(5)}  │   ${s.avgCrises.padStart(5)}   │  ${s.avgTies.padStart(4)}  │   ${s.tribunalRate.padStart(4)}  │   ${s.avgDeaths.padStart(5)}`
  );
}

// One detailed sample game per player count
console.log("\n\n── Sample final standings (1 game per count) ──");
for (let n=2; n<=8; n++) {
  const r = simulateGame(n, 999);
  console.log(`\n${n} players [${r.coop?"CO-OP":"TRAITOR"}] — ${r.beatsPlayed} beats, ${r.crisisCount} crises, ${r.tieCount} ties:`);
  r.finalStandings.forEach((p,i) => {
    const roleTag = r.coop ? "" : ` (${p.role})`;
    console.log(`  ${i+1}. ${p.name}${roleTag}: ${p.drinks} drinks, ${p.hp} HP, ${p.state}`);
  });
}

console.log("\n\n╔══════════════════════════════════════════════════════════╗");
console.log(`║  RESULTS: ${PASS} passed, ${FAIL} failed`.padEnd(59) + "║");
console.log("╚══════════════════════════════════════════════════════════╝");
if (FAIL>0) {
  console.log("\nFailures (first 20 unique):");
  [...new Set(errors)].slice(0,20).forEach(e => console.log("  ✗ " + e));
  process.exit(1);
} else {
  console.log("\n✓ All invariants held across 2–8 players over " + (ITER*7) + " games.\n");
}
