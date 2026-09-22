// Патчер index.html fncsdraftmajor. Запуск: node tools/fd-patch.mjs <файл-правок.mjs>, где файл
// экспортирует EDITS=[{a:'якорь', b:'замена', n?:сколько_раз}].
// split/join (без спецпоследовательностей $),
// каждый якорь обязан встретиться ровно столько раз, сколько заявлено (по умолчанию 1),
// строки в замене — LF, в конце весь файл приводится к CRLF, как хранится в git.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const [,, edFile] = process.argv;
// Корень репо — от этого файла (tools/), а не жёсткий путь: тот же скрипт на ПК и на Маке.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = path.join(ROOT, 'index.html');
const { EDITS } = await import(pathToFileURL(path.resolve(edFile)).href);
let s = fs.readFileSync(P, 'utf8');
const before = s.length;
for (const e of EDITS) {
  const a = e.a.replace(/\r?\n/g, '\r\n'), b = e.b.replace(/\r?\n/g, '\r\n');
  const n = s.split(a).length - 1, want = e.n ?? 1;
  if (n !== want) { console.error('ЯКОРЬ ' + n + ' раз (нужно ' + want + '): ' + e.a.slice(0, 90)); process.exit(1); }
  s = s.split(a).join(b);
}
s = s.replace(/\r?\n/g, '\r\n');
fs.writeFileSync(P, s);
console.log('ok: ' + EDITS.length + ' правок, ' + before + ' → ' + s.length + ' байт');
