---
name: new-guard
description: Как написать новый сторож/пробу tools/check-*.js для fncsdraft (headless Chrome по index.html, вывод PBEGIN…PEND). Использовать, когда нужно воспроизвести баг пробой или закрепить починку сторожем.
---

# Новый сторож

Образец — tools/check-career-mate-role.js (простая проба) и tools/check-ui-dash.js (несколько экранов, async). Шаблон:

```js
// Что проверяется и почему — с источником (Notion «ДД.ММ», X, журнал поломок). Как запускать:
//   node tools/check-<что>.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SL = String.fromCharCode(92);            // обратный слэш без обратного слэша в исходнике
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  try{
    localStorage.clear();
    localStorage.setItem('fncsdraft_career', JSON.stringify({ v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:85,
              role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, year:2026, year0:2026, day:'2026-05-06', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'probe'},
      partners:[] }));
    careerLoad(); show('screen-career-hub'); careerRenderHub('centre');
    // … действия и check(…)
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + path.join(dir, 'p'),
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(SL).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log(' FAIL ' + f)); process.exit(1); }
console.log('<одна строка: что подтверждено>');
```

Ловушки:
- Маркеры собирать по частям ('PB'+'EGIN'): «END» встречается в тексте страницы.
- Своя `--user-data-dir` обязательно — иначе headless цепляется к его открытому Chrome. Весь Chrome никогда не убивать.
- Внутри BOOT (шаблонная строка) обратный слэш удваивать (`'\\u2014'`), `${…}` — подстановка Node, не браузера.
- confirm()/alert() на странице вешают пробу — подменять `window.confirm=()=>true` в начале BOOT.
- Онлайн (двое) — не этот шаблон, а tools/check-mp-*.js и check-mp-team-season.js (два Chrome + локальный воркер 8787).
- Писать файл через Write, не через heredoc в Bash, если в нём есть обратные слэши.
- Новый сторож, который должен идти перед каждой выкладкой, — дописать в список tools/run-guards.sh.
