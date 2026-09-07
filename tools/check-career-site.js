// Действия на точке (ccAskSite) и мид граунд в концовке — страница Notion
// «simulation», 7 сентября 2026.
//
// Проверяется:
//   * редкость из сундука падает по таблице CC_CHEST_RARITY (5000 бросков, ±3 п.п.);
//   * пак из сундуков — два ствола РАЗНЫХ классов, не больше двух хилок, мувмент
//     отдельно; цена пака в силе в пределах [-5, 6], у полного пака без редкости — 0;
//   * первая остановка игры стоит на первой зоне и зовёт ccAskSite;
//   * своя точка без чужих: вопроса нет, пак из ccSiteChests(коробка) сундуков (по луту коробки), лут записан;
//   * чужие на точке: вопрос с двумя ходами, «уйти» — по умолчанию; уход
//     переносит отряд на свободную коробку и даёт пак из половины её сундуков (CC_CHESTS_LEAVE_SHARE);
//   * «файтить» с подменённой монеткой: победа выбивает соперника (droppedOut),
//     поражение выбивает нас;
//   * шанс стычки: лучший первый сундук поднимает его, потолок 0.8;
//   * концовка: ход «мид граунд» в списке между высотой и низом, строки в 5 языках.
//
//   node tools/check-career-site.js
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
      v:1, player:{nick:'Lander', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    skipAnimation=true;

    // ---- редкость из сундука ---------------------------------------------------
    const cnt={}; const N=5000;
    for(let i=0;i<N;i++){ const r=ccChestRarity(Math.random); cnt[r]=(cnt[r]||0)+1; }
    Object.keys(CC_CHEST_RARITY).forEach(k=>{
      const got=(cnt[k]||0)/N, want=CC_CHEST_RARITY[k];
      if(Math.abs(got-want)>0.03) fail('rarity '+k+': '+got.toFixed(3)+' vs table '+want);
    });
    out.steps.push('chest rarity over '+N+' rolls: '+Object.keys(cnt).map(k=>k+' '+(cnt[k]/N*100).toFixed(1)+'%').join(', '));
    // ---- класс ствола из сундука (таблица классов, перенормированная на пул) ------
    for(const set of ['m2','m1']){
      const have={}; CC_LOOT_BY_SET[set].weapons.forEach(w=>{ have[w.icon]=1; });
      const keys=Object.keys(CC_CHEST_CLASS).filter(k=>have[k]);
      const tot=keys.reduce((a,k)=>a+CC_CHEST_CLASS[k],0);
      const cc={}; for(let i=0;i<N;i++){ const r=ccChestRoll(Math.random, set); cc[r.weapon.icon]=(cc[r.weapon.icon]||0)+1; }
      keys.forEach(k=>{ const got=(cc[k]||0)/N, want=CC_CHEST_CLASS[k]/tot; if(Math.abs(got-want)>0.03) fail(set+' class '+k+': '+got.toFixed(3)+' vs '+want.toFixed(3)); });
      Object.keys(cc).forEach(k=>{ if(!CC_CHEST_CLASS[k]) fail(set+': chest gave a gun of unknown class '+k); });
      let same=0; for(let i=0;i<300;i++){ const p=ccChestPack(Math.random, set, CC_CHESTS_POI); if(p.weapons.length===2 && p.weapons[0].icon===p.weapons[1].icon) same++; }
      if(same>30) fail(set+': two weapons of one class in '+same+' of 300 packs');
      out.steps.push(set+' chest class over '+N+' rolls: '+keys.map(k=>k+' '+((cc[k]||0)/N*100).toFixed(1)+'%').join(', ')+'; one-class packs '+same+'/300');
    }

    // ---- пак из сундуков -------------------------------------------------------
    for(let i=0;i<200;i++){
      const p=ccChestPack(Math.random, ccLootSet(), CC_CHESTS_POI);
      if(p.weapons.length>2 || p.heals.length>2) fail('pack overflows: '+JSON.stringify(p));
      if(p.move && CC_MOVE_ITEMS.indexOf(p.move.name)<0) fail('move slot holds a heal: '+p.move.name);
      if(p.heals.some(h=>CC_MOVE_ITEMS.indexOf(h.name)>=0)) fail('heal slot holds a movement item');
      if(p.heals.some(h=>CC_CHEST_NOT_HEAL.indexOf(h.name)>=0)) fail('heal slot holds a key or a rod: '+p.heals.map(h=>h.name).join(', '));
      const v=ccPackPow(p); if(v<-5 || v>6) fail('pack power out of range: '+v);
    }
    let sameClass=0; for(let i=0;i<300;i++){ const p=ccChestPack(Math.random, ccLootSet(), CC_CHESTS_POI); if(p.weapons.length===2 && p.weapons[0].icon===p.weapons[1].icon) sameClass++; }
    if(sameClass>30) fail('two weapons of one class in '+sameClass+' of 300 packs');
    // ---- пара «автомат + дробовик», когда оба выпали -------------------------------
    const pair=ccPackFrom([{name:'S',icon:'smg',rarity:'legendary'},{name:'P',icon:'pistol',rarity:'epic'},{name:'R',icon:'rifle',rarity:'uncommon'},{name:'G',icon:'shotgun',rarity:'rare'}], []);
    if(pair.weapons.map(w=>w.icon).sort().join('+')!=='rifle+shotgun') fail('pack is not rifle+shotgun when both dropped: '+pair.weapons.map(w=>w.name).join(','));
    if(pair.weapons[0].name!=='G') fail('the better gun of the pair is not first: '+pair.weapons.map(w=>w.name).join(','));
    const noShot=ccPackFrom([{name:'S',icon:'smg',rarity:'legendary'},{name:'R',icon:'rifle',rarity:'uncommon'},{name:'P',icon:'pistol',rarity:'epic'}], []);
    if(noShot.weapons.map(w=>w.name).join(',')!=='S,R') fail('without a shotgun the rifle plus the best other class was expected, got '+noShot.weapons.map(w=>w.name).join(','));
    out.steps.push('pack pairs the rifle with the shotgun when both dropped, else the best of another class');
    // ---- две хилки — разные (7.09: в паке было «Medkit · Medkit») -------------------
    const twoSame=ccPackFrom([], [{name:'Med Kit',rarity:'rare'},{name:'Med Kit',rarity:'uncommon'},{name:'Shield Fish',rarity:'uncommon'}]);
    if(twoSame.heals.map(h=>h.name).join(',')!=='Med Kit,Shield Fish') fail('two heals of one name in the pack: '+twoSame.heals.map(h=>h.name).join(','));
    const onlyOne=ccPackFrom([], [{name:'Med Kit',rarity:'rare'},{name:'Med Kit',rarity:'uncommon'}]);
    if(onlyOne.heals.length!==2) fail('with one heal name dropped twice the second slot went empty: '+onlyOne.heals.length);
    let dup=0; for(let i=0;i<300;i++){ const p=ccChestPack(Math.random, ccLootSet(), CC_CHESTS_POI); if(p.heals.length===2 && p.heals[0].name===p.heals[1].name) dup++; }
    if(dup>15) fail('two identical heals in '+dup+' of 300 packs');
    out.steps.push('heals in the pack are two different items; identical pairs '+dup+'/300 (only when nothing else dropped)');
    const plain=ccPackFrom([{name:'A',icon:'rifle',rarity:'uncommon'},{name:'B',icon:'shotgun',rarity:'uncommon'}], [{name:'Minis',rarity:'uncommon'},{name:'Medkit',rarity:'uncommon'},{name:CC_MOVE_ITEMS[0],rarity:'rare'}]);
    if(ccPackPow(plain)!==0) fail('a plain full pack is not worth 0: '+ccPackPow(plain));
    if(ccPackPow({weapons:[],heals:[],move:null})!==-5) fail('an empty pack is not -5');
    out.steps.push('packs: two classes, heals and movement in their slots, power in [-5, 6], plain pack = 0');

    // ---- остановка на первой зоне ----------------------------------------------
    const z1=CC_GAME_STOPS[0];
    if(!z1 || z1.zone!==1 || typeof z1.ask!=='function' || typeof z1.room!=='function') fail('the first stop is not the landing site');
    out.steps.push('the first stop is the landing site');

    // ---- игра: своя точка, чужие на точке ---------------------------------------
    const set=ZONE_SETS[ACTIVE_LANDING_SET]?ACTIVE_LANDING_SET:'m2';
    const ratio=MAP_ASPECT[set].split('/'), aspect=Number(ratio[1])/Number(ratio[0]);
    const me=careerCard();
    const mk=()=>{
      const teams=[careerYouTeam([me]), ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 0)];
      teams.forEach(t=>{ t._elims=0; t._feed=[]; t._pf=Math.max(1,t.pow); t._pc=t._pf; });
      buildBotLandingAssignment(teams.slice(1)); teams[0].isYou=true;
      const game=ZoneSim.simulateZoneGame(teams, {rng:Math.random, land:ZONE_SETS[set], aspect, record:false, stepwise:true,
        startOf:t=>{ const z=t.landingZone; return z?{x:z.x+z.w/2,y:z.y+z.h/2}:{x:50,y:50}; },
        duel:(a,b,dropping)=>dropping?resolveDropDuel(a,b):resolveDuel(a,b,5)});
      teams[0]._game=game; teams[0]._sq=game.squads.find(s=>s.team===teams[0]);
      return {teams, game, you:teams[0]};
    };
    const realBox=ccChoiceBox; let WANT=null, seen=null;
    ccChoiceBox=async function(title, hint, options){ seen=options; return options.find(o=>o.id===WANT) || options.find(o=>o.def) || options[0]; };
    skipAnimation=false; careerSimSet(false);
    // Своя точка: коробка, с которой соседей пересадили — в комнате на 50 пустых почти не бывает.
    let g=mk();
    const free=ALL_LANDING_ZONES[0], other=ALL_LANDING_ZONES[1];
    g.teams.slice(1).forEach(t=>{ if(t.landingZone===free) t.landingZone=other; });
    g.you.landingZone=free; g.you._sq.x=free.x+free.w/2; g.you._sq.y=free.y+free.h/2;
    seen=null; const pf0=g.you._pf;
    await ccAskSite(g.you, null);
    // Своя точка — панель с ОДНОЙ кнопкой: сундуки открываются на экране (его слово
    // 7.09 «нет симуляции на локации»); под скипом и в симуляции берётся сама.
    if(!seen || seen.length!==1 || seen[0].id!=='take' || !seen[0].def) fail('a free spot did not show the chest panel: '+(seen&&seen.map(o=>o.id).join(',')));
    // [(] вместо \\( — внутри шаблонной строки BOOT обратная косая съедается и регэксп ломает весь скрипт.
    if(!/[(]/.test(seen[0].note)) fail('the chest panel does not list the loot with rarities: '+seen[0].note);
    // Сундуков — по луту коробки (ccSiteChests), не одной цифрой на всех.
    if(!g.you._loot || g.you._loot.chests!==ccSiteChests(free)) fail('own spot: loot is '+JSON.stringify(g.you._loot)+', box wants '+ccSiteChests(free));
    if(g.you._pf-pf0!==ccPackPow(g.you._loot)) fail('own spot: power did not move by the pack value');
    out.steps.push('own spot: one-button chest panel, '+ccSiteChests(free)+' chests (box loot '+free.loot+'), pack '+ccPackLine(g.you._loot)+' worth '+ccPackPow(g.you._loot));
    // Плавность: сундуков по коробкам острова больше двух разных значений, богатая коробка ≥ бедной.
    const perBox=ALL_LANDING_ZONES.map(z=>ccSiteChests(z));
    const distinct=[...new Set(perBox)];
    if(distinct.length<3) fail('chests per box are not graded by loot: '+distinct.join(','));
    const rich=ALL_LANDING_ZONES.slice().sort((a,b)=>(b.loot||0)-(a.loot||0));
    if(ccSiteChests(rich[0])<ccSiteChests(rich[rich.length-1])) fail('the richest box has fewer chests than the poorest');
    if(Math.min(...perBox)<CC_CHESTS_MIN || Math.max(...perBox)>CC_CHESTS_MAX) fail('chests per box leave the '+CC_CHESTS_MIN+'..'+CC_CHESTS_MAX+' band: '+distinct.join(','));
    out.steps.push('chests per box: '+distinct.sort((a,b)=>a-b).join('/')+' across the island, median box '+CC_CHESTS_POI);

    // Чужие на точке: садимся на коробку соседа.
    const contested=()=>{ const gg=mk(); const rival=gg.teams[1]; gg.you.landingZone=rival.landingZone;
      gg.you._sq.x=gg.you._sq.x; return {gg, rival}; };
    let c=contested(); seen=null; WANT='leave';
    await ccAskSite(c.gg.you, null);
    if(!seen || seen.map(o=>o.id).join(',')!=='leave,fight') fail('contested menu is '+(seen&&seen.map(o=>o.id).join(',')));
    if(!seen[0].def) fail('leaving is not the default');
    if(c.gg.you.landingZone===c.rival.landingZone) fail('leaving did not move the squad off the box');
    const leaveN=ccSiteChests(c.gg.you.landingZone, CC_CHESTS_LEAVE_SHARE);
    if(!c.gg.you._loot || c.gg.you._loot.chests!==leaveN) fail('leaving: loot is '+JSON.stringify(c.gg.you._loot)+', the free box wants '+leaveN);
    if(!c.gg.game.squads.find(s=>s.team===c.rival).alive) fail('leaving killed the rival');
    out.steps.push('contested, leave: menu leave,fight (leave default), moved to a free box, '+leaveN+' chests (half of that box)');

    // Файт — монетка подменена: сначала победа, потом поражение.
    const realRnd=Math.random;
    c=contested(); WANT='fight';
    Math.random=()=>0.01;          // и редкость, и монетка: всё «повезло»
    try{ await ccAskSite(c.gg.you, null); } finally { Math.random=realRnd; }
    const rs=c.gg.game.squads.find(s=>s.team===c.rival), ys=c.gg.game.squads.find(s=>s.team===c.gg.you);
    if(rs.alive || !rs.droppedOut || !ys.alive) fail('won fight: rival alive='+rs.alive+' droppedOut='+rs.droppedOut+' you alive='+ys.alive);
    if(!c.gg.you._loot || c.gg.you._loot.chests!==ccSiteChests(c.rival.landingZone)) fail('won fight: loot is '+JSON.stringify(c.gg.you._loot)+', box wants '+ccSiteChests(c.rival.landingZone));
    c=contested(); WANT='fight';
    Math.random=()=>0.99;
    try{ await ccAskSite(c.gg.you, null); } finally { Math.random=realRnd; }
    const rs2=c.gg.game.squads.find(s=>s.team===c.rival), ys2=c.gg.game.squads.find(s=>s.team===c.gg.you);
    if(ys2.alive || !ys2.droppedOut || !rs2.alive) fail('lost fight: you alive='+ys2.alive+' droppedOut='+ys2.droppedOut+' rival alive='+rs2.alive);
    out.steps.push('contested, fight: won — rival eliminated off spawn and all chests ours; lost — we are out');

    // Шанс: лучший первый сундук поднимает его; потолок 0.8.
    const a={_pc:90}, b={_pc:90};
    const even=ccSiteOdds(a,b,0,0), up=ccSiteOdds(a,b,7,0), down=ccSiteOdds(a,b,0,7);
    if(!(Math.abs(even-0.5)<1e-9 && up>even && down<even && up-even>0.1)) fail('odds: even '+even+' up '+up+' down '+down);
    if(ccSiteOdds({_pc:200},{_pc:50},7,0)>0.8+1e-9) fail('odds exceed the cap');
    out.steps.push('odds: even 50%, better first chest +'+Math.round((up-even)*100)+' pp, cap 80%');
    ccChoiceBox=realBox;

    // ---- мид граунд --------------------------------------------------------------
    const ids=CC_LATE_MOVES.map(m=>m.id);
    if(ids.indexOf('mid')<0 || ids.indexOf('mid')<ids.indexOf('hg') || ids.indexOf('mid')>ids.indexOf('lg')) fail('mid ground is not between the high ground and the low: '+ids.join(','));
    const mid=ccLateMove('mid');
    if(!(mid.odds===CC_MID_ODDS && mid.pow===CC_MID_POW && mid.fail===CC_MID_FAIL)) fail('mid ground numbers: '+JSON.stringify(mid));
    if(!CC_CHOICE_ICON[CC_LATE_ICON.mid]) fail('mid ground has no picture');
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      if(typeof D.ccLateMid!=='string' || typeof D.ccLateMidNote!=='function' || !/65/.test(D.ccLateMidNote(6,4,65))) fail(l+': mid ground strings');
      if(typeof D.ccSiteTitle!=='function' || typeof D.ccSiteFightNote!=='function' || typeof D.ccSiteOwn!=='function' || typeof D.ccSiteLeft!=='function') fail(l+': landing site strings'); });
    out.steps.push('mid ground: in the list between hg and lg, 65% / +6 / -4, picture and five languages');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsite-'));
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
console.log('the landing site opens its chests, a shared box asks fight or leave, and the endgame has a mid ground');
