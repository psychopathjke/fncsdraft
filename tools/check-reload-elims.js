// Элимы в Reload: пока идут возрождения, смерть отряда — один упавший, а не вайп.
//
// Его игрок 13.09 (страница «bags 13.09»): «i think theres a bug where u get way
// more kills than u shd — like i js got 198 kills in reload finals and didnt place
// in top 10 once». Замерено до починки: 100 элимов на лобби за игру, у одного
// отряда до 36 за игру. Настоящие финалы и хиты Reload Elite Series 1–4 EU
// (tools/ewc-rows.generated.js, 20 дуо × 8 игр): 51–68 на лобби, лучший отряд
// 3.6–5.3 в среднем. Причина: движок считал за смерть весь отряд (2 элима) и во
// время возрождений, когда падает один. См. elimsFor в zone-sim.
//
// Проверяется на острове r1 (финал Reload, 20 дуо, профиль finals):
//   * элимов на лобби за игру — не больше 85 (было 100, реплеи 51–68);
//   * ни у одного отряда за игру не больше 30;
//   * обычная игра без возрождений не тронута: элимов столько, сколько людей
//     в убитых в дуэлях отрядах (шторм элимов не даёт; коллапс последних
//     отрядов в finish элимов не пишет — до трёх отрядов, отсюда допуск 6).
//
//   node tools/check-reload-elims.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 16);
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
    const rows=[]; let n=0; out.rows=rows;
    for(let g=0; g<GAMES_N; g++){
      const you=SOLO ? careerTeam([me], true) : careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=SOLO
        ? [you, ...careerSoloField(CAREER.career, [me], 40, true).slice(0, 39)]
        : [you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, g%8).slice(0, 19)];
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
      await playGameWithChoices(field, null, null);
      
      field.forEach(t=>{ rows.push({g:g, you:!!t.isYou, e:t._elims||0}); });
      n++;
    }
    out.n=n;
    
    // Обычная игра — без возрождений: остров сезона, всё как в финале дивизиона.
    useLandingSet(CARD_SET||'s41');
    if(typeof ccZoneTuneFor==='function') ccZoneTuneFor({type:'cup', day:careerToday()});
    { const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 3).slice(0, 19)];
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[0];
      await playGameWithChoices(field, null, null);
      const names=new Set(field.map(t=>t.name));
      out.plain={teams:field.length, elims:field.reduce((s,t)=>s+(t._elims||0),0), duels:field.filter(t=>t._deathCause && names.has(t._deathCause)).length,
                 want:field.filter(t=>t._deathCause && names.has(t._deathCause)).reduce((s,t)=>s+((t.squad&&t.squad.length)||1),0)}; }
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

const rows=out.rows;
const perGame=[]; for(let g=0; g<out.n; g++){ const a=rows.filter(r=>r.g===g).map(r=>r.e); perGame.push({tot:a.reduce((s,x)=>s+x,0), top:Math.max(...a)}); }
const avgTot=perGame.reduce((s,x)=>s+x.tot,0)/perGame.length, top=Math.max(...perGame.map(x=>x.top));
const you=rows.filter(r=>r.you), youAvg=you.reduce((s,r)=>s+r.e,0)/you.length;
console.log('  Reload r1, '+out.n+' игр по 20 дуо: элимов на лобби за игру '+avgTot.toFixed(1)+' (реплеи 51–68), лучший отряд за игру до '+top+', свои в среднем '+youAvg.toFixed(1));
console.log('  обычная игра: '+out.plain.teams+' отрядов, убито в дуэлях '+out.plain.duels+', элимов '+out.plain.elims+' при '+out.plain.want+' людях в убитых отрядах (коллапс в конце игры элимов не пишет — см. finish в zone-sim)');
let bad=null;
if(avgTot>85) bad='элимов на лобби '+avgTot.toFixed(1)+' — снова вайп за каждую смерть при возрождениях';
else if(top>30) bad='у одного отряда за игру '+top+' элимов';
else if(out.plain.elims>out.plain.want || out.plain.elims<out.plain.want-6) bad='обычная игра: элимов '+out.plain.elims+' при '+out.plain.want+' людях в убитых отрядах';
if(bad){ console.error('FAILED: '+bad); process.exit(1); }
console.log('элимы Reload на месте: один упавший — один элим, пока идут возрождения');
