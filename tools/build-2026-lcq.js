// Сессия 1 Ласт-Ченса 2026 — из выгрузки Epic в литеральные строки для index.html.
//
// Повод: в 2026-м в наборах лежало ТОЛЬКО квалификационное лобби Ласт-Ченса
// (48-50 команд на регион), а открытая сессия 1 — та, из которой в это лобби и
// выходят, — не лежала вовсе. Из-за этого пул карьеры вне Европы был на 150
// человек тоньше, чем в 2025-м: карьера берёт людей из Плей-Ина и Ласт-Ченса
// (CC_SNAPSHOTS), больше ниоткуда.
//
// Ничего не придумано: строки — из `imp_leaderboard` на странице события
// Tracker, то есть из выгрузки Epic (ранг, очки, матчи, победы, средние элимы,
// среднее место по каждой игре), флаг — из `internal_Accounts[].countryCode`.
// Как снималось — в памяти fncsdraft-tracker-harvest.
//
//   node tools/build-2026-lcq.js
const fs = require('fs'), path = require('path');

const SRC = path.join(__dirname, 'measured', 'tracker-2026-lcq.json');
const OUT = path.join(__dirname, '2026-lcq.generated.js');
const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// Регион -> приставка набора в index.html и его английское имя в названии события.
const REG = {
  EU:   {p: 'M', en: 'Europe'},
  NAC:  {p: 'N', en: 'NA Central'},
  NAW:  {p: 'W', en: 'NA West'},
  BR:   {p: 'B', en: 'Brazil'},
  ME:   {p: 'E', en: 'Middle East'},
  ASIA: {p: 'A', en: 'Asia'},
  OCE:  {p: 'O', en: 'Oceania'}
};
const MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const q = s => JSON.stringify(String(s));
const num = n => (Number.isInteger(n) ? String(n) : String(+Number(n).toFixed(2)));

const out = [];
const report = [];
let rowsTotal = 0, natTotal = 0;

for (const [key, set] of Object.entries(src.sets)) {
  const [maj, reg] = key.split('_');            // M1_EU -> ['M1','EU']
  const n = maj.slice(1);                        // '1' | '2'
  const r = REG[reg];
  if (!r) throw new Error('регион не размечен: ' + reg);
  const PFX = r.p + n;                           // M1, N1, ... M2, N2
  const d = new Date(set.begin + 'T00:00:00Z');
  const date = d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  const ev = 'FNCS 2026 Major ' + n + ' — Last Chance Qualifier Session 1 (' + r.en + ')';

  const rows = set.rows.map(row => {
    const nums = row.slice(0, 6).map(num);
    const names = row.slice(6).map(q);
    if (names.length !== 2) throw new Error(key + ': команда не из двоих — ' + row.slice(6).join(' + '));
    rowsTotal++;
    return '[' + nums.concat(names).join(',') + ']';
  });
  const nat = Object.keys(set.nat).sort().map(h => q(h) + ':' + q(set.nat[h]));
  natTotal += nat.length;

  out.push('/* ' + key + ': открытая сессия 1 Ласт-Ченса, ' + set.begin +
           ' (окно ' + set.w1 + ', всего страниц ' + set.pages +
           '; лобби того же Ласт-Ченса — ' + set.lobby + ' команд, они здесь не повторяются) */');
  out.push('const CARD_' + PFX + '_LCQ1_RAW=[\n' + rows.join(',\n') + '\n];');
  out.push('const ' + PFX + '_LCQ1_NAT={' + nat.join(',') + '};');
  out.push('const CARD_' + PFX + '_LCQ1_EVENT=' + q(ev) + ';');
  out.push('const CARD_' + PFX + '_LCQ1_DATE=' + q(date) + ';');
  out.push('');
  report.push(PFX.padEnd(3) + ' ' + reg.padEnd(5) + ' команд ' + String(rows.length).padStart(3) +
             '  флагов ' + String(nat.length).padStart(3) + '  ' + date);
}

fs.writeFileSync(OUT, out.join('\n'), 'utf8');
console.log(report.join('\n'));
console.log('\nстрок всего: ' + rowsTotal + ', флагов: ' + natTotal +
            ', файл: ' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' КБ -> ' + path.relative(process.cwd(), OUT));
