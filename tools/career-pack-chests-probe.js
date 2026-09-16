// «Сплитнуть локу без файта, но хуже лутом — лут всё равно примерно такой же,
// как если б был анкон». Тестер, 16 сентября 2026.
//
// Сила пака (ccPackPow) по числу открытых сундуков: 2, 4, 6, 8, 12, 24 — среднее
// и распределение, 2000 бросков на каждое, пул сезона s42.
//
//   node tools/career-pack-chests-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {rows:[], fail:null};
  try{
    const set=ccLootSet();
    [2,4,6,8,12,24].forEach(n=>{
      const N=2000; let sum=0; const hist={};
      for(let i=0;i<N;i++){
        const p=ccChestPack(Math.random, set, n);
        const v=ccPackPow(p); sum+=v; hist[v]=(hist[v]||0)+1;
        // и «уход с точки»: пак из n сундуков, слитый с пустым, как в ccAskSite
      }
      out.rows.push({n, mean:Math.round(sum/N*100)/100, hist});
    });
    out.set=set;
  } catch(e){ out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpack-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error(out.fail); process.exit(1); }
console.log('пул:', out.set);
out.rows.forEach(r => console.log('сундуков ' + String(r.n).padStart(2) + ': средняя сила ' + r.mean + '  ' +
  Object.keys(r.hist).map(Number).sort((a,b)=>a-b).map(k => k + ':' + Math.round(r.hist[k]/20) + '%').join(' ')));
