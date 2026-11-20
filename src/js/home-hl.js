/*@@PART js/home-hl.js@@*/
/* Можно ли играть сегодняшний день Копенгагена: день 1 — место с Мейджора; день 2 —
   упавший из верхней или место с Last Chance Major; день 3 — прошедший в финал. */
function ccGc23Can(){
  const cr=CAREER.career;
  const seat=ccGlobalsSeat(); if(!seat) return false;
  const st=(cr.gc23 && cr.gc23.season===cr.season) ? cr.gc23 : null;
  const day=ccGc23DayOf(careerToday());
  if(st && (st.you==='done' || st.you==='out')) return false;
  if(day===1) return seat.via==='major2' && !(st && st.you);
  if(day===2) return (seat.via==='lcm' && !(st && st.you)) || !!(st && st.you==='lower');
  return !!(st && st.you==='final');
}
async function runCareerMajor(){
  const cr=CAREER.career;
  const ev=careerMajorOn(careerToday());
  if(!ev || !careerMajorCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('major') : null;
  // Read in the season's own unit: the fields and cuts below are written in
  // duos, and a trio Major seats the same players in a third fewer teams.
  // let, а не const: свой номер хита известен только после посева, а он в
  // одном регионе меняет и число игр, и отсечку. См. ccMajorHeat ниже.
  let st=ccScaleStage(ccMajorStageSpec(ev.stage, ev.n));
  // A month at the facility that covers this day is worth arriving ready.
  careerCampBonus('major', ev.id||ev.label||'');
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  // From the Heats on it is the top of Europe in the room whatever division the
  // player came from — the Last Chance is exactly the door that lets somebody
  // from Division 4 walk into it.
  const deep = ev.stage!=='playin' && ev.stage!=='lcq' && ev.stage!=='lclobby';
  const lobbyCr = deep ? Object.assign({}, cr, {division:1}) : cr;
  // And the Last Chance draws its field the way an open does: every rung of the
  // ladder weighted by how big that room really is, rather than the division the
  // player happens to stand on.
  // Хиты — пятьдесят из плей-ина, финал — пятьдесят из хитов. Раньше и то и
  // другое было одним ровным броском по дивизиону 1, отчего финал выходил ровно
  // такой же силы, как его собственная квалификация.
  const sharp = !deep ? 0
    : (ev.stage==='final' ? CC_FIELD_SHARP.final : CC_FIELD_SHARP.heats);
  /* Хиты — ОДИН из трёх, а не «все сильные разом».

     Жалоба игрока: «в первом хите, где играет человек, всегда
     все сильные и известные команды, не очень реалистично». Так и было: комната
     хитов бралась одним броском на пятьдесят, а careerCupField сажает
     записанные пары первыми — то есть весь верх Европы садился в тот
     единственный хит, который показывают.

     У Epic сто пятьдесят квалифицировавшихся делятся на три хита ЗМЕЙКОЙ по
     посеву: первый в первый хит, второй во второй, третий в третий, четвёртый
     снова в третий. Известные имена расходятся по трём комнатам, и в твоей их
     треть. Ровно это здесь и делается: поле строится на три хита, сортируется
     по силе, сеется seedHeats (та же функция, что у драфта), и играется тот
     хит, в который по своей силе попал сам игрок. */
  const heatsRoom = ev.stage==='heats';
  /* И на экране написано, КОТОРЫЙ из трёх хитов играется.

     Игрок уже после змейки: «всё равно в одном хите все самые
     сильные команды, нету распределения». Замер того же дня говорит обратное —
     из двадцати сильнейших команд поля в трёх хитах лежит 6/7/7, — но узнать
     это с экрана было неоткуда: комната называлась просто «хиты», и любые
     знакомые имена в ней читались как «все сильные собрались тут». Теперь
     карточка этапа говорит «Хит 2 из 3», как у Epic. */
  let heatNo=0;
  /* Соседние хиты — не декорация, их тоже играют. См. ниже, где они считаются:
     финал Мейджора обязан состоять из тех, кто прошёл СВОЙ хит, а не из посева
     по таблице Плей-Ина. Здесь они просто выносятся наружу, чтобы после своего
     вечера было что считать. */
  let otherHeats=null;
  const field = heatsRoom
    ? (()=>{
        /* Сеется финиш Плей-Ина, когда он записан, и сила — когда нет.
           См. ccMajorSeedRows: у Epic змейку раскладывает таблица, а не
           мощность состава, и порядок в записи — это и есть та таблица. */
        const rows=ccMajorSeedRows(ev);
        /* СВОЯ КОМАНДА В ПОСЕВ ХИТОВ НЕ ИДЁТ — В ГОНКЕ.

           Когда таблицы Плей-Ина нет (её пишет только прошедший), поле сеется броском и
           сортируется по силе. Своя команда, вставленная по своей силе, сдвигает вниз
           всех, кто слабее, — а змейка раскладывает сдвинутых по другим хитам. Двое
           получали почти одинаковые, но не одинаковые лобби: прогон 11 сентября,
           17 апреля — «diff 1 of 50» после того, как номер хита уже сошёлся.
           Пул без себя сортируется у всех одинаково, а своё место в хите — последнее,
           тем же правилом, что в Reload (см. ccStageRoom). Соперника досадит
           ccRaceFieldSync, как и всегда. */
        // careerCupField отдаёт поле без своего места (N−1); в гонке себя в посев не кладут — одна команда сверху,
        // иначе один из трёх хитов садился на 49 (замер 7.10: 20 из 60 хитов).
        const pool=careerCupField(lobbyCr, drafted, st.field*ccMajorHeats()+(ccRaceLock() ? 1 : 0), null, false, sharp);
        const seeded = rows
          ? rows.map(r=>r==='you' ? you : ccMajorTeamFrom(r))
          : (ccRaceLock() ? pool.slice() : [you, ...pool]).sort((a,b)=>(b.pow||0)-(a.pow||0));
        const heats=seedHeats(seeded, ccMajorHeats());
        const rAt=ccRaceHeatTogether(heats, you);   // гонка: один хит на комнату
        const at=rAt>=0 ? rAt : heats.findIndex(h=>h.indexOf(you)>=0);
        heatNo=(at<0 ? 0 : at)+1;
        const mine=heats[at<0 ? 0 : at];
        if(mine.indexOf(you)<0) mine[mine.length-1]=you;
        otherHeats=heats.filter(h=>h!==mine);
        // Комната ровно того размера, каким её описывает этап: змейка делит
        // поле нацело, но своя строка уже внутри — добирать не из чего.
        return mine.slice(0, st.field);
      })()
    : ev.stage==='final'
      // Финал садится из таблицы Плей-Ина, а не из свежего броска. См.
      // ccMajorFinalRoom — пары внутри турнира не пересобираются.
      ? ccMajorFinalRoom(you, lobbyCr, drafted, ev, st, sharp)
      : ev.stage==='lclobby'
      ? ccMajorLcRoom(you, ev)
      // В Ласт Ченсе поле строится без тех, у кого место в финале уже есть.
      // См. ccMajorSeatedHandles.
      : [you, ...careerCupField(lobbyCr,
                                ev.stage==='lcq' ? drafted.concat(ccMajorSeatedHandles(ev)) : drafted,
                                st.field, null, ev.stage==='lcq', sharp)];

  /* И теперь, когда номер хита известен, этап отвечает за СВОЙ хит.

     В глубоком регионе это ничего не меняет — все три одинаковые. В Мейджоре 1
     у Океании, Азии и Ближнего Востока второй хит шёл шесть игр вместо пяти и
     пускал двадцать четыре вместо двадцати трёх: попал игрок в него — вечер у
     него на игру длиннее. Поле у всех хитов одно и то же, поэтому пересчитывать
     нужно только эти два числа, и отсечку — в командах сезона (ccTeams), как
     это делает ccScaleStage. */
  if(heatsRoom && heatNo){
    const h=ccMajorHeat(ev.n, heatNo);
    st=Object.assign({}, st, {games:h.games, cut:h.raw ? h.cut : ccTeams(h.cut)});
  }

  /* Дроп выбирается в финале и в хитах — отзыв: «пусть не
     надо ставит метку в плейин и опенах ласт ченса, ток в финалах» и следом
     «в хитах тоже можно, там 100 людей в лобби». Правило — комната в одно
     лобби на сто человек (в трио девяносто девять): хит и финал живут весь
     вечер одной комнатой, и точка на острове там своя. Пикер на всех этапах
     прожил один вечер: Ласт Ченс открыт всему ладдеру и нарисовал две с
     половиной тысячи меток, Плей-Ин — свои двести; открытые этапы получают
     дроп раздачей, как получали. */
  /* Точка выбирается на всём Мейджоре, кроме открытого Ласт Ченса: тот один
     открыт всему ладдеру и рисовал две с половиной тысячи меток — скриншот. Правка: «нельзя только в опенах выбирать» —
     Плей-Ин на двести команд теперь тоже выбирает. */
  const zones=null;
  /* A Victory Royale in the Heats ends that team's night.

     It is the stage's own rule — a won game is the ticket — and the draft mode
     has always passed stopOnWin for it. The career runner never did, so a duo
     that had already qualified kept being seated in the next game and could win
     it again: Focus & Th0masHD, 17 August, two wins in five games with the
     qualification bonus counted twice — 2132 points against 212 for a duo that
     won nothing, and every row reading five matches where the ones who came
     through should have played fewer. The size of the bonus is not the problem;
     it is what makes a win a ticket rather than something grindable. Taking it
     twice is. */
  // Название комнаты — с номером хита, когда хит один из трёх.
  const stageLabel = heatNo ? ev.label+' · '+L().ccHeatOf(heatNo, ccMajorHeats()) : ev.label;
  await simulateGamesLive(field, st.games, st.pts, st.kill, 'stage', 0, null, zones,
    {twoDay:ev.stage==='final', lobbySize:ccTeams(50), stageName:stageLabel, mapReplay:true, choices:true, stopOnYourDeath:true,
     stopOnWin: ev.stage==='heats' || ev.stage==='lclobby', roomOnly: ev.stage==='lclobby',
     // Каждую игру, а не раз за этап — правка. LCQ идёт одним
     // общим полем и точку не выбирает вовсе, поэтому и вопроса там нет.
     dropEachGame:(g,room)=>ev.stage==='lcq' ? null : careerLandingPick(room||field, you, stageLabel, ['major'])});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  let through = st.cut ? place<=st.cut : false;
  // A Victory Royale in the Heats is a ticket on its own — that is what the 944
  // is for, and a team that won a game is already above the cut anyway. Said out
  // loud so the rule does not depend on the arithmetic.
  if((ev.stage==='heats' || ev.stage==='lclobby') && (you.wins||0)>0) through=true;
  removeSkipButton();

  const shell=createStageCardShell(stageLabel+' — '+field.length);
  await revealStageLog(you, shell, true);
  /* Финал Мейджора отсечки не имеет, и потому его карточка молчала о том,
     ради чего он играется. Игрок: «не пишет, сколько квал на
     лан» и «не пишет, сколько нужно квал для самита» — обе строки про одно и
     то же место на карточке. Теперь на нём написано, сколько мест даёт ЭТОТ
     финал: Мейджор 1 — Саммит и Второй шанс, Мейджор 2 — Global Championship,
     всё по своему региону (ccGcSlots) и по размеру состава (ccTeams). */
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, st, place, ev.stage==='final' ? majorPrize : null), false,
    st.cut ? (through ? L().ccRelPass(st.cut) : L().ccRelFail(st.cut))
           : (ev.stage==='final' ? ccMajorSeatNote(ev) : ''));
  /* У финала отсечки нет — ||10 рисовал на нём красную «топ-10 проходят» и
     тушил всех ниже, хотя проходить из финала некуда. Игрок:
     «линия в див капе пропала, а на фнкс осталась». Призовая колонка остаётся. */
  await revealStandings(shell, ranked, you, st.cut, null, null,
    ev.stage==='final' ? majorPrize : null, null, ev.stage==='final');
  careerPrAdd(ranked, {div:CAREER.career.division, kind:'major', stage:ev.stage});

  // The Last Chance Lobby: the fifty who came through, four matches, and only a
  // win is worth anything.
  let ticket=false, lobbyPlace=null, lcLobby=null, lcSeats=0;
  /* 2025: Ласт Ченс Мейджора и раунд 1 FNCS Showdown проходят местом (топ-33), без лобби «только
     победа» из 2026-го. Showdown попадал в то лобби, и без победы в нём раунд 2 не открывался;
     LCQ Мейджора писал «не прошёл» по пустому билету (аудит 29.09). */
  const lcByPlace=ev.stage==='lcq' && ccIs2025();
  // Гонка: лобби Ласт Ченса общее, только если ВСЯ комната прошла открытый этап (как у Victory Cup и Evaluation).
  if(ev.stage==='lcq' && typeof ccRaceLock==='function' && ccRaceLock()){
    const top=ranked.slice(0, ccTeams(CAREER_CUP_CUT));
    const rivalOut=ccRaceNightRoom().some(p=>!top.some(t=>t.mpTag===':'+hKey(p.card)));
    if(!through || rivalOut) ccRaceNightApart();
  }
  /* 2025: прошедшие LCQ записываются, лобби — завтра, своим днём (careerMajorOn:
     Major<n>_2025_LCLobby). Комната лобби — ровно те, кто прошёл. */
  if(ev.stage==='lcq' && through && ccMajLc2025(ev)){
    cr.majorLc={n:ev.n, season:cr.season, rows:ranked.slice(0, st.cut).map(t=>ccSeedRow(t, you, ccMajorSeatRow))};
  }
  if(ev.stage==='lcq' && through && !lcByPlace){
    const lobby=ranked.slice(0, ccTeams(CAREER_CUP_CUT));
    ensureSkipButton();
    // Лобби Ласт Ченса — одна комната из пятидесяти, и точка в ней выбирается,
    // как в любой закрытой комнате.
    const lobbyZones=null;
    /* Выиграл — уехал. Победа здесь и ЕСТЬ билет (ticket ниже читает ровно
       её), а комната играла все четыре игры целиком, и один и тот же состав
       успевал взять две победы на место, которое даётся за одну.

       Отзыв: «кто катку в ласт ченс выиграл не мог играть
       дальше, потому что у них по 2 победы, хотя в игре такого быть не может».
       Правило у этапа уже было записано словами — «only a win is worth
       anything», — просто некому было снять победителя со стула. Тот же
       stopOnWin, что стоит на хитах. */
    const lcPts=ccLcByPoints(ev);
    lcLobby=lobby;
    await simulateGamesLive(lobby, CC_MAJOR_LC_LOBBY_GAMES, lcPts ? majorPoints : victoryR2Points, lcPts ? st.kill : 0,
      'stage', 0, null, lobbyZones,
      {lobbySize:ccTeams(50), stageName:L().ccMajLobby, mapReplay:true, choices:true, stopOnYourDeath:true,
       stopOnWin:!lcPts, roomOnly:true,
       dropEachGame:(g,room)=>careerLandingPick(room||lobby, you, L().ccMajLobby, ['major'])});
    removeSkipButton();
    /* И таблица читается победами, а не очками. Победитель уходит после своей
       игры и очков больше не набирает: по очкам он оказывался ниже тех, кто
       четыре раза приехал вторым и не взял ничего. В комнате, где считается
       только победа, порядок — победы, потом очки. */
    const lr=ccLcLobbySort(lobby, ev);
    lobbyPlace=lr.indexOf(you)+1;
    lcSeats=lcPts ? ccLcLobbySeats(ev, 1) : 0;
    ticket=lcPts ? lobbyPlace<=lcSeats : (you.wins||0)>0;
    const sh2=createStageCardShell(L().ccMajLobby+' — '+lobby.length);
    await revealStageLog(you, sh2, true);
    // По очкам — строка про топ-5, не «ни одной победы»: победа там ничего не решает.
    finalizeStageCard(sh2, lobbyPlace, lobby.length, you.stagePts, ticket, false,
      lcPts ? (ticket ? L().ccRelPass(lcSeats) : L().ccRelFail(lcSeats))
            : (ticket ? L().ccMajTicket : L().ccMajNoTicket));
    await revealStandings(sh2, lr, you, lcPts ? lcSeats : 0);
  }

  let cash=0;
  if(ev.stage==='final'){
    careerMoneyAdd(ranked, majorPrize);
    cash=majorPrize(place);
    if(cash){
      const mine=ccShareOf(cash, you);
      ccPayIn(mine);
    }
    careerReachAdd(careerReachResult(place, field.length, 1, 'major'));
    careerNews(cash?'good':'flat', cash?'ccNewsMajCash':'ccNewsMajNoCash',
               cash?[ev.n, place, ccNum(cash)]:[ev.n, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    /* И короткая строка о том, как это было, когда финал не удался. Так и
       пишут: «tried our best / wasn't enough / gg :/» (@MrSavage, 2 августа,
       8,5 тысячи лайков). Ниже середины поля — значит вечер не получился. */
    if(place>field.length/2) careerNews('bad', 'ccPostTriedBest', []);
    careerCongrats(ranked, you, L().ccCongratsMajor(ev.n));
    if(typeof ccIs2025==='function' && ccIs2025() && !ccMajorIsShowdown(ev.n)) ccGcKeepFinal(2025, ev.n, ranked.map(t=>ccSeedRow(t, you, ccMajorSeatRow)));
    else if(ccCalYear()===2026 && ev.n===2) ccGcKeepFinal(2026, 2, ranked.map(t=>ccSeedRow(t, you, ccMajorSeatRow)));
    cr.major={n:ev.n, got:'final', pass:'final', ticket:false};
  } else {
    const won = (ev.stage==='lcq' && !lcByPlace) ? ticket : through;
    /* Two different facts, and they were one field.

       His screenshot, 17 August: a Division 4 career told it was holding a slot
       at Major 2. It was not. The only Major stage a Division 4 player can enter
       is the Last Chance, he entered it and went out, and this wrote got:'lcq' -
       because got is the last stage played. Everything downstream read it as the
       last stage cleared, so playing a tournament and losing it counted as a
       place in that tournament.

       got is what stops a stage being played twice. pass is what a place in a
       Major actually is, and only a stage you came through writes it. */
    /* И Плей-Ин оставляет после себя таблицу, по которой сеются Хиты.

       Пишется в порядке финиша и только когда прошёл: не прошёл — хитов
       и не будет. Своя строка отмечена словом, а не составом: к среде состав
       может быть уже другим, а место в таблице от этого не меняется. */
    if(ev.stage==='playin' && through)
      cr.majorSeed={n:ev.n, season:cr.season, size:careerSquadSize(),
                    rows:ranked.slice(0, st.cut).map(t=>ccSeedRow(t, you, ccMajorSeatRow))};
    /* А Хиты оставляют после себя тех, кто из комнаты игрока прошёл.

       Их места в финале не обсуждаются: игрок видел, как они их выиграли, и
       увидит их там же. Победа в игре — тоже билет (heatQualifiers), поэтому
       список читается по тому же правилу, а не по одной отсечке. Остальные
       сорок мест финал добирает сам — из той же таблицы Плей-Ина. */
    if(ev.stage==='heats' && cr.majorSeed && cr.majorSeed.n===ev.n &&
       cr.majorSeed.season===cr.season){
      const q=heatQualifiers(field, st.cut, winIsATicket());
      const rows=ranked.filter(t=>q.has(t))
                       .map(t=>ccSeedRow(t, you, ccMajorSeatRow));
      /* Свой хит записан, соседние играются в свои дни, см. ccMajorWorldHeats.
         Хиты в календаре занимают три дня, по одному на хит, как у Epic. Считать все
         соседние сразу после своего вечера дорого: вечер рос с 38 до 61 с
         (tools/major-heats-sim-probe.js), а модель ради скорости менять нельзя, весь
         этап должен идти одной моделью. По дням это один хит на вечер. */
      /* Дописывает, а не перезаписывает. Блок хитов идёт три дня, мир играет соседние дни сам (ccMajorWorldHeats
         дописывает: `(s.through||[]).concat`). С `through=rows` вечер игрока стирал прошедших раньше,
         ccMajorSeatedHandles пускал их в Ласт Чанс, а финал добирался посевом.
         Дописывание идемпотентно (уже лежащая строка второй раз не ложится), перемотка через тот же день не задваивает.
         */
      ccMajorSeedThrough(cr, rows, heatNo||0);
    }
    /* Ласт Ченс, отыгранный САМИМ игроком, тоже оставляет своих прошедших.

       Мир играет этот день только когда игроку там делать нечего
       (ccMajorWorldLcq). Если билета нет, Ласт Ченс идёт своими руками — и без
       этой ветки его результат пропадал бы, а последние места финала опять
       добирались посевом. Берётся столько же, сколько взял бы мир: сколько
       зала осталось незанятым после хитов. */
    if(((ev.stage==='lcq' && (!ccMajLc2025(ev) || !through)) || ev.stage==='lclobby') && cr.majorSeed && cr.majorSeed.n===ev.n &&
       cr.majorSeed.season===cr.season && !cr.majorSeed.lcq){
      const fin=ccScaleStage(ccMajorStageSpec('final', ev.n));
      const need=Math.max(0, fin.field-((cr.majorSeed.through||[]).length));
      // Места — из лобби: сыгранного (своего), а без тебя в нём — досчитанного тем же правилом.
      let lobT=ev.stage==='lclobby' ? ranked.slice() : lcLobby;
      if(!lobT){ lobT=ranked.slice(0, ccIs2025() ? st.cut : ccTeams(CAREER_CUP_CUT)).filter(t=>t!==you); ccLcLobbySim(lobT, ev, st.kill); }
      const add=ccLcLobbyPick(lobT, ccLcLobbySeats(ev, need), ev).map(t=>ccSeedRow(t, you, ccMajorSeatRow));
      cr.majorSeed.through=(cr.majorSeed.through||[]).concat(add);
      cr.majorSeed.lcq=add;
    }
    /* Финал Мейджора 2 раздаёт места на Глобалы — своему региону.

       Отзыв: «а глобалы все, мейджоры наверное можно добирать
       с регионов, это слишком долго всё делать». Так и сделано: чужие регионы
       по-прежнему читаются с их лидербордов (их Мейджоры нигде не играются, и
       симулировать семь параллельных сезонов — это не правка), а СВОЙ регион
       ты играешь сам, и его девять мест теперь достаются тем, кто их выиграл.

       Лежит отдельным ключом, а не в majorSeed: тот перезаписывается каждым
       новым Мейджором, а до Антверпена ещё полсезона. */
    if(ev.stage==='final' && ev.n===2){
      const slots=ccTeams(MAJOR2_GC_SLOTS[ccCareerRegion()]||0);
      if(slots) cr.gcSeed={season:cr.season, size:careerSquadSize(),
                           reg:ccCareerRegion(),
                           m2:ranked.slice(0, slots)
                                    .map(t=>ccSeedRow(t, you, ccMajorSeatRow))};
    }
    const prev=(cr.major && cr.major.n===ev.n) ? cr.major : null;
    cr.major={n:ev.n, got:ev.stage,
              pass: won ? ev.stage : (prev ? prev.pass||null : null),
              ticket: won && (ev.stage==='heats' || ev.stage==='lclobby' || (ev.stage==='lcq' && !ccMajLc2025(ev)))
                      ? true : !!(prev && prev.ticket)};
    careerNews(won?'good':'flat', won?'ccNewsMajThrough':'ccNewsMajOut',
               [ev.label, place, field.length],
               {tbl:ccStageShot(ranked, you, 1, stageLabel)});
    // «qual grands, land X» — свой пост и посты прошедших из комнаты. См. ccGrandsCalls.
    if(ev.stage==='heats') ccGrandsCalls('grands', you, won, [...heatQualifiers(field, st.cut, winIsATicket())]);
    /* «Одного места не хватило» — отдельная строка, и говорит её сам игрок.

       Снято с живой ленты (@MrSavage, 31 августа: «i was one spot off globals
       im depressed»): промах на одно место — это не то же самое, что не пройти,
       и в жизни про него пишут отдельно. Числа для этого у вечера уже есть:
       место и отсечка. */
    if(!won && st.cut && place===st.cut+1) careerNews('bad', 'ccPostOneOff', [ev.label]);
  }

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(lobbyPlace||place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division,
               place:lobbyPlace||place, of:field.length, pts:you.stagePts,
               passed: (ev.stage==='lcq' && !lcByPlace) ? ticket : (ev.stage==='final' ? cash>0 : through),
               ovr:CAREER.player.ovr, games:st.games, wins:you.wins||0,
               elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'major', stage:ev.stage,
               won: ev.stage==='final' ? ccStageSeatRow(ranked[0]) : undefined,
               top: ev.stage==='final' ? ccStageTop(ranked, you) : undefined});
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  /* The other door into a LAN, and it was as quiet as the Last Chance was.

     A Major Final is where the seats are handed out — Major 1's for the Summit,
     Major 2's for Antwerp — and this card said nothing about either, because
     `seat` was written for the stages that carry a ticket and switched itself
     off for the Final. A player finished ninth, was paid, was shown a green card
     that talked about money, and found out whether they were going by pressing
     Play on a day two months later. Read off the same two functions the calendar
     reads, so the card cannot say one thing and the calendar another. */
  const lanSeat = ev.stage==='final'
    ? (ev.n===2 ? ((ccGlobalsSeat()||{}).via==='major2' ? L().ccRelSeatGc(ccLanCity('globals')) : null)
                : (ccSummitSeat()==='main' ? L().ccRelSeatLan : null))
    : null;
  /* Место — из лобби, значит и строка про лобби: «топ-2 · мимо топ-50» (Notion 25.10) мешал место в лобби с
     отсечкой LCQ. */
  careerReloadResultCard({label:ev.label, place:lobbyPlace||place, of:field.length,
    through: (ev.stage==='lcq' && !lcByPlace) ? ticket : (ev.stage==='final' ? cash>0 : through),
    cut:st.cut||CAREER_CUP_CUT,
    note: lobbyPlace ? (lcSeats ? (ticket ? L().ccRelPass(lcSeats) : L().ccRelFail(lcSeats))
                                : (ticket ? L().ccMajTicket : L().ccMajNoTicket)) : null,
    /* 16.09, тестер: «после квала на какой-то турнир всегда пишет "место на
       Esports World Cup"». Хиты и LCQ ставили seat без текста, а запасной текст
       карточки — про Reload. Билет в следующую стадию карточка и так называет
       строкой «Топ-N — проход дальше»; строка места — только когда место есть. */
    seat: !!lanSeat,
    seatText: lanSeat,
    money: ev.stage==='final' ? cash : null});
}

/* Кто прошёл неделю — по именам, одной строкой.

   Тот же ключ, которым ccRelPack подписывает строку таблицы, и по той же
   причине: писать команды целиком стоило 315 КБ на понедельник и убивало сейв.
   Своя строка не пишется — своё место в финале и так есть, отдельным билетом. */
function ccWfCutKeys(ranked){
  return (ranked||[]).slice(0, ccTeams(CAREER_CUP_CUT))
    .filter(t=>t && !t.isYou)
    .map(t=>ccRelKey(t).split(';').join(','))
    .filter(Boolean).join(';');
}
/* Комната в субботу — это те, кто прошёл, а не свежая горсть из пула.

   Поле кубка воспроизводимо: тот же сезон, та же неделя, тот же дивизион —
   тот же бросок и те же дуо. Поэтому здесь оно собирается заново целиком и из
   него оставляются строки, которые записал ccWfCutKeys. Кого список не назвал
   (старый сейв, где списка ещё нет), добирается из того же поля по порядку —
   ровно то, что финал делал всегда, но теперь как запасной путь, а не как
   основной. */
function careerWeeklyFinalField(cr, drafted){
  const want=ccTeams(CAREER_CUP_CUT)-1;
  const keys=String((cr.wf && cr.wf.cut) || '').split(';').filter(Boolean);
  if(!keys.length) return careerCupField(cr, drafted, ccTeams(CAREER_CUP_CUT));
  const cup=careerCupField(cr, drafted, careerCupSize(cr.division), ccCupWeekSalt());
  const byKey=new Map();
  cup.forEach(t=>{ const k=ccRelKey(t).split(';').join(','); if(!byKey.has(k)) byKey.set(k, t); });
  const out=[], taken=new Set();
  keys.forEach(k=>{
    if(out.length>=want || taken.has(k)) return;
    const t=byKey.get(k);
    if(t){ taken.add(k); out.push(t); }
  });
  // Недобор — тем же порядком, каким кубок сажал их в лобби.
  for(let i=0;i<cup.length && out.length<want;i++){
    const k=ccRelKey(cup[i]).split(';').join(',');
    if(taken.has(k)) continue;
    taken.add(k); out.push(cup[i]);
  }
  return out;
}
async function runCareerWeeklyFinal(){
  const cr=CAREER.career;
  if(!careerWeeklyFinalOn(careerToday())) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('final') : null;
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  if(CC_AWAY) you.pow=Math.max(1, Math.round(you.pow-CC_AWAY.pen));   // чужой сервер: пинг (ccAwayPen)
  // The fifty who came through the week, which in Division 1 is the roster's own
  // duos — careerCupField already seats them there.
  const field=[you, ...careerWeeklyFinalField(cr, drafted)];

  const kindsForDrop=['cup'];
  const zones=null;
  await simulateGamesLive(field, CC_WF_GAMES, wfPoints, CC_WF_KILL, 'stage', 0, null, zones,
    {lobbySize:ccTeams(50), stageName:L().calWeeklyFinal, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, L().calWeeklyFinal, kindsForDrop)});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  const cash=wfPrize(place);
  removeSkipButton();

  const shell=createStageCardShell(L().calWeeklyFinal+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, cash>0, false,
    cash ? L().ccWfCash(ccNum(cash)) : L().ccWfNoCash);
  // Из Финала недели никуда не проходят — это вечер денег, а не отсечки, и
  // «линия отсечки: топ-10 проходят» над ним врала. Скрин игрока,
  // 21 августа. Призовая колонка (wfPrize) остаётся.
  await revealStandings(shell, ranked, you, 0, null, null, wfPrize, false, true);
  careerPrAdd(ranked, {div:1, kind:'final'});

  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
  }
  // Выезд: таблица сезона и деньги сцены — домашние, чужой финал их не пишет (ccAwayPlay).
  if(!CC_AWAY){ careerTableAdd(ranked); careerMoneyAdd(ranked, wfPrize); }
  careerReachAdd(careerReachResult(place, field.length, 1, 'final'));
  careerNews(cash?'good':'flat', cash?'ccNewsWfCash':'ccNewsWfNoCash',
             cash?[place, ccNum(cash)]:[place, field.length],
             {tbl:ccStageShot(ranked, you, 1, L().calWeeklyFinal)});
  if(!CC_AWAY){ careerCongrats(ranked, you, L().calWeeklyFinal); careerD1TablePost(); }
  // The seat is spent whether or not it went well.
  delete cr.wf;

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:1, place:place, of:field.length,
               pts:you.stagePts, passed:cash>0, ovr:CAREER.player.ovr, games:CC_WF_GAMES,
               wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you), kind:'final'});
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked);
  if(!CC_AWAY){ ccAwayHomeDone(careerToday(), 'final'); careerAdvanceTo(ccAddDays(careerToday(), 1)); }   // выезд день не берёт
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerReloadResultCard({label:L().calWeeklyFinal, place:place, of:field.length,
    through:cash>0, cut:40,
    seat:false, money:cash});
}

/* Место на Championship уходит тому, у кого его ещё нет: уже прошедший сохраняет
   место и деньги, путёвка съезжает ниже по таблице, как у Epic (у Глобалов это
   awardSeats и метка «уже в квале» в revealStandings). У Reload четыре финала
   раздают места одному кругу. Знаем себя (cr.ewc) и тех, кто взял места в
   сыгранных финалах (cr.relSeats, ники); финалы без игрока мест не раздают.
   Только текущий сезон: cr.ewc не чистится (это и трофеи), записи без сезона = первый. */
function ccRelMySeats(cr){
  return ((cr && cr.ewc) || []).filter(e => (e.season || 1) === ((cr && cr.season) || 1));
}
function ccRelHoldsSeat(you){
  const cr=CAREER.career;
  const mine=ccRelMySeats(cr).length>0;
  const held=new Set();
  (cr.relSeats||[]).filter(r=>r && (r.s||1)===(cr.season||1))
    .forEach(r=>(r.h||[]).forEach(h=>held.add(_gcNorm(h))));
  return t=>{
    if(!t) return false;
    if(t===you) return mine;
    return (t.squad||[]).some(p=>p && held.has(_gcNorm(p.handle)));
  };
}
// Кто взял места сегодня — в память круга, чтобы следующий финал их пропустил.
function ccRelSeatsKeep(cr, seats, you){
  if(!seats) return;
  cr.relSeats=(cr.relSeats||[]).concat([...seats].filter(t=>t!==you)
    .map(t=>({s:cr.season||1, h:(t.squad||[]).map(p=>p && p.handle).filter(Boolean)}))
    .filter(r=>r.h.length));
}

async function runCareerReload(){
  const cr=CAREER.career;
  const ev=careerReloadOn(careerToday());
  if(!ev || !careerReloadCan(ev)) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('reload') : null;
  // In this season's teams: a Reload lobby is forty players, which is twenty
  // duos or thirteen trios, and the circuit's fields and cuts are written in
  // duos like everything else here. See ccTeams.
  const st=ccScaleStage(CC_RELOAD_STAGE[ev.stage]);
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted, prevSet=ACTIVE_LANDING_SET;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // The circuit stops counting a match's eliminations at ten. See ccKillPts.
  CC_KILL_CAP=CC_RELOAD_KILL_CAP;
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);
  // The circuit has its own island and the project has both of them on disk —
  // cups 1 and 2 on one, 3 and 4 on the other. Nothing in the career was ever
  // switching the map, so every Reload night was played on the Major island.
  useLandingSet(ev.set);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  /* Who is in the room.
     From the heats on it's the top of Europe, not the player's division: a Reload final is the best 20 duos on the continent.
     Opens and Play-Ins also draw the open field (every real EU duo on the roster plus the ladder from all rungs), not the player's band. Reload Elite Series 1 Opens top ten is Focus, Th0masHD, Sky, Scroll, vic0, Malibuca, Cr1nge, the same names as the Majors. */
  const deep = st.field<=20;
  const open = !deep;
  const lobbyCr = deep ? Object.assign({}, cr, {division:1}) : cr;
  const sharp = !deep ? 0
    : (ev.stage==='final' ? CC_FIELD_SHARP.final : CC_FIELD_SHARP.heats);
  const field=ccRelRoom(you, drafted, lobbyCr, ev, st, open, sharp);

  /* Дроп выбирается везде, кроме Опенов, — правка: «нельзя
     только в опенах выбирать». Опены открыты всему региону и получают дроп
     раздачей, как получали; Плей-Ин, хиты и финал выбирают. */
  const kindsForDrop=['reload'];
  const zones=null;
  // The second evening of the Opens walks in with the first one's points, so the
  // table on screen is the tournament's all night and the line across it is the
  // real cut.
  const banking=careerReloadBanking(ev), carry=careerReloadCarry(ev);
  await simulateGamesLive(field, st.games, reloadCareerPoints(ev.set), st.kill,
    'stage', 0, null, zones,
    {lobbySize:Math.min(st.field, ccReloadLobby(careerSquadSize())), stageName:ev.label,
     mapReplay:true, choices:true, stopOnYourDeath:true,
     carry:carry, cutAt: banking ? 0 : st.cut,
     // Остров меняется игра через игру — кроме опенов, где карты нет вовсе.
     mapEach: ev.stage==='open' ? null : (g)=>ccRelIsland(ev.set, g),
     // И каждую игру — там же, где вообще выбирают.
     dropEachGame:(g,room)=>ev.stage==='open' ? null
                    : careerLandingPick(room||field, you, ev.label, kindsForDrop)});
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  careerPrAdd(ranked, {div:CAREER.career.division, kind:'reload', stage:ev.stage});
  const through=!banking && place<=st.cut;
  removeSkipButton();

  // Two evenings make one card: session 1's games in front of tonight's,
  // renumbered so the list reads straight through.
  if(carry && carry.log && carry.log.length){
    you.stageLog=carry.log.concat((you.stageLog||[]).map(g=>({...g, game:g.game+carry.log.length})));
    // Yours are in the log now, so the carry must not be counted a second
    // time on top of it - every other row still counts theirs off the team.
    you._carryGames=0;
  }

  /* An Opens is played in a sample of the real one, so it is read out at the
     real one's size: a place multiplied out of 2,100 into 9,766, and the line
     drawn where Epic draws it, at a thousand. Nothing here decides anything -
     "through" was settled on the room's own cut two lines above. See
     ccOpenScale. */
  const openRoom = ev.stage==='open';
  const showOf = openRoom ? ccOpenTrue() : field.length;
  const showPlace = openRoom ? ccOpenShow(place, field.length) : place;
  const showCut = openRoom ? ccOpenAdvanceNow() : st.cut;
  CC_RANK_SCALE = openRoom ? ccOpenScale(field.length) : 1;

  /* Приз — на самой карточке этапа. Скриншот («не пишут призы»):
     топ-1 финала капа читал «Топ-3 — проход дальше» и ни слова о деньгах —
     их показывала только маленькая карточка ниже, до которой не все
     долистывают. relStagePrize чистая, платит по-прежнему один блок ниже. */
  const cashNote=(()=>{ if(banking) return '';
    const c=relStagePrize(ev.stage, place);
    const m=c ? ccShareOf(c, you) : 0;
    return m ? ' · '+L().ccWfCash(ccNum(m)) : ''; })();
  const shell=createStageCardShell(ev.label+' - '+showOf);
  await revealStageLog(you, shell, true);
  // В финале дальше идти некуда: проход — это место на EWC, а если оно уже есть, так и пишем.
  const passText=ev.stage==='final'
    ? (ccRelMySeats(cr).length ? L().ccRelSeatHave : L().ccRelSeat)
    : L().ccRelPass(showCut);
  finalizeStageCard(shell, showPlace, showOf, you.stagePts, through, false,
    banking ? L().ccRelBanked
            : (through ? passText : L().ccRelFail(showCut))+cashNote);
  /* Кто из этой таблицы едет на Championship. Считается ДО таблицы, потому что
     таблица это и показывает: взявшие место — зелёной меткой, уже имеющие его —
     жёлтой «уже в квале» и без затемнения, ведь финиш позади такой команды
     место всё равно даёт. См. ccRelHoldsSeat и revealStandings. */
  let relSeats=null;
  if(ev.stage==='final' && !banking){
    CC_REL_HELD=ccRelHoldsSeat(you);
    relSeats=new Set(awardSeats(ranked, st.cut, holdsLanSeat));
  }
  await revealStandings(shell, ranked, you, banking ? 0 : st.cut, null, relSeats, p=>relStagePrize(ev.stage, p), null, ev.stage==='final');
  CC_REL_HELD=null;
  CC_RANK_SCALE = 1;

  /* The first evening settles nothing. The points are put away and the table
     they belong to is drawn on the second, out of both - the same rule Division
     1's Monday follows, and for the same reason: half a tournament is not a
     small result, it is no result. */
  if(banking){
    cr.rel={id:ev.id, series:ev.series, first:careerToday(), rows:ccRelPack(field)};
    cr.rel.log=(you.stageLog||[]).map(g=>({game:g.game, place:g.place, elims:g.elims,
                                           pts:g.pts, elimPts:g.elimPts, label:g.label}));
    // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
    await ccMpClose(ranked);
    careerAdvanceTo(ccAddDays(careerToday(), 1));
    careerSave();
    CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
    CAREER_RUN=false;
    careerRenderHub('centre');
    careerBankedCard(showPlace, showOf, you.stagePts, L().ccRelBanked, st.games);
    return;
  }

  // A seat at the Esports World Cup is what the final is for. Epic gives Europe
  // first, second and third — and the circuit pays as well, which this used to
  // deny. See CC_REL_PRIZES.
  const cash=relStagePrize(ev.stage, place);
  // Всё, что вечер платит по таблице, — в зачёт призовых каждому в лобби,
  // как это делает Weekly Final; кошелёк ниже — только твоя половина.
  careerMoneyAdd(ranked, p=>relStagePrize(ev.stage, p));
  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
    // In the feed as well, the way every other paying night is.
    careerNews('good', 'ccNewsRelCash', [ev.label, showPlace, ccNum(mine)],
               {tbl:ccStageShot(ranked, you, CAREER.career.division, ev.label, st.cut)});
  }
  let seat=false, seatText=null;
  if(through){
    if(ev.stage==='final'){
      seat = relSeats ? relSeats.has(you) : true;
      cr.reload={series:ev.series, got:'final'};
      if(seat){
        cr.ewc=cr.ewc||[];
        // Сезон на записи: место действует в своём году. См. ccRelMySeats.
        cr.ewc.push({series:ev.series, place:place, day:careerToday(), season:cr.season});
        careerNews('good', 'ccNewsRelSeat', [ev.series, place]);
        careerEvent('tlSeat', [ev.series]);
      } else {
        /* Топ-3, но место уже есть — вечер обязан назвать того, кому путёвка
           ушла. Это те, кто взял место, стоя НИЖЕ отсечки: выше неё места
           берут своим результатом, а не твоим отказом. */
        const down=[...relSeats].filter(t=>ranked.indexOf(t)>=st.cut);
        const to=down.length ? down[down.length-1] : null;
        // В имени команды флаги тегами; карточка и лента пишут текстом.
        const toName=to ? String(to.name||'').replace(/<[^>]*>/g, '').trim() : '';
        seatText = toName ? L().ccRelSeatPass(toName) : L().ccRelSeatHave;
        careerNews('flat', 'ccNewsRelSeatPass', [ev.series, place, toName]);
      }
    } else {
      cr.reload={series:ev.series, got:ev.stage};
      careerNews('good', 'ccNewsRelThrough', [ev.label, showPlace]);
      /* И стадия оставляет после себя тех, кто из неё вышел, — их места в
         следующей комнате не обсуждаются. Только глубокие стадии: у отборов
         отсечка в сотни команд, и такая строка однажды уже убила сейв. Победа
         в игре у Reload билетом не является — см. heatQualifiers. */
      const NEXT={playin:'heat', heat:'final'};
      if(NEXT[ev.stage]){
        const q=heatQualifiers(field, st.cut, false);
        /* И тех, кто из неё НЕ вышел, — чтобы добор следующей комнаты их не
           поднял обратно. См. ccRelRoom.

           Одними никами, а не строками: список нужен только затем, чтобы
           careerCupField их не выдал, а он читает ники (hKey). И только с
           маленьких этапов — у отбора комната в сотни команд, и складывать её
           целиком в сейв нельзя, это та самая строка, которая однажды уже
           убил сейв. Хиту с его двадцатью дуо ограничение не мешает, а добор
           есть только у него: из отбора выходит восемьдесят команд на
           девятнадцать мест хита, добирать там нечего. */
        const out=(field.length<=CC_REL_OUT_MAX)
          ? ranked.filter(t=>!q.has(t) && t!==you)
                  .reduce((a,t)=>a.concat((t.squad||[]).map(c=>c && c.handle)
                                                       .filter(Boolean)), [])
          : null;
        /* И СОСЕДНИЕ хиты круга — их играет мир, но позже.

           Отзыв: «делай финал релоад». Из отбора выходит
           восемьдесят команд, хит — двадцать, отсечка пять: четыре хита дают
           ровно двадцать мест финала. Игрок отыгрывает один, и до сегодня
           остальные пятнадцать мест финал добирал свежим полем — то есть за
           три четверти зала никто не играл.

           Комнаты соседних хитов складываются здесь, потому что только здесь
           они ещё известны: строка ниже ПЕРЕЗАПИСЫВАЕТ relSeed, и таблица
           отбора, по которой их раскладывает змейка, после этого пропадает.
           Играет их ccRelWorldHeats в один из шести дней до финала — не в твой
           вечер, чтобы он не подорожал. */
        let pending=null;
        if(ev.stage==='heat'){
          const prevRows=(cr.relSeed && cr.relSeed.next==='heat' &&
                          Array.isArray(cr.relSeed.through)) ? cr.relSeed.through : null;
          if(prevRows && prevRows.length>st.field){
            const seeded=prevRows.map(r=>r==='you' ? you : ccStageTeamFrom(r));
            const hs=seedHeats(seeded, Math.max(2, Math.round(seeded.length/st.field)));
            const rAt=ccRaceHeatTogether(hs, you);   // гонка: один хит на комнату
            const at=rAt>=0 ? rAt : hs.findIndex(h=>h.indexOf(you)>=0);
            pending=hs.filter((h,i)=>i!==(at<0 ? 0 : at))
                      .map(h=>h.filter(t=>t!==you).slice(0, st.field)
                               .map(ccStageSeatRow))
                      .filter(rows=>rows.length>=2);
          }
        }
        cr.relSeed={season:cr.season, size:careerSquadSize(), set:ev.set, reg:ccPoolRegion(),
                    next:NEXT[ev.stage],
                    through:ranked.filter(t=>q.has(t))
                                  .map(t=>ccSeedRow(t, you, ccStageSeatRow)),
                    out:out, pending:pending};
      }
    }
  } else {
    careerNews('flat', 'ccNewsRelOut', [ev.label, showPlace, showOf]);
  }
  // Кто взял места сегодня — помним и тогда, когда сам ты мимо: следующий
  // финал круга этих людей пропустит. См. ccRelSeatsKeep.
  ccRelSeatsKeep(cr, relSeats, you);
  // The final crowns somebody whether or not it was you.
  if(ev.stage==='final') careerCongrats(ranked, you, ev.label);

  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  careerGrowEvent(showPlace, showOf, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:showPlace,
               of:showOf, pts:you.stagePts, passed:through, ovr:CAREER.player.ovr,
               // Two evenings are one tournament, so the row says what was
               // actually played for the result it records.
               games:st.games*(carry?2:1), wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(cash, you),
               kind:'reload', stage:ev.stage});
  // Командный вечер закрывает сервер — и только после этого шаг «завтра» слышен. См. ccMpClose.
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  /* And it says what was won.

     The circuit pays — see CC_REL_PRIZES — and ccPayIn was banking it, but the
     results screen was called without money and there was no line in the feed
     either, so a career took a Heat cheque and a Final cheque and nothing on
     screen ever mentioned either. His report, 18 August: the finals do not write
     the prize money and do not give it. Half of that was true and the half that
     was true is the half a player can see. */
  careerReloadResultCard({label:ev.label, place:showPlace, of:showOf,
                          through:through, cut:showCut,
                          // Строка про место есть и тогда, когда места ты не
                          // взял: «оно у тебя уже есть» — это тоже новость.
                          seat: seat || !!seatText, seatText: seatText,
                          money: cash ? ccShareOf(cash, you) : null});
}
function careerReloadResultCard(r){
  const box=document.createElement('div');
  box.className='stage-card '+(r.through?'pass':'fail');
  box.innerHTML='<h4>'+esc(r.label)+' <span class="stage-badge '+(r.through?'pass':'fail')+
    '">'+ccTopC(r.place)+'</span></h4>'+
    '<div class="stage-detail">'+
      /* Строка вечера — его собственная, если она у вечера есть.

         Тестер, 22 сентября (скрин, подчёркнуто красным): последний раунд
         квалификатора 2024-го читался «Топ-0 — проход дальше». Отсечки у него
         и правда нет — раунд играется за ОЧКИ СЕРИИ, и это же написано на
         карточке этапа выше, — а нижняя карточка знала одну фразу на все
         случаи и подставляла в неё ноль. Так же молчали дни верхней сетки, где
         билет даёт победа в матче, а не место. */
      '<div>'+(r.money!=null
        ? (r.money ? L().ccWfCash(ccNum(r.money)) : L().ccWfNoCash)
        : r.note ? esc(r.note)
        : (r.through?L().ccRelPass(r.cut):L().ccRelFail(r.cut)))+'</div>'+
      // Which seat, not just that there is one: this card was written for the
      // Reload circuit and said "a seat at the Esports World Cup" whoever asked.
      (r.seat?'<div>'+esc(r.seatText||L().ccRelSeat)+'</div>':'')+
      (r.money?'<div>'+L().chEarnings+': $'+ccNum((CAREER.career.earnings||0))+'</div>':'')+
      ccNightRateLine()+
    '</div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="careerBackToHub()">'+
      L().ccBackToHub+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}

/* Zero Build-кап (ev.zb): без строек, ресурсов и высокой земли — тот же CC_ZB, что у Pro-Am
   в Сан-Паулу; снимается, как бы вечер ни кончился. */
async function runCareerVictory(){
  const ev=careerVictoryOn(careerToday());
  CC_ZB=!!(ev && ev.zb);
  /* RESHUFFLE ВДВОЁМ — ЛИЧНЫЙ ВЕЧЕР (командный год 20.10). Пары в нём тянутся из поля по одной
     карте команды (squad[0]), а своя команда в дуо — это двое: у каждого клиента первым стоял он сам,
     и каждый играл турнир без напарника — два разных турнира с одним сидом. Приглашены оба, каждый
     играет свой, итог уезжает напарнику копилкой (CC_MP_ALONE → ccEvDeltaSend). */
  const resh=!!(ev && ev.reshuffle && ccMpTeam() && !CC_MP_ALONE);
  if(resh) CC_MP_ALONE=true;
  const own=resh ? ccTeamOwnRowsOn() : false;   // таблица мира — у хозяина лобби, см. ccTeamOwnRowsOn
  /* И В ГОНКЕ — личный вечер (онлайн-прогон 2026 года, 21.10: Red Bull Reshuffle 15.08 — синхронизация комнаты сажала
     соперника его строкой, с его ботом-напарником, а не парой жребия: у одного «live1+wox», у другого «live1+sky», и
     команда без пары жребия роняла вечер — «Cannot read properties of undefined (reading 'forEach')», перемотка вставала).
     Каждый играет свой, всю таблицу пишет старший по адресу (копилка), остальные — только свою строку.
     И ESL 4 на 4 2024 (DreamHack Dallas, EWC; онлайн-прогон 2024 года, 21.10): четвёрка (ewc24MyTeam) и путёвки у каждого
     свои, ewc24Team вырезает её людей из настоящих команд — Karmine Corp у одного вчетвером, у другого втроём, и под общим
     ключом ЛАНа доски расходились на десятки строк. */
  let raceOwn=false;
  if(ev && (ev.reshuffle || ev.ewc24) && typeof ccRaceOn==='function' && ccRaceOn() && typeof ccRaceLock==='function' && ccRaceLock()){
    ccRaceNightApart();
    const ids=(typeof CC_RACE_PEERS!=='undefined') ? Object.keys(CC_RACE_PEERS).filter(k=>CC_RACE_PEERS[k]) : [];
    const elder=[ccMpId()].concat(ids).sort()[0]===ccMpId();
    if(!elder && !CC_BOARD_ONLY_YOU){ CC_BOARD_ONLY_YOU=true; raceOwn=true; }
  }
  const fmtSwap=ccEventRosterBegin(ccVictoryFormat(ev), ev && ev.own ? ev.roster : null);
  try{ return await runCareerVictoryNight(); }
  finally{ CC_ZB=false; ccEventRosterEnd(fmtSwap); if(resh) CC_MP_ALONE=false; ccTeamOwnRowsOff(own); if(raceOwn) CC_BOARD_ONLY_YOU=false; }
}
/* КАП ИГРАЕТСЯ В СВОЁМ ФОРМАТЕ.

   Скрин: июль 2019-го (этап дуо), в календаре Trios Cash Cup — а вечер шёл парой, с
   плашкой «DUOS». Кап прошлых лет знает свой формат (mode), и играется им: трио-кап —
   трио-составом (CAREER.rosters[3]), дуо-кап — дуо-составом. Где в составе этого формата
   не хватает людей, на вечер берутся стэнд-ины — ближайшие по рейтингу свободные игроки
   сцены своего региона, как в жизни берут филла на кап. После вечера всё как было.
   2026-й живёт по своему правилу (Victory Cup — составом сезона), его не трогаем. */
function ccVictoryFormat(ev){
  // Свой турнир — всегда в выбранном режиме, в любой год.
  if(ev && ev.own) return ({solo:1, duo:2, trio:3, squad:4})[ev.mode]||0;
  if(!ev) return 0;
  // 2026: капы играются составом сезона, кроме тех, где формат задан самим турниром (Squads Victory Cup S43).
  if(ccCalYear()>=2026 && !ev.fmt) return 0;
  return ({solo:1, duo:2, trio:3, squad:4})[ev.mode]||0;
}
/* Формат капа, не снятый брошенным вечером (errlog 15.11, пара в команде 2022): раннер трио-капа завис на ожидании,
   finally с ccEventRosterEnd не наступил, и до перезагрузки вкладки все капы у одного шли тройкой с филлом, у другого парой.
   Живой формат помнится здесь; новый вечер (careerPlayRun0) и abandonRun снимают его сами, поздний finally уже ничего не трогает. */
let CC_FMT_SWAP_LIVE=null;
function ccFmtSwapLeak(){
  const sw=CC_FMT_SWAP_LIVE; if(!sw) return;
  try{ console.warn('event format left by an abandoned night, size', CC_EVENT_SIZE, '->', sw.was); }catch(e){}
  ccEventRosterEnd(sw);
}
function ccEventRosterBegin(fmt, picks){
  const sw=ccEventRosterBegin0(fmt, picks);
  if(sw) CC_FMT_SWAP_LIVE=sw;
  return sw;
}
function ccEventRosterBegin0(fmt, picks){
  CC_MP_FMT_WHY='';
  if(!fmt || fmt===1 || !CAREER) return null;
  if(CC_EVENT_SIZE){ CC_MP_FMT_WHY='held'+CC_EVENT_SIZE; return null; }
  if(typeof ccMpOn==='function' && ccMpOn()) return ccMpFmtBegin(fmt);
  if(typeof ccRacePairOn==='function' && ccRacePairOn()) return null;
  const base=careerSquadSize();
  const picked=(picks||[]).filter(Boolean);
  if(fmt===base && !picked.length) return null;
  const prev=(CAREER.partners||[]).slice();
  const taken=new Set([hKey(CAREER.player.handle||CAREER.player.nick||'')]);
  // Свой турнир: тиммейты, которых выбрал игрок, — со сцены своего региона, на этот вечер.
  let own;
  if(picked.length){
    const scene=ccSceneRoster(ccCareerRegion());
    own=picked.map(h=>scene.find(x=>x && hKey(x)===hKey(h))).filter(Boolean).slice(0, fmt-1)
      .map(c=>({card:{...c}, patience:60, since:careerToday(), dev:0, standin:true, picked:true}));
  } else own=ccFmtRoster(fmt);
  own.forEach(r=>{ const c=ccMateCardOf(r); if(c) taken.add(hKey(c)); });
  // Люди гонки и их напарники стэнд-инами не выходят: в общей комнате они стоят своими командами.
  if(typeof ccRaceOn==='function' && ccRaceOn()) ccRaceTakenKeys().forEach(k=>taken.add(k));
  const need=fmt-1-own.length, stand=[];
  if(need>0){
    const me=(CAREER.player && CAREER.player.ovr)||80;
    /* В гонке стэнд-инов берут все разом, и строки соседей ещё не пришли: двое взяли бы одного.
       Пул делится между людьми комнаты по хешу ника — у каждого своя доля, пересечься нечему. */
    let part=null;
    if(typeof ccRaceOn==='function' && ccRaceOn()){ try{
      const ids=[ccMpId()].concat(ccRaceRoom().map(p=>p.id)).filter(Boolean).sort();
      if(ids.length>1) part={n:ids.length, i:ids.indexOf(ccMpId())};
    }catch(e){ part=null; } }
    const pool=ccSceneRoster(ccCareerRegion()).filter(c=>!taken.has(hKey(c)) && (!part || ccHashStr(hKey(c))%part.n===part.i))
      .sort((a,b)=>Math.abs(ccCardOvr(a)-me)-Math.abs(ccCardOvr(b)-me));
    for(let i=0;i<need && i<pool.length;i++) stand.push({card:{...pool[i]}, patience:60, since:careerToday(), dev:0, standin:true});
  }
  CAREER.partners=own.concat(stand);
  const was=CC_EVENT_SIZE; CC_EVENT_SIZE=fmt;
  if(stand.length) careerNews('flat', 'lfNewsStandin', [stand.map(r=>r.card.handle).join(', ')]);
  return {prev, was};
}
/* КАП ДРУГОГО ФОРМАТА В КОМАНДЕ (Notion 21.10, двое играли командой: «когда начался трио турнир, нельзя добавить
   трио игрока при игре в онлайне», и Trios Cash Cup прошёл парами у всего лобби). Раньше команда играла такой кап
   в формате года. Теперь — в своём: двое живых плюс филлы на вечер, как в одиночной (стэнд-ины), но выбранные так,
   чтобы у обоих вышли одни и те же люди: тот же пул сцены, заняты оба живых и общие взятые, близость к среднему
   рейтингу двоих (огрублённому до двух, чтобы десятые не развели), равные — по нику. Общий состав не трогается. */
/* Выключено, пока поле не сходится у двоих: онлайн-прогон 2019 (22.10) — Trios Cash Cup 14.07 всё ещё 25 строк из 1593
   (свободные сводятся в пары по-разному). Разошедшийся вечер хуже, чем кап парами, как было. */
const CC_MP_FMT_ON=true;
let CC_MP_FMT_WHY='';   // почему добор другого формата не включился: едет в отпечатке поля
function ccMpFmtBegin(fmt){
  CC_MP_FMT_WHY='';
  if(!CC_MP_FMT_ON) return null;
  if(typeof ccRaceOn==='function' && ccRaceOn()) return null;
  /* Только кап КРУПНЕЕ состава года (трио/сквад в дуо-год) — о нём просили. Дуо-кап в трио-год онлайн по-прежнему
     играется составом года: своим форматом он разводил сгенерированные дуо лестницы (онлайн-прогон 2022, 22.10). */
  if(fmt<=careerSquadSize()) return null;
  if(typeof MP==='undefined' || !MP.peer){ CC_MP_FMT_WHY='nopeer'; return null; }
  const cr=CAREER.career, need=fmt-CC_MP_HUMANS;
  if(need<0) return null;
  const shared=(Array.isArray(cr.mates) ? cr.mates : []).filter(Boolean).slice(0, need);
  const me=careerCard(), taken=new Set([hKey(me||CAREER.player.handle||CAREER.player.nick||''), hKey(MP.peer)]);
  shared.forEach(r=>{ const c=ccMateCardOf(r); if(c) taken.add(hKey(c)); });
  const ovr=c=>{ try{ return (attrsFor(c)||{}).ovr || c.rating || 80; }catch(e){ return 80; } };
  /* Средний рейтинг двоих — из сцены (она у обоих одна), а не из карточек: добор идёт до ворот вечера, своя
     карточка у каждого свежая, а напарника — с прошлой отправки. 99 и 98 против 99 и 99 давали цель 98 и 100,
     и третьим у одного выходил JOE (98), у другого Kami (99): онлайн-прогон 2022, 22.10, Trios Quick Cash Cup 26.08. */
  const scene=ccSceneRoster(ccCareerRegion());
  const sceneOvr=h=>{ const k=hKey(h), c=scene.find(x=>x && hKey(x)===k); return c ? ccCardOvr(c) : 80; };
  const target=Math.round((sceneOvr(me||CAREER.player.handle||CAREER.player.nick||'')+sceneOvr(MP.peer))/4)*2;
  const stand=[];
  /* ВЫБРАННЫЕ ОБОИМИ — ПЕРВЫМИ (его «а выбрать игрока я могу?», 22.10): cr.fmtPick[fmt] — ники, на которых оба сказали
     «да» (ccMpFmtPickAsk → 'fmtpick'/'fmtpick-ok'), ключ команды. Карточка — из сцены (у обоих одна), филл — на остаток. */
  ((cr.fmtPick||{})[fmt]||[]).forEach(h=>{ if(stand.length>=need-shared.length) return; const k=hKey(h); if(!h || taken.has(k)) return;
    const c=scene.find(x=>x && hKey(x)===k); if(!c) return; taken.add(k);
    stand.push({card:{...c}, patience:60, since:careerToday(), dev:0, standin:true, picked:true}); });
  let fpPool='';
  if(need>shared.length+stand.length){
    const pool=scene.filter(c=>c && c.handle && !taken.has(hKey(c)))
      .sort((a,b)=>Math.abs(ccCardOvr(a)-target)-Math.abs(ccCardOvr(b)-target) || (hKey(a)<hKey(b) ? -1 : hKey(a)>hKey(b) ? 1 : 0));
    for(let i=0;stand.length<need-shared.length && i<pool.length;i++) stand.push({card:{...pool[i]}, patience:60, since:careerToday(), dev:0, standin:true});
    try{ fpPool=' tg'+target+' me'+(me ? ovr(me) : '-')+' pe'+ovr(MP.peer)+' top '+pool.slice(0, 5).map(c=>c.handle+':'+ccCardOvr(c)+':'+careerDevOf(c)).join(',')+' dev '+ccHashStr(JSON.stringify(CAREER.dev||{}))+' tag '+CC_NOW_TAG; }catch(e){}
  }
  CC_MP_FMT_MATES=shared.concat(stand); CC_MP_FMT_PICKS=0;
  // Отпечаток памяти троек и пула на входе — в журнал вечера: расхождение видно у обоих рядом.
  try{ CC_MP_FMT_FP='f'+fmt+' trios '+ccHashStr(JSON.stringify(cr.trios||{}))+'/'+Object.keys(cr.trios||{}).length+' seeded '+String(cr.triosSeeded||'-').slice(0,16)+' pools '+(CC_POOLS ? CC_POOLS.tag : '-')+' fill '+stand.map(r=>r.card.handle).join('+')+fpPool; }catch(e){}
  const was=CC_EVENT_SIZE; CC_EVENT_SIZE=fmt;
  /* Пул под размер вечера собирается ЗДЕСЬ, у обоих в одной точке (онлайн-прогон 2019 года, 22.10). Собранный лениво
     посреди вечера, он засевал третьих у двоих в разное время: Trios Cash Cup 14.07 расходился на 19…1327 строк поля
     из 1593. С этой сборкой — 0. */
  /* И рейтинги всех карт пула считаются здесь же (ccCardOvr кэширует карту сцены лениво): прогон с этим прогревом
     зелёный, без него — 12 строк поля из 1593 (третьи mitr0+oslo — robabz у одного, kinstaar у другого). */
  try{
    const p=careerPools();
    const sig=(p.duos||[]).map(d=>(d.cards||[]).map(c=>hKey(c)+':'+ccCardOvr(c)).join('+')+(d.third ? '/'+d.third : '')).join(',');
    const pl=(p.players||[]).map(c=>hKey(c)+':'+ccCardOvr(c)).join(',');
    CC_MP_FMT_FP+=' · pool '+(p.duos||[]).length+'/'+ccHashStr(sig)+' pl '+(p.players||[]).length+'/'+ccHashStr(pl)+' trios '+Object.keys(cr.trios||{}).length+'/'+ccHashStr(JSON.stringify(cr.trios||{}));
  }catch(e){ CC_MP_FMT_FP+=' · pool ERR '+String(e).slice(0,60); }
  if(stand.length) careerNews('flat', 'lfNewsStandin', [stand.map(r=>r.card.handle).join(', ')]);
  return {mp:true, was};
}
function ccEventRosterEnd(sw){
  if(!sw || sw.done) return;
  sw.done=true;
  if(CC_FMT_SWAP_LIVE===sw) CC_FMT_SWAP_LIVE=null;
  if(sw.mp){ CC_MP_FMT_MATES=null; CC_MP_FMT_FP=''; CC_EVENT_SIZE=sw.was; careerSave(); return; }
  CC_EVENT_SIZE=sw.was;
  CAREER.partners=sw.prev;
  careerSave();
}
/* СОСТАВ НА БЛИЖАЙШИЙ КАП ДРУГОГО ФОРМАТА — ЗАРАНЕЕ (его слово 29.09: «когда ближайшие турниры в других
   режимах, пусть окошечко высвечивается, где будет состав, чтоб игрок не забыл»). Семь дней вперёд:
   кап, на который зовут, в формате не своего года, и в составе этого формата не хватает людей —
   плашка в Центре с составом и кнопкой «Собрать состав» (то же окно, что перед вечером). */
// EWC 2024, Dallas и отборы — 4 на 4: состав сквада, в каком бы формате ни был год.
function ccPickFormat(ev){ return ev && ev.ewc24 ? 4 : ccVictoryFormat(ev); }
function ccRosterSoon(){
  if(!CAREER || !CAREER.career || CC_EVENT_SIZE) return null;
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRacePairOn==='function' && ccRacePairOn())) return null;
  const base=careerSquadSize(), today=careerToday();
  for(let k=0; k<=7; k++){
    const day=ccAddDays(today, k);
    const ev=careerVictoryOn(day);
    if(!ev || ((ev.invite || ev.ewc24) && !ccVictoryInvited(ev))) continue;
    const fmt=ccPickFormat(ev);
    if(!fmt || fmt===1 || fmt===base) continue;
    const own=ccFmtRoster(fmt);
    if(own.length>=fmt-1) continue;
    return {ev, day, k, fmt, own};
  }
  return null;
}
function ccRosterSoonHTML(){
  const r=ccRosterSoon(); if(!r) return '';
  const T=L();
  const names=[CAREER.player.nick||CAREER.player.handle||T.ewc24You2].concat(r.own.map(x=>(ccMateCardOf(x)||{}).handle).filter(Boolean));
  return '<div class="ch-tile cc-soon"><div class="cc-soon-h">'+esc(T.rsSoonH(r.k, ccDayLabel(r.day)))+'</div>'+
    '<b>'+esc(r.ev.name)+' · '+esc(T.rsFmt(r.fmt))+'</b>'+
    '<div class="cc-soon-line">'+esc(T.rsHave(names.join(', '), names.length, r.fmt))+'</div>'+
    '<button class="btn-primary cc-soon-go" onclick="ccRosterSoonOpen()">'+esc(T.rsGo(r.fmt-names.length))+'</button></div>';
}
function ccRosterSoonOpen(){
  const r=ccRosterSoon(); if(!r) return;
  ccDuoFindOpen(null, r.fmt);
}
/* СОСТАВ НА КАП ДРУГОГО ФОРМАТА — ЧЕРЕЗ ЛИЧКУ (его слова 29.09: «рандомными игроками», «сразу выбирается,
   нет переговоров в лс», «чтоб турнир случайно не сыграл, потому что тиммейта нет»). Перед вечером с
   неполным составом — окно: «Написать игрокам» (вечер не начинается, открывается поиск с личкой для
   этого формата, см. ccDuoFindOpen(fmt)) или «Стэнд-ины на вечер» (добор ccEventRosterBegin, в состав
   не пишется). Ниже — прежнее описание.

   СОСТАВ НА КАП ДРУГОГО ФОРМАТА — ВЫБИРАЕТ ИГРОК.

   Его слово 29.09: «squad victory cash cup играется рандомными игроками, я их не выбирал».
   Добор шёл молча (ccEventRosterBegin: ближайшие по рейтингу со сцены). Теперь, если в составе
   этого формата не хватает людей, перед вечером — окно: свои уже стоят, из двенадцати свободных
   ближайших по рейтингу игрок отмечает недостающих. Выбранные записываются в CAREER.rosters[fmt] —
   следующий кап того же формата играется ими без вопроса. «Подобрать за меня» и тишина 30 с —
   прежний добор. Командная карьера, гонка и перемотка не спрашивают. */
// Тишина не собирает состав за игрока (его слово 29.09: «чтоб турнир случайно не сыграл, потому что тиммейта нет»);
// десять минут — только чтобы вечер без человека (пробы, забытая вкладка) не висел вечно.
const CC_EV_PICK_MS=600000;
/* Состав другого формата — свой: напарников года в нём нет и по умолчанию они туда не копируются
   (дуо на EWC и трио на FNCS — разные люди, один человек в двух составах не стоит). */
/* Трио-кап в дуо-год — «дуо +1»: напарники года встают в состав большего формата сами, добирать остаётся
   недостающих. Записанный состав формата идёт первым; полный — напарников не добавляет. В меньший формат
   (дуо-кап в трио-год) напарник года сам не встаёт, но выбрать его можно (ccEventRosterPick). */
function ccFmtRoster(f){
  if(!CAREER) return [];
  const year=(CAREER.partners||[]).filter(Boolean);
  if(!f || f===careerSquadSize()) return year;
  const seen=new Set(), out=[];
  const add=r=>{ const c=r && ccMateCardOf(r), k=c ? hKey(c.handle) : '';
    if(k && !seen.has(k) && out.length<f-1){ seen.add(k); out.push(r); } };
  (((CAREER.rosters||{})[f])||[]).forEach(add);
  if(f>careerSquadSize()) year.forEach(add);
  return out;
}
function ccEventRosterPick(ev, fmt){
  if(!fmt || fmt===1 || !CAREER || CC_EVENT_SIZE) return Promise.resolve('go');
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRacePairOn==='function' && ccRacePairOn())) return Promise.resolve('go');
  if((typeof CC_FF!=='undefined' && CC_FF) || CC_SKIP_ALL) return Promise.resolve('go');
  const base=careerSquadSize();
  if(fmt===base) return Promise.resolve('go');
  const own=ccFmtRoster(fmt);
  const need=fmt-1-own.length;
  /* Полный состав формата — всё равно спросить, раз на это событие (его слово 29.09: «Winter Royale
     после сквад-FNCS, и мне не дали выбрать, с кем идти»). Дуо-состав оставался с лета (ccRosterSwap
     откладывает его при смене размера года), и вечер молча садил туда того, с кем играл в июле.
     Спрашиваем один раз на событие (cr.evPicked по id), дальше — выбранный состав. */
  const cr=CAREER.career, evKey=String((ev && (ev.id || ev.name)) || '')+'|'+(cr.season||0);
  if(need<=0 && (cr.evPicked||{})[evKey]) return Promise.resolve('go');
  const T=L();
  const hOf=r=>(ccMateCardOf(r)||{}).handle||'';
  const names=[CAREER.player.nick||CAREER.player.handle||''].concat(own.map(hOf).filter(Boolean));
  // Кого можно взять кнопкой: уже стоящие в составе формата и свободные со сцены региона, ближайшие по рейтингу.
  // Напарники года — тоже в списке, сразу за составом формата («трио — это дуо +1»).
  const pool=[];
  own.concat((CAREER.partners||[]).filter(Boolean)).forEach(r=>{ const h=hOf(r); if(h && !pool.some(p=>hKey(p.h)===hKey(h))) pool.push({r, h, ovr:(ccMateCardOf(r)||{}).rating||0}); });
  { const busy=new Set([hKey(CAREER.player.handle||CAREER.player.nick||'')].concat((CAREER.partners||[]).map(hOf).filter(Boolean).map(hKey)));
    const me=CAREER.player.ovr||80;
    ccSceneRoster(ccCareerRegion()).filter(c=>c && c.handle && !busy.has(hKey(c)) && !pool.some(p=>hKey(p.h)===hKey(c.handle)))
      .sort((a,b)=>Math.abs(ccCardOvr(a)-me)-Math.abs(ccCardOvr(b)-me)).slice(0, 12)
      .forEach(c=>pool.push({r:{card:{...c}, patience:CAREER_PATIENCE_START, since:careerToday()}, h:c.handle, ovr:ccCardOvr(c)})); }
  const inOwn=h=>own.some(r=>hKey(hOf(r))===hKey(h));
  return new Promise(done=>{
    const box=document.createElement('div');
    box.className='cc-evpick-wrap';
    const picks=pool.length ? '<div class="cc-evpick-list">'+pool.map((p, i)=>
      '<button class="cc-evpick-p'+(inOwn(p.h) ? ' on' : '')+'" data-i="'+i+'"><b>'+esc(p.h)+'</b>'+(inOwn(p.h) ? '<span>'+esc(T.evPickHave)+'</span>' : '')+'<i>'+esc(String(p.ovr))+'</i></button>').join('')+'</div>' : '';
    box.innerHTML='<div class="cc-evpick"><h4>'+esc(need>0 ? T.evPickH(ev && ev.name || '', need) : T.evPickWho(ev && ev.name || ''))+'</h4>'+
      '<div class="cc-soon-line">'+esc(T.rsHave(names.join(', '), names.length, fmt))+'</div>'+
      '<p>'+esc(need>0 ? T.evPickSub : T.evPickSub2(fmt-1))+'</p>'+ picks +
      '<div class="cc-evpick-act">'+(need>0
        ? '<button class="cc-evpick-auto cc-choice-btn" data-k="go">'+esc(T.evPickAuto)+'</button>'
        : '<button class="cc-evpick-go cc-evpick-play cc-choice-btn" data-k="go">'+esc(T.evPickPlay(own.map(hOf).join(', ')))+'</button>')+
      '<button class="'+(need>0 ? 'cc-evpick-go' : 'cc-evpick-alt')+'" data-k="find">'+esc(T.evPickFind)+'</button></div></div>';
    let over=false;
    const end=k=>{ if(over) return; over=true; box.remove();
      if(k==='go'){ cr.evPicked=cr.evPicked||{}; cr.evPicked[evKey]=1; careerSave(); }
      done(k); };
    box.querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>end(b.dataset.k));
    // Нажал на человека — он встаёт в состав формата первым, лишние сверху выпадают.
    box.querySelectorAll('.cc-evpick-p').forEach(b=>b.onclick=()=>{
      const p=pool[+b.dataset.i]; if(!p) return;
      if(!CAREER.rosters) CAREER.rosters={};
      const rest=own.filter(r=>hKey(hOf(r))!==hKey(p.h));
      CAREER.rosters[fmt]=[p.r].concat(rest).slice(0, fmt-1);
      careerSave();
      if(fmt-1-CAREER.rosters[fmt].length<=0) end('go');
      else { over=true; box.remove(); ccEventRosterPick(ev, fmt).then(done); }
    });
    document.body.appendChild(box);
    setTimeout(()=>end('go'), CC_EV_PICK_MS);
  });
}
const EWC24={"groups":{"A":["Team Falcons","XSET","ZETA DIVISION","DRAGONS eSports"],"B":["Exceed","Gaimin Gladiators","Al Ula","PWR"],"C":["Karmine Corp","FNATIC","R8 Esports","KS7"],"D":["HEROIC","BIG","Dignitas","w7m esports"]},"teams":[{"n":"XSET","r":"NAC","g":"A","p":["Muz","Edgey","Ritual","Cold"],"via":["qual","NAC",0]},{"n":"Team Falcons","r":"EU","g":"A","p":["TaySon","Chico","Japko","t3eny"],"via":["dallas",1]},{"n":"ZETA DIVISION","r":"ASIA (JP)","g":"A","p":["Minipiyo","Zagou","Koyota","Yuma"],"via":["qual","ASIA",0]},{"n":"DRAGONS eSports","r":"BR/LATAM","g":"A","p":["Randu","Itrol","Lewa","Romero"],"via":["qual","BR",0]},{"n":"Exceed","r":"NAC","g":"B","p":["Peterbot","Kwanti","Meelks","Okis"],"via":["dallas",2]},{"n":"Gaimin Gladiators","r":"EU","g":"B","p":["Howly","NeFrizi","S1neD","Vanyak3kk"],"via":["qual","EU",0]},{"n":"Al Ula","r":"ME","g":"B","p":["Adapter","FHD","Hero","Mansour"],"via":["qual","ME",0]},{"n":"PWR","r":"OCE","g":"B","p":["alex","looter","worthy","volx"],"via":["qual","OCE",0]},{"n":"Karmine Corp","r":"EU","g":"C","p":["Malibuca","Merstach","SwizzY","Anas"],"via":["dallas",3]},{"n":"FNATIC","r":"NAC","g":"C","p":["Ajerss","CizLucky","nounzy","Xccept"],"via":["dallas",5]},{"n":"R8 Esports","r":"EU","g":"C","p":["Voxe","Bloomy","xsweeze","Vortexers"],"via":["qual","EU",1]},{"n":"KS7","r":"ME","g":"C","p":["Kalgamer","k0ty","Kyry","Salvatore"],"via":["qual","ME",1]},{"n":"HEROIC","r":"EU","g":"D","p":["Th0masHD","Fredoxie","Hellfire","Kiro"],"via":["dallas",4]},{"n":"BIG","r":"EU","g":"D","p":["kiduoo","Trexer","Fray","cheetiin"],"via":["dallas",6]},{"n":"Dignitas","r":"NAC","g":"D","p":["Acorn","Pilky","Tkay","Khanada"],"via":["qual","NAC",1]},{"n":"w7m esports","r":"BR/LATAM","g":"D","p":["Frosty","Phzin","Seeyun","Kurtz"],"via":["qual","BR",1]}],"maps":{"Capture the Flag":["Chalet","Panther"],"Hardpoint":["Panther","Chalet"],"Keeper":["Taverna Zoni"]},"pay":[[1,400000],[2,160000],[4,80000],[8,40000],[12,20000],[16,10000]],"mvp":50000,"dallas":{"teams":[{"n":"Team Falcons","p":["TaySon","Chico","Japko","t3eny"],"s":1},{"n":"Agent Gaming","p":["Peterbot","Kwanti","Meelks","Okis"],"s":2},{"n":"Karmine Corp","p":["Malibuca","Merstach","veno","Anas"],"s":3},{"n":"HEROIC","p":["Th0masHD","Fredoxie","Hellfire","Kiro"],"s":4},{"n":"FNATIC","p":["Ajerss","CizLucky","nounzy","Xccept"],"s":5},{"n":"BIG","p":["kiduoo","Trexer","Fray","Cheatiin"],"s":6},{"n":"Manchester City Esports","p":["trippernn","Cold","Setty","Threats"],"s":7},{"n":"XSET","p":["Edgey","Muz","Ritual","Trashy"],"s":8},{"n":"Twisted Minds","p":["Dela","Pinq","Queasy","zAndy"],"s":9},{"n":"Ninjas In Pyjamas","p":["Refsgaard","Axeforce","Pixie","QB"],"s":10},{"n":"Stride Esports","p":["DeRoller","Crackly","miyu","npen"],"s":11},{"n":"Dignitas","p":["Khanada","Acorn","Reet","Tkay"],"s":12},{"n":"Gaimin Gladiators","p":["Bloomy","Moneymaker","Robban","Fnajen"],"s":13},{"n":"Degen","p":["Degen","Dukez","Pilky","Tavern"],"s":14},{"n":"Capybaras","p":["Lame","Cooper","Glubschi","Kylie"],"s":16},{"n":"unknown","p":["Floki","Leo the crack","Voxe","Werex"],"s":30},{"n":"Xen","p":["FoxMan","Bhronos","OliverOG","Trey"],"s":30},{"n":"Bush Bandits","p":["RottenTwinkies","Clasher","Jack","Sommerset"],"s":30},{"n":"T1","p":["Michael.","SAKI","SinOoh","Zerokun"],"s":30},{"n":"Guild Esports","p":["PabloWingu","Mappi","MariusCOW","Sangild"],"s":30},{"n":"Fractious Esports","p":["Blazer","Khaorz","Rabbit","Gordete"],"s":30},{"n":"Team Heretics","p":["Nakoo","Krizzii","Nebs","Vortexers"],"s":30},{"n":"PWR","p":["worthy","Looter","alex","volx"],"s":30},{"n":"Team Elite","p":["Pfluger","Moo","Tacts","Vexy"],"s":30},{"n":"LateArrival","p":["AdcSosa","Kronic11","Prizma","Wrxyth"],"s":30},{"n":"Underdogs","p":["Kadvn","Macyfishy","Pierson","Tez"],"s":30},{"n":"Mixed up one","p":["LocalT1nCan","Quantize","Sprays","Swinger"],"s":30},{"n":"FN enthusiast","p":["Kirbty","Bacon","nurface","Origin"],"s":30},{"n":"ZETA DIVISION","p":["Minipiyo","Zagou","Koyota","Yuma"],"s":30},{"n":"Outlaws","p":["Ceice","Blake","Laiys","pxmp"],"s":30},{"n":"Aura Maxers","p":["Drecept","Evagas","Jezejearim","slayt"],"s":30},{"n":"Team BECK","p":["Clement","BlastR","egrm","Kyzen"],"s":30},{"n":"SPRS","p":["Pandy","rafiki","Salt","SM1LY"],"s":30},{"n":"A-Tate","p":["Arid","Arrows","Kelz","Sweep"],"s":30},{"n":"Uprise Region","p":["Deeploy","JB3","Mills","sxzl"],"s":30},{"n":"Team Airbourn","p":["Co1azo","Repairs","Tristen","Tundra"],"s":30},{"n":"BBE","p":["Driven","Logan6x","Ponder","Skayter"],"s":30}],"alias":{"Agent Gaming":"Exceed"},"pay":[[1,100000],[2,44000],[3,28000],[4,18000],[6,10000],[8,6000],[16,3500]],"tickets":6},"quals":{"EU":{"teams":[{"n":"Gaimin Gladiators","p":["Howly","NeFrizi","S1neD","Vanyak3kk"]},{"n":"R8 Esports","p":["Voxe","Bloomy","xsweeze","Vortexers"]},{"n":"Twisted Minds","p":["Dela","Queasy","zAndy","Anas"]},{"n":"Ninjas In Pyjamas","p":["Refsgaard","Axeforce","Pixie","QB"]},{"n":"Team ammbrat","p":["ammbrat","Upl","Shura","Dandepuzo"]},{"n":"Guild Esports","p":["PabloWingu","Mappi","1lusha","Wheat"]},{"n":"Team DaanFN","p":["DaaN","Deckzee","Nakoo","Kantri"]},{"n":"Team Heretics","p":["IDrop","Krizzii","Nebs","Flickzy"]},{"n":"Team SlyFloki","p":["Floki","Andilex","BadSniper","Snayzy"]},{"n":"Team Art1st1kk","p":["Art1st","Karmy","paralizator","Toose"]},{"n":"Team G13ras","p":["G13ras","charyy","Kombek","Purchawa"]},{"n":"Team REZHEXX","p":["Rezhexx","boltye","Moneymaker","rudolph"]},{"n":"Team romix566","p":["romix56","rela1zz","keglya","warthy"]},{"n":"Team -gudn","p":["Gudn","Fnajen","Robban","Wox"]},{"n":"Team kxrv1nho","p":["kxrv","97default","Fury Legendary","Kiryache32"]},{"n":"Team Artembat9","p":["Artem","Eltensy","panzer","Rotory"]}],"slots":2},"NAC":{"teams":[{"n":"XSET","p":["Muz","Edgey","Ritual","Cold"]},{"n":"Dignitas","p":["Acorn","Pilky","Tkay","Khanada"]},{"n":"Stride Esports","p":["Crackly","DeRoller","miyu","Avivv"]},{"n":"Capybaras","p":["Cooper","Lame","Kylie","Reet"]},{"n":"Elite Esports","p":["Pfluger","Moo","Tacts","Vexy"]},{"n":"Team Cawsmiic","p":["Cawsmiic","ChaosGamingLive","Origin","Marrok"]},{"n":"Team munoz1x","p":["munoz","Laiys","Sycho","khor"]},{"n":"Team zenohasflag","p":["zeno","aaronxc","Frvsted","wydkaiii"]},{"n":"Team ShalloFN","p":["Shallo","djacoby","July","Omar"]},{"n":"Team flaco08","p":["Flaco","Clasher","Eulogy","Everfy"]},{"n":"Team Inkfv7","p":["Inkfv7","demaroonie","Elevattionn","Himothy"]},{"n":"Team Gh0st77","p":["Gh0st","Br1ghtinly","FL1X","iPanda"]},{"n":"Team metafn","p":["meta","Ducky","Hatch","shuexi"]},{"n":"PMG Esports","p":["HySky","bkzr","christian","Dragonisqt"]},{"n":"SATINgid","p":["Fifty","Chimp","Source","Twunti"]}],"slots":2},"BR":{"teams":[{"n":"DRAGONS eSports","p":["Randu","Itrol","Lewa","Romero"]},{"n":"w7m esports","p":["Frosty","Phzin","Seeyun","Kurtz"]},{"n":"LOS MOSQUITEROS","p":["Tecne","Fazer","K1nG","Thiagin"]},{"n":"LOUD","p":["Diguera","Gabzera","KING","Night"]},{"n":"Team Sanku40","p":["Sanku","Fishy","Talls","Trueno"]},{"n":"Team mojakfn","p":["Mojak","Kitoz","LORD","Puzera"]},{"n":"Faith","p":["Navars","Betto","Fffakkz","Riquelmee"]},{"n":"Team Liquid","p":["Pulga","Persa","EdRoadToGlory","Teuzz"]},{"n":"Vivo Keyd Stars","p":["GxT","Fuzettin","KaykyGames","wolfie"]},{"n":"Team Summit","p":["axadasz","Benado","Magni","Renato"]},{"n":"Team Emacasla","p":["Emacasla","enzo","TRCO-JUAN","Welzx"]},{"n":"Team yNotZeus-","p":["yNotZeus","Diazz","Porto","rtk"]},{"n":"Team mecvivv","p":["mecvivv","Nobreaks","Okabe","scottzito"]},{"n":"Team realmsxd","p":["realms","50PCB","ARTH0RF","mattzx7"]},{"n":"SmokeSolid Gaming","p":["Force","Hazzense","Gonzalobtw","Myst"]},{"n":"Team killuaprime","p":["killua","abestado","iagocts","Noisqueta"]}],"slots":2},"ME":{"teams":[{"n":"Al Ula","p":["Adapter","FHD","Hero","Mansour"]},{"n":"KS7","p":["Kalgamer","k0ty","Kyry","Salvatore"]},{"n":"siuuu","p":["Kaido","Calvo","Spyro","Sythic"]},{"n":"Team KaKaRoT 1","p":["KaKaRoT","Abodk","3BooD","LLJFT"]},{"n":"Team thatguyameen","p":["ameen","Spy","flucky","insanity"]},{"n":"Team g1ntlman","p":["GntL","Bd","5aald","Snowvaks"]},{"n":"Team Anasx1","p":["Anas","Kuro","noah","sohib"]}],"slots":2},"ASIA":{"teams":[{"n":"ZETA DIVISION","p":["Minipiyo","Zagou","Koyota","Yuma"]},{"n":"T1","p":["Michael.","SAKI","SinOoh","Vall"]},{"n":"AJS","p":["DayDus","Stain","Proboko","RqzriM3"]},{"n":"Team GTEdog","p":["Alice","Dog","Qjac","Raru"]},{"n":"ALBA E-sports","p":["3peace","MuuCONIQ","Tawashi","Mame"]},{"n":"Team macyfishyyy","p":["Macyfishy","Degen","Dukez","Job"]},{"n":"Team peterpan fn","p":["Peterpan","FaxFox","GODBAEKHO","Quickss"]},{"n":"ALBA Younth","p":["Hestin","Okan","ryudora","Salmon"]}],"slots":1},"OCE":{"teams":[{"n":"PWR","p":["alex","looter","worthy","volx"]},{"n":"Onyx Ravens","p":["anon","Aspect","Cazi","Fisher"]},{"n":"Team crypty1x","p":["Crypty","Deymo","Resignz","Vxmxn"]},{"n":"2x","p":["NJayyee","dummi","MooMoo","Tuckle Buckle"]},{"n":"Team GazerFn","p":["Gazer","Resignz","Skits","Protoon"]},{"n":"Team artorzx","p":["artor","Vepz","Xcon","Sznny"]},{"n":"Team Mazyok","p":["Mazyok","Arab","dyrusse","Kade"]},{"n":"Team STARUX7","p":["Starux","Speedyyyy","Splyse","SWEATYBOI7"]}],"slots":1}}};
/* Esports World Cup 2024 (ESL Featuring Fortnite, Эр-Рияд, 8–11.08.2024), источник Liquipedia. 4 на 4 на аренах UEFN:
   CTF, Hardpoint, Keeper (Keeper только в Эр-Рияде). 16 мест: топ-6 DreamHack Dallas 2024 и 10 из онлайн-отборов
   5–7 июля (EU, NA, LATAM, MENA по два, APJ и OCE по одному). Dallas: швейцарка Bo3, плей-ин нижних десяти, 8 групп GSL,
   двойное выбывание (GF Bo5). Отбор: GSL Bo5 и двойное выбывание. Эр-Рияд: 4 группы GSL Bo5, плей-офф 8 Bo7.
   Поле из путёвок этой карьеры, команда встаёт в группу той, чью путёвку взяла. Сила из карточек 2024, карта
   логистикой разницы сил. MVP турнира ($50 000) лучший игрок чемпиона. Призы: EWC $400k..$10k, Dallas $100k..$3.5k,
   отборы без денег. */
const EWC24_MODES={bo3:['Capture the Flag','Hardpoint','Capture the Flag'],
  q5:['Capture the Flag','Hardpoint','Capture the Flag','Hardpoint','Capture the Flag'],
  bo5:['Capture the Flag','Hardpoint','Keeper','Capture the Flag','Hardpoint'],
  bo7:['Capture the Flag','Hardpoint','Keeper','Capture the Flag','Hardpoint','Keeper','Capture the Flag']};
// Отбор своего региона: NAW играл североамериканский.
const EWC24_QREG={EU:'EU', NAC:'NAC', NAW:'NAC', BR:'BR', ME:'ME', ASIA:'ASIA', OCE:'OCE'};
function ewc24Card(h, reg){
  const k=String(h||'').toLowerCase();
  let best=null;
  PLAYERS.forEach(p=>{ if(!p || String(p.handle||'').toLowerCase()!==k) return;
    const in24=/^f\d$/.test(String(p.cardSet||''));
    const sc=(in24 ? 1000 : 0)+(p.rating||0);
    if(!best || sc>best.sc) best={p, sc}; });
  if(best) return best.p;
  return {handle:h, region:reg||'EU', rating:80, _ovr:80, nat:null, tier:'ewc', event:'EWC 2024'};
}
function ewc24Ovr(c){ return (c && (c._ovr!=null ? c._ovr : c.rating))||80; }
function ewc24Pow(squad){
  const r=squad.map(ewc24Ovr);
  return r.reduce((s,v)=>s+v, 0)/Math.max(1, r.length);
}
function ewc24PayOf(table, place){ for(const x of table) if(place<=x[0]) return x[1]; return 0; }
function ewc24Pay(place){ return ewc24PayOf(EWC24.pay, place); }
function ewc24MapScore(mode, rng){
  if(mode==='Hardpoint') return [250, 120+Math.floor(rng()*126)];
  if(mode==='Keeper') return [2, rng()<0.5 ? 0 : 1];
  const w=2+Math.floor(rng()*4); return [w, Math.floor(rng()*w)];
}
// Убийства/смерти четверых на карте: арена с мгновенным возрождением, 15–25 убийств на игрока.
const EWC24_KILLS={'Capture the Flag':18, 'Hardpoint':24, 'Keeper':15};
function ewc24MapStats(t, mode, won, rng){
  const avg=ewc24Pow(t.squad), base=EWC24_KILLS[mode]||18;
  t.stats=t.stats||{};
  const line=[];
  t.squad.forEach(c=>{
    const edge=Math.pow(ewc24Ovr(c)/avg, 3);
    const e=Math.max(2, Math.round(base*(0.7+0.6*rng())*edge*(won ? 1.12 : 0.9)));
    const d=Math.max(2, Math.round(base*(0.7+0.6*rng())/edge*(won ? 0.9 : 1.12)));
    const s=t.stats[c.handle]||(t.stats[c.handle]={e:0, d:0, maps:0});
    s.e+=e; s.d+=d; s.maps++;
    line.push({h:c.handle, e, d});
  });
  return line;
}
// Лучший по счёту убийств-смертей (своя команда); у чужих — по рейтингу с долей случая.
function ewc24Best(t, rng, stats){
  if(stats) return stats.slice().sort((a,b)=>(b.e-b.d)-(a.e-a.d))[0].h;
  const w=t.squad.map(c=>Math.pow(ewc24Ovr(c), 6)), sum=w.reduce((s,v)=>s+v, 0);
  let x=rng()*sum;
  for(let i=0;i<w.length;i++){ x-=w[i]; if(x<=0) return t.squad[i].handle; }
  return (t.squad[0]||{}).handle||'';
}
function ewc24Series(A, B, bo, rng, modes){
  modes=modes || EWC24_MODES[bo===7 ? 'bo7' : bo===3 ? 'bo3' : 'bo5'];
  const need=Math.ceil(bo/2), maps=[];
  let a=0, b=0;
  const you=A.isYou ? A : B.isYou ? B : null;
  const agg={};
  for(let i=0; a<need && b<need; i++){
    const mode=modes[i % modes.length];
    const pool=EWC24.maps[mode]||['Arena'];
    const map=pool[Math.floor(rng()*pool.length)];
    const pA=1/(1+Math.exp(-(A.pow-B.pow)/3.2));
    const aWins=rng()<pA;
    const sc=ewc24MapScore(mode, rng);
    const m={mode, map, s:aWins ? [sc[0], sc[1]] : [sc[1], sc[0]]};
    if(you){
      m.me=ewc24MapStats(you, mode, (you===A)===aWins, rng);
      m.me.forEach(x=>{ const g=agg[x.h]||(agg[x.h]={h:x.h, e:0, d:0}); g.e+=x.e; g.d+=x.d; });
    }
    if(aWins) a++; else b++;
    maps.push(m);
  }
  const win=a>b ? A : B, lose=a>b ? B : A;
  const mvp=ewc24Best(win, rng, win.isYou ? Object.values(agg) : null);
  return {A, B, win, lose, score:[a, b], maps, mvp};
}
/* ===== EWC 2024 вживую: карта, тактика, выбор по ходу =====
   Карты из Liquipedia (Esports World Cup 2024 Maps): Chalet и Panther (CTF, Hardpoint), Taverna Zoni (Keeper).
   art/ewc/map-*.jpg: медиана кадров миникарты трансляции EWC (Day 4, YouTube h5NF4K3OPRc). Точки Hardpoint 1 и 4
   по трансляции, остальные на крупных площадках.
   Правила: CTF до 5 флагов, 10 мин двумя таймами, ОТ 2:30; Hardpoint до 250, точка переезжает каждые 60 с (здесь 5
   точек по 100 за ротацию, как в счетах 250 : 75…246); Keeper до 150 очков или 5 мин, до двух раундов.
   Перед картой выбор из трёх тактик по кругу, стиль соперника от имени с долей случая; в Эр-Рияде при проигрыше к
   середине ещё выбор. Тактика ±0,35 в логите (~±8%). «Решай сам» выключает вопросы, «Пропустить» показ. */
// Координаты — в рамке миникарты 120×100.
const EWC24_LAYOUT={
  'Capture the Flag|Panther':{img:'art/ewc/map-ctf-panther.jpg', base:[[32, 43], [97, 75]]},
  'Capture the Flag|Chalet':{img:'art/ewc/map-ctf-chalet.jpg', base:[[10, 91], [108, 6]]},
  'Hardpoint|Panther':{img:'art/ewc/map-hp-panther.jpg', hills:[[61, 64], [67, 11], [91, 51], [35, 27], [41, 75]]},
  'Hardpoint|Chalet':{img:'art/ewc/map-hp-chalet.jpg', hills:[[61, 56], [74, 20], [102, 75], [26, 83], [29, 48]]},
  'Keeper|Taverna Zoni':{img:'art/ewc/map-keeper-taverna.jpg', keys:[[60, 52], [42, 40], [86, 32], [36, 78], [76, 74], [22, 60]]}
};
// Каждая тактика бьёт следующую: раш ловит сплит, сплит обходит защиту, защита встречает раш.
const EWC24_TACT={'Capture the Flag':['rush','split','def'], 'Hardpoint':['hold','hunt','rot'], 'Keeper':['press','hide','spread']};
const EWC24_ASK_MS=8000, EWC24_FRAME_MS=70;
let EWC24_AUTO=false, EWC24_LIVE_BIG=false;
function ewc24Edge(mine, theirs, mode){
  const l=EWC24_TACT[mode]||[], i=l.indexOf(mine), j=l.indexOf(theirs);
  if(i<0 || j<0 || i===j) return 0;
  return (i+1)%3===j ? 0.35 : -0.35;
}
function ewc24Style(t, mode, rng){
  const l=EWC24_TACT[mode];
  return rng()<0.3 ? l[Math.floor(rng()*3)] : l[Math.abs(ccHashStr(String(t.label)+'|'+mode))%3];
}
async function ewc24Play(A, B, bo, rng, modes, tag){
  if((A.isYou || B.isYou) && !skipAnimation) return ewc24SeriesLive(A, B, bo, rng, modes, tag);
  return ewc24Series(A, B, bo, rng, modes);
}
function ewc24Ask(head, sub, opts){
  if(skipAnimation || EWC24_AUTO) return Promise.resolve(null);
  return new Promise(done=>{
    const box=document.createElement('div');
    box.className='cc-round-ask ewc-ask';
    box.style.setProperty('--rc-ms', EWC24_ASK_MS+'ms');
    box.innerHTML='<div class="cc-choice-head"><b><span class="cc-choice-t">'+esc(head)+'</span></b><span>'+esc(sub)+'</span></div>'+
      '<div class="cc-choice-row">'+opts.map((o, i)=>'<button class="cc-choice-btn'+(i===0 ? ' def' : '')+'" data-k="'+o.k+'"><b>'+esc(o.name)+'</b><em>'+esc(o.desc)+'</em></button>').join('')+'</div>'+
      '<button class="ewc-ask-auto" data-k="auto">'+esc(L().ewc24Auto)+'</button>'+
      '<div class="cc-choice-bar"><i></i></div>';
    let over=false;
    const end=k=>{ if(over) return; over=true; box.remove(); if(k==='auto'){ EWC24_AUTO=true; k=null; } done(k||null); };
    box.querySelectorAll('button').forEach(b=>b.onclick=()=>end(b.dataset.k));
    document.body.appendChild(box);
    setTimeout(()=>end(null), EWC24_ASK_MS);
  });
}
async function ewc24SeriesLive(A, B, bo, rng, modes, tag){
  modes=modes || EWC24_MODES[bo===7 ? 'bo7' : bo===3 ? 'bo3' : 'bo5'];
  const need=Math.ceil(bo/2), maps=[], agg={};
  const you=A.isYou ? A : B;
  let a=0, b=0;
  const box=document.createElement('div');
  box.className='stage-card ewc-card ewc-live';
  document.getElementById('majorStages').appendChild(box);
  box.scrollIntoView({block:'center', behavior:'smooth'});
  for(let i=0; a<need && b<need; i++){
    const mode=modes[i % modes.length];
    const pool=EWC24.maps[mode]||['Arena'];
    const map=pool[Math.floor(rng()*pool.length)];
    const r=await ewc24LiveMap(box, {A, B, you, mode, map, rng, series:[a, b], bo, idx:i+1, tag});
    const m={mode, map, s:r.s};
    m.me=ewc24MapStats(you, mode, r.youWon, rng);
    m.me.forEach(x=>{ const g=agg[x.h]||(agg[x.h]={h:x.h, e:0, d:0}); g.e+=x.e; g.d+=x.d; });
    if(r.aWins) a++; else b++;
    maps.push(m);
    if(!skipAnimation) await sleep(700);
  }
  box.remove();
  const win=a>b ? A : B, lose=a>b ? B : A;
  const mvp=ewc24Best(win, rng, win.isYou ? Object.values(agg) : null);
  return {A, B, win, lose, score:[a, b], maps, mvp};
}
// Восемь фигурок: 0–3 свои, 4–7 соперник; старт — у своих баз (CTF) или по краям карты.
function ewc24Lay(st){ return EWC24_LAYOUT[st.mode+'|'+st.map]||{}; }
function ewc24Home(st, side){
  const lay=ewc24Lay(st);
  if(lay.base) return lay.base[side];
  return side===0 ? [18, 80] : [102, 20];
}
function ewc24Dots(st){
  return Array.from({length:8}, (_, i)=>{ const h=ewc24Home(st, i<4 ? 0 : 1); const x=h[0]+((i%4)-1.5)*4, y=h[1]+((i%2)-0.5)*5; return {x, y, tx:x, ty:y}; });
}
function ewc24Aim(st, rng){
  const pick=(cx, cy, r)=>[Math.max(4, Math.min(116, cx+(rng()-0.5)*r)), Math.max(4, Math.min(96, cy+(rng()-0.5)*r))];
  const lay=ewc24Lay(st);
  st.dots.forEach((d, i)=>{
    const side=i<4 ? 0 : 1;
    let c;
    if(st.mode==='Hardpoint'){ const h=(lay.hills||[[60, 50]])[st.obj||0]; c=pick(h[0], h[1], 26); }
    else if(st.mode==='Keeper'){ c=pick(st.key[0], st.key[1], 30); }
    else {
      // CTF: один-два идут на чужую базу, один держит свою, остальные — середина между базами.
      const role=i%4, home=ewc24Home(st, side), away=ewc24Home(st, 1-side);
      c=role===0 ? pick(away[0], away[1], 16) : role===3 ? pick(home[0], home[1], 14) : pick((home[0]+away[0])/2, (home[1]+away[1])/2, 44);
    }
    d.tx=c[0]; d.ty=c[1];
  });
}
function ewc24Move(st, rng){
  if(rng()<0.35) ewc24Aim(st, rng);
  st.dots.forEach(d=>{ d.x+=(d.tx-d.x)*0.3+(rng()-0.5)*1.6; d.y+=(d.ty-d.y)*0.3+(rng()-0.5)*1.6; });
}
function ewc24SceneHTML(o, st, mine, theirs, known){
  const T=L(), you=o.you, opp=o.A===you ? o.B : o.A;
  const ser=o.A===you ? o.series : [o.series[1], o.series[0]];
  const mm=Math.floor(st.clock/60), ss=String(Math.floor(st.clock%60)).padStart(2, '0');
  const lay=ewc24Lay(st);
  let svg='';
  if(st.mode==='Capture the Flag'){
    const b=lay.base||[[18, 80], [102, 20]];
    [0, 1].forEach(s=>{ const p=b[s], col=s===0 ? '#00d6a4' : '#ff6b5e';
      svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="7" fill="'+(s===0 ? 'rgba(0,214,164,.28)' : 'rgba(255,107,94,.28)')+'" stroke="'+col+'" stroke-width=".8"/>'+
        (st.flag!==(1-s) ? '<path d="M'+(p[0]-1.5)+' '+(p[1]-5)+'v8M'+(p[0]-1.5)+' '+(p[1]-5)+'l6 2.5-6 2.5" stroke="'+col+'" stroke-width="1.1" fill="'+col+'"/>' : ''); });
  } else if(st.mode==='Hardpoint'){
    (lay.hills||[]).forEach((h, i)=>{ const on=i===st.obj;
      svg+='<rect x="'+(h[0]-(on ? 6 : 3.5))+'" y="'+(h[1]-(on ? 6 : 3.5))+'" width="'+(on ? 12 : 7)+'" height="'+(on ? 12 : 7)+'" transform="rotate(45 '+h[0]+' '+h[1]+')" fill="'+(on ? (st.hold===0 ? 'rgba(0,214,164,.55)' : st.hold===1 ? 'rgba(255,107,94,.55)' : 'rgba(20,20,30,.7)') : 'rgba(20,20,30,.45)')+'" stroke="'+(on ? '#fff' : 'rgba(255,255,255,.45)')+'" stroke-width="'+(on ? .9 : .5)+'"/>'+
        '<text x="'+h[0]+'" y="'+(h[1]+(on ? 2 : 1.4))+'" font-size="'+(on ? 5.5 : 4)+'" font-weight="900" text-anchor="middle" fill="#fff">'+(i+1)+'</text>'; });
  } else {
    svg+='<path d="M'+st.key[0]+' '+(st.key[1]-4.5)+'l4 4.5-4 4.5-4-4.5z" fill="#ffe600" stroke="#fff" stroke-width=".5"/>';
  }
  st.dots.forEach((d, i)=>{ svg+='<circle cx="'+d.x.toFixed(1)+'" cy="'+d.y.toFixed(1)+'" r="2.3" fill="'+(i<4 ? '#00d6a4' : '#ff6b5e')+'" stroke="#fff" stroke-width=".6"'+(st.carrier===i ? ' style="filter:drop-shadow(0 0 2px #ffe600)"' : '')+'/>'; });
  const sub=st.mode==='Keeper' ? '<small>'+esc(T.ewc24Rnd(st.rnum))+' · '+st.pts[0]+' : '+st.pts[1]+'</small>' : '';
  return '<div class="ewc-live-top"><span>'+esc(T.ewc24AskH(o.idx, st.mode, st.map))+'</span><span>'+esc(T.ewc24SerLine(ser[0], ser[1], o.bo))+'</span></div>'+
    '<div class="ewc-live-score"><b class="y">'+esc(you.label)+'</b><i>'+st.sc[0]+' : '+st.sc[1]+sub+'</i><b class="o">'+esc(opp.label)+'</b></div>'+
    '<div class="ewc-live-map" style="background-image:url('+(lay.img||'')+')"><svg viewBox="0 0 120 100" preserveAspectRatio="none">'+svg+'</svg>'+
      '<span class="ewc-live-clock">'+esc(st.half)+' · '+mm+':'+ss+'</span></div>'+
    '<div class="ewc-live-tac"><span>'+esc(T.ewc24You2)+': <b>'+esc(mine ? T.ewc24T[mine][0] : '…')+'</b></span><span>'+esc(opp.label)+': <b>'+esc(known ? T.ewc24T[theirs][0] : '?')+'</b></span></div>'+
    '<div class="ewc-live-feed">'+st.feed.slice(0, 4).map(f=>'<div class="'+(f.w===0 ? 'y' : 'o')+'">'+esc(f.txt)+'</div>').join('')+'</div>';
}
async function ewc24LiveMap(box, o){
  const T=L(), {A, B, you, mode, map, rng}=o;
  const opp=A===you ? B : A, youA=A===you;
  const tl=EWC24_TACT[mode];
  let theirs=ewc24Style(opp, mode, rng), known=false;
  const opts=()=>tl.map(k=>({k, name:T.ewc24T[k][0], desc:T.ewc24T[k][1]}));
  const ser=youA ? o.series : [o.series[1], o.series[0]];
  const st={mode, map, sc:[0, 0], clock:0, feed:[], dots:[], obj:0, hold:-1, flag:-1, carrier:-1, key:[60, 50], half:'', rnum:1, pts:[0, 0]};
  const live=()=>!skipAnimation;
  st.dots=ewc24Dots(st);
  let mine=null;
  const draw=()=>{ if(live()) box.innerHTML=ewc24SceneHTML(o, st, mine, theirs, known); };
  // Карта с составами видна сразу, пока выбирается тактика.
  draw();
  mine=await ewc24Ask(T.ewc24AskH(o.idx, mode, map), T.ewc24AskSub(opp.label, ser[0], ser[1]), opts());
  if(!mine) mine=tl[Math.floor(rng()*3)];
  const diff=(you.pow-opp.pow)/3.2;
  const pYou=()=>1/(1+Math.exp(-(diff+ewc24Edge(mine, theirs, mode))));
  const tick=async n=>{ for(let f=0; f<n && live(); f++){ ewc24Move(st, rng); draw(); await sleep(EWC24_FRAME_MS); } };
  const nm=w=>{ const sq=(w===0 ? you : opp).squad; return (sq[Math.floor(rng()*sq.length)]||{}).handle||'?'; };
  const kill=()=>{ if(rng()<0.55){ const w=rng()<pYou() ? 0 : 1; st.feed.unshift({w, txt:T.ewc24Kill(nm(w), nm(1-w))}); } };
  // Соперник тоже подстраивается: проигрывая к середине, в половине случаев берёт то, что бьёт твоё.
  const beater=k=>tl[(tl.indexOf(k)+2)%3];
  const midway=async()=>{
    if(st.sc[1]>st.sc[0] && rng()<0.5) theirs=beater(mine);
    if(!EWC24_LIVE_BIG || st.sc[0]>=st.sc[1] || !live()) return;
    known=true; draw();
    const pick=await ewc24Ask(T.ewc24MidH, T.ewc24Read(opp.label, T.ewc24T[theirs][0]), opts());
    if(pick) mine=pick;
    draw();
  };
  ewc24Aim(st, rng); draw();
  if(mode==='Capture the Flag'){
    st.half=T.ewc24H1;
    for(let seg=0; seg<10 && st.sc[0]<5 && st.sc[1]<5; seg++){
      if(seg===5){ st.half=T.ewc24H2; await midway(); }
      st.clock=seg*60; await tick(4); kill();
      if(rng()<0.5){ const w=rng()<pYou() ? 0 : 1; st.flag=w; st.carrier=w===0 ? 0 : 4; await tick(3);
        st.sc[w]++; st.feed.unshift({w, txt:T.ewc24Cap(nm(w))}); st.flag=-1; st.carrier=-1; }
      st.clock=seg*60+59; draw();
    }
    if(st.sc[0]===st.sc[1]){
      st.half=T.ewc24OT;
      for(let k=0; k<3 && st.sc[0]===st.sc[1]; k++){ st.clock=600+k*50; await tick(4); if(rng()<0.55){ const w=rng()<pYou() ? 0 : 1; st.sc[w]++; st.feed.unshift({w, txt:T.ewc24Cap(nm(w))}); } }
      if(st.sc[0]===st.sc[1]){ const w=rng()<pYou() ? 0 : 1; st.sc[w]++; st.feed.unshift({w, txt:T.ewc24Cap(nm(w))}); }
    }
  } else if(mode==='Hardpoint'){
    for(let rot=0; rot<5 && st.sc[0]<250 && st.sc[1]<250; rot++){
      st.obj=rot; st.half=T.ewc24Rot(rot+1);
      if(rot===2) await midway();
      for(let q=0; q<4 && st.sc[0]<250 && st.sc[1]<250; q++){
        const sh=Math.max(0.05, Math.min(0.95, pYou()+(rng()-0.5)*0.5));
        st.sc[0]=Math.min(250, st.sc[0]+Math.round(25*sh)); st.sc[1]=Math.min(250, st.sc[1]+Math.round(25*(1-sh)));
        st.hold=sh>=0.5 ? 0 : 1; st.clock=rot*60+q*15; kill();
        await tick(2);
      }
      st.feed.unshift({w:st.hold, txt:T.ewc24HillTake((st.hold===0 ? you : opp).label, rot+1)});
    }
    // Время вышло без 250 — у кого больше; ровно — овертайм до первого перевеса.
    while(st.sc[0]===st.sc[1]){ const w=rng()<pYou() ? 0 : 1; st.sc[w]+=5; st.half=T.ewc24OT; await tick(2); }
  } else {
    // Keeper: раунды до 150 очков или пяти минут, карта — до двух выигранных раундов.
    while(st.sc[0]<2 && st.sc[1]<2){
      st.pts=[0, 0]; { const ks=ewc24Lay(st).keys||[[60, 50]]; st.key=ks[Math.floor(rng()*ks.length)]; } st.half=T.ewc24Rnd(st.rnum);
      for(let m=0; m<5 && st.pts[0]<150 && st.pts[1]<150; m++){
        const sh=Math.max(0.05, Math.min(0.95, pYou()+(rng()-0.5)*0.6));
        st.pts[0]=Math.min(150, st.pts[0]+Math.round(55*sh)); st.pts[1]=Math.min(150, st.pts[1]+Math.round(55*(1-sh)));
        st.carrier=sh>=0.5 ? 0 : 4; st.clock=m*60; kill();
        if(m===0) st.feed.unshift({w:sh>=0.5 ? 0 : 1, txt:T.ewc24KeyTake(nm(sh>=0.5 ? 0 : 1))});
        await tick(3);
      }
      const w=st.pts[0]===st.pts[1] ? (rng()<pYou() ? 0 : 1) : (st.pts[0]>st.pts[1] ? 0 : 1);
      st.sc[w]++; st.rnum++; st.carrier=-1;
      if(st.sc[0]<2 && st.sc[1]<2) await midway();
    }
  }
  draw();
  if(live()) await sleep(500);
  const youWon=st.sc[0]>st.sc[1];
  return {youWon, aWins:youWon===youA, s:youA ? [st.sc[0], st.sc[1]] : [st.sc[1], st.sc[0]]};
}
// GSL-группа из четырёх: 1–3 и 2–4 открывают, победители — за 1-е место, проигравшие — на вылет.
async function ewc24Group(t, rng, bo, modes){
  bo=bo||5;
  const m1=await ewc24Play(t[0], t[2], bo, rng, modes), m2=await ewc24Play(t[1], t[3], bo, rng, modes);
  const wm=await ewc24Play(m1.win, m2.win, bo, rng, modes), em=await ewc24Play(m1.lose, m2.lose, bo, rng, modes);
  const dm=await ewc24Play(wm.lose, em.win, bo, rng, modes);
  return {order:[wm.win, dm.win, dm.lose, em.lose], series:[m1, m2, wm, em, dm]};
}
/* Двойное выбывание на 2^k команд (посев сверху вниз). Верх: 1–N, 2–(N−1)…, дальше соседи. Низ:
   проигравшие первого раунда между собой, затем по кругу — выжившие низа против свежих проигравших
   верха и между собой, пока не останется один. Гранд-финал gfBo. places — группы мест снизу вверх. */
async function ewc24Double(seeded, bo, rng, modes, gfBo){
  const n=seeded.length, series=[], out=[];
  let ub=[];
  for(let i=0;i<n/2;i++) ub.push(seeded[i], seeded[n-1-i]);
  let lb=[], ubR=0;
  const play=async(pairs, tag)=>{ const r=[]; for(const [a,b] of pairs){ const s=await ewc24Play(a, b, bo, rng, modes, tag); s.tag=tag; series.push(s); r.push(s); } return r; };
  while(ub.length>1){
    ubR++;
    const us=await play(Array.from({length:ub.length/2}, (_, i)=>[ub[2*i], ub[2*i+1]]), 'ub'+ubR);
    ub=us.map(s=>s.win); const L=us.map(s=>s.lose);
    if(!lb.length){
      const ls=await play(Array.from({length:L.length/2}, (_, i)=>[L[2*i], L[2*i+1]]), 'lb');
      lb=ls.map(s=>s.win); out.push(ls.map(s=>s.lose));
    } else {
      const ls=await play(lb.map((t, i)=>[t, L[L.length-1-i]]), 'lb');
      lb=ls.map(s=>s.win); out.push(ls.map(s=>s.lose));
      if(lb.length>1 && ub.length>1){
        const ms=await play(Array.from({length:lb.length/2}, (_, i)=>[lb[2*i], lb[2*i+1]]), 'lb');
        lb=ms.map(s=>s.win); out.push(ms.map(s=>s.lose));
      }
    }
  }
  const gf=await ewc24Play(ub[0], lb[0], gfBo||bo, rng, modes, 'gf'); gf.tag='gf'; series.push(gf);
  out.push([gf.lose], [gf.win]);
  // Места: сверху вниз.
  const places=[]; let p=1;
  out.slice().reverse().forEach(g=>{ places.push({from:p, to:p+g.length-1, teams:g}); p+=g.length; });
  return {series, places, ubFinalist:ub[0], lbFinalist:lb[0]};
}
// Твоя четвёрка: ты, напарники и сильнейшие свободные карточки 2024-го своего региона (не выше тебя +2).
function ewc24MyTeam(busy){
  const T=L(), me=careerCard(); if(!me) return null;
  const reg=CAREER.player.region||'EU';
  const taken=new Set((busy||[]).map(h=>String(h).toLowerCase()));
  // Своя четвёрка — сквад-состав игрока (CAREER.rosters[4], собирается в окне состава), иначе напарники года.
  const r4=ccFmtRoster(4).map(r=>ccMateCardOf(r)).filter(Boolean);
  const mine=[me].concat(careerSquadSize()===4 ? (careerMates()||[]).filter(Boolean) : r4).slice(0, 4);
  mine.forEach(c=>taken.add(String(c.handle||'').toLowerCase()));
  const myOvr=(CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr)||80;
  /* Сперва люди своего клуба (идея игрока 30.09: «чтобы состав был одной организацией, особенно на EWC» —
     EWC играется клубами): одноклубники года идут первыми и без потолка «не выше тебя +2», потом остальные. */
  const myOrg=(CAREER.org && CAREER.org.name) || null;
  const inOrg=p=>!!myOrg && p.org===myOrg;
  const pool=PLAYERS.filter(p=>p && /^f\d$/.test(String(p.cardSet||'')) && p.region===reg && !taken.has(String(p.handle||'').toLowerCase()) && (inOrg(p) || (p.rating||0)<=myOvr+2))
                    .sort((a,b)=>(inOrg(b)?1:0)-(inOrg(a)?1:0) || (b.rating||0)-(a.rating||0));
  const seen=new Set();
  for(const p of pool){ if(mine.length>=4) break; const k=String(p.handle).toLowerCase(); if(seen.has(k)) continue; seen.add(k); mine.push(p); }
  return {name:mine.map(c=>c.handle).join(' & '), squad:mine, isYou:true, pow:ewc24Pow(mine), label:(CAREER.org && CAREER.org.name) || T.ewc24You};
}
// Настоящая команда: без людей из твоей четвёрки.
function ewc24Team(t, you, reg){
  const mineH=new Set(you.squad.map(c=>String(c.handle).toLowerCase()));
  const squad=t.p.filter(h=>!mineH.has(String(h).toLowerCase())).map(h=>ewc24Card(h, reg));
  return {name:squad.map(c=>c.handle).join(' & '), squad, pow:ewc24Pow(squad), label:t.n, real:true};
}
// Добивка отбора: n четвёрок из сильнейших свободных карточек 2024-го региона (не в составах отбора и не у тебя).
function ewc24FillTeams(n, reg, you, busy){
  const taken=new Set((busy||[]).concat(you.squad.map(c=>c.handle)).map(h=>String(h||'').toLowerCase()));
  const seen=new Set(), pool=[];
  PLAYERS.filter(p=>p && /^f\d$/.test(String(p.cardSet||'')) && (EWC24_QREG[p.region]||p.region)===reg)
    .sort((a,b)=>(b.rating||0)-(a.rating||0))
    .forEach(p=>{ const k=String(p.handle||'').toLowerCase(); if(!k || taken.has(k) || seen.has(k)) return; seen.add(k); pool.push(p); });
  const out=[];
  for(let i=0; i<n && pool.length>=4; i++){
    const squad=pool.splice(0, 4);
    out.push({name:squad.map(c=>c.handle).join(' & '), squad, pow:ewc24Pow(squad), label:'Team '+squad[0].handle});
  }
  return out;
}
function ewc24State(){ const cr=CAREER.career; return cr.ewc24 || (cr.ewc24={}); }
// Путёвка в Эр-Рияд есть — отбор не нужен; нет — на сам EWC не зовут.
function ewc24Invited(ev){
  const st=CAREER.career.ewc24||{};
  if(ev.ewc24==='qual') return !st.you && !!EWC24.quals[EWC24_QREG[CAREER.player.region]||''] && !(st.played||{}).qual;
  if(ev.ewc24==='dallas') return !st.you && !(st.played||{}).dallas && ['EU','NAC','NAW'].indexOf(CAREER.player.region)>=0;
  return !!st.you;
}
// ---- показ ----
function ewc24Nm(t){ return '<b>'+esc(t.label)+'</b>'; }
function ewc24SeriesHTML(s){
  const T=L();
  const mine=s.A.isYou || s.B.isYou;
  const meH=(careerCard()||{}).handle;
  return '<div class="ewc-ser'+(mine ? ' mine' : '')+'"><div class="ewc-ser-h">'+ewc24Nm(s.A)+' <i>'+s.score[0]+' : '+s.score[1]+'</i> '+ewc24Nm(s.B)+
    (s.mvp ? '<span class="ewc-mvp">MVP '+esc(s.mvp)+'</span>' : '')+'</div>'+
    '<div class="ewc-maps">'+s.maps.map(m=>{
      const me=m.me && m.me.find(x=>x.h===meH);
      return '<span class="'+(m.s[0]>m.s[1]?'a':'b')+'"><em>'+esc(m.mode)+' · '+esc(m.map)+'</em>'+m.s[0]+'–'+m.s[1]+
        (me ? '<small>'+esc(T.ewc24MeKd(me.e, me.d))+'</small>' : '')+'</span>'; }).join('')+'</div></div>';
}
function ewc24TableHTML(rows, you, cut){
  return '<div class="ewc-table">'+rows.map(r=>r.teams.map(t=>'<div class="'+(t===you?'you':'')+'"><i>'+(r.from===r.to ? r.from : r.from+'–'+r.to)+'</i>'+ewc24Nm(t)+
    (cut && r.to<=cut ? ' <em>'+esc(L().ewc24Ticket)+'</em>' : '')+'</div>').join('')).join('')+'</div>';
}
function ewc24StatsHTML(you){
  const T=L(), st=you.stats||{};
  const rows=you.squad.map(c=>({h:c.handle, s:st[c.handle]})).filter(r=>r.s);
  if(!rows.length) return '';
  return '<div class="ewc-stats"><div class="ewc-stats-h">'+esc(T.ewc24Stats)+'</div>'+rows.map(r=>'<div><b>'+esc(r.h)+'</b><span>'+r.s.e+' / '+r.s.d+'</span><span>K/D '+(r.s.e/Math.max(1, r.s.d)).toFixed(2)+'</span><span>'+esc(T.ewc24Maps(r.s.maps))+'</span></div>').join('')+'</div>';
}
function ewc24Begin(){
  CAREER_RUN=true;
  CC_SKIP_RUN=false; skipAnimation=false; EWC24_AUTO=false;
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  document.getElementById('finalBanner').style.display='none';
  show('screen-results');
  ensureSkipButton();
  const host=document.getElementById('majorStages');
  return (title, body)=>{ const d=document.createElement('div'); d.className='stage-card ewc-card'; d.innerHTML='<h4>'+esc(title)+'</h4>'+body; host.appendChild(d); d.scrollIntoView({block:'end', behavior:'smooth'}); return d; };
}
function ewc24RosterLine(you){ return '<div class="ewc-roster">'+ewc24Nm(you)+' — '+you.squad.map(c=>esc(c.handle)+' <small>'+Math.round(ewc24Ovr(c))+'</small>').join(', ')+'</div>'; }
function ewc24Finish(ev, title, myPlace, of, cash, passed){
  const cr=CAREER.career;
  removeSkipButton();
  cr.log=cr.log||[];
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:myPlace, of, pts:0, passed:!!passed,
    ovr:CAREER.player.ovr, games:0, wins:0, elims:0, avg:null, mate:(careerMates()[0]||{}).handle||null, mates:ccLogMates(careerMates()),
    prize:cash, kind:'victory', lan:ev.lan, ewc:true});
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title, place:myPlace, through:!!passed, wins:0, cash, cut:0, byPlace:true});
}
// ---- DreamHack Dallas 2024 ----
async function ewc24RunDallas(ev){
  const T=L(), D=EWC24.dallas, st=ewc24State();
  EWC24_LIVE_BIG=false;
  const rng=careerRng(ccHashStr('ewc24dh|'+CAREER.career.season+'|'+careerToday()));
  const busy=[].concat(...D.teams.map(t=>t.p));
  const you=ewc24MyTeam(busy); if(!you) return;
  const card=ewc24Begin();
  const real=D.teams.map(t=>Object.assign(ewc24Team(t, you, 'EU'), {seed:t.s}));
  const weakest=real.slice().sort((a,b)=>a.pow-b.pow)[0];
  const field=real.filter(t=>t!==weakest).concat([you]);
  card(T.ewc24DhTitle, '<div class="stage-detail">'+esc(T.ewc24DhIntro)+'</div>'+ewc24RosterLine(you));
  if(!skipAnimation) await sleep(700);
  // Швейцарка: три раунда Bo3 на посев, пары по счёту побед.
  field.forEach(t=>{ t.sw=0; });
  const swMine=[];
  for(let r=0;r<3;r++){
    const order=field.slice().sort((a,b)=>(b.sw-a.sw) || (b.pow-a.pow) || (rng()-0.5));
    for(let i=0;i+1<order.length;i+=2){ const s=await ewc24Play(order[i], order[i+1], 3, rng, EWC24_MODES.bo3, 'sw'); s.win.sw++; if(s.A===you||s.B===you) swMine.push(s); }
  }
  const seeded=field.slice().sort((a,b)=>(b.sw-a.sw) || (b.pow-a.pow));
  card(T.ewc24Swiss, swMine.map(ewc24SeriesHTML).join('')+'<div class="stage-detail">'+esc(T.ewc24SwissSeed(seeded.indexOf(you)+1, you.sw))+'</div>');
  if(!skipAnimation) await sleep(800);
  // Плей-ин: посев 28–37 парами (28–37, 29–36…), проигравшие — 33–37.
  const top=seeded.slice(0, 27), pin=seeded.slice(27), pinOut=[];
  const pinS=[];
  for(let i=0;i<5;i++){ const s=await ewc24Play(pin[i], pin[9-i], 3, rng, EWC24_MODES.bo3, 'pin'); pinS.push(s); top.push(s.win); pinOut.push(s.lose); }
  const myPin=pinS.find(s=>s.A===you||s.B===you);
  if(myPin){ card(T.ewc24PlayIn, ewc24SeriesHTML(myPin)); if(!skipAnimation) await sleep(700); }
  const places=[];
  // Группы: змейкой по посеву, GSL Bo3, двое сверху — в плей-офф.
  const groups=Array.from({length:8}, ()=>[]);
  top.slice().sort((a,b)=>(b.sw-a.sw) || (b.pow-a.pow)).forEach((t, i)=>{ const r=Math.floor(i/8), c=i%8; groups[r%2 ? 7-c : c].push(t); });
  const thirds=[], fourths=[], po=[];
  for(let gi=0; gi<groups.length; gi++){ const g=groups[gi];
    const r=await ewc24Group(g, rng, 3, EWC24_MODES.bo3);
    po.push(r.order[0], r.order[1]); thirds.push(r.order[2]); fourths.push(r.order[3]);
    if(r.order.indexOf(you)>=0){
      card(T.ewc24DhGroup(String.fromCharCode(65+gi)), r.series.map(ewc24SeriesHTML).join('')+ewc24TableHTML(r.order.map((t,i)=>({from:i+1, to:i+1, teams:[t]})), you, 2));
    }
  }
  if(!skipAnimation) await sleep(800);
  // Плей-офф: первые мест групп против вторых, двойное выбывание Bo3, гранд-финал Bo5.
  const firsts=po.filter((t, i)=>i%2===0), seconds=po.filter((t, i)=>i%2===1);
  const bracket=await ewc24Double(firsts.concat(seconds.reverse()), 3, rng, EWC24_MODES.bo3, 5);
  const mySer=bracket.series.filter(s=>s.A===you||s.B===you);
  if(mySer.length){ card(T.ewc24DhPlayoffs, mySer.map(s=>'<h5 class="ewc-h5">'+esc(T.ewc24Tag(s.tag))+'</h5>'+ewc24SeriesHTML(s)).join('')); if(!skipAnimation) await sleep(800); }
  bracket.places.forEach(p=>places.push(p));
  places.push({from:17, to:24, teams:thirds}, {from:25, to:32, teams:fourths}, {from:33, to:37, teams:pinOut});
  const placeOf=t=>{ const p=places.find(r=>r.teams.indexOf(t)>=0); return p ? p.from : 37; };
  const myPlace=placeOf(you);
  card(T.ewc24Standings, ewc24TableHTML(places.filter(p=>p.from<=16 || p.teams.indexOf(you)>=0), you, D.tickets)+ewc24StatsHTML(you));
  // Путёвки: топ-6 по порядку мест (внутри 5–6 — по силе).
  const ranked=[].concat(...places.map(p=>p.teams.slice().sort((a,b)=>b.pow-a.pow)));
  st.dallas=ranked.slice(0, D.tickets).map(t=>t===you ? 'YOU' : t.label);
  st.played=Object.assign({}, st.played, {dallas:true});
  if(myPlace<=D.tickets) st.you={via:'dallas', place:st.dallas.indexOf('YOU')+1};
  careerMoneyAdd(ranked, (p, t)=>ewc24PayOf(D.pay, placeOf(t)));
  const cash=ewc24PayOf(D.pay, myPlace);
  const mine=cash ? ccShareOf(cash, you) : 0;
  if(mine) ccPayIn(mine);
  careerNews(cash ? 'good' : 'flat', 'ccNewsEvCash', ['DreamHack Dallas 2024', myPlace, ccNum(cash)]);
  if(st.you) careerNews('good', 'ccNewsEwc24Ticket', ['DreamHack Dallas 2024']);
  ewc24Finish(ev, 'DreamHack Dallas 2024', myPlace, 37, mine, !!st.you);
}
// ---- онлайн-отбор своего региона ----
async function ewc24RunQual(ev){
  const T=L(), st=ewc24State();
  EWC24_LIVE_BIG=false;
  const reg=EWC24_QREG[CAREER.player.region]||'EU', Q=EWC24.quals[reg];
  const rng=careerRng(ccHashStr('ewc24q|'+reg+'|'+CAREER.career.season+'|'+careerToday()));
  // Путёвки Dallas уже розданы — их обладатели в отбор не идут.
  const held=new Set((st.dallas||[]).map(n=>String(n).toLowerCase()));
  const busy=[].concat(...Q.teams.map(t=>t.p));
  const you=ewc24MyTeam(busy); if(!you) return;
  const card=ewc24Begin();
  const size=Q.teams.length>=15 ? 16 : 8;
  let field=Q.teams.filter(t=>!held.has(String(t.n).toLowerCase())).map(t=>ewc24Team(t, you, reg));
  // Путёвщики Dallas выбывают из отбора — сетка на 8/16 пустеет (NAC 15−4 = 11 + ты), группа
  // выходит из трёх и ewc24Group падает на t[3]. Пустые места — свободные четвёрки региона.
  if(field.length<size-1) field=field.concat(ewc24FillTeams(size-1-field.length, reg, you, busy));
  field=field.slice().sort((a,b)=>b.pow-a.pow).slice(0, size-1).concat([you]);
  card(T.ewc24QTitle(reg), '<div class="stage-detail">'+esc(T.ewc24QIntro(Q.slots))+'</div>'+ewc24RosterLine(you));
  if(!skipAnimation) await sleep(700);
  const seeded=field.slice().sort((a,b)=>b.pow-a.pow);
  const G=size/4, groups=Array.from({length:G}, ()=>[]);
  seeded.forEach((t, i)=>{ const r=Math.floor(i/G), c=i%G; groups[r%2 ? G-1-c : c].push(t); });
  const firsts=[], seconds=[], thirds=[], fourths=[];
  for(let gi=0; gi<groups.length; gi++){ const g=groups[gi];
    const r=await ewc24Group(g, rng, 5, EWC24_MODES.q5);
    firsts.push(r.order[0]); seconds.push(r.order[1]); thirds.push(r.order[2]); fourths.push(r.order[3]);
    if(r.order.indexOf(you)>=0){
      card(T.ewc24Group(String.fromCharCode(65+gi)), r.series.map(ewc24SeriesHTML).join('')+ewc24TableHTML(r.order.map((t,i)=>({from:i+1, to:i+1, teams:[t]})), you, 2));
    }
  }
  if(!skipAnimation) await sleep(800);
  const bracket=await ewc24Double(firsts.concat(seconds.reverse()), 5, rng, EWC24_MODES.q5, 5);
  const mySer=bracket.series.filter(s=>s.A===you||s.B===you);
  if(mySer.length){ card(T.ewc24QPlayoffs, mySer.map(s=>'<h5 class="ewc-h5">'+esc(T.ewc24Tag(s.tag))+'</h5>'+ewc24SeriesHTML(s)).join('')); if(!skipAnimation) await sleep(800); }
  const places=bracket.places.concat([{from:size/2+1, to:size/2+G, teams:thirds}, {from:size/2+G+1, to:size, teams:fourths}]);
  const placeOf=t=>{ const p=places.find(r=>r.teams.indexOf(t)>=0); return p ? p.from : size; };
  const myPlace=placeOf(you);
  card(T.ewc24Standings, ewc24TableHTML(places, you, Q.slots)+ewc24StatsHTML(you));
  const ranked=[].concat(...places.map(p=>p.teams));
  st.quals=Object.assign({}, st.quals, {[reg]:ranked.slice(0, Q.slots).map(t=>t===you ? 'YOU' : t.label)});
  st.played=Object.assign({}, st.played, {qual:true});
  if(myPlace<=Q.slots) st.you={via:'qual', reg, k:st.quals[reg].indexOf('YOU')};
  if(st.you) careerNews('good', 'ccNewsEwc24Ticket', [T.ewc24QTitle(reg)]);
  else careerNews('flat', 'ccNewsEvCash', [T.ewc24QTitle(reg), myPlace, ccNum(0)]);
  ewc24Finish(ev, T.ewc24QTitle(reg), myPlace, size, 0, !!st.you);
}
// ---- Эр-Рияд ----
async function runCareerEwc2024(ev){
  if(ev.ewc24==='dallas') return ewc24RunDallas(ev);
  if(ev.ewc24==='qual') return ewc24RunQual(ev);
  const cr=CAREER.career, T=L(), st=ewc24State();
  EWC24_LIVE_BIG=true;
  const rng=careerRng(ccHashStr('ewc24|'+cr.season+'|'+careerToday()));
  const allP=[].concat(...EWC24.teams.map(t=>t.p), ...EWC24.dallas.teams.map(t=>t.p), ...Object.values(EWC24.quals).map(q=>[].concat(...q.teams.map(t=>t.p))));
  const you=ewc24MyTeam(allP); if(!you) return;
  const card=ewc24Begin();
  // Кто держит путёвку слота: своя карьера (Dallas, отбор) или настоящая команда.
  const byName=n=>{
    const k=String(n).toLowerCase(), alias=EWC24.dallas.alias[n];
    const e=EWC24.teams.find(t=>t.n.toLowerCase()===k || (alias && t.n===alias));
    if(e) return {n:e.n, p:e.p};
    const d=EWC24.dallas.teams.find(t=>t.n.toLowerCase()===k); if(d) return d;
    for(const q of Object.values(EWC24.quals)){ const x=q.teams.find(t=>t.n.toLowerCase()===k); if(x) return x; }
    return null;
  };
  const used=new Set(), teams=[];
  EWC24.teams.forEach(slot=>{
    const v=slot.via;
    let who=v[0]==='dallas' ? (st.dallas||[])[v[1]-1] : ((st.quals||{})[v[1]]||[])[v[2]];
    // Своя команда — только в слоте своей путёвки (st.you); чужой «YOU» в списке — настоящая команда слота.
    const mySlot=st.you.via==='dallas' ? (v[0]==='dallas' && v[1]===st.you.place) : (v[0]==='qual' && v[1]===st.you.reg && v[2]===st.you.k);
    if(!who || (who==='YOU' && !mySlot)) who=slot.n;
    if(mySlot) who='YOU';
    if(who==='YOU'){ you.g=slot.g; teams.push(you); used.add('you'); return; }
    let src=byName(who);
    if(!src || used.has(src.n.toLowerCase())) src={n:slot.n, p:slot.p};
    if(used.has(src.n.toLowerCase())){
      // Взятый дважды — следующий в отборе этого слота.
      const pool=v[0]==='qual' ? EWC24.quals[v[1]].teams : EWC24.dallas.teams;
      src=pool.find(t=>!used.has(t.n.toLowerCase())) || src;
    }
    used.add(src.n.toLowerCase());
    const t=ewc24Team(src, you, slot.r); t.g=slot.g; teams.push(t);
  });
  if(teams.indexOf(you)<0) return;
  const groupOf=g=>teams.filter(t=>t.g===g);
  card(T.ewc24Title, '<div class="stage-detail">'+esc(T.ewc24Intro)+'</div>'+ewc24RosterLine(you)+
    '<div class="stage-detail">'+esc(st.you.via==='dallas' ? T.ewc24ViaDallas(st.you.place) : T.ewc24ViaQual(st.you.reg))+'</div>');
  if(!skipAnimation) await sleep(700);
  const gRes={};
  for(const g of ['A','B','C','D']){
    const r=await ewc24Group(groupOf(g), rng); gRes[g]=r;
    if(r.order.indexOf(you)>=0){
      card(T.ewc24Group(g), r.series.map(ewc24SeriesHTML).join('')+'<div class="ewc-table">'+r.order.map((t,i)=>'<div class="'+(t===you?'you':'')+'"><i>'+(i+1)+'</i>'+ewc24Nm(t)+(i<2?' <em>'+esc(T.ewc24Through)+'</em>':'')+'</div>').join('')+'</div>');
      if(!skipAnimation) await sleep(900);
    }
  }
  const g1=g=>gRes[g].order[0], g2=g=>gRes[g].order[1];
  const qf=[];
  for(const [x, y] of [['A','B'], ['D','C'], ['B','A'], ['C','D']]) qf.push(await ewc24Play(g1(x), g2(y), 7, rng, null, 'qf'));
  const sf=[await ewc24Play(qf[0].win, qf[1].win, 7, rng, null, 'sf'), await ewc24Play(qf[2].win, qf[3].win, 7, rng, null, 'sf')];
  const fin=await ewc24Play(sf[0].win, sf[1].win, 7, rng, null, 'final');
  if(qf.some(s=>s.A===you||s.B===you)){
    card(T.ewc24Playoffs, [T.ewc24Qf, T.ewc24Sf, T.ewc24Final].map((h,i)=>'<h5 class="ewc-h5">'+esc(h)+'</h5>'+([qf, sf, [fin]][i]).map(ewc24SeriesHTML).join('')).join(''));
    if(!skipAnimation) await sleep(900);
  }
  const place=new Map();
  place.set(fin.win, 1); place.set(fin.lose, 2);
  sf.forEach(s=>place.set(s.lose, 3)); qf.forEach(s=>place.set(s.lose, 5));
  ['A','B','C','D'].forEach(g=>{ place.set(gRes[g].order[2], 9); place.set(gRes[g].order[3], 13); });
  const ranked=teams.slice().sort((a,b)=>(place.get(a)||16)-(place.get(b)||16));
  const myPlace=place.get(you)||16;
  // MVP турнира: лучший игрок чемпиона (своя четвёрка — по убийствам-смертям за весь турнир).
  const champ=fin.win;
  const mvp=champ===you ? ewc24Best(you, rng, Object.entries(you.stats||{}).map(([h, s])=>({h, e:s.e, d:s.d}))) : ewc24Best(champ, rng, null);
  const meH=(careerCard()||{}).handle;
  const rowsP=[{from:1,to:1,teams:[fin.win]},{from:2,to:2,teams:[fin.lose]},{from:3,to:4,teams:sf.map(s=>s.lose)},{from:5,to:8,teams:qf.map(s=>s.lose)},
    {from:9,to:12,teams:['A','B','C','D'].map(g=>gRes[g].order[2])},{from:13,to:16,teams:['A','B','C','D'].map(g=>gRes[g].order[3])}];
  card(T.ewc24Standings, ewc24TableHTML(rowsP, you, 0)+'<div class="stage-detail ewc-mvp-line">'+esc(T.ewc24MvpTour(mvp, champ.label))+'</div>'+ewc24StatsHTML(you));
  careerMoneyAdd(ranked, (p, t)=>ewc24Pay(place.get(t)||16));
  const cash=ewc24Pay(myPlace);
  let mine=cash ? ccShareOf(cash, you) : 0;
  if(mine) ccPayIn(mine);
  if(mvp===meH){ ccPayIn(EWC24.mvp||50000); mine+=EWC24.mvp||50000; careerNews('good', 'ccNewsEwc24Mvp', [ccNum(EWC24.mvp||50000)]); }
  careerNews(cash ? 'good' : 'flat', 'ccNewsEvCash', ['Esports World Cup 2024', myPlace, ccNum(cash)]);
  if(myPlace===1) careerNews('good', 'ccNewsEwc24Champ', [you.label]);
  else if(champ.real) careerNews('flat', 'ccNewsWorldWon', ['Esports World Cup 2024', champ.label]);
  ewc24Finish(ev, 'Esports World Cup 2024', myPlace, 16, mine, cash>0);
}
/* ARENAS FIGHT NIGHT — сетка на 16 из игроков своего региона около твоего рейтинга, файты до пяти раундов.
   Шанс раунда — тот же, что у дружеского 1v1 (careerFriend1v1): 0.5 + 3% за очко рейтинга, 8–92%. Без лобби и зоны. */
const CC_FN_SIZE=16, CC_FN_TO=5;
function ccFnOvr(c){ return c && c._you ? c._ovr : (c && (c._ovr || (attrsFor(c)||{}).ovr)) || 70; }
function ccFnBracket(ev){
  const cr=CAREER.career, pl=CAREER.player;
  const mine=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  const rnd=careerRng(ccHashStr('fn|'+(cr.season||1)+'|'+careerToday()+'|'+(ev.n||1)));
  const meKey=pl.handle ? hKey(pl.handle) : '';
  const pool=(ccSceneRoster(ccCareerRegion())||[]).filter(c=>c && c.handle && hKey(c)!==meKey)
    .slice().sort((a,b)=>Math.abs(ccFnOvr(a)-mine)-Math.abs(ccFnOvr(b)-mine)).slice(0, 40);
  const field=[];
  while(field.length<CC_FN_SIZE-1 && pool.length) field.push(pool.splice(Math.floor(rnd()*pool.length), 1)[0]);
  const you={_you:true, handle:pl.nick||'You', _ovr:mine};
  // Посев по рейтингу: 1–16, 2–15, … — ты на своём месте по силе.
  const seeded=field.concat([you]).sort((a,b)=>ccFnOvr(b)-ccFnOvr(a));
  const order=[0,15,7,8,3,12,4,11,1,14,6,9,2,13,5,10].filter(i=>i<seeded.length).map(i=>seeded[i]);
  const rounds=[]; let alive=order, out=new Map();
  while(alive.length>1){
    const next=[], res=[];
    for(let i=0;i<alive.length;i+=2){
      const a=alive[i], b=alive[i+1];
      if(!b){ next.push(a); continue; }
      const p=clamp(0.5+(ccFnOvr(a)-ccFnOvr(b))*0.03, 0.08, 0.92);
      let x=0, y=0; while(x<CC_FN_TO && y<CC_FN_TO){ if(rnd()<p) x++; else y++; }
      const w=x>y ? a : b, l=x>y ? b : a;
      res.push({a, b, x, y}); next.push(w); out.set(l, alive.length);
    }
    rounds.push(res); alive=next;
  }
  out.set(alive[0], 1);
  // Место: чемпион 1, финалист 2, полуфинал 3, четвертьфинал 5, первый круг 9 (как «топ-N» сетки).
  const place=t=>{ const n=out.get(t); return n===1 ? 1 : n===2 ? 2 : n===4 ? 3 : n===8 ? 5 : 9; };
  return {you, rounds, place:place(you), champ:alive[0], size:order.length, rnd};
}
const CC_FN_ROUND=n=>n===16 ? 'R16' : n===8 ? 'QF' : n===4 ? 'SF' : 'F';
/* КАСТЕРЫ НА ВЕЧЕРЕ (17.10, его «9»): строка комментатора поверх карты, как эфир FNCS. Источник — те же кадры, что
   рисуют карту и живую таблицу (onZoneFrame): старт игры, новая зона, твои киллы, мясо в центре, финальные N, твой вылет,
   победа. Не чаще строки в CC_CAST_GAP кадров, кроме главных моментов (вылет, победа) — их не пропускаем. */
const CC_CAST_GAP=14;
let CC_CAST=null;
function ccCastName(t){ return String((t && (t.name || (t.squad && t.squad.map(c=>c.handle).join(' & ')))) || '').replace(/<[^>]*>/g, '').trim(); }
function ccCastSay(key, args, must){
  const S=CC_CAST; if(!S) return;
  if(!must && S.frame-S.lastAt<CC_CAST_GAP) return;
  const bank=L()[key]; if(!bank) return;
  const lines=Array.isArray(bank) ? bank : [bank];
  const f=lines[(S.n++ + S.seed)%lines.length];
  const text=typeof f==='function' ? f.apply(null, args||[]) : f;
  S.lastAt=S.frame;
  const feeds=[...document.querySelectorAll('.zr-feed')].filter(x=>x.offsetParent!==null);
  const wrap=(feeds[feeds.length-1]||{}).parentElement; if(!wrap) return;
  let el=wrap.querySelector('.cc-cast');
  if(!el){ el=document.createElement('div'); el.className='cc-cast'; wrap.appendChild(el); }
  el.textContent='🎙️ '+text;
}
function ccCastFrame(lobby, frame){
  if(!frame || !frame.dots) return;
  let alive=0; frame.dots.forEach(d=>{ if(d.alive) alive++; });
  const yi=lobby.findIndex(t=>t && t.isYou), yd=yi>=0 ? frame.dots[yi] : null;
  let S=CC_CAST;
  // Новая игра: живых стало больше или зона откатилась назад.
  if(!S || alive>S.alive || (frame.zone!=null && frame.zone<S.zone)){
    S=CC_CAST={frame:0, lastAt:-99, n:0, seed:ccHashStr(careerToday()+'|'+alive)%7, alive:alive, zone:frame.zone||0,
               yE:yd ? (yd.e||0) : 0, yAlive:!!(yd && yd.alive), final:false, done:false};
    ccCastSay('ccCastStart', [alive], true);
    return;
  }
  S.frame++;
  if(S.done) return;
  const you=yi>=0 ? ccCastName(lobby[yi]) : '';
  // Порядок — по важности: победа, твой вылет, финальные N, твои киллы, мясо, зона.
  if(alive===1){
    const wi=frame.dots.findIndex(d=>d.alive), w=lobby[wi];
    ccCastSay(w && w.isYou ? 'ccCastYouWin' : 'ccCastWin', [ccCastName(w)], true);
    S.done=true;
  } else if(yd && S.yAlive && !yd.alive){
    S.yAlive=false;
    ccCastSay('ccCastYouOut', [you, yd.p || alive+1], true);
  } else if(alive<=5 && !S.final){
    S.final=true; ccCastSay('ccCastFinal', [alive], true);
  } else if(yd && yd.alive && (yd.e||0)>S.yE){
    const k=(yd.e||0)-S.yE;
    ccCastSay(k>=2 ? 'ccCastYouMulti' : 'ccCastYouKill', [you, k], k>=2);
  } else if(S.alive-alive>=3){
    ccCastSay('ccCastWipe', [S.alive-alive, alive]);
  } else if(frame.zone!=null && frame.zone>S.zone){
    ccCastSay('ccCastZone', [frame.zone, alive]);
  }
  if(yd) S.yE=yd.e||0;
  S.alive=alive; if(frame.zone!=null) S.zone=frame.zone;
}
async function runCareerFightNight(ev){
  const cr=CAREER.career, pl=CAREER.player;
  skipAnimation=false; CC_SKIP_RUN=false;
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  CAREER_RUN=true;
  show('screen-results');
  const B=ccFnBracket(ev), you=B.you;
  const card=document.createElement('div'); card.className='stage-card';
  const rows=[]; let wins=0, games=0, rw=0, lastOpp=null;
  B.rounds.forEach(res=>{
    const m=res.find(r=>r.a===you || r.b===you); if(!m) return;
    const mineX=m.a===you ? m.x : m.y, theirX=m.a===you ? m.y : m.x, opp=m.a===you ? m.b : m.a;
    games++; rw+=mineX; if(mineX>theirX) wins++; lastOpp=opp;
    rows.push('<div>'+CC_FN_ROUND(res.length*2)+' · @'+esc(ccHandle(opp.handle))+' ('+Math.round(ccFnOvr(opp))+') — <b>'+mineX+'–'+theirX+'</b></div>');
  });
  card.innerHTML='<h4>'+esc((ev.name||'Arenas Fight Night')+' '+(ev.n||''))+'</h4><div class="stage-detail">'+rows.join('')+
    (B.place!==1 ? '<div>'+L().ccFnChamp(ccHandle(B.champ.handle))+'</div>' : '')+'</div>';
  document.getElementById('majorStages').appendChild(card);
  const cash=ccVictoryPayOf(ev, B.place);
  if(cash){ ccPayIn(cash); careerReachAdd(careerReachResult(B.place, B.size, cr.division, 'victory')); }
  // Файты учат файтам — как дружеский 1v1, но за вечер.
  if(!pl.attrs) pl.attrs=ccOwnAttrs();
  if(pl.attrs) ['aim','clu'].forEach(k=>{ pl.attrs[k]=clamp((pl.attrs[k]||50)+0.1*games, 35, 99); });
  careerNews(B.place===1 ? 'good' : 'flat', B.place===1 ? 'ccNewsFnWin' : 'ccNewsFnOut',
             [ev.name||'Arenas Fight Night', B.place, lastOpp ? ccHandle(lastOpp.handle) : '', wins]);
  cr.log=cr.log||[];
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:B.place, of:B.size, pts:rw, passed:cash>0,
               ovr:pl.ovr, games:games, wins:wins, elims:rw, avg:null, mate:null, mates:[], prize:cash, kind:'victory', solo:true, fight:true});
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:(ev.name||'Arenas Fight Night')+' '+(ev.n||''), place:B.place, through:cash>0,
    wins:wins, cash:cash, cut:0, byPlace:true, placed:0});
}
async function runCareerVictoryNight(){
  const cr=CAREER.career;
  const ev=careerVictoryOn(careerToday());
  if(!ev) return;
  // EWC 2024 — не батл рояль: свой движок серий 4 на 4 (runCareerEwc2024).
  if(ev.ewc24 && typeof runCareerEwc2024==='function') return runCareerEwc2024(ev);
  if(ev.fight) return runCareerFightNight(ev);
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('victory') : null;
  const solo=ev.mode==='solo';
  const me=careerCard();
  if(!me) return;
  /* The tenth runner, and the only one with a solo night in it.

     A solo cup is one player whatever the season is. The other one is the
     season's own squad, so in a trios year it is a trio — and the calendar
     calls it a trios cup to match. See ccVictoryCupName. */
  let mates=[], mate=null;
  if(!solo){
    mates=careerMates();
    if(mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
    mate=mates[0]||null;
  }

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  const prevSet=ACTIVE_LANDING_SET;
  CARD_MODE=true;
  squadSize=solo?1:careerSquadSize();
  drafted=solo?[me]:[me].concat(mates);
  // Three of the year's Victory Cups are Reload ones — the mode, not the
  // squad size — and they are played on the Reload island like the circuit is.
  // The rest play the season's island, not a hardcoded one: a trios year lives
  // on the Chapter 6 islands and its solo cup was the one night landing on the
  // Chapter 7 map. A player's report, 23 August. careerBrSet already knows the
  // season, and in a duos year it answers m2 like the old hardcode did.
  useLandingSet(ccEvLandingSet(ev));

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  /* СОЛО-КАП В КОМАНДЕ — та же схема, что у Solo Series (см. runCareerSoloSeries):
     оба человека в одной сотне, в порядке ников, каждый со своим адресом
     вопросов (mpTag), и из сотни вычтены оба — и тёзки обоих. Скриншот: «diff 2 of 4900: #1 sky:102 vs scroll:102» — каждый клиент ставил
     себя первым, а напарника не помечал вовсе. */
  // В общей комнате гонки второй человек — соперник, той же дорогой (свой дроп, свой адрес).
  // (Гонка соперников в соло сажает сама, из строк гонки — ccRaceFieldSync; здесь только команда.)
  const pc=(solo && ccMpOn() && typeof MP!=='undefined' && MP.peer && hKey(MP.peer)!==hKey(me)) ? MP.peer : null;
  const soloYou=function(card, form, label){
    const t=careerTeam([card], true);
    t.pow=Math.round(t.pow+form);
    t.summitRegion=ccCareerRegion();
    t.name=label; t.mpTag=':'+hKey(card);
    return t;
  };
  let you, soloMate=null;
  if(pc){
    { const self=ccSoloSelf(me); you=soloYou(self.card, self.form, L().yourTeamPrefix+teamLabel(drafted)); }
    soloMate=soloYou(pc, Number(pc.formPow)||0, teamLabel([pc]));
    if(typeof ccRaceLock==='function' && ccRaceLock()){ soloMate.isRival=true; soloMate.raceId=(ccRaceRival()||{}).id||null; }
    else soloMate.isMate=true;
  } else {
    you=careerYouTeam(drafted);
    you.name=L().yourTeamPrefix+teamLabel(drafted);
  }
  you.isYou=true;
  // Мобильный вечер — сила только от мобильного рейтинга (ccMobileSelfPow), ПК-рейтинг, девайсы и бонусы ПК не участвуют.
  // До штрафа выезда: пинг на чужом сервере и на мобиле тот же.
  // Напарнику - его консоль и его мобильная сила с провода: прибавка только своей строке давала h106+108 у обоих наоборот.
  if(ccConsoleNeed(ev)==='mobile'){ you.pow=ccMobileSelfPow();
    if(soloMate && isFinite(Number(pc.mobPow))) soloMate.pow=Number(pc.mobPow); }
  else if(ccConsoleNeed(ev)){ const need=ccConsoleNeed(ev); you.pow+=ccConsoleDevBonus(need);
    if(soloMate) soloMate.pow+=Number((pc.conDev||{})[need])||0; }
  if(CC_AWAY) you.pow=Math.max(1, Math.round(you.pow-CC_AWAY.pen));   // чужой сервер: пинг (ccAwayPen)
  const humans=soloMate ? (hKey(me)<hKey(pc) ? [you, soloMate] : [soloMate, you]) : [you];
  /* Офлайн-турнир по приглашению (ev.invite — сколько человек там играло): одна комната
     приглашённых, сильнейших, как на ЛАНах карьеры; одна серия игр, деньги за место по таблице
     турнира; второго раунда нет. */
  const lanN=ev.invite ? (solo ? ev.invite : Math.max(2, Math.round(ev.invite/careerSquadSize()))) : 0;
  // FNCS Trial — одна сессия: второго раунда нет, ступень по месту в ней (ccPlacementApply).
  // Кап в одно окно у Epic (ccCupRounds — Solo Cash Cup 2019–20, дейли, капы 2021) — один раунд,
  // деньги по месту сразу, как у ЛАНа.
  const oneRound=!lanN && !ev.single && (!!(ev.pay || ev.payT) && ccCupRounds(ev)===1 || !!ev.ownQual);
  // Victory Cash Cup из архива платит за победы (ccVicPerWin), не за место.
  const byWins=!lanN && ccVicPerWin(ev)>0;
  const vicPay=function(ranked){ return function(place){ return byWins ? ccVicWinsCash(ev, (ranked[place-1]||{}).wins, ccVictoryTeamSize(ev)) : ccVictoryPayOf(ev, place); }; };
  // Очки раундов — как у Epic в этом капе (ccCupScore); у ЛАНов и своих событий — прежняя таблица.
  // Этапы Mobile Series (хит, квал, группы, полуфинал) — комнаты по приглашению, но очки и число игр у них Epic'овы.
  const vSc1=(lanN && !ev.series) ? null : ccCupScore(ev, 1), vSc2=lanN ? null : ccCupScore(ev, 2);
  /* Число игр — тоже Epic'ово (MatchCap окна в CC_CUP_SCORE, третье/четвёртое поле): Solo Victory Cup S41 — 8 в раунде 1,
     Duos S39 — 7, Solo Cash Cup 2023/2025 — 10 и 10. Было 6 (раунд 1) и 3/6 (раунд 2) на все капы. Нет числа — как было. */
  const capOk=n=>n>0 && n<=15;
  const vG1=(ev.ownQual && capOk(ev.games)) ? ev.games : (vSc1 && capOk(vSc1.cap)) ? vSc1.cap : CC_VICTORY_R1_GAMES;
  // Игр в комнате: ЛАН — своё число (ev.games), этап Mobile Series — Epic'ово (vG1), чемпионат серии — 25.
  const vGames=ev.series==='champ' ? ev.games : (lanN && !ev.series) ? (ev.games||6) : vG1;
  const vSize=lanN || careerVictoryField(solo), vCut=(lanN || ev.single || oneRound || ccIsMobSeries(ev)) ? 0 : careerVictoryCut(solo);
  const field=[...humans, ...(lanN ? (solo ? (ccConsoleNeed(ev)==='mobile' ? (ev.series ? ccMobileStageField(ev, vSize-humans.length) : ccMobileField(vSize-humans.length, true)) : careerSoloField(cr, pc ? [me, pc] : drafted, vSize-(humans.length-1), false, 'final'))
                                           : careerCupField(cr, drafted, vSize, 'lan|'+ev.id, false, CC_FIELD_SHARP.lan))   // size — вместе со мной (было vSize-1: Katowice 49 пар из 50, 21.10)
                             : solo ? (ccConsoleNeed(ev)==='mobile' ? ccMobileField(vSize-humans.length)   // мобильная сцена (ровно столько, без места под себя)
                                         : careerSoloField(cr, pc ? [me, pc] : drafted, vSize-(humans.length-1), true))
                                    : careerCupField(cr, drafted, vSize, null, true))];
  // Финал своего турнира: прошедшие квалы, кого нет на сцене — добор обычным полем ЛАНа.
  if(ev.finalOf){
    const room=lanN-humans.length, own=ccOwnFinalField(ev, room)||[];
    if(own.length){
      const keyOf=t=>(t.squad||[]).map(c=>hKey(c)).sort().join('+'), seen=new Set(own.map(keyOf));
      const rest=field.slice(humans.length).filter(t=>!seen.has(keyOf(t))).slice(0, Math.max(0, room-own.length));
      field.splice(humans.length, field.length-humans.length, ...own, ...rest);
    }
  }

  /* Чемпионат Mobile Series (LAN): 25 игр за два дня, очки 25…1 + 2 за элим, матч-пойнт после первого дня — 150% очков
     лидера; первый, кто был на линии и выиграл игру, чемпион, дальше не играют (rcMatchPoint). */
  const mobCh=ev.series==='champ';
  let mobLine=0;
  /* Reshuffle (ev.reshuffle, Red Bull, Вена 2026): Reload Duos, но пара в КАЖДОЙ игре новая,
     по жребию; таблица у каждого своя — очки игры получают оба из пары, элимы делятся. */
  if(ev.reshuffle){
    field.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; });
    const prevSq=squadSize, prevDr=drafted, games=ev.games||6;
    const rng=careerRng(ccHashStr('reshuffle|'+ev.id+'|'+careerToday()));
    squadSize=2;
    for(let g=0; g<games; g++){
      const pool=field.slice();
      for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
      const duos=[];
      for(let i=0;i+1<pool.length;i+=2){
        const a=pool[i], b=pool[i+1], mine=(a===you || b===you);
        /* ВДВОЁМ (команда за настоящих игроков, 20.10: Reshuffle 19.08, «rezon ay+swizzy:103 vs 111»):
           свою пару клиент считал своей командой, с личными прибавками, а пару напарника — ботом, и у
           напарника наоборот. Пара, где стоит кто-то из двоих живых, у обоих собирается одинаково:
           careerTeam, живой первым, двое живых — по нику. */
        const humanIn=soloMate && (mine || a===soloMate || b===soloMate);
        let cards=mine ? [(a===you?a:b).squad[0], (a===you?b:a).squad[0]] : [a.squad[0], b.squad[0]];
        if(humanIn){
          const isH=x=>x===you || x===soloMate;
          const both=isH(a) && isH(b);
          cards=(both ? [a, b].sort((x,y)=>hKey(x.squad[0])<hKey(y.squad[0]) ? -1 : 1) : (isH(a) ? [a, b] : [b, a])).map(x=>x.squad[0]);
        }
        const t=(mine && !humanIn) ? careerYouTeam(cards) : careerTeam(cards, false, true);
        if(mine){ t.isYou=true; t.name=L().yourTeamPrefix+teamLabel(cards); drafted=cards; }
        else if(!t.name) t.name=teamLabel(cards);   // пара по жребию без имени роняла simulateGame (Reshuffle, 29.09)
        t._of=[a, b]; duos.push(t);
      }
      await simulateGamesLive(duos, 1, victoryR1Points, CC_VICTORY_R1_KILL, 'stage', 0, null, null,
        {lobbySize:duos.length, stageName:ev.lan+' · '+(g+1)+'/'+games,
         mapReplay:true, choices:true, stopOnYourDeath:true});
      duos.forEach(t=>(t._of||[]).forEach(p=>{
        // Элимы пары — по долям, как в катке (Notion 13.10: «общие киллы просто на 2 делятся»).
        p.stagePts+=t.stagePts||0; p.stageElims+=Math.round(ccMemberKills(t, p.squad[0]));
        if(t.wins) p.wins=(p.wins||0)+t.wins;
        // Журнал игры — строкой этой игры у каждого из пары (карточка вечера читает stageLog).
        (t.stageLog||[]).forEach(e=>p.stageLog.push(Object.assign({}, e, {game:g+1})));
      }));
    }
    squadSize=prevSq; drafted=prevDr;
  } else
  // Round 1: placement and kills both pay — по правилам Epic этого капа, если они есть.
  await simulateGamesLive(field, vGames, mobCh ? (p=>CC_MOBSER_CHAMP_PTS[p-1]||0) : vSc1 ? vSc1.pts : victoryR1Points,
    mobCh ? CC_MOBSER_CHAMP_KILL : vSc1 ? vSc1.kill : CC_VICTORY_R1_KILL,
    'stage', 0, null, null,
    {lobbySize:ccVictoryLobby(ev, solo), stageName:lanN ? (ev.lan||ev.name) : L().ccVicR1Live,
     mapReplay:true, choices:true, stopOnYourDeath:true,
     days: mobCh ? ev.day1 : 0,
     stopWhen: mobCh ? (function(ts, g){
       if(g===ev.day1) mobLine=Math.round(CC_MOBSER_CHAMP_MP*Math.max.apply(null, ts.map(t=>t.stagePts||0)));
       return mobLine>0 && !!rcMatchPoint(ts, mobLine).champ; }) : null,
     together: soloMate ? humans : null,
     /* ЛАН и комнаты этапов по приглашению (lanN) — одна комната сильнейших, как финал: точку выбирают, и перед
        первой игрой видна карта высадок комнаты (его вопрос 19.11: «почему нет карты перед финалами»).
        Открытый первый раунд капа — по-прежнему раздача. */
     dropEachGame: lanN ? ((g,room)=>soloMate ? ccSoloDrops(room||field, humans, ev.lan||ev.name, ['victory'])
                                              : careerLandingPick(room||field, you, ev.lan||ev.name, ['victory'])) : undefined});
  let mobChamp=null, mobGames=0;
  if(mobCh && mobLine>0){
    const mp=rcMatchPoint(field, mobLine);
    if(mp.champ){
      mobChamp=mp.champ; mobGames=mp.games;
      field.forEach(t=>{ const log=(t.stageLog||[]).slice(0, mp.games); t.stageLog=log;
        t.stagePts=log.reduce((s,e)=>s+(e.pts||0), 0); t.stageElims=log.reduce((s,e)=>s+(e.elims||0), 0);
        t.wins=log.filter(e=>e.place===1).length; });
    }
  }
  const ranked1=field.slice().sort((a,b)=>(b===mobChamp)-(a===mobChamp) || b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place1=ranked1.indexOf(you)+1;
  careerPrAdd(ranked1, {div:CAREER.career.division, kind:'victory'});
  /* Итоговая таблица вечера: второй раунд, если он был. Доска лидеров идёт
     после него, иначе она объявляла бы лидеров посреди турнира. */
  let vicFinal=ranked1;
  const through=!lanN && place1<=vCut;
  // ЛАН платит за место единственной серии — сразу, до карточки.
  const lanCash=(lanN || oneRound) ? vicPay(ranked1)(place1) : 0;
  const ownCut=ev.ownQual ? ccOwnQualDone(ev, ranked1, you) : 0;
  if(lanN || oneRound) careerMoneyAdd(ranked1, vicPay(ranked1));

  const shell1=createStageCardShell(lanN ? (ev.lan||ev.name)+' — '+field.length : oneRound ? (ev.name||'Cash Cup')+' — '+field.length : L().ccVicR1Title(field.length));
  await revealStageLog(you, shell1, true);
  finalizeStageCard(shell1, place1, field.length, you.stagePts, (lanN || oneRound) ? lanCash>0 : through, false,
    ev.ownQual ? (place1<=ownCut ? L().ownQualIn(ownCut) : L().ownQualOut(ownCut))
         : ccIsMobSeries(ev) && ccMobSerCut(ev) ? ccMobSerNote(ev, place1)+(lanCash ? ' · '+L().ccVicPlaceCash(place1, lanCash) : '')
         : (lanN || oneRound) ? (lanCash ? L().ccVicPlaceCash(place1, lanCash) : L().ccWfNoCash)
         : ev.single ? L().lfNewsPlaced(ccTrialDiv(ev, place1, field.length))
         : through ? L().ccVicPass(vCut)
         : ev.placement ? L().lfNewsPlaced(ccPlacementDivOf(false, null, vCut, ev, place1, field.length))
         : L().ccVicFail(vCut));
  await revealStandings(shell1, ranked1, you, ownCut || vCut, null, null,
    (lanN || oneRound) ? vicPay(ranked1) : null, null, lanN || oneRound);

  // cash — на игрока: соло-кап платит одному, дуо/трио — составу.
  const rate=ev.skin ? 0 : ev.cash ? ev.cash*(solo ? 1 : careerSquadSize()) : (solo ? CC_VICTORY_CASH_SOLO : CC_VICTORY_CASH_DUO);
  // Кап с таблицей мест (Duos Cash Cup 2024): шесть игр, очки как в первом раунде, деньги по месту.
  // Placement Cup считает место (очки за место и элимы), как кап с таблицей, только без денег.
  const payCup=!!(ev.pay || (ev.payT && !byWins) || ev.placement);
  let wins=0, cash=lanCash, place2=null;
  /* ВТОРОЙ РАУНД В ОБЩЕЙ КОМНАТЕ — ТОЛЬКО ЕСЛИ ПРОШЛИ ВСЕ ЛЮДИ.
     Второй раунд идёт только у прошедшего (through). Вылетевший в первом заканчивал
     вечер, а его соперник вставал на барьере седьмой игры и, дождавшись «peer done»,
     доигрывал один — скриншоты, «разошлись на игре 7 · peer ahead» и
     «peer done · q drop», всегда на границе раундов. Проба с зрителем (вылетевший
     досчитывает комнату прошедших) разошлась на первом же вопросе высадки: зритель и
     игрок идут по разным веткам. Поэтому проще и честнее: кого-то из людей нет во
     втором раунде — прошедшие доигрывают его сами, без локстепа (соперника в этой
     комнате и так нет), а вылетевший закрывает вечер как обычно. Первый раунд у всех
     общий, как и был. */
  if(typeof ccRaceLock==='function' && ccRaceLock()){
    const top=ranked1.slice(0, vCut);
    const rivalOut=ccRaceNightRoom().some(p=>!top.some(t=>t.mpTag===':'+hKey(p.card)));
    if(!through || rivalOut) ccRaceNightApart();
  }
  /* И В КОМАНДЕ (соло-кап вдвоём, командный год 20.10: S39/S40 Solo Victory Cup — второй раунд
     прошедшего был только у него в досках). Общая часть уже посчитана обоими, хвост — его. */
  if(soloMate && ccMpTeam() && !(typeof ccRaceOn==='function' && ccRaceOn())){
    const mateOut=!ranked1.slice(0, vCut).includes(soloMate);
    /* Врозь — оба, как в гонке: вылетевший тоже не ждёт общего закрытия вечера, которого у прошедшего уже нет
       (онлайн-прогон 2020 года, 21.10: DreamHack Online Open 23.08 — вылетевший стоял на экране итогов, перемотка встала). */
    if(through===mateOut) ccTeamNightApart();
  }
  if(through){
    const r2=ranked1.slice(0, vCut);
    // Комната прошедших — свои единицы (соло: CC_ZONE_OPEN_SOLO_R2; дуо — как в первом).
    ccZoneTuneRound('victory', 2, {mode:solo?'solo':undefined});
    /* Второй раунд — уже не Опен, а комната прошедших, и точка в ней
       выбирается. Первый так и остаётся раздачей: он открыт всему региону. */
    const zones2=null;
    // Соло вдвоём: у каждого своя высадка, адресно (ccSoloDrops), и оба в одной комнате.
    const humans2=humans.filter(h=>r2.indexOf(h)>=0);
    /* Раунд 2 по правилу Epic: у денежного капа — своё правило раунда (S19–S21: те же места,
       элим за два), иначе как в раунде 1; у Victory — «только победа», как было. */
    const r2Sc=(payCup || byWins) ? (vSc2 || vSc1) : null;
    await simulateGamesLive(r2, (vSc2 && capOk(vSc2.cap)) ? vSc2.cap : (payCup ? 6 : CC_VICTORY_R2_GAMES),
      r2Sc ? r2Sc.pts : payCup ? victoryR1Points : victoryR2Points, r2Sc ? r2Sc.kill : payCup ? CC_VICTORY_R1_KILL : 0, 'stage', 0, null, zones2,
      {lobbySize:ccVictoryLobby(ev, solo), stageName:L().ccVicR2Live,
       mapReplay:true, choices:true, stopOnYourDeath:true,
       roomOnly:true,   // комната прошедших: вылетевших людей в неё не досаживать (ccRaceFieldSync)
       together: (soloMate && humans2.length>1) ? humans2 : null,
       dropEachGame:(g,room)=>soloMate ? ccSoloDrops(room||r2, humans2, L().ccVicR2Live, ['victory'])
                                       : careerLandingPick(room||r2, you, L().ccVicR2Live, ['victory'])});
    /* Тем же ключом, каким считается любой другой вечер: очки, победы, элимы.
       Здесь стояло только «очки, победы» — а раунд платит ТОЛЬКО за победы, то
       есть у сорока с лишним команд из пятидесяти и очков ноль, и побед ноль.
       Сортировка стабильная, поэтому вся нижняя половина таблицы оставалась в
       том порядке, в каком её посадили в лобби: его снимок от 26 августа — два
       разных вечера, и в обоих одни и те же восемь дуо на местах 43-50 подряд,
       причём команда с шестью элимами стояла ниже команды с нулём. */
    const ranked2=careerRankField(r2);
    vicFinal=ranked2;
    // Тройка и MVP в итоге вечера — по второму раунду, как таблица этапа над ними; своя оценка остаётся за вечер.
    try{ const nr2=ccNightRate(ranked2); if(nr2 && CC_NIGHT_RATE){ ['podium','mvp','mvpYou','mvpCard'].forEach(k=>{ CC_NIGHT_RATE[k]=nr2[k]; }); } }catch(e){}
    place2=ranked2.indexOf(you)+1;
    wins=you.wins||0;
    cash=payCup ? ccVictoryPayOf(ev, place2) : byWins ? vicPay(ranked2)(place2) : wins*rate;
    // Not a placement table: every team in the lobby is paid for the games it
    // won, so the cheque is read off the team rather than off its row.
    if(payCup || byWins) careerMoneyAdd(ranked2, payCup ? function(place){ return ccVictoryPayOf(ev, place); } : vicPay(ranked2));
    else careerMoneyAdd(r2, function(_place, t){ return (t.wins||0)*rate; });
    const shell2=createStageCardShell(L().ccVicR2Title(r2.length));
    await revealStageLog(you, shell2, true);
    /* Placement Cup денег не платит — его итог ступень (аудит 29.09: карточка писала «без денег» и красным). */
    const pDiv2=ev.placement ? ccPlacementDivOf(true, place2, vCut, ev, place1, field.length) : 0;
    finalizeStageCard(shell2, place2, r2.length, you.stagePts, ev.placement ? pDiv2<ccDivCount() : cash>0, false,
      ev.placement ? L().lfNewsPlaced(pDiv2)
      : payCup ? (cash ? L().ccVicPlaceCash(place2, cash) : L().ccWfNoCash) : (wins ? L().ccVicCash(wins, cash) : L().ccVicNoWin));
    // Колонка «Приз» у кэш-капа — сколько взяло каждое место (его правка 28.09: «призы у
    // каждого не пишутся в таблице второго раунда»). Кап за победы платит не по месту — без колонки.
    await revealStandings(shell2, ranked2, you, 0, null, null,
      payCup ? function(place){ return ccVictoryPayOf(ev, place); } : byWins ? vicPay(ranked2) : null, null, true);
  }
  removeSkipButton();
  // Посев: итог вечера ставит ступень дивизиона.
  const placedDiv=ev.placement ? ccPlacementApply(through, place2, vCut, ev, place1, field.length) : 0;
  /* У записи капа нет label — имя вечера живёт в календаре (DreamCup, Squid
     Grounds, «Duos Victory Cup 2»). Без него пост аналитика выходил
     «undefined — stats leaders». */
  const vicName=((careerYearDays().get(ev.day)||[]).find(x=>x.kind==='victory')||{}).label || ev.lan || ev.name || 'Victory Cup';
  ccBoardAfter(vicFinal, you, vicName);

  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
    careerReachAdd(careerReachResult(1, field.length, cr.division, 'victory'));
    careerNews('good', 'ccNewsVicCash', [wins, cash]);
  } else if(through){
    careerNews('flat', 'ccNewsVicNoWin');
  } else if(!ev.placement){
    careerNews('flat', 'ccNewsVicOut', [place1, field.length]);
  }

  if(ev.skin) ccSkinCupAfter(ev, place1, field.length);
  cr.log=cr.log||[];
  // The night is played, so the night teaches. See careerGrowEvent.
  // Мобильный вечер ПК-рейтинг не качает: у мобила свой (ccMobileGrow).
  if(ccConsoleNeed(ev)!=='mobile') careerGrowEvent(place2||place1, through?vCut:field.length, you, field);
  /* Строка журнала — на КАЖДОГО из людей, с обеих сторон, в одном порядке:
     журнал общий, и две разные строки от двух клиентов перетёрли бы друг
     друга при закрытии (как в Solo Series). В одиночной — одна, своя. */
  const ranked2v=through ? careerRankField(ranked1.slice(0, vCut)) : null;
  humans.forEach(function(t){
    const isMe=(t===you);
    const tThrough=ranked1.indexOf(t)<vCut;
    const tPlace2=(tThrough && ranked2v) ? ranked2v.indexOf(t)+1 : null;
    // Кап с таблицей мест платит за место второго раунда, а не за победы — и журнал пишет то же.
    // Кап в один раунд платит за место этого раунда, как ЛАН (аудит 29.09: журнал писал $0 и «не прошёл»).
    const tCash=(lanN || oneRound) ? vicPay(ranked1)(ranked1.indexOf(t)+1)
               : payCup ? (tPlace2 ? ccVictoryPayOf(ev, tPlace2) : 0)
               : byWins ? (tThrough ? ccVicWinsCash(ev, t.wins, ccVictoryTeamSize(ev)) : 0) : (t.wins||0)*rate*(tThrough ? 1 : 0);
    const placesT=(t.stageLog||[]).map(g=>g.place);
    cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:tPlace2||(ranked1.indexOf(t)+1),
               of:tThrough?vCut:field.length, pts:t.stagePts, passed:tThrough || ((lanN || oneRound) && tCash>0),
               ovr: isMe ? CAREER.player.ovr : Math.round((pc && (pc._targetOvr||pc.rating))||0),
               games:lanN ? (mobGames||vGames) : tThrough?vG1+((vSc2 && capOk(vSc2.cap)) ? vSc2.cap : (payCup ? 6 : CC_VICTORY_R2_GAMES)):vG1,
               wins:t.wins||0, elims:t.stageElims||0,
               avg: placesT.length ? Math.round(placesT.reduce((s,v)=>s+v,0)/placesT.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:ccShareOf(tCash, t), kind:'victory', solo:solo, own: ev.own ? true : undefined,
               who: soloMate ? t.mpTag.slice(1) : undefined});
  });
  // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
  await ccMpClose(ranked1);
  if(ccConsoleNeed(ev)==='mobile'){ ccMobileGrow(place2||place1, field.length); ccMobileSceneGrow(evRanked1ForMobile(field));
    const nx=ccMobSeriesAfter(ev, place2||place1, field.length);
    if(nx) careerNews('good', 'ccNewsMobSer', [L().ccMobSerStage(nx)]); }   // мобильные рейтинги от мест
  // Выезд в чужой регион день не берёт: свой вечер того же дня остаётся (ccAwayPlay). Свой — ставит часы (ccAwayHomeDone).
  // Чемпионат Mobile Series — два дня ЛАНа.
  if(!CC_AWAY){ ccAwayHomeDone(careerToday(), 'victory'); careerAdvanceTo(ccAddDays(careerToday(), ev.series==='champ' ? 2 : 1)); }
  careerSave();

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:(ev.name ? ev.name : ev.mode==='duo'?ccVictoryCupName():L().calVictorySolo)+' '+ev.n,
    place:place2||place1, through: placedDiv ? placedDiv<ccDivCount() : (through || ((lanN || oneRound) && cash>0)), wins:wins, cash:cash, cut:vCut,
    byPlace:!!(lanN || oneRound || payCup), placed:placedDiv||0});
}

/* Solo Series (S39, January, all seven regions), from Tracker pages (EU Heats S1 and Finals Day 2,
   plus the other regions' payouts).
     Qualifiers  4 weekly sessions of 10 matches, best week counts; top 400 (EU, NAC) or 200 advance, snake-seeded.
     Heats       rooms of 100, 6 matches; VR = 947 so a win sums to 1,000 (instant qualify), plus top 25 (50 small regions).
     Finals      100 players, 12 matches over two days, cash to top 100 (75 / 50 in smaller pots).
   Scoring is victoryR1Points, elims 3. A career plays the last qualifier session (the first three were
   in December), one heat and the final in one sitting, like the Globals. */
const CC_SOLO_QUAL_GAMES=10, CC_SOLO_HEAT_GAMES=6, CC_SOLO_FINAL_GAMES=12;
const CC_SOLO_KILL=3, CC_SOLO_FIELD=100;
// Epic splits the world in two: EU and NAC play big rooms and tighter cuts.
function ccSoloBigRegion(){ const r=ccCareerRegion(); return r==='EU'||r==='NAC'; }
function soloSeriesHeatCut(){ return ccSoloBigRegion() ? 25 : 50; }
// Epic's top 400/200 belonged to the real ladder; the share is what carries
// to the career's smaller room — the same arithmetic ccReloadOpenCut does.
function soloSeriesQualCut(){
  const room=careerVictoryField(true);
  return Math.max(25, Math.round(room*(ccSoloBigRegion()?400:200)/(CC_LADDER_TRUE*2)));
}
/* Соло-хиты той же сеткой, что всё соло: победа 60, второе 53, десятое 41, 25-е 26, 50-е 1, ниже ноль,
   килл CC_SOLO_KILL. Раньше победа стоила 1000 (двадцать вторых мест), и две победы при четырёх смертях
   на высадке выходили на первое место. */
/* 29.10 КАК У EPIC (его «сделай как у эпиков»): победа в хите снова 1000 очков — сетка Epic (Tracker, Solo Series
   Heats Session 1 EU) кладёт 947 в первую строку, чтобы победа давала ровно их порог в 1000. Сняли её 27.08, потому что
   победитель играл дальше и две победы с четырьмя смертями выигрывали таблицу; с тех пор хит играется stopOnWin —
   после победы игр больше нет, двух побед не бывает, и бонус снова делает то, что у Epic: ставит прошедшего наверх.
   Остальные места — общая соло-сетка (victoryR1Points). */
const SOLO_HEAT_WIN=1000;
function soloHeatsPoints(place){ return place===1 ? SOLO_HEAT_WIN : victoryR1Points(place); }
/* Два острова круга Reload, по очереди — отзыв: «1 игра
   слюрпи, другая стронхолд».

   На диске их два: капы 1-2 играются на одном (art/map-reload-a.jpg, наборы
   r1 и r2), капы 3-4 на другом (map-reload-b.jpg, r3 и r4). Вечер брал один и
   держал его все игры. Теперь нечётные игры идут на своём острове капа, чётные
   — на втором; какой набор представляет второй остров, решает картинка, а не
   номер, поэтому r2 честно уводит на r3, а r4 — на r1. */
function ccRelIsland(set, game){
  const own=ZONE_SETS[set] ? set : 'r1';
  const other=['r1','r3'].find(x=>MAP_ART[x]!==MAP_ART[own]) || own;
  return (game%2===1) ? own : other;
}
/* Every region's own cheque, read off Tracker on 23 August 2026 —
   [place-or-below, USD], first row that fits pays. NAW and Brazil share a
   table, as do Asia, the Middle East and Oceania; that is Epic's own
   grouping, not a shortcut. */
const CC_SOLO_PRIZES={
  EU:  [[1,15000],[2,10000],[3,9000],[4,8000],[5,7000],[6,6000],[7,5000],
        [8,4000],[9,3000],[10,2000],[25,1000],[50,750],[75,500],[100,250]],
  NAC: [[1,10000],[2,8000],[3,6000],[4,5000],[5,4000],[6,3000],[7,2500],
        [8,2000],[9,1500],[10,1000],[25,750],[50,500],[75,300],[100,200]],
  NAW: [[1,4000],[2,2000],[3,1000],[5,750],[10,500],[25,400],[50,300],[75,200]],
  ASIA:[[1,2500],[2,1250],[3,750],[5,500],[10,375],[25,250],[50,150]]
};
CC_SOLO_PRIZES.BR=CC_SOLO_PRIZES.NAW;
CC_SOLO_PRIZES.ME=CC_SOLO_PRIZES.ASIA;
CC_SOLO_PRIZES.OCE=CC_SOLO_PRIZES.ASIA;
function soloSeriesPrize(place){
  const t=CC_SOLO_PRIZES[ccCareerRegion()]||CC_SOLO_PRIZES.EU;
  const row=t.find(r=>place<=r[0]);
  return row ? row[1] : 0;
}
/* ---- FNCS Solos 2026 -----------------------------------------------------

   Второй соло-турнир года и совсем другой турнир, чем январская Solo Series:
   правила Epic от 1 сентября 2026, шесть стадий, октябрь, и деньги вчетверо
   больше. Он не переиспользует состояние январского (cr.solo) — у них разные
   стадии и разный проход, и одно поле на двоих означало бы, что январский
   финал закрывает октябрьские хиты. Своё состояние — cr.solos.

   Таблицы призовых — Attachment C тех же правил, все семь регионов, по одной
   строке на ступень: [место-или-выше, USD], платит первая подходящая строка.
   Азия, Ближний Восток и Океания делят таблицу — это группировка самого Epic,
   а не сокращение; Бразилия и NAW в этом турнире разошлись, поэтому у них
   таблицы разные (в январском они были общие). */
const CC_SOLOS_PRIZES={
  EU:  [[1,60000],[2,40000],[3,25000],[4,15000],[5,12500],[6,10000],[7,9000],
        [8,8000],[9,6000],[10,5000],[11,4000],[12,3000],[13,2500],[14,2000],
        [15,1500],[20,1250],[25,1000],[50,750],[75,500],[100,300]],
  NAC: [[1,50000],[2,30000],[3,20000],[4,10000],[5,8000],[6,6000],[7,5000],
        [8,4000],[9,3000],[10,2500],[11,2000],[12,1750],[13,1500],[14,1250],
        [15,1000],[20,750],[25,500],[50,400],[75,300],[100,200]],
  NAW: [[1,12500],[2,8000],[3,6000],[4,4000],[5,3000],[6,2000],[7,1500],
        [8,1250],[9,1000],[10,750],[20,500],[50,300],[75,200],[100,150]],
  BR:  [[1,15000],[2,10000],[3,7500],[4,5000],[5,4000],[6,3000],[7,2000],
        [8,1500],[9,1000],[10,750],[20,500],[50,300],[75,200],[100,150]],
  ASIA:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[6,1250],[7,1000],
        [8,750],[9,500],[10,400],[20,300],[50,200],[100,100]]
};
CC_SOLOS_PRIZES.ME=CC_SOLOS_PRIZES.ASIA;
CC_SOLOS_PRIZES.OCE=CC_SOLOS_PRIZES.ASIA;
function solosPrize(place){
  const t=CC_SOLOS_PRIZES[ccCareerRegion()]||CC_SOLOS_PRIZES.EU;
  const row=t.find(r=>place<=r[0]);
  return row ? row[1] : 0;
}
/* Кап дивизиона в соло-год (размер 1): очки как в финале FNCS Solos 2026 (сетка мест victoryR1Points, 4 за элим),
   призы по таблице того финала в регионе: Д1 целиком, каждый дивизион ниже вдвое меньше. Это решение, не данные Epic. */
function ccSoloDivCupOn(){ return typeof careerSquadSize==='function' && careerSquadSize()===1; }
function ccSoloDivCupPrize(place, div){
  if(!ccSoloDivCupOn()) return 0;
  return Math.round(solosPrize(place)/Math.pow(2, Math.max(0, (div||1)-1)));
}
/* Стадии турнира, числа Epic'овы: Round 3 тысяча → топ-100 (в карьерной сотне топ-10), Fast Track сотня → топ-8, хит сотня, LCQ Final 70, финал сотня.
   Своё только топ-11 во втором круге: у Epic проходят 108 из тысячи (10,8%).
   games: матчей в вечере (финал 6+6 за два дня играется одной посадкой, как Глобалы). kill: цена элима по Attachment A (2 квал, 3 хиты и LCQ, 4 Fast Track и финал).
   Сетка мест общая, victoryR1Points (60 за 1-е, 53 за 2-е, 41 за 10-е, 1 за 50-е), совпадает с Attachment A.
   vr: победа в матче сразу в финал (Epic пишет за неё 1000 очков). seat: куда садится игрок по итогу вечера. */
/* Второй раунд квала считается по числам Epic, а не по глазомеру.

   Поле Round 2 — это ровно те, кого Epic провёл из Round 1: 8000 в Европе,
   4000 в NA Central, 2000 в остальных пяти регионах. Дальше идёт тысяча, и это
   тоже его число. Значит доля известна целиком — 1000 из 8000 в Европе, из
   4000 в NAC, из 2000 у остальных, — и в карьерной сотне она даёт 13, 25 и 50.
   Ничего не выдумано: обе цифры дроби напечатаны в правилах.

   (Round 1 так посчитать нельзя, и поэтому его тут нет: сколько человек в него
   заходит, Epic не публикует вовсе — только порог допуска «топ-200 000 Power
   Rankings», а это не поле.) */
const CC_SOLOS_R1_THROUGH={EU:8000, NAC:4000};
function solosR2Cut(){
  const adv=CC_SOLOS_R1_THROUGH[ccCareerRegion()]||2000;
  return Math.round(100*1000/adv);
}
/* ROUND 1 (29.10, его выбор «оценка, с пометкой»). Правила Epic (сверка tools/measured/solos-2026-audit.md): квал 1 —
   28–29.09, квал 2 — 5–6.10, две сессии по 11 матчей в общий зачёт, 2 очка за элим, допуск — топ-200 000 PR, дальше
   проходят 8000 EU / 4000 NAC / 2000 остальные; топ-2000 PR может пропустить Round 1 и сразу играть Round 2 (сыграл
   Round 1 — пропуск сгорел). Сколько человек играет Round 1, Epic не публикует, Tracker закрыт, — ОЦЕНКА:
   проходит каждый пятый (CC_SOLOS_R1_SHARE) открытого поля карьеры (careerVictoryField(true), ~4900).
   Вечер — один, два дня по 11 игр с общей таблицей (twoDay, как финалы). */
const CC_SOLOS_R1_SHARE=0.2, CC_SOLOS_PR_SKIP=2000;
function solosR1Cut(){ return Math.max(1, Math.round(careerVictoryField(true)*CC_SOLOS_R1_SHARE)); }
// Топ-2000 доски PR — пропуск Round 1 (доска карьеры, своя строка — you).
function ccSolosPrSkip(){
  try{ const rows=careerPrRows(), i=rows.findIndex(r=>r.you); return i>=0 && i<CC_SOLOS_PR_SKIP; }catch(e){ return false; }
}
const CC_SOLOS_ORDER=['q1r1','q1r2','q1r3','fast','q2r1','q2r2','q2r3','heats','lcq1','lcqf','final'];
const CC_SOLOS_STAGES={
  q1r1: {games:22, kill:2, open:true, cut:solosR1Cut, pass:'q1r2', twoDay:true},
  q2r1: {games:22, kill:2, open:true, cut:solosR1Cut, pass:'q2r2', twoDay:true},
  q1r2: {games:11, kill:2, field:100, cut:solosR2Cut, pass:'q1r3'},
  q1r3: {games:11, kill:2, field:100, cut:10, pass:'fast'},
  fast: {games:4,  kill:4, field:100, cut:8,  pass:'final', rest:'heats'},
  q2r2: {games:11, kill:2, field:100, cut:solosR2Cut, pass:'q2r3'},
  q2r3: {games:11, kill:2, field:100, cut:11, pass:'heats'},
  // Победа в хите и в LCQ Final — 1000 очков (правила Epic, приложение A; Liquipedia — та же сетка), сверка 29.10.
  heats:{games:6,  kill:3, field:100, cut:29, vr:true, pass:'final', tail:[36,50], tailSeat:'lcqf', pts:soloHeatsPoints},
  /* Последний шанс — открытая комната, как январский квал: сколько человек в
     него заходит, Epic не называет («все, кто играл Round 1 и не прошёл»), а
     вот сколько выходит — называет, и это семьдесят. Поэтому поле берётся
     карьерное, открытое, а отсечка — Epic'ова, живьём. */
  // Поле LCQ Round 1 — по региону, той же долей, что выход из Round 1 у Epic (EU 8000, NAC 4000, остальные 2000; сверка 29.10).
  lcq1: {games:11, kill:2, open:true, cut:70, pass:'lcqf', fieldScale:()=>(CC_SOLOS_R1_THROUGH[ccCareerRegion()]||2000)/8000},
  // LCQ Final — «players: 100» (Liquipedia): 70 из LCQ Round 1 и 36–50-е обоих хитов. Было 70 (сверка 7.10).
  lcqf: {games:5,  kill:3, field:100, cut:17, vr:true, pass:'final', pts:soloHeatsPoints},
  final:{games:12, kill:4, field:100, cut:0,  prize:solosPrize}
};
/* FNCS Solo Reload, ноябрь 2026 — схемы Epic из поста 19.10. Поля и выходы с них:
   Round 2 — прошедшие Round 1 (4000 EU, 2000 NAC, 1000 остальные) + топ-1000 PR, дальше 500;
   Round 3 — 500, дальше 80; два хита по 40, из каждого 8 побед + 7 по очкам, 16–25-е в LCQ Final;
   LCQ Round 1 — все, кто играл квал, дальше 20; LCQ Final — 40, пять игр, 5 побед + 5 по очкам;
   финал — 40, десять игр. Очки — как в последних соло-турнирах Reload у Epic (его слово 20.10, «сделай поинт систему
   как в последних турнирах соло релоада»): Solo Reload Victory Cup S41/S42, правило ScoringRules ccCupScoreOf —
   60 за победу … 1 за 30-е, 2 за элим, не больше 10 элимов за матч; квалы — 10 матчей, как Round 1 этих капов. Призовые — его таблица «FNCS Solos Reload Finals Prize Pool» (Notion «19.10», скрин 35):
   NAW и BR здесь снова делят таблицу, ASIA/ME/OCE — одну на троих. */
const CC_SOLO_RELOAD_R2_FIELD={EU:5000, NAC:3000};
// Очки Solo Reload Victory Cup (S42, иначе S41) — место и элим; без данных — таблица Victory Cup.
function soloReloadScore(){ return ccCupScoreOf('S42_ReloadReloadSoloVictoryCup', 1) || ccCupScoreOf('S41_ReloadReloadSoloVictoryCup', 1); }
function soloReloadPoints(place){ const sc=soloReloadScore(); return sc ? sc.pts(place) : victoryR1Points(place); }
const CC_SOLO_RELOAD_KILL_CAP=10;
/* Лобби Reload по 40 (CC_RELOAD_PLAYERS): отборы R2/R3 играются полем 120, три лобби, перемешанные каждую игру.
   Было поле 100 одной комнатой (игрок: «у меня 100 человек релоуд фнкс»). Доля прохода та же, что у Epic. */
const CC_SOLO_RELOAD_ROOM=120;
function soloReloadR2Cut(){ return Math.round(CC_SOLO_RELOAD_ROOM*500/(CC_SOLO_RELOAD_R2_FIELD[ccCareerRegion()]||2000)); }
const CC_SOLO_RELOAD_PRIZES={
  EU:  [[1,60000],[2,40000],[3,25000],[4,15000],[5,12500],[6,10000],[7,9000],
        [8,8000],[9,6000],[10,5000],[11,4000],[12,3000],[13,2500],[14,2000],
        [15,1500],[20,1250],[25,1000],[40,750]],
  NAC: [[1,50000],[2,30000],[3,20000],[4,10000],[5,8000],[6,6000],[7,5000],
        [8,4000],[9,3000],[10,2500],[11,2000],[12,1750],[13,1500],[14,1250],
        [15,1000],[20,750],[25,500],[40,400]],
  NAW: [[1,15000],[2,10000],[3,7500],[4,5000],[5,4000],[6,3000],[7,2000],
        [8,1500],[9,1000],[10,750],[20,500],[40,300]],
  ASIA:[[1,7000],[2,4000],[3,3000],[4,2000],[5,1500],[6,1250],[7,1000],
        [8,750],[9,500],[10,400],[20,300],[40,200]]
};
CC_SOLO_RELOAD_PRIZES.BR=CC_SOLO_RELOAD_PRIZES.NAW;
CC_SOLO_RELOAD_PRIZES.ME=CC_SOLO_RELOAD_PRIZES.ASIA;
CC_SOLO_RELOAD_PRIZES.OCE=CC_SOLO_RELOAD_PRIZES.ASIA;
function soloReloadPrize(place){
  const t=CC_SOLO_RELOAD_PRIZES[ccCareerRegion()]||CC_SOLO_RELOAD_PRIZES.EU;
  const row=t.find(r=>place<=r[0]);
  return row ? row[1] : 0;
}
Object.assign(CC_SOLOS_STAGES, {
  rlr2:  {games:10, kill:2, field:CC_SOLO_RELOAD_ROOM, cut:soloReloadR2Cut, pass:'rlr3', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rlr3:  {games:10, kill:2, field:CC_SOLO_RELOAD_ROOM, cut:Math.round(CC_SOLO_RELOAD_ROOM*80/500), pass:'rlheats', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rlheats:{games:8,  kill:2, field:40,  cut:7,  vr:true, pass:'rlfinal', tail:[16,25], tailSeat:'rllcqf', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rllcq1:{games:10, kill:2, open:true, cut:20, pass:'rllcqf', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rllcqf:{games:5,  kill:2, field:40,  cut:5,  vr:true, pass:'rlfinal', reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP},
  rlfinal:{games:10, kill:2, field:40, cut:0,  prize:soloReloadPrize, reload:true, pts:soloReloadPoints, killCap:CC_SOLO_RELOAD_KILL_CAP}
});
// Отсечка стадии — число или функция региона (см. solosR2Cut).
function ccSolosCut(spec){ return typeof spec.cut==='function' ? spec.cut() : spec.cut; }
/* Куда садится игрок после вечера — по правилам Epic, а не по одной отсечке.

   В хитах и в LCQ Final победа в матче уводит наверх немедленно, и Epic
   считает свои 29 (17) мест СРЕДИ ТЕХ, КТО ПОБЕДЫ НЕ ВЗЯЛ. Отсюда и его
   «36-50 в LCQ Final»: шесть победителей плюс двадцать девять — это первые
   тридцать пять строк таблицы. Считать 29 прямо по таблице значило бы отдать
   места 30-35 никуда, а это живые люди, прошедшие по правилам. */
function ccSolosSeat(spec, t, ranked){
  if(spec.prize) return null;
  const rank=ranked.indexOf(t)+1, cut=ccSolosCut(spec);
  if(spec.vr){
    if((t.wins||0)>0) return spec.pass;
    const clean=ranked.filter(x=>!((x.wins||0)>0));
    if(clean.indexOf(t)+1<=cut) return spec.pass;
  } else if(rank<=cut) return spec.pass;
  if(spec.rest) return spec.rest;
  /* Хвост в LCQ Final — «следующие 15, кто не взял победы» (правила Epic, сверка 29.10). Считался по сырой таблице, где
     победители (60 очков, игры кончились) стоят вперемешку, и окно 36-50 съезжало: места сразу за 29-м не садились никуда. */
  if(spec.tail && spec.vr){
    const n=spec.tail[1]-spec.tail[0]+1, cr0=ranked.filter(x=>!((x.wins||0)>0)).indexOf(t)+1;
    if(cr0>cut && cr0<=cut+n) return spec.tailSeat;
  } else if(spec.tail && rank>=spec.tail[0] && rank<=spec.tail[1]) return spec.tailSeat;
  return null;
}
/* FNCS Solo Reload — свой турнир и своё состояние (cr.solosRl): иначе октябрьский финал Solos
   (got:'final') закрывал бы ноябрьский квал. Ключ — по стадии. */
function ccSolosKey(stage){ return /^rl/.test(String(stage||'')) ? 'solosRl' : 'solos'; }
function ccSolosOf(card, stage){
  const cr=CAREER && CAREER.career, k=ccSolosKey(stage);
  if(!cr || !card) return null;
  if(!ccMpTeam()) return cr[k]||null;
  return (cr[k+'By']||{})[hKey(card)]||null;
}
function ccSolosSet(card, v, stage){
  const cr=CAREER && CAREER.career, k=ccSolosKey(stage);
  if(!cr || !card) return;
  if(!ccMpTeam()){ cr[k]=v; return; }
  cr[k+'By']=cr[k+'By']||{};
  cr[k+'By'][hKey(card)]=v;
}
/* Кто сегодня допущен. Первый круг открыт всем; второй — только тем, у кого
   места ещё нет, и это и есть «второй шанс» правил. Дальше вечер играется
   тем, кто на него сел, и ровно один раз. */
/* Хит — свой (s.heat: 1 — 17.10, 2 — 18.10). Старый сейв без номера играет любой из двух, второй закроет got. */
function ccSolosHeatOk(id, s){
  if(!s || !s.heat || !/^FNCSSolos_Heats2?$/.test(String(id||''))) return true;
  return s.heat===(id==='FNCSSolos_Heats2' ? 2 : 1);
}
function careerSolosCanFor(stage, s, id){
  const seat=s ? s.seat : null, got=s ? s.got : null;
  if(got===stage) return false;
  if(id && !ccSolosHeatOk(id, s)) return false;
  if(/^sc\d+r1$/.test(stage)) return true;   // Solo Cash Cup: каждый кап открыт заново (got уже проверен выше)
  /* Round 1 — первый вечер квала: квал 1 — тому, кто ещё не играл; квал 2 — всем без места (вылетевший из квала 1
     начинает квал 2 с Round 1, как у Epic). Round 2 — прошедшим Round 1 или топ-2000 PR, пропустившим его. */
  if(stage==='q1r1') return !got;
  if(stage==='q2r1') return !seat && got!=='q2r1';
  if(stage==='q1r2') return seat==='q1r2' || (!got && ccSolosPrSkip());
  if(stage==='q2r2') return seat==='q2r2' || (!seat && got!=='q2r1' && ccSolosPrSkip());
  if(stage==='rlr2') return !got;
  /* Последний шанс — для тех, кто уже играл квал и остался без места. Это и
     есть правило Epic: в LCQ Round 1 садится тот, кто отыграл Round 1 и не
     прошёл ни в LCQ Final, ни в финал. Сюда же попадает вылетевший из хита
     хуже пятидесятого — у него места нет, и дорога у него ровно эта. */
  if(stage==='lcq1' || stage==='rllcq1') return !!got && !seat;
  return seat===stage;
}
const CC_SOLO_ORDER=['qual','heats','final'];
/* Какая стадия FNCS Solos у этого id. Карта, а не регулярка: id теперь девять,
   и читать их по одному месту дешевле, чем чинить выражение при каждом новом. */
/* Solo Cash Cup 2025-го — шестнадцать независимых капов на той же машине,
   что FNCS Solos: sc<n>r1 — открытый раунд (десять игр, топ-600 дальше),
   sc<n>r2 — раунд на 600 (десять игр, деньги). Таблица — с Tracker. */
const CC_SOLO_CASH_PAY=[[1,8000],[2,4800],[3,3200],[4,2240],[5,1760],[10,1280],[15,640],[20,320],[25,160]];
// По регионам (Tracker 20.10, S33_SoloCashCup_Event<n>Round2_<рег>); Европа — прежняя таблица выше.
const CC_SOLO_CASH_PAYR={EU:CC_SOLO_CASH_PAY,
  NAC: [[1,5000],[2,3000],[3,2000],[4,1400],[5,1100],[10,800],[15,400],[20,200],[25,100]],
  NAW: [[1,3000],[2,1800],[3,1200],[4,1020],[5,780],[10,480],[15,240],[20,120]],
  ASIA:[[1,2400],[2,1200],[3,800],[4,680],[5,520],[10,320],[15,160]]};
CC_SOLO_CASH_PAYR.BR=CC_SOLO_CASH_PAYR.NAW; CC_SOLO_CASH_PAYR.ME=CC_SOLO_CASH_PAYR.ASIA; CC_SOLO_CASH_PAYR.OCE=CC_SOLO_CASH_PAYR.ASIA;
function soloCashPrize(place){ return ccPay24(CC_SOLO_CASH_PAYR, place); }
for(let n=1; n<=16; n++){
  CC_SOLOS_STAGES['sc'+n+'r1']={games:10, kill:2, open:true, cut:600, pass:'sc'+n+'r2'};
  CC_SOLOS_STAGES['sc'+n+'r2']={games:10, kill:3, field:600, cut:0, prize:soloCashPrize};
}
const CC_SOLOS_BY_ID={
  FNCSSolos_Q1Round1:'q1r1', FNCSSolos_Q2Round1:'q2r1',
  FNCSSolos_Q1Round2:'q1r2', FNCSSolos_Q1Round3:'q1r3', FNCSSolos_FastTrack:'fast',
  FNCSSolos_Q2Round2:'q2r2', FNCSSolos_Q2Round3:'q2r3', FNCSSolos_Heats:'heats', FNCSSolos_Heats2:'heats',
  FNCSSolos_LCQRound1:'lcq1', FNCSSolos_LCQFinal:'lcqf', FNCSSolos_Final:'final',
  FNCSSoloReload_Round2:'rlr2', FNCSSoloReload_Round3:'rlr3', FNCSSoloReload_Heats:'rlheats',
  FNCSSoloReload_LCQRound1:'rllcq1', FNCSSoloReload_LCQFinal:'rllcqf', FNCSSoloReload_Final:'rlfinal'
};
for(let n=1; n<=16; n++){ CC_SOLOS_BY_ID['SoloCash'+n+'_R1']='sc'+n+'r1'; CC_SOLOS_BY_ID['SoloCash'+n+'_R2']='sc'+n+'r2'; }
function careerSoloSeriesOn(iso){
  const all=(careerYearDays().get(iso)||[]).filter(x=>x.kind==='solo');
  if(!all.length) return null;
  /* 10 октября у Epic два соло-вечера сразу: Fast Track и второй раунд второго
     круга квала. Для одного игрока они взаимоисключающие — в Fast Track сидит
     тот, кто уже прошёл, а во второй круг пускают только без места, — поэтому
     день отдаёт ТОТ, на который этот игрок допущен, а не первый по списку.
     Иначе прошедший в Fast Track видел бы на своей плитке чужой квал. */
  const me=(typeof careerCard==='function') ? careerCard() : null;
  const mine=function(e){
    const st=CC_SOLOS_BY_ID[String(e.id||'')];
    if(!st) return true;
    return careerSolosCanFor(st, ccSolosOf(me, st), e.id);
  };
  const e=all.find(mine) || all[0];
  /* Два соло-турнира в году, и оба ходят через этот раннер. Различает их
     префикс id, а не дата: у января свои три стадии и своё состояние
     (cr.solo), у FNCS Solos — свои девять и cr.solos. */
  const solos=CC_SOLOS_BY_ID[String(e.id||'')];
  if(solos){
    return {series:'solos', stage:solos, spec:CC_SOLOS_STAGES[solos],
            id:e.id, label:e.label, day:iso};
  }
  const m=String(e.id||'').match(/^SoloSeries_(Qualifier|Heats|Final)$/);
  if(!m) return null;
  return {series:'solo', stage:{Qualifier:'qual', Heats:'heats', Final:'final'}[m[1]],
          id:e.id, label:e.label, day:iso};
}
// The qualifier is open to everybody — that is the event's whole point; the
// Heats are for who came through it, the Final for who came through them.
// A stage is played once, the rule every other runner already lives by.
/* Проход по Solo Series — ЛИЧНЫЙ.

   В одиночной карьере он лежит в cr.solo. В команде их два — по одному на
   игрока, под ником, в cr.soloBy (ключ команды: оба видят оба). Раннер пишет
   обе строки с обеих сторон, из одной и той же таблицы, поэтому состояние у
   двоих одно. Читается по КОМАНДЕ, а не по локстепу (ccMpTeam, не ccMpOn):
   вечер «один играет» тоже должен писать в свою строку. */
function ccSoloOf(card){
  const cr=CAREER && CAREER.career;
  if(!cr || !card) return null;
  if(!ccMpTeam()) return cr.solo||null;
  return (cr.soloBy||{})[hKey(card)]||null;
}
function ccSoloSet(card, v){
  const cr=CAREER && CAREER.career;
  if(!cr || !card) return;
  if(!ccMpTeam()){ cr.solo=v; return; }
  cr.soloBy=cr.soloBy||{};
  cr.soloBy[hKey(card)]=v;
}
function careerSoloSeriesCan(ev){
  return careerSoloSeriesCanFor(ev, ccSoloStateOf(ev, careerCard()));
}
/* Состояние — по турниру, а не по кнопке: январская Solo Series живёт в
   cr.solo, FNCS Solos — в cr.solos. Через эту пару ходят все, кто спрашивает
   «допущен ли», включая вопросы про напарника. */
function ccSoloStateOf(ev, card){
  if(!card) return null;
  return (ev && ev.series==='solos') ? ccSolosOf(card, ev.stage) : ccSoloOf(card);
}
function ccSoloStateSet(ev, card, v){
  if(ev && ev.series==='solos') ccSolosSet(card, v, ev.stage); else ccSoloSet(card, v);
}
/* ПРОШЕДШИЕ ИЗ ТВОЕЙ СОТНИ ЕДУТ ДАЛЬШЕ ВМЕСТЕ С ТОБОЙ (Notion 25.10: «FNCS Solo… only one player can make it
   to the finals/heat/fast track»). Каждый этап собирал комнату заново из сцены, и из сотни, где ты прошёл,
   дальше оказывался один ты: те, кто был выше тебя, в хитах и финале пропадали. Теперь вечер пишет, кто куда
   сел (cr.soloCarry: турнир, сезон, этап → строки), и следующий этап сажает их первыми, добирая сцену. Как у
   Мейджора majorSeed.through. */
function ccSoloCarryTour(ev){ return ev && ev.series==='solos' ? ccSolosKey(ev.stage) : 'solo'; }
function ccSoloCarryPut(ev, seats){
  const cr=CAREER.career, tour=ccSoloCarryTour(ev);
  if(!cr.soloCarry || cr.soloCarry.tour!==tour || cr.soloCarry.season!==cr.season) cr.soloCarry={tour:tour, season:cr.season, by:{}};
  seats.forEach(function(p){
    const at=p[0], row=ccStageSeatRow(p[1]);
    if(!at || !row.length) return;
    const list=cr.soloCarry.by[at]=cr.soloCarry.by[at]||[];
    if(!list.some(r=>hKey(r[0].h)===hKey(row[0].h))) list.push(row);
  });
}
function ccSoloCarryTake(ev, skip, size){
  const cr=CAREER.career, c=cr.soloCarry;
  if(!c || c.tour!==ccSoloCarryTour(ev) || c.season!==cr.season) return [];
  const no=new Set(skip.map(hKey)), out=[];
  (c.by[ev.stage]||[]).forEach(function(row){
    if(out.length>=size || no.has(hKey(row[0].h))) return;
    no.add(hKey(row[0].h));
    out.push(ccStageTeamFrom(row));
  });
  return out;
}
function careerSoloSeriesCanFor(ev, s){
  if(!ev) return false;
  if(ev.series==='solos') return careerSolosCanFor(ev.stage, s, ev.id);
  const done=s ? s.got : null;
  /* Квал — в несколько сессий, идёт лучшая (см. CAREER_YEAR): играется, пока
     не прошёл, и не дважды в один день. Сейв без дня (до 30 августа) — одна
     сыгранная сессия, остальные ему открыты. */
  if(ev.stage==='qual'){
    if(done && CC_SOLO_ORDER.indexOf(done)>CC_SOLO_ORDER.indexOf('qual')) return false;
    if(s && s.pass==='qual') return false;
    if(s && s.got==='qual' && s.day===ev.day) return false;
    return true;
  }
  if(done && CC_SOLO_ORDER.indexOf(done)>=CC_SOLO_ORDER.indexOf(ev.stage)) return false;
  if(ev.stage==='heats') return !!(s && s.pass==='qual');
  if(ev.stage==='final') return !!(s && s.pass==='heats');
  return false;
}

/* Pro-Am Creator Series, Даллас 12 июля 2026 (первая остановка, в июне её нет, см. CAREER_YEAR).
   От Epic: 7 игр, 20 дуо в одном лобби, Reload, очки CC_PROAM_PLACE и 3 за элиминацию, призовые CC_PROAM_PRIZE плюс
   бонус за игру CC_PROAM_GAME. Напарник креатор из опубликованного состава Далласа.
   Наше: рейтинг креатора CC_PROAM_CREATOR_OVR, один на всех и заметно ниже про. Креаторы отличаются аудиторией
   (ccProAmReachFrom), а не силой. Приглашение по известности (careerProAmCan), квалификацию Epic не публикует. */
const CC_PROAM_GAMES=7, CC_PROAM_TEAMS=20, CC_PROAM_KILL=3;
const CC_PROAM_PLACE=[60,50,45,40,35,30,27,24,21,18,15,12,9,6,3];
const CC_PROAM_PRIZE=[10000,7000,4500,3000,2200,1800,1400,1200,1000,900,
                      900,800,700,600,500,450,400,350,200,200];
const CC_PROAM_GAME=[1000,500,200];
/* ВТОРАЯ ОСТАНОВКА — САН-ПАУЛУ, 6 сентября 2026 (Pro-Am Creator Series, Team Liquid, Alienware
   Training Facility). Отзыв: «добавляй, ток в ЗБ» — играется в Zero Build (CC_ZB).
   Что опубликовано (Liquipedia): 20 пар, $50 000, шесть игр — в жизни 1–3 Zero Build и 4–6 Build,
   здесь все шесть без строек, решение; призовые только за 1–5: 12 000 / 8 000 / 5 800 /
   4 500 / 3 500. Таблица очков НЕ опубликована — взята далласская; места 6–20 не опубликованы —
   остаток $16 200 разложен по убыванию; бонусов за игру нет (фонд закрывается таблицей).
   Обе остановки — по одному приглашению каждая (careerProAmInv по ярлыку). */
const CC_PROAM_EVENTS={
  ProAm_Dallas:  {day:'2026-07-12', city:'Dal', games:CC_PROAM_GAMES, place:CC_PROAM_PLACE, prize:CC_PROAM_PRIZE, game:CC_PROAM_GAME, zb:false},
  ProAm_SaoPaulo:{day:'2026-09-06', city:'Sao', games:6, place:CC_PROAM_PLACE,
                  prize:[12000,8000,5800,4500,3500,2700,2000,1700,1500,1300,1100,1000,900,800,700,600,550,500,450,400],
                  game:[0,0,0], zb:true},
  // Третья и четвёртая остановки — наши (см. CAREER_YEAR): формат и кошелёк Сан-Паулу, стройки Далласа.
  ProAm_Paris:   {day:'2026-09-20', city:'Par', games:6, place:CC_PROAM_PLACE,
                  prize:[12000,8000,5800,4500,3500,2700,2000,1700,1500,1300,1100,1000,900,800,700,600,550,500,450,400],
                  game:[0,0,0], zb:false},
  ProAm_Seoul:   {day:'2026-10-25', city:'Seo', games:6, place:CC_PROAM_PLACE,
                  prize:[12000,8000,5800,4500,3500,2700,2000,1700,1500,1300,1100,1000,900,800,700,600,550,500,450,400],
                  game:[0,0,0], zb:false}
};
function ccProAmEvent(label){ return CC_PROAM_EVENTS[label] || CC_PROAM_EVENTS.ProAm_Dallas; }
function ccProAmKey(ev){ return (ev && (ev.id||ev.label)) || 'ProAm_Dallas'; }   // id — ярлык CAREER_YEAR, label — имя на языке
// Ярлык события у ветки инбокса: старые сейвы держат proam:true — это Даллас.
function ccProAmThreadLabel(t){ return !t || !t.proam ? null : (t.proam===true ? 'ProAm_Dallas' : String(t.proam)); }
// Съездил ли уже на ЭТОТ Про-Ам в этом сезоне (старый ключ cr.proam[season] — Даллас).
function ccProAmDone(label){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  const p=cr.proam||{};
  return !!(p[cr.season+'|'+label] || (label==='ProAm_Dallas' && p[cr.season]));
}
/* ZERO BUILD — ночь без строек: ресы не тратятся и не спрашиваются (фарм, рефреш, стиль стройки,
   штраф концовки), высокой земли и рефреша нет в ходах конца, комната ими не ходит, край ближнего
   боя (closeEdge — постройки) не считается. Сила карточек остаётся как есть: отдельного рейтинга
   под ZB у Epic нет, это допущение. Ставит runCareerProAm по CC_PROAM_EVENTS.zb. */
let CC_ZB=false;
function ccLateMovesNow(){ return CC_ZB ? CC_LATE_MOVES.filter(m=>m.id!=='hg' && !m.mats) : CC_LATE_MOVES; }
// Кого зовут: сцена смотрит на охват, а не на дивизион — это шоу.
const CC_PROAM_REACH=25000;
/* Креаторы Далласа — опубликованный состав, все двадцать. Их ровно столько,
   сколько пар в лобби: **половина игроков турнира — контент-мейкеры**, отзыв со ссылкой на страницу события. Поэтому и у соперников в
   паре стоит креатор, а не второй про (см. ccProAmField). */
const CC_PROAM_CREATORS_NAC=['StableRonaldo','Faxuty','Lacy','Jynxzi','Rawdogmoon','Zemie',
  'Ash Alk','Braeden','Hamyp','Typical Gamer','Sommerset','Fraanticc','Arky','Crackly',
  'a2guapo','Yugi','Yusef','mooda','primatepaige','ilyynina'];
/* Бразилия — состав Сан-Паулу (6 сентября, Team Liquid), тоже опубликованный
   целиком. Числа того турнира Epic ещё не назвал, а имена назвал. */
const CC_PROAM_CREATORS_BR=['Flakes Power','Robleis','Patriota','Babi','Carrera','Daryki',
  'Dengoso','FRTTT','Isafaracco','Kamikaze','Letiltz','OLui','Mantovani','miw','Nanoide',
  'ThiagoIUTU','Vascurado','zEkO','Derponce','Melany',
  'Gorilon'];  // аргентинец (Liquipedia), играет BR-регион, ведёт испанские FNCS-эфиры
/* ЕВРОПА. Своей остановки Про-Ама у Европы нет — Epic объявил только Даллас и
   Сан-Паулу, — поэтому европейское поле СОБРАНО, а не скопировано. Собрано из
   настоящих полей, а не из головы:
   — FNCS Pro-Am 2025 (сторона креаторов): Ali-A, Reddysh, Jacob4TV;
   — Twitch Rivals Creator Series: EMEA Kick-off — единственное большое
     европейское поле креаторов Fortnite, что вообще существует: TheGrefg,
     Ibai, IlloJuan, knekro, Vicens, ZormanWorld, Carola, Jolavanille, Setty,
     Ewron, Kubx, Zrool, Piz, Dhalucard, ShivFPS, Tubbo;
   — категория Content Creators Liquipedia, живые и европейские: Mawkzy,
     Stizo, ZetFar, Amar.
   Ушедших со сцены (Liquipedia status=Retired: Rubius, POW3R, Gotaga,
   Kinstaar, LOLiTO, Trymacs, HandOfBlood, Vikkstar123, elokratz) не
   зову — турнир играется сегодня. И тем более никого из умерших.
   Nikof Retired только как игрок: он кастит FNCS, поэтому стоит в поле,
   как Evelone. Рядом те, кто ведёт FNCS-эфиры на своих каналах: Wazz,
   Amar, Katoo, qlnek (польские вотчпати). */
/* CoachBoop — правка, поимённо. Он не из полей выше, и это
   правильно: в описании канала «Ex-Analyst for the FNCS Broadcast. Coach who
   watches all of the top level Fortnite in Europe» — то есть человек сцены,
   который её комментирует и тренирует, с 252 тысячами фолловеров. Ровно тот
   вид гостя, ради которого Про-Ам и существует. AussieAntics, второй из его
   списка, в моде уже стоял — он в океанийской корзине ниже.

   Setty отсюда УБРАН — отзыв: «Setty тоже это про игрок». Он
   пришёл из поля Twitch Rivals, но играет он как ПРО (он и в ростере сцены
   стоит — Japko & panzer & Setty), а сторона креаторов в Про-Аме — это
   вторая половина пары, не про. */
const CC_PROAM_CREATORS_EU=['Ali-A','Reddysh','Jacob4TV','TheGrefg','Ibai','IlloJuan',
  'knekro','Vicens','ZormanWorld','Carola','Jolavanille','Ewron','Kubx','Zrool',
  'Piz','Dhalucard','ShivFPS','Tubbo','Mawkzy','CoachBoop',
  'Nikof','Wazz','Amar','Katoo','qlnek'];
/* СНГ: у Epic отдельного региона нет (русскоязычные играют EU, 172 россиянина в ростере), поэтому это не регион
   карьеры, а корзина креаторов в общем пуле сразу за европейской.
   twitch.tv/mirwana, twitch.tv/at0m (displayName MIRWANA, At0m) и Evelone с Liquipedia (Retired как игрок, но стримит).
   Kiryache32 и Siberiajkee убраны намеренно, список задан вручную.
   В Content Creators на Liquipedia из СНГ нет никого. «Битву блогеров» 2019 (WayCats, Kek the King, Morphia, Типси,
   Форит) не берём: неизвестно, играют ли они Fortnite сейчас. */
const CC_PROAM_CREATORS_CIS=['MIRWANA','At0m','Evelone'];
/* Азия, Океания и Ближний Восток — одной корзиной: у каждого из трёх регионов
   креаторов на полкоманды, а вместе выходит настоящая часть мира. Все имена с
   Liquipedia, из категории Content Creators, и у всех в статусе Active:
   — Япония: Neckokun, Hamuppi, Nephrite, Shinck;
   — Океания: AussieAntics, Chanzes, LazarBeam, Loserfruit, Overstrand, Winter,
     Worthy (ушедшие — Muselk, McCreamy, Jacque — не зову);
   — Ближний Восток: Boter, IMonkey D, Rudex, все трое из Саудовской Аравии.
   Турции здесь нет: единственный кандидат (Rohat) по инфобоксу немец, то есть
   он европеец, а не ближневосточный креатор. */
const CC_PROAM_CREATORS_ASIA=['Neckokun','Hamuppi','Nephrite','Shinck',
  'AussieAntics','Chanzes','LazarBeam','Loserfruit','Overstrand','Winter','Worthy',
  'Boter','IMonkey D','Rudex'];
const CC_PROAM_CREATORS_BY_REGION={EU:CC_PROAM_CREATORS_EU, NAC:CC_PROAM_CREATORS_NAC,
  NAW:CC_PROAM_CREATORS_NAC, BR:CC_PROAM_CREATORS_BR, CIS:CC_PROAM_CREATORS_CIS,
  ASIA:CC_PROAM_CREATORS_ASIA, OCE:CC_PROAM_CREATORS_ASIA, ME:CC_PROAM_CREATORS_ASIA};
/* Кого зовут в Про-Ам — СО ВСЕХ РЕГИОНОВ, правка: «я бы со всех
   регионов добавил и ещё СНГ». Так это и устроено у Epic: Про-Ам не турнир
   региона, а показательный вечер, и в Даллас летели не только американцы.

   Пул общий, но свои впереди: сначала креаторы региона карьеры — их зовут в
   первую очередь и они узнаваемы, — потом весь остальной мир в порядке
   регионов. Двадцать команд разбирают начало списка, поэтому «свои впереди»
   значит, что европейская карьера играет с европейцами и добирает мир, а не
   наоборот. Повторов нет: имя встречается в пуле один раз. */
const CC_PROAM_REGION_ORDER=['EU','CIS','NAC','BR','ASIA'];
function ccProAmCreators(){
  const r=(typeof ccCareerRegion==='function') ? ccCareerRegion() : 'EU';
  const mine=CC_PROAM_CREATORS_BY_REGION[r] || [];
  const out=[], seen=new Set();
  const add=list=>(list||[]).forEach(n=>{ const k=hKey(n); if(k && !seen.has(k)){ seen.add(k); out.push(n); } });
  add(mine);
  CC_PROAM_REGION_ORDER.forEach(reg=>add(CC_PROAM_CREATORS_BY_REGION[reg]));
  return out;
}
// Старое имя оставлено: на него смотрят сторожа и старые сейвы.
const CC_PROAM_CREATORS=CC_PROAM_CREATORS_NAC;
/* Рейтинг контент-мейкера — 67, его число (4 сентября). Epic рейтингов не
   публикует, так что это назначенная величина, а не измеренная: креатор играет
   заметно ниже про, но не как случайный человек с улицы. Одна на всех, без
   разброса — так его и просили. */
/* Twitch креаторов: ник и фолловеры из публичного GraphQL Twitch
   (user(login){displayName followers{totalCount}}), снято в сентябре 2026, переснимается так же.
   Логин угадывается по имени и у коротких попадает в тёзку, поэтому канал опознан поиском Twitch
   по описанию, языку и последнему эфиру; опознанный стоит с любым числом (Mantovani 1822),
   порог 5000 только там, где опознать нечем.
   Без Twitch: Mawkzy, Hamyp, Kamikaze, miw (нашлись только тёзки), Daryki, ThiagoIUTU, IMonkey D
   (каналы мёртвые с 2020/2020/2024, в «сейчас в эфире» им не место). */
const CC_PROAM_TWITCH={
  'Ali-A':['alia',291509], 'Reddysh':['reddysh',117551], 'Jacob4TV':['jacob4tv',541777],
  'TheGrefg':['thegrefg',12292135], 'Ibai':['ibai',20328384], 'IlloJuan':['illojuan',4651204],
  'knekro':['knekro',1292810], 'Vicens':['vicens',1984327], 'ZormanWorld':['zormanworld',631962],
  'Carola':['carola',1876129], 'Jolavanille':['jolavanille',808728], 'Kubx':['kubx',440558],
  'Zrool':['zrool',118874], 'Dhalucard':['dhalucard',573971], 'ShivFPS':['shivfps',1447970],
  'Tubbo':['tubbo',5238869], 'StableRonaldo':['stableronaldo',5248654], 'Faxuty':['faxuty',668155],
  'Lacy':['lacy',3388699], 'Jynxzi':['jynxzi',11251813], 'Rawdogmoon':['rawdogmoon',198440],
  'Zemie':['zemie',1230330], 'Ash Alk':['ashalk',171764], 'Braeden':['braeden',488266],
  'Typical Gamer':['typicalgamer',1126245], 'Sommerset':['sommerset',1968758], 'Fraanticc':['fraanticc',236880],
  'Arky':['arky',568617], 'Crackly':['crackly',82729], 'a2guapo':['a2guapo',264918],
  'Yugi':['yugi',453515], 'Yusef':['yusef',5467], 'mooda':['mooda',791619],
  'primatepaige':['primatepaige',113995], 'ilyynina':['ilyynina',30092], 'Flakes Power':['flakespower',72507],
  'Robleis':['robleis',5932515], 'Patriota':['patriota',1125171], 'Babi':['babi',1379011],
  'Dengoso':['dengoso',81009], 'FRTTT':['frttt',721823], 'Isafaracco':['isafaracco',26275],
  'Letiltz':['letiltz',67461], 'OLui':['olui',165695], 'Nanoide':['nanoide',80627],
  'Vascurado':['vascurado',75389], 'zEkO':['zeko',1160158], 'Derponce':['derponce',17651],
  'MIRWANA':['mirwana',330906], 'At0m':['at0m',107047],
  // СНГ. Evelone живёт на evelone192, а не на evelone: короткий канал — чужой,
  // с семью сотнями подписчиков. Тот же капкан, что с Daryki.
  // Снято 4 сентября 2026 тем же запросом, что и остальные.
  'CoachBoop':['coachboop',252203],
  'Nikof':['nikof',826377], 'Wazz':['wazz',395275], 'Amar':['amar',1876674],
  'Katoo':['katoo',690729], 'Gorilon':['gorilon',494897], 'qlnek':['qlnek',279051],
  'Evelone':['evelone192',2532787],
  // Азия, Океания, Ближний Восток. У японцев и саудовцев каналов на Twitch с
  // подтверждаемым размером не нашлось — они стоят в поле без числа.
  'Neckokun':['neckokun',22477], 'AussieAntics':['aussieantics',1642115],
  'Chanzes':['chanzes',638265], 'LazarBeam':['lazarbeam',405357],
  'Loserfruit':['loserfruit',3045429], 'Overstrand':['overstrand',117593],
  'Rudex':['rudex',155382],
  /* Добор 4 сентября, его «найди сам твичи». Угадывание логина по имени
     исчерпало себя (голое имя почти всегда занято сквоттером с нулём), поэтому
     каналы искались ПОИСКОМ Twitch — searchFor(userQuery, target:{index:CHANNEL}),
     тот же публичный GraphQL, — а найденное сверялось по описанию канала,
     языку и последнему эфиру: у Setty в описании FNCS, у Piz итальянский и
     «mi chiamo Riccardo», у Melany португальский, у Winter и Worthy орг PWR,
     у Nephrite и Shinck японский с фортнайтом в тексте. Числа снимались тем же
     днём. */
  'Ewron':['ewroon',1102932], 'Piz':['pizfn',832871],
  'Carrera':['carreraaa',4962088], 'Melany':['melanylolee',55765],
  'Mantovani':['mantovani',1822],
  'Winter':['winter1k',36826], 'Worthy':['worthyy',196739], 'Boter':['not_boter',95220],
  'Nephrite':['nephrite_2',14332], 'Shinck':['shincky',5615], 'Hamuppi':['dfm_hamuppi',4310]
};
/* Без подтверждённого канала креатора нет нигде (28.10, его «пусть и соперниками они не могут быть»): ни в выборе, ни
   напарником или соперником на Про-Аме. Списки чистятся на месте — на них же смотрят CC_PROAM_CREATORS и сторожа. */
[CC_PROAM_CREATORS_EU, CC_PROAM_CREATORS_NAC, CC_PROAM_CREATORS_BR, CC_PROAM_CREATORS_CIS, CC_PROAM_CREATORS_ASIA].forEach(list=>{
  for(let i=list.length-1;i>=0;i--) if(!(CC_PROAM_TWITCH[list[i]] && CC_PROAM_TWITCH[list[i]][1]>0)) list.splice(i, 1);
});
Object.keys(CC_CREATOR_HOME_APAC).forEach(r=>{ CC_CREATOR_HOME_APAC[r]=CC_CREATOR_HOME_APAC[r].filter(n=>CC_PROAM_TWITCH[n]); });
function ccProAmTwitch(name){ return CC_PROAM_TWITCH[name] || null; }
function ccProAmFollowers(name){ const t=ccProAmTwitch(name); return t ? t[1] : 0; }
/* Аватарки креаторов: на витрине каналов, на карточке карьеры за креатора и в лобби Про-Ама. Из Twitch GraphQL
   (profileImageURL), лежат файлами в photos/creators/ (150×150), а не ссылками на CDN: не зависеть от чужого
   домена и не ходить на Twitch при каждом открытии.
   Пересобрать: `node tools/fetch-creator-avatars.js` (он же печатает таблицу). Дефолтную картинку Twitch
   (user-default-pictures) не качаем; без Twitch или картинки рисуем инициалы. */
const CC_PROAM_AVA_DIR='photos/creators/';
const CC_PROAM_AVA={
  'Ali-A':'alia.png', 'Reddysh':'reddysh.jpeg', 'Jacob4TV':'jacob4tv.png',
  'TheGrefg':'thegrefg.png', 'Ibai':'ibai.png', 'IlloJuan':'illojuan.png',
  'knekro':'knekro.jpeg', 'Vicens':'vicens.png', 'ZormanWorld':'zormanworld.png',
  'Carola':'carola.png', 'Jolavanille':'jolavanille.png', 'Kubx':'kubx.png',
  'Zrool':'zrool.png', 'Dhalucard':'dhalucard.png', 'ShivFPS':'shivfps.png',
  'Tubbo':'tubbo.png', 'StableRonaldo':'stableronaldo.png', 'Faxuty':'faxuty.png',
  'Lacy':'lacy.png', 'Jynxzi':'jynxzi.png', 'Rawdogmoon':'rawdogmoon.png',
  'Zemie':'zemie.png', 'Ash Alk':'ashalk.png', 'Braeden':'braeden.png',
  'Typical Gamer':'typicalgamer.png', 'Sommerset':'sommerset.png', 'Fraanticc':'fraanticc.png',
  'Arky':'arky.png', 'Crackly':'crackly.png', 'a2guapo':'a2guapo.png',
  'Yugi':'yugi.png', 'Yusef':'yusef.png', 'mooda':'mooda.png',
  'primatepaige':'primatepaige.png', 'ilyynina':'ilyynina.png', 'Flakes Power':'flakespower.png',
  'Robleis':'robleis.png', 'Patriota':'patriota.png', 'Babi':'babi.png',
  'Dengoso':'dengoso.png', 'FRTTT':'frttt.png', 'Isafaracco':'isafaracco.png',
  'Letiltz':'letiltz.png', 'OLui':'olui.png', 'Nanoide':'nanoide.png',
  'Vascurado':'vascurado.png', 'zEkO':'zeko.png', 'Derponce':'derponce.png',
  'MIRWANA':'mirwana.png', 'At0m':'at0m.png', 'CoachBoop':'coachboop.png',
  'Nikof':'nikof.png', 'Wazz':'wazz.png', 'Amar':'amar.png', 'Katoo':'katoo.png', 'Gorilon':'gorilon.png', 'qlnek':'qlnek.png',
  'Evelone':'evelone192.png', 'Neckokun':'neckokun.png',
  'AussieAntics':'aussieantics.png', 'Chanzes':'chanzes.png', 'LazarBeam':'lazarbeam.png',
  'Loserfruit':'loserfruit.png', 'Overstrand':'overstrand.png', 'Rudex':'rudex.png',
  'Ewron':'ewroon.png', 'Piz':'pizfn.png',
  'Carrera':'carreraaa.png', 'Melany':'melanylolee.png', 'Mantovani':'mantovani.png',
  'Winter':'winter1k.png', 'Worthy':'worthyy.png', 'Boter':'not_boter.png',
  'Nephrite':'nephrite_2.png', 'Shinck':'shincky.png', 'Hamuppi':'dfm_hamuppi.png'
};
function ccProAmAvatar(name){
  const f=CC_PROAM_AVA[name];
  return f ? CC_PROAM_AVA_DIR+f : null;
}
/* Сколько подписчиков приносит вечер рядом с ним. Аудитория креатора — не
   твоя, но часть её тебя видит: одна тысячная, и не больше потолка, чтобы
   вечер с Jynxzi не перекрыл год работы (для сравнения: победа на Глобалах
   даёт около 22 тысяч, см. careerReachResult). */
const CC_PROAM_REACH_SHARE=0.001, CC_PROAM_REACH_CAP=8000;
function ccProAmReachFrom(name){
  return Math.min(CC_PROAM_REACH_CAP, Math.round(ccProAmFollowers(name)*CC_PROAM_REACH_SHARE));
}
const CC_PROAM_CREATOR_OVR=67;
const CC_PROAM_CREATOR_LO=CC_PROAM_CREATOR_OVR, CC_PROAM_CREATOR_HI=CC_PROAM_CREATOR_OVR;
function ccProAmCreatorCard(name){
  const ovr=CC_PROAM_CREATOR_OVR;
  const tw=ccProAmTwitch(name);
  return {handle:name, nick:name, nat:null, region:ccCareerRegion(), tier:'ladder',
          rating:ovr, _ovr:ovr, _targetOvr:ovr, org:null, creator:true,
          // Лицо — с его же канала (см. CC_PROAM_AVA): в лобби Про-Ама половина
          // строк это креаторы, и без портретов комната читалась инициалами.
          _photo:ccProAmAvatar(name),
          // Твич человека и его аудитория — то, чем креатор в этой комнате и
          // отличается от про: рейтингом он ниже, а смотрят его больше.
          tw:tw?tw[0]:null, followers:tw?tw[1]:0};
}
/* Поле турнира: девятнадцать пар «про + креатор».
   Про берутся из настоящего ростера сцены, как в любом вечере; креаторы — из
   списка выше, каждый один раз. Свой креатор (ccProAmMate) из списка изымается,
   чтобы один человек не сидел в двух парах. */
function ccProAmField(cr, mine, mineCreator){
  const rnd=careerRng(ccHashStr('proamfield|'+ccCareerSeed()+'|'+(cr.season||1)));
  const taken=new Set(mine.map(hKey));
  /* Про берутся С ВЕРХА сцены, а не случайной явкой: на Про-Ам зовут громкие
     имена (у Epic в Далласе Clix, Bugha, Peterbot, Ritual), и это одно из
     немногих мест, где «двадцать лучших» — не догадка, а описание турнира. */
  const pros=careerRealPlayers(taken, rnd, cr.division===1 ? 1 : 'all')
    .filter(p=>p && !taken.has(hKey(p)))
    .sort((a,b)=>ccCardOvr(b)-ccCardOvr(a));
  const left=ccProAmCreators().filter(n=>hKey(n)!==hKey(mineCreator&&mineCreator.handle));
  const teams=[];
  for(let i=0; i<CC_PROAM_TEAMS-1; i++){
    const pro=pros[i];
    const creator=left[i % left.length];
    if(!pro || !creator) break;
    taken.add(hKey(pro));
    const squad=[pro, ccProAmCreatorCard(creator, rnd)];
    const t=careerTeam(squad, false, true);
    t.name=teamLabel(squad);
    teams.push(t);
  }
  return teams;
}
function proAmPoints(place){ return CC_PROAM_PLACE[place-1] || 0; }
function careerProAmOn(iso){
  const list=careerYearDays().get(iso||careerToday())||[];
  return list.find(e=>e.kind==='proam') || null;
}
/* ---- ПРИГЛАШЕНИЕ НА ПРО-АМ --------------------------------------------------

   Правка: «если игрока пригласят, ему отправят в личные
   сообщения, хочет ли он принять участие, и потом, если соглашается, может
   себе выбрать контент-мейкера».

   Так это и устроено в жизни: отбора на Про-Ам нет, есть приглашение — зовут
   Epic и клуб-хозяин площадки (в Далласе Dignitas), критериев никто не
   публикует. Поэтому известность открывает не сам турнир, а ПИСЬМО: за две
   недели до даты приходит ветка в инбоксе, и дальше это разговор — согласиться
   или отказаться, а согласившись, выбрать себе пару из тех, кто едет.

   Отказ — тоже ответ и держится до конца сезона: в следующем году позовут
   снова. */
const CC_PROAM_INVITE_DAYS=14;   // за сколько дней пишут
const CC_PROAM_PICK=6;           // сколько креаторов предлагают на выбор
function careerProAmInv(label){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  // Без ярлыка — сегодняшний Про-Ам, иначе ближайший впереди.
  if(!label){ const ev=careerProAmOn(careerToday()) || (function(){ const d=careerProAmNextDay(); return d ? careerProAmOn(d) : null; })(); label=ccProAmKey(ev); }
  const invs=cr.proamInvs||{};
  let inv=invs[label];
  if(!inv && label==='ProAm_Dallas' && cr.proamInv) inv=cr.proamInv;   // старый сейв: одно приглашение на сезон
  return (inv && inv.season===cr.season) ? inv : null;
}
// Ближайший Про-Ам сезона, если он ещё впереди.
function careerProAmNextDay(){
  let day=careerToday();
  for(let i=0;i<=CC_PROAM_INVITE_DAYS;i++){
    if(careerProAmOn(day)) return day;
    day=ccAddDays(day, 1);
  }
  return null;
}
function careerProAmInviteTick(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  if(careerReach()<CC_PROAM_REACH) return null;        // зовут по известности
  const day=careerProAmNextDay(); if(!day) return null;
  const ev=careerProAmOn(day), label=ccProAmKey(ev);
  if(careerProAmInv(label)) return null;               // на этот Про-Ам уже писали
  if(ccProAmDone(label)) return null;                  // и уже съездил
  cr.proamInvs=cr.proamInvs||{};
  cr.proamInvs[label]={season:cr.season, state:'sent', mate:null, day:day, label:label};
  const who={handle:CC_PROAM_HOST, org:true, proam:label, epic:true};
  // Своя ветка на каждую остановку: два письма в одной ветке путали бы кнопки.
  const t=careerDms().find(x=>ccProAmThreadLabel(x)===label) || careerDmThread(who);
  t.proam=label; t.who=who;
  careerDmPush(t, 'them', 'dmProAmInvite', [L()[ev.label]||ev.label, ccDayLabel(day)]);
  return t;
}
/* ПИШЕТ САМ FORTNITE, а не клуб-хозяин площадки: отзыв — «pro am пусть сам
   фортнайт пишет, и игрок может выбрать любого контент-мейкера». Ветка в инбоксе лежит среди
   клубов (org), с меткой «организатор» и ключ-артом FNCS вместо герба. */
const CC_PROAM_HOST='Fortnite';
// Кого предлагают в пару: свой регион первым, шестеро, и набор не меняется от
// перерисовки — приглашение одно, а не новый список на каждый заход.
/* ЛЮБОЙ КОНТЕНТ-МЕЙКЕР, а не шестеро по жребию — правка. Порядок: свой регион
   первым (так склеивает ccProAmCreators), внутри региона — по аудитории, потому что по ней и
   выбирают. Жребий шестерых (careerProAmPickListOld) оставлен только как память о правиле. */
function careerProAmPickList(){
  const all=ccProAmCreators();
  const regOf=n=>{ const k=hKey(n); return CC_PROAM_REGION_ORDER.find(r=>(CC_PROAM_CREATORS_BY_REGION[r]||[]).some(x=>hKey(x)===k))||''; };
  const mine=(typeof ccCareerRegion==='function') ? ccCareerRegion() : 'EU';
  const rank=r=>r===mine ? -1 : CC_PROAM_REGION_ORDER.indexOf(r);
  return all.slice().sort((a,b)=>{ const ra=rank(regOf(a)), rb=rank(regOf(b)); if(ra!==rb) return ra-rb; return ccProAmFollowers(b)-ccProAmFollowers(a); });
}
function careerProAmPickListOld(){
  const cr=CAREER.career;
  const rnd=careerRng(ccHashStr('proampick|'+ccCareerSeed()+'|'+(cr.season||1)));
  const list=ccProAmCreators().slice(0, 30);
  for(let i=list.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=list[i]; list[i]=list[j]; list[j]=t; }
  /* Жребий СНАЧАЛА, сортировка потом. Если сортировать весь список и брать
     шесть верхних, жребий пропадает: каждый сезон предлагали бы одну и ту же
     шестёрку самых крупных каналов мира. Едут разные — а показываем их по
     аудитории, потому что по ней и выбирают. */
  const six=list.slice(0, CC_PROAM_PICK);
  six.sort((a,b)=>ccProAmFollowers(b)-ccProAmFollowers(a));
  return six;
}
function careerProAmYes(id){
  const inv=careerProAmInv(ccProAmThreadLabel(careerDms().find(x=>x.id===id))); if(!inv || inv.state!=='sent') return false;
  inv.state='yes';
  const t=careerDms().find(x=>x.id===id); if(t){
    careerDmPush(t, 'me', 'dmProAmYes', []);
    careerDmPush(t, 'them', 'dmProAmPick', []);
  }
  careerSave(); careerRenderHub('social'); return true;
}
function careerProAmNo(id){
  const inv=careerProAmInv(ccProAmThreadLabel(careerDms().find(x=>x.id===id))); if(!inv || inv.state!=='sent') return false;
  inv.state='no';
  const t=careerDms().find(x=>x.id===id); if(t){
    careerDmPush(t, 'me', 'dmProAmNo', []);
    careerDmPush(t, 'them', 'dmProAmNoOk', []);
  }
  careerSave(); careerRenderHub('social'); return true;
}
function careerProAmPick(id, name){
  const inv=careerProAmInv(ccProAmThreadLabel(careerDms().find(x=>x.id===id))); if(!inv || inv.state!=='yes') return false;
  if(careerProAmPickList().indexOf(name)<0) return false;
  inv.mate=name;
  const t=careerDms().find(x=>x.id===id);
  if(t) careerDmPush(t, 'them', 'dmProAmMateOk', [name]);
  careerSave(); careerRenderHub('social'); return true;
}
function careerProAmCan(){
  const ev=careerProAmOn(careerToday());
  if(!ev) return false;
  if(ccProAmDone(ccProAmKey(ev))) return false;        // на каждую остановку — один раз
  const inv=careerProAmInv(ccProAmKey(ev));
  // Поехать можно только по приглашению, которое принял: известность приводит
  // письмо, а не автобус до Далласа.
  return !!inv && inv.state==='yes';
}
/* Правила Про-Ама на карточке дня — раскрывающимся блоком, чтобы карточка не
   вырастала на пять строк у того, кто их уже знает. Отзыв: «pro am
   ещё распиши как работает». Ни одного числа руками: очки, деньги, порог
   приглашения, срок письма и потолок аудитории читаются из тех же констант, по
   которым вечер играется, — расписание не разойдётся с правилами. */
function ccProAmHowHTML(label){
  const T=L();
  if(typeof T.ccProAmHow!=='function') return '';
  const P=ccProAmEvent(label || ccProAmKey(careerProAmOn(careerToday()) || (function(){ const d=careerProAmNextDay(); return d ? careerProAmOn(d) : null; })()));
  const lines=T.ccProAmHow({teams:CC_PROAM_TEAMS, games:P.games, kill:CC_PROAM_KILL, zb:!!P.zb,
    p1:P.place[0], p2:P.place[1], p3:P.place[2],
    prize1:ccMoney(P.prize[0]), prizeN:ccMoney(P.prize[P.prize.length-1]),
    g1:ccMoney(P.game[0]), g2:ccMoney(P.game[1]), g3:ccMoney(P.game[2]),
    reach:ccNum(CC_PROAM_REACH), days:CC_PROAM_INVITE_DAYS, pick:careerProAmPickList().length,
    host:CC_PROAM_HOST, cap:ccNum(CC_PROAM_REACH_CAP)});
  return '<details class="ch-how"><summary>'+esc(T.ccProAmHowTitle||'')+'</summary><ul>'+
    lines.map(l=>'<li>'+esc(l)+'</li>').join('')+'</ul></details>';
}
function ccProAmWhyLocked(){
  const inv=careerProAmInv();
  const today=careerProAmOn(careerToday());
  if(today && ccProAmDone(ccProAmKey(today))) return L().ccProAmPlayed;
  if(inv && inv.state==='no') return L().ccProAmTurnedDown;
  if(inv && inv.state==='sent') return L().ccProAmUnanswered;
  return careerReach()>=CC_PROAM_REACH ? L().ccProAmPlayed
                                       : L().ccProAmNeedReach(ccNum(CC_PROAM_REACH));
}
/* Креатор в пару: имя настоящее, сила наша. Выбранный игроком стоит впереди
   броска — бросок остался для тех, кто согласился и не выбрал никого. */
function ccProAmMate(){
  const cr=CAREER.career;
  const inv=careerProAmInv();
  if(inv && inv.mate) return ccProAmCreatorCard(inv.mate);
  const label=ccProAmKey(careerProAmOn(careerToday()));
  const rnd=careerRng(ccHashStr('proam|'+ccCareerSeed()+'|'+(cr.season||1)+(label==='ProAm_Dallas' ? '' : '|'+label)));
  const list=ccProAmCreators();
  const name=list[Math.floor(rnd()*list.length)];
  return ccProAmCreatorCard(name, rnd);
}
async function runCareerProAm(){
  const cr=CAREER.career;
  const ev=careerProAmOn(careerToday());
  if(!ev || !careerProAmCan()) return;
  const me=careerCard(); if(!me) return;
  const mate=ccProAmMate();
  const P=ccProAmEvent(ccProAmKey(ev));
  CC_ZB=!!P.zb;   // Сан-Паулу — без строек, см. CC_ZB
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  const prevSet=ACTIVE_LANDING_SET;
  CARD_MODE=true; squadSize=2; drafted=[me, mate];
  // Reload — значит остров Reload, как у всего круга Reload в этом моде.
  useLandingSet(ZONE_SETS.r4 ? 'r4' : careerBrSet());
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();
  // Поездка на ЛАН: перелёт и пост из города, как у Саммита и Парижа.
  careerLanArrive('proam', ev);
  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  /* Девятнадцать соперников — тоже «про + креатор»: половина игроков турнира
     контент-мейкеры, это его формат. Если ростер вдруг не дал столько имён,
     добираем обычным полем, чтобы лобби не оказалось пустым. */
  let rivals=ccProAmField(cr, drafted, mate);
  if(rivals.length<CC_PROAM_TEAMS-1)
    rivals=rivals.concat(careerCupField(cr, drafted, CC_PROAM_TEAMS-rivals.length));
  const field=[you, ...rivals.slice(0, CC_PROAM_TEAMS-1)];
  const zones=null;
  let ranked;
  try{
  await simulateGamesLive(field, P.games, place=>P.place[place-1]||0, CC_PROAM_KILL, 'stage', 0, null, zones,
    {lobbySize:CC_PROAM_TEAMS, stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, ev.label, ['proam'])});
  } finally{ CC_ZB=false; }
  ranked=careerRankField(field);
  const place=ranked.indexOf(you)+1;
  /* Деньги двумя частями, обе Epic'овы: таблица мест и бонус за КАЖДУЮ игру.
     Бонус считается по журналу игр, а не по итогу вечера — в этом и смысл
     турнира, где платят за каждую победу (в Сан-Паулу бонуса нет). */
  const table=P.prize[place-1] || 0;
  const perGame=(you.stageLog||[]).reduce((s,g)=>s+(P.game[(g.place||99)-1]||0), 0);
  const cash=table+perGame;
  careerMoneyAdd(ranked, (p)=>P.prize[p-1] || 0);
  const shell=createStageCardShell(ev.label);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, cash>0, false,
    cash ? L().ccProAmCash(ccMoney(ccShareOf(cash, you))) : L().ccProAmNoCash);
  await revealStandings(shell, ranked, you, 0, null, null, (p)=>P.prize[p-1] || 0, null, true);
  removeSkipButton();
  careerPrAdd(ranked, {div:cr.division, kind:'proam'});
  ccBoardAfter(ranked, you, ev.label);
  if(cash){
    const mine=ccShareOf(cash, you);
    ccPayIn(mine);
    careerNews('good', 'ccNewsProAmCash', [place, ccNum(mine)],
               {tbl:ccStageShot(ranked, you, cr.division, ev.label)});
  } else careerNews('flat', 'ccNewsProAmOut', [place, field.length]);
  careerReachAdd(careerReachResult(place, field.length, cr.division, 'proam'));
  /* И аудитория напарника: вечер шёл на его канале тоже. Считается от его
     настоящих фолловеров (ccProAmReachFrom), поэтому Jynxzi и Crackly — это
     два разных вечера, хотя турнир один. */
  const fromMate=ccProAmReachFrom(mate.handle);
  if(fromMate){
    careerReachAdd(fromMate, true);
    careerNews('good', 'ccNewsProAmReach',
               [ccHandle(mate.handle), ccNum(mate.followers||0), ccNum(fromMate)]);
  }
  cr.proam=cr.proam||{}; cr.proam[cr.season+'|'+ccProAmKey(ev)]=careerToday();
  if(ccProAmKey(ev)==='ProAm_Dallas') cr.proam[cr.season]=careerToday();   // старый ключ — для старых сторожей и сейвов
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place,
               of:field.length, pts:you.stagePts, passed:false, ovr:CAREER.player.ovr,
               games:P.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate.handle, prize:ccShareOf(cash, you), kind:'proam'});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0;
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:cash>0,
    wins:you.wins||0, cash:cash, cut:0});
}

/* Кубок наций: выдуманный турнир сборных, без денег (медаль, охват, ПР как за ЛАН, лента).
   Сборная: четыре лучших карточки страны из всех регионов; меньше четырёх, сборной нет. Зона по большинству
   людей страны, NA одна (NAC + NAW). Квоты на 25 мест (tools/nations-count-probe.js): EU 10, ME 5, NA 3, BR 3, ASIA 2, OCE 2.
   Квал зоны: ночь, 6 игр, лобби до 25 (больше, тогда два змейкой). Финал 25 × 4 = 100, 12 игр, элим ×4.
   Не в топ-4: за неделю до квалы соло-отбор (6 игр) за четвёртое место. Мир играет без тебя (careerWorldFinals).
   Конец года после последнего FNCS: отбор, квал, финал с шагом в неделю, назавтра церемония
   (2026: 31.10 / 7.11 / 14.11; 2025: 13 / 20 / 27.09; 2024: 14 / 21 / 28.09). Сторож tools/check-career-nations.js. */
const CC_NATIONS_SLOTS={EU:10, ME:5, NA:3, BR:3, ASIA:2, OCE:2};
const CC_NATIONS_FIELD=25, CC_NATIONS_SQUAD=4, CC_NATIONS_LOBBY=25;
const CC_NATIONS={trial:{games:6, kill:1}, qual:{games:6, kill:2}, final:{games:12, kill:4}};
/* ПРИЗОВОЙ ФОНД — ЕГО, НЕ EPIC'А: «давай призовой 3 миллиона» (21.09). $3 000 000 на 25 сборных
   по форме Форт-Уэрта (20 % первому, дальше по убыванию, с 11-го места пятёрками); на команду,
   на игрока — четверть. Квалификация и отбор не платят. */
const CC_NATIONS_PRIZES={1:600000, 2:450000, 3:300000, 4:240000, 5:180000, 6:135000, 7:100000, 8:80000, 9:65000, 10:50000,
  11:70000, 12:70000, 13:70000, 14:70000, 15:70000, 16:55000, 17:55000, 18:55000, 19:55000, 20:55000,
  21:35000, 22:35000, 23:35000, 24:35000, 25:35000};
function nationsPrize(place){ return CC_NATIONS_PRIZES[place]||0; }
/* ФИНАЛ — ЛАН В ЕВРОПЕ: «страны в Европе» (21.09). Город — жребий сезона среди европейских залов
   CC_LAN_HOSTS, минус страны, где в этом сезоне стоят Саммит/Глобалы/Париж, минус прошлогодний
   хозяин Кубка наций. Отбор и квалификация — онлайн. */
const CC_NAT_EU_HOSTS=['Dus','Ant','Lyo','Cph','Par','Bel','Kat','Sto','Mad','Ams','Mil','Lon'];
const CC_NAT_HOST_YEARS={};
function ccNatHostKey(season){
  const s=Math.max(1, season|0);
  if(CC_NAT_HOST_YEARS[s]) return CC_NAT_HOST_YEARS[s];
  const natOf=k=>{ const h=CC_LAN_HOSTS.find(x=>x.key===k); return h ? h.nat : null; };
  const busy=['summit','globals','rc'].map(k=>{ try{ return ccLanNat(k, s); }catch(e){ return null; } });
  if(s>1) busy.push(natOf(ccNatHostKey(s-1)));
  const rnd=careerRng(ccHashStr('nations-host|'+s));
  const pool=ccLanShuffle(CC_NAT_EU_HOSTS, rnd);
  const pick=pool.find(k=>busy.indexOf(natOf(k))<0) || pool[0];
  CC_NAT_HOST_YEARS[s]=pick;
  return pick;
}
function ccNatZone(reg){ return (reg==='NAC'||reg==='NAW') ? 'NA' : reg; }
/* Зона сборной — где страна географически: регион с наименьшим пингом до неё (таблицы пингов
   CC_COUNTRIES/CC_REGION_PINGS). Отчёт: «Китай играет на Америке» — китайцы сцены сидят
   в NA-ростерах, и зона «где большинство карточек» уводила сборную не туда. Страны вне всех
   таблиц — по большинству, как раньше. */
function ccNatGeoZone(nat){
  const code=(typeof FLAG_CODE!=='undefined' && FLAG_CODE[nat]) || null;
  if(!code) return null;
  let best=null, bestPing=Infinity;
  ['EU','NAC','NAW','BR','ASIA','ME','OCE'].forEach(reg=>{
    const p=ccPingOf(code, reg);
    if(p!=null && p<bestPing){ bestPing=p; best=reg; }
  });
  return best ? ccNatZone(best) : null;
}
let CC_NAT_BOOK=null;
/* Книга сборных — раз на сезон и мир: страна → её люди по силе, зона, четвёрка. */
function ccNationsBook(){
  const cr=CAREER && CAREER.career;
  const tag=(cr ? (cr.season||1) : 0)+'|'+ccNowYear()+'|'+ccCareerRegion();
  if(CC_NAT_BOOK && CC_NAT_BOOK.tag===tag) return CC_NAT_BOOK;
  const by={};
  CC_REGIONS.forEach(reg=>{
    let ro=[]; try{ ro=ccSceneRoster(reg); }catch(e){ ro=[]; }
    ro.forEach(p=>{
      if(!p || !p.nat) return;
      const k=hKey(p); if(!k) return;
      const b=by[p.nat]=by[p.nat]||{nat:p.nat, cards:new Map(), zones:{}};
      const cur=b.cards.get(k);
      if(!cur || ccCardOvr(p)>ccCardOvr(cur)) b.cards.set(k, p);
      const z=ccNatZone(reg); b.zones[z]=(b.zones[z]||0)+1;
    });
  });
  const list=[], byNat={};
  Object.keys(by).forEach(nat=>{
    const b=by[nat];
    const cards=[...b.cards.values()].sort((x,y)=>ccCardOvr(y)-ccCardOvr(x));
    if(cards.length<CC_NATIONS_SQUAD) return;
    const zone=ccNatGeoZone(nat) || Object.keys(b.zones).sort((x,y)=>b.zones[y]-b.zones[x])[0];
    const top=cards.slice(0, CC_NATIONS_SQUAD);
    const row={nat, zone, cards, top, pow:Math.round(top.reduce((s,c)=>s+ccCardOvr(c),0)/top.length*10)/10};
    list.push(row); byNat[nat]=row;
  });
  list.sort((a,b)=>b.pow-a.pow);
  CC_NAT_BOOK={tag, list, byNat};
  return CC_NAT_BOOK;
}
function ccNatState(){
  const cr=CAREER.career;
  if(!cr.nations || cr.nations.season!==cr.season) cr.nations={season:cr.season, trial:null, qualified:{}, qualDone:{}, finalDone:false, medal:null, picks:[]};
  if(!cr.nations.picks) cr.nations.picks=[];
  return cr.nations;
}
/* Моя страна: сборная, моё место в ней (auto — без отбора; trial — через отбор; none — сборной
   нет). Капитан — сильнейший игрок страны (отзыв). Капитан-человек сам берёт двоих
   (N.picks, см. ccNatPick), четвёртое место — сильнейшему из оставшихся: это место отбора.
   Капитан-бот берёт двоих следующих по силе: попал в тройку — ты в составе без отбора, нет —
   играешь отбор за четвёртое место. squad — как показывать (пустые места капитана — null),
   full — как играть (пустые добиты сильнейшими из оставшихся). */
function ccNationsMine(){
  const me=careerCard(); if(!me || !me.nat) return null;
  const c=ccNationsBook().byNat[me.nat]; if(!c) return null;
  const myK=hKey(me);
  const others=c.cards.filter(p=>hKey(p)!==myK);
  if(others.length<CC_NATIONS_SQUAD-1) return null;
  const myOvr=ccCardOvr(me);
  const N=ccNatState();
  const captain=myOvr>=ccCardOvr(others[0]);
  /* Сначала отбор, потом выбор (отзыв): до N.trialRank капитан никого не берёт; после —
     список стоит по местам отбора, четвёртое место у лучшего из невыбранных по отбору. */
  const trialDone=!!(N.trialRank && N.trialRank.length);
  /* СПИСОК СОБИРАЕТСЯ С РАСХОДОМ, А НЕ ПОИСКОМ ПО КЛЮЧУ.

     Ключ ника без региона в сцене занят дважды у 137 человек, и строка отбора, в которой такой
     ключ встретился дважды, через find() дважды возвращала ОДНУ И ТУ ЖЕ карточку: в списке и в
     составе стоял один человек два раза, а второй пропадал совсем. Отзыв: «и
     опять два повторяющихся игрока». Теперь каждый ключ выдаёт карточку один раз, и кто не
     попал в строку отбора, идёт следом — как и было задумано. */
  const byKey=new Map();
  others.forEach(p=>{ const k=hKey(p); if(!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(p); });
  const takeOne=k=>{ const q=byKey.get(k); return (q && q.length) ? q.shift() : null; };
  let ranked;
  if(trialDone){
    const seen=new Set(), out=[];
    N.trialRank.forEach(k=>{ const p=takeOne(k); if(p){ out.push(p); seen.add(p); } });
    others.forEach(p=>{ if(!seen.has(p)) out.push(p); });
    ranked=out;
  } else ranked=others;
  const picks=(captain && trialDone) ? (function(){
    const used=new Set(), out=[];
    (N.picks||[]).forEach(k=>{ const p=ranked.find(x=>hKey(x)===k && !used.has(x)); if(p){ used.add(p); out.push(p); } });
    return out.slice(0, CC_NATIONS_SQUAD-2);
  })() : [];
  const third=others[CC_NATIONS_SQUAD-2];
  const auto=captain || !third || myOvr>=ccCardOvr(third);
  const inSquad=auto || N.trial==='won';
  let squad, full, autoFill=[];
  if(captain){
    const pk=picks.map(hKey);
    const rest=ranked.filter(p=>pk.indexOf(hKey(p))<0);
    /* ЧЕТВЁРТОЕ МЕСТО — ВСЕГДА ЛУЧШИЙ ИЗ НЕВЫБРАННЫХ, И ВИДНО ЭТО СРАЗУ.

       Превью считало место отбора «третьим по списку, пока капитан не выбрал», а правило
       вечера другое: место достаётся лучшему из тех, кого не взяли. Значит верхний по
       отбору в сборной при любом раскладе — и он же стоял в списке на выбор. Слово
       22 сентября: «могу выбрать игрока, когда он прошёл уже квал и мне его не нужно
       выбирать, и когда выбираю его, мне дают первого, который в списке» — ровно это:
       место уходило на того, кто и так ехал, а четвёртым вставал следующий.
       Теперь он сразу стоит на своём месте, а выбирать капитан может только из остальных
       (см. пул в ccNatSquadHTML). */
    /* ПУСТЫЕ МЕСТА КАПИТАНА — СИЛЬНЕЙШИМИ СВОБОДНЫМИ (28.10, Notion 27.10 скрин 12: «не могу взять игроков, просто
       рандомных дали»): добивались следующими по месту ОТБОРА — на финал ехал 73-й, пока сильные сидели дома. */
    const seat=trialDone ? (rest[0]||null) : null;
    autoFill=rest.slice(seat ? 1 : 0).sort((a,b)=>ccCardOvr(b)-ccCardOvr(a)).slice(0, Math.max(0, CC_NATIONS_SQUAD-2-picks.length));
    squad=[me, picks[0]||null, picks[1]||null, seat];
    full=[me].concat(picks, autoFill, seat ? [seat] : [], rest);
  } else {
    squad=inSquad ? [me].concat(others.slice(0, CC_NATIONS_SQUAD-1)) : c.top;
    full=squad;
  }
  /* И последняя защита: в составе не бывает двух одинаковых. Если тёзка всё-таки протёк из
     чужого списка (записи отбора, старый сейв), место освобождается — лучше пустое, чем один
     человек дважды. */
  { const seen=new Set();
    squad=squad.map(p=>{ if(!p) return p; const k=hKey(p); if(seen.has(k)) return null; seen.add(k); return p; });
    const f=new Set(); full=full.filter(p=>{ if(!p) return false; const k=hKey(p); if(f.has(k)) return false; f.add(k); return true; }).slice(0, CC_NATIONS_SQUAD); }
  return {nat:me.nat, zone:c.zone, seat:auto ? 'auto' : 'trial', captain, picks, inSquad, squad, full, others, ranked, trialDone, country:c, autoFill};
}
/* ОКНО ВЫБОРА СОСТАВА. Карточка сборной стоит под карточкой дня, и на телефоне её не видно —
   Слово: «пусть окно выскакивает в день национальных квал, когда выбрать команду нужно,
   или за день до этого, внизу вообще не видно». Окно — та же карточка поверх хаба: за день до
   отбора и в день квалификации, пока капитан не взял двоих; раз в день (N.nudged). И дверь:
   «Играть» без состава открывает это окно, а не вечер (ccNatPickGate) — «я могу нажать на играть
   без выбора игроков». */
let CC_NAT_MODAL=false;
function ccNatModalOpen(){
  const m=document.getElementById('ccNatModal'); if(!m) return false;
  const card=ccNatSquadHTML(); if(!card) return false;
  const T=L();
  m.querySelector('.cc-nat-modal-in').innerHTML=card.replace('<ul>', '<p>'+esc(T.ccNatModalWhy)+'</p><ul>')
    .replace(/<\/div>$/, '<button class="cc-nat-later" onclick="ccNatModalClose()">'+esc(T.ccNatModalLater)+'</button></div>');
  m.style.display='flex'; CC_NAT_MODAL=true;
  return true;
}
function ccNatModalClose(){ const m=document.getElementById('ccNatModal'); if(m) m.style.display='none'; CC_NAT_MODAL=false; }
// Нужен ли ещё выбор: капитан-человек, двоих нет, состав не заперт.
function ccNatPickNeeded(){
  const mine=ccNationsMine(); if(!mine || !mine.captain || !mine.trialDone || mine.picks.length>=CC_NATIONS_SQUAD-2) return false;
  return !ccNatPickLocked(mine);
}
/* Когда состав заперт: после финала всегда, после квалификации — если капитан уже взял двоих. Не взял (окно не
   застал, перемотка) — выбирает до финала (28.10, скрин 12: на финале слоты «Выбери игрока» без кнопок). */
function ccNatPickLocked(mine){
  const N=ccNatState();
  if(N.finalDone) return true;
  return !!(N.qualDone[mine.zone] && (N.picks||[]).length>=CC_NATIONS_SQUAD-2);
}
function ccNatNudge(){
  try{
    if(typeof CC_FF!=='undefined' && CC_FF) return;
    if(CC_NAT_MODAL || CAREER_RUN) return;
    const hub=document.getElementById('screen-career-hub'); if(!hub || !hub.classList.contains('active')) return;
    if(!ccNatPickNeeded()) return;
    const days=ccNatDays(), today=careerToday();
    if(!days.qual) return;
    const when=[days.trial ? ccAddDays(days.trial, 1) : null, ccAddDays(days.qual, -1), days.qual].filter(Boolean);
    if(when.indexOf(today)<0) return;
    const N=ccNatState(); if(N.nudged===today) return;
    N.nudged=today; careerSave();
    ccNatModalOpen();
  }catch(e){}
}
function ccNatPickGate(next){
  if(!next || next.type!=='nations') return true;
  if(typeof CC_FF!=='undefined' && CC_FF) return true;
  const ev=careerNationsOn(careerToday()); if(!ev || ccNatStage(ev)==='trial') return true;
  if(!ccNatPickNeeded()) return true;
  return !ccNatModalOpen();
}
/* Капитан берёт или отпускает игрока страны; двое максимум; с квалификации состав заперт. */
function ccNatPick(k){
  const mine=ccNationsMine(); if(!mine || !mine.captain || !mine.trialDone) return;
  const N=ccNatState();
  if(ccNatPickLocked(mine)) return;
  const picks=(N.picks||[]).slice();
  const i=picks.indexOf(k);
  if(i>=0) picks.splice(i, 1);
  else {
    if(picks.length>=CC_NATIONS_SQUAD-2) return;
    if(!mine.others.some(p=>hKey(p)===k)) return;
    // Тот, кто и так занимает место отбора, местом капитана не берётся (см. ccNationsMine).
    { const pk=picks.slice(); const rest=mine.ranked.filter(p=>pk.indexOf(hKey(p))<0);
      if(rest[0] && hKey(rest[0])===k) return; }
    picks.push(k);
  }
  N.picks=picks;
  careerSave();
  careerRenderHub('centre');
  if(CC_NAT_MODAL) ccNatModalOpen();   // окно выбора перерисовывается вместе с хабом
}
/* Дни Кубка этого сезона: {trial, qual, final} — ISO или null. */
function ccNatDays(){
  const out={trial:null, qual:null, final:null};
  const map=careerYearDays();
  [...map.keys()].sort().forEach(d=>{ (map.get(d)||[]).forEach(e=>{ if(e.kind==='nations'){ const st=ccNatStage(e); if(!out[st]) out[st]=d; } }); });
  return out;
}
/* Отбор страны без игрока-капитана: вся страна соло, шесть игр, итог по местам — N.trialRank.
   Капитан-бот: за четвёртое место играют все, кроме тройки (как у человека в runCareerNations);
   человек, который мог играть и не пришёл, место не получает. */
function ccNatTrialQuiet(){
  const N=ccNatState(); if(N.trialRank && N.trialRank.length) return;
  const mine=ccNationsMine(); if(!mine) return;
  const pool=(mine.captain ? mine.others : mine.others.slice(CC_NATIONS_SQUAD-1)).slice(0, 99);
  if(pool.length<2) return;
  const field=pool.map(c=>{ const t=careerTeam([c]); t._k=hKey(c); t.stagePts=0; t.wins=0; t.stageElims=0; return t; });
  simulateGames(field, CC_NATIONS.trial.games, pointsForPlace, CC_NATIONS.trial.kill);
  N.trialRank=ccNatRank(field).map(t=>t._k);
  if(!mine.captain && !mine.inSquad && !N.trial) N.trial='lost';
}
function ccNatNextDay(){
  const today=careerToday();
  const days=[...careerYearDays().keys()].filter(d=>d>=today).sort();
  for(const d of days){ if((careerYearDays().get(d)||[]).some(e=>e.kind==='nations')) return d; }
  return null;
}
/* Карточка сборной в хабе: за три недели до отбора и до финала — страна, четверо, кто капитан,
   у капитана-человека кнопки выбора. Отзыв: «должна быть эта сборная где-то перед
   началом турнира». */
const CC_NAT_CARD_DAYS=21;
function ccNatCardOn(){
  if(!CAREER || !CAREER.career || !CAREER.career.day) return false;
  const mine=ccNationsMine(); if(!mine) return false;
  if(ccNatState().finalDone) return false;
  const d=ccNatNextDay();
  return !!(d && d<=ccAddDays(careerToday(), CC_NAT_CARD_DAYS));
}
function ccNatSquadHTML(){
  const T=L();
  if(!ccNatCardOn()) return '';
  const mine=ccNationsMine();
  const N=ccNatState();
  const me=careerCard(), myK=hKey(me);
  const locked=ccNatPickLocked(mine);
  const capK=mine.captain ? myK : hKey(mine.others[0]);
  const canPick=mine.captain && !locked && mine.trialDone;
  const placeOf=k=>{ const i=(N.trialRank||[]).indexOf(k); return i>=0 ? '<i>#'+(i+1)+'</i>' : ''; };
  let autoI=0;
  const row=(c, i)=>{
    // Выбор закрыт, а место пустое — показывается тот, кто на деле играет (сильнейший свободный).
    if(!c && !canPick && mine.captain && mine.trialDone && mine.autoFill[autoI]){ const a=mine.autoFill[autoI++];
      return '<li><b>'+esc(a.handle)+'</b> <span>'+ccCardOvr(a)+'</span>'+placeOf(hKey(a))+' <em>'+esc(T.ccNatAutoTag)+'</em></li>'; }
    if(!c) return '<li class="cc-nat-empty"><span>'+esc(mine.captain && !mine.trialDone ? T.ccNatAfterTrial : T.ccNatPickSlot)+'</span></li>';
    const k=hKey(c);
    const tags=[];
    if(k===capK) tags.push(T.ccNatCaptain);
    if(k===myK) tags.push(T.ccNatYou);
    if(i===CC_NATIONS_SQUAD-1 && (mine.captain || (!mine.inSquad && !N.trial))) tags.push(T.ccNatTrialSlot);
    const drop=(canPick && mine.picks.some(p=>hKey(p)===k)) ? ' <button class="cc-nat-chip cc-nat-chip-x" onclick="ccNatPick(\''+jsq(k)+'\')">'+esc(T.ccNatUnpickBtn)+'</button>' : '';
    return '<li><b>'+esc(c.handle)+'</b> <span>'+ccCardOvr(c)+'</span>'+(k!==myK ? placeOf(k) : '')+(tags.length ? ' <em>'+esc(tags.join(' · '))+'</em>' : '')+drop+'</li>';
  };
  let pick='';
  if(mine.captain && !mine.trialDone && !locked){
    const days=ccNatDays();
    pick='<div class="cc-nat-pick"><span>'+esc(T.ccNatTrialFirst)+'</span><p>'+esc(T.ccNatTrialFirstSub(days.trial ? ccDayLabel(days.trial) : ''))+'</p></div>';
  } else if(canPick && mine.picks.length<CC_NATIONS_SQUAD-2){
    const pk=mine.picks.map(hKey);
    /* КОГО ПРЕДЛАГАТЬ. Первый из невыбранных занимает четвёртое место сам — его в списке нет
       (см. ccNationsMine). Остальных список резал по МЕСТАМ ОТБОРА, и сильный игрок страны,
       провалившийся в тот вечер, за двенадцать строк не попадал вовсе: отзыв —
       «игроки в выбор попадают, не самых лучших предлагают». Теперь двенадцать — это двенадцать
       сильнейших страны из свободных, а порядок остаётся по отбору (место стоит на кнопке):
       отбор решает очередь, рейтинг решает, кого вообще показывать. */
    const free=mine.ranked.filter(p=>pk.indexOf(hKey(p))<0).slice(1);
    const show=new Set(free.slice().sort((a,b)=>ccCardOvr(b)-ccCardOvr(a)).slice(0, 12).map(hKey));
    const pool=free.filter(p=>show.has(hKey(p)));
    pick='<div class="cc-nat-pick"><span>'+esc(T.ccNatPickHint)+'</span>'+
      pool.map(p=>'<button class="cc-nat-chip" onclick="ccNatPick(\''+esc(hKey(p))+'\')">'+placeOf(hKey(p))+esc(p.handle)+' <b>'+ccCardOvr(p)+'</b></button>').join('')+'</div>';
  }
  // Метка сборной: где садимся на Кубке наций — картинка и кнопка сменить, или кнопка выбрать.
  const sp=careerSpotList('nations')[0];
  const go='onclick="ccNatModalClose();careerTab(\'me\');careerSpotOpenFor(\'nations\')"';
  const spot=sp
    ? '<div class="cc-nat-spot">'+(careerSpotShotHTML(sp.i, 'nations', 'ch-spot-shot', 16/9)||'')+'<div class="cc-nat-spot-in"><em>'+esc(T.ccNightSpotCap)+'</em><b>'+esc(T.landingZoneSuffix(sp.i+1))+'</b><button class="cc-nat-btn" '+go+'>'+esc(T.ccSpotChange)+'</button></div></div>'
    : '<div class="cc-nat-spot"><button class="cc-nat-btn" '+go+'>'+esc(T.ccNatSpotPick)+'</button></div>';
  return '<div class="ch-tile cc-nat-card"><em>'+esc(T.ccNatSquadTitle)+'</em>'+
    '<h4>'+flagImg(mine.nat, 16)+esc(natDisplay(mine.nat))+'</h4>'+
    '<ul>'+mine.squad.map(row).join('')+'</ul>'+pick+spot+'</div>';
}
function careerNationsOn(iso){
  const list=careerYearDays().get(iso||careerToday())||[];
  return list.find(e=>e.kind==='nations') || null;
}
function ccNatStage(ev){ const id=String((ev && ev.id)||''); return /Trial/.test(id) ? 'trial' : /Qual/.test(id) ? 'qual' : 'final'; }
function careerNationsCan(ev){
  if(!ev) return false;
  const mine=ccNationsMine(); if(!mine) return false;
  const N=ccNatState(), st=ccNatStage(ev);
  if(st==='trial') return mine.seat==='trial' && !N.trial;
  if(!mine.inSquad) return false;
  if(st==='qual') return !N.qualDone[mine.zone];
  return !N.finalDone && (N.qualified[mine.zone]||[]).indexOf(mine.nat)>=0;
}
function ccNatWhyLocked(){
  const ev=careerNationsOn(careerToday()); const mine=ccNationsMine();
  if(!mine) return L().ccNatLockedNoCountry;
  const N=ccNatState(), st=ccNatStage(ev);
  if(st==='trial') return mine.captain ? L().ccNatLockedCap : (N.trial ? (N.trial==='won' ? L().ccNatTrialWon : L().ccNatTrialLost) : L().ccNatLockedIn);
  if(!mine.inSquad) return N.trial==='lost' ? L().ccNatTrialLost : L().ccNatLockedNotIn(natDisplay(mine.nat), mine.country.top.map(c=>c.handle).join(', '));
  if(st==='qual') return L().ccNatLockedDone;
  return (N.qualified[mine.zone]||[]).indexOf(mine.nat)>=0 ? L().ccNatLockedDone : L().ccNatLockedOut(natDisplay(mine.nat));
}
/* Сборной не платят за флаг и язык: состав и так одной страны. Отзыв: «убери на этих
   турнирах синергию языка и страны». Снимается ровно то, что начислил computeSynergy: страна —
   раз на группу флага, язык — раз на кластер (одна ссылка type:'language' на кластер); сила
   пересчитывается той же формулой, что в careerTeam. Партнёрская химия настоящих пар остаётся. */
function ccNatStripSyn(t, cards){
  if(!t || !t.syn) return t;
  const links=t.syn.links||[];
  const natLinks=links.filter(l=>l.type==='nation'), langLinks=links.filter(l=>l.type==='language');
  if(!natLinks.length && !langLinks.length) return t;
  const groups={}; (cards||[]).forEach(c=>{ if(c && c.nat) groups[c.nat]=(groups[c.nat]||0)+1; });
  const natGroups=Object.keys(groups).filter(n=>groups[n]>=2).length;
  t.syn.bonus-=natGroups*SYN_NATION + langLinks.length*SYN_LANGUAGE;
  if(t.syn.bonus<0) t.syn.bonus=0;
  t.syn.links=links.filter(l=>l.type!=='nation' && l.type!=='language');
  const T=L();
  t.syn.details=(t.syn.details||[]).filter(d=>!(T.synergyNation && String(d).indexOf(T.synergyNation)>=0) && !(T.synergyLanguage && String(d).indexOf(T.synergyLanguage)>=0));
  const after=synCap(t.syn.bonus);
  const ageEdge=ageEdgeOf(cards);
  t.pow = CARD_MODE
    ? Math.round((t.ovrAvg+after+t.roleBonus)*t.regionMult + ageEdge)
    : Math.round((cards.reduce((s,p)=>s+p.rating,0)/cards.length+after)*t.regionMult + ageEdge);
  return t;
}
function ccNatTeam(row, squad){
  const cards=squad||row.top;
  const t=ccNatStripSyn(careerTeam(cards), cards);
  // Имя команды в таблице: флаг, страна и четыре ника в скобках (отзыв).
  t.name=flagImg(row.nat, 14)+natDisplay(row.nat)+' ('+cards.map(c=>c.handle).join(', ')+')'; t.nation=row.nat; t.zone=row.zone;
  return t;
}
function ccNatRank(teams){ return teams.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims); }
/* Лобби квалификации зоны: змейкой по силе, если сборных больше, чем влезает в одно. */
function ccNatQualLobbies(zone, mine){
  const rows=ccNationsBook().list.filter(r=>r.zone===zone);
  const mineIn=(mine && mine.zone===zone && mine.inSquad) ? 1 : 0;
  /* Комната одна: 25 сильнейших сборных зоны, слабейшие за бортом. Вопрос «почему 14
     команд вместо 25»: в Европе 28 стран, змейка делила их на две комнаты по 14. */
  const teams=rows.map(r=>(mine && mine.nat===r.nat && mine.inSquad) ? null : ccNatTeam(r)).filter(Boolean).sort((a,b)=>b.pow-a.pow).slice(0, CC_NATIONS_LOBBY-mineIn);
  const n=Math.max(1, Math.ceil((teams.length+mineIn)/CC_NATIONS_LOBBY));
  const lobbies=Array.from({length:n}, ()=>[]);
  teams.sort((a,b)=>b.pow-a.pow).forEach((t,i)=>{ const lap=Math.floor(i/n), pos=i%n; lobbies[lap%2 ? n-1-pos : pos].push(t); });
  return lobbies;
}
function ccNatSlotsOf(zone, lobbies, i){
  const total=CC_NATIONS_SLOTS[zone]||0, n=lobbies.length;
  return Math.floor(total/n)+(i<total%n ? 1 : 0);
}
/* Квалификация зоны без игрока — тихо, результат в книгу сезона. */
function ccNatQualQuiet(zone){
  const N=ccNatState();
  if(N.qualDone[zone]) return N.qualified[zone]||[];
  const lobbies=ccNatQualLobbies(zone, null);
  const out=[];
  lobbies.forEach((room, i)=>{
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    // Отбор зоны, в которой игрока нет, — мир: один бросок на всех (см. ccWorldRun).
    ccWorldRun('nat|'+((CAREER.career||{}).season||1)+'|'+zone+'|'+i,
               ()=>simulateGames(room, CC_NATIONS.qual.games, pointsForPlace, CC_NATIONS.qual.kill));
    ccNatRank(room).slice(0, ccNatSlotsOf(zone, lobbies, i)).forEach(t=>out.push(t.nation));
  });
  N.qualified[zone]=out; N.qualDone[zone]=true;
  return out;
}
function ccNatFinalField(mine){
  const N=ccNatState(), book=ccNationsBook();
  Object.keys(CC_NATIONS_SLOTS).forEach(z=>ccNatQualQuiet(z));
  const nats=[]; Object.keys(N.qualified).forEach(z=>(N.qualified[z]||[]).forEach(n=>{ if(nats.indexOf(n)<0) nats.push(n); }));
  return nats.map(n=>book.byNat[n]).filter(Boolean).filter(r=>!(mine && mine.inSquad && r.nat===mine.nat)).map(r=>ccNatTeam(r)).slice(0, CC_NATIONS_FIELD);
}
async function runCareerNations(){
  const cr=CAREER.career;
  const ev=careerNationsOn(careerToday());
  if(!ev || !careerNationsCan(ev)) return;
  const me=careerCard(); if(!me) return;
  const mine=ccNationsMine(); if(!mine) return;
  const N=ccNatState(), st=ccNatStage(ev), S=CC_NATIONS[st];
  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted, prevSet=ACTIVE_LANDING_SET;
  const mySquad=st==='trial' ? [me] : mine.full;
  CARD_MODE=true; squadSize=mySquad.length; drafted=mySquad;
  useLandingSet(careerBrSet());
  ccNightSpotOn('nations');   // дом сборной, а не дуо-дом сезона; см. careerSpotSets
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();
  // Финал — ЛАН: перелёт и пост из города, как у Саммита и Глобалов.
  if(st==='final') careerLanArrive('nations', ev);
  const you=ccNatStripSyn(careerYouTeam(drafted), drafted);
  you.name=(st==='trial' ? L().yourTeamPrefix+teamLabel(drafted) : L().yourTeamPrefix+flagImg(mine.nat, 14)+natDisplay(mine.nat)+' ('+mySquad.map(c=>c.handle).join(', ')+')'); you.isYou=true; you.nation=mine.nat;
  let field, cut=0, note='';
  if(st==='trial'){
    // Все люди страны, кроме троих сильнейших (они уже в составе), соло; до ста человек.
    const rivals=mine.others.slice(CC_NATIONS_SQUAD-1, CC_NATIONS_SQUAD-1+99).map(c=>{ const t=careerTeam([c]); t.name=teamLabel([c]); t._k=hKey(c); return t; });
    field=[you, ...rivals]; cut=1;
  } else if(st==='qual'){
    const lobbies=ccNatQualLobbies(mine.zone, mine);
    // Своё лобби — самое слабое по силе верха, туда и садимся; остальные играют тихо.
    let at=0; lobbies.forEach((l,i)=>{ if(l.length<lobbies[at].length) at=i; });
    lobbies[at].unshift(you);
    field=lobbies[at]; cut=ccNatSlotsOf(mine.zone, lobbies, at);
    lobbies.forEach((room, i)=>{ if(i===at) return; room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; }); simulateGames(room, S.games, pointsForPlace, S.kill); });
    field._lobbies=lobbies; field._at=at;
  } else {
    field=[you, ...ccNatFinalField(mine)].slice(0, CC_NATIONS_FIELD);
  }
  const label=ev.label;
  await simulateGamesLive(field, S.games, pointsForPlace, S.kill, 'stage', 0, null, null,
    {lobbySize:field.length, stageName:label, mapReplay:true, choices:st!=='trial', stopOnYourDeath:true,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, label, ['nations'])});
  const ranked=ccNatRank(field);
  const place=ranked.indexOf(you)+1;
  let through=false;
  if(st==='trial'){
    through=place===1; N.trial=through ? 'won' : 'lost';
    N.trialRank=ranked.map(t=>t===you ? hKey(me) : t._k).filter(Boolean);
    note=through ? L().ccNatTrialWon : L().ccNatTrialLost;
  } else if(st==='qual'){
    through=place<=cut;
    const lobbies=field._lobbies, out=[];
    lobbies.forEach((room, i)=>{ ccNatRank(room).slice(0, ccNatSlotsOf(mine.zone, lobbies, i)).forEach(t=>out.push(t.nation)); });
    N.qualified[mine.zone]=out; N.qualDone[mine.zone]=true;
    note=through ? L().ccNatQualThrough(natDisplay(mine.nat)) : L().ccNatQualOut(natDisplay(mine.nat), cut);
  } else {
    N.finalDone=true; through=place<=3;
    if(place<=3){ N.medal=place; if(!Array.isArray(cr.medals)) cr.medals=[]; cr.medals.push({season:cr.season, nat:mine.nat, place}); }
    note=place<=3 ? L().ccNatMedal(place) : L().ccNatFinalPlace(place);
  }
  // Деньги финала — его фонд: на команду по таблице, тебе четверть.
  let cash=0;
  if(st==='final'){
    { const only=ccNatBoardsOwnOnly(); if(only) CC_BOARD_ONLY_YOU=true;
      try{ careerMoneyAdd(ranked, nationsPrize); } finally{ if(only) CC_BOARD_ONLY_YOU=false; } }
    cash=nationsPrize(place);
    if(cash){ ccPayIn(ccShareOf(cash, you)); note+=' · '+L().ccNatCash(ccMoney(ccShareOf(cash, you))); }
  }
  const shell=createStageCardShell(label+' — '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, st==='final' ? (place<=3 ? true : null) : through, you.gotVR, note);
  await revealStandings(shell, ranked, you, cut, null, null, st==='final' ? nationsPrize : null, null, st==='final');
  removeSkipButton();
  { const only=ccNatBoardsOwnOnly(); if(only) CC_BOARD_ONLY_YOU=true;
    try{ careerPrAdd(ranked, {div:cr.division, kind:'nations', stage:st}); } finally{ if(only) CC_BOARD_ONLY_YOU=false; } }
  if(st!=='trial') careerReachAdd(careerReachResult(place, field.length, 1, st==='final' ? 'globals' : 'major'));
  const shot={tbl:ccStageShot(ranked, you, 1, label)};
  if(st==='trial') careerNews(through?'good':'flat', through?'ccNewsNatTrialWon':'ccNewsNatTrialLost', [natDisplay(mine.nat), place, field.length], shot);
  else if(st==='qual') careerNews(through?'good':'bad', through?'ccNewsNatQualThrough':'ccNewsNatQualOut', [natDisplay(mine.nat), place, field.length], shot);
  else careerNews(place<=3?'good':'flat', place<=3?'ccNewsNatMedal':'ccNewsNatFinal', [natDisplay(mine.nat), place, field.length], shot);
  if(st==='final') careerCongrats(ranked, you, L().ccNatCongrats);
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:place, of:field.length, pts:you.stagePts,
               passed:through, ovr:CAREER.player.ovr, games:S.games, wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mySquad[1] ? mySquad[1].handle : null, mates: st==='trial' ? [] : ccLogMates(mySquad.slice(1)), prize:ccShareOf(cash, you), kind:'nations', stage:st, nat:mine.nat,
               won: st==='final' ? ccStageSeatRow(ranked[0]) : undefined,
               top: st==='final' ? ccStageTop(ranked, you) : undefined});
  await ccMpClose(ranked);
  careerAdvanceTo(ccAddDays(careerToday(), 1));
  careerSave();
  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0; ccNightSpotOff();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:label, place:place, through:through, wins:you.wins||0, cash:cash, cut:cut});
}
/* Мир играет Кубок наций без игрока: квалификации всех зон в день квалификации, финал в день
   финала — победитель в ленту, книга сезона заполнена. Зовётся из careerWorldFinals. */
function ccNatWorldPlay(day, play, stubOf){
  const ev=careerNationsOn(day); if(!ev) return;
  const st=ccNatStage(ev); if(st==='trial'){ try{ ccNatTrialQuiet(); }catch(e){} return; }
  const N=ccNatState();
  if(st==='qual'){
    Object.keys(CC_NATIONS_SLOTS).forEach(z=>ccNatQualQuiet(z));
    const mine=ccNationsMine();
    const q=(mine && N.qualified[mine.zone])||[];
    if(mine && !mine.inSquad) careerNews(q.indexOf(mine.nat)>=0 ? 'flat' : 'bad', q.indexOf(mine.nat)>=0 ? 'ccNewsNatWorldQual' : 'ccNewsNatWorldOut', [natDisplay(mine.nat)]);
    return;
  }
  { const only=ccNatBoardsOwnOnly(); if(only) CC_BOARD_ONLY_YOU=true;
    try{ play(day, 'nations', 'nations', ev.label||'Nations Cup', ()=>[stubOf(), ...ccNatFinalField(null)],
       CC_NATIONS.final.games, pointsForPlace, CC_NATIONS.final.kill, nationsPrize, {div:1, kind:'nations', stage:'final'}); }
    finally{ if(only) CC_BOARD_ONLY_YOU=false; } }
  N.finalDone=true;
}

async function runCareerSoloSeries(){
  const cr=CAREER.career;
  const ev=careerSoloSeriesOn(careerToday());
  if(!ev || !careerSoloSeriesCan(ev)) return;
  const me=careerCard();
  if(!me) return;
  /* В команде одно лобби на двоих. Раньше каждый клиент собирал поле [я, боты] из одного сида,
     и поля расходились. Теперь поле у обоих одно: люди впереди в порядке ников (как MP.teamOf), боты
     из careerSoloField без обоих ников; opts.together держит двоих в одной сотне.
     Вопросы с адресатом (mpTag → 'drop:<ник>', см. ccMpMine), ответ напарника приходит очередью.
     Если в хиты прошёл один, второй в этот день не играет, вечер одиночный (CC_MP_ALONE). */
  /* ЛИЧНЫЙ ВЕЧЕР, ОБЩИЙ ТУРНИР. Отзыв: «зачем друг друга
     ждать, когда это соло» и «ну личный вечер, но турнир они один и тот же
     играют». Локстеп на двоих в соло стоил ожидания на гейте и красных строк
     (h102 vs h103 при одном поле): двое считали общую сотню, а расходились на
     силе друг друга. Теперь в команде соло всегда одиночный вечер
     (CC_MP_ALONE): гейта нет, каждый считает свою сотню сам, напарник стоит в
     ней участником по своей карточке, а в общий сейв уезжает только СВОЙ итог
     (soloBy, строка журнала, рост). День шагает, когда отыграли оба — см.
     ccSoloTeamSettle. */
  /* ОДИН ТУРНИР НА ДВОИХ — ОДНА ТАБЛИЦА. Его последнее слово, 29 августа,
     после личных вечеров: «опять разные турниры играют, не один» — два
     клиента считали одну сотню каждый сам, и таблицы (кто где финишировал)
     у них вышли разные. Одна таблица бывает только у одного расчёта, поэтому
     соло вдвоём — снова локстеп: общий старт, общая сотня, свои вопросы у
     каждого (адресные, см. ccMpMine), сверка каждой игры. Одиночный вечер
     (CC_MP_ALONE) остаётся на случай, когда напарнику играть нечего — не
     прошёл этап или уже отыграл; тогда день шагает через ccSoloTeamSettle. */
  const peerCard=(ccMpTeam() && typeof MP!=='undefined' && MP.peer) ? MP.peer : null;
  const peerIn=!!(peerCard && careerSoloSeriesCanFor(ev, ccSoloStateOf(ev, peerCard)));
  /* Напарник этот день в перемотке пропустил (ffskip) — его карточка может говорить «может играть», но
     к воротам он не придёт: вечер одиночный (годовой прогон вдвоём 2020, соло-серия 16 ноября). */
  const alone=ccMpTeam() && (!peerIn || CC_MP_PEER_SKIPS.has(careerToday()));
  if(alone) CC_MP_ALONE=true;
  const mpStart=ccMpLock() ? await ccMpGate('solo') : null;
  const two=ccMpOn() && peerIn;
  const pc=two ? (MP.peer||peerCard) : null;   // карточка после гейта — свежая
  const dayAtStart=careerToday();

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  const prevSet=ACTIVE_LANDING_SET;
  /* СОЛО-СОСТОЯНИЕ ВКЛАДКИ — ВОЗВРАЩАЕТСЯ ВСЕГДА (errlog 23.10: после соло-квалов Solo Series командный
     Victory Cup одного из двоих шёл одиночками на соло-острове — «n100h94+99 m1.60» против дуо «n2470 m1.39»). */
  try{
  CARD_MODE=true;
  squadSize=1;
  drafted=[me];
  /* Соло-ФНКС — на острове седьмой главы (s42), дроблёном под соло той же
     сеткой, что и январская серия: коробки точек с никами, красные — где
     сели по нескольку. Отзыв со скрином карты Solo Series:
     «как на соло выглядела, также и на solo fncs нужно сделать, а не 100
     квадратиков». Сотня клеток s42solo (1 сентября) больше не садится.
     Остров именно s42, а не careerBrSet(): в трио-год сезонный — шестая
     глава, а FNCS Solos играются на седьмой (репорт того же дня). */
  useLandingSet(ccSoloFncsSet(ev));
  /* Дом на этом вечере — соло-метка, а не сезонный дуо-дом. Правка: «в соло ещё метки, не для соло, а для других режимов».
     Указатель держится весь вечер и гасится вместе с остальным состоянием
     прогона; сетка у соло своя (сто клеток), метка ставится по координатам,
     поэтому выбранная в хабе точка попадает в свою клетку. См. ccNightSpot. */
  ccNightSpotOn('solo');

  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  /* Свой игрок в соло — своя форма, без химии и без средней с напарником:
     careerYouTeam считает команду, а тут двое по отдельности. */
  const soloYou=function(card, form, label){
    const t=careerTeam([card], true);
    t.pow=Math.round(t.pow+form);
    t.summitRegion=ccCareerRegion();
    t.name=label; t.mpTag=':'+hKey(card);
    return t;
  };
  let you, mate=null;
  if(two){
    { const self=ccSoloSelf(me); you=soloYou(self.card, self.form, L().yourTeamPrefix+teamLabel(drafted)); }
    mate=soloYou(pc, Number(pc.formPow)||0, teamLabel([pc]));
    mate.isMate=true;
  } else {
    you=careerYouTeam(drafted);
    you.name=L().yourTeamPrefix+teamLabel(drafted);
  }
  you.isYou=true;
  const humans=mate ? (hKey(me)<hKey(pc) ? [you, mate] : [mate, you]) : [you];
  /* Открытая комната бывает только у январского квала: у FNCS Solos карьера
     входит с Round 3, а там поле уже названо самим Epic — сотня, семьдесят в
     LCQ Final. См. CC_SOLOS_STAGES. */
  const spec=ev.spec||null;
  const open=spec ? !!spec.open : ev.stage==='qual';
  const lobbyCr=open ? cr : Object.assign({}, cr, {division:1});
  const size=open ? (spec && spec.fieldScale ? Math.max(200, Math.round(careerVictoryField(true)*spec.fieldScale())) : careerVictoryField(true))
                   : (spec ? spec.field : CC_SOLO_FIELD);
  /* Напарник — в той же сотне, участником: его карточка с провода, его форма,
     без адресных вопросов и без записи его итога — свой итог он считает сам. */
  /* …но только если он на этот этап ДОПУЩЕН. Скриншот (вкладка
     напарника, финал Solo Series): «как сюда попал Malibuca, когда я за него
     играю и он не квальнулся, даже хиты не играл» — Малибука стоял третьим в
     финале, который играл один panzer. Не прошёл в хиты — в хитах и финале
     его нет; отыграл сегодня сам — тоже нет, его сотня уже сыграна. */
  const peerBot=(alone && peerCard && hKey(peerCard)!==hKey(me) && ccSoloPeerSeat(ev, ccSoloStateOf(ev, peerCard)))
    ? soloYou(peerCard, Number(peerCard.formPow)||0, teamLabel([peerCard])) : null;
  /* ИЗ СОТНИ ВЫЧИТАЮТСЯ ОБА человека — и тёзки обоих. Ник человека может
     совпасть с ником настоящего про из ростера (его же Sky и Scroll, 29
     августа): если исключить только себя, у каждого клиента в поле останется
     тёзка напарника, и это одна разная строка из 4900 — «diff 1 of 4900:
     #278 scroll:96 vs sky:96». Сторож — live-two с CC_NICK_A=Sky CC_NICK_B=Scroll. */
  const fieldMine=mate ? [me, pc] : peerBot ? [me, peerCard] : drafted;
  // Прошедшие прошлого этапа из твоей сотни — первыми, сцена добирает остальное. См. ccSoloCarryPut.
  // Общий финал гонки: хиты у каждого свои, перенос из своего хита развёл бы поле. Только общий пул.
  const carried=(open || (typeof ccRaceLock==='function' && ccRaceLock())) ? [] : ccSoloCarryTake(ev,
    fieldMine.concat((typeof ccRaceOn==='function' && ccRaceOn()) ? ccRaceAllCards() : []),
    size-humans.length-(peerBot ? 1 : 0));
  const field=[...humans, ...(peerBot ? [peerBot] : []), ...carried,
               ...careerSoloField(lobbyCr, fieldMine.concat(...carried.map(t=>t.squad||[])),
                                  size-(humans.length-1)-(peerBot ? 1 : 0)-carried.length, open, ev.stage)];

  const kindsForDrop=['solo'];
  const zones=null;
  const games=spec ? spec.games
            : ev.stage==='qual' ? CC_SOLO_QUAL_GAMES
            : ev.stage==='heats' ? CC_SOLO_HEAT_GAMES : CC_SOLO_FINAL_GAMES;
  if(spec && spec.killCap) CC_KILL_CAP=spec.killCap;   // Solo Reload: не больше 10 элимов за матч (правило Epic)
  await simulateGamesLive(field, games,
    (spec && spec.pts) || (ev.stage==='heats' ? soloHeatsPoints : victoryR1Points), spec ? spec.kill : CC_SOLO_KILL,
    'stage', 0, null, zones,
    {twoDay:ev.stage==='final' || !!(spec && spec.twoDay), lobbySize:(spec && spec.reload) ? ccReloadLobby(1) : 100, stageName:ev.label, mapReplay:true, choices:true, stopOnYourDeath:true,
     /* Виктори в хитах — билет, и вечер на нём для тебя кончается: правило Epic
        (см. шапку раздела) и то же stopOnWin, что у хитов Мейджора. Раньше
        победитель первой игры играл все шесть, карточка говорила «прошёл», а
        таблица ставила его 47-м под чертой без пометки. Игрок:
        «I should have qualified with the first game but that way I didn't». */
     stopOnWin: spec ? !!spec.vr : ev.stage==='heats',
     together: mate ? humans : null,
     dropEachGame:(g,room)=>open ? null : ccSoloDrops(room||field, humans, ev.label, kindsForDrop)});
  /* Равные очки — по правилам Epic (сверка 29.10): победы, средние элимы за матч, среднее место; секунд жизни движок не
     хранит, этот последний шаг опущен. Было: победы, затем элимы всего — у сыгравших меньше матчей (победа уводит из хита)
     это занижало их. */
  const avgOf=(t,k)=>{ const l=t.stageLog||[]; return l.length ? l.reduce((x,r)=>x+(r[k]||0),0)/l.length : 0; };
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || avgOf(b,'elims')-avgOf(a,'elims') || avgOf(a,'place')-avgOf(b,'place'));
  /* Прошедшие по победе — НАВЕРХУ (29.10, его «почему я не выше всех в таблице»): у Epic победа в хите давала 947
     сверху, и победитель стоял первым. Бонус снят (см. soloHeatsPoints), поэтому порядок держится отдельно: сначала
     взявшие Виктори этого этапа, потом остальные по очкам. Только показ и место в карточке — кто проходит по
     очкам (cut, ccSolosSeat), считает ranked, как было. */
  const vrStage=spec ? !!spec.vr : ev.stage==='heats';
  const shown=vrStage ? ranked.slice().sort((a,b)=>((b.wins||0)>0)-((a.wins||0)>0)) : ranked;
  const place=shown.indexOf(you)+1;
  careerPrAdd(ranked, {div:cr.division, kind:'solo', stage:ev.stage});
  // Соло играется в несколько вечеров: доска — только на финальном.
  if(ev.stage==='final' || ev.stage==='rlfinal') ccBoardAfter(ranked, you, ev.label);
  const cut=spec ? ccSolosCut(spec)
          : ev.stage==='qual' ? soloSeriesQualCut()
          : ev.stage==='heats' ? soloSeriesHeatCut() : 0;
  /* Куда сел игрок — у FNCS Solos это не «прошёл / не прошёл»: из Fast Track
     уходят все (топ-8 в финал, остальные в хиты), а из хита есть третий выход
     — места 36-50 в LCQ Final. См. ccSolosSeat. */
  const seatOf=spec ? function(t){ return ccSolosSeat(spec, t, ranked); } : null;
  const passOf=function(t){
    if(spec) return seatOf(t)===spec.pass;
    let th=cut ? (ranked.indexOf(t)+1)<=cut : false;
    if(ev.stage==='heats' && (t.wins||0)>0) th=true;
    return th;
  };
  const prizeFn=spec ? (spec.prize||null) : (ev.stage==='final' ? soloSeriesPrize : null);
  // Любое место дальше — проход (Fast Track: 9–100 в хиты, хиты 36–50 — в LCQ Final), не только финал (аудит 29.09).
  const through=spec ? !!seatOf(you) : passOf(you);
  removeSkipButton();

  const shell=createStageCardShell(ev.label+' — '+field.length);
  await revealStageLog(you, shell, true);
  let cash=0;
  const cashOf=function(t){ return prizeFn ? (prizeFn(ranked.indexOf(t)+1)||0) : 0; };
  if(prizeFn){
    careerMoneyAdd(ranked, prizeFn);
    cash=cashOf(you);
    if(cash){ const mine=ccShareOf(cash, you); ccPayIn(mine); }
    careerReachAdd(careerReachResult(place, field.length, 1, 'solo'));
    careerNews(cash?'good':'flat', cash?'ccNewsSoloCash':'ccNewsSoloOut',
               cash?[place, ccNum(cash)]:[ev.label, place, field.length],
               {tbl:ccStageShot(shown, you, CAREER.career.division, ev.label, cut)});
    ccSoloStateSet(ev, me, {got:'final', pass:'final', seat:null});
    if(mate) ccSoloStateSet(ev, pc, {got:'final', pass:'final', seat:null});
  } else {
    const next=function(card, t){
      const was=ccSoloStateOf(ev, card);
      const at=ranked.indexOf(t)+1;
      if(spec){
        const st0=seatOf(t);
        // В хиты Epic раскладывает через одного по месту в Fast Track / Q2 Round 3 (правила, сверка 29.10).
        return {got:ev.stage, seat:st0, day:careerToday(), heat: st0==='heats' ? ((ranked.indexOf(t)+1)%2===1 ? 1 : 2) : null};
      }
      return {got:ev.stage, pass: passOf(t) ? ev.stage : (was && was.pass)||null,
              day:careerToday(),
              best: ev.stage==='qual' ? Math.min(at, (was && was.best)||Infinity) : (was && was.best)||null};
    };
    ccSoloStateSet(ev, me, next(me, you));
    if(mate) ccSoloStateSet(ev, pc, next(pc, mate));
    const soloNext={qual:'heats', heats:'final'};
    ccSoloCarryPut(ev, ranked.filter(t=>humans.indexOf(t)<0 && t!==peerBot)
      .map(t=>[spec ? seatOf(t) : (passOf(t) ? soloNext[ev.stage] : null), t]));
    /* Из Fast Track «не прошёл» не бывает: топ-8 едет в финал, остальные в
       хиты, и это всё равно проход дальше. Строка ленты — по месту, а не по
       отсечке. */
    const moved=spec ? !!seatOf(you) : through;
    careerNews(moved?'good':'flat', moved?'ccNewsSoloThrough':'ccNewsSoloOut',
               [ev.label, place, field.length]);
    // Хиты соло — те же «квальнулся, сажусь туда-то», только в финал. См. ccGrandsCalls.
    if(ev.stage==='heats' && !spec) ccGrandsCalls('finals', you, moved, field.filter(passOf));
  }
  const byVR=(spec ? !!spec.vr : ev.stage==='heats') && (you.wins||0)>0;
  finalizeStageCard(shell, place, field.length, you.stagePts,
    ccStagePassed(through, {cut:cut}, place, prizeFn),
    byVR, byVR ? L().stage2NoteByVR : cut ? (through ? L().ccRelPass(cut) : L().ccRelFail(cut)) : '');
  // Прошедшие — по правилу этапа (виктори тоже), а не только по черте.
  await revealStandings(shell, ranked, you, cut, null, cut ? new Set(field.filter(passOf)) : null,
    prizeFn, null, !!prizeFn);

  cr.log=cr.log||[];
  careerGrowEvent(place, field.length, you, field);
  /* Строка журнала — на КАЖДОГО из людей, с обеих сторон, в одном порядке:
     журнал общий, и две разные строки от двух клиентов перетёрли бы друг
     друга при закрытии. Чужой рейтинг берётся из его карточки. */
  humans.forEach(function(t){
    const places=(t.stageLog||[]).map(g=>g.place);
    const isMe=(t===you);
    const cashT=cashOf(t);
    cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place:ranked.indexOf(t)+1,
                 of:field.length, pts:t.stagePts, passed:passOf(t)||cashT>0,
                 ovr: isMe ? CAREER.player.ovr : Math.round(pc._targetOvr||pc.rating||0),
                 games:games, wins:t.wins||0,
                 elims:t.stageElims||0,
                 avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
                 mate:null, mates:null, prize:ccShareOf(cashT, t),
                 kind:'solo', stage:ev.stage, solo:true,
                 who: mate ? t.mpTag.slice(1) : undefined});
  });
  careerMonthGoalCheck();
  await ccMpClose(ranked);
  if(alone){
    /* Свой итог — напарнику сейчас же (soloBy, журнал, рост), день — только
       когда отыграли оба. Пока не отыграл второй, день стоит, а панель дня
       говорит, что ждём его результат; его push доедет в ccMpApplyRemote и
       шагнёт день оттуда. См. ccSoloTeamSettle. */
    CC_MP_ALONE=false;
    // HOLD после close снимает шаг дня, а его тут может не быть долго (ждём
    // напарника) — и метка на дуо-вечер не уезжала («у тимейта не показывает
    // spot», 30 августа). День идёт только вперёд, держать незачем.
    CC_MP_HOLD=false;
    careerSave();
    if(careerToday()===dayAtStart) ccSoloTeamSettle();
  } else {
    careerAdvanceTo(ccAddDays(careerToday(), 1));
    CC_MP_ALONE=false;
    careerSave();
  }

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0; ccNightSpotOff();
  careerRenderHub('centre');
  careerTwoRoundResultCard({title:ev.label, place:place, through:through||cash>0,
    wins:you.wins||0, cash:cash, cut:cut});
  }finally{
    // Ошибка посреди соло-вечера не должна оставлять вкладке состав из одного и соло-остров.
    try{ CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; useLandingSet(prevSet); CC_KILL_CAP=0; ccNightSpotOff(); }catch(e){}
  }
}
/* Дроп двоих в одном лобби — по очереди, в порядке ников, каждый на свой
   вопрос; комната после первого передаётся второму как есть. */
async function ccSoloDrops(room, humans, title, kinds){
  // Сплит гонки: в этом лобби может не быть никого из своих — тогда спрашиваются соперники в нём (careerLandingPick по адресам).
  const here=humans.filter(h=>(room||[]).indexOf(h)>=0);
  if(here.length<humans.length) humans=here.length ? here : [humans[0]];
  if(humans.length<2) return careerLandingPick(room, humans[0], title, kinds);
  let groups=null;
  for(const h of humans){
    groups=await careerLandingPick(room, h, title, kinds, {tag:h.mpTag, pre:groups});
  }
  return groups;
}

async function runCareerCup(){
  const cr=CAREER.career;
  /* The squad this season is played in, not a duo.

     Every one of these nine runners took the player and one partner and set
     squadSize to two by hand. In a trios season that put a duo in a lobby of
     trios: his own row showed two names beside everybody else's three, the
     lobby was built to the duo count of fifty rather than thirty-three, and
     the labels underneath said duos all night. His report, 20 August.

     careerMates is the seats the season actually has. An incomplete squad does
     not enter at all, which is the rule the day panel already states. */
  const me=careerCard(), mates=careerMates();
  if(!me || mates.length<careerMateSeats() || mates.some(function(m){ return !m; })) return;
  // Командный вечер ждёт напарника. См. ccMpGate.
  const mpStart=ccMpLock() ? await ccMpGate('cup') : null;
  // The first seat, which is what the result records and the feed lines below
  // have always meant by the partner. A trio names the rest through mates.
  const mate=mates[0]||null;

  const prevMode=CARD_MODE, prevSize=squadSize, prevDrafted=drafted;
  CARD_MODE=true; squadSize=careerSquadSize(); drafted=[me].concat(mates);
  // A duo lobby drops on the whole island. The grid is thinned for squads —
  // trimLandingZonesForMode keeps the biggest 52% of the boxes so a four-player
  // lobby is not a wall of rectangles — and it was baked in at page load, when
  // squadSize was still the squad default. Nothing rebuilt it, so every career
  // night was played on a map with seventeen of its thirty-six boxes missing.
  // Rebuilding with squadSize already 2 is what puts the island back.
  useLandingSet(ACTIVE_LANDING_SET);

  // A new event is watched again: the skip a player pressed last night was for
  // last night. CC_SKIP_RUN is what makes one press cover a whole tournament.
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  CAREER_RUN=true;
  show('screen-results');
  ensureSkipButton();

  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  if(CC_AWAY) you.pow=Math.max(1, Math.round(you.pow-CC_AWAY.pen));   // чужой сервер: пинг (ccAwayPen)
  const cut=careerCupCut(cr.division);
  const field=[you, ...careerCupField(cr, drafted, careerCupSize(cr.division), ccCupWeekSalt())];

  // Division 1's Tuesday carries Monday in with it. Keyed by team name, which
  // is stable because the field is: the same seed draws the same duos. Handed
  // to the live stage rather than added after it, so the table on screen is the
  // week's table all evening and the line across it is the real cut.
  const banked=(!CC_AWAY && cr.division===1 && careerCupSession()===2 && cr.d1 &&
                cr.d1.monday===careerMonday(careerToday())) ? cr.d1 : null;
  // Unpacked back into the four maps the field builder already reads, so nothing
  // downstream knows the difference. A Monday banked before the rows were packed
  // is keyed on the row's name and is read as it stands.
  const carry=!banked ? null
            : !banked.rows ? Object.assign({}, banked, {byName:true})
            : Object.assign(ccRelUnpack(banked.rows), {log:banked.log});

  /* Где падать спрашиваем и в дивизионном кубке, перед каждой игрой (dropEachGame),
     а не только в финалах. Без этого 11 игр кубка раскидывали всех случайно и на
     карте нечего было смотреть. Вопрос лежит маленьким окошком на карте, см.
     careerLandingPick. Кубок пишет строки без kind, поэтому в kindsForDrop стоит 'cup'. */
  const kindsForDrop=['cup'];
  const zones=null;
  // Очки — как у кубка дивизиона Epic этого сезона (ccDivCupScore), иначе прежняя таблица.
  const dSc=ccSoloDivCupOn() ? {pts:victoryR1Points, kill:4} : ccDivCupScore(careerToday(), cr.division);
  await simulateGamesLive(field, CAREER_CUP_GAMES, dSc ? dSc.pts : pointsForPlace, dSc ? dSc.kill : 4, 'stage', 0, null, zones,
    {lobbySize:ccTeams(50), stageName:L().ccCupLive, mapReplay:true, choices:true, stopOnYourDeath:true,
     carry:carry, cutAt: (careerBanking() && !CC_AWAY) ? 0 : cut,
     dropEachGame:(g,room)=>careerLandingPick(room||field, you, L().ccCupLive, kindsForDrop)});
  removeSkipButton();

  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1;
  careerPrAdd(ranked, {div:CAREER.career.division});
  const passed=place<=cut;
  // The week's card carries the week's games: Monday's eleven in front of
  // tonight's, renumbered so the list reads 1 to 22 and the running total is
  // the one the table is sorted on.
  if(carry && carry.log && carry.log.length){
    you.stageLog=carry.log.concat((you.stageLog||[]).map(g=>({...g, game:g.game+carry.log.length})));
    // Yours are in the log now, so the carry must not be counted a second
    // time on top of it - every other row still counts theirs off the team.
    you._carryGames=0;
  }

  // On the second evening the card is the week's, not the night's: twenty-two
  // games and the table that decides the Weekly Final.
  const shell=createStageCardShell(carry
    ? L().ccCupTitleWeek(cr.division, field.length, CAREER_CUP_GAMES*2)
    : L().ccCupTitle(cr.division, field.length));
  await revealStageLog(you, shell, true);
  /* ВЫЕЗД (ccAwayPlay): кап дивизиона в чужом регионе — одна сессия, место и рост рейтинга. Перехода между дивизионами,
     путёвки в финал недели и копилки Д1 нет: дивизион у игрока в своём регионе. День не двигается. */
  if(CC_AWAY){
    const regA=CC_AWAY.reg, divA=cr.division, upA=passed && divA>1;
    if(upA){ cr.regDiv=cr.regDiv||{}; cr.regDiv[regA]=divA-1; }
    // Д1 того региона: прошёл отсечку — путёвка в его финал недели (cr.regWf, как cr.wf дома).
    const wfA=passed && divA===1;
    if(wfA){ cr.regWf=cr.regWf||{}; cr.regWf[regA]={monday:careerMonday(careerToday()), cut:ccWfCutKeys(ranked)}; }
    finalizeStageCard(shell, place, field.length, you.stagePts, (upA || wfA) ? true : null, false,
      upA ? L().awDivUp(regionName(regA), divA-1) : wfA ? L().awWfSeat(regionName(regA)) : L().awCupLine(regionName(regA), divA));
    await revealStandings(shell, ranked, you, 0);
    const growthA=careerApplyGrowth(place, field.length, you, field);
    const cashA=ccSoloDivCupPrize(place, divA); if(cashA) ccPayIn(cashA);
    // Прошёл отсечку там — выезд энергии не стоит.
    if(upA || wfA) careerRestore(CC_AWAY_ENERGY);
    const placesA=(you.stageLog||[]).map(g=>g.place);
    cr.log=cr.log||[];
    cr.log.push({season:cr.season, day:careerToday(), div:cr.division, place, of:field.length, pts:you.stagePts, passed:false,
                 ovr:CAREER.player.ovr, games:CAREER_CUP_GAMES, wins:you.wins||0, elims:you.stageElims||0,
                 avg: placesA.length ? Math.round(placesA.reduce((s,v)=>s+v,0)/placesA.length*10)/10 : null,
                 mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:cashA});
    if(Math.round(growthA.after)!==Math.round(growthA.before))
      careerNews(growthA.delta>0?'good':'bad', 'ccNewsRating', [Math.round(growthA.before), Math.round(growthA.after)]);
    careerSave();
    CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
    careerRenderHub('centre');
    if(upA) careerNews('good', 'awNewsDivUp', [regionName(regA), divA-1]);
    careerTwoRoundResultCard({title:L().ccCupLive+' · '+regionName(regA)+' · '+L().awDivD(divA), place, through:upA, wins:you.wins||0, cash:cashA, cut:0});
    return;
  }
  const banking=careerBanking();
  // Над первым дивизионом нет дивизиона: его отсечка — место в Финале недели,
  // и карточка говорит про него, а не про несуществующий токен. Скрин его
  // игрока, 21 августа: «Кубок Дивизиона 1 … токен в дивизион выше».
  finalizeStageCard(shell, place, field.length, you.stagePts, passed, false,
    banking ? L().ccCupBanked
            : passed ? (cr.division===1 ? L().ccCupPassD1(cut) : L().ccCupPass(cut))
                     : (cr.division===1 ? L().ccCupFailD1(cut) : L().ccCupFail(cut)));
  await revealStandings(shell, ranked, you, cut);

  // Division 1's first evening settles nothing: the points are put away and the
  // table they belong to is drawn tomorrow, out of both. Growth, the log, the
  // feed and the ladder all wait for it — a cup is one result, and half of one
  // is not a small result, it is no result.
  if(banking){
    /* One packed row per duo keyed on handles (ccRelPack), like the Opens bank. Keying on t.name stored the
       display markup (flag images, styles), ~377 chars a duo: four maps ~315KB every Monday vs ~40KB for the rest
       of the save, and careerSave swallows the quota error, so saving silently stopped.
       simulateGamesLive reads both shapes (byName branch), so old banked Mondays still open. */
    cr.d1={monday:careerMonday(careerToday()), rows:ccRelPack(field)};
    // Monday's eleven games, kept as they were played: Tuesday's card is the
    // week's card, and a week is twenty-two rows you can read rather than a
    // total with eleven of them missing. Only the player's own log is stored —
    // the field's is a table of points, and nobody reads somebody else's games.
    cr.d1.log=(you.stageLog||[]).map(g=>({game:g.game, place:g.place, elims:g.elims,
                                          pts:g.pts, elimPts:g.elimPts, label:g.label}));
    // Командный вечер закрывает сервер: он же двигает день. См. ccMpClose.
    await ccMpClose(ranked);
    ccAwayHomeDone(careerToday(), 'cup'); careerAdvanceTo(careerAfterSession());
    careerSave();
    CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
    CAREER_RUN=false;
    // Monday settles nothing, but it still has to end somewhere. This branch used
    // to return straight out and leave a Division 1 player standing on the
    // results screen with eleven games behind them and no button in front.
    careerRenderHub('centre');
    careerBankedCard(place, field.length, you.stagePts);
    return;
  }
  if(cr.d1) delete cr.d1;

  const growth=careerApplyGrowth(place, field.length, you, field);
  const morale=careerApplyMorale(place, field.length, passed);
  const from=cr.division;
  const cash=ccSoloDivCupPrize(place, from); if(cash) ccPayIn(cash);
  if(passed && cr.division>1){ cr.division--; careerReachPromote(cr.division); }
  /* In Division 1 the cut gives a seat at Saturday's Weekly Final instead of promotion, stamped with
     this week's Monday so it can't be spent next week.
     The qualified names are stored too: the Final used to draw its own 50 from the pool (first 49 of the
     shuffle, not who finished above the line), so qualifiers like Scroll and Sky were missing from it.
     The field is reproducible from the seed (cr.d1 relies on that), so Saturday rebuilds it and keeps the
     named rows. One string like ccRelPack's row key, ~1KB instead of 315KB of teams. */
  else if(passed) cr.wf={monday:careerMonday(careerToday()),
                         cut:ccWfCutKeys(ranked)};
  // The log is what the history screen reads, and the reference for that screen
  // is a Tracker profile: every event is a row with matches, wins, elims and an
  // average place on it. All of that exists on the team the moment the cup ends
  // and nowhere afterwards, so it is written down here rather than derived later
  // from a placement that cannot remember it.
  const places=(you.stageLog||[]).map(g=>g.place);
  cr.log=cr.log||[];
  cr.log.push({season:cr.season, day:careerToday(), div:from, place, of:field.length,
               pts:you.stagePts, passed, ovr:CAREER.player.ovr,
               // A Division 1 week is one tournament of twenty-two games; the
               // history row is the tournament, the way the standings are.
               games:CAREER_CUP_GAMES*(carry?2:1), wins:you.wins||0, elims:you.stageElims||0,
               avg: places.length ? Math.round(places.reduce((s,v)=>s+v,0)/places.length*10)/10 : null,
               mate: mate ? mate.handle : null, mates: ccLogMates(mates), prize:cash});

  // The feed, built out of the run that just happened. The list is written in
  // reading order and filed backwards, because careerNews puts each line on top
  // — otherwise a week reads bottom-up and the placement, which is the thing
  // that happened, ends up underneath the small talk.
  // A result is seen by people, and how many depends on how loud it was. This
  // runs before the feed is written so the posts below carry the audience the
  // result itself just brought.
  careerReachAdd(careerReachResult(place, field.length, from, 'cup'));

  // The picture everybody posts: the standings, with the poster in them. Five
  // rows and then your own if it fell below them.
  const bare=t=>String(t.name||'').replace(/<[^>]*>/g,'');
  // Окно вокруг того, кто постит, флаги, отсечка — как у всех остальных
  // вечеров (ccStageShot); раньше здесь была своя пятёрка без матчей и элимов.
  const shotOf=(t, cap)=>ccStageShot(ranked, t, from, cap||undefined, cut);

  const winner=ranked[0];
  // Say which it is. In Division 1 a played Monday rides into Tuesday's table,
  // so the number is the week's and the line says so with the games behind it;
  // everywhere else — and on a Tuesday whose Monday was never played — it is
  // one evening, and the plain line is the true one.
  /* Проход в финал недели — в той же строке, что и итог, а не вторым постом.
     Скриншот: «Div 1 Cup, week total: top 5 of 170…» и сразу под
     ним «Top 5 on the week — through to the Weekly Final» от того же
     человека тем же вечером — два почти одинаковых поста. */
  const wfIn=passed && from===1;
  const feed=[carry
    ? [passed?'good':'flat', wfIn ? 'ccNewsResultWeekWf' : 'ccNewsResultWeek',
       wfIn ? [place, field.length, you.stagePts, CAREER_CUP_GAMES*2]
            : [place, field.length, from, you.stagePts, CAREER_CUP_GAMES*2]]
    : [passed?'good':'flat', wfIn ? 'ccNewsResultWf' : 'ccNewsResult',
       wfIn ? [place, field.length, you.stagePts] : [place, field.length, from, you.stagePts]]];
  if(passed && from>1) feed.push(['good', 'ccNewsPromoted', [from-1]]);
  if(Math.round(growth.after)!==Math.round(growth.before))
    feed.push([growth.delta>0?'good':'bad', 'ccNewsRating', [Math.round(growth.before), Math.round(growth.after)]]);
  // The winner posts it themselves — when the winner is somebody. A press line
  // saying who won is a report; a player posting their own screenshot is what
  // actually happens after a cup. But below Division 1 the lobby is the
  // generated ladder, and a stranger the generator named celebrating TOP 1
  // every week is exactly what the user read off the feed: "who are all these
  // people and why are they top 1". A generated name does not get an account.
  const wpairAll=(winner && winner!==you) ? (winner.cards||winner.squad||[]) : [];
  if(wpairAll.length && wpairAll.every(c=>c && c.tier!=='ladder')){
    const wpair=wpairAll;
    const wc=wpair[0], wm=wpair[1];
    feed.push(['good', 'ccPostPlaced', [1, from, wm?ccHandle(wm.handle):null, careerWeek()],
      {by:{name: wc ? wc.handle : ccOneOf(bare(winner)),
           ovr: wc ? (wc._ovr!=null?wc._ovr:(attrsFor(wc)||{}).ovr) : null,
           card: wc ? {handle:wc.handle, region:wc.region||'EU'} : null},
       tbl:shotOf(winner)}]);
  }
  // And so does the player, which is what puts something on their own profile.
  feed.push([place<=ccTeams(CAREER_CUP_CUT)?'good':'flat', 'ccPostPlaced',
    [place, from, mate?ccHandle(mate.handle):null, careerWeek()+1],
    {tbl:shotOf(you)}]);
  // The other half of the duo posts the same night — their account, your tag,
  // the same screenshot. Every week, not only the good ones: your partner
  // posting the result is what a duo's timeline looks like, and below
  // Division 1 they are the one other real account the week has.
  const mateBy=mate ? {name:mate.handle,
    ovr:(mate._ovr!=null?mate._ovr:(attrsFor(mate)||{}).ovr),
    card: mate.region ? {handle:mate.handle, region:mate.region} : null} : null;
  if(mateBy)
    feed.push([passed?'good':'flat', 'ccPostPlaced',
      [place, from, ccHandle(CAREER.player.nick), careerWeek()+2],
      {by:mateBy, tbl:shotOf(you)}]);
  if(morale){
    // The partner speaks for themselves, first person from their own account —
    // the press reporting a Division 4 duo's mood was the feed at its least
    // believable. On the night they walk out, mate is still who walked.
    if(morale.left) feed.push(['bad', 'ccPostMateLeft', [ccHandle(CAREER.player.nick)],
      mateBy ? {by:mateBy} : undefined]);
    else if(morale.move<=-12) feed.push(['bad', 'ccPostMateCross', [],
      mateBy ? {by:mateBy} : undefined]);
    else if(morale.move>=14) feed.push(['good', 'ccPostMateHappy', [ccHandle(CAREER.player.nick)],
      mateBy ? {by:mateBy} : undefined]);
  }
  // The scene's account congratulates the room it covers — winners tagged,
  // the same standings screenshot attached.
  // Кап дивизиона аккаунт сцены больше не поздравляет (16.10, см. careerCongrats) — каждый вечер это шум, не новость.
  // The top of the scale, not a ceiling drawn for this career: the only thing
  // left to say near 99 is that there is nowhere above it.
  if(CAREER_SCALE_TOP-growth.after<=2) feed.push(['flat', 'ccNewsCeiling', [CAREER_SCALE_TOP]]);
  for(let i=feed.length-1;i>=0;i--) careerNews(feed[i][0], feed[i][1], feed[i][2], feed[i][3]);

  careerDmInbound(place, field.length, passed, from);
  careerAcademyStep(place, field.length);
  careerRaiseStep();
  /* Вторая сессия и финал кубка тоже закрываются сервером. Отчёт:
     «две сессии сыграл — после него опять дивижен»: этот путь двигал день без
     закрытия, а в команде такой шаг глух (CC_MP_DAY_DUE) — день стоял, и кубок
     предлагался снова. Сторож: check-mp-close, каждый шаг дня в раннере — после close. */
  await ccMpClose(ranked);
  ccAwayHomeDone(careerToday(), 'cup'); careerAdvanceTo(careerAfterSession());
  // Прошёл отсечку (переход или путёвка в финал недели) — вечер энергии не стоит.
  if(passed) careerRestore(CC_TOURNEY_ENERGY);
  // A free agent hears from clubs after a result, not out of nowhere: the offers
  // are rebuilt on the week you have just moved into.
  // Offers arrive whether or not there is already a club: a signed player is
  // exactly who other clubs want. Declining still quiets them for the season.
  if(ccOffersOpen(place, field.length)){
    CAREER.offers=careerOrgOffers();
    careerOrgOffersToDms();
    // A no is spent once it has been answered by a result.
    if(CAREER.offers && CAREER.offers.length) CAREER.offersDeclined=null;
  }
  careerSave();

  if(passed && from>1) await celebrate(L().celKicker, L().ccCelebPass, L().ccCelebPassSub(from-1), 'gold', 80);

  CARD_MODE=prevMode; squadSize=prevSize; drafted=prevDrafted; CC_KILL_CAP=0;
  careerCupResultCard({place, total:field.length, pts:you.stagePts, passed, from, growth, morale, cash});
}

// What the week did, in the shape the rest of the app uses for a stage card:
// the placement, whether the token came, and which way the rating moved.
function careerCupResultCard(r){
  const cr=CAREER.career;
  const arrow = r.growth.delta>0.05 ? '▲' : r.growth.delta<-0.05 ? '▼' : '=';
  const word  = r.growth.delta>0.05 ? L().ccResGrowthUp
              : r.growth.delta<-0.05 ? L().ccResGrowthDown : L().ccResGrowthFlat;
  const box=document.createElement('div');
  box.className='stage-card '+(r.passed?'pass':'fail');
  box.innerHTML=`<h4>${L().ccResHead} <span class="stage-badge ${r.passed?'pass':'fail'}">${ccTopC(r.place)}</span></h4>
    <div class="stage-detail">
      <div>${r.passed ? (r.from>1 ? L().ccResPromoted(r.from-1) : L().ccResWfIn)
                       : L().ccResStay(r.from)}</div>
      <div>${L().ccResGrowth}: ${Math.round(r.growth.before)} ${arrow} ${CAREER.player.ovr} — ${word}</div>
      <div>${L().ccResEarned}: ${r.cash ? ccMoney(r.cash) : cr.division===1 ? L().ccResD1NoFinal : L().ccResNoMoney}</div>
      ${r.morale ? `<div>${L().ccResPartner}: ${r.morale.left ? ccSay('ccNewsPartnerLeft', r.morale.name)
          : L()[careerMoodKey(r.morale.after)]+' ('+r.morale.before+' '+(r.morale.move>=0?'▲':'▼')+' '+r.morale.after+')'}</div>` : ''}
      ${cr.seasonOver?`<div>${L().ccSeasonOver} — ${L().ccSeasonOverSub}</div>`:''}
      ${ccNightRateLine()}
    </div>
    <div style="margin-top:12px;"><button class="go-btn" style="margin:0;width:auto;padding:10px 20px;"
      onclick="careerBackToHub()">${L().ccBackToHub}</button></div>`;
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}

/* The last card of a two-round night, and the way back off the results screen.

   The divisional cup has had one since it was written. The Performance
   Evaluation never did — it finished its second round, redrew the hub behind
   the results screen and left the player looking at standings with no button
   on them. That is the same reason nobody ever reached the evaluation: it was
   written and never played. The Victory Cup takes the same shape, so both use
   this. */
/* Победа — это не вылет.

   Скрин игрока, 21 августа: топ-1 из 33 в финале Мейджора 2, двенадцать
   матчей, победа, $120 000 — и красная плашка «ВЫЛЕТ» над этой строкой.

   Плашку рисовал through, а through считается от отсечки: place<=st.cut. У
   финала отсечки нет и быть не может, он последний, — cut там ноль, значит
   выражение ложно всегда, значит любой финал был вылетом, включая выигранный.
   То же самое стояло и на финале Саммита.

   У этапа с отсечкой ничего не меняется: прошёл её или не прошёл. У финала
   вопрос другой — заплатил ли вечер, — и так его уже считает
   careerTwoRoundResultCard (through||cash>0). Просто карточка этапа, которая
   рисуется раньше, об этом не знала. */
function ccStagePassed(through, st, place, prize){
  if(st && st.cut) return through;
  return typeof prize==='function' ? prize(place)>0 : !!through;
}
function careerTwoRoundResultCard(r){
  const box=document.createElement('div');
  box.className='stage-card '+(r.through?'pass':'fail');
  /* Кап в один раунд (дейли, соло-капы 2019–20, капы 2021 — ccCupRounds) отсечки не
     имеет: cut 0. Строки «мимо топ-0 — раунд 2 без тебя» и «ниже Дивизиона 1 призовых
     нет» там врали — второго раунда нет, дивизионов в те годы тоже. */
  // Кап, который платит за место (таблица, ЛАН, один раунд), — «место — $», а не «N побед — $».
  const line = r.placed ? L().lfNewsPlaced(r.placed)
             : r.cash ? (r.byPlace ? L().ccVicPlaceCash(r.place, r.cash) : L().ccVicCash(r.wins, r.cash))
             : r.through ? L().ccVicNoWin
             : r.cut ? L().ccVicFail(r.cut) : '';
  box.innerHTML=`<h4>${esc(r.title)} <span class="stage-badge ${r.through?'pass':'fail'}">${ccTopC(r.place)}</span></h4>
    <div class="stage-detail">
      ${line ? `<div>${line}</div>` : ''}
      ${r.placed ? '' : `<div>${L().ccResEarned}: ${r.cash ? ccMoney(r.cash) : r.cut && !r.through && !ccNoDivisions() && CAREER.career.division>1 ? L().ccResNoMoney : ccMoney(0)}</div>`}
      <div>${L().chEarnings}: ${ccMoney(CAREER.career.earnings||0)}</div>
      ${ccNightRateLine()}
    </div>
    <div class="stage-actions"><button class="btn-primary"
      onclick="careerBackToHub()">${L().ccBackToHub}</button></div>`;
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
// What Monday looks like when Monday is half of a table.
// head/games — whose first session this was. The divisional cup's Monday says
// Tuesday decides the table; the Opens' first evening says the second session
// decides the cut, and carries its own game count.
function careerBankedCard(place, of, pts, head, games){
  const box=document.createElement('div');
  box.className='stage-card';
  box.innerHTML='<h4>'+esc(head||L().ccCupBanked)+' <span class="stage-badge">#'+place+'</span></h4>'+
    '<div class="stage-detail">'+
      '<div>'+L().ccBankedSoFar(place, of, pts)+'</div>'+
      '<div>'+L().ccBankedCarry(pts, games||CAREER_CUP_GAMES)+'</div>'+
      '<div>'+L().ccBankedNext+'</div>'+
    '</div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="careerBackToHub()">'+
      L().ccBackToHub+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  ccAwayAfterAppend(box);   // поздние регионы этого вечера — кнопками прямо на итоге
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
/* ВНЕ mgr.js (его вопрос 8.10 «почему с debug пропала карьера менеджера»): показ секции жил внутри ленивого mgr.js,
   а тот грузится только после входа в менеджер — кнопка не появлялась никогда.
   Только debug (его слово 2.10: «fortnite manager не надо деплоить»). Вход виден на debug.fncsdraft.pages.dev,
   localhost и с диска; на fncsdraft.com, fncsdraft.pages.dev и зеркале GitHub секции нет. */
// 8.10 вечер — его слово «я хочу уже задеплоить карьеру менеджера»: режим открыт на всех адресах, включая fncsdraft.com.
function mgrAllowed(host){ return true; }
setTimeout(()=>{ try{ if(!mgrAllowed()) return; document.querySelectorAll('.hero-mgr, .hero-mgr-btn, .nav-pill[data-nav="manager"]').forEach(el=>{ el.hidden=false; }); }catch(e){} }, 0);
/* ГЛАВНАЯ 15.10: «Продолжить» по сохранениям, «Сцена сейчас» по настоящему календарю 2026 и «Игроки сайта».
   Рисуется из ccHeroCareerText — то есть на загрузке, на смене языка и при каждом возврате на главную. */
let HOME_BOARD=null, HOME_BOARD_ALL=false, HOME_BOARD_SORT=null, HOME_BOARD_LIST=null;
function homeRender(){
  try{ homeDailyDraw(); }catch(e){}
  try{ homeSceneDraw(); }catch(e){}
  try{ homeTimerDraw(); }catch(e){}
  try{ homeBoardDraw(); }catch(e){}
  try{ homeRealDraw(); }catch(e){}
  try{ homeLiveTabs(); }catch(e){}
}
function homeDate(k, noYear){
  if(!k) return '';
  const o={day:'numeric', month:'short', timeZone:'UTC'}; if(!noYear) o.year='numeric';
  try{ return new Date(k+'T12:00:00Z').toLocaleDateString(LANG==='ru' ? 'ru-RU' : LANG, o); }catch(e){ return k; }
}
function homeToday(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
/* Только настоящие события Epic: Кубок наций — выдумка режима, Про-Амы в Париже и Сеуле — наши города (см. CAREER_YEAR). */
const HOME_SCENE_SKIP={ProAm_Paris:1, ProAm_Seoul:1};
/* Ближайшие призовые турниры не из календаря карьеры (16.10: «в расписании чёт мало турниров»). Источник — Liquipedia,
   Portal:Tournaments, все таблицы «Upcoming» (S/A/B, C, D, отборы, шоу-матчи), снято 16.10.2026; оставлены только с призовыми.
   Капы одной недели в разных регионах — одна строка (p: [[регион, $]…]). Финалы FNCS Solos отсюда дают фонды регионов,
   которых нет в CC_SOLOS_PRIZES-подписи (BR, ASIA, ME, OCE). Обновлять тем же запросом (api.php?action=parse&page=Portal:Tournaments). */
const HOME_SCHED_LQ=[{"n":"Exposing UNREAL Players Stats with Clix!","f":"2026-07-24","t":"2026-07-24","tier":"Show Matches","loc":"North America","p":[["",780,"Clix"]]},{"n":"Red Bull Reshuffle","f":"2026-08-15","t":"2026-08-15","tier":"Show Matches","loc":"Vienna","p":[["",57837,"Juu"]]},{"n":"Inoxtag BACK TO OG Invitational","f":"2026-10-24","t":"2026-10-24","tier":"Show Matches","loc":"Paris","p":[["",112023,"Toinelag & Unchained"]]},{"n":"TCS eSports League: 2026 #3","f":"2026-11-11","t":"2026-11-30","tier":"C-Tier","loc":"Europe","p":[["",10433,"Maxiking"]]},{"n":"FNCS 2026 Reload: EU - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"Europe","p":[["",223500]]},{"n":"FNCS 2026 Reload: NAC - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"North America","p":[["",158250]]},{"n":"FNCS 2026 Reload: NAW - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"North America","p":[["",60750]]},{"n":"FNCS 2026 Reload: Brazil - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"Brazil","p":[["",60750]]},{"n":"FNCS 2026 Reload: Oceania - Grand Finals","f":"2026-11-21","t":"2026-11-21","tier":"S-Tier","loc":"Oceania","p":[["",28400]]},{"n":"C7MS1: Trios Cash Cup - Week 3","f":"2026-11-22","t":"2026-11-22","tier":"C-Tier","loc":"","p":[["OCE",3000],["ME",3000]]},{"n":"C7MS1: Arena Cash Cup - Week 2","f":"2026-11-24","t":"2026-11-24","tier":"D-Tier","loc":"","p":[["OCE",600],["ME",600]]},{"n":"Complete League - Fall Duo #2","f":"2026-11-25","t":"2026-12-09","tier":"D-Tier","loc":"Norway","p":[["",847]]},{"n":"C7MS1: Evaluation Cup - Week 4: NA Central","f":"2026-11-26","t":"2026-11-26","tier":"C-Tier","loc":"North America","p":[["",4800]]},{"n":"C7MS1: Evaluation Cup - Week 4","f":"2026-11-26","t":"2026-11-26","tier":"C-Tier","loc":"","p":[["EU",4800]]},{"n":"C7MS1: Arena Fight Night - Week 4","f":"2026-11-27","t":"2026-11-27","tier":"D-Tier","loc":"","p":[["BR",1000]]}];
/* Недавние турниры с победителями (Portal:Tournaments, «Most recent»): p = [[регион, $, победитель]…]. Пишет tools/refresh-home-data.js. */
const HOME_RECENT_LQ=[{"n":"Inoxtag BACK TO OG Invitational","f":"2026-10-24","t":"2026-10-24","tier":"Show Matches","loc":"Paris","p":[["",112023,"Toinelag & Unchained"]]},{"n":"Complete League - Fall Duo #1","f":"2026-11-04","t":"2026-11-18","tier":"D-Tier","loc":"Norway","p":[["",869]]},{"n":"C7MS1: Trios Cash Cup - Week 2","f":"2026-11-14","t":"2026-11-14","tier":"C-Tier","loc":"","p":[["OCE",3000,"Vazen & Tinka & Mace"],["ME",3000,"Kalgamer710 & Henchman & Bd"],["ASIA",3000,"Bot & tomat & Jaemon"]]},{"n":"Blitz Duo CoEd Cup","f":"2026-11-16","t":"2026-11-16","tier":"D-Tier","loc":"Europe","p":[["",200,"Syaaz & Jasmina"]]},{"n":"Staff x Player Invitational Cup","f":"2026-11-18","t":"2026-11-18","tier":"D-Tier","loc":"Europe","p":[["",220,"Rafa & Prxzen"]]}];
/* ТАЙМЕР ДО БЛИЖАЙШЕГО ТУРНИРА EPIC (16.10, его «4»). Окна — выгрузка Epic по Европе (страницы событий Tracker, imp_event.Windows,
   снято 16.10.2026 через его Chrome; время UTC, как отдаёт Epic), с 15.10. Показывается по часам браузера. Окно считается идущим три часа
   с начала — у Epic столько длится раунд капа; у FNCS «Смотреть» ведёт на официальный канал Fortnite. */
const HOME_WINDOWS=[["2026-10-15T16:00","S42_PerformanceEvaluation_Event8Round1_EU"],["2026-10-15T19:00","S42_PerformanceEvaluation_Event8Round2_EU"],["2026-10-16T17:00","S42_ReloadCashCup_DuosZB_Event5Round2_EU"],["2026-10-16T17:00","S42_ReloadSoloVictoryCup_Event4_Round1_EU"],["2026-10-16T20:00","S42_ReloadSoloVictoryCup_Event4_Round2_EU"],["2026-10-17T13:00","S42_FNCSSolo_HeatsStage_Heat1_EU"],["2026-10-17T16:00","S42_MobileVictoryCup_Event5_Round1_EU"],["2026-10-17T17:00","S42_ConsoleVCC_SolosZB_Event7Round1_EU"],["2026-10-17T17:00","S42_RankedCupDuos_Event7_EU"],["2026-10-17T17:00","S42_RankedCupDuos_ZB_Event7_EU"],["2026-10-17T18:00","S42_MobileVictoryCup_Event5_Round2_EU"],["2026-10-17T20:00","S42_ConsoleVCC_SolosZB_Event7Round2_EU"],["2026-10-18T13:00","S42_ReloadCashCup_DuosZB_Event6Round1_EU"],["2026-10-18T13:00","S42_FNCSSolo_HeatsStage_Heat2_EU"],["2026-10-18T13:00","S42_ArenaTestCup_Event8_EU"],["2026-10-18T16:00","S42_ChampionTealKnightFNCSCup_Mobile_EU"],["2026-10-18T17:00","S42_ChampionTealKnightFNCSCup_EU"],["2026-10-18T17:00","S42_ChampionTealKnightFNCSCup_ZB_EU"],["2026-10-18T17:00","S42_RankedCupReloadDuos_Event7_EU"],["2026-10-18T17:00","S42_RankedCupReloadDuos_ZB_Event7_EU"],["2026-10-19T17:00","S42_FNCSSolo_LastChanceQualifier_EU"],["2026-10-19T17:00","S42_RankedCupSolo_Event8_EU"],["2026-10-19T17:00","S42_RankedCupSolo_ZB_Event8_EU"],["2026-10-20T17:00","S42_FNCSSolo_LastChanceLobby_EU"],["2026-10-20T17:00","S42_RankedCupSoloReload_Event8_EU"],["2026-10-20T17:00","S42_RankedCupSoloReload_ZB_Event8_EU"],["2026-10-22T16:00","S42_PerformanceEvaluation_Event9Round1_EU"],["2026-10-22T19:00","S42_PerformanceEvaluation_Event9Round2_EU"],["2026-10-23T17:00","S42_ReloadCashCup_DuosZB_Event6Round2_EU"],["2026-10-23T17:00","S42_ReloadSoloVictoryCup_Event5_Round1_EU"],["2026-10-23T20:00","S42_ReloadSoloVictoryCup_Event5_Round2_EU"],["2026-10-23T22:00","S42_BOG_DAY1_EU"],["2026-10-24T17:00","S42_ConsoleVCC_SolosZB_Event8Round1_EU"],["2026-10-24T17:00","S42_RankedCupDuos_Event8_EU"],["2026-10-24T17:00","S42_RankedCupDuos_ZB_Event8_EU"],["2026-10-24T20:00","S42_ConsoleVCC_SolosZB_Event8Round2_EU"],["2026-10-24T22:00","S42_BOG_DAY2_EU"],["2026-10-25T18:00","S42_RankedCupReloadDuos_Event8_EU"],["2026-10-25T18:00","S42_RankedCupReloadDuos_ZB_Event8_EU"],["2026-10-26T18:00","S42_FNCSSolo_Final_Day1_EU"],["2026-10-27T18:00","S42_FNCSSolo_Final_Day2_EU"]];
const HOME_LIVE_MS=3*3600e3;
// Постер окна — те же постеры, что у таких турниров в карьере: FNCS Solos, Reload-кап (c41r), Victory Cup соло/дуо (c38s/c38d), Cash Cup (c25d).
function homeWinArt(k){
  if(/FNCSSolo/.test(k)) return 'art/fncs-solo.jpg';
  if(/Reload/.test(k)) return 'art/cups/c41r.jpg';
  if(/Victory|VCC/.test(k)) return /Duo/.test(k) ? 'art/cups/c38d.jpg' : 'art/cups/c38s.jpg';
  if(/CashCup/.test(k)) return 'art/cups/c25d.jpg';
  return 'art/fncs-2026.jpg';
}
function homeWinName(k){
  const r=(k.match(/Round(\d)/)||[])[1], ev=(k.match(/Event(\d+)/)||[])[1];
  const rnd=r ? ' · Round '+r : '';
  if(/FNCSSolo_HeatsStage_Heat(\d)/.test(k)) return 'FNCS Solos · Heat '+k.match(/Heat(\d)/)[1];
  if(/FNCSSolo_Final_Day(\d)/.test(k)) return 'FNCS Solos · Final · Day '+k.match(/Day(\d)/)[1];
  if(/FNCSSolo_LastChance/.test(k)) return 'FNCS Solos · Last Chance';
  if(/ReloadSoloVictoryCup/.test(k)) return 'Reload Solo Victory Cup'+rnd;
  if(/ReloadCashCup_DuosZB/.test(k)) return 'Reload Duo Cash Cup (ZB)'+rnd;
  if(/ConsoleVCC_SolosZB/.test(k)) return 'Console Victory Cash Cup (ZB)'+rnd;
  if(/MobileVictoryCup/.test(k)) return 'Mobile Victory Cup'+rnd;
  if(/RankedCupReloadDuos/.test(k)) return 'Ranked Reload Cup · Duos'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/RankedCupSoloReload/.test(k)) return 'Ranked Reload Cup · Solo'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/RankedCupDuos/.test(k)) return 'Ranked Cup · Duos'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/RankedCupSolo/.test(k)) return 'Ranked Cup · Solo'+(/_ZB/.test(k) ? ' (ZB)' : '');
  if(/PerformanceEvaluation/.test(k)) return 'Performance Evaluation'+rnd;
  if(/ChampionTealKnightFNCSCup/.test(k)) return 'Teal Knight FNCS Cup'+(/_Mobile/.test(k) ? ' · Mobile' : /_ZB/.test(k) ? ' (ZB)' : '');
  if(/ArenaTestCup/.test(k)) return 'Arena Test Cup';
  if(/BOG_DAY(\d)/.test(k)) return 'BOG · Day '+k.match(/BOG_DAY(\d)/)[1];
  return k.replace(/^S\d+_/, '').replace(/_EU$/, '').replace(/_/g, ' ');
}
function homeTimerPick(now){
  const at=w=>Date.parse(w[0]+':00Z');
  // ZB-двойник того же кубка в ту же минуту — одна строка.
  const live=HOME_WINDOWS.filter(w=>at(w)<=now && now<at(w)+HOME_LIVE_MS);
  const next=HOME_WINDOWS.find(w=>at(w)>now);
  return {live:live.filter((w,i)=>!/_ZB/.test(w[1]) || !live.some((v,j)=>j!==i && v[0]===w[0] && v[1]===w[1].replace('_ZB',''))), next, at};
}
let HOME_TIMER_T=null;
function homeTimerDraw(){
  const box=document.getElementById('homeTimer'); if(!box) return;
  const T=L(), now=Date.now(), p=homeTimerPick(now);
  if(!p.next && !p.live.length){
    /* Окна Epic с точным временем кончились (их снимают со страниц Tracker руками) — тогда ближайший турнир Epic из
       расписания Liquipedia, с точностью до дня: «через N дней», без секунд, которых мы не знаем. */
    const today=homeToday(), EPIC=/Cash Cup|Victory Cup|Reload Elite|FNCS|Eval|Performance Evaluation|Ranked Cup/i;
    const x=(typeof HOME_SCHED_LQ!=='undefined' ? HOME_SCHED_LQ : []).find(e=>e.f>today && EPIC.test(e.n));
    if(!x){ box.hidden=true; return; }
    const days=Math.round((Date.parse(x.f+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5);
    box.innerHTML='<span class="ht-lbl">'+esc(T.hmTimerNext)+'</span><img class="ht-img" src="'+homeWinArt(x.n.replace(/\s/g, ''))+'" alt="" onerror="this.remove()">'+
      '<b>'+esc(x.n)+'</b><span class="ht-when">'+esc(homeDate(x.f, true))+'</span><span class="ht-cd">'+esc(days===1 ? T.hmTimerTomorrow : T.hmSceneIn(days))+'</span>';
    box.hidden=false; return;
  }
  const loc=LANG==='ru' ? 'ru-RU' : LANG;
  const clock=ms=>{ try{ return new Date(ms).toLocaleTimeString(loc, {hour:'2-digit', minute:'2-digit'}); }catch(e){ return ''; } };
  const dayWord=ms=>{ const d=new Date(ms), t=new Date(); const k=x=>x.getFullYear()+'-'+x.getMonth()+'-'+x.getDate();
    if(k(d)===k(t)) return T.hmTimerToday; t.setDate(t.getDate()+1); if(k(d)===k(t)) return T.hmTimerTomorrow;
    try{ return d.toLocaleDateString(loc, {weekday:'short', day:'numeric', month:'short'}); }catch(e){ return ''; } };
  let html='';
  if(p.live.length){
    const w=p.live.find(x=>/FNCS/.test(x[1])) || p.live[0], fncs=/FNCS/.test(w[1]);
    html+='<img class="ht-img" src="'+homeWinArt(w[1])+'" alt="" onerror="this.remove()"><span class="ht-live">'+esc(T.hmTimerLive)+'</span><b>'+esc(homeWinName(w[1]))+'</b>'+
      (fncs ? '<a class="ht-watch" href="https://www.twitch.tv/fortnite" target="_blank" rel="noopener">'+esc(T.hmTimerWatch)+'</a>' : '');
  }
  if(p.next){
    const ms=p.at(p.next), left=Math.max(0, ms-now);
    const d=Math.floor(left/864e5), h=Math.floor(left/36e5)%24, m=Math.floor(left/6e4)%60, sec=Math.floor(left/1e3)%60;
    const two=x=>String(x).padStart(2,'0');
    html+=(p.live.length ? '<span class="ht-sep"></span>' : '<span class="ht-lbl">'+esc(T.hmTimerNext)+'</span>')+
      '<img class="ht-img" src="'+homeWinArt(p.next[1])+'" alt="" onerror="this.remove()"><b>'+esc(homeWinName(p.next[1]))+'</b><span class="ht-when">'+esc(dayWord(ms))+' · '+esc(clock(ms))+'</span>'+
      '<span class="ht-cd">'+(d ? d+T.hmDayShort+' ' : '')+two(h)+':'+two(m)+':'+two(sec)+'</span>';
  }
  box.innerHTML=html; box.hidden=false;
  // Секундная стрелка — только пока главная на экране.
  clearTimeout(HOME_TIMER_T);
  HOME_TIMER_T=setTimeout(()=>{ const sc=document.getElementById('screen-mode'); if(sc && sc.classList.contains('active')) homeTimerDraw(); else HOME_TIMER_T=null; }, 1000);
}
/* Победители турниров Epic, кончившихся за последние три дня (16.10, «победители после турнира»). */
function homeRecentHTML(T, today, EPIC){
  const from=new Date(Date.parse(today+'T00:00:00Z')-3*864e5).toISOString().slice(0,10);
  const list=(typeof HOME_RECENT_LQ!=='undefined' ? HOME_RECENT_LQ : []).filter(x=>x.t<today && x.t>=from && EPIC.test(x.n) && x.p.some(p=>p[2]));
  if(!list.length) return '';
  const rows=list.slice().reverse().map(x=>{
    const art=/FNCS/i.test(x.n) ? 'art/fncs-solo.jpg' : homeWinArt(x.n.replace(/\s/g, ''));
    const won=x.p.filter(p=>p[2]).map(p=>(p[0] ? p[0]+': ' : '')+p[2]).join(' · ');
    const dates=homeDate(x.f, true)+(x.t!==x.f ? ' – '+homeDate(x.t, true) : '');
    return '<li class="hs-li"><img src="'+art+'" alt="" onerror="this.remove()"><div><b>'+esc(x.n)+'</b><span>'+esc(dates)+'</span><span class="hs-pm">🏆 '+esc(won)+'</span></div></li>';
  }).join('');
  return '<b class="hs-other">'+esc(T.hmSceneRecent)+'</b><ul class="hs-st hs-list">'+rows+'</ul>';
}
function homeSceneDraw(){
  const box=document.getElementById('homeScene'); if(!box) return;
  const T=L(), today=homeToday(), names=T.ccYearNames||{};
  const seen={}, list=[];
  CAREER_YEAR.slice().sort((a,b)=>a[0]<b[0] ? -1 : a[0]>b[0] ? 1 : 0).forEach(r=>{
    const from=r[0], to=r[1], id=r[2], kind=r[3];
    if(kind==='nations' || HOME_SCENE_SKIP[id] || to<today || seen[id]) return;
    seen[id]=1; list.push({from, to, id});
  });
  /* Стадии одного турнира — одной карточкой (15.10: три одинаковые обложки FNCS Solos подряд). Турнир — id без стадии:
     FNCSSolos_Heats → FNCSSolos, ReloadEliteSeries3PlayIn → ReloadEliteSeries3. */
  const fam=id=>id.replace(/_.*$/, '').replace(/(Opens|PlayIn|Heats|Final)$/, '');
  const groups=[];
  list.forEach(e=>{ const f=fam(e.id), g=groups.find(x=>x.f===f); if(g) g.items.push(e); else groups.push({f, items:[e]}); });
  /* Все ближайшие призовые турниры года, со всеми стадиями (15.10: «больше расписания», «все призовые турниры ближайшие»).
     Призовые — таблицы Epic, что уже лежат в карьере: FNCS Solos — CC_SOLOS_PRIZES; про остальное Epic пока молчит. */
  const pool=t=>{ let sum=0, prev=0; (t||[]).forEach(r=>{ sum+=(r[0]-prev)*r[1]; prev=r[0]; }); return sum; };
  const prizeOf=f=>{
    if(f==='FNCSSolos' && typeof CC_SOLOS_PRIZES!=='undefined')
      return ['EU','NAC'].map(r=>T.hmScenePrize(r, ccNum(CC_SOLOS_PRIZES[r][0][1]), ccNum(pool(CC_SOLOS_PRIZES[r]))))
        .concat((HOME_SCHED_LQ.find(x=>/^FNCS Solos/.test(x.n))||{p:[]}).p.length ? [(HOME_SCHED_LQ.find(x=>/^FNCS Solos/.test(x.n))).p.map(p=>p[0]+' $'+ccNum(p[1])).join(' · ')] : []);
    return [];
  };
  const rows=groups.map(g=>{
    const first=g.items[0];
    const full=id=>String(names[id]||id).replace(/\s*·?\s*\{CITY\}/, '');
    const title=full(first.id).split(' · ')[0];
    const art=(typeof CAREER_EV_ART_ID!=='undefined' && CAREER_EV_ART_ID[first.id]) || 'art/fncs-2026.jpg';
    const money=prizeOf(g.f);
    const stages=g.items.map(e=>{
      const live=e.from<=today;
      const days=Math.round((Date.parse(e.from+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5);
      const when=live ? T.hmSceneLive : days===1 ? T.hmSceneTomorrow : T.hmSceneIn(days);
      const stage=full(e.id).split(' · ').slice(1).join(' · ') || full(e.id);
      const dates=homeDate(e.from, true)+(e.to!==e.from ? ' – '+homeDate(e.to, true) : '');
      return '<li'+(live ? ' class="live"' : '')+'><b>'+esc(stage)+'</b><span><i>'+esc(when)+'</i> · '+esc(dates)+'</span></li>';
    }).join('');
    return '<div class="hs-ev"><img src="'+esc(art)+'" alt="" loading="lazy" onerror="this.remove()"><div>'+
      '<b class="hs-t">'+esc(title)+'</b>'+money.map(m=>'<span class="hs-money">'+(ccUiClassic() ? '💰 ' : '')+esc(m)+'</span>').join('')+'<ul class="hs-st">'+stages+'</ul></div></div>';
  }).join('');
  // Другие турниры с призовыми — Liquipedia; только те, что ещё не кончились.
  // Только турниры Epic (16.10: «пусть будут турниры от Epic только»): капы Epic и FNCS; сторонние лиги, лестницы и кубки — нет.
  const EPIC=/Cash Cup|Victory Cup|Reload Elite|FNCS|Fortnite Champion Series|Eval Cup|Performance Evaluation/i;
  const other=HOME_SCHED_LQ.filter(x=>x.t>=today && !/^FNCS Solos/.test(x.n) && EPIC.test(x.n)).map(x=>{
    const live=x.f<=today, days=Math.round((Date.parse(x.f+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/864e5);
    const when=live ? T.hmSceneLive : days===1 ? T.hmSceneTomorrow : T.hmSceneIn(days);
    const dates=homeDate(x.f, true)+(x.t!==x.f ? ' – '+homeDate(x.t, true) : '');
    const money=x.p.map(p=>(p[0] ? p[0]+' ' : '')+'$'+ccNum(p[1])).join(' · ');
    // Постер капа — тот же, что у капов этого вида в карьере (CAREER_EV_ART_ID: c41r — Reload, c38d — Victory Cup, c25d — Cash Cup).
    const art=/Reload/i.test(x.n) ? 'art/cups/c41r.jpg' : /Victory/i.test(x.n) ? 'art/cups/c38d.jpg' : 'art/cups/c25d.jpg';
    return '<li class="hs-li'+(live ? ' live' : '')+'"><img src="'+art+'" alt="" onerror="this.remove()"><div><b>'+esc(x.n)+(x.tier ? ' <em>'+esc(x.tier)+'</em>' : '')+'</b>'+
      '<span><i>'+esc(when)+'</i> · '+esc(dates)+(x.loc ? ' · '+esc(x.loc) : '')+'</span><span class="hs-pm">'+(ccUiClassic() ? '💰 ' : '')+esc(money)+'</span></div></li>';
  }).join('');
  // Таймер до ближайшего турнира — здесь же, в колонке сцены (16.10: «пусть таймер будет где scene»); заполняет homeTimerDraw.
  box.innerHTML='<h2 class="home-h">'+esc(T.hmSceneTitle)+'</h2><p class="home-sub">'+esc(T.hmSceneSub2)+'</p><div class="home-timer" id="homeTimer" hidden></div>'+
    (rows ? '<div>'+rows+'</div>' : '<p class="home-sub">'+esc(T.hmSceneDone)+'</p>')+
    (other ? '<b class="hs-other">'+esc(T.hmSceneOther)+'</b><ul class="hs-st hs-list">'+other+'</ul>' : '')+homeRecentHTML(T, today, EPIC);
  box.hidden=false;
}
/* РЕЗУЛЬТАТЫ 2026 на главной (15.10, «а таблицу лидеров и реальные турниры»): настоящие итоги прошедших турниров года.
   Ничего нового не выдумано — это те же таблицы, по которым считаются карточки: финалы Мейджоров (Tracker, по регионам,
   с очками), Саммит и Антверпен (места по никам из рейтинга карточек, FD_SUMMIT_RANK / FD_GC26_RANK), Reload Championship
   (Liquipedia, с призовыми). Призовые Антверпена — таблица Epic GC2026_PRIZES. */
let HOME_REAL_OPEN=null, HOME_REAL_REG='EU';
const HOME_REAL_REGS=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
function homeRealRaw(stage, reg){
  try{
    if(stage===1) return ({EU:CARD_M1_GF_RAW, NAC:CARD_N1_GF_RAW, NAW:CARD_W1_GF_RAW, BR:CARD_B1_GF_RAW, ASIA:CARD_A1_GF_RAW, ME:CARD_E1_GF_RAW, OCE:CARD_O1_GF_RAW})[reg]||null;
    return ({EU:CARD_M2_GF_RAW, NAC:CARD_N2_GF_RAW, NAW:CARD_W2_GF_RAW, BR:CARD_B2_GF_RAW, ASIA:CARD_A2_GF_RAW, ME:CARD_E2_GF_RAW, OCE:CARD_O2_GF_RAW})[reg]||null;
  }catch(e){ return null; }
}
// Места по нику → команды: одно место — одна пара; второе написание того же ника (NOCIF/Nociff, ふーくん) не считается.
function homeRankTeams(rank){
  const flat=[], add=(o, reg)=>Object.keys(o||{}).forEach(h=>flat.push({h, p:o[h], reg}));
  const nested=rank && Object.keys(rank).length && Object.values(rank).every(v=>v && typeof v==='object');
  if(nested) Object.keys(rank).forEach(r=>add(rank[r], r)); else add(rank, null);
  const by={};
  flat.forEach(x=>{
    if(!/^[\x20-\x7e]+$/.test(x.h)) return;
    const t=by[x.p]=by[x.p]||{p:x.p, reg:x.reg, names:[]};
    const lo=x.h.toLowerCase();
    if(t.names.length<2 && !t.names.some(n=>{ const m=n.toLowerCase(); return m===lo || m.indexOf(lo)===0 || lo.indexOf(m)===0; })) t.names.push(x.h);
  });
  return Object.values(by).sort((a,b)=>a.p-b.p);
}
function homeRealEvents(){
  const N=L().ccYearNames||{};
  const nm=(id, city)=>String(N[id]||id).replace(/\{CITY\}/, city||'').replace(/\s*·\s*$/, '');
  const when=id=>{ const r=CAREER_YEAR.find(x=>x[2]===id); return r ? {from:r[0], to:r[1]} : null; };
  const art=id=>(typeof CAREER_EV_ART_ID!=='undefined' && CAREER_EV_ART_ID[id]) || 'art/fncs-2026.jpg';
  const ev=[];
  if(typeof window!=='undefined' && window.FD_GC26_RANK)
    ev.push({id:'gc26', key:'GlobalChampionship', name:nm('GlobalChampionship', 'Antwerp'),
      rows:()=>homeRankTeams(window.FD_GC26_RANK).map(t=>({p:t.p, names:t.names, reg:t.reg, prize:(typeof GC2026_PRIZES!=='undefined' && GC2026_PRIZES[String(t.p)])||0}))});
  if(typeof RC_TEAMS_2026!=='undefined')
    ev.push({id:'rc', key:'ReloadChampionshipParis', name:nm('ReloadChampionshipParis', 'Paris'),
      rows:()=>RC_TEAMS_2026.map(t=>({p:+t.p, names:t.d, reg:t.r, prize:t.c}))});
  // Призовые финалов — таблицы Tracker (PRIZE_TABLES — Мейджор 1 и Саммит, PRIZE_TABLES_M2 — Мейджор 2), на дуо.
  const pay=(t, p)=>(t && t[String(p)]) || 0;
  ev.push({id:'m2', key:'Major2_Final', name:nm('Major2_Final'), regs:true,
    rows:reg=>(homeRealRaw(2, reg)||[]).map(r=>({p:r[0], pts:r[1], names:r.slice(6).filter(x=>typeof x==='string'),
      prize:pay(typeof PRIZE_TABLES_M2!=='undefined' && PRIZE_TABLES_M2[reg], r[0])}))});
  if(typeof window!=='undefined' && window.FD_SUMMIT_RANK)
    ev.push({id:'summit', key:'Summit_Final', name:nm('Summit_Final'), rows:()=>homeRankTeams(window.FD_SUMMIT_RANK).map(t=>({p:t.p, names:t.names,
      prize:pay(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES.SUMMIT, t.p)}))});
  ev.push({id:'m1', key:'Major1_Final', name:nm('Major1_Final'), regs:true,
    rows:reg=>(homeRealRaw(1, reg)||[]).map(r=>({p:r[0], pts:r[1], names:r.slice(6).filter(x=>typeof x==='string'),
      prize:pay(typeof PRIZE_TABLES!=='undefined' && PRIZE_TABLES[reg], r[0])}))});
  // Свои обложки: у этих стадий в календаре карьеры общая заглушка.
  const own={gc26:'art/mode-all-fncs.jpg', rc:'art/mode-ewc.jpg', m2:'art/fncs-2026.jpg', summit:'art/fncs-2026-major1.jpg', m1:'art/mode-major1.jpg'};
  ev.forEach(e=>{ e.when=when(e.key); e.art=own[e.id]||art(e.key); });
  // Только прошедшие: «результаты» турнира, который ещё не сыгран, — это пустая таблица.
  const today=homeToday();
  return ev.filter(e=>e.when && e.when.to<today);
}
function homeRealDraw(){
  if(HOME_EARN_MODE){ homeEarnDraw(); return; }
  const box=document.getElementById('homeReal'); if(!box) return;
  const T=L(), list=homeRealEvents();
  if(!list.length){ box.hidden=true; return; }
  /* Топ-10 выбранного турнира прямо на главной (15.10: «топ 10 игроков, призы и поинты у каждого капа»): турнир — кнопками,
     у Мейджоров ещё и регион; полная таблица — по «Вся таблица». */
  const e=list.find(x=>x.id===HOME_REAL_SEL) || list[0];
  HOME_REAL_SEL=e.id;
  const reg=HOME_REAL_REGS.indexOf(HOME_REAL_REG)>=0 ? HOME_REAL_REG : 'EU';
  const all=e.regs ? e.rows(reg) : e.rows(), top=all.slice(0, 10);
  const hasPts=top.some(r=>r.pts!=null), hasPrize=top.some(r=>r.prize), multi=!e.regs && top.some(r=>r.reg);
  const chips='<div class="hr-chips">'+list.map(x=>'<button type="button" class="'+(x.id===e.id ? 'on' : '')+'" onclick="homeRealSel(\''+x.id+'\')">'+
    esc(x.name.split(' · ')[0])+'</button>').join('')+'</div>';
  const regs=e.regs ? '<div class="hr-chips hr-chips-reg">'+HOME_REAL_REGS.filter(r=>homeRealRaw(e.id==='m1' ? 1 : 2, r)).map(r=>
    '<button type="button" class="'+(r===reg ? 'on' : '')+'" onclick="homeRealReg(\''+r+'\')">'+r+'</button>').join('')+'</div>' : '';
  const dates=homeDate(e.when.from, true)+(e.when.to!==e.when.from ? ' – '+homeDate(e.when.to, true) : '');
  const th='<tr><th>#</th><th>'+esc(T.hmRealTeam)+'</th>'+(hasPts ? '<th>'+esc(T.hmRealPts)+'</th>' : '')+(hasPrize ? '<th>'+esc(T.hmRealPrize)+'</th>' : '')+'</tr>';
  const body=top.map(r=>'<tr><td>'+r.p+'</td><td>'+(r.names||[]).map(esc).join(' &amp; ')+(multi && r.reg ? ' <em>'+esc(r.reg)+'</em>' : '')+'</td>'+
    (hasPts ? '<td>'+(r.pts!=null ? r.pts : '')+'</td>' : '')+(hasPrize ? '<td>'+(r.prize ? '$'+ccNum(r.prize) : '-')+'</td>' : '')+'</tr>').join('');
  box.innerHTML='<h2 class="home-h">'+esc(T.hmRealTitle)+'</h2>'+chips+
    '<div class="hr-head"><img src="'+esc(e.art)+'" alt="" onerror="this.remove()"><span><b>'+esc(e.name)+'</b><small>'+esc(dates)+'</small></span></div>'+regs+
    '<table class="hr-table hr-top10"><thead>'+th+'</thead><tbody>'+body+'</tbody></table>'+
    (all.length>10 ? '<button class="home-more" type="button" onclick="homeRealOpen(\''+e.id+'\', \''+reg+'\')">'+esc(T.hmRealAll(all.length))+'</button>' : '');
  box.hidden=false;
}
/* ПРИЗОВЫЕ 2026 У ИГРОКОВ (15.10: «мб вместо результатов призовые за год у игроков»). Считается из тех же таблиц, что
   «Результаты 2026»: финалы Мейджоров 1 и 2 во всех регионах, Саммит, Reload Championship, Мировой чемпионат — у каждой
   строки там место и призовые дуо. Игроку — половина. Квалификации, Reload Elite Series и капы в данных без призовых по
   игрокам и сюда не входят — подпись это говорит. Один ник в разных регистрах (shxrk/Shxrk) — один игрок. */
const HOME_EARN_MODE=true;
let HOME_EARN_ALL=false, HOME_EARN_CACHE=null;
function homeEarnings(){
  if(HOME_EARN_CACHE && HOME_EARN_CACHE.lang===LANG) return HOME_EARN_CACHE.list;
  const by={};
  homeRealEvents().forEach(e=>{
    (e.regs ? HOME_REAL_REGS : [null]).forEach(reg=>{
      (e.regs ? e.rows(reg) : e.rows()).forEach(r=>{
        if(!r.prize) return;
        const share=r.prize/2;
        (r.names||[]).forEach(h=>{
          const k=String(h).toLowerCase();
          const x=by[k]=by[k]||{k, h, reg:r.reg||reg||'', sum:0, ev:[]};
          x.sum+=share;
          x.ev.push({name:e.name.split(' · ')[0]+(reg ? ' · '+reg : ''), p:r.p, prize:share});
        });
      });
    });
  });
  const list=Object.values(by).sort((a,b)=>b.sum-a.sum || a.h.localeCompare(b.h));
  HOME_EARN_CACHE={lang:LANG, list};
  return list;
}
/* Призовые 2026 со ВСЕХ турниров (16.10: «и призовые вообще за весь год со всех, не ток с фнкс», «и флаги по игрокам»).
   Источник — Liquipedia, Portal:Statistics/2026, таблица «Money Ranking · By player» (топ-50, снято 16.10.2026):
   ник, страна, медали 1/2/3 и сумма. Обновлять тем же запросом (api.php?action=parse&page=Portal:Statistics/2026).
   Поля: n — ник, c — флаг (как в flags/w20), e — $, m — [1-х, 2-х, 3-х мест]. */
const HOME_EARN_LQ=[{"n":"vic0","c":"at","e":458353,"m":[10,7,6]},{"n":"Malibuca","c":"ru","e":440353,"m":[8,9,9]},{"n":"shxrk","c":"ro","e":400360,"m":[9,14,12]},{"n":"t3eny","c":"si","e":351582,"m":[7,7,8]},{"n":"Pixie","c":"se","e":334192,"m":[9,8,4]},{"n":"SwizzY","c":"ru","e":317962,"m":[7,4,5]},{"n":"Scroll","c":"dk","e":298591,"m":[19,13,10]},{"n":"Sky","c":"dk","e":278386,"m":[14,10,10]},{"n":"Pollo","c":"mx","e":214724,"m":[13,8,5]},{"n":"Tjino","c":"dk","e":201335,"m":[8,8,5]},{"n":"Peterbot","c":"us","e":199341,"m":[14,9,5]},{"n":"Boltz","c":"us","e":163225,"m":[5,4,7]},{"n":"PabloWingu","c":"dk","e":154629,"m":[5,9,5]},{"n":"Acorn","c":"ca","e":149458,"m":[4,3,7]},{"n":"Ajerss","c":"us","e":135963,"m":[7,4,5]},{"n":"Clix","c":"us","e":127188,"m":[6,5,6]},{"n":"Darm","c":"pl","e":121397,"m":[8,9,6]},{"n":"Momsy","c":"fr","e":116395,"m":[6,1,5]},{"n":"Cold","c":"us","e":113692,"m":[8,5,3]},{"n":"FoCuS","c":"il","e":107116,"m":[16,14,7]},{"n":"Cr1nge","c":"","e":101101,"m":[3,6,8]},{"n":"charyy","c":"pl","e":99395,"m":[8,9,7]},{"n":"Th0masHD","c":"dk","e":98300,"m":[7,9,3]},{"n":"SkyJump","c":"fr","e":98026,"m":[4,4,6]},{"n":"Veno","c":"gb","e":96650,"m":[7,3,5]},{"n":"Curve","c":"us","e":96060,"m":[6,5,5]},{"n":"Twi","c":"gb","e":92288,"m":[2,4,7]},{"n":"Kami","c":"pl","e":91885,"m":[6,4,6]},{"n":"Romero","c":"ar","e":79850,"m":[3,4,5]},{"n":"Chap","c":"ch","e":79485,"m":[18,7,4]},{"n":"Rapid","c":"ca","e":78675,"m":[10,8,4]},{"n":"Flickzy","c":"de","e":78375,"m":[11,6,2]},{"n":"Ritual","c":"us","e":77550,"m":[7,8,8]},{"n":"Lewa","c":"ar","e":74548,"m":[3,2,3]},{"n":"Higgs","c":"us","e":72800,"m":[9,6,5]},{"n":"Amp2Fly","c":"us","e":67950,"m":[5,4,4]},{"n":"Muz","c":"au","e":66241,"m":[2,6,2]},{"n":"Demus","c":"pl","e":63871,"m":[6,9,6]},{"n":"IAmNoob","c":"ie","e":59450,"m":[14,7,7]},{"n":"VicterV","c":"us","e":57691,"m":[3,4,3]},{"n":"Khanada","c":"us","e":57638,"m":[7,3,4]},{"n":"SaLva","c":"sa","e":52138,"m":[4,4,3]},{"n":"Kingaling","c":"us","e":50050,"m":[5,4,3]},{"n":"Vergo","c":"us","e":49185,"m":[6,4,4]},{"n":"Syaaz","c":"es","e":48519,"m":[28,13,8]},{"n":"Shadow","c":"us","e":48250,"m":[7,1,4]},{"n":"Kraez","c":"us","e":48175,"m":[4,3,1]},{"n":"Rax","c":"it","e":47501,"m":[12,3,4]},{"n":"Japko","c":"pl","e":46665,"m":[1,0,0]},{"n":"Rises","c":"us","e":44975,"m":[12,7,9]}];
const HOME_EARN_AT='2026-11-19';
function homeEarnDraw(){
  const box=document.getElementById('homeReal'); if(!box) return;
  const T=L(), list=HOME_EARN_LQ;
  if(!list.length){ box.hidden=true; return; }
  box.innerHTML='<h2 class="home-h">'+esc(T.hmEarnTitle)+'</h2><p class="home-sub">'+esc(T.hmEarnSub(homeDate(HOME_EARN_AT)))+'</p>'+
    '<div class="he-list">'+homeEarnRowsHTML(list.slice(0, 10))+'</div>'+
    (list.length>10 ? '<button class="home-more" type="button" onclick="homeListOpen(\'earn\')">'+esc(T.hmBoardMore(Math.min(50, list.length)))+'</button>' : '');
  box.hidden=false;
}
function homeEarnRowsHTML(list){
  const flag=c=>c ? '<img src="flags/w20/'+esc(c)+'.png" alt="" onerror="this.remove()">' : '';
  return list.map((x,i)=>'<button class="he-row" type="button" onclick="homeEarnOpen('+i+')">'+
    '<i>'+(i+1)+'</i><b>'+flag(x.c)+esc(x.n)+'<small>🥇'+x.m[0]+' 🥈'+x.m[1]+' 🥉'+x.m[2]+'</small></b>'+
    '<span>$'+ccNum(x.e)+'</span></button>').join('');
}
// Игрок: флаг, сумма за год, медали и — что из этого известно по финалам FNCS (места и доля, homeEarnings).
function homeEarnOpen(i){
  const x=HOME_EARN_LQ[i]; if(!x) return;
  const T=L(), fn=homeEarnings().find(p=>p.k===String(x.n).toLowerCase());
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  const fl=x.c ? '<img src="flags/w20/'+esc(x.c)+'.png" alt="" style="width:22px;vertical-align:-2px;margin-right:8px" onerror="this.remove()">' : '';
  const body=fn ? fn.ev.map(e=>'<tr><td>'+e.p+'</td><td>'+esc(e.name)+'</td><td>$'+ccNum(Math.round(e.prize))+'</td></tr>').join('') : '';
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(x.n)+'">'+
    '<div class="hr-top"><b>'+fl+esc(x.n)+' · $'+ccNum(x.e)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    '<p class="home-sub" style="margin:0">'+esc(T.hmEarnMedals(x.m[0], x.m[1], x.m[2]))+'</p>'+
    (body ? '<b style="font-size:13px;color:#fff">'+esc(T.hmEarnFncs)+'</b><div class="hr-wrap"><table class="hr-table"><thead><tr><th>#</th><th>'+esc(T.hmEarnEvent)+'</th><th>'+esc(T.hmRealPrize)+'</th></tr></thead><tbody>'+body+'</tbody></table></div>' : '')+
    '<p class="home-sub" style="margin:0">'+esc(T.hmEarnSrc)+'</p></div>';
  document.body.classList.add('hr-lock');
}
let HOME_REAL_SEL=null;
function homeRealSel(id){ HOME_REAL_SEL=id; homeRealDraw(); try{ homeLiveTabs(); }catch(e){} }
function homeRealReg(r){ HOME_REAL_REG=r; homeRealDraw(); try{ homeLiveTabs(); }catch(e){} }
function homeRealOpen(id, reg){
  HOME_REAL_OPEN=id; if(reg) HOME_REAL_REG=reg;
  const e=homeRealEvents().find(x=>x.id===id); if(!e) return;
  const T=L();
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  const rows=e.regs ? e.rows(HOME_REAL_REG) : e.rows();
  const multi=!e.regs && rows.some(r=>r.reg);
  const hasPts=rows.some(r=>r.pts!=null), hasPrize=rows.some(r=>r.prize);
  const chips=e.regs ? '<div class="hr-regs">'+HOME_REAL_REGS.filter(r=>homeRealRaw(id==='m1' ? 1 : 2, r)).map(r=>
      '<button type="button" class="'+(r===HOME_REAL_REG ? 'on' : '')+'" onclick="homeRealOpen(\''+id+'\', \''+r+'\')">'+r+'</button>').join('')+'</div>' : '';
  const th='<tr><th>#</th><th>'+esc(T.hmRealTeam)+'</th>'+(multi ? '<th>'+esc(T.hmRealReg)+'</th>' : '')+
    (hasPts ? '<th>'+esc(T.hmRealPts)+'</th>' : '')+(hasPrize ? '<th>'+esc(T.hmRealPrize)+'</th>' : '')+'</tr>';
  const body=rows.map(r=>'<tr><td>'+r.p+'</td><td>'+(r.names||[]).map(esc).join(' &amp; ')+'</td>'+(multi ? '<td>'+esc(r.reg||'')+'</td>' : '')+
    (hasPts ? '<td>'+(r.pts!=null ? r.pts : '')+'</td>' : '')+(hasPrize ? '<td>'+(r.prize ? '$'+ccNum(r.prize) : '-')+'</td>' : '')+'</tr>').join('');
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(e.name)+'">'+
    '<div class="hr-top"><b>'+esc(e.name)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    chips+'<div class="hr-wrap"><table class="hr-table"><thead>'+th+'</thead><tbody>'+body+'</tbody></table></div></div>';
  document.body.classList.add('hr-lock');
}
function homeRealClose(){
  const m=document.getElementById('homeRealModal'); if(m) m.remove();
  document.body.classList.remove('hr-lock'); HOME_REAL_OPEN=null;
}
/* Вкладки живого блока: показаны только те, у которых есть что показать; выбранная помнится в браузере. */
function homeLiveTabs(k){
  const box=document.getElementById('homeLive'), bar=document.getElementById('homeLiveTabs'); if(!box || !bar) return;
  const T=L(), panes=[['real', 'homeReal', HOME_EARN_MODE ? T.hmEarnTitle : T.hmRealTitle], ['scene', 'homeScene', T.hmSceneTitle], ['board', 'homeBoard', T.lbTab]]
    .filter(p=>{ const e=document.getElementById(p[1]); return e && !e.hidden; });
  box.hidden=!panes.length; if(!panes.length) return;
  if(k){ try{ localStorage.setItem('fd_home_tab', k); }catch(e){} }
  let cur=k; if(!cur){ try{ cur=localStorage.getItem('fd_home_tab'); }catch(e){} }
  if(!panes.some(p=>p[0]===cur)) cur=panes[0][0];
  box.dataset.tab=cur;
  bar.innerHTML=panes.map(p=>'<button type="button" role="tab" aria-selected="'+(p[0]===cur)+'" class="'+(p[0]===cur ? 'on' : '')+'" onclick="homeLiveTabs(\''+p[0]+'\')">'+esc(p[2])+'</button>').join('');
  /* Снимок блока — в браузер: при следующем заходе оболочка ставит его сразу (скрипт под разметкой #homeLive),
     не дожидаясь app.js (15.10: «с делеем результаты появляются»). Пишется, только когда таблица сайта уже пришла. */
  if(HOME_BOARD && HOME_BOARD._at){ try{ localStorage.setItem('fd_home_live', JSON.stringify({lang:LANG, tab:cur, html:box.innerHTML.replace(/<div class="home-timer" id="homeTimer"[^>]*>[\s\S]*?<\/div>/, '<div class="home-timer" id="homeTimer" hidden></div>')})); }catch(e){} }
}
function homeBoardMe(){
  try{
    const order=[ccSlot()]; for(let n=1; n<=CC_SLOTS; n++) if(order.indexOf(n)<0) order.push(n);
    for(const n of order){ const sv=ccSlotRead(n); const id=sv && sv.career && sv.career.board && !sv.career.board.off && sv.career.board.id; if(id) return id; }
  }catch(e){}
  return '';
}
function homeBoardDraw(){
  const box=document.getElementById('homeBoard'); if(!box) return;
  const T=L(), base=ccBoardBase();
  if(!base){ box.hidden=true; return; }
  box.hidden=false;
  const d=HOME_BOARD;
  if(!d || (!d._busy && Date.now()-(d._at||0) > 60000)){
    if(d) d._busy=true; else HOME_BOARD={_busy:true, _at:0};
    // Своя строка — по id карьеры из сейва (активный слот первым): сервер отвечает местом (you), как во вкладке карьеры.
    const me=homeBoardMe();
    fetch(base+'?'+(HOME_BOARD_SORT ? 'sort='+HOME_BOARD_SORT+'&' : '')+(me ? 'me='+encodeURIComponent(me) : '')).then(r=>r.ok ? r.json() : {err:true}).catch(()=>({err:true})).then(x=>{
      HOME_BOARD=Object.assign(x||{err:true}, {_at:Date.now()});
      homeBoardDraw();
      try{ homeLiveTabs(); }catch(e){}
    });
  }
  /* Вкладки турниры / все призы (игрок 2.11: «призы только с турниров и вторая вкладка все призы»). */
  const head='<h2 class="home-h">'+esc(T.lbTab)+'</h2><p class="home-sub">'+esc(HOME_BOARD_SORT==='all' ? T.lbAllNote : HOME_BOARD_SORT==='inc' ? T.lbIncNote : T.lbCupNote)+'</p>'+
    '<div class="hb-tabs">'+[[null, T.lbByEarn], ['all', T.lbByAll], ['inc', T.lbByInc]].map(([k,t])=>'<button type="button" class="'+(HOME_BOARD_SORT===k ? 'on' : '')+'" onclick="homeBoardSort('+(k ? '\''+k+'\'' : 'null')+')">'+esc(t)+'</button>').join('')+'</div>';
  if(!d || !d._at){ box.innerHTML=head+'<p class="home-sub">'+esc(T.lbLoad)+'</p>'; return; }
  if(d.err){ box.innerHTML=head+'<p class="home-sub">'+esc(T.lbErr)+'</p>'; return; }
  const seen=new Set(), rows=(d.rows||[]).filter(r=>{ const k=[r.nick, r.region, r.country, r.seasons, r.earn, r.titles].join('|');
    if(seen.has(k)) return false; seen.add(k); return true; });
  if(!rows.length){ box.innerHTML=head+'<p class="home-sub">'+esc(T.lbEmpty)+'</p>'; return; }
  HOME_BOARD_ROWS=rows;
  // Своё место — ссылкой на свою страницу списка.
  const you=d.you && d.you.rank ? '<button type="button" class="hb-me" onclick="homeBoardList('+Math.floor((d.you.rank-1)/(d.per||100))+')">'+esc(T.lbYou(d.you.rank, d.total||rows.length))+'</button>' : '';
  box.innerHTML=head+'<div>'+homeBoardRowsHTML(rows.slice(0, 10))+'</div>'+you+
    (rows.length>10 ? '<button class="home-more" type="button" onclick="homeBoardList(0)">'+esc(T.hmBoardList)+'</button>' : '');
}
let HOME_BOARD_ROWS=[];
function homeBoardRowsHTML(rows, from, sort){
  const T=L(), flag=c=>c ? '<img src="flags/w20/'+esc(ccCountryOf(c))+'.png" alt="" onerror="this.remove()">' : '';
  const srt=(sort===undefined ? HOME_BOARD_SORT : sort), all=srt==='all', inc=srt==='inc';
  return rows.map((r,i)=>'<div class="hb-row'+(r.you ? ' me' : '')+'"><i>'+((from||0)+i+1)+'</i><b>'+flag(r.country)+esc(r.nick)+
    '<small>'+esc(r.region||'')+' · '+esc(T.lbSeasons(r.seasons))+'</small></b><span>$'+ccNum(inc ? (r.income||0) : all && r.earnAll!=null ? r.earnAll : r.earn)+'</span></div>').join('');
}
function homeBoardSort(k){ HOME_BOARD_SORT=k||null; HOME_BOARD=null; homeBoardDraw(); }
/* Весь список поверх экрана, по 100 мест со стрелками (игрок 2.11: «ничего не листается» — было только «Показать 50»).
   Страница читается с сервера (?page=), своя строка подсвечена. */
function homeBoardList(page){
  const T=L(), base=ccBoardBase(); if(!base) return;
  page=Math.max(0, page|0);
  const sort=HOME_BOARD_SORT, me=homeBoardMe();
  const draw=(inner)=>{
    let m=document.getElementById('homeRealModal');
    if(!m){
      m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
      m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
      document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
      document.body.appendChild(m);
    }
    m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(T.lbTab)+'">'+
      '<div class="hr-top"><b>'+esc(T.lbTab)+' · '+esc(sort==='all' ? T.lbByAll : T.lbByEarn)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
      '<div class="hr-wrap">'+inner+'</div></div>';
    document.body.classList.add('hr-lock');
  };
  const key=(sort||'')+'|'+page;
  HOME_BOARD_LIST=key;
  draw('<p class="home-sub">'+esc(T.lbLoad)+'</p>');
  fetch(base+'?'+(sort ? 'sort='+sort+'&' : '')+'page='+page+(me ? '&me='+encodeURIComponent(me) : '')).then(r=>r.ok ? r.json() : {err:true}).catch(()=>({err:true})).then(x=>{
    if(HOME_BOARD_LIST!==key || !document.getElementById('homeRealModal')) return;
    if(!x || x.err){ draw('<p class="home-sub">'+esc(T.lbErr)+'</p>'); return; }
    const per=x.per||100, total=x.total||0, pages=Math.max(1, Math.ceil(total/per)), pg=x.page||0;
    const nav='<div class="hb-pages"><button type="button"'+(pg>0 ? '' : ' disabled')+' onclick="homeBoardList('+(pg-1)+')" aria-label="‹">‹</button>'+
      '<span>'+esc(T.lbPage(pg*per+1, Math.min(total, (pg+1)*per), total))+'</span>'+
      '<button type="button"'+(pg<pages-1 ? '' : ' disabled')+' onclick="homeBoardList('+(pg+1)+')" aria-label="›">›</button></div>';
    draw(nav+'<div>'+homeBoardRowsHTML(x.rows||[], pg*per, sort)+'</div>'+nav);
    const box=document.querySelector('#homeRealModal .hr-wrap'); if(box) box.scrollTop=0;
  });
}
/* «Показать 50» — списком поверх экрана, а не раскрытием колонки (16.10: «когда жмёшь топ 50, пусть поверх экрана будет список»). */
function homeListOpen(kind){
  const T=L(), earn=kind==='earn';
  const title=earn ? T.hmEarnTitle : T.lbTab;
  const body=earn ? '<div class="he-list">'+homeEarnRowsHTML(HOME_EARN_LQ.slice(0, 50))+'</div>'
                  : '<div>'+homeBoardRowsHTML(HOME_BOARD_ROWS.slice(0, 50))+'</div>';
  let m=document.getElementById('homeRealModal');
  if(!m){
    m=document.createElement('div'); m.id='homeRealModal'; m.className='hr-modal';
    m.addEventListener('click', ev=>{ if(ev.target===m) homeRealClose(); });
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && document.getElementById('homeRealModal')) homeRealClose(); });
    document.body.appendChild(m);
  }
  m.innerHTML='<div class="hr-box" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">'+
    '<div class="hr-top"><b>'+esc(title)+' · '+esc(T.hmTop50)+'</b><button type="button" class="hr-x" onclick="homeRealClose()" aria-label="'+esc(T.hmRealClose)+'">✕</button></div>'+
    '<div class="hr-wrap">'+body+'</div></div>';
  document.body.classList.add('hr-lock');
}
/* Кнопка карьеры на главной: есть сохранённая карьера — «Продолжить», а не «Начать» (игрок 9.10: «closed my browser on my
   phone and opened it back up and there wasnt an option to continue my career» — кнопка вела к списку карьер, но звалась
   «Start a career»). */
function ccHeroCareerText(){
  try{ let has=false; for(let n=1; n<=CC_SLOTS && !has; n++) has=!!ccSlotCard(n);
    const el=document.querySelector('.hero-cta .hero-btn-go span[data-i18n]');
    if(el) el.textContent=(has && L().heroCareerCont) ? L().heroCareerCont : L().heroCareer; }catch(e){}
  try{ homeRender(); }catch(e){}
}
// Главная рисуется сразу после загрузки app.js (раньше это делал mgrHeroText из mgr.js — то есть никогда до входа в менеджер).
setTimeout(function(){ try{ ccHeroCareerText(); }catch(e){} }, 0);
/* Больше или меньше: два настоящих игрока, кто выше. Вопросы только из данных сайта: место в одном и том же
   финале (карточки PLAYERS_BASE с местом) и призовые 2026 по Liquipedia (HOME_EARN_LQ). Серия до первой ошибки,
   рекорд на устройстве. Адрес #hl открывает экран сразу. */
let HL=null;
const HL_BEST_KEY='fncsdraft_hl_best', HL_EARN_SHARE=0.25;
/* Призовые за всё время, Liquipedia Portal:Statistics/Player_earnings и /Team_earnings, от $20k. Обновлять:
   tools/build-hl-alltime.js (переписывает три строки ниже). n ник/клуб, c флаг, e $. */
const HL_ALL_P=[{"n":"Bugha","e":3858272,"c":"us"},{"n":"aqua","e":2201771,"c":"at"},{"n":"EpikWhale","e":2002846,"c":"us"},{"n":"psalm","e":1880342,"c":"us"},{"n":"Kami","e":1866656,"c":"pl"},{"n":"Malibuca","e":1659683,"c":"ru"},{"n":"Anas","e":1659666,"c":"dk"},{"n":"Queasy","e":1563823,"c":"rs"},{"n":"nyhrox","e":1545653,"c":"no"},{"n":"Th0masHD","e":1543549,"c":"dk"},{"n":"Setty","e":1381717,"c":"pl"},{"n":"Wolfiez","e":1369221,"c":"gb"},{"n":"TaySon","e":1338352,"c":"si"},{"n":"K1nG","e":1333814,"c":"ar"},{"n":"Peterbot","e":1286970,"c":"us"},{"n":"Kreo","e":1277756,"c":"us"},{"n":"Saf","e":1242695,"c":"us"},{"n":"Ceice","e":1242324,"c":"us"},{"n":"Rojo","e":1226113,"c":"nl"},{"n":"Zayt","e":1214505,"c":"ca"},{"n":"Veno","e":1176811,"c":"gb"},{"n":"Acorn","e":1139980,"c":"ca"},{"n":"Mero","e":1112128,"c":"ca"},{"n":"vic0","e":1067690,"c":"at"},{"n":"Elevate","e":995938,"c":"ca"},{"n":"Cold","e":971147,"c":"us"},{"n":"SwizzY","e":967469,"c":"ru"},{"n":"Khanada","e":953923,"c":"us"},{"n":"JannisZ","e":934329,"c":"de"},{"n":"Merstach","e":930200,"c":"lv"},{"n":"Pollo","e":905885,"c":"mx"},{"n":"Pixie","e":903021,"c":"se"},{"n":"Skite","e":899796,"c":"fr"},{"n":"Clix","e":886854,"c":"us"},{"n":"Arkhram","e":853753,"c":"us"},{"n":"Mitr0","e":824585,"c":"nl"},{"n":"Cooper","e":805640,"c":"us"},{"n":"Hen","e":802739,"c":"lt"},{"n":"chapix","e":789457,"c":"se"},{"n":"Mongraal","e":761071,"c":"gb"},{"n":"t3eny","e":758725,"c":"si"},{"n":"Ajerss","e":753890,"c":"us"},{"n":"TruleX","e":750783,"c":"rs"},{"n":"Vadeal","e":723237,"c":"de"},{"n":"Bizzle","e":713928,"c":"us"},{"n":"crue","e":712180,"c":"se"},{"n":"MrSavage","e":702299,"c":"no"},{"n":"Edgey","e":690272,"c":"us"},{"n":"Tfue","e":689377,"c":"us"},{"n":"rezon ay","e":661402,"c":"de"},{"n":"Ritual","e":652975,"c":"us"},{"n":"Stompy","e":649716,"c":"at"},{"n":"Chico","e":638527,"c":"ba"},{"n":"benjyfishy","e":634024,"c":"gb"},{"n":"Flickzy","e":610395,"c":"de"},{"n":"Dubs","e":592374,"c":"us"},{"n":"nayte","e":583613,"c":"fr"},{"n":"Andilex","e":582851,"c":"fr"},{"n":"Vanyak3kk","e":560740,"c":"ua"},{"n":"Japko","e":554648,"c":"pl"},{"n":"Commandment","e":542412,"c":"us"},{"n":"Reet","e":541680,"c":"us"},{"n":"Muz","e":528008,"c":"au"},{"n":"Cented","e":525851,"c":"ca"},{"n":"ZexRow","e":525511,"c":"us"},{"n":"teeq","e":525315,"c":"pl"},{"n":"Falconer","e":524740,"c":"us"},{"n":"shxrk","e":517351,"c":"ro"},{"n":"Pinq","e":514154,"c":"gb"},{"n":"Trippernn","e":508883,"c":"dk"},{"n":"Boltz","e":497583,"c":"us"},{"n":"Nate Hill","e":497479,"c":"us"},{"n":"Eomzo","e":482509,"c":"ca"},{"n":"PabloWingu","e":465109,"c":"dk"},{"n":"cloakzy","e":441825,"c":"us"},{"n":"MackWood","e":436183,"c":"us"},{"n":"Megga","e":430266,"c":"us"},{"n":"Riversan","e":429213,"c":"us"},{"n":"Vivid","e":426292,"c":"us"},{"n":"Dukez","e":425002,"c":"mx"},{"n":"Rapid","e":424400,"c":"ca"},{"n":"Kiryache32","e":414652,"c":"ru"},{"n":"Scroll","e":414280,"c":"dk"},{"n":"Refsgaard","e":405865,"c":"dk"},{"n":"Kinstaar","e":405184,"c":"ch"},{"n":"Higgs","e":400355,"c":"us"},{"n":"Noahreyli","e":390225,"c":"ch"},{"n":"Sky","e":388977,"c":"dk"},{"n":"Reverse2k","e":388902,"c":"us"},{"n":"Tjino","e":385264,"c":"dk"},{"n":"MariusCOW","e":385059,"c":"dk"},{"n":"Chap","e":382697,"c":"us"},{"n":"Phzin","e":379417,"c":"br"},{"n":"Threats","e":377955,"c":"cu"},{"n":"Rise","e":376040,"c":"ca"},{"n":"k1nzell","e":376010,"c":"si"},{"n":"charyy","e":367170,"c":"pl"},{"n":"Deyy","e":354932,"c":"us"},{"n":"72hrs","e":352583,"c":"us"},{"n":"Fatch","e":351710,"c":"ca"},{"n":"Cizzorz","e":345750,"c":"us"},{"n":"Stormyrite","e":342734,"c":"ua"},{"n":"hiimtylerh","e":341250,"c":"ca"},{"n":"Zand","e":341250,"c":"dk"},{"n":"Suezhoo","e":341250,"c":"be"},{"n":"IDrop","e":340712,"c":"no"},{"n":"Tschinken","e":340399,"c":"at"},{"n":"POACH","e":332400,"c":"us"},{"n":"Vinny1x","e":328867,"c":"us"},{"n":"Endretta","e":325576,"c":"no"},{"n":"zAndy","e":324843,"c":"ro"},{"n":"Skram","e":324065,"c":"dk"},{"n":"Bucke","e":324048,"c":"us"},{"n":"Funk","e":322360,"c":"us"},{"n":"Slackes","e":321236,"c":"us"},{"n":"Snayzy","e":321116,"c":"fr"},{"n":"Hero","e":319331,"c":"sa"},{"n":"Avery","e":316894,"c":"ca"},{"n":"Nebs","e":314913,"c":"gb"},{"n":"P1ng","e":301532,"c":"ua"},{"n":"Toose","e":298588,"c":"ru"},{"n":"Seeyun","e":297244,"c":"br"},{"n":"Wox","e":295582,"c":"se"},{"n":"Hellfire","e":291800,"c":"dk"},{"n":"xsweeze","e":289237,"c":"fr"},{"n":"Jamper","e":286925,"c":"us"},{"n":"Stretch","e":285595,"c":"us"},{"n":"Aspect","e":285047,"c":"us"},{"n":"Sphinx","e":280400,"c":"us"},{"n":"Domentos","e":275475,"c":"lv"},{"n":"KING","e":274238,"c":"br"},{"n":"Morgausse","e":272449,"c":"us"},{"n":"BadSniper","e":272363,"c":"fr"},{"n":"Vato","e":272313,"c":"ch"},{"n":"Kurtz","e":271722,"c":"br"},{"n":"jahq","e":270754,"c":"us"},{"n":"volx","e":269942,"c":"au"},{"n":"skqttles","e":267266,"c":"us"},{"n":"rehx","e":266268,"c":"us"},{"n":"Decyptos","e":265054,"c":"fr"},{"n":"Darm","e":263511,"c":"pl"},{"n":"wakie","e":259776,"c":"se"},{"n":"Flikk","e":258921,"c":"dk"},{"n":"4zr","e":257733,"c":"ch"},{"n":"Avivv","e":257001,"c":"ca"},{"n":"yung calculator","e":256026,"c":"us"},{"n":"Alex","e":250163,"c":"au"},{"n":"Dmo","e":250025,"c":"us"},{"n":"Cadu","e":247323,"c":"br"},{"n":"Parz","e":245717,"c":"us"},{"n":"Kitoz","e":244123,"c":"br"},{"n":"Hunter","e":243323,"c":"fr"},{"n":"Bacca","e":243208,"c":"us"},{"n":"Clement","e":243084,"c":"fr"},{"n":"Putrick","e":240931,"c":"ru"},{"n":"FHD","e":238135,"c":"sa"},{"n":"Frosty","e":234711,"c":"br"},{"n":"PXMP","e":234665,"c":"us"},{"n":"Fredoxie","e":234454,"c":"dk"},{"n":"Cheatiin","e":233037,"c":"de"},{"n":"Nicks","e":227452,"c":"br"},{"n":"Svennoss","e":226033,"c":"nl"},{"n":"panzer","e":223382,"c":"ru"},{"n":"Fastroki","e":220349,"c":"de"},{"n":"Brycx","e":219563,"c":"us"},{"n":"EdRoadToGlory","e":217972,"c":"br"},{"n":"Aydan","e":216033,"c":"us"},{"n":"Pate1k","e":213724,"c":"no"},{"n":"Nikof","e":212752,"c":"fr"},{"n":"Fazer","e":212587,"c":"ar"},{"n":"Airwaks","e":211743,"c":"ch"},{"n":"Rhux","e":211250,"c":"us"},{"n":"itemm","e":210885,"c":"gb"},{"n":"Demus","e":209719,"c":"pl"},{"n":"Peterpan","e":208814,"c":"kr"},{"n":"Kwanti","e":208235,"c":"us"},{"n":"Floki","e":207208,"c":"fr"},{"n":"Degen","e":206583,"c":"us"},{"n":"Persa","e":206277,"c":"br"},{"n":"Boyer","e":206057,"c":"dk"},{"n":"Jamside","e":205793,"c":"ru"},{"n":"Tragix","e":205405,"c":"us"},{"n":"LeTsHe","e":205157,"c":"de"},{"n":"Unknown","e":204158,"c":"us"},{"n":"Nut","e":201627,"c":"mx"},{"n":"letw1k3","e":200827,"c":"ru"},{"n":"Furious","e":198269,"c":"us"},{"n":"KBR","e":197201,"c":"br"},{"n":"Fishy","e":195865,"c":"ar"},{"n":"Derox","e":195434,"c":"de"},{"n":"worthy","e":195273,"c":"au"},{"n":"fwexY","e":194814,"c":"de"},{"n":"7ssk7","e":193885,"c":"by"},{"n":"clarityG","e":192775,"c":"us"},{"n":"Diguera","e":192433,"c":"br"},{"n":"Mikson","e":190860,"c":"pl"},{"n":"verT","e":190414,"c":"us"},{"n":"WeY","e":189580,"c":"br"},{"n":"znappy","e":189287,"c":"se"},{"n":"Trashy","e":189013,"c":"us"},{"n":"PaMstou","e":187412,"c":"ca"},{"n":"Xeat","e":187074,"c":"br"},{"n":"Pika","e":186550,"c":"us"},{"n":"Koyota","e":184924,"c":"jp"},{"n":"Chubs","e":184503,"c":"us"},{"n":"blakeps","e":183493,"c":"us"},{"n":"Kiro","e":182864,"c":"nl"},{"n":"Kamo","e":182827,"c":"de"},{"n":"Jordan","e":181777,"c":"au"},{"n":"Noward","e":180796,"c":"be"},{"n":"Teeqzy","e":180367,"c":"be"},{"n":"leleo","e":179875,"c":"br"},{"n":"Okis","e":178320,"c":"us"},{"n":"Bylah","e":178052,"c":"us"},{"n":"Maufin","e":177341,"c":"jp"},{"n":"Redlee","e":177019,"c":"br"},{"n":"Tendons","e":176925,"c":"us"},{"n":"Verox","e":175585,"c":"gb"},{"n":"CizLucky","e":174934,"c":"us"},{"n":"favs","e":174866,"c":"ca"},{"n":"Jur3ky","e":174171,"c":"hr"},{"n":"Tchub","e":173865,"c":"se"},{"n":"4DRStorm","e":173453,"c":"us"},{"n":"PodaSai","e":171284,"c":"fr"},{"n":"Laizen","e":170976,"c":"fr"},{"n":"BELAEU","e":170421,"c":"fi"},{"n":"Jesse","e":168322,"c":"au"},{"n":"Bevvys","e":167773,"c":"se"},{"n":"Shadow","e":167403,"c":"us"},{"n":"CouRage","e":166888,"c":"us"},{"n":"7man","e":166858,"c":"bh"},{"n":"Snacky","e":166659,"c":"mx"},{"n":"FoCuS","e":166556,"c":"il"},{"n":"Yuma","e":165242,"c":"jp"},{"n":"FlowiS","e":164602,"c":"dk"},{"n":"Sean","e":164133,"c":"ca"},{"n":"RedRush","e":163734,"c":"lt"},{"n":"IAmNoob","e":163085,"c":"ie"},{"n":"RogueShark","e":162997,"c":"us"},{"n":"Ruri","e":162692,"c":"jp"},{"n":"OPai","e":161649,"c":"br"},{"n":"Blax","e":161399,"c":"fr"},{"n":"Jynx","e":160908,"c":"au"},{"n":"Vortex","e":160749,"c":"de"},{"n":"Scoped","e":160264,"c":"us"},{"n":"Kalgamer710","e":160043,"c":"sa"},{"n":"GntL","e":158648,"c":"sa"},{"n":"LeNain","e":157975,"c":"ca"},{"n":"Momsy","e":157338,"c":"fr"},{"n":"Curve","e":157200,"c":"us"},{"n":"Typical Gamer","e":157128,"c":"ca"},{"n":"Chimp","e":156378,"c":"us"},{"n":"Shelom","e":156313,"c":"jp"},{"n":"Ninja","e":155564,"c":"us"},{"n":"wavyjacob","e":154795,"c":"us"},{"n":"Qjac","e":154295,"c":"jp"},{"n":"Cr1nge","e":154229,"c":""},{"n":"Jay","e":154197,"c":"us"},{"n":"Casqer","e":153991,"c":"us"},{"n":"Lanjok","e":153367,"c":"us"},{"n":"Scarpa","e":152139,"c":"br"},{"n":"NICKMERCS","e":150500,"c":"us"},{"n":"Gotaga","e":150213,"c":"fr"},{"n":"Tkay","e":149962,"c":"do"},{"n":"Klusia","e":149060,"c":"dk"},{"n":"Issa","e":148815,"c":"ch"},{"n":"Paper","e":148586,"c":"in"},{"n":"Nov1ce","e":147419,"c":"br"},{"n":"histtory","e":147207,"c":"br"},{"n":"Umplify","e":146998,"c":"nl"},{"n":"TheVic","e":146656,"c":"fr"},{"n":"Mappi","e":146560,"c":"se"},{"n":"Sommerset","e":145307,"c":"us"},{"n":"NM7","e":145167,"c":"sa"},{"n":"Blacha","e":144816,"c":"pl"},{"n":"Adapter","e":144358,"c":"sa"},{"n":"FKS","e":144050,"c":"sa"},{"n":"Loserfruit","e":143898,"c":"au"},{"n":"artor","e":143495,"c":"pl"},{"n":"1lusha","e":143242,"c":"ru"},{"n":"GSX","e":143225,"c":"br"},{"n":"Blind","e":143100,"c":"us"},{"n":"Punisher","e":141814,"c":"fr"},{"n":"pixx","e":141755,"c":"pl"},{"n":"SkyJump","e":141576,"c":"fr"},{"n":"Escdark","e":141436,"c":"bh"},{"n":"Symfuhny","e":141242,"c":"us"},{"n":"crr","e":140680,"c":"gb"},{"n":"Looter","e":139616,"c":"au"},{"n":"Mkmkpapa","e":137725,"c":"jp"},{"n":"JoeFN","e":137390,"c":""},{"n":"Romero","e":136745,"c":"ar"},{"n":"Robban","e":136312,"c":"se"},{"n":"Assault","e":135860,"c":"us"},{"n":"Pepoclip","e":135608,"c":"jp"},{"n":"G13ras","e":134629,"c":"pl"},{"n":"Axeforce","e":134569,"c":"se"},{"n":"Merijn","e":133794,"c":"nl"},{"n":"RazZzero0o","e":132773,"c":"de"},{"n":"Visxals","e":132266,"c":"us"},{"n":"wisheydp","e":131704,"c":"br"},{"n":"Mexe","e":131295,"c":"gb"},{"n":"Ronaldo","e":130308,"c":"us"},{"n":"Juu","e":130232,"c":"de"},{"n":"thwifo","e":129610,"c":"us"},{"n":"Karmy","e":129351,"c":"ee"},{"n":"Destru","e":129332,"c":"fr"},{"n":"Zagou","e":128906,"c":"jp"},{"n":"Barroso","e":126728,"c":"br"},{"n":"Anon","e":126524,"c":"au"},{"n":"SypherPK","e":124503,"c":"us"},{"n":"Twi","e":124092,"c":"gb"},{"n":"916Gon","e":123298,"c":"br"},{"n":"AirkNn","e":123072,"c":"fr"},{"n":"Nittle","e":122828,"c":"us"},{"n":"Talls","e":122786,"c":"ar"},{"n":"VicterV","e":122481,"c":"us"},{"n":"Thiefs","e":122359,"c":"us"},{"n":"DeRoller","e":122135,"c":"us"},{"n":"Nxthan","e":121663,"c":"gb"},{"n":"Animal","e":121472,"c":"us"},{"n":"Eclipsae","e":121430,"c":"us"},{"n":"Sanku","e":121276,"c":"ar"},{"n":"Spy","e":121031,"c":"sa"},{"n":"Lachlan","e":121017,"c":"au"},{"n":"SaLva","e":120770,"c":"sa"},{"n":"RustyK","e":120442,"c":"ar"},{"n":"elokratz","e":118914,"c":"dk"},{"n":"Breso","e":118132,"c":"au"},{"n":"Cyrzr","e":118070,"c":"mx"},{"n":"Kurama","e":118038,"c":"fr"},{"n":"Lewa","e":117065,"c":"ar"},{"n":"Link","e":116507,"c":"nz"},{"n":"Yasir","e":115740,"c":"mx"},{"n":"BlastR","e":115605,"c":"fr"},{"n":"VortexM","e":115313,"c":"au"},{"n":"beehive","e":115278,"c":"se"},{"n":"Tuckz","e":114370,"c":"gb"},{"n":"Crimz","e":114277,"c":"us"},{"n":"Cam","e":113973,"c":"pa"},{"n":"Astonish","e":113900,"c":"us"},{"n":"BlooTea","e":113785,"c":"us"},{"n":"Yonx","e":113339,"c":"sa"},{"n":"Rocaine","e":113293,"c":"ca"},{"n":"Illest","e":112836,"c":"us"},{"n":"iDroPz_BoDiEs","e":112500,"c":"us"},{"n":"Michael","e":111835,"c":"gb"},{"n":"Zemie","e":111626,"c":"us"},{"n":"Alice","e":110819,"c":"jp"},{"n":"Nick Eh 30","e":110636,"c":"ca"},{"n":"Pixovsky","e":110635,"c":"pl"},{"n":"Kiduoo","e":110302,"c":"de"},{"n":"parpy","e":109758,"c":"nz"},{"n":"npen","e":109168,"c":"us"},{"n":"Tyler15","e":109135,"c":"us"},{"n":"Minipiyo","e":109127,"c":"jp"},{"n":"DrakoNz","e":108717,"c":"br"},{"n":"zoreh","e":108666,"c":"nz"},{"n":"Ritz","e":108470,"c":"se"},{"n":"BlackoutZ","e":107982,"c":"br"},{"n":"Tisco","e":107706,"c":"ar"},{"n":"Edson","e":107347,"c":"br"},{"n":"Filipe","e":107139,"c":"br"},{"n":"Phantom","e":106864,"c":"sa"},{"n":"Matsoe","e":106672,"c":"nl"},{"n":"Klass","e":106515,"c":"us"},{"n":"Klown","e":106403,"c":"se"},{"n":"Snood","e":106275,"c":"us"},{"n":"Rainy","e":105227,"c":"jp"},{"n":"Jelty","e":105190,"c":"mx"},{"n":"xMipoli","e":105059,"c":"jp"},{"n":"Zangi","e":105020,"c":"it"},{"n":"Vortexers","e":104955,"c":"gb"},{"n":"Gabzera","e":104643,"c":"br"},{"n":"Flame","e":104510,"c":"pl"},{"n":"Pulga","e":104371,"c":"br"},{"n":"Av","e":103675,"c":"us"},{"n":"Stryker","e":103134,"c":"br"},{"n":"Legedien","e":102525,"c":"us"},{"n":"Riquee","e":102109,"c":"ar"},{"n":"KingRichard","e":102008,"c":"us"},{"n":"Resignz","e":101875,"c":"au"},{"n":"MagMa","e":101802,"c":"au"},{"n":"Runa","e":101739,"c":"jp"},{"n":"FaxFox","e":101500,"c":"kr"},{"n":"Moxie","e":101200,"c":"mx"},{"n":"Nutifps","e":99949,"c":"br"},{"n":"Swag","e":99203,"c":"dk"},{"n":"Aminished","e":99123,"c":"us"},{"n":"DRG","e":98693,"c":"be"},{"n":"Frapai","e":98650,"c":"us"},{"n":"Blacky","e":98473,"c":"fr"},{"n":"Buyuriru","e":98252,"c":"jp"},{"n":"Kraez","e":98175,"c":"us"},{"n":"Drobbаn","e":98113,"c":"se"},{"n":"Danath","e":98017,"c":"au"},{"n":"H4wwk","e":97825,"c":"br"},{"n":"Skits","e":97762,"c":"au"},{"n":"Naetor","e":97725,"c":"jp"},{"n":"Retake","e":97607,"c":"br"},{"n":"Deadra","e":97594,"c":"fr"},{"n":"RoAtDW","e":97235,"c":"us"},{"n":"Suns","e":97220,"c":"au"},{"n":"Cazi","e":97122,"c":"nz"},{"n":"Kylie","e":96914,"c":"tr"},{"n":"Spades","e":96903,"c":"us"},{"n":"Vergo","e":96793,"c":"us"},{"n":"Knight","e":96726,"c":"us"},{"n":"Braydz","e":96580,"c":"us"},{"n":"Dog","e":96416,"c":"us"},{"n":"Xccept","e":96254,"c":"ca"},{"n":"Snowvaks","e":95934,"c":"lb"},{"n":"Clipnode","e":95715,"c":"ar"},{"n":"Leno","e":95642,"c":"us"},{"n":"Moneymaker","e":95532,"c":"se"},{"n":"slaya","e":95506,"c":"nz"},{"n":"MOTOR","e":95343,"c":"tr"},{"n":"xOwN","e":95267,"c":"ar"},{"n":"nosh","e":95128,"c":"ca"},{"n":"Hottie","e":94660,"c":"dk"},{"n":"little","e":94520,"c":"us"},{"n":"Rew","e":94366,"c":"sa"},{"n":"Huizhi","e":94250,"c":"tr"},{"n":"Symetrical","e":94104,"c":"us"},{"n":"Mshary","e":94062,"c":"kw"},{"n":"Magl","e":93685,"c":"fr"},{"n":"Ark","e":93648,"c":"us"},{"n":"Lasers","e":93633,"c":"br"},{"n":"Cringe","e":93628,"c":"ch"},{"n":"Hood.J","e":93600,"c":"kr"},{"n":"Coop","e":93454,"c":"us"},{"n":"Akiira","e":93445,"c":"fr"},{"n":"Kejser","e":92895,"c":"dk"},{"n":"Kouto","e":92850,"c":"fr"},{"n":"Hijoe","e":92550,"c":"de"},{"n":"Kayuun","e":92225,"c":"us"},{"n":"Tennp0","e":91950,"c":"us"},{"n":"Hellonsteam","e":91914,"c":"pk"},{"n":"Hysteria","e":91700,"c":"us"},{"n":"Night","e":91638,"c":"br"},{"n":"Robabz","e":91398,"c":"fr"},{"n":"Ranger","e":91397,"c":"ca"},{"n":"Draceus","e":91250,"c":"se"},{"n":"Dela","e":91163,"c":"se"},{"n":"M11Z","e":91008,"c":"fr"},{"n":"Muselk","e":90998,"c":"au"},{"n":"Ghoul","e":90825,"c":"ca"},{"n":"Lnuef","e":90720,"c":"nl"},{"n":"Sorif","e":90602,"c":"au"},{"n":"Kayky","e":90418,"c":"br"},{"n":"Fury Legendary","e":90355,"c":"ru"},{"n":"Rapit","e":90271,"c":"kw"},{"n":"Tecne","e":90154,"c":"ar"},{"n":"Nolan","e":90135,"c":"us"},{"n":"Skailer","e":90045,"c":"cz"},{"n":"Herrions","e":89783,"c":"us"},{"n":"Rakso","e":89768,"c":"pl"},{"n":"Hornet","e":89385,"c":"us"},{"n":"Resypical","e":89293,"c":"us"},{"n":"Oatley","e":89064,"c":"au"},{"n":"Salko","e":89000,"c":"us"},{"n":"Vorwenn","e":88995,"c":"es"},{"n":"Hogman","e":88942,"c":"us"},{"n":"Hris","e":88919,"c":"mk"},{"n":"Raifla","e":88840,"c":"fi"},{"n":"Regsita","e":88792,"c":"mx"},{"n":"Noxy","e":88642,"c":"us"},{"n":"Fnajen","e":88635,"c":"se"},{"n":"Mansour","e":88521,"c":"sa"},{"n":"Sangild","e":88353,"c":"dk"},{"n":"Fraanticc","e":88350,"c":"us"},{"n":"Amar","e":88226,"c":"de"},{"n":"Keroro","e":88081,"c":"es"},{"n":"Jacob4TV","e":88029,"c":"pl"},{"n":"L3ST3RMZRGS","e":87500,"c":"gt"},{"n":"Jordan Fisher","e":87500,"c":"us"},{"n":"Myth","e":87433,"c":"us"},{"n":"Czb","e":87309,"c":"gb"},{"n":"FuuKun","e":87164,"c":"jp"},{"n":"Keys","e":87121,"c":"us"},{"n":"ilyynina","e":86960,"c":"us"},{"n":"Jace","e":86594,"c":"au"},{"n":"Tomoya","e":86250,"c":"jp"},{"n":"Fledermoys","e":86086,"c":"de"},{"n":"Volko","e":86054,"c":"de"},{"n":"Revised","e":85875,"c":"us"},{"n":"RichHomieQuinn","e":85841,"c":"us"},{"n":"Mojak","e":85526,"c":"br"},{"n":"Fray","e":85429,"c":"de"},{"n":"art1er","e":85250,"c":"de"},{"n":"Packo","e":85028,"c":"pl"},{"n":"vanessuh","e":85000,"c":"us"},{"n":"Sxhool","e":84980,"c":"us"},{"n":"Fresh","e":84921,"c":"au"},{"n":"Shamokiy","e":84648,"c":"ru"},{"n":"RizArt","e":84638,"c":"jp"},{"n":"QnDx","e":84603,"c":"om"}];
const HL_ALL_T=[{"n":"FaZe Clan","e":4635700},{"n":"NRG","e":4592147},{"n":"Sentinels","e":4114758},{"n":"Team Falcons","e":3888494},{"n":"COOLER Esport","e":3742426},{"n":"Lazarus","e":3714968},{"n":"100 Thieves","e":3713116},{"n":"Guild Esports","e":3206091},{"n":"Ghost Gaming","e":3068598},{"n":"Team Liquid","e":2644750},{"n":"XSET","e":2544811},{"n":"TSM","e":2201940},{"n":"Counter Logic Gaming","e":2180194},{"n":"Dignitas","e":2060577},{"n":"Wave Esports","e":1866728},{"n":"Eleven Gaming","e":1861193},{"n":"Galaxy Racer","e":1827174},{"n":"Twisted Minds","e":1805307},{"n":"HavoK by Vitality","e":1762863},{"n":"Become Legends","e":1727207},{"n":"Solary","e":1712591},{"n":"LeStream Esport","e":1638452},{"n":"AIGHT","e":1613412},{"n":"Gentle Mates","e":1453326},{"n":"9z Team","e":1450761},{"n":"Kungarna","e":1389694},{"n":"BIG","e":1373991},{"n":"Team Atlantis","e":1245991},{"n":"Tundra Esports","e":1144010},{"n":"Elite Esports","e":1130988},{"n":"Luminosity Gaming","e":1110438},{"n":"Team 33","e":1033527},{"n":"Exceed","e":992353},{"n":"Crazy Raccoon","e":951640},{"n":"Cloud9","e":897118},{"n":"Manchester City Esports","e":834043},{"n":"Gambit Esports","e":798035},{"n":"FUSION","e":788611},{"n":"Team MCES","e":774955},{"n":"Gaimin Gladiators","e":773239},{"n":"Valhalla Vikings","e":751840},{"n":"PWR","e":716198},{"n":"Ovation eSports","e":679576},{"n":"Virtus.pro","e":674085},{"n":"Witness The Journey","e":673997},{"n":"T1","e":669284},{"n":"Aurora Gaming","e":666705},{"n":"G2 Esports","e":655237},{"n":"Karmine Corp","e":641191},{"n":"Team Atlantic","e":639286},{"n":"Team Vitality","e":618678},{"n":"Misfits Gaming","e":610094},{"n":"Team Singularity","e":604924},{"n":"Fnatic","e":568757},{"n":"Reality Zone","e":524752},{"n":"Team GO","e":524570},{"n":"TrainHard eSport","e":523567},{"n":"XTRA Gaming","e":508467},{"n":"Team New Age","e":503371},{"n":"ALBA E-sports Etajima","e":502827},{"n":"Agent Gaming","e":501480},{"n":"TheCartel Esports","e":482125},{"n":"Xen","e":478380},{"n":"Team Secret","e":473338},{"n":"Valiant","e":471489},{"n":"Riddle","e":454483},{"n":"Built By Gamers","e":452948},{"n":"Grizi Esport","e":444992},{"n":"DetonatioN FocusMe","e":441801},{"n":"HEROIC","e":413612},{"n":"Astralis","e":412432},{"n":"ZETA DIVISION","e":393983},{"n":"AJS","e":393095},{"n":"Complexity Gaming","e":392425},{"n":"All Gamers Global","e":377803},{"n":"World Best Gaming","e":375400},{"n":"Renegades","e":374360},{"n":"Gen.G Esports","e":372680},{"n":"FOKUS CLAN","e":351739},{"n":"Gamma Gaming","e":346877},{"n":"JFT Esports","e":345259},{"n":"XP42 Esports","e":342744},{"n":"Team Envy","e":336450},{"n":"SCYTES","e":333510},{"n":"Team Heretics","e":332916},{"n":"Raised by Kings","e":316041},{"n":"Outcast Region","e":314360},{"n":"Hero Base","e":314028},{"n":"Glorious Esport","e":312010},{"n":"EvozA eSport","e":306928},{"n":"Wave Esports Academy","e":306821},{"n":"Team Vanish","e":301892},{"n":"ENDLESS","e":299613},{"n":"Team SAQR","e":288062},{"n":"Rogue","e":284643},{"n":"TT9 Esports","e":270851},{"n":"Al Qadsiah","e":270430},{"n":"Centric Gaming","e":266764},{"n":"Swamp Gaming","e":262654},{"n":"Cyber Legacy","e":261245},{"n":"Copenhagen Flames","e":259039},{"n":"Tru North Gaming","e":259009},{"n":"Pipeline Esports","e":257192},{"n":"LOUD","e":251586},{"n":"Monaco Esports","e":246976},{"n":"Northern Star Gaming","e":238943},{"n":"Al Ula","e":237030},{"n":"The Ultimates","e":236502},{"n":"POWER eSports","e":235893},{"n":"Chiefs eSports Club","e":233700},{"n":"Tempo Storm","e":228825},{"n":"Team Parallel","e":221153},{"n":"LND Esports","e":217712},{"n":"Team Vikings","e":215665},{"n":"Excel Esports","e":214128},{"n":"Lyost Esport","e":205064},{"n":"Fear Esports","e":201625},{"n":"Team Honor","e":199271},{"n":"Chronic","e":199101},{"n":"Executors One","e":194125},{"n":"Ninjas in Pyjamas","e":193989},{"n":"F4TALITY","e":190667},{"n":"Millenium Salty","e":190200},{"n":"Team Kinguin","e":188343},{"n":"Supremacy","e":183559},{"n":"00 Nation","e":182888},{"n":"Helsinki REDS","e":182660},{"n":"Limit Esports","e":182161},{"n":"Orkadia Esports","e":180238},{"n":"M10 eSports","e":179316},{"n":"RVL ESPORT","e":177662},{"n":"Matrix Gaming","e":172138},{"n":"Vision Esports","e":171493},{"n":"Triple Esports","e":169017},{"n":"KINGS Esports","e":167001},{"n":"Natus Vincere","e":166565},{"n":"Cloud9 White","e":164375},{"n":"T6 eSports","e":163863},{"n":"MOUZ","e":163057},{"n":"Legacy Esports","e":157731},{"n":"Team Pulsar","e":152367},{"n":"Enterprise Gaming","e":152154},{"n":"Cynapse Esports","e":150065},{"n":"w7m esports","e":147819},{"n":"FURIA","e":146223},{"n":"Prodigy","e":145274},{"n":"ASMR eSports","e":144048},{"n":"devils.one","e":143086},{"n":"Alliance","e":142371},{"n":"eRa Eternity","e":140260},{"n":"Team Sarrow","e":140239},{"n":"Newbee","e":140172},{"n":"Future Talent","e":139429},{"n":"Apeks","e":138234},{"n":"FLu Esports","e":136738},{"n":"Warriors ESport","e":136353},{"n":"Team Nature","e":135753},{"n":"RED Canids","e":134742},{"n":"Focus e-Sports","e":134501},{"n":"Leviatán","e":134348},{"n":"SmokeSolid Gaming","e":134295},{"n":"Warriors Esports","e":133934},{"n":"Overt","e":132909},{"n":"Gankstars","e":129730},{"n":"Siko Esports","e":129587},{"n":"Exeed","e":129374},{"n":"AceOfSpades Esports","e":127157},{"n":"Team WS","e":125912},{"n":"FLC Clan","e":125493},{"n":"Ignite Beyond","e":122525},{"n":"Nordavind","e":121204},{"n":"Glory Esports","e":120991},{"n":"KPI Gaming","e":120372},{"n":"GodLike Esports","e":119610},{"n":"Crow Esports","e":119482},{"n":"SORIN","e":119175},{"n":"Team Summit","e":117736},{"n":"Playwell Esports","e":116905},{"n":"SoaR Gaming","e":114492},{"n":"Mind Games","e":112238},{"n":"GLORE","e":111547},{"n":"Epsilon eSports","e":111179},{"n":"Absolute First","e":109597},{"n":"Bolt Esports","e":109250},{"n":"Nester","e":108865},{"n":"HYLND","e":108238},{"n":"ShindeN","e":107772},{"n":"PSG TNA","e":107018},{"n":"A2","e":104495},{"n":"Red Bull eSports","e":103860},{"n":"Titans Esports","e":103420},{"n":"CGN Esports","e":102736},{"n":"JOGO","e":101578},{"n":"One True Army","e":100172},{"n":"LYNX e-sports","e":99544},{"n":"KoS Esports","e":98880},{"n":"Team BDS","e":98300},{"n":"Armour Esports","e":97771},{"n":"R8 Esports","e":94587},{"n":"Frantik Esports","e":93762},{"n":"Bifrost","e":92559},{"n":"QT DIG","e":92292},{"n":"Team Fourty7","e":92080},{"n":"Ultimate Warriors","e":91144},{"n":"Method","e":91011},{"n":"Team TRIBE","e":90316},{"n":"KIT Gaming Elite","e":89922},{"n":"Team Queso","e":88598},{"n":"Royalsten Esports","e":87453},{"n":"Wick eSports","e":86981},{"n":"Detect Esports","e":86448},{"n":"Saints Esports","e":86425},{"n":"FnX Esports","e":85400},{"n":"Oserv Esport","e":84667},{"n":"Continuum Esports","e":84425},{"n":"DRAGONS eSports","e":84158},{"n":"ROC Esports","e":82829},{"n":"Repulse Gaming","e":82117},{"n":"J.Storm","e":82083},{"n":"Loyal Esports","e":81648},{"n":"Lunary","e":80231},{"n":"Tricked Esport","e":80226},{"n":"Luminox Planet","e":79545},{"n":"ENTER FORCE.36","e":78170},{"n":"OpTic Gaming","e":78125},{"n":"Winstrike Team","e":76936},{"n":"Ravens Esports","e":76700},{"n":"ECV Esports","e":75077},{"n":"Team GamerLegion","e":74700},{"n":"VCTRY Esports","e":73308},{"n":"BK ROG Esports","e":72767},{"n":"Force Esports","e":72700},{"n":"Giants Gaming","e":71901},{"n":"01 Esports","e":71788},{"n":"WIZARD ESPORTS","e":70648},{"n":"THE ONE","e":69758},{"n":"Gremio Esports","e":69325},{"n":"GODSENT","e":69262},{"n":"eUnited","e":69100},{"n":"Bravado Gaming","e":68504},{"n":"Void Esports","e":68498},{"n":"Geekay Esports","e":68117},{"n":"Evils Esport","e":65415},{"n":"Delta Esports","e":65305},{"n":"Medal Esports","e":64948},{"n":"Lionscreed","e":64784},{"n":"EDGE","e":64561},{"n":"Vortex CGO","e":63371},{"n":"Team Sonic","e":62743},{"n":"ODD PLAN","e":62133},{"n":"GameWard","e":60106},{"n":"NEXUS","e":59008},{"n":"Wooka Esport","e":58220},{"n":"Esports Psycho","e":57739},{"n":"Zenn eSports","e":56939},{"n":"STRAW","e":56739},{"n":"2R-Esport","e":56523},{"n":"Onyx Ravens","e":54509},{"n":"Aspect Esport","e":54128},{"n":"Cherry Esport","e":53969},{"n":"RAK United","e":52877},{"n":"Premium Gaming","e":52779},{"n":"Marine Region","e":52213},{"n":"Sly Enterprises","e":51250},{"n":"Morning Stars","e":50925},{"n":"CoveX","e":49750},{"n":"Kosma Gaming","e":49588},{"n":"Regal Esports","e":48017},{"n":"mYinsanity","e":48017},{"n":"Uprise Esports","e":47600},{"n":"Team South","e":47532},{"n":"Baron Clan","e":46643},{"n":"PRIDE","e":45803},{"n":"Koji Gaming","e":45443},{"n":"Quadrant","e":45060},{"n":"Paradis Esport","e":43838},{"n":"EGY Esports","e":43630},{"n":"Team 33 Gaming Academy","e":43262},{"n":"GigaHub","e":43148},{"n":"Kiwi Customs","e":43058},{"n":"Stride Esports","e":43038},{"n":"MGA Esport","e":42976},{"n":"Flawless Region","e":42826},{"n":"Mizu Esports","e":42775},{"n":"RXB Esports","e":42601},{"n":"TYT Esports","e":42068},{"n":"Spacestation Gaming","e":41875},{"n":"Hawk Esports","e":41775},{"n":"Blaze E-Sports","e":41745},{"n":"Team ACTIVE","e":41409},{"n":"TRKF E-Sport","e":40730},{"n":"Team Assault","e":40623},{"n":"Cloud9 Blue","e":40000},{"n":"Chrome Realm","e":39600},{"n":"Soul Runner","e":39578},{"n":"MNRS Sports","e":39505},{"n":"Armada Esports","e":38200},{"n":"Onyx Esports","e":38068},{"n":"Devious Esports","e":37818},{"n":"RIZON","e":37734},{"n":"FISTERIA","e":37581},{"n":"Veloce Esports","e":35520},{"n":"Team Orchid","e":35513},{"n":"Rix.GG","e":35114},{"n":"Fruity Esports","e":34854},{"n":"Rival Esports","e":34151},{"n":"K13 Esport","e":34050},{"n":"VISU Gaming","e":33999},{"n":"DynastyX Esport","e":33975},{"n":"Blessed Esports","e":33725},{"n":"FNO","e":33468},{"n":"Xplosion","e":33462},{"n":"Leaf Esports","e":33225},{"n":"Clan Housen","e":33041},{"n":"Team Fury","e":32970},{"n":"OtterWorld Esport","e":32709},{"n":"Lynox Esport","e":32700},{"n":"Ry2 Esports","e":32478},{"n":"orz e-Sports","e":31996},{"n":"Exalty","e":31548},{"n":"NTO Corp","e":31183},{"n":"Isurus Gaming","e":30810},{"n":"R4 Corp","e":30632},{"n":"1P Esport","e":29136},{"n":"OBI E-sports","e":28768},{"n":"25 E-Sports","e":28756},{"n":"Trojan Esports","e":28675},{"n":"Ooredoo Thunders","e":28650},{"n":"Fluxo W7M","e":28607},{"n":"Built For Greatness","e":27134},{"n":"Saint Esports","e":27055},{"n":"B4stardos e-Sports","e":25750},{"n":"Millenium","e":25690},{"n":"Lethal Region","e":25150},{"n":"Guild Academy","e":24482},{"n":"HWP Esports","e":24445},{"n":"Natrix Esports","e":24415},{"n":"LvlUp Esports","e":24325},{"n":"BornToPlay","e":24100},{"n":"Strike Esports","e":23840},{"n":"Team LDLC","e":23432},{"n":"NOM eSports","e":23300},{"n":"Avesta Gaming","e":23129},{"n":"Gz","e":22963},{"n":"Team Nemesis","e":22547},{"n":"Myztro Gaming","e":22430},{"n":"Sudor Esports","e":22320},{"n":"DAMWON Gaming","e":22290},{"n":"GT Esports","e":22286},{"n":"Faid Club","e":21879},{"n":"Team Stallions","e":21166},{"n":"Solary Academy","e":20854},{"n":"STELF","e":20707},{"n":"Lucky e-Sports","e":20634},{"n":"Shark Esports","e":20520},{"n":"Past Bliss","e":20350},{"n":"Precision Esports","e":20150},{"n":"KS7","e":20000},{"n":"Overt Academy","e":20000}];
const HL_ALL_AT='2026-11-12';
/* Режимы: mix как было (два игрока, кто выше); pl и org как на сайтах «у кого больше состояние»: сумма первого
   видна, про второго две кнопки «Больше / Меньше», угаданный встаёт на место первого. */
const HL_MODES=['pl', 'org', 'mix'], HL_MODE_KEY='fncsdraft_hl_mode';
function hlMode(){ try{ const m=localStorage.getItem(HL_MODE_KEY); if(HL_MODES.includes(m)) return m; }catch(e){} return 'pl'; }
function hlChain(){ return !!HL && (HL.mode==='pl' || HL.mode==='org'); }
function hlBestKey(m){ return m==='mix' ? HL_BEST_KEY : HL_BEST_KEY+'_'+m; }
function hlAllPool(m){
  if(hlAllPool[m]) return hlAllPool[m];
  let out;
  if(m==='pl'){
    const by=new Map(); PLAYERS_BASE.forEach(p=>{ if(p && p.handle){ const k=hKey(p); if(!by.has(k) || (!by.get(k).photo && p.photo)) by.set(k, p); } });
    out=HL_ALL_P.map(x=>{ const c=by.get(hKey({handle:x.n}));
      return {name:x.n, flag:x.c ? '<img src="flags/w20/'+esc(x.c)+'.png" alt="" width="18" height="13" style="vertical-align:-1px;margin-right:4px" onerror="this.remove()">' : '',
              photo:c ? hlPhoto(c) : null, org:(c && c.org)||'', val:x.e, rank:0}; });
  } else {
    out=HL_ALL_T.map(x=>{ const fl=clubLogoFile(x.n);
      return {name:x.n, flag:'', photo:ccHasCrest(fl) ? LOGO_DIR+fl : null, logo:true, org:'', val:x.e, rank:0}; });
  }
  out.forEach((r,i)=>{ r.rank=i+1; });
  return hlAllPool[m]=out;
}
// Следующий соперник: чаще узнаваемый (с фото/гербом), не тот же и не с той же суммой.
function hlAllNext(m, a){
  const all=hlAllPool(m); if(all.length<2) return null;
  const known=all.filter(r=>r.photo);
  for(let t=0; t<40; t++){
    const pool=known.length>=2 && Math.random()<0.8 ? known : all;
    const b=pool[Math.floor(Math.random()*pool.length)];
    if(b && (!a || (b.name!==a.name && b.val!==a.val))) return b;
  }
  return null;
}
function hlBest(m){ try{ return +(localStorage.getItem(hlBestKey(m||'mix'))||0)||0; }catch(e){ return 0; } }
function hlBestSet(n){ try{ localStorage.setItem(hlBestKey((HL && HL.mode)||'mix'), String(n)); }catch(e){} }
function hlPhoto(p){ try{ return (typeof photoURLReal==='function' && photoURLReal(p)) || null; }catch(e){ return null; } }
// Финалы, где у карточек есть места: ник один раз (лучшее место), только топ-50, хотя бы четыре разных места.
function hlGroups(){
  if(hlGroups.c) return hlGroups.c;
  const by=new Map();
  PLAYERS_BASE.forEach(p=>{
    if(!p || !p.handle || p.tier==='qualifier' || !(p.placement>0) || !p.event) return;
    const k=p.event+'|'+p.region;
    let g=by.get(k); if(!g){ g={ev:p.event, date:p.date, rows:new Map()}; by.set(k, g); }
    const hk=hKey(p), old=g.rows.get(hk);
    if(!old || p.placement<old.placement) g.rows.set(hk, p);
  });
  const out=[];
  by.forEach(g=>{
    const rows=[...g.rows.values()].filter(p=>p.placement<=50);
    if(new Set(rows.map(p=>p.placement)).size>=4) out.push({ev:g.ev, date:g.date, rows});
  });
  return hlGroups.c=out;
}
// Сначала те, у кого есть фото: их узнают, и вопрос интереснее.
function hlPickTwo(rows, val){
  const known=rows.filter(r=>r.photo);
  const pool=known.length>=2 && Math.random()<0.8 ? known : rows;
  for(let t=0; t<30; t++){
    const a=pool[Math.floor(Math.random()*pool.length)], b=pool[Math.floor(Math.random()*pool.length)];
    if(a!==b && val(a)!==val(b) && hKey({handle:a.name})!==hKey({handle:b.name})) return [a, b];
  }
  return null;
}
function hlRoundPlace(){
  const gs=hlGroups(); if(!gs.length) return null;
  for(let t=0; t<20; t++){
    const g=gs[Math.floor(Math.random()*gs.length)];
    const rows=g.rows.map(p=>({name:p.handle, flag:flagImg(p.nat, 14), photo:hlPhoto(p), org:p.org||'', val:p.placement}));
    const two=hlPickTwo(rows, r=>r.val);
    if(two) return {kind:'place', ev:ccNoDash(String(g.ev)).replace(/\s+-\s+/g, ' · '), date:String(g.date||''), a:two[0], b:two[1]};
  }
  return null;
}
function hlRoundEarn(){
  const list=(typeof HOME_EARN_LQ!=='undefined') ? HOME_EARN_LQ : [];
  if(list.length<2) return null;
  const card=n=>PLAYERS_BASE.find(p=>p && hKey(p)===hKey({handle:n}));
  const rows=list.map(x=>{ const c=card(x.n);
    return {name:x.n, flag:x.c ? '<img src="flags/w20/'+esc(x.c)+'.png" alt="" width="18" height="13" style="vertical-align:-1px;margin-right:4px" onerror="this.remove()">' : '',
            photo:c ? hlPhoto(c) : null, org:(c && c.org)||'', val:x.e}; });
  const two=hlPickTwo(rows, r=>r.val);
  return two ? {kind:'earn', a:two[0], b:two[1]} : null;
}
function hlNext(){
  let r;
  if(hlChain()){
    const a=(HL.round && HL.round.b) || hlAllNext(HL.mode, null), b=a && hlAllNext(HL.mode, a);
    r=b ? {kind:HL.mode==='pl' ? 'allp' : 'allt', a, b} : null;
  } else r=(Math.random()<HL_EARN_SHARE && hlRoundEarn()) || hlRoundPlace() || hlRoundEarn();
  HL.round=r; HL.picked=null;
  hlDraw();
}
function hlOpen(mode){
  if(HL_MODES.includes(mode)){ try{ localStorage.setItem(HL_MODE_KEY, mode); }catch(e){} }
  const m=HL_MODES.includes(mode) ? mode : hlMode();
  HL={mode:m, streak:0, best:hlBest(m), round:null, picked:null, over:false};
  let s=document.getElementById('screen-hl');
  if(!s){ s=document.createElement('div'); s.className='screen'; s.id='screen-hl'; s.innerHTML='<div class="hl-wrap" id="hlBody"></div>';
    const ref=document.getElementById('screen-profile'); (ref ? ref.parentNode : document.body).insertBefore(s, ref ? ref.nextSibling : null); }
  show('screen-hl');
  try{ if(location.hash!=='#hl') history.replaceState(null, '', '#hl'); }catch(e){}
  hlNext();
}
function hlHome(){
  try{ if(location.hash==='#hl') history.replaceState(null, '', location.pathname+location.search); }catch(e){}
  show('screen-mode');
}
function hlValText(r, v){ return r.kind==='place' ? L().hlPlaceV(v) : '$'+ccNum(v); }
// Выше: в финале меньшее место, в призовых большая сумма.
function hlWinner(r){ return r.kind==='earn' ? (r.a.val>r.b.val ? 0 : 1) : (r.a.val<r.b.val ? 0 : 1); }
function hlCardHTML(r, side){
  if(r.kind==='allp' || r.kind==='allt') return hlChainCardHTML(r, side);
  const p=side ? r.b : r.a, done=HL.picked!=null, win=hlWinner(r)===side;
  const cls='hl-card'+(done ? (win ? ' hl-win' : ' hl-lose') : '')+(done && HL.picked===side ? ' hl-mine' : '');
  // Буква ника под фото: не загрузилось фото, остаётся буква.
  const ph='<span class="hl-ph" aria-hidden="true">'+esc(String(p.name).slice(0,1).toUpperCase())+
    (p.photo ? '<img src="'+esc(p.photo)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'</span>';
  return '<button type="button" class="'+cls+'" onclick="hlPick('+side+')"'+(done ? ' disabled' : '')+'>'+ph+
    '<b class="hl-nm">'+p.flag+esc(p.name)+'</b>'+(p.org ? '<small class="hl-org">'+esc(p.org)+'</small>' : '<small class="hl-org">&nbsp;</small>')+
    '<span class="hl-val">'+(done ? esc(hlValText(r, p.val)) : '?')+'</span></button>';
}
function hlPhHTML(p){
  return '<span class="hl-ph'+(p.logo ? ' hl-ph-logo' : '')+'" aria-hidden="true">'+esc(String(p.name).slice(0,1).toUpperCase())+
    (p.photo ? '<img src="'+esc(p.photo)+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'</span>';
}
function hlChainCardHTML(r, side){
  const p=side ? r.b : r.a, T=L(), done=HL.picked!=null, ok=done && hlChainOk(r, HL.picked);
  const sub='<small class="hl-org">'+(p.org ? esc(p.org) : '&nbsp;')+'</small>';
  const rank=n=>'<small class="hl-rank">'+(n ? esc(T.hlRank(n)) : '&nbsp;')+'</small>';
  const head=hlPhHTML(p)+'<b class="hl-nm">'+p.flag+esc(p.name)+'</b>'+sub+(T.hlHas ? '<span class="hl-said">'+esc(T.hlHas)+'</span>' : '');
  if(!side) return '<div class="hl-card hl-known">'+head+'<span class="hl-val hl-val-on">'+esc(hlValText(r, p.val))+'</span>'+
    '<span class="hl-said">'+esc(T.hlPrize)+'</span>'+rank(p.rank)+'</div>';
  const cls='hl-card hl-known'+(done ? (ok ? ' hl-win hl-mine' : ' hl-lose hl-mine') : '');
  const mid=done ? '<span class="hl-val">'+esc(hlValText(r, p.val))+'</span>'
    : '<span class="hl-hilo"><button type="button" class="hl-hi" onclick="hlPickDir(1)">▲ '+esc(T.hlHigher)+'</button>'+
      '<button type="button" class="hl-lo" onclick="hlPickDir(-1)">▼ '+esc(T.hlLower)+'</button></span>';
  return '<div class="'+cls+'">'+head+mid+'<span class="hl-said">'+esc(done ? T.hlPrize : T.hlThan(r.a.name))+'</span>'+rank(done ? p.rank : 0)+'</div>';
}
function hlChainOk(r, dir){ return dir>0 ? r.b.val>r.a.val : r.b.val<r.a.val; }
function hlPickDir(dir){
  if(!HL || !HL.round || HL.picked!=null || HL.over || !hlChain()) return;
  HL.picked=dir;
  const ok=hlChainOk(HL.round, dir);
  if(ok){ HL.streak++; if(HL.streak>HL.best){ HL.best=HL.streak; hlBestSet(HL.best); } }
  else HL.over=true;
  hlDraw();
  if(ok) setTimeout(()=>{ if(HL && !HL.over && HL.picked!=null) hlNext(); }, 1400);
}
function hlTabsHTML(){
  const T=L();
  return '<div class="hl-tabs" role="tablist">'+HL_MODES.map(m=>'<button type="button" role="tab" aria-selected="'+(HL.mode===m)+'" class="hl-tab'+(HL.mode===m ? ' on' : '')+
    '" onclick="hlOpen(\''+m+'\')">'+esc(T['hlMode_'+m])+'</button>').join('')+'</div>';
}
function hlDraw(){
  const box=document.getElementById('hlBody'); if(!box || !HL) return;
  const T=L(), r=HL.round;
  const top='<div class="hl-top"><button type="button" class="hl-back" onclick="hlHome()">‹ '+esc(T.hlBack)+'</button>'+
    '<span class="hl-score"><b>'+esc(T.hlStreak(HL.streak))+'</b><small>'+esc(T.hlBest(HL.best))+'</small></span></div>';
  if(!r){ box.innerHTML=top+hlTabsHTML()+'<p class="hl-q">'+esc(T.hlEmpty)+'</p>'; return; }
  const q=(r.kind==='allp' || r.kind==='allt') ? '<p class="hl-q">'+esc(T.hlQAll(r.b.name, r.a.name))+
      '<small>'+esc(T.hlSrcAll)+'</small></p>'
    : r.kind==='earn' ? '<p class="hl-q">'+esc(T.hlQEarn)+'<small>'+esc(T.hlSrcEarn)+'</small></p>'
                          : '<p class="hl-q">'+esc(T.hlQPlace)+'<small>'+esc(r.ev)+(r.date ? ' · '+esc(r.date) : '')+'</small></p>';
  let end='';
  if(HL.over){
    end='<div class="hl-end"><b>'+esc(T.hlOver(HL.streak))+'</b>'+(HL.streak>0 && HL.streak>=HL.best ? '<small>'+esc(T.hlNewBest)+'</small>' : '')+
      '<div class="hl-btns"><button type="button" class="hero-btn hero-btn-go" onclick="hlOpen(HL.mode)">'+esc(T.hlAgain)+'</button>'+
      '<button type="button" class="hero-btn hero-btn-alt" id="hlCopyBtn" onclick="hlCopy()">'+esc(T.hlCopy)+'</button></div></div>';
  }
  const big=hlChain();
  box.classList.toggle('hl-big', big);
  const vs=big ? '<span class="hl-vsdot'+(HL.picked!=null ? (hlChainOk(r, HL.picked) ? ' ok">✓' : ' bad">✕') : '">VS')+'</span>'
               : '<span class="hl-vs">VS</span>';
  box.innerHTML=top+'<h1 class="hl-title">'+esc(T.hlTitle)+'</h1>'+hlTabsHTML()+(big ? '' : q)+
    '<div class="hl-pair">'+hlCardHTML(r, 0)+vs+hlCardHTML(r, 1)+'</div>'+
    (big ? '<p class="hl-hint">'+esc(T.hlSrcAll)+'</p>' : '')+
    (HL.picked==null && !hlChain() ? '<p class="hl-hint">'+esc(T.hlHint)+'</p>' : '')+end;
}
function hlPick(side){
  if(!HL || !HL.round || HL.picked!=null || HL.over || hlChain()) return;
  HL.picked=side;
  const ok=hlWinner(HL.round)===side;
  if(ok){ HL.streak++; if(HL.streak>HL.best){ HL.best=HL.streak; hlBestSet(HL.best); } }
  else HL.over=true;
  hlDraw();
  if(ok) setTimeout(()=>{ if(HL && !HL.over && HL.picked!=null) hlNext(); }, 1200);
}
function hlCopy(){
  const t='fncsdraft higher or lower'+(HL && HL.mode!=='mix' ? ' ('+(HL.mode==='pl' ? 'players' : 'teams')+', all-time earnings)' : '')+': '+(HL ? HL.streak : 0)+'\nfncsdraft.com/#hl';
  const done=()=>{ const b=document.getElementById('hlCopyBtn'); if(b) b.textContent=L().hlCopied; };
  try{ navigator.clipboard.writeText(t).then(done, done); }catch(e){ done(); }
}
window.addEventListener('load', ()=>{ if(location.hash==='#hl') setTimeout(()=>{ try{ hlOpen(); }catch(e){} }, 300); });
// Плашка на главной: числа таблиц, рекорд и настоящая пара (обе с фото), у второго вопрос.
function homeHlDraw(){
  const T=L(), set=(id, v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set('hhCntP', T.hhCntP(HL_ALL_P.length)); set('hhCntT', T.hhCntT(HL_ALL_T.length));
  const best=Math.max(hlBest('pl'), hlBest('org')); set('hhBest', best ? T.hlBest(best) : '');
  const box=document.getElementById('hhPair'); if(!box) return;
  if(!homeHlDraw.pair){ const a=hlAllNext('pl', null), b=a && hlAllNext('pl', a); homeHlDraw.pair=b ? [a, b] : null; }
  const pr=homeHlDraw.pair; if(!pr){ box.innerHTML=''; return; }
  const card=(p, v)=>'<span class="hh-card">'+hlPhHTML(p)+'<b>'+p.flag+esc(p.name)+'</b><strong'+(v ? '' : ' class="q"')+'>'+(v ? '$'+ccNum(p.val) : '?')+'</strong></span>';
  box.innerHTML=card(pr[0], true)+'<span class="hh-vs">VS</span>'+card(pr[1], false);
  box.setAttribute('aria-label', T.hlTitle);
}
window.addEventListener('load', ()=>setTimeout(()=>{ try{ homeHlDraw(); }catch(e){} }, 0));
Object.assign(I18N.ru, {hhTag:'Новое', hhSub:'Чьи призовые за всё время больше: два игрока или два клуба, сумма первого видна. Серия до первой ошибки.', hhCntP:n=>n+' игроков', hhCntT:n=>n+' клубов', hhPlayP:'Играть', hhPlayT:'Клубы', hlHas:'', hlPrize:'призовых за всё время', hlThan:a=>'призовых, чем у '+a, hlRank:n=>n+'-й в мире', hlMode_pl:'Игроки', hlMode_org:'Клубы', hlMode_mix:'Финалы и 2026', hlHigher:'Больше', hlLower:'Меньше', hlSrcAll:'Liquipedia, призовые за всё время', hlQAll:(b,a)=>'У '+b+' призовых за всё время больше или меньше, чем у '+a+'?', hlLink:'Больше или меньше', hlTitle:'Больше или меньше', hlBack:'Главная', hlStreak:n=>'Серия: '+n, hlBest:n=>'Рекорд: '+n,
  hlQPlace:'Кто занял место выше в этом финале?', hlQEarn:'Кто заработал больше призовых в 2026?', hlSrcEarn:'Liquipedia, все турниры года',
  hlHint:'Нажми на того, кто выше', hlPlaceV:p=>p+' место', hlOver:n=>'Серия окончена: '+n, hlNewBest:'Новый рекорд',
  hlAgain:'Ещё раз', hlCopy:'Скопировать результат', hlCopied:'Скопировано', hlEmpty:'Нет данных для вопроса'});
Object.assign(I18N.en, {hhTag:'New', hhSub:'Who has more all-time prize money: two players or two teams, the first one’s total is shown. Go until your first miss.', hhCntP:n=>n+' players', hhCntT:n=>n+' teams', hhPlayP:'Play', hhPlayT:'Teams', hlHas:'has', hlPrize:'all-time prize money', hlThan:a=>'prize money than '+a, hlRank:n=>'#'+n+' all-time', hlMode_pl:'Players', hlMode_org:'Teams', hlMode_mix:'Finals and 2026', hlHigher:'Higher', hlLower:'Lower', hlSrcAll:'Liquipedia, all-time prize money', hlQAll:(b,a)=>'Has '+b+' won more or less than '+a+' all-time?', hlLink:'Higher or lower', hlTitle:'Higher or lower', hlBack:'Home', hlStreak:n=>'Streak: '+n, hlBest:n=>'Best: '+n,
  hlQPlace:'Who placed higher in this final?', hlQEarn:'Who earned more prize money in 2026?', hlSrcEarn:'Liquipedia, every event of the year',
  hlHint:'Tap the one who is higher', hlPlaceV:p=>'#'+p, hlOver:n=>'Streak over: '+n, hlNewBest:'New best',
  hlAgain:'Play again', hlCopy:'Copy result', hlCopied:'Copied', hlEmpty:'No data for a question'});
Object.assign(I18N.fr, {hhTag:'Nouveau', hhSub:'Qui a le plus de gains au total : deux joueurs ou deux équipes, le total du premier est affiché. Jusqu’à la première erreur.', hhCntP:n=>n+' joueurs', hhCntT:n=>n+' équipes', hhPlayP:'Jouer', hhPlayT:'Équipes', hlHas:'a gagné', hlPrize:'de gains au total', hlThan:a=>'que '+a, hlRank:n=>n+(n===1?'er':'e')+' de tous les temps', hlMode_pl:'Joueurs', hlMode_org:'Équipes', hlMode_mix:'Finales et 2026', hlHigher:'Plus', hlLower:'Moins', hlSrcAll:'Liquipedia, gains de tous les temps', hlQAll:(b,a)=>b+' a gagné plus ou moins que '+a+' au total ?', hlLink:'Plus ou moins', hlTitle:'Plus ou moins', hlBack:'Accueil', hlStreak:n=>'Série : '+n, hlBest:n=>'Record : '+n,
  hlQPlace:'Qui a fini plus haut dans cette finale ?', hlQEarn:'Qui a gagné le plus en 2026 ?', hlSrcEarn:'Liquipedia, tous les tournois de l’année',
  hlHint:'Touche celui qui est au-dessus', hlPlaceV:p=>p+(p===1 ? 're' : 'e')+' place', hlOver:n=>'Série terminée : '+n, hlNewBest:'Nouveau record',
  hlAgain:'Rejouer', hlCopy:'Copier le résultat', hlCopied:'Copié', hlEmpty:'Pas de données pour une question'});
Object.assign(I18N.it, {hhTag:'Nuovo', hhSub:'Chi ha più montepremi in totale: due giocatori o due team, il totale del primo è visibile. Fino al primo errore.', hhCntP:n=>n+' giocatori', hhCntT:n=>n+' team', hhPlayP:'Gioca', hhPlayT:'Team', hlHas:'ha vinto', hlPrize:'di montepremi in totale', hlThan:a=>'di '+a, hlRank:n=>n+'° di sempre', hlMode_pl:'Giocatori', hlMode_org:'Team', hlMode_mix:'Finali e 2026', hlHigher:'Di più', hlLower:'Di meno', hlSrcAll:'Liquipedia, montepremi di sempre', hlQAll:(b,a)=>b+' ha guadagnato più o meno di '+a+' in totale?', hlLink:'Più o meno', hlTitle:'Più o meno', hlBack:'Home', hlStreak:n=>'Serie: '+n, hlBest:n=>'Record: '+n,
  hlQPlace:'Chi è arrivato più in alto in questa finale?', hlQEarn:'Chi ha guadagnato di più nel 2026?', hlSrcEarn:'Liquipedia, tutti i tornei dell’anno',
  hlHint:'Tocca chi sta più in alto', hlPlaceV:p=>p+'° posto', hlOver:n=>'Serie finita: '+n, hlNewBest:'Nuovo record',
  hlAgain:'Gioca ancora', hlCopy:'Copia il risultato', hlCopied:'Copiato', hlEmpty:'Nessun dato per una domanda'});
Object.assign(I18N.ru, {mvTitle:n=>'Двигающиеся круги · живы '+n, mvEarly:'Заходить первыми', mvEarlyNote:v=>'Сразу в новый круг, пока его не заняли: в концовках финала так дожили '+v+'%', mvEdge:'Краем со штормом', mvEdgeNote:v=>'Едем по стене шторма и забираем тех, кто опоздал: так дожили '+v+'%', mvTarp:'Тарп через шторм', mvTarpNote:'Ждём до последнего и тарпим сквозь шторм: тише на входе, но здоровье и ресы уходят', mvThird:'Третьить ротирующих', lsTitle:n=>'Последние отряды · живы '+n, lsHold:'Держать место', lsHoldNote:'Сидим в своей коробке и ждём, пока другие разменяются: место решат круги', lsHoldGot:'Держим место, ждём размена', lsPush:'Давить ради элимов', lrTitle:'Лут на точке', lrHint:n=>'Открывай сундуки сам. До зоны успеешь около '+n+', дальше теряешь ресы', lrOpened:(o,n)=>'Открыто '+o+' из '+n, lrOpen1:'Открыть сундук', lrOpen5:'Открыть 5', lrAuto:'Собрать лучшее', lrGo:'Ротироваться', lrInv:'Инвентарь', lrGround:'На земле: тап, чтобы взять', lrDrop:'Выбросить', ccMobTrainNeed:'нужен телефон или планшет: Магазин → Консоли и мобильные', ccMobTile:'МОБ', ccMobTrainCap:'выше 85 мобильный рейтинг растёт только от мобильных капов', lrMoveTip:'Тапни, чтобы переложить', lrOneMove:'Мувмент можно носить только один', lrSelHint:n=>n+': тапни слот, куда положить (свой или тиммейта), или ещё раз, чтобы выбросить', lrFull:'Инвентарь полон: выброси что-нибудь из слота', lrAmmo:(a,n)=>'Патроны '+a+'/'+n, lrAmmoBox:'Ящик с патронами', lrRare:'Редкий сундук', lrAmmoLow:'мало патронов, −1 к силе', lrSplitPen:n=>'не у всех по два ствола, −'+n+' к силе', lrTakeFor:'Брать:', lrMe:'себе', lrInvOf:n=>'Инвентарь '+n, lrSplit:'Поделить', lrBusLate:p=>'автобус далеко, сели позже: сундуков до зоны −'+p+'%', lrBusNear:'Автобус прошёл рядом, сели сразу', lrVault:'Хранилище', lrVaultBig:'Большое хранилище', lrFloor:'Лут на полу', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","дроб","ПП","пист","снайп"]; return 'Шансы '+(s ? s+' · ' : '')+'Сундук: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · хилка '+h+' · Пол (догадка): '+rr(f, CL)+', патроны '+a; }, lrBoss:n=>'Босс '+n+': убить и забрать мифик и медальон', lrBossLeft:(n,p)=>'ушли без босса '+n+', мифика нет: −'+p+' к силе', rpTitle:'Каким путём к кругу', rpHint:'Красные точки: отряды на карте. Кто стоит у линии, с тем можно встретиться', rpDirect:'Прямо', rpLeft:'Обход слева', rpRight:'Обход справа', rpNote:(k,p,m)=>(k ? 'на пути отрядов: '+k+' · встреча '+p+'%' : 'на пути никого')+(m ? ' · −'+m+' ресов на стройку' : ''), rpSafest:'тише всего', rpClear:n=>n+': дошли без встреч', rpMet:n=>'По дороге встретили '+n, rkTitle:'Ранкед', rkArenaTitle:'Арена', rkDiv:'див.', rkUnranked:'Без ранга',
  rkPlaceFirst:'Первый матч сезона поставит ранг', rkPlaceFrom:n=>'Квалификация сезона, прошлый ранг: '+n,
  rkSeasonLine:n=>'Матчей за карьеру: '+n, rkToNext:(a,b)=>a+' до '+b, rkCost:n=>'вход −'+n+'% за матч',
  rkUnrealBoard:'место в таблице Unreal', rkHypeBoard:'место в Champion League', rkRules:u=>'правила '+u,
  rkLast:d=>'Сессия '+d, rkForm:f=>'форма '+(f>0?'+':'')+f, rkPlaced:n=>'квалификация: '+n, rkUnrealPts:'очк. Unreal',
  rkSimMatch:(n,of)=>'Матч '+n+' из '+of, rkSimBus:'Автобус', rkSimLand:'Высадка', rkSimStorm:n=>'Круг '+n, rkSimAlive:'в лобби', rkSimKill:'Выбил', rkSimSkip:'Пропустить', rkSimDone:'Готово', rkSimUp:'Повышение', rkSimDown:'Понижение', rkSimTotal:'Итог сессии', rkTiers:['Бронза','Серебро','Золото','Платина','Алмаз','Элита','Чемпион','Нереальный'], rkLeagues:['Открытая лига','Лига претендентов','Лига чемпионов'], rkVictory:'Королевская победа', rkBy:'Выбил', rkLobby:'В лобби:', rkKills:'килл.', rkPeaks:'Пик прошлых сезонов',
  rkPlay:n=>'Играть '+n+' матча', rkDayBusy:'Сегодня турнирный день, сессия в свободный день',
  rkNewsUp:n=>'Ранкед: повышение до '+n, rkNewsDown:n=>'Ранкед: понижение до '+n, rkNewsPlaced:n=>'Ранкед: квалификация, ранг '+n,
  rkNewsUnreal:n=>'Ранкед: '+n+'! Теперь место в мировой таблице', rkNewsTop100:p=>'Ранкед: топ-100 Unreal, место #'+p,
  rkNewsTop1:()=>'Ранкед: первое место в таблице Unreal', rkNewsReset:()=>'Новый сезон: ранг сброшен, первый матч квалификационный',
  rkNewsArenaUp:n=>'Арена: '+n, rkNewsChamp:n=>'Арена: Champion League! '+n, rkNewsArenaReset:u=>'Обновление '+u+': Hype на Арене сброшен'});
Object.assign(I18N.en, {mvTitle:n=>'Moving zones · '+n+' alive', mvEarly:'Rotate first', mvEarlyNote:v=>'Straight into the new circle before it fills up: '+v+'% survived this in the final endgames', mvEdge:'Ride the storm edge', mvEdgeNote:v=>'Move along the storm wall and pick off the late ones: '+v+'% survived this', mvTarp:'Tarp through the storm', mvTarpNote:'Wait till the end and tarp through: quieter on the way in, but it costs health and mats', mvThird:'Third-party the rotators', lsTitle:n=>'Last squads · '+n+' alive', lsHold:'Hold placement', lsHoldNote:'Stay in our box and let the others trade: the circles decide the placement', lsHoldGot:'Holding placement, waiting for a trade', lsPush:'Push for elims', lrTitle:'Loot at your spot', lrHint:n=>'Open chests yourself. About '+n+' before the zone, after that you lose mats', lrOpened:(o,n)=>'Opened '+o+' of '+n, lrOpen1:'Open chest', lrOpen5:'Open 5', lrAuto:'Take the best', lrGo:'Rotate', lrInv:'Inventory', lrGround:'On the ground: tap to pick up', lrDrop:'Drop', ccMobTrainNeed:'needs a phone or tablet: Shop → Consoles and mobile', ccMobTile:'MOB', ccMobTrainCap:'above 85 the mobile rating grows only from mobile cups', lrMoveTip:'Tap to move', lrOneMove:'Only one movement item per player', lrSelHint:n=>n+': tap a slot to put it in (yours or a teammate’s), or tap it again to drop it', lrFull:'Inventory full: drop something from a slot', lrAmmo:(a,n)=>'Ammo '+a+'/'+n, lrAmmoBox:'Ammo box', lrRare:'Rare chest', lrAmmoLow:'low ammo, −1 power', lrSplitPen:n=>'not everyone has two guns, −'+n+' power', lrTakeFor:'Take for:', lrMe:'me', lrInvOf:n=>n+' inventory', lrSplit:'Split loot', lrBusLate:p=>'bus far away, landed late: '+p+'% fewer chests before the zone', lrBusNear:'Bus flew close, landed right away', lrVault:'Vault', lrVaultBig:'Big vault', lrFloor:'Floor loot', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","shotgun","SMG","pistol","sniper"]; return 'Odds '+(s ? s+' · ' : '')+'Chest: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · heal '+h+' · Floor (estimate): '+rr(f, CL)+', ammo '+a; }, lrBoss:n=>'Boss '+n+': kill for the mythic and the medallion', lrBossLeft:(n,p)=>'left boss '+n+' alive, no mythic: −'+p+' power', rpTitle:'Which way to the zone', rpHint:'Red dots are squads on the map. Whoever stands by the line, you may run into', rpDirect:'Straight', rpLeft:'Around the left', rpRight:'Around the right', rpNote:(k,p,m)=>(k ? 'squads on the way: '+k+' · '+p+'% to meet' : 'nobody on the way')+(m ? ' · −'+m+' mats on builds' : ''), rpSafest:'quietest', rpClear:n=>n+': got there without a fight', rpMet:n=>'Ran into '+n+' on the way', rkTitle:'Ranked', rkArenaTitle:'Arena', rkDiv:'div.', rkUnranked:'Unranked',
  rkPlaceFirst:'The first match of the season sets your rank', rkPlaceFrom:n=>'Season placement, last rank: '+n,
  rkSeasonLine:n=>'Career matches: '+n, rkToNext:(a,b)=>a+' to '+b, rkCost:n=>'entry −'+n+'% per match',
  rkUnrealBoard:'Unreal leaderboard', rkHypeBoard:'Champion League standing', rkRules:u=>'rules '+u,
  rkLast:d=>'Session '+d, rkForm:f=>'form '+(f>0?'+':'')+f, rkPlaced:n=>'placed: '+n, rkUnrealPts:'Unreal pts',
  rkSimMatch:(n,of)=>'Match '+n+' of '+of, rkSimBus:'Battle Bus', rkSimLand:'Landing', rkSimStorm:n=>'Zone '+n, rkSimAlive:'left', rkSimKill:'Eliminated', rkSimSkip:'Skip', rkSimDone:'Done', rkSimUp:'Rank up', rkSimDown:'Rank down', rkSimTotal:'Session result', rkTiers:['Bronze','Silver','Gold','Platinum','Diamond','Elite','Champion','Unreal'], rkLeagues:['Open League','Contender League','Champion League'], rkVictory:'Victory Royale', rkBy:'Eliminated by', rkLobby:'In the lobby:', rkKills:'kills', rkPeaks:'Peak in past seasons',
  rkPlay:n=>'Play '+n+' matches', rkDayBusy:'Tournament day today, play a session on a free day',
  rkNewsUp:n=>'Ranked: promoted to '+n, rkNewsDown:n=>'Ranked: dropped to '+n, rkNewsPlaced:n=>'Ranked: placed at '+n,
  rkNewsUnreal:n=>'Ranked: '+n+'! On the world leaderboard now', rkNewsTop100:p=>'Ranked: top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Ranked: number one on the Unreal leaderboard', rkNewsReset:()=>'New season: rank reset, the first match is a placement',
  rkNewsArenaUp:n=>'Arena: '+n, rkNewsChamp:n=>'Arena: Champion League! '+n, rkNewsArenaReset:u=>'Update '+u+': Arena Hype reset'});
Object.assign(I18N.fr, {mvTitle:n=>'Zones mobiles · '+n+' en vie', mvEarly:'Entrer les premiers', mvEarlyNote:v=>'Direct dans la nouvelle zone avant qu’elle se remplisse : '+v+'% ont survécu ainsi en fin de finale', mvEdge:'Longer la tempête', mvEdgeNote:v=>'On suit le mur de la tempête et on prend les retardataires : '+v+'% ont survécu', mvTarp:'Tarp dans la tempête', mvTarpNote:'On attend la fin et on tarp à travers : plus calme à l’entrée, mais ça coûte de la vie et des matériaux', mvThird:'Third-party les rotations', lsTitle:n=>'Dernières équipes · '+n+' en vie', lsHold:'Tenir la place', lsHoldNote:'On reste dans notre box et on laisse les autres s’échanger : les zones décident la place', lsHoldGot:'On tient la place, on attend un échange', lsPush:'Pousser pour les kills', lrTitle:'Loot sur ton spot', lrHint:n=>'Ouvre les coffres toi-même. Environ '+n+' avant la zone, ensuite tu perds des matériaux', lrOpened:(o,n)=>'Ouverts '+o+' sur '+n, lrOpen1:'Ouvrir un coffre', lrOpen5:'Ouvrir 5', lrAuto:'Prendre le meilleur', lrGo:'Rotation', lrInv:'Inventaire', lrGround:'Au sol : touche pour ramasser', lrDrop:'Jeter', ccMobTrainNeed:'il faut un téléphone ou une tablette : Boutique → Consoles et mobile', ccMobTrainCap:'au-dessus de 85, la note mobile ne monte qu’avec les cups mobiles', lrMoveTip:'Touche pour déplacer', lrOneMove:'Un seul objet de mobilité par joueur', lrSelHint:n=>n+' : touche un emplacement (le tien ou celui d’un coéquipier), ou touche-le encore pour le jeter', lrFull:'Inventaire plein : jette quelque chose', lrAmmo:(a,n)=>'Munitions '+a+'/'+n, lrAmmoBox:'Caisse de munitions', lrRare:'Coffre rare', lrAmmoLow:'peu de munitions, −1 puissance', lrSplitPen:n=>'pas deux armes pour tout le monde, −'+n+' puissance', lrTakeFor:'Pour :', lrMe:'moi', lrInvOf:n=>'Inventaire de '+n, lrSplit:'Partager', lrBusLate:p=>'bus loin, atterri tard : '+p+'% de coffres en moins avant la zone', lrBusNear:'Le bus est passé près, atterri tout de suite', lrVault:'Coffre-fort', lrVaultBig:'Grand coffre-fort', lrFloor:'Loot au sol', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["FA","pompe","SMG","pistolet","sniper"]; return 'Chances '+(s ? s+' · ' : '')+'Coffre : '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · soin '+h+' · Sol (estimation) : '+rr(f, CL)+', munitions '+a; }, lrBoss:n=>'Boss '+n+' : le tuer pour la mythique et le médaillon', lrBossLeft:(n,p)=>'boss '+n+' laissé, pas de mythique : −'+p+' puissance', rpTitle:'Par où vers la zone', rpHint:'Points rouges : les escouades. Celles près de la ligne, tu peux les croiser', rpDirect:'Tout droit', rpLeft:'Par la gauche', rpRight:'Par la droite', rpNote:(k,p,m)=>(k ? 'escouades sur le chemin : '+k+' · rencontre '+p+'%' : 'personne sur le chemin')+(m ? ' · −'+m+' matériaux' : ''), rpSafest:'le plus calme', rpClear:n=>n+' : arrivés sans combat', rpMet:n=>'Croisé '+n+' en route', rkTitle:'Classé', rkArenaTitle:'Arène', rkDiv:'div.', rkUnranked:'Non classé',
  rkPlaceFirst:'Le premier match de la saison fixe ton rang', rkPlaceFrom:n=>'Placement de saison, dernier rang : '+n,
  rkSeasonLine:n=>'Matchs en carrière : '+n, rkToNext:(a,b)=>a+' avant '+b, rkCost:n=>'entrée −'+n+' % par match',
  rkUnrealBoard:'classement Unreal', rkHypeBoard:'place en Champion League', rkRules:u=>'règles '+u,
  rkLast:d=>'Session '+d, rkForm:f=>'forme '+(f>0?'+':'')+f, rkPlaced:n=>'placé : '+n, rkUnrealPts:'pts Unreal',
  rkSimMatch:(n,of)=>'Match '+n+' sur '+of, rkSimBus:'Bus de combat', rkSimLand:'Atterrissage', rkSimStorm:n=>'Zone '+n, rkSimAlive:'restants', rkSimKill:'Éliminé', rkSimSkip:'Passer', rkSimDone:'OK', rkSimUp:'Rang supérieur', rkSimDown:'Rang inférieur', rkSimTotal:'Bilan de la session', rkTiers:['Bronze','Argent','Or','Platine','Diamant','Élite','Champion','Irréel'], rkLeagues:['Ligue ouverte','Ligue des challengers','Ligue des champions'], rkVictory:'Top 1', rkBy:'Éliminé par', rkLobby:'Dans le lobby :', rkKills:'kills', rkPeaks:'Pic des saisons passées',
  rkPlay:n=>'Jouer '+n+' matchs', rkDayBusy:'Jour de tournoi, joue une session un jour libre',
  rkNewsUp:n=>'Classé : promu '+n, rkNewsDown:n=>'Classé : redescendu '+n, rkNewsPlaced:n=>'Classé : placé '+n,
  rkNewsUnreal:n=>'Classé : '+n+' ! Dans le classement mondial', rkNewsTop100:p=>'Classé : top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Classé : numéro un du classement Unreal', rkNewsReset:()=>'Nouvelle saison : rang remis à zéro, premier match de placement',
  rkNewsArenaUp:n=>'Arène : '+n, rkNewsChamp:n=>'Arène : Champion League ! '+n, rkNewsArenaReset:u=>'Mise à jour '+u+' : Hype d’Arène remis à zéro'});
Object.assign(I18N.it, {mvTitle:n=>'Zone mobili · vivi '+n, mvEarly:'Entrare per primi', mvEarlyNote:v=>'Subito nel nuovo cerchio prima che si riempia: così è sopravvissuto il '+v+'% nei finali', mvEdge:'Lungo la tempesta', mvEdgeNote:v=>'Seguiamo il muro della tempesta e prendiamo i ritardatari: sopravvissuto il '+v+'%', mvTarp:'Tarp nella tempesta', mvTarpNote:'Aspettiamo fino alla fine e tarpiamo attraverso: ingresso più tranquillo, ma costa vita e materiali', mvThird:'Third-party chi ruota', lsTitle:n=>'Ultime squadre · vivi '+n, lsHold:'Tenere la posizione', lsHoldNote:'Restiamo nel nostro box e lasciamo che gli altri si scambino: la posizione la decidono i cerchi', lsHoldGot:'Teniamo la posizione, aspettiamo uno scambio', lsPush:'Spingere per le kill', lrTitle:'Loot sul tuo spot', lrHint:n=>'Apri i forzieri da solo. Circa '+n+' prima della zona, poi perdi materiali', lrOpened:(o,n)=>'Aperti '+o+' su '+n, lrOpen1:'Apri forziere', lrOpen5:'Apri 5', lrAuto:'Prendi il meglio', lrGo:'Ruota', lrInv:'Inventario', lrGround:'A terra: tocca per raccogliere', lrDrop:'Butta', ccMobTrainNeed:'serve un telefono o tablet: Negozio → Console e mobile', ccMobTrainCap:'sopra 85 il rating mobile sale solo con le cup mobile', lrMoveTip:'Tocca per spostare', lrOneMove:'Un solo oggetto di movimento a testa', lrSelHint:n=>n+': tocca uno slot (tuo o di un compagno), o toccalo di nuovo per buttarlo', lrFull:'Inventario pieno: butta qualcosa', lrAmmo:(a,n)=>'Munizioni '+a+'/'+n, lrAmmoBox:'Cassa di munizioni', lrRare:'Forziere raro', lrAmmoLow:'poche munizioni, −1 potenza', lrSplitPen:n=>'non tutti hanno due armi, −'+n+' potenza', lrTakeFor:'Per:', lrMe:'me', lrInvOf:n=>'Inventario di '+n, lrSplit:'Dividi', lrBusLate:p=>'bus lontano, atterrati tardi: '+p+'% di forzieri in meno prima della zona', lrBusNear:'Il bus è passato vicino, atterrati subito', lrVault:'Caveau', lrVaultBig:'Grande caveau', lrFloor:'Loot a terra', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","pompa","SMG","pistola","cecchino"]; return 'Probabilità '+(s ? s+' · ' : '')+'Forziere: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · cura '+h+' · Terra (stima): '+rr(f, CL)+', munizioni '+a; }, lrBoss:n=>'Boss '+n+': uccidilo per la mitica e il medaglione', lrBossLeft:(n,p)=>'boss '+n+' lasciato, niente mitica: −'+p+' potenza', rpTitle:'Da che parte verso la zona', rpHint:'Punti rossi: le squadre. Chi sta vicino alla linea, puoi incontrarlo', rpDirect:'Dritto', rpLeft:'Giro a sinistra', rpRight:'Giro a destra', rpNote:(k,p,m)=>(k ? 'squadre sul percorso: '+k+' · incontro '+p+'%' : 'nessuno sul percorso')+(m ? ' · −'+m+' materiali' : ''), rpSafest:'più tranquillo', rpClear:n=>n+': arrivati senza scontri', rpMet:n=>'Incontrati '+n+' per strada', rkTitle:'Classificate', rkArenaTitle:'Arena', rkDiv:'div.', rkUnranked:'Senza grado',
  rkPlaceFirst:'La prima partita della stagione fissa il grado', rkPlaceFrom:n=>'Piazzamento di stagione, grado precedente: '+n,
  rkSeasonLine:n=>'Partite in carriera: '+n, rkToNext:(a,b)=>a+' a '+b, rkCost:n=>'ingresso −'+n+'% a partita',
  rkUnrealBoard:'classifica Unreal', rkHypeBoard:'posto in Champion League', rkRules:u=>'regole '+u,
  rkLast:d=>'Sessione '+d, rkForm:f=>'forma '+(f>0?'+':'')+f, rkPlaced:n=>'piazzato: '+n, rkUnrealPts:'pt Unreal',
  rkSimMatch:(n,of)=>'Partita '+n+' di '+of, rkSimBus:'Bus della battaglia', rkSimLand:'Atterraggio', rkSimStorm:n=>'Zona '+n, rkSimAlive:'rimasti', rkSimKill:'Eliminato', rkSimSkip:'Salta', rkSimDone:'Fatto', rkSimUp:'Promozione', rkSimDown:'Retrocessione', rkSimTotal:'Esito della sessione', rkTiers:['Bronzo','Argento','Oro','Platino','Diamante','Élite','Campione','Irreale'], rkLeagues:['Lega aperta','Lega sfidanti','Lega campioni'], rkVictory:'Vittoria Reale', rkBy:'Eliminato da', rkLobby:'Nella lobby:', rkKills:'kill', rkPeaks:'Picco delle stagioni passate',
  rkPlay:n=>'Gioca '+n+' partite', rkDayBusy:'Oggi c’è un torneo, gioca una sessione in un giorno libero',
  rkNewsUp:n=>'Classificate: promosso a '+n, rkNewsDown:n=>'Classificate: sceso a '+n, rkNewsPlaced:n=>'Classificate: piazzato a '+n,
  rkNewsUnreal:n=>'Classificate: '+n+'! Ora in classifica mondiale', rkNewsTop100:p=>'Classificate: top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Classificate: primo nella classifica Unreal', rkNewsReset:()=>'Nuova stagione: grado azzerato, prima partita di piazzamento',
  rkNewsArenaUp:n=>'Arena: '+n, rkNewsChamp:n=>'Arena: Champion League! '+n, rkNewsArenaReset:u=>'Aggiornamento '+u+': Hype dell’Arena azzerato'});
Object.assign(I18N.pt, {mvTitle:n=>'Zonas móveis · '+n+' vivos', mvEarly:'Entrar primeiro', mvEarlyNote:v=>'Direto para o novo círculo antes que lote: '+v+'% sobreviveram assim nos finais', mvEdge:'Pela borda da tempestade', mvEdgeNote:v=>'Seguimos a parede da tempestade e pegamos quem atrasou: '+v+'% sobreviveram', mvTarp:'Tarp pela tempestade', mvTarpNote:'Esperamos até o fim e passamos de tarp: entrada mais calma, mas custa vida e materiais', mvThird:'Third-party em quem rotaciona', lsTitle:n=>'Últimos times · '+n+' vivos', lsHold:'Segurar a posição', lsHoldNote:'Ficamos na nossa box e deixamos os outros trocarem: os círculos decidem a posição', lsHoldGot:'Segurando a posição, esperando uma troca', lsPush:'Pressionar por kills', lrTitle:'Loot no seu ponto', lrHint:n=>'Abra os baús você mesmo. Cerca de '+n+' antes da zona, depois perde materiais', lrOpened:(o,n)=>'Abertos '+o+' de '+n, lrOpen1:'Abrir baú', lrOpen5:'Abrir 5', lrAuto:'Pegar o melhor', lrGo:'Rotacionar', lrInv:'Inventário', lrGround:'No chão: toque para pegar', lrDrop:'Largar', ccMobTrainNeed:'precisa de celular ou tablet: Loja → Consoles e mobile', ccMobTrainCap:'acima de 85 o rating mobile só sobe com cups mobile', lrMoveTip:'Toque para mover', lrOneMove:'Só um item de mobilidade por jogador', lrSelHint:n=>n+': toque num slot (seu ou de um colega), ou toque de novo para largar', lrFull:'Inventário cheio: largue algo', lrAmmo:(a,n)=>'Munição '+a+'/'+n, lrAmmoBox:'Caixa de munição', lrRare:'Baú raro', lrAmmoLow:'pouca munição, −1 de força', lrSplitPen:n=>'nem todos têm duas armas, −'+n+' de força', lrTakeFor:'Para:', lrMe:'mim', lrInvOf:n=>'Inventário de '+n, lrSplit:'Dividir', lrBusLate:p=>'ônibus longe, pousou tarde: '+p+'% menos baús antes da zona', lrBusNear:'O ônibus passou perto, pousou na hora', lrVault:'Cofre', lrVaultBig:'Cofre grande', lrFloor:'Loot no chão', lrOdds:(c,k,h,f,a,s)=>{ const rr=(v,cl)=>v.map((x,i)=>x==='0%' ? '' : '<b class="'+cl[i]+'">'+x+'</b>').filter(Boolean).join(' '), CL=['c','u','r','e','l'], N=["AR","escopeta","SMG","pistola","sniper"]; return 'Chances '+(s ? s+' · ' : '')+'Baú: '+rr(c, CL)+' · '+k.map((x,i)=>x==='0%' ? '' : N[i]+' '+x).filter(Boolean).join(' ')+' · cura '+h+' · Chão (estimativa): '+rr(f, CL)+', munição '+a; }, lrBoss:n=>'Chefe '+n+': derrote para pegar a mítica e o medalhão', lrBossLeft:(n,p)=>'chefe '+n+' deixado, sem mítica: −'+p+' de força', rpTitle:'Por onde até a zona', rpHint:'Pontos vermelhos são squads no mapa. Quem está perto da linha, você pode encontrar', rpDirect:'Reto', rpLeft:'Pela esquerda', rpRight:'Pela direita', rpNote:(k,p,m)=>(k ? 'squads no caminho: '+k+' · encontro '+p+'%' : 'ninguém no caminho')+(m ? ' · −'+m+' de materiais' : ''), rpSafest:'mais tranquilo', rpClear:n=>n+': chegamos sem luta', rpMet:n=>'Encontramos '+n+' no caminho', rkTitle:'Ranqueada', rkArenaTitle:'Arena', rkDiv:'div.', rkUnranked:'Sem rank',
  rkPlaceFirst:'A primeira partida da temporada define o rank', rkPlaceFrom:n=>'Posicionamento da temporada, rank anterior: '+n,
  rkSeasonLine:n=>'Partidas na carreira: '+n, rkToNext:(a,b)=>a+' até '+b, rkCost:n=>'entrada −'+n+'% por partida',
  rkUnrealBoard:'placar Unreal', rkHypeBoard:'posição na Champion League', rkRules:u=>'regras '+u,
  rkLast:d=>'Sessão '+d, rkForm:f=>'forma '+(f>0?'+':'')+f, rkPlaced:n=>'posicionado: '+n, rkUnrealPts:'pts Unreal',
  rkSimMatch:(n,of)=>'Partida '+n+' de '+of, rkSimBus:'Ônibus de batalha', rkSimLand:'Pouso', rkSimStorm:n=>'Zona '+n, rkSimAlive:'restantes', rkSimKill:'Eliminou', rkSimSkip:'Pular', rkSimDone:'Pronto', rkSimUp:'Subiu de rank', rkSimDown:'Caiu de rank', rkSimTotal:'Resultado da sessão', rkTiers:['Bronze','Prata','Ouro','Platina','Diamante','Elite','Campeão','Irreal'], rkLeagues:['Liga Aberta','Liga Desafiante','Liga dos Campeões'], rkVictory:'Vitória Royale', rkBy:'Eliminado por', rkLobby:'No lobby:', rkKills:'abates', rkPeaks:'Pico das temporadas passadas',
  rkPlay:n=>'Jogar '+n+' partidas', rkDayBusy:'Hoje é dia de torneio, jogue uma sessão num dia livre',
  rkNewsUp:n=>'Ranqueada: subiu para '+n, rkNewsDown:n=>'Ranqueada: caiu para '+n, rkNewsPlaced:n=>'Ranqueada: posicionado em '+n,
  rkNewsUnreal:n=>'Ranqueada: '+n+'! Agora no placar mundial', rkNewsTop100:p=>'Ranqueada: top 100 Unreal, #'+p,
  rkNewsTop1:()=>'Ranqueada: primeiro no placar Unreal', rkNewsReset:()=>'Nova temporada: rank zerado, primeira partida de posicionamento',
  rkNewsArenaUp:n=>'Arena: '+n, rkNewsChamp:n=>'Arena: Champion League! '+n, rkNewsArenaReset:u=>'Atualização '+u+': Hype da Arena zerado'});
Object.assign(I18N.pt, {hhTag:'Novo', hhSub:'Quem tem mais prêmios no total: dois jogadores ou dois times, o total do primeiro aparece. Até o primeiro erro.', hhCntP:n=>n+' jogadores', hhCntT:n=>n+' times', hhPlayP:'Jogar', hhPlayT:'Times', hlHas:'ganhou', hlPrize:'em prêmios no total', hlThan:a=>'que '+a, hlRank:n=>n+'º de todos os tempos', hlMode_pl:'Jogadores', hlMode_org:'Times', hlMode_mix:'Finais e 2026', hlHigher:'Mais', hlLower:'Menos', hlSrcAll:'Liquipedia, prêmios de todos os tempos', hlQAll:(b,a)=>b+' ganhou mais ou menos que '+a+' no total?', hlLink:'Maior ou menor', hlTitle:'Maior ou menor', hlBack:'Início', hlStreak:n=>'Sequência: '+n, hlBest:n=>'Recorde: '+n,
  hlQPlace:'Quem ficou mais alto nesta final?', hlQEarn:'Quem ganhou mais prêmios em 2026?', hlSrcEarn:'Liquipedia, todos os torneios do ano',
  hlHint:'Toque em quem ficou acima', hlPlaceV:p=>p+'º lugar', hlOver:n=>'Sequência encerrada: '+n, hlNewBest:'Novo recorde',
  hlAgain:'Jogar de novo', hlCopy:'Copiar resultado', hlCopied:'Copiado', hlEmpty:'Sem dados para uma pergunta'});
/* План 125 (14.11): тактика файта (tc*), третья сторона в середине (tp*), точка пути кликом (rpGo, rpHint). */
Object.assign(I18N.ru, {esChips:'До конца игры:', tcChips:'Встречу играем:', sitUseless:'бесполезно сейчас', sitFInside:'ты уже в круге', sitFFar:'круг далеко', sitFNear:'круг рядом', sitFAway:'круг уходит от тебя', sitFToward:'круг идёт к тебе', sitFMats:m=>'ресов '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'рядом отрядов: '+n, sitFPing:ms=>'пинг '+ms+' мс', sitFHeals:h=>'хилок '+h, sitFPlace:p=>'идёте примерно '+p+'-ми', sitFPair:'рядом дерутся двое', sitFEdge:'ты у края круга', sitFMid:'ты в середине круга', sitFMove:'есть мувмент', tcFoe:(n,t)=>(n||'Соперник')+' скорее всего: '+t.toLowerCase(), tcFoeDid:t=>'они: '+t.toLowerCase(), tcTitle:n=>'Как играем файт'+(n ? ' · '+n : ''), tcPush:'Пушить', tcBox:'Бокс-файт, тянуть', tcBack:'Отойти',
  tcNone:'нет', tcOdds:(w,d,t)=>w+'% выбить · '+d+'% выбиты · '+t+'% размен',
  tcPushNote:(a,b)=>'решает дробовик: у нас '+a+', у них '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'решают ресы и хилки: ресы '+m1+' против '+m2+', хилок '+h1+' против '+h2+' · −'+c+' ресов',
  tcBackNote:'постреляли и ушли: решается редко, размен реже',
  tpTitle:(a,b)=>'Третьить: '+a+' и '+b,
  tpNote:(s,k,d,p,b)=>'дерутся рядом · '+s+'%: их файт кончится до нас · '+k+'% выбить, +'+p+' к силе · '+d+'% выбиты · '+b+'%: добить и второго',
  tpGot:r=>(r.self ? r.w+' выбили '+r.l+' до нас · ' : '')+(r.out==='win' ? 'выбили '+r.t+(r.both ? ' и '+r.o : '')+', +'+r.pow+' к силе' : r.out==='die' ? r.t+' развернулись на нас, выбиты' : 'зашли третьими, постреляли и ушли: +'+r.dmg+' урона'),
  rpGo:'Идём к точке', rpHint:'Тапни по кругу, куда встать. Красные точки: отряды, кто у линии, с тем можно встретиться'});
Object.assign(I18N.en, {esChips:'For the rest of the game:', tcChips:'If we meet someone:', sitUseless:'useless right now', sitFInside:'you are already in the zone', sitFFar:'the zone is far', sitFNear:'the zone is close', sitFAway:'the zone moves away from you', sitFToward:'the zone moves toward you', sitFMats:m=>'mats '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'squads nearby: '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'heals '+h, sitFPlace:p=>'you are about #'+p, sitFPair:'two squads fighting nearby', sitFEdge:'you are on the zone edge', sitFMid:'you are mid zone', sitFMove:'you have mobility', tcFoe:(n,t)=>(n||'The other squad')+' will likely: '+t.toLowerCase(), tcFoeDid:t=>'they: '+t.toLowerCase(), tcTitle:n=>'How do we play the fight'+(n ? ' · '+n : ''), tcPush:'Push', tcBox:'Box fight, drag it out', tcBack:'Back off',
  tcNone:'none', tcOdds:(w,d,t)=>w+'% we take them · '+d+'% we go down · '+t+'% trade',
  tcPushNote:(a,b)=>'the shotgun decides: ours '+a+', theirs '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'mats and heals decide: mats '+m1+' vs '+m2+', heals '+h1+' vs '+h2+' · −'+c+' mats',
  tcBackNote:'shoot and leave: rarely decided, fewer trades',
  tpTitle:(a,b)=>'Third-party: '+a+' and '+b,
  tpNote:(s,k,d,p,b)=>'fighting nearby · '+s+'%: their fight ends before we arrive · '+k+'% we take one, +'+p+' power · '+d+'% we go down · '+b+'%: finish the second too',
  tpGot:r=>(r.self ? r.w+' took out '+r.l+' before we got there · ' : '')+(r.out==='win' ? 'took out '+r.t+(r.both ? ' and '+r.o : '')+', +'+r.pow+' power' : r.out==='die' ? r.t+' turned on us, we went down' : 'came in third, shots exchanged, we left: +'+r.dmg+' damage'),
  rpGo:'Go to the point', rpHint:'Tap the circle where to stand. Red dots are squads: whoever is by the line, you may run into'});
Object.assign(I18N.fr, {esChips:'Jusqu’à la fin :', tcChips:'Si on croise quelqu’un :', sitUseless:'inutile maintenant', sitFInside:'tu es déjà dans la zone', sitFFar:'la zone est loin', sitFNear:'la zone est proche', sitFAway:'la zone s’éloigne de toi', sitFToward:'la zone vient vers toi', sitFMats:m=>'matériaux '+m, sitFAr:r=>'FA '+r, sitFNearBy:n=>'escouades proches : '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'soins '+h, sitFPlace:p=>'vous êtes environ #'+p, sitFPair:'deux escouades se battent à côté', sitFEdge:'tu es au bord de la zone', sitFMid:'tu es au milieu de la zone', sitFMove:'tu as une mobilité', tcFoe:(n,t)=>(n||'L’adversaire')+' va sûrement : '+t.toLowerCase(), tcFoeDid:t=>'eux : '+t.toLowerCase(), tcTitle:n=>'Comment on joue le combat'+(n ? ' · '+n : ''), tcPush:'Push', tcBox:'Box fight, faire durer', tcBack:'Reculer',
  tcNone:'aucun', tcOdds:(w,d,t)=>w+'% on les élimine · '+d+'% éliminés · '+t+'% échange',
  tcPushNote:(a,b)=>'le pompe décide : le nôtre '+a+', le leur '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'matériaux et soins décident : matériaux '+m1+' contre '+m2+', soins '+h1+' contre '+h2+' · −'+c+' matériaux',
  tcBackNote:'on tire et on part : rarement décisif, moins d’échanges',
  tpTitle:(a,b)=>'Third-party : '+a+' et '+b,
  tpNote:(s,k,d,p,b)=>'ils se battent à côté · '+s+'% : leur combat finit avant nous · '+k+'% on en élimine un, +'+p+' puissance · '+d+'% éliminés · '+b+'% : finir le second aussi',
  tpGot:r=>(r.self ? r.w+' a éliminé '+r.l+' avant nous · ' : '')+(r.out==='win' ? r.t+(r.both ? ' et '+r.o : '')+' éliminés, +'+r.pow+' puissance' : r.out==='die' ? r.t+' se sont retournés, éliminés' : 'arrivés en troisième, on a tiré et on est partis : +'+r.dmg+' dégâts'),
  rpGo:'Aller au point', rpHint:'Touche la zone où te placer. Points rouges : les escouades, celles près de la ligne, tu peux les croiser'});
Object.assign(I18N.it, {esChips:'Fino alla fine:', tcChips:'Se incontriamo qualcuno:', sitUseless:'inutile adesso', sitFInside:'sei già nella zona', sitFFar:'la zona è lontana', sitFNear:'la zona è vicina', sitFAway:'la zona si allontana da te', sitFToward:'la zona viene verso di te', sitFMats:m=>'materiali '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'squadre vicine: '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'cure '+h, sitFPlace:p=>'siete circa #'+p, sitFPair:'due squadre combattono vicino', sitFEdge:'sei al bordo della zona', sitFMid:'sei al centro della zona', sitFMove:'hai mobilità', tcFoe:(n,t)=>(n||'L’avversario')+' probabilmente: '+t.toLowerCase(), tcFoeDid:t=>'loro: '+t.toLowerCase(), tcTitle:n=>'Come giochiamo lo scontro'+(n ? ' · '+n : ''), tcPush:'Spingere', tcBox:'Box fight, tirarla lunga', tcBack:'Ritirarsi',
  tcNone:'nessuno', tcOdds:(w,d,t)=>w+'% li eliminiamo · '+d+'% eliminati · '+t+'% scambio',
  tcPushNote:(a,b)=>'decide il fucile a pompa: il nostro '+a+', il loro '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'decidono materiali e cure: materiali '+m1+' contro '+m2+', cure '+h1+' contro '+h2+' · −'+c+' materiali',
  tcBackNote:'spariamo e andiamo: si decide di rado, meno scambi',
  tpTitle:(a,b)=>'Third-party: '+a+' e '+b,
  tpNote:(s,k,d,p,b)=>'combattono vicino · '+s+'%: il loro scontro finisce prima di noi · '+k+'% ne eliminiamo uno, +'+p+' potenza · '+d+'% eliminati · '+b+'%: finire anche il secondo',
  tpGot:r=>(r.self ? r.w+' ha eliminato '+r.l+' prima di noi · ' : '')+(r.out==='win' ? 'eliminati '+r.t+(r.both ? ' e '+r.o : '')+', +'+r.pow+' potenza' : r.out==='die' ? r.t+' si sono girati su di noi, eliminati' : 'entrati per terzi, sparato e via: +'+r.dmg+' danni'),
  rpGo:'Vai al punto', rpHint:'Tocca il cerchio dove metterti. Punti rossi: le squadre, chi sta vicino alla linea, puoi incontrarlo'});
Object.assign(I18N.pt, {esChips:'Até o fim:', tcChips:'Se encontrarmos alguém:', sitUseless:'inútil agora', sitFInside:'você já está na zona', sitFFar:'a zona está longe', sitFNear:'a zona está perto', sitFAway:'a zona se afasta de você', sitFToward:'a zona vem até você', sitFMats:m=>'materiais '+m, sitFAr:r=>'AR '+r, sitFNearBy:n=>'squads perto: '+n, sitFPing:ms=>'ping '+ms+' ms', sitFHeals:h=>'curas '+h, sitFPlace:p=>'vocês estão por volta de #'+p, sitFPair:'dois squads lutando perto', sitFEdge:'você está na borda da zona', sitFMid:'você está no meio da zona', sitFMove:'você tem mobilidade', tcFoe:(n,t)=>(n||'O adversário')+' provavelmente: '+t.toLowerCase(), tcFoeDid:t=>'eles: '+t.toLowerCase(), tcTitle:n=>'Como jogamos a luta'+(n ? ' · '+n : ''), tcPush:'Pressionar', tcBox:'Box fight, segurar', tcBack:'Recuar',
  tcNone:'nenhuma', tcOdds:(w,d,t)=>w+'% eliminamos · '+d+'% eliminados · '+t+'% troca',
  tcPushNote:(a,b)=>'a escopeta decide: a nossa '+a+', a deles '+b,
  tcBoxNote:(m1,m2,h1,h2,c)=>'materiais e curas decidem: materiais '+m1+' contra '+m2+', curas '+h1+' contra '+h2+' · −'+c+' de materiais',
  tcBackNote:'atiramos e saímos: decide pouco, menos trocas',
  tpTitle:(a,b)=>'Third-party: '+a+' e '+b,
  tpNote:(s,k,d,p,b)=>'lutando perto · '+s+'%: a luta deles acaba antes de chegarmos · '+k+'% eliminamos um, +'+p+' de força · '+d+'% eliminados · '+b+'%: acabar com o segundo também',
  tpGot:r=>(r.self ? r.w+' eliminou '+r.l+' antes de nós · ' : '')+(r.out==='win' ? 'eliminamos '+r.t+(r.both ? ' e '+r.o : '')+', +'+r.pow+' de força' : r.out==='die' ? r.t+' viraram em nós, eliminados' : 'entramos como terceiro, trocamos tiros e saímos: +'+r.dmg+' de dano'),
  rpGo:'Ir ao ponto', rpHint:'Toque no círculo onde ficar. Pontos vermelhos são squads: quem está perto da linha, você pode encontrar'});
/* Автобус и сифон (19.11): строка у своей стрелки в пролёте и приписка к третьей стороне. */
Object.assign(I18N.ru, {busEarly:n=>'сели раньше соседей на '+n+' с', busLate:n=>'сели позже соседей на '+n+' с', tpSiphon:'сифон: они уже отхилились'});
Object.assign(I18N.en, {busEarly:n=>'landed '+n+'s before the neighbours', busLate:n=>'landed '+n+'s after the neighbours', tpSiphon:'siphon: they already healed up'});
Object.assign(I18N.fr, {busEarly:n=>'posés '+n+' s avant les voisins', busLate:n=>'posés '+n+' s après les voisins', tpSiphon:'siphon : ils se sont déjà soignés'});
Object.assign(I18N.it, {busEarly:n=>'atterrati '+n+' s prima dei vicini', busLate:n=>'atterrati '+n+' s dopo i vicini', tpSiphon:'siphon: si sono già curati'});
Object.assign(I18N.pt, {busEarly:n=>'pousamos '+n+' s antes dos vizinhos', busLate:n=>'pousamos '+n+' s depois dos vizinhos', tpSiphon:'sifão: eles já se curaram'});
/* Live-ивенты Fortnite в карьере: новость в ленте в сам день. Даты и типы с вики Fortnite
   (tools/measured/wiki-live-events.txt). Только в настоящем году: карьера после 2026-го живёт по календарю 2026-го,
   и «Shattered» второй раз там не случается. Турниров не двигает. */
const CC_LIVE_EVENTS={'2019-02-02':['Showtime','concert'],'2019-05-04':['The Unvaulting','major'],'2019-07-20':['The Final Showdown','major'],
  '2019-10-13':['The End','finale'],'2019-12-14':['Live At Risky','major'],'2020-04-23':["Travis Scott's Astronomical",'concert'],
  '2020-06-15':['The Device','major'],'2020-12-01':['The Devourer of Worlds','major'],'2021-08-06':['Rift Tour','concert'],
  '2021-09-12':['Operation: Sky Fire','major'],'2021-12-04':['The End','finale'],'2022-06-04':['Collision','major'],
  '2022-12-03':['Fracture','finale'],'2023-12-02':['The Big Bang','finale'],'2024-11-01':['Remix: The Prelude','concert'],
  '2024-11-30':['Remix: The Finale','finale'],'2024-12-20':['Defrosting','concert'],'2025-06-07':['Death Star Sabotage','major'],
  '2025-08-02':['Super Showdown','major'],'2025-09-27':['Daft Punk Experience','concert'],'2025-11-29':['Zero Hour','finale'],
  '2026-06-05':['Shattered','major']};
function ccLiveEventOn(d){
  const cr=CAREER && CAREER.career, e=CC_LIVE_EVENTS[d];
  return e && cr && +String(d).slice(0,4)===+cr.year ? {name:e[0], type:e[1]} : null;
}
function ccLiveEventTick(d){
  const e=ccLiveEventOn(d); if(!e) return;
  const lf=ccLife(); lf.live=lf.live||[];
  if(lf.live.indexOf(d)>=0) return;
  lf.live.push(d);
  careerNews('flat', 'lfNewsLive'+e.type, [e.name], {day:d});
}
// Под постом ивента своя реакция зрителей, не «бывает» плохого вечера.
CC_CO_BY_KIND.unshift([/^lfNewsLive/, 'Live']);
Object.assign(I18N.ru, {ccCoLive:['кто смотрел','лучший ивент главы','сервера опять легли','я на скримах был лол','мурашки','где награды','ну это было мощно']});
Object.assign(I18N.en, {ccCoLive:['who watched','best event of the chapter','servers died again','i was in scrims lol','goosebumps','where are the rewards','that was insane']});
Object.assign(I18N.fr, {ccCoLive:['qui a regardé','meilleur event du chapitre','serveurs encore morts','j’étais en scrim mdr','frissons','où sont les récompenses','c’était fou']});
Object.assign(I18N.it, {ccCoLive:['chi l’ha visto','miglior evento del capitolo','server di nuovo giù','ero in scrim lol','pelle d’oca','dove sono le ricompense','pazzesco']});
Object.assign(I18N.pt, {ccCoLive:['quem assistiu','melhor evento do capítulo','servidor caiu de novo','eu tava no scrim kkk','arrepiei','cadê as recompensas','foi insano']});
CC_POST_BY.lfNewsLivemajor='press'; CC_POST_BY.lfNewsLivefinale='press'; CC_POST_BY.lfNewsLiveconcert='press';
Object.assign(I18N.ru, {lfNewsLivemajor:n=>'Live-ивент в Fortnite: '+n+'. Вся сцена смотрела его вместо скримов',
  lfNewsLivefinale:n=>'Финал главы: '+n+'. После ивента серверы ушли в даунтайм, дальше новая глава',
  lfNewsLiveconcert:n=>'В Fortnite прошёл '+n+'. Про шутят, что лобби вечера было тише обычного'});
Object.assign(I18N.en, {lfNewsLivemajor:n=>'Fortnite live event: '+n+'. The whole scene watched it instead of scrims',
  lfNewsLivefinale:n=>'Chapter finale: '+n+'. Servers went into downtime after the event, a new chapter is next',
  lfNewsLiveconcert:n=>n+' played in Fortnite. Pros joke the evening lobbies were quieter than usual'});
Object.assign(I18N.fr, {lfNewsLivemajor:n=>'Événement live Fortnite : '+n+'. Toute la scène l’a regardé au lieu des scrims',
  lfNewsLivefinale:n=>'Fin de chapitre : '+n+'. Les serveurs sont en maintenance après l’événement, un nouveau chapitre arrive',
  lfNewsLiveconcert:n=>n+' a eu lieu dans Fortnite. Les pros disent que les lobbys du soir étaient plus calmes'});
Object.assign(I18N.it, {lfNewsLivemajor:n=>'Evento live di Fortnite: '+n+'. Tutta la scena l’ha guardato invece degli scrim',
  lfNewsLivefinale:n=>'Finale di capitolo: '+n+'. Dopo l’evento i server sono andati in manutenzione, arriva un nuovo capitolo',
  lfNewsLiveconcert:n=>n+' si è tenuto in Fortnite. I pro scherzano che le lobby serali erano più tranquille'});
Object.assign(I18N.pt, {lfNewsLivemajor:n=>'Evento ao vivo no Fortnite: '+n+'. A cena toda assistiu em vez dos scrims',
  lfNewsLivefinale:n=>'Final de capítulo: '+n+'. Depois do evento os servidores entraram em manutenção, vem um novo capítulo',
  lfNewsLiveconcert:n=>n+' rolou no Fortnite. Os pros brincam que os lobbies da noite estavam mais calmos'});
