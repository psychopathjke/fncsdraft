// Собирает папку, которую можно тащить в Cloudflare Pages, и по дороге режет
// index.html на маленькую оболочку и app.js.
//
//   node tools/build-deploy.js "C:\путь\к\новой\папке"
//
// ЗАЧЕМ РЕЗАТЬ. Страница — один документ на 5,4 МБ (1,2 МБ бротли), и Pages
// отдаёт его с `max-age=0, must-revalidate` и БЕЗ ETag: каждый заход качает
// всё заново, 304 не бывает никогда. На тонком канале это выглядит как «сайт
// не грузится» — приходит <head> (вкладка уже называется fncsdraft), а тело
// не доезжает. Отчёт игрока 2 сентября 2026 со скрином белой страницы с этим
// самым заголовком вкладки; через инкогнито и без VPN то же самое.
//
// После сборки документ — 75 КБ по проводу, а приложение уезжает в app.js с
// ?v=<хеш> и кэшируется вечно (см. _headers): второй заход качает только те
// самые 75 КБ. Замерено на 1 Мбит/с: первая отрисовка 8,0 с → 1,8 с.
//
// ПОЧЕМУ ЭТО СБОРКА, А НЕ ПРАВКА В РЕПОЗИТОРИИ. 358 харнессов копируют
// index.html во временную папку, и 121 из них — БЕЗ <base href>. Внешний
// app.js рядом с копией не лежит, и все они разом краснеют на «careerYearDays
// is not defined» (так и покраснел check-career-cup, когда файл был разрезан
// в самом репозитории). Поэтому в репозитории index.html остаётся цельным —
// его читают проверки, — а режется то, что уезжает на сайт. Собранную папку
// проверяет tools/check-deploy-folder.js: он поднимает её в Chrome и считает
// 404 и ошибки, то есть разрез проверяется каждый раз заново.
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, '..', 'fncsdraft-deploy'));
if (fs.existsSync(OUT) && fs.readdirSync(OUT).length)
  throw new Error('папка уже существует и не пуста: ' + OUT);

/* Что нужно сайту. Папки целиком: пути к фото, лого и девайсам строятся в
   рантайме ('photos/'+handle), выборочно класть нельзя. Чего тут нет — tools/,
   docs/, .git, README, shot-*.png, replay-preview.html: 270 харнессов и проб
   съедают лимит Cloudflare в 1000 файлов на drag&drop, а сайту не нужны. */
const FILES = ['index.html', '404.html', 'maps.js', 'zone-sim.js', 'zone-replay.js', 'mp.js',
  'logo.png', 'og-image.png', 'robots.txt', 'sitemap.xml', '_headers',
  'favicon.ico', 'favicon-48.png', 'favicon-96.png', 'favicon-192.png'];
const DIRS = ['art', 'items', 'logos', 'photos', 'devices', 'fonts'];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true }))
    e.isDirectory() ? copyDir(path.join(from, e.name), path.join(to, e.name))
                    : fs.copyFileSync(path.join(from, e.name), path.join(to, e.name));
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) throw new Error('нет файла: ' + f);
  fs.copyFileSync(src, path.join(OUT, f));
}
for (const d of DIRS) {
  const src = path.join(ROOT, d);
  if (!fs.existsSync(src)) throw new Error('нет папки: ' + d);
  copyDir(src, path.join(OUT, d));
}

/* Разрез. Приложение — самый большой инлайновый <script> без src; всё
   остальное (ld+json в шапке и маленький скрипт ленивых картинок в подвале)
   остаётся на месте. Ищем по величине, а не по номеру строки: строки едут
   каждый день. */
const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const re = /<script(?![^>]*\ssrc=)([^>]*)>/gi;
let m, best = null;
while ((m = re.exec(html))) {
  const open = m.index, from = re.lastIndex;
  const end = html.indexOf('</script>', from);
  if (end < 0) throw new Error('незакрытый <script> на позиции ' + open);
  if (!best || end - from > best.len) best = { open, from, end, len: end - from, attrs: m[1].trim() };
  re.lastIndex = end + 9;
}
if (!best || best.len < 3e6) throw new Error('не нашёл приложение: крупнейший блок ' + (best && best.len));
if (best.attrs) throw new Error('у блока приложения появились атрибуты: ' + best.attrs);

fs.writeFileSync(path.join(OUT, 'app.js'), html.slice(best.from, best.end), 'utf8');
const hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(OUT, 'app.js'))).digest('hex').slice(0, 8);
fs.writeFileSync(path.join(OUT, 'index.html'),
  html.slice(0, best.open) + '<script src="app.js?v=' + hash + '"></script>' + html.slice(best.end + 9), 'utf8');

const count = (function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true })
    .reduce((n, e) => n + (e.isDirectory() ? walk(path.join(d, e.name)) : 1), 0);
})(OUT);
const kb = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' КБ';
console.log('папка: ' + OUT);
console.log('файлов: ' + count + ' (лимит drag&drop у Cloudflare — 1000)');
console.log('index.html: ' + kb('index.html') + ', app.js: ' + kb('app.js') + ' (?v=' + hash + ')');
console.log('дальше: node tools/check-deploy-folder.js "' + OUT + '"');
