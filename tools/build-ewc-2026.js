// Настоящий парижский ЛАН 2026 года — в таблицу для index.html.
//
// Его слово 26 сентября: «сделай как в настоящем фортнайте ewc». В настоящем
// это Reload Elite Series 2026 Championship, он же турнир Fortnite на Esports
// World Cup: Париж, Paris Expo Porte de Versailles, 19-22 августа, сорок ДУО,
// призовой фонд $1 000 000 плюс $25 000 MVP. Формат (Liquipedia): две группы по
// двадцать, десять игр, топ-7 каждой группы сразу в финал, места 8-17 — в
// сёрвайвл, последние три вылетают; сёрвайвл — двадцать команд, десять игр,
// топ-6 в финал; финал — двадцать команд, матч-поинт 350 очков плюс Виктори,
// максимум пятнадцать игр. Всё это в игре уже стояло верно (CC_RC_*), а вот
// поле собиралось выдуманным — этот файл кладёт в него настоящие сорок пар.
//
// Источник: tools/measured/ewc-2026-teams.json (разбор страницы Liquipedia
// «Reload Elite Series/2026»: таблица призовых даёт место и деньги, список
// участников — регион).
//
//   node tools/build-ewc-2026.js
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, 'measured', 'ewc-2026-teams.json');
const OUT = path.join(__dirname, '2026-ewc.generated.js');
const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const rows = src.rows || [];
if (rows.length !== 40) throw new Error('в выгрузке не сорок команд, а ' + rows.length);

const ord = p => parseInt(String(p).split('-')[0], 10) || 99;
rows.sort((a, b) => ord(a.place) - ord(b.place));
const q = s => JSON.stringify(String(s));
const lines = rows.map(r => '{p:' + q(r.place) + ',r:' + q(r.region) + ',c:' + (r.cash || 0) +
  ',d:[' + r.duo.map(q).join(',') + ']}');

const byReg = {};
rows.forEach(r => { byReg[r.region] = (byReg[r.region] || 0) + 1; });

fs.writeFileSync(OUT,
  '/* Сорок пар парижского ЛАНа 2026 года в порядке итогового места.\n' +
  '   Источник — ' + src.source + '.\n' +
  '   По регионам: ' + Object.entries(byReg).map(([k, v]) => k + ' ' + v).join(', ') + '. */\n' +
  'const RC_TEAMS_2026=[\n' + lines.join(',\n') + '\n];\n', 'utf8');
console.log('команд: ' + rows.length + ', по регионам: ' +
            Object.entries(byReg).map(([k, v]) => k + ' ' + v).join(', '));
console.log('первые три: ' + rows.slice(0, 3).map(r => '#' + r.place + ' ' + r.duo.join('+')).join(', '));
console.log('файл: ' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' КБ');
