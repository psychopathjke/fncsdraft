// Черты игроков (29.10, идея игрока из Notion 27.10 скрин 19: «peterbot would have w keyer because he always fights»).
// Мерка — с настоящих таблиц, а не на глаз: у каждой карточки доля очков с киллов (ср. киллы / ср. очки за матч),
// процентиль внутри своего лобби (событие + этап + регион: множитель киллов у всех один), среднее по всем турнирам
// игрока. Верхние ~15% (≥ HI) — W-key, нижние ~15% (≤ LO) — игра на место; минимум MIN_N турниров.
// Замер 29.10: Peterbot 0.74, Veno/Vic0 0.72, Malibuca 0.71 — W-key; Kami 0.32, Saf 0.34, Zayt 0.22 — на место.
// Пишет в index.html блок CC_PLAYER_TRAIT: ник в нижнем регистре → доля (две цифры), только у кого есть черта.
//   node tools/build-player-traits.js
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const F = path.join(ROOT, 'index.html');
const HI = 0.65, LO = 0.35, MIN_N = 4, MIN_LOBBY = 20;
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `<script>
window.addEventListener("load", function(){ setTimeout(function(){
  var out={rows:[], err:null};
  try{
    PLAYERS_BASE.forEach(function(p){
      if(!p || !p.handle || p.tier==="qualifier" || !p.real) return;
      var r=p.real; if(!(r.matches>0) || !(r.pts>0) || r.avgElims==null) return;
      out.rows.push([String(p.handle).toLowerCase(), (p.event||"")+"|"+(r.stage||"")+"|"+(p.region||""), r.avgElims/(r.pts/r.matches)]);
    });
  }catch(e){ out.err=String(e && e.stack || e); }
  var pre=document.createElement("pre"); pre.id="__out"; pre.textContent="@@B@@"+encodeURIComponent(JSON.stringify(out))+"@@E@@";
  document.body.appendChild(pre);
}, 800); });
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traits-')), tmp = path.join(dir, 'index.html');
const html = fs.readFileSync(F, 'utf8');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + html.replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--user-data-dir=' + path.join(dir, 'prof'), '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')],
    { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/@@B@@([^@<]*)@@E@@<\/pre>/);
if (!m) throw new Error('страница не отдала данные');
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) throw new Error(out.err);
const lobbies = new Map();
out.rows.forEach(([h, k, v]) => { if (!lobbies.has(k)) lobbies.set(k, []); lobbies.get(k).push([h, v]); });
const by = new Map();
lobbies.forEach(L => {
  if (L.length < MIN_LOBBY) return;
  const s = L.map(x => x[1]).sort((a, b) => a - b);
  L.forEach(([h, v]) => { let lo = 0, hi = s.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (s[mid] < v) lo = mid + 1; else hi = mid; }
    if (!by.has(h)) by.set(h, []); by.get(h).push(lo / (s.length - 1)); });
});
const T = {}; let key = 0, chill = 0, all = 0;
[...by.keys()].sort().forEach(h => {
  const a = by.get(h); if (a.length < MIN_N) return; all++;
  const v = a.reduce((x, y) => x + y, 0) / a.length;
  if (v >= HI) { T[h] = +v.toFixed(2); key++; } else if (v <= LO) { T[h] = +v.toFixed(2); chill++; }
});
const A = '// ==== CC_PLAYER_TRAIT (tools/build-player-traits.js) ====\n', B = '// ==== /CC_PLAYER_TRAIT ====';
const i = html.indexOf(A), j = html.indexOf(B);
if (i < 0 || j < i) throw new Error('markers');
fs.writeFileSync(F, html.slice(0, i + A.length) + 'const CC_PLAYER_TRAIT=' + JSON.stringify(T) + ';\n' + html.slice(j));
console.log('players ' + all + ' · W-key ' + key + ' · placement ' + chill + ' · ' + JSON.stringify(T).length + ' bytes');
