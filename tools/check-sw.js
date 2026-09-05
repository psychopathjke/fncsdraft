// Воркер собран правильно и не может тихо застрять на старой сборке.
//
// Живьём его не проверить: service worker ставится только по https, а все
// харнессы открывают копию страницы файлом. Поэтому проверяется контракт —
// то, из-за чего воркер обычно и превращается из помощи в беду:
//
//   * версия в воркере — это хеш app.js той же сборки (иначе кэши старой и
//     новой сборки называются одинаково и старая переживёт выкладку);
//   * документ идёт СНАЧАЛА В СЕТЬ (иначе новая сборка никогда не доедет);
//   * в списке предзагрузки лежит сама страница и приложение, а фото и арт —
//     не лежат (двадцать пять мегабайт наперёд ради второго захода);
//   * оболочка воркер регистрирует, и только по https;
//   * _headers запрещает кэшировать сам sw.js — это дорога назад.
//
//   node tools/check-sw.js [папка сборки]
// Без аргумента проверяется только исходник в репозитории.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2] ? path.resolve(process.argv[2]) : null;
const fails = [];
const ok = [];

// ---- исходник ------------------------------------------------------------
const src = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
if (src.indexOf("'__VERSION__'") < 0)
  fails.push('в репозитории у воркера нет метки версии — сборке нечего подставить');
if (src.indexOf('__CORE__') < 0)
  fails.push('в репозитории у воркера нет метки списка');
else ok.push('исходник воркера ждёт версию и список от сборки');

const page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (page.indexOf("navigator.serviceWorker.register('sw.js')") < 0)
  fails.push('страница не регистрирует воркер');
else if (page.indexOf("location.protocol!=='https:'") < 0)
  fails.push('регистрация не ограничена https — с file:// это ошибка в каждом харнессе');
else ok.push('страница регистрирует воркер и только по https');

const heads = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
if (!/\/sw\.js\s*\n\s*Cache-Control:\s*no-cache/i.test(heads))
  fails.push('_headers не запрещает кэшировать sw.js — новая сборка не дойдёт до тех, у кого он стоит');
else ok.push('_headers держит sw.js некэшируемым');

// ---- собранная папка -----------------------------------------------------
if (DIR) {
  const swPath = path.join(DIR, 'sw.js');
  if (!fs.existsSync(swPath)) fails.push('в собранной папке нет sw.js');
  else {
    const sw = fs.readFileSync(swPath, 'utf8');
    if (sw.indexOf('__VERSION__') >= 0 || sw.indexOf('__CORE__') >= 0)
      fails.push('сборка не подставила версию или список — воркер уедет с метками');
    // Синтаксис: воркер не в браузере не запустить, но разобрать можно.
    try { new Function(sw.replace(/self\./g, 'globalThis.')); ok.push('воркер разбирается как код'); }
    catch (e) { fails.push('воркер не разбирается: ' + e.message); }

    const shell = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
    const appv = (shell.match(/app\.js\?v=([0-9a-f]+)/) || [])[1];
    const v = (sw.match(/^const V = "([0-9a-f]+)"/m) || [])[1];
    if (!appv) fails.push('в оболочке не нашёлся app.js с версией');
    else if (v !== appv)
      fails.push('версия воркера ' + v + ', а приложение ' + appv + ' — кэши старой сборки переживут выкладку');
    else ok.push('версия воркера совпала с приложением: ' + v);

    let core = null;
    try { core = JSON.parse((sw.match(/^const CORE = (\[[^\n]*\]);/m) || [])[1]); } catch (e) {}
    if (!core || !core.length) fails.push('список предзагрузки пуст или не читается');
    else {
      if (core.indexOf('./') < 0) fails.push('в списке нет самой страницы');
      if (!core.some(u => /app\.js\?v=/.test(u))) fails.push('в списке нет приложения');
      const heavy = core.filter(u => /^\.\/(photos|art|logos|items|devices)\//.test(u));
      if (heavy.length)
        fails.push('в список попали картинки (' + heavy.length + ') — это мегабайты наперёд');
      if (!fails.length || core.length) ok.push('в списке ' + core.length + ' адресов: страница, скрипты, шрифты');
    }
    // Документ — сначала сеть. Смотрим на сам порядок в коде: в ветке
    // документа fetch стоит раньше, чем caches.match.
    const doc = sw.slice(sw.indexOf('if (isDoc(req))'));
    const netAt = doc.indexOf('await fetch(req)'), cacheAt = doc.indexOf('caches.match');
    if (netAt < 0 || cacheAt < 0 || netAt > cacheAt)
      fails.push('документ берётся из кэша раньше сети — новая сборка не доедет');
    else ok.push('документ идёт сначала в сеть, кэш запасным');
  }
}

ok.forEach(s => console.log('  ' + s));
if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('воркер собран правильно' + (DIR ? '' : ' (папку не проверяли — дайте путь аргументом)'));
