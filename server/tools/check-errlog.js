// Журнал ошибок игроков: что сервер принимает и как склеивает одинаковые. Ни сети, ни Chrome — только errlog.js.
// Живой путь (POST/GET /errlog) проверяется на wrangler dev руками: curl -X POST … http://127.0.0.1:8787/errlog
//
//   node server/tools/check-errlog.js
const { normalize, keyOf } = require('../src/errlog.js');
const fails = [];
const check = (n, ok, d) => { if (!ok) fails.push(n + (d ? ': ' + d : '')); };

let r = normalize({ kind: 'err', msg: 'x is undefined', src: 'app.js:1:2', build: '184bb3bc', ctx: 'day 2026-05-06', ua: 'iPhone' }, 5);
check('нормальная запись принимается', r.row && r.row.msg === 'x is undefined' && r.row.build === '184bb3bc' && r.row.at === 5, JSON.stringify(r));
check('неизвестный вид — отказ', normalize({ kind: 'hack', msg: 'a' }, 1).err === 'kind');
check('пустой текст — отказ', normalize({ kind: 'err', msg: '   ' }, 1).err === 'msg');
check('не объект — отказ', normalize(null, 1).err === 'json');
check('сборка не hex — прочерк', normalize({ kind: 'err', msg: 'a', build: '<script>' }, 1).row.build === '-');
const long = normalize({ kind: 'split', msg: 'm'.repeat(5000), ctx: 'c'.repeat(5000), ua: 'u'.repeat(500), src: 's'.repeat(500) }, 1).row;
check('длины режутся', long.msg.length === 300 && long.ctx.length === 400 && long.ua.length === 80 && long.src.length === 200);
check('переводы строк убираются', normalize({ kind: 'err', msg: 'a\nb\tc' }, 1).row.msg === 'a b c');
const a = normalize({ kind: 'err', msg: 'same', src: 'f:1', build: 'abcdef', ctx: 'day 1' }, 1).row;
const b = normalize({ kind: 'err', msg: 'same', src: 'f:1', build: 'abcdef', ctx: 'day 2' }, 2).row;
const c = normalize({ kind: 'err', msg: 'same', src: 'f:1', build: 'abcdee' }, 3).row;
check('одинаковая поломка — один ключ (контекст не в ключе)', keyOf(a) === keyOf(b));
check('другая сборка — другой ключ', keyOf(a) !== keyOf(c));
check('id/ip в запись не попадают', !('id' in r.row) && !('ip' in r.row));

if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('журнал ошибок: принимает, режет, склеивает одинаковые');
