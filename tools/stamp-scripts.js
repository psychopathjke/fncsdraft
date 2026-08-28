// Переставляет ?v= у скриптов на sha1 самих файлов.
//
// Правило было, инструмента не было: поменял mp.js — обнови ?v= руками, иначе
// браузер отдаст старый файл к новой странице. 28 августа так и вышло — mp.js
// переписан, тег остался прежним. check-deploy-folder это ловит, но только на
// собранной папке, то есть в самом конце; здесь то же самое, но сразу.
//
// Тот же приём, что у CC_BUILD (tools/stamp-build.js), только источник —
// сам файл скрипта, а не документ.
//
//   node tools/stamp-scripts.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'index.html');
let src = fs.readFileSync(FILE, 'utf8');

let moved = 0, same = 0, bad = 0;
src = src.replace(/src="([^"?]+\.js)\?v=([0-9a-f]+)"/g, (all, file, was) => {
  const at = path.join(ROOT, file);
  if (!fs.existsSync(at)) { console.error('НЕТ ФАЙЛА: ' + file); bad++; return all; }
  const now = crypto.createHash('sha1').update(fs.readFileSync(at)).digest('hex').slice(0, 8);
  if (now === was) { same++; return all; }
  console.log(file + ': ' + was + ' -> ' + now);
  moved++;
  return 'src="' + file + '?v=' + now + '"';
});

if (bad) process.exit(2);
if (!moved) { console.log('все ' + same + ' тега на месте'); process.exit(0); }
fs.writeFileSync(FILE, src);
console.log('переставлено: ' + moved + ', и так верных: ' + same);
console.log('дальше — node tools/stamp-build.js: документ изменился');
