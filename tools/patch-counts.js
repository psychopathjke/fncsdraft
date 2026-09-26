// Числа набора — измеренные, а не старые.
//
// README обещал «6 892 карточки в 62 турнирах, до Мейджора 2 сезона 2026». С тех
// пор в файл легли 2024-й, 2025-й, Reload и LCQ 2026, и замер (node
// tools/count-probe.js) даёт другое: 32 847 карточек, 14 097 разных людей,
// 318 турнирных сеток, 2021–2026. Расхождение висело открытым вопросом на
// странице /about — закрыто замером, а не догадкой. Проба лежит рядом, чтобы
// число можно было пересчитать одной командой.
const fs=require('fs'), path=require('path');
const R=path.join(__dirname,'..','README.md'), A=path.join(__dirname,'..','about.html');

let r=fs.readFileSync(R,'utf8');
const oldR='- **6 892 cards** across 62 tournaments, from Chapter 2 Season 5 through FNCS 2026 Major 2';
if(r.split(oldR).length!==2) throw new Error('строка README не найдена ровно один раз');
r=r.replace(oldR, '- **32 847 cards** — 14 097 different players across 318 tournament brackets, ' +
  'from Chapter 2 Season 5 through FNCS 2026 (counted by `node tools/count-probe.js`)');
fs.writeFileSync(R,r);

let a=fs.readFileSync(A,'utf8');
const oldA='<p>The set runs from Chapter 2 Season 5 through the current FNCS season, across';
if(a.split(oldA).length!==2) throw new Error('строка about не найдена ровно один раз');
a=a.replace(oldA, '<p>The set is 32 847 cards — 14 097 different players across 318 tournament ' +
  'brackets. It runs from Chapter 2 Season 5 through the current FNCS season, across');
fs.writeFileSync(A,a);
console.log('ок');
