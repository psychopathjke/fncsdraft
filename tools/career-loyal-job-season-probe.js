// Три правки 23 августа одной пробой:
//  - оплаченный переезд запирает напарника (ccMateStays во всех четырёх дверях:
//    терпение, хант, «подумываю уйти», стык сезонов);
//  - смена в макдаке ест долю всего дневного запаса (4 часа = весь день) и
//    больше не постит в ленту;
//  - после S41 сезоны продолжаются: S42, S43 и дальше тем же шагом.
//
//   node tools/career-loyal-job-season-probe.js
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
(async function(){
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeLoyal', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-05', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;

    // --- Макдак: полный день за полную смену, лента молчит -------------------
    out.job={max:careerEnergyMax(), h4:ccJobCost(4), h1:ccJobCost(1)};
    const newsBefore=(cr.news||[]).length, balBefore=cr.balance, en=careerEnergy();
    careerJobWork(2);
    out.job.spent=en-careerEnergy();
    out.job.cost2=ccJobCost(2);
    out.job.paid=cr.balance-balBefore;
    out.job.newsAdded=(cr.news||[]).length-newsBefore;

    // --- Сезоны после 41-го --------------------------------------------------
    out.seasons={
      s41:(careerFncsSeason('2026-08-01')||{}).id,
      after:(careerFncsSeason('2026-09-01')||{}).id,
      afterFrom:(careerFncsSeason('2026-09-01')||{}).from,
      far:(careerFncsSeason('2027-06-15')||{}).id,
      startS42:(careerSeasonStartsOn('2026-08-21')||{}).id,
      startNone:careerSeasonStartsOn('2026-08-25'),
      preCareer:careerFncsSeason('2025-01-01')
    };

    // --- Запертая дверь ------------------------------------------------------
    // Реальный напарник из пула, слабое терпение, оплаченный переезд.
    const pool=careerPools().players.filter(c=>c && c.handle);
    const mate=pool.find(c=>{ const o=(attrsFor(c)||{}).ovr||0; return o>=78 && o<=84; })||pool[0];
    CAREER.partner=mate.handle;
    CAREER.partners=[{handle:mate.handle, patience:5, movedWith:1}];
    out.loyal={handle:mate.handle, stays:ccMateStays(CAREER.partners[0])};
    out.loyal.holds=careerDuoHolds();
    out.loyal.poach=careerMatePoach(1, 100, true);
    const n2=(cr.news||[]).length;
    const morale=careerApplyMorale(90, 100, false); // дно таблицы при терпении 5
    out.loyal.morale={left:morale && morale.left, after:morale && morale.after};
    // И контроль: без movedWith та же ситуация рвёт дуо.
    CAREER.partners=[{handle:mate.handle, patience:5}];
    out.loyal.ctrlHolds=careerDuoHolds();
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccloyal-'));
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
