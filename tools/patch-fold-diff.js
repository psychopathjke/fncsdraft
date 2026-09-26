// Сторож сведения ников: когда наборы событий дуо расходятся — показать, чем.
//
// Строка «у vic0 и Malibuca один и тот же набор событий (15)» краснела, не
// сказав ни слова о том, какое событие лишнее, — а после LCQ 2026 в файл легли
// новые сетки, и разойтись наборы могут по-настоящему (человек играл стадию, где
// напарника не было). Сторож должен различать это от сбоя сведения сам.
const fs=require('fs'), path=require('path');
const F=path.join(__dirname,'check-handle-fold.js');
let s=fs.readFileSync(F,'utf8');
const A="check(JSON.stringify(D.vic0.evs) === JSON.stringify(D.Malibuca.evs),\n      'у vic0 и Malibuca один и тот же набор событий (' + D.vic0.evs.length + ')');";
const A2=A.replace(/\n/g,'\r\n');
const use=s.indexOf(A)>=0?A:(s.indexOf(A2)>=0?A2:null);
if(!use) throw new Error('проверка наборов событий не найдена');
const NL=use===A?'\n':'\r\n';
s=s.replace(use, [
 "const evSame = JSON.stringify(D.vic0.evs) === JSON.stringify(D.Malibuca.evs);",
 "check(evSame, 'у vic0 и Malibuca один и тот же набор событий (' + D.vic0.evs.length + ')');",
 "if (!evSame) {",
 "  const only = (a, b) => a.filter(e => b.indexOf(e) < 0);",
 "  only(D.vic0.evs, D.Malibuca.evs).forEach(e => console.log('       только vic0     : ' + e));",
 "  only(D.Malibuca.evs, D.vic0.evs).forEach(e => console.log('       только Malibuca : ' + e));",
 "}"
].join(NL));
fs.writeFileSync(F,s);
console.log('ок');
