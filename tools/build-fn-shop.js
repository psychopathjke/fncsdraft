/* Магазин Fortnite по дням для карьеры (Notion «18.10», тестер: «купить кирки, скины и т. п. в карьере и видеть их
   в инвентаре во время игры»; его «каждый день в зависимости от дня будет обновляться магазин»).
   Источник — fortnite-api.com/v2/cosmetics/br?responseFlags=7: у каждого предмета shopHistory, список дней, когда
   он стоял в магазине (с 30.10.2017). Отсюда настоящий магазин любого дня карьеры.
   Берём скины, рюкзаки, кирки, дельтапланы, эмоции и обёртки, дни с 2019-01-01.
   Выход — fn-shop.js в корне (грузится лениво, ccFnShopLoad), версия файла пишется в index.html (CC_FN_SHOP_V).
     curl -s -o %TEMP%/br7.json "https://fortnite-api.com/v2/cosmetics/br?responseFlags=7"
     node tools/build-fn-shop.js %TEMP%/br7.json */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const src = process.argv[2];
if (!src) { console.error('нужен путь к br7.json'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(src, 'utf8')).data;
const TYPE = { outfit: 'o', backpack: 'b', pickaxe: 'p', glider: 'g', emote: 'e', wrap: 'w' };
const FIRST = '2019-01-01';
const items = [], idx = new Map(), byDay = new Map(), sets = [], setIdx = new Map(), old = [], sty = {};
for (const x of data) {
  const t = TYPE[x.type && x.type.value];
  if (!t || !x.shopHistory || !x.shopHistory.length || !x.name) continue;
  const days = [...new Set(x.shopHistory.map(s => String(s).slice(0, 10)).filter(d => d >= FIRST))];
  if (!days.length) continue;
  // Серия (Icon, Marvel, DC…) важнее редкости для цены: у fortnite-api она в series.value, иначе rarity.value.
  const r = (x.series && x.series.backendValue ? 'S:' + String(x.series.value || '').replace(/\s+Series$/i, '') : '') || (x.rarity && x.rarity.value) || 'common';
  idx.set(x.id, items.length);
  // Набор (set) — по нему игра делит витрину на разделы: скин рядом со своей киркой, рюкзаком, дельтапланом.
  const sv = x.set && x.set.value;
  if (sv && !setIdx.has(sv)) { setIdx.set(sv, sets.length); sets.push(sv); }
  // Стоял в магазине до FIRST — его первый день в данных не «NEW!» (метка новинки в витрине, ccFnIsNew).
  if (x.shopHistory.some(s => String(s).slice(0, 10) < FIRST)) old.push(items.length);
  // Стили (variants): «+» на плитке, как в игре; число — вариантов в самом большом канале.
  const nSty = Math.max(0, ...(x.variants || []).map(v => (v.options || []).length));
  if (nSty > 1) sty[items.length] = nSty;
  items.push(sv ? [x.id, x.name, t, r, setIdx.get(sv)] : [x.id, x.name, t, r]);
  for (const d of days) { if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(idx.get(x.id)); }
}
/* Наборы (Bundle) — fortnite.gg (tools/measured/fgg-bundles.json): имя, цена в V-Bucks, первый и последний день в магазине.
   Состава там нет: набор встаёт в витрину, когда в ней стоит скин или сет с его именем (ccFnBundles). */
let bun = [];
try { bun = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'fgg-bundles.json'), 'utf8')).bundles.filter(b => b[3] >= FIRST); } catch (e) {}
const keys = [...byDay.keys()].sort();
const last = keys[keys.length - 1];
// Дни подряд от FIRST до последнего: пустой день — пустая строка (данных нет).
const out = [];
for (let d = new Date(FIRST + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= last; d.setUTCDate(d.getUTCDate() + 1)) {
  const k = d.toISOString().slice(0, 10);
  out.push((byDay.get(k) || []).map(n => n.toString(36)).join(','));
}
const body = '/* fncsdraft — магазин Fortnite по дням (tools/build-fn-shop.js, fortnite-api.com). */\n' +
  'var CC_FN_SHOP=' + JSON.stringify({ first: FIRST, last: last, items: items, sets: sets, old: old, sty: sty, bun: bun, days: out.join(';') }) + ';\n';
fs.writeFileSync(path.join(ROOT, 'fn-shop.js'), body);
const v = crypto.createHash('sha1').update(body).digest('hex').slice(0, 8);
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!/let CC_FN_SHOP_V='[0-9a-f]*'/.test(html)) { console.error('в index.html нет let CC_FN_SHOP_V'); process.exit(1); }
html = html.replace(/let CC_FN_SHOP_V='[0-9a-f]*'/, "let CC_FN_SHOP_V='" + v + "'");
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('предметов', items.length, 'дней', out.length, FIRST + '…' + last, 'файл', Math.round(body.length / 1024) + ' КБ', 'v=' + v);
// Паки за деньги дописываются отдельной строкой (tools/build-fn-packs.js) — без этого пересборка магазина их стирала бы.
require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build-fn-packs.js'), src], { stdio: 'inherit' });
