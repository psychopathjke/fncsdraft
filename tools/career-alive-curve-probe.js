// Сколько отрядов доживает до каждой зоны — движок в карьерной комнате против
// трёх реальных финалов (tools/real-matches.json, те же три игры Major 2 EU).
//
// Проба сёрджа показала 82 живых игрока на пятой и седьмой остановке, а в
// реплеях на седьмой около 60. Здесь кривая снимается прямо: первый кадр
// каждой зоны, число живых отрядов, среднее по играм — и рядом та же кривая
// из реплеев (timeAlive команд против времени зоны, как в zone-sim-test).
//
//   node tools/career-alive-curve-probe.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 150);
// Подкрутка движка на время пробы: TUNE='{"PRESSURE_BASE":0.3}' node tools/career-alive-curve-probe.js
const TUNE = process.env.TUNE || '';
// Дивизион комнаты: DIV=3 node tools/career-alive-curve-probe.js
const DIV = +(process.env.DIV || 1);
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const REAL = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-matches.json'), 'utf8'));
const REF = REAL.matches[0];
// REAL=perf_eval|major2_playin|major2_heats|major2_lcq — сравнить с этапом из
// tools/real-stage-curves.json (среднее отрядов на старте зон по реплеям этапа).
const STAGE = process.env.REAL || '';
const STAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-stage-curves.json'), 'utf8'));
// REAL=div1…div5 — реплеи дивизионного капа из real-division-curves.json.
const DIVS = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-division-curves.json'), 'utf8')).sessions;
Object.keys(DIVS).forEach(d => { STAGES['div' + d] = DIVS[d]; });
const realCurve = STAGE
  ? Array.from({length:11}, (_, z) => STAGES[STAGE].reduce((a, r) => a + (r[1][z] || 0), 0) / STAGES[STAGE].length)
  : REF.zones.map((_, z) => REAL.matches.reduce((a, m) =>
      a + m.teams.filter(t => t.timeAlive > m.zones[z].t - m.landingOffset).length / m.teamCount, 0) / REAL.matches.length * 50);
if (STAGE && !STAGES[STAGE]) throw new Error('нет этапа ' + STAGE + ' в real-stage-curves.json');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const GAMES_N=${GAMES};
  const out={curve:[], errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:${DIV}, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], sim:true},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    careerSimSet(true); skipAnimation=true;
    const tune=${JSON.stringify(TUNE)};
    // Без TUNE — единицы дивизиона ставит сама карьера, как перед настоящим капом.
    if(tune && typeof ZoneSim!=='undefined' && ZoneSim.tune) ZoneSim.tune(JSON.parse(tune));
    // STAGE=heats|final|playin|lcq|qual — стадия вечера для ccZoneWeakFor (иначе по календарю дня).
    else if(typeof ccZoneTuneFor==='function') ccZoneTuneFor({type:${JSON.stringify(process.env.KIND||'cup')}, stage:${JSON.stringify(process.env.STAGE||'')}||undefined, day:careerToday()});
    // PROFILE=open — открытая стадия (плей-ин, LCQ), как её ставит applyStageBias.
    if(${JSON.stringify(process.env.PROFILE||'')} && ZoneSim.profile) ZoneSim.profile(${JSON.stringify(process.env.PROFILE||'')});
    const me=careerCard();
    const sum=new Array(12).fill(0); let n=0;
    for(let g=0; g<GAMES_N; g++){
      const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      // OPENFIELD=1 — открытое лобби (Victory Cup, Плей-Ин): смешанное поле careerCupField(open).
      const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, ${JSON.stringify(process.env.OPENFIELD||'')}==='1', g%8)];
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
      await playGameWithChoices(field, null, null);
      const fr=(you._game && you._game.frames) ? you._game.frames() : [];
      const seen={};
      fr.forEach(f=>{ if(f.zone>=1 && f.zone<=11 && seen[f.zone]==null){ seen[f.zone]=f.alive; } });
      for(let z=1; z<=11; z++) sum[z]+= (seen[z]!=null ? seen[z] : 0);
      n++;
    }
    for(let z=1; z<=11; z++) out.curve.push(+(sum[z]/Math.max(1,n)).toFixed(1));
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccalive-'));
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
console.log('зона   движок (отрядов на старте)   реплеи   разница   (' + GAMES + ' игр, дивизион ' + DIV + (TUNE ? ', ' + TUNE : '') + (process.env.KIND ? ', тип ' + process.env.KIND : '') + (process.env.PROFILE ? ', профиль ' + process.env.PROFILE : '') + (process.env.STAGE ? ', стадия ' + process.env.STAGE : '') + (process.env.OPENFIELD ? ', открытое поле' : '') + (STAGE ? ', реплеи ' + STAGE + ' (' + STAGES[STAGE].length + ')' : '') + ')');
let sum=0;
out.curve.forEach((v, i) => { const r=realCurve[i]; const d=v-r; sum+=Math.abs(d);
  console.log(String(i+1).padEnd(6), String(v).padStart(12), String(r.toFixed(1)).padStart(17), String((d>0?'+':'')+d.toFixed(1)).padStart(9)); });
console.log('средний разрыв по зонам: ' + (sum/out.curve.length).toFixed(1) + ' отряда');
