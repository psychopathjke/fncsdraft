// Сравнение дуо — по своему году, а не по всей истории файла.
//
// Проверка написана про сведение в круге FNCS 2026: vic0 читался 94, Malibuca —
// его же дуо — 96, потому что часть карточек vic0 лежала написанием «VICO».
// Сравнивать при этом ВСЮ историю двоих нельзя: в 2024-м они ещё не были парой
// и стадии у них разные по-настоящему (у vic0 Open Qualifier Мейджора 2,
// у Malibuca — Semi-Finals того же Мейджора). Это не сбой сведения, а две
// разные карьеры до того, как они сели вместе, и сторож краснел на правде.
const fs=require('fs'), path=require('path');
const F=path.join(__dirname,'check-handle-fold.js');
let s=fs.readFileSync(F,'utf8');
const A="      const evsOf=h=>{";
if(s.split(A).length!==2) throw new Error('evsOf не найдена');
const B="        PLAYERS_BASE.forEach(c=>{ if(String(c.handle||'')===h && String(c.cardSet||''))";
if(s.split(B).length!==2) throw new Error('перебор в evsOf не найден');
s=s.replace(B, "        // Только круг 2026 — тот, про который написана проверка (см. patch-fold-year.js).\n" +
  "        PLAYERS_BASE.forEach(c=>{ if(String(c.handle||'')===h && /^[mt]/.test(String(c.cardSet||''))\n" +
  "          && /2026/.test(String(c.event||'')+' '+String(c.date||'')))");
fs.writeFileSync(F,s);
console.log('ок');
