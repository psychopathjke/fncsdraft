// Сундуки по коробкам нынешнего острова — как на fortnite.gg (его слово 7.09:
// «сундуков на локациях, как в настоящем фортнайте, как на fortnite gg»).
//
// fortnite.gg отдаёт карту двумя статическими файлами:
//   https://fortnite.gg/data/spawns.js  — window.Spawns: chests / rare_chests /
//                                          ammo_boxes … как списки точек [lat, lng]
//   https://fortnite.gg/data/en.js      — window.Data: сезон, патч, именованные
//                                          локации и ландмарки с теми же координатами
// Кадр — Leaflet CRS.Simple, тайлы в bounds [[-256,0],[0,256]]: lat ∈ [-256, 0],
// lng ∈ [0, 256] (см. js/map.js). Наши коробки (ZONE_SETS) — проценты картинки
// art/map-s42.jpg, которая обрезана иначе, поэтому кадр fortnite.gg переводится
// в наш линейно по осям — подгонкой по именованным локациям, чьи позиции в НАШЕМ
// кадре уже посчитал build-2025-zone-loot.js (DUMP_POIS, точки вики). Остаток
// подгонки печатается: если он больше пары процентов, оси перепутаны.
//
//   node tools/build-fgg-chests.js <pois.json> [s42 s42solo]
//   FETCH=1 — скачать свежие spawns.js/en.js в tools/fgg/ (иначе берётся кэш).
//
// Печатает для каждой сетки строку ZONE_STATS с полями chests/rare/ammo и сводку
// по именованным локациям (сундуков в радиусе 6 % от точки — для сверки с сайтом).
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(__dirname, 'fgg');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const POIS = process.argv[2];
const SETS = process.argv.slice(3).length ? process.argv.slice(3) : ['s42', 's42solo'];
if (!POIS || !fs.existsSync(POIS)) throw new Error('нужен дамп точек вики: DUMP_POIS=<файл> node tools/build-2025-zone-loot.js s42');

async function load() {
  fs.mkdirSync(CACHE, {recursive: true});
  for (const f of ['spawns.js', 'en.js']) {
    const p = path.join(CACHE, f);
    if (process.env.FETCH === '1' || !fs.existsSync(p)) {
      const res = await fetch('https://fortnite.gg/data/' + f, {headers: {'User-Agent': UA, Referer: 'https://fortnite.gg/'}});
      if (!res.ok) throw new Error('fortnite.gg/data/' + f + ': HTTP ' + res.status);
      fs.writeFileSync(p, await res.text());
      fs.writeFileSync(path.join(CACHE, 'fetched.txt'), new Date().toISOString() + '\n');
    }
  }
  const w = {L10N: new Proxy({}, {get: (_, k) => String(k)})};
  const ctx = vm.createContext({window: w, L10N: w.L10N});
  vm.runInContext(fs.readFileSync(path.join(CACHE, 'spawns.js'), 'utf8'), ctx);
  ctx.Spawns = w.Spawns;
  vm.runInContext(fs.readFileSync(path.join(CACHE, 'en.js'), 'utf8'), ctx);
  return {S: w.Spawns, D: w.Data};
}

function zoneSet(key) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const at = html.indexOf('const ZONE_SETS=');
  const k = html.indexOf('\n  ' + key + ':[', at);
  if (k < 0) throw new Error('no zone set ' + key);
  let i = html.indexOf('[', k), d = 0, end = -1;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === '[') d++;
    else if (c === ']' && --d === 0) { end = j; break; }
  }
  return vm.runInNewContext('(' + html.slice(i, end + 1) + ')');
}

const pts = g => (g || []).reduce((a, m) => a.concat(m.coords || []), []);
const norm = s => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');

(async () => {
  const {S, D} = await load();
  const wiki = JSON.parse(fs.readFileSync(POIS, 'utf8'));   // [{n, X, Y}] — проценты нашего кадра
  const named = (D.data.poi.sub.poi.markers || []).concat(D.data.poi.sub.landmarks.markers || []);
  // Пары «одна и та же локация у вики и у fortnite.gg» по имени.
  const pairs = [];
  named.forEach(m => {
    const hit = wiki.filter(p => norm(p.n) === norm(m.name));
    if (hit.length === 1) pairs.push({name: m.name, lng: m.coords[1], y: -m.coords[0], X: hit[0].X, Y: hit[0].Y});
  });
  if (pairs.length < 4) throw new Error('совпало только ' + pairs.length + ' локаций по имени — не на чем подогнать кадр');
  // Линейная подгонка по каждой оси: X = a·lng + b, Y = c·y + d (МНК).
  const fit = (xs, ys) => {
    const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0;
    xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) * (x - mx); });
    const a = sxy / sxx; return {a, b: my - a * mx};
  };
  const fx = fit(pairs.map(p => p.lng), pairs.map(p => p.X));
  const fy = fit(pairs.map(p => p.y), pairs.map(p => p.Y));
  const toPct = c => ({X: fx.a * c[1] + fx.b, Y: fy.a * (-c[0]) + fy.b});
  let worst = 0;
  console.error('подгонка кадра по ' + pairs.length + ' локациям: X = ' + fx.a.toFixed(4) + '·lng ' + (fx.b >= 0 ? '+ ' : '− ') + Math.abs(fx.b).toFixed(2) +
                ', Y = ' + fy.a.toFixed(4) + '·(−lat) ' + (fy.b >= 0 ? '+ ' : '− ') + Math.abs(fy.b).toFixed(2));
  pairs.forEach(p => {
    const q = toPct([-p.y, p.lng]);
    const e = Math.hypot(q.X - p.X, q.Y - p.Y); worst = Math.max(worst, e);
    console.error('   ' + p.name.padEnd(34) + ' вики ' + p.X.toFixed(1).padStart(5) + ',' + p.Y.toFixed(1).padStart(5) +
                  '  fortnite.gg→ ' + q.X.toFixed(1).padStart(5) + ',' + q.Y.toFixed(1).padStart(5) + '  расхождение ' + e.toFixed(1) + ' %');
  });
  console.error('худшее расхождение ' + worst.toFixed(1) + ' % (сезон ' + D.season + ', патч ' + D.map + ')');
  if (worst > 4) throw new Error('кадр не сошёлся — оси или обрезка не те');

  const chests = pts(S.chests).map(toPct), rare = pts(S.rare_chests).map(toPct), ammo = pts(S.ammo_boxes).map(toPct);
  console.error('точек: сундуков ' + chests.length + ', редких ' + rare.length + ', ящиков ' + ammo.length);
  // Сколько сундуков у каждой именованной локации в радиусе 6 % — сверить с fortnite.gg глазами.
  named.slice(0, 13).forEach(m => {
    const q = toPct(m.coords);
    const n = chests.filter(c => Math.hypot(c.X - q.X, c.Y - q.Y) < 6).length;
    console.error('   ' + m.name.padEnd(22) + ' сундуков в радиусе 6 %: ' + n);
  });

  const inZone = (p, z) => p.X >= z.x && p.X <= z.x + z.w && p.Y >= z.y && p.Y <= z.y + z.h;
  const out = {};
  for (const set of SETS) {
    const zones = zoneSet(set);
    const stats = zones.map(() => ({chests: 0, rare: 0, ammo: 0}));
    const place = (list, key) => list.forEach(p => {
      let hit = -1;
      zones.forEach((z, i) => { if (inZone(p, z) && (hit < 0 || zones[hit].w * zones[hit].h > z.w * z.h)) hit = i; });
      if (hit >= 0) stats[hit][key]++;
    });
    place(chests, 'chests'); place(rare, 'rare'); place(ammo, 'ammo');
    const inside = stats.reduce((a, s) => a + s.chests, 0);
    console.error(set + ': сундуков внутри коробок ' + inside + ' из ' + chests.length + '; по коробкам: ' + stats.map(s => s.chests).join(' '));
    out[set] = stats;
    console.log('  ' + set + ':' + JSON.stringify(stats).replace(/"/g, '') + ',');
  }
  fs.writeFileSync(path.join(CACHE, 'chests-by-zone.json'), JSON.stringify({season: D.season, map: D.map, fit: {fx, fy}, pairs: pairs.length, worst, sets: out}, null, 1));
})().catch(e => { console.error(e.message || e); process.exit(1); });
