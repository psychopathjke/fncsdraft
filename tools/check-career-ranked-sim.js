// Ранкед: иконки рангов и быстрый прогон сессии (пропустить, готово, полный прогон).
//   node tools/check-career-ranked-sim.js
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
    const DAY='2026-03-23';
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Ranker', age:17, source:'rookie', country:'de', countryPing:7, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:DAY, division:4, earnings:0, balance:0, reach:0, energy:100, tokens:[], log:[], news:[], life:{rp:500}}, partner:null}));
    { const s0=JSON.parse(localStorage.getItem('fncsdraft_career')); s0.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s0)); }
    careerEntry();
    // все иконки рангов на месте
    const srcs=CC_RANKS.map((n,i)=>ccRkIconSrc(i)).concat([ccRkIconSrc(null)]);
    const miss=[]; await Promise.all(srcs.map(u=>new Promise(r=>{ const im=new Image(); im.onload=()=>r(); im.onerror=()=>{ miss.push(u); r(); }; im.src=u; })));
    if(miss.length) fail('rank icons missing: '+miss.join(', '));
    out.steps.push(srcs.length+' rank icons load');
    CH_TAB='train'; careerRenderHub('train');
    if(document.querySelectorAll('#chBody .rk-tile img.rk-ic').length<1) fail('no rank icon in the tile');
    const n0=ccRk().n||0;
    document.querySelector('#chBody .rk-play').click();
    if((ccRk().n||0)===n0) fail('session did not play');
    const sim=document.getElementById('rkSim'); if(!sim) fail('no playback window after the session');
    await new Promise(r=>setTimeout(r, 1500));
    if(!document.getElementById('rkSimDone').hidden) fail('playback ended at once');
    const ph=document.getElementById('rkSimPh').textContent; if(!ph) fail('playback shows nothing');
    out.steps.push('playback runs: '+document.getElementById('rkSimN').textContent+' · '+ph);
    document.getElementById('rkSimSkip').click();
    if(document.getElementById('rkSimDone').hidden) fail('skip did not show the result');
    const tot=+document.getElementById('rkSimK').textContent, real=ccRk().last.games.reduce((a,m)=>a+m.kills,0);
    if(tot!==real) fail('kills in the result '+tot+' vs session '+real);
    document.getElementById('rkSimDone').click();
    if(document.getElementById('rkSim')) fail('done did not close the window');
    // полный прогон без пропуска доходит до итога
    ccRkSimOpen(ccRk().last);
    await new Promise(r=>setTimeout(r, 20000));
    if(document.getElementById('rkSimDone').hidden) fail('full playback did not reach the result');
    ccRkSimClose();
    out.steps.push('skip, done and the full playback work, kills match ('+real+')');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrksim-'));
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
console.log('OK ranked icons and playback');
