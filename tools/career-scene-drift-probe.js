// Меряет дрейф рейтингов реальных про за пол-сезона сцены: комната Дивизиона 1
// играет N вечеров подряд, careerGrowField двигает книгу роста, и проба
// смотрит, куда уехали верхние и нижние по рейтингу. Жалоба игрока, 22 августа:
// «перед началом сезона 96, а в середине сезона уже 91».
//
//   node tools/career-scene-drift-probe.js
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
      v:1, player:{nick:'ProbeDrift', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-05', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(90, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();

    CARD_MODE=true; squadSize=2;
    useLandingSet('m2');
    // Комната Дивизиона 1: реальные дуо, как их строит сам мод.
    const field=careerCupField(CAREER.career, [], careerCupSize(1), 'driftprobe', false, 0);
    field.forEach((t,i)=>{ if(!t.name) t.name=String(t.handle||('t'+i)); });
    out.field=field.length;

    // Стартовые рейтинги реальных людей комнаты.
    const start=new Map();
    field.forEach(t=>(t.squad||[]).forEach(c=>{
      if(!c || c.tier==='ladder' || !c.handle) return;
      const o=(c._ovr!=null?c._ovr:(attrsFor(c)||{}).ovr);
      if(o>0) start.set(hKey(c), o);
    }));
    const names=[...start.entries()].sort((a,b)=>b[1]-a[1]);
    const top10=names.slice(0,10).map(e=>e[0]);
    const low10=names.slice(-10).map(e=>e[0]);
    out.people=names.length;
    out.topStart=Math.round(top10.reduce((s,k)=>s+start.get(k),0)/top10.length*10)/10;
    out.lowStart=Math.round(low10.reduce((s,k)=>s+start.get(k),0)/low10.length*10)/10;

    // Вечер: 12 игр одним лобби, очки за место, потом рост комнаты.
    const NIGHTS=40;
    const wasSquad=squadSize; squadSize=99; // раундовая модель, быстро
    for(let nn=0; nn<NIGHTS; nn++){
      field.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      for(let g=0; g<12; g++){
        const order=simulateGame(field);
        order.forEach((t,i)=>{ t.stagePts+=pointsForPlace(i+1); if(i===0)t.wins++; });
      }
      careerGrowField(field, null);
    }
    squadSize=wasSquad;

    const dev=CAREER.dev||{};
    const shift=k=>dev[k]||0;
    out.nights=NIGHTS;
    out.topShift=Math.round(top10.reduce((s,k)=>s+shift(k),0)/top10.length*100)/100;
    out.lowShift=Math.round(low10.reduce((s,k)=>s+shift(k),0)/low10.length*100)/100;
    out.allShift=Math.round(names.reduce((s,e)=>s+shift(e[0]),0)/names.length*100)/100;
    out.worst=names.slice(0,20).map(e=>({h:e[0], was:e[1], d:Math.round(shift(e[0])*10)/10}))
                   .sort((a,b)=>a.d-b.d).slice(0,5);
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdrift-'));
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
