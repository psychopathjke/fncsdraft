// Ники с кириллическими двойниками латинских букв в таблицах карточек (CARD_*_RAW) — в латиницу.
//
// Таблицы Epic несут внутриигровые ники как есть, а в них буквы часто подменяют кириллицей:
// «Roјo» (ј), «Dеrox» (е), «GМoney» (М). Для игры это другой человек: в карьере 2019 Rojo играл
// одновременно за две команды — «Mitr0 + Mongraal + Rojo» и «itemm + Roјo + smeef» (отзыв 6.10 про
// «item shop» вывел на это). Меняется только смесь: есть латиница, есть кириллица, и ВСЯ кириллица —
// двойники латиницы. Русские ники целиком («Кирячэ») и с настоящей кириллицей («я Pate1k») не трогаются.
//   node tools/fix-homoglyph-handles.js [--dry]
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '..', 'index.html');
const MAP = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ӏ': 'l', 'һ': 'h', 'ԛ': 'q', 'ԝ': 'w',
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X', 'І': 'I', 'Ј': 'J', 'Ѕ': 'S' };
const CYR = /[\u0400-\u04FF]/, LAT = /[A-Za-z]/;
const mixed = h => LAT.test(h) && CYR.test(h) && [...h].every(c => !CYR.test(c) || MAP[c]);
const fix = h => [...h].map(c => MAP[c] || c).join('');
let s = fs.readFileSync(FILE, 'utf8'), n = 0;
const seen = new Set();
s = s.replace(/const (CARD_[A-Z0-9_]+_RAW)=\[([\s\S]*?)\n\];/g, (all, name, body) =>
  all.replace(/"([^"\n]{1,40})"/g, (q, h) => { if (!mixed(h)) return q; n++; seen.add(h); return '"' + fix(h) + '"'; }));
console.log('заменено строк', n, '· разных ников', seen.size);
if (!process.argv.includes('--dry')) fs.writeFileSync(FILE, s);
