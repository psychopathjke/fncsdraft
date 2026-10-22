// Длинного тире «—» на экране нет — ни на главной, ни во вкладках карьеры, ни на одном языке.
//
// Его правило (17.10 главная, 18.10 весь интерфейс): «без длинных тире». Строки словаря чистит
// ccNoDash в L(), но текст собирается и мимо словаря (шаблоны, имена турниров, склейки), и
// исходник это не покажет: тире в нём тысячи, почти все — в комментариях и в строках, которые
// L() потом чистит. Поэтому проверяется то, что видит игрок: innerText открытых экранов.
//
//   node tools/check-ui-dash.js            (все языки)
//   CC_LANGS=ru,en node tools/check-ui-dash.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SL = String.fromCharCode(92);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const LANGS = String(process.env.CC_LANGS || 'ru,en,fr,it,pt').split(',').map(s => s.trim()).filter(Boolean);
const TABS = ['centre', 'me', 'calendar', 'train', 'social', 'club', 'world', 'log', 'hist', 'shop', 'locker', 'table'];

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={hits:[], seen:0, err:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const vis=el=>{ const r=el.getBoundingClientRect(); return r.width>0 && r.height>0; };
  const scan=(where)=>{
    const txt=document.body.innerText||''; out.seen++;
    let i=-1; while((i=txt.indexOf('\\u2014', i+1))>=0){
      const ctx=txt.slice(Math.max(0,i-50), i+30).replace(/\\s+/g,' ');
      if(!out.hits.some(h=>h.ctx===ctx) && out.hits.length<80) out.hits.push({where, ctx});
    }
  };
  try{
    for(const lang of ${JSON.stringify(LANGS)}){
      try{ setLang(lang); }catch(e){}
      await wait(400);
      try{ if(typeof homeRender==='function') homeRender(); }catch(e){}
      scan(lang+' home');
      localStorage.removeItem('fncsdraft_career');
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Dash', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
          region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
        career:{season:1, year:2026, year0:2026, day:'2026-05-06', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'dash'},
        partners:[]}));
      careerLoad(); show('screen-career-hub');
      for(const t of ${JSON.stringify(TABS)}){
        try{ careerRenderHub(t); }catch(e){ continue; }
        await wait(120);
        scan(lang+' '+t);
      }
    }
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uidash-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + path.join(dir, 'p'),
  '--allow-file-access-from-files', '--virtual-time-budget=240000', '--window-size=1366,900', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('ERR ' + out.err); process.exit(1); }
if (out.hits.length) {
  out.hits.forEach(h => console.log(' FAIL ' + h.where + ': …' + h.ctx + '…'));
  console.log('длинное тире на экране: ' + out.hits.length + ' мест, экранов ' + out.seen);
  process.exit(1);
}
console.log('на экранах длинного тире нет (' + out.seen + ' экранов, ' + LANGS.join('/') + ')');
