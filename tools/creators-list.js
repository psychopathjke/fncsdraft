// Все контент-мейкеры мода, по регионам, с твичем и аватаркой.
//
// Печатает то, что реально лежит в index.html: списки по регионам
// (CC_PROAM_CREATORS_*), таблицу твичей (CC_PROAM_TWITCH) и карту аватарок
// (CC_PROAM_AVA) — и сверяет их между собой: у кого нет канала, у кого нет
// лица, и нет ли в таблицах имён, которых нет ни в одном списке.
//
//   node tools/creators-list.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const listOf = name => {
  const at = src.indexOf('const ' + name + '=[');
  if (at < 0) throw new Error('нет списка ' + name);
  const end = src.indexOf('];', at);
  return src.slice(at, end).match(/'([^']+)'/g).map(s => s.slice(1, -1));
};
const mapBlock = name => {
  const at = src.indexOf('const ' + name + '={');
  if (at < 0) throw new Error('нет карты ' + name);
  const end = src.indexOf('\n};', at);
  return src.slice(at, end);
};

const REGIONS = [
  ['EU',   'Европа'],
  ['CIS',  'СНГ'],
  ['NAC',  'Америка (NAC/NAW)'],
  ['BR',   'Бразилия'],
  ['ASIA', 'Азия, Океания, Ближний Восток'],
];
const lists = {};
REGIONS.forEach(([k]) => { lists[k] = listOf('CC_PROAM_CREATORS_' + k); });

// Твич: 'Имя':['login',число]
const tw = {};
mapBlock('CC_PROAM_TWITCH').replace(/'([^']+)'\s*:\s*\[\s*'([^']+)'\s*,\s*(\d+)/g,
  (m, name, login, n) => { tw[name] = { login, n: Number(n) }; return m; });
// Аватарки: 'Имя':'файл'
const ava = {};
mapBlock('CC_PROAM_AVA').replace(/'([^']+)'\s*:\s*'([^']+\.(?:png|jpe?g|gif|webp))'/g,
  (m, name, file) => { ava[name] = file; return m; });

const all = [];
REGIONS.forEach(([k, label]) => {
  console.log('');
  console.log(label + ' — ' + lists[k].length);
  lists[k].forEach(n => {
    all.push(n);
    const t = tw[n], a = ava[n];
    const has = fs.existsSync(path.join(ROOT, 'photos', 'creators', a || '_'));
    console.log('  ' + n.padEnd(16) +
      (t ? ('twitch.tv/' + t.login).padEnd(28) + String(t.n).padStart(9) : '—'.padEnd(37)) +
      (a ? '  ' + (has ? 'аватарка' : 'ФАЙЛА НЕТ: ' + a) : '  без аватарки'));
  });
});

console.log('');
console.log('ВСЕГО: ' + all.length + ' человек, из них с твичем ' +
  all.filter(n => tw[n]).length + ', с аватаркой ' + all.filter(n => ava[n]).length);
const dupes = all.filter((n, i) => all.indexOf(n) !== i);
if (dupes.length) console.log('ПОВТОРЫ В СПИСКАХ: ' + dupes.join(', '));
const noTw = all.filter(n => !tw[n]);
if (noTw.length) console.log('без твича: ' + noTw.join(', '));
const noAva = all.filter(n => !ava[n]);
if (noAva.length) console.log('без аватарки: ' + noAva.join(', '));
const orphanTw = Object.keys(tw).filter(n => all.indexOf(n) < 0);
if (orphanTw.length) console.log('твич есть, а в списках НЕТ: ' + orphanTw.join(', '));
const orphanAva = Object.keys(ava).filter(n => all.indexOf(n) < 0);
if (orphanAva.length) console.log('аватарка есть, а в списках НЕТ: ' + orphanAva.join(', '));
// И файлы, которые лежат в папке, но ни на кого не ссылаются.
const dir = path.join(ROOT, 'photos', 'creators');
if (fs.existsSync(dir)) {
  const used = new Set(Object.values(ava));
  const stray = fs.readdirSync(dir).filter(f => !used.has(f));
  if (stray.length) console.log('лишние файлы в photos/creators: ' + stray.join(', '));
}
