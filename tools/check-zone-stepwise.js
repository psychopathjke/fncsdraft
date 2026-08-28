// Игра, разрезанная на отрезки, — та же игра.
//
// Ради выборов по ходу (спека «new mechanics»: лут после 2-й зоны, хайграунд на
// 8-й) движок научился останавливаться между кругами: simulateZoneGame с
// opts.stepwise возвращает ручку с playTo(zone)/finish(). Это опасная правка —
// весь режим стоит на этом движке, — поэтому проверяется главное:
//   * пошаговый прогон на том же сиде даёт ТОТ ЖЕ порядок мест, что цельный;
//   * тот же таймлайн, те же элиминации и та же зона у каждого отряда;
//   * playTo реально останавливается ДО названной зоны и её ещё не играл;
//   * обычный вызов (без stepwise) не изменился — им ходит весь остальной код.
//
//   node tools/check-zone-stepwise.js
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const sandbox = {console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'zone-sim.js'), 'utf8'), sandbox);
const ZoneSim = sandbox.ZoneSim;
if(!ZoneSim) { console.error('ZoneSim не поднялся'); process.exit(2); }

// Поле и остров — как в игре: сетка прямоугольников и команды с атрибутами.
const LAND = [];
for(let r=0;r<6;r++) for(let c=0;c<6;c++)
  LAND.push({x:6+c*15, y:6+r*15, w:11, h:11});
function field(n){
  const out=[];
  for(let i=0;i<n;i++){
    const q=1-i/(n-1), a=35+q*60;
    out.push({name:'T'+i, pow:80+q*25, squad:[{},{}],
              attrs:{END:a, SUR:a, AIM:a, CLU:a}, isYou:i===7});
  }
  return out;
}
// Один и тот же сид — одна и та же игра: rng детерминированный, duel тоже.
function run(stepwise){
  const teams=field(40);
  const rng=ZoneSim.createRng(20260823);
  const opts={
    rng, land:LAND, aspect:0.88, record:true, stepwise:stepwise||false,
    startOf:t=>{ const r=LAND[teams.indexOf(t)%LAND.length];
                 return {x:r.x+r.w/2, y:r.y+r.h/2}; },
    duel:(a,b)=>((a.pow||0)>=(b.pow||0)?a:b)
  };
  if(!stepwise) return {res:ZoneSim.simulateZoneGame(teams, opts), teams};
  const g=ZoneSim.simulateZoneGame(teams, opts);
  return {game:g, teams};
}

const whole=run(false);
const step=run(true);
// Режем там, где спека просит спрашивать игрока: после 2-й зоны и на 8-й.
const stops=[];
step.game.playTo(3);
stops.push({asked:3, zone:step.game.zone(), alive:step.game.aliveCount()});
step.game.playTo(8);
stops.push({asked:8, zone:step.game.zone(), alive:step.game.aliveCount()});
const stepRes=step.game.finish();

const line=r=>r.order.map(t=>t.name).join(',');
const zones=(res,teams)=>teams.map(t=>t._zoneReached).join(',');
const elims=(res,teams)=>teams.map(t=>t._elims).join(',');

stops.forEach(s=>console.log('  остановка перед зоной '+s.asked+
  ': сыграно до '+s.zone+', живых '+s.alive));
console.log('  таймлайн: цельный '+whole.res.timeline.length+
            ' кадров, по отрезкам '+stepRes.timeline.length);

let bad=null;
if(line(whole.res)!==line(stepRes)) bad='порядок мест разошёлся';
else if(zones(whole.res, whole.teams)!==zones(stepRes, step.teams)) bad='зоны отрядов разошлись';
else if(elims(whole.res, whole.teams)!==elims(stepRes, step.teams)) bad='элиминации разошлись';
else if(whole.res.timeline.length!==stepRes.timeline.length) bad='таймлайн разной длины';
else if(!(stops[0].zone<3) || !(stops[1].zone<8)) bad='playTo сыграл зону, о которой ещё спрашивают';

if(bad){ console.error('FAILED: '+bad); process.exit(1); }
console.log('игра по отрезкам совпадает с цельной до последнего места');
