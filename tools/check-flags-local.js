// Флаги лежат у нас, а не на flagcdn.
//
// flagcdn.com стоит за Cloudflare, а у части российских провайдеров запросы к
// Cloudflare не отбиваются, а висят: вкладка крутится вечно, событие load не
// наступает (а на нём висела регистрация воркера). 5 сентября 2026 флаги
// скачаны в flags/w20, w40, w320 и страница ссылается на них относительным
// путём — он живёт и на зеркале под подпапкой. Здесь проверяется, что:
//   в index.html не осталось ни одной ссылки на flagcdn;
//   каждый литеральный путь flags/... в разметке ведёт на файл;
//   у каждого кода из таблиц FLAG_CODE* есть w40 (flagImg рисует ими ростеры);
//   у каждой страны CC_COUNTRIES есть w20 и w320 (карьера: анкета и карта мира);
//   папка flags попадает в сборку (build-deploy DIRS).
//
//   node tools/check-flags-local.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const s = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const fails = [];
const check = (n, ok, d) => { if (!ok) fails.push(n + (d ? ': ' + d : '')); };
const has = rel => fs.existsSync(path.join(ROOT, rel));

check('в разметке нет ссылок на flagcdn (в комментариях имя остаётся)', s.indexOf('flagcdn.com/') < 0);
const literal = [...new Set([...s.matchAll(/flags\/(w\d+)\/([a-z-]+)\.png/g)].map(m => 'flags/' + m[1] + '/' + m[2] + '.png'))];
const deadLit = literal.filter(p => !has(p));
check('литеральные пути ведут на файлы (' + literal.length + ')', deadLit.length === 0, deadLit.join(', '));

const codes40 = new Set();
for (const m of s.matchAll(/const FLAG_CODE[A-Z0-9_]*=\{([^}]*)\}/g))
  for (const c of m[1].matchAll(/:\s*'([a-z-]+)'/g)) codes40.add(c[1]);
const dead40 = [...codes40].filter(c => !has('flags/w40/' + c + '.png'));
check('w40 для каждого кода FLAG_CODE (' + codes40.size + ')', dead40.length === 0, dead40.join(' '));

const i = s.indexOf('const CC_COUNTRIES=['), j = s.indexOf('];', i);
const cc = [...s.slice(i, j).matchAll(/\{[^}]*?\bc:\s*'([a-z-]+)'/g)].map(m => m[1]);
const dead20 = cc.filter(c => !has('flags/w20/' + c + '.png'));
const dead320 = cc.filter(c => !has('flags/w320/' + c.split('-')[0] + '.png'));
check('w20 для каждой страны карьеры (' + cc.length + ')', dead20.length === 0, dead20.join(' '));
check('w320 для карты мира', dead320.length === 0, dead320.join(' '));

const bd = fs.readFileSync(path.join(ROOT, 'tools', 'build-deploy.js'), 'utf8');
check('flags в сборке деплоя', /const DIRS = \[[^\]]*'flags'/.test(bd));

let total = 0, count = 0;
for (const w of ['w20', 'w40', 'w320']) for (const f of fs.readdirSync(path.join(ROOT, 'flags', w))) { count++; total += fs.statSync(path.join(ROOT, 'flags', w, f)).size; }
console.log('  flags/: ' + count + ' файлов, ' + (total / 1024).toFixed(0) + ' КБ; литеральных путей ' + literal.length + ', кодов w40 ' + codes40.size + ', стран карьеры ' + cc.length);
if (fails.length) { fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('every flag the page can show is served from our own folder');
