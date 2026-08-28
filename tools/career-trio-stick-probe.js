// Держатся ли трио между турнирами. Жалоба игрока, 22 августа, третьим заходом:
// «каждый новый кап команды новые, нету ни одного триоса, которые все турниры
// вместе играют». Проба строит поле кубка Дивизиона 1 трио-сезона на шесть
// разных недель и меряет: у пар, живущих из недели в неделю, сколько разных
// третьих; и какая доля полных троек первой недели доживает до остальных.
//
//   node tools/career-trio-stick-probe.js
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
      v:1, player:{nick:'ProbeTrio', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, day:'2026-02-05', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    CARD_MODE=true; squadSize=3;
    const cr=CAREER.career;
    out.squad=careerSquadSize();

    const W=6;
    const weeks=[];
    for(let w=0; w<W; w++){
      const field=careerCupField(cr, [], careerCupSize(1), 'stickprobe'+w, false, 0);
      // Только настоящие люди: у выдуманных имя на вечер.
      const teams=field.map(t=>(t.squad||[]).filter(c=>c && c.handle && c.tier!=='ladder')
                                            .map(c=>hKey(c)).sort())
                       .filter(s=>s.length===3);
      weeks.push(teams);
    }
    out.realTrios=weeks.map(w=>w.length);

    // Пары, живущие из недели в неделю, и их третьи.
    const pairThirds=new Map();
    weeks.forEach((teams, w)=>{
      teams.forEach(s=>{
        [[0,1],[0,2],[1,2]].forEach(([a,b])=>{
          const pk=s[a]+'+'+s[b];
          const third=s[3-a-b];
          const e=pairThirds.get(pk)||{weeks:0, thirds:new Set()};
          e.weeks++; e.thirds.add(third);
          pairThirds.set(pk, e);
        });
      });
    });
    const persistent=[...pairThirds.values()].filter(e=>e.weeks>=4);
    out.persistentPairs=persistent.length;
    const dist={};
    persistent.forEach(e=>{ const k=e.thirds.size; dist[k]=(dist[k]||0)+1; });
    out.thirdsPerPair=dist; // {1: пар с одним третьим, 2: с двумя, ...}

    // Полные тройки первой недели: в скольких из остальных недель они целы.
    const first=new Set(weeks[0].map(s=>s.join('+')));
    const survive=weeks.slice(1).map(teams=>{
      const now=new Set(teams.map(s=>s.join('+')));
      let n=0; first.forEach(k=>{ if(now.has(k)) n++; });
      return Math.round(n/Math.max(1,first.size)*100);
    });
    out.week1TrioSurvivalPct=survive;
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctrio-'));
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
