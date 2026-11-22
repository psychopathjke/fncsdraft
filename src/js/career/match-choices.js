/*@@PART js/career/match-choices.js@@*/
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
/* Перемотка: чужие лобби своего региона быстрой моделью (draft.js, ffFast). Настройки свои, не как у чужих регионов: замер 22.11
   (30 дней D1 EU 2026, 4666 игр лобби без людей, scratchpad ff-cmp.js) - с разбросом 0.24 и степенью 1 сила решала слабее
   (связь силы и места 0.29 против 0.45 у полного движка). Без разброса и со степенью 1.5: победитель лобби в верхних 11.7 %
   по силе (полный 11.2 %), сильнейшая команда в среднем на 23 % поля (полный 25 %).
   Киллы быстрая модель даёт целыми отрядами и копит у победителя (8.2 против 5.7), поэтому они умножаются на поправку
   группы мест (CC_FF_FAST_EL, со сглаживанием +1), чтобы средние по местам совпали с полным движком. Замерены только дуо - трио, сквады и
   соло при перемотке остаются на полном движке (ccFfFastSize), пока не замерены. */
let CC_FF_FAST_OFF=false, CC_FF_FAST_NOISE=0, CC_FF_FAST_EXP=1.5;
// [до места, среднее киллов полного движка, среднее быстрой модели] - замер 22.11 только по лобби дуо (3776 и 3427 игр).
const CC_FF_FAST_EL={2:[[1, 6.17, 8.87], [3, 4.59, 5.38], [10, 3.05, 2.50], [25, 2.06, 0.84], [9999, 1.29, 0.57]]};
function ccFfFastSize(lobby){ const t=lobby && lobby[0]; const n=(t && t.squad && t.squad.length) || 0; return !!CC_FF_FAST_EL[n]; }
function ccFfFastElims(order){
  if(!Array.isArray(order) || !order.length) return;
  const tab=CC_FF_FAST_EL[(order[0].squad && order[0].squad.length) || 0]; if(!tab) return;
  order.forEach((t, i)=>{
    // Среднее группы мест - как у полного движка; +1 сглаживает: у быстрой модели киллы целыми отрядами и много нулей.
    const r=tab.find(x=>i+1<=x[0])||tab[tab.length-1], v=r[1]*((t._elims||0)+1)/(r[2]+1), w=Math.floor(v);
    t._elims=w+(Math.random()<v-w ? 1 : 0);
  });
}   // сверка перемотки: true - чужие лобби полным движком (см. draft.js, ffFast)
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
