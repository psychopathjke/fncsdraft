/*@@PART js/career/teammates-profile.js@@*/
/* ПОЗВАТЬ НАПАРНИКА В СВОЙ КЛУБ (идея игрока 30.09: «чтобы дуо/трио были в одной организации, особенно на
   EWC»). Клуб, подписавший дуо, подписывает и напарника (careerOrgSignMates), но напарник, пришедший позже,
   оставался в чужом. Теперь его можно предложить клубу: берёт, если он не ниже уровня клуба (tier − 6),
   иначе отказ новостью. Свой клуб (careerClub) берёт напарника своим рынком (careerClubMateFree). */
/* Отказ клуба держится 30 дней (его скрин в Notion 8.10: «опять спам можно» — кнопка «Позвать в клуб» жалась без конца,
   и лента забивалась одной и той же строкой «не берёт — не их уровень»). Через месяц можно снова: игрок мог подрасти. */
const CC_CLUB_ASK_COOL=30;
function ccClubAskNoUntil(handle, orgName){
  const m=CAREER && CAREER.clubAskNo, k=hKey(handle)+'|'+String(orgName||'');
  const d=m && m[k]; return (d && careerToday()<d) ? d : null;
}
/* НЕ В ОДИН КЛИК (его слово 19.10: «сначала пишу менеджеру, и потом пусть он договаривается, а не сразу оргу даёт
   тиммейту в один клик»). Кнопка — это просьба в личку: своему менеджеру (careerAgent), а без менеджера — самому клубу.
   Он отвечает, что поговорит, и через 2–3 дня пишет итог (ccClubAskTick). Решает то же правило: клуб берёт, если
   напарник не ниже уровня клуба (tier − 6); отказ держится CC_CLUB_ASK_COOL дней. Пока идут переговоры, кнопки нет —
   вместо неё «договаривается» (ccClubAskPending). */
function ccClubAskThread(org){
  const ag=careerAgent();
  if(ag && ag.name){ const t=ccAgentThreadOf(ag.name, true); if(t) return {t, agent:true}; }
  const t=careerDmFind(org.name) || careerDmThread({handle:org.name, ovr:org.tier||75, role:'roleIGL', roster:false, org:true});
  return {t, agent:false};
}
function ccClubAskPending(handle, orgName){
  return (CAREER && CAREER.clubAsks || []).find(a=>a.h===hKey(handle) && a.org===orgName) || null;
}
function ccOrgBringMate(handle, fmt){
  const org=CAREER.org; if(!org || !org.name) return;
  if(ccClubAskNoUntil(handle, org.name) || ccClubAskPending(handle, org.name)) return;
  const list=(fmt && fmt!==careerSquadSize()) ? (((CAREER.rosters||{})[fmt])||[]) : careerMateRecords();
  const r=list.find(x=>{ const c=ccMateCardOf(x); return c && hKey(c.handle)===hKey(handle); });
  if(!r) return;
  const c=ccMateCardOf(r);
  const {t, agent}=ccClubAskThread(org);
  careerDmPush(t, 'me', agent ? 'dmClubAskMe' : 'dmClubAskMeOrg', ['@'+ccHandle(c.handle), org.name]);
  careerDmPush(t, 'them', agent ? 'dmClubAskOk' : 'dmClubAskOrgOk', [org.name, '@'+ccHandle(c.handle)]);
  const days=2+(ccHashStr(hKey(c.handle)+'|'+careerToday())%2);
  CAREER.clubAsks=(CAREER.clubAsks||[]).concat([{h:hKey(c.handle), handle:c.handle, fmt:fmt||0, org:org.name, due:ccAddDays(careerToday(), days), by:agent ? 'agent' : 'org'}]);
  careerSave();
  careerRenderHub();
}
// Итог переговоров — в свой день: менеджер (или клуб) пишет, взяли или нет.
function ccClubAskTick(day){
  const asks=CAREER && CAREER.clubAsks; if(!asks || !asks.length) return;
  const today=day||careerToday(), org=CAREER.org;
  CAREER.clubAsks=asks.filter(a=>{
    if(today<a.due) return true;
    if(!org || org.name!==a.org) return false;   // сменил клуб — просьба потеряла смысл
    const list=(a.fmt && a.fmt!==careerSquadSize()) ? (((CAREER.rosters||{})[a.fmt])||[]) : careerMateRecords();
    const r=list.find(x=>{ const c=ccMateCardOf(x); return c && hKey(c.handle)===a.h; });
    if(!r) return false;                          // напарника уже нет в составе
    const c=ccMateCardOf(r), agent=a.by==='agent' && careerAgent();
    const t=agent ? ccAgentThreadOf(careerAgent().name, true) : (careerDmFind(org.name) || ccClubAskThread(org).t);
    const ovr=Math.round(ccCardOvr(c)||(attrsFor(c)||{}).ovr||c.rating||0);
    if(ovr>=(org.tier||80)-6){
      r.org=org.name;
      careerDmPush(t, 'them', agent ? 'dmClubAskYes' : 'dmClubAskOrgYes', ['@'+ccHandle(c.handle), org.name]);
      careerNews('good', 'ccNewsSignedDuo', [org.name, ccHandle(c.handle)], {by:ccOrgBy(org.name)});
    } else {
      careerDmPush(t, 'them', agent ? 'dmClubAskNo' : 'dmClubAskOrgNo', ['@'+ccHandle(c.handle), org.name]);
      careerNews('bad', 'roClubNo', [org.name, ccHandle(c.handle)]);
      CAREER.clubAskNo=CAREER.clubAskNo||{};
      CAREER.clubAskNo[a.h+'|'+org.name]=ccAddDays(today, CC_CLUB_ASK_COOL);
    }
    return false;
  });
}
function careerSeatDms(fromISO, toISO){
  for(let d=ccAddDays(fromISO,1); d<=toISO; d=ccAddDays(d,1))
    if(!careerSeatDm(d)) return;
}
// And the seat is not empty in silence on the way in: a career opened with
// nobody beside it has its offers waiting rather than arriving tomorrow.
function careerSeatTopUp(){
  let wrote=false;
  // One conversation per empty chair, not one per career: a trio with two seats
  // open is two people short and hears from people about both.
  const open=Math.max(0, careerMateSeats()-careerMates().length);
  for(let s=0; s<open; s++)
    for(let n=0; n<CC_SEAT_DMS; n++){
      if(!careerSeatDm(careerToday()+'|'+s+'|'+n)) break;
      wrote=true;
    }
  if(wrote) careerSave();
}

// You writing first. One line, because there is one thing to ask, and the reply
// comes straight back — this is a DM, not a negotiation.
/* ---- Asking somebody to play with you ----
   A conversation answered on the spot (waiting is for clubs). A no isn't final, after it you get two arguments:
     result: point at the last run, free; good night +4, bad −2.
     role: offer to play the half they don't want, +5, costs your attribute tilt.
     scrim: 12 rounds right now off the scrim-day numbers, win +6, loss ends the talk.
   After two arguments it's answered. */
const CC_DM_DAYS=1, CC_DM_ARGS=2;
/* What a standing pair costs you when you are asking for the third chair.

   Five points, which is the same size as the reach itself: it turns "no" into
   "you would have to be clearly better than the seat is worth", rather than
   into either a closed door or a free yes. See careerDmMargin. */
const CC_TRIO_THIRD_PULL=5;
// Осталось одно: роль больше не аргумент, её меняют кнопкой в профиле.
/* ПЕРЕГОВОРЫ С ТИММЕЙТОМ ЖИВЕЕ (его слово 7.10: «а переговоры с потенциальным тимейтом как»; без раздела призовых —
   «призовые 60/40 не надо»). Аргументы после отказа — только правдивые: «играли вместе» (по журналу), «земляки»
   (одна страна), «зову в свой клуб» (ты в основе клуба), «буткемп за мой счёт» (платишь CC_ARG_CAMP). Встречное
   вместо отказа, когда не хватило немного (CC_DM_COND): одна роль — «пойду, если пересядешь ты»; иначе — «сначала
   один кап вместе». Пробный кап решается по первому вечеру вместе (careerDmTrialDays). Числа — оценка режима. */
const CC_ARG_GAIN={form:4, history:3, nat:2, club:2, camp:3};
const CC_ARG_CAMP=1000;
const CC_DM_COND=3;               // насколько «не хватило», чтобы вместо отказа было условие
// Сколько вечеров ты уже играл с этим человеком (журнал карьеры).
function ccDmPlayedWith(handle){
  const k=hKey(handle);
  return ((CAREER.career && CAREER.career.log)||[]).filter(r=>
    (r.mate && hKey(r.mate)===k) || (r.mates||[]).some(m=>hKey(m)===k)).length;
}
// The margin, as a number rather than a yes or no, so an argument has something
// to move. Positive is a yes.
function careerDmMargin(who){
  const cr=CAREER.career;
  const last=(cr.log||[])[cr.log.length-1];
  let pull=CAREER.player.ovr+careerRep()/CC_REP_PER_OVR+(CAREER.dmBoost||0);
  if(last && last.season===cr.season){
    if(last.place<=3) pull+=3;
    else if(last.passed) pull+=2;
  }
  /* Крупные победы тоже тянут людей, а не только последняя строка журнала. Выше читается одна последняя строка
     сезона, и победа на ЛАНе пропадает после ближайшего недельного кубка: выиграл EWC 93-м, а позвать 96-го всё ещё
     монетка.
     Репутация (careerRep) про поведение, результаты в неё не идут, поэтому отдельно.
     Крупные это CC_BIG_RUNS: финал мейджора, Саммит, Reload Championship, GC Last Chance, глобалы. Недельные нет.
     Считаются этот сезон и прошлый, берётся лучшее, не сумма, иначе витрина перевесит рейтинг. */
  let crown=0;
  (cr.log||[]).forEach(function(r){
    if(!r.place || !(r.season===cr.season || r.season===cr.season-1)) return;
    if(!ccBigRunOf(r)) return;
    const w = r.place===1 ? CC_DM_CROWN_WIN
            : r.place<=3 ? CC_DM_CROWN_POD
            : r.place<=10 ? CC_DM_CROWN_TOP : 0;
    if(w>crown) crown=w;
  });
  pull+=crown;
  // The seat they are in, judged the way they would judge it.
  const mate=careerDmMateOf(who);
  if(mate && careerDuoBeatsYou(who)){
    /* In a duo season that is the end of it: the seat is taken and a standing
       pair is not for sale to a stranger.

       A trio season is asking a different question. The scene's pairs are the
       recorded 2026 duos — everybody worth writing to has one — and the chair
       being asked for is the third, which none of them are sitting in. So a pair
       that is going better than you is a reason for them to be picky rather than
       a closed door, and it costs a few points of persuasion instead of ending
       the conversation. Without this a trio career could not sign anybody good
       at all: every answer in the inbox was "I already have a duo". His report,
       20 August. */
    /* И то же самое, когда сидеть просто не с кем.

       Закрытая дверь в сезоне дуо стоит на допущении, что в сцене есть
       свободные: пара не продаётся незнакомцу, но кто-то незанятый найдётся.
       С 21 августа это допущение кончилось — финалы недели дивизиона 1
       добавили около двухсот записанных пар, и в дивизионе не осталось ни
       одного ИГЛа без напарника. Все ответы разом стали -99, писать в пустое
       место стало некому, и карьера с пустым креслом не могла войти ни в один
       турнир. Поймали check-career-one-duo и check-career-seat-keeps.

       Место пустое — значит вопрос не «продаётся ли эта пара», а «есть ли
       вообще дорога». Она должна быть всегда, и это то же самое послабление,
       что уже сделано выше для трио: дороже, но не насмерть. Место занято —
       правило прежнее, пара не продаётся. */
    if(careerSquadSize()<=2 && careerMates().length>0) return -99;
    pull-=CC_TRIO_THIRD_PULL;
  }
  return pull-(who.ovr-CAREER_DM_REACH);
}
/* НЕ ПОДРЯД ПО ВСЕМУ ПОИСКУ (его слово 7.10: «просто так можно бесконечно спамить»): ответ приходит сразу, и можно
   было писать всем подряд, пока кто-то не скажет «да». Предложений в дуо — CC_DM_ASKS_DAY в день; открыть уже
   начатый разговор можно всегда. */
const CC_DM_ASKS_DAY=3;
function ccDmAsksLeft(){
  const cr=CAREER && CAREER.career; if(!cr) return CC_DM_ASKS_DAY;
  const a=cr.dmAsks; return (a && a.day===careerToday()) ? Math.max(0, CC_DM_ASKS_DAY-a.n) : CC_DM_ASKS_DAY;
}
function ccDmAsksUse(){
  const cr=CAREER.career, today=careerToday();
  if(!cr.dmAsks || cr.dmAsks.day!==today) cr.dmAsks={day:today, n:0};
  cr.dmAsks.n++;
}
function careerDmWrite(handle, seat, fmt){
  /* Написать самому — это и есть разблокировать.

     Список тех, кого зовут в дуо, блок и так фильтрует, но добраться до
     человека можно и не оттуда. Молчащая кнопка была бы хуже снятого блока:
     ты сам решил ему написать. */
  if(ccBlocked(handle))
    CAREER.blocked=ccBlockedList().filter(b=>ccBlockedKey(b)!==hKey(handle));
  const existing=careerDmFind(handle);
  /* Asking twice is not a second chance — the same evening. A no was for the
     player who asked, and two weeks later that is not the same player: the
     rating has moved, the results are different, the seat may have emptied.
     His report, 20 August: playing as a 96 he could not sign anybody — every
     thread was a refusal from the weeks when he was not one yet, and pressing
     Ask only reopened it. So a refusal ages out: after CC_ASK_AGAIN_DAYS the
     button asks again and the answer is computed off who is asking today.
     A thread that is anything but a refusal still just opens. */
  if(existing && existing.msgs.some(m=>m.from==='you')){
    const lastNo = existing.state==='declined'
      ? existing.msgs.filter(m=>m.from==='them').slice(-1)[0] : null;
    const aged = lastNo && lastNo.day
      && ccDaysBetween(lastNo.day, careerToday())>=CC_ASK_AGAIN_DAYS;
    if(!aged || ccDmAsksLeft()<=0){ careerDmOpen(existing.id); return; }
    ccDmAsksUse();
    existing.condUsed=false;   // новый разговор через две недели — новое условие возможно
    CH_DM=existing.id;
    if(typeof seat==='number') existing.seat=seat;
    existing.fmt=fmt||null; existing.joinPair=null; existing.joinKey=null; existing.joinThird=null;
    careerDmPush(existing, 'you', 'dmAsk');
    existing.args=0;
    existing.pending=null;
    careerDmAnswer(existing, 0);
    careerSave();
    careerRenderHub('social');
    return;
  }
  /* Лимит на день — вслух (полный прогон 9.10, check-career-cup: кнопка кандидата после трёх писем молчала, и человек
     так и висел в списке — «нажимаю, ничего не происходит»). */
  if(ccDmAsksLeft()<=0){ careerRenderHub('social'); try{ ccTell(L().ccDuoLimit); }catch(e){} return; }
  const who=(existing && existing.who)
    || careerDmPool().find(w=>hKey(w.handle)===hKey(handle))
    // Anybody in the region, which is what the search offers. See careerDuoSearchPool.
    || careerDuoSearchPool(true).find(w=>hKey(w.handle)===hKey(handle));
  if(!who) return;
  // Регион карточки — из поиска: запись состава помнит, из какой сцены человек (ccMateCardOf).
  if(who.roster && !who.cardRegion) who.cardRegion=ccDuoRegNow();
  const t=existing || careerDmThread(who);
  /* Which chair this was asked for, carried by the conversation itself.

     They answer on the day they answer, and the screen that asked is long gone
     by then — the thread is the only thing left that remembers which card the
     player was looking at when he wrote. Null means nobody was named. */
  t.seat=(typeof seat==='number') ? seat : null;
  t.fmt=fmt||null; t.joinPair=null; t.joinKey=null; t.joinThird=null;   // обычное письмо — не просьба в пару (ccJoinAsk)
  CH_DM=t.id;
  careerDmPush(t, 'you', 'dmAsk');
  /* And they answer. His rule, 17 August: a player writing to a player is a
     message, not a submission — the reply comes back in the same conversation
     and the negotiation happens there and then.

     The day of waiting was borrowed from the clubs, where it belongs: a club has
     a management to ask and an offer that stands for a fortnight. A person sat
     on the other side of the same lobby does not. Nothing else about the deal
     changed — the margin is the same margin, a no is still a starting position,
     and the two arguments still cost what they cost. See careerDmArgue. */
  t.args=0;
  t.pending=null;
  ccDmAsksUse();
  careerDmAnswer(t, 0);
  careerSave();
  careerRenderHub('social');
}
// What they say when the day comes. Split out because an argument uses it again.
/* How long somebody who walked out stays gone.

   They left because a better seat opened, so the first thing they will not do
   is take yours back the same week. A month — the mode's own unit for anything
   somebody is committed to, the coach's retainer and the bootcamp's stay — and
   after it they can come back, but the line they come back with says they know
   how it looked. */
const CC_MATE_BACK=30;
/* А после месяца — не как ни в чём не бывало. Игрок: «шанс на
   согласие должен быть ниже относительно того, как недавно вы сплитнулись».
   До девяноста дней разрыв ещё холодит ответ — тем сильнее, чем свежее, — и
   только потом человек отвечает одними цифрами careerDmMargin. */
const CC_MATE_COOL=90;
function ccMateCold(gone){
  if(gone==null || gone>=CC_MATE_COOL) return 0;
  return Math.ceil((CC_MATE_COOL-gone)/12);
}
function ccDmLeftDays(t){
  if(!t || !t.left) return null;
  return Math.max(0, Math.round(
    (new Date(careerToday()+'T00:00:00Z')-new Date(t.left+'T00:00:00Z'))/86400000));
}
function careerDmAnswer(t, boost){
  const who=t.who;
  /* The one answer that is not about the numbers.

     careerDmMargin asks whether somebody of their standing would play with
     somebody of yours, which is the right question for a stranger and the wrong
     one for the man who left you a fortnight ago. He would — that is why he was
     worth poaching — and he still is not coming back yet. */
  const gone=ccDmLeftDays(t);
  if(gone!=null && gone<CC_MATE_BACK){
    careerDmPush(t, 'them', 'dmLeftNo', [CC_MATE_BACK-gone]);
    t.state='declined';
    return false;
  }
  // What the last thing said was worth, kept on the thread. It used to sit in
  // t.pending until the day came round; with the answer arriving in the
  // conversation there is nowhere else for it to be read from, and an argument
  // whose price cannot be read is an argument nothing can check.
  t.boost=boost||0;
  // Свежий разрыв тянет ответ вниз — см. CC_MATE_COOL.
  CAREER.dmBoost=(boost||0)-ccMateCold(gone);
  const margin=careerDmMargin(who);
  const yes=margin>=0;
  CAREER.dmBoost=0;
  if(yes){
    // Coming back is not the same as being asked for the first time, so it is
    // not said in the same words. See CC_MATE_BACK.
    careerDmPush(t, 'them', gone!=null ? 'dmLeftYes' : 'dmYes');
    t.state='offer';
    return true;
  }
  const mate=careerDmMateOf(who);
  // Не хватило немного — не «нет», а условие. Один раз на разговор.
  if(!t.condUsed && !(mate && careerDuoBeatsYou(who)) && margin>=-CC_DM_COND && !ccMpOn()){
    t.condUsed=true;
    const his=(who.card ? attrsFor(who.card) : attrsFor(who)||{}).roleKey;
    const can=(typeof ccRoleSwapCan==='function') ? ccRoleSwapCan() : {ok:false};
    if(his && his===ccRoleNow() && can.ok){
      t.state='cond'; t.cond='role';
      careerDmPush(t, 'them', 'dmCondRole', [L()[ccRoleOther(his)]||'']);
    } else {
      t.state='cond'; t.cond='trial';
      careerDmPush(t, 'them', 'dmCondTrial');
    }
    return false;
  }
  if(mate && careerDuoBeatsYou(who)) careerDmPush(t, 'them', 'dmNoDuo', [mate.handle]);
  else careerDmPush(t, 'them', ccDmNoKey(who), [who.ovr, CAREER.career.division]);
  t.state='declined';
  return false;
}
// The clock's own hook, beside the clubs'.
// Nothing new waits any more — a player answers in the conversation. This is
// what a save written before that rule is owed: an answer that was already due
// still lands rather than hanging in the inbox for the rest of the career.
function careerDmDays(fromISO, toISO){
  if(!(toISO>fromISO)) return;
  try{ careerDmTrialDays(); }catch(e){}
  careerDms().forEach(t=>{
    if(!t.pending || t.pending.kind!=='duo' || t.pending.due>toISO) return;
    const boost=t.pending.boost||0;
    t.pending=null;
    careerDmAnswer(t, boost);
  });
}
// Whether there is anything left to say, and what.
function careerDmArgs(t){
  if(!t || t.state!=='declined' || t.pending || (t.args||0)>=CC_DM_ARGS) return [];
  const used=t.used||{};
  const cr=CAREER.career;
  const out=[];
  if(!used.form && (cr.log||[]).length) out.push('form');
  if(!used.history && t.who && ccDmPlayedWith(t.who.handle)>0) out.push('history');
  if(!used.nat && t.who && CAREER.player && CAREER.player.country && ccDuoNatCode(t.who)===String(CAREER.player.country).toLowerCase()) out.push('nat');
  if(!used.club && CAREER.org && !CAREER.org.academy) out.push('club');
  if(!used.camp && (cr.balance||0)>=CC_ARG_CAMP) out.push('camp');
  /* «Я пересяду» отсюда убрано вместе с тем же правилом: роль меняет игрок и
     только себе, а не переговоры за него. См. careerRoleSwap. */
  return out;
}
// Отказ «я сильнее, подтянись» — только от того, кто правда сильнее; остальные отказывают из-за своего состава
// (игрок 9.10: «ask a player whos a lower rating than u, sometimes they say im 73, get better when ur a 76»).
function ccDmNoKey(who){
  const me=CAREER && CAREER.player ? (CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr) : 0;
  return (who && who.ovr!=null && who.ovr<=Math.round(me)) ? 'dmNoUp' : 'dmNo';
}
function careerDmCond(id, ok){
  const t=careerDms().find(x=>x.id===id);
  if(!t || t.state!=='cond') return;
  if(!ok){ careerDmPush(t, 'you', 'dmCondNo'); t.state='declined'; careerDmPush(t, 'them', 'dmCondNoBack'); }
  else if(t.cond==='role'){
    const was=ccRoleNow();
    careerRoleSwap();
    if(ccRoleNow()!==was){ careerDmPush(t, 'you', 'dmCondRoleOk', [L()[ccRoleNow()]||'']); careerDmPush(t, 'them', 'dmYes'); t.state='offer'; }
    else { careerDmPush(t, 'them', ccDmNoKey(t.who), [t.who.ovr, CAREER.career.division]); t.state='declined'; }
  } else {
    careerDmPush(t, 'you', 'dmCondTrialOk');
    careerDmPush(t, 'them', 'dmCondTrialYes');
    t.state='offer'; t.trial=true;
  }
  careerSave(); careerRenderHub('social');
}
/* Пробный кап: по первому вечеру, сыгранному вместе после того, как он сел. Вышли в верхние 40 % поля или прошли
   дальше — остаётся; иначе — «не то», и уходит (как разрыв: careerMateLeftMark). */
function careerDmTrialDays(){
  careerDms().forEach(t=>{
    if(!t.trial || t.trialDone || t.state!=='partner' || !t.who) return;
    if(!t.trialFrom){ t.trialFrom=careerToday(); return; }
    const k=hKey(t.who.handle);
    const r=((CAREER.career && CAREER.career.log)||[]).find(x=>x.day>=t.trialFrom &&
      ((x.mate && hKey(x.mate)===k) || (x.mates||[]).some(m=>hKey(m)===k)));
    if(!r) return;
    t.trialDone=true;
    const good=r.passed || (r.place && r.of && r.place<=Math.ceil(r.of*0.4));
    if(good){ careerDmPush(t, 'them', 'dmTrialStay', [r.place||0]); t.trial=false; return; }
    careerDmPush(t, 'them', 'dmTrialGo', [r.place||0]);
    careerMateDrop(t.who.handle);
    careerMateLeftMark(t.who.handle);
    careerNews('flat', 'ccNewsTrialGone', [t.who.handle]);
  });
}
function careerDmArgue(id, kind){
  const t=careerDms().find(x=>x.id===id);
  if(!t || careerDmArgs(t).indexOf(kind)<0) return;
  const cr=CAREER.career;
  t.used=t.used||{}; t.used[kind]=true;
  t.args=(t.args||0)+1;
  let boost=CC_ARG_GAIN[kind];
  if(kind==='form'){
    const last=(cr.log||[]).slice(-1)[0];
    const beat=last && last.of>1 ? 1-(last.place-1)/(last.of-1) : 0.5;
    // They watched it too. Pointing at a bad night is worse than saying nothing.
    boost = beat>=0.7 ? CC_ARG_GAIN.form : -2;
    careerDmPush(t, 'you', 'dmArgForm', [last?last.place:0, last?last.of:0]);
  }
  else if(kind==='history') careerDmPush(t, 'you', 'dmArgHistory', [ccDmPlayedWith(t.who.handle)]);
  else if(kind==='nat') careerDmPush(t, 'you', 'dmArgNat', [(t.who && (t.who.nat || (t.who.card && t.who.card.nat))) || '']);
  else if(kind==='club') careerDmPush(t, 'you', 'dmArgClub', [CAREER.org.name]);
  else if(kind==='camp'){ cr.balance=(cr.balance||0)-CC_ARG_CAMP; careerDmPush(t, 'you', 'dmArgCamp', [ccNum(CC_ARG_CAMP)]); }
  // And the answer to the argument comes back in the conversation too, on the
  // same rule as the first one.
  t.state='open';
  t.pending=null;
  careerDmAnswer(t, boost);
  careerSave();
  careerRenderHub('social');
}
/* ---- Answering the room -----------------------------------------------------

   The viewers and the haters were the only threads with nothing to press, and
   the reasoning was that being read is not a negotiation. It is not - but saying
   nothing back is a choice a player does not get to make, and both of these do
   something in a scene that is mostly people talking.

   Thanking somebody who wrote after a good night is what the audience is for:
   they tell people. Answering a hater is the other one, and it is honest about
   what happens - a fight travels further than a thank-you, so it is worth more
   readers and it costs you the thing the room remembers you by. Blocking costs
   nothing and gains nothing, which is also true. */
// A thank you is worth something because it gets repeated. An actual answer to
// an actual question is worth more, because it gets screenshotted.
const CC_THANK_REACH=3, CC_ANSWER_REACH=7, CC_CLAPBACK_REACH=9, CC_CLAPBACK_REP=-2;
function careerFanThank(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.who.fan || t.thanked) return;
  t.thanked=true;
  if(t.q){
    // They asked something, so the player says the thing they think, in their
    // own words. Answering is the same press either way, it is the sentence
    // underneath that is different.
    careerDmPush(t, 'you', 'dmA'+t.q);
    careerDmPush(t, 'them', 'dmQBack');
    careerReachAdd(CC_REACH_DIV(CAREER.career.division)*CC_ANSWER_REACH);
  } else {
    careerDmPush(t, 'you', 'dmThanks');
    careerDmPush(t, 'them', 'dmThanksBack');
    careerReachAdd(CC_REACH_DIV(CAREER.career.division)*CC_THANK_REACH);
  }
  careerSave();
  careerRenderHub('social');
}
function careerHaterReply(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.who.hater || t.answered) return;
  t.answered=true;
  // Answer what was said. A person told their partner carries them and a person
  // told to get a job are not owed the same sentence.
  const said=String((t.msgs[0]||{}).k||'').replace(/[1-9]$/, '');
  const clap='dmClapback'+(CC_HATE_CLAP[said]||'');
  careerDmPush(t, 'you', L()[clap] ? clap : 'dmClapback');
  careerDmPush(t, 'them', 'dmClapbackBack');
  careerReachAdd(CC_REACH_DIV(CAREER.career.division)*CC_CLAPBACK_REACH);
  careerRepAdd(CC_CLAPBACK_REP);
  careerSave();
  careerRenderHub('social');
}

// Taking the seat. An existing partner is dropped for it, and that is said out
// loud in the feed rather than happening quietly.
/* ---- Кто из вас пересядет ---------------------------------------------------
 *
 * Два выхода из одного тупика (см. careerDmAccept). Роль, которой не хватает,
 * посчитана там же и лежит на ветке в t.roleFix.
 */
// Карточка того, с кем идёт разговор: у человека с роастера она в сцене, у
// придуманного лежит на самой заявке.
function ccDmWhoCard(who){
  if(!who) return null;
  if(who.card) return who.card;
  return careerRosterNowEU().find(p=>hKey(p)===hKey(who.handle)) || null;
}
/* Согласится ли он пересесть ради этого места.
 *
 * Тем же правилом, что и уже посаженный напарник (careerMateRoleOdds): порог —
 * пятьдесят, сдвинутый на четыре за каждый пункт наклона его статов в сторону
 * просьбы. Вместо терпения — careerDmMargin: насколько ему выгодно это место
 * против того, где он стоит сейчас. Он уже согласился играть, так что просьба
 * пересесть меньше первой; но человека, у которого вся карточка про стрельбу,
 * в зовущие не уговорить одним желанием.
 *
 * Без броска: тот же вопрос — тот же ответ, переспрашивать нечего. */
function careerDmRoleOdds(t){
  if(!t || !t.roleFix || !t.who) return null;
  const card=ccDmWhoCard(t.who);
  if(!card) return null;
  const lean=ccRoleLean(card)*(t.roleFix==='roleIGL' ? 1 : -1);
  const margin=careerDmMargin(t.who);
  const want=Math.round(50+(typeof margin==='number' && isFinite(margin) ? margin*2 : 0));
  const need=clamp(Math.round(50-lean*4), 5, 95);
  return {need:need, want:want, yes:want>=need, lean:Math.round(lean*10)/10,
          role:t.roleFix};
}
// «Пусть пересядет он».
function careerDmRoleTheirs(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.roleFix) return;
  const odds=careerDmRoleOdds(t);
  const role=L()[t.roleFix]||'';
  if(!odds || !odds.yes){
    careerDmPush(t, 'them', 'dmRoleNo', [role]);
    careerSave();
    careerDmOpen(id);
    return;
  }
  careerDmPush(t, 'them', 'dmRoleYes', [role]);
  t.who.role=t.roleFix;
  t.who.roleMoved=true;
  t.roleFix=null;
  careerSave();
  careerDmAccept(id);
}
// «Пересяду сам». Отказаться тут некому — это твоя собственная роль.
function careerDmRoleMine(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.roleFix) return;
  const role=L()[t.roleFix]||'';
  // Уже в этой роли — пересаживаться некуда, и реплика «беру я» только крутила круг.
  // Старая ветка (до этой правки) пересчитывается заново: назовёт напарника и уберёт эту кнопку.
  if(ccRoleNow()===t.roleFix){
    if(t.roleFixKey==null){ t.roleFix=null; careerDmAccept(id); } else careerDmOpen(id);
    return;
  }
  if(!ccRoleSwitch(t.roleFix)) return;
  careerDmPush(t, 'you', 'dmRoleMine', [role]);
  t.roleFix=null; t.roleFixKey=null;
  careerSave();
  careerDmAccept(id);
}
// «Взять вместо него»: он садится на место напарника, который держит ту же роль.
function careerDmRoleReplace(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.roleFix || !t.roleMate || !t.roleMate.swap) return;
  const mates=careerMates(), at=t.roleMate.at;
  if(!mates[at] || hKey(mates[at].handle)!==hKey(t.roleMate.handle)){ t.roleFix=null; t.roleFixKey=null; careerDmAccept(id); return; }
  t.seat=at;
  t.roleFix=null; t.roleFixKey=null; t.roleMate=null;
  careerSave();
  careerDmAcceptAsk(id);
}
function careerDmAccept(id){
  const t=careerDms().find(x=>x.id===id); if(!t) return;
  /* И согласиться на такое письмо в командной карьере можно только на кресло
     ВЗЯТОГО — в трио оно одно, в дуо его нет вовсе. Письмо переживает переход
     из одиночной карьеры в командную, а кнопка под ним не должна: иначе бот
     сядет в кресло живого напарника.

     Сажает не владелец лобби, а СОГЛАСИЕ ОБОИХ: кресло общее, значит и
     решение общее. Прямой вызов в командной карьере не сажает никого — он
     проходит только изнутри рукопожатия, поставившего CC_MP_THIRD_OK.
     См. ccMpThirdAsk. */
  if(ccMpOn()){
    if(!CC_MP_THIRD_OK) return;
    // Письмо на кресло взятого (замена): он уходит, новый садится на его место. Без кресла и при полном составе — как было.
    if(ccMpMateRecs().length >= ccMpBotSeats() && typeof t.seat==='number' && t.seat>=1 && !(t.fmt && t.fmt!==careerSquadSize())){
      const cr=CAREER.career, old=ccMpMateRecs()[t.seat-1];
      if(old && !(t.who && ccMateKeyOf(old)===hKey(t.who.handle))){
        const oc=ccMateCardOf(old), oh=(oc && oc.handle) || old.handle || '';
        cr.mates=(cr.mates||[]).filter(p=>p!==old);
        try{ ccMateParted(old); }catch(e){}
        if(oh){ try{ careerSlotGiveUp(oh); }catch(e){} }
      }
    }
    if(ccMpMateRecs().length >= ccMpBotSeats()) return;
  }
  /* Somebody already in the squad has nothing to accept.

     The thread can outlive the question: they wrote asking for a seat, they took
     one somewhere else in the meantime, and the button was still sitting there
     offering to seat them again. See careerMateSeat, which holds the same rule
     one level down, and careerDmSquadTidy, which closes the thread. */
  if(t.who && ccMyPeople().has(hKey(t.who.handle))){
    careerDmSquadTidy();
    careerDmOpen(id);
    careerSave();
    return;
  }
  /* И один ИГЛ на команду — правило.

     Написать можно кому угодно, включая свою же половину дуо: разговор с ним
     и есть разговор о том, что кто-то пересядет. Но посадить рядом второго
     ИГЛа нельзя, как нельзя остаться и без единого, — сначала пересаживаешься
     сам (кнопка в карьере, пока место рядом свободно), потом зовёшь. Место, из
     которого человек уходит, при подсчёте уже пустое. */
  // Попросился третьим к паре (ccJoinAsk) в трио-год — садятся оба, своим правилом ролей.
  if(t.joinPair && !(t.fmt && t.fmt!==careerSquadSize())){
    const ok=ccJoinSeat(t);
    if(ok){
      t.state='partner'; t.unread=false;
      careerDmSquadTidy();
      const tags=careerMates().filter(Boolean).map(m=>'@'+ccHandle(m.handle)).join(' ');
      careerNews('good', 'ccNewsSquadNew', ['TRIO', tags]);
      careerEvent('tlDuo', [t.who.handle]);
      careerSave();
      careerRenderHub('social');
    } else { careerSave(); careerDmOpen(id); }
    return;
  }
  const seatOut=ccSeatLeaving(typeof t.seat==='number' ? t.seat : null);
  const roles=[ccRoleNow()].concat(
    careerMates().map((m,i)=>i===seatOut ? null : attrsFor(m).roleKey)).filter(Boolean);
  /* И у этого тупика теперь есть два выхода.
   *
   * Здесь печаталась строка «кто-то из нас должен пересесть» и стоял return.
   * Выхода из неё не было ни одного: жмёшь «взять» — получаешь ту же реплику,
   * жмёшь ещё раз — получаешь её второй раз. Его сообщение, 21 августа: «жму и
   * ничего не происходит, нужно дать выбор — спросить, пересядет ли игрок на
   * другую роль, или самому стать ролью того, кто нужен».
   *
   * Роль, которой не хватает, одна и та же в обоих случаях: противоположная
   * его. Двое фраггеров — команде нужен зовущий; двое зовущих — нужен фраггер.
   * Поэтому вопрос ровно один — кто из вас в неё сядет, — и он записывается на
   * ветку, а не решается за игрока. Кнопки рисует careerDmThreadHTML. */
  // Роли сверяются с составом года; письмо в состав другого формата (t.fmt) этим не связано.
  if(!(t.fmt && t.fmt!==careerSquadSize()) && t.who && t.who.role && !ccSquadRoleFits(roles.concat([t.who.role]), careerSquadSize())){
    const need=ccRoleOther(t.who.role);
    /* Помогает ли, если пересядешь ты. Если ты уже в нужной роли, а его роль держит
       напарник (скрин Notion «29»: Qoo ИГЛ, ты ФРГ, ИГЛ — напарник), «беру я» ничего
       не меняло и разговор шёл по кругу. Тогда называется напарник, а вместо
       «пересяду сам» — «взять вместо него» (если состав полон и место есть кому освободить). */
    const others=careerMates().map((m,i)=>i===seatOut ? null : attrsFor(m).roleKey);
    const mineOk=ccRoleNow()!==need &&
      ccSquadRoleFits([need].concat(others.filter(Boolean), [t.who.role]), careerSquadSize());
    const mateAt=mineOk ? -1 : others.findIndex(r=>r===t.who.role);
    const mate=mateAt>=0 ? careerMates()[mateAt] : null;
    const full=careerMates().length>=careerMateSeats();
    const fixKey=need+'|'+(mineOk ? 'me' : (mate ? hKey(mate.handle) : '-'));
    if(t.roleFix!==need || t.roleFixKey!==fixKey){
      t.roleFix=need;
      t.roleFixKey=fixKey;
      t.roleMineOk=mineOk;
      t.roleMate=mate ? {at:mateAt, handle:mate.handle, swap:full} : null;
      if(mineOk || !mate) careerDmPush(t, 'you', 'dmRoleClash', [L()[t.who.role]||'']);
      else careerDmPush(t, 'you', 'dmRoleClashMate', [L()[t.who.role]||'', ccHandle(mate.handle)]);
    }
    careerSave();
    careerDmOpen(id);
    return;
  }
  t.roleFix=null;
  // Позвали в состав другого формата (трио/сквад на кап) — садится туда, состав года не трогается.
  if(t.fmt && t.fmt>1 && t.fmt!==careerSquadSize()){
    const f=t.fmt, w=t.who;
    if(!CAREER.rosters) CAREER.rosters={};
    const list=ccFmtRoster(f).slice();
    const rec=w.roster ? {handle:w.handle, cardRegion:w.cardRegion||'EU', patience:CAREER_PATIENCE_START, since:careerToday()}
                       : {card:w.card, patience:CAREER_PATIENCE_START, since:careerToday()};
    if(!list.some(r=>hKey((ccMateCardOf(r)||{}).handle||'')===hKey(w.handle))) list.push(rec);
    /* Писала пара («мы вдвоём, нужен третий», careerFmtSeatDms) — ТЫ идёшь третьим к НИМ: состав формата — их пара,
       а не «твой напарник + тот, кто писал». Notion 15.10, фидбек игрока: «if you accept the person asking, he just
       joins your current team rather than the player leaving their trio for the other». Раньше второй садился, только
       если находился в ростере сцены, а иначе на его месте оставался твой напарник года. */
    if(t.fmtPair){
      const pc=careerRosterNowEU().find(x=>hKey(x)===hKey(t.fmtPair));
      const mate={handle:pc ? pc.handle : t.fmtPair, cardRegion:(pc && pc.region)||w.cardRegion||'EU', patience:CAREER_PATIENCE_START, since:careerToday()};
      // В сквад (4) их пары и тебя мало — одно место остаётся за твоим напарником года.
      const keep=f>3 ? list.filter(r=>{ const h=hKey((ccMateCardOf(r)||{}).handle||''); return h && h!==hKey(w.handle) && h!==hKey(mate.handle); }).slice(0, f-3) : [];
      list.length=0; list.push(...keep, rec, mate);
    }
    CAREER.rosters[f]=list.slice(-(f-1));
    t.state='partner'; t.unread=false;
    // Состав формата собран — остальные предложения на него уже не в силе.
    if(CAREER.rosters[f].length>=f-1) careerDms().forEach(x=>{ if(x!==t && x.fmt===f && x.state==='offer') x.state='open'; });
    const tags=CAREER.rosters[f].map(r=>ccMateCardOf(r)).filter(Boolean).map(c=>'@'+ccHandle(c.handle)).join(' ');
    careerNews('good', 'ccNewsSquadNew', [f===4 ? 'SQUAD' : 'TRIO', tags]);
    careerSave();
    careerRenderHub('social');
    return;
  }
  /* Who actually loses the chair.

     Asked for from under a card, it is that card. Asked for with nothing named,
     it is the partner the mode has always meant by "the partner". Both the feed
     line and the forfeited slot below have to name the person who really left —
     a trio announcing the wrong departure is worse than announcing none. */
  const mateRecs=careerMateRecords();
  const seatAt=(typeof t.seat==='number' && t.seat>=0 && t.seat<mateRecs.length) ? t.seat : null;
  const old=(seatAt!=null) ? ccMateCardOf(mateRecs[seatAt]) : careerPartnerCard();
  // And the door swings both ways. A career holding a seat with somebody cannot
  // walk out of it either - the qualification is the pair's, and dropping your
  // half of it in the week before a Major is the thing the rule exists to stop.
  // His rule, 17 August: let them go anyway, and the slot goes to the team
  // below. A qualification belongs to the pair that won it, so breaking the pair
  // forfeits it - see careerSlotDrop.
  if(old) careerSlotGiveUp(old.handle);
  // Leaving a seat for a better one is allowed and is most of what this scene
  // does; it is still something the room notices, and it is the quiet half of a
  // reputation against the loud half, which is blaming somebody in public.
  if(old){ careerNews('bad', 'ccNewsDropped', [old.handle]); careerRepAdd(-1); }
  const who=t.who;
  // The day it started, because what a duo is worth is partly how long it has
  // been one. See careerChem.
  // Into the first empty chair, or over the weakest of them when the squad is
  // already full — which is the swap this has always been. See careerMateSeat.
  /* И если он согласился пересесть ради этого места, это едет с ним: роль
     живёт на записи, потому что карточку ccMateLift пересобирает под каждый
     новый рейтинг. См. careerDmRoleTheirs. */
  careerMateSeat(who.roster
    ? {handle:who.handle, cardRegion:who.cardRegion||'EU', patience:CAREER_PATIENCE_START,
       since:careerToday(), role:who.roleMoved ? who.role : undefined}
    : {card:who.card, patience:CAREER_PATIENCE_START, since:careerToday(),
       role:who.roleMoved ? who.role : undefined}, seatAt);
  t.state='partner';
  t.unread=false;
  // And nobody else in the squad is left standing as an open offer.
  careerDmSquadTidy();
  /* Анонс — как его пишут сами про: «TRIO @vico @shark», а не «Новый
     напарник: Shxrk (96)». Его пункт, 23 августа, со скрином поста Малибуки.
     Слово — размер сезона, теги — весь состав рядом; @ подсвечивает
     ccMentions. Старый ключ ccNewsPartnerNew остаётся ради лент в сейвах. */
  const tags=careerMates().filter(Boolean).map(m=>'@'+ccHandle(m.handle)).join(' ');
  careerNews('good', 'ccNewsSquadNew', [careerSquadSize()===3?'TRIO':'DUO', tags]);
  careerEvent('tlDuo', [who.handle]);
  careerSave();
  careerRenderHub('social');
}

let CH_DM=null;
/* Closing a conversation.

   Writing to everybody in the week's list leaves seven threads, and next week
   leaves seven more; the inbox filled up faster than anything ever left it. This
   only removes the conversation — it does not drop a partner, because the duo is
   who you play with rather than who you have a thread open with.

   The one being read moves to whatever is left rather than to nothing, so
   closing the top of the list does not empty the screen. */
/* A club writing to you.

   An offer used to appear only as a tile on the hub, which is a strange way for
   a contract to reach somebody. It arrives as a message now, from the club, in
   the inbox where everything else addressed to the player already goes. The tile
   stays for the deal you have signed.

   Clubs write while you already have one, too. Choosing between the contract in
   your hand and the one being waved at you is the whole of a transfer, and it
   cannot happen if the offers stop the moment you sign. */
/* Signing from the message it arrived in.

   The offer on the thread carries its own terms rather than an index into a list
   that may have been rebuilt since, so a contract cannot be signed for a wage
   nobody offered. Leaving a club for another is allowed and says so in the feed;
   that is the poaching the whole thing is for. */
/* Out of the academy.

   An academy place is somewhere to be seen, so it has to be possible to be seen.
   The club moves a player up when the player has caught up with it — the rating
   reaching the club's own standard — or when a run says so loudly enough on its
   own, which is a top-ten finish in a field of a hundred and fifty.

   It arrives the way the offer did, as a message from the club, and the wage
   goes to the full band: the academy discount was for an unproven player, and
   the point of this is that they are not one any more.

   Checked after a cup rather than on a timer, because the thing being watched is
   results. */
function careerAcademyStep(place, of){
  const org=CAREER.org;
  if(!org || !org.academy) return null;
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const caughtUp = org.tier!=null && ovr >= org.tier-1;
  const loud = of>1 && place<=Math.max(10, Math.round(of*0.07));
  if(!caughtUp && !loud) return null;
  org.academy=false;
  org.salary=careerOrgSalary(org.tier||75, CAREER.career.division, CAREER.career.reach);
  const t=careerDmFind(org.name) || careerDmThread({handle:org.name, ovr:org.tier||75,
                                                   role:'roleIGL', roster:false, org:true});
  t.state='signed';
  ccOrgSay(t, 'dmOrgPromoted', [org.name, ccNum(org.salary)]);
  careerNews('good', 'ccNewsPromotedRoster', [org.name, ccNum(org.salary)], {by:ccOrgBy(org.name)});
  careerSave();
  return {name:org.name, salary:org.salary};
}
/* Wage can only go up during a deal. careerOrgSalary already prices the current rating and last four runs,
   so this re-asks it and keeps a raise only if it beats the current wage by 15% (form alone swings it about a third).
   After a raise the next one is measured from the new figure. Never cut: prize money already punishes a bad month.
   Academy players are handled by careerAcademyStep. */
function careerRaiseStep(){
  const org=CAREER.org, cr=CAREER.career;
  if(!org || org.academy || !cr) return null;
  if(!(org.salary>0)) return null;
  const worth=careerOrgSalary(org.tier||75, cr.division, cr.reach);
  if(!(worth >= org.salary*1.15)) return null;
  const was=org.salary;
  org.salary=worth;
  const t=careerDmFind(org.name) || careerDmThread({handle:org.name, ovr:org.tier||75,
                                                   role:'roleIGL', roster:false, org:true});
  t.state='signed';
  ccOrgSay(t, 'dmOrgRaise', [org.name, ccNum(worth)]);
  careerNews('good', 'ccNewsRaise', [org.name, ccNum(worth)], {by:ccOrgBy(org.name)});
  careerSave();
  return {name:org.name, from:was, to:worth};
}
/* Asking for more on an offer: a bigger wage, or the club covers the gear. Not length, a contract always runs
   to the end of the year.
   Decided by leverage vs the club's signing standard: at the standard it's about 50%, each point moves it 6.
   One ask per offer. More than 5 points under their standard, a refusal has a 1/3 chance of the club walking away;
   asking a club that's reaching for you is free. */
const CC_ASK_RAISE=0.20;          // what a yes is worth on the wage
const CC_ASK_STEP=0.06;           // per point of rating against their standard
const CC_ASK_WALK_UNDER=-5;       // below this gap a refusal can end it
const CC_ASK_WALK=1/3;
/* Contract negotiation runs over days. The club answers in a couple of days, you get two asks
   (the second harder), and the offer expires after 14 days. A second ask costs 4 of those days,
   and a club doing you a favour can walk mid-way. */
const CC_ASK_DAYS=2;              // how long a club takes to come back
/* ПЕРЕГОВОРЫ ПОИНТЕРЕСНЕЕ (его слово 7.10: «для переговоров мб сделать диалоги поинтересней, реализм»). Было: одна
   кнопка «больше» на один и тот же шаг и «да/нет». Теперь: размер просьбы (чуть / честно / жёстко — шаг и шанс свои),
   встречное «можем посередине» вместо голого отказа, торг за долю клуба с призовых и бонус за подпись, и козырь —
   другое предложение на руках (только если оно правда есть). Шаги и множители — оценка режима, не замер. */
const CC_ASK_MAX=3;               // asks per offer
const CC_ASK_SIZES={small:{raise:0.10, odds:1.25}, fair:{raise:0.20, odds:1}, hard:{raise:0.35, odds:0.6}};
const CC_ASK_COUNTER=0.5;         // отказ по деньгам — шанс встречного «посередине»
const CC_ASK_CUT=0.05;            // на сколько просят срезать долю клуба с призовых
const CC_SIGN_BONUS=0.10;         // бонус за подпись — доля сезонной зарплаты
const CC_ASK_LEVER=0.15;          // козырь (другое предложение) к шансу
const CC_ASK_AGAIN=-0.15;         // what the second one costs in odds
const CC_OFFER_DAYS=14;           // how long an offer stands
function ccOrgGap(offer){
  const pl=CAREER.player;
  const ovr=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  return ovr-((offer && offer.tier) || 75);
}
// asks — how many have already been sent on this offer. The second one is
// harder, because the first one already spent the goodwill.
function careerAskOdds(offer, asks, mult, lever){
  const base=0.5+ccOrgGap(offer)*CC_ASK_STEP+(asks||0)*CC_ASK_AGAIN;
  return Math.round(clamp(base*(mult||1)+(lever ? CC_ASK_LEVER : 0), 0.05, 0.95)*100);
}
// Другое предложение на руках — есть ли чем козырнуть.
function ccAskLeverOrg(t){
  const other=(CAREER.offers||[]).find(o=>t && t.offer && o.name!==t.offer.name);
  return other ? other.name : null;
}
function ccAskResolve(t, yes, no, p){
  const rnd=careerRng(ccHashStr('ask|'+t.id+'|'+CAREER.career.season+'|'+careerToday()));
  const before=(t.asks||0)-1;
  t.asked=(t.asks||0)>=CC_ASK_MAX;
  if(rnd()<careerAskOdds(t.offer, before, p && p.mult, t.lever)/100){ yes(); }
  else {
    // Встречное: клуб не захлопывает дверь, а предлагает своё — тогда и не уходит.
    if(no(rnd)===true){ careerSave(); careerRenderHub('social'); return; }
    // The club that was reaching down to sign you can decide it is not worth it.
    if(ccOrgGap(t.offer)<CC_ASK_WALK_UNDER && rnd()<CC_ASK_WALK){
      ccOrgSay(t, 'dmOrgWithdraw', [t.offer.name]);
      CAREER.offers=(CAREER.offers||[]).filter(o=>o.name!==t.offer.name);
      t.offer=null;
      t.state='declined';
    }
  }
  careerSave();
  careerRenderHub('social');
}
/* Sending an ask, and being answered two days later.

   The ask is recorded on the thread with the day it is owed back, and nothing
   else happens until the clock reaches it - careerOrgDays does the answering,
   off the same day loop that pays the wages and plays Division 1's week. So an
   ask is something you send and then go and train while it sits there, and the
   inbox has a conversation in it that is genuinely waiting on somebody. */
function careerAskOpen(t){
  return !!(t && t.offer && !t.pending && (t.asks||0)<CC_ASK_MAX);
}
function ccAskSend(id, kind){
  const t=careerDms().find(x=>x.id===id);
  if(!careerAskOpen(t)) return null;
  t.asks=(t.asks||0)+1;
  t.pending={kind:kind, due:ccAddDays(careerToday(), CC_ASK_DAYS)};
  return t;
}
function careerAskMore(id, size){
  const t=careerDms().find(x=>x.id===id);
  if(!careerAskOpen(t)) return;
  const sz=CC_ASK_SIZES[size] || CC_ASK_SIZES.fair;
  /* And a man whose job it is asks for more than you would.

     The agent already makes the offer arrive a fifth better — careerAgentTerms'
     wage — and this is the other half of what he is for: when you send him back
     to the table he asks for a bigger step than a player asking for himself
     would dare. His ask, 18 August. Without one the step is what it always was. */
  /* And what the club is willing to move by is the club's, not a constant.

     The step was exactly a fifth every time, so asking for more produced the
     identical number at every club a career ever talked to and the negotiation
     had one outcome shaped like a decision. Same spread as the offer itself, on
     the same seed, so the second ask of a thread is not a different club. */
  const on=careerAgent();
  const step=sz.raise*(on ? careerAgentTerms().wage : 1)
             *ccOrgWageNoise('ask|'+((t.offer && t.offer.name) || t.who && t.who.org || ''));
  // Шаг округления по размеру оклада: у оклада в $52 круглые пятьдесят уводили просьбу ниже самого предложения.
  const sal=t.offer.salary, grain=sal>=2000 ? 50 : sal>=200 ? 10 : 1;
  const want=Math.max(sal+grain, Math.round(sal*(1+step)/grain)*grain);
  const sayKey=on ? 'dmAskMoreAgent' : size==='small' ? 'dmAskSmall' : size==='hard' ? 'dmAskHard' : 'dmAskMore';
  careerDmPush(t, 'you', sayKey, [ccNum(want)]);
  const pend=ccAskSend(id, 'more').pending;
  pend.want=want; pend.mult=sz.odds;
  ccOrgSay(t, 'dmOrgWait', [t.pending.due]);
  careerSave();
  careerRenderHub();
}
// Срезать долю клуба с призовых на CC_ASK_CUT.
function careerAskCut(id){
  const t=careerDms().find(x=>x.id===id);
  if(!careerAskOpen(t)) return;
  const cut=t.offer.cut!=null ? t.offer.cut : careerOrgCutFor(t.offer.tier);
  if(!(cut>0)) return;
  const to=Math.max(0, Math.round((cut-CC_ASK_CUT)*100)/100);
  careerDmPush(t, 'you', 'dmAskCut', [Math.round(to*100)]);
  const pend=ccAskSend(id, 'cut').pending; pend.to=to; pend.mult=0.9;
  ccOrgSay(t, 'dmOrgWait', [t.pending.due]);
  careerSave(); careerRenderHub('social');
}
// Бонус за подпись — разовая выплата в день подписания.
function careerAskBonus(id){
  const t=careerDms().find(x=>x.id===id);
  if(!careerAskOpen(t) || t.offer.signBonus) return;
  const v=Math.max(500, Math.round(t.offer.salary*CC_SIGN_BONUS/50)*50);
  careerDmPush(t, 'you', 'dmAskBonus', [ccNum(v)]);
  const pend=ccAskSend(id, 'bonus').pending; pend.v=v; pend.mult=1.1;
  ccOrgSay(t, 'dmOrgWait', [t.pending.due]);
  careerSave(); careerRenderHub('social');
}
// Козырь: «меня зовут в X». Просьбой не считается, дня не ждёт; один раз на предложение.
function careerAskLever(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.offer || t.lever) return;
  const other=ccAskLeverOrg(t); if(!other) return;
  t.lever=other;
  careerDmPush(t, 'you', 'dmAskLever', [other]);
  ccOrgSay(t, 'dmOrgLever', [other]);
  careerSave(); careerRenderHub('social');
}
/* «ДАЙ ПОДУМАТЬ» (17.10, его «7» из идей с Reddit/FM-вишлистов: «не отвечать сразу, а взять день-два»).
   Просьбой не считается (asks не тратит), но клуб ждёт ответа CC_THINK_DAYS дня — и за это время решает сам:
   поднимает предложение, чтобы помочь решиться (чаще, если ты сильнее уровня клуба или у тебя есть другой оффер),
   ставит жёсткий срок, или — если клуб тянулся вниз к тебе — уходит к другому. Один раз на предложение. */
const CC_THINK_DAYS=2, CC_THINK_SWEET=0.08;
function careerAskThink(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.offer || t.pending || t.thought) return;
  t.thought=true;
  t.pending={kind:'think', due:ccAddDays(careerToday(), CC_THINK_DAYS)};
  careerDmPush(t, 'you', 'dmAskThink');
  ccOrgSay(t, 'dmOrgThinkOk', [t.pending.due]);
  careerSave(); careerRenderHub('social');
}
function ccThinkOdds(t){
  const gap=ccOrgGap(t.offer);
  return Math.round(clamp(0.35+gap*0.03+(ccAskLeverOrg(t) ? 0.2 : 0)+(t.lever ? 0.1 : 0), 0.1, 0.85)*100);
}
function ccThinkResolve(t){
  const rnd=careerRng(ccHashStr('think|'+t.id+'|'+CAREER.career.season+'|'+careerToday()));
  const sync=f=>{ const o=(CAREER.offers||[]).find(x=>x.name===t.offer.name); if(o) f(o); f(t.offer); };
  if(rnd()<ccThinkOdds(t)/100){
    const v=Math.round(t.offer.salary*(1+CC_THINK_SWEET*(0.75+rnd()*0.5))/50)*50;
    sync(o=>{ o.salary=v; });
    ccOrgSay(t, 'dmOrgThinkSweet', [ccNum(v)]);
    return;
  }
  if(ccOrgGap(t.offer)<CC_ASK_WALK_UNDER && rnd()<0.35){
    ccOrgSay(t, 'dmOrgThinkGone', [t.offer.name]);
    CAREER.offers=(CAREER.offers||[]).filter(o=>o.name!==t.offer.name);
    t.offer=null; t.state='declined';
    return;
  }
  const until=ccAddDays(careerToday(), 3);
  sync(o=>{ if(!o.until || o.until>until) o.until=until; });
  ccOrgSay(t, 'dmOrgThinkPush', [t.offer.until]);
}
function careerAskPerk(id){ // same thread, same clock — see careerAskMore
  const t=careerDms().find(x=>x.id===id);
  if(!careerAskOpen(t) || t.offer.perk) return;
  careerDmPush(t, 'you', 'dmAskPerk');
  ccAskSend(id, 'perk');
  ccOrgSay(t, 'dmOrgWait', [t.pending.due]);
  careerSave();
  careerRenderHub('social');
}
/* What the clubs did while the week went past.

   Two things, both on the clock: an answer that was owed comes back, and an
   offer nobody signed runs out. Called from careerAdvanceTo, so it covers every
   way a day can move - a training day, a tournament, a skipped week - rather
   than being wired into each of them. */
function careerOrgDays(fromISO, toISO){
  if(!(toISO>fromISO)) return;
  careerDms().forEach(t=>{
    if(!t.offer) return;
    if(t.pending && t.pending.due<=toISO){
      const p=t.pending, was=t.offer.salary;
      t.pending=null;
      const sync=f=>{ const o=(CAREER.offers||[]).find(x=>x.name===t.offer.name); if(o) f(o); f(t.offer); };
      if(p.kind==='think'){ ccThinkResolve(t); return; }
      if(p.kind==='more')
        ccAskResolve(t,
          ()=>{ sync(o=>{ o.salary=p.want; });
                ccOrgSay(t, 'dmOrgYesMore', [ccNum(p.want)]); },
          rnd=>{
            // Встречное посередине — не на каждый отказ, и не когда просили чуть-чуть.
            if(rnd && rnd()<CC_ASK_COUNTER && p.want>was*1.12){
              const mid=Math.round((was+(p.want-was)/2)/50)*50;
              sync(o=>{ o.salary=mid; });
              ccOrgSay(t, 'dmOrgCounter', [ccNum(p.want), ccNum(mid)]);
              return true;
            }
            ccOrgSay(t, 'dmOrgNoMore', [ccNum(was)]); }, p);
      else if(p.kind==='cut')
        ccAskResolve(t,
          ()=>{ sync(o=>{ o.cut=p.to; }); ccOrgSay(t, 'dmOrgYesCut', [Math.round(p.to*100)]); },
          ()=>{ ccOrgSay(t, 'dmOrgNoCut'); }, p);
      else if(p.kind==='bonus')
        ccAskResolve(t,
          ()=>{ sync(o=>{ o.signBonus=p.v; }); ccOrgSay(t, 'dmOrgYesBonus', [ccNum(p.v)]); },
          ()=>{ ccOrgSay(t, 'dmOrgNoBonus'); }, p);
      else
        ccAskResolve(t,
          ()=>{ t.offer.perk='gear';
                const o=(CAREER.offers||[]).find(x=>x.name===t.offer.name);
                if(o) o.perk='gear';
                ccOrgSay(t, 'dmOrgYesPerk'); },
          ()=>{ ccOrgSay(t, 'dmOrgNoPerk'); }, p);
    }
    // A club does not hold a seat open forever. The thread has carried the date
    // since the offer arrived, so nothing here is a surprise.
    if(t.offer && t.offer.until && toISO>t.offer.until){
      const name=t.offer.name;
      ccOrgSay(t, 'dmOrgExpired', [name]);
      CAREER.offers=(CAREER.offers||[]).filter(o=>o.name!==name);
      t.offer=null; t.pending=null;
      t.state='declined';
    }
  });
}
function careerSignFromDm(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.offer) return;
  const o=t.offer;
  const leaving=CAREER.org && CAREER.org.name!==o.name ? CAREER.org.name : null;
  // Под контрактом новый клуб платит прежнему отступные (сумма — на сегодня, а не на день оффера).
  const fee=(leaving && CAREER.org && !CAREER.org.own) ? careerBuyoutCost() : 0;
  CAREER.org={name:o.name, salary:o.salary, goal:o.goal, academy:!!o.academy,
              tier:o.tier, cut:o.cut!=null?o.cut:careerOrgCutFor(o.tier),
              since:CAREER.career.season, paid:0, perk:o.perk||null, to:CAREER.career.season+(o.term||1)-1};
  // Kept because nothing else keeps it: CAREER.org is who you play for now, and
  // a career that ends wants to say who it played for.
  CAREER.career.orgs=CAREER.career.orgs||[];
  if(CAREER.career.orgs.indexOf(o.name)<0) CAREER.career.orgs.push(o.name);
  CAREER.offers=[];
  t.state='signed';
  t.offer=null;
  // Their readers see your name next to theirs the day it is announced.
  careerReachAdd(ccOrgMediaSign(o.name, o.tier, o.academy), true);   // объявление — от аудитории клуба, а не от уровня
  ccOrgSay(t, 'dmOrgWelcome', [o.name]);
  // Уход объявляет тот, КУДА пришёл: у нового клуба и повод, и аккаунт.
  if(leaving && fee) careerNews('good', 'ccNewsTransfer', [leaving, o.name, ccNum(fee)], {by:ccOrgBy(o.name)});
  else if(leaving) careerNews('flat', 'ccNewsLeft', [leaving, o.name], {by:ccOrgBy(o.name)});
  const withMates=careerOrgSignMates(o);
  if(withMates) careerNews('good', 'ccNewsSignedDuo', [o.name, withMates], {by:ccOrgBy(o.name)});
  else careerNews('good', o.academy ? 'ccNewsSignedAcademy' : 'ccNewsSigned',
             [o.name, ccNum(o.salary)], {by:ccOrgBy(o.name)});
  careerEvent(o.academy ? 'tlAcademy' : 'tlSigned', [o.name, ccNum(o.salary)]);
  if(o.signBonus){ ccPayIn(o.signBonus, true); CAREER.career.earnSign=ccEarnSignOf(CAREER.career)+o.signBonus; careerEvent('tlSignBonus', [o.name, ccNum(o.signBonus)]); }
  if(o.perk==='gear'){ careerOrgKitOut(); careerNews('good', 'ccNewsOrgKit', [o.name]); }
  else if(o.perk==='coach') careerNews('good', 'ccNewsOrgCoach', [o.name]);
  careerSave();
  careerRenderHub('social');
}
function careerOrgDm(offer, index){
  const who={handle:offer.name, ovr:offer.tier, role:'roleIGL', roster:false, org:true};
  const t=careerDmFind(offer.name) || careerDmThread(who);
  /* An offer already on the table is not a new offer.

     The offers list is rebuilt after every cup, and this used to overwrite the
     thread each time - which reset the wage a negotiation had just raised, wiped
     the asks already spent and pushed the same opening line again. With a
     deadline on the offer that also meant it never ran out: every cup renewed
     it. The club says its piece once, and then the clock owns it. */
  if(t.offer && t.offer.name===offer.name) return t;
  t.offer={index:index, name:offer.name, salary:offer.salary, academy:offer.academy,
           tier:offer.tier, goal:offer.goal, perk:offer.perk||null, term:offer.term||1, fee:offer.fee||0,
           until:ccAddDays(careerToday(), CC_OFFER_DAYS)};
  t.asks=0; t.asked=false; t.pending=null;
  t.state='org';
  /* Who the player is actually talking to.

     His rule, 18 August: a represented player does not hear from clubs, his
     manager finds them and brings them. The thread has to stay one-per-offer,
     because that is what the negotiation hangs off — t.offer, t.asks, the answer
     that comes back days later on the clock. So the conversation stays and the
     person in it changes: the row, the avatar and the header read as the agent,
     and the club is named inside the message rather than on top of it.

     Stored as a copy rather than a lookup, so a thread opened under one manager
     still reads as his after the career has moved to another. */
  const on=careerAgent();
  if(on){ const f=ccAgentFace(on);
          t.who.viaAgent={name:on.name, at:f.at, photo:f.photo}; }
  careerDmPush(t, 'them',
    on ? (offer.academy ? 'dmAgentOrgAcademy' : 'dmAgentOrgMain')
       : (offer.academy ? 'dmOrgAcademy' : 'dmOrgMain'),
    [offer.name, ccNum(offer.salary)]);
  /* The deadline names the club when the manager is the one relaying it.

     Three offers brought by the same man are three rows with his name on them,
     and the inbox row shows the last thing said — which was "the offer stands
     until 16 Feb" on every one of them, identical. The club has to be in the
     sentence, or the list is three of the same conversation. */
  careerDmPush(t, 'them', on ? 'dmAgentDeadline' : 'dmOrgDeadline',
               on ? [offer.name, t.offer.until] : [t.offer.until]);
  // Срок и выкуп — отдельной строкой: это условия, о которых решают, а не мелкий шрифт.
  careerDmPush(t, 'them', 'dmOrgTerm', [t.offer.term]);
  if(t.offer.fee && CAREER.org) careerDmPush(t, 'them', 'dmOrgFee', [CAREER.org.name, ccNum(t.offer.fee)]);
  return t;
}
/* Every offer on the table becomes a conversation. Called where the offers are
   rebuilt, so the inbox and the tile can never disagree about what is available.

   Unless somebody is doing the talking. His call, 18 August: clubs should not
   write to a represented player, the manager should. That is the job — a club
   that wants you rings your agent, and what lands in your inbox is one line from
   him with everything on the table rather than five separate approaches.

   Without an agent the clubs still write themselves, and deliberately so: nobody
   is represented below CC_AGENT_FROM, and routing everything through a manager a
   young career cannot have yet would leave it with no club, no wage and no way
   out of that. The agent is a thing you gain, not a gate you start behind. */
function careerOrgOffersToDms(){
  const offers=CAREER.offers||[];
  if(!offers.length) return;
  /* Every offer keeps its own conversation, because that is where it is
     negotiated: careerAskMore and careerAskPerk hang off t.offer, and an answer
     comes back days later off the clock. Routing everything into one line from
     the agent took the offers out of the inbox and took the haggling with them —
     my own regression, 18 August, and his ask to put the talking back.

     So the threads stay and the agent is who is speaking in them. He announces
     the table in his own thread, and each club's own thread carries the terms
     and the two things you can send him after them. Without an agent the clubs
     speak for themselves, exactly as before. */
  const on=careerAgent();
  offers.forEach((o,i)=>{
    const t=careerOrgDm(o,i);
    if(!t || !t.who) return;
    if(on){ const f=ccAgentFace(on);
            t.who.viaAgent={name:on.name, at:f.at, photo:f.photo}; }
    else delete t.who.viaAgent;
  });
  if(on){
    const t=careerDms().find(x=>x.who && x.who.agent);
    if(t){
      // Only when the table has actually changed: an agent who repeated himself
      // every time the offers were rebuilt would be noise.
      const key=offers.map(o=>o.name+'|'+o.salary).join(',');
      if(t.brought!==key){
        t.brought=key;
        careerDmPush(t, 'them', offers.length>1 ? 'dmAgentBrought' : 'dmAgentBroughtOne',
          [offers.length, offers.map(o=>o.name).join(', ')]);
      }
    }
  }
  careerSave();
}
function careerDmClose(id){
  const all=careerDms();
  const i=all.findIndex(t=>t.id===id);
  if(i<0) return;
  all.splice(i,1);
  if(CH_DM===id) CH_DM=all.length ? all[Math.min(i, all.length-1)].id : null;
  careerSave();
  careerRenderHub('social');
}
/* Blocked is remembered; closed is only tidied away.

   Closing a thread deletes it, and deleting it is what let the same person
   write the same hello every week: the "already has a thread" filter had
   nothing left to hold on to. A player finished the year, kept hearing from
   one man, and asked for the button, 20 August.

   The list holds handles rather than threads so it survives everything a
   thread does not — the close, the season turn, the save. Blocking a hater
   goes through here too, so the loud one stays gone instead of respawning. */
/* Заблокированных теперь можно и разблокировать, и блокировать не только тех,
   кто пишет гадости.

   Просьба игрока: «чтобы можно было блокировать менеджеров, так
   как они просто каждый день пишут и из-за этого появляется уведомления» и
   «предлагаю сделать ещё лист все блокнутые, чтобы их можно было
   разблокировать».

   Кнопка переехала из подвала в шапку разговора — там она есть у всех, а не
   только у хейтера и у того, кто просится в дуо, — а сам список стал видимым
   разделом в боковой колонке с кнопкой обратно. Запись держит и ключ, и имя:
   ключ — чтобы узнавать, имя — чтобы список читался, а не показывал огрызки в
   нижнем регистре. Старые сейвы хранят просто строку, и она всё ещё работает:
   ключ и имя у неё совпадают. */
function ccBlockedKey(b){ return String((b && b.k!=null) ? b.k : b).toLowerCase(); }
function ccBlockedName(b){ return String((b && b.name) ? b.name : (b && b.k!=null ? b.k : b)); }
function ccBlockedList(){ return ((CAREER && CAREER.blocked) || []).filter(Boolean); }
function ccBlockedSet(){ return new Set(ccBlockedList().map(ccBlockedKey)); }
function ccBlocked(handle){ return ccBlockedSet().has(hKey(handle)); }
function careerDmBlock(id){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.who || !t.who.handle) return;
  CAREER.blocked=(CAREER.blocked||[]);
  const k=hKey(t.who.handle);
  if(!ccBlocked(t.who.handle))
    CAREER.blocked.push({k:k, name:ccDmName(t.who)||t.who.handle, agent:!!(t.who.agent||t.who.viaAgent)});
  careerDmClose(id);
}
function careerDmUnblock(key){
  const k=String(key||'').toLowerCase();
  CAREER.blocked=ccBlockedList().filter(b=>ccBlockedKey(b)!==k);
  careerSave();
  careerRenderHub('social');
}
function careerDmOpen(id){
  const t=careerDms().find(x=>x.id===id);
  if(t) t.unread=false;
  /* Остаёмся в личке (его слово 7.10: «нажал на выбор сообщения, меня просто на ленту переключило»): без явного
     раздела соцсеть выбирала вид по непрочитанным, и прочитанная последняя ветка уводила на ленту. */
  CH_SOCIAL='dms';
  CH_DM=id; careerSave(); careerRenderHub('social');
}

/* Что карьера уже выиграла — счётом, а не строчками в ленте.

   Правка: «пусть в сошиал показывает о EWC сколько выиграл
   финалов или ланов». Место на Esports World Cup даёт выигранный финал капа
   Reload, и до сих пор об этом говорила одна строка на карточке дня — та
   пропадала, как только день проходил. Здесь это стоит рядом с лентой, где
   такие вещи и смотрят: сколько мест на EWC взято, сколько выиграно финалов
   Reload и сколько ЛАНов — Саммит, Париж и Антверпен вместе.

   Считается по журналу, ничего нового не хранится: первое место в вечере того
   вида — это и есть титул. Строка с нулём не печатается: пустая плитка на
   экране, где всё остальное живое, читается как поломка. */
/* Титул FNCS — гранд-финал Мейджора И финалы соло-FNCS (FNCS Solos 'final', FNCS Solo Reload 'rlfinal'). Notion 26.10.26,
   тестер: «when you win solo fncs or solo reload fncs it doesnt add to your fncs wins in the top section». */
function ccFncsTitle(e){
  return !!(e && e.place===1 && ((e.kind==='major' && e.stage==='final') || (e.kind==='solo' && (e.stage==='final' || e.stage==='rlfinal'))));
}
/* ПУБЛИЧНЫЙ ПРОФИЛЬ (29.10, его выбор «публичный профиль»: страница карьеры по ссылке, без входа). Карьера живёт в
   браузере, а общий сервер (mp.fncsdraft.com) служит и боевому сайту, — поэтому снимок карьеры сжимается в саму
   ссылку: fncsdraft.com/#profile=<deflate+base64url>. Открыл ссылку — страница профиля поверх сайта, только чтение.
   В снимке: ник, страна, регион, рейтинг, роль, возраст, клуб, год/сезон/дивизион, призовые, вечера, победы,
   топ-10, титулы (careerTrophies), пять лучших мест, надетый скин. Своё фото в ссылку не кладётся (слишком велико). */
const CC_PROF_TX={
  ru:{share:'Поделиться профилем', copied:'Ссылка на профиль скопирована:', title:'Профиль карьеры', make:'Создать свою карьеру', close:'Закрыть',
      earn:'Призовые', events:'Вечеров', wins:'Побед', top10:'Топ-10', best:'Лучшие результаты', titles:'Титулы', majors:'Мейджоры', lans:'ЛАНы', weekly:'Финалы недели', bad:'Ссылка на профиль повреждена', season:'Сезон', div:'Дивизион', age:'Возраст', none:'Пока без титулов'},
  en:{share:'Share profile', copied:'Profile link copied:', title:'Career profile', make:'Start your own career', close:'Close',
      earn:'Earnings', events:'Nights', wins:'Wins', top10:'Top 10', best:'Best results', titles:'Titles', majors:'Majors', lans:'LANs', weekly:'Weekly finals', bad:'This profile link is broken', season:'Season', div:'Division', age:'Age', none:'No titles yet'},
  fr:{share:'Partager le profil', copied:'Lien du profil copié :', title:'Profil de carrière', make:'Créer ta carrière', close:'Fermer',
      earn:'Gains', events:'Soirées', wins:'Victoires', top10:'Top 10', best:'Meilleurs résultats', titles:'Titres', majors:'Majors', lans:'LAN', weekly:'Finales hebdo', bad:'Ce lien de profil est cassé', season:'Saison', div:'Division', age:'Âge', none:'Pas encore de titre'},
  it:{share:'Condividi profilo', copied:'Link del profilo copiato:', title:'Profilo carriera', make:'Crea la tua carriera', close:'Chiudi',
      earn:'Montepremi', events:'Serate', wins:'Vittorie', top10:'Top 10', best:'Migliori risultati', titles:'Titoli', majors:'Major', lans:'LAN', weekly:'Finali settimanali', bad:'Questo link del profilo non funziona', season:'Stagione', div:'Divisione', age:'Età', none:'Ancora nessun titolo'},
  pt:{share:'Compartilhar perfil', copied:'Link do perfil copiado:', title:'Perfil da carreira', make:'Criar a tua carreira', close:'Fechar',
      earn:'Prêmios', events:'Noites', wins:'Vitórias', top10:'Top 10', best:'Melhores resultados', titles:'Títulos', majors:'Majors', lans:'LANs', weekly:'Finais semanais', bad:'Este link de perfil está quebrado', season:'Temporada', div:'Divisão', age:'Idade', none:'Ainda sem títulos'},
  de:{share:'Profil teilen', copied:'Profil-Link kopiert:', title:'Karriereprofil', make:'Eigene Karriere starten', close:'Schließen',
      earn:'Preisgeld', events:'Abende', wins:'Siege', top10:'Top 10', best:'Beste Ergebnisse', titles:'Titel', majors:'Majors', lans:'LANs', weekly:'Wochenfinals', bad:'Dieser Profil-Link ist kaputt', season:'Saison', div:'Division', age:'Alter', none:'Noch keine Titel'},
  es:{share:'Compartir perfil', copied:'Enlace del perfil copiado:', title:'Perfil de carrera', make:'Crea tu carrera', close:'Cerrar',
      earn:'Ganancias', events:'Noches', wins:'Victorias', top10:'Top 10', best:'Mejores resultados', titles:'Títulos', majors:'Majors', lans:'LAN', weekly:'Finales semanales', bad:'Este enlace de perfil está roto', season:'Temporada', div:'División', age:'Edad', none:'Aún sin títulos'}
};
function ccProfT(){ return CC_PROF_TX[(typeof LANG!=='undefined' && LANG)] || CC_PROF_TX.en; }
function ccProfileSnap(){
  const cr=CAREER.career, pl=CAREER.player, log=(cr.log||[]).filter(e=>e && e.place);
  const tr=careerTrophies();
  const best=log.filter(e=>e.of>1).slice().sort((a,b)=>(a.place/a.of)-(b.place/b.of) || a.place-b.place).slice(0, 5)
    .map(e=>({n:ccLockerPlain(ccLogName(e)), p:e.place, of:e.of, d:e.day}));
  let ovr=0; try{ ovr=Math.round((careerCard()||{})._ovr || pl.ovr || 0); }catch(e){ ovr=Math.round(pl.ovr||0); }
  return {v:1, n:pl.nick||pl.handle||'', c:pl.country||'', r:pl.region||'', o:ovr, role:pl.role||'', a:pl.age||0,
    org:(CAREER.org && CAREER.org.name)||'', y:cr.year||0, s:cr.season||1, dv:cr.division||0, e:Math.round(cr.earnings||0),
    ev:log.length, w:log.reduce((x,e)=>x+(e.wins||0), 0), t10:log.filter(e=>e.place<=10).length,
    tr:{m:tr.majors||0, l:tr.lans||0, wk:tr.weekly||0}, best, sk:(CAREER.fnEq && CAREER.fnEq.o) || ''};
}
const ccB64u=b=>{ let s=''; for(let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const ccB64uBytes=t=>{ const s=atob(String(t).replace(/-/g,'+').replace(/_/g,'/')); const b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b; };
async function ccProfileEncode(o){
  const raw=new TextEncoder().encode(JSON.stringify(o));
  if(typeof CompressionStream==='function'){
    const z=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
    return 'z'+ccB64u(new Uint8Array(z));
  }
  return 'j'+ccB64u(raw);
}
async function ccProfileDecode(t){
  const kind=t[0], bytes=ccB64uBytes(t.slice(1));
  let raw=bytes;
  if(kind==='z') raw=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  return JSON.parse(new TextDecoder().decode(raw));
}
async function ccProfileShare(){
  const T=ccProfT();
  let link='';
  try{ link=location.origin+location.pathname+'#profile='+(await ccProfileEncode(ccProfileSnap())); }catch(e){ return; }
  try{ await navigator.clipboard.writeText(link); }catch(e){}
  ccTell(T.copied+' '+link);
}
function ccProfileHTML(p){
  const T=ccProfT(), Lx=L();
  // Профиль приходит из ссылки (#profile=), то есть от кого угодно: числа только числами, образ только своим id.
  const N=x=>Math.round(Number(x)||0);
  const flag=p.c ? '<img src="flags/w40/'+esc(String(p.c).toLowerCase())+'.png" alt="" onerror="this.remove()">' : '';
  const role=p.role ? (Lx[p.role]||p.role) : '';
  const sk=p.sk && /^[a-z0-9_-]+$/i.test(String(p.sk)) ? '<img class="cc-prof-skin" src="'+esc(ccFnFull(p.sk))+'" alt="" onerror="this.remove()">' : '';
  const stat=(k,v)=>'<div class="cc-prof-st"><b>'+v+'</b><span>'+esc(k)+'</span></div>';
  const titles=[p.tr && p.tr.m ? stat(T.majors, N(p.tr.m)) : '', p.tr && p.tr.l ? stat(T.lans, N(p.tr.l)) : '', p.tr && p.tr.wk ? stat(T.weekly, N(p.tr.wk)) : ''].filter(Boolean).join('');
  const best=(p.best||[]).map(b=>'<li><b>#'+N(b.p)+'</b> '+esc(b.n)+(b.of ? ' <i>/ '+N(b.of)+'</i>' : '')+(b.d ? ' <em>'+esc(ccDayLabel(b.d))+'</em>' : '')+'</li>').join('');
  return '<div class="cc-prof-box">'+
    '<div class="cc-prof-head">'+sk+'<div class="cc-prof-id"><em>'+esc(T.title)+'</em><h2>'+flag+esc(p.n||'?')+'</h2>'+
      '<div class="cc-prof-sub">'+[role, p.org, p.r, p.a ? T.age+' '+p.a : ''].filter(Boolean).map(esc).join(' · ')+'</div>'+
      '<div class="cc-prof-sub">'+[p.y ? String(p.y) : '', T.season+' '+(p.s||1), p.dv ? T.div+' '+p.dv : ''].filter(Boolean).map(esc).join(' · ')+'</div></div>'+
      '<div class="cc-prof-ovr">'+(p.o ? N(p.o) : '')+'</div></div>'+
    '<div class="cc-prof-grid">'+stat(T.earn, '$'+ccNum(N(p.e)))+stat(T.events, N(p.ev))+stat(T.wins, N(p.w))+stat(T.top10, N(p.t10))+'</div>'+
    '<h4>'+esc(T.titles)+'</h4>'+(titles ? '<div class="cc-prof-grid">'+titles+'</div>' : '<p class="cc-prof-none">'+esc(T.none)+'</p>')+
    (best ? '<h4>'+esc(T.best)+'</h4><ol class="cc-prof-best">'+best+'</ol>' : '')+
    '<div class="cc-prof-btns"><button class="hero-btn hero-btn-go" onclick="ccProfileClose(true)"><span>'+esc(T.make)+'</span></button>'+
      '<button class="cc-back" onclick="ccProfileClose(false)">'+esc(T.close)+'</button></div></div>';
}
function ccProfileClose(make){
  const m=document.getElementById('ccProfileView'); if(m) m.remove();
  try{ history.replaceState(null, '', location.pathname+location.search); }catch(e){}
  if(make){ try{ careerStart(); }catch(e){} }
}
async function ccProfileOpenFromHash(){
  const h=String(location.hash||'');
  if(h.indexOf('#profile=')!==0) return;
  let p=null; try{ p=await ccProfileDecode(h.slice(9)); }catch(e){ p=null; }
  const box=document.createElement('div'); box.id='ccProfileView'; box.className='cc-prof';
  box.innerHTML=p && p.v===1 ? ccProfileHTML(p) : '<div class="cc-prof-box"><p>'+esc(ccProfT().bad)+'</p><div class="cc-prof-btns"><button class="cc-back" onclick="ccProfileClose(false)">'+esc(ccProfT().close)+'</button></div></div>';
  box.addEventListener('click', e=>{ if(e.target===box) ccProfileClose(false); });
  document.body.appendChild(box);
}
window.addEventListener('load', ()=>setTimeout(()=>{ try{ ccProfileOpenFromHash(); }catch(e){} }, 300));
window.addEventListener('hashchange', ()=>{ try{ if(!document.getElementById('ccProfileView')) ccProfileOpenFromHash(); }catch(e){} });
function careerTrophies(){
  const cr=(CAREER && CAREER.career) || {};
  const log=cr.log||[];
  const won=(kind, stage)=>log.filter(e=>e && e.place===1 && e.kind===kind &&
    (!stage || e.stage===stage)).length;
  const summit=won('summit','final'), paris=won('rc','final'), gc=won('globals');
  return {seats:(cr.ewc||[]).length, relFinals:won('reload','final'),
          lans:summit+paris+gc, summit:summit, paris:paris, globals:gc,
          majors:log.filter(e=>!e.who && ccFncsTitle(e)).length, weekly:won('final')};
}
/* ШКАФЧИК (17.10, его «10»): косметика за то, за что её дают в настоящем Fortnite — кирка чемпиона FNCS (Axe of Champions),
   спреи за победы, баннеры за гранд-финалы и ЛАНы. Выдаётся по журналу вечеров (cr.log) — ничего отдельно не копится,
   поэтому старые сейвы получают своё задним числом, молча (без постов); новые награды — с постом. */
const CC_LOCKER_ICON={pickaxe:'⛏️', glider:'☂️', spray:'🎨', banner:'🚩', emote:'🕺'};
function ccLockerPlain(s){ return String(s||'').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(); }
function ccLockerRules(e){
  const out=[], name=()=>ccLockerPlain(ccLogName(e));
  if(e.place===1 && (ccFncsTitle(e) || e.kind==='globals' || (e.kind==='summit' && e.stage==='final') || (e.kind==='rc' && e.stage==='final')))
  { // Notion «26.10.26», тестер: «if you win a major, a summit or a lan you get the fncs pickaxe, the 3.0 one» — за титул
    // всегда The Axe of Champions 3.0 (она и в руки); кирка чемпиона сезона ложится рядом, если это не она же.
    if(ccFncsAxeFor(e.day).id!==CC_FNCS_AXE3[0]) out.push({id:'axe', kind:'pickaxe', name:'Axe of Champions', fncs:true});
    out.push({id:'axe3', kind:'pickaxe', name:CC_FNCS_AXE3[1], fncs3:true}); }
  // Первая Victory Royale сезона — зонтик сезона (одна строка на сезон, см. ccUmbrellaFor).
  if((e.wins||0)>0) out.push({umb:true, kind:'glider'});
  if(e.kind==='major' && e.stage==='final') out.push({id:'gf'+e.season, kind:'banner', name:'FNCS Grand Finalist · '+ccSeasonYearOf(e.season)});
  if(e.lan) out.push({id:'lan|'+e.day, kind:'banner', name:name()});
  // Спреев нет (17.10, его «спрей шкафчика убери»).
  if(e.place===1 && e.kind==='victory' && e.fight) out.push({id:'fn', kind:'emote', name:'Fight Night Champion'});
  return out;
}
/* ЛОГОТИПЫ В ШКАФЧИКЕ (17.10, его «добавь в шкафчике логотипы»): у награды — арт турнира, за который она дана
   (тот же постер, что у события в календаре и ленте: ccEventArtOwn, иначе арт вида вечера), у клубов, где играл, —
   баннер с гербом клуба из logos/. */
function ccLockerArtOf(day, kind){
  try{
    const evs=(careerYearDays().get(day)||[]);
    const ev=evs.find(x=>x.kind===kind) || evs[0];
    const own=ev ? ccEventArtOwn(ev) : '';
    if(own) return own;
    if(kind==='victory'){ const v=careerVictoryOn(day); const a=v ? ccEventArtOwn(v) : ''; if(a) return a; }
  }catch(e){}
  return (typeof CAREER_EV_ART!=='undefined' && (CAREER_EV_ART[kind] || CAREER_EV_ART.cup)) || '';
}
function ccLockerClubs(){
  const cr=CAREER.career, names=(cr.orgs||[]).slice();
  if(CAREER.org && CAREER.org.name && names.indexOf(CAREER.org.name)<0) names.push(CAREER.org.name);
  return names.map(n=>({n, f:clubLogoFile(n)})).filter(c=>ccHasCrest(c.f))
    .map(c=>({id:'club|'+c.n, kind:'banner', name:c.n, logo:LOGO_DIR+c.f, club:true, now:!!(CAREER.org && CAREER.org.name===c.n)}));
}
function ccLockerCheck(){
  const cr=CAREER && CAREER.career; if(!cr || !cr.log) return;
  cr.locker=cr.locker||[];
  /* Сейв до 19.10 вечера: победы FNCS лежали одной строкой «Axe of Champions». Строка снимается, и журнал
     перечитывается заново молча — каждая победа даёт кирку своего сезона. */
  // Шкафчик целиком собирается из журнала, поэтому перечитывается с нуля — иначе баннеры посчитались бы дважды.
  if(cr.locker.some(x=>x.id==='axe')){ cr.locker=[]; cr.lockSeen=null; cr.lockAgain=true; }
  // Зонтики за победы до 20.10 — задним числом, молча (журнал уже прочитан, правило новое).
  if(!cr.umbScan){ cr.umbScan=1;
    cr.log.slice(0, cr.lockSeen||0).forEach(e=>{ if(!e || e.who || !((e.wins||0)>0)) return;
      const u=ccUmbrellaGive(e.day), id='umb|'+u.id;
      if(!cr.locker.some(x=>x.id===id)) cr.locker.push({id, kind:'glider', name:u.name, day:e.day, season:e.season, x:1, ek:e.kind, art:'', fn:u.id}); }); }
  // И старые посты «В шкафчике новое» и «Ты подарил …» из сохранённых карьер — вон из ленты (28.10).
  const noFeed=n=>n && (n.k==='ccNewsLocker' || n.k==='ccNewsFnGift');
  if(Array.isArray(cr.news) && cr.news.some(noFeed)) cr.news=cr.news.filter(n=>!noFeed(n));
  const quiet=cr.lockSeen==null || !!cr.lockAgain;
  const from=cr.lockSeen||0; if(from>=cr.log.length){ if(cr.lockSeen==null) cr.lockSeen=cr.log.length; delete cr.lockAgain; return; }
  for(let i=from;i<cr.log.length;i++){
    const e=cr.log[i]; if(!e || e.who) continue;
    ccLockerRules(e).forEach(g=>{
      // Победа в FNCS — кирка чемпиона того сезона: своя строка в шкафчике и в руках (см. ccFncsAxeFor).
      if(g.fncs){ const ax=ccFncsAxeGive(e.day, true); g={id:'axe|'+ax.id, kind:'pickaxe', name:ax.name, fn:ax.id}; }
      if(g.fncs3){ const ax=ccFncsAxeGive(e.day, quiet, true); g={id:'axe|'+ax.id, kind:'pickaxe', name:ax.name, fn:ax.id}; }
      if(g.umb){ const u=ccUmbrellaGive(e.day); g={id:'umb|'+u.id, kind:'glider', name:u.name, fn:u.id, once:true}; }
      const have=cr.locker.find(x=>x.id===g.id);
      if(have){ if(!g.once) have.x=(have.x||1)+1; return; }
      cr.locker.push({id:g.id, kind:g.kind, name:g.name, day:e.day, season:e.season, x:1, ek:e.kind, art:ccLockerArtOf(e.day, e.kind), fn:g.fn});
      // Поста в Медиа нет (28.10, его «про шкафчик ничего не надо в медиа писать»): награда видна в самом шкафчике.
    });
  }
  cr.lockSeen=cr.log.length; delete cr.lockAgain;
}
function ccLockerHTML(){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  try{ ccLockerCheck(); }catch(e){}
  const items=(cr.locker||[]).filter(it=>it.kind!=='spray').concat(ccLockerClubs()).sort((a,b)=>({pickaxe:0, glider:1, banner:2, emote:3, spray:4}[a.kind]-{pickaxe:0, glider:1, banner:2, emote:3, spray:4}[b.kind]));
  // Картинка: герб клуба; кирка поверх арта турнира; остальное — арт турнира со значком вида в углу.
  const ic=it=>{
    if(it.logo) return '<img class="cc-lock-logo" src="'+esc(it.logo)+'" alt="" loading="lazy" onerror="this.remove()">';
    const art=it.art || (it.day ? ccLockerArtOf(it.day, it.ek || (it.id==='wf' ? 'final' : it.id==='reload' ? 'reload' : it.id==='axe' ? 'major' : 'victory')) : '');
    // Кирка — на своём золотом фоне: на светлом постере Мейджора её не видно.
    const bg=(it.kind==='pickaxe' || it.kind==='glider') ? ' style="background:radial-gradient(circle at 50% 40%,#6b4d12,#241a06)"' : art ? ' style="background-image:url('+esc(art)+')"' : '';
    const top=it.fn ? '<img class="cc-lock-axe" src="'+ccFnImg(it.fn)+'" alt="" loading="lazy" onerror="this.remove()">'
      : it.kind==='pickaxe' && typeof CC_PICKAXE_ART!=='undefined'
      ? '<img class="cc-lock-axe" src="'+CC_PICKAXE_ART+'" alt="" loading="lazy">' : '<i>'+(CC_LOCKER_ICON[it.kind]||'🎁')+'</i>';
    return '<span class="cc-lock-art"'+bg+'>'+top+'</span>';
  };
  return ccFnLoadoutHTML()+'<div class="ch-tile cc-locker"><h4>'+L().ccLockerTitle+'</h4>'+(items.length
    ? '<div class="cc-locker-grid">'+items.map(it=>'<div class="cc-lock-it cc-lock-'+it.kind+'" title="'+esc(it.name)+'"><span class="cc-lock-ic">'+ic(it)+
        '</span><b>'+esc(it.name)+'</b><em>'+esc(it.club ? L().ccLockClub+(it.now ? ' · '+L().ccLockNow : '') : (L()['ccLock_'+it.kind]||it.kind))+(it.x>1 ? ' ×'+it.x : '')+'</em></div>').join('')+'</div>'
    : '<div class="ch-empty">'+L().ccLockerNone+'</div>')+'</div>';
}
function careerTrophiesHTML(){
  const t=careerTrophies();
  const row=(name, n)=>n>0 ? `<div class="ch-row"><em>${esc(name)}</em><b>${n}</b></div>` : '';
  const rows=row(L().ccEwcSeat, t.seats)+
             row(L().ccTroRelFinal, t.relFinals)+
             row(L().ccTroLan, t.lans)+
             row(L().chWkMajor, t.majors)+
             row(L().calWeeklyFinal, t.weekly);
  return `<div class="ch-tile"><h4>${L().ccTroTitle}</h4>${
    rows || `<div class="ch-empty">${L().ccTroNone}</div>`}</div>`;
}
/* ПЕРЕПИСКА С ТИММЕЙТОМ ЕСТЬ С ПЕРВОГО ДНЯ (его слово 7.10: «нет с тимейтом переписки когда начинаешь карьеру,
   когда уже тимейт есть»). Ветка заводилась только первым разговором, и закреп стоял пустым. Теперь, если
   напарник уже сидит рядом, а ветки нет, она открывается с его приветствием. Живого напарника (командная
   карьера, пара в гонке) не трогаем: за человека бот не пишет. */
function ccMateThreadEnsure(){
  try{
    if(!CAREER || !CAREER.career || ccMpOn()) return;
    if(typeof ccRacePairOn==='function' && ccRacePairOn()) return;
    const mate=careerPartnerCard(); if(!mate || !mate.handle || careerDmFind(mate.handle) || ccBlocked(mate.handle)) return;
    const t=careerMateThread(); if(!t || t.msgs.length) return;
    careerDmPush(t, 'them', 'dmMateHi');
    careerSave();
  }catch(e){}
}
/* ШТАБ В ЛИЧКЕ (его слово 8.10: «весь штаб у игрока ещё должен быть в закрепе и писать по теме»). Каждый нанятый —
   коуч, SMM, маркетолог, аналитик, психолог — получает свою ветку (менеджер уже со своей) и стоит в «Закреплено»
   после тиммейта и менеджера. Пишут только о своём и только по поводу:
     коуч      — разбор каждого сыгранного вечера (место, что подтянуть — самый слабый навык), раз в неделю — план;
     аналитик  — за 1–3 дня до турнира разбор лобби (кто опасен по PR), после вечера — среднее место и килы;
     психолог  — после провала (нижняя половина, без прохода) и после прохода; раз в две недели — как ты;
     SMM       — раз в неделю: сколько подписчиков пришло за неделю и сколько всего;
     маркетинг — когда появилось предложение спонсора, раз в две недели — какой бренд следующий и с какого числа.
   Всё из того, что режим уже знает (лог вечеров, PR, подписчики, спонсоры); новых чисел нет.
   Состояние — CAREER.staffDm[kind] = {who, logN, last, prep, reach, offer}. Бывший сотрудник уходит из закрепа. */
const CC_STAFF_DM_KINDS=['coach','analyst','psych','smm','mkt'];
function ccStaffDmPeople(){
  const out=[];
  try{
    const c=ccCoach(); if(c) out.push({kind:'coach', name:c.name, at:c.at||null, photo:c.photo||null});
    for(const k of ['analyst','psych']){ const m=ccStaff2(k); if(m) out.push({kind:k, name:m.name, at:m.at||null, photo:m.photo||null}); }
    const sm=ccSmm(); if(sm){ const row=(typeof ccSmmOf==='function' && ccSmmOf(sm.id))||sm; out.push({kind:'smm', name:row.name||sm.name, at:row.at||null, photo:row.photo||null}); }
    const mk=ccMkt(); if(mk){ const row=(typeof ccMktOf==='function' && ccMktOf(mk.id))||mk; out.push({kind:'mkt', name:row.name||mk.name, at:row.at||null, photo:row.photo||null}); }
  }catch(e){}
  return out.filter(p=>p.name).sort((a,b)=>CC_STAFF_DM_KINDS.indexOf(a.kind)-CC_STAFF_DM_KINDS.indexOf(b.kind));
}
/* ОТВЕТЫ СТАФФУ (17.10, его «может со стафом добавить варианты ответов и тд, как с тимейтом»). После каждой реплики
   стаффа — три ответа; выбранный пишется в ветку, стафф отвечает, и у части ответов есть небольшой эффект на то, что
   в игре уже есть: форма (cr.form, потолок CC_FORM_MAX), усталость (cr.grind → careerBurnout), охват (careerReachAdd).
   Эффект — раз в день на человека (ccStaffReplyDay), дальше ответ просто разговор. Размеры малые: шаг формы за вечер
   ±0.5–1, здесь +0.15–0.2. */
const CC_STAFF_OPTS={
  coach:  {drill:{form:0.15}, rest:{grind:1}, ok:{}},
  analyst:{vod:{form:0.15}, top:{}, ok:{}},
  kinch:  {vod:{form:0.1}, top:{}, ok:{}},
  psych:  {talk:{grind:1, form:0.1}, fine:{}, later:{}},
  smm:    {clip:{reach:0.006}, fans:{reach:0.003}, quiet:{}},
  mkt:    {more:{}, big:{}, ok:{}}
};
function ccStaffReplyDay(kind){ const cr=CAREER.career; cr.staffRe=cr.staffRe||{}; return cr.staffRe[kind]===careerToday(); }
function ccStaffReply(id, opt){
  const t=careerDms().find(x=>x.id===id);
  if(!t || !t.ask || !t.who || !t.who.staff) return;
  const kind=t.who.staff, fx=(CC_STAFF_OPTS[kind]||{})[opt];
  if(!fx) return;
  const cr=CAREER.career, today=careerToday();
  careerDmPush(t, 'you', 'dmStYou_'+kind+'_'+opt);
  if(!ccStaffReplyDay(kind)){
    if(fx.form) cr.form=clamp((cr.form||0)+fx.form, -CC_FORM_MAX, CC_FORM_MAX);
    if(fx.grind) cr.grind=Math.max(0, (cr.grind||0)-fx.grind);
    if(fx.reach) careerReachAdd(Math.max(20, Math.round((cr.reach||0)*fx.reach)));
    (cr.staffRe=cr.staffRe||{})[kind]=today;
  }
  careerDmPush(t, 'them', 'dmStRe_'+kind+'_'+opt);
  t.ask=null;
  if(kind==='kinch') cr.kinchNight=null;   // «спасибо» закрывает выбор разбора этого вечера
  careerSave(); careerRenderHub('social');
}
// Разбор Кинча по выбору (cr.kinchNight): игрок пишет, кого разобрать, Кинч отвечает блоком этого игрока.
function ccKinchPick(id, i){
  const t=careerDms().find(x=>x.id===id), kn=CAREER.career.kinchNight;
  if(!t || !kn || !kn.rows[i] || (kn.done||[]).indexOf(i)>=0) return;
  const cr=CAREER.career, r=kn.rows[i];
  careerDmPush(t, 'you', 'dmKinchYouAsk', [r[0]]);
  if(!ccStaffReplyDay('kinch')){ cr.form=clamp((cr.form||0)+CC_STAFF_OPTS.kinch.vod.form, -CC_FORM_MAX, CC_FORM_MAX); (cr.staffRe=cr.staffRe||{}).kinch=careerToday(); }
  careerDmPush(t, 'them', 'ccDmKinchOne', [kn.lbl, r]);
  (kn.done=kn.done||[]).push(i);
  careerSave(); careerRenderHub('social');
}
function ccStaffReplyHTML(open){
  const kind=open.who.staff, opts=CC_STAFF_OPTS[kind];
  if(!opts || !open.ask) return '';
  const kn=kind==='kinch' && CAREER.career.kinchNight;
  if(kn) return '<div class="dm-ask">'+kn.rows.map((r,i)=>(kn.done||[]).indexOf(i)>=0 ? '' :
      '<button class="cc-back" onclick="ccKinchPick(\''+open.id+'\','+i+')">'+esc(L().dmKinchYouAsk(r[0]))+'</button>').join('')+
    '<button class="cc-back" onclick="ccStaffReply(\''+open.id+'\',\'ok\')">'+esc(L().dmStBtn_kinch_ok)+'</button></div>';
  const used=ccStaffReplyDay(kind);
  return '<div class="dm-ask">'+Object.keys(opts).map(o=>{
    const fx=opts[o], tip=used ? '' : [fx.form ? L().dmStFxForm(fx.form) : '', fx.grind ? L().dmStFxRest : '', fx.reach ? L().dmStFxReach : ''].filter(Boolean).join(' · ');
    return '<button class="cc-back" onclick="ccStaffReply(\''+open.id+'\',\''+o+'\')"'+(tip ? ' title="'+esc(tip)+'"' : '')+'>'+esc(L()['dmStBtn_'+kind+'_'+o]||o)+'</button>';
  }).join('')+'</div>';
}
function ccStaffThreadOf(p, make){
  const have=careerDms().find(t=>t.who && t.who.staff===p.kind && hKey(t.who.handle)===hKey(p.name));
  if(have || !make) return have||null;
  const t=careerDmThread({handle:p.name, at:p.at, photo:p.photo, ovr:null, roster:false, staff:p.kind});
  t.state='staff';
  return t;
}
function ccStaffWeakAttr(strong){
  const a=(CAREER.player && CAREER.player.attrs)||{};
  const ks=ATTR_KEYS.filter(k=>typeof a[k]==='number');
  if(!ks.length) return '';
  ks.sort((x,y)=>strong ? a[y]-a[x] : a[x]-a[y]);
  return L()['attr'+ks[0][0].toUpperCase()+ks[0].slice(1)+'Full']||ks[0];
}
function ccStaffNextEvent(from, days){
  try{ const ev=careerEvents();
    for(let i=1;i<=days;i++){ const d=ccAddDays(from, i), on=(ev.get(d)||[]).filter(e=>e && e.kind && e.kind!=='gala');
      if(on.length) return {day:d, label:on[0].label||''}; } }catch(e){}
  return null;
}
/* ЛИЧНАЯ СТАТИСТИКА ВЕЧЕРА ОТ АНАЛИТИКА — В ДУХЕ KINCH (29.10, его «статистика как кинч, только личная»).
   По каждому из отряда: элиминации (zone-sim, кому засчитан килл), урон и полученный урон, время жизни, среднее место,
   топ-10, победы, очки. Элиминации, место, очки — из самих игр. Урон, полученный урон и время жизни движок не считает —
   это ОЦЕНКА по реплеям трёх финалов FNCS 2026 EU (tools/real-matches.json, 149 дуо): урон команды за игру
   ≈ 411 + 219·элим (r² 0,42) — игроку половина базы и 219 за свой килл; полученный урон и время жизни — средние по месту
   (место пересчитано на лобби из 50). Помечены «≈». Вечер без записи по игрокам — null, остаётся общее сообщение. */
const CC_KINCH_DMG_BASE=411, CC_KINCH_DMG_ELIM=219;
const CC_KINCH_BY_PLACE=[[1,1316,1232],[5,1260,1734],[10,1237,1668],[20,1134,1697],[35,969,1685],[99,355,714]];   // [до места, сек жизни, получено командой]
function ccKinchPlace(place, of){
  const p=of>0 ? Math.max(1, Math.round(place*50/of)) : place;
  return CC_KINCH_BY_PLACE.find(r=>p<=r[0]) || CC_KINCH_BY_PLACE[CC_KINCH_BY_PLACE.length-1];
}
function ccAnalystMe(day){
  const list=ccEveningPlayers(day);
  if(!list) return null;
  const T=L();
  return list.map(b=>T.dmStAnKinch(b.me ? T.dmStAnYou : '@'+b.h, b.el, ccNum(b.dmg), ccNum(b.took), b.alive, b.place, b.top10, b.wins, b.pts));
}
// Строки вечера по игрокам (ccEveningRows): ты первый, дальше по элимам. Общие для аналитика и личного разбора Кинча.
function ccEveningPlayers(day){
  if(!CC_EVENING || CC_EVENING.day!==day) return null;
  const rows=(CC_EVENING.rows||[]).filter(r=>r && Array.isArray(r.mk) && Array.isArray(r.who) && r.mk.length===r.who.length);
  if(!rows.length) return null;
  const by=new Map();
  rows.forEach(r=>{
    const n=r.who.length, pl=ccKinchPlace(r.place, r.of);
    r.who.forEach((h, i)=>{
      const k=hKey(h)||('#'+i);
      const b=by.get(k)||{h, me:!!r.me && hKey(h)===hKey(r.me), el:0, dmg:0, took:0, alive:0, games:0, place:0, top10:0, wins:0, pts:0};
      const e=r.mk[i]||0;
      b.el+=e; b.dmg+=CC_KINCH_DMG_BASE/2+CC_KINCH_DMG_ELIM*e; b.took+=pl[2]/2; b.alive+=pl[1];
      b.games++; b.place+=r.place; if(r.place<=10) b.top10++; if(r.place===1) b.wins++; b.pts+=r.pts||0;
      by.set(k, b);
    });
  });
  const list=[...by.values()];
  if(list.length<2) return null;
  list.sort((a,b)=>(b.me?1:0)-(a.me?1:0) || b.el-a.el);
  const mmss=sec=>Math.floor(sec/60)+':'+String(Math.round(sec%60)).padStart(2,'0');
  return list.map(b=>({h:b.h, me:b.me, el:b.el, dmg:Math.round(b.dmg/10)*10, took:Math.round(b.took/10)*10,
    alive:mmss(b.alive/b.games), place:(b.place/b.games).toFixed(1), top10:b.top10, wins:b.wins, pts:b.pts}));
}
function ccStaffDmTick(to){
  if(!CAREER || !CAREER.career) return;
  try{ if(ccMpOn()) return; }catch(e){}
  const cr=CAREER.career, log=cr.log||[], st=(CAREER.staffDm=CAREER.staffDm||{});
  const today=to||careerToday();
  const since=d=>d ? ccDaysBetween(d, today) : 99;
  for(const p of ccStaffDmPeople()){
    if(ccBlocked(p.name)) continue;
    const t=ccStaffThreadOf(p, true), rec=st[p.kind];
    const say=(key, args)=>{ careerDmPush(t, 'them', key, args); t.msgs[t.msgs.length-1].day=today; rec.last=today; };
    if(!rec || rec.who!==p.name){
      st[p.kind]={who:p.name, logN:log.length, last:today, reach:careerReach()};
      careerDmPush(t, 'them', 'dmStHi_'+p.kind); t.msgs[t.msgs.length-1].day=today;
      continue;
    }
    const fresh=log.length>rec.logN ? log[log.length-1] : null;
    rec.logN=log.length;
    if(p.kind==='coach'){
      if(fresh && fresh.place) say('dmStCoachNight', [fresh.place, fresh.of||0, ccStaffWeakAttr(false), ccStaffWeakAttr(true)]);
      else if(since(rec.last)>=7) say('dmStCoachWeek', [ccStaffWeakAttr(false)]);
    } else if(p.kind==='analyst'){
      const nx=ccStaffNextEvent(today, 3);
      if(fresh && fresh.place && fresh.avg!=null){
        say('dmStAnNight', [fresh.avg, fresh.elims||0, fresh.games||0]);
        const me=ccAnalystMe(fresh.day); if(me) me.forEach(line=>say('dmStAnMe', [line]));
      }
      else if(nx && rec.prep!==nx.day){ rec.prep=nx.day; const r=(typeof ccMateRival==='function') ? ccMateRival() : null;
        say(r ? 'dmStAnPrep' : 'dmStAnPrep0', [nx.label, ccDayLabel(nx.day), r ? r.name : '', r ? r.place : 0]); }
    } else if(p.kind==='psych'){
      if(fresh && ccMateBadNight(fresh)) say('dmStPsBad', [fresh.place]);
      else if(fresh && fresh.passed) say('dmStPsGood', []);
      else if(since(rec.last)>=14) say('dmStPsWeek', []);
    } else if(p.kind==='smm'){
      if(since(rec.last)>=7){ const now=careerReach(); say('dmStSmmWeek', [ccFollowers(Math.max(0, now-(rec.reach||0))), ccFollowers(now)]); rec.reach=now; }
    } else if(p.kind==='mkt'){
      const off=ccSponsorOffer(), T=L();
      if(off && rec.offer!==off.id){ rec.offer=off.id; say('dmStMktOffer', [T['ccSponsor'+off.id]||off.id, ccMoney(off.pay||0)]); }
      else if(since(rec.last)>=14){
        const next=CC_SPONSORS.find(b=>b.need>careerReach());
        say(next ? 'dmStMktWeek' : 'dmStMktTop', next ? [T['ccSponsor'+next.id]||next.id, ccFollowers(next.need)] : []);
      }
    }
  }
}
function careerSocialHTML(){
  ccMateThreadEnsure();
  try{ ccStaffDmTick(); }catch(e){}
  const threads=careerDms();
  // The one being read, or the first of whatever list is actually on screen -
  // falling back to threads[0] would open a club while the viewers tab is up.
  const inKind=t=>!CH_DMKIND || CH_DMKIND==='all' ||
    (t.who.org ? 'clubs' : t.who.hater ? 'haters' : t.who.fan ? 'fans' : 'duos')===CH_DMKIND;
  const open=threads.find(t=>t.id===CH_DM) || threads.filter(inKind)[0] || null;
  const pool=careerDmPool().filter(w=>!careerDmFind(w.handle));
  const mate=careerPartnerCard();

  const avatar=(who,px)=>{
    // An agent sits in the clubs pile because that is where the business is, but
    // he is a man and not a badge: no crest, the same initials circle a person
    // without a photo gets.
    if(who.staff) return `<span class="dm-av dm-av-txt" style="width:${px}px;height:${px}px;font-size:${Math.round(px*.42)}px">${
        who.photo ? `<img class="dm-av-photo" src="${PHOTO_DIR}${esc(who.photo)}" alt="" onerror="this.remove()">` : ''}${esc(String(who.handle||'').slice(0,2).toUpperCase())}</span>`;
    if(who.agent || who.viaAgent){
      // Off the roster by name, so a thread opened before the photo existed
      // gets it too. See ccAgentFace. A club thread relayed by a manager wears
      // his face, because he is the one in the conversation.
      const f=who.viaAgent ? who.viaAgent
            : ccAgentFace({name:who.handle, photo:who.photo, at:who.at});
      return `<span class="dm-av dm-av-txt" style="width:${px}px;height:${px}px;font-size:${Math.round(px*.42)}px">${
        f.photo ? `<img class="dm-av-photo" src="${PHOTO_DIR}${esc(f.photo)}" alt="" onerror="this.remove()">` : ''}${
        esc(String(ccDmName(who)||who.handle||'').slice(0,2).toUpperCase())}</span>`;
    }
    // A club is not a person: it wears its crest, square, the way it does on
    // every other screen — so the inbox reads at a glance as people and clubs.
    // Fortnite (письмо на Про-Ам) — не клуб: у него нет герба, есть ключ-арт сезона.
    if(who.epic) return `<img class="dm-av dm-av-epic" style="width:${px}px;height:${px}px" src="art/fncs-2026.jpg" alt="" onerror="this.replaceWith(document.createTextNode(''))">`;
    if(who.org) return careerCrestImg(who.handle, px, 'dm-av-crest') ||
                       careerCrestMono(who.handle, px, 'dm-av-crest');
    const url=who.roster ? photoURL({handle:who.handle, region:who.cardRegion||'EU'}) : null;
    return url ? `<img class="dm-av" style="width:${px}px;height:${px}px" src="${url}" alt="" onerror="this.replaceWith(document.createTextNode(''))">`
               : `<span class="dm-av dm-av-txt" style="width:${px}px;height:${px}px;font-size:${Math.round(px*.42)}px">${esc(who.handle.slice(0,2).toUpperCase())}</span>`;
  };

  /* The inbox used to be one pile: a club's contract, a duo's answer and a
     stranger's hello in the same list, sorted only by when they arrived. They
     are three different things and a player reads them for three different
     reasons, so the side splits into three — the clubs that want to sign you,
     the players who want to play with you, and the people who just watched.

     Fans are the new one, and they are deliberately the only threads with
     nothing to press: they arrive off results, they say what a stranger says
     after a good night, and the reply is that you read it. What they are for
     is the same thing the follower count is for — the size of the room. */
  // A viewer has no rating — they are not on the ladder, they are watching it —
  // so the row prints nothing where a player's number goes rather than "null".
  const line=t=>{
    const last=t.msgs[t.msgs.length-1];
    // The row is a button and the cross is a button, so the cross cannot sit
    // inside it — they are siblings under a wrapper, and the cross stops the
    // click before it reaches the row underneath.
    return `<div class="dm-line">
      <button class="dm-item${t===open?' on':''}${t.unread?' new':''}" onclick="careerDmOpen(\'${t.id}\')">
      ${avatar(t.who,34)}
      <span class="dm-item-in">
        <b>${esc(ccDmName(t.who))}${t.who.staff?`<em class="dm-tag-agent">${esc((L().ccStaffRole||{})[t.who.staff]||'')}</em>`
          :(t.who.agent||t.who.viaAgent)?`<em class="dm-tag-agent">${L().ccAgentTag}</em>`
          :t.who.epic?`<em class="dm-tag-org">${L().ccProAmEpicTag||'Epic'}</em>`
          :t.who.org?`<em class="dm-tag-org">${L().ccOrg}</em>`
          :`${t.who.ovr!=null?`<i>${t.who.ovr}</i>`:''}${hKey(t.who.handle)===hKey(mate&&mate.handle)?`<em>${ccSay('dmDuo')}</em>`:''}`}</b>
        <span>${last?esc(ccText(last)):''}</span>
      </span></button>
      <button class="dm-x" title="${esc(L().dmClose)}" aria-label="${esc(L().dmClose)}"
        onclick="event.stopPropagation();careerDmClose('${t.id}')">×</button>
    </div>`;
  };
  // Which pile a conversation belongs in, read off what it is rather than
  // stored: a club thread carries an org, a fan thread is marked when it is
  // written, and everything else is somebody who plays.
  const pile=t=>(t.who.org || t.who.staff) ? 'clubs' : t.who.hater ? 'haters' : t.who.fan ? 'fans' : 'duos';
  const groups={duos:[], clubs:[], fans:[], haters:[]};
  threads.forEach(t=>groups[pile(t)].push(t));
  /* ЗАКРЕП (его слово 7.10: «пусть в личке закреп будет: тимейт, менеджер»). В «Все» переписки с тиммейтами и
     со своим менеджером стоят первыми отдельным блоком и ниже не повторяются; во вкладках разделов — на своих местах. */
  const pinMates=careerMates().filter(Boolean).map(m=>hKey(m.handle));
  const pinAgent=careerAgent() ? hKey(careerAgent().name) : null;
  const pinStaff=ccStaffDmPeople().map(p=>p.kind+'|'+hKey(p.name));
  const pinRank=t=>{ if(!t.who) return -1; const k=hKey(t.who.handle), i=pinMates.indexOf(k);
    if(i>=0) return i; if(t.who.agent && pinAgent && k===pinAgent) return 10;
    const j=t.who.staff ? pinStaff.indexOf(t.who.staff+'|'+k) : -1; return j>=0 ? 20+j : -1; };
  const pinned=threads.filter(t=>pinRank(t)>=0).sort((a,b)=>pinRank(a)-pinRank(b));
  const dmOnly=CH_DMKIND && CH_DMKIND!=='all' ? CH_DMKIND : null;
  const section=(key, extra)=>{
    const list=dmOnly ? groups[key] : groups[key].filter(t=>pinRank(t)<0);
    const rows=list.map(line).join('');
    if(!rows && !extra) return '';
    return `<div class="dm-side-h">${L()['dmSec'+key]}${
      list.some(t=>t.unread) ? '<i class="dm-sec-dot"></i>' : ''}</div>`+
      (rows || `<div class="ch-empty dm-sec-empty">${L()['dmSecEmpty'+key]}</div>`)+(extra||'');
  };

  /* Four inboxes behind one, and a row of tabs to say which.

     The side column stacked all four piles one under the other, which is the
     right answer for a career with six conversations and the wrong one for a
     career with fourteen: the clubs are at the top, the viewers are somewhere
     below the fold, and finding the one hater who wrote last night means
     scrolling past everybody who wants to play with you.

     So each pile is its own list, reachable on its own, with its own count and
     its own dot - and ALL is still there and still first, because most of the
     time the whole thing is short and one list is the right shape for it. */
  const CC_DM_KINDS=['clubs','duos','fans','haters'];
  // Clubs and viewers keep their tab even when empty: a club not writing is
  // the transfer window being shut and an audience not writing is not having
  // one yet, and both of those are things a player needs told rather than left
  // to notice. A hater pile with nothing in it is genuinely nothing.
  const CC_DM_ALWAYS={clubs:1, fans:1};
  const tabs=`<div class="dm-tabs">`+
    [['all', threads]].concat(CC_DM_KINDS.map(k=>[k, groups[k]]))
      .filter(([k, list])=>k==='all' || list.length || CC_DM_ALWAYS[k])
      .map(([k, list])=>`<button class="dm-tab${(CH_DMKIND||'all')===k?' on':''}"
        onclick="careerDmKind(\'${k}\')">${k==='all' ? L().dmSecall : L()['dmSec'+k]}
        <em>${list.length}</em>${list.some(t=>t.unread)?'<i></i>':''}</button>`).join('')+
    `</div>`;

  const thread = open ? `
    <div class="dm-head">${avatar(open.who,40)}
      <div><b>${esc(ccDmName(open.who))}</b>
        <span>${open.who.staff
          ? [(L().ccStaffRole||{})[open.who.staff]||'', open.who.at ? '@'+open.who.at : ''].filter(Boolean).join(' · ')
          : open.who.agent
          ? [L().ccAgentTag, open.who.at ? '@'+open.who.at : ''].filter(Boolean).join(' · ')
          : open.who.org
          ? `${L().ccOrg}${open.offer ? ' · '+(open.offer.academy?L().ccAcademy:L().ccMainRoster) : ''} · 👥 ${ccOrgFolText(ccOrgFollowers(open.who.handle, open.offer && open.offer.tier))}`
          : open.who.hater ? L().dmSechaters
          : open.who.fan ? L().dmSecfans
          : [L()[open.who.role]||'', L().ccRoOvr+' '+open.who.ovr,
             (()=>{ const a=ccAgeShown(open.who.handle); return a ? L().ccYearsOld(a) : ''; })(),
             '👥 '+ccFollowText(open.who.handle, open.who.ovr),
             ccDuoFormLabel(open.who.handle),
             open.who.club ? esc(open.who.club) : '',
             ccPayLabel(open.who.pay)].filter(Boolean).join(' · ')}</span></div>
      ${open.who.staff ? '' : `<button class="ch-decline dm-head-block" onclick="careerDmBlock(\'${open.id}\')"
        title="${esc(L().dmBlockWhat)}">${L().dmBlock}</button>`}
    </div>
    <div class="dm-msgs">${open.msgs.map(m=>
      `<div class="dm-msg dm-${m.from}"><span>${esc(ccText(m))}</span>
        <i>${ccStamp(m)}</i></div>`).join('')}</div>
    ${open.state==='org' && open.offer ? `<div class="dm-foot dm-offer">
        <div class="dm-offer-terms">
          <!-- Герб клуба на самом предложении. Правка: «пусть
               когда оргу предлагают, рядом логотип был орги, чтоб понятно
               было» — в списке диалогов герб стоял, а в карточке условий, где
               решение и принимается, клуб был назван только словами. -->
          <span class="dm-offer-club">${clubLogoHTML(open.offer.name || (open.who && open.who.org) || '', true)}${
            esc(open.offer.name || (open.who && open.who.org) || '')}</span>
          <span>${ccMoney(open.offer.salary)}${L().ccPerSeason}</span>
          ${(f=>`<span title="${f.est ? esc(L().ccOrgFansEst) : ''}">👥 ${ccOrgFolText(f)} · ${esc(L().ccOrgSignRow(ccFollowers(ccOrgMediaSign(open.offer.name, open.offer.tier, open.offer.academy))))} · ${esc(L().ccOrgMediaRow(ccNum(ccOrgMediaMonth(open.offer.name, open.offer.tier, open.offer.academy))))}</span>`)(ccOrgFollowers(open.offer.name, open.offer.tier))}
          <span>${L().ccOrgBonusRow}: ${ccMoney(careerOrgBonusFor(open.offer.salary))}</span>
          <span>${open.offer.academy?L().ccAcademy:L().ccMainRoster}</span>
          ${open.offer.duo ? `<span class="ch-perk">${careerSquadSize()===3?L().ccOfferDuoT:L().ccOfferDuo}</span>` : ''}
          ${open.offer.perk ? `<span class="ch-perk">${L()['ccPerk'+open.offer.perk]}</span>` : ''}
          <span>${L().lfCut}: ${Math.round((open.offer.cut!=null ? open.offer.cut : careerOrgCutFor(open.offer.tier))*100)}%</span>
          ${open.offer.signBonus ? `<span class="ch-perk">${L().ccSignBonusRow}: ${ccMoney(open.offer.signBonus)}</span>` : ''}
          <span>${careerOrgGoalText(open.offer.goal)}</span>
          ${open.offer.until ? `<span class="dm-until">${L().ccOfferUntil(ccDayLabel(open.offer.until))}</span>` : ''}</div>
        ${open.pending
          ? `<div class="dm-asked">${L().ccAskWaiting(ccDayLabel(open.pending.due))}</div>`
          : (open.asks||0)>=CC_ASK_MAX
          ? `<div class="dm-asked">${L().ccAskedAlready}</div>`
          : `<div class="dm-ask dm-ask-neg"><div class="dm-ask-row"><em>${L().ccAskMoneyLbl}</em>
              ${['small','fair','hard'].map(sz=>`<button class="cc-back" onclick="careerAskMore(\'${open.id}\',\'${sz}\')"
                title="${esc(L().ccAskOdds(careerAskOdds(open.offer, open.asks||0, CC_ASK_SIZES[sz].odds, open.lever)))}">${L()['ccAsk_'+sz]}</button>`).join('')}</div><div class="dm-ask-row"><em>${L().ccAskTermsLbl}</em>
              ${(open.offer.cut!=null ? open.offer.cut : careerOrgCutFor(open.offer.tier))>0 ? `<button class="cc-back" onclick="careerAskCut(\'${open.id}\')"
                title="${esc(L().ccAskOdds(careerAskOdds(open.offer, open.asks||0, 0.9, open.lever)))}">${L().ccAskCut}</button>` : ''}
              ${open.offer.signBonus ? '' : `<button class="cc-back" onclick="careerAskBonus(\'${open.id}\')"
                title="${esc(L().ccAskOdds(careerAskOdds(open.offer, open.asks||0, 1.1, open.lever)))}">${L().ccAskBonus}</button>`}
              ${!open.lever && ccAskLeverOrg(open) ? `<button class="cc-back" onclick="careerAskLever(\'${open.id}\')" title="${esc(L().ccAskLeverWhat)}">${L().ccAskLever}</button>` : ''}
              ${open.offer.perk ? '' : `<button class="cc-back" onclick="careerAskPerk(\'${open.id}\')"
                title="${esc(L().ccAskOdds(careerAskOdds(open.offer, open.asks||0)))}">${L().ccAskPerk}</button>`}
            </div>${open.thought ? '' : `<div class="dm-ask-row"><em>${L().ccAskTimeLbl}</em><button class="cc-back" onclick="careerAskThink(\'${open.id}\')"
                title="${esc(L().ccAskThinkWhat(ccThinkOdds(open)))}">${L().ccAskThink}</button></div>`}</div>`}
        <button class="ch-sign" onclick="careerSignFromDm(\'${open.id}\')">${L().ccSign}</button>
      </div>`
      : open.who.hater ? `<div class="dm-foot dm-foot-hate">
          <span>${open.answered ? L().dmAnswered : L().dmHateFoot}</span>
          <div class="dm-ask">
            ${open.answered ? '' : `<button class="cc-back" onclick="careerHaterReply(\'${open.id}\')"
              title="${esc(L().dmClapbackWhat)}">${L().dmClapbackBtn}</button>`}
          </div>
        </div>`
      : open.who.staff ? `<div class="dm-foot dm-foot-hate dm-foot-staff">${ccStaffReplyHTML(open) || `<span>${esc(L().dmStaffFoot)}</span>`}<button class="cc-back" onclick="careerTab('club')">${esc(L().ccStaffTitle)}</button></div>`
      : open.who.fan ? `<div class="dm-foot dm-foot-hate">
          <span>${open.thanked ? L().dmThanked : open.q ? L().dmFanFootQ : L().dmFanFoot}</span>
          ${open.thanked ? '' : `<button class="cc-back" onclick="careerFanThank(\'${open.id}\')"
            title="${esc(open.q ? L().dmAnswerWhat : L().dmThanksWhat)}">${
            open.q ? L().dmAnswerBtn : L().dmThanksBtn}</button>`}
        </div>`
      /* Разговор с напарником: четыре темы, каждая из чего-то записанного.
         Просьба. Настрой двигает careerTalkMove, дня не
         тратит — см. careerMateTalk. */
      : (careerPartnerCard() && hKey(open.who.handle)===hKey(careerPartnerCard().handle))
        ? `<div class="dm-foot dm-foot-mate">
            <span>${esc(L().dmMateFoot)}</span>
            ${open.state==='headsup' ? `<div class="dm-asked">${esc(L().dmHeadsUpHint)}</div><div class="dm-ask"><button class="ch-sign" onclick="careerMateHeadsUp(true)">${esc(L().dmHeadsUpStayBtn)}</button><button class="cc-back" onclick="careerMateHeadsUp(false)">${esc(L().dmHeadsUpGoBtn)}</button></div>` : ''}
            ${open.revAsk ? `<div class="dm-asked">${esc(L().dmRevHint)}</div><div class="dm-ask">${['support','analyze','blame'].map(x=>`<button class="cc-back" onclick="careerMateReview('${x}')">${esc(L()['dmRevBtn_'+x])}</button>`).join('')}</div>` : ''}
            ${open.planAsk ? `<div class="dm-asked">${esc(L().dmPlanHint)}</div><div class="dm-ask">${['aggr','zone'].map(x=>`<button class="cc-back" onclick="careerMatePlanSet('${x}')">${esc(L()['dmPlanBtn_'+x])}</button>`).join('')}</div>` : ''}
            ${careerMateTopics().length ? '' : `<div class="dm-asked">${esc(L().dmMateTalkDone)}</div>`}
            <div class="dm-ask">${careerMateTopics().map(k=>
              `<button class="cc-back" onclick="careerMateTalk(\'${k}\')"
                 title="${esc(L()['dmMateWhat'+k])}">${esc(L()['dmMateBtn'+k])}</button>`).join('')}</div>
          </div>`
      /* Действия менеджера — только в диалоге ТОГО менеджера, который на тебя
         работает. Раньше здесь стояло просто «есть менеджер?», и чужое письмо
         показывало терминал твоего: его проценты, его «попросить найти клуб» и
         кнопку разорвать контракт — в переписке с человеком, который тебе
         никто. Правка: «пусть не пишут, когда есть менеджер». */
      : open.who.agent ? (careerAgent() && hKey(careerAgent().name)!==hKey(open.who.handle)
          ? `<div class="dm-foot dm-foot-done">${L().ccAgentHave}</div>`
        : careerAgent()
          ? `<div class="dm-foot dm-offer">
              <div class="dm-offer-terms"><span>${esc(L().ccAgentOn(careerAgent().name))}</span>
                <span>${esc(L().ccAgentTerms(Math.round(careerAgentTerms().cut*100),
                                             careerAgentTerms().reach))}</span></div>
              <!-- Попросить менеджера самому написать клубам. Правка: «дать возможность не только читать от менеджера
                   орги, но и самому попросить менеджера написать организатору,
                   чтоб подписали игрока». Пока просьба в работе — кнопки нет,
                   вместо неё строка о том, до какого числа он ходит. -->
              ${careerPitchOn()
                ? `<div class="dm-asked">${esc(careerPitchClub()||'')} — ${L().ccPitchOn(ccDayLabel(careerPitchDue()))}</div>`
                : (careerPitchClubs().length
                    ? `<button class="cc-back dm-pitch-open" title="${esc(L().ccPitchWhat)}"
                        onclick="ccClubPickOpen(\'${open.id}\')">${L().ccPitchBtn}</button>`
                    : '')}
              <button class="ch-decline" onclick="careerEndAgentFromDm(\'${open.id}\')">${L().ccAgentEnd}</button>
            </div>`
          : `<div class="dm-foot dm-offer">
              <div class="dm-offer-terms"><span>${esc(L().ccAgentTerms(
                Math.round(ccAgentTermsOf(open.who).cut*100), ccAgentTermsOf(open.who).reach))}</span></div>
              <button class="ch-sign" onclick="careerSignAgentFromDm(\'${open.id}\')">${L().ccAgentSign}</button>
            </div>`)
      : open.sponsor ? `<div class="dm-foot dm-offer">
          <div class="dm-offer-terms"><span>${ccMoney(open.sponsor.pay)}${L().ccPerStream}</span>
            <span>${L().ccSponsorSlot}</span></div>
          <button class="ch-sign" onclick="careerSignSponsorFromDm(\'${open.id}\')">${L().ccSign}</button>
        </div>`
      : open.state==='leaving' ? (()=>{
          // The seat used to empty between one cup and the next. This is the
          // conversation that happens instead, and it has a price on each line.
          const ways=careerMateKeepable(open);
          if(!ways.length) return `<div class="dm-foot dm-foot-done">${L().dmKeepNothing}</div>`;
          return `<div class="dm-foot">
            <div class="dm-asked">${L().dmKeepHint(careerPatience())}</div>
            <div class="dm-ask">${ways.map(w=>`<button class="cc-back"
              onclick="careerMateKeep('${open.id}','${w}')"
              title="${esc(L()['dmKeep'+w+'What'])}">${L()['dmKeep'+w+'Btn']}</button>`).join('')}</div>
          </div>`; })()
      : open.state==='partner' ? `<div class="dm-foot dm-foot-done">${L().dmIsDuo}</div>`
      : open.pending ? `<div class="dm-foot dm-foot-done">${L().dmWaiting(ccDayLabel(open.pending.due))}</div>`
      /* A club with nothing on the table is a club with nothing on the table.

         His screenshot, 17 August, with the buttons ringed in red: BIG had
         withdrawn its offer, and the thread was offering "let's play a scrim"
         and "show them the result". Those are the arguments you make to a person
         who turned down playing with you - the chain below has no branch for an
         organisation, so a club whose offer expired fell through into the duo
         conversation, and the last line of it offers to ask them to be your
         partner. A club is not a duo and never was. */
      /* Кроме ветки Про-Ама: её пишет клуб-хозяин площадки, но на столе у него
         не контракт, а приглашение — свои кнопки ниже. */
      : (open.who.org || open.who.brand) && !open.proam
        ? `<div class="dm-foot dm-foot-done">${L().dmOfferGone}</div>`
      : open.state==='cond' ? `<div class="dm-foot"><div class="dm-asked">${L()[open.cond==='role' ? 'dmCondRoleHint' : 'dmCondTrialHint']}</div>
          <div class="dm-ask"><button class="ch-sign" onclick="careerDmCond('${open.id}', true)">${L()[open.cond==='role' ? 'dmCondRoleBtn' : 'dmCondTrialBtn']}</button>
          <button class="cc-back" onclick="careerDmCond('${open.id}', false)">${L().dmCondNoBtn}</button></div></div>`
      : open.state==='declined' ? (()=>{
          // A no is a starting position, and what is left to say is on the
          // buttons rather than in a paragraph.
          const args=careerDmArgs(open);
          if(!args.length) return `<div class="dm-foot dm-foot-done">${L().dmDeclined}</div>`;
          return `<div class="dm-foot">
            <div class="dm-asked">${L().dmArgLeft(CC_DM_ARGS-(open.args||0))}</div>
            <div class="dm-ask">${args.map(a=>`<button class="cc-back"
              onclick="careerDmArgue('${open.id}','${a}')"
              title="${esc(L()['dmArg'+a+'What'])}">${L()['dmArg'+a+'Btn']}</button>`).join('')}</div>
          </div>`; })()
      : open.proam
        /* Ветка Про-Ама живёт по своим кнопкам: сначала «поеду / не в этот
           раз», потом выбор напарника из тех, кто едет. Правка.
           Список закрывается, как только человек выбран, — менять уже нельзя,
           это ответ организатору, а не настройка. */
        ? (()=>{ const inv=careerProAmInv(ccProAmThreadLabel(open));
            if(!inv || inv.state==='no') return `<div class="dm-foot dm-foot-done">${L().dmProAmDone}</div>`;
            if(inv.state==='sent') return `<div class="dm-foot"><div class="dm-ask">
              <button class="ch-sign" onclick="careerProAmYes('${open.id}')">${L().dmProAmGo}</button>
              <button class="cc-back" onclick="careerProAmNo('${open.id}')">${L().dmProAmSkip}</button>
            </div></div>`;
            if(inv.mate) return `<div class="dm-foot dm-foot-done">${
              esc(L().dmProAmWith(inv.mate))}</div>`;
            return `<div class="dm-foot">
              <div class="dm-asked">${L().dmProAmChoose}</div>
              <div class="dm-ask dm-ask-wide dm-ask-creators">${careerProAmPickList().map(n=>{
                const f=ccProAmFollowers(n), av=ccProAmAvatar(n);
                return `<button class="cc-back" onclick="careerProAmPick('${open.id}','${esc(n)}')">${
                  av ? `<img class="dm-pick-ava" src="${esc(av)}" alt="" onerror="this.remove()">` : ''}<span>${
                  esc(n)}${f?`<i>${ccNum(f)}</i>`:''}</span></button>`; }).join('')}</div>
            </div>`; })()
      : open.msgs.some(m=>m.from==='them') &&
        (open.state==='offer' || careerDmWouldAccept(open.who))
        ? (()=>{
            /* Письмо в состав ДРУГОГО формата (сквад-кап в дуо-год, t.fmt): садится в CAREER.rosters[fmt], пара года не
               трогается — значит ни «слот уйдёт команде ниже», ни «Взять в дуо» (Notion 12.10: «когда сквад кеш кап, а
               сезон дуо… пишет, что можно только позвать в дуо»). Кнопка — «Взять в состав», сколько мест осталось. */
            if(open.fmt && open.fmt>1 && open.fmt!==careerSquadSize()){
              const have=ccFmtRoster(open.fmt).length;
              return `<div class="dm-foot"><div class="dm-asked">${esc(L().ccFmtSeatLeft(ccFmtWord(open.fmt), Math.max(0, open.fmt-1-have)))}</div>
                <button class="ch-sign" onclick="careerDmAccept(\'${open.id}\')">${L().dmTakeItt}</button></div>`;
            }
            const held=(careerPartnerCard() && careerMates().filter(Boolean).length>=careerMateSeats()) ? careerSlotHeld() : null;
            // The button still works. What it costs is written over it, because
            // this is the one press in the mode that gives a qualification away.
            // And the other button: closing a thread only deleted it, and the
            // next week the same person wrote the same hello — a player asked
            // for a real block, 20 August. This one is remembered.
            /* Упёрлись в одну роль на двоих — здесь стоит выбор, а не тупик.
               Кто именно сядет в недостающую роль, решает игрок: попросить его
               (он может отказаться) или пересесть самому. См. careerDmAccept,
               careerDmRoleTheirs, careerDmRoleMine. */
            if(open.roleFix) return `<div class="dm-foot">
              <div class="dm-asked">${L().dmRoleNeed(L()[open.roleFix]||'')}</div>
              <div class="dm-ask">
                <button class="cc-back" onclick="careerDmRoleTheirs(\'${open.id}\')">${
                  L().dmRoleAskHim}</button>
                ${open.roleMineOk!==false ? `<button class="cc-back" onclick="careerDmRoleMine(\'${open.id}\')">${
                  L().dmRoleTakeIt(L()[open.roleFix]||'')}</button>` : ''}
                ${open.roleMineOk===false && open.roleMate && open.roleMate.swap ? `<button class="cc-back" onclick="careerDmRoleReplace(\'${open.id}\')">${
                  L().dmRoleReplace(esc(ccHandle(open.roleMate.handle)))}</button>` : ''}
              </div></div>`;
            /* Не в пару, а в другой формат года (отзыв игрока: «может, в дуо он не нужен, а в трио да») — ответить
               письмом «трио?/сквад?», как из поиска: тот же careerDmWrite с форматом. Только где формат ещё впереди и
               в его составе есть место. */
            const other=[2,3,4].filter(f=>f!==careerSquadSize() && (typeof ccFormatNext!=='function' || ccFormatNext(f))
              && ccFmtRoster(f).length<f-1 && !ccFmtRoster(f).some(r=>hKey((ccMateCardOf(r)||{}).handle||'')===hKey(open.who.handle)));
            return `<div class="dm-foot">${held ? `<div class="dm-asked">${
              L().ccSlotLoseHint(careerPartnerCard().handle, held.what)}</div>` : ''}
              <div class="dm-ask"><button class="ch-sign" onclick="careerDmAcceptAsk(\'${open.id}\')">${ccSay('dmTakeIt')}</button>${
              other.map(f=>`<button class="cc-back" onclick="careerDmWrite('${jsq(open.who.handle)}', null, ${f})">${L()[ccSquadKey('dmAskBtn', f)]}</button>`).join('')}</div></div>`; })()
        : `<div class="dm-foot"><button class="ch-sign" onclick="careerDmWrite('${jsq(open.who.handle)}', null, ${open.fmt||'null'})">${L()[ccSquadKey('dmAskBtn', open.fmt)]}</button></div>`}`
    : `<div class="ch-empty">${L().dmPickThread}</div>`;

  /* And why everybody writing to you is worse than you.

     A career far above its rung sees a list capped at what that rung holds -
     a 96 in Division 3 is offered 75s and down, because anybody better than
     that is not in Division 3. Which is right, and reads as broken unless it is
     said out loud. */
  /* Подсказка про ступень держится ровно до тех пор, пока список в неё
     упирается. Он больше не упирается — потолок идёт за игроком (см.
     ccDmLadderPool), — и говорить «выше 61 здесь никого нет», показывая
     восьмидесятых, значило бы врать на своём же экране. */
  const overRung=false;
  const looking=`<div class="dm-side-h">${ccSay('dmLooking')}</div>`+
    (overRung ? `<div class="ch-hint dm-over">${
      L().dmOverRung(CAREER.career.division, ccDivCeil(CAREER.career.division))}</div>` : '')+
    (ccDmAsksLeft()<=0 && pool.length ? `<div class="ch-hint dm-over">${esc(L().ccDuoLimit)}</div>` : '')+
    pool.slice(0,6).map(w=>`<button class="dm-item dm-new" onclick="careerDmWrite('${jsq(w.handle)}')">
      ${avatar(w,30)}
      <span class="dm-item-in"><b>${esc(w.handle)}<i>${w.ovr}</i></b>
      <span>${[L()[w.role]||'', w.club ? esc(w.club) : L().ccFreeAgent]
                .filter(Boolean).join(' · ')}</span>
      ${(()=>{ const f=ccDuoFormLabel(w.handle);
        // How the season is going for them, which is what anybody picking a
        // partner actually looks at.
        return f ? `<span class="dm-item-form">${f}</span>` : ''; })()}
      ${w.pay ? `<span class="dm-item-pay">${ccPayLabel(w.pay)}</span>` : ''}
      </span></button>`).join('');
  // Haters get no heading until there is one — a career nobody has written
  // anything unkind to does not need a box saying nobody has.
  /* Why the clubs are quiet, said where the quiet is.

     A club not writing has three reasons and the mode knew all of them and told
     nobody: the transfer window is shut, the rating is under what anybody signs
     at, or you are already on a roster. The screenshot that produced this was a
     96 in Division 3 in February with an empty inbox and no way to find out
     that clubs simply do not sign in February. */
  const clubsWhy=(()=>{
    if(groups.clubs.length) return '';
    if(CAREER.org) return `<div class="ch-empty dm-sec-empty">${L().dmClubsSigned(esc(CAREER.org.name))}</div>`;
    if(!careerWindowNow())
      return `<div class="ch-empty dm-sec-empty">${
        L().ccWindowShut(ccDayLabel(careerWindowNext()||CC_YEAR_TO))}</div>`;
    const pl=CAREER.player;
    const band=ccWageDiv(pl.ovrExact!=null?pl.ovrExact:pl.ovr);
    if(band && CC_WAGE_CAP.hasOwnProperty(band) && !CC_WAGE_CAP[band])
      return `<div class="ch-empty dm-sec-empty">${L().ccFreeAgentHint}</div>`;
    return '';
  })();
  const only=CH_DMKIND && CH_DMKIND!=='all' ? CH_DMKIND : null;
  const inbox=`<div class="dm-wrap">
    <div class="dm-side">
      ${tabs}
      ${!only && pinned.length ? `<div class="dm-side-h dm-side-pin">📌 ${L().dmSecPinned}${pinned.some(t=>t.unread) ? '<i class="dm-sec-dot"></i>' : ''}</div>`+pinned.map(line).join('') : ''}
      ${!only || only==='clubs' ? section('clubs', clubsWhy) : ''}
      ${!only || only==='duos' ? section('duos', looking) : ''}
      ${!only || only==='fans' ? section('fans') : ''}
      ${(only==='haters' || (!only && groups.haters.length)) ? section('haters') : ''}
      ${(()=>{
        /* И список тех, кого ты выключил.

           Блокировка была односторонней дверью: заблокировал — и всё, назад
           хода нет и списка нет, так что и вспомнить некого. Просьба. Раздел появляется только когда в нём кто-то есть —
           пустая рубрика «заблокированные» ничего не сообщает. */
        const list=ccBlockedList();
        if(!list.length || (only && only!=='all')) return '';
        return `<div class="dm-side-h">${L().dmSecblocked}</div>`+
          list.map(b=>`<div class="dm-line dm-line-blocked">
            <button class="dm-item dm-blocked" disabled>
              <span class="dm-av dm-av-txt" style="width:30px;height:30px;font-size:13px">${
                esc(String(ccBlockedName(b)).slice(0,2).toUpperCase())}</span>
              <span class="dm-item-in"><b>${esc(ccBlockedName(b))}${
                b && b.agent ? `<em class="dm-tag-agent">${L().ccAgentTag}</em>` : ''}</b>
              <span>${L().dmBlockedSub}</span></span></button>
            <button class="dm-x dm-unblock" title="${esc(L().dmUnblock)}"
              onclick="careerDmUnblock('${jsq(ccBlockedKey(b))}')">${L().dmUnblock}</button>
          </div>`).join('');
      })()}
    </div>
    <div class="dm-thread">${thread}</div>
  </div>`;

  // Two halves of one screen rather than two screens. The centre keeps a strip
  // of the last few headlines, which is a glance; the whole feed lives here,
  // where there is room to read it, next to the messages it is mostly about.
  const unread=threads.some(t=>t.unread);
  // Which half opens first, until the player says otherwise. A message waiting
  // is the only thing on this screen that is addressed to them, and the dot on
  // the tab above promised it — landing on the feed instead makes the player
  // hunt for what the dot was about.
  const view=CH_SOCIAL || (unread ? 'dms' : 'feed');
  const me=CAREER.player;
  const meHandle=ccHandle(me.nick);
  const rail=(id, label, icon, dot)=>
    `<button class="x-nav${view===id?' on':''}" onclick="careerSocialTab(\'${id}\')">`+
    `${icon}<span>${label}</span>${dot?'<i></i>':''}</button>`;

  // Who is worth writing to, in the shape X puts beside a feed. The list is the
  // one the inbox already draws from, so nobody appears here that you could not
  // actually message.
  /* Подписка — решение игрока, а не режима: правка («подписки
     зависят от самого игрока, он сам жмёт»). Кнопка здесь и есть это решение;
     написать человеку можно из его же поста и из поиска дуо. */
  /* И из других регионов. Игрок: «it would be a good
     idea if we could follow people from nac while being EU». Ряд кодов регионов
     над списком: свой — те же люди, что и в инбоксе; чужой — верх его ростера
     (ccAwaySuggest). Подписка та же, профиль по нику открывается из любого
     региона, а посты приходят по воскресеньям — см. careerRegionsWeek. */
  const homeReg=ccCareerRegion();
  const sugReg=(CH_SUG_REG && CH_SUG_REG!==homeReg && CC_REGIONS.indexOf(CH_SUG_REG)>=0) ? CH_SUG_REG : null;
  let sugList=sugReg ? ccAwaySuggest(sugReg) : pool.slice(0,4);
  /* Онлайн напарник — первым в своём регионе (Notion 21.10: «своего друга нельзя добавить в друзья в твиттере»). */
  if(!sugReg && ccMpOn() && typeof MP!=='undefined' && MP.peer && MP.peer.handle){
    const ph=MP.peer.handle, pa=attrsFor(MP.peer)||{};
    sugList=[{handle:ph, ovr:Math.round(pa.ovr||MP.peer.rating||0), nat:MP.peer.nat, role:pa.roleKey}]
      .concat(sugList.filter(w=>hKey(w.handle)!==hKey(ph))).slice(0, 4);
  }
  const sugRows=sugList.map(w=>{
    const h=jsq(w.handle);
    return `<div class="x-sug">${avatar(w,32)}
      <span class="x-sug-in"><b>${esc(w.handle)}</b><span>${
        sugReg ? esc(regionName(sugReg)) : (L()[w.role]||'')} · ${w.ovr}</span></span>
      ${ccFollowing(w.handle)
        ? `<button class="x-follow on" onclick="careerUnfollow(\'${h}\')">${L().ccFollowingBtn}</button>`
        : `<button class="x-follow" onclick="careerFollow(\'${h}\')">${L().ccFollowBtn}</button>`}
    </div>`;}).join('');
  const sugChips=`<div class="x-sug-regs">${[homeReg].concat(CC_REGIONS.filter(r=>r!==homeReg)).map(r=>
    `<button class="x-sug-reg${(sugReg||homeReg)===r?' on':''}" title="${esc(regionName(r))}"`+
    ` onclick="careerSugRegion(\'${esc(r)}\')">${esc(ccRegShort(r))}</button>`).join('')}</div>`;
  const suggest=sugChips+(sugRows || `<div class="ch-empty">${L().dmEmpty}</div>`);
  /* Уведомления — третий экран рельса. Лайки на своих постах и те, кто
     подписался: и то и другое приходит само, и на второе можно ответить
     подпиской. См. careerNotesTick. */
  const notes=careerNotes();
  // Как в X: кто и сколько ещё, дата, кусок самого поста и его картинка.
  // См. careerNoteRowHTML (скриншот уведомлений X).
  const notesHTML=`<div class="ch-tile x-notes"><h4>${L().ccNotesTab}</h4>${
    notes.length ? notes.map(careerNoteRowHTML).join('')
                 : `<div class="ch-empty">${L().ccNotesEmpty}</div>`}</div>`;

  // A profile is an account, not a stat sheet: who you are, how many people read
  // you, and everything you have posted. The counts sit under the name the way
  // they do on the real thing, and following is simply the people you have
  // written to — there is nobody else on this network you could follow.
  const mine=(CAREER.career.news||[]).filter(n=>ccPostAuthor(n).you);
  // Your own face, the same one your posts carry: an uploaded portrait, or the
  // photo off the card you took. The initials stay underneath for when there
  // is neither, and for when the file fails to load.
  const meUrl=photoURL(me.photo ? {_photo:me.photo} : careerCard());
  const meAv=cls=>`<span class="x-av x-av-you ${cls}">`+
    (meUrl ? `<img src="${meUrl}" alt="" onerror="this.remove()">` : '')+
    `${esc(me.nick.slice(0,2).toUpperCase())}</span>`;
  const profile=`<div class="ch-tile x-profile">
    <div class="x-profile-head">
      ${meAv('x-av-big')}
      <div><b>${esc(me.nick)}</b><span>@${esc(meHandle)}</span>
        <span class="x-bio">${CAREER.org?esc(CAREER.org.name)+' · ':''}${careerTopHonour() ? careerTopHonour()+' · ' : ''}${L().ccDivision} ${CAREER.career.division} · ${L().ccRoOvr} ${ccMyShownOvr()}</span>
        <div class="x-bio-own" id="xBioOwn">${ccBioOwnHTML()}</div></div>
    </div>
    <div class="x-counts">
      <span><b>${ccFollowers(careerReach())}</b>${L().xFollowers}</span>
      <!-- Подписки — это те, на кого ты подписался сам. Здесь стояло число
           диалогов: пока подписок в моде не было, счётчик набивали перепиской.
           Правка: «когда фоловишься, не прибавляется к фоловкам
           человек». Теперь считает ровно тех, кого добавил кнопкой. -->
      <span><b>${ccFollows().length}</b>${L().xFollowing}</span>
      <span><b>${mine.length}</b>${L().xPosts}</span>
      <span><b>${ccMoney(CAREER.career.earnings||0)}</b>${L().chEarnings}</span>
      ${ccRelMySeats(CAREER.career).length
        ? `<span class="x-lanq"><b>✓</b>${esc(L().ccLanQual(ccLanCity('rc', CAREER.career.season)))}</span>` : ''}
    </div>
    <div class="x-timeline">${mine.length
      ? mine.map(n=>ccPostHTML(n)).join('')
      : `<div class="ch-empty">${L().xNoPosts}</div>`}</div>
  </div>`;

  /* The composer, and it only ever writes one thing.

     A feed you can only read is a scoreboard. This is the one post a career
     actually needs to make, and it is above the timeline where the box that
     asks what is happening lives on the real thing — with the seat empty,
     because that is the only time it has anything to say. */
  const lfdBox = mate ? '' : `<div class="ch-tile x-compose">
    <div class="x-compose-in">${meAv('')}
      <div class="x-compose-txt"><b>${ccSay("ccLfdTitle")}</b><span>${L().ccLfdWhat}</span></div>
      ${careerLfdOn()
        ? `<span class="x-compose-on">${esc(L().ccLfdOnUntil(ccDayLabel(careerLfdUntil())))}</span>`
        : `<button class="ch-sign" onclick="careerLfdPost()">${L().ccLfdBtn}</button>`}
    </div>
  </div>`;

  /* И своя строка, какой угодно.

     Просьба. До неё лента была витриной: каждый пост под своим
     ником написан кем-то другим — режимом, который отчитывался о твоём вечере
     твоими же словами. Это то же поле, в которое пишут на настоящем сайте:
     двести сорок знаков, счётчик и кнопка. Пост попадает в ленту и в профиль,
     считается в «Постах» и собирает те же лайки и просмотры, что остальные, —
     их считает ccPostStats по охвату, и охват от строки не растёт: аудиторию
     приносят результаты, а не то, что о них написали. */
  const own=`<div class="ch-tile x-compose x-compose-own">
    ${CC_QUOTE ? `<div class="x-quoting">${L().ccQuoting}
        <button class="x-act" onclick="careerQuoteCancel()">${L().ccQuoteDrop}</button></div>` : ''}
    <div class="x-compose-in">${meAv('')}
      <textarea class="x-compose-box" id="ccPostBox" rows="2" maxlength="${CC_POST_MAX}"
        placeholder="${esc(CC_QUOTE ? L().ccQuotePh : L().ccPostWhat)}" oninput="ccPostLeft()"></textarea>
    </div>
    ${CC_QUOTE ? ccQuoteHTML({q:CC_QUOTE}) : ccPostIdeasHTML()}
    <div class="x-compose-foot">
      <span class="x-compose-left" id="ccPostLeft">${CC_POST_MAX}</span>
      <button class="ch-sign" onclick="careerPostWrite()">${L().ccPostBtn}</button>
    </div>
  </div>`;

  return `<div class="x-wrap">
    <nav class="x-rail">
      ${rail('feed', L().ccFeedTab, CC_X_HOME)}
      ${rail('notes', L().ccNotesTab, CC_X_LIKE, careerNotesNew()>0)}
      ${rail('dms', L().dmTabTitle, CC_X_CHAT, unread)}
      ${rail('me', L().xProfile, CC_X_USER)}
      <div class="x-me">
        ${meAv('')}
        <span class="x-me-in"><b>${esc(me.nick)}</b><span>@${esc(meHandle)}</span></span>
      </div>
    </nav>
    <main class="x-main">
      ${view==='dms' ? inbox
        : view==='notes' ? notesHTML
        : view==='me' ? profile
        : view==='who' ? careerWhoHTML(CH_WHO)
        /* У ленты есть шапка — как «Home» над таймлайном у X, и в ней же
           переключатель «всё / подписки»: подписка должна что-то менять, иначе
           кнопка ничего не значит. Его пункт 2, 3 сентября. */
        : own+lfdBox+`<div class="ch-tile ch-feedfull">
            <h4>${L().ccFeedTab}</h4>
            <div class="nh-tabs">
              <button class="nh-tab${CH_FEED==='all'?' on':''}" onclick="careerFeedMode(\'all\')">${
                L().ccFeedAll}</button>
              <button class="nh-tab${CH_FEED==='subs'?' on':''}" onclick="careerFeedMode(\'subs\')">${
                L().ccFeedSubs}</button>
            </div>
            ${careerFeedHTML()}</div>`}
    </main>
    <aside class="x-side">
      ${ccTrendsHTML()}
      ${careerTrophiesHTML()}
      ${careerCollectionHTML()}
      <div class="ch-tile">
        <h4>${ccSay('dmLooking')}</h4>
        ${suggest}
      </div>
      ${(()=>{
        /* Друзья — его пункт 10 со страницы «ы», 22 августа: «дать возможность
           кинуть запрос... предложить поиграть 1 на 1, тратится энергия и
           прибавляется скилл, в конце пишется счёт». Запрос кидается из поиска
           дуо (careerFriendAsk), список живёт здесь, 1на1 — двадцать энергии,
           счёт до пяти, четверть скрима скилла в случайный боевой стат. */
        const fr=(CAREER.career.friends||[]);
        return `<div class="ch-tile"><h4>${L().ccFriends}</h4>
          ${fr.length ? fr.map(h=>`<div class="ch-row"><em>${esc(h)}</em>
              <b><button class="cc-job-h" onclick="careerFriend1v1('${jsq(h)}')">1v1 · 20⚡</button></b></div>`).join('')
            : `<div class="ch-empty">${ccSay('ccFriendsNone')}</div>`}
        </div>`;
      })()}
    </aside>
  </div>`;
}
/* Друг — из любого региона (Notion 12.10: «не получается добавлять друзей из другого региона»). Поиск дуо
   показывает людей всех семи регионов, а запрос и 1на1 искали человека только в ростере своего — по чужому
   клику ничего не происходило. Теперь свой ростер, а не нашёлся — карточка по нику (ccWhoCard). */
function ccFriendCard(handle){
  return careerRosterNowEU().find(x=>x.handle===handle) || ccWhoCard(handle) || null;
}
function careerFriendAsk(handle){
  const cr=CAREER.career;
  cr.friends=cr.friends||[];
  if(cr.friends.indexOf(handle)>=0) return;
  const who=ccFriendCard(handle);
  if(!who) return;
  // Дружба проще места в составе: та же арифметика согласия, но с запасом.
  CAREER.dmBoost=10;
  const yes=careerDmMargin({handle:who.handle, ovr:(attrsFor(who)||{}).ovr})>=0;
  CAREER.dmBoost=0;
  if(yes){
    cr.friends.push(handle);
    careerNews('good', 'ccNewsFriendYes', [ccHandle(handle)]);
  } else {
    careerNews('flat', 'ccNewsFriendNo', [ccHandle(handle)]);
  }
  careerSave();
  if(typeof ccDuoFindRender==='function' &&
     document.getElementById('duoFindModal') &&
     document.getElementById('duoFindModal').style.display!=='none') ccDuoFindRender(true);
}
function careerFriend1v1(handle){
  const cr=CAREER.career, pl=CAREER.player;
  if(careerDayClosed() || careerEnergy()<20) return;
  const who=ccFriendCard(handle);
  if(!who) return;
  careerSpend(20);
  const mine=pl.ovrExact!=null?pl.ovrExact:pl.ovr;
  const theirs=(attrsFor(who)||{}).ovr||70;
  const rnd=careerRng(ccHashStr('1v1|'+(cr.season||1)+'|'+careerToday()+'|'+hKey(who)));
  const p=clamp(0.5+(mine-theirs)*0.03, 0.08, 0.92);
  let a=0, b=0;
  while(a<5 && b<5){ if(rnd()<p) a++; else b++; }
  const k=['aim','clu','con'][Math.floor(rnd()*3)];
  if(!pl.attrs) pl.attrs=ccOwnAttrs();
  if(pl.attrs) pl.attrs[k]=clamp((pl.attrs[k]||50)+0.15, 35, 99);
  cr.did=cr.did||{};
  cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat('1v1');
  careerNews(a>b?'good':'flat', 'ccNews1v1', [ccHandle(handle), a, b]);
  careerSave();
  careerRenderHub('social');
}
let CH_SOCIAL=null, CH_DMKIND=null;
function careerSocialTab(t){
  CH_SOCIAL=t;
  // Открытые уведомления считаются прочитанными — как и лента.
  if(t==='notes'){ careerNoteMarkSeen(); careerSave(); }
  careerRenderHub('social');
}
/* Which inbox is open. Opening one does not open a thread in it: the list is
   what was asked for, and picking off it is the next decision. The thread on
   screen stays if it belongs to the pile, so switching to CLUBS while reading a
   club does not close it. */
function careerDmKind(k){
  CH_DMKIND = (k==='all') ? null : k; CH_SOCIAL='dms';
  const open=careerDms().find(t=>t.id===CH_DM);
  if(open && CH_DMKIND){
    const pile=open.who.org ? 'clubs' : open.who.hater ? 'haters'
             : open.who.fan ? 'fans' : 'duos';
    if(pile!==CH_DMKIND) CH_DM=null;
  }
  careerRenderHub('social');
}
/* Changing your duo means talking to somebody, so the button goes to the inbox
   rather than emptying the seat here. Dropping a partner with nobody lined up
   used to mean a stranger was handed to you before the next cup, which is not a
   decision but a shuffle; now it means no cup at all until somebody is in the
   seat — see careerNoMate — so the inbox is even more the place to start. */
/* Everyone in your region you can write to, not just the inbox shortlist from careerDmPool.
   Division 1 is the real roster; below it the generated ladder (same gate as ccRealNamesHere),
   capped by the division ceiling and CC_GEN_TOP. Writing still goes through careerDmWrite. */
const CC_DUO_SEARCH_GEN=48;
/* any — весь регион, без ролевого сита. Список на экране показывает ту
   половину, которой команде не хватает, но написать можно и мимо него: беседа
   открывается кем угодно, а посадить второго ИГЛа всё равно не даст
   careerDmAccept. */
function careerDuoSearchPool(any){
  // Everybody already in the squad, not merely the first seat: a trio's second
  // partner stood in this list and could be written to for a duo. See ccMyPeople.
  const mine=ccMyPeople();
  /* Недостающая половина — сверху, но в списке все.
   *
   * Здесь стояло сито: показывать только ту роль, которой команде не хватает.
   * Оно и было правилом от 21 августа, и держалось на том, что позвать «не ту»
   * половину было некуда — разговор упирался в строку «кто-то из нас должен
   * пересесть», из которой не было выхода.
   *
   * Выход появился (careerDmRoleTheirs, careerDmRoleMine), и вместе с ним ушла
   * причина прятать людей: написать теперь можно кому угодно, а кто именно
   * пересядет — вопрос, который задают в разговоре. Правка:
   * «поиск нужно всех игроков, там только противоположная роль».
   *
   * Порядок остался прежним по смыслу: тот, кого можно посадить прямо сейчас,
   * идёт первым, остальные под ним. */
  const want=any ? null : ccSeatRolePreferred(CC_DUO_SEAT);
  /* По рейтингу, нужная роль — только при равном (его скрин 29.09: «я 99, а выбрать могу максимум 90»): роль стояла
     первым ключом, и 120 строк списка кончались на ИГЛах 85–90, а фраггеры 91–96 уходили за край. */
  const byWant=(a,b)=>b.ovr-a.ovr || (want ? (a.role===want?0:1)-(b.role===want?0:1) : 0);
  if(ccRealNamesHere()){
    /* Регион поиска (его отзыв 30.09, скрин: «не могу забрать игрока с Азии на EU»): список стоял на
       сцене своего региона, и человека из другого найти было негде. Свой — по умолчанию, остальные —
       выбором в шапке поиска (ccDuoFindReg). Регион карточки едет в запись состава (cardRegion). */
    const reg=ccDuoRegNow();
    const scene=reg===ccCareerRegion() ? careerRosterNowEU() : ccSceneRoster(reg);
    return scene.filter(p=>!mine.has(hKey(p)))
      .map(p=>({handle:p.handle, ovr:p._ovr!=null?p._ovr:attrsFor(p).ovr, nat:p.nat,
                role:attrsFor(p).roleKey, roster:true, card:p, cardRegion:p.region||reg,
                club:p.org||null, pay:0}))
      .sort(byWant);
  }
  // Below Division 1 the ladder is generated, so the list is generated with it —
  // once per season and day-independent, so the same names are there tomorrow.
  const cr=CAREER.career, ceil=ccDivCeil(cr.division);
  const band=Math.min(CAREER.player.ovr, ceil);
  const rnd=careerRng(ccHashStr('duosearch|'+cr.season+'|'+cr.division));
  const taken=new Set([...mine]);
  const out=[];
  for(let i=0;i<CC_DUO_SEARCH_GEN;i++){
    const off=(i/(CC_DUO_SEARCH_GEN-1))*20-13;
    const ovr=clamp(Math.round(band+off), 35, Math.min(ceil, ccGenTop()));
    const card=careerLadderPlayer(rnd, ovr, taken);
    out.push({handle:card.handle, ovr, nat:card.nat, role:attrsFor(card).roleKey,
              roster:false, card, club:null, pay:0});
  }
  // Тот же порядок, что и у роастера выше: правило одно на оба списка.
  return out.sort(byWant);
}
// The search list, filtered by whatever is typed into it.
let CC_DUO_Q='';
/* Порядок списка: по рейтингу (как было) или по PR — «поиск тиммейта по ярну/пр/плейсам»
   (игрок, страница «bags 13.09»). PR — единственное из трёх, что карьера ведёт по
   каждому человеку (careerPrRows); призовые и места ботов она не пишет. */
/* По умолчанию — БЛИЗКИЕ ПО РЕЙТИНГУ (его скрин 1.10: «я 62, а мне предлагают 96 — пусть предлагают с
   меньшим»). Список шёл сверху по рейтингу и резался на 120 строк, так что 62-й видел одних 90+. Теперь
   первыми — игроки твоего уровня (ближе к своему рейтингу, при равенстве — сильнее), а «рейтинг» и «PR»
   остались кнопками. */
let CC_DUO_SORT='near';
function ccDuoFindSort(v){ CC_DUO_SORT=(v==='pr' ? 'pr' : v==='ovr' ? 'ovr' : 'near'); ccDuoFindRender(); }
/* Роль в списке (Telegram 22.10: «невозможно найти 3 или 4 в трио и скваде», «все иглят»). Список показывает всех,
   и рядом с твоим рейтингом ИГЛов почти две трети (2025: 566 из 917): ИГЛ в составе уже есть, и каждое письмо
   упиралось в «кто-то из нас должен пересесть». Теперь окно открывается на роли, которой не хватает
   (ccSeatRoleWanted), а «все» — одной кнопкой рядом. '' — все. */
let CC_DUO_ROLE='';
function ccDuoFindRole(v){ CC_DUO_ROLE=(v==='roleIGL' || v==='roleFRG') ? v : ''; ccDuoFindRender(); }
/* Отбор по флагу. Пусто — все; иначе код страны, как его знает FLAG_CODE.
   Живёт рядом с сортировкой и сбрасывается там же, где строка поиска. */
let CC_DUO_NAT='', CC_DUO_NAT_OPEN=false;
// Регион поиска: '' — свой. Сбрасывается при открытии окна, как строка поиска.
let CC_DUO_REG='';
function ccDuoRegNow(){
  const own=ccCareerRegion();
  const ok=(typeof ccYearRegions==='function' ? ccYearRegions() : CC_REGIONS)||[];
  return (CC_DUO_REG && ok.indexOf(CC_DUO_REG)>=0) ? CC_DUO_REG : own;
}
function ccDuoFindReg(r){ CC_DUO_REG=String(r||''); CC_DUO_NAT=''; CC_DUO_NAT_OPEN=false; ccDuoFindRender(); }
function ccDuoFindNat(v){ CC_DUO_NAT=(String(v||'')===CC_DUO_NAT) ? '' : String(v||''); ccDuoFindRender(); }
// Код страны человека из списка: в карточках лежит НАЗВАНИЕ страны, не код.
function ccDuoNatCode(w){
  const n=(w && (w.nat || (w.card && w.card.nat))) || '';
  return n ? String(FLAG_CODE[n] || '').toLowerCase() : '';
}
/* The chair the search was opened from, if it was opened from one. Null is "any
   chair", which is what the day panel means when it says the squad is a player
   short — there, the player has not picked anybody to lose. */
let CC_DUO_SEAT=null;
/* Поиск и для состава другого формата (его слово 29.09: «сразу выбирается игрок, нет переговоров
   в лс»): fmt — размер состава капа (3 трио, 4 сквад). Письмо несёт его на ветке (t.fmt), и согласившийся
   садится в CAREER.rosters[fmt], не трогая состав года. См. careerDmAccept. */
let CC_DUO_FMT=null;
function ccDuoFindOpen(seat, fmt){
  if(fmt && fmt>1 && fmt!==careerSquadSize() && typeof ccFmtOpenFrom==='function' && ccFmtOpenFrom(fmt)) return;   // сбор ещё не открыт
  CC_DUO_FMT=(fmt && fmt>1 && fmt!==careerSquadSize()) ? fmt : null;
  /* Третья дверь к взятому напарнику — «кому написать». В командной карьере
     она открыта ровно настолько, насколько открыты кресла для взятых: в дуо
     не открывается совсем, в трио — пока третий не сел. См. careerSeatDm. */
  /* Открыта ОБОИМ: третий садится только на два «да» (ccMpThirdAsk), так что
     предложить его может любой из двоих — раньше список молча не открывался
     у второго в лобби, и если роли перепутались, то и у владельца. */
  /* Замена взятого в команде: кнопка под его карточкой называет кресло (seat 1+, кресло 0 занято напарником-человеком), и
     поиск открывается, хотя свободных кресел нет. Раньше открывался только для пустого кресла, и «Найти нового» молчал. */
  const mpSwap=ccMpOn() && typeof seat==='number' && seat>=1 && ccMpBotSeats()>0 && !!ccMpMateRecs()[seat-1];
  if(ccMpOn() && !mpSwap && !(fmt && fmt>2 && CC_MP_FMT_ON && fmt!==careerSquadSize()) && ccMpMateRecs().length >= ccMpBotSeats()){
    // Не молча (Telegram 22.10): в команде состав другого формата добирается филлом на вечер — так и сказать.
    try{ if(fmt && fmt>2 && CC_MP_FMT_ON && L().roMpFill) ccTell(L().roMpFill(fmt-2)); }catch(e){}
    return;
  }
  CC_DUO_Q=''; CC_DUO_NAT=''; CC_DUO_NAT_OPEN=false; CC_DUO_REG=''; CC_DUO_SORT='near'; CC_DUO_PAIRS=false;
  CC_DUO_SEAT=(typeof seat==='number' && seat>=0 && seat<careerMateSeats()) ? seat : null;
  CC_DUO_ROLE='';
  try{ if(!CC_DUO_FMT) CC_DUO_ROLE=ccSeatRoleWanted(CC_DUO_SEAT)||''; }catch(e){}
  ccDuoFindRender();
  document.getElementById('duoFindModal').style.display='flex';
  document.addEventListener('keydown', ccDuoFindKey);
  const f=document.getElementById('duoFindQ'); if(f) f.focus();
}
function ccDuoFindClose(){
  const m=document.getElementById('duoFindModal');
  if(m) m.style.display='none';
  // A chair is only chosen for as long as the search that chose it is open. Left
  // set, the next search opened from the day panel would quietly aim at it.
  CC_DUO_SEAT=null; CC_DUO_FMT=null;
  document.removeEventListener('keydown', ccDuoFindKey);
}
function ccDuoFindKey(e){ if(e.key==='Escape') ccDuoFindClose(); }
function ccDuoFindQ(v){ CC_DUO_Q=String(v||''); ccDuoFindRender(true); }
// Read the seat before closing, because closing is what clears it.
function ccDuoFindWrite(handle){ const seat=CC_DUO_SEAT, fmt=CC_DUO_FMT; ccDuoFindClose();
  if(fmt && typeof ccMpOn==='function' && ccMpOn()){ ccMpFmtPickAsk(fmt, handle); return; }
  careerDmWrite(handle, seat, fmt); }
/* Состав другого формата В КОМАНДЕ (22.10): третьего (и четвёртого) на трио/сквад-капы выбирают ОБА — один зовёт,
   второй отвечает; садят оба на одном и том же событии 'fmtpick-ok' (эхо приходит и тому, кто звал), и выбор уезжает
   ключом команды cr.fmtPick. На вечере выбранные — первыми, филл — на остаток (ccMpFmtBegin). */
function ccMpFmtPickAsk(f, handle){
  if(typeof MP==='undefined' || !MP.act) return;
  if(CC_MP_THIRD_WAIT) CC_MP_THIRD_WAIT();
  CC_MP_THIRD_WAIT=ccMpWaitBox(L().ccMpThirdWait);
  MP.act('fmtpick', {f:f, h:String(handle||''), by:ccMpId()});
}
function ccMpFmtPickApply(f, h){
  const cr=CAREER && CAREER.career; if(!cr || !h || !(f>2)) return;
  const fp=cr.fmtPick=Object.assign({}, cr.fmtPick||{}), k=hKey(h);
  fp[f]=(fp[f]||[]).filter(x=>hKey(x)!==k).concat([String(h)]).slice(-(f-2));
  careerSave();
  try{ if(document.getElementById('chBody')) careerRenderHub(CH_TAB); }catch(e){}
}
/* ---- Попроситься третьим к готовой паре ------------------------------------
   Игрок, Notion «05» (5.10): «for trios, you could go to the other two people
   instead of one person necessarily having to come to you». До этого трио
   собиралось только к тебе: звал по одному, а пара сама писала «нужен третий»
   (careerFmtSeatDms). Теперь в поиске трио есть вид «Пары» — дуо своей сцены, у
   которых третьего нет или он слабее тебя, — и кнопка «Попроситься третьим».
   Пара отвечает той же арифметикой, что одиночка (careerDmMargin против её
   среднего рейтинга), плюс CC_TRIO_THIRD_PULL, если третий у неё уже есть. Да —
   садятся оба (в состав формата — через t.fmtPair, в состав трио-года — оба
   кресла), их бывший третий свободен (cr.trios). В игре вдвоём и в гонке вида
   нет: состав там общий и решается рукопожатием (ccMpThirdAsk). */
let CC_DUO_PAIRS=false;
function ccDuoPairsOn(){
  if(!CAREER || !CAREER.career) return false;
  if(typeof ccMpOn==='function' && ccMpOn()) return false;
  if(typeof ccRaceOn==='function' && ccRaceOn()) return false;
  if(!ccRealNamesHere()) return false;
  const f=CC_DUO_FMT || careerSquadSize();
  return f===3;
}
function ccDuoFindView(v){ CC_DUO_PAIRS=(v==='pairs'); ccDuoFindRender(); }
function ccJoinMeOvr(){
  const pl=CAREER.player;
  return Math.round(pl.ovrExact!=null ? pl.ovrExact : pl.ovr);
}
// Пары своей сцены, к которым можно попроситься. Третий — из cr.trios (трио-год).
function ccJoinPairs(){
  if(!ccDuoPairsOn()) return [];
  let duos=[];
  try{ duos=(careerPools()||{}).duos||[]; }catch(e){ return []; }
  const mine=ccMyPeople(), me=ccJoinMeOvr();
  const trios=(careerSquadSize()===3 && CAREER.career.trios) || {};
  const out=[], seen=new Set();
  duos.forEach(d=>{
    const cs=(d.cards||[]).filter(Boolean);
    if(cs.length<2) return;
    const a=cs[0], b=cs[1];
    const key=cs.map(c=>hKey(c)).sort().join('+');
    if(seen.has(key)) return; seen.add(key);
    if(mine.has(hKey(a)) || mine.has(hKey(b))) return;
    if(ccBlocked(a.handle) || ccBlocked(b.handle)) return;
    const thirdK=trios[key] || null;
    const third=thirdK ? ccWhoCard(thirdK) : null;
    if(third && mine.has(hKey(third))) return;
    const tOvr=third ? Math.round(ccCardOvr(third)) : null;
    if(third && tOvr>=me) return;
    const ao=Math.round(ccCardOvr(a)), bo=Math.round(ccCardOvr(b));
    out.push({key, a, b, ao, bo, avg:(ao+bo)/2, third, thirdKey:thirdK, tOvr});
  });
  return out.sort((x,y)=>Math.abs(x.avg-me)-Math.abs(y.avg-me) || y.avg-x.avg);
}
// Ответ пары: тот же запас, что у одиночки её среднего рейтинга; занятое третье место — дороже.
function ccJoinMargin(p){
  const m=careerDmMargin({handle:'\u0000pair', ovr:p.avg});
  return m-(p.third ? CC_TRIO_THIRD_PULL : 0);
}
function ccJoinWho(card){
  return {handle:card.handle, ovr:Math.round(ccCardOvr(card)), nat:card.nat, role:attrsFor(card).roleKey,
          roster:true, card, cardRegion:card.region||ccCareerRegion(), club:card.org||null, pay:0};
}
function ccJoinAsk(key){
  const p=ccJoinPairs().find(x=>x.key===key);
  if(!p) return;
  const fmt=CC_DUO_FMT;
  ccDuoFindClose();
  const old=careerDmFind(p.a.handle);
  const t=(old && old.state!=='partner') ? old : careerDmThread(ccJoinWho(p.a));
  t.who=t.who||ccJoinWho(p.a);
  t.fmt=fmt||null; t.seat=null;
  t.joinPair=p.b.handle; t.joinThird=p.thirdKey||null; t.joinKey=p.key;
  t.fmtPair=fmt ? p.b.handle : null;
  t.args=0; t.pending=null;
  CH_DM=t.id;
  careerDmPush(t, 'you', 'dmJoinAsk', ['@'+ccHandle(p.b.handle)]);
  if(ccJoinMargin(p)>=0){ careerDmPush(t, 'them', 'dmJoinYes', ['@'+ccHandle(p.b.handle)]); t.state='offer'; }
  else { careerDmPush(t, 'them', 'dmJoinNo', ['@'+ccHandle(p.b.handle)]); t.state='declined'; }
  careerSave();
  careerRenderHub('social');
}
/* Согласие на вступление в трио-год: пара садится в оба кресла, прежние напарники уходят
   (как при замене — с новостью и отдачей их места), бывший третий пары свободен. */
function ccJoinSeat(t){
  const b=careerRosterNowEU().find(x=>hKey(x)===hKey(t.joinPair));
  const a=t.who && (t.who.card || careerRosterNowEU().find(x=>hKey(x)===hKey(t.who.handle)));
  if(!a || !b) return false;
  const roles=[ccRoleNow(), attrsFor(a).roleKey, attrsFor(b).roleKey].filter(Boolean);
  if(!ccSquadRoleFits(roles, 3)){
    // Пара не пересаживается — она уже пара. Нужная роль — та, которой у неё нет.
    const need=[a, b].some(c=>attrsFor(c).roleKey==='roleIGL') ? 'roleFRG' : 'roleIGL';
    careerDmPush(t, 'them', 'dmJoinRole', [L()[need]||'']);
    return null;
  }
  careerMates().forEach(m=>{ if(!m) return; careerSlotGiveUp(m.handle); careerNews('bad', 'ccNewsDropped', [m.handle]); });
  (CAREER.partners||[]).forEach(r=>{ if(r) ccMateParted(r); });
  CAREER.partners=[];
  const rec=c=>({handle:c.handle, cardRegion:c.region||ccCareerRegion(), patience:CAREER_PATIENCE_START, since:careerToday()});
  careerMateSeat(rec(a), 0);
  careerMateSeat(rec(b), 1);
  const cr=CAREER.career;
  if(t.joinKey && cr.trios && cr.trios[t.joinKey]) delete cr.trios[t.joinKey];
  return true;
}
/* ---- Объявление свободного агента ------------------------------------------

   В настоящей ленте «ищу дуо» — это анкета с требованиями, а не крик в пустоту.
   Снято с живых постов 2 сентября 2026: «Lfd div3 n1 igl min 1k3pr with recent
   perf, only speak english or french», «lfd eval cup (maybe) as fragg can
   lead». То есть: роль, дивизион, минимальный PR — и по этим условиям человека
   либо зовут, либо нет.

   Здесь то же самое. Объявление рождается в день развода (careerSceneTurn),
   живёт, пока человек один, и видно в двух местах: постом в ленте с карточкой
   под ним и строкой в поиске дуо, где кнопка «написать» гаснет, если игрок не
   проходит по PR. Требования — не из воздуха: роль просится противоположная
   своей, дивизион свой, порог PR — две трети собственного. */
const CC_AD_PR_SHARE=0.66;
function ccAdMake(card){
  if(!card || !card.handle) return null;
  const ads=CAREER.ads=CAREER.ads||{}, k=hKey(card.handle);
  const mine=ccPrCardOf(card.handle);
  const role=attrsFor(card).roleKey;
  const ad={day:careerToday(), div:CAREER.career.division, handle:card.handle,
            // Ищут того, кем сам не являешься: фраггер ищет игрока, игрок — фраггера.
            want: role==='roleFRG' ? 'roleIGL' : 'roleFRG',
            pr: mine ? Math.round(mine.pr*CC_AD_PR_SHARE) : 0};
  ads[k]=ad;
  return ad;
}
// Объявление считается открытым, пока человек один: собрал пару — снимается.
// Кто с кем сегодня, знает careerPools — см. ccPairMateOf.
function ccAdOf(handle){
  const ad=(CAREER.ads||{})[hKey(handle)];
  if(!ad) return null;
  return ccPairMateOf(handle) ? null : ad;
}
// Проходит ли игрок по объявлению. PR своей строки — тот же, что видит доска.
function ccAdFits(ad){
  if(!ad || !ad.pr) return true;
  /* С кем уже играл, тот зовёт без порога PR (24.10, Notion «24.10.26»: «тиммейты на первом месте по PR и в некст
     главе ты не можешь им предложить играть»). Напарник набирает PR и в вечерах без тебя, и через год его порог
     выше твоей строки, хотя играли вы вместе. Книга бывших — cr.exMates (ccMateParted). */
  try{ const ex=CAREER.career.exMates; if(ex && ex[hKey({handle:ad.handle})]) return true; }catch(e){}
  /* Своя строка доски — по метке you, а не по нику карточки (17.10, Notion «fncsdraft 15.10»: «не могу играть хотя
     pr есть» — PR 218 883 в шапке, а объявление просило 82 239: у построенного игрока handle нет, ccPrCardOf(null)
     давал ноль, и ни одно объявление с порогом не открывалось). */
  const me=careerPrRows().find(r=>r.you);
  return (me ? me.pr : 0) >= ad.pr;
}
function ccDuoFindRender(keepFocus){
  const q=CC_DUO_Q.trim().toLowerCase();
  const all=careerDuoSearchPool();
  // Доска PR читается один раз на список, а не по карточке на строку (ccPrCardOf сортирует доску заново).
  const prMap=new Map(careerPrRows().map((r,i)=>[hKey(r.name), {pr:r.pr, rank:i+1}]));
  const prOf=new Map(all.map(w=>[w, prMap.get(hKey(w.handle))||null]));
  if(CC_DUO_SORT==='pr') all.sort((a,b)=>((prOf.get(b)||{}).pr||0)-((prOf.get(a)||{}).pr||0) || b.ovr-a.ovr);
  else if(CC_DUO_SORT==='near'){
    const me=Math.round((CAREER.player && (CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr))||70);
    all.sort((a,b)=>Math.abs((a.ovr||0)-me)-Math.abs((b.ovr||0)-me) || (b.ovr||0)-(a.ovr||0));
  }
  // Сначала флаг, потом набранное имя: флаг сужает, строка ищет внутри.
  const byRole=CC_DUO_ROLE ? all.filter(w=>w.role===CC_DUO_ROLE) : all;
  const byNat=CC_DUO_NAT ? byRole.filter(w=>ccDuoNatCode(w)===CC_DUO_NAT) : byRole;
  const list=(q ? byNat.filter(w=>String(w.handle).toLowerCase().indexOf(q)>=0) : byNat).slice(0, 120);
  /* Флаги — те, что в списке есть, с числом людей у каждого. Десять самых
     населённых: строка фильтров шире экрана телефона бесполезна, а хвост из
     стран с одним человеком ищется строкой быстрее, чем флагом. */
  const natCount={};
  all.forEach(w=>{ const c=ccDuoNatCode(w); if(c) natCount[c]=(natCount[c]||0)+1; });
  /* Страна — выпадающим списком рядом с поиском (его слово 29.09: ряд флагов «не нравится», «фильтр,
     чтоб выбор был тут же, не все»): закрытым он занимает одну кнопку, открытым — все страны списка
     по числу людей, с названием, а не только картинкой. */
  const natAll=Object.keys(natCount).sort((a,b)=>natCount[b]-natCount[a]);
  if(CC_DUO_NAT && natAll.indexOf(CC_DUO_NAT)<0) natAll.unshift(CC_DUO_NAT);
  let natName=c=>c.toUpperCase();
  try{ const dn=new Intl.DisplayNames([LANG||'en'], {type:'region'}); natName=c=>{ try{ return dn.of(c==='uk' ? 'GB' : c.toUpperCase())||c.toUpperCase(); }catch(e){ return c.toUpperCase(); } }; }catch(e){}
  /* Флаг картинкой, а не эмодзи: Windows эмодзи-флагов не рисует и пишет буквы «DE», «FR» (скрин 29.09). */
  const natFlag=c=>`<img src="flags/w20/${c}.png" alt="" onerror="this.remove()">`;
  const rows=list.map(w=>{
    const said=careerDmFind(w.handle);
    const wrote=!!(said && said.msgs && said.msgs.some(m=>m.from==='you'));
    /* С кем он играет СЕГОДНЯ, а не с кем начал год: список стоял на
       ccSceneMateOf, то есть на ростере Epic, и человек, развёдшийся неделю
       назад, всё ещё читался занятым — писать ему было незачем. См.
       ccPairMateOf. */
    const mates=ccSquadMatesOf(w.handle), mate=mates[0]||null;
    const prc=prOf.get(w);
    const under=[L()[w.role]||'', mate ? ccSay("ccDuoWith", esc(mates.map(c=>c.handle||"").join(" & "))) : ccSay("ccDuoFree"),
                 w.club ? esc(w.club) : '',
                 prc && prc.pr ? esc(L().ccDuoPrOf(ccNum(Math.round(prc.pr)), prc.rank||'–')) : ''].filter(Boolean).join(' · ');
    /* Объявление человека — второй строкой, его же словами: кого ищет и с
       каким PR. Не проходишь — кнопка гаснет и говорит почему; это ответ,
       который в жизни дают до разговора, а не после. */
    const ad=mate ? null : ccAdOf(w.handle);
    const fits=!ad || ccAdFits(ad);
    return `<div class="cc-buy">
      ${(function(){ const u=w.card ? photoURL(w.card) : null;
          /* Инициалы стоят всегда, фото — поверх них: не загрузилось — остаются инициалы, а не
             пустое место и сдвинутая строка (скрин 29.09: у Crue, Nayte, Stompy не было ничего). */
          return `<span class="cc-buy-img cc-buy-face cc-buy-mono cc-duo-ava">${esc(String(w.handle||'?').slice(0,2).toUpperCase())}${
            u ? `<img src="${u}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`;
        })()}
      <div class="cc-buy-in"><b>${esc(w.handle)} <i>${w.ovr}</i>${w.cardRegion && w.cardRegion!==ccCareerRegion() ? ` <small class="cc-duo-regtag">${esc(w.cardRegion)}</small>` : ''}</b><i>${under}</i>${
        ad ? `<i class="cc-buy-ad${fits?'':' no'}">${esc(L().ccAdWant(L()[ad.want]||'', ad.div, ad.pr))}</i>` : ''}</div>
      ${(CC_DUO_FMT && typeof ccMpOn==='function' && ccMpOn()) ? `<button class="ch-sign" onclick="ccDuoFindWrite('${jsq(w.handle)}')">${L().lfRosterAsk}</button>`
        : wrote ? `<span class="cc-owned">${L().ccDuoYouWrote}</span>`
              : !fits ? `<span class="cc-owned cc-ad-no">${L().ccAdNoFit(ad.pr)}</span>`
              : ccDmAsksLeft()<=0 ? `<span class="cc-owned cc-ad-no">${L().ccDuoLimit}</span>`
              : `<button class="ch-sign" onclick="ccDuoFindWrite('${jsq(w.handle)}')">${L().ccDuoWrite}</button>`}
      ${(CAREER.career.friends||[]).indexOf(w.handle)>=0
        ? `<span class="cc-owned">${L().ccFriendIs}</span>`
        : `<button class="cc-job-h cc-duo-fr" onclick="careerFriendAsk('${jsq(w.handle)}')">${L().ccFriendAdd}</button>`}
    </div>`;
  }).join('');
  // Вид «Пары» (ccJoinPairs): готовые дуо сцены, к которым можно попроситься третьим.
  const pairsOk=ccDuoPairsOn(), pairsView=pairsOk && CC_DUO_PAIRS;
  const pairsList=pairsView ? ccJoinPairs().filter(p=>!q || [p.a.handle, p.b.handle].some(h=>String(h).toLowerCase().indexOf(q)>=0)).slice(0, 60) : [];
  const face=c=>{ const u=photoURL(c); return `<span class="cc-buy-img cc-buy-face cc-buy-mono cc-duo-ava">${esc(String(c.handle||'?').slice(0,2).toUpperCase())}${
    u ? `<img src="${u}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`; };
  const pairRows=pairsList.map(p=>{
    const th=careerDmFind(p.a.handle), asked=!!(th && th.joinKey===p.key && th.state!=='open');
    const under=[p.third ? esc(L().ccJoinPairThird(String(p.third.handle||'')+' '+p.tOvr)) : esc(L().ccJoinPairOpen),
                 p.a.org ? esc(p.a.org) : ''].filter(Boolean).join(' · ');
    return `<div class="cc-buy cc-join-pair" data-key="${esc(p.key)}">${face(p.a)}${face(p.b)}
      <div class="cc-buy-in"><b>${esc(p.a.handle)} <i>${p.ao}</i> &amp; ${esc(p.b.handle)} <i>${p.bo}</i></b><i>${under}</i></div>
      ${asked ? `<span class="cc-owned">${L().ccDuoYouWrote}</span>`
              : `<button class="ch-sign cc-join-ask" onclick="ccJoinAsk('${jsq(p.key)}')">${esc(L().ccJoinPairBtn)}</button>`}
    </div>`;
  }).join('');
  document.getElementById('duoFindBody').innerHTML=
    `<h4 class="cc-pick-h">${CC_DUO_FMT ? esc(L().rsFindTitle(CC_DUO_FMT)) : L().ccDuoFindTitle}</h4>
     ${pairsOk ? `<div class="cc-duo-sort cc-duo-view"><button class="cc-job-h${pairsView?'':' on'}" onclick="ccDuoFindView('players')">${esc(L().ccDuoViewPlayers)}</button> <button class="cc-job-h cc-join-tab${pairsView?' on':''}" onclick="ccDuoFindView('pairs')">${esc(L().ccDuoViewPairs)}</button></div>` : ''}
     <div class="ch-hint">${pairsView ? esc(L().ccJoinPairHint)+(ccDuoRegNow()!==ccCareerRegion() ? ' '+esc(L().ccJoinPairOwnReg) : '') : L().ccDuoFindHint}</div>
     <div class="cc-duo-bar"><input id="duoFindQ" class="cc-duo-q" type="text" autocomplete="off"
            placeholder="${esc(L().ccDuoSearchPh)}" value="${esc(CC_DUO_Q)}"
            oninput="ccDuoFindQ(this.value)">
       <div class="cc-duo-natdd${CC_DUO_NAT_OPEN?' open':''}">
         <button type="button" class="cc-duo-natsel${CC_DUO_NAT?' on':''}" aria-label="${esc(L().ccDuoNat)}" onclick="CC_DUO_NAT_OPEN=!CC_DUO_NAT_OPEN;ccDuoFindRender()">${
           CC_DUO_NAT ? natFlag(CC_DUO_NAT)+'<span>'+esc(natName(CC_DUO_NAT))+'</span>' : '<span>'+esc(L().ccDuoNat)+': '+esc(L().ccDuoNatAll)+'</span>'}<i>▾</i></button>
         ${CC_DUO_NAT_OPEN ? `<div class="cc-duo-natlist">
           <button type="button" class="${CC_DUO_NAT?'':'on'}" onclick="CC_DUO_NAT='';CC_DUO_NAT_OPEN=false;ccDuoFindRender()"><span>${esc(L().ccDuoNatAll)}</span><b>${all.length}</b></button>
           ${natAll.map(c=>`<button type="button" class="${CC_DUO_NAT===c?'on':''}" onclick="CC_DUO_NAT='${c}';CC_DUO_NAT_OPEN=false;ccDuoFindRender()">${natFlag(c)}<span>${esc(natName(c))}</span><b>${natCount[c]||0}</b></button>`).join('')}
         </div>` : ''}
       </div>${ccRealNamesHere() ? `<select class="cc-duo-regsel" aria-label="${esc(L().ccDuoReg)}" onchange="ccDuoFindReg(this.value)">${
         ((typeof ccYearRegions==='function' ? ccYearRegions() : CC_REGIONS)||[]).map(r=>`<option value="${r}"${r===ccDuoRegNow()?' selected':''}>${esc(L().ccDuoReg)}: ${esc(regionName(r))}</option>`).join('')}</select>` : ''}</div>
     <div class="ch-hint cc-duo-n">${pairsView ? (pairsList.length ? esc(L().ccDuoViewPairs)+': '+pairsList.length : esc(L().ccJoinPairNone)) : list.length ? L().ccDuoFound(list.length) : L().ccDuoNobody}
       <span class="cc-duo-sort">${esc(L().ccDuoSortBy)}: <button class="cc-job-h${CC_DUO_SORT==='near'?' on':''}" onclick="ccDuoFindSort('near')">${esc(L().ccDuoSortNear)}</button> <button class="cc-job-h${CC_DUO_SORT==='ovr'?' on':''}" onclick="ccDuoFindSort('ovr')">${esc(L().ccDuoSortOvr)}</button> <button class="cc-job-h${CC_DUO_SORT==='pr'?' on':''}" onclick="ccDuoFindSort('pr')">${esc(L().ccDuoSortPr)}</button></span>${pairsView ? '' :
       ` <span class="cc-duo-sort cc-duo-role">${['', 'roleIGL', 'roleFRG'].map(r=>`<button class="cc-job-h${CC_DUO_ROLE===r?' on':''}" onclick="ccDuoFindRole('${r}')">${esc(r ? (L()[r]||r) : L().ccDuoNatAll)}</button>`).join(' ')}</span>`}</div>
     <div class="cc-buys">${pairsView ? pairRows : rows}</div>`;
  if(keepFocus){
    const f=document.getElementById('duoFindQ');
    if(f){ f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
  }
}
/* «Открыть соцсети» под новостью ведёт в ЛЕНТУ. Отчёт: «когда
   жму open socials на dms меня возвращает, а не feed» — экран открывался там,
   где его оставили в прошлый раз, или на личке, если там непрочитанное
   (см. careerSocialHTML). Кнопка стоит под новостью, значит хотят читать
   ленту, а не почту. */
function careerOpenFeed(){
  CC_BELL_OPEN=false;
  CH_SOCIAL='feed';
  careerTab('social');
}

/* The day's own panel.

   It stands where the match card stands, because on a day with no tournament it
   is what the player came to the screen to do. Three rings across the top —
   energy, fatigue, partner morale — like a sports-sim training tile, then the day's
   options as rows that each print what they give before they are pressed.

   Nothing here is a mystery box. A row that cannot be afforded stays on screen
   and goes quiet rather than disappearing: what today could have held is part of
   the decision. */
function careerRingHTML(label, value, max, tone){
  const deg=Math.round(clamp(value/max, 0, 1)*360);
  return '<div class="cc-ring cc-ring-'+tone+'">'+
    '<div class="cc-ring-dial" style="background:conic-gradient(currentColor '+deg+'deg, rgba(255,255,255,.09) 0deg)">'+
    '<b>'+Math.round(value)+'</b></div>'+
    '<span>'+label+'</span></div>';
}
/* locked — the tournament standing on today that this career cannot enter, in
   its own words. A day with an event you did not qualify for is a day off, not
   a wall: the panel is the same one an empty Tuesday gets, with a line at the
   top saying which room is playing without you. */
/* Подработка — его пункт 4 со страницы «ы», 22 августа: «работа макдональс,
   в каждой стране своя почасовая смена, 10 энергии за час, игрок выбирает
   сколько». Ставка растёт из аренды страны проживания — той же таблицы, по
   которой платится жильё: где жить дороже, там и смена платит больше; пол и
   потолок держат числа человеческими. Логотип чужой торговой марки в файл не
   кладём — жёлтая плашка и картошка узнаются сами. cr.did получает 'job',
   день НЕ закрывается: смена — это часы, а не вечер целиком. */
/* Микро-невзгоды — его пункт 5 со страницы «ы», 22 августа: «свет, болезнь
   (мб неделя), очень редко». Бросок случайный в момент наступления дня
   (cr.luck, см. ccDayRoll — правка) и выпадает только на
   свободный день: отключённый свет закрывает вечер, болезнь режет запас
   энергии на треть на неделю (см. careerEnergyMax). */
// Бренды разовых баннеров на стрим — пункт 9 страницы «ы». Свои, не чужие
// торговые марки.
// Один мир брендов со спонсорской лесенкой (CC_SPONSORS) — баннер вешает те
// же марки, что потом приходят с контрактом.
const CC_STREAM_BRANDS=['Monster Energy','HyperX','Logitech','Razer','Nike','Red Bull'];
const CC_MISFORTUNE_CHANCE=0.012;
function ccMisfortune(iso){
  const cr=CAREER && CAREER.career;
  if(!cr) return null;
  if((careerYearDays().get(iso)||[]).length) return null;
  /* Случайный день, не расписанный. Отзыв: «может в случайно
     день эти события пусть происходят» — после скрина tr4vassos, у которого
     свет гас «at every save, at the same day everytime» (сид на дате без
     ничего от карьеры). Бросается в момент наступления дня и хранится в
     cr.luck — см. ccDayRoll. */
  const luck=ccDayRoll(iso);
  return (luck && luck.woe) || null;
}
const CC_JOB_MAXH=16;
function ccJobWage(){
  const rent=ccRentOf(ccLivesIn());
  return clamp(Math.round((rent||600)/150), 2, 15);
}
/* Смена ест долю дня, а не фиксированные десятки. Правка,
   вторая редакция тем же вечером: «максимальная смена 16 часов — падает вся
   энергия, потом 12 — 75, 8 — 50, 4 — 25, и день по часам платит». Полные
   шестнадцать забирают весь дневной запас — какой он у этого игрока сегодня,
   с болезнью, — каждая ступень короче на четверть дешевле, а
   платится каждый час. Отработавший полный день уже не тренируется. */
function ccJobCost(h){ return Math.ceil(careerEnergyMax()*h/CC_JOB_MAXH); }
/* Тренировка на Центре — коротко (27.10, его «тренировку вернуть в главный экран, но чтоб спама информации не было»).
   Шесть плиток: сокращение, значение, цена; нажал — потренировал. Ниже строка быстрых занятий (Noble, разговор, если
   есть с кем, стрим, отдых — когда энергия не полная), и «Ещё» во вкладку «Тренировка»: карты Creative, Креатив
   командой, подработка. Без «+0.5», без «55.0 → 55.1», без списков параметров: это всё в подсказке и на вкладке.
   Сделанное сегодня — строкой сверху; закрытый день кнопок не держит (что его закрыло, панель сказала выше). */
function ccDayGoHTML(done, closed, left){
  done=done||[];
  const did=done.filter(id=>String(id).indexOf('ev:')!==0).map(id=>{ try{ return ccActName(id); }catch(e){ return ''; } }).filter(Boolean);
  const head=did.length ? '<div class="cc-day-did"><em>'+esc(L().ccDayDid)+'</em> '+esc([...new Set(did)].join(', '))+'</div>' : '';
  if(closed) return '<div class="cc-day-go">'+head+'</div>';
  const six=CAREER.player.attrs || ccOwnAttrs(), act=id=>CC_DAY_ACTS.find(a=>a.id===id), mark=L().ccEnergyMark;
  const tiles=['trAim','trSur','trCon','trClu','trExp','trEnd'].map(id=>{
    const a=act(id); if(!a) return '';
    const k=Object.keys(a.gain||{})[0], v=six[k]!=null ? six[k] : 50;
    const can=left>=a.energy && v<99;
    return '<button class="cc-qt'+(can?'':' off')+(done.indexOf(id)>=0?' did':'')+'" '+(can?'onclick="careerPickDay(\''+id+'\')"':'disabled')+
      ' title="'+esc(ccActName(id)+' · '+ccAttrFull(k)+(left<a.energy ? ' · '+L().ccNeedEnergy(a.energy-left) : ''))+'">'+
      '<span>'+esc(L()['ccAttr'+k.toUpperCase()]||k)+'</span><b>'+ccStatNum(v)+'</b><em>'+a.energy+mark+'</em></button>';
  }).join('')+
  /* Седьмая плитка — мобильный рейтинг (его «а как улучшать силу, в тренировках нет»): тренировка на телефоне жила кнопкой
     в ряду «Стрим/Скримы» и только с устройством. Теперь рядом с AIM…END, с числом; без телефона серая с причиной. */
  (()=>{ const a=act('mobile'); if(!a) return '';
    const own=ccMobileOwn(), v=ccMobileOvr(), g=ccMobileTrainGain(), can=own && left>=a.energy && g>0;
    const why=!own ? L().ccMobTrainNeed : g<=0 ? L().ccMobTrainCap : left<a.energy ? L().ccNeedEnergy(a.energy-left) : ccActName('mobile')+' · '+L().ccMobTitle+' '+v.toFixed(1)+' → '+(v+g).toFixed(1);
    return '<button class="cc-qt cc-qt-mob'+(can?'':' off')+(done.indexOf('mobile')>=0?' did':'')+'" '+(can?'onclick="careerPickDay(\'mobile\')"':'disabled')+
      ' title="'+esc(why)+'"><span>'+esc(L().ccMobTile)+'</span><b>'+ccStatNum(v)+'</b><em>'+(own ? a.energy+mark : '🔒')+'</em></button>'; })();
  const quick=['noble', 'talk', 'stream', 'rest'].map(id=>{
    const a=act(id); if(!a) return '';
    if(a.talk && !careerMateRec()) return '';
    if(a.rest && left>=careerEnergyMax()) return '';
    const can=left>=a.energy;
    return '<button class="cc-qa'+(can?'':' off')+(done.indexOf(id)>=0?' did':'')+'" '+(can?'onclick="careerPickDay(\''+id+'\')"':'disabled')+'>'+
      esc(ccActName(id))+(a.energy ? ' <em>'+a.energy+mark+'</em>' : '')+'</button>';
  }).join('');
  return '<div class="cc-day-go">'+head+
    '<div class="cc-act-grp">'+(L().ccActGrpTrain||'')+'</div><div class="cc-qgrid">'+tiles+'</div>'+
    '<div class="cc-qrow">'+quick+'<button class="cc-qa cc-qmore" onclick="careerTab(\'train\')">'+esc(L().ccDayMore)+' ›</button></div></div>';
}
function careerJobHTML(closed, left){
  const wage=ccJobWage();
  const hrs=[4,8,12,16].map(function(h){
    const can=!closed && left>=ccJobCost(h);
    /* Цена в энергии — на самой кнопке, не в подсказке: правка
       — «пусть пишет, сколько энергии тратится». */
    return '<button class="cc-job-h'+(can?'':' off')+'"'+
      (can ? ' onclick="careerJobWork('+h+')"' : ' disabled')+
      '>'+h+esc(L().ccJobH)+' · $'+(wage*h)+' · '+ccJobCost(h)+'⚡</button>';
  }).join('');
  return '<div class="cc-job"><span class="cc-job-m">'+(ccUiClassic() ? '🍟' : '$')+'</span><em>'+esc(L().ccJobTitle)+
    ' · $'+wage+esc(L().ccJobPerH)+'</em><div class="cc-job-btns">'+hrs+'</div></div>';
}
function careerJobWork(h){
  const cr=CAREER.career;
  h=clamp(h|0, 1, CC_JOB_MAXH);
  if(careerDayClosed() || careerEnergy()<ccJobCost(h)) return;
  careerSpend(ccJobCost(h));
  const pay=ccJobWage()*h;
  cr.balance=(cr.balance||0)+pay;
  cr.did=cr.did||{};
  cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat('job');
  /* Ленты у смены больше нет — отзыв: «в твитере это не
     нужно постить». Про-игрок, отстоявший смену на кухне, об этом не пишет.
     Деньги видно на балансе; ключ ccNewsJob остаётся в словаре ради постов,
     уже лежащих в старых сейвах. */
  careerSave();
  careerRenderHub('centre');
}
/* ТРЕНИРОВОЧНЫЙ ЦЕНТР — вместо списка одинаковых строк.

   Сверху шесть атрибутов полными словами: где ты сейчас, полоса до 99 и сколько
   прибавилось за эту неделю; под ними — усталость (cr.grind) и риск травмы. Тренировки —
   карточками по две в ряд: иконка, какой атрибут и насколько поднимет сегодня, цена в
   энергии, бонус коуча и причина, если сегодня нельзя. Арифметика — та же, что у дня
   (careerDoAct): выносится только показ. */
const CC_TRAIN_ICON={trAim:'🎯', trSur:'🏆', trBox:'📦', trZw:'🌀', trEdit:'✏️', trPit:'🕳️', trMap:'🗺️', trCon:'💪', trClu:'⚔️', trExp:'📼', trEnd:'🧱', trMeta:'🧭',
  scrim:'🤝', noble:'🏟️', talk:'💬', stream:'📺', host:'🎪', rest:'😴'};
const CC_ATTR_ICON={aim:'🎯', end:'🧱', sur:'🏆', exp:'📼', clu:'⚔️', con:'💪'};
function ccWeekTag(d){ d=d||careerToday(); return ccMonthKey(d)+'|'+Math.floor(((+d.slice(8,10))-1)/7); }
function ccAttrFull(k){ return L()['attr'+k.charAt(0).toUpperCase()+k.slice(1)+'Full'] || (L()['ccAttr'+k.toUpperCase()]||k); }
function ccMeterHTML(label, v, max, kind){
  const pct=Math.max(0, Math.min(100, max ? v/max*100 : 0));
  return '<div class="cc-meter m-'+kind+'"><span>'+esc(label)+'</span><u><s style="width:'+pct.toFixed(0)+'%"></s></u><b>'+Math.round(v)+'</b></div>';
}
function ccTrainPanelHTML(six, wide){
  // Атрибуты карточками: во вкладке «Тренировка» (wide) — крупно, с полным именем и шкалой
  // 35–99; иначе — чипами в три колонки. Прирост недели — зелёным.
  const lf=(typeof ccLife==='function') ? ccLife() : {};
  const tw=(lf.tw && lf.tw.wk===ccWeekTag()) ? lf.tw.g : {};
  const chips=ATTR_KEYS.map(k=>{
    const v=six[k]!=null ? six[k] : 50, pct=Math.max(0, Math.min(100, (v-35)/(99-35)*100));
    const wk=tw[k] ? '<i>+'+(Math.round(tw[k]*10)/10).toFixed(1)+'</i>' : '';
    if(wide) return '<div class="cc-ta cc-ta-wide"><span class="cc-ta-ico">'+(CC_ATTR_ICON[k]||'•')+'</span>'+
      '<div class="cc-ta-body"><span class="cc-ta-name">'+esc(ccAttrFull(k))+' <em>'+(L()['ccAttr'+k.toUpperCase()]||k)+'</em></span>'+
      '<u><s style="width:'+pct.toFixed(0)+'%"></s></u></div>'+
      '<div class="cc-ta-num"><b>'+(Math.round(v*10)/10).toFixed(1)+'</b>'+(wk || '<i class="z">+0.0</i>')+'</div></div>';
    return '<div class="cc-ta" title="'+esc(ccAttrFull(k))+'"><span>'+(L()['ccAttr'+k.toUpperCase()]||k)+'</span>'+
      '<b>'+(Math.round(v*10)/10).toFixed(1)+'</b>'+wk+'<u><s style="width:'+pct.toFixed(0)+'%"></s></u></div>';
  }).join('');
  const cr=CAREER.career, grind=cr.grind||0, top=CC_GRIND_FREE+CC_GRIND_MAX/CC_GRIND_STEP;
  const fat=Math.max(0, Math.min(100, grind/top*100)), burn=careerBurnout();
  const state=burn>=1 ? 'lfFatBurn' : grind>CC_GRIND_FREE ? 'lfFatTired' : 'lfFatFresh';
  return '<div class="cc-tpanel"><div class="cc-act-grp">'+(L().ccActGrpTrain||'')+'</div>'+
    '<div class="cc-ta-grid">'+chips+'</div>'+
    '<div class="cc-fat"><span>'+L().lfFatigue+'</span><span class="cc-fat-bar s-'+state+'"><i style="width:'+fat.toFixed(0)+'%"></i></span>'+
      '<b>'+L()[state]+'</b></div></div>';
}
function ccActName(id){
  if(id==='noble' && CAREER && CAREER.career) return ccPracSrv();   // сервер практики региона: Noble Practice, Vital Scrims, Major Scrims…
  if(id==='trSur') return ccArenaOn() ? L().rkArenaTitle : L().rkTitle;
  return L()['ccAct'+id]||id;
}
function ccStatNum(v){ const r=Math.round(v*10)/10; return r%1 ? r.toFixed(1) : String(r); }
// Усталость — строкой и только когда она есть: «свежий» на каждом экране ничего не говорил.
function ccFatigueLineHTML(){
  const cr=CAREER.career, grind=cr.grind||0, top=CC_GRIND_FREE+CC_GRIND_MAX/CC_GRIND_STEP;
  const burn=careerBurnout(), state=burn>=1 ? 'lfFatBurn' : grind>CC_GRIND_FREE ? 'lfFatTired' : 'lfFatFresh';
  if(state==='lfFatFresh') return '';
  const fat=Math.max(0, Math.min(100, grind/top*100));
  return '<div class="cc-fat"><span>'+L().lfFatigue+'</span><span class="cc-fat-bar s-'+state+'"><i style="width:'+fat.toFixed(0)+'%"></i></span>'+
    '<b>'+L()[state]+'</b></div>';
}
/* Вкладка «Тренировка» как Discover в лобби Fortnite: каждое занятие — плитка карты с обложкой.
   Обложки — настоящие острова Creative (fortnite.gg → og:image острова), сжаты в items/creative/*.webp.
   Noble — баннер и корона с nobleprac.com. Разбор реплеев — арт турнира. Игра на ранг — Ranked со значком Unreal
   (вики Fortnite), до его запуска 16.05.2023 — Арена. */
const CC_DISC={
  trAim:{img:'items/creative/trAim.webp', map:'Skaavok Aim Trainer'},
  trCon:{img:'items/creative/trCon.webp', map:'Piece Control 1v1'},
  trClu:{img:'items/creative/trClu.webp', map:'1v1 Build Fights'},
  trExp:{img:'art/comp/fnce-37-10-soloseries-ingamecompetetab-solotexture-800x800-800x800-e2b94d5baa94.jpg'},
  trEnd:{img:'items/creative/trEnd.webp', map:'Solo Cup Zone Wars · Endgame'},
  trBox:{img:'items/creative/trBox.webp', map:'Clix Box Fights'},
  trZw:{img:'items/creative/trZw.webp', map:'Desert Zone Wars'},
  trEdit:{img:'items/creative/trEdit.webp', map:"Raider's Edit Course"},
  trPit:{img:'items/creative/trPit.webp', map:'The Pit · Free For All'},
  scrim:{img:'items/creative/scrim.webp', map:'Pro Realistics'},
  noble:{img:'items/creative/noble.jpg', map:'Noble Pro Scrims'},
  mobile:{img:'devices/phone-s26u-shop.jpg'},
  mobScrim:{img:'items/creative/scrim.webp', map:'Mobile Scrims · 16'}
};
const CC_RANKED_FROM='2023-05-16';
function ccDiscOf(id){
  if(id==='noble' && CAREER && CAREER.career) return ccCareerRegion()==='EU' ? {img:'items/creative/noble.jpg', map:ccNobleServer().name} : {img:'items/creative/scrim.webp', map:ccPracSrv()};
  if(id==='trSur') return careerToday()>=CC_RANKED_FROM ? {img:'items/creative/trSur-ranked.jpg', map:'Ranked'}
    : {img:'items/creative/trSur-arena.jpg', map:L().lfArena||'Arena'};
  return CC_DISC[id]||{};
}
function ccDiscTile(id){ return id!=='talk' && (String(id).indexOf('tr')===0 || id==='scrim' || id==='noble' || id==='mobile' || id==='mobScrim'); }
// Сколько занятие поднимет каждый параметр сегодня: та же арифметика, что в careerDoAct.
function ccDiscGains(a, o){
  return Object.keys(a.gain||{}).map(k=>{
    const f=o.six[k]!=null ? o.six[k] : 50, c=!!(o.dayCoach && o.dayCoach.keys.indexOf(k)>=0);
    const t=Math.max(35, Math.min(99, f+a.gain[k]*o.dayMult*(c ? 1+o.dayCoach.train : 1)*ccFocusMult(k)*(ccTrainAct(a) ? ccRepeatMult(k) : 1)));
    return {k:k, by:Math.round((t-f)*10)/10};
  }).filter(g=>g.by>0).sort((x,y)=>y.by-x.by);
}
function ccDiscTileHTML(a, o){
  const d=ccDiscOf(a.id), img=d.img || ccDayArt(), g=ccDrillLast(a.id), gains=ccDiscGains(a, o);
  const mob=a.mobile ? {own:ccMobileOwn(), now:ccMobileOvr(), g:ccMobileTrainGain(!!a.mobScrim)} : null, n1=v=>(Math.round(v*10)/10).toFixed(1);
  const why = o.closed ? '' : (mob && !mob.own) ? L().ccMobTrainNeed : (mob && !(mob.g>0)) ? L().ccMobTrainCap : (o.maxed && !a.noble && !a.morale) ? L().ccAttrMaxed : (o.keys.length && !o.gainsMove && !a.noble && !a.morale) ? L().ccNoGain
            : o.left<a.energy ? L().ccNeedEnergy(a.energy-o.left) : (o.hostWhy || '');
  const chips=gains.slice(0, 2).map(x=>'<i>+'+x.by.toFixed(1)+' '+(L()['ccAttr'+x.k.toUpperCase()]||x.k)+'</i>').join('')+
    (gains.length>2 ? '<i>+'+(gains.length-2)+'</i>' : '')+
    (a.morale ? '<i class="m">'+esc(L().ccGiveMood)+'</i>' : '')+
    (a.noble ? '<i class="m">'+esc(L().lfNobleForm||'+ form')+'</i>' : '')+
    (mob ? (mob.own && mob.g>0 ? '<i>'+esc(L().ccMobTile)+' '+n1(mob.now)+' → '+n1(mob.now+mob.g)+'</i>' : '<i>'+esc(L().ccMobTile)+' '+n1(mob.now)+'</i>')
      : (!a.gain || !Object.keys(a.gain).length) ? '<i>'+esc(L().lfMetaGive)+'</i>' : '');
  const tip=(d.map ? d.map+' · ' : '')+ccActName(a.id)+(gains.length ? ' · '+gains.map(x=>'+'+x.by.toFixed(1)+' '+ccAttrFull(x.k)).join(', ') : '');
  return '<button class="cc-dt'+(o.can?'':' off')+(o.did?' did':'')+'" title="'+esc(tip)+'" '+
    (o.can ? 'onclick="careerPickDay(\''+a.id+'\')"' : 'disabled')+'>'+
    '<span class="cc-dt-img" style="background-image:url(\''+img+'\')">'+
      '<em class="cc-dt-en">'+a.energy+L().ccEnergyMark+'</em>'+
      (g ? '<em class="cc-dt-gr g-'+g.replace('+','p')+'" title="'+esc(L().lfGradeLast)+'">'+g+'</em>' : '')+'</span>'+
    '<span class="cc-dt-txt"><b>'+esc(d.map || ccActName(a.id))+'</b>'+
      '<span class="cc-dt-g">'+chips+'</span>'+(why ? '<span class="cc-dt-why">'+esc(why)+'</span>' : '')+'</span></button>';
}
// Разговор, стрим, своя кастомка, отдых — строкой под плитками: это не карты.
function ccDiscChipHTML(a, o, extra){
  return '<button class="cc-dl'+(o.can?'':' off')+(o.did?' did':'')+'" title="'+esc(ccActName(a.id)+(extra ? ' · '+extra.replace(/<\/i>/g, ' · ').replace(/<[^>]+>/g, '').replace(/[\s·]+$/, '') : ''))+'" '+
    (o.can ? 'onclick="careerPickDay(\''+a.id+'\')"' : 'disabled')+'>'+
    '<i>'+(CC_DL_SVG[a.id] ? '<svg viewBox="0 0 24 24" aria-hidden="true">'+CC_DL_SVG[a.id]+'</svg>' : (CC_TRAIN_ICON[a.id]||'•'))+'</i><b>'+esc(ccActName(a.id))+'</b><em>'+a.energy+L().ccEnergyMark+'</em></button>';
}
// Значки строки дел линией в цвет текста, как X и телеграм в шапке: эмодзи 💬 📺 😴 на кнопке выглядели наклейкой.
const CC_DL_SVG={
  talk:'<path d="M4 5h16v11H10l-5 4v-4H4z"/>',
  stream:'<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="M10.2 7.8v5.4l4.4-2.7z" fill="currentColor" stroke="none"/>',
  host:'<path d="M6 21V4"/><path d="M6 4.5h11l-2.2 3.8L17 12H6"/>',
  rest:'<path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.2 6.2 0 0 0 10.1 10.1z"/>',
  warm:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 2M9.5 3h5"/>'
};
// Параметры одной строкой над плитками: сокращение, значение, прирост за неделю.
function ccDiscStatsHTML(six){
  const lf=(typeof ccLife==='function') ? ccLife() : {};
  const tw=(lf.tw && lf.tw.wk===ccWeekTag()) ? lf.tw.g : {};
  return '<div class="cc-ds">'+ATTR_KEYS.map(k=>{
    const v=six[k]!=null ? six[k] : 50;
    return '<span title="'+esc(ccAttrFull(k))+'"><em>'+(L()['ccAttr'+k.toUpperCase()]||k)+'</em><b>'+ccStatNum(v)+'</b>'+
      (tw[k] ? '<i>+'+(Math.round(tw[k]*10)/10).toFixed(1)+'</i>' : '')+'</span>';
  }).join('')+'</div>';
}
function careerDayPanelHTML(locked){
  const cr=CAREER.career;
  const woe=ccMisfortune(careerToday());
  // Болезнь садится один раз — sickUntil после установки перекрывает дату,
  // и повторные отрисовки в ветку не заходят.
  if(woe==='sick' && (!cr.sickUntil || cr.sickUntil<=careerToday())){
    cr.sickUntil=ccAddDays(careerToday(), 7);
    careerNews('bad', 'ccNewsSick', [ccDayLabel(cr.sickUntil)]);
    careerSave();
  }
  const left=careerEnergy();
  const done=(cr.did && cr.did[careerToday()]) || [];
  const spent=careerDayDone();
  // Whether there is any of the day left to spend, which is not the same as
  // whether anything has been spent: sessions run until the store runs out.
  const closed=careerDayClosed();
  // День турнира до вечера (вкладка «Тренировка»): только занятия и разминка, энергия на кап остаётся. См. ccPreEvent.
  const pre=CC_DAY_VIEW==='train' ? ccPreEvent() : null;
  /* And what closed it, said out loud.

     Nine buttons at a third of their opacity over a full energy ring is a screen
     that reads as broken, and it was read that way: "I joined a club and now I
     cannot do anything", 17 August, with a hundred energy in the ring. The day
     was simply over — a scrim, a stream, a rest or an evening that arrived with
     something on it takes all of it — and nothing on the panel said so. The
     store staying full is the confusing part, so the line says that too: the
     energy is not lost, the day is. */
  const closedBy=closed
    ? (done.find(ccDayShuts)||'') : '';
  const closedName=String(closedBy).indexOf('ev:')===0
    ? (L()['ccDayEv'+String(closedBy).slice(3)]||'')
    : (closedBy ? ccActName(closedBy) : '');
  // A day that arrived with something on it asks about that first; the seven
  // buttons stay under it, and taking the offer spends the day the same way
  // training would.
  const dayEv=(closed || CC_DAY_VIEW==='train') ? null : ccDayEventOn(careerToday());
  const evBox=dayEv ? '<div class="cc-day-ev">'+
      '<b>'+esc(L()['ccDayEv'+dayEv.id])+'</b>'+
      // Скрим-приглашение говорит про состав того сезона, в котором зовут.
      '<span>'+esc(L()[ccSquadKey('ccDayEv'+dayEv.id+'Sub')])+'</span>'+
      '<div class="cc-day-ev-btns'+(dayEv.opts ? ' cc-day-ev-opts' : '')+'">'+
      (dayEv.opts
        // Развилка: кнопка на каждый ответ, первая — главная.
        ? dayEv.opts.map(function(o, i){
            return '<button class="'+(i===0?'ch-sign':'ch-decline')+'" onclick="careerDayEvent(\''+
              dayEv.id+'\',\''+o.id+'\')">'+esc(L()['ccDayEv'+dayEv.id+'O'+o.id]||o.id)+'</button>'; }).join('')
        : '<button class="ch-sign" onclick="careerDayEvent(\''+dayEv.id+'\',true)">'+
          L()['ccDayEv'+dayEv.id+'Yes']+'</button>'+
        '<button class="ch-decline" onclick="careerDayEvent(\''+dayEv.id+'\',false)">'+
          L()['ccDayEv'+dayEv.id+'No']+'</button>')+
      '</div></div>' : '';
  /* What a session is worth today, on the button.

     It used to print the step itself — "СТР +2.27" — which is the number before
     the taper, before the gear and before the coach, and it never said what it
     was 2.27 of. His question, 17 August: where do these numbers come from. So
     the button reads the attribute now and where the session leaves it, which is
     the same arithmetic the day actually does. */
  const nowOvr = CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const dayMult = careerDayGear()*clamp((careerTrainCap()-nowOvr)/CAREER_TAPER, 0, 1);
  const dayCoach = ccCoach();
  const six = CAREER.player.attrs || ccOwnAttrs();
  const actsShown=CC_DAY_ACTS.filter(function(a){ return a.watch ? false : pre ? (ccTrainAct(a) || a.warm) : (!a.warm &&!a.crew && !a.voice && (!a.meta || ccMetaOpen())); });
  if(CC_DAY_VIEW==='train') actsShown.sort((x, y)=>(ccDiscTile(x.id) ? 0 : 1)-(ccDiscTile(y.id) ? 0 : 1));
  const rows=actsShown.map(function(a, ai, allActs){
    const noDev=!!a.mobile && !ccMobileOwn();
    const keys=Object.keys(a.gain||{});
    // A ninety-nine cannot be trained: the day would be spent on a number that
    // cannot move, so the button says so rather than taking the energy.
    const maxed=keys.length>0 && keys.every(function(k){ return (six[k]||0)>=99; });
    // Resting on a full store is the one button that costs a whole day and pays
    // nothing: it restores energy that is already there, and the day is gone.
    // His report, 17 August: "I joined a club and now I cannot do anything" —
    // the day had been spent on a rest that changed no number on the screen.
    const restFull=!!a.rest && left>=careerEnergyMax();
    // Whether the session moves anything at all: a tenth of a point is the
    // smallest thing the button can print, so under that it is not a session,
    // it is an evening for nothing. See the note beside ccNoGain.
    const gainsMove=keys.some(function(k){
      const from=six[k]!=null ? six[k] : 50;
      const by=a.gain[k]*dayMult*(dayCoach && dayCoach.keys.indexOf(k)>=0 ? 1+dayCoach.train : 1)*(ccTrainAct(a) ? ccRepeatMult(k) : 1);
      return Math.round(clamp(from+by,35,99)*10)/10 > Math.round(from*10)/10;
    });
    // Affordable, and the day still open. As many sessions as the store can pay
    // for — the day ends when something takes all of it, or when the player
    // says it is over.
    const hostWhy=a.host ? ccHostWhy() : null;
    // Noble даёт форму, креатив — настрой: их не закрывает потолок параметров.
    const extraUse=!!(a.noble || a.morale || a.warm);
    // В день турнира занятие не должно съесть энергию капа; разминка - одна за день.
    const keepOk=!pre || left-a.energy>=pre.reserve, warmOk=!a.warm || !ccWarmDone();
    const can=!closed && left>=a.energy && (!maxed || extraUse) && !restFull
              && (!keys.length || gainsMove || extraUse) && !hostWhy && !noDev && keepOk && warmOk;
    const gains=keys.map(function(k){
      const from=six[k]!=null ? six[k] : 50;
      const by=a.gain[k]*dayMult*(dayCoach && dayCoach.keys.indexOf(k)>=0 ? 1+dayCoach.train : 1)*(ccTrainAct(a) ? ccRepeatMult(k) : 1);
      const to=clamp(from+by, 35, 99);
      // To one decimal, because half a point is what a session is: rounded to
      // the card's own whole numbers this line would read "75 → 75" on every
      // other day and the button would look broken.
      const num=v=>(Math.round(v*10)/10).toFixed(1);
      return '<i>'+(L()['ccAttr'+k.toUpperCase()]||k.toUpperCase())+' '+
        num(from)+' → '+num(to)+'</i>';
    }).join('')+(maxed ? '<i class="cc-give-cost">'+L().ccAttrMaxed+'</i>' : '')+
      (restFull ? '<i class="cc-give-cost">'+L().ccRestFull+'</i>' : '')+
      /* Why this one is grey, when it is the store and not the day.

         A closed day says so above the buttons; a maxed attribute and a full
         rest say so on their own line. The commonest reason of all said nothing:
         a career that has spent down to twenty-two looks at six dead buttons and
         is told only by their opacity. It is the same complaint the closed day
         drew — a control that refuses without a reason. */
      (!closed && !maxed && !restFull && left<a.energy
        ? '<i class="cc-give-cost">'+L().ccNeedEnergy(a.energy-left)+'</i>'
        : (!closed && !keepOk ? '<i class="cc-give-cost">'+esc(L().ccKeepEnergy(pre.reserve))+'</i>' : ''))+
      /* And when the session is worth nothing, which is not the same as maxed.

         Near the top of the scale the taper cuts a session's gain to under a
         twentieth of a point, so the button prints "74.8 → 74.8" and charges
         twenty-two energy for it. His screenshot, 17 August. A session that
         cannot move the number by a tenth says so and stops asking for the day. */
      (!maxed && keys.length && !gainsMove
        ? '<i class="cc-give-cost">'+L().ccNoGain+'</i>' : '');
    const extra=[];
    if(a.reach)   extra.push('<i class="cc-give-reach">'+L().ccGiveReach+'</i>');
    if(a.morale)  extra.push('<i class="cc-give-mood">'+L().ccGiveMood+'</i>');
    // "+ energy" is a promise, so it is not printed beside the line saying the
    // store is already full.
    if(a.rest && !restFull) extra.push('<i class="cc-give-rest">'+L().ccGiveRest+'</i>');
    if(a.focus)   extra.push('<i class="cc-give-cost">'+L().ccGiveNoImprove+'</i>');
    if(a.warm)    extra.push('<i class="cc-give-mood">'+esc(L().ccGiveWarm(CC_WARM_FORM))+'</i>'+(ccWarmDone() ? '<i class="cc-give-cost">'+esc(L().ccWarmDone)+'</i>' : ''));
    // Повтор стата за неделю: прирост ниже, и сказано почему (CC_TRAIN_REPEAT).
    if(ccTrainAct(a)){ const rk=keys.find(k=>ccRepeatCount(k)>0); if(rk) extra.push('<i class="cc-give-cost">'+esc(L().ccRepeatNote(ccRepeatCount(rk)))+'</i>'); }
    // Тренировка на телефоне: мобильный рейтинг было → станет, как у AIM и остальных; без устройства — где его взять.
    if(a.mobile){ const now=ccMobileOvr(), g=ccMobileTrainGain(!!a.mobScrim), num=v=>(Math.round(v*10)/10).toFixed(1);
      extra.push(noDev ? '<i class="cc-give-cost">'+esc(L().ccMobTrainNeed)+'</i>'
        : g>0 ? '<i>'+esc(L().ccMobTitle)+' '+num(now)+' → '+num(now+g)+'</i>' : '<i class="cc-give-cost">'+esc(L().ccMobTrainCap)+'</i>'); }
    if(a.host){
      extra.push('<i>'+esc(L().ccHostLine(ccNum(ccHostPerWin()), ccNum(ccHostPot())))+'</i>');
      extra.push('<i class="cc-give-reach">'+L().ccGiveReach+'</i>');
      if(hostWhy==='reach') extra.push('<i class="cc-give-cost">'+esc(L().ccHostNeedReach(ccNum(CC_HOST_REACH)))+'</i>');
      if(hostWhy==='cash') extra.push('<i class="cc-give-cost">'+esc(L().ccHostNeedCash(ccNum(ccHostPot()-(cr.balance||0))))+'</i>');
    }
    /* Группы, как список квестов в лобби: заголовок перед первой строкой
       группы и цветная кромка слева по группе (g-train/g-team/g-life). */
    const grp=String(a.id).indexOf('tr')===0 ? 'train' : (a.id==='scrim'||a.id==='talk'||a.id==='noble') ? 'team' : 'life';
    /* В Центре день — списком, как было до карточек (Notion «29», его слово: «верни такой дизайн,
       лучше выглядело»): заголовок группы, строка — название и энергия, под ней прирост атрибутов
       «AIM 96.0 → 96.1» и эффекты. Тренировки тоже тут, строками. Карточки — только во вкладке «Тренировка». */
    if(CC_DAY_VIEW!=='train'){
      const grpOf0=x=>String(x.id).indexOf('tr')===0 ? 'train' : (x.id==='scrim'||x.id==='talk'||x.id==='noble') ? 'team' : 'life';
      const firstOf=allActs.find(x=>grpOf0(x)===grp);
      const head=a===firstOf ? '<div class="cc-act-grp">'+(L()['ccActGrp'+grp.charAt(0).toUpperCase()+grp.slice(1)]||'')+'</div>' : '';
      /* Тренировки в Центре — шесть колонок, по одной на характеристику (его слово 29.09: «слишком много
         спама, просто 6 колонок для каждой характеристики»): сокращение, значение, прирост за занятие,
         энергия. Карты Creative на две характеристики — во вкладке «Тренировка». */
      if(grp==='train'){
        const SIX=['trAim','trSur','trCon','trClu','trExp','trEnd'];
        const at=SIX.indexOf(a.id);
        if(at<0) return a.meta ? '<button class="cc-act g-train'+(can?'':' off')+'" '+(can?'onclick="careerPickDay(\''+a.id+'\')"':'disabled')+'>'+
          '<span class="cc-act-h"><b>'+ccActName(a.id)+'</b><em>'+a.energy+L().ccEnergyMark+'</em></span></button>' : '';
        const k=keys[0], from=six[k]!=null ? six[k] : 50;
        const by=a.gain[k]*dayMult*(dayCoach && dayCoach.keys.indexOf(k)>=0 ? 1+dayCoach.train : 1)*(ccTrainAct(a) ? ccRepeatMult(k) : 1);
        const up=Math.round((clamp(from+by, 35, 99)-from)*10)/10;
        const tip=ccActName(a.id)+' · '+(L()['ccAttr'+k.toUpperCase()]||k)+' '+from.toFixed(1)+(up>0 ? ' → '+(from+up).toFixed(1) : '')+' · '+a.energy+L().ccEnergyMark;
        return (at===0 ? head+'<div class="cc-six">' : '')+
          '<button class="cc-six-t'+(can?'':' off')+(done.indexOf(a.id)>=0?' did':'')+'" title="'+esc(tip)+'" '+
            (can?'onclick="careerPickDay(\''+a.id+'\')"':'disabled')+'>'+
            '<b>'+(L()['ccAttr'+k.toUpperCase()]||k.toUpperCase())+'</b><i>'+Math.floor(from)+'</i>'+
            '<em>'+(maxed||from>=99 ? 'MAX' : up>0 ? '+'+up.toFixed(1) : '·')+'</em><small>'+a.energy+L().ccEnergyMark+'</small></button>'+
          (at===SIX.length-1 ? '</div>' : '');
      }
      return head+'<button class="cc-act g-'+grp+(can?'':' off')+(done.indexOf(a.id)>=0?' did':'')+'" '+
        'title="'+esc(ccActName(a.id)+' · '+(gains+extra.join(' ')).replace(/<\/i>/g, ' · ').replace(/<[^>]+>/g, '').replace(/[\s·]+$/, ''))+'" '+
        (can?'onclick="careerPickDay(\''+a.id+'\')"':'disabled')+'>'+
        '<span class="cc-act-h"><b>'+ccActName(a.id)+'</b><em>'+a.energy+L().ccEnergyMark+'</em></span>'+
        '<span class="cc-act-g">'+gains+extra.join('')+'</span></button>';
    }
    // Вкладка «Тренировка»: занятия плитками карт, остальное строкой (см. CC_DISC).
    {
      const o={can, did:done.indexOf(a.id)>=0, keys, six, dayMult, dayCoach, left, maxed, gainsMove, closed,
               hostWhy:hostWhy==='reach' ? L().ccHostNeedReach(ccNum(CC_HOST_REACH)) : hostWhy==='cash' ? L().ccHostNeedCash(ccNum(ccHostPot()-(cr.balance||0))) : ''};
      const tiles=allActs.filter(x=>ccDiscTile(x.id)), lifes=allActs.filter(x=>!ccDiscTile(x.id));
      if(ccDiscTile(a.id)) return (a===tiles[0] ? '<div class="cc-disc">' : '')+ccDiscTileHTML(a, o)+(a===tiles[0] ? ccChestTileHTML() : '')+(a===tiles[tiles.length-1] ? '</div>' : '');
      return (a===lifes[0] ? '<div class="cc-dlife">' : '')+ccDiscChipHTML(a, o, gains+extra.join(''))+(a===lifes[lifes.length-1] ? '</div>' : '');
    }
  }).join('');
  return '<div class="ch-art cc-day'+(CC_DAY_VIEW==='train' ? ' cc-day-train' : '')+'" style="background-image:url('+ccDayArt()+');">'+
    // Which day it is, beside what is on it: his ask, 17 August.
    '<div class="ch-livebar"><b class="ch-live-soon">'+L().ccDayTag+'</b><span>'+
      esc(ccDayFull(careerToday()))+' · '+(pre ? esc(pre.next.title||pre.next.label||'') : locked ? esc(locked.label) : L().chDayFree)+
      // What it takes to go up, which the ladder tile used to say. It belongs on
      // the day rather than in a standings list: it is the number the week is
      // being played against.
      (CAREER.career.division>1
        ? ' · '+esc(L().chPromote)+' '+careerCupCut(CAREER.career.division)+
          '/'+careerCupSize(CAREER.career.division)
        : '')+
      '</span></div>'+
    '<div class="ch-art-in cc-day-in">'+
      (locked ? '<div class="cc-day-locked">'+esc(locked.why)+'</div>'+
        /* And a way to do something about it, where there is one.

           His call, 19 August: a tournament day with a seat empty is not a free
           day, it is a day with a job on it. The button that finds somebody sits
           on the panel rather than three tabs away, so the answer to "you cannot
           enter this" is in the same place as the sentence. */
        (careerMatesShort() ? '<button class="ch-sign cc-day-find" '+
          'onclick="ccDuoFindOpen()">'+esc(ccSay('ccFindDuo'))+'</button>' : '') : '')+
      (closed ? '<div class="cc-day-locked">'+
                  esc(closedName ? L().ccDayOver(closedName)
                    : woe==='power' ? L().ccPowerNote : L().ccDayOverAny)+
                '</div>' : '')+
      ((cr.sickUntil && careerToday()<cr.sickUntil)
        ? '<div class="cc-day-locked">'+esc(L().ccSickNote(ccDayLabel(cr.sickUntil)))+'</div>' : '')+
      // Отчёт сегодняшнего стрима — тут, а не твитом. См. ветку stream.
      ((cr.streamLast && cr.streamLast.day===careerToday())
        ? '<div class="cc-day-locked cc-day-stream">'+
            esc(L().ccNewsStreamStats.apply(null, cr.streamLast.a))+'</div>' : '')+
      // Отчёт своей кастомки — той же строкой, что и стрим. См. ccHostRun.
      ((cr.hostLast && cr.hostLast.day===careerToday())
        ? '<div class="cc-day-locked cc-day-stream">'+
            esc(L().ccHostReport.apply(null, cr.hostLast.a))+'</div>' : '')+
      // Said where the day is chosen. It used to mean the division's own
      // ceiling; the only one left is the scale's, so it is the last thing a
      // career ever reads rather than something it meets in Division 5.
      (((CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr) >= careerTrainCap()-0.01)
        ? '<div class="cc-day-locked">'+esc(L().ccTrainCapped(careerTrainCap()))+'</div>' : '')+
      evBox+
      (pre ? '<div class="cc-day-locked cc-day-pre">'+esc(L().ccPreNote(pre.next.title||pre.next.label||'', pre.reserve))+'</div>' : '')+
      (typeof ccMpFfOfferHTML==='function' ? ccMpFfOfferHTML() : '')+
      (typeof ccMpCatchUpHTML==='function' ? ccMpCatchUpHTML() : '')+
      // Энергия и настрой: в Центре — двумя кругами, как было; во вкладке «Тренировка» — полосками.
      (CC_DAY_VIEW==='train'
        ? '<div class="cc-bars">'+
            ccMeterHTML(L().ccRingEnergy, left, careerEnergyMax(), 'energy')+
            ccMeterHTML(L().ccRingMood, (careerMateRec() || (typeof ccMpTeam==='function' && ccMpTeam()))?careerPatience():0, 100, 'mood')+
          '</div>'+ccDiscStatsHTML(six)+ccFatigueLineHTML()
        : '<div class="cc-rings">'+
            careerRingHTML(L().ccRingEnergy, left, careerEnergyMax(), 'energy')+
            careerRingHTML(L().ccRingMood, (careerMateRec() || (typeof ccMpTeam==='function' && ccMpTeam()))?careerPatience():0, 100, 'mood')+
          '</div>')+
      /* На Центре день — одной кнопкой (27.10, Notion: скрин панели дня, «слишком много информации будто тут»; его выбор
         «лобби как в Fortnite»): шесть колонок, команда, стрим, отдых и подработка на четыре тарифа уехали во вкладку
         «Тренировка». Здесь — что уже сделано сегодня и кнопка туда с остатком энергии. */
      (CC_DAY_VIEW==='train'
        ? '<div class="cc-acts">'+rows+'</div>'+(pre ? '' : careerJobHTML(closed, left))
        : ccDayGoHTML(done, closed, left))+
      // The day ends when the player says so, and it can be said as soon as
      // anything has been done: a day nobody decided may as well not be in the
      // calendar, and after that it is theirs to keep spending or to close.
      /* «Выбери, на что уходит день» — только про день, который ещё можно
         выбрать. Вечер без света закрывает день раньше любого выбора: did
         пуст, spent=false, и подсказка вставала на место кнопки при мёртвых
         кнопках занятий — идти дальше было нечем. Скриншот:
         «когда свет вырубают нету кнопки следующий день». Закрытый день
         отдаёт кнопку сразу. */
      // День турнира кончается турниром: вместо «Следующий день» - кнопка к нему.
      (pre ? '<button class="ch-play" onclick="careerTab(\'centre\')">'+esc(L().ccPreGo)+'</button>'
      : !spent && !closed
              ? '<div class="cc-day-hint">'+L().ccDayMust+'</div>'
              : '<button class="ch-play ch-nextday" onclick="careerNextDayTap(this)">'+L().ccDayDone+(typeof ccMpNextTag==='function' ? ccMpNextTag() : '')+'</button>')+
      // И «до турнира» — в любой день, решённый или нет: см. careerSkipToBtnHTML.
      (pre ? '' : typeof careerSkipToBtnHTML==='function' ? careerSkipToBtnHTML() : '')+
      /* Упавший день говорит, что именно сломалось.

         Отчёт игрока: «everything froze when I pressed the
         button… every time I pressed it, everything would freeze again and I
         had to leave the site». Страница и правда вставала намертво: исключение
         внутри careerAdvanceBody уходило из careerNextDay наверх, и до
         careerSave с careerRenderHub дело не доходило вовсе — день не двигался,
         экран не перерисовывался, а на кнопке это выглядело как зависание. Один
         и тот же сейв ломался каждый раз, потому что и день был тот же самый.

         Теперь ошибка ловится: день остаётся на месте (наполовину прошагавший
         день хуже непрошагавшего), хаб рисуется дальше, а под кнопкой стоит
         красная строка с текстом. Ровно то же решение, что у перемотки —
         см. CC_FF.err и .cc-ffo-err. */
      (CC_DAY_ERR ? '<div class="cc-ffo-err"><b>'+esc(L().ccDayBroke(ccDayLabel(CC_DAY_ERR.day)))+'</b>'+
                    '<span>'+esc(CC_DAY_ERR.text||'-')+'</span></div>' : '')+
    '</div></div>';
}
function careerPickDay(id){
  if(!careerDoAct(id)) return;
  careerRenderHub(CH_TAB==='train' ? 'train' : 'centre');
  // После отдыха экран сверху: перерисовка хранит прокрутку, и шапка с днём оставалась за краем.
  const act=ccActById(id);
  if(act && act.rest) ccHubToTop();
}
function ccHubToTop(){
  try{ const b=document.getElementById('chBody'); if(b){ b.scrollTop=0; if(b.parentElement) b.parentElement.scrollTop=0; } window.scrollTo(0, 0); }catch(e){}
}
/* Вкладка «Тренировка»: атрибуты крупными карточками и занятия дня. День открыт для выбора
   тогда же, когда Центр рисует панель дня (свободный день или закрытый для игры вечер). */
let CC_DAY_VIEW='';
function ccCentreDayOpen(){
  const cr=CAREER.career, next=careerNext();
  const playable=careerCanPlay(next) && !cr.seasonOver;
  return !cr.seasonOver && (next.type==='free' || (!playable && !ccMpBlockWhy() && !ccRaceModeWhy()));
}
function careerTrainTabHTML(){
  const six=CAREER.player.attrs || ccOwnAttrs();
  // Сначала карты, под ними план недели и таблица Noble (если на неделе были сессии).
  const noble=ccNobleBoardHTML();
  const below=ccWatchTileHTML()+ccRkTileHTML()+ccTrainPlanHTML()+(noble ? '<div class="ch-tile tw-tile"><h4>'+(ccCareerRegion()==='EU' ? '<img class="tw-noble-ic" src="items/creative/noble-crown.png" alt="">Noble Practice' : esc(ccPracSrv()))+'</h4>'+noble+'</div>' : '');
  if(ccCentreDayOpen() || ccPreEvent()){
    CC_DAY_VIEW='train';
    try{ return '<div class="cc-train-tab">'+careerDayPanelHTML(null)+below+'</div>'; } finally{ CC_DAY_VIEW=''; }
  }
  const cr=CAREER.career, next=careerNext();
  return '<div class="cc-train-tab"><div class="ch-art cc-day cc-day-train" style="background-image:url('+ccDayArt()+');">'+
    '<div class="ch-livebar"><b class="ch-live-soon">'+L().ccDayTag+'</b><span>'+esc(ccDayFull(careerToday()))+'</span></div>'+
    '<div class="ch-art-in cc-day-in">'+ccDiscStatsHTML(six)+
    '<div class="cc-day-locked">'+esc(cr.seasonOver ? L().ccSeasonOver : L().lfTrainEventDay(next.title||''))+'</div>'+
    (ccChestOn() ? '<div class="cc-disc">'+ccChestTileHTML()+'</div>' : '')+
    '<button class="ch-play" onclick="careerTab(\'centre\')">'+esc(L().lfTrainToCentre)+'</button>'+
    '</div></div>'+below+'</div>';
}
