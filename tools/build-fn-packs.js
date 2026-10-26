// Паки за деньги (tools/measured/fn-packs.json, вики) → в fn-shop.js строкой CC_FN_SHOP.packs, версия файла — в index.html.
//
// Состав пака на вики — имена косметики; id, вид и редкость берутся из полного списка fortnite-api (br7.json — тот же
// файл, что у build-fn-shop.js). Многие вещи пака в обычном магазине не стояли ни дня, поэтому ищем по всему списку.
// Не паки магазина: подписка Fortnite Crew, «Legacy Styles» к ней, бесплатные паки PlayStation Plus и консольные
// бандлы дороже $40 (продаются с приставкой) — их нет.
//
//   node tools/build-fn-packs.js %TEMP%/br7.json
// Повторный запуск заменяет прошлую строку. build-fn-shop.js после пересборки магазина зовёт этот скрипт сам.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const src = process.argv[2] || path.join(process.env.TEMP || '', 'br7.json');
const data = JSON.parse(fs.readFileSync(src, 'utf8')).data;
const TYPE = { outfit: 'o', backpack: 'b', pickaxe: 'p', glider: 'g', emote: 'e', wrap: 'w' };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const byName = new Map();
for (const x of data) {
  const t = TYPE[x.type && x.type.value];
  if (!t || !x.name) continue;
  const r = (x.series && x.series.backendValue ? 'S:' + String(x.series.value || '').replace(/\s+Series$/i, '') : '') || (x.rarity && x.rarity.value) || 'common';
  const k = norm(x.name);
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push({ id: x.id, t, r, name: x.name, added: String(x.added || '').slice(0, 10) });
}
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'fn-packs.json'), 'utf8')).packs;
const SKIP = /Fortnite Crew Pack|Legacy Styles|PlayStation Plus|GeForce|Annual Pass/i;
const packs = [];
let miss = 0, hit = 0;
for (const p of P) {
  if (SKIP.test(p.name) || p.usd > 40) continue;
  const its = [];
  for (const n of p.items) {
    const c = byName.get(norm(n));
    if (!c) { miss++; continue; }
    // Тёзки (одно имя у скина и эмоции) — ближайший по дате к выходу пака.
    const best = c.slice().sort((a, b) => Math.abs(Date.parse(a.added) - Date.parse(p.day)) - Math.abs(Date.parse(b.added) - Date.parse(p.day)))[0];
    if (!its.some(x => x[0] === best.id)) its.push([best.id, best.t, best.r, best.name]);
    hit++;
  }
  if (!its.length) continue;
  packs.push([p.name, p.day, p.usd, p.vb || 0, its]);
}
const file = path.join(ROOT, 'fn-shop.js');
let body = fs.readFileSync(file, 'utf8').replace(/\nCC_FN_SHOP\.packs=.*\n?$/s, '\n');
if (!body.endsWith('\n')) body += '\n';
body += 'CC_FN_SHOP.packs=' + JSON.stringify(packs) + ';\n';
fs.writeFileSync(file, body);
const v = crypto.createHash('sha1').update(body).digest('hex').slice(0, 8);
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!/let CC_FN_SHOP_V='[0-9a-f]*'/.test(html)) { console.error('в index.html нет let CC_FN_SHOP_V'); process.exit(1); }
html = html.replace(/let CC_FN_SHOP_V='[0-9a-f]*'/, "let CC_FN_SHOP_V='" + v + "'");
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('паков', packs.length, 'предметов найдено', hit, 'не найдено', miss, 'v=' + v);
