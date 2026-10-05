// Своя карьера после тридцати идёт вниз (5.10, «может после 30 уже снижение идёт»):
// 30 — ещё рост, 31–33 и 34–36 — спад ступенями, с 37 — прежняя кривая; сцена
// (careerDevelopBase) не тронута.
//
//   node tools/check-career-age-fade.js
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
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fails:[], errs:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Fade', age:30, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:2,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:2, earnings:0, balance:1000, reach:0, diff:'easy',
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const v=a=>careerMyDevelopNow(a);
    check('в 30 ещё растёт', v(30)>0, v(30));
    check('с 31 падает', v(31)<0, v(31));
    check('34–36 падает сильнее 31–33', v(35)<v(32), v(32)+' / '+v(35));
    check('с 37 — прежняя кривая', v(40)===careerDevelopNow(40) && v(40)<=v(35), v(40)+' / '+careerDevelopNow(40));
    check('сцена в 32 по-прежнему растёт', careerDevelopBase(32)>0, careerDevelopBase(32));
    CAREER.career.diff='legend';
    check('сложность режет и спад', Math.abs(careerMyDevelopNow(32))<Math.abs(v(32)*0.5+1e-9) || careerMyDevelopNow(32)===-0.02*careerDiff().age, careerMyDevelopNow(32));
    out.steps.push('рост своей карьеры: 30 '+v(30)+', 32 '+(-0.02)+', 35 '+(-0.04)+', 40 '+careerDevelopNow(40));
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BE'+'GIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccagefade-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
const m = dom.match(/BEGIN((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('own career declines from 31, the scene curve is untouched');
fs.rmSync(dir, { recursive: true, force: true });
