// Кто выигрывает ЛАНы на дистанции. Жалоба игрока, 22 августа: «на лан
// турнирах дуо с америки всё выигрывают». Проба собирает поле Глобалов теми же
// руками, что и мод (summit + major2 + lcq по регионам), играет турнир из 12
// игр N раз и считает долю титулов по регионам и топ победителей.
//
//   node tools/career-lan-region-probe.js
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
      v:1, player:{nick:'ProbeLan', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-11-20', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    CARD_MODE=true; squadSize=2;
    useLandingSet('m2');

    // Комната Антверпена без карьеры: те же три очереди, что careerGlobalsField.
    const seated=new Set();
    const field=[];
    const add=(teams,route)=>teams.forEach(t=>{ t.gcRoute=route; field.push(t); });
    add(ccLanSeats(ccLanRows(GC_SUMMIT_DUOS), ccTeams(SUMMIT_GC_SLOTS), null, seated), 'summit');
    Object.keys(MAJOR2_GC_SLOTS).forEach(reg=>{
      const slots=ccTeams(MAJOR2_GC_SLOTS[reg]||0);
      const real=ccLanSeats(ccLanRows(GC_MAJOR2_DUOS[reg]), slots, reg, seated);
      add(real, 'm2');
      if(real.length<slots)
        add(ccLanSeats(gcRegionFinals('m2', reg), slots-real.length, reg, seated), 'm2');
    });
    Object.keys(GCLC_GC_SLOTS).forEach(reg=>
      add(ccLanSeats(gcRegionFinals('m2', reg), ccTeams(GCLC_GC_SLOTS[reg]||0), reg, seated), 'lcq'));
    field.forEach((t,i)=>{ if(!t.name) t.name=String(t.handle||('t'+i)); });
    out.field=field.length;
    const regOf=t=>t.summitRegion || (t.squad&&t.squad[0]||{}).region || '?';
    const byReg={};
    field.forEach(t=>{ const r=regOf(t); byReg[r]=(byReg[r]||0)+1; });
    out.seats=byReg;
    // Средняя сила комнаты по регионам.
    out.pow={};
    Object.keys(byReg).forEach(r=>{
      const rows=field.filter(t=>regOf(t)===r);
      out.pow[r]=Math.round(rows.reduce((s,t)=>s+t.pow,0)/rows.length*10)/10;
    });

    const N=200;
    const titles={}, tops={};
    for(let k=0;k<N;k++){
      field.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      for(let g=0; g<CC_GLOB_GAMES; g++){
        const order=simulateGame(field);
        order.forEach((t,i)=>{ t.stagePts+=pointsForPlace(i+1); if(i===0)t.wins++; });
      }
      const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0));
      const w=ranked[0];
      const r=regOf(w);
      titles[r]=(titles[r]||0)+1;
      const nm=String(w.name||'').replace(/<[^>]*>/g,'');
      tops[nm]=(tops[nm]||0)+1;
    }
    out.titles=titles;
    out.topWinners=Object.entries(tops).sort((a,b)=>b[1]-a[1]).slice(0,8)
      .map(e=>e[0]+' ×'+e[1]);
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclanreg-'));
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
