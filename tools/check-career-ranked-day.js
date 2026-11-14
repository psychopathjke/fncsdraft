// Ранкед в турнирный день: сессия днём, свой кап вечером остаётся.
//   node tools/check-career-ranked-day.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found, set CHROME to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    // Турнирный день: ранкед играется днём, свой кап вечером остаётся.
    const DAY='2026-03-22';
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Ranker', age:17, source:'rookie', country:'de', countryPing:7, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:DAY, division:4, earnings:0, balance:0, reach:0, energy:100, tokens:[], log:[], news:[], life:{rp:500}}, partner:null}));
    { const s0=JSON.parse(localStorage.getItem('fncsdraft_career')); s0.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s0)); }
    careerEntry();
    if(careerNext().type!=='victory' || careerNext().day!==DAY) fail(DAY+' is not a cup day: '+careerNext().type);
    if(ccArenaPlayWhy()) fail('ranked closed on a cup day: '+ccArenaPlayWhy());
    CH_TAB='train'; careerRenderHub('train');
    const btn=document.querySelector('#chBody .rk-play');
    if(!btn || btn.disabled) fail('ranked play button disabled on a cup day');
    const rp0=JSON.stringify(ccLife().rk||{});
    btn.click();
    if(JSON.stringify(ccLife().rk||{})===rp0) fail('ranked session did not play');
    if(careerToday()!==DAY) fail('ranked moved the day');
    if(careerNext().type!=='victory' || !careerCanPlayKindOn(DAY, 'victory')) fail('the evening cup is gone after ranked');
    out.steps.push('cup day '+DAY+': ranked session played from the training tab, the evening cup still on');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrkday-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('OK ranked plays on a cup day');
