// Не перекосили ли выборы вечер.
//
// Лут и высокая земля дают силу ТОЛЬКО игроку — соперники играют как играли.
// Значит вопрос не в том, работает ли механика (работает), а в том, сколько
// бесплатного преимущества она раздаёт. Проба гоняет одинаковые комнаты в трёх
// режимах и сравнивает место, победы и топ-10:
//
//   без выборов          — как было до механики
//   выборы у игрока      — лут с 3-й зоны и хайграунд с 8-й, как сейчас
//   выборы у всех        — то же, но комната тоже собирает лут и дерётся за
//                          высоту (боты получают средний исход)
//
//   node tools/career-choice-balance-probe.js [игр]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 400);
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
    /* Игрок здесь играет самую жадную линию из возможных: бежит на соседнюю
       точку и лезет на высоту. Так и надо мерить перекос — если даже жадная
       линия не выносит его над комнатой, то осторожная тем более. Обе теперь
       с монеткой и со штрафом за провал, как в игре. */

    const run=(mode)=>{
      let places=0, wins=0, top10=0;
      for(let g=0; g<GAMES_N; g++){
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
        // Лут — с третьей зоны, как в игре.
        game.playTo(3);
        if(mode!=='none') ccAddGamePow(you,
          Math.random()<CC_LOOT_POI_ODDS ? CC_LOOT_POI_BONUS : -CC_LOOT_POI_FAIL);
        if(mode==='all') ccRoomLoot(field, you);
        // Высокая земля — с восьмой.
        game.playTo(8);
        if(mode!=='none') ccAddGamePow(you,
          Math.random()<CC_HG_ODDS ? CC_HG_POW : -CC_HG_FAIL);
        if(mode==='all') ccRoomLate(field, you);
        const order=game.finish().order;
        const at=order.indexOf(you)+1;
        places+=at; if(at===1) wins++; if(at<=10) top10++;
      }
      return {place:+(places/GAMES_N).toFixed(2),
              wins:+(wins/GAMES_N*100).toFixed(1),
              top10:+(top10/GAMES_N*100).toFixed(1)};
    };
    out.rows.push({what:'без выборов',      ...run('none')});
    out.rows.push({what:'выборы у игрока',  ...run('you')});
    out.rows.push({what:'выборы у всех',    ...run('all')});   // как сейчас в игре
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccbal-'));
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
console.log('режим                ср. место   побед %   топ-10 %');
out.rows.forEach(r => console.log(
  r.what.padEnd(20), String(r.place).padStart(9), String(r.wins).padStart(9),
  String(r.top10).padStart(10)));
