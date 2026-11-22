/*@@PART js/career/online.js@@*/
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
let CC_RACE_POW_NOW=null, CC_RACE_POW_SEED=null;
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
/* Секрет места в лобби — рядом с адресом, в том же браузере: сервер отдаёт место только тому, кто знает секрет. */
function ccMpKey(){
  var slot=(typeof ccSlotMine==='function') ? ccSlotMine() : 1;
  var k='fncsdraft_mp_k'+(slot>1 ? '_s'+slot : '');
  var v=null; try{ v=localStorage.getItem(k); }catch(e){}
  if(!v || !/^[A-Za-z0-9]{16,64}$/.test(v)){
    var a=new Uint8Array(16), A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; v='';
    try{ crypto.getRandomValues(a); }catch(e){ for(var i=0;i<16;i++) a[i]=Math.floor(Math.random()*256); }
    for(var j=0;j<a.length;j++) v+=A[a[j]%62];
    try{ localStorage.setItem(k, v); }catch(e){ return ''; }
  }
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
  /* Строка без силы (напарников меньше мест, первый вечер): база карточек плюс форма и сыгранность владельца, как
     складывает его careerYouTeam. Раньше не-соло брал голую базу: прод 18.11b, daki+nocif 99 у соседа, 103 у себя. */
  else t.pow=Math.round(t.pow+(Number(p.card.formPow)||0)+(solo ? 0 : (Number(p.card.chemPow)||0)));
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
let CC_RACE_DBG=null;   // для проб: сколько людей и ботов вышло в комнате
/* КОМНАТА НЕ ПЕРЕСЫЛАЕТСЯ, А СОВПАДАЕТ. Первая версия возила ботов хозяина по проводу;
   замер (tools/race-field-size-probe.js) показал 162 КиБ на кубке Д1 при лимите Durable
   Object в 128 КиБ на значение — лента вечера просто не сохранилась бы. Теперь бот-поле
   у всех строится одинаково само: сид комнаты общий (CC_MP_SEED в careerSeed), а
   соперники со своими напарниками вычитаются из пула у каждого (ccRaceAllCards). Здесь
   остаётся только посадить людей в один порядок и подрезать поле под размер лобби. */
/* Свежие строки соперников — с силой ЭТОГО вечера (ev = сид вечера). Своя уходит
   здесь же, когда команда вечера уже посчитана раннером; чужие ждутся до
   CC_RACE_LINE_WAIT, потом комната строится с тем, что есть (сверка игры это
   поймает и скажет, где разошлось). */
const CC_RACE_LINE_WAIT=90000;
async function ccRaceWaitLines(){
  const ev=(typeof CC_MP_SEED!=='undefined') ? CC_MP_SEED : null;
  if(!ev) return true;
  // Вне сеяного потока: упаковка карточек не должна тратить броски вечера.
  try{ ccRaceUnseeded(()=>careerRaceSend()); }catch(e){}
  const fresh=()=>ccRaceRoom().every(p=>p && p.ev===ev);
  const t0=Date.now();
  /* Ожидание — не расчёт: пока ждём, общий сид никому не отдаётся (ccMpIdle),
     иначе чат эфира и таймеры хаба тратили бы сеяные броски у того, кто ждёт
     дольше. Скриншоты (2f2dcb12): «table,rolls @ #7», «peer ahead». */
  while(!fresh() && Date.now()-t0<CC_RACE_LINE_WAIT){
    if(typeof CC_MP_HOLD!=='undefined' && CC_MP_HOLD) break;   // вечер уже расходится/остановлен
    await ccMpIdle(new Promise(r=>setTimeout(r, 100)));
  }
  if(!fresh() && typeof CC_RACE_DBG!=='undefined') CC_RACE_DBG={stale:ccRaceRoom().filter(p=>p.ev!==ev).map(p=>(p.card||{}).handle)};
  return fresh();
}
async function ccRaceFieldSync(teams, opts){
  if(!ccRaceLock() || typeof MP==='undefined') return;
  const you=teams.find(t=>t.isYou);
  // Сила на вечер — из поля раннера; только с ней строка подписывается сидом (см. CC_RACE_POW_NOW).
  // Пара: своя команда — две карточки людей, одна и та же у обоих (см. ccRacePairTeamInto).
  if(typeof ccRacePairOn==='function' && ccRacePairOn() && you) ccRacePairTeamInto(you);
  /* Строка подписана сидом вечера, а сид у всех стадий вечера один: на второй стадии (второй раунд, следующая игра
     оценки) соседи уже держат строку с первой и не ждут новую. Поэтому сила своей команды на весь вечер — та, что
     опубликована на первой стадии: у себя и у соседей одна и та же (прод 18.11, гонка: «lovero …:87 vs …:88» на игре 2). */
  if(you && you.pow!=null){
    const sd=(typeof CC_MP_SEED!=='undefined') ? CC_MP_SEED : null;
    if(CC_RACE_POW_NOW!=null && sd && CC_RACE_POW_SEED===sd){ you.pow=CC_RACE_POW_NOW; if(CC_RACE_EDGE_NOW!=null) you.closeEdge=CC_RACE_EDGE_NOW; }
    else { CC_RACE_POW_NOW=you.pow; CC_RACE_EDGE_NOW=(you.closeEdge||0); CC_RACE_POW_SEED=sd; }
  }
  await ccRaceWaitLines();
  /* Соперники — все, кто прислал строку; уже посаженный раннером (соло-кап) — тот же
     объект. КОМНАТА ПРОШЕДШИХ (opts.roomOnly — второй раунд Victory Cup) никого не
     досаживает: соперник, вылетевший в первом раунде, в ней зритель, а не команда.
     Скриншоты: у прошедшего в поле «dimcho+liveb:62», у вылетевшего —
     нет, «diff 429 of 430» на первой же игре второго раунда. */
  /* И ПО КАРТОЧКАМ, не только по адресу: поле, собранное из записей прошлой стадии (финал
     Саммита из cr.summitSeed, Глобалы, ЛАН), содержит команду соперника как обычную команду
     сцены — без mpTag. Она оставалась ботом, а соперник досаживался второй раз: у каждого
     клиента своё поле («diff 2 of 50: #5 pixie+swizzy vs live1+sky», годовая проба 9.09,
     финал Саммита 31.05). Такая команда и есть соперник: адрес, сила и край — из строки. */
  const hasCard=(t, card)=>{ const k=hKey(card); return (t.squad||t.cards||[]).some(c=>c && hKey(c)===k); };
  const myPair=(typeof ccRacePairOn==='function' && ccRacePairOn()) ? ccRacePairId() : null;
  const rivals=ccRaceRoom().map(p=>{
    // Мой напарник по паре — это моя команда, второй раз он не садится.
    if(myPair && p.id===myPair) return null;
    // Чужая пара садится по строке старшего (первого по hKey); строка младшего — не команда.
    if(p.pair){ const q=CC_RACE_PEERS[p.pair]; if(q && q.card && q.pair===p.id && hKey(q.card)<hKey(p.card)) return null; }
    const tag=':'+hKey((p.pair && (p.mates||[])[0] && hKey(p.mates[0])<hKey(p.card)) ? p.mates[0] : p.card);
    const same=teams.find(t=>t.mpTag===tag && !t.isYou) || teams.find(t=>!t.isYou && !t.isMate && !t.isRival && hasCard(t, p.card));
    if(same){ same.isRival=true; same.isMate=false; same.raceId=p.id||same.raceId||null; same.mpTag=tag;
              if(p.pow!=null) same.pow=p.pow; if(p.edge!=null) same.closeEdge=p.edge;
              /* attrs команды берём из строки владельца, а не из своей сцены.
                 Сила и край переписывались строкой владельца, а attrs нет, хотя skill и seek считаются из attrs (createSquads в zone-sim) и двигают выход из круга без бросков. Вечера расходились при равном поле.
                 Владелец присылает _attrs каждой карточки (ccRacePackCard), команду собираем тем же ccRaceRivalTeam и берём у неё вход движка. Остальное (очки прошлой стадии) остаётся своим. */
              const rt=ccRaceUnseeded(()=>ccRaceRivalTeam(p));
              if(rt && rt.attrs) same.attrs=rt.attrs;
              return same; }
    if(opts && opts.roomOnly) return null;
    return ccRaceUnseeded(()=>ccRaceRivalTeam(p));
  }).filter(Boolean);
  const humans=[you].concat(rivals).filter(Boolean).sort((a,b)=>String(a.mpTag||a.name)<String(b.mpTag||b.name) ? -1 : 1);
  const size=teams.length;
  // Бот с карточкой человека комнаты — двойник, его в поле нет (людей уже посадили выше).
  const hk=new Set(); humans.forEach(h=>(h.squad||h.cards||[]).forEach(c=>{ if(c) hk.add(hKey(c)); }));
  const bots=teams.filter(t=>!t.isYou && !t.isRival && !t.isMate && humans.indexOf(t)<0 && !(t.squad||t.cards||[]).some(c=>c && hk.has(hKey(c))))
                  .slice(0, Math.max(0, size-humans.length));
  teams.length=0; humans.forEach(h=>teams.push(h)); bots.forEach(b=>teams.push(b));
  CC_RACE_DBG={n:teams.length, humans:humans.map(h=>h.mpTag), bots:bots.length};
}
// Плитка гонки на центре хаба: таблица, кто впереди, и код для второго.
function careerRaceTileHTML(){
  if(!ccRaceOn()) return '';
  const rows=careerRaceRows();
  const code=CAREER.career.race.code;
  const alone=rows.length<2;
  /* Строка участника — как карточка человека, а не строка таблицы: маленькая
     аватарка, ник и клуб, под ними дивизион, деньги и PR, справа рейтинг
     плашкой. Отзыв: «красиво оформить, когда заходят, чтоб иконку
     аватарки маленькую показывало и рейтинг». Портрет — по нику и региону
     карточки из сводки (photoURL), у кого портрета нет — инициалы. Первый в
     таблице отмечен короной. */
  const line=(r,i)=>{
    const card=r.card ? {handle:r.card.handle, region:r.card.region} : null;
    return `<div class="cc-race-row${r.you?' me':''}${i===0&&rows.length>1?' lead':''}${r.you||!r.id?'':' cc-race-tap'}"${r.you||!r.id?'':` onclick="ccRaceRowToggle('${jsq(r.id)}')"`}>
      ${ccAvatar({name:r.nick||'?', card:card, you:!!r.you})}
      <span class="cc-race-in"><b>${esc(r.nick||'')}${r.org?`<i>${esc(r.org)}</i>`:''}</b>
        <em>${L().ccDivision} ${r.div} · ${ccMoney(r.money||0)}${r.pr?' · PR '+ccNum(r.pr):''}${
          // Режим участника — глаз (симуляция) или геймпад (играет): разные режимы держат вечер.
          (r.you ? (careerSimOn() ? ' · &#128065;' : ' · &#127918;')
                 : (r.card && r.card.sim!=null ? (r.card.sim ? ' · &#128065;' : ' · &#127918;') : ''))}</em></span>
      <span class="cc-race-ovr" title="${esc(L().ccRoOvr)}">${r.ovr}</span>
      ${(typeof ccRacePairRowHTML==='function') ? ccRacePairRowHTML(r) : ''}
    </div>${(typeof ccRacePairPaneHTML==='function') ? ccRacePairPaneHTML(r) : ''}`; };
  const pairLine=(function(){ if(typeof ccRacePairOn!=='function' || !ccRacePairOn()) return ''; const p=ccRacePairPeer();
    return `<div class="ch-row"><em>${esc(L().ccRacePairWith.trim())}</em><b class="ch-goal-met">${esc((p.card&&p.card.handle)||'')}</b></div>`; })();
  return `<div class="ch-tile cc-race">
    <h4>${L().ccRaceTitle}</h4>
    <div class="ch-row"><em>${L().ccMpCode}</em><b>${esc(code)}</b></div>
    ${ccMpInviteHTML(code)}
    <div class="ch-row"><em>${L().ccMpLink}</em><b class="${ccRaceLive()?'ch-goal-met':''}">${
      ccRaceLive() ? L().ccMpLive : L().ccMpLost}</b></div>
    ${(function(){ const why=ccRaceApartWhy(typeof careerNext==='function' ? careerNext() : null);
       return `<div class="ch-row"><em>${L().ccRaceRoom}</em><b class="${why?'':'ch-goal-met'}">${
         why ? esc(L().ccRaceRoomOff(L()['ccRaceWhy'+why]||'')) : esc(L().ccRaceRoomOn)}</b></div>`; })()}
    ${pairLine}
    ${rows.map(line).join('')}
    ${(typeof ccRacePairBelowHTML==='function') ? ccRacePairBelowHTML(rows) : ''}
    ${alone ? `<div class="ch-empty">${L().ccRaceAlone}</div>`
            : `<div class="ch-hint">${esc(rows[0].you ? L().ccRaceAhead : L().ccRaceBehind(rows[0].nick||''))}</div>`}
    ${/* День общий: пока соперник не закрыл свой, календарь стоит. И дверь
          наружу, если он ушёл спать. См. ccRaceHold. */''}
    ${ccRaceWaiting() ? `<div class="ch-hint cc-race-wait">${esc(L().ccRaceWait)}</div>
      <button class="ch-sign" onclick="ccRaceGoAlone()">${esc(L().ccRaceAloneGo)}</button>` : ''}
    <button class="ch-decline" onclick="careerRaceLeave()">${L().ccRaceLeave}</button>
  </div>`;
}
let CC_CODE_GO=null;
function ccCodeOpen(go){
  const m=document.getElementById('ccCodeModal');
  if(!m){ const c=prompt(L().ccMpAskCode); if(c && /^[A-Za-z0-9]{6}$/.test(c.trim())) go(c.trim().toUpperCase()); return; }
  CC_CODE_GO=go;
  document.getElementById('ccCodeTitle').textContent=L().ccCodeTitle;
  document.getElementById('ccCodeHint').textContent=L().ccCodeHint;
  document.getElementById('ccCodeNo').textContent=L().ccDecline;
  document.getElementById('ccCodeYes').textContent=L().ccCodeGo;
  const inp=document.getElementById('ccCodeInput');
  inp.value=''; document.getElementById('ccCodeYes').disabled=true;
  m.style.display='flex';
  document.addEventListener('keydown', ccCodeKey);
  setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 30);
}
function ccCodeTyped(){
  const inp=document.getElementById('ccCodeInput');
  const v=String(inp.value||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,6);
  if(inp.value!==v) inp.value=v;
  document.getElementById('ccCodeYes').disabled=!(v.length===6);
}
function ccCodeGo(){
  const v=String(document.getElementById('ccCodeInput').value||'').trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(v)) return;
  const go=CC_CODE_GO; ccCodeClose();
  if(go) go(v);
}
function ccCodeClose(){
  const m=document.getElementById('ccCodeModal');
  if(m) m.style.display='none';
  CC_CODE_GO=null;
  document.removeEventListener('keydown', ccCodeKey);
}
function ccCodeKey(e){ if(e.key==='Escape') ccCodeClose(); }
/* Командная карьера заводится ТОЛЬКО с нуля.

   Перенести начатую одиночную в команду нельзя (это отдельная работа, её нет в
   первой версии), поэтому дверь ведёт в создание — а если слот занят, сначала
   на выбор слота, ровно как careerEntry. */
function ccMpStartNew(){
  if(careerExists() || ccSlotCard(ccSlot())) openCareerSlots();
  else openCareerCreate();
}
/* Хеш таблицы — то, чем два клиента сверяют вечер.

   Считается по числам, а не по именам: имена у обоих одни и те же, но
   сравнивать надо результат, а не подписи. Порядок строк уже задан сортировкой
   таблицы, поэтому дополнительной сортировки здесь нет — если порядок
   разъехался, это и есть расхождение, и хеш обязан его показать. */
/* Подпись ПОЛЯ — состав и сила каждой команды, а не только очки.

   На старте этапа таблица — одни нули, и её хеш совпадает у двоих при
   любом составе комнаты: расхождение поля вылезало только через игру, как
   «разошлись на игре 2». Отчёты: Перфоманс и Solo Series
   расходятся, Victory и кубок Д1 — нет; живой сторож на свежих вкладках
   сходится везде, значит дело в состоянии вкладок — и первый вопрос «то же
   ли поле» должен отвечаться на первой же игре. Сюда же остров: раннеры
   берут его из ACTIVE_LANDING_SET, а это состояние вкладки. */
// Люди поля поимённо с силой: в подписи поля они сортированы и безымянны (h82+88), здесь видно, чья сила разошлась. Только для показа.
function ccMpHumansTag(teams){
  try{ return ' H'+(teams||[]).filter(function(t){ return t.isYou||t.isMate||t.isRival; })
    .map(function(t){ return String(t.mpTag||t.name||'?').replace(/[|\s]/g,'').slice(0,14)+':'+Math.round(t.pow||0); }).sort().join(','); }catch(e){ return ''; }
}
function ccFieldSig(teams){
  // По никам (в одном порядке — у дуо состав у каждого свой первый), не по имени:
  // своя строка подписана «Твой состав», а у напарника в соло она без подписи.
  var s=(teams||[]).map(function(t){ var sq=(t.squad||[]).map(hKey).sort().join('+'); return (sq||String(t.name||''))+':'+Math.round(t.pow||0); }).join('|');
  // Люди отдельно: «n·h102+98» — сколько команд и какая сила у своих; расхождение читается без хеша.
  // В гонке «свои» — обе команды людей, и порядок у каждого свой (моя первая), поэтому силы сортируются.
  var hum=(teams||[]).filter(function(t){ return t.isYou||t.isMate||t.isRival; }).map(function(t){ return Math.round(t.pow||0); }).sort(function(a,b){ return a-b; }).join('+');
  return (CC_MP_NIGHT ? CC_MP_NIGHT+'.' : '')+String(ccHashStr(s))+'.'+String(typeof ACTIVE_LANDING_SET!=='undefined' ? ACTIVE_LANDING_SET : '')+'.'+
         String(typeof ALL_LANDING_ZONES!=='undefined' ? ALL_LANDING_ZONES.length : 0)+'.n'+(teams||[]).length+'h'+hum;
}
/* Верх таблицы словами: восемь лучших строк «очки.победы.килы» — когда хеши
   разошлись, видно, у кого что. Его снимок 29 августа: «table» при равных
   бросках и равном поле — и ни одной цифры. */
function ccTableTop(teams){
  var top=(teams||[]).slice().sort(function(a,b){ return (b.stagePts||0)-(a.stagePts||0) || (b.wins||0)-(a.wins||0) || (b.stageElims||0)-(a.stageElims||0); }).slice(0, 8);
  // Без пометки своей строки: у двоих «своя» — разные строки, и сумма расходилась бы на ровном месте.
  return top.map(function(t){ return (t.stagePts||0)+'.'+(t.wins||0)+'.'+(t.stageElims||0); }).join(' ');
}
function ccTableHash(ranked){
  var s=(ranked||[]).map(function(t,i){
    return i+':'+(t.stagePts||0)+':'+(t.wins||0)+':'+(t.stageElims||0);
  }).join('|');
  return String(ccHashStr(s));
}
/* Вечер сыгран — оба сверяются и ждут закрытия от сервера.
   Расхождение решает сервер: истиной становится версия, пришедшая первой.
   Спорить бессмысленно — у игрока на экране всё равно должно оказаться то же,
   что у напарника. Сторож — tools/check-mp-close.js. */
function ccMpClose(ranked){
  if(!ccMpLock() || typeof MP==='undefined') return Promise.resolve();
  return new Promise(function(res){
    /* Закрытие вечера тоже не ждёт вечно. Сервер закрывает вечер, когда пришли оба хеша; если второй не придёт
       (обрыв, закрыли вкладку), клиент висел бы после последней игры с таблицей и без кнопок.
       Выход по таймауту или по обрыву связи (ccMpLinkLost будит ждущих). Состояние от сервера не пришло, поэтому день
       не сдвинется (careerAdvanceTo не пустит), игрок уходит в хаб с причиной на плитке и разрывом дуо. */
    var t=null, off=null, done=false;
    var finish=function(m){
      if(done) return;
      done=true;
      if(t) clearInterval(t);
      if(off) off();
      // Вечер закрыт — генератор вкладки возвращается себе.
      MP.closing=false;
      CC_MP_REPLAY=false;
      ccMpSeedOff();
      if(m && m.team) ccApplyTeamState(m.team);
      CC_MP_DAY_DUE=true;            // раннер сразу за этим двигает день
      CC_MP_HOLD=true;               // и до того шага наверх ничего не уходит
      /* После выхода из вечера состояния у двоих разные: на хабе оба просят синхронизацию,
         и следующий вечер начинается из одного состояния. См. ccMpSplitLeave. */
      if(CC_MP_LEAVE){ CC_MP_LEAVE=false; CC_MP_LEFT=false; CC_MP_SKIP_CLOSE=true; ccMpSyncAfterApart(); }
      res();
    };
    off=MP.on('close', finish);
    var giveUp=function(){
      if(done) return;
      if(!CC_MP_LEAVE) ccMpSlowSeen();
      finish(null);
    };
    // Вышли из вечера — закрываем своим столом, сервер не ждём (хеш всё равно уходит).
    if(CC_MP_LEAVE){ try{ MP.digest(ccTableHash(ranked), ccTeamState()); }catch(e){} finish(null); return; }
    giveUp.onlyLost=true;          // см. ccMpPeerDone
    t=ccMpDeadline(giveUp);
    CC_MP_WAITERS.push(giveUp);
    MP.closing=true;
    MP.digest(ccTableHash(ranked), ccTeamState());
  });
}
/* Голосуют оба: совпали, это решение, разошлись, монетка. Монетка обязана лечь
   одинаково: она из сида вечера (Math.random подменён, см. ccMpSeedOn), оба
   доходят до неё в одном месте потока, пара сортируется по ключу игрока, а не по
   порядку прихода. Возвращаем и `mine`: высадке надо знать, кто ставил метку.
   Голос напарника мог прийти раньше, поэтому сначала смотрим очередь mp.js,
   потом подписываемся. Сторож tools/check-mp-relay.js. */
/* Вопрос открывается, когда до него дошли оба.
   Анимация у двоих идёт разным темпом, и быстрый видел выбор раньше. Поэтому сначала оба шлют «дошёл», окно открывается от одного сообщения сервера, потом вечер как раньше ждёт двух голосов. Цена: круг по сети на вопрос, их ~3 на игру.
   Потолок ожидания 3 минуты (это «закрыл ноутбук»). При 8 секундах быстрый клиент упирался в него каждую игру, матч проигрывается десятки секунд, и отрыв копился.
   Срабатывание потолка показываем (ccMpSlowSeen). Если голос напарника уже пришёл, барьер пропускаем. */
/* Восемь минут тишины, не три. Скриншот (5ceda95b): шесть игр
   сошлись, на седьмой «peer ahead» — соперник прошёл барьер один. Пробы того же
   вечера (скип у одного, скип ни у кого, большое поле) сходятся, значит это не
   расчёт, а ожидание: телефон с погашенным экраном замораживает JS вместе с
   пульсом, а сокет живёт — и через три минуты второй уходил вперёд. Закрытый
   ноутбук так не выглядит: там сокет падает, сервер шлёт bye, и ожидание
   отпускается событием, как и раньше. Абсолютный предел CC_MP_SYNC_MAX остался. */
const CC_MP_SYNC_MS=480000;
/* Потолок ожидания — на ТИШИНУ напарника, а не на время вообще.

   Скриншот (страница «neeww»): вечер сошёлся до очка, а красная
   строка говорит «timeout · q late#1» — этот клиент три минуты ждал ответа на
   восьмую зону и решил сам. Напарник был жив и досматривал игру, просто
   медленно: вкладка в фоне (пока он снимал экран) — и Chrome душит таймеры
   показа до кадра в секунду. Три минуты — это «он закрыл ноутбук», и мерить
   ими медленный показ нельзя.

   Поэтому теперь ждём, пока напарник ПОДАЁТ ГОЛОС: раз в CC_MP_HB_MS он шлёт
   пульс (см. ccMpHeartbeat), и любое его сообщение обновляет MP.peerSeen.
   Потолок срабатывает, когда его не слышно CC_MP_SYNC_MS подряд, и есть
   абсолютный предел CC_MP_SYNC_MAX — на случай, если жив только пульс.
   Событийные выходы (он досчитал, связь упала) — как были. */
const CC_MP_HB_MS=15000, CC_MP_SYNC_MAX=15*60000;
/* Потолок ожидания в ГОНКЕ короче: комната на шестерых расходится чаще, чем пара, и каждое
   застревание стоило четверть часа (вопрос: «почему такие долгие прогоны»). Пульсы
   соседей сбрасывают тишину, так что до потолка доходит любое настоящее расхождение. */
const CC_MP_SYNC_MAX_RACE=4*60000;
function ccMpSyncMax(){ return (typeof ccRaceOn==='function' && ccRaceOn() && !(typeof ccMpTeam==='function' && ccMpTeam())) ? CC_MP_SYNC_MAX_RACE : CC_MP_SYNC_MAX; }
/* Напарник ВЫШЕЛ из вечера — пульс живой, но говорит «вечера нет» (rand:false):
   его перемотка встала, он в хабе, а мы ждём его на барьере. Ждать нечего —
   отпускаем через CC_MP_LEAVE_MS, как обрыв. Закрытие (onlyLost) не трогаем:
   после close он и должен быть без вечера. Его снимок 29 августа: «ждём
   голос напарника… 21 с» — и так до потолка. */
let CC_MP_LEAVE_MS=40000;
function ccMpPeerLeft(){
  if(!CC_MP_RAND || typeof MP==='undefined') return false;
  /* Гонка: «вышли» — это когда НИКТО из комнаты вечера не считает. Пульс читается по
     каждому (MP.peerHbs); один слот отдавал пульс того, кто в этот вечер не играет
     (не прошёл play-in, шагает дальше, rand:false), и барьеры отпускались через 40 с у
     всех играющих — годовая проба на шестерых 8.09, Reload play-in 23 января. */
  if(typeof ccRaceOn==='function' && ccRaceOn() && !ccMpTeam()){
    var room=(typeof ccRaceRoom==='function') ? ccRaceRoom() : [];
    /* Комната пуста — все соперники уже ушли дальше по календарю (или закрыли день):
       ждать приходов некого. Годовая проба 9.09: клиент с полуоткрытым сокетом застрял на
       седьмой игре, остальные доиграли и ушли на неделю вперёд — а он стоял до потолка,
       потому что пустая комната читалась как «никто не вышел». */
    if(!room.length) return (typeof ccRaceRivals==='function') && ccRaceRivals().length>0;
    var hbs=MP.peerHbs||{};
    return room.every(function(p){ var h=hbs[p.id]; return h && h.rand===false; });
  }
  var hb=MP.peerHb || null;
  return !!(hb && hb.rand===false);
}
/* ВЗАИМНОЕ ОЖИДАНИЕ (скрин тестера 1.10, Katowice 2019 вдвоём: «просто зависло»). Вечера разошлись ещё в
   первой игре, и во второй оба стояли на РАЗНЫХ барьерах — каждый ждал другого у своего вопроса, а пульс
   у обоих живой, так что потолок тишины (8 мин) не срабатывал. Теперь пульс несёт, у какого вопроса
   клиент ждёт (w, CC_MP_CUR_Q), и если напарник ждёт у другого вопроса дольше CC_MP_DEADLOCK_MS, это
   тупик: вечер отпускается сразу, с красной строкой и кнопкой «выйти обоим» (ccMpSplitSeen). Только
   командная пара: в гонке ждущих много. Ожидание закрытия (onlyLost) не трогается. */
let CC_MP_CUR_Q='', CC_MP_WAIT_AT=0;
const CC_MP_DEADLOCK_MS=45000;
function ccMpWaitingQ(){ return ((new Date()).getTime()-CC_MP_WAIT_AT<3000) ? CC_MP_CUR_Q : ''; }
function ccMpDeadline(fn, ms){
  var cap=ms||CC_MP_SYNC_MS, start=(new Date()).getTime();
  var dlKey=null, dlAt=0;
  /* Потолок считается от ПОСЛЕДНЕГО ДВИЖЕНИЯ соседей, а не от начала ожидания: пульс несёт игру
     и номера вопросов (g, q), и пока они меняются, сосед считает, а не стоит. Шесть Chrome на одной
     машине отстают друг от друга на игру, и 4-минутный потолок гонки срезал живое ожидание
     (проба 9.09 15:28: Reload 12.06, «timeout · q own:live3#7», сосед был на игру позади). */
  var sig=null;
  var progress=function(){ try{ var hbs=(typeof MP!=='undefined' && MP.peerHbs)||{}; var s2=Object.keys(hbs).sort().map(function(k){ var h=hbs[k]||{}; return k+':'+(h.g||0)+'/'+(h.q||''); }).join('|'); if(s2!==sig){ sig=s2; return true; } }catch(e){} return false; };
  progress();
  var id=setInterval(function(){
    var now=(new Date()).getTime();
    if(progress()) start=now;
    var seen=(typeof MP!=='undefined' && MP.peerSeen) ? MP.peerSeen : 0;
    var quiet=now-Math.max(start, seen);
    if(!fn.onlyLost){
      CC_MP_WAIT_AT=now;
      try{
        var ph=(typeof MP!=='undefined' && MP.peerHb) || null;
        var team=(typeof ccMpTeam==='function') ? ccMpTeam() : true;
        var race=(typeof ccRaceOn==='function' && ccRaceOn() && !team);
        if(!race && ph && ph.w && CC_MP_CUR_Q && ph.w!==CC_MP_CUR_Q && MP.peerSeen && now-MP.peerSeen<25000){
          var k=ph.w+'|'+CC_MP_CUR_Q;
          if(dlKey!==k){ dlKey=k; dlAt=now; }
          else if(now-dlAt>=CC_MP_DEADLOCK_MS){
            clearInterval(id); ccMpPassed('deadlock');
            try{ ccMpSplitSeen(CC_MP_GAME||'?', 'deadlock · me '+CC_MP_CUR_Q+' · peer '+ph.w+' · '+CC_BUILD); }catch(e){}
            try{ fn(); }catch(e){}
            return;
          }
        } else dlKey=null;
      }catch(e){}
    }
    var left=!fn.onlyLost && now-start>=CC_MP_LEAVE_MS && ccMpPeerLeft();
    if(left){ try{ ccMpTell(L().ccMpLeft); }catch(e){} }
    if(left || quiet>=cap || now-start>=ccMpSyncMax()){ clearInterval(id); ccMpPassed(left ? 'left' : quiet>=cap ? 'cap' : 'max'); try{ fn(); }catch(e){} }
  }, 1000);
  return id;
}
let CC_MP_HB=null;
function ccMpHeartbeat(on){
  if(CC_MP_HB){ clearInterval(CC_MP_HB); CC_MP_HB=null; }
  if(!on || typeof MP==='undefined' || !MP.act) return;
  // Пульс несёт, где напарник: день, игра, номера вопросов, перемотка ли. Показывается в окне ожидания.
  CC_MP_HB=setInterval(function(){ try{ MP.act('hb', {by:ccMpId(), day:careerToday(), g:CC_MP_GAME||0, ff:!!(typeof CC_FF!=='undefined' && CC_FF), q:ccMpQnLine(), w:ccMpWaitingQ(), rand:!!CC_MP_RAND, lv:ccRaceLiveMine()}); }catch(e){}
    try{ ccRaceLiveDraw(); }catch(e){}
    // Своё предложение перемотки повторяется с пульсом: сосед, чья вкладка спала или связь рвалась, его увидит.
    try{ const p=(typeof ccMpFfPending==='function') ? ccMpFfPending() : null; if(p && p.mine && !(typeof CC_FF!=='undefined' && CC_FF)) MP.act('ff', {by:ccMpId(), day:p.day, until:p.until}); }catch(e){} }, CC_MP_HB_MS);
}
/* Соперник по гонке в ДРУГОМ турнире: его вечер едет в пульсе (lv), над своей таблицей строка «где он сейчас».
   Пульс не идёт в очередь решений вечера (mp.js отдаёт hb раньше), локстеп он не трогает. */
function ccRaceLiveMine(){
  if(!(typeof ccRaceOn==='function' && ccRaceOn()) || !CAREER_RUN || typeof document==='undefined') return null;
  const you=CC_TV_YOU, el=document.getElementById('finalsLiveTitle');
  if(!you || !el) return null;
  const log=you.stageLog||[];
  return {t:String(el.textContent||'').slice(0, 90), pts:you.stagePts||0, last:log.length ? (log[log.length-1].place||0) : 0, w:you.wins||0};
}
function ccRaceLiveDraw(){
  const el=typeof document!=='undefined' && document.getElementById('ccRivalLive'); if(!el) return;
  const mine=(document.getElementById('finalsLiveTitle')||{}).textContent||'', T=L(), hbs=(typeof MP!=='undefined' && MP.peerHbs) || {};
  const rows=(typeof ccRacePeers==='function' ? ccRacePeers() : []).map(p=>{
    const lv=p && p.id && hbs[p.id] && hbs[p.id].lv;
    if(!lv || !p.card || lv.t===mine) return '';
    return '<div>'+esc(T.ccRivalLive(p.card.handle, lv.t, lv.pts, lv.last, lv.w))+'</div>';
  }).filter(Boolean);
  el.innerHTML=rows.join('');
  el.style.display=rows.length ? '' : 'none';
}
Object.assign(I18N.ru, {ccRivalLive:(n,ev,p,l,w)=>n+' сейчас: '+ev+' · '+p+' очков'+(l ? ' · прошлая игра #'+l : '')+(w ? ' · побед '+w : '')});
Object.assign(I18N.en, {ccRivalLive:(n,ev,p,l,w)=>n+' now: '+ev+' · '+p+' pts'+(l ? ' · last game #'+l : '')+(w ? ' · wins '+w : '')});
Object.assign(I18N.fr, {ccRivalLive:(n,ev,p,l,w)=>n+' en ce moment : '+ev+' · '+p+' pts'+(l ? ' · dernière game #'+l : '')+(w ? ' · victoires '+w : '')});
Object.assign(I18N.it, {ccRivalLive:(n,ev,p,l,w)=>n+' ora: '+ev+' · '+p+' punti'+(l ? ' · ultima partita #'+l : '')+(w ? ' · vittorie '+w : '')});
Object.assign(I18N.pt, {ccRivalLive:(n,ev,p,l,w)=>n+' agora: '+ev+' · '+p+' pts'+(l ? ' · última partida #'+l : '')+(w ? ' · vitórias '+w : '')});
function ccMpQnLine(){
  try{ return Object.keys(CC_MP_QN||{}).filter(function(k){ return !/@$/.test(k); }).map(function(k){ return k+CC_MP_QN[k]; }).join(' '); }catch(e){ return ''; }
}
/* Строка о напарнике под ожиданием: его день, игра, вопросы, перемотка. По ней
   виден зависший вечер: кто где стоит. Его снимок 29 августа: «ждём голос
   напарника… 21 с» на шестой игре — и ни слова о том, где второй. */
function ccMpPeerLine(){
  var p=(typeof MP!=='undefined' && MP.peerHb) || null;
  if(!p) return '';
  var age=MP.peerSeen ? Math.round(((new Date()).getTime()-MP.peerSeen)/1000) : null;
  return '  я '+careerToday()+' g'+String(CC_MP_GAME||0)+' ⇄ '+String(p.day||'?')+' · g'+String(p.g||0)+(p.q ? ' · '+p.q : '')+(p.w ? ' · ждёт '+p.w : '')+(p.ff ? ' · ff' : '')+(p.rand===false ? ' · idle' : '')+(age!=null ? ' · '+age+' с' : '');
}
/* Расхождение вечеров ловим на каждом барьере: к сообщению «дошёл до вопроса»
   добавляется хеш таблицы, и при расхождении висит красная строка с номером игры.
   Проверка в конце (digest -> close, split:true) не говорит, где разошлось.
   Ничего не чиним и не останавливаем: вечер доигрывается, сервер в конце сводит
   обоих к одной таблице (ccMpClose). */
/* Номер вопроса — общий счёт, а не порядок сообщений.

   Оба клиента проходят вечер по одному и тому же пути и задают одни и те же
   вопросы в одном порядке, поэтому простой счётчик на вид вопроса даёт у них
   одинаковые номера. Этого хватает, чтобы приход и ответ спаривались с ТЕМ
   САМЫМ вопросом, а не с тем, что подвернулось в очереди.

   Обнуляется на старте вечера — там же, где чистится очередь и голоса
   пропуска. */
/* Напарник уже досчитал вечер, ждать нечего. После хеша таблицы он больше ничего не шлёт, и второй висел на
   следующем вопросе. Сервер шлёт второму 'digest' (lobby.digest), его и слушаем.
   По нему отставший доигрывает без ожиданий: барьеры не держат, вопросы отвечаются на месте. Итог сведёт сервер по
   первому хешу, но расхождение помечаем.
   Уже идущие ожидания надо разбудить, отсюда список будильников. */
let CC_MP_PEER_DONE=false, CC_MP_WAITERS=[];
/* День после командного вечера двигает клиент, один раз сразу после close.
   careerAdvanceTo в команде принимает день только от сервера (CC_MP_ADVANCE), а
   сервер дней не знает и возвращает тот же день, что был в digest, без этого
   карьера стояла на одном кубке. Шаг «завтра» сеется общим сидом, так что у двоих
   он одинаковый. Второй вызов без нового close по-прежнему глух. */
let CC_MP_DAY_DUE=false;
/* Между закрытием вечера и шагом «завтра» состояние наверх НЕ уходит.

   Живой сторож соло-хитов, 28 августа: у одного день сдвинулся, у второго
   остался. Гонка: после close сид снят, и любое careerSave до строки
   cr.day=завтра (careerMonthGoalCheck, зарплаты, письма — всё внутри
   careerAdvanceTo) уезжает напарнику с ВЧЕРАШНИМ днём; тот уже шагнул и
   применяет чужое вчера поверх своего завтра. Держится от close до конца
   careerAdvanceTo. (Запрет «день назад» в ccApplyTeamState не годится: при
   входе в лобби со свежим сейвом день команды законно раньше своего.) */
let CC_MP_HOLD=false;
function ccMpWaitReset(){ CC_MP_PEER_DONE=false; CC_MP_WAITERS.length=0; }
/* Связь оборвалась — ждать напарника тоже больше нечего.

   Он вернётся переподключением (см. mp.js), но вечер, стоящий на месте, к
   этому моменту уже не спасти: пока его нет, ни приход, ни ответ не придут.
   Разбудить ждущих здесь — то же самое, что и «он досчитал»: доиграть врозь
   можно, стоять насмерть нельзя. */
let CC_MP_LOST_T=null;
const CC_MP_LOST_RELEASE_MS=150000;
function ccMpLinkLost(){
  /* Обрыв отпускает ожидания НЕ сразу, а если связь не вернулась за CC_MP_LEAVE_MS: короткий
     обрыв переподключается сам, и пропущенное доезжает очередью ('since'); отпустив барьер
     сразу, клиент уходил вперёд один — и вечер расходился (комната на шестерых, 8.09). */
  // Ожидания закрытия (onlyLost) ждут «сервера или обрыва» — их обрыв отпускает сразу, как и раньше.
  const now=CC_MP_WAITERS.filter(function(fn){ return fn && fn.onlyLost; });
  if(now.length){ CC_MP_WAITERS.splice(0, CC_MP_WAITERS.length, ...CC_MP_WAITERS.filter(function(fn){ return !(fn && fn.onlyLost); })); now.forEach(function(fn){ try{ fn(); }catch(e){} }); }
  if(CC_MP_LOST_T) return;
  /* Окно — 150 секунд, а не 40. Отпущенный по обрыву барьер — это вечер врозь с этой игры:
     клиент уходит вперёд один, а напарник, дождавшись его прихода из очереди, читает «peer
     ahead». Сорок секунд обрыва — это телефон с погасшим экраном или свёрнутая вкладка, а не
     ушедший человек; переподключение с отступом (1.5 → 30 с) в сорок секунд может и не
     уложиться. Пока связи нет, приход напарника всё равно доедет очередью (since) — ждать
     его дешевле, чем разъехаться. Настоящий уход по-прежнему ловит потолок ccMpDeadline. */
  CC_MP_LOST_T=setTimeout(function(){
    CC_MP_LOST_T=null;
    if(typeof MP!=='undefined' && MP.state==='live') return;
    ccMpPassed('lost');
    const list=CC_MP_WAITERS.slice();
    CC_MP_WAITERS.length=0;
    list.forEach(function(fn){ try{ fn(); }catch(e){} });
  }, CC_MP_LOST_RELEASE_MS);
}
function ccMpPeerDone(){
  if(CC_MP_PEER_DONE) return;
  CC_MP_PEER_DONE=true; ccMpPassed('done');
  /* Ожидание ЗАКРЫТИЯ вечера «он досчитал» не будит: его хеш — это как раз то,
     чего закрытие ждёт, и сервер закроет обоих, как только придёт второй.
     Живой сторож 28 августа: таблицы сошлись до байта, а на экране «напарник
     не дошёл до вопроса» — это закрытие сдалось от чужого хеша. Такие
     ожидания помечены onlyLost и ждут либо сервера, либо обрыва. */
  const keep=CC_MP_WAITERS.filter(function(fn){ return fn && fn.onlyLost; });
  const list=CC_MP_WAITERS.filter(function(fn){ return !(fn && fn.onlyLost); });
  CC_MP_WAITERS.length=0;
  keep.forEach(function(fn){ CC_MP_WAITERS.push(fn); });
  list.forEach(function(fn){ try{ fn(); }catch(e){} });
}
let CC_MP_QN={};
function ccMpQnReset(){ CC_MP_QN={}; CC_MP_SKIP_CLOSE=false; }
/* Вечер закрыт ВРОЗЬ (выход обоим или расхождение, CC_MP_LEAVE) — запоздалое 'close' от сервера
   этого вечера не применяется (см. mp.js): сервер закрывает, когда придут оба хеша, и шлёт состояние
   ДО шага дня, а день к этому времени уже сдвинут своим шагом. Проба с нарочным расхождением
   1.10: у второго день откатывался на вчера. Сбрасывается на старте следующего вечера. */
let CC_MP_SKIP_CLOSE=false;
/* СВЕРКА ПОСЛЕ ВЕЧЕРА ВРОЗЬ — В ОДНУ СТОРОНУ (годовой прогон вдвоём 1.10, 2025: после первого расхождения
   все вечера до конца сезона расходились на первой игре). Оба просили syncreq, каждый отвечал своим
   состоянием, и сервер пересылал его другому — двое менялись состояниями и оставались разными. Теперь
   правда — у владельца лобби (роль a): просит только второй, и просит, пока ответ не придёт (владелец
   может ещё доигрывать свой стол — тогда он на syncreq молчит). */
function ccMpSyncAfterApart(){
  if(typeof MP==='undefined' || !MP.act || ccMpRole()==='a') return;
  let got=false, n=0, off=null;
  try{ off=MP.on('team', function(){ got=true; if(off) off(); }); }catch(e){}
  const ask=function(){
    if(got || n++>=24){ if(off) try{ off(); }catch(e){} return; }
    try{ MP.act('syncreq', {by:ccMpId()}); }catch(e){}
    setTimeout(ask, 5000);
  };
  setTimeout(ask, 1500);
}
// Дни, которые напарник в перемотке пропустил (ffskip), и день, на котором его пропуск отменил наши ворота.
const CC_MP_PEER_SKIPS=new Set();
// Личные вечера в команде (своя сборная, соло-серия сама решает, один или вдвоём): пропуск напарника их не отменяет.
const CC_FF_PERSONAL=['nations', 'solo'];
let CC_MP_FF_SKIPDAY=null;
function ccMpQn(kind){ const n=(CC_MP_QN[kind]=(CC_MP_QN[kind]||0)+1); CC_MP_CUR_Q=kind+'#'+n; return n; }
let CC_MP_SPLIT_AT=null;
/* ПОЧЕМУ Я ПРОШЁЛ БАРЬЕР ОДИН — едет в следующем приходе (game@ … why), и напарник читает это в
   своей красной строке. Скрин тестера 21.09: «Вечера разошлись на игре 1 · peer ahead · game@#2
   g2» — напарник уже во второй игре, когда этот стоит на барьере первой; значит, тот прошёл
   барьер первой игры без чужого прихода. Дверей у барьера четыре (потолок тишины, обрыв своей
   связи, «он досчитал», выход из вечера), и по одной строке не видно, в какую вышли. Теперь
   видно: «peer passed: lost @g1». */
let CC_MP_PASSED=null;
function ccMpPassed(why){ try{ CC_MP_PASSED=String(why)+' @g'+String(CC_MP_GAME||0); }catch(e){ CC_MP_PASSED=String(why); } }
/* Напарник не дошёл до вопроса за три минуты — сказать об этом.

   Барьер после этого пропускает вечер дальше, иначе он встал бы насмерть. Но
   это уже не «оба в ногу», а «играем врозь», и молчать об этом нельзя. */
function ccMpSlowSeen(){
  if(document.getElementById('ccMpSlow')) return;
  try{
    var d=document.createElement('div');
    d.id='ccMpSlow'; d.className='cc-mp-split';
    d.textContent=L().ccMpSlow;
    document.body.appendChild(d);
    setTimeout(function(){ try{ d.remove(); }catch(e){} }, 6000);
  }catch(e){}
}
function ccMpSplitSeen(n, detail){
  if(CC_MP_SPLIT_AT!=null) return;      // первое расхождение и есть нужное
  CC_MP_SPLIT_AT=n||0;
  try{ careerNews('bad', 'ccNewsMpSplit', [String(n||'?')]); }catch(e){}
  try{ ccErrLog('split', 'game '+(n||'?')+' · '+String(detail||'').slice(0, 260)); }catch(e){}
  /* В ГОНКЕ разошедшиеся столы уже не сойдутся: комната распадается на группы с разными
     наборами вопросов, и барьеры ждут приходов, которых не будет (год 9.09: кубок 9.02, две
     группы, 15 минут стоя). Дальше вечер идёт врозь — как после «напарник не дошёл». */
  if(typeof ccRaceOn==='function' && ccRaceOn() && !(typeof ccMpTeam==='function' && ccMpTeam())){ try{ ccMpPeerDone(); }catch(e){} }
  try{
    var d=document.createElement('div');
    d.className='cc-mp-split'; d.id='ccMpSplitBar';
    // Числа — не для игрока, а для отчёта: хеш и броски у себя и у напарника.
    d.textContent=L().ccMpSplitAt(String(n||'?'))+(detail ? ' · '+detail : '');
    /* И выход. Отзыв: «если ошибка, просто выйти из матча двоим, чтобы продолжить
       карьеру». Кнопка одна на двоих: нажал один — уходят оба (act 'leave'). */
    if(!CC_MP_LEFT && ccMpLock()){
      var b=document.createElement('button'); b.type='button'; b.textContent=L().ccMpLeaveBtn;
      b.onclick=function(){ ccMpSplitLeave(false); };
      d.appendChild(b);
    }
    document.body.appendChild(d);
  }catch(e){}
  // Командная пара — врозь сразу (ccMpSplitApart): ждать на барьерах разошедшегося вечера нечего.
  if(!(typeof ccRaceOn==='function' && ccRaceOn() && !(typeof ccMpTeam==='function' && ccMpTeam()))){ try{ ccMpSplitApart(false); }catch(e){} }
}
/* ВРОЗЬ — БЕЗ ОЖИДАНИЙ (скрин тестера 1.10, Katowice 2019 вдвоём: «просто зависло»). После
   расхождения столы уже не сойдутся, а барьеры продолжали ждать друг друга: у каждого свои
   вопросы, и каждое ожидание кончалось только потолком тишины — проба с нарочным расхождением
   (CC_DESYNC_B) шла от второй игры до шестой 25 минут. Теперь пара сразу играет врозь: ожидания
   отпускаются (ccMpPeerDone), свой стол доигрывается без пропуска, вечер закрывается без сервера,
   а на хабе оба просят синхронизацию — как после «выйти обоим» (CC_MP_LEAVE), только без перемотки.
   Напарнику уходит 'apart', чтобы и он не ждал, если сам расхождения ещё не увидел. */
function ccMpSplitApart(fromPeer){
  if(CC_MP_LEAVE) return;
  CC_MP_LEAVE=true; ccMpPassed('split');
  if(!fromPeer && typeof MP!=='undefined' && MP.act) try{ MP.act('apart', {by:ccMpId()}); }catch(e){}
  try{ ccMpPeerDone(); }catch(e){}
  try{ var all=CC_MP_WAITERS.slice(); CC_MP_WAITERS.length=0; all.forEach(function(fn){ try{ fn(); }catch(e){} }); }catch(e){}
}
/* ВЫЙТИ ИЗ ВЕЧЕРА ОБОИМ. Разошедшиеся столы не сойдутся, а стоять на барьерах и ждать
   закрытия — значит стоять до потолка. Выход: сказать напарнику (act 'leave'), отпустить все
   ожидания (ccMpPeerDone + ждущие закрытия), доиграть свой стол под пропуском и закрыть вечер
   без сервера — день двигается своим шагом (CC_MP_DAY_DUE). На хабе оба просят синхронизацию
   (syncreq): состояние сходится к одному, и следующий вечер снова идёт в ногу. */
let CC_MP_LEAVE=false, CC_MP_LEFT=false;   // LEAVE — вечер закрывается врозь (и «врозь», и «выйти»); LEFT — нажали «выйти обоим» (с перемоткой)
function ccMpSplitLeave(fromPeer){
  if(CC_MP_LEFT && CC_MP_LEAVE) return;
  CC_MP_LEFT=true;
  if(!CC_MP_LEAVE){ CC_MP_LEAVE=true; ccMpPassed('leave'); }
  if(!fromPeer && typeof MP!=='undefined' && MP.act) try{ MP.act('leave', {by:ccMpId()}); }catch(e){}
  try{ ccMpPeerDone(); }catch(e){}
  try{ var all=CC_MP_WAITERS.slice(); CC_MP_WAITERS.length=0; all.forEach(function(fn){ try{ fn(); }catch(e){} }); }catch(e){}
  try{ skipAnimation=true; CC_SKIP_RUN=true; var sb=document.getElementById('majorSkipBtn'); if(sb && !sb.disabled) sb.click(); }catch(e){}
  try{
    var bar=document.getElementById('ccMpSplitBar');
    if(bar){ bar.textContent=L().ccMpLeaving; setTimeout(function(){ try{ bar.remove(); }catch(e){} }, 6000); }
  }catch(e){}
}
/* Сверить свою таблицу с чужой — где бы его приход ни нашёлся.

   Сверка стояла ТОЛЬКО в ветке ожидания: сравнивалось то, чего дождались.
   А приход напарника часто уже лежит в очереди — он дошёл раньше, — и тогда
   барьер проходил мимо сравнения молча. Скриншоты: в одной и той
   же четвёртой игре 172 очка у одного и 181 у другого, а красной строки нет.
   Прибор был, но смотрел не туда.

   Теперь сравнение зовётся отовсюду, где приход попал в руки. */
/* Список поля словами — ник(и) и сила каждой команды, в порядке поля.

   Хеш поля говорит «разошлись», но не говорит ГДЕ. Скриншот, соло
   вдвоём после возврата к локстепу: «field 754560464.m2.58.n4900h93+96 vs
   2052885888.m2.58.n4900h93+96» — люди сошлись, размер сошёлся, а какая из
   4900 строк другая, не видно никому. Первая игра везёт весь список
   напарнику; при расхождении красная строка называет первую строку, где
   разошлись, и сколько их всего. */
let CC_MP_FIELD_LIST=null;
// Какой вечер считается (вид:id) — в подписи поля, чтобы «разошлись» называло турнир, а не хеш. Ставит careerPlay.
let CC_MP_NIGHT='';
// Отпечаток последней сборки поля: сид · занятые · пул (состав и силы) · регион. Ставит careerCupField, читает ccFieldSig —
// чтобы «разошлись на игре 1» называло, ЧТО разошлось (скриншот: Reload 2 opens, «diff 2097 of 2100» при равных бросках).
let CC_MP_FIELD_FP='';
// Из чего сложилась сила своей команды в этот вечер (careerYouTeam) — едет с каждой сверкой.
let CC_MP_YOU_PARTS='';
/* Отпечаток командного состояния по ключам — едет с каждой сверкой игры.
   Скриншоты (страница «playin», b65d7d22): опены Reload —
   «таблицы разные» при равном топ-8 и нулевых бросках (то есть разошлась
   таблица ДО первой игры — перенос первой сессии), Плей-Ин — «rolls @ oth»
   при равной книге своего лобби (чужие лобби считались из разных входов).
   Бросков и поля мало: расходится вход, который не бросок, — cr.rel, spots,
   mates… Красная строка теперь называет ключ. */
let CC_MP_STATE_KEYS=null;
function ccMpStateKeys(){
  var cr=(CAREER && CAREER.career) || {};
  var o={};
  try{
    CC_TEAM_KEYS.forEach(function(k){
      if(cr[k]===undefined) return;
      // Роль в mp личная по устройству (см. ccApplyTeamState) — сверяется только код.
      var v = (k==='mp' && cr.mp) ? {code:cr.mp.code} : cr[k];
      o[k]=String(ccHashStr(JSON.stringify(v)));
    });
    CC_TEAM_TOP.forEach(function(k){ if(CAREER && CAREER[k]!==undefined) o[k]=String(ccHashStr(JSON.stringify(CAREER[k]))); });
  }catch(e){}
  return o;
}
function ccMpStateDiff(mine, theirs){
  if(!mine || !theirs) return '';
  var keys={}; Object.keys(mine).forEach(function(k){ keys[k]=1; }); Object.keys(theirs).forEach(function(k){ keys[k]=1; });
  var out=Object.keys(keys).filter(function(k){ return mine[k]!==theirs[k]; });
  return out.length ? ' · state '+out.join('/') : '';
}
/* Список поля — с ЧИСЛАМИ ДВИЖКА, а не только с ником и силой. Движок читает у команды
   attrs (skill/seek/power в createSquads) и край ближнего боя; сила при этом округлена, так что
   две сцены, разошедшиеся на доли очка, дают одинаковую строку 'ник:сила' и разный ход игры.
   Навык, например, двигает время выхода из круга (leaveAt) НЕ ТРАТЯ бросков — ровно то, что
   видно в красной строке 10.09: броски равны, состояние разное. */
function ccMpFieldList(teams){
  return (teams||[]).map(function(t){
    var sq=(t.squad||[]).map(hKey).sort().join('+'), a=t.attrs||null;
    return (sq||String(t.name||''))+':'+Math.round(t.pow||0)+':'+
           (a ? a.END+'.'+a.SUR+'.'+a.AIM+'.'+a.CLU : '-')+':'+Math.round((t.closeEdge||0)*100);
  }).join('|');
}
function ccMpFieldDiff(mine, theirs){
  if(!mine || !theirs) return '';
  var a=String(mine).split('|'), b=String(theirs).split('|');
  var n=0, first='';
  for(var i=0;i<Math.max(a.length, b.length);i++){
    if(a[i]!==b[i]){ n++; if(!first) first='#'+(i+1)+' '+(a[i]||'-')+' vs '+(b[i]||'-'); }
  }
  return n ? ' · diff '+n+' of '+Math.max(a.length, b.length)+': '+first : '';
}
function ccMpSumSeen(mine, theirs, theirsList, theirsSt, theirsYp){
  if(!mine || !theirs || mine===theirs) return;
  var a=String(mine).split('|'), b=String(theirs).split('|');
  // game|hash|rolls|field — короткий хеш и броски с обеих сторон, и ЧТО именно разошлось.
  var short=function(p){ return String(p[1]||'').slice(0,6)+'/'+String(p[2]||'?'); };
  var what=[];
  /* Отпечаток сборки (сид·занятые·пул·регион) — ПОКАЗЫВАЕТСЯ при расхождении поля, но не сравнивается: скриншот,
     Victory Cup — пул 160 против 161 дуо при одинаковом поле (хеш совпал) читался как «таблицы разные». */
  if(a[3]!==b[3]) what.push('field '+String(a[3]||'?')+' vs '+String(b[3]||'?')+ccMpFieldDiff(CC_MP_FIELD_LIST, theirsList)+(a[6]||b[6] ? ' · fp '+String(a[6]||'?')+' vs '+String(b[6]||'?') : ''));
  if(a[1]!==b[1]) what.push('table');
  // Книга прошлой игры: первая строка, где разошлись броски ИЛИ отпечаток состояния, — это место.
  var la=String(a[4]||'').split(',').filter(Boolean), lb=String(b[4]||'').split(',').filter(Boolean);
  var where='';
  /* Роль в голосе (c2:mine / take / wait / late) у двоих по устройству разная
     — это не место расхождения. Скриншот: «rolls @ #14 c2:mine=397326
     vs c2:wait=397326» при равных числах. Сравниваются числа, ярлык — нет. */
  var same=function(x, y){
    var nx=String(x||'').replace(/^c2:(mine|take|wait|late|own)/, 'c2'), ny=String(y||'').replace(/^c2:(mine|take|wait|late|own)/, 'c2');
    return nx===ny;
  };
  for(var i=0;i<Math.max(la.length, lb.length);i++){
    if(!same(la[i], lb[i])){ where='#'+(i+1)+' '+(la[i]||'-')+' vs '+(lb[i]||'-'); break; }
  }
  // Сила своей команды по слагаемым — когда они разные, это и есть ответ на «h106 vs h107».
  var youDiff=(CC_MP_YOU_PARTS && theirsYp && CC_MP_YOU_PARTS!==theirsYp) ? ' · you me '+CC_MP_YOU_PARTS+' | mate '+theirsYp : '';
  if(a[2]!==b[2]) what.push('rolls'+(where ? ' @ '+where : ''));
  else if(where) what.push('state @ '+where);
  /* Книга разошлась, а хеш поля сошёлся — значит разъехалось то, чего в хеше нет:
     числа движка у какой-то команды. Список поля их несёт, и первая несовпавшая
     строка называет команду. */
  if(where && a[3]===b[3]) what.push('lines'+ccMpFieldDiff(CC_MP_FIELD_LIST, theirsList));
  if(a[1]!==b[1] && (a[5]||b[5])) what.push('top me '+String(a[5]||'-')+' | mate '+String(b[5]||'-'));
  var stDiff=ccMpStateDiff(CC_MP_STATE_KEYS, theirsSt);
  // Расхождение — это таблица, броски или поле. Всё остальное в сумме (книга, верх таблицы) — только пояснение.
  if(a[1]===b[1] && a[2]===b[2] && a[3]===b[3]) return;
  var flags=' · skip '+(typeof skipAnimation!=='undefined' && skipAnimation ? 1 : 0)+' hid '+(typeof document!=='undefined' && document.hidden ? 1 : 0)+(CC_MP_FMT_FP ? ' · fmt '+CC_MP_FMT_FP : '')+(CC_MP_FOREIGN ? ' · foreign '+CC_MP_FOREIGN+(CC_MP_FOREIGN_AT ? ' @ '+CC_MP_FOREIGN_AT : '') : '');
  ccMpSplitSeen(a[0], (what.length ? what.join(',')+' · ' : '')+'me '+short(a)+' · mate '+short(b)+flags+stDiff+youDiff+' · '+String(typeof CC_BUILD!=='undefined' ? CC_BUILD : ''));
}
function ccMpSync(kind, sum, qn){
  if(!ccMpLock() || typeof MP==='undefined') return Promise.resolve();
  var me=ccMpId(), at=kind+'@';
  /* Приход объявляется ВСЕГДА, даже когда ждать уже нечего.

     Здесь была взаимная блокировка, и она стоила ему вечера. Ранний выход
     стоял ВЫШЕ отправки: клиент, у которого ответ напарника уже лежал в
     очереди, проходил барьер молча — не сказав, что дошёл. А напарник в этот
     самый момент ждал именно его прихода. Один ждёт ответа, второй ждёт
     прихода, и оба стоят навсегда. Отчёт: «опять зависла на
     4 из 6, после того, когда я ничего не выбирал» — то есть завис как раз
     тот, кто ничего не решал, а значит ждал.

     Сказать «я дошёл» стоит одного сообщения и не стоит ничего больше.
     Пропускать можно ОЖИДАНИЕ, но не объявление. */
  /* Номер игры едет с приходом: по нему видно, что напарник УЖЕ ДАЛЬШЕ.

     Дедлок, пойманный живым сторожем 28 августа (tools/check-mp-live-two.js):
     во второй игре у одного клиента был вопрос о луте, у другого — нет (его
     состав в его версии игры погиб раньше третьей зоны). Число вопросов
     разошлось: один ждёт прихода к вопросу, которого у второго не будет,
     второй ждёт прихода к третьей игре, до которой первый не дойдёт. Пока
     потолок был по секундомеру, это распутывалось через три минуты; с
     пульсом — стояло насмерть.

     Поэтому приход к ЛЮБОМУ барьеру более поздней игры отпускает ожидание:
     ждать уже некого, это расхождение, и оно так и называется. */
  var myG=(CC_MP_GAME||null);
  MP.act(at, {by:me, sum:sum, q:qn, g:myG, fl:CC_MP_FIELD_LIST||undefined, st:CC_MP_STATE_KEYS||undefined, yp:CC_MP_YOU_PARTS||undefined, why:CC_MP_PASSED||undefined});
  // Его «я дальше» могло приехать РАНЬШЕ, чем мы сюда дошли, — оно в очереди.
  // На догоне после перезагрузки напарник ВПЕРЕДИ по построению — это не расхождение.
  var aheadQ=(MP.ahead && !CC_MP_REPLAY) ? MP.ahead(myG) : null;
  if(aheadQ){
    ccMpSplitSeen(myG, 'peer ahead · '+aheadQ.kind+'#'+(aheadQ.payload||{}).q+' g'+(aheadQ.payload||{}).g+((aheadQ.payload||{}).why ? ' · peer passed: '+(aheadQ.payload||{}).why : '')+' · rolls '+CC_MP_ROLLS+' · '+CC_BUILD);
    return Promise.resolve();
  }
  /* Он уже ответил на ЭТОТ вопрос — значит и дошёл. Ждать нечего, но его
     приход мог остаться в очереди, и сверку он несёт с собой. */
  /* Барьер на N человек (гонка втроём и больше): ждём приход КАЖДОГО другого, по
     одному на id. Вдвоём — как было: один чужой приход, и ответ на вопрос в очереди
     тоже отпускает (хозяин вопроса барьер уже прошёл). Втроём этот короткий путь
     выключен: он пускал быстрого вперёд, и третий читал его как «peer ahead». */
  var needed=(typeof ccMpHumansN==='function' ? ccMpHumansN() : CC_MP_HUMANS)-1;
  var seen={};
  var noteArrival=function(a){
    if(!a || !a.payload || !a.payload.by || seen[a.payload.by]) return false;
    seen[a.payload.by]=true;
    ccMpSumSeen(sum, a.payload.sum, a.payload.fl, a.payload.st, a.payload.yp);
    return true;
  };
  var arrived=function(){ return Object.keys(seen).length>=needed; };
  if(needed<=1 && MP.peek && MP.peek(kind, qn)){
    var was=MP.take && MP.take(at, qn);
    if(was) noteArrival(was);
    return Promise.resolve();
  }
  // Приходы, что уже лежат в очереди — по одному от каждого; это раньше флага
  // «досчитал», иначе досчитавший напарник уносил с собой и сверку. См. ccMpChoose.
  for(var k=0; k<8; k++){ var early=MP.take && MP.take(at, qn); if(!early) break; noteArrival(early); if(arrived()) break; }
  if(arrived()) return Promise.resolve();
  // И если он вообще досчитал вечер — тем более.
  if(CC_MP_PEER_DONE) return Promise.resolve();
  if(CC_MP_REPLAY) CC_MP_REPLAY=false;        // пришлось ждать напарника — догнали
  // След для проб (check-race-live-six): с чем барьер встал ждать.
  if(typeof CC_MP_TRACE==='function') try{ CC_MP_TRACE('wait '+at+'#'+qn+' need'+needed+' seen['+Object.keys(seen).map(function(k){ return k.slice(-5); }).join(',')+'] q['+(MP.dump ? MP.dump().join(',') : '')+']'); }catch(e){}
  var close=ccMpWaitBox(L().ccMpWaitAt, true);
  return ccMpIdle(new Promise(function(res){
    var t=null, off=null;
    var settled=false;
    var done=function(){
      if(settled) return; settled=true;
      var i=CC_MP_WAITERS.indexOf(done); if(i>=0) CC_MP_WAITERS.splice(i, 1);
      if(t) clearInterval(t);
      if(off) off();
      close();
      res();
    };
    off=MP.on('act', function(m){
      if(!m.payload || m.payload.by===me) return;
      // Напарник дошёл до барьера более поздней игры — нас он уже не ждёт.
      if(/@$/.test(String(m.kind||'')) && m.payload.g!=null && myG!=null && m.payload.g>myG){
        ccMpSplitSeen(myG, 'peer ahead · '+m.kind+'#'+m.payload.q+' g'+m.payload.g+(m.payload.why ? ' · peer passed: '+m.payload.why : '')+' · rolls '+CC_MP_ROLLS+' · '+CC_BUILD);
        done(); return;
      }
      if(m.kind!==at) return;
      // Чужой вопрос — не наш барьер.
      if(m.payload.q!=null && qn!=null && m.payload.q!==qn) return;
      // Он дошёл — и заодно сказал, что у него в таблице. На N — считаем по одному от каждого.
      noteArrival(m);
      if(MP.take){ var x; while((x=MP.take(at, qn))) noteArrival(x); }
      if(typeof CC_MP_TRACE==='function') try{ CC_MP_TRACE('arr '+at+'#'+qn+' from '+String(m.payload.by).slice(-5)+' seen'+Object.keys(seen).length+'/'+needed); }catch(e){}
      if(arrived()) done();
    });
    t=ccMpDeadline(function(){ if(typeof CC_MP_TRACE==='function') try{ CC_MP_TRACE('cap '+at+'#'+qn+' seen'+Object.keys(seen).length+'/'+needed+' q['+(MP.dump ? MP.dump().join(',') : '')+']'); }catch(e){} ccMpSlowSeen(); done(); });
    // Досчитал вечер — будим ожидание немедленно.
    CC_MP_WAITERS.push(done);
  }));
}
/* «Пропустить» срабатывает, когда нажали оба: темп показа в командном вечере должен быть общим.
   Голос не блокирует (в отличие от ccMpChoose): нажал и играешь дальше, кнопка показывает 0/2, 1/2.
   Считается на клиенте: свой голос помним, чужой приходит решением 'skip'. Сброс на старте вечера вместе с очередью решений. */
let CC_MP_SKIP=null;
function ccMpSkipReset(){ CC_MP_SKIP={asked:false, mine:false, theirs:false}; }
// Людей в общей комнате: команда — двое, гонка — я и все соперники.
function ccMpHumansN(){
  return (typeof ccRaceLock==='function' && ccRaceLock()) ? ccRaceHumansN() : CC_MP_HUMANS;
}
function ccMpSkipN(){
  if(!CC_MP_SKIP) return 0;
  // Чужие голоса — по одному на человека (гонка на N), не «кто-то нажал».
  const theirs=CC_MP_SKIP.who ? Object.keys(CC_MP_SKIP.who).length : (CC_MP_SKIP.theirs?1:0);
  return (CC_MP_SKIP.mine?1:0)+theirs;
}
// Подпись на кнопке. В одиночной карьере её нет вовсе — там ждать некого.
function ccMpSkipTag(){
  return ccMpLock() ? ' '+ccMpSkipN()+'/'+ccMpHumansN() : '';
}
function ccMpSkipBoth(){
  return !!(CC_MP_SKIP && CC_MP_SKIP.mine && ccMpSkipN()>=ccMpHumansN());
}
function ccMpSkipDraw(){
  const b=document.getElementById('majorSkipBtn');
  if(!b) return;
  if(ccMpSkipBoth()){
    b.innerHTML=(typeof CAREER_RUN!=='undefined' && CAREER_RUN) ? L().skipPressedRun : L().skipPressed;
    b.disabled=true;
    return;
  }
  b.innerHTML=L().skipBtn+ccMpSkipTag();
  // Нажал — жди второго; второй раз слать тот же голос незачем.
  b.disabled=!!(CC_MP_SKIP && (CC_MP_SKIP.asked || CC_MP_SKIP.mine));
}
function ccMpSkipApply(){
  if(!ccMpSkipBoth()){ ccMpSkipDraw(); return; }
  skipAnimation=true;
  if(typeof CAREER_RUN!=='undefined' && CAREER_RUN) CC_SKIP_RUN=true;
  ccMpSkipDraw();
}
/* Своё нажатие только ОТПРАВЛЯЕТ голос и ничего не включает.

   Отзыв: «нужно тоже чтоб два нажали и одновременно скипалось у них». Если
   считать свой голос на месте, получается перекос: нажавший вторым уходит в
   пропуск сразу, а первый — только когда до него доедет эхо, то есть через
   круг по сети. Разница мелкая, но она ровно того сорта, на который он и
   жаловался: «картинка не одновременно».

   Поэтому оба голоса — и свой, и чужой — считаются ОДИНАКОВО, по ленте
   решений сервера (ccMpSkipSaw). Сервер рассылает решение всем сразу, включая
   отправителя, так что пропуск включается у двоих от одного и того же
   сообщения. Флаг asked нужен только чтобы не слать один голос дважды. */
function ccMpSkipAsk(){
  if(!CC_MP_SKIP) ccMpSkipReset();
  if(CC_MP_SKIP.asked || CC_MP_SKIP.mine) return;
  CC_MP_SKIP.asked=true;
  MP.act('skip', {by:ccMpId()});
  ccMpSkipDraw();
}
// Голос из ленты — чей угодно, включая свой собственный.
function ccMpSkipSaw(who){
  if(!CC_MP_SKIP) ccMpSkipReset();
  if(who===ccMpId()) CC_MP_SKIP.mine=true;
  else { CC_MP_SKIP.theirs=true; CC_MP_SKIP.who=CC_MP_SKIP.who||{}; if(who) CC_MP_SKIP.who[who]=true; }
  ccMpSkipApply();
}
/* Спрашивают одного (ccMpMine), второй смотрит. Оба доходят до вопроса (ccMpSync), хозяин отвечает,
   ответ едет напарнику и применяется у обоих. Пока хозяин выбирает, генератор подменён на браузерный
   (сид лежит в CC_MP_RAND): пикер тратит броски, и разное их число разводило вечер каждый раз
   (tools/check-mp-choice-cost.js). По проводу едет ответ, а не последствия.
   Генератор возвращать в обеих ветках. Окно у смотрящего закрывается само, чтобы не копить ожидание. */
function ccMpChoose(kind, mineFn, label, sum){
  if(!ccMpLock() || typeof MP==='undefined')
    return Promise.resolve(mineFn()).then(function(v){ return {v:v, mine:true}; });
  var me=ccMpId();
  var say=function(v){ try{ return label ? label(v) : ''; }catch(e){ return ''; } };
  var ask=function(){
    if(!CC_MP_RAND) return Promise.resolve(mineFn());
    var seeded=Math.random;
    Math.random=CC_MP_RAND;
    var back=function(){ Math.random=seeded; };
    var v;
    try{ v=mineFn(); }
    catch(e){ back(); throw e; }
    return Promise.resolve(v).then(function(r){ back(); return r; },
                                   function(e){ back(); throw e; });
  };
  var qn=ccMpQn(kind);
  ccMpMark('c0:'+kind+'#'+qn);
  return ccMpSync(kind, sum, qn).then(function(){
    ccMpMark('c1');
    // Мой вопрос — отвечаю и говорю ответ напарнику.
    if(ccMpMine(kind)){
      // После перезагрузки — свой же ответ из ленты, без вопроса и без повтора по проводу.
      var own=MP.own && MP.own(kind, qn);
      // Метка в книгу и здесь: без неё книга догнавшего короче на строку, и
      // сверка звала это расхождением («oth vs c2:mine»). Ярлык свой,
      // сравнение его снимает вместе с mine/take/wait/late.
      if(own && own.payload){ ccMpMark('c2:own'); return Promise.resolve({v:own.payload.v, mine:true}); }
      if(CC_MP_REPLAY) CC_MP_REPLAY=false;      // свои ответы кончились — догнали
      return ask().then(function(val){
        ccMpMark('c2:mine');
        MP.act(kind, {v:val, by:me, q:qn});
        return {v:val, mine:true};
      });
    }
    /* Не мой вопрос — жду. Но если напарник уже досчитал вечер, ждать его
       ответа бессмысленно: вопросов у него не осталось. Решаем сами и метим
       расхождение. */
    /* СНАЧАЛА очередь, ПОТОМ «он досчитал». Скриншот (страница
       «neeww»): вечер сошёлся до очка, а красная строка «разошлись на игре ?»
       стоит. Порядок проверок был обратный: напарник, досмотревший быстрее,
       уже досчитал вечер — но все его ответы лежали в очереди, а этот клиент
       сперва смотрел на флаг «досчитал», метил расхождение и решал сам. То
       есть врозь шло не решение, а только надпись. Ответ из очереди — это
       его голос, и он важнее любого флага. */
    var got=MP.take && MP.take(kind, qn);
    if(got){ ccMpMark('c2:take');
             ccMpPickTell(kind, say(got.payload.v));
             return {v:got.payload.v, mine:false}; }
    if(CC_MP_PEER_DONE){
      ccMpSplitSeen('?', 'peer done · q '+kind+'#'+qn+' · rolls '+CC_MP_ROLLS+' · '+CC_BUILD);
      return ask().then(function(v){ return {v:v, mine:true}; });
    }
    /* Ждать ответа вечно тоже нельзя.

       Хозяин вопроса может до него и не дойти — оборвалась связь, закрыл
       вкладку, вылетел браузер. Раньше смотрящий в этом случае стоял
       НАВСЕГДА: вечер не двигался, кнопок не было, оставался только разрыв
       дуо. Поэтому у ожидания есть тот же потолок, что и у барьера, и по
       нему смотрящий решает сам.

       Это уже расхождение, и оно так и называется: вечер дальше пойдёт
       врозь. Но идущий врозь вечер можно доиграть и закрыть, а стоящий —
       нельзя. */
    if(CC_MP_REPLAY) CC_MP_REPLAY=false;      // ждём его ответ — значит, догнали
    var close=ccMpWaitBox(L().ccMpWaitPick, true);
    return ccMpIdle(new Promise(function(res, rej){
      var t=null;
      /* Ожидание решается ОДИН РАЗ. Его giveUp лежит и в CC_MP_WAITERS, а тот
         список чистится только «он досчитал»/«связь упала» — то есть все
         giveUp'ы вечера доживали до конца и в конце срабатывали разом:
         красная строка «timeout · q late#1» на последних бросках вечера при
         сошедшихся таблицах (живой сторож 28 августа). */
      var settled=false;
      var settle=function(){ if(settled) return false; settled=true;
        var i=CC_MP_WAITERS.indexOf(giveUp); if(i>=0) CC_MP_WAITERS.splice(i, 1); return true; };
      var myG=(CC_MP_GAME||null);
      // То же — по очереди, на входе: см. ccMpSync.
      var aheadQ=MP.ahead ? MP.ahead(myG) : null;
      if(aheadQ){
        ccMpSplitSeen(myG, 'peer ahead · '+aheadQ.kind+'#'+(aheadQ.payload||{}).q+' g'+(aheadQ.payload||{}).g+' · q '+kind+'#'+qn+' · '+CC_BUILD);
        Promise.resolve(ask()).then(function(v){ res({v:v, mine:true}); }, rej);
        return;
      }
      var off=MP.on('act', function(m){
        if(!m.payload || m.payload.by===me) return;
        // Он уже в следующей игре — ответа на этот вопрос не будет. См. ccMpSync.
        if(/@$/.test(String(m.kind||'')) && m.payload.g!=null && myG!=null && m.payload.g>myG){
          if(!settle()) return;
          if(off) off(); if(t) clearInterval(t);
          ccMpSplitSeen(myG, 'peer ahead · '+m.kind+'#'+m.payload.q+' g'+m.payload.g+' · q '+kind+'#'+qn+' · '+CC_BUILD);
          if(MP.take) MP.take(kind, qn);
          Promise.resolve(ask()).then(function(v){ res({v:v, mine:true}); }, rej);
          return;
        }
        if(m.kind!==kind) return;
        // Ответ на другой вопрос — не наш.
        if(m.payload.q!=null && m.payload.q!==qn) return;
        if(!settle()) return;
        if(off) off();
        if(t) clearInterval(t);
        if(MP.take) MP.take(kind, qn);
        res({v:m.payload.v, mine:false});
      });
      var giveUp=function(){
        if(!settle()) return;
        if(off) off();
        if(t) clearInterval(t);
        ccMpSlowSeen();
        ccMpSplitSeen('?', 'timeout · q '+kind+'#'+qn+' · rolls '+CC_MP_ROLLS+' · '+CC_BUILD);
        // Своё решение — единственное, что осталось.
        Promise.resolve(ask()).then(function(v){ res({v:v, mine:true}); }, rej);
      };
      t=ccMpDeadline(giveUp);
      // Досчитал вечер — не ждём до потолка.
      CC_MP_WAITERS.push(giveUp);
    })).then(function(r){
      close();
      ccMpMark('c2:'+(r.mine ? 'late' : 'wait'));
      if(!r.mine) ccMpPickTell(kind, say(r.v));
      return r;
    }, function(e){ close(); throw e; });
  });
}
// Сказать и убрать самому: вечер этим держать нельзя.
function ccMpTell(text){
  var close=ccMpWaitBox(text);
  setTimeout(close, 1600);
}
// Снимок командного состояния. Копия, а не ссылки: то, что уходит на сервер,
// не должно меняться под руками, пока летит.
function ccTeamState(){
  const cr=(CAREER && CAREER.career) || {};
  const out={};
  const put=(src, k)=>{ out[k] = (!src || src[k]===undefined) ? undefined
                                : JSON.parse(JSON.stringify(src[k])); };
  CC_TEAM_KEYS.forEach(k=>put(cr, k));
  CC_TEAM_TOP.forEach(k=>put(CAREER, k));
  out.size=cr.size;   // формат сезона без записи в sizes, см. ccApplyTeamState
  return out;
}
/* Состояние команды, пришедшее от сервера.

   Пишутся ТОЛЬКО командные поля — личное остаётся тем, что лежит в этом
   браузере. И сразу за этим выбрасывается мир: он построен по прошлому
   состоянию, а сцена только что могла стать другой. См. ccWorldReset. */
let CC_MP_ADVANCE=false;
let CC_MP_TURN_FOLLOW=false;   // идёт стык сезона вслед за напарником (см. ccApplyTeamState)
/* Состояние, пришедшее ОТ НАПАРНИКА посреди дня.

   Раньше командное состояние доезжало только при входе и в конце вечера:
   клиент слал его на каждое сохранение, а сервер такое сообщение не разбирал
   вовсе. Отсюда его «выбрал спот — у тимейта не показывается сразу».

   Применить мало — надо ещё записать себе и перерисовать то, что открыто. И
   не отправить обратно: иначе двое пересылали бы друг другу одно и то же
   состояние по кругу. Отправку глушит тот же флаг, которым открыт день. */
function ccMpApplyRemote(team){
  if(!team) return;
  // Идёт вечер — чужое состояние подождёт: применить его сейчас значит
  // выбросить кэши мира посреди игры. См. careerSave.
  if(CC_MP_RAND) return;
  if(CC_MX_SOLO_RUN){
    CC_MX_PENDING=team;
    /* Ждём у ворот общего квала, а напарник свой уже сыграл врозь (его отметка mxDone пришла) — ворота не откроются:
       отменяем, «Играть» ещё раз пойдёт личным вечером. См. ccMXSharedOk. */
    try{ if(CC_MX_SHARED && MP.gate && MP.gateCancel && MP.peer && team.mxDone && team.mxDone[hKey(MP.peer)]===careerToday()){
      CC_MX_GATE_OFF=true; MP.gateCancel('peer played the solo qualifier apart'); } }catch(e){}
    return;
  }
  /* День команды идёт только вперёд. Отзыв: «после перемотки
     моргает 3 и 4 день туда-сюда… и пятница-суббота у двоих». Перемотку по
     двум подтверждениям крутят ОБА клиента, каждый шаг уезжает напарнику, и
     кто отстал на день, присылал вчерашний день тому, кто уже в сегодняшнем;
     тот откатывался, отправлял завтрашний обратно — и так по кругу. Чужое
     состояние со днём раньше моего — устаревшее, оно не применяется. */
  if(team.day && CAREER && CAREER.career && CAREER.career.day && team.day<CAREER.career.day) return;
  const was=CC_MP_ADVANCE;
  ccApplyTeamState(team);
  CC_MP_ADVANCE=true;
  try{ careerSave(); }finally{ CC_MP_ADVANCE=was; }
  // Приехал итог напарника по соло — и мой уже есть: день шагает отсюда.
  if(typeof ccSoloTeamSettle==='function') try{ ccSoloTeamSettle(); }catch(e){}
  if(typeof ccMXTeamSettle==='function') try{ ccMXTeamSettle(); }catch(e){}
  /* Магазин, предметы и шкафчик командного не читают, кроме дня: перерисовка на каждое сохранение напарника сбрасывала
     там прокрутку и открытую карточку (Notion 23.10: «in duo mode it bugs with item shop and Locker when the other guy
     is doing things»). Там — только когда сменился день. */
  const quiet=/^(shop|items|locker)$/.test(CH_TAB||'') && CC_MP_REDRAW_DAY===CAREER.career.day;
  CC_MP_REDRAW_DAY=CAREER.career.day;
  if(!quiet && typeof careerRenderHub==='function' && document.getElementById('chBody'))
    careerRenderHub(CH_TAB||'centre');
}
var CC_MP_REDRAW_DAY=null;
/* Сид лобби — истина для cr.seed. Ставится из каждого 'state' сервера (см.
   mp.js), помнится отдельно (lobbySeed, личное поле — у обоих одно и то же
   значение от одного сервера) и после ЛЮБОГО применения командного состояния
   возвращается на место: пришедший seed мог быть чьим-то ленивым ником. */
function ccMpLobbySeed(seed){
  const cr=CAREER && CAREER.career;
  if(!cr || !seed) return;
  if(cr.lobbySeed===seed && cr.seed===seed) return;
  cr.lobbySeed=seed;
  cr.seed=seed;
  if(typeof ccWorldReset==='function') ccWorldReset();
}
function ccApplyTeamState(t){
  if(!t || !CAREER || !CAREER.career) return;
  /* ГОНЩИК ЧУЖОЕ КОМАНДНОЕ СОСТОЯНИЕ НЕ БЕРЁТ. В нём едет и 'mp' (ради кода):
     сосед, вошедший в комнату гонки командной дверью, успевал разослать своё
     состояние, пока считал себя командой, — и у хозяина гонки появлялась запись
     команды с ролью «b» и напарник вместо соперника. Отчёт:
     «вместо гонки ко мне просто в дуо тимейт зашёл» — ровно это, снято пробой
     check-race-live-two с CC_JOIN_TEAM=1 (у A: team:true, mates:[LiveB]).
     Гонка не делит ничего, кроме сводок (см. careerRaceEnter), значит и брать
     ей нечего. */
  if(typeof ccRaceOn==='function' && ccRaceOn() && !ccMpTeam()) return;
  /* Мир пересобирается, только если командное состояние что-то поменяло: напарник шлёт его на каждое своё
     сохранение (магазин, тренировка), и сброс кэшей на каждое такое письмо стоил до 20 мс на вкладку (до 4 раз
     дороже на телефоне) — подёргивания у пары онлайн. */
  const sigOf=()=>{ try{ return JSON.stringify([CC_TEAM_KEYS.map(k=>CAREER.career[k]), CC_TEAM_TOP.map(k=>CAREER[k]), CAREER.career.size]); }catch(e){ return Math.random(); } };
  const sig0=sigOf();
  /* СТЫК СЕЗОНА У ТОГО, КТО ЕГО НЕ ЖАЛ (errlog 26.10). «Новый сезон» жмёт один; второму приезжало только командное
     состояние, а личная половина careerNewSeason (формат года, обрезка PR, возраст, оборот клуба, предложения) у него
     не шла никогда: в 2026-м у одного дуо, у другого трио, PR второго сезона расходился на тысячи строк (проба
     check-mp-team-season с CC_TURN_ONE=1). Теперь второй проходит стык сам — тот же путь, что у нажавшего, — а
     общее ложится поверх ниже. */
  if(ccMpTeam() && !CC_MP_TURN_FOLLOW && CAREER.career.seasonOver && t.season===(CAREER.career.season||1)+1){
    CC_MP_TURN_FOLLOW=true;
    // Окно церемонии у второго закрывается: сезон уже начат, его кнопка начинала бы ещё один.
    try{ if(typeof ccGalaClose==='function') ccGalaClose(); }catch(e){}
    try{ careerNewSeason(); }catch(e){ console.error('careerNewSeason (напарник начал сезон)', e); }
    finally{ CC_MP_TURN_FOLLOW=false; }
    if(!CAREER || !CAREER.career) return;
  }
  // Единственное окно, в котором командной карьере разрешено двигать день:
  // см. careerAdvanceTo.
  CC_MP_ADVANCE=true;
  try{ CC_TEAM_KEYS.forEach(function(k){
         if(t[k]===undefined) return;
         /* Роль в лобби — ЛИЧНАЯ. 'mp' едет в командном состоянии ради кода,
            но вместе с ним приезжала роль напарника: после первого же обмена
            владелец становился «вторым» (или оба — владельцами), а по роли
            читается, кому пишут про третье кресло и кто открывает список
            «кому написать». Отзыв: «не могу взять игрока в
            трио, бота из списка». Своя роль остаётся своей. */
         if(k==='mp' && t.mp && CAREER.career.mp && CAREER.career.mp.role){
           CAREER.career.mp=Object.assign({}, t.mp, {role:CAREER.career.mp.role});
           return;
         }
         /* Журнал: личные строки (соло-вечер в команде, who=свой ник) у напарника ещё нет — они
            остаются. Отметки cr.mxDone — объединением. */
         if(k==='log' && Array.isArray(t.log) && Array.isArray(CAREER.career.log)){
           const me=hKey(careerCard()), sig=r=>[r.day, r.kind, r.stage, r.who||''].join('|');
           const have=new Set(t.log.map(sig));
           // Только личные вечера соло-Мейджора: соло Victory Cup играется общим вечером и пишет строки
           // за обоих — там перезапись, как была (слияние развело журналы, живой прогон 2020).
           /* И Кубок наций: у каждого своя сборная (страна игрока), строка личная — годовой прогон
              вдвоём 1.10: у бразильца строка финала сборной, у немца её нет, и приход журнала
              напарника стирал её. */
           const mine=CAREER.career.log.filter(r=>r && !have.has(sig(r)) && ((r.who===me && r.solo && r.kind==='major') || r.kind==='nations'));
           /* ДЕНЬГИ ПО ОБЩЕМУ ИТОГУ (Notion 15.10, дуо онлайн: «на моём экране мы заработали, деньги пришли мне, а другу —
              ничего»). Каждый браузер платит себе по своей таблице (ccPayIn), а журнал вечера сервер раздаёт от того, кто
              закрыл первым. Разошлись таблицы — разошлись и деньги. Сверка: по дням последней недели и виду турнира
              доля из пришедшего журнала против своей; разница доплачивается или списывается, с той же долей клуба, что
              у ccPayIn, и строкой в новостях. Личные строки (соло-Мейджор, Кубок наций) не сверяются — они свои. */
           try{
             const personal=r=>(r.who===me && r.solo && r.kind==='major') || r.kind==='nations';
             const from=ccAddDays(careerToday(), -7), key=r=>r.day+'|'+r.kind;
             const sum=(log)=>{ const o={}; log.forEach(r=>{ if(r && r.day>=from && !personal(r)) o[key(r)]=(o[key(r)]||0)+(r.prize||0); }); return o; };
             const theirs=sum(t.log), ours=sum(CAREER.career.log);
             let delta=0;
             // Только вечера, что есть и у себя: вошедший в чужую карьеру по коду не получает её прошлую неделю.
             Object.keys(theirs).forEach(k=>{ if(ours[k]!==undefined) delta+=theirs[k]-ours[k]; });
             delta=Math.round(delta);
             if(delta){
               const cr=CAREER.career, cut=Math.round(delta*careerOrgCut());
               cr.earnings=Math.max(0, (cr.earnings||0)+delta);
               if(cut) cr.orgCut=(cr.orgCut||0)+cut;
               cr.balance=(cr.balance||0)+(delta-cut);
               careerNews(delta>0 ? 'good' : 'bad', 'ccNewsMpPaySync', [(delta>0 ? '+$' : '−$')+ccNum(Math.abs(delta))]);
             }
           }catch(e){}
           CAREER.career.log=t.log.concat(mine);
           return;
         }
         if(k==='mxDone' && t.mxDone && typeof t.mxDone==='object'){
           const u=Object.assign({}, CAREER.career.mxDone||{}, t.mxDone), o={};
           Object.keys(u).sort().forEach(x=>{ o[x]=u[x]; });   // порядок ключей один у обоих
           CAREER.career.mxDone=o;
           return;
         }
         // «Могу ли играть квал соло-недели сегодня» (ccMXCanStamp) — по нику, объединением; своя отметка — своя.
         if(k==='mxCan' && t.mxCan && typeof t.mxCan==='object'){
           const own=CAREER.career.mxCan||{}, u=Object.assign({}, own, t.mxCan), o={};
           try{ const me=hKey(careerCard()||{handle:''}); if(own[me]!=null) u[me]=own[me]; }catch(e){}
           Object.keys(u).sort().forEach(x=>{ o[x]=u[x]; });
           CAREER.career.mxCan=o;
           return;
         }
         CAREER.career[k]=t[k];
       });
       CC_TEAM_TOP.forEach(function(k){ if(t[k]!==undefined) CAREER[k]=t[k]; });
       /* ФОРМАТ СЕЗОНА (errlog 26.10, пара с карьерой 2021-го: в 2026-м у одного дуо, у другого трио «+zandy»).
          Новый сезон жмёт один, второй берёт его состояние: season и sizes приезжали, а cr.size нет, и у второго
          оставался формат прошлого года. sizes[сезон] пишет careerNewSeason того, кто жал, — по нему и живёт формат.
          2019–2020 меняют формат по датам внутри года — там его ставит ccSyncPhaseRoster. */
       { const cr=CAREER.career, rec=cr.sizes && cr.sizes[cr.season];
         if((rec===2 || rec===3 || rec===4) && !ccPhaseRoster()) cr.size=rec;
         /* Записи ещё нет (первый сезон): у второго оставался формат своего старого сейва, вечера расходились
            дуо против сквада. Решает владелец лобби, его роль едет в t.mp. */
         else if(!rec && !ccPhaseRoster() && (t.size===2 || t.size===3 || t.size===4) 
                 && t.mp && t.mp.role==='a' && cr.mp && cr.mp.role!=='a') cr.size=t.size; }
       // Сид лобби старше присланного. См. ccMpLobbySeed.
       if(CAREER.career.lobbySeed) CAREER.career.seed=CAREER.career.lobbySeed; }
  finally{ CC_MP_ADVANCE=false; }
  if(!CAREER || !CAREER.career || sigOf()!==sig0) ccWorldReset();
}
