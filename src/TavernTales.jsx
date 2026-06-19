import { useState, useEffect, useRef } from "react";
import {
  Dice5, Users, Drama, Skull, Zap, ScrollText, Swords, Crown,
  Eye, Scale, Shell, Sparkles, MessageCircle, Vote,
  ChevronRight, ChevronDown, ArrowRight, Wine, BookOpen,
  UserX, Coins, Gauge, Play, DoorOpen, Castle
} from "lucide-react";
import {
  callDM, judgeCrisis, getWhispers, fillChar, fillDM, fillWorld,
} from "./ai";

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════
const POLL_MS  = 2200;
const NS       = "tt3:";

const S  = { HOME:"home", RULES:"rules", CHAR:"char", LOBBY:"lobby", DM:"dm", GAME:"game" };
const DS = { ALIVE:"alive", GHOST:"ghost", RELIC:"relic", AGENT:"agent" };
const R  = { HERO:"hero", TRAITOR:"traitor", WILD:"wildcard" };

const C = {
  bg:"#080604",     surface:"#110e09",  lift:"#1c1510",  liftHi:"#241d15",
  border:"#2e2216", borderHi:"#6a4a28",
  gold:"#c9a84c",   goldDim:"#7a5c28",  goldFaint:"#c9a84c14", goldGlow:"#c9a84c55",
  red:"#7a1a1a",    redHi:"#c0392b",    redFaint:"#c0392b18",
  cream:"#e4d09a",  creamDim:"#9a8060", creamMid:"#c4a870",
  green:"#245230",  greenHi:"#3d9b57",  greenFaint:"#3d9b5718",
  purple:"#3a1a58", purpleHi:"#9b59b6",
  blue:"#1a2a58",   blueHi:"#5b8ee6",
  dim:"#4a3a28",    ink:"#080604",
};

// ═══════════════════════════════════════════════════════════
//  GLOBAL CSS
// ═══════════════════════════════════════════════════════════
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:${C.bg};color:${C.cream};font-family:'Palatino Linotype','Book Antiqua',Georgia,serif}
  input,textarea,button,select{font-family:inherit}
  textarea{resize:vertical}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:${C.bg}}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}

  @keyframes fadeUp   {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
  @keyframes slideIn  {from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideUp  {from{opacity:0;transform:translateY(32px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes popIn    {from{opacity:0;transform:scale(.84)}to{opacity:1;transform:scale(1)}}
  @keyframes screenIn {from{opacity:0;transform:scale(.985) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes overlayIn{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes pulse    {0%,100%{opacity:1}50%{opacity:.38}}
  @keyframes glow     {0%,100%{box-shadow:0 0 16px ${C.goldGlow}}50%{box-shadow:0 0 36px ${C.gold}77}}
  @keyframes glowRed  {0%,100%{box-shadow:0 0 14px ${C.redHi}44}50%{box-shadow:0 0 32px ${C.redHi}99}}
  @keyframes flicker  {0%,100%{opacity:1}28%{opacity:.84}64%{opacity:.94}}
  @keyframes spin     {from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
  @keyframes diceStop {0%{transform:rotate(0) scale(1)}38%{transform:rotate(-10deg) scale(1.1)}72%{transform:rotate(5deg) scale(.96)}100%{transform:rotate(0) scale(1)}}
  @keyframes shake    {0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
  @keyframes timerPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
  @keyframes crisisFlash{0%,100%{background:${C.bg}}50%{background:#160808}}
  @keyframes stepBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

  .s-fadeUp  {animation:fadeUp   .48s cubic-bezier(.22,.68,0,1.2) both}
  .s-fadeIn  {animation:fadeIn   .36s ease both}
  .s-slideIn {animation:slideIn  .38s ease both}
  .s-slideUp {animation:slideUp  .48s cubic-bezier(.22,.68,0,1.2) both}
  .s-popIn   {animation:popIn    .34s cubic-bezier(.34,1.56,.64,1) both}
  .s-screenIn{animation:screenIn .46s cubic-bezier(.22,.68,0,1.2) both}

  .d1{animation-delay:.04s}.d2{animation-delay:.10s}.d3{animation-delay:.17s}
  .d4{animation-delay:.24s}.d5{animation-delay:.31s}.d6{animation-delay:.38s}

  .reveal{opacity:0;transform:translateY(24px) scale(.97);
    transition:opacity .5s cubic-bezier(.22,.68,0,1.2),transform .5s cubic-bezier(.22,.68,0,1.2)}
  .reveal.vis{opacity:1;transform:translateY(0) scale(1)}

  .lift{transition:transform .16s ease,box-shadow .16s ease}
  .lift:hover{transform:translateY(-2px);box-shadow:0 8px 22px #0008}
  .lift:active{transform:translateY(0) scale(.98)}

  .btn-t{transition:filter .14s ease,transform .11s ease,box-shadow .14s ease}
  .btn-t:not(:disabled):hover{filter:brightness(1.13);transform:translateY(-1px);box-shadow:0 4px 16px ${C.goldGlow}}
  .btn-t:not(:disabled):active{transform:translateY(0) scale(.98)}

  .choice-btn{transition:background .13s ease,border-color .13s ease,transform .10s ease}
  .choice-btn:not(:disabled):hover{transform:translateX(4px);border-color:${C.goldDim}!important;background:${C.liftHi}!important}
  .choice-btn:not(:disabled):active{transform:translateX(2px) scale(.99)}

  .pill{transition:all .13s ease}
  .pill:hover{border-color:${C.goldDim};color:${C.creamMid}}

  .phase-step{transition:background .25s ease,border-color .25s ease,transform .25s ease}

  @media(prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
    .reveal{opacity:1!important;transform:none!important}
  }
`;

// ═══════════════════════════════════════════════════════════
//  STORAGE
// ═══════════════════════════════════════════════════════════
const save = async (code, data) => {
  try { await window.storage.set(NS+code, JSON.stringify(data), true); } catch {}
};
const load = async (code) => {
  try {
    const r = await window.storage.get(NS+code, true);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
};

// ═══════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════
const uid    = () => Math.random().toString(36).slice(2,10);
const mkCode = () => Math.random().toString(36).slice(2,6).toUpperCase();
const d20    = () => Math.floor(Math.random()*20)+1;
const clamp  = (v,a,b) => Math.max(a, Math.min(b, v));

const TIERS = [
  {max:1,  label:"CRITICAL FAIL ☠",  col:C.redHi,   drinks:3,  hp:-2},
  {max:5,  label:"BAD FAILURE",       col:C.red,     drinks:2,  hp:-1},
  {max:10, label:"PARTIAL FAIL",      col:"#b07020", drinks:1,  hp: 0},
  {max:15, label:"PARTIAL SUCCESS",   col:C.goldDim, drinks:0,  hp: 0},
  {max:19, label:"SUCCESS",           col:C.greenHi, drinks:0,  hp: 0},
  {max:20, label:"CRITICAL HIT ✦",   col:C.gold,    drinks:-2, hp: 1},
];
const getTier = n => TIERS.find(t => n <= t.max) || TIERS[5];
const makeRep = () => ({heroic:0, reckless:0, unified:0, generous:0});
const repLabel = v => v>5?"Very High":v>1?"High":v<-5?"Very Low":v<-1?"Low":"Neutral";

// ═══════════════════════════════════════════════════════════
//  HOOKS
// ═══════════════════════════════════════════════════════════
function useReveal(deps=[]) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if(!el) return;
    el.classList.remove("vis");
    const io = new IntersectionObserver(([e]) => {
      if(e.isIntersecting) { e.target.classList.add("vis"); io.disconnect(); }
    }, {threshold:.1});
    const t = setTimeout(() => io.observe(el), 50);
    return () => { clearTimeout(t); io.disconnect(); };
  }, deps);
  return ref;
}

// AI layer (callDM/judgeCrisis/getWhispers/fill*) lives in ./ai — imported above.

// ═══════════════════════════════════════════════════════════
//  DESIGN ATOMS
// ═══════════════════════════════════════════════════════════
const Eyebrow = ({c,children}) => (
  <div style={{color:C.goldDim,fontSize:10,letterSpacing:3.5,textTransform:"uppercase",marginBottom:7,textAlign:c?"center":undefined}}>{children}</div>
);

function Btn({children,onClick,disabled,full,sm,variant="primary",danger,ghost,loading}) {
  const p = sm?"7px 15px":"11px 22px", fs = sm?12:14;
  const base = {border:"none",borderRadius:7,cursor:disabled||loading?"not-allowed":"pointer",fontWeight:"bold",letterSpacing:.5,padding:p,fontSize:fs,width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6};
  if(disabled||loading) return <button disabled style={{...base,background:C.border,color:C.dim}}>{loading?"Working...":children}</button>;
  if(ghost)   return <button onClick={onClick} className="btn-t" style={{...base,background:"transparent",color:C.creamDim,border:`1px solid ${C.border}`}}>{children}</button>;
  if(danger)  return <button onClick={onClick} className="btn-t" style={{...base,background:`linear-gradient(135deg,#5a1010,${C.redHi})`,color:C.cream}}>{children}</button>;
  if(variant==="secondary") return <button onClick={onClick} className="btn-t" style={{...base,background:"transparent",color:C.gold,border:`1px solid ${C.gold}`}}>{children}</button>;
  return <button onClick={onClick} className="btn-t" style={{...base,background:`linear-gradient(135deg,#503a0e,${C.gold})`,color:C.ink}}>{children}</button>;
}

function Field({label,value,onChange,placeholder,multi,hint,aiTag}) {
  const s={width:"100%",background:C.lift,border:`1px solid ${aiTag?C.goldDim:C.border}`,borderRadius:6,padding:"9px 12px",color:C.cream,fontSize:14,outline:"none",transition:"border-color .2s ease"};
  return (
    <div style={{marginBottom:14,position:"relative"}}>
      <label style={{display:"block",color:C.gold,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{label}</label>
      {aiTag&&<span style={{position:"absolute",top:0,right:0,background:`${C.gold}22`,border:`1px solid ${C.goldDim}`,borderRadius:"0 6px 0 6px",padding:"1px 6px",fontSize:9,color:C.gold}}>✨ AI</span>}
      {multi?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...s,resize:"vertical"}}/>
            :<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>}
      {hint&&<div style={{color:C.dim,fontSize:11,marginTop:3,lineHeight:1.4}}>{hint}</div>}
    </div>
  );
}

function Card({children,style,glow,danger:dng,info}) {
  const border = dng?C.redHi:glow?C.gold:info?C.blueHi:C.border;
  const shadow = glow?`0 0 30px ${C.goldGlow}`:dng?`0 0 20px ${C.redHi}44`:info?`0 0 16px ${C.blueHi}22`:"none";
  return <div style={{background:C.surface,border:`1px solid ${border}`,borderRadius:12,padding:20,boxShadow:shadow,transition:"box-shadow .4s ease",...style}}>{children}</div>;
}

function AIBanner({label,sub,onFill,busy}) {
  return (
    <div style={{background:C.goldFaint,border:`1px dashed ${C.goldDim}`,borderRadius:8,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
      <div><div style={{color:C.gold,fontSize:13,fontWeight:"bold"}}>✨ {label}</div><div style={{color:C.dim,fontSize:11,marginTop:2}}>{sub}</div></div>
      <button onClick={onFill} disabled={busy} style={{background:busy?C.border:`linear-gradient(135deg,#503a0e,${C.gold})`,border:"none",borderRadius:6,padding:"7px 14px",color:busy?C.dim:C.ink,fontSize:12,fontWeight:"bold",cursor:busy?"not-allowed":"pointer",flexShrink:0}}>{busy?"Conjuring...":"Conjure"}</button>
    </div>
  );
}

function Chip({p,isMe}) {
  const dead = p.deathState!==DS.ALIVE;
  return (
    <div style={{background:C.surface,border:`1px solid ${isMe?C.gold:dead?C.redHi:C.border}`,borderRadius:7,padding:"4px 9px",fontSize:11,opacity:dead?.58:1,flexShrink:0}}>
      <span style={{color:C.cream}}>{p.name}</span>
      {dead&&<span style={{color:C.redHi,fontSize:9,marginLeft:3}}>[{p.deathState}]</span>}
      <span style={{color:C.dim,marginLeft:4}}>❤{p.hp}</span>
      <span style={{color:C.goldDim,marginLeft:4}}>🍺{p.drinkCount}</span>
      {p.blueShell&&<span style={{marginLeft:3,fontSize:10}}>🐚</span>}
    </div>
  );
}

function RoleBadge({role}) {
  const m={hero:{i:"⚔️",l:"Hero",c:C.greenHi,bg:C.greenFaint},traitor:{i:"🗡️",l:"Traitor",c:C.redHi,bg:C.redFaint},wildcard:{i:"🃏",l:"Wild Card",c:C.gold,bg:C.goldFaint}};
  const v=m[role]||m.hero;
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:v.bg,border:`1px solid ${v.c}`,borderRadius:20,padding:"3px 11px",color:v.c,fontSize:11,fontWeight:"bold"}}>{v.i} {v.l}</span>;
}

function Pills({opts,val,set}) {
  return <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:5}}>{opts.map(o=><button key={o} onClick={()=>set(o)} className="pill" style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:`1px solid ${val===o?C.gold:C.border}`,background:val===o?`${C.gold}22`:"transparent",color:val===o?C.gold:C.creamDim}}>{o}</button>)}</div>;
}

// ═══════════════════════════════════════════════════════════
//  INFO BOX — contextual rules helper
// ═══════════════════════════════════════════════════════════
function InfoBox({children,icon="ℹ️",color}) {
  return (
    <div style={{background:C.blue+"22",border:`1px solid ${color||C.blueHi}44`,borderRadius:8,padding:"10px 13px",marginBottom:14,display:"flex",gap:9,alignItems:"flex-start"}}>
      <span style={{fontSize:15,flexShrink:0}}>{icon}</span>
      <div style={{color:C.creamDim,fontSize:12,lineHeight:1.6}}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PHASE INDICATOR — shows where in the game loop you are
// ═══════════════════════════════════════════════════════════
function PhaseBar({phase}) {
  const PHASES = [
    {id:"debate", icon:"💬", label:"Debate"},
    {id:"vote",   icon:"🗳", label:"Vote"},
    {id:"dice",   icon:"🎲", label:"Roll"},
    {id:"resolution", icon:"📜", label:"Result"},
  ];
  const activeIdx = PHASES.findIndex(p => p.id === phase);
  return (
    <div style={{display:"flex",gap:4,marginBottom:14,justifyContent:"center"}}>
      {PHASES.map((p,i) => {
        const active = p.id===phase;
        const done = i < activeIdx;
        return (
          <div key={p.id} className="phase-step" style={{
            flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            background:active?`${C.gold}22`:done?`${C.green}22`:"transparent",
            border:`1px solid ${active?C.gold:done?C.greenHi:C.border}`,
            borderRadius:8,padding:"6px 4px",
          }}>
            <span style={{fontSize:14,animation:active?"stepBounce 1s ease infinite":"none"}}>{p.icon}</span>
            <span style={{fontSize:9,letterSpacing:1,textTransform:"uppercase",color:active?C.gold:done?C.greenHi:C.dim}}>{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DICE
// ═══════════════════════════════════════════════════════════
function Dice({onDone}) {
  const [face,setFace]=useState(1);
  const [final,setFinal]=useState(null);
  const [done,setDone]=useState(false);

  useEffect(()=>{
    const result=d20(); let n=0,speed=55;
    const tick=()=>{
      setFace(Math.floor(Math.random()*20)+1); n++;
      speed=Math.min(speed*1.065,280);
      if(n<24) setTimeout(tick,speed);
      else { setFace(result); setFinal(result); setTimeout(()=>{setDone(true);setTimeout(()=>onDone(result),800);},160); }
    };
    setTimeout(tick,50);
  },[]);

  const t = final?getTier(final):null;
  return (
    <div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{color:C.goldDim,fontSize:10,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>The die falls...</div>
      <div style={{
        width:104,height:104,margin:"0 auto",
        background:done?(final===20?`linear-gradient(135deg,#7a5810,${C.gold})`:final===1?`linear-gradient(135deg,#5a0808,${C.redHi})`:C.lift):C.lift,
        border:`3px solid ${done?(t?.col||C.gold):C.border}`,
        borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:46,fontWeight:"bold",color:done?(t?.col||C.gold):C.dim,
        boxShadow:done?`0 0 44px ${(t?.col||C.gold)}55`:"none",
        animation:done?"diceStop .5s cubic-bezier(.34,1.56,.64,1) both":"spin .1s ease-in-out infinite alternate",
        transition:"background .3s,border-color .3s,box-shadow .4s",
      }}>{face}</div>
      {done&&t&&(
        <div className="s-fadeUp" style={{marginTop:12}}>
          <div style={{color:t.col,fontSize:15,fontWeight:"bold",letterSpacing:1.5,textTransform:"uppercase"}}>{t.label}</div>
          {t.drinks>0&&<div style={{color:C.creamMid,fontSize:12,marginTop:4}}>+{t.drinks} sips added to the consequence</div>}
          {t.drinks<0&&<div style={{color:C.greenHi,fontSize:12,marginTop:4}}>Give out {Math.abs(t.drinks)} sips — great roll!</div>}
          {t.hp>0    &&<div style={{color:C.greenHi,fontSize:12,marginTop:3}}>+1 HP restored</div>}
          {t.hp<0    &&<div style={{color:C.redHi,  fontSize:12,marginTop:3}}>{Math.abs(t.hp)} HP lost</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TIMER
// ═══════════════════════════════════════════════════════════
function Timer({dur,onEnd}) {
  const [left,setLeft]=useState(dur);
  const urgent=left<=10;
  useEffect(()=>{if(left<=0){onEnd();return;}const t=setTimeout(()=>setLeft(l=>l-1),1000);return()=>clearTimeout(t);},[left]);
  return (
    <div style={{textAlign:"center",marginBottom:16}}>
      <div style={{fontSize:urgent?42:34,color:urgent?C.redHi:C.gold,fontWeight:"bold",lineHeight:1,animation:urgent?"timerPulse .48s ease infinite":"none",transition:"color .4s,font-size .2s"}}>{left}</div>
      <div style={{height:4,background:C.border,borderRadius:2,margin:"6px 0",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(left/dur)*100}%`,background:urgent?`linear-gradient(90deg,${C.red},${C.redHi})`:`linear-gradient(90deg,${C.goldDim},${C.gold})`,borderRadius:2,transition:"width 1s linear,background .3s"}}/>
      </div>
      <div style={{color:urgent?C.redHi:C.dim,fontSize:10,letterSpacing:2,textTransform:"uppercase"}}>{urgent?"⚠ VOTE NOW!":"Debate out loud — then vote"}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  REP BAR
// ═══════════════════════════════════════════════════════════
function RepBar({label,val}) {
  const pct=((val+10)/20)*100;
  const col=val>3?C.greenHi:val<-3?C.redHi:C.goldDim;
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
        <span style={{color:C.creamDim,fontSize:11}}>{label}</span>
        <span style={{color:col,fontSize:11,fontWeight:"bold"}}>{repLabel(val)}</span>
      </div>
      <div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:2,transition:"width .6s cubic-bezier(.22,.68,0,1.2)"}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  INTERACTIVE LANDING — animated intro + guided tour
// ═══════════════════════════════════════════════════════════

// Mechanic cards shown in the interactive guide
const GUIDE = [
  { icon:ScrollText, color:C.gold,    title:"The Story",   line:"An AI dungeon master narrates an endless adventure shaped by your choices." },
  { icon:Users,      color:C.blueHi,  title:"The Party",   line:"2 to 8 players, each on their own device. With 3+, one is secretly a traitor." },
  { icon:Vote,       color:C.greenHi, title:"The Choice",  line:"Debate out loud, then vote. The minority drinks." },
  { icon:Dice5,      color:C.creamMid,title:"The Roll",    line:"A d20 decides your fate. Low rolls cost drinks and blood." },
  { icon:Drama,      color:C.redHi,   title:"The Betrayal",line:"Hidden roles, secret whispers, and a tribunal to expose the guilty." },
  { icon:Wine,       color:C.purpleHi,title:"The Stakes",  line:"Every failure has a price. Drink responsibly." },
];

// One-line rule references for the deep guide
const LOOP = [
  { icon:MessageCircle, label:"Debate",  desc:"60 seconds to argue your case." },
  { icon:Vote,          label:"Vote",    desc:"Secret pick. Majority wins." },
  { icon:Coins,         label:"Bet",     desc:"Wager sips on your vote." },
  { icon:Dice5,         label:"Roll",    desc:"A d20 modifies the outcome." },
  { icon:ScrollText,    label:"Result",  desc:"The DM narrates. Drinks are dealt." },
];

const ROLES_GUIDE = [
  { icon:Swords, color:C.greenHi, label:"Hero",      desc:"Win the quest for the party." },
  { icon:UserX,  color:C.redHi,   label:"Traitor",   desc:"Make the party fail, unseen." },
  { icon:Sparkles,color:C.gold,   label:"Wild Card", desc:"Play only for yourself." },
];

const EXTRAS = [
  { icon:Eye,    label:"Whispers",   desc:"The DM messages you in secret." },
  { icon:Scale,  label:"Tribunal",   desc:"Vote once to exile the traitor." },
  { icon:Shell,  label:"Blue Shell", desc:"The loser derails any scene." },
  { icon:Gauge,  label:"Reputation", desc:"The world reacts to your deeds." },
  { icon:Zap,    label:"Crisis",     desc:"Timed emergencies. Solve fast." },
  { icon:Skull,  label:"Death",      desc:"Fall to zero and return as a ghost." },
];

// Animated dice that cycles faces — hero centerpiece
function HeroDie() {
  const [face,setFace]=useState(20);
  useEffect(()=>{
    let n=0;
    const iv=setInterval(()=>{ n++; setFace(Math.floor(Math.random()*20)+1); if(n%7===0)setFace(20); },1400);
    return()=>clearInterval(iv);
  },[]);
  return (
    <div style={{position:"relative",width:96,height:96,margin:"0 auto 4px"}}>
      <div style={{position:"absolute",inset:0,borderRadius:20,background:`radial-gradient(circle at 50% 40%, ${C.gold}33, transparent 70%)`,animation:"pulse 3s ease infinite"}}/>
      <div style={{
        position:"relative",width:96,height:96,borderRadius:20,
        background:`linear-gradient(135deg,#4a3410,${C.gold})`,
        border:`2px solid ${C.gold}`,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:42,fontWeight:"bold",color:C.ink,fontFamily:"Georgia,serif",
        boxShadow:`0 0 40px ${C.goldGlow}`,animation:"floaty 4s ease-in-out infinite",
      }}>{face}</div>
    </div>
  );
}

// Reusable mini icon tile
function IconTile({icon:Icon,color,title,desc,delay}) {
  return (
    <div className={`reveal`} style={{transitionDelay:`${delay||0}ms`}}>
      <div className="lift" style={{
        background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,
        padding:"14px 14px",display:"flex",gap:12,alignItems:"flex-start",height:"100%",
      }}>
        <div style={{flexShrink:0,width:38,height:38,borderRadius:9,background:`${color}1e`,border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon size={19} color={color} strokeWidth={1.8}/>
        </div>
        <div>
          <div style={{color:C.cream,fontWeight:"bold",fontSize:14,marginBottom:2}}>{title}</div>
          <div style={{color:C.creamDim,fontSize:12,lineHeight:1.5}}>{desc}</div>
        </div>
      </div>
    </div>
  );
}

// Scroll-reveal wrapper that observes children
function RevealGroup({children,deps=[]}) {
  const ref=useRef(null);
  useEffect(()=>{
    const root=ref.current;if(!root)return;
    const items=root.querySelectorAll(".reveal");
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("vis"); io.unobserve(e.target);} });
    },{threshold:.12});
    items.forEach(el=>io.observe(el));
    return()=>io.disconnect();
  },deps);
  return <div ref={ref}>{children}</div>;
}

// ── Full guide screen (deep dive) ──
function RulesScreen({onBack}) {
  const SectionTitle = ({icon:Icon,children}) => (
    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14,marginTop:4}}>
      <Icon size={18} color={C.gold} strokeWidth={1.8}/>
      <h3 style={{color:C.gold,fontSize:13,letterSpacing:2,textTransform:"uppercase",fontWeight:"bold"}}>{children}</h3>
    </div>
  );

  return (
    <div className="s-screenIn" style={{minHeight:"100vh",background:C.bg,padding:"22px 20px 48px"}}>
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <button onClick={onBack} className="pill" style={{display:"inline-flex",alignItems:"center",gap:5,background:"transparent",border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 13px",color:C.creamDim,fontSize:12,cursor:"pointer",marginBottom:22}}>
          <ChevronRight size={14} style={{transform:"rotate(180deg)"}}/> Back
        </button>

        <div style={{textAlign:"center",marginBottom:28}}>
          <h2 style={{fontFamily:"Georgia,serif",color:C.gold,fontSize:30}}>The Full Guide</h2>
          <div style={{width:40,height:1,background:C.goldDim,margin:"14px auto 0"}}/>
        </div>

        <RevealGroup deps={[]}>
          {/* The round loop */}
          <SectionTitle icon={ScrollText}>A Single Round</SectionTitle>
          <div style={{marginBottom:26}}>
            {LOOP.map((s,i)=>(
              <div key={i} className="reveal" style={{transitionDelay:`${i*50}ms`}}>
                <div style={{display:"flex",gap:12,alignItems:"center",padding:"11px 14px",marginBottom:7,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10}}>
                  <div style={{flexShrink:0,width:32,height:32,borderRadius:8,background:C.lift,border:`1px solid ${C.borderHi}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                    <s.icon size={16} color={C.gold} strokeWidth={1.8}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color:C.cream,fontWeight:"bold",fontSize:13}}>{s.label}</div>
                    <div style={{color:C.creamDim,fontSize:12}}>{s.desc}</div>
                  </div>
                  <span style={{color:C.dim,fontSize:12,fontWeight:"bold"}}>{i+1}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Roles */}
          <SectionTitle icon={Drama}>Hidden Roles</SectionTitle>
          <div style={{display:"grid",gap:8,marginBottom:26}}>
            {ROLES_GUIDE.map((r,i)=>(
              <div key={i} className="reveal" style={{transitionDelay:`${i*50}ms`}}>
                <div style={{display:"flex",gap:12,alignItems:"center",padding:"12px 14px",background:C.surface,border:`1px solid ${r.color}33`,borderRadius:10}}>
                  <div style={{flexShrink:0,width:36,height:36,borderRadius:9,background:`${r.color}1e`,border:`1px solid ${r.color}55`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <r.icon size={18} color={r.color} strokeWidth={1.8}/>
                  </div>
                  <div>
                    <div style={{color:r.color,fontWeight:"bold",fontSize:14}}>{r.label}</div>
                    <div style={{color:C.creamDim,fontSize:12}}>{r.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Drinking */}
          <SectionTitle icon={Wine}>When You Drink</SectionTitle>
          <div className="reveal" style={{marginBottom:26}}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:11,padding:"6px 4px"}}>
              {[
                ["Voted with the minority","1 sip"],
                ["Roll of 1–10","1–3 sips, lose HP"],
                ["Critical fail — rolled 1","3 sips, −2 HP"],
                ["Critical hit — rolled 20","give out 2 sips"],
                ["Lost your bet","drink your wager"],
                ["Wrong tribunal exile","party drinks 3 each"],
                ["Crisis time runs out","finish your drink"],
              ].map(([k,v],i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                  <span style={{color:C.creamDim,fontSize:12.5}}>{k}</span>
                  <span style={{color:C.gold,fontSize:12,fontWeight:"bold",whiteSpace:"nowrap",marginLeft:12}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          <SectionTitle icon={Sparkles}>Twists & Powers</SectionTitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:30}}>
            {EXTRAS.map((e,i)=>(
              <IconTile key={i} icon={e.icon} color={C.creamMid} title={e.label} desc={e.desc} delay={i*40}/>
            ))}
          </div>
        </RevealGroup>

        <Btn full onClick={onBack}>Got it — let's play <ArrowRight size={16}/></Btn>
      </div>
    </div>
  );
}

// ── Interactive landing (entry point) ──
function HomeScreen({onCreate,onJoin,onRules}) {
  const [name,setName]=useState("");
  const [jc,setJc]=useState("");
  const [mode,setMode]=useState(null);
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);
  const heroRef=useReveal([]);

  const create=async()=>{
    if(!name.trim()){setErr("Enter your name first");return;}
    setBusy(true);
    const rc=mkCode(),hid=uid();
    await save(rc,{code:rc,hostId:hid,players:[],dm:null,world:null,phase:"lobby",history:[],currentBeat:null,votes:{},beatCount:0,tribunalUsed:false,privateMessages:{},reputation:makeRep(),bets:{},crisisActive:false,crisisEvent:null,crisisResult:null});
    onCreate(rc,hid,name.trim());
  };
  const join=async()=>{
    if(!name.trim()){setErr("Enter your name first");return;}
    const rc=jc.trim().toUpperCase();
    if(rc.length!==4){setErr("Room code must be 4 letters");return;}
    setBusy(true);
    const r=await load(rc);
    if(!r){setErr("Room not found — check the code");setBusy(false);return;}
    if(r.phase!=="lobby"){setErr("That game already started");setBusy(false);return;}
    onJoin(rc,uid(),name.trim());
  };

  return (
    <div className="s-screenIn" style={{minHeight:"100vh",background:C.bg}}>
      {/* Ambient backdrop */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse at 50% 0%, ${C.gold}0e, transparent 55%)`}}/>

      <div style={{position:"relative",maxWidth:540,margin:"0 auto",padding:"0 20px 56px"}}>

        {/* ── HERO ── */}
        <div ref={heroRef} className="reveal" style={{textAlign:"center",paddingTop:56,paddingBottom:8}}>
          <HeroDie/>
          <div style={{color:C.goldDim,fontSize:10,letterSpacing:5,textTransform:"uppercase",marginTop:14,marginBottom:10}}>AI Adventure Drinking Game</div>
          <h1 style={{fontFamily:"Georgia,serif",fontSize:62,color:C.gold,lineHeight:.95,textShadow:`0 0 70px ${C.goldGlow}`,animation:"flicker 6s ease infinite"}}>Tavern<br/>Tales</h1>
          <div style={{color:C.creamDim,fontSize:14,marginTop:16,fontStyle:"italic"}}>Every choice has a price.</div>

          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:22}}>
            <button onClick={()=>document.getElementById("tt-start")?.scrollIntoView({behavior:"smooth"})} className="btn-t" style={{background:`linear-gradient(135deg,#503a0e,${C.gold})`,border:"none",borderRadius:8,padding:"11px 22px",color:C.ink,fontSize:14,fontWeight:"bold",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7}}>
              <Play size={16}/> Play Now
            </button>
            <button onClick={onRules} className="btn-t" style={{background:"transparent",border:`1px solid ${C.gold}`,borderRadius:8,padding:"11px 20px",color:C.gold,fontSize:14,fontWeight:"bold",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7}}>
              <BookOpen size={16}/> Full Guide
            </button>
          </div>

          <div style={{marginTop:34,color:C.dim,display:"flex",flexDirection:"column",alignItems:"center",gap:4,animation:"floaty 2.5s ease-in-out infinite"}}>
            <span style={{fontSize:10,letterSpacing:2,textTransform:"uppercase"}}>Scroll</span>
            <ChevronDown size={16}/>
          </div>
        </div>

        {/* ── GUIDE CARDS ── */}
        <div style={{marginTop:48}}>
          <RevealGroup deps={[]}>
            <div className="reveal" style={{textAlign:"center",marginBottom:22}}>
              <h2 style={{fontFamily:"Georgia,serif",color:C.cream,fontSize:24}}>What you're in for</h2>
            </div>
            <div style={{display:"grid",gap:10}}>
              {GUIDE.map((g,i)=>(
                <IconTile key={i} icon={g.icon} color={g.color} title={g.title} desc={g.line} delay={i*60}/>
              ))}
            </div>
          </RevealGroup>
        </div>

        {/* ── QUICK LOOP STRIP ── */}
        <div style={{marginTop:44}}>
          <RevealGroup deps={[]}>
            <div className="reveal" style={{textAlign:"center",marginBottom:18}}>
              <div style={{color:C.goldDim,fontSize:10,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Each Round</div>
              <h2 style={{fontFamily:"Georgia,serif",color:C.cream,fontSize:22}}>Five quick beats</h2>
            </div>
            <div className="reveal" style={{display:"flex",alignItems:"stretch",gap:6,overflowX:"auto",paddingBottom:6}}>
              {LOOP.map((s,i)=>(
                <div key={i} style={{flex:"1 0 0",minWidth:84,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 8px",textAlign:"center",position:"relative"}}>
                  <div style={{width:34,height:34,margin:"0 auto 7px",borderRadius:9,background:C.lift,border:`1px solid ${C.borderHi}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <s.icon size={16} color={C.gold} strokeWidth={1.8}/>
                  </div>
                  <div style={{color:C.cream,fontSize:11,fontWeight:"bold"}}>{s.label}</div>
                  {i<LOOP.length-1&&<div style={{position:"absolute",right:-7,top:"40%",zIndex:1,color:C.goldDim}}><ChevronRight size={13}/></div>}
                </div>
              ))}
            </div>
          </RevealGroup>
        </div>

        {/* ── START CARD ── */}
        <div id="tt-start" style={{marginTop:52,scrollMarginTop:24}}>
          <RevealGroup deps={[mode]}>
            <div className="reveal">
              <Card glow>
                <div style={{textAlign:"center",marginBottom:18}}>
                  <Castle size={26} color={C.gold} strokeWidth={1.6} style={{marginBottom:8}}/>
                  <h2 style={{fontFamily:"Georgia,serif",color:C.gold,fontSize:24}}>Begin</h2>
                </div>

                <Field label="Your Name" value={name} onChange={setName} placeholder="What do they call you?"/>
                {err&&<div className="s-fadeIn" style={{color:C.redHi,fontSize:12,marginBottom:10,animation:"shake .3s ease"}}>{err}</div>}

                {!mode&&(
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    <button onClick={()=>{setErr("");setMode("create");}} className="btn-t" style={{background:`linear-gradient(135deg,#503a0e,${C.gold})`,border:"none",borderRadius:8,padding:"13px",color:C.ink,fontSize:14,fontWeight:"bold",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <Crown size={17}/> Host a Game
                    </button>
                    <button onClick={()=>{setErr("");setMode("join");}} className="btn-t" style={{background:"transparent",border:`1px solid ${C.gold}`,borderRadius:8,padding:"13px",color:C.gold,fontSize:14,fontWeight:"bold",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <DoorOpen size={17}/> Join a Game
                    </button>
                  </div>
                )}
                {mode==="create"&&(
                  <div className="s-fadeUp">
                    <div style={{display:"flex",gap:9,alignItems:"flex-start",background:C.goldFaint,border:`1px solid ${C.goldDim}44`,borderRadius:8,padding:"10px 12px",marginBottom:14}}>
                      <Crown size={16} color={C.gold} style={{flexShrink:0,marginTop:1}}/>
                      <div style={{color:C.creamDim,fontSize:12,lineHeight:1.55}}>You run the pace and the dice. Everyone else joins with your code.</div>
                    </div>
                    <div style={{display:"flex",gap:8}}><Btn onClick={create} loading={busy}>Create Room</Btn><Btn ghost onClick={()=>setMode(null)}>Back</Btn></div>
                  </div>
                )}
                {mode==="join"&&(
                  <div className="s-fadeUp">
                    <Field label="Room Code" value={jc} onChange={v=>setJc(v.toUpperCase())} placeholder="WXYZ"/>
                    <div style={{display:"flex",gap:8}}><Btn onClick={join} loading={busy}>Join Room</Btn><Btn ghost onClick={()=>setMode(null)}>Back</Btn></div>
                  </div>
                )}
              </Card>
            </div>
          </RevealGroup>
          <div style={{textAlign:"center",marginTop:16,color:C.dim,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Wine size={13}/> Please drink responsibly
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CHARACTER SCREEN
// ═══════════════════════════════════════════════════════════
function CharScreen({roomCode,playerId,playerName,onDone}) {
  const [form,setForm]=useState({class:"",backstory:"",ability:"",flaw:"",secretQuest:""});
  const [aiF,setAiF]=useState({});
  const [filling,setFilling]=useState(false);
  const [saving,setSaving]=useState(false);
  const f=k=>v=>{setForm(p=>({...p,[k]:v}));setAiF(p=>({...p,[k]:false}));};
  const rev=useReveal([]);

  const fill=async()=>{
    setFilling(true);
    const res=await fillChar(playerName,form.class);
    if(res){
      const empty=!Object.values(form).some(v=>v.trim());
      const tagged={};
      setForm(prev=>{
        const n={...prev};
        Object.keys(res).forEach(k=>{if(empty||!prev[k]?.trim()){n[k]=res[k];tagged[k]=true;}});
        return n;
      });
      setTimeout(()=>setAiF(tagged),0);
    }
    setFilling(false);
  };

  const submit=async()=>{
    if(!form.class.trim())return;
    setSaving(true);
    const room=await load(roomCode);
    if(!room){setSaving(false);return;}
    const player={
      id:playerId,name:playerName,
      class:form.class.trim(),
      backstory:form.backstory.trim()||"A mysterious stranger.",
      ability:form.ability.trim()||"Uncanny timing",
      flaw:form.flaw.trim()||"Acts before thinking",
      secretQuest:form.secretQuest.trim()||"Survive the night",
      hp:10,drinkCount:0,deathState:DS.ALIVE,ready:true,
      fateCards:["reroll","plot_twist","redirect"],
    };
    const exists=room.players.find(p=>p.id===playerId);
    room.players=exists?room.players.map(p=>p.id===playerId?player:p):[...room.players,player];
    await save(roomCode,room);
    onDone();
  };

  const FIELDS=[
    {k:"class",      l:"Class / Role",   ph:"e.g. Retired Sea Witch, Discount Wizard, Cursed Librarian",hint:"Anything goes — the DM will take it seriously"},
    {k:"backstory",  l:"Backstory",       ph:"e.g. I'm searching for my stolen goat",hint:"One sentence. The DM weaves this into the story throughout.",multi:true},
    {k:"ability",    l:"Special Ability", ph:"e.g. I can talk to rats, I can sense lies",hint:"You invent it — the AI decides when it naturally activates"},
    {k:"flaw",       l:"Fatal Flaw",      ph:"e.g. I trust everyone immediately, I panic near water",hint:"⚠ The AI will use this against you at the worst possible moment"},
    {k:"secretQuest",l:"Secret Quest",    ph:"e.g. Find the person who ruined my family",hint:"Your hidden goal. Revealed and resolved in the epilogue."},
  ];

  return (
    <div className="s-screenIn" style={{minHeight:"100vh",background:C.bg,padding:"24px 20px"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div ref={rev} className="reveal" style={{textAlign:"center",marginBottom:22}}>
          <Eyebrow c>Step 1 of 3 — Character Creation</Eyebrow>
          <h2 style={{fontFamily:"Georgia,serif",color:C.gold,fontSize:26}}>Who Are You?</h2>
          <div style={{color:C.dim,fontSize:13,marginTop:5}}>The DM reads all of this and personalizes the story around your character.</div>
        </div>
        <Card>
          <div style={{color:C.creamDim,fontSize:12,marginBottom:14,padding:"7px 11px",background:C.lift,borderRadius:6,borderLeft:`3px solid ${C.gold}`}}>
            Playing as: <strong style={{color:C.cream}}>{playerName}</strong>
          </div>
          <InfoBox icon="💡">Fill in as much or as little as you want. Use <strong>Conjure</strong> to let the AI generate a creative character — you can edit anything after.</InfoBox>
          <AIBanner label="Let AI build your character" sub={form.class.trim()?"Fills empty fields around your class":"Generates a completely random creative character"} onFill={fill} busy={filling}/>
          {FIELDS.map((fld,i)=>(
            <div key={fld.k} className={`s-fadeUp d${i+1}`}>
              <Field label={fld.l} value={form[fld.k]} onChange={f(fld.k)} placeholder={fld.ph} hint={fld.hint} multi={fld.multi} aiTag={aiF[fld.k]}/>
            </div>
          ))}
          <Btn full onClick={submit} loading={saving} disabled={!form.class.trim()}>Enter the Tavern →</Btn>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LOBBY SCREEN
// ═══════════════════════════════════════════════════════════
function LobbyScreen({roomCode,playerId,isHost,onBegin}) {
  const [room,setRoom]=useState(null);
  const listRef=useReveal([room?.players?.length]);

  useEffect(()=>{
    const poll=async()=>{
      const r=await load(roomCode);
      if(r){setRoom(r);if(r.phase==="dm_setup"&&!isHost)onBegin(r);}
    };
    poll();const t=setInterval(poll,POLL_MS);return()=>clearInterval(t);
  },[]);

  return (
    <div className="s-screenIn" style={{minHeight:"100vh",background:C.bg,padding:"24px 20px"}}>
      <div style={{maxWidth:460,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <Eyebrow c>Step 2 of 3 — Gathering the Party</Eyebrow>
          <h2 style={{fontFamily:"Georgia,serif",color:C.gold,fontSize:26}}>The Tavern</h2>
          <div className="s-popIn" style={{display:"inline-block",background:C.lift,border:`2px solid ${C.gold}`,borderRadius:10,padding:"7px 22px",color:C.gold,fontSize:26,fontFamily:"Georgia,serif",letterSpacing:8,marginTop:8,animation:"glow 2.5s ease infinite"}}>{roomCode}</div>
          <div style={{color:C.dim,fontSize:12,marginTop:7}}>Everyone enters this code on their device</div>
        </div>

        {isHost&&(
          <InfoBox icon="👑" color={C.gold}>
            As <strong>Host</strong>, you'll set up the DM and world next. During the game you control when to open voting and advance the story. Other players vote and interact on their own screens.
          </InfoBox>
        )}
        {!isHost&&(
          <InfoBox icon="📱">
            You've joined successfully! Wait here while others create their characters. The host will start the game.
          </InfoBox>
        )}

        <Card style={{marginBottom:14}}>
          <div style={{color:C.creamDim,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>
            Party ({room?.players?.length||0}/8)
          </div>
          <div ref={listRef} className="reveal">
            {room?.players?.map((p,i)=>(
              <div key={p.id} className={`s-slideIn d${Math.min(i+1,6)}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",marginBottom:5,background:C.lift,borderRadius:7,border:`1px solid ${p.id===playerId?C.gold:C.border}`}}>
                <div>
                  <span style={{color:C.cream,fontWeight:"bold"}}>{p.name}</span>
                  <span style={{color:C.dim,fontSize:11,marginLeft:7}}>{p.class}</span>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {p.id===playerId&&<span style={{color:C.goldDim,fontSize:10}}>(you)</span>}
                  <span style={{color:C.greenHi,fontSize:11}}>✓ Ready</span>
                </div>
              </div>
            ))}
            {!room?.players?.length&&<div style={{color:C.dim,fontSize:13,textAlign:"center",padding:16}}>Waiting for players to join...</div>}
          </div>
          {room?.players?.length>0&&(
            <div style={{marginTop:10,padding:"8px 11px",background:room.players.length<3?C.greenFaint:C.redFaint,border:`1px solid ${room.players.length<3?C.greenHi:C.red}44`,borderRadius:7,display:"flex",alignItems:"center",gap:7}}>
              {room.players.length<3
                ? <><Swords size={14} color={C.greenHi}/><span style={{color:C.creamDim,fontSize:12}}>2-player game — mostly co-op, but <strong style={{color:C.greenHi}}>watch your back</strong>. Add a 3rd to guarantee a traitor.</span></>
                : <><UserX size={14} color={C.redHi}/><span style={{color:C.creamDim,fontSize:12}}><strong style={{color:C.redHi}}>Traitor Mode</strong> — one player will secretly work against the party.</span></>
              }
            </div>
          )}
        </Card>

        {isHost?(
          <Btn full onClick={()=>onBegin(room)} disabled={!room?.players?.length}>
            Everyone's Here — Set Up the DM →
          </Btn>
        ):(
          <div style={{textAlign:"center",color:C.dim,fontSize:13,marginTop:4}}>Waiting for host to start the game...</div>
        )}

        {isHost&&!room?.players?.length&&(
          <div style={{color:C.dim,fontSize:11,textAlign:"center",marginTop:8}}>Need at least 1 player to continue</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DM SETUP SCREEN
// ═══════════════════════════════════════════════════════════
function DMScreen({roomCode,onDone}) {
  const [dm,setDm]=useState({name:"",personality:"",style:"Dark Comedy"});
  const [world,setWorld]=useState({setting:"",tone:"Balanced",incident:"",stakes:""});
  const [tab,setTab]=useState("dm");
  const [aiDm,setAiDm]=useState({});
  const [aiW,setAiW]=useState({});
  const [fdm,setFdm]=useState(false);
  const [fw,setFw]=useState(false);
  const [saving,setSaving]=useState(false);

  const d=k=>v=>{setDm(p=>({...p,[k]:v}));setAiDm(p=>({...p,[k]:false}));};
  const w=k=>v=>{setWorld(p=>({...p,[k]:v}));setAiW(p=>({...p,[k]:false}));};
  const STYLES=["Epic & Serious","Dark Comedy","Full Chaos","Fairy Tale Gone Wrong"];
  const TONES=["Grim & Gritty","Balanced","Comedic","Absurdist"];

  const AiTag=({show})=>show?<span style={{position:"absolute",top:0,right:0,background:`${C.gold}22`,border:`1px solid ${C.goldDim}`,borderRadius:"0 6px 0 6px",padding:"1px 6px",fontSize:9,color:C.gold}}>✨ AI</span>:null;

  const begin=async()=>{
    setSaving(true);
    const room=await load(roomCode);
    // Role assignment.
    // 2 players: 20% chance one is secretly the Traitor, else co-op. Neither knows which.
    // 3+ players: always one Traitor; 6+ adds a Wild Card; 8 adds a second.
    const n=room.players.length;
    const TWO_PLAYER_TRAITOR_CHANCE=0.20;
    const twoPlayerTraitor = n===2 && Math.random()<TWO_PLAYER_TRAITOR_CHANCE;
    const coop = n<3 && !twoPlayerTraitor;
    const shuffled=[...room.players].sort(()=>Math.random()-.5);
    const wild2=n>=8;
    room.players=room.players.map(p=>{
      const si=shuffled.findIndex(s=>s.id===p.id);
      let role=R.HERO;
      if(twoPlayerTraitor){
        role=si===0?R.TRAITOR:R.HERO;
      } else if(!coop){
        role=si===0?R.TRAITOR:(n>=6&&si===1)?R.WILD:(wild2&&si===2)?R.WILD:R.HERO;
      }
      return{...p,role,blueShell:false};
    });
    room.coop=coop;
    room.dm={name:dm.name.trim()||"The Chronicler",personality:dm.personality.trim()||"a dramatic and unpredictable storyteller",style:dm.style};
    room.world={setting:world.setting.trim()||"a crumbling city on the edge of ruin",tone:world.tone,incident:world.incident.trim()||"A dying stranger collapsed in the tavern doorway clutching a cryptic map.",stakes:world.stakes.trim()||"The city burns if the party fails."};
    room.phase="game";room.reputation=makeRep();
    await save(roomCode,room);onDone(room);
  };

  return (
    <div className="s-screenIn" style={{minHeight:"100vh",background:C.bg,padding:"24px 20px"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <Eyebrow c>Step 3 of 3 — Host Only</Eyebrow>
          <h2 style={{fontFamily:"Georgia,serif",color:C.gold,fontSize:26}}>Forge the World</h2>
          <div style={{color:C.dim,fontSize:13,marginTop:5}}>Set the DM personality and the world. Use Conjure to auto-generate, or write your own.</div>
        </div>

        <div style={{display:"flex",background:C.surface,borderRadius:9,padding:3,border:`1px solid ${C.border}`,marginBottom:16}}>
          {["dm","world"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",borderRadius:7,border:"none",background:tab===t?C.gold:"transparent",color:tab===t?C.ink:C.creamDim,fontWeight:"bold",fontSize:13,cursor:"pointer",transition:"background .2s,color .2s"}}>{t==="dm"?"1. The DM":"2. The World"}</button>)}
        </div>

        <Card>
          {tab==="dm"&&(
            <div className="s-fadeIn">
              <InfoBox icon="🎭">The DM's personality shapes every line of narration. A "tired bureaucrat" describes your dragon fight like filing a complaint form. Be creative — the AI takes it seriously.</InfoBox>
              <AIBanner label="Generate a DM personality" sub={dm.name?"Expand on your DM":"Create a random memorable DM"} onFill={async()=>{setFdm(true);const res=await fillDM(dm.name?`Name:"${dm.name}"`:"");if(res){if(!dm.name.trim()&&res.name){setDm(p=>({...p,name:res.name}));setAiDm(p=>({...p,name:true}));}if(!dm.personality.trim()&&res.personality){setDm(p=>({...p,personality:res.personality}));setAiDm(p=>({...p,personality:true}));}}setFdm(false);}} busy={fdm}/>
              <div style={{position:"relative"}}><AiTag show={aiDm.name}/><Field label="DM Name" value={dm.name} onChange={d("name")} placeholder="e.g. Baron Ashwick, The Chronicler, Dave" aiTag={aiDm.name}/></div>
              <div style={{position:"relative"}}><AiTag show={aiDm.personality}/><Field label="DM Personality" value={dm.personality} onChange={d("personality")} placeholder='"a tired bureaucrat who narrates everything like a complaint form"' multi hint="Every line of narration is filtered through this lens." aiTag={aiDm.personality}/></div>
              <div style={{marginBottom:14}}><label style={{color:C.gold,fontSize:10,letterSpacing:1.5,textTransform:"uppercase"}}>Narrative Style</label><Pills opts={STYLES} val={dm.style} set={v=>setDm(p=>({...p,style:v}))}/></div>
              <Btn full onClick={()=>setTab("world")}>Next: Build the World →</Btn>
            </div>
          )}
          {tab==="world"&&(
            <div className="s-fadeIn">
              <InfoBox icon="🌍">The world sets the backdrop for the whole adventure. Be specific and creative — the DM will build the entire story around what you write here.</InfoBox>
              <AIBanner label="Generate a world" sub={world.setting?"Fill in missing details":"Build a complete world from scratch"} onFill={async()=>{setFw(true);const res=await fillWorld(world.setting?`Setting:"${world.setting}"`:"");if(res){const n={...world},t={};if(!world.setting.trim()&&res.setting){n.setting=res.setting;t.setting=true;}if(!world.incident.trim()&&res.incident){n.incident=res.incident;t.incident=true;}if(!world.stakes.trim()&&res.stakes){n.stakes=res.stakes;t.stakes=true;}setWorld(n);setAiW(t);}setFw(false);}} busy={fw}/>
              <div style={{position:"relative"}}><AiTag show={aiW.setting}/><Field label="The Setting" value={world.setting} onChange={w("setting")} placeholder='"A city built on the back of a sleeping giant"' multi hint="Where does this adventure take place?" aiTag={aiW.setting}/></div>
              <div style={{marginBottom:14}}><label style={{color:C.gold,fontSize:10,letterSpacing:1.5,textTransform:"uppercase"}}>Tone</label><Pills opts={TONES} val={world.tone} set={v=>setWorld(p=>({...p,tone:v}))}/></div>
              <div style={{position:"relative"}}><AiTag show={aiW.incident}/><Field label="The Inciting Incident" value={world.incident} onChange={w("incident")} placeholder="What just happened that started all this?" multi aiTag={aiW.incident}/></div>
              <div style={{position:"relative"}}><AiTag show={aiW.stakes}/><Field label="The Stakes" value={world.stakes} onChange={w("stakes")} placeholder='"Dave does the dishes if we fail"' hint="What happens if the party loses?" aiTag={aiW.stakes}/></div>
              <Btn full onClick={begin} loading={saving}>🎲 Begin the Adventure →</Btn>
              <div style={{color:C.dim,fontSize:11,textAlign:"center",marginTop:8}}>Roles (Hero · Traitor · Wild Card) are secretly assigned when you click Begin</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  GAME SCREEN
// ═══════════════════════════════════════════════════════════
function GameScreen({roomCode,playerId,isHost,initialRoom}) {
  const [room,setRoom]=useState(initialRoom);
  const [phase,setPhase]=useState("role_reveal");
  const [beat,setBeat]=useState(null);
  const [myVote,setMyVote]=useState(null);
  const [allVotes,setAllVotes]=useState({});
  const [busy,setBusy]=useState(false);
  const [resolution,setResolution]=useState(null);
  const [whisper,setWhisper]=useState(null);
  const [showW,setShowW]=useState(false);
  const [seenW,setSeenW]=useState(null);
  const [tribunal,setTribunal]=useState(false);
  const [myTrib,setMyTrib]=useState(null);
  const [tribVotes,setTribVotes]=useState({});
  const [tribResult,setTribResult]=useState(null);
  const [beatKey,setBeatKey]=useState(0);
  const [showDice,setShowDice]=useState(false);
  const [myBet,setMyBet]=useState(null);
  const [allBets,setAllBets]=useState({});
  const [crisis,setCrisis]=useState(null);
  const [crisisResult,setCrisisResult]=useState(null);
  const [showRep,setShowRep]=useState(false);
  const [playedFate,setPlayedFate]=useState(null);
  const [showHelp,setShowHelp]=useState(false);

  const me = room?.players?.find(p=>p.id===playerId);
  const alive = room?.players?.filter(p=>p.deathState===DS.ALIVE)||[];
  const rep = room?.reputation||makeRep();

  // POLL
  useEffect(()=>{
    if(phase==="role_reveal")return;
    const poll=async()=>{
      const r=await load(roomCode);if(!r)return;
      setRoom(r);
      const w=r.privateMessages?.[playerId];
      if(w&&w!==seenW){setWhisper(w);setShowW(true);setSeenW(w);}
      if(r.tribunalActive&&!tribunal){setTribunal(true);setTribVotes(r.tribunalVotes||{});}
      if(!r.tribunalActive&&tribunal){setTribunal(false);if(r.tribunalResult)setTribResult(r.tribunalResult);}
      if(r.tribunalVotes)setTribVotes(r.tribunalVotes);
      if(r.crisisActive&&!crisis)setCrisis(r.crisisEvent);
      if(!r.crisisActive&&crisis)setCrisis(null);
      if(r.crisisResult&&!crisisResult)setCrisisResult(r.crisisResult);
      if(r.bets)setAllBets(r.bets);
      const nid=r.currentBeat?.id;
      if(nid&&nid!==beat?.id){
        setBeat(r.currentBeat);setMyVote(null);setAllVotes(r.votes||{});
        setResolution(null);setShowDice(false);setMyBet(null);
        setBeatKey(k=>k+1);setPhase(r.beatPhase||"debate");
      } else if(r.beatPhase==="resolution"&&phase!=="resolution"){
        setPhase("resolution");setAllVotes(r.votes||{});
        setResolution(r.lastResolution||null);setShowDice(true);
      } else if(r.beatPhase==="epilogue"&&phase!=="epilogue"){
        setBeat(r.currentBeat);setPhase("epilogue");
      }
      if(r.votes)setAllVotes(r.votes);
    };
    const t=setInterval(poll,POLL_MS);return()=>clearInterval(t);
  },[phase,roomCode,beat?.id,tribunal,crisis,seenW,crisisResult,playerId]);

  // START
  const startAdventure=async()=>{
    setPhase("loading");
    const r=await load(roomCode);
    const ctx="BEGIN THE ADVENTURE. Set a vivid opening scene. Beat 1.";
    const b=await callDM(r,[],ctx);
    b.id=uid();
    const history=[{role:"user",content:ctx},{role:"assistant",content:JSON.stringify(b)}];
    const ws=await getWhispers({...r,currentBeat:b});
    const pm={};ws.forEach(w=>{if(w.playerId)pm[w.playerId]=w.message;});
    r.currentBeat=b;r.beatPhase="debate";r.votes={};r.history=history;r.beatCount=1;r.privateMessages=pm;r.bets={};
    await save(roomCode,r);
    setRoom(r);setBeat(b);
    if(pm[playerId]){setWhisper(pm[playerId]);setShowW(true);setSeenW(pm[playerId]);}
    setBeatKey(k=>k+1);setPhase("debate");
  };

  const vote=async id=>{
    if(myVote)return;
    setMyVote(id);
    const r=await load(roomCode);
    r.votes={...r.votes,[playerId]:id};
    await save(roomCode,r);setAllVotes(r.votes);
  };

  const placeBet=async amount=>{
    setMyBet(amount);
    const r=await load(roomCode);
    r.bets={...r.bets,[playerId]:amount};
    await save(roomCode,r);setAllBets(r.bets);
  };

  const playFate=async card=>{
    if(!me?.fateCards?.includes(card)||playedFate)return;
    setPlayedFate(card);
    const r=await load(roomCode);
    r.players=r.players.map(p=>p.id===playerId?{...p,fateCards:p.fateCards.filter(c=>c!==card)}:p);
    if(card==="plot_twist")r.fateCardEffect={card,playerId,name:me.name};
    await save(roomCode,r);setRoom(r);
  };

  const resolve=async()=>{
    setBusy(true);
    const r=await load(roomCode);
    const votes=r.votes||{};const bets=r.bets||{};
    const tally={};Object.values(votes).forEach(v=>{tally[v]=(tally[v]||0)+1;});
    const sortedTally=Object.entries(tally).sort((a,b)=>b[1]-a[1]);
    const topCount=sortedTally[0]?.[1]||0;
    const tied=sortedTally.filter(([,c])=>c===topCount).map(([id])=>id);
    const roll=d20();const t=getTier(roll);
    // Tie-break: when votes are split evenly, the dice decides which tied option wins.
    const winId = tied.length>1 ? tied[roll%tied.length] : (sortedTally[0]?.[0]||"a");
    const winner=beat.choices.find(c=>c.id===winId);
    const wasTie=tied.length>1;
    const fate=r.fateCardEffect;
    const isLate=r.beatCount>=7;
    const ctx=`Chose:"${winner?.text}". Roll:${roll}(${t.label}).${wasTie?" (Vote was tied — the dice chose this path.)":""} Votes:${JSON.stringify(tally)}. Beat:${r.beatCount}.${fate?` FATE CARD by ${fate.name}: plot_twist — add unexpected dramatic twist NOW.`:""}${isLate?" ESCALATE. isEpilogue=true if beat>=9.":""}`;
    const history=r.history||[];
    const nextBeat=await callDM(r,history,ctx);
    nextBeat.id=uid();

    let pm={...r.privateMessages};
    if(r.beatCount%3===0){const ws=await getWhispers({...r,currentBeat:nextBeat});ws.forEach(w=>{if(w.playerId)pm[w.playerId]=w.message;});}

    const rep=r.reputation||makeRep();
    const shift=nextBeat.repShift||{};
    const newRep={heroic:clamp((rep.heroic||0)+(shift.heroic||0),-10,10),reckless:clamp((rep.reckless||0)+(shift.reckless||0),-10,10),unified:clamp((rep.unified||0)+(shift.unified||0),-10,10),generous:clamp((rep.generous||0)+(shift.generous||0),-10,10)};

    const updated=r.players.map(p=>{
      let{hp,drinkCount,deathState}=p;
      const voted=votes[p.id];const bet=bets[p.id];
      if(voted&&voted!==winId)drinkCount++;
      if(t.drinks>0){drinkCount+=t.drinks;hp=Math.max(0,hp+t.hp);}
      if(t.hp>0)hp=Math.min(10,hp+t.hp);
      if(bet){const won=voted===winId;if(!won)drinkCount+=bet;}
      if(hp<=0&&deathState===DS.ALIVE)deathState=DS.GHOST;
      else if(hp<=0&&deathState===DS.GHOST)deathState=DS.RELIC;
      else if(hp<=0&&deathState===DS.RELIC)deathState=DS.AGENT;
      return{...p,hp:Math.max(0,hp),drinkCount,deathState};
    });
    const alv=updated.filter(p=>p.deathState===DS.ALIVE);
    if(alv.length){const low=alv.reduce((a,b)=>a.hp<b.hp?a:b);updated.forEach(p=>{p.blueShell=p.id===low.id;});}

    const CRISES=["The bridge is collapsing — everyone scrambles!","Guards burst in — you have moments to explain yourselves!","Someone in the party is poisoned right now!","The building is on fire — what do you do?","A powerful enemy blocks all exits — negotiate or fight?"];
    const fireCrisis=r.beatCount%4===0&&r.beatCount>1&&!nextBeat.isEpilogue;

    r.currentBeat=nextBeat;r.beatPhase=nextBeat.isEpilogue?"epilogue":"debate";
    r.votes={};r.bets={};r.history=[...history,{role:"user",content:ctx},{role:"assistant",content:JSON.stringify(nextBeat)}];
    r.beatCount=(r.beatCount||1)+1;r.lastDiceResult=roll;
    r.lastResolution={winner,tier:t,roll,drinkRule:beat.drinkRule,wasTie};
    r.players=updated;r.privateMessages=pm;r.reputation=newRep;r.fateCardEffect=null;
    r.crisisActive=fireCrisis;r.crisisEvent=fireCrisis?CRISES[Math.floor(Math.random()*CRISES.length)]:null;r.crisisResult=null;

    await save(roomCode,r);
    setRoom(r);setBusy(false);
    setResolution(r.lastResolution);
    if(pm[playerId]&&pm[playerId]!==seenW){setWhisper(pm[playerId]);setShowW(true);setSeenW(pm[playerId]);}
    setShowDice(true);setPhase("resolution");
  };

  const resolveCrisis=async sol=>{
    const r=await load(roomCode);
    const result=await judgeCrisis(r.crisisEvent,sol);
    r.players=r.players.map(p=>({...p,drinkCount:p.drinkCount+(result.drinks||0)}));
    r.crisisActive=false;r.crisisResult=result;
    await save(roomCode,r);setRoom(r);setCrisis(null);setCrisisResult(result);
  };

  const startTrib=async()=>{const r=await load(roomCode);r.tribunalActive=true;r.tribunalVotes={};r.tribunalResult=null;await save(roomCode,r);setTribunal(true);setTribVotes({});};
  const castTrib=async tid=>{if(myTrib)return;setMyTrib(tid);const r=await load(roomCode);r.tribunalVotes={...r.tribunalVotes,[playerId]:tid};await save(roomCode,r);setTribVotes(r.tribunalVotes);};
  const resolveTrib=async()=>{
    const r=await load(roomCode);const tv=r.tribunalVotes||{};const tally={};
    Object.values(tv).forEach(v=>{tally[v]=(tally[v]||0)+1;});
    const exId=Object.entries(tally).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const exiled=r.players.find(p=>p.id===exId);const wasTraitor=exiled?.role===R.TRAITOR;
    r.players=r.players.map(p=>{
      if(p.id===exId)return{...p,deathState:DS.GHOST,drinkCount:p.drinkCount+(wasTraitor?5:0)};
      if(!wasTraitor)return{...p,drinkCount:p.drinkCount+3};
      return p;
    });
    r.tribunalActive=false;r.tribunalResult={exiled:exiled?.name,wasTraitor};r.tribunalUsed=true;
    await save(roomCode,r);setRoom(r);setTribunal(false);setTribResult(r.tribunalResult);
  };

  const afterResolution=()=>{
    setShowDice(false);setResolution(null);setMyVote(null);setAllVotes({});setMyBet(null);setPlayedFate(null);
    setBeatKey(k=>k+1);
    setPhase(room.beatPhase==="epilogue"?"epilogue":"debate");
    setBeat(room.currentBeat);
  };

  // HELP TEXT per phase
  const HELP={
    debate:{title:"💬 Debate Phase",body:"The DM has set the scene. Read it aloud so everyone hears. Argue your case for each choice — you have 60 seconds. The timer ends debate automatically."},
    vote:{title:"🗳 Voting Phase",body:"Secretly tap your choice. You can also place a sip bet — win the bet by voting with the majority. Minority voters drink 1 sip. The host clicks Resolve when ready."},
    resolution:{title:"📜 Resolution",body:"The dice roll modifies the outcome. A 1–10 means bad news and extra drinks. 11–19 is success. A 20 means you give out sips. The DM narrates what happens, then the next scene begins."},
  };
  const helpInfo = HELP[phase];

  // ══ ROLE REVEAL ══
  if(phase==="role_reveal"){
    const coop=room.coop;
    const roleDesc={
      hero:{title:coop?"You are Heroes":"You are a Hero",desc:coop?"It's just the two of you against the story. No traitors, no betrayal — work together, make smart choices, and survive whatever the DM throws at you.":"Your job: help the party succeed. Work together, make good choices, and watch out for the Traitor hiding among you.",color:C.greenHi,bg:C.greenFaint,icon:"⚔️"},
      traitor:{title:"You are the Traitor",desc:"Your job: make the quest fail. Vote against the party when you can, subtly redirect choices toward disaster — but don't get caught. If they Tribunal you correctly, you lose.",color:C.redHi,bg:C.redFaint,icon:"🗡️"},
      wildcard:{title:"You are a Wild Card",desc:"You play for yourself. Your win condition: have the most total sips given out by game end. You can help or hinder — whatever serves you.",color:C.gold,bg:C.goldFaint,icon:"🃏"},
    };
    const rd = roleDesc[me?.role||"hero"];

    return (
      <div className="s-screenIn" style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{maxWidth:400,width:"100%",textAlign:"center"}}>
          <div style={{color:C.goldDim,fontSize:10,letterSpacing:3.5,textTransform:"uppercase",marginBottom:14}}>{coop?"Co-op Mode — Two Heroes":"Your Secret Role — Only You Can See This"}</div>
          <div className="s-popIn d1">
            <Card glow>
              <div style={{fontSize:54,marginBottom:14}}>{rd.icon}</div>
              <RoleBadge role={me?.role||"hero"}/>
              <div style={{color:rd.color,fontSize:17,fontWeight:"bold",marginTop:14,marginBottom:6}}>{rd.title}</div>
              <p style={{color:C.cream,fontSize:14,lineHeight:1.75}}>{rd.desc}</p>
              <div style={{background:rd.bg,border:`1px solid ${rd.color}44`,borderRadius:8,padding:"10px 12px",marginTop:14}}>
                <div style={{color:rd.color,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>Your Fate Cards</div>
                <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                  {["🎲 Reroll","📜 Plot Twist","↩ Redirect"].map(c=>(
                    <span key={c} style={{background:`${rd.color}22`,border:`1px solid ${rd.color}44`,borderRadius:20,padding:"3px 10px",fontSize:11,color:rd.color}}>{c}</span>
                  ))}
                </div>
                <div style={{color:C.dim,fontSize:11,marginTop:6}}>Single-use during debate. Reroll: roll again. Plot Twist: force a story twist. Redirect: send drinks back.</div>
              </div>
            </Card>
          </div>
          <div style={{marginTop:18}}>
            <Btn full onClick={()=>{setPhase("loading");if(isHost)startAdventure();}}>{isHost?"I Understand My Role — Begin the Adventure →":"I Understand My Role — Ready"}</Btn>
            {!isHost&&<div style={{color:C.dim,fontSize:12,marginTop:7}}>Waiting for host to start the adventure...</div>}
          </div>
        </div>
      </div>
    );
  }

  // LOADING
  if(phase==="loading") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div className="s-fadeIn" style={{color:C.gold,fontSize:22,fontFamily:"Georgia,serif",animation:"flicker 2s ease infinite"}}>{isHost?"Summoning the DM...":"Waiting for the adventure..."}</div>
      <div style={{color:C.dim,fontSize:12}}>🎲 Consulting the ancient scrolls...</div>
    </div>
  );

  // EPILOGUE
  if(phase==="epilogue"&&beat){
    return (
      <div className="s-screenIn" style={{minHeight:"100vh",background:C.bg,padding:"24px 20px 48px"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div className="s-fadeUp" style={{textAlign:"center",marginBottom:24}}><Eyebrow c>The End</Eyebrow><h2 style={{fontFamily:"Georgia,serif",color:C.gold,fontSize:30}}>Epilogue</h2></div>
          <div className="s-slideUp d1"><Card glow style={{marginBottom:18}}><div style={{color:C.goldDim,fontSize:10,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{room.dm?.name} narrates...</div><p style={{color:C.cream,fontSize:15,lineHeight:1.85,fontStyle:"italic"}}>{beat.narration}</p></Card></div>
          {beat.hiddenThread&&(
            <div className="s-slideUp d2"><div style={{background:`${C.purple}33`,border:`1px solid ${C.purpleHi}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
              <div style={{color:C.purpleHi,fontSize:10,letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>🔮 Hidden Thread Revealed</div>
              <p style={{color:C.cream,fontSize:14,fontStyle:"italic"}}>{beat.hiddenThread}</p>
            </div></div>
          )}
          <div className="s-slideUp d2"><Card style={{marginBottom:16}}>
            <div style={{color:C.gold,fontSize:10,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>📊 Final Reputation</div>
            <RepBar label="Heroic" val={rep.heroic}/><RepBar label="Reckless" val={rep.reckless}/><RepBar label="Unified" val={rep.unified}/><RepBar label="Generous" val={rep.generous}/>
          </Card></div>
          {!room.coop&&<div className="s-slideUp d3"><Card style={{marginBottom:16}}>
            <div style={{color:C.gold,fontSize:10,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🎭 Roles Revealed</div>
            {room.players.map((p,i)=>{
              const rc=p.role===R.TRAITOR?C.redHi:p.role===R.WILD?C.gold:C.greenHi;
              const ri=p.role===R.TRAITOR?"🗡️ TRAITOR":p.role===R.WILD?"🃏 WILD CARD":"⚔️ Hero";
              return(
                <div key={p.id} className={`s-slideIn d${Math.min(i+1,6)}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<room.players.length-1?`1px solid ${C.border}`:"none"}}>
                  <div><span style={{color:C.cream,fontWeight:"bold"}}>{p.name}</span><span style={{color:C.dim,fontSize:11,marginLeft:6}}>{p.class}</span></div>
                  <span style={{color:rc,fontSize:12,fontWeight:"bold"}}>{ri}</span>
                </div>
              );
            })}
          </Card></div>}
          <div className="s-slideUp d4">
            <div style={{color:C.creamDim,fontSize:10,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>🏆 Final Standings</div>
            {[...room.players].sort((a,b)=>b.drinkCount-a.drinkCount).map((p,i)=>(
              <div key={p.id} className={`s-slideIn lift d${Math.min(i+1,6)}`} style={{background:C.surface,border:`1px solid ${i===0?C.gold:C.border}`,borderRadius:9,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:10}}>
                  <span style={{color:C.goldDim,fontSize:13,width:18}}>{i+1}.</span>
                  <div><div style={{color:C.cream,fontWeight:"bold"}}>{p.name}</div><div style={{color:C.dim,fontSize:11}}>{p.class}</div></div>
                </div>
                <div style={{display:"flex",gap:10}}><span style={{color:C.redHi,fontSize:13}}>❤ {p.hp}</span><span style={{color:C.gold,fontSize:13,fontWeight:"bold"}}>🍺 {p.drinkCount}</span></div>
              </div>
            ))}
          </div>
          <div className="s-fadeIn d5" style={{textAlign:"center",color:C.dim,fontSize:13,marginTop:20}}>Thanks for playing Tavern Tales 🍺</div>
        </div>
      </div>
    );
  }

  const voteCount=Object.keys(allVotes).length;
  const aliveCount=alive.length;

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>

      {/* CRISIS — host sees input, others see waiting */}
      {crisis&&isHost&&(
        <div className="s-fadeIn" style={{position:"fixed",inset:0,background:"#000000e0",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <CrisisPanel crisis={crisis} onResolve={resolveCrisis}/>
        </div>
      )}
      {crisis&&!isHost&&(
        <div className="s-fadeIn" style={{position:"fixed",inset:0,background:"#000000cc",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{maxWidth:380,width:"100%",background:C.surface,border:`2px solid ${C.redHi}`,borderRadius:14,padding:24,textAlign:"center",animation:"overlayIn .4s cubic-bezier(.34,1.56,.64,1) both"}}>
            <div style={{fontSize:34,animation:"pulse .6s ease infinite"}}>⚡</div>
            <div style={{color:C.redHi,fontSize:20,fontWeight:"bold",margin:"10px 0"}}>CRISIS EVENT</div>
            <div style={{color:C.cream,fontSize:14,lineHeight:1.6,marginBottom:10}}>{crisis}</div>
            <div style={{color:C.dim,fontSize:12}}>The host is submitting the party's solution...</div>
          </div>
        </div>
      )}

      {/* CRISIS RESULT */}
      {crisisResult&&(
        <div className="s-fadeIn" style={{position:"fixed",inset:0,background:"#000000cc",zIndex:290,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{maxWidth:380,width:"100%",background:C.surface,border:`2px solid ${crisisResult.score==="brilliant"?C.gold:crisisResult.score==="decent"?C.greenHi:C.redHi}`,borderRadius:14,padding:26,textAlign:"center",animation:"popIn .4s cubic-bezier(.34,1.56,.64,1) both"}}>
            <div style={{fontSize:36,marginBottom:8}}>{crisisResult.score==="brilliant"?"🏆":crisisResult.score==="decent"?"✅":"💀"}</div>
            <div style={{color:crisisResult.score==="brilliant"?C.gold:crisisResult.score==="decent"?C.greenHi:C.redHi,fontSize:17,fontWeight:"bold",textTransform:"uppercase",marginBottom:8}}>{crisisResult.score} Solution</div>
            <p style={{color:C.cream,fontSize:13,lineHeight:1.6,marginBottom:12}}>{crisisResult.narration}</p>
            {crisisResult.drinks>0&&<div style={{color:C.redHi,fontSize:13,marginBottom:5}}>🍺 Everyone drinks {crisisResult.drinks} sip{crisisResult.drinks>1?"s":""}</div>}
            {crisisResult.boon&&<div style={{color:C.greenHi,fontSize:13,marginBottom:10}}>🎁 {crisisResult.boon}</div>}
            <Btn onClick={()=>setCrisisResult(null)}>Continue</Btn>
          </div>
        </div>
      )}

      {/* WHISPER */}
      {showW&&whisper&&(
        <div className="s-fadeIn" style={{position:"fixed",inset:0,background:"#000000bb",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{maxWidth:360,width:"100%",background:C.surface,border:`1px solid ${C.goldDim}`,borderRadius:14,padding:26,textAlign:"center",animation:"overlayIn .4s cubic-bezier(.34,1.56,.64,1) both"}}>
            <div style={{color:C.goldDim,fontSize:10,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>The DM Whispers to You Alone...</div>
            <div style={{fontSize:28,marginBottom:10}}>🕯️</div>
            <p style={{color:C.cream,fontSize:15,lineHeight:1.7,fontStyle:"italic",marginBottom:16}}>"{whisper}"</p>
            <Btn onClick={()=>setShowW(false)}>I understand</Btn>
            <div style={{color:C.dim,fontSize:11,marginTop:6}}>Only you can see this message</div>
          </div>
        </div>
      )}

      {/* TRIBUNAL */}
      {tribunal&&(
        <div className="s-fadeIn" style={{position:"fixed",inset:0,background:"#000000cc",zIndex:190,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{maxWidth:400,width:"100%",background:C.surface,border:`2px solid ${C.redHi}`,borderRadius:14,padding:26,animation:"overlayIn .4s cubic-bezier(.34,1.56,.64,1) both"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:30}}>⚖️</div>
              <div style={{color:C.redHi,fontFamily:"Georgia,serif",fontSize:20,marginTop:6}}>Tribunal</div>
              <div style={{color:C.cream,fontSize:13,marginTop:4}}>Vote to exile the suspected Traitor</div>
            </div>
            <InfoBox icon="⚠️" color={C.redHi}>If you exile the right person → they drink 5 sips and become a Ghost. If wrong → party drinks 3 sips each. Choose carefully.</InfoBox>
            {!myTrib?(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {room.players.filter(p=>p.id!==playerId&&p.deathState===DS.ALIVE).map(p=>(
                  <button key={p.id} onClick={()=>castTrib(p.id)} className="lift" style={{background:C.lift,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
                    <span style={{color:C.cream}}>{p.name}</span><span style={{color:C.dim,fontSize:12}}>{p.class}</span>
                  </button>
                ))}
              </div>
            ):<div style={{textAlign:"center",color:C.creamDim,padding:12}}>Vote cast — waiting for others... ({Object.keys(tribVotes).length}/{aliveCount-1})</div>}
            {isHost&&Object.keys(tribVotes).length>=Math.ceil((aliveCount-1)/2)&&(
              <div style={{marginTop:12}}><Btn full danger onClick={resolveTrib}>Deliver Verdict →</Btn></div>
            )}
          </div>
        </div>
      )}

      {/* TRIBUNAL RESULT */}
      {tribResult&&(
        <div className="s-fadeIn" style={{position:"fixed",inset:0,background:"#000000cc",zIndex:195,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{maxWidth:360,width:"100%",background:C.surface,border:`2px solid ${tribResult.wasTraitor?C.greenHi:C.redHi}`,borderRadius:14,padding:26,textAlign:"center",animation:"popIn .4s cubic-bezier(.34,1.56,.64,1) both"}}>
            <div style={{fontSize:38,marginBottom:8}}>{tribResult.wasTraitor?"✅":"❌"}</div>
            <div style={{color:tribResult.wasTraitor?C.greenHi:C.redHi,fontSize:18,fontWeight:"bold",marginBottom:8}}>{tribResult.wasTraitor?"Traitor Caught!":"Wrong Exile!"}</div>
            <p style={{color:C.cream,fontSize:14,marginBottom:14}}>{tribResult.exiled} was {tribResult.wasTraitor?"the Traitor — they drink 5 sips":"innocent — party drinks 3 sips each"}.</p>
            <Btn onClick={()=>setTribResult(null)}>Continue</Btn>
          </div>
        </div>
      )}

      {/* HELP OVERLAY */}
      {showHelp&&helpInfo&&(
        <div className="s-fadeIn" style={{position:"fixed",inset:0,background:"#000000cc",zIndex:180,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowHelp(false)}>
          <div style={{maxWidth:380,width:"100%",background:C.surface,border:`1px solid ${C.blueHi}`,borderRadius:14,padding:22,animation:"overlayIn .4s cubic-bezier(.34,1.56,.64,1) both"}} onClick={e=>e.stopPropagation()}>
            <div style={{color:C.blueHi,fontSize:14,fontWeight:"bold",marginBottom:10}}>{helpInfo.title}</div>
            <p style={{color:C.cream,fontSize:13,lineHeight:1.7,marginBottom:14}}>{helpInfo.body}</p>
            <Btn sm onClick={()=>setShowHelp(false)}>Got it</Btn>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 15px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(8px)"}}>
        <div style={{fontFamily:"Georgia,serif",color:C.gold,fontSize:15,animation:"flicker 8s ease infinite"}}>Tavern Tales</div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
          {whisper&&<button onClick={()=>setShowW(true)} style={{background:`${C.gold}22`,border:`1px solid ${C.goldDim}`,borderRadius:5,padding:"3px 8px",color:C.gold,fontSize:11,cursor:"pointer",animation:"pulse 2s ease infinite"}}>🕯️ Whisper</button>}
          <button onClick={()=>setShowRep(!showRep)} style={{background:`${C.green}22`,border:`1px solid ${C.green}`,borderRadius:5,padding:"3px 8px",color:C.greenHi,fontSize:11,cursor:"pointer"}}>📊 Rep</button>
          {helpInfo&&<button onClick={()=>setShowHelp(true)} style={{background:`${C.blue}22`,border:`1px solid ${C.blue}`,borderRadius:5,padding:"3px 8px",color:C.blueHi,fontSize:11,cursor:"pointer"}}>❓ Help</button>}
          <span style={{color:C.dim,fontSize:10}}>Beat {room.beatCount||1}</span>
          <span style={{background:C.lift,border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 7px",color:C.creamDim,fontSize:10,letterSpacing:2}}>{roomCode}</span>
        </div>
      </div>

      {/* REP PANEL */}
      {showRep&&(
        <div className="s-fadeUp" style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px"}}>
          <div style={{maxWidth:600,margin:"0 auto"}}>
            <div style={{color:C.gold,fontSize:10,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Party Reputation — NPCs react to this</div>
            <RepBar label="Heroic" val={rep.heroic}/><RepBar label="Reckless" val={rep.reckless}/><RepBar label="Unified" val={rep.unified}/><RepBar label="Generous" val={rep.generous}/>
          </div>
        </div>
      )}

      <div style={{maxWidth:600,margin:"0 auto",padding:"14px 15px 48px"}}>

        {/* Phase bar — only during active game phases */}
        {["debate","vote","resolution"].includes(phase)&&<PhaseBar phase={phase}/>}

        {/* Role + Blue Shell row */}
        <div className="s-fadeIn" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
          {me&&<RoleBadge role={me.role}/>}
          {me?.blueShell&&<div style={{background:C.goldFaint,border:`1px solid ${C.gold}`,borderRadius:20,padding:"3px 10px",fontSize:11,color:C.gold,animation:"glow 2s ease infinite"}}>🐚 Blue Shell — play anytime to derail the scene</div>}
        </div>

        {/* Fate cards */}
        {me?.fateCards?.length>0&&phase==="debate"&&(
          <div className="s-fadeIn" style={{marginBottom:10}}>
            <div style={{color:C.dim,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Your Fate Cards (single use)</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {me.fateCards.map(c=>{
                const labels={"reroll":"🎲 Reroll dice","plot_twist":"📜 Plot Twist","redirect":"↩ Redirect drinks"};
                return (
                  <button key={c} onClick={()=>playFate(c)} disabled={!!playedFate} className="pill" style={{background:`${C.purple}33`,border:`1px solid ${playedFate?C.border:C.purpleHi}`,borderRadius:20,padding:"4px 12px",color:playedFate?C.dim:C.purpleHi,fontSize:11,fontWeight:"bold",cursor:playedFate?"not-allowed":"pointer"}}>{labels[c]||c}</button>
                );
              })}
              {playedFate&&<span style={{color:C.purpleHi,fontSize:11,alignSelf:"center"}}>✓ {playedFate} played!</span>}
            </div>
          </div>
        )}

        {/* Party chips */}
        <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
          {room.players.map(p=><Chip key={p.id} p={p} isMe={p.id===playerId}/>)}
        </div>

        {/* Tribunal button */}
        {!room.coop&&!room.tribunalUsed&&!tribunal&&phase==="debate"&&isHost&&(
          <div style={{marginBottom:10}}>
            <button onClick={startTrib} className="lift" style={{width:"100%",background:"transparent",border:`1px solid ${C.red}`,borderRadius:8,padding:"8px 14px",color:C.red,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              ⚖️ Call a Tribunal <span style={{fontSize:10,color:C.dim}}>(1 per game — vote to exile the Traitor)</span>
            </button>
          </div>
        )}

        {/* Story narration */}
        {beat&&(
          <div className="s-slideUp" key={`narr-${beatKey}`}>
            <Card style={{marginBottom:12}}>
              <div style={{color:C.goldDim,fontSize:10,letterSpacing:2.5,textTransform:"uppercase",marginBottom:7}}>{room.dm?.name||"The DM"} narrates...</div>
              <p style={{color:C.cream,fontSize:15,lineHeight:1.82,fontStyle:"italic"}}>{beat.narration}</p>
            </Card>
          </div>
        )}

        {/* Drink rule from current beat */}
        {beat?.drinkRule&&phase==="debate"&&room.beatCount>1&&(
          <div className="s-fadeUp" style={{background:C.redFaint,border:`1px solid ${C.red}`,borderRadius:8,padding:"9px 13px",marginBottom:12,display:"flex",gap:7,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>🍺</span>
            <div><div style={{color:C.redHi,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Drink Now</div><div style={{color:C.cream,fontSize:13}}>{beat.drinkRule}</div></div>
          </div>
        )}

        {/* ── DEBATE ── */}
        {phase==="debate"&&beat&&(
          <div className="s-fadeIn" key={`debate-${beatKey}`}>
            <Timer key={`tim-${beatKey}`} dur={60} onEnd={()=>setPhase("vote")}/>
            <div style={{color:C.creamDim,fontSize:12,textAlign:"center",marginBottom:8}}>Debate your options — the timer advances to voting automatically</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
              {beat.choices.map((c,i)=>(
                <div key={c.id} className={`choice-btn s-slideIn d${i+1}`} style={{background:C.lift,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:C.cream,fontSize:14,flex:1}}>{c.text}</span>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,marginLeft:8,flexShrink:0,background:c.risk==="high"?C.redFaint:c.risk==="low"?C.greenFaint:C.goldFaint,color:c.risk==="high"?C.redHi:c.risk==="low"?C.greenHi:C.gold,border:`1px solid ${c.risk==="high"?C.red:c.risk==="low"?C.green:C.goldDim}`}}>{c.risk} risk</span>
                </div>
              ))}
            </div>
            <Btn full onClick={()=>setPhase("vote")}>Skip Timer — Open Voting →</Btn>
          </div>
        )}

        {/* ── VOTE ── */}
        {phase==="vote"&&beat&&(
          <div className="s-fadeIn">
            {/* Betting panel */}
            <div style={{background:C.lift,border:`1px solid ${C.goldDim}`,borderRadius:9,padding:"10px 13px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div style={{color:C.gold,fontSize:12,fontWeight:"bold"}}>🎰 Place a Bet (optional)</div>
                  <div style={{color:C.dim,fontSize:11,marginTop:1}}>Bet that your vote wins. Win → give out sips. Lose → drink them.</div>
                </div>
                <span style={{color:C.dim,fontSize:11}}>{Object.keys(allBets).length} bet</span>
              </div>
              {!myBet?(
                <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                  {[1,2,3].map(n=>(
                    <button key={n} onClick={()=>placeBet(n)} style={{background:`${C.gold}22`,border:`1px solid ${C.goldDim}`,borderRadius:7,padding:"5px 12px",color:C.gold,fontSize:12,fontWeight:"bold",cursor:"pointer",transition:"all .13s ease"}}>{n} sip{n>1?"s":""}</button>
                  ))}
                </div>
              ):<div style={{color:C.greenHi,fontSize:12}}>✓ You bet {myBet} sip{myBet>1?"s":""}. Vote to find out.</div>}
            </div>

            <div style={{color:C.gold,fontSize:12,textAlign:"center",marginBottom:8}}>
              Tap your choice — {voteCount}/{aliveCount} voted
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
              {beat.choices.map((c,i)=>{
                const voted=myVote===c.id;
                const cnt=Object.values(allVotes).filter(v=>v===c.id).length;
                return(
                  <button key={c.id} onClick={()=>vote(c.id)} disabled={!!myVote} className="choice-btn" style={{background:voted?`${C.gold}33`:C.lift,border:`2px solid ${voted?C.gold:C.border}`,borderRadius:8,padding:"13px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:myVote?"default":"pointer",width:"100%",textAlign:"left"}}>
                    <span style={{color:C.cream,fontSize:14}}>{c.text}</span>
                    <div style={{display:"flex",gap:7,alignItems:"center"}}>
                      {myVote&&cnt>0&&<span style={{color:C.goldDim,fontSize:12}}>×{cnt}</span>}
                      {voted&&<span style={{color:C.gold,fontSize:15}}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {isHost?(
              <div>
                <Btn full onClick={resolve} loading={busy}>Roll the Dice & Resolve →</Btn>
                <div style={{color:C.dim,fontSize:11,textAlign:"center",marginTop:6}}>As host, you decide when everyone has voted</div>
              </div>
            ):<div style={{textAlign:"center",color:C.dim,fontSize:12}}>Waiting for the host to resolve...</div>}
          </div>
        )}

        {/* ── RESOLUTION ── */}
        {phase==="resolution"&&resolution&&(
          <div className="s-fadeIn">
            {showDice&&<Dice key={`dice-${beatKey}`} onDone={()=>{}}/>}
            <div className="s-slideUp d2">
              <div style={{background:C.lift,border:`1px solid ${resolution.tier.col}`,borderRadius:8,padding:14,marginBottom:10,boxShadow:`0 0 20px ${resolution.tier.col}44`}}>
                <div style={{color:resolution.tier.col,fontWeight:"bold",fontSize:15,marginBottom:4}}>{resolution.tier.label} — Rolled {resolution.roll}</div>
                <div style={{color:C.cream,fontSize:13}}>Party chose: <strong>"{resolution.winner?.text}"</strong></div>
                {resolution.wasTie&&<div style={{color:C.creamMid,fontSize:11,marginTop:4,display:"flex",alignItems:"center",gap:5}}><Dice5 size={12} color={C.creamMid}/> Vote was tied — the dice chose this path</div>}
              </div>
            </div>
            <div className="s-slideUp d3" style={{background:C.redFaint,border:`1px solid ${C.red}`,borderRadius:8,padding:"12px 14px",marginBottom:12}}>
              <div style={{color:C.redHi,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>🍺 Drink Up</div>
              <div style={{color:C.cream,fontSize:14,marginBottom:6}}>{resolution.drinkRule}</div>
              {resolution.tier.drinks>0&&<div style={{color:C.redHi,fontSize:12}}>+ {resolution.tier.drinks} extra sip{resolution.tier.drinks>1?"s":""} from the bad roll · {Math.abs(resolution.tier.hp)} HP lost each</div>}
              {resolution.tier.drinks<0&&<div style={{color:C.greenHi,fontSize:12}}>Give out {Math.abs(resolution.tier.drinks)} sips — great roll! · +1 HP</div>}
              <div style={{color:C.dim,fontSize:11,marginTop:4}}>Minority voters: 1 sip each · Losing bets: drink your wagered amount</div>
            </div>
            {/* Bet resolution display */}
            {Object.keys(allBets).length>0&&(
              <div className="s-slideUp d3" style={{background:C.goldFaint,border:`1px solid ${C.goldDim}`,borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                <div style={{color:C.gold,fontSize:11,marginBottom:5}}>🎰 Bet Results</div>
                {room.players.filter(p=>allBets[p.id]).map(p=>{
                  const tally2={};Object.values(allVotes).forEach(v=>{tally2[v]=(tally2[v]||0)+1;});
                  const winId2=Object.entries(tally2).sort((a,b)=>b[1]-a[1])[0]?.[0];
                  const won=allVotes[p.id]===winId2;
                  const amt=allBets[p.id];
                  return <div key={p.id} style={{color:won?C.greenHi:C.redHi,fontSize:12,marginBottom:2}}>{p.name}: {won?`✓ Won — give out ${amt} sip${amt>1?"s":""}`:`✗ Lost — drink ${amt} sip${amt>1?"s":""}`}</div>;
                })}
              </div>
            )}
            <div className="s-slideUp d4">
              {isHost?(
                <Btn full onClick={afterResolution}>Continue the Adventure →</Btn>
              ):<div style={{textAlign:"center",color:C.dim,fontSize:12}}>Waiting for host to continue...</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CRISIS PANEL (separated for cleanliness)
// ═══════════════════════════════════════════════════════════
function CrisisPanel({crisis,onResolve}) {
  const [left,setLeft]=useState(90);
  const [sol,setSol]=useState("");
  const [judging,setJudging]=useState(false);
  const urgent=left<=20;

  useEffect(()=>{
    if(left<=0){onResolve(sol||"the party froze");return;}
    const t=setTimeout(()=>setLeft(l=>l-1),1000);return()=>clearTimeout(t);
  },[left]);

  return (
    <div style={{maxWidth:440,width:"100%",background:C.surface,border:`2px solid ${C.redHi}`,borderRadius:14,padding:24,animation:"overlayIn .4s cubic-bezier(.34,1.56,.64,1) both"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:36,animation:"pulse .6s ease infinite"}}>⚡</div>
        <div style={{color:C.redHi,fontFamily:"Georgia,serif",fontSize:20,marginTop:6,animation:"glowRed 1s ease infinite"}}>CRISIS EVENT</div>
        <div style={{color:C.cream,fontSize:14,marginTop:8,lineHeight:1.65}}>{crisis}</div>
      </div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
        <div style={{fontSize:urgent?38:30,color:urgent?C.redHi:C.gold,fontWeight:"bold",animation:urgent?"timerPulse .4s ease infinite":"none"}}>{left}s</div>
      </div>
      <div style={{height:4,background:C.border,borderRadius:2,marginBottom:12,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(left/90)*100}%`,background:urgent?C.redHi:C.gold,transition:"width 1s linear,background .3s"}}/>
      </div>
      <InfoBox icon="🎯">Type the party's solution. You speak for everyone. The AI judges it. Brilliant solutions = no drinks + give out 5. Poor = everyone drinks 2.</InfoBox>
      <textarea value={sol} onChange={e=>setSol(e.target.value)} placeholder="What does the party do? Describe your solution..." rows={3}
        style={{width:"100%",background:C.lift,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px",color:C.cream,fontSize:13,resize:"none",outline:"none",marginBottom:10}}/>
      <Btn full loading={judging} onClick={async()=>{setJudging(true);await onResolve(sol||"nothing");}}>Submit Solution →</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [screen,setScreen]=useState(S.HOME);
  const [rc,setRc]=useState(null);
  const [pid,setPid]=useState(null);
  const [pname,setPname]=useState(null);
  const [isHost,setIsHost]=useState(false);
  const [room,setRoom]=useState(null);
  const [preRules,setPreRules]=useState(null); // pending nav after rules

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      {screen===S.HOME&&(
        <HomeScreen
          onRules={()=>{ setPreRules(S.HOME); setScreen(S.RULES); }}
          onCreate={(c,h,n)=>{setRc(c);setPid(h);setPname(n);setIsHost(true);setScreen(S.CHAR);}}
          onJoin={(c,p,n)=>{setRc(c);setPid(p);setPname(n);setIsHost(false);setScreen(S.CHAR);}}
        />
      )}
      {screen===S.RULES&&(
        <RulesScreen
          onBack={()=>setScreen(preRules||S.HOME)}
        />
      )}
      {screen===S.CHAR&&<CharScreen roomCode={rc} playerId={pid} playerName={pname} onDone={()=>setScreen(S.LOBBY)}/>}
      {screen===S.LOBBY&&<LobbyScreen roomCode={rc} playerId={pid} isHost={isHost} onBegin={r=>{if(r)setRoom(r);setScreen(isHost?S.DM:S.GAME);}}/>}
      {screen===S.DM&&<DMScreen roomCode={rc} onDone={r=>{setRoom(r);setScreen(S.GAME);}}/>}
      {screen===S.GAME&&room&&<GameScreen roomCode={rc} playerId={pid} isHost={isHost} initialRoom={room}/>}
      {screen===S.GAME&&!room&&(
        <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div className="s-fadeIn" style={{color:C.gold,fontSize:18,fontFamily:"Georgia,serif"}}>Joining the adventure...</div>
        </div>
      )}
    </>
  );
}
