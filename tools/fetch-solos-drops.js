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
    if (!shapes) { console.log(reg + ': карты нет'); continue; }
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
    out.regions[reg] = { day, updated, boxes, unmatched: lost, missing: [...left].map(f => f.n) };
    console.log(reg + ': день ' + day + ', коробок ' + boxes.length + ', игроков ' + names.length +
      (lost.length ? ', не узнаны: ' + lost.join(' ') : '') + (left.size ? ', без точки: ' + [...left].map(f => f.n).join(' | ') : ''));
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log('→ ' + path.relative(ROOT, OUT));
})().catch(e => { console.error(e); process.exit(1); });
