// Вклеивает год 2020 в index.html (повторный запуск заменяет прошлую вклейку между маркерами):
//   tools/2020-rows.generated.js       — строки карточек, перед строками 2021-го;
//   tools/career-2020-cal.generated.js — календарь и спеки сезонов, перед календарём 2021-го.
// Машина — общая с 2019-м (tools/splice-2019.js).
//   node tools/build-2020-rows.js && node tools/build-2020-cal.js && node tools/splice-2020.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r?\n$/, '').split(/\r?\n/).join(nl);
function splice(A, B, body, fallbackBefore) {
  const block = A + nl + body + nl + B;
  const i = s.indexOf(A), j = s.indexOf(B);
  if (i >= 0 && j > i) { s = s.slice(0, i) + block + s.slice(j + B.length); return; }
  const at = s.indexOf(fallbackBefore);
  if (at < 0) throw new Error('marker not found: ' + fallbackBefore);
  s = s.slice(0, at) + block + nl + s.slice(at);
}
const rows = read('2020-rows.generated.js');
splice('// ==== FNCS 2020 rows (tools/splice-2020.js) ====', '// ==== /FNCS 2020 rows ====', rows, '// ==== FNCS 2021 rows (tools/splice-2021.js) ====');
const cal = read('career-2020-cal.generated.js');
splice('// ==== FNCS 2020 cal (tools/splice-2020.js) ====', '// ==== /FNCS 2020 cal ====', cal, '// ==== FNCS 2021 cal (tools/splice-2021.js) ====');
fs.writeFileSync(file, s);
console.log('spliced rows', rows.length, 'cal', cal.length);
