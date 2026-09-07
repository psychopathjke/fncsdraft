// Сколько игроков доживает до каждой зоны в СОЛО — движок против реплея
// финала Solo Series EU (Tracker, сессия 1ed7bc5b, 24 января 2026, 97 игроков).
//
// Его скрин 6 сентября: финал Solo Series, четвёртая зона, 97 живых из 100
// и «6660 над порогом урона». В реплее на старте четвёртой зоны 84, седьмой
// 54; медиана чистого урона на седьмой — 100, максимум около 800.
//
//   node tools/career-solo-alive-probe.js [игр]
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

// Живые игроки на старте каждой зоны, реплей 1ed7bc5b (97 игроков).
// REAL=solo_victory_cup_r1|solo_victory_cup_r2|solo_series_qual|… — сравнить со
// средней кривой этапа из tools/real-stage-curves.json (игроков из ста) вместо
// одного реплея финала.
let REAL = [96, 85, 85, 84, 78, 70, 54, 44, 35, 25, 14];
let REAL_N = 97;
const REAL_STAGE = process.env.REAL || '';
if (REAL_STAGE) {
  const STAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-stage-curves.json'), 'utf8'));
  if (!STAGES[REAL_STAGE]) throw new Error('нет этапа ' + REAL_STAGE + ' в real-stage-curves.json');
  const rows = STAGES[REAL_STAGE];
  REAL = Array.from({length: 11}, (_, z) => rows.reduce((a, r) => a + (r[1][z] || 0), 0) / rows.length);
  REAL_N = 100;
}

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const GAMES_N=${GAMES};
  const out={curve:[], netMed:[], netMax:[], errs:[], n:0};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-24', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], sim:true},
      partner:null}));
    careerEntry();
    careerSimSet(true); skipAnimation=true;
    const me=careerCard();
    CARD_MODE=true; squadSize=1;
    useLandingSet('s42');
    // OPEN=1 — открытое соло-лобби (Solo Victory Cup): смешанная сотня и профиль «open».
    const OPEN=${JSON.stringify(process.env.OPEN||'')}==='1';
    if(OPEN && ZoneSim.profile) ZoneSim.profile('open');
    // PROFILE=open|finals — профиль движка отдельно от поля (Solo Series играется
    // под victoryR1Points, то есть applyStageBias ставит ей «open»).
    const PROF=${JSON.stringify(process.env.PROFILE||'')};
    if(PROF && ZoneSim.profile) ZoneSim.profile(PROF);
    // STAGE=qual — квал Solo Series (открытое поле, свои единицы); OPEN без STAGE — Solo Victory Cup.
    const STAGE=${JSON.stringify(process.env.STAGE||'')};
    // ROUND=2 — второй раунд Solo Victory Cup (сотня прошедших): единицы CC_ZONE_OPEN_SOLO_R2.
    const ROUND=${JSON.stringify(process.env.ROUND||'')}==='2' ? 2 : undefined;
    if(typeof ccZoneTuneFor==='function') ccZoneTuneFor(STAGE ? {type:'solo', stage:STAGE, day:careerToday()} : OPEN ? {type:'victory', mode:'solo', round:ROUND, day:careerToday()} : {type:'solo', day:careerToday()});
    if(!PROF && CC_ZONE_PROFILE && ZoneSim.profile) ZoneSim.profile(CC_ZONE_PROFILE);   // как сделает applyStageBias в игре
    out.profile=ZoneSim.profile ? ZoneSim.profile() : '?';
    // TUNE — после настройки карьеры, иначе ccZoneTuneFor перетирает единицы слабости.
    const tune=${JSON.stringify(TUNE)};
    if(tune && typeof ZoneSim!=='undefined' && ZoneSim.tune) ZoneSim.tune(JSON.parse(tune));
    const sum=new Array(12).fill(0), med=new Array(12).fill(0), mx=new Array(12).fill(0); let n=0;
    for(let g=0; g<GAMES_N; g++){
      const you=careerTeam([me], true); you.isYou=true; you.name='you';
      // Финал — сильнейшая сотня (stage 'final'); квал/Victory Cup — открытое поле.
      // FIELD=weak — старое поле финала: случайная сотня из снимка дивизиона (для сравнения).
      const bots=careerSoloField(CAREER.career, [me], 100, OPEN, OPEN ? (STAGE||'qual') : (${JSON.stringify(process.env.FIELD||'')}==='weak' ? '' : 'final'));
      const field=[you, ...bots.slice(0, 99)];
      if(g===0){ const pw=field.map(t=>Number(t.pow)||0); out.meanPow=+(pw.reduce((a,b)=>a+b,0)/pw.length).toFixed(1); out.minPow=Math.min(...pw); out.maxPow=Math.max(...pw); }
      buildBotLandingAssignment(field.filter(t=>!t.isYou));
      you.landingZone=ALL_LANDING_ZONES[g%ALL_LANDING_ZONES.length];
      await playGameWithChoices(field, null, null);
      const fr=(you._game && you._game.frames) ? you._game.frames() : [];
      const seen={};
      fr.forEach(f=>{ if(f.zone>=1 && f.zone<=11 && seen[f.zone]==null){
        const nets=(f.dots||[]).filter(d=>d && d.alive).map(d=>Number(d.n)||0).sort((a,b)=>a-b);
        seen[f.zone]={alive:f.players!=null ? f.players : f.alive, med:nets.length?nets[Math.floor(nets.length/2)]:0, max:nets.length?nets[nets.length-1]:0}; } });
      for(let z=1; z<=11; z++){ if(seen[z]){ sum[z]+=seen[z].alive; med[z]+=seen[z].med; mx[z]+=seen[z].max; } }
      n++;
    }
    out.n=n;
    for(let z=1; z<=11; z++){ out.curve.push(+(sum[z]/Math.max(1,n)).toFixed(1)); out.netMed.push(Math.round(med[z]/Math.max(1,n))); out.netMax.push(Math.round(mx[z]/Math.max(1,n))); }
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsolo-'));
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
console.log('сила лобби (team.pow): средняя ' + out.meanPow + ', от ' + out.minPow + ' до ' + out.maxPow + '; профиль движка: ' + out.profile);
console.log('соло, зона   движок живых   реплей ('+(REAL_STAGE ? REAL_STAGE : 'из 97, к 100')+')   разница   чистый урон: медиана / макс   (' + out.n + ' игр' + (TUNE ? ', ' + TUNE : '') + ')');
let s=0;
out.curve.forEach((v, i) => { const r=REAL[i]/REAL_N*100; const d=v-r; s+=Math.abs(d);
  console.log(String(i+1).padEnd(11), String(v).padStart(12), String(r.toFixed(1)).padStart(22), String((d>0?'+':'')+d.toFixed(1)).padStart(9), ('   '+out.netMed[i]+' / '+out.netMax[i]).padStart(28)); });
console.log('средний разрыв: ' + (s/out.curve.length).toFixed(1) + ' игрока; реплей на седьмой: медиана 100, макс 797');
