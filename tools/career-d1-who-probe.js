// Кто сидит в комнате Дивизиона 1 сейчас — его вопрос, 23 августа, после
// расширения пула, свободных агентов и распадов дуо. Строит поле кубка Д1
// для карьеры в ЕС и печатает верх комнаты по силе: имена, реальные ли,
// и сколько в комнате реальных пар против сгенерированных.
//
//   node tools/career-d1-who-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'WhoProbe', age:18, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-05', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry(); CARD_MODE=true; squadSize=2;
    const field=careerCupField(CAREER.career, [], null, 'whoprobe', false, 0);
    const isReal=t=>(t.squad||[]).every(c=>c && c.handle && c.tier!=='ladder');
    out.field=field.length;
    out.real=field.filter(isReal).length;
    const ranked=field.slice().sort((a,b)=>b.pow-a.pow);
    out.top=ranked.slice(0,20).map(t=>({
      name:String(t.name||'').replace(/<[^>]*>/g,''),
      pow:Math.round(t.pow*10)/10,
      real:isReal(t)
    }));
    out.genInTop20=out.top.filter(t=>!t.real).length;
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccd1who-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out, null, 2));
if (out.fail) process.exit(1);
