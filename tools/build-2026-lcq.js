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
// Выгрузки: tracker-2026-lcq.json (ранги 1-100) и tracker-2026-lcq-p2.json
// (101-200; у Tracker страницы считаются с нуля, page=1 это вторая сотня).
// Прошедшие в лобби в обеих выгрузках уже отброшены, здесь отбрасываются только
// повторы человека: одному человеку в таблице одна строка, иначе поле стадии
// растёт, а полоса рейтинга врёт.
//
//   node tools/build-2026-lcq.js
const fs = require('fs'), path = require('path');

const SRCS = [path.join(__dirname, 'measured', 'tracker-2026-lcq.json'),
              path.join(__dirname, 'measured', 'tracker-2026-lcq-p2.json')];
const OUT = path.join(__dirname, '2026-lcq.generated.js');
const parts = SRCS.filter(p => fs.existsSync(p)).map(p => JSON.parse(fs.readFileSync(p, 'utf8')));
if (!parts.length) throw new Error('нет ни одной выгрузки');

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

// Свести выгрузки по набору, сохраняя порядок: сначала первая сотня, потом вторая.
const sets = {};
for (const part of parts) {
  for (const [key, set] of Object.entries(part.sets)) {
    const acc = sets[key] || (sets[key] = {rows: [], nat: {}, begin: set.begin, lobby: set.lobby, w1: set.w1, pages: set.pages, seen: new Set()});
    if (set.lobby != null) acc.lobby = set.lobby;
    for (const row of set.rows) {
      const names = row.slice(6).map(n => String(n).toLowerCase());
      if (names.some(n => acc.seen.has(n))) continue;   // человек уже в таблице
      names.forEach(n => acc.seen.add(n));
      acc.rows.push(row);
    }
    Object.assign(acc.nat, set.nat);
  }
}

const out = [], report = [];
let rowsTotal = 0, natTotal = 0, soloTotal = 0;
for (const key of Object.keys(sets).sort()) {
  const set = sets[key];
  const [maj, reg] = key.split('_');
  const n = maj.slice(1);
  const r = REG[reg];
  if (!r) throw new Error('регион не размечен: ' + reg);
  const PFX = r.p + n;
  const d = new Date(set.begin + 'T00:00:00Z');
  const date = d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  const ev = 'FNCS 2026 Major ' + n + ' — Last Chance Qualifier Session 1 (' + r.en + ')';

  // Одиночка в дуо-турнире бывает: человек вышел без напарника. В карточки такие
  // строки не идут — карточка стоит на паре (TEAMMATE_GROUPS, книга пар), а пара из
  // одного сломала бы и её, и подсчёт поля. Сколько отброшено — печатается ниже.
  const solo = [];
  const rows = [];
  for (const row of set.rows) {
    const names = row.slice(6).filter(x => String(x || '').trim());
    if (names.length !== 2) { solo.push('#' + row[0] + ' ' + names.join(' + ')); continue; }
    rowsTotal++;
    rows.push('[' + row.slice(0, 6).map(num).concat(names.map(q)).join(',') + ']');
  }
  soloTotal += solo.length;
  // Флаг держим только у тех, кто в таблице остался.
  const need = new Set();
  set.rows.forEach(row => { const nm = row.slice(6).filter(x => String(x || '').trim()); if (nm.length === 2) nm.forEach(x => need.add(x)); });
  const nat = Object.keys(set.nat).filter(h => need.has(h)).sort().map(h => q(h) + ':' + q(set.nat[h]));
  natTotal += nat.length;

  out.push('/* ' + key + ': открытая сессия 1 Ласт-Ченса, ' + set.begin + ' (окно ' + set.w1 +
           ', всего страниц ' + set.pages + '; лобби того же Ласт-Ченса — ' + set.lobby +
           ' команд, они здесь не повторяются) */');
  out.push('const CARD_' + PFX + '_LCQ1_RAW=[\n' + rows.join(',\n') + '\n];');
  out.push('const ' + PFX + '_LCQ1_NAT={' + nat.join(',') + '};');
  out.push('const CARD_' + PFX + '_LCQ1_EVENT=' + q(ev) + ';');
  out.push('const CARD_' + PFX + '_LCQ1_DATE=' + q(date) + ';');
  out.push('');
  report.push(PFX.padEnd(3) + ' ' + reg.padEnd(5) + ' команд ' + String(rows.length).padStart(4) +
              '  флагов ' + String(nat.length).padStart(4) + '  ' + date);
}
fs.writeFileSync(OUT, out.join('\n'), 'utf8');
console.log(report.join('\n'));
console.log('\nвыгрузок: ' + parts.length + ', строк всего: ' + rowsTotal + ', флагов: ' + natTotal +
            ', файл: ' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' КБ');
