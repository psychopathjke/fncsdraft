// Меряет, можно ли соло Victory Cup пускать на карту (zone-sim), не сдвинув
// баланс: одно и то же соло-лобби играет N игр раундовой моделью (как сейчас)
// и N игр на карте (simulateGameOnMap с squadSize=1), и сравниваются
// распределения: место сильного игрока, доля побед, связь силы с местом.
//
//   node tools/career-solo-map-probe.js
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
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {errs: null, fail: null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeSolo', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:78, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-22', division:3, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(78, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();

    CARD_MODE=true; squadSize=1;
    drafted=[careerCard()];
    useLandingSet('m2');
    const you=careerYouTeam(drafted); you.isYou=true;
    const lobbyN=ccVictoryLobby({id:'VictoryCupSolo'}, true);
    // Одно лобби на оба замера: те же люди, та же сила.
    const field=[you, ...careerSoloField(CAREER.career, drafted, careerVictoryField(true), true)];
    const lobby=field.slice(0, Math.min(lobbyN, field.length));
    lobby.forEach((t,i)=>{ if(!t.name) t.name=String(t.handle||('gen'+i)); });
    out.lobby = lobby.length;
    out.youPow = Math.round(you.pow*10)/10;
    out.maxPow = Math.round(Math.max(...lobby.map(t=>t.pow))*10)/10;

    const N=300;
    const run=(onMap)=>{
      const places=[], powPlace=new Map();
      for(let g=0; g<N; g++){
        const order = onMap
          ? simulateGameOnMap(lobby, {lobbySquads:lobby.length, lobbyPlayers:lobby.length})
          : (()=>{ const was=squadSize; squadSize=99; // раундовая ветка: useZoneSim ложен при 99
                   const o=simulateGame(lobby); squadSize=was; return o; })();
        order.forEach((t,i)=>{
          if(t.isYou) places.push(i+1);
          const k=Math.round(t.pow);
          const e=powPlace.get(k)||{n:0,s:0}; e.n++; e.s+=i+1; powPlace.set(k, e);
        });
      }
      const wins=places.filter(p=>p===1).length;
      const top10=places.filter(p=>p<=10).length;
      const avg=places.reduce((a,b)=>a+b,0)/places.length;
      // Связь силы и среднего места по всем участникам: корреляция Пирсона
      // на агрегатах достаточно, вопрос «решает ли сила» — грубый.
      const rows=[...powPlace.entries()].map(([k,e])=>({pow:k, avg:e.s/e.n}));
      const mx=rows.reduce((a,r)=>a+r.pow,0)/rows.length;
      const my=rows.reduce((a,r)=>a+r.avg,0)/rows.length;
      let sxy=0,sxx=0,syy=0;
      rows.forEach(r=>{ const dx=r.pow-mx, dy=r.avg-my; sxy+=dx*dy; sxx+=dx*dx; syy+=dy*dy; });
      const corr=sxx&&syy ? sxy/Math.sqrt(sxx*syy) : 0;
      return {avgPlace:Math.round(avg*100)/100, winPct:Math.round(wins/N*1000)/10,
              top10Pct:Math.round(top10/N*1000)/10, powCorr:Math.round(corr*100)/100};
    };

    squadSize=1;
    out.round = run(false);
    squadSize=1;
    out.map = run(true);
  } catch(e){ out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsolomap-'));
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
