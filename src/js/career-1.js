/*@@PART js/career-1.js@@*/
function pickTeamChunk(remaining, size){
  const chunk=[];
  let pool=remaining.slice();
  const firstIdx=weightedPick(pool);
  const first=pool[firstIdx];
  chunk.push(first);
  pool=pool.filter(p=>hKey(p)!==hKey(first));
  const cluster=clusterOf(first);
  for(let k=1;k<size;k++){
    let sameCluster=pool.filter(p=>clusterOf(p)===cluster);
    const candidates = sameCluster.length>0 ? sameCluster : pool;
    if(candidates.length===0) break;
    const idx=weightedPick(candidates);
    const picked=candidates[idx];
    chunk.push(picked);
    pool=pool.filter(p=>hKey(p)!==hKey(picked));
  }
  return {chunk, remaining:pool};
}

// generateLobby and assignLandingZones used to live here: a second way to put
// a lobby on the island, ordered by power, which honoured the player's pick by
// fencing their box off so nobody could join it. Nothing called either of them -
// generateLobby appeared exactly once in the file, in its own definition - and
// every mode goes through pickInitialZone, which orders on how the field
// qualified and lets the squads picking after you land on your head. Two rules
// for one thing, one of them unreachable and the wrong one, is how somebody
// ends up "fixing" the dead copy.

// Weighted sampling without replacement — used to decide which teams get
// drawn into this round's fights.
function pickWeighted(pool, weightFn, count){
  const arr=pool.slice();
  const picked=[];
  while(picked.length<count && arr.length){
    const weights=arr.map(weightFn);
    const total=weights.reduce((s,w)=>s+w,0)||1;
    let r=Math.random()*total, idx=0;
    for(;idx<arr.length;idx++){ r-=weights[idx]; if(r<=0) break; }
    idx=Math.min(idx,arr.length-1);
    picked.push(arr[idx]);
    arr.splice(idx,1);
  }
  return picked;
}

// A more realistic single-match simulation: teams actually fight specific
// named opponents, round by round, with more of the lobby forced into fights
// as the circle shrinks (few early skirmishes, a scrap for every remaining
// team in the endgame). Weaker squads are more likely to get caught out and
// drawn into a fight early — stronger squads tend to survive longer, same as
// a real BR lobby, instead of every team facing equal early risk. Duel odds
// use a steep pow exponent so a real strength gap actually dominates, not just a slight
// edge. Returns teams ordered 1st (champion) to last, with team._elims (real
// elim count) and team._feed (readable kill feed) attached for that game.
// Duo's 50-team lobby has far more distinct opponents to get lucky against
// than squad's 25-team lobby, so the same exponent converts a power gap into
// repeated outright wins much more easily in squad. Scaling the exponent
// down for smaller squad sizes keeps duo's calibration (already tuned per
// feedback) while fixing squad's tendency to produce 5-7 wins out of 12 for
// a merely-strong team, which real FNCS never looks like.
// How decisively a power edge settles a fight, and how well it keeps you out of
// fights in the first place. Both were tuned against the real Grand Finals
// results the card sets are built from (CARD_M*_GF_RAW): a 50-team final where
// the winner takes ~4 Victory Royales in 12 games and averages 8th place, while
// the bottom of the field scores almost nothing. The old values produced a
// field far too flat — its winner averaged 16th and won barely one game.
// Measured against the two real Grand Finals in the card sets (50 teams, 12
// games, complete fields — so a like-for-like comparison, unlike the Play-In
// arrays which are the top 150 of a field of thousands):
//
//                #1 pts   wins   avg place   elims/match   #10   #25   #50   top:bottom
//   real m1         738      2        6.83          4.75   380   222    28        26x
//   real m2         732      4        8.00          4.50   376   240     8        92x
//   old 5 / 1       514   0.85       16.50          3.77   339   252    80         6x
//   new 15 / 16     721   3.08        8.40          4.34   386   236    31        23x
//
// The old numbers were realistic in aggregate — field total points and the
// league-wide elimination rate were already almost exact — but far too flat.
// Its winner averaged 16th place and barely one Victory Royale in twelve games,
// and its last-placed team still scored 80 points where a real one scores 8-28.
// Raising both knobs pulls the shape of the standings onto the real one without
// touching the scoring tables, which were never the problem.
//
// Trio and Squad have no real FNCS results to fit against — those modes are
// explicitly fantasy — so their exponents keep the original relative ordering,
// scaled by the same factor as Duo.
const DUEL_POW_EXPONENT_BY_MODE={2:7, 3:6, 4:4};

// Per-game form. Measured against all fourteen real Grand Finals, every other
// number lined up — the winner's points, Victory Royales, and the whole body of
// the table were inside 5% — but one did not: the winner's average placement.
// Real winners average 12th, the simulation's averaged 8th, and no value of the
// two knobs above moved it, because the mean was never the problem.
//
// The real shape is boom-or-bust: a winner takes a couple of Victory Royales
// and rides the middle of the pack the rest of the time, which averages out to
// 12th while the points come from the wins. The simulation gave every team the
// exact same power in all twelve games, so its winner placed ~8th in every one
// of them — same points, wrong shape, and far too steady.
//
// So each team rolls fresh form for each game: bad rotations, a contested drop,
// a zone that never comes. It changes no team's average strength, only how much
// any single game deviates from it.
//
// Measured, it helps the open stages and hurts the finals, so like the survival
// bias it is set per stage type. In the Play-In it pulls the leader's Victory
// Royales from 4.1 down onto the real 3.0; in a Grand Finals any amount of it
// makes the fit worse across the board — 0.10 already costs five points of
// accuracy, 0.28 costs twenty-three — because a final is 50 teams that are all
// good, and noise there just flattens the table it took real separation to
// shape. Finals stay deterministic.
const FORM_SPREAD_OPEN=0.16, FORM_SPREAD_FINALS=0;
let FORM_SPREAD=FORM_SPREAD_OPEN;
function gameForm(){
  // three uniforms average to a bell, bounded to 1 +/- FORM_SPREAD and cheap
  return 1 + ((Math.random()+Math.random()+Math.random())/3 - 0.5) * 2 * FORM_SPREAD;
}

// How hard a power edge keeps you out of fights. This cannot be one number,
// because the real results say the same players behave completely differently
// depending on the stage:
//
//                       elims/match   avg place
//   Play-In leader          9.8-12.8   16.9-17.8
//   Grand Finals leader      4.5-4.75    6.8-8.0
//
// The open stages are a kill race across a huge, loose field — even the leaders
// farm eliminations and die mid-pack. The finals are played for placement. A
// single global value fits one and wrecks the other: tuned for the finals, the
// best duo stopped being dragged into fights at all and won 16 of 22 Play-In
// games where the real leader wins 3.
//
// Which one applies is read off the scoring table the stage runs on — every
// placement-driven final scores on pointsForPlace, every qualifier does not —
// so no call site has to remember to set it.
const SURVIVAL_BIAS_OPEN=1, SURVIVAL_BIAS_FINALS=16;
let SURVIVAL_BIAS=SURVIVAL_BIAS_OPEN;
function applyStageBias(pointsFn){
  const finals = (pointsFn===pointsForPlace);
  SURVIVAL_BIAS = finals ? SURVIVAL_BIAS_FINALS : SURVIVAL_BIAS_OPEN;
  FORM_SPREAD   = finals ? FORM_SPREAD_FINALS   : FORM_SPREAD_OPEN;
  // The zone engine needs the same split, for the same reason and off the same
  // signal — an open stage is a kill race and a final is played for placement,
  // and one setting cannot be both. Reading it off the scoring table here means
  // no call site has to remember to set it, exactly as with the two above.
  // Карьера может назвать профиль сама (финал соло играется под очками
  // Victory Cup, но это финал) — см. CC_ZONE_PROFILE у ccZoneTuneFor.
  const forced = (typeof CC_ZONE_PROFILE !== 'undefined') ? CC_ZONE_PROFILE : null;
  if(typeof ZoneSim !== 'undefined') ZoneSim.profile(forced || (finals ? 'finals' : 'open'));
}
// The trade, on its own. It was written out twice inside simulateGame — once
// for the pair loop and once for the hot streak — and the zone engine needs a
// third caller, so it lives here now and there is exactly one copy of it.
// Reads _pc, which is power as seen from inside a fight: form applied, plus the
// ping edge, which is the only thing ping touches.
/* КИЛЛЫ ИГРОКА, А НЕ ТОЛЬКО ОТРЯДА — идея его подписчика, 11 сентября: «чтоб писались киллы
   игрока и команды, как в фортнайте». Движок считает элимы отрядом, людей внутри команды у
   него нет; разложить их можно только правилом. Правило — привычка к дракам: AIM карточки это
   среднее число элимов за игру, то есть ровно то, чем один в паре отличается от другого.
   Веса едут на роастере, раскладывает их сам показ (killShare в zone-replay): он повторяем и
   не тратит ни одного броска вечера. Соло — вес один, число одно. */
function ccYouKillSplit(you){
  try{
    const sq=(you && you.squad||[]).filter(Boolean);
    if(sq.length<2) return null;
    const me=(typeof careerCard==='function') ? careerCard() : null;
    const key=me ? hKey(me) : null;
    let seat=key ? sq.findIndex(c=>hKey(c)===key) : -1;
    if(seat<0) seat=0;
    /* НЕ ПОРОВНУ (идея игрока 30.09: «чтобы киллы не поровну делились у команды, для реалистичности»).
       Вес был голым AIM — у двух про-игроков это 90 и 88, и элимы делились почти пополам. Теперь разница
       в AIM растянута (четвёртая степень), а роль весит сама: фраггер берёт больше, ИГЛ меньше. Множители
       ролей — оценка режима (у фраггера в дуо обычно около двух третей элимов), не замер. */
    return {seat:seat, w:ccKillWeights(sq)};
  }catch(e){ return null; }
}
// Веса киллов каждой команды лобби для движка (zone-sim giveKill: кил — одному игроку). Считаются раз на команду.
function ccSetKillW(teams){ try{ (teams||[]).forEach(t=>{ const sq=t && t.squad; if(!t._killW && sq && sq.length>1 && sq.every(Boolean)) t._killW=ccKillWeights(sq); }); }catch(e){} }
const CC_KILL_ROLE_W={roleFRG:1.5, roleIGL:0.75};
function ccKillWeights(sq){
  const roles=[];
  return ccKillRankBoost(sq.map(c=>{ const a=(typeof attrsFor==='function') ? attrsFor(c) : null;
    const aim=(a && a.aim) || 50;
    roles.push(a && a.roleKey);
    return Math.pow(aim/60, 4)*(CC_KILL_ROLE_W[a && a.roleKey]||1); }), roles);
}
/* РОЛЬ ВНУТРИ КОМАНДЫ (второй отзыв игрока 30.09: «почти всегда одинаковое число киллов»). Роль карточки
   одна на всю сцену, и у двух фраггеров (или двух ИГЛов) с близким AIM элимы снова шли поровну — так
   выходила треть всех пар. В настоящей команде один всё равно главный по дракам: самый боевой в отряде
   тянет ×1,6, дальше по убыванию ×1 / ×0,75 / ×0,6. Порядок при равенстве — место в составе, то есть
   у обоих клиентов одинаковый. Оценка режима, не замер. */
const CC_KILL_RANK=[1.6, 1, 0.75, 0.6];
/* ФРАГГЕР ВПЕРЕДИ (тестер 7.10: «чтобы у фрагера больше киллов было»). AIM в четвёртой степени
   перебивал роль: ИГЛ с AIM 99 забирал 70 % элимов у фраггера с AIM 76 — на карточке «Фраггер», а
   выбивает напарник. Теперь фраггер первым встаёт в очередь на ×1,6 и весит не меньше 1,25 лучшего
   из нефраггеров. Два фраггера (или ни одного) по-прежнему решает AIM. Оценка режима, не замер. */
const CC_KILL_FRG_LEAD=1.25;
function ccKillRankBoost(w, roles){
  const frg=i=>!!(roles && roles[i]==='roleFRG');
  const ord=w.map((v,i)=>i).sort((a,b)=>(frg(b)-frg(a)) || (w[b]-w[a]) || (a-b));
  const out=w.slice();
  ord.forEach((i,r)=>{ out[i]=w[i]*(CC_KILL_RANK[r]!=null ? CC_KILL_RANK[r] : 0.6); });
  if(roles && w.some((v,i)=>frg(i)) && w.some((v,i)=>!frg(i))){
    const top=Math.max(...out.filter((v,i)=>!frg(i)));
    out.forEach((v,i)=>{ if(frg(i) && v<top*CC_KILL_FRG_LEAD) out[i]=top*CC_KILL_FRG_LEAD; });
  }
  return out;
}
// Доля элимов отряда у одного из его людей (журнал игроков, фраггер года) — то же правило.
function ccMemberKills(team, name){
  const total=(team && team.stageElims)||0;
  try{
    const sq=(team && team.squad||[]).filter(Boolean);
    if(sq.length<2 || typeof ZoneReplay==='undefined' || !ZoneReplay.killShare) return total;
    const seat=sq.findIndex(c=>hKey(c)===hKey(name));
    if(seat<0) return total;
    const v=ZoneReplay.killShare(total, ccKillWeights(sq), seat);
    return v==null ? total : v;
  }catch(e){ return total; }
}
// Сколько из отрядного счёта твои (правило одно, живёт в zone-replay).
function ccYouKills(you, total){
  const sp=ccYouKillSplit(you);
  if(!sp || typeof ZoneReplay==='undefined' || !ZoneReplay.killShare) return null;
  const v=ZoneReplay.killShare(total||0, sp.w, sp.seat);
  return (v==null) ? ((total||0)===0 ? 0 : null) : v;
}
function ccRosterYouSplit(roster, you){
  try{ if(roster && you){ const sp=ccYouKillSplit(you); if(sp) roster.youKills=sp; } }catch(e){}
  return roster;
}
/* «Кейить» (отзыв 2.10, Notion «02»: «a button if you want to key or play chill… after you troll for
   so many games you get high kill wins»). Голая агрессия (_seekMul) была штрафом и не выпускалась
   (см. «План на вечер… ЗАМЕРЕНЫ И НЕ ВЫПУЩЕНЫ»): больше драк — больше смертей, и ничего взамен.
   Новый рычаг — лут с киллов, как в игре: у команды, которая кейит (_keyLoot), каждый килл этой игры
   (_gElims, считает zone-sim) прибавляет к силе в следующих файтах долю _keyLoot. Сильный разгоняется
   и забирает игры с киллами, слабый умирает рано. Число — по замеру tools/career-spread-probe.js. */
function ccKeyBoost(t){ return t && t._keyLoot ? 1 + t._keyLoot * Math.min(CC_KEY_LOOT_CAP, t._gElims || 0) : 1; }
function resolveDuel(a, b, exponent){
  const wa = Math.pow(Math.max(a._pc * ccKeyBoost(a), 1), exponent);
  const wb = Math.pow(Math.max(b._pc * ccKeyBoost(b), 1), exponent);
  /* Пинг людей и в дуэлях движка после высадки (его «пинг пусть зависит в мид гейме в файтах»): замер 15.11 показал, что
     поправка только в окнах (ccFightApply, высота) тонет в шуме — основные файты середины решает движок здесь. */
  const tA = typeof ccPingFightTilt==='function' ? ccPingFightTilt(ccPingFightMs(a)) : 0;
  const tB = typeof ccPingFightTilt==='function' ? ccPingFightTilt(ccPingFightMs(b)) : 0;
  if(tA || tB) return Math.random() < clamp(wa/(wa+wb)+tA-tB, 0.02, 0.98) ? a : b;
  return Math.random() * (wa + wb) < wa ? a : b;
}

/* Замер 2.10 (tools/career-spread-probe.js, 600 игр на режим, комната на 50, очки = место + элимы×4):
     рейтинг 97: обычно 40.0 оч · 4.0 эл · 4.8% побед · топ-10 43% | кейить лут 0.01: 41.0 · 5.4 · 6.0% · 31%
     рейтинг 86: обычно 26.8 · 2.1 · 0.7% · 31%                      | кейить 0.01: 26.5 · 3.0 · 0.8% · 23%
     рейтинг 78: обычно 16.2 · 1.4 · 0.2% · 13%                      | кейить 0.01: 17.2 · 2.0 · 0.0% · 10%
   Без лута (0) агрессия ×1.6 — штраф (97: 42.4 → 34.2). С лутом 0.02 — подарок всем (97: 48.2, 86: 30.2,
   78: 20.0) — лестница дивизионов сломалась бы. 0.04 — 20% побед на 97. На 0.01 среднее то же, а выбор
   меняет форму вечера: больше киллов и побед у сильных, реже топ-10, чаще провал. «Спокойно» (×0.6):
   97 — 42.9 против 42.4, больше топ-10, меньше киллов. */
let CC_KEY_LOOT=0.01, CC_KEY_LOOT_CAP=12, CC_KEY_SEEK=1.6, CC_CHILL_SEEK=0.6;
// A fight in the first forty seconds, settled on the same capped odds the
// landing picker quotes. Off the spawn there is no loadout, no height and no
// information, so power tilts the spot and never owns it — see LANDING_ODDS_CAP.
// The engine tells us which fights those are; everything after runs on the
// mode's own duel exponent, where a loadout and a position have been earned.
function resolveDropDuel(a, b){
  const wa = Math.pow(Math.max(a._pc, 1), LANDING_POW_EXPONENT);
  const wb = Math.pow(Math.max(b._pc, 1), LANDING_POW_EXPONENT);
  let p = clamp(wa / (wa + wb), 1 - LANDING_ODDS_CAP, LANDING_ODDS_CAP);
  if(a._land!=null && b._land!=null) p += CC_BUS_LEAD_P*clamp((b._land - a._land)/CC_BUS_LEAD_SEC, -1, 1);
  return Math.random() < p ? a : b;
}

// Fewer squads than this and the game is simulated but not played back.
const REPLAY_MIN_SQUADS = 8;
let LAST_ZONE_TIMELINE = [];
let LAST_ZONE_ROSTER = [];
let RECORD_NEXT_ZONE_GAME = false;

/* Чужие регионы быстрой моделью (16.10): разброс силы ±24% подобран по замеру — связь силы и места 0.624 против 0.625 у
   полного движка (NAC, EU, ASIA, BR по 20 вечеров), переход дня в 4 раза быстрее. CC_WORLD_FAST_EXP — запасная ручка, 1. */
let CC_WORLD_FAST=false, CC_WORLD_FAST_EXP=1, CC_WORLD_FAST_NOISE=0.24;
function useZoneSim(teams){
  return typeof ZoneSim !== 'undefined' && !CC_WORLD_FAST
      // Every mode and every squad size the app plays. The engine was written
      // for duos in a Major and gated to exactly that while it was being
      // calibrated, but nothing in it counts to two and nothing in it knows
      // what a Major is: a squad carries its own player count for the header
      // and for Storm Surge, the duel it hands a fight to is the app's own,
      // picked by size on the line below, and a lobby is a lobby.
      /* И соло тоже — это чинит «иногда на турнирах только таблица»: соло
         Victory Cup был единственным вечером вообще без карты (squadSize=1 не
         проходил гейт). Замерено career-solo-map-probe.js на лобби 100, игрок
         82 при потолке 93, по 300 игр: среднее место 41.98→42.59, победы
         2.3%→3.3%, топ-10 18.3%→23.7%, связь силы с местом −0.99→−0.95.
         Карта чуть щедрее к верху — это её собственный шум, — но игру решает
         та же сила. */
      && squadSize >= 1 && squadSize <= 4
      && teams.length >= 2
      && ALL_LANDING_ZONES.length > 0;
}

// Bridges the app's team objects to the engine. The engine knows nothing about
// this file: it is handed a random source, the island, where everyone dropped,
// and how to settle a fight.
//
// lobbyOpts carries the size of the real lobby this game was drawn from, when
// it differs from `teams`. It differs whenever a caller has already dropped
// some of the field — the landing fight losers, for the live replay — before
// ever handing survivors to the engine; without it the replay header counts
// down from whoever is left rather than from the fifty who dropped.
/* Игра, сыгранная с остановками, и вопрос игроку на каждой.

   Устроена поверх stepwise-режима движка (см. zone-sim.js): движок доигрывает
   до названного круга и ждёт, мы спрашиваем, применяем ответ к силе и пускаем
   дальше. Кадры за это время уже записаны, поэтому показывается ровно тот
   отрезок, который только что просчитан, — игрок видит игру до вопроса, а не
   после него.

   Только своя комната и только когда есть кому отвечать: в перемотке, под
   скипом и в харнессах вопросы задаёт ccAutoAnswer, и вечер идёт сам. */
async function playGameWithChoices(teams, lobbyOpts, ui){
  const set    = ZONE_SETS[ACTIVE_LANDING_SET] ? ACTIVE_LANDING_SET : 'm2';
  const ratio  = MAP_ASPECT[set].split('/');
  const aspect = Number(ratio[1]) / Number(ratio[0]);
  const exponent = DUEL_POW_EXPONENT_BY_MODE[squadSize] || 5;
  teams.forEach(t=>{
    t._elims=0; t._feed=[];
    t._pos=null;   // позиция в круге для движка (chooseTarget), на одну игру
    t._tac=null; t._stance=null;   // тактика встреч и стойка концовки: из окон этой игры
    t._pf=Math.max(1, t.pow*gameForm());
    /* Что выпало форме — отдельно от того, что сделал игрок.

       Жалоба игрока: «в начале каждой игры почему-то разная
       сила, в чём проблема?». Колонка показывала _pf, то есть силу карточки,
       умноженную на бросок формы (±16% на игру, FORM_SPREAD_OPEN), — и на
       замере одна и та же связка 96 показывала 91-102 за одиннадцать игр.
       Бросок нужен движку (он откалиброван и правит дисперсию открытых
       этапов), но игроку он не виден и решать по нему нечего.

       Поэтому база броска запоминается, и колонка показывает силу карточки
       плюс то, что к ней добавили ЛУТ и ВЫСОКАЯ ЗЕМЛЯ, — ровно то, на что
       игрок влияет. См. livePow. */
    t._pfBase=t._pf;
    t._pc=Math.max(1, t._pf+(CC_ZB ? 0 : (t.closeEdge||0)));   // Zero Build: край построек не считается
  });
  const you=teams.find(t=>t.isYou);
  ccMpMark('pf', teams);
  /* Люди в лобби — в порядке ников: в соло на двоих вопрос задаётся каждому,
     и у обоих клиентов в одном и том же порядке. См. runCareerSoloSeries. */
  const humans=teams.filter(t=>t.isYou||t.isMate||t.isRival)
    .sort((a,b)=>String(a.mpTag||a.name)<String(b.mpTag||b.name) ? -1 : 1);
  ccSetKillW(teams);
  ccBusSetLand(teams, aspect);
  const game=ZoneSim.simulateZoneGame(teams, {
    rng: Math.random, land: ZONE_SETS[set], aspect: aspect,
    // Острова Reload (r1–r4) идут по своему шторму — см. RELOAD_PHASES в zone-sim,
    // и с возрождениями до восьмого круга — см. onDeath там же.
    phases: ccStormPhases(set, squadSize),
    // В соло-Reload возрождать некому — без напарника смерть окончательная
    // (реплеи Reload Solo Victory Cup S41: 40 → 27 к восьмому кругу, а не 40).
    respawnUntilZone: (/^r\d$/.test(set) && squadSize>1) ? CC_RELOAD_RESPAWN_ZONE : 0,
    startOf: t => { const z=t.landingZone;
      if(z) return {x: z.x + z.w/2, y: z.y + z.h/2};
      const grid=ZONE_SETS[set];
      const r=grid[(t._uid != null ? t._uid : Math.floor(Math.random()*grid.length)) % grid.length];
      return {x: r.x + r.w/2 + (Math.random()-0.5), y: r.y + r.h/2 + (Math.random()-0.5)}; },
    duel: (a, b, dropping) => dropping ? resolveDropDuel(a, b) : resolveDuel(a, b, exponent),
    record: true, stepwise: true,
    lobbySquads: lobbyOpts && lobbyOpts.lobbySquads,
    lobbyPlayers: lobbyOpts && lobbyOpts.lobbyPlayers
  });
  ccMpSimOn(game, teams);   // книга бросков теперь метит и состояние отрядов (ccMpMark)
  CC_BUS_GAME=game; CC_BUS=null;   // линия автобуса этой игры (ccBus) — из её первого круга
  // Подписи к точкам нужны показу с первого же куска, а не с конца матча.
  LAST_ZONE_ROSTER=ccRosterYouSplit(game.roster(), you);
  // Свой отряд движка — лечению нужно трогать его щит и здоровье. См. ccAskHeal.
  if(you) you._sq=(game.squads||[]).find(s=>s.team===you)||null;
  // И сама игра — файту середины нужны eliminate/nearest движка. См. ccFightApply.
  if(you) you._game=game;
  /* То же — каждому человеку лобби: в общей комнате гонки остановки спрашиваются и
     у соперника (его ответ приходит по проводу), а ccAskSite без _game молчал —
     и у двоих вечера расходились с первой зоны (проба check-race-live-two). */
  humans.forEach(h=>{ if(h && h!==you){ h._sq=(game.squads||[]).find(s=>s.team===h)||null; h._game=game; } });
  const alive=()=>!you || (game.squads.find(s=>s.team===you)||{}).alive;
  /* Порядок здесь и есть вся суть: сначала показать кусок игры, который только
     что просчитан, и лишь потом спросить. Правка: «во время игры можно это
     делать, как в notion написано» — вопрос должен заставать посреди матча, а
     не стоять перед ним. Поэтому ui.show получает кадры на эту секунду и
     проигрывает ровно то, что новое; спрашиваем уже после.

     Спрашиваем только пока ты в игре: у выбывшего нет ни лута, ни высокой
     земли, и держать его вопросом — значит держать его зря. */
  /* Вечер, отданный симуляции, не спрашивает — «за него просто варианты
     выберут». Выбирает не первая кнопка (она самая осторожная, и играть ею
     весь турнир значит играть хуже всей комнаты), а ровно тот же бросок,
     которым ходят боты: stop.room без исключения для игрока раздаёт ему лут и
     высоту наравне с остальными пятьюдесятью. Ничего нового считать не надо, и
     баланс остаётся тем же, что был измерен. */
  const sim=careerSimOn();
  let dead=false, deathShown=false;
  ccKitInit(teams);
  let zoneWas=0;
  for(const stop of CC_GAME_STOPS){
    if(!(stop.zone>zoneWas)) continue;   // у шторма вечера нет такого круга (ccEndZones)
    /* По одному кругу за раз — и отметка на каждый. Движок от этого не меняется
       (playPhases докручивает до названного круга и помнит, где стоял), а книга
       начинает называть КРУГ, на котором вечера разъехались, а не «где-то между
       остановками». */
    for(let z=zoneWas+1; z<=stop.zone; z++){ game.playTo(z); if(z<stop.zone) ccMpMark('z'+z, teams); }
    // Круги, прошедшие с прошлой остановки, стоят стройки — всем одинаково.
    if(!CC_ZB){   // Zero Build — стройки нет; до третьей зоны круг дешевле (ccMatsZoneCost)
      let cost=0; for(let z=zoneWas+1; z<=Math.max(zoneWas+1, stop.zone); z++) cost+=ccMatsZoneCost(z);
      ccKitSpend(teams, cost);
    }
    zoneWas=stop.zone;
    CC_KIT_ZONE=zoneWas;   // панель на карте досчитывает ресы по зоне кадра, см. ccKitPanel
    // Концовка без ресов стоит силы, и комнате тоже. См. CC_MATS_PEN.
    if(stop.zone>=8 && !CC_ZB) ccMatsPenalty(teams);
    ccMpMark('p'+stop.zone, teams);
    if(ui && ui.show && !dead) dead=await ui.show(game.frames());
    ccMpMark('s'+stop.zone, teams);
    // Комната делает свой ход всегда — она играет и тогда, когда игрок уже
    // выбыл или смотрит перемотку.
    // Лобби без своей команды (чужое лобби гонки): людям в нём всё равно вопрос, не бросок — см. ccRoomLoot.
    if(stop.room) stop.room(teams, sim ? null : (you || humans[0] || null));
    ccMpMark('r'+stop.zone, teams);
    /* Спрашивать или нет, решает игра, а не показ. `dead` это признак показа (showPart -> cutShort: команду убили в
       показанных кадрах), а alive() состояние отряда после game.playTo, одинаковое у обоих.
       Они расходятся: один досматривает бой на офспавне и получает cutShort, второй перематывает (общий пропуск
       застаёт их в разных местах) или упёрся в 45-секундного сторожа реплея (skipAnimation, false). Тогда число
       вопросов разное и вечера разъезжаются.
       alive() покрывает и смысл dead: у выбывшего нет лута и хайграунда. dead по-прежнему решает, рисовать ли кадры.
       */
    if(!sim && game.aliveCount()>1){
      for(const h of humans){
        // Молчаливая остановка: вопрос не задаётся, когда отвечать не на что
        // (полные ресы). Условие считается из общего состояния команды,
        // поэтому у обоих клиентов вопрос либо есть, либо нет — вместе.
        if(stop.quiet && stop.quiet(h)) continue;
        if((game.squads.find(s=>s.team===h)||{}).alive){ CC_ASK_FOR=h; try{ await stop.ask(h, ui); } finally{ CC_ASK_FOR=null; } }
      }
    }
    ccMpMark('q'+stop.zone, teams);
    // Повтор смерти — один раз, когда свой отряд выбыл (см. ccDeathCard).
    if(you && ui && !sim && !deathShown && !alive()){ deathShown=true; await ccDeathCard(ui.map, ccDeathInfo(you, game)); }
  }
  const res=game.finish();
  ccMpMark('fin', teams);
  ccMpSimOn(null, null);
  // И остаток матча — тем же куском, если игрок ещё смотрит.
  if(ui && ui.show && !dead) await ui.show(res.timeline);
  if(you && ui && !sim && !deathShown && !alive()){ deathShown=true; await ccDeathCard(ui.map, ccDeathInfo(you, game)); }
  LAST_ZONE_TIMELINE=res.timeline;
  LAST_ZONE_ROSTER=ccRosterYouSplit(res.roster, you);
  RECORD_NEXT_ZONE_GAME=false;
  teams.forEach(t=>{
    const cause=t._deathCause;
    if(cause === 'storm')      t._feed.push(L().feedStorm);
    else if(cause === 'surge') t._feed.push(L().feedSurge);
    else if(cause)             t._feed.push(L().feedDied(String(cause).replace(/<[^>]+>/g,'')));
  });
  return res.order;
}
/* Где игра останавливается и о чём спрашивает — его расписание: лут после
   второй зоны, высокая земля на восьмой. */
/* Ресы и лут во время игры, чтобы игрок решал, стоит ли рисковать.
   Ресы одно число: каждый круг стоит стройки (CC_MATS_ZONE), рефреш пополняет, хайграунд тратит вдвое.
   Концовка штрафуется по остатку (CC_MATS_BANDS): верхняя треть 0, средняя −1, нижняя CC_MATS_PEN.
   Комната живёт по тем же числам (ccRoomMats), иначе поедет калибровка лестницы дивизионов.
   Вопрос про рефреш только на 5-й и 7-й зоне и только когда ресы кончились, иначе это ~90 вопросов за вечер. */
/* ШКАЛА ИГРЫ — отзыв: «чем больше ресов, тем больше силы, но
   лимиты 500 500 500». Ресы считаются в единицах игры: полный запас 1500 (три
   стопки по 500, CC_MATS_CAP_EACH), круг стоит 300 (та же пятая часть, что
   были 110 из 550), высокая земля — ещё 250. Начало игры — не полный запас:
   на точке собирается CC_MATS_START, а до фула фармят после лута (ccAskFarm на
   третьей зоне — его пункт 3 со страницы «simulation»: «нафармить до фула /
   набить сёрдж и добыть меньше, типа 400 400 400 / зафайтить ближайшее дуо»). */
const CC_MATS_FULL=1500, CC_MATS_ZONE=300, CC_MATS_PEN=3;
const CC_MATS_CAP_EACH=500, CC_MATS_START=600, CC_MATS_SURGE_FARM=1200;
/* РАННИЕ РЕСЫ ДОЛЖНЫ ДОЖИВАТЬ ДО СЕРЕДИНЫ. Тестер, 16 сентября: «не понятно,
   зачем выбирать что-то кроме лучшего лута, ведь потом ресы всё равно надо
   фармить» и «ресы всегда можно набить до фула». Так и было, по двум причинам:
   до третьей зоны круг стоил те же 300, что и в концовке (600 на старте −
   900 за три круга = ноль у всех), а фарм на третьей зоне ставил ровно
   1500 — любые ±300 с точки стирались дважды. Теперь круги до третьей зоны
   стоят CC_MATS_EARLY_ZONE (лут, а не стройка), а фарм ПРИБАВЛЯЕТ
   CC_MATS_FARM до потолка: «схватить и ехать» приходит к третьей зоне с
   600 и фармится в 1500, «забрать» — 1200, «обшарить всё» — 900, а уход с
   занятой точки без файта — 1200 и беднее луто́м. Сёрдж и файт на третьей —
   CC_MATS_FARM_SHORT (время ушло на теги). Комната фармит тем же правилом
   (ccRoomFarm), так что лестница дивизионов не двигается — меняется только
   цена решений. Числа — решение, не замер (в JSON реплеев трат нет). */
/* 29.09, его слово «материалы всегда фулл почти»: проба career-mats-band-probe (150 игр) — на восьмой зоне
   58 % комнаты в верхней трети, 12 % в средней, 30 % в нижней при фарме +900/+600. Фарм +700/+450:
   42 / 41 / 17 — середина игры идёт с ~1000, а не с потолком. Числа по-прежнему решение, не замер. */
const CC_MATS_EARLY_ZONE=100, CC_MATS_FARM=700, CC_MATS_FARM_SHORT=450;
function ccMatsZoneCost(zone){ return zone<=3 ? CC_MATS_EARLY_ZONE : CC_MATS_ZONE; }
function ccMatsAdd(t, n){ if(t) t._mats=Math.min(CC_MATS_FULL, Math.max(0, ccMats(t))+n); }
const CC_MATS_HG_EXTRA=250;  // высокая земля строится, и это дороже обычного круга
/* Концовка по остатку ресов ступенями, а не одним порогом CC_MATS_LOW.
   Замер Tracker, финал DreamHack Solo NAE 15.10.2020, постройки на старте зоны (150 = кап 1500) и доля доживших до
   следующей (зона 4→5 / 6→7):
     ≤50: 50% / 42%;  51–100: 76% / 72%;  >100: 93% / 86%.
   В логитах зоны 6: 1.28 низ→середина, 0.83 середина→верх, отсюда верх 0, середина −1, низ −3 (на −3 посчитано
   ожидание рефреша, см. CC_LATE_MOVES).
   Штраф общий, комната идёт по тем же ступеням, лестница дивизионов не сдвигается. Замера 2026 нет: в JSON реплеев
   Tracker остатка ресов нет. Проба tools/career-mats-band-probe.js. */
/* Верхняя ступень — правка «чем больше ресов, тем больше силы»:
   полный запас (от 90% капа) даёт +1 в концовке. Это решение, не замер: в
   таблице Tracker верхняя треть одна, и внутри неё разницы не видно. */
// Нижняя ступень — ровно «мало» (ccMatsLow: меньше трети): на шкале 1500 треть
// делится без остатка, и порог сдвинут на волосок, чтобы 500 осталось внизу.
const CC_MATS_BANDS=[{from:0.9, pow:1}, {from:2/3, pow:0}, {from:1/3+1e-6, pow:-1}, {from:0, pow:-CC_MATS_PEN}];
// «Мало» — нижняя ступень; на ней задаётся вопрос про рефреш и ходит комната.
const CC_MATS_LOW=Math.round(CC_MATS_FULL/3);
function ccMatsEndPow(t){
  const f=ccMats(t)/CC_MATS_FULL;
  const b=CC_MATS_BANDS.find(x=>f>=x.from)||CC_MATS_BANDS[CC_MATS_BANDS.length-1];
  return b.pow;
}
function ccKitInit(teams){
  // Игра начинается не с полным запасом — с тем, что собрано на точке (CC_MATS_START); до фула фармят на третьей зоне.
  (teams||[]).forEach(t=>{ t._mats=CC_MATS_START; t._loot=null; t._matsPen=false; t._buildMul=1; t._healed=0; t._rot=null; t._rotMul=null; });
  CC_KIT_ZONE=0;
  /* Хотбар на карте — от прошлой игры, пока не пришёл первый кадр новой: скриншот —
     на вопросе «своя точка» полные слоты золотом, а кнопки предлагают синее, «должен улучшать
     лут, а не менять». Лут игры начинается с нуля (t._loot=null выше) — и слоты гаснут тут же. */
  try{
    const box=(typeof CC_RUN_MAP!=='undefined' && CC_RUN_MAP) ? CC_RUN_MAP.querySelector('.zr-kit') : null;
    if(box) box._parts=null;   // разметка тронута руками — следующий кадр пишет панель целиком (см. ccKitPanel)
    if(box) box.querySelectorAll('.zk-slot:not(.zk-pick)').forEach(sl=>{ sl.className='zk-slot empty'; sl.removeAttribute('title'); const a=sl.querySelector('.zk-art'); if(a) a.remove(); const e=sl.querySelector('em'); if(e) e.remove(); });
  }catch(e){}
}
/* ПАНЕЛЬ НАБОРА НА КАРТЕ — правка: «я бы хотел на симуляцию
   добавить ресурсы, лут, который есть, и сёрдж».

   Всё это уже считалось, но игрок видел ресы и лут только в подсказке к
   вопросу, а сёрдж — никогда. Теперь под шапкой карты стоит строка: здоровье
   отряда (из кадра), ресы, лут после третьей зоны и сёрдж — порог этой фазы в
   игроках, сколько в живых, и красным «под сёржем», когда движок бьёт именно
   тебя (флаг u в точке кадра, см. zone-sim applySurge).

   Ресы модель тратит кусками на остановках (ccKitSpend перед показом), а
   круги идут один за другим — поэтому на кадре они досчитываются по зоне:
   к тому, что осталось после остановки, прибавляется по кругу за каждую ещё
   не показанную зону. CC_KIT_ZONE — зона последней остановки. */
let CC_KIT_ZONE=0;
// Очки сессии своей команды на текущем кадре — пишет onZoneFrame из живого счёта.
let CC_KIT_PTS=null;
// Редкость предмета — к ключу цвета: пулы пишут её и словом Epic'а, и цветом.
function ccRarityKey(r){
  const s=String(r||'').toLowerCase();
  return ({purple:'epic', blue:'rare', green:'uncommon', grey:'common', gray:'common',
           orange:'legendary', gold:'mythic'})[s] || s.replace(/[^a-z]/g,'');
}
// Кирка на HUD — картинка, а не силуэт: The Axe of Champions 2.0 (его модель из Notion, 7.09).
/* Имя с v2: файл пересобран (снята рамка скриншота, обрезаны поля), а адрес у картинок
   не версионируется — под старым именем браузер отдал бы старую из кэша. */
const CC_PICKAXE_ART='items/item-axe-of-champions-v2.png';
// Иконки ресов — как в игре: брёвна, кирпичи, слиток.
const CC_KIT_ICON={
  // Ресы картинками из игры (вики Fortnite, Wood/Stone/Metal - Material), рисованные SVG сняты.
  wood:'<img class="cc-mat-ic" src="items/mat-wood.webp" alt="" width="24" height="24" decoding="async">',
  brick:'<img class="cc-mat-ic" src="items/mat-brick.webp" alt="" width="24" height="24" decoding="async">',
  metal:'<img class="cc-mat-ic" src="items/mat-metal.webp" alt="" width="24" height="24" decoding="async">'
};
// Постройки над биндами (ccKitPanel builds).
// Бинды построек Peterbot (prosettings.net, обновлено 12.10.2026): стена T, пол Y, лестница F, конус V. Их HUD
// показывает у всех, кроме самого игрока: у тиммейта, за которым смотришь, и у отряда в драфте.
const CC_PRO_BINDS=['T','Y','F','V'];
const CC_BIND_DEFAULT=['Q','F','V','T'];
const CC_BIND_IDS=['ccBindWall','ccBindFloor','ccBindStairs','ccBindCone'];
// Бинд — одна буква или цифра либо кнопка мыши MB3/MB4/MB5; всё прочее не бинд (стоит подсказка).
function ccBindOk(v){ v=String(v||'').trim().toUpperCase(); return /^[A-Z0-9]$|^MB[345]$/.test(v) ? v : ''; }
function ccBindsOf(p){
  // Бинды из аккаунта (fncsdraft_profile.binds) главнее бинд карьеры: работают и в старых карьерах.
  let acc=null; try{ acc=typeof ccMeProf==='function' ? ccMeProf().binds : null; }catch(e){}
  const b=(acc && acc.length) ? acc : (p && p.binds);
  return ccBindsUniq(CC_BIND_DEFAULT.map((d,k)=>ccBindOk(b && b[k]) || d));
}
function ccBindsRead(){
  return ccBindsUniq(CC_BIND_IDS.map((id,k)=>{ const el=document.getElementById(id); return ccBindOk(el && el.value) || CC_BIND_DEFAULT[k]; }));
}
// Повтор (старый сейв, подсказка совпала с введённым) — второй получает первую свободную из Q F V T.
function ccBindsUniq(keys){
  const used=new Set();
  return keys.map((v,k)=>{ if(!used.has(v)){ used.add(v); return v; }
    const d=CC_BIND_DEFAULT.concat(['E','R','G','X','Z','C']).find(x=>!used.has(x) && keys.indexOf(x)<0) || ''; used.add(d); return d; });
}
// Клавиша уже стоит на другой постройке (своя или подсказка пустой клетки).
function ccBindTaken(el, v){
  return CC_BIND_IDS.some((id,k)=>{ if(id===el.id) return false; const o=document.getElementById(id); return (ccBindOk(o && o.value) || CC_BIND_DEFAULT[k])===v; });
}
function ccBindPut(el, v){
  if(v && ccBindTaken(el, v)){ el.classList.add('bad'); clearTimeout(el._badT); el._badT=setTimeout(()=>el.classList.remove('bad'), 700); return false; }
  el.classList.remove('bad'); el.value=v; return true;
}
// Поле бинда ловит нажатие: буква/цифра встаёт целиком, Backspace/Delete очищают, Tab идёт дальше.
function ccBindKey(e, el){
  if(e.key==='Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key==='Backspace' || e.key==='Delete'){ el.value=''; e.preventDefault(); return; }
  const v=ccBindOk(e.key && e.key.length===1 ? e.key : '');
  if(v){ ccBindPut(el, v); e.preventDefault(); return; }
  // На телефоне клавиатура часто шлёт «Unidentified»: тогда разберёт ccBindInput.
  if(e.key && e.key!=='Unidentified' && e.key!=='Process') e.preventDefault();
}
function ccBindInput(el){
  const raw=String(el.value||'').toUpperCase();
  if(/^MB[345]$/.test(raw)) return;
  const ch=raw.replace(/[^A-Z0-9]/g,'').slice(-1);
  el.value='';
  if(ch) ccBindPut(el, ch);
}
// Средняя и боковые кнопки мыши: MB3, MB4, MB5. Левая — просто фокус, правая — ничего.
function ccBindMouse(e, el){
  const v=e.button===1 ? 'MB3' : e.button===3 ? 'MB4' : e.button===4 ? 'MB5' : '';
  if(v){ ccBindPut(el, v); e.preventDefault(); el.focus(); }
}
// Значки построек у полей биндов на экране создания (один раз, при первом открытии).
function ccBindsPaint(){
  ['Wall','Floor','Stairs','Cone'].forEach(n=>{ const el=document.getElementById('ccBindIco'+n); if(el && !el.firstChild) el.innerHTML=CC_KIT_BUILD_ICON[n.toLowerCase()]; });
}
const CC_KIT_BUILD_ICON={"wall":"<svg viewBox=\"0 0 24 24\"><path d=\"M15 3l4 1.3v16.4L15 20z\" fill=\"#174fa8\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M5 6.2 15 3l4 1.3-10 3.2z\" fill=\"#8cc8ff\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M5 6.2 15 3v17l-10 2z\" fill=\"#3d93f2\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M7 8.2 13 6.3\" stroke=\"rgba(255,255,255,.55)\" stroke-width=\".7\"/></svg>","floor":"<svg viewBox=\"0 0 24 24\"><path d=\"M2 12l10 5v2.6L2 14.6z\" fill=\"#1f63c8\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M22 12l-10 5v2.6l10-5z\" fill=\"#174fa8\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M2 12l10-5 10 5-10 5z\" fill=\"#3d93f2\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M6 12l6-3 6 3-6 3z\" fill=\"none\" stroke=\"rgba(255,255,255,.45)\" stroke-width=\".7\"/></svg>","stairs":"<svg viewBox=\"0 0 24 24\"><path d=\"M7 8l5-3v4l-5 3zM11 12l5-3v4l-5 3zM15 16l5-3v4l-5 3z\" fill=\"#1f63c8\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M3 8l5-3h4L7 8zM7 12l5-3h4l-5 3zM11 16l5-3h4l-5 3z\" fill=\"#8cc8ff\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M3 20V8h4v4h4v4h4v4z\" fill=\"#3d93f2\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/></svg>","cone":"<svg viewBox=\"0 0 24 24\"><path d=\"M12 3 2 15l10 5z\" fill=\"#5aaeff\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M12 3v17l10-5z\" fill=\"#1f63c8\" stroke=\"rgba(255,255,255,.9)\" stroke-width=\".8\" stroke-linejoin=\"round\"/><path d=\"M12 3v17\" stroke=\"#fff\" stroke-width=\"1\"/></svg>"};
/* Кирка в первом слоте хотбара. В карьере — из шкафчика (скрины 37–38: в шкафчике картонная, в матче была Axe of
   Champions), без надетой — дефолтная; вне карьеры (драфт про) — по-прежнему Axe of Champions 2.0. */
function ccKitAxe(){
  try{ if(typeof CAREER!=='undefined' && CAREER && CAREER.career && CAREER_RUN){
    const w=ccFnWorn('p'), it=w && CAREER.fnOwn && CAREER.fnOwn[w.id];
    return w ? {src:ccFnImg(w.id, true), n:w.name, r:(it && it.r) || 'rare'} : {src:ccFnImg('DefaultPickaxe', true), n:'Default Pickaxe', r:'common'};
  } }catch(e){}
  return {src:CC_PICKAXE_ART, n:'The Axe of Champions 2.0', r:'rare'};
}
// Значок усиления Бури как на HUD игры: скруглённый фиолетовый треугольник, внутри фигурка под молнией. Без градиентов
// с id (скрытые копии HUD ломают ссылки на id, см. иконки построек).
const CC_SURGE_TRI='<svg class="zk-tri2" viewBox="0 0 40 36" aria-hidden="true">'+
  '<path d="M17.2 3.6q2.8-4.4 5.6 0l15.4 26.6q2.4 4.6-2.8 4.6H4.6q-5.2 0-2.8-4.6z" fill="#8a35d6" stroke="#c39bff" stroke-width="1.6"/>'+
  '<path d="M21.6 6.5l-4 6.6h3l-2.2 4.6 5.4-6.4h-3.1l2.3-4.8z" fill="#fff"/>'+
  '<circle cx="20" cy="20.6" r="2.6" fill="#fff"/>'+
  '<path d="M14.3 31.5q.4-6.6 5.7-6.6t5.7 6.6z" fill="#fff"/>'+
  '<path d="M13.8 18.5l-2.4 5.2 3.2.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function ccKitPanel(lobby, frame){
  const map=CC_RUN_MAP;
  if(!map || !map.isConnected || !frame) return;
  const i=(lobby||[]).findIndex(t=>t && t.isYou);
  if(i<0) return;
  const you=lobby[i], d=(frame.dots||[])[i];
  if(!you || !d) return;
  let box=map.querySelector('.zr-kit');
  if(!box){
    box=document.createElement('div'); box.className='zr-kit'; map.appendChild(box);
    // Килфид живёт в том же углу — поднимаем его над полосками.
    const feed=map.querySelector('.zr-feed'); if(feed) feed.style.bottom='78px';
    // Счётчики шапки справа гасим: их место занимает столбик в раскладке игры.
    const head=map.querySelector('.zr-head'); if(head) head.classList.add('zr-head-quiet');
    // Вид игры у самого проигрывателя: нейм-плейты без чёрной коробки, килфид
    // строками, а не пилюлями. См. ZoneReplay.setPlain.
    if(typeof ZoneReplay!=='undefined' && ZoneReplay.setPlain) ZoneReplay.setPlain(true);
    if(feed) feed.classList.add('zr-feed-plain');
  }
  const T=L();
  /* Выбыли — с местом и тем, что игра идёт дальше (X hvkfan, Notion 23.10: «on the map when we simulate it's always
     written Eliminated»): запись игры доигрывается до конца, и голое «выбыли» висело на экране почти всю игру. */
  if(!d.alive){ const dead='<div class="zk-dead"><b>'+esc(T.ccKitOut)+(d.p ? ' · #'+d.p : '')+'</b><span>'+esc(T.ccKitWatch||'')+'</span></div>'; if(box._dead!==dead){ box.innerHTML=dead; box._dead=dead; box._parts=null; } return; }
  /* Пока на карте стоит вопрос, ресы — ровно те, по которым он задан (модель
     уже списала круги до остановки), иначе подсказка говорит «ресы 0», а
     строка внизу — 110, и это читается как две правды. */
  const asking=!!(map.querySelector('.cc-choice-map') || (CC_CHOICE_OPEN && CC_CHOICE_OPEN.isConnected && CC_CHOICE_OPEN._host===map));
  const mats=asking ? ccMats(you)
    : Math.max(0, ccMats(you)+(function(){ let s=0; for(let z=(frame.zone||0)+1; z<=CC_KIT_ZONE; z++) s+=ccMatsZoneCost(z); return s; })());
  const low=mats<CC_MATS_LOW;
  const hp=Math.max(0, Math.min(100, d.h||0));
  /* ПО РЕФЕРЕНСУ — скриншот HUD Fortnite (5.09) и слово «можешь как на референсе
     сделать». Слева щит и здоровье полосками с числами, в центре плашка сёржа с
     молнией, справа ресы тремя стопками и хотбар с пятью слотами.

     Сто очков отряда в движке — это здоровье одного игрока со щитом (см.
     zone-sim: «the squad's 100 points stand for one»). На экране они лежат как в
     игре, двумя полосками по сто: верхняя половина очков — щит, нижняя —
     здоровье. Это раскладка ОДНОГО числа, а не второй запас: щит уходит первым,
     здоровье — за ним, и сумма всегда равна тому, что считает движок. */
  /* С 5 сентября движок ведёт щит отдельно (zone-sim, CHIP_HP): его снимают
     перестрелки и возвращает круг, а здоровье — то, что снимают шторм и сёрдж.
     Полоски показывают ровно эти два числа. Кадр без щита (старая запись) —
     щит полный. */
  const shield=Math.max(0, Math.min(100, Math.round(d.sh==null ? 100 : d.sh)));
  const health=Math.round(hp);   // целым, как щит: «99.90000000166» на скрине 28.09
  /* Ресы — тоже одно число модели, разложенное на дерево, кирпич и металл в
     привычной пропорции 40/35/25; сумма стопок равна числу, которое тратит и
     пополняет модель. */
  const st=ccKitSplitMats(mats);
  const pack=you._loot ? [...(you._loot.weapons||[]), ...(you._loot.heals||[]), you._loot.move].filter(Boolean) : [];
  /* Хотбар как в игре: первый слот — кирка, дальше пять предметов, номер слота
     под ячейкой; слот носит цвет редкости предмета, пустой — пунктиром. Над
     хотбаром ряд построек Q F V T — четыре ромба, как на HUD. */
  // В слоте — картинка предмета (те же арты, что в лоадауте драфта), имя во
  // всплывающей подсказке; без картинки — имя текстом.
  const art=o=>{ let h=''; try{ h=(typeof weaponIconHTML==='function' && weaponIconHTML(o, ccLootSet()))||''; }catch(e){ h=''; }
    return h ? '<span class="zk-art">'+h+'</span>' : '<em>'+esc(o.name)+'</em>'; };
  /* Кирка — The Axe of Champions 2.0, награда чемпиона FNCS (его картинка в Notion,
     7 сентября: «модельку кирки»). Редкость rare — слот синий, как в игре;
     файл items/item-axe-of-champions-v2.png вырезан со скрина, фон в прозрачность,
     тёмная рамка окна с краёв стёрта заливкой, поля обрезаны (его «что за чёрная
     чёрточка», 11 сентября: рамка, увеличенная поворотом, шла через весь слот). */
  /* В карьере — кирка из шкафчика (скрины 37–38: в шкафчике картонная, в матче была Axe of Champions), без неё — дефолтная. */
  const axe=ccKitAxe();
  const slots='<span class="zk-slot zk-pick r-'+ccRarityKey(axe.r)+'" data-cap="'+esc(T.ccKitPickaxe)+'" title="'+esc(T.ccKitPickaxe)+' · '+esc(axe.n)+'"><span class="zk-art zk-pickaxe"><img alt="" src="'+esc(axe.src)+'" onerror="this.remove()"></span><u>1</u></span>'+
    [0,1,2,3,4].map(k=>{
      const o=pack[k];
      const r=o && o.rarity ? ' r-'+ccRarityKey(o.rarity) : '';
      return '<span class="zk-slot'+(o?r:' empty')+'"'+(o?' title="'+esc(o.name)+'"':'')+'>'+(o?art(o):'')+'<u>'+(k+2)+'</u></span>';
    }).join('');
  /* Сёрдж — как на HUD самой игры (скриншот): баннер «STORM SURGE
     ACTIVE!» с треугольником-молнией сверху по центру и справа крупное число
     «N ABOVE DAMAGE THRESHOLD» — на сколько урона ты над линией отсечки (n точки
     минус surgeLine кадра). Под сёржем баннер и число краснеют, подпись — «до
     порога». Пока сёрдж никого не бьёт, на экране НИЧЕГО — так и в игре (скриншот высадки, 5.09: ни порога, ни предупреждения). */
  const active = frame.surgeAt>0 && frame.surgeLine!=null;
  /* ПРЕДУПРЕЖДЕНИЕ — как в игре (скриншоты с финала дивизиона 1:
     «STORM SURGE WARNING! DAMAGE ENEMIES TO AVOID ELIMINATION!» при 46 живых
     и «149 ABOVE DAMAGE THRESHOLD» рядом). Сёрдж ещё никого не бьёт, но живых
     больше порога СЛЕДУЮЩЕГО круга — значит, с новым кругом он включится, и
     игра уже показывает, где ты относительно будущей линии. Линия считается
     тем же правилом, что в движке (applySurge): отсечь столько нижних по
     чистому урону, на сколько живых больше порога. Reload сёрджа не знает. */
  const reload=/^r\d$/.test(String(typeof ACTIVE_LANDING_SET!=='undefined' ? ACTIVE_LANDING_SET : ''));
  const nextPh=(!active && !reload && typeof ZoneSim!=='undefined' && ZoneSim.PHASES) ? (CC_GAME_PHASES||ZoneSim.PHASES)[frame.zone] : null;
  const nextAt=nextPh && isFinite(nextPh.surgeAt) ? nextPh.surgeAt : 0;
  // На первом круге предупреждения нет — скриншот высадки 5.09: ни порога, ни баннера.
  const warn=!active && frame.zone>=2 && nextAt>0 && frame.players!=null && frame.players>nextAt;
  let line=active ? frame.surgeLine : null;
  if(warn){
    const alive=(frame.dots||[]).filter(x=>x && x.alive);
    const per=alive.length ? Math.max(1, frame.players/alive.length) : 1;
    const nets=alive.map(x=>Number(x.n)||0).sort((a,b)=>a-b);
    const k=Math.min(nets.length-1, Math.ceil((frame.players-nextAt)/per));
    line=nets.length ? nets[k] : null;
  }
  const gap=(line!=null) ? (Number(d.n)||0)-line : 0;
  const below=active ? !!d.u : (line!=null && gap<0);
  const tri='<i class="zk-tri"></i>';
  /* И порог заранее — вопрос «а на экране у игрока есть
     сёрдж?»: пока сёрдж никого не бьёт, но фаза его уже знает, стоит тихая
     строка «сёрдж с 60 · в игре 76», как между зонами на турнирном HUD. */
  /* 30.10, его скрин из игры (Notion 27.10, последний): русский HUD пишет «МИНИМАЛЬНЫЙ УРОН» и под ним число со знаком
     (−28), значок — скруглённый фиолетовый треугольник. Где у языка есть ccKitCapLbl — так; иначе английское «N ABOVE…». */
  const gapN=Math.round(gap);
  const thresh=(line!=null)
    ? (T.ccKitCapLbl
        ? '<div class="zk-thresh zk-thresh-g'+(below?' on':' ok')+'">'+CC_SURGE_TRI+'<div><span>'+esc(T.ccKitCapLbl)+'</span><b>'+(gapN<0 ? '-' : '+')+ccNum(Math.abs(gapN))+'</b></div></div>'
        : '<div class="zk-thresh'+(below?' on':' ok')+'">'+tri+'<div><b>'+ccNum(Math.abs(gapN))+'</b><span>'+esc(below ? T.ccKitBelowCap : T.ccKitAboveCap)+'</span></div></div>')
    : '';
  const surge = active
    ? '<div class="zk-banner'+(d.u?' on':'')+'">'+tri+'<b>'+esc(d.u ? T.ccKitUnderBanner : T.ccKitSurgeBanner)+'</b></div>'+thresh
    : warn
      ? '<div class="zk-banner warn">'+tri+'<b>'+esc(T.ccKitSurgeWarn)+'</b><i class="zk-sub">'+esc(T.ccKitSurgeWarnSub)+'</i></div>'+thresh
      /* isFinite: у Reload порог фазы — Infinity (сёрджа нет), а строка
         писала «сёрдж с Infinity» весь вечер (тестер, 16.09). */
      : (frame.surgeAt>0 && isFinite(frame.surgeAt)
          ? '<div class="zk-surgeat">'+esc(T.ccKitSurgeAt(frame.surgeAt, frame.players!=null ? frame.players : ''))+'</div>'
          : '');
  // Золотой шестиугольник у полосок — очки сессии («поинты» турнирного HUD):
  // этап плюс текущая игра, из живого счёта таблицы (CC_KIT_PTS), иначе этап.
  const level=CC_KIT_PTS!=null ? CC_KIT_PTS : Math.round(you.stagePts||0);
  /* Верхний правый столбик игры: элиминации, живые игроки, время фазы. Своя
     шапка проигрывателя («ЗОНА N · время» слева) остаётся, её правые счётчики
     гаснут (.zr-head-quiet). Напарники — строкой над полосками, как в игре
     нейм-плейт тиммейта с полосой здоровья; здоровье у отряда одно на всех. */
  const sec=Math.max(0, frame.secondsLeft||0);
  const clock=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
  const meKey=(typeof hKey==='function' && CAREER && CAREER.player) ? hKey(careerCard()||CAREER.player.nick) : '';
  /* Игроки отряда умирают и по одному (zone-sim MEMBER_LOSS, 29.10: «тимейты вообще не умирают либо сам игрок»).
     d.m — кто жив по порядку you.squad (нет — все живы). Живой тиммейт: щит и здоровье отряда (они в движке общие),
     выбитый — серой строкой «выбит». Выбит ты, а отряд жив — смотришь за тиммейтом, как в игре. */
  const sqList=you.squad||[], aliveM=k=>!d.m || !!d.m[k];
  const meIdx=sqList.findIndex(c=>c && c.handle && meKey && hKey(c.handle)===meKey);
  const meDead=meIdx>=0 && !aliveM(meIdx);
  const mateIdx=sqList.map((c,k)=>k).filter(k=>sqList[k] && sqList[k].handle && k!==meIdx).slice(0, 2);
  const mates=mateIdx.map(k=>sqList[k].handle);
  const specOn=meDead ? mateIdx.find(k=>aliveM(k)) : undefined;
  // Свои полоски — своего игрока (zone-sim memberVitals); выбит — того, за кем смотришь. Нет данных — общие отряда.
  // Бинды над хотбаром: свои, пока на HUD ты сам; за тиммейтом и за чужим отрядом — Peterbot (CC_PRO_BINDS).
  const bindKeys=(!meDead && meIdx>=0) ? ccBindsOf(CAREER && CAREER.player) : CC_PRO_BINDS;
  const ownK=meDead ? specOn : meIdx, shMe=(d.ms && ownK!=null && ownK>=0) ? d.ms[ownK] : shield, hpMe=(d.mh && ownK!=null && ownK>=0) ? Math.max(1, d.mh[ownK]) : health;
  const mateRows=(specOn!=null ? '<div class="zk-spec"><b>'+esc(T.ccKitSpec ? T.ccKitSpec(sqList[specOn].handle) : sqList[specOn].handle)+'</b></div>' : '')+
    mateIdx.map(k=>aliveM(k)
      ? '<div class="zk-mate"><b>'+esc(sqList[k].handle)+'</b><i class="zk-msh"><span style="width:'+(d.ms ? d.ms[k] : shield)+'%"></span></i><i><span style="width:'+(d.mh ? d.mh[k] : hp)+'%"></span></i></div>'
      : '<div class="zk-mate zk-mate-out"><b>'+esc(sqList[k].handle)+' · '+esc((d.mc && d.mc[k]>0 && T.ccKitMateCard) ? T.ccKitMateCard(d.mc[k]) : (T.ccKitMateOut||''))+'</b><i><span style="width:0"></span></i></div>').join('');
  /* Компас сверху по центру, как в игре: курс отряда в градусах (0 — север) и
     стороны света вокруг. Курс — из направления стрелки на кадре (d.a, градусы
     математические, 0 — восток). */
  const headDeg=((90-(Number(d.a)||0))%360+360)%360;
  const compass=(()=>{
    const W=300, span=120;  // видимый сектор ±60°
    const px=deg=>W/2+((((deg-headDeg)+540)%360)-180)*(W/span);
    const cards=[[0,'N'],[45,'NE'],[90,'E'],[135,'SE'],[180,'S'],[225,'SW'],[270,'W'],[315,'NW']];
    let h='';
    for(let g=0; g<360; g+=15){
      const x=px(g); if(x<-10||x>W+10) continue;
      const card=cards.find(c=>c[0]===g);
      if(card) h+='<span class="card" style="left:'+x.toFixed(1)+'px">'+card[1]+'</span>';
      else if(g%30===0) h+='<span style="left:'+x.toFixed(1)+'px">'+g+'</span>';
      else h+='<i class="zk-tick" style="left:'+x.toFixed(1)+'px"></i>';
    }
    return '<div class="zk-compass">'+h+'<b class="zk-heading">'+Math.round(headDeg)+'</b></div>';
  })();
  const parts=[
    compass,
    '<div class="zk-top">'+
      /* СВОИ КИЛЛЫ НАД ОТРЯДНЫМИ — отзыв: «выше килы мои ниже на команду», и его же
         референс, турнирный HUD Фортнайта: столбиком, число слева, значок справа. Столбик
         худа игры показывал только счёт ОТРЯДА (d.e): своих элиминаций в нём не было вовсе,
         а чип в шапке проигрывателя здесь погашен (.zr-head-quiet) — отсюда «до сих пор нет
         в худе». Соло — строка одна, отряд это ты. */
      (function(){
        const team=d.e||0, mineK=ccYouKills(you, team);
        return (mineK==null ? '' : '<div class="zk-top-row"><b>'+mineK+'</b><i class="zk-ico-skull"></i></div>')+
          '<div class="zk-top-row'+(mineK==null ? '' : ' zk-team')+'"><b>'+team+'</b><i class="'+(mineK==null ? 'zk-ico-skull' : 'zk-ico-squad')+'"></i></div>';
      })()+
      '<div class="zk-top-row"><b>'+(frame.players!=null?frame.players:frame.alive||0)+'</b><i class="zk-ico-man"></i></div>'+
      '<div class="zk-top-row"><b>'+clock+'</b><i class="zk-ico-clock"></i></div>'+
    '</div>'+
    '<div class="zk-vitals" data-hp="'+hp+'" data-shield="'+shMe+'" data-health="'+hpMe+'">'+
      mateRows+
      '<div class="zk-bars">'+
        '<div class="zk-row"><i class="zk-ico zk-ico-shield"></i><div class="zk-bar zk-shield"><i style="width:'+shMe+'%"></i></div><b>'+shMe+'</b></div>'+
        '<div class="zk-row"><i class="zk-ico zk-ico-plus">+</i><div class="zk-bar zk-health"><i style="width:'+hpMe+'%"></i></div><b>'+hpMe+'</b></div>'+
      '</div>'+
      '<span class="zk-pts">'+level+'</span>'+
    '</div>',
    surge,
    '<div class="zk-right">'+
      (CC_ZB ? '<div class="zk-mats zk-zb" title="Zero Build"><b>Zero Build</b></div>' :
      '<div class="zk-mats'+(low?' low':'')+'" data-total="'+mats+'" title="'+esc(T.ccKitMats(mats))+(low?' · '+esc(T.ccKitLow):'')+'">'+
        '<span class="m-wood">'+CC_KIT_ICON.wood+'<b>'+st[0]+'</b></span>'+
        '<span class="m-brick">'+CC_KIT_ICON.brick+'<b>'+st[1]+'</b></span>'+
        '<span class="m-metal">'+CC_KIT_ICON.metal+'<b>'+st[2]+'</b></span>'+
      '</div>')+
      '<div class="zk-builds">'+['wall','floor','stairs','cone'].map((p,k)=>'<span><i>'+CC_KIT_BUILD_ICON[p]+'</i><u>'+esc(bindKeys[k])+'</u></span>').join('')+'</div>'+
      '<div class="zk-hotbar"'+(pack.length?'':' title="'+esc(T.ccKitLootNone)+'"')+'>'+slots+'</div>'+
    '</div>'];
  /* ПО ЧАСТЯМ И ТОЛЬКО ИЗМЕНИВШЕЕСЯ (его слово 20.10: «симуляция карты подлагивает»). Панель целиком писалась разметкой
     на каждом кадре — компас, полоски, ресы и хотбар с картинками заново — и это был главный пересчёт стилей показа
     (профиль под эмуляцией телефона). Теперь пять частей в обёртках display:contents (раскладка та же: селекторы
     .zr-kit .zk-…), и пишется только та, у которой поменялась строка. */
  box._dead=null;
  if(!box._parts || box.children.length!==parts.length){
    box.innerHTML=parts.map(x=>'<div style="display:contents">'+x+'</div>').join(''); box._parts=parts.slice();
  } else {
    for(let k=0;k<parts.length;k++) if(parts[k]!==box._parts[k]){ box.children[k].innerHTML=parts[k]; box._parts[k]=parts[k]; }
  }
  /* Килфид над тиммейтами (Notion 27.10 скрин 26: «выше сделать килфид, чтоб хп и броню было видно тимейтов»):
     78px — над своими полосками, плюс строка на каждого напарника (имя 11px + полоса 5px + отступы, .zk-mate).
     По числу напарников, а не замером: offsetHeight на каждом кадре — пересчёт раскладки. */
  const feed=map.querySelector('.zr-feed'), fb=78+mateIdx.reduce((s,k)=>s+(aliveM(k) ? 31 : 26), 0)+(specOn!=null ? 22 : 0);   // живой тиммейт с полосой щита — 31, выбитый — 26
  if(feed && feed._fb!==fb){ feed.style.bottom=fb+'px'; feed._fb=fb; }
}
// Одно число ресов — тремя стопками, как на HUD: 40% дерево, 35% кирпич, остаток металл.
// Три стопки на HUD — дерево, кирпич, металл, каждая не выше капа игры (500):
// излишек одной стопки перетекает в следующую.
function ccKitSplitMats(m){
  const t=Math.max(0, Math.round(m||0)), cap=CC_MATS_CAP_EACH;
  let w=Math.round(t*0.4), b=Math.round(t*0.35), mt=Math.max(0, t-w-b);
  if(w>cap){ b+=w-cap; w=cap; }
  if(b>cap){ mt+=b-cap; b=cap; }
  if(mt>cap){ mt=cap; }
  return [w, b, mt];
}
// Круг прошёл — ресы потрачены. Считается всем, включая комнату.
function ccKitSpend(teams, n){
  // Стиль стройки своей команды (ccAskBuild): экономно — круг дешевле, много —
  // дороже. У комнаты множителя нет, она строит как строила.
  // Множитель ротации (ccAskRot, CC_ROT_MATS) — на один круг, потом сгорает.
  (teams||[]).forEach(t=>{ t._mats=Math.max(0, (t._mats!=null?t._mats:CC_MATS_FULL)-Math.round(n*(t._buildMul||1)*(t._rotMul||1))); t._rotMul=null; });
}
function ccMats(t){ return t && t._mats!=null ? t._mats : CC_MATS_FULL; }
function ccMatsLow(t){ return ccMats(t)<CC_MATS_LOW; }
function ccMatsFill(t){ if(t) t._mats=CC_MATS_FULL; }
/* Строка «что у меня есть» — игрок и читает, решая. Ресы числом, лут —
   тем самым паком, который он взял на третьей зоне (ccAskLoot кладёт его в
   t._loot), иначе там просто «подобранное». */
function ccKitLine(t){
  if(!t) return '';
  const mats=ccMats(t);
  const loot=t._loot ? [...(t._loot.weapons||[]), ...(t._loot.heals||[])].slice(0,3)
                        .map(o=>o&&o.name).filter(Boolean).join(' · ') : '';
  if(CC_ZB) return 'Zero Build'+(loot ? ' · '+loot : '');   // ресов нет — только лут
  return L().ccKitLine(mats, ccMatsLow(t) ? L().ccKitLow : '', loot);
}
// Цена концовки по остатку ресов (CC_MATS_BANDS) — одинаково игроку и
// комнате, один раз.
function ccMatsPenalty(teams){
  (teams||[]).forEach(t=>{
    if(t._matsPen) return;
    t._matsPen=true;
    const p=ccMatsEndPow(t);
    if(p) ccAddGamePow(t, p);
  });
}
const CC_GAME_STOPS=[
  // Первая: точка — сундуки, а на занятой точке стычка или уход (ccAskSite).
  {zone:1, ask:(you, ui)=>ccAskSite(you, ui), room:ccRoomSite},
  // Третья зона: фарм сам (ccAutoFarm), лут уже собран на точке. Окна нет.
  {zone:3, ask:async (you, ui)=>{ if(!CC_ZB) await ccAutoFarm(you, ui); },
   room:(field, you)=>{ ccRoomLoot(field, you); if(!CC_ZB) ccRoomFarm(field, you); }},
  // Четвёртая: окно ротации (когда выходим, точка, тактика встреч). Комната ходит по навыку в движке.
  {zone:4, ask:(you, ui)=>ccAskRotWindow(you, ui)},
  // Пятая и седьмая: середина сама (ccAutoMid): ресы при нехватке, третья сторона при «пушить», сёрдж, хилки.
  {zone:5, ask:(you, ui)=>ccAutoMid(you, ui), room:(field, you)=>{ if(!CC_ZB) ccRoomMats(field, you); ccRoomHeal(field, you); }},
  {zone:7, ask:(you, ui)=>ccAutoMid(you, ui), room:(field, you)=>{ if(!CC_ZB) ccRoomMats(field, you); ccRoomHeal(field, you); }},
  {zone:8, ask:(you, ui)=>ccAskLate(you, ui), room:ccRoomLate},
  // Концовка: двигающиеся круги и последние отряды (ccEndZones). Комнату ведёт движок, как и раньше.
  {get zone(){ return ccEndZones().move; }, ask:(you, ui)=>ccAskMoving(you, ui)},
  {get zone(){ return ccEndZones().last; }, ask:(you, ui)=>ccAskLast(you, ui)}
];
/* РЫЧАГИ ИГРОКУ — отзыв: «хп не меняется, билды тоже не понятно
   от чего зависит, нужно дать контроль игроку».

   СТРОЙКА. Ресы уходили по 110 за круг у всех одинаково, и решать было нечего.
   На третьей зоне, сразу за лутом, команда выбирает, как строит остаток игры:
   экономно (круг стоит 60% — ресов хватит до конца, но без построек ты слабее,
   −1 к силе), как обычно, или много (круг стоит 150% — +1 к силе, но к восьмой
   зоне без рефреша останешься пустым). Первый вариант — обычный: под скипом и
   в симуляции он и выбирается, то есть баланс не сдвинут ни на очко.

   ЛЕЧЕНИЕ. Щит снимают перестрелки (zone-sim, CHIP_HP), здоровье — шторм и сёрдж.
   Вопроса «пить или нет» здесь больше нет — отряд пьёт сам из своего пака, как только
   щит или здоровье просели ниже CC_HEAL_AT, и тратит на это предметы и время
   (ccHealAuto, числа из CC_HEAL_KIT по вики). Комната пьёт по тому же правилу. */
// CC_BUILD_STYLE, не CC_BUILD: тем именем занята метка сборки страницы.
const CC_BUILD_STYLE={eco:{mul:0.6, pow:-1}, norm:{mul:1, pow:0}, heavy:{mul:1.5, pow:1}};
/* Хилки стаками и пьются сами: упал щит, выпил, потратил предмет и время. Раньше был один предмет и вопрос
   «пить или нет» с выдуманными +30.
   Числа с вики (tools/build-heal-stacks.js): max_stack, heals, time_of_use, без подгонки. Цена только время:
   CC_HEAL_SECS_POW секунд = единица силы (5 с большого зелья = 1).
   Куда льётся тоже с вики: 'shield' (зелья, щитовая рыба), 'hp' (аптечка, бинты, флоппер), 'both' (сплэши,
   слёрп-рыба). Большое зелье не лечит HP, аптечка не даёт щит. */
const CC_HEAL_KIT={
  "Bandage":{stack:15, heal:15, kind:'hp', secs:3.5},
  "Chug Splash":{stack:6, heal:20, kind:'both', secs:1},
  "Slap Juice":{stack:3, heal:75, kind:'hp', secs:15},
  "Slap Berry":{stack:6, heal:20, kind:'hp', secs:2},
  "Slap Splash":{stack:4, heal:20, kind:'both', secs:1},
  "FlowBerry Fizz":{stack:3, heal:100, kind:'shield', secs:30},
  "Med-Mist Smoke Grenade":{stack:2, heal:100, kind:'hp', secs:12},
  "Shield Keg":{stack:1, heal:100, kind:'shield', secs:8},
  "Chug Cannon":{stack:1, heal:20, kind:'both', secs:1},
  "Bandage Bazooka":{stack:1, heal:15, kind:'hp', secs:2},
  "Slapperoni Slice":{stack:3, heal:20, kind:'hp', secs:1},
  "Spicy Slapperoni Slice":{stack:5, heal:20, kind:'hp', secs:1},
  "Pizza Party":{stack:1, heal:70, kind:'hp', secs:1},
  "Pizza Slice":{stack:4, heal:20, kind:'hp', secs:1},
  // В лут-пуле то же имя во множественном (itm-pizza-slices): без него падало в CC_HEAL_ANY «по одной в слоте».
  "Pizza Slices":{stack:4, heal:20, kind:'hp', secs:1},
  "Chug Jug":{stack:1, heal:100, kind:'hp', secs:15},
  "Flopper":{stack:4, heal:40, kind:'hp', secs:1},
  "Gold Splash":{stack:6, heal:20, kind:'both', secs:1},
  "Guzzle Juice":{stack:2, heal:100, kind:'hp', secs:2},
  "Jellyfish":{stack:3, heal:20, kind:'both', secs:1},
  "Med Kit":{stack:3, heal:100, kind:'hp', secs:10},
  "Midas Flopper":{stack:2, heal:40, kind:'hp', secs:1},
  "Shield Fish":{stack:3, heal:40, kind:'shield', secs:1},
  "Shield Potion":{stack:3, heal:50, kind:'shield', secs:5},
  // Коробка не стакается (в инфобоксе вики 3, в её же блоке Stats 1; в игре коробка одна), стакаются только кусочки.
  "Slapperoni Pizza":{stack:1, heal:70, kind:'hp', secs:1},
  "Slurpfish":{stack:3, heal:40, kind:'both', secs:1},
  "Small Fry":{stack:6, heal:25, kind:'hp', secs:1},
  "Small Shield Potion":{stack:6, heal:25, kind:'shield', secs:2},
  "Spicy Fish":{stack:1, heal:15, kind:'hp', secs:1},
  "Spicy Taco":{stack:1, heal:10, kind:'hp', secs:1}
};
// Хилка, которой нет в листе вики, ведёт себя как маленькое зелье — по одной в слоте.
const CC_HEAL_ANY={stack:1, heal:25, kind:'both', secs:2};
const ccHealOf=o=>(o && CC_HEAL_KIT[o.name]) || CC_HEAL_ANY;
const CC_HEAL_AT=60, CC_HEAL_SECS_POW=5;
function ccShieldOf(t){ return t && t._sq && t._sq.shield!=null ? t._sq.shield : 100; }
function ccHpOf(t){ return t && t._sq && t._sq.hp!=null ? t._sq.hp : 100; }
function ccHealNeeded(t){ return ccShieldOf(t)<CC_HEAL_AT || ccHpOf(t)<CC_HEAL_AT; }
function ccMidQuiet(t){ return !ccMatsLow(t); }
// Сколько хилок осталось в паке — сумма стаков.
function ccHealLeft(t){
  return ((t && t._loot && t._loot.heals)||[]).reduce((a,h)=>a+(h && h.n!=null ? h.n : (h?1:0)), 0);
}
/* Отряд пьёт сам, пока не долечится или пока хилки не кончатся.

   Порядок как у людей: сперва то, что закрывает нехватку целиком и за меньшее время
   (щит — зельями, здоровье — аптечкой), мелочь идёт следом. Каждая выпитая штука
   уходит из стака, а время складывается и превращается в цену силы. Никаких «+30 из
   воздуха»: сколько предмет даёт по вики, столько и вернулось. */
function ccHealAuto(t){
  if(!t || !ccHealNeeded(t)) return null;
  const sq=t._sq, pack=t._loot;
  if(!sq || !pack || !pack.heals || !pack.heals.length) return null;
  const drunk={}; let secs=0, used=0;
  for(let guard=0; guard<40 && ccHealNeeded(t); guard++){
    const shNeed=100-(sq.shield==null?100:sq.shield), hpNeed=100-(sq.hp==null?100:sq.hp);
    // Берётся то, что лечит НУЖНОЕ: зелье не чинит здоровье, аптечка не даёт щита.
    // Внутри годного — самое крупное, что не переливается зря, иначе самое быстрое.
    const have=pack.heals.filter(h=>{
      if(!h || (h.n!=null && h.n<=0)) return false;
      const k=ccHealOf(h);
      return (k.kind==='shield' && shNeed>0) || (k.kind==='hp' && hpNeed>0) || (k.kind==='both' && (shNeed>0||hpNeed>0));
    });
    if(!have.length) break;
    const room=h=>{ const k=ccHealOf(h); return k.kind==='hp' ? hpNeed : k.kind==='shield' ? shNeed : Math.max(shNeed, hpNeed); };
    const fit=have.filter(h=>ccHealOf(h).heal<=room(h)+10);
    const pick=(fit.length ? fit : have).sort((a,b)=>{
      const A=ccHealOf(a), B=ccHealOf(b);
      return (B.heal-A.heal) || (A.secs-B.secs);
    })[0];
    const k=ccHealOf(pick);
    let left=k.heal;
    // Щит наливается первым у всего, что умеет и то, и другое: под огнём он важнее.
    if(k.kind!=='hp' && sq.shield!=null && sq.shield<100){ const add=Math.min(left, 100-sq.shield); sq.shield+=add; left-=add; }
    if(left>0 && k.kind!=='shield' && sq.hp!=null && sq.hp<100){ sq.hp=Math.min(100, sq.hp+left); }
    if(pick.n!=null) pick.n--; else pick.n=0;
    drunk[pick.name]=(drunk[pick.name]||0)+1;
    secs+=k.secs; used++;
    if(pick.n<=0) pack.heals=pack.heals.filter(h=>h!==pick);
  }
  if(!used) return null;
  if(pack.heals.length<2) ccPackFloor(pack, null, null);   // допитое место — полом, слот не пустует
  const pow=Math.round(secs/CC_HEAL_SECS_POW);
  if(pow) ccAddGamePow(t, -pow);
  t._healed=(t._healed||0)+used;
  return {shield:Math.round(sq.shield==null?100:sq.shield), hp:Math.round(sq.hp==null?100:sq.hp),
          used:used, secs:secs, pow:pow, left:ccHealLeft(t),
          what:Object.keys(drunk).map(n=>n+(drunk[n]>1?' ×'+drunk[n]:'')).join(' · ')};
}
// Комната пьёт по тому же правилу и из своих паков — иначе лечился бы только игрок.
function ccRoomHeal(field, you){
  (field||[]).forEach(t=>{ if(!you || (t!==you && !t.isMate && !t.isRival)) ccHealAuto(t); });
}
async function ccAskBuild(you, ui){
  if(!you) return;
  ccMpMark('b0'+(you.mpTag||''));
  const pickId=(await ccMpChoose('build'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(L().ccBuildTitle, ccKitLine(you), [
      {id:'norm',  title:L().ccBuildNorm,  note:L().ccBuildNormNote(CC_MATS_ZONE), icon:ccMatsIconHTML(), icoCls:'wide'},
      {id:'eco',   title:L().ccBuildEco,   note:L().ccBuildEcoNote(Math.round(CC_MATS_ZONE*CC_BUILD_STYLE.eco.mul), -CC_BUILD_STYLE.eco.pow), icon:CC_KIT_ICON.wood},
      {id:'heavy', title:L().ccBuildHeavy, note:L().ccBuildHeavyNote(Math.round(CC_MATS_ZONE*CC_BUILD_STYLE.heavy.mul), CC_BUILD_STYLE.heavy.pow), icon:ccMatsPileHTML(), icoCls:'pile'}
    ], ui && ui.map, null, 'build')).id;
  }, function(v){ return L()['ccBuild'+(v==='eco'?'Eco':v==='heavy'?'Heavy':'Norm')]; })).v;
  ccMpMark('a3b:'+pickId);
  const b=CC_BUILD_STYLE[pickId]||CC_BUILD_STYLE.norm;
  you._buildMul=b.mul;
  if(b.pow) ccAddGamePow(you, b.pow);
  if(pickId!=='norm'){
    const line=L().ccBuildSet(L()['ccBuild'+(pickId==='eco'?'Eco':'Heavy')], b.pow>0?'+'+b.pow:String(b.pow));
    if(ui && ui.note) ui.note(line);
    await ccChoiceResult(ui && ui.map, line, null);
  }
}
/* Ротация, вопрос четвёртой зоны.
   Замер по реплеям трёх игр финала Major 2 EU (сессии 00743564, 24c56dba, 916190f5); выход = отряд
   ушёл дальше 3000 юнитов от точки, где встретил круг; дожил = жив на старте зоны через одну.
     зоны 3–7, 417 отрядо-зон: сразу 81% (дожили 82%), со штормом 12% (77%), позже 3% (100%, 11 случаев),
     не вышли 5% (0%). Зоны 8+: сразу 63% (70 случаев), со штормом 49% (87).
   Считать по выходу, не по входу: по входу «поздние» дают 100% из-за смещения выжившими.
   Ответ пишется в you._rot, runPhase (zone-sim.js) берёт время выхода и скорость, исход решает движок.
   Мувмент берётся из пака третьей зоны и сгорает за один круг. */
const CC_ROT_REAL={early:{share:81, surv:82}, with:{share:12, surv:77}, late:{share:3, surv:100}};
/* Цена ротации в ресах — его пункт 4 со страницы «simulation» (7.09): «вариация
   как заротейтится игроку, сколько ресов там потратит». Множитель к стройке за
   круг после четвёртой зоны (CC_MATS_ZONE): сразу — как обычно; со штормом —
   больше, идёшь под огнём и строишься на ходу; последними — больше всех,
   туннель через тех, кто уже сел; на мувменте — почти ничего, перелёт.
   Это решение, не замер: в JSON реплеев Tracker'а есть подборы ресов, но не
   траты (см. память). Один круг, множитель сгорает в ccKitSpend. */
const CC_ROT_MATS={early:1, with:1.4, late:1.8, move:0.4};
/* Что ждущий успевает нафармить, пока круг идёт: со штормом — полкруга, последними —
   круг; сразу и на мувменте — ничего. Тестер, 16.09: «не понятно, почему нужно
   выбирать что-то кроме мувмента, ведь он меньше всего ресов тратит, а бонусов
   другие не дают». Теперь у каждого выхода своя цена: сразу — дороже всех по
   ресам, зато выживаемость по реплеям выше; со штормом и последними — ресов в
   итоге меньше уходит, но дожить труднее; мувмент — почти без ресов, но предмет
   сгорает, и концовка без мувмента стоит CC_ROT_MOVE_POW силы (та же цена, что у
   пака без мувмента в ccPackPow). Решение, не замер. */
const CC_ROT_FARM={early:0, with:Math.round(CC_MATS_ZONE/2), late:CC_MATS_ZONE, move:0};
const CC_ROT_MOVE_POW=1;
// Ресы за круг при таком выходе — с учётом стиля стройки (ccAskFarm/ccAskBuild).
function ccRotMats(id, t){ return Math.round(CC_MATS_ZONE*(CC_ROT_MATS[id]||1)*((t && t._buildMul)||1)); }
/* ПУТЬ РОТАЦИИ НА КАРТЕ (выбор 5, 13.11; 14.11 план 125: точка кликом). После «когда выходим» — куда идём: тап по карте
   ставит точку в следующем круге (не дальше CC_PATH_IN его радиуса), отряд идёт к ней прямо, на карте видно, кто где стоит
   (живые отряды движка, game.squads). Отряд «на пути», если он ближе CC_PATH_CORR единиц мира к линии; встреча с вероятностью
   1−(1−CC_PATH_MEET)^k, не выше CC_PATH_MAX. Встреча — файт середины с ближайшим (тактика ccAskTactic, ccFightApply). Путь
   длиннее прямого к ближней стороне больше чем на CC_PATH_LONG — CC_PATH_MATS ресов на стройку. Точка уходит в движок
   (team._pos {x,y,cx,cy}, zone-sim chooseTarget): в этом круге отряд встаёт там. Числа — решение, не замер. Только одиночная
   игра без пропуска (ccLootRoomOn): в онлайне и под симуляцией вопроса нет, как и встречи, — баланс там прежний. */
const CC_PATH_CORR=7, CC_PATH_MEET=0.22, CC_PATH_MAX=0.75, CC_PATH_MATS=90, CC_PATH_IN=0.9, CC_PATH_LONG=1.15;
function ccPathPlan(you){
  const game=you && you._game, sq=you && you._sq;
  if(!game || !game.squads || !sq || !sq.alive || !game.frames) return null;
  // Круг, в который движок пойдёт дальше (upcoming). f.next последнего кадра — круг, в котором уже стоим.
  const fr=game.frames(), f=fr && fr[fr.length-1];
  const c=(game.upcoming && game.upcoming()) || (f && (f.next || f.circle));
  if(!c) return null;
  const me={x:sq.x, y:sq.y}, dx=c.cx-me.x, dy=c.cy-me.y, d=Math.hypot(dx, dy);
  if(!(d>c.radius*0.85)) return null;   // уже внутри следующего круга — идти некуда
  // Точка по умолчанию: на 0.6 радиуса от центра, со стороны отряда.
  const to={x:c.cx-dx/d*c.radius*0.6, y:c.cy-dy/d*c.radius*0.6};
  const base=Math.hypot(to.x-me.x, to.y-me.y);
  const foes=game.squads.filter(s=>s.alive && s!==sq && s.team!==you && !s.team.isMate);
  // Путь к точке pt: точка зажата в круг, линия прямая, отряды у линии, шанс встречи, ресы за длинный путь.
  const at=pt=>{
    let x=pt.x, y=pt.y;
    const ox=x-c.cx, oy=y-c.cy, od=Math.hypot(ox, oy), R=c.radius*CC_PATH_IN;
    if(od>R){ x=c.cx+ox/od*R; y=c.cy+oy/od*R; }
    const pts=[]; for(let i=0;i<=24;i++){ const t=i/24; pts.push({x:me.x+(x-me.x)*t, y:me.y+(y-me.y)*t}); }
    const on=foes.map(s=>({s, d:Math.min(...pts.map(p=>Math.hypot(p.x-s.x, p.y-s.y)))})).filter(o=>o.d<CC_PATH_CORR).sort((a,b)=>a.d-b.d);
    const p=Math.min(CC_PATH_MAX, 1-Math.pow(1-CC_PATH_MEET, on.length));
    const len=Math.hypot(x-me.x, y-me.y);
    return {pt:{x, y}, pts, on, p, len, mats:len>base*CC_PATH_LONG ? CC_PATH_MATS : 0};
  };
  return {me, to, c, foes, at, def:at(to)};
}
function ccPathLineAttr(path){ return path.pts.map(q=>q.x.toFixed(2)+','+q.y.toFixed(2)).join(' '); }
function ccPathMapHTML(plan){
  const key=(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '', art=MAP_ART[key];
  if(!art) return '';
  const asp=MAP_ASPECT[key]||'1100/970', ar=String(asp).split('/'), k=(Number(ar[1])||1)/(Number(ar[0])||1);
  // Рамка: отряд и весь следующий круг, плюс поля; в процентах картинки (мир: x как есть, y/k).
  const xs=[plan.me.x, plan.c.cx-plan.c.radius, plan.c.cx+plan.c.radius], ys=[plan.me.y, plan.c.cy-plan.c.radius, plan.c.cy+plan.c.radius];
  const x0=Math.min(...xs)-4, x1=Math.max(...xs)+4, y0=Math.min(...ys)/k-4, y1=Math.max(...ys)/k+4;
  const RATIO=16/10, w=Math.max(8, x1-x0), h=Math.max(8, y1-y0);
  const zoom=Math.max(1, Math.min(6, Math.min(100/w, 100/(h*k*RATIO))));
  const halfW=Math.min(50, 50/zoom), halfH=Math.min(50, 50/(zoom*k*RATIO));
  const cx=clamp((x0+x1)/2, halfW, 100-halfW), cy=clamp((y0+y1)/2, halfH, 100-halfH);
  const H=(100*k).toFixed(2), sw=(0.9/zoom).toFixed(3), r=(1.3/zoom).toFixed(3), d=plan.def;
  const foes=plan.foes.map(s=>'<circle cx="'+s.x.toFixed(2)+'" cy="'+s.y.toFixed(2)+'" r="'+r+'" class="rp-foe"/>').join('');
  const svg='<svg class="rp-svg" data-hold="1" data-h="'+H+'" viewBox="0 0 100 '+H+'" preserveAspectRatio="none" style="--sw:'+sw+'">'+
    '<circle cx="'+plan.c.cx.toFixed(2)+'" cy="'+plan.c.cy.toFixed(2)+'" r="'+plan.c.radius.toFixed(2)+'" class="rp-zone"/>'+
    '<polyline class="rp-line" points="'+ccPathLineAttr(d)+'"/>'+foes+
    '<circle cx="'+d.pt.x.toFixed(2)+'" cy="'+d.pt.y.toFixed(2)+'" r="'+(r*1.6).toFixed(3)+'" class="rp-to"/>'+
    '<circle cx="'+plan.me.x.toFixed(2)+'" cy="'+plan.me.y.toFixed(2)+'" r="'+(r*1.5).toFixed(3)+'" class="rp-me"/></svg>';
  return '<div class="rp-map"><div class="lr-map-l" style="--zw:'+(zoom*100).toFixed(0)+'%;--tx:'+(-cx).toFixed(2)+'%;--ty:'+(-cy).toFixed(2)+'%;aspect-ratio:'+asp+';background-image:url(\''+art+'\')">'+svg+'</div></div>';
}
// Подпись пути: кто на линии, шанс встречи, ресы за длинный путь.
function ccPathNote(T, path){ return T.rpNote(path.on.length, Math.round(path.p*100), path.mats); }
// Тап и перетаскивание по карте пути двигают точку; onMove получает новый путь.
function ccPathAttach(box, plan, onMove){
  const svg=box && box.querySelector('.rp-svg');
  if(!svg) return ()=>{};
  const H=Number(svg.dataset.h)||100;
  const put=ev=>{
    const rc=svg.getBoundingClientRect();
    if(!rc.width || !rc.height) return;
    const cur=plan.at({x:(ev.clientX-rc.left)/rc.width*100, y:(ev.clientY-rc.top)/rc.height*H});
    const ln=svg.querySelector('.rp-line'), to=svg.querySelector('.rp-to');
    if(ln) ln.setAttribute('points', ccPathLineAttr(cur));
    if(to){ to.setAttribute('cx', cur.pt.x.toFixed(2)); to.setAttribute('cy', cur.pt.y.toFixed(2)); }
    onMove(cur);
  };
  let down=false;
  const up=()=>{ down=false; };
  svg.addEventListener('pointerdown', ev=>{ down=true; put(ev); });
  svg.addEventListener('pointermove', ev=>{ if(down) put(ev); });
  window.addEventListener('pointerup', up);
  return ()=>window.removeEventListener('pointerup', up);
}
// Дошли по пути: ресы за длинный путь, встреча с тем, кто у линии, играется тактикой отряда (you._tac).
async function ccPathResolve(you, ui, plan, p){
  const T=L();
  you._pos={x:p.pt.x, y:p.pt.y, cx:plan.c.cx, cy:plan.c.cy};
  if(p.mats) you._mats=Math.max(0, ccMats(you)-p.mats);
  const say=async (line, ok)=>{ if(ui && ui.note) ui.note(line); await ccChoiceResult(ui && ui.map, line, ok); };
  if(!p.on.length || Math.random()>=p.p){ await say(T.rpClear(T.rpGo), true); return; }
  const foe=p.on[0].s.team, foeName=ccFoeName(foe);
  const gun=you._loot && you._loot.weapons && you._loot.weapons[0];
  const tac=ccTacOf(you._tac||'push', you, foe);
  const out=ccFightApply(you, Math.random(), foe, null, tac);
  await say(T.rpMet(foeName)+' · '+ccFightLine(T, out, CC_FIGHT, foeName, gun, you, tac), out==='win' ? true : out==='poke' ? null : false);
}
/* pair — рядом дерутся двое (ccThirdPair): чип «третьить» влезает в их файт сразу (ccThirdPairApply). Меню середины,
   где это было, стало автоматическим (три остановки), и выбрать третью сторону было негде (игроки, 16.11). */
function ccTacChipsHTML(you, T, pair){
  const ids=['push'].concat(!CC_ZB && ccMats(you)>=CC_TAC_BOX_MATS ? ['box'] : [], ['back'], pair ? ['third'] : []);
  const foe=you._game && you._game.nearest ? you._game.nearest(you) : null;
  const label=id=>id==='third' ? T.tpTitle(ccFoeName(pair.a.team), ccFoeName(pair.b.team)) : ccTacName(T, id);
  let thirdNote='';
  if(pair){ try{ const o=ccThirdOdds(you, pair.a.team); thirdNote=T.tpNote(Math.round(CC_THIRD_SELF*100), Math.round(o.kill*100), Math.round(o.die*100), CC_THIRD.pow, Math.round(CC_THIRD_BOTH*100)); }catch(e){} }
  return '<div class="cc-chips" data-hold="1"><span class="cc-chips-h">'+esc(T.tcChips)+'</span>'+ids.map(id=>'<button type="button" class="cc-chip'+(id==='push' ? ' on' : '')+'" data-chip="'+id+'">'+esc(label(id))+'</button>').join('')+
    (foe ? '<small>'+esc(T.tcFoe(ccFoeName(foe), ccTacName(T, ccFoeTactic(foe, you))))+'</small>' : '')+
    (thirdNote ? '<small class="cc-chip-third">'+esc(thirdNote)+'</small>' : '')+'</div>';
}
/* ОКНО РОТАЦИИ (4-я зона): когда выходим, точка в следующем круге тапом и как играем встречу — одно окно. Сила хода — его
   ценность в этой ситуации (ccSitValue) против «сразу», так что ход по умолчанию силы не меняет. Под ходом факты, без
   ответа. Онлайн, пропуск и симуляция — только ряд ходов (карта и тактика при ccLootRoomOn). */
async function ccAskRotWindow(you, ui){
  if(!you) return;
  ccMpMark('ro0'+(you.mpTag||''));
  const T=L(), full=ccLootRoomOn();
  you._tac='push';
  const mv=you._loot && you._loot.move && !you._loot.move.floor ? you._loot.move : null;
  const name=id=>({early:T.ccRotEarly, with:T.ccRotWith, late:T.ccRotLate, move:T.ccRotMove})[id]||'';
  const cost=id=>T.ccRotCost(ccRotMats(id, you), CC_ROT_FARM[id]||0);
  const icon={early:CC_CHOICE_ICON.run, with:CC_CHOICE_ICON.storm, late:CC_CHOICE_ICON.stay, move:ccItemIconHTML(mv, CC_CHOICE_ICON.run)};
  const sit=ccSitOf(you);
  const opts=CC_SIT_ROT_IDS.filter(id=>ccSitAvail('rot', id, sit)).map(id=>({id, def:id==='early', icon:icon[id], title:name(id),
    note:ccSitFacts(T, 'rot', id, sit)+(ccSitUseless('rot', id, sit) ? ' · '+T.sitUseless : '')+' · '+cost(id)}));
  const plan=full ? ccPathPlan(you) : null;
  let cur=plan ? plan.def : null, tac='push';
  const pair=full ? ccThirdPair(you) : null;
  const hint=ccKitLine(you)+(plan ? ccPathMapHTML(plan)+'<span class="rp-note">'+esc(ccPathNote(T, cur))+'</span><span>'+esc(T.rpHint)+'</span>' : '')+(full ? ccTacChipsHTML(you, T, pair) : '');
  const pickId=(await ccMpChoose('rot'+(you.mpTag||''), async function(){
    const pr=ccChoiceBox(T.ccRotTitle, hint, opts, ui && ui.map, null, 'rot');
    // Окно уже на странице (ccChoiceBox строит его сразу): тап по карте и чипы читаются до ответа.
    const host=(ui && ui.map) || document.getElementById('majorStages');
    const box=ccChoiceIn(host);
    if(box && plan){ const off=ccPathAttach(box, plan, p=>{ cur=p; const n=box.querySelector('.rp-note'); if(n) n.textContent=ccPathNote(T, p); }); pr.then(off); }
    if(box) box.querySelectorAll('[data-chip]').forEach(b=>b.addEventListener('click', ()=>{
      tac=b.dataset.chip; box.querySelectorAll('[data-chip]').forEach(x=>x.classList.toggle('on', x===b)); }));
    return (await pr).id;
  }, function(v){ return name(v); })).v;
  ccMpMark('a4:'+pickId);
  you._rot=pickId;
  you._rotMul=CC_ROT_MATS[pickId]||1;
  // Третья сторона — ход, а не стиль встречи: файт пары решается сейчас, дальше играем как «пушить».
  if(tac==='third' && pair){
    const res=ccThirdPairApply(you, pair);
    const tl=T.tpGot(res);
    if(ui && ui.note) ui.note(tl);
    await ccChoiceResult(ui && ui.map, tl, res && res.out==='win' ? true : res && res.out==='die' ? false : null);
    tac='push';
    if(res && res.out==='die'){ you._tac=tac; return; }
  }
  you._tac=tac;
  const gain=Math.round(ccSitValue('rot', pickId, sit)-ccSitValue('rot', 'early', sit));
  if(gain) ccAddGamePow(you, gain);
  if(CC_ROT_FARM[pickId]) ccMatsAdd(you, CC_ROT_FARM[pickId]);   // пока ждали круг — фармили
  if(pickId==='move' && you._loot){   // улетел — слот занимает пол, концовка без мувмента стоит силы
    you._loot.move=null; ccPackFloor(you._loot, null, null);
    ccAddGamePow(you, -CC_ROT_MOVE_POW);
  }
  const line=T.ccRotSet(name(pickId))+(gain ? ' · '+(gain>0 ? '+' : '')+gain : '');
  if(ui && ui.note) ui.note(line);
  await ccChoiceResult(ui && ui.map, line, gain>0 ? true : gain<0 ? false : null);
  // Улетевшему с мувментом идти пешком незачем.
  if(plan && cur && pickId!=='move') await ccPathResolve(you, ui, plan, cur);
}
async function ccAskRot(you, ui){ return ccAskRotWindow(you, ui); }
/* Лечение больше не спрашивают — его показывают. Вопроса «пить или нет» не бывает
   и в жизни: щит просел, встал за стену, выпил. Строка говорит, что именно ушло из
   пака, что стало со щитом и здоровьем и во сколько силы обошлось время. Бросков тут
   нет вовсе, поэтому в командном вечере это не вопрос и синхронизировать нечего. */
async function ccShowHeal(you, ui){
  if(!you) return;
  const r=ccHealAuto(you);
  if(!r) return;
  const line=L().ccHealAuto(r.what, r.shield, r.hp, r.pow, r.left);
  if(ui && ui.note) ui.note(line);
  await ccChoiceResult(ui && ui.map, line, true);
}
/* Мид-гейм на 5-й и 7-й зоне, четыре хода:
     ротейт: ничего не меняет (дефолт при ресах, баланс под скипом не двигается);
     сёрдж: CC_SURGE_FARM урона в счёт сёрджа (движок ранжирует по чистому урону, zone-sim applySurge) за
       CC_SURGE_FARM_POW;
     ресы: рефреш ccAskMats, дефолт при пустых ресах, комната ходит так же (ccRoomMats);
     файт: CC_FIGHT.win сосед выбит через game.eliminate (+сила и ресы), CC_FIGHT.trade размен (−сила, щит, ресы,
       урон), иначе выбит ты сам. Смерть настоящая, через движок.
   По силе ожидание ~0 (0.5·4 − 0.35·3 − 0.15·6), по очкам минус: элим дешевле потерянного места. */
/* Числа мид-гейма по замеру: 3 игры финала FNCS Major 2 EU 2026 (реплеи Tracker 00743564, 24c56dba, 916190f5).
   Стычка: пара отрядов с ≥60 урона и паузами ≤20 с, потери в 30 с после последнего выстрела.
   Середина (зоны 4–7, 406 сторон): разошлись 56% (урон ≈70), размен 15%, сосед выбит 14%, выбиты сами 15%.
   Концовка (8+, 312 сторон): 30/20/19/31.
   Файт: решающий исход 29% (кто именно, решает дуэльная формула, ccFightApply), размен 15%, остальное разошлись
   без смены силы.
   Сёрдж в 2 играх из 3 шёл с 4-й по 10-ю зону, в третьей ни тика, поэтому ход «сёрдж» только при включённом
   сёрдже. Цена: +80 своих, −40 полученных (чистый урон, правило Epic с 2.10.2025), −1 к силе. */
const CC_SURGE_FARM=80, CC_SURGE_TAKEN=40, CC_SURGE_FARM_POW=1;
const CC_SURGE_SAFE=150;   // запас над линией, с которого ход «набить сёрдж» не предлагается (см. ccAskMenu)
/* Reload сёрджа не знает (движок: RELOAD_PHASES с surgeAt Infinity) — а третья
   зона предлагала «набить сёрдж» и в Reload (тестер, 16.09: «в релоаде сюрджа
   нет»). Один ответ на всех: карта Reload = r1…r4. */
function ccNoSurge(){ return /^r\d$/.test(String(typeof ACTIVE_LANDING_SET!=='undefined' ? ACTIVE_LANDING_SET : '')); }
// Ресы файта — на шкале игры (1500): снять с трупа 400, размен стоит 220, перестрелка 110.
const CC_FIGHT={decide:0.29, trade:0.15, pow:4, tradePow:3, diePow:6, mats:400, tradeMats:220, dmg:180, tradeHp:30,
                pokeDmg:70, pokeMats:110};
/* Шанс выбить соседа, когда стычка решается: та же дуэльная формула, что у
   движка (resolveDuel), по силе ближнего боя обеих команд. Без соседа — монетка. */
function ccFightWinOdds(you, foe){
  if(!you || !foe) return 0.5;
  const e=(typeof DUEL_POW_EXPONENT_BY_MODE!=='undefined' && DUEL_POW_EXPONENT_BY_MODE[squadSize])||5;
  const a=Math.max(1, you._pc||you._pf||you.pow||1), b=Math.max(1, foe._pc||foe._pf||foe.pow||1);
  const pa=Math.pow(a, e), pb=Math.pow(b, e);
  return pa/(pa+pb);
}
/* Сёрдж на этой остановке — по последнему кадру движка: живых против порога
   фазы и чистый урон отряда против линии. null, когда кадра нет. */
function ccSurgeState(you){
  const game=you && you._game, fr=game && game.frames ? game.frames() : null;
  const f=fr && fr.length ? fr[fr.length-1] : null;
  if(!f || !(f.surgeAt>0) || !isFinite(f.surgeAt)) return null;   // Reload: порог Infinity = сёрджа нет
  const sq=you._sq||{};
  const net=Math.round((sq.dealt||0)-(sq.taken||0));
  return {on:f.players>f.surgeAt, players:f.players, at:f.surgeAt,
          gap:(f.surgeLine!=null) ? net-f.surgeLine : null, net:net};
}
const CC_CHOICE_ICON={
  stay:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#9fb3c8" stroke-width="2"/><path d="M12 5l3 7-3 7-3-7z" fill="#e8eef6"/><path d="M12 5l3 7h-6z" fill="#00d0a8"/></svg>',
  surge:'<svg viewBox="0 0 24 24"><path d="M12 2l11 20H1z" fill="#ffd600"/><path d="M12 2l11 20H1z" fill="none" stroke="#7a5b00" stroke-width="1.2"/><path d="M13 8l-4 7h3l-1 5 4-7h-3z" fill="#1a1400"/></svg>',
  fight:'<svg viewBox="0 0 24 24"><path d="M4 4l12 12" stroke="#e8eef6" stroke-width="2.4" stroke-linecap="round"/><path d="M20 4L8 16" stroke="#e8eef6" stroke-width="2.4" stroke-linecap="round"/><path d="M14 18l4 2 2-4" fill="none" stroke="#ff9b9b" stroke-width="2" stroke-linecap="round"/><path d="M10 18l-4 2-2-4" fill="none" stroke="#ff9b9b" stroke-width="2" stroke-linecap="round"/></svg>',
  /* Картинки концовки — отзыв: «добавь везде картинки в
     симуляции, чтобы подходило в тему». Высота — башня из панелей, за зоной —
     фиолетовое кольцо шторма с точкой снаружи, рефреш — сундук, низ — тот же
     знак «остаёмся». Третьение и отжатие берут скрещённые стволы и флаг точки. */
  // Мид граунд — лестница из панелей на половину высоты башни.
  stairs:'<svg viewBox="0 0 24 24"><rect x="3" y="15" width="6" height="6" fill="#b7c3d1"/><rect x="9" y="11" width="6" height="10" fill="#b7c3d1"/><rect x="15" y="7" width="6" height="14" fill="#9fb3c8"/><path d="M3 15h6v-4h6V7h6" fill="none" stroke="#e8eef6" stroke-width="1.4"/></svg>',
  // Ротация «сразу» — бегущая стрелка к кругу.
  run:'<svg viewBox="0 0 24 24"><circle cx="18" cy="12" r="5" fill="none" stroke="#9fb3c8" stroke-width="1.6"/><path d="M3 12h10" stroke="#00d0a8" stroke-width="2.6" stroke-linecap="round"/><path d="M9 8l4 4-4 4" fill="none" stroke="#00d0a8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tower:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="6" fill="#b7c3d1"/><rect x="6" y="9" width="12" height="6" fill="#c8894a"/><rect x="3" y="15" width="18" height="6" fill="#c5624d"/><path d="M6 15h12M9 9h6M12 3v6M12 9v6M12 15v6" stroke="#3a2a22" stroke-width="1"/><path d="M15 3l5-2v4z" fill="#ffd600"/></svg>',
  storm:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#b36bff" stroke-width="2.4"/><circle cx="12" cy="12" r="8" fill="#b36bff" opacity=".18"/><circle cx="20" cy="6" r="2.4" fill="#e8eef6"/><path d="M20 8.5v3" stroke="#e8eef6" stroke-width="1.6"/></svg>',
  chest:'<img class="cc-chest-ic" src="items/chest.webp" alt="" width="24" height="24" decoding="async">',
  // Иконки из самой игры (HUD стройки, шторм, элиминации; файлы с вики Fortnite) для ходов концовки.
  fnStair:'<img class="cc-chest-ic" src="items/fn-build-stair.webp" alt="" width="24" height="24" decoding="async">',
  fnFloor:'<img class="cc-chest-ic" src="items/fn-build-floor.webp" alt="" width="24" height="24" decoding="async">',
  fnStorm:'<img class="cc-chest-ic" src="items/fn-storm.webp" alt="" width="24" height="24" decoding="async">',
  fnElims:'<img class="cc-chest-ic" src="items/fn-elims.webp" alt="" width="24" height="24" decoding="async">',
  home:'<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9H3z" fill="#00d0a8"/><path d="M10 20v-6h4v6" fill="#0b2a26"/></svg>',
  quiet:'<svg viewBox="0 0 24 24"><path d="M4 18c3-8 13-8 16 0" fill="none" stroke="#9fb3c8" stroke-width="2"/><circle cx="12" cy="8" r="3" fill="#e8eef6"/></svg>',
  contest:'<svg viewBox="0 0 24 24"><path d="M3 4l6 2 6-2 6 2v14l-6-2-6 2-6-2z" fill="#e8eef6" stroke="#9fb3c8" stroke-width="1.2"/><circle cx="14" cy="10" r="2.6" fill="#e8283f"/></svg>',
  wall1:'<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="1.5" fill="#c8894a"/><path d="M4 12h16M12 6v6M8 12v6M16 12v6" stroke="#7a4a1f" stroke-width="1.2"/></svg>',
  wall2:'<svg viewBox="0 0 24 24"><rect x="2" y="9" width="10" height="10" rx="1" fill="#c5624d"/><rect x="12" y="5" width="10" height="14" rx="1" fill="#c8894a"/><path d="M2 14h10M12 12h10M7 9v5M17 5v7" stroke="#5a2a1a" stroke-width="1.1"/></svg>',
  wall3:'<svg viewBox="0 0 24 24"><rect x="1" y="10" width="7" height="10" fill="#c5624d"/><rect x="8.5" y="6" width="7" height="14" fill="#c8894a"/><rect x="16" y="3" width="7" height="17" fill="#b7c3d1"/><path d="M1 15h7M8.5 13h7M16 11h7" stroke="#3a2a22" stroke-width="1.1"/></svg>'
};
// Картинка хода «набить ресы» — три стопки, как на HUD.
function ccMatsIconHTML(){ return CC_KIT_ICON.wood+CC_KIT_ICON.brick+CC_KIT_ICON.metal; }
// «Строить много»: те же три реса горкой, а не в ряд.
function ccMatsPileHTML(){ return '<span class="cc-mat-pile">'+ccMatsIconHTML()+'</span>'; }
// Картинка предмета из пака, когда она есть, иначе — запасной знак.
function ccItemIconHTML(o, fallback){
  let h=''; try{ h=o ? (weaponIconHTML(o, ccLootSet())||'') : ''; }catch(e){ h=''; }
  return /<img/.test(h) ? h : fallback;
}
/* ТИХИЕ ОСТАНОВКИ (3-я, 5-я, 7-я зоны): ходы, которые раньше спрашивали окном, решаются сами по паку и идут строкой в ленту
   под картой (ui.note), карта не встаёт. */
const ccAutoSay=(ui, line)=>{ if(line && ui && ui.note) ui.note(line); };
async function ccAutoFarm(you, ui){
  if(!you) return;
  ccMpMark('f0'+(you.mpTag||''));
  const T=L(), eco=ccMatsLow(you);
  if(eco){ const b=CC_BUILD_STYLE.eco; you._buildMul=b.mul; if(b.pow) ccAddGamePow(you, b.pow); }
  ccMatsAdd(you, CC_MATS_FARM);
  ccMpMark('a3f:'+(eco ? 'eco' : 'full'));
  ccAutoSay(ui, T.ccFarmFullGot(ccMats(you))+(eco ? ' · '+T.ccBuildSet(T.ccBuildEco, String(CC_BUILD_STYLE.eco.pow||0)) : ''));
}
// Сёрдж сам, когда запас над линией меньше CC_SURGE_SAFE. В Reload сёрджа нет.
function ccAutoSurge(you, ui){
  if(!you || ccNoSurge()) return false;
  const sg=ccSurgeState(you);
  if(!(sg && sg.on && (sg.gap==null || sg.gap<CC_SURGE_SAFE))) return false;
  if(you._sq){ you._sq.dealt=(you._sq.dealt||0)+CC_SURGE_FARM; you._sq.taken=(you._sq.taken||0)+CC_SURGE_TAKEN; }
  ccAddGamePow(you, -CC_SURGE_FARM_POW);
  ccAutoSay(ui, L().ccMidSurgeGot(CC_SURGE_FARM, CC_SURGE_TAKEN, CC_SURGE_FARM_POW));
  return true;
}
async function ccAutoMid(you, ui){
  if(!you) return;
  ccMpMark('m0'+(you.mpTag||''));
  const T=L();
  let did='stay';
  if(!CC_ZB && ccMatsLow(you)){
    const m=CC_LATE_MOVES.find(x=>x.id==='refresh'), pow=ccRefreshPow(you), won=Math.random()<m.odds;
    if(won){ ccAddGamePow(you, pow); ccMatsFill(you); } else ccAddGamePow(you, -m.fail);
    ccAutoSay(ui, won ? T.ccMatsFound(pow) : T.ccMatsMissed(m.fail));
    did='go';
  } else if(you._tac==='push' && ccLootRoomOn()){
    const pair=ccThirdPair(you);
    if(pair){ const res=ccThirdPairApply(you, pair); ccAutoSay(ui, T.tpGot(res)); did='third'; }
  }
  ccMpMark('a5:'+did);
  ccAutoSurge(you, ui);
  const h=ccHealAuto(you);
  if(h) ccAutoSay(ui, T.ccHealAuto(h.what, h.shield, h.hp, h.pow, h.left));
}
async function ccAskMid(you, ui){
  if(!you) return;
  await ccAskMenu(you, ui);
  // Хилки пьются сами, до меню середины: щит важнее любого следующего хода.
  await ccShowHeal(you, ui);
}
/* ФАРМ ПОСЛЕ ЛУТА — его пункт 3 со страницы «simulation» (7 сентября): «после
   поиска начального лута нужно добывать ресы: 1) нафармить до фула, 2) набить
   сёрдж и добыть меньше ресов, типа 400 400 400 — время тратится на теги,
   3) зафайтить ближайшее дуо — риск, но с них ресы, лут и сёрдж».
   Третья зона, после лута и стройки. До фула — ход по умолчанию: под скипом и
   в симуляции запас полный, как было до этой правки, и баланс не сдвинут.
   Сёрдж — те же числа, что у хода середины (CC_SURGE_FARM), ресы 1200 = 400·3.
   Файт — тот же ccFightApply, что на пятой зоне. */
async function ccAskFarm(you, ui){
  if(!you) return;
  ccMpMark('f0'+(you.mpTag||''));
  const T=L();
  const gun=you._loot && you._loot.weapons && you._loot.weapons[0];
  const foe0=(you._game && you._game.nearest) ? you._game.nearest(you) : null;
  const pw=ccFightWinOdds(you, foe0);
  const winPct=Math.round(CC_FIGHT.decide*pw*100), diePct=Math.round(CC_FIGHT.decide*(1-pw)*100);
  const tradePct=Math.round(CC_FIGHT.trade*100);
  /* Стиль стройки (ccAskBuild, 5.09) живёт в этом же меню, а не отдельным
     вопросом: «до фула» — как обычно, «до фула · экономно», «до фула · много».
     На третьей зоне было три вопроса подряд — лут, стройка, фарм; стало два. */
  const eco=CC_BUILD_STYLE.eco, heavy=CC_BUILD_STYLE.heavy;
  const opts=[
    // Фарм — прибавка до потолка (CC_MATS_FARM), подпись называет, сколько станет.
    {id:'full',  def:true, icon:ccMatsIconHTML(), icoCls:'wide', title:T.ccFarmFull, note:T.ccFarmFullNote(Math.min(CC_MATS_FULL, ccMats(you)+CC_MATS_FARM), CC_MATS_FARM)},
    {id:'eco',   icon:CC_KIT_ICON.wood, title:T.ccFarmFull+' · '+T.ccBuildEco,   note:T.ccBuildEcoNote(Math.round(CC_MATS_ZONE*eco.mul), -eco.pow)},
    {id:'heavy', icon:ccMatsPileHTML(), icoCls:'pile', title:T.ccFarmFull+' · '+T.ccBuildHeavy, note:T.ccBuildHeavyNote(Math.round(CC_MATS_ZONE*heavy.mul), heavy.pow)},
    ...(ccNoSurge() ? [] : [{id:'surge', icon:CC_CHOICE_ICON.surge, title:T.ccFarmSurge, note:T.ccFarmSurgeNote(Math.min(CC_MATS_FULL, ccMats(you)+CC_MATS_FARM_SHORT), CC_SURGE_FARM, CC_SURGE_FARM_POW)}]),
    {id:'fight', icon:ccItemIconHTML(gun, CC_CHOICE_ICON.fight),
     title:T.ccMidFight+(foe0 && foe0.name ? ' · '+String(foe0.name).replace(/<[^>]+>/g,'') : ''),
     note:T.ccMidFightNote(winPct, CC_FIGHT.pow, diePct, tradePct, CC_FIGHT.pokeDmg)}
  ];
  const pickId=(await ccMpChoose('farm'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(T.ccFarmTitle, ccKitLine(you), opts, ui && ui.map, null, 'farm')).id;
  }, function(v){ return ({full:T.ccFarmFull, eco:T.ccFarmFull+' · '+T.ccBuildEco, heavy:T.ccFarmFull+' · '+T.ccBuildHeavy, surge:T.ccFarmSurge, fight:T.ccMidFight})[v]||''; })).v;
  ccMpMark('a3f:'+pickId);
  const say=async (line, ok)=>{ if(ui && ui.note) ui.note(line); await ccChoiceResult(ui && ui.map, line, ok); };
  if(pickId==='eco' || pickId==='heavy'){
    const b=CC_BUILD_STYLE[pickId];
    you._buildMul=b.mul; if(b.pow) ccAddGamePow(you, b.pow);
    ccMatsAdd(you, CC_MATS_FARM);
    await say(T.ccFarmFullGot(ccMats(you))+' · '+T.ccBuildSet(T[pickId==='eco'?'ccBuildEco':'ccBuildHeavy'], b.pow>0?'+'+b.pow:String(b.pow)), null);
    return;
  }
  if(pickId==='surge'){
    ccMatsAdd(you, CC_MATS_FARM_SHORT);
    if(you._sq){ you._sq.dealt=(you._sq.dealt||0)+CC_SURGE_FARM; you._sq.taken=(you._sq.taken||0)+CC_SURGE_TAKEN; }
    ccAddGamePow(you, -CC_SURGE_FARM_POW);
    await say(T.ccFarmSurgeGot(ccMats(you), CC_SURGE_FARM), true);
    return;
  }
  if(pickId==='fight'){
    // Файт — с тем запасом, что нафармили бы за то же время: до фула не дотянули.
    ccMatsAdd(you, CC_MATS_FARM_SHORT);
    const r=Math.random();
    const game=you._game, foe=(game && game.nearest) ? game.nearest(you) : null;
    const foeName=foe ? String(foe.name||'').replace(/<[^>]+>/g,'') : '';
    const tac=await ccAskTactic(you, ui, foe, CC_FIGHT);
    const out=ccFightApply(you, r, foe, null, tac);
    ccMpMark('w3f:'+out);
    await say(ccFightLine(T, out, CC_FIGHT, foeName, gun, you, tac), out==='win' ? true : out==='poke' ? null : false);
    return;
  }
  ccMatsAdd(you, CC_MATS_FARM);
  await say(T.ccFarmFullGot(ccMats(you)), null);
}
// Комната фармит тем же выбором: большинство фармит (+CC_MATS_FARM), агрессивная треть — сёрдж и меньше ресов.
function ccRoomFarm(field, you){
  (field||[]).forEach(t=>{
    if(you && (t===you || t.isMate || t.isRival)) return;   // людям (и сопернику по гонке) — вопрос, не бросок
    if(!ccNoSurge() && Math.random()<0.3){
      ccMatsAdd(t, CC_MATS_FARM_SHORT);
      ccAddGamePow(t, -CC_SURGE_FARM_POW);
    } else ccMatsAdd(t, CC_MATS_FARM);
  });
}
async function ccAskMenu(you, ui){
  if(!you) return;
  ccMpMark('m0'+(you.mpTag||''));
  const T=L();
  const m=CC_LATE_MOVES.find(x=>x.id==='refresh');
  const pow=ccRefreshPow(you);
  const low=ccMatsLow(you);
  const gun=you._loot && you._loot.weapons && you._loot.weapons[0];
  // Шансы файта — по силе против ближайшего соседа, того самого, с кем он и
  // будет (см. ccFightApply). Сосед у обоих клиентов один: движок общий.
  const foe0=(you._game && you._game.nearest) ? you._game.nearest(you) : null;
  const pw=ccFightWinOdds(you, foe0);
  const winPct=Math.round(CC_FIGHT.decide*pw*100), diePct=Math.round(CC_FIGHT.decide*(1-pw)*100);
  const tradePct=Math.round(CC_FIGHT.trade*100);
  // Сёрдж предлагается, только когда он включён — по замеру (см. CC_SURGE_FARM).
  const sg=ccSurgeState(you);
  /* И только когда он может задеть: запас над линией меньше CC_SURGE_SAFE. Тестер,
     16.09: «не понятно, зачем набивать сёрдж — ни разу не страдал, он всегда в
     плюсе». Замер career-surge-you-probe (40 игр, кубок Д1): линия сёрджа стоит
     на −40…−70 чистого урона, своя команда идёт с медианой 100–160 — запас
     около 200; сёрдж режет тех, кто получил больше, чем нанёс. Так и в реплеях
     (правило Epic: чистый урон). Сильной команде ход нужен редко, и тогда, когда
     он нужен, подпись называет запас. */
  const surgeOpt=(sg && sg.on && (sg.gap==null || sg.gap<CC_SURGE_SAFE)) ? [{id:'surge', icon:CC_CHOICE_ICON.surge, title:T.ccMidSurge,
       note:T.ccMidSurgeNote(CC_SURGE_FARM, CC_SURGE_TAKEN, CC_SURGE_FARM_POW)+' · '+T.ccMidSurgeLine(sg.players, sg.at, sg.gap)}] : [];
  /* Ход по умолчанию — ПЕРВЫМ. Торопящийся (скип) отвечает ходом по
     умолчанию, досматривающий в проверках — первой кнопкой (check-mp-death:
     «c0.click()»), и пока «за ресами» при пустых ресах стояло третьей
     кнопкой, эти двое расходились на пятой зоне и получали разные таблицы.
     Поэтому при пустых ресах «за ресами» идёт первым, при полных — «остаёмся». */
  const endPow=ccMatsEndPow(you);
  const optStay={id:'stay',  def:!low, icon:CC_CHOICE_ICON.stay, title:T.ccMatsStay,
       note:endPow<0 ? T.ccMatsStayNote(-endPow) : T.ccMidStayNote};
  const optGo={id:'go',    def:low, icon:ccMatsIconHTML(), icoCls:'wide', title:T.ccMatsGo,
       note:T.ccMatsGoNote(pow, m.fail, Math.round(m.odds*100))};
  // Сосед — по имени: шансы считаны именно против него, и игрок должен видеть, с кем.
  const optFight={id:'fight', icon:ccItemIconHTML(gun, CC_CHOICE_ICON.fight),
       title:T.ccMidFight+(foe0 && foe0.name ? ' · '+String(foe0.name).replace(/<[^>]+>/g,'') : ''),
       note:T.ccMidFightNote(winPct, CC_FIGHT.pow, diePct, tradePct, CC_FIGHT.pokeDmg)};
  // Zero Build: за ресами идти некуда — остаёмся, сёрдж, файт.
  const opts=CC_ZB ? [optStay, ...surgeOpt, optFight] : (low ? [optGo, optStay, ...surgeOpt, optFight] : [optStay, ...surgeOpt, optGo, optFight]);
  // Третья сторона: рядом дерутся двое (ccThirdPair). Только одиночная игра без пропуска, как и тактика.
  const pair=ccLootRoomOn() ? ccThirdPair(you) : null;
  if(pair){
    const o=ccThirdOdds(you, pair.a.team);
    opts.push({id:'third', icon:CC_CHOICE_ICON.contest, title:T.tpTitle(ccFoeName(pair.a.team), ccFoeName(pair.b.team)),
      note:T.tpNote(Math.round(CC_THIRD_SELF*100), Math.round(o.kill*100), Math.round(o.die*100), CC_THIRD.pow, Math.round(CC_THIRD_BOTH*100))});
  }
  const pickId=(await ccMpChoose('mid'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(T.ccMidTitle, ccKitLine(you), opts, ui && ui.map, null, 'mid')).id;
  }, function(v){ return ({stay:T.ccMatsStay, surge:T.ccMidSurge, go:T.ccMatsGo, fight:T.ccMidFight, third:T.ccLateThird})[v]||''; })).v;
  ccMpMark('a5:'+pickId);
  const say=async (line, ok)=>{ if(ui && ui.note) ui.note(line); await ccChoiceResult(ui && ui.map, line, ok); };
  if(pickId==='third' && pair){
    const res=ccThirdPairApply(you, pair);
    const ok=res.out==='win' ? true : res.out==='die' ? false : null;
    await say(T.tpGot(res), ok);
    return;
  }
  if(pickId==='stay'){
    await say(low ? T.ccMatsStayGot : T.ccMidStayGot, low ? true : null);
    return;
  }
  if(pickId==='surge'){
    if(you._sq){ you._sq.dealt=(you._sq.dealt||0)+CC_SURGE_FARM; you._sq.taken=(you._sq.taken||0)+CC_SURGE_TAKEN; }
    ccAddGamePow(you, -CC_SURGE_FARM_POW);
    await say(T.ccMidSurgeGot(CC_SURGE_FARM, CC_SURGE_TAKEN, CC_SURGE_FARM_POW), true);
    return;
  }
  if(pickId==='go'){
    const won=Math.random()<m.odds;
    ccMpMark('w5:'+(won?1:0));
    if(won){ ccAddGamePow(you, pow); ccMatsFill(you); }
    else ccAddGamePow(you, -m.fail);
    await say(won ? T.ccMatsFound(pow) : T.ccMatsMissed(m.fail), won);
    return;
  }
  // Файт. Один бросок — у обоих клиентов один и тот же (см. ccMpChoose).
  const r=Math.random();
  const game=you._game, foe=(game && game.nearest) ? game.nearest(you) : null;
  const foeName=foe ? String(foe.name||'').replace(/<[^>]+>/g,'') : '';
  const tac=await ccAskTactic(you, ui, foe, CC_FIGHT);
  const out=ccFightApply(you, r, foe, null, tac);
  ccMpMark('w5f:'+out);
  await say(ccFightLine(T, out, CC_FIGHT, foeName, gun, you, tac), out==='win' ? true : out==='poke' ? null : false);
}
/* Лут с трупа: лучший ствол соперника того же класса встаёт на место худшего
   своего, если он выше по редкости. Возвращает взятый предмет или null. Пак
   соперника есть у всех — комната открывает сундуки на точке (ccRoomSite). */
function ccLootUpgrade(you, foe){
  const mine=you && you._loot, theirs=foe && foe._loot;
  if(!mine || !theirs || !theirs.weapons || !theirs.weapons.length) return null;
  const mod=o=>o ? (RARITY_MOD[o.rarity]||0) : -1;
  let best=null, at=-1;
  theirs.weapons.forEach(w=>{
    if(!w) return;
    // Своё место — тот же класс; если такого класса у нас нет — самый слабый слот.
    let i=(mine.weapons||[]).findIndex(o=>o && o.icon===w.icon);
    if(i<0){ i=(mine.weapons||[]).length<2 ? (mine.weapons||[]).length : (mod(mine.weapons[0])<=mod(mine.weapons[1]) ? 0 : 1); }
    const cur=(mine.weapons||[])[i];
    if(mod(w)>mod(cur) && (!best || mod(w)>mod(best))){ best=w; at=i; }
  });
  if(!best) return null;
  mine.weapons=(mine.weapons||[]).slice(); mine.weapons[at]=best;
  return best;
}
/* Что делает файт с отрядом — отдельно от вопроса, чтобы проверялось.
   r — бросок [0,1); foe — команда соседа (может не быть: тогда выбить некого
   и погибнуть не от кого — исход «разменялись»). */
/* ПИНГ В ФАЙТАХ СЕРЕДИНЫ (его слово 15.11: «пинг пусть зависит в мид гейме в файтах, легче забрать стенку — легче выиграть
   файт»). Пинг игрока против обычного пинга лобби на своём сервере (CC_PING_LOBBY): лучше — чуть чаще выигрывает файт и
   забирает высоту, хуже (далеко живёт, выезд на чужой сервер) — заметно чаще проигрывает. Вниз сильнее, чем вверх: хороший
   пинг у про норма, плохой — беда. Только людям (боты играют на своём сервере). Числа — решение, не замер. */
let CC_PING_LOBBY=25, CC_PING_FIGHT_SPAN=250, CC_PING_FIGHT_UP=0.04, CC_PING_FIGHT_DOWN=0.12, CC_PING_HG=40;
function ccPingFightMs(you){
  if(!you || !(you.isYou || you.isMate)) return null;
  /* В команде и гонке нельзя: каждый клиент знает только свой пинг и дал бы его обоим отрядам — игры разошлись бы
     (локстеп). Пока пинг каждого не едет по проводу, в общих вечерах поправки нет. */
  try{ if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRaceOn==='function' && ccRaceOn())) return null; }catch(e){}
  try{ const ms=ccPingNow(); return ms==null || ms==='' ? null : Number(ms); }catch(e){ return null; }
}
function ccPingFightTilt(ms){
  if(ms==null || !(ms>=0)) return 0;
  return Math.round(clamp((CC_PING_LOBBY-ms)/CC_PING_FIGHT_SPAN, -CC_PING_FIGHT_DOWN, CC_PING_FIGHT_UP)*1000)/1000;
}
function ccFightApply(you, r, foe, tb, tac){
  const sq=you._sq, game=you._game, F=tb||CC_FIGHT;
  const can=!!(foe && game && game.eliminate);
  // Тактика (ccAskTactic): доля решающих, размен, поправка шанса, ресы на бокс. Без неё как было.
  const dec=tac ? tac.dec : 1, trM=tac ? tac.trade : 1;
  if(tac && tac.mats) you._mats=Math.max(0, ccMats(you)-tac.mats);
  if(tac && tac.foeMats && foe) foe._mats=Math.max(0, ccMats(foe)-tac.foeMats);
  // Решающая доля стычек — CC_FIGHT.decide; внутри неё победителя называет сила.
  const pTilt=ccPingFightTilt(ccPingFightMs(you));
  const p=clamp((tac ? ccFightWinOdds(you, foe)+(tac.dp||0) : ccFightWinOdds(you, foe))+pTilt, 0.05, 0.95);
  const winTo=F.decide*dec*p, dieTo=F.decide*dec;
  if(r<winTo){
    if(can) game.eliminate(foe, you);
    else if(sq) sq.dealt=(sq.dealt||0)+CC_FIGHT.dmg;
    ccAddGamePow(you, CC_FIGHT.pow);
    you._mats=Math.min(CC_MATS_FULL, ccMats(you)+CC_FIGHT.mats);
    // Его пункт 3 («simulation», 7.09): с трупа — и лучший лут, если у соперника он был.
    you._lootUp=ccLootUpgrade(you, foe);
    return 'win';
  }
  if(r<dieTo && can){
    ccAddGamePow(you, -CC_FIGHT.diePow);
    game.eliminate(you, foe);
    return 'die';
  }
  if(r<dieTo+F.trade*trM || (r<dieTo && !can)){
    ccAddGamePow(you, -CC_FIGHT.tradePow);
    you._mats=Math.max(0, ccMats(you)-CC_FIGHT.tradeMats);
    if(sq){ sq.shield=0; sq.hp=Math.max(1, (sq.hp!=null?sq.hp:100)-CC_FIGHT.tradeHp); sq.taken=(sq.taken||0)+CC_FIGHT.dmg; }
    return 'trade';
  }
  // Постреляли и разошлись — самый частый исход по замеру (56%): урон в
  // сёрдж, ресы на стройку, сила на месте.
  if(sq){ sq.dealt=(sq.dealt||0)+CC_FIGHT.pokeDmg; sq.taken=(sq.taken||0)+Math.round(CC_FIGHT.pokeDmg/2); }
  you._mats=Math.max(0, ccMats(you)-CC_FIGHT.pokeMats);
  return 'poke';
}
/* ТАКТИКА ФАЙТА (план 125, 14.11): «чтоб лут и ресы решали файты». Перед стычкой — как играем её:
     пушить — числа замера как есть (dec 1), плюс CC_TAC_SG к шансу за каждую ступень редкости своего дробовика над чужим;
     бокс — решается реже (0.7), шанс сдвигают ресы и хилки против чужих, стоит CC_TAC_BOX_MATS ресов; нет в ZB и без ресов;
     отойти — решается редко (0.3), размен в CC_TAC_BACK_TRADE раз реже: тише, но и выбить почти некого.
   Пак соперника — foe._loot (комната лутает точку тем же сундуком), ресы — ccMats(foe). Числа — решение, не замер.
   Только ccLootRoomOn: онлайн, пропуск и симуляция идут без вопроса и без поправок, баланс там прежний. */
const CC_TAC_SG=0.06, CC_TAC_BOX_MATS=150, CC_TAC_BOX_DEC=0.7, CC_TAC_BOX_MW=0.12, CC_TAC_BOX_HW=0.04,
      CC_TAC_BACK_DEC=0.3, CC_TAC_BACK_TRADE=0.4, CC_TAC_CAP=0.18;
// Лучший ствол класса в паке: ступень редкости (RARITY_MOD), 0 — такого нет, null — пака нет вовсе.
function ccGunTier(t, cls){
  const ws=t && t._loot && t._loot.weapons;
  if(!ws) return null;
  return ws.reduce((m, o)=>o && o.icon===cls && !o.floor ? Math.max(m, RARITY_MOD[o.rarity]||0) : m, 0);
}
function ccHealSlots(t){ return ((t && t._loot && t._loot.heals)||[]).filter(h=>h && !h.floor && (h.n==null || h.n>0)).length; }
function ccTacDp(you, foe, id){
  if(id==='push'){
    const a=ccGunTier(you, 'shotgun'), b=ccGunTier(foe, 'shotgun');
    if(a==null || b==null) return 0;
    return clamp((a-b)*CC_TAC_SG, -CC_TAC_CAP, CC_TAC_CAP);
  }
  if(id==='box'){
    const m=(ccMats(you)-ccMats(foe))/CC_MATS_FULL*CC_TAC_BOX_MW;
    const h=(foe && foe._loot) ? (ccHealSlots(you)-ccHealSlots(foe))*CC_TAC_BOX_HW : 0;
    return clamp(m+h, -CC_TAC_CAP, CC_TAC_CAP);
  }
  return 0;
}
/* Соперник тоже выбирает, как играть (14.11, «боты выбирают тактику»): по своему луту, ресам и силе, не глядя на твой
   выбор. Сильнее дробовик — пушит; слабее по силе (шанс < CC_FOE_BACK) — отходит; ресов на CC_FOE_BOX_GAP больше — тянет
   бокс. Иначе пушит. Стычка решается так часто, как хочет самый осторожный (dec и размен — меньший из двух); дробовик
   считается, если пушит хоть один, ресы и хилки — если хоть один тянет бокс. Бокс соперника стоит ему тех же ресов.
   Пороги — решение, не замер. Дуэли ботов между собой — движок (resolveDuel), там лут уже в силе пака, их не трогаем. */
const CC_FOE_BACK=0.35, CC_FOE_BOX_GAP=300;
function ccFoeTactic(foe, you){
  if(!foe) return 'push';
  const sgF=ccGunTier(foe, 'shotgun'), sgY=ccGunTier(you, 'shotgun');
  const sgAdv=sgF!=null && sgY!=null && sgF>sgY;
  if(sgAdv) return 'push';
  if(ccFightWinOdds(foe, you)<CC_FOE_BACK) return 'back';
  if(!CC_ZB && ccMats(foe)>=CC_TAC_BOX_MATS && ccMats(foe)-ccMats(you)>=CC_FOE_BOX_GAP) return 'box';
  return 'push';
}
const CC_TAC_BASE={push:{dec:1, trade:1}, box:{dec:CC_TAC_BOX_DEC, trade:1}, back:{dec:CC_TAC_BACK_DEC, trade:CC_TAC_BACK_TRADE}};
function ccTacOf(id, you, foe, foeId){
  const me=CC_TAC_BASE[id] ? id : 'push', fo=foeId || ccFoeTactic(foe, you);
  const A=CC_TAC_BASE[me], B=CC_TAC_BASE[fo];
  let dp=0;
  if(me==='push' || fo==='push') dp+=ccTacDp(you, foe, 'push');
  if(me==='box' || fo==='box') dp+=ccTacDp(you, foe, 'box');
  return {id:me, foeId:fo, dec:Math.min(A.dec, B.dec), trade:Math.min(A.trade, B.trade), dp:clamp(dp, -CC_TAC_CAP, CC_TAC_CAP),
          mats:me==='box' ? CC_TAC_BOX_MATS : 0, foeMats:fo==='box' ? CC_TAC_BOX_MATS : 0};
}
function ccTacName(T, id){ return ({push:T.tcPush, box:T.tcBox, back:T.tcBack})[id]||''; }
/* Вопрос тактики. null — вопроса нет (онлайн/пропуск/симуляция): ccFightApply идёт без поправок. */
async function ccAskTactic(you, ui, foe, tb){
  if(!you || !ccLootRoomOn()) return null;
  // Тактику на игру выбрали в окне ротации: отдельного окна больше нет.
  if(you._tac) return ccTacOf(you._tac, you, foe);
  const T=L(), F=tb||CC_FIGHT, p0=ccFightWinOdds(you, foe);
  const pct=t=>{ const p=clamp(p0+t.dp, 0.05, 0.95);
    return [Math.round(F.decide*t.dec*p*100), Math.round(F.decide*t.dec*(1-p)*100), Math.round(F.trade*t.trade*100)]; };
  const rw=v=>v ? ccRarityWord(Object.keys(RARITY_MOD).find(k=>RARITY_MOD[k]===v)) : T.tcNone;
  const sgA=ccGunTier(you, 'shotgun'), sgB=ccGunTier(foe, 'shotgun');
  const push=ccTacOf('push', you, foe), box=ccTacOf('box', you, foe), back=ccTacOf('back', you, foe);
  const sg=you._loot && (you._loot.weapons||[]).find(o=>o && o.icon==='shotgun');
  const opts=[{id:'push', def:true, icon:ccItemIconHTML(sg, CC_CHOICE_ICON.fight), title:T.tcPush,
    note:T.tcOdds(...pct(push))+' · '+T.tcPushNote(rw(sgA), sgB==null ? '?' : rw(sgB))}];
  if(!CC_ZB && ccMats(you)>=CC_TAC_BOX_MATS) opts.push({id:'box', icon:CC_CHOICE_ICON.wall2, title:T.tcBox,
    note:T.tcOdds(...pct(box))+' · '+T.tcBoxNote(ccMats(you), ccMats(foe), ccHealSlots(you), foe && foe._loot ? ccHealSlots(foe) : '?', CC_TAC_BOX_MATS)});
  opts.push({id:'back', icon:CC_CHOICE_ICON.run, title:T.tcBack, note:T.tcOdds(...pct(back))+' · '+T.tcBackNote});
  // Как поведёт себя соперник, видно заранее: так и в игре, по тому, как он стоит и строит.
  const fid=push.foeId;
  const pick=(await ccChoiceBox(T.tcTitle(ccFoeName(foe)), ccKitLine(you)+'<br>'+esc(T.tcFoe(ccFoeName(foe), ccTacName(T, fid))), opts, ui && ui.map, null, 'tactic')).id;
  return ccTacOf(pick, you, foe);
}
// Строка исхода стычки — одна на все места, где дерутся (ферма, середина, путь, последние).
function ccFightLine(T, out, F, foeName, gun, you, tac){
  const head=tac ? ccTacName(T, tac.id)+(tac.foeId && tac.foeId!=='push' ? ' · '+T.tcFoeDid(ccTacName(T, tac.foeId)) : '')+' · ' : '';
  if(out==='win') return head+T.ccMidFightWon(F.pow, foeName, gun && gun.name)+(you._lootUp ? ' · '+T.ccLootUpgraded(you._lootUp.name) : '');
  if(out==='die') return head+T.ccMidFightDied(foeName);
  if(out==='poke') return head+T.ccMidFightPoke(F.pokeDmg, F.pokeMats);
  return head+T.ccMidFightTraded(F.tradePow);
}
/* СИТУАЦИЯ И ЦЕННОСТЬ ХОДОВ. Три окна за игру (ротация, концовка, стойка до конца), и у каждого хода сила зависит от того,
   что на экране: далеко ли круг, сколько ресов, какой AR, сколько отрядов рядом, какое место. Лучший ход не называется,
   под ходом только факты (ccSitFacts). Масштаб: лучший в ситуации на 8–15 силы впереди худшего. Числа — решение, не замер.
   Проверка tools/career-sit-probe.js (настоящие игры playGameWithChoices, кубок Д1, 92):
     стратегия        ср. место   побед %   топ-10 %   (600 игр)
     по умолчанию       21.3        1.8        34       старая версия по умолчанию 19.8 (вместе с 300 играми разница 0.8)
     лучший             20.6        1.7        33
     худший             25.5        0.3        18
   Лучший ход по окну: ротация «со штормом» 55%, концовка максимум «низ» 40%, стойка 51/49. Ход по ситуации почти не
   обгоняет ход по умолчанию: выбор решает тем, что ошибка дорогая. */
const CC_SIT_ROT_IDS=['early','with','late','move'], CC_SIT_END_IDS=['hg','mid','edge','refresh','lg','third'], CC_SIT_STANCE_IDS=['hold','push'];
const CC_SIT_NEAR=10, CC_SIT_USELESS=8;
// Недостающие поля — средняя ситуация; в Zero Build ресы не читаются.
function ccSitNorm(s){
  const o=Object.assign({dist:0, rNext:1, inside:false, away:false, edge:false, mats:900, heals:2, move:false, ar:3, nearBy:2, pair:false, place:10, alive:25}, s||{});
  if(CC_ZB) o.mats=900;
  if(o.low==null || CC_ZB) o.low=!CC_ZB && o.mats<CC_MATS_LOW;
  return o;
}
function ccSitOf(you, game0){
  const game=game0 || (you && you._game), sq=(you && you._sq) || (game && game.squads ? game.squads.find(q=>q.team===you) : null);
  const s={};
  const c=game && game.upcoming && game.upcoming();
  const fr=game && game.frames ? game.frames() : null, f=fr && fr[fr.length-1];
  if(sq && c){
    s.dist=Math.hypot(sq.x-c.cx, sq.y-c.cy); s.rNext=Math.max(1, c.radius); s.inside=s.dist<c.radius;
    const cur=f && f.circle;
    // Круг уходит от тебя: ты вне следующего, и его центр по другую сторону от центра текущего.
    if(cur){ s.away=!s.inside && ((c.cx-cur.cx)*(sq.x-cur.cx)+(c.cy-cur.cy)*(sq.y-cur.cy))<0;
      s.edge=Math.hypot(sq.x-cur.cx, sq.y-cur.cy)>cur.radius*0.75; }
  }
  s.mats=ccMats(you);
  s.heals=ccHealSlots(you);
  s.move=!!(you && you._loot && you._loot.move && !you._loot.move.floor);
  const ar=ccGunTier(you, 'rifle'); s.ar=ar==null ? 3 : ar;
  if(game && game.squads && sq){
    const others=game.squads.filter(o=>o.alive && o!==sq && o.team!==you && !o.team.isMate);
    // «Рядом» — от размера круга: к 8-й зоне весь круг уже ближе CC_SIT_NEAR, и счёт терял смысл.
    const cur0=f && f.circle, nr=cur0 ? Math.max(2, cur0.radius*0.3) : CC_SIT_NEAR;
    s.nearBy=others.filter(o=>Math.hypot(o.x-sq.x, o.y-sq.y)<nr).length;
    s.alive=others.length+1;
    const mine=Math.max(1, you._pc||you._pf||you.pow||1);
    s.place=1+others.filter(o=>Math.max(1, o.team._pc||o.team._pf||o.team.pow||1)>mine).length;
  }
  s.pair=!!(!game0 && ccLootRoomOn() && ccThirdPair(you));
  s.ping=ccPingFightMs(you);
  return s;
}
function ccSitAvail(kind, id, s){
  const o=ccSitNorm(s);
  if(kind==='rot' && id==='move') return o.move;
  if(kind==='end' && id==='third') return o.pair;
  if(kind==='end' && id==='refresh') return !CC_ZB;
  return true;
}
function ccSitValue(kind, id, s){
  const o=ccSitNorm(s), d=o.dist/Math.max(1, o.rNext), far=clamp((d-1)/2, 0, 1);
  if(kind==='rot'){
    /* Замер движка (career-sit-probe MEASURE, 4-я зона, ~250 игр на клетку): «последними» хуже на ~6 мест в любой ситуации,
       «со штормом» лучше «сразу» на ~1. Поэтому последними выгодно только без ресов (пока ждём, фармим), со штормом — с края. */
    if(id==='early') return 4*far+(o.away ? 4 : 0);
    if(id==='with') return 1.5+(o.edge ? 2 : 0)-4*far;
    if(id==='late') return (o.low ? 6 : -4)+(o.inside ? 2 : -2)-(o.away ? 4 : 0);
    if(id==='move') return 8*far+3-(o.inside ? 10 : 0);
  }
  if(kind==='end'){
    // Теснота — доля живых рядом, а не их число: к концовке живых всё меньше, и число само по себе ничего не говорит.
    const crowd=o.nearBy/Math.max(1, o.alive);
    // Пинг: забрать стенку на высоте — это пикап и редит; лучше пинга лобби — легче (ccPingFightTilt).
    const hg=(o.mats-800)/700*5+(o.ar-3)*2-8*clamp(crowd-0.3, 0, 1)+ccPingFightTilt(o.ping)*CC_PING_HG;
    if(id==='hg') return hg;
    if(id==='mid') return hg*0.5+1;
    if(id==='edge') return (o.edge ? 4 : -2)+(o.move ? 3 : 0);
    if(id==='refresh') return (o.low ? 6 : o.mats>=1400 ? -6 : 2-(o.mats-600)/400*2)+(o.heals<2 ? 3 : -1);
    if(id==='lg') return (o.low ? 4 : 0)+(o.away ? -2 : 3);
    if(id==='third') return 5-Math.max(0, o.nearBy-3);
  }
  if(kind==='stance'){
    if(id==='hold') return clamp((12-o.place)/10, -1, 1)*7;
    if(id==='push') return (o.ar-3)*2+(o.mats-900)/600*2+(o.place-12)/10*5;
  }
  return 0;
}
// Явно плохой ход сейчас: сам не в плюсе и на CC_SIT_USELESS ниже лучшего доступного.
function ccSitUseless(kind, id, s){
  const ids=kind==='rot' ? CC_SIT_ROT_IDS : kind==='end' ? CC_SIT_END_IDS : CC_SIT_STANCE_IDS;
  const v=ccSitValue(kind, id, s), top=Math.max(...ids.filter(x=>ccSitAvail(kind, x, s)).map(x=>ccSitValue(kind, x, s)));
  return v<=0 && top-v>=CC_SIT_USELESS;
}
// Факты под ходом: что на экране сдвигает его ценность. Без вердикта.
function ccSitFacts(T, kind, id, s){
  const o=ccSitNorm(s), d=o.dist/Math.max(1, o.rNext);
  const circle=o.inside ? T.sitFInside : d>2 ? T.sitFFar : T.sitFNear;
  const dir=o.away ? T.sitFAway : T.sitFToward;
  const mats=CC_ZB ? '' : T.sitFMats(Math.round(o.mats));
  const ar=T.sitFAr(o.ar ? ccRarityWord(Object.keys(RARITY_MOD).find(k=>RARITY_MOD[k]===o.ar)) : T.tcNone);
  const pick={
    rot:{early:[circle, dir], with:[circle, o.edge ? T.sitFEdge : ''], late:[circle, mats], move:[o.move ? T.sitFMove : '', circle]},
    end:{hg:[mats, ar, T.sitFNearBy(o.nearBy), o.ping!=null ? T.sitFPing(Math.round(o.ping)) : ''], mid:[mats, T.sitFNearBy(o.nearBy)], edge:[o.edge ? T.sitFEdge : T.sitFMid, o.move ? T.sitFMove : ''],
         refresh:[mats, T.sitFHeals(o.heals)], lg:[mats, dir], third:[o.pair ? T.sitFPair : '', T.sitFNearBy(o.nearBy)]},
    stance:{hold:[T.sitFPlace(o.place)], push:[ar, mats, T.sitFPlace(o.place)]}
  }[kind];
  const parts=((pick && pick[id])||[]).filter(Boolean);
  return parts.length ? parts.join(' · ') : circle;
}
/* Вопрос середины: идти за рефрешем или ротейтить тем, что есть.
   Те же числа, что у рефреша в меню восьмой зоны, — это тот же ход, просто
   раньше по времени: сходил — ресы полные и прибавка, не сходил — играешь как
   есть и рискуешь штрафом концовки. */
async function ccAskMats(you, ui){
  if(!you) return;
  ccMpMark('m0'+(you.mpTag||''));
  const m=CC_LATE_MOVES.find(x=>x.id==='refresh');
  const pow=ccRefreshPow(you);
  const pickId=(await ccMpChoose('mats'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(L().ccMatsTitle, ccKitLine(you), [
      {id:'go',   title:L().ccMatsGo,   note:L().ccMatsGoNote(pow, m.fail, Math.round(m.odds*100))},
      {id:'stay', title:L().ccMatsStay, note:ccMatsEndPow(you)<0 ? L().ccMatsStayNote(-ccMatsEndPow(you)) : L().ccMidStayNote}
    ], ui && ui.map, null, 'mats')).id;
  }, function(v){ return v==='go' ? L().ccMatsGo : L().ccMatsStay; })).v;
  ccMpMark('a5:'+pickId);
  if(pickId!=='go'){
    if(ui && ui.note) ui.note(L().ccMatsStayGot);
    await ccChoiceResult(ui && ui.map, L().ccMatsStayGot, true);
    return;
  }
  const won=Math.random()<m.odds;
  ccMpMark('w5:'+(won?1:0));
  if(won){ ccAddGamePow(you, pow); ccMatsFill(you); }
  else ccAddGamePow(you, -m.fail);
  const line=won ? L().ccMatsFound(pow) : L().ccMatsMissed(m.fail);
  if(ui && ui.note) ui.note(line);
  await ccChoiceResult(ui && ui.map, line, won);
}
// Комната ходит тем же ходом: с пустыми ресами большинство идёт за рефрешем.
function ccRoomMats(field, you){
  const m=CC_LATE_MOVES.find(x=>x.id==='refresh');
  (field||[]).forEach(t=>{
    if(you && (t===you || t.isMate || t.isRival)) return;   // людям (и сопернику по гонке) — вопрос, не бросок
    if(!ccMatsLow(t) || Math.random()>=0.7) return;
    if(Math.random()<m.odds){ ccAddGamePow(t, ccRefreshPow(t)); ccMatsFill(t); }
    else ccAddGamePow(t, -m.fail);
  });
}
/* Сколько даёт рефреш ИМЕННО СЕЙЧАС. Полные ресы — идти незачем, половина;
   пустые — полная прибавка. Это и есть ответ на «чем он отличается от лг». */
function ccRefreshPow(t){
  return ccMatsLow(t) ? CC_REFRESH_POW : Math.round(CC_REFRESH_POW/2);
}
/* И то же самое делает комната.

   Замер (tools/career-choice-balance-probe.js, 500 игр): если лут и высокую
   землю получает только игрок, его победы идут с 4.2% до 7.0% — полтора раза
   ни за что, каждую игру. Лестница дивизионов в этом файле откалибрована на
   том, как играют обе стороны, и такой подарок её ломает.

   Поэтому остальные пятьдесят команд на тех же двух фазах делают то же самое:
   обыскивают свою точку и дерутся за высоту. Не константой — своим броском:
   пак у каждого свой, а за хайграунд чаще берётся тот, кто сильнее, и у него
   же чаще выходит. Так решение игрока стоит ровно столько, сколько стоит
   относительно комнаты, а не относительно нуля. */
// Насколько команда выше средней по лобби — этим решается, полезет она в
// размен или возьмёт надёжное. Одна мера на оба вопроса середины игры.
function ccRoomEdge(field){
  const avg=field.reduce((s,t)=>s+(t._pf||t.pow||0), 0)/Math.max(1, field.length);
  return t=>((t._pf||t.pow||0)-avg)/Math.max(1, avg);
}
/* Своя точка стоит ноль и комнате тоже — иначе игрок, оставшийся дома,
   отставал бы от всего лобби на ровном месте. Разница только в том, кто
   побежит за круг: те же, кто лезет на высоту, тем же броском. */
function ccRoomLoot(field, you){
  const edgeOf=ccRoomEdge(field);
  field.forEach(t=>{
    if(you && (t===you || t.isMate || t.isRival)) return;   // людям (и сопернику по гонке) — вопрос, не бросок   // людям — вопрос, не бросок
    if(Math.random() < clamp(0.35+edgeOf(t)*4, 0.1, 0.75))
      ccAddGamePow(t, Math.random()<CC_LOOT_POI_ODDS ? CC_LOOT_POI_BONUS : -CC_LOOT_POI_FAIL);
  });
}
/* Комната ходит тем же меню, что и игрок.

   Раньше веток было две — «полез на высоту» и «нашёл рефреш», — потому что и
   ходов было три. Ходов стало пять (третьение и отжатие точки, отзыв), и перечислять их здесь второй раз означало бы, что следующий ход
   опять придётся дописывать в двух местах и однажды забыть. Поэтому комната
   выбирает ИЗ ТОГО ЖЕ списка CC_LATE_MOVES.

   Как выбирает: чем команда сильнее средней по лобби, тем охотнее берёт ход с
   потолком повыше. Порядок в списке идёт от самого рискованного к самому
   тихому, так что бросок по силе — это и есть «сильные лезут в размен, слабые
   ищут рефреш или сидят снизу», только теперь на пяти ходах, а не на двух.

   Штраф за провал платит и комната: до правки боты рисковали
   высотой бесплатно, и их ожидание было выше игроковского на ровном месте. */
/* Выбор бота по ситуации (для проверок и проб). Сама комната ходит старым откалиброванным броском (ccRoomLate ниже):
   замер career-sit-probe — с выбором по ситуации комната слабела, и игрок «по умолчанию» поднимался на 2.5 места. */
function ccRoomLateOne(t, game){
  const s=ccSitOf(t, game), ids=CC_SIT_END_IDS.filter(id=>id!=='third' && ccSitAvail('end', id, s));
  const sq=game && game.squads ? game.squads.find(q=>q.team===t) : null, sk=sq && sq.skill!=null ? sq.skill : 0.5;
  if(Math.random()<sk) return ids.slice().sort((x,y)=>ccSitValue('end', y, s)-ccSitValue('end', x, s))[0];
  return ccEndDefault(t);
}
function ccRoomLate(field, you){
  const edgeOf=ccRoomEdge(field);
  // Ходы с монеткой, разложенные по потолку: бросок ниже читает индекс как
  // «насколько высоко метит». В самом CC_LATE_MOVES порядок другой — там он
  // про то, как ходы стоят на панели у игрока, и совпадать эти два не обязаны.
  /* ПРАВКА 4 СЕНТЯБРЯ. Корзин было две: «с монеткой» (одна высокая земля) и
     «спокойные» (рефреш, верные +3). Рефреш стал риском — и вторая корзина
     опустела, а с ней пропала половина ходов комнаты: сторож choice-stacking
     поймал «лут получили только 8 из 19». Корзина теперь одна, все ходы с
     прибавкой, и доля ходящих поднята так, чтобы комната ходила не реже
     прежнего. Что это не подарок и не налог — меряет career-choice-balance-probe. */
  // Ходы через движок (третья сторона) комната не ходит: её стычки движок
  // и так считает сам, а второй раз давать ей элимы броском — подарок.
  const risky=ccLateMovesNow().filter(m=>m.pow>0 && !m.real).slice().sort((a,b)=>a.pow-b.pow);
  const calm=[];
  field.forEach(t=>{
    if(you && (t===you || t.isMate || t.isRival)) return;   // людям (и сопернику по гонке) — вопрос, не бросок
    if(Math.random() < clamp(0.62+edgeOf(t)*4, 0.35, 0.9)){
      // В размен. Кто именно из рискованных — тем же броском: чем выше сила
      // над лобби, тем дальше по списку, то есть тем больше потолок.
      const at=Math.min(risky.length-1,
        Math.floor(Math.random()*risky.length*clamp(0.5+edgeOf(t)*3, 0.2, 1.4)));
      const m=risky[Math.max(0, at)];
      const won=Math.random()<m.odds;
      // Рефреш у комнаты считается по её же ресам: полные — половина прибавки.
      ccAddGamePow(t, won ? (m.mats ? ccRefreshPow(t) : m.pow) : -m.fail);
      if(won && m.mats) ccMatsFill(t);
    } else if(calm.length && Math.random()<0.55){
      ccAddGamePow(t, calm[0].pow);
    }
  });
}
/* Панель вопроса поверх карты. Живёт ровно столько, сколько идёт вопрос, и
   всегда имеет ответ по умолчанию: под скипом, в перемотке и в харнессе никто
   не кликает, а игра обязана доиграть. */
/* CC_CHOICE_WAIT — сколько вопрос ждёт ответа, прежде чем ответить сам.

   Не «удобство», а то же правило, которым чинился пикер: вопрос внутри
   прогона обязан иметь выход, не требующий попадания мышью. Иначе окно,
   свёрнутое на середине игры, читается как «зависло» — и читалось: жалоба была ровно об этом. Пятнадцать секунд — это время
   посмотреть на карту и решить, а не срок, за который вечер успевает
   надоесть; по истечении берётся первый ход, он же самый осторожный. */
// let, а не const: пробам и снимкам нужно уметь отодвинуть автоответ — в
// headless виртуальное время летит, и пятнадцать секунд там проходят мгновенно.
let CC_CHOICE_WAIT=15000;
/* host — карта, на которой идёт матч (правка: «на карте красивым
   дизайном»). Вопрос лежит поверх острова, а не карточкой под ним: решение
   принимается глядя на круг и на то, где ты в нём стоишь, и разносить эти две
   вещи по экрану — значит заставлять переводить взгляд в момент, когда смотреть
   надо как раз на карту. Если карты нет (проба, старый вызов), панель падает
   в ленту этапов, как раньше. */
/* side — картинки заголовка, его страница «картинки» 6 сентября: «сверху
   слева аватарка моего спота, справа типа вся карта». {left, right} — готовая
   разметка; ставится в строку под плашкой, по бокам подсказки. Кнопке можно
   дать icon — маленькую картинку слева от названия («додумай картинки, что
   подойдёт под надписи»). Вариант с def:true — тот, что берётся сам под
   скипом, в симуляции и по таймеру; без def — первый, как и раньше. */
/* Мнение напарника перед выбором — из списка идей 6 сентября («мнение
   напарника»). В настоящем дуо решение середины игры не принимают молча:
   напарник в войсе говорит, куда он хочет. Здесь это одна строка под
   заголовком и метка на кнопке, за которую он. Бот-напарник осторожен: чаще
   за ход по умолчанию (он же самый безопасный), но с силой растёт смелость —
   карточка 90+ каждый второй раз тянет в другую сторону. Живой напарник
   (мультиплеер) говорит сам — строки нет; в соло говорить некому.
   Это мнение, не подсказка: на исход выбора оно не влияет и в симуляции не
   считается вовсе (панель там не строится). */
function ccMateOpinion(options, dflt){
  if(!options || options.length<2) return null;
  if(typeof careerSquadSize!=='function' || careerSquadSize()<2) return null;
  /* Соло-вечер в дуо-сезоне: careerSquadSize — размер СЕЗОНА, а не этого
     вечера. Скриншот (страница «socials»): Solo Series, отборы —
     и под вопросом «vic0: I'd go …». Напарник в соло не играет, значит и
     советовать ему нечего. Размер вечера ставит раннер в squadSize. */
  if(typeof squadSize==='number' && squadSize<2) return null;
  if(typeof ccMpOn==='function' && ccMpOn()) return null;
  const mates=(typeof careerMates==='function') ? careerMates().filter(Boolean) : [];
  const m=mates[0];
  if(!m || !m.handle) return null;
  const bold=(Number(m.ovr)||0)>=90 ? 0.5 : 0.3;
  let pick=dflt;
  if(Math.random()<bold){ const alt=options.filter(o=>o && o!==dflt); pick=alt[Math.floor(Math.random()*alt.length)]||dflt; }
  const say=L().ccMateLeans;
  return {name:m.handle, pick, text: typeof say==='function' ? say(String(pick.title||'').replace(/<[^>]+>/g,'')) : ''};
}
/* ВЕЧЕР ПО ФАКТАМ (16.10, его «123»: план коуча, живые твиты, разбор вечера).
   Одна запись на вечер: CC_EVENING = {day, rows:[…], posted}. Строку кладёт score() в simulateGamesLive для своей команды
   после каждой игры: место, киллы, от кого/чего погиб (_deathCause движка: ник команды, 'storm', 'surge'), зона, погиб ли
   на высадке, ротация, и сколько пунктов плана коуча выполнено. Из неё — карточка «Разбор вечера» и посты в ленте. */
let CC_EVENING=null, CC_GAME_PICKS={}, CC_GAME_OPTS={}, CC_COACH_PLAN=null;
function ccEveningRows(){
  const d=(typeof careerToday==='function' && CAREER && CAREER.career) ? careerToday() : '';
  if(!CC_EVENING || CC_EVENING.day!==d) CC_EVENING={day:d, rows:[], posted:false};
  return CC_EVENING.rows;
}
// Ник из имени команды-убийцы: «Peterbot & Pollo» → Peterbot (первый — тот, кто назван первым).
function ccEveningKillerHandle(name){
  const n=String(name||'').replace(/<[^>]+>/g,'').split(/\s*(?:&|\/|\+|,| x )\s*/)[0].trim();
  return n;
}
function ccEveningRecord(t, g, place, elims, pts, of){
  if(!t || !t.isYou || !CAREER || !CAREER.career) return;
  const plan=CC_COACH_PLAN ? ccCoachPlanScore() : null;
  /* mk/who — киллы каждого игрока отряда в этой игре (zone-sim _mK, порядок team.squad) и их ники: из них аналитик
     собирает личную статистику вечера (ccAnalystMe). Своя строка — ник карьеры. */
  const meN=(CAREER.player && (CAREER.player.handle||CAREER.player.nick))||'';
  const who=(t.squad||[]).map(c=>(c && (c.handle||c.nick))||'');
  ccEveningRows().push({g, place, elims, pts:pts||0, of:of||0, mk:t._mK ? t._mK.slice() : null, who, me:meN,
                        dc:t._deathCause||null, dz:t._zoneReached||null, dd:!!t._droppedOut,
                        rot:t._rot||null, plan, zp:t._zonePull!=null ? t._zonePull : null});
}
/* ПЛАН КОУЧА. Строится перед первой игрой вечера, если коуч нанят (одиночная игра). Ставка — по дивизиону: в первых двух
   коуч играет от силы (контест, с зоной, файты, центр в эндгейме), ниже — от выживания (своя точка, рано, без лишних файтов,
   край зоны). Ротацию «с зоной»/«рано» меняет день: у плана одного коуча нет одной заготовки на весь год. */
function ccCoachPlanMake(){
  const c=(typeof ccCoach==='function') ? ccCoach() : null;
  if(!c || (typeof ccMpOn==='function' && ccMpOn())) return null;
  const div=(CAREER.career.division||5);
  const strong=div<=2;
  const dayOdd=(ccHashStr ? ccHashStr(careerToday()+'|'+c.id) : 0)%2===1;
  return {coach:c.name, drop:strong ? 'contest' : 'home', rot:strong ? (dayOdd ? 'with' : 'early') : (dayOdd ? 'early' : 'with'),
          fight:strong ? 'fight' : 'avoid', late:strong ? 'mid' : 'edge'};
}
// Какой вариант вопроса — пункт плана. null — у этого вопроса пункта нет.
function ccCoachPlanTarget(kind, ids){
  const p=CC_COACH_PLAN; if(!p || !ids) return null;
  const k=String(kind||'').replace(/:.*$/, ''), has=x=>ids.indexOf(x)>=0 ? x : null;
  if(k==='drop') return has(p.drop) || (p.drop==='home' ? has('quiet') : null);
  if(k==='rot') return has(p.rot);
  if(k==='site') return p.fight==='fight' ? has('fight') : has('leave');
  if(k==='farm') return p.fight==='fight' ? has('fight') : has('full');
  if(k==='mid') return p.fight==='fight' ? has('fight') : has('stay');
  if(k==='late') return has(p.late);
  return null;
}
function ccCoachPlanScore(){
  let ok=0, n=0;
  Object.keys(CC_GAME_PICKS).forEach(k=>{ const tg=ccCoachPlanTarget(k, CC_GAME_OPTS[k]); if(!tg) return; n++; if(CC_GAME_PICKS[k]===tg) ok++; });
  return n ? {ok, n} : null;
}
// Карточка плана перед первой игрой — одна кнопка «Принято»; под скипом и симуляцией проходит сама (ccChoiceBox).
async function ccCoachPlanShow(){
  CC_COACH_PLAN=ccCoachPlanMake();
  if(!CC_COACH_PLAN) return;
  const T=L(), p=CC_COACH_PLAN;
  const li=(a,b)=>'<li><em>'+esc(a)+'</em> '+esc(b)+'</li>';
  const hint='<ul class="cc-plan">'+li(T.ccPlanDrop, T['ccPlanDrop_'+p.drop])+li(T.ccPlanRot, T['ccPlanRot_'+p.rot])+
    li(T.ccPlanFight, T['ccPlanFight_'+p.fight])+li(T.ccPlanLate, T['ccPlanLate_'+p.late])+'</ul>';
  /* Карточку плана перед первой игрой убрали (его слово 19.11, скрин «game plan for tonight»: «я бы это убрал»). План
     остаётся тихо: коуч подсказывает в каждом вопросе (ccCoachOpinion), разбор вечера считает, сколько пунктов совпало. */
  void hint;
}
/* РАЗБОР ВЕЧЕРА — в карточке результата, под оценкой матча (ccNightRateLine). Только то, что было: смерти по причинам,
   кто чаще всех убивал, лучшая игра, ротации, план коуча; и что из этого следует для тренировки. */
function ccEveningReviewHTML(){
  const rows=(CC_EVENING && CC_EVENING.day===careerToday()) ? CC_EVENING.rows : [];
  if(!rows.length) return '';
  try{ ccEveningPosts(rows); }catch(e){}
  const T=L();
  const deaths={kill:0, storm:0, surge:0, drop:0}, killers={};
  rows.forEach(r=>{
    if(r.place===1) return;
    if(r.dd) deaths.drop++;
    else if(r.dc==='storm') deaths.storm++;
    else if(r.dc==='surge') deaths.surge++;
    else if(r.dc){ deaths.kill++; const h=ccEveningKillerHandle(r.dc); if(h) killers[h]=(killers[h]||0)+1; }
  });
  const top=Object.entries(killers).sort((a,b)=>b[1]-a[1])[0];
  const best=rows.slice().sort((a,b)=>a.place-b.place || b.elims-a.elims)[0];
  const kills=rows.reduce((n,r)=>n+(r.elims||0), 0);
  const plan=rows.filter(r=>r.plan);
  const pOk=plan.reduce((n,r)=>n+r.plan.ok, 0), pN=plan.reduce((n,r)=>n+r.plan.n, 0);
  const line=(a,b)=>'<li><em>'+esc(a)+'</em><b>'+b+'</b></li>';
  let html='<div class="ev-review"><h5>'+esc(T.evTitle)+'</h5><ul>';
  html+=line(T.evBest, esc(T.evBestGame(best.g, best.place, best.elims)));
  html+=line(T.evKills, esc(String(kills))+' · '+esc(T.evPerGame((kills/rows.length).toFixed(1))));
  const dl=[];
  if(deaths.kill) dl.push(T.evDeathKill(deaths.kill));
  if(deaths.drop) dl.push(T.evDeathDrop(deaths.drop));
  if(deaths.storm) dl.push(T.evDeathStorm(deaths.storm));
  if(deaths.surge) dl.push(T.evDeathSurge(deaths.surge));
  if(dl.length) html+=line(T.evDeaths, esc(dl.join(' · ')));
  if(top && top[1]>=1) html+=line(T.evNemesis, '@'+esc(top[0])+(top[1]>1 ? ' ×'+top[1] : ''));
  if(pN) html+=line(T.evPlan, esc(T.evPlanDone(pOk, pN)));
  html+='</ul>';
  // Что тренировать: по главной причине вылетов.
  const main=Object.entries(deaths).sort((a,b)=>b[1]-a[1])[0];
  if(main && main[1]>0) html+='<p class="ev-tip">'+esc(T['evTip_'+main[0]])+'</p>';
  return html+'</div>';
}
/* ПОСТЫ ПО ФАКТАМ ВЕЧЕРА (Notion 15.10: «the tweets are kinda weird»). Один раз на вечер, только одиночная игра:
   — тот, кто убил тебя больше всех (дважды и чаще) и есть в базе карточек, пишет об этом сам (автор — arg0);
   — твой пост про Victory Royale с киллами этой игры;
   — твой пост, если за вечер вышло много киллов (5+ в среднем за игру нет — порог 3 за игру). */
function ccEveningPosts(rows){
  if(!CC_EVENING) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  // Каждый вид поста — раз за вечер, но не обязательно после первого раунда: факты копятся (вечер в два раунда).
  const done=CC_EVENING.posted=(CC_EVENING.posted && typeof CC_EVENING.posted==='object') ? CC_EVENING.posted : {};
  const me=(CAREER.player && (CAREER.player.nick||CAREER.player.handle)) || '';
  const killers={};
  rows.forEach(r=>{ if(r.place!==1 && r.dc && r.dc!=='storm' && r.dc!=='surge' && !r.dd){ const h=ccEveningKillerHandle(r.dc); if(h) killers[h]=(killers[h]||0)+1; } });
  const top=Object.entries(killers).sort((a,b)=>b[1]-a[1])[0];
  let posted=false;
  if(!done.k && top && top[1]>=2 && typeof ccCardsByKey==='function' && (ccCardsByKey().get(hKey(top[0]))||[]).length){
    careerNews('flat', 'ccPostEvKilled', [top[0], top[1], me]); posted=done.k=true;
  }
  const vr=rows.filter(r=>r.place===1).sort((a,b)=>b.elims-a.elims)[0];
  if(vr && !done.vr){ careerNews('good', 'ccPostEvVR', [vr.g, vr.elims, rows.length]); posted=done.vr=true; }
  const kills=rows.reduce((n,r)=>n+(r.elims||0), 0);
  if(!vr && !done.e && rows.length>=4 && kills/rows.length>=3){ careerNews('good', 'ccPostEvKills', [kills, rows.length]); posted=done.e=true; }
  /* Удача зон (28.10, X после Solo FNCS: «pulled 1/12 zones & played 2 endgames but still W»). Считаются эндгеймы, до
     которых дожил (zp не null, см. PULL_ZONE в zone-sim): по всем играм вышло бы «1/12» почти у каждого, потому что
     большинство до шестого круга не доживает. Зона приходит примерно в четверти эндгеймов, поэтому пост — только
     заметный вечер: ни одной из шести и больше (или одна из восьми), либо три и больше и не меньше половины. */
  const zr=rows.filter(r=>r.zp!=null), zn=zr.filter(r=>r.zp).length;
  if(!done.z && ((zn===0 && zr.length>=6) || (zn<=1 && zr.length>=8) || (zn>=3 && zn*2>=zr.length))){
    const best=rows.reduce((m,r)=>Math.min(m, r.place||999), 999);
    careerNews(zn<=1 ? 'flat' : 'good', 'ccPostZoneLuck', [zn, zr.length, best, zr.length%3]); posted=done.z=true;
  }
  if(posted){ try{ careerSave(); }catch(e){} }
}
/* ПРЕСС-КОНФЕРЕНЦИИ (16.10, его «делай» на «пресс-конференции как в FIFA»). После заметного вечера — победа, подиум,
   провал фаворита, серия из трёх сильных или трёх слабых вечеров, исход обещания — в «Центре» ждёт журналист: два-три
   вопроса, по три ответа разного тона. Ответ двигает форму, подписчиков, настрой напарника и репутацию (мелко — это
   приправа, не двигатель карьеры), уходит цитатой в ленту, а провокация зовёт ответ названного игрока сцены.
   ОБЕЩАНИЕ («цель на следующий турнир: топ-10 / только победа») проверяется следующим вечером: сдержал — большой плюс,
   нет — следующая пресс-конференция начнётся с этого. Карточка, а не окно посреди вечера: перемотка и симуляция недели
   её не ждут, неотвеченная гаснет через день без последствий. В игре вдвоём (ccMpOn) не бывает — форма читается обоими
   браузерами. Тексты — PRESS_TXT, 7 языков. */
const CC_PRESS_GAP=3;      // дней между пресс-конференциями (победа — без паузы)
const CC_PRESS_LIFE=1;     // сколько дней неотвеченная висит в «Центре»
// [форма, подписчики (% охвата, не меньше 20), напарник, репутация] на каждый из трёх ответов.
const CC_PRESS_EFF={
  win:   [[0.25,1,2,1],[0.5,3,0,0],[0.25,4,0,-1]],
  podium:[[0.25,1,2,1],[0.5,2,0,0],[0,3,0,-1]],
  flop:  [[0.25,0,2,1],[0.25,1,0,-1],[0.25,2,-10,-1]],
  hot:   [[0.25,1,2,1],[0.5,3,0,0],[0.25,4,0,-1]],
  cold:  [[0.5,0,2,1],[0.25,1,0,-1],[0,2,-10,-1]],
  kept:  [[0.25,1,0,1],[0.25,3,0,0],[0.5,2,0,0]],
  broke: [[0.25,0,0,1],[0,1,0,-1],[0,1,0,-2]],
  goal:  [[0,0,0,0],[0,1,0,0],[0,2,0,0]]};
// Исход обещания: [форма, подписчики, репутация].
/* Единица подписчиков с ответа (17.10, его «пресс конференции слишком много подписчиков дают»): было 1% охвата
   (не меньше 20) — за конференцию из 3–4 вопросов 5–10% аудитории, раз в три дня и с ростом от роста. Стало 0.15%
   (не меньше 5): конференция ≈ 1%, сдержанное обещание победы ≈ 1.5%. */
const CC_PRESSCONF_REACH=0.0015, CC_PRESSCONF_REACH_MIN=5;
function ccPressReachUnit(){ return Math.max(CC_PRESSCONF_REACH_MIN, careerReach()*CC_PRESSCONF_REACH); }
const CC_PRESS_PROMISE={kept:{top10:[0.5,5,2], win:[1,10,3]}, broke:{top10:[-0.25,-2,-1], win:[-0.5,-3,-2]}};
const PRESS_TXT={
  ru:{title:'Пресс-конференция', skip:'Пропустить', of:(p,n)=>'#'+p+' из '+n, tags:{form:'форма', fans:'подписчики', mate:'напарник', rep:'репутация', promise:'обещание — проверят на следующем турнире'},
    goalName:{top10:'топ-10', win:'победу'},
    q:{win:'Победа! Что сегодня решило турнир?', podium:c=>'#'+c.p+' из '+c.n+'. Довольны или чего-то не хватило?', flop:c=>'Вас ставили в фавориты, а итог — #'+c.p+'. Что случилось?',
       hot:'Третий сильный вечер подряд. В чём секрет формы?', cold:'Три слабых вечера подряд. Это кризис?', kept:c=>'Вы обещали '+c.g+' — и сделали. Что дальше?',
       broke:c=>'Вы обещали '+c.g+', а заняли #'+c.p+'. Что скажете?', goal:'И последнее: цель на следующий турнир?'},
    a:{win:['Командная работа и спокойный эндгейм. Завтра снова с нуля.','Мы просто лучшие в этом лобби. Привыкайте.',c=>'Спросите у '+c.r+' — он сегодня видел нас вблизи.'],
       podium:['Хороший вечер, пару ошибок в концовке разберём.','Ещё чуть-чуть — и это была бы победа. Следующая наша.',c=>c.r+' сегодня повезло с зоной, не больше.'],
       flop:['Ошиблись в эндгейме, разберём записи.','Лобби было случайным, мы лучше этого результата.',c=>c.mate ? 'Пару раз мы с '+c.mate+' разошлись по плану.' : 'Зона весь вечер была против меня.'],
       hot:['Режим и тренировки, никакой магии.','Я сейчас в лучшей форме в регионе.',c=>'Пусть догоняют. '+c.r+', ты следующий.'],
       cold:['Бывает. Работаем, результат вернётся.','Кризис? Поговорим после следующего турнира.',c=>c.mate ? 'Нам с '+c.mate+' надо поговорить внутри команды.' : 'Слишком много случайностей в лобби.'],
       kept:['Спасибо, но это только начало.','Я же говорил.','Теперь цель выше.'],
       broke:['Не справился. Отвечаю за слова — исправим.','Сезон длинный, ещё сделаем.','Обещания — это для прессы.'],
       goal:['Без обещаний — играем свою игру.','Топ-10.','Только победа.']},
    post:(me,q)=>'🎙 @'+me+' на пресс-конференции: «'+q+'»',
    rival:[me=>'@'+me+' смело. Увидимся в следующем капе 🙂',me=>'громкие слова от @'+me+'. посмотрим в лобби',me=>'@'+me+' запомню 👀'],
    kept:(me,g)=>'@'+me+' обещал '+g+' — и сдержал слово 👏', broke:(me,g,p)=>'@'+me+' обещал '+g+', а в итоге #'+p+'. Неловко.'},
  en:{title:'Press conference', skip:'Skip', of:(p,n)=>'#'+p+' of '+n, tags:{form:'form', fans:'followers', mate:'teammate', rep:'reputation', promise:'a promise — checked at the next tournament'},
    goalName:{top10:'a top 10', win:'a win'},
    q:{win:'A win! What decided the tournament today?', podium:c=>'#'+c.p+' of '+c.n+'. Happy, or was something missing?', flop:c=>'You were the favourites and finished #'+c.p+'. What happened?',
       hot:'Third strong night in a row. What is the secret?', cold:'Three weak nights in a row. Is this a crisis?', kept:c=>'You promised '+c.g+' — and delivered. What next?',
       broke:c=>'You promised '+c.g+' and finished #'+c.p+'. Your answer?', goal:'One last thing: the goal for the next tournament?'},
    a:{win:['Teamwork and a calm endgame. Tomorrow we start from zero.','We are simply the best in this lobby. Get used to it.',c=>'Ask '+c.r+' — he saw us up close today.'],
       podium:['A good night, we will review a couple of endgame mistakes.','So close to a win. The next one is ours.',c=>c.r+' just got lucky with the zone today.'],
       flop:['We messed up the endgame, we will review the VODs.','The lobby was random, we are better than this result.',c=>c.mate ? c.mate+' and I were not on the same plan a few times.' : 'The zone was against me all night.'],
       hot:['Routine and practice, no magic.','I am the best player in the region right now.',c=>'Let them catch up. '+c.r+', you are next.'],
       cold:['It happens. We keep working, the results will come back.','A crisis? Talk to me after the next tournament.',c=>c.mate ? c.mate+' and I need to talk inside the team.' : 'Too much randomness in the lobby.'],
       kept:['Thanks, but this is only the start.','I told you so.','Now the goal is higher.'],
       broke:['I did not deliver. I own my words — we will fix it.','The season is long, we will get there.','Promises are for the press.'],
       goal:['No promises — we play our game.','Top 10.','Only the win.']},
    post:(me,q)=>'🎙 @'+me+' at the press conference: “'+q+'”',
    rival:[me=>'@'+me+' bold. see you next cup 🙂',me=>'big words from @'+me+'. we will see in the lobby',me=>'@'+me+' noted 👀'],
    kept:(me,g)=>'@'+me+' promised '+g+' and delivered 👏', broke:(me,g,p)=>'@'+me+' promised '+g+' and finished #'+p+'. Awkward.'},
  fr:{title:'Conférence de presse', skip:'Passer', of:(p,n)=>'#'+p+' sur '+n, tags:{form:'forme', fans:'abonnés', mate:'coéquipier', rep:'réputation', promise:'une promesse — vérifiée au prochain tournoi'},
    goalName:{top10:'un top 10', win:'une victoire'},
    q:{win:'Victoire ! Qu’est-ce qui a fait la différence ce soir ?', podium:c=>'#'+c.p+' sur '+c.n+'. Satisfait, ou il manquait quelque chose ?', flop:c=>'Vous étiez favoris et vous finissez #'+c.p+'. Que s’est-il passé ?',
       hot:'Troisième grosse soirée d’affilée. Le secret de cette forme ?', cold:'Trois soirées ratées d’affilée. C’est la crise ?', kept:c=>'Vous aviez promis '+c.g+' — c’est fait. Et maintenant ?',
       broke:c=>'Vous aviez promis '+c.g+' et vous finissez #'+c.p+'. Votre réponse ?', goal:'Dernière question : l’objectif pour le prochain tournoi ?'},
    a:{win:['Travail d’équipe et un endgame calme. Demain on repart de zéro.','On est simplement les meilleurs de ce lobby. Habituez-vous.',c=>'Demandez à '+c.r+' — il nous a vus de près ce soir.'],
       podium:['Bonne soirée, on revoit deux-trois erreurs de fin de partie.','Si proche de la victoire. La prochaine est pour nous.',c=>c.r+' a juste eu de la chance avec la zone.'],
       flop:['On a raté l’endgame, on va revoir les VODs.','Le lobby était aléatoire, on vaut mieux que ça.',c=>c.mate ? 'Avec '+c.mate+', on n’avait pas le même plan plusieurs fois.' : 'La zone était contre moi toute la soirée.'],
       hot:['Routine et entraînement, pas de magie.','Je suis le meilleur joueur de la région en ce moment.',c=>'Qu’ils nous rattrapent. '+c.r+', tu es le prochain.'],
       cold:['Ça arrive. On travaille, les résultats reviendront.','La crise ? On en reparle après le prochain tournoi.',c=>c.mate ? 'On doit parler en interne avec '+c.mate+'.' : 'Trop de hasard dans le lobby.'],
       kept:['Merci, mais ce n’est que le début.','Je l’avais dit.','Maintenant l’objectif est plus haut.'],
       broke:['Je n’ai pas tenu parole. J’assume — on va corriger.','La saison est longue, on y arrivera.','Les promesses, c’est pour la presse.'],
       goal:['Pas de promesses — on joue notre jeu.','Top 10.','Seulement la victoire.']},
    post:(me,q)=>'🎙 @'+me+' en conférence de presse : « '+q+' »',
    rival:[me=>'@'+me+' audacieux. on se voit à la prochaine cup 🙂',me=>'grands mots de @'+me+'. on verra dans le lobby',me=>'@'+me+' noté 👀'],
    kept:(me,g)=>'@'+me+' avait promis '+g+' et a tenu parole 👏', broke:(me,g,p)=>'@'+me+' avait promis '+g+' et finit #'+p+'. Gênant.'},
  it:{title:'Conferenza stampa', skip:'Salta', of:(p,n)=>'#'+p+' su '+n, tags:{form:'forma', fans:'follower', mate:'compagno', rep:'reputazione', promise:'una promessa — verificata al prossimo torneo'},
    goalName:{top10:'una top 10', win:'una vittoria'},
    q:{win:'Vittoria! Cosa ha deciso il torneo stasera?', podium:c=>'#'+c.p+' su '+c.n+'. Soddisfatto o mancava qualcosa?', flop:c=>'Eravate i favoriti e chiudete #'+c.p+'. Cos’è successo?',
       hot:'Terza grande serata di fila. Il segreto della forma?', cold:'Tre serate storte di fila. È crisi?', kept:c=>'Avevi promesso '+c.g+' — e ce l’hai fatta. E adesso?',
       broke:c=>'Avevi promesso '+c.g+' e chiudi #'+c.p+'. Cosa rispondi?', goal:'Ultima cosa: l’obiettivo per il prossimo torneo?'},
    a:{win:['Lavoro di squadra e un endgame tranquillo. Domani si riparte da zero.','Siamo semplicemente i migliori di questa lobby. Abituatevi.',c=>'Chiedete a '+c.r+' — stasera ci ha visti da vicino.'],
       podium:['Bella serata, rivedremo un paio di errori nel finale.','Così vicini alla vittoria. La prossima è nostra.',c=>c.r+' è stato solo fortunato con la zona.'],
       flop:['Abbiamo sbagliato l’endgame, rivedremo le VOD.','La lobby era casuale, valiamo più di questo.',c=>c.mate ? 'Con '+c.mate+' non eravamo sullo stesso piano un paio di volte.' : 'La zona è stata contro di me tutta la sera.'],
       hot:['Routine e allenamento, nessuna magia.','Sono il miglior giocatore della regione adesso.',c=>'Che ci inseguano. '+c.r+', sei il prossimo.'],
       cold:['Capita. Lavoriamo, i risultati torneranno.','Crisi? Ne riparliamo dopo il prossimo torneo.',c=>c.mate ? 'Io e '+c.mate+' dobbiamo parlarne in squadra.' : 'Troppa casualità nella lobby.'],
       kept:['Grazie, ma è solo l’inizio.','Ve l’avevo detto.','Ora l’obiettivo è più alto.'],
       broke:['Non ce l’ho fatta. Rispondo delle mie parole — rimedieremo.','La stagione è lunga, ci arriveremo.','Le promesse sono per la stampa.'],
       goal:['Niente promesse — giochiamo il nostro gioco.','Top 10.','Solo la vittoria.']},
    post:(me,q)=>'🎙 @'+me+' in conferenza stampa: «'+q+'»',
    rival:[me=>'@'+me+' coraggioso. ci vediamo alla prossima cup 🙂',me=>'parole grosse da @'+me+'. vedremo in lobby',me=>'@'+me+' segnato 👀'],
    kept:(me,g)=>'@'+me+' aveva promesso '+g+' e ha mantenuto 👏', broke:(me,g,p)=>'@'+me+' aveva promesso '+g+' e chiude #'+p+'. Imbarazzante.'},
  pt:{title:'Coletiva de imprensa', skip:'Pular', of:(p,n)=>'#'+p+' de '+n, tags:{form:'forma', fans:'seguidores', mate:'parceiro', rep:'reputação', promise:'uma promessa — conferida no próximo torneio'},
    goalName:{top10:'um top 10', win:'uma vitória'},
    q:{win:'Vitória! O que decidiu o torneio hoje?', podium:c=>'#'+c.p+' de '+c.n+'. Satisfeito ou faltou algo?', flop:c=>'Vocês eram favoritos e terminaram em #'+c.p+'. O que aconteceu?',
       hot:'Terceira noite forte seguida. Qual o segredo da forma?', cold:'Três noites fracas seguidas. É crise?', kept:c=>'Você prometeu '+c.g+' — e cumpriu. E agora?',
       broke:c=>'Você prometeu '+c.g+' e terminou em #'+c.p+'. O que diz?', goal:'Última: qual a meta para o próximo torneio?'},
    a:{win:['Trabalho em equipe e um endgame calmo. Amanhã começa do zero.','Somos simplesmente os melhores deste lobby. Acostumem-se.',c=>'Pergunta pro '+c.r+' — ele viu a gente de perto hoje.'],
       podium:['Noite boa, vamos rever uns erros no final.','Quase a vitória. A próxima é nossa.',c=>c.r+' só teve sorte com a zona hoje.'],
       flop:['Erramos o endgame, vamos rever as VODs.','O lobby foi aleatório, somos melhores que isso.',c=>c.mate ? 'Eu e o '+c.mate+' não estivemos no mesmo plano algumas vezes.' : 'A zona esteve contra mim a noite toda.'],
       hot:['Rotina e treino, nada de mágica.','Sou o melhor jogador da região agora.',c=>'Que corram atrás. '+c.r+', você é o próximo.'],
       cold:['Acontece. Seguimos trabalhando, os resultados voltam.','Crise? Conversamos depois do próximo torneio.',c=>c.mate ? 'Eu e o '+c.mate+' precisamos conversar internamente.' : 'Aleatoriedade demais no lobby.'],
       kept:['Obrigado, mas é só o começo.','Eu avisei.','Agora a meta é mais alta.'],
       broke:['Não cumpri. Assumo minhas palavras — vamos corrigir.','A temporada é longa, a gente chega lá.','Promessa é coisa de imprensa.'],
       goal:['Sem promessas — jogamos o nosso jogo.','Top 10.','Só a vitória.']},
    post:(me,q)=>'🎙 @'+me+' na coletiva: “'+q+'”',
    rival:[me=>'@'+me+' corajoso. nos vemos na próxima cup 🙂',me=>'palavras grandes do @'+me+'. veremos no lobby',me=>'@'+me+' anotado 👀'],
    kept:(me,g)=>'@'+me+' prometeu '+g+' e cumpriu 👏', broke:(me,g,p)=>'@'+me+' prometeu '+g+' e terminou em #'+p+'. Constrangedor.'},
  de:{title:'Pressekonferenz', skip:'Überspringen', of:(p,n)=>'#'+p+' von '+n, tags:{form:'Form', fans:'Follower', mate:'Teamkollege', rep:'Ruf', promise:'ein Versprechen — wird beim nächsten Turnier geprüft'},
    goalName:{top10:'eine Top 10', win:'einen Sieg'},
    q:{win:'Sieg! Was hat heute das Turnier entschieden?', podium:c=>'#'+c.p+' von '+c.n+'. Zufrieden oder fehlte etwas?', flop:c=>'Ihr wart Favoriten und landet auf #'+c.p+'. Was ist passiert?',
       hot:'Dritter starker Abend in Folge. Was ist das Geheimnis?', cold:'Drei schwache Abende in Folge. Ist das eine Krise?', kept:c=>'Du hast '+c.g+' versprochen — und geliefert. Was jetzt?',
       broke:c=>'Du hast '+c.g+' versprochen und bist #'+c.p+' geworden. Deine Antwort?', goal:'Zum Schluss: das Ziel fürs nächste Turnier?'},
    a:{win:['Teamwork und ein ruhiges Endgame. Morgen fangen wir bei null an.','Wir sind einfach die Besten in dieser Lobby. Gewöhnt euch dran.',c=>'Fragt '+c.r+' — der hat uns heute aus der Nähe gesehen.'],
       podium:['Guter Abend, ein paar Fehler im Endgame schauen wir uns an.','So knapp am Sieg. Der nächste gehört uns.',c=>c.r+' hatte heute einfach Glück mit der Zone.'],
       flop:['Wir haben das Endgame verbockt, wir schauen die VODs.','Die Lobby war Zufall, wir sind besser als das.',c=>c.mate ? c.mate+' und ich hatten ein paarmal nicht denselben Plan.' : 'Die Zone war den ganzen Abend gegen mich.'],
       hot:['Routine und Training, keine Magie.','Ich bin gerade der beste Spieler der Region.',c=>'Sollen sie aufholen. '+c.r+', du bist der Nächste.'],
       cold:['Kommt vor. Wir arbeiten weiter, die Ergebnisse kommen zurück.','Krise? Reden wir nach dem nächsten Turnier.',c=>c.mate ? c.mate+' und ich müssen intern reden.' : 'Zu viel Zufall in der Lobby.'],
       kept:['Danke, aber das ist erst der Anfang.','Hab ich doch gesagt.','Jetzt ist das Ziel höher.'],
       broke:['Ich habe nicht geliefert. Ich stehe zu meinem Wort — wir korrigieren das.','Die Saison ist lang, wir schaffen das.','Versprechen sind für die Presse.'],
       goal:['Keine Versprechen — wir spielen unser Spiel.','Top 10.','Nur der Sieg.']},
    post:(me,q)=>'🎙 @'+me+' auf der Pressekonferenz: „'+q+'“',
    rival:[me=>'@'+me+' mutig. wir sehen uns im nächsten cup 🙂',me=>'große worte von @'+me+'. wir sehen uns in der lobby',me=>'@'+me+' notiert 👀'],
    kept:(me,g)=>'@'+me+' hat '+g+' versprochen und geliefert 👏', broke:(me,g,p)=>'@'+me+' hat '+g+' versprochen und ist #'+p+' geworden. Peinlich.'},
  es:{title:'Rueda de prensa', skip:'Saltar', of:(p,n)=>'#'+p+' de '+n, tags:{form:'forma', fans:'seguidores', mate:'compañero', rep:'reputación', promise:'una promesa — se comprueba en el próximo torneo'},
    goalName:{top10:'un top 10', win:'una victoria'},
    q:{win:'¡Victoria! ¿Qué decidió hoy el torneo?', podium:c=>'#'+c.p+' de '+c.n+'. ¿Contento o faltó algo?', flop:c=>'Erais favoritos y acabáis #'+c.p+'. ¿Qué pasó?',
       hot:'Tercera gran noche seguida. ¿El secreto de la forma?', cold:'Tres noches flojas seguidas. ¿Es una crisis?', kept:c=>'Prometiste '+c.g+' — y cumpliste. ¿Y ahora?',
       broke:c=>'Prometiste '+c.g+' y acabaste #'+c.p+'. ¿Qué dices?', goal:'Por último: ¿el objetivo para el próximo torneo?'},
    a:{win:['Trabajo en equipo y un endgame tranquilo. Mañana empezamos de cero.','Somos simplemente los mejores de este lobby. Acostumbraos.',c=>'Preguntadle a '+c.r+' — hoy nos vio de cerca.'],
       podium:['Buena noche, revisaremos un par de errores del final.','A nada de la victoria. La próxima es nuestra.',c=>c.r+' solo tuvo suerte con la zona hoy.'],
       flop:['Fallamos el endgame, revisaremos los VODs.','El lobby fue aleatorio, somos mejores que esto.',c=>c.mate ? c.mate+' y yo no tuvimos el mismo plan varias veces.' : 'La zona estuvo contra mí toda la noche.'],
       hot:['Rutina y entrenamiento, nada de magia.','Ahora mismo soy el mejor jugador de la región.',c=>'Que nos alcancen. '+c.r+', eres el siguiente.'],
       cold:['Pasa. Seguimos trabajando, los resultados volverán.','¿Crisis? Hablamos después del próximo torneo.',c=>c.mate ? c.mate+' y yo tenemos que hablar dentro del equipo.' : 'Demasiado azar en el lobby.'],
       kept:['Gracias, pero esto es solo el principio.','Os lo dije.','Ahora el objetivo es más alto.'],
       broke:['No cumplí. Respondo de mis palabras — lo arreglaremos.','La temporada es larga, llegaremos.','Las promesas son para la prensa.'],
       goal:['Sin promesas — jugamos nuestro juego.','Top 10.','Solo la victoria.']},
    post:(me,q)=>'🎙 @'+me+' en rueda de prensa: «'+q+'»',
    rival:[me=>'@'+me+' valiente. nos vemos en la próxima cup 🙂',me=>'palabras grandes de @'+me+'. lo veremos en el lobby',me=>'@'+me+' apuntado 👀'],
    kept:(me,g)=>'@'+me+' prometió '+g+' y cumplió 👏', broke:(me,g,p)=>'@'+me+' prometió '+g+' y acabó #'+p+'. Incómodo.'}};
function ccPressT(){ return PRESS_TXT[typeof LANG!=='undefined' ? LANG : 'en'] || PRESS_TXT.en; }
function ccPressMe(){ const pl=CAREER && CAREER.player; return (pl && (pl.nick||pl.handle)) || ''; }
// Текст ответа — из ключей, на языке, который сейчас открыт (запись в сейве — ситуация и номер ответа, не строка).
function ccPressAns(sit, ai, c){ const a=(ccPressT().a[sit]||PRESS_TXT.en.a[sit]||[])[ai]; return typeof a==='function' ? a(c||{}) : (a||''); }
function ccPressQ(sit, c){ const q=ccPressT().q[sit]; return typeof q==='function' ? q(c||{}) : (q||''); }
// Соперник для провокации: сильный человек своей сцены, не ты и не напарник; один на день.
function ccPressRival(){
  let pool=[]; try{ pool=(careerRosterNowEU()||[]).slice(); }catch(e){}
  const mate=careerMateRec(), mk=mate && mate.card ? hKey(mate.card) : '';
  pool=pool.filter(p=>p && p.handle && hKey(p)!==mk).sort((a,b)=>((b._ovr||b.rating||0)-(a._ovr||a.rating||0))).slice(0, 15);
  if(!pool.length) return '';
  return pool[careerRng(ccHashStr('press-rival|'+careerToday()))()*pool.length|0].handle;
}
/* Конец вечера (careerApplyGrowth): сначала исход обещания, потом — нужна ли пресс-конференция. beat — доля поля,
   которую ты обошёл; expected — доля, которую ты сильнее (то же, что считает рост). */
function ccPressAfterNight(place, total, expected){
  if(!CAREER || !CAREER.career || !(total>1)) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const cr=CAREER.career, today=careerToday(), beat=1-(place-1)/(total-1);
  cr.pressLog=(cr.pressLog||[]).concat([Math.round(beat*100)/100]).slice(-3);
  let res=null;
  const pr=cr.pressPromise;
  if(pr && pr.day<today && total>=10){
    const ok=pr.goal==='win' ? place===1 : place<=10;
    const e=CC_PRESS_PROMISE[ok?'kept':'broke'][pr.goal];
    cr.form=clamp((cr.form||0)+e[0], -CC_FORM_MAX, CC_FORM_MAX);
    careerReachAdd(Math.round(ccPressReachUnit()*e[1]), true);
    careerRepAdd(e[2]);
    careerNews(ok ? 'good' : 'bad', ok ? 'ccPostPressKept' : 'ccPostPressBroke', [ccPressMe(), pr.goal, place]);
    res={ok, goal:pr.goal, p:place};
    delete cr.pressPromise;
  }
  let sit=null;
  if(place===1) sit='win';
  else if(place<=3 && total>=20) sit='podium';
  else if(expected>=0.7 && beat<0.4) sit='flop';
  else if(cr.pressLog.length===3 && cr.pressLog.every(b=>b>=0.8)) sit='hot';
  else if(cr.pressLog.length===3 && cr.pressLog.every(b=>b<=0.35)) sit='cold';
  if(!sit && !res) return;
  if(!res && sit!=='win' && cr.pressLast && ccDaysBetween(cr.pressLast, today)<CC_PRESS_GAP) return;
  const qs=[];
  if(res) qs.push(res.ok ? 'kept' : 'broke');
  if(sit) qs.push(sit);
  if(!cr.pressPromise) qs.push('goal');
  const mate=careerMateRec();
  cr.press={day:today, qs, i:0, ctx:{p:place, n:total, r:ccPressRival(), mate:mate && mate.card ? mate.card.handle : '', g:res ? res.goal : ''}};
  cr.pressLast=today;
  if(sit==='hot' || sit==='cold') cr.pressLog=[];
}
function ccPressLive(){
  const cr=CAREER && CAREER.career, pr=cr && cr.press;
  if(!pr || !pr.qs || pr.i>=pr.qs.length) return null;
  if(ccDaysBetween(pr.day, careerToday())>CC_PRESS_LIFE){ cr.press=null; return null; }
  return pr;
}
// Что ответ сдвинет — словами, без чисел: [форма, подписчики, напарник, репутация].
function ccPressTags(e){
  const T=ccPressT().tags, out=[];
  if(e[0]) out.push((e[0]>0?'+':'−')+' '+T.form);
  if(e[1]) out.push((e[1]>0?'+':'−')+' '+T.fans);
  if(e[2]) out.push((e[2]>0?'+':'−')+' '+T.mate);
  if(e[3]) out.push((e[3]>0?'+':'−')+' '+T.rep);
  return out.join(' · ');
}
function ccPressCtx(pr){
  const c=Object.assign({}, pr.ctx);
  if(c.g) c.g=(ccPressT().goalName||{})[c.g]||c.g;
  return c;
}
function ccPressHTML(){
  const pr=ccPressLive(); if(!pr) return '';
  const T=ccPressT(), sit=pr.qs[pr.i], c=ccPressCtx(pr), eff=CC_PRESS_EFF[sit]||[];
  const mateless=!pr.ctx.mate;
  const btns=[0,1,2].map(ai=>{ const e=(eff[ai]||[0,0,0,0]).slice(); if(mateless) e[2]=0;
    return '<button class="cc-press-a" type="button" onclick="ccPressAnswer('+ai+')"><b>«'+esc(ccPressAns(sit, ai, c))+'»</b>'+
      ((sit==='goal' && ai>0) ? '<small>🤝 '+esc(T.tags.promise)+'</small>' : (ccPressTags(e) ? '<small>'+esc(ccPressTags(e))+'</small>' : ''))+'</button>'; }).join('');
  return '<div class="ch-tile cc-press"><div class="cc-press-h"><b>🎙 '+esc(T.title)+'</b><span>'+(pr.i+1)+' / '+pr.qs.length+'</span></div>'+
    '<p class="cc-press-q">'+esc(ccPressQ(sit, c))+'</p><div class="cc-press-as">'+btns+'</div>'+
    '<button class="cc-press-skip" type="button" onclick="ccPressSkip()">'+esc(T.skip)+'</button></div>';
}
function ccPressAnswer(ai){
  const pr=ccPressLive(); if(!pr) return;
  const cr=CAREER.career, sit=pr.qs[pr.i], e=(CC_PRESS_EFF[sit]||[])[ai]||[0,0,0,0];
  cr.form=clamp((cr.form||0)+e[0], -CC_FORM_MAX, CC_FORM_MAX);
  if(e[1]) careerReachAdd(Math.round(ccPressReachUnit()*e[1]), true);
  const mate=careerMateRec();
  if(e[2] && mate && pr.ctx.mate){ if(mate.patience==null) mate.patience=CAREER_PATIENCE_START; mate.patience=clamp(mate.patience+e[2], 0, 100); }
  if(e[3]) careerRepAdd(e[3]);
  if(sit==='goal' && ai>0) cr.pressPromise={goal:ai===2 ? 'win' : 'top10', day:careerToday()};
  // Цитата — первый ответ по делу (не «цель»), в ленту от прессы; провокация с ником — ответ этого игрока.
  if(sit!=='goal' && !pr.posted){
    pr.posted=true;
    careerNews('flat', 'ccPostPress', [ccPressMe(), sit, ai, pr.ctx.p, pr.ctx.n, pr.ctx.r, pr.ctx.mate, pr.ctx.g]);
    const provoke=ai===2 && /^(win|podium|hot)$/.test(sit) && pr.ctx.r;
    if(provoke) careerNews('flat', 'ccPostPressRival', [pr.ctx.r, ccPressMe(), ccHashStr(pr.day+pr.ctx.r)%3]);
  }
  pr.i++;
  if(pr.i>=pr.qs.length) cr.press=null;
  careerSave();
  careerRenderHub(CH_TAB);
}
function ccPressSkip(){ if(CAREER && CAREER.career){ CAREER.career.press=null; careerSave(); careerRenderHub(CH_TAB); } }
// Строки ленты: ключи живут в I18N.en (L() кладёт английский под каждый язык), текст — на открытом языке.
function ccPressPostText(me, sit, ai, p, n, r, mate, g){
  const T=ccPressT(), c={p, n, r, mate, g:g ? (T.goalName||{})[g]||g : ''};
  return T.post(me, ccPressAns(sit, ai, c));
}
/* ЛИЧКА ПОСЛЕ ВЕЧЕРА (16.10, его слова: «пусть Кинч в лс пишет разбор игрока и сравнение с тиммейтами», «и остальной
   стафф пишет что-то», «психолог советует», «чтоб разнообразие было»).
   — Kinch Analytics: разбор финала больше не пост в ленте, а личка: место, плейс, киллы, место в лобби по киллам и
     раскладка ВНУТРИ состава — киллы и урон каждого, доля урона. Делит тем же, чем «моя статистика» (ccKillWeights,
     ZoneReplay.killShare), и подводит итог: кто тащил.
   — Стафф, который нанят: коуч (план вечера и главное, что тренировать), аналитик (шторм, высадка, файты), психолог
     (после провала, серии, выгорания и после победы), SMM (сколько пришло подписчиков и что постить), маркетолог
     (бренды после сильного вечера). Только по делу, каждый не чаще раза в CC_STAFF_DM_GAP дня, за вечер не больше
     CC_STAFF_DM_MAX. Ничего не меняют в числах — это голоса, а не механика. В игре вдвоём молчат (ccMpOn). */
const CC_STAFF_DM_GAP=2, CC_STAFF_DM_MAX=2;
const CC_KINCH_WHO={handle:'Kinch Analytics', verified:true, roster:false, staff:'kinch'};
function ccStaffThread(who){ return careerDmFind(who.handle) || careerDmThread(who); }
function ccKinchDm(ranked, you, label){
  if(typeof ccMpOn==='function' && ccMpOn()) return false;
  const log=(you.stageLog||[]).filter(g=>g && g.place!=null);
  if(log.length<2) return false;
  const games=log.length, place=ranked.indexOf(you)+1;
  if(place<1) return false;
  const avg=log.reduce((s,g)=>s+g.place, 0)/games, elims=log.reduce((s,g)=>s+(g.elims||0), 0);
  const rk=ranked.filter(t=>t!==you && (t.stageElims||0)>elims).length+1;
  const t=ccStaffThread(CC_KINCH_WHO);
  /* 30.10, его «сделай кинчу в лс такой же разбор и как его посты в медиа»: при записи вечера по игрокам — разбор
     аналитика (ccEveningPlayers) одним сообщением, строками с эмодзи, как пост Кинча в ленте (ccKinchBoardText). */
  /* 30.10, его «пусть игрок сам пишет насчет разбора и может выбрать какого тимейта»: Кинч присылает только сводку,
     разбор по человеку — по кнопке в ветке (ccKinchPick), кого спросил, того и разбирает. Вечер лежит в cr.kinchNight,
     чтобы кнопки пережили перезагрузку страницы; новый вечер его заменяет. */
  let pl=null; try{ pl=ccEveningPlayers(careerToday()); }catch(e){ pl=null; }
  if(pl){
    CAREER.career.kinchNight={day:careerToday(), lbl:String(label), p:place, g:games, avg:avg.toFixed(1), rk, done:[],
      rows:pl.map(b=>[b.me ? '' : String(b.h), b.el, b.dmg, b.took, b.alive, b.place, b.top10, b.wins, b.pts])};
    careerDmPush(t, 'them', 'ccDmKinchSum', [label, place, games, avg.toFixed(1), elims, (elims/games).toFixed(1), rk]);
    return true;
  }
  careerDmPush(t, 'them', 'ccDmKinchSum', [label, place, games, avg.toFixed(1), elims, (elims/games).toFixed(1), rk]);
  // Раскладка внутри состава: доля каждого — по весам киллов (как в «моей статистике»), урон — той же долей.
  const sq=((you.squad||you._cards||you.cards)||[]).filter(c=>c && c.handle);
  if(sq.length>=2){
    let w=null; try{ w=ccKillWeights(sq); }catch(e){}
    if(w && w.length===sq.length){
      const sum=w.reduce((a,v)=>a+Math.max(0.01, v||0), 0), dmg=(you.mstats && you.mstats.dmgTo)||0;
      const me=hKey((CAREER.player && (CAREER.player.nick||CAREER.player.handle))||''), pc=careerCard && careerCard();
      const rows=sq.map((c,i)=>{
        let e=Math.round(elims*Math.max(0.01, w[i]||0)/sum);
        try{ if(typeof ZoneReplay!=='undefined' && ZoneReplay.killShare){ const v=ZoneReplay.killShare(elims, w, i); if(v!=null) e=v; } }catch(err){}
        const share=Math.round(Math.max(0.01, w[i]||0)/sum*100);
        const isMe=(pc && hKey(c)===hKey(pc)) || hKey(c)===me || !!c.isYou;
        return [String(c.handle), e, Math.round(dmg*share/100), share, isMe ? 1 : 0];
      });
      careerDmPush(t, 'them', 'ccDmKinchCmp', [rows]);
      const top=rows.slice().sort((a,b)=>b[3]-a[3])[0];
      careerDmPush(t, 'them', 'ccDmKinchVerdict', [top[0], top[4], top[3], ccHashStr(careerToday()+label)%2]);
    }
  }
  return true;
}
// Кто из стаффа нанят: [ключ, имя]. Коуч — по справочнику, остальные — по записи найма (ccStaffTermRecs).
function ccStaffOn(){
  const out=[];
  try{ (ccStaffTermRecs()||[]).forEach(r=>{ if(r && r.name && !(r.rec && r.rec.gone)) out.push([r.key, String(r.name)]); }); }catch(e){}
  return out;
}
function ccStaffAfterNight(place, total){
  if(!CAREER || !CAREER.career || !(total>1)) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const cr=CAREER.career, today=careerToday(), beat=1-(place-1)/(total-1);
  const last=cr.staffDm=(cr.staffDm && typeof cr.staffDm==='object') ? cr.staffDm : {};
  const rows=(CC_EVENING && CC_EVENING.day===today) ? CC_EVENING.rows : [];
  const deaths={kill:0, storm:0, surge:0, drop:0};
  rows.forEach(r=>{ if(r.place===1) return; if(r.dd) deaths.drop++; else if(r.dc==='storm') deaths.storm++; else if(r.dc==='surge') deaths.surge++; else if(r.dc) deaths.kill++; });
  const v=ccHashStr(today+'|'+place)%4;
  const lines=[];   // [вес, ключ стаффа, имя, ключ реплики, аргументы]
  const f=careerForm(), burn=careerBurnout();
  ccStaffOn().forEach(([k, name])=>{
    if(last[k] && ccDaysBetween(last[k], today)<CC_STAFF_DM_GAP) return;
    if(k==='coach'){
      const plan=rows.filter(r=>r.plan), ok=plan.reduce((n,r)=>n+r.plan.ok, 0), n=plan.reduce((n,r)=>n+r.plan.n, 0);
      const main=Object.entries(deaths).sort((a,b)=>b[1]-a[1])[0];
      if(n || (main && main[1]>=2)) lines.push([beat<0.5 ? 3 : 1, k, name, 'ccDmCoachNight', [ok, n, main && main[1]>0 ? main[0] : '', v]]);
    } else if(k==='analyst'){
      if(deaths.storm>=2) lines.push([3, k, name, 'ccDmAnStorm', [deaths.storm, v]]);
      else if(deaths.drop>=2) lines.push([3, k, name, 'ccDmAnDrop', [deaths.drop, v]]);
      else if(deaths.kill>=4 && beat<0.5) lines.push([2, k, name, 'ccDmAnFights', [deaths.kill, v]]);
      else if(beat>=0.8 && rows.length) lines.push([1, k, name, 'ccDmAnGood', [Math.round(rows.reduce((s,r)=>s+r.place,0)/rows.length*10)/10, v]]);
    } else if(k==='psych'){
      if(burn>0) lines.push([5, k, name, 'ccDmPsyBurn', [v]]);
      else if(beat<0.35 || f<=-1.5) lines.push([4, k, name, 'ccDmPsyBad', [v]]);
      else if(place===1) lines.push([2, k, name, 'ccDmPsyWin', [v]]);
      else if(f>=2) lines.push([1, k, name, 'ccDmPsyHot', [v]]);
    } else if(k==='smm'){
      const grow=(cr.reach||0)-(cr.smmSeen!=null ? cr.smmSeen : (cr.reach||0));
      cr.smmSeen=cr.reach||0;
      if(beat<0.3) lines.push([2, k, name, 'ccDmSmmBad', [v]]);
      else if(grow>=20) lines.push([beat>=0.8 ? 3 : 1, k, name, 'ccDmSmmGrow', [ccNum(grow), beat>=0.8 ? 1 : 0, v]]);
    } else if(k==='mkt'){
      if(place<=3 && total>=20) lines.push([2, k, name, 'ccDmMktBrands', [v]]);
    }
  });
  lines.sort((a,b)=>b[0]-a[0]).slice(0, CC_STAFF_DM_MAX).forEach(([w, k, name, key, args])=>{
    const t=ccStaffThread({handle:name, roster:false, staff:k});
    careerDmPush(t, 'them', key, args);
    last[k]=today;
  });
}
/* СЛУХИ, ОПРОСЫ, ТРЕНДЫ (16.10, его «3468» из «сделай соцсеть очень реалистично»). Аккаунты выдуманные — ни одного
   настоящего медиа. Roster Watch пишет слухи о составах: два настоящих игрока одной силы «скримятся вместе», и если на
   стыке сезона они правда объявят дуо — «called it ✅» (ccRumorConfirm из careerWorldDuos). После твоего подиума без
   клуба — «@ты на радаре у оргов». Comp Tea ☕ — драма в ответах, без последствий. FNCS Hub перед Мейджором и ЛАНом
   спрашивает «кто выиграет» — четыре самые сильные пары региона (и ты, если ты там), голос сохраняется, проценты — от
   силы с разбросом. Тренды справа считаются по ленте за неделю: кого упоминают и кто пишет (по лайкам), плюс #FNCS
   рядом с Мейджором и метка сезона. Клик по тренду — лента по нему. */
const CC_RUMOR_BY={name:'Roster Watch', handle:'rosterwatchfn', f:48000};
const CC_TEA_BY={name:'Comp Tea ☕', handle:'comptea', f:21000};
const CC_POLL_BY={name:'FNCS Hub', handle:'fncshub', f:65000};
function careerRumorTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const today=careerToday();
  if(cr.rumorNext && today<cr.rumorNext) return;
  const rnd=careerRng(ccHashStr('rumor|'+today+'|'+(cr.season||1)));
  const first=!cr.rumorNext;
  cr.rumorNext=ccAddDays(today, 5+Math.floor(rnd()*4));
  if(first) return;   // первый раз — только завести часы, не в день старта карьеры
  const me=ccHandle((CAREER.player && CAREER.player.nick)||''), v=Math.floor(rnd()*3);
  const top=(cr.log||[]).some(x=>x && x.day && x.place>0 && x.place<=3 && ccDaysBetween(x.day, today)<=7);
  if(top && !CAREER.org && rnd()<0.6){ careerNews('flat', 'ccPostRumorYou', [me, v], {by:CC_RUMOR_BY}); return; }
  let roster=[]; try{ roster=(careerRosterNowEU()||[]).filter(c=>c && c.handle && hKey(c)!==hKey(me)); }catch(e){}
  roster=roster.sort((a,b)=>ccCardOvr(b)-ccCardOvr(a)).slice(0, 80);
  if(roster.length<6) return;
  if(rnd()<0.2){
    const a=roster[Math.floor(rnd()*Math.min(40, roster.length))]; let b=a;
    for(let g=0; g<10 && b===a; g++) b=roster[Math.floor(rnd()*Math.min(40, roster.length))];
    if(b!==a) careerNews('flat', 'ccPostRumorDrama', [ccHandle(a.handle), ccHandle(b.handle), v], {by:CC_TEA_BY});
    return;
  }
  for(let g=0; g<20; g++){
    const a=roster[Math.floor(rnd()*roster.length)], oa=ccCardOvr(a);
    let mate=null; try{ mate=ccPairMateOf(a.handle); }catch(e){}
    const c=roster.filter(x=>x!==a && Math.abs(ccCardOvr(x)-oa)<=4 && !(mate && hKey(mate)===hKey(x)));
    if(!c.length) continue;
    const b=c[Math.floor(rnd()*c.length)];
    cr.rumors=(cr.rumors||[]).concat([{a:a.handle, b:b.handle, day:today}]).slice(-12);
    careerNews('flat', 'ccPostRumorPair', [ccHandle(a.handle), ccHandle(b.handle), v], {by:CC_RUMOR_BY});
    return;
  }
}
function ccRumorConfirm(a, b){
  const cr=CAREER && CAREER.career; if(!cr || !cr.rumors) return;
  const same=(x,y)=>hKey(x)===hKey(y);
  const r=cr.rumors.find(x=>!x.ok && ((same(x.a,a) && same(x.b,b)) || (same(x.a,b) && same(x.b,a))));
  if(!r) return;
  r.ok=1;
  careerNews('good', 'ccPostRumorTrue', [ccHandle(r.a), ccHandle(r.b)], {by:CC_RUMOR_BY});
}
// Варианты опроса: четыре самые сильные пары региона; ты — вместо четвёртой, если ты не слабее её.
/* Notion 21.10 (опрос «Who wins…»: «@mongraal & @wolfiez» и ниже «@mongraal»): карьера за карточку Mongraal, а его
   настоящая пара стояла в опросе рядом с ним самим. Пары, где сидит ты или кто-то из твоего состава, в варианты не
   идут; твой вариант — весь состав вечера (careerMates), а не ты с одним напарником. */
function ccPollOptions(){
  let mates=[]; try{ mates=(careerMates()||[]).filter(Boolean); }catch(e){}
  const mine=new Set(mates.map(c=>hKey(c)));
  try{ const P=CAREER.player; if(P.handle) mine.add(hKey({handle:P.handle})); if(P.nick) mine.add(hKey({handle:P.nick})); }catch(e){}
  let duos=[]; try{ duos=(careerPools().duos||[]).filter(d=>d && d.cards && d.cards.length>=2 && !d.cards.some(c=>mine.has(hKey(c)))); }catch(e){}
  duos=duos.slice().sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a)).slice(0, 4);
  const out=duos.map(d=>({l:'@'+ccHandle(d.cards[0].handle)+' & @'+ccHandle(d.cards[1].handle), o:ccDuoOvr(d)}));
  try{
    const ovrs=[ccMyShownOvr()].concat(mates.map(c=>ccCardOvr(c))), avg=ovrs.reduce((a,b)=>a+b, 0)/ovrs.length;
    if(out.length>=4 && avg>=out[3].o-1){
      const me=['@'+ccHandle(CAREER.player.nick||'')].concat(mates.map(c=>'@'+ccHandle(c.handle))).join(' & ');
      out[3]={l:me, o:avg, you:1};
    }
  }catch(e){}
  if(!out.length) return out;
  const rnd=careerRng(ccHashStr('poll|'+careerToday())), mx=Math.max(...out.map(x=>x.o));
  out.forEach(x=>{ x.w=Math.round(Math.exp((x.o-mx)/2.5)*(0.8+0.4*rnd())*1000); });
  return out;
}
function careerPollTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const days=careerYearDays(), today=careerToday();
  for(let d=1; d<=3; d++){
    const at=ccAddDays(today, d);
    const on=(days.get(at)||[]).filter(e=>e && (e.kind==='major' || e.kind==='gc'));
    if(!on.length) continue;
    const key='poll|'+at.slice(0, 7);
    cr.told=cr.told||{};
    if(cr.told[key]) return;
    cr.told[key]=1;
    const opts=ccPollOptions();
    if(opts.length<3) return;
    careerNews('flat', 'ccPostPollWin', [on[0].label||''],
      {by:CC_POLL_BY, poll:{o:opts.map(x=>x.l), w:opts.map(x=>x.w), end:at, v:null}});
    return;
  }
}
/* СПОР «КТО ЛУЧШЕ» (28.10, X: «Lets end the Debate. SHXRK: … MALIBUCA: … Who's better?»). Раз в 10–16 дней медиа-аккаунт
   ставит рядом двух соседей по Power Rankings из первой восьмёрки (не ты и не твой состав): место в PR, призовые за год,
   кубки, взятые на глазах у карьеры (CAREER.titles). Опрос на два дня; доли — от PR, как у опроса перед Мейджором. */
const CC_DEBATE_BY={name:'Comp Debates', handle:'compdebatesfn', f:42000};
function careerDebateTick(){
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const today=careerToday();
  if(cr.debateNext && today<cr.debateNext) return;
  const rnd=careerRng(ccHashStr('debate|'+today+'|'+(cr.season||1)));
  const first=!cr.debateNext;
  cr.debateNext=ccAddDays(today, 10+Math.floor(rnd()*7));
  if(first) return;
  const mine=new Set(); try{ (careerMates()||[]).forEach(c=>c && mine.add(hKey(c))); }catch(e){}
  let rows=[]; try{ rows=careerPrRows().map((r,i)=>Object.assign({rank:i+1}, r)).filter(r=>!r.you && !mine.has(hKey({handle:r.name}))).slice(0, 8); }catch(e){}
  if(rows.length<4) return;
  const i=Math.floor(rnd()*(rows.length-1)), a=rows[i], b=rows[i+1];
  let usd={}; try{ careerMoneyRows('year').forEach(r=>{ usd[hKey({handle:r.name})]=r.usd; }); }catch(e){}
  const T=CAREER.titles||{};
  const side=r=>[ccHandle(r.name), r.rank, Math.round(usd[hKey({handle:r.name})]||0), T[hKey({handle:r.name})]||0];
  const w=[a.pr, b.pr].map(p=>Math.round(p*(0.8+0.4*rnd())));
  careerNews('flat', 'ccPostDebate', [side(a), side(b), Math.floor(rnd()*2)],
    {by:CC_DEBATE_BY, poll:{o:['@'+ccHandle(a.name), '@'+ccHandle(b.name)], w, end:ccAddDays(today, 2), v:null}});
}
function ccPollHTML(n){
  const P=n && n.poll; if(!P || !P.o || !P.o.length) return '';
  const T=(typeof LANG!=='undefined' && LANG==='ru') ? {votes:'голосов', ends:'до', done:'Итоги'} : {votes:'votes', ends:'ends', done:'Final results'};
  const ended=careerToday()>P.end, voted=P.v!=null;
  let st={likes:0}; try{ st=ccPostStats(n, ccPostAuthor(n)); }catch(e){}
  const total=Math.max(12, Math.round(st.likes*2.2))+(voted?1:0);
  const sum=P.w.reduce((a,b)=>a+b, 0)||1;
  const pct=P.o.map((x,i)=>Math.round((P.w[i]/sum*(total-(voted?1:0))+(P.v===i?1:0))/total*100));
  const rows=(voted || ended)
    ? P.o.map((x,i)=>'<div class="x-poll-r'+(P.v===i?' me':'')+'"><i style="width:'+pct[i]+'%"></i><span>'+esc(x)+(P.v===i?' ✓':'')+'</span><b>'+pct[i]+'%</b></div>').join('')
    : P.o.map((x,i)=>'<button class="x-poll-b" onclick="careerPollVote(\''+esc(n.id||'')+'\','+i+')">'+esc(x)+'</button>').join('');
  return '<div class="x-poll">'+rows+'<small>'+ccNum(total)+' '+T.votes+' · '+(ended ? T.done : T.ends+' '+esc(ccDayLabel(P.end)))+'</small></div>';
}
function careerPollVote(id, i){
  const e=(CAREER.career.news||[]).find(n=>n && n.id===id);
  if(!e || !e.poll || e.poll.v!=null || careerToday()>e.poll.end) return;
  e.poll.v=i; careerSave(); careerRenderHub(CH_TAB);
}
function ccTrendsHTML(){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const today=careerToday(), score=new Map(), name=new Map();
  const add=(t, v)=>{ if(!t) return; const k=t.toLowerCase(); score.set(k, (score.get(k)||0)+v); if(!name.has(k)) name.set(k, t); };
  const me=hKey(ccHandle((CAREER.player && CAREER.player.nick)||''));
  (cr.news||[]).forEach(n=>{
    if(!n || !n.day || ccDaysBetween(n.day, today)>6) return;
    let who, st; try{ who=ccPostAuthor(n); st=ccPostStats(n, who); }catch(e){ return; }
    const w=Math.max(1, st.likes);
    let txt=''; try{ txt=String(ccText(n)).replace(/<[^>]+>/g, ' '); }catch(e){}
    // Ник — как пишет его сам человек (карточка), а не строчными из @-упоминания.
    (txt.match(/@([A-Za-z0-9_]+)/g)||[]).forEach(h=>{ const x=h.slice(1); if(hKey(x)===me) return; let c=null; try{ c=ccWhoCard(x); }catch(e){} add((c && c.handle) || x, w); });
    if(who && !who.you && !who.verified && !who.f && who.name) add(who.name, w*0.5);
  });
  try{
    const days=careerYearDays();
    for(let d=-2; d<=7; d++){ const on=(days.get(ccAddDays(today, d))||[]); if(on.some(e=>e && (e.kind==='major'||e.kind==='gc'))){ add('#FNCS', 40000); break; } }
    for(let d=0; d<=3; d++){ const on=(days.get(ccAddDays(today, d))||[]); if(on.some(e=>e && e.kind==='reload')){ add('#Reload', 9000); break; } }
    if(ccMetaOpen()) add(ccSeasonTag(today).short||'', 25000);
  }catch(e){}
  const list=[...score.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 5);
  if(!list.length) return '';
  const ru=(typeof LANG!=='undefined' && LANG==='ru');
  const T=ru ? {h:'Тренды', p:'В тренде в Fortnite', e:'Киберспорт · в тренде', posts:'постов'} : {h:'Trends for you', p:'Trending in Fortnite', e:'Esports · Trending', posts:'posts'};
  return '<div class="ch-tile x-trends"><h4>'+T.h+'</h4>'+list.map(([k,v],i)=>{ const t=name.get(k), tag=/^#/.test(t) || /^C\d+/.test(t);
    return '<button class="x-trend" onclick="careerTrend(\''+jsq(t)+'\')"><em>'+(i+1)+' · '+(tag ? T.e : T.p)+'</em><b>'+esc(t)+'</b><span>'+ccFollowers(Math.round(v/3)+40)+' '+T.posts+'</span></button>'; }).join('')+'</div>';
}
function careerTrend(t){ CH_FEED_Q=t||null; CH_SOCIAL='feed'; CH_FEED='all'; careerRenderHub('social'); }
/* СОВЕТ КОУЧА (Notion 15.10, фидбек: «the option to get a coach doesn't really do anything»; ответ игроку — «coach
   suggests…»). Нанятый коуч говорит, что выбрать: где у вариантов есть проценты (ccChoiceOdds — «X% выживают»), он берёт
   вариант с лучшим последним числом; где чисел нет — ход по умолчанию. Слабый коуч (прирост тренировки < 0.32) ошибается
   в каждом пятом совете. Онлайн и соло-вечер — молчит: лишний бросок развёл бы два браузера (CC_MP_ROLLS). */
function ccCoachOpinion(options, dflt, kind){
  if(!options || options.length<2 || typeof ccCoach!=='function') return null;
  if(typeof ccMpOn==='function' && ccMpOn()) return null;
  const c=ccCoach(); if(!c) return null;
  const last=o=>{ const m=String((o && o.note)||'').replace(/<[^>]+>/g,'').match(/(\d+(?:[.,]\d+)?)\s*%/g); return m ? parseFloat(m[m.length-1]) : null; };
  const scored=options.filter(o=>o && last(o)!=null);
  let pick=scored.length>=2 ? scored.reduce((a,b)=>last(b)>last(a) ? b : a) : dflt;
  // Есть план вечера — совет по нему (ccCoachPlanTarget); у вопроса без пункта плана — как раньше.
  const tg=ccCoachPlanTarget(kind, options.map(o=>o && o.id));
  if(tg){ const o=options.find(x=>x && x.id===tg); if(o) pick=o; }
  if((c.train||0)<0.32 && Math.random()<0.2){ const alt=options.filter(o=>o && o!==pick); pick=alt[Math.floor(Math.random()*alt.length)]||pick; }
  const say=L().ccCoachLeans;
  return {name:c.name, pick, text: typeof say==='function' ? say(String(pick.title||'').replace(/<[^>]+>/g,'')) : ''};
}
/* Оформление остановок вечера по типу решения. Цвет каждой взят из самой игры: высадка небо/автобус,
   точка золото сундука, лут фиолетовый эпик, фарм дерево, ротация стена шторма, середина оранжевый сёрдж,
   концовка красный последнего круга. Цвет только на полосе заголовка, кольце и метке хода по умолчанию,
   остальное синее стекло. Кольцо = круг шторма с номером зоны, догорает по ходу матча.
   У ходов в процентах под названием тонкая полоса той же краски, чтобы сравнивать взглядом. */
const CC_CHOICE_ZONES=11;
const CC_CHOICE_THEME={
  style: {th:'#ffd600', zone:1},    // стиль игры перед игрой — жёлтый W-key
  plan:  {th:'#6fe3d0', zone:1},    // план тренера перед вечером (ccPlanTitle) — бирюза штаба
  drop:  {th:'#5ec8ff', zone:1},    // автобус и небо
  site:  {th:'#ffc93c', zone:1},    // золото сундука
  loot:  {th:'#b46bff', zone:3},    // эпик из лестницы редкости
  farm:  {th:'#c98d4e', zone:3},    // дерево
  build: {th:'#c98d4e', zone:3},
  rot:   {th:'#7b6bff', zone:4},    // стена шторма
  mid:   {th:'#ff7a3d', zone:5},    // урон сёрджа
  heal:  {th:'#3ddc9a', zone:5},    // хилки
  mats:  {th:'#c98d4e', zone:5},
  late:  {th:'#ff3d6e', zone:8},    // последний круг
  moving:{th:'#b36bff', zone:10},   // двигающиеся круги, фиолет шторма
  last:  {th:'#ff3d6e', zone:11}
};
/* Кольцо круга: сколько вечера позади и на каком мы круге. Чистая геометрия, без
   анимации — у него в браузере всегда включён «меньше движения». */
function ccChoiceDial(t){
  if(!t || !t.zone) return '';
  const R=13, C=2*Math.PI*R, done=Math.max(0, Math.min(1, t.zone/CC_CHOICE_ZONES));
  return '<svg class="cc-dial" viewBox="0 0 34 34" aria-hidden="true">'+
    '<circle class="cc-dial-bg" cx="17" cy="17" r="'+R+'"></circle>'+
    '<circle class="cc-dial-on" cx="17" cy="17" r="'+R+'" stroke-dasharray="'+(C*done).toFixed(1)+' '+C.toFixed(1)+'"></circle>'+
    '<text x="17" y="17" class="cc-dial-n">'+t.zone+'</text></svg>';
}
// Ход, названный процентом («65%: держим середину», «33 in 100»), получает полосу шанса.
function ccChoiceOdds(note){
  const txt=String(note||'').replace(/<[^>]+>/g, ' ');
  // Три формы, которыми игра называет шанс: «65%», «33 in 100» и «40/60» (пара, дающая сто).
  const pair=txt.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
  const m=txt.match(/(\d{1,3})\s*(?:%|(?:in|из)\s*100)/);
  const v=m ? +m[1] : (pair && +pair[1]+ +pair[2]===100 ? +pair[1] : 0);
  if(!v || v>100) return '';
  return '<i class="cc-odds" style="--v:'+v+'%"></i>';
}
/* Пак картинками — пять ячеек, как хотбар: стволы, хилки, передвижение; ячейка носит цвет
   редкости, стак — числом в углу, без картинки — имя мелко. Отзыв: «добавь фотографии
   лут-пулу, если нет» — до этого пак в вопросе высадки и лута шёл строкой имён. */
function ccPackSlotsHTML(p){
  if(!p) return '';
  const items=[...(p.weapons||[]), ...(p.heals||[]), p.move].filter(Boolean).slice(0, 5);
  while(items.length<5) items.push(null);
  return '<span class="cc-pack">'+items.map(o=>{
    if(!o) return '<i class="empty"></i>';
    let h=''; try{ h=(typeof weaponIconHTML==='function' && weaponIconHTML(o, ccLootSet()))||''; }catch(e){ h=''; }
    const art=/<img/.test(h) ? h : '<span>'+esc(o.name)+'</span>';
    return '<i class="r-'+ccRarityKey(o.rarity)+'" title="'+esc(ccItemLabel(o))+'">'+art+(o.n>1 ? '<u>'+o.n+'</u>' : '')+'</i>';
  }).join('')+'</span>';
}
/* «Как это считается» под каждым вопросом — тестер, 16.09: «не ясно, как именно
   влияет лут, очки силы, ресы на результат матча, если б это было где-то
   прописано». Строки из словаря, числа — из тех же констант, что считают. */
function ccGameHowHTML(){
  const T=L();
  if(typeof T.ccGameHow!=='function') return '';
  let lines=[];
  try{
    lines=T.ccGameHow({full:CC_MATS_FULL, early:CC_MATS_EARLY_ZONE, zone:CC_MATS_ZONE, farm:CC_MATS_FARM, short:CC_MATS_FARM_SHORT,
      pen:CC_MATS_PEN, surge:CC_SURGE_FARM, surgePow:CC_SURGE_FARM_POW, decide:Math.round(CC_FIGHT.decide*100),
      trade:Math.round(CC_FIGHT.trade*100), fightPow:CC_FIGHT.pow, tradePow:CC_FIGHT.tradePow});
  }catch(e){ return ''; }
  return '<details class="cc-how"><summary>'+esc(T.ccGameHowTitle||'')+'</summary><ul>'+
    lines.map(l=>'<li>'+esc(l)+'</li>').join('')+'</ul></details>';
}
/* Открытое окно выбора. На широком экране оно живёт в body (cc-choice-side/over), а не в карте, поэтому те, кто
   дописывает в него чипы и тап по карте пути (ротация, концовка), берут его отсюда, а не поиском в карте. */
let CC_CHOICE_OPEN=null;
function ccChoiceIn(host){
  if(CC_CHOICE_OPEN && CC_CHOICE_OPEN.isConnected && (!host || CC_CHOICE_OPEN._host===host)) return CC_CHOICE_OPEN;
  const boxes=host ? host.querySelectorAll('.cc-choice') : [];
  return boxes.length ? boxes[boxes.length-1] : null;
}
function ccChoiceBox(title, hint, options, onMap, side, kind){
  /* Порядок кнопок — тот, что передали: сторожа кликают по data-at и ждут
     именно его. Правило «ход по умолчанию — первым» живёт там, где список
     собирают (см. ccAskMenu), а не здесь. */
  return ccMpIdle(new Promise(resolve=>{
    const host=onMap || document.getElementById('majorStages');
    const dflt=options.find(o=>o && o.def) || options[0];
    const mate=ccMateOpinion(options, dflt), coach=ccCoachOpinion(options, dflt, kind);
    // Что спросили и что выбрали — для плана коуча (ccCoachPlanScore). Только карьера.
    const baseKind=String(kind||'').replace(/:.*$/, '');
    if(typeof CAREER_RUN!=='undefined' && CAREER_RUN && baseKind) CC_GAME_OPTS[baseKind]=options.map(o=>o && o.id);
    let done=false;
    const answer=o=>{ if(done) return; done=true;
      if(typeof CAREER_RUN!=='undefined' && CAREER_RUN && baseKind && o) CC_GAME_PICKS[baseKind]=o.id;
      clearInterval(watch); clearTimeout(bell);
      // Чат эфира видел вопрос — видит и ответ. Только там, где вопрос стоял.
      if(box && typeof ccTvOnChosen==='function') ccTvOnChosen(o);
      if(box && box.isConnected) box.remove();
      resolve(o); };
    const auto=()=>answer(dflt);
    let box=null, watch=null, bell=null;
    // Симуляция спрошена отдельно от skipAnimation: высадку спрашивают ДО
    // первого этапа, когда флаг пропуска ещё не выставлен, и без этой проверки
    // вечер, отданный симуляции, всё равно останавливался бы на первом вопросе.
    if(!host || skipAnimation || careerSimOn() || (typeof CC_FF!=='undefined' && CC_FF)){
      resolve(dflt); return;
    }
    box=document.createElement('div');
    box.className=onMap ? 'cc-choice cc-choice-map' : 'stage-card cc-choice';
    // Тема остановки: краска момента и круг на заголовке (см. CC_CHOICE_THEME).
    const th=CC_CHOICE_THEME[String(kind||'').replace(/:.*$/, '')]||null;
    if(th){ box.dataset.th=String(kind).replace(/:.*$/, ''); box.style.setProperty('--th', th.th); }
    const sub=(side && (side.left||side.right)) || hint
      ? `<div class="cc-choice-sub">`+
        (side && side.left ? `<div class="cc-choice-ava">${side.left}</div>` : '')+
        (hint ? `<span>${hint}</span>` : '<span></span>')+
        (side && side.right ? `<div class="cc-choice-mini">${side.right}</div>` : '')+
        `</div>`
      : '';
    const mateLine=(mate ? `<div class="cc-choice-mate"><i>${esc(mate.name)}</i> ${esc(mate.text)}</div>` : '')+
      (coach ? `<div class="cc-choice-mate cc-choice-coach"><i>${esc(coach.name)}</i> ${esc(coach.text)}</div>` : '');
    box.innerHTML=`<div class="cc-choice-head"><b>${ccChoiceDial(th)}<span class="cc-choice-t">${esc(title)}</span></b>${sub}${mateLine}${ccGameHowHTML()}</div>`+
      `<div class="cc-choice-row">${options.map((o,i)=>
        `<button class="cc-choice-btn${o.art?' has-art':''}${o.icon?' has-ico':''}${o===dflt && options.length>1?' def':''}${mate && o===mate.pick?' mate':''}${coach && o===coach.pick?' coach':''}" data-at="${i}"${mate && o===mate.pick ? ' data-mate="'+esc(mate.name)+'"' : ''}${coach && o===coach.pick ? ' data-coach="'+esc(L().ccCoachTag)+'"' : ''}>
           ${o.art||''}<span class="cc-choice-tt">${o.icon?'<i class="cc-choice-ico'+(o.icoCls?' '+o.icoCls:'')+'">'+o.icon+'</i>':''}<b>${esc(o.title)}</b></span>${o.pack ? ccPackSlotsHTML(o.pack) : ''}${ccChoiceOdds(o.note)}<em>${o.note||''}</em></button>`).join('')}</div>`+
      `<div class="cc-choice-bar"><i></i></div>`;
    /* Широкий экран: вопрос посреди игры — поверх экрана по центру, а не окошком внутри карты боя (его скрин 19.11:
       ротация с картой пути и ходами зажата в карте и листается). В body: у карты бывает transform. Окно карты дропов
       (.cc-dm-ask) уже поверх экрана — там как было. Телефон — как было. */
    const over=!!(onMap && !(onMap.classList && onMap.classList.contains('cc-dm-ask')) && (window.innerWidth||0)>=900);
    if(over) box.classList.add('cc-choice-over');
    /* И не посреди экрана, а слева, на месте карты боя: таблица справа остаётся видна (его слово 19.11, как у лута:
       «все выборы пусть там показываются»). Рамка — по карте в окне; карта мала или не видна — по центру экрана. */
    if(over){
      const r=onMap.getBoundingClientRect(), top=Math.max(8, r.top), h=Math.min(r.bottom, window.innerHeight-8)-top;
      if(r.width>=560 && h>=380){
        box.classList.add('cc-choice-side');
        Object.assign(box.style, {left:Math.round(Math.max(0, r.left))+'px', top:Math.round(top)+'px', width:Math.round(r.width)+'px', maxHeight:Math.round(h)+'px'});
      }
    }
    (over ? document.body : host).appendChild(box);
    box._host=host; CC_CHOICE_OPEN=box;
    // По высоте — посередине карты, как стояло окошко внутри неё.
    if(box.classList.contains('cc-choice-side')){ const r=onMap.getBoundingClientRect(), top=Math.max(8, r.top), h=Math.min(r.bottom, window.innerHeight-8)-top;
      box.style.top=Math.round(top+Math.max(0, (h-box.offsetHeight)/2))+'px'; }
    // Чат эфира видит вопрос и начинает советовать. См. ccTvOnChoice.
    if(typeof ccTvOnChoice==='function') ccTvOnChoice(options);
    if(!onMap) box.scrollIntoView({block:'center',
      behavior:(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        ? 'auto' : 'smooth'});
    // Полоска времени: видно, что вопрос не будет ждать вечно, и сколько
    // осталось до того, как игра решит сама.
    const bar=box.querySelector('.cc-choice-bar i');
    if(bar){ bar.style.transition='transform '+CC_CHOICE_WAIT+'ms linear';
             requestAnimationFrame(()=>{ bar.style.transform='scaleX(0)'; }); }
    box.querySelectorAll('.cc-choice-btn').forEach(b=>{
      b.onclick=()=>answer(options[+b.dataset.at]);
    });
    // Читает «как это считается» — вопрос ждёт: полоска встаёт, звонок снимается.
    const how=box.querySelector('.cc-how');
    if(how) how.addEventListener('toggle', ()=>{
      if(!how.open) return;
      clearTimeout(bell); bell=null;
      if(bar){ bar.style.transition='none'; bar.style.transform='scaleX(1)'; }
    });
    // Тронул карту (точка пути, ccAskPath) — тоже ждём: человек выбирает руками.
    box.querySelectorAll('[data-hold]').forEach(el=>el.addEventListener('pointerdown', ()=>{
      clearTimeout(bell); bell=null;
      if(bar){ bar.style.transition='none'; bar.style.transform='scaleX(1)'; }
    }));
    // Скип, нажатый посреди вопроса, тоже отвечает — иначе кнопка «пропустить»
    // переставала пропускать ровно там, где это нужнее всего.
    watch=setInterval(()=>{ if(skipAnimation) auto(); }, 120);
    // И вопрос, на который никто не ответил, отвечает сам.
    bell=setTimeout(auto, CC_CHOICE_WAIT);
  }));
}
/* Чем кончилось решение — на той же карте, где его принимали.

   Правка: «может пусть пишет удачно или нет». Монетка хайграунда решается
   молча, и без ответа выбор читается как кнопка без последствий: ты нажал,
   игра поехала дальше, а повезло или нет — знает только счёт в конце. Поэтому
   на месте панели на пару секунд встаёт плашка: что вышло и что это дало.

   Под скипом и в перемотке не показывается вовсе — там некому смотреть. */
function ccChoiceResult(map, text, ok){
  return new Promise(resolve=>{
    if(ccAskRivalName()){ resolve(); return; }   // чужой ответ — строкой в логе, не баннером
    if(!map || skipAnimation || careerSimOn() ||
       (typeof CC_FF!=='undefined' && CC_FF)){ resolve(); return; }
    const tag=document.createElement('div');
    tag.className='cc-choice-out'+(ok===false?' bad':(ok?' good':''));
    tag.innerHTML=`<b>${esc(text)}</b>`;
    map.appendChild(tag);
    // И чат эфира знает, чем кончилось. См. ccTvOnResult.
    if(typeof ccTvOnResult==='function') ccTvOnResult(ok);
    setTimeout(()=>{ tag.classList.add('out'); }, 1500);
    setTimeout(()=>{ tag.remove(); resolve(); }, 1900);
  });
}
/* ПОВТОР СМЕРТИ — из его списка идей 6 сентября: после вылета показать, кто и
   чем выбил, откуда и на чём стояли. Движок знает причину (deathCause — шторм,
   сёрдж или имя команды), зону, место, чистый урон и где стояли оба отряда;
   ствол убийцы — из его пака (сундуки на точке есть у всех, ccRoomSite).
   Дистанция — словами по шкале движка: вплотную (до CONTACT_RANGE 2.2), с
   соседней постройки (до CHIP_RANGE 4.4), издалека. Карточка стоит на карте
   три секунды и под скипом/симуляцией/перемоткой не показывается. */
const CC_DEATH_NEAR=2.2, CC_DEATH_MID=4.4, CC_DEATH_MS=3200;
function ccDeathInfo(you, game){
  const sq=you && you._sq;
  if(!sq || sq.alive) return null;
  const cause=sq.deathCause;
  const killer=(cause && cause!=='storm' && cause!=='surge' && game && game.squads)
    ? game.squads.find(s=>s.team && s.team.name===cause) : null;
  let range=null;
  if(killer){
    const d=Math.hypot((killer.x||0)-(sq.x||0), (killer.y||0)-(sq.y||0));
    range = d<=CC_DEATH_NEAR ? 'close' : d<=CC_DEATH_MID ? 'near' : 'far';
  }
  const gun=killer && killer.team._loot && killer.team._loot.weapons && killer.team._loot.weapons[0];
  const net=Math.round((sq.dealt||0)-(sq.taken||0));
  return {zone:sq.zoneReached||0, cause:cause||'', who:killer ? String(killer.team.name||'').replace(/<[^>]+>/g,'').trim() : '',
          gun:gun ? gun.name : '', range, place:sq.place||0, net:net, elims:sq.elims||0,
          surge:ccSurgeGapAt(game && game.frames ? game.frames() : null, net)};
}
/* Шторм и сюрдж своего года (29.10, его «в каждом чаптере были разные зоны и сюрдж правила»): таблица из
   ZoneSim.phasesFor по дню карьеры, вне карьеры по сезону острова. Reload: своя таблица, как была.
   CC_GAME_PHASES: таблица последней игры, по ней HUD считает порог следующего круга. */
let CC_GAME_PHASES=null;
const CC_STORM_DAY={g:'2019-03-01', h:'2019-08-01', i:'2020-06-01', j:'2021-06-01', k1:'2022-03-15', k2:'2022-06-15', k3:'2022-09-01',
  e:'2023-06-01', f:'2024-06-01', t:'2025-06-01'};
function ccStormDay(set){
  try{ if(CAREER_RUN && typeof CAREER!=='undefined' && CAREER && CAREER.career) return careerToday(); }catch(e){}
  const k=String(set||'');
  return CC_STORM_DAY[k] || CC_STORM_DAY[k.charAt(0)] || '';
}
function ccStormPhases(set, squadSize){
  // Вид шторма на карте (zone-replay stormLook): Главы 1–2 до 5.12.2021, Главы 3–5 до 1.12.2024, дальше нынешний.
  const day=ccStormDay(set);
  try{ window.CC_STORM_LOOK=!day ? 'c6' : day<'2021-12-05' ? 'c1' : day<'2024-12-01' ? 'c3' : 'c6'; }catch(e){}
  if(/^r\d$/.test(set)){ CC_GAME_PHASES=ZoneSim.reloadPhasesFor ? ZoneSim.reloadPhasesFor(day) : ZoneSim.RELOAD_PHASES; return CC_GAME_PHASES; }
  CC_GAME_PHASES=ZoneSim.phasesFor ? ZoneSim.phasesFor(ccStormDay(set), squadSize) : null;
  return CC_GAME_PHASES || undefined;
}
/* Число сёрджа, как его пишет HUD («149 ABOVE DAMAGE THRESHOLD»): чистый урон
   отряда минус линия отсечки последнего кадра. Пока сёрдж никого не бьёт, но
   живых больше порога следующего круга — линия предварительная, тем же
   правилом, что у панели набора (k-й снизу по чистому урону). null — сёрджа
   нет. Отзыв: «пиши количество сюрджа, а не урона за игру» — урон за
   игру у нас выше реального (≈2300 против 1400–2000 в реплеях), а число над
   линией откалибровано по ним (career-surge-you-probe). */
function ccSurgeGapAt(frames, net){
  const f=frames && frames.length ? frames[frames.length-1] : null;
  if(!f) return null;
  if(f.surgeAt>0 && f.surgeLine!=null) return Math.round(net-f.surgeLine);
  const reload=/^r[0-9]$/.test(String(typeof ACTIVE_LANDING_SET!=='undefined' ? ACTIVE_LANDING_SET : ''));
  const nextPh=(!reload && typeof ZoneSim!=='undefined' && ZoneSim.PHASES) ? (CC_GAME_PHASES||ZoneSim.PHASES)[f.zone] : null;
  const nextAt=nextPh && isFinite(nextPh.surgeAt) ? nextPh.surgeAt : 0;
  if(!(f.zone>=2 && nextAt>0 && f.players>nextAt)) return null;
  const alive=(f.dots||[]).filter(x=>x && x.alive);
  if(!alive.length) return null;
  const per=Math.max(1, f.players/alive.length);
  const nets=alive.map(x=>Number(x.n)||0).sort((a,b)=>a-b);
  const k=Math.min(nets.length-1, Math.ceil((f.players-nextAt)/per));
  return Math.round(net-nets[k]);
}
function ccDeathCard(map, info){
  return new Promise(resolve=>{
    if(!map || !info || skipAnimation || careerSimOn() ||
       (typeof CC_FF!=='undefined' && CC_FF)){ resolve(); return; }
    const T=L();
    const how = info.cause==='storm' ? T.ccDeathStorm : info.cause==='surge' ? T.ccDeathSurge
      : T.ccDeathBy(info.who, info.gun, info.range ? T.ccDeathRange[info.range] : '');
    const tag=document.createElement('div');
    tag.className='cc-choice-out bad cc-death';
    const sg = info.surge==null ? T.ccDeathSurgeOff : info.surge<0 ? T.ccDeathSurgeBelow(ccNum(-info.surge)) : T.ccDeathSurgeAbove(ccNum(info.surge));
    tag.innerHTML='<b>'+esc(T.ccDeathTitle(info.zone))+'</b><span>'+esc(how)+'</span><em>'+esc(T.ccDeathStats(info.place, sg, info.elims))+'</em>';
    map.appendChild(tag);
    setTimeout(()=>{ tag.classList.add('out'); }, CC_DEATH_MS-400);
    setTimeout(()=>{ tag.remove(); resolve(); }, CC_DEATH_MS);
  });
}
/* Лут середины игры. Пак — два ствола, две хилки и мувмент; тиммейт разбирает
   свой сам («тимейт сам выбирает»), поэтому его прибавка считается без
   вопросов и по такому же паку. */
/* Соседняя точка стоит риска: чужой POI занят, добежать до круга с полным инвентарём выходит не всегда.
   Свой пак +0, соседняя +4, шанс 40/60, при провале «лишний урон» и минус power. Своя точка теперь база, поэтому
   ccLootPow и прибавка за напарника убраны: сила идёт от решения, а не от выпавших предметов.
   Ожидание пробежки 0.4·4 - 0.6·2 = +0.4. Та же форма, что у хайграунда: потолок выше, ожидание ниже. */
/* Действия на точке. Первая остановка до того, как кто-то сдвинулся (playTo(1) ничего не играет).
   Своя точка: сундуки открываются молча. Чужие на точке: по сундуку каждому и вопрос, файтить или уйти.
   Шансы редкости: из сундука Common не падает (вики Fortnite, Chest), остальное по датамайну
   (mein-mmo.de, Hypex Ch2S5) без common: uncommon больше половины, rare под треть, epic/legendary единицы %.
   Таблицы Ch7 Epic не публикует, сумма 1. Сундуков 8 на точке, 4 если уйти на соседнюю (порядок, не замер).
   Класс ствола из поля icon пула (rifle/shotgun/...). */
const CC_CHEST_RARITY={common:0, uncommon:0.57, rare:0.31, epic:0.09, legendary:0.03};
const CC_CHESTS_POI=8, CC_CHESTS_LEAVE=4, CC_CHEST_CONSUMABLE=0.6;
/* Сундуков на точке — по луту КОРОБКИ, а не одной цифрой на всех (его список
   7.09: «сундуки плавно по коробке вместо 8/4»). Лут коробки — считанные с вики
   сундуки и ящики (ZONE_STATS.loot, build-2025-zone-loot.js); середина острова
   (медиана коробок с лутом) = CC_CHESTS_POI, дальше пропорционально, в пределах
   CC_CHESTS_MIN…CC_CHESTS_MAX. Пустое поле (loot 0) — минимум. Уходя на соседнюю —
   доля её сундуков (CC_CHESTS_LEAVE_SHARE = прежние 4 из 8): часть уже открыта, пока
   летели. Остров без счётного лута — по-старому 8/4. Пропорция и края — порядок
   величины, как и сама восьмёрка, не замер. */
const CC_CHESTS_MIN=2, CC_CHESTS_MAX=14, CC_CHESTS_LEAVE_SHARE=CC_CHESTS_LEAVE/CC_CHESTS_POI;
/* СУНДУКОВ НА ТОЧКЕ — КАК В ИГРЕ (отзыв: «сундуков на локациях, как в
   настоящем фортнайте, как на fortnite gg»). У коробки поле chests — сколько сундуков
   стоит в ней на самом деле: s42/s42solo считаны по точкам fortnite.gg (патч 42.03,
   tools/build-fgg-chests.js, кадр сведён по 30 локациям с расхождением ≤1.7 %), у
   остальных островов — с инфобоксов локаций на вики (build-2025-zone-loot.js). Такая
   коробка отдаёт своё число как есть (Battlewoods с окрестностями — 117, пустой
   берег — 0); коробка без счёта — по луту, как ниже. Открывает же отряд не всё:
   CC_CHESTS_OPEN_PER_PLAYER на игрока до первой зоны (ccSiteOpen) — РЕШЕНИЕ, не замер
   (в JSON реплеев Tracker сундуков нет); в пак идут только открытые. */
const CC_CHESTS_OPEN_PER_PLAYER=12;
// Чей счёт сундуков у острова — CC_CHESTS_SRC рядом с useLandingSet; подпись в подсказке точки.
const ccSiteSrc=()=>CC_CHESTS_SRC[(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '']||'';
const ccSiteReal=zone=>!!(zone && zone.chests!=null);
function ccSiteOpen(n){
  const cap=CC_CHESTS_OPEN_PER_PLAYER*Math.max(1, (typeof squadSize==='number' && squadSize) || 1);
  return Math.max(1, Math.min(Math.round(n), cap));
}
/* СУНДУКИ СТОЯТ НЕ ВСЕ (его «сундуки не 100% с какого-то сезона», 13.11). Вики Fortnite, Chest: v14.00 (27.08.2020) —
   спавн обычного сундука 50 %, v28.00 (3.12.2023) — 40 %. Счёт fortnite.gg и инфобоксов вики — это места сундуков, поэтому
   стоит из них доля спавна на дату. До v14.00 вики доли не называет — там как было, все места. Дата — день карьеры, вне карьеры
   — остров (2019/m* без доли, j/k/e* 50 %, f/t/s/r* 40 %). Комнате то же правило (ccRoomSite зовёт эту же функцию). */
const CC_CHEST_SPAWN=[['2023-12-03', 0.4], ['2020-08-27', 0.5]];
function ccChestSpawnRate(){
  let d='';
  try{ if(typeof CAREER!=='undefined' && CAREER && CAREER.career && typeof careerToday==='function') d=String(careerToday()||''); }catch(e){ d=''; }
  if(!d){ const k=String((typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '');
    d=/^[ftsr]/.test(k) ? '2024-01-01' : /^[jke]/.test(k) ? '2021-06-01' : '2019-01-01'; }
  for(const [from, r] of CC_CHEST_SPAWN) if(d>=from) return r;
  return 1;
}
// Сколько точек списка (плоский [x,y,…] в процентах картинки) внутри коробки.
function ccLrCount(list, z){ let n=0; if(list && z) for(let i=0;i+1<list.length;i+=2){ const x=list[i], y=list[i+1]; if(x>=z.x && x<=z.x+z.w && y>=z.y && y<=z.y+z.h) n++; } return n; }
function ccSiteChests(zone, share){
  share = share==null ? 1 : share;
  if(ccSiteReal(zone)){
    // У fortnite.gg часть сундуков с золотой обводкой — «100% spawn rate»: они стоят всегда, доля спавна только у остальных.
    const src=(typeof ccLrSrc==='function') ? ccLrSrc((typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '') : null;
    const g=src && src.g ? Math.min(zone.chests, ccLrCount(src.g, zone)) : 0;
    return Math.max(0, Math.round((g+(zone.chests-g)*ccChestSpawnRate())*share));
  }
  let n=CC_CHESTS_POI;
  const zones=(typeof ALL_LANDING_ZONES!=='undefined') ? ALL_LANDING_ZONES : [];
  const loots=zones.map(z=>z.loot).filter(v=>v>0).sort((a,b)=>a-b);
  if(zone && loots.length && zone.loot!=null){
    const med=loots[Math.floor(loots.length/2)];
    n = zone.loot>0 ? Math.max(CC_CHESTS_MIN, Math.min(CC_CHESTS_MAX, Math.round(CC_CHESTS_POI*zone.loot/med))) : CC_CHESTS_MIN;
  }
  return Math.max(1, Math.round(n*share));
}
/* Класс ствола из сундука — таблица Hypex по Chapter 2 Season 5 (Sportskeeda,
   «data miner reveals how chest loot pool works»): AR 43 %, дробовик 22 %,
   ПП 14 %, пистолет 11 %, снайперка 10 %. Единственная опубликованная таблица
   классов; для Ch7 Epic её не даёт. Классов, которых в пуле сезона нет,
   в броске не бывает — веса перенормируются на те, что есть. Раньше класс
   выпадал равновероятно по списку имён пула: пистолетов было 25 %, снайперка
   шла винтовкой. */
const CC_CHEST_CLASS={rifle:0.43, shotgun:0.22, smg:0.14, pistol:0.11, sniper:0.10};
// Что из пула расходников не хилка и не мувмент — ключи, удочки, сигналка, золотая
// рыба. В слот хилки из сундука не идёт (отзыв: «epic карт не надо»).
// И рыба: она ловится удочкой, а не лежит в сундуках (тестер, 16.09: «в инвентаре постоянно
// рыба, хотелось бы, чтобы хил настоящий был»). Хилки из сундука — зелья, аптечки, бинты, чаги.
const CC_CHEST_NOT_HEAL=['Epic Vault Keycard','Vault Key','Fishing Rod','Pro Fishing Rod','Harpoon Gun','Flare Gun','Bass Boost','Mythic Goldfish',
                         'Flopper','Spicy Fish','Slurpfish','Shield Fish','Jellyfish','Midas Flopper','Small Fry','Small Fries','Hop Flopper','Thermal Fish','Zero Point Fish','Vendetta Flopper','Stink Flopper','Cuddle Fish'];
const ccIsHealItem=x=>x && CC_MOVE_ITEMS.indexOf(x.name)<0 && CC_CHEST_NOT_HEAL.indexOf(x.name)<0;
function ccChestClass(rng, weapons){
  const have={}; weapons.forEach(w=>{ have[w.icon]=1; });
  const keys=Object.keys(CC_CHEST_CLASS).filter(k=>have[k]);
  if(!keys.length) return null;
  const tot=keys.reduce((a,k)=>a+CC_CHEST_CLASS[k], 0);
  let r=rng()*tot;
  for(const k of keys){ r-=CC_CHEST_CLASS[k]; if(r<0) return k; }
  return keys[keys.length-1];
}
// Преимущество первого сундука в стычке на высадке — его числа «+1 +3 +7», в
// процентных пунктах к шансу (CC_SITE_EDGE_PP за очко).
const CC_LOOT_EDGE={common:0, uncommon:1, rare:3, epic:7, legendary:7, mythic:7};
const CC_SITE_EDGE_PP=0.02;
function ccChestRarity(rng){
  const r=rng(); let acc=0;
  for(const k of RARITY_LADDER){ acc+=CC_CHEST_RARITY[k]||0; if(r<acc) return k; }
  return 'uncommon';
}
// Один сундук: сначала класс (CC_CHEST_CLASS), потом редкость (CC_CHEST_RARITY);
// ствол этого класса этой редкости, если такой редкости у класса нет — ближайшая
// ниже, если класс пуст совсем — любой ствол пула. С шансом CC_CHEST_CONSUMABLE —
// расходник.
function ccChestRoll(rng, set){
  const pool=ccLootPool(set);
  const cls=ccChestClass(rng, pool.weapons);
  const inCls=cls ? pool.weapons.filter(w=>w.icon===cls) : pool.weapons;
  const rar=ccChestRarity(rng);
  let cands=inCls.filter(w=>w.rarity===rar);
  for(let i=RARITY_LADDER.indexOf(rar)-1; !cands.length && i>=0; i--) cands=inCls.filter(w=>w.rarity===RARITY_LADDER[i]);
  if(!cands.length) cands=inCls.length ? inCls : pool.weapons;
  const weapon=cands[Math.floor(rng()*cands.length)];
  const hs=pool.heals.filter(x=>ccIsHealItem(x) || CC_MOVE_ITEMS.indexOf(x.name)>=0);
  const cons = rng()<CC_CHEST_CONSUMABLE ? hs[Math.floor(rng()*hs.length)] : null;
  return {weapon, cons};
}
// Пак по правилу «два ствола разных классов, две хилки, мувмент» — из того, что выпало.
/* МЕТА ПРО ПО СЕЗОНАМ (29.10, его «посмотри лут метовый у про игроков в инвентаре, чтоб игроки и боты брали нужное»).
   r — автоматы, s — дробовики, m — передвижение; порядок — что про берёт первым, если лежит и то и другое.
   Только сезоны, где мету удалось подтвердить (HIGH/MED в tools/measured/meta-loadouts.md); остальные острова — как было,
   по редкости. Мета берёт верх над стволом на ступень редче; что вытеснено, уходит в dropped — сила пака (ccPackPow)
   считает его как раньше, поэтому мета меняет руки, а не силу. */
const CC_META_BY_SET={"h1":{"r":["Assault Rifle","Heavy Assault Rifle","Tactical Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun","Tactical Shotgun"],"m":["Rift-To-Go","Shockwave Grenade"]},"h3":{"r":["Assault Rifle","Heavy Assault Rifle","Suppressed Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun","Tactical Shotgun"],"m":["Shockwave Grenade","Junk Rift"]},"h4":{"r":["Assault Rifle","Burst Assault Rifle","Heavy Assault Rifle"],"s":["Pump Shotgun","Tactical Shotgun"],"m":[]},"i1":{"r":["Assault Rifle","Burst Assault Rifle"],"s":["Pump Shotgun","Tactical Shotgun"],"m":["Crash Pad"]},"i2":{"r":["Assault Rifle","Burst Assault Rifle"],"s":["Charge Shotgun","Tactical Shotgun"],"m":["Crash Pad"]},"i3":{"r":["Assault Rifle","Burst Assault Rifle","Scoped Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun"],"m":["Shockwave Grenade","Crash Pad","Stark Jetpack"]},"j1":{"r":["Heavy Assault Rifle","Assault Rifle"],"s":["Charge Shotgun","Lever Action Shotgun","Tactical Shotgun"],"m":["Shockwave Grenade"]},"j2":{"r":["Assault Rifle","Primal Rifle","Infantry Rifle","Makeshift Rifle"],"s":["Pump Shotgun","Primal Shotgun","Tactical Shotgun"],"m":["Shockwave Grenade"]},"j3":{"r":["Assault Rifle","Burst Assault Rifle","Heavy Assault Rifle"],"s":["Pump Shotgun","Tactical Shotgun","Lever Action Shotgun"],"m":[]},"j4":{"r":["Combat Assault Rifle","Assault Rifle","Burst Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun","Charge Shotgun"],"m":["Shockwave Launcher"]},"k1":{"r":["MK-Seven Assault Rifle","Ranger Assault Rifle"],"s":["Striker Pump Shotgun","Auto Shotgun","Heavy Shotgun"],"m":[]},"k2":{"r":["MK-Seven Assault Rifle","Striker Burst Rifle","Ranger Assault Rifle"],"s":["Striker Pump Shotgun","Ranger Shotgun"],"m":["Shockwave Grenade","Rift-To-Go"]},"k3":{"r":["Hammer Assault Rifle","Striker Burst Rifle","Ranger Assault Rifle"],"s":["Striker Pump Shotgun","Two-Shot Shotgun"],"m":["Crash Pad"]},"e1":{"r":["Red-Eye Assault Rifle","Assault Rifle","Burst Assault Rifle"],"s":["Thunder Shotgun","Maven Auto Shotgun"],"m":["Shockwave Hammer","Launch Pad"]},"e2":{"r":["Red-Eye Assault Rifle","Havoc Suppressed Assault Rifle"],"s":["Havoc Pump Shotgun","Maven Auto Shotgun","Combat Shotgun"],"m":[]},"f1":{"r":["Nemesis AR","Striker AR","Enforcer AR"],"s":["Hammer Pump Shotgun","Frenzy Auto Shotgun"],"m":["Shockwave Grenade","Crash Pad Jr."]},"f2":{"r":["Nemesis AR","Warforged Assault Rifle","Tactical Assault Rifle"],"s":["Gatekeeper Shotgun","Hammer Pump Shotgun","Frenzy Auto Shotgun"],"m":["Shockwave Grenade"]},"f3":{"r":["Combat Assault Rifle","Enforcer AR","Tactical Assault Rifle"],"s":["Combat Shotgun","Gatekeeper Shotgun","Hammer Pump Shotgun"],"m":["Nitro Fists","Shockwave Grenade","Crash Pad Jr."]},"t1":{"r":["Holo Twister Assault Rifle","Fury Assault Rifle","Ranger Assault Rifle"],"s":["Sentinel Pump Shotgun","Oni Shotgun","Twinfire Auto Shotgun"],"m":["Void Oni Mask","Shockwave Grenade"]}};
function ccProMeta(set){ try{ return CC_META_BY_SET[ccLootSet(set)] || null; }catch(e){ return null; } }
function ccMetaRank(meta, o){
  if(!meta || !o) return 99;
  const l=o.icon==='rifle' ? meta.r : o.icon==='shotgun' ? meta.s : CC_MOVE_ITEMS.indexOf(o.name)>=0 ? meta.m : null;
  const i=l ? l.indexOf(o.name) : -1;
  return i<0 ? 99 : i;
}
// Лучший из списка по мете: метовый, если он не больше чем на ступень редче лучшего по редкости.
function ccMetaBest(list, meta){
  const mod=o=>o ? (RARITY_MOD[o.rarity]||0) : -1;
  if(!list.length) return null;
  const top=list.reduce((a,b)=>mod(b)>mod(a) ? b : a);
  if(!meta) return top;
  const ok=list.filter(o=>ccMetaRank(meta, o)<99 && mod(o)>=mod(top)-1)
    .sort((a,b)=>(ccMetaRank(meta, a)-ccMetaRank(meta, b)) || (mod(b)-mod(a)));
  return ok[0] || top;
}
function ccPackFrom(weapons, cons){
  const mod=o=>o ? (RARITY_MOD[o.rarity]||0) : -1;
  const byMod=(a,b)=>mod(b)-mod(a);
  const ws=weapons.slice().sort(byMod);
  /* Отзыв: «должны быть 2 оружия автомат дробовик». Пара — лучшая винтовка и
     лучший дробовик из выпавшего; нет одного из них — лучший ствол другого класса
     (ПП, пистолет, снайперка); класс один на всех рулонах — второй лучший, что есть. */
  const meta=ccProMeta();
  const best=cls=>ccMetaBest(ws.filter(w=>w.icon===cls), meta);
  let first=best('rifle'), second=best('shotgun');
  // Метовый ствол встал вместо более редкого того же класса — тот в dropped (ccPackPow его считает).
  const pushed=[first, second].filter(Boolean).map(w=>ws.find(o=>o.icon===w.icon && mod(o)>mod(w))).filter(Boolean);
  if(!first || !second){
    first=first||second||ws[0]||null;
    second=(first && ws.find(w=>w!==first && w.icon!==first.icon)) || (first && ws.find(w=>w!==first)) || null;
  }
  if(first && second && mod(second)>mod(first)){ const t=first; first=second; second=t; }
  const moves=cons.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0).sort(byMod);
  const move=ccMetaBest(moves, meta);
  const healsAll=cons.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)<0).sort(byMod);
  /* Две хилки — РАЗНЫЕ, и каждая СТАКОМ (отзыв: «можно стакать хилы, 3 биги
     6 миников»). Сколько нашли, столько и лежит, но не больше стака этой хилки по вики
     (CC_HEAL_KIT): шесть маленьких зелий, три больших, три аптечки. Слотов по-прежнему
     два — это два места в инвентаре, а не два предмета. */
  const cnt={}; const order=[];
  healsAll.forEach(x=>{ if(!cnt[x.name]){ cnt[x.name]={item:x, n:0}; order.push(x.name); } cnt[x.name].n++; });
  const heals=order.slice(0, 2).map(n=>Object.assign({}, cnt[n].item, {n:Math.min(cnt[n].n, ccHealOf(cnt[n].item).stack)}));
  const out={weapons:[first, second].filter(Boolean), heals, move:move||null};
  if(pushed.length) out.dropped=pushed;
  return out;
}
function ccPackFromRolls(rolls){
  const p=ccPackFrom(rolls.map(r=>r.weapon), rolls.map(r=>r.cons).filter(Boolean));
  p.chests=rolls.length; p.first=rolls[0]; p.rolls=rolls;
  return p;
}
function ccChestPack(rng, set, n){
  const rolls=[]; for(let i=0;i<n;i++) rolls.push(ccChestRoll(rng, set));
  return ccPackFloor(ccPackFromRolls(rolls), set, rng);
}
/* ПЯТЬ СЛОТОВ — ПЯТЬ ПРЕДМЕТОВ. Отзыв: «иногда пустой слот есть — будто всегда
   что-то можно положить в инвентарь». Слот пустел, когда сундуков было мало («схватить и ехать»,
   тесная точка), когда в пуле не было передвижения или когда пад улетел в ротации. В игре так не
   бывает: к третьей зоне пять слотов заняты хоть чем-то с пола. Поэтому недостающее добирается
   ПОЛОМ острова — тем же предметом пула, но в его низшей редкости, хилка одной штукой, — и
   помечается floor. Сила пака (ccPackPow) пол не считает: цена быстрого лута и пустого слота
   остаётся той, что решена (−2 за ствол, −1 за хилку, −1 без мувмента), меняется только то, что
   лежит в руках. Порядок добора: передвижение, вторая хилка, третий ствол другого класса, хилка. */
/* ЛУТ ТОЛЬКО УЛУЧШАЕТСЯ. Отзыв: «должен улучшать лут, а не менять». Новый пак (соседняя
   точка на третьей зоне, коробка после ухода с точки) не подменяет руки, а вливается в них:
   ствол того же класса встаёт только если он редже; класса не было — добавляется; хилка того же
   имени — стак растёт до потолка вики, иная — занимает свободное место или место слабейшей, если
   она редже; передвижение — если своего нет или новое редже. Сверх пяти — ccPackFloor режет
   (пол первым). Возвращает НОВЫЙ пак, руки не трогает. */
function ccPackMerge(cur, add, set, rng){   // rng больше не берётся: пол и выбор — своим броском (ccPackRng)
  const mod=o=>o ? (RARITY_MOD[o.rarity]||0) : -1;
  const out={weapons:((cur&&cur.weapons)||[]).slice(), heals:((cur&&cur.heals)||[]).map(h=>Object.assign({}, h)), move:(cur&&cur.move)||null};
  /* Пак помнит, из скольких сундуков он собран, и что из него выпало сверх пяти слотов:
     строка на карте считает сундуки (ccSiteOwn), а сила пака — выброшенное (ccPackPow).
     Слияние их складывает, иначе уход с точки обнулял и то и другое. */
  out.chests=(((cur&&cur.chests)||0)+((add&&add.chests)||0))||undefined;
  out.dropped=((cur&&cur.dropped)||[]).concat((add&&add.dropped)||[]);
  out.first=(cur&&cur.first)||(add&&add.first)||undefined;
  if(!add) return out;
  const meta=ccProMeta(set);
  (add.weapons||[]).forEach(w=>{
    if(!w) return;
    const i=out.weapons.findIndex(o=>o && o.icon===w.icon);
    if(i<0){ out.weapons.push(w); return; }
    const old=out.weapons[i];
    if(w!==old && ccMetaBest([old, w], meta)===w){
      if(!old.floor && mod(old)>mod(w)) out.dropped.push(old);
      out.weapons[i]=w;
    }
  });
  (add.heals||[]).forEach(h=>{
    if(!h) return;
    const same=out.heals.find(o=>o.name===h.name);
    if(same){ same.n=Math.min(ccHealOf(same).stack, (same.n||1)+(h.n||1)); same.floor=same.floor && h.floor; return; }
    if(out.heals.length<2){ out.heals.push(Object.assign({}, h)); return; }
    const weak=out.heals.reduce((a,b)=>(a.floor && !b.floor) ? a : (b.floor && !a.floor) ? b : (mod(a)<=mod(b) ? a : b));
    if(weak.floor || mod(h)>mod(weak)) out.heals[out.heals.indexOf(weak)]=Object.assign({}, h);
  });
  if(add.move && (!out.move || out.move.floor || ccMetaBest([out.move, add.move], meta)===add.move)) out.move=add.move;
  return ccPackFloor(out, set, rng);
}
/* СВОЙ БРОСОК, НЕ ОБЩИЙ. Пол и слияние берут предметы своим PRNG от содержимого пака, а не из
   потока вечера: сколько раз они бросают, зависит от того, чего в паке не хватает, — а не хватает
   у каждой команды своего. Скриншот (вечер разошёлся на игре 2, «table,rolls @ #30
   p3=6022 vs p3=6034»): двенадцать лишних бросков на третьей зоне у одного из двоих. Из общего
   потока здесь не берётся ничего, поэтому счёт бросков у всех одинаков. */
function ccPackRng(pack, salt){
  const key=[...(pack&&pack.weapons||[]), ...(pack&&pack.heals||[]), pack&&pack.move].filter(Boolean)
    .map(o=>String(o.name)+":"+String(o.rarity||"")+(o.n>1?"x"+o.n:"")).join("|");
  return careerRng(ccHashStr("pack|"+(salt||"")+"|"+key));
}
function ccPackFloor(pack, set, rng){
  if(!pack) return pack;
  const r=ccPackRng(pack, "floor"), pool=ccLootPool(set);
  if(!pool) return pack;
  pack.weapons=pack.weapons||[]; pack.heals=pack.heals||[];
  const lowest=list=>{ const by={}; list.forEach(o=>{ const k=o.name; if(!by[k] || RARITY_LADDER.indexOf(o.rarity)<RARITY_LADDER.indexOf(by[k].rarity)) by[k]=o; }); return Object.keys(by).map(k=>by[k]); };
  const guns=lowest(pool.weapons), heals=lowest(pool.heals.filter(ccIsHealItem)), moves=pool.heals.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0);
  const meta=ccProMeta(set);
  const one=list=>{ const m=meta ? list.filter(o=>ccMetaRank(meta, o)<99).sort((a,b)=>ccMetaRank(meta, a)-ccMetaRank(meta, b)) : [];
    return m.length ? m[0] : list[Math.floor(r()*list.length)]; };
  const count=()=>pack.weapons.length+pack.heals.length+(pack.move?1:0);
  /* АВТОМАТ И ДРОБОВИК — ВСЕГДА. Отзыв: «дробовик+автомат должен всегда быть в
     инвентаре». Нет класса в руках — с пола берётся его серый ствол; пара встаёт в первые два
     слота. Что не влезло в пять (третий ствол другого класса, лишняя хилка) — выбрасывается,
     но сила пака его помнит (dropped, см. ccPackPow): цена лута прежняя, меняются только руки. */
  ['rifle','shotgun'].forEach(cls=>{
    if(pack.weapons.some(w=>w && w.icon===cls)) return;
    const g=guns.filter(w=>w.icon===cls); if(g.length) pack.weapons.push(Object.assign({}, one(g), {floor:true}));
  });
  // Первый автомат — слот 1, первый дробовик — слот 2, остальное (и второй автомат) — дальше.
  const seen={}; const rank=w=>{ if((w.icon==='rifle'||w.icon==='shotgun') && !seen[w.icon]){ seen[w.icon]=1; return w.icon==='rifle' ? 0 : 1; } return 2; };
  pack.weapons=pack.weapons.map((w,i)=>[w,i,rank(w)]).sort((a,b)=>(a[2]-b[2])||(a[1]-b[1])).map(x=>x[0]);
  pack.dropped=pack.dropped||[];
  for(let guard=0; count()>5 && guard<8; guard++){
    const fh=pack.heals.findIndex(h=>h.floor);
    if(fh>=0){ pack.heals.splice(fh, 1); continue; }
    if(pack.weapons.length>2){
      let k=-1; for(let i=pack.weapons.length-1;i>=2;i--){ if(pack.weapons[i].floor){ k=i; break; } }
      const w=k>=0 ? pack.weapons.splice(k, 1)[0] : pack.weapons.pop();
      if(!w.floor) pack.dropped.push(w); continue; }
    if(pack.heals.length>1){ pack.heals.pop(); continue; }
    break;
  }
  for(let guard=0; count()<5 && guard<8; guard++){
    const held=pack.weapons.map(w=>w.icon), hn=pack.heals.map(h=>h.name);
    const g=guns.filter(w=>held.indexOf(w.icon)<0), h=heals.filter(x=>hn.indexOf(x.name)<0);
    if(!pack.move && moves.length) pack.move=Object.assign({}, one(moves), {floor:true});
    else if(pack.heals.length<2 && h.length) pack.heals.push(Object.assign({}, one(h), {n:1, floor:true}));
    else if(pack.weapons.length<3 && g.length) pack.weapons.push(Object.assign({}, one(g), {floor:true}));
    else if(h.length) pack.heals.push(Object.assign({}, one(h), {n:1, floor:true}));
    else if(pack.weapons.length<5 && guns.length) pack.weapons.push(Object.assign({}, one(guns), {floor:true}));
    else break;
  }
  return pack;
}
/* СВОЯ ТОЧКА — ТРИ ХОДА (скриншот «добавил 1 выбор, почему-то»: на свободной
   точке стояла одна кнопка). Время на точке — это время, которого потом нет на фарм:
     «схватить и ехать» — треть обычной доли сундуков (CC_SITE_FAST_SHARE от ccSiteOpen),
       зато по дороге фармим — +CC_MATS_ZONE ресов (один круг стройки);
     «забрать и идти» — как было, ccSiteOpen сундуков, ресы как есть;
     «обшарить всё» — до CC_SITE_FULL_MUL × ccSiteOpen, но не больше, чем стоит на точке,
       и без фарма: −CC_MATS_ZONE ресов. Показывается, только если на точке есть что
       обшаривать сверх обычной доли.
   Пак «схватить» — первые сундуки того же броска, «обшарить» — те же плюс новые:
   ходы вложены, лучший пак не может оказаться у быстрого. Доли — решение, не замер. */
const CC_SITE_FAST_SHARE=1/3, CC_SITE_FULL_MUL=2;
/* Что пак стоит в силе: редкость двух стволов над uncommon (rare +1, epic +2,
   legendary +3 за ствол), пустой слот ствола −2, хилки −1 за каждую недостающую,
   без мувмента −1. Комната получает то же самое (ccRoomSite), так что это не
   подарок игроку, а разброс лута на всех. */
function ccPackPow(p){
  if(!p) return 0;
  // Пол острова (ccPackFloor, floor) в силу не идёт: слот занят, цена лута прежняя.
  // Выброшенный ради пары настоящий ствол (ccPackFloor, dropped) считается, как считался бы в руках.
  const mod=o=>RARITY_MOD[o.rarity]||2;
  const ws=(p.weapons||[]).concat(p.dropped||[]).filter(o=>o && !o.floor).sort((a,b)=>mod(b)-mod(a)), hs=(p.heals||[]).filter(o=>o && !o.floor);
  let v=0;
  for(let i=0;i<2;i++){ const o=ws[i]; v += o ? Math.max(0, (RARITY_MOD[o.rarity]||2)-2) : -2; }
  v -= Math.max(0, 2-hs.length);
  if(!p.move || p.move.floor) v -= 1;
  return Math.max(-5, Math.min(6, v));
}
const ccRarityWord=r=>{ const k=ccRarityKey(r); return k ? k.charAt(0).toUpperCase()+k.slice(1) : ''; };
// Стак пишется числом рядом с названием, как в инвентаре: «Small Shield Potion ×6».
const ccStackTag=o=>(o && o.n>1) ? ' ×'+o.n : '';
function ccItemLabel(o){ return o ? o.name+ccStackTag(o)+' ('+ccRarityWord(o.rarity)+')' : '-'; }
function ccPackLine(p){
  const name=o=>o ? o.name+ccStackTag(o) : '-';
  return [...(p.weapons||[]), ...(p.heals||[]), p.move].map(name).join(' · ');
}
// Шанс стычки на высадке: сила как у высадочной дуэли (LANDING_POW_EXPONENT,
// потолок LANDING_ODDS_CAP), плюс разница первых сундуков в процентных пунктах.
function ccSiteOdds(you, foe, eMine, eFoe){
  const a=Math.max(1, you._pc||you._pf||you.pow||1), b=Math.max(1, foe._pc||foe._pf||foe.pow||1);
  const wa=Math.pow(a, LANDING_POW_EXPONENT), wb=Math.pow(b, LANDING_POW_EXPONENT);
  const base=clamp(wa/(wa+wb), 1-LANDING_ODDS_CAP, LANDING_ODDS_CAP);
  return clamp(base+((eMine||0)-(eFoe||0))*CC_SITE_EDGE_PP, 0.2, 0.8);
}
/* Куда уходят, не приняв стычку: самая свободная коробка, из равных — ближняя.
   В комнате на пятьдесят отрядов и двадцать коробок пустых почти не бывает, и
   «соседняя точка» — это та, где сидят меньше всех; там стычка тоже возможна,
   но уже руками движка. */
function ccFreeBoxNear(game, you){
  const busy=new Map();
  (game && game.squads ? game.squads : []).forEach(s=>{ if(s.alive && s.team!==you && s.team.landingZone) busy.set(s.team.landingZone, (busy.get(s.team.landingZone)||0)+1); });
  const z0=you.landingZone; if(!z0) return null;
  let best=null, bn=Infinity, bd=Infinity;
  ALL_LANDING_ZONES.forEach(z=>{
    if(z===z0) return;
    const n=busy.get(z)||0;
    const dx=(z.x+z.w/2)-(z0.x+z0.w/2), dy=(z.y+z.h/2)-(z0.y+z0.h/2), d=dx*dx+dy*dy;
    if(n<bn || (n===bn && d<bd)){ bn=n; bd=d; best=z; }
  });
  return best;
}
/* ЛУТ НА СВОЕЙ ТОЧКЕ РУКАМИ (его слово 13.11: «сундуки открывать, чтоб игрок выбирал», «делай максимально реалистичней
   к игре»). Сундуки точки стоят сеткой, каждый открывается тапом: выпадает ствол и иногда расходник, как в ccChestRoll.
   Подобранное само встаёт в свободные слоты (как автоподбор в игре), инвентарь пять слотов, хилки стаком до потолка вики,
   передвижение одно. Лишнее лежит на земле, его можно поменять местами со слотом. Время — полоса до первой зоны:
   до трети сундуков ресы как у «быстро» (+CC_MATS_ZONE), к обычному счёту 0, сверх него до −CC_MATS_ZONE, как у «всё».
   Сила пака — от того, что в руках (dropped пуст), пустые слоты добирает пол острова (ccPackFloor), как раньше.
   Онлайн, перемотка, симуляция и пропуск — прежние три кнопки / «забрать» (ccLootRoomOn). */
function ccLootRoomOn(){
  if(typeof ccMpLock==='function' && ccMpLock()) return false;
  if(skipAnimation || (typeof careerSimOn==='function' && careerSimOn()) || (typeof CC_FF!=='undefined' && CC_FF)) return false;
  return typeof CAREER_RUN!=='undefined' && !!CAREER_RUN;
}
function ccLrKind(o){ return CC_MOVE_ITEMS.indexOf(o.name)>=0 ? 'm' : 'h'; }
function ccLrColor(o){ return (o && (RARITY_COLOR[o.rarity] || (typeof CONSUMABLE_RARITY_COLOR!=='undefined' && CONSUMABLE_RARITY_COLOR[o.rarity]))) || 'var(--common)'; }
/* Точка крупно, на ней сундуки, редкие сундуки и ящики с патронами (его слова 13.11: «когда на локе приблизить локу и там
   сундуки лутать», «иконки сундуков как в фортнайте», и выбранные 1/3/6: патроны, автобус, напарник лутает рядом).
   Кадр как у careerSpotShotHTML: слой всей карты в zoom раз, коробка почти во весь кадр. Где что стоит: точки fortnite.gg
   внутри коробки (CC_LR_CHESTS: s42, s43, r5, r6; n сундуки, r редкие, a ящики), у островов без точек разброс по коробке (место
   условное, число сундуков то же). Порядок обхода: от левого к ближайшему следующему, так открывает «Открыть 5». */
// Коробка во всю свободную часть кадра (его «больше локация должна быть», 13.11): 100 % и зум до 9.
const CC_LR_RATIO=4/3, CC_LR_FILL=100;
/* Ширина картинки острова в пикселях: приближение лут-комнаты не растягивает её больше чем в CC_LR_UPSCALE раз
   (его скрин 19.11 с широкого экрана: «слишком приближено» — S42 в 921 px под 9× расплывалась). */
const CC_ART_PX={'map-m1.jpg':1100, 'map-m2.jpg':1100, 'map-s42.jpg':921, 'map-s43.jpg':1000, 'map-s43-hd.jpg':2368, 'map-r5.jpg':1000, 'map-r5-hd.jpg':3264,
  'map-r6.jpg':1000, 'map-r6-hd.jpg':1984, 'map-reload-a.jpg':1062, 'map-reload-b.jpg':1034}, CC_LR_UPSCALE=2.5;
function ccArtPx(art){ const k=String(art||'').split('/').pop(); return CC_ART_PX[k] || (/map-[ghi][0-9]/.test(k) ? 2048 : 1600); }
/* Патроны: сундук даёт пачку, редкий сундук и ящик по две. На отряд нужно CC_AMMO_NEED пачек на игрока, иначе −1 к силе
   (стрелять нечем, третий файт без патронов). Порог и пачки — решение, не замер: в реплеях Tracker патронов нет. Комната
   (ccRoomSite) открывает ccSiteOpen сундуков, а это от 12 пачек на игрока, поэтому ботам штраф не грозит и не считается. */
const CC_AMMO_NEED=4, CC_AMMO_BOX=2, CC_AMMO_RARE=2, CC_LR_RARE_MAX=2, CC_LR_AMMO_MAX=4;
// Редкий сундук: ствол не ниже rare (вики Fortnite, Rare Chest: «higher chance of better loot»), расходник всегда.
function ccChestRollRare(rng, set){
  let best=null;
  for(let i=0;i<6;i++){ const r=ccChestRoll(rng, set); if(!best || (RARITY_MOD[r.weapon && r.weapon.rarity]||0)>(RARITY_MOD[best.weapon && best.weapon.rarity]||0)) best=r;
    if((RARITY_MOD[best.weapon && best.weapon.rarity]||0)>=(RARITY_MOD.rare||3)) break; }
  if(!best.cons){ const r=ccChestRoll(rng, set); best=Object.assign({}, best, {cons:r.cons}); }
  return best;
}
function ccLrSrc(key){
  const k=key==='s42solo' ? 's42' : key;
  if(typeof CC_LR_CHESTS!=='undefined' && CC_LR_CHESTS[k]) return CC_LR_CHESTS[k];
  if(key==='s43' && typeof CC_S43_CHESTS!=='undefined') return CC_S43_CHESTS;
  return null;
}
/* cam — кадр под HUD (его «может поверх карты», 13.11: в трио три инвентаря уезжали под карту и всё скролилось):
   W×H кадра в px и доли сверху/снизу, занятые полосой времени и хотбарами. Коробка ставится в свободную середину, зум под неё. */
function ccLrView(z, n, cam, boss){
  const key=(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '';
  const art=MAP_ART[key];
  if(!z || !art || !(n>0) || !(z.w>0) || !(z.h>0)) return null;
  const asp=MAP_ASPECT[key]||'1100/970', ar=String(asp).split('/');
  const hOverW=(Number(ar[1])||1)/(Number(ar[0])||1);
  const R=cam ? cam.W/cam.H : CC_LR_RATIO, ah=cam ? Math.max(0.3, 1-cam.top-cam.bot) : 1, fy=cam ? cam.top+ah/2 : 0.5;
  const zMax=cam ? Math.max(1.2, Math.min(9, ccArtPx(art)*CC_LR_UPSCALE/Math.max(320, cam.W))) : 9;
  const zoom=Math.max(1.2, Math.min(zMax, Math.min(CC_LR_FILL/Math.max(z.w, 2), CC_LR_FILL*ah/(Math.max(z.h, 2)*hOverW*R))));
  const visW=100/zoom, visH=100/(zoom*hOverW*R), halfW=Math.min(50, visW/2), halfH=Math.min(50, visH/2);
  const cx=clamp(z.x+z.w/2, halfW, 100-halfW), cy=clamp(z.y+z.h/2-(fy-0.5)*visH, halfH, 100-halfH);
  const rng=careerRng(ccHashStr('lr|'+key+'|'+z.x+'|'+z.y));
  // Не ближе пальца друг к другу: ~30 px в кадре.
  const sx=3000/((cam ? cam.W : 600)*zoom), sy=sx/hOverW, near=(p, x, y)=>Math.abs(p.x-x)<sx && Math.abs(p.y-y)<sy;
  const src=ccLrSrc(key);
  const inZone=list=>{ const out=[]; if(list) for(let i=0;i+1<list.length;i+=2){ const x=list[i], y=list[i+1];
    if(x>=z.x && x<=z.x+z.w && y>=z.y && y<=z.y+z.h) out.push({x, y}); }
    for(let i=out.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const s=out[i]; out[i]=out[j]; out[j]=s; }
    return out; };
  // Сундуки со 100 % спавном — первыми: они на точке всегда.
  const gold=inZone(src && src.g), all=gold.concat(inZone(src && src.n).filter(p=>!gold.some(q=>Math.abs(q.x-p.x)<0.05 && Math.abs(q.y-p.y)<0.05))), spots=[];
  // Ящики мельче сундука (24 px против 30): им хватает двух третей зазора.
  const put=(p, k)=>{ const f=k==='a' ? 0.67 : 1; if(spots.some(q=>Math.abs(q.x-p.x)<sx*f && Math.abs(q.y-p.y)<sy*f)) return false; spots.push({x:p.x, y:p.y, k}); return true; };
  all.forEach(p=>{ if(spots.length<n) put(p, 'c'); });
  const real=spots.length;
  // Добор: у острова с точками рядом с настоящим сундуком (в постройке, не в воде), иначе по коробке.
  const around=k=>{ const b=all.length ? all[Math.floor(rng()*all.length)] : null, a=rng()*Math.PI*2, d=1.1+rng()*0.6;
    return {x:b ? clamp(b.x+Math.cos(a)*sx*d, z.x, z.x+z.w) : z.x+z.w*(0.1+0.8*rng()),
            y:b ? clamp(b.y+Math.sin(a)*sy*d, z.y, z.y+z.h) : z.y+z.h*(0.1+0.8*rng())}; };
  for(let g=0; spots.filter(s=>s.k==='c').length<n && g<n*20; g++){ const p=around(); if(!put(p, 'c') && g>=n*15) spots.push({x:p.x, y:p.y, k:'c'}); }
  // Редкие сундуки и ящики — только настоящие точки (без данных: ящики разбросом, редких нет: их на острове единицы).
  inZone(src && src.r).slice(0, CC_LR_RARE_MAX).forEach(p=>put(p, 'r'));
  const am=src ? inZone(src.a) : [];
  let na=0; am.forEach(p=>{ if(na<CC_LR_AMMO_MAX && put(p, 'a')) na++; });
  for(let g=0; na<(src ? 1 : 3) && g<60; g++){ if(put(around(), 'a')) na++; }
  // Хранилища (fortnite.gg, Vaults): малые v и большое V — только где они на острове есть.
  // Без зазора: хранилище стоит где стоит; сундук, что на нём, отходит на соседнее место (число сундуков то же).
  const vault=(p, k)=>{ spots.forEach(q=>{ if(q.k!=='c' || !(Math.abs(q.x-p.x)<sx*0.8 && Math.abs(q.y-p.y)<sy*0.8)) return;
      for(let g=0; g<30; g++){ const r=around(); if(Math.hypot(r.x-p.x, r.y-p.y)>sx && !spots.some(s=>s!==q && Math.abs(s.x-r.x)<sx*0.6 && Math.abs(s.y-r.y)<sy*0.6)){ q.x=r.x; q.y=r.y; break; } } });
    spots.push({x:p.x, y:p.y, k}); };
  inZone(src && src.v).forEach(p=>vault(p, 'v')); inZone(src && src.V).forEach(p=>vault(p, 'V'));
  // Пол: места у построек (рядом с настоящими сундуками), меньше зазор — предметы мелкие.
  for(let g=0, nf=0; nf<CC_FLOOR_N && g<CC_FLOOR_N*12; g++){ const p=around(); if(!spots.some(q=>Math.abs(q.x-p.x)<sx*0.55 && Math.abs(q.y-p.y)<sy*0.55)){ spots.push({x:p.x, y:p.y, k:'f'}); nf++; } }
  // Босс мифической точки (CC_MYTHIC_POI) — в середине коробки: где именно он ходит, у нас нет.
  if(boss) spots.push({x:z.x+z.w/2, y:z.y+z.h/2, k:'b'});
  // Обход: от самого левого к ближайшему следующему.
  const left=spots.slice(), out=[];
  let cur=left.reduce((a, p)=>p.x<a.x ? p : a, left[0]);
  const dist=(a, b)=>Math.hypot(a.x-b.x, (a.y-b.y)*hOverW);
  while(left.length){ out.push(left.splice(left.indexOf(cur), 1)[0]); if(!left.length) break;
    const last=out[out.length-1]; cur=left.reduce((a, p)=>dist(p, last)<dist(a, last) ? p : a, left[0]); }
  return {key, art, asp, zoom, cx, cy, z, hOverW, spots:out, real};
}
const CC_LR_ART={c:'items/chest.webp', r:'items/rare-chest.webp', a:'items/ammo-box.webp'};
const CC_LR_KIND_T={c:1, r:1, a:0.5, f:0.25};
/* БОСС НА МИФИЧЕСКОЙ ТОЧКЕ (его «миф сундуки», «монетку забрать с босса и оружие миф», 13.11). Дроп — CC_MYTHIC_DROP (вики,
   Bosses): мифик(и) встают в слоты, медальон — значком у хотбара (в игре он не занимает слот оружия). Бой с боссом стоит
   CC_BOSS_T сундуков времени. Сила: точка и так стоит LANDING_POINTS_MAX+CC_MYTHIC_POW (сели — получили), поэтому мифик в руках
   считается как легендарка, а ушёл без босса — минус CC_MYTHIC_POW: мифика у тебя нет. Комната босса берёт всегда. */
const CC_BOSS_T=2;
/* ЛУТ НА ПОЛУ (его «ещё спавны на земле есть», 13.11). Вики, Floor Loot: у каждой локации свои места пола, каждое либо
   даёт предмет, либо пусто; чаще всего на полу патроны; по редкости обычные чаще всех, легендарные очень редко, мификов нет.
   Чисел вики не даёт, поэтому доли ниже — РЕШЕНИЕ по этому порядку, не замер: CC_FLOOR_N мест на коробку, CC_FLOOR_AMMO из
   них патроны, остальное ствол (CC_FLOOR_GUN) или хилка, редкость по CC_FLOOR_RARITY. Подобрать — CC_FLOOR_T сундука времени. */
/* ХРАНИЛИЩЕ (его «миф честы есть?», 13.11): в 2026 мифики — у боссов и в хранилищах; у fortnite.gg на S42 7 малых и одно
   большое. Что внутри, таблиц нет: решение — малое = CC_VAULT_ROLLS[0] бросков редкого сундука (не ниже rare), большое —
   CC_VAULT_ROLLS[1]; вскрыть — CC_VAULT_T времени (малое/большое). Ключа в игре нет, время и есть цена. */
const CC_VAULT_ROLLS=[2, 3], CC_VAULT_T=[2, 3];
const CC_FLOOR_N=6, CC_FLOOR_AMMO=0.4, CC_FLOOR_GUN=0.7, CC_FLOOR_T=0.25;
const CC_FLOOR_RARITY={common:0.5, uncommon:0.35, rare:0.12, epic:0.03, legendary:0};
/* ШАНСЫ ПО СЕЗОНУ (его «делай по каждому сезону свои шансы», 13.11). Опубликованной таблицы редкостей по сезонам нет ни у
   Epic, ни у датамайнеров (одна — Hypex, Chapter 2 S5, она и есть CC_CHEST_RARITY/CC_CHEST_CLASS). Но у каждого сезона свой
   пул: каких классов нет, тех не бывает, а редкость, которой у класса нет, уходит на ближайшую ниже (ccChestRoll). Поэтому
   итоговые шансы считаются ТОЧНО тем же правилом по пулу острова — это то, что реально выпадает в этом сезоне. */
const CC_LOOT_SEASON_NAME={f1:'C5S1', f2:'C5S2', f3:'C5S3', f4:'C5S4', e1:'C4S1', e2:'C4S2', e3:'C4S3', e4:'C4S4', k1:'C3S1', k2:'C3S2', k3:'C3S3', k4:'C3S4', j1:'C2S5', j2:'C2S6', j3:'C2S7', j4:'C2S8', t1:'C6S1', t2:'C6S2', t3:'C6S3', t4:'C6S4'};
// Подпись сезона к шансам: ключ пула острова (s42 → S42, f1 → C5S1 и т. п. — как называет его сам пул), иначе ключ.
function ccLootSeasonName(set){ try{ const k=ccLootSet(set); return (typeof CC_LOOT_SEASON_NAME!=='undefined' && CC_LOOT_SEASON_NAME[k]) || String(k||'').toUpperCase(); }catch(e){ return ''; } }
function ccLootOdds(set, base, ladderDown){
  const pool=ccLootPool(set), out={rar:{common:0, uncommon:0, rare:0, epic:0, legendary:0}, cls:{rifle:0, shotgun:0, smg:0, pistol:0, sniper:0}};
  if(!pool || !pool.weapons || !pool.weapons.length) return out;
  const have={}; pool.weapons.forEach(w=>{ have[w.icon]=1; });
  const keys=Object.keys(CC_CHEST_CLASS).filter(k=>have[k]), tot=keys.reduce((a,k)=>a+CC_CHEST_CLASS[k], 0);
  keys.forEach(k=>{ const wk=CC_CHEST_CLASS[k]/tot, inCls=pool.weapons.filter(w=>w.icon===k); out.cls[k]=wk;
    Object.keys(base).forEach(r=>{ const pr=base[r]; if(!pr) return;
      let c=inCls.filter(w=>w.rarity===r);
      const L=RARITY_LADDER, i0=L.indexOf(r);
      if(ladderDown){ for(let i=i0-1; !c.length && i>=0; i--) c=inCls.filter(w=>w.rarity===L[i]); }
      else { for(let i=i0+1; !c.length && i<L.length; i++) c=inCls.filter(w=>w.rarity===L[i]); }
      if(!c.length) c=inCls;
      c.forEach(w=>{ const rr=out.rar[w.rarity]!=null ? w.rarity : 'legendary'; out.rar[rr]+=wk*pr/c.length; }); }); });
  return out;
}
function ccFloorRoll(rng, set){
  if(rng()<CC_FLOOR_AMMO) return {ammo:1};
  const pool=ccLootPool(set);
  if(rng()<CC_FLOOR_GUN){
    const cls=ccChestClass(rng, pool.weapons), inCls=cls ? pool.weapons.filter(w=>w.icon===cls) : pool.weapons;
    let r=rng(), rar='common'; for(const k of Object.keys(CC_FLOOR_RARITY)){ r-=CC_FLOOR_RARITY[k]; if(r<0){ rar=k; break; } }
    let c=inCls.filter(w=>w.rarity===rar);
    for(let i=RARITY_LADDER.indexOf(rar)+1; !c.length && i<RARITY_LADDER.length; i++) c=inCls.filter(w=>w.rarity===RARITY_LADDER[i]);
    if(!c.length) c=inCls.length ? inCls : pool.weapons;
    return {weapon:c[Math.floor(rng()*c.length)]};
  }
  const hs=pool.heals.filter(x=>ccIsHealItem(x));
  return hs.length ? {cons:hs[Math.floor(rng()*hs.length)]} : {ammo:1};
}
function ccBossItem(d){
  const n=d.n, icon=/shotgun|pump/i.test(n) ? 'shotgun' : /smg/i.test(n) ? 'smg' : /pistol/i.test(n) ? 'pistol' : /dmr|sniper|bolt/i.test(n) ? 'sniper' : /rifle|\bar\b|assault|blade|burst/i.test(n) ? 'rifle' : 'other';
  return {name:n, rarity:'legendary', myth:true, img:d.src, icon};
}
function ccLrMapHTML(v, st, icon, T, first, bus, hud, cam){
  const pins=v.spots.map((p, i)=>{
    const pos='left:'+p.x.toFixed(2)+'%;top:'+p.y.toFixed(2)+'%';
    const o=st.at[i];
    const lab=p.k==='a' ? T.lrAmmoBox : p.k==='r' ? T.lrRare : p.k==='b' ? T.lrBoss(st.boss ? st.boss.name : '') : T.lrOpen1;
    if(p.k==='b'){ const img=st.boss && st.boss.drops[0] ? st.boss.drops[0].src : CC_LR_ART.r;
      return o==null ? '<button type="button" class="lr-pin lr-b" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(lab)+'" title="'+esc(lab)+'"><img src="'+img+'" alt="" width="40" height="40"><i>'+esc(st.boss ? st.boss.name : '')+'</i></button>'
                     : '<span class="lr-pin open lr-b" style="'+pos+'"><img src="'+img+'" alt=""></span>'; }
    if(p.k==='v' || p.k==='V'){ const vl=p.k==='V' ? T.lrVaultBig : T.lrVault;
      return o==null ? '<button type="button" class="lr-pin lr-v'+(p.k==='V' ? ' big' : '')+'" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(vl)+'" title="'+esc(vl)+'"><img src="'+CC_LR_ART.r+'" alt=""><i>'+esc(vl)+'</i></button>'
                     : '<span class="lr-pin open lr-v" style="'+pos+'">'+(o.roll && o.roll.weapon ? icon(o.roll.weapon) : '')+'</span>'; }
    if(p.k==='f') return o==null ? '<button type="button" class="lr-pin lr-f" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(T.lrFloor)+'" title="'+esc(T.lrFloor)+'"><i></i></button>'
      : '<span class="lr-pin open lr-f" style="'+pos+'">'+(o.roll && (o.roll.weapon||o.roll.cons) ? icon(o.roll.weapon||o.roll.cons) : '<img src="'+CC_LR_ART.a+'" alt="">')+'</span>';
    if(o==null) return '<button type="button" class="lr-pin lr-'+p.k+'" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(lab)+'" title="'+esc(lab)+'"><img src="'+CC_LR_ART[p.k]+'" alt="" width="30" height="30"></button>';
    const who=o.by ? ' by'+o.by : '';
    if(p.k==='a') return '<span class="lr-pin open lr-a'+who+'" style="'+pos+'"><img src="'+CC_LR_ART.a+'" alt=""></span>';
    return '<span class="lr-pin open'+who+'" style="'+pos+'" title="'+esc((o.name ? o.name+': ' : '')+ccItemLabel(o.roll.weapon))+'">'+(o.roll.weapon ? icon(o.roll.weapon) : '<img src="'+CC_LR_ART[p.k]+'" alt="">')+'</span>';
  }).join('');
  const zw=(v.zoom*100).toFixed(0)+'%', tx=(-v.cx).toFixed(2)+'%', ty=(-v.cy).toFixed(2)+'%';
  // Автобус — линия через весь остров (ccBus), в координатах карты; viewBox высотой в долю картинки.
  const H=(100*v.hOverW).toFixed(2);
  const busSvg=bus ? '<svg class="lr-bus" viewBox="0 0 100 '+H+'" preserveAspectRatio="none"><line x1="'+bus.x1.toFixed(2)+'" y1="'+(bus.y1*v.hOverW).toFixed(2)+'" x2="'+bus.x2.toFixed(2)+'" y2="'+(bus.y2*v.hOverW).toFixed(2)+'"/></svg>' : '';
  return '<div class="lr-map'+(hud ? ' lr-hud' : '')+(first ? ' lr-in' : '')+'"'+(cam ? ' style="width:'+Math.round(cam.W)+'px;height:'+Math.round(cam.H)+'px;aspect-ratio:auto;max-height:none"' : '')+'><div class="lr-map-l" style="--zw:'+zw+';--tx:'+tx+';--ty:'+ty+';aspect-ratio:'+v.asp+';background-image:url(\''+v.art+'\')">'+
    busSvg+'<i class="lr-map-box" style="left:'+v.z.x+'%;top:'+v.z.y+'%;width:'+v.z.w+'%;height:'+v.z.h+'%"></i>'+pins+'</div>'+(hud||'')+'</div>';
}
/* Напарники на точке (squadSize>1): каждый раз, когда ты открываешь сундук, каждый напарник открывает ближайший к себе
   закрытый сундук. Его находки встают в его пять слотов, лишнее на общую землю. Сила отряда считается так же, как у комнаты
   (лучший пак из всего, что у отряда в руках, ccPackFrom), минус 1 за каждого, у кого меньше двух стволов (ccLrSplitPen,
   не больше −2): комната делит лут без ошибок, ошибка дележа — только у людей. */
function ccLrMates(){
  if(typeof squadSize!=='number' || squadSize<2) return [];
  const m=(typeof careerMates==='function') ? careerMates().filter(Boolean).slice(0, squadSize-1) : [];
  const out=m.map(x=>String(x.handle||x.nick||'').replace(/<[^>]+>/g,'')).filter(Boolean);
  while(out.length<squadSize-1) out.push('#'+(out.length+2));
  return out;
}
function ccLrSplitPen(invs){
  let pen=0; invs.forEach(inv=>{ if(inv.filter(x=>x.kind==='w').length<2) pen++; });
  return Math.min(2, pen);
}
function ccLootRoom(host, opt){
  return new Promise(resolve=>{
    const T=L(), rolls=opt.rolls, nFast=opt.nFast, nOpen=opt.nOpen, nFull=rolls.length;
    const names=['', ...(opt.mates||[])];
    const z0=opt.zone, bossName=z0 && z0.mythic ? z0.mythic : null;
    const st={opened:0, t:0, ammo:0, invs:names.map(()=>[]), ground:[], at:[], to:0, medals:[],
              boss:bossName ? {name:bossName, drops:ccMythicDrops(z0.mythicSet||ACTIVE_LANDING_SET, bossName)} : null};
    const box=document.createElement('div');
    box.className='cc-choice cc-choice-map cc-loot';
    const full=!!(opt.zone && MAP_ART[(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '']);
    // На весь экран — в body: у карты игры бывает transform, и fixed внутри неё прилипал бы к карте.
    if(full) box.classList.add('lr-full');
    /* Широкий экран: лут слева, на месте карты боя, таблица справа остаётся видна (его слово 19.11: «от таблицы слева
       лутаться»). Рамка — по карте боя в окне; карта слишком мала или не видна — на весь экран, как на телефоне. */
    if(full && (window.innerWidth||0)>=900 && typeof CC_RUN_MAP!=='undefined' && CC_RUN_MAP && CC_RUN_MAP.isConnected){
      const r=CC_RUN_MAP.getBoundingClientRect(), top=Math.max(0, r.top), h=Math.min(r.bottom, window.innerHeight)-top;
      if(r.width>=560 && h>=420){
        box.classList.add('lr-side');
        Object.assign(box.style, {left:Math.round(Math.max(0, r.left))+'px', top:Math.round(top)+'px', width:Math.round(r.width)+'px', height:Math.round(h)+'px', right:'auto', bottom:'auto'});
      }
    }
    (full ? document.body : host).appendChild(box);
    const cam=(()=>{ const vv=window.visualViewport, W=Math.max(320, (full && box.clientWidth) || (vv && vv.width) || window.innerWidth || 800), H=Math.max(400, (full && box.clientHeight) || (vv && vv.height) || window.innerHeight || 700);
      const m=names.length, wide=W>=560, per=Math.max(1, Math.floor((W-24)/(5*(wide ? 46 : 42)+18))), rows=Math.ceil(m/per);
      return {W, H, top:(W>=700 ? 96 : 116)/H, bot:(rows*(wide ? 66 : 60)+50+52+30)/H}; })();
    const view=full ? ccLrView(opt.zone, nFull, cam, st.boss) : null;
    if(!view) box.classList.remove('lr-full');
    const pos=[]; // где стоит каждый (индекс точки), для «ближайшего» у напарника
    const mats=()=>{ const o=st.t, span=Math.max(1, nOpen-nFast); return Math.round(CC_MATS_ZONE*clamp((nOpen-o)/span, -1, 1)); };
    const groundPut=it=>{
      if(it.kind!=='h'){ st.ground.push(it); return; }
      const cap=ccHealOf(it.o).stack; let n=it.n;
      for(const g of st.ground){ if(n<=0) break; if(g.kind==='h' && g.o.name===it.o.name && g.n<cap){ const mv=Math.min(cap-g.n, n); g.n+=mv; n-=mv; } }
      while(n>0){ const k=Math.min(cap, n); st.ground.push({o:it.o, kind:'h', n:k}); n-=k; }
    };
    const add=(o, kind, who)=>{
      const inv=st.invs[who], it={o, kind, n:1};
      /* Ствол — один на класс, как держат про (его «2 снапы 2 дробовика — не должно быть так»): того же класса подбирается,
         только если редже, а старый ложится на землю; иначе сам на землю. Руками с земли взять второй можно. */
      if(kind==='w'){ const md=x=>RARITY_MOD[x.rarity]||0, cls=x=>x.icon==='other' ? 'o:'+x.name : x.icon;
        const j=inv.findIndex(x=>x.kind==='w' && cls(x.o)===cls(o));
        if(j>=0){ if(md(o)>md(inv[j].o)){ groundPut(inv[j]); inv[j]=it; } else groundPut(it); return; } }
      // Хилка одного вида — один слот, как в игре (две пиццы в разных слотах нельзя): полный стак — лишнее на землю.
      if(kind==='h'){ const same=inv.find(x=>x.kind==='h' && x.o.name===o.name); if(same){ if(same.n<ccHealOf(o).stack) same.n++; else groundPut(it); return; } }
      if(kind==='m' && inv.some(x=>x.kind==='m')){ st.ground.push(it); return; }
      if(inv.length<5){ inv.push(it); return; }
      groundPut(it);
    };
    const giveRoll=(r, who)=>{ if(r.weapon) add(r.weapon, 'w', who); if(r.cons) add(r.cons, ccLrKind(r.cons), who); };
    // Открыть точку i тем, кто who. Сундук берёт следующий бросок, редкий бросает свой, ящик — патроны.
    const openSpot=(i, who)=>{
      const p=view.spots[i]; if(!p || st.at[i]!=null) return false;
      if(p.k==='a'){ st.at[i]={by:who}; st.ammo+=CC_AMMO_BOX; st.t+=0.5; pos[who]=i; return true; }
      if(p.k==='v' || p.k==='V'){ const big=p.k==='V' ? 1 : 0, rs=[]; for(let q=0;q<CC_VAULT_ROLLS[big];q++) rs.push(ccChestRollRare(Math.random, opt.set));
        st.at[i]={by:who, roll:rs[0], name:names[who]}; st.t+=CC_VAULT_T[big]; st.ammo+=CC_AMMO_RARE; pos[who]=i; rs.forEach(r=>giveRoll(r, who)); return true; }
      if(p.k==='f'){ const roll=ccFloorRoll(Math.random, opt.set); st.at[i]={by:who, roll, name:names[who]}; st.t+=CC_FLOOR_T; pos[who]=i;
        if(roll.ammo) st.ammo+=roll.ammo; else giveRoll(roll, who); return true; }
      if(p.k==='b'){ st.at[i]={by:who}; st.t+=CC_BOSS_T; st.bossDown=true; pos[who]=i;
        (st.boss ? st.boss.drops : []).forEach(d=>{ if(d.med) st.medals.push(d); else add(ccBossItem(d), 'w', who); }); return true; }
      if(p.k==='r'){ const roll=ccChestRollRare(Math.random, opt.set); st.at[i]={by:who, roll, name:names[who]}; st.ammo+=CC_AMMO_RARE; st.t+=1; giveRoll(roll, who); pos[who]=i; return true; }
      if(st.opened>=nFull) return false;
      const roll=rolls[st.opened++]; st.at[i]={by:who, roll, name:names[who]}; st.ammo+=1; st.t+=1; giveRoll(roll, who); pos[who]=i; return true;
    };
    const nearestFree=(who, kinds)=>{ let best=-1, bd=Infinity; const from=view.spots[pos[who]] || view.spots[0];
      view.spots.forEach((p, j)=>{ if(st.at[j]!=null || kinds.indexOf(p.k)<0) return; const d=Math.hypot(p.x-from.x, (p.y-from.y)*view.hOverW); if(d<bd){ bd=d; best=j; } });
      return best; };
    const firstFree=()=>view.spots.findIndex((p, j)=>st.at[j]==null && p.k!=='b' && p.k!=='v' && p.k!=='V' && (p.k!=='c' || st.opened<nFull));
    /* Напарник добирает пустые слоты с общей земли: ствол класса, которого у него нет (лучший по редкости), потом мувмент,
       если его нет, потом хилка. Того же класса второй не берёт. Без этого слот оставался пустым при полной земле. */
    const mateFill=who=>{ const inv=st.invs[who], md=x=>RARITY_MOD[x.rarity]||0, cls=x=>x.icon==='other' ? 'o:'+x.name : x.icon;
      while(inv.length<5){ let best=-1;
        st.ground.forEach((g, i)=>{ if(g.kind!=='w' || inv.some(x=>x.kind==='w' && cls(x.o)===cls(g.o))) return; if(best<0 || md(g.o)>md(st.ground[best].o)) best=i; });
        if(best<0 && !inv.some(x=>x.kind==='m')) best=st.ground.findIndex(g=>g.kind==='m');
        if(best<0) best=st.ground.findIndex(g=>g.kind==='h' && !inv.some(x=>x.kind==='h' && x.o.name===g.o.name));
        if(best<0) break;
        inv.push(st.ground.splice(best, 1)[0]); } };
    const mateTurn=()=>{ for(let w=1; w<names.length; w++){ const j=nearestFree(w, st.opened<nFull ? ['c','r'] : ['r']); if(j>=0) openSpot(j, w); mateFill(w); } };
    const open=(k, at)=>{
      for(let i=0;i<k;i++){
        if(view){ const j=(i===0 && at!=null && st.at[at]==null) ? at : firstFree(); if(j<0) break; if(!openSpot(j, 0)) break; mateTurn(); }
        else { if(st.opened>=nFull) break; const r=rolls[st.opened++]; st.ammo++; st.t++; giveRoll(r, 0); st.grid=(st.grid||0)+1; }
      }
      draw(); };
    const take=i=>{ const it=st.ground[i]; if(!it) return; const inv=st.invs[st.to];
      if(it.kind==='m' && inv.some(x=>x.kind==='m')){ const j=inv.findIndex(x=>x.kind==='m'); st.ground[i]=inv[j]; inv[j]=it; draw(); return; }
      if(it.kind==='h'){ const same=inv.find(x=>x.kind==='h' && x.o.name===it.o.name); if(same){ const cap=ccHealOf(it.o).stack, mv=Math.min(it.n, cap-same.n); if(mv>0){ same.n+=mv; it.n-=mv; if(!it.n) st.ground.splice(i,1); } else st.full=true; draw(); return; } }
      if(inv.length>=5){ st.full=true; draw(); return; }
      inv.push(it); st.ground.splice(i,1); draw(); };
    const drop=(who, i)=>{ const inv=st.invs[who], it=inv[i]; if(!it) return; inv.splice(i,1); groundPut(it); draw(); };
    /* ПЕРЕКЛАДЫВАНИЕ (Notion 15.11: «возможность передвинуть предметы»). Тап по предмету выбирает его, тап по другому слоту
       (своему или напарника, пустому или занятому) кладёт туда или меняет местами, второй тап по тому же — выбросить.
       Тапами, а не перетаскиванием: на iPhone drag&drop в Safari не работает. Хилки одного имени складываются в стак
       до потолка; мувмент у каждого один (как в take). */
    const move=(fw, fi, tw, ti)=>{ const from=st.invs[fw], to=st.invs[tw], it=from[fi]; if(!it) return;
      if(fw===tw){ if(ti<from.length){ from[fi]=from[ti]; from[ti]=it; } else { from.splice(fi,1); from.push(it); } return; }
      const tgt=to[ti];
      if(it.kind==='h' && (!tgt || (tgt.kind==='h' && tgt.o.name===it.o.name))){ const same=to.find(x=>x.kind==='h' && x.o.name===it.o.name);
        if(same){ const mv=Math.min(it.n, ccHealOf(it.o).stack-same.n); if(mv>0){ same.n+=mv; it.n-=mv; if(!it.n) from.splice(fi,1); return; } } }
      const oneMove=(inv, keep, x)=>!(x.kind==='m' && inv.some((y, k)=>k!==keep && y.kind==='m'));
      if(!tgt){ if(to.length>=5){ st.full=true; return; }
        if(!oneMove(to, -1, it)){ st.warn=T.lrOneMove; return; }
        from.splice(fi,1); to.push(it); return; }
      if(!oneMove(to, ti, it) || !oneMove(from, fi, tgt)){ st.warn=T.lrOneMove; return; }
      from[fi]=tgt; to[ti]=it; };
    const slotTap=(w, i, filled)=>{ const sel=st.sel; st.sel=null;
      if(sel && sel[0]===w && sel[1]===i){ drop(w, i); return; }
      if(sel){ move(sel[0], sel[1], w, i); draw(); return; }
      if(filled) st.sel=[w, i];
      draw(); };
    /* Свободные слоты после «Поделить»/«Собрать лучшее» (Notion 15.11: «когда жму поделить, у тиммейта слот свободный»):
       ccPackFrom берёт обычный набор, остальное лежало на земле. Добирается по кругу, лучшее первым: тому, у кого меньше
       двух стволов, — ствол, остальным — хилка (в свой стак, если есть место), потом ствол, потом мувмент, если его нет. */
    const fillFree=()=>{ let moved=true;
      while(moved && st.ground.length){ moved=false;
        st.invs.forEach(inv=>{ if(inv.length>=5 || !st.ground.length) return;
          const guns=inv.filter(x=>x.kind==='w').length, hasM=inv.some(x=>x.kind==='m');
          let bi=-1, bs=-1;
          st.ground.forEach((g, i)=>{ if(g.kind==='m' && hasM) return;
            const same=g.kind==='h' && inv.find(x=>x.kind==='h' && x.o.name===g.o.name);
            if(same && same.n>=ccHealOf(g.o).stack) return;   // одна хилка — один слот, полный стак не добирается
            const twin=g.kind==='w' && inv.some(x=>x.kind==='w' && x.o.name===g.o.name);
            const base=g.kind==='w' ? (guns<2 ? 400 : 200) - (twin ? 250 : 0) : g.kind==='h' ? 300 : 100, sc=base+(RARITY_MOD[g.o.rarity]||0);
            if(sc>bs){ bs=sc; bi=i; } });
          if(bi<0) return;
          const g=st.ground[bi];
          const same=g.kind==='h' && inv.find(x=>x.kind==='h' && x.o.name===g.o.name);
          if(same){ const mv=Math.min(g.n, ccHealOf(g.o).stack-same.n); same.n+=mv; g.n-=mv; if(!g.n) st.ground.splice(bi,1); }
          else { st.ground.splice(bi,1); inv.push(g); }
          moved=true; }); } };
    /* «Собрать лучшее» / «Поделить»: всё, что у отряда, раскладывается заново. Один — лучший пак себе. Отряд — змейкой:
       автоматы по порядку (ты, напарник…), дробовики в обратном, хилки и мувмент по кругу; у каждого потом ccPackFrom
       из доставшегося. Остаток считается по имени (хилки ccPackFrom отдаёт копиями), иначе стаки множились. */
    const auto=()=>{ const all=[].concat(...st.invs, st.ground), m=names.length;
      const ws=[], cs=[]; all.forEach(x=>{ for(let k=0;k<x.n;k++) (x.kind==='w' ? ws : cs).push(x.o); });
      const mod=o=>RARITY_MOD[o.rarity]||0, byMod=(a,b)=>mod(b)-mod(a);
      const share=names.map(()=>({ws:[], cs:[]}));
      const rifles=ws.filter(w=>w.icon==='rifle').sort(byMod), shots=ws.filter(w=>w.icon==='shotgun').sort(byMod), rest=ws.filter(w=>w.icon!=='rifle' && w.icon!=='shotgun').sort(byMod);
      rifles.forEach((w, i)=>share[i%m].ws.push(w));
      shots.forEach((w, i)=>share[(m-1-(i%m))].ws.push(w));
      rest.forEach((w, i)=>share[i%m].ws.push(w));
      const heals=cs.filter(c=>ccLrKind(c)==='h'), moves=cs.filter(c=>ccLrKind(c)==='m').sort(byMod);
      heals.forEach((c, i)=>share[i%m].cs.push(c)); moves.forEach((c, i)=>share[i%m].cs.push(c));
      st.invs=share.map(s=>{ const p=ccPackFrom(s.ws, s.cs), inv=[];
        (p.weapons||[]).forEach(w=>inv.push({o:w, kind:'w', n:1}));
        (p.heals||[]).forEach(h=>inv.push({o:h, kind:'h', n:h.n||1}));
        if(p.move) inv.push({o:p.move, kind:'m', n:1});
        return inv; });
      const key=x=>x.kind==='w' ? x.o : x.kind+':'+x.o.name, left=new Map();
      all.forEach(x=>{ const e=left.get(key(x)); if(e) e.n+=x.n; else left.set(key(x), {o:x.o, kind:x.kind, n:x.n}); });
      st.invs.forEach(inv=>inv.forEach(x=>{ const e=left.get(key(x)); if(e) e.n-=x.n; }));
      st.ground=[]; left.forEach(e=>{ if(e.n<=0) return; if(e.kind==='h') groundPut(e); else for(let k=0;k<e.n;k++) st.ground.push({o:e.o, kind:e.kind, n:1}); });
      fillFree(); st.sel=null;
      draw(); };
    const packOf=inv=>{ const pack={weapons:[], heals:[], move:null, dropped:[], manual:true};
      inv.forEach(x=>{ if(x.kind==='w') pack.weapons.push(x.o); else if(x.kind==='m' && !pack.move) pack.move=x.o; else pack.heals.push(Object.assign({}, x.o, {n:x.n})); });
      return pack; };
    const finish=()=>{ if(!box.isConnected) return; box.remove();
      for(let w=1; w<names.length; w++) mateFill(w);
      const pack=packOf(st.invs[0]);
      const r=rolls.slice(0, Math.max(1, st.opened)); pack.chests=st.opened; pack.first=r[0]; pack.rolls=r;
      // Сила отряда: один — пак из рук (как было); отряд — лучший пак из всех рук, как у комнаты, минус ошибки дележа.
      let powPack=null, pen=0;
      if(names.length>1){ const ws=[], cs=[]; st.invs.forEach(inv=>inv.forEach(x=>{ if(x.kind==='w') ws.push(x.o); else cs.push(Object.assign({}, x.o, {n:x.n})); }));
        const flat=[]; cs.forEach(c=>{ for(let k=0;k<(c.n||1);k++) flat.push(c); });
        powPack=ccPackFrom(ws, flat); pen+=ccLrSplitPen(st.invs); }
      const ammoLow=st.ammo<CC_AMMO_NEED*names.length;
      if(ammoLow) pen+=1;
      if(st.boss && !st.bossDown) pen+=CC_MYTHIC_POW;
      resolve({pack, opened:st.opened, mats:mats(), powPack, pen, ammo:st.ammo, ammoLow, boss:st.boss ? st.boss.name : null, bossDown:!!st.bossDown, medals:st.medals, split:names.length>1 ? ccLrSplitPen(st.invs) : 0,
               mates:st.invs.slice(1).map((inv, k)=>({name:names[k+1], pack:packOf(inv)}))}); };
    const icon=o=>'<span class="lr-ic" style="--rc:'+(o.myth ? 'var(--mythic)' : ccLrColor(o))+'">'+(o.img ? '<img src="'+o.img+'" alt="">' : ccItemIconHTML(o, '<i>'+esc(String(o.name||'?').slice(0,2))+'</i>'))+'</span>';
    const tag=x=>x.n>1 ? '<em>×'+x.n+'</em>' : '';
    const slotsOf=who=>[0,1,2,3,4].map(i=>{ const x=st.invs[who][i];
      const on=!!(st.sel && st.sel[0]===who && st.sel[1]===i);
      return x ? '<button type="button" class="lr-slot'+(on ? ' sel' : '')+'" data-d="'+who+'.'+i+'" aria-pressed="'+on+'" title="'+esc(on ? T.lrDrop : T.lrMoveTip)+'">'+icon(x.o)+tag(x)+'<small>'+esc(x.o.name)+'</small></button>'
               : '<button type="button" class="lr-slot empty'+(st.sel ? ' can' : '')+'" data-e="'+who+'.'+i+'" aria-label="'+esc(T.lrMoveTip)+'"></button>'; }).join('');
    function draw(){
      const o=st.t, m=mats(), pct=Math.round(clamp(o/Math.max(1,nFull), 0, 1)*100), zone=o<=nFast ? 'ok' : o<=nOpen ? 'mid' : 'late';
      const need=CC_AMMO_NEED*names.length;
      const ground=st.ground.map((x,i)=>'<button type="button" class="lr-g" data-g="'+i+'">'+icon(x.o)+tag(x)+'<small>'+esc(x.o.name)+'</small></button>').join('');
      const toSel=names.length>1 ? '<div class="lr-to" role="group" aria-label="'+esc(T.lrTakeFor)+'"><span>'+esc(T.lrTakeFor)+'</span>'+
        names.map((n, w)=>'<button type="button" data-to="'+w+'" aria-pressed="'+(st.to===w)+'"'+(st.to===w?' class="on"':'')+'>'+esc(w ? n : T.lrMe)+'</button>').join('')+'</div>' : '';
      const done=view ? firstFree()<0 : st.opened>=nFull;
      const timeHTML='<div class="lr-time lr-'+zone+'"><u><s style="width:'+pct+'%"></s><i style="left:'+(nFast/nFull*100)+'%"></i><i style="left:'+(nOpen/nFull*100)+'%"></i></u>'+
        '<span>'+esc(T.lrOpened(st.opened, nFull))+' · '+ccMatsIconHTML()+' <b class="'+(m>0?'up':m<0?'down':'')+'">'+(m>0?'+':'')+m+'</b>'+
        ' · <img src="'+CC_LR_ART.a+'" alt=""> <b class="'+(st.ammo<need?'down':'up')+'">'+esc(T.lrAmmo(st.ammo, need))+'</b></span></div>';
      const btns='<div class="lr-btns"><button type="button" class="lr-b" data-a="o5"'+(done?' disabled':'')+'>'+esc(T.lrOpen5)+'</button>'+
        '<button type="button" class="lr-b" data-a="auto"'+(st.opened?'':' disabled')+'>'+esc(names.length>1 ? T.lrSplit : T.lrAuto)+'</button>'+
        '<button type="button" class="lr-b lr-go" data-a="go">'+esc(T.lrGo)+'</button></div>';
      const pc=v=>Math.round(v*100)+'%';
      const oc=st.oddsC || (st.oddsC=ccLootOdds(opt.set, CC_CHEST_RARITY, true)), of=st.oddsF || (st.oddsF=ccLootOdds(opt.set, CC_FLOOR_RARITY, false));
      const RK=['common','uncommon','rare','epic','legendary'];
      const odds=T.lrOdds(RK.map(k=>pc(oc.rar[k])), ['rifle','shotgun','smg','pistol','sniper'].map(k=>pc(oc.cls[k])), pc(CC_CHEST_CONSUMABLE),
        RK.map(k=>pc(of.rar[k])), pc(CC_FLOOR_AMMO), ccLootSeasonName(opt.set));
      const hud=view ? '<div class="lr-hud-t"><b class="lr-hud-ttl">'+esc(T.lrTitle)+'</b><small>'+esc(opt.at+T.lrHint(nOpen))+(opt.busLine ? ' · '+esc(opt.busLine) : '')+'</small><small class="lr-odds">'+odds+'</small>'+timeHTML+'</div><div class="lr-hud-b">'+
        (st.full ? '<div class="lr-warn">'+esc(T.lrFull)+'</div>' : '')+lrNote()+
        '<div class="lr-gs" aria-label="'+esc(T.lrGround)+'">'+(st.ground.length ? st.ground.map((x,i)=>'<button type="button" class="lr-g" data-g="'+i+'" title="'+esc(x.o.name)+'" aria-label="'+esc(x.o.name)+'">'+icon(x.o)+tag(x)+'</button>').join('') : '<span class="lr-gs-e">'+esc(T.lrGround)+'</span>')+'</div>'+
        '<div class="lr-hbs">'+names.map((n, w)=>'<div class="lr-hb'+(names.length>1 && st.to===w ? ' to' : '')+'">'+
          (names.length>1 ? '<button type="button" class="lr-hb-n" data-to="'+w+'" aria-pressed="'+(st.to===w)+'" title="'+esc(T.lrTakeFor)+'">'+esc(w ? n : T.lrMe)+'</button>'
                          : '<span class="lr-hb-n">'+esc(T.lrMe)+'</span>')+
          '<div class="lr-hb-s">'+slotsOf(w)+(w===0 ? st.medals.map(d=>'<span class="lr-medal" title="'+esc(d.n)+'"><img src="'+d.src+'" alt="'+esc(d.n)+'"></span>').join('') : '')+'</div></div>').join('')+'</div>'+btns+'</div>' : '';
      const chests=view ? ccLrMapHTML(view, st, icon, T, !st.drawn, opt.bus, hud, cam) : '<div class="lr-chests">'+rolls.map((r,i)=>i<st.opened
        ? '<span class="lr-ch open" title="'+esc(ccItemLabel(r.weapon))+'">'+icon(r.weapon)+'</span>'
        : '<button type="button" class="lr-ch" data-c="'+i+'" aria-label="'+esc(T.lrOpen1)+'">'+CC_CHOICE_ICON.chest+'</button>').join('')+'</div>';
      const invs=names.map((n, w)=>'<div class="lr-lab">'+esc(w ? T.lrInvOf(n) : T.lrInv)+'</div><div class="lr-inv">'+slotsOf(w)+'</div>').join('');
      box.innerHTML=view ? chests : '<div class="cc-choice-head"><b><span class="cc-choice-t">'+esc(T.lrTitle)+'</span></b><div class="cc-choice-sub"><span>'+esc(opt.at+T.lrHint(nOpen))+(opt.busLine ? '<br>'+esc(opt.busLine) : '')+'</span></div></div>'+
        timeHTML+chests+toSel+invs+
        (st.full ? '<div class="lr-warn">'+esc(T.lrFull)+'</div>' : '')+lrNote()+
        (ground ? '<div class="lr-lab">'+esc(T.lrGround)+'</div><div class="lr-ground">'+ground+'</div>' : '')+btns;
      st.full=false; st.warn=null; st.drawn=1;
    }
    function lrNote(){ const x=st.sel && st.invs[st.sel[0]][st.sel[1]];
      return (st.warn ? '<div class="lr-warn">'+esc(st.warn)+'</div>' : '')+(x ? '<div class="lr-selhint">'+esc(T.lrSelHint(x.o.name))+'</div>' : ''); }
    box.addEventListener('click', e=>{
      const b=e.target.closest('button'); if(!b || !box.contains(b) || b.disabled) return;
      if(b.dataset.c!=null) open(1, +b.dataset.c);
      else if(b.dataset.d!=null){ const [w, i]=b.dataset.d.split('.'); slotTap(+w, +i, true); }
      else if(b.dataset.e!=null){ const [w, i]=b.dataset.e.split('.'); slotTap(+w, +i, false); }
      else if(b.dataset.g!=null){ st.sel=null; take(+b.dataset.g); }
      else if(b.dataset.to!=null){ st.to=+b.dataset.to; draw(); }
      else if(b.dataset.a==='o5') open(5);
      else if(b.dataset.a==='auto') auto();
      else if(b.dataset.a==='go') finish();
    });
    // Пропуск посреди комнаты: открыть то, что успели бы до зоны, собрать лучшее и уйти (как ccChoiceBox отвечает сам).
    const watch=setInterval(()=>{
      if(!box.isConnected){ clearInterval(watch); return; }
      if(!skipAnimation) return;
      clearInterval(watch);
      if(st.opened<nOpen) open(nOpen-st.opened);
      auto(); finish();
    }, 120);
    draw();
  });
}
/* АВТОБУС (выбор 3, 13.11). В каждой игре автобус летит прямой линией через остров; на точку далеко от линии отряд
   приземляется позже, и до первой зоны там открывают меньше сундуков. Линия своя у каждой игры и одинакова у всех клиентов:
   она выводится из первого круга движка (кадр 0), бросков не тратит. Угол любой, линия проходит через середину острова
   ±20 %. Задержка: до CC_BUS_NEAR % от линии ничего, дальше линейно до CC_BUS_LATE доли сундуков на CC_BUS_FAR %.
   Числа — решение, не замер: полёт в Fortnite ~1 мин на остров, свои точки про выбирают так, чтобы успеть. */
const CC_BUS_NEAR=10, CC_BUS_FAR=55, CC_BUS_LATE=0.3;
let CC_BUS_GAME=null, CC_BUS_KEY=null, CC_BUS=null;
function ccBus(){
  // 19.11: линия — маршрут игры (ccBusRoute), тот же, что летит в пролёте и решает, кто сел первым. Без номера игры — по первому кругу, как было.
  const set=(typeof ACTIVE_LANDING_SET!=='undefined' ? ACTIVE_LANDING_SET : '');
  let px, py, dx, dy, key;
  if(CC_BUS_G!=null){
    key='g'+CC_BUS_G+'|'+(typeof careerToday==='function' ? careerToday() : '')+'|'+set;
    if(CC_BUS && CC_BUS_KEY===key) return CC_BUS;
    const R=ccBusRoute(CC_BUS_G); px=R.cx; py=R.cy; dx=R.dx; dy=R.dy;
  } else {
    const g=CC_BUS_GAME, fr=g && g.frames ? g.frames() : null, f=fr && fr[0];
    if(!f || !f.circle) return null;
    key=f.circle.cx.toFixed(3)+'|'+f.circle.cy.toFixed(3)+'|'+set;
    if(CC_BUS && CC_BUS_KEY===key) return CC_BUS;
    const r=careerRng(ccHashStr('bus|'+key));
    const a=r()*Math.PI; px=50+(r()-0.5)*40; py=50+(r()-0.5)*40; dx=Math.cos(a); dy=Math.sin(a);
  }
  // Отрезок от края до края кадра 0..100 по обеим осям (в процентах картинки).
  let t0=-Infinity, t1=Infinity;
  [[px, dx], [py, dy]].forEach(([p, d])=>{ if(Math.abs(d)<1e-6) return; const a1=(0-p)/d, a2=(100-p)/d; t0=Math.max(t0, Math.min(a1, a2)); t1=Math.min(t1, Math.max(a1, a2)); });
  CC_BUS={x1:px+dx*t0, y1:py+dy*t0, x2:px+dx*t1, y2:py+dy*t1, px, py, dx, dy};
  CC_BUS_KEY=key;
  return CC_BUS;
}
// Расстояние от центра коробки до линии автобуса, в процентах ширины картинки.
function ccBusDist(z){
  const b=ccBus(); if(!b || !z) return 0;
  const key=(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '', ar=String(MAP_ASPECT[key]||'1/1').split('/');
  const k=(Number(ar[1])||1)/(Number(ar[0])||1);
  const x=z.x+z.w/2-b.px, y=(z.y+z.h/2-b.py)*k;
  return Math.abs(x*b.dy*k-y*b.dx)/Math.hypot(b.dx, b.dy*k);
}
function ccBusLate(z){ return CC_BUS_LATE*clamp((ccBusDist(z)-CC_BUS_NEAR)/(CC_BUS_FAR-CC_BUS_NEAR), 0, 1); }
function ccBusOpen(n, z){ return Math.max(1, Math.round(n*(1-ccBusLate(z)))); }
/* Комната лута и что из неё в силу: своя точка, точка после выигранной стычки и соседняя после ухода (его слово 13.11:
   «в батл рояль не лутаются сундуки» — в BR своя коробка почти всегда с соседями, и лут шёл строкой). merge — влить в то,
   что уже в руках (ушёл на соседнюю), иначе пак из рук. */
async function ccLootRoomRun(you, ui, host, o, say, merge){
  const T=L(), set=o.set;
  const res=await ccLootRoom(host, Object.assign({mates:ccLrMates(), bus:ccBus()}, o));
  const p=ccPackFloor(res.pack, set, Math.random);
  // Отряд: сила лучшего пака из всех рук (как у комнаты); один — пак из рук. Минус ошибки дележа и нехватка патронов.
  you._loot=merge ? ccPackMerge(you._loot, p, set, Math.random) : p; you._mateLoot=res.mates;
  ccAddGamePow(you, ccPackPow(res.powPack ? ccPackFloor(res.powPack, set, Math.random) : p)-(res.pen||0));
  you._mats=clamp(ccMats(you)+res.mats, 0, CC_MATS_FULL);
  you._medals=res.medals||[];
  const warn=[res.ammoLow ? T.lrAmmoLow : '', res.split ? T.lrSplitPen(res.split) : '', res.boss && !res.bossDown ? T.lrBossLeft(res.boss, CC_MYTHIC_POW) : ''].filter(Boolean).join(' · ');
  await say(T.ccSiteOwn(res.opened, ccPackLine(you._loot))+(warn ? ' · '+warn : ''), warn ? false : null);
  return res;
}
async function ccAskSite(you, ui){
  if(!you) return;
  const game=you._game, sq=you._sq;
  if(!game || !game.squads) return;
  const zone=you.landingZone;
  /* Соперники на точке — все, кроме своего напарника. Условие симметричное:
     'isMate' есть только у ЧУЖОЙ вкладки моего напарника, поэтому у одного
     клиента напарник из списка выпадал, а у второго — нет, и на общей точке
     один считал стычку, а другой сундуки. В гонке (isRival) всё как было. */
  const rivals=zone ? game.squads.filter(s=>s.alive && s.team!==you && !s.team.isMate &&
      !(s.team.isYou && you.isMate) && s.team.landingZone===zone).map(s=>s.team) : [];
  const set=ccLootSet();
  const T=L();
  ccMpMark('st0'+(you.mpTag||''));
  // Сундуков на точке — сколько их там стоит (fortnite.gg / вики) или по луту коробки
  // (ccSiteChests); открываем до первой зоны не всё (ccSiteOpen); уходя — доля
  // сундуков ближней свободной коробки.
  // Автобус (ccBus): далеко от линии — сели позже, сундуков до зоны меньше. Комнате так же (ccRoomSite).
  const nPoi=ccSiteChests(zone), nOpen=ccBusOpen(ccSiteOpen(nPoi), zone);
  const busLate=Math.round(ccBusLate(zone)*100);
  const free=ccFreeBoxNear(game, you);
  /* Доля соседней коробки — ПОСЛЕ потолка открытия, а не до. Тестер, 16.09:
     «сплитнуть без файта — лут примерно такой же, как анкон». Так и было: у
     настоящего счёта сундуков (fortnite.gg, 50–100 на коробку) половина всё
     равно упиралась в потолок ccSiteOpen, и уход давал те же 24 сундука, что
     своя точка. Замер career-pack-chests-probe: 24 сундука — сила пака 3.4,
     12 — 2.4; теперь уход стоит этот балл. */
  const nLeave=Math.max(1, Math.round(ccSiteOpen(ccSiteChests(free))*CC_CHESTS_LEAVE_SHARE));
  const at=(ccSiteReal(zone) ? T.ccSiteAt(nPoi, nOpen, ccSiteSrc())+' · ' : '')+(busLate>0 ? T.lrBusLate(busLate)+' · ' : '');
  const mine=ccChestPack(Math.random, set, nOpen);
  const say=async (line, ok)=>{ if(ui && ui.note) ui.note(line); await ccChoiceResult(ui && ui.map, line, ok); };
  if(!rivals.length){
    /* Своя точка без чужих — сундуки открываются НА ЭКРАНЕ, а не строкой на две
       секунды: отзыв «нет симуляции на локации, о которой я
       писал». Панель одна кнопка — что выпало из восьми сундуков, какой пак
       собран и сколько он стоит; под скипом и в симуляции берётся сама. */
    /* Три хода (см. CC_SITE_FAST_SHARE): быстро — часть того же броска, всё — тот же
       бросок плюс новые сундуки; пак «забрать и идти» показан целиком, остальные
       два — числом сундуков и ценой в ресах. Под скипом и в симуляции — «забрать». */
    const nFast=Math.max(1, Math.round(nOpen*CC_SITE_FAST_SHARE));
    const nFull=Math.min(Math.round(nPoi), nOpen*CC_SITE_FULL_MUL);
    const extra=[]; for(let i=nOpen;i<nFull;i++) extra.push(ccChestRoll(Math.random, set));
    // Лут руками (ccLootRoom): сундуки по одному, свой инвентарь. Онлайн и пропуск — три кнопки ниже.
    const lrHost=ccLootRoomOn() ? ((ui && ui.map) || document.getElementById('majorStages')) : null;
    if(lrHost){
      await ccLootRoomRun(you, ui, lrHost, {rolls:(mine.rolls||[]).concat(extra), nFast, nOpen, at, zone, set, busLine:busLate>0 ? '' : T.lrBusNear}, say);
      ccMpMark('st1:room');
      return;
    }
    const packs={fast:ccPackFloor(ccPackFromRolls(mine.rolls.slice(0, nFast)), set, Math.random), take:mine,
                 full:nFull>nOpen ? ccPackFloor(ccPackFromRolls(mine.rolls.concat(extra)), set, Math.random) : mine};
    const pv=ccPackPow(mine);
    const labels=[...(mine.weapons||[]), ...(mine.heals||[]), mine.move].filter(Boolean).map(ccItemLabel).join(' · ');
    const opts=[
      {id:'fast', icon:CC_CHOICE_ICON.run, title:T.ccSiteFast, note:T.ccSiteFastNote(nFast, CC_MATS_ZONE), pack:packs.fast},
      {id:'take', def:true, icon:ccItemIconHTML(mine.weapons[0], CC_CHOICE_ICON.chest), title:T.ccSiteTake,
       note:labels+' — '+T.ccSitePackPow(pv), pack:mine}
    ];
    if(nFull>nOpen) opts.push({id:'full', icon:CC_CHOICE_ICON.chest, title:T.ccSiteFull, note:T.ccSiteFullNote(nFull, nPoi, CC_MATS_ZONE), pack:packs.full});
    const titleOf=v=>v==='fast' ? T.ccSiteFast : v==='full' ? T.ccSiteFull : T.ccSiteTake;
    const pick=(await ccMpChoose('own'+(you.mpTag||''), async function(){
      return (await ccChoiceBox(T.ccSiteOwnTitle, at+T.ccSiteOwnHint(nOpen), opts, ui && ui.map, null, 'site')).id;
    }, titleOf)).v;
    const id=packs[pick] && opts.some(o=>o.id===pick) ? pick : 'take';
    const p=packs[id];
    you._loot=p; ccAddGamePow(you, ccPackPow(p));
    if(id==='fast') you._mats=Math.min(CC_MATS_FULL, ccMats(you)+CC_MATS_ZONE);
    if(id==='full') you._mats=Math.max(0, ccMats(you)-CC_MATS_ZONE);
    ccMpMark('st1:'+id);
    await say(T.ccSiteOwn(p.chests, ccPackLine(p)), null);
    return;
  }
  // Стычка — с сильнейшими из тех, кто сел на ту же коробку; остальные остаются движку.
  const foe=rivals.slice().sort((a,b)=>(b._pc||b.pow||0)-(a._pc||a.pow||0))[0];
  const theirs=ccChestRoll(Math.random, set);
  const eMine=CC_LOOT_EDGE[ccRarityKey(mine.first.weapon.rarity)]||0, eFoe=CC_LOOT_EDGE[ccRarityKey(theirs.weapon.rarity)]||0;
  const p=ccSiteOdds(you, foe, eMine, eFoe);
  const bare=t=>String(t.name||'').replace(/<[^>]+>/g,'').trim();
  const names=rivals.map(bare).join(' · ');
  const pickId=(await ccMpChoose('site'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(T.ccSiteTitle(names), at+T.ccSiteHint(ccItemLabel(mine.first.weapon), ccItemLabel(theirs.weapon)), [
      {id:'leave', def:true, icon:CC_CHOICE_ICON.run, title:T.ccSiteLeave, note:T.ccSiteLeaveNote(nLeave, nOpen)},
      {id:'fight', icon:ccItemIconHTML(mine.first.weapon, CC_CHOICE_ICON.fight), title:T.ccSiteFight,
       note:T.ccSiteFightNote(Math.round(p*100), nOpen, eMine, eFoe)}
    ], ui && ui.map, null, 'site')).id;
  }, function(v){ return v==='fight' ? T.ccSiteFight : T.ccSiteLeave; })).v;
  ccMpMark('a1:'+pickId);
  if(pickId==='fight'){
    const won=Math.random()<p;
    ccMpMark('w1:'+(won?1:0));
    // Смерть на высадке — как её считает движок (droppedOut → стычки, аура).
    const fs=game.squads.find(s=>s.team===foe);
    if(won){
      if(fs) fs.droppedOut=true;
      game.eliminate(foe, you);
      const lh=ccLootRoomOn() ? ((ui && ui.map) || document.getElementById('majorStages')) : null;
      if(lh){
        await say(T.ccSiteWon(bare(foe), nOpen), true);
        await ccLootRoomRun(you, ui, lh, {rolls:mine.rolls||[], nFast:Math.max(1, Math.round(nOpen*CC_SITE_FAST_SHARE)), nOpen, at, zone, set}, say);
        return;
      }
      you._loot=mine; ccAddGamePow(you, ccPackPow(mine));
      await say(T.ccSiteWon(bare(foe), nOpen), true);
    } else {
      if(sq) sq.droppedOut=true;
      game.eliminate(you, foe);
      await say(T.ccSiteLost(bare(foe)), false);
    }
    return;
  }
  if(free){ you.landingZone=free; if(sq){ sq.x=free.x+free.w/2; sq.y=free.y+free.h/2; } }
  const small=ccChestPack(Math.random, set, nLeave);
  const lh=ccLootRoomOn() ? ((ui && ui.map) || document.getElementById('majorStages')) : null;
  if(lh){
    await ccLootRoomRun(you, ui, lh, {rolls:small.rolls||[], nFast:Math.max(1, Math.round(nLeave*CC_SITE_FAST_SHARE)), nOpen:nLeave, at:'', zone:free||zone, set}, say, true);
    return;
  }
  you._loot=ccPackMerge(you._loot, small, set, Math.random); ccAddGamePow(you, ccPackPow(small));
  await say(T.ccSiteLeft(nLeave, ccPackLine(small)), null);
}
// Комната открывает свои сундуки тем же правилом; под симуляцией (you=null) — и игрок.
// Сундуков у каждого — сколько стоит в его коробке (ccSiteChests) и сколько отряд
// успевает открыть (ccSiteOpen), как у игрока.
function ccRoomSite(field, you){
  const set=ccLootSet();
  field.forEach(t=>{
    if(you && (t===you || t.isMate || t.isRival)) return;   // людям (и сопернику по гонке) — вопрос, не бросок
    const p=ccChestPack(Math.random, set, ccBusOpen(ccSiteOpen(ccSiteChests(t.landingZone)), t.landingZone));
    t._loot=p; ccAddGamePow(t, ccPackPow(p));
  });
}
const CC_LOOT_POI_ODDS=0.4, CC_LOOT_POI_BONUS=4, CC_LOOT_POI_FAIL=2;
async function ccAskLoot(you, ui){
  if(!you) return;
  ccMpMark('l0'+(you.mpTag||''));
  // Свой пак — тот, что собран из сундуков на точке (ccAskSite); соседний — чужой.
  const mine=you._loot||ccLootPack(), other=ccLootPack();
  // С чем уйдёшь с соседней точки: своё плюс её лучшее (ccPackMerge), а не её пак вместо своего.
  const merged=ccPackMerge(mine, other, null, Math.random);
  ccMpMark('l1');
  const name=o=>o ? esc(o.name) : '-';
  const listOf=p=>[...p.weapons, ...p.heals, p.move].map(name).join(' · ');
  /* Спрашивают обоих, а решение всё равно одно.

     Правка: «дай возможность двоим кликать вариант… двоем
     нужно нажать одно и тоже если, два разных нажало рандомно тогда
     выбирается». Раньше здесь решал игл, а второй смотрел.

     По проводу уходит ТОЛЬКО id выбора. Паки считать и слать незачем: они у
     обоих уже одинаковые (ccLootPack выше тянет из сида вечера), а ссылки на
     объекты по сети всё равно не переживают. Бросок исхода остаётся общим и
     на своём месте — ни окно выбора, ни окно ожидания броска не тратят, так
     что счёт вызовов Math.random у двоих не разъезжается; монетка на
     несогласии тратит по одному у каждого, и оба доходят до неё одинаково.
     Спрашивают одного — того, чья это роль. См. ccMpChoose и ccMpSeedOn. */
  const pickId=(await ccMpChoose('loot'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(L().ccLootTitle, L().ccLootHint,
      [{id:'take', title:L().ccLootTake, note:listOf(mine)+' — '+L().ccLootTakeSafe, pack:mine,
        icon:ccItemIconHTML(mine.weapons[0], CC_CHOICE_ICON.home)},
       {id:'swap', title:L().ccLootSwap, icon:ccItemIconHTML(other.weapons[0], CC_CHOICE_ICON.contest),
        note:listOf(merged)+' — '+L().ccLootSwapRisk(CC_LOOT_POI_BONUS, CC_LOOT_POI_FAIL,
          Math.round(CC_LOOT_POI_ODDS*100)), pack:merged}],
      ui && ui.map, null, 'loot')).id;
  }, function(v){ return v==='swap' ? L().ccLootSwap : L().ccLootTake; })).v;
  ccMpMark('a3:'+pickId);
  // Остался на своей — ничего не выиграл и ничего не потерял. Сказать об этом
  // всё равно надо: молчащая панель читается как «выбор не засчитался».
  // Что подобрал — то и показывается потом в строке «что у меня есть».
  you._loot = pickId==='swap' ? merged : mine;   // улучшает, не меняет
  if(pickId!=='swap'){
    if(ui && ui.note) ui.note(L().ccLootKept);
    await ccChoiceResult(ui && ui.map, L().ccLootKept, null);
    return;
  }
  // Побежал на чужую точку — либо забрал её и ушёл богаче, либо разменялся и
  // добираешь круг битым.
  const won=Math.random()<CC_LOOT_POI_ODDS;
  ccAddGamePow(you, won ? CC_LOOT_POI_BONUS : -CC_LOOT_POI_FAIL);
  ccMpMark('w3:'+(won?1:0));
  const line = won ? L().ccLootGot(CC_LOOT_POI_BONUS) : L().ccLootHurt(CC_LOOT_POI_FAIL);
  if(ui && ui.note) ui.note(line);
  await ccChoiceResult(ui && ui.map, line, won);
}
/* Восьмая зона. Хайграунд — монетка: выиграл контест, забрал высоту, иначе
   ничего и остаток игры снизу. Рефреш даёт меньше, но наверняка. */
/* КОНЦОВКА ДВУМЯ ОСТАНОВКАМИ. В трёх играх Гранд-финала FNCS 2026 EU (tools/real-matches.json) к восьмому кругу
   живы 21–25 отрядов из 50, и дальше до конца уходят 44% всех убийств игры, а вопрос там был один.
   Двигающиеся круги (ccAskMoving): ротация заново, её читает движок (team._rot, zone-sim runPhase), или третья
   сторона через движок (ccThirdApply). Выживание по реплеям Major 2 EU, зоны 8+: вышли сразу, дожили 63%; со
   штормом 49% (CC_END_ROT). По умолчанию ответ четвёртой зоны, так что под пропуском баланс не сдвинут.
   Последние отряды (ccAskLast): держать место, третьить или давить ради элимов. Исходы стычки концовки по тем же
   реплеям (312 сторон): разошлись 30%, размен 20%, соседа выбили 19%, выбили самих 31% (CC_FIGHT_LATE).
   В финале победитель в среднем брал 6.3 элима, места 2–5 по 5.2, 11–20 по 2.5. */
const CC_END_ROT={early:63, with:49};
const CC_FIGHT_LATE=Object.assign({}, CC_FIGHT, {decide:0.50, trade:0.20});
// Номера кругов двух остановок по шторму вечера: 11 кругов → 10 и 11, 9 кругов → только 9.
function ccEndZones(){
  const n=(typeof CC_GAME_PHASES!=='undefined' && CC_GAME_PHASES && CC_GAME_PHASES.length) || 0;
  return n>=11 ? {move:10, last:11} : n>=9 ? {move:9, last:0} : {move:0, last:0};
}
const ccFoeName=foe=>foe ? String(foe.name||'').replace(/<[^>]+>/g,'') : '';
/* КОНЦОВКА КАК У ПРО (его «лейт реалистичней выборы, посмотри как у про игроков», 13.11).
   1) Тэг на сюрдж — и в концовке. В финалах FNCS 2026 EU сюрдж шёл с 4-й по 10-ю зону в двух играх из трёх (см.
      CC_SURGE_FARM), и про в двигающихся кругах «тэгают» — бьют по кому угодно ради урона, чтобы не срезало. Ход тот же, что в
      меню середины (те же числа замера), и появляется по тому же правилу: сюрдж включён и запас над линией меньше CC_SURGE_SAFE.
   2) Низ в эпоху двигающихся кругов — тоннель (ccLateLowName): с 2023 года концовки FNCS играются низом через тоннели,
      высоту берут редко. Числа хода прежние, меняется название.
   3) Строка над вопросом — замер тех же реплеев (tools/real-matches.json): к 8-й зоне живы 21–25 отрядов из 50, 44% киллов
      игры случаются после неё. */
function ccLateSurgeOpt(you, T){
  const sg=ccSurgeState(you);
  if(!(sg && sg.on && (sg.gap==null || sg.gap<CC_SURGE_SAFE))) return null;
  return {id:'surge', icon:CC_CHOICE_ICON.surge, title:T.ccLateTag,
    note:T.ccMidSurgeNote(CC_SURGE_FARM, CC_SURGE_TAKEN, CC_SURGE_FARM_POW)+' · '+T.ccMidSurgeLine(sg.players, sg.at, sg.gap)};
}
async function ccLateSurgeApply(you, say, T){
  if(you._sq){ you._sq.dealt=(you._sq.dealt||0)+CC_SURGE_FARM; you._sq.taken=(you._sq.taken||0)+CC_SURGE_TAKEN; }
  ccAddGamePow(you, -CC_SURGE_FARM_POW);
  await say(T.ccMidSurgeGot(CC_SURGE_FARM, CC_SURGE_TAKEN, CC_SURGE_FARM_POW), true);
}
function ccLateLowName(T){ const y=(typeof ccCalYear==='function') ? ccCalYear() : 2026; return y>=2023 ? T.ccLateTunnel : T.ccLateLg; }
function ccLateProLine(you, T){ const g=you && you._game, n=g && g.aliveCount ? g.aliveCount() : 0; return n ? T.ccLatePro(n) : ''; }
/* ОКНО КОНЦОВКИ (8-я зона): позиция и стойка до конца игры одним окном. Сила позиции — её ценность в ситуации против хода
   по умолчанию (низ, при мало ресов рефреш). Третьить — настоящая стычка через движок (ccThirdPairApply). Стойка уходит в
   you._stance: двигающиеся круги и последние отряды играются по ней без окон (ccAutoMoving, ccAutoLast). Онлайн: стойка едет
   вместе с ходом одной строкой «ход|стойка» через ccMpChoose, у обоих одно и то же. */
function ccEndName(T, id){ return id==='lg' ? ccLateLowName(T) : T[CC_LATE_NAME[id]]||id; }
function ccEndDefault(you){ return (!CC_ZB && ccMatsLow(you)) ? 'refresh' : 'lg'; }
async function ccAskEndWindow(you, ui){
  if(!you) return;
  ccMpMark('a8s'+(you.mpTag||''));
  const T=L(), sit=ccSitOf(you), def=ccEndDefault(you);
  you._stance='hold';
  const ids=CC_SIT_END_IDS.filter(id=>ccSitAvail('end', id, sit));
  const opts=ids.map(id=>({id, def:id===def, icon:CC_CHOICE_ICON[CC_LATE_ICON[id]]||CC_CHOICE_ICON.stay, title:ccEndName(T, id),
    note:ccSitFacts(T, 'end', id, sit)+(ccSitUseless('end', id, sit) ? ' · '+T.sitUseless : '')}));
  opts.sort((a,b)=>(b.def?1:0)-(a.def?1:0));   // ход по умолчанию первым: пропуск и сторожа берут первую кнопку
  const chips='<div class="cc-chips" data-hold="1"><span class="cc-chips-h">'+esc(T.esChips)+'</span>'+CC_SIT_STANCE_IDS.map(id=>
    '<button type="button" class="cc-chip'+(id==='hold' ? ' on' : '')+'" data-chip="'+id+'">'+esc(id==='hold' ? T.lsHold : T.lsPush)+'</button>').join('')+
    '<small>'+esc(T.lsHold+': '+ccSitFacts(T, 'stance', 'hold', sit)+' · '+T.lsPush+': '+ccSitFacts(T, 'stance', 'push', sit))+'</small></div>';
  const pro=ccLateProLine(you, T);
  let stance='hold';
  const v=(await ccMpChoose('late'+(you.mpTag||''), async function(){
    const pr=ccChoiceBox(T.ccLateTitle, ccKitLine(you)+(pro ? '<br>'+esc(pro) : '')+chips, opts, ui && ui.map, null, 'late');
    const host=(ui && ui.map) || document.getElementById('majorStages');
    const box=ccChoiceIn(host);
    if(box) box.querySelectorAll('[data-chip]').forEach(b=>b.addEventListener('click', ()=>{
      stance=b.dataset.chip; box.querySelectorAll('[data-chip]').forEach(x=>x.classList.toggle('on', x===b)); }));
    return (await pr).id+'|'+stance;
  }, function(x){ const p=String(x).split('|'); return ccEndName(T, p[0])+' · '+(p[1]==='push' ? T.lsPush : T.lsHold); })).v;
  const parts=String(v).split('|');
  const pickId=ids.indexOf(parts[0])>=0 ? parts[0] : def;
  you._stance=parts[1]==='push' ? 'push' : 'hold';
  ccMpMark('a8:'+pickId+'|'+you._stance);
  const say=async (line, ok)=>{ if(ui && ui.note) ui.note(line); await ccChoiceResult(ui && ui.map, line, ok); };
  if(pickId==='third'){
    const pair=ccThirdPair(you);
    if(pair){ const res=ccThirdPairApply(you, pair); await say(T.tpGot(res), res.out==='win' ? true : res.out==='die' ? false : null); return; }
  }
  const gain=Math.round(ccSitValue('end', pickId, sit)-ccSitValue('end', def, sit));
  if(gain) ccAddGamePow(you, gain);
  if(pickId==='refresh') ccMatsFill(you);
  if(pickId==='hg') ccKitSpend([you], CC_MATS_HG_EXTRA);
  await say(ccEndName(T, pickId)+(gain ? ' · '+(gain>0 ? '+' : '')+gain : '')+' · '+(you._stance==='push' ? T.lsPush : T.lsHold), gain>0 ? true : gain<0 ? false : null);
}
// Концовка по стойке, без окна: держать — ничего, давить — стычка с ближайшим (числа концовки CC_FIGHT_LATE).
async function ccAutoEndFight(you, ui, tag){
  if(!you || you._stance!=='push') return;
  const game=you._game, foe=game && game.nearest ? game.nearest(you) : null;
  if(!foe) return;
  const T=L(), gun=you._loot && you._loot.weapons && you._loot.weapons[0];
  const tac=ccTacOf(you._tac||'push', you, foe);
  const out=ccFightApply(you, Math.random(), foe, CC_FIGHT_LATE, tac);
  ccMpMark(tag+out);
  const line=ccFightLine(T, out, CC_FIGHT_LATE, ccFoeName(foe), gun, you, tac);
  if(ui && ui.note) ui.note(line);
}
async function ccAutoMoving(you, ui){ return ccAutoEndFight(you, ui, 'w10f:'); }
async function ccAutoLast(you, ui){ return ccAutoEndFight(you, ui, 'w11f:'); }
async function ccAskLate(you, ui){ return ccAskEndWindow(you, ui); }
async function ccAskMoving(you, ui){ return ccAutoMoving(you, ui); }
async function ccAskLast(you, ui){ return ccAutoLast(you, ui); }
function simulateGameOnMap(teams, lobbyOpts){
  teams.forEach(t=>{
    t._elims=0; t._feed=[];
    t._pos=null;   // позиция в круге для движка (chooseTarget), на одну игру
    t._tac=null; t._stance=null;   // тактика встреч и стойка концовки: из окон этой игры
    t._pf=Math.max(1, t.pow*gameForm());
    /* Что выпало форме — отдельно от того, что сделал игрок.

       Жалоба игрока: «в начале каждой игры почему-то разная
       сила, в чём проблема?». Колонка показывала _pf, то есть силу карточки,
       умноженную на бросок формы (±16% на игру, FORM_SPREAD_OPEN), — и на
       замере одна и та же связка 96 показывала 91-102 за одиннадцать игр.
       Бросок нужен движку (он откалиброван и правит дисперсию открытых
       этапов), но игроку он не виден и решать по нему нечего.

       Поэтому база броска запоминается, и колонка показывает силу карточки
       плюс то, что к ней добавили ЛУТ и ВЫСОКАЯ ЗЕМЛЯ, — ровно то, на что
       игрок влияет. См. livePow. */
    t._pfBase=t._pf;
    t._pc=Math.max(1, t._pf+(CC_ZB ? 0 : (t.closeEdge||0)));   // Zero Build: край построек не считается
  });

  // The island this game is played on — the one the landing picker put
  // everybody on, not a guess between the first two the app ever had.
  const set    = ZONE_SETS[ACTIVE_LANDING_SET] ? ACTIVE_LANDING_SET : 'm2';
  const ratio  = MAP_ASPECT[set].split('/');
  const aspect = Number(ratio[1]) / Number(ratio[0]);
  const exponent = DUEL_POW_EXPONENT_BY_MODE[squadSize] || 5;
  // Когда отряд сел (маршрут автобуса, ccBusRoute): решает стычки на высадке, resolveDropDuel.
  ccBusSetLand(teams, aspect);

  ccSetKillW(teams);
  const result = ZoneSim.simulateZoneGame(teams, {
    rng: Math.random,
    land: ZONE_SETS[set],
    phases: ccStormPhases(set, squadSize),
    // В соло-Reload возрождать некому — без напарника смерть окончательная
    // (реплеи Reload Solo Victory Cup S41: 40 → 27 к восьмому кругу, а не 40).
    respawnUntilZone: (/^r\d$/.test(set) && squadSize>1) ? CC_RELOAD_RESPAWN_ZONE : 0,
    aspect: aspect,
    startOf: t => {
      const z = t.landingZone;
      if(z) return {x: z.x + z.w/2, y: z.y + z.h/2};
      // No drop spot: the Heats and the Play-In never run the picker. Falling
      // back to one point put all fifty squads on the same pixel, and they wiped
      // each other out inside the first circle. So an unpicked squad gets a
      // rectangle off the same grid — but it lands in the middle of it, not
      // scattered across it. There are more squads than rectangles, so some of
      // them share, and sharing is the point: a squad spread to a random corner
      // of its own rectangle is out of contact range of the squad that drew the
      // same one, and a Heat would play with no landing fights at all.
      const grid = ZONE_SETS[set];
      const r = grid[(t._uid != null ? t._uid : Math.floor(Math.random()*grid.length)) % grid.length];
      return {x: r.x + r.w/2 + (Math.random()-0.5),
              y: r.y + r.h/2 + (Math.random()-0.5)};
    },
    duel: (a, b, dropping) => dropping ? resolveDropDuel(a, b) : resolveDuel(a, b, exponent),
    record: RECORD_NEXT_ZONE_GAME,
    lobbySquads: lobbyOpts && lobbyOpts.lobbySquads,
    lobbyPlayers: lobbyOpts && lobbyOpts.lobbyPlayers
  });

  LAST_ZONE_TIMELINE = result.timeline;
  LAST_ZONE_ROSTER = result.roster;
  RECORD_NEXT_ZONE_GAME = false;

  // Turn the causes the engine recorded into the feed lines the match history
  // already knows how to print.
  teams.forEach(t=>{
    const cause = t._deathCause;
    if(cause === 'storm')      t._feed.push(L().feedStorm);
    else if(cause === 'surge') t._feed.push(L().feedSurge);
    else if(cause)             t._feed.push(L().feedDied(String(cause).replace(/<[^>]+>/g,'')));
  });

  return result.order;
}

/* ===== Решения внутри игры =================================================
   Mid game после 2 зоны выбор лута, late game на 8 зоне: высота (50/50), низ
   или рефреш. Лут платит той же монетой, что драфтовый лоадаут
   (LOADOUT_POW_SCALE и пулы предметов), иначе предмет значил бы в карьере не то,
   что в драфте. Выигранная высота примерно как хороший лут, рефреш половина её.
   Сила кладётся в _pf/_pc, а не в pow: pow принадлежит вечеру, это одной игре. */
/* Прибавки замерены tools/career-choice-value-probe.js: 500 игр, прибавка на восьмой зоне пошаговым движком.
     решение               ср. место  побед %  топ-10 %
     ничего (лоуграунд)       28.24      5.4     31.2
     рефреш +2                28.13      5.2     30.4
     хайграунд +6             27.20      7.2     36.0
   +4 у хайграунда тонул в шуме. Рефреш поэтому половина хайграунда: +3 наверняка против +6 монеткой.
   Разброс пробы на 500 играх ±1 место и ±2% побед, строки с монеткой по ней не сравнивать. */
const CC_HG_ODDS=0.5;              // «50 на 50» — отзыв
/* +10 и −10 — отзыв: «сделай хайграунд взять +10, а нет −10».
   Было +6 / −2. Что это меняет по смыслу: ожидание хода становится ровно
   нулём (0.5·10 − 0.5·10), то есть высота больше не покупает среднее — она
   покупает только потолок, и платит за него ровно столько же. Рядом стоит
   рефреш с гарантированными +3, и теперь между ходами не «чуть лучше — чуть
   хуже», а «надёжно плюс три» против «орёл или решка на десять». */
// Рефреш с 3 сентября — риск на пять, а не верные три: ожидание то же (+3),
// см. таблицу у CC_LATE_MOVES. При полных ресах прибавка половинная.
const CC_HG_POW=10, CC_REFRESH_POW=5;
/* Хайграунд: взял +10, провалил −10 (было +6/−2, и проваленный размен ничего не стоил). Замер career-choice-value-probe, 600 игр:
     решение            было +6/−2            стало +10/−10
     высота взята       26.56 · 3.2% · 36.8   27.03 · 7.2% · 37.0
     высота провалена   29.30 · 3.0% · 28.0   30.21 · 0.5% · 23.0
     (ср. место · побед % · топ-10 %)
   Ожидание ноль против +3 у рефреша: высота покупает потолок, а не среднее. Шум на 600 играх ~±1 место и ±2% побед.
   Комната играет теми же числами (ccRoomLate). */
const CC_HG_FAIL=10;
/* Ходы восьмой зоны. Ожидание = odds*pow - (1-odds)*fail:
   низ 0/0 (ожид. 0), рефреш 100% +3 (ожид. +3), хайграунд 50% +10/-10 (ожид. 0,
   потолок +10). Раньше были ещё «третьить» (35% +16/-8) и «отжать точку»
   (70% +6/-4), убраны. Числа подобраны так, чтобы ни один ход не бил другой и по
   среднему, и по потолку. Комната играет тем же меню (ccRoomLate): бонус только
   игроку ломает откалиброванную лестницу (career-choice-balance-probe). */
/* Рефреш рискованный: удаётся в 75%, провал −3. Прибавка зависит от ресов: при полных половинная,
   при пустых полная, а отказ идти даёт штраф на концовку (CC_MATS_PEN). Ожидание при пустых 0.75·5−0.25·3 = +3,
   как у старого гарантированного рефреша, так что калибровка вокруг не едет. Без риска рефреш бил лоуграунд
   по всем числам. Игра за зоной (edge): 55% +8 / 45% −8. Ни один ход не бьёт другой и по шансу, и по потолку:
     ход         шанс   +    −   ожидание  потолок
     низ          -     0    0      0        0
     рефреш      75%   5*   3   +3 / +0*    5*     (* при полных ресах вдвое меньше)
     за зоной    55%   8    8      0        8;  хайграунд 50%  10  10  0  10 */
const CC_EDGE_ODDS=0.55, CC_EDGE_POW=8, CC_EDGE_FAIL=8;
/* МИД ГРАУНД — его страница «simulation» 7 сентября: «в какой позиции играть:
   хг, мид граунд, лоу граунд — чем выше, тем сложнее, но больше повер».
   Середина лестницы между высотой и низом: 65% на +6, провал −4, ожидание
   +2.5, потолок 6 — ниже высоты по потолку, выше по шансу, и не бьёт рефреш
   при пустых ресах (+3). Числа подобраны под лестницу, не замер. */
const CC_MID_ODDS=0.65, CC_MID_POW=6, CC_MID_FAIL=4;
const CC_REFRESH_ODDS=0.75, CC_REFRESH_FAIL=3;
/* ТРЕТЬЯ СТОРОНА — снова в меню, но уже ПО ЗАМЕРУ, и через движок. Слово
   6 сентября: «делай дальше». Ход стоял здесь до 1 сентября как +16/−8 на
   35% — числа с потолка, и его сняли. Теперь это не бросок силы, а реальная
   стычка: сосед выбит движком (элим, ресы с трупа) или выбиты мы.

   Замер (три реплея финала Major 2 EU, 2 августа 2026): третья сторона =
   отряд, впервые ударивший одну из двух дерущихся команд через 3 с после
   начала их стычки и до её конца плюс 15 с; исход — за 30 с после его первого
   выстрела. Концовка (зоны 8+), 156 стычек и 108 заходов третьими (69%):
   33% кончаются чужим килом, 17% — собственной смертью третьего, 3% —
   потерей игрока, 47% — постреляли и разошлись. Середина (96 заходов): 32%
   кил, 2% смерть, 63% разошлись — там третьих ловят редко. */
const CC_THIRD={kill:0.33, die:0.17, pow:6, dmg:70};
const CC_LATE_MOVES=[
  {id:'hg',      pow:CC_HG_POW,      odds:CC_HG_ODDS,       fail:CC_HG_FAIL},
  {id:'mid',     pow:CC_MID_POW,     odds:CC_MID_ODDS,      fail:CC_MID_FAIL},
  {id:'edge',    pow:CC_EDGE_POW,    odds:CC_EDGE_ODDS,     fail:CC_EDGE_FAIL},
  // real: решается движком (ccThirdApply), не броском силы; комната его не ходит.
  {id:'third',   pow:CC_THIRD.pow,   odds:CC_THIRD.kill,    fail:0, real:true},
  {id:'refresh', pow:CC_REFRESH_POW, odds:CC_REFRESH_ODDS,  fail:CC_REFRESH_FAIL, mats:true},
  {id:'lg',      pow:0,              odds:1,                fail:0}
];
/* Что делает третья сторона с отрядом — отдельно от вопроса, чтобы
   проверялось. r — бросок [0,1); foe — ближайший сосед (его стычку и третьим).
   Без соседа выбить некого и погибнуть не от кого — «постреляли». */
function ccThirdApply(you, r, foe){
  const sq=you._sq, game=you._game;
  const can=!!(foe && game && game.eliminate);
  if(r<CC_THIRD.kill && can){
    game.eliminate(foe, you);
    ccAddGamePow(you, CC_THIRD.pow);
    you._mats=Math.min(CC_MATS_FULL, ccMats(you)+CC_FIGHT.mats);
    return 'win';
  }
  if(r<CC_THIRD.kill+CC_THIRD.die && can){
    game.eliminate(you, foe);
    return 'die';
  }
  if(sq){ sq.dealt=(sq.dealt||0)+CC_THIRD.dmg; sq.taken=(sq.taken||0)+Math.round(CC_THIRD.dmg/2); }
  return 'none';
}
/* ТРЕТЬЯ СТОРОНА В СЕРЕДИНЕ (план 125, пункт 2). На 5-й и 7-й зоне, если два чужих отряда стоят ближе CC_THIRD_PAIR друг к
   другу (дерутся) и оба ближе CC_THIRD_NEAR к нам, в меню середины есть «третьить». Пока доехали, их файт мог решиться сам
   (CC_THIRD_SELF): проигравшего выбивает движок, третьим идём на выжившего. Шансы — CC_THIRD (замер концовки) с поправкой на
   силу: ×(0.5+p) на кил, ×(1.5−p) на смерть, p — дуэльная формула против цели. Если оба живы и цель выбита, второго
   добиваем с CC_THIRD_BOTH (он тоже битый) за половину прибавки. Поправки и CC_THIRD_SELF/BOTH — решение, не замер. */
/* Сколько сифон отнимает у третьей стороны: при 50 сразу шанс выбить ×0.7, меньше сифона — меньше; «за время» (hot) — как 60%
   от суммы: победитель хилится, пока ты подходишь, но не мгновенно. Настройка, не замер. */
const CC_SIPHON_TP=0.3;
function ccSiphonTp(s){ if(!s) return 1; const eff=(s.split ? s.split*2 : s.hp)*(s.hot ? 0.6 : 1); return 1-CC_SIPHON_TP*Math.min(1.2, eff/50); }
const CC_THIRD_PAIR=6, CC_THIRD_NEAR=22, CC_THIRD_SELF=0.5, CC_THIRD_BOTH=0.5;
function ccThirdPair(you){
  const game=you && you._game, me=you && you._sq;
  if(!game || !game.squads || !me || !me.alive || !game.eliminate) return null;
  const near=game.squads.filter(s=>s.alive && s!==me && s.team!==you && !s.team.isMate && Math.hypot(s.x-me.x, s.y-me.y)<CC_THIRD_NEAR);
  let best=null, bd=Infinity;
  for(let i=0;i<near.length;i++) for(let j=i+1;j<near.length;j++){
    const d=Math.hypot(near[i].x-near[j].x, near[i].y-near[j].y);
    if(d<CC_THIRD_PAIR && d<bd){ bd=d; best={a:near[i], b:near[j]}; }
  }
  return best;
}
function ccThirdOdds(you, foe){
  const p=ccFightWinOdds(you, foe);
  const kill=clamp(CC_THIRD.kill*(0.5+p), 0.05, 0.7), die=clamp(CC_THIRD.die*(1.5-p), 0.02, 0.5);
  return {kill, die:Math.min(die, 1-kill)};
}
function ccThirdPairApply(you, pair, rr){
  const rnd=rr||Math.random, game=you._game, sq=you._sq;
  const res={out:'none', self:false, both:false, pow:CC_THIRD.pow, dmg:CC_THIRD.dmg};
  let tgt=pair.a.team, oth=pair.b.team;
  if(rnd()<CC_THIRD_SELF){
    // Их файт кончился без нас: победителя называет та же дуэльная формула.
    const pa=ccFightWinOdds(pair.a.team, pair.b.team), aWon=rnd()<pa;
    const w=aWon ? pair.a.team : pair.b.team, l=aWon ? pair.b.team : pair.a.team;
    game.eliminate(l, w);
    res.self=true; res.w=ccFoeName(w); res.l=ccFoeName(l);
    tgt=w; oth=null;
  }
  res.t=ccFoeName(tgt); res.o=oth ? ccFoeName(oth) : '';
  const o=ccThirdOdds(you, tgt), r=rnd();
  // Сифон эпохи (zone-sim siphonFor): победитель чужого файта уже хилится за кил, прийти на готовое труднее.
  const sph=CC_GAME_PHASES && CC_GAME_PHASES.siphon;
  if(res.self && sph){ const f=ccSiphonTp(sph); o.kill*=f; o.die=Math.min(1-o.kill, o.die/f); res.siphon=true; }
  if(r<o.kill){
    game.eliminate(tgt, you);
    ccAddGamePow(you, CC_THIRD.pow);
    you._mats=Math.min(CC_MATS_FULL, ccMats(you)+CC_FIGHT.mats);
    res.out='win';
    if(oth && rnd()<CC_THIRD_BOTH){
      game.eliminate(oth, you);
      const half=Math.round(CC_THIRD.pow/2);
      ccAddGamePow(you, half); res.pow+=half; res.both=true;
    }
    return res;
  }
  if(r<o.kill+o.die){ game.eliminate(you, tgt); res.out='die'; return res; }
  if(sq){ sq.dealt=(sq.dealt||0)+CC_THIRD.dmg; sq.taken=(sq.taken||0)+Math.round(CC_THIRD.dmg/2); }
  return res;
}
// Ход с монеткой — тот, у которого есть чем платить за провал. Так и панель, и
// строка исхода, и комната узнают новый ход, не перечисляя его по имени.
function ccLateRisky(m){ return !!(m && m.fail>0 && m.odds<1); }
// Имена словарных строк каждого хода — по id, чтобы новый ход добавлялся
// строкой здесь, а не поиском 'hg' по файлу.
const CC_LATE_NAME={hg:'ccLateHg', mid:'ccLateMid', third:'ccLateThird', take:'ccLateTake',
                    edge:'ccLateEdge', refresh:'ccLateRefresh', lg:'ccLateLg'};
// Картинка каждого хода концовки — ключ в CC_CHOICE_ICON.
const CC_LATE_ICON={hg:'fnStair', mid:'fnFloor', third:'fnElims', take:'contest', edge:'fnStorm', refresh:'chest', lg:'stay'};
const CC_LATE_NOTE={hg:'ccLateHgNote', mid:'ccLateMidNote', third:'ccLateThirdNote', take:'ccLateTakeNote',
                    edge:'ccLateEdgeNote', refresh:'ccLateRefreshNote', lg:'ccLateLgNote'};
const CC_LATE_WON ={hg:'ccLateHgWon', mid:'ccLateMidWon', third:'ccLateThirdWon', take:'ccLateTakeWon',
                    edge:'ccLateEdgeWon', refresh:'ccLateRefreshWon'};
const CC_LATE_LOST={hg:'ccLateHgLost', mid:'ccLateMidLost', third:'ccLateThirdLost', take:'ccLateTakeLost',
                    edge:'ccLateEdgeLost', refresh:'ccLateRefreshLost'};
/* Подпись под ходом. Строка у «низа» — просто строка (прибавки нет и называть
   нечего), у остальных функция; у ходов с монеткой ей нужны все три числа,
   чтобы игрок читал цену риска, а не только награду. */
function ccLateNote(m, pow){
  const n=L()[CC_LATE_NOTE[m.id]];
  if(typeof n!=='function') return n;
  // Третья сторона: подпись — три исхода по замеру, а не «шанс / прибавка / штраф».
  if(m.real) return n(Math.round(CC_THIRD.kill*100), Math.round(CC_THIRD.die*100), CC_THIRD.pow);
  const p=pow!=null ? pow : m.pow;
  return ccLateRisky(m) ? n(p, m.fail, Math.round(m.odds*100)) : n(p);
}
/* Незнакомый ход — это чужой сейв: 'third' и 'take' лежат в журналах карьер,
   которые играли до 1 сентября. Такой ход читается как «низ» — ход без
   прибавки и без риска, самый безобидный из возможных ответов. Индексом
   отвечать нельзя: список меняется, а 'lg' — это 'lg'. */
function ccLateMove(id){
  return CC_LATE_MOVES.find(m=>m.id===id) ||
         CC_LATE_MOVES.find(m=>m.id==='lg') || CC_LATE_MOVES[CC_LATE_MOVES.length-1];
}
/* Пак лута середины игры: два оружия, два хила и мувмент — «как в драфте
   каждому игроку по 2 оружия 2 хила и 1 мувмент». Мувмента отдельным слотом в
   пулах нет, он живёт среди расходников (гарпун, слайдеры, граната), поэтому
   он и берётся оттуда — по имени, а не по выдуманному полю. */
// Гарпун и удочка отсюда убраны 16.09 (тестер: «мувмент доступен, даже когда есть только
// удочка или гарпун») — это снасти, не ротация; в слот хилки они тоже не идут (CC_CHEST_NOT_HEAL).
const CC_MOVE_ITEMS=['Seven Sliders','Overdrive Grenade',
                     'Skyline Deployer','Seven Power Gloves','Shockwave Grenade','Rocket Ram',   // Chug Splash отсюда убран 10.09: это хилка (CC_HEAL_KIT)
                     // Reload: крюк, пады, рифт и джетпак — передвижение, не хилка.
                     'Grappler','Crash Pad Jr.','Launch Pad','Super Launch Pad','Rift-To-Go','Jetpack',
                     // Chapter 5 (2024): клинок-крюк, крылья, нитро-кулаки, реактивные ботинки — передвижение.
                     'Grapple Blade','Wings of Icarus','Nitro Fists','War Machine\'s Hover Jets',
                     // Chapter 4 (2023): ударный молот, перчатки-плащ — передвижение.
                     'Shockwave Hammer','Cloak Gauntlets',
                     // Chapter 3 (2022): батут, шар, рифт из мусора — передвижение.
                     'Crash Pad','Balloon','Junk Rift',
                     // Chapter 2 (2021): ударная пусковая, надувной бык — передвижение.
                     'Shockwave Launcher','Inflate-A-Bull'];
/* Лут острова, а не один пул на все вечера. Отзыв: «посмотри
   меты в каждом сезоне компетив и добавь в каждом сезоне оружие, которое
   нужно». Остров вечера даёт careerBrSet(): дуо-год — m2 (глава 7, сезон 3) и
   с 21 августа s42 (сезон 4), трио-год — t1/t2/t3 (глава 6). У каждого свой
   пул оружия и расходников, тот же, что раздают карты драфта. */
const CC_LOOT_BY_SET={
  m1:{weapons:M1_WEAPON_POOL, heals:M1_CONSUMABLE_POOL},
  m2:{weapons:WEAPON_POOL, heals:M2_CONSUMABLE_POOL},
  s42:{weapons:S42_WEAPON_POOL, heals:S42_CONSUMABLE_POOL},
  s43:{weapons:S43_WEAPON_POOL, heals:S43_CONSUMABLE_POOL},
  t1:{weapons:T1_WEAPON_POOL, heals:T1_CONSUMABLE_POOL},
  t2:{weapons:T2_WEAPON_POOL, heals:T2_CONSUMABLE_POOL},
  t3:{weapons:T3_WEAPON_POOL, heals:T3_CONSUMABLE_POOL},
  t4:{weapons:T4_WEAPON_POOL, heals:T4_CONSUMABLE_POOL},
  f1:{weapons:F1_WEAPON_POOL, heals:F1_CONSUMABLE_POOL},
  f2:{weapons:F2_WEAPON_POOL, heals:F2_CONSUMABLE_POOL},
  f3:{weapons:F3_WEAPON_POOL, heals:F3_CONSUMABLE_POOL},
  f4:{weapons:F4_WEAPON_POOL, heals:F4_CONSUMABLE_POOL},
  e1:{weapons:E1_WEAPON_POOL, heals:E1_CONSUMABLE_POOL},
  e2:{weapons:E2_WEAPON_POOL, heals:E2_CONSUMABLE_POOL},
  e3:{weapons:E3_WEAPON_POOL, heals:E3_CONSUMABLE_POOL},
  e4:{weapons:E4_WEAPON_POOL, heals:E4_CONSUMABLE_POOL},
  k1:{weapons:K1_WEAPON_POOL, heals:K1_CONSUMABLE_POOL},
  k2:{weapons:K2_WEAPON_POOL, heals:K2_CONSUMABLE_POOL},
  k3:{weapons:K3_WEAPON_POOL, heals:K3_CONSUMABLE_POOL},
  k4:{weapons:K4_WEAPON_POOL, heals:K4_CONSUMABLE_POOL},
  j1:{weapons:J1_WEAPON_POOL, heals:J1_CONSUMABLE_POOL},
  j2:{weapons:J2_WEAPON_POOL, heals:J2_CONSUMABLE_POOL},
  j3:{weapons:J3_WEAPON_POOL, heals:J3_CONSUMABLE_POOL},
  j4:{weapons:J4_WEAPON_POOL, heals:J4_CONSUMABLE_POOL},
  h1:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL},
  g5:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL}, g6:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL}, g7:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL},
  h3:{weapons:H3_WEAPON_POOL, heals:H3_CONSUMABLE_POOL},
  h4:{weapons:H4_WEAPON_POOL, heals:H4_CONSUMABLE_POOL},
  i1:{weapons:I1_WEAPON_POOL, heals:I1_CONSUMABLE_POOL},
  i2:{weapons:I2_WEAPON_POOL, heals:I2_CONSUMABLE_POOL},
  i3:{weapons:I3_WEAPON_POOL, heals:I3_CONSUMABLE_POOL},
  r1:{weapons:R1_WEAPON_POOL, heals:R1_CONSUMABLE_POOL},
  r2:{weapons:R2_WEAPON_POOL, heals:R2_CONSUMABLE_POOL},
  r3:{weapons:R3_WEAPON_POOL, heals:R3_CONSUMABLE_POOL},
  r4:{weapons:R4_WEAPON_POOL, heals:R4_CONSUMABLE_POOL}
};
/* Какой круг Reload идёт сейчас — по дню карьеры (окна кругов из CAREER_YEAR): пул лута берётся
   у круга, а не у острова — острова чередуются игра через игру (ccRelIsland), а Reload-вечера
   Victory Cup и Чемпионат круга тоже играют на острове r4 в свой день. */
function ccRelLootSeries(){
  let d=null; try{ d=(CAREER && CAREER.career) ? String(careerToday()).slice(5) : null; }catch(e){ d=null; }
  if(!d) return 'r4';
  return d<'02-13' ? 'r1' : d<'05-01' ? 'r2' : d<'06-12' ? 'r3' : 'r4';
}
function ccLootSet(set){
  let s=set;
  // Остров Reload на столе (r1–r4) — вечер Reload: лут его круга по дню, не острова.
  if(!s && /^r[1-6]$/.test(ACTIVE_LANDING_SET||'')) return ccRelLootSeries();
  /* Драфт — лут острова своего турнира (набор карточек или выбранный остров), а не карьеры и не
     2026-го по умолчанию (его слово 29.09: «где выборы, иногда предметы лута из этого года, а не того
     сезона»). Без карьеры здесь всегда выходил m2. */
  if(!s && typeof CC_DRAFT_RUN!=='undefined' && CC_DRAFT_RUN && !CAREER_RUN){
    const d=(typeof activeIslandSet==='function') ? activeIslandSet() : null;
    s=(d && CC_LOOT_BY_SET[d]) ? d : (CC_LOOT_BY_SET[ACTIVE_LANDING_SET] ? ACTIVE_LANDING_SET : null);
  }
  if(!s){ try{ s=(CAREER && CAREER.career) ? careerBrSet() : null; }catch(e){ s=null; } }
  return CC_LOOT_BY_SET[s] ? s : 'm2';
}
/* Пул острова без того, что хотфикс выключил в этом сезоне (careerHotfixTick, 16.10). Только карьера: драфт и
   менеджер играют пул острова как есть. */
function ccHotfixVault(k){
  try{
    if(typeof CC_DRAFT_RUN!=='undefined' && CC_DRAFT_RUN && !CAREER_RUN) return null;
    const cr=CAREER && CAREER.career, h=cr && cr.hotfix;
    if(!h || h.set!==k || !cr.meta || h.sid!==cr.meta.id || !(h.vault||[]).length) return null;
    return new Set(h.vault);
  }catch(e){ return null; }
}
function ccLootPool(set){
  const k=ccLootSet(set), p=CC_LOOT_BY_SET[k];
  const hv=p && ccHotfixVault(k);
  return hv ? {weapons:p.weapons.filter(w=>!hv.has(w.name)), heals:p.heals} : p;
}
function ccLootPack(rng, set){
  const pick=(pool,n)=>{
    const left=pool.slice(), out=[];
    while(out.length<n && left.length)
      out.push(left.splice(Math.floor((rng?rng():Math.random())*left.length), 1)[0]);
    return out;
  };
  const pool=ccLootPool(set);
  const heals=pool.heals.filter(ccIsHealItem);
  const moves=pool.heals.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0);
  // Автомат и дробовик (отзыв), не два случайных класса; нет класса в пуле — добор ниже.
  const rifles=pool.weapons.filter(w=>w.icon==='rifle'), shotguns=pool.weapons.filter(w=>w.icon==='shotgun');
  const meta=ccProMeta(set);
  const metaPick=list=>{ if(!list.length) return null; const m=meta ? list.filter(o=>ccMetaRank(meta, o)<99) : [];
    if(!m.length) return pick(list, 1)[0];
    const r0=Math.min(...m.map(o=>ccMetaRank(meta, o))), top=m.filter(o=>ccMetaRank(meta, o)===r0);
    return pick(top, 1)[0]; };
  const pack={weapons:[metaPick(rifles), metaPick(shotguns)].filter(Boolean),
              heals:pick(heals, 2), move:metaPick(moves)};
  return ccPackFloor(pack, set, rng);   // пять слотов — пять предметов, см. ccPackFloor
}
/* Пак больше не переводится в силу. Он был прибавкой (ccLootPow, той же
   монетой, что лоадаут в драфте), пока «забрать своё» стоило четыре; с
   правкой своя точка стоит ноль, и предметы в списке остались тем,
   чем и были на экране — тем, что ты подобрал, а не тем, сколько это весит. */
// Прибавка к силе на остаток игры. Обе величины идут в _pc тоже: ближний бой
// решается им, а лучший ствол и высокая земля — как раз про ближний бой.
function ccAddGamePow(team, add){
  if(!team || !add) return;
  team._pf=Math.max(1, (team._pf||team.pow||1)+add);
  team._pc=Math.max(1, (team._pc||team._pf)+add);
}
function simulateGame(teams, lobbyOpts){
  if(teams.length===0) return [];

  // All FNCS duos play on the map. Everything else keeps the round-based model
  // below. The branch lives here rather than at the call sites so that every
  // stage of a run uses one model — a standings table assembled from two would
  // drift, and the drift would surface as averages nobody could explain.
  if(useZoneSim(teams)) return simulateGameOnMap(teams, lobbyOpts);
  let alive=teams.slice();
  const eliminationOrder=[]; // first eliminated pushed first
  // _pf is this game's power: the squad's real strength shaded by its form for
  // this game. Everything below reads _pf, never pow, so the roll applies to
  // fighting, surviving and chaining alike.
  // _pc is the same power seen from inside a fight. Ping is the only thing that
  // separates it from _pf, and it separates them in one direction: a good
  // connection wins trades, and wins nothing else. Rotating, reading the storm
  // and holding a position play the same on any ping. So _pf still decides who
  // gets caught out, and _pc decides who walks away from it.
  alive.forEach(t=>{
    t._elims=0; t._feed=[];
    t._pf=Math.max(1, t.pow*gameForm()*(CC_WORLD_FAST && CC_WORLD_FAST_NOISE ? 1+CC_WORLD_FAST_NOISE*(Math.random()*2-1) : 1));   // чужие регионы быстрой моделью — шире бросок (CC_WORLD_FAST)
    /* Что выпало форме — отдельно от того, что сделал игрок.

       Жалоба игрока: «в начале каждой игры почему-то разная
       сила, в чём проблема?». Колонка показывала _pf, то есть силу карточки,
       умноженную на бросок формы (±16% на игру, FORM_SPREAD_OPEN), — и на
       замере одна и та же связка 96 показывала 91-102 за одиннадцать игр.
       Бросок нужен движку (он откалиброван и правит дисперсию открытых
       этапов), но игроку он не виден и решать по нему нечего.

       Поэтому база броска запоминается, и колонка показывает силу карточки
       плюс то, что к ней добавили ЛУТ и ВЫСОКАЯ ЗЕМЛЯ, — ровно то, на что
       игрок влияет. См. livePow. */
    t._pfBase=t._pf;
    t._pc=Math.max(1, t._pf+(CC_ZB ? 0 : (t.closeEdge||0)));   // Zero Build: край построек не считается
  });
  const lobbySquadSize=(teams[0].squad && teams[0].squad.length) || 2;
  const DUEL_POW_EXPONENT=(DUEL_POW_EXPONENT_BY_MODE[lobbySquadSize]||5)*(CC_WORLD_FAST ? CC_WORLD_FAST_EXP : 1);
  let round=0;
  const maxRounds=teams.length+8;
  while(alive.length>1 && round<maxRounds){
    round++;
    const n=alive.length;
    const fightFraction = n>35?0.18 : n>20?0.32 : n>8?0.55 : 1;
    let fighterCount=Math.max(2, Math.round(n*fightFraction));
    fighterCount -= fighterCount%2;
    const cap=n-(n%2);
    if(fighterCount<2) fighterCount=2;
    if(fighterCount>cap) fighterCount=cap;
    // Weaker teams (lower pow) are disproportionately more likely to be the
    // ones caught out and forced into a fight this round — this is what a good
    // squad's rotations and map awareness buy them, and it is the main thing
    // that decides average placement.
    //
    // Weighting by 1/(pow + a constant) barely separated anyone: across a
    // Grand Finals field, power runs about 83 to 104, so the best team was only
    // ~20% less likely to be dragged into a fight than the worst. Real finals
    // are nowhere near that flat. Weighting by (fieldAverage / pow) raised to
    // SURVIVAL_BIAS makes the gap meaningful and, because it is a ratio against
    // the field's own average, it behaves identically at duo/trio/squad power
    // scales.
    const avgPow = alive.reduce((s,t)=>s+t._pf,0)/alive.length || 1;
    const fighters=pickWeighted(alive, t=>Math.pow(avgPow/Math.max(t._pf,1), SURVIVAL_BIAS), fighterCount);
    for(let i=fighters.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [fighters[i],fighters[j]]=[fighters[j],fighters[i]]; }
    for(let i=0;i<fighters.length;i+=2){
      const a=fighters[i], b=fighters[i+1];
      if(!alive.includes(a) || !alive.includes(b)) continue; // already caught in a chain this round
      const winner = resolveDuel(a, b, DUEL_POW_EXPONENT);
      const loser = winner===a ? b : a;
      const loserSize = (loser.squad && loser.squad.length) || 1;
      winner._elims += loserSize;
      winner._feed.push(L().feedElim(String(loser.name||'').replace(/<[^>]+>/g,'')));
      loser._feed.push(L().feedDied(String(winner.name||'').replace(/<[^>]+>/g,'')));
      eliminationOrder.push(loser);
      alive.splice(alive.indexOf(loser),1);

      // Hot streak: a strong winner can immediately catch another nearby team
      // this same round instead of getting exactly one kill and stopping —
      // this is how dominant real squads rack up multi-kill games.
      let streaker=winner, chains=0;
      while(chains<3 && alive.length>1 && Math.random()<clamp(streaker._pc/460,0.05,0.4)){
        const candidates=alive.filter(t=>t!==streaker);
        if(!candidates.length) break;
        const victim=pickWeighted(candidates, t=>1/(t._pf+30), 1)[0];
        const chainWinner = resolveDuel(streaker, victim, DUEL_POW_EXPONENT);
        const chainLoser = chainWinner===streaker ? victim : streaker;
        const chainLoserSize=(chainLoser.squad && chainLoser.squad.length) || 1;
        chainWinner._elims += chainLoserSize;
        chainWinner._feed.push(L().feedElim(chainLoser.name.replace(/<[^>]+>/g,'')));
        chainLoser._feed.push(L().feedDied(chainWinner.name.replace(/<[^>]+>/g,'')));
        eliminationOrder.push(chainLoser);
        alive.splice(alive.indexOf(chainLoser),1);
        if(chainWinner!==streaker) break; // streak broken — the streaker themselves got caught
        streaker=chainWinner; chains++;
      }
    }
  }
  if(alive.length>1){
    for(let i=alive.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [alive[i],alive[j]]=[alive[j],alive[i]]; }
  }
  const champion=alive[0];
  return [champion, ...eliminationOrder.slice().reverse()];
}

const NUM_GAMES=12;

async function runTournament(){
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev2=document.getElementById('runSummary'); if(rsPrev2) rsPrev2.innerHTML='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  skipAnimation=false;
  show('screen-results');
  ensureSkipButton();

  const {teams, zoneGroups}=await showRegularLandingPicker();
  // No more artificial leader-gap clamp — the raw simulated totals are what
  // get shown, same as a real bracket. Competitiveness now comes from tuning
  // the duel odds and streak mechanics themselves (see DUEL_POW_EXPONENT and
  // the hot-streak loop in simulateGame), not from squashing numbers after
  // the fact — which also means match history always matches the totals
  // with nothing to keep in sync.
  // Confirmed against the real point table: kills are +4 flat in every
  // mode, including squad (not scaled down). An earlier guess here scaled
  // the multiplier down for squad to fight point blowouts, but that
  // contradicted the actual scoring table — squads legitimately rack up
  // more elim points because a wipe kills more players, and that's by
  // design in the real format, not a bug to normalize away.
  await simulateGamesLive(teams, NUM_GAMES, pointsForPlace, 4, 'total', 0, null, zoneGroups,
    {mapReplay:true, choices:true, stageName:L().liveTournament});
  // Landing zone + fight now happen fresh before every one of the 12 games
  // (see pickZoneForGame, called from inside simulateGamesLive) instead of
  // once before the whole tournament — so the bonus/penalty is already
  // folded into each game's own score line, with nothing to add on after.

  const you=teams.find(t=>t.isYou);
  removeSkipButton();

  // Same as Major Finals — leader-gap cap and squad kill dampening already
  // applied inline during simulateGamesLive, so no retroactive change here.
  teams.sort((a,b)=>b.totalPts-a.totalPts || (b.wins||0)-(a.wins||0) || b.totalElims-a.totalElims);
  const place=teams.indexOf(you)+1;
  if(place===1) await celebrate(L().celKicker, L().celWinTitle, L().celWinSub, 'gold', 140);
  else if(place<=3) await celebrate(L().celKicker, L().celPodiumTitle(place), L().celPodiumSub, 'gold', 70);
  else if(place<=10) await celebrate(L().celKicker, L().celTop10Title, L().celTop10Sub, 'blue', 40);
  document.getElementById('finalBanner').style.display='block';
  document.getElementById('finalPlace').textContent='#'+place;
  document.getElementById('finalSub').textContent = place===1 ? L().victoryRoyaleResult : L().placeOfTeams(place, teams.length);
  document.getElementById('lobbyTitle').innerHTML=L().lobbyResultTitle(teams.length, NUM_GAMES);
  document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});

  renderLobby(teams, you);
  renderStats();
  finalizeRunStats(squadSize, false, place, teams.length, false, false, false, you, teams);
  showShareButton(you, place, teams.length, false, teams);
  { const dr=document.getElementById('dailyResult'); if(dr && !DAILY) dr.hidden=true; }
  if(DAILY) dailyFinish(you, place, teams);
}

// Set before the results render so the standings can show what each row won.
let lobbyPrizeTable=null;
/* ---------- Драфт дня (16.10, его «3» из «что добавить, чтобы привлечь игроков») ----------

   Как Wordle: у всех в один день (по UTC) одни и те же паки, одна попытка и таблица дня на сервере
   (mp.fncsdraft.com/daily, server/src/daily.js). Режим — свободный сквад (его слово 16.10: «пусть сквад драфт будет»): все годы и все регионы, 12 игр,
   остров дня из MAP_CHOICES по номеру дня.

   Одинаковые паки: каждый пак игроков, оружия и хилок сдаётся своим генератором от «день|пак|круг|рерол»
   (dailyRoll) — сколько бросков ушло на анимацию или на чужой выбор, на сдачу не влияет. Сама симуляция
   тоже сеется днём (dailySimOn в startRun): тот же состав и те же решения дают тот же итог.

   Попытка сгорает, когда нажата «В турнир», а не на выборе: пересдать паки нельзя, переиграть плохой
   турнир — тоже. Итог дня хранится в localStorage (fd_daily), таблица — на сервере. Сервер игру не
   считает, строку присылает браузер; таблица честно это говорит. */
const DAILY_EPOCH='2026-10-17';   // 17.10 его слово «пусть с сегодняшнего дейли драфт»: #1 — 17 октября
let DAILY=null;            // {day, n, map} — пока идёт драфт дня, иначе null
let DAILY_RAND=null;       // родной Math.random на время сеянной симуляции
let DAILY_BOARD=null;      // последний ответ /daily
function dailyDay(ms){ return new Date(ms==null ? Date.now() : ms).toISOString().slice(0, 10); }
function dailyNum(day){ return Math.round((Date.parse(day+'T00:00:00Z')-Date.parse(DAILY_EPOCH+'T00:00:00Z'))/864e5)+1; }
function dailyMap(day){ return MAP_CHOICES[ccHashStr('daily-map|'+day)%MAP_CHOICES.length]; }
function dailyBase(){ const b=ccBoardBase(); return b ? b.replace(/\/board$/, '/daily') : null; }
/* Debug и локальные сборки пишут в свою таблицу дня (17.10, его «сделай ещё на debug больше драфтов»): у debug и
   прода один сервер, тестовые драфты не должны вставать в настоящий топ. Сервер держит её отдельно (?t=dbg → daily_dbg). */
function dailyDbg(){ try{ return !/^(www\.)?fncsdraft\.com$/.test(location.hostname); }catch(e){ return true; } }
function dailyQ(){ return dailyDbg() ? 't=dbg&' : ''; }
function dailyStore(){ try{ return JSON.parse(localStorage.getItem('fd_daily')||'{}')||{}; }catch(e){ return {}; } }
function dailySave(o){ try{ localStorage.setItem('fd_daily', JSON.stringify(o)); }catch(e){} }
function dailyId(){
  const s=dailyStore();
  if(!s.id){
    let id=''; try{ id=crypto.randomUUID(); }catch(e){ id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2); }
    s.id=String(id).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40); dailySave(s);
  }
  return s.id;
}
function dailyToday(){ const s=dailyStore(), d=dailyDay(); return (s.days||{})[d]||null; }
function dailyNick(){
  const s=dailyStore(); if(s.nick) return s.nick;
  try{ const pl=CAREER && CAREER.player; if(pl && (pl.nick||pl.handle)) return String(pl.nick||pl.handle).slice(0, 24); }catch(e){}
  return '';
}
/* ПАКИ ДНЯ — СЛУЧАЙНЫЕ, СЕЗОН ДНЯ — ОДИН НА ВСЕХ (16.10, его слово: «нет, пусть будут рандомные игроки, пусть будут
   рандомные сезоны, из этих сезонов пусть будут игроки того периода»). Было: одни паки на всех, как в Wordle.
   Теперь день задаёт остров (dailyMap), остров — сезон, а паки у каждого свои, только из игроков года этого
   сезона (preSelectedYears в dailyStart; поле турнира берётся из того же года). Таблица — по силе состава.
   Год острова — по букве ключа MAP_CHOICES: m Ch7 2026, t Ch6 2025, f Ch5 2024, e Ch4 2023, k Ch3 2022,
   j Ch2 S5–8 2021, i Ch2 S2–4 2020, h Ch1 S9/SX и Ch2 S1 2019. */
const DAILY_MAP_YEAR={m:2026, t:2025, f:2024, e:2023, k:2022, j:2021, i:2020, h:2019};
function dailyYear(map){ return DAILY_MAP_YEAR[String((map && map.key) || '')[0]] || 2026; }
function dailyRoll(tag, fn){ return fn(); }
function dailySimOn(){
  if(!DAILY || DAILY_RAND) return;
  DAILY_RAND=Math.random;
  Math.random=careerRng(ccHashStr('daily|'+DAILY.day+'|sim|'+drafted.map(hKey).sort().join(',')));
}
function dailySimOff(){ if(DAILY_RAND){ Math.random=DAILY_RAND; DAILY_RAND=null; } }

function dailyStart(){
  const today=dailyToday();
  if(today){ dailyOpen(); return; }
  const day=dailyDay(), map=dailyMap(day);
  chooseMode(4);
  DAILY={day, n:dailyNum(day), map:map.key, year:dailyYear(map)};
  preSelectedRegions=[]; preSelectedYears=[DAILY.year]; preHomeRegion=null; pendingMapSet=map.key;
  setSimMode(false); setPlayMode(false);
  startDraft(4);
}
/* Полоса над драфтом: какой это день и что попытка одна. */
function dailyBanner(){
  const scr=document.getElementById('screen-draft'); if(!scr) return;
  let b=document.getElementById('dailyBar');
  if(!DAILY){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement('div'); b.id='dailyBar'; b.className='dy-bar'; scr.insertBefore(b, scr.firstChild); }
  const T=L(), m=MAP_CHOICES.find(x=>x.key===DAILY.map);
  b.innerHTML='<b>'+esc(T.dyTitle(DAILY.n))+'</b><span>'+esc((m ? m.label+' · ' : '')+T.dyPlayers(DAILY.year)+' · '+T.dyRules)+'</span><span>'+esc(T.dyOnce)+'</span>';
}
/* «В турнир» нажато — попытка сгорела, даже если вкладку закроют посреди турнира. */
function dailyBurn(){
  if(!DAILY) return;
  const s=dailyStore(); s.days=s.days||{};
  if(!s.days[DAILY.day]) s.days[DAILY.day]={n:DAILY.n, map:DAILY.map, at:Date.now()};
  Object.keys(s.days).sort().slice(0, -30).forEach(k=>{ delete s.days[k]; });
  dailySave(s);
}
function dailyFinish(you, place, teams){
  if(!DAILY) return;
  const s=dailyStore(); s.days=s.days||{};
  const r=s.days[DAILY.day]=Object.assign(s.days[DAILY.day]||{}, {n:DAILY.n, map:DAILY.map, place, field:teams.length,
    score:Math.round(you.totalPts||0), elims:you.totalElims||0, wins:you.wins||0, team:drafted.map(p=>p.handle),
    ...dailyPowerOf(drafted)});
  dailySave(s);
  DAILY=null;
  dailyBanner();
  const box=document.getElementById('dailyResult')||(()=>{ const d=document.createElement('div'); d.id='dailyResult'; d.className='dy-res';
    const fb=document.getElementById('finalBanner'); fb.parentNode.insertBefore(d, fb.nextSibling); return d; })();
  box.hidden=false;
  dailyResultDraw(box, r);
  try{ homeRender(); }catch(e){}
}
function dailyShareText(r){
  const T=L(), m=MAP_CHOICES.find(x=>x.key===r.map);
  return 'FNCS Draft · '+T.dyTitle(r.n)+(r.power ? '\n💪 '+dailyPowerWord()+' '+dailyPowFmt(r)+(r.syn ? ' ('+dailyAvgFmt(r)+' +'+r.syn+')' : '') : '')+'\n'+(r.place===1 ? '👑' : r.place<=3 ? '🥇' : r.place<=10 ? '🔥' : '🎯')+' #'+r.place+'/'+r.field+' · '+r.score+' '+T.dyPts+
    (m ? '\n🗺️ '+m.label : '')+'\n👥 '+(r.team||[]).join(' + ')+'\nhttps://fncsdraft.com';
}
function dailyShare(){
  const r=dailyToday(); if(!r || r.score==null) return;
  const text=dailyShareText(r), T=L();
  const done=()=>{ document.querySelectorAll('.dy-share').forEach(b=>{ b.textContent=T.dyCopied; setTimeout(()=>{ b.textContent=T.dyShare; }, 1800); }); };
  if(navigator.share){ navigator.share({text}).catch(()=>{}); return; }
  try{ navigator.clipboard.writeText(text).then(done, ()=>{}); }catch(e){}
}
let DAILY_NICK_BAD='';
function dailySend(){
  const r=dailyToday(), base=dailyBase(), inp=document.getElementById('dyNick');
  if(!r || r.score==null || !base) return;
  const nick=String(inp && inp.value || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 24);
  if(!nick){ if(inp) inp.focus(); return; }
  const s=dailyStore(); s.nick=nick; dailySave(s);
  let country=''; try{ country=String((CAREER && CAREER.player && CAREER.player.country)||'').toLowerCase().slice(0, 2); }catch(e){}
  const day=dailyDay();
  fetch(base+(dailyDbg() ? '?t=dbg' : ''), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:dailyId(), day, nick, country,
    score:r.score, place:r.place, field:r.field, team:r.team, power:r.power||0, syn:r.syn||0})})
    .then(x=>x.ok ? x.json().then(j=>({ok:true, nick:j && j.nick}), ()=>({ok:true})) : x.json().then(j=>({err:j && j.err}), ()=>({}))).catch(()=>({})).then(res=>{
      /* Сервер мог записать ник иначе: n-word и оскорбления встают в таблицу как «user» и цифры
         (server/src/nick-filter.js, как у Fortnite после бана). Своя строка показывает то, что записано. */
      const shown=(res.ok && res.nick) || nick;
      if(res.ok){ const s2=dailyStore(); if(s2.days && s2.days[day]){ s2.days[day].sent=shown; dailySave(s2); } if(shown!==nick && s2.nick===nick){ s2.nick=shown; dailySave(s2); } }
      if(res.err==='nickbad'){ const s3=dailyStore(); if(s3.nick===nick){ s3.nick=''; dailySave(s3); } DAILY_NICK_BAD=nick; }
      DAILY_BOARD=null;
      document.querySelectorAll('#dailyResult, #dailyModalBody').forEach(el=>dailyResultDraw(el, dailyToday()));
      try{ homeDailyDraw(); }catch(e){}
    });
}
function dailyResultDraw(box, r){
  if(!box || !r) return;
  const T=L();
  const head='<div class="dy-head"><b>'+esc(T.dyTitle(r.n))+'</b>'+(r.score!=null ? '<span>'+(r.power ? '💪 '+esc(dailyPowerWord())+' '+dailyPowFmt(r)+(r.syn ? ' ('+dailyAvgFmt(r)+' + '+esc(dailySynWord())+' '+r.syn+')' : '')+' · ' : '')+'#'+r.place+' / '+r.field+' · '+r.score+' '+esc(T.dyPts)+'</span>' : '<span>'+esc(T.dyLeft)+'</span>')+'</div>';
  const send=r.score==null || !dailyBase() ? '' : r.sent ? '<p class="dy-ok">'+esc(T.dySent(r.sent))+'</p>'
    : '<div class="dy-send"><input id="dyNick" maxlength="24" autocomplete="nickname" placeholder="'+esc(T.dyNick)+'" value="'+esc(dailyNick())+'">'+
      '<button class="ch-play" type="button" onclick="dailySend()">'+esc(T.dySend)+'</button></div>'+
      (DAILY_NICK_BAD ? '<p class="dy-bad" style="color:#ff9b9b;margin:4px 0 0;font-size:13px;">'+esc(T.dyNickBad||'')+'</p>' : '');
  const share=r.score!=null ? '<button class="hero-btn hero-btn-alt dy-share" type="button" onclick="dailyShare()">'+esc(T.dyShare)+'</button>' : '';
  box.innerHTML=head+send+'<div class="dy-acts">'+share+'<button class="home-more" type="button" onclick="dailyOpen()">'+esc(T.dyBoard)+'</button></div>'+
    '<p class="home-sub dy-next">'+esc(T.dyNext(dailyLeft()))+'</p>';
}
function dailyLeft(){
  const ms=Date.parse(dailyDay(Date.now()+864e5)+'T00:00:00Z')-Date.now();
  const h=Math.floor(ms/36e5), m=Math.floor(ms%36e5/6e4);
  return h+' '+L().dyH+' '+m+' '+L().dyM;
}
/* Без задержки (16.10, его «с делеем таблица появляется»): прошлый ответ за сегодня лежит в fd_daily_board и
   отдаётся сразу, свежий — вторым вызовом cb, когда придёт (все, кто зовёт, просто перерисовывают). */
function dailyLoad(cb){
  const base=dailyBase(); if(!base){ cb(null); return; }
  const day=dailyDay();
  let d=DAILY_BOARD;
  if(d && d.day===day && Date.now()-d._at<60000){ cb(d); return; }
  if(!(d && d.day===day)){ try{ const c=JSON.parse(localStorage.getItem('fd_daily_board')||'null'); if(c && c.day===day) d=c; }catch(e){} }
  if(d && d.day===day) cb(d);
  fetch(base+'?'+dailyQ()+'day='+day+'&me='+encodeURIComponent(dailyId())).then(r=>r.ok ? r.json() : null).catch(()=>null).then(x=>{
    if(!x){ if(!(d && d.day===day)) cb(null); return; }
    DAILY_BOARD=Object.assign(x, {_at:Date.now()});
    try{ localStorage.setItem('fd_daily_board', JSON.stringify(DAILY_BOARD)); }catch(e){}
    cb(DAILY_BOARD); });
}
/* ТАБЛИЦА ДНЯ — ПО СИЛЕ СОСТАВА (16.10, его слово: «в таблице дня — состав, у которого больше всего силы»,
   потом «нет, только сила»). Сила — средний рейтинг четырёх карточек, как «88/100» в драфте; сервер ставит по ней,
   очки турнира — только при равенстве. У строк, отправленных до правки, силы нет (0) — они внизу. */
function dailyPowerWord(){ return ({ru:'сила', fr:'force', it:'forza', pt:'força', de:'Stärke', es:'fuerza'}[LANG]) || 'power'; }
function dailySynWord(){ return ({ru:'синергия', fr:'synergie', it:'sinergia', pt:'sinergia', de:'Synergie', es:'sinergia'}[LANG]) || 'synergy'; }
/* ТОЧНАЯ СИЛА (16.10, его слово «пусть будет точная сила» — и вопрос «а синергия за язык, страну есть?»):
   средний рейтинг карточек до сотых + синергия так, как её считает игра (computeSynergy: сыгранная пара +5, одна
   страна +2, общий язык +1; с 10.11 без потолка, в остальных режимах SYN_POW_CAP = 12). Без ничьих в таблице, и
   выигрывает не только тот, кто брал самые большие цифры, но и тот, кто собрал сыгранный состав. */
/* Синергия драфта дня: та же computeSynergy плюс две связи только для этого режима.
   Роли: ровно один ИГЛ +ROLE_BONUS_STEP, правило карточного режима из гранд-финалов.
   Цепочка: двое не играли вместе, но у них общий напарник, +DAILY_SYN_CHAIN раз на состав.
   Клуб (+DAILY_SYN_CLUB, раз на состав) добавлен 8.11; общий финал пробовали замером (0-3% паков) и не взяли.
   Цепочка открывается в 6-35% паков по годам, роль последним паком в 3-65%. */
const DAILY_SYN_CHAIN=2;
const DAILY_SYN_CLUB=3;   // один клуб в год карточек, раз на состав; редкий, поэтому выше цепочки
let _dyMates=null, _dyMatesLen=-1;
function dailyMatesOf(h){
  if(_dyMatesLen!==TEAMMATE_GROUPS.length){
    _dyMates=new Map();
    TEAMMATE_GROUPS.forEach(g=>g.forEach(a=>{ let s=_dyMates.get(a); if(!s){ s=new Set(); _dyMates.set(a, s); } g.forEach(b=>{ if(b!==a) s.add(b); }); }));
    _dyMatesLen=TEAMMATE_GROUPS.length;
  }
  return _dyMates.get(h) || null;
}
// Общий напарник двоих, которые сами вместе не играли; иначе null.
function dailyChainVia(a, b){
  const A=dailyMatesOf(a), B=dailyMatesOf(b);
  if(!A || !B || A.has(b)) return null;
  const small=A.size<B.size ? A : B, big=small===A ? B : A;
  let best=null; for(const x of small) if(big.has(x) && (best===null || x<best)) best=x;
  return best;
}
function dailyRoleOf(p){ try{ return (attrsFor(p)||{}).roleKey||null; }catch(e){ return null; } }
function dailySynWords(){
  return ({ru:{role:'один ИГЛ в составе', chain:'общий напарник', igl2:'второй ИГЛ', club:'один клуб'}, fr:{role:'un seul IGL', chain:'coéquipier commun', igl2:'deuxième IGL', club:'même club'},
    it:{role:'un solo IGL', chain:'compagno in comune', igl2:'secondo IGL', club:'stesso club'}, pt:{role:'só um IGL', chain:'parceiro em comum', igl2:'segundo IGL', club:'mesmo clube'},
    de:{role:'genau ein IGL', chain:'gemeinsamer Partner', igl2:'zweiter IGL', club:'gleicher Klub'}, es:{role:'un solo IGL', chain:'compañero en común', igl2:'segundo IGL', club:'mismo club'}}[LANG])
    || {role:'exactly one IGL', chain:'shared teammate', igl2:'second IGL', club:'same club'};
}
function dailySynergy(sq){
  const s=computeSynergy(sq), W=dailySynWords();
  const out={bonus:s.bonus, details:s.details.slice(), links:s.links.slice(), role:0, chain:null, club:null};
  if(!sq || sq.length<2) return out;
  if(sq.filter(p=>dailyRoleOf(p)==='roleIGL').length===1){
    out.role=ROLE_BONUS_STEP; out.bonus+=ROLE_BONUS_STEP;
    out.details.push(W.role+' (+'+ROLE_BONUS_STEP+')');
  }
  // Один клуб: двое с одним org, но не сыгранная пара (та уже взяла своё, дуо почти всегда в одном клубе).
  for(let i=0;i<sq.length && !out.club;i++) for(let j=i+1;j<sq.length;j++){
    const a=sq[i], b=sq[j];
    if(!a.org || a.org!==b.org || ccWereTeammates(a.handle, b.handle)) continue;
    out.club={a:a.handle, b:b.handle, org:a.org}; break;
  }
  if(out.club){
    out.bonus+=DAILY_SYN_CLUB;
    out.details.push(out.club.a+' + '+out.club.b+': '+W.club+' '+out.club.org+' (+'+DAILY_SYN_CLUB+')');
    out.links.push({a:out.club.a, b:out.club.b, type:'club', val:DAILY_SYN_CLUB});
  }
  for(let i=0;i<sq.length && !out.chain;i++) for(let j=i+1;j<sq.length;j++){
    const via=dailyChainVia(sq[i].handle, sq[j].handle);
    if(via){ out.chain={a:sq[i].handle, b:sq[j].handle, via}; break; }
  }
  if(out.chain){
    out.bonus+=DAILY_SYN_CHAIN;
    out.details.push(out.chain.a+' + '+out.chain.b+': '+W.chain+' '+out.chain.via+' (+'+DAILY_SYN_CHAIN+')');
    out.links.push({a:out.chain.a, b:out.chain.b, type:'chain', val:DAILY_SYN_CHAIN});
  }
  return out;
}
// Синергия, которую показывает драфт: в драфте дня своя, в остальных обычная.
function draftSynergy(sq){ return (typeof DAILY!=='undefined' && DAILY) ? dailySynergy(sq) : computeSynergy(sq); }
function dailyPowerOf(sq){
  if(!sq || !sq.length) return {power:0, syn:0, avg:0};
  const avg=sq.reduce((s,p)=>s+p.rating,0)/sq.length, syn=dailySynergy(sq).bonus;   // без потолка: драфт дня
  return {power:Math.round((avg+syn)*100)/100, syn, avg:Math.round(avg*100)/100};
}
// Строка с сервера несёт p100 (сотые); своя запись — power с сотыми и avg.
function dailyPowNum(r){ return r.p100 ? r.p100/100 : (r.power||0); }
function dailyPowFmt(r){ return dailyPowNum(r).toFixed(2); }
function dailyAvgFmt(r){ return (r.avg!=null ? r.avg : dailyPowNum(r)-(r.syn||0)).toFixed(2); }
/* Строка таблицы дня (17.10, его «daily leaderboard додизайнить таблицу»): всё в одну строку не влезало — состав,
   синергия и место резались, сила справа уезжала за край телефона. Теперь: место (топ-3 — золото/серебро/бронза),
   ник с флагом, состав чипами в перенос, под ним место в турнире и очки; справа крупно сила и её разбор. */
// Медали прошлых дней у ника (сервер считает по браузеру: medals=[1-х, 2-х, 3-х мест]); кружки .cc-medals.
function dailyMedalsHTML(m){
  if(!Array.isArray(m) || !(m[0]+m[1]+m[2])) return '';
  const T=L(), cls=['g','s','b'], tip=[T.ccMedalGold, T.ccMedalSilver, T.ccMedalBronze];
  return '<span class="cc-medals">'+m.slice(0,3).map((v,i)=>v>0 ? '<i class="'+cls[i]+'" title="'+esc((tip[i]||'')+': '+v)+'">'+(v|0)+'</i>' : '').join('')+'</span>';
}
function dailyRowsHTML(rows, from){
  const T=L(), flag=c=>c ? '<img src="flags/w20/'+esc(ccCountryOf(c))+'.png" alt="" onerror="this.remove()">' : '';
  const head='<div class="dy-thead"><span>#</span><span>'+esc(T.dyColPlayer)+'</span><span>'+esc(dailyPowerWord())+'</span></div>';
  return head+rows.map((r,i)=>{
    const n=(from||0)+i+1, med=n<=3 ? ' dy-m'+n : '';
    const team=r.team ? String(r.team).split(',').filter(Boolean).map(h=>'<em>'+esc(h)+'</em>').join('') : '';
    const pow=dailyPowNum(r)>0;
    return '<div class="dy-row'+(r.you ? ' me' : '')+med+'"><i class="dy-rk">'+n+'</i>'+
      '<div class="dy-who"><b>'+flag(r.country)+esc(r.nick)+dailyMedalsHTML(r.medals)+(r.you ? ' <u>'+esc(T.dyYou)+'</u>' : '')+'</b>'+
        (team ? '<div class="dy-team">'+team+'</div>' : '')+
        '<small>#'+r.place+'/'+r.field+' · '+r.score+' '+esc(T.dyPts)+'</small></div>'+
      '<div class="dy-pow"><b>'+(pow ? dailyPowFmt(r) : '-')+'</b>'+
        (pow ? '<small title="'+esc(T.dyPowSplit)+'">'+dailyAvgFmt(r)+(r.syn ? ' <span>+'+r.syn+'</span>' : '')+'</small>' : '')+'</div></div>';
  }).join('');
}
/* Окно дня: свой итог и таблица (поверх экрана, как «топ 50» на главной). */
function dailyOpen(){
  const T=L();
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  const r=dailyToday();
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(T.dyBoard)+'">'+
    '<div class="hr-top"><b>'+esc(T.dyTitle(dailyNum(dailyDay())))+' · '+esc(T.dyBoard)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    '<div class="hr-wrap">'+(r ? '<div class="dy-res" id="dailyModalBody"></div>' : '')+'<div id="dailyModalRows"><p class="home-sub">'+esc(T.lbLoad)+'</p></div></div></div>';
  document.body.classList.add('hr-lock');
  if(r) dailyResultDraw(document.getElementById('dailyModalBody'), r);
  dailyLoad(d=>{
    const el=document.getElementById('dailyModalRows'); if(!el) return;
    if(!d){ el.innerHTML='<p class="home-sub">'+esc(T.lbErr)+'</p>'; return; }
    el.innerHTML=(d.rows||[]).length ? '<div>'+dailyRowsHTML(d.rows)+'</div>'+(d.you ? '<div class="hb-me">'+esc(T.dyRank(d.you.rank, d.total))+'</div>' : '')+
      '<p class="home-sub dy-note">'+esc(T.dyHonest)+'</p>'
      : '<p class="home-sub">'+esc(T.dyEmpty)+'</p>';
  });
}
/* Блок на главной. Каркас с текстом стоит в разметке (вшивается сборкой, виден до app.js — его «с делеем появляется»
   16.10), номер дня и остров ставит маленький скрипт сразу за ним (DAILY_MAPS_INLINE — тот же порядок, что MAP_CHOICES,
   сверяет check-daily-draft). Здесь — только то, что зависит от игры: свой итог, кнопки, таймер, верх таблицы дня. */
function homeDailyDraw(){
  const box=document.getElementById('homeDaily'); if(!box) return;
  const T=L(), day=dailyDay(), map=dailyMap(day), r=dailyToday();
  const set=(id, h)=>{ const el=document.getElementById(id); if(el) el.innerHTML=h; };
  set('dyNum', '#'+dailyNum(day));
  set('dyMap', esc(map.label+' · '+T.dyPlayers(dailyYear(map))));
  set('dyMine', r ? (r.score!=null ? '<div class="dy-mine"><b>'+(r.power ? '💪 '+dailyPowFmt(r) : '#'+r.place+' / '+r.field)+'</b><span>'+(r.power ? '#'+r.place+'/'+r.field+' · ' : '')+r.score+' '+esc(T.dyPts)+'</span></div>'
                                   : '<div class="dy-mine"><span>'+esc(T.dyLeft)+'</span></div>') : '');
  if(r) set('dyActs', '<button class="hero-btn hero-btn-alt" type="button" onclick="dailyOpen()">'+esc(T.dyBoard)+'</button>'+
    (r.score!=null ? '<button class="hero-btn hero-btn-alt dy-share" type="button" onclick="dailyShare()">'+esc(T.dyShare)+'</button>' : ''));
  set('dyNext', esc(T.dyNext(dailyLeft())));
  box.hidden=false;
  dailyLoad(d=>{
    const el=document.getElementById('homeDailyRows'); if(!el) return;
    set('dyTotal', d && d.total ? ' · '+d.total : '');
    if(!d){ el.innerHTML=''; return; }
    el.innerHTML=(d.rows||[]).length ? '<div>'+dailyRowsHTML(d.rows.slice(0, 5))+'</div>'+(d.you ? '<div class="hb-me">'+esc(T.dyRank(d.you.rank, d.total))+'</div>' : '')
                                     : '<p class="home-sub">'+esc(T.dyEmpty)+'</p>';
    // Для оболочки: при следующем заходе эти строки встанут до app.js (скрипт сразу за #homeDaily).
    try{ localStorage.setItem('fd_daily_home', JSON.stringify({day:d.day, lang:LANG, total:d.total||0, html:el.innerHTML})); }catch(e){}
  });
}


// ---------- Event results panel ----------
// Rebuilds the results screen in the shape the game itself uses: standings on
// the left, squad stats and a points donut on the right, themed per mode.

// Table palettes matched to the results panel, one per mode.
// Every mode now uses the Majors' table palette, so this only has to clear any
// overrides a previous run left on <html> and let the stylesheet defaults show.
// The cover art you click sets the tone for the whole run. Each palette below
// is built around the dominant hue actually sampled from art/mode-*.jpg, so the
// interface a player lands in reads as the same object as the card they picked.
// --lb-you is deliberately absent: :root already defines it as var(--accent),
// so it follows the accent for free.
// glow is [r,g,b,alpha] per ambient light; the transparent twin is derived, so
// a hue can never be edited in one place and forgotten in the other.
const MODE_THEME={
  // The Majors keep the emerald interface, but the page behind it becomes the
  // FNCS in-game backdrop: colours sampled straight off a Global Championship
  // leaderboard screenshot — teal top-left, deep blue bottom, a pale steel
  // wash top-right where the crest glows. The panels go translucent so the
  // sweep reads through the draft, the weapon pack and the heal pack, the way
  // the leaderboard rows sit on it in game.
  // inkDim/inkDimmer/lineCol are lifted because the stock greys were tuned
  // against a near-black page — on a coloured sweep they sink to unreadable.
  // The in-game screen keeps its secondary labels bright for the same reason.

  // Major 1 is the Summit LAN in Düsseldorf, and "summit" is exactly what the
  // cover art draws: ice, chrome, white plates. Cold steel over teal.
  m1:     {glow:[[16,120,130,.55],[150,192,212,.42],[10,41,85,.75]],
           pageBase:'linear-gradient(160deg,#0c5566 0%,#08454f 44%,#0a3550 100%)',
           panel:'rgba(7,38,46,.62)', panel2:'rgba(9,48,58,.58)',
           inkDim:'#a9c8cc', inkDimmer:'#7ea6ac', lineCol:'rgba(150,210,215,.22)'},

  // Major 2 is the road to the Global Championship in Antwerp — the world's
  // diamond capital. Same FNCS family, but lit warm: amber low light and a
  // white diamond flare, over a deeper blue than the Summit's.
  m2:     {glow:[[222,154,44,.60],[226,236,244,.42],[9,34,76,.80]],
           pageBase:'linear-gradient(160deg,#14484c 0%,#0d3a4e 46%,#122f49 100%)',
           panel:'rgba(9,35,49,.62)', panel2:'rgba(12,44,60,.58)',
           inkDim:'#c4c8c4', inkDimmer:'#93a2a4', lineCol:'rgba(212,190,140,.24)'},

  // FNCS 2025 is white, chrome and red where the 2026 Majors are teal and ice.
  // These are not sampled off a screenshot: Epic publishes the season's own
  // palette in the event metadata, which Tracker carries as imp_event.Colors,
  // so this is the identity rather than my reading of a JPEG.
  //   HighlightColor       #FF0040   the red slashes on the cover
  //   PrimaryColor         #977EA5   mauve
  //   BackgroundLeftColor  #829FA9   steel
  //   BackgroundRightColor #FFFFFF   the white the whole set is built on
  //   SecondaryColor       #161616   near black
  // Two references agreeing is what settled it: #977EA5 is also, to within a
  // shade, the lavender of the alternating rows sampled off the Chapter 6
  // in-game leaderboard. Held in a dark register because the app is dark and
  // the season is not — the hues are Epic's, only the lightness is moved, and
  // the red stays at full strength on the hairlines where it reads as a
  // signature rather than a wash.
  t1:     {glow:[[255,0,64,.42],[255,255,255,.32],[22,22,22,.80]],
           pageBase:'linear-gradient(160deg,#33303c 0%,#2a2731 46%,#1b1a1f 100%)',
           panel:'rgba(28,26,33,.62)', panel2:'rgba(38,35,45,.58)',
           inkDim:'#cfc9d6', inkDimmer:'#9b93a6', lineCol:'rgba(255,0,64,.26)'},

  allfncs:{accent:'#3f62ca', accentInk:'#0a1229', bg:['#0f1a38','#0d142b','#0a0f1f'],
           line:'rgba(130,160,240,.28)', soft:'rgba(130,160,240,.10)',
           ink:'#eaeefb', dim:'rgba(205,215,245,.72)', row:'#121a30',
           glow:[[63,98,202,.34],[80,120,255,.24],[63,98,202,.16]]},
  duo:    {accent:'#d6ad33', accentInk:'#261e05', bg:['#392e0e','#2b240d','#1f1a0a'],
           line:'rgba(225,195,110,.28)', soft:'rgba(225,195,110,.10)',
           ink:'#fbf5e6', dim:'rgba(240,228,196,.72)', row:'#302912',
           glow:[[214,173,51,.30],[236,196,84,.20],[214,173,51,.14]]},
  trio:   {accent:'#41c84d', accentInk:'#05240a', bg:['#133416','#0f2911','#0b1e0d'],
           line:'rgba(120,225,140,.28)', soft:'rgba(120,225,140,.10)',
           ink:'#ebfbec', dim:'rgba(203,240,208,.72)', row:'#123015',
           glow:[[65,200,77,.30],[120,220,110,.20],[65,200,77,.14]]},
  squad:  {accent:'#ed961d', accentInk:'#2a1a03', bg:['#39270e','#2b1f0d','#1f160a'],
           line:'rgba(240,180,90,.28)', soft:'rgba(240,180,90,.10)',
           ink:'#fdf2e4', dim:'rgba(245,222,194,.72)', row:'#302412',
           glow:[[237,150,29,.30],[245,185,70,.20],[237,150,29,.14]]}
};
// m1 and m2 still share one cover image in art/, so the cards look alike on the
// menu; the backdrops are what tells the two Majors apart once you are inside.

// pending===true reads the choice made on the mode screen, before startDraft
// commits it — that is what lets the region screen already wear the mode's
// colours instead of switching a screen later than the player expects.
function modeThemeKey(pending){
  const cards = pending ? pendingCards   : CARD_MODE;
  const set   = pending ? pendingCardSet : CARD_SET;
  const major = pending ? pendingMajor   : isMajorMode;
  const size  = pending ? pendingSize    : squadSize;
  // All three 2025 Majors share the t1 entry. Epic publishes the season's
  // palette in imp_event.Colors, and the Grand Finals of Major 2 and Major 3
  // carry the same block as Major 1's, byte for byte -- #FF0040, #977EA5,
  // #829FA9, #FFFFFF, #161616. What varies in that metadata is the stage, not
  // the Major. Giving each one an accent of my own would be inventing a colour
  // Epic did not use; the tiles tell the modes apart instead.
  if(cards) return set==='m1' ? 'm1' : T_EVENT_NAME[set] ? 't1' : 'm2';
  if(major) return 'allfncs';
  return size===3 ? 'trio' : (size===4 ? 'squad' : 'duo');
}

const THEME_VARS=['--accent','--accent-ink','--lb-bg','--lb-line','--lb-line-soft',
                  '--lb-ink','--lb-dim','--lb-you','--lobby-row',
                  '--glow-a','--glow-a0','--glow-b','--glow-b0','--glow-c','--glow-c0',
                  '--page-base','--panel','--panel2','--ink-dim','--ink-dimmer','--line',
                  '--mode-art','--mode-veil'];

// Back to the stylesheet's own emerald — the menu is not "in" any mode.
function clearLobbyTheme(){
  const s=document.documentElement.style;
  THEME_VARS.forEach(k=>s.removeProperty(k));
}

function applyLobbyTheme(pending){
  // Always start from the stylesheet's own values, so an entry that only sets
  // the glow (the Majors) cannot inherit an accent left over from a past run.
  clearLobbyTheme();
  const t=MODE_THEME[modeThemeKey(pending)];
  if(!t) return;
  const s=document.documentElement.style;
  if(t.accent){
    s.setProperty('--accent', t.accent);
    s.setProperty('--accent-ink', t.accentInk);
    s.setProperty('--lb-bg', 'linear-gradient(135deg,'+t.bg[0]+' 0%,'+t.bg[1]+' 55%,'+t.bg[2]+' 100%)');
    s.setProperty('--lb-line', t.line);
    s.setProperty('--lb-line-soft', t.soft);
    s.setProperty('--lb-ink', t.ink);
    s.setProperty('--lb-dim', t.dim);
    s.setProperty('--lobby-row', t.row);
  }
  if(t.glow){
    ['a','b','c'].forEach((slot,i)=>{
      const [r,g,b,a]=t.glow[i];
      s.setProperty('--glow-'+slot, 'rgba('+r+','+g+','+b+','+a+')');
      s.setProperty('--glow-'+slot+'0', 'rgba('+r+','+g+','+b+',0)');
    });
  }
  if(t.pageBase) s.setProperty('--page-base', t.pageBase);
  // Арт режима под вуалью — задник лобби, как в игре. Снимается clearLobbyTheme.
  if(MODE_ART_NOW){
    s.setProperty('--mode-art', 'url('+MODE_ART_NOW+')');
    s.setProperty('--mode-veil', 'linear-gradient(180deg,rgba(6,12,18,.84) 0%,rgba(6,12,18,.92) 45%,rgba(6,12,18,.97) 100%)');
  }
  // Translucent panels are what let the backdrop show through the packs; only
  // set them when a mode asks, so every other mode keeps its solid cards.
  if(t.panel){ s.setProperty('--panel', t.panel); s.setProperty('--panel2', t.panel2); }
  if(t.inkDim) s.setProperty('--ink-dim', t.inkDim);
  if(t.inkDimmer) s.setProperty('--ink-dimmer', t.inkDimmer);
  if(t.lineCol) s.setProperty('--line', t.lineCol);
}

// The results screen keeps its markup between runs, so the summary panel from
// the previous tournament stays on screen while the next one is still picking
// a landing spot. Wipe it whenever a run starts (or we go back to the menu).
function clearEventPanel(){
  const host=document.getElementById('eventPanel');
  if(host) host.innerHTML='';
}

function renderLobby(teams, you){
  window.lastLobbyTeams=teams;
  window._youTeam=you||teams.find(t=>t.isYou);
  applyLobbyTheme();
  const body=document.getElementById('lobbyBody');
  const showDrop=teams.some(t=>t && landingRecord(t));
  const headRow=body.parentElement.querySelector('thead tr');
  if(headRow){
    const dropTh=headRow.querySelector('th.drop-col');
    if(showDrop && !dropTh){
      const th=document.createElement('th');
      th.className='num drop-col'; th.textContent=L().dropHeader;
      headRow.appendChild(th);
    } else if(!showDrop && dropTh){ dropTh.remove(); }
    const existing=headRow.querySelector('th.prize-col');
    if(false && lobbyPrizeTable && !existing){
      const th=document.createElement('th');
      th.className='num prize-col'; th.textContent=L().prizeHeader;
      headRow.appendChild(th);
    } else if(existing){ existing.remove(); }
  }
  body.innerHTML='';
  teams.forEach((t,i)=>{
    const tr=document.createElement('tr');
    const rowClasses=['lobby-row'];
    if(i===0) rowClasses.push('lobby-first');
    if(t.isYou) rowClasses.push('lobby-you');
    tr.className=rowClasses.join(' ');
    const nameStyled = (t.isYou||t.isClub) ? '<b style="color:var(--lb-you);">'+t.name+'</b>' : t.name;
    const powerCell = t.pow!=null ? Math.round(t.pow) : (t.displayPower!=null ? t.displayPower : (t.avgRating!=null ? t.avgRating : Math.round(t.squad.reduce((s,p)=>s+p.rating,0)/t.squad.length)));
    const matches = (t.gameLog ? t.gameLog.filter(g=>!g.isLandingBonus).length : (t.stageLog ? t.stageLog.filter(g=>!g.isLandingBonus).length : NUM_GAMES))
                    + (t._carryGames||0);
    const prize = lobbyPrizeTable ? prizeFor(lobbyPrizeTable, i+1) : 0;
    // Приз — у ника, как во всех таблицах с деньгами (правка 28.09); колонки нет.
    const prizeCell = '';
    const dropCell = showDrop ? `<td class="num lobby-num" style="color:var(--ink-dim);white-space:nowrap;">${landingCellHTML(t)}</td>` : '';
    tr.innerHTML=`<td class="lobby-rank">#${i+1}</td><td>${nameStyled}${stPrizeHTML(prize, (t.squad||[]).length||squadSize)}</td><td class="num lobby-pts">${t.totalPts}</td><td class="num lobby-num">${matches}</td><td class="num lobby-num">${t.wins||0}</td><td class="num lobby-num">${t.totalElims}</td><td class="num lobby-num">${powerCell}</td>${dropCell}${prizeCell}`;
    tr.style.cursor='pointer';
    tr.onclick=()=>showMatchHistory(t);
    body.appendChild(tr);
  });
  renderLandingResultsMap(teams);
  animateRows(document.querySelector('.lobby-wrap'));
}

function showMatchHistory(team, preferStage){
  window._mhTeam=team;
  window._mhPreferStage=!!preferStage;
  const modal=document.getElementById('matchHistoryModal');
  const nameEl=document.getElementById('matchHistoryTeamName');
  const rowsEl=document.getElementById('matchHistoryRows');
  nameEl.innerHTML=team.name.replace(/color:var\(--accent\)/,'color:#fff');
  const src = window._mhPreferStage && team.stageLog && team.stageLog.length
    ? team.stageLog : (team.gameLog||team.stageLog||[]);
  const log=src.filter(g=>!g.isLandingBonus && g.game!=null);
  rowsEl.innerHTML='';
  log.forEach((g,i)=>{
    const row=document.createElement('div');
    row.style.cssText='display:grid;grid-template-columns:40px 1fr 1fr;align-items:center;padding:12px 14px;border-radius:8px;font-weight:800;font-size:18px;color:'+(g.place===1?'#0a0a0a':'#eaf5f3')+';background:'+(g.place===1?'rgba(220,225,220,.92)':(i%2===0?'rgba(255,255,255,.05)':'transparent'))+';';
    row.innerHTML=`<div style="font-size:14px;opacity:.7;">${g.game}</div><div style="text-align:center;">${g.place}</div><div style="text-align:center;">${g.elims}</div>`;
    rowsEl.appendChild(row);
  });
  modal.style.display='flex';
}

function closeMatchHistory(){
  document.getElementById('matchHistoryModal').style.display='none';
}

// ---------- Detailed match stats (tracker-style stat sheet) ----------
// Every simulated game produces a full stat line for each team, derived from
// what actually happened in that game (final placement, eliminations, squad
// size) plus the squad's own skill level. Volume stats accumulate across the
// whole run so the final sheet reads like a real tournament stat page.
function srnd(a,b){ return a+Math.random()*(b-a); }

function blankMatchStats(){
  return {games:0, placementPts:0, elimPts:0,
    elims:0, assists:0, dmgTo:0, dmgFrom:0, healthHealed:0, shieldHealed:0, overshield:0,
    hits:0, shots:0, ovHits:0, headshots:0, wpNum:0, wpDen:0,
    revived:0, gotRevived:0, rebooted:0, gotRebooted:0,
    editOk:0, editTotal:0, editTimeSum:0,
    wood:0, stone:0, metal:0, woodC:0, stoneC:0, metalC:0,
    timeAlive:0, inStorm:0, stormDmg:0, surge:0, dist:0};
}

function accumulateMatchStats(t, place, total, placePts, elimPts){
  if(t && t.isYou && typeof ccDropRec==='function') try{ ccDropRec(t, place, total); }catch(e){}
  if(!t.mstats) t.mstats=blankMatchStats();
  const s=t.mstats;
  const size=(t.squad && t.squad.length) || 1;
  const avgR = t.squad ? t.squad.reduce((a,p)=>a+(p.rating||40),0)/size : 45;
  const sk = clamp((avgR-32)/52, 0.12, 1.25);                       // skill 0…1.25
  const surv = total>1 ? clamp((total-place)/(total-1), 0, 1) : 1;    // how deep they went
  const elims = t._elims||0;

  s.games++;
  // Удача зон: до скольких эндгеймов команда дожила и в скольких зона пришла к ней (_zonePull, zone-sim).
  // Метка снимается: следующая игра, посчитанная без движка, не должна прочитать старую.
  if(t._zonePull!=null){ s.zpG=(s.zpG||0)+1; if(t._zonePull) s.zpN=(s.zpN||0)+1; t._zonePull=null; }
  s.placementPts += placePts;
  s.elimPts += elimPts;
  s.elims += elims;
  // Ассисты щедрые: любой вклад в выбитого считается. Лидер дня у Кинча — 26
  // на игрока за шесть игр, у нас до правки выходило 13.5.
  s.assists += Math.round(elims*srnd(1.6,2.5));

  /* ЧИСЛА ПРИВЯЗАНЫ К НАСТОЯЩИМ, а не подобраны на глаз. Опорная точка — пост
     Kinch Analytics за день 1 Глобалов 2026 (26 сентября): лидеры дня на ИГРОКА
     за шесть игр — урон 4128, урон в минуту 41.28, чистый урон 2063,
     соотношение урона 2.67, ассисты 26, нафармлено 20327, пройдено 34.02 км,
     время в шторме 47:03. Замер нашей модели до правки (проба на 50 дуо и шесть
     игр) давал урон 9108 (×2.2), урон в минуту 157 (×3.8), ассисты 13.5 (×0.52),
     нафармлено 3932 (×0.19), шторм 927 с (×0.33). Время в живых сходилось точно:
     101 минута против ста у Кинча — его и не трогаем.

     Урон теперь сильнее привязан ко времени и слабее к постоянной части: раньше
     команда, вылетевшая рано, всё равно набирала базовый урон, и её урон в
     минуту улетал выше лидера. В жизни лидер по урону и лидер по урону в минуту
     — один и тот же человек, что и видно в посте. */
  /* Разброс сужен нарочно. Урон в минуту — это отношение, и у отношения
     максимум по лобби растёт от ШУМА, а не от силы: широкий разброс давал
     лидера по урону в минуту в полтора раза выше настоящего, хотя лидер по
     урону сходился в ноль. У Кинча лидер по урону и лидер по урону в минуту —
     один и тот же человек; узкий разброс это и воспроизводит. */
  const alive = Math.round(55 + surv*srnd(960,1180));
  /* Время в шторме: у Кинча лидер дня провёл в нём 47:03 при сотне минут
     в живых — то есть почти половину. У нас стояло от пяти до двадцати
     процентов, и за день выходило 927 секунд против его 2 823. */
  const storm = Math.round(alive*srnd(0.22,0.62));
  const mins = alive/60;
  /* Попадания идут от МИНУТ, а не от отдельного броска: файты случаются во
     времени. Иначе урон и время — два независимых случая, и максимум их
     отношения по лобби улетает выше настоящего лидера (см. patch-dpm.js). */
  const hits = Math.round(elims*srnd(4.0,4.5) + mins*size*srnd(0.50,0.60) + srnd(1,2));
  const acc  = clamp(0.072 + sk*0.055 + srnd(-0.012,0.012), 0.045, 0.19);
  const shots = Math.round(hits/acc);
  const dmgTo = Math.round(hits*srnd(33,43));
  // Соотношение урона у лучших доходит до 2.67 (лидер дня у Кинча), поэтому
  // верхняя граница поднята: раньше потолок держал лидера на 1.95.
  const dmgFrom = Math.round(dmgTo/clamp(0.8 + sk*1.3 + srnd(-0.28,0.28), 0.42, 3.2));

  s.hits += hits; s.shots += shots; s.dmgTo += dmgTo; s.dmgFrom += dmgFrom;
  s.ovHits += hits + Math.round(shots*srnd(0.008,0.03));
  const hs = Math.round(hits*clamp(0.13+sk*0.07+srnd(-0.03,0.03), 0.07, 0.28));
  s.headshots += hs;
  const wpAcc = clamp(0.47+sk*0.15+srnd(-0.05,0.05), 0.34, 0.74);
  const wpDen = Math.max(1, Math.round(hs/wpAcc));
  s.wpNum += hs; s.wpDen += wpDen;

  s.healthHealed += Math.round(dmgFrom*srnd(0.35,0.62));
  s.shieldHealed += Math.round(dmgFrom*srnd(0.55,0.92));
  if(Math.random()<0.22) s.overshield += Math.round(srnd(50,300));

  if(size>1){
    s.revived += Math.random() < 0.45+0.2*(1-surv) ? 1 : 0;
    s.gotRevived += Math.random() < 0.45+0.2*(1-surv) ? 1 : 0;
    if(Math.random()<0.16) s.rebooted += 1;
    if(Math.random()<0.16) s.gotRebooted += 1;
  }

  const edits = Math.round(surv*srnd(55,130) + srnd(12,45));
  const editAcc = clamp(0.67+sk*0.17+srnd(-0.03,0.03), 0.52, 0.94);
  const editMs = clamp(720 - sk*340 + srnd(-45,45), 240, 780);
  s.editTotal += edits; s.editOk += Math.round(edits*editAcc); s.editTimeSum += editMs*edits;

  /* Метсы: у Кинча лидер дня нафармил 20 327 за шесть игр, то есть больше трёх
     тысяч за игру на человека — ферма в комп-Фортнайте идёт весь матч. У нас
     до правки выходило 3 932 за день, впятеро меньше. */
  const wood = Math.round(surv*srnd(1980,4580) + srnd(730,2080));
  const stone = Math.round(surv*srnd(285,910) + srnd(105,365));
  const metal = Math.round(surv*srnd(440,1170) + srnd(155,495));
  s.wood += wood; s.stone += stone; s.metal += metal;
  s.woodC += Math.round(wood*srnd(1.7,2.6) + srnd(180,600));
  s.stoneC += Math.round(stone*srnd(6,15) + srnd(200,700));
  s.metalC += Math.round(metal*srnd(6,14) + srnd(200,700));

  s.timeAlive += alive; s.inStorm += storm;
  s.stormDmg += Math.round(storm*srnd(1.4,4.6));
  if(Math.random()<0.22) s.surge += Math.round(srnd(1,4));
  /* Пройдено: у Кинча лидер дня 34.02 км за шесть игр. До правки у нас
     выходило 39.97, теперь совпадает в пределах десятой. */
  s.dist += Math.round(950 + surv*srnd(3600,6700));
}

// Split team totals into per-player lines. Volume stats are divided by a
// rating-weighted share; things every teammate experiences together (time
// alive, distance, rates) stay roughly the same for each player.
function playerShares(team){
  const sq=team.squad||[];
  if(team._shares && team._shares.length===sq.length) return team._shares;
  const raw=sq.map(p=>Math.pow(Math.max((p.rating||40)-20,5), 1.35)*srnd(0.88,1.12));
  const sum=raw.reduce((a,b)=>a+b,0)||1;
  team._shares=raw.map(v=>v/sum);
  return team._shares;
}

/* ДОЛИ ПО РОЛИ (идея игроков 30.09: «у фраггера фрагов больше, а у игл другие статы больше»).
   Одна доля на всё давала сильнейшему по рейтингу больше во всём сразу — и элимов, и фарма, и
   поднятых. Теперь боевое (элимы, урон, попадания, хедшоты) тянет фраггер, командное (ассисты,
   поднятые и ребутнутые, фарм и сбор метсов, лечение) — ИГЛ, общее (полученный урон, шторм) —
   без роли. Множители — те же, что у раскладки элимов (CC_KILL_ROLE_W), зеркально для ИГЛа;
   оценка режима, не замер. */
const CC_SUP_ROLE_W={roleIGL:1.5, roleFRG:0.75};
const CC_STAT_SUP=new Set(['assists','healthHealed','shieldHealed','revived','rebooted','matsFarmed','woodFarmed',
  'stoneFarmed','metalFarmed','matsCollected','woodCollected','stoneCollected','metalCollected']);
const CC_STAT_NEU=new Set(['dmgFrom','gotRevived','gotRebooted','stormDmg','surge','overshield']);
function playerRoleShares(team, table){
  const base=playerShares(team), sq=team.squad||[], roles=[];
  let raw=base.map((b,i)=>{ let r=null; try{ r=(attrsFor(sq[i])||{}).roleKey; }catch(e){}
    roles.push(r); return b*((table && table[r])||1); });
  // Боевые статы — тот же главный по дракам, что у элимов (ccKillRankBoost).
  if(table===CC_KILL_ROLE_W && raw.length>1) raw=ccKillRankBoost(raw, roles);
  const sum=raw.reduce((a,b)=>a+b,0)||1;
  return raw.map(v=>v/sum);
}
function statsForView(team, playerIdx){
  const s=team.mstats;
  if(!s) return null;
  if(playerIdx==null) return {s, w:1, wSup:1, wNeu:1, n:(team.squad||[]).length||1, solo:false};
  const neu=playerShares(team);
  const fight=(typeof CC_KILL_ROLE_W!=='undefined') ? playerRoleShares(team, CC_KILL_ROLE_W) : neu;
  const sup=playerRoleShares(team, CC_SUP_ROLE_W);
  return {s, w:fight[playerIdx]||1, wSup:sup[playerIdx]||1, wNeu:neu[playerIdx]||1, n:(team.squad||[]).length||1, solo:true};
}
function statShareFor(key, v){ return CC_STAT_SUP.has(key) ? v.wSup : CC_STAT_NEU.has(key) ? v.wNeu : v.w; }

function fmtNum(n){ return Math.round(n).toLocaleString(LANG==='ru'?'ru-RU':'en-US'); }
function fmtPct(v){ return (v*100).toFixed(2)+'%'; }
function fmtDur(sec){
  sec=Math.round(sec);
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), ss=sec%60;
  const H=LANG==='ru'?'ч':'h', M=LANG==='ru'?'м':'m', S=LANG==='ru'?'с':'s';
  if(h>0) return h+H+' '+m+M;
  return m+M+' '+ss+S;
}
function fmtKm(m){ return (m/1000).toFixed(1)+'km'; }

// key, label i18n key, value getter, higher-is-better
const STAT_ROWS=[
  ['elims','s_elims',(s,w)=>s.elims*w,'num',true],
  ['assists','s_assists',(s,w)=>s.assists*w,'num',true],
  ['dmgTo','s_dmgTo',(s,w)=>s.dmgTo*w,'num',true],
  ['dmgFrom','s_dmgFrom',(s,w)=>s.dmgFrom*w,'num',false],
  ['dmgRatio','s_dmgRatio',s=>s.dmgFrom?s.dmgTo/s.dmgFrom:0,'ratio',true],
  ['healthHealed','s_healthHealed',(s,w)=>s.healthHealed*w,'num',true],
  ['shieldHealed','s_shieldHealed',(s,w)=>s.shieldHealed*w,'num',true],
  ['overshield','s_overshield',(s,w)=>s.overshield*w,'num',true],
  ['hits','s_hits',(s,w)=>s.hits*w,'num',true],
  ['shots','s_shots',(s,w)=>s.shots*w,'num',true],
  ['headshots','s_headshots',(s,w)=>s.headshots*w,'num',true],
  ['playerAcc','s_playerAcc',s=>s.shots?s.hits/s.shots:0,'pct',true],
  ['overallAcc','s_overallAcc',s=>s.shots?s.ovHits/s.shots:0,'pct',true],
  ['wpAcc','s_wpAcc',s=>s.wpDen?s.wpNum/s.wpDen:0,'pct',true],
  ['revived','s_revived',(s,w)=>s.revived*w,'num',true],
  ['gotRevived','s_gotRevived',(s,w)=>s.gotRevived*w,'num',false],
  ['rebooted','s_rebooted',(s,w)=>s.rebooted*w,'num',true],
  ['gotRebooted','s_gotRebooted',(s,w)=>s.gotRebooted*w,'num',false],
  ['editAcc','s_editAcc',s=>s.editTotal?s.editOk/s.editTotal:0,'pct',true],
  ['editTime','s_editTime',s=>s.editTotal?s.editTimeSum/s.editTotal:0,'ms',false],
  ['matsFarmed','s_matsFarmed',(s,w)=>(s.wood+s.stone+s.metal)*w,'num',true],
  ['woodFarmed','s_woodFarmed',(s,w)=>s.wood*w,'num',true],
  ['stoneFarmed','s_stoneFarmed',(s,w)=>s.stone*w,'num',true],
  ['metalFarmed','s_metalFarmed',(s,w)=>s.metal*w,'num',true],
  ['matsCollected','s_matsCollected',(s,w)=>(s.woodC+s.stoneC+s.metalC)*w,'num',true],
  ['woodCollected','s_woodCollected',(s,w)=>s.woodC*w,'num',true],
  ['stoneCollected','s_stoneCollected',(s,w)=>s.stoneC*w,'num',true],
  ['metalCollected','s_metalCollected',(s,w)=>s.metalC*w,'num',true],
  ['timeAlive','s_timeAlive',s=>s.timeAlive,'dur',true],
  ['timeStorm','s_timeStorm',s=>s.inStorm,'dur',false],
  ['stormDmg','s_stormDmg',(s,w)=>s.stormDmg*w,'num',false],
  ['surge','s_surge',(s,w)=>s.surge*w,'num',false],
  ['distance','s_distance',s=>s.dist,'km',true]
];

function fmtStat(kind, v){
  if(kind==='pct') return fmtPct(v);
  if(kind==='ratio') return v.toFixed(2);
  if(kind==='ms') return Math.round(v)+'ms';
  if(kind==='dur') return fmtDur(v);
  if(kind==='km') return fmtKm(v);
  return fmtNum(v);
}


function clearLandingResultsMap(){
  const section=document.getElementById('landingResultsSection');
  const mapImg=document.getElementById('landingResultsMapImg');
  const layer=document.getElementById('landingResultsMarkersLayer');
  const list=document.getElementById('landingResultsList');
  if(section) section.style.display='none';
  if(mapImg) mapImg.removeAttribute('src');
  if(layer) layer.innerHTML='';
  if(list) list.innerHTML='';
}

function renderLandingResultsMap(teams){
  const section=document.getElementById('landingResultsSection');
  const mapImg=document.getElementById('landingResultsMapImg');
  const pickerImg=document.querySelector('#landingMapWrap img');
  if(mapImg && !mapImg.src) mapImg.src = MAP_ART[ACTIVE_LANDING_SET] || (pickerImg && pickerImg.src) || '';
  const layer=document.getElementById('landingResultsMarkersLayer');
  const list=document.getElementById('landingResultsList');
  if(!layer || !list) return;
  layer.innerHTML='';
  list.innerHTML='';

  const RESULT_TAG={
    won:   {text:L().landingFightWon,   color:'var(--accent)'},
    lost:  {text:L().landingFightLost,  color:'var(--danger)'},
    shared:{text:L().landingShared,     color:'var(--ink-dim)'},
  };

  // One rectangle per zone. If two squads share it, the whole box just turns
  // red and both nicknames are stacked inside it — no splitting into halves.
  const zoneMap=new Map();
  teams.forEach((t,i)=>{
    if(!t.landingZone) return;
    if(!zoneMap.has(t.landingZone)) zoneMap.set(t.landingZone,[]);
    zoneMap.get(t.landingZone).push({t,i});
  });

  zoneMap.forEach((entries,z)=>{
    const contested = entries.length>=2;
    const plot=document.createElement('div');
    plot.className='land-plot'+(contested?' contested':(z.mythic?' zp-myth-box':''));
    if(!contested){
      plot.style.borderColor='#0a0a0a'; plot.style.background='rgba(0,0,0,.4)';
    }
    plot.style.left=z.x+'%'; plot.style.top=z.y+'%';
    plot.style.width=z.w+'%'; plot.style.height=z.h+'%';
    plot.title=entries.map(({t,i})=>t.name.replace(/<[^>]+>/g,'')+' (#'+(i+1)+')').join(contested?' vs ':'');
    // Same column as the picker map: one nickname per line, sized to the box in
    // cqh. Squad mode used to need its own shrink factor here because four
    // handles were written on a single line; per-line names make the squad size
    // just another row count.
    fillZoneNames(plot, entries.map(e=>e.t), z);
    if(z.points!=null) plot.appendChild(zonePowLabel(z));
    layer.appendChild(plot);
  });

  teams.forEach((t,i)=>{
    const row=document.createElement('div');
    row.style.padding='2px 0';
    const nameStyled = (t.isYou||t.isClub) ? '<b style="color:var(--lb-you);">'+t.name+'</b>' : t.name;
    const tagInfo=RESULT_TAG[t.landingResult];
    const resultTag=tagInfo?` <span style="color:${tagInfo.color};font-size:11px;">${tagInfo.text}</span>`:'';
    // Same record the standings show, so the two never disagree.
    const rec=landingRecord(t);
    const scoreTag = rec
      ? ` <span style="color:var(--ink-dimmer);font-size:11px;">⚔ ${rec}</span>`
      : '';
    row.innerHTML=`<b style="color:var(--ink-dim);">${i+1}.</b> ${nameStyled} <span style="color:var(--ink-dimmer);">(${t.pow!=null?Math.round(t.pow):t.displayPower})</span>${resultTag}${scoreTag}`;
    list.appendChild(row);
  });

  if(section) section.style.display='block';
}

// ---------- Card mode: squad card gallery with a stat-sheet back side ----------
let cardFlipped={};

function renderCardGallery(){
  const wrap=document.getElementById('cardGallery');
  const title=document.getElementById('cardGalleryTitle');
  if(!wrap || !title) return;
  if(!drafted.length){ wrap.style.display='none'; title.style.display='none'; return; }
  wrap.style.display='grid'; title.style.display='block';
  const you=window._youTeam;
  wrap.innerHTML='';
  drafted.forEach((p,i)=>{
    const box=document.createElement('div');
    const flipped=!!cardFlipped[i];
    let inner;
    if(flipped){
      inner=playerStatSheetHTML(you, i, p);
    } else {
      inner=futCardHTML(p, {wide:true});
    }
    box.dataset.cardIdx=i;
    box.innerHTML=inner+`<button onclick="toggleCardFlip(${i})" style="width:100%;margin-top:8px;
      background:transparent;border:1px solid var(--line);color:var(--ink-dim);border-radius:8px;
      padding:7px;font-size:11px;font-weight:800;letter-spacing:.03em;cursor:pointer;">
      ${flipped?L().cardFrontBtn:L().cardBackBtn}</button>`;
    if(!flipped) wireCardPeek(box, p);
    wrap.appendChild(box);
  });
}
function toggleCardFlip(i){ cardFlipped[i]=!cardFlipped[i]; renderCardGallery(); }

// A card can be inspected wherever it appears. During the draft there is no
// team and no match stats yet, so the sheet shows what matters for the pick —
// the real Grand Finals and Play-In lines and how the rating was arrived at —
// and says the simulation stats arrive after the tournament. Once a run has
// been played, the same click on a drafted player adds their match stats.
function openCardPeek(pl){
  if(!pl) return;
  // Only attach the played team when this really is one of its players: the
  // reference survives into the next draft, and a stale one would show somebody
  // else's numbers under this name.
  const yt=window._youTeam;
  const team=(yt && (yt.squad||[]).includes(pl)) ? yt : null;
  const idx=team ? team.squad.indexOf(pl) : 0;
  const body=document.getElementById('cardPeekBody');
  if(!body) return;
  // В карьере под листом карточки — её сезон в этой карьере (careerPlayerStatsHTML).
  const inCareer=(typeof CAREER!=='undefined' && CAREER && CAREER.career) && ((typeof CAREER_RUN!=='undefined' && CAREER_RUN) || /career/.test(String(typeof SHOWN_SCREEN!=='undefined' ? SHOWN_SCREEN : '')));
  // Ушёл со сцены — пометка в профиле (ccRetiredOf, «Завершили карьеру» в Истории).
  const gone=(inCareer && pl && typeof ccRetiredOf==='function') ? ccRetiredOf(pl.handle) : null;
  body.innerHTML=(gone ? '<div class="cc-regen-tag cc-retired-tag">'+esc(L().ccRetiredTag ? L().ccRetiredTag(2026+gone.y, gone.age, gone.by||'') : 'Retired '+(2026+gone.y))+'</div>' : '')+
    (pl && pl._regen ? '<div class="cc-regen-tag">'+esc((pl.regenOf ? L().ccRegenOf(pl.regenOf) : L().ccRegenNew)+(ccAgeNow(pl.handle)!=null ? ' · '+ccAgeNow(pl.handle) : ''))+'</div>' : '')+
    playerStatSheetHTML(team, idx, pl && pl._regen ? ccRegenShown(pl) : pl)+cardShareBtnHTML(pl)+(inCareer && typeof careerPlayerStatsHTML==='function' ? careerPlayerStatsHTML(pl.handle, pl.region) : '');
  document.getElementById('cardPeekModal').style.display='flex';
}
function closeCardPeek(){
  const m=document.getElementById('cardPeekModal');
  if(m) m.style.display='none';
}
// Makes the card art inside a container open that player, without swallowing
// the Pick button underneath it.
function wireCardPeek(container, pl){
  const art=container.querySelector('.fut-card');
  if(!art) return;
  art.style.cursor='zoom-in';
  art.title=L().cardPeekHint;
  art.onclick=()=>openCardPeek(pl);
}

// Osirion reports total eliminations for a duo; Fortnite Tracker reports averages
// per match instead. Show whichever the source for this card actually carries.
function isLcqReal(r){ return !!(r && (r.lcq || r.stage==='Lcq')); }
// What the real-data block on a card should call itself. It used to know two
// stages — the Play-In and the Last Chance Qualifier — and printed "Play-In"
// for anything else, which is how the winner of a Reload final ended up labelled
// a Play-In result. A card carries the stage it was rated on, so it is asked.
function realStageLabel(r){
  const st = r && r.stage;
  if(isLcqReal(r)) return {title:L().realTitleLcq, rank:L().realRankLcq};
  if(st === 'G' || st === 'final') return {title:L().realTitleFinal, rank:L().realRankFinal};
  if(st === 'open') return {title:L().realTitleOpens, rank:L().realRankOpens};
  if(typeof st === 'string' && st.indexOf('heat') === 0)
    return {title:L().realTitleHeat.replace('{N}', st.slice(4)),
            rank:L().realRankHeat.replace('{N}', st.slice(4))};
  return {title:L().realTitle, rank:L().realRank};
}
function realExtraRows(r){
  if(r.kills!=null) return `<div class="srow"><span>${L().realKills}</span><b>${fmtNum(r.kills)}</b></div>`;
  let out='';
  if(r.avgElims!=null) out+=`<div class="srow"><span>${L().realAvgElims}</span><b>${r.avgElims.toFixed(2)}</b></div>`;
  if(r.avgPlace!=null) out+=`<div class="srow"><span>${L().realAvgPlace}</span><b>${r.avgPlace.toFixed(2)}</b></div>`;
  return out;
}

// The working behind the rating. Every other number on the card is a result the
// player can look up; this is the one the site computes, and until now it was
// the only one you had to take on faith.
function ratingBreakdownHTML(p, glow){
  const rp=p && p._ratingParts;
  const yrBrk=yearBreakdownHTML(p, glow);
  if(!rp || !rp.parts.length) return yrBrk;
  const L_=L();
  const rows=rp.parts.map(x=>{
    const word=L_['brk_'+x.label+'_nth'];
    const name=(L_['brk_'+x.label] || x.label) + (x.nth ? (word ? ' · '+word+' '+x.nth : ' '+x.nth) : '');
    const of=x.field && x.field>50 ? '<span style="opacity:.55;"> / '+x.field+'</span>' : '';
    return `<div class="srow" style="padding:3px 0;">
      <span style="text-transform:none;letter-spacing:0;">${name} <b style="color:var(--ink);font-weight:700;">${ccTop(x.rank)}</b>${of}</span>
      <b style="font-variant-numeric:tabular-nums;">${x.score} × ${x.weight} = ${(x.score*x.weight).toFixed(1)}</b>
    </div>`;
  }).join('');
  const shown=attrsFor(p).ovr;
  const norm = Math.round(rp.blended)!==shown
    ? `<div class="srow" style="padding:3px 0;border:0;">
         <span style="text-transform:none;letter-spacing:0;opacity:.75;">${L_.brkNormalised}</span>
         <b style="font-variant-numeric:tabular-nums;">${shown}</b></div>` : '';
  return `<div class="fut-foot" style="font-size:9px;margin:12px 0 6px;color:${glow};">${L_.brkTitle}</div>
    ${rows}
    <div class="srow" style="padding:5px 0 3px;border-top:1px solid var(--line);margin-top:3px;">
      <span style="text-transform:none;letter-spacing:0;">${L_.brkBlend}</span>
      <b style="font-variant-numeric:tabular-nums;">${rp.sum.toFixed(1)} / ${rp.w.toFixed(2)} = ${rp.blended.toFixed(1)}</b>
    </div>${norm}
    <div class="region-note" style="margin-top:6px;font-size:9px;">${L_.brkNote}</div>`+yrBrk;
}
/* Рейтинг года как в ФИФЕ — строками, из чего он сложен (yearRatingPass кладёт _fifa на карточку). */
function yearBreakdownHTML(p, glow){
  const f=p && p._yr;
  if(!f) return '';
  const L_=L(), C=(typeof YEAR_RATING!=='undefined' && YEAR_RATING && YEAR_RATING.cfg) || {};
  const row=(name, val)=>`<div class="srow" style="padding:3px 0;"><span style="text-transform:none;letter-spacing:0;">${name}</span><b style="font-variant-numeric:tabular-nums;">${val}</b></div>`;
  const rows=[row(L_.brkYearSeason, f.season.toFixed(1)), row(L_.brkYearPrev, f.prev!=null ? f.prev.toFixed(1) : '-'),
              row(L_.brkYearExp, f.exp ? '+'+(f.exp*(C.expPts||1.5)).toFixed(1) : '0')];
  if(f.stat!=null) rows.push(row(L_.brkYearStat, f.stat.toFixed(1)));
  if(f.floor!=null) rows.push(row(L_.brkYearFloor, f.floor.toFixed(1)));
  rows.push(row(L_.brkYearScale, f.blended.toFixed(1)+' → '+(p.form ? p.form.base : p.rating)));
  if(p.form){ const w=String(p.form.why||''); const why=L_['formWhy'+w.charAt(0).toUpperCase()+w.slice(1)] || '';
    rows.push(row(L_.brkFormBoost+(why ? ' · '+why : ''), '+'+p.form.boost+' = '+p.rating)); }
  return `<div class="fut-foot" style="font-size:9px;margin:12px 0 6px;color:${glow};">${L_.brkYearTitle}</div>${rows.join('')}
    <div class="region-note" style="margin-top:6px;font-size:9px;">${L_.brkYearNote}</div>`;
}

function playerStatSheetHTML(team, idx, p){
  const skinR=CARD_SKIN[shownRarity(p)]||CARD_SKIN.common;
  const aR=attrsFor(p);
  const head=`<div style="display:flex;align-items:center;gap:9px;margin-bottom:3px;">
      <div class="fut-ovr" style="font-size:26px;color:${skinR.glow};">${aR.ovr}</div>
      <div class="fut-name" style="font-size:15px;">${cardFlag(p,15)}${p.handle}</div>
    </div>`;
  const gfRows = p.realGf ? `
    <div class="fut-foot" style="font-size:9px;margin:10px 0 6px;color:${skinR.glow};">${L().realTitleGf}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:0 16px;">
      <div class="srow"><span>${L().realRankGf}</span><b>#${p.realGf.rank}</b></div>
      <div class="srow"><span>${L().realPts}</span><b>${fmtNum(p.realGf.pts)}</b></div>
      <div class="srow"><span>${L().realMatches}</span><b>${p.realGf.matches}</b></div>
      <div class="srow"><span>${L().realWins}</span><b>${p.realGf.wins}</b></div>
      ${realExtraRows(p.realGf)}
    </div>` : (p.missedGf ? `
    <div class="fut-foot" style="font-size:9px;margin:10px 0 2px;color:var(--danger);">${L().missedGfNote}</div>` : '');
  const realLbl = p.real ? realStageLabel(p.real) : null;
  const realRows = p.real ? `
    <div class="fut-foot" style="font-size:9px;margin:10px 0 6px;color:${skinR.glow};">${realLbl.title}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:0 16px;">
      <div class="srow"><span>${realLbl.rank}</span><b>#${p.real.rank}</b></div>
      <div class="srow"><span>${L().realPts}</span><b>${fmtNum(p.real.pts)}</b></div>
      <div class="srow"><span>${L().realMatches}</span><b>${p.real.matches}</b></div>
      <div class="srow"><span>${L().realWins}</span><b>${p.real.wins}</b></div>
      ${realExtraRows(p.real)}
    </div>` : '';
  if(!team || !team.mstats){
    return `<div class="fut-back" style="padding:15px 16px;">${head}${gfRows}${realRows}
      ${ratingBreakdownHTML(p, skinR.glow)}
      <div class="fut-foot" style="font-size:9px;margin-top:12px;">${L().cardNoStats}</div></div>`;
  }
  const v=statsForView(team, idx);
  const rows=STAT_ROWS.map(([key,lab,get,kind])=>`
    <div class="srow"><span>${L()[lab]}</span><b>${fmtStat(kind,get(v.s,statShareFor(key, v)))}</b></div>`).join('');
  return `<div class="fut-back" style="padding:15px 16px;">
    ${head}
    ${gfRows}
    ${realRows}
    ${ratingBreakdownHTML(p, skinR.glow)}
    <div class="fut-foot" style="font-size:9px;margin:12px 0 6px;">${L().simTitle} · ${L().statLastUpdate}: ${v.s.games}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:0 16px;">${rows}</div>
  </div>`;
}

function renderStats(){
  const body=document.getElementById('statBody');
  if(!body) return;   // the source table was removed; the cards carry it all
  body.innerHTML='';
  drafted.forEach(p=>{
    const flag = cardFlag(p, 15);
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${flag}${p.handle}</td><td>${regionName(p.region)}</td><td>${translateEventText(p.event)} (${translateDate(p.date)})</td><td class="num">${p.placement!=null?'#'+p.placement:'-'}</td><td class="rate">${p.rating}</td>`;
    body.appendChild(tr);
  });
  animateRows(document.getElementById('statBody').closest('.lobby-wrap') || document.getElementById('statBody').parentElement.parentElement);
  cardFlipped={};
  renderCardGallery();
}

// ---------- Progress: draft grade, run history, achievements ----------
const LS_HISTORY='fncsdraft_history', LS_ACHV='fncsdraft_achievements';

function loadHistory(){
  try{ return JSON.parse(localStorage.getItem(LS_HISTORY)||'[]'); }catch(e){ return []; }
}
function saveHistoryEntry(entry){
  const h=loadHistory();
  h.unshift(entry);
  if(h.length>100) h.length=100;
  try{ localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }catch(e){}
}
function loadAchievements(){
  try{ return new Set(JSON.parse(localStorage.getItem(LS_ACHV)||'[]')); }catch(e){ return new Set(); }
}
function saveAchievements(set){
  try{ localStorage.setItem(LS_ACHV, JSON.stringify([...set])); }catch(e){}
}

function computeDraftGrade(avgRating, synergyBonus){
  const score = avgRating + Math.min(synergyBonus,40)*0.5;
  if(score>=95) return 'S';
  if(score>=82) return 'A';
  if(score>=68) return 'B';
  if(score>=50) return 'C';
  return 'D';
}

// The ceiling of the region actually being played. Squad-strength goals are
// written as offsets from this so they mean the same thing everywhere: Europe
// tops out at 96 and Oceania at 85, and neither player should be locked out.
function regionCeiling(ctx){
  const reg=(ctx && ctx.region) || ((ctx && ctx.squad && ctx.squad[0]) || {}).region;
  return (reg && REGION_TOP[reg]!==undefined) ? REGION_TOP[reg] : 85;
}
// Did this person play the Summit LAN? Their Summit card is its own row in the
// pool, so the roster answers it without reaching into the rating ledger.
function playedSummit(handle){
  const h=String(handle||'').toLowerCase();
  return PLAYERS_BASE.some(x=>x.handle.toLowerCase()===h && /Summit/.test(x.event||''));
}
// Won the run, whichever mode it was.
function wonRun(ctx){ return ctx.isMajor ? !!ctx.championMajor : ctx.place===1; }

const ACHIEVEMENTS=[
  {id:'first_run', icon:'🎮', check:ctx=>true},

  // ----- FNCS Major 1 card mode -----
  {id:'lan_ticket', icon:'🎟️', check:ctx=>!!(ctx.summit && ctx.summit.reachedLan)},
  {id:'summit_champion', icon:'🥇', check:ctx=>!!(ctx.summit && ctx.summit.champion)},
  {id:'gc_slot', icon:'🌐', check:ctx=>!!(ctx.summit && ctx.summit.gcSlot)},
  {id:'second_chance', icon:'🔂', check:ctx=>!!(ctx.summit && ctx.summit.viaScq && ctx.summit.reachedLan)},
  {id:'upper_bracket', icon:'🪜', check:ctx=>!!(ctx.summit && ctx.summit.day1Direct)},
  // NAW, Brazil, Asia, Middle East and Oceania get 5 or fewer LAN slots
  {id:'small_region', icon:'🗺️', check:ctx=>{
    if(!(ctx.summit && ctx.summit.reachedLan) || !ctx.region) return false;
    return (SUMMIT_SLOTS[ctx.region]||0)<=5;
  }},
  // Every "draft a strong squad" goal used to test an absolute number, which
  // only Europe and NA Central can reach: the other five regions cap at 85, so a
  // player who picked Oceania could not earn these however well they drafted,
  // and nothing on screen said why. They are measured against the ceiling of the
  // region being played instead, so each one means "the elite of your region".
  {id:'legendary_duo', icon:'🃏', check:ctx=>ctx.cardMode && ctx.squad.length>=2 &&
    ctx.squad.every(p=>attrsFor(p).ovr >= regionCeiling(ctx)-8)},
  // Distinct from elite_avg below: that one is about the squad as a whole, this
  // one is about landing the single best card the region has.
  {id:'ovr_ninety', icon:'💯', check:ctx=>{
    if(!ctx.cardMode || !ctx.squad.length) return false;
    return ctx.squad.some(p=>attrsFor(p).ovr >= regionCeiling(ctx));
  }},

  {id:'victory_royale', icon:'👑', check:ctx=>!ctx.isMajor && ctx.place===1},
  {id:'chemistry', icon:'🧪', check:ctx=>ctx.synergyBonus>=5},
  {id:'perfect_squad', icon:'🤝', check:ctx=>{
    if(ctx.squad.length<2) return false;
    for(let i=0;i<ctx.squad.length;i++) for(let j=i+1;j<ctx.squad.length;j++){
      const a=ctx.squad[i].handle, b=ctx.squad[j].handle;
      if(!ccWereTeammates(a, b)) return false;
    }
    return true;
  }},
  {id:'squad_slayer', icon:'🌍', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    if(!won) return false;
    const nats=ctx.squad.map(p=>p.nat).filter(Boolean);
    return nats.length===ctx.squad.length && new Set(nats).size===1;
  }},
  {id:'major_champion', icon:'🏆', check:ctx=>ctx.isMajor && ctx.championMajor},
  {id:'comeback', icon:'🔁', check:ctx=>ctx.isMajor && ctx.cameFromLcq && ctx.reachedFinals},
  {id:'cosmopolitan', icon:'🧳', check:ctx=>new Set(ctx.squad.map(p=>p.nat).filter(Boolean)).size>=3},
  {id:'no_reroll', icon:'🎯', check:ctx=>ctx.rerollsUsed===0},
  {id:'s_tier', icon:'⭐', check:ctx=>ctx.grade==='S'},
  {id:'s1ned_win', icon:'🇺🇦', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    return won && ctx.squad.some(p=>p.handle.toLowerCase()==='s1ned');
  }},
  {id:'ten_runs', icon:'🎖️', check:ctx=>loadHistory().length>=10},
  {id:'podium', icon:'🥉', check:ctx=>!ctx.isMajor && ctx.place<=3},
  {id:'runner_up', icon:'🥈', check:ctx=>!ctx.isMajor && ctx.place===2},
  {id:'top10', icon:'🔟', check:ctx=>!ctx.isMajor && ctx.place<=10},
  {id:'dead_last', icon:'💀', check:ctx=>!ctx.isMajor && ctx.totalTeams>1 && ctx.place===ctx.totalTeams},
  // Tracks the mythic band rather than a hard-coded 100, so it moves with
  // rarityForRating instead of quietly becoming impossible when the tier does.
  {id:'full_mythic', icon:'💛', check:ctx=>ctx.squad.length>0 && ctx.squad.every(p=>shownRarity(p)==='mythic')},
  {id:'elite_avg', icon:'🌟', check:ctx=>ctx.squad.length>0 && ctx.avgRating >= regionCeiling(ctx)-4},
  {id:'all_rerolls', icon:'🔄', check:ctx=>ctx.rerollsUsed>=2},
  {id:'nail_biter', icon:'🔥', check:ctx=>{
    if(ctx.place!==1 || !ctx.allTeams || ctx.allTeams.length<2) return false;
    const sorted=ctx.allTeams.slice().sort((a,b)=>(b.totalPts||b.stagePts||0)-(a.totalPts||a.stagePts||0) || (b.totalElims||b.stageElims||0)-(a.totalElims||a.stageElims||0));
    const topPts=sorted[0].totalPts!=null?sorted[0].totalPts:(sorted[0].stagePts||0);
    const secondPts=sorted[1].totalPts!=null?sorted[1].totalPts:(sorted[1].stagePts||0);
    return (topPts-secondPts)<15;
  }},
  {id:'one_flag', icon:'🏳️', check:ctx=>{
    const nats=ctx.squad.map(p=>p.nat).filter(Boolean);
    return nats.length===ctx.squad.length && new Set(nats).size===1;
  }},
  {id:'duo_champion', icon:'2️⃣', check:ctx=>!ctx.isMajor && ctx.mode===2 && ctx.place===1},
  {id:'trio_champion', icon:'3️⃣', check:ctx=>!ctx.isMajor && ctx.mode===3 && ctx.place===1},
  {id:'squad_champion', icon:'4️⃣', check:ctx=>!ctx.isMajor && ctx.mode===4 && ctx.place===1},
  {id:'twenty_runs', icon:'📿', check:ctx=>loadHistory().length>=20},
  {id:'fifty_runs', icon:'🎗️', check:ctx=>loadHistory().length>=50},
  {id:'major_finalist', icon:'🏟️', check:ctx=>ctx.isMajor && ctx.reachedFinals},
  {id:'lcq_champion', icon:'⚔️', check:ctx=>ctx.isMajor && ctx.cameFromLcq && ctx.championMajor},
  // The duo ceiling: real teammates who also share a passport. Trio and squad
  // clear it easily; in the Majors it is the most a pair can possibly have.
  {id:'high_synergy', icon:'⚡', check:ctx=>ctx.synergyBonus>=7},
  {id:'perfectionist', icon:'✨', check:ctx=>ctx.place===1 && ctx.grade==='S'},

  {id:'iron_man', icon:'🦾', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log.every(g=>g.elims>=1);
  }},
  {id:'highlight_reel', icon:'🎬', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.some(g=>g.elims>=15);
  }},
  {id:'sharpshooter', icon:'💥', check:ctx=>{
    if(!ctx.you) return false;
    const elims=ctx.you.totalElims!=null?ctx.you.totalElims:(ctx.you.stageElims||0);
    return elims>=100;
  }},
  {id:'flawless', icon:'🛡️', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log.every(g=>g.place<=10);
  }},
  {id:'comeback_kid', icon:'📈', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you || !ctx.totalTeams) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log[0].place > ctx.totalTeams/2;
  }},
  {id:'hundred_runs', icon:'🏅', check:ctx=>loadHistory().length>=100},
  {id:'grand_slam', icon:'🎰', check:ctx=>{
    const wins=loadHistory().filter(h=>!h.isMajor && h.place===1);
    const modes=new Set(wins.map(h=>h.mode));
    return modes.has(2) && modes.has(3) && modes.has(4);
  }},
  {id:'double_major', icon:'🏵️', check:ctx=>loadHistory().filter(h=>h.isMajor && h.championMajor).length>=2},
  {id:'ten_wins', icon:'🏵', check:ctx=>loadHistory().filter(h=>!h.isMajor && h.place===1).length>=10},
  // The genuinely hard one: three Victory Royales in a row within the same
  // tournament. Sweeping all 12 games (the old version of this) never
  // happens in a real bracket — a 3-peat hot streak does, and pros
  // occasionally pull it off, so it stays a real target instead of a
  // mathematical impossibility.
  {id:'three_peat', icon:'🌪️', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    let streak=0;
    for(const g of log){
      streak = g.place===1 ? streak+1 : 0;
      if(streak>=3) return true;
    }
    return false;
  }},

  {id:'hot_drop_king', icon:'🪂', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    return (ctx.you.landingWins||0)>0 && (ctx.you.landingLosses||0)===0;
  }},
  {id:'ghost_town', icon:'🏝️', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    return (ctx.you.landingWins||0)===0 && (ctx.you.landingLosses||0)===0;
  }},
  // Hard-but-achievable #1: your landing zone is fixed for the whole
  // tournament, so racking up 10+ scrap wins means you picked (or got
  // stuck in) a hot zone and kept winning it almost every single game.
  // Rare, but nothing here is left to pure chance beyond the power-weighted
  // coin flip each game — a strong enough squad can do this for real.
  {id:'landing_legend', icon:'🗡️', check:ctx=>ctx.you && (ctx.you.landingWins||0)>=10},
  {id:'housefire_hero', icon:'🧨', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1 || !ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    return log.length>0 && log[0].landingOutcome==='lost';
  }},
  // Hard-but-achievable #2: losing a landing scrap means 0 points for that
  // whole game (dead before the battle even starts). Eating 5+ of those and
  // still finishing 1st overall means the games you did play, you played
  // extremely well — a real comeback story, not a guaranteed outcome.
  {id:'iron_will', icon:'🩹', check:ctx=>!ctx.isMajor && ctx.place===1 && ctx.you && (ctx.you.landingLosses||0)>=5},
  {id:'hot_streak_drop', icon:'🌋', check:ctx=>{
    if(!ctx.you) return false;
    const log=(ctx.you.gameLog||ctx.you.stageLog||[]).filter(g=>!g.isLandingBonus);
    let streak=0;
    for(const g of log){
      streak = g.landingOutcome==='won' ? streak+1 : (g.landingOutcome==='lost' ? 0 : streak);
      if(streak>=5) return true;
    }
    return false;
  }},
  {id:'multi_kill_drop', icon:'🎲', check:ctx=>ctx.you && (ctx.you.multiKillLandingWins||0)>=3},
  {id:'kill_grinder', icon:'💪', check:ctx=>loadHistory().reduce((s,h)=>s+(h.elims||0),0)>=500},
  {id:'raw_talent', icon:'🧠', check:ctx=>ctx.place===1 && ctx.synergyBonus===0},
  {id:'region_specialist', icon:'🧿', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    if(!won) return false;
    const regions=ctx.squad.map(p=>p.region).filter(Boolean);
    return regions.length===ctx.squad.length && new Set(regions).size===1;
  }},
  // Meme achievement: Th0masHD is famous in-universe for the curse of
  // always finishing 2nd at FNCS and never actually winning one. Drafting
  // him and then finishing exactly 2nd yourself is the joke playing out.
  {id:'thomas_curse', icon:'🫠', check:ctx=>ctx.place===2 && ctx.squad.some(p=>p.handle==='Th0masHD')},
  // One from me: play on 7 different real calendar days — pure dedication,
  // nothing to do with squad strength or luck.
  {id:'no_days_off', icon:'📅', check:ctx=>{
    const days=new Set(loadHistory().map(h=>h.date && h.date.slice(0,10)).filter(Boolean));
    return days.size>=7;
  }},

  {id:'photo_finish', icon:'📸', check:ctx=>{
    if(ctx.place!==1 || !ctx.allTeams || ctx.allTeams.length<2) return false;
    const sorted=ctx.allTeams.slice().sort((a,b)=>(b.totalPts||b.stagePts||0)-(a.totalPts||a.stagePts||0));
    const top=sorted[0].totalPts!=null?sorted[0].totalPts:(sorted[0].stagePts||0);
    const second=sorted[1].totalPts!=null?sorted[1].totalPts:(sorted[1].stagePts||0);
    return (top-second)===1;
  }},
  {id:'high_roller', icon:'💰', check:ctx=>ctx.place===1 && ctx.you && (ctx.you.multiKillLandingWins||0)>=1},
  {id:'global_squad', icon:'🌏', check:ctx=>{
    if(ctx.place!==1 || ctx.squad.length<3) return false;
    const nats=ctx.squad.map(p=>p.nat).filter(Boolean);
    return nats.length===ctx.squad.length && new Set(nats).size===nats.length;
  }},
  {id:'tactician', icon:'♟️', check:ctx=>{
    if(ctx.place!==1 || !ctx.you) return false;
    const pts=ctx.you.totalPts!=null?ctx.you.totalPts:(ctx.you.stagePts||0);
    const elims=ctx.you.totalElims!=null?ctx.you.totalElims:(ctx.you.stageElims||0);
    if(pts<=0) return false;
    return (elims*4)/pts < 0.3;
  }},
  {id:'prime_real_estate', icon:'🏔️', check:ctx=>{
    if(ctx.place!==1 || !ctx.you || !ctx.you.landingZone) return false;
    const maxPts=Math.max(...ALL_LANDING_ZONES.map(z=>z.points));
    return ctx.you.landingZone.points===maxPts;
  }},
  {id:'nothing_to_lose', icon:'🏚️', check:ctx=>{
    if(ctx.place!==1 || !ctx.you || !ctx.you.landingZone) return false;
    const minPts=Math.min(...ALL_LANDING_ZONES.map(z=>z.points));
    return ctx.you.landingZone.points===minPts;
  }},
  {id:'marathon_man', icon:'🏃', check:ctx=>{
    const h=loadHistory();
    if(h.length<3) return false;
    return h.slice(0,3).every(e=>e.totalTeams && e.place<=20);
  }},
  {id:'babel_squad', icon:'🗣️', check:ctx=>{
    if(ctx.place!==1) return false;
    const langs=ctx.squad.map(p=>languageClusterOf(p.nat)).filter(Boolean);
    return langs.length===ctx.squad.length && new Set(langs).size>=3;
  }},
  {id:'double_agent', icon:'🎭', check:ctx=>{
    if(ctx.place!==1 || ctx.mode!==4) return false;
    const counts={};
    ctx.squad.forEach(p=>{ if(p.nat) counts[p.nat]=(counts[p.nat]||0)+1; });
    const groups=Object.values(counts);
    return groups.length===2 && groups.every(c=>c===2);
  }},
  {id:'signature_squad', icon:'✍️', check:ctx=>{
    if(ctx.isMajor || ctx.place!==1) return false;
    const key=ctx.squad.map(p=>p.handle).join(' & ');
    return loadHistory().filter(h=>!h.isMajor && h.place===1 && h.squad===key).length>=3;
  }},
  // GOAT nod: Bugha is FNCS lore's original World Cup champion — draft him,
  // win, and it's a nice little homage instead of a curse this time.
  {id:'goat_draft', icon:'🐐', check:ctx=>{
    const won = ctx.isMajor ? ctx.championMajor : ctx.place===1;
    return won && ctx.squad.some(p=>p.handle==='Bugha');
  }},
  {id:'day_grinder', icon:'📆', check:ctx=>{
    const wins=loadHistory().filter(h=>!h.isMajor && h.place===1 && h.date);
    const counts={};
    wins.forEach(h=>{ const day=h.date.slice(0,10); counts[day]=(counts[day]||0)+1; });
    return Object.values(counts).some(c=>c>=3);
  }},

  // ----- Built on what the cards now measure -----
  // The attributes stopped being invented, so these read them: a squad that wins
  // by out-surviving the lobby and one that wins by out-shooting it are two
  // different squads, and now the card can prove which is which.
  {id:'lan_veterans', icon:'🎪', check:ctx=>wonRun(ctx) && ctx.squad.length>0 &&
    ctx.squad.every(p=>playedSummit(p.handle))},
  // A squad of one clear fragger and one clear caller. "Endgame above Aim" on
  // its own was true of 44% of the pool and "Aim above Endgame" of 27%, so
  // either half was closer to a coin flip than an achievement; requiring both
  // shapes at once, each a clear ten points apart, is a deliberate draft.
  {id:'sharp_contrast', icon:'⚖️', check:ctx=>{
    if(!wonRun(ctx) || ctx.squad.length<2) return false;
    const d=ctx.squad.map(p=>{ const a=attrsFor(p); return a.aim-a.end; });
    return d.some(x=>x>=10) && d.some(x=>x<=-10);
  }},
  // Six attributes at 85 with no weak one is 1.2% of the pool — a player who was
  // good at every part of the season rather than carried by a single column.
  {id:'complete_player', icon:'🧩', check:ctx=>ctx.cardMode && ctx.squad.some(p=>{
    const a=attrsFor(p); return ATTR_KEYS.every(k=>a[k]>=85);
  })},
  // Reaching a Grand Final was true of 100 cards in Europe alone, which is most
  // of the mode's pool. Standing on its podium is 1.7%.
  {id:'podium_squad', icon:'🛐', check:ctx=>{
    if(!ctx.cardMode || ctx.squad.length<2) return false;
    const KEYS=['_m1Gf','_n1Gf','_w1Gf','_b1Gf','_a1Gf','_e1Gf','_o1Gf',
                '_m2Gf','_n2Gf','_w2Gf','_b2Gf','_a2Gf','_e2Gf','_o2Gf'];
    return ctx.squad.every(p=>KEYS.some(k=>p[k] && p[k].rank<=3));
  }},
];

function checkAndUnlockAchievements(ctx){
  const unlocked=loadAchievements();
  const newlyUnlocked=[];
  ACHIEVEMENTS.forEach(a=>{
    if(!unlocked.has(a.id) && a.check(ctx)){
      unlocked.add(a.id);
      newlyUnlocked.push(a);
    }
  });
  if(newlyUnlocked.length>0){ saveAchievements(unlocked); renderAchievementBadge(); }
  return newlyUnlocked;
}

function showUnlockToasts(newly){
  const box=document.getElementById('unlockToasts');
  if(!box) return;
  box.innerHTML='';
  newly.forEach(a=>{
    const div=document.createElement('div');
    div.className='toast-unlock';
    div.textContent=L().unlockedToast(a.icon+' '+String(L()['achv_'+a.id+'_title']||'').replace(/<[^>]*>/g, '').trim());
    box.appendChild(div);
  });
}

function renderAchievementBadge(){
  const el=document.getElementById('achievementBadge');
  if(!el) return;
  const n=loadAchievements().size;
  el.textContent = n>0 ? (n+'/'+ACHIEVEMENTS.length) : '';
}

let __shareCtx=null;
// Set the moment a run is written to the history, which is the only thing the
// leave-confirmation actually claims. __shareCtx is not a stand-in for it: a
// player knocked out of a Major reaches finalizeRunStats (so the run IS saved)
// without ever getting a share button.
let __runRecorded=false;
function showShareButton(you, place, totalTeams, isMajor, allTeams){
  const earned = lobbyPrizeTable ? prizeFor(lobbyPrizeTable, place) : 0;
  __shareCtx={you, place, totalTeams, isMajor, allTeams, earned};
  const btn=document.getElementById('shareResultBtn');
  if(btn) btn.style.display='inline-block';
}

// Portraits for the share card. Canvas cannot draw an <img> that has not
// loaded yet, so they are fetched up front; a missing file resolves to null and
// the card falls back to the same monogram the in-page portrait uses.
function loadShareImage(url){
  return new Promise(res=>{
    if(!url) return res(null);
    const img=new Image();
    img.onload=()=>res(img);
    img.onerror=()=>res(null);
    img.src=url;
  });
}
function drawSharePortrait(ctx, pl, img, x, y, w, h){
  const fam="-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
  ctx.save();
  roundRect(ctx, x, y, w, h, 12); ctx.clip();
  const rnd=seededRng(hashStr(pl.handle+'|portrait'));
  const hue=Math.floor(rnd()*360);
  const g=ctx.createLinearGradient(x, y, x, y+h);
  g.addColorStop(0, 'hsl('+hue+' 45% 34%)'); g.addColorStop(1, 'rgba(0,0,0,.75)');
  ctx.fillStyle=g; ctx.fillRect(x, y, w, h);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 '+Math.round(h*0.4)+'px '+fam;
  ctx.fillStyle='rgba(255,255,255,.92)';
  ctx.fillText(initialsFor(pl.handle), x+w/2, y+h/2);
  ctx.textBaseline='alphabetic';
  if(img && img.width && img.height){
    // cover-fit anchored to the top, matching the CSS object-position
    const scale=Math.max(w/img.width, h/img.height);
    const dw=img.width*scale, dh=img.height*scale;
    ctx.drawImage(img, x+(w-dw)/2, y, dw, dh);
  }
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=2;
  roundRect(ctx, x, y, w, h, 12); ctx.stroke();
}

// The share card is built to read like the winners plate the run itself puts up:
// a white headline band carrying the squad's faces, the team name, and a teal
// stat strip, with the leaderboard underneath. The previous version was a
// centred column of text with nobody's face on it, and its height was a fixed
// guess that left roughly a third of the image empty.
// The share card is drawn the way the FNCS broadcast draws its standings:
// a light, faceted background, a heavy italic headline over a teal stage chip,
// and a table of light rows led by a solid black rank square. The dark, rounded,
// gradient-panel version it replaces looked like a UI screenshot; this looks
// like the graphic the results actually go out on.
async function shareResultImage(){
  if(!__shareCtx) return;
  const {you, place, totalTeams, isMajor, allTeams, earned}=__shareCtx;

  // Mini-leaderboard: up to 5 places above and 5 below your own rank.
  let lbRows=[];
  if(allTeams && allTeams.length){
    const youIdx=allTeams.indexOf(you);
    if(youIdx>=0){
      const startIdx=Math.max(0, youIdx-5);
      const endIdx=Math.min(allTeams.length-1, youIdx+5);
      for(let i=startIdx;i<=endIdx;i++) lbRows.push({team:allTeams[i], rank:i+1});
    }
  }

  const squad=(you.squad||[]).slice(0,4);
  const imgs=await Promise.all(squad.map(pl=>loadShareImage(photoURL(pl))));

  const fam="-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
  const INK='#10161c', TEAL='#00b090', MUTED='#5b6772';
  const W=1080;
  const HERO=284, LABELS=46, VALUES=96;
  const prizeH = earned>0 ? 126 : 0;
  const squadH = 44+squad.length*58+16;
  const rowH=54, tblHead=40;
  const tblH = lbRows.length ? (46+tblHead+lbRows.length*rowH+26) : 0;
  const FOOT=70;
  const H = HERO+LABELS+VALUES+prizeH+30+squadH+tblH+FOOT;

  const canvas=document.createElement('canvas');
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');

  // ---- faceted light background ---------------------------------------
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#ffffff'); bg.addColorStop(0.45,'#f1f4f6'); bg.addColorStop(1,'#e2e7ea');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // Broad diagonal panels, the same shallow angle the broadcast wall uses.
  const facet=(pts, fill)=>{
    ctx.beginPath();
    pts.forEach((pt,i)=>{ i?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]); });
    ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
  };
  facet([[0,H*0.30],[W*0.42,H*0.16],[W*0.42,H*0.24],[0,H*0.38]], 'rgba(16,22,28,.035)');
  facet([[W*0.58,H*0.05],[W,H*0.00],[W,H*0.09],[W*0.58,H*0.14]], 'rgba(16,22,28,.03)');
  facet([[0,H*0.72],[W*0.30,H*0.62],[W*0.30,H*0.70],[0,H*0.80]], 'rgba(16,22,28,.03)');
  // Teal facets in the lower-left corner.
  facet([[0,H],[0,H*0.80],[W*0.20,H*0.86],[W*0.16,H]], 'rgba(0,176,144,.20)');
  facet([[W*0.16,H],[W*0.20,H*0.86],[W*0.34,H*0.91],[W*0.30,H]], 'rgba(0,176,144,.13)');
  facet([[0,H],[W*0.10,H],[0,H*0.93]], 'rgba(0,140,116,.28)');

  // ---- hero ------------------------------------------------------------
  ctx.fillStyle=TEAL;
  ctx.beginPath();
  ctx.moveTo(W*0.60, HERO-8); ctx.lineTo(W*0.685, 0); ctx.lineTo(W, 0); ctx.lineTo(W, HERO-8);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(10,16,20,.62)';
  ctx.fillRect(W*0.70, 0, W*0.30, HERO-8);

  const headline = place===1 ? L().winnersWord : ('#'+place);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  let hf=118;
  ctx.font='italic 900 '+hf+'px '+fam;
  while(ctx.measureText(headline).width > W*0.56-56 && hf>36){ hf-=4; ctx.font='italic 900 '+hf+'px '+fam; }
  ctx.fillStyle=INK;
  ctx.fillText(headline, 52, 128);

  // stage chip, the teal slab under the headline
  const f=winnersFigures(you);
  const modeLabel = isMajor
    ? (CARD_MODE ? (CARD_SET==='m1'?'FNCS MAJOR 1':'FNCS MAJOR 2') : 'FNCS MAJOR')
    : (squad.length===2?'DUO':squad.length===3?'TRIO':'SQUAD');
  const chipText=modeLabel+'  ·  '+totalTeams+(f.games?('  ·  '+L().wGames(f.games)):'');
  ctx.font='italic 900 24px '+fam;
  const chipW=ctx.measureText(chipText).width+40;
  ctx.fillStyle=TEAL; ctx.fillRect(52, 150, chipW, 46);
  ctx.fillStyle='#fff'; ctx.fillText(chipText, 72, 181);

  // team name, black bar in broadcast style
  ctx.font='900 30px '+fam;
  let teamLine=squad.map(pl=>pl.handle).join(' + ').toUpperCase(), tf=30;
  while(ctx.measureText(teamLine).width > W*0.60-40 && tf>16){ tf-=2; ctx.font='900 '+tf+'px '+fam; }
  const nameW=ctx.measureText(teamLine).width+40;
  ctx.fillStyle=INK; ctx.fillRect(52, 208, nameW, 52);
  ctx.fillStyle='#fff'; ctx.fillText(teamLine, 72, 242);

  // portraits
  const pw = squad.length>2 ? 104 : 132, ph = squad.length>2 ? 134 : 172, gap=14;
  const totalPW=squad.length*pw+(squad.length-1)*gap;
  let px=W-40-totalPW;
  const pyTop = squad.length>2 ? 36 : 24;
  squad.forEach((pl,i)=>{
    drawSharePortrait(ctx, pl, imgs[i], px, pyTop, pw, ph);
    ctx.textAlign='center'; ctx.font='900 16px '+fam; ctx.fillStyle='#eef2f6';
    let nm=pl.handle;
    while(ctx.measureText(nm).width>pw-6 && nm.length>3) nm=nm.slice(0,-2);
    ctx.fillText(nm.toUpperCase(), px+pw/2, pyTop+ph+26);
    px+=pw+gap;
  });

  // ---- teal stat strip -------------------------------------------------
  const cells=winnersStatCells(f);
  const colW=W/cells.length;
  ctx.fillStyle=TEAL; ctx.fillRect(0, HERO, W, LABELS);
  ctx.fillStyle='#ffffff'; ctx.fillRect(0, HERO+LABELS, W, VALUES);
  cells.forEach((c,i)=>{
    const mid=colW*i+colW/2;
    ctx.textAlign='center';
    let lf=14; ctx.font='800 '+lf+'px '+fam;
    while(ctx.measureText(c.lab).width>colW-16 && lf>9){ lf--; ctx.font='800 '+lf+'px '+fam; }
    ctx.fillStyle='rgba(255,255,255,.96)';
    ctx.fillText(c.lab, mid, HERO+30);
    ctx.font='italic 900 54px '+fam; ctx.fillStyle=INK;
    ctx.fillText(String(c.val), mid, HERO+LABELS+68);
  });

  let y = HERO+LABELS+VALUES;

  // ---- prize -----------------------------------------------------------
  if(earned>0){
    const money=ccMoney(earned);
    ctx.textAlign='center'; ctx.font='italic 900 46px '+fam;
    const cw=ctx.measureText(money).width+52, ch=62;
    ctx.fillStyle=INK; ctx.fillRect(W/2-cw/2, y+22, cw, ch);
    ctx.fillStyle='#ffd166'; ctx.fillText(money, W/2, y+22+46);
    ctx.font='800 15px '+fam; ctx.fillStyle=MUTED;
    ctx.fillText(ccMoney(Math.round(earned/Math.max(1,squad.length)))+' PER PLAYER',
      W/2, y+22+ch+24);
    y+=prizeH;
  }
  y+=30;

  // ---- squad strip -----------------------------------------------------
  const panelX=52, panelW=W-104;
  ctx.fillStyle='rgba(255,255,255,.86)'; ctx.fillRect(panelX, y, panelW, squadH);
  ctx.fillStyle=TEAL; ctx.fillRect(panelX, y, 6, squadH);
  ctx.textAlign='left'; ctx.font='800 14px '+fam; ctx.fillStyle=MUTED;
  ctx.fillText(String(L().yourSquadTitle||'SQUAD').toUpperCase(), panelX+24, y+28);
  ctx.textAlign='right'; ctx.font='italic 900 18px '+fam; ctx.fillStyle=TEAL;
  ctx.fillText('PWR '+Math.round(you.pow||0), panelX+panelW-24, y+28);
  ctx.textAlign='left';
  squad.forEach((pl,i)=>{
    const ry=y+48+i*58;
    ctx.font='900 24px '+fam; ctx.fillStyle=INK;
    ctx.fillText(pl.handle.toUpperCase(), panelX+24, ry+22);
    ctx.font='700 14px '+fam; ctx.fillStyle=MUTED;
    ctx.fillText((pl.nat?natDisplay(pl.nat):'-')+'  ·  '+pl.rating, panelX+24, ry+42);
    // exotic — креатор Про-Ама, тот же #70C7F8, что на карточке и в --exotic.
    const rColor={common:'#9aa0a6',uncommon:'#3aa76a',rare:'#2b8fd0',epic:'#8b4ecc',legendary:'#d9a520',mythic:'#d9a520',exotic:'#70c7f8'}[shownRarity(pl)]||'#9aa0a6';
    ctx.fillStyle=rColor; ctx.fillRect(panelX+panelW-38, ry+8, 14, 14);
  });
  y+=squadH;

  // ---- standings, broadcast style --------------------------------------
  if(lbRows.length){
    const tY=y+30;
    ctx.textAlign='left'; ctx.font='italic 900 30px '+fam; ctx.fillStyle=INK;
    ctx.fillText('STANDINGS', panelX, tY);

    // column geometry: a solid rank square, the team, then four right-aligned
    // numeric columns exactly as the broadcast orders them.
    const rankW=58;
    const teamX=panelX+rankW+20;
    const right=panelX+panelW-22;
    const numW=104;
    const ptsR=right, plcR=right-numW, elimR=plcR-numW, vrR=elimR-numW;
    const teamMax=vrR-30-teamX;

    const headY=tY+30;
    ctx.font='800 13px '+fam; ctx.fillStyle=MUTED; ctx.textAlign='right';
    ctx.fillText('VRS', vrR, headY+18);
    ctx.fillText('ELIMS', elimR, headY+18);
    ctx.fillText('PLCMNT PTS', plcR, headY+18);
    ctx.fillText('PTS', ptsR, headY+18);
    ctx.textAlign='left';

    const bodyTop=headY+tblHead-12;
    lbRows.forEach((row,i)=>{
      const ry=bodyTop+i*rowH;
      const t=row.team;
      const isYou=t===you;
      // row bar
      ctx.fillStyle = isYou ? 'rgba(0,176,144,.16)' : (i%2 ? '#eaeef1' : '#f7f9fa');
      ctx.fillRect(panelX+rankW, ry, panelW-rankW, rowH-4);
      if(isYou){ ctx.fillStyle=TEAL; ctx.fillRect(panelX+rankW, ry, 5, rowH-4); }
      // rank square
      ctx.fillStyle = row.rank===1 ? '#d9a520' : INK;
      ctx.fillRect(panelX, ry, rankW, rowH-4);
      ctx.textAlign='center'; ctx.font='italic 900 26px '+fam; ctx.fillStyle='#fff';
      ctx.fillText(String(row.rank), panelX+rankW/2, ry+35);

      // team
      ctx.textAlign='left';
      // the live table prefixes your own row with "Your squad:"; a broadcast
      // standings row is just the team, so it comes off here.
      let nm=t.name.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&')
        .replace(/^\s*(Твой состав|Your squad)\s*:\s*/i,'')
        .replace(/&/g,'+').toUpperCase();
      let nf=21; ctx.font='900 '+nf+'px '+fam;
      while(ctx.measureText(nm).width>teamMax && nf>12){ nf--; ctx.font='900 '+nf+'px '+fam; }
      while(ctx.measureText(nm).width>teamMax && nm.length>4){ nm=nm.slice(0,-3)+'…'; }
      ctx.fillStyle=INK;
      ctx.fillText(nm, teamX, ry+33);

      // numbers
      const log=((t.stageLog&&t.stageLog.length)?t.stageLog:(t.gameLog||[])).filter(g=>!g.isLandingBonus);
      const pts = t.totalPts!=null?t.totalPts:(t.stagePts||0);
      const elimPts = log.reduce((a,g)=>a+(g.elimPts||0),0);
      const plc = Math.max(0, pts-elimPts);
      const vrs = log.filter(g=>g.place===1).length || (t.wins||0);
      const elims = t.totalElims!=null?t.totalElims:(t.stageElims||0);
      ctx.textAlign='right'; ctx.fillStyle=INK;
      ctx.font='italic 900 25px '+fam;
      ctx.fillText(String(vrs).padStart(2,'0'), vrR, ry+34);
      ctx.fillText(String(elims), elimR, ry+34);
      ctx.fillText(String(plc), plcR, ry+34);
      ctx.fillText(String(pts), ptsR, ry+34);
      ctx.textAlign='left';
    });
  }

  // ---- footer ----------------------------------------------------------
  ctx.font='800 15px '+fam; ctx.fillStyle=MUTED; ctx.textAlign='center';
  ctx.fillText('made by psychopath  ·  fncs draft simulator', W/2, H-26);

  const link=document.createElement('a');
  link.download='fncs-draft-result.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function finalizeRunStats(mode, isMajor, place, totalTeams, championMajor, cameFromLcq, reachedFinals, you, allTeams){
  const avgRating = drafted.length ? Math.round(drafted.reduce((s,p)=>s+p.rating,0)/drafted.length) : 0;
  const syn = draftSynergy(drafted);
  const grade = computeDraftGrade(avgRating, syn.bonus);
  const rerollsUsed = 2-rerollsLeft;

  const gradeBadge=document.getElementById('gradeBadge');
  const gradeScoreLine=document.getElementById('gradeScoreLine');
  if(gradeBadge){
    gradeBadge.textContent=grade;
    gradeBadge.className='grade-badge grade-'+grade;
  }
  if(gradeScoreLine){
    gradeScoreLine.textContent=avgRating+' '+L().ratingHeader.toLowerCase()+' · +'+syn.bonus+' '+L().synergyLabel.replace(':','').toLowerCase();
  }

  const points = you ? (you.totalPts!=null?you.totalPts:you.stagePts||0) : 0;
  const elims = you ? (you.totalElims!=null?you.totalElims:you.stageElims||0) : 0;
  const wins = you ? (you.wins||0) : 0;
  const matches = you ? ((you.gameLog||you.stageLog||[]).filter(g=>!g.isLandingBonus).length) : 0;

  saveHistoryEntry({
    date:new Date().toISOString(),
    mode, isMajor,
    squad:drafted.map(p=>p.handle).join(' & '),
    place, totalTeams,
    grade, championMajor:!!championMajor,
    points, matches, wins, elims
  });
  __runRecorded=true;

  const ctx={mode, isMajor, place, totalTeams, avgRating, synergyBonus:syn.bonus, grade, squad:drafted, rerollsUsed,
    championMajor:!!championMajor, cameFromLcq:!!cameFromLcq, reachedFinals:!!reachedFinals, you, allTeams,
    cardMode:CARD_MODE, cardSet:CARD_SET, region:(drafted[0]||{}).region||null, summit:lastSummit};
  const newly=checkAndUnlockAchievements(ctx);
  showUnlockToasts(newly);
  renderAchievementBadge();
}

function openHistoryScreen(){
  renderHistoryScreen();
  show('screen-history');
}

function computeTop20Cards(){
  const bestByHandle=new Map();
  PLAYERS.forEach(p=>{
    const key=p.handle.toLowerCase();
    const cur=bestByHandle.get(key);
    if(!cur || p.rating>cur.rating) bestByHandle.set(key, p);
  });
  return [...bestByHandle.values()].sort((a,b)=>b.rating-a.rating).slice(0,20);
}

function getCollectedHandles(){
  const set=new Set();
  loadHistory().forEach(h=>{
    (h.squad||'').split(' & ').forEach(name=>{ if(name) set.add(name.trim().toLowerCase()); });
  });
  return set;
}

function renderCardCollection(){
  const grid=document.getElementById('collectionGrid');
  if(!grid) return;
  grid.innerHTML='';
  const top20=computeTop20Cards();
  const collected=getCollectedHandles();
  let haveCount=0;
  top20.forEach(p=>{
    const has=collected.has(p.handle.toLowerCase());
    if(has) haveCount++;
    const card=document.createElement('div');
    card.className='achv-card '+(has?'unlocked':'locked');
    const flag=cardFlag(p,16);
    card.innerHTML=`<div class="achv-icon">${has?'🃏':'🔒'}</div><div><div class="achv-title">${flag}${p.handle}</div><div class="achv-desc">${L().ratingHeader} ${p.rating} · ${p.nat?natDisplay(p.nat):'-'}</div></div>`;
    grid.appendChild(card);
  });
  const progressEl=document.getElementById('collectionProgress');
  if(progressEl) progressEl.textContent=L().collectionProgress(haveCount, top20.length);
}

function renderHistoryScreen(){
  const grid=document.getElementById('achvGrid');
  grid.innerHTML='';
  const unlocked=loadAchievements();
  ACHIEVEMENTS.forEach(a=>{
    const is=unlocked.has(a.id);
    const card=document.createElement('div');
    card.className='achv-card '+(is?'unlocked':'locked');
    card.innerHTML=`<div class="achv-icon">${a.icon}</div><div><div class="achv-title">${L()['achv_'+a.id+'_title']}</div><div class="achv-desc">${L()['achv_'+a.id+'_desc']}</div></div>`;
    grid.appendChild(card);
  });

  renderCardCollection();

  const body=document.getElementById('historyTableBody');
  body.innerHTML='';
  const hist=loadHistory();
  if(hist.length===0){
    body.innerHTML=`<tr><td colspan="10" style="color:var(--ink-dimmer);">${L().noHistoryYet}</td></tr>`;
    return;
  }
  hist.forEach(h=>{
    const tr=document.createElement('tr');
    const d=new Date(h.date);
    const dateStr=d.toLocaleDateString(LANG==='en'?'en-US':'ru-RU',{day:'2-digit',month:'short'});
    const modeLabel = h.isMajor ? 'ALL FNCS' : (h.mode===2?L().modeDuoTitle:(h.mode===3?L().modeTrioTitle:L().modeSquadTitle));
    const resultStr = h.championMajor ? L().championMajor : (h.place==null ? L().eliminatedBanner : (h.place+' / '+h.totalTeams));
    tr.innerHTML=`<td>${dateStr}</td><td>${modeLabel}</td><td>${h.squad}</td><td class="num lobby-pts">${h.points||0}</td><td class="num lobby-num">${h.matches||0}</td><td class="num lobby-num">${h.wins||0}</td><td class="num lobby-num">${h.elims||0}</td><td>${resultStr}</td><td class="rate grade-${h.grade}">${h.grade}</td>`;
    body.appendChild(tr);
  });
}

// A run only exists on the draft and results screens, and a draft nobody has
// picked into yet has nothing worth protecting — so only interrupt when there
// is actually something to lose.
function runInProgress(){
  const results=document.getElementById('screen-results');
  if(results && results.classList.contains('active')) return true;
  const draft=document.getElementById('screen-draft');
  return !!(draft && draft.classList.contains('active') && drafted.length>0);
}
function onResetConfirmKey(e){
  if(e.key==='Escape') closeResetConfirm();
}
function closeResetConfirm(){
  document.getElementById('resetConfirmModal').style.display='none';
  document.removeEventListener('keydown', onResetConfirmKey);
}
function requestReset(){
  if(!runInProgress()){ resetAll(); return; }
  const body=document.getElementById('resetConfirmBodyEl');
  if(body) body.textContent = __runRecorded ? L().resetConfirmBodyDone : L().resetConfirmBody;
  document.getElementById('resetConfirmModal').style.display='flex';
  document.addEventListener('keydown', onResetConfirmKey);
  // Focus the safe option, so a stray Enter cancels rather than discards.
  const cancel=document.getElementById('resetConfirmNo');
  if(cancel) cancel.focus();
}

function resetAll(){
  resetRunRecord();
  const rsPrev3=document.getElementById('runSummary'); if(rsPrev3) rsPrev3.innerHTML='';
  lobbyPrizeTable=null;
  MODE_ART_NOW=null;   // меню — не «в» режиме, задник арта снимается вместе с темой
  clearLobbyTheme();
  clearEventPanel();
  removeSkipButton();
  removeLandingPrompt();
  skipAnimation=false;
  document.getElementById('topBadge').textContent=L().badgeMode;
  preSelectedRegions=[];
  preSelectedYears=[];
  CARD_MODE=false; pendingCards=false; CARD_SET='m2'; pendingCardSet='m2';
  cardFlipped={};
  const g=document.getElementById('cardGallery'); if(g) g.style.display='none';
  const gt=document.getElementById('cardGalleryTitle'); if(gt) gt.style.display='none';
  show('screen-mode');
}

window.addEventListener('DOMContentLoaded', ()=>{
  // Covers applyStaticI18n + the achievement badge, and additionally syncs
  // <html lang>, the document title and the EN/RU chip highlight to the
  // language restored from storage.
  setLang(LANG, false);
  // Ссылка для входа в лобби (?join=КОД) — сразу на экран создания карьеры.
  try{ if(typeof ccJoinFromUrl==='function') ccJoinFromUrl(); }catch(e){}
  // The career tile carries the Majors' artwork by name now, painted by the
  // same lazy loader as its neighbours. It used to copy the computed background
  // off #major2Art here, which quietly returned nothing once the tiles went
  // lazy — see data-art below.
});

/* ===== CAREER — screen 1: creating the player ==============================
   Ping to the Frankfurt server, per country, read off the reference map. The
   map's own footnote calls these approximate and so do we — they are here to
   make country a real decision, not to be a measurement.

   Country is not decoration. It sets your ping, and ping is what bends
   close-range fights later: a Georgian player is not worse at the game, they
   just lose the trades they should have won. */
/* Where a European career can be from, and what the connection costs.

   The first 45 are measured to Frankfurt. The rest joined on 19 August, when
   the map grew east past Almaty and south past Cairo — "взять северную Африку и
   еще центральную Азию, до 120 пинга, пусть казахстан будет еу регион" — and
   their milliseconds are the fit in tools/build-ping-fit.js rather than a
   measurement, because nobody has measured them. 120 ms is the reach; Kazakhstan
   is over it at 127 and is here anyway, because Kazakh players queue in Europe
   and that is a fact about the ladder rather than about the distance. */
/* European career countries and their ping to the server.
   Ruler rule: 60 km per ms, capital straight to the server, nothing else. Physics gives ~100 km/ms, the measured
   European matrix ~55, so 60 is close. It can't see routing (Pakistan reaches Tokyo via Europe: 100 vs measured 350).
   The old table was inconsistent hand values plus a fitted curve written back into itself.
   Measurements are in tools/ping/*.json; tools/build-ping-measured.js rebuilds this table by capital, population or ruler.
   150 ms is the reach where a duo stops being playable. A country in reach of two regions is offered by both
   (Kazakhstan: EU 127, ME 74). */
const CC_COUNTRIES=[
  {c:'lu',ping:3},  {c:'be',ping:5},  {c:'ch',ping:6},  {c:'nl',ping:6},
  {c:'li',ping:6},  {c:'cz',ping:7},  {c:'de',ping:7},  {c:'fr',ping:8},
  {c:'at',ping:10}, {c:'si',ping:10}, {c:'sk',ping:11}, {c:'gb',ping:11},
  {c:'dk',ping:11}, {c:'hr',ping:12}, {c:'hu',ping:14}, {c:'pl',ping:15},
  {c:'it',ping:16}, {c:'im',ping:17}, {c:'ba',ping:17}, {c:'ad',ping:17},
  {c:'ie',ping:18}, {c:'no',ping:18}, {c:'rs',ping:18}, {c:'se',ping:20},
  {c:'me',ping:20}, {c:'lv',ping:21}, {c:'lt',ping:21}, {c:'al',ping:22},
  {c:'mk',ping:22}, {c:'bg',ping:23}, {c:'by',ping:23}, {c:'es',ping:24},
  {c:'ro',ping:24}, {c:'ee',ping:24}, {c:'fi',ping:25}, {c:'tn',ping:25},
  {c:'md',ping:25}, {c:'ua',ping:26}, {c:'dz',ping:26}, {c:'mt',ping:27},
  {c:'gr',ping:30}, {c:'pt',ping:32}, {c:'ly',ping:32}, {c:'ru',ping:34},
  {c:'ma',ping:37}, {c:'tr',ping:37}, {c:'is',ping:40}, {c:'cy',ping:43},
  {c:'lb',ping:47}, {c:'eg',ping:49}, {c:'ge',ping:49}, {c:'sy',ping:49},
  {c:'ps',ping:49}, {c:'am',ping:50}, {c:'il',ping:50}, {c:'jo',ping:50},
  {c:'eh',ping:52}, {c:'az',ping:56}, {c:'iq',ping:58}, {c:'ir',ping:63},
  {c:'kw',ping:67}, {c:'tm',ping:69}, {c:'kz',ping:71}, {c:'sa',ping:72},
  {c:'bh',ping:74}, {c:'qa',ping:76}, {c:'uz',ping:78}, {c:'tj',ping:80},
  {c:'ae',ping:81}, {c:'kg',ping:82}, {c:'af',ping:85}, {c:'om',ping:86},
  {c:'pk',ping:91}
];
/* Monthly rent for living in a country, sold as a way to fix ping.
   Ping used to be fixed at creation for the whole career; real players fix it by moving.
   Rough country-wide average one-bedroom rent in USD per month, and the UI says it's approximate.
   Home is free: a career starts at 16 at the parents'. */
const CC_RENT={
  de:1000, at:900,  nl:1400, be:850,  lu:1600, ch:1700, cz:700,  pl:600,
  si:700,  sk:550,  se:900,  hu:500,  dk:1200, it:750,  no:1200, rs:450,
  hr:550,  ba:300,  fr:900,  bg:450,  me:500,  fi:900,  gb:1300, gr:500,
  ad:900,  ee:600,  al:350,  mk:300,  lv:450,  ro:450,  lt:550,  mt:900,
  by:300,  is:1300, es:850,  md:350,  ie:1800, ua:350,  pt:900,  tr:500,
  cy:800,  ru:500,  ge:450,  am:400,  az:350,
  /* Joined on 19 August with the map, and priced rather than invented: rent
     tracks how rich a country is, so tools/build-rent-fit.js fits the 45
     above against GDP per head and reads these off the line. R2 0.88 in logs,
     mean error $103 against the hand-written ones. */
  tj:150, eh:200, uz:200, tn:250, ma:250, eg:250, dz:300, ps:300,
  jo:300, sy:350, iq:350, ir:350, ly:400, lb:400, tm:400, kz:450,
  sa:700, bh:700, kw:850, il:950, qa:1150, im:1400, li:1950,
  /* And the rest of the world, when the other six maps arrived. Same fit:
     rent against GDP per head, tools/build-rent-fit.js. */
  kg:150, af:150, pk:150, ht:150, np:150, ye:150, er:150, sd:150,
  ni:200, kp:200, kh:200, mm:200, bd:200, in:200, tl:200, hn:250,
  vn:250, la:250, bt:250, pg:250, vu:250, sb:250, gt:300, sv:300,
  bo:300, ph:300, mn:300, id:300, jm:350, bz:350, py:350, ec:350,
  fj:350, dm:400, vc:400, sr:400, pe:400, gy:400, co:400, th:400,
  cu:450, do:450, mx:450, br:450, ar:450, cn:450, lc:500, gd:500,
  my:500, cl:550, pw:550, om:600, ag:600, uy:600, tt:600, ve:600,
  pa:600, kn:650, cw:650, bb:650, tc:800, aw:800, bn:800, bs:850,
  pr:850, kr:850, gu:850, nc:900, ae:950, jp:950, nz:950, ca:1000,
  tw:1000, hk:1000, au:1100, us:1200, sg:1200, ky:1350, bm:1600
};
/* A subdivision pays what its country pays.

   The North America maps are drawn by state since 20 August, so a code can be
   `us-ca` — and the rent table is written per country, because rent per state
   is a second dataset nobody has measured. Falling through to the country keeps
   a move between states free and a move between countries priced, which is the
   truth as far as this file knows it. */
/* The country a code belongs to, which for a state is the country it is in.
   `us-ca` is a place on the map and a number in the ping table; it is not a
   nationality, a flag or a passport, and everything that means one of those
   reads through this. */
function ccCountryOf(code){
  const s=String(code||'');
  const at=s.indexOf('-');
  return at>0 ? s.slice(0, at) : s;
}
function ccRentOf(code){
  let v=CC_RENT[code];
  if(v==null && typeof code==='string' && code.indexOf('-')>0) v=CC_RENT[code.split('-')[0]];
  return v==null ? null : v;
}
const CC_REGION_NAMES=JSON.parse("{\"ru\":{\"us\":\"США\",\"mx\":\"Мексика\",\"ca\":\"Канада\",\"do\":\"Доминикана\",\"cu\":\"Куба\",\"pr\":\"Пуэрто-Рико\",\"ht\":\"Гаити\",\"gt\":\"Гватемала\",\"sv\":\"Сальвадор\",\"hn\":\"Гондурас\",\"jm\":\"Ямайка\",\"ni\":\"Никарагуа\",\"bs\":\"Багамы\",\"bb\":\"Барбадос\",\"cw\":\"Кюрасао\",\"aw\":\"Аруба\",\"bm\":\"Бермуды\",\"vc\":\"Сент-Винсент\",\"lc\":\"Сент-Люсия\",\"ag\":\"Антигуа\",\"gd\":\"Гренада\",\"dm\":\"Доминика\",\"kn\":\"Сент-Китс\",\"bz\":\"Белиз\",\"tc\":\"Тёркс и Кайкос\",\"ky\":\"острова Кайман\",\"br\":\"Бразилия\",\"ar\":\"Аргентина\",\"co\":\"Колумбия\",\"pe\":\"Перу\",\"cl\":\"Чили\",\"ve\":\"Венесуэла\",\"ec\":\"Эквадор\",\"bo\":\"Боливия\",\"py\":\"Парагвай\",\"uy\":\"Уругвай\",\"pa\":\"Панама\",\"tt\":\"Тринидад\",\"sr\":\"Суринам\",\"gy\":\"Гайана\",\"cn\":\"Китай\",\"in\":\"Индия\",\"jp\":\"Япония\",\"id\":\"Индонезия\",\"pk\":\"Пакистан\",\"bd\":\"Бангладеш\",\"kr\":\"Корея\",\"ph\":\"Филиппины\",\"vn\":\"Вьетнам\",\"tw\":\"Тайвань\",\"th\":\"Таиланд\",\"hk\":\"Гонконг\",\"mm\":\"Мьянма\",\"sg\":\"Сингапур\",\"kz\":\"Казахстан\",\"my\":\"Малайзия\",\"uz\":\"Узбекистан\",\"kp\":\"КНДР\",\"kh\":\"Камбоджа\",\"mn\":\"Монголия\",\"np\":\"Непал\",\"kg\":\"Киргизия\",\"la\":\"Лаос\",\"pg\":\"Папуа\",\"bn\":\"Бруней\",\"tl\":\"Восточный Тимор\",\"gu\":\"Гуам\",\"bt\":\"Бутан\",\"pw\":\"Палау\",\"tr\":\"Турция\",\"eg\":\"Египет\",\"ir\":\"Иран\",\"sa\":\"Саудовская Аравия\",\"sd\":\"Судан\",\"iq\":\"Ирак\",\"sy\":\"Сирия\",\"af\":\"Афганистан\",\"il\":\"Израиль\",\"ye\":\"Йемен\",\"az\":\"Азербайджан\",\"kw\":\"Кувейт\",\"ae\":\"ОАЭ\",\"lb\":\"Ливан\",\"qa\":\"Катар\",\"ge\":\"Грузия\",\"tm\":\"Туркмения\",\"am\":\"Армения\",\"tj\":\"Таджикистан\",\"jo\":\"Иордания\",\"om\":\"Оман\",\"er\":\"Эритрея\",\"bh\":\"Бахрейн\",\"ps\":\"Палестина\",\"cy\":\"Кипр\",\"au\":\"Австралия\",\"nz\":\"Новая Зеландия\",\"fj\":\"Фиджи\",\"nc\":\"Новая Каледония\",\"sb\":\"Соломоновы о-ва\",\"vu\":\"Вануату\",\"im\":\"Остров Мэн\",\"gb\":\"Великобритания\",\"ua\":\"Украина\",\"tn\":\"Тунис\",\"ch\":\"Швейцария\",\"se\":\"Швеция\",\"es\":\"Испания\",\"sk\":\"Словакия\",\"si\":\"Словения\",\"rs\":\"Сербия\",\"ru\":\"Россия\",\"ro\":\"Румыния\",\"pt\":\"Португалия\",\"pl\":\"Польша\",\"no\":\"Норвегия\",\"nl\":\"Нидерланды\",\"ma\":\"Марокко\",\"eh\":\"Западная Сахара\",\"me\":\"Черногория\",\"md\":\"Молдавия\",\"mt\":\"Мальта\",\"mk\":\"Северная Македония\",\"lu\":\"Люксембург\",\"lt\":\"Литва\",\"li\":\"Лихтенштейн\",\"ly\":\"Ливия\",\"lv\":\"Латвия\",\"it\":\"Италия\",\"ie\":\"Ирландия\",\"is\":\"Исландия\",\"hu\":\"Венгрия\",\"gr\":\"Греция\",\"de\":\"Германия\",\"fr\":\"Франция\",\"fi\":\"Финляндия\",\"ee\":\"Эстония\",\"dk\":\"Дания\",\"cz\":\"Чехия\",\"hr\":\"Хорватия\",\"bg\":\"Болгария\",\"ba\":\"Босния и Герцеговина\",\"be\":\"Бельгия\",\"by\":\"Белоруссия\",\"at\":\"Австрия\",\"ad\":\"Андорра\",\"dz\":\"Алжир\",\"al\":\"Албания\",\"us-ca\":\"Калифорния\",\"us-ny\":\"Нью-Йорк\",\"us-tx\":\"Техас\",\"us-fl\":\"Флорида\",\"us-il\":\"Иллинойс\",\"us-pa\":\"Пенсильвания\",\"us-ga\":\"Джорджия\",\"us-ma\":\"Массачусетс\",\"us-az\":\"Аризона\",\"us-dc\":\"Вашингтон\",\"us-mi\":\"Мичиган\",\"us-wa\":\"Вашингтон\",\"us-mo\":\"Миссури\",\"us-oh\":\"Огайо\",\"us-mn\":\"Миннесота\",\"us-co\":\"Колорадо\",\"us-tn\":\"Теннесси\",\"us-md\":\"Мэриленд\",\"us-nv\":\"Невада\",\"us-or\":\"Орегон\",\"us-va\":\"Виргиния\",\"us-ok\":\"Оклахома\",\"us-la\":\"Луизиана\",\"us-in\":\"Индиана\",\"us-wi\":\"Висконсин\",\"us-nc\":\"Северная Каролина\",\"us-ct\":\"Коннектикут\",\"us-nm\":\"Нью-Мексико\",\"us-ut\":\"Юта\",\"us-ne\":\"Небраска\",\"us-sc\":\"Южная Каролина\",\"us-ia\":\"Айова\",\"us-id\":\"Айдахо\",\"us-mt\":\"Монтана\",\"us-nd\":\"Северная Дакота\",\"us-ms\":\"Миссисипи\",\"us-al\":\"Алабама\",\"us-sd\":\"Южная Дакота\",\"us-wy\":\"Вайоминг\",\"us-ks\":\"Канзас\",\"us-wv\":\"Западная Виргиния\",\"us-vt\":\"Вермонт\",\"us-me\":\"Мэн\"},\"en\":{\"us\":\"United States of America\",\"mx\":\"Mexico\",\"ca\":\"Canada\",\"do\":\"Dominican Republic\",\"cu\":\"Cuba\",\"pr\":\"Puerto Rico\",\"ht\":\"Haiti\",\"gt\":\"Guatemala\",\"sv\":\"El Salvador\",\"hn\":\"Honduras\",\"jm\":\"Jamaica\",\"ni\":\"Nicaragua\",\"bs\":\"Bahamas\",\"bb\":\"Barbados\",\"cw\":\"Curaçao\",\"aw\":\"Aruba\",\"bm\":\"Bermuda\",\"vc\":\"St Vincent\",\"lc\":\"Saint Lucia\",\"ag\":\"Antigua\",\"gd\":\"Grenada\",\"dm\":\"Dominica\",\"kn\":\"St Kitts\",\"bz\":\"Belize\",\"tc\":\"Turks and Caicos Islands\",\"ky\":\"Cayman Islands\",\"br\":\"Brazil\",\"ar\":\"Argentina\",\"co\":\"Colombia\",\"pe\":\"Peru\",\"cl\":\"Chile\",\"ve\":\"Venezuela\",\"ec\":\"Ecuador\",\"bo\":\"Bolivia\",\"py\":\"Paraguay\",\"uy\":\"Uruguay\",\"pa\":\"Panama\",\"tt\":\"Trinidad\",\"sr\":\"Suriname\",\"gy\":\"Guyana\",\"cn\":\"China\",\"in\":\"India\",\"jp\":\"Japan\",\"id\":\"Indonesia\",\"pk\":\"Pakistan\",\"bd\":\"Bangladesh\",\"kr\":\"South Korea\",\"ph\":\"Philippines\",\"vn\":\"Vietnam\",\"tw\":\"Taiwan\",\"th\":\"Thailand\",\"hk\":\"Hong Kong\",\"mm\":\"Myanmar\",\"sg\":\"Singapore\",\"kz\":\"Kazakhstan\",\"my\":\"Malaysia\",\"uz\":\"Uzbekistan\",\"kp\":\"North Korea\",\"kh\":\"Cambodia\",\"mn\":\"Mongolia\",\"np\":\"Nepal\",\"kg\":\"Kyrgyzstan\",\"la\":\"Laos\",\"pg\":\"Papua New Guinea\",\"bn\":\"Brunei\",\"tl\":\"East Timor\",\"gu\":\"Guam\",\"bt\":\"Bhutan\",\"pw\":\"Palau\",\"tr\":\"Turkey\",\"eg\":\"Egypt\",\"ir\":\"Iran\",\"sa\":\"Saudi Arabia\",\"sd\":\"Sudan\",\"iq\":\"Iraq\",\"sy\":\"Syria\",\"af\":\"Afghanistan\",\"il\":\"Israel\",\"ye\":\"Yemen\",\"az\":\"Azerbaijan\",\"kw\":\"Kuwait\",\"ae\":\"United Arab Emirates\",\"lb\":\"Lebanon\",\"qa\":\"Qatar\",\"ge\":\"Georgia\",\"tm\":\"Turkmenistan\",\"am\":\"Armenia\",\"tj\":\"Tajikistan\",\"jo\":\"Jordan\",\"om\":\"Oman\",\"er\":\"Eritrea\",\"bh\":\"Bahrain\",\"ps\":\"Palestine\",\"cy\":\"Cyprus\",\"au\":\"Australia\",\"nz\":\"New Zealand\",\"fj\":\"Fiji\",\"nc\":\"New Caledonia\",\"sb\":\"Solomon Islands\",\"vu\":\"Vanuatu\",\"im\":\"Isle of Man\",\"gb\":\"United Kingdom\",\"ua\":\"Ukraine\",\"tn\":\"Tunisia\",\"ch\":\"Switzerland\",\"se\":\"Sweden\",\"es\":\"Spain\",\"sk\":\"Slovakia\",\"si\":\"Slovenia\",\"rs\":\"Serbia\",\"ru\":\"Russia\",\"ro\":\"Romania\",\"pt\":\"Portugal\",\"pl\":\"Poland\",\"no\":\"Norway\",\"nl\":\"Netherlands\",\"ma\":\"Morocco\",\"eh\":\"Western Sahara\",\"me\":\"Montenegro\",\"md\":\"Moldova\",\"mt\":\"Malta\",\"mk\":\"North Macedonia\",\"lu\":\"Luxembourg\",\"lt\":\"Lithuania\",\"li\":\"Liechtenstein\",\"ly\":\"Libya\",\"lv\":\"Latvia\",\"it\":\"Italy\",\"ie\":\"Ireland\",\"is\":\"Iceland\",\"hu\":\"Hungary\",\"gr\":\"Greece\",\"de\":\"Germany\",\"fr\":\"France\",\"fi\":\"Finland\",\"ee\":\"Estonia\",\"dk\":\"Denmark\",\"cz\":\"Czech Republic\",\"hr\":\"Croatia\",\"bg\":\"Bulgaria\",\"ba\":\"Bosnia and Herzegovina\",\"be\":\"Belgium\",\"by\":\"Belarus\",\"at\":\"Austria\",\"ad\":\"Andorra\",\"dz\":\"Algeria\",\"al\":\"Albania\",\"us-ca\":\"California\",\"us-ny\":\"New York\",\"us-tx\":\"Texas\",\"us-fl\":\"Florida\",\"us-il\":\"Illinois\",\"us-pa\":\"Pennsylvania\",\"us-ga\":\"Georgia\",\"us-ma\":\"Massachusetts\",\"us-az\":\"Arizona\",\"us-dc\":\"Washington\",\"us-mi\":\"Michigan\",\"us-wa\":\"Washington\",\"us-mo\":\"Missouri\",\"us-oh\":\"Ohio\",\"us-mn\":\"Minnesota\",\"us-co\":\"Colorado\",\"us-tn\":\"Tennessee\",\"us-md\":\"Maryland\",\"us-nv\":\"Nevada\",\"us-or\":\"Oregon\",\"us-va\":\"Virginia\",\"us-ok\":\"Oklahoma\",\"us-la\":\"Louisiana\",\"us-in\":\"Indiana\",\"us-wi\":\"Wisconsin\",\"us-nc\":\"North Carolina\",\"us-ct\":\"Connecticut\",\"us-nm\":\"New Mexico\",\"us-ut\":\"Utah\",\"us-ne\":\"Nebraska\",\"us-sc\":\"South Carolina\",\"us-ia\":\"Iowa\",\"us-id\":\"Idaho\",\"us-mt\":\"Montana\",\"us-nd\":\"North Dakota\",\"us-ms\":\"Mississippi\",\"us-al\":\"Alabama\",\"us-sd\":\"South Dakota\",\"us-wy\":\"Wyoming\",\"us-ks\":\"Kansas\",\"us-wv\":\"West Virginia\",\"us-vt\":\"Vermont\",\"us-me\":\"Maine\"}}");
const CC_NAMES={
  ru:{de:'Германия',at:'Австрия',nl:'Нидерланды',be:'Бельгия',lu:'Люксембург',ch:'Швейцария',
      cz:'Чехия',pl:'Польша',si:'Словения',sk:'Словакия',se:'Швеция',hu:'Венгрия',dk:'Дания',
      it:'Италия',no:'Норвегия',rs:'Сербия',hr:'Хорватия',ba:'Босния',fr:'Франция',bg:'Болгария',
      me:'Черногория',fi:'Финляндия',gb:'Британия',gr:'Греция',ad:'Андорра',ee:'Эстония',
      al:'Албания',mk:'Македония',lv:'Латвия',ro:'Румыния',lt:'Литва',mt:'Мальта',by:'Беларусь',
      is:'Исландия',es:'Испания',md:'Молдова',ie:'Ирландия',ua:'Украина',pt:'Португалия',
      tr:'Турция',cy:'Кипр',ru:'Россия',ge:'Грузия',am:'Армения',az:'Азербайджан'},
  en:{de:'Germany',at:'Austria',nl:'Netherlands',be:'Belgium',lu:'Luxembourg',ch:'Switzerland',
      cz:'Czechia',pl:'Poland',si:'Slovenia',sk:'Slovakia',se:'Sweden',hu:'Hungary',dk:'Denmark',
      it:'Italy',no:'Norway',rs:'Serbia',hr:'Croatia',ba:'Bosnia',fr:'France',bg:'Bulgaria',
      me:'Montenegro',fi:'Finland',gb:'United Kingdom',gr:'Greece',ad:'Andorra',ee:'Estonia',
      al:'Albania',mk:'N. Macedonia',lv:'Latvia',ro:'Romania',lt:'Lithuania',mt:'Malta',
      by:'Belarus',is:'Iceland',es:'Spain',md:'Moldova',ie:'Ireland',ua:'Ukraine',pt:'Portugal',
      tr:'Turkey',cy:'Cyprus',ru:'Russia',ge:'Georgia',am:'Armenia',az:'Azerbaijan'}
};
const LS_CAREER='fncsdraft_career';


// The map itself: Eurostat GISCO country geometry — the European Commission's
// own, so the borders are the ones the EU recognises and Crimea is Ukrainian.
// Clipped to Europe, projected Mercator and simplified to about half a pixel.
// Kept as JSON text because 90 KB of path data has no business being parsed as
// source every time this file is read.
/* The other six maps, built by tools/build-region-maps.js off Natural Earth.
   Europe's is below and comes from Eurostat GISCO, which is the better source
   where it reaches; this is everywhere it does not.

   NA Central and NA West draw the same continent, so the shapes are held once
   under 'NA' and only the ping tables differ — the servers are Ashburn and
   Santa Clara and a career in Toronto is 17 ms from one and 36 from the other. */
/* The maps live in maps.js and arrive when something actually wants to draw
   one. Declared here so both files share the binding; null until then, so every
   reader has to go through ccMapsReady and none of them can quietly draw a blank
   map instead. */
let CC_REGION_MAPS=null, CC_MAP=null;
let CC_MAPS_STATE=null, CC_MAPS_WAIT=[];
function ccMapsHave(){ return CC_MAPS_STATE==='ready'; }
/* Ask for the maps. Returns true if they are already here, false if the caller
   should render something else for now and expect to be called again. */
function ccMapsReady(then){
  /* Already here: say so and stop. The callback is for the waiting case only —
     calling it now would re-enter the very function that is asking, and the
     first caller was ccRenderList, which promptly called itself until the stack
     ran out. */
  if(CC_MAPS_STATE==='ready') return true;
  if(then) CC_MAPS_WAIT.push(then);
  if(CC_MAPS_STATE==='loading') return false;
  CC_MAPS_STATE='loading';
  const el=document.createElement('script');
  el.src='maps.js';
  el.onload=function(){
    CC_MAPS_STATE='ready';
    const q=CC_MAPS_WAIT; CC_MAPS_WAIT=[];
    q.forEach(function(f){ try{ f(); }catch(e){} });
  };
  // A failed load must not wedge the screen on "loading" for ever — let the next
  // attempt try again.
  el.onerror=function(){ CC_MAPS_STATE=null; CC_MAPS_WAIT=[]; };
  document.head.appendChild(el);
  return false;
}
const CC_MAP_FOR={EU:null, NAC:'NA', NAW:'NA', BR:'BR', ASIA:'ASIA', ME:'ME', OCE:'OCE'};
/* Europe's milliseconds are measured. The rest are the measured European table
   turned into a curve — ping = 4.30 + 0.02416 km to the region's server, fitted
   on those 45 countries at R2 0.83 — and applied to each region's own server
   city. See tools/build-ping-fit.js. Nobody has measured a table for Oceania,
   and one honest curve beats two hundred invented numbers. */
const CC_REGION_PINGS=JSON.parse("{\"NAC\":[{\"c\":\"us-tx\",\"ping\":1},{\"c\":\"us-ok\",\"ping\":6},{\"c\":\"us-ms\",\"ping\":10},{\"c\":\"us-tn\",\"ping\":11},{\"c\":\"us-la\",\"ping\":12},{\"c\":\"us-ks\",\"ping\":12},{\"c\":\"us-mo\",\"ping\":15},{\"c\":\"us-al\",\"ping\":16},{\"c\":\"us-ne\",\"ping\":16},{\"c\":\"us-nm\",\"ping\":16},{\"c\":\"us-ia\",\"ping\":17},{\"c\":\"us-co\",\"ping\":18},{\"c\":\"us-ga\",\"ping\":19},{\"c\":\"us-in\",\"ping\":20},{\"c\":\"us-sd\",\"ping\":20},{\"c\":\"us-wy\",\"ping\":20},{\"c\":\"us-il\",\"ping\":22},{\"c\":\"us-wi\",\"ping\":23},{\"c\":\"us-mn\",\"ping\":23},{\"c\":\"us-sc\",\"ping\":24},{\"c\":\"us-az\",\"ping\":24},{\"c\":\"us-wv\",\"ping\":25},{\"c\":\"mx\",\"ping\":25},{\"c\":\"us-nd\",\"ping\":26},{\"c\":\"us-oh\",\"ping\":27},{\"c\":\"us-mi\",\"ping\":27},{\"c\":\"us-ut\",\"ping\":27},{\"c\":\"us-nc\",\"ping\":28},{\"c\":\"us-mt\",\"ping\":29},{\"c\":\"us-nv\",\"ping\":29},{\"c\":\"us-fl\",\"ping\":30},{\"c\":\"cu\",\"ping\":30},{\"c\":\"us-dc\",\"ping\":32},{\"c\":\"us-md\",\"ping\":32},{\"c\":\"us-va\",\"ping\":32},{\"c\":\"bz\",\"ping\":32},{\"c\":\"us-ca\",\"ping\":33},{\"c\":\"us-pa\",\"ping\":35},{\"c\":\"bs\",\"ping\":35},{\"c\":\"gt\",\"ping\":35},{\"c\":\"us-id\",\"ping\":35},{\"c\":\"ky\",\"ping\":36},{\"c\":\"us-ny\",\"ping\":37},{\"c\":\"us-ct\",\"ping\":38},{\"c\":\"ca\",\"ping\":38},{\"c\":\"hn\",\"ping\":38},{\"c\":\"sv\",\"ping\":38},{\"c\":\"us-vt\",\"ping\":40},{\"c\":\"us-ma\",\"ping\":42},{\"c\":\"ni\",\"ping\":42},{\"c\":\"jm\",\"ping\":43},{\"c\":\"us-me\",\"ping\":44},{\"c\":\"us-or\",\"ping\":44},{\"c\":\"us-wa\",\"ping\":45},{\"c\":\"tc\",\"ping\":47},{\"c\":\"ht\",\"ping\":48},{\"c\":\"bm\",\"ping\":50},{\"c\":\"do\",\"ping\":52},{\"c\":\"pr\",\"ping\":57},{\"c\":\"aw\",\"ping\":59},{\"c\":\"cw\",\"ping\":61},{\"c\":\"kn\",\"ping\":64},{\"c\":\"ag\",\"ping\":65},{\"c\":\"dm\",\"ping\":68},{\"c\":\"lc\",\"ping\":70},{\"c\":\"vc\",\"ping\":70},{\"c\":\"gd\",\"ping\":71},{\"c\":\"bb\",\"ping\":73}],\"NAW\":[{\"c\":\"us-or\",\"ping\":1},{\"c\":\"us-wa\",\"ping\":4},{\"c\":\"us-id\",\"ping\":9},{\"c\":\"us-ut\",\"ping\":17},{\"c\":\"us-mt\",\"ping\":18},{\"c\":\"us-nv\",\"ping\":20},{\"c\":\"us-ca\",\"ping\":22},{\"c\":\"us-wy\",\"ping\":25},{\"c\":\"us-co\",\"ping\":26},{\"c\":\"us-az\",\"ping\":27},{\"c\":\"us-nm\",\"ping\":30},{\"c\":\"us-nd\",\"ping\":33},{\"c\":\"us-sd\",\"ping\":34},{\"c\":\"us-ne\",\"ping\":37},{\"c\":\"us-mn\",\"ping\":38},{\"c\":\"us-ks\",\"ping\":39},{\"c\":\"us-ia\",\"ping\":39},{\"c\":\"us-ok\",\"ping\":41},{\"c\":\"us-tx\",\"ping\":44},{\"c\":\"us-mo\",\"ping\":46},{\"c\":\"us-wi\",\"ping\":46},{\"c\":\"us-il\",\"ping\":47},{\"c\":\"us-tn\",\"ping\":50},{\"c\":\"us-in\",\"ping\":50},{\"c\":\"us-ms\",\"ping\":52},{\"c\":\"us-mi\",\"ping\":53},{\"c\":\"us-la\",\"ping\":55},{\"c\":\"us-oh\",\"ping\":55},{\"c\":\"us-al\",\"ping\":57},{\"c\":\"us-wv\",\"ping\":57},{\"c\":\"us-ga\",\"ping\":58},{\"c\":\"mx\",\"ping\":60},{\"c\":\"ca\",\"ping\":60},{\"c\":\"us-sc\",\"ping\":62},{\"c\":\"us-dc\",\"ping\":63},{\"c\":\"us-md\",\"ping\":63},{\"c\":\"us-nc\",\"ping\":64},{\"c\":\"us-vt\",\"ping\":64},{\"c\":\"us-pa\",\"ping\":65},{\"c\":\"us-ny\",\"ping\":65},{\"c\":\"us-va\",\"ping\":66},{\"c\":\"us-ct\",\"ping\":66},{\"c\":\"us-ma\",\"ping\":68},{\"c\":\"us-me\",\"ping\":68},{\"c\":\"us-fl\",\"ping\":72},{\"c\":\"cu\",\"ping\":73},{\"c\":\"bz\",\"ping\":74},{\"c\":\"gt\",\"ping\":76},{\"c\":\"bs\",\"ping\":77},{\"c\":\"sv\",\"ping\":79},{\"c\":\"hn\",\"ping\":80},{\"c\":\"ky\",\"ping\":80},{\"c\":\"ni\",\"ping\":84},{\"c\":\"bm\",\"ping\":85},{\"c\":\"jm\",\"ping\":87},{\"c\":\"tc\",\"ping\":89},{\"c\":\"ht\",\"ping\":92},{\"c\":\"do\",\"ping\":95},{\"c\":\"pr\",\"ping\":100},{\"c\":\"aw\",\"ping\":102},{\"c\":\"cw\",\"ping\":104}],\"BR\":[{\"c\":\"br\",\"ping\":15},{\"c\":\"py\",\"ping\":19},{\"c\":\"uy\",\"ping\":26},{\"c\":\"ar\",\"ping\":28},{\"c\":\"bo\",\"ping\":33},{\"c\":\"cl\",\"ping\":43},{\"c\":\"sr\",\"ping\":57},{\"c\":\"pe\",\"ping\":58},{\"c\":\"gy\",\"ping\":60},{\"c\":\"tt\",\"ping\":69},{\"c\":\"gd\",\"ping\":71},{\"c\":\"ec\",\"ping\":72},{\"c\":\"bb\",\"ping\":72},{\"c\":\"co\",\"ping\":72},{\"c\":\"ve\",\"ping\":73},{\"c\":\"vc\",\"ping\":73},{\"c\":\"cw\",\"ping\":77},{\"c\":\"aw\",\"ping\":79},{\"c\":\"pa\",\"ping\":85}],\"ASIA\":[{\"c\":\"jp\",\"ping\":1},{\"c\":\"kr\",\"ping\":19},{\"c\":\"kp\",\"ping\":21},{\"c\":\"cn\",\"ping\":35},{\"c\":\"tw\",\"ping\":35},{\"c\":\"gu\",\"ping\":42},{\"c\":\"hk\",\"ping\":48},{\"c\":\"ph\",\"ping\":50},{\"c\":\"mn\",\"ping\":50},{\"c\":\"pw\",\"ping\":53},{\"c\":\"vn\",\"ping\":61},{\"c\":\"la\",\"ping\":69},{\"c\":\"bn\",\"ping\":71},{\"c\":\"kh\",\"ping\":73},{\"c\":\"mm\",\"ping\":77},{\"c\":\"th\",\"ping\":77},{\"c\":\"bt\",\"ping\":80},{\"c\":\"bd\",\"ping\":81},{\"c\":\"pg\",\"ping\":85},{\"c\":\"tl\",\"ping\":86},{\"c\":\"np\",\"ping\":86},{\"c\":\"my\",\"ping\":89},{\"c\":\"sg\",\"ping\":89},{\"c\":\"kg\",\"ping\":92},{\"c\":\"kz\",\"ping\":93},{\"c\":\"id\",\"ping\":96},{\"c\":\"in\",\"ping\":97},{\"c\":\"pk\",\"ping\":100},{\"c\":\"uz\",\"ping\":100}],\"ME\":[{\"c\":\"qa\",\"ping\":1},{\"c\":\"bh\",\"ping\":2},{\"c\":\"ae\",\"ping\":5},{\"c\":\"sa\",\"ping\":8},{\"c\":\"kw\",\"ping\":10},{\"c\":\"om\",\"ping\":12},{\"c\":\"ir\",\"ping\":19},{\"c\":\"iq\",\"ping\":19},{\"c\":\"ye\",\"ping\":22},{\"c\":\"tm\",\"ping\":26},{\"c\":\"jo\",\"ping\":28},{\"c\":\"az\",\"ping\":28},{\"c\":\"sy\",\"ping\":29},{\"c\":\"il\",\"ping\":29},{\"c\":\"er\",\"ping\":29},{\"c\":\"lb\",\"ping\":30},{\"c\":\"am\",\"ping\":30},{\"c\":\"ps\",\"ping\":30},{\"c\":\"ge\",\"ping\":32},{\"c\":\"af\",\"ping\":33},{\"c\":\"eg\",\"ping\":34},{\"c\":\"cy\",\"ping\":34},{\"c\":\"tj\",\"ping\":36},{\"c\":\"pk\",\"ping\":38},{\"c\":\"sd\",\"ping\":38},{\"c\":\"tr\",\"ping\":40},{\"c\":\"uz\",\"ping\":40}],\"OCE\":[{\"c\":\"au\",\"ping\":4},{\"c\":\"nc\",\"ping\":33},{\"c\":\"nz\",\"ping\":37},{\"c\":\"vu\",\"ping\":41},{\"c\":\"pg\",\"ping\":46},{\"c\":\"sb\",\"ping\":48},{\"c\":\"fj\",\"ping\":54},{\"c\":\"tl\",\"ping\":64}]}");

// Every number sits at its country's pole of inaccessibility — the centre of the
// largest circle that fits inside the visible shape — so nothing lands in the sea
// or in a neighbour, and Russia's 60 sits in the middle of Russia. Four countries
// have no room for a number at all and get a badge out at sea with a line
// pointing home, the way the reference map does it.
/* Badges for the four too small to carry a number: the leader line runs from
   the country to a circle in open sea. The coordinates are pixels in the map's
   own projection, so when the frame grew east to Almaty on 19 August they all
   scaled by the ratio of the two longitude spans, 77/108. */
const CC_SERVER_CITY={
  ru:{EU:'Франкфурт', NAC:'Ашберн', NAW:'Санта-Клара', BR:'Сан-Паулу',
      ASIA:'Токио', ME:'Бахрейн', OCE:'Сидней'},
  en:{EU:'Frankfurt', NAC:'Ashburn', NAW:'Santa Clara', BR:'S\u00e3o Paulo',
      ASIA:'Tokyo', ME:'Bahrain', OCE:'Sydney'}
};
function ccServerCity(reg){
  const t=CC_SERVER_CITY[LANG]||CC_SERVER_CITY.en;
  return t[reg||ccCareerRegion()]||t.EU;
}
const CC_CALLOUT={lu:[251,443], ad:[279,543], mt:[374,630], cy:[523,626]};

/* The United States wears one flag, not fifty. The North America maps are drawn
   by state so a Californian and a New Yorker can pick their own milliseconds,
   but a state is a zone on the map, not a country — his rule, 20 August. So
   every us-* shape is filled from a single pattern stretched across the whole
   country: the stars and stripes run unbroken from coast to coast, and the
   state borders only cut it into the zones you click, each with its own number
   written on it and its own name in the tooltip. */
function ccUsFlagBox(M){
  if(M.__usBox!==undefined) return M.__usBox;
  let x0=Infinity, y0=Infinity, x1=-Infinity, y1=-Infinity;
  Object.keys(M.c).forEach(c=>{
    if(c.indexOf('us-')!==0) return;
    const o=M.c[c];
    x0=Math.min(x0,o.px); y0=Math.min(y0,o.py);
    x1=Math.max(x1,o.px+o.pw); y1=Math.max(y1,o.py+o.ph);
  });
  M.__usBox = x0===Infinity ? null : {px:x0, py:y0, pw:x1-x0, ph:y1-y0};
  return M.__usBox;
}

/* click — whose map this is. The creation screen picks a country to be from;
   the career's move screen picks a country to sit in. Same shapes, same flags,
   same numbers, so the two screens cannot disagree about what 26ms looks like —
   only the handler on top of it changes. */
function ccBuildMap(click, reg){
  const M=ccMapHere(reg);
  if(!M) return '<div class="cc-note">'+L().ccMapLoading+'</div>';
  let defs='', land='', shapes='', leads='', labels='';
  const usBox=ccUsFlagBox(M); let usDone=false;
  ccCountriesHere(reg).forEach(e=>{
    const o=M.c[e.c]; if(!o) return;
    const nm=ccCountryName(e.c);
    const state=!!usBox && e.c.indexOf('us-')===0;
    const fid=state ? 'ccf_us' : 'ccf_'+e.c;
    // The flag is stretched to the country's mainland box, not cropped to it —
    // a crop loses stripes, and on Russia it lost the white one off the top of
    // the frame. Stretching is what the reference map does anyway. For the
    // states the box is the country's, drawn once and shared by all of them.
    if(!state || !usDone){
      const b=state?usBox:o;
      defs+=`<pattern id="${fid}" patternUnits="userSpaceOnUse" `+
        `x="${b.px}" y="${b.py}" width="${b.pw}" height="${b.ph}">`+
        `<image href="flags/w320/${state?'us':e.c}.png" preserveAspectRatio="none" `+
        `x="0" y="0" width="${b.pw}" height="${b.ph}"/></pattern>`;
      if(state) usDone=true;
    }
    shapes+=`<path class="cc-mp" data-code="${e.c}" d="${o.d}" fill="url(#${fid})">`+
      `<title>${nm}: ${e.ping} ms</title></path>`;
    const call=(ccMapHere(reg)===CC_MAP) ? CC_CALLOUT[e.c] : null;
    const at=call||[o.cx,o.cy];
    // Size follows how much room the country actually has, not its bounding box.
    const fs2=call?13:Math.max(9,Math.min(26,7+o.r*0.38));
    if(call){
      leads+=`<line class="cc-lead" x1="${o.cx}" y1="${o.cy}" x2="${at[0]}" y2="${at[1]}"/>`+
        `<circle class="cc-badge" data-code="${e.c}" cx="${at[0]}" cy="${at[1]}" r="15"/>`;
    }
    labels+=`<text class="cc-num" data-code="${e.c}" x="${at[0]}" y="${at[1]}" `+
      `font-size="${fs2.toFixed(0)}">${e.ping}</text>`;
  });
  land=`<path class="cc-land" d="${M.land}"/>`;
  ccMapZoomWire();
  const t=L();
  return `<div class="cc-mapzoom">`+
    `<svg class="cc-map" viewBox="0 0 1000 ${M.H}" onclick="${click||'ccMapClick(event)'}">`+
    `<defs>${defs}</defs><rect class="cc-sea" x="0" y="0" width="1000" height="${M.H}"/>`+
    land+shapes+leads+labels+`</svg>`+
    `<div class="cc-zoomc">`+
      `<button type="button" title="${t.ccZoomIn}" aria-label="${t.ccZoomIn}" `+
        `onclick="ccMapZoomBtn(event,1.7)">+</button>`+
      `<button type="button" title="${t.ccZoomOut}" aria-label="${t.ccZoomOut}" `+
        `onclick="ccMapZoomBtn(event,1/1.7)">−</button>`+
      `<button type="button" title="${t.ccZoomReset}" aria-label="${t.ccZoomReset}" `+
        `onclick="ccMapZoomBtn(event,0)">⤢</button>`+
    `</div></div>`;
}

/* ---- Приблизить карту ------------------------------------------------------
 *
 * Просьба: Род-Айленд занимает четыре пикселя, а Делавэр и
 * того меньше — в исходном масштабе по ним не попасть и их число не прочесть.
 * Карта одна, поэтому приближает её сама карта: viewBox сужается вокруг точки,
 * на которую смотрят, а всё остальное — те же формы, те же флаги, тот же клик.
 * Ничего не перерисовывается, так что флаги с flagcdn не загружаются заново.
 */
const CC_ZOOM_MAX=12;
function ccMapVB(svg){
  if(!svg.__vb){
    const p=String(svg.getAttribute('viewBox')||'0 0 1000 700').trim().split(/\s+/).map(Number);
    svg.__vb={x:p[0], y:p[1], w:p[2], h:p[3], W:p[2], H:p[3]};
  }
  return svg.__vb;
}
// Одна дверь для всех изменений рамки: масштаб зажат между целой картой и
// CC_ZOOM_MAX, а сама рамка не выпускается за края — угол моря вместо страны
// никому не нужен.
function ccMapSet(svg, w, x, y){
  const vb=ccMapVB(svg);
  w=Math.min(vb.W, Math.max(vb.W/CC_ZOOM_MAX, w));
  const h=w*vb.H/vb.W;
  x=Math.min(vb.W-w, Math.max(0, x));
  y=Math.min(vb.H-h, Math.max(0, y));
  vb.w=w; vb.h=h; vb.x=x; vb.y=y;
  svg.setAttribute('viewBox', x.toFixed(2)+' '+y.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2));
  /* Число на стране нарисовано в координатах карты, поэтому приближение
     раздувало его вместе с ней: на четырёхкратном зуме 35 закрывало половину
     Пенсильвании. Пиксель на экране у цифры один и тот же на любом масштабе —
     размер шрифта и его обводка ужимаются ровно во столько, во сколько
     раздвинулась карта. Кегль каждой цифры свой, он посчитан по месту в
     стране, поэтому базовый читается с самого элемента и запоминается. */
  /* Компенсация не полная: при сильном приближении подписи, ужатые ровно во
     столько же, читались бы мельче самой карты. 0.7 в степени — цифра растёт
     примерно вполовину медленнее карты. */
  const k=Math.pow(w/vb.W, 0.7);
  svg.querySelectorAll('.cc-num').forEach(t=>{
    if(!t.__fs) t.__fs=+t.getAttribute('font-size')||12;
    t.style.fontSize=(t.__fs*k).toFixed(2)+'px';
    t.style.strokeWidth=(3.2*k).toFixed(2);
  });
  const box=svg.parentNode;
  if(box && box.classList) box.classList.toggle('cc-zoomed', w < vb.W-0.5);
}
// fx, fy — доля внутри рамки, которая должна остаться на месте: под курсором,
// между пальцами или в центре, если жали кнопку.
function ccMapZoomAt(svg, k, fx, fy){
  const vb=ccMapVB(svg);
  const px=vb.x+vb.w*fx, py=vb.y+vb.h*fy;
  const w=Math.min(vb.W, Math.max(vb.W/CC_ZOOM_MAX, vb.w/k));
  const h=w*vb.H/vb.W;
  ccMapSet(svg, w, px-w*fx, py-h*fy);
}
function ccMapZoomBtn(ev, k){
  ev.preventDefault(); ev.stopPropagation();
  const box=ev.target.closest('.cc-mapzoom');
  const svg=box && box.querySelector('.cc-map');
  if(!svg) return;
  if(!k){ const vb=ccMapVB(svg); ccMapSet(svg, vb.W, 0, 0); return; }
  ccMapZoomAt(svg, k, .5, .5);
}
/* Колесо, пальцы и перетаскивание — на документе, один раз: карта строится
   заново каждый раз, когда меняется регион или язык, и слушатели на самом svg
   пришлось бы вешать после каждой отрисовки. */
function ccMapZoomWire(){
  if(ccMapZoomWire.done) return; ccMapZoomWire.done=true;
  const mapOf=ev=>(ev.target && ev.target.closest) ? ev.target.closest('.cc-mapzoom .cc-map') : null;
  const frac=(svg,x,y)=>{ const r=svg.getBoundingClientRect();
    return [(x-r.left)/(r.width||1), (y-r.top)/(r.height||1)]; };
  document.addEventListener('wheel', ev=>{
    const svg=mapOf(ev); if(!svg) return;
    ev.preventDefault();
    const f=frac(svg, ev.clientX, ev.clientY);
    ccMapZoomAt(svg, ev.deltaY<0 ? 1.22 : 1/1.22, f[0], f[1]);
  }, {passive:false});

  let SVG=null, from=null;
  const PTS=new Map();
  const two=()=>{ const v=[...PTS.values()]; return [v[0], v[1]]; };
  document.addEventListener('pointerdown', ev=>{
    const svg=mapOf(ev); if(!svg) return;
    if(SVG!==svg){ PTS.clear(); SVG=svg; }
    PTS.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    const vb=ccMapVB(svg);
    if(PTS.size===1){
      svg.__moved=false;
      from={x:vb.x, y:vb.y, cx:ev.clientX, cy:ev.clientY};
    }else if(PTS.size===2){
      const [a,b]=two();
      // Щипок начался — клика больше не будет, чем бы он ни кончился.
      svg.__moved=true;
      from={pinch:Math.max(1, Math.hypot(a.x-b.x, a.y-b.y)), w:vb.w, x:vb.x, y:vb.y};
    }
  });
  document.addEventListener('pointermove', ev=>{
    if(!SVG || !PTS.has(ev.pointerId)) return;
    PTS.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    const svg=SVG, vb=ccMapVB(svg);
    if(PTS.size>=2 && from && from.pinch){
      const [a,b]=two();
      const d=Math.max(1, Math.hypot(a.x-b.x, a.y-b.y));
      const f=frac(svg, (a.x+b.x)/2, (a.y+b.y)/2);
      const w=Math.min(vb.W, Math.max(vb.W/CC_ZOOM_MAX, from.w*from.pinch/d));
      const px=from.x+from.w*f[0], py=from.y+from.w*vb.H/vb.W*f[1];
      ccMapSet(svg, w, px-w*f[0], py-w*vb.H/vb.W*f[1]);
      return;
    }
    if(!from || from.pinch) return;
    const dx=ev.clientX-from.cx, dy=ev.clientY-from.cy;
    if(Math.abs(dx)+Math.abs(dy) > 4){
      svg.__moved=true;
      if(svg.parentNode && svg.parentNode.classList) svg.parentNode.classList.add('cc-drag');
    }
    if(vb.w >= vb.W-0.5) return;      // целая карта никуда не едет
    const r=svg.getBoundingClientRect();
    ccMapSet(svg, vb.w, from.x-dx/(r.width||1)*vb.w, from.y-dy/(r.height||1)*vb.h);
  });
  const up=ev=>{
    if(!SVG) return;
    PTS.delete(ev.pointerId);
    if(SVG.parentNode && SVG.parentNode.classList) SVG.parentNode.classList.remove('cc-drag');
    if(!PTS.size) from=null;
  };
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
}
// Тащили карту — значит не выбирали страну: клик после перетаскивания менял бы
// страну каждый раз, когда её просто подвинули под курсор.
function ccMapDragged(ev){
  const svg=(ev.target && ev.target.closest) ? ev.target.closest('.cc-map') : null;
  if(svg && svg.__moved){ svg.__moved=false; return true; }
  return false;
}

function ccMapClick(ev){
  if(ccMapDragged(ev)) return;
  const el=ev.target.closest('[data-code]');
  if(el) ccPickCountry(el.getAttribute('data-code'));
}

// Selection and search are painted onto the existing SVG rather than rebuilding
// it — redrawing would make the browser re-fetch all 45 flags.
function ccPaintMap(){
  const svg=document.querySelector('#ccGrid .cc-map'); if(!svg) return;
  const q=(document.getElementById('ccSearch').value||'').trim().toLowerCase();
  svg.querySelectorAll('[data-code]').forEach(el=>{
    const c=el.getAttribute('data-code');
    const hit=!q || ccCountryName(c).toLowerCase().includes(q) || c.includes(q);
    el.classList.toggle('on', c===CC.country);
    el.classList.toggle('off', !hit);
  });
}

/* A save with no country used to take the whole hub down with it: this read
   code.toUpperCase() with no guard, careerRenderHub died on its first line, and
   the career became unopenable. The creation screen gates the start button on a
   country so it cannot be made that way now, but an older or migrated save can
   still carry none, and losing a career to a missing string is not a trade
   anybody would take. */
function ccCountryName(code){
  if(!code) return '';
  return (CC_NAMES[LANG]||CC_NAMES.en)[code]
      || (CC_REGION_NAMES[LANG]||CC_REGION_NAMES.en)[code]
      || String(code).toUpperCase();
}
// The countries a career can be born in, and what each one costs in latency.
function ccCountriesHere(reg){
  const r=reg || ccCareerRegion();
  return (r==='EU' ? CC_COUNTRIES : CC_REGION_PINGS[r]) || CC_COUNTRIES;
}
function ccMapHere(reg){
  if(!CC_MAP) return null;
  const r=reg || ccCareerRegion();
  const key=CC_MAP_FOR[r];
  return key ? CC_REGION_MAPS[key] : CC_MAP;
}
function ccPingOf(code, reg){
  const e=ccCountriesHere(reg).find(x=>x.c===code);
  return e?e.ping:null;
}

// Ping is an edge you earn, not a fine you pay. A good connection is worth up to
// six points of close-range strength; a bad one is worth less of it, down to
// nothing. Nobody is ever pushed below the field for where they live — the worst
// country on the map simply gets no head start.
//
// The curve is bent rather than straight. Everything up to about 25 ms is the
// same game — the whole of western and central Europe — so a German gets no more
// than a Dane, and the edge only starts falling away where the distance is real.
//
//   Germany   1 ms  +6.0      Moscow    60 ms  +3.9
//   Britain  32 ms  +5.8      Georgia   82 ms  +1.6
//   Spain    45 ms  +5.1      Baku      89 ms  +0.8
// Age, and it is a different axis from ping. Ping only decides fights; age
// decides everything — reactions, and holding a level across eleven games in a
// night — so it moves the whole power number rather than just the close-range
// one.
//
// Full value to twenty, because that is what the scene looks like: FNCS is won
// by teenagers. Then a slow slide to thirty, and from thirty a straight 0.6 a
// year down to -4 at forty.
//
// Past forty it stops being a slide. Each further year multiplies what the last
// one cost, so the decline compounds the way an ageing player's actually does —
// a year at forty-one is not the same year as one at twenty-five. The floor
// exists only so a typo cannot produce nonsense.
//
//   13-20  +4.0     30  +2.0     40  -4.0     43   -8.8
//   25     +3.0     36  -1.6     41  -5.2     45  -14.9
const CC_AGE_EDGE=4, CC_AGE_PEAK=20, CC_AGE_FADE=30, CC_AGE_PER_YEAR=0.6;
const CC_AGE_CLIFF=40, CC_AGE_RATIO=1.3, CC_AGE_FLOOR=-20;
/* Ping and age edges are on, but only a created card carries _ageEdge/_pingEdge
   (careerCard sets them off the save, the creation screen on the preview). Roster
   cards have neither, so closeRangeEdge and ageEdgeOf add nothing for them.
   Curve check: 13-20 +4, 25 +3, 30 +2, 36 -1.6, 40 -4, steeper past forty.
   The ladder calibration assumes an edgeless duo, so a career on a good connection
   climbs faster than that table; re-measure the arc with the edge on. */
function ccAgeEdge(age){
  const a=Number(age);
  if(!(a>0)) return 0;
  if(a<=CC_AGE_PEAK) return CC_AGE_EDGE;
  // Twenty to thirty: the edge halves, a fifth of a point a year.
  if(a<=CC_AGE_FADE)
    return Math.round((CC_AGE_EDGE-(a-CC_AGE_PEAK)*(CC_AGE_EDGE/2)/(CC_AGE_FADE-CC_AGE_PEAK))*10)/10;
  // Thirty to forty: a flat 0.6 a year, straight through zero.
  const at30=CC_AGE_EDGE/2;
  if(a<=CC_AGE_CLIFF)
    return Math.round((at30-(a-CC_AGE_FADE)*CC_AGE_PER_YEAR)*10)/10;
  // Past forty it compounds: the first year costs twice the flat rate and each
  // one after multiplies by CC_AGE_RATIO.
  let v=at30-(CC_AGE_CLIFF-CC_AGE_FADE)*CC_AGE_PER_YEAR, step=CC_AGE_PER_YEAR*2;
  for(let y=CC_AGE_CLIFF+1; y<=a && v>CC_AGE_FLOOR; y++){ v-=step; step*=CC_AGE_RATIO; }
  return Math.round(Math.max(CC_AGE_FLOOR, v)*10)/10;
}

/* Ping, the same way: the country picks the number and the number decides the
   close fights. Free up to 25ms — a European on a European server is not
   fighting the connection — and worth nothing at all by 95, with the fall
   bending rather than running straight, because the difference between 30 and
   40 is felt and the difference between 80 and 90 is not. */
/* Anchors 14 and 57 rebased to the ping table (60 km per ms, from the server, Europe 3..91 ms; old table 13..148).
   Picked so each country keeps its old edge: Germany 7ms +6.0, Britain 11ms +6.0, Spain 24ms +5.3,
   Russia 34ms +4.1 (was 3.7), Georgia 49ms +1.6, Saudi 72ms +0.0. Total drift 1.2, mostly Azerbaijan.
   Without moving both anchors the smaller scale would have handed everyone a free edge. */
const CC_PING_FREE=14, CC_PING_MAX=57, CC_PING_EDGE=6, CC_PING_BEND=1.5;
function ccPingEdge(ms){
  // No ping is not a ping of zero: a card nobody measured gets nothing, and
  // Number(null) is 0, which would have handed it the full edge.
  if(ms==null || ms==='') return 0;
  const v=Number(ms);
  if(!(v>=0)) return 0;
  const t=clamp((v-CC_PING_FREE)/(CC_PING_MAX-CC_PING_FREE), 0, 1);
  return Math.round(CC_PING_EDGE*(1-Math.pow(t, CC_PING_BEND))*10)/10;
}

// What a division is worth on the card. Choosing a division is choosing how much
// of the ladder you want to climb, so it sets the starting rating rather than
// being set by it — and the bands line up with ccDivisionFor, so an existing
// card taken at 82 lands in Division 2 exactly where a rookie who picked
// Division 2 starts.
//
// Division 1 used to start at 90 — legendary, and with a good country and a young
// age the card read 100 before playing a game, which is the best player in Europe.
// That was wrong about what Division 1 is. Everybody who plays a Major Play-In is
// in Division 1, thousands of them, and hardly any hold a gold card. Division 1 is
// where the good players are, not where the best ones are.
//
// So the whole ladder drops and Division 1 tops out epic instead of legendary. A
// thirteen-year-old German starting there now reads 92 rather than 100 — still the
// ideal profile in EU, which is honest, but no longer the finished article.
//
// This costs the one-colour-per-rung property: there are only four bands below
// legendary, so Divisions 3 and 4 share green. Being right about the ladder beats
// being tidy about the palette.
/* Полоса рунга: шаг 7 на рунг (см. CC_DUO_BEHIND), верх 82. От ccBand(1) же
   считаются потолок Д2, классификация карточки и потолок генерации.
   Измеренная комната Д1 (квалификация через Плей-Ин/Ласт Ченс, сезонный рейтинг)
   читается 78, медиана 77, максимум 97, но 78 сюда не ставить: Д2 прижимается к Д1
   (разрыв 2 вместо 7), ловит check-career-divisions. Число комнаты живёт в окнах
   check-career-field и check-career-pools, не здесь. */
const CC_DIV_RATING={1:82, 2:75, 3:68, 4:61, 5:54};
/* Сколько ступеней у региона. У Epic дивизионные капы 4 и 5 идут только в
   Европе и NA Central — в остальных пяти регионах лестница кончается третьим
   (проверено по id событий: 177 капов в архиве Tracker, D1-D3 везде, D4-D5
   только EU и NAC). */
const CC_DIV_DEEP=['EU','NAC'];
function ccDivCount(reg){
  const r=reg || (typeof ccCareerRegion==='function' ? ccCareerRegion() : 'EU');
  // 2023-й: Elite, Contender, Challenger — три везде.
  if(typeof ccIs2023==='function' && (ccIs2023() || ccIs2022())) return 3;
  /* 2025-й: трио-лестница FNCS (S33–S37) — Д1–Д3 во всех семи регионах, FNCS Trial садил только в них
     (его слово 23.10: «делай как в фортнайте 25 год»). Д4–Д5 у Epic появились с дуо-капами S37 и в 2026-м. */
  if(typeof ccIs2025==='function' && ccIs2025()) return 3;
  return CC_DIV_DEEP.indexOf(r)>=0 ? 5 : 3;
}
/* Три ступени держат ту же полосу, что и пять: верх остаётся верхом, низ —
   входом. Отрезать 4 и 5 было нельзя: тогда третий дивизион Мидл Иста стал бы
   на четырнадцать очков выше входа, то есть вход в карьеру там оказался бы
   сильнее, чем в Европе. Решение проекта. */
const CC_DIV_RATING_3={1:82, 2:68, 3:54};
function ccDivShift(reg){
  const r=reg || (typeof ccCareerRegion==='function' ? ccCareerRegion() : 'EU');
  const top=REGION_TOP[r];
  return (top==null ? 0 : top-REGION_TOP.EU);
}
// Every band in the mode reads through here, so a region's ladder is its own.
function ccBand(div, reg){
  const tbl=ccDivCount(reg)===3 ? CC_DIV_RATING_3 : CC_DIV_RATING;
  return (tbl[div]||54)+ccDivShift(reg);
}
// And the line nothing invented may cross moves with it: a generated 80 in
// Oceania would be a name at the top of the region, which is the same thing
// CC_GEN_TOP exists to stop in Europe.
function ccGenTop(reg){ return CC_GEN_TOP+ccDivShift(reg); }

// Role is a choice here, but the game reads it off the attributes — roleFromProfile
// compares aim/clutch/consistency against endgame/survival. So picking a role tilts
// the six numbers, and the tilt is what makes the role true. Experience starts low
// whatever you pick: a rookie has none, and the weighted mean is pulled back to the
// division's rating afterwards so the choice costs nothing in overall.
function ccRookieAttrs(rating, roleKey){
  const frg = roleKey==='roleFRG';
  const tilt = frg ? {aim:7, clu:6, con:4, end:-6, sur:-6, exp:-12}
                   : {aim:-6, clu:-5, con:-2, end:7, sur:7, exp:-12};
  const a={};
  ATTR_KEYS.forEach(k=>{ a[k]=clamp(rating+tilt[k], 35, 99); });
  const mean=()=>Math.round(ATTR_KEYS.reduce((s,k)=>s+a[k]*ATTR_W[k],0));
  let guard=0;
  while(mean()!==rating && guard++<40){
    const gap=rating-mean();
    ATTR_KEYS.forEach(k=>{ a[k]=clamp(Math.round(a[k]+gap), 35, 99); });
  }
  a.ovr=mean();
  // attrsFor only derives these on cards it has to lift, and a rookie is built
  // at its target already, so it returns before touching them. Set them here or
  // the card has no role at all — which is the whole point of choosing one.
  a.roleKey=roleFromProfile(a);
  a.bestAttr=bestPlayAttr(a);
  return a;
}

/* The player's own six, from the card they are actually playing.

   A built player carries them in the save from the day they were made. A taken
   card does not: its shape is the roster's, derived by attrsFor from the real
   standings and scaled onto whatever the career is rated today. So the first
   time one trains, the shape is copied out of the card and becomes theirs —
   which is what training a real player ought to mean anyway. From that day the
   six are the career's own rather than a record of somebody's season. */
function ccOwnAttrs(){
  const pl=CAREER.player;
  // raw: the player without the desk. See the gear note in careerCard.
  const c=careerCard(true), a=c?attrsFor(c):null;
  if(!a) return ccRookieAttrs(Math.round(pl.ovr), pl.role);
  const out={};
  ATTR_KEYS.forEach(k=>{ out[k]=a[k]; });
  out.ovr=Math.round(ATTR_KEYS.reduce((s,k)=>s+out[k]*ATTR_W[k],0));
  out.roleKey=a.roleKey; out.bestAttr=a.bestAttr;
  return out;
}

/* ---- Сменить роль посреди карьеры -----------------------------------------
   Сюда ходят все смены роли: кнопка в карьере, уход напарника с пересадкой и
   ссора. Роль это перекос профиля, а не уровень: шесть чисел сдвигаются на
   половину расстояния между шаблонами фраггера и IGL, рейтинг остаётся прежним.
   У настоящего игрока сдвигаются его собственные числа, шаблон не подставляется.
   Если своих чисел ещё нет, форма копируется с карточки, как при первой тренировке. */
const CC_ROLE_TILT={aim:6.5, clu:5.5, con:3, end:-6.5, sur:-6.5, exp:0};
// Роль, которой карьера играет сегодня: выбранная, если её выбирали, иначе та,
// что читается с карточки — настоящая у настоящего игрока, выведенная из шести
// чисел у построенного.
function ccRoleNow(){
  const pl=CAREER && CAREER.player;
  if(!pl) return null;
  if(pl.role) return pl.role;
  const c=careerCard(), a=c?attrsFor(c):null;
  return a ? a.roleKey : null;
}
function ccRoleOther(k){ return k==='roleFRG' ? 'roleIGL' : 'roleFRG'; }
function ccRoleSwitch(want){
  const pl=CAREER && CAREER.player;
  if(!pl || !want || want===ccRoleNow()) return false;
  const base=pl.attrs || ccOwnAttrs();
  const rating=Math.round(base.ovr!=null ? base.ovr
    : ATTR_KEYS.reduce((s,k)=>s+base[k]*ATTR_W[k],0));
  const sign=want==='roleFRG' ? 1 : -1;
  const out={};
  ATTR_KEYS.forEach(k=>{ out[k]=clamp(Math.round(base[k]+sign*(CC_ROLE_TILT[k]||0)), 35, 99); });
  const mean=()=>Math.round(ATTR_KEYS.reduce((s,k)=>s+out[k]*ATTR_W[k],0));
  let guard=0;
  while(mean()!==rating && guard++<40){
    const gap=rating-mean();
    ATTR_KEYS.forEach(k=>{ out[k]=clamp(Math.round(out[k]+gap), 35, 99); });
  }
  out.ovr=mean();
  out.roleKey=want;
  out.bestAttr=bestPlayAttr(out);
  pl.attrs=out;
  pl.role=want;
  // День смены — от него считается пауза до следующей (ccRoleCooldown).
  try{ if(CAREER.career) CAREER.career.roleDay=careerToday(); }catch(e){}
  return true;
}
/* РОЛЬ НЕ МЕНЯЮТ ТУДА-СЮДА (его слово 7.10: «просто так можно бесконечно спамить и роли»): сменил — следующая смена
   через CC_ROLE_SWAP_DAYS. Смена при подписании (двое одной роли) идёт своей дорогой и не запрещается, но паузу
   тоже ставит. Сколько дней осталось — 0, если можно. */
const CC_ROLE_SWAP_DAYS=14;
function ccRoleCooldown(){
  const d=CAREER && CAREER.career && CAREER.career.roleDay;
  if(!d) return 0;
  return Math.max(0, CC_ROLE_SWAP_DAYS-ccDaysBetween(d, careerToday()));
}
/* ---- Один ИГЛ на команду ---------------------------------------------------
 *
 * Правило: в команде всегда есть ИГЛ, и он один. Дуо — ИГЛ и
 * фраггер, трио — ИГЛ и два фраггера. Двух ИГЛов не бывает, команды без ИГЛа
 * не бывает тоже.
 *
 * Отсюда всё остальное: поиск предлагает только ту роль, которой не хватает;
 * выдуманные команды в лобби собираются по тому же правилу; и своя роль
 * меняется только тогда, когда после смены состав остаётся правильным — то
 * есть пока место рядом свободно. В собранном дуо кнопка гаснет: ты фраггер, а
 * рядом ИГЛ, и пересесть значит оставить команду с двумя ИГЛами.
 */
function ccSquadRoleFits(roles, seats){
  const igl=roles.filter(r=>r==='roleIGL').length;
  /* ИГЛ не больше одного — но и без него команда бывает (Notion «19.10», игрок: «сделай возможность играть с двумя
     или тремя фрагерами»; его: «пусть дают меньше силы, по логике так и должно быть»). Меньше силы уже есть:
     +ROLE_BONUS_STEP платится только составу ровно с одним ИГЛом (buildTeam), по данным гранд-финалов. */
  return igl<=1;
}
// Роли занятых мест: своя первой, дальше те, кто уже сидит рядом.
function ccSquadRoles(){
  const mine=ccRoleNow();
  const rest=careerMates().map(m=>attrsFor(m).roleKey).filter(Boolean);
  return (mine ? [mine] : []).concat(rest);
}
/* Какой роли команде не хватает, если искать ещё одного человека. null — можно
   брать любого: мест хватает на обе.

   seat — место, из-под которого открыли поиск: его сидельца считают уже
   ушедшим, потому что его и меняют. null — «любое свободное». */
function ccSeatRoleWanted(seat){
  const seats=careerSquadSize();
  const mine=ccRoleNow();
  // Кто уходит, тот уже не в составе: просить кого-то в собранную команду —
  // значит просить вместо кого-то. См. ccSeatLeaving, тот же ответ, что у
  // careerMateSeat, поэтому список и посадка не могут разойтись.
  const outAt=ccSeatLeaving(typeof seat==='number' ? seat : null);
  const roles=(mine ? [mine] : []).concat(
    careerMates().map((m,i)=>i===outAt ? null : attrsFor(m).roleKey).filter(Boolean));
  const free=seats-roles.length;
  if(free<=0) return null;
  if(roles.indexOf('roleIGL')>=0) return 'roleFRG';   // ИГЛ уже есть — только фраггеры
  return null;   // без ИГЛа можно (фраггеры без +4 за роли, см. ccSquadRoleFits) — подойдёт любой
}
function ccSquadRoleWanted(){ return ccSeatRoleWanted(null); }
// Какую роль показать первой (не запрет): обязательная, а без ИГЛа в составе — ИГЛ, он даёт +4 за роли.
function ccSeatRolePreferred(seat){
  const w=ccSeatRoleWanted(seat); if(w) return w;
  return ccSquadRoles().indexOf('roleIGL')<0 ? 'roleIGL' : null;
}
/* Чьё место освободится, если сесть сюда. То же правило, по которому сажает
   careerMateSeat: названное кресло — это оно, безымянная просьба — слабейший из
   сидящих, а если место свободно, никто не уходит вовсе. Роли считаются по
   этому же ответу, иначе состав проверялся бы против человека, который остаётся
   сидеть. */
function ccSeatLeaving(seat){
  const mates=careerMates();
  if(mates.length<careerMateSeats()) return -1;
  if(typeof seat==='number' && seat>=0 && seat<mates.length) return seat;
  let at=0, low=Infinity;
  mates.forEach((m,i)=>{ const o=(attrsFor(m)||{}).ovr; if(o<low){ low=o; at=i; } });
  return at;
}
/* Кого пересадить вместе с тобой при смене роли. Правило «один ИГЛ» запирало состав: ИГЛ не мог стать фраггером
   (команда без ИГЛа), а взять ИГЛа вместо фраггера не давал тот же счёт, кнопка гасла на dmRoleClash.
   Роль настоящего игрока посчитана по его результатам, её не трогаем. Выдуманный сосед пересаживается, и
   ccCastLadderRole пересобирает его статы. Кого двигать, решает та же прикидка, что в ccSquadCastRoles. */
/* Кто пересядет вместе с тобой — и настоящий игрок тоже.
 *
 * Здесь стояло `c.tier!=='ladder'` — то есть двигать мод соглашался только
 * выдуманного соседа. С настоящим кнопка просто гасла, и правку —
 * «предложить игроку, с которым ты играешь, сменить роль» — выполнить было
 * нечем.
 *
 * Односторонней пересадки при этом не бывает вовсе: ccSquadRoleFits держит
 * ровно одного ИГЛа, так что уйти из роли можно только отдав её. Любая смена
 * роли — обмен, и «предложить сменить роль» — это и есть вторая половина
 * твоей собственной. Поэтому настоящий сюда попадает, но помеченным: молча его
 * не пересаживают, у него спрашивают. См. careerRoleSwap. */
function ccRoleSwapMate(want){
  const recs=careerMateRecords();
  const need=want==='roleIGL' ? 'roleFRG' : 'roleIGL';
  const able=[];
  recs.forEach((pr,i)=>{
    const c=ccMateCardOf(pr);
    if(!c) return;
    const now=(attrsFor(c)||{}).roleKey;
    if(now===need) return;
    able.push({at:i, card:c, lean:ccRoleLean(c), real:c.tier!=='ladder'});
  });
  if(!able.length) return null;
  /* В ИГЛы — самого «оборонительного», во фраггеры — самого «стреляющего»; и
     выдуманного раньше настоящего, потому что выдуманного не надо уговаривать,
     а состав он держит так же. */
  able.sort((a,b)=>(a.real?1:0)-(b.real?1:0) ||
                   (need==='roleIGL' ? b.lean-a.lean : a.lean-b.lean));
  const pick=able[0];
  /* Напарник без карточки (после смены региона запись ещё старая) — пропуск,
     как в проходе выше; attrsFor(null) ронял весь экран карьеры. */
  const after=[want].concat(recs.map((pr,i)=>{
    if(i===pick.at) return need;
    const c=ccMateCardOf(pr);
    return c ? (attrsFor(c)||{}).roleKey : null;
  }).filter(Boolean));
  return ccSquadRoleFits(after, careerSquadSize())
    ? {at:pick.at, want:need, real:pick.real, card:pick.card} : null;
}
// Можно ли пересесть самому. Возвращает причину отказа, чтобы кнопка могла её
// сказать, а не просто погаснуть.
function ccRoleSwapCan(){
  const cool=ccRoleCooldown();
  if(cool>0) return {ok:false, want:ccRoleOther(ccRoleNow()), why:'cool', days:cool};
  const want=ccRoleOther(ccRoleNow());
  const roles=ccSquadRoles();
  if(!roles.length) return {ok:false, why:null};
  const after=[want].concat(roles.slice(1));
  const fits=ccSquadRoleFits(after, careerSquadSize());
  // Уйти из ИГЛов в полной команде — сначала предложить роль напарнику (так команда держит +4 за роли); некому — можно
  // остаться и без ИГЛа (фраггеры, Notion «19.10»).
  const leavesNoIgl=fits && after.length>=careerSquadSize() && after.indexOf('roleIGL')<0;
  if(fits && !leavesNoIgl) return {ok:true, want:want};
  const move=ccRoleSwapMate(want);
  if(move) return {ok:true, want:want, move:move};
  if(fits) return {ok:true, want:want};
  return {ok:false, want:want,
          why: after.filter(r=>r==='roleIGL').length>1 ? 'two' : 'none'};
}
// Кнопка в карьере. Ролей две, поэтому спрашивать «какую» не о чем — кнопка
// называет ту, в которую переходят, и переводит в неё.
function careerRoleSwap(){
  const can=ccRoleSwapCan();
  if(!can.ok) return;
  /* Настоящего игрока не пересаживают, у него спрашивают — и спрашивают до
     того, как пересесть самому. Иначе отказ оставлял бы команду без ИГЛа: ты
     уже ушёл из роли, а он в неё не сел. Спросил, услышал «нет» — не двинулся
     никто, и это единственный честный порядок. */
  if(can.move && can.move.real){
    const odds=careerMateRoleOdds(can.move.at, can.move.want);
    const who=(can.move.card||{}).handle||'', role=L()[can.move.want]||'';
    if(!odds || !odds.yes){
      careerNews('flat', 'ccNewsRoleNo', [who, role]);
      careerRenderHub();
      return;
    }
    careerNews('good', 'ccNewsRoleYes', [who, role]);
    careerEvent('tlRoleMoved', [who, role]);
  }
  if(!ccRoleSwitch(can.want)) return;
  /* Роль соседа живёт на его записи, а не на карточке: ccMateLift собирает
     карточку заново на каждый развитый рейтинг и стирает с неё _attrs, так что
     пересадка, записанная в карточку, не пережила бы ни одного турнира. */
  if(can.move){
    const pr=careerMateRecords()[can.move.at];
    if(pr){
      pr.role=can.move.want;
      const c=ccMateCardOf(pr);
      if(c && !can.move.real)
        careerNews('flat', 'ccNewsRoleMoved', [c.handle, L()[can.move.want]||'']);
    }
  }
  careerSave();
  /* Роль в команде значит больше, чем в одиночной: по ней разделены вопросы
     вечера (CC_MP_WHO) и по ней же стоит запрет на двух иглов (ccMpRolesWhy).
     Значит напарник должен увидеть новую роль сразу, а не перед вечером. */
  if(ccMpOn() && typeof MP!=='undefined' && MP.sendCard) MP.sendCard();
  careerRenderHub();
}

/* Просьба к напарнику сменить роль.
   ccSquadRoleFits держит в команде ровно одного ИГЛа, так что смена роли всегда обмен: просьба не отдельная кнопка, а вторая половина своей.
   Жмёшь «стать фраггером»: если рядом живой игрок, сначала спрашиваем его, бота пересаживаем молча. */
// Наклон карточки: положительный — человек и так играет ближе к вызову, чем к
// перестрелке. Те же четыре стата, что читает ccSquadCastRoles, когда ищет,
// кому звать.
function ccRoleLean(c){
  const a=attrsFor(c)||{};
  return (a.end+a.sur)/2-(a.aim+a.clu)/2;
}
/* Согласится ли он. Порог 50 (с него careerMoodKey перестаёт считать недовольным),
   каждый пункт наклона профиля в сторону просьбы двигает его на 4 вниз, против
   на 4 вверх; сравниваем с терпением rec.patience. Без броска нарочно: повторный
   вопрос в тот же день даёт тот же ответ, меняется он вместе с делами команды. */
function careerMateRoleOdds(at, want){
  const rec=careerMateRecords()[at], card=careerMates()[at];
  if(!rec || !card || !want) return null;
  const pat=rec.patience!=null ? rec.patience : CAREER_PATIENCE_START;
  const lean=ccRoleLean(card)*(want==="roleIGL" ? 1 : -1);
  const need=clamp(Math.round(50-lean*4), 5, 95);
  return {want:want, card:card, rec:rec, patience:pat, need:need,
          yes:pat>=need, lean:Math.round(lean*10)/10};
}

// flagImg keys on the roster's Russian country names. Our map keys on ISO codes,
// and a dozen of them — Montenegro, Iceland, Azerbaijan — never appear in the
// roster, so they have no name to look up. Fill the gaps once, using the map's
// own names, and every flag on the card works.
const CC_NAT_BY_CODE={};
(function(){
  Object.entries(FLAG_CODE).forEach(([nat,code])=>{ if(!CC_NAT_BY_CODE[code]) CC_NAT_BY_CODE[code]=nat; });
  Object.keys(CC_NAMES.ru).forEach(code=>{
    if(CC_NAT_BY_CODE[code]) return;
    const nat=CC_NAMES.ru[code];
    FLAG_CODE[nat]=code; CC_NAT_BY_CODE[code]=nat;
  });
})();
/* A state has a flag nowhere but on flagcdn, and the mode has no use for it:
   click California and the card, the bio and the move panel all fly the United
   States, because a state is a connection and not a nationality. The lookup is
   the country's, so `us-ca` finds "США" instead of finding nothing — which is
   what it found before, and why a career started in California wore no flag
   at all. */
function ccNatOf(code){ return CC_NAT_BY_CODE[ccCountryOf(code)]||null; }

// The rookie as the rest of the game sees them: a card object. _attrs short-
// circuits the leaderboard-derived builder, and _targetOvr stops attrsFor from
// lifting the card if the chosen nickname happens to match a real player in the
// rating floor table.
function ccMakePlayer(){
  // No stand-in name. An unnamed card is blank, and the portrait monogram falls
  // back to a question mark on its own — inventing a nickname would put a word
  // on the card that the player never chose.
  const nick=(document.getElementById('ccNick').value||'').trim();
  const band=ccBand(CC.div, CC.region);
  const a=ccRookieAttrs(band, CC.role);
  // Стартовые очки видны уже здесь: карточка-превью носит те же статы и тот же
  // овер, что лягут в сейв, — клик по «+ AIM» меняет её сразу.
  const rating=ccSpaApply(a);
  return {
    handle:nick, nat:ccNatOf(CC.country), region:CC.region||'EU', org:null,
    _pingEdge: ccNoEdgeNow() ? 0 : ccPingEdge(CC.country ? ccPingOf(CC.country, CC.region) : null),
    _ageEdge: ccNoEdgeNow() ? 0 : ccAgeEdge(parseInt(document.getElementById('ccAge').value,10)),
    _age: parseInt(document.getElementById('ccAge').value,10),
    _pingMs: CC.country ? ccPingOf(CC.country, CC.region) : null,
    tier:'ranked', event:L().ccDivEvent.replace('{N}', CC.div), placement:null,
    rating, _targetOvr:rating, _attrs:a, _photo:CC.photo||null
  };
}

const CC={mode:'rookie', country:null, photo:null, card:null, role:'roleFRG', div:5, region:'EU', born:null, sex:'m', year:2026};
/* Пол — его пункт 1 со страницы «ы», 22 августа. Выбор есть у построенного
   игрока; у взятой карточки это факт о человеке, как возраст, и кнопки
   закрыты (ростер FNCS — мужчины, вопрос не встаёт). Хранится 'm'|'f' на
   pl.sex; старые сейвы без поля читаются как 'm', и это ничего не меняет. */
function ccSexPick(s){
  if(CC.card) return;
  CC.sex = s==='f' ? 'f' : 'm';
  ccSexRender();
}
function ccSexRender(){
  const m=document.getElementById('ccSexM'), f=document.getElementById('ccSexF');
  if(!m || !f) return;
  m.classList.toggle('on', CC.sex!=='f');
  f.classList.toggle('on', CC.sex==='f');
  m.disabled=f.disabled=!!CC.card;
  m.style.opacity=f.style.opacity=CC.card?'0.45':'';
}
// Род для строк, которым он нужен грамматикой. Без карьеры — мужской.
function ccPlayerFem(){ return !!(CAREER && CAREER.player && CAREER.player.sex==='f'); }

function openCareerCreate(){
  try{ ccBindsPaint(); }catch(e){}
  CC_MAP_OPEN=false;
  show('screen-career-create');
  // Что здесь заводится — одиночная карьера или половина команды. См. CC_MP_NEW.
  ccMpNoteDraw();
  ccBornBounds();
  // По ссылке хозяина — его год и регион, остальные чипы заперты (ccMpLockedYear/Region).
  if(ccMpLockedYear()) CC.year=ccMpLockedYear();
  if(ccMpLockedRegion()) CC.region=ccMpLockedRegion();
  ccSetMode('rookie');
  ccRenderRegions();
  ccRenderChips();
  ccRenderCard();
}

function ccSetMode(m){
  /* Вкладка «Свои статы до 99» — тот же новичок, только статы без бюджета (CC.spaFree). */
  const freeTab = m==='free'; if(freeTab) m='rookie';
  if(!!CC.spaFree!==freeTab){ CC.spaFree=freeTab; CC.spa={}; CC.spaAbs={}; }
  // Hold the page still across the swap: the two panels are different heights, and
  // a browser reflowing under you looks like the screen jumped.
  const keep=window.scrollY;
  CC.mode=m; CC.card=null;
  // Every region has a map now, so building a player no longer drags the
  // choice back to Europe — it keeps whichever region is being looked at.
  if(!CC.region) CC.region='EU';
  ccSexRender();
  ccRenderRegions();
  document.getElementById('ccTabRookie').classList.toggle('on', m==='rookie' && !freeTab);
  const tf=document.getElementById('ccTabFree');
  if(tf) tf.classList.toggle('on', freeTab);
  document.getElementById('ccTabCard').classList.toggle('on', m==='card');
  const tc=document.getElementById('ccTabCreator');
  if(tc) tc.classList.toggle('on', m==='creator');
  CC.creator=null;
  const s=document.getElementById('ccSearch');
  s.value='';
  s.placeholder = m==='rookie' ? L().ccSearchCountry
                : m==='creator' ? L().ccSearchCreator : L().ccSearchCard;
  if(m==='rookie'){
    document.getElementById('ccNick').value='';
    document.getElementById('ccAge').value='16';
    ccBornSet(null);
    CC.photo=null;
  }
  // A taken card is somebody: you play as them and you do not rename them. The
  // age is theirs only where the roster knows it - ccPickCard decides that, so
  // switching mode leaves the box open until a card is actually chosen.
  // Именем креатора зовут его самого — как и взятую карточку, его не
  // переименовывают.
  document.getElementById('ccNick').disabled = m==='card' || m==='creator';
  document.getElementById('ccAge').disabled = false;
  ccRenderPhoto();
  ccRenderChips();
  ccRenderList();
  ccSync();
  window.scrollTo(0, keep);
}

// A number input takes any number you type — min and max only bind the spinner
// and native validation, so 87 sits in the field quite happily. The warning
// catches it while you type; this puts it back inside the range the moment you
// leave, so an impossible age can never simply stay there.
// Two digits, digits only. Enforced on the way in rather than left to the field:
// nothing else can end up in there, so every later read is a plain number.
function ccAgeInput(){
  const el=document.getElementById('ccAge');
  const clean=el.value.replace(/[^0-9]/g,'').slice(0,2);
  if(clean!==el.value) el.value=clean;
  ccSync();
}
function ccAgeClamp(){
  const el=document.getElementById('ccAge');
  const v=parseInt(el.value,10);
  el.value = isFinite(v) ? clamp(v, CC_AGE_MIN, CC_AGE_MAX) : 16;
  ccSync();
}
/* Дата рождения, если её ввели.

   Возраст остаётся тем, чем был — числом, которое выбирают, — а дата добавляет
   к нему день. Когда она стоит, возраст из неё и считается: поле с числом
   становится ведомым и запирается, как оно уже запирается у настоящей карточки
   с известным днём рождения (см. ccAgeKnown). Стереть дату — значит вернуть
   число себе.

   Считается на день старта карьеры, а не на сегодняшний: карьера начинается
   5 января 2026-го, и «шестнадцать» должно означать шестнадцать там, а не в
   том году, в котором сидит игрок. */
function ccBornInput(){
  const el=document.getElementById('ccBorn');
  const age=document.getElementById('ccAge');
  const iso=(el && el.value) || '';
  CC.born = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  if(age){
    const a=CC.born ? ccAgeOn(CC.born, careerStartDay()) : null;
    age.readOnly=!!CC.born;
    age.classList.toggle('cc-locked', !!CC.born);
    if(a!=null) age.value=String(a);
    else if(CC.born) age.value='';
  }
  ccSync();
}
/* Что дата может быть, а чего не может: границы те же, что у числа, только
   выраженные днями. Проставляются один раз, при открытии экрана, потому что
   день старта карьеры не двигается. */
/* Поставить дату снаружи — из выбора карточки или из сброса вкладки.

   Одной дверью с ccBornInput, чтобы «дата стоит» и «число ведомое и заперто»
   никогда не разъехались: это одно состояние, а не два. */
function ccBornSet(iso){
  const el=document.getElementById('ccBorn');
  if(el){ el.value=iso||''; el.disabled=false; }
  ccBornInput();
}
function ccBornBounds(){
  const el=document.getElementById('ccBorn');
  if(!el) return;
  const start=careerStartDay();
  const y=Number(start.slice(0,4)), md=start.slice(4);
  el.min=(y-CC_AGE_MAX)+md;
  el.max=(y-CC_AGE_MIN)+md;
}
/* Every region FNCS runs, and which of them a career can start in.

   It was Europe alone, and the reason given was the map: the country picker is
   European, the ping is measured to Frankfurt, and a rookie chooses a country.
   That reason only ever applied to a rookie. A taken card does not choose a
   country - it wears the one on the card - and carries no ping edge at all, so
   there is nothing European about starting as an American card except that the
   code used to say EU in eight places, and it no longer does.

   So: take a card, start anywhere. Build a player, start in Europe, because the
   map you would be choosing from is Europe. The chips say which is which rather
   than going quietly dead. */
const CC_REGIONS=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
/* Every region can be played from now. It used to be Europe only for a built
   player, because the country picker is a map and only Europe had one; the
   other six are in CC_REGION_MAPS. */
// Регионы года: в 2024-м NA West не было (Epic ввёл его в 2025-м) — отзыв: «NAW убери тогда с 24 года».
// NA West: в 2024-м его не было, в 2023-м он жил только до Мейджора 1 и влился в NA Central.
function ccYearRegions(){ return (ccPickedYear()===2024 || ccPickedYear()===2023) ? CC_REGIONS.filter(r=>r!=='NAW') : CC_REGIONS; }
function ccRegionReady(r){ return !!CC_MAP_FOR.hasOwnProperty(r) && ccYearRegions().indexOf(r)>=0; }
function ccRenderRegions(){
  const plate=document.getElementById('ccPingServer');
  if(plate) plate.textContent=L().ccPingServer(ccServerCity(CC.region));
  const box=document.getElementById('ccRegionChips'); if(!box) return;
  const lockR=ccMpLockedRegion();
  // У контент-мейкеров NA одна: двадцать имён — состав Про-Ама в Далласе, и на каком сервере каждый играет, в данных нет.
  // Отдельный чип NA West показывал тот же список, что NA Central.
  if(CC.mode==='creator' && CC.region==='NAW') CC.region='NAC';
  box.innerHTML=ccYearRegions().filter(r=>!(CC.mode==='creator' && r==='NAW')).map(r=>{
    const ready=ccRegionReady(r) && !(lockR && r!==lockR);
    return `<button class="cc-chip${CC.region===r?' on':''}${ready?'':' soon'}" `+
      `${ready?'':'disabled title="'+esc(lockR ? L().ccMpLockedBy : L().ccRegionSoon)+'"'} `+
      `onclick="ccPickRegion(\'${r}\', true)">${regionName(r)}</button>`;
  }).join('');
}
function ccPickRegion(r, byHand){
  if(!ccRegionReady(r)) return;
  if(byHand && CC.mode==='rookie') CC_MAP_OPEN=true;
  if(ccMpLockedRegion() && r!==ccMpLockedRegion()) return;   // регион задан хозяином комнаты
  CC.region=r;
  // A card from the region you just left is not a card in this one, so the pick
  // goes with it and the list is redrawn out of the new region's own people.
  CC.card=null; CC.country=null; CC.photo=null; CC.spa={};
  document.getElementById('ccNick').value='';
  document.getElementById('ccAge').value='16';
  ccRenderRegions();
  /* Чипы дивизиона зависят от региона дважды: сколько их (в Океании три
     ступени, в Европе пять) и какая полоса рейтинга под каждой. Без этой
     строки после смены региона оставались и лишние ступени, и чужие числа. */
  ccRenderChips();
  ccRenderPhoto();
  ccRenderList();
  ccSync();
}
function ccPickRole(k){ CC.role=k; ccRenderChips(); ccSync(); }
/* Значки устройства как в лобби Fortnite: белый силуэт клавиатуры с мышью и геймпада (currentColor). */
function ccInputIcon(k){
  const t=esc(L()['ccInput_'+k]||k);
  return k==='pad'
    ? '<svg class="cc-inico" viewBox="0 0 32 20" role="img" aria-label="'+t+'"><title>'+t+'</title><path fill="currentColor" fill-rule="evenodd" d="M8 3h16c4 0 6.5 3 7.4 8.2l.5 3.2c.4 2.8-1.6 4.6-3.8 4.6-1.6 0-2.6-.9-3.6-2.2l-1.6-2H9.1l-1.6 2c-1 1.3-2 2.2-3.6 2.2-2.2 0-4.2-1.8-3.8-4.6l.5-3.2C1.5 6 4 3 8 3zM8.5 7.6h2v2h2v2h-2v2h-2v-2h-2v-2h2zM21.95 8.3a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0zM24.35 10.6a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0zM19.55 10.6a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0zM21.95 12.9a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0-2.1 0z"/></svg>'
    : '<svg class="cc-inico" viewBox="0 0 34 20" role="img" aria-label="'+t+'"><title>'+t+'</title><rect x="1" y="5" width="22" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><g fill="currentColor"><rect x="3.8" y="7.8" width="2.2" height="2.2"/><rect x="7.6" y="7.8" width="2.2" height="2.2"/><rect x="11.4" y="7.8" width="2.2" height="2.2"/><rect x="15.2" y="7.8" width="2.2" height="2.2"/><rect x="19" y="7.8" width="2.2" height="2.2"/><rect x="3.8" y="11.2" width="2.2" height="2.2"/><rect x="7.6" y="11.2" width="2.2" height="2.2"/><rect x="11.4" y="11.2" width="2.2" height="2.2"/><rect x="15.2" y="11.2" width="2.2" height="2.2"/><rect x="19" y="11.2" width="2.2" height="2.2"/><rect x="7" y="14.6" width="10" height="1.8"/></g><rect x="25.5" y="3" width="7.5" height="15" rx="3.75" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M29.25 3v5.5" stroke="currentColor" stroke-width="1.6"/></svg>';
}
function ccPickInput(k){ CC.input=(k==='pad') ? 'pad' : 'kbm'; ccRenderChips(); ccSync(); }
/* Кто из про-игроков играет на контроллере (ключ ника, hKey) — по проверенным источникам (prosettings.net и др.,
   tools/measured/controller-pros.json); у остальных клавиатура и мышь. */
// 687 игроков, ключ «ник@регион» (тёзки из других регионов не задеты); NA — обе половины. Fortnite Esports Wiki + ProSettings.
const CC_PRO_PAD=new Set(["00mikii@EU","1laika@BR","3jmy@ME","3r8@ME","3zix@ME","74vrk@EU","7lm@ME","7man@ME","abbaski@ME","adesito@EU","adniq@EU","adol@ME","adze@EU","aim@ASIA","aizen@ME","akekzu@EU","akiira@EU","akkk@EU","aknar@EU","aleccrr@OCE","alexcod@EU","alexii@EU","alexrr1x@BR","all piece no aim@NAC","all piece no aim@NAW","alliege@NAC","alliege@NAW","alphakhor@NAC","alphakhor@NAW","alyanz@EU","andyvencha@NAC","andyvencha@NAW","angrybunch@OCE","ansilexx@EU","aonza@EU","aoribtw@NAC","aoribtw@NAW","apollo@NAC","apollo@NAW","aras@EU","ardit@EU","ariana smg@EU","arman@EU","arrow@ME","aryan@EU","asppp@OCE","assault@NAC","assault@NAW","astralsq@EU","aveeva@ME","axeel@EU","axgel@EU","ayarbaffo@EU","aydan@NAC","aydan@NAW","ayjok@NAC","ayjok@NAW","az2m@ME","azek@EU","b1ur@NAC","b1ur@NAW","babayaga@EU","baily@OCE","banz@EU","barney rex@OCE","barrako@ME","benn@OCE","berki@EU","betterr@EU","biltz@ME","bizzyxivi@NAC","bizzyxivi@NAW","blaackfn@ME","blaazeerd@BR","blackie@EU","blade@EU","blankaa@EU","bluii@NAC","bluii@NAW","blzerd@NAC","blzerd@NAW","bobotambe@EU","bouperson@ASIA","bowtheg@EU","bqrbie@OCE","braxle@EU","broseyy@NAC","broseyy@NAW","brownеr@EU","bryzee@EU","btx phantom@NAC","btx phantom@NAW","buildz@NAC","buildz@NAW","buzz@EU","bxldiz@EU","bylah@NAC","bylah@NAW","calmessi10@NAC","calmessi10@NAW","cam@NAC","cam@NAW","can@EU","carrot@EU","carti@NAC","carti@NAW","chacorta@NAC","chacorta@NAW","chacortabtw@NAC","chacortabtw@NAW","chaosgaminglive@NAC","chaosgaminglive@NAW","chentetas@NAC","chentetas@NAW","chimp@NAC","chimp@NAW","chocoluv@ASIA","chrisjey@EU","chriskp@EU","cicciogamer89@EU","clapsy@ME","clasheroonie@NAC","clasheroonie@NAW","claw@NAC","claw@NAW","claww@ME","cloverfnx@NAC","cloverfnx@NAW","clzudz@NAC","clzudz@NAW","cmon@EU","co1azo@NAC","co1azo@NAW","cobiex@NAC","cobiex@NAW","connor@EU","controlfn@EU","convic@NAC","convic@NAW","coop@NAC","coop@NAW","cowjoww@EU","cozy1x@EU","cr1nge@EU","cr4zy@EU","crazyy@EU","crfrmatl@NAC","crfrmatl@NAW","crr4zy@EU","crr@EU","crxsys@EU","curve@NAC","curve@NAW","cvrby@EU","czr@NAC","czr@NAW","daan@EU","dalen@EU","dangdroll@EU","darkiizz@EU","darkpat@EU","darkxz@BR","dashh@NAC","dashh@NAW","deadrise@EU","death@NAC","death@NAW","degaz@EU","denby@EU","deny@OCE","deqzyy@EU","destru@EU","deutsh@NAC","deutsh@NAW","deyy@NAC","deyy@NAW","deyydodger@EU","diablo@EU","didzzz@EU","discard@EU","diztard@NAC","diztard@NAW","dks@EU","dokko@EU","donpapa@EU","dony@EU","doog@EU","dorito@NAC","dorito@NAW","drone@ME","droor@NAC","droor@NAW","drpahks@NAC","drpahks@NAW","duckie ll@NAC","duckie ll@NAW","durr@EU","dxnette@EU","dylzzz@EU","dynamic@NAC","dynamic@NAW","dyox@EU","elder@NAC","elder@NAW","energyfnbr@EU","enzoo8k@EU","enzouzzz@BR","eryx@NAC","eryx@NAW","essitam@EU","estevão@BR","etzo@NAC","etzo@NAW","exityrr@EU","eyedead@EU","f1lck@ME","f3xr@EU","fabiojit@NAC","fabiojit@NAW","fakie@NAC","fakie@NAW","fares@EU","farеs@ME","faxuty@NAC","faxuty@NAW","fay@EU","fecoy@NAC","fecoy@NAW","feehzin@BR","fenix@ME","fhd@ME","fidunboirr@EU","finejupiter@OCE","finn@EU","fishy@BR","flexpito@EU","flood@ME","flubbyy@EU","flxme@EU","flxzy@ME","flystract@EU","fox (italian player)@EU","foxjay@EU","foxman@NAC","foxman@NAW","franni@EU","freestyle@OCE","frelya@ASIA","freshiwnl@EU","frosty@BR","frxzifyx@EU","furiouss@ME","fusionz@NAC","fusionz@NAW","fylix@EU","fynn@EU","fzn@EU","gabe@NAC","gabe@NAW","gabix@EU","gabrish@EU","gejo@EU","gemai@EU","geny@EU","geo@NAC","geo@NAW","gerlaenco@EU","ghooslty@NAC","ghooslty@NAW","ghxxstay@BR","gianniz@EU","gibproo@EU","gino@EU","globa@EU","gmoney@NAC","gmoney@NAW","gntl@ME","gordete@EU","gordetee@EU","greek freak 7@OCE","griff@EU","grxy@NAC","grxy@NAW","gumon@BR","haledy@NAC","haledy@NAW","hardfind@EU","havre@EU","havе@EU","hedra@EU","henry@EU","hilly@EU","hisashi@BR","hound@NAC","hound@NAW","hssey@OCE","hugo@EU","huguex@EU","hyrax@EU","ialeex@EU","iineymar@ME","impumpz@EU","innocents@NAC","innocents@NAW","intrepid@EU","itzm7mdfn@ME","ivan@EU","jackyrr@EU","jacobbb@NAC","jacobbb@NAW","jae@EU","jaemon@ASIA","jafarr@EU","jamalali@EU","jammy@NAC","jammy@NAW","jamz@EU","janmannk@NAC","janmannk@NAW","jarvis@EU","jaus@NAC","jaus@NAW","jehrz@NAC","jehrz@NAW","jenks@EU","jeren@NAC","jeren@NAW","jinkundesu@ASIA","jit ter@NAC","jit ter@NAW","jkreet@ME","jmo@ME","joanee2k@EU","joe (na player)@NAC","joe (na player)@NAW","joeluk@EU","joexzy@NAC","joexzy@NAW","johku@EU","jokzz@EU","jomsr@OCE","joqqy@OCE","joreph@NAC","joreph@NAW","josue@BR","jxness7@BR","kaan@EU","kaande@EU","kacpixon@EU","kaidon@EU","kairuv2@ME","kakqin@OCE","kamo@EU","kana@ASIA","karax@EU","kayd@EU","kazie@EU","kc1rt@BR","kenjiwyd@EU","kero@ME","keyaan@EU","khangamerx@ME","kian@EU","kickz@NAC","kickz@NAW","kikoo@EU","kimkana@ASIA","kingaling@NAC","kingaling@NAW","kingz@EU","kirbty@NAC","kirbty@NAW","kiriszn@EU","klazyy@ME","klixey@NAC","klixey@NAW","klvztt@BR","knifer@EU","knogi@EU","koenfn@EU","kogane@ASIA","kortex@NAC","kortex@NAW","koukk@OCE","krimnl@OCE","krom@EU","kromatik@EU","kruttgutt@EU","kruyor@NAC","kruyor@NAW","kurama@EU","kurzanx@EU","kutt@NAC","kutt@NAW","kyal@OCE","kyziqx@EU","laiys@NAC","laiys@NAW","laizen@EU","lardl@ME","later@EU","launcher@EU","len@EU","leoks@EU","letshe@EU","lezzy@EU","lim0@EU","liwshe@EU","llobeti4@EU","loganzz@EU","loloo@EU","lolsaucy@NAC","lolsaucy@NAW","lorii@EU","lova@EU","lucien@EU","luisao@EU","luisitopixixi@EU","lukas (eu player)@EU","lyiix@EU","m1lo@EU","m2bk@ME","m7eyy@ME","mafioso@EU","magl@EU","malkawi@ME","maniac@NAC","maniac@NAW","manik@EU","mansour@ME","mansoureyy@ME","marco@EU","marcowhale1x@ME","martins (br player)@BR","marv@EU","mata@EU","matnight@EU","mattbszn@EU","mattranks@NAC","mattranks@NAW","maxgg@NAC","maxgg@NAW","mcberry@OCE","mefoo@NAC","mefoo@NAW","merfind@EU","mero@NAC","mero@NAW","mert@EU","mestree@EU","mezz@EU","mikey@NAC","mikey@NAW","minipiyo@ASIA","minori@EU","mitei@BR","modisk@ME","mohammedsr4@EU","moneymaker@EU","monа@EU","moon@EU","moussa@OCE","moxie@NAC","moxie@NAW","mshary@ME","mts@EU","muhq@EU","mustazico@EU","mvxrr@BR","mxciej@EU","n4оh@ME","n7@ME","nacharrio@EU","nafri@EU","napo@EU","natan@EU","nathan@NAC","nathan@NAW","nawqa@EU","nax@EU","nayroz@EU","naysu@EU","nayzer@EU","nazgul@EU","nbxfv@ME","nejiz@EU","nero@EU","neu@EU","neudtee@EU","nevado@EU","nevify@NAC","nevify@NAW","newton@EU","neymar@ME","nezak@EU","niasen@EU","niivzy@EU","niki (eu player)@EU","nipsy@EU","nizer@EU","nizo@ME","noa@EU","noahjr10@EU","noizy@NAC","noizy@NAW","nomis@EU","nomzz@EU","noobieplayer@EU","noulish@NAC","noulish@NAW","noxyhty@ASIA","nuwzh@EU","nxndolol@BR","nxthan@EU","nxtures@OCE","obito@EU","okis@NAC","okis@NAW","oltsu@EU","opt@EU","optszn@NAC","optszn@NAW","orbix@EU","outpld@EU","over@EU","owl@NAC","owl@NAW","papito@EU","parca@EU","parxc@NAC","parxc@NAW","patehk@NAC","patehk@NAW","patto@EU","pepoclip@ASIA","peppe@EU","perceval@EU","phyenix@EU","pietriin@BR","pila@EU","piontka@EU","pipbot@NAC","pipbot@NAW","pirozz@EU","pixovsky@EU","playify@NAC","playify@NAW","pluto@EU","plzzxnano@NAC","plzzxnano@NAW","prayy@EU","premfn@NAC","premfn@NAW","pretty@NAC","pretty@NAW","pro@ME","problem@NAC","problem@NAW","prodigyy@BR","puma@ME","purav@OCE","pvkz@NAC","pvkz@NAW","pxmp@NAC","pxmp@NAW","qb@EU","qeezy@EU","qhvst@OCE","qisi@ME","rabbit@ASIA","rainzz@EU","raizoo@ME","rakic@ME","rambo@EU","raregg@EU","raxqs@EU","rayxne@EU","razorx@NAC","razorx@NAW","react1x@NAC","react1x@NAW","redz@EU","reet@NAC","reet@NAW","reevers@EU","reez@EU","regs@NAC","regs@NAW","rehan@NAC","rehan@NAW","reinerz@ASIA","remixxx@EU","resypical@NAC","resypical@NAW","revised@NAC","revised@NAW","ricky@EU","rico@EU","ricy@EU","rifty@EU","riney@EU","rino@ME","rintaroudazo@ASIA","riquelme@BR","rise@EU","robott@BR","rockega@EU","rodeybros@NAC","rodeybros@NAW","rohunfn@NAC","rohunfn@NAW","roker@EU","ronnityy@EU","rooklol7@ME","rottentwinkies@NAC","rottentwinkies@NAW","rubanssx@EU","rubbx@EU","rupapad@ASIA","rushh@NAC","rushh@NAW","rusteryy@EU","rxlphy@NAC","rxlphy@NAW","rxman@EU","rxnny@EU","ryaic@NAC","ryaic@NAW","ryptidz@NAC","ryptidz@NAW","ryzeuh@EU","ryzon@EU","s0vzy@NAC","s0vzy@NAW","salt 22@ME","sami@ME","samkob@NAC","samkob@NAW","samux@EU","santi@EU","sanxzy@EU","sat@ME","scaryy@EU","schock@OCE","sciacqua@EU","scolleh@EU","scoped@NAC","scoped@NAW","scopexd@EU","sent@EU","sevenjosh@EU","sgaus@EU","shadox@EU","shadyy@NAC","shadyy@NAW","shiro@EU","shiwi@EU","shotty (br player)@BR","sigma3x@NAC","sigma3x@NAW","sinklol@ASIA","sirious@EU","skxyper ay@EU","skyjump@EU","slacss@NAC","slacss@NAW","slayyer1x@ME","sleezy@EU","slicehyper@EU","slurp@EU","snoopywyd@ME","spade@NAC","spade@NAW","spect@NAC","spect@NAW","spexx@EU","splasheyy@EU","squish@NAC","squish@NAW","sqyroo@EU","sr3@NAC","sr3@NAW","stakken@EU","stampz@NAC","stampz@NAW","star@ME","stefxm@BR","stiffaroonie@NAC","stiffaroonie@NAW","storms@NAC","storms@NAW","stormy@EU","stormy@NAC","stormy@NAW","stranger@ME","sulaiman@ME","sway@NAC","sway@NAW","swelucas@EU","swexey@NAC","swexey@NAW","swifty@EU","swiftylol@ME","swiiight@EU","swzzy@EU","sxdia@EU","sxxmii@EU","syaaz@EU","synrr@NAC","synrr@NAW","sythic@ME","t0ahh@EU","t3eny@EU","taintsy@EU","talls@BR","tauruz@ME","tawerkaxl@EU","tcevasive@EU","tchikito@EU","tcin@EU","teaguey@EU","technique@EU","teichifishy@EU","tekkers@ME","tequilaeater@NAC","tequilaeater@NAW","teyzen@EU","tiiger24@EU","tilt@NAC","tilt@NAW","timmme@EU","tkay@NAC","tkay@NAW","tofranks@BR","tokl@ME","tombik@EU","tooslowforyou@EU","totot@ASIA","trabzon@EU","trapped@OCE","trece@EU","troxzer@EU","tryhardd@EU","tweop@EU","twexy@NAC","twexy@NAW","twunti@NAC","twunti@NAW","twx@ME","tyrer74@EU","uckee@EU","uiabstrakt@NAC","uiabstrakt@NAW","umplify@EU","unknown@NAC","unknown@NAW","vainly@EU","vayz@NAC","vayz@NAW","vazzy@EU","vblazified@EU","vbqtify@NAC","vbqtify@NAW","velokyd@EU","veloyd@EU","veri@EU","vert@NAC","vert@NAW","vexifire@NAC","vexifire@NAW","vick@EU","viosk@EU","vipex@EU","vizual@EU","vohade@NAC","vohade@NAW","vortexia@EU","vosloww@EU","vovo@EU","vtera@ME","vxttor@BR","vyper@EU","watts (scottish player)@EU","wavyjacob@NAC","wavyjacob@NAW","weezle@NAC","weezle@NAW","wolfiez@EU","wolfiizz@ME","wqzzi@ME","xarcy@EU","xayrez@NAC","xayrez@NAW","xcon@OCE","xeve@EU","xeyler@ASIA","xha3o0@ME","xjam@ME","xjiuo@EU","xpert@ME","yaer@EU","yama@ASIA","yasir@NAC","yasir@NAW","yayouu@EU","yoda@EU","yonder@EU","yoosaltyy@NAC","yoosaltyy@NAW","yucky@ASIA","yuden@EU","yukii@EU","yuqii@EU","yzy@EU","zaf@EU","zangi@EU","zaxi@EU","zeerox@EU","zeldriss@EU","zelobud@OCE","zewfie@NAC","zewfie@NAW","zexfishy@EU","zhan@EU","zhy@NAC","zhy@NAW","zhаys@EU","zicti@NAC","zicti@NAW","ziggy@NAC","ziggy@NAW","zilo (european player)@EU","zmax@EU","zocian@EU","zohan@EU","zooxy@EU","zoshy@EU","zqcca@EU","zxmbie@ME","zxn@ME","zynox@EU","zypher@EU","zyra@OCE","zyvk@EU","авe@NAC","авe@NAW"]);
function ccProInput(card){ return card && CC_PRO_PAD.has(hKey(card)+'@'+(card.region||'')) ? 'pad' : 'kbm'; }
// Устройство карьеры: своё — выбранное при создании; взятая карточка — по данным; старый сейв — клавиатура.
function ccInputOf(pl){ return (pl && (pl.input==='pad' || pl.input==='kbm')) ? pl.input : 'kbm'; }
// Без прибавки за пинг и возраст: рейтинг своего игрока — ровно собранный (Notion «18.10»).
function ccPickEdge(off){ CC.noEdge=!!off; ccRenderChips(); if(typeof ccRenderCard==='function') ccRenderCard(); ccSync(); }
/* Прибавки нет: выключена переключателем — или это «Свои статы до 99» (CC.spaFree), там её нет всегда
   (его слово 18.10: «отключи эти +10, где игрок сам выбирает статы»). */
function ccNoEdgeNow(){ return !!(CC && (CC.noEdge || CC.spaFree)); }
// Прибавка у игрока карьеры выключена (pl.noEdge с экрана создания).
function ccEdgeOff(pl){ return !!(pl && pl.noEdge); }
/* СЕЗОН СТАРТА (18.10, тестер: «может в карьере дать выбор по сезонам ещё, а не по годам»). Сезоны года —
   те же снимки сцены, по которым карьера и так живёт (ccSnapshotNow); выбранный не первый пишется в сейв
   как cr.startFrom, и первый день карьеры — первая игровая неделя с этой даты (careerStartDay). Рейтинги
   сезона — ccRatingSnap. Командная карьера и гонка начинают год с начала: день у всех один. */
const CC_SEASON_LABEL={h1:'Season 9', g5:'OG · Season 5', g6:'OG · Season 6', g7:'OG · Season 7', h3:'Season X', h4:'C2S1', i0:'C2S1', i1:'C2S2', i3:'C2S4',
  j1:'C2S5', j2:'C2S6', j3:'C2S7', j4:'C2S8', k1:'C3S1', k2:'C3S2', k3:'C3S3',
  e1:'Major 1', e2:'Major 2', e3:'Major 3', f1:'Major 1', f2:'Major 2', f3:'Major 3',
  t1:'Major 1', t2:'Major 2', t3:'Major 3', m1:'Major 1', m2:'Major 2',
  s40:'Season 40 · Major 1', s41:'Season 41 · Major 2', s42:'Season 42 · FNCS Solos', s43:'Season 43 · Treasure Hunters', og:'Season OG', remix:'Chapter 2 Remix', sw:'Galactic Battle (Star Wars)', simpsons:'The Simpsons'};
const CC_SEASON_SUB={m1:'S39', s40:'S40', s41:'S41', s42:'S42', s43:'One Piece', og:'OG', remix:'Remix', sw:'Star Wars', simpsons:'Simpsons', e1:'C4S1', e2:'C4S2', e3:'C4S3', f1:'C5S1', f2:'C5S2', f3:'C5S3', t1:'C6S1', t2:'C6S2', t3:'C6S3'};
// Особые сезоны Epic — своей кнопкой старта на плитке года: OG и Remix (годы продлены до 30.11, ccYearTo) и
// Star Wars (Galactic Battle, C6, 2.05–6.06.2025: FNCS Showdown 4–6, Console Victory Cup, оценки).
// snap — снимок рейтинга того времени; без него рейтинг — итог года (ccRatingSnap на экране создания отдаёт null).
/* 2026 — по сезонам Fortnite, как карточки (Major 1 = S40, Major 2 = S41, Solos = S42), а не M1/M2: год идёт
   с S39 (снимок m1), дальше старт с первого дня S40/S41/S42/S43. Снимок m2 остаётся для составов (плей-ин 18.07),
   но своей кнопкой не показывается: его сезон S41 начинается 6 июня. */
const CC_START_EXTRA={2023:[{tag:'og', from:'2023-11-03'}], 2024:[{tag:'remix', from:'2024-11-02'}],
  2025:[{tag:'sw', from:'2025-05-02', snap:'t2'}, {tag:'simpsons', from:'2025-11-01'}],
  2026:[{tag:'s40', from:'2026-03-19', snap:'m1'}, {tag:'s41', from:'2026-06-06', snap:'m1'}, {tag:'s42', from:'2026-08-21', snap:'m2'}, {tag:'s43', from:'2026-11-01', snap:'m2'}]};
const CC_START_HIDE={2026:['m2']};
// Сначала сезоны Мейджоров, потом особые (OG, Remix, Star Wars). У 2026-го все кнопки — сезоны, поэтому по датам.
function ccStartSeasonsOf(y){
  const list=(CC_SNAPS_BY_YEAR()[y] || []).filter(s=>!(CC_START_HIDE[y] || []).includes(s.tag)).concat(CC_START_EXTRA[y] || []);
  return CC_START_HIDE[y] ? list.sort((a, b)=>String(a.from).localeCompare(String(b.from))) : list;
}
function ccStartSeasons(){ return ccStartSeasonsOf(ccPickedYear()); }
function ccStartSeasonAllowed(){ return !ccMpLockedYear() && !(typeof CC_MP_NEW!=='undefined' && CC_MP_NEW); }
function ccPickedStart(){
  const list=ccStartSeasons();
  if(!ccStartSeasonAllowed() || !CC.startTag) return null;
  const i=list.findIndex(s=>s.tag===CC.startTag);
  return i>0 ? list[i] : null;
}
// Короткая подпись кнопки на плитке: C5S1, Major 1 → M1, Season X → SX.
function ccSeasonShort(tag){ return CC_SEASON_SUB[tag] || String(CC_SEASON_LABEL[tag]||tag).replace(/^Major /, 'M').replace(/^Season /, 'S'); }
function ccPickStartSeason(tag){
  CC.startTag=tag;
  // Рейтинги в списке карточек — того сезона (ccRatingSnap на экране создания): взятая карточка — заново.
  if(CC.mode==='card'){ CC.card=null; if(typeof ccRenderList==='function') ccRenderList(); }
  ccRenderChips(); if(typeof ccRenderCard==='function') ccRenderCard(); ccSync();
}
function ccPickYearSeason(y, tag){
  if(ccMpLockedYear() && y!==ccMpLockedYear()) return;
  if((CC.year||2026)!==y) ccPickYear(y);
  ccPickStartSeason(tag);
}
// Сезон не выбрать (командная карьера, гонка) — выбор сбрасывается на начало года.
function ccRenderSeasonChips(){ if(!ccStartSeasonAllowed() || ccStartSeasons().length<2) CC.startTag=null; }
function ccPickDiv(d){ CC.div=d; ccRenderChips(); ccSync(); }
function ccPickDiff(id){ CC.diff=id; ccRenderChips(); ccSync(); }
// Год карьеры: 2026 (дуо, потом трио) или 2025 (трио, три Мейджора, Лион). См. ccCalYear.
// Год, выбранный чипом: 2024, 2025 или 2026 (сейв без чипа — 2026).
function ccPickedYear(){ return (CC && ccPastYear(CC.year)) ? CC.year : 2026; }
function ccPickYear(y){
  if(ccMpLockedYear() && y!==ccMpLockedYear()) return;   // год задан хозяином комнаты
  CC.year=ccPastYear(y) ? y : 2026;
  CC.startTag=null;   // сезон старта — свой у каждого года, со сменой года снова первый
  // NA West в 2024-м нет: выбранный — в NA Central, тем же путём, что кнопка.
  if(CC.region && ccYearRegions().indexOf(CC.region)<0){ ccPickRegion('NAC'); ccRenderChips(); ccRenderCard(); ccSync(); return; }
  ccRenderRegions();
  // Карточка, взятая в другом году, — уже не та карточка: список и превью собираются заново.
  if(CC.mode==='card'){ CC.card=null; if(typeof ccRenderList==='function') ccRenderList(); }
  ccRenderChips(); ccRenderCard(); ccSync();
}

// Role belongs to the card — it is read off the attributes and cannot be argued
// with. Division is a choice either way. A taken card starts wherever you put it,
// so you can drop vic0 into Division 5 and walk over it, or take a 60 into
// Division 1 and find out what that feels like.
function ccRenderChips(){
  const card = CC.mode==='card' ? CC.card : null;
  const lockRole = card ? attrsFor(card).roleKey : null;
  document.getElementById('ccRoleChips').innerHTML=['roleIGL','roleFRG'].map(k=>{
    const on=(lockRole||CC.role)===k;
    return `<button class="cc-chip${on?' on':''}" ${card?'disabled':''} `+
      `onclick="ccPickRole(\'${k}\')">${L()[k]}</button>`;
  }).join('');
  { const ic=document.getElementById('ccInputChips'), lockIn=card ? ccProInput(card) : null;
    if(ic) ic.innerHTML=['kbm','pad'].map(k=>`<button class="cc-chip${(lockIn||CC.input||'kbm')===k?' on':''}" ${card?'disabled':''} `+
      `onclick="ccPickInput(\'${k}\')">${ccInputIcon(k)}</button>`).join(''); }
  /* Год без дивизионов (ccNoDivisions) оставляет эти чипы на месте, но зовёт
     их своим именем: лестницы в 2024-м нет, а вопрос «с чего ты начинаешь»
     есть — ccDivNote и так отвечал «Дивизион задаёт стартовый рейтинг». Само
     число в сейв не уходит: карьера такого года живёт без ступени вовсе
     (careerNewCareer пишет division 1), и полоса остаётся только стартом. */
  const noDiv=ccNoDivisions();
  const divLab=document.querySelector('#ccDivField label');
  if(divLab) divLab.textContent=noDiv ? L().ccStartOvr : L().ccDivision;
  const divNote=document.querySelector('#ccDivField .cc-note');
  if(divNote) divNote.textContent=noDiv ? L().ccStartOvrNote : L().ccDivNote;
  /* Ступеней столько, сколько их в выбранном регионе: в Океании нет ни
     четвёртого дивизиона, ни пятого. Выбор, оставшийся за краем (сменили
     регион с Европы на Азию), съезжает на нижнюю ступень. */
  const divN=ccDivCount(CC.region);
  if((CC.div||1)>divN) CC.div=divN;
  /* Года без дивизионов (2019–2022, 2024) выбора ступени не показывают вовсе: лестницы нет —
     нет и вопроса. Новичок стартует с нижней ступени, как по умолчанию. */
  const divField=document.getElementById('ccDivField');
  if(divField) divField.style.display=noDiv ? 'none' : '';
  if(noDiv && !card) CC.div=divN;
  const divList=[]; for(let d=1; d<=divN; d++) divList.push(d);
  document.getElementById('ccDivChips').innerHTML=divList.map(d=>{
    const on=CC.div===d;
    return `<button class="cc-chip${on?' on':''}" `+
      `onclick="ccPickDiv(${d})">${d}<small>${card?'':ccBand(d, CC.region)}</small></button>`;
  }).join('');
  // The chip says what it does: a number under a name, the way the divisions
  // carry their band. Easy is the mode as it has always played.
  const ychips=document.getElementById('ccYearChips');
  if(ychips){
    const lockY=ccMpLockedYear();
    /* Международка года — та, ради которой сезон и играется. Имена городов
       одинаковы на всех языках, поэтому строкой словаря не идут. */
    /* Арт — тот же файл, которым сезон подписан на лендинге (MODE_ART):
       2026 ключевой арт года, 2025 его Мейджор 1, 2024 остров Мейджора 1. */
    const YEAR_LOOK={2026:{lan:'Antwerp',    art:'art/fncs-2026.jpg'},
                     2025:{lan:'Lyon',       art:'art/mode-major1-2025.jpg'},
                     2024:{lan:'Fort Worth', art:'art/fncs-2024.jpg'},
                     // 2023 и 2022 — ключевые арты Epic своего года (новости fortnite.com: FNCS 2023, FNCS C3S1).
                     2023:{lan:'Copenhagen', art:'art/fncs-2023.jpg'},
                     2022:{lan:'Raleigh', art:'art/fncs-2022.jpg'},
                     // 2021 — онлайн, ключевой арт FNCS C2S5 (fortnite.com).
                     2021:{lan:'Online', art:'art/fncs-2021.jpg'},
                     // 2019 — ключевой арт Fortnite World Cup (fortnite.com).
                     2019:{lan:'New York', art:'art/fncs-2019.jpg'},
                     // 2020 — онлайн, арт FNCS C2S3 (fortnite.com).
                     2020:{lan:'Online', art:'art/fncs-2020.jpg'}};
    ychips.innerHTML=[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map(y=>{
      const on=(CC.year||2026)===y;
      const off=lockY && y!==lockY;
      const look=YEAR_LOOK[y]||{lan:''};
      // Сезоны года — кнопками на самой плитке (18.10): нажатие выбирает и год, и сезон.
      const ss=ccStartSeasonAllowed() ? ccStartSeasonsOf(y) : [];
      const curS=on ? (ccPickedStart()||ss[0]||{}).tag : null;
      // Кнопки сезонов — рядом с плиткой в общей обёртке, а не внутри неё: кнопка в кнопке не везде нажимается.
      const sHTML=ss.length>1 ? `<div class="cc-yt-seasons${on?' on':''}">${ss.map(s=>`<button type="button" class="cc-yt-s${s.tag===curS?' on':''}" `+
        `title="${esc((CC_SEASON_LABEL[s.tag]||s.tag)+' · '+ccHdrDate(s.from))}" onclick="ccPickYearSeason(${y},'${s.tag}')">${esc(ccSeasonShort(s.tag))}</button>`).join('')}</div>` : '';
      return `<div class="cc-yt-wrap" style="--sn:${ss.length>1 ? ss.length : 0}"><button class="cc-chip cc-year-tile${on?' on':''}${off?' soon':''}" style="--yr-art:url(${look.art})" ${off?'disabled title="'+esc(L().ccMpLockedBy)+'"':''} onclick="ccPickYear(${y})"><b>${y}</b><small>${L()['ccYear'+y]}</small><i>${look.lan}</i></button>${sHTML}</div>`;
    }).join('');
    const yn=document.getElementById('ccYearNote');
    if(yn) yn.textContent=(lockY ? L().ccMpLockedBy+' · ' : '')+L()['ccYearNote'+(CC.year||2026)]+
      (ccStartSeasonAllowed() && ccStartSeasons().length>1 ? ' '+L().ccStartSeasonNote : '');
  }
  ccRenderSeasonChips();
  const ef=document.getElementById('ccEdgeField'), ech=document.getElementById('ccEdgeChips');
  // В «Своих статах до 99» прибавки нет без выбора — переключатель только у обычного новичка.
  if(ef) ef.style.display=(CC.mode==='rookie' && !CC.spaFree) ? '' : 'none';
  if(ech) ech.innerHTML=[[false, L().ccEdgeOn], [true, L().ccEdgeOff]].map(([v, t])=>
    `<button class="cc-chip${!!CC.noEdge===v?' on':''}" onclick="ccPickEdge(${v})">${t}</button>`).join('');
  const dchips=document.getElementById('ccDiffChips');
  if(dchips) dchips.innerHTML=CC_DIFFS.map(d=>{
    const on=(CC.diff||'easy')===d.id;
    // Сложность в цветах редкостей Fortnite: синяя, фиолетовая, золотая, мифическая; названия прежние (его слово 29.09).
    return `<button class="cc-chip cc-rar cc-rar-${d.id}${on?' on':''}" `+
      `onclick="ccPickDiff(\'${d.id}\')">${L()['ccDiff'+d.id.charAt(0).toUpperCase()+d.id.slice(1)]}`+
      `<small>${L().ccDiffSpeed(d.age.toFixed(2))}</small></button>`;
  }).join('');
}

/* В каком регионе играет креатор. Пул сгруппирован по сценам, и это ЕДИНСТВЕННОЕ,
   что про его регион известно наверняка. СНГ отдельным регионом в Фортнайте не
   существует — эти люди играют в европейском, поэтому CIS сводится к EU. */
/* Свой регион у креаторов Азии, Океании и Ближнего Востока (28.10, его «nac и naw одинаковые, когда кликаешь, и asia oce me»).
   Для Про-Ама они по-прежнему одна корзина (CC_PROAM_CREATORS_ASIA), а на экране выбора и в карьере — каждый в своём
   регионе по стране из инфобокса Liquipedia: Япония — Азия, Австралия — Океания, Саудовская Аравия — Ближний Восток.
   Winter — по комментарию у CC_PROAM_CREATORS_ASIA, Океания. */
const CC_CREATOR_HOME_APAC={ASIA:['Neckokun','Hamuppi','Nephrite','Shinck'],
  OCE:['AussieAntics','Chanzes','LazarBeam','Loserfruit','Overstrand','Winter','Worthy'],
  ME:['Boter','IMonkey D','Rudex']};
function ccCreatorRegion(name){
  const k=hKey(name);
  for(const reg of CC_PROAM_REGION_ORDER){
    if((CC_PROAM_CREATORS_BY_REGION[reg]||[]).some(n=>hKey(n)===k)){
      if(reg==='ASIA') return ['OCE','ME'].find(r=>CC_CREATOR_HOME_APAC[r].some(n=>hKey(n)===k)) || 'ASIA';
      return reg==='CIS' ? 'EU' : reg;
    }
  }
  return 'EU';
}
function ccPickCreator(name){
  if(ccProAmCreators().indexOf(name)<0) return;
  CC.creator=name; CC.card=null;
  // Регион — тот, в котором этот человек и правда играет; чипы остаются живыми,
  // это подсказка, а не замок (так же ведёт себя дивизион у взятой карточки).
  CC.region=ccCreatorRegion(name);
  CC.photo=null;
  document.getElementById('ccNick').value=name;
  CC.div=ccDivisionFor(CC_PROAM_CREATOR_OVR);
  ccRenderRegions();
  ccRenderChips();
  ccRenderList();
  ccSync();
}
// Карточка креатора для превью и для старта: рейтинг один на всех, редкость
// своя (см. shownRarity), аудитория настоящая.
function ccCreatorCard(name){
  const f=ccProAmFollowers(name), tw=ccProAmTwitch(name);
  return {handle:name, nick:name, nat:null, region:ccCreatorRegion(name), org:null,
          tier:'ladder', event:L().ccCreatorEvent, placement:null,
          rating:CC_PROAM_CREATOR_OVR, _targetOvr:CC_PROAM_CREATOR_OVR,
          _attrs:ccRookieAttrs(CC_PROAM_CREATOR_OVR, CC.role||'roleIGL'),
          // Лицо — с его канала: карьера за живого стримера играется его
          // портретом, а не инициалами. См. CC_PROAM_AVA.
          _photo:ccProAmAvatar(name),
          creator:true, tw:tw?tw[0]:null, followers:f};
}
function ccRenderCard(){
  const box=document.getElementById('ccCardBox'); if(!box) return;
  let card = CC.mode==='card' ? CC.card
           : CC.mode==='creator' ? (CC.creator ? ccCreatorCard(CC.creator) : null)
           : (CC.country ? ccMakePlayer() : null);
  if(CC.mode==='card' && card){
    // A taken card previews as the person it is. The ping is shown because the
    // career really will play on that connection, but it is worth nothing here
    // — the edges belong to a player who was built. See careerCard.
    const ms=CC.country ? ccPingOf(CC.country, CC.region) : null;
    card={...card, _pingEdge:0, _ageEdge:0, _pingMs:ms,
          _age:parseInt(document.getElementById('ccAge').value, 10)};
  }
  // The record under the card, for a taken one. A built player has no record -
  // that is the whole of what starting from nothing means.
  box.innerHTML = card ? futCardHTML(card) : `<div class="cc-empty">${L().ccCardEmpty}</div>`;
}

// The nationality on a card is a Russian country name; FLAG_CODE already knows
// how to turn one into an ISO code, which is the same key the ping table uses.
function ccCodeForNat(nat){ return FLAG_CODE[nat]||null; }
/* Где про живёт, когда это не страна его флага. Его список, 23 августа:
   «вот россияне которые живут в Сербии — NeFrizi, Malibuca, Panzer, Swizzy —
   чтоб дом был Сербия». Флаг и паспорт остаются российскими (NATIONALITY не
   трогается), а дом взятой карточки — «Живёт», пинг, аренда — сербский:
   правило панели переезда всегда говорило «взятая карточка живёт там, где
   живёт настоящий человек», просто дом читался по флагу. */
const CC_PRO_HOME={malibuca:'rs', swizzy:'rs', panzer:'rs', nefrizi:'rs'};
function ccProHomeOf(handle){ return CC_PRO_HOME[String(handle||'').toLowerCase()]||null; }

function ccRenderList(){
  try{ ccMapState(); }catch(e){}
  const q=(document.getElementById('ccSearch').value||'').trim().toLowerCase();
  const grid=document.getElementById('ccGrid'), cards=document.getElementById('ccCards');
  const plate=document.getElementById('ccPingPlate');
  if(plate) plate.style.display = CC.mode==='rookie' ? '' : 'none';
  // Очки прокачки — только построенному, и раздаются только здесь.
  const spf=document.getElementById('ccSpField');
  if(spf){ spf.style.display = CC.mode==='rookie' ? '' : 'none'; ccSpaRender(); }
  /* Контент-мейкеры — тот же список карточек, только собранный из живых людей
     с Twitch, а не из ростера сцены. Рейтинг у всех один (CC_PROAM_CREATOR_OVR),
     потому что играют они примерно одинаково; отличает их аудитория, поэтому
     под ником стоит она, а не клуб. */
  if(CC.mode==='creator'){
    grid.style.display='none'; cards.style.display='';
    /* Правка: «регионы не работают у контент-креаторов — жму, и там всех
       показывает; пусть от большего к меньшему по фолловерам». Список — только корзина
       выбранного региона (чип, а не регион старой карьеры), по фолловерам вниз. */
    // СНГ играет в Европе (ccCreatorRegion сводит CIS к EU) — европейский чип показывает и их.
    const all=(CC_PROAM_CREATORS_BY_REGION[CC.region||'EU']||[]).concat((CC.region||'EU')==='EU' ? (CC_PROAM_CREATORS_BY_REGION.CIS||[]) : [])
      .filter(n=>!CC_CREATOR_HOME_APAC[CC.region] || ccCreatorRegion(n)===CC.region)
      .filter(n=>ccProAmFollowers(n)>0)   // без подтверждённого канала Twitch не показываем (28.10, его «убери контент-мейкеров, у которых канал не подтверждён»)
      .filter((n,i,arr)=>arr.findIndex(x=>hKey(x)===hKey(n))===i)
      .sort((a,b)=>ccProAmFollowers(b)-ccProAmFollowers(a))
      .filter(n=>!q || n.toLowerCase().includes(q));
    cards.innerHTML = all.length ? all.map(n=>{
      const f=ccProAmFollowers(n), reg=ccCreatorRegion(n);
      const on = CC.creator===n ? ' on' : '';
      // Лицо канала — там же, где у карточек ростера портрет. См. CC_PROAM_AVA.
      const ava=ccProAmAvatar(n);
      return `<button class="cc-card cc-card-cre${on}" onclick="ccPickCreator('${jsq(n)}')">
        ${ava ? `<img class="cc-card-ph" src="${ava}" alt="" loading="lazy" onerror="this.remove()">`
              : `<span class="cc-card-ph"></span>`}
        <span class="cc-card-in">
          <span class="cc-card-n">${esc(n)}</span>
          <span class="cc-card-o">${esc(regionName(reg))}</span>
          ${ccCreatorMediaHTML(n) || `<span class="cc-card-mate">${L().ccCreatorNoTw}</span>`}
        </span>
        <span class="cc-card-r">${CC_PROAM_CREATOR_OVR}</span></button>`;
    }).join('') : `<div class="cc-note">${L().ccNoCards}</div>`;
    return;
  }
  if(CC.mode==='rookie'){
    cards.style.display='none'; grid.style.display='';
    const reg=CC.region||'EU';
    // The shapes are a separate file now. Say so and come back when it lands.
    if(!ccMapsReady(function(){ ccRenderList(); })){
      grid.dataset.reg=''; grid.innerHTML='<div class="cc-note">'+L().ccMapLoading+'</div>';
      return;
    }
    if(!grid.querySelector('.cc-map') || grid.dataset.lang!==LANG || grid.dataset.reg!==reg){
      grid.dataset.lang=LANG; grid.dataset.reg=reg;
      grid.innerHTML=ccBuildMap(null, reg);
    }
    ccPaintMap();
    return;
  }
  grid.style.display='none'; cards.style.display='';
  // Only cards whose country has a ping on the map can be taken: the career
  // runs out of Europe, and every division table we have is European.
  //
  // And only as they stand now: the newest 2026 card per person, the same
  // roster the career plays against. This used to walk the whole history —
  // one card per handle, whichever came first — and the user read the result
  // off the screen: Vico and Setty at 99 (peak cards from older seasons),
  // Kiryache who last played in 2021, and S1neD at the meme 101. A career
  // starts as somebody is, not as they once were.
  /* Берётся вся сцена региона, без фильтра по пингу.
     Пинг важен только созданному игроку, который выбирает страну. У взятой карточки своя страна и бонуса за пинг нет (_pingEdge:0, ccRegionReady).
     С фильтром из Европы в NA Central оставалось 34 из 601, в Бразилии 15 из 631, в Азии 21 из 538, без Peterbot и Clix.
     Страна тоже не обязательна: у 146 европейцев её в данных нет. */
  const list=[];
  careerRosterNowEU().forEach(p=>{
    list.push({p, code:ccCodeForNat(p.nat), ovr:p._ovr, mate:ccMateNow(p)});
  });
  list.sort((a,b)=>b.ovr-a.ovr);
  /* Вся сцена, а не первые двести двадцать.
     Потолок стоял ещё с тех пор, когда список был поиском по всей истории и
     упирался в тысячи карточек. Сейчас в нём одна карточка на человека за этот
     год, и потолок режет по живому: в дивизионе 1 Европы 346 человек, в окно
     помещался 171, за бортом оставалось 175 — включая тех, кто играл Плей-Ин.
     Его сообщение, 21 августа: «почему не все див 1 игроки и которые были в
     playin в выборе игроков». */
  const shown=list.filter(x=>!q || x.p.handle.toLowerCase().includes(q));
  cards.innerHTML = shown.length ? shown.map(x=>{
    const url=photoURL(x.p);
    const on = CC.card && CC.card.handle===x.p.handle ? ' on' : '';
    return `<button class="cc-card${on}" onclick="ccPickCard('${jsq(x.p.handle)}')">
      ${url?`<img class="cc-card-ph" src="${url}" alt="">`:`<span class="cc-card-ph"></span>`}
      <span class="cc-card-in">
        <span class="cc-card-n">${cardFlag(x.p,13)}${esc(x.p.handle)}<span class="cc-card-in-ico" title="${esc(L()['ccInput_'+ccProInput(x.p)]||'')}">${ccInputIcon(ccProInput(x.p))}</span>${ccTraitTag(x.p.handle)}</span>
        <span class="cc-card-o">${x.p.org ? esc(x.p.org) : L().ccFreeAgent}</span>
        ${x.mate ? `<span class="cc-card-mate">${L().ccMateNow(esc(x.mate))}</span>` : ''}
        ${ccProMediaHTML(x.p)}
      </span>
      <span class="cc-card-r">${x.ovr}</span></button>`;
  }).join('') : `<div class="cc-note">${L().ccNoCards}</div>`;
}

/* С кем этот человек играет сейчас.

   Правка: в поиске игрока рядом с рейтингом должно стоять и
   то, кто у него сейчас тиммейт. Выбирая, кем играть, ты выбираешь и состав,
   а список показывал только клуб и число.

   Берётся с САМОЙ карточки, а не из общей таблицы дуо: в наборах 137 ников
   заняты дважды, и таблица по голому нику отдала бы европейцу напарника его
   тёзки из другой сцены (см. tools/check-nat-namesakes.js). Карточка одна и
   принадлежит одному человеку.

   Стадия берётся самая глубокая из тех, что на карточке: гранд-финал говорит
   про состав вернее, чем плей-ин, — до финала доходят с тем, с кем играют. */
const CC_MATE_STAGE={Gf:6, Final:6, DivFinal:5, Lcq:4,
                     Heat4:3, Heat3:3, Heat2:3, Heat1:3, Playin:2, Open:1};
function ccMateNow(card){
  if(!card) return null;
  /* Состав — по всем картам человека за год и в размере сезона: в 2025-м это трио
     («не пишет в трио вот это» — скриншот: у Pollo стояло «Now with
     Peterbot», а он в трио с Peterbot и Acorn). Самая новая карта года (Лион) записей
     состава не несёт — читаются карты стадий. */
  const seats=(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create' && typeof CC!=='undefined' && CC)
    ? (ccYearRosterSize(CC.year)-1) : careerMateSeats();   // 2024 — дуо, как 2026
  const real=ccRealMatesOf(card, seats);
  if(real.length) return real.map(m=>m.handle).join(', ');
  let best=null, rank=-1;
  rosterEntriesOf(card).forEach(function(e){
    const r=CC_MATE_STAGE[e.stage]!=null ? CC_MATE_STAGE[e.stage] : 0;
    if(r<=rank) return;
    const other=(e.entry.duo||[]).filter(h=>hKey(h)!==hKey(card));
    if(!other.length) return;
    rank=r; best=other;
  });
  // В трио их двое — тогда через запятую, потому что это и есть состав.
  return best ? best.join(', ') : null;
}
function ccPickCountry(code){ CC.country=code; CC_MAP_OPEN=false; ccRenderList(); ccSync(); }
let CC_MAP_OPEN=false;
function ccMapState(){
  const p=document.getElementById('ccMapPanel'); if(!p) return;
  const on=CC.mode==='rookie';
  p.classList.toggle('cc-compact', on && !CC_MAP_OPEN);
  p.classList.toggle('cc-float', on && CC_MAP_OPEN);
  const scr=document.getElementById('screen-career-create'); if(scr) scr.classList.toggle('cc-mapopen', on && CC_MAP_OPEN);
  const b=document.getElementById('ccMapBtn'); if(!b) return;
  const T=L();
  b.innerHTML=CC.country
    ? ccFlagImgs(ccFlagEmoji(CC.country))+'<b>'+esc(ccCountryName(CC.country))+'</b><span>'+esc(T.ccMapChange||'')+'</span>'
    : '<b>'+esc(T.ccPickCountry||'')+'</b><span>'+esc(T.ccMapOpen||'')+'</span>';
}
function ccMapOpen(){ CC_MAP_OPEN=true; ccRenderList(); }
function ccMapClose(){ CC_MAP_OPEN=false; ccMapState(); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && CC_MAP_OPEN){ ccMapClose(); } });
/* СВОИ СТАТЫ НА СОЗДАНИИ (его просьба 29.09: «чтоб игрок мог себе сам статы, которые хочет
   поставить»). Было: десять очков по +0.5 к стату, только вверх. Стало: шесть строк «− число +»
   — любой стат можно опустить и отдать в другой, плюс небольшой запас сверху.

   Бюджет — в очках, цена «+1» у стата пропорциональна его весу в общем рейтинге (ATTR_W × 50:
   стрельба 11, выносливость и выживание по 10, опыт 5, клатч 6, стабильность 8). Поэтому
   переложить опыт в стрельбу — не бесплатный рост рейтинга: минус опыта возвращает 5, плюс
   стрельбы стоит 11. Запас CC_SP_START = 50 очков — это +1 к общему рейтингу, как и прежние
   десять очков по +0.5 (их среднее — +0.8…+1.1). Каждый стат — в пределах ±CC_SP_SPAN от
   шаблона роли и 35…99. CC.spa хранит сдвиг каждого стата (может быть отрицательным). */
/* 29.10 (его «поинтов распределения 50, мб просто дать 5 и всё»): пять очков, «+1» любому стату — одно очко, опущенный
   стат возвращает одно. Коридор ±5 к стату: при цене 1 и коридоре ±20 перекладка опыта в стрельбу давала до +3 к рейтингу,
   так — около +1,5, как прежние +1 с весами. */
const CC_SP_START=5, CC_SP_SPAN=5;
function ccSpaCost(k){ return 1; }
function ccSpaLeft(){
  const a=CC.spa||{};
  return CC_SP_START - ATTR_KEYS.reduce((s,k)=>s+(a[k]||0)*ccSpaCost(k), 0);
}
// Шаблон роли на текущей полосе — от него отсчитываются сдвиги (то же, что строит ccMakePlayer).
function ccSpaBase(){ return ccRookieAttrs(ccBand(CC.div, CC.region), CC.role); }
/* Без ограничений (его слово 29.09: «прям дать доступ, чтоб мог сделать игрок сразу 99 99 99
   99 99 99»). Переключатель CC.spaFree: бюджета и коридора ±20 нет, любой стат 35…99 — кнопками,
   числом в поле или «Все 99». Общий рейтинг считается из статов как обычно, то есть 99 везде —
   это 99 общего. По умолчанию выключено: обычная раздача с бюджетом остаётся. */
/* Во вкладке статы хранятся ЗНАЧЕНИЯМИ (CC.spaAbs), а не сдвигом от шаблона роли: смена
   дивизиона или роли их не двигает. После каждой правки дивизион встаёт по рейтингу
   (ccDivisionFor, как у взятой карточки): 99-му напарников ищут в Дивизионе 1, где живут
   настоящие 90+, — ниже потолок дивизиона (ccDivCeil) держит поиск около 60 (его вопрос 29.09
   «почему я 99 не могу тимейта найти по уровню»). Чип дивизиона можно сменить руками. */
function ccSpaFreeVal(k){ const a=CC.spaAbs||{}; return a[k]!=null ? a[k] : ccSpaBase()[k]; }
function ccSpaFreeDiv(){
  const a={}; ATTR_KEYS.forEach(k=>{ a[k]=ccSpaFreeVal(k); });
  const ovr=Math.round(ATTR_KEYS.reduce((s,k)=>s+a[k]*ATTR_W[k], 0));
  const d=ccNoDivisions() ? CC.div : ccDivisionFor(ovr);
  if(d!==CC.div){ CC.div=d; ccRenderChips(); }
}
function ccSpaSet(k, val){
  CC.spaAbs=CC.spaAbs||{}; CC.spaAbs[k]=clamp(Math.round(+val||0), 35, 99);
  ccSpaFreeDiv(); ccSpaRender(); ccSync();
}
function ccSpaAll(val){ CC.spaAbs={}; ATTR_KEYS.forEach(k=>{ CC.spaAbs[k]=clamp(val,35,99); }); ccSpaFreeDiv(); ccSpaRender(); ccSync(); }
function ccSpaAdd(k, d){
  if(CC.spaFree){ ccSpaSet(k, ccSpaFreeVal(k)+d); return; }
  CC.spa=CC.spa||{};
  const v=(CC.spa[k]||0)+d, base=ccSpaBase()[k];
  if(base+v<35 || base+v>99) return;
  if(!CC.spaFree && Math.abs(v)>CC_SP_SPAN) return;
  if(!CC.spaFree && d>0 && ccSpaLeft()<ccSpaCost(k)) return;
  CC.spa[k]=v;
  ccSpaRender();
  // Сдвиг ложится в карточку сразу: превью строится через ccMakePlayer, а тот
  // прогоняет статы сквозь ccSpaApply — клик виден на овере в ту же секунду.
  ccSync();
}
function ccSpaReset(){ CC.spa={}; CC.spaAbs={}; if(CC.spaFree) ccSpaFreeDiv(); ccSpaRender(); ccSync(); }
/* Сдвиги, вложенные в статы; овер и лучший стат пересчитаны. Одна арифметика на превью
   (ccMakePlayer) и на старт (ccStart) — карточка на экране и в сейве одним числом. */
function ccSpaApply(attrs){
  const a=CC.spa||{}, abs=CC.spaFree ? (CC.spaAbs||{}) : {};
  ATTR_KEYS.forEach(k=>{ if(abs[k]!=null) attrs[k]=abs[k]; else if(a[k]) attrs[k]=clamp(attrs[k]+a[k], 35, 99); });
  attrs.ovr=Math.round(ATTR_KEYS.reduce((s,k)=>s+attrs[k]*ATTR_W[k], 0));
  attrs.bestAttr=bestPlayAttr(attrs);
  return attrs.ovr;
}
function ccSpaRender(){
  const rows=document.getElementById('ccSpRows');
  if(!rows) return;
  CC.spa=CC.spa||{};
  const free=!!CC.spaFree, left=ccSpaLeft(), base=ccSpaBase(), T=L();
  const hint=document.querySelector('#ccSpField .cc-spa-note span');
  if(hint) hint.textContent = free ? T.ccSpFreeHint : T.ccSpCreateHint;
  const any=ATTR_KEYS.some(k=>CC.spa[k]) || (free && Object.keys(CC.spaAbs||{}).length>0);
  const head=free
    ? `<button type="button" class="cc-spa-reset" onclick="ccSpaAll(99)">${T.ccSpAll99}</button>`
    : `<em>${T.ccSpLeft} <b>${left}</b></em>`;
  rows.innerHTML=`<div class="cc-spa-head">${head}${any ? ` <button type="button" class="cc-spa-reset" onclick="ccSpaReset()">${T.ccSpReset}</button>` : ''}</div>
    <div class="cc-spa-grid">${ATTR_KEYS.map(k=>{
      const v=free ? ccSpaFreeVal(k) : clamp(base[k]+(CC.spa[k]||0), 35, 99), n=v-base[k], cost=ccSpaCost(k);
      // Полное название стата (его Notion 29.10: «мб полные названия сделать, место же хватает»); нет — сокращение.
      const K=k.charAt(0).toUpperCase()+k.slice(1), name=T['attr'+K+'Full'] || T['attr'+K];
      const canUp=v<99 && (free || (n<CC_SP_SPAN && left>=cost)), canDown=v>35 && (free || n>-CC_SP_SPAN);
      const val=free
        ? `<input class="cc-spa-in" type="number" inputmode="numeric" min="35" max="99" value="${v}" onchange="ccSpaSet('${k}',this.value)" aria-label="${name}">`
        : `<b class="cc-spa-val">${v}</b>`;
      return `<div class="cc-spa-row${n>0?' up':n<0?' down':''}">
        <span class="cc-spa-name">${CC_ATTR_ICON[k]||''} ${name}</span>
        <button type="button" class="cc-spa-btn" onclick="ccSpaAdd('${k}',-1)"${canDown?'':' disabled'} aria-label="−1 ${name}">−</button>
        ${val}
        <button type="button" class="cc-spa-btn" onclick="ccSpaAdd('${k}',1)"${canUp?'':' disabled'} aria-label="+1 ${name}">+</button>
        <span class="cc-spa-cost"></span>
      </div>`;
    }).join('')}</div>`;
}

function ccPickCard(handle){
  const p=careerRosterNowEU().find(x=>x.handle===handle);
  if(!p) return;
  CC.card=p;
  CC.country=ccProHomeOf(p.handle) || ccCodeForNat(p.nat);
  CC.photo=null;
  // A suggestion, not a lock — the chips stay live.
  CC.div=ccCardStartDiv(p);
  document.getElementById('ccNick').value=p.handle;
  /* Their age, not the default sixteen.

     Sixteen is the right answer for a player who is being made up and the wrong
     one for somebody who exists: the screen was offering to start a career as
     Th0masHD, born in 2002, and printing 16 in the box next to his photograph.
     Worked out on the day the career would begin, from the table of real
     birthdays, and left at sixteen for the cards nobody has looked up.

     The field goes read-only with it, for the same reason the nickname does: you
     play as them, you do not decide how old they are. */
  const born=ccBornOf(p.handle);
  const real=born ? ccAgeOn(born, careerStartDay()) : null;
  const box=document.getElementById('ccAge');
  box.value = real!=null ? String(real) : '16';
  /* And where nobody knows, you decide.

     The table is eighty-one names out of nine hundred, because most of this
     roster has no public date of birth anywhere - it reaches down to whoever
     played one Reload Open. Locking those cards at sixteen would be inventing
     the same fact the table refuses to invent, only worse: silently, and always
     the same number.

     So a card the roster has a birthday for arrives with it and the box is
     theirs, not yours; a card nobody has written up arrives at sixteen with the
     box open, and the age is a thing you chose about a person you chose. */
  box.disabled = real!=null;
  /* И день рождения карточки виден там же, где его вводят себе.

     Он у неё уже есть — CC_BORN, восемьдесят один настоящий день, — и именно
     из него посчитано число в соседнем поле. Показать его честнее, чем прятать:
     иначе экран пишет «настоящая дата рождения» и не показывает какая. Поле
     закрыто по той же причине, что и число: это факт о человеке, а не выбор. */
  ccBornSet(real!=null ? born : null);
  const bornBox=document.getElementById('ccBorn');
  if(bornBox) bornBox.disabled = real!=null || !!p.handle;
  // Пол взятой карточки — не выбор. См. ccSexPick.
  CC.sex='m';
  ccSexRender();
  ccRenderPhoto();
  ccRenderChips();
  ccRenderList();
  ccSync();
}

function ccPickPhoto(){ document.getElementById('ccPhotoInput').click(); }
/* Portrait is downscaled before it goes into the save. A phone photo as a data
   URL is several MB, bigger than the whole localStorage quota, so the write threw
   QuotaExceededError and the career silently stopped saving. Long edge down to
   CC_PHOTO_MAX, re-encoded as JPEG on a canvas (CSS sizing would not change what
   is stored). If the canvas fails (format, tainted), keep the original. */
const CC_PHOTO_MAX=320, CC_PHOTO_Q=0.85;
function ccPhotoShrink(dataUrl, then){
  const img=new Image();
  img.onload=function(){
    try{
      const w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
      if(!(w>0 && h>0)) return then(dataUrl);
      const k=Math.min(1, CC_PHOTO_MAX/Math.max(w, h));
      const c=document.createElement('canvas');
      c.width=Math.max(1, Math.round(w*k)); c.height=Math.max(1, Math.round(h*k));
      const ctx=c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const out=c.toDataURL('image/jpeg', CC_PHOTO_Q);
      then(out && out.length<dataUrl.length ? out : dataUrl);
    }catch(e){ then(dataUrl); }
  };
  img.onerror=function(){ then(dataUrl); };
  img.src=dataUrl;
}
function ccPhotoChosen(input){
  const f=input.files && input.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ ccPhotoShrink(String(r.result||''), function(url){
    CC.photo=url; ccRenderPhoto(); }); };
  r.readAsDataURL(f);
  input.value='';
}
function ccRenderPhoto(){
  const el=document.getElementById('ccPhoto');
  const url = CC.photo || (CC.card ? photoURL(CC.card) : null);
  el.innerHTML = url ? `<img src="${url}" alt="">` : `<span>${L().ccPhotoHint}</span>`;
}

const CC_AGE_MIN=13, CC_AGE_MAX=50;
/* Что дают возраст и страна — словами, прямо у выбора (вместо строк PNG/AGE на карточке).
   Только построенному: взятой карточке и креатору прибавок нет (см. ccStart). */
function ccGainNotes(){
  const T=L(), built=CC.mode==='rookie' && !ccNoEdgeNow();
  const ag=document.getElementById('ccAgeGain'), pg=document.getElementById('ccPingGain');
  if(ag){
    const age=parseInt((document.getElementById('ccAge')||{}).value,10);
    const e=isFinite(age) ? ccAgeEdge(age) : 0;
    ag.style.display=built ? '' : 'none';
    ag.innerHTML=T.ccAgeGain(isFinite(age)?age:'-', (e>0?'+':'')+e, CC_AGE_EDGE, CC_AGE_PEAK, CC_AGE_FADE);
  }
  if(pg){
    pg.style.display=built ? '' : 'none';
    const ms=CC.country ? ccPingOf(CC.country, CC.region) : null;
    pg.innerHTML=CC.country && ms!=null
      ? T.ccPingGain(esc(ccCountryName(CC.country)||CC.country), ms, '+'+ccPingEdge(ms), CC_PING_EDGE, CC_PING_FREE, CC_PING_MAX)
      : T.ccPingGainNone(CC_PING_EDGE, CC_PING_FREE, CC_PING_MAX);
  }
}
function ccSync(){
  ccGainNotes();
  const nick=(document.getElementById('ccNick').value||'').trim();
  const age=parseInt(document.getElementById('ccAge').value,10);
  const warn=document.getElementById('ccAgeWarn');
  if(warn){
    const bad = !isFinite(age) ? L().ccAgeEmpty
      // split/join, not replace: the too-old line names the limit twice and a
      // string replace would only fill the first one in.
      : age<CC_AGE_MIN ? L().ccAgeTooYoung.split('{N}').join(CC_AGE_MIN)
      : age>CC_AGE_MAX ? L().ccAgeTooOld.split('{N}').join(CC_AGE_MAX) : '';
    /* A locked box needs a reason and an open one on a real card needs one more:
       the player is about to choose a fact about somebody who exists, and should
       know that is what they are doing. */
    /* У креатора возраст тоже не выдуман: дат рождения у стримеров мод не
       держит, поэтому здесь та же строка, что у карточки без известной даты —
       «решаешь ты». */
    const note = bad ? bad
      : CC.mode==='creator' ? (CC.creator ? L().ccAgeUnknown : '')
      : CC.mode!=='card' || !CC.card ? ''
      : ccBornOf(CC.card.handle) ? L().ccAgeKnown
      : L().ccAgeUnknown;
    warn.textContent=note;
    warn.style.display = note ? 'block' : 'none';
    warn.classList.toggle('cc-warn-soft', !bad && !!note);
    document.getElementById('ccAge').classList.toggle('bad', !!bad);
  }
  /* Пинг меряется до сервера своего региона, а не всегда до европейского.
     ccPingOf принимает регион с тех пор, как играть стало можно из всех семи;
     эти вызовы про регион забыли, поэтому у американца пинг выходил null —
     и на экране стояло «null ms», а в сейве пустое поле. Всплыло, когда
     список выбора перестал прятать неевропейцев. */
  const ping=CC.country?ccPingOf(CC.country, CC.region):null;
  const ok = CC.mode==='creator'
    ? (!!CC.creator && age>=CC_AGE_MIN && age<=CC_AGE_MAX)
    : (nick.length>=2 && age>=CC_AGE_MIN && age<=CC_AGE_MAX && CC.country
       && (CC.mode==='rookie' || CC.card));
  document.getElementById('ccStart').disabled=!ok;
  const out=document.getElementById('ccReadout');
  ccRenderCard();
  /* Креатору страну не выбирают: он существует, страна у него своя, а прибавки
     за пинг у него нет — та же логика, что у взятой карточки. Строка под
     карточкой говорит про его аудиторию, потому что это и есть его отличие. */
  if(CC.mode==='creator'){
    const f=CC.creator ? ccProAmFollowers(CC.creator) : 0;
    out.innerHTML = CC.creator
      ? `<span><em>${L().ccRoRegion||''}</em>${esc(regionName(CC.region||'EU'))}</span>`+
        `<span><em>${L().xFollowers}</em>${f?ccNum(f):'-'}</span>`
      : `<span>${L().ccPickCreator}</span>`;
    return;
  }
  if(!CC.country){
    /* Взятая карточка без страны (у части игроков прошлых лет флага нет ни в одном источнике):
       карта стран в режиме карточек скрыта, и старт вставал намертво. Страну выбирают здесь. */
    if(CC.card){
      const opts=ccCountriesHere(CC.region).map(x=>`<option value="${esc(x.c)}">${esc(ccCountryName(x.c)||x.c)}</option>`).join('');
      out.innerHTML=`<span>${L().ccPickCountry}</span><select class="cc-country-sel" onchange="ccPickCountry(this.value)">`+
        `<option value="">-</option>${opts}</select>`;
      return;
    }
    out.innerHTML=`<span>${L().ccPickCountry}</span>`; return;
  }
  // What the two are worth, said before the career starts — and they are worth
  // nothing to a taken card, so the readout promises nothing there either.
  const built=CC.mode==='rookie' && !ccNoEdgeNow();
  const pingEdge=built?ccPingEdge(ping):0, ageEdge=built?ccAgeEdge(age):0;
  const plus=v=>(v>0?'+':'')+(Math.round(v*10)/10);
  out.innerHTML =
    `<span><em>${L().ccRoCountry}</em><img src="flags/w20/${ccCountryOf(CC.country)}.png" alt="" `+
      `style="width:18px;vertical-align:-2px;border-radius:2px;margin-right:6px;">${ccCountryName(CC.country)}</span>`+
    /* Пинг — только когда он измерен.
       У взятой карточки он не измерен и не может быть: она носит страну, а
       карта своего региона местами размечена не странами, а штатами — до «США»
       из таблицы NA Central расстояния нет. Прибавка за пинг у такой карточки и
       так ноль (см. строку выше), так что строка обещала бы «null ms» и ничего
       больше. У созданного игрока, который страну выбирает, всё как было. */
    (ping!=null
      ? `<span><em>${L().ccRoPing}</em>${ping} ms${pingEdge?` <b class="cc-ro-plus">${plus(pingEdge)}</b>`:''}</span>`
      : '')+
    `<span><em>${L().ccAge}</em>${isFinite(age)?age:'-'}${ageEdge?` <b class="cc-ro-plus${ageEdge<0?' bad':''}">${plus(ageEdge)}</b>`:''}</span>`+
    `<span><em>${L().ccRoRole}</em>${L()[CC.card?attrsFor(CC.card).roleKey:CC.role]}</span>`+
    // Taking a card takes their duo with it — said here, before the start.
    (CC.card ? (()=>{ const m=ccRealMateOf(CC.card);
      return m ? `<span><em>${L().ccRoDuo}</em>${esc(m.handle)} (${m._ovr})</span>` : ''; })() : '')+
    // Год без дивизионов ступени не показывает. См. ccNoDivisions.
    (ccNoDivisions() ? '' : `<span><em>${L().ccRoDiv}</em>${CC.div}</span>`);
  /* Рейтинга здесь больше нет, и это правка.

     Строка печатала attrsFor(card).ovr — базу, — а на лице карточки в
     полуметре выше стоит shownOvr, то есть та же база плюс прибавки за пинг и
     возраст. Одна карточка, два числа, и меньшее из них подписано словом
     «Рейтинг». У созданного игрока было ещё хуже: там стояла полоса дивизиона,
     то есть вообще не его число.

     Карточка своё число показывает сама и объясняет его подсказкой
     (cardOvrFull). Второму рядом сказать нечего. */
}

// The person a taken card actually plays with: the duo written on the card's
// own roster entries — the newest 2026 card, so the pairing is this season's —
// resolved to that partner's own newest card. Null when the card records no
// whole duo, and the auto-assignment then does what it always did.
/* Все, с кем карточка записана в составе — до seats человек. Дуо-запись даёт
   одного, трио-запись (наборы 2025-го) — двоих: отзыв, «когда в
   2025 выбираешь игрока, он без триоса сразу, не как в дуо». */
/* Карты человека по нику — индекс, а не PLAYERS.filter на каждый вызов.
   Отзыв: «лагает когда переключаю регионы в 2024 году». Замер: список
   Европы 2024-го — 1063 строки, ccMateNow на каждую → 1.2 с; в 2025/2026 та же секунда.
   Пересобирается, если ростер вырос (карты добавляются на старте страницы). */
let CC_CARDS_BY_KEY=null, CC_CARDS_BY_KEY_N=0;
function ccCardsByKey(){
  if(CC_CARDS_BY_KEY && CC_CARDS_BY_KEY_N===PLAYERS.length) return CC_CARDS_BY_KEY;
  const m=new Map();
  PLAYERS.forEach(p=>{ const k=hKey(p); const a=m.get(k); if(a) a.push(p); else m.set(k, [p]); });
  CC_CARDS_BY_KEY=m; CC_CARDS_BY_KEY_N=PLAYERS.length;
  return m;
}
// И сцена по нику — тем же индексом, пока массив сцены тот же.
const CC_NOW_BY_KEY=new WeakMap();
function ccNowByKey(roster){
  let m=CC_NOW_BY_KEY.get(roster);
  if(!m){ m=new Map(); roster.forEach(p=>{ const k=hKey(p); if(!m.has(k)) m.set(k, p); }); CC_NOW_BY_KEY.set(roster, m); }
  return m;
}
function ccRealMatesOf(card, seats){
  if(!card) return [];
  const me=hKey(card), out=[], seen=new Set([me]);
  const want=Math.max(1, seats||1);
  /* Записи состава лежат на карточках стадий (плей-ин, LCQ, финал — _t1/_m1…), а самая
     свежая карточка года может быть без них (Лион 2025 — отдельная карта). Поэтому
     смотрим все карточки этого человека за тот же год, от новейшего набора к старому. */
  const order=c=>({t3:3, t2:2, t1:1, m2:2, m1:1, f3:3, f2:2, f1:1}[String(c.cardSet||'')] || 0);
  const yr=ccCardYear(card);
  const mine=(ccCardsByKey().get(me)||[]).filter(p=>p!==card && (p.region||'')===(card.region||'') && ccCardYear(p)===yr)
    .sort((a,b)=>order(b)-order(a));
  const entries=[]; [card].concat(mine).forEach(c=>rosterEntriesOf(c).forEach(e=>entries.push(e)));
  const now=ccNowByKey(careerRosterNowEU());
  for(const {stage, entry} of entries){
    if(stage==='DivFinal') continue;
    if(entry.duo.length!==want+1) continue;
    entry.duo.map(h=>hKey(h)).forEach(k=>{
      if(seen.has(k) || out.length>=want) return;
      const mate=now.get(k);
      if(mate){ seen.add(k); out.push(mate); }
    });
    if(out.length>=want) break;
  }
  return out;
}
function ccRealMateOf(card){
  if(!card) return null;
  const me=hKey(card);
  for(const {stage, entry} of rosterEntriesOf(card)){
    /* Кроме финалов недель. Один вечер вместе — это не постоянное дуо: люди
       собираются на неделю и расходятся, и в дивизионе их четыре подряд. Когда
       они здесь считались, каждый в дивизионе 1 читался занятым, свободных не
       оставалось ни одного, и режим не мог посадить напарника вообще никому —
       кнопки «играть» не было. Сезон человека задаёт Мейджор, по нему и дуо. */
    if(stage==='DivFinal') continue;
    if(entry.duo.length!==2) continue;
    const other=entry.duo.map(h=>hKey(h)).find(k=>k!==me);
    if(!other) continue;
    const mate=careerRosterNowEU().find(p=>hKey(p)===other);
    if(mate) return mate;
  }
  return null;
}

// Where a taken card would naturally sit — the same bands the rookie table uses,
// read backwards. It is only a suggestion now: in card mode you may start
// anywhere, so a 92 can go down to Division 5 and walk over it.
/* Настоящий Дивизион 1 в 2026-м у тех, кого рейтинг ставит ниже: списков Д1 у Epic в открытом доступе нет,
   только топ-50 еженедельных финалов. Здесь люди, про которых это известно. */
const CC_REAL_D1_2026={'BR|jerok':1};
function ccCardStartDiv(p){
  if(ccPickedYear()===2026 && CC_REAL_D1_2026[p.region+'|'+String(p.handle||'').toLowerCase()]) return 1;
  return ccDivisionFor(attrsFor(p).ovr);
}
function ccDivisionFor(ovr){
  if(ovr>=ccBand(1)) return 1;
  if(ovr>=ccBand(2)) return 2;
  if(ovr>=ccBand(3)) return 3;
  if(ovr>=ccBand(4)) return 4;
  return 5;
}

function ccStart(){
  // A taken card keeps its name whatever the field holds.
  const nick=CC.mode==='card' && CC.card ? CC.card.handle
           : CC.mode==='creator' && CC.creator ? CC.creator
           : (document.getElementById('ccNick').value||'').trim();
  /* КАРЬЕРА ЗА КОНТЕНТ-МЕЙКЕРА (правка).

     Это не третий вид новичка, а третий вид ЛИЧНОСТИ: человек существует, его
     не переименовывают и ему не дарят статы — рейтинг у всех креаторов один и
     тот же (CC_PROAM_CREATOR_OVR), как и в Про-Аме. Прибавок за страну и
     возраст нет по той же причине, что и у взятой карточки.

     Аудитория переезжает НАСТОЯЩАЯ: подписчики Twitch — это снятое с самого
     Twitch число, а известность в сцене считается той же долей, которой мод уже
     меряет чужую аудиторию на коллабе (CC_PROAM_REACH_SHARE). Отсюда и выходит
     честная расстановка: у крупнейших каналов старт вдвое выше дивизиона 1,
     у маленьких — почти с нуля, и до приглашения на Про-Ам им ещё расти. */
  const creator = CC.mode==='creator' && CC.creator ? CC.creator : null;
  const age=parseInt(document.getElementById('ccAge').value,10);
  const ping=ccPingOf(CC.country, CC.region);
  const card=CC.card;
  let ovr = card ? attrsFor(card).ovr : creator ? CC_PROAM_CREATOR_OVR : ccBand(CC.div, CC.region);
  /* Ступень, на которой карьера СТОИТ, — не всегда та полоса, с которой она
     начинается. Год без дивизионов (ccNoDivisions) стоит на верху лестницы,
     которой нет: сцена целиком, настоящие имена, настоящие напарники. Полоса
     при этом сделала своё дело строкой выше — она задала стартовый рейтинг. */
  const startDiv = ccNoDivisions() ? 1 : CC.div;
  const role = card ? attrsFor(card).roleKey : CC.role;
  const attrs = card ? null : ccRookieAttrs(ovr, role);
  /* Статы, выставленные на этом экране, ложатся в сейв прямо сейчас — один раз и
     навсегда. Та же ccSpaApply, что красила превью, — сейв не может разойтись с экраном. */
  // Очки прокачки — только построенному: настоящему человеку статы не дарят.
  if(!card && !creator) ovr=ccSpaApply(attrs);
  const save={
    v:1,
    player:{
      nick, age, source:CC.mode,
      // Бинды построек HUD: стена, пол, лестница, конус (поле на экране создания, пустое — подсказка).
      binds: ccBindsRead(),
      // Пол: выбор построенного, факт взятого. См. ccSexPick.
      sex: (card || creator) ? 'm' : (CC.sex||'m'),
      // Флаг личности: по нему карточка красится в Exotic (см. shownRarity) и
      // по нему же видно, что это карьера за живого стримера.
      creator: !!creator,
      // Stored as zero for a taken card, so the save says the same thing the
      // screen did. careerCard decides this again on every read, off source
      // and handle, so an old save cannot keep an edge this rule withdrew.
      /* A state is picked for its connection and nothing else — his rule,
         20 August. Clicking California sets the milliseconds California has and
         leaves the player American: the country on the card, the flag beside the
         nickname, the rent and the passport are the United States, because a
         state is not a country and the mode has nowhere to put one. */
      country:ccCountryOf(CC.country), countryPing:ping,
      /* День рождения, если его ввели. Возраст рядом остаётся тем, чем был —
         числом, — а день превращает его в дату, на которую сцена умеет
         отвечать: см. careerBirthdays и ccPlayerAge. Пусто у всех, кто его не
         вводил, и у каждого старого сейва, и это ничего не меняет. */
      born: CC.born || null,
      closeRangeEdge: (card || creator || ccNoEdgeNow()) ? 0 : ccPingEdge(ping),
      // Прибавка за пинг и возраст выключена на экране создания — и на всю карьеру (ccEdgeOff).
      noEdge: (!card && !creator && ccNoEdgeNow()) ? true : undefined,
      // The region the career competes in. A rookie's is always Europe - the
      // country map is - and a taken card's is whichever one it was taken from.
      region: CC.region||'EU', ovr, role, attrs,
      input: card ? ccProInput(card) : (CC.input==='pad' ? 'pad' : 'kbm'),
      // «Свои статы до 99»: выставленное — нижний предел, ниже результаты статы не опускают
      // (его скрин 29.09: «я везде выбирал 99» — через пару вечеров стало 98.6). См. ccAttrFloor.
      attrsFloor: (!card && !creator && CC.spaFree && attrs) ? ATTR_KEYS.reduce((o,k)=>(o[k]=attrs[k], o), {}) : undefined,
      ageEdge: (card || creator || ccNoEdgeNow()) ? 0 : ccAgeEdge(age),
      // Where this career is from, which is what rent is measured against. A
      // career that starts in NA Central is not renting NA Central. See ccRentNow.
      homeRegion: CC.region||'EU',
      photo: CC.photo || null,
      // A taken card is stored by identity, not by copy, so the roster stays
      // the single source of truth for its attributes.
      handle: card?card.handle:null, cardRegion: card?card.region:null, nat: card?card.nat:null
    },
    // A career starts in the duo year; the trio one is season two. See
    // careerSquadSize for why the shape is written down rather than derived.
    career:{season:1, size:(ccYearRosterSize(CC.year)), year:ccPickedYear(), year0:ccPickedYear(),
            diff:(CC.diff||'easy'), day:null,
            // Сезон старта внутри года (ccPickedStart): первый день — с него, см. careerStartDay.
            startFrom:(ccPickedStart()||{}).from || undefined,
            // Год без лестницы заводится на её верху: соперники, имена и
            // напарники — сцена целиком, как в Дивизионе 1. См. ccNoDivisions.
            // Чип при этом остаётся стартовым рейтингом и в ovr уже учтён.
            division: startDiv,
            // A career that starts in Division 1 starts known: that room is
            // 300 people the scene watches, and nobody is in it unread.
            // Известность — по выбранной полосе, а не по ступени без лестницы:
            // новичок 2024-го начинается никем, как начинался бы в пятой.
            reach: creator ? Math.round((ccCreatorSocialAt(creator, ccPickedYear())[0]||0)*CC_PROAM_REACH_SHARE)
                  : Math.max(ccProSocialStart(card)[2]||0, CC.div===1 ? CC_REACH_D1 : 0),   // про 2026 — его настоящие подписчики X
            // Подписчики Twitch у креатора — настоящие, снятые с самого Twitch; в прошлом году — числа того года (ccCreatorSocialAt).
            twitch: creator ? (ccCreatorSocialAt(creator, ccPickedYear())[0]||0) : ccProSocialStart(card)[0],
            // И YouTube про 2026 года — его настоящий канал (ccProSocialStart, CC_PRO_SOCIAL).
            yt: creator ? ccCreatorYt(creator) : ccProSocialYt(card),
            // Очки прокачки в карьере не живут: они розданы на экране
            // создания и уже лежат в статах. Правка.
            earnings:0, wages:0, tokens:[], log:[],
            /* Своя соль этой карьеры — см. ccCareerSeed. Без неё первые, кто
               написал в инбокс, были одни и те же в каждой новой карьере:
               бросок сеялся сезоном и днём, а они у всех одинаковые. */
            seed:Math.random().toString(36).slice(2,10)},
    // Taking a card takes the duo with it: you start with the partner they
    // really play with, off the card's own roster entries. A rookie, or a card
    // whose pairing the roster does not hold whole, starts alone and gets the
    // usual assignment at the first cup.
    // Состав приходит целиком: в трио-год (2025) — двое настоящих напарников по записи трио.
    partners:(()=>{
      if(!card) return [];
      const seats=(ccYearRosterSize(CC.year))-1;
      const mates=ccRealMatesOf(card, seats);
      return mates.map(m=>({handle:m.handle, cardRegion:m.region, patience:CAREER_PATIENCE_START,
                            since:ccAddDays(careerStartDay(), -CC_CHEM_DAYS)}));
    })(),
    partner:(()=>{
      const mate=card ? ccRealMateOf(card) : null;
      // A taken card arrives with the duo it really plays in, and that duo has
      // been one for a while: it starts on a season of chemistry rather than none.
      return mate ? {handle:mate.handle, cardRegion:mate.region, patience:CAREER_PATIENCE_START,
                     since:ccAddDays(careerStartDay(), -CC_CHEM_DAYS)} : null;
    })()
  };
  /* The jersey comes with the card.

     Taking Sky is playing Sky, and Sky is on All Gamers - the roster has carried
     the club since the Majors were read off their own standings, the card draws
     the crest, and the career started him as a free agent anyway. "Picked a
     player with an organisation and it is not there" is the screen saying so.

     The contract is the mode's own, not an invented one: careerOrgSalary at
     their rating, on the main roster because they are already on it, with the
     division's own objective. What it is not is an academy deal - an academy is
     for somebody unproven, and this is somebody the club already plays. */
  if(card && card.org){
    const tier=(careerOrgPool().find(o=>o.name===card.org)||{}).tier || Math.round(ovr);
    save.org={name:card.org, tier:tier, academy:false,
              salary:careerOrgSalary(tier, startDiv, save.career.reach, ovr),
              goal:careerOrgGoal(startDiv), cut:careerOrgCutFor(tier),
              since:1, paid:0, perk:null};
    save.career.orgs=[card.org];
  }
  /* Into the slot that was chosen, not into the first one.

     A player's report, 18 August: "when I try to make a second save it always
     overlaps my first save, so I always end up losing the 1st slot". This line
     was the whole of it. LS_CAREER is not the save key, it is slot one's key —
     LS_SLOT maps 1 to it and gives the others their own — and every other read
     and write in the mode goes through LS_SLOT(ccSlot()). Only the moment a
     career is created wrote the raw constant.

     careerSlotNew sets the active slot before opening creation, so the choice
     was already recorded correctly and this ignored it: starting a career in
     slot two saved it over slot one and left slot two empty. Two careers were
     never possible, and the first was destroyed by trying. */
  /* Первый день — по календарю ВЫБРАННОГО года: careerStartDay читает год с
     живой карьеры, поэтому сейв на миг становится ею. */
  { const was=CAREER; CAREER=save; save.career.day=careerStartDay();
    if(save.partner) save.partner.since=ccAddDays(save.career.day, -CC_CHEM_DAYS);
    (save.partners||[]).forEach(p=>{ p.since=ccAddDays(save.career.day, -CC_CHEM_DAYS); });
    // Пустой список — как его отсутствие: careerMigratePartners тогда возьмёт partner.
    if(!save.partners.length) delete save.partners;
    CAREER=was; }
  try{ ccLzDrop(LS_SLOT(ccSlotMine())); localStorage.setItem(LS_SLOT(ccSlotMine()), JSON.stringify(save)); }catch(e){}
  try{ ccSaveMarkAdopt(); }catch(e){}
  openCareerHub();
  /* И если карьеру заводили ради команды — сразу в лобби. Намерение ставит
     кнопка на карточке карьеры (careerMpNew / careerMpJoinNew) и сбрасывает
     оно же: одна попытка, дальше карьера обычная. Не дозвонились — ccMpEnter
     откатит командное состояние, и это останется одиночная карьера, о чём
     скажет плитка. */
  if(CC_MP_NEW){
    const want=CC_MP_NEW; CC_MP_NEW=null;
    // Гонка карьер — своя дверь: каждый играет СВОЮ карьеру, лобби только
    // сравнивает. См. careerRaceCreate / careerRaceJoin.
    if(want.race) (want.role==='b') ? careerRaceJoin(want.code) : careerRaceCreate();
    else if(want.role==='b') careerMpJoin(want.code);
    else careerMpCreate();
  }
}

/* ===== CAREER — the hub ====================================================
   The screen a career lives on between events. Layout follows the football
   career dashboard the design references: who you are along the top, a tab
   strip, a wide band for what is coming, tiles underneath.

   Everything on it is real. The calendar is generated from the season shape
   Epic actually runs — four cup weeks, a Major, four more, a Major, the Global
   Championship — and the Division 1 weeks carry the Performance Evaluation
   because that event is Division 1 only. Nothing here is a placeholder number:
   where a system does not exist yet the tile says so rather than inventing a
   figure. */

let CAREER=null;

/* ---- Three careers instead of one -------------------------------------------

   The mode held exactly one save, so trying a different player — a different
   country, a different starting division, an older beginner — meant deleting
   the career you had. Three slots, each a whole career, and the one you played
   last is the one the tile opens.

   The save that already exists is the first slot. Not copied into it, not
   migrated — the first slot's key IS the key the mode has always written, and
   the new ones sit beside it. A career somebody has played a season into is not
   something to move and hope, and the cheapest way to not lose it is to leave
   it exactly where it is. */
/* Шесть карьер, а было три. Отзыв: «может сделать больше
   сохранений». Слот №1 по-прежнему лежит в старом ключе (LS_SLOT), поэтому
   число можно менять, ничего не переписывая: новые слоты просто пустые. */
// 10 карьер (его слово 9.10: «может больше слотов для карьер сделать», «до 10 давай»; было 6). Место не упирается: не влезший сейв
// сжимается lz-string (~7×, см. careerSave), список слотов — строки и одна строка «новая».
const CC_SLOTS=10;
const LS_SLOT=n=>n===1 ? LS_CAREER : 'fncsdraft_career_s'+n;
/* Сейв бывает обычным JSON и сжатым (метка 'LZ1' + lz-string, см. careerSave). Читается одним путём. */
const CC_SAVE_LZ='LZ1';
function ccSaveParse(str){
  if(!str) return null;
  if(str.slice(0, 3)===CC_SAVE_LZ){ const raw=(typeof LZString!=='undefined') ? LZString.decompressFromUTF16(str.slice(3)) : null; return raw ? JSON.parse(raw) : null; }
  return JSON.parse(str);
}
const LS_ACTIVE='fncsdraft_career_active';
/* СЛОТ ВКЛАДКИ. Указатель активного слота лежит в localStorage и общий на все вкладки, а
   careerSave читал его в момент записи: вторая вкладка того же браузера (его случай 22.09 —
   хозяин гонки открыл свою же ссылку приглашения и завёл карьеру в другом слоте) переставляла
   указатель, и первая вкладка со следующим же сохранением писала свою карьеру в чужой слот —
   у хозяина «пропадала кнопка гонки». Теперь вкладка помнит слот, из которого загрузилась, и
   пишет только в него; указатель меняет лишь сама вкладка, выбирая слот. */
let CC_SLOT_TAB=null;
function ccSlotMine(){ return CC_SLOT_TAB || ccSlot(); }
function ccSlot(){
  let n=1;
  try{ n=parseInt(localStorage.getItem(LS_ACTIVE)||'1', 10); }catch(e){}
  return (n>=1 && n<=CC_SLOTS) ? n : 1;
}
function ccSlotUse(n){
  CC_SLOT_TAB=n;
  try{ localStorage.setItem(LS_ACTIVE, String(n)); }catch(e){}
}
function ccSlotRead(n){
  try{ ccLzFlush(LS_SLOT(n)); return ccSaveParse(localStorage.getItem(LS_SLOT(n))); }catch(e){ return null; }
}
function ccSlotWipe(n){
  try{ ccLzDrop(LS_SLOT(n)); localStorage.removeItem(LS_SLOT(n)); }catch(e){}
}
// What a slot says about itself on the picker, without loading it.
// Старый сейв без флага: годы без дивизионных кубков по сезону дня — до S18 (2019–2021) и
// 2024-й (S28–S32); 2022 и 2023 — по своим окнам дивизионов.
function ccSlotNoDivGuess(day){
  const n=ccSeasonNumOn(day);
  if(n && n<=18) return true;
  if(n>=28 && n<=32) return true;
  if(n>=19 && n<=22) return day<CC_DIV_FROM_2022 || day>CC_DIV_END_2022;
  if(n>=23 && n<=27) return day>CC_DIV_END_2023;
  return false;
}
function ccSlotCard(n){
  const s=ccSlotRead(n);
  if(!s || !s.player || !s.career) return null;
  // The slot picker reads a save without loading it, so it cannot ask
  // ccPlayerAge - it works the same answer out off the save's own two fields.
  const born=s.player.handle ? ccBornOf(s.player.handle) : null;
  const onDay=s.career.day||CC_YEAR_FROM;
  // Plus the seasons that have run, which is the correction ccAgeNow makes for
  // everybody else: the clock goes back to January every year and a birthday
  // read against it stands still.
  const real=born ? ccAgeOn(born, onDay)+Math.max(0, (s.career.season||1)-1) : null;
  /* Лицо и флаг — чтобы плитку узнавали, не читая. Отзыв:
     «понятней, что за карьера, мб фото игрока и рейтинг». Портрет берётся
     так же, как везде: свой загруженный снимок, иначе — портрет карточки. */
  const face=s.player.photo
    || (s.player.handle ? photoURL({handle:s.player.handle,
                                    region:s.player.cardRegion||s.player.region,
                                    _photo:null}) : null);
  /* Напарник — чтобы карьеры различались не только ником своего игрока.
     Отзыв: «а тимейта можно указать, типо чтоб понимали».
     Живой напарник из лобби лежит в тех же CAREER.partners (см. ccMpBoot),
     поэтому читается одинаково; командную карьеру выдаёт cr.mp. */
  const held=(s.partners||[]).filter(Boolean);
  const mate=held[0] ? (held[0].handle||held[0].nick||null) : null;
  return {nick:s.player.nick||'', ovr:s.player.ovr||0, age:real!=null?real:(s.player.age||0),
          face:face, country:s.player.country||null,
          mate:mate, mates:held.length, team:!!(s.career && s.career.mp),
          div:s.career.division||5, season:s.career.season||1,
          day:s.career.day||CC_YEAR_FROM, earnings:s.career.earnings||0,
          org:(s.org&&s.org.name)||null, over:!!s.career.seasonOver,
          noDiv:s.career.noDiv!=null ? !!s.career.noDiv : ccSlotNoDivGuess(s.career.day||CC_YEAR_FROM),
          retired:!!s.career.retired};
}
/* ДЕНЬГИ ПО ССЫЛКЕ — ТОЛЬКО ТАМ, ГДЕ ИДЁТ ОТЛАДКА.
   Просьба: «сделай мне баланс 2 миллиона, чтоб посмотреть функционал».
   Клуб стоит миллион, и дойти до него честной игрой — несколько сезонов, а посмотреть
   надо сейчас. Ссылка удобнее консоли, но такая же ссылка на боевом сайте — это кнопка
   «выдать себе денег» для кого угодно, поэтому адрес проверяется: fncsdraft.com про
   ?cash не знает вовсе. Заработанным эти деньги не считаются — earnings не трогаем,
   иначе они поедут в доски призовых и в рейтинг. */
function ccDebugCash(host){
  try{
    // Адрес можно передать: подменить location.hostname сторож не может, он только для чтения.
    const h=String(host!=null ? host : (location.hostname||''));
    if(/(^|\.)fncsdraft\.com$/i.test(h)) return false;
    const m=String(location.search||'').match(/[?&]cash=([0-9]{1,12})/);
    if(!m || !CAREER || !CAREER.career) return false;
    CAREER.career.balance=Number(m[1]);
    careerSave();
    return true;
  }catch(e){ return false; }
}
/* СЕЙВ ЕСТЬ, НО НЕ ПРОЧИТАЛСЯ (Notion «0910», игрок: «обновил браузер — весь прогресс пропал, сохранения нет?»).
   Было: нечитаемый сейв = «карьеры нет», вход вёл на создание, и новая карьера ложилась поверх старой в тот же
   слот — потеря без следа. Теперь сырая строка откладывается рядом (<слот>_unread, один раз), а вход ведёт
   к списку карьер с объяснением, а не к созданию. */
let CC_LOAD_BAD=null;
function careerLoad(){
  CC_SLOT_TAB=ccSlotMine();   // слот этой вкладки — с первой загрузки
  CC_LOAD_BAD=null;
  let raw=null;
  try{ ccLzFlush(LS_SLOT(CC_SLOT_TAB)); raw=localStorage.getItem(LS_SLOT(CC_SLOT_TAB)); CAREER=ccSaveParse(raw); }catch(e){ CAREER=null; }
  try{ ccSaveMarkAdopt(); }catch(e){}   // отметка записи слота — своя с этой загрузки (см. ccSaveStale)
  if(raw && !CAREER){
    CC_LOAD_BAD={slot:CC_SLOT_TAB};
    console.error('career save in slot '+CC_SLOT_TAB+' could not be read; kept as '+LS_SLOT(CC_SLOT_TAB)+'_unread');
    try{ if(!localStorage.getItem(LS_SLOT(CC_SLOT_TAB)+'_unread')) localStorage.setItem(LS_SLOT(CC_SLOT_TAB)+'_unread', raw); }catch(e){}
  }
  // Раздутая книга высадок старых сейвов (до ccLobbyMine, 21.10) — сбросить: наберётся заново по лобби игрока.
  try{ const b=CAREER && CAREER.career && CAREER.career.dropBook; if(b && b.at && Object.keys(b.at).length>CC_DROP_BOOK_MAX) delete CAREER.career.dropBook; }catch(e){}
  // Снимок роастера носит на себе то, что с ним сделала карьера, которая
  // была открыта до этой. Другая карьера — другая сцена.
  CC_NOW_CARDS={}; CC_ARC_PAIRS={};
  /* И подписи года — тоже чужие.

     careerYearDays строит весь год один раз и держит в CC_YEAR_DAYS, потому что
     хаб спрашивает его на каждой перерисовке. Две строки в нём читают саму
     карьеру: имя Виктори Капа (ccVictoryCupName — дуо или трио) и город ЛАНа
     (ccLanCity — свой на каждый сезон). Кэш сбрасывался на смене языка и на
     смене сезона, а на смене КАРЬЕРЫ — нет: сейв, открытый из списка слотов,
     мимо careerNewSeason не проходит.

     Отсюда скриншот: заголовок «ТРИО ВИКТОРИ КАП 1», а строкой
     ниже «ДУО · ДИВИЗИОН 1». Подпись осталась от трио-карьеры, открытой до
     этой; слово рядом читается живьём и потому честное. Его пометка к скрину:
     «дуо играю режим». */
  CC_YEAR_DAYS=null;
  // Every load, not only the ones that come through careerEntry: a career opened
  // from the slot picker or by a harness has the same forty old posts in it.
  // The shape of the squad is the same kind of thing and belongs here for the
  // same reason: a save switched to from the slot picker never passes the entry
  // point, and one that still holds the old single `partner` field would arrive
  // at the hub with an empty seat and a person sat in it.
  if(CAREER){ careerNotesMigrate(); careerMigrateSize(); careerMigratePartners();
              careerMigrateHome(); careerMigrateDiff(); careerMigrateSpotIslands();
              careerMigrateNoDiv(); careerMigrateDivDepth();
              careerMigrateBeefsOff();
              // Новая глава — книги роста поправкой (ccChapterCarry); сейв в середине главы — один раз.
              if(ccChapterCarry()) careerSave();
              // Сейв, раздутый линейной формулой твича, — под потолок. См. CC_TW_CEIL.
              careerMigrateTwitch();
              if(careerMigrateTwitchFromX()) careerSave();
              // Про 2026 года: настоящие Twitch и YouTube в сейв, начатый до 28.10 (один раз). См. CC_PRO_SOCIAL.
              if(ccMigrateProSocial()) careerSave();
              // A save from before the desk touched the card owns the devices
              // and not the skill they now carry. Recounted, not migrated: the
              // same recount every purchase runs. See careerGearSkill.
              careerGearSkill();
              // And a save written while somebody in the squad still had an open
              // offer standing carries it. See careerDmSquadTidy.
              careerDmSquadTidy();
              /* Книга роста сцены, написанная сломанной формулой, сжигается
                 один раз. До 22 августа careerGrowField сливал верх ростера
                 системно: ожидание сильнейшего стояло на первом месте, тейпер
                 резал его возрастной плюс до центрирования — и Malibuca ходил
                 92 при своих 96 («опять рейтинги падают, малибука был 96»).
                 Формула починена, но накопленный минус лежит в сейве. Отличить
                 в этих числах честно наигранное от слитого нельзя — они одна
                 сумма, — поэтому книга открывается заново: роастер возвращается
                 к измеренным рейтингам и растёт уже честной формулой. */
              if(CAREER.dev && !CAREER.devV){ delete CAREER.dev; }
              if(!CAREER.devV) CAREER.devV=2;
              /* И доска ПР — на людей, один раз. Старый сейв держит строки
                 составов («NOCIF & Izzi & Kaki22», «Твой состав: BOBRIK»):
                 вечера составной строки уезжают каждому её участнику, сама
                 она удаляется. См. careerPrAdd — новые вечера пишутся людям
                 сразу. */
              if(!CAREER.prV){
                const t=CAREER.career && CAREER.career.pr;
                if(t && t.rows){
                  const yk=hKey((CAREER.player && (CAREER.player.handle || CAREER.player.nick))||'');
                  Object.keys(t.rows).forEach(function(k){
                    const bare=k.replace(/^[^:&+]{1,40}:\s*/, '');
                    const who=bare.split(/\s*[+&]\s*/).map(s=>s.trim()).filter(Boolean);
                    if(who.length<2 && bare===k) return;
                    const src=t.rows[k];
                    who.forEach(function(h){
                      const row=t.rows[h] || (t.rows[h]={v:[], n:0});
                      row.v=(row.v||[]).concat(src.v||[]);
                      ccPrRowTrim(row);
                      row.n+=src.n||0;
                      if(src.you && hKey(h)===yk) row.you=true;
                    });
                    delete t.rows[k];
                  });
                }
                CAREER.prV=2;
              } }
  /* Дом уехавшего из России про — Сербия и в старом сейве. См. CC_PRO_HOME:
     карьера, взятая за Малибуку до этой таблицы, «жила» по флагу. Только пока
     дом так и читается по флагу ('ru') и своя рука его не трогала — переезд,
     сделанный игроком, сейв не переписывает. */
  try{
    const pl=CAREER.player;
    const home=pl && pl.source==='card' ? ccProHomeOf(pl.nick) : null;
    if(home && pl.country==='ru' && !pl.livesIn){
      pl.country=home;
      // Пинг в ЕС без переезда читается из сейва (см. ccPingNow) — переезжает
      // вместе с домом.
      const p=ccPingOf(home, pl.region||'EU');
      if(p!=null) pl.countryPing=p;
    }
  }catch(e){}
  // A different career is a different place to live. What the last one was
  // looking at in the flat list belongs to the last one. See CH_FLAT_PLACE.
  CH_FLAT_PLACE=null;
  /* Деньги по ссылке ставятся ЗДЕСЬ, а не на входе в карьеру: входов несколько
     (плитка, список слотов, ссылка лобби), и все они проходят через загрузку. */
  try{ ccDebugCash(); }catch(e){}
  return CAREER;
}
// A save that cannot be written is the career quietly ceasing to exist, and this
// used to swallow the reason without a word - a banked Opens once wrote a
// megabyte of team names, blew the quota, and every night after it was played on
// a save that was never being written. It still must not throw, because failing
// to save is not a reason to stop the tournament on screen, but it says so.
let CC_SAVE_FAIL=null;
/* What a career can lose without losing the career.

   In order, cheapest first. The feed's attached tables are screenshots of nights
   that have already been read; the feed itself is forty posts of which the last
   twenty-five are history; the banked Opens evening is one evening's carry; the
   inbox keeps its threads but not every line of them. The log is never touched —
   it is the honours, the money, the Power Ranking and the qualification routes,
   and a career without it is a career that did not happen.

   Each step returns whether it actually freed anything, so the retry loop stops
   the moment there is nothing left to give rather than spinning. */
const CC_SAVE_TRIM=[
  // Книга высадок (ccDropBook) — первой: потеря стоит лишь того, что боты выберут точки заново.
  function(cr){ if(!cr.dropBook) return false; delete cr.dropBook; return true; },
  function(cr){ let n=0; (cr.news||[]).forEach(function(e){ if(e.tbl){ delete e.tbl; n++; } }); return n>0; },
  function(cr){ if(!(cr.news||[]).length || cr.news.length<=15) return false;
                cr.news.length=15; return true; },
  function(cr){ if(!cr.rel) return false; delete cr.rel; return true; },
  function(cr){ let n=0;
                (CAREER.dms||[]).forEach(function(t){
                  if((t.msgs||[]).length>4){ t.msgs=t.msgs.slice(-4); n++; } });
                return n>0; },
  function(cr){ if(!(cr.news||[]).length) return false; cr.news.length=0; return true; },
  /* И только потом — то, что сцена наиграла себе за эти сезоны. Это
     девятьсот чисел, самый большой кусок сейва после ленты, и терять его
     жалко: роастер вернётся к своим измеренным рейтингам. Но карьера,
     которую негде сохранить, теряется целиком. */
  /* Сначала выдуманные: их книга ограничена (ccDevLTrim), но под квотой она
     всё равно дешевле настоящей сцены — терять нечего, кроме пары рейтинга у
     людей с выдуманными никами. */
  function(){ if(!CAREER.devL) return false; delete CAREER.devL; return true; },
  function(){ if(!CAREER.dev) return false; delete CAREER.dev; return true; }
];
/* Что принадлежит команде, а что человеку.

   Список закрытый и перечислен в спеке мультиплеерной карьеры. Всё, чего в нём
   нет, — личное: энергия, форма, деньги, контракт, квартира, спонсоры, девайсы,
   инбокс, охват. Оно лежит в localStorage у каждого своё и на расчёт вечера не
   влияет — это не удобство, а условие локстепа, и его стережёт
   tools/check-lockstep.js.

   `mp` держит код лобби и роль; он командный, потому что разрыв дуо обязан
   доехать до обоих. Граница целиком — tools/check-mp-split.js. */
/* Метка этой сборки. Ставится tools/stamp-build.js, сверяется
   tools/check-mp-build.js. Лобби не пускает клиента с чужой меткой: локстеп
   держится на том, что обе стороны считают ОДНИМ И ТЕМ ЖЕ кодом. */
const CC_BUILD='e3444105';
/* `region` — командный, и это не мелочь.

   Регион живёт в CAREER.player, то есть личный, а читает его пул, из которого
   строится ЛОББИ (ccPoolRegion), и сетка хитов Мейджора. Двое из разных
   регионов посчитали бы разные комнаты — расхождение, которого не видно до
   самой таблицы. Команда играет в одном регионе, как и настоящее дуо на
   доске; регион команды ставит тот, кто её создал, и он же едет напарнику
   вместе с днём. Личный region игрока при этом остаётся его: он про то, где
   человек живёт (аренда, пинг, переезд). */
/* `mates` — третий (и любой не-живой), и он тоже командный.

   Правка: «в три разреши брать». В трио-сезоне кресел три:
   двое живых и один взятый. Но взятый обязан быть ОБЩИМ — наберёт каждый
   своего, и у двоих снова разные составы, то есть ровно то расхождение, ради
   которого случайных и запретили в дуо. Поэтому запись о нём едет в командном
   состоянии, а берёт его владелец лобби. В одиночной карьере поле не
   используется вовсе: там напарники лежат в CAREER.partners, как лежали. */
/* `spots` — метки на картах, и они тоже командные.

   Отчёт: «выбрал спот, у тимейта не показывается сразу» —
   у одного три дома из трёх, у второго ноль. Дом не может быть личным:
   команда садится в ОДНУ коробку, дом решает, куда, а аура на нём — то, что
   комната знает про эту команду. Разные метки у двоих — это разные комнаты,
   то есть расхождение вечера, а не только пустая плитка. */
/* Мир, который у двоих обязан совпадать. Если сюда не внести состояние, которое решает исход вечера, двое молча
   считают разный мир, и локстеп ловит уже разъехавшееся.
   diff: сложность умножает рост сцены (careerDevelopNow -> careerGrowField), на разной сложности вырастут разные люди.
   duoSplits: какие настоящие дуо распались. majorSeed, summitSeed, relSeed, gcSeed: посевы между стадиями.
   table, d1, events, major…ewc: результат команды в каждом турнире.
   Личное сюда не кладём: деньги, ирнинг, форма, энергия, контракт, менеджер, инбокс, охват, твич, соцсеть.
   Граница проверяется tools/check-mp-split.js. */
/* 'beefs' — командный ключ с 28 августа. Биф читает careerSpotFearOn
   (CC_BEEF_SET) и через landingScore решает, кто из ботов падает на твой дом,
   — то есть входит в раздачу дропа СВОЕГО лобби. Пока он был личным, двое
   раскладывали своё лобби по-разному, а чужие — одинаково: скриншот (страница «neeww») ровно такой — чужие строки таблицы совпадают
   до очка, своя строка разная. И «после смерти на локации всё ломается» —
   это оно: биф рождается в стычке дома (careerBeefNight). */
// year/year0 — общие (30.09): друг по ссылке хозяина, который уже перешёл в следующий год, оставался
// в году начала — день приезжал 2021-й, а календарь года стоял 2019-й.
const CC_TEAM_KEYS=['seed','day','year','year0','mxDone','mxCan','vpick','season','division','diff','tokens','seasonOver','chemSince','beefs',
                    'sizes','trios','orphanMate','log','mp','region','mates','spots','seasonTurn',
                    'majorSeed','summitSeed','relSeed','gcSeed','duoSplits','exMates','table',
                    'events','d1','major','summit','globals','reload','rel','wf','rc',
                    'gclc','solo','soloBy','solos','solosBy','solosRl','solosRlBy','gifts','ewc','fmtPick','mobDev'];
/* Командное, которое лежит прямо в CAREER, а не в CAREER.career.
   Книга роста сцены живёт в CAREER.dev; если читать ключ 'dev' как CAREER.career.dev, выходит undefined и у двоих
   растут разные сцены. Коуч общий.
   duoStreak, splits, lft: память о чужих парах (серии в нижней трети, распады, поиск третьего). Копится в
   careerGrowField из результатов вечера, так что расходится, если один зашёл с другого устройства, вплоть до
   сезонного оборота в cr.duoSplits. Личного тут нет. */
// devL — книга роста придуманных ботов: после личных соло-вечеров у двоих расходилась, и поле следующего
// общего вечера собиралось из разных ботов (живой прогон 2019, 30.09).
const CC_TEAM_TOP=['dev','devL','coach','duoStreak','splits','lft'];
/* Сколько кресел в командной карьере занимают живые: ты и напарник. Всё, что
   сверх — кресла для взятых. В дуо-сезоне их ноль, в трио одно. */
const CC_MP_HUMANS=2;
function ccMpBotSeats(){
  return ccMpOn() ? Math.max(0, careerSquadSize()-CC_MP_HUMANS) : careerMateSeats();
}
/* Взятые на один вечер другого формата (трио-кап в дуо-год, сквад-кап): филлы, одинаковые у обоих. Ставит
   ccMpFmtBegin, снимает ccEventRosterEnd; общий состав команды (cr.mates) не трогается. */
let CC_MP_FMT_MATES=null, CC_MP_FMT_FP='', CC_MP_FMT_PICKS=0;   // FP — отпечаток памяти троек на входе, в строке расхождения
// Записи взятых: в команде они общие, в одиночной — свои.
function ccMpMateRecs(){
  const cr=(CAREER && CAREER.career) || {};
  if(!ccMpOn()) return careerMateRecords();
  if(CC_MP_FMT_MATES) return CC_MP_FMT_MATES.slice(0, ccMpBotSeats());
  if(!Array.isArray(cr.mates)) cr.mates=[];
  return cr.mates.filter(Boolean).slice(0, ccMpBotSeats());
}
/* Команда есть (лобби в сейве) — и команда СЧИТАЕТ вечер (локстеп). Это
   почти всегда одно и то же; расходятся они на один случай — см. CC_MP_ALONE. */
function ccMpTeam(){
  return !!(CAREER && CAREER.career && CAREER.career.mp && CAREER.career.mp.code);
}
/* Вечер, который в команде играет ОДИН.

   Solo Series — личный турнир: в хиты и финал каждый проходит сам. Прошёл
   один — второму в этот день играть нечего, а локстеп ждёт обоих: гейт ждёт
   «готов», барьеры ждут хеш, вопросы ждут ответ. Поэтому такой вечер
   считается как одиночный — без сида, без барьеров, без закрытия, — а итог
   (день, журнал, проход) уезжает напарнику обычным состоянием команды.
   Ставится раннером Solo Series на вход и снимается перед сохранением. */
let CC_MP_ALONE=false;
/* Вечер команды, разошедшийся на границе раундов: соло-кап вдвоём, во второй раунд прошёл один
   (ccTeamNightApart). Дальше вечер его личный — для копилки и роста мира как CC_MP_ALONE, но
   локстеп не трогается (напарник уже закрыл вечер, барьеры отпускает «peer done»). Снимается
   на старте и в конце каждого вечера (careerPlayRun0). */
let CC_TEAM_NIGHT_APART=false;
function ccTeamSoloNight(){ return ccMpTeam() && ((typeof CC_MP_ALONE!=='undefined' && CC_MP_ALONE) || CC_TEAM_NIGHT_APART || ccTeamSplitNight()); }
/* ОБЩИЙ ВЕЧЕР, РАЗОШЕДШИЙСЯ ПОСРЕДИ (красная строка, CC_MP_SPLIT_AT): дальше каждый доигрывал свой стол, и оба писали в доски
   СВОЮ таблицу под одним ключом — копилки друг друга отвергались как уже учтённые, и доски расходились навсегда (командный
   год 20.10: финал FNCS Solo Reload 21.11, 50 строк призовых). Теперь такой вечер — как личный: таблицу мира пишет хозяин
   лобби (без строки напарника), второй — только свою строку, обе копилки уходят с ником и доезжают. Доски снова одни. */
function ccTeamSplitNight(){ return typeof CC_MP_SPLIT_AT!=='undefined' && CC_MP_SPLIT_AT!=null && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn()); }
function ccBoardOnlyYou(){ return CC_BOARD_ONLY_YOU || (ccTeamSplitNight() && ccMpRole()==='b'); }
/* Напарник в моём личном вечере стоит ботом (peerBot, когда он этот день пропустил) — в его собственном
   мире этого вечера нет. Платить ему и писать ему рейтинг здесь значит дать ему вторую жизнь только в моих
   досках (командный год 20.10: строки самих Pixie и SwizzY у двоих разные). */
/* КУБОК НАЦИЙ В ОНЛАЙНЕ ПИШЕТ В ДОСКИ ТОЛЬКО СВОЮ СТРОКУ. Сборная у каждого своя, квалификацию своей зоны каждый
   играет сам, поэтому финал (и сыгранный самим, и досчитанный миром) у двоих собран из разных сборных — призовые
   людей сцены за него у напарника и у соперников по гонке не совпали бы никогда (командный год 20.10, «w|2026-11-28»).
   В одиночной карьере всё как было. Флаг ставят раннер Кубка наций и мировой финал. */
let CC_BOARD_ONLY_YOU=false;
function ccNatBoardsOwnOnly(){ return (typeof ccMpTeam==='function' && ccMpTeam()) || (typeof ccRaceOn==='function' && ccRaceOn()); }
function ccTeamPeerSkip(h){
  try{ return ccTeamSoloNight() && typeof MP!=='undefined' && MP.peer && hKey(h)===hKey(MP.peer); }catch(e){ return false; }
}
/* Обычный драфт — не командный вечер. Скриншот: «waiting for
   your partner пишет» в драфте. CAREER с командой остаётся загруженным после
   входа в карьеру, и все барьеры/вопросы simulateGamesLive (ccMpSync,
   ccMpChoose, гейт скипа) видели «команду» и ждали напарника в турнире, к
   которому напарник не имеет отношения. Флаг ставит chooseMode (вход в
   драфт), снимают вход в карьеру и запуск карьерного вечера.
   Сторож — tools/check-mp-draft-quiet.js. */
let CC_DRAFT_RUN=false;
function ccMpOn(){
  return ccMpTeam() && !CC_MP_ALONE && !CC_DRAFT_RUN;
}
/* ГОНКА В ОДНОЙ КОМНАТЕ (отзыв: «start a race — идея была, чтоб игроки
   играли в разных командах, друг против друга»; выбран локстеп, как у дуо).
   CC_RACE_LOCK ставится на вечер (careerPlayRun → ccRaceShared): соперник живой,
   один на комнату, тот же дивизион и тот же день. Тогда ЯДРО локстепа — гейт,
   сид, вопросы, барьеры, пропуск, закрытие — работает и в гонке (ccMpLock), а всё
   командное (напарник из лобби, общее состояние, шаг дня, наём третьего) остаётся
   за ccMpOn/ccMpTeam. Комната — хозяина: боты хозяина (роль a) едут гостю по
   проводу (ccRaceFieldSync), команды соперников строятся из карточек гонки. */
let CC_RACE_LOCK=false;
/* Метка вечера в строке (день|вид): строка с ней ушла ПОСЛЕ того, как состав на вечер сел.
   Прогон годов 20.10, 2021: третий, посаженный перед вечером, доходил до соседа позже, чем тот
   собирал поле, и у одного клиента он стоял ботом в чужой тройке («diff 1527 of 1607» на игре 1).
   Поле вычитает людей комнаты ДО сверки строк, поэтому раннер ждёт строки с этой меткой. */
let CC_RACE_LOCK_KEY=null;
const CC_RACE_LOCK_WAIT=30000;
async function ccRaceWaitLock(key){
  const t0=Date.now();
  const fresh=()=>ccRaceRoom().every(p=>p && p.lk===key);
  while(!fresh() && Date.now()-t0<CC_RACE_LOCK_WAIT){
    const w=new Promise(r=>setTimeout(r, 100));
    await ((typeof ccMpIdle==='function') ? ccMpIdle(w) : w);
  }
  CC_RACE_LOCK_DBG=ccRaceRoom().map(p=>((p.card||{}).handle||'?')+':'+(p.lk||'-')+':'+(p.mates||[]).length).join(',')+' '+(Date.now()-t0)+'ms';
  return fresh();
}
let CC_RACE_LOCK_DBG='';
/* Сила своей команды НА ЭТОТ ВЕЧЕР — та, что стоит в поле раннера (teams.isYou.pow).
   Ставит ccRaceFieldSync перед тем, как слать строку с сидом, снимает careerPlay в конце.
   Пока null — строка уходит без сида (не «свежая»): скриншоты «diff 1 of 430:
   pixie+swizzy:109 vs 112» при своей 108 — строку с сидом успевал послать хаб между
   стартом и сборкой команды, с CC_TV_YOU вчерашнего вечера, и кто что застал. */
let CC_RACE_POW_NOW=null;
/* И край ближнего боя своей команды (closeEdge) — его читает стычка на высадке и коробке
   (_pc, strength). У владельца он считается из игрока (closeRangeEdge), у соседей команда
   собиралась из упакованной карточки без него — и при первой же стычке с участием этой
   команды раздача расходилась (годовая проба 8.09: Evaluation 11.12, игра 4, −55 бросков). */
let CC_RACE_EDGE_NOW=null;
function ccRaceLock(){ return typeof ccRaceOn==='function' && ccRaceOn() && CC_RACE_LOCK && !CC_MP_ALONE && !CC_DRAFT_RUN; }
function ccMpLock(){ return ccMpOn() || ccRaceLock(); }
// Роль в лобби: командная карьера или гонка — у кого что есть.
function ccMpRole(){
  const cr=CAREER && CAREER.career;
  if(cr && cr.mp && cr.mp.code) return cr.mp.role||'a';
  if(cr && cr.race && cr.race.code) return cr.race.role||'a';
  return 'a';
}
/* Вечер стартует, когда готовы оба: его считают оба браузера, результат командный. В одиночной карьере сразу null.
   Аварийный выход: разрыв дуо (careerPartAsk), иначе пропавший напарник запер бы карьеру. Проверка tools/check-mp-gate.js.
   В раннерах зовётся как ccMpOn() ? await ccMpGate() : null, и тернарник обязателен: await даже на готовом промисе
   уступает такт, и в одиночной карьере вопрос дропа попадал в тик со skipAnimation, где ccChoiceBox отвечает сам
   (ловит check-career-landing). */
/* kind — ВИД вечера ('cup', 'solo', 'reload', …), тот же, что у раннера.

   Скриншот: он нажал Solo Series, напарник — открытый
   квал Reload того же дня. Лобби сверяло только день, завело вечер на двоих,
   и они с первой игры считали два разных турнира («field …m2.58.n4900 vs
   …r1.15.n900»). Теперь вид едет в готовности (см. lobby.ready): разные виды
   — старта нет, обоим приходит clash, гейт снимается и оба возвращаются на
   хаб с объяснением, кто что нажал. */
function ccMpGate(kind){
  if(!ccMpLock() || typeof MP==='undefined') return Promise.resolve(null);
  return new Promise(function(res, rej){
    /* У каждых ворот свой номер (29.10, errlog пар 27–28.10: у одного клиента поле и остров ПРОШЛОГО командного вечера
       при метке текущего). Ворота, которые не закрылись (ни старта, ни отмены), висели слушателем 'start', а новые
       перезаписывали MP.gateCancel — и старт следующего вечера срабатывал в обоих: раннер прошлого вечера играл своё
       поле. Теперь устаревшие ворота на любом событии снимают свои слушатели и молчат; старт чужого дня не берётся. */
    var tok=MP.gateTok=(MP.gateTok||0)+1, myDay=careerToday();
    var stale=function(){ if(MP.gateTok===tok) return false; if(off) off(); if(offClash) offClash(); if(tick) clearInterval(tick); return true; };
    var offClash=MP.on('ready', function(m){
      if(stale()) return;
      if(!m || !m.clash) return;
      var me=ccMpId(), mine=m.clash[me]||'', theirs='';
      Object.keys(m.clash).forEach(function(k){ if(k!==me) theirs=m.clash[k]||''; });
      /* Пустой вид напарника — не «другой турнир», а вкладка старой сборки:
         сервер такую пару не заводит (см. lobby.ready), объясняем про версию. */
      var why=theirs ? L().ccMpKindClash(mine||kind||'?', theirs)
                     : L().ccMpKindOld;
      try{ ccMpTell(why); }catch(e){}
      try{ careerBackToHub(); }catch(e){}
      if(MP.gateCancel) MP.gateCancel(why);
    });
    var off=MP.on('start', function(m){
      if(stale()) return;
      if(m && m.day && m.day!==myDay) return;
      if(off) off();
      if(offClash) offClash();
      if(tick) clearInterval(tick);
      MP.gate=false; MP.gateCancel=null;
      CC_MP_SHARED_NIGHT=true;   // см. ccTeamWorldKeep
      // Сид сервера — под него и считается вечер. См. ccMpSeedOn.
      ccMpSeedOn(m.seed);
      // Гонка: книга мира — от старшего по адресу, до сборки поля (ccRaceWorldSync).
      Promise.resolve(typeof ccRaceWorldSync==='function' ? ccRaceWorldSync(m.n, m.who) : null)
        .then(function(){ return typeof ccTeamWorldSync==='function' ? ccTeamWorldSync(m.n, m.who) : null; }, function(){ return null; })
        .then(function(){ res({seed:m.seed, n:m.n}); }, function(){ res({seed:m.seed, n:m.n}); });
    });
    // Хвост прошлого вечера, если тот оборвался посреди раннера.
    ccMpSeedOff();
    /* Карточка — ПЕРЕД готовностью, а не когда-нибудь.

       Из двух карточек оба собирают одну команду, а значит и одну силу. Всё,
       что двигало её за день — форма, усталость, болезнь, сборы, девайсы,
       режим показа, — обязано уехать до старта. Сокет держит порядок, так что
       напарник получит её раньше, чем сервер объявит вечер. */
    /* И запомнить её. Живой прогон двоих 30.09 (перемотка 2023): у A напарник LiveB 87, у самого
       B — 89, сила команды 104 против 105, таблицы разошлись с первой игры. Своя карточка на вечер
       собиралась заново (careerCard), а напарник считал по той, что приехала, — если между отправкой
       и стартом рейтинг или форма у кого-то сдвинулись, входы расходились. Теперь свою команду каждый
       считает по той же карточке, которую видит напарник (ccMpMyCardNow). */
    CC_MP_MYCARD=(MP.card ? MP.card() : null);
    if(CC_MP_MYCARD) MP.send({t:'card', card:CC_MP_MYCARD});
    else if(MP.sendCard) MP.sendCard();
    MP.gate=true; MP.gateDay=careerToday();   // день ворот: пропуск напарника сверяется с ним, а не с днём вкладки (тот могло сдвинуть состояние напарника)
    // Отмена ожидания старта — перемотка встала у напарника (ccMpFfErrSaw) или он на другом дне.
    var tick=null;
    MP.gateCancel=function(why){ if(off) off(); if(offClash) offClash(); if(tick) clearInterval(tick); MP.gate=false; MP.gateCancel=null; rej(new Error(why||'gate cancelled')); };
    var since=(new Date()).getTime();
    tick=setInterval(function(){
      if(stale()) return;
      var why=ccMpGateDayWhy();
      if(!why || (new Date()).getTime()-since<CC_MP_LEAVE_MS) return;
      try{ ccMpTell(why); }catch(e){}
      if(typeof CC_FF==='undefined' || !CC_FF){ try{ careerBackToHub(); }catch(e){} }
      // В перемотке это пропуск дня, как от его ffskip: день шагает (личный вечер — переигрывается одному), а не встаёт ошибкой.
      else if(MP.gateDay && !(typeof ccRaceOn==='function' && ccRaceOn() && !ccMpTeam())){ CC_MP_FF_SKIPDAY=MP.gateDay; CC_MP_PEER_SKIPS.add(MP.gateDay); }
      if(MP.gateCancel) MP.gateCancel(why);
    }, 1000);
    MP.ready(careerToday(), kind||null);
  });
}
/* Перемотка встала у напарника — встаёт и у нас, с его текстом ошибки.
   Иначе наша перемотка ждала бы его на следующем гейте вечно. */
/* Напарник (по пульсу) живёт в другом дне — значит, он этот вечер не играет,
   и ждать его на гейте некого. Его снимок 29 августа: один на 11 января в
   Solo Series, второй на 15 марта. */
function ccMpGateDayWhy(){
  /* Гонка: гейт сдаётся, только если ВСЕ из комнаты вечера стоят в хабе на другом дне —
     комната и так без ушедших вперёд (ccRaceRoom), а пульс одного соседа ничего не значит. */
  if(typeof ccRaceOn==='function' && ccRaceOn() && !ccMpTeam()){
    var room=(typeof ccRaceRoom==='function') ? ccRaceRoom() : [], hbs=(typeof MP!=='undefined' && MP.peerHbs)||{};
    // Комната пуста (все ушли дальше) — старта от сервера старой версии не будет, гейт сдаётся: вечер свой.
    if(!room.length) return (typeof ccRaceRivals==='function' && ccRaceRivals().length) ? L().ccRaceWhyalone : null;
    var gone=room.every(function(p){ var h=hbs[p.id]; return h && h.day && h.day!==careerToday() && h.rand===false; });
    return gone ? L().ccMpOtherDay(ccDayLabel((hbs[room[0].id]||{}).day)) : null;
  }
  var hb=(typeof MP!=='undefined' && MP.peerHb) || null;
  if(!hb || !hb.day || hb.day===careerToday()) return null;
  /* Напарник на другом дне, но В ВЕЧЕРЕ — он доигрывает свой (соло в одиночку,
     где нас нет) и придёт. Его снимок 29 августа: перемотка встала на 22 янв с
     «напарник на 11 янв», пока тот играл соло-квалификацию. Сдаёмся только на
     напарника, который стоит в хабе на другом дне. */
  /* …кроме перемотки, ушедшей ВПЕРЁД: напарник в перемотке уже на более позднем дне — этот вечер он прошёл (пропустил
     или сыграл один), и к воротам не придёт, хоть и считает свой. Командный год 20.10: ворота LCQ Solo Reload 16.11
     висели до конца сезона, а напарник был на 29.11. */
  if(hb.ff && typeof CC_FF!=='undefined' && CC_FF && String(hb.day)>String((typeof MP!=='undefined' && MP.gateDay) || careerToday())) return L().ccMpOtherDay(ccDayLabel(hb.day));
  if(hb.rand!==false) return null;
  return L().ccMpOtherDay(ccDayLabel(hb.day));
}
function ccMpFfErrSaw(p){
  if(!p || !(ccMpOn() || (typeof ccRaceOn==='function' && ccRaceOn()))) return;
  var text=L().ccMpFfPeerBroke(String(p.text||'-'));
  try{ ccMpTell(text); }catch(e){}
  if(typeof CC_FF!=='undefined' && CC_FF){
    CC_FF.stop={text:text};
    if(typeof MP!=='undefined' && MP.gateCancel) MP.gateCancel(text);
  }
}
/* Вечер переживает обрыв и перезагрузку. Сервер хранит вечер (сид, день) и его
   ленту и отдаёт в каждом 'state'. Три случая:
   1. Вкладка пропустила старт в гейте: старт воспроизводится из состояния.
   2. Перезагрузка посреди вечера: вечер заново под тем же сидом, свои ответы из
   ленты (MP.own), чужие из очереди, показ выключен (CC_MP_REPLAY), пока свои
   ответы не кончились или не пришлось ждать напарника.
   3. Вкладка пропустила close: закрытие берётся из состояния. */
let CC_MP_REPLAY=false;
function ccMpResume(ev, mine, theirs){
  /* Гонка догоняется так же, но сперва нужна КОМНАТА: после перезагрузки список
     соперников пуст, а без него careerPlayRun решит, что сегодня врозь, и вкладка
     доиграет вечер сама по себе, пока остальные стоят на барьере. Своя строка уходит
     сразу, соперники отвечают своими (см. careerRaceWire), и вечер стартует, когда
     они приехали — или через CC_RACE_RESUME_WAIT, если никто не ответил. */
  const race=!ccMpOn() && typeof ccRaceOn==='function' && ccRaceOn();
  if((!ccMpOn() && !race) || typeof MP==='undefined' || !ev || ev.day!==careerToday()) return;
  if(MP.preload) MP.preload(mine, theirs);
  if(MP.gate){ MP.say({t:'start', seed:ev.seed, n:ev.n, day:ev.day, resume:true}); return; }
  if(CC_MP_RAND) return;           // вечер здесь и так идёт: обрыв был коротким, ответы доехали очередью
  CC_MP_REPLAY=true;
  try{ ccMpTell(L().ccMpResume); }catch(e){}
  if(!race){ setTimeout(function(){ try{ careerPlay(); }catch(e){ CC_MP_REPLAY=false; } }, 0); return; }
  try{ careerRaceSend(); }catch(e){}
  const t0=Date.now();
  (function wait(){
    if(CC_MP_RAND) return;                       // вечер успел начаться сам
    const got=(typeof ccRaceRivals==='function') && ccRaceRivals().length>0;
    if(!got && Date.now()-t0<CC_RACE_RESUME_WAIT) return void setTimeout(wait, 200);
    try{ careerPlay(); }catch(e){ CC_MP_REPLAY=false; }
  })();
}
function ccMpClosedLate(closed){
  if(!ccMpOn() || typeof MP==='undefined' || !MP.closing || !closed) return;
  MP.say({t:'close', team:closed.team, late:true});
}
/* Вечер считается под сидом сервера.
   Сид приходит в 'start' и раскладывается в mpStart во всех раннерах. Без этого каждый клиент считал на своём Math.random и таблицы молча расходились.
   Ставится на входе в вечер, снимается в закрытии вечера и на входе в следующий (как в ccArcPlay): иначе сид заморозит броски вкладки, а исключение посреди раннера сломает больше одного вечера.
   Приход 'team' от напарника сид не снимает: он прилетает на каждую метку и выдернул бы генератор посреди вечера.
   В одиночной карьере не действует. Проверка: tools/check-mp-seed.js. */
let CC_MP_RAND=null;
let CC_MP_SEED=null;   // строка сида вечера от сервера; в гонке она же сеет комнату
/* Книга бросков одной игры — по фазам.

   Его снимок 28 августа (Reload, хиты, игра 4): таблицы у двоих одинаковые,
   броски 54971 против 54969 — два лишних броска на одной стороне, и красная
   строка не говорила, где. Теперь каждая игра ведёт книгу «фаза=броски»
   (лобби, дроп, комната лута, вопрос, своё лобби, чужие, счёт, VR, конец), и
   книга едет с барьером следующей игры: первая строка, где числа разошлись,
   и есть место. Вне командного вечера книга пуста и ничего не стоит. */
let CC_MP_LEDGER=[];
/* Игра, которая идёт прямо сейчас, и чьи это команды: отпечаток в книге берёт из неё
   состояние ОТРЯДОВ. Пара (игра, команды) — чтобы отпечаток никогда не считался по
   чужому лобби, если игра оборвалась исключением. */
let CC_MP_SIM=null;
function ccMpSimOn(game, teams){ CC_MP_SIM=(game && teams) ? {game:game, teams:teams} : null; }
function ccMpLedgerReset(){ CC_MP_LEDGER=[]; }
/* Отметка: фаза=броски[/отпечаток состояния]. Отпечаток — сила в игре
   (_pf/_pc) и коробка каждой команды: равные броски при разном отпечатке
   значат, что разъехалось СОСТОЯНИЕ, а не поток. */
function ccMpMark(name, teams){
  if(!CC_MP_RAND) return;
  var sig='';
  if(teams && teams.length){
    var acc='';
    for(var i=0;i<teams.length;i++){
      var t=teams[i];
      /* И ВХОД ДВИЖКА: он читает у команды attrs (skill/seek/power в createSquads),
         край ближнего боя и размер отряда. Сверка поля равняет только ники и силу, а
         сила округлена — две сцены, разошедшиеся на доли очка, дают одинаковый ник:сила
         и разные числа движку. Зеркальная проба (race-you-mirror-probe) показала, что при
         равных командах игра у двоих одинакова, значит разойтись может только вход. */
      const ta=t.attrs||null;
      acc+=(t._pf!=null ? Math.round(t._pf*100) : '-')+':'+(t._pc!=null ? Math.round(t._pc*100) : '-')+':'+
           (t.landingZone && typeof ALL_LANDING_ZONES!=='undefined' ? ALL_LANDING_ZONES.indexOf(t.landingZone) : '-')+':'+
           (ta ? ta.END+'.'+ta.SUR+'.'+ta.AIM+'.'+ta.CLU : '-')+':'+Math.round((t.closeEdge||0)*100)+':'+
           (((t.squad||[]).length)||1)+':'+(t._mats!=null ? t._mats : '-')+':'+(t._buildMul||1)+':'+(t._rotMul||1)+'|';   // и ресы: вопрос середины задаётся по ним (ccMidQuiet)
    }
    /* И СОСТОЯНИЕ ДВИЖКА — жив, где стоит, сколько хп и щита, сколько выбил.
       Без него расхождение ВНУТРИ игры (кто-то умер на круг раньше) видно
       только по числу бросков на следующей отметке, и красная строка говорит
       'rolls @ p3', то есть 'где-то в двух кругах'. Скриншот и обе
       красные строки годовой пробы — ровно этот случай. С отпечатком место
       называется той отметкой, на которой состояния впервые разошлись. */
    if(CC_MP_SIM && CC_MP_SIM.teams===teams && CC_MP_SIM.game && CC_MP_SIM.game.squads){
      var sq=CC_MP_SIM.game.squads;
      for(var j=0;j<sq.length;j++){ var q=sq[j];
        acc+=(q.alive?1:0)+':'+Math.round((q.x||0)*100)+':'+Math.round((q.y||0)*100)+':'+
             Math.round((q.hp||0)*100)+':'+Math.round((q.shield||0)*100)+':'+(q.elims||0)+':'+(q.droppedOut?1:0)+':'+
             Math.round((q.dealt||0)*100)+':'+Math.round((q.taken||0)*100)+'|';
      }
    }
    sig='/'+String(ccHashStr(acc)).slice(0,6);
  }
  /* Чужие обращения к сиду в паузах (см. ccMpIdle) — в той же строке: они
     видны только своей вкладке, а расходиться может как раз напарник. Скриншот (финал Solo Series, cd401daa): «rolls @ #14 a3:take=30992
     vs a3:take=30994» — у напарника два броска сверх между комнатой лута и
     ответом, foreign у себя ноль, у него — неизвестно. */
  CC_MP_LEDGER.push(name+'='+CC_MP_ROLLS+(CC_MP_FOREIGN ? '+'+CC_MP_FOREIGN : '')+sig);
}
/* Сколько бросков вечер уже потратил. Едет в сверку барьера рядом с хешем
   таблицы (см. careerLandingPick): две одинаковые таблицы при разном числе
   бросков — это уже расхождение, просто ещё не доехавшее до очков, и красная
   строка называет его на игру раньше и с числами, по которым видно, КТО
   потратил больше. Замер ночи 28 августа показал, что без числа причина
   ищется по одному отчёту за раз. */
let CC_MP_ROLLS=0;
// Номер игры В ВЕЧЕРЕ (сквозной через этапы): по нему барьеры понимают, что
// напарник уже дальше. Ставится в simulateGamesLive, сбрасывается на старте.
let CC_MP_GAME=0;
/* Ожидание — не расчёт. Пока вечер спит (сон, показ, окно выбора, ждём
   напарника), общий сид никому не отдаётся: Math.random отвечает родным
   генератором, а каждое такое обращение считается и запоминает, откуда оно
   пришло. Скриншот: «rolls @ oth=… · hid 1» — броски разошлись у
   вкладки в фоне при равном поле; кто тратил сид в паузе, теперь назовёт
   сама красная строка (foreign N @ стек), а тратить он больше не сможет. */
let CC_MP_IDLE=0, CC_MP_FOREIGN=0, CC_MP_FOREIGN_AT='', CC_MP_IDLE_EPOCH=0;
/* Паузы считаются по эпохам: старт вечера (ccMpSeedOn) и брошенный забег (abandonRun) открывают новую.
   Пауза из прошлой эпохи (sleep брошенного забега ещё тикает) не трогает новый счёт, иначе её конец уводил
   счётчик в минус или, наоборот, держал его выше нуля, и симуляция нового вечера брала родной генератор
   (у видимой вкладки 631 бросок «чужими» на игре 1, у свёрнутой 0). */
function ccMpIdle(p){
  if(!CC_MP_RAND) return p;
  const ep=CC_MP_IDLE_EPOCH;
  CC_MP_IDLE++;
  return Promise.resolve(p).finally(function(){ if(ep===CC_MP_IDLE_EPOCH && CC_MP_IDLE>0) CC_MP_IDLE--; });
}
function ccMpIdleEpoch(){ CC_MP_IDLE_EPOCH++; CC_MP_IDLE=0; }
// Раннер считает, значит никто из него не ждёт: брошенная пауза не должна уводить броски вечера мимо общего сида.
function ccMpCalcStart(){ if(CC_MP_RAND && CC_MP_IDLE>0) ccMpIdleEpoch(); }
function ccMpSeedOn(seed){
  ccMpSeedOff();
  // Новый вечер — пропуск снова спрашивается у обоих, вопросы считаются заново.
  ccMpSkipReset();
  ccMpQnReset();
  ccMpWaitReset();
  if(!seed) return;
  CC_MP_RAND=Math.random;
  CC_MP_ROLLS=0;
  CC_MP_GAME=0;
  /* Жетон этапа — с нуля на каждый командный вечер.

     CC_DROP_STAGE_N — счётчик ЭТАПОВ ЗА ЖИЗНЬ ВКЛАДКИ: он входит в жетон
     (CC_DROP_STAGE), а жетон сеет бросок высадки каждой команды в каждом лобби
     (ccLandingRoll). Двое, у которых вкладки прожили разное число этапов —
     один перезагрузился после красной строки, второй нет; один вчера играл
     вечер без перезагрузки, — раскладывали остров по разным жетонам, и
     вечера расходились с первой же игры, при любом режиме и любом скипе.
     Отчёт: первый вечер после обновления у обоих сошёлся,
     следующий — «начал I PLAY IT и решил скипнуть у двоих» — разошёлся.

     В одиночной карьере счётчик как был: там ему не с кем совпадать. */
  CC_DROP_STAGE_N=0;
  // Красная строка прошлого вечера не должна глушить сегодняшнюю: метка
  // «первое расхождение» — на вечер, а не на вкладку.
  CC_MP_SPLIT_AT=null; CC_MP_LEAVE=false; CC_MP_LEFT=false; CC_MP_PASSED=null;
  try{ document.querySelectorAll('.cc-mp-split').forEach(function(e){ e.remove(); }); }catch(e){}
  /* И мир — заново, у обоих, из одного и того же командного состояния.

     Кэши мира живут во вкладке: пул сцены (CC_POOLS), сезонный ростер
     лестницы (CC_LADDER_POOL — его РАЗМЕР зависит от того, какую комнату
     вкладка собрала первой), карточки года. Сбрасывает их только приход
     чужого состояния (ccApplyTeamState → ccWorldReset) — то есть у того, кто
     ПРИНЯЛ, а не у того, кто прислал. Две вкладки с разной историей входили в
     вечер с разными кэшами и собирали разные комнаты с первой игры. Сброс
     здесь — на самом старте, до сборки поля — стоит полсекунды и уравнивает
     обоих. */
  if(typeof ccWorldReset==='function') ccWorldReset();
  ccMpHeartbeat(true);
  /* Сид вечера — он же СИД КОМНАТЫ в гонке (см. careerSeed): у каждого своя
     карьера и свой cr.seed, а комната должна быть одна. Сервер выдаёт одну
     строку всем, и по ней все строят один и тот же набор ботов. */
  CC_MP_SEED=String(seed||'')||null;
  const g=careerRng(ccHashStr(String(seed)));
  ccMpIdleEpoch(); CC_MP_FOREIGN=0; CC_MP_FOREIGN_AT='';
  const native=CC_MP_RAND;
  Math.random=function(){
    // Показ уже пропущен, а его паузы ещё тикают — это не ожидание, снимаем их.
    if(CC_MP_IDLE>0 && CC_SLEEPS.size && ccShowOff()) ccSleepFlush();
    if(CC_MP_IDLE>0){
      CC_MP_FOREIGN++;
      if(!CC_MP_FOREIGN_AT){ try{ CC_MP_FOREIGN_AT=String(new Error().stack||'').split('\n').slice(2,5).map(function(l){ return l.trim().replace(/^at /,'').replace(/\s*\(.*$/,''); }).join('<'); }catch(e){} }
      return native();
    }
    CC_MP_ROLLS++; return g();
  };
}
function ccMpSeedOff(){
  ccMpHeartbeat(typeof ccRaceOn==='function' && ccRaceOn());   // в гонке пульс не гаснет: по нему живость соседа (ccRacePeerAlive)
  CC_MP_SEED=null;
  if(!CC_MP_RAND) return;
  Math.random=CC_MP_RAND;
  CC_MP_RAND=null;
}
/* Чей выбор, решает роль: высадка и лут у игла, восьмая зона у фраггера, второй смотрит. Владелец лобби и
   голосование с монеткой не годились: клик двигал общий генератор и вечера расходились (ccMpChoose,
   tools/check-mp-choice-cost.js).
   Ответ должен совпасть у обоих, поэтому считается из одних данных (своя карточка и напарника) с полным порядком:
   роль, ник, владелец лобби. Даже при одной роли каждый вопрос берёт ровно один, и вопросы делятся пополам. Сторож tools/check-mp-relay.js.
   */
/* 2.11, его слово: «в одиночной карьере или против друга ты решаешь всё, а в дуо карьере игл и фраггер свои роли решают».
   Было: фраггеру только восьмая зона, остальное иглу. Теперь игл — стиль, точка, лут, ротации; фраггер — мид, фарм,
   маты, билд-файты, конец игры. Одно деление на командную карьеру и пару в гонке (ccMpMine). */
const CC_MP_WHO={drop:'roleIGL', site:'roleIGL', own:'roleIGL', loot:'roleIGL', rot:'roleIGL', style:'roleIGL',
                 mid:'roleFRG', farm:'roleFRG', mats:'roleFRG', build:'roleFRG', late:'roleFRG',
                 moving:'roleIGL', last:'roleFRG'};
const CC_RACE_PAIR_WHO=CC_MP_WHO;
function ccMpRoleKey(c){
  if(!c) return null;
  try{
    const a=(typeof attrsFor==='function') ? attrsFor(c) : null;
    return (a && a.roleKey) || c._roleKey || c.role || null;
  }catch(e){ return c._roleKey || c.role || null; }
}
function ccMpMine(kind){
  if(!ccMpLock()) return true;
  /* Вопрос С АДРЕСАТОМ: 'loot:<ник>' — мой, если ник мой. Так спрашивает
     Solo Series в команде: двое в одном лобби, у каждого свой дроп, лут и
     высота, и роль тут ни при чём. См. runCareerSoloSeries. */
  var at=String(kind).indexOf(':');
  if(at>=0){
    var meC=(typeof careerCard==='function') ? careerCard() : null;
    /* Пара в гонке: два человека в одном дуо, адрес команды — первая карточка по нику (ccRacePairTeamInto),
       и все вопросы вечера получал один из двоих (Notion 2.11: «решения принимаю только я, у друга ничего нет»).
       Вопросы пары делятся по ролям, одинаково у обоих: CC_RACE_PAIR_WHO; при одной роли половина вопросов у каждого. */
    var tag=String(kind).slice(at+1);
    if(meC && typeof ccRacePairOn==='function' && ccRacePairOn()){
      var pcs=ccRacePairCards();
      if(pcs && pcs.some(function(c){ return hKey(c)===tag; })){
        var mk=hKey(meC), peerC=pcs.find(function(c){ return hKey(c)!==mk; });
        if(peerC){
          var pWant=CC_RACE_PAIR_WHO[String(kind).slice(0, at)] || 'roleIGL';
          var pa=ccMpRoleKey(meC)===pWant, pb=ccMpRoleKey(peerC)===pWant;
          if(pa!==pb) return pa;
          // Одна роль у обоих: вопросы всё равно на двоих, первый по нику берёт вопросы игла, второй фраггера.
          return (mk<hKey(peerC))===(pWant==='roleIGL');
        }
      }
    }
    return !!(meC && hKey(meC)===tag);
  }
  const owner=ccMpRole()==='a';
  const me=(typeof careerCard==='function') ? careerCard() : null;
  const peer=(typeof MP!=='undefined' && MP.peer) || null;
  // Пока напарника не видно, решать некому, кроме владельца.
  if(!me || !peer) return owner;
  const want=CC_MP_WHO[kind] || 'roleIGL';
  const a=ccMpRoleKey(me)===want, b=ccMpRoleKey(peer)===want;
  if(a!==b) return a;
  // Одна роль у обоих (5.11, игрок: «вдвоём не можем выбирать отдельно»): один не должен решать всё.
  // Первый по нику берёт вопросы игла, второй фраггера. Порядок считается одинаково у обоих.
  const ha=String(me.handle||'').toLowerCase(), hb=String(peer.handle||'').toLowerCase();
  const first=ha!==hb ? ha<hb : owner;
  return first===(want==='roleIGL');
}
/* Код лобби — он же приглашение.

   Ни аккаунтов, ни почты, ни паролей: шесть знаков, которые один пересылает
   другому. Буквы и цифры без похожих пар (нет O и 0, нет I и 1): код диктуют
   голосом, и «ноль или о» — это потерянный вечер.
   Сторож — tools/check-mp-join.js. */
/* Открыта ли командная карьера. Код мультиплеера без career.mp не работает; опасны только две кнопки на экране
   создания: без живого лобби команда встаёт, день двигает только сервер (careerAdvanceTo). Выход: «разорвать дуо»
   на плитке команды.
   Лобби на mp.fncsdraft.com. Переключить: поменять флаг и переставить метку сборки (tools/stamp-build.js). На сами
   функции флаг не влияет, проверки зовут их напрямую. */
const CC_MP_OPEN=true;
const CC_MP_ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function ccMpCode(){
  var s='';
  for(var i=0;i<6;i++) s+=CC_MP_ABC[Math.floor(Math.random()*CC_MP_ABC.length)];
  return s;
}
// Кто я в этом лобби. Живёт рядом с сейвом и переживает перезагрузку: без него
// после обрыва сервер посчитал бы вернувшегося третьим.
function ccMpId(){
  /* Адрес — на СЛОТ, а не на браузер. Две карьеры одного браузера (его случай 22.09: хозяин
     гонки открыл свою ссылку во второй вкладке и завёл карьеру в другом слоте) входили в лобби
     под одним адресом — сервер и соседи считали их одним человеком, и хозяин выпадал из
     гонки. Первый слот держит старый ключ: живые лобби и сейвы не трогаются. */
  var slot=(typeof ccSlotMine==='function') ? ccSlotMine() : 1;
  var k='fncsdraft_mp_id'+(slot>1 ? '_s'+slot : '');
  var v=null; try{ v=localStorage.getItem(k); }catch(e){}
  if(!v){ v=Math.random().toString(36).slice(2,10); try{ localStorage.setItem(k,v); }catch(e){} }
  return v;
}
/* Сейв, в котором гонка и команда стоят на ОДНОМ коде, — след бага 8 сентября
   (хозяин гонки принимал командное состояние вошедшего; см. ccApplyTeamState).
   Скриншот: плитка «Команда» с кодом JDQBA2 и напарником Darm над плиткой
   «Гонка» с тем же кодом. Одна комната не бывает и тем и другим: код открыл
   гонщик — команда лишняя. Чистится при загрузке, чтобы уже испорченный сейв
   не требовал «разорвать дуо» руками. */
function ccMpRaceTidy(){
  const cr=CAREER && CAREER.career;
  if(!cr || !cr.race || !cr.race.code || !cr.mp || !cr.mp.code) return false;
  if(String(cr.mp.code).toUpperCase()!==String(cr.race.code).toUpperCase()) return false;
  delete cr.mp;
  try{ careerSave(); }catch(e){}
  return true;
}
function ccMpBoot(){
  if(typeof MP==='undefined') return Promise.resolve();
  ccMpRaceTidy();
  /* Гонка карьер поднимается тем же входом, но своим состоянием: она живёт в
     cr.race и ни одного командного пути не включает. См. ccRaceOn. */
  if(ccRaceOn()){
    careerRaceWire();
    return MP.connect(CAREER.career.race.code, ccMpId())
      .then(function(){ careerRaceSend(); ccMpHeartbeat(true); })
      .catch(function(){});
  }
  if(!ccMpOn()) return Promise.resolve();
  // До подключения, а не после: первое же чужое решение должно застать
  // обработчик на месте.
  ccMpThirdWire();
  return MP.connect(CAREER.career.mp.code, ccMpId()).catch(function(){});
}
/* Живая ли связь с лобби, и если нет — как это назвать словами.

   Одиночная карьера про связь ничего не знает и знать не должна: ccMpLive для
   неё всегда true, ccMpWhy — всегда null. */
function ccMpLive(){
  if(!ccMpLock()) return true;
  return typeof MP!=='undefined' && MP.state==='live';
}
function ccMpWhy(){
  // Разные дивизионы и одинаковые игроки — раньше связи: связь-то как раз
  // живая, а играть нельзя.
  if(ccMpDivWhy()) return ccMpDivWhy();
  if(ccMpSameWhy()) return ccMpSameWhy();
  if(ccMpRolesWhy()) return ccMpRolesWhy();
  if(!ccMpOn() || ccMpLive()) return null;
  var s=(typeof MP!=='undefined' && MP.state) || 'lost';
  return s==='old' ? L().ccMpOld : s==='wait' ? L().ccMpWait : L().ccMpLost;
}
/* Сколько человек уже нажали «играть» — подписью на самой кнопке.

   Отзыв: «нужно, чтоб при нажатие кнопки играть было написано
   1/2 если жмет кто-то или 0/2, игра начинается если нажмут два человека».
   Пока подписи не было, нажатие уходило в ccMpGate и вечер молча ждал второго:
   кнопка выглядела сломанной.

   Считает сервер (см. lobby.ready): свою готовность клиент знает и сам, а
   чужую — только с его слов, и после обрыва не знает даже своей. День в счёте
   не случаен — готовность заявляется НА ДЕНЬ, и вчерашняя к сегодняшнему
   вечеру отношения не имеет. Одиночная карьера подписи не получает вовсе:
   ждать там некого. Сторож — tools/check-mp-ready.js. */
/* Двое в лобби не могут быть одним ником.
   Ник это ключ команды: MP.teamOf сортирует по нику, ccDropKey зовёт команду составом ников,
   showFinalsLandingPicker выкидывает ботов с совпавшими никами (пропал бы и настоящий SWIZZY).
   Поэтому запрет по ключу ника, а не по карточке, тёзки тоже не пускаются.
   Уходит вошедший, владелец остаётся с причиной на плитке: второму хватит сменить карточку
   и зайти по тому же коду. */
function ccMpSameWhy(){
  if(!ccMpOn() || typeof MP==='undefined') return null;
  const peer=MP.peer;
  const me=(typeof careerCard==='function') ? careerCard() : null;
  if(!peer || !me || !peer.handle || !me.handle) return null;
  return (hKey(peer)===hKey(me)) ? L().ccMpSameCard(ccHandle(me.handle)) : null;
}
/* Карточка напарника пришла — самое время посмотреть, кто это.

   Зовётся из mp.js на каждое обновление карточки: и на первое (state при
   входе), и на все следующие (card). Проверка дешёвая, а момент единственный,
   когда про напарника вообще что-то известно. */
function ccMpPeerCheck(){
  /* В гонке пришедшая карточка — это новый сосед, и ему сразу уходит своя
     строка гонки: по ней клиент, зашедший командной дверью, понимает, что
     попал в гонку (см. ccMpKindCheck), даже на воркере без race в state. */
  if(ccRaceOn() && !ccMpTeam()){ try{ careerRaceSend(); }catch(e){} ccMpRedraw(); return; }
  ccMateReMerge();
  const why=ccMpSameWhy();
  if(!why){ ccMpRedraw(); return; }
  if((CAREER.career.mp.role||'a')!=='a'){ ccMpLeaveBad(why); return; }
  ccMpRedraw();
}
/* Один дивизион на двоих. Первое состояние от сервера переписывает командные поля (CC_TEAM_KEYS) целиком,
   и карьера, созданная в другом дивизионе (CC.div), молча оказывалась в чужом. Поэтому состояние с другим
   дивизионом не применяется: лобби помечается непригодным, плитка команды объясняет причину (как с разными
   сборками), выход через «разорвать дуо». Сравнивается только первое состояние с уже заданным дивизионом;
   у создателя лобби команда пустая, он проходит. */
let CC_MP_DIV_BAD=null;
function ccMpStateOk(team, known){
  const cr=CAREER && CAREER.career;
  if(typeof ccUndoGoSkip==='function' && ccUndoGoSkip(team)) return false;   // только что откатились вдвоём
  /* Состояние команды СТАРШЕ своего дня при входе не берётся (Notion 22.10, игрок: «вышел и зашёл — карьеру отбросило
     к началу сезона»). «Своя команда — истина» писалось для сейва, который отстал от сервера; когда отстал сервер
     (отправка не дошла), вход откатывал карьеру назад. Тот же порог, что у ccMpApplyRemote: день команды идёт только
     вперёд. Серверу уходит своё, более новое. */
  if(cr && team && team.day && cr.day && team.day<cr.day && team.seed && cr.seed===team.seed){
    CC_MP_DIV_BAD=null;
    try{ if(typeof MP!=='undefined' && MP.push) setTimeout(function(){ try{ MP.push(ccTeamState()); }catch(e){} }, 0); }catch(e){}
    return false;
  }
  if(!cr || !team || !team.division || !cr.division){ CC_MP_DIV_BAD=null; return true; }
  /* Свой же в своё лобби заходит всегда.

     Сид — это и есть имя команды: он общий, приезжает от сервера и живёт в
     сейве. Совпал — мы уже играли за эту команду, и её состояние есть истина,
     даже если наш сейв отстал. Отстать он может: вечер оборвался ровно на
     повышении, close не доехал, у нас четвёртый дивизион, у команды третий.
     Без этой строки запрет запирал бы человека в его собственной карьере. */
  /* Карьера С ДРУГОГО ДНЯ в чужую команду не входит. Отзыв:
     «запретить заходить с разных версий: если у кого один день, а другой с
     другой карьеры зашёл». Своя команда (lobbySeed совпал) — всегда можно,
     состояние команды и есть истина; чужая — только пустой карьере или с тем
     же днём. Иначе один сейв молча перетирал бы другой. */
  if(known===false && team.seed && team.day && cr.day && team.day!==cr.day && (cr.log||[]).length){
    CC_MP_DIV_BAD=null;
    ccMpLeaveBad(L().ccMpOtherCareer(ccDayLabel(cr.day)));
    return false;
  }
  if(team.seed && cr.seed===team.seed){ CC_MP_DIV_BAD=null; return true; }
  if(team.division===cr.division){ CC_MP_DIV_BAD=null; return true; }
  CC_MP_DIV_BAD={mine:cr.division, team:team.division};
  ccMpLeaveBad(L().ccMpDivDiff(cr.division, team.division));
  return false;
}
/* Отменить вход в лобби целиком.

   Отзыв: «все равно могу зайти в лобби, если игрок другого
   дивизиона, запрети». Первая правка запрещала играть — карьера оставалась
   командной с живой связью и красной строкой на плитке. Это не запрет, а
   тупик: играть нельзя, выйти надо догадаться.

   Поэтому вход откатывается так же, как откатывается неудачное подключение
   (см. ccMpEnter): лобби покидается, признак команды снимается, карьера
   остаётся одиночной и целой — с тем дивизионом, днём и сезоном, с которыми
   человек её создавал. Причина говорится сразу, окном: после отката плитки
   команды на экране уже нет, и сказать её больше негде. */
function ccMpLeaveBad(why){
  try{ if(typeof MP!=='undefined' && MP.drop) MP.drop(); }catch(e){}
  if(CAREER && CAREER.career) delete CAREER.career.mp;
  try{ careerSave(); }catch(e){}
  ccMpRedraw();
  if(why) ccTell(why);
}
/* Лобби отказало по дивизиону — тем же окном и тем же откатом, что и отказ,
   пойманный уже внутри. Разница только в том, что теперь отказ приходит с
   порога: см. lobby.join. */
// Команда уже полная: третьему тем же откатом, что и отказу по дивизиону. Для троих и больше есть гонка.
function ccMpByeFull(){ ccMpLeaveBad(L().ccMpFull || I18N.en.ccMpFull); }
function ccMpByeDiv(mine, theirs){
  CC_MP_DIV_BAD={mine:mine||((CAREER&&CAREER.career&&CAREER.career.division)||'?'), team:theirs||'?'};
  ccMpLeaveBad(L().ccMpDivDiff(CC_MP_DIV_BAD.mine, CC_MP_DIV_BAD.team));
  CC_MP_DIV_BAD=null;
}
function ccMpDivWhy(){
  if(!ccMpOn() || !CC_MP_DIV_BAD) return null;
  return L().ccMpDivDiff(CC_MP_DIV_BAD.mine, CC_MP_DIV_BAD.team);
}
/* В команде ровно один игл и один фраггер: вопросы разделены по ролям (CC_MP_WHO), у двух иглов фраггерский
   вопрос ушёл бы тай-брейку по нику.
   В одиночке это держит ccSquadRoleFits обменом; в команде каждый меняет роль у себя, нужен отдельный запрет.
   Из лобби не выкидываем, чинится кнопкой под своей карточкой: вечер просто не стартует, причина на плитке команды
   и под кнопкой вечера. */
function ccMpRolesWhy(){
  if(!ccMpOn() || typeof MP==='undefined') return null;
  const me=(typeof careerCard==='function') ? careerCard() : null;
  const peer=MP.peer;
  if(!me || !peer) return null;
  const a=ccMpRoleKey(me), b=ccMpRoleKey(peer);
  // Роли ещё не знаем — не запрещаем: запрет на незнании запер бы карьеру.
  if(!a || !b) return null;
  // Два ИГЛа — нельзя; два фраггера — можно (без бонуса за роли, ccSquadRoleFits).
  return (a==='roleIGL' && b==='roleIGL') ? L().ccMpRolesBad : null;
}
/* Один режим на двоих: «играть» или «смотреть».

   Отзыв: «еще они должны выбрать один режим смотреть/играть
   должно запрещать если у них разные». И это не вкусовщина: в «смотреть»
   вопросы не задаются вовсе (careerSimOn в playGameWithChoices), то есть у
   двоих получается разное число решений и разные пути расчёта — ровно то, чем
   был опасен пропуск, только на весь вечер.

   Разошлись — вечер не начинается, и об этом сказано под самими кнопками
   режима (careerSimRowHTML), там, где его и меняют.

   Пока режим напарника неизвестен (старая сборка, карточка ещё не доехала),
   НЕ запрещаем: запрет на незнании запер бы карьеру наглухо, а расхождение
   поймает первое же сравнение, когда карточка придёт. */
function ccMpModeWhy(){
  if(!ccMpOn() || typeof MP==='undefined') return null;
  const peer=MP.peer;
  if(!peer || peer.sim===undefined || peer.sim===null) return null;
  return (!!peer.sim === careerSimOn()) ? null : L().ccMpModeDiff;
}
/* Почему командный вечер не начать — одной строкой.

   Собирает всё, чем командная карьера может запретить вечер: связь, дивизион,
   одинаковых игроков (ccMpWhy) и разные режимы (ccMpModeWhy). Нужна затем, что
   у запрета есть последствие на экране — кнопка, — и она обязана говорить
   причину, а не молчать. */
function ccMpBlockWhy(){
  if(!ccMpOn()) return null;
  // Соло сыграно, день стоит — ждём итог напарника. См. ccSoloTeamSettle.
  return ccMpWhy() || ccMpModeWhy() ||
    ((typeof ccSoloWaitingPeer==='function' && ccSoloWaitingPeer()) ? ccSoloWaitText() : null);
}
/* День соло в команде шагает, когда отыграли оба.

   Вечер личный, день общий. Кто отыграл первым — отдал свой итог и ждёт;
   кто вторым — видит чужой итог уже у себя (он приехал командным состоянием)
   и шагает день за обоих. Напарнику, которому играть нечего (не прошёл,
   уже отыграл), ждать незачем. Зовётся из конца соло-раннера и из
   ccMpApplyRemote — куда бы ни приехал второй итог, день шагнёт. Идемпотентно:
   после шага сегодня уже не день соло. Сторож — tools/check-mp-solo-shared.js. */
/* Свой вечер на сегодня закрыт: этап сыгран, а для квала — сыграна именно
   сегодняшняя сессия или проход уже есть (тогда сегодня играть нечего). */
/* Какими словами ждать напарника. Скриншот (сессия 2 квала):
   «ты отыграл своё соло», а он в этот день не играл — прошёл в первой сессии,
   и сегодня ему играть нечего. Слова — по причине, а не по факту ожидания. */
function ccSoloWaitText(){
  const ev=careerSoloSeriesOn(careerToday());
  const me=careerCard(), mine=me ? ccSoloStateOf(ev, me) : null;
  if(ev && ev.series!=='solos' && ev.stage==='qual' && mine && mine.pass==='qual' && mine.day!==ev.day) return L().ccMpSoloThrough;
  return L().ccMpSoloWait;
}
/* Может ли напарник вообще стоять в этой сотне ботом: допущен на этап и
   сегодня ещё не отыграл. См. peerBot в runCareerSoloSeries. */
/* Почему соло сегодня закрыто — словами этапа, а не заглушкой про Мейджоры
   (скриншот: «Majors are not wired into a career yet» на дне
   финала Solo Series, куда он не прошёл). */
function ccSoloWhyLocked(){
  const ev=careerSoloSeriesOn(careerToday());
  const me=careerCard(), s=me ? ccSoloStateOf(ev, me) : null;
  if(!ev) return L().chSoonHint;
  if(ccSoloDoneToday(ev, s)) return ccSoloWaitText ? (ccMpTeam() ? ccSoloWaitText() : L().ccSoloPlayed) : L().ccSoloPlayed;
  /* У FNCS Solos причина закрытого вечера — не «не прошёл предыдущий этап», а
     «сюда не садился»: во второй круг не пускают тех, у кого место уже есть,
     а в хиты, LCQ и финал — тех, кому его не дали. */
  if(ev.series==='solos'){
    if(ev.stage==='q2') return L().ccSolosSeated;
    return L().ccSolosNoSeat;
  }
  if(ev.stage==='heats') return L().ccSoloNeedQual;
  if(ev.stage==='final') return L().ccSoloNeedHeats;
  return L().chSoonHint;
}
function ccSoloPeerSeat(ev, s){
  if(!ev) return false;
  if(ccSoloDoneToday(ev, s)) return false;
  if(ev.series==='solos') return careerSolosCanFor(ev.stage, s, ev.id);
  if(ev.stage==='qual')  return true;
  if(ev.stage==='heats') return !!(s && s.pass==='qual');
  if(ev.stage==='final') return !!(s && s.pass==='heats');
  return false;
}
function ccSoloDoneToday(ev, s){
  if(!ev || !s || s.got!==ev.stage) return false;
  // У FNCS Solos сессий-дублей нет вовсе: этап сыгран — этап закрыт.
  if(ev.series==='solos' || ev.stage!=='qual') return true;
  return s.pass==='qual' || s.day===ev.day;
}
function ccSoloTeamSettle(){
  if(!ccMpTeam() || typeof MP==='undefined' || CC_MP_RAND) return false;
  const ev=careerSoloSeriesOn(careerToday());
  if(!ev) return false;
  const me=careerCard();
  if(!me) return false;
  const mine=ccSoloStateOf(ev, me);
  if(!ccSoloDoneToday(ev, mine)) return false;          // сам ещё не отыграл (или ещё может)
  /* Шагает только день, когда соло-вечер сыгран СЕГОДНЯ (20.10, онлайн-прогон: вдвоём прошли квал 10.01, день штатно встал на
     11.01 — там третья сессия, — пришло состояние напарника, и «прошёл квал» читалось как «сегодня отыграно»: день уезжал на 12.01,
     и 11-е с Reload Opens пропадало. В одиночку такого нет.) */
  /* Но и не встаёт насовсем: второй день хитов, где обоим играть нечего, должен шагать (сторож check-mp-solo-shared).
     Держит день не «сыграно не сегодня», а ДРУГОЙ турнир сегодня, который можно сыграть (Reload Opens 11.01). */
  if(!mine || mine.day!==careerToday()){
    let other=false;
    try{ other=(careerEvents().get(careerToday())||[]).some(e=>e.kind!=='solo' && careerCanPlayKind(e.kind)); }catch(e){ other=true; }
    if(other) return false;
  }
  const peer=MP.peer;
  if(peer && careerSoloSeriesCanFor(ev, ccSoloStateOf(ev, peer))) return false;   // напарник ещё может сыграть
  CC_MP_ALONE=true;
  try{ careerAdvanceTo(ccAddDays(careerToday(), 1)); }
  finally{ CC_MP_ALONE=false; }
  careerSave();
  return true;
}
// Панели дня: сам отыграл соло, а день стоит — потому что ждём напарника.
function ccSoloWaitingPeer(){
  if(!ccMpTeam() || typeof MP==='undefined') return false;
  const ev=careerSoloSeriesOn(careerToday());
  if(!ev) return false;
  const me=careerCard(), mine=me ? ccSoloStateOf(ev, me) : null;
  if(!ccSoloDoneToday(ev, mine)) return false;
  const peer=MP.peer;
  return !!(peer && careerSoloSeriesCanFor(ev, ccSoloStateOf(ev, peer)));
}

/* «n/N» на кнопке «Играть» — и в гонке тоже. Отзыв: «не пишет в
   race ещё сколько игроков готово, там 1/3, 0/3 как в дуо, чтоб запустить лобби
   со всеми». Тег стоял только под командой (ccMpOn), а гонка в общей комнате
   ждёт тех же «готов» через тот же гейт (ccMpLock). Знаменатель — сколько людей
   в комнате: от сервера (of = все в комнате), до первого ответа — сам и
   соперники. Врозь (ccRaceApartWhy) гейта нет, значит и тега нет. */
function ccMpReadyTag(){
  if(typeof MP==='undefined') return '';
  const race=!ccMpOn() && ccRaceOn() && typeof ccRaceShared==='function' &&
             ccRaceShared(typeof careerNext==='function' ? careerNext() : null);
  if(!ccMpOn() && !race) return '';
  const w=MP.waiting;
  const n=(w && w.day===careerToday()) ? (w.n||0) : 0;
  const of=(w && w.day===careerToday() && w.of) || (race ? ccRaceHumansN() : CC_MP_HUMANS);
  return ' '+n+'/'+of;
}
/* «Ждём напарника…» — окно на время, пока не приехал второй голос.

   Вопрос не твой — вечер стоит, пока не ответит хозяин вопроса (ccMpChoose).
   Без окна это выглядит как зависший экран. Окно ничего не спрашивает и ничем
   не управляет, нажать на него нельзя — оно закрывается само, когда голос
   доехал. */
/* Окон ожидания стало несколько — «ждём напарника» и «напарник выбрал», — а
   место у них одно: они оба прижаты к низу экрана и легли бы друг на друга.
   Поэтому окно одно, а сообщения складываются стопкой: видно последнее, при
   закрытии возвращается предыдущее, пустая стопка убирает окно совсем. */
let CC_MP_WAIT=[], CC_MP_WAIT_TICK=null;
/* Ожидание должно быть ВИДНО, иначе оно неотличимо от зависания.

   Потолок ожидания — минуты: столько может идти чужая игра на медленной
   машине. Всё это время экран стоит, и игрок честно читает его как поломку.
   Отчёт: «у одного таблица у другого симуляция зависла».
   Поэтому у ожидания идёт счёт секунд: видно, что вечер жив и чего он ждёт.

   Часы тикают только пока есть чего ждать: пустая стопка их гасит. */
function ccMpWaitDraw(){
  var d=document.getElementById('ccMpWait');
  if(!CC_MP_WAIT.length){
    if(d) try{ d.remove(); }catch(e){}
    if(CC_MP_WAIT_TICK){ clearInterval(CC_MP_WAIT_TICK); CC_MP_WAIT_TICK=null; }
    return;
  }
  if(!d){
    d=document.createElement('div');
    d.id='ccMpWait'; d.className='cc-mp-wait';
    document.body.appendChild(d);
  }
  var top=CC_MP_WAIT[CC_MP_WAIT.length-1];
  var sec=top.at ? Math.round(((new Date()).getTime()-top.at)/1000) : 0;
  d.textContent=top.t+(top.at ? '  '+sec+' с' : '')+(top.at ? ccMpPeerLine() : '');
  if(!CC_MP_WAIT_TICK) CC_MP_WAIT_TICK=setInterval(ccMpWaitDraw, 1000);
}
function ccMpWaitBox(text, live){
  var item={t:text||'', at: live ? (new Date()).getTime() : 0};
  CC_MP_WAIT.push(item);
  ccMpWaitDraw();
  return function(){
    var i=CC_MP_WAIT.indexOf(item);
    if(i<0) return;
    CC_MP_WAIT.splice(i, 1);
    ccMpWaitDraw();
  };
}
/* Команда заводится ТОЛЬКО когда лобби ответило.

   Раньше код записывался сразу, а подключение шло следом — и если лобби
   недоступно (а до выкладки сервера оно недоступно всегда), карьера
   оставалась командной с мёртвой связью: день в ней двигает только сервер,
   то есть она просто вставала. Теперь неудача не оставляет следов: карьера
   как была одиночной, так и осталась. */
function ccMpEnter(mp){
  if(!CAREER || !CAREER.career) return Promise.resolve(false);
  var was=CAREER.career.mp;
  CAREER.career.mp=mp;
  /* Обработчики решений — ДО подключения, как в ccMpBoot. Раньше их вешал
     только ccMpBoot при загрузке сохранённой командной карьеры: кто завёл
     лобби и сразу играл, не перезагружая страницу, не считал ни голоса
     «пропустить», ни предложения третьего. Живой сторож 28 августа
     (check-mp-live-two): два голоса в очереди — и «скип 0/2». */
  if(typeof ccMpThirdWire==='function') ccMpThirdWire();
  /* Регион команды ставит тот, кто её создал. Вошедшему вторым он приедет от
     сервера вместе с днём и перезапишет этот — так и надо: команда играет там,
     где её завели. */
  if(mp.role==='a' && !CAREER.career.region && CAREER.player)
    CAREER.career.region=CAREER.player.region||'EU';
  // День, с которого у команды идёт стаж (careerChemDays). Ставит создатель,
  // вошедшему приедет с состоянием.
  if(mp.role==='a' && !CAREER.career.chemSince && typeof careerToday==='function')
    CAREER.career.chemSince=careerToday();
  return MP.connect(mp.code, ccMpId()).then(function(){
    CC_MP_FAIL=null;
    careerSave();
    ccMpRedraw();
    return true;
  }).catch(function(){
    if(was===undefined) delete CAREER.career.mp; else CAREER.career.mp=was;
    /* Отказ ЗАПОМИНАЕТСЯ, а не только откатывается. Отчёт
       («как только создаёшь карьеру, нет кода») пришёл в день, когда лобби
       лежало целиком: откат делал карьеру одиночной молча, плитки команды
       на хабе не было вовсе — и человек искал код там, где его не могло быть.
       Теперь плитка стоит и говорит, что лобби не ответило, с кнопкой
       попробовать снова. См. careerMpTileHTML / ccMpRetry. */
    CC_MP_FAIL={code:mp.code, role:mp.role};
    /* И транспорт отпускается: иначе сокет продолжал бы стучаться в лобби
       по таймеру (см. onclose в mp.js), а дозвонившись, сидел бы в нём с
       одиночной карьерой — призрак в чужом лобби. Отпускать можно только
       то, что мы сами и завели: команда, которая была до этого, остаётся. */
    if(was===undefined && typeof MP!=='undefined' && MP.drop) MP.drop();
    // Связь не состоялась — так и сказать. Состояние ставит и сам транспорт,
    // но не всякий отказ доходит до сокета (адрес не разобрался, лобби нет),
    // а карьера обязана знать ответ в любом случае.
    if(typeof MP!=='undefined' && MP.state!=='old') MP.state='lost';
    careerSave();
    ccMpRedraw();
    return false;
  });
}
// Последняя неудавшаяся попытка завести команду — пока игрок не решил, что с ней делать.
let CC_MP_FAIL=null;
function ccMpRetry(){
  const f=CC_MP_FAIL;
  if(!f) return;
  CC_MP_FAIL=null;
  return ccMpEnter({code:f.code, role:f.role});
}
function ccMpFailOff(){
  CC_MP_FAIL=null;
  ccMpRedraw();
}
function careerMpCreate(){
  return ccMpEnter({code:ccMpCode(), role:'a'});
}
function careerMpJoin(code){
  return ccMpEnter({code:String(code).toUpperCase(), role:'b'});
}
// Хаб уже нарисован к этому моменту (карьера заводится кнопкой на экране
// создания), а плитка команды на нём появляется только после записи mp.
function ccMpRedraw(){
  if(typeof careerRenderHub==='function' && document.getElementById('chBody'))
    careerRenderHub('centre');
}
/* Две двери в командную карьеру — с экрана создания.

   Карьеру всё равно надо сначала завести: командное состояние живёт в ней же
   (CAREER.career.mp), и вешать лобби не на что, пока сейва нет. Поэтому обе
   кнопки — это обычный старт плюс одна строчка сверху, и обе молчат, пока
   экран не готов: тот же запрет, что и на самой кнопке старта. */
/* Намерение завести команду — от нажатия в меню до конца создания карьеры.

   Двери стоят в полосе карьеры на главной (.cstrip), а карьеру всё равно надо
   построить: командное состояние живёт в ней же (CAREER.career.mp). Значит
   между нажатием и лобби есть целый экран, и намерение обязано его пережить —
   иначе игрок доходит до конца и не понимает, что создал.

   null — обычная одиночная; {role:'a'} — создаём команду; {role:'b', code} —
   входим по чужому коду. Читается в ccStart, показывается строкой на экране
   создания (ccMpNote). */
let CC_MP_NEW=null;
function ccMpNoteDraw(){
  const el=document.getElementById('ccMpNote');
  if(!el) return;
  const t=!CC_MP_NEW ? '' : (CC_MP_NEW.role==='b'
    ? L().ccMpJoinNote(CC_MP_NEW.code) : L().ccMpNewNote);
  el.innerHTML=t ? '<span>'+esc(t)+'</span>'+
    '<button type="button" class="cc-mp-note-x" onclick="ccMpNewCancel()">✕ '+
    esc(L().ccMpNoteOff)+'</button>' : '';
  el.hidden=!t;
}
/* Снять намерение «вдвоём».

   Отзыв: «а соло карьеру можно запустить? то везде этот код».
   CC_MP_NEW ставился нажатием на дверь и снимался ТОЛЬКО в ccStart — то есть
   игрок, который нажал «войти по коду», передумал и ушёл назад, уносил
   намерение с собой: следующая заведённая карьера снова оказывалась половиной
   команды и снова просила код. Теперь намерение снимается крестиком на метке,
   кнопкой «назад» на обоих экранах и самим входом в одиночную карьеру. */
function ccMpNewCancel(){
  CC_MP_NEW=null;
  ccMpNoteDraw();
}
function careerMpNew(){
  if(!CC_MP_OPEN) return;
  CC_MP_NEW={role:'a'};
  ccMpStartNew();
}
/* Окно кода — своё, а не системный prompt(). Отзыв: «окно, где
   вводить код, — под наш стиль». Та же коробка, что у вопросов (cc-ask-box),
   поле на шесть знаков, «Войти» оживает, когда знаков шесть; Enter и Escape
   работают как кнопки. */
function careerMpJoinNew(){
  if(!CC_MP_OPEN) return;
  ccCodeOpen(function(code){
    CC_MP_NEW={role:'b', code:code};
    ccMpStartNew();
  });
}

/* Гонка карьер: каждый играет свою карьеру, лобби возит между ними только сводку (сезон, дивизион, рейтинг,
   заработок, место в PR). Ничего общего не считается, барьеров и общих бросков нет, расходиться нечему.
   Живёт в cr.race, а не в cr.mp: всё командное висит на ccMpTeam() → cr.mp.code, и локстеп здесь
   сам не включится. Сторож check-career-race. */
function ccRaceOn(){
  return !!(CAREER && CAREER.career && CAREER.career.race && CAREER.career.race.code);
}
function ccRaceLive(){
  return ccRaceOn() && typeof MP!=='undefined' && MP.state==='live';
}
let CC_RACE_PEERS={};      // id → сводка соперника, приходит по act('race')
/* РАНГ СВОЕГО ТУРНИРА НА СЕГОДНЯ (место в CC_KIND_RANK, 99 — свободный день) — едет в строке
   гонки (kr). В день с двумя турнирами (13.06: финал недели и соло Victory Cup) квалифицированный
   берёт финал, остальные — Victory Cup, и гейт сервера отменял вечер всем как «разные события»
   (проба 9.09 15:19). Комната вечера — по БОЛЬШИНСТВУ рангов (при равенстве — старший турнир);
   кто в меньшинстве, играет своё врозь. Воркер считает так же (lobby.room). */
let CC_RACE_MY_KR=99;
/* ЧЕЙ ВОПРОС ИДЁТ НА КАРТЕ. В общей комнате гонки вопросы соперников считаются и у меня (их
   ответ приезжает проводом и ложится на ИХ команду), но результат рисовался как мой: баннер
   «Refresh found, +3 power» и строка лога у обоих. Скриншот (страница 3d6b…64bd):
   «почему сразу двум начисляют повер, это race, не дуо». Сила шла кому надо — надпись нет.
   Теперь чужой результат подписан именем соперника в логе, баннера у него нет, а «напарник
   выбрал» в гонке читается «JarKo & Kure: …». */
let CC_ASK_FOR=null;
function ccAskRivalName(){
  const t=CC_ASK_FOR; if(!t || !t.isRival) return null;
  return String(t.name||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim() || null;
}
function ccAskTag(text){ const n=ccAskRivalName(); return n ? n+': '+text : text; }
function ccRaceRivalNameOf(kind){
  const at=String(kind).indexOf(':'); if(at<0) return null;
  const key=String(kind).slice(at+1);
  const p=(typeof ccRaceRivals==='function' ? ccRaceRivals() : []).find(x=>x.card && hKey(x.card)===key);
  if(!p) return null;
  const mates=(p.mates||[]).filter(Boolean).map(m=>ccHandle(m.handle));
  return [ccHandle(p.card.handle)].concat(mates).join(' & ');
}
// «Напарник выбрал: …» — в гонке чужой ответ подписан именем соперника.
function ccMpPickTell(kind, text){
  const race=(typeof ccRaceLock==='function' && ccRaceLock() && !(typeof ccMpTeam==='function' && ccMpTeam()));
  const n=race ? ccRaceRivalNameOf(kind) : null;
  ccMpTell(n ? L().ccRivalPicked(n, text) : L().ccMpMatePicked(text));
}function ccKindRank(type){ if(!type || type==='free') return 99; const i=CC_KIND_RANK.indexOf(type); return i<0 ? 98 : i; }
function ccRaceKrMajor(){
  const today=careerToday(), cnt={};
  const add=k=>{ if(k!=null && k<99) cnt[k]=(cnt[k]||0)+1; };
  add(CC_RACE_MY_KR);
  ccRaceRivals().forEach(p=>{ if(p.day===today) add(p.kr); });
  let best=null; Object.keys(cnt).map(Number).forEach(k=>{ if(best==null || cnt[k]>cnt[best] || (cnt[k]===cnt[best] && k<best)) best=k; });
  return best;
}
const CC_RACE_RESUME_WAIT=6000;   // сколько ждать строки соперников после перезагрузки (ccMpResume)
let CC_RACE_WIRED=false;
/* Общий календарь в гонке. Вечера, лобби и броски у каждого свои, общие только часы: день закрывается, когда закрыли оба (голоса, как ccMpNextSaw).
   Отстающий идёт свободно, ждёт только тот, кто впереди или вровень, иначе вошедшие в разные дни встали бы намертво.
   Ждём только при живой связи (ccRaceLive) и если соперник присылал сводку. «Идти дальше одному» снимает ожидание на день (ccRaceGoAlone).
   Перемотка (CC_FF) через гейт не идёт, перемотавший потом ждёт, пока второй догонит. */
let CC_RACE_NEXT={day:null, who:{}};   // день → кто уже закрыл (id)
let CC_RACE_STEP=false;          // пропуск на один шаг: голоса сошлись
let CC_RACE_ALONE=null;          // день, на котором игрок решил идти без соперника
function ccRacePeers(){
  return Object.keys(CC_RACE_PEERS).map(k=>CC_RACE_PEERS[k]).filter(Boolean);
}
function ccRaceHold(iso){
  if(CC_RACE_STEP || !ccRaceLive()) return false;
  if(typeof CC_FF!=='undefined' && CC_FF) return false;      // перемотка идёт своим ходом
  if(CC_RACE_ALONE===careerToday()) return false;            // сегодня решили без него
  if(iso!==ccAddDays(careerToday(), 1)) return false;        // не однодневный шаг
  const peers=ccRacePeers();
  if(!peers.length) return false;                            // о соперниках ничего не знаем
  return peers.some(p=>p && p.day && p.day<=careerToday());   // кто-то ещё не дошёл
}
/* Голоса считаются ПОИМЁННО, а не «мой и его»: в гонке людей может быть
   больше двух (см. CC_RACE_MAX и lobby.join), и день закрывается, когда его
   закрыли все, кто в лобби. */
/* СОСЕД ЖИВ, если от него что-то приходило за CC_RACE_GONE_MS. Пульс в гонке идёт и в хабе
   (ccMpSeedOff его не гасит), так что закрывшаяся вкладка выпадает из счёта за полторы минуты —
   а без этого её строка держала знаменатель голосов (день, перемотка, конец года) навсегда:
   двухсезонная проба 9.09 — двое вышли на 27.10, четверо во втором сезоне ждали 6/6. Посреди
   сеяного вечера правило не действует (там свои потолки, ccMpDeadline): барьер не должен
   проходить без того, кто на минуту потерял сеть. */
const CC_RACE_GONE_MS=90000;
function ccRacePeerAlive(p){
  if(!p || typeof MP==='undefined' || !MP.peerAt) return true;
  if(typeof CC_MP_RAND!=='undefined' && CC_MP_RAND) return true;
  const at=MP.peerAt[p.id]; return !at || (Date.now()-at)<CC_RACE_GONE_MS;
}
function ccRaceOf(){ return 1+ccRacePeers().filter(ccRacePeerAlive).length; }
function ccRaceVotes(){
  return CC_RACE_NEXT.day===careerToday() ? Object.keys(CC_RACE_NEXT.who).length : 0;
}
function ccRaceIVoted(){
  return CC_RACE_NEXT.day===careerToday() && !!CC_RACE_NEXT.who[ccMpId()];
}
function ccRaceVote(){
  if(typeof MP==='undefined' || !MP.act) return;
  if(ccRaceIVoted()) return;                                          // уже голосовал
  try{ MP.act('nextday', {by:ccMpId(), day:careerToday()}); }catch(e){}
  /* Свой голос считаем СРАЗУ, не дожидаясь эха от сервера: в командной
     карьере на эхо можно положиться (там весь вечер на нём и стоит), а гонке
     хватает того, что решение уже принято здесь. Эхо, если придёт, поставит
     ту же отметку второй раз — это ничего не меняет. */
  ccRaceNextSaw({by:ccMpId(), day:careerToday()});
}
/* ГОЛОС ЗА ДЕНЬ, ДО КОТОРОГО Я ЕЩЁ НЕ ДОШЁЛ, — не мусор, а голос: он ляжет в счёт, когда я
   приду на этот день. Раньше такой голос выбрасывался, и последний день года не закрывался:
   проба 9.09 (дуо→трио) — пятеро проголосовали за 27.10 в t2931–2933, шестой пришёл на
   27.10 в t2944 и насчитал 1/6, а голосуют один раз (ccRaceIVoted). См. ccRaceNextCatch. */
let CC_RACE_NEXT_AHEAD={};   // день → {id:1} голоса за дни впереди моего
function ccRaceNextCatch(){
  const today=careerToday();
  Object.keys(CC_RACE_NEXT_AHEAD).forEach(d=>{ if(d<today) delete CC_RACE_NEXT_AHEAD[d]; });
  const w=CC_RACE_NEXT_AHEAD[today]; if(!w) return;
  delete CC_RACE_NEXT_AHEAD[today];
  if(CC_RACE_NEXT.day!==today) CC_RACE_NEXT={day:today, who:{}};
  Object.keys(w).forEach(k=>{ CC_RACE_NEXT.who[k]=1; });
}
function ccRaceNextSaw(p){
  if(!p || !p.day) return;
  if(p.day>careerToday()){ (CC_RACE_NEXT_AHEAD[p.day]=CC_RACE_NEXT_AHEAD[p.day]||{})[p.by||'peer']=1; return; }
  if(p.day!==careerToday()) return;
  if(CC_RACE_NEXT.day!==p.day) CC_RACE_NEXT={day:p.day, who:{}};
  CC_RACE_NEXT.who[p.by||'peer']=1;
  if(ccRaceVotes()>=ccRaceOf()){
    CC_RACE_NEXT={day:null, who:{}};
    CC_RACE_STEP=true;
    try{ careerAdvanceTo(ccAddDays(careerToday(), 1)); }
    finally{ CC_RACE_STEP=false; }
  }
  if(typeof careerRenderHub==='function' && document.getElementById('chBody'))
    careerRenderHub('centre');
}
// Ждём ли мы сейчас остальных — этим держится подпись на кнопке и плитка.
function ccRaceWaiting(){
  return ccRaceLive() && ccRaceIVoted() && ccRaceVotes()<ccRaceOf();
}
function ccRaceGoAlone(){
  CC_RACE_ALONE=careerToday();
  CC_RACE_NEXT={day:null, who:{}};
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  if(typeof careerRenderHub==='function') careerRenderHub('centre');
}
// Сводка карьеры одной строкой — ровно то, чем меряются.
function careerRaceCard(){
  const cr=CAREER && CAREER.career, pl=CAREER && CAREER.player;
  if(!cr || !pl) return null;
  const pr=(function(){ try{ const rows=careerPrRows(); const me=rows.findIndex(r=>r.you);
    return me<0 ? null : {rank:me+1, pr:rows[me].pr}; }catch(e){ return null; } })();
  const log=(cr.log||[]).filter(r=>r.place);
  const best=log.length ? Math.min.apply(null, log.map(r=>r.place)) : null;
  // Плюс своя строка для общей комнаты: карточка, напарники, сила на вечер (ccRaceMyLine).
  return Object.assign({nick:pl.nick||'', ovr:pl.ovrExact!=null?Math.round(pl.ovrExact):pl.ovr,
          div:cr.division, season:cr.season||1, day:cr.day,
          money:cr.earnings||0, wins:log.reduce((a,r)=>a+(r.wins||0),0),
          events:log.length, best:best, titles:(cr.ewc||[]).length,
          pr:pr?pr.pr:0, prRank:pr?pr.rank:0, org:(CAREER.org&&CAREER.org.name)||null},
          (typeof ccRaceMyLine==='function') ? ccRaceMyLine() : {});
}
function careerRaceSend(){
  if(!ccRaceLive() || typeof MP==='undefined' || !MP.act) return false;
  const card=careerRaceCard();
  if(!card) return false;
  try{ MP.act('race', card); }catch(e){ return false; }
  CC_STYLE_SENT=card.ps||null;   // своя команда в общем вечере — по отправленному (ccStyleOwnSent)
  return true;
}
function careerRaceWire(){
  if(CC_RACE_WIRED || typeof MP==='undefined' || !MP.on) return;
  CC_RACE_WIRED=true;
  /* Ушедший из гонки не должен держать общий день: пока его сводка лежит в
     таблице, ccRaceOf считает его живым и календарь ждёт голоса, которого не
     будет. Сервер говорит об уходе (bye/part с полем by) — по нему и убираем.
     Дверь «идти дальше одному» остаётся на случай, когда человек не ушёл, а
     просто закрыл вкладку. */
  MP.on('bye', function(m){
    if(!m || !m.by || !ccRaceOn()) return;
    if(CC_RACE_PEERS[m.by]){
      delete CC_RACE_PEERS[m.by];
      if(CC_RACE_NEXT.who) delete CC_RACE_NEXT.who[m.by];
      if(typeof careerRenderHub==='function' && document.getElementById('chBody'))
        careerRenderHub('centre');
    }
  });
  MP.on('act', function(m){
    if(!m || !m.payload) return;
    /* Голос за следующий день — тот же act, что и в командной карьере, только
       считает его гонка своим счётчиком. См. ccRaceNextSaw. */
    if(m.kind==='nextday'){ if(ccRaceOn()) ccRaceNextSaw(m.payload); return; }
    /* Вечер, который сыграли без меня (не прошёл, некому играть): его призовые и рейтинг —
       в мои доски, один раз по ключу дня и вида. См. ccEvResApply. */
    if(m.kind==='res'){
      if(ccRaceOn() && m.payload.by!==ccMpId() && ccEvResApply(m.payload)){
        try{ if(typeof careerRenderHub==='function' && document.getElementById('chBody')) careerRenderHub('centre'); }catch(e){}
      }
      return;
    }
    /* «Пропустить» в общей комнате — голос, как в команде (ccMpSkipAsk шлёт его
       под ccMpLock). Считал его только командный обработчик (ccMpThirdWire, под
       ccMpOn), то есть в гонке голоса уходили в пустоту, и кнопка ждала вечно.
       Отзыв: «скип не работает». */
    if(m.kind==='skip'){ if(ccRaceOn() && !ccMpOn() && m.payload.by) ccMpSkipSaw(m.payload.by); return; }
    // Перемотка по голосам — те же три сообщения, что у команды. См. ccRaceFfOn.
    if(m.kind==='ff'){ if(ccRaceOn() && !ccMpOn()) ccMpFfSaw(m.payload); return; }
    if(m.kind==='ffno'){ if(ccRaceOn() && !ccMpOn()) ccMpFfNoSaw(m.payload); return; }
    if(m.kind==='fferr'){ if(ccRaceOn() && !ccMpOn()) ccMpFfErrSaw(m.payload); return; }
    if(m.kind==='leave'){ if(ccRaceOn() && !ccMpOn() && m.payload && m.payload.by!==ccMpId()) ccMpSplitLeave(true); return; }
    if(m.kind==='undo' || m.kind==='undono'){ if(ccRaceOn() && !ccMpOn()) ccUndoSaw(m.kind, m.payload); return; }
    // Договор пары: приглашение, согласие, отказ, разрыв. См. ccRacePairSaw.
    if(m.kind==='pair' || m.kind==='pairok' || m.kind==='pairno' || m.kind==='unpair'){ if(ccRaceOn()) ccRacePairSaw(m); return; }
    if(m.kind!=='race') return;
    if(m.by && m.by===ccMpId()) return;              // своё эхо не считаем
    /* НОВОМУ В КОМНАТЕ ОТВЕЧАЕМ СВОЕЙ СТРОКОЙ, один раз на человека. Строка гонки
       уходит по событиям своей карьеры (вход, смена дня, перед вечером), поэтому
       пришедший третьим — и вкладка после перезагрузки — не увидели бы уже сидящих
       и сочли бы, что играют одни. Ответ бывает только на первую его строку, так
       что двое не гоняют её по кругу. */
    const fresh=!CC_RACE_PEERS[m.by||'peer'];
    CC_RACE_PEERS[m.by||'peer']=ccRacePeerClean(m.payload);
    if(fresh) setTimeout(function(){ try{ careerRaceSend(); }catch(e){} }, 0);
    if(typeof careerRenderHub==='function' && document.getElementById('chBody'))
      careerRenderHub(CH_TAB);
  });
}
/* Кто впереди. Порядок такой же, каким карьеру читают глазами: дивизион
   (первый выше пятого), потом PR — публичное число этой сцены, — потом
   деньги. Ничьей не бывает: последним ключом стоит рейтинг. */
function careerRaceScore(c){
  if(!c) return -1e9;
  return (6-(c.div||5))*1e9 + (c.pr||0)*1e3 + Math.min(1e3-1, (c.money||0)/1000) + (c.ovr||0)/1000;
}
/* Строка гонки соседа приходит по проводу как есть: числа приводятся к числам, фото карточки — только свой путь или
   data:image. У честного клиента там и так числа, поэтому для локстепа ничего не меняется. */
function ccRacePeerClean(p){
  if(!p || typeof p!=='object') return {};
  ['ovr','div','season','money','wins','events','titles','pr','prRank'].forEach(k=>{ if(k in p) p[k]=Number(p[k])||0; });
  if(p.best!=null) p.best=Number(p.best)||null;
  if(p.card && typeof p.card==='object') ccPeerCardClean(p.card);
  (Array.isArray(p.mates) ? p.mates : []).forEach(c=>{ if(c && typeof c==='object') ccPeerCardClean(c); });
  return p;
}
function ccPeerCardClean(c){
  if(c._photo!=null && !/^(data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+\/=]+|[a-z0-9_\/.-]+)$/i.test(String(c._photo))) delete c._photo;
  if(c.region!=null && !/^[A-Z]{2,4}$/.test(String(c.region))) c.region='EU';
  return c;
}
function careerRaceRows(){
  const mine=careerRaceCard();
  const rows=[];
  if(mine) rows.push(Object.assign({you:true}, mine));
  Object.keys(CC_RACE_PEERS).forEach(k=>rows.push(Object.assign({you:false}, CC_RACE_PEERS[k])));
  rows.sort((a,b)=>careerRaceScore(b)-careerRaceScore(a));
  return rows;
}

/* Пара в гонке: два человека одной командой против ботов и других пар, то есть две строки гонки в одной команде.
   У каждого своя карьера (журнал, деньги пополам, рейтинг, дивизион), общий только состав вечера.
   Состав: две карточки по порядку hKey, сила careerTeam без формы/химии/эфира (иначе числа у двоих разные);
   mpTag по первой карточке, вопросы решает старший (ccMpMine), второй ждёт ответ по проводу.
   Соперники сажают пару один раз по строке старшего (ccRaceFieldSync); младший в поле не садится, но в барьерах
   и голосах считается. Только один дивизион и дуо-сезон. Обрыв связи: каждый со своим ботом.
   Протокол: act 'pair' {by,to}, 'pairok', 'unpair'. Проверка tools/check-race-pair.js (живой воркер). */
let CC_RACE_PAIR_ASK=null;   // {from, nick} — приглашение, на которое ещё не ответили
function ccRacePairId(){ const cr=CAREER && CAREER.career; return (cr && cr.race && cr.race.pair && cr.race.pair.id)||null; }
function ccRacePairPeer(){
  const id=ccRacePairId(); if(!id) return null;
  const p=CC_RACE_PEERS[id];
  return (p && p.card && p.pair===ccMpId() && ccRacePeerAlive(p)) ? p : null;
}
function ccRacePairOn(){ return !!(ccRaceOn() && careerSquadSize()===2 && ccRacePairPeer()); }
// Две карточки пары в одном порядке у обоих — по hKey.
function ccRacePairCards(){
  const me=careerCard(), p=ccRacePairPeer(); if(!me || !p) return null;
  return hKey(me)<hKey(p.card) ? [me, p.card] : [p.card, me];
}
function ccRacePairWhy(p){
  const cr=CAREER && CAREER.career; if(!cr || !p) return 'off';
  if(careerSquadSize()!==2) return 'trio';
  if(p.div!=null && p.div!==cr.division) return 'div';
  if(p.season && p.season!==(cr.season||1)) return 'season';
  return null;
}
function careerRacePairAsk(id){
  const p=CC_RACE_PEERS[id]; if(!p || ccRacePairWhy(p)) return;
  try{ MP.act('pair', {by:ccMpId(), to:id, nick:(CAREER.player.nick||'')}); }catch(e){}
  CAREER.career.race.pairAsked={id:id, at:Date.now()};
  careerRenderHub(CH_TAB);
}
/* Пара собрана — свой бот-напарник свободен и ищет команду сам (отзыв). Уходит
   той же дверью, что и «выгнать», но без штрафа к репутации: его не бросили, к тебе пришёл
   друг. Квала, взятая с ним, остаётся у пары «ты + бот» — то есть сгорает (careerSlotGiveUp,
   правило). Дальше он — обычный свободный человек сцены: пары собирают его в трансферах
   и третьим, как любого. */
function careerRacePairFree(){
  const recs=careerMateRecords().slice();
  recs.forEach(rec=>{
    const card=ccMateCardOf(rec); const who=(card && card.handle) || rec.handle || '';
    if(!who) return;
    try{ careerSlotGiveUp(who); }catch(e){}
    careerMateDrop(rec.handle || who);
    careerNews('flat', 'ccNewsPairFreed', [who]);
  });
}
function careerRacePairYes(){
  const ask=CC_RACE_PAIR_ASK; if(!ask) return;
  const p=CC_RACE_PEERS[ask.from]; if(!p || ccRacePairWhy(p)){ CC_RACE_PAIR_ASK=null; careerRenderHub(CH_TAB); return; }
  CAREER.career.race.pair={id:ask.from, nick:ask.nick||(p.card&&p.card.handle)||'', since:careerToday()};
  careerRacePairFree();
  CC_RACE_PAIR_ASK=null;
  try{ MP.act('pairok', {by:ccMpId(), to:ask.from, nick:(CAREER.player.nick||'')}); }catch(e){}
  careerSave(); careerRaceSend(); careerRenderHub(CH_TAB);
}
function careerRacePairNo(){
  const ask=CC_RACE_PAIR_ASK; CC_RACE_PAIR_ASK=null;
  if(ask) try{ MP.act('pairno', {by:ccMpId(), to:ask.from}); }catch(e){}
  careerRenderHub(CH_TAB);
}
function careerRaceUnpair(tell){
  const cr=CAREER && CAREER.career; if(!cr || !cr.race) return;
  const was=cr.race.pair; delete cr.race.pair; delete cr.race.pairAsked;
  if(tell!==false && was) try{ MP.act('unpair', {by:ccMpId(), to:was.id}); }catch(e){}
  careerSave(); careerRaceSend(); careerRenderHub(CH_TAB);
}
// Приход договора пары по проводу (зовётся из careerRaceWire).
function ccRacePairSaw(m){
  const me=ccMpId(); const p=m.payload||{};
  if(!p.by || p.by===me || p.to!==me) return false;
  // Отправителя ставит сервер (m.by); подпись в самом сообщении чужой клиент может написать любую.
  if(m.by && m.by!==p.by) return false;
  if(m.kind==='pair'){ CC_RACE_PAIR_ASK={from:p.by, nick:p.nick||''}; }
  else if(m.kind==='pairok'){
    const asked=CAREER.career.race && CAREER.career.race.pairAsked;
    if(asked && asked.id===p.by){ CAREER.career.race.pair={id:p.by, nick:p.nick||'', since:careerToday()}; delete CAREER.career.race.pairAsked; careerRacePairFree(); careerSave(); careerRaceSend(); }
  }
  else if(m.kind==='pairno'){ if(CAREER.career.race) delete CAREER.career.race.pairAsked; }
  else if(m.kind==='unpair'){ if(ccRacePairId()===p.by) careerRaceUnpair(false); }
  else return false;
  try{ if(typeof careerRenderHub==='function' && document.getElementById('chBody')) careerRenderHub(CH_TAB); }catch(e){}
  return true;
}
/* Команда пары для вечера — одна и та же у обоих: careerTeam двух карточек людей, без формы,
   химии и эфира (они у каждой карьеры свои). Зовётся из ccRaceFieldSync, до строки с силой. */
function ccRacePairTeamInto(you){
  const cards=ccRacePairCards(); if(!cards || !you) return false;
  const t=ccRaceUnseeded(()=>careerTeam(cards, true));
  Object.keys(t).forEach(k=>{ you[k]=t[k]; });
  you.isYou=true; you.isRival=false;
  you.name=L().yourTeamPrefix+teamLabel(cards);
  you.mpTag=':'+hKey(cards[0]);
  you.summitRegion=ccCareerRegion();
  you.pair=true;
  return true;
}
/* Пара — по нажатию на игрока в окне гонки (отзыв: «кнопка объединиться при нажатии
   на игрока рядом с ником»): строка раскрывается, под ней — «Объединиться» с подсказкой, что
   это значит. Приглашение К ТЕБЕ показывается сразу, без нажатия (его нельзя не заметить),
   как и «в паре · разойтись». */
let CC_RACE_ROW_OPEN=null;
function ccRaceRowToggle(id){ CC_RACE_ROW_OPEN=(CC_RACE_ROW_OPEN===id) ? null : id; careerRenderHub(CH_TAB); }
function ccRacePairRowHTML(r){
  if(!r || r.you || !r.id) return '';
  const T=L();
  const pid=ccRacePairId();
  if(pid===r.id) return `<button class="ch-sign cc-pair-btn" onclick="event.stopPropagation();careerRaceUnpair()">${esc(T.ccRacePairOff)}</button>`;
  if(pid) return '';
  if(CC_RACE_PAIR_ASK && CC_RACE_PAIR_ASK.from===r.id)
    return `<button class="ch-sign cc-pair-btn" onclick="event.stopPropagation();careerRacePairYes()">${esc(T.ccRacePairYes)}</button><button class="ch-decline cc-pair-btn" onclick="event.stopPropagation();careerRacePairNo()">${esc(T.ccRacePairNo)}</button>`;
  const asked=CAREER.career.race && CAREER.career.race.pairAsked;
  if(asked && asked.id===r.id) return `<span class="cc-pair-wait">${esc(T.ccRacePairSent)}</span>`;
  return '';
}
/* И явно, под строками: «Объединиться с <ник>» на каждого, с кем можно, и подсказка. Слово
   22.09: «всё равно не видно, как объединиться — подсказку или ниже просто кнопочку». */
function ccRacePairBelowHTML(rows){
  const T=L();
  if(ccRacePairId()) return '';
  const others=(rows||[]).filter(r=>r && !r.you && r.id);
  if(!others.length) return '';
  if(CC_RACE_PAIR_ASK) return '';
  const asked=CAREER.career.race && CAREER.career.race.pairAsked;
  const btns=others.map(r=>{
    if(asked && asked.id===r.id) return `<span class="cc-pair-wait">${esc(T.ccRacePairSent)}</span>`;
    const why=ccRacePairWhy(CC_RACE_PEERS[r.id]);
    if(why) return `<span class="cc-pair-wait">${esc(r.nick||'')}: ${esc(T['ccRacePairWhy'+why]||'')}</span>`;
    return `<button class="ch-sign" onclick="careerRacePairAsk('${jsq(r.id)}')">${esc(T.ccRacePairWithBtn(r.nick||''))}</button>`;
  }).join('');
  return `<div class="cc-race-pane cc-race-pane-all"><span>${esc(T.ccRacePairHint)}</span>${btns}</div>`;
}
// Раскрытая строка: подсказка и кнопка «Объединиться» (или причина, почему нельзя).
function ccRacePairPaneHTML(r){
  if(!r || r.you || !r.id || CC_RACE_ROW_OPEN!==r.id) return '';
  const T=L();
  if(ccRacePairId() || (CC_RACE_PAIR_ASK && CC_RACE_PAIR_ASK.from===r.id)) return '';
  const asked=CAREER.career.race && CAREER.career.race.pairAsked;
  if(asked && asked.id===r.id) return '';
  const why=ccRacePairWhy(CC_RACE_PEERS[r.id]);
  return `<div class="cc-race-pane"><span>${esc(T.ccRacePairHint)}</span>${
    why ? `<em>${esc(T['ccRacePairWhy'+why]||'')}</em>`
        : `<button class="ch-sign" onclick="event.stopPropagation();careerRacePairAsk('${jsq(r.id)}')">${esc(T.ccRacePairBtn)}</button>`}</div>`;
}

function careerRaceEnter(race){
  if(!CAREER || !CAREER.career) return Promise.resolve(false);
  const was=CAREER.career.race;
  CAREER.career.race=race;
  careerRaceWire();
  /* Дивизион и сид команды НЕ отправляются: лобби пускает по ним только в
     командную карьеру (см. lobby.join), а в гонке двое обязаны сойтись хоть
     из первого дивизиона, хоть из пятого — в этом её смысл. */
  return MP.connect(race.code, ccMpId()).then(function(){
    careerSave();
    careerRaceSend();
    ccMpHeartbeat(true);
    ccMpRedraw();
    return true;
  }).catch(function(){
    if(was===undefined) delete CAREER.career.race; else CAREER.career.race=was;
    if(was===undefined && typeof MP!=='undefined' && MP.drop) MP.drop();
    careerSave();
    ccMpRedraw();
    return false;
  });
}
function careerRaceCreate(){ return careerRaceEnter({code:ccMpCode(), role:'a', since:careerToday()}); }
function careerRaceJoin(code){
  return careerRaceEnter({code:String(code).toUpperCase(), role:'b', since:careerToday()});
}
/* ВОШЕДШИЙ ПО КОДУ ПОДСТРАИВАЕТСЯ ПОД КОМНАТУ.

   Отчёт: «я запустил race, [напарник] решил зайти по коду — и
   вместо гонки ко мне просто в дуо тимейт зашёл». Дверь «войти по коду» на
   главной одна, и она заводила вход в команду; двери «в гонку по коду» не было
   вовсе, а лобби пускало командного клиента в комнату гонки как есть.

   Отзыв следом: «может отдельный код для каждого режима или по ссылке
   возможность зайти». Сделано второе и ещё проще: код один, а порода комнаты —
   у того, кто её открыл. Лобби говорит её вошедшему (race в state; старый воркер
   — первой строкой гонки от соседа, см. mp.js), и клиент здесь переключает
   свою запись: вошёл как команда в гонку — становится гонщиком; вошёл как
   гонщик в команду — становится напарником. Ссылка для входа — ccMpInviteURL. */
function ccMpKindCheck(race){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  if(race===true && cr.mp && cr.mp.code && !ccRaceOn()){
    const code=cr.mp.code;
    delete cr.mp; CC_MP_FAIL=null;
    cr.race={code:code, role:'b', since:careerToday()};
    careerRaceWire();
    careerSave();
    try{ careerRaceSend(); }catch(e){}
    ccMpRedraw();
    return true;
  }
  if(race===false && ccRaceOn() && cr.race.role==='b' && !(cr.mp && cr.mp.code)){
    const code=cr.race.code;
    delete cr.race; CC_RACE_PEERS={};
    cr.mp={code:code, role:'b'};
    if(typeof ccMpThirdWire==='function') ccMpThirdWire();
    careerSave();
    try{ if(typeof MP!=='undefined' && MP.sendCard) MP.sendCard(); }catch(e){}
    ccMpRedraw();
    return true;
  }
  return false;
}
/* Ссылка для входа: та же страница с ?join=КОД. Открывший её попадает на экран
   создания карьеры с уже подставленным кодом (ccJoinFromUrl), а дуо это или
   гонка — скажет комната. */
function ccMpInviteURL(code){
  const base=(typeof location!=='undefined') ? location.origin+location.pathname : '';
  // Год и регион хозяина — в ссылке: вошедший по ней выбирает игрока уже из этого года и региона.
  let tail='';
  try{ if(CAREER && CAREER.career){ tail='&y='+encodeURIComponent(String(ccNowYear()))+'&r='+encodeURIComponent(String(ccCareerRegion())); } }catch(e){}
  return base+'?join='+encodeURIComponent(String(code||''))+tail;
}
function ccMpInviteHTML(code){
  if(!code) return '';
  const url=ccMpInviteURL(code);
  return `<div class="cc-mp-invite">
    <input class="cc-mp-url" type="text" readonly value="${esc(url)}" onclick="this.select()">
    <button class="ch-sign cc-mp-copy" onclick="ccMpInviteCopy(this,'${esc(code)}')">${esc(L().ccMpInviteCopy)}</button>
  </div>`;
}
function ccMpInviteCopy(btn, code){
  const url=ccMpInviteURL(code);
  const done=()=>{ try{ if(btn) btn.textContent=L().ccMpInviteDone; }catch(e){} };
  const byHand=()=>{ try{ const i=btn && btn.parentNode && btn.parentNode.querySelector('.cc-mp-url'); if(i){ i.focus(); i.select(); } }catch(e){} };
  try{ navigator.clipboard.writeText(url).then(done, byHand); }
  catch(e){ byHand(); }
}
function ccJoinFromUrl(){
  let code=null, y=null, r=null;
  try{ const u=new URLSearchParams(location.search); code=u.get('join'); y=u.get('y'); r=u.get('r'); }catch(e){ return false; }
  if(!code) return false;
  code=String(code).replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,6);
  // Любой год карьеры (2019–2026): было только 2024–2026, и хозяин 2019–2023 отдавал ссылку,
  // по которой друг создавал карьеру в другом году.
  y=/^20(19|2[0-6])$/.test(String(y||'')) ? +y : null;
  r=(r && typeof CC_REGIONS!=='undefined' && CC_REGIONS.indexOf(String(r))>=0) ? String(r) : null;
  // Адрес чистится сразу: перезагрузка страницы не должна снова тащить в лобби.
  try{ history.replaceState(null, '', location.pathname); }catch(e){}
  if(code.length!==6 || !CC_MP_OPEN) return false;
  CC_MP_NEW={role:'b', code:code, year:y, region:r};
  ccMpStartNew();
  return true;
}
// Год и регион, запертые хозяином комнаты (по ссылке). null — свободный выбор.
function ccMpLockedYear(){ return (CC_MP_NEW && CC_MP_NEW.role==='b' && CC_MP_NEW.year) || null; }
function ccMpLockedRegion(){ return (CC_MP_NEW && CC_MP_NEW.role==='b' && CC_MP_NEW.region) || null; }
function careerRaceNew(){
  if(!CC_MP_OPEN) return;
  CC_MP_NEW={role:'a', race:true};
  ccMpStartNew();
}
function careerRaceLeave(){
  if(!CAREER || !CAREER.career) return;
  if(CAREER.career.race && CAREER.career.race.pair) try{ MP.act('unpair', {by:ccMpId(), to:CAREER.career.race.pair.id}); }catch(e){}
  delete CAREER.career.race;
  CC_RACE_PEERS={};
  if(typeof MP!=='undefined' && MP.drop) MP.drop();
  careerSave();
  ccMpRedraw();
}
/* ---- ОБЩАЯ КОМНАТА ГОНКИ (см. CC_RACE_LOCK у ccMpOn) ------------------------
   По проводу едет ОДНА строка на человека — сводка гонки (act 'race', ccRaceMyLine):
   своя карточка, карточки напарников и сила команды на вечер, всё сжатое до того, что
   читает движок (ccRacePackCard: ник, страна, рейтинг, потолок, атрибуты, роль, края
   пинга и возраста). Комната ботов не пересылается вовсе: её строит каждый сам из
   общего сида вечера, вычитая всех людей (см. ccRaceFieldSync и careerSeed). */
function ccRacePackCard(c){
  if(!c) return null;
  try{ if(typeof attrsFor==='function') attrsFor(c); }catch(e){}
  const a=c._attrs ? Object.assign({}, c._attrs) : null;
  const out={handle:c.handle, nat:c.nat, region:c.region, country:c.country, org:c.org||null, role:c.role,
             _roleKey:c._roleKey, rating:c.rating, _targetOvr:c._targetOvr, liquiName:c.liquiName, age:c.age,
             _pingEdge:c._pingEdge, _ageEdge:c._ageEdge, photo:c.photo||null, event:c.event, _attrs:a,
             formPow:c.formPow, sim:c.sim};
  Object.keys(out).forEach(k=>{ if(out[k]===undefined) delete out[k]; });
  return out;
}
// Своя строка для соперника: карточка, напарники, сила команды на вечер.
function ccRaceMyLine(){
  const me=careerCard(); if(!me) return {};
  // В паре напарник — человек: его карточка едет в строке вместо бота, и соперники сажают пару по ней.
  const pairPeer=(typeof ccRacePairOn==='function' && ccRacePairOn()) ? ccRacePairPeer() : null;
  const mates=pairPeer ? [pairPeer.card] : (typeof careerMates==='function' ? careerMates() : []).filter(Boolean);
  let pow=null, ev=null;
  /* СИЛА — ТА ЖЕ, ЧТО В ВЕЧЕРЕ. Скриншот (страница «socials»): «Вечера
     разошлись на игре 1 … #1 focus+th0mashd:107 vs focus+th0mashd:103» — у себя
     команда 107, у соперника та же команда 103, и у соперника наоборот. Строка
     считала силу ОТДЕЛЬНЫМ вызовом careerYouTeam до гейта, а вечер — своим, уже
     внутри раннера (форма, лагерь, эфир, всё, что раннер успевает тронуть).
     В общей комнате сила берётся из команды вечера (CC_TV_YOU, её ставит тот же
     careerYouTeam раннера) и подписывается сидом вечера: соперник ждёт именно
     такую строку, а не любую (ccRaceFieldSync). */
  if(typeof ccRaceLock==='function' && ccRaceLock() && CC_RACE_POW_NOW!=null &&
     typeof CC_MP_SEED!=='undefined' && CC_MP_SEED){
    pow=CC_RACE_POW_NOW; ev=CC_MP_SEED;
  } else {
    try{ if(pairPeer) pow=careerTeam(ccRacePairCards(), true).pow; else if(mates.length>=careerMateSeats()) pow=careerYouTeam([me].concat(mates)).pow; }catch(e){}
  }
  const card=(typeof MP!=='undefined' && MP.card) ? MP.card() : ccRacePackCard(me);
  let canToday=null;
  try{ const nx=(typeof careerNext==='function') ? careerNext() : null; CC_RACE_MY_KR=ccKindRank(nx && nx.type);
       // Только допуск по турниру (квал, билет): без проверки состава — в паре бот-напарник отставлен, и «нет напарника» не значит «не играю».
       if(nx && nx.type && nx.type!=='free' && typeof careerCanPlayKindOn==='function') canToday=!!careerCanPlayKindOn(careerToday(), nx.type, true); }catch(e){}
  return {id:ccMpId(), cp:canToday, card:ccRacePackCard(card||me), mates:mates.map(ccRacePackCard), pow:pow, ev:ev, squad:careerSquadSize(), pair:(typeof ccRacePairId==='function' ? ccRacePairId() : null),
          y:ccNowYear(), rg:ccCareerRegion(),   // год и регион мира — вошедший без ссылки сверяется (ccRaceModeWhy),
          // Свой бот-напарник, отставленный на время пары: соперники вычитают его из пула, как напарников (иначе поле разойдётся).
          bench:undefined,   // бот пары не на скамейке, а свободен (careerRacePairFree) — вычитать нечего
          edge:(ev && CC_RACE_EDGE_NOW!=null) ? CC_RACE_EDGE_NOW : null, kr:CC_RACE_MY_KR,
          lk:CC_RACE_LOCK ? CC_RACE_LOCK_KEY : null,   // состав на вечер сел (ccRaceWaitLock)
          posts:(typeof ccMatePostsWire==='function') ? ccMatePostsWire() : null,   // свои посты: соперники видят их в ленте (ccMatePosts)
          ps:(typeof ccStyleWire==='function') ? ccStyleWire() : null,   // стиль игры — соперники ставят его нашей команде (ccTeamStyles)
          // Понедельник Дивизиона 1 (cr.d1) — отпечатком: вторник от разных понедельников врозь (ccRaceApartWhy 'table').
          d1h:(CAREER.career.d1 && CAREER.career.d1.monday===careerMonday(careerToday())) ? String(ccHashStr(JSON.stringify(CAREER.career.d1))) : null,
          // И список вторника (cr.wf.cut) — финал недели от разных вторников врозь (та же причина 'table').
          wfh:(CAREER.career.wf && CAREER.career.wf.monday===careerMonday(careerToday())) ? String(ccHashStr(String(CAREER.career.wf.cut||''))) : null,
          /* И таблица Плей-Ина (cr.majorSeed) — по ней сеются Хиты Мейджора. См. ветку 'table'
             у ccRaceApartWhy: от разных таблиц выходят разные хиты, а это разные турниры. */
          msh:CAREER.career.majorSeed ? String(ccHashStr(JSON.stringify(CAREER.career.majorSeed))) : ''};
}
// Соперники с карточкой — все, кто прислал строку (комната на N человек); порядок по адресу.
function ccRaceRivals(){
  return ccRacePeers().filter(p=>p && p.card && ccRacePeerAlive(p)).sort((a,b)=>hKey(a.card)<hKey(b.card) ? -1 : 1);
}
function ccRaceRival(){ const ps=ccRaceRivals(); return ps.length ? ps[0] : null; }
/* КОМНАТА ВЕЧЕРА — соперники, которые сегодня в ней: не ушедшие дальше по календарю
   (их день больше нашего) и не закрывшие день голосом «следующий день». Годовая
   проба на шестерых 8.09: без напарника (перехват после топ-3) или без квалификации
   человек шагает через турнирный день, и его строка «на завтра» держала остальным
   'day' минуту, а потом вечер шёл врозь; сервер (lobby.room) считает так же, и
   старт ждёт готовности только этой комнаты. Плитка, голоса перемотки и запрет
   на одинаковых ботов смотрят на всех (ccRaceRivals). */
function ccRaceRoom(){
  const today=careerToday(), major=ccRaceKrMajor();
  const season=(CAREER && CAREER.career && CAREER.career.season)||1;
  // И не из другого сезона: на стыке года даты повторяются (новый сезон — тот же календарь), а
  // сосед, ещё не закрывший прошлый год, стоит на «том же» дне другого года.
  return ccRaceRivals().filter(p=>!(p.day && p.day>today) && !(CC_RACE_NEXT.day===today && CC_RACE_NEXT.who[p.id])
    && !(p.season && p.season!==season)
    /* Сегодня ему играть нечего (cp:false — турнир дня есть, но его не пускают: не прошёл раунд недели, нет билета) —
       в комнату не садится и ответов не ждём. Онлайн-прогон 2019 года, 21.10: Season X 3.11, раунды 2–3; не прошедший
       первый раунд сидел у соседа в открытом втором (красная строка «Your partner never reached the question», чужие
       призовые на доске). */
    && !(p.day===today && p.cp===false && !p.pair)
    && !(major!=null && p.day===today && p.kr!=null && p.kr<99 && p.kr!==major));
}
// Людей в комнате вечера: я и соперники сегодня (для голосов за пропуск и подписей «n/N»).
function ccRaceHumansN(){ return 1+ccRaceRoom().length; }
/* ОДНА КНИГА МИРА НА КОМНАТУ. Книга развития сцены (CAREER.dev) у каждой карьеры своя, а поле
   общего вечера собирается из неё: разошлась книга — разошлись силы ботов, и вечер расходится на
   первой игре (скриншоты: «batman ken 21+kryf:78 vs 79 · state dev»). Расти книга теперь
   умеет только одинаково у всех (careerGrowEvent), но историю до этого никто не выравнивал.
   Поэтому на старте каждого общего вечера, сразу за 'start' и до сборки поля, старший по адресу
   (наименьший hKey среди людей комнаты) рассылает свою книгу, остальные берут её как есть.
   Книга — только dev: остальное в состоянии карьеры личное (квалификации, журнал). Ждём не
   дольше CC_RACE_WORLD_MS; не дождались — идём со своей, сверка вечера скажет, где разошлось.
   Сервер в ленту книгу не кладёт (lobby.act): она бывает большой, а догоняющему после обрыва
   вечер пересобирать всё равно поздно. */
/* 60 с, а не 20: книга везёт рост всей сцены и выдуманных, и на загруженной машине (прогон 2026 20.10, рядом ещё
   два командных года) она приходила позже — ведомый шёл со своим миром, и Duos Victory Cup 5.01 расходился во втором лобби. */
const CC_RACE_WORLD_MS=60000;
/* КНИГА МИРА — это не только рост (dev). Пул пар (careerPools) читает ещё разводы (CAREER.splits,
   cr.duoSplits), тройки (cr.trios) и, с второго сезона, «жизнь пары» по сиду КАРЬЕРЫ
   (ccDuoBroken). Всё это у каждого гонщика своё — и скриншот (Victory Cup, отпечаток
   сборки): сид, занятые и регион равны, а пул 160 против 161 дуо; на открытых полях это
   «diff 31 of 150», «diff 76 of 2100». Старший шлёт всё четыре и свой сид карьеры; ведомые
   берут как есть, сид на время замка подменяет свой в ccDuoBroken (CC_RACE_WORLD_SEED). */
// Записи посева, которые в гонке общие (см. ccSeedRow): поля хитов и финалов строятся из них.
const CC_RACE_SEED_KEYS=['majorSeed','summitSeed','gcSeed','relSeed','d1','wf'];
// cr.evSeen (какие вечера уже в досках) — личный ключ: он про мои доски, не про мир.
let CC_RACE_WORLD_SEED=null;
/* СИД МИРА. Всё, что сеет сцену от сида карьеры — лестничные имена сезона (ladderSeason), пересборка
   пар (transfer), жизнь пары (duoLife), орги по годам (orgYear), места на ЛАН (seat), перенос троек
   (carry), — в гонке считается от сида старшего (cr.race.wseed приходит с книгой мира и живёт с
   гонкой), иначе у каждого гонщика свой мир: скриншот, DreamCup — пул 172 против 169 пар при
   равных сиде, занятых и регионе. Без гонки — свой сид, как было. */
function ccWorldSeed(){
  const cr=CAREER && CAREER.career;
  if(cr && cr.race && cr.race.code && cr.race.wseed) return String(cr.race.wseed);
  return ccCareerSeed();
}
/* Посев троек до книги мира — по формату СЕГОДНЯШНЕГО вечера, а не года (онлайн-прогон 2019 года, 21.10: трио-кап
   14.07 в дуо-год, ccMpFmtBegin. Книга сеяла пул только в трио-год, хозяин слал пустые тройки, и каждый сеял свои:
   «blax+mitr0+oslo vs kinstaar+mitr0+oslo», поле разошлось с первой игры). */
function ccWorldPoolsSeed(){
  try{
    const base=careerSquadSize(); let f=base;
    try{ const v=ccVictoryFormat(careerVictoryOn(careerToday())); if(v>f) f=v; }catch(e){}
    if(!(f>=3) || typeof careerPools!=='function') return;
    if(f===base){ careerPools(); return; }
    /* Кап другого формата: пул кэшируется без размера (CC_POOLS по снимку), и собранный дуо-днём он вернулся бы
       из кэша, не посеяв третьих. Собирается заново под размер вечера и сбрасывается — дальше дуо-дни соберут свой. */
    CC_POOLS=null;
    try{ ccWithEventSize(f, ()=>careerPools()); } finally { CC_POOLS=null; }
  }catch(e){}
}
function ccRaceWorldPack(){
  /* ТРОЙКИ ГОДА — ДО КНИГИ. Посев третьих (careerPools, cr.triosSeeded) идёт при первой сборке пула,
     и у старшего она могла случиться ПОСЛЕ отправки: прогон годов 20.10, 2025 — старший слал trios {},
     соседи затирали им свой посев, а сам он сеял следом. Поле FNCS Trial разошлось с первой игры
     (пул 279 против 282). Пул собирается здесь, и книга везёт посев целиком. */
  /* Только в трио-год, как и было: посев по формату вечера (ccWorldPoolsSeed) нужен команде с добором третьего, а гонке
     ломал поле трио-капа в дуо-год — онлайн-прогон гонки 2025 (22.10): FNCS Trial 7.12, поле 1707 у одного и 1700 у другого
     (на сборке до этой правки 3 из 3 чисто). */
  try{ if(careerSquadSize()>=3 && typeof careerPools==='function') careerPools(); }catch(e){}
  const cr=(CAREER && CAREER.career)||{};
  const seeds={};
  /* И ПУСТО — ТОЖЕ ОТВЕТ. Записи посева ехали только когда они есть: у старшего Мейджора 2
     нет, у соседа есть — и сосед сажал СВОЙ регион из своей записи, а старший из общего
     списка. Годовая проба на шестерых 11.09, Глобалы 26.09: зал разошёлся на три строки из
     пятидесяти, у пары cringe+volko сила 102 против 99 при одинаковых шести числах — один
     клиент собрал её одним путём, другой другим. Мир общий целиком, включая то, чего в нём
     нет: пустая запись едет как null и стирает чужую. */
  CC_RACE_SEED_KEYS.forEach(k=>{ seeds[k]=(cr[k]===undefined ? null : cr[k]); });
  // devL — книга выдуманных; она двигает их рейтинг, значит и поле. Общая, как и dev.
  /* И серии провалов пар (duoStreak) с объявлениями «ищем третьего» (lft): мир, который досчитал вечер
     без людей у одного (LAN 18.12 у того, кто играл Evaluation), двигал их только у него, и Duos Victory
     Cup 5.01 расходился на чужом лобби (прогон 2026, 20.10: «state duoSplits/duoStreak»). */
  // И напарники сирот (cr.orphanMate) — память личная, как в команде (см. ccTeamWorldPack).
  return {orphanMate:cr.orphanMate||{},
          dev:(CAREER && CAREER.dev)||{}, devL:(CAREER && CAREER.devL)||{}, splits:(CAREER && CAREER.splits)||{}, duoSplits:cr.duoSplits||{}, trios:cr.trios||{},
          duoStreak:(CAREER && CAREER.duoStreak)||{}, lft:(CAREER && CAREER.lft)||{}, tseed:{seeded:cr.triosSeeded===undefined ? null : cr.triosSeeded, cores:cr.trioCores||null, filled:cr.trioFilled||null}, cseed:ccCareerSeed(), seeds:seeds};
}
function ccRaceWorldApply(w){
  if(!w || !CAREER) return false;
  CAREER.dev=(w.dev && typeof w.dev==='object') ? w.dev : {};
  CAREER.devL=(w.devL && typeof w.devL==='object') ? w.devL : {};
  if(w.splits && typeof w.splits==='object') CAREER.splits=w.splits;
  if(w.duoStreak && typeof w.duoStreak==='object') CAREER.duoStreak=w.duoStreak;
  if(w.lft && typeof w.lft==='object') CAREER.lft=w.lft;
  if(CAREER.career){
    if(w.orphanMate && typeof w.orphanMate==='object') CAREER.career.orphanMate=JSON.parse(JSON.stringify(w.orphanMate));
    if(w.duoSplits && typeof w.duoSplits==='object') CAREER.career.duoSplits=w.duoSplits;
    if(w.trios && typeof w.trios==='object') CAREER.career.trios=w.trios;
    // Метка посева едет с тройками: без неё свой careerPools посеял бы поверх присланного.
    if(w.tseed && typeof w.tseed==='object'){
      const c=CAREER.career;
      if(w.tseed.seeded==null) delete c.triosSeeded; else c.triosSeeded=w.tseed.seeded;
      if(w.tseed.cores) c.trioCores=w.tseed.cores; else delete c.trioCores;
      if(w.tseed.filled) c.trioFilled=w.tseed.filled; else delete c.trioFilled;
    }
  }
  /* Записи посева — от старшего: из них собираются поля хитов, финалов, сеток Саммита, Глобалов и
     воскресенья Дивизиона 1. Своё участие они не решают (оно в cr.major/cr.summit/cr.reload и
     остаётся личным) — только КОГО ещё сажать. */
  if(w.seeds && typeof w.seeds==='object' && CAREER.career)
    CC_RACE_SEED_KEYS.forEach(k=>{
      const v=w.seeds[k];
      if(v===undefined) return;                       // старая сборка: про этот ключ молчит
      if(v===null) delete CAREER.career[k];           // у старшего записи нет — нет её и у меня
      else CAREER.career[k]=v;
    });
  CC_RACE_WORLD_SEED=w.cseed ? String(w.cseed) : null;
  if(CAREER.career && CAREER.career.race && w.cseed) CAREER.career.race.wseed=String(w.cseed);
  try{ ccWorldReset(); }catch(e){}
  return true;
}
/* КНИГА МИРА КОМАНДЫ — ОТ ХОЗЯИНА ЛОББИ, НА СТАРТЕ КАЖДОГО ОБЩЕГО ВЕЧЕРА.
   Командный год вдвоём 20.10 (за Pixie и SwizzY, и двое созданных с 5-го дивизиона): книга развития
   и пары сцены расходились у двоих после личных вечеров (соло-серия, вечер, который играл один), и
   следующий общий кубок разъезжался с первой игры на силе одного бота («f1n4ik+zarbeh 88 vs 89 · state
   dev»), а дальше расходился весь год. Командное состояние уезжает после вечера от обоих, и кто
   прислал позже, тот и прав, — двое с разными книгами просто менялись ими. Теперь мир одного:
   хозяин (роль a) шлёт его на старте, второй ставит до сборки поля — как книга мира в гонке
   (ccRaceWorldSync). Личное (журнал, рейтинг игрока, деньги) не трогается. */
function ccTeamWorldPack(){
  ccWorldPoolsSeed();
  const cr=(CAREER && CAREER.career)||{};
  // Сид мира команды — хозяина; ставит его себе и везёт второму (см. freeRnd в careerCupField).
  if(CAREER && CAREER.career) cr.teamWseed=String(ccCareerSeed());
  // У себя — то же, что получит второй: пустая книга объектом, а не undefined (второй ставит {} в ccTeamWorldApply).
  if(CAREER){ ['dev','devL','splits','duoStreak','lft'].forEach(k=>{ if(!CAREER[k] || typeof CAREER[k]!=='object') CAREER[k]={}; });
    if(CAREER.career && (!cr.duoSplits || typeof cr.duoSplits!=='object')) cr.duoSplits={};
    if(CAREER.career && (!cr.trios || typeof cr.trios!=='object')) cr.trios={}; }
  return {dev:CAREER.dev||{}, devL:CAREER.devL||{}, splits:CAREER.splits||{}, duoStreak:CAREER.duoStreak||{}, lft:CAREER.lft||{},
          duoSplits:cr.duoSplits||{}, trios:cr.trios||{},
          /* И напарники сирот (ccOrphanPairs: игрок забрал карточку — его бывший напарник садится к свободному, и выбор
             помнится весь сезон). Память была личной: второй выбирал и запоминал своего — онлайн-прогон 2022 (22.10),
             Duos Cash Cup 10.01: «demon diocese» (в записи пара Pixie) у одного с thomasww9, у другого с amg reyed. */
          orphanMate:cr.orphanMate||{},
          /* И посевы стадий (онлайн-прогон 2025 года, 21.10: финал Мейджора 1 15.02 разошёлся на первой игре, «state majorSeed» —
             прошедших через Last Chance мир досчитывал у каждого сам). Хозяин везёт свои, второй ставит до сборки поля. */
          seeds:{majorSeed:cr.majorSeed||null, summitSeed:cr.summitSeed||null, relSeed:cr.relSeed||null, gcSeed:cr.gcSeed||null},
          tseed:{seeded:cr.triosSeeded===undefined ? null : cr.triosSeeded, cores:cr.trioCores||null, filled:cr.trioFilled||null},
          wseed:cr.teamWseed||null,
          /* И квал-симуляция ЛАНа сезона (cr.lanSim, ccLanSimRanked): считается лениво, у двоих в разные дни — зал ЛАНа
             расходился (онлайн-прогон 2022, DreamHack Winter 27.11). Нет у хозяина — нет и у второго: посчитают в вечере. */
          lanSim:cr.lanSim||null,
          /* И состояние командных Мейджоров 2019–2020 (cr.majorxs, трио и сквады): поле хитов и его добор из мира
             (ccMXHeats) считаются лениво и кэшируются — у двоих в разные моменты. Онлайн-прогон 2019 (22.10): финал
             FNCS Season X 22.09 — 15 строк поля из 33 разные. Соло-недели личные (свой «ты» у каждого) и не едут. */
          mx:ccTeamMXPack(cr)};
}
let CC_TW_APPLIED=0;   // сколько раз второй принял книгу мира (видно в отпечатке поля финала Мейджора 2019–2020)
function ccTeamMXPack(cr){
  const out={}, all=(cr && cr.majorxs)||{};
  Object.keys(all).forEach(k=>{ const m=all[k]; if(!m) return;
    const sp=(typeof ccMXSpec==='function') ? ccMXSpec(m.y, m.n) : null;
    if(!(sp && sp.size>1)) return;
    /* Досчитанное — до отправки. Итоги чужих хитов (heatRes) второй досчитывал сам после книги, на своих лениво
       закэшированных рейтингах: онлайн-прогон 2019 (22.10) — хиты и серия одни, итоги хитов разные (r386858 / r176420),
       поле финала Season X 22.09 — 6 строк из 33. Сравнение — по отпечатку «mx …» в красной строке. */
    if(m.season===cr.season){ try{ ccMXSettleWeeks(m); ccMXSettleHeats(m); }catch(e){} }
    out[k]=m; });
  return out;
}
function ccTeamWorldApply(w){
  if(!w || !CAREER || !CAREER.career) return false;
  const obj=v=>(v && typeof v==='object') ? v : {};
  CAREER.dev=obj(w.dev); CAREER.devL=obj(w.devL); CAREER.splits=obj(w.splits); CAREER.duoStreak=obj(w.duoStreak); CAREER.lft=obj(w.lft);
  const c=CAREER.career;
  c.duoSplits=obj(w.duoSplits); c.trios=obj(w.trios);
  if('orphanMate' in w) c.orphanMate=JSON.parse(JSON.stringify(obj(w.orphanMate)));
  if(w.wseed) c.teamWseed=String(w.wseed);
  if('lanSim' in w){ if(w.lanSim) c.lanSim=JSON.parse(JSON.stringify(w.lanSim)); else delete c.lanSim; }
  CC_TW_APPLIED++;
  // Командные Мейджоры 2019–2020 — как у хозяина (см. ccTeamMXPack); своих соло-недель это не касается.
  if(w.mx && typeof w.mx==='object'){
    c.majorxs=c.majorxs||{};
    const mine=ccTeamMXPack(c);
    Object.keys(mine).forEach(k=>{ if(!(k in w.mx)) delete c.majorxs[k]; });
    Object.keys(w.mx).forEach(k=>{ c.majorxs[k]=JSON.parse(JSON.stringify(w.mx[k])); });
    // Указатель на текущий Мейджор — на новую запись; на снятую — убрать (ccMXOf вернул бы её обратно в книгу).
    if(c.majorx && c.majorx.y!=null){ const mk=c.majorx.y+'|'+c.majorx.n;
      if(mk in w.mx) c.majorx=c.majorxs[mk]; else if(mk in mine) c.majorx=null; }
  }
  if(w.seeds && typeof w.seeds==='object') ['majorSeed','summitSeed','relSeed','gcSeed'].forEach(k=>{ if(w.seeds[k]) c[k]=JSON.parse(JSON.stringify(w.seeds[k])); else delete c[k]; });
  if(w.tseed && typeof w.tseed==='object'){
    if(w.tseed.seeded==null) delete c.triosSeeded; else c.triosSeeded=w.tseed.seeded;
    if(w.tseed.cores) c.trioCores=w.tseed.cores; else delete c.trioCores;
    if(w.tseed.filled) c.trioFilled=w.tseed.filled; else delete c.trioFilled;
  }
  try{ ccWorldReset(); }catch(e){}
  return true;
}
function ccTeamWorldSync(n, who){
  if(typeof ccMpOn!=='function' || !ccMpOn() || (typeof ccRaceOn==='function' && ccRaceOn()) || typeof MP==='undefined' || !MP.act) return Promise.resolve(false);
  /* Роли ещё нет (первый вечер в день старта карьеры — 2022 начинается 10.01 кап-вечером): оба ждали книгу и
     играли каждый со своей (онлайн-прогон 2022 года, 21.10: «state duoSplits/dev», поле разошлось с первой игры).
     Тогда ведущий — наименьший адрес в списке вечера от сервера. */
  const role=(CAREER.career.mp||{}).role;
  const lead=role ? role==='a' : (Array.isArray(who) && who.length ? who.slice().filter(Boolean).sort()[0]===ccMpId() : false);
  if(lead){
    let w=null;
    try{ w=ccTeamWorldPack(); }catch(e){ w=null; }
    if(w){
      try{ CC_TW_LAST={n:n, s:JSON.stringify(w)}; }catch(e){ CC_TW_LAST=null; }   // снимок старта: дальше вечер меняет эти объекты
      ccTeamWorldAskOn();
      try{ MP.act('tworld', {by:ccMpId(), n:n, w:w}); }catch(e){}
    }
    try{ ccWorldReset(); }catch(e){}   // и у хозяина мир собирается заново — одинаково со вторым
    ccMpMark('tw');
    return Promise.resolve(true);
  }
  return ccMpIdle(new Promise(function(res){
    let done=false, off=null, t=null, ask=null;
    const finish=function(w){ if(done) return; done=true; if(off) off(); if(t) clearTimeout(t); if(ask) clearInterval(ask); if(w) ccTeamWorldApply(w); ccMpMark(w ? 'tw' : 'tw:none'); res(!!w); };
    const fit=function(a){ return a && a.payload && a.payload.n===n && a.payload.w && a.payload.by!==ccMpId(); };
    let x; while((x=MP.take('tworld'))){ if(fit(x)){ finish(x.payload.w); return; } }
    off=MP.on('act', function(m){ if(m && m.kind==='tworld' && fit(m)){ if(MP.take) MP.take('tworld'); finish(m.payload.w); } });
    // Книга не пришла (обрыв, медленный телефон): просим ведущего прислать её ещё раз, а не играем со своей.
    ask=setInterval(function(){ try{ MP.act('tworld?', {by:ccMpId(), n:n}); }catch(e){} }, CC_TW_ASK_MS);
    t=setTimeout(function(){ finish(null); }, CC_RACE_WORLD_MS);
  }));
}
const CC_TW_ASK_MS=4000;
let CC_TW_LAST=null, CC_TW_ASK_OFF=null;
// Ведущий отвечает на повторный запрос книги тем же снимком, что ушёл на старте вечера.
function ccTeamWorldAskOn(){
  if(CC_TW_ASK_OFF || typeof MP==='undefined' || !MP.on) return;
  CC_TW_ASK_OFF=MP.on('act', function(m){
    if(!m || m.kind!=='tworld?' || !m.payload || m.payload.by===ccMpId()) return;
    if(MP.take) MP.take('tworld?');
    const last=CC_TW_LAST;
    if(last && last.n===m.payload.n) try{ MP.act('tworld', {by:ccMpId(), n:last.n, w:JSON.parse(last.s)}); }catch(e){}
  });
}
/* СТАРШЕГО НАЗЫВАЕТ СЕРВЕР. Он выбирался по СВОЕЙ таблице соседей (ccRaceNightRoom), а она у
   каждого своя и наполняется не одновременно: строка соседа могла ещё не доехать. Тогда один
   считал старшим себя, второй ждал книгу от третьего, а кто-то с пустой комнатой уходил вовсе
   без книги и БЕЗ ОТМЕТКИ — книга бросков сдвигалась на строку, и поле собиралось из своих
   записей посева. Годовая проба на шестерых, Глобалы 01.10: поля разошлись на 25 строк из 50
   при одинаковом пуле, а в книге на этом месте стояло 'world' против 'lob~'.
   Список вечера знает сервер (st.evening.room) и присылает его со стартом (who). Старший —
   наименьший адрес в нём, одинаково у всех. Старого воркера (who нет) держим прежним путём. */
function ccRaceWorldSync(n, who){
  if(typeof ccRaceLock!=='function' || !ccRaceLock() || typeof MP==='undefined' || !MP.act) return Promise.resolve(false);
  const me=careerCard(); if(!me) return Promise.resolve(false);
  let lead, leadId=null;
  if(Array.isArray(who) && who.length){
    const ids=who.slice().filter(Boolean).sort();
    if(ids.indexOf(ccMpId())<0) return Promise.resolve(false);   // меня в этом вечере нет
    lead=(ids[0]===ccMpId()); leadId=ids[0];
  } else {
    const room=(typeof ccRaceNightRoom==='function') ? ccRaceNightRoom() : ccRaceRoom();
    if(!room.length) return Promise.resolve(false);
    const keys=[hKey(me)].concat(room.map(p=>hKey(p.card))).sort();
    lead=(keys[0]===hKey(me));
  }
  if(lead){
    let w=null;
    try{ w=ccRaceWorldPack(); }catch(e){ w=null; }
    if(w){
      try{ CC_RW_LAST={n:n, s:JSON.stringify(w)}; }catch(e){ CC_RW_LAST=null; }
      ccRaceWorldAskOn();
      try{ MP.act('world', {by:ccMpId(), n:n, w:w}); }catch(e){}
    }
    CC_RACE_WORLD_SEED=ccCareerSeed(); if(CAREER.career.race) CAREER.career.race.wseed=ccCareerSeed(); try{ ccWorldReset(); }catch(e){}   // и у старшего пул собирается заново — одинаково с ведомыми
    ccMpMark('world');   // метка одна у ведущего и ведомых: разная надпись читалась как место расхождения
    return Promise.resolve(true);
  }
  return ccMpIdle(new Promise(function(res){
    let done=false, off=null, t=null, ask=null;
    const finish=function(w){ if(done) return; done=true; if(off) off(); if(t) clearTimeout(t); if(ask) clearInterval(ask); if(w) ccRaceWorldApply(w); ccMpMark(w ? 'world' : 'world:none'); res(!!w); };
    // Книгу принимаем только от старшего, если сервер его назвал (m.by ставит сервер, не клиент).
    const fit=function(a){ return a && a.payload && a.payload.n===n && a.payload.w && !(leadId && a.by && a.by!==leadId); };
    // Уже в очереди: старший мог разослать раньше, чем мы дошли.
    let x; while((x=MP.take('world'))){ if(fit(x)){ finish(x.payload.w); return; } }
    off=MP.on('act', function(m){ if(m && m.kind==='world' && fit(m)){ if(MP.take) MP.take('world'); finish(m.payload.w); } });
    // Не дошла: просим старшего повторить, а не собираем поле из своей книги.
    ask=setInterval(function(){ try{ MP.act('world?', {by:ccMpId(), n:n}); }catch(e){} }, CC_TW_ASK_MS);
    t=setTimeout(function(){ finish(null); }, CC_RACE_WORLD_MS);
  }));
}
let CC_RW_LAST=null, CC_RW_ASK_OFF=null;
function ccRaceWorldAskOn(){
  if(CC_RW_ASK_OFF || typeof MP==='undefined' || !MP.on) return;
  CC_RW_ASK_OFF=MP.on('act', function(m){
    if(!m || m.kind!=='world?' || !m.payload || m.payload.by===ccMpId()) return;
    if(MP.take) MP.take('world?');
    const last=CC_RW_LAST;
    if(last && last.n===m.payload.n) try{ MP.act('world', {by:ccMpId(), n:last.n, w:JSON.parse(last.s)}); }catch(e){}
  });
}
/* ЛЮДЕЙ В ОТКРЫТЫХ ЭТАПАХ РАЗВОДИТ ЖРЕБИЙ. Вопрос: «почему они всегда в одной
   игре, в фортнайте же разные лобби играются». С 7.09 гонщики принудительно сажались в одно
   лобби (opts.together в simulateGamesLive) — так проще было держать локстеп. Теперь общий
   жребий (сид вечера один) раскладывает всех по лобби как ботов, и каждый клиент считает
   КАЖДОЕ лобби с человеком тем же движком с остановками (playGameWithChoices): своё — с
   картой, чужие — без, ответы соперников приезжают проводом. Порядок лобби у всех один
   (жребий сеяный), значит и порядок вопросов, и порядок бросков. Комнаты на одно лобби
   (поле не больше лобби) как были. Выключатель — на случай отката. */
const CC_RACE_SPLIT=true;
function ccRaceSplitLobbies(){ return CC_RACE_SPLIT && typeof ccRaceLock==='function' && ccRaceLock(); }
/* КОМНАТА ЭТОГО ВЕЧЕРА — снимок на старте (id соперников, взятых в комнату). Граница раундов
   (Victory Cup R1→R2, квал R2, лобби LCQ) решает «все ли люди прошли» — и смотрела на живую
   комнату: вылетевший в первом раунде закрывал вечер и шагал на завтра быстрее, чем прошедший
   доходил до этой проверки, живая комната его уже не содержала, и прошедший считал, что
   «все прошли» — играл второй раунд в локстепе с теми, кто играл его врозь. Проба 9.09
   (дуо→трио, 22.02): Live1 ждал ответов четырёх соперников до потолка каждую игру и
   откололся на весь год. Снимок берётся в careerPlay вместе с CC_RACE_LOCK. */
let CC_RACE_ROOM0=null;
/* Вечер разошёлся по дороге: граница раундов (Victory Cup / Evaluation R2, LCQ) отпустила
   локстеп — кто-то из комнаты дальше не прошёл. Мир (CAREER.dev) тогда не растёт НИ У КОГО:
   прошедшие росли бы от второго раунда, вылетевшие нет, и следующее общее поле расходилось
   бы на силе бота (двухсезонная проба 9.09: соло Victory Cup 22.03, «t3eny:95 vs t3eny:96,
   state dev»). Ставится в трёх границах раундов, читается в careerGrowEvent. */
let CC_RACE_NIGHT_APART=false;
function ccRaceNightRoom(){
  if(!CC_RACE_ROOM0) return ccRaceRoom();
  return ccRaceRivals().filter(p=>CC_RACE_ROOM0[p.id]);
}
/* Все карточки соперников (сами и их напарники) — их нельзя выдавать ботами: в общей
   комнате гонки человек уже стоит своей командой, и второй такой же ник в лобби был бы
   двойником. Список одинаков у всех клиентов, поэтому и комната у всех одна. */
function ccRaceAllCards(){
  const out=[];
  ccRaceRivals().forEach(p=>{ out.push(p.card); (p.mates||[]).forEach(m=>{ if(m) out.push(m); }); (p.bench||[]).forEach(m=>{ if(m) out.push(m); }); });   // bench — отставленный бот пары
  return out;
}
/* Ключи ЛЮДЕЙ комнаты — их самих и их напарников; этих ботов брать нельзя (отзыв).
   Своя карточка соперника сюда не входила, и человек комнаты мог выйти ботом в чужом поиске
   напарника и в чужом поле. */
function ccRaceTakenKeys(){
  const s=new Set();
  ccRacePeers().forEach(p=>{
    if(p && p.card && p.card.handle) s.add(hKey(p.card));
    (p && p.mates||[]).forEach(m=>{ if(m && m.handle) s.add(hKey(m)); });
    (p && p.bench||[]).forEach(m=>{ if(m && m.handle) s.add(hKey(m)); });
  });
  return s;
}
/* Почему сегодня врозь (null — вместе): соперник не на связи, в комнате не двое,
   другой дивизион, другой день, личная серия соло. */
function ccRaceApartWhy(next){
  if(!ccRaceOn()) return 'off';
  if(!ccRaceLive()) return 'off';
  if(!next) return 'solo';
  /* Соло: квал и хиты — своё (сессии и лобби по двадцать), а ФИНАЛ на сто — одно лобби на всех,
     как хиты и финалы дуо. Скриншот: два разных финала FNCS Solos на двух вкладках и
     «не было написано 1/2» — гонка разводила всё соло без разбора. Поле финала — лучшие сто пула
     (careerSoloField, tight) минус люди комнаты, соперники досаживаются ccRaceFieldSync. */
  if(next.type==='solo'){
    const ev=(typeof careerSoloSeriesOn==='function') ? careerSoloSeriesOn(careerToday()) : null;
    if(!(ev && ev.stage==='final')) return 'solo';
  }
  /* Про-Ам — личное приглашение: напарник у каждого свой креатор (ccProAmMate), а строка гонки
     несёт обычных напарников — общей комнате взяться негде. Вопрос: «pro am ещё же был». */
  if(next.type==='proam') return 'proam';
  // Кубок наций — у каждого своя сборная: вечер свой.
  if(next.type==='nations') return 'nations';
  /* ХИТЫ И ФИНАЛЫ НАВЫЛЕТ — у каждого своя комната. Хит на двадцать сеется змейкой от СВОЕГО
     места в отборе, финал — из СВОИХ хитов: у шести гонщиков шесть разных лобби, и общей
     комнате тут взяться негде (годовая проба 9.09: Reload 1.02, поле n20 «diff 14 of 20»,
     у каждого свои боты). Открытый отбор и play-in — одно большое поле, они общие. */
  /* 10 сентября это правило снято: записи посева теперь общие (книга мира несёт CC_RACE_SEED_KEYS,
     своя строка пишется настоящей — см. ccSeedRow), а хит выбирается один на комнату
     (ccRaceHeatTogether). Значит поле у всех одно и вечер играется вместе — отзыв.
     Строки ниже оставлены пустыми нарочно: если общий мир где-то поедет, вернуть врозь — это
     вернуть сюда 'heat' / 'lan' / 'table'. */
  /* САММИТ — ВРОЗЬ ЦЕЛИКОМ. Верхняя и нижняя сетки сеются от СВОЕГО места в Мейджоре, а гранд-финал
     собирается из СВОИХ записей сеток (cr.summitSeed). Годовая проба 9.09 (четверо в Дюссельдорфе):
     сетки шли врозь, финал — общей комнатой из четырёх разных полей, «diff 23 of 50» с первой игры.
     Глобалы и Париж общие: их поле сервер выравнивает закрытием вечера (ccMpClose). */
  // Саммит: сетки и гранд-финал собираются из общей записи (cr.summitSeed) — вечер общий.
  // И Глобалы: пятнадцать мест — из СВОЕГО финала Саммита (summitSeed.gc), свой регион — из
  // СВОЕГО Мейджора 2 (gcSeed); у четверых четыре поля (двухсезонная проба 9.09, 26.09: барьеры
  // ждали приходов к вопросам, которых у соседей не было). Отбор (gclc) общий — он из пула.
  // Глобалы: пятнадцать мест из общего summitSeed.gc, свой регион — из общего gcSeed.
  // Мейджор: хиты и финал — из общей записи cr.majorSeed, хит один на комнату.
  const all=ccRacePeers();
  if(!all.length) return 'off';
  // Комната на N: у КАЖДОГО соперника должна быть строка с карточкой.
  if(all.some(p=>!p.card)) return 'off';
  // Мой турнир не тот, что у большинства комнаты, — вечер свой (см. CC_RACE_MY_KR).
  { CC_RACE_MY_KR=ccKindRank(next.type); const major=ccRaceKrMajor(); if(major!=null && CC_RACE_MY_KR<99 && CC_RACE_MY_KR!==major) return 'kind'; }
  // Сегодня в комнате — только не ушедшие вперёд и не закрывшие день (ccRaceRoom).
  const peers=ccRaceRoom();
  if(!peers.length) return 'alone';
  if(peers.some(p=>p.div!==CAREER.career.division)) return 'div';
  if(peers.some(p=>p.day && p.day<careerToday())) return 'day';   // отстающие догонят
  /* Вторник Дивизиона 1 играется с таблицы своего понедельника (cr.d1). Понедельник, сыгранный
     врозь (у кого-то не было напарника), даёт другой вторник: скриншот — «diff 167 of 170 ·
     state d1». Отпечаток понедельника едет в строке (d1h); не сошёлся — вторник свой. */
  { const cr=CAREER.career; const mine=(cr.d1 && cr.d1.monday===careerMonday(careerToday())) ? String(ccHashStr(JSON.stringify(cr.d1))) : null;
    if(false && next.type==='cup' && mine && peers.some(p=>p.d1h && p.d1h!==mine)) return 'table';   // таблица понедельника общая (CC_RACE_SEED_KEYS)
    /* И финал недели: его поле — список тех, кто прошёл черту во вторник (cr.wf.cut, см.
       careerWeeklyFinalField). Вторник, сыгранный врозь, даёт разные списки — и общее воскресенье
       расходится на первой игре (годовая проба 10.09: 8.02 «diff 42 of 50 · state wf» у всех шести). */
    const wfMine=(cr.wf && cr.wf.monday===careerMonday(careerToday())) ? String(ccHashStr(String(cr.wf.cut||''))) : null;
    if(false && next.type==='final' && wfMine && peers.some(p=>p.wfh && p.wfh!==wfMine)) return 'table';   // список вторника общий
    /* И ХИТЫ МЕЙДЖОРА. Их поле сеется таблицей Плей-Ина (cr.majorSeed, см. ccMajorSeedRows):
       змейка раскладывает по ней полтораста составов на три хита, и играется тот, где стоит
       комната. Таблица общая — книга мира её везёт (CC_RACE_SEED_KEYS), — но общая не всегда:
       её пишет только прошедший Плей-Ин, и у того, кто не прошёл или пришёл в гонку позже,
       её просто нет. Тогда поле собирается не из таблицы, а броском, и это уже другой
       турнир: годовой прогон 11 сентября, 21 апреля — «The nights split at game 1», diff 48
       of 50 при одинаковых людях в поле.
       Отпечаток таблицы едет в строке (msh). Не сошёлся — вечер свой, как у соло-серии:
       каждый играет свой хит, а доски сходятся ключом врозь (ccEvKey) и посылкой соседу. */
    { const msMine=cr.majorSeed ? String(ccHashStr(JSON.stringify(cr.majorSeed))) : '';
      // next бывает пустым — плитка гонки спрашивает причину и в день без турнира.
      if(next && next.type==='major' && peers.some(p=>String(p.msh||'')!==msMine)) return 'table'; } }
  /* ОДИН РЕЖИМ НА КОМНАТУ. В «Симуляции» вопросы не задаются вовсе (см.
     playGameWithChoices), то есть у двоих разное число решений и разные дороги
     расчёта. Команда это запрещает (ccMpModeWhy), гонка — нет, и скриншоты
     8 сентября «с телефоном расходятся игры» — ровно это: на телефоне удобнее
     «Симуляция», за компьютером «Играть». Режим едет в карточке (sim); разошлись
     — вечер НЕ начинается ни у кого (ccRaceModeWhy гасит «Играть»), как в дуо.
     Врозь он шёл до 8.09 вечера — скриншот: у одного вечер убежал сам. */
  if(peers.some(p=>p.card && p.card.sim!=null && !!p.card.sim!==careerSimOn())) return 'mode';
  return null;
}
function ccRaceShared(next){ return !ccRaceApartWhy(next); }
/* Разные режимы в гонке — это НЕ «врозь», а «вечер не начнётся», как в дуо. Отчёт со скрином: у двоих «Играть», у одного «Симуляция» — и у одного вечер
   просто пошёл сам по себе. Врозь читалось как поломка. Теперь кнопка «Играть» гаснет
   у всех с этой причиной, пока режимы не сойдутся (careerCanPlayKindOn). */
function ccRaceModeWhy(){
  if(ccMpOn() || typeof ccRaceOn!=='function' || !ccRaceOn()) return null;
  if(typeof ccRaceLive!=='function' || !ccRaceLive()) return null;
  if(typeof ccRaceRivals!=='function' || !ccRaceRivals().length) return null;
  /* БЕЗ careerNext: его зовёт careerCanPlayKindOn, а careerNext в день с двумя турнирами сам
     спрашивает careerCanPlayKind — взаимная рекурсия до «Maximum call stack size exceeded»
     (годовая проба 9.09, 22.02: хит Reload + второй турнир, у двух клиентов). Режим сверяется
     напрямую по строкам комнаты — то же условие, что ветка 'mode' в ccRaceApartWhy. */
  const room=(typeof ccRaceRoom==='function') ? ccRaceRoom() : ccRaceRivals();
  /* Один мир на комнату: год и регион задаёт хозяин (отзыв). По ссылке экран создания
     их запирает; вошедший кодом мог выбрать своё — тогда вечер не начнётся, причина на кнопке. */
  const all=ccRaceRivals();
  if(all.some(p=>p.y && p.y!==ccNowYear())) return L().ccRaceWhyyear;
  if(all.some(p=>p.rg && p.rg!==ccCareerRegion())) return L().ccRaceWhyregion;
  return room.some(p=>p.card && p.card.sim!=null && !!p.card.sim!==careerSimOn()) ? L().ccRaceWhymode : null;
}
/* ХИТ ОДИН НА КОМНАТУ. Змейка (seedHeats) кладёт каждого туда, куда положил его финиш, — у двух
   гонщиков это разные хиты, а значит разные поля и разные лобби. Хит вечера выбирается по
   старшему в комнате (наименьший hKey, как у книги мира), остальные люди меняются местами с его
   соседями по хиту. Так у всех одно поле, а сетка хитов остаётся честной змейкой. */
function ccRaceHeatTogether(heats, you){
  if(typeof ccRaceLock!=='function' || !ccRaceLock() || !Array.isArray(heats) || !heats.length) return -1;
  const room=(typeof ccRaceNightRoom==='function') ? ccRaceNightRoom() : [];
  const me=careerCard(); if(!room.length || !me) return -1;
  const keys=[hKey(me)].concat(room.map(p=>hKey(p.card))).sort();
  const anchor=keys[0];
  const has=(t,k)=>t===you ? hKey(me)===k : (t && (t.squad||t.cards||[])).some(c=>c && hKey(c)===k);
  /* Хит комнаты определяется числом, а не поиском якоря в посеве.
     Якорь виден не у всех: в чужом мире его карточки может не быть, посев Хитов у каждого свой (строка 'you' или поле по силе), и Мейджор расходился на два турнира.
     Число знают оба: ключ вечера CC_MP_NIGHT и ник якоря. Люди комнаты меняются местами с не-людьми этого хита, своя команда тоже, так что змейка остаётся честной. */
  const night=String((typeof CC_MP_NIGHT!=='undefined' && CC_MP_NIGHT) || '');
  const at=Math.abs(ccHashStr(night+'|'+anchor))%heats.length;
  const mine=heats[at];
  keys.forEach(k=>{
    if(mine.some(t=>has(t, k))) return;
    for(let i=0;i<heats.length;i++){
      if(i===at) continue;
      const j=heats[i].findIndex(t=>has(t, k));
      if(j<0) continue;
      // Меняется местами с тем, кто в этом хите не человек комнаты.
      const sw=mine.findIndex(t=>!keys.some(k2=>has(t, k2)));
      if(sw>=0){ const tmp=mine[sw]; mine[sw]=heats[i][j]; heats[i][j]=tmp; }
      else mine.push(heats[i].splice(j, 1)[0]);
      break;
    }
  });
  return at;
}
function ccRaceRivalTeam(p){
  p=p||ccRaceRival(); if(!p || !p.card) return null;
  const solo=(typeof squadSize==='number' && squadSize===1);
  const cards=solo ? [p.card] : [p.card].concat((p.mates||[]).filter(Boolean)).slice(0, careerSquadSize());
  // Пара людей — в порядке по hKey, как строит её сама пара (ccRacePairCards): адрес вопросов один у всех.
  if(p.pair && cards.length===2) cards.sort((a,b)=>hKey(a)<hKey(b) ? -1 : 1);
  const t=careerTeam(cards, true);
  t.name=teamLabel(cards);
  /* Сила — из строки владельца и в соло тоже: соло-ветка считала её из карточки (база + formPow)
     и теряла химию/форму вечера (год 9.09: соло Victory Cup 13.06, live3:97 vs 102 = 95+2.5+5). */
  if(p.pow!=null) t.pow=p.pow;
  else if(solo) t.pow=Math.round(t.pow+(Number(p.card.formPow)||0));
  if(p.edge!=null) t.closeEdge=p.edge;   // край ближнего боя — из строки владельца (см. CC_RACE_EDGE_NOW)
  t.isRival=true; t.raceId=p.id||null; t.mpTag=':'+hKey(cards[0]);
  if(p.pair) t.pair=true;
  t.summitRegion=ccCareerRegion();
  return t;
}
// Люди в комнату садятся на месте: раннер держит ту же ссылку на массив teams.
// Сборка команд из карточек — ВНЕ сеяного потока: у хозяина этих сборок нет, и
// каждый бросок Math.random в них уводил бы гостя от хозяина (та же обёртка, что
// у вопроса в ccMpChoose).
function ccRaceUnseeded(fn){
  if(!CC_MP_RAND) return fn();
  const seeded=Math.random; Math.random=CC_MP_RAND;
  try{ return fn(); } finally{ Math.random=seeded; }
}
