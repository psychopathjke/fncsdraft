// Собранная папка деплоя — та же, что уедет на сайт.
//
// Проверяется не «файлы скопировались», а то, чем папка отличается от рабочей:
// в ней НЕТ tools/, docs/ и .git, и любая ссылка, которая жила за счёт рабочей
// папки, здесь превращается в 404 на боевом сайте. Ловушка настоящая: старая
// папка fncsdraft-deploy ехала БЕЗ zone-sim.js и zone-replay.js, хотя
// index.html грузит их тегами.
//
// Страница поднимается из САМОЙ папки, а не из репозитория, и считается всё,
// что она попросила и не получила.
//
//   node tools/check-deploy-folder.js "C:\\путь\\к\\папке"
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const DIR = process.argv[2] || path.resolve(__dirname, '..', '..', 'fncsdraft-deploy-24.08');
if (!fs.existsSync(path.join(DIR, 'index.html'))) {
  console.error('в папке нет index.html: ' + DIR); process.exit(2);
}
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const fails = [];

// ---- то, что index.html просит тегами, должно лежать рядом ----------------
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const asked = new Set();
[...html.matchAll(/(?:src|href)="([^"#?:]+\.(?:js|css|png|jpg|jpeg|webp|ico|svg))(?:\?[^"]*)?"/g)]
  .forEach(m => asked.add(m[1]));
asked.forEach(rel => {
  if (!fs.existsSync(path.join(DIR, rel))) fails.push('нет файла из разметки: ' + rel);
});

/* ---- версия в адресе скрипта совпадает с самим скриптом -------------------

   Тот самый баг 24 августа: index.html уехал новый, а zone-sim.js браузер взял
   из кэша по тому же адресу — и страница позвала `game.roster()`, которой в
   старом движке нет. Документ браузер перепроверяет, скрипт по неизменному
   адресу — нет, и рассинхрон живёт до тех пор, пока человек не нажмёт Ctrl+F5,
   о чём он, разумеется, не знает.

   Поэтому у скриптов в адресе стоит короткий хеш содержимого, а здесь
   проверяется, что он не отстал. Забыть обновить руками нельзя: папка не
   соберётся зелёной. */
const crypto = require('crypto');
[...html.matchAll(/src="([^"?]+\.js)\?v=([0-9a-f]+)"/g)].forEach(m => {
  const file = path.join(DIR, m[1]);
  if (!fs.existsSync(file)) return;             // о пропаже скажет проверка выше
  const real = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, m[2].length);
  if (real !== m[2])
    fails.push('версия в теге отстала: ' + m[1] + '?v=' + m[2] + ', а файл сейчас ' + real +
               ' — обнови ?v=, иначе браузер отдаст старый файл к новой странице');
});
// И наоборот: скрипт без версии — приглашение к тому же рассинхрону.
[...html.matchAll(/<script src="([^"?]+\.js)"><\/script>/g)].forEach(m => {
  fails.push('скрипт без ?v=: ' + m[1] + ' — его закэшируют и он разъедется со страницей');
});

// ---- и то, что она просит уже в браузере ----------------------------------
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const bad=[], errs=[];
  window.addEventListener('error', function(e){
    const t=e.target;
    if(t && (t.tagName==='IMG'||t.tagName==='SCRIPT'||t.tagName==='LINK'))
      bad.push((t.src||t.href||'').replace(location.href, ''));
    else errs.push(String(e.message)+' @'+e.lineno);
  }, true);
  setTimeout(function(){
    // Карты и режимы поднимаются лениво — дать им попросить своё.
    try{ if(typeof useLandingSet==='function') useLandingSet('m2'); }catch(e){ errs.push(String(e)); }
    setTimeout(function(){
      document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(
        {bad:[...new Set(bad)].slice(0,40), errs:[...new Set(errs)].slice(0,40),
         zones:(typeof ALL_LANDING_ZONES!=='undefined')?ALL_LANDING_ZONES.length:-1,
         maps:(typeof ZONE_SETS!=='undefined')?Object.keys(ZONE_SETS).length:-1}))+'END';
    }, 400);
  }, 900);
})();
<\/script>`;

const tmp = path.join(DIR, '__deploycheck.html');
fs.writeFileSync(tmp, html + BOOT);
let dom = '';
try {
  dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
    '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
    'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
} finally { fs.rmSync(tmp, {force:true}); }
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('страница из папки не поднялась'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.bad.forEach(u => fails.push('404 в браузере: ' + u));
out.errs.forEach(e => fails.push('ошибка на странице: ' + e));
if (out.maps < 5) fails.push('карт загрузилось ' + out.maps);
if (out.zones < 10) fails.push('коробок на острове ' + out.zones);

const files = (function walk(d){ let n=0;
  for(const e of fs.readdirSync(d, {withFileTypes:true}))
    n += e.isDirectory() ? walk(path.join(d, e.name)) : 1;
  return n; })(DIR);
console.log('  папка: ' + DIR);
console.log('  файлов: ' + files + ' (лимит drag&drop у Cloudflare — 1000)');
console.log('  из разметки просится: ' + asked.size + ', карт: ' + out.maps +
            ', коробок на m2: ' + out.zones);
if (files > 1000) console.log('  ВНИМАНИЕ: перетаскиванием не пройдёт, только Wrangler');
if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('папка деплоя поднимается сама по себе: ни одного 404, ни одной ошибки');
