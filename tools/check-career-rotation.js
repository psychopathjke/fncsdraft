// Ротация — вопрос четвёртой зоны, и движок его слышит.
//
// Его слово 6 сентября 2026: «делай всё, что считаешь максимально
// реалистичным». Ротация — самое частое решение реального матча, замер по
// реплеям финала Major 2 EU лежит у CC_ROT_REAL. Проверяется:
//   * остановка на четвёртой зоне есть и зовёт ccAskRot;
//   * ответ пишется в you._rot; «на мувменте» есть только с предметом в паке
//     и сжигает его;
//   * движок: early выходит сразу (leaveAt 0), late — позже, чем with, with —
//     позже, чем early; move даёт скорость больше единицы и на следующий круг
//     превращается в early;
//   * под симуляцией вопрос не задаётся, и своя команда ходит как бот (_rot
//     пуст);
//   * строки словаря на месте в ru и en.
//
//   node tools/check-career-rotation.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Rotator', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    skipAnimation=true;

    // ---- остановка ----------------------------------------------------------
    const z4=CC_GAME_STOPS.find(s=>s.zone===4);
    if(!z4 || typeof z4.ask!=='function') fail('the fourth zone has no stop');
    out.steps.push('the fourth zone stops and asks');

    // ---- вопрос: ответ в _rot, мувмент сгорает ------------------------------
    const realBox=ccChoiceBox; let WANT=null, seen=null;
    ccChoiceBox=async function(title, hint, options){ seen=options; return options.find(o=>o.id===WANT) || options.find(o=>o.def) || options[0]; };
    const mk=(move)=>({isYou:true, name:'ME', pow:90, _pf:90, _pc:90, _mats:400,
      _loot:{weapons:[{name:'Striker Pump Shotgun', rarity:'rare'}], heals:[], move:move||null}});
    let you=mk(null); WANT=null;
    await ccAskRot(you, null);
    if(seen.map(o=>o.id).join(',')!=='early,with,late') fail('without a movement item the menu is '+seen.map(o=>o.id).join(','));
    if(you._rot!=='early') fail('the default answer is '+you._rot+', not early');
    if(!seen.every(o=>o.icon)) fail('a rotation option has no picture');
    you=mk({name:'Shockwave Grenade', rarity:'epic'}); WANT='move';
    await ccAskRot(you, null);
    if(seen.map(o=>o.id).join(',')!=='early,with,late,move') fail('with a movement item the menu is '+seen.map(o=>o.id).join(','));
    // Сгорел: слот пуст или занят полом (ccPackFloor) — пол ротацией не считается (16.09).
    if(you._rot!=='move' || (you._loot.move && !you._loot.move.floor)) fail('«on the movement item» did not take: '+you._rot+' / '+JSON.stringify(you._loot.move));
    // Удочка/пол в слоте мувмента — хода «на мувменте» нет (тестер, 16.09).
    you=mk({name:'Pro Fishing Rod', rarity:'rare', floor:true}); WANT='move';
    await ccAskRot(you, null);
    if(seen.some(o=>o.id==='move')) fail('a floor item in the movement slot still offers the movement rotate');
    you=mk(null); WANT='late'; await ccAskRot(you, null);
    if(you._rot!=='late') fail('late did not take');
    ccChoiceBox=realBox;
    out.steps.push('the answer lands in _rot; the movement item is offered only when held and burns on use');
    // ---- цена круга по выходу (CC_ROT_MATS): множитель на один круг ---------------------
    you._buildMul=1; you._rotMul=CC_ROT_MATS.late; you._mats=1000;
    ccKitSpend([you], CC_MATS_ZONE);
    if(you._mats!==1000-Math.round(CC_MATS_ZONE*CC_ROT_MATS.late)) fail('late rotation did not cost '+CC_ROT_MATS.late+'x: '+you._mats);
    if(you._rotMul!=null) fail('rotation multiplier survived the circle');
    ccKitSpend([you], CC_MATS_ZONE);
    if(you._mats!==1000-Math.round(CC_MATS_ZONE*CC_ROT_MATS.late)-CC_MATS_ZONE) fail('the circle after is not plain: '+you._mats);
    if(ccRotMats('move', {_buildMul:1})!==Math.round(CC_MATS_ZONE*CC_ROT_MATS.move)) fail('ccRotMats move');
    out.steps.push('the way out prices one circle: late '+CC_ROT_MATS.late+'x, move '+CC_ROT_MATS.move+'x, then plain again');

    // ---- движок: время выхода по стилю ---------------------------------------
    const set=ZONE_SETS[ACTIVE_LANDING_SET]?ACTIVE_LANDING_SET:'m2';
    const ratio=MAP_ASPECT[set].split('/'), aspect=Number(ratio[1])/Number(ratio[0]);
    const me=careerCard();
    /* Время выхода движок ставит только живым отрядам (runPhase), поэтому
       погибший на высадке отряд хранит число от старой фазы, и проверка
       врала бы про фазу, а не про стиль. Свой отряд здесь неубиваем: дуэль
       подменена так, что он всегда побеждает, а здоровья хватает на любой
       шторм и сёрдж (без выстрелов он всегда под линией сёрджа). */
    const run=(rot)=>{
      const teams=[careerYouTeam([me]), ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 0)];
      teams.forEach(t=>{ t._elims=0; t._feed=[]; t._pf=Math.max(1,t.pow); t._pc=t._pf; });
      buildBotLandingAssignment(teams.slice(1)); teams[0].isYou=true; teams[0].landingZone=ALL_LANDING_ZONES[0];
      teams[0]._rot=rot;
      const me0=teams[0];
      /* Шторм без урона: проверяется время выхода, а не выживание, а свой
         отряд с поздним выходом изредка сгорал в шторме второй зоны (сторож
         падал раз в десяток прогонов). Таблица та же, только dps 0. */
      const calm=ZoneSim.PHASES.map(p=>Object.assign({}, p, {dps:0}));
      const game=ZoneSim.simulateZoneGame(teams, {rng:Math.random, land:ZONE_SETS[set], aspect, record:false, stepwise:true, phases:calm,
        startOf:t=>{ const z=t.landingZone; return z?{x:z.x+z.w/2,y:z.y+z.h/2}:{x:50,y:50}; },
        duel:(a,b,dropping)=>{ if(a===me0 || b===me0) return me0; return dropping?resolveDropDuel(a,b):resolveDuel(a,b,5); }});
      // Дуэли подменены; сёрдж режет тех, кто ничего не настрелял, — здоровье лечится
      // до ста и не спасёт, а вот урон выше линии спасает.
      const sq=game.squads.find(s=>s.team===teams[0]); sq.dealt=1e6;   // выше любой линии сёрджа
      game.playTo(3);
      if(!sq.alive) fail('the unkillable squad died before zone 3 — the duel stub is wrong: '+JSON.stringify({cause:sq.deathCause, hp:sq.hp, dealt:sq.dealt, taken:sq.taken, alive:game.aliveCount(), keys:Object.keys(sq).slice(0,40)}));
      return {leaveAt:sq.leaveAt, speedMul:sq.speedMul, rotAfter:teams[0]._rot, moveUsedZone:sq.moveUsedZone||0};
    };
    const e=run('early'), w=run('with'), l=run('late'), m=run('move'), b=run(null);
    if(e.leaveAt!==0) fail('early leaves at '+e.leaveAt+', not 0');
    if(!(w.leaveAt>e.leaveAt && l.leaveAt>w.leaveAt)) fail('the order is broken: early '+e.leaveAt+', with '+w.leaveAt+', late '+l.leaveAt);
    // Предмет сгорает на первом же круге после ответа, дальше — как early.
    if(!(m.moveUsedZone>0) || m.rotAfter!=='early' || m.speedMul!==1) fail('the movement item: used on zone '+m.moveUsedZone+', style after '+m.rotAfter+', speed now '+m.speedMul);
    if(!(e.speedMul===1 && l.speedMul===1)) fail('speed is not one without the item');
    if(!(b.leaveAt>=0 && b.speedMul===1 && !b.moveUsedZone)) fail('a squad without a style broke: '+JSON.stringify(b));
    out.steps.push('engine: early 0 s, with '+Math.round(w.leaveAt)+' s, late '+Math.round(l.leaveAt)+' s; the item burns on zone '+m.moveUsedZone+' and the squad goes early after');

    // ---- под симуляцией вопрос не задаётся -----------------------------------
    careerSimSet(true);
    const teams=[careerYouTeam([me]), ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 1)];
    buildBotLandingAssignment(teams.slice(1)); teams[0].isYou=true; teams[0].landingZone=ALL_LANDING_ZONES[1];
    let asked=false; const rb=ccChoiceBox; ccChoiceBox=async function(){ asked=true; return {id:'early'}; };
    await playGameWithChoices(teams, null, null);
    ccChoiceBox=rb; careerSimSet(false);
    if(asked) fail('the simulation asked a question');
    if(teams[0]._rot!=null) fail('under simulation the style is '+teams[0]._rot);
    out.steps.push('simulation: no question, the squad rotates like a bot');

    // ---- словарь ---------------------------------------------------------------
    ['ru','en'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      if(!(typeof D.ccRotTitle==='string' && D.ccRotEarlyNote(77,82).length>5 && D.ccRotWithNote(13,85).length>5 && D.ccRotLateNote.length>5 && D.ccRotMoveNote('x').length>5 && D.ccRotSet('x').length>3))
        fail(l+': rotation strings are missing'); });
    out.steps.push('ru and en carry the rotation strings');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrot-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=180000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the fourth zone asks when to rotate, and the engine rotates that way');
