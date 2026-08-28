// Кто стоит в топе открытого вечера. Его скрин, 22 августа ночью: Victory R1
// на 2440 дуо в НАК — сгенерированные пары на #1, #2 и #6 выше Cooper & Reet
// и Cold & Rapid. Якорь реальности в самом коде (runCareerReload): топ-10
// реальных опенов Epic — Focus, Th0masHD, Sky, Scroll, vic0, Malibuca, Cr1nge,
// «the same names that play the Majors». Проба играет N открытых вечеров и
// считает, сколько выдуманных в топ-10 и топ-30, и кто берёт первое место.
//
//   node tools/career-open-top-probe.js
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
      v:1, player:{nick:'ProbeOpen', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-05', division:3, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry(); CARD_MODE=true; squadSize=2;
    useLandingSet('m2');
    const field=careerCupField(CAREER.career, [], careerVictoryField(false), 'opentop', true, 0);
    field.forEach((t,i)=>{ if(!t.name) t.name=String(t.handle||('t'+i)); });
    const isReal=t=>(t.squad||[]).every(c=>c && c.handle && c.tier!=='ladder');
    out.field=field.length;
    out.realTeams=field.filter(isReal).length;
    // Полосы силы: реальные и выдуманные.
    const pows=kind=>{
      const arr=field.filter(t=>isReal(t)===kind).map(t=>t.pow).sort((a,b)=>b-a);
      return {max:Math.round(arr[0]*10)/10, p10:Math.round(arr[Math.floor(arr.length*0.1)]*10)/10,
              med:Math.round(arr[Math.floor(arr.length/2)]*10)/10};
    };
    out.realPow=pows(true); out.genPow=pows(false);

    const N=60;
    let genTop1=0, genTop10=0, genTop30=0;
    const wasSquad=squadSize; squadSize=99; // раундовая модель, как в самом опене без карты своего лобби
    for(let k=0;k<N;k++){
      field.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      for(let g=0; g<CC_VICTORY_R1_GAMES; g++){
        const order=simulateGame(field);
        order.forEach((t,i)=>{ t.stagePts+=victoryR1Points(i+1)+ccKillPts(t._elims||0, CC_VICTORY_R1_KILL); });
      }
      const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts);
      if(!isReal(ranked[0])) genTop1++;
      genTop10+=ranked.slice(0,10).filter(t=>!isReal(t)).length;
      genTop30+=ranked.slice(0,30).filter(t=>!isReal(t)).length;
    }
    squadSize=wasSquad;
    out.evenings=N;
    out.genWinsPct=Math.round(genTop1/N*100);
    out.genInTop10=Math.round(genTop10/N*10)/10;
    out.genInTop30=Math.round(genTop30/N*10)/10;
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccopentop-'));
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
