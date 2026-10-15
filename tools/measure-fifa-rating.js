// ЗАМЕР РЕЙТИНГА ГОДА «КАК В ФИФЕ» (15.10.2026) — откуда взяты доли в fifaYearPass (index.html).
//
// Честный замер: рейтинг человека на начало события — только по тому, что было ДО него, — против мест
//   • в гранд-финалах FNCS каждого набора и региона (2019–2026, 161 финал),
//   • на ЛАНах: Invitational 2022, Копенгаген 2023, Форт-Уэрт 2024, Лион 2025, Саммит, EWC (Reload) и Антверпен 2026,
//   • в финалах World Cup 2019 (соло и дуо, общий порядок Liquipedia).
// Спирмен «средний рейтинг команды ↔ место» на каждом событии, среднее по событиям года, среднее по годам.
// Бутстрэп — по годам (2000 выборок лет с возвращением): доля выборок, где вариант лучше.
// ЛОВУШКА бутстрэпа по годам: правка, которая трогает только 2 года из 8 (2025–2026), не может набрать больше ~90%
// — в 10% выборок этих лет нет вовсе ((6/8)^8). 89–90% у такой правки = «лучше везде, где её видно».
//
// Числа событий — _eventOvr карточек (что вечер стоил сам по себе) и этапы книг 2025–2026 (_ratingParts);
// fifaYearPass их не меняет, поэтому замер одинаков до и после правки. Места: realGf / _xxGf карточек, таблицы ЛАНов.
// Статы — командные строки события (килы за игру, среднее место, доля побед): личных в выгрузках Tracker нет.
//
//   node tools/measure-fifa-rating.js            — таблица: нынешняя формула, ФИФА и что даёт каждая часть
//   node tools/measure-fifa-rating.js --grid     — сетки долей (прошлый сезон, опыт, неотбор, статы)
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

// ---------------------------------------------------------------- 1. карточки из страницы
const BOOT = `
<pre id="__dump" style="display:none"></pre>
<script>
(function(){
  var out = { cards: [], lans: {} };
  try {
    var pick = function(o){ if(!o || typeof o!=='object') return null; return {rank:o.rank, pts:o.pts, m:o.matches, w:o.wins, k:o.avgElims, ap:o.avgPlace, duo:o.duo, stage:o.stage}; };
    var entry = function(s){ try { var j = typeof s==='string' ? JSON.parse(s) : s; return j && j.entry ? pick(j.entry) : null; } catch(e){ return null; } };
    PLAYERS_BASE.forEach(function(p){
      if(p.tier!=='cardmode') return;
      var c = { s:p.cardSet, r:p.region, h:p.handle, l:p.liquiName||null, ev:p.event, pl:p.placement,
        st:p._t1Stage||p._rStage||(p.real&&p.real.stage)||'', rt:p.rating, eo:p._eventOvr, re:pick(p.real), gf:pick(p.realGf) };
      var e = entry(p._t1) || entry(p._dv) || entry(p._r); if(e) c.en = e;
      for (var k in p) if(/^_[a-z]\\d(Gf|Playin|Lcq|Lcq1)$/.test(k) && p[k] && typeof p[k]==='object') (c.x=c.x||{})[k]=pick(p[k]);
      if(p._ratingParts){ try { var rp = typeof p._ratingParts==='string' ? JSON.parse(p._ratingParts) : p._ratingParts;
        c.parts = rp.parts.map(function(x){ return [x.label, x.nth, x.rank, x.field, Math.round(x.score*100)/100, x.weight]; }); } catch(e){} }
      out.cards.push(c);
    });
    out.lans = { GC2023: GC2023_RANKED, INV2022: INV2022_RANKED, GC2024: GC2024_RANKED, GC2025: GC2025_RANKED, WC2019: WC2019_FIELD };
    out.REGION_TOP = REGION_TOP;
  } catch (e) { out = { __error: String(e && e.stack || e) }; }
  document.getElementById('__dump').textContent = 'BE'+'GINDUMP' + encodeURIComponent(JSON.stringify(out)) + 'EN'+'DDUMP';
})();
<\/script>`;
function dumpCards() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fifa-measure-'));
  const tmp = path.join(tmpDir, 'index.html');
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!/<base /.test(html)) html = html.replace('<head>', '<head><base href="file:///' + ROOT.replace(/\\/g, '/') + '/">');
  fs.writeFileSync(tmp, html + BOOT);
  const dom = execFileSync(CHROME, ['--headless=new', '--user-data-dir=' + path.join(tmpDir, 'ud'), '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
    { maxBuffer: 1024 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const m = dom.match(/BEGINDUMP([\s\S]*?)ENDDUMP/);
  if (!m) throw new Error('no dump marker — the page threw before the bootstrap ran (copy at ' + tmp + ')');
  const J = JSON.parse(decodeURIComponent(m[1]));
  if (J.__error) throw new Error(J.__error);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  // Саммит, EWC 2026 и Антверпен живут внутри замыканий — берутся из исходника.
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const grab = name => { const i = src.indexOf('const ' + name + '='); if (i < 0) throw new Error('no ' + name);
    let j = src.indexOf('=', i) + 1, depth = 0, k = j, inStr = null;
    for (; k < src.length; k++) { const ch = src[k];
      if (inStr) { if (ch === '\\') { k++; continue; } if (ch === inStr) inStr = null; continue; }
      if (ch === '"' || ch === "'") { inStr = ch; continue; }
      if (ch === '{' || ch === '[') depth++;
      if (ch === '}' || ch === ']') { depth--; if (depth === 0) { k++; break; } } }
    return eval('(' + src.slice(j, k) + ')'); };
  J.L26 = { SUMMIT: grab('SUMMIT_RANK'), RC26: grab('RC_TEAMS_2026'), GC26: grab('GC26_RANK') };
  return J;
}

// ---------------------------------------------------------------- 2. лента результатов
const SET_T = { h1: 2019.55, h2: 2019.56, h3: 2019.75, h4: 2019.9, i1: 2020.3, i2: 2020.55, i3: 2020.8,
  j1: 2021.25, j2: 2021.45, j3: 2021.65, j4: 2021.85, k1: 2022.2, k2: 2022.45, k3: 2022.7,
  e1: 2023.25, e2: 2023.5, e3: 2023.7, f1: 2024.2, f2: 2024.4, f3: 2024.6, t1: 2025.15, t2: 2025.35, t3: 2025.55,
  m1: 2026.2, m2: 2026.55 };
const YEAR = s => Math.floor(SET_T[s]);
const FNCS_SETS = Object.keys(SET_T);
const WC = s => s === 'h1' || s === 'h2';
// Финалы World Cup — это и есть гранд-финалы h1/h2: срез прямо перед ними.
const LANS_T = { WC19S: 2019.549, WC19D: 2019.549, INV2022: 2022.87, GC2023: 2023.78, GC2024: 2024.69, GC2025: 2025.68, SUMMIT26: 2026.25, EWC26: 2026.64, GC26: 2026.74 };
const LATE_T = { lan: 2026.25, rc: 2026.64, gc26: 2026.74, 'Global Championship': 2025.68 };
const norm = h => String(h || '').toLowerCase().replace(/[ǃ!]/g, '!').trim();
const keyOf = (r, h) => r + '|' + norm(h);
const FINAL_LABELS = /^(gf|lan|rc|gc26|Grand Finals|Global Championship)$/;

function build(J) {
  const C = J.cards;
  const gfOf = c => c.gf && c.gf.rank ? c.gf : (c.x ? (Object.entries(c.x).find(([k]) => /Gf$/.test(k)) || [])[1] : null);
  const evKey = c => c.s + '|' + c.r + '|' + String(c.ev).replace(/\s*\(.*\)$/, '');
  // Оценка квалификации у финалиста 2019–2024: место → число события, выученное по тем, кто в финал не прошёл.
  const maps = {};
  C.forEach(c => { if (!FNCS_SETS.includes(c.s) || c.parts || c.st === 'G' || c.eo == null || !c.pl) return;
    (maps[evKey(c)] = maps[evKey(c)] || []).push([c.pl, c.eo]); });
  const qualScore = c => { const m = maps[evKey(c)]; if (!m || !c.pl) return null;
    const near = m.filter(([p]) => Math.abs(p - c.pl) <= 2); if (near.length) return near.reduce((s, x) => s + x[1], 0) / near.length;
    let best = null, bd = 1e9; m.forEach(([p, e]) => { const d = Math.abs(p - c.pl); if (d < bd) { bd = d; best = e; } }); return best; };
  const partsMean = (parts, keep) => { let s = 0, w = 0; parts.forEach(p => { if (keep(p[0])) { s += p[4] * p[5]; w += p[5]; } }); return w ? s / w : null; };
  const P = {}, finals = {};
  const rec = k => (P[k] = P[k] || { key: k, sets: {} });
  C.forEach(c => {
    if (!FNCS_SETS.includes(c.s)) return;
    const k = keyOf(c.r, c.h), g = gfOf(c), isG = !!(g && g.rank);
    let pre, full;
    if (c.parts) { pre = partsMean(c.parts, l => !FINAL_LABELS.test(l)); full = partsMean(c.parts, l => !/^(lan|rc|gc26|Global Championship)$/.test(l)); }
    else { full = c.eo != null ? c.eo : c.rt; pre = isG ? (/Grand Finals/.test(c.ev) ? null : qualScore(c)) : full; }
    const cur = rec(k).sets[c.s];
    if (cur && cur.gfRank && !isG) return;
    const stats = c.re && !/Gf|^G$/.test(String(c.re.stage || '')) && !/Grand Finals/.test(c.ev) ? c.re : null;
    rec(k).sets[c.s] = { s: c.s, r: c.r, pre, full, gfRank: isG ? g.rank : null, stage: isG ? 'G' : (c.st || ''), stats, parts: c.parts || null, l: c.l };
    if (isG) (finals[c.s + '|' + c.r] = finals[c.s + '|' + c.r] || []).push({ key: k, rank: g.rank });
  });
  Object.keys(finals).forEach(fk => { const seen = new Set(); finals[fk] = finals[fk].filter(x => !seen.has(x.key) && seen.add(x.key)); });
  const byHandle = {};
  Object.values(P).forEach(p => { const h = p.key.slice(p.key.indexOf('|') + 1); (byHandle[h] = byHandle[h] || []).push(p);
    Object.values(p.sets).forEach(x => { if (x.l && norm(x.l) !== h) (byHandle[norm(x.l)] = byHandle[norm(x.l)] || []).push(p); }); });
  const resolve = (name, year) => { const c = byHandle[norm(name)] || []; if (!c.length) return null; if (c.length === 1) return c[0].key;
    const sc = p => Object.values(p.sets).filter(x => YEAR(x.s) === year).reduce((a, x) => a + (x.gfRank ? 10 : 1), 0);
    return [...c].sort((a, b) => sc(b) - sc(a))[0].key; };
  const split = s => s.split(/\s*&\s*/);
  const lanEvents = [];
  const push = (name, entries) => lanEvents.push({ name, t: LANS_T[name], year: Math.floor(LANS_T[name]), entries });
  push('INV2022', J.lans.INV2022.map(e => ({ names: split(e.duo), rank: e.rank })));
  push('GC2023', J.lans.GC2023.map(e => ({ names: split(e.duo), rank: e.rank })));
  push('GC2024', J.lans.GC2024.map(e => ({ names: split(e.duo), rank: e.rank })));
  push('GC2025', J.lans.GC2025.map(e => ({ names: split(e.trio), rank: e.rank })));
  push('WC19S', J.lans.WC2019.h1.map((e, i) => ({ names: e, rank: i + 1 })));
  push('WC19D', J.lans.WC2019.h2.map((e, i) => ({ names: e, rank: i + 1 })));
  { const byR = {}; Object.entries(J.L26.SUMMIT).forEach(([h, r]) => (byR[r] = byR[r] || []).push(h));
    push('SUMMIT26', Object.entries(byR).map(([r, names]) => ({ names, rank: +r }))); }
  push('EWC26', J.L26.RC26.map(e => ({ names: e.d, rank: parseInt(e.p, 10), region: e.r })));
  { const byR = {}; Object.entries(J.L26.GC26).forEach(([reg, m]) => Object.entries(m).forEach(([h, r]) => (byR[r] = byR[r] || []).push({ h, reg })));
    push('GC26', Object.entries(byR).map(([r, xs]) => ({ names: xs.map(x => x.h), regs: xs.map(x => x.reg), rank: +r }))); }
  lanEvents.forEach(ev => ev.entries.forEach(e => { e.keys = e.names.map((n, i) => { const reg = (e.regs && e.regs[i]) || e.region;
    if (reg && P[keyOf(reg, n)]) return keyOf(reg, n); return resolve(n, ev.year); }).filter(Boolean); }));
  const lanAppear = {};
  lanEvents.forEach(ev => ev.entries.forEach(e => e.keys.forEach(k => (lanAppear[k] = lanAppear[k] || []).push(ev.t))));
  // Чистый год человека и выравнивание прошлого сезона на шкалу года по месту в очереди (как alignPrev в fifaYearPass).
  const pure = {}, AL = {};
  Object.values(P).forEach(p => { const by = {}; Object.values(p.sets).forEach(x => (by[YEAR(x.s)] = by[YEAR(x.s)] || []).push([x.full, x.parts ? 2.0 : stageW(x.s, x.stage)]));
    pure[p.key] = {}; Object.keys(by).forEach(y => pure[p.key][y] = wmean(by[y])); });
  Object.entries(pure).forEach(([k, py]) => { const r = k.split('|')[0]; Object.keys(py).forEach(ys => { const y = +ys;
    for (const back of [1, 2]) if (py[y - back] != null) { const m = AL[r + '|' + y + '|' + back] = AL[r + '|' + y + '|' + back] || { a: [], b: [] }; m.a.push(py[y - back]); m.b.push(py[y]); break; } }); });
  Object.values(AL).forEach(m => { m.a.sort((x, y) => x - y); m.b.sort((x, y) => x - y); });
  const align = (key, Y) => { const py = pure[key] || {}, back = py[Y - 1] != null ? 1 : py[Y - 2] != null ? 2 : 0; if (!back) return null;
    const v = py[Y - back], m = AL[key.split('|')[0] + '|' + Y + '|' + back]; if (!m || m.a.length < 10) return v;
    let i = 0; while (i < m.a.length && m.a[i] < v) i++; return m.b[Math.min(m.b.length - 1, Math.round(i / (m.a.length - 1) * (m.b.length - 1)))]; };
  return { P, finals, lanEvents, lanAppear, align };
}

// ---------------------------------------------------------------- 3. признаки и модель
const stageW = (s, st) => st === 'G' ? (WC(s) ? 8.0 : 2.0) : st === 'P' ? (WC(s) ? 0.6 : 0.9) : (WC(s) ? 0.4 : 0.5);
const wmean = a => { let s = 0, w = 0; a.forEach(([v, k]) => { if (v != null) { s += v * k; w += k; } }); return w ? s / w : null; };
function setScoreBefore(x, t) {
  const T = SET_T[x.s];
  if (x.parts) { let s = 0, w = 0;
    x.parts.forEach(p => { const pt = LATE_T[p[0]] != null ? LATE_T[p[0]] : /^(gf|Grand Finals)$/.test(p[0]) ? T : T - 0.03; if (pt < t) { s += p[4] * p[5]; w += p[5]; } });
    return w ? { v: s / w, final: t > T && !!x.gfRank } : null; }
  if (t > T) return { v: x.full, final: !!x.gfRank };
  if (t > T - 0.03 && x.pre != null) return { v: x.pre, final: false };
  return null;
}
function feats(D, key, t, ts) {
  const p = D.P[key]; if (!p) return null;
  const Y = Math.floor(t), sets = Object.values(p.sets), f = {};
  const own = ts ? p.sets[ts] : null;
  f.inPre = own ? own.pre : null; f.inStats = own ? own.stats : null;
  f.yr = [];
  sets.forEach(x => { if (YEAR(x.s) !== Y || x.s === ts) return; const sc = setScoreBefore(x, t); if (!sc) return;
    f.yr.push([sc.v, x.parts ? 2.0 : stageW(x.s, sc.final ? 'G' : (x.stage === 'G' ? 'P' : x.stage))]); });
  const lat = sets.filter(x => YEAR(x.s) === Y && x.s !== ts && setScoreBefore(x, t)).sort((a, b) => SET_T[b.s] - SET_T[a.s])[0];
  f.latest = lat ? setScoreBefore(lat, t).v : null;
  f.prevYear = null;
  for (const back of [1, 2]) { const v = wmean(sets.filter(x => YEAR(x.s) === Y - back).map(x => [x.full, x.parts ? 2.0 : stageW(x.s, x.stage)])); if (v != null) { f.prevYear = v; break; } }
  f.prevAl = f.prevYear != null ? D.align(key, Y) : null;
  f.expGF = sets.filter(x => x.gfRank && SET_T[x.s] < t - 0.001 && x.s !== ts).length;
  f.expLAN = (D.lanAppear[key] || []).filter(tt => tt < t - 0.001).length;
  f.missNoCard = 0; f.missCard = 0;
  const reg = key.split('|')[0];
  FNCS_SETS.forEach(s => { if (YEAR(s) !== Y || s === ts || SET_T[s] >= t || !D.finals[s + '|' + reg]) return;
    const x = p.sets[s]; if (!x) f.missNoCard++; else if (!x.gfRank) f.missCard++; });
  f.activeYear = sets.some(x => YEAR(x.s) === Y && SET_T[x.s] - 0.03 < t);
  return f;
}
function rating(f, cfg, ctx) {
  if (!f) return null;
  const Y = ctx.year; let S;
  if (cfg.mode === 'current' || (cfg.cur2526 && Y >= 2025)) {
    // Нынешняя формула сайта: 2019–2024 — год «только вверх» от своего события; 2025–2026 — книга своего Мейджора.
    if (ctx.kind === 'gf') { if (Y <= 2024) { const m = wmean(f.yr.concat(f.inPre != null ? [[f.inPre, 0.9]] : [])); S = f.inPre != null && m != null ? Math.max(f.inPre, m) : (m != null ? m : f.inPre); } else S = f.inPre; }
    else S = Y <= 2024 ? wmean(f.yr) : f.latest;
  } else {
    const yr = f.yr.slice();
    if (ctx.kind === 'gf' && f.inPre != null) yr.push([f.inPre, 0.9]);
    if (cfg.missLo != null && f.activeYear) { const n = (cfg.missNoCard ? f.missNoCard : 0) + (cfg.missCard ? f.missCard : 0); for (let i = 0; i < n; i++) yr.push([cfg.missLo, cfg.missW || 2.0]); }
    if (cfg.onlyUp && ctx.kind === 'gf' && (Y <= 2024 || cfg.upAll)) { const m = wmean(yr); S = f.inPre != null && m != null ? Math.max(f.inPre, m) : m; }
    else S = wmean(yr);
  }
  let v = S;
  const prev = cfg.align ? f.prevAl : f.prevYear;
  if (cfg.pw && prev != null) v = v == null ? prev : (1 - cfg.pw) * v + cfg.pw * prev;
  if (v == null) return null;
  if (cfg.expK) v += cfg.expK * Math.min(cfg.expCap || 99, (cfg.expGF ? f.expGF : 0) + (cfg.expLAN ? f.expLAN : 0));
  if (cfg.sm && ctx.statOvr != null) v = (1 - cfg.sm) * v + cfg.sm * ctx.statOvr;
  return v;
}
function events(D) {
  const evs = [];
  Object.entries(D.finals).forEach(([fk, list]) => { const [s] = fk.split('|');
    const byRank = {}; list.forEach(x => (byRank[x.rank] = byRank[x.rank] || []).push(x.key));
    const teams = Object.entries(byRank).map(([rk, keys]) => ({ rank: +rk, keys }));
    if (teams.length >= 6) evs.push({ kind: 'gf', name: fk, s, year: YEAR(s), t: SET_T[s], teams }); });
  D.lanEvents.forEach(ev => { const teams = ev.entries.filter(e => e.keys.length).map(e => ({ rank: e.rank, keys: e.keys }));
    if (teams.length >= 6) evs.push({ kind: 'lan', name: ev.name, year: ev.year, t: ev.t, teams }); });
  const pctOf = (rows, get) => { const vals = rows.map(get), ok = vals.filter(v => v != null).sort((a, b) => a - b);
    return vals.map(v => { if (v == null || ok.length < 2) return null; let a = 0; while (a < ok.length && ok[a] < v) a++; let b = a; while (b < ok.length && ok[b] === v) b++; return ((a + b) / 2) / ok.length; }); };
  evs.forEach(ev => {
    ev.teams.forEach(tm => { tm.f = tm.keys.map(k => feats(D, k, ev.t, ev.kind === 'gf' ? ev.s : null)); });
    if (ev.kind !== 'gf') return;
    const flat = []; ev.teams.forEach(tm => tm.keys.forEach((k, i) => flat.push({ tm, i, st: tm.f[i] && tm.f[i].inStats })));
    const ok = x => x.st && x.st.m;
    const pk = pctOf(flat, x => ok(x) ? x.st.k : null), pa = pctOf(flat, x => ok(x) ? -x.st.ap : null), pw = pctOf(flat, x => ok(x) ? x.st.w / x.st.m : null);
    flat.forEach((x, j) => { const a = [pk[j], pa[j], pw[j]].filter(v => v != null); (x.tm.so = x.tm.so || [])[x.i] = a.length ? 60 + 36 * a.reduce((s, v) => s + v, 0) / a.length : null; });
  });
  return evs;
}
const rankOf = a => { const s = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = []; for (let i = 0; i < s.length;) { let j = i; while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++; for (let k = i; k <= j; k++) r[s[k][1]] = (i + j) / 2; i = j + 1; } return r; };
const spearman = (a, b) => { const ra = rankOf(a), rb = rankOf(b), n = a.length, ma = ra.reduce((x, y) => x + y) / n, mb = rb.reduce((x, y) => x + y) / n;
  let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (ra[i] - ma) * (rb[i] - mb); va += (ra[i] - ma) ** 2; vb += (rb[i] - mb) ** 2; } return va && vb ? c / Math.sqrt(va * vb) : NaN; };
function perYear(evs, cfg, filter) {
  const by = {};
  evs.forEach(ev => { if (filter && !filter(ev)) return;
    const xs = [], ys = [];
    ev.teams.forEach(tm => { const vs = tm.keys.map((k, i) => rating(tm.f[i], cfg, { kind: ev.kind, year: ev.year, statOvr: tm.so ? tm.so[i] : null }));
      const v = vs.map(x => x == null ? 40 : x); xs.push(v.reduce((a, b) => a + b, 0) / v.length); ys.push(-tm.rank); });
    const r = spearman(xs, ys); if (!isNaN(r)) (by[ev.year] = by[ev.year] || []).push(r); });
  const out = {}; Object.entries(by).forEach(([y, a]) => out[y] = a.reduce((s, v) => s + v, 0) / a.length); return out;
}
const meanOf = (py, ys) => { let s = 0, n = 0; (ys || Object.keys(py)).forEach(y => { if (py[y] != null) { s += py[y]; n++; } }); return s / n; };
function boot(evs, a, b, R = 2000) {
  const A = perYear(evs, a), B = perYear(evs, b), ys = Object.keys(A);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; let better = 0;
  for (let i = 0; i < R; i++) { const s = ys.map(() => ys[Math.floor(rnd() * ys.length)]); if (meanOf(B, s) > meanOf(A, s)) better++; }
  return better / R;
}

// ---------------------------------------------------------------- 4. отчёт
const CURRENT = { mode: 'current' };
const FIFA = { mode: 'fifa', onlyUp: true, align: true, pw: 0.4, expK: 1.5, expCap: 2, expGF: true, expLAN: true, sm: 0.1 };
if (require.main === module) {
  const J = dumpCards(), D = build(J), evs = events(D);
  const gf = e => e.kind === 'gf', lan = e => e.kind === 'lan';
  const line = (name, cfg, ref) => { const py = perYear(evs, cfg);
    console.log(name.padEnd(36), meanOf(py).toFixed(3), ' финалы', meanOf(perYear(evs, cfg, gf)).toFixed(3), ' ЛАНы', meanOf(perYear(evs, cfg, lan)).toFixed(3),
      ref ? '  лучше, чем ' + ref.word + ', в ' + Math.round(boot(evs, ref.cfg, cfg) * 100) + '% выборок' : '', ' |', Object.entries(py).map(([y, v]) => y.slice(2) + ':' + v.toFixed(2)).join(' ')); };
  console.log('событий', evs.length, '(финалов FNCS', evs.filter(gf).length + ', ЛАНов и World Cup', evs.filter(lan).length + ')');
  line('нынешняя формула', CURRENT);
  line('ФИФА (всё вместе)', FIFA, { cfg: CURRENT, word: 'нынешняя' });
  line('  без прошлого сезона', { ...FIFA, pw: 0 }, { cfg: FIFA, word: 'ФИФА' });
  line('  прошлый сезон без выравнивания шкалы', { ...FIFA, align: false }, { cfg: FIFA, word: 'ФИФА' });
  line('  без опыта', { ...FIFA, expK: 0 }, { cfg: FIFA, word: 'ФИФА' });
  line('  без статов', { ...FIFA, sm: 0 }, { cfg: FIFA, word: 'ФИФА' });
  line('  без года в 2025–2026', { ...FIFA, cur2526: true }, { cfg: FIFA, word: 'ФИФА' });
  line('  + неотбор в финал (лучший)', { ...FIFA, missLo: 50, missW: 0.5, missNoCard: true }, { cfg: FIFA, word: 'ФИФА' });
  if (process.argv.includes('--grid')) {
    const base = { mode: 'fifa', onlyUp: true };
    for (const pw of [0.2, 0.3, 0.4, 0.5, 0.6]) line('прошлый сезон ' + pw, { ...base, pw }, { cfg: base, word: 'шаг до' });
    const S1 = { ...base, pw: 0.4 };
    for (const k of [0.5, 1, 1.5, 2]) for (const cap of [2, 4, 99]) line(`опыт +${k} до ${cap}`, { ...S1, expK: k, expCap: cap, expGF: true, expLAN: true }, { cfg: S1, word: 'шаг до' });
    const S2 = { ...S1, expK: 1.5, expCap: 2, expGF: true, expLAN: true };
    for (const [nc, c] of [[1, 0], [0, 1], [1, 1]]) for (const lo of [50, 60, 70]) for (const w of [0.5, 1, 2])
      line(`неотбор без карты${nc} с картой${c} ${lo}×${w}`, { ...S2, missLo: lo, missW: w, missNoCard: !!nc, missCard: !!c }, { cfg: S2, word: 'шаг до' });
    for (const sm of [0.05, 0.1, 0.2, 0.3]) line('статы ' + sm, { ...S2, sm }, { cfg: S2, word: 'шаг до' });
  }
}
module.exports = { dumpCards, build, events, perYear, boot, rating, CURRENT, FIFA };
