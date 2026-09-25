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
const FILES = ['index.html', 'about.html', '404.html', 'maps.js', 'zone-sim.js', 'zone-replay.js', 'mp.js', 'sw.js',
  'logo.png', 'og-image.png', 'robots.txt', 'sitemap.xml', '_headers',
  'favicon.ico', 'favicon-48.png', 'favicon-96.png', 'favicon-192.png'];
// flags/ — свои копии флагов: flagcdn.com стоит за Cloudflare, а до него у
// части российских провайдеров запросы висят (5 сентября 2026, см. sw.js).
const DIRS = ['art', 'items', 'logos', 'photos', 'devices', 'fonts', 'flags'];

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
/* ---- ПОКА app.js ЕДЕТ — СКАЗАТЬ ОБ ЭТОМ ----------------------------------
 *
 * Оболочка рисует первый экран целиком (см. prefillI18n ниже): заголовок,
 * кнопки, карточки режимов. Но до прихода app.js ни одна кнопка не работает,
 * а вкладка крутит спиннер — и человек видит «сайт открылся, но не работает,
 * бесконечная загрузка». Отчёт с зеркала 5 сентября 2026 ровно такой: «с
 * телефона всё прекрасно работает», «с ПК бесконечная загрузка», Ctrl+F5 не
 * помог. Где канал до хостинга режут или душат, пять мегабайт приложения едут
 * минуты — или не доезжают вовсе — и ничто на экране этого не говорит.
 *
 * Поэтому внизу стоит строка состояния: «загружаем приложение», через
 * пятнадцать секунд — что сеть медленная и что делать, по onerror — что не
 * загрузилось, с кнопкой обновить. Клик по любой кнопке, пока приложения нет,
 * подсвечивает строку. Как только app.js исполнился (onload), строка уходит.
 * Язык — по navigator.language: словаря ещё нет, он в app.js. */
const BOOT = '<style>' +
  '#fdBoot{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;' +
  'max-width:min(92vw,560px);padding:10px 16px;border-radius:12px;background:rgba(10,14,28,.94);color:#fff;' +
  'font:600 13px/1.4 system-ui,"Segoe UI",Arial,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.14);' +
  'opacity:0;transition:opacity .35s,transform .35s;pointer-events:none}' +
  '#fdBoot.on{opacity:1;pointer-events:auto}' +
  '#fdBoot i{flex:none;width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.25);border-top-color:#ffd600;animation:fdSpin .8s linear infinite}' +
  '@keyframes fdSpin{to{transform:rotate(360deg)}}' +
  '@media (prefers-reduced-motion:reduce){#fdBoot i{animation:none}}' +
  '#fdBoot.slow{border-color:#ffd600}' +
  '#fdBoot.fail{border-color:#ff5c5c}#fdBoot.fail i{animation:none;border-color:#ff5c5c}' +
  '#fdBoot button{flex:none;background:#ffd600;color:#111;border:0;border-radius:8px;padding:6px 12px;font:800 12px system-ui,"Segoe UI",Arial,sans-serif;cursor:pointer}' +
  '#fdBoot.nudge{transform:translateX(-50%) scale(1.06)}' +
  '#fdBoot.off{opacity:0;transform:translateX(-50%) translateY(12px)}' +
  '</style><script>' +
  'window.__fdBoot=(function(){' +
  'var ru=/^ru/i.test(navigator.language||"");' +
  'var T=ru?{wait:"\\u0417\\u0430\\u0433\\u0440\\u0443\\u0436\\u0430\\u0435\\u043c \\u043f\\u0440\\u0438\\u043b\\u043e\\u0436\\u0435\\u043d\\u0438\\u0435\\u2026",' +
  'slow:"\\u0421\\u0435\\u0442\\u044c \\u043c\\u0435\\u0434\\u043b\\u0435\\u043d\\u043d\\u0430\\u044f \\u2014 \\u043f\\u0440\\u0438\\u043b\\u043e\\u0436\\u0435\\u043d\\u0438\\u0435 \\u0435\\u0449\\u0451 \\u0435\\u0434\\u0435\\u0442. \\u0415\\u0441\\u043b\\u0438 \\u0442\\u0430\\u043a \\u0438 \\u043d\\u0435 \\u043e\\u0442\\u043a\\u0440\\u043e\\u0435\\u0442\\u0441\\u044f: \\u043e\\u0431\\u043d\\u043e\\u0432\\u0438\\u0442\\u0435 \\u0441\\u0442\\u0440\\u0430\\u043d\\u0438\\u0446\\u0443 (Ctrl+F5), \\u0441\\u043c\\u0435\\u043d\\u0438\\u0442\\u0435 DNS (1.1.1.1) \\u0438\\u043b\\u0438 \\u0432\\u043a\\u043b\\u044e\\u0447\\u0438\\u0442\\u0435 VPN.",' +
  'fail:"\\u041f\\u0440\\u0438\\u043b\\u043e\\u0436\\u0435\\u043d\\u0438\\u0435 \\u043d\\u0435 \\u0437\\u0430\\u0433\\u0440\\u0443\\u0437\\u0438\\u043b\\u043e\\u0441\\u044c.",retry:"\\u041e\\u0431\\u043d\\u043e\\u0432\\u0438\\u0442\\u044c"}' +
  ':{wait:"Loading the app\\u2026",slow:"Slow network \\u2014 the app is still on its way. If it never opens: reload (Ctrl+F5), change DNS (1.1.1.1) or use a VPN.",fail:"The app did not load.",retry:"Reload"};' +
  'var el=null,t=null,done=false;' +
  'function make(){if(el)return el;el=document.createElement("div");el.id="fdBoot";el.setAttribute("role","status");' +
  'el.innerHTML="<i></i><span></span>";el.lastChild.textContent=T.wait;document.body.appendChild(el);return el;}' +
  'function show(){if(done)return;make();el.className="on";}' +
  'show();' +
  't=setTimeout(function(){if(done)return;show();el.className="on slow";el.lastChild.textContent=T.slow;},15000);' +
  'document.addEventListener("click",function(){if(done||!el)return;el.className+=" nudge";' +
  'setTimeout(function(){if(el)el.className=el.className.replace(" nudge","");},500);},true);' +
  'return{ok:function(){done=true;clearTimeout(t);if(el){el.className="off";' +
  'setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el);el=null;},400);}},' +
  'fail:function(){if(done)return;clearTimeout(t);show();el.className="on fail";' +
  'el.innerHTML="<i></i><span></span><button type=\\"button\\"></button>";el.children[1].textContent=T.fail;' +
  'el.children[2].textContent=T.retry;el.children[2].onclick=function(){location.reload();};}};' +
  '})();' +
  '</script>';
fs.writeFileSync(path.join(OUT, 'index.html'),
  html.slice(0, best.open) + BOOT +
  '<script src="app.js?v=' + hash + '" onload="__fdBoot.ok()" onerror="__fdBoot.fail()"></script>' +
  html.slice(best.end + 9), 'utf8');

/* ---- И ТЕКСТ ПЕРВОГО ЭКРАНА — ПРЯМО В ОБОЛОЧКЕ --------------------------
 *
 * Разрез на оболочку и app.js вылечил половину беды: документ приезжает за
 * 75 КБ. Вторая половина осталась и мерится пробой tools/first-paint-probe.js:
 * пока app.js едет (1,8 МБ бротли), на странице 272 подписи из словаря и НИ
 * ОДНОЙ с текстом. Видно арт, пустые жёлтые пилюли вместо кнопок и ни одной
 * строки — то есть ровно то, что человек называет «сайт не загружается».
 * Отзыв игрока 5 сентября 2026: «в последнее время не могу зайти на сайт».
 *
 * Здесь оболочка получает готовый текст: страница поднимается в Chrome один
 * раз, из неё снимается, чем словарь заполнил каждый data-i18n, и это же
 * кладётся в разметку. Дальше setLang на живом заходе перепишет всё на язык
 * посетителя — как и раньше.
 *
 * Английский, потому что он и так лежит под всеми языками (см. L(): чужой
 * словарь накладывается на en). Русский посетитель увидит английскую строку
 * ровно до того момента, как доедет app.js, — вместо пустого места.
 *
 * Снимается ИЗ ЖИВОЙ СТРАНИЦЫ, а не разбором словаря: значения бывают с
 * подстановками ({CARDS}) и пересобираются после (ccModeCountPills), и
 * повторять эту логику здесь значило бы завести вторую правду. */
function prefillI18n(dir) {
  const { execFileSync } = require('child_process');
  const CHROME = [process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
  ].find(p => p && fs.existsSync(p));
  if (!CHROME) { console.log('Chrome не найден — текст первого экрана не вшит'); return 0; }
  const shellPath = path.join(dir, 'index.html');
  const shell = fs.readFileSync(shellPath, 'utf8');
  // Копия рядом с приложением, чтобы app.js и его файлы нашлись по своим путям.
  const probePath = path.join(dir, '__prefill.html');
  fs.writeFileSync(probePath, shell +
    '<pre id="__p" style="display:none"></pre><script>' +
    'window.addEventListener("load",function(){var o={};try{' +
    'setLang("en",false);applyStaticI18n();' +
    'document.querySelectorAll("[data-i18n]").forEach(function(el){' +
    'var k=el.getAttribute("data-i18n");var v=el.innerHTML;' +
    'if(v&&v.trim()&&!(k in o)) o[k]=v;});' +
    '}catch(e){o.__err=String(e&&e.message||e);}' +
    'document.getElementById("__p").textContent="PB"+"EGIN"+' +
    'encodeURIComponent(JSON.stringify(o))+"PE"+"ND";});<' + '/script>', 'utf8');
  let dump = null;
  try {
    const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
      '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
      'file:///' + probePath.split(path.sep).join('/')],
      { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
    if (m) dump = JSON.parse(decodeURIComponent(m[1]));
  } catch (e) { console.log('снять словарь не вышло: ' + e.message); }
  fs.rmSync(probePath, { force: true });
  if (!dump || dump.__err) { console.log('текст первого экрана не вшит' +
    (dump && dump.__err ? ': ' + dump.__err : '')); return 0; }
  // Заполняются только ПУСТЫЕ элементы — те, что в разметке стоят как
  // <span data-i18n="x"></span>. Всё, у чего содержимое своё, не трогаем.
  let filled = 0;
  const out = shell.replace(/<([a-zA-Z][\w-]*)([^>]*\sdata-i18n="([^"]+)"[^>]*)><\/\1>/g,
    (all, tag, attrs, key) => {
      const v = dump[key];
      if (typeof v !== 'string' || !v) return all;
      filled++;
      return '<' + tag + attrs + '>' + v + '</' + tag + '>';
    });
  fs.writeFileSync(shellPath, out, 'utf8');
  return filled;
}
const prefilled = prefillI18n(OUT);

/* ---- ВОРКЕРУ — ВЕРСИЯ И СПИСОК ТОГО, ЧТО КЛАСТЬ СРАЗУ -------------------
 *
 * sw.js в репозитории лежит с метками вместо версии: там ей взяться неоткуда,
 * а хеши скриптов известны только здесь. Версия — хеш app.js, поэтому у новой
 * сборки другие имена кэшей и старые чистятся сами (см. activate).
 *
 * В список кладётся то, без чего страница не откроется: сама оболочка, четыре
 * скрипта и шрифты. Фото и арт сюда НЕ попадают — их двадцать пять мегабайт,
 * и качать их наперёд ради второго захода незачем: они лягут в кэш по дороге,
 * когда понадобятся. */
(function stampSw() {
  const swPath = path.join(OUT, 'sw.js');
  if (!fs.existsSync(swPath)) return;
  const shell = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  const scripts = [];
  const re = /<script[^>]*src="([^"]+\.js\?v=[0-9a-f]+)"/g;
  let m;
  while ((m = re.exec(shell))) scripts.push('./' + m[1]);
  const fonts = fs.existsSync(path.join(OUT, 'fonts'))
    ? fs.readdirSync(path.join(OUT, 'fonts')).map(f => './fonts/' + f) : [];
  const core = ['./'].concat(scripts, fonts);
  const sw = fs.readFileSync(swPath, 'utf8')
    .replace("'__VERSION__'", JSON.stringify(hash))
    .replace('__CORE__', JSON.stringify(core));
  fs.writeFileSync(swPath, sw, 'utf8');
  console.log('воркер: версия ' + hash + ', в список положено ' + core.length + ' адресов');
})();

const count = (function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true })
    .reduce((n, e) => n + (e.isDirectory() ? walk(path.join(d, e.name)) : 1), 0);
})(OUT);
const kb = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' КБ';
console.log('папка: ' + OUT);
console.log('файлов: ' + count + ' (лимит drag&drop у Cloudflare — 1000)');
console.log('index.html: ' + kb('index.html') + ', app.js: ' + kb('app.js') + ' (?v=' + hash + ')');
console.log('текста первого экрана вшито: ' + prefilled + ' подписей');
console.log('дальше: node tools/check-deploy-folder.js "' + OUT + '"');
