// Один человек — одна сцена в день (17.10, Notion «fncsdraft 15.10»: «тайсон и на na и в европе»).
// TaySon в 2024-м: Мейджоры 1–2 за Европу, с квала Мейджора 3 — NAC. Сцена года не должна держать
// его в двух регионах сразу, а тёзки, играющие параллельно (Rise NAC/ASIA, Cold NAC/NAW), остаются
// в обоих — см. ccYearMovers.
//
//   node tools/check-career-movers.js
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
const BOOT = `<pre id="__out" style="display:none"></pre><script>
(async function(){ const out={fails:[], rows:[], err:null};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
try{
  const seed=(y, day)=>{
    const s={v:1, player:{nick:'Mover', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU',
      ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:ccYearRosterSize(y), year:y, year0:y, day:day, division:2, earnings:0, balance:0, reach:0,
        tokens:[], log:[], news:[], seed:'mv'+y}, partners:[]};
    localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); };
  const where=k=>['EU','NAC','NAW','BR','ASIA','ME','OCE'].filter(reg=>
    ccAsRegion(reg, ()=>ccSceneRoster(reg)).some(p=>hKey(p)===k));
  const pool=(reg, k)=>ccAsRegion(reg, ()=>ccEuCards()).some(c=>c._k===k && ccCardYear(c)===ccNowYear());
  for(const [day, want] of [['2024-03-01','EU'], ['2024-06-01','EU'], ['2024-08-20','NAC'], ['2024-10-20','NAC']]){
    seed(2024, day);
    const w=where('tayson');
    out.rows.push('2024 '+day+' tayson: '+w.join(','));
    check('TaySon '+day+' в одной сцене '+want, w.length===1 && w[0]===want, w.join(','));
    const other=want==='EU' ? 'NAC' : 'EU';
    check('TaySon '+day+' нет в пуле лобби '+other, !pool(other, 'tayson'));
  }
  seed(2025, '2025-06-01');
  const rise=where('rise'), cold=where('cold');
  out.rows.push('2025 rise: '+rise.join(',')+' · cold: '+cold.join(','));
  check('Rise (тёзки) в NAC и ASIA', rise.includes('NAC') && rise.includes('ASIA'), rise.join(','));
  check('Cold остаётся в NAC', cold.includes('NAC'), cold.join(','));
  check('Глобалы не переселяют: Merem в ASIA', !ccYearMovers(2025).has('merem'));
}catch(e){ out.err=String(e && e.stack || e); }
document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND'; })();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmv-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.rows.forEach(r => console.log('  ' + r));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-movers');
