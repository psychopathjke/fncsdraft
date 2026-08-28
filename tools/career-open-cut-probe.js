// Кто проходит отсечку опенов — его скрин, 23 августа: «опять рандомные бомжи
// проходят, а настоящие команды не могут» (Раунд 1, 2440 в лобби, топ-430
// дальше, вокруг отсечки — придуманные пары). Проба играет N вечеров опенов
// и считает состав топ-430: сколько настоящих, сколько придуманных, и кто
// стоит в полосе #400–430.
//
//   node tools/career-open-cut-probe.js
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
      v:1, player:{nick:'CutProbe', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-08', division:3, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry(); CARD_MODE=true; squadSize=2;
    useLandingSet('r4');
    const field=careerCupField(CAREER.career, [], careerVictoryField(false), 'cutprobe', true, 0);
    const isReal=t=>(t.squad||[]).every(c=>c && c.handle && c.tier!=='ladder');
    out.field=field.length; out.real=field.filter(isReal).length;
    const CUT=430, N=20, games=6;
    let realInCut=0, genInCut=0, genInBand=0, realOut=0;
    const wasSquad=squadSize; squadSize=99;
    for(let k=0;k<N;k++){
      field.forEach(t=>{ t.stagePts=0; t.wins=0; t._elims=0; });
      for(let g=0; g<games; g++){
        const order=simulateGame(field);
        order.forEach((t,i)=>{ t.stagePts+=victoryR1Points(i+1)+ccKillPts(t._elims||0, CC_VICTORY_R1_KILL); });
      }
      const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts);
      const cutset=ranked.slice(0, CUT);
      realInCut+=cutset.filter(isReal).length;
      genInCut+=cutset.filter(t=>!isReal(t)).length;
      genInBand+=ranked.slice(399, 430).filter(t=>!isReal(t)).length;
      realOut+=ranked.slice(CUT).filter(isReal).length;
    }
    squadSize=wasSquad;
    out.evenings=N;
    out.avgRealInCut=Math.round(realInCut/N);
    out.avgGenInCut=Math.round(genInCut/N);
    out.avgGenInBand400_430=Math.round(genInBand/N*10)/10;
    out.avgRealMissedCut=Math.round(realOut/N);
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccut-'));
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
