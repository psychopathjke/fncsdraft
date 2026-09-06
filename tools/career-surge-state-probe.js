// Как часто сёрдж включён на остановках середины — в движке, чтобы сверить с
// реплеями.
//
// Замер по трём играм финала Major 2 EU (2 августа 2026, см. CC_SURGE_FARM):
// в двух лобби стояло выше порога с 4-й по 10-ю зону (76 живых при 60 на
// пятой, 58 при 40 на седьмой), в одной — ниже (58 при 60, 46 при 40). Ход
// «набить сёрдж» теперь предлагается только при включённом сёрдже, и эта проба
// печатает, как часто это случается у движка на пятой и седьмой зоне, и как
// часто под сёрджем оказывается сам игрок.
//
//   node tools/career-surge-state-probe.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 200);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const GAMES_N=${GAMES};
  const out={rows:[], errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], sim:true},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    careerSimSet(true); skipAnimation=true;
    const me=careerCard();
    const at={5:{n:0,on:0,under:0,players:0,gap:[]}, 7:{n:0,on:0,under:0,players:0,gap:[]}};
    // Смотрим состояние на каждой остановке через ui.show — он получает кадры
    // ровно в момент вопроса, до хода комнаты.
    let zoneSeen=0;
    const ui={show:function(frames){ const f=frames[frames.length-1]; if(!f) return false;
      const z=(typeof CC_KIT_ZONE!=="undefined" && CC_KIT_ZONE)||f.zone; if((z===5||z===7) && zoneSeen!==z){ zoneSeen=z; const you=window.__you; const sg=ccSurgeState(you);
        const a=at[z]; a.n++; if(sg){ a.players+=sg.players; if(sg.on){ a.on++; if(sg.gap!=null){ a.gap.push(sg.gap); if(sg.gap<0) a.under++; } } } }
      return false; }};
    for(let g=0; g<GAMES_N; g++){
      zoneSeen=0;
      const you=careerYouTeam([me]); you.isYou=true; you.name='you'; window.__you=you;
      const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, g%8)];
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
      await playGameWithChoices(field, null, ui);
    }
    [5,7].forEach(z=>{ const a=at[z]; const med=a.gap.length ? a.gap.slice().sort((x,y)=>x-y)[Math.floor(a.gap.length/2)] : null;
      out.rows.push({zone:z, games:a.n, on:+(a.on/Math.max(1,a.n)*100).toFixed(1), under:+(a.under/Math.max(1,a.n)*100).toFixed(1),
        players:+(a.players/Math.max(1,a.n)).toFixed(1), gapMedian:med}); });
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsurge-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=1800000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) console.error(out.errs.join('\n'));
console.log('зона  игр   сёрдж включён %   игрок под сёрджем %   живых в среднем   медиана до линии');
out.rows.forEach(r => console.log(String(r.zone).padEnd(5), String(r.games).padStart(4), String(r.on).padStart(16),
  String(r.under).padStart(20), String(r.players).padStart(16), String(r.gapMedian==null?'—':r.gapMedian).padStart(17)));
console.log('реплеи: 2 игры из 3 — сёрдж включён на пятой и седьмой; 1 из 3 — выключен на обеих');
