// Названия сезонов 2021–2022 вместо «Мейджор n»: в те годы шли сезоны FNCS (C2S5–C2S8, C3S1–C3S3)
// и Grand Royale, Мейджоры появились только в 2023-м. Правит исходники машин (tools/) и
// index.html (ярлыки дней, тексты новостей и поздравлений на пяти языках).
//   node tools/patch-season-names.js && node tools/splice-2021.js && node tools/splice-2022.js && node tools/splice-2019.js
'use strict';
const fs = require('fs'), path = require('path');
const T = f => path.join(__dirname, f);
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) { if (s.indexOf(b) >= 0 && s.indexOf(a) < 0) continue; if (s.split(a).length !== 2) throw new Error(path.basename(file) + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  fs.writeFileSync(file, s);
}
// ---- машины ----
edit(T('career-2022-machine.js'), [
  ["      stageLabel=L().ccYr24Qual(ev.n, ev.q, r);", "      stageLabel=ccYearLabel('Major'+ev.n+'_2022_Q'+ev.q+'R'+r, careerToday(), careerToday());"],
  ["    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',\n               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],",
   "    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',\n               cash?[ccSeasonEvName(2022, ev.n), place, ccNum(cash)]:[ccSeasonEvName(2022, ev.n), place, field.length],"],
  ["    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));", "    careerCongrats(ranked, you, L().ccCongratsEv(ccSeasonEvName(2022, ev.n)));"]
]);
edit(T('career-2021-machine.js'), [
  ["      stageLabel=L().ccYr24Qual(ev.n, ev.q, r);", "      stageLabel=ccYearLabel('Major'+ev.n+'_2021_Q'+ev.q+'R'+r, careerToday(), careerToday());"],
  ["    stageLabel=L().ccYr21Heat(ev.n, hi+1);", "    stageLabel=L().ccYrXHeatN(ev.label, hi+1);"],
  ["    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',\n               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],",
   "    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',\n               cash?[ccSeasonEvName(2021, ev.n), place, ccNum(cash)]:[ccSeasonEvName(2021, ev.n), place, field.length],"],
  ["    careerCongrats(ranked, you, ev.n===5 ? L().ccYr21Gr : L().ccCongratsMajor(ev.n));", "    careerCongrats(ranked, you, L().ccCongratsEv(ccSeasonEvName(2021, ev.n)));"]
]);
edit(T('career-mx-machine.js'), [
  ["    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',\n               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],",
   "    careerNews(cash?'good':'flat', cash?'ccNewsEvCash':'ccNewsEvNoCash',\n               cash?[sp.name, place, ccNum(cash)]:[sp.name, place, field.length],"],
  ["    careerCongrats(ranked, you, sp.name);", "    careerCongrats(ranked, you, L().ccCongratsEv(sp.name));"],
  ["function ccMXSpec(y, n){", "/* Имя сезона-«Мейджора» для лет, когда Мейджоров не было: 2019–2020 — из спеки, 2021 — FNCS C2S5–C2S8\n   и Grand Royale, 2022 — FNCS C3S1–C3S3. Для 2023+ — null (там это и есть Мейджоры). */\nfunction ccSeasonEvName(y, n){\n  if(y===2022) return 'FNCS C3S'+n;\n  if(y===2021) return n===5 ? 'FNCS Grand Royale' : 'FNCS C2S'+(n+4);\n  const sp=ccMXSpec(y, n); return sp ? sp.name : null;\n}\nfunction ccMXSpec(y, n){"]
]);
// ---- index.html: ярлыки дней и тексты ----
const file = T('../index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const N = t => t.split('\n').join(nl);
const rep = (a, b) => { a = N(a); b = N(b); if (s.indexOf(b) >= 0) return; const n = s.split(a).length - 1; if (n !== 1) throw new Error('index found ' + n + ': ' + a.slice(0, 80)); s = s.replace(a, () => b); };
rep("  if(m21){\n    const n21=+m21[1];\n    if(m21[2]) return L().ccYr24Qual(n21, +m21[2], m21[3].split('').join('–'));\n    if(m21[4]) return L().ccYr24Semi(n21, +m21[4]);\n    if(m21[5]) return L().ccYr21Reboot(n21);\n    if(n21===5) return L().ccYr21Gr;\n    id='Major'+n21+'_Final';\n  }",
    "  if(m21){\n    const n21=+m21[1], nm21=ccSeasonEvName(2021, n21);\n    if(m21[2]) return nm21+' · '+L().ccYrXWeek(+m21[2], m21[3].split('').join('–'), true);\n    if(m21[4]) return nm21+' · '+L().ccYrSemiDay(+m21[4]);\n    if(m21[5]) return nm21+' · Reboot Round';\n    return nm21+' · '+L().ccYrXFinal(false);\n  }");
rep("  if(m22){\n    if(m22[2]) return L().ccYr24Qual(+m22[1], +m22[2], m22[3].split('').join('–'));\n    if(m22[4]) return L().ccYr24Semi(+m22[1], +m22[4]);\n    id='Major'+m22[1]+'_Final';\n  }",
    "  if(m22){\n    const nm22=ccSeasonEvName(2022, +m22[1]);\n    if(m22[2]) return nm22+' · '+L().ccYrXWeek(+m22[2], m22[3].split('').join('–'), true);\n    if(m22[4]) return nm22+' · '+L().ccYrSemiDay(+m22[4]);\n    return nm22+' · '+L().ccYrXFinal(false);\n  }");
const KEYS = {
  ru: "ccNewsEvCash:(n,p,m)=>'Финал '+n+': '+ccTop(p)+', заработано $'+m, ccNewsEvNoCash:(n,p,of)=>'Финал '+n+': '+ccTop(p)+' из '+of, ccCongratsEv:n=>'финал '+n, ccYrSemiDay:d=>'полуфинал · день '+d,",
  en: "ccNewsEvCash:(n,p,m)=>n+' Finals: '+ccTop(p)+', $'+m+' earned', ccNewsEvNoCash:(n,p,of)=>n+' Finals: '+ccTop(p)+' of '+of, ccCongratsEv:n=>n+' Finals', ccYrSemiDay:d=>'Semi-Finals · day '+d,",
  fr: "ccNewsEvCash:(n,p,m)=>'Finale '+n+' : '+ccTop(p)+', '+m+' $ gagnés', ccNewsEvNoCash:(n,p,of)=>'Finale '+n+' : '+ccTop(p)+' sur '+of, ccCongratsEv:n=>'finale '+n, ccYrSemiDay:d=>'demi-finales · jour '+d,",
  it: "ccNewsEvCash:(n,p,m)=>'Finale '+n+': '+ccTop(p)+', $'+m+' guadagnati', ccNewsEvNoCash:(n,p,of)=>'Finale '+n+': '+ccTop(p)+' su '+of, ccCongratsEv:n=>'finale '+n, ccYrSemiDay:d=>'semifinali · giorno '+d,",
  pt: "ccNewsEvCash:(n,p,m)=>'Final '+n+': '+ccTop(p)+', $'+m+' ganhos', ccNewsEvNoCash:(n,p,of)=>'Final '+n+': '+ccTop(p)+' de '+of, ccCongratsEv:n=>'final '+n, ccYrSemiDay:d=>'semifinais · dia '+d,"
};
if (s.indexOf('ccNewsEvCash:(n,p,m)') < 0) {
  const lines = s.split(nl);
  const at = lines.map((l, i) => /^ccNewsMajNoCash:\(n,p,of\)=>/.test(l) ? i : -1).filter(i => i >= 0);
  if (at.length !== 5) throw new Error('dicts ' + at.length);
  ['ru', 'en', 'fr', 'it', 'pt'].forEach((lang, j) => { lines[at[j]] = lines[at[j]] + nl + KEYS[lang]; });
  s = lines.join(nl);
}
rep("ccNewsMajThrough:'you', ccNewsMajOut:'you', ccNewsMajCash:'you', ccNewsMajNoCash:'you',", "ccNewsMajThrough:'you', ccNewsMajOut:'you', ccNewsMajCash:'you', ccNewsMajNoCash:'you', ccNewsEvCash:'you', ccNewsEvNoCash:'you',");
fs.writeFileSync(file, s);
console.log('season names patched');
