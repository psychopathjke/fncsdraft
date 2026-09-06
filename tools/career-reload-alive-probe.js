// Сколько отрядов доживает до каждого круга в RELOAD — движок против 12
// реплеев Reload Elite Series 4 EU (финал и первый хит, 20–21 дуо в лобби).
//
// Реплей (среднее, из 20–21): 20.8 20.0 19.9 19.9 19.8 19.7 19.3 18.8 18.3
// 16.8 14.1 10.8 — до девятого круга почти никто не гибнет, всё решается в
// трёх последних. Движок здесь играет остров r1 своим штормом (RELOAD_PHASES)
// комнатой из 20 дуо первого дивизиона.
//
//   node tools/career-reload-alive-probe.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 100);
const TUNE = process.env.TUNE || '';
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// SOLO=1 — Reload Solo Victory Cup: 40 одиночек на r4, реплей S41 EU (10 игр
// второго раунда, Tracker, 6.09.2026), живых на старте кругов:
const SOLO = process.env.SOLO === '1';
const REAL = SOLO
  ? [40.0, 39.8, 38.4, 37.0, 36.3, 34.5, 31.9, 27.2, 22.3, 18.7, 14.0]
  : [20.8, 20.0, 19.9, 19.9, 19.8, 19.7, 19.3, 18.8, 18.3, 16.8, 14.1];

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const GAMES_N=${GAMES};
  const out={curve:[], errs:[], n:0};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], sim:true},
      partner:null}));
    careerEntry();
    const SOLO=${JSON.stringify(SOLO)};
    squadSize=SOLO?1:2; CARD_MODE=true; useLandingSet(SOLO?'r4':'r1');
    careerSimSet(true); skipAnimation=true;
    // PROFILE=open|finals — профиль движка (раннер Reload играет под reloadCareerPoints, Victory Cup — под victoryR1Points).
    const PROF=${JSON.stringify(process.env.PROFILE||'')};
    if(PROF && ZoneSim.profile) ZoneSim.profile(PROF);
    if(typeof ccZoneTuneFor==='function') ccZoneTuneFor(SOLO ? {type:'victory', mode:'solo', reload:true, day:careerToday()} : {type:'reload', day:careerToday()});
    const tune=${JSON.stringify(TUNE)};
    if(tune && typeof ZoneSim!=='undefined' && ZoneSim.tune) ZoneSim.tune(JSON.parse(tune));
    out.profile=ZoneSim.profile ? ZoneSim.profile() : '?';
    const me=careerCard();
    const sum=new Array(13).fill(0); let n=0;
    for(let g=0; g<GAMES_N; g++){
      const you=SOLO ? careerTeam([me], true) : careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=SOLO
        ? [you, ...careerSoloField(CAREER.career, [me], 40, true).slice(0, 39)]
        : [you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, g%8).slice(0, 19)];
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
      await playGameWithChoices(field, null, null);
      const fr=(you._game && you._game.frames) ? you._game.frames() : [];
      const seen={};
      fr.forEach(f=>{ if(f.zone>=1 && f.zone<=12 && seen[f.zone]==null){ seen[f.zone]=f.alive; } });
      for(let z=1; z<=12; z++) sum[z]+= (seen[z]!=null ? seen[z] : 0);
      n++;
    }
    out.n=n;
    for(let z=1; z<=11; z++) out.curve.push(+(sum[z]/Math.max(1,n)).toFixed(1));
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccreload-'));
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
console.log('Reload, круг   движок (из ' + (SOLO ? '40 соло' : '20 дуо') + ')   реплей   разница   (' + out.n + ' игр, профиль ' + out.profile + (TUNE ? ', ' + TUNE : '') + ')');
let s=0;
out.curve.forEach((v, i) => { const r=REAL[i]; const d=v-r; s+=Math.abs(d);
  console.log(String(i+1).padEnd(13), String(v).padStart(11), String(r.toFixed(1)).padStart(9), String((d>0?'+':'')+d.toFixed(1)).padStart(9)); });
console.log('средний разрыв: ' + (s/out.curve.length).toFixed(1) + ' отряда');
