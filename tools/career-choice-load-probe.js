// Сколько раз за вечер игру останавливают вопросом.
//
// Механика спрашивает дважды за игру — но только пока ты жив: до 3-й зоны
// доживают почти все, до 8-й далеко не все. Вечер это 6-12 игр, поэтому важно
// знать не «два вопроса», а сколько их выходит за турнир на самом деле.
//
//   node tools/career-choice-load-probe.js [вечеров]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NIGHTS = +(process.argv[2] || 40);
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
  const NIGHTS=${NIGHTS};
  const out={games:0, loot:0, late:0, alive3:0, alive8:0, errs:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
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
    const GAMES=CAREER_CUP_GAMES;   // вечер дивизионного кубка

    for(let n=0;n<NIGHTS;n++){
      for(let g=0; g<GAMES; g++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 0)];
        buildBotLandingAssignment(field.filter(t=>!t.isYou));
        you.landingZone=ALL_LANDING_ZONES[0];
        field.forEach(t=>{ t._elims=0; t._feed=[];
          t._pf=Math.max(1, t.pow*gameForm()); t._pc=Math.max(1, t._pf+(t.closeEdge||0)); });
        const game=ZoneSim.simulateZoneGame(field, {
          rng:Math.random, land:ZONE_SETS[set], aspect:aspect, record:false, stepwise:true,
          startOf:t=>{ const z=t.landingZone; return z?{x:z.x+z.w/2,y:z.y+z.h/2}:{x:50,y:50}; },
          duel:(a,b,dropping)=>dropping?resolveDropDuel(a,b):resolveDuel(a,b,exponent)});
        out.games++;
        const mine=()=>game.squads.find(s=>s.team===you);
        game.playTo(3);
        if(mine().alive && game.aliveCount()>1){ out.loot++; out.alive3++; ccAddGamePow(you, 4); }
        game.playTo(8);
        if(mine().alive && game.aliveCount()>1){ out.late++; out.alive8++; }
        game.finish();
      }
    }
    out.perNight=+((out.loot+out.late)/NIGHTS).toFixed(1);
    out.lootShare=+(out.loot/out.games*100).toFixed(0);
    out.lateShare=+(out.late/out.games*100).toFixed(0);
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccload-'));
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
console.log('игр сыграно: ' + out.games);
console.log('вопрос про лут:      ' + out.loot + ' раз (' + out.lootShare + '% игр)');
console.log('вопрос про высоту:   ' + out.late + ' раз (' + out.lateShare + '% игр)');
console.log('вопросов за вечер:   ' + out.perNight);
