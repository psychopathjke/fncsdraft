// Паки Fortnite за настоящие деньги (Starter Packs, Legends Packs, Limited Time Offers) для магазина карьеры.
//
// Его слово 26.10 (Notion «26.10.26», тестер: «can u add packs for money example: polar legends pack, agency renegades
// pack»): «паки за деньги пусть будут, какие были в игре». У Epic паки продаются не за V-Bucks, а за деньги — в карьере
// их покупают с баланса карьеры, по цене США той даты, с тем же множителем региона, что и V-Bucks.
//
// Источник — Fortnite Wiki: каждая страница пака несёт {{Infobox Bundles}} с cost ($), release_date и cosmetics.
// Берём только паки с долларовой ценой (наборы за V-Bucks уже есть — fgg-bundles.json). Состав — имена косметики;
// id для картинок ищутся по имени в fn-shop.js (ccFnPackItems), без совпадения предмет просто не рисуется.
//
//   node tools/fetch-fn-packs.js      → tools/measured/fn-packs.json
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';
const API = 'https://fortnite.fandom.com/api.php';
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const get = u => JSON.parse(execFileSync('curl', ['-s', '--compressed', '-A', UA, u], { maxBuffer: 1 << 28 }).toString());

let cont = '', titles = [];
for (let i = 0; i < 20; i++) {
  const j = get(API + '?action=query&list=embeddedin&eititle=Template:Infobox_Bundles&eilimit=500&einamespace=0&format=json' +
    (cont ? '&eicontinue=' + encodeURIComponent(cont) : ''));
  titles.push(...j.query.embeddedin.map(x => x.title));
  if (!j.continue) break; cont = j.continue.eicontinue; sleep(2000);
}
const M = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const field = (t, k) => { const m = t.match(new RegExp('\\n\\|\\s*' + k + '\\s*=([^\\n]*(?:\\n(?!\\|)[^\\n]*)*)')); return m ? m[1].trim() : ''; };
const out = [];
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50);
  const j = get(API + '?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=' + encodeURIComponent(batch.join('|')));
  for (const p of Object.values(j.query.pages || {})) {
    const t = p.revisions && p.revisions[0] && p.revisions[0].slots.main['*'];
    if (!t) continue;
    const cost = field(t, 'cost'), m = cost.match(/\$\s*([0-9]+(?:\.[0-9]{2})?)/);
    if (!m) continue;
    const rd = field(t, 'release_date').match(/(January|February|March|April|May|June|July|August|September|October|November|December) (\d+)\w* (\d{4})/);
    if (!rd) continue;
    const day = rd[3] + '-' + String(M[rd[1]]).padStart(2, '0') + '-' + rd[2].padStart(2, '0');
    const items = [...field(t, 'cosmetics').matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map(x => x[1].trim())
      .filter(x => !/^(File|Category):/i.test(x));
    const vb = (t.match(/([0-9][0-9,]*)\s*(?:\[\[)?V-Bucks/i) || [])[1];
    out.push({ name: p.title, day, usd: +m[1], items, vb: vb ? +vb.replace(/,/g, '') : 0, id: field(t, 'ID') || '' });
  }
  sleep(2500);
}
out.sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : a.name.localeCompare(b.name));
fs.writeFileSync(path.join(__dirname, 'measured', 'fn-packs.json'), JSON.stringify({ source: 'fortnite.fandom.com {{Infobox Bundles}}, cost in $', packs: out }));
console.log('страниц', titles.length, 'паков за $', out.length, out.slice(-5).map(p => p.day + ' ' + p.name + ' $' + p.usd).join('; '));
