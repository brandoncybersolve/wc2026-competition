import React, { useState, useEffect, useRef } from "react";

// ─── SUPABASE ────────────────────────────────────────────────────
const SB_URL = "https://vxkyfdnyxyeuklslwrqw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a3lmZG55eHlldWtsc2x3cnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODEyNTIsImV4cCI6MjA5NjA1NzI1Mn0.urDGKM1wKcXwjcRL2rGH5J_rPufzBMrJJG9pF51c4hY";
const CHAT_WEBHOOK = "https://chat.googleapis.com/v1/spaces/AAQAsbel9VM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=wuScAAcgGBHYpjNNWax0GDJKIrjo2RVsFYFak1KMTeQ";

const sbHeaders = {
  "apikey": SB_KEY,
  "Authorization": "Bearer " + SB_KEY,
  "Content-Type": "application/json",
};

async function sbGet(table, q = "") {
  try {
    const r = await fetch(SB_URL + "/rest/v1/" + table + (q ? "?" + q : ""), { headers: sbHeaders });
    if (!r.ok) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch(e) { console.warn("sbGet error:", e); return []; }
}
async function sbUpsert(table, data) {
  try {
    await fetch(SB_URL + "/rest/v1/" + table, {
      method: "POST",
      headers: { ...sbHeaders, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data),
    });
  } catch(e) { console.warn("sbUpsert error:", e); }
}
async function sbUpdate(table, q, data) {
  try {
    await fetch(SB_URL + "/rest/v1/" + table + "?" + q, {
      method: "PATCH",
      headers: { ...sbHeaders, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
  } catch(e) { console.warn("sbUpdate error:", e); }
}
async function sbInsert(table, data) {
  try {
    await fetch(SB_URL + "/rest/v1/" + table, {
      method: "POST",
      headers: { ...sbHeaders, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
  } catch(e) { console.warn("sbInsert error:", e); }
}
async function sendChat(text) {
  try {
    await fetch(CHAT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch(e) { console.warn("Chat error:", e); }
}

// ─── CSS FLAGS ───────────────────────────────────────────────────
// Every team ID has an entry. "h"=horizontal stripes, "v"=vertical, "sp"=special
const FLAGS = {
  // Elite 5
  spa: { t:"h", c:["#AA151B","#F1BF00","#AA151B"], w:true },
  fra: { t:"v", c:["#002395","#FFFFFF","#ED2939"] },
  eng: { t:"sp", bg:"#FFFFFF", cross:"#CF142B" },
  bra: { t:"sp", bg:"#009C3B", diamond:"#FFD700" },
  arg: { t:"h", c:["#74ACDF","#FFFFFF","#74ACDF"] },
  // Contenders
  por: { t:"v", c:["#006600","#FF0000","#FF0000"] },
  ger: { t:"h", c:["#000000","#DD0000","#FFCE00"] },
  ned: { t:"h", c:["#AE1C28","#FFFFFF","#21468B"] },
  bel: { t:"v", c:["#1E1E1E","#FAE042","#F31830"] },
  uru: { t:"h", c:["#5EB6E4","#FFFFFF","#5EB6E4"] },
  usa: { t:"h", c:["#B22234","#FFFFFF","#B22234","#FFFFFF","#B22234"] },
  mex: { t:"v", c:["#006847","#FFFFFF","#CE1126"] },
  jpn: { t:"sp", bg:"#FFFFFF", circle:"#BC002D" },
  mor: { t:"sp", bg:"#C1272D", star:"#006233" },
  cro: { t:"h", c:["#FF0000","#FFFFFF","#003DA5"] },
  // Underdogs
  den: { t:"sp", bg:"#C60C30", cross:"#FFFFFF" },
  swi: { t:"sp", bg:"#FF0000", cross:"#FFFFFF", sq:true },
  sen: { t:"v", c:["#00853F","#FDEF42","#E31B23"] },
  aus: { t:"sp", bg:"#012169", solid:true },
  pol: { t:"h", c:["#FFFFFF","#DC143C"] },
  cam: { t:"v", c:["#007A5E","#CE1126","#FCD116"] },
  ksa: { t:"sp", bg:"#006C35", solid:true },
  kor: { t:"sp", bg:"#FFFFFF", circle:"#CD2E3A" },
  gha: { t:"h", c:["#006B3F","#FCD116","#EF3340"] },
  ser: { t:"h", c:["#C6363C","#0C4076","#FFFFFF"] },
  wal: { t:"h", c:["#FFFFFF","#FFFFFF","#00AB39"] },
  cos: { t:"h", c:["#002B7F","#FFFFFF","#CF142B","#FFFFFF","#002B7F"] },
  tun: { t:"sp", bg:"#E70013", circle:"#FFFFFF" },
  ecu: { t:"h", c:["#FFD100","#034EA2","#EF3340"] },
  qat: { t:"v", c:["#8D1B3D","#FFFFFF"] },
  can: { t:"v", c:["#FF0000","#FFFFFF","#FF0000"] },
  ira: { t:"h", c:["#239F40","#FFFFFF","#DA0000"] },
  // Extra 2026 teams
  rsa: { t:"h", c:["#007A4D","#FFB612","#007A4D"] },
  cze: { t:"h", c:["#FFFFFF","#D7141A","#D7141A"] },
  bih: { t:"sp", bg:"#003DA5", solid:true },
  par: { t:"h", c:["#D52B1E","#FFFFFF","#0038A8"] },
  hai: { t:"h", c:["#00209F","#009E49"] },
  sco: { t:"sp", bg:"#003594", cross:"#FFFFFF" },
  tur: { t:"sp", bg:"#E30A17", circle:"#FFFFFF" },
  cur: { t:"h", c:["#002B7F","#FFFFFF","#F9E814"] },
  civ: { t:"v", c:["#F77F00","#FFFFFF","#009A44"] },
  cpv: { t:"h", c:["#003893","#FFFFFF","#CF2027"] },
  egy: { t:"h", c:["#CE1126","#FFFFFF","#000000"] },
  nzl: { t:"sp", bg:"#003DA5", solid:true },
  nor: { t:"sp", bg:"#EF2B2D", cross:"#FFFFFF" },
  aut: { t:"h", c:["#ED2939","#FFFFFF","#ED2939"] },
  alg: { t:"h", c:["#006233","#FFFFFF","#006233"] },
  jor: { t:"h", c:["#007A3D","#FFFFFF","#CE1126"] },
  uzb: { t:"h", c:["#1EB53A","#FFFFFF","#CE1126"] },
  col: { t:"h", c:["#FCD116","#003087","#CE1126"] },
  pan: { t:"h", c:["#FFFFFF","#DA121A","#003893"] },
  tbd: { t:"solid", c:"#9E9E9E" },
};

function Flag({ code, size = 32, style: sx = {} }) {
  const f = FLAGS[code];
  const w = Math.round(size * 1.5);
  const h = size;
  const br = Math.max(2, Math.round(size * 0.1));
  const base = {
    display: "inline-block", verticalAlign: "middle",
    width: w, height: h, borderRadius: br,
    overflow: "hidden", flexShrink: 0,
    border: "1px solid rgba(0,0,0,0.15)",
    position: "relative", ...sx,
  };
  if (!f) {
    return (
      <div style={{ ...base, background: "#9E9E9E", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: h * 0.38, fontWeight: 900, fontFamily: "sans-serif" }}>
          {(code || "?").toUpperCase().slice(0, 3)}
        </span>
      </div>
    );
  }
  if (f.t === "solid") return <div style={{ ...base, background: f.c }} />;
  if (f.t === "h") {
    const n = f.c.length;
    const strH = f.w ? null : Math.round(h / n);
    const tops = f.w ? [0, Math.round(h * 0.25), Math.round(h * 0.75)] : f.c.map((_, i) => i * strH);
    const heights = f.w ? [Math.round(h * 0.25), Math.round(h * 0.5), Math.round(h * 0.25)] : f.c.map((_, i) => i === n - 1 ? h - i * strH : strH);
    return (
      <div style={base}>
        {f.c.map((col, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: tops[i], height: heights[i], background: col }} />
        ))}
      </div>
    );
  }
  if (f.t === "v") {
    const n = f.c.length;
    const sw = Math.round(w / n);
    return (
      <div style={base}>
        {f.c.map((col, i) => (
          <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: i * sw, width: i === n - 1 ? w - i * sw : sw, background: col }} />
        ))}
      </div>
    );
  }
  if (f.t === "sp") {
    const ct = f.sq ? Math.round(w * 0.28) : Math.round(h * 0.24);
    return (
      <div style={{ ...base, background: f.bg }}>
        {f.solid && null}
        {f.diamond && (
          <div style={{ position: "absolute", top: "12%", left: "7%", right: "7%", bottom: "12%", background: f.diamond, clipPath: "polygon(50% 4%,96% 50%,50% 96%,4% 50%)" }} />
        )}
        {f.cross && (
          <React.Fragment>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: ct, transform: "translateX(-50%)", background: f.cross }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: ct, transform: "translateY(-50%)", background: f.cross }} />
          </React.Fragment>
        )}
        {f.circle && (
          <div style={{ position: "absolute", top: "50%", left: "50%", width: Math.round(h * 0.52), height: Math.round(h * 0.52), borderRadius: "50%", background: f.circle, transform: "translate(-50%,-50%)" }} />
        )}
        {f.star && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: Math.round(h * 0.5), lineHeight: 1, color: f.star, fontFamily: "serif" }}>★</div>
        )}
      </div>
    );
  }
  return <div style={{ ...base, background: "#ccc" }} />;
}

// ─── AVATAR ──────────────────────────────────────────────────────
const AVATAR_COLORS = {
  Brandon: "#FF6B35", Cherine: "#E91E8C",
  Anneli: "#00BFA5", Jordan: "#7C4DFF", Ruann: "#FFB300",
};

// Base64 photos embedded directly
const PHOTOS = {};

function Avatar({ name, size = 42 }) {
  const photo = PHOTOS[name];
  const color = AVATAR_COLORS[name] || "#607D8B";
  if (photo) {
    return (
      <img src={photo} alt={name} width={size} height={size}
        style={{ borderRadius: "50%", objectFit: "cover", objectPosition: "top center", display: "block", flexShrink: 0, border: "2.5px solid white", boxShadow: "0 3px 10px rgba(0,0,0,0.2)" }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--fd)", fontSize: size * 0.42, fontWeight: 900,
      flexShrink: 0, boxShadow: "0 3px 12px " + color + "66", userSelect: "none",
    }}>
      {name ? name[0] : "?"}
    </div>
  );
}

// ─── TEAMS DATA ──────────────────────────────────────────────────
const ELITE_IDS = ["spa", "fra", "eng", "bra", "arg"];
const TEAMS = [
  { id:"spa", name:"Spain",        rank:1  }, { id:"fra", name:"France",       rank:2  },
  { id:"eng", name:"England",      rank:3  }, { id:"bra", name:"Brazil",       rank:4  },
  { id:"arg", name:"Argentina",    rank:5  }, { id:"por", name:"Portugal",     rank:6  },
  { id:"ger", name:"Germany",      rank:7  }, { id:"ned", name:"Netherlands",  rank:8  },
  { id:"bel", name:"Belgium",      rank:9  }, { id:"uru", name:"Uruguay",      rank:10 },
  { id:"usa", name:"USA",          rank:11 }, { id:"mex", name:"Mexico",       rank:12 },
  { id:"jpn", name:"Japan",        rank:13 }, { id:"mor", name:"Morocco",      rank:14 },
  { id:"cro", name:"Croatia",      rank:15 }, { id:"den", name:"Denmark",      rank:16 },
  { id:"swi", name:"Switzerland",  rank:17 }, { id:"sen", name:"Senegal",      rank:18 },
  { id:"aus", name:"Australia",    rank:19 }, { id:"pol", name:"Poland",       rank:20 },
  { id:"cam", name:"Cameroon",     rank:21 }, { id:"ksa", name:"Saudi Arabia", rank:22 },
  { id:"kor", name:"South Korea",  rank:23 }, { id:"gha", name:"Ghana",        rank:24 },
  { id:"ser", name:"Serbia",       rank:25 }, { id:"wal", name:"Wales",        rank:26 },
  { id:"cos", name:"Costa Rica",   rank:27 }, { id:"tun", name:"Tunisia",      rank:28 },
  { id:"ecu", name:"Ecuador",      rank:29 }, { id:"qat", name:"Qatar",        rank:30 },
  { id:"can", name:"Canada",       rank:31 }, { id:"ira", name:"Iran",         rank:32 },
  { id:"rsa", name:"South Africa", rank:33 }, { id:"cze", name:"Czechia",      rank:34 },
  { id:"bih", name:"Bosnia",       rank:35 }, { id:"par", name:"Paraguay",     rank:36 },
  { id:"hai", name:"Haiti",        rank:37 }, { id:"sco", name:"Scotland",     rank:38 },
  { id:"tur", name:"Turkiye",      rank:39 }, { id:"cur", name:"Curacao",      rank:40 },
  { id:"civ", name:"Ivory Coast",  rank:41 }, { id:"cpv", name:"Cape Verde",   rank:42 },
  { id:"egy", name:"Egypt",        rank:43 }, { id:"nzl", name:"New Zealand",  rank:44 },
  { id:"nor", name:"Norway",       rank:45 }, { id:"aut", name:"Austria",      rank:46 },
  { id:"alg", name:"Algeria",      rank:47 }, { id:"jor", name:"Jordan",       rank:48 },
  { id:"uzb", name:"Uzbekistan",   rank:49 }, { id:"col", name:"Colombia",     rank:50 },
  { id:"pan", name:"Panama",       rank:51 }, { id:"tbd", name:"TBD",          rank:99 },
];
const getTeam = id => TEAMS.find(t => t.id === id) || { id: id || "tbd", name: (id || "TBD").toUpperCase(), rank: 99 };
const CONTENDERS = TEAMS.filter(t => !ELITE_IDS.includes(t.id) && t.rank >= 6 && t.rank <= 15);
const UNDERDOGS  = TEAMS.filter(t => t.rank >= 16 && t.rank <= 51);
const SLOT_MULT  = { favourite: 3, contender: 2, underdog: 5 };
const STAGE_PTS  = { "Group Stage": 10, "Round of 32": 15, "Round of 16": 25, "Quarter Final": 40, "Semi Final": 60, "Final": 120 };
const PEOPLE     = ["Brandon", "Cherine", "Anneli", "Jordan", "Ruann"];

function buildRandomEliteAssign() {
  const teams = [...ELITE_IDS];
  for (let i = teams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teams[i], teams[j]] = [teams[j], teams[i]];
  }
  const out = {};
  PEOPLE.forEach((p, i) => { out[p] = teams[i]; });
  return out;
}

// ─── TRIVIA DATA ─────────────────────────────────────────────────
const TRIVIA_BANK = {
  1: [
    { q: "Which country has won the most FIFA World Cups?", opts: ["Germany", "Brazil", "Italy", "Argentina"], ans: 1 },
    { q: "How many teams play in the 2026 FIFA World Cup?", opts: ["32", "40", "48", "64"], ans: 2 },
    { q: "Which city hosts the 2026 World Cup Final?", opts: ["Los Angeles", "New York / New Jersey", "Mexico City", "Toronto"], ans: 1 },
    { q: "How long is a standard football match in minutes?", opts: ["80", "90", "100", "120"], ans: 1 },
    { q: "What colour card means a player is sent off?", opts: ["Yellow", "Orange", "Red", "Black"], ans: 2 },
  ],
  2: [
    { q: "Which continent has won the most World Cups?", opts: ["Europe", "South America", "Africa", "Asia"], ans: 0 },
    { q: "How many players are on a football team on the pitch?", opts: ["10", "11", "12", "13"], ans: 1 },
    { q: "What is a hat-trick in football?", opts: ["3 saves", "3 goals", "3 assists", "3 fouls"], ans: 1 },
    { q: "What happens after a draw in knockout football?", opts: ["Coin toss", "Replay", "Penalty shootout", "Extra time first"], ans: 3 },
    { q: "Which country invented association football?", opts: ["Brazil", "Spain", "England", "Italy"], ans: 2 },
  ],
  3: [
    { q: "Who has scored the most goals in World Cup history?", opts: ["Pelé", "Ronaldo", "Miroslav Klose", "Just Fontaine"], ans: 2 },
    { q: "Which player won the 2022 World Cup with Argentina?", opts: ["Ronaldo", "Neymar", "Messi", "Mbappé"], ans: 2 },
    { q: "How many teams qualified from each group in 2022?", opts: ["1", "2", "3", "4"], ans: 1 },
    { q: "The offside rule requires how many defenders between attacker and goal?", opts: ["1", "2", "3", "0"], ans: 0 },
    { q: "Which team won the 2022 FIFA World Cup?", opts: ["France", "Brazil", "Argentina", "England"], ans: 2 },
  ],
  4: [
    { q: "In what year was the first FIFA World Cup held?", opts: ["1924", "1930", "1938", "1950"], ans: 1 },
    { q: "Which country hosted the first World Cup?", opts: ["Brazil", "Italy", "France", "Uruguay"], ans: 3 },
    { q: "How many World Cups has Brazil won?", opts: ["4", "5", "6", "3"], ans: 1 },
    { q: "Which three countries are hosting the 2026 World Cup?", opts: ["USA/Canada/Brazil", "USA/Canada/Mexico", "USA/Mexico/Spain", "Canada/Mexico/Argentina"], ans: 1 },
    { q: "How many total matches are played in the 2026 World Cup?", opts: ["64", "80", "96", "104"], ans: 3 },
  ],
  5: [
    { q: "Which team are the current World Cup champions?", opts: ["France", "Brazil", "Argentina", "England"], ans: 2 },
    { q: "What is the name of the 2026 World Cup Final stadium?", opts: ["MetLife Stadium", "SoFi Stadium", "Wembley", "Maracana"], ans: 0 },
    { q: "How many groups are in the 2026 World Cup group stage?", opts: ["8", "10", "12", "16"], ans: 2 },
    { q: "Which was the first African team to reach a World Cup semi-final?", opts: ["Nigeria", "Senegal", "Morocco", "Cameroon"], ans: 2 },
    { q: "What year did VAR first appear at a World Cup?", opts: ["2014", "2018", "2022", "2026"], ans: 1 },
  ],
};

const LIGHTNING_BANK = {
  1: [
    { s: "A football match has two halves of 45 minutes each", ans: true },
    { s: "A goalkeeper can pick up a ball kicked to them by a teammate", ans: false },
    { s: "Brazil has won the World Cup 5 times", ans: true },
    { s: "The World Cup is held every 4 years", ans: true },
    { s: "A penalty kick is taken from 18 metres", ans: false },
    { s: "Yellow + Yellow card = Red card", ans: true },
    { s: "There are 48 teams in the 2026 World Cup", ans: true },
    { s: "Football was invented in England", ans: true },
    { s: "A match can end 0-0", ans: true },
    { s: "The World Cup trophy is made of solid gold", ans: false },
  ],
  3: [
    { s: "Lionel Messi has won the World Cup", ans: true },
    { s: "A hat-trick means scoring 3 goals in one match", ans: true },
    { s: "The goalkeeper is allowed outside the penalty box", ans: true },
    { s: "Extra time is always 30 minutes total", ans: true },
    { s: "You can score directly from a throw-in", ans: false },
    { s: "France won the 2018 World Cup", ans: true },
    { s: "A corner kick can score directly", ans: true },
    { s: "The crossbar is 2.44 metres from the ground", ans: true },
    { s: "Cristiano Ronaldo has played in 5 World Cups", ans: true },
    { s: "You cannot be offside from a goal kick", ans: true },
  ],
  5: [
    { s: "The 2026 World Cup Final is in New York / New Jersey", ans: true },
    { s: "Argentina are the current World Cup champions", ans: true },
    { s: "The 2026 World Cup has 104 matches", ans: true },
    { s: "Canada has hosted a World Cup before 2026", ans: false },
    { s: "All 3 host nations of 2026 automatically qualified", ans: true },
    { s: "The World Cup trophy can be kept permanently by the winning country", ans: false },
    { s: "The fastest ever World Cup goal was under 30 seconds", ans: true },
    { s: "Penalty shootouts were used in the 2022 World Cup", ans: true },
    { s: "The 2026 World Cup is the biggest ever with 48 teams", ans: true },
    { s: "Morocco reached the semi-finals of the 2022 World Cup", ans: true },
  ],
};

const FLAG_QUIZ_TEAMS = [
  { id: "ger", name: "Germany" }, { id: "jpn", name: "Japan" },
  { id: "mor", name: "Morocco" }, { id: "ned", name: "Netherlands" },
  { id: "sen", name: "Senegal" },
];

const WHEEL_SEGS = [
  { label: "×1.0", color: "#7C4DFF" }, { label: "×1.1", color: "#00BFA5" },
  { label: "×1.2", color: "#FF6B35" }, { label: "×1.0", color: "#E91E8C" },
  { label: "×1.5", color: "#FFD600" }, { label: "×1.1", color: "#7C4DFF" },
  { label: "×1.3", color: "#00BFA5" }, { label: "×1.0", color: "#FF6B35" },
];

const WEEK_SCHEDULE = {
  1: ["trivia", "flags", "spin"],
  2: ["trivia", "lightning", "score"],
  3: ["trivia", "flags", "lightning"],
  4: ["trivia", "score", "spin"],
  5: ["trivia", "lightning", "score"],
};

const CHALLENGE_INFO = {
  trivia:    { icon: "🧠", title: "Trivia Blitz",     desc: "5 questions · 20 pts · ~45 secs",  pts: 20 },
  flags:     { icon: "🌍", title: "Flag Frenzy",      desc: "5 flags · 15 pts · ~30 secs",      pts: 15 },
  spin:      { icon: "🎡", title: "Lucky Spin",       desc: "Spin for a bonus multiplier!",     pts: 0  },
  lightning: { icon: "⚡", title: "Lightning Round",  desc: "10 true/false · 20 pts · 30 secs", pts: 20 },
  score:     { icon: "🎯", title: "Score Predictor",  desc: "Predict exact score · 30 pts",     pts: 30 },
};

function getCurrentWeek() {
  const start = new Date("2026-06-11T00:00:00+02:00");
  const now   = new Date();
  const diff  = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(diff + 1, 1), 5);
}

// ─── STYLES ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Righteous&family=Nunito:wght@400;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --coral:#FF6B35;--teal:#00BFA5;--yellow:#FFD600;--pink:#E91E8C;--purple:#7C4DFF;
  --navy:#1A1B4B;--bg:#F5F6FA;--card:#fff;--border:#E8EAF0;--muted:#8B92B2;
  --sh:0 4px 20px rgba(26,27,75,.08);--sh-lg:0 8px 40px rgba(26,27,75,.14);
  --r:20px;--r-sm:12px;--fd:'Righteous',sans-serif;--fb:'Nunito',sans-serif;
}
body{background:var(--bg);color:var(--navy);font-family:var(--fb);overflow-x:hidden;min-height:100vh}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--coral);border-radius:3px}
.app{display:flex;min-height:100vh}
.sidebar{width:80px;background:var(--navy);display:flex;flex-direction:column;align-items:center;
  padding:18px 0 24px;position:fixed;top:0;left:0;height:100vh;z-index:100}
.sb-logo{font-family:var(--fd);font-size:12px;color:var(--yellow);margin-bottom:24px;text-align:center;line-height:1.5}
.ni{width:54px;height:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;margin-bottom:6px;font-size:22px;transition:all .2s;color:rgba(255,255,255,.4);position:relative}
.ni:hover{background:rgba(255,255,255,.08);color:#fff}
.ni.on{background:var(--coral);color:#fff;box-shadow:0 4px 16px rgba(255,107,53,.45)}
.ni .tip{position:absolute;left:70px;background:var(--navy);color:#fff;padding:6px 14px;
  border-radius:10px;font-size:13px;font-weight:700;white-space:nowrap;opacity:0;
  pointer-events:none;transition:opacity .15s;box-shadow:var(--sh)}
.ni:hover .tip{opacity:1}
.main{margin-left:80px;flex:1;padding:32px 36px;max-width:1140px}
.ptitle{font-family:var(--fd);font-size:36px;color:var(--navy);letter-spacing:1px}
.psub{color:var(--muted);font-size:14px;margin-top:6px;font-weight:600}
.phead{margin-bottom:28px}
.card{background:var(--card);border-radius:var(--r);border:2px solid var(--border);box-shadow:var(--sh);padding:24px;transition:all .2s}
.ctitle{font-family:var(--fd);font-size:18px;color:var(--navy);margin-bottom:4px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.btn{padding:12px 26px;border-radius:var(--r-sm);border:none;cursor:pointer;
  font-family:var(--fb);font-weight:800;font-size:14px;transition:all .2s;
  display:inline-flex;align-items:center;gap:8px}
.btn-coral{background:var(--coral);color:#fff;box-shadow:0 4px 14px rgba(255,107,53,.4)}
.btn-coral:hover{filter:brightness(1.08);transform:translateY(-1px)}
.btn-teal{background:var(--teal);color:#fff}
.btn-teal:hover{filter:brightness(1.08);transform:translateY(-1px)}
.btn-outline{background:transparent;color:var(--navy);border:2px solid var(--border)}
.btn-outline:hover{border-color:var(--coral);color:var(--coral)}
.btn-sm{padding:8px 18px;font-size:13px;border-radius:10px}
.btn:disabled{opacity:.45;pointer-events:none}
.badge{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:30px;font-size:12px;font-weight:800}
.bc{background:rgba(255,107,53,.12);color:var(--coral);border:1.5px solid rgba(255,107,53,.25)}
.bt{background:rgba(0,191,165,.12);color:var(--teal);border:1.5px solid rgba(0,191,165,.25)}
.by{background:rgba(255,214,0,.15);color:#997700;border:1.5px solid rgba(255,214,0,.35)}
.bp{background:rgba(124,77,255,.1);color:var(--purple);border:1.5px solid rgba(124,77,255,.25)}
.bg-g{background:rgba(0,200,83,.1);color:#00A152;border:1.5px solid rgba(0,200,83,.25)}
.bg-r{background:rgba(244,67,54,.1);color:#D32F2F;border:1.5px solid rgba(244,67,54,.25)}
.bm{background:rgba(139,146,178,.1);color:var(--muted);border:1.5px solid var(--border)}
.ptrack{background:var(--border);border-radius:6px;height:8px;overflow:hidden}
.pfill{height:100%;border-radius:6px;transition:width .9s cubic-bezier(.34,1.56,.64,1)}
.lbrow{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:16px;
  transition:all .2s;margin-bottom:8px;background:var(--card);
  box-shadow:0 2px 8px rgba(26,27,75,.05);cursor:pointer;border:2px solid transparent}
.lbrow:hover{border-color:var(--border)}
.lbrow.me{background:linear-gradient(135deg,rgba(255,107,53,.06),rgba(0,191,165,.06));border-color:var(--coral)!important}
.lbrow.top{background:linear-gradient(135deg,rgba(255,214,0,.08),rgba(255,214,0,.02));border-color:rgba(255,214,0,.4)!important}
.tcard{border-radius:var(--r);padding:18px;background:var(--card);border:2px solid var(--border);box-shadow:var(--sh);position:relative;overflow:hidden}
.tcard.elim{opacity:.5;filter:grayscale(.5)}
.elim-stamp{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-12deg);
  font-family:var(--fd);font-size:22px;color:#D32F2F;opacity:.8;border:3px solid #D32F2F;
  padding:3px 8px;border-radius:8px;pointer-events:none;background:rgba(255,255,255,.9)}
.pred-card{background:var(--card);border-radius:var(--r);border:2px solid var(--border);box-shadow:var(--sh);padding:20px;margin-bottom:14px}
.pred-btn{flex:1;padding:10px 6px;border-radius:12px;border:2px solid var(--border);
  background:var(--bg);cursor:pointer;font-family:var(--fb);font-size:12px;font-weight:800;transition:all .15s;text-align:center}
.pred-btn:hover{border-color:var(--coral)}
.pred-btn.ph{background:rgba(124,77,255,.1);border-color:var(--purple);color:var(--purple)}
.pred-btn.pd{background:rgba(255,214,0,.12);border-color:#B8860B;color:#B8860B}
.pred-btn.pa{background:rgba(233,30,140,.1);border-color:var(--pink);color:var(--pink)}
.pred-btn.lok{pointer-events:none;opacity:.5}
.tq{font-size:20px;font-weight:800;margin-bottom:24px;line-height:1.45;text-align:center;color:var(--navy)}
.topt{padding:15px 20px;border-radius:14px;border:2px solid var(--border);background:var(--card);
  cursor:pointer;font-size:15px;font-weight:700;transition:all .15s;text-align:left;color:var(--navy);box-shadow:var(--sh);width:100%}
.topt:hover{border-color:var(--coral)}
.topt.ok{background:rgba(0,200,83,.1);border-color:#00A152;color:#00A152}
.topt.ng{background:rgba(244,67,54,.06);border-color:rgba(244,67,54,.3);color:#aaa}
.topt.off{pointer-events:none}
.tabs{display:flex;gap:6px;margin-bottom:24px;background:var(--bg);border-radius:14px;padding:5px;border:2px solid var(--border);width:fit-content;flex-wrap:wrap}
.tab{padding:9px 20px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:800;color:var(--muted);transition:all .15s}
.tab.on{background:var(--coral);color:#fff;box-shadow:0 3px 10px rgba(255,107,53,.35)}
.aform label{font-size:12px;color:var(--muted);font-weight:800;letter-spacing:.8px;text-transform:uppercase;display:block;margin-bottom:6px;margin-top:4px}
.aform input,.aform select{width:100%;padding:12px 16px;border-radius:12px;border:2px solid var(--border);
  background:var(--bg);color:var(--navy);font-family:var(--fb);font-size:14px;font-weight:600;
  margin-bottom:12px;outline:none;transition:border-color .15s}
.aform input:focus,.aform select:focus{border-color:var(--coral)}
.toast{position:fixed;bottom:28px;right:28px;background:var(--navy);color:#fff;
  border-radius:18px;padding:16px 22px;display:flex;align-items:center;gap:14px;
  z-index:2000;max-width:340px;box-shadow:0 12px 40px rgba(26,27,75,.25);
  border:2px solid rgba(255,255,255,.1);animation:slideUp .3s ease}
.chcard{background:var(--card);border-radius:var(--r);border:2px solid var(--border);
  box-shadow:var(--sh);padding:18px 22px;display:flex;align-items:center;gap:18px;margin-bottom:12px}
.ppick{border-radius:20px;border:3px solid var(--border);background:var(--card);
  box-shadow:var(--sh);padding:16px 8px;text-align:center;cursor:pointer;
  transition:all .2s;position:relative}
.ppick:hover{border-color:var(--coral);transform:translateY(-2px)}
.ppick.sel{border-color:var(--coral);background:rgba(255,107,53,.05);box-shadow:0 0 0 4px rgba(255,107,53,.15)}
.ppick .chk{position:absolute;top:-10px;right:-10px;width:26px;height:26px;background:var(--coral);
  border-radius:50%;color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center}
.tpick{border-radius:12px;border:2px solid var(--border);background:var(--card);
  padding:10px 6px;text-align:center;cursor:pointer;transition:all .15s}
.tpick:hover{border-color:var(--teal)}
.tpick.tsel{border-color:var(--teal);background:rgba(0,191,165,.08)}
.tpick.dsel{border-color:var(--coral);background:rgba(255,107,53,.06)}
.tpick.taken{opacity:.35;cursor:not-allowed;border-style:dashed}
.reveal{background:linear-gradient(135deg,var(--navy) 0%,#2D2F7A 100%);border-radius:28px;
  padding:44px 36px;text-align:center;color:#fff;box-shadow:0 20px 60px rgba(26,27,75,.35)}
.wheel-wrap{display:flex;flex-direction:column;align-items:center}
.wheel{width:240px;height:240px;border-radius:50%;transition:transform 3.2s cubic-bezier(.17,.67,.12,.99);
  border:5px solid var(--yellow);box-shadow:0 0 40px rgba(255,214,0,.3)}
.ob-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;z-index:1}
.ob-inner{max-width:680px;width:100%}
.blob{position:fixed;border-radius:50%;pointer-events:none;z-index:0;opacity:.065}
.div{height:2px;background:var(--border);margin:28px 0;border-radius:1px}
.score-big{font-family:var(--fd);font-size:64px;letter-spacing:4px;color:var(--coral);text-align:center}
.mnav{position:fixed;bottom:0;left:0;right:0;z-index:100;background:#fff;
  border-top:2px solid var(--border);display:none;justify-content:space-around;padding:8px 0 18px}
.mni{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;
  padding:6px 12px;border-radius:12px;font-size:10px;font-weight:800;color:var(--muted)}
.mni.on{color:var(--coral)}
.mni .ico{font-size:20px}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.07)}100%{transform:scale(1);opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes loadbar{0%{width:0%}50%{width:60%}100%{width:100%}}
.fade-in{animation:fadeIn .35s ease forwards}
.pop{animation:popIn .5s cubic-bezier(.34,1.56,.64,1) forwards}
.float{animation:float 3s ease infinite}
.pulse{animation:pulse 2s ease infinite}
@media(max-width:768px){
  .main{margin-left:0;padding:20px 16px 100px}
  .sidebar{display:none}
  .mnav{display:flex!important}
  .g4{grid-template-columns:1fr 1fr}
  .g3{grid-template-columns:1fr 1fr}
  .g2{grid-template-columns:1fr}
}
@media(min-width:769px){.mnav{display:none!important}}
`;

// ─── BACKGROUND BLOBS ────────────────────────────────────────────
function Blobs() {
  return (
    <React.Fragment>
      <div className="blob" style={{ width: 280, height: 280, top: "3%",  left: "2%",  background: "#FF6B35" }} />
      <div className="blob" style={{ width: 200, height: 200, top: "15%", left: "89%", background: "#00BFA5" }} />
      <div className="blob" style={{ width: 150, height: 150, top: "65%", left: "1%",  background: "#FFD600" }} />
      <div className="blob" style={{ width: 240, height: 240, top: "75%", left: "84%", background: "#E91E8C" }} />
    </React.Fragment>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className="toast">
      <span style={{ fontSize: 26 }}>⚽</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{msg.title}</div>
        {msg.body && <div style={{ color: "rgba(255,255,255,.65)", fontSize: 13, marginTop: 2 }}>{msg.body}</div>}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 20 }}>×</button>
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────
function Onboarding({ onComplete, claimedTeams, eliteAssign }) {
  const [step,     setStep]    = useState(0);
  const [who,      setWho]     = useState(null);
  const [chosen,   setChosen]  = useState({ cA: null, cB: null, dog: null });
  const [revealed, setRevealed]= useState(false);

  useEffect(() => {
    if (step === 1) { const t = setTimeout(() => setRevealed(true), 700); return () => clearTimeout(t); }
    setRevealed(false);
  }, [step]);

  const assign  = eliteAssign || {};
  const myElite = who ? getTeam(assign[who]) : null;

  const Dots = ({ cur }) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i <= cur ? "var(--coral)" : "var(--border)", transition: "background .3s" }} />
      ))}
    </div>
  );

  // Step 0: Who are you?
  if (step === 0) return (
    <div className="ob-wrap">
      <Blobs />
      <div className="ob-inner" style={{ textAlign: "center", zIndex: 1, position: "relative" }}>
        <div className="float" style={{ fontSize: 72, marginBottom: 12 }}>⚽</div>
        <div style={{ fontFamily: "var(--fd)", fontSize: 46, color: "var(--navy)", marginBottom: 8, lineHeight: 1 }}>WORLD CUP<br />CHALLENGE 2026</div>
        <p style={{ color: "var(--muted)", fontWeight: 700, fontSize: 15, marginBottom: 36 }}>Welcome! First — <span style={{ color: "var(--coral)" }}>who are you?</span></p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 32 }}>
          {PEOPLE.map(name => (
            <div key={name} className={"ppick " + (who === name ? "sel" : "")} onClick={() => setWho(name)}>
              {who === name && <div className="chk">✓</div>}
              <Avatar name={name} size={64} />
              <div style={{ fontWeight: 800, fontSize: 13, color: "var(--navy)", marginTop: 10 }}>{name}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-coral" style={{ fontSize: 16, padding: "14px 48px" }} disabled={!who} onClick={() => setStep(1)}>
          That&apos;s me! →
        </button>
      </div>
    </div>
  );

  // Step 1: Top team reveal
  if (step === 1) return (
    <div className="ob-wrap">
      <Blobs />
      <div className="ob-inner" style={{ maxWidth: 500, zIndex: 1, position: "relative", textAlign: "center" }}>
        <Dots cur={1} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 28 }}>
          <Avatar name={who} size={50} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--navy)" }}>Hey {who}!</div>
            <div style={{ color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>Your top team has been drawn…</div>
          </div>
        </div>
        <div className="reveal" style={{ marginBottom: 28 }}>
          {!revealed
            ? <div style={{ fontSize: 60, animation: "pulse 1s ease infinite" }}>🎲</div>
            : (
              <div className="pop">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  <Flag code={myElite ? myElite.id : "tbd"} size={90} style={{ borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }} />
                </div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 42, color: "#FFD600", marginBottom: 10, letterSpacing: 2 }}>
                  {myElite ? myElite.name.toUpperCase() : "TBD"}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", borderRadius: 30, padding: "8px 20px", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                  ⭐ Auto-assigned Favourite · 3× Multiplier
                </div>
                <p style={{ marginTop: 14, color: "rgba(255,255,255,.65)", fontSize: 13, fontWeight: 700 }}>
                  Every time {myElite ? myElite.name : "your team"} advances you earn points × 3!
                </p>
              </div>
            )
          }
        </div>
        {revealed && (
          <button className="btn btn-coral fade-in" style={{ fontSize: 16, padding: "14px 40px" }} onClick={() => setStep(2)}>
            Now pick my contenders →
          </button>
        )}
      </div>
    </div>
  );

  // Step 2: Pick 2 contenders
  if (step === 2) return (
    <div className="ob-wrap">
      <Blobs />
      <div className="ob-inner" style={{ zIndex: 1, position: "relative" }}>
        <Dots cur={2} />
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 30, color: "var(--navy)", marginBottom: 6 }}>PICK 2 CONTENDERS</div>
          <div style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>2× multiplier each · Ranks 6–15 · Top 5 are taken</div>
          {claimedTeams.contenders.length > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(244,67,54,.07)", border: "1.5px solid rgba(244,67,54,.2)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#D32F2F" }}>
              🔒 {claimedTeams.contenders.length} team{claimedTeams.contenders.length > 1 ? "s" : ""} already taken
            </div>
          )}
        </div>
        {/* Selected slots */}
        <div className="g2" style={{ marginBottom: 12 }}>
          {["cA", "cB"].map((slot, i) => (
            <div key={slot} style={{ padding: 14, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 60, border: "2px solid " + (chosen[slot] ? "var(--teal)" : "var(--border)"), background: chosen[slot] ? "rgba(0,191,165,.07)" : "var(--bg)" }}>
              {chosen[slot] ? (
                <React.Fragment>
                  <Flag code={chosen[slot]} size={24} />
                  <span style={{ fontWeight: 800, color: "var(--navy)", fontSize: 13 }}>{getTeam(chosen[slot]).name}</span>
                  <button onClick={() => setChosen(c => ({ ...c, [slot]: null }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, marginLeft: "auto" }}>×</button>
                </React.Fragment>
              ) : (
                <span style={{ color: "var(--muted)", fontWeight: 700, fontSize: 13 }}>Contender {i + 1} — pick below</span>
              )}
            </div>
          ))}
        </div>
        {/* Team grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
          {CONTENDERS.map(team => {
            const selA = chosen.cA === team.id, selB = chosen.cB === team.id, sel = selA || selB;
            const taken = !sel && claimedTeams.contenders.includes(team.id);
            const full  = !sel && !taken && chosen.cA && chosen.cB;
            return (
              <div key={team.id} className={"tpick " + (sel ? "tsel" : "") + (taken ? " taken" : "")}
                style={{ opacity: (full || taken) ? 0.4 : 1, pointerEvents: (full || taken) ? "none" : "auto" }}
                onClick={() => {
                  if (selA) setChosen(c => ({ ...c, cA: null }));
                  else if (selB) setChosen(c => ({ ...c, cB: null }));
                  else if (!chosen.cA) setChosen(c => ({ ...c, cA: team.id }));
                  else if (!chosen.cB) setChosen(c => ({ ...c, cB: team.id }));
                }}>
                <Flag code={team.id} size={24} style={{ margin: "0 auto 4px", display: "block" }} />
                <div style={{ fontSize: 10, fontWeight: 800, color: taken ? "var(--muted)" : "var(--navy)" }}>{team.name}</div>
                {sel && <div style={{ fontSize: 10, color: "var(--teal)", fontWeight: 800 }}>✓</div>}
                {taken && <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700 }}>Taken</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
          <button className="btn btn-coral" style={{ flex: 1 }} disabled={!chosen.cA || !chosen.cB} onClick={() => setStep(3)}>Pick My Underdog →</button>
        </div>
      </div>
    </div>
  );

  // Step 3: Pick underdog
  if (step === 3) return (
    <div className="ob-wrap">
      <Blobs />
      <div className="ob-inner" style={{ zIndex: 1, position: "relative" }}>
        <Dots cur={3} />
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 30, color: "var(--navy)", marginBottom: 6 }}>🐶 PICK YOUR UNDERDOG</div>
          <div style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>5× multiplier · Ranks 16–51 · One upset could win you everything!</div>
          {claimedTeams.underdogs.length > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(244,67,54,.07)", border: "1.5px solid rgba(244,67,54,.2)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#D32F2F" }}>
              🔒 {claimedTeams.underdogs.length} underdog{claimedTeams.underdogs.length > 1 ? "s" : ""} already taken
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, maxHeight: 340, overflowY: "auto", marginBottom: 16 }}>
          {UNDERDOGS.map(team => {
            const sel   = chosen.dog === team.id;
            const taken = !sel && claimedTeams.underdogs.includes(team.id);
            return (
              <div key={team.id} className={"tpick " + (sel ? "dsel" : "") + (taken ? " taken" : "")}
                style={{ opacity: taken ? 0.4 : 1, pointerEvents: taken ? "none" : "auto" }}
                onClick={() => setChosen(c => ({ ...c, dog: sel ? null : team.id }))}>
                <Flag code={team.id} size={24} style={{ margin: "0 auto 4px", display: "block" }} />
                <div style={{ fontSize: 10, fontWeight: 800, color: taken ? "var(--muted)" : "var(--navy)" }}>{team.name}</div>
                <div style={{ fontSize: 9, color: "var(--muted)" }}>#{team.rank}</div>
                {sel && <div style={{ fontSize: 10, color: "var(--coral)", fontWeight: 800 }}>✓ 5×</div>}
                {taken && <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700 }}>Taken</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
          <button className="btn btn-coral" style={{ flex: 1 }} disabled={!chosen.dog} onClick={() => setStep(4)}>Confirm My Teams →</button>
        </div>
      </div>
    </div>
  );

  // Step 4: Confirm
  const slots = [
    { team: myElite, label: "⭐ Favourite", mult: "3×", color: "#B8860B", bg: "rgba(255,214,0,.08)", slot: "favourite" },
    { team: getTeam(chosen.cA), label: "🥊 Contender A", mult: "2×", color: "var(--teal)", bg: "rgba(0,191,165,.07)", slot: "contender" },
    { team: getTeam(chosen.cB), label: "🥊 Contender B", mult: "2×", color: "var(--teal)", bg: "rgba(0,191,165,.07)", slot: "contender" },
    { team: getTeam(chosen.dog), label: "🐶 Underdog", mult: "5×", color: "var(--coral)", bg: "rgba(255,107,53,.07)", slot: "underdog" },
  ];
  return (
    <div className="ob-wrap">
      <Blobs />
      <div className="ob-inner" style={{ maxWidth: 520, zIndex: 1, position: "relative", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
        <div style={{ fontFamily: "var(--fd)", fontSize: 40, color: "var(--coral)", marginBottom: 6 }}>
          LET&apos;S GO {who ? who.toUpperCase() : ""}!
        </div>
        <p style={{ color: "var(--muted)", fontWeight: 700, fontSize: 14, marginBottom: 24 }}>Your squad is locked in. May the best team win!</p>
        <div className="g2" style={{ marginBottom: 24, textAlign: "left" }}>
          {slots.map(s => s.team ? (
            <div key={s.label} style={{ background: s.bg, borderRadius: 18, padding: "14px 16px", border: "2px solid " + s.color + "44", display: "flex", alignItems: "center", gap: 12 }}>
              <Flag code={s.team.id} size={36} style={{ borderRadius: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)" }}>{s.team.name}</div>
                <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.label} · {s.mult}</span>
              </div>
            </div>
          ) : null)}
        </div>
        <button className="btn btn-coral" style={{ fontSize: 17, padding: "15px 50px" }}
          onClick={() => {
            const portfolio = slots.filter(s => s.team).map(s => ({ team: s.team.id, slot: s.slot }));
            onComplete(who, portfolio);
          }}>
          Enter the Competition! 🏆
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────
function Dashboard({ user, participants, matches, setPage, showToast }) {
  const me = (participants || []).find(p => p.name === user) || { name: user, teamPts: 0, predPts: 0, challengePts: 0, bonusPts: 0, portfolio: [] };
  const sorted = [...(participants || [])].sort((a, b) => (b.teamPts + b.predPts + b.challengePts + b.bonusPts) - (a.teamPts + a.predPts + a.challengePts + a.bonusPts));
  const myTotal = me.teamPts + me.predPts + me.challengePts + me.bonusPts;
  const myRank  = sorted.findIndex(p => p.name === user) + 1;
  const leader  = sorted[0] || me;
  const gap     = (leader.teamPts + leader.predPts + leader.challengePts + leader.bonusPts) - myTotal;
  const openMatches = (matches || []).filter(m => m.status === "open").length;

  return (
    <div className="fade-in">
      <div className="phead">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="ptitle">Hey {user}! 👋</div>
            <div className="psub">Tournament starts Jun 11 · {openMatches} match{openMatches !== 1 ? "es" : ""} open for prediction</div>
          </div>
          <span className="badge bc pulse">🔴 LIVE</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,var(--navy) 0%,#2D2F7A 100%)", borderRadius: 24, padding: "26px 30px", marginBottom: 20, boxShadow: "0 12px 40px rgba(26,27,75,.25)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "rgba(255,107,53,.15)", borderRadius: "50%" }} />
        <div style={{ position: "relative", display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { lbl: "Total Points", val: myTotal,              color: "#FFD600" },
            { lbl: "Rank",          val: "#" + myRank,        color: "#fff" },
            { lbl: "vs Leader",     val: gap > 0 ? "-" + gap : "🏆", color: gap > 0 ? "#FF8A80" : "#69F0AE" },
          ].map((item, i) => (
            <div key={item.lbl} style={{ display: "flex", gap: 28, alignItems: "center" }}>
              {i > 0 && <div style={{ width: 2, height: 60, background: "rgba(255,255,255,.12)" }} />}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.5)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>{item.lbl}</div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 52, color: item.color, lineHeight: 1 }}>{item.val}</div>
              </div>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 160 }}>
            {[
              { lbl: "Teams",       pts: me.teamPts,      max: 500, color: "#FFD600" },
              { lbl: "Predictions", pts: me.predPts,      max: 300, color: "#64FFDA" },
              { lbl: "Challenges",  pts: me.challengePts, max: 250, color: "#FFAB91" },
            ].map(r => (
              <div key={r.lbl} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 3 }}>
                  <span style={{ color: "rgba(255,255,255,.5)" }}>{r.lbl}</span>
                  <span style={{ color: r.color }}>{r.pts} pts</span>
                </div>
                <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: r.color, width: Math.min((r.pts / r.max) * 100, 100) + "%", transition: "width .9s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        {/* Challenge CTA */}
        <div className="card" style={{ borderColor: "rgba(255,107,53,.3)", background: "linear-gradient(135deg,rgba(255,107,53,.05),#fff)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="ctitle">🎮 Week {getCurrentWeek()} Challenge</div>
            <span className="badge bc">NEW!</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 4 }}>Weekly Challenges Ready</div>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 16 }}>3 challenges available this week!</div>
          <button className="btn btn-coral" onClick={() => setPage("challenge")}>Start Challenge →</button>
        </div>

        {/* Mini leaderboard */}
        <div className="card">
          <div className="ctitle" style={{ marginBottom: 12 }}>📊 Live Standings</div>
          {sorted.map((p, i) => {
            const medals = ["🥇", "🥈", "🥉"];
            const isMe   = p.name === user;
            const total  = p.teamPts + p.predPts + p.challengePts + p.bonusPts;
            return (
              <div key={p.name} className={"lbrow " + (isMe ? "me" : "") + (i === 0 ? " top" : "")} style={{ padding: "8px 12px" }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: i < 3 ? 20 : 14, width: 32, textAlign: "center" }}>{i < 3 ? medals[i] : i + 1}</div>
                <Avatar name={p.name} size={30} />
                <div style={{ flex: 1, fontWeight: 800, fontSize: 13 }}>{p.name}{isMe ? " (you)" : ""}</div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 20, color: "var(--coral)" }}>{total}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My teams */}
      {me.portfolio && me.portfolio.length > 0 && (
        <div className="card">
          <div className="ctitle" style={{ marginBottom: 14 }}>👕 My Teams</div>
          <div className="g4">
            {me.portfolio.map(pt => {
              const team = getTeam(pt.team);
              const mult = SLOT_MULT[pt.slot] || 1;
              const slotColors = { favourite: "#B8860B", contender: "var(--teal)", underdog: "var(--coral)" };
              const slotEmoji  = { favourite: "⭐", contender: "🥊", underdog: "🐶" };
              const color = slotColors[pt.slot] || "var(--muted)";
              return (
                <div key={pt.team} className="tcard" style={{ background: "var(--bg)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="badge" style={{ background: color + "18", color, border: "1.5px solid " + color + "33", fontSize: 10 }}>{slotEmoji[pt.slot]} {mult}×</span>
                  </div>
                  <Flag code={team.id} size={32} style={{ marginBottom: 6 }} />
                  <div style={{ fontFamily: "var(--fd)", fontSize: 14, color: "var(--navy)" }}>{team.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────
function Leaderboard({ user, participants }) {
  const [expanded, setExpanded] = useState(null);
  const sorted = [...(participants || [])].sort((a, b) => (b.teamPts + b.predPts + b.challengePts + b.bonusPts) - (a.teamPts + a.predPts + a.challengePts + a.bonusPts));
  const meIdx  = sorted.findIndex(p => p.name === user);
  const me     = sorted[meIdx] || { name: user, teamPts: 0, predPts: 0, challengePts: 0, bonusPts: 0 };
  const myTotal = me.teamPts + me.predPts + me.challengePts + me.bonusPts;

  return (
    <div className="fade-in">
      <div className="phead">
        <div className="ptitle">LEADERBOARD</div>
        <div className="psub">Live standings · Updates as matches complete</div>
      </div>
      <div style={{ background: "linear-gradient(135deg,var(--coral),#FF8C5A)", borderRadius: 20, padding: "18px 26px", marginBottom: 22, color: "#fff", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 8px 30px rgba(255,107,53,.35)" }}>
        <Avatar name={user} size={50} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 21 }}>{user} — Your Position</div>
          <div style={{ opacity: .8, fontSize: 13, fontWeight: 700 }}>#{meIdx + 1} of {sorted.length} · Keep pushing! 🔥</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 48, color: "#FFD600", lineHeight: 1 }}>{myTotal}</div>
          <div style={{ opacity: .7, fontSize: 11, fontWeight: 700 }}>TOTAL POINTS</div>
        </div>
      </div>

      {sorted.map((p, i) => {
        const medals  = ["🥇", "🥈", "🥉"];
        const isMe    = p.name === user;
        const isExp   = expanded === p.name;
        const total   = p.teamPts + p.predPts + p.challengePts + p.bonusPts;
        return (
          <div key={p.name}>
            <div className={"lbrow " + (isMe ? "me" : "") + (i === 0 ? " top" : "")} onClick={() => setExpanded(isExp ? null : p.name)}>
              <div style={{ fontFamily: "var(--fd)", fontSize: i < 3 ? 22 : 16, width: 38, textAlign: "center" }}>{i < 3 ? medals[i] : i + 1}</div>
              <Avatar name={p.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}{isMe ? " (you)" : ""}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                  {[["Teams", p.teamPts, "var(--coral)"], ["Preds", p.predPts, "var(--teal)"], ["Challenges", p.challengePts, "var(--purple)"]].map(([l, v, c]) => (
                    <span key={l} style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{l}: <span style={{ color: c }}>{v}</span></span>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "var(--coral)" }}>{total}</div>
              <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: 6 }}>{isExp ? "▲" : "▼"}</span>
            </div>
            {isExp && (
              <div className="card fade-in" style={{ margin: "0 0 10px", padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[["Team Pts", p.teamPts, "var(--coral)"], ["Pred Pts", p.predPts, "var(--teal)"], ["Challenge Pts", p.challengePts, "var(--purple)"], ["Bonus", p.bonusPts, "#FFB300"]].map(([l, v, c]) => (
                    <div key={l}><div style={{ fontFamily: "var(--fd)", fontSize: 28, color: c }}>{v}</div><div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>{l}</div></div>
                  ))}
                  {p.portfolio && p.portfolio.length > 0 && (
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>TEAMS</div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        {p.portfolio.map(pt => {
                          const t = getTeam(pt.team);
                          const e = { favourite: "⭐", contender: "🥊", underdog: "🐶" }[pt.slot];
                          return (
                            <div key={pt.team} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                              {e} <Flag code={t.id} size={18} /> {t.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MY TEAMS ────────────────────────────────────────────────────
function MyTeams({ user, participants }) {
  const me = (participants || []).find(p => p.name === user) || { name: user, portfolio: [] };
  const portfolio = me.portfolio || [];
  const stages = ["Group Stage", "Round of 32", "Round of 16", "Quarter Final", "Semi Final", "Final"];
  const slotColors = { favourite: "#B8860B", contender: "var(--teal)", underdog: "var(--coral)" };
  const slotLabels = { favourite: "⭐ Favourite", contender: "🥊 Contender", underdog: "🐶 Underdog" };

  return (
    <div className="fade-in">
      <div className="phead">
        <div className="ptitle">MY TEAMS</div>
        <div className="psub">Your portfolio · {portfolio.filter(pt => !pt.eliminated).length} team{portfolio.filter(pt => !pt.eliminated).length !== 1 ? "s" : ""} still alive</div>
      </div>
      {portfolio.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
          <div style={{ fontWeight: 800, color: "var(--navy)", fontSize: 16 }}>No teams yet</div>
          <div style={{ color: "var(--muted)", marginTop: 8 }}>Complete onboarding to pick your teams</div>
        </div>
      )}
      {portfolio.map(pt => {
        const team  = getTeam(pt.team);
        const mult  = SLOT_MULT[pt.slot] || 1;
        const color = slotColors[pt.slot] || "var(--muted)";
        const stage = pt.stage || "Group Stage";
        const won   = pt.won   || [];
        const elim  = pt.eliminated || false;
        const earned = won.reduce((sum, s) => sum + ((STAGE_PTS[s] || 0) * mult), 0);
        return (
          <div key={pt.team} className={"card " + (elim ? "elim" : "")} style={{ marginBottom: 16, borderColor: color + "33", borderTopWidth: 4, borderTopColor: color, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Flag code={team.id} size={56} style={{ borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.12)" }} />
                <div>
                  <div style={{ fontFamily: "var(--fd)", fontSize: 24, color: "var(--navy)", marginBottom: 6 }}>{team.name}</div>
                  <span className="badge" style={{ background: color + "18", color, border: "1.5px solid " + color + "44", fontSize: 12 }}>{slotLabels[pt.slot]} · {mult}×</span>
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)", fontWeight: 700 }}>{elim ? "Eliminated" : "Currently: " + stage}</div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>PROGRESS</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {stages.map(s => {
                    const done = won.includes(s);
                    const curr = stage === s && !elim;
                    return (
                      <div key={s} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: done ? "rgba(0,200,83,.1)" : curr ? "rgba(255,107,53,.1)" : "var(--bg)", color: done ? "#00A152" : curr ? "var(--coral)" : "var(--muted)", border: "1.5px solid " + (done ? "rgba(0,200,83,.3)" : curr ? "rgba(255,107,53,.3)" : "var(--border)") }}>
                        {done ? "✓" : curr ? "🏃" : "○"} {s}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 90 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 44, color, lineHeight: 1 }}>{earned}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>pts earned</div>
              </div>
            </div>
            {elim && <div className="elim-stamp">ELIMINATED</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── PREDICTIONS ─────────────────────────────────────────────────
function Predictions({ user, matches, predictions, onSavePrediction, showToast }) {
  const [sel, setSel] = useState({});
  const [tab, setTab] = useState("open");

  const open = (matches || []).filter(m => m.status === "open" || m.status === "locked");
  const done = (matches || []).filter(m => m.status === "completed");
  const myPreds = predictions || {};

  const save = async () => {
    const keys = Object.keys(sel).filter(k => sel[k]);
    for (const matchId of keys) {
      await onSavePrediction(matchId, sel[matchId]);
    }
    setSel({});
    showToast({ title: "Predictions locked! 🎯", body: keys.length + " prediction" + (keys.length !== 1 ? "s" : "") + " saved" });
  };

  return (
    <div className="fade-in">
      <div className="phead">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div><div className="ptitle">PREDICTIONS</div><div className="psub">Predict match outcomes · 20 pts for correct pick</div></div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 26, color: "var(--teal)" }}>
              {done.filter(m => myPreds[m.id] && myPreds[m.id].pts > 0).length} / {done.filter(m => myPreds[m.id]).length}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>correct predictions</div>
          </div>
        </div>
      </div>
      <div className="tabs">
        <div className={"tab " + (tab === "open" ? "on" : "")}    onClick={() => setTab("open")}>🔓 Open ({open.length})</div>
        <div className={"tab " + (tab === "history" ? "on" : "")} onClick={() => setTab("history")}>📜 History ({done.length})</div>
      </div>

      {tab === "open" && (
        <div>
          <div style={{ padding: "11px 16px", background: "rgba(0,191,165,.07)", borderRadius: 12, border: "1.5px solid rgba(0,191,165,.2)", fontSize: 13, color: "var(--teal)", fontWeight: 700, marginBottom: 16 }}>
            💡 Correct pick = <strong>20 pts</strong>. Predictions lock at kick-off automatically.
          </div>
          {open.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🕐</div>
              <div style={{ fontWeight: 800, color: "var(--navy)" }}>No matches open yet</div>
              <div style={{ color: "var(--muted)", marginTop: 8 }}>Check back when the tournament starts on June 11</div>
            </div>
          )}
          {open.map(m => {
            const h      = getTeam(m.home);
            const a      = getTeam(m.away);
            const locked = m.status === "locked";
            const myPick = sel[m.id] || (myPreds[m.id] && myPreds[m.id].outcome);
            const saved  = !sel[m.id] && myPreds[m.id];
            const ko     = m.kickoff ? new Date(m.kickoff) : null;
            const time   = ko ? ko.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }) + " SAST" : m.date;
            return (
              <div key={m.id} className="pred-card" style={{ opacity: locked ? 0.75 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="badge bp" style={{ fontSize: 11 }}>{m.stage}</span>
                    <span className="badge bm" style={{ fontSize: 11 }}>🕐 {time}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {saved  && <span className="badge bg-g" style={{ fontSize: 11 }}>✓ Saved</span>}
                    {locked && <span className="badge bg-r" style={{ fontSize: 11 }}>🔒 Locked</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <Flag code={h.id} size={32} style={{ margin: "0 auto 6px", display: "block" }} />
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{h.name}</div>
                  </div>
                  <div style={{ fontFamily: "var(--fd)", fontSize: 18, color: "var(--muted)" }}>VS</div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <Flag code={a.id} size={32} style={{ margin: "0 auto 6px", display: "block" }} />
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{a.name}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ k: "home", l: h.name + " Win", cls: "ph" }, { k: "draw", l: "Draw", cls: "pd" }, { k: "away", l: a.name + " Win", cls: "pa" }].map(o => (
                    <button key={o.k}
                      className={"pred-btn " + (myPick === o.k ? o.cls : "") + (locked ? " lok" : "")}
                      onClick={() => !locked && setSel(prev => ({ ...prev, [m.id]: o.k }))}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.values(sel).some(Boolean) && (
            <button className="btn btn-coral" style={{ marginTop: 8 }} onClick={save}>🎯 Lock In Predictions</button>
          )}
        </div>
      )}

      {tab === "history" && (
        <div>
          {done.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 800, color: "var(--navy)" }}>No results yet</div>
              <div style={{ color: "var(--muted)", marginTop: 8 }}>Completed matches will appear here</div>
            </div>
          )}
          {done.map(m => {
            const h       = getTeam(m.home);
            const a       = getTeam(m.away);
            const actual  = m.homeScore > m.awayScore ? "home" : m.awayScore > m.homeScore ? "away" : "draw";
            const myPred  = myPreds[m.id];
            const correct = myPred && myPred.outcome === actual;
            return (
              <div key={m.id} className="pred-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span className="badge bm" style={{ fontSize: 11 }}>{m.stage} · {m.date}</span>
                  {myPred
                    ? <span className={"badge " + (correct ? "bg-g" : "bg-r")} style={{ fontSize: 11 }}>{correct ? "✓ +20 pts" : "✗ 0 pts"}</span>
                    : <span className="badge bm" style={{ fontSize: 11 }}>No prediction</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <Flag code={h.id} size={28} style={{ margin: "0 auto 4px", display: "block" }} />
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{h.name}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 26, color: "var(--navy)" }}>{m.homeScore}–{m.awayScore}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>FT</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <Flag code={a.id} size={28} style={{ margin: "0 auto 4px", display: "block" }} />
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{a.name}</div>
                  </div>
                </div>
                {myPred && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {["home", "draw", "away"].map(o => {
                      const isA = o === actual, isP = o === myPred.outcome;
                      return (
                        <div key={o} style={{ flex: 1, padding: "8px 4px", borderRadius: 10, textAlign: "center", fontSize: 11, fontWeight: 800, border: "2px solid " + (isA && isP ? "#00A152" : isP ? "#D32F2F" : "var(--border)"), background: isA && isP ? "rgba(0,200,83,.08)" : isP ? "rgba(244,67,54,.06)" : "var(--bg)", color: isA && isP ? "#00A152" : isP ? "#D32F2F" : "var(--muted)" }}>
                          {o === "home" ? h.name : o === "away" ? a.name : "Draw"}{isA ? " ✓" : ""}{isP && !isA ? " ✗" : ""}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CHALLENGE ───────────────────────────────────────────────────
function Challenge({ user, participants, showToast, onAddChallengePoints }) {
  const week        = getCurrentWeek();
  const weekChalIds = WEEK_SCHEDULE[week] || WEEK_SCHEDULE[1];
  const trivia      = TRIVIA_BANK[week]    || TRIVIA_BANK[1];
  const lightning   = LIGHTNING_BANK[week] || LIGHTNING_BANK[1];

  const [completed,  setCompleted]  = useState({});
  const [phase,      setPhase]      = useState("menu");
  const [qIdx,       setQIdx]       = useState(0);
  const [score,      setScore]      = useState(0);
  const [answered,   setAnswered]   = useState(null);
  const [fIdx,       setFIdx]       = useState(0);
  const [fAns,       setFAns]       = useState(null);
  const [fScore,     setFScore]     = useState(0);
  const [lIdx,       setLIdx]       = useState(0);
  const [lScore,     setLScore]     = useState(0);
  const [lAns,       setLAns]       = useState(null);
  const [lTime,      setLTime]      = useState(30);
  const [lDone,      setLDone]      = useState(false);
  const [spinning,   setSpinning]   = useState(false);
  const [spinDeg,    setSpinDeg]    = useState(0);
  const [spinResult, setSpinResult] = useState(null);
  const [spPick,     setSpPick]     = useState({ matchId: "m1", home: "", away: "" });
  const [spDone,     setSpDone]     = useState(false);
  const lTimer = useRef(null);

  const compKey = id => "w" + week + "_" + id;
  const isDone  = id => !!completed[compKey(id)];

  const claim = async (id, pts, label) => {
    setCompleted(prev => ({ ...prev, [compKey(id)]: pts }));
    if (pts > 0) await onAddChallengePoints(pts);
    showToast({ title: "+" + pts + " pts! " + label, body: "Added to your challenge score" });
    const me = (participants || []).find(p => p.name === user);
    if (me) {
      const total = me.teamPts + me.predPts + me.challengePts + me.bonusPts + pts;
      sendChat(String.fromCodePoint(128293) + " *" + user + " just completed a challenge!*\n*" + label + "* — scored *" + pts + " pts*\n" + user + "'s total is now *" + total + " pts*");
    }
    reset();
  };

  const reset = () => {
    setPhase("menu");
    setQIdx(0); setScore(0); setAnswered(null);
    setFIdx(0); setFAns(null); setFScore(0);
    setLIdx(0); setLScore(0); setLAns(null); setLTime(30); setLDone(false);
    setSpinResult(null);
    setSpPick({ matchId: "m1", home: "", away: "" }); setSpDone(false);
    if (lTimer.current) clearInterval(lTimer.current);
  };

  const Back = () => <button className="btn btn-outline btn-sm" onClick={reset}>← Back</button>;

  const Dots = ({ total, cur }) => (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: 28, height: 7, borderRadius: 4, background: i < cur ? "var(--coral)" : i === cur ? "var(--teal)" : "var(--border)", transition: "background .3s" }} />
      ))}
    </div>
  );

  const getFlagOpts = (name) => {
    const opts = [name];
    while (opts.length < 4) {
      const r = TEAMS[Math.floor(Math.random() * TEAMS.length)].name;
      if (!opts.includes(r)) opts.push(r);
    }
    return opts.sort(() => Math.random() - 0.5);
  };

  // Trivia phase
  const answerT = (idx) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === trivia[qIdx].ans) setScore(s => s + 4);
    setTimeout(() => {
      if (qIdx + 1 < trivia.length) { setQIdx(i => i + 1); setAnswered(null); }
      else setPhase("trivia-result");
    }, 900);
  };

  if (phase === "trivia") {
    const q = trivia[qIdx];
    return (
      <div className="fade-in" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Back /><Dots total={trivia.length} cur={qIdx} /><span className="badge bc">{score} pts</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 6 }}>Question {qIdx + 1} of {trivia.length}</div>
        <div className="tq">{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.opts.map((opt, i) => {
            const isAns = answered !== null, isC = i === q.ans, isP = i === answered;
            return (
              <button key={i} className={"topt " + (isAns && isC ? "ok" : isAns && isP ? "ng" : isAns ? "off" : "")} onClick={() => answerT(i)}>
                <span style={{ marginRight: 10, fontWeight: 900, opacity: .4 }}>{String.fromCharCode(65 + i)}.</span>
                {opt}{isAns && isC ? " ✓" : ""}{isAns && isP && !isC ? " ✗" : ""}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "trivia-result") return (
    <div className="fade-in" style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 10 }}>{score >= 16 ? "🏆" : score >= 8 ? "🥈" : "💪"}</div>
      <div style={{ fontFamily: "var(--fd)", fontSize: 40, color: "var(--navy)", marginBottom: 8 }}>TRIVIA DONE!</div>
      <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 24 }}>{score / 4}/{trivia.length} correct</div>
      <div className="score-big">{score}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 24 }}>POINTS EARNED</div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button className="btn btn-coral" onClick={() => claim("trivia", score, "Trivia Blitz 🧠")}>Claim Points</button>
        <button className="btn btn-outline" onClick={() => { setPhase("trivia"); setQIdx(0); setScore(0); setAnswered(null); }}>Try Again</button>
      </div>
    </div>
  );

  // Flags phase
  const answerF = (name) => {
    if (fAns !== null) return;
    setFAns(name);
    if (name === FLAG_QUIZ_TEAMS[fIdx].name) setFScore(s => s + 3);
    setTimeout(() => {
      if (fIdx + 1 < FLAG_QUIZ_TEAMS.length) { setFIdx(i => i + 1); setFAns(null); }
      else setPhase("flag-result");
    }, 900);
  };

  if (phase === "flags") {
    const item = FLAG_QUIZ_TEAMS[fIdx];
    const opts = getFlagOpts(item.name);
    return (
      <div className="fade-in" style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Back /><Dots total={FLAG_QUIZ_TEAMS.length} cur={fIdx} /><span className="badge bt">{fScore} pts</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Flag code={item.id} size={80} style={{ borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,.15)" }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)", marginBottom: 18 }}>Which country is this? 🌍</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {opts.map(opt => {
              const isAns = fAns !== null, isC = opt === item.name, isP = opt === fAns;
              return (
                <button key={opt} className={"topt " + (isAns && isC ? "ok" : isAns && isP ? "ng" : isAns ? "off" : "")} onClick={() => answerF(opt)} style={{ textAlign: "center" }}>
                  {opt}{isAns && isC ? " ✓" : ""}{isAns && isP && !isC ? " ✗" : ""}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "flag-result") return (
    <div className="fade-in" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 68, marginBottom: 10 }}>🌍</div>
      <div style={{ fontFamily: "var(--fd)", fontSize: 40, color: "var(--navy)", marginBottom: 8 }}>FLAG MASTER!</div>
      <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 24 }}>{fScore} / 15 points</div>
      <div className="score-big">{fScore}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 24 }}>POINTS EARNED</div>
      <button className="btn btn-coral" onClick={() => claim("flags", fScore, "Flag Frenzy 🌍")}>Claim Points</button>
    </div>
  );

  // Lightning phase
  useEffect(() => {
    if (phase !== "lightning" || lDone) return;
    lTimer.current = setInterval(() => {
      setLTime(t => {
        if (t <= 1) { clearInterval(lTimer.current); setLDone(true); setPhase("lightning-result"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(lTimer.current);
  }, [phase]);

  const answerL = (ans) => {
    if (lAns !== null) return;
    setLAns(ans);
    if (ans === lightning[lIdx].ans) setLScore(s => s + 2);
    setTimeout(() => {
      if (lIdx + 1 < lightning.length) { setLIdx(i => i + 1); setLAns(null); }
      else { clearInterval(lTimer.current); setLDone(true); setPhase("lightning-result"); }
    }, 600);
  };

  if (phase === "lightning") {
    const stmt   = lightning[lIdx];
    const pct    = (lTime / 30) * 100;
    const barCol = lTime > 15 ? "var(--teal)" : lTime > 8 ? "var(--yellow)" : "var(--coral)";
    return (
      <div className="fade-in" style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Back />
          <div style={{ fontFamily: "var(--fd)", fontSize: 18, color: "var(--navy)" }}>⚡ LIGHTNING</div>
          <span className="badge" style={{ background: lTime <= 8 ? "rgba(255,107,53,.15)" : "rgba(0,191,165,.12)", color: lTime <= 8 ? "var(--coral)" : "var(--teal)", border: "none", fontFamily: "var(--fd)", fontSize: 16 }}>{lTime}s</span>
        </div>
        <div className="ptrack" style={{ marginBottom: 20, height: 10 }}>
          <div className="pfill" style={{ width: pct + "%", background: barCol, transition: "width 1s linear" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Dots total={lightning.length} cur={lIdx} />
          <span className="badge bt">{lScore} pts</span>
        </div>
        <div style={{ background: "var(--card)", borderRadius: 20, border: "2px solid var(--border)", padding: "28px 24px", textAlign: "center", marginBottom: 20, boxShadow: "var(--sh)" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "var(--navy)", lineHeight: 1.4 }}>{stmt.s}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ v: true, l: "✅ TRUE" }, { v: false, l: "❌ FALSE" }].map(opt => {
            const isAns = lAns !== null, isC = opt.v === stmt.ans, isP = opt.v === lAns;
            return (
              <button key={String(opt.v)} onClick={() => answerL(opt.v)}
                style={{ padding: "20px", borderRadius: 16, border: "2px solid " + (isAns ? (isC ? "#00A152" : isP ? "#D32F2F" : "var(--border)") : "var(--border)"), background: isAns ? (isC ? "rgba(0,200,83,.1)" : isP ? "rgba(244,67,54,.07)" : "var(--bg)") : "var(--bg)", fontFamily: "var(--fd)", fontSize: 20, cursor: isAns ? "default" : "pointer", color: isAns ? (isC ? "#00A152" : isP ? "#D32F2F" : "var(--muted)") : "var(--navy)", transition: "all .15s", pointerEvents: isAns ? "none" : "auto" }}>
                {opt.l}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "lightning-result") return (
    <div className="fade-in" style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 10 }}>{lScore >= 16 ? "⚡⚡" : "⚡"}</div>
      <div style={{ fontFamily: "var(--fd)", fontSize: 40, color: "var(--navy)", marginBottom: 8 }}>LIGHTNING DONE!</div>
      <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 24 }}>{lScore / 2}/{lightning.length} correct</div>
      <div className="score-big">{lScore}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 24 }}>POINTS EARNED</div>
      <button className="btn btn-coral" onClick={() => claim("lightning", lScore, "Lightning Round ⚡")}>Claim Points</button>
    </div>
  );

  // Spin phase
  if (phase === "spin") {
    const n = WHEEL_SEGS.length, ang = 360 / n;
    return (
      <div className="fade-in" style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <Back /><div style={{ fontFamily: "var(--fd)", fontSize: 20, color: "var(--navy)" }}>🎡 LUCKY SPIN</div>
        </div>
        <div className="wheel-wrap">
          <div style={{ fontSize: 30, marginBottom: -4, zIndex: 2 }}>⬇️</div>
          <div className="wheel" style={{ transform: "rotate(" + spinDeg + "deg)" }}>
            <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%", borderRadius: "50%" }}>
              {WHEEL_SEGS.map((seg, i) => {
                const s = i * ang, e = s + ang, r = 118, cx = 120, cy = 120;
                const sx = cx + r * Math.cos((s - 90) * Math.PI / 180);
                const sy = cy + r * Math.sin((s - 90) * Math.PI / 180);
                const ex = cx + r * Math.cos((e - 90) * Math.PI / 180);
                const ey = cy + r * Math.sin((e - 90) * Math.PI / 180);
                const mx = cx + (r * .64) * Math.cos(((s + e) / 2 - 90) * Math.PI / 180);
                const my = cy + (r * .64) * Math.sin(((s + e) / 2 - 90) * Math.PI / 180);
                return (
                  <g key={i}>
                    <path d={"M" + cx + "," + cy + " L" + sx + "," + sy + " A" + r + "," + r + " 0 0,1 " + ex + "," + ey + " Z"} fill={seg.color} stroke="white" strokeWidth="2" />
                    <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Righteous">{seg.label}</text>
                  </g>
                );
              })}
              <circle cx="120" cy="120" r="20" fill="white" stroke="var(--navy)" strokeWidth="3" />
              <text x="120" y="120" textAnchor="middle" dominantBaseline="middle" fill="var(--navy)" fontSize="11" fontFamily="Righteous">⚽</text>
            </svg>
          </div>
          {!spinResult
            ? <button className="btn btn-coral" style={{ marginTop: 24, fontSize: 17, padding: "13px 46px" }} onClick={() => {
              if (spinning) return;
              setSpinning(true);
              const idx = Math.floor(Math.random() * WHEEL_SEGS.length);
              setSpinDeg(d => d + 1080 + idx * (360 / WHEEL_SEGS.length) + Math.random() * 35);
              setTimeout(() => { setSpinning(false); setSpinResult(WHEEL_SEGS[idx]); }, 3400);
            }} disabled={spinning}>{spinning ? "Spinning..." : "🎡 SPIN!"}</button>
            : (
              <div className="fade-in" style={{ textAlign: "center", marginTop: 24 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 52, color: "var(--coral)" }}>{spinResult.label}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700, marginBottom: 18 }}>multiplier on your next prediction!</div>
                <button className="btn btn-coral" onClick={() => claim("spin", 0, "Lucky Spin 🎡")}>Claim Bonus!</button>
              </div>
            )
          }
        </div>
      </div>
    );
  }

  // Score predictor phase
  if (phase === "score") {
    return (
      <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Back /><div style={{ fontFamily: "var(--fd)", fontSize: 20, color: "var(--navy)" }}>🎯 SCORE PREDICTOR</div>
        </div>
        <div style={{ padding: "12px 16px", background: "rgba(124,77,255,.07)", borderRadius: 12, border: "1.5px solid rgba(124,77,255,.2)", fontSize: 13, color: "var(--purple)", fontWeight: 700, marginBottom: 20 }}>
          Predict the exact final score. Get it right = <strong>30 pts</strong>!
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <Flag code="arg" size={32} style={{ margin: "0 auto 6px", display: "block" }} />
              <div style={{ fontSize: 13, fontWeight: 800 }}>Argentina</div>
            </div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 18, color: "var(--muted)" }}>VS</div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <Flag code="fra" size={32} style={{ margin: "0 auto 6px", display: "block" }} />
              <div style={{ fontSize: 13, fontWeight: 800 }}>France</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
            <input type="number" min="0" max="20" placeholder="0" value={spPick.home}
              onChange={e => setSpPick(p => ({ ...p, home: e.target.value }))}
              style={{ width: 60, textAlign: "center", padding: "10px 4px", borderRadius: 12, border: "2px solid var(--border)", fontFamily: "var(--fd)", fontSize: 28, outline: "none", color: "var(--navy)", background: "var(--bg)" }} />
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "var(--muted)" }}>–</div>
            <input type="number" min="0" max="20" placeholder="0" value={spPick.away}
              onChange={e => setSpPick(p => ({ ...p, away: e.target.value }))}
              style={{ width: 60, textAlign: "center", padding: "10px 4px", borderRadius: 12, border: "2px solid var(--border)", fontFamily: "var(--fd)", fontSize: 28, outline: "none", color: "var(--navy)", background: "var(--bg)" }} />
          </div>
        </div>
        {!spDone
          ? <button className="btn btn-coral" style={{ width: "100%" }} disabled={spPick.home === "" || spPick.away === ""} onClick={() => setSpDone(true)}>🎯 Lock In My Score</button>
          : (
            <div className="fade-in" style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 10 }}>🔒</div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 28, color: "var(--navy)", marginBottom: 8 }}>LOCKED IN!</div>
              <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 20 }}>You&apos;ll earn 30 pts if your exact score is correct!</div>
              <button className="btn btn-coral" onClick={() => claim("score", 0, "Score Predictor 🎯")}>Done</button>
            </div>
          )
        }
      </div>
    );
  }

  // Menu
  const weekTotal  = weekChalIds.reduce((sum, id) => sum + (CHALLENGE_INFO[id]?.pts || 0), 0);
  const doneCount  = weekChalIds.filter(id => isDone(id)).length;

  return (
    <div className="fade-in">
      <div className="phead">
        <div className="ptitle">CHALLENGES</div>
        <div className="psub">Week {week} · {doneCount}/{weekChalIds.length} complete · Up to {weekTotal} pts</div>
      </div>
      {/* Progress */}
      <div style={{ background: "linear-gradient(135deg,var(--navy),#2D2F7A)", borderRadius: 20, padding: "18px 24px", marginBottom: 20, color: "white", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 8px 30px rgba(26,27,75,.25)", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 36, color: "var(--yellow)", lineHeight: 1 }}>{doneCount}/{weekChalIds.length}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginTop: 2 }}>Completed</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
            <span style={{ color: "rgba(255,255,255,.6)" }}>Week {week} Progress</span>
            <span style={{ color: "var(--yellow)" }}>{weekTotal} pts available</span>
          </div>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 6, height: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 6, background: "var(--yellow)", width: (weekChalIds.length > 0 ? doneCount / weekChalIds.length * 100 : 0) + "%", transition: "width .9s ease" }} />
          </div>
        </div>
      </div>
      {/* Challenge cards */}
      {weekChalIds.map(id => {
        const ch   = CHALLENGE_INFO[id];
        const done = isDone(id);
        return (
          <div key={id} className={"chcard " + (done ? "done" : "")} style={{ opacity: done ? 0.7 : 1 }}>
            <div style={{ fontSize: 40, flexShrink: 0 }}>{ch.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)" }}>{ch.title}</div>
                {!done && <span className="badge bc" style={{ fontSize: 10 }}>NEW</span>}
                {done  && <span className="badge bg-g" style={{ fontSize: 10 }}>✓ Done</span>}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{ch.desc}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: done ? "var(--muted)" : "var(--coral)" }}>
                {ch.pts > 0 ? ch.pts + " pts" : "Bonus"}
              </div>
              <button className={"btn btn-sm " + (done ? "btn-outline" : "btn-coral")} style={{ marginTop: 8 }} disabled={done} onClick={() => setPhase(id)}>
                {done ? "Completed" : "Start →"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────
function AdminPanel({ user, participants, matches, showToast, onRecordResult, onAwardBonus, onAdvanceTeam }) {
  const [tab, setTab] = useState("overview");
  const [rf,  setRf]  = useState({ matchId: "", home: "", away: "" });
  const [bf,  setBf]  = useState({ userId: "", points: "", reason: "" });
  const [af,  setAf]  = useState({ teamId: "", stage: "" });
  const sorted = [...(participants || [])].sort((a, b) => (b.teamPts + b.predPts + b.challengePts + b.bonusPts) - (a.teamPts + a.predPts + a.challengePts + a.bonusPts));
  const openMatches = (matches || []).filter(m => m.status === "open");

  return (
    <div className="fade-in">
      <div className="phead">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span className="badge bc">ADMIN</span><div className="ptitle">ADMIN PANEL</div></div>
            <div className="psub">Brandon · Manage the competition</div>
          </div>
          <button className="btn btn-sm btn-outline" style={{ color: "#D32F2F", borderColor: "#D32F2F" }}
            onClick={() => {
              if (window.confirm("Reset the entire app? This clears ALL data. Cannot be undone.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}>
            🔄 Reset App
          </button>
        </div>
      </div>

      <div className="tabs">
        {[["overview", "📊 Overview"], ["matches", "⚽ Matches"], ["stages", "🏆 Stages"], ["bonus", "🎁 Bonus"], ["participants", "👥 Participants"]].map(([k, l]) => (
          <div key={k} className={"tab " + (tab === k ? "on" : "")} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="fade-in">
          <div className="g3" style={{ marginBottom: 20 }}>
            {[
              { l: "Participants", v: (participants || []).filter(p => p.portfolio && p.portfolio.length > 0).length + "/5", sub: "Onboarded", c: "var(--teal)" },
              { l: "Open Matches", v: openMatches.length, sub: "Available to predict", c: "var(--coral)" },
              { l: "Total Predictions", v: "—", sub: "Via Supabase", c: "var(--purple)" },
            ].map(item => (
              <div key={item.l} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 42, color: item.c }}>{item.v}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--navy)", marginBottom: 4 }}>{item.l}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="ctitle" style={{ marginBottom: 14 }}>Points Overview</div>
            {sorted.map(p => {
              const total = p.teamPts + p.predPts + p.challengePts + p.bonusPts;
              const max   = 600;
              return (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Avatar name={p.name} size={34} />
                  <div style={{ width: 86, fontWeight: 800, fontSize: 13 }}>{p.name}</div>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 5, background: "var(--coral)", width: Math.min((total / max) * 100, 100) + "%" }} />
                  </div>
                  <div style={{ fontFamily: "var(--fd)", fontSize: 20, color: "var(--coral)", width: 48, textAlign: "right" }}>{total}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matches */}
      {tab === "matches" && (
        <div className="fade-in">
          <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--navy)", marginBottom: 14 }}>RECORD MATCH RESULT</div>
          <div style={{ padding: "11px 16px", background: "rgba(0,191,165,.07)", borderRadius: 12, border: "1.5px solid rgba(0,191,165,.2)", fontSize: 13, color: "var(--teal)", fontWeight: 700, marginBottom: 16 }}>
            💡 Use this when the Apps Script daily sync misses a result.
          </div>
          <div className="card aform" style={{ marginBottom: 22 }}>
            <label>Select Match</label>
            <select value={rf.matchId} onChange={e => setRf(f => ({ ...f, matchId: e.target.value }))}>
              <option value="">-- Choose match --</option>
              {openMatches.map(m => {
                const h = getTeam(m.home), a = getTeam(m.away);
                return <option key={m.id} value={m.id}>{h.name} vs {a.name} · {m.stage}</option>;
              })}
            </select>
            <div className="g2">
              <div><label>Home Score</label><input type="number" min="0" max="20" placeholder="0" value={rf.home} onChange={e => setRf(f => ({ ...f, home: e.target.value }))} /></div>
              <div><label>Away Score</label><input type="number" min="0" max="20" placeholder="0" value={rf.away} onChange={e => setRf(f => ({ ...f, away: e.target.value }))} /></div>
            </div>
            <button className="btn btn-coral" disabled={!rf.matchId || rf.home === "" || rf.away === ""} onClick={() => {
              const m = (matches || []).find(m => m.id === rf.matchId);
              if (m) {
                onRecordResult(rf.matchId, parseInt(rf.home), parseInt(rf.away), m.stage);
                showToast({ title: "Result recorded! ⚽", body: getTeam(m.home).name + " " + rf.home + "–" + rf.away + " " + getTeam(m.away).name });
              }
              setRf({ matchId: "", home: "", away: "" });
            }}>✓ Record Result &amp; Score Points</button>
          </div>
          <div style={{ fontFamily: "var(--fd)", fontSize: 20, color: "var(--navy)", marginBottom: 12 }}>COMPLETED MATCHES</div>
          {(matches || []).filter(m => m.status === "completed").length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 30, color: "var(--muted)", fontWeight: 700 }}>No completed matches yet</div>
          )}
          {(matches || []).filter(m => m.status === "completed").map(m => {
            const h = getTeam(m.home), a = getTeam(m.away);
            return (
              <div key={m.id} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Flag code={h.id} size={22} />
                <span style={{ fontWeight: 800 }}>{h.name}</span>
                <span style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--coral)", margin: "0 6px" }}>{m.homeScore}–{m.awayScore}</span>
                <span style={{ fontWeight: 800 }}>{a.name}</span>
                <Flag code={a.id} size={22} />
                <div style={{ marginLeft: "auto" }}><span className="badge bg-g">✓ Scored</span></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stages */}
      {tab === "stages" && (
        <div className="fade-in">
          <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--navy)", marginBottom: 8 }}>ADVANCE A TEAM</div>
          <div style={{ padding: "11px 16px", background: "rgba(0,191,165,.07)", borderRadius: 12, border: "1.5px solid rgba(0,191,165,.2)", fontSize: 13, color: "var(--teal)", fontWeight: 700, marginBottom: 18 }}>
            When a team wins a knockout match, advance them here. Points are awarded automatically to their owner.
          </div>
          <div className="card aform">
            <label>Select Team</label>
            <select value={af.teamId} onChange={e => setAf(f => ({ ...f, teamId: e.target.value }))}>
              <option value="">-- Choose team --</option>
              {TEAMS.filter(t => t.id !== "tbd").map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <label>New Stage</label>
            <select value={af.stage} onChange={e => setAf(f => ({ ...f, stage: e.target.value }))}>
              <option value="">-- Select stage --</option>
              {["Round of 32", "Round of 16", "Quarter Final", "Semi Final", "Final", "Champion", "Eliminated"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn btn-coral" disabled={!af.teamId || !af.stage} onClick={() => {
              const team = getTeam(af.teamId);
              onAdvanceTeam(af.teamId, af.stage);
              showToast({ title: af.stage === "Eliminated" ? team.name + " eliminated 💀" : team.name + " advanced! 🏆", body: af.stage === "Eliminated" ? "Team marked as out" : "Points awarded to their owner" });
              setAf({ teamId: "", stage: "" });
            }}>
              {af.stage === "Eliminated" ? "💀 Mark as Eliminated" : "🏆 Advance Team & Award Points"}
            </button>
          </div>
        </div>
      )}

      {/* Bonus */}
      {tab === "bonus" && (
        <div className="fade-in">
          <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--navy)", marginBottom: 14 }}>AWARD BONUS POINTS</div>
          <div className="card aform">
            <label>Participant</label>
            <select value={bf.userId} onChange={e => setBf(f => ({ ...f, userId: e.target.value }))}>
              <option value="">-- Select --</option>
              {(participants || []).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <label>Points (max 30)</label>
            <input type="number" min="1" max="30" placeholder="10" value={bf.points} onChange={e => setBf(f => ({ ...f, points: e.target.value }))} />
            <label>Reason</label>
            <input placeholder="e.g. Funniest prediction this week 😂" value={bf.reason} onChange={e => setBf(f => ({ ...f, reason: e.target.value }))} />
            <button className="btn btn-coral" disabled={!bf.userId || !bf.points || !bf.reason} onClick={() => {
              onAwardBonus(bf.userId, parseInt(bf.points), bf.reason);
              showToast({ title: "Bonus awarded! 🎁", body: "+" + bf.points + " pts to " + bf.userId });
              setBf({ userId: "", points: "", reason: "" });
            }}>🎁 Award Points</button>
          </div>
        </div>
      )}

      {/* Participants */}
      {tab === "participants" && (
        <div className="fade-in">
          <div style={{ fontFamily: "var(--fd)", fontSize: 22, color: "var(--navy)", marginBottom: 14 }}>PARTICIPANT STATUS</div>
          {sorted.map(p => {
            const total = p.teamPts + p.predPts + p.challengePts + p.bonusPts;
            return (
              <div key={p.name} className="card" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <Avatar name={p.name} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 6 }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[["Teams", p.teamPts, "var(--coral)"], ["Preds", p.predPts, "var(--teal)"], ["Challenges", p.challengePts, "var(--purple)"], ["Bonus", p.bonusPts, "#FFB300"]].map(([l, v, c]) => (
                      <div key={l} style={{ fontSize: 13, fontWeight: 700 }}><span style={{ color: "var(--muted)" }}>{l}: </span><span style={{ color: c }}>{v}</span></div>
                    ))}
                  </div>
                  {p.portfolio && p.portfolio.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {p.portfolio.map(pt => {
                        const t = getTeam(pt.team);
                        return (
                          <div key={pt.team} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                            <Flag code={t.id} size={16} /> {t.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--fd)", fontSize: 32, color: "var(--coral)" }}>{total}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>total pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────
export default function App() {
  // Sync localStorage read on init for instant session restore
  const savedUser = (() => { try { return localStorage.getItem("wc2026_user"); } catch(e) { return null; } })();

  const [page,         setPage]        = useState("dashboard");
  const [currentUser,  setCurrentUser] = useState(savedUser);
  const [loading,      setLoading]     = useState(true);
  const [toast,        setToast]       = useState(null);
  const [participants, setParticipants]= useState(PEOPLE.map(name => ({ name, teamPts: 0, predPts: 0, challengePts: 0, bonusPts: 0, portfolio: [] })));
  const [matches,      setMatches]     = useState([]);
  const [predictions,  setPredictions] = useState({});
  const [claimedTeams, setClaimedTeams]= useState({ contenders: [], underdogs: [] });
  const [eliteAssign,  setEliteAssign] = useState(null);

  const showToast = msg => setToast(msg);
  const isAdmin   = currentUser === "Brandon";

  // ── LOAD ALL DATA FROM SUPABASE ───────────────────────────────
  useEffect(() => {
    async function boot() {
      setLoading(true);
      try {
        // 1. Load participants
        const dbP = await sbGet("participants");
        if (dbP && dbP.length > 0) {
          const merged = PEOPLE.map(name => {
            const db = dbP.find(d => d && d.name === name);
            return db
              ? { name, teamPts: db.team_pts || 0, predPts: db.pred_pts || 0, challengePts: db.challenge_pts || 0, bonusPts: db.bonus_pts || 0, portfolio: [] }
              : { name, teamPts: 0, predPts: 0, challengePts: 0, bonusPts: 0, portfolio: [] };
          });
          setParticipants(merged);
        }

        // 2. Load matches
        const dbM = await sbGet("matches", "order=kickoff.asc");
        if (dbM && dbM.length > 0) {
          setMatches(dbM.filter(m => m && m.id).map(m => ({
            id:        m.id,
            home:      m.home_id    || "tbd",
            away:      m.away_id    || "tbd",
            stage:     m.stage      || "Group Stage",
            date:      m.match_date || "",
            kickoff:   m.kickoff    || null,
            status:    m.status     || "open",
            homeScore: m.home_score != null ? m.home_score : null,
            awayScore: m.away_score != null ? m.away_score : null,
          })));
        }

        // 3. Load or create elite assignment
        const dbE = await sbGet("elite_assign", "id=eq.1");
        if (dbE && dbE.length > 0) {
          setEliteAssign(dbE[0].assignment);
        } else {
          const fresh = buildRandomEliteAssign();
          await sbUpsert("elite_assign", { id: 1, assignment: fresh });
          setEliteAssign(fresh);
        }

        // 4. Load portfolios
        const dbPort = await sbGet("portfolios");
        if (dbPort && dbPort.length > 0) {
          const contenders = dbPort.filter(p => p && p.slot_type === "contender").map(p => p.team_id);
          const underdogs  = dbPort.filter(p => p && p.slot_type === "underdog").map(p => p.team_id);
          setClaimedTeams({ contenders, underdogs });
          setParticipants(prev => prev.map(p => ({
            ...p,
            portfolio: dbPort.filter(pt => pt && pt.user_id === p.name.toLowerCase()).map(pt => ({ team: pt.team_id, slot: pt.slot_type })),
          })));
        }

        // 5. Restore session
        if (savedUser) {
          const portCheck = await sbGet("portfolios", "user_id=eq." + savedUser.toLowerCase());
          if (!portCheck || portCheck.length === 0) {
            localStorage.removeItem("wc2026_user");
            setCurrentUser(null);
          } else {
            // Load their predictions
            const dbPred = await sbGet("predictions", "user_id=eq." + savedUser.toLowerCase());
            if (dbPred && dbPred.length > 0) {
              const predMap = {};
              dbPred.forEach(p => { predMap[p.match_id] = { outcome: p.outcome, pts: p.points_earned || 0 }; });
              setPredictions(predMap);
            }
          }
        }

      } catch(e) {
        console.error("Boot error:", e);
      }
      setLoading(false);
    }
    boot();
  }, []);

  // ── POLL FOR UPDATES EVERY 30 SECONDS ────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const poll = async () => {
      try {
        const dbP = await sbGet("participants");
        if (dbP && dbP.length > 0) {
          setParticipants(prev => prev.map(p => {
            const db = dbP.find(d => d && d.name === p.name);
            return db ? { ...p, teamPts: db.team_pts || 0, predPts: db.pred_pts || 0, challengePts: db.challenge_pts || 0, bonusPts: db.bonus_pts || 0 } : p;
          }));
        }
        const dbM = await sbGet("matches", "order=kickoff.asc");
        if (dbM && dbM.length > 0) {
          setMatches(dbM.filter(m => m && m.id).map(m => ({
            id: m.id, home: m.home_id || "tbd", away: m.away_id || "tbd",
            stage: m.stage || "Group Stage", date: m.match_date || "",
            kickoff: m.kickoff || null, status: m.status || "open",
            homeScore: m.home_score != null ? m.home_score : null,
            awayScore: m.away_score != null ? m.away_score : null,
          })));
        }
      } catch(e) { console.warn("Poll error:", e); }
    };
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // ── AUTO-LOCK PREDICTIONS AT KICK-OFF ────────────────────────
  const warnedRef = useRef(new Set());
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setMatches(prev => prev.map(m => {
        if (!m.kickoff || m.status !== "open") return m;
        const ko   = new Date(m.kickoff);
        const mins = Math.round((ko - now) / 60000);
        const h    = getTeam(m.home), a = getTeam(m.away);
        if (mins === 60 && !warnedRef.current.has(m.id + "_60")) {
          warnedRef.current.add(m.id + "_60");
          sendChat("⏰ *Prediction deadline in 60 minutes!*\n*" + h.name + " vs " + a.name + "* — lock in your pick now!");
        }
        if (mins === 15 && !warnedRef.current.has(m.id + "_15")) {
          warnedRef.current.add(m.id + "_15");
          sendChat("⏰ *FINAL 15 MINUTES!*\n*" + h.name + " vs " + a.name + "* kicks off soon — last chance! 🔒");
        }
        if (now >= ko) return { ...m, status: "locked" };
        return m;
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── HANDLERS ─────────────────────────────────────────────────

  const handleOnboardingComplete = async (name, portfolio) => {
    const userId = name.toLowerCase();
    // Save portfolio to Supabase
    for (const pt of portfolio) {
      const team = getTeam(pt.team);
      await sbUpsert("portfolios", {
        user_id:    userId,
        team_id:    pt.team,
        team_name:  team.name,
        slot_type:  pt.slot,
        multiplier: SLOT_MULT[pt.slot] || 1,
      });
    }
    setParticipants(prev => prev.map(p => p.name === name ? { ...p, portfolio } : p));
    setClaimedTeams(prev => ({
      contenders: [...prev.contenders, ...portfolio.filter(pt => pt.slot === "contender").map(pt => pt.team)],
      underdogs:  [...prev.underdogs,  ...portfolio.filter(pt => pt.slot === "underdog").map(pt => pt.team)],
    }));
    localStorage.setItem("wc2026_user", name);
    setCurrentUser(name);
    sendChat("🎉 *" + name + " has joined the competition!*\nTheir squad is locked in — let the games begin! ⚽");
  };

  const handleSavePrediction = async (matchId, outcome) => {
    const userId = currentUser.toLowerCase();
    await sbUpsert("predictions", { user_id: userId, match_id: matchId, outcome, points_earned: 0 });
    setPredictions(prev => ({ ...prev, [matchId]: { outcome, pts: 0 } }));
  };

  const handleRecordResult = async (matchId, homeScore, awayScore, stage) => {
    // Update match
    await sbUpdate("matches", "id=eq." + matchId, { status: "completed", home_score: homeScore, away_score: awayScore });
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: "completed", homeScore, awayScore } : m));

    const match        = matches.find(m => m.id === matchId);
    if (!match) return;
    const actualOutcome = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";
    const h             = getTeam(match.home), a = getTeam(match.away);
    let   chatMsg       = "⚽ *FULL TIME!*\n*" + h.name + " " + homeScore + "–" + awayScore + " " + a.name + "*\n\n";

    // Score predictions
    const dbPreds = await sbGet("predictions", "match_id=eq." + matchId + "&points_earned=eq.0");
    for (const pred of (dbPreds || [])) {
      const correct = pred.outcome === actualOutcome;
      if (correct) {
        await sbUpdate("predictions", "user_id=eq." + pred.user_id + "&match_id=eq." + matchId, { points_earned: 20 });
        const p = participants.find(p => p.name.toLowerCase() === pred.user_id);
        if (p) {
          const newPts = (p.predPts || 0) + 20;
          await sbUpdate("participants", "id=eq." + pred.user_id, { pred_pts: newPts });
          setParticipants(prev => prev.map(pp => pp.name.toLowerCase() === pred.user_id ? { ...pp, predPts: newPts } : pp));
          chatMsg += "✅ " + p.name + " *+20 pts* (correct pick)\n";
        }
      }
    }

    // Team progression points
    const winnerId = actualOutcome === "home" ? match.home : actualOutcome === "away" ? match.away : null;
    const teamsToAward = stage === "Group Stage" ? [match.home, match.away] : winnerId ? [winnerId] : [];
    const basePts = STAGE_PTS[stage] || 0;
    if (basePts > 0) {
      chatMsg += "\n📈 *Team Points:*\n";
      for (const teamId of teamsToAward) {
        const dbPort = await sbGet("portfolios", "team_id=eq." + teamId);
        for (const port of (dbPort || [])) {
          const mult = port.multiplier || 1;
          const pts  = basePts * mult;
          const p    = participants.find(pp => pp.name.toLowerCase() === port.user_id);
          if (p && pts > 0) {
            const newTeamPts = (p.teamPts || 0) + pts;
            await sbUpdate("participants", "id=eq." + port.user_id, { team_pts: newTeamPts });
            await sbInsert("points_log", { user_id: port.user_id, pts, reason: getTeam(teamId).name + " " + stage + " (" + basePts + "x" + mult + ")" });
            setParticipants(prev => prev.map(pp => pp.name.toLowerCase() === port.user_id ? { ...pp, teamPts: newTeamPts } : pp));
            chatMsg += "⭐ " + p.name + " *+" + pts + " pts* (" + getTeam(teamId).name + " " + basePts + "×" + mult + ")\n";
          }
        }
      }
    }

    // Updated standings
    const updated = await sbGet("participants");
    if (updated && updated.length > 0) {
      const sorted = [...updated].sort((a, b) => (b.team_pts + b.pred_pts + b.challenge_pts + b.bonus_pts) - (a.team_pts + a.pred_pts + a.challenge_pts + a.bonus_pts));
      chatMsg += "\n📊 *Standings:*\n";
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
      sorted.slice(0, 5).forEach((p, i) => {
        const tot = (p.team_pts || 0) + (p.pred_pts || 0) + (p.challenge_pts || 0) + (p.bonus_pts || 0);
        chatMsg += medals[i] + " " + p.name + " — *" + tot + " pts*\n";
      });
    }
    sendChat(chatMsg);
  };

  const handleAwardBonus = async (name, pts, reason) => {
    const p = participants.find(pp => pp.name === name);
    if (!p) return;
    const newBonus = (p.bonusPts || 0) + pts;
    await sbUpdate("participants", "id=eq." + name.toLowerCase(), { bonus_pts: newBonus });
    await sbInsert("points_log", { user_id: name.toLowerCase(), pts, reason: "Bonus: " + reason });
    setParticipants(prev => prev.map(pp => pp.name === name ? { ...pp, bonusPts: newBonus } : pp));
    sendChat("🎁 *Bonus Points!*\n*" + name + "* received *+" + pts + " pts*\nReason: " + reason);
  };

  const handleAdvanceTeam = async (teamId, stage) => {
    const team  = getTeam(teamId);
    const isElim = stage === "Eliminated";
    const dbPort = await sbGet("portfolios", "team_id=eq." + teamId);
    if (!dbPort || dbPort.length === 0) return;

    if (!isElim) {
      const basePts = STAGE_PTS[stage] || 0;
      for (const port of dbPort) {
        const mult = port.multiplier || 1;
        const pts  = basePts * mult;
        const p    = participants.find(pp => pp.name.toLowerCase() === port.user_id);
        if (p && pts > 0) {
          const newPts = (p.teamPts || 0) + pts;
          await sbUpdate("participants", "id=eq." + port.user_id, { team_pts: newPts });
          await sbInsert("points_log", { user_id: port.user_id, pts, reason: team.name + " reached " + stage });
          setParticipants(prev => prev.map(pp => pp.name.toLowerCase() === port.user_id ? { ...pp, teamPts: newPts } : pp));
        }
      }
      const owner = participants.find(p => p.name.toLowerCase() === dbPort[0].user_id);
      sendChat("🏆 *" + team.name + " advance to the " + stage + "!*\n" + (owner ? "⭐ " + owner.name + " earns points! (" + (STAGE_PTS[stage] || 0) + " × " + dbPort[0].multiplier + "×)" : ""));
    } else {
      const owner = participants.find(p => p.name.toLowerCase() === dbPort[0].user_id);
      sendChat("💀 *" + team.name + " are ELIMINATED!*\n" + (owner ? owner.name + "'s " + team.name + " are out." : ""));
    }
  };

  const handleAddChallengePoints = async (pts) => {
    if (!currentUser || pts <= 0) return;
    const p = participants.find(pp => pp.name === currentUser);
    if (!p) return;
    const newPts = (p.challengePts || 0) + pts;
    await sbUpdate("participants", "id=eq." + currentUser.toLowerCase(), { challenge_pts: newPts });
    setParticipants(prev => prev.map(pp => pp.name === currentUser ? { ...pp, challengePts: newPts } : pp));
  };

  // ── RENDER ───────────────────────────────────────────────────

  const NAV = [
    { id: "dashboard",   icon: "🏠", label: "Home"      },
    { id: "leaderboard", icon: "📊", label: "Standings"  },
    { id: "myteams",     icon: "👕", label: "My Teams"   },
    { id: "predictions", icon: "🎯", label: "Predict"    },
    { id: "challenge",   icon: "🎮", label: "Challenge", badge: true },
    ...(isAdmin ? [{ id: "admin", icon: "⚙️", label: "Admin" }] : []),
  ];

  if (loading) return (
    <React.Fragment>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 20 }}>
        <div style={{ fontSize: 72, animation: "float 2s ease infinite" }}>⚽</div>
        <div style={{ fontFamily: "var(--fd)", fontSize: 32, color: "var(--navy)", letterSpacing: 2 }}>LOADING...</div>
        <div style={{ color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>Connecting to competition</div>
        <div style={{ width: 200, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
          <div style={{ height: "100%", background: "var(--coral)", borderRadius: 3, animation: "loadbar 1.5s ease infinite" }} />
        </div>
      </div>
    </React.Fragment>
  );

  if (!currentUser) return (
    <React.Fragment>
      <style>{CSS}</style>
      <Onboarding
        onComplete={handleOnboardingComplete}
        claimedTeams={claimedTeams}
        eliteAssign={eliteAssign}
      />
    </React.Fragment>
  );

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <Dashboard   user={currentUser} participants={participants} matches={matches} setPage={setPage} showToast={showToast} />;
      case "leaderboard": return <Leaderboard user={currentUser} participants={participants} />;
      case "myteams":     return <MyTeams     user={currentUser} participants={participants} />;
      case "predictions": return <Predictions user={currentUser} matches={matches} predictions={predictions} onSavePrediction={handleSavePrediction} showToast={showToast} />;
      case "challenge":   return <Challenge   user={currentUser} participants={participants} showToast={showToast} onAddChallengePoints={handleAddChallengePoints} />;
      case "admin":       return <AdminPanel  user={currentUser} participants={participants} matches={matches} showToast={showToast} onRecordResult={handleRecordResult} onAwardBonus={handleAwardBonus} onAdvanceTeam={handleAdvanceTeam} />;
      default:            return <Dashboard   user={currentUser} participants={participants} matches={matches} setPage={setPage} showToast={showToast} />;
    }
  };

  return (
    <React.Fragment>
      <style>{CSS}</style>
      <Blobs />
      <div className="app" style={{ position: "relative", zIndex: 1 }}>
        <div className="sidebar">
          <div className="sb-logo">⚽<br />WC<br />2026</div>
          {NAV.map(item => (
            <div key={item.id} className={"ni " + (page === item.id ? "on" : "")} onClick={() => setPage(item.id)}>
              <span>{item.icon}</span>
              {item.badge && page !== item.id && <div style={{ position: "absolute", top: 7, right: 7, width: 10, height: 10, background: "var(--yellow)", borderRadius: "50%", border: "2px solid var(--navy)" }} />}
              <div className="tip">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="main">{renderPage()}</div>
        <div className="mnav">
          {NAV.map(item => (
            <div key={item.id} className={"mni " + (page === item.id ? "on" : "")} onClick={() => setPage(item.id)}>
              <div className="ico">{item.icon}</div>
              <div>{item.label}</div>
            </div>
          ))}
        </div>
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>
    </React.Fragment>
  );
}
