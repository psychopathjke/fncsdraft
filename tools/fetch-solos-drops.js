// Настоящие дропы финала FNCS Solos 2026 с карты eucompetitive.com (25.10, его ссылка на /maps/CH7S4/S42_FNCSSolo_Final_Day1_EU).
//
// Там на каждую игру финала рисуют коробки с никами, кто куда падает: tournamentmaps/api/load.php?mapId=<окно>,
// коробки в квадрате 800×800 поверх их карты 1600×1600. Наша карта острова (art/map-s42.jpg, 921×843) обрезана
// иначе — перевод линейный, подобран по пяти ориентирам (Пакман, два призрака, кольцо Вонкиленда, воронка
// в центре), остаток 2–10 px из 921. Ники у них — капсом и без клана («VINQ» против «Clue Vinq»), поэтому сначала
// id аккаунта из их же списка игроков (get_players_all.php), потом совпадение и вхождение ника.
//
// Регион без карты (её ещё не нарисовали) просто пропускается: прогноз для него берёт точки, выбранные движком.
//
//   node tools/fetch-solos-drops.js   → tools/measured/solos-2026-drops.json
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FINAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/measured/solos-2026-final.json'), 'utf8'));
const OUT = path.join(ROOT, 'tools/measured/solos-2026-drops.json');
const BASE = 'https://eucompetitive.com';
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
// Их пиксели 1600 → наши проценты карты 921×843.
const FIT = { ax: 0.54128, bx: 47.745, ay: 0.52567, by: 4.578, W: 921, H: 843 };
const toPct = (v, a, b, S) => +((a * v * 2 + b) / S * 100).toFixed(2);

const CYR = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'к': 'k', 'м': 'm', 'т': 't', 'в': 'b', 'н': 'h', 'і': 'i' };
const norm = s => String(s).replace(/[а-яі]/gi, c => CYR[c.toLowerCase()] || c).toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]/g, '');
const prefix = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };

/* Vital Scrims (25.10, его «найди карты других регионов»): у них карты гранд-финалов NAC, NAW, ME, OCE.
   Страница за проверкой Cloudflare, поэтому снимок берётся браузером (Playwright: snapshotData в пропсах React
   на vitalscrims.com/competitive/<id>) и кладётся в tools/measured/solos-2026-vital-raw.json — {REG:{players:
   [{id, users, marker:{coordinates:[[lat,lng]…]}}], contested:[id…]}}. id — аккаунт Epic без дефисов, ники не нужны.
   Их мир 256×256 (lng вправо, lat вниз с минусом), на нашу карту — по тем же пяти ориентирам (остаток 1–7 px).
   У каждого игрока свой контур; кто в списке contested и чьи контуры пересекаются — одна коробка. */
const VITAL = path.join(ROOT, 'tools/measured/solos-2026-vital-raw.json');
const VFIT = { ax: 0.9712 * 4, bx: 30.24, ay: -0.9591 * 4, by: -68.41 };
function vitalRegion(reg, fin) {
  if (!fs.existsSync(VITAL)) return null;
  const V = JSON.parse(fs.readFileSync(VITAL, 'utf8'))[reg];
  if (!V || !V.players) return null;
  const byId = new Map(fin.map(f => [String(f.id).replace(/-/g, ''), f]));
  const hot = new Set(V.contested || []);
  const items = V.players.filter(p => p.marker && p.marker.coordinates && p.marker.coordinates.length && byId.has(p.id)).map(p => {
    const xs = p.marker.coordinates.map(c => (VFIT.ax * c[1] + VFIT.bx) / FIT.W * 100), ys = p.marker.coordinates.map(c => (VFIT.ay * c[0] + VFIT.by) / FIT.H * 100);
    return { id: p.id, f: byId.get(p.id), tag: (p.users && p.users[0] && p.users[0].name) || byId.get(p.id).n,
      x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const cross = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const root = items.map((_, i) => i), find = i => root[i] === i ? i : (root[i] = find(root[i]));
  items.forEach((a, i) => items.forEach((b, j) => { if (j > i && hot.has(a.id) && hot.has(b.id) && cross(a, b)) root[find(j)] = find(i); }));
  const groups = new Map(); items.forEach((it, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(it); });
  const boxes = [...groups.values()].map(g => {
    const x0 = Math.min(...g.map(t => t.x0)), x1 = Math.max(...g.map(t => t.x1)), y0 = Math.min(...g.map(t => t.y0)), y1 = Math.max(...g.map(t => t.y1));
    return { x: +x0.toFixed(2), y: +y0.toFixed(2), w: +(x1 - x0).toFixed(2), h: +(y1 - y0).toFixed(2), ids: g.map(t => t.f.id), tags: g.map(t => t.tag) };
  });
  const seated = new Set(items.map(t => t.f.id));
  return { day: 1, updated: null, source: 'vitalscrims', boxes, unmatched: [], missing: fin.filter(f => !seated.has(f.id)).map(f => f.n) };
}

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 fncsdraft' } });
  if (!r.ok) throw new Error(url + ': ' + r.status);
  return r.json();
}

(async () => {
  const players = await get(BASE + '/get_players_all.php');
  const idsOf = new Map();   // ник у них → id аккаунтов (тёзки бывают)
  (Array.isArray(players) ? players : players.data || []).forEach(p => {
    const k = norm(p.NAME); if (!idsOf.has(k)) idsOf.set(k, []); idsOf.get(k).push(String(p.ID).replace(/-/g, ''));
  });
  const out = { source: BASE + '/maps', fetched: new Date().toISOString(), fit: FIT, regions: {} };
  for (const reg of REGS) {
    const fin = FINAL.regions[reg].finalists;
    let day = null, shapes = null, updated = null;
    for (const d of [1, 2]) {
      const j = await get(BASE + '/tournamentmaps/api/load.php?mapId=S42_FNCSSolo_Final_Day' + d + '_' + reg);
      const s = j && j.data && j.data.shapes;
      if (s && s.length) { day = d; shapes = s; updated = j.data.lastUpdated || null; break; }
    }
    if (!shapes) {
      const v = vitalRegion(reg, fin);
      if (v) { out.regions[reg] = v; console.log(reg + ': Vital Scrims, коробок ' + v.boxes.length + ', на карте ' + v.boxes.reduce((s, b) => s + b.ids.length, 0) + (v.missing.length ? ', без точки: ' + v.missing.join(' | ') : '')); }
      else console.log(reg + ': карты нет');
      continue;
    }
    const left = new Set(fin), seat = new Map();   // ник на карте → финалист
    const names = []; shapes.forEach(s => (s.teams || []).forEach(t => names.push(t)));
    const byId = new Map(fin.map(f => [String(f.id).replace(/-/g, ''), f]));
    const tests = [
      (t, f) => (idsOf.get(norm(t)) || []).some(id => byId.get(id) === f),
      (t, f) => norm(f.n) === norm(t),
      (t, f) => { const T = norm(t), F = norm(f.n); return (T.length >= 3 && F.includes(T)) || (F.length >= 3 && T.includes(F)); },
      (t, f) => prefix(norm(f.n), norm(t)) >= 4,
    ];
    tests.forEach(test => names.forEach(t => {
      if (seat.has(t)) return;
      const c = [...left].filter(f => test(t, f));
      if (c.length === 1) { seat.set(t, c[0]); left.delete(c[0]); }
    }));
    // Один неузнанный ник и один финалист без точки — это он (EU: SAMI у них = Noobplays в таблице Epic).
    const rest = names.filter(t => !seat.has(t));
    if (rest.length === 1 && left.size === 1) { seat.set(rest[0], [...left][0]); left.clear(); }
    const boxes = shapes.filter(s => s.type === 'rectangle' && (s.teams || []).length).map(s => ({
      x: toPct(s.x, FIT.ax, FIT.bx, FIT.W), y: toPct(s.y, FIT.ay, FIT.by, FIT.H),
      w: +(FIT.ax * s.width * 2 / FIT.W * 100).toFixed(2), h: +(FIT.ay * s.height * 2 / FIT.H * 100).toFixed(2),
      ids: s.teams.map(t => seat.has(t) ? seat.get(t).id : null).filter(Boolean),
      tags: s.teams,
    }));
    const lost = names.filter(t => !seat.has(t));
    out.regions[reg] = { day, updated, source: 'eucompetitive', boxes, unmatched: lost, missing: [...left].map(f => f.n) };
    console.log(reg + ': день ' + day + ', коробок ' + boxes.length + ', игроков ' + names.length +
      (lost.length ? ', не узнаны: ' + lost.join(' ') : '') + (left.size ? ', без точки: ' + [...left].map(f => f.n).join(' | ') : ''));
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log('→ ' + path.relative(ROOT, OUT));
})().catch(e => { console.error(e); process.exit(1); });
