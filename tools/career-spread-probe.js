// Агрессия своей команды, и что она делает с очками. ЗАМЕР, ПО КОТОРОМУ
// «план на вечер» и «нервы первого ЛАНа» НЕ ВЫПУЩЕНЫ (3 сентября 2026).
//
// Множит у СВОЕЙ команды seek — как охотно она идёт в драку (zone-sim,
// aggression × _seekMul, хук оставлен ради этой пробы). Хотелось выбора,
// который меняет разброс, а не среднее. Очки вечера — по таблице
// дивизионного кубка: pointsForPlace + ccKillPts(elims, 4). Результат:
//
//   рейтинг 86: ×0.5 25.2 · ×0.7 26.7 · ×1 24.8 · ×1.4 23.2 · ×2 19.7 очков
//   рейтинг 78: ×0.5 18.2 · ×0.7 18.0 · ×1 17.5 · ×1.4 15.7 · ×2 14.5
//   σ очков не растёт (27.6 при ×1, 26.6 при ×2)
//
// Агрессия — штраф, а не разброс; ниже единицы — либо ничего, либо подарок в
// пределах шума (600 игр, SE ≈ 1.1 очка). Первая версия пробы мерила ширину
// броска формы (gameForm ×0.3…×2.0) — та вообще ничего не сдвинула.
//
//   node tools/career-spread-probe.js [игр] [рейтинг] [множители через запятую]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 600);
const OVR = +(process.argv[3] || 86);
const MULS = (process.argv[4] || '').split(',').map(Number).filter(x => x > 0);
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
(function(){
  const GAMES_N=${GAMES};
  const out={rows:[], errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:${OVR}, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    const me=careerCard();
    const set=ZONE_SETS[ACTIVE_LANDING_SET]?ACTIVE_LANDING_SET:'m2';
    const ratio=MAP_ASPECT[set].split('/'), aspect=Number(ratio[1])/Number(ratio[0]);
    const exponent=DUEL_POW_EXPONENT_BY_MODE[squadSize]||5;
    const run=(mul)=>{
      let places=0, wins=0, top10=0, bottom=0, pts=0, sq=0, elims=0;
      for(let g=0; g<GAMES_N; g++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 0)];
        buildBotLandingAssignment(field.filter(t=>!t.isYou));
        you.landingZone=ALL_LANDING_ZONES[0];
        field.forEach(t=>{ t._elims=0; t._feed=[];
          t._pf=Math.max(1, t.pow*gameForm()); t._pfBase=t._pf;
          t._pc=Math.max(1, t._pf+(t.closeEdge||0));
          t._seekMul = t.isYou ? mul : 1; });
        const game=ZoneSim.simulateZoneGame(field, {
          rng:Math.random, land:ZONE_SETS[set], aspect:aspect, record:false, stepwise:true,
          startOf:t=>{ const z=t.landingZone; return z?{x:z.x+z.w/2,y:z.y+z.h/2}:{x:50,y:50}; },
          duel:(a,b,dropping)=>dropping?resolveDropDuel(a,b):resolveDuel(a,b,exponent)});
        const at=game.finish().order.indexOf(you)+1;
        const e=you._elims||0;
        const p=pointsForPlace(at)+ccKillPts(e, 4);
        places+=at; elims+=e; pts+=p; sq+=p*p;
        if(at===1) wins++; if(at<=10) top10++; if(at>40) bottom++;
      }
      const mean=pts/GAMES_N;
      return {place:+(places/GAMES_N).toFixed(2), elims:+(elims/GAMES_N).toFixed(2),
              pts:+mean.toFixed(2), sd:+Math.sqrt(Math.max(0, sq/GAMES_N-mean*mean)).toFixed(2),
              wins:+(wins/GAMES_N*100).toFixed(1), top10:+(top10/GAMES_N*100).toFixed(1),
              bottom:+(bottom/GAMES_N*100).toFixed(1)};
    };
    const extra=${JSON.stringify(MULS)};
    if(extra.length){
      extra.forEach(m=>out.rows.push({what:'агрессия ×'+m, mul:m, ...run(m)}));
    } else {
      [0.5, 0.7, 1, 1.4, 2].forEach(m=>out.rows.push({what:'агрессия ×'+m, mul:m, ...run(m)}));
    }
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccspread-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) console.error(out.errs.join('\n'));
console.log('рейтинг ' + OVR + ', игр на режим ' + GAMES + ', очки = место + элимы×4 (кап 10)');
console.log('режим               ср. очки   σ очков  ср. место  ср. элимы  побед %  топ-10 %  ниже 40 %');
out.rows.forEach(r => console.log(
  r.what.padEnd(19), String(r.pts).padStart(8), String(r.sd).padStart(9), String(r.place).padStart(10),
  String(r.elims).padStart(10), String(r.wins).padStart(8), String(r.top10).padStart(9), String(r.bottom).padStart(10)));
