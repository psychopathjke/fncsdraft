// Что страница просит с сервера, а его там нет.
//
// Повод — Observatory зоны 5 сентября 2026: 19,18 тысячи ответов 4xx с origin
// за сутки. Каждый такой запрос — лишний круг до Cloudflare и обратно, а для
// того, у кого дорога и так плохая, ещё и лишние секунды.
//
// Проверяются два списка, которые страница строит по именам файлов: портреты
// (PLAYER_PHOTO → photos/) и гербы клубов (ORG_LOGO → logos/). Если имя в
// списке есть, а файла нет — браузер сходит за ним и получит 404.
//
//   node tools/check-missing-files.js [папка]
// Без аргумента проверяется сам репозиторий.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const DIR = process.argv[2] ? path.resolve(process.argv[2]) : ROOT;
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__m" style="display:none"></pre>
<script>
(function(){
  var o={photos:[], logos:[], err:null};
  try{
    // Портреты: карта имя → файл, и папка, куда она смотрит.
    o.photoDir = (typeof PHOTO_DIR==='string') ? PHOTO_DIR : null;
    if(typeof PLAYER_PHOTO==='object' && PLAYER_PHOTO)
      o.photos = Object.keys(PLAYER_PHOTO).map(function(k){ return PLAYER_PHOTO[k]; });
    // Гербы: имя клуба превращается в файл той же функцией, что и на карточке.
    /* Гербы: КАЖДОЕ имя клуба с ростера прогоняется через ту же функцию,
       которой пользуется карточка. clubLogoHTML не сверяется ни с каким
       списком — она просто ставит <img> и полагается на onerror, поэтому
       клуб без файла это гарантированный 404 на каждой такой карточке. */
    if(typeof clubLogoFile==='function' && typeof PLAYERS!=='undefined'){
      var orgs={};
      PLAYERS.forEach(function(p){ if(p && p.org) orgs[p.org]=1; });
      o.orgCount=Object.keys(orgs).length;
      /* Что карточка РЕАЛЬНО просит: имя файла берётся из разметки, которую
         она рисует, а не из функции имён. Клуб без герба обязан не давать
         никакой картинки вовсе — иначе это 404 на каждой такой карточке. */
      o.asks=[];
      Object.keys(orgs).forEach(function(n){
        var html=(clubLogoHTML(n,false)||'')+(typeof clubCrestHTML==='function'?clubCrestHTML(n,false):'');
        // Без регулярки с косой чертой: она едет сюда через строку в другой
        // строке, и один потерянный слэш валит весь скрипт пробы молча.
        var parts=html.split('src="logos');
        for(var i=1;i<parts.length;i++){
          var q=parts[i].indexOf('"');
          if(q>0) o.asks.push(parts[i].slice(1, q));
        }
      });
      o.logos=o.asks;
    }
  }catch(e){ o.err=String(e&&e.message||e); }
  document.getElementById('__m').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(o))+'PE'+'ND';
})();
<\u002fscript>`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'missing-'));
const tmp = path.join(tmpDir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(tmpDir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }

const have = d => {
  const p = path.join(DIR, d);
  return fs.existsSync(p) ? new Set(fs.readdirSync(p)) : new Set();
};
const photos = have('photos'), logos = have('logos');
const missPhotos = [...new Set(out.photos)].filter(f => f && !photos.has(f));
const missLogos = [...new Set(out.logos)].filter(f => f && !logos.has(f));

console.log('  портретов в списке: ' + new Set(out.photos).size + ', файлов в папке: ' + photos.size);
console.log('  клубов на ростере:  ' + (out.orgCount||0) + ', гербов в папке: ' + logos.size +
            ', карточка просит: ' + new Set(out.logos).size);
const fails = [];
if (missPhotos.length) {
  fails.push('портретов нет на диске: ' + missPhotos.length);
  missPhotos.slice(0, 12).forEach(f => console.error('    нет photos/' + f));
}
if (missLogos.length) {
  fails.push('карточка просит гербы, которых нет: ' + missLogos.length +
             ' — это 404 на каждой такой карточке');
  missLogos.slice(0, 12).forEach(f => console.error('    нет logos/' + f));
}
if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('всё, что страница просит по имени файла, на диске есть');
