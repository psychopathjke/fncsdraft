// Плитка «2023» на экране создания: подписи года на пяти языках, арт, ряд на четыре.
//   node tools/patch-year-2023-tile.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
if (s.indexOf('ccYearNote2023:') >= 0) { console.log('already patched'); process.exit(0); }
const NOTE = {
  ru: "ccYearNote2023:'Сезон FNCS 2023: дуо весь год, Chapter 4. Дивизионы Elite / Contender / Challenger до Мейджора 1, три Мейджора с неделями и Surge Week, Last Chance Major и Копенгаген. Карточки и рейтинги — FNCS 2023.',",
  en: "ccYearNote2023:'FNCS 2023: duos all year, Chapter 4. Elite / Contender / Challenger divisions up to Major 1, three Majors with weekly qualifiers and a Surge Week, the Last Chance Major and Copenhagen. Cards and ratings are FNCS 2023.',",
  fr: "ccYearNote2023:'FNCS 2023 : duos toute l’année, Chapter 4. Divisions Elite / Contender / Challenger jusqu’au Major 1, trois Majors avec qualifs hebdomadaires et Surge Week, le Last Chance Major et Copenhague. Cartes et notes FNCS 2023.',",
  it: "ccYearNote2023:\"FNCS 2023: duo tutto l'anno, Chapter 4. Divisioni Elite / Contender / Challenger fino al Major 1, tre Major con qualificazioni settimanali e Surge Week, il Last Chance Major e Copenaghen. Carte e rating FNCS 2023.\",",
  pt: "ccYearNote2023:\"FNCS 2023: duplas o ano todo, Chapter 4. Divisões Elite / Contender / Challenger até o Major 1, três Majors com classificatórias semanais e Surge Week, o Last Chance Major e Copenhague. Cartas e ratings do FNCS 2023.\","
};
const lines = s.split(nl);
const idx = lines.map((l, i) => /ccYearNote2024:/.test(l) ? i : -1).filter(i => i >= 0);
if (idx.length !== 5) throw new Error('expected 5 dictionaries, got ' + idx.length);
['ru', 'en', 'fr', 'it', 'pt'].forEach((lang, j) => {
  const i = idx[j], l = lines[i], at = l.indexOf('ccYearNote2024:');
  lines[i] = l.slice(0, at) + NOTE[lang] + ' ' + l.slice(at);
});
s = lines.join(nl);
const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error('not found: ' + a.slice(0, 60)); s = s.replace(a, () => b); };
rep("                     2024:{lan:'Fort Worth', art:'art/fncs-2024.jpg'}};\n".split('\n').join(nl),
    ("                     2024:{lan:'Fort Worth', art:'art/fncs-2024.jpg'},\n" +
     "                     // 2023 — остров Мейджора 1 (Chapter 4 Season 1), как у 2024-го.\n" +
     "                     2023:{lan:'Copenhagen', art:'art/map-e1.jpg'}};\n").split('\n').join(nl));
rep('ychips.innerHTML=[2026, 2025, 2024].map(y=>{', 'ychips.innerHTML=[2026, 2025, 2024, 2023].map(y=>{');
rep('  .cc-year-panel .cc-chips{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}   /* три года в ряд во всю ширину панели */',
    '  .cc-year-panel .cc-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}   /* четыре года в ряд во всю ширину панели */' + nl +
    '  @media (max-width:560px){ .cc-year-panel .cc-chips{grid-template-columns:1fr 1fr;} }');
fs.writeFileSync(file, s);
console.log('patched');
