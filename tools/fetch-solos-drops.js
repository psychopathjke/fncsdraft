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

/* Азия (25.10, X): сводка дропов LYNX Zet (@zet_fnsub, с @AC_Bird1) — Canva canva.link/rirt7cnhcdgexg8, стр. 2
   «FNCS Solos Finals 99/100». Ники и коробки сняты из DOM страницы (Playwright) в tools/measured/solos-2026-asia-raw.json:
   texts [ник, x, y] и boxes [x, y, w, h] в долях картинки 800×800; ник — в самой маленькой коробке, где он стоит.
   Картинка — та же карта, что у eucompetitive, но обрезана иначе: свой перевод по пяти ориентирам (остаток до 11 px).
   Ники у него с кланом и часто по-японски, у Epic — латиницей; кого не узнать уверенно, тот без точки (падает один). */
const ASIA_RAW = path.join(ROOT, 'tools/measured/solos-2026-asia-raw.json');
const AFIT = { ax: 989.72, bx: 29.28, ay: 974.29, by: -60.69 };
const ASIA_ALIAS = {   // ник на карте → ник у Epic, где совпадения по буквам нет (чтение по-японски или клан у Epic другой)
  'QTD ふーくん': 'Fuukun', 'らぜる': 'Razl', 'ざくろ': 'ZAKURo0O', 'BRN ぼっと': 'Bot', 'ONYX larkpex': 'らーく',
  'Zst えありー': 'Airy', 'ZETA みにぴよ': 'Minipiyo', 'UC.ちょんきー': 'Chonky', 'narya': 'なーりゃふぉーじゃー',
  'Zst とっしー': 'Tossy', 'NEXUS たいや': 'Taiya', 'ftw toruko': 'ftw とるこ ｺﾞｰﾃｨー', 'ECS ぴの': 'ecs pino',
  'DFM むきむきぱぱ': 'mkmkpapa', 'TRG Lucci': 'TRG るっちǃǃ', 'IGM しろか': 'Shiroka', 'TsV もふ': 'TsV 666',
  'らずのっと': 'gre RazNotÿǃ', 'ftw とあっくす': 'ftw KakáDelPiero', 'IGM りーくらむ': 'IGNUM rirksignzz',
  'infl freah': 'INFL ふれあとるーと', 'Falk いちご': 'FALK ichxgoÿ', 'Msy rilameru': 'Msy rilazZzero0',
};
function asiaRegion(fin) {
  if (!fs.existsSync(ASIA_RAW)) return null;
  const A = JSON.parse(fs.readFileSync(ASIA_RAW, 'utf8'));
  const nn = s => String(s).toUpperCase().normalize('NFKC').replace(/[\s.\-_ǃ!·]/g, '');
  const last = t => t.split(' ').pop();
  const left = new Set(fin), seat = new Map(), names = A.texts.map(t => t[0]);
  names.forEach(t => { const f = ASIA_ALIAS[t] && fin.find(x => x.n === ASIA_ALIAS[t]); if (f && left.has(f)) { seat.set(t, f); left.delete(f); } });
  [(t, f) => nn(f.n) === nn(t), (t, f) => nn(f.n) === nn(last(t)),
   (t, f) => { const T = nn(t), F = nn(f.n), W = nn(last(t)); return (W.length >= 3 && F.includes(W)) || (F.length >= 3 && T.includes(F)); },
  ].forEach(test => names.forEach(t => {
    if (seat.has(t)) return;
    const c = [...left].filter(f => test(t, f));
    if (c.length === 1) { seat.set(t, c[0]); left.delete(c[0]); }
  }));
  const inBox = (b, x, y) => x >= b[0] - 0.004 && x <= b[0] + b[2] + 0.004 && y >= b[1] - 0.004 && y <= b[1] + b[3] + 0.004;
  const groups = new Map();
  A.texts.forEach(([t, x, y]) => {
    const i = A.boxes.map((b, i) => [b, i]).filter(([b]) => inBox(b, x, y)).sort((p, q) => p[0][2] * p[0][3] - q[0][2] * q[0][3])[0];
    const k = i ? i[1] : 'p' + t;
    if (!groups.has(k)) groups.set(k, { b: i ? i[0] : [x - 0.02, y - 0.01, 0.04, 0.02], tags: [] });
    groups.get(k).tags.push(t);
  });
  const px = (v, a, b, S) => +((a * v + b) / S * 100).toFixed(2);
  const boxes = [...groups.values()].map(({ b, tags }) => ({
    x: px(b[0], AFIT.ax, AFIT.bx, FIT.W), y: px(b[1], AFIT.ay, AFIT.by, FIT.H),
    w: +(AFIT.ax * b[2] / FIT.W * 100).toFixed(2), h: +(AFIT.ay * b[3] / FIT.H * 100).toFixed(2),
    ids: tags.filter(t => seat.has(t)).map(t => seat.get(t).id), tags,
  }));
  return { day: 1, updated: null, source: 'zet_fnsub', boxes, unmatched: names.filter(t => !seat.has(t)), missing: [...left].map(f => f.n) };
}

/* Бразилия (25.10, X → @Ment0sbtw → majorscrims.com/tournaments/fncs-solo-finals-2026): карта Major Scrims, игроки
   отмечают свой спот сами. Данные — в RSC страницы (zones: контур points в долях картинки 2048×2048, teams: names +
   zoneId); снимок в tools/measured/solos-2026-br-raw.json (разбор: объект с teams и zones из self.__next_f).
   Ники там — Epic с кланом («LEV RomeroFDP»), сверка как у остальных; перевод по пяти ориентирам (остаток до 8 px). */
const BR_RAW = path.join(ROOT, 'tools/measured/solos-2026-br-raw.json');
const BFIT = { ax: 998.53, bx: 28.51, ay: 977.48, by: -63.92 };
// Ники с кириллицей вместо латиницы (mаck, КINGBR, Nіght, ViniziИ) и ники без общего куска с Epic.
const LOOKALIKE = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'к': 'k', 'К': 'K', 'і': 'i', 'И': 'N', 'м': 'm', 'т': 't', 'в': 'b', 'н': 'h',
  'А': 'A', 'Е': 'E', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'М': 'M', 'Н': 'H', '0': 'o' };   // и ноль за букву: renаto = renat0
const BR_ALIAS = { '53x pietriin7': 'Pietriinnn', 'Pietro Betrayed': 'pietrofn6', 'Frosty Betrayed': 'TGA Frostyǃ', 'cheto betrayed': 'PRG chetoǃ',
  'BLD marin x N': 'Marinn', 'specreall': 'Spectral', 'jpfk1ng 受祝福': 'JPFK1NG' };
function brRegion(fin) {
  if (!fs.existsSync(BR_RAW)) return null;
  const B = JSON.parse(fs.readFileSync(BR_RAW, 'utf8'));
  const nn = s => String(s).replace(/./g, c => LOOKALIKE[c] || c).toUpperCase().normalize('NFKC').replace(/[\s.\-_ǃ!·]/g, '');
  const left = new Set(fin), seat = new Map(), names = [];
  B.teams.forEach(t => (t.names || []).forEach(n => names.push(n)));
  names.forEach(t => { const f = BR_ALIAS[t] && fin.find(x => x.n === BR_ALIAS[t]); if (f && left.has(f)) { seat.set(t, f); left.delete(f); } });
  [(t, f) => nn(f.n) === nn(t), (t, f) => nn(f.n) === nn(t.split(' ').pop()),
   (t, f) => { const T = nn(t), F = nn(f.n), W = nn(t.split(' ').pop()); return (W.length >= 3 && F.includes(W)) || (F.length >= 3 && T.includes(F)) || (T.length >= 3 && F.includes(T)); },
  ].forEach(test => names.forEach(t => {
    if (seat.has(t)) return;
    const c = [...left].filter(f => test(t, f));
    if (c.length === 1) { seat.set(t, c[0]); left.delete(c[0]); }
  }));
  const zone = new Map(B.zones.map(z => [z.id, z]));
  const groups = new Map();
  B.teams.forEach(t => { if (!t.zoneId || !zone.has(t.zoneId)) return; if (!groups.has(t.zoneId)) groups.set(t.zoneId, []); (t.names || []).forEach(n => groups.get(t.zoneId).push(n)); });
  const boxes = [...groups.entries()].map(([id, tags]) => {
    const p = zone.get(id).points, xs = p.map(q => (BFIT.ax * q.x + BFIT.bx) / FIT.W * 100), ys = p.map(q => (BFIT.ay * q.y + BFIT.by) / FIT.H * 100);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    return { x: +x0.toFixed(2), y: +y0.toFixed(2), w: +(Math.max(...xs) - x0).toFixed(2), h: +(Math.max(...ys) - y0).toFixed(2),
      ids: tags.filter(t => seat.has(t)).map(t => seat.get(t).id), tags };
  });
  const placed = new Set(boxes.flatMap(b => b.ids));
  return { day: 1, updated: null, source: 'majorscrims', boxes, unmatched: names.filter(t => !seat.has(t)), missing: fin.filter(f => !placed.has(f.id)).map(f => f.n) };
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
      const v = reg === 'ASIA' ? asiaRegion(fin) : reg === 'BR' ? brRegion(fin) : vitalRegion(reg, fin);
      if (v) { out.regions[reg] = v; console.log(reg + ': ' + v.source + ', коробок ' + v.boxes.length + ', на карте ' + v.boxes.reduce((s, b) => s + b.ids.length, 0) + (v.missing.length ? ', без точки: ' + v.missing.join(' | ') : '')); }
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
