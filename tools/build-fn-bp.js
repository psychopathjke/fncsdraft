/* Батл пассы по сезонам → в fn-shop.js строкой CC_FN_SHOP.bp, версия файла — в index.html.

   Источник — тот же br7.json, что у build-fn-shop.js (fortnite-api.com/v2/cosmetics/br?responseFlags=7). У предметов
   пасса gameplayTags вида Cosmetics.Source.Season9.BattlePass.Paid / .Free (номер — сквозной номер сезона, как у
   ccSeasonNumOn). С S22 скины пасса этой метки не несут: их берём по набору (Cosmetics.Set.*) — набор, у которого в
   этом сезоне есть кирка/дельтаплан/обёртка пасса, вышел в этом же сезоне, в магазине не стоял и метки ItemShop нет.
   Шесть видов шкафчика (скин, рюкзак, кирка, дельтаплан, эмоция, обёртка) и мелочь пасса: спреи (y), эмодзи (j),
   экраны загрузки (l), следы (c), музыка (m). По набору добираются только шесть основных.

   Строка: CC_FN_SHOP.bp = { "<сезон>": [[id, вид, редкость, имя, бесплатный 0/1], ...] }.
   Ставится ПЕРЕД строкой паков: build-fn-packs.js срезает файл от своей строки до конца.

     node tools/build-fn-bp.js %TEMP%/br7.json */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const src = process.argv[2] || path.join(process.env.TEMP || '', 'br7.json');
const data = JSON.parse(fs.readFileSync(src, 'utf8')).data;
const TYPE = { outfit: 'o', backpack: 'b', pickaxe: 'p', glider: 'g', emote: 'e', wrap: 'w' };
// Мелочь пасса — в шкафчике слота у неё нет, но на дорожке она закрывает пустые уровни, как в игре.
const EXTRA = { spray: 'y', emoji: 'j', loadingscreen: 'l', contrail: 'c', music: 'm' };
const RE = /^Cosmetics\.Source\.Season(\d+)\.BattlePass(?:\.(\w+))?$/;
const bpOf = x => { for (const t of x.gameplayTags || []) { const m = t.match(RE); if (m) return { s: +m[1], free: m[2] === 'Free' }; } return null; };
const setOf = x => { for (const t of x.gameplayTags || []) if (t.indexOf('Cosmetics.Set.') === 0) return t.slice(14); return null; };
const rarOf = x => (x.series && x.series.backendValue ? 'S:' + String(x.series.value || '').replace(/\s+Series$/i, '') : '') || (x.rarity && x.rarity.value) || 'common';

const sets = {}, out = {};
for (const x of data) { const b = bpOf(x), st = setOf(x); if (b && st) (sets[b.s] = sets[b.s] || new Set()).add(st); }
const push = (s, x, free) => {
  const t = TYPE[x.type && x.type.value] || EXTRA[x.type && x.type.value];
  if (!t || !x.name || x.name === 'TBD') return;
  const list = out[s] = out[s] || [];
  if (list.some(y => y[0] === x.id || (y[3] === x.name && y[1] === t))) return;
  list.push([x.id, t, rarOf(x), x.name, free ? 1 : 0]);
};
for (const x of data) { const b = bpOf(x); if (b) push(b.s, x, b.free); }
for (const x of data) {
  const t = TYPE[x.type && x.type.value];
  if (!t || bpOf(x)) continue;
  const s = x.introduction && +x.introduction.backendValue, st = setOf(x);
  if (!s || !st || !sets[s] || !sets[s].has(st)) continue;
  if ((x.gameplayTags || []).includes('Cosmetics.Source.ItemShop') || (x.shopHistory || []).length) continue;
  push(s, x, false);
}
const file = path.join(ROOT, 'fn-shop.js');
let body = fs.readFileSync(file, 'utf8').replace(/\nCC_FN_SHOP\.bp=[^\n]*\n/, '\n');
const line = 'CC_FN_SHOP.bp=' + JSON.stringify(out) + ';\n';
const at = body.indexOf('\nCC_FN_SHOP.packs=');
body = at >= 0 ? body.slice(0, at + 1) + line + body.slice(at + 1) : (body.endsWith('\n') ? body : body + '\n') + line;
fs.writeFileSync(file, body);
const v = crypto.createHash('sha1').update(body).digest('hex').slice(0, 8);
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!/let CC_FN_SHOP_V='[0-9a-f]*'/.test(html)) { console.error('в index.html нет let CC_FN_SHOP_V'); process.exit(1); }
html = html.split(html.match(/let CC_FN_SHOP_V='[0-9a-f]*'/)[0]).join("let CC_FN_SHOP_V='" + v + "'");
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
const seasons = Object.keys(out).map(Number).sort((a, b) => a - b);
for (const s of seasons) { const c = {}; for (const y of out[s]) c[y[1]] = (c[y[1]] || 0) + 1; console.log('S' + s, out[s].length, 'бесплатных', out[s].filter(y => y[4]).length, JSON.stringify(c)); }
console.log('сезонов', seasons.length, 'строка', Math.round(line.length / 1024) + ' КБ', 'v=' + v);
