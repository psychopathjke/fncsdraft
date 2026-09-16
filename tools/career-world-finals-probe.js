// «Чтобы даже за турниры, в которые не играл игрок, тоже суммировались призовые в
// таблицу». Тестер, 16 сентября 2026.
//
// Карьера пятого дивизиона, которая никуда не квалится, шагает по году неделями
// (careerSkipWeek) — и печатает, что за год сыграл мир без неё: сколько финалов
// оплачено (cr.worldPaid), сколько людей в доске призовых и сколько там денег,
// первая пятёрка доски и строки ленты о чужих победах.
//
//   node tools/career-world-finals-probe.js [недель]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WEEKS = +(process.argv[2] || 40);
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
(async function(){
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nobody', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:70, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:'nobody1609', cardRegion:'EU', nat:null},
      career:{season:1, size:2, day:'2026-01-05', division:5, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true;
    const cr=CAREER.career;
    const t0=Date.now();
    for(let w=0; w<${WEEKS}; w++){
      const before=cr.day;
      try{ careerAdvanceTo(ccAddDays(cr.day, 7)); }catch(e){ out.fail='advance week '+w+': '+String(e && e.stack || e); break; }
      if(cr.day===before) break;
    }
    out.ms=Date.now()-t0;
    out.day=cr.day;
    out.paid=Object.keys(cr.worldPaid||{});
    const rows=careerMoney().rows||{};
    const list=Object.keys(rows).map(h=>({h, usd:rows[h].usd||0, ev:rows[h].events||0})).sort((a,b)=>b.usd-a.usd);
    out.people=list.length;
    out.total=list.reduce((s,r)=>s+r.usd, 0);
    out.top=list.slice(0,5);
    out.myLog=(cr.log||[]).map(r=>r.kind).reduce((m,k)=>{ m[k]=(m[k]||0)+1; return m; }, {});
    out.worldNews=(cr.news||[]).filter(n=>n.key==='ccNewsWorldWon' || (n.k==='ccNewsWorldWon')).length;
    out.newsSample=(cr.news||[]).filter(n=>JSON.stringify(n).indexOf('ccNewsWorldWon')>=0).slice(0,4).map(n=>JSON.stringify(n).slice(0,160));
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccwf-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=1800000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs && out.errs.length) console.log('ошибки страницы:', out.errs.slice(0,5));
if (out.fail) { console.error(out.fail); }
console.log('день', out.day, 'за', Math.round((out.ms||0)/1000), 'с; свои вечера:', JSON.stringify(out.myLog));
console.log('мир оплатил:', (out.paid||[]).length, (out.paid||[]).join(' '));
console.log('доска: людей', out.people, 'всего $' + out.total);
console.log('топ-5:', JSON.stringify(out.top));
console.log('строк «без меня» в ленте:', out.worldNews, (out.newsSample||[]).join('\n'));
