// Ник, фото и посты напарника из онлайна приезжают по сети как есть (лобби их не трогает), а сайт рисует их разметкой.
// Обзор безопасности: ник вида <img onerror> на карточке и ник со слэшем перед кавычкой в onclick запускали код у того,
// кто позвал напарника. Сторож держит: карточка экранирует ник и фото, jsq() доносит строку до обработчика без потерь,
// посты соседа чистятся ccPeerSafe, и старый шаблон esc(x).replace(кавычка) не вернулся. Как запускать:
//   node tools/check-peer-xss.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SL = String.fromCharCode(92);
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
// FD_SRC=<файл> — прогнать по другой версии страницы (отрицательный контроль по старому коду).
const SRC = fs.readFileSync(process.env.FD_SRC || path.join(ROOT, 'index.html'), 'utf8');

// Статика: замена одной кавычки без обратного слэша. Разрешены только определение jsq и две строки, где слэш удвоен раньше.
const OLD = ".replace(/'/g," + '"' + SL + SL + "'" + '")';
const lines = SRC.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.includes(OLD));
const bad = lines.filter(([, l]) => !/^function jsq\(/.test(l) && !l.includes('.replace(/' + SL + SL + '/g,'));
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  const B=String.fromCharCode(92), Q=String.fromCharCode(39);
  try{
    window.confirm=()=>true; window.alert=()=>{};
    window.__x1=0; window.__x2=0; window.__x3=0;
    const pool=(typeof ALL_PLAYERS!=='undefined' && ALL_PLAYERS) || (typeof PLAYERS!=='undefined' && PLAYERS) || CC_EU_ALL;
    const base=Object.assign({}, pool[0]);
    const host=document.createElement('div'); document.body.appendChild(host);
    host.innerHTML=futCardHTML(Object.assign({}, base, {handle:'<img src=nope.png onerror="window.__x1=1">'}), {});
    host.innerHTML+=futCardHTML(Object.assign({}, base, {handle:'P', _photo:'nope.png" onerror="window.__x3=1'}), {});
    const d2=document.createElement('div'); document.body.appendChild(d2);
    window.ccPeekByHandle=function(){};
    d2.innerHTML=futCardHTML(Object.assign({}, base, {handle:B+Q+');window.__x2=1;//'}), {peek:true});
    try{ d2.querySelector('.fut-card').click(); }catch(e){}
    // jsq: строка доезжает до обработчика той же, что была
    check('jsq есть', typeof jsq==='function'); check('ccPeerSafe есть', typeof ccPeerSafe==='function');
    if(typeof jsq==='function') ['a'+Q+'b', 'a'+B+'b', 'x'+B+Q+');y', 'q"w<b>&amp;'].forEach(s=>{
      const b=document.createElement('div'); document.body.appendChild(b);
      window.__got=null;
      b.innerHTML='<button onclick="window.__got='+Q+jsq(s)+Q+'">x</button>';
      try{ b.querySelector('button').click(); }catch(e){}
      check('jsq '+JSON.stringify(s), window.__got===s, JSON.stringify(window.__got));
    });
    if(typeof ccPeerSafe==='function'){ const ps=ccPeerSafe({id:1, k:'ccNewsX', a:['<img src=x onerror=1>', 5, {n:'"q'+B}], text:'<b>'});
    check('ccPeerSafe строки', JSON.stringify(ps).indexOf('<')<0 && ps.a[2].n==='q' && ps.a[1]===5, JSON.stringify(ps)); }
    await new Promise(r=>setTimeout(r, 1500));
    check('ник разметкой на карточке', window.__x1===0);
    check('ник со слэшем в onclick', window.__x2===0);
    check('фото напарника в src', window.__x3===0);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + SRC + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + path.join(dir, 'p'),
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(SL).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (bad.length) out.fails.push('старый шаблон кавычки без слэша: строки ' + bad.map(x => x[0]).join(', '));
if (out.err) { console.error('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log(' FAIL ' + f)); process.exit(1); }
console.log('ник, фото и посты напарника не выполняются: карточка, onclick (jsq), ccPeerSafe; старого шаблона нет');
