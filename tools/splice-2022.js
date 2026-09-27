// Вклеивает год 2022 в index.html (повторный запуск заменяет прошлую вклейку между маркерами):
//   tools/2022-rows.generated.js  — строки карточек, перед строками 2023-го;
//   tools/career-2022-cal.js + tools/2022-cal.generated.js — календарь, капы и выплаты,
//                                   перед календарём 2023-го;
//   tools/career-2022-machine.js  — машина сезона и Invitational, перед runCareerMajor2024.
//   node tools/splice-2022.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r?\n$/, '').split(/\r?\n/).join(nl);
function splice(A, B, body, fallbackBefore) {
  const block = A + nl + body + nl + B;
  const i = s.indexOf(A), j = s.indexOf(B);
  if (i >= 0 && j > i) { s = s.slice(0, i) + block + s.slice(j + B.length); return; }
  const at = s.indexOf(fallbackBefore);
  if (at < 0) throw new Error('marker not found: ' + fallbackBefore);
  if (s.indexOf(fallbackBefore, at + 1) >= 0) throw new Error('marker not unique: ' + fallbackBefore);
  s = s.slice(0, at) + block + nl + s.slice(at);
}
const rows = read('2022-rows.generated.js');
splice('// ==== FNCS 2022 rows (tools/splice-2022.js) ====', '// ==== /FNCS 2022 rows ====', rows, '// ==== FNCS 2023 rows (tools/splice-2023-rows.js) ====');
const cal = read('career-2022-cal.js') + nl + read('2022-cal.generated.js');
splice('// ==== FNCS 2022 cal (tools/splice-2022.js) ====', '// ==== /FNCS 2022 cal ====', cal, '/* ---- FNCS 2023 в карьере');
const mach = read('career-2022-machine.js');
splice('// ==== FNCS 2022 machine (tools/splice-2022.js) ====', '// ==== /FNCS 2022 machine ====', mach, 'async function runCareerMajor2024(){');
fs.writeFileSync(file, s);
console.log('spliced rows', rows.length, 'cal', cal.length, 'machine', mach.length);
