/*@@PART js/squads-runs.js@@*/
function createStageCardShell(title){
  ccDropLiveCard();
  const container=document.getElementById('majorStages');
  const card=document.createElement('div');
  card.className='stage-card';
  const when=ccStageWhen();
  card.innerHTML=`<h4>${title}<span id="s-badge-ph"></span></h4>
    ${when?`<div class="stage-when">${esc(when)}</div>`:''}
    <div class="stage-detail" id="s-summary-ph"></div>
    <details class="stage-games">
      <summary>${L().stageGamesToggle}</summary>
      <div class="lobby-wrap" style="margin-top:4px;">
        <table class="lobby-table">
          <thead><tr><th>${L().gameWord}</th><th class="num">${L().placeHeader}</th><th class="num">${L().killsHeader}</th><th class="num">${L().ptsHeader}</th><th class="num">${L().totalWord}</th></tr></thead>
          <tbody id="s-log-ph"></tbody>
        </table>
      </div>
    </details>`;
  container.appendChild(card);
  return {
    card,
    badgeEl: card.querySelector('#s-badge-ph'),
    summaryEl: card.querySelector('#s-summary-ph'),
    logBody: card.querySelector('#s-log-ph')
  };
}

async function revealStageLog(you, shell, instant){
  let running=0;
  for(const g of you.stageLog){
    if(!instant) await sleep(220);
    running+=g.pts;
    const tr=document.createElement('tr');
    const gameLabel = g.isLandingBonus ? '🪂' : (L().gameWord+' '+g.game);
    const placeLabel = g.place!=null ? '#'+g.place : '-';
    tr.innerHTML=`<td>${gameLabel}</td><td class="num">${placeLabel}</td><td class="num">${g.elims}</td><td class="num">${g.pts}</td><td class="num">${running}</td>`;
    shell.logBody.appendChild(tr);
    if(g.feed && g.feed.length){
      const feedTr=document.createElement('tr');
      feedTr.innerHTML=`<td colspan="5" style="color:var(--ink-dimmer);font-size:11px;padding-top:0;">${g.feed.join(' · ')}</td>`;
      shell.logBody.appendChild(feedTr);
    }
  }
  const gameEntries=you.stageLog.filter(g=>!g.isLandingBonus);
  const matches=gameEntries.length;
  const avgElims=matches? Math.round(gameEntries.reduce((s,x)=>s+x.elims,0)/matches*100)/100 : 0;
  const avgPlace=matches? Math.round(gameEntries.reduce((s,x)=>s+x.place,0)/matches*100)/100 : 0;
  shell.summaryEl.innerHTML=`${L().matchesWord}: <b>${matches}</b> · ${L().winsWord}: <b>${you.wins||0}</b> · ${L().avgElimsWord}: <b>${avgElims}</b> · ${L().avgPlaceWord}: <b>${avgPlace}</b>`;
  // Разбор вечера своей команды — под итогом этапа: эту карточку рисуют все раннеры карьеры (ccEveningReviewHTML).
  if(typeof CAREER_RUN!=='undefined' && CAREER_RUN && you && you.isYou){ try{ const h=ccEveningReviewHTML(); if(h) shell.summaryEl.insertAdjacentHTML('afterend', h); }catch(e){} }
}

// The run's own record. Every stage card that gets finalised writes a placement
// here, and every payout writes an earning — so the summary at the end is the
// run as it actually happened rather than a second guess at it.
let runPlaces=[], runEarnings=[], runLanSeat=null;
function resetRunRecord(){
  runPlaces=[]; runEarnings=[]; runLanSeat=null;
  // A new run starts with no picker on the page, whatever the last one left.
  document.querySelectorAll('.landing-picker').forEach(el=>el.remove());
  removeLandingPrompt();
}
// Whether the run ends with a seat at the LAN, and which one. It is the thing a
// Major is played for and the summary card did not say it: you had to scroll
// back up to a stage card to find out whether you were going.
function recordLanSeat(event, got, detail){
  runLanSeat={event, got:!!got, detail:detail||''};
}
function recordPlace(title, rank, total, passed, points){
  if(rank==null || !total) return;
  runPlaces.push({title:String(title==null?'':title).replace(/<[^>]+>/g,'').trim(),
                  rank, total, passed:!!passed, points:points||0});
}
function recordEarning(label, amount){
  if(!(amount>0)) return;
  runEarnings.push({label, amount});
}

/* passed === null — «отсюда некуда проходить».

   Правка: «лишнее, что вылет пишут». На скрине карточка
   второго раунда Перфоманса — «50 дуо, 4 игры, ПЛАТЯТ ТОЛЬКО ПОБЕДЫ», топ-6
   из пятидесяти, ноль побед — и красная плашка ВЫЛЕТ над ней. Вылететь оттуда
   нельзя: раунд последний, отсечки у него нет, вечер просто не заплатил.

   Тот же разбор уже сделан рядом (см. ccStagePassed, «победа — это не вылет»):
   у этапа с отсечкой вопрос «прошёл или нет», у последнего — «заплатило или
   нет», и красная плашка отвечает не на тот вопрос. Поэтому третье состояние:
   плашки нет вовсе, карточка нейтральная. Прошёл — зелёная, как была. */
function finalizeStageCard(shell, rank, total, points, passed, vr, note){
  const badge = passed==null ? ''
    : passed ? '<span class="stage-badge pass">'+L().stagePassBadge+'</span>'
             : '<span class="stage-badge fail">'+L().stageFailBadge+'</span>';
  shell.badgeEl.innerHTML=badge;
  if(passed!=null) shell.card.classList.add(passed?'pass':'fail');
  const vrLine = vr ? '<br>'+L().synergyBonusVictory : '';
  shell.summaryEl.innerHTML = `${L().yourSquadTitle}: <b>${ccTop(rank)}</b> ${L().place2plus}${total}${L().teamsWord}, <b>${points}</b> ${L().ptsHeader.toLowerCase()}${vrLine}${note?'<br>'+note:''}<br>` + shell.summaryEl.innerHTML;
  // The stage's own heading is its name, so the summary never has to be told
  // separately what each stage was called — and a stage added later shows up in
  // the summary without anybody remembering to list it.
  const h=shell.card.querySelector('h4');
  const title=h ? h.textContent.replace(L().stagePassBadge,'').replace(L().stageFailBadge,'') : '';
  recordPlace(title, rank, total, passed, points);
}

// A match lobby caps at 50 duos, but a field almost never divides by 50 exactly.
// Chunking it blindly leaves a stub: 105 teams becomes 50/50/5, and in that
// five-team lobby somebody collects a Victory Royale and the whole top-5 sweep
// for free. Keep the same number of lobbies the cap implies, but size them as
// evenly as they go — 105 → 35/35/35, 103 → 34/34/35.
// Размытие лобби по очкам: доля разброса счёта, в пределах которой соседние
// лобби перемешиваются (см. жеребьёвку в simulateGamesLive, 13.09).
const CC_LOBBY_MIX=0.15;
/* ЛОББИ НАБИРАЮТСЯ ДО ПОЛНОГО, как у Epic (его вопрос 7.10: «везде все игроки в полном лобби играют?»). Раньше
   поле делилось поровну: 310 команд — семь лобби по 44–45, 430 — девять по 47–48, трио 2410 — по 32 из 33, то есть
   неполным было почти каждое. Теперь лобби полные, остаток — последним; хвост меньше четверти лобби делится
   пополам с соседним (комнаты на три команды не бывает). Человек (ты, сосед по гонке, напарник) в неполном лобби
   меняется местами с ботом соседнего полного. Сторож tools/check-lobby-full.js. */
function splitIntoLobbies(teams, maxSize){
  const n=teams.length;
  if(n<2) return [];
  if(n<=maxSize) return [teams.slice()];
  const full=Math.floor(n/maxSize), r=n%maxSize;
  const sizes=[];
  if(!r) for(let i=0;i<full;i++) sizes.push(maxSize);
  else if(r>=Math.ceil(maxSize/4)){ for(let i=0;i<full;i++) sizes.push(maxSize); sizes.push(r); }
  else { for(let i=0;i<full-1;i++) sizes.push(maxSize); const t=maxSize+r; sizes.push(Math.ceil(t/2), Math.floor(t/2)); }
  const lobbies=[];
  let start=0;
  sizes.forEach(s=>{ lobbies.push(teams.slice(start, start+s)); start+=s; });
  const human=t=>!!(t && (t.isYou || t.isRival || t.isMate));
  lobbies.forEach((l, i)=>{
    if(l.length===maxSize) return;
    l.forEach((t, k)=>{
      if(!human(t)) return;
      // Ближайшее полное лобби, в нём — последний бот (по очкам он ближе всех к этому лобби).
      for(let d=1; d<lobbies.length; d++){
        const j=[i-d, i+d].find(x=>x>=0 && x<lobbies.length && lobbies[x].length===maxSize && lobbies[x].some(o=>!human(o)));
        if(j==null) continue;
        const L2=lobbies[j]; let m=L2.length-1; while(m>=0 && human(L2[m])) m--;
        const bot=L2[m]; L2[m]=t; l[k]=bot; return;
      }
    });
  });
  return lobbies.filter(l=>l.length>=2);
}

function simulateGames(teams, numGames, pointsFn, killMult){
  applyStageBias(pointsFn);
  // The drop counters are cleared here as well as in simulateGamesLive, and the
  // reason is a bug this fixes rather than symmetry for its own sake.
  //
  // This is the quiet path — the stage runs because it decides who takes the
  // seats, but the player is not in it, so nothing is drawn and no landing spots
  // are handed out. Nobody contests a drop here. Without the reset the teams
  // walk in carrying whatever record they earned in the stage before, so the
  // standings for a stage that had no drops at all grew a Drop Record column —
  // shown because one leftover made showDrop true, and a dash on every other row
  // because theirs had been earned somewhere else and not here.
  teams.forEach(t=>{ t.stagePts=0; t.stageElims=0; t.stageLog=[]; t.gotVR=false; t.wins=0; t.qualSeat=0;
    t.landingWins=0; t.landingLosses=0; t.landingContests=0; t.multiKillLandingWins=0; });
  for(let g=0; g<numGames; g++){
    const order=simulateGame(teams);
    if(CC_FF_FIX_ELIMS) ccFfFastElims(order);   // быстрая модель на перемотке менеджера - см. mgrEngineRank
    order.forEach((t,i)=>{
      const place=i+1;
      const elims=t._elims;
      const gamePts=pointsFn(place)+ccKillPts(elims, killMult);
      t.stagePts+=gamePts; t.stageElims+=elims;
      t.stageLog.push({game:g+1, place, elims, pts:gamePts, elimPts:ccKillPts(elims, killMult), label:thresholdLabel(place), feed:t._feed});
      if(place===1){ t.gotVR=true; t.wins++; }
      accumulateMatchStats(t, place, order.length, pointsFn(place), ccKillPts(elims, killMult));
    });
  }
}

// A team that wins a game (Victory Royale) is instantly qualified and doesn't play further
// games in this stage — used for Heats and LCQ, where a win means immediate advancement.
function simulateGamesStopOnWin(teams, numGames, pointsFn, killMult){
  applyStageBias(pointsFn);
  teams.forEach(t=>{ t.stagePts=0; t.stageElims=0; t.stageLog=[]; t.gotVR=false; t.wins=0; t.qualByWin=false; t.qualSeat=0; });
  for(let g=0; g<numGames; g++){
    const active=teams.filter(t=>!t.gotVR);
    if(active.length===0) break;
    const order=simulateGame(active);
    order.forEach((t,i)=>{
      const place=i+1;
      const elims=t._elims;
      const gamePts=pointsFn(place)+ccKillPts(elims, killMult);
      t.stagePts+=gamePts; t.stageElims+=elims;
      t.stageLog.push({game:g+1, place, elims, pts:gamePts, elimPts:ccKillPts(elims, killMult), label:thresholdLabel(place), feed:t._feed});
      // A win here is the qualification, so it also fixes this squad's place in
      // the next stage's pick queue — see byQualOrder.
      if(place===1){ t.gotVR=true; t.qualByWin=true; t.wins++; }
      accumulateMatchStats(t, place, order.length, pointsFn(place), ccKillPts(elims, killMult));
    });
  }
}

// Any number of teams can be in the Play-In overall, but a single match lobby caps at 50 duos —
// so each game we reshuffle everyone into fresh random lobbies of up to 50 teams.
// Stages that are not watched, played out as fast as the machine can.
//
// The Play-In is 22 games across a field that is split into lobbies of 50, so
// on a full Major it is over a hundred spatial games — a second of real work on
// a quick machine and two on a slower one. It used to run in one unbroken
// stretch, and because nothing yields, the browser never got to paint the
// screen that had just been switched to: pressing "Start FNCS Major" froze on
// the old screen for two seconds and then jumped straight to a finished
// standings card.
//
// The work itself is not the problem and is not what changed — it is real
// simulation and it is why the standings mean anything. What changed is that it
// now comes up for air. Every 24 milliseconds it hands the thread back, which
// lets the browser draw the screen and the counter below, and lets the run be
// abandoned mid-stage like every other awaited step. The yields cost a few
// milliseconds in total; the freeze cost the whole two seconds.
async function simulateGamesRandomLobbies(teams, numGames, lobbySize, pointsFn, killMult){
  applyStageBias(pointsFn);
  // qualByWin cleared with the rest: the Play-In advances everybody at once on
  // cumulative points, so nobody qualifies early here and a flag left over from
  // an earlier stage would hand somebody a pick they did not earn.
  teams.forEach(t=>{ t.stagePts=0; t.stageElims=0; t.stageLog=[]; t.gotVR=false; t.wins=0; t.qualByWin=false; t.qualSeat=0; });
  const note=simProgressNote();
  let lastYield=performance.now();
  try {
    for(let g=0; g<numGames; g++){
      const shuffled=teams.slice().sort(()=>Math.random()-0.5);
      for(const lobby of splitIntoLobbies(shuffled, lobbySize)){
        const order=simulateGame(lobby);
        order.forEach((t,idx)=>{
          const place=idx+1;
          const elims=t._elims;
          const gamePts=pointsFn(place)+ccKillPts(elims, killMult);
          t.stagePts+=gamePts; t.stageElims+=elims;
          t.stageLog.push({game:g+1, place, elims, pts:gamePts, elimPts:ccKillPts(elims, killMult), label:thresholdLabel(place), feed:t._feed});
          if(place===1){ t.gotVR=true; t.wins++; }
          accumulateMatchStats(t, place, order.length, pointsFn(place), ccKillPts(elims, killMult));
        });
      }
      // Time, not a game count: a fast machine gets through the stage in a few
      // yields and a slow one in more, and neither ends up choosing between a
      // frozen page and a stage spent inside setTimeout.
      if(performance.now()-lastYield > 24){
        note.textContent=L().simGamesProgress(g+1, numGames);
        // Not sleep(): sleep returns straight away while a stage is being
        // skipped, and a resolved promise is a microtask, which the browser
        // will not paint between. A real timeout is what hands the thread back.
        await ccMpIdle(ccYield());
        if(!runIsCurrent()) throw RUN_ABANDONED;
        lastYield=performance.now();
      }
    }
  } finally {
    note.remove();
  }
}

// The counter that runs while a stage is being played out off-screen. Created
// on demand and removed when the stage ends, so nothing has to be cleaned up by
// whoever calls it — including when a run is abandoned and the await above
// throws.
function simProgressNote(){
  const el=document.createElement('div');
  el.className='sim-progress';
  el.textContent=L().simGamesProgress(0, 0);
  document.body.appendChild(el);
  return el;
}

function finishMajorEliminatedAnim(you){
  removeSkipButton();
  // A run that ended early still has a story: it played stages and finished
  // somewhere in each of them.
  renderRunSummaryCard();
  document.getElementById('finalBanner').style.display='block';
  document.getElementById('finalPlace').textContent=L().eliminatedBanner;
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  renderStats();
  finalizeRunStats(squadSize, true, null, null, false, false, false, you);
}

function waitForChoice(btnA, btnB){
  return new Promise(res=>{
    btnA.onclick=()=>res('a');
    btnB.onclick=()=>res('b');
  });
}

function waitForAnyClick(elements){
  return new Promise(res=>{
    elements.forEach((el,i)=>{ el.onclick=()=>res(i); });
  });
}

// Click a zone to preview it (who's there, their power, risk), click again
// on another zone to change your mind, and only the Confirm button actually
// locks in the landing spot. infoBox/confirmBtn are DOM elements created by
// the caller; zoneGroups maps zone -> array of rival teams already there.
/* nowOf / laterOf — кто в коробке уже сидит и кто только метит в неё.

   Без них подсказка считала занятой любую коробку, в которую сядет хоть кто-то
   из комнаты, включая тех, кто по очереди летит ПОСЛЕ тебя. Их место ещё не
   занято: займёшь — они выберут заново. Необязательные: без них функция ведёт
   себя ровно как раньше, и так её зовёт всё, что не пикер высадки. */
function waitForZoneConfirm(zoneEls, zones, zoneGroups, infoBox, confirmBtn, nowOf, laterOf){
  const seatedNow   = nowOf   || (g=>g||[]);
  const seatedLater = laterOf || (()=>[]);
  return new Promise(res=>{
    let selected=-1;
    function renderPreview(i){
      const z=zones[i];
      const all=zoneGroups.get(z);
      const rivals=seatedNow(all);
      const later=seatedLater(all);
      // Строка про хвост очереди: коробка свободна, но на неё метят. Стоит и
      // под свободной, и под занятой — это разные вещи, и знать полезно обе.
      const laterLine = later.length
        ? `<div style="color:var(--ink-dim);margin-top:4px;">${L().landingLaterNote(later.length)}</div>` : '';
      if(!rivals || !rivals.length){
        infoBox.innerHTML=`<div style="color:var(--accent);font-weight:700;">${L().landingFreePreview(z.points)}</div>${laterLine}`;
      } else {
        const rows=rivals.map(t=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:2px 0;">
          <span>${t.name.replace(/<[^>]+>/g,'')}</span><span style="color:var(--ink-dim);">${L().landingPowerLabel} <b style="color:var(--ink);">${Math.round(t.pow)}</b></span></div>`).join('');
        infoBox.innerHTML=`<div style="color:var(--danger);font-weight:700;margin-bottom:4px;">${L().landingOccupiedPreview(rivals.length)}</div>${rows}${laterLine}`;
      }
      confirmBtn.style.display='inline-block';
      confirmBtn.disabled=false;
      // And the bar at the bottom of the window, which is the one that does not
      // need scrolling to.
      landingPromptReady(infoBox.innerHTML);
    }
    zoneEls.forEach((el,i)=>{
      el.onclick=()=>{
        if(selected>=0) zoneEls[selected].classList.remove('chosen');
        selected=i;
        el.classList.add('chosen');
        renderPreview(i);
      };
    });
    confirmBtn.onclick=()=>{ if(selected>=0) res(selected); };
  });
}

// A dedicated landing picker shown right before the FNCS Major Grand Finals —
// unlike the pre-draft picker, this one shows the REAL map with every other
// finalist's squad already locked into their zone, and offers the player 3
// spots to choose from: a modest free zone, a bigger (higher-points) free
// zone, and one zone that's already got a bot on it (contested).
// Landing scraps are close to a coin flip — everyone's still fresh off the
// bus with full mats/no loadout advantage yet, so raw squad power only gives
// a modest edge here, capped well short of "the stronger team basically wins".
// Real FNCS Grand Finals 1st-2nd point gaps run about 47-59 in a normal year
// (2024's 209-point gap was Peterbot & Pollo's outlier blowout, not the norm).
// If our sim produces a much bigger gap than that, compress everyone's
// distance from the leader proportionally — keeps the same finishing order
// and the same general "shape" of the standings, just brings the spread
// back down to what real Finals actually look like.
function compressLeaderGap(teams, ptsKey, elimsKey, maxGap, logKey, topN=5){
  if(teams.length<2) return;
  const sorted=teams.slice().sort((a,b)=>b[ptsKey]-a[ptsKey] || (elimsKey?b[elimsKey]-a[elimsKey]:0));
  // Walk down from the top and cap the gap between each adjacent pair of
  // ranks, not just rank 1 vs rank 2. Previously only the outright leader
  // ever got pulled back toward 2nd place, so whichever team snowballed
  // into 2nd could still run away from 3rd, 4th, etc. with nothing to
  // check it — that's what produced a "top two, then a cliff" leaderboard.
  // Capping every gap down through the top N ranks keeps the whole head
  // of the pack bunched together instead of just the very top pair.
  const limit=Math.min(topN, sorted.length-1);
  for(let i=0;i<limit;i++){
    const higher=sorted[i], lower=sorted[i+1];
    const rawGap=higher[ptsKey]-lower[ptsKey];
    if(rawGap<=maxGap) continue;
    const newHigherPts=lower[ptsKey]+maxGap;
    const ptsDelta=higher[ptsKey]-newHigherPts;
    let elimsDelta=0;
    if(elimsKey && higher[ptsKey]>0){
      const ratio=newHigherPts/higher[ptsKey];
      const newElims=Math.max(0, Math.round(higher[elimsKey]*ratio));
      elimsDelta=higher[elimsKey]-newElims;
      higher[elimsKey]=newElims;
    }
    higher[ptsKey]=newHigherPts;
    // Previously this trim only touched the cumulative total — the
    // per-game log entry stayed at its original, uncompressed value, so
    // over a run of games the match-history numbers would no longer add
    // up to the totals shown on the leaderboard. Pulling the same delta
    // out of this game's just-logged entry keeps the two in sync.
    if(logKey && higher[logKey] && higher[logKey].length){
      const lastEntry=higher[logKey][higher[logKey].length-1];
      lastEntry.pts=Math.max(0, lastEntry.pts-ptsDelta);
      lastEntry.elims=Math.max(0, lastEntry.elims-elimsDelta);
    }
  }
}

// pickLandingWinner stood here and settled a shared box by a power-weighted coin
// before the game started. It went with assignLandingZones, its only caller: the
// drop is played on the map now and resolveDropDuel settles it there, on capped
// odds, where it can be watched.

// Same mechanic as the Major Finals landing picker — build the whole bot
// lobby first, show the real map with everyone already dropped, then offer
// the player 3 spots (2 free, 1 with exactly one bot already there).
// Randomly drop every bot into a zone first — no reserved spots — then look
// at what's actually left free. Only if pure randomness happens to fill
// every zone do we nudge the lightest-occupied one open, so the 2 free
// candidates aren't glued to the same physical spot on the map every game.
// A landing zone's power bonus lasts for that stage only. The picker runs
// before every stage that has a drop (regional finals, Second Chance, all three
// Summit days), so adding it straight onto pow made it stack: five stages meant
// five zone bonuses still sitting on the squad. Track what was applied, undo the
// previous one on each new pick, and clear it when the stage ends.
function applyLandingPow(t, points){
  if(t._landingPow) t.pow-=t._landingPow;
  const before=t.pow;
  t.pow=Math.round(before+(points||0));
  // Store the delta that was actually applied, not the zone's nominal value —
  // pow gets rounded here, so subtracting the nominal number later would leave
  // a point of drift behind on every stage.
  t._landingPow=t.pow-before;
}
function clearLandingPow(teams){
  teams.forEach(t=>{
    if(t && t._landingPow){ t.pow-=t._landingPow; t._landingPow=0; }
  });
}

// The weighted slot pool that used to deal these seats is gone: both pickers
// now order the lobby by power and let each squad take the best spot still
// worth taking, so who shares a box is decided by who they are rather than
// by a shuffle. The per-spot popularity it was built on still lives on the
// zones themselves, as z.teams.

/* Чем отряд платит за то, чтобы делить коробку, — В ОЧКАХ ЗОНЫ. Контест стоит
   брать, когда точка того стоит: лучшая коробка карты остаётся выгоднее с одним
   соседом, чем пустое поле, и с двумя — только если она правда богатая.

   ЦЕНА ЖИВЁТ В ТЕХ ЖЕ ЕДИНИЦАХ, ЧТО И ПРИМАНКА, и потому едет вместе с ней.
   2 сентября 2026 шкалу очков за точку растянули с 1-4 на 1-6, а цену забыли —
   и лут стал тяжелее толкучки: боты перестали разбредаться по бедным клеткам и
   кучей полезли на богатые. Поймал это контроль check-spot-aura: без механики
   страха дом игрока обязан быть занят почти всегда (не больше 5% вечеров
   свободен), а оказался свободен в 37%. Разброс LANDING_NOISE тут ни при чём —
   Правка не сдвинула числа ни на десятую. Обе — и разброс, и цена — были
   ложными диагнозами: ни одна не сдвинула контроль ни на десятую, поэтому обе
   возвращены к исходным значениям. Настоящая причина в другом и пока не найдена
   (см. LANDING_POINTS_MAX). */
const CONTEST_COST=2.4;
// And what it costs to share with somebody better than you.
//
// Cost alone could not keep the best squad in the lobby off a contested box,
// and raising it did nothing: the top seven take the seven best spots alone,
// and then — once every box on the map has somebody in it — the squads still
// waiting have to double up somewhere, and they double up on the best boxes,
// which is exactly where the top seven are. Measured over 150 lobbies the top
// fifth of the field shared its drop in 96% of games at every cost from 2.4 to
// 5, so the strongest duo in the tournament never once got a clean landing.
//
// What was missing is that a squad looks at who is already there, not just how
// many. Dropping on top of a team well above you is a bad idea and real lobbies
// know it; dropping on a team below you is how a good squad takes a POI. So the
// cost of each occupant is scaled by how much stronger than you they are, and
// twenty power points doubles it.
//
// It moves who shares rather than how many: with fifty duos on thirty-six
// boxes, fourteen boxes must hold two whatever anybody prefers, so 56% of the
// field shares its drop and no rule can lower that. What changes is that the
// top fifth goes from 96% contested to 57% — average for the lobby rather than
// singled out — while keeping the best spots, and the bottom fifth takes the
// certainty instead.
const CONTEST_FEAR=20;
// What a box is worth to this squad: its rating, less what the squads already
// standing in it cost, plus enough noise that two lobbies never deal the same.
/* Кто выиграл высадку, а кто её проиграл — по тому, что случилось на карте.

   Движок помечает отряд _droppedOut, если он умер в первые DROP_SEC, и пишет
   в _deathCause имя того, кто его убил: это и есть стычка на высадке, читанная
   с игры, а не назначенная до неё.

   Раньше этот счёт стоял прямо в ветке одиночного лобби, и потому существовал
   только там. Карьерные турниры играются лобби по пятьдесят (opts.lobbySize) —
   другая ветка, — и в ней стычки не считались ВООБЩЕ: колонка дропа в
   карьерных таблицах молчала, ачивка «Легенда высадки» была недостижима, а
   аура точки (careerSpotAuraAdd) не росла ни на единицу. Вопрос: «а как фармить ауру?» — и замер career-spot-farm-probe.js ответил
   честно: никак, восемь вечеров подряд по 4-5 соседей и ноль стычек.

   Поэтому счёт живёт здесь, одной функцией, и её зовут обе ветки. */
function creditLandingFights(list){
  const byName=new Map(list.map(t=>[t.name, t]));
  const wins=new Map();
  list.forEach(t=>{
    if(!t._droppedOut) return;
    const killer=byName.get(t._deathCause);
    if(!killer) return;
    t.landingLosses=(t.landingLosses||0)+1;
    t._feed=[L().landingFightLost, ...(t._feed||[])];
    wins.set(killer, (wins.get(killer)||0)+1);
  });
  wins.forEach((n,winner)=>{
    winner.landingWins=(winner.landingWins||0)+1;
    if(n>=2) winner.multiKillLandingWins=(winner.multiKillLandingWins||0)+1;
    winner._feed=[L().landingFightWon, ...(winner._feed||[])];
  });
  /* И то же самое, прочитанное как ссора: кто сошёлся с тобой на твоей точке.
     Здесь, а не у трёх вызывающих, потому что стычки читаются здесь — и
     потому что забыть один из трёх вызовов было бы ровно тем багом, которым
     аура не росла вовсе (см. комментарий выше). Драфта это не касается: без
     карьеры careerBeefNight выходит сразу. */
  if(typeof careerBeefNight==='function') careerBeefNight(list);
  // Победители — вызывающему: строка журнала пишет landingOutcome по этой карте.
  return wins;
}
// Сколько раз отряд делил свою коробку — считается там же, где стычки, и по
// тому же списку живых на эту игру.
function creditLandingContests(list){
  const shared=new Map();
  list.forEach(t=>{ if(t.landingZone) shared.set(t.landingZone, (shared.get(t.landingZone)||0)+1); });
  list.forEach(t=>{ if(t.landingZone && shared.get(t.landingZone)>1)
    t.landingContests=(t.landingContests||0)+1; });
}
function landingScore(team, zone, occupants){
  /* Закрытая коробка не сравнивается ни с чем: она просто не выбирается.
     Возврат −∞, а не большая цена, — потому что «дорого» всегда кто-нибудь
     да заплатит, а правка ровно про то, чтобы не заплатил никто. */
  if(CC_SPOT_LOCK_ZONES && CC_SPOT_LOCK_ZONES.has(zone)) return -Infinity;
  let cost=0;
  (occupants||[]).forEach(function(o){
    cost += CONTEST_COST * (1 + Math.max(0, ((o.pow||0) - (team.pow||0)) / CONTEST_FEAR));
  });
  /* Fortnite Manager: приказ на высадку (_mgrDrop) — «тихая» втрое дороже платит за соседа, «горячая» почти
     не платит и идёт за лучшим лутом; две команды одного клуба коробку не делят никогда. */
  if(team._mgrDrop==='quiet') cost*=3; else if(team._mgrDrop==='hot') cost*=0.25;
  if(team.isClub && (occupants||[]).some(function(o){ return o && o.isClub; })) cost+=100;
  /* Репутация точки читается так же, как сосед в коробке — и так же взвешена
     силой. Плоский страх (все боятся одинаково) на замере оказался рубильником:
     при полной ауре коробку не брал НИКТО, 0 из 300 раздач. Это неправда про
     дроп-карту: за хороший лут приходят, просто приходят те, кто не слабее
     хозяина. Поэтому страх гаснет ровно на том же счёте, что и страх перед
     соседом (CONTEST_FEAR), и у команды сильнее хозяина он равен нулю. */
  const aura=CC_SPOT_FEAR_MAP ? (CC_SPOT_FEAR_MAP.get(zone)||0) : 0;
  if(aura>0){
    /* CC_SPOT_FEAR_BASE — то, что репутация весит сама по себе: комната Д1
       ровная (сила 95-105 при хозяине 100), и чистый разрыв сил давал почти
       ноль — замер показал 100% занятости даже при полной ауре. Разрыв сверху
       остаётся, он и делает разницу между «дом сильного» и «дом равного»;
       снизу страх упирается в ноль — команда заметно сильнее хозяина не
       боится вообще, и за лучший лут всё равно приходит. */
    const gap=Math.max(0, CC_SPOT_FEAR_BASE +
      (CC_SPOT_FEAR_POW - (team.pow||0)) / CONTEST_FEAR);
    /* Без разброса, и это проверено: множитель со средним 1 и разбросом ±55%
       (замер) сделал ровно наоборот — при полной ауре игрок
       оставался один в 5-10% вечеров вместо 93%. Причина простая: чтобы точка
       осталась пустой, обойти её должны ВСЕ сорок девять команд, и хватает
       одного, кому бросок выдал маленький страх. Порог тут неизбежен. */
    cost += CONTEST_COST * CC_SPOT_FEAR * (aura/CC_SPOT_AURA_MAX) * gap;
  }
  /* А с кем открытый биф — тот, наоборот, идёт туда специально. Прибавка стоит
     ПОСЛЕ страха и перекрывает его: смысл ссоры в том, что она сильнее общего
     правила «к сильному не суйся». Ровно на свои дома и ровно на тех, кто в
     ссоре, — остальным коробка стоит столько же, сколько стоила. */
  if(CC_BEEF_SET && CC_BEEF_ZONES && CC_BEEF_ZONES.has(zone) &&
     (team.squad||[]).some(p=>CC_BEEF_SET.has(hKey(p))))
    cost -= CC_BEEF_PULL;
  /* И сундуки коробки — поверх очков: очки идут ступенями 1–4, и семь коробок m2
     стоят по четыре, а сундуков в них от 45 до 76 (тестер, 16.09: «сильные
     падают на лучшие локации»). Вес маленький — половина очка за двойную
     середину острова, — чтобы раскладка контестов (треть поля, см. выше) не
     поехала; проверено check-career-landing / check-drop-sticky. */
  return zone.points + ccLandingChestEdge(zone) - cost + ccLandingRoll(team, zone)*LANDING_NOISE;
}
const CC_LAND_CHEST_W=1;
let CC_LAND_CHEST_CACHE=null;
function ccLandingChestEdge(zone){
  if(typeof ccSiteChests!=='function' || !ALL_LANDING_ZONES || !ALL_LANDING_ZONES.length) return 0;
  const set=(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '';
  /* Кэш — по СОСТАВУ острова, не по массиву: useLandingSet пересобирает точки новыми объектами в тот же массив
     (и обрезает их под режим), и кэш, ключённый объектами, после соло-вечера на том же острове молча отвечал нулём
     за каждую точку. У сыгравшего соло один из двоих боты следующего общего капа садились иначе (командный год
     20.10: хиты Solo Series 17.01 у одного → Duos Victory Cup 19.01, 12 команд из 50 на других точках). */
  const C=CC_LAND_CHEST_CACHE, Z=ALL_LANDING_ZONES;
  if(!C || C.set!==set || C.list.length!==Z.length || C.list.some((z,i)=>z!==Z[i])){
    const m=new Map(); const all=Z.map(z=>{ const c=ccSiteChests(z); m.set(z, c); return c; }).sort((a,b)=>a-b);
    CC_LAND_CHEST_CACHE={set, list:Z.slice(), m, med:all[Math.floor(all.length/2)]||1};
  }
  const c=CC_LAND_CHEST_CACHE.m.get(zone);
  if(c==null) return 0;
  return Math.max(-CC_LAND_CHEST_W, Math.min(CC_LAND_CHEST_W, CC_LAND_CHEST_W*(c/CC_LAND_CHEST_CACHE.med-1)));
}
/* Разброс, чтобы два лобби не раскладывались одинаково.

   Едет ВМЕСТЕ со шкалой очков за точку. 1.15 было откалибровано под шкалу 1-4;
   когда 2 сентября 2026 её растянули до 1-6, детерминированная часть выбора
   выросла относительно случайной — и боты стали кучнее лезть на жирные клетки,
   а бедные перестали занимать вовсе. Поймал это контроль check-spot-aura: без
   механики страха дом обязан быть занят почти всегда, а оказался свободен в 37%
   вечеров. Правка была про то, сколько ИГРОК получает за лут, а не про то, как
   расселяются боты. Правка разброса контроль НЕ сдвинула — значит дело не в
   нём, и число возвращено к исходному, чтобы в балансе не осталось
   недоказанного дрейфа. */
const LANDING_NOISE=1.15;
/* Внутри одного этапа разброс высадки не перебрасывается. Боты без дома (ccBotHome) выбирали по landingScore со
   свежим Math.random на каждую игру, и в финале из 12 игр половина лобби переезжала.
   Бросок теперь сидится от этапа, команды и коробки, раздача повторяется сама. Жетон у каждого этапа свой: хиты и
   финал разные комнаты, там переезд нормален.
   Без этапа (вопрос до раннера, карточные режимы, замеры) жетона нет, бросок случайный как раньше. */
let CC_DROP_STAGE=null, CC_DROP_STAGE_N=0;
// Чем команда зовётся на дропе: составом, а не строкой таблицы. Ряд между
// играми пересобирается, дуо — нет.
function ccDropKey(team){
  return (team && ((team.squad||[]).map(p=>p&&p.handle).filter(Boolean).sort().join('+')
          || team.name)) || '?';
}
function ccLandingRoll(team, zone){
  if(!CC_DROP_STAGE) return Math.random();
  const at=zone ? zone.x+','+zone.y : '?';
  return careerRng(ccHashStr('drop|'+CC_DROP_STAGE+'|'+ccDropKey(team)+'|'+at))();
}
/* Боты держат свою коробку весь этап.
   buildBotLandingAssignment раздаёт по byQualOrder, а тот сортирует по stagePts, которые меняются каждую игру, и боты переезжали (tools/check-cup-drop-sticky.js: 321 переезд из 450 против 0 при замороженной таблице).
   Поэтому комната садится один раз за этап, дальше каждая игра возвращает команду в её коробку.
   Память только для ботов (t.isYou пропускаем), игрок выбирает место перед каждой игрой сам.
   Вне этапа (карточные режимы, замеры, вопрос до раннера) памяти нет, раздача считается заново. */
/* Место запоминается адресом (набор острова + координаты), а не объектом зоны.
   careerLandingPick через useLandingSet пересобирает сетку каждую игру, старый объект на новой сетке не существует, и пикер (обход ALL_LANDING_ZONES) показывал пустой остров со второй игры.
   Набор острова в ключе, потому что круг Reload меняет остров между играми (ccRelIsland). */
function ccSeatKeyOf(zone){
  return zone ? (zone.x+','+zone.y) : null;
}
function ccSeatZone(xy){
  if(!xy || !ALL_LANDING_ZONES) return null;
  return ALL_LANDING_ZONES.find(z=>z.x+','+z.y===xy) || null;
}
/* Место помнится ОТДЕЛЬНО НА КАЖДОМ ОСТРОВЕ.

   Игрок: «и в релоуде в хитах и финале боты каждую игру локу
   меняют» — и это была моя же память комнаты, ещё раз.

   Круг Reload чередует острова игра через игру (ccRelIsland): r4, r1, r4, r1.
   Запись была одна на команду, поэтому игра на втором острове ЗАТИРАЛА место,
   найденное на первом, а следующая игра первого острова находила чужой адрес,
   не узнавала его и садилась заново. То есть на релоаде память не держала
   ничего вообще, и комната переезжала каждую игру — ровно то, что он видит.

   Остров в ключе КАРТЫ, а не в значении: у каждой пары «команда × остров» своя
   запись, и оба острова помнят своё. Тогда r4 все свои игры стоит как стоял, и
   r1 тоже. */
function ccSeatMapKey(t){
  return ACTIVE_LANDING_SET+'|'+ccDropKey(t);
}
/* КТО УХОДИТ С ОБЩЕЙ КОРОБКИ — НЕ ПО СИЛЕ (Notion 13.10, тестер: «все самые сильные контестятся, а к слабым никто не
   летит»). Досадка в пустые коробки и разгон толпы выселяли слабейшего, и слабые по построению сидели одни. Замер
   tools/probe-drop-real-tiers.js, доля команд на общей коробке по пятым частям силы (от сильных): настоящие дроп-карты
   финалов EU 2021–2024 (16 карт, 724 команды) — 31/37/36/40/39, ровно; движок с книгой сезона — 63–66 у сильных,
   11–28 у слабых. Теперь из одной коробки уходит гость раньше хозяина и ближний к пустой точке, а при равенстве —
   жребий от команды и точки (повторяемый, одинаковый у соседей по гонке): число в (0, 1), меньше любого шага расстояния. */
function ccDropTieOf(t, z){
  return (ccHashStr(ccSeatMapKey(t)+'|'+ccSeatKeyOf(z))%997+1)/999;
}
let CC_DROP_SEATS=null, CC_DROP_SEATS_STAGE=null;
/* Лобби этой игры пересобраны из большого поля (их больше одного) — память точек не
   работает: команды из разных прошлых лобби помнят одни и те же точки, и со второй игры
   садились по пять-семь на одну (~60 живых к первой зоне). Ставит simulateGamesLive. */
let CC_SEATS_REMIX=false;
function ccStageSeats(){
  if(CC_SEATS_REMIX) return null;
  if(!CC_DROP_STAGE){ CC_DROP_SEATS=null; CC_DROP_SEATS_STAGE=null; return null; }
  if(CC_DROP_SEATS_STAGE!==CC_DROP_STAGE){
    CC_DROP_SEATS_STAGE=CC_DROP_STAGE; CC_DROP_SEATS=new Map();
  }
  return CC_DROP_SEATS;
}

// Who picks first: whoever was through first.
//
// Not every stage has a "first". A Heat and the Last Chance Lobby do — a win
// there is the qualification, the squad stops playing and everybody else is
// still going — and those squads pick ahead of the field. That is qualByWin,
// set only where a win ends the stage.
//
// The Play-In does not. Twenty-two games, cumulative points, and the top 99
// advance together at the final whistle; nobody got through early, so there is
// nothing for a Victory Royale to earn. Ordering on gotVR there would have put a
// squad that won one game and finished eightieth ahead of the squad that topped
// the stage. So where nobody qualified early the queue is simply the standing
// they finished on, which is the honest reading of "who was best".
//
// Read off the field as it stands when the picker opens: the qualifying stage's
// stagePts and flags are still on the teams, because the next stage does not
// reset them until it starts.
// At the LAN the queue is older than the tournament. Everyone in Lyon holds a
// seat, but they did not win them at the same time: the Major 1 qualifiers were
// booked while Major 2 was still being played, and the Major 3 field only got
// there last week. gcRoute records which, so the room picks in the order it
// filled. A player arriving out of the Major 3 regional final carries no route
// and picks after all of them, which is the honest position for the last team
// through the door.
/* Two LANs, two vocabularies for the same idea.
   Lyon 2025 fills from three Majors and labels its routes m1/m2/m3. Antwerp
   2026 fills from the Summit, the Major 2 regional finals and the Last Chance,
   and buildGlobalChampionshipField labels those summit/m2/lcq. Only the first
   set was written down here, so at Antwerp the Summit's fifteen and the Last
   Chance's ten both fell through to the unranked 3 — and Major 2, the only
   label the table happened to share, picked its landing spots ahead of the duos
   who had booked their seats four months earlier.
   Both vocabularies, in the order the seats were actually won. m2 sits at 1 in
   each and means the same thing in each. */
const GC_ROUTE_ORDER={m1:0, summit:0, m2:1, m3:2, lcq:2};
function gcRouteRank(t){
  const r=t && GC_ROUTE_ORDER[t.gcRoute];
  return r==null ? 3 : r;
}
/* Явный жетон порядка квалификации для очереди на метку. byQualOrder читает его первым,
   иначе сортирует по очкам прошлого этапа. В финал приходят из разных дверей (хиты, Ласт Ченс, разные дни
   и регионы), очки там несравнимы, и очередь схлопывалась в силу состава. Где поле собирается,
   порядок сборки и есть очередь: кто прошёл раньше, тот ставит метку раньше.
   Живёт один этап: simulateGames/simulateGamesStopOnWin/simulateGamesRandomLobbies стирают его с очками. */
function stampQualSeats(field){
  (field||[]).forEach((t,i)=>{ if(t) t.qualSeat=i+1; });
  return field;
}

/* Метка — ОДИН раз на этап.

   Короткая история этой строчки. Вопрос: «почему во время play
   it я не могу выбирать как в карьере, в каждом этапе?» — и драфт перевели на
   вопрос перед каждой игрой, тем же механизмом, каким живёт карьера
   (opts.dropEachGame). Замер сразу показал цену: круг 2026 — десяток вопросов,
   гранд-финал сам по себе двенадцать, год Reload — сорок восемь. Решение,
   тем же вечером: «локацию один раз выбираешь». В карьере это один вечер, тут
   подряд весь сезон, и разница не в механизме, а в длине.

   Поэтому этап спрашивает один раз, перед первой игрой, и дальше играет с той
   же коробки. Очередь на метку при этом осталась очередью квалификации — это
   отдельная вещь, см. stampQualSeats. */
function stageLandingPicker(field, you, title){
  stampQualSeats(field);
  return showFinalsLandingPicker(field, you, title);
}
function byQualOrder(a, b){
  // Записанная очередь бьёт всё остальное: она и есть прямой ответ на вопрос
  // «кто прошёл раньше», а очки и сила — только его заменители.
  if(a && b && a.qualSeat && b.qualSeat && a.qualSeat!==b.qualSeat)
    return a.qualSeat - b.qualSeat;
  const routed=(a && a.gcRoute) || (b && b.gcRoute);
  if(routed){
    const d=gcRouteRank(a)-gcRouteRank(b);
    if(d) return d;
  }
  return (a && a.qualByWin ? 0 : 1) - (b && b.qualByWin ? 0 : 1)
      || (b.stagePts||0) - (a.stagePts||0)
      || (b.pow||0) - (a.pow||0);
}

// `opts.into` continues an assignment already begun, so the squads that
// qualified ahead of the player can take their spots, the player can choose from
// what is left, and the ones behind them can fill in afterwards.
// `opts.keepFree` is the old guarantee of two empty boxes, off by default now:
// qualify last and there may be nowhere empty left, which is the point.
/* Дом чужой команды: одна коробка на острове, своя у каждой.

   Считается от самой команды и от острова, поэтому не зависит ни от комнаты,
   ни от вечера: те же двое из турнира в турнир летят в ту же точку. Кто именно
   куда — решает бросок, посоленный ником, но не ровный: чем сильнее команда,
   тем жирнее коробка ей достаётся. Это и есть та же мысль, по которой сильные
   и так дрались за лучший лут, только теперь у драки есть адрес.

   Слабым остаётся вся карта: вес коробки — её очки в степени, растущей с силой
   команды, так что топ-дуо почти всегда садится в тройку лучших POI, а
   середняк расходится по острову. */
function ccBotHome(t){ const h=ccBotHomes(t); return h.length ? h[0] : null; }
const CC_BOT_HOMES_N=5;   // сколько коробок в очереди домов у бота
let CC_HOME_CHEST_POW=1;   // сундуки коробки в весе дома: 1 — линейно, 0.5 — корнем (проба career-bot-homes-probe)
/* Дома команды — очередь из CC_BOT_HOMES_N коробок одним броском без возврата: если первый
   занят сильнейшим, команда идёт во второй, а не куда попало (16.09). */
function ccBotHomes(t){
  const zones=ALL_LANDING_ZONES;
  if(!zones || !zones.length || !t) return [];
  const key=(t.squad||[]).map(p=>p && p.handle).filter(Boolean).sort().join('+')
          || String(t.name||'');
  if(!key) return [];
  const set=ACTIVE_LANDING_SET||'m2';
  const rnd=careerRng(ccHashStr('home|'+set+'|'+key));
  /* Сила решает не адрес, а привередливость: 90 и выше выбирают из жирного.

     Тестер, 16.09: «сильные команды падают на самые лучшие локации, а у меня
     в карьерах всегда на рандомные сплиты». Проба career-bot-homes-probe: на
     m2 семь коробок из 19 стоят по 4 очка — «жирное» было семикратной ничьей,
     и дома десятки сильнейших ложились на них поровну, не глядя на сундуки
     (средний ранг по сундукам 12.6 из 19 — как у случайной). Теперь вес
     коробки — очки × сундуки относительно середины острова (тот же счёт, что
     открывает точка, ccSiteChests), а привередливость растёт круче: 100 силы —
     степень 2.5, а не 1.7. */
  const pow=t.pow||90;
  const k=clamp((pow-80)/8, 0.6, 3.2);
  const chestsOf=(typeof ccSiteChests==='function') ? zones.map(z=>ccSiteChests(z)) : zones.map(()=>1);
  const med=chestsOf.slice().sort((a,b)=>a-b)[Math.floor(chestsOf.length/2)]||1;
  const left=zones.map((z,i)=>Math.pow(Math.max(0.2, z.points||0.2)*Math.pow(Math.max(0.25, chestsOf[i]/med), CC_HOME_CHEST_POW), k));
  const out=[];
  for(let n=0; n<CC_BOT_HOMES_N; n++){
    let total=0; left.forEach(v=>{ total+=v; });
    if(!(total>0)) break;
    let r=rnd()*total, at=-1;
    for(let i=0;i<zones.length;i++){ if(left[i]<=0) continue; r-=left[i]; if(r<=0){ at=i; break; } }
    if(at<0) for(let i=zones.length-1;i>=0;i--){ if(left[i]>0){ at=i; break; } }
    if(at<0) break;
    out.push(zones[at]); left[at]=0;
  }
  return out;
}
/* Книга высадок сезона: первое место команды на острове пишется в сейв карьеры и держится весь сезон,
   занята точка, значит контест. ccBotHomes отдавал дом сильнейшему по очереди квалификации, а ccStageSeats
   живёт один этап в памяти вкладки, поэтому без книги команды переезжали и перезапуск финала раздавал заново.
   Сменить точку можно раз в вечер с шансом CC_DROP_BOOK_MOVE. В пересобранных лобби на тесной точке (bookCrowd)
   книга уступает общему правилу, иначе по пять команд на коробку. Вне карьеры и в локстепе книги нет,
   у двух клиентов она разошлась бы. */
const CC_DROP_BOOK_MOVE=0.05, CC_DROP_BOOK_MAX=6000;
function ccDropBook(){
  if(typeof CAREER==='undefined' || !CAREER || !CAREER.career || !CC_DROP_STAGE) return null;
  if(typeof ccMpLock==='function' && ccMpLock()) return null;
  const c=CAREER.career;
  const s=(c.season||1)+'|'+((typeof ccCalYear==='function') ? ccCalYear() : '');
  if(!c.dropBook || c.dropBook.s!==s) c.dropBook={s, at:{}, mv:{}};
  return c.dropBook;
}
// Имена и остров к записи книги: по ним рисуется карта высадок (ccDropMapOpen). Ключи книги — хеш, имён в них нет.
function ccDropBookName(book, key, t){
  if(!book || !key || !t) return;
  const nm=book.nm=book.nm||{};
  const names=(t.squad||[]).map(p=>p && p.handle).filter(Boolean).join(' & ') || t.name || '';
  if(names) nm[key]={n:names, s:ACTIVE_LANDING_SET};
}
function ccDropBookMoves(key){
  const b=CAREER && CAREER.career && CAREER.career.dropBook;
  if(!b || !key || !b.at[key]) return false;
  const day=(typeof careerToday==='function') ? String(careerToday()) : '';
  if(b.mv[key]===day) return false;
  if(careerRng(ccHashStr('bookmove|'+day+'|'+key))() >= CC_DROP_BOOK_MOVE) return false;
  b.mv[key]=day;   // переезд решён на весь вечер: следующая игра уже сядет по новой записи
  return true;
}
/* Книга высадок — только для лобби, где сидит человек (21.10, «карьера с временем начинает лагать»). Чужие лобби кубка на
   тысячи дуо писали в сейв дом каждой команды: книга росла до 1 МБ за сезон, сейв до 2.5 МБ к третьему, и каждое
   сохранение на телефоне стоило 0.2 с (career-lag-probe, замедление ×6: 8 мс у новой карьеры, 190 мс после трёх
   сезонов). Игрок видит только свои лобби, постоянные соседи нужны там же; чужие садятся по домам ccBotHomes. */
function ccLobbyMine(l){ return !!(l && l.some(t=>t && (t.isYou || t.isRival || t.isMate))); }
function buildBotLandingAssignment(bots, opts){
  // Strongest first, and each squad takes the best spot still worth taking.
  //
  // Seats used to be dealt at random out of a weighted pool, which produced the
  // right amount of contact and none of the meaning: measured over 300 lobbies,
  // 64% of the field shared a box, and the teams doing the sharing were exactly
  // average (power 100 against a field of 100) on exactly average spots (2.43
  // points against 2.44). So half the field lost a coin flip at the drop for no
  // reason, and whoever won the tournament was usually whoever happened to land
  // alone — the opposite of the real thing, where the drop map's contested boxes
  // are the named POIs and the teams in them are the ones who go on to win.
  //
  // Now the good teams pick first and they want the same loot, so the contests
  // land where the loot is. The real Global Championship map is the target: 33
  // trios across about 27 boxes, four of them shared, roughly a third of the
  // field contesting.
  // Ordered by when they qualified, not by how strong they are. Strength still
  // decides what they do with the pick — landingScore weighs a contest against
  // the squad already standing there — but the turn itself is earned.
  /* Сначала снять прошлый лут, потом раздавать.

     applyLandingPow добавляет команде очки коробки прямо в pow, и до 26 августа
     они висели на ней до конца этапа. А раздача с 25 августа считается каждую
     игру — и вторая игра сортировала комнату уже с прибавкой первой: кто сел на
     четвёрку, тот выбирал раньше, чем сел бы. Отсюда и переезды внутри финала,
     которые он увидел, — жетон этапа их не удержал бы, потому что менялся сам
     порядок выбора.

     Лут коробки — про игру, которую в ней играют, а не про очередь на
     следующую. Каждый в этом списке всё равно сейчас получит свой заново. */
  clearLandingPow(bots);
  const order=bots.slice().sort(byQualOrder);
  // Fortnite Manager: «тихая» высадка выбирает последней — когда видно, где все, и садится туда, где пусто.
  if(order.some(t=>t && t._mgrDrop==='quiet')) order.sort((a,b)=>((a&&a._mgrDrop==='quiet')?1:0)-((b&&b._mgrDrop==='quiet')?1:0));
  const zoneGroups=(opts && opts.into) || new Map();
  // Комната этапа: кто здесь уже сидел, тот садится туда же. См. ccStageSeats.
  const seats=ccStageSeats();
  const book=(opts && opts.noBook) ? null : ccDropBook();
  /* Лобби, пересобранные из большого поля (CC_SEATS_REMIX): сколько стоящих на точке книга терпит — сама плотность.
     Тестер, 6.10: «почти все локи свободны и боты устраивают трипл конв» — книга пишется на всё поле (100–150 дуо
     на 39 коробок, по 2–3 хозяина на точку), лобби перемешиваются каждую игру, и хозяева одной точки сходились в одно
     лобби втроём, а у соседней не было никого. Было «плотность плюс один» (3 на лобби 50): замер career-drop-games-probe
     на поле 100 — свободно 7–10 коробок, коробок с тремя 2–6, на высадке гибло 18–21 из 50 против 11 у свежей
     раздачи. Теперь хозяев на точке в таком лобби не больше плотности (две), лишний садится в пустую коробку
     (ниже, bumped): свободно 1–6, троек нет, точку между играми меняют 1–6 из ~47. Порог «один» заполнял все
     коробки, но тогда точку каждую игру меняла половина лобби — ровно вторая жалоба («каждую игру локу меняют»). */
  const bookCrowd=Math.max(2, Math.ceil(bots.length/Math.max(1,(ALL_LANDING_ZONES||[]).length)));
  /* Сильная половина лобби свою точку по книге не меняет весь сезон, контест так контест. Игрок просил, чтобы сильные
     команды всегда падали на одну локу. Замер check-career-drop-book: все переезды шли от шанса CC_DROP_BOOK_MOVE
     (61 за 11 турниров, у топ-10 ни одной команды на одном месте весь сезон), обмены и толпа их почти не давали.
     Шанс переезда остался только у слабой половины. */
  const bookHold=new Set(bots.slice().sort((a,b)=>((b.pow||0)+(b.closeEdge||0))-((a.pow||0)+(a.closeEdge||0))).slice(0, Math.ceil(bots.length/2)));
  // Сильные хозяева садятся первыми: иначе слабый, выпавший на переезд, занимал их коробку раньше, и хозяина выдавливало по плотности.
  if(book){
    const holds=t=>bookHold.has(t) && !t.isYou && !t.isRival && !t.isMate && !!book.at[ccHashStr(ccSeatMapKey(t)).toString(36)];
    const first=order.filter(holds), rest=order.filter(t=>!holds(t));
    order.length=0; first.concat(rest).forEach(t=>order.push(t));
  }
  order.forEach(t=>{
    /* Люди комнаты гонки (isRival) — как свой (isYou): их сажает голос, не место прошлого этапа.
       Иначе у соседа моя команда садилась на «своё место», у меня — нет, и число соседей на
       коробке расходилось на единицу (годовая проба 9.09: play-in 23.01, live1+sky:113 vs 114). */
    /* И напарник в команде вдвоём (isMate) — тоже человек: у себя он isYou и место этапа/книга его не трогали, а у
       соседа трогали (23.10, прогон 2022: DreamHack Winter 27.11, игра 2 — Pixie на 56 у себя и на 57 у напарника,
       MrSavage 48 против 56). Обмены ниже (movable) напарника и так обходили. */
    const seated=(seats && !t.isYou && !t.isRival && !t.isMate) ? ccSeatZone(seats.get(ccSeatMapKey(t))) : null;
    t._stageSeated=!!seated;   // уже сидит на точке этапа — обмен «слабые не на сильных» его не трогает
    t._bookAnchor=false;       // сильный на своей точке по книге: досадка ниже его не двигает (bookHold)
    if(seated){
      t.landingZone=seated; t.landingResult=null; t.landingRival=null;
      t.avgRating=Math.round(t.squad.reduce((s,p)=>s+p.rating,0)/t.squad.length);
      applyLandingPow(t, seated.points);
      if(!zoneGroups.has(seated)) zoneGroups.set(seated,[]);
      zoneGroups.get(seated).push(t);
      return;
    }
    /* Сначала — свой дом.

       Вопрос через игрока: «у ботов тоже лока залочена и они на
       одну летят или каждый турнир у них разные локации?» Замер ответил честно:
       разные — пять турниров одним полем, и ни одна из 49 команд не села в ту
       же коробку все пять раз. Решение: «своя коробка у каждой команды,
       пока сильнее не выбьет».

       Дом команды считается от неё самой и от острова (ccBotHome), поэтому он
       один и тот же из турнира в турнир, а место в очереди решает, достанется
       ли он ей сегодня: очередь — по квалификации, и кто прошёл выше, тот и
       садится первым. Занятый дом не берётся силой — команда идёт выбирать по
       общему правилу, тем же landingScore, что и раньше. Так у точки появляются
       постоянные хозяева, а у игрока — постоянные соседи. */
    /* Книга высадок сезона (ccDropBook): где команда села на этом острове в первый раз,
       туда и падает весь сезон — контест так контест, как у настоящих дуо. */
    const bookKey=(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null;   // хеш: в кубке тысячи дуо, сейв не резиновый
    const booked=bookKey ? ccSeatZone(book.at[bookKey]) : null;
    const moving=(booked && !bookHold.has(t)) ? ccDropBookMoves(bookKey) : false;
    // Плотность держится во ВСЕХ лобби (тестер 7.10: «баг не до конца пофиксился» — в финале FNCS без перемешивания
    // хозяев одной точки по книге садилось 6–8: «там уже 6 команд — придётся победить всех»).
    if(booked && !moving && (zoneGroups.get(booked)||[]).length<bookCrowd &&
       !(CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(booked)||0)>0) &&
       !(t._mgrDrop==='quiet' || t._mgrDrop==='hot')){
      t.landingZone=booked; t.landingResult=null; t.landingRival=null;
      t._bookAnchor=bookHold.has(t);
      t.avgRating=Math.round(t.squad.reduce((s,p)=>s+p.rating,0)/t.squad.length);
      applyLandingPow(t, booked.points);
      if(!zoneGroups.has(booked)) zoneGroups.set(booked,[]);
      zoneGroups.get(booked).push(t);
      if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(booked));
      return;
    }
    /* Своя точка в этом перемешанном лобби уже занята хозяевами из книги — значит, сегодня
       сюда пришли сразу несколько её хозяев. Лишний садится в пустую коробку, а не в
       следующий «дом» (дома — жирные точки, почти всегда занятые): иначе вместо одного
       неизбежного контеста получалось два. Книга не переписывается — в другом лобби он
       снова у себя. Замер career-drop-games-probe, поле 100 лобби по 50. */
    const bumped=booked && !moving && (zoneGroups.get(booked)||[]).length>=bookCrowd;
    if(bumped){
      let free=null, freeScore=-Infinity;
      ALL_LANDING_ZONES.forEach(z=>{
        if((zoneGroups.get(z)||[]).length || (CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(z)||0)>0)) return;
        const sc=landingScore(t, z, []);
        if(sc>freeScore){ freeScore=sc; free=z; }
      });
      if(free){
        t.landingZone=free; t.landingResult=null; t.landingRival=null;
        t.avgRating=Math.round(t.squad.reduce((s,p)=>s+p.rating,0)/t.squad.length);
        applyLandingPow(t, free.points);
        zoneGroups.set(free,[t]);
        if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(free));
        /* В постоянном составе (финал, не перемешанное лобби) точку не поделили — опоздавший хозяин переезжает на сезон,
           как на настоящей дроп-карте финала (9.10, «как в реальной жизни»). В перемешанных капах — нет: там в другом
           лобби он снова у себя, и дроп-карты у открытых капов не бывает. */
        if(!CC_SEATS_REMIX){ book.at[bookKey]=ccSeatKeyOf(free); ccDropBookName(book, bookKey, t); }
        return;
      }
    }
    const homes=ccBotHomes(t).filter(h=>!(moving && h===booked));
    const mine=(t.pow||0)+(t.closeEdge||0);
    /* «Пока сильнее не выбьет» — отзыв, и оно про обе стороны: свой дом
       не бросают из-за того, что там кто-то стоит. Пустой берётся всегда;
       занятый — если сидящие слабее, и тогда это стычка на своей точке, а не
       бегство с неё. Сильнее хозяина — уходит выбирать по общему правилу.
       Домов теперь очередь (ccBotHomes, 16.09): первый занят сильнейшим —
       пробуем следующий, и только когда заняты все — общее правило. */
    const home=homes.find(h=>{
      const at=zoneGroups.get(h)||[];
      const feared=CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(h)||0)>0;
      return !feared && (!at.length || at.every(o=>((o.pow||0)+(o.closeEdge||0)) < mine));
    }) || homes[0] || null;
    const at=home ? (zoneGroups.get(home)||[]) : [];
    /* Но не поверх чужой репутации. Дом бота нет-нет да и совпадёт с домом
       игрока — коробок тридцать шесть, команд полсотни, — и эта ветка брала
       его молча, не глядя ни на какую ауру. Отсюда вопрос:
       «почему на локации всегда по 2 команды?» и «чем больше аура, тем не
       падать должны люди»: замер показал ровно одного соседа при любой ауре,
       включая полную, потому что сосед приходил этой дорогой, а не общей.

       Теперь так: точка с репутацией взвешивается общим правилом
       (landingScore, там и живёт страх), даже если для кого-то она дом.
       Между собой боты держат дома как держали — карта страха пуста, пока у
       игрока нет ауры. */
    const feared=home && CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(home)||0)>0;
    // Приказ менеджера на высадку (тихая/горячая) сильнее привычки к своему дому.
    const canHold=home && !feared && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot') && (!at.length ||
      at.every(o=>((o.pow||0)+(o.closeEdge||0)) < mine));
    let zone=canHold ? home : null;
    if(!zone){
      let best=null, bestScore=-Infinity;
      ALL_LANDING_ZONES.forEach(z=>{
        const score=landingScore(t, z, zoneGroups.get(z));
        if(score>bestScore){ bestScore=score; best=z; }
      });
      zone=best;
    }
    zone=zone||ALL_LANDING_ZONES[0];
    t.landingZone=zone; t.landingResult=null; t.landingRival=null;
    t.avgRating=Math.round(t.squad.reduce((s,p)=>s+p.rating,0)/t.squad.length);
    applyLandingPow(t, zone.points);
    if(!zoneGroups.has(zone)) zoneGroups.set(zone,[]);
    zoneGroups.get(zone).push(t);
    if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(zone));   // люди комнаты — как свой (см. выше)
    // В книгу — только свой выбор: страх и приказ менеджера на один вечер, переполненный дом не переписывается.
    // И уступивший точку хозяин в постоянном составе, которому не нашлось пустой коробки, — тоже переезд на сезон (9.10, см. bumped).
    if(bookKey && (!booked || moving || (bumped && !CC_SEATS_REMIX)) &&
       !(t._mgrDrop==='quiet' || t._mgrDrop==='hot')){ book.at[bookKey]=ccSeatKeyOf(zone); ccDropBookName(book, bookKey, t); }
  });

  /* Досадка ниже (пустые, толпа, слабые/сильные) — про ГОТОВУЮ комнату. Раздача по очереди до игрока
     (opts.partial, pickInitialZone) её не делает: иначе ahead расползались по всем пустым коробкам ещё
     до его метки, и «раньше квалифицировался — раньше ставишь метку» ничего не покупало (полный прогон 9.10,
     check-lan-pick: 22-й на t3 видел свободными 2 коробки из 25 вместо 7). */
  if(opts && opts.partial) return {zoneGroups};

  /* ПУСТЫХ ТОЧЕК НЕ БЫВАЕТ, пока где-то стоят вдвоём. Его слово 6.10: «пустых точек не должно
     быть». Пока на острове есть пустая коробка, а в другой стоят две команды и больше, одна из
     них переходит в ближайшую пустую — гость (точка не её по книге), а из хозяев слабейший.
     Переезд короткий, на соседнюю точку, и книга не переписывается: в другом лобби команда снова
     у себя. Точка страха (аура игрока) не заполняется — её обходят нарочно. Люди, напарник по
     гонке и приказ менеджера на высадку не трогаются. */
  {
    const keyOfT=t=>(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null;
    const movable=t=>t && !t._bookAnchor && !t.isYou && !t.isRival && !t.isMate && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot');
    const feared=z=>CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(z)||0)>0;
    const d2=(a,b)=>((a.x||0)-(b.x||0))**2+((a.y||0)-(b.y||0))**2;
    for(let guard=0; guard<ALL_LANDING_ZONES.length; guard++){
      const empty=ALL_LANDING_ZONES.filter(z=>!(zoneGroups.get(z)||[]).length && !feared(z));
      if(!empty.length) break;
      // Кандидаты: в коробке с соседом; гость впереди хозяина, слабый впереди сильного.
      let best=null;
      zoneGroups.forEach((g, z)=>{
        if(g.length<2) return;
        g.filter(movable).forEach(t=>{
          const k=keyOfT(t), owner=k && book && book.at[k]===ccSeatKeyOf(z);
          const to=empty.reduce((a,b)=>d2(z,b)<d2(z,a) ? b : a);
          const cost=(owner ? 1e6 : 0)+d2(z,to)+ccDropTieOf(t, z);   // не по силе: см. ccDropTieOf
          if(!best || cost<best.cost) best={t, from:z, to, cost};
        });
      });
      if(!best) break;
      const {t, from, to}=best;
      zoneGroups.set(from, zoneGroups.get(from).filter(o=>o!==t));
      t.landingZone=to; t.landingResult=null; t.landingRival=null;
      applyLandingPow(t, to.points);
      zoneGroups.set(to, [t]);
      if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(to));
      // Хозяина пересадили вынужденно — он переезжает на сезон (9.10, «как в реальной жизни»: дроп-карту финала договаривают
      // один раз, уступивший точку держит новую весь турнир). Без записи он каждый вечер летел к себе и его снова пересаживали.
      { const kb=(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null; if(kb && book.at[kb]===ccSeatKeyOf(from)) book.at[kb]=ccSeatKeyOf(to); }
    }
  }

  /* И НЕ ТОЛПОЙ. Пустых коробок уже нет, а на одной стоит больше команд, чем плотность поля
     (ceil(команд/коробок), не меньше двух), — лишний (гость раньше хозяина, слабый раньше сильного)
     переходит в ближайшую коробку, где стоит меньше плотности. Тестер 7.10: «там уже 6 команд —
     придётся победить всех». Сторож tools/check-drop-crowd.js. */
  {
    const keyOfT=t=>(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null;
    const movable=t=>t && !t._bookAnchor && !t.isYou && !t.isRival && !t.isMate && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot');
    const feared=z=>CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(z)||0)>0;
    const d2=(a,b)=>((a.x||0)-(b.x||0))**2+((a.y||0)-(b.y||0))**2;
    let total=0; zoneGroups.forEach(g=>{ total+=g.length; });
    const dens=Math.max(2, Math.ceil(total/Math.max(1, ALL_LANDING_ZONES.length)));
    for(let guard=0; guard<total; guard++){
      const room=ALL_LANDING_ZONES.filter(z=>!feared(z) && (zoneGroups.get(z)||[]).length<dens);
      if(!room.length) break;
      let best=null;
      zoneGroups.forEach((g, z)=>{
        if(g.length<=dens) return;
        g.filter(movable).forEach(t=>{
          const k=keyOfT(t), owner=k && book && book.at[k]===ccSeatKeyOf(z);
          const to=room.reduce((a,b)=>((zoneGroups.get(b)||[]).length<(zoneGroups.get(a)||[]).length || ((zoneGroups.get(b)||[]).length===(zoneGroups.get(a)||[]).length && d2(z,b)<d2(z,a))) ? b : a);
          const cost=(owner ? 1e6 : 0)+d2(z,to)+ccDropTieOf(t, z);
          if(!best || cost<best.cost) best={t, from:z, to, cost};
        });
      });
      if(!best) break;
      const {t, from, to}=best;
      zoneGroups.set(from, zoneGroups.get(from).filter(o=>o!==t));
      t.landingZone=to; t.landingResult=null; t.landingRival=null;
      applyLandingPow(t, to.points);
      if(!zoneGroups.has(to)) zoneGroups.set(to, []);
      zoneGroups.get(to).push(t);
      if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(to));
      // Хозяина пересадили вынужденно — он переезжает на сезон (9.10, «как в реальной жизни»: дроп-карту финала договаривают
      // один раз, уступивший точку держит новую весь турнир). Без записи он каждый вечер летел к себе и его снова пересаживали.
      { const kb=(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null; if(kb && book.at[kb]===ccSeatKeyOf(from)) book.at[kb]=ccSeatKeyOf(to); }
    }
  }

  /* СЛАБЫЕ НЕ САДЯТСЯ НА САМЫХ СИЛЬНЫХ. Тестер 7.10: «чтобы на самых сильных не падали слабые, а то не
     реалистично, особенно когда их убивают»; ответ ему — «меньше падали, но оффспавн рандом». Замер
     check-drop-weak-on-strong: 9,4 встречи «нижняя половина поля на точке топ-10» на лобби из 50.
     Теперь такой слабый меняется местами с командой посильнее (не из топа, не из нижней половины) из коробки,
     где топа нет: число команд в коробках то же, так что толпа и пустые точки не ломаются. Гость уходит раньше
     хозяина, книга не переписывается. Люди, напарник и приказ менеджера на высадку не трогаются. */
  {
    // Точку внутри этапа не меняют (ccStageSeats): меняются местами только те, кто садится в этом этапе впервые.
    const movable=t=>t && !t._bookAnchor && !t.isYou && !t.isRival && !t.isMate && !t._stageSeated && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot');
    const keyOfT=t=>(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null;
    const str=t=>((t.pow||0)-(t._landingPow||0))+(t.closeEdge||0);
    const all=[]; zoneGroups.forEach(g=>g.forEach(t=>all.push(t)));
    if(all.length>=8){
      const ranked=all.slice().sort((a,b)=>str(b)-str(a));
      const top=new Set(ranked.slice(0, Math.ceil(all.length/5))), weak=new Set(ranked.slice(Math.ceil(all.length/2)));
      const zoneOf=new Map(); zoneGroups.forEach((g,z)=>g.forEach(t=>zoneOf.set(t, z)));
      for(let guard=0; guard<all.length; guard++){
        let best=null;
        zoneGroups.forEach((g, z)=>{
          if(!g.some(t=>top.has(t))) return;
          g.filter(t=>weak.has(t) && movable(t)).forEach(w=>{
            /* Хозяин точки по книге не двигается — как в обмене «сильные не на сильных» ниже (его слово 9.10: «сделай как в
               реальной жизни, посмотри игры, карты»). Дроп-карты финалов Мейджоров 2/3 2023 (eucompetitive × Liquipedia): из 14
               общих коробок в 5 команда топ-10 делит точку с 25-й и ниже — 1–4 таких встречи на 50 команд, а не ноль; точку
               держат весь турнир. Слабый хозяин рядом с сильным — обычный контест; уходят только гости точки. */
            const k=keyOfT(w), owner=k && book && book.at[k]===ccSeatKeyOf(z);
            if(owner) return;
            all.forEach(x=>{
              if(top.has(x) || weak.has(x) || !movable(x)) return;
              const z2=zoneOf.get(x); if(!z2 || z2===z || (zoneGroups.get(z2)||[]).some(o=>top.has(o))) return;
              const kx=keyOfT(x); if(kx && book && book.at[kx]===ccSeatKeyOf(z2)) return;   // и середняк-хозяин тоже
              const cost=str(w)*100-str(x);
              if(!best || cost<best.cost) best={w, x, z, z2, cost};
            });
          });
        });
        if(!best) break;
        const {w, x, z, z2}=best;
        zoneGroups.set(z, zoneGroups.get(z).map(o=>o===w ? x : o));
        zoneGroups.set(z2, zoneGroups.get(z2).map(o=>o===x ? w : o));
        zoneOf.set(w, z2); zoneOf.set(x, z);
        [[w, z2], [x, z]].forEach(([t, to])=>{
          t.landingZone=to; t.landingResult=null; t.landingRival=null;
          applyLandingPow(t, to.points);
          if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(to));
        });
      }
    }
  }
  /* СИЛЬНЫЕ НЕ САДЯТСЯ ДРУГ НА ДРУГА (тестер, Notion «0810»: «сильные команды летят на одну локу, и одна из них занимает
     почти последнее место»; его слово: «посмотри, как работает в реальных играх»). В настоящих FNCS у команд верха свои
     точки, которые держат весь сезон, и в одну коробку два топа почти не садятся — лишний контест стоит обоим вечера.
     Замер (check-drop-top-on-top, 36 лобби по 50 дуо): коробок с двумя командами из топ-10 было 0,39 на лобби — и до
     обмена «слабые с сильных» (7.10) столько же. Теперь более слабый из двух топов меняется местами с середняком из
     коробки без топа; число команд в коробках то же. Хозяин точки по книге не двигается. */
  {
    const movable=t=>t && !t._bookAnchor && !t.isYou && !t.isRival && !t.isMate && !t._stageSeated && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot');
    /* Якорь книги (bookHold) уступает только другому топу. В карьере лобби каждый раз своё, и двое сильных с одной точкой
       по книге сходились и стояли так весь сезон: якорь обмен не трогал. */
    const movableTop=t=>t && !t.isYou && !t.isRival && !t.isMate && !t._stageSeated && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot');
    const keyOfT=t=>(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null;
    const str=t=>((t.pow||0)-(t._landingPow||0))+(t.closeEdge||0);
    const all=[]; zoneGroups.forEach(g=>g.forEach(t=>all.push(t)));
    if(all.length>=8){
      const ranked=all.slice().sort((a,b)=>str(b)-str(a));
      const top=new Set(ranked.slice(0, Math.ceil(all.length/5))), weak=new Set(ranked.slice(Math.ceil(all.length/2)));
      const zoneOf=new Map(); zoneGroups.forEach((g,z)=>g.forEach(t=>zoneOf.set(t, z)));
      for(let guard=0; guard<all.length; guard++){
        let best=null;
        zoneGroups.forEach((g, z)=>{
          const tops=g.filter(t=>top.has(t)); if(tops.length<2) return;
          /* Двое топов — хозяева одной точки по книге (оба сели туда в первый вечер) — делили её весь сезон: обмен хозяина
             не трогал. Тестер 10.10: «все самые сильные друг другу руинят FNCS, из-за того что падают друг на друга».
             Теперь уходит и хозяин — слабейший из топов точки, гость раньше хозяина, — и переезжает на сезон (книга ниже). */
          const strongest=tops.reduce((a,b)=>str(b)>str(a) ? b : a);
          tops.filter(t=>t!==strongest && movableTop(t)).forEach(w=>{
            const k=keyOfT(w), owner=k && book && book.at[k]===ccSeatKeyOf(z);
            all.forEach(x=>{
              if(top.has(x) || weak.has(x) || !movable(x)) return;
              const z2=zoneOf.get(x); if(!z2 || z2===z || (zoneGroups.get(z2)||[]).some(o=>top.has(o))) return;
              /* С книгой хозяин своей точки — почти каждый середняк, и запрет «середняк-хозяин не меняется» не оставлял
                 обмену никого: замер (поле 50, 12 турниров с книгой) — две коробки с парой топ-10 на лобби, 8–13 пар
                 вместе 6+ турниров из 12; без книги — ноль. Середняк-хозяин меняется, но после гостей. */
              const kx=keyOfT(x), xOwner=!!(kx && book && book.at[kx]===ccSeatKeyOf(z2));
              const cost=(owner ? 1e6 : 0)+(xOwner ? 1e5 : 0)+(zoneGroups.get(z2)||[]).filter(o=>o!==x && weak.has(o)).length*1e4+str(w)*100-str(x);   // топ уходит туда, где нет слабых
              if(!best || cost<best.cost) best={w, x, z, z2, cost, owner:!!owner, k, xOwner, kx};
            });
          });
        });
        if(!best){
          /* Меняться не с кем: середняки сильной половины тоже якоря книги, а слабых обмен выше не берёт. Тогда слабейший
             из двух топов коробки уходит в пустую коробку (лучшую по очкам), а если пустых нет (поле занимает весь остров) —
             меняется с любым не-топом из коробки без топа, где народу меньше. Переезд на сезон. */
          let pair=null;
          zoneGroups.forEach((g, z)=>{
            if(pair) return;
            const tops=g.filter(t=>top.has(t)); if(tops.length<2) return;
            const strongest=tops.reduce((a,b)=>str(b)>str(a) ? b : a);
            const w=tops.filter(t=>t!==strongest && movableTop(t)).sort((a,b)=>str(a)-str(b))[0];
            if(w) pair={w, z};
          });
          if(!pair) break;
          const {w, z}=pair, k=keyOfT(w), owner=!!(k && book && book.at[k]===ccSeatKeyOf(z));
          let to=null;
          ALL_LANDING_ZONES.forEach(c=>{
            if((zoneGroups.get(c)||[]).length || (CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(c)||0)>0)) return;
            if(!to || (c.points||0)>(to.points||0)) to=c;
          });
          if(to){
            if(book && !CC_SEATS_REMIX && owner) book.at[k]=ccSeatKeyOf(to);
            zoneGroups.set(z, zoneGroups.get(z).filter(o=>o!==w));
            zoneGroups.set(to, [w]); zoneOf.set(w, to);
            w.landingZone=to; w.landingResult=null; w.landingRival=null;
            applyLandingPow(w, to.points);
            if(seats && !w.isYou && !w.isRival && !w.isMate) seats.set(ccSeatMapKey(w), ccSeatKeyOf(to));
            continue;
          }
          let x=null, z2=null, xc=Infinity;
          all.forEach(o=>{
            if(top.has(o) || !movableTop(o)) return;
            const oz=zoneOf.get(o); if(!oz || oz===z || (zoneGroups.get(oz)||[]).some(q=>top.has(q))) return;
            const c=(zoneGroups.get(oz)||[]).length*1e4-str(o);
            if(c<xc){ xc=c; x=o; z2=oz; }
          });
          if(!x) break;
          const kx=keyOfT(x);
          best={w, x, z, z2, owner, k, xOwner:!!(kx && book && book.at[kx]===ccSeatKeyOf(z2)), kx};
        }
        const {w, x, z, z2}=best;
        // Переезд на сезон, как у уступившего точку в постоянном составе; в перемешанных капах книга не трогается.
        /* Переезд на сезон у обоих, как у уступившего точку в постоянном составе: иначе перезапуск финала с другой очередью
           сажал середняка обратно к себе и обмен шёл заново по-другому (check-career-drop-book: 3 из 50 сменили точку). */
        if(book && !CC_SEATS_REMIX){ if(best.owner) book.at[best.k]=ccSeatKeyOf(z2); if(best.xOwner) book.at[best.kx]=ccSeatKeyOf(z); }
        zoneGroups.set(z, zoneGroups.get(z).map(o=>o===w ? x : o));
        zoneGroups.set(z2, zoneGroups.get(z2).map(o=>o===x ? w : o));
        zoneOf.set(w, z2); zoneOf.set(x, z);
        [[w, z2], [x, z]].forEach(([t, to])=>{
          t.landingZone=to; t.landingResult=null; t.landingRival=null;
          applyLandingPow(t, to.points);
          if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(to));
        });
      }
    }
  }

  /* КОНТЕСТЯТ СЛАБЫЕ. Команда из сильной половины, которая стоит в коробке с кем-то, меняется местами с командой
     из слабой половины, которая стоит одна: сильные сидят по одиночке, общие коробки достаются нижней половине.
     Число команд в коробках не меняется. В постоянном составе переезд на сезон (книга), в перемешанных капах нет. */
  {
    const movable=t=>t && !t._bookAnchor && !t.isYou && !t.isRival && !t.isMate && !t._stageSeated && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot');
    const keyOfT=t=>(book && !t.isYou && !t.isRival && !t.isMate) ? ccHashStr(ccSeatMapKey(t)).toString(36) : null;
    const str=t=>((t.pow||0)-(t._landingPow||0))+(t.closeEdge||0);
    const all=[]; zoneGroups.forEach(g=>g.forEach(t=>all.push(t)));
    if(all.length>=8){
      const ranked=all.slice().sort((a,b)=>str(b)-str(a));
      const strong=new Set(ranked.slice(0, Math.floor(all.length/2)));
      const zoneOf=new Map(); zoneGroups.forEach((g,z)=>g.forEach(t=>zoneOf.set(t, z)));
      for(let guard=0; guard<all.length; guard++){
        // Сильнейший из стоящих в общей коробке уходит первым — в лучшую из одиночных коробок слабых.
        const s=ranked.find(t=>strong.has(t) && movable(t) && (zoneGroups.get(zoneOf.get(t))||[]).length>1);
        if(!s) break;
        let w=null, wz=null;
        all.forEach(x=>{
          if(strong.has(x) || !movable(x)) return;
          const z2=zoneOf.get(x); if(!z2 || (zoneGroups.get(z2)||[]).length!==1) return;
          if(!w || (z2.points||0)>(wz.points||0) || ((z2.points||0)===(wz.points||0) && str(x)<str(w))){ w=x; wz=z2; }
        });
        if(!w){ strong.delete(s); continue; }
        const z=zoneOf.get(s);
        if(book && !CC_SEATS_REMIX){
          const ks=keyOfT(s), kw=keyOfT(w);
          if(ks) book.at[ks]=ccSeatKeyOf(wz);
          if(kw) book.at[kw]=ccSeatKeyOf(z);
        }
        zoneGroups.set(z, zoneGroups.get(z).map(o=>o===s ? w : o));
        zoneGroups.set(wz, [s]);
        zoneOf.set(s, wz); zoneOf.set(w, z);
        [[s, wz], [w, z]].forEach(([t, to])=>{
          t.landingZone=to; t.landingResult=null; t.landingRival=null;
          applyLandingPow(t, to.points);
          if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(to));
        });
      }
      /* И СИЛЬНЫЕ НА СИЛЬНЫХ ТОЧКАХ. После обмена выше слабые оставались вдвоём как раз на лучших коробках:
         замер 8 лобби по 49 дуо — верхняя четверть по силе на 2.76 очка точки, нижняя на 3.40. Теперь сильный
         одиночка, начиная с сильнейшего, переезжает на лучшую коробку, где стоят только слабые (или никого),
         а они всей группой садятся на его место. Число команд в коробках опять не меняется. */
      const place=(t, to)=>{
        t.landingZone=to; t.landingResult=null; t.landingRival=null;
        applyLandingPow(t, to.points);
        if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(to));
        const k=keyOfT(t); if(k && !CC_SEATS_REMIX) book.at[k]=ccSeatKeyOf(to);
      };
      // Только те, кого сажает этот вызов: хвост очереди после метки не двигает уже показанных на карте.
      const inCall=new Set(bots);
      ranked.filter(t=>strong.has(t) && movable(t) && inCall.has(t)).forEach(s=>{
        const z=zoneOf.get(s);
        if(!z || (zoneGroups.get(z)||[]).length!==1) return;
        let best=null;
        (ALL_LANDING_ZONES||[]).forEach(z2=>{
          if(z2===z || (z2.points||0)<=(z.points||0)) return;
          // Дом игрока, который боты обходят по ауре, — не цель переезда.
          if((CC_SPOT_LOCK_ZONES && CC_SPOT_LOCK_ZONES.has(z2)) || (CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(z2)||0)>0)) return;
          const g=zoneGroups.get(z2)||[];
          if(g.some(o=>strong.has(o) || !movable(o) || !inCall.has(o))) return;
          if(!best || (z2.points||0)>(best.points||0)) best=z2;
        });
        if(!best) return;
        const g=zoneGroups.get(best)||[];
        if(g.length) zoneGroups.set(z, g); else zoneGroups.delete(z);
        zoneGroups.set(best, [s]);
        g.forEach(o=>{ zoneOf.set(o, z); place(o, z); });
        zoneOf.set(s, best); place(s, best);
      });
      /* Сильная половина не на самых бедных точках. Якорь книги держит точку весь сезон, поэтому кто раз сел на нижний
         уровень, оставался там: меняем его с самым слабым одиночкой выше по очкам. Переезд один раз, дальше снова книга.
         В перемешанных лобби книга не пишется, там не трогаем, иначе точка менялась бы от лобби к лобби. */
      if(!CC_SEATS_REMIX && book){
        const free=t=>t && !t.isYou && !t.isRival && !t.isMate && !t._stageSeated && !(t._mgrDrop==='quiet' || t._mgrDrop==='hot') && inCall.has(t);
        const floor=Math.min(...(ALL_LANDING_ZONES||[]).map(z=>z.points||0));
        ranked.filter(t=>strong.has(t) && free(t)).forEach(s=>{
          const z=zoneOf.get(s);
          if(!z || (z.points||0)>floor) return;
          let x=null;
          all.forEach(o=>{
            if(o===s || !free(o) || str(o)>=str(s)) return;
            const zo=zoneOf.get(o);
            if(!zo || (zo.points||0)<=floor || (zoneGroups.get(zo)||[]).length!==1) return;
            if(CC_SPOT_LOCK_ZONES && CC_SPOT_LOCK_ZONES.has(zo)) return;
            if(!x || str(o)<str(x)) x=o;
          });
          if(!x) return;
          const zx=zoneOf.get(x);
          zoneGroups.set(z, zoneGroups.get(z).map(o=>o===s ? x : o));
          zoneGroups.set(zx, [s]);
          zoneOf.set(s, zx); zoneOf.set(x, z);
          place(s, zx); place(x, z);
        });
      }
      /* СНАЧАЛА ПУСТЫЕ ТОЧКИ: пока есть пустая, никто не стоит вдвоём. На неё уходит слабейшая команда из самой людной
         общей коробки (лучшая пустая — первой). Контесты остаются только когда команд больше, чем коробок.
         Дом игрока, который боты обходят по ауре, не трогаем. */
      if(!(opts && opts.keepFree)){
        for(let guard=0; guard<all.length; guard++){
          const empty=(ALL_LANDING_ZONES||[]).filter(z=>!(zoneGroups.get(z)||[]).length &&
            !(CC_SPOT_LOCK_ZONES && CC_SPOT_LOCK_ZONES.has(z)) && !(CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(z)||0)>0))
            .sort((a,b)=>(b.points||0)-(a.points||0));
          if(!empty.length) break;
          let from=null, w=null;
          zoneGroups.forEach((g,z)=>{
            if(g.length<2) return;
            const c=g.filter(o=>movable(o) && inCall.has(o)).sort((a,b)=>str(a)-str(b))[0];
            if(c && (!from || g.length>zoneGroups.get(from).length ||
                     (g.length===zoneGroups.get(from).length && str(c)<str(w)))){ from=z; w=c; }
          });
          if(!w) break;
          const to=empty[0];
          zoneGroups.set(from, zoneGroups.get(from).filter(o=>o!==w));
          zoneGroups.set(to, [w]);
          zoneOf.set(w, to); place(w, to);
        }
      }
    }
  }

  // The old guarantee: shuffle squads off the emptiest box until two boxes are
  // free, so the player always had somewhere quiet to land. It is off unless a
  // caller asks for it — a lobby where the last qualifier is left choosing
  // between occupied spots is the situation, not a bug to design around.
  while(opts && opts.keepFree && ALL_LANDING_ZONES.filter(z=>!zoneGroups.has(z)).length<2){
    const occupied=[...zoneGroups.entries()].sort((a,b)=>a[1].length-b[1].length);
    const [zoneToClear, evicted]=occupied[0];
    const targets=occupied.slice(1);
    evicted.forEach(t=>{
      const [targetZone, targetGroup]=targets[Math.floor(Math.random()*targets.length)];
      // Re-apply through the tracker so the moved squad's bonus stays the one
      // that gets removed at the end of the stage — adjusting pow by hand here
      // left the difference behind permanently.
      applyLandingPow(t, targetZone.points);
      t.landingZone=targetZone;
      targetGroup.push(t);
      // Переезд по расчистке — тоже место в комнате, иначе следующая игра
      // вернула бы команду в коробку, которую только что освободили.
      if(seats && !t.isYou && !t.isRival && !t.isMate) seats.set(ccSeatMapKey(t), ccSeatKeyOf(targetZone));
    });
    zoneGroups.delete(zoneToClear);
  }

  /* СИЛЬНЫЕ СТОЯТ ОДНИ (его слово 5.11: «как в трио S43, везде»). Замер tools/measure-drop-contests.js: на трио S43 богатейшая
     точка у команды ранга 3.6 и одна в 95%, а в дуо на том же острове ранг 13.4 и одна в 33%: команд больше клеток, и лишние
     садились к кому угодно. Теперь сильнейшие занимают самые богатые точки и стоят там одни, контесты уходят вниз лобби.
     Сколько таких: сколько клеток может остаться без пары, но не меньше десяти. Люди, приказ менеджера и уже сидящие
     в этом этапе не двигаются; человека с точки никто не сгоняет, и к человеку не подсаживают, пока есть другое место. */
  {
    const human=t=>t && (t.isYou || t.isRival || t.isMate);
    const fixed=t=>!t || human(t) || t._stageSeated || t._mgrDrop==='quiet' || t._mgrDrop==='hot';
    const str=t=>((t.pow||0)-(t._landingPow||0))+(t.closeEdge||0);
    const feared=z=>CC_SPOT_FEAR_MAP && (CC_SPOT_FEAR_MAP.get(z)||0)>0;
    const all=[]; zoneGroups.forEach(g=>g.forEach(t=>all.push(t)));
    const zones=(ALL_LANDING_ZONES||[]).filter(z=>!feared(z));
    if(all.length>=8 && zones.length>=4){
      const N=all.length, C=zones.length;
      // Сколько одиночек вмещается, чтобы остальные не стояли гуще плотности поля (tools/check-drop-crowd.js).
      const dens=Math.max(2, Math.ceil(N/C)), room=Math.floor((C*dens-N)/(dens-1));
      const K=Math.max(0, Math.min(N, C-1, room, Math.max(10, C-Math.max(0, N-C))));
      // При равной силе порядок по команде, а не по тому, кто где стоит: иначе верх менялся бы от турнира к турниру.
      const byStr=(x,y)=>(str(y)-str(x)) || (String(ccSeatMapKey(x))<String(ccSeatMapKey(y)) ? -1 : 1);
      const ranked=all.slice().sort(byStr);
      const top=new Set(ranked.slice(0, K)), top10=new Set(ranked.slice(0, Math.max(K, 10)));
      const d2=(p,q)=>((p.x||0)-(q.x||0))**2+((p.y||0)-(q.y||0))**2;
      const move=(x, from, to)=>{
        zoneGroups.set(from, (zoneGroups.get(from)||[]).filter(o=>o!==x));
        if(!zoneGroups.has(to)) zoneGroups.set(to, []);
        zoneGroups.get(to).push(x);
        x.landingZone=to; x.landingResult=null; x.landingRival=null;
        applyLandingPow(x, to.points);
        if(seats) seats.set(ccSeatMapKey(x), ccSeatKeyOf(to));
        // Точка, которую команда получила, держится весь сезон: иначе завтра она снова летит к себе и снова переезжает.
        if(book && !CC_SEATS_REMIX) book.at[ccHashStr(ccSeatMapKey(x)).toString(36)]=ccSeatKeyOf(to);
      };
      // Самые богатые точки: на каждой должен стоять кто-то из верха, сильнейшие первыми.
      const rich=zones.slice().sort((p,q)=>((q.r||0)-(p.r||0)) || ((q.points||0)-(p.points||0)));
      const richTop=rich.slice(0, Math.min(5, K)), richSet=new Set(richTop);
      const free=[...top].filter(x=>!fixed(x) && !richSet.has(x.landingZone)).sort(byStr);
      richTop.forEach(z=>{
        const g=zoneGroups.get(z)||[];
        if(g.some(x=>top10.has(x) || human(x))) return;
        const x=free.shift(); if(x) move(x, x.landingZone, z);
      });
      // Куда уходит лишний: клетка без верха, где меньше всего народу, рядом. К человеку только если больше некуда.
      const spot=(from, self)=>{
        const ok=zones.filter(z=>z!==from && (zoneGroups.get(z)||[]).length<dens && !(zoneGroups.get(z)||[]).some(o=>o!==self && top10.has(o)));
        if(!ok.length) return null;
        const load=z=>{ const g=zoneGroups.get(z)||[]; return g.length+(g.some(human) ? 1000 : 0); };
        return ok.reduce((p,q)=>(load(q)<load(p) || (load(q)===load(p) && d2(from,q)<d2(from,p))) ? q : p);
      };
      [...top].sort(byStr).forEach(x=>{
        const z=x.landingZone, g=(zoneGroups.get(z)||[]).filter(o=>o!==x);
        if(!g.length || g.some(human)) return;
        g.forEach(o=>{
          if(top.has(o) && byStr(o, x)<0) return;
          if(fixed(o)) return;
          const to=spot(z, o); if(to) move(o, z, to);
        });
        // Рядом остался более сильный из верха: уходит сам.
        if((zoneGroups.get(z)||[]).some(o=>o!==x && top.has(o) && byStr(o, x)<0) && !fixed(x)){ const to=spot(z, x); if(to) move(x, z, to); }
      });
    }
  }

  // It used to also name a guaranteed low-points box and a second one, so the
  // picker could promise the player somewhere quiet. Nothing has read those in a
  // while and nothing should: which boxes are free is now whatever the squads
  // ahead of you left free.
  return {zoneGroups};
}

// Power-weighted landing-fight odds — same shape as the main duel formula but
// with its own (gentler) exponent, since everyone's still fresh off spawn with
// no loadout edge yet. Facing multiple rivals in one zone means clearing them
// one at a time, so the odds compound down fast: a single spot is close to even,
// and picking one with two squads already on it is still a real risk.
const LANDING_POW_EXPONENT=3;
// How far power is allowed to tilt a fight off the spawn. Everybody lands with
// the same nothing — no loadout, no height, no information — so the spot is
// mostly a coin flip, and the better squad is favoured without ever being safe.
// Sixty-forty is the ceiling, reached only by the widest power gap in a lobby;
// two squads of similar power land much closer to even. The exponent still
// decides where inside that band a matchup sits.
const LANDING_ODDS_CAP=0.60;
function landingWinChanceVs(you, rival){
  const a=Math.pow(Math.max(you.pow,1), LANDING_POW_EXPONENT);
  const b=Math.pow(Math.max(rival.pow,1), LANDING_POW_EXPONENT);
  return clamp(a/(a+b), 1-LANDING_ODDS_CAP, LANDING_ODDS_CAP);
}

// Shown once at the start of the tournament — you pick your landing zone
// on the map, same as everyone else. The actual scrap with whoever else
// picked (or got assigned) your zone is resolved fresh every single game
// inside simulateGamesLive, not here — this just fixes the zone layout.
// The lobby you are about to drop into, shown beside the map. Grouped by
// region when the field is mixed (the LAN), a flat list when it isn't.
function landingFieldHTML(you, bots){
  // The real number the simulation runs on — squad power with synergy and the
  // loadout already in it — not the plain average of card ratings.
  const powOf=t=>t.pow!=null ? Math.round(t.pow)
    : (t.squad&&t.squad.length
        ? Math.round(t.squad.reduce((s,p)=>s+attrsFor(p).ovr,0)/t.squad.length) : null);
  // Сильные сверху: список читают, выбирая, кого контестить.
  const teams=[you, ...bots].sort((a,b)=>(powOf(b)||0)-(powOf(a)||0));
  const regionOf=t=>t.summitRegion || (t.squad&&t.squad[0]||{}).region || '';
  const regions=[...new Set(teams.map(regionOf).filter(Boolean))];
  const row=t=>{
    const mine=t===you;
    const ovr=powOf(t)!=null ? powOf(t) : '-';
    const names=t.squad ? t.squad.map(p=>cardFlag(p,13)+p.handle).join(' & ') : t.name;
    return `<tr${mine?' style="background:rgba(0,176,144,.10);font-weight:700;"':''}>
      <td>${names}${mine?' <span style="color:var(--accent);font-size:10px;text-transform:uppercase;"> · '+L().summitYouTag+'</span>':''}</td>
      <td class="num" style="color:var(--ink-dim);width:44px;">${ovr}</td>
    </tr>`;
  };
  // A bare number column left people guessing what it meant, so the list gets
  // the same TEAM / POWER header the standings tables use.
  const thead=`<thead><tr>
    <th style="text-align:left;">${L().teamHeader}</th>
    <th class="num" style="width:44px;">${L().avgHeader}</th>
  </tr></thead>`;
  let html=`<div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-dim);margin:10px 0 4px;">
    ${L().landingFieldTitle(teams.length)}</div>`;
  if(regions.length>1){
    html+=`<div class="lobby-wrap" style="max-height:560px;overflow-y:auto;"><table class="lobby-table">${thead}<tbody>`;
    regions.forEach(reg=>{
      const inReg=teams.filter(t=>regionOf(t)===reg);
      html+=`<tr><td colspan="2" style="color:var(--accent);font-size:11px;font-weight:800;
        text-transform:uppercase;letter-spacing:.06em;padding-top:8px;">${regionName(reg)}
        <span style="color:var(--ink-dimmer);font-weight:600;">${inReg.length}</span></td></tr>`;
      html+=inReg.map(row).join('');
    });
    html+='</tbody></table></div>';
  } else {
    html+=`<div class="lobby-wrap" style="max-height:560px;overflow-y:auto;">
      <table class="lobby-table">${thead}<tbody>${teams.map(row).join('')}</tbody></table></div>`;
  }
  return html;
}

// `title` names the stage the pick is for. Every stage that plays its games on
// the map runs this — the Heats, the Last Chance, the Summit, the Finals — so a
// header hard-coded to the Finals was wrong for most of them.
async function pickInitialZone(you, bots, title, seat, room){
  beginAnimatedStage();
  // You pick in the order you qualified, like everybody else. The squads that
  // were through before you have already put their markers down and you choose
  // from what is left; the ones behind you land after you and can drop on your
  // head. Win a game in the Heats and the whole island is yours to pick from —
  // scrape through last and you may be choosing between occupied boxes.
  /* seat - the place the player actually qualified in, where the caller knows
     it. Without one this sorts on byQualOrder, which reads stagePts and pow; a
     field built fresh for the next stage has nobody's points on it yet, so the
     whole queue collapses to team power and the strongest duo in the room picks
     first every time. In a career that is the player, always, which is the
     opposite of what the queue is for: you pick where you finished. */
  const ordered=bots.slice().sort(byQualOrder);
  const ahead = seat>0 ? ordered.slice(0, Math.min(seat-1, ordered.length))
                       : bots.filter(t=>byQualOrder(t, you)<0);
  const aheadSet=new Set(ahead);
  const behind = seat>0 ? ordered.filter(t=>!aheadSet.has(t))
                        : bots.filter(t=>byQualOrder(t, you)>=0);
  /* На карте сидит вся комната, а не только ahead (кто квалифицировался раньше). Иначе контест выбирался вслепую:
     из 50 команд видно 15, остальные садились после подтверждения.
     Очередь та же: ahead занимают первыми, behind то, что осталось, просто до показа карты. Совпадает с панелью
     вопроса («к тебе летят двое»), она тоже считает полную комнату.
     room: комната, посчитанная снаружи (careerLandingPick). Берём её, иначе кнопка и карта от разных бросков. */
  careerSpotFearOn(you);
  // partial: готовую комнату досаживает раздача хвоста ПОСЛЕ метки (ниже); без хвоста ahead и есть вся комната.
  const zoneGroups = room || buildBotLandingAssignment(ahead, behind.length ? {partial: true} : undefined).zoneGroups;
  if(!room) buildBotLandingAssignment(behind, {into: zoneGroups, partial: true});
  careerSpotFearOff();
  // Recorded so the header can say where in the queue you are.
  const pickSeat=ahead.length+1;

  /* Кто уже сидит на карте, а кто только метит. Комнату рассаживаем целиком, иначе остров пустой. Но те, кто
     выбирает ПОСЛЕ тебя (порядок по месту в плей-ине), считаются ещё не занявшими: на карте пунктир, в подсказке
     отдельная строка, «за меня» видит их коробки свободными. После подтверждения они пересаживаются уже зная твою
     метку (хвост функции).
     Только если комнату строили здесь. Пришедшую снаружи (room, карьера вдвоём) пересаживать нельзя, она общая,
     поэтому её хвост показываем занятым. */
  const previewLater = !room;
  if(previewLater){
    ahead.forEach(t=>{ t._afterYou=false; });
    behind.forEach(t=>{ t._afterYou=true; });
  }
  const seatedNow   = g => (g||[]).filter(t=>!(previewLater && t._afterYou));
  const seatedLater = g => previewLater ? (g||[]).filter(t=>t._afterYou) : [];

  /* Пикер открывается ОБОИМ, и смотрящему тоже.

     Сначала он был выходом «за меня»: смотришь — метку ставят автоматически.
     Правка: «и watch it тоже добавь возможность ставить метку…
     крч то же самое, только без выборов во время игры». Метка — это не вопрос
     по ходу игры, это ход перед ней, и он остаётся у обоих. Разница между
     режимами ровно одна — лут и высокая земля посреди матча (см. playSelfOn на
     withChoices в simulateGamesLive). */
  const container=document.getElementById('majorStages');
  // One picker on the page at a time. The card is removed when the pick is
  // confirmed and only then, so any path that abandons a picker — an early
  // return, a throw, a stage that never resolves — left it sitting there, and
  // the next stage opened its own underneath. A player caught two: a Last Chance
  // board of fifty above a Grand Finals board of thirty-three, both live, both
  // asking to be clicked. Same defence ensureLandingPrompt already uses.
  document.querySelectorAll('.landing-picker').forEach(el=>el.remove());
  const box=document.createElement('div');
  box.className='stage-card landing-picker';
  box.innerHTML=`<h4>${title || L().finalsLandingTitle}</h4>
    <div class="stage-detail">${L().landingPickSeat(pickSeat, bots.length+1)} ${L().landingPickPrompt}</div>
    <div class="landing-split">
      <div>
        <div class="map-frame" style="position:relative;width:100%;aspect-ratio:${MAP_ASPECT[ACTIVE_LANDING_SET]||'1100/970'};border-radius:8px;background:#000;border:1px solid var(--line);overflow:hidden;margin-top:10px;">
          <img id="gameLandingMapImg" alt="Island map" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">
          <div id="gameLandingLayer" style="position:absolute;inset:0;"></div>
          ${ccChestToggleHTML()}
        </div>
        <div id="gameLandingInfo" style="margin-top:10px;min-height:20px;font-size:13px;"></div>
        <button id="gameLandingConfirm" class="go-btn" style="display:none;margin-top:8px;max-width:280px;" disabled>${L().landingConfirmBtn}</button>
      </div>
      <div id="gameLandingField"></div>
    </div>`;
  container.appendChild(box);
  // Плавно — только если человек не просил обойтись без анимаций: у него
  // самого prefers-reduced-motion включён, и «поехали красиво» там значит
  // «может не доехать вовсе».
  box.scrollIntoView({block:'start',
    behavior: (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ? 'auto' : 'smooth'});
  const fieldBox=box.querySelector('#gameLandingField');
  if(fieldBox){
    fieldBox.innerHTML=landingFieldHTML(you, bots);
    animateRows(fieldBox.querySelector('.lobby-wrap'), 12);
  }

  const mapImg=box.querySelector('#gameLandingMapImg');
  const pickerImg=document.querySelector('#landingMapWrap img');
  // Prefer the set's own art. Copying whatever the squad screen happened to be
  // showing breaks the moment that screen was skipped.
  if(mapImg) mapImg.src = MAP_ART[ACTIVE_LANDING_SET] || (pickerImg && pickerImg.src) || MAP_ART.m2;
  const layer=box.querySelector('#gameLandingLayer');
  const infoBox=box.querySelector('#gameLandingInfo');
  const confirmBtn=box.querySelector('#gameLandingConfirm');
  // Свои точки — только у карьеры: в драфте их негде было бы поставить. Их
  // три, и на карте видно каждую со своей аурой.
  const mine=(typeof CAREER_RUN!=='undefined' && CAREER_RUN)
    ? new Map(careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET)).map(x=>[x.zone, x.slot])) : null;

  const zoneEls=ALL_LANDING_ZONES.map(z=>{
    const all=zoneGroups.get(z);
    // Кто уже поставил метку, и кто только метит сюда. См. seatedNow выше.
    const group=seatedNow(all);
    const later=seatedLater(all);
    const occupied=!!(group && group.length);
    const plot=document.createElement('div');
    plot.className='land-zone'+(occupied?' taken contested':(later.length?' later':''));
    plot.style.left=z.x+'%'; plot.style.top=z.y+'%'; plot.style.width=z.w+'%'; plot.style.height=z.h+'%';
    // The occupied boxes carry the names, so they sit above the empty ones: a
    // column that outgrows its rectangle has to paint over its neighbour rather
    // than disappear behind it. Коробки хвоста очереди — посередине: их видно,
    // но занятые перекрывают их.
    plot.style.zIndex = occupied ? '40' : (later.length ? '30' : '20');
    if(occupied){
      // The reference drop map's own read: a box somebody is sitting in has a
      // black border and a dark wash, a box two squads picked is red. No glow on
      // either — the real map draws flat rectangles, and the halo was ours.
      if(group.length>=2){
        plot.style.borderColor='#ff3b3b';
        plot.style.background='rgba(255,59,59,.28)';
        plot.style.boxShadow='inset 0 0 0 1px rgba(0,0,0,.55)';
      } else {
        plot.style.borderColor='#0a0a0a';
        plot.style.background='rgba(0,0,0,.42)';
        plot.style.boxShadow='inset 0 0 0 1px rgba(255,255,255,.16)';
      }
      fillZoneNames(plot, group, z);
      plot.appendChild(zonePowLabel(z));
    } else if(later.length){
      /* Сюда метят те, кто садится после тебя. Место ещё свободно — коробка
         рисуется пунктиром без тёмной заливки, ники приглушены, очки на месте.
         Займёшь — они выберут заново, уже глядя на тебя (см. хвост функции). */
      plot.style.borderColor='rgba(180,200,255,.75)';
      plot.style.background='rgba(180,200,255,.06)';
      plot.style.boxShadow='inset 0 0 0 1px rgba(0,0,0,.35)';
      fillZoneNames(plot, later, z);
      plot.appendChild(zonePowLabel(z));
    } else {
      // Nobody drops here. The reference never draws an empty box at all, so
      // this one stays out of the way: the same black line, no wash, and the
      // island reading straight through it.
      plot.style.borderColor='rgba(10,10,10,.75)';
      plot.style.background='transparent';
      plot.style.boxShadow='inset 0 0 0 1px rgba(255,255,255,.10)';
      plot.appendChild(zonePowLabel(z));
    }
    // Свои точки видны на карте всегда — и когда пусты, и когда в них стоят
    // чужие. Бирюза здесь значит то же, что везде в карьере: это твоё.
    const slot=mine ? mine.get(z) : null;
    // Мифическая точка — сплошная золотая обводка (пунктир «не видно»); красный контест и свой дом важнее.
    if(z.mythic && !slot && !(group && group.length>=2)) plot.classList.add('zp-myth-box');
    if(slot){
      plot.style.borderColor='var(--accent)';
      plot.style.boxShadow='inset 0 0 0 1px rgba(0,0,0,.55), 0 0 0 2px rgba(0,208,168,.35)';
      const tag=document.createElement('div');
      tag.className='land-zone-label';
      tag.style.color='var(--accent)';
      tag.style.fontWeight='900';
      tag.textContent=L().ccSpotTag(slot.aura||0);
      plot.appendChild(tag);
    }
    ccChestBadge(plot, z);
    layer.appendChild(plot);
    return plot;
  });
  ccChestsApply();

  /* Полоса внизу — и на ней выход для того, кто не хочет выбирать. Ставится
     здесь, а не сразу после отрисовки карточки: кнопке «за меня» нужны уже
     построенные прямоугольники, чтобы кликнуть один из них.

     The scroll above is easy to miss if the player is mid-read of the standings
     above it, and the run just waits forever on a click nobody knows is pending
     — so keep a floating prompt up until the pick lands. */
  ensureLandingPrompt(box, ()=>{
    let best=0, score=-Infinity;
    ALL_LANDING_ZONES.forEach((z,i)=>{
      // Хвост очереди места не занимает — «за меня» считает так же, как видит
      // карта, иначе кнопка обходила бы коробки, которые на самом деле твои.
      const s=landingScore(you, z, seatedNow(zoneGroups.get(z)));
      if(s>score){ score=s; best=i; }
    });
    const el=zoneEls[best];
    if(el) el.click();
    if(confirmBtn && !confirmBtn.disabled) confirmBtn.click();
  });

  const chosenIdx=await waitForZoneConfirm(zoneEls, ALL_LANDING_ZONES, zoneGroups, infoBox, confirmBtn,
                                           seatedNow, seatedLater);
  removeLandingPrompt();
  const chosenZone=ALL_LANDING_ZONES[chosenIdx];
  box.remove();

  you.landingZone=chosenZone;
  applyLandingPow(you, chosenZone.points);
  if(!zoneGroups.has(chosenZone)) zoneGroups.set(chosenZone, []);
  zoneGroups.get(chosenZone).push(you);

  /* Те, кто в очереди после тебя, садятся после тебя. Очередь честная (по местам
     плей-ина, check-drop-queue), но раньше на превью сажали всех до твоего выбора,
     и хвост очереди разбирал остров раньше топ-1. Теперь превью остаётся, а после
     подтверждения хвост рассаживается заново тем же landingScore, уже зная, где ты.
     room приходит снаружи (careerLandingPick) и пересобирать её нельзя: в командной
     карьере она общая на двоих. */
  if(!room && behind.length){
    behind.forEach(t=>{
      const at=zoneGroups.get(t.landingZone);
      if(at){ const i=at.indexOf(t); if(i>=0) at.splice(i,1); if(!at.length) zoneGroups.delete(t.landingZone); }
    });
    careerSpotFearOn(you);
    buildBotLandingAssignment(behind, {into: zoneGroups});
    careerSpotFearOff();
  }
  /* Метку тут больше не ставят — её ставит ОТВЕТ, снаружи (ccLandingSpot).

     Правило прежнее: первая точка на острове ставится тем, что ты на неё сел.
     Изменилось, КТО это делает. Пикер открывает один из двоих, и метка —
     вместе с аурой, то есть силой — появлялась только у него; у напарника
     её не было. Мало того, careerSpotSet зовёт careerSave, а тот посреди
     вечера отправлял командное состояние напарнику, и у того срабатывал сброс
     мира прямо во время игры. Отчёт: «когда меняю локацию у
     другого игрока пишет The nights split at game 2». */

  // Комната села целиком ещё до показа карты — досаживать больше некого.
  return zoneGroups;
}

async function showRegularLandingPicker(){
  // Zone is picked once here, at the start of the tournament — the fight
  // with whoever shares your zone (or anyone else's) is then resolved fresh
  // every single game inside simulateGamesLive.
  const you=buildTeam(drafted);
  you.loadout=loadoutBonus(); you.pow+=you.loadout;
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;

  const usedHandles=new Set(drafted.map(hKey));
  const target=TEAM_TARGET[squadSize]||25;
  const teams=[you];
  let remaining=tournamentPool().filter(p=>!usedHandles.has(hKey(p)));
  while(teams.length<target && remaining.length>=squadSize){
    const {chunk, remaining:rest}=pickTeamChunk(remaining, squadSize);
    remaining=rest;
    const t=buildTeam(chunk); t.loadout=randomLoadoutBonus(chunk.length); t.pow+=t.loadout; t.name=teamLabel(chunk); teams.push(t);
  }
  const bots=teams.filter(t=>t!==you);
  const zoneGroups=await pickInitialZone(you, bots);
  return {teams, zoneGroups};
}

/* Комната в виде пикера: без тёзок и с тобой первым. Это перестройка состава на месте, не показ: боты с твоими
   никами выкидываются, ты встаёшь первым. Порядок массива решает исход симуляции.
   Если делать это только в showFinalsLandingPicker, в команде перестраивается комната того, кто открыл пикер,
   а у напарника нет, и вечера расходятся («nights split at game 2» при смене локации).
   Поэтому зовут оба (см. careerLandingPick), пикер только показывает. Повторный вызов безопасен. */
/* Дом на острове ставится ОТВЕТОМ, и одинаково у обоих.

   Правило то же, что было в пикере: если на этом острове дома ещё нет, а
   место под него есть, то коробка, на которую сели, им и становится. Клик по
   другой коробке потом — это вечер в гостях, а не переезд; переезд делается в
   хабе, где видно, чем он стоит.

   Вынесено из показа, потому что показ видит один, а последствия обязаны быть
   у обоих: метка даёт ауру, аура даёт силу, сила решает вечер. */
function ccLandingSpot(zone){
  if(typeof CAREER_RUN==='undefined' || !CAREER_RUN || !zone) return false;
  if(careerSpotOn(ccNightSpot(ACTIVE_LANDING_SET)) || !careerSpotRoom(ccNightSpot(ACTIVE_LANDING_SET))) return false;
  const at=careerSpotIndexOf(zone, ccNightSpot(ACTIVE_LANDING_SET));
  if(at<0) return false;
  return careerSpotSet(at, ccNightSpot(ACTIVE_LANDING_SET));
}
function ccLandingNormalize(finalTeams, you){
  const seenHandles=new Set(you.squad.map(p=>p.handle));
  const bots=finalTeams.filter(t=>t!==you).filter(t=>{
    const handles=t.squad.map(p=>p.handle);
    if(handles.some(h=>seenHandles.has(h))) return false;
    handles.forEach(h=>seenHandles.add(h));
    return true;
  });
  finalTeams.length=0; finalTeams.push(you, ...bots);
  return bots;
}
async function showFinalsLandingPicker(finalTeams, you, title, seat, room){
  // Dedupe roster, then pick a zone once — the fight itself is resolved
  // fresh every single Finals game inside simulateGamesLive.
  const bots=ccLandingNormalize(finalTeams, you);
  return await pickInitialZone(you, bots, title, seat, room);
}

async function offerSquadChoice(stageName, you, allTeams){
  const container=document.getElementById('majorStages');
  const box=document.createElement('div');
  box.className='stage-card fail';
  box.innerHTML=`<h4>${L().lcqPrompt(stageName)} <span class="stage-badge fail">${L().stageFailBadge}</span></h4>
    <div class="stage-detail" id="lcqIntro">${L().lcqIntroText}</div>
    <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
      <button class="go-btn" id="lcqSame" style="margin:0;width:auto;padding:10px 20px;">${L().lcqSameBtn}</button>
      <button class="restart-btn" id="lcqSwap" style="margin:0;">${L().lcqSwapBtn}</button>
    </div>`;
  container.appendChild(box);
  container.scrollIntoView && container.scrollIntoView({block:'end'});

  const choice=await waitForChoice(box.querySelector('#lcqSame'), box.querySelector('#lcqSwap'));
  box.querySelector('#lcqSame').remove();
  box.querySelector('#lcqSwap').remove();

  if(choice==='b'){
    const usedElsewhere=new Set();
    allTeams.forEach(t=>t.squad.forEach(p=>usedElsewhere.add(hKey(p))));

    // Step 1: pick which of the two players to replace
    box.querySelector('#lcqIntro').textContent=L().lcqWhoReplace;
    const playerBtns=you.squad.map(p=>{
      const b=document.createElement('button');
      b.className='rf-btn'; b.style.padding='8px 16px';
      b.innerHTML=`${flagFor(p)}${p.handle} (${p.rating})`;
      box.appendChild(b);
      return b;
    });
    const replaceIdx=await waitForAnyClick(playerBtns);
    const outgoing=you.squad[replaceIdx];
    playerBtns.forEach(b=>b.remove());

    // Step 2: pick a region to draw the replacement from — but only offer the
    // regions this mode's pool actually contains, and skip the question entirely
    // when there is only one (the card modes are Europe-only).
    const src=modePool();
    let availRegions=REGIONS.filter(r=>src.some(p=>p.region===r.code));
    // A squad stays within one region, so the replacement has to match the
    // teammate who is staying — no need to ask.
    if(CARD_MODE){
      const staying=you.squad.find(p=>hKey(p)!==hKey(outgoing));
      if(staying) availRegions=availRegions.filter(r=>r.code===staying.region);
    }
    let chosenRegion=null;
    if(availRegions.length>1){
      box.querySelector('#lcqIntro').textContent=L().lcqWhichRegion(outgoing.handle);
      const regionBtns=availRegions.map(r=>{
        const b=document.createElement('button');
        b.className='rf-btn'; b.style.padding='8px 16px';
        b.textContent=regionName(r.code);
        box.appendChild(b);
        return b;
      });
      const regionIdx=await waitForAnyClick(regionBtns);
      chosenRegion=availRegions[regionIdx].code;
      regionBtns.forEach(b=>b.remove());
    } else if(availRegions.length===1){
      chosenRegion=availRegions[0].code;
    }

    // Step 3: offer 5 candidates from that region, drawn from this mode's pool
    let pool=src.filter(p=>(chosenRegion==null || p.region===chosenRegion) && !usedElsewhere.has(hKey(p)) && hKey(p)!==hKey(outgoing));
    const picks=[];
    for(let i=0;i<5 && pool.length>0;i++){
      const idx=weightedPick(pool);
      picks.push(pool[idx]);
      pool=pool.filter(p=>hKey(p)!==hKey(picks[i]));
    }
    if(picks.length===0){
      box.querySelector('#lcqIntro').textContent=L().lcqNoCandidatesInRegion(outgoing.handle);
    } else {
      box.querySelector('#lcqIntro').textContent=L().lcqPickCandidate(outgoing.handle);
      const candBtns=picks.map(p=>{
        const b=document.createElement('button');
        b.className='rf-btn'; b.style.padding='8px 16px';
        b.innerHTML=`${flagFor(p)}${p.handle} (${p.rating})`;
        box.appendChild(b);
        return b;
      });
      const pickIdx=await waitForAnyClick(candBtns);
      const replacement=picks[pickIdx];
      candBtns.forEach(b=>b.remove());
      const newSquad=you.squad.map(p=> p.handle===outgoing.handle ? replacement : p);
      const rebuilt=buildTeam(newSquad);
      you.squad=rebuilt.squad; you.syn=rebuilt.syn; you.pow=rebuilt.pow+(you.loadout||0);
      you.name=L().yourTeamPrefix+teamLabel(newSquad);
      box.querySelector('#lcqIntro').innerHTML=L().lcqIntroSwapped(outgoing.handle, replacement.handle);
    }
  } else {
    box.querySelector('#lcqIntro').innerHTML=L().lcqIntroSame;
  }
}

// --- the real rosters behind the cards
//
// Every card set is built from rows that were real teams, and the card keeps a
// reference back to the row it came from. Two shapes, because the two eras were
// built years apart: the 2026 sets hang one property per stage off the card
// (_m2Playin, _n2Gf, and so on for all fourteen region-sets), while the 2025
// trio sets hang a single _t1/_t2/_t3 holding the stage the card is currently
// rated on, with _t1Stage saying which. Read by shape rather than by name, so a
// new set needs no change here.
function rosterEntriesOf(card){
  /* Roster keys are attached while the page loads and never change after it, so once loaded the answer per card is
     memoised (History and the pools walk every card of a region several times). Callers only read the result. */
  const memo=(typeof document!=='undefined' && document.readyState==='complete' && card && typeof card==='object')
    ? (rosterEntriesOf.m || (rosterEntriesOf.m=new WeakMap())) : null;
  if(memo){ const hit=memo.get(card); if(hit) return hit; }
  const out=[];
  for(const k in card){
    if(k.charCodeAt(0)!==95) continue;
    // Every roster key has a digit third (_m1Gf, _t1, _d1Final); skips _attrs, _eventOvr and the like before the regexes.
    const c2=k.charCodeAt(2); if(c2<48 || c2>57) continue;
    // FNCS spells its stages Playin / Lcq / Gf; the Reload Elite Series has
    // four of its own. Matched by name here rather than by set, so a card is
    // read the same way whichever circuit built it.
    /* Финалы недель дивизиона — до общего шаблона, потому что попадают под
       него дословно: ключ у них `_d1Final`, и `d1`+`Final` читается как финал
       Reload, самая глубокая стадия из всех. Разные турниры с одинаковым
       написанием. Своё имя стадии здесь — единственное место, где их можно
       отличить, и от него зависит и ранг, и вопрос «с кем он уже играет». */
    const divFinal=/^_d([1-4])Final$/.exec(k);
    if(divFinal){
      if(card[k] && card[k].duo) out.push({stage:'DivFinal', entry:card[k]});
      continue;
    }
    const modern=/^_([a-z]\d)(Playin|Lcq|Gf|Open|Heat[1-4]|Final)$/.exec(k);
    if(modern){
      if(card[k] && card[k].duo) out.push({stage:modern[2], entry:card[k]});
      continue;
    }
    if(/^_t[123]$/.test(k) && card[k] && card[k].entry && card[k].entry.duo)
      out.push({stage:REAL_STAGE_OF[card[k+'Stage']] || 'Playin', entry:card[k].entry});
  }
  if(memo) memo.set(card, out);
  return out;
}

// The letter a 2025 card stores its stage as, spelled out. Up here rather than
// inside rosterEntriesOf, which rebuilds it once per card on every call — and
// realTeamsFor calls it for every player in the pool.
const REAL_STAGE_OF={P:'Playin', L:'Lcq', G:'Gf'};

// Which showing of a team the list should print. A third of the field played
// more than one stage, and a team is one team however many times it appeared.
// The Reload Elite Series ladder sits on the same scale: its Final is the
// deepest showing a duo has, then a Heat, then the Play-In, then the Opens.
// Финал недели дивизиона стоит вровень с Плей-Ином, а не с грандом: вечер
// внутри сезона, и дуо, отыгравшее и его, и Мейджор, описывает Мейджор.
const REAL_STAGE_RANK={Gf:3, Lcq:2, Playin:1,
                       Final:3, Heat1:2, Heat2:2, Heat3:2, Heat4:2, Open:0,
                       DivFinal:1};

// Is there a single real roster this pool could field at this size? The cheap
// question behind "may this tile offer the realistic simulation at all" — it
// stops at the first whole roster instead of building, rating and sorting the
// list, and it reads the same data realTeamsFor does rather than a hardcoded
// list of tiles. Takes the size as an argument because it is asked before
// squadSize is set for the run.
function realTeamsExistFor(players, size){
  const have=new Set(players.map(p=>p.handle));
  for(const p of players){
    for(const {entry} of rosterEntriesOf(p)){
      if(entry.duo.length!==size) continue;
      if(entry.duo.every(h=>have.has(h))) return true;
    }
  }
  return false;
}

// Every real roster in the pool, once each, strongest cards first.
//
// Two ways a roster is held back, counted apart because they are not the same
// news. `droppedMissing` is a roster that is not wholly in the pool — a region
// or era filter left a member behind. `droppedSize` is a roster the mode cannot
// field at all: twenty-one rows across the 2025 sets carry fewer names than the
// mode plays. Both are counted rather than completed from elsewhere — a lobby
// of real teams with one invented member is the one thing a mode called
// realistic must not quietly serve — and `dropped` is their total, which is what
// the older callers ask for.
function realTeamsFor(players){
  const byHandle={};
  players.forEach(p=>{ byHandle[p.handle]=p; });
  const best=new Map();
  players.forEach(p=>{
    rosterEntriesOf(p).forEach(({stage, entry})=>{
      const key=entry.duo.slice().sort().join('|');
      const prev=best.get(key);
      if(prev && REAL_STAGE_RANK[stage] <= REAL_STAGE_RANK[prev.stage]) return;
      best.set(key, {handles:entry.duo.slice(), stage,
                     rank:entry.rank, pts:entry.pts, wins:entry.wins, matches:entry.matches});
    });
  });
  const teams=[];
  let droppedSize=0, droppedMissing=0;
  best.forEach(t=>{
    // A roster the mode cannot field is not a team — a trio row with one handle
    // on it. Without this the picker offers a one-man trio and lets somebody
    // take it into a trio Major.
    if(t.handles.length !== squadSize){ droppedSize++; return; }
    const cards=t.handles.map(h=>byHandle[h]).filter(Boolean);
    if(cards.length!==t.handles.length){ droppedMissing++; return; }
    const avg=cards.reduce((s,c)=>s+c.rating, 0)/cards.length;
    teams.push({...t, cards, avg});
  });
  teams.sort((a,b)=>b.avg-a.avg || a.rank-b.rank);
  return {teams, dropped:droppedSize+droppedMissing, droppedSize, droppedMissing};
}

// The lobby, in real rosters. Same shape as fillFieldTeams so the call sites
// differ by one word: takes the players still available, pushes teams onto
// `out`, returns whoever is left over.
//
// Short fields are filled the old way rather than left small — a half-empty
// lobby scores differently and would quietly change every placement — but the
// number filled is logged, because a realistic lobby padded with invented teams
// is a thing the player is entitled to know about.
function fillRealFieldTeams(remaining, needed, size, out){
  const {teams}=realTeamsFor(remaining);
  const taken=new Set();
  let placed=0;
  for(const t of teams){
    if(placed>=needed) break;
    if(t.handles.length!==size) continue;
    // Identity goes through hKey like every other "is this the same player"
    // check in the file. The roster spells the same person more than one way
    // across events, and the `rest` this hands to fillFieldTeams is compared
    // with hKey there — matching on the raw handle here let a player already
    // seated in a real team be drafted again into an assembled one.
    if(t.handles.some(h=>taken.has(hKey(h)))) continue;
    t.handles.forEach(h=>taken.add(hKey(h)));
    const team=buildTeam(t.cards);
    team.loadout=randomLoadoutBonus(t.cards.length); team.pow+=team.loadout;
    team.name=teamLabel(t.cards);
    out.push(team);
    placed++;
  }
  let rest=remaining.filter(p=>!taken.has(hKey(p)));
  if(placed<needed){
    console.log('[realistic] the field was ' + (needed-placed) + ' teams short of ' + needed +
                '; the rest are assembled from players without a whole real roster left');
    rest=fillFieldTeams(rest, needed-placed, size, out);
  }
  return rest;
}

// Fill a field of AI teams. In card mode the whole field must come from one
// region — each region runs its own tournament — and squads are drafted from
// packs instead of paired at random. Returns the players left over.
function fillFieldTeams(remaining, needed, size, out){
  if(CARD_MODE && cardRosterPlayers().length){
    const myRegion=ccHomeRegion();
    const same=remaining.filter(p=>p.region===myRegion);
    const src = same.length>=size*2 ? same : [];
    const res=draftBotSquads(src, needed, size);
    res.squads.forEach(sq=>{
      const t=buildTeam(sq); t.loadout=randomLoadoutBonus(sq.length); t.pow+=t.loadout;
      t.name=teamLabel(sq); out.push(t);
    });
    return res.rest;
  }
  let rem=remaining;
  for(let i=0; i<needed && rem.length>=size; i++){
    const {chunk, remaining:rest}=pickTeamChunk(rem, size);
    rem=rest;
    const t=buildTeam(chunk); t.loadout=randomLoadoutBonus(chunk.length); t.pow+=t.loadout;
    t.name=teamLabel(chunk); out.push(t);
  }
  return rem;
}

// Who actually plays the Last Chance Qualifier: every team that started the
// Major and is not one of the 45 already through to the Grand Finals off the
// Heats. That is the real rule — "open to all players in all 5 Divisions" —
// so the field is the tournament's own dropouts (Heats non-qualifiers plus
// anyone who never cleared Play-In), never a lobby of freshly drafted
// strangers and reserve bots.
function lastChanceField(allTeams, qualifiedSet){
  return allTeams.filter(t=>!qualifiedSet.has(t));
}

// Real structure: everyone dropped from Play-In OR Heats shares one Last
// Chance pool. Round 1 is 11 games and cuts to the top 50; the Last Chance
// Lobby that follows is up to 5 games, where each game's winner instantly
// locks a Major Finals slot and stops playing while everyone else who didn't
// win keeps going into the next game. Up to 5 teams qualify this way.
//
// `field` is the real dropout field from lastChanceField() and already
// contains `you`; `allTeams` is the whole Major field, used only so a squad
// swap can't hand you a player who is already someone else's teammate.
async function runLastChanceQualifier(stageName, you, allTeams, field, lclGames){
  // One game per qualifying slot. A win here is a qualification, so the two
  // numbers have to agree -- otherwise the stage hands out wins that do not
  // count, which reads as a bug rather than as history.
  lclGames = (lclGames==null) ? 5 : lclGames;
  if(lclGames<=0) return {advanced:false, winners:[], noSlots:true};
  await offerSquadChoice(stageName, you, allTeams);

  // Round 1: an 11-game cumulative-points stage (Epic's MatchCap for the LCQ
  // session) — VR 65 / 2nd 56 / 5th 44 / 25th 2, +1 per kill — across the full
  // field. What advances is one lobby's worth, because Round 2 is a single
  // lobby shooting it out: fifty duos, thirty-three trios, twenty-five squads.
  // That was written as a flat 50 and a player reported it — in trios the Last
  // Chance Lobby is 33 teams, and we were sending fifty of them into a
  // thirty-three seat room.
  const lclLobby=TEAM_TARGET[squadSize]||50;
  await simulateGamesLive(field, 11, lcqRound1PointsForPlace, 1, 'stage', 0, null, null, {lobbySize:lclLobby, stageName:L().liveLcq});
  const round1Ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const round1Place=round1Ranked.indexOf(you)+1;
  const advancedToLobby=round1Place<=lclLobby;

  const round1Shell=createStageCardShell(L().lcqRound1Title(field.length, lclLobby));
  await revealStageLog(you, round1Shell, true);
  finalizeStageCard(round1Shell, round1Place, field.length, you.stagePts, advancedToLobby, false, advancedToLobby?L().lcqTopLabel(lclLobby):L().lcqRound1FailedNote(lclLobby));
  await revealStandings(round1Shell, round1Ranked, you, Math.min(lclLobby, round1Ranked.length));

  if(!advancedToLobby){
    return {advanced:false, winners:[]};
  }

  // Round 2: the Round 1 survivors, five games, scored on the same threshold
  // table as the Heats — Victory Royale +944, top 2-5 +4 each, top 6-25 +2
  // each — but eliminations are worth nothing here, so the only thing that
  // really matters is winning a game. A win qualifies you outright and ends
  // your stage, which is why five games produce five qualifiers.
  const round2Field=round1Ranked.slice(0, 50);
  /* Метка и здесь. Раунд 2 — это одно лобби на карте, где победа в игре сразу
     уводит в финал, а зон ему передавали null: живой матч шёл, а метку ставить
     было негде, и каждый падал в прямоугольник по индексу. Слово: «и во всех финалах метку можно поставить по такому же принципу».

     Очередь — таблица первого раунда: round2Field и есть round1Ranked, срезанный
     по размеру лобби, так что порядок массива уже правильный. */
  // В драфте LCQ — ранний этап, одной таблицей; карта — на хитах и финале (его слово 29.09).
  const lcqEarly=!CAREER_RUN;
  const lcqZones=lcqEarly ? null : await stageLandingPicker(round2Field, you, L().lcqLandingTitle);
  await simulateGamesLive(round2Field, lclGames, heatsScoreForPlace, 0, 'stage', 0, null, lcqZones,
    {stopOnWin:true, mapReplay:!lcqEarly, choices:!lcqEarly, stageName:L().liveLcqR2});
  const winners=round2Field.filter(t=>t.gotVR);
  const youAdvanced=winners.includes(you);

  const r2Ranked=round2Field.slice().sort(heatsRank);
  const round2Shell=createStageCardShell(L().lcqRound2Title(round2Field.length, lclGames));
  await revealStageLog(you, round2Shell, true);
  finalizeStageCard(round2Shell, r2Ranked.indexOf(you)+1, round2Field.length, you.stagePts,
    youAdvanced, youAdvanced, youAdvanced?L().lcqAdvancedNote:L().lcqFailedNote(lclGames));
  await revealStandings(round2Shell, r2Ranked, you, 0, null, new Set(winners));

  if(youAdvanced) await celebrate(L().celKicker, L().celLcqTitle, L().celLcqSub, 'blue', 40);
  return {advanced:youAdvanced, winners};
}

// Quiet version of the same LCQ process (no UI/log), used to fill the other LCQ slots
// when "you" already qualified directly through Heats. Takes the same real
// dropout field the interactive version plays — teams already holding a Finals
// slot are filtered out by the caller, so nobody can win a slot twice.
async function computeQuietLCQWinners(field, lclGames){
  lclGames = (lclGames==null) ? 5 : lclGames;
  if(lclGames<=0) return [];
  if(!field || field.length<2) return [];
  // Same Round 1 as the interactive version: 11 games in reshuffled lobbies of
  // up to 50, cumulative points, top 50 survive to compete for slots. It has to
  // be the same lobby split, or the off-screen qualifier would score its teams
  // on a different curve than the one the player just watched.
  await simulateGamesRandomLobbies(field, 11, TEAM_TARGET[squadSize]||50, lcqRound1PointsForPlace, 1);
  let pool=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims).slice(0,50);
  const winners=[];
  for(let g=1; g<=lclGames && pool.length>0; g++){
    const lobby=pool.slice().sort(()=>Math.random()-0.5).slice(0,50);
    const order=simulateGame(lobby);
    const winner=order[0];
    winners.push(winner);
    pool=pool.filter(t=>t!==winner);
  }
  return winners;
}

async function runMajorTournament(){
  // 2024-й играется своим кругом: квалификатор → серия → две сетки → финал. См. runMajor2024Tournament.
  if(/^f\d$/.test(String(CARD_SET||''))) return runMajor2024Tournament();
  // 2019–2023: свой формат, очки Epic и призы своего сезона. См. runPastDraftTournament.
  if(CARD_MODE && typeof PAST_DRAFT!=='undefined' && PAST_DRAFT[CARD_SET]) return runPastDraftTournament();
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
  show('screen-results');
  ensureSkipButton();

  const teams=buildFullLobby();
  const you=teams.find(t=>t.isYou);

  // Unlimited teams overall in Play-In, but each match lobby caps at 50 duos — reshuffled every game.
  // In card mode the field is already the 150 Major qualifiers, so this stage is a short seeding
  // round that sets the heat draw (and fills every card's stat sheet) rather than a mass cut.
  // Play-In is 22 games across reshuffled lobbies — watching that live is a
  // long sit for a stage that mostly just seeds the Heats, so it resolves
  // straight to the standings card instead.
  // The lobby is the mode's, not the game mode's: Battle Royale seats fifty and
  // Reload seats twenty, and a stage played in the wrong-sized lobby scores
  // every placement wrong.
  const PLAYIN_FMT=currentMajorFormat(you);
  await simulateGamesRandomLobbies(teams, PLAYIN_FMT.playInGames||22,
    PLAYIN_FMT.lobby || TEAM_TARGET[squadSize] || 50, playInPointsForPlace, 2);

  teams.sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const isFillerTeam=t=>t.squad.some(p=>p.tier==='filler');
  const realAdvancers=teams.filter(t=>!isFillerTeam(t));
  const cutPool = CARD_MODE ? teams : realAdvancers;
  const FMT=currentMajorFormat(you);
  // 2026 sets carry no lcqWinners, so for them this is just the Lobby game count.
  const lcqSlots=(FMT.lcqWinners==null) ? FMT.lclGames : FMT.lcqWinners;
  const playInCut=Math.min(FMT.playInCut, cutPool.length);
  const youPlayInRank=teams.indexOf(you)+1;
  const advancedPlayIn=cutPool.slice(0,playInCut);
  const passedPlayIn=advancedPlayIn.includes(you);

  beginAnimatedStage();
  const shell1=createStageCardShell(L().stage1Title);
  await revealStageLog(you, shell1, true);
  finalizeStageCard(shell1, youPlayInRank, teams.length, you.stagePts, passedPlayIn, false, L().stage1Note(FMT.playInCut));
  await revealStandings(shell1, teams, you, playInCut);

  let cameFromLcq=false;
  let lcqOtherWinners=[];
  let heatQualifiers45=[];
  // The Last Chance field is the Major's own dropouts, so it can only be built
  // once the Heats have decided who is already through — that is true even in
  // the branch where you never reached the Heats yourself.
  let lcqField=null;

  // A circuit with no last chance ends here for anyone the Play-In cut. FNCS
  // hands its dropouts a Lobby; the Reload Elite Series does not, and inventing
  // one would be inventing a stage the cup never played.
  if(!passedPlayIn && FMT.noLcq){
    document.getElementById('finalSub').textContent=L().stage1Note(FMT.playInCut);
    finishMajorEliminatedAnim(you);
    return;
  }

  if(!passedPlayIn){
    ensureSkipButton();
    // The heats have to run first now: everyone they don't send through is a
    // Last Chance entrant, and you can't fill the lobby before you know who
    // that is.
    const heats=seedHeats(advancedPlayIn, FMT.heats.length);
    heats.forEach((heatTeams,hi)=>{ (FMT.winAdvances===false ? simulateGames : simulateGamesStopOnWin)(heatTeams, FMT.heats[hi].games, heatsScoreForPlace, 3); });
    /* Очередь квалификации в финал: кто прошёл раньше, тот стоит раньше.

       Хиты играются одновременно, поэтому первые из каждого хита прошли в один
       и тот же момент — их и ставим рядом, а не тремя блоками подряд по номеру
       хита. Дальше в массив ляжет Ласт Ченс, который и играется последним:
       оттуда выходят позже всех, там же и хвост очереди. Внутри хита порядок
       задаёт heatQualifiers — победители игры первыми, остальные по очкам. */
    const perHeat=heats.map((heatTeams,hi)=>[...heatQualifiers(heatTeams, FMT.heats[hi].cut, FMT.winAdvances)]);
    const deepest=perHeat.reduce((m,h)=>Math.max(m,h.length), 0);
    for(let at=0; at<deepest; at++)
      perHeat.forEach(h=>{ if(h[at]) heatQualifiers45.push(h[at]); });
    lcqField=lastChanceField(teams, new Set(heatQualifiers45));
    const lcqResult=await runLastChanceQualifier('Play-In', you, teams, lcqField, lcqSlots);
    if(!lcqResult.advanced){
      document.getElementById('finalSub').textContent=L().notPassedPlayInLCQ;
      finishMajorEliminatedAnim(you);
      return;
    }
    cameFromLcq=true;
    lcqOtherWinners=lcqResult.winners.filter(t=>t!==you);
  } else {
    const heats=seedHeats(advancedPlayIn, FMT.heats.length);
    const yourHeatIdx = heats.findIndex(h=>h.includes(you));
    const yourHeat = heats[yourHeatIdx];
    // Your Heat is your own lobby and it plays on the map, so the drop is a
    // decision here the same way it is in the Finals. It used to run without a
    // pick: every squad fell back to a grid rectangle chosen off its index, so
    // the one stage where a Victory Royale ends your night early was also the
    // one where you had no say in where it started. Only your own Heat asks —
    // the others are resolved headless and never reach the map.
    /* Очередь на метку в хите — очередь плей-ина. Массив хита уже идёт в том
       порядке, в каком змейка (seedHeats) разложила отсортированный плей-ин,
       поэтому жетоны по массиву и есть «кто прошёл выше, тот ставит раньше».
       Раньше очередь читалась косвенно, через очки плей-ина; жетон делает её
       явной и переживает любую пересборку поля. */
    const heatZones=await stageLandingPicker(yourHeat, you, L().heatsLandingTitle);
    for(let hi=0; hi<heats.length; hi++){
      const g=FMT.heats[hi].games;
      const stopOnWin=FMT.winAdvances!==false;
      if(hi===yourHeatIdx) await simulateGamesLive(heats[hi], g, heatsScoreForPlace, 3, 'stage', 0, null, heatZones, {stopOnWin:stopOnWin, mapReplay:true, choices:true, stageName:L().liveHeat(yourHeatIdx+1)});
      else if(stopOnWin) simulateGamesStopOnWin(heats[hi], g, heatsScoreForPlace, 3);
      else simulateGames(heats[hi], g, heatsScoreForPlace, 3);
    }
    yourHeat.sort(heatsRank);
    const heatsCut=FMT.heats[yourHeatIdx].cut;
    const youHeatRank=yourHeat.indexOf(you)+1;
    const qualifiedSet=heatQualifiers(yourHeat, heatsCut, FMT.winAdvances);
    const passedHeats=qualifiedSet.has(you);

    const shell2=createStageCardShell(L().stage2Title(yourHeatIdx+1, FMT.heats[yourHeatIdx].games));
    await revealStageLog(you, shell2, true);
    const heatByVR = you.gotVR && winIsATicket();
    finalizeStageCard(shell2, youHeatRank, yourHeat.length, you.stagePts, passedHeats, heatByVR,
      (passedHeats && !heatByVR) ? L().stage2NoteByPoints(heatsCut) : '');
    await revealStandings(shell2, yourHeat, you, 0, null, qualifiedSet);
    if(passedHeats) await celebrate(L().celKicker, L().celFinalsTitle, L().celFinalsSub, 'green', 40);

    /* Очередь квалификации в финал: кто прошёл раньше, тот стоит раньше.

       Хиты играются одновременно, поэтому первые из каждого хита прошли в один
       и тот же момент — их и ставим рядом, а не тремя блоками подряд по номеру
       хита. Дальше в массив ляжет Ласт Ченс, который и играется последним:
       оттуда выходят позже всех, там же и хвост очереди. Внутри хита порядок
       задаёт heatQualifiers — победители игры первыми, остальные по очкам. */
    const perHeat=heats.map((heatTeams,hi)=>[...heatQualifiers(heatTeams, FMT.heats[hi].cut, FMT.winAdvances)]);
    const deepest=perHeat.reduce((m,h)=>Math.max(m,h.length), 0);
    for(let at=0; at<deepest; at++)
      perHeat.forEach(h=>{ if(h[at]) heatQualifiers45.push(h[at]); });

    if(!passedHeats){
      ensureSkipButton();
      lcqField=lastChanceField(teams, new Set(heatQualifiers45));
      const lcqResult=await runLastChanceQualifier('Heat '+(yourHeatIdx+1), you, teams, lcqField, lcqSlots);
      if(!lcqResult.advanced){
        document.getElementById('finalSub').textContent=L().notPassedHeatsLCQ;
        finishMajorEliminatedAnim(you);
        return;
      }
      cameFromLcq=true;
      lcqOtherWinners=lcqResult.winners.filter(t=>t!==you);
    }
  }

  // Major Finals field: exactly 45 heat qualifiers + 5 LCQ winners = 50 teams, no reserves.
  /* Прошедших хиты может быть больше сорока пяти: победа в игре — билет сверх
     отсечки (см. heatQualifiers), и выигравший вне топа садится рядом с ним.
     Зал всё равно на пятьдесят, поэтому лишние снимаются с конца — они и
     стоят последними, за прошедшими по очкам. */
  const GF_SEATS=50;
  let finalTeams=heatQualifiers45.slice(0, GF_SEATS-lcqSlots);
  if(cameFromLcq){
    if(!finalTeams.includes(you)) finalTeams.push(you);
    lcqOtherWinners.forEach(t=>{ if(!finalTeams.includes(t)) finalTeams.push(t); });
    const stillNeeded=lcqSlots-1-lcqOtherWinners.length;
    if(stillNeeded>0){
      // Same Last Chance field, minus everyone who already holds a slot.
      const extra=await computeQuietLCQWinners(lastChanceField(lcqField, new Set(finalTeams)), lcqSlots);
      extra.forEach(t=>{ if(finalTeams.length<GF_SEATS && !finalTeams.includes(t)) finalTeams.push(t); });
    }
  } else {
    // You went straight through the Heats, so the Last Chance still runs — just
    // off-screen — among the teams the Heats left behind.
    const lcqWinners=await computeQuietLCQWinners(lastChanceField(teams, new Set(heatQualifiers45)), lcqSlots);
    lcqWinners.forEach(t=>{ if(finalTeams.length<GF_SEATS && !finalTeams.includes(t)) finalTeams.push(t); });
  }

  // finalTeams собран в порядке квалификации — хиты, потом Ласт Ченс, — и это
  // тот порядок, в котором ставят метку. См. stampQualSeats.
  const zoneGroups=await stageLandingPicker(finalTeams, you, L().finalsLandingTitle);
  await simulateGamesLive(finalTeams, (FMT.gfGames||12), pointsForPlace, (FMT.gfKill||4), 'stage', 0, null, zoneGroups, {twoDay:true, mapReplay:true, choices:true, stageName:L().liveRegionalFinals, prize:CARD_MODE ? ccHomeRegion() : null});
  // Landing zone + fight now happen fresh before every one of the 12 games
  // (see pickZoneForGame, called from inside simulateGamesLive) instead of
  // once before the whole stage — so the bonus/penalty is already folded
  // into each game's own score line, with nothing to add on afterward.
  // The leader-gap cap and squad kill dampening are both applied inline,
  // game by game, inside simulateGamesLive — so the live leaderboard the
  // player watched already shows the real final numbers, no retroactive
  // adjustment here.
  finalTeams.sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const youFinalRank=finalTeams.indexOf(you)+1;

  // The live leaderboard removes itself when the stage ends, so the Grand
  // Finals used to leave no trace between the Heats card and whatever came
  // next. Give it a standings card of its own, like every other stage.
  const gfShell=createStageCardShell(L().majorFinalsStageTitle(finalTeams.length));
  await revealStageLog(you, gfShell, true);
  const myGfRegion=ccHomeRegion();
  const gfSlots = !CARD_MODE ? 0
    : CARD_SET==='m1' ? (SUMMIT_SLOTS[myGfRegion]||0)
    : CARD_SET==='m2' ? (MAJOR2_GC_SLOTS[myGfRegion]||0)
    // Major 3 is the last road to Lyon, and section 6 of the 2025 rules says how
    // many seats each region carries down it.
    : CARD_SET==='t3' ? (GC2025_M3_SEATS[myGfRegion]||0) : 0;
  // A team that already holds a seat at the LAN cannot win a second one: it keeps
  // the place it finished and the money that pays, and the seat passes down to
  // the next team in the region without one. That is the rule the Last Chance
  // already followed and the Grand Finals did not — so a Summit duo finishing
  // fourth in Major 2 was silently eating one of Europe's nine Antwerp seats,
  // and the duo that should have inherited it stayed home.
  const gfSeats = gfSlots ? awardSeats(finalTeams, gfSlots, holdsLanSeat) : [];
  const gfSeatSet = new Set(gfSeats);
  const gfSeatCut = gfSeats.length ? finalTeams.indexOf(gfSeats[gfSeats.length-1])+1 : gfSlots;
  // A seat you already hold is a seat. Pick one of the duos that took the Summit
  // and you are on the plane before the Major starts — the season decides your
  // placement, your prize money and your pride, and not whether you are going.
  // awardSeats skips you for the same reason it skips them, so your finish rolls
  // the region's seat down to the next team without one instead of eating it.
  const youHoldSeat = holdsLanSeat(you);
  const youQualified = youHoldSeat || (gfSlots ? gfSeatSet.has(you) : youFinalRank===1);
  // What the whole Major was for, written down so the summary card can say it.
  if(gfSlots){
    recordLanSeat(
      CARD_SET==='m2' ? L().lanBelgium : CARD_SET==='t3' ? L().lanLyon : L().lanSummit,
      youQualified,
      youHoldSeat ? L().lanSeatHeld(youFinalRank)
                  : L().lanSeatDetail(youFinalRank, gfSlots, regionName(myGfRegion)));
  }
  finalizeStageCard(gfShell, youFinalRank, finalTeams.length, you.stagePts,
    youQualified, you.gotVR,
    gfSlots ? (CARD_SET==='m2' ? L().major2GcSlotNote(gfSlots)
             : CARD_SET==='t3' ? L().major3GcSlotNote(gfSlots)
             : L().majorFinalsSlotNote(gfSlots)) : '');
  const gfPrize = CARD_MODE ? ccHomeRegion() : null;
  await revealStandings(gfShell, finalTeams, you, gfSlots ? gfSeatCut : 0, null,
    gfSlots ? gfSeatSet : null, gfPrize,
    (gfSlots && gfSeatCut>gfSlots) ? L().gcSeatCutRolled(gfSlots, gfSeatCut) : null);
  if(gfPrize) lobbyPrizeTable=gfPrize;
  removeSkipButton();

  // Card-mode Major 1 continues into the Düsseldorf LAN for anyone who placed
  // inside their region's Summit allocation.
  let summit=null;
  lastSummit=null;
  if(CARD_MODE && CARD_SET==='m1'){
    summit=await runMajor1Summit(you, youFinalRank, finalTeams);
  }
  let worlds=null;
  // Earnings card: what the regional final paid, plus the Summit if you made it.
  // Every card set pays here, not just the two 2026 ones — the trio Majors have
  // their own tables and used to run a whole season for nothing.
  if(CARD_MODE){
    const myReg=ccHomeRegion();
    const lines=[];
    const regional=prizeFor(myReg, youFinalRank);
    if(regional) lines.push({label:L().prizeRegional(regionName(myReg), youFinalRank), amount:regional});
    const summitPrize = summit ? prizeFor('SUMMIT', summit.rank) : 0;
    if(summitPrize) lines.push({label:L().prizeSummit(summit.rank), amount:summitPrize});
    lines.forEach(l=>recordEarning(l.label, l.amount));
    const total=lines.reduce((s,l)=>s+l.amount,0);
    if(total>0){
      renderPrizeCard(lines, total);
      if(!skipAnimation) await sleep(900);
    }
  }

  // Card-mode Major 2 continues into the Antwerp LAN for anyone who finished
  // inside their region's Global Championship allocation — run after the
  // regional payout card, so the earnings for the Major itself are shown first.
  if(CARD_MODE && CARD_SET==='m2' && gfSlots){
    // The Last Chance Major runs for the whole region right after the Grand
    // Finals — it is a real event on the calendar, not something that only
    // exists when you personally missed out. So it plays either way, and only
    // then does anyone fly to Antwerp.
    const directlyIn=youQualified;
    // The duos that really took the region's seats, not the top N of the table —
    // the two are different the moment a seat rolls past somebody already going.
    const seatHandles=[];
    gfSeats.forEach(t=>(t.squad||[]).forEach(p=>seatHandles.push(p.handle)));
    const lc=await runGcLastChance(you, myGfRegion, {alreadyQualified:directlyIn, seatHandles});
    if(directlyIn){
      worlds=await runGlobalChampionship(you, youFinalRank, myGfRegion, lc.qualifiers, finalTeams);
    } else if(lc.advanced){
      worlds=await runGlobalChampionship(you, lc.rank, myGfRegion, lc.qualifiers);
    }
  }

  // Major 3 2025 ends the season in Lyon. There is no Last Chance route into it —
  // the 2025 rules fill all 33 seats off the three Majors' Finals Leaderboards —
  // so the regional final is the only door.
  let worlds2025=null;
  if(CARD_MODE && CARD_SET==='t3' && gfSlots && youQualified){
    worlds2025=await runGlobalChampionship2025(you, youFinalRank, myGfRegion, finalTeams);
  }

  if(worlds2025){
    // Lyon pays 33 places out of $2,001,000, so unlike Antwerp there is a real
    // number to put on the board the moment the LAN ends.
    const lyonPrize=prizeFor('GC2025', worlds2025.rank);
    if(lyonPrize>0){
      const line=[{label:L().prizeGc2025(worlds2025.rank), amount:lyonPrize}];
      recordEarning(line[0].label, lyonPrize);
      renderPrizeCard(line, lyonPrize);
      if(!skipAnimation) await sleep(900);
    }
    renderRunSummaryCard();
    finalTeams=worlds2025.ranked;
    finalTeams.forEach(t=>{ t.totalPts=t.stagePts; t.totalElims=t.stageElims; });
    you.gameLog=you.stageLog;
    lobbyPrizeTable='GC2025';
    document.getElementById('finalBanner').style.display='block';
    document.getElementById('finalPlace').textContent='#'+worlds2025.rank;
    document.getElementById('finalSub').textContent = worlds2025.champion
      ? L().gc2025Champion : L().gc2025PlaceNote(worlds2025.rank);
    document.getElementById('lobbyTitle').innerHTML=L().gc2025ResultTitle(worlds2025.total);
    document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});
    renderLobby(finalTeams, you);
    renderGameHistory(you);
    renderStats();
    finalizeRunStats(squadSize, true, worlds2025.rank, worlds2025.total, worlds2025.champion,
                     cameFromLcq, true, you, finalTeams);
    showShareButton(you, worlds2025.rank, worlds2025.total, true, finalTeams);
    return;
  }

  if(worlds){
    renderRunSummaryCard();
    // A LAN is not paid on the table of the region you flew out of. The lobby
    // kept the regional table it was given at the Grand Finals, so a player from
    // Asia read the world final's placements against Asia's regional money.
    // Antwerp shows a split the day GC2026_PRIZES has one, and shows none until
    // then — the same run, the same code, waiting on numbers rather than on work.
    const antwerpPrize=prizeFor('GC2026', worlds.rank);
    if(antwerpPrize>0){
      recordEarning(L().prizeGc2026(worlds.rank), antwerpPrize);
      renderPrizeCard([{label:L().prizeGc2026(worlds.rank), amount:antwerpPrize}], antwerpPrize);
      if(!skipAnimation) await sleep(900);
      renderRunSummaryCard();
    }
    lobbyPrizeTable = antwerpPrize>0 ? 'GC2026' : null;
    finalTeams=worlds.ranked;
    finalTeams.forEach(t=>{ t.totalPts=t.stagePts; t.totalElims=t.stageElims; });
    you.gameLog=you.stageLog;
    document.getElementById('finalBanner').style.display='block';
    document.getElementById('finalPlace').textContent='#'+worlds.rank;
    document.getElementById('finalSub').textContent = worlds.champion
      ? L().gcChampion : L().gcPlaceNote(worlds.rank);
    document.getElementById('lobbyTitle').innerHTML=L().gcResultTitle(worlds.total);
    document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});
    renderLobby(finalTeams, you);
    renderGameHistory(you);
    renderStats();
    finalizeRunStats(squadSize, true, worlds.rank, worlds.total, worlds.champion, cameFromLcq, true, you, finalTeams);
    showShareButton(you, worlds.rank, worlds.total, true, finalTeams);
    return;
  }

  if(summit){
    renderRunSummaryCard();
    lastSummit=summit;
    lobbyPrizeTable='SUMMIT';
    finalTeams=summit.ranked;
    finalTeams.forEach(t=>{ t.totalPts=t.stagePts; t.totalElims=t.stageElims; });
    you.gameLog=you.stageLog;
    document.getElementById('finalBanner').style.display='block';
    document.getElementById('finalPlace').textContent='#'+summit.rank;
    document.getElementById('finalSub').textContent = summit.eliminated
      ? L().summitEliminatedSub(summit.stage)
      : (summit.champion ? L().summitChampion : L().placeInFinals(summit.rank, summit.total));
    document.getElementById('lobbyTitle').innerHTML=L().summitResultTitle(summit.total);
    document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});
    renderLobby(finalTeams, you);
    renderGameHistory(you);
    renderStats();
    finalizeRunStats(squadSize, true, summit.rank, summit.total, summit.champion, cameFromLcq, true, you, finalTeams);
    showShareButton(you, summit.rank, summit.total, true, finalTeams);
    return;
  }

  renderRunSummaryCard();
  document.getElementById('finalBanner').style.display='block';
  document.getElementById('finalPlace').textContent='#'+youFinalRank;
  document.getElementById('finalSub').textContent = youFinalRank===1 ? L().championMajor : L().placeInFinals(youFinalRank, finalTeams.length);
  document.getElementById('lobbyTitle').innerHTML=L().majorFinalsResultTitle(finalTeams.length);
  document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});

  finalTeams.forEach(t=>{ t.totalPts=t.stagePts; t.totalElims=t.stageElims; });
  you.totalPts=you.stagePts; you.totalElims=you.stageElims; you.gameLog=you.stageLog;

  renderLobby(finalTeams, you);
  renderGameHistory(you);
  renderStats();
  finalizeRunStats(squadSize, true, youFinalRank, finalTeams.length, youFinalRank===1, cameFromLcq, true, you, finalTeams);
  showShareButton(you, youFinalRank, finalTeams.length, true, finalTeams);
}


// ---------- FNCS 2024 в режиме драфта: свой круг, не машина хитов ----------
/* Мейджор 2024 в драфте: квалификатор раундами, серия, две сетки, финал на 50 дуо. Карьера играет его по дням (runCareerMajor2024, CC_M24).
   Поле драфта 150 дуо региона (CARD_FIELD), отсечки масштабированы под него, как playInSeats для 2026:
     раунд 1 (открытый)  150 → 100   10 игр, лобби по 50, элим ×2
     раунд 2 (серия)     100         10 игр → верхняя 40 / нижняя 60
     верхняя сетка       40 → 28     5 игр (VR билет, до 4), 5 игр (VR, до 4), 3 игры → до 28
     нижняя сетка        60 → 22     10 игр → 40, 6 игр → 30, 3 игры → 22
     финал               50          12 игр, элим ×4
   Реальные числа в CC_M24, доля верхней сетки в финале та же (70%), это модель. Деньги CC_MAJOR_PAY_2024 (на игрока, дуо ×2), места GC2024_M{1,2,3}_SEATS. */
const DRAFT_M24={
  r1:{games:10, kill:2, cut:100},
  r2:{games:10, kill:2},
  upperSize:40, upperSeats:28, vrPerDay:4,
  upper:[{games:5, kill:4, vr:true}, {games:5, kill:4, vr:true}, {games:3, kill:4}],
  lower:[{games:10, kill:2, cut:40}, {games:6, kill:3, cut:30}, {games:3, kill:4, cut:22}],
  final:{games:12, kill:4, field:50}
};
// Функцией, не таблицей: GC2024_M*_SEATS объявлены ниже по файлу (const — мёртвая зона при загрузке).
function gc2024SeatsOf(set){ return ({f1:GC2024_M1_SEATS, f2:GC2024_M2_SEATS, f3:GC2024_M3_SEATS})[set]||{}; }
let LAST_GC24_SEAT=false;   // своё место в Форт-Уэрт, взятое на этом круге (режим «весь год»)
function major24Num(){ return +String(CARD_SET||'').replace(/\D/g, '')||1; }
// Таблица выплат 2024-го — на дуо, местами 1..50, из строк «место ≤ N → на игрока».
function pay24DraftTable(region){
  let r=region; if(r==='NAW') r='NAC';
  const rows=CC_MAJOR_PAY_2024[r]||CC_MAJOR_PAY_2024.EU; const out={};
  for(let p=1;p<=50;p++){ const row=rows.find(x=>p<=x[0]); out[String(p)]=row ? row[1]*2 : 0; }
  return out;
}
function rank24(teams){ return teams.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims); }
function reset24(teams){ teams.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; t.stageLog=[]; t.gotVR=false; }); }
// Регион пары по её карточкам 2024-го — для списков Форт-Уэрта (семь регионов вперемешку).
function gc2024RegionOf(duo){
  const cnt={};
  (duo||[]).forEach(h=>{ const c=gcFindCard(h, null, 0, 2024); const r=c && c.region; if(r) cnt[r]=(cnt[r]||0)+1; });
  return Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||'EU';
}
function gc2024BuildTeam(duo, route, rating){
  const reg=gc2024RegionOf(duo);
  const squad=duo.map(h=>gcFindCard(h, reg, rating, 2024));
  const t=buildTeam(squad);
  t.loadout=randomLoadoutBonus(squad.length); t.pow+=t.loadout;
  t.name=teamLabel(squad);
  t.gcRoute=route; t.summitRegion=reg;
  return t;
}
/* Форт-Уэрт в драфте: настоящие дуо по дорогам (Liquipedia), твоё место вытесняет одно из
   них, дуо с твоим человеком не летит; недобор — верх твоего регионального финала. */
function buildGc2024DraftField(you, regionalFinal){
  const field=[], seated=new Set();
  (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const want=DRAFT_M24.final.field-1;
  const seat=(duos, route, rating)=>duos.forEach(d=>{
    if(field.length>=want) return;
    if(d.some(h=>seated.has(_gcNorm(h)))) return;
    const t=gc2024BuildTeam(d, route, rating);
    const keys=(t.squad||[]).map(c=>_gcNorm(c.handle));
    if(keys.some(k=>seated.has(k))) return;
    d.forEach(h=>seated.add(_gcNorm(h))); keys.forEach(k=>seated.add(k));
    field.push(t);
  });
  seat(GC2024_M1_DUOS, 'm1', 90);
  seat(GC2024_M2_DUOS, 'm2', 88);
  seat(GC2024_M3_DUOS, 'm3', 86);
  (regionalFinal||[]).forEach(t=>{
    if(field.length>=want || t===you) return;
    const keys=(t.squad||[]).map(c=>_gcNorm(c.handle));
    if(keys.some(k=>seated.has(k))) return;
    keys.forEach(k=>seated.add(k));
    t.gcRoute='m3'; field.push(t);
  });
  you.gcRoute='m'+major24Num();
  field.push(you);
  return field;
}
async function runGlobalChampionship2024(you, regionRank, region, regionalFinal){
  const container=document.getElementById('majorStages');
  const intro=document.createElement('div');
  intro.className='stage-card';
  intro.innerHTML='<h4>'+L().gc2024QualifiedTitle+'</h4><div class="stage-detail">'+
    L().gc2024QualifiedNote(regionName(region), regionRank, gc2024SeatsOf(CARD_SET)[region]||0)+'</div>';
  container.appendChild(intro);
  intro.scrollIntoView({block:'center', behavior:'smooth'});
  await celebrate(L().celKicker, L().celFtwTitle, L().celFtwSub, 'gold', 70, 'us');
  ensureSkipButton();
  // Остров Форт-Уэрта — сезон 4 главы 5; после ЛАНа круг возвращает свой.
  const wasSet=CARD_SET;
  useLandingSet('f4');
  const field=buildGc2024DraftField(you, regionalFinal);
  reset24(field);
  renderGc2025FieldCard(field, L().gc2024FieldTitle, L().gc2024FieldNote);
  if(!skipAnimation) await sleep(900);
  const zones=await showFinalsLandingPicker(field, you);
  const shell=createStageCardShell(L().gc2024StageTitle(DRAFT_M24.final.games));
  // Форт-Уэрт — таблица 2024-го, и второй день ×1.5, как печатал лидерборд.
  CC_M24_GAME=0;
  await simulateGamesLive(field, DRAFT_M24.final.games, ccM24PointsGf, ccM24KillGf, 'stage', 0, null, zones,
    {days:CC_M24_DAY1_GAMES, mapReplay:true, choices:true, stageName:L().liveWorlds2024,
     dropEachGame:(g)=>{ CC_M24_GAME=g; return null; }});
  useLandingSet(wasSet);
  const ranked=rank24(field);
  const rank=ranked.indexOf(you)+1;
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, rank, field.length, you.stagePts, rank===1 ? true : null, you.gotVR,
    rank===1 ? L().gc2024Champion : L().gc2024PlaceNote(rank));
  await revealStandings(shell, ranked, you, 0, null, null, 'GC2024');
  removeSkipButton();
  if(rank===1) await celebrate(L().celKicker, L().celWorldChampTitle, L().celWorldChamp2024Sub, 'gold', 160);
  return {ranked, rank, total:field.length, champion:rank===1};
}
/* ===== ДРАФТ ПРОШЛЫХ ЛЕТ (2019–2023): формат, очки, призы и остров своего сезона =====
   Его слова 29.09: «поинт система у драфтов не такая как у настоящих турниров», «и формат турнира не
   такой», «и призы все не так». Общий движок Мейджора 2026 для этих наборов не годился. Здесь круг
   собирается из тех же спецификаций, по которым идёт карьера (CC_MX_SPEC, CC_M21, CC_M22, CC_M23):
   число раундов квалификатора и игр в них, хиты/полуфинал этого года, игры финала. Очки каждого этапа —
   правила Epic своего сезона (ccPastMajorScore по id и дню события из календаря года), призы —
   таблица финала своего сезона и региона (на игрока × размер состава). Поле драфта меньше настоящего,
   поэтому отсечки масштабируются так, чтобы до хитов/полуфинала и финала доходило их настоящее число
   лобби. */
const PAST_DRAFT={h2:{y:2019, n:2, wc:true}, h3:{y:2019, n:3}, h4:{y:2019, n:4}, i1:{y:2020, n:1}, i3:{y:2020, n:3},
  j1:{y:2021, n:1}, j2:{y:2021, n:2}, j3:{y:2021, n:3}, j4:{y:2021, n:4},
  k1:{y:2022, n:1}, k2:{y:2022, n:2}, k3:{y:2022, n:3}, e1:{y:2023, n:1}, e2:{y:2023, n:2}, e3:{y:2023, n:3}};
function pastDraftRows(y){ return ({2019:CAREER_YEAR_2019, 2020:CAREER_YEAR_2020, 2021:CAREER_YEAR_2021, 2022:CAREER_YEAR_2022, 2023:CAREER_YEAR_2023})[y]||[]; }
// День и id события этого Мейджора для этапа: квалификатор, полуфинал/хиты, финал.
function pastDraftEv(set, stage){
  const P=PAST_DRAFT[set], pre='Major'+P.n+'_'+P.y+'_';
  const rows=pastDraftRows(P.y).filter(r=>String(r[2]).indexOf(pre)===0);
  const is=stage==='final' ? (id=>/Final/.test(id)) : stage==='semi' ? (id=>/Heat|Semi/.test(id)) : (id=>!/Heat|Semi|Final|Reboot/.test(id));
  const row=rows.find(r=>is(String(r[2]))) || rows[0] || [String(P.y)+'-06-01', '', pre+'X'];
  return {id:row[2], day:row[0], stage:stage==='q' ? 'q' : stage, r:1};
}
function pastDraftScore(set, stage){
  const s=(typeof ccPastMajorScore==='function') ? ccPastMajorScore(pastDraftEv(set, stage)) : null;
  return s || {pts:majorPoints, kill:4};
}
function pastDraftPlan(set){
  const P=PAST_DRAFT[set], y=P.y, n=P.n;
  if(y<=2020){
    const sp=ccMXSpec(y, n);
    return {quals:sp.rounds.map(r=>({games:r.games})),
            semis:(sp.kind==='wc' || !(sp.heats||[]).length) ? null : {rooms:sp.heats.length, games:sp.heatGames||6, heats:true},
            final:{games:sp.finalGames||12}};
  }
  if(y===2021) return {quals:[1,2,3,4].map(r=>({games:ccM21Spec(n, r).games})),
                       semis:{rooms:ccM21HeatPlan(n).filter(h=>!h.prev).length, games:CC_M21.semi.games, heats:true},
                       final:{games:CC_M21.final.games}};
  if(y===2022) return {quals:Array.from({length:ccM22Rounds(n)}, (_, i)=>({games:ccM22Spec(n, i+1).games})),
                       semis:{rooms:1, games:CC_M22.semi.games},
                       final:{games:CC_M22.final.games}};
  return {quals:[{games:CC_M23.d1.games}, {games:CC_M23.d2.games}, {games:CC_M23.wf.games, wf:true}],
          semis:null, final:{games:CC_M23.final.games}};
}
// Таблица финала своего сезона и региона — на игрока; строки [последнее место, $].
function pastDraftPayRows(set, reg){
  const P=PAST_DRAFT[set];
  let T=null;
  try{
    if(P.y===2019) T=P.wc ? {EU:(WC2019_PAY||{})[ccMXSpec(2019, P.n).set]}
                          : Object.assign({}, (typeof CC_MX_PAY_2019_LQ!=='undefined' && CC_MX_PAY_2019_LQ[P.n])||{}, (CC_MX_PAY_2019||{})[P.n]||{});
    else if(P.y===2020) T=(CC_MX_PAY_2020||{})[P.n];
    else T=(({2021:CC_MAJOR_PAY_2021, 2022:CC_MAJOR_PAY_2022, 2023:CC_MAJOR_PAY_2023})[P.y]||{})[P.n];
  }catch(e){ T=null; }
  if(!T) return null;
  let r=reg;
  if(!T[r] && r==='NAW') r='NAC';
  if(!T[r] && r==='NAC') r='NAE';
  return T[r] || T.EU || null;
}
function pastDraftPrize(set, reg){
  const rows=pastDraftPayRows(set, reg);
  return p=>{ if(!rows) return 0; for(const x of rows) if(p<=x[0]) return x[1]*squadSize; return 0; };
}
/* Таблицы драфта прошлых лет — в цветах своего турнира и в виде экрана тех лет, как в карьере
   (его слово 29.09: «в драфтах… дизайн таблиц»). ccEvPaletteApply решает «прошлый год или нет» по
   карьере, поэтому здесь своя установка: палитра события по id и дню его финала. */
function pastDraftPalette(set, label){
  const root=document.documentElement, ev=pastDraftEv(set, 'final');
  const p=(typeof ccEvPalette==='function') ? ccEvPalette({id:ev.id}, ev.day) : null;
  if(!p){ root.classList.remove('ev-pal', 'ev-classic', 'ev-light'); return; }
  const s=root.style;
  s.setProperty('--ev-l', '#'+p[0]); s.setProperty('--ev-r', '#'+p[1]);
  s.setProperty('--ev-h', '#'+(p[2]||'FFE600'));
  s.setProperty('--ev-th', ccEvLight(p) ? '#0b0f16' : '#fff');
  root.classList.add('ev-pal', 'ev-classic');
  root.classList.toggle('ev-light', ccEvLight(p));
  const q=v=>'"'+String(v||'').replace(/["\\]/g,'').toUpperCase()+'"';
  s.setProperty('--ev-name', q(label));
  let reg=''; try{ reg=regionName(ccHomeRegion()); }catch(e){}
  s.setProperty('--ev-reg', reg ? q('('+reg+')') : '""');
}
async function runPastDraftTournament(){
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  show('screen-results');
  ensureSkipButton();
  const set=CARD_SET, plan=pastDraftPlan(set), T=L();
  const evName=String((typeof T_EVENT_NAME!=='undefined' && T_EVENT_NAME[set]) || set);
  try{ pastDraftPalette(set, evName); }catch(e){}
  const teams=buildFullLobby();
  const you=teams.find(t=>t.isYou);
  const lobby=TEAM_TARGET[squadSize]||50;
  const out=async note=>{ document.getElementById('finalSub').textContent=note; finishMajorEliminatedAnim(you); };
  const card=async(title, ranked, cut, passed, note, prize)=>{
    const shell=createStageCardShell(title);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, ranked.indexOf(you)+1, ranked.length, you.stagePts, passed, you.gotVR, note);
    await revealStandings(shell, ranked, you, cut, null, null, prize||null, null, !!prize);
  };
  // Сколько команд должно дойти до хитов/полуфинала и до финала.
  const semiField=plan.semis ? Math.min(teams.length, plan.semis.rooms*lobby) : 0;
  const target=plan.semis ? semiField : lobby;
  const qs=plan.quals, K=qs.length, F0=teams.length;
  const cutAt=i=>i===K-1 ? Math.min(target, F0) : Math.max(target, Math.round(F0*Math.pow(target/F0, (i+1)/K)));
  const qScore=pastDraftScore(set, 'q');
  let field=teams;
  // ---- квалификатор: раунды года, отсечка к хитам/полуфиналу/финалу ----
  for(let i=0; i<K; i++){
    reset24(field);
    const title=evName+' · '+(plan.quals[i].wf ? T.pdWeekFinal : T.pdQual(i+1, K));
    const cut=cutAt(i);
    if(field.length<=lobby){
      // Квалификация в драфте — одной таблицей, карта только на хитах и финале (его слово 29.09).
      await simulateGamesLive(field, qs[i].games, qScore.pts, qScore.kill, 'stage', 0, null, null, {mapReplay:false, choices:false, stageName:title});
    } else await simulateGamesRandomLobbies(field, qs[i].games, lobby, qScore.pts, qScore.kill);
    const ranked=rank24(field);
    const ok=ranked.indexOf(you)<cut;
    await card(title, ranked, cut, ok, ok ? T.ccRelPass(cut) : T.ccRelFail(cut));
    if(!ok){ await out(T.ccRelFail(cut)); return; }
    field=ranked.slice(0, cut);
  }
  // ---- хиты / полуфинал ----
  if(plan.semis){
    const sScore=pastDraftScore(set, 'semi');
    const R=Math.max(1, plan.semis.rooms), per=Math.ceil(lobby/R);
    const rooms=Array.from({length:R}, ()=>[]);
    field.forEach((t, i)=>{ const round=Math.floor(i/R), pos=i%R; rooms[round%2 ? R-1-pos : pos].push(t); });
    const next=[];
    for(let h=0; h<R; h++){
      const room=rooms[h]; reset24(room);
      const mine=room.indexOf(you)>=0;
      const title=evName+' · '+(plan.semis.heats ? T.pdHeat(h+1) : T.pdSemis);
      if(mine){
        const zones=await stageLandingPicker(room, you, title);
        await simulateGamesLive(room, plan.semis.games, sScore.pts, sScore.kill, 'stage', 0, null, zones, {mapReplay:true, choices:true, stageName:title});
      } else simulateGames(room, plan.semis.games, sScore.pts, sScore.kill);
      const r=rank24(room), pass=r.slice(0, per);
      pass.forEach(t=>next.push(t));
      if(mine){
        const ok=pass.includes(you);
        await card(title, r, per, ok, ok ? T.ccRelPass(per) : T.ccRelFail(per));
        if(!ok){ await out(T.ccRelFail(per)); return; }
        await celebrate(T.celKicker, T.celFinalsTitle, T.celFinalsSub, 'green', 40);
      }
    }
    field=next.slice(0, lobby);
    if(field.indexOf(you)<0) field[field.length-1]=you;
  }
  // ---- финал ----
  const fScore=pastDraftScore(set, 'final');
  const fin=field.slice(0, lobby); reset24(fin);
  const zoneGroups=await stageLandingPicker(fin, you, T.finalsLandingTitle);
  await simulateGamesLive(fin, plan.final.games, fScore.pts, fScore.kill, 'stage', 0, null, zoneGroups,
    {mapReplay:true, choices:true, stageName:evName+' · '+T.pdFinal, prize:pastDraftPrize(set, ccHomeRegion())});
  const finalRanked=rank24(fin);
  const rank=finalRanked.indexOf(you)+1;
  const myReg=ccHomeRegion();
  const prize=pastDraftPrize(set, myReg);
  await card(evName+' · '+T.pdFinal+' — '+fin.length, finalRanked, 0, rank===1 ? true : (prize(rank)>0 ? true : null),
    rank===1 ? T.championMajor : T.placeInFinals(rank, fin.length), prize);
  removeSkipButton();
  const cash=prize(rank);
  if(cash){ const lbl=T.prizeRegional(regionName(myReg), rank); recordEarning(lbl, cash); renderPrizeCard([{label:lbl, amount:cash}], cash); if(!skipAnimation) await sleep(900); }
  renderRunSummaryCard();
  finalRanked.forEach(t=>{ t.totalPts=t.stagePts; t.totalElims=t.stageElims; });
  you.gameLog=you.stageLog;
  document.getElementById('finalBanner').style.display='block';
  document.getElementById('finalPlace').textContent='#'+rank;
  document.getElementById('finalSub').textContent = rank===1 ? T.championMajor : T.placeInFinals(rank, fin.length);
  document.getElementById('lobbyTitle').innerHTML = T.majorFinalsResultTitle(fin.length);
  document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});
  // Итоговое лобби — с призами у ников (раньше таблица призов сюда не доходила).
  lobbyPrizeTable=prize;
  renderLobby(finalRanked, you);
  renderGameHistory(you);
  renderStats();
  finalizeRunStats(squadSize, true, rank, finalRanked.length, rank===1, false, true, you, finalRanked);
  showShareButton(you, rank, finalRanked.length, true, finalRanked);
}
async function runMajor2024Tournament(){
  skipAnimation=false; CC_SKIP_RUN=false;
  resetRunRecord();
  LAST_GC24_SEAT=false;
  document.getElementById('majorStages').innerHTML='';
  const rsPrev=document.getElementById('runSummary'); if(rsPrev) rsPrev.innerHTML='';
  document.getElementById('lobbyTitle').textContent='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  show('screen-results');
  ensureSkipButton();
  const n=major24Num(), S=DRAFT_M24;
  const teams=buildFullLobby();
  const you=teams.find(t=>t.isYou);
  const lobby=TEAM_TARGET[squadSize]||50;
  const out=async note=>{ document.getElementById('finalSub').textContent=note; finishMajorEliminatedAnim(you); };
  const card=async(title, ranked, cut, passed, note, qualifiedSet)=>{
    const shell=createStageCardShell(title);
    await revealStageLog(you, shell, true);
    finalizeStageCard(shell, ranked.indexOf(you)+1, ranked.length, you.stagePts, passed, you.gotVR && !!qualifiedSet, note);
    await revealStandings(shell, ranked, you, qualifiedSet ? 0 : cut, null, qualifiedSet||null);
  };

  // ---- раунд 1: открытый квалификатор ---------------------------------------
  await simulateGamesRandomLobbies(teams, S.r1.games, lobby, ccM24Points, CC_M24_KILL);
  let ranked=rank24(teams);
  const cut1=Math.min(S.r1.cut, ranked.length);
  const in1=ranked.indexOf(you)<cut1;
  await card(L().ccYr24Qual(n, 1, 1), ranked, cut1, in1, in1 ? L().ccRelPass(cut1) : L().ccRelFail(cut1));
  if(!in1){ await out(L().ccRelFail(cut1)); return; }

  // ---- раунд 2: очки серии → сетки ------------------------------------------
  const series=ranked.slice(0, cut1); reset24(series);
  await simulateGamesRandomLobbies(series, S.r2.games, lobby, ccM24Points, CC_M24_KILL);
  ranked=rank24(series);
  const sRank=ranked.indexOf(you)+1;
  const upper=ranked.slice(0, S.upperSize), lower=ranked.slice(S.upperSize);
  const inUpper=sRank<=S.upperSize;
  await card(L().ccYr24Qual(n, 1, 2), ranked, S.upperSize, true,
    L().ccYr24Series(you.stagePts, sRank)+' · '+(inUpper ? L().ccYr24ToUpper : L().ccYr24ToLower));

  // ---- полуфинал: две сетки, своя — вживую, чужая — тихо ---------------------
  const finalTeams=[];
  const tickets=[];
  const vrOf=(room, cap)=>rank24(room).filter(t=>t.gotVR && !tickets.includes(t)).slice(0, cap);
  const upperTitle=r=>L().ccYr24Semi(n, r)+' · '+L().ccYr24Upper;
  const lowerTitle=r=>L().ccYr24Semi(n, r)+' · '+L().ccYr24Lower;
  let alive=true, youTicket=false;
  // верхняя
  {
    let room=upper.slice();
    for(let d=0; d<S.upper.length; d++){
      const sp=S.upper[d]; reset24(room);
      if(inUpper && alive && !youTicket){
        // В драфте квалификация — одной таблицей, карта только в финале (его слово 29.09).
        const early=!CAREER_RUN;
        const zones=early ? null : await stageLandingPicker(room, you, upperTitle(d+1));
        await simulateGamesLive(room, sp.games, ccM24Points, CC_M24_KILL, 'stage', 0, null, zones,
          {stopOnWin:!!sp.vr, mapReplay:!early, choices:!early, stageName:upperTitle(d+1)});
      } else if(sp.vr) simulateGamesStopOnWin(room, sp.games, ccM24Points, CC_M24_KILL);
      else simulateGames(room, sp.games, ccM24Points, CC_M24_KILL);
      const r=rank24(room);
      if(sp.vr){
        const won=vrOf(room, S.vrPerDay); won.forEach(t=>tickets.push(t));
        if(inUpper && alive && !youTicket){
          youTicket=won.includes(you);
          await card(upperTitle(d+1), r, 0, youTicket ? true : null, youTicket ? L().ccYr24VrTicket : L().ccMajNoTicket, new Set(won));
          if(youTicket) await celebrate(L().celKicker, L().celFinalsTitle, L().celFinalsSub, 'green', 40);
        }
        room=room.filter(t=>!won.includes(t));
      } else {
        const seats=Math.max(0, S.upperSeats-tickets.length);
        const pass=r.slice(0, seats);
        if(inUpper && alive && !youTicket){
          const ok=pass.includes(you);
          await card(upperTitle(d+1), r, seats, ok, ok ? L().ccRelPass(seats) : L().ccRelFail(seats));
          if(ok) await celebrate(L().celKicker, L().celFinalsTitle, L().celFinalsSub, 'green', 40);
          else alive=false;
        }
        tickets.forEach(t=>finalTeams.push(t)); pass.forEach(t=>finalTeams.push(t));
      }
    }
  }
  // нижняя
  {
    let room=lower.slice();
    for(let d=0; d<S.lower.length; d++){
      const sp=S.lower[d]; reset24(room);
      const cut=(d===S.lower.length-1) ? Math.max(sp.cut, S.final.field-finalTeams.length) : sp.cut;
      if(!inUpper && alive){
        const early=!CAREER_RUN;
        const zones=early ? null : await stageLandingPicker(room, you, lowerTitle(d+1));
        await simulateGamesLive(room, sp.games, ccM24Points, CC_M24_KILL, 'stage', 0, null, zones,
          {mapReplay:!early, choices:!early, stageName:lowerTitle(d+1)});
      } else simulateGames(room, sp.games, ccM24Points, CC_M24_KILL);
      const r=rank24(room);
      const pass=r.slice(0, Math.min(cut, r.length));
      if(!inUpper && alive){
        const ok=pass.includes(you);
        await card(lowerTitle(d+1), r, pass.length, ok, ok ? L().ccRelPass(pass.length) : L().ccRelFail(pass.length));
        if(!ok) alive=false;
        else if(d===S.lower.length-1) await celebrate(L().celKicker, L().celFinalsTitle, L().celFinalsSub, 'green', 40);
      }
      room=pass;
      if(d===S.lower.length-1) pass.forEach(t=>finalTeams.push(t));
    }
  }
  if(!alive){ await out(L().ccYr24NoSemi); return; }
  const fin=finalTeams.filter((t,i,a)=>a.indexOf(t)===i).slice(0, S.final.field);
  if(fin.indexOf(you)<0) fin[fin.length-1]=you;

  // ---- финал ------------------------------------------------------------------
  reset24(fin);
  const zoneGroups=await stageLandingPicker(fin, you, L().finalsLandingTitle);
  CC_M24_GAME=0;
  await simulateGamesLive(fin, S.final.games, ccM24PointsGf, ccM24KillGf, 'stage', 0, null, zoneGroups,
    {twoDay:true, mapReplay:true, choices:true, stageName:L().liveRegionalFinals, prize:ccHomeRegion(),
     // Какая игра идёт — это и есть день: с седьмой счёт ×1.5. См. ccM24Day.
     dropEachGame:(g)=>{ CC_M24_GAME=g; return null; }});
  const finalRanked=rank24(fin);
  const youFinalRank=finalRanked.indexOf(you)+1;
  const myReg=ccHomeRegion();
  const gfSlots=gc2024SeatsOf(CARD_SET)[myReg]||0;
  const gfSeats=gfSlots ? awardSeats(finalRanked, gfSlots, holdsLanSeat) : [];
  const gfSeatSet=new Set(gfSeats);
  const gfSeatCut=gfSeats.length ? finalRanked.indexOf(gfSeats[gfSeats.length-1])+1 : gfSlots;
  const youHoldSeat=holdsLanSeat(you);
  const youQualified=youHoldSeat || gfSeatSet.has(you);
  if(gfSlots) recordLanSeat(L().lanFortWorth, youQualified,
    youHoldSeat ? L().lanSeatHeld(youFinalRank) : L().lanSeatDetail(youFinalRank, gfSlots, regionName(myReg)));
  LAST_GC24_SEAT=!!youQualified;
  const gfShell=createStageCardShell(L().majorFinalsStageTitle(fin.length));
  await revealStageLog(you, gfShell, true);
  finalizeStageCard(gfShell, youFinalRank, fin.length, you.stagePts, gfSlots ? youQualified : (youFinalRank===1), you.gotVR,
    gfSlots ? L().ccMajSeatGc24(gfSlots) : '');
  await revealStandings(gfShell, finalRanked, you, gfSlots ? gfSeatCut : 0, null, gfSlots ? gfSeatSet : null, myReg,
    (gfSlots && gfSeatCut>gfSlots) ? L().gcSeatCutRolled(gfSlots, gfSeatCut) : null);
  lobbyPrizeTable=myReg;
  removeSkipButton();
  const lines=[];
  const regional=prizeFor(myReg, youFinalRank);
  if(regional) lines.push({label:L().prizeRegional(regionName(myReg), youFinalRank), amount:regional});
  lines.forEach(l=>recordEarning(l.label, l.amount));
  if(lines.length){ renderPrizeCard(lines, lines.reduce((s,l)=>s+l.amount, 0)); if(!skipAnimation) await sleep(900); }

  // ---- Форт-Уэрт: третий Мейджор закрывает сезон -----------------------------
  let worlds=null;
  if(CARD_SET==='f3' && youQualified) worlds=await runGlobalChampionship2024(you, youFinalRank, myReg, finalRanked);
  let shown=finalRanked, shownRank=youFinalRank;
  if(worlds){
    const p=prizeFor('GC2024', worlds.rank);
    if(p>0){ recordEarning(L().prizeGc2024(worlds.rank), p); renderPrizeCard([{label:L().prizeGc2024(worlds.rank), amount:p}], p); if(!skipAnimation) await sleep(900); }
    lobbyPrizeTable='GC2024';
    shown=worlds.ranked; shownRank=worlds.rank;
  }
  renderRunSummaryCard();
  shown.forEach(t=>{ t.totalPts=t.stagePts; t.totalElims=t.stageElims; });
  you.gameLog=you.stageLog;
  document.getElementById('finalBanner').style.display='block';
  document.getElementById('finalPlace').textContent='#'+shownRank;
  document.getElementById('finalSub').textContent = worlds
    ? (worlds.champion ? L().gc2024Champion : L().gc2024PlaceNote(worlds.rank))
    : (youFinalRank===1 ? L().championMajor : L().placeInFinals(youFinalRank, fin.length));
  document.getElementById('lobbyTitle').innerHTML = worlds ? L().gc2024ResultTitle(worlds.total) : L().majorFinalsResultTitle(fin.length);
  document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});
  renderLobby(shown, you);
  renderGameHistory(you);
  renderStats();
  finalizeRunStats(squadSize, true, shownRank, shown.length, shownRank===1, false, true, you, shown);
  showShareButton(you, shownRank, shown.length, true, shown);
}


// ---------- FNCS Major 1 Summit (LAN, Düsseldorf) ----------
// Format straight from Epic's event page: 75 duos, three days.
//   Friday   — Upper Bracket: the 50 Major 1 qualifiers, 6 games, top 25 go
//              straight to the Grand Finals.
//   Saturday — Lower Bracket: the bottom 25 from Friday plus the 25 Second
//              Chance Qualifier duos, 6 games. A Victory Royale advances you
//              instantly; the top 19 on points fill the rest.
//   Sunday   — Grand Finals: 50 duos over 8 games, champion crowned.
//
// Per-region allocation exactly as Epic published it on the Major 1 page:
// Major 1 Finals slots + Second Chance Qualifier slots.
//   EU 20+8=28 · NAC 13+7=20 · BR 5+2=7 · NAW 3+2=5 · ASIA 3+2=5
//   ME 3+2=5 · OCE 3+2=5    →  50 + 25 = 75 duos
const SUMMIT_SLOTS    ={EU:20, NAC:13, NAW:3, BR:5, ASIA:3, ME:3, OCE:3};  // 50
const SUMMIT_SCQ_SLOTS={EU:8,  NAC:7,  NAW:2, BR:2, ASIA:2, ME:2, OCE:2};  // 25
const SUMMIT_GC_SLOTS=15;

// Section 2.2.12: the Global Championship in Belgium is filled from three
// leaderboards, not one. The Major 1 Summit sends its top 15; Major 2 sends a
// per-region allocation; and whatever is left goes to the winners of the
// Global Championship Last Chance. 15 + 25 + 10 = 50 duos on the LAN.
const MAJOR2_GC_SLOTS ={EU:9, NAC:6, NAW:2, BR:2, ASIA:2, ME:2, OCE:2};  // 25
const GCLC_GC_SLOTS   ={EU:3, NAC:2, NAW:1, BR:1, ASIA:1, ME:1, OCE:1};  // 10

function summitGfFor(region){
  return region==='EU' ? _M1G : region==='NAC' ? _N1G : region==='NAW' ? _W1G
       : region==='BR' ? _B1G : region==='ASIA' ? _A1G : region==='ME' ? _E1G
       : region==='OCE' ? _O1G : null;
}

// Handles repeat across regions (there are two different players called Chris),
// so the lookup has to be region-scoped.
function summitCardIndex(){
  const idx={};
  PLAYERS_BASE.filter(p=>p.cardSet==='m1').forEach(p=>{ idx[p.region+'|'+p.handle]=p; });
  return idx;
}

// Real qualifiers: each region's own Grand Finals standings decide who flies out.
function buildSummitField(you, myFinals){
  const idx=summitCardIndex();
  const mine=new Set(you.squad.map(hKey));
  const myReg=ccHomeRegion();
  const main=[], scq=[];
  Object.keys(SUMMIT_SLOTS).forEach(reg=>{
    // Your own region sends the duos that actually finished above you in the
    // tournament you just played — not the historical qualifiers. Every other
    // region sends its real duos, since their events weren't simulated.
    if(reg===myReg && myFinals && myFinals.length>2){
      const nMain=SUMMIT_SLOTS[reg], nScq=SUMMIT_SCQ_SLOTS[reg];
      let leftMain=nMain, leftScq=nScq;
      myFinals.forEach((t,i)=>{
        if(t===you || (!leftMain && !leftScq)) return;
        t.summitRegion=reg;
        t.regionRank=myFinals.indexOf(t)+1;
        t.regionPrize=prizeFor(reg, t.regionRank);
        if(leftMain>0){ leftMain--; main.push(t); }
        else { leftScq--; scq.push(t); }
      });
      return;
    }
    // Every region drafts, exactly like yours does — its own tournament is
    // simulated rather than replayed from history, so the duos that fly out are
    // freshly assembled from that region's card pool. Strongest squads take the
    // direct slots, the next ones come through the Second Chance Qualifier.
    const nMain=SUMMIT_SLOTS[reg], nScq=SUMMIT_SCQ_SLOTS[reg];
    const regionPool=cardRosterPlayers().filter(p=>p.region===reg && !mine.has(hKey(p)));
    if(regionPool.length < (nMain+nScq)*2) return;
    const res=draftBotSquads(regionPool, nMain+nScq, 2);
    const built=res.squads.map(sq=>{
      const t=buildTeam(sq);
      t.loadout=randomLoadoutBonus(sq.length); t.pow+=t.loadout;
      t.name=teamLabel(sq); t.summitRegion=reg;
      return t;
    }).sort((a,b)=>b.pow-a.pow);
    // Their finish at home and what it paid — carried to the LAN so the Summit
    // tables can show where everyone came from.
    built.forEach((t,i)=>{
      t.regionRank=i+1;
      t.regionPrize=prizeFor(reg, i+1);
      (i<nMain ? main : scq).push(t);
    });
  });
  return {main, scq};
}

function summitStandings(teams){
  return teams.slice().sort((a,b)=>
    b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
}

// Missed the direct route out of your region's Grand Finals? The Second Chance
// Qualifier is the other way in — open to every Division 1 duo that didn't
// already qualify. Whoever comes through it enters the Summit at the Lower
// Bracket on Saturday, exactly like the real event.
const SCQ_GAMES=6;

// ---------- Qualification celebration ----------
// Fired at the moments that actually matter: reaching the Finals, coming
// through the LCQ or Second Chance, earning the LAN ticket, and each bracket
// you survive at the Summit. Honours the skip button like every other
// animation in the run.
// A LAN ticket is a ticket to a country, so that card wears the country's flag:
// its bands paint the card, its colours throw the confetti and the shards. Only
// the three hosts the game actually sends anyone to.
const QUAL_FLAGS={
  fr:{bands:'linear-gradient(90deg,#0055A4 0 33.34%,#FFFFFF 33.34% 66.67%,#EF4135 66.67% 100%)',
      q1:'#0055A4', q2:'#FFFFFF', q3:'#EF4135', glow:'#7FB2FF'},
  de:{bands:'linear-gradient(180deg,#000000 0 33.34%,#DD0000 33.34% 66.67%,#FFCE00 66.67% 100%)',
      q1:'#DD0000', q2:'#FFCE00', q3:'#000000', glow:'#FFCE00'},
  be:{bands:'linear-gradient(90deg,#000000 0 33.34%,#FAE042 33.34% 66.67%,#ED2939 66.67% 100%)',
      q1:'#FAE042', q2:'#ED2939', q3:'#000000', glow:'#FAE042'}
};
const QUAL_TONES={
  gold:  {q1:'#ffd76b', q2:'#e08c00', q3:'#7a4400', glow:'#ffc531'},
  green: {q1:'#7dff5a', q2:'#28b81f', q3:'#0d5c10', glow:'#5bff4d'},
  blue:  {q1:'#5fc8ff', q2:'#0f74dd', q3:'#062f6b', glow:'#31b6ff'},
  purple:{q1:'#d98cff', q2:'#8e2bd6', q3:'#3d0b70', glow:'#c64cff'}
};

// A qualification card belongs to the tournament it was won in, so it takes the
// colours of the mode being played rather than a colour fixed to the kind of
// event. The tone name still arrives from the call site and stays the fallback
// for anything outside a themed mode; how big the moment is now reads from the
// confetti volume and the wording, which already differ per call.
const MODE_QUAL={
  allfncs:{q1:'#9db2ff', q2:'#3f62ca', q3:'#0e1a44', glow:'#6b88f0'},
  m1:     {q1:'#9fe9e3', q2:'#17a3a8', q3:'#06333b', glow:'#5fd8d2'},
  m2:     {q1:'#ffdb92', q2:'#d99a2c', q3:'#4a2f06', glow:'#ffc75a'},
  duo:    {q1:'#f8df8f', q2:'#d6ad33', q3:'#4a3a08', glow:'#ecc95c'},
  trio:   {q1:'#a3f2aa', q2:'#41c84d', q3:'#0d3f14', glow:'#6fe07a'},
  squad:  {q1:'#ffcb80', q2:'#ed961d', q3:'#4a2b05', glow:'#ffb14d'}
};

function qualTone(name){
  return MODE_QUAL[modeThemeKey()] || QUAL_TONES[name] || QUAL_TONES.green;
}

function confettiBurst(tone, count){
  const colors=[tone.q1, tone.q2, tone.glow, '#ffffff'];
  const nodes=[];
  /* Конфетти берут свой рандом, а не общий: 7 бросков на штуку и до 160 штук, больше тысячи бросков. В командной
     карьере поток вечера общий, а celebrate молчит под пропуском, который у двоих включается в разных местах кода.
     Одному поздравление показалось, второму нет, и таблицы финалов расходятся.
     CC_MP_RAND: обычный генератор браузера, отложенный сидом вечера; вне командного вечера его нет. */
  const rnd=(typeof CC_MP_RAND!=='undefined' && CC_MP_RAND) ? CC_MP_RAND : Math.random;
  for(let i=0;i<count;i++){
    const c=document.createElement('i');
    c.className='conf';
    c.style.left=(rnd()*100)+'vw';
    c.style.background=colors[Math.floor(rnd()*colors.length)];
    c.style.setProperty('--dx', (rnd()*220-110)+'px');
    c.style.setProperty('--rot', (rnd()*1080-540)+'deg');
    c.style.setProperty('--dur', (1.6+rnd()*1.5)+'s');
    c.style.animationDelay=(rnd()*0.35)+'s';
    if(rnd()<0.4) c.style.borderRadius='50%';
    document.body.appendChild(c);
    nodes.push(c);
  }
  setTimeout(()=>nodes.forEach(n=>n.remove()), 3600);
}

async function celebrate(kicker, title, sub, toneName, confetti, flag){
  // An abandoned run can reach here between two stages, before it has had a
  // chance to unwind on a sleep — so check before putting anything on the body.
  if(skipAnimation || !runIsCurrent()) return;
  // A flag wins over the mode's palette: this card is about the country, and the
  // mode theme is what qualTone would otherwise force on it.
  const flagTone=flag && QUAL_FLAGS[flag];
  const tone=flagTone || qualTone(toneName);
  const ov=document.createElement('div');
  ov.className='qual-overlay';
  if(flagTone) ov.style.setProperty('--qflag', flagTone.bands);
  // Shards fly out at fixed angles, each a touch behind the last, so the card
  // lands like a hit rather than just fading in.
  const shards=[...Array(14)].map((_,i)=>{
    const ang=(360/14)*i + (i%2?7:-7);
    const dist=(i%3===0?260:i%3===1?200:150);
    const thick=(i%3===0?7:i%3===1?5:3.5);
    return `<i class="qual-shard" style="--ang:${ang}deg;--dist:${dist}px;--len:${dist*0.42}px;
      --thick:${thick}px;animation-delay:${60+i*14}ms;"></i>`;
  }).join('');
  ov.style.setProperty('--q1', tone.q1); ov.style.setProperty('--q2', tone.q2);
  ov.style.setProperty('--q3', tone.q3); ov.style.setProperty('--qglow', tone.glow);
  // Headline split per word so each one can land on its own beat, with the
  // subtitle waiting until the last word is down.
  const words=String(title).split(/\s+/).filter(Boolean);
  const wordHTML=words.map((w,i)=>
    `<span class="qw" style="animation-delay:${170+i*75}ms">${w}</span>`).join(' ');
  const subDelay=200+words.length*75;
  ov.innerHTML=`<div class="qual-flash"></div>
    <div class="qual-shards">${shards}</div>
    <div class="qual-punch">
      <div class="qual-card${flagTone?' qual-flag':''}">
        <div class="qual-ring"></div>
        <div class="qual-kicker">${kicker}</div>
        <div class="qual-title">${wordHTML}</div>
        ${sub?`<div class="qual-sub" style="animation-delay:${subDelay}ms">${sub}</div>`:''}
        <div class="qual-bar"></div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  if(confetti) confettiBurst(tone, confetti);
  // click anywhere to dismiss early
  let dismissed=false;
  const close=()=>{ dismissed=true; };
  ov.addEventListener('click', close);
  // finally, not a trailing remove(): if the run is abandoned while the card is
  // on screen the waits below throw, and the overlay has to come off the body
  // on the way out rather than being left pinned over the next screen.
  try{
    for(let i=0;i<26 && !dismissed && !skipAnimation;i++) await sleep(70);
    ov.classList.add('out');
    await sleep(320);
  } finally {
    ov.remove();
  }
}

// The full 75-duo field laid out by region, shown before the LAN starts so you
// can see exactly who you are up against and how each of them got there.
// Full standings for a stage, appended under the player's own game log so the
// whole lobby is visible — who advanced, who didn't, and where you landed.
// Standings revealed row by row: the table is the headline of every stage card
// now, so it earns the animation the per-game log used to have. Your own line
// pulses as it lands and the scroller follows it.
// Cascade a table's rows in when it first becomes visible. Used by every table
// in the app so they all animate the same way, and so the animation never runs
// while the table is still parked off-screen.
function animateRows(wrapEl, perRow, startIndex){
  if(!wrapEl) return;
  const rows=[...wrapEl.querySelectorAll('tbody tr')];
  if(!rows.length) return;
  if(skipAnimation) return;
  // Long tables are scrolled to your own line, so cascading from row 1 would
  // play the whole animation above the fold. Start the cascade at the first row
  // that is actually on screen and let everything above it just be there.
  const from = startIndex || 0;
  const visible = rows.length - from;
  const step=perRow || Math.max(14, Math.min(38, Math.round(1300/Math.max(visible,1))));
  rows.forEach((r,i)=>{ r.style.animationDelay=(i<from ? 0 : (i-from)*step)+'ms'; });
  wrapEl.classList.add('tanim');
  // the page is often still smooth-scrolling toward the card when the table
  // first intersects, so let it settle before the cascade starts
  const go=()=>setTimeout(()=>wrapEl.classList.add('go'), 260);
  if(typeof IntersectionObserver==='function'){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ go(); io.disconnect(); } });
    }, {threshold:0.03});
    io.observe(wrapEl);
    // safety net: if it never scrolls into view, show it anyway
    setTimeout(()=>{ if(!wrapEl.classList.contains('go')){ go(); io.disconnect(); } }, 8000);
  } else go();
}

// Which numbered zone a squad dropped on, matching the map picker's labels,
// plus their record in the scraps that happened there across the stage —
// "won-lost", the way a drop spot gets talked about.
// How a Summit entrant did back home: their placement in their own region's
// Grand Finals and what that finish paid.
function regionResultHTML(t){
  if(!t || !t.regionRank) return '-';
  const prize=t.regionPrize||0;
  return `<span style="color:var(--ink-dim);">#${t.regionRank}</span>`+
    (prize?` <span style="color:#ffd166;font-weight:800;">${fmtMoney(prize)}</span>`:'');
}

function landingZoneLabel(t){
  if(!t || !t.landingZone) return null;
  const idx=ALL_LANDING_ZONES.indexOf(t.landingZone);
  return idx>=0 ? '#'+(idx+1) : null;
}
// Won and lost at the spot, as a plain 12-0 / 10-2 / 4-8. One pair of numbers
// and one meaning: of the games you landed on somebody, the ones you walked
// away from and the ones you did not.
//
// This is the third thing this pair has counted and the first that produces a
// record worth the column. It used to count corpses — fights that ended with
// somebody out — and on the map that is about one and a half drops decided per
// game across a whole lobby: measured over twelve games of forty-nine duos,
// nineteen. So a squad that landed on somebody in every one of its twelve games
// still read "0-0", while another that never saw a soul read the same, and the
// column said nothing about either. Before that it printed both, as "1-0 of
// 12", and the two numbers meaning different things is what got it read wrong
// and pulled.
//
// A contested drop you survived is a drop you won. That is not a claim about
// who shot whom — it is the claim the column can actually support, and it is
// the one a player is asking when they look at it: how often did I land on
// somebody, and how often did it cost me. landingWins stays as it is for the
// achievements that count kills; it is simply not what this cell reports.
function landingRecord(t){
  if(!t) return null;
  const l=t.landingLosses||0, c=t.landingContests||0;
  if(!c && !l) return null;
  // Losses are counted whether or not the spot registered as shared, so the
  // subtraction is floored rather than trusted.
  return Math.max(0, c - l) + '-' + l;
}
function landingCellHTML(t){
  const zone=landingZoneLabel(t);
  if(!zone) return '-';
  // The spot, and what happened on it.
  //
  // This column has been in twice and out twice, and both removals were right at
  // the time: a drop that ended in a body once in ten produced "1-0" after twelve
  // games, which says nothing and invites the wrong conclusion. It is in again
  // because the drop changed under it — squads that land on each other now
  // settle it, so a stage takes 15.6% of a trio lobby and 30.6% of a duo one, and
  // twelve games leave a record worth reading.
  //
  // Won and lost, and nothing else. The zone number used to lead the cell — "#22
  // 7-5" — and it is the one thing in there nobody needs: which numbered
  // rectangle a squad picked says nothing about how the stage went, the spots
  // are re-picked every game anyway, and it read as clutter in front of the
  // number that matters.
  //
  // The dash is its own answer: nobody else dropped here all stage.
  const rec=landingRecord(t);
  return rec
    ? `<span style="color:var(--accent);font-weight:800;">${rec}</span>`
    : `<span style="color:var(--ink-dimmer);" title="${L().landingNobodyElse}">-</span>`;
}

// The plate the broadcast cuts to once a stage is done: who won it and the
// four numbers that decided it. Portraits stand in for the skins the real
// graphic uses — the same silhouettes the player cards already draw.
// Everything is read back out of the game log rather than the running totals,
// so the four numbers always add up against each other whichever stage or
// simulator produced them.
function winnersFigures(t){
  const log=((t.stageLog && t.stageLog.length) ? t.stageLog : (t.gameLog||[]))
    .filter(g=>!g.isLandingBonus);
  const total=log.reduce((s,g)=>s+(g.pts||0),0);
  const elimPts=log.reduce((s,g)=>s+(g.elimPts||0),0);
  return {
    games:log.length, total,
    place:Math.max(0, total-elimPts),
    elims:log.reduce((s,g)=>s+(g.elims||0),0),
    vrs:log.filter(g=>g.place===1).length
  };
}

function winnersStatCells(f){
  return [
    {lab:L().wTotalPts, val:f.total},
    {lab:L().wPlacePts, val:f.place},
    {lab:L().wElims,    val:f.elims},
    {lab:L().wVrs,      val:f.vrs}
  ];
}

function winnersFigsHTML(team, size){
  // The label under a portrait is who the player is, not what they are wearing;
  // the skin moved to the tooltip.
  //
  // Every member, not the first two. This was written when a winning team was
  // always a duo, and it quietly dropped the third player of every trio that
  // ever won -- the champion's own card showed two of them. The portraits shrink
  // instead, so a trio takes about the room two used to.
  const squad=team.squad||[];
  const px=squad.length>2 ? Math.round(size*2/squad.length) : size;
  return squad.map(p=>
    `<div class="win-fig" title="${skinFor(p)}">${portraitHTML(p, px)}<span>${p.handle}</span></div>`).join('');
}

async function renderWinnersPlate(shell, winner, you){
  if(!winner) return;
  const f=winnersFigures(winner);
  if(!f.games) return;
  const stats=winnersStatCells(f);
  const h4=shell.card.querySelector('h4');
  // Stage titles carry a parenthetical of format detail — too long for a chip.
  const chip=((h4 && h4.childNodes[0] && h4.childNodes[0].textContent) || '')
    .split(' (')[0].trim().replace(/\s*\u2014\s*/g, ' · ');
  const names=winner.squad ? winner.squad.map(p=>p.handle).join(' + ') : winner.name;
  const figs=winnersFigsHTML(winner, 92);

  const el=document.createElement('div');
  el.className='win-card';
  el.innerHTML=`
    <div class="win-figs">${figs}</div>
    <div class="win-word">${L().winnersWord}</div>
    <div class="win-chips">
      ${chip?`<span class="win-chip teal"><span>${chip}</span></span>`:''}
      <span class="win-chip dark"><span>${L().wGames(f.games)}</span></span>
    </div>
    <div class="win-panel">
      <div class="win-names">${names}${winner===you?`<span class="win-you">${L().wYouTag}</span>`:''}</div>
      <div class="win-grid">${stats.map(s=>`<div class="lab">${s.lab}</div>`).join('')}</div>
      <div class="win-grid">${stats.map(s=>`<div class="val" data-to="${s.val}">0</div>`).join('')}</div>
    </div>`;
  shell.card.appendChild(el);

  const vals=[...el.querySelectorAll('.val')];
  if(skipAnimation){
    vals.forEach(v=>{ v.textContent=v.dataset.to; });
    return;
  }
  // Numbers roll up rather than appearing, the way the stream counts them in.
  const steps=18;
  for(let i=1;i<=steps;i++){
    const k=i/steps;
    vals.forEach(v=>{ v.textContent=Math.round(+v.dataset.to*k); });
    await sleep(26);
  }
  vals.forEach(v=>{ v.textContent=v.dataset.to; });
  await sleep(420);
}

async function revealStandings(shell, ranked, you, cut, maxRows, qualifiedSet, prizeTable, cutLabel, winners){
  // Sixty rows, unless the cut line sits below that — then far enough to show
  // it. A Play-In is 150 teams cutting to 99, and stopping at sixty meant the
  // table never reached the line: the stage said "top 99 advance" and the
  // standings under it ran out at 60 with nothing marking where 99 was. A
  // player reported it as the Play-In not having 99 teams in it, which is
  // exactly what it looked like.
  // До сотни участников — все (финалы, 29.10), больше — шестьдесят.
  const cap=Math.max(maxRows||(ranked.length<=100 ? 100 : 60), cut ? cut+1 : 0);
  let view=ranked, truncated=false;
  if(ranked.length>cap){
    const youIdx=ranked.indexOf(you);
    view=ranked.slice(0, cap);
    truncated=true;
    if(youIdx>=cap) view=view.concat([null, you]);
  }
  /* МЕНЕДЖЕР: все свои — наверху таблицы (игрок 10.10: «could you pin all my players on the leaderboard? Nako is mine, but I
     had to carefully scan the entire list to find him»). Составы клуба (isClub) раньше не подсвечивались вовсе, а ниже
     отсечки строк их не было. Теперь: закреп со своими и их местами, дальше таблица как была, свои в ней тоже подсвечены. */
  const ownT=t=>!!t && (t===you || !!t.isClub);
  const pins=(typeof MGR_ACTIVE!=='undefined' && MGR_ACTIVE) ? ranked.filter(ownT) : [];
  // The column appears where there is a record to print, not where a zone was
  // picked. Gating it on landingZone meant a stage that ran the picker but never
  // resolved a landing fight still spent a column on dashes, while the column
  // itself is now nothing but the record.
  const showDrop=ranked.some(t=>t && landingRecord(t));
  const showRegion=ranked.some(t=>t && t.regionRank);
  const wrap=document.createElement('div');
  wrap.style.marginTop='8px';
  wrap.innerHTML=`<div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-dim);margin-bottom:4px;">${L().stageTableTitle}</div>
    <div class="lobby-wrap" style="max-height:340px;overflow-y:auto;">
      <table class="lobby-table">
        <thead><tr><th class="num">#</th><th>${L().stageTableTeam}</th><th>${L().stageTableRegion}</th>
          ${showRegion?`<th class="num">${L().regionResultHeader}</th>`:''}
          ${showDrop?`<th class="num">${L().dropHeader}</th>`:''}
          <th class="num">${L().matchesWord}</th><th class="num">${L().winsWord}</th>
          <th class="num">${L().killsHeader}</th><th class="num">${L().ptsHeader}</th>
          </tr></thead>
        <tbody></tbody>
      </table>
    </div>`;
  shell.card.appendChild(wrap);
  const body=wrap.querySelector('tbody');
  const box=wrap.querySelector('.lobby-wrap');

  const sepRow=(html)=>{
    const tr=document.createElement('tr');
    tr.className='st-row';
    tr.innerHTML=`<td colspan="10" style="text-align:center;color:var(--ink-dimmer);padding:6px 0;">${html}</td>`;
    body.appendChild(tr);
  };
  if(pins.length){
    sepRow('<span style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);">📌 '+L().stagePinClub+'</span>');
    pins.forEach(t=>stRow(t, true));
    sepRow('···');
  }
  for(const t of view){
    if(t===null){ sepRow('···'); continue; }
    stRow(t, false);
  }
  function stRow(t, pinned){
    const i=ranked.indexOf(t);
    const mine=t===you, ours=!mine && ownT(t) && pins.length>0;
    // Drawn whenever the view reaches it, which it now always does — the cap
    // above is raised to clear the cut. The old guard was !truncated, so a
    // table long enough to be trimmed lost its line entirely.
    /* cutLabel===false — «черту не рисовать», а не «нарисовать без подписи».
       Финал недели дивизиона передавал именно это: десятка там не отсечка, а
       граница призовых, и красная строка «топ-10 проходят» обещала
       несуществующий следующий этап. Правка: «в див кап финалах не нужная
       строчка». Число там теперь тоже ноль: подсветка верхних читалась как
       «топ-10 куда-то квальнулись» — игрок, 22 августа, — а кто взял
       деньги, и так говорит колонка призовых. */
    if(!pinned && cut && i===cut && cut<cap && cutLabel!==false){
      const cl=document.createElement('tr');
      cl.className='st-row';
      cl.innerHTML=`<td colspan="10" style="text-align:center;color:var(--danger);font-size:11px;
        text-transform:uppercase;letter-spacing:.06em;padding:6px 0;">${cutLabel || L().stageCutLabel(ccRankShow(cut))}</td>`;
      body.appendChild(cl);
    }
    const reg=t.summitRegion || (t.squad&&t.squad[0]||{}).region || '';
    const through = qualifiedSet ? qualifiedSet.has(t) : (cut ? i<cut : true);
    // A team that already holds a LAN seat is not in qualifiedSet — awardSeats
    // skips it, because it cannot win a second one — so without this it rendered
    // dimmed, reading exactly like a team that missed out. It is the opposite:
    // its place passes down, and that is the one thing a player reading this
    // table needs to know, because finishing behind it still takes a seat.
    const seated = qualifiedSet ? holdsLanSeat(t) : false;
    const tr=document.createElement('tr');
    tr.className='st-row'+(mine?' you':'')+(pinned?' st-pin':'');
    if(mine) tr.style.cssText='background:rgba(0,176,144,.12);font-weight:700;';
    else if(ours) tr.style.cssText='background:rgba(0,176,144,.07);font-weight:700;';
    else if(!through && !seated) tr.style.opacity='.55';
    // Any row opens that team's game-by-game log for this stage, the same way
    // the final standings table already worked.
    if(t.stageLog && t.stageLog.length){
      tr.style.cursor='pointer';
      tr.title=L().rowHistoryHint;
      // Every stage reuses the same team objects and wipes stageLog when it
      // starts, but the finished stage's card stays on the page. Without a copy
      // taken here, clicking an old row would open whatever the team is playing
      // right now instead of the games this table is showing.
      const stageSnapshot=t.stageLog.slice();
      tr.onclick=()=>showMatchHistory(Object.assign(Object.create(Object.getPrototypeOf(t)), t, {stageLog:stageSnapshot}), true);
    }
    // A tournament played across two evenings has both of them in this column.
    // The player's own log is stitched together before the table is drawn, so
    // theirs already reads twenty-four; everybody else's carry lives on the team
    // rather than in the log, and without it their row said twelve next to the
    // points they scored in twenty-four. One row counting a different number of
    // games from the row above it is the table contradicting itself.
    const played=(t.stageLog||[]).filter(g=>!g.isLandingBonus).length
                 + (t._carryGames||0);
    // Both answers in words rather than one in a tick. Reading the table you
    // want to know two different things about a row — did this team get through
    // here, or were they already through before it started — and a bare check
    // mark only ever said the first, quietly.
    const tag=(text, colour, border, title)=>
      ` <span style="color:${colour};font-weight:800;font-size:9px;letter-spacing:.05em;` +
      `border:1px solid ${border};border-radius:3px;padding:0 3px;white-space:nowrap;" ` +
      `title="${title}">${text}</span>`;
    const mark = qualifiedSet && through
      ? (function(){ const byVR = t.gotVR && winIsATicket();
          return tag((byVR?'★ ':'')+L().qualHereTag, 'var(--accent)', 'rgba(0,176,144,.45)',
                     byVR?L().qualByVR:L().qualByPoints); })()
      : seated
      ? tag(L().alreadyQualTag, '#ffd166', 'rgba(255,209,102,.45)', L().alreadyQualHint)
      : '';
    // Приз — прямо у ника (его правка 28.09: «просто пусть пишет возле ника сколько призов»):
    // на телефоне отдельная колонка уезжала за край прокрутки.
    const prizeNow=prizeTable ? prizeFor(prizeTable, i+1) : 0;
    tr.innerHTML=`<td class="num" style="width:44px;">#${ccRankShow(i+1)}</td>
      <td>${ccNamesPeekHTML(t)}${mark}${stPrizeHTML(prizeNow, (t.squad||[]).length||squadSize)}</td>
      <td style="color:var(--ink-dimmer);font-size:11px;white-space:nowrap;">${reg?regionName(reg):''}</td>
      ${showRegion?`<td class="num" style="white-space:nowrap;">${regionResultHTML(t)}</td>`:''}
      ${showDrop?`<td class="num" style="color:var(--ink-dim);white-space:nowrap;">${landingCellHTML(t)}</td>`:''}
      <td class="num">${played}</td>
      <td class="num">${t.wins||0}</td>
      <td class="num">${t.stageElims||0}</td>
      <td class="num"><b>${t.stagePts||0}</b></td>`;
    body.appendChild(tr);
  }
  const mineRow=body.querySelector('tr.you');
  if(mineRow) box.scrollTop=Math.max(0, mineRow.offsetTop-box.clientHeight/2);
  // find the first row inside the scroller's visible window
  const allRows=[...body.querySelectorAll('tr')];
  let firstVisible=0;
  for(let i=0;i<allRows.length;i++){
    if(allRows[i].offsetTop + allRows[i].offsetHeight > box.scrollTop){ firstVisible=i; break; }
  }
  animateRows(wrap, null, firstVisible);

  // Hold here until the cascade has played. Without this the whole tournament
  // resolves in one frame and the standings are simply already there.
  if(!skipAnimation){
    shell.card.scrollIntoView({block:'center', behavior:'smooth'});
    const shown=Math.min(view.length-firstVisible, 14);
    await sleep(420 + shown*38);
  }
  // The winners plate belongs to a final. In a draft run every stage ends in
  // one and that is the run's own shape, but a career plays a cup a week and a
  // champion's plate under every ordinary Tuesday makes the word meaningless:
  // in a career it is drawn where the caller says the tournament ended.
  if(winners===true || (winners===undefined && !CAREER_RUN))
    await renderWinnersPlate(shell, ranked[0], you);
}

async function runSecondChanceQualifier(you, regionRank){
  const region=(you.squad[0] && you.squad[0].region) || 'EU';
  const mainSlots=SUMMIT_SLOTS[region]||0;
  const scqSlots=SUMMIT_SCQ_SLOTS[region]||0;
  if(!scqSlots) return false;

  const container=document.getElementById('majorStages');
  const intro=document.createElement('div');
  intro.className='stage-card';
  intro.innerHTML=`<h4>${L().scqTitle}</h4>
    <div class="stage-detail">${L().scqIntro(regionName(region), regionRank, mainSlots)}</div>`;
  container.appendChild(intro);
  intro.scrollIntoView({block:'center', behavior:'smooth'});
  await sleep(700);
  ensureSkipButton();

  // Field: duos from this region that did not take a direct Summit slot.
  const gf=summitGfFor(region);
  const alreadyIn=new Set();
  if(gf) gf.forEach(e=>{ if(e.rank<=mainSlots) e.duo.forEach(hd=>alreadyIn.add(hd)); });
  you.squad.forEach(p=>alreadyIn.add(hKey(p)));
  const avail=cardRosterPlayers().filter(p=>p.region===region && !alreadyIn.has(hKey(p)));

  const field=[you];
  (REALISTIC ? fillRealFieldTeams : fillFieldTeams)(avail, 49, squadSize, field);

  // Второй шанс — открытое лобби: очереди по квалификации тут нет и быть не
  // может, все вошли одной дверью, поэтому queue:false и порядок остаётся тем
  // же, что был, — по силе состава.
  // Второй шанс — открытое лобби: очереди по квалификации тут нет и быть не
  // может, все вошли одной дверью, поэтому жетоны не ставятся и порядок
  // остаётся тем же, что был, — по силе состава.
  const zones=await showFinalsLandingPicker(field, you);
  const shell=createStageCardShell(L().scqStageTitle(SCQ_GAMES));
  await simulateGamesLive(field, SCQ_GAMES, pointsForPlace, 4, 'stage', 0, null, zones, {stageName:L().liveScq});
  const ranked=summitStandings(field);
  const rank=ranked.indexOf(you)+1;
  const passed=rank<=scqSlots;
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, rank, field.length, you.stagePts, passed, you.gotVR,
    passed ? L().scqPass(rank, scqSlots) : L().scqFail(scqSlots));
  await revealStandings(shell, ranked, you, scqSlots, null, null, 'SCQ');
  removeSkipButton();
  recordEarning(L().prizeScq(rank), prizeFor('SCQ', rank));
  if(passed) await celebrate(L().celKicker, L().celScqTitle, L().celScqSub(rank), 'purple', 50);
  return passed;
}

// Upper Bracket played out with no UI — used when you came in through the
// Second Chance Qualifier and only join on Saturday.
function computeQuietUpper(main){
  const upper=main.slice(0, 50);
  if(upper.length<2) return {direct:upper.slice(), dropped:[]};
  simulateGames(upper, 6, pointsForPlace, 4);
  const ranked=summitStandings(upper);
  return {direct:ranked.slice(0,25), dropped:ranked.slice(25)};
}

async function runMajor1Summit(you, regionRank, myFinals){
  const region=(you.squad[0] && you.squad[0].region) || 'EU';
  const slots=SUMMIT_SLOTS[region]||0;
  let viaScq=false;
  if(regionRank>slots){
    const through=await runSecondChanceQualifier(you, regionRank);
    if(!through) return null;
    viaScq=true;
  }

  you.regionRank=regionRank;
  you.regionPrize=prizeFor(region, regionRank);
  const {main, scq}=buildSummitField(you, myFinals);
  if(main.length<10) return null;
  // You occupy one slot of your own region, so drop that region's last main
  // qualifier to keep the field at exactly 50 + 25.
  const myReg=ccHomeRegion();
  for(let i=main.length-1;i>=0;i--){
    if(main.length<=49) break;
    if(main[i].summitRegion===myReg){ main.splice(i,1); }
  }

  // Invitation card
  const container=document.getElementById('majorStages');
  const invite=document.createElement('div');
  invite.className='stage-card pass';
  invite.innerHTML=`<h4>${L().summitQualifiedTitle} <span class="stage-badge pass">${L().stagePassBadge}</span></h4>
    <div class="stage-detail">${viaScq
      ? L().summitQualifiedViaScq(regionName(region), SUMMIT_SCQ_SLOTS[region]||0)
      : L().summitQualifiedNote(regionName(region), regionRank, slots)}</div>
    <div class="stage-detail" style="margin-top:6px;">${L().summitFormatNote}</div>
    <div class="stage-detail" style="margin-top:8px;">${L().summitFieldNote}</div>`;
  container.appendChild(invite);
  invite.scrollIntoView({block:'start', behavior:'smooth'});
  await celebrate(L().celKicker, L().celLanTitle, L().celLanSub, 'gold', 70, 'de');
  await sleep(600);
  ensureSkipButton();

  // ----- Day 1: Upper Bracket, 50 duos, 6 games, top 25 advance -----
  let direct, dropped, youDirect=false;
  if(viaScq){
    // Second Chance duos don't play Friday — the Upper Bracket runs without you.
    const quiet=computeQuietUpper(main);
    direct=quiet.direct; dropped=quiet.dropped;
  } else {
    const upper=[you, ...main].slice(0, 50);
    /* Пятница: очередь — место дома. Все пятьдесят приехали со своих
       региональных финалов, сыгранных в один и тот же уикенд, поэтому
       сравнивать их очки не с чем: у собранных заново дуо их вообще нет, и
       очередь схлопывалась в силу состава. Сравнимо у них одно — какими они
       закончили у себя (regionRank, его ставит buildSummitField и себе тоже,
       см. you.regionRank выше). Значит сначала все победители регионов, потом
       все вторые, и так вниз. */
    upper.sort((a,b)=>(a.regionRank||99)-(b.regionRank||99));
    const zones=await stageLandingPicker(upper, you, L().finalsLandingTitle);
    const upperShell=createStageCardShell(L().summitDay1Title);
    await simulateGamesLive(upper, 6, pointsForPlace, 4, 'stage', 0, null, zones, {mapReplay:true, choices:true, stageName:L().liveUpper});
    const upperRanked=summitStandings(upper);
    const youUpperRank=upperRanked.indexOf(you)+1;
    direct=upperRanked.slice(0, 25);
    dropped=upperRanked.slice(25);
    youDirect=direct.includes(you);
    await revealStageLog(you, upperShell, true);
    finalizeStageCard(upperShell, youUpperRank, upper.length, you.stagePts, youDirect, you.gotVR,
      youDirect ? L().summitDay1Pass : L().summitDay1Drop);
    await revealStandings(upperShell, upperRanked, you, 25);
    if(youDirect) await celebrate(L().celKicker, L().celUpperTitle, L().celUpperSub, 'blue', 55);
  }

  // ----- Day 2: Lower Bracket, dropped 25 + 25 SCQ, 6 games -----
  let lowerQualified=[];
  if(youDirect){
    lowerQualified=computeQuietLowerBracket(dropped, scq, null);
  } else {
    /* Суббота: сначала выбывшие с пятницы, потом Второй шанс.

       Первые уже играли на этом LAN и прошли дальше раньше — их порядок задан
       пятничной таблицей (dropped идёт из неё). Вторые приехали позже всех, и
       между собой их сравнивать опять не по чему, кроме места дома, — там же
       правило, что и в пятницу. Пришедший через Второй шанс игрок встаёт в
       свою группу по своему месту дома, а не первым в комнате: раньше он
       стоял в начале массива просто потому, что массив собирали с него. */
    const scqQueue=(viaScq ? [...scq, you] : scq.slice())
      .sort((a,b)=>(a.regionRank||99)-(b.regionRank||99));
    const lowerPool=[...dropped, ...scqQueue];
    /* Своё место — за счёт последнего в очереди, а не сверх лобби.

       Суббота это ровно пятьдесят дуо: двадцать пять с пятницы и двадцать пять
       из Второго шанса. Твой регион отдаёт свою квоту целиком (buildSummitField
       считает её без тебя), поэтому со Вторым шансом ты пятьдесят первый. Раньше
       ты стоял в начале массива и срез просто выбрасывал последнего; теперь ты
       стоишь по своему месту дома, и если оно за границей — занимаешь последнюю
       строчку, а не растягиваешь лобби до пятидесяти одного. */
    const at=lowerPool.indexOf(you);
    if(at>=50){ lowerPool.splice(at, 1); lowerPool.splice(49, 0, you); }
    const lower=lowerPool.slice(0, 50);
    if(!lower.includes(you)) lower.push(you);
    const zones=await stageLandingPicker(lower, you, L().finalsLandingTitle);
    const lowerShell=createStageCardShell(L().summitDay2Title);
    await simulateGamesLive(lower, 6, pointsForPlace, 4, 'stage', 0, null, zones, {mapReplay:true, choices:true, stageName:L().liveLower});
    lowerQualified=lowerBracketQualifiers(lower);
    const youLower=lowerQualified.includes(you);
    const lowerRanked=summitStandings(lower);
    await revealStageLog(you, lowerShell, true);
    finalizeStageCard(lowerShell, lowerRanked.indexOf(you)+1, lower.length, you.stagePts,
      youLower, you.gotVR, youLower ? L().summitDay2Pass : L().summitDay2Fail);
    await revealStandings(lowerShell, lowerRanked, you, 25);
    if(youLower) await celebrate(L().celKicker, L().celLowerTitle, L().celLowerSub, 'purple', 55);
    if(!youLower){
      removeSkipButton();
      return {ranked:lowerRanked, rank:lowerRanked.indexOf(you)+1, total:lower.length,
              eliminated:true, stage:L().summitDay2Title, viaScq, day1Direct:youDirect, reachedLan:true};
    }
  }

  // ----- Day 3: Grand Finals, 50 duos, 8 games -----
  const grand=[...direct, ...lowerQualified].slice(0, 50);
  if(!grand.includes(you)) grand.push(you);
  // Воскресенье: прошедшие напрямую в пятницу стоят раньше тех, кто добрался
  // через субботу, — так массив и собран. Внутри групп порядок дня, из
  // которого они вышли; очки этих двух дней между собой несравнимы.
  const zones=await stageLandingPicker(grand, you, L().finalsLandingTitle);
  const grandShell=createStageCardShell(L().summitDay3Title);
  await simulateGamesLive(grand, 8, pointsForPlace, 4, 'stage', 0, null, zones, {mapReplay:true, choices:true, stageName:L().liveSummitFinals});
  const ranked=summitStandings(grand);
  const rank=ranked.indexOf(you)+1;
  await revealStageLog(you, grandShell, true);
  finalizeStageCard(grandShell, rank, grand.length, you.stagePts, rank<=SUMMIT_GC_SLOTS, you.gotVR,
    rank===1 ? L().summitChampion : (rank<=SUMMIT_GC_SLOTS ? L().summitGcSlot(rank) : L().summitNoGc));
  await revealStandings(grandShell, ranked, you, SUMMIT_GC_SLOTS, null, null, 'SUMMIT');
  removeSkipButton();
  if(rank===1) await celebrate(L().celKicker, L().celChampTitle, L().celChampSub, 'gold', 160);
  else if(rank<=SUMMIT_GC_SLOTS) await celebrate(L().celKicker, L().celGcTitle, L().celGcSub(rank), 'gold', 70);
  return {ranked, rank, total:grand.length, eliminated:false, champion:rank===1,
          gcSlot:rank<=SUMMIT_GC_SLOTS, viaScq, day1Direct:youDirect, reachedLan:true,
          stage:L().summitDay3Title};
}

// Victory Royale advances instantly; the top 19 on points fill the remaining slots.

// ---------- Fortnite Global Championship (LAN, Antwerp) ----------
// Liquipedia's event page: offline, Antwerp, 26–27 September 2026, 50 duos,
// $2,000,000, "Grand Finals — scoring based on placement and eliminations".
// It is a single cumulative leaderboard run across the two days, not a bracket
// like the Düsseldorf Summit, so it is modelled as one 12-game stage: six
// matches on the Saturday and six on the Sunday, points carrying over.
//
// The field is the one Liquipedia already lists: the 15 duos that came through
// the Major 1 Summit and the 25 that came through the Major 2 regional finals.
// The last 10 seats belong to the Global Championship Last Chance, which is
// still being played — those are marked as pending rather than invented.
const GC_GAMES=12;
// The trios that took a Global Championship seat out of FNCS 2025 Major 1, as
// Liquipedia records the Lyon field. Under rule 4.1.7 these three players are
// locked to each other for every following Major, so this is who enters Major 2
// together. Eight, not the nominal nine: one Major 1 advancement spot went
// unused and the rules let it pass to another region.
const GC2025_M1_TRIOS=[
  ['Flickzy','Veno','vic0'],
  ['Malibuca','P1ng','Wox'],
  ['Acorn','Ajerss','Pollo'],
  ['Cold','Peterbot','Ritual'],
  ['Bacca','Parz','PXMP'],
  ['Fazer','K1nG','Phzin'],
  ['Koyota','Rise','yuma'],
  ['5aald','FKS','Hero']
];

// ---------- FNCS 2025 Global Championship (LAN, Lyon) ----------
// Epic's own 2025 rules, saved as ~/Desktop/GLOBAL 2025/gc2025-rules.json:
// Lyon-Décines, 6–7 September 2025, 33 trios, 12 games over the two days, six a
// day, $2,001,000. One cumulative leaderboard, like Antwerp and unlike the
// Düsseldorf bracket.
//
// Section 6 allocates the 33 seats by Major and region. That table is what the
// simulation runs on; what actually travelled was 8 / 13 / 12, because one Major
// 1 seat went unused and the rules pass an unused advancement spot on. The real
// field is what fills the seats, so both facts are kept rather than averaged.
const GC2025_GAMES=12;
const GC2025_FIELD_SIZE=33;
const GC2025_M1_SEATS={EU:2, NAC:2, NAW:1, BR:1, ASIA:1, ME:1, OCE:1};   // 9 nominal, 8 travelled
const GC2025_M2_SEATS={EU:5, NAC:3, NAW:1, BR:1, ASIA:1, ME:1, OCE:1};   // 13
const GC2025_M3_SEATS={EU:4, NAC:2, NAW:1, BR:1, ASIA:1, ME:1, OCE:1};   // 11 nominal, 12 travelled

// The other two Majors' qualifiers, from the same Liquipedia field
// (~/Desktop/GLOBAL 2025/gc2025-qualification.json). These are never simulated —
// they are real teams who won their seats at events this game does not replay,
// which is the whole reason the Lyon field is worth having.
const GC2025_M2_TRIOS=[
  ['MariusCOW','Pixie','Vanyak3kk'], ['Fredoxie','PabloWingu','Tjino'],
  ['Darm','Demus','pixx'], ['Merstach','Queasy','SwizzY'],
  ['Chico','Hris','TaySon'], ['Clix','Eomzo','Higgs'],
  ['Cooper','Curly','Reet'], ['Aminished','Braydz','Visxals'],
  ['Ark','Salko','Sxhool'], ['Cadu','Stryker','Tisco'],
  ['Kimkana','Raito','Razl'], ['Rew','saad','Snowy'],
  ['alex','Anon','Resignz']
];
// Major 3's twelve, in the order Liquipedia lists them. Which region each one
// took its seat in is not written on the field list, so it is read off the cards
// themselves at run time (gc2025RegionOf) rather than typed in from a guess.
const GC2025_M3_TRIOS=[
  ['Japko','panzer','Setty'], ['FoCuS','Mikson','Upl'],
  ['charyy','IDrop','Kami'], ['Chap','MrSavage','rezon ay'],
  ['Boltz','Khanada','Rapid'], ['Muz','Shadow','Sphinx'],
  ['EpikWhale','Paper','VicterV'], ['Gabzera','Scarpa','WeY'],
  ['Buyuriru','Merem','wickesy'], ['Adapter','Balor','Mansour'],
  ['Aspect','Cazi','Tinka'], ['Goofy','m0untain','VortexM']
];

const GC_SUMMIT_DUOS=[
  ['vic0','Malibuca'], ['Peterbot','Pollo'], ['shxrk','t3eny'], ['Sky','Scroll'],
  ['Acorn','Boltz'], ['Kingaling','Kraez'], ['Reet','Cooper'], ['Shadow','Vergo'],
  ['SwizzY','Pixie'], ['Darm','Demus'], ['Syaaz','Scary'], ['FoCuS','Th0masHD'],
  ['Golden','Ozone'], ['Tjino','PabloWingu'], ['Chap','Flickzy']
];
const GC_MAJOR2_DUOS={
  EU:[['charyy','Kami'], ['Cr1nge','Twi'], ['IDrop','Ghonzo'], ['Velofps','Zynox'],
      ['Rax','JannisZ'], ['tidi','Julle'], ['fant','Hlechis'], ['Nebs','Nxthan'],
      ['pixx','Firen']],
  NAC:[['Ritual','Cold'], ['Ajerss','Veno'], ['Higgs','Curve'], ['Muz','Rise'],
       ['josh','Eomzo'], ['Clix','Rapid']],
  NAW:[['EpikWhale','PXMP'], ['phoenix','Retro']],
  BR:[['mack','Diguera'], ['Lewa','Romero']],
  ASIA:[['yuma','Koyota'], ['Minipiyo','FuuKun']],
  ME:[['Howly','1Lusha'], ['5aald','Smiky']],
  OCE:[['Resignz','Tinka'], ['Solvey','Sazers']]
};

// Liquipedia writes clean nicknames; the card pool carries Tracker's raw
// in-game names, so "FoCuS" has to find "Focus" and "pixx" has to find "Pixx".
const _gcNorm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
// Four of the qualified players are written differently on Liquipedia than in
// Tracker's card pool; the rest match on the normalised handle alone.
// phzin plays as "FUT phzin 伊万尔" in Tracker's pool, which does not survive
// normalisation down to "phzin" -- the tag and the tail are both letters.
const GC_HANDLE_ALIAS={scary:'Scaryy', velofps:'Velo', zynox:'TwitterZynoxFNBR',
                       phzin:'FUT phzin 伊万尔'};
/* Индекс карточек ЛАНа, по желанию только за один год. Без года ЛАН брал самую высокую карточку за всю историю,
   а ccSceneRoster берёт самую свежую за год: из 98 человек поля 46 сидели карточкой 2025, средний перекос +4.8,
   Queasy 96 при 69 в сцене (tools/lan-card-year-probe.js).
   Год фильтруется здесь, а не при подстановке: комнаты Саммита строятся трижды (careerSummitField для верхней,
   нижней и финала), нижняя пересортировывает то же поле, и порядок обязан совпасть. Лезть в ccSceneRoster во время
   сборки грело его кэши и ломало порядок (check-career-summit-carry). Индекс считается один раз на страницу.
   Драфт зовёт gcCardIndex() без года и получает индекс по всем годам, так и надо. */
let _GC_INDEX={};
/* Та же карточка, но по РЕГИОНУ — для тёзок. В базе 137 ников заняты дважды по-настоящему
   (см. CARD_WRONG_REGION), и индекс по одному нику отдавал ЛАНу чужого человека: рядом с
   Ritual (NAC 96) садился Cold из NAW на 62, а yuma для Азии находился в NAW на 67 —
   замер tools/trio-season2-lan-probe.js, 21.09. Когда регион известен, карточка берётся
   из него; без региона — как раньше. */
let _GC_INDEX_R={};
function gcCardIndexR(year){ gcCardIndex(year); return _GC_INDEX_R[year||'all']||{}; }
function gcCardIndex(year){
  const key=year||'all';
  if(_GC_INDEX[key]) return _GC_INDEX[key];
  const idx={}, idxR={};
  PLAYERS.filter(p=>p.tier==='cardmode').forEach(p=>{
    if(year && ccCardYear(p)!==year) return;
    const k=_gcNorm(p.handle);
    /* Ник из одних не-латинских знаков (しゅんてゃん) нормализуется в пустую строку — и такая
       карточка ловила КАЖДЫЙ неизвестный ник через пустой alias (Форт-Уэрт 2024: восемь
       чужих людей стали одним японцем). Пустой ключ в индекс не идёт. */
    if(!k) return;
    if(year){
      /* За свой год берётся САМАЯ СВЕЖАЯ карточка, а не самая высокая.

         Год я свёл раньше (98 из 98 на 2026), а разница осталась: сцена
         (ccSceneRoster) берёт последнюю карточку человека, ЛАН брал
         лучшую — и один и тот же игрок выходил на остров сильнее себя же
         в хабе на 2.9 в среднем. У vic0 и Malibuca пул держал Major 1,
         когда сцена уже знала Major 2.

         Без года ничего не меняется: драфту нужен именно лучший результат
         человека за всю историю, там это не про сезон. */
      const cur=idx[k];
      if(!cur || (ccCardDay(p)||0)>(ccCardDay(cur)||0)) idx[k]=p;
      const rr=idxR[k]=idxR[k]||{}, cr=rr[p.region||''];
      if(!cr || (ccCardDay(p)||0)>(ccCardDay(cr)||0)) rr[p.region||'']=p;
      return;
    }
    // Prefer the highest-rated card for a handle: the same person can hold a
    // Play-In card and a Grand Finals card, and the LAN version is the latter.
    if(!idx[k] || p.rating>idx[k].rating) idx[k]=p;
    const rr=idxR[k]=idxR[k]||{};
    if(!rr[p.region||''] || p.rating>rr[p.region||''].rating) rr[p.region||'']=p;
  });
  _GC_INDEX[key]=idx; _GC_INDEX_R[key]=idxR;
  return idx;
}
function gcFindCard(handle, region, fallbackRating, year){
  const idx=gcCardIndex(year);
  const key=_gcNorm(handle);
  const alias=_gcNorm(GC_HANDLE_ALIAS[key]||'');
  // Регион известен — сначала карточка ЭТОГО региона (тёзки, см. _GC_INDEX_R).
  const byReg=(ix)=>region ? ((ix[key]||{})[region] || (ix[alias]||{})[region] || null) : null;
  let hit=byReg(gcCardIndexR(year)) || idx[key] || idx[alias];
  /* Спросили год, а карточки этого года у человека нет — берём его лучшую за
     всю историю. Он на ЛАНе есть, он туда прошёл; молчать про него хуже, чем
     назвать прошлогоднее число. Таких единицы: замер — трое из девяноста
     восьми. */
  if(!hit && year){ const all=gcCardIndex(); hit=byReg(gcCardIndexR()) || all[key] || all[alias]; }
  if(hit) return hit;
  // No card for this handle anywhere in the pool — qualified through an event
  // whose leaderboard we never imported. Keep the real name, give it a rating
  // in line with the route it came through.
  return {handle, nat:null, region:region||'EU', rating:fallbackRating,
          rarity:rarityForRating(fallbackRating), tier:'cardmode',
          cardSet:CARD_SET, event:'FNCS 2026 Global Championship', placement:null};
}
function gcBuildTeam(handles, region, route, rating){
  const squad=handles.map(hd=>gcFindCard(hd, region, rating));
  const t=buildTeam(squad);
  t.loadout=randomLoadoutBonus(squad.length); t.pow+=t.loadout;
  t.name=teamLabel(squad);
  t.gcRoute=route; t.summitRegion=region;
  return t;
}

// The 50-duo field, with your own duo slotted into the seat you just won.

// Who actually flies to Antwerp differs every run. Rather than replaying the
// published qualifier list, each region's seats are drawn from that region's
// real Grand Finals leaderboard, weighted toward the top: the duos who finished
// highest are most likely to take the slots, but never guaranteed. Same idea for
// the Summit seats, which are drawn from the Major 1 finals fields.
function gcRegionFinals(set, region){
  const arr = (set==='m1')
    ? (region==='EU'?_M1G:region==='NAC'?_N1G:region==='NAW'?_W1G:region==='BR'?_B1G
      :region==='ASIA'?_A1G:region==='ME'?_E1G:region==='OCE'?_O1G:null)
    : (region==='EU'?_M2G:region==='NAC'?_N2G:region==='NAW'?_W2G:region==='BR'?_B2G
      :region==='ASIA'?_A2G:region==='ME'?_E2G:region==='OCE'?_O2G:null);
  return Array.isArray(arr) ? arr : [];
}

function gcDrawDuos(entries, count, depth, taken){
  // Weight by finishing position across the top `depth` of the field, then draw
  // without replacement, so a top-5 duo is far likelier than a 20th-place one.
  // `taken` holds handles already seated, since the same player can appear in
  // both a Major 1 and a Major 2 leaderboard.
  const seen=taken||new Set();
  const pool=entries.slice(0, depth)
    .filter(e=>!e.duo.some(hd=>seen.has(_gcNorm(hd))))
    .map((e,i)=>({duo:e.duo, w:Math.pow(0.90, i)}));
  const out=[];
  while(out.length<count && pool.length){
    const total=pool.reduce((s,x)=>s+x.w,0);
    let r=Math.random()*total, idx=0;
    for(;idx<pool.length;idx++){ r-=pool[idx].w; if(r<=0) break; }
    idx=Math.min(idx, pool.length-1);
    const duo=pool.splice(idx,1)[0].duo;
    duo.forEach(hd=>seen.add(_gcNorm(hd)));
    out.push(duo);
  }
  return out;
}

function gcDrawSummitDuos(count, taken){
  // The fifteen duos that actually came out of the Major 1 Summit are known —
  // GC_SUMMIT_DUOS is that list. This used to ignore it completely and invent a
  // field by drawing from each region's Major 1 *regional* finals instead, which
  // seated duos that were never at the Summit (a Major 1 regional tenth place
  // turning up on the Antwerp roster "via the Summit") while leaving out the
  // ones that were. It also contradicted itself: the real list was still used to
  // keep those players out of the Last Chance, so the game would say a duo was
  // already at the LAN and then not seat them there.
  const seen=taken||new Set();
  const picks=[];
  GC_SUMMIT_DUOS.forEach(duo=>{
    if(picks.length>=count) return;
    const blocked=duo.filter(hd=>seen.has(_gcNorm(hd)));
    if(blocked.length===duo.length) return;           // both already seated elsewhere
    if(blocked.length){
      // One of them was drafted by the player. The other still holds the seat —
      // it travels with whoever they actually entered Major 2 alongside.
      const solo=duo.find(hd=>!seen.has(_gcNorm(hd)));
      const sub=solo && LOCKED_TEAM_SUBS.get(_gcNorm(solo));
      if(!sub) return;
      const pair=sub.map(pl=>pl.handle);
      if(pair.some(hd=>seen.has(_gcNorm(hd)))) return;
      pair.forEach(hd=>seen.add(_gcNorm(hd)));
      picks.push(pair);
      return;
    }
    duo.forEach(hd=>seen.add(_gcNorm(hd)));
    picks.push(duo);
  });
  if(picks.length>=count) return picks.slice(0, count);

  // Only reached when the real list cannot fill the allocation — the player
  // drafted one of those duos, so a seat opened up. Fill it the way the rest of
  // the bracket is filled: from the Major 1 regional finals, weighted by the
  // slots each region actually had.
  const regions=Object.keys(SUMMIT_SLOTS);
  const perRegion={};
  regions.forEach(r=>{ perRegion[r]=gcRegionFinals('m1', r); });
  let guard=0;
  while(picks.length<count && guard++<60){
    const totalSlots=regions.reduce((s,r)=>s+(SUMMIT_SLOTS[r]||0),0) || 1;
    let r=Math.random()*totalSlots, reg=regions[0];
    for(const x of regions){ r-=(SUMMIT_SLOTS[x]||0); if(r<=0){ reg=x; break; } }
    const extra=gcDrawDuos(perRegion[reg], 1, 12, seen)[0];
    if(extra) picks.push(extra);
  }
  return picks;
}

function buildGlobalChampionshipField(you, region, lcqWinners, regionalFinal){
  const field=[];
  // One shared set of handles, so nobody is seated twice across the three routes.
  const seated=new Set();
  (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  // The Summit is seated first because it happened first: Major 1's LAN decided
  // its fifteen before Major 2's regional finals were played. Reserving the
  // region's Major 2 places up front — which is what used to happen here — had
  // it backwards, and cost a Summit duo the seat it had already won whenever it
  // also finished high in the simulated Major 2 final. The roll-down runs the
  // other way: you keep the seat you qualified for first, and the later event's
  // place passes down to whoever is not going yet.
  gcDrawSummitDuos(SUMMIT_GC_SLOTS, seated).forEach(d=>field.push(gcBuildTeam(d, null, 'summit', 88)));
  Object.keys(MAJOR2_GC_SLOTS).forEach(reg=>{
    // Your own region's seats come from the Grand Finals you just played, so the
    // duos flying out with you are the ones your run produced.
    if(reg===region && regionalFinal && regionalFinal.length) return;
    const slots=MAJOR2_GC_SLOTS[reg]||0;
    // GC_MAJOR2_DUOS is who actually took each region's Major 2 seats, and it is
    // NOT simply the top N of that region's final: a duo already qualified from
    // the Summit keeps its finishing position and its prize money, but cannot
    // take a second seat, so the seat rolls down to the next duo without one.
    // In Europe that moved six of the nine seats — Sky & Scroll, Shxrk & t3eny,
    // SwizzY & Pixie, Focus & Th0masHD and Tjino & PabloWingu all finished top
    // nine and all were already going. Drawing from the standings instead of
    // reading this list put those duos on the plane twice and left the ones who
    // really qualified at home.
    const real=(GC_MAJOR2_DUOS[reg]||[]).filter(d=>!d.some(hd=>seated.has(_gcNorm(hd))));
    const duos=real.slice(0, slots);
    duos.forEach(d=>d.forEach(hd=>seated.add(_gcNorm(hd))));
    // Only if that list cannot fill the allocation do we fall back to the draw.
    if(duos.length<slots){
      const entries=gcRegionFinals('m2', reg);
      if(entries.length) duos.push(...gcDrawDuos(entries, slots-duos.length, 18, seated));
    }
    duos.forEach(d=>field.push(gcBuildTeam(d, reg, 'm2', 84)));
  });

  if(regionalFinal && regionalFinal.length){
    const slots=MAJOR2_GC_SLOTS[region]||0;
    // Same rule inside your own region: a duo that is already on the plane from
    // the Summit finished where it finished, but its seat rolls down to the next
    // one that isn't going yet. Without this the simulated final could seat a
    // Summit duo a second time, since the bots are drafted from the same pool.
    const holdsSeat=t=>(t.squad||[]).some(pl=>seated.has(_gcNorm(pl.handle)));
    const taking=[];
    regionalFinal.filter(t=>t!==you).forEach(t=>{
      if(taking.length>=Math.max(0, slots-1)) return;
      if(holdsSeat(t)) return;
      (t.squad||[]).forEach(pl=>seated.add(_gcNorm(pl.handle)));
      taking.push(t);
    });
    taking.forEach(t=>{
      t.gcRoute='m2'; t.summitRegion=region;
      field.push(t);
    });
  } else {
    // No simulated final to draw from — displace the last of the region's real
    // qualifiers instead, since only one of you can hold that seat.
    const mine=field.filter(t=>t.gcRoute==='m2' && t.summitRegion===region);
    if(mine.length) field.splice(field.indexOf(mine[mine.length-1]), 1);
  }
  field.push(you);
  /* Дверь, в которую вошёл ты сам, а не та, что стояла тут по умолчанию.

     Очередь на метку в Антверпене идёт по маршруту (см. gcRouteRank): кто взял
     место на Саммите, тот держит его с июня и стоит впереди тех, кто добывал
     своё на Мейджоре 2, а те — впереди Ласт Ченса. Здесь всегда писался 'm2',
     и это было верно ровно до режима «весь год»: в нём Саммит можно выиграть
     своим составом (YEAR_SEAT), и тогда твоя дверь — 'summit'. */
  you.gcRoute = holdsLanSeat(you) ? 'summit' : 'm2';
  you.summitRegion=region;

  // Last Chance seats. If the player came through that route, the duos that
  // beat or trailed them in its Finals take the rest of the region's seats —
  // otherwise they are filled from the card pool, since the real event is
  // still being played and those names are not decided yet.
  (lcqWinners||[]).forEach(t=>{
    if(t===you || field.includes(t) || field.length>=50) return;
    t.gcRoute='lcq'; t.summitRegion=t.summitRegion||region;
    field.push(t);
  });
  /* Ласт Ченс — ПО РЕГИОНАМ, а не из одной колоды.

     Жалоба игрока, со скрином списка: «с ласт шанса только еу
     дуо квалят глобалы в симуляции 2 мэйджора». Так и было: оставшиеся места
     добивались из колоды текущего режима, то есть из одного региона, и весь
     раздел «Через Global Championship Last Chance» выходил европейским.

     У Epic у Ласт Ченса своя квота на регион (GCLC_GC_SLOTS: ЕС 3, НАК 2,
     остальным по одному), и карьера так и сажает — та же машинерия
     (gcRegionFinals + ccLanSeats), только звалась она до сих пор из одного
     места. Здесь — второе. Что не наберётся из настоящих лидербордов,
     по-прежнему добьётся колодой. */
  const seatedLcq=new Set();
  field.forEach(t=>(t.squad||[]).forEach(p=>seatedLcq.add(_gcNorm(p.handle))));
  if(typeof GCLC_GC_SLOTS!=='undefined' && typeof gcRegionFinals==='function'){
    Object.keys(GCLC_GC_SLOTS).forEach(reg=>{
      if(field.length>=50) return;
      const want=Math.min(ccTeams(GCLC_GC_SLOTS[reg]||0), 50-field.length);
      if(!want) return;
      const rows=gcRegionFinals('m2', reg);
      (ccLanSeats(rows, want, reg, seatedLcq)||[]).forEach(t=>{
        if(field.length>=50) return;
        t.gcRoute='lcq'; t.summitRegion=reg;
        field.push(t);
      });
    });
  }
  const taken=new Set();
  field.forEach(t=>t.squad.forEach(p=>taken.add(hKey(p))));
  const avail=cardRosterPlayers().filter(p=>!taken.has(hKey(p)));
  const before=field.length;
  (REALISTIC ? fillRealFieldTeams : fillFieldTeams)(avail, 50-field.length, 2, field);
  for(let i=before; i<field.length; i++){
    field[i].gcRoute='lcq';
    field[i].summitRegion=(field[i].squad[0]||{}).region||null;
  }
  while(field.length<50){
    const chunk=[makeFiller(), makeFiller()];
    const t=buildTeam(chunk); t.loadout=randomLoadoutBonus(chunk.length); t.pow+=t.loadout;
    t.name=teamLabel(chunk); t.gcRoute='lcq'; field.push(t);
  }
  const capped=field.slice(0, 50);
  if(!capped.includes(you)){ capped[capped.length-1]=you; }
  return capped;
}

function renderGcFieldCard(field){
  const container=document.getElementById('majorStages');
  const card=document.createElement('div');
  card.className='stage-card';
  const group=(route)=>field.filter(t=>t.gcRoute===route);
  const rowFor=(t,label)=>`<tr class="lobby-row${(t.isYou||t.isClub)?' lobby-you':''}">
      <td>${(t.isYou||t.isClub)?'<b style="color:var(--lb-you);">'+t.name+'</b>':t.name}</td>
      <td class="num" style="color:var(--ink-dimmer);font-size:12px;">${label}</td></tr>`;
  const section=(title, teams, label)=>teams.length ? `<div style="margin-top:14px;">
      <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:4px;">
        ${title} <span style="color:var(--ink-dimmer);font-weight:600;">(${teams.length})</span></div>
      <div class="lobby-wrap"><table class="lobby-table"><tbody>
        ${teams.map(t=>rowFor(t,label)).join('')}</tbody></table></div></div>` : '';
  card.innerHTML=`<h4>${L().gcFieldTitle}</h4>
    <div class="stage-detail">${L().gcFieldNote}</div>
    ${section(L().gcRouteSummit, group('summit'), L().gcRouteSummitShort)}
    ${section(L().gcRouteMajor2, group('m2'), L().gcRouteMajor2Short)}
    ${section(L().gcRouteLcq, group('lcq'), L().gcRouteLcqShort)}`;
  container.appendChild(card);
  card.scrollIntoView({block:'start', behavior:'smooth'});
}


// ---------- FNCS Global Championship Last Chance ----------
// Rules 2.2.9 and 2.2.10. Two qualifiers of three rounds each; every round is
// eleven matches of cumulative points. Round 1 cuts to the top 1,000, Round 2
// to the top 300, Round 3 to the top 25, and those 25 play a six-match Finals
// for the last Global Championship seats (EU 3, NAC 2, one each elsewhere).
//
// The simulation starts at Round 2 on purpose: the rules let a duo skip Round 1
// outright when both players sit in the top 2,000 of the Power Rankings, and
// everybody holding a Major card qualifies for that. So the field here is the
// 1,000 teams Round 1 feeds into — real cards from the region first, then open
// qualifier entrants, exactly as the bracket fills up in practice.
// Two qualifiers, three rounds each, and BOTH feed the same Finals: the top 25
// of Qualifier 1 plus the top 25 of Qualifier 2 make a 50-duo, six-game Finals.
// The event used to model a single qualifier, which is why its Finals only ever
// had 25 teams in it.
const GCLC_R2_FIELD=1000, GCLC_R3_FIELD=300, GCLC_QUAL_CUT=25;
const GCLC_QUALIFIERS=2;
const GCLC_FINALS_FIELD=GCLC_QUAL_CUT*GCLC_QUALIFIERS;   // 50
const GCLC_ROUND_GAMES=11, GCLC_FINALS_GAMES=6;

// `you` may be null — Qualifier 2 is built and played without the player when
// they already came through Qualifier 1.
// The Last Chance Major is open to the whole region — including everyone who
// already holds a Global Championship seat. This used to lock them out on the
// grounds that they had "nothing left to play for", which was wrong twice over:
// the event pays real money down to 50th ($20,000 for the win, $200 at the
// bottom), so a qualified team has every reason to enter, and entering costs
// nobody anything because a team that is already going cannot take a second
// seat — its place rolls down. Keeping them out produced a field of nothing but
// unknowns and quietly deleted the region's best duos from their own event.
function gclcBuildField(you, region, size, excludeHandles){
  const used=new Set();
  if(you) you.squad.forEach(p=>used.add(hKey(p)));
  const field=you ? [you] : [];
  // excludeHandles are duos already seated in THIS Finals lobby from the other
  // qualifier — nobody plays the same Finals twice. Holding a LAN seat is not a
  // reason to be excluded.
  const already=new Set((excludeHandles||[]).map(_gcNorm));
  const avail=cardRosterPlayers().filter(p=>
    p.region===region && !used.has(hKey(p)) && !already.has(_gcNorm(p.handle)));
  (REALISTIC ? fillRealFieldTeams : fillFieldTeams)(avail, size-field.length, 2, field);
  while(field.length<size){
    const chunk=[makeFiller(), makeFiller()];
    const t=buildTeam(chunk); t.loadout=randomLoadoutBonus(chunk.length); t.pow+=t.loadout;
    t.name=teamLabel(chunk); field.push(t);
  }
  return field;
}

const gclcByPoints=(a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims;

// A whole qualifier resolved with no UI — used for Qualifier 2 when the player
// already got through Qualifier 1, and for both of them when the player is out
// of the event entirely but its seats still have to be handed to somebody.
async function computeQuietGclcQualifier(region, excludeHandles){
  const field=gclcBuildField(null, region, GCLC_R2_FIELD, excludeHandles);
  await simulateGamesRandomLobbies(field, GCLC_ROUND_GAMES, TEAM_TARGET[squadSize]||50, lcqRound1PointsForPlace, 1);
  let pool=field.slice().sort(gclcByPoints).slice(0, GCLC_R3_FIELD);
  await simulateGamesRandomLobbies(pool, GCLC_ROUND_GAMES, TEAM_TARGET[squadSize]||50, lcqRound1PointsForPlace, 1);
  return pool.slice().sort(gclcByPoints).slice(0, GCLC_QUAL_CUT);
}

// Hand out the region's remaining Global Championship seats. A duo that already
// holds one — the player who came through the Grand Finals, most obviously —
// keeps its finishing position but cannot take a second seat, so the seat rolls
// down to the next duo that isn't going yet, and keeps rolling if that one is
// already in too.
// Who is already going to the season's LAN before this Major is played. In 2026
// that is the fifteen duos that came through the Major 1 Summit; in 2025 the
// trios that took a Global Championship seat out of an earlier Major, which by
// Major 3 means both of them. Major 1 has nobody above it, so nothing is held.
function lanSeatHoldersForSet(){
  return CARD_SET==='m2' ? GC_SUMMIT_DUOS
       : CARD_SET==='t2' ? GC2025_M1_TRIOS
       : CARD_SET==='t3' ? GC2025_M1_TRIOS.concat(GC2025_M2_TRIOS)
       // 2024: места в Форт-Уэрт давали все три Мейджора — к третьему заняты дуо первых двух.
       : CARD_SET==='f2' ? GC2024_M1_DUOS
       : CARD_SET==='f3' ? GC2024_M1_DUOS.concat(GC2024_M2_DUOS) : [];
}
let _LAN_SEAT_HANDLES=null, _LAN_SEAT_SET_FOR=null;
function lanSeatHandles(){
  if(_LAN_SEAT_SET_FOR===CARD_SET && _LAN_SEAT_HANDLES) return _LAN_SEAT_HANDLES;
  _LAN_SEAT_HANDLES=new Set();
  lanSeatHoldersForSet().forEach(team=>team.forEach(h=>_LAN_SEAT_HANDLES.add(_gcNorm(h))));
  _LAN_SEAT_SET_FOR=CARD_SET;
  return _LAN_SEAT_HANDLES;
}
// One player of a locked team is enough: the seat belongs to the team, and the
// team is whoever they are entered with — the substitution rules already hold
// them together.
//
// Your own squad is asked a stricter question, and the difference is not a
// special case for the player — it is that the two are different claims. A bot
// team IS one of the entered rosters, so any member of it identifies the seat.
// Your squad might be anything: in a draft run it is assembled card by card, and
// under the loose rule drafting one half of Sky & Scroll would hand you a seat
// at the Global Championship for having picked a name. So yours counts only when
// the whole roster is one of the locked teams — which is exactly what picking
// that team in a realistic run gives you, and what no draft run reaches by
// accident.
/* Чей это вечер отвечает на вопрос «место у него уже есть?».

   Обычно это Глобалы, и отвечает список ниже. У финала Reload место своё —
   Championship круга, — и своя память о том, кому его уже отдали; на время
   своей таблицы он ставит сюда свою проверку и гасит её сразу после, как это
   делает CC_RANK_SCALE. См. ccRelHoldsSeat. */
let CC_REL_HELD=null;
function holdsLanSeat(t){
  if(!t) return false;
  if(CC_REL_HELD) return CC_REL_HELD(t);
  /* Своё место, выигранное Саммитом ЭТОГО года (режим «весь год»). Список
     настоящих дуо ниже его не знает и знать не может: там записано, кто взял
     топ-15 Дюссельдорфа на самом деле, а здесь состав играл свой Саммит сам.

     Три условия, и каждое закрывает свою дверь. YEAR_KEY — чтобы флаг,
     оставшийся от брошенного года, не всплыл в обычном забеге Мейджора 2:
     драфт его гасит сам (см. startDraft), карьера — нет, она мимо. CARD_SET —
     потому что место действует в Антверпене, а не на круге, где его выиграли.
     CAREER_RUN — потому что у карьеры своё место на LAN и свой учёт. */
  if(t.isYou && YEAR_SEAT && YEAR_KEY && (CARD_SET==='m2' || CARD_SET==='f2' || CARD_SET==='f3')
     && !(typeof CAREER_RUN!=='undefined' && CAREER_RUN)) return true;
  const held=lanSeatHandles();
  if(!held.size) return false;
  if(!t.isYou) return (t.squad||[]).some(p=>held.has(_gcNorm(p.handle)));
  return youAreALockedTeam(t);
}
function youAreALockedTeam(t){
  const mine=(t.squad||[]).map(p=>_gcNorm(p.handle)).sort();
  if(!mine.length) return false;
  return lanSeatHoldersForSet().some(team=>{
    const theirs=team.map(h=>_gcNorm(h)).sort();
    return theirs.length===mine.length && theirs.every((h,i)=>h===mine[i]);
  });
}

// A seat is won by the highest-placed team that does not already have one. Epic
// writes it the same way for every leaderboard that advances anybody: a team
// already through keeps its placement and its prize money, and its advancement
// spot passes to the next team in that region without one. Used by the Last
// Chance and by the regional Grand Finals alike.
function awardSeats(ranked, slots, holdsSeat){
  const seats=[];
  for(const t of ranked){
    if(seats.length>=slots) break;
    if(holdsSeat(t)) continue;
    seats.push(t);
  }
  return seats;
}
const gclcAwardSeats=awardSeats;

// One qualifier round: eleven matches in reshuffled 50-team lobbies, resolved
// to a standings card rather than played out live — a thousand teams over
// eleven games is not something worth watching row by row.
async function gclcRound(you, field, title, cut, note){
  await simulateGamesRandomLobbies(field, GCLC_ROUND_GAMES, TEAM_TARGET[squadSize]||50, lcqRound1PointsForPlace, 1);
  const ranked=field.slice().sort(gclcByPoints);
  const rank=ranked.indexOf(you)+1;
  const passed=rank<=cut;
  const shell=createStageCardShell(title);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, rank, field.length, you.stagePts, passed, false, note);
  await revealStandings(shell, ranked, you, cut);
  return {ranked, rank, passed};
}

// The Last Chance Major is the region's event, not the player's personal
// consolation bracket: it runs after the Grand Finals whether or not the player
// already has a seat, and its Finals hands out the region's remaining Global
// Championship places either way.
//
// opts.alreadyQualified — the player took a seat in the Grand Finals. They may
//   still enter, but cannot win a second seat (see gclcAwardSeats).
// opts.seatHandles      — handles that already hold a seat, so they neither
//   enter as bots nor take a seat if they somehow end up in the standings.
async function runGcLastChance(you, region, opts){
  opts=opts||{};
  const slots=GCLC_GC_SLOTS[region]||0;
  const alreadyQualified=!!opts.alreadyQualified;
  // Everyone who already has a seat in Antwerp, by whatever route: the duos off
  // the Major 1 Summit, this region's Major 2 qualifiers, and whoever just took
  // the region's places in the Grand Finals you played. They all enter and they
  // all get paid for where they finish — they simply cannot win a second seat.
  const seatHandles=new Set((opts.seatHandles||[]).map(_gcNorm));
  GC_SUMMIT_DUOS.forEach(d=>d.forEach(hd=>seatHandles.add(_gcNorm(hd))));
  (GC_MAJOR2_DUOS[region]||[]).forEach(d=>d.forEach(hd=>seatHandles.add(_gcNorm(hd))));
  const holdsSeat=t=>{
    if(t===you) return alreadyQualified;
    return (t.squad||[]).some(p=>seatHandles.has(_gcNorm(p.handle)));
  };
  // Nobody is barred from entering; this only stops a duo playing both qualifiers.
  const exclude=[];

  const container=document.getElementById('majorStages');
  const intro=document.createElement('div');
  intro.className='stage-card';
  intro.innerHTML=`<h4>${L().gclcTitle}</h4>
    <div class="stage-detail">${alreadyQualified
      ? L().gclcIntroQualified(regionName(region), slots)
      : L().gclcIntro(regionName(region), slots)}</div>`;
  container.appendChild(intro);
  intro.scrollIntoView({block:'center', behavior:'smooth'});
  await sleep(600);
  ensureSkipButton();

  // Both qualifiers are three rounds. The player plays them in order and stops
  // as soon as one of them puts them in the Finals; whichever they did not play
  // is resolved quietly so the other 25 Finals seats are real results too.
  const qualifierTops=[];
  let youIn=false, lastRank=0, lastTotal=0, lastStage=2;
  // A duo that has already taken a Finals seat is done — it does not enter the
  // next qualifier. Carrying its handles forward is also what keeps the two
  // 25-team blocks from overlapping: both qualifiers draw from the same regional
  // card pool, so without this the same duo turns up in both and gets thrown out
  // when the Finals lobby is assembled, leaving a short field.
  const claimed=exclude.slice();
  const claim=list=>list.forEach(t=>(t.squad||[]).forEach(p=>claimed.push(p.handle)));
  for(let q=1; q<=GCLC_QUALIFIERS; q++){
    if(youIn){
      const quiet=await computeQuietGclcQualifier(region, claimed);
      qualifierTops.push(quiet); claim(quiet); continue;
    }
    const label=L().gclcQualLabel(q);
    const r2Field=gclcBuildField(you, region, GCLC_R2_FIELD, claimed);
    const r2=await gclcRound(you, r2Field, label+' · '+L().gclcRound2Title(r2Field.length),
      GCLC_R3_FIELD, L().gclcCutNote(GCLC_R3_FIELD));
    lastRank=r2.rank; lastTotal=r2Field.length; lastStage=2;
    if(!r2.passed){
      // You are out of this qualifier, but it still sends its own 25 through.
      const top=r2.ranked.slice(0, GCLC_QUAL_CUT);
      qualifierTops.push(top); claim(top); continue;
    }

    const r3Field=r2.ranked.slice(0, GCLC_R3_FIELD);
    const r3=await gclcRound(you, r3Field, label+' · '+L().gclcRound3Title(r3Field.length),
      GCLC_QUAL_CUT, L().gclcCutNote(GCLC_QUAL_CUT));
    lastRank=r3.rank; lastTotal=r3Field.length; lastStage=3;
    const top=r3.ranked.slice(0, GCLC_QUAL_CUT);
    qualifierTops.push(top); claim(top);
    if(r3.passed) youIn=true;
  }

  // Finals: 25 from each qualifier, six matches. Dedupe by handle rather than by
  // object — the landing picker rebuilds the lobby on the same rule, so a pair
  // that slipped through here would silently vanish from the field there.
  const finals=[], inFinals=new Set();
  qualifierTops.forEach(list=>list.forEach(t=>{
    if(finals.length>=GCLC_FINALS_FIELD) return;
    const handles=(t.squad||[]).map(p=>_gcNorm(p.handle));
    if(handles.some(h=>inFinals.has(h))) return;
    handles.forEach(h=>inFinals.add(h));
    finals.push(t);
  }));
  // Финал Ласт Ченса Глобалов: три отбора играются по очереди, и топ-25
  // первого прошёл раньше топ-25 третьего — в этом порядке finals и собран.
  stampQualSeats(finals);
  const zones = youIn ? await stageLandingPicker(finals, you, L().finalsLandingTitle) : null;
  const shell=createStageCardShell(L().gclcFinalsTitle(finals.length, GCLC_FINALS_GAMES));
  if(youIn){
    await simulateGamesLive(finals, GCLC_FINALS_GAMES, pointsForPlace, 4, 'stage', 0, null, zones,
      {mapReplay:true, choices:true, stageName:L().liveGclcFinals});
  } else {
    // Player is out, but the event still decides who takes the seats.
    simulateGames(finals, GCLC_FINALS_GAMES, pointsForPlace, 4);
  }
  const ranked=summitStandings(finals);
  const seats=gclcAwardSeats(ranked, slots, holdsSeat);
  // Highlight who really got a seat rather than the top N. A duo that was
  // already qualified keeps its finishing position and whatever the placement
  // pays, but the seat itself passed down — so the table has to show the seat
  // sitting further down than the standings order would suggest.
  const seatSet=new Set(seats);
  const seatCut=seats.length ? ranked.indexOf(seats[seats.length-1])+1 : slots;
  // The line the table draws is where the last seat actually landed, which is
  // not the same as the number of seats: a region with one seat can see it roll
  // past two already-qualified duos and settle on third. Labelling that line
  // "top 3 advance" reads as three seats, so when it has rolled the label says
  // how many seats there really were and why the line is where it is.
  const seatCutLabel = seatCut>slots ? L().gclcSeatCutRolled(slots, seatCut) : null;

  if(!youIn){
    finalizeStageCard(shell, 0, finals.length, 0, false, false, L().gclcOutNote);
    await revealStandings(shell, ranked, you, seatCut, null, seatSet, 'GCLC', seatCutLabel);
    removeSkipButton();
    return {advanced:false, stage:lastStage, rank:lastRank, total:lastTotal, qualifiers:seats};
  }

  const rank=ranked.indexOf(you)+1;
  const wonSeat=seats.includes(you);
  // The Last Chance is the other road to the same LAN, so it overwrites what the
  // Grand Finals recorded — this is the later, final answer on whether you go.
  if(wonSeat || !alreadyQualified){
    recordLanSeat(L().lanBelgium, wonSeat || alreadyQualified,
      L().lanSeatDetailLcq(rank, slots));
  }
  const rolledDown=!wonSeat && alreadyQualified && rank<=slots;
  await revealStageLog(you, shell, true);
  const note = wonSeat ? L().gclcPass(rank, slots)
    : rolledDown ? L().gclcSeatRolls(rank, (seats[seats.length-1]||{}).name || '-')
    : alreadyQualified ? L().gclcAlreadyIn
    : L().gclcFail(slots);
  finalizeStageCard(shell, rank, finals.length, you.stagePts, wonSeat||alreadyQualified, you.gotVR, note);
  await revealStandings(shell, ranked, you, seatCut, null, seatSet, 'GCLC', seatCutLabel);
  removeSkipButton();
  // The Last Chance Finals pay on their own table whether or not the seat comes
  // with them, which is the whole reason an already-qualified duo turns up.
  recordEarning(L().prizeGclc(rank), prizeFor('GCLC', rank));
  return {advanced:wonSeat, rank, total:finals.length, stage:'finals', qualifiers:seats};
}

async function runGlobalChampionship(you, regionRank, region, lcqWinners, regionalFinal){
  const container=document.getElementById('majorStages');
  const intro=document.createElement('div');
  intro.className='stage-card';
  intro.innerHTML=`<h4>${L().gcQualifiedTitle}</h4>
    <div class="stage-detail">${L().gcQualifiedNote(regionName(region), regionRank, MAJOR2_GC_SLOTS[region]||0)}</div>`;
  container.appendChild(intro);
  intro.scrollIntoView({block:'center', behavior:'smooth'});
  await celebrate(L().celKicker, L().celWorldsTitle, L().celWorldsSub, 'gold', 70, 'be');
  ensureSkipButton();

  const field=buildGlobalChampionshipField(you, region, lcqWinners, regionalFinal);
  renderGcFieldCard(field);
  if(!skipAnimation) await sleep(900);

  // Антверпен: очередь задаёт маршрут (gcRoute), а не порядок сборки поля —
  // саммитовские места первыми, потом Мейджор 2, потом Ласт Ченс. Снимок его бы
  // затёр, поэтому queue:false.
  // Антверпен: очередь задаёт маршрут (gcRoute), а не порядок сборки поля —
  // саммитовские места первыми, потом Мейджор 2, потом Ласт Ченс. Жетон его бы
  // затёр, поэтому здесь его не ставят.
  const zones=await showFinalsLandingPicker(field, you);
  const shell=createStageCardShell(L().gcStageTitle(GC_GAMES));
  await simulateGamesLive(field, GC_GAMES, pointsForPlace, 4, 'stage', 0, null, zones,
    {twoDay:true, mapReplay:true, choices:true, stageName:L().liveWorlds});
  const ranked=summitStandings(field);
  const rank=ranked.indexOf(you)+1;
  await revealStageLog(you, shell, true);
  // Мировой финал — последняя комната года: чемпион или нет, а «вылета» из
  // неё не существует. См. finalizeStageCard.
  finalizeStageCard(shell, rank, field.length, you.stagePts, rank===1 ? true : null, you.gotVR,
    rank===1 ? L().gcChampion : L().gcPlaceNote(rank));
  await revealStandings(shell, ranked, you, 0);
  removeSkipButton();
  if(rank===1) await celebrate(L().celKicker, L().celWorldChampTitle, L().celWorldChampSub, 'gold', 160);
  return {ranked, rank, total:field.length, champion:rank===1};
}

// ---------- FNCS 2025 Global Championship (Lyon) ----------
// The 2025 season ends the way 2026's two halves do: a seat in your Major 3
// Grand Final puts you on the plane. Lyon is one cumulative leaderboard over 12
// games, so it is the Antwerp shape rather than the Düsseldorf bracket.

// The Lyon field is written in Liquipedia's clean nicknames while the card pool
// carries Tracker's raw in-game names, so the lookup normalises both. Only the
// 2025 sets are indexed: every one of the 99 players at that LAN has a card from
// the Majors they played that year, and a 2026 card of the same person is a
// different result on a different season.
let _GC2025_INDEX=null;
function gc2025CardIndex(){
  if(_GC2025_INDEX) return _GC2025_INDEX;
  _GC2025_INDEX={};
  PLAYERS.filter(p=>p.tier==='cardmode' && (p.cardSet==='t1'||p.cardSet==='t2'||p.cardSet==='t3'))
    .forEach(p=>{
      const k=_gcNorm(p.handle);
      // Prefer the strongest card the person holds across the three Majors: the
      // trio in Lyon is the one that just won a seat, not the one that went out
      // in a Play-In in January.
      if(!_GC2025_INDEX[k] || p.rating>_GC2025_INDEX[k].rating) _GC2025_INDEX[k]=p;
    });
  return _GC2025_INDEX;
}
function gc2025FindCard(handle, region, fallbackRating){
  const idx=gc2025CardIndex();
  const key=_gcNorm(handle);
  const hit=idx[key] || idx[_gcNorm(GC_HANDLE_ALIAS[key]||'')];
  if(hit) return hit;
  // Nobody in the 2025 pool by that name — the seat was won at an event whose
  // leaderboard was never imported. Keep the real person, rate them by the route
  // they came through rather than dropping them from the field.
  return {handle, nat:null, region:region||'EU', rating:fallbackRating,
          rarity:rarityForRating(fallbackRating), tier:'cardmode', cardSet:CARD_SET,
          event:'FNCS 2025 Global Championship', placement:null};
}
// Which region a real trio took its seat in. The field list does not say, so it
// is read off the players' own cards — the region a card carries is the region
// that leaderboard was played in.
function gc2025RegionOf(handles){
  const idx=gc2025CardIndex();
  const votes={};
  handles.forEach(h=>{ const c=idx[_gcNorm(h)]; if(c && c.region) votes[c.region]=(votes[c.region]||0)+1; });
  let best=null;
  Object.keys(votes).forEach(r=>{ if(best===null || votes[r]>votes[best]) best=r; });
  return best;
}
function gc2025BuildTeam(handles, region, route, rating){
  const squad=handles.map(hd=>gc2025FindCard(hd, region, rating));
  const t=buildTeam(squad);
  t.loadout=randomLoadoutBonus(squad.length); t.pow+=t.loadout;
  t.name=teamLabel(squad);
  t.gcRoute=route; t.summitRegion=region||gc2025RegionOf(handles);
  return t;
}

// 33 trios: the eight that came out of Major 1 and the thirteen out of Major 2
// exactly as they were, and twelve Major 3 seats — yours, the ones your own
// region's final produced alongside you, and the real trios you did not displace.
function buildGlobalChampionship2025Field(you, region, regionalFinal){
  const field=[];
  const seated=new Set();
  (you.squad||[]).forEach(p=>seated.add(_gcNorm(p.handle)));
  const seatReal=(trios, route, rating)=>{
    trios.forEach(t=>{
      // A trio the player broke into cannot fly as itself. Rule 4.1.7 already
      // rebuilt it for this Major, so the seat travels with whoever they
      // actually entered alongside; with no substitute recorded the seat is
      // simply released and the fill below picks it up.
      if(t.some(h=>seated.has(_gcNorm(h)))){
        const solo=t.find(h=>!seated.has(_gcNorm(h)));
        const sub=solo && LOCKED_TEAM_SUBS.get(_gcNorm(solo));
        if(!sub) return;
        const names=sub.map(pl=>pl.handle);
        if(names.some(h=>seated.has(_gcNorm(h)))) return;
        names.forEach(h=>seated.add(_gcNorm(h)));
        field.push(gc2025BuildTeam(names, gc2025RegionOf(names), route, rating));
        return;
      }
      t.forEach(h=>seated.add(_gcNorm(h)));
      field.push(gc2025BuildTeam(t, gc2025RegionOf(t), route, rating));
    });
  };
  seatReal(ccGcList('GC2025_M1_TRIOS', GC2025_M1_TRIOS), 'm1', 90);
  seatReal(ccGcList('GC2025_M2_TRIOS', GC2025_M2_TRIOS), 'm2', 88);

  // Major 3's seats. Your region sends what section 6 allocates it, and those
  // teams are the ones you just played against — the rest of the Major's places
  // go to the real trios from the other regions, then to any of your own
  // region's real trios you did not take a seat from.
  const mySeats=GC2025_M3_SEATS[region]||1;
  const m3Total=GC2025_FIELD_SIZE-field.length-1;      // minus your own seat
  // Your own seat came out of Major 3 like the rest of this block, and the drop
  // queue reads gcRoute to decide who picks when. Leaving it unset filed you
  // behind all thirty-two of them, which is not where you qualified: measured,
  // picking dead last put the player on an occupied box in every single game —
  // a 33-team room has more teams than boxes — and took the average finish from
  // 5.8 to 11th with no title in sixty runs. Booked through Major 3, you pick
  // with Major 3.
  you.gcRoute='m3';
  const mine=[];
  (regionalFinal||[]).forEach(t=>{
    if(t===you || mine.length>=mySeats-1) return;
    if((t.squad||[]).some(pl=>seated.has(_gcNorm(pl.handle)))) return;
    (t.squad||[]).forEach(pl=>seated.add(_gcNorm(pl.handle)));
    t.gcRoute='m3'; t.summitRegion=region;
    mine.push(t);
  });
  mine.forEach(t=>field.push(t));

  const realM3=ccGcList('GC2025_M3_TRIOS', GC2025_M3_TRIOS).map(t=>({handles:t, region:gc2025RegionOf(t)}));
  const others=realM3.filter(t=>t.region!==region);
  const home=realM3.filter(t=>t.region===region);
  [...others, ...home].forEach(t=>{
    if(field.length>=GC2025_FIELD_SIZE-1) return;
    if(t.handles.some(h=>seated.has(_gcNorm(h)))) return;
    t.handles.forEach(h=>seated.add(_gcNorm(h)));
    field.push(gc2025BuildTeam(t.handles, t.region, 'm3', 86));
  });

  // Whatever the real field could not fill — the player displaced somebody and
  // no substitute was recorded — comes off the same card pool the Major itself
  // was drafted from, so the lobby is always the published size.
  if(field.length<GC2025_FIELD_SIZE-1){
    const taken=new Set();
    field.forEach(t=>t.squad.forEach(p=>taken.add(hKey(p))));
    (you.squad||[]).forEach(p=>taken.add(hKey(p)));
    const avail=cardRosterPlayers().filter(p=>!taken.has(hKey(p)));
    const before=field.length;
    (REALISTIC ? fillRealFieldTeams : fillFieldTeams)(avail, GC2025_FIELD_SIZE-1-field.length, 3, field);
    for(let i=before;i<field.length;i++){
      field[i].gcRoute='m3';
      field[i].summitRegion=(field[i].squad[0]||{}).region||null;
    }
  }
  you.gcRoute='m3'; you.summitRegion=region;
  const capped=field.slice(0, GC2025_FIELD_SIZE-1);
  capped.push(you);
  return capped;
}

function renderGc2025FieldCard(field, title, note){
  const container=document.getElementById('majorStages');
  const card=document.createElement('div');
  card.className='stage-card';
  const group=route=>field.filter(t=>t.gcRoute===route);
  const rowFor=(t,label)=>`<tr class="lobby-row${(t.isYou||t.isClub)?' lobby-you':''}">
      <td>${(t.isYou||t.isClub)?'<b style="color:var(--lb-you);">'+t.name+'</b>':t.name}</td>
      <td class="num" style="color:var(--ink-dimmer);font-size:12px;">${label}</td></tr>`;
  const section=(title, teams, label)=>teams.length ? `<div style="margin-top:14px;">
      <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:4px;">
        ${title} <span style="color:var(--ink-dimmer);font-weight:600;">(${teams.length})</span></div>
      <div class="lobby-wrap"><table class="lobby-table"><tbody>
        ${teams.map(t=>rowFor(t,label)).join('')}</tbody></table></div></div>` : '';
  card.innerHTML=`<h4>${title||L().gc2025FieldTitle}</h4>
    <div class="stage-detail">${note||L().gc2025FieldNote}</div>
    ${section(L().gc2025RouteM1, group('m1'), L().gc2025RouteM1Short)}
    ${section(L().gc2025RouteM2, group('m2'), L().gc2025RouteM2Short)}
    ${section(L().gc2025RouteM3, group('m3'), L().gc2025RouteM3Short)}`;
  container.appendChild(card);
  card.scrollIntoView({block:'start', behavior:'smooth'});
}

async function runGlobalChampionship2025(you, regionRank, region, regionalFinal){
  const container=document.getElementById('majorStages');
  const intro=document.createElement('div');
  intro.className='stage-card';
  intro.innerHTML=`<h4>${L().gc2025QualifiedTitle}</h4>
    <div class="stage-detail">${L().gc2025QualifiedNote(regionName(region), regionRank, GC2025_M3_SEATS[region]||0)}</div>`;
  container.appendChild(intro);
  intro.scrollIntoView({block:'center', behavior:'smooth'});
  await celebrate(L().celKicker, L().celLyonTitle, L().celLyonSub, 'gold', 70, 'fr');
  ensureSkipButton();

  const field=buildGlobalChampionship2025Field(you, region, regionalFinal);
  renderGc2025FieldCard(field);
  if(!skipAnimation) await sleep(900);

  // Лион — то же самое: маршрут (m1/m2/m3) уже стоит на каждом дуо.
  /* Лион играли на Chapter 6 Season 4 (с 7.08), а Мейджор 3 — ещё на третьем сезоне (Notion 26.10.26: «карта не того сезона»).
     Остров, пул оружия и расходников — на время Лиона, потом прежний. */
  const prevSet=ACTIVE_LANDING_SET;
  if(ZONE_SETS.t4){ useLandingSet('t4'); LOOT_ISLAND_NOW='t4'; }
  let zones, shell;
  try{
  zones=await showFinalsLandingPicker(field, you);
  shell=createStageCardShell(L().gc2025StageTitle(GC2025_GAMES));
  // Four points an elimination — the value measured on all seven of the season's
  // Grand Finals (T1_KILL.G). The LAN's own payload was never imported, so this
  // is the season's final-stage ladder rather than a number read off Lyon.
  await simulateGamesLive(field, GC2025_GAMES, pointsForPlace, T1_KILL.G, 'stage', 0, null, zones,
    {twoDay:true, mapReplay:true, choices:true, stageName:L().liveWorlds2025});
  } finally { LOOT_ISLAND_NOW=null; useLandingSet(prevSet); }
  const ranked=summitStandings(field);
  const rank=ranked.indexOf(you)+1;
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, rank, field.length, you.stagePts, rank===1 ? true : null, you.gotVR,
    rank===1 ? L().gc2025Champion : L().gc2025PlaceNote(rank));
  await revealStandings(shell, ranked, you, 0, null, null, 'GC2025');
  removeSkipButton();
  if(rank===1) await celebrate(L().celKicker, L().celWorldChampTitle, L().celWorldChamp2025Sub, 'gold', 160);
  return {ranked, rank, total:field.length, champion:rank===1};
}

function lowerBracketQualifiers(lower){
  const ranked=summitStandings(lower);
  const through=ranked.filter(t=>t.gotVR);
  ranked.forEach(t=>{ if(through.length<25 && !through.includes(t)) through.push(t); });
  return through.slice(0, 25);
}

// Same bracket without any UI, for when you skipped Day 2 by finishing top 25.
function computeQuietLowerBracket(dropped, scq){
  const lower=[...dropped, ...scq].slice(0, 50);
  if(lower.length<2) return [];
  simulateGames(lower, 6, pointsForPlace, 4);
  return lowerBracketQualifiers(lower);
}


function renderGameHistory(you){
  const body=document.getElementById('historyBody');
  if(!body) return;
  body.innerHTML='';
  you.gameLog.forEach(g=>{
    const tr=document.createElement('tr');
    const gameLabel = g.isLandingBonus ? '🪂' : (L().gameWord+' '+g.game);
    const placeLabel = g.place!=null ? '#'+g.place : '-';
    tr.innerHTML=`<td>${gameLabel}</td><td class="num">${placeLabel}</td><td class="num">${g.elims}</td><td class="num">${g.pts}</td>`;
    body.appendChild(tr);
  });
  const totalTr=document.createElement('tr');
  totalTr.style.fontWeight='800';
  totalTr.innerHTML=`<td>${L().totalWord}</td><td class="num">-</td><td class="num">${you.totalElims}</td><td class="rate">${you.totalPts}</td>`;
  body.appendChild(totalTr);
  animateRows(body.closest('.lobby-wrap') || body.parentElement.parentElement);
}

// Regional strength multiplier, based on how each region has actually
// performed at real LANs/Global Championships — EU and NAC have been the
// two dominant regions; everywhere else trails behind by varying degrees.
// Read off where each region's players actually finished at the Major 1 Summit
// — the one event that puts all seven regions in the same lobby. Every one of
// the 99 players in the Summit standings resolves to a card, so this is the
// complete field, not a sample of it:
//
//   region   players   mean finish (of 50)
//   EU          44          21.1
//   NAC         30          22.6
//   BR           5          32.0
//   OCE          6          34.7
//   ME           6          38.3
//   ASIA         6          42.7
//
// EU and NA Central anchor at 1.0 — they are the two strongest by the data and
// what the rest are measured against. Everyone else drops by 0.6 of the gap
// between their normalised finish and that anchor.
//
// NA West is the exception: its Summit sample is one duo, whose #22 finish would
// read as EU-level strength off a single night. It keeps its standing value,
// below the two anchors like the rest.
//
// The hand-set numbers this replaces were already close — only Brazil and
// Oceania move, by 0.03 and 0.01.
const REGION_POW_MULT={EU:1, NAC:1, NAW:0.93, BR:0.88, OCE:0.84, ME:0.8, ASIA:0.75, GEN:0.85, UNK:0.85};
function regionMultFor(p){
  const region = p.region || regionForNatOrUnknown(p.nat);
  const m = REGION_POW_MULT[region];
  return m!=null ? m : 0.85;
}
// What ping is worth to a team up close. It is a property of the players, so a
// duo where only one of the two is a career player carries half of that player's
// edge — a card with no connection of its own brings nothing either way.
function closeRangeEdge(squadArr){
  if(!squadArr || !squadArr.length) return 0;
  return squadArr.reduce((s,p)=>s+(p && p._pingEdge || 0),0)/squadArr.length;
}
// Age works the same way but on the whole number, not just the fighting half.
// Roster cards carry no age, so they contribute nothing and the field is unmoved.
function ageEdgeOf(squadArr){
  if(!squadArr || !squadArr.length) return 0;
  return squadArr.reduce((s,p)=>s+(p && p._ageEdge || 0),0)/squadArr.length;
}
// What the zone engine reads off a team. It asks for four attributes by name —
// END, SUR, AIM, CLU — and quietly falls back to 50 for anything missing, so a
// team built without them is not a weak team, it is an average one: every squad
// in the lobby rotates identically, seeks fights identically, and looks equally
// worth attacking. Only the duel could still tell a 96 from a 60, which is why
// the leader used to finish 17th on average in a field it outclassed.
//
// The calibration harness sets these by hand, which is how the whole engine
// suite stayed green while the app played a lobby of clones. tools/check-engine-inputs.js
// checks this bridge rather than the engine.
//
// A squad's number is its cards averaged: the engine wants one 0-100 per team.
function engineAttrs(squadArr){
  if(!squadArr || !squadArr.length) return null;
  const mean = k => Math.round(squadArr.reduce((s,p)=>s+attrsFor(p)[k],0)/squadArr.length);
  return {END:mean('end'), SUR:mean('sur'), AIM:mean('aim'), CLU:mean('clu')};
}

function buildTeam(squadArr){
  const syn = computeSynergy(squadArr);
  const avg = Math.round(squadArr.reduce((s,p)=>s+p.rating,0)/squadArr.length);
  const regionMult = squadArr.reduce((s,p)=>s+regionMultFor(p),0)/squadArr.length;
  // Synergy is scored per pair, and squad mode has up to 6 pairs (vs 1 in
  // duo, 3 in trio) — so a squad where everyone is real teammates could
  // stack 70+ raw synergy bonus, versus duo's max of roughly a dozen. Left
  // uncapped that turns into wildly inflated power for squad specifically.
  // Capping the amount synergy can add to power (not the displayed number,
  // which still shows the full total) keeps it a meaningful edge without
  // letting it single-handedly double a squad's power.
  const powSynergy=Math.min(syn.bonus, SYN_POW_CAP);
  const ageEdge = ageEdgeOf(squadArr);
  let pow = Math.round((avg+powSynergy)*regionMult + ageEdge);
  if(CARD_MODE){
    // In card mode the six attributes drive power: a squad's OVR average sets the
    // baseline, and covering both roles — there are two, IGL and fragger — is
    // worth real points, so a split roster beats stacking clones.
    const ovrAvg=squadArr.reduce((s,p)=>s+attrsFor(p).ovr,0)/squadArr.length;
    const roles=new Set(squadArr.map(p=>attrsFor(p).roleKey));
    /* Один ИГЛ, и он один — правило. Раньше платили за то, что
       в составе есть обе роли, и трио из двух ИГЛов и фраггера получало тот же
       плюс, что трио с одним зовущим. Ролей всего две, так что «есть обе»
       читалось как «есть ИГЛ» и молчало про второго. */
    const igls=squadArr.filter(p=>attrsFor(p).roleKey==='roleIGL').length;
    const roleBonus=(squadArr.length>1 && igls===1) ? ROLE_BONUS_STEP : 0;
    pow = Math.round((ovrAvg+powSynergy+roleBonus)*regionMult + ageEdge);
    return {squad:squadArr, syn, pow, regionMult, roles, roleBonus, ovrAvg,
            attrs:engineAttrs(squadArr), closeEdge:closeRangeEdge(squadArr)};
  }
  return {squad:squadArr, syn, pow, regionMult, roleBonus:0,
          attrs:engineAttrs(squadArr), closeEdge:closeRangeEdge(squadArr)};
}

function flagFor(p){ return cardFlag(p, 15); }
function teamLabel(squad){ return squad.map(p=>flagFor(p)+p.handle).join(' & '); }

/* ======================= FNCS CARDS (27.10) =======================
   Режим карточек по идее игрока (Notion 27.10, скрин переписки): паки с настоящими про 2026 года, свой состав дуо /
   трио / сквад с запасными, роли и сыгранность, будничные вечера в дивизионах 10→1 и кап выходных, задачи за монеты
   и паки, рынок с аукционами (покупатели и продавцы — боты). Его решения: дивизионы + кап выходных, только 2026,
   рынок сразу. Всё офлайн, своё сохранение (fncsdraft_sq1); карьеру и драфт не трогает.
   Сила команды — buildTeam в режиме карточек (OVR, сыгранность, ровно один IGL), лобби — simulateGames быстрым
   движком. Ролей в данных две (IGL и фраггер): саппорта у настоящих игроков нет, его не выдумываем.
   Усталость: стартер за вечер теряет 15, запасной и вне состава восстанавливают 25; ниже 60 — минус к силе. Без неё
   запасные ничего бы не значили. */
const SQ_KEY='fncsdraft_sq1';
const SQ_PACKS=[
  {id:'bronze', cost:2000,  n:3, lo:0,    hi:0.55},
  {id:'silver', cost:7500,  n:4, lo:0.25, hi:0.85},
  {id:'gold',   cost:35000, n:4, lo:0.45, hi:1,    top:0.8},
  {id:'elite',  cost:80000, n:3, lo:0.65, hi:1,    top:0.92}
];
const SQ_MIN_OVR=70, SQ_CUP_QUAL=4, SQ_WEEK=5, SQ_DIVS=10, SQ_BENCH=3, SQ_MKT_N=12, SQ_MKT_MS=4*60*1000, SQ_SELL_MS=3*60*1000, SQ_EVE_GAMES=6, SQ_CUP_GAMES=10;
const SQ_OBJ=[
  {id:'packs3', goal:3, cur:s=>s.stat.packs,    r:{coins:2000}},
  {id:'eve5',   goal:5, cur:s=>s.stat.evenings, r:{pack:'silver'}},
  {id:'top10',  goal:1, cur:s=>s.stat.top10,    r:{coins:3000}},
  {id:'win',    goal:1, cur:s=>s.stat.wins,     r:{pack:'gold'}},
  {id:'chem',   goal:1, cur:()=>sqRoleOK() ? 1 : 0, r:{coins:1500}},
  {id:'sell',   goal:1, cur:s=>s.stat.sold,     r:{coins:1000}},
  {id:'qual',   goal:1, cur:s=>(s.stat.best||0)>=1 ? 1 : 0, r:{pack:'gold'}},
  {id:'final',  goal:1, cur:s=>(s.stat.best||0)>=3 ? 1 : 0, r:{pack:'elite'}}
];
const SQ_I18N={
  en:{title:'FNCS Cards', sub:'Real 2026 pros from packs. Build your squad, climb the divisions.', back:'Back',
    coins:'V-Bucks', div:'Division', week:'Week', tabSquad:'Squad', tabPlay:'Play', tabPacks:'Packs', tabMkt:'Market', tabObj:'Objectives',
    fmt:{2:'Duo', 3:'Trio', 4:'Squad'}, starters:'Starters', bench:'Subs', club:'Collection', empty:'Empty slot',
    pow:'Team power', ovr:'Avg OVR', syn:'Synergy', igl:'One IGL: +4', noIgl:'Needs exactly one IGL for the role bonus',
    toXi:'Start', toBench:'Sub', out:'Remove', list:'List', quick:'Quick sell', fit:'Fitness',
    needXi:n=>'Put '+n+' players in the starters to play.', evening:(n,w)=>'Evening '+n+' of '+w, playEve:'Play the evening',
    cup:'Weekend cup', playCup:'Play the weekend cup', weekPts:'Points this week', promoRule:'Points per evening: top 10% 3, top 30% 2, top 60% 1. Week: 9+ up a division, 2 or less down, 4+ qualifies for the weekend cup.',
    you:'Your squad', place:'Place', pts:'Pts', wins:'Wins', elims:'Elims', earned:'Earned',
    up:d=>'Promoted to Division '+d+'!', down:d=>'Relegated to Division '+d+'.', stay:d=>'Staying in Division '+d+'.',
    cupOpen:'Qualified: the weekend cup is open.', newWeek:'A new week starts.', noCup:n=>'Not qualified for the weekend cup (needs '+n+' points).',
    packNames:{bronze:'Bronze', silver:'Silver', gold:'Gold', elite:'Elite'}, buy:'Buy', open:'Open', yourPacks:'Your packs',
    noCoins:'Not enough V-Bucks', gotCards:'From the pack', packDesc:{bronze:'3 players', silver:'4 players', gold:'4 players, one 83+', elite:'3 players, one 87+'},
    mktHint:'Bots bid until the timer runs out. Outbid? Your V-Bucks come back.', bid:'Bid', buyNow:'Buy now', curBid:'Bid', left:'left',
    youTop:'You lead', mySales:'Your listings', soldFor:p=>'Sold for '+p, unsold:'Not sold, back in your collection', listed:'Listed',
    claim:'Claim', claimed:'Done', reward:'Reward',
    obj:{packs3:'Open 3 packs', eve5:'Play 5 evenings', top10:'Finish top 10 in an evening', win:'Win a game', chem:'Field a squad with exactly one IGL',
      sell:'Sell a card on the market', promo:'Get promoted', div5:'Reach Division 5'},
    reset:'Start over', resetAsk:'Start FNCS Cards from scratch? Your cards and V-Bucks will be gone.', welcome:'Your starter pack: one IGL and one fragger, plus 5,000 V-Bucks.'},
  ru:{title:'FNCS Cards', sub:'Настоящие про 2026 года из паков. Собери состав и поднимись по дивизионам.', back:'Назад',
    coins:'V-Bucks', div:'Дивизион', week:'Неделя', tabSquad:'Состав', tabPlay:'Играть', tabPacks:'Паки', tabMkt:'Рынок', tabObj:'Задачи',
    fmt:{2:'Дуо', 3:'Трио', 4:'Сквад'}, starters:'Основа', bench:'Запасные', club:'Коллекция', empty:'Пусто',
    pow:'Сила команды', ovr:'Средний OVR', syn:'Сыгранность', igl:'Один IGL: +4', noIgl:'Для бонуса роли нужен ровно один IGL',
    toXi:'В основу', toBench:'В запас', out:'Убрать', list:'Выставить', quick:'Быстро продать', fit:'Свежесть',
    needXi:n=>'Поставь в основу '+n+' игроков, чтобы играть.', evening:(n,w)=>'Вечер '+n+' из '+w, playEve:'Сыграть вечер',
    cup:'Кап выходных', playCup:'Сыграть кап выходных', weekPts:'Очки недели', promoRule:'Очки за вечер: топ-10% дают 3, топ-30% дают 2, топ-60% дают 1. За неделю: 9 и больше дивизион вверх, 2 и меньше вниз, 4 и больше пускают на кап выходных.',
    you:'Твой состав', place:'Место', pts:'Очки', wins:'Победы', elims:'Киллы', earned:'Заработано',
    up:d=>'Повышение: Дивизион '+d+'!', down:d=>'Понижение: Дивизион '+d+'.', stay:d=>'Остаёшься в Дивизионе '+d+'.',
    cupOpen:'Квалификация есть: открыт кап выходных.', newWeek:'Началась новая неделя.', noCup:n=>'На кап выходных не прошёл (нужно '+n+' очка).',
    packNames:{bronze:'Бронзовый', silver:'Серебряный', gold:'Золотой', elite:'Элитный'}, buy:'Купить', open:'Открыть', yourPacks:'Твои паки',
    noCoins:'Не хватает V-Bucks', gotCards:'Из пака', packDesc:{bronze:'3 игрока', silver:'4 игрока', gold:'4 игрока, один 83+', elite:'3 игрока, один 87+'},
    mktHint:'Боты делают ставки, пока идёт таймер. Перебили твою ставку? V-Bucks вернутся.', bid:'Ставка', buyNow:'Купить сразу', curBid:'Ставка', left:'осталось',
    youTop:'Ты лидируешь', mySales:'Твои лоты', soldFor:p=>'Продано за '+p, unsold:'Не продалось, карточка вернулась', listed:'Выставлено',
    claim:'Забрать', claimed:'Готово', reward:'Награда',
    obj:{packs3:'Открыть 3 пака', eve5:'Сыграть 5 вечеров', top10:'Войти в топ-10 вечера', win:'Выиграть игру', chem:'Выставить состав ровно с одним IGL',
      sell:'Продать карточку на рынке', promo:'Получить повышение', div5:'Дойти до 5-го дивизиона'},
    reset:'Начать заново', resetAsk:'Начать FNCS Cards с нуля? Карточки и V-Bucks пропадут.', welcome:'Стартовый пак: один IGL и один фраггер, плюс 5 000 V-Bucks.'}
};
let SQ=null, SQ_TAB='squad', SQ_POOL=null, SQ_LAST=null, SQ_OPENED=null, SQ_NOTE='', SQ_TIMER=null;
function sqT(){ return (typeof LANG!=='undefined' && SQ_I18N[LANG]) ? Object.assign({}, SQ_I18N.en, SQ_I18N[LANG]) : SQ_I18N.en; }
// Пул — сильнейшая карточка 2026 года (наборы m1/m2) у каждого игрока, копиями: attrsFor кэширует на объекте.
function sqPool(){
  if(SQ_POOL) return SQ_POOL;
  const best=new Map();
  PLAYERS.forEach(p=>{
    if(!p || p.tier!=='cardmode' || !p.handle || (p.cardSet!=='m1' && p.cardSet!=='m2' && p.cardSet!=='s42')) return;
    const k=String(p.handle).toLowerCase()+'|'+(p.region||'');
    const b=best.get(k);
    if(!b || (p.rating||0)>(b.rating||0)) best.set(k, p);
  });
  SQ_POOL=[...best.entries()].map(([k, p])=>{ const c=Object.assign({}, p); delete c._attrs; c._k=k; c._sqOvr=(attrsFor(c)||{}).ovr||0; return c; })
    // От 70 OVR: все в пуле — участники Мейджоров 2026, но нижняя половина (35–69) — безымянный Плей-Ин; с ним
    // стартовый состав выходил из «Avox Rank 1» на 46. Остаётся ~2 270 карточек: бронза — крепкий Плей-Ин, элита — топ.
    .filter(c=>c._sqOvr>=SQ_MIN_OVR).sort((a, b)=>a._sqOvr-b._sqOvr);
  SQ_POOL.byK=new Map(SQ_POOL.map(c=>[c._k, c]));
  return SQ_POOL;
}
function sqCardOf(id){ const inst=(SQ.cards||[]).find(c=>c.id===id); if(!inst) return null; const base=sqPool().byK.get(inst.k); return inst.evo ? sqEvoCard(base, inst) : base; }
/* Эволюция — копия карточки с поднятыми параметрами (27.10): attrsFor берёт готовые _attrs с _floored и не пересчитывает,
   так что прибавка доходит до силы состава, цены и отрисовки. Кэш — по id и уровню эволюции. */
const SQ_EVO_CACHE=new Map();
function sqEvoCard(base, inst){
  if(!base) return null;
  const key=inst.id+'|'+JSON.stringify(inst.evo);
  if(SQ_EVO_CACHE.has(key)) return SQ_EVO_CACHE.get(key);
  const a=Object.assign({}, attrsFor(base));
  let ovr=a.ovr;
  Object.keys(inst.evo.add||{}).forEach(k=>{ if(k==='ovr') ovr+=inst.evo.add[k]; else if(a[k]!=null) a[k]=Math.min(99, a[k]+inst.evo.add[k]); });
  a.ovr=Math.min(99, ovr); a._floored=true;
  const c=Object.assign({}, base, {_attrs:a, _sqOvr:a.ovr, _evo:inst.evo.n||1});
  SQ_EVO_CACHE.set(key, c);
  return c;
}
function sqOvr(c){ return c ? c._sqOvr : 0; }
function sqRole(c){ return c ? (attrsFor(c)||{}).roleKey : ''; }
function sqDraw(lo, hi, role){
  const P=sqPool(), a=Math.floor(lo*P.length), b=Math.max(a+1, Math.floor(hi*P.length));
  for(let i=0; i<300; i++){ const c=P[a+Math.floor(Math.random()*(b-a))]; if(c && (!role || sqRole(c)===role)) return c; }
  return P[a];
}
/* ЦЕНЫ КАК НА НАСТОЯЩЕМ РЫНКЕ КАРТОЧЕК (27.10, его «цены реалистичнее, чтоб топовых игроков сложно было купить»):
   чем выше OVR, тем круче растёт цена — ступенями наклона. 70 → 400, 80 → 2 500, 85 → 11 000, 88 → 27 000,
   90 → 50 000, 92 → 115 000, 96 → 600 000. Сезон стартового состава приносит ~10–15 тысяч, Глобалс — 100 тысяч:
   топ-карточка — цель на несколько сезонов. Округление до двух значащих цифр, как пишут цены на рынке. */
// В паке чаще выпадает низ полосы, верх — изредка (степень 2.2): как в настоящих паках, где джекпот — редкость.
function sqDrawSkew(lo, hi){
  const P=sqPool(), a=lo*P.length, b=hi*P.length;
  return P[Math.min(P.length-1, Math.floor(a+(b-a)*Math.pow(Math.random(), 2.2)))];
}
function sqValue(ovr){
  const d=Math.max(0, ovr-70);
  const v=400*Math.exp(0.183*Math.min(d, 10)+0.3*Math.max(0, Math.min(d, 20)-10)+0.414*Math.max(0, d-20));
  const mag=Math.pow(10, Math.max(2, Math.floor(Math.log10(v))-1));
  return Math.max(100, Math.round(v/mag)*mag);
}
// Быстрая продажа — пятая часть цены: дубль почти ничего не стоит, топа не «отмыть» паками.
function sqQuick(ovr){ return Math.max(50, Math.round(sqValue(ovr)*0.2/10)*10); }
function sqAdd(c, un){ const id='c'+(SQ.next++); SQ.cards.push(un ? {id, k:c._k, un:true} : {id, k:c._k}); return id; }
// Новая карточка: в клуб, а если такой игрок в клубе уже есть — в «Неназначенные» (дубль можно продать или сдать в испытание).
function sqGain(k){ const dup=SQ.cards.some(c=>!c.un && c.k===k); const id='c'+(SQ.next++); SQ.cards.push(dup ? {id, k, un:true} : {id, k}); return id; }
function sqSave(){ try{ localStorage.setItem(SQ_KEY, JSON.stringify(SQ)); }catch(e){} }
function sqLoad(){ try{ const s=JSON.parse(localStorage.getItem(SQ_KEY)||'null'); if(s && s.v===1) return s; }catch(e){} return null; }
function sqNew(){
  SQ={v:1, coins:5000, next:1, cards:[], size:2, xi:[], bench:[], div:SQ_DIVS, week:1, wk:{n:0, pts:0}, cup:false, st:{}, claimed:{},
      packs:[], stat:{packs:0, evenings:0, top10:0, wins:0, sold:0, promos:0}, mkt:{list:[]}, sells:[], sb:{played:0, pts:0}, dr:null};
  SQ.xi.push(sqAdd(sqDraw(0, 0.4, 'roleIGL')));
  SQ.xi.push(sqAdd(sqDraw(0, 0.4, 'roleFRG')));
  SQ_NOTE=sqT().welcome;
  sqSave();
}
function sqStart(){
  SQ=sqLoad(); if(!SQ) sqNew();
  if(!SQ.sb) SQ.sb={played:0, pts:0};
  if(SQ.dr===undefined) SQ.dr=null;
  SQ_TAB='home';
  show('screen-sq');
  sqRender();
}
function sqReset(){ ccAsk(sqT().resetAsk, ()=>{ try{ localStorage.removeItem(SQ_KEY); }catch(e){} sqNew(); SQ_TAB='home'; sqRender(); }); }
function sqFit(id){ const v=SQ.st[id]; return v==null ? 100 : v; }
// Всё, что считает силу и лобби, — в режиме карточек и под размер состава; глобалы возвращаются как были.
function sqWithCards(fn, size){
  const pm=CARD_MODE, ps=squadSize, pf=CC_WORLD_FAST;
  CARD_MODE=true; squadSize=size||SQ.size; CC_WORLD_FAST=true;
  try{ return fn(); } finally{ CARD_MODE=pm; squadSize=ps; CC_WORLD_FAST=pf; }
}
function sqMyTeam(){
  const cards=SQ.xi.map(sqCardOf).filter(Boolean);
  if(cards.length!==SQ.size) return null;
  const t=buildTeam(cards);
  const tired=SQ.xi.reduce((s, id)=>s+Math.max(0, 60-sqFit(id))/10, 0)/SQ.size;
  t.pow=Math.round(t.pow-tired); t.isYou=true; t.name=sqT().you; t.tired=tired;
  return t;
}
function sqRoleOK(){ const cards=(SQ && SQ.xi||[]).map(sqCardOf).filter(Boolean); return cards.length===SQ.size && SQ.size>1 && cards.filter(c=>sqRole(c)==='roleIGL').length===1; }
/* ВЕЧЕР ВЖИВУЮ (27.10, его «симуляция игр пусть будет с таблицей»): игры по одной, после каждой таблица — место за
   игру, киллы, очки, сдвиг в таблице; «Досчитать до конца» доигрывает разом. Ушёл с экрана — вечер доигрывается сам,
   награды не теряются. Очки как в simulateGames: место по таблице Epic плюс киллы. */
let SQ_LIVE=null;
const SQ_LIVE_MS=1100;
function sqRank(ts){ return ts.slice().sort((a, b)=>(b.stagePts-a.stagePts)||(b.wins-a.wins)||(b.stageElims-a.stageElims)); }
/* С КАРТОЙ, как в драфте и карьере (27.10, его «я про симуляцию с картой и таблицей как в драфте или карьере»):
   тот же simulateGamesLive на экране результатов — остров 2026 года, повтор игры на карте, живая таблица, кнопка
   пропуска. Сломалось — вечер доигрывается текстовой таблицей (sqLiveStartTable), награды не теряются. */
async function sqLiveStart(teams, games, size, title, done){
  if(typeof simulateGamesLive!=='function') return sqLiveStartTable(teams, games, size, title, done);
  SQ_LIVE={map:true};
  const pm=CARD_MODE, ps=squadSize, pd=drafted, pf=CC_WORLD_FAST, pSet=ACTIVE_LANDING_SET;
  let ok=false;
  try{
    CARD_MODE=true; squadSize=size; CC_WORLD_FAST=false;
    drafted=(teams.find(t=>t.isYou)||{}).squad||[];
    resetRunRecord();
    document.getElementById('majorStages').innerHTML='';
    const rs=document.getElementById('runSummary'); if(rs) rs.innerHTML='';
    document.getElementById('lobbyBody').innerHTML='';
    document.getElementById('lobbyTitle').textContent='';
    clearEventPanel();
    document.getElementById('finalBanner').style.display='none';
    clearLandingResultsMap();
    skipAnimation=false;
    try{ useLandingSet(ZONE_SETS.m2 ? 'm2' : ACTIVE_LANDING_SET); }catch(e){}
    document.body.classList.add('sq-running');   // кнопка драфта «New draft» на экране результатов здесь ни к чему
    show('screen-results');
    ensureSkipButton();
    await simulateGamesLive(teams, games, pointsForPlace, 1, 'stage', 0, null, null, {mapReplay:true, choices:false, stageName:title});
    ok=true;
  }catch(e){ console.error('sqLiveStart', e); }
  finally{
    try{ removeSkipButton(); }catch(e){}
    document.body.classList.remove('sq-running');
    CARD_MODE=pm; squadSize=ps; drafted=pd; CC_WORLD_FAST=pf;
    try{ useLandingSet(pSet); }catch(e){}
    SQ_LIVE=null;
  }
  show('screen-sq');
  if(!ok) return sqLiveStartTable(teams, games, size, title, done);
  const ranked=sqRank(teams), you=teams.find(t=>t.isYou);
  done({you, ranked, place:ranked.indexOf(you)+1, N:ranked.length});
}
function sqLiveStartTable(teams, games, size, title, done){
  sqWithCards(()=>applyStageBias(pointsForPlace), size);
  teams.forEach(t=>{ t.stagePts=0; t.stageElims=0; t.wins=0; t.lastPlace=0; t.lastElims=0; t.prevRank=0; });
  SQ_LIVE={teams, games, g:0, size, title, done, timer:null};
  sqLiveTick();
}
function sqLiveGame(){
  const L=SQ_LIVE;
  sqRank(L.teams).forEach((t, i)=>{ t.prevRank=i+1; });
  sqWithCards(()=>{
    const order=simulateGame(L.teams);
    order.forEach((t, i)=>{ const place=i+1, el=t._elims||0;
      t.stagePts+=pointsForPlace(place)+ccKillPts(el, 1); t.stageElims+=el; t.lastPlace=place; t.lastElims=el; if(place===1) t.wins++; });
  }, L.size);
  L.g++;
}
function sqLiveTick(){
  const L=SQ_LIVE; if(!L) return;
  if(L.g>=L.games) return sqLiveEnd();
  const scr=document.getElementById('screen-sq');
  if(!scr || !scr.classList.contains('active')) return sqLiveSkip();
  sqLiveGame(); sqRender();
  L.timer=setTimeout(sqLiveTick, SQ_LIVE_MS);
}
function sqLiveSkip(){ const L=SQ_LIVE; if(!L) return; clearTimeout(L.timer); while(L.g<L.games) sqLiveGame(); sqLiveEnd(); }
function sqLiveEnd(){
  const L=SQ_LIVE; if(!L) return; clearTimeout(L.timer); SQ_LIVE=null;
  const ranked=sqRank(L.teams), you=L.teams.find(t=>t.isYou);
  L.done({you, ranked, place:ranked.indexOf(you)+1, N:ranked.length});
}
function sqLiveHTML(){
  const L=SQ_LIVE, T=sqT(), ranked=sqRank(L.teams), you=L.teams.find(t=>t.isYou), yi=ranked.indexOf(you);
  const rows=ranked.slice(0, 12).concat(yi>=12 ? [you] : []);
  const mv=(t, r)=>{ if(!t.prevRank || L.g<2) return ''; const d=t.prevRank-r; return d>0 ? '<i class="up">▲'+d+'</i>' : d<0 ? '<i class="dn">▼'+(-d)+'</i>' : ''; };
  return '<div class="sq-live"><div class="sq-live-h"><b>'+esc(T.liveGame(L.g, L.games))+'</b>'+
    '<u class="sq-live-bar"><s style="width:'+Math.round(L.g/L.games*100)+'%"></s></u>'+
    '<button class="sq-ghost" onclick="sqLiveSkip()">'+esc(T.liveSkip)+'</button></div>'+
    '<table class="sq-tbl sq-live-t"><tr><th>#</th><th></th><th></th><th>'+esc(T.lastGame)+'</th><th>'+esc(T.elims)+'</th><th>'+esc(T.pts)+'</th></tr>'+
    rows.map(t=>{ const r=ranked.indexOf(t)+1;
      return '<tr class="'+(t.isYou ? 'you' : '')+(t.lastPlace===1 ? ' vr' : '')+'"><td>'+r+'</td><td class="mv">'+mv(t, r)+'</td><td>'+(t.isYou ? esc(T.you) : t.name)+'</td>'+
        '<td>#'+t.lastPlace+(t.lastPlace===1 ? ' 👑' : '')+'</td><td>'+t.stageElims+'</td><td>'+t.stagePts+'</td></tr>'; }).join('')+'</table></div>';
}
/* СЕЗОН FNCS — своя идея режима вместо дивизионов (27.10, его «чет от ультимейт тим и своё»). Сезон — 4 недели по
   3 капа; капы дают очки квалификации (QP). 120 QP к концу сезона — Мейджор: Плей-Ин (дальше топ-25%), Хиты
   (топ-30%), Гранд-финал из 12 игр; топ-5 финала едут на Глобалс. Не набрал или вылетел — следующий сезон, соперники
   на ступень сильнее. Всё остальное от Ultimate Team (клуб, паки, рынок, испытания, драфт, бои) — как было. */
const SQ_SEASON_WEEKS=4, SQ_CUPS_WEEK=3, SQ_QP_NEED=120, SQ_CUP_GAMES6=6;
const SQ_STAGES=[
  {id:'playin',  center:0.55, games:6,  cut:0.25},
  {id:'heats',   center:0.68, games:6,  cut:0.3},
  {id:'final',   center:0.8,  games:12, cut:0.1},
  {id:'globals', center:0.9,  games:12, cut:0}
];
function sqSeason(){ if(!SQ.ss) SQ.ss={n:1, week:1, cups:0, qp:0, stage:null}; return SQ.ss; }
function sqQP(frac){ return frac<=0.02 ? 60 : frac<=0.1 ? 35 : frac<=0.2 ? 20 : frac<=0.5 ? 8 : 2; }
function sqSeasonCenter(base){ return Math.min(0.95, base+(sqSeason().n-1)*0.03); }
// Кап сезона или этап Мейджора — что сейчас на очереди.
function sqPlay(){
  if(SQ_LIVE || SQ.xi.length!==SQ.size) return;
  const T=sqT(), S=sqSeason(), st=S.stage ? SQ_STAGES.find(x=>x.id===S.stage) : null;
  const you=sqWithCards(()=>sqMyTeam()); if(!you) return;
  const center=sqSeasonCenter(st ? st.center : 0.35), n=Math.round(100/SQ.size)-1;
  const teams=[you].concat(sqWithCards(()=>{ const lo=Math.max(0, center-0.12), hi=Math.min(1, center+0.15), out=[];
    for(let i=0; i<n; i++){ const sq=[], seen=new Set();
      while(sq.length<SQ.size){ const p=sqDraw(lo, hi); if(!seen.has(p._k)){ seen.add(p._k); sq.push(p); } }
      const t=buildTeam(sq); t.name=teamLabel(sq); out.push(t); }
    return out; }));
  const title=st ? T.stageName[st.id] : T.cupOf(S.cups+1, SQ_CUPS_WEEK)+' · '+T.weekOf(S.week, SQ_SEASON_WEEKS);
  sqLiveStart(teams, st ? st.games : SQ_CUP_GAMES6, SQ.size, title, res=>sqPlayDone(st, title, res));
}
function sqPlayDone(st, title, res){
  const T=sqT(), S=sqSeason(), notes=[];
  const place=res.place, N=res.N, frac=place/N;
  let coins=Math.round((300+2200*Math.pow(1-frac, 2)+res.you.wins*500)/10)*10, pack=null;
  if(!st){
    const qp=sqQP(frac); S.qp+=qp; S.cups++; notes.push(T.gotQP(qp, S.qp, SQ_QP_NEED));
    SQ.stat.evenings++; if(place<=10) SQ.stat.top10++;
    if(S.cups>=SQ_CUPS_WEEK){
      S.cups=0; sqNewWeek(notes);
      if(S.week>=SQ_SEASON_WEEKS){
        if(S.qp>=SQ_QP_NEED){ S.stage='playin'; S.best=Math.max(S.best||0, 1); SQ.stat.best=Math.max(SQ.stat.best||0, 1); notes.push(T.qualified); }
        else { notes.push(T.notQual(S.qp)); sqNewSeason(notes); }
      } else S.week++;
    }
  } else {
    coins*=2;
    const i=SQ_STAGES.indexOf(st), cutN=Math.max(1, Math.ceil(N*st.cut));
    if(st.id==='final' || st.id==='globals'){
      const big=st.id==='globals';
      pack=place===1 ? 'elite' : place<=5 ? 'elite' : 'gold';
      SQ.packs.push(pack); if(place===1) SQ.packs.push('elite');
      if(big && place===1) SQ.packs.push('elite');
      const prize=big ? (place===1 ? 100000 : place<=5 ? 40000 : 15000) : (place===1 ? 30000 : place<=5 ? 15000 : 5000);
      coins+=prize; notes.push(T.stagePrize(T.stageName[st.id], place, prize.toLocaleString()));
      if(!big && place<=5){ S.stage='globals'; SQ.stat.best=Math.max(SQ.stat.best||0, 4); notes.push(T.toGlobals); }
      else sqNewSeason(notes);
    } else if(place<=cutN){
      S.stage=SQ_STAGES[i+1].id; SQ.stat.best=Math.max(SQ.stat.best||0, i+2); notes.push(T.through(T.stageName[S.stage]));
    } else {
      pack=st.id==='playin' ? 'silver' : 'gold'; SQ.packs.push(pack);
      notes.push(T.out(T.stageName[st.id], cutN)); sqNewSeason(notes);
    }
  }
  if(res.you.wins) SQ.stat.wins+=res.you.wins;
  SQ.coins+=coins;
  SQ.cards.forEach(c=>{ if(c.un) return; const on=SQ.xi.indexOf(c.id)>=0; SQ.st[c.id]=Math.max(0, Math.min(100, sqFit(c.id)+(on ? -15 : 25))); });
  sqAfterNight(res, st ? 'stage' : 'cup');
  SQ_LAST={kind:'season', title, place, N, coins, pack, notes, rows:sqRows(res)};
  sqSave(); sqRender();
}
function sqNewSeason(notes){
  const S=sqSeason();
  SQ.ss={n:S.n+1, week:1, cups:0, qp:0, stage:null};
  notes.push(sqT().newSeason(S.n+1));
}
// Полоса сезона: Капы → Плей-Ин → Хиты → Гранд-финал → Глобалс; текущее — подсвечено.
function sqSeasonPath(){
  const T=sqT(), S=sqSeason(), ids=['cups'].concat(SQ_STAGES.map(s=>s.id)), cur=S.stage || 'cups', ci=ids.indexOf(cur);
  return '<div class="sq-path">'+ids.map((id, i)=>'<span class="'+(i<ci ? 'done' : i===ci ? 'on' : '')+'">'+esc(T.stageName[id])+'</span>').join('<i>›</i>')+'</div>';
}
function sqPackOpen(id, paid){
  const T=sqT(), P=SQ_PACKS.find(p=>p.id===id); if(!P) return;
  if(paid){ if(SQ.coins<P.cost){ SQ_NOTE=T.noCoins; sqRender(); return; } SQ.coins-=P.cost; }
  else { const i=SQ.packs.indexOf(id); if(i<0) return; SQ.packs.splice(i, 1); }
  const got=[];
  for(let i=0; i<P.n; i++) got.push(i===0 && P.top ? sqDrawSkew(P.top, 1) : sqDrawSkew(P.lo, P.hi));
  got.sort((a, b)=>sqOvr(b)-sqOvr(a));
  SQ_OPENED=got.map(c=>sqAdd(c, true));
  SQ.stat.packs++; sqWq('pack', 1);
  SQ_TAB='un';
  sqSave(); sqRender();
}
// Состав: переносы между основой, запасом и коллекцией.
function sqMove(id, to){
  SQ.xi=SQ.xi.filter(x=>x!==id); SQ.bench=SQ.bench.filter(x=>x!==id);
  const k=(sqCardOf(id)||{})._k;
  const dupe=[...SQ.xi, ...SQ.bench].some(x=>(sqCardOf(x)||{})._k===k);
  if(to==='xi' && SQ.xi.length<SQ.size && !dupe) SQ.xi.push(id);
  else if(to==='bench' && SQ.bench.length<SQ_BENCH && !dupe) SQ.bench.push(id);
  sqSave(); sqRender();
}
function sqSetSize(n){
  SQ.size=n;
  while(SQ.xi.length>n){ const id=SQ.xi.pop(); if(SQ.bench.length<SQ_BENCH) SQ.bench.push(id); }
  sqSave(); sqRender();
}
function sqDropCard(id){ SQ.cards=SQ.cards.filter(c=>c.id!==id); SQ.xi=SQ.xi.filter(x=>x!==id); SQ.bench=SQ.bench.filter(x=>x!==id); delete SQ.st[id]; }
function sqQuickSell(id){ const c=sqCardOf(id); if(!c) return; SQ.coins+=sqQuick(sqOvr(c)); sqDropCard(id); sqSave(); sqRender(); }
function sqList(id){
  const c=sqCardOf(id); if(!c) return;
  const inst0=sqInst(id);   // эволюция едет вместе с лотом и возвращается, если не продалось
  SQ.sells.push({id, k:inst0 ? inst0.k : c._k, evo:inst0 && inst0.evo || null, price:sqValue(sqOvr(c)), ends:Date.now()+SQ_SELL_MS}); sqWq('list', 1);
  sqDropCard(id); sqSave(); sqRender();
}
/* Рынок — боты. У лота своя «настоящая цена» (cap): ставки ботов растут к ней по таймеру. Твоя ставка выше их текущей —
   лидируешь; бот перебил — монеты возвращаются сразу. Таймер кончился, а ты лидер — карточка твоя. Свой лот продаётся,
   если цена не выше рыночной, с вероятностью 85%; комиссия 5%. Время — настоящее, лоты живут 4 минуты. */
function sqMktTick(){
  const now=Date.now(), T=sqT(), m=SQ.mkt;
  m.list.forEach(l=>{
    const bot=sqBotBid(l, now);
    if(l.mine && bot>l.mine){ SQ.coins+=l.mine; l.mine=0; }
    if(now>=l.ends && l.mine){ sqGain(l.k); l.won=true; }
  });
  m.list=m.list.filter(l=>now<l.ends && !l.won);
  while(m.list.length<SQ_MKT_N){
    // Топ на рынке — редкость: 70% лотов из середины, 25% сильные, 5% из верхних 10%.
    const r=Math.random(), c=r<0.7 ? sqDraw(0.1, 0.7) : r<0.95 ? sqDraw(0.6, 0.9) : sqDraw(0.9, 1), v=sqValue(sqOvr(c));
    const born=now-Math.floor(Math.random()*SQ_MKT_MS*0.6);
    m.list.push({id:'m'+now+'_'+m.list.length+'_'+Math.floor(Math.random()*1e6), k:c._k, start:Math.round(v*0.55/50)*50,
      cap:Math.round(v*(0.75+Math.random()*0.4)/50)*50, buy:Math.round(v*(1.1+Math.random()*0.3)/50)*50, born, ends:born+SQ_MKT_MS, mine:0});
  }
  SQ.sells=SQ.sells.filter(s=>{
    if(now<s.ends) return true;
    if(Math.random()<0.85){ const got=Math.round(s.price*0.95/10)*10; SQ.coins+=got; SQ.stat.sold++; SQ_NOTE=T.soldFor(got.toLocaleString()); }
    else { SQ.cards.push(s.evo ? {id:s.id, k:s.k, evo:s.evo} : {id:s.id, k:s.k}); SQ_NOTE=T.unsold; }
    return false;
  });
  sqSave();
}
function sqBotBid(l, now){ const pr=Math.max(0, Math.min(1, (now-l.born)/(l.ends-l.born))); return Math.round((l.start+(l.cap-l.start)*Math.pow(pr, 1.5))/50)*50; }
function sqBid(lid){
  const l=SQ.mkt.list.find(x=>x.id===lid); if(!l) return;
  const now=Date.now(), cur=Math.max(l.mine, sqBotBid(l, now)), next=Math.round(cur*1.05/50)*50+50;
  if(next>=l.buy) return sqBuyNow(lid);
  const extra=next-l.mine; if(SQ.coins<extra){ SQ_NOTE=sqT().noCoins; sqRender(); return; }
  SQ.coins-=extra; l.mine=next;
  // Боты отвечают: если твоя ставка ниже их «настоящей цены», к концу таймера тебя перебьют.
  sqSave(); sqRender();
}
function sqBuyNow(lid){
  const i=SQ.mkt.list.findIndex(x=>x.id===lid); if(i<0) return;
  const l=SQ.mkt.list[i], cost=l.buy-l.mine; if(SQ.coins<cost){ SQ_NOTE=sqT().noCoins; sqRender(); return; }
  SQ.coins-=cost; sqGain(l.k); SQ.mkt.list.splice(i, 1);
  sqSave(); sqRender();
}
function sqClaim(oid){
  const o=SQ_OBJ.find(x=>x.id===oid); if(!o || SQ.claimed[oid] || o.cur(SQ)<o.goal) return;
  SQ.claimed[oid]=true;
  if(o.r.coins) SQ.coins+=o.r.coins;
  if(o.r.pack) SQ.packs.push(o.r.pack);
  sqSave(); sqRender();
}
/* Режимы FNCS Cards, второй заход (27.10, его «забрать / продать карту надо сделать, дизайн получше и режимы всякие,
   которые есть в фифе»). Названия свои, без брендов EA: Дивизионы, Кап выходных, Бои с ботами, Драфт, Испытания
   составов. Карточки из пака сначала «неназначенные»: в клуб, быстро продать или на рынок; дубль в клуб не берётся. */
Object.assign(SQ_I18N.en, {
  liveGame:(g, n)=>'Game '+g+' of '+n, liveSkip:'Skip to the end', lastGame:'Last game',
  tabSeason:'FNCS Season', hSeason:'Weekly cups earn qualification points. Enough of them and the Major is yours: Play-In, Heats, Grand Final, then Globals.',
  majorLbl:'Major', hMajor:'Play-In, Heats and the Grand Final. Top 5 of the final go to Globals.', seasonN:n=>'Season '+n, seasonLbl:'Season',
  weekOf:(w, n)=>'Week '+w+' of '+n, cupOf:(c, n)=>'Cup '+c+' of '+n, cupsLbl:'Cups this week', qpLbl:'QP',
  seasonRule:n=>'3 cups a week, 4 weeks. QP per cup: win 60, top 10% 35, top 20% 20, top half 8, rest 2. '+n+' QP by the end of the season = the Major.',
  playCupN:'Play the cup', playStage:s=>'Play the '+s,
  stageName:{cups:'Cups', playin:'Play-In', heats:'Heats', final:'Grand Final', globals:'Globals'},
  stageHint:{playin:'Top 25% go to the Heats.', heats:'Top 30% go to the Grand Final.', final:'12 games. Top 5 go to Globals.', globals:'12 games for the title.'},
  gotQP:(q, t, n)=>'+'+q+' QP ('+t+' / '+n+')', qualified:'Qualified for the Major!', notQual:q=>'Season over with '+q+' QP: not enough for the Major.',
  newSeason:n=>'Season '+n+' starts.', through:s=>'Through to the '+s+'!', out:(s, n)=>'Out at the '+s+' (top '+n+' went through).',
  stagePrize:(s, p, v)=>s+': #'+p+', prize '+v+' V-Bucks', toGlobals:'Qualified for Globals!',
  obj:Object.assign({}, SQ_I18N.en.obj, {qual:'Qualify for a Major', final:'Reach a Grand Final'}),
  home:'Home', tabRivals:'Divisions', tabBattles:'Bot Battles', tabDraft:'Draft', tabSbc:'Squad Challenges', tabUn:'Unassigned', tabClub:'Club',
  hRivals:'Five evenings a week against squads of your division. Climb from 10 to 1.', hCup:'The big weekend lobby. Qualify with 4+ week points.',
  hBattles:'Short lobbies against bot squads at four difficulties. Weekly points, weekly reward.', hDraft:'Pick a squad from five options per slot, survive four rounds.',
  hSquad:'Starters, subs and format.', hClub:'Every card you own.', hPacks:'Bronze to Elite.', hMkt:'Bid, buy now, list your cards.',
  hSbc:'Hand in cards that fit the rules, get packs.', hObj:'One-off goals for V-Bucks and packs.', hUn:n=>n+' cards waiting: keep or sell.',
  locked:'Locked', keep:'To club', keepAll:'All to club', sellDupes:'Quick sell duplicates', dup:'Duplicate: already in your club',
  unEmpty:'Nothing unassigned.', diff:['Beginner', 'Pro', 'World Class', 'Legend'], bPlayed:(n, m)=>'Played this week: '+n+' / '+m,
  bPts:'Week points', bPlay:'Play', bLeft:'No battles left this week', bReward:'Weekly reward: 300+ points bronze, 700+ silver, 1,200+ silver and 5,000 V-Bucks.',
  bGot:p=>'Battle points: +'+p, wkReward:(c, p)=>'Bot Battles weekly reward: '+c+' V-Bucks'+(p ? ' + '+p+' pack' : ''),
  drCost:c=>'Entry: '+c+' V-Bucks', drStart:'Start a draft', drPickCap:'Pick your captain', drPick:(i, n)=>'Pick player '+i+' of '+n,
  drRound:(r)=>'Round '+r+' of 4', drPlayRound:'Play the round', drNeed:p=>'Top '+p+' advance', drOut:r=>'Out in round '+r+'.', drWin:'Draft won: all four rounds!',
  drAdv:'Through to the next round!', drReward:(c, p)=>'Reward: '+c+' V-Bucks + '+p+' pack', drDone:'Draft over', drNew:'New draft',
  sbcReq:{n:n=>n+' players', min:m=>'each OVR '+m+'+', avg:a=>'average OVR '+a+'+', nat:'same country', reg:'same region'},
  sbcAuto:'Fill cheapest', sbcSubmit:'Hand in', sbcPick:'Tap cards to choose. Squad starters and subs are not offered.', sbcOk:'Done! Pack added.',
  sbcBad:'The cards do not fit the rules yet', sbc:{basic:'First steps', silver:'Solid four', nation:'One flag', avg80:'Club 83', region:'Home region', avg85:'Elite five'}
});
Object.assign(SQ_I18N.ru, {
  liveGame:(g, n)=>'Игра '+g+' из '+n, liveSkip:'Досчитать до конца', lastGame:'Последняя игра',
  tabSeason:'Сезон FNCS', hSeason:'Капы каждую неделю дают очки квалификации. Набрал достаточно, и ты на Мейджоре: Плей-Ин, Хиты, Гранд-финал, потом Глобалс.',
  majorLbl:'Мейджор', hMajor:'Плей-Ин, Хиты и Гранд-финал. Топ-5 финала едут на Глобалс.', seasonN:n=>'Сезон '+n, seasonLbl:'Сезон',
  weekOf:(w, n)=>'Неделя '+w+' из '+n, cupOf:(c, n)=>'Кап '+c+' из '+n, cupsLbl:'Капов за неделю', qpLbl:'QP',
  seasonRule:n=>'3 капа в неделю, 4 недели. QP за кап: победа 60, топ-10% 35, топ-20% 20, верхняя половина 8, остальные 2. '+n+' QP к концу сезона = Мейджор.',
  playCupN:'Сыграть кап', playStage:s=>'Играть: '+s,
  stageName:{cups:'Капы', playin:'Плей-Ин', heats:'Хиты', final:'Гранд-финал', globals:'Глобалс'},
  stageHint:{playin:'В Хиты проходят топ-25%.', heats:'В Гранд-финал проходят топ-30%.', final:'12 игр. Топ-5 едут на Глобалс.', globals:'12 игр за титул.'},
  gotQP:(q, t, n)=>'+'+q+' QP ('+t+' / '+n+')', qualified:'Квалификация на Мейджор!', notQual:q=>'Сезон окончен: '+q+' QP, на Мейджор не хватило.',
  newSeason:n=>'Начался сезон '+n+'.', through:s=>'Проход дальше: '+s+'!', out:(s, n)=>'Вылет: '+s+' (прошли топ-'+n+').',
  stagePrize:(s, p, v)=>s+': #'+p+', призовые '+v+' V-Bucks', toGlobals:'Путёвка на Глобалс!',
  obj:Object.assign({}, SQ_I18N.ru.obj, {qual:'Пройти на Мейджор', final:'Дойти до Гранд-финала'}),
  home:'Главная', tabRivals:'Дивизионы', tabBattles:'Бои с ботами', tabDraft:'Драфт', tabSbc:'Испытания составов', tabUn:'Неназначенные', tabClub:'Клуб',
  hRivals:'Пять вечеров в неделю против составов своего дивизиона. Поднимись с 10-го до 1-го.', hCup:'Большое лобби выходных. Вход: 4+ очка за неделю.',
  hBattles:'Короткие лобби против ботов на четырёх сложностях. Очки недели и награда в конце.', hDraft:'Собери состав из пяти вариантов на место и пройди четыре раунда.',
  hSquad:'Основа, запасные и формат.', hClub:'Все твои карточки.', hPacks:'От бронзы до элиты.', hMkt:'Ставки, покупка сразу, свои лоты.',
  hSbc:'Сдай карточки под условия и получи паки.', hObj:'Разовые цели за V-Bucks и паки.', hUn:n=>'Ждут решения: '+n+'. Забрать или продать.',
  locked:'Закрыто', keep:'В клуб', keepAll:'Всё в клуб', sellDupes:'Продать дубли', dup:'Дубль: такой уже в клубе',
  unEmpty:'Неназначенных нет.', diff:['Новичок', 'Про', 'Мировой класс', 'Легенда'], bPlayed:(n, m)=>'Сыграно за неделю: '+n+' / '+m,
  bPts:'Очки недели', bPlay:'Играть', bLeft:'На этой неделе боёв больше нет', bReward:'Награда недели: 300+ очков бронза, 700+ серебро, 1 200+ серебро и 5 000 V-Bucks.',
  bGot:p=>'Очки боя: +'+p, wkReward:(c, p)=>'Награда боёв с ботами: '+c+' V-Bucks'+(p ? ' и пак ('+p+')' : ''),
  drCost:c=>'Вход: '+c+' V-Bucks', drStart:'Начать драфт', drPickCap:'Выбери капитана', drPick:(i, n)=>'Игрок '+i+' из '+n,
  drRound:(r)=>'Раунд '+r+' из 4', drPlayRound:'Сыграть раунд', drNeed:p=>'Дальше проходят топ-'+p, drOut:r=>'Вылет в раунде '+r+'.', drWin:'Драфт выигран: все четыре раунда!',
  drAdv:'Проход в следующий раунд!', drReward:(c, p)=>'Награда: '+c+' V-Bucks и пак ('+p+')', drDone:'Драфт окончен', drNew:'Новый драфт',
  sbcReq:{n:n=>n+' игрока', min:m=>'у каждого OVR '+m+'+', avg:a=>'средний OVR '+a+'+', nat:'одна страна', reg:'один регион'},
  sbcAuto:'Подобрать', sbcSubmit:'Сдать', sbcPick:'Нажимай на карточки, чтобы выбрать. Основа и запасные не предлагаются.', sbcOk:'Готово! Пак добавлен.',
  sbcBad:'Карточки пока не подходят под условия', sbc:{basic:'Первые шаги', silver:'Крепкая четвёрка', nation:'Один флаг', avg80:'Клуб 83', region:'Родной регион', avg85:'Элитная пятёрка'}
});
const SQ_BATTLE_MAX=6, SQ_BATTLE_BAND=[0.25, 0.5, 0.7, 0.88], SQ_BATTLE_MULT=[1, 1.5, 2.2, 3];
const SQ_DRAFT_COST=5000, SQ_DRAFT_BAND=[0.45, 0.6, 0.72, 0.85];
const SQ_DRAFT_PRIZE=[[1000, 'bronze'], [3000, 'bronze'], [5000, 'silver'], [8000, 'silver'], [15000, 'gold']];
const SQ_SBC=[
  {id:'basic',  n:3, req:{},                  r:'bronze'},
  {id:'silver', n:4, req:{min:75},            r:'silver'},
  {id:'nation', n:3, req:{nat:true},          r:'silver'},
  {id:'avg80',  n:5, req:{avg:83},            r:'gold'},
  {id:'region', n:4, req:{reg:true, min:80},  r:'silver'},
  {id:'avg85',  n:5, req:{avg:86},            r:'elite'}
];
let SQ_SBC_SEL=null;
function sqInst(id){ return (SQ.cards||[]).find(c=>c.id===id); }
function sqInUse(id){ return SQ.xi.indexOf(id)>=0 || SQ.bench.indexOf(id)>=0; }
function sqIsDup(inst){ return SQ.cards.some(c=>c!==inst && !c.un && c.k===inst.k); }
// Смена недели: награда боёв с ботами по очкам недели, сброс.
function sqNewWeek(notes){
  const T=sqT(), p=SQ.sb.pts;
  const pack=p>=1200 ? 'silver' : p>=700 ? 'silver' : p>=300 ? 'bronze' : null;
  const coins=p>=1200 ? 5000 : p>=700 ? 2500 : p>=300 ? 1000 : (SQ.sb.played ? 300 : 0);
  if(coins || pack){ SQ.coins+=coins; if(pack) SQ.packs.push(pack); notes.push(T.wkReward(coins.toLocaleString(), pack ? T.packNames[pack] : '')); }
  SQ.sb={played:0, pts:0};
  SQ.week++; SQ.wk={n:0, pts:0};
  notes.push(T.newWeek);
}
function sqKeep(id){
  const inst=sqInst(id); if(!inst) return;
  if(sqIsDup(inst)){ SQ_NOTE=sqT().dup; sqRender(); return; }
  delete inst.un; sqSave(); sqRender();
}
function sqKeepAll(){ SQ.cards.filter(c=>c.un).forEach(c=>{ if(!sqIsDup(c)) delete c.un; }); sqSave(); sqRender(); }
function sqSellDupes(){
  SQ.cards.filter(c=>c.un && sqIsDup(c)).forEach(c=>{ const p=sqPool().byK.get(c.k); if(p) SQ.coins+=sqQuick(sqOvr(p)); sqDropCard(c.id); });
  sqSave(); sqRender();
}
// Лобби вне дивизионов: свой состав (или временный — драфт) против ботов своей полосы.
function sqLobbyTeams(cards, center, size){
  return sqWithCards(()=>{
    const you=buildTeam(cards); you.isYou=true; you.name=sqT().you;
    const n=Math.round(100/size)-1, lo=Math.max(0, center-0.12), hi=Math.min(1, center+0.15), bots=[];
    for(let i=0; i<n; i++){
      const sq=[], seen=new Set();
      while(sq.length<size){ const p=sqDraw(lo, hi); if(!seen.has(p._k)){ seen.add(p._k); sq.push(p); } }
      const t=buildTeam(sq); t.name=teamLabel(sq); bots.push(t);
    }
    return [you].concat(bots);
  }, size);
}
function sqRows(res){ const T=sqT(); return res.ranked.slice(0, 10).concat(res.place>10 ? [res.you] : []).map(t=>({
  name:t.isYou ? T.you : t.name, you:!!t.isYou, place:res.ranked.indexOf(t)+1, pts:t.stagePts, wins:t.wins, elims:t.stageElims})); }
function sqBattle(d){
  const T=sqT(); if(SQ_LIVE || SQ.sb.played>=SQ_BATTLE_MAX || SQ.xi.length!==SQ.size) return;
  const cards=SQ.xi.map(sqCardOf).filter(Boolean);
  sqLiveStart(sqLobbyTeams(cards, SQ_BATTLE_BAND[d], SQ.size), 3, SQ.size, T.diff[d], res=>sqBattleDone(d, res));
}
function sqBattleDone(d, res){
  const T=sqT();
  const pts=Math.round((res.N-res.place+1)/res.N*100*SQ_BATTLE_MULT[d]);
  SQ.sb.played++; SQ.sb.pts+=pts;
  const coins=Math.round(pts*2/10)*10; SQ.coins+=coins;
  if(res.you.wins) SQ.stat.wins+=res.you.wins;
  sqAfterNight(res, 'battle');
  SQ_LAST={kind:'battle', title:T.diff[d], place:res.place, N:res.N, coins, pack:null, notes:[T.bGot(pts)], rows:sqRows(res)};
  sqSave(); sqRender();
}
// Драфт: капитан из пяти топ-карточек, остальные места — из пяти сильных; четыре раунда, проходит топ-25%.
function sqDraftOpts(cap){
  const taken=new Set((SQ.dr.picks||[]));
  const out=[], seen=new Set();
  /* Два из пяти — земляки уже выбранных (страна), чтобы было из чего строить сыгранность: иначе случайные пятёрки
     почти никогда не связаны с капитаном и подсказка везде «0». Остальные — как раньше, сильные из пула. */
  if(!cap){
    const nats=new Set(SQ.dr.picks.map(k=>(sqPool().byK.get(k)||{}).nat).filter(Boolean));
    const P=sqPool(), lo=Math.floor(P.length*0.5);
    const mates=P.slice(lo).filter(c=>nats.has(c.nat) && !taken.has(c._k));
    for(let i=0; i<40 && out.length<2 && mates.length; i++){ const c=mates[Math.floor(Math.random()*mates.length)]; if(!seen.has(c._k)){ seen.add(c._k); out.push(c._k); } }
  }
  while(out.length<5){ const c=cap ? sqDraw(0.92, 1) : sqDraw(0.55, 1); if(!taken.has(c._k) && !seen.has(c._k)){ seen.add(c._k); out.push(c._k); } }
  // Земляки не всегда первыми: порядок перемешан.
  for(let i=out.length-1; i>0; i--){ const j=Math.floor(Math.random()*(i+1)); [out[i], out[j]]=[out[j], out[i]]; }
  return out;
}
function sqDraftStart(){
  if(SQ.coins<SQ_DRAFT_COST){ SQ_NOTE=sqT().noCoins; sqRender(); return; }
  SQ.coins-=SQ_DRAFT_COST;
  SQ.dr={size:SQ.size, picks:[], opts:null, round:0, done:false, res:null};
  SQ.dr.opts=sqDraftOpts(true);
  sqSave(); sqRender();
}
function sqDraftPick(k){
  const dr=SQ.dr; if(!dr || !dr.opts || dr.opts.indexOf(k)<0) return;
  dr.picks.push(k);
  dr.opts=dr.picks.length<dr.size ? sqDraftOpts(false) : null;
  sqSave(); sqRender();
}
// Выбор по номеру варианта: в никах бывают кавычки, в onclick они ломали кнопку.
function sqDraftPickI(i){ if(SQ.dr && SQ.dr.opts) sqDraftPick(SQ.dr.opts[i]); }
function sqDraftRound(){
  const dr=SQ.dr, T=sqT(); if(SQ_LIVE || !dr || dr.opts || dr.done) return;
  const cards=dr.picks.map(k=>sqPool().byK.get(k)).filter(Boolean);
  sqLiveStart(sqLobbyTeams(cards, SQ_DRAFT_BAND[dr.round], dr.size), 4, dr.size, T.drRound(dr.round+1), res=>sqDraftDone(res));
}
function sqDraftDone(res){
  const dr=SQ.dr, T=sqT();
  const cut=Math.ceil(res.N/4), through=res.place<=cut, notes=[];
  if(through){ dr.round++; notes.push(dr.round>=4 ? T.drWin : T.drAdv); }
  else notes.push(T.drOut(dr.round+1));
  if(!through || dr.round>=4){
    dr.done=true;
    const [c, p]=SQ_DRAFT_PRIZE[dr.round];
    sqWq('draft', 1);
    SQ.coins+=c; SQ.packs.push(p); notes.push(T.drReward(c.toLocaleString(), T.packNames[p]));
  }
  if(res.you.wins) SQ.stat.wins+=res.you.wins;
  sqAfterNight(res, 'draft');
  SQ_LAST={kind:'draft', title:T.drRound(Math.min(4, dr.round+(through ? 0 : 1))), place:res.place, N:res.N, coins:0, pack:null, notes, rows:sqRows(res)};
  sqSave(); sqRender();
}
// Испытания составов.
function sqSbcCheck(s, ids){
  const cards=ids.map(sqCardOf).filter(Boolean);
  if(cards.length!==s.n) return false;
  const r=s.req;
  if(r.min && cards.some(c=>sqOvr(c)<r.min)) return false;
  if(r.avg && cards.reduce((a, c)=>a+sqOvr(c), 0)/cards.length<r.avg) return false;
  if(r.nat && new Set(cards.map(c=>c.nat||'')).size!==1) return false;
  if(r.reg && new Set(cards.map(c=>c.region||'')).size!==1) return false;
  return true;
}
function sqSbcPool(){ return SQ.cards.filter(c=>!sqInUse(c.id)).map(c=>({id:c.id, c:sqPool().byK.get(c.k)})).filter(x=>x.c); }
function sqSbcOpen(id){ SQ_SBC_SEL={id, sel:[]}; SQ_TAB='sbc'; sqRender(); }
function sqSbcToggle(cid){
  const S=SQ_SBC_SEL; if(!S) return; const s=SQ_SBC.find(x=>x.id===S.id);
  const i=S.sel.indexOf(cid); if(i>=0) S.sel.splice(i, 1); else if(S.sel.length<s.n) S.sel.push(cid);
  sqRender();
}
// «Подобрать»: самые дешёвые подходящие — окном подряд по возрастанию OVR внутри страны/региона.
function sqSbcAuto(){
  const S=SQ_SBC_SEL; if(!S) return; const s=SQ_SBC.find(x=>x.id===S.id), r=s.req;
  const pool=sqSbcPool().filter(x=>!r.min || sqOvr(x.c)>=r.min).sort((a, b)=>sqOvr(a.c)-sqOvr(b.c));
  const groups=r.nat ? Object.values(pool.reduce((m, x)=>{ (m[x.c.nat||'']=m[x.c.nat||'']||[]).push(x); return m; }, {}))
             : r.reg ? Object.values(pool.reduce((m, x)=>{ (m[x.c.region||'']=m[x.c.region||'']||[]).push(x); return m; }, {})) : [pool];
  let best=null;
  groups.forEach(g=>{ for(let i=0; i+s.n<=g.length; i++){ const w=g.slice(i, i+s.n), ids=w.map(x=>x.id);
    if(sqSbcCheck(s, ids)){ const cost=w.reduce((a, x)=>a+sqValue(sqOvr(x.c)), 0); if(!best || cost<best.cost) best={ids, cost}; break; } } });
  if(best) S.sel=best.ids; else SQ_NOTE=sqT().sbcBad;
  sqRender();
}
function sqSbcSubmit(){
  const S=SQ_SBC_SEL; if(!S) return; const s=SQ_SBC.find(x=>x.id===S.id);
  if(!sqSbcCheck(s, S.sel)){ SQ_NOTE=sqT().sbcBad; sqRender(); return; }
  S.sel.forEach(id=>sqDropCard(id));
  SQ.packs.push(s.r); SQ_SBC_SEL=null; SQ_NOTE=sqT().sbcOk; sqWq('sbc', 1);
  sqSave(); sqRender();
}
/* ЭВОЛЮЦИИ И ЗАДАЧИ НЕДЕЛИ (27.10, по плану после выкладки, его «ДЕЛАЙ»).
   Эволюция: из шести шаблонов на неделе открыты три (по номеру недели). Берёшь подходящую карточку из клуба (OVR не
   выше порога, у некоторых — роль), играешь ею в основе вечера сезона и бои с ботами; выполнил условия — карточка
   навсегда получает прибавку к параметрам и OVR (sqEvoCard), на ней значок EVO. Одна эволюция за раз; один шаблон
   на карточку один раз. Задачи недели: три из девяти, меняются с неделей, награды небольшие. */
const SQ_EVOS=[
  {id:'aim',    max:80, role:null,       need:{nights:3, top:1},   add:{aim:4, clu:2, ovr:2}},
  {id:'end',    max:84, role:null,       need:{nights:4, elims:20}, add:{end:4, sur:3, ovr:2}},
  {id:'igl',    max:82, role:'roleIGL',  need:{nights:3, top:1},   add:{end:3, exp:3, ovr:2}},
  {id:'frag',   max:82, role:'roleFRG',  need:{nights:3, elims:15}, add:{aim:3, clu:3, ovr:2}},
  {id:'grind',  max:78, role:null,       need:{nights:5},          add:{con:4, exp:3, ovr:3}},
  {id:'clutch', max:86, role:null,       need:{nights:4, top:2},   add:{clu:4, sur:2, ovr:1}}
];
const SQ_WQ_POOL=[
  {id:'cups',    goal:3,  r:{coins:1500}},
  {id:'top10',   goal:1,  r:{coins:2500}},
  {id:'win',     goal:1,  r:{pack:'bronze'}},
  {id:'battles', goal:2,  r:{coins:1500}},
  {id:'pack',    goal:1,  r:{coins:1000}},
  {id:'sbc',     goal:1,  r:{pack:'bronze'}},
  {id:'list',    goal:1,  r:{coins:800}},
  {id:'draft',   goal:1,  r:{coins:2000}},
  {id:'elims',   goal:30, r:{coins:2000}}
];
let SQ_EVO_PICK=null;
function sqRot(list, n, salt){ const out=[], w=(SQ.week||1)*7+salt; for(let j=0; out.length<n && j<list.length*3; j++){ const x=list[(w+j*5)%list.length]; if(out.indexOf(x)<0) out.push(x); } return out; }
function sqEvosNow(){ return sqRot(SQ_EVOS, 3, 1); }
function sqWqNow(){ return sqRot(SQ_WQ_POOL, 3, 4); }
function sqWq(key, n){
  if(!SQ.wq || SQ.wq.wk!==SQ.week) SQ.wq={wk:SQ.week, p:{}, c:{}};
  SQ.wq.p[key]=(SQ.wq.p[key]||0)+(n||1);
}
function sqWqClaim(id){
  if(!SQ.wq || SQ.wq.wk!==SQ.week) return;
  const q=SQ_WQ_POOL.find(x=>x.id===id); if(!q || SQ.wq.c[id] || (SQ.wq.p[id]||0)<q.goal || sqWqNow().indexOf(q)<0) return;
  SQ.wq.c[id]=true;
  if(q.r.coins) SQ.coins+=q.r.coins;
  if(q.r.pack) SQ.packs.push(q.r.pack);
  sqSave(); sqRender();
}
// Подходит ли карточка под эволюцию: в клубе, не неназначенная, OVR не выше порога, роль, этот шаблон ещё не проходила.
function sqEvoFits(e, inst){
  if(!inst || inst.un) return false;
  const c=sqCardOf(inst.id); if(!c) return false;
  if(sqOvr(c)>e.max) return false;
  if(e.role && sqRole(c)!==e.role) return false;
  return !((inst.evo && inst.evo.done)||[]).includes(e.id);
}
function sqEvoStart(eid, cid){
  const e=SQ_EVOS.find(x=>x.id===eid), inst=sqInst(cid);
  if(!e || SQ.ev || !sqEvoFits(e, inst)) return;
  SQ.ev={eid, cid, prog:{nights:0, top:0, elims:0}};
  SQ_EVO_PICK=null; sqSave(); sqRender();
}
function sqEvoPick(eid){ SQ_EVO_PICK=eid; sqRender(); }
function sqEvoPickI(i){ const e=SQ_EVOS.find(x=>x.id===SQ_EVO_PICK); if(!e) return; const fit=SQ.cards.filter(c=>sqEvoFits(e, c)); if(fit[i]) sqEvoStart(e.id, fit[i].id); }
function sqEvoDone(){ if(!SQ.ev) return false; const e=SQ_EVOS.find(x=>x.id===SQ.ev.eid); return !!e && Object.keys(e.need).every(k=>(SQ.ev.prog[k]||0)>=e.need[k]); }
function sqEvoClaim(){
  if(!sqEvoDone()) return;
  const e=SQ_EVOS.find(x=>x.id===SQ.ev.eid), inst=sqInst(SQ.ev.cid);
  if(inst){
    const ev=inst.evo||{n:0, add:{}, done:[]};
    ev.n++; ev.done=(ev.done||[]).concat([e.id]);
    Object.keys(e.add).forEach(k=>{ ev.add[k]=(ev.add[k]||0)+e.add[k]; });
    inst.evo=ev;
  }
  SQ.ev=null; SQ_NOTE=sqT().evoGot; sqSave(); sqRender();
}
function sqEvoCancel(){ SQ.ev=null; sqSave(); sqRender(); }
// Ход эволюции и задач недели после вечера: только если карточка эволюции в основе.
function sqAfterNight(res, kind){
  if(SQ.ev && SQ.xi.indexOf(SQ.ev.cid)>=0 && kind!=='draft'){
    const p=SQ.ev.prog; p.nights++; if(res.place<=Math.ceil(res.N*0.25)) p.top++; p.elims+=res.you.stageElims||0;
  }
  if(kind==='cup') sqWq('cups', 1);
  if(kind==='battle') sqWq('battles', 1);
  if(res.place<=10 && kind!=='draft') sqWq('top10', 1);
  if(res.you.wins) sqWq('win', res.you.wins);
  sqWq('elims', res.you.stageElims||0);
}
function sqEvoHTML(){
  const T=sqT(), money=n=>Number(n||0).toLocaleString();
  const needTxt=e=>Object.keys(e.need).map(k=>T.evoNeed[k](e.need[k])).join(' · ');
  const addTxt=e=>Object.keys(e.add).map(k=>(k==='ovr' ? 'OVR' : k.toUpperCase())+' +'+e.add[k]).join(', ');
  if(SQ.ev){
    const e=SQ_EVOS.find(x=>x.id===SQ.ev.eid), id=SQ.ev.cid, done=sqEvoDone();
    return '<h3 class="sq-h">'+esc(T.evoName[e.id])+'</h3><div class="sq-evo-run">'+sqMini(sqCardOf(id))+'<div class="sq-evo-p">'+
      Object.keys(e.need).map(k=>{ const v=Math.min(e.need[k], SQ.ev.prog[k]||0); return '<div><span>'+esc(T.evoNeed[k](e.need[k]))+'</span><u class="sq-qp"><s style="width:'+Math.round(v/e.need[k]*100)+'%"></s></u><em>'+v+' / '+e.need[k]+'</em></div>'; }).join('')+
      '<p class="sq-hint">'+esc(T.evoAdd)+': '+esc(addTxt(e))+'</p>'+
      (SQ.xi.indexOf(id)<0 ? '<p class="sq-warn">'+esc(T.evoNotXi)+'</p>' : '')+
      (done ? '<button class="sq-go sm" onclick="sqEvoClaim()">'+esc(T.claim)+'</button>' : '<button class="sq-ghost" onclick="sqEvoCancel()">'+esc(T.evoCancel)+'</button>')+'</div></div>';
  }
  if(SQ_EVO_PICK){
    const e=SQ_EVOS.find(x=>x.id===SQ_EVO_PICK), fit=SQ.cards.filter(c=>sqEvoFits(e, c));
    return '<button class="sq-crumb" onclick="SQ_EVO_PICK=null;sqRender()">‹ '+esc(T.tabEvo)+'</button><h3 class="sq-h">'+esc(T.evoName[e.id])+'</h3>'+
      '<p class="sq-hint">'+esc(T.evoPickCard)+'</p>'+
      (fit.length ? '<div class="sq-mgrid">'+fit.map((c, i)=>sqMini(sqCardOf(c.id), {click:'sqEvoPickI('+i+')'})).join('')+'</div>' : '<p class="sq-warn">'+esc(T.evoNoFit)+'</p>');
  }
  return '<p class="sq-hint">'+esc(T.hEvo)+'</p><div class="sq-sbcs">'+sqEvosNow().map(e=>'<button class="sq-sbc p-'+(e.max>=84 ? 'gold' : 'silver')+'" onclick="sqEvoPick(\''+e.id+'\')">'+
    '<b>'+esc(T.evoName[e.id])+'</b><span>'+esc(T.evoMax(e.max)+(e.role ? ' · '+(e.role==='roleIGL' ? 'IGL' : 'FRG') : ''))+'</span>'+
    '<span>'+esc(needTxt(e))+'</span><em>'+esc(addTxt(e))+'</em></button>').join('')+'</div>';
}
function sqWqHTML(){
  const T=sqT(), money=n=>Number(n||0).toLocaleString(), wq=(SQ.wq && SQ.wq.wk===SQ.week) ? SQ.wq : {p:{}, c:{}};
  return '<h3 class="sq-h">'+esc(T.wqTitle(SQ.week))+'</h3><div class="sq-objs">'+sqWqNow().map(q=>{ const cur=Math.min(q.goal, wq.p[q.id]||0), done=wq.c[q.id];
    const rw=q.r.coins ? money(q.r.coins)+' '+T.coins : T.packNames[q.r.pack];
    return '<div class="sq-obj'+(done ? ' done' : '')+'"><b>'+esc(T.wq[q.id](q.goal))+'</b><span>'+cur+' / '+q.goal+' · '+esc(T.reward)+': '+esc(rw)+'</span>'+
      (done ? '<em>'+esc(T.claimed)+'</em>' : '<button'+(cur<q.goal ? ' disabled' : '')+' onclick="sqWqClaim(\''+q.id+'\')">'+esc(T.claim)+'</button>')+'</div>'; }).join('')+'</div>'+
    '<h3 class="sq-h">'+esc(T.oneOff)+'</h3>';
}
Object.assign(SQ_I18N.en, {
  tabEvo:'Evolutions', hEvo:'Grow a card of your own: pick an evolution, play the card as a starter in season nights and bot battles, and it keeps the boost for good. Three evolutions this week, one at a time.',
  evoName:{aim:'Sharp Aim', end:'Endgame Mind', igl:'IGL Course', frag:'Fragger Drills', grind:'Grinder', clutch:'Clutch Hour'},
  evoNeed:{nights:n=>'Play '+n+' nights', top:n=>'Top 25% '+n+' time'+(n>1 ? 's' : ''), elims:n=>n+' team elims'},
  evoMax:m=>'OVR up to '+m, evoAdd:'Boost', evoPickCard:'Choose a card from your club.', evoNoFit:'No card in your club fits this evolution.',
  evoNotXi:'Put the card in the starters: nights only count with it playing.', evoCancel:'Cancel the evolution', evoGot:'Evolution complete! The card keeps the boost.',
  wqTitle:w=>'This week (week '+w+')', oneOff:'One-off goals',
  wq:{cups:n=>'Play '+n+' season cups', top10:()=>'Finish top 10 in a night', win:()=>'Win a game', battles:n=>'Play '+n+' bot battles', pack:()=>'Open a pack',
    sbc:()=>'Complete a squad challenge', list:()=>'List a card on the market', draft:()=>'Finish a draft', elims:n=>'Get '+n+' team elims'}
});
Object.assign(SQ_I18N.ru, {
  tabEvo:'Эволюции', hEvo:'Расти свою карточку: выбери эволюцию, играй карточкой в основе вечеров сезона и боёв с ботами, и прибавка останется навсегда. Три эволюции на неделю, одна за раз.',
  evoName:{aim:'Точный прицел', end:'Голова эндгейма', igl:'Курс IGL', frag:'Тренировки фраггера', grind:'Трудяга', clutch:'Час клатча'},
  evoNeed:{nights:n=>'Сыграть вечеров: '+n, top:n=>'Топ-25%, раз: '+n, elims:n=>'Киллов команды: '+n},
  evoMax:m=>'OVR до '+m, evoAdd:'Прибавка', evoPickCard:'Выбери карточку из клуба.', evoNoFit:'В клубе нет карточки под эту эволюцию.',
  evoNotXi:'Поставь карточку в основу: вечера засчитываются, только когда она играет.', evoCancel:'Отменить эволюцию', evoGot:'Эволюция готова! Прибавка у карточки навсегда.',
  wqTitle:w=>'Эта неделя (неделя '+w+')', oneOff:'Разовые цели',
  wq:{cups:n=>'Сыграть капов сезона: '+n, top10:()=>'Войти в топ-10 вечера', win:()=>'Выиграть игру', battles:n=>'Сыграть боёв с ботами: '+n, pack:()=>'Открыть пак',
    sbc:()=>'Пройти испытание составов', list:()=>'Выставить карточку на рынок', draft:()=>'Доиграть драфт', elims:n=>'Набрать киллов команды: '+n}
});
function sqTab(t){ if(SQ_LIVE) return; SQ_TAB=t; if(t!=='un') SQ_OPENED=null; if(t!=='sbc') SQ_SBC_SEL=null; if(t!=='evo') SQ_EVO_PICK=null; sqRender(); }
function sqLeft(ms){ const s=Math.max(0, Math.ceil(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2, '0'); }
function sqTier(o){ return o>=90 ? 'elite' : o>=85 ? 'gold' : o>=78 ? 'silver' : 'bronze'; }
// Мини-карточка: OVR, роль, флаг, ник, регион и клуб, шесть параметров строкой. Цвет — по уровню, как паки.
function sqMini(c, o){
  o=o||{}; if(!c) return '';
  const ov=sqOvr(c), a=attrsFor(c)||{}, role=sqRole(c)==='roleIGL' ? 'IGL' : 'FRG';
  return '<div class="sq-m t-'+sqTier(ov)+(o.sel ? ' sel' : '')+(o.click ? ' click' : '')+'"'+(o.click ? ' onclick="'+o.click+'"' : '')+
    ' title="'+esc(c.handle+(c.org ? ' · '+c.org : '')+(c.event ? ' · '+c.event : ''))+'">'+
    // Аватар (27.10, его «аватарок нет у карточек»): фото, а без него — закреплённый за ником персонаж, как на большой карточке.
    '<div class="sq-m-av">'+portraitHTML(c, 56)+'</div>'+
    '<div class="sq-m-top"><b>'+ov+'</b><i>'+role+'</i>'+(c._evo ? '<i class="sq-evo-b">EVO'+(c._evo>1 ? ' '+c._evo : '')+'</i>' : '')+'<span>'+cardFlag(c, 14)+'</span></div>'+
    '<div class="sq-m-h">'+esc(c.handle)+'</div><div class="sq-m-s">'+esc([c.region, c.org].filter(Boolean).join(' · '))+'</div>'+
    '<div class="sq-m-a">'+['aim', 'end', 'sur', 'exp', 'clu', 'con'].map(k=>'<span><em>'+k.toUpperCase()+'</em>'+Math.round(a[k]||0)+'</span>').join('')+'</div>'+
    (o.fit!=null && o.fit<100 ? '<u class="sq-fit"><s style="width:'+o.fit+'%" class="'+(o.fit<60 ? 'low' : '')+'"></s></u>' : '')+
    (o.below||'')+'</div>';
}
function sqResHTML(){
  if(!SQ_LAST) return ''; const T=sqT(), L0=SQ_LAST, money=n=>Number(n||0).toLocaleString();
  return '<div class="sq-res"><h3 class="sq-h">'+esc(L0.title||'')+' · #'+L0.place+' / '+L0.N+'</h3>'+
    '<table class="sq-tbl"><tr><th>'+esc(T.place)+'</th><th></th><th>'+esc(T.pts)+'</th><th>'+esc(T.wins)+'</th><th>'+esc(T.elims)+'</th></tr>'+
    L0.rows.map(r=>'<tr class="'+(r.you ? 'you' : '')+'"><td>'+r.place+'</td><td>'+(r.you ? esc(r.name) : r.name)+'</td><td>'+r.pts+'</td><td>'+r.wins+'</td><td>'+r.elims+'</td></tr>').join('')+'</table>'+
    (L0.coins ? '<p class="sq-earn">'+esc(T.earned)+': '+money(L0.coins)+' '+esc(T.coins)+(L0.pack ? ' · '+esc(T.packNames[L0.pack]) : '')+'</p>' : '')+
    L0.notes.map(n=>'<p class="sq-note">'+esc(n)+'</p>').join('')+'</div>';
}
function sqRender(){
  const root=document.getElementById('sqRoot'); if(!root || !SQ) return;
  if(SQ_TIMER){ clearInterval(SQ_TIMER); SQ_TIMER=null; }
  const T=sqT(), money=n=>Number(n||0).toLocaleString();
  const unN=SQ.cards.filter(c=>c.un).length;
  const myT=sqWithCards(()=>sqMyTeam());
  let body='', title=T.title;
  const back='<button class="sq-crumb" onclick="sqTab(\'home\')">‹ '+esc(T.home)+'</button>';
  if(SQ_LIVE && !SQ_LIVE.map){ body=sqLiveHTML(); title=SQ_LIVE.title; }
  else if(SQ_TAB==='home'){
    /* Превью на плитках (27.10, его «превьюхи добавь»): арт FNCS 2026 и Мейджора, остров, эмблема, скин, лобби сезона;
       у «Состава» и «Клуба» — фото своих лучших игроков, если оно есть в photos/. */
    const tile=(k, name, sub, cls, extra, img)=>'<button class="sq-tile '+cls+(img ? ' has-img' : '')+'"'+(img ? ' style="--img:url(\''+encodeURI(img).replace(/'/g, '%27')+'\')"' : '')+
      ' onclick="sqTab(\''+k+'\')"><b>'+esc(name)+'</b><span>'+esc(sub)+'</span>'+(extra||'')+'</button>';
    const bestPhoto=ids=>{ const cs=ids.map(id=>sqCardOf(id)).filter(Boolean).sort((a, b)=>sqOvr(b)-sqOvr(a));
      for(const c of cs){ const u=photoURLReal(c); if(u) return u; } return null; };
    // У «Клуба» — лучший вне основы, чтобы две плитки не показывали одно лицо.
    const xiPhoto=bestPhoto(SQ.xi), clubPhoto=bestPhoto(SQ.cards.filter(c=>!c.un && SQ.xi.indexOf(c.id)<0).map(c=>c.id)) || bestPhoto(SQ.cards.filter(c=>!c.un).map(c=>c.id));
    body=(unN ? '<button class="sq-unbar" onclick="sqTab(\'un\')">'+esc(T.hUn(unN))+' ›</button>' : '')+
      '<div class="sq-home">'+
      tile('rivals', T.tabSeason, T.hSeason, 'big k-rivals', '<em>'+esc(T.seasonN(sqSeason().n))+' · '+(sqSeason().stage ? esc(T.stageName[sqSeason().stage])
        : esc(T.weekOf(sqSeason().week, SQ_SEASON_WEEKS))+' · '+esc(T.qpLbl)+' '+sqSeason().qp+' / '+SQ_QP_NEED)+'</em>', 'art/fncs-2026.jpg')+
      tile('rivals', T.majorLbl, T.hMajor, 'k-cup'+(sqSeason().stage ? ' hot' : ''), '<em>'+(sqSeason().stage ? esc(T.stageName[sqSeason().stage]) : esc(T.locked))+'</em>', 'art/fncs-2026-major1.jpg')+
      tile('battles', T.tabBattles, T.hBattles, 'k-battles', '<em>'+esc(T.bPlayed(SQ.sb.played, SQ_BATTLE_MAX))+'</em>', 'art/map-m1.jpg')+
      tile('draft', T.tabDraft, T.hDraft, 'k-draft', '<em>'+esc(SQ.dr && !SQ.dr.done ? T.drRound(SQ.dr.round+1) : T.drCost(money(SQ_DRAFT_COST)))+'</em>', 'art/mode-squad.jpg')+
      tile('squad', T.tabSquad, T.hSquad, 'k-squad', myT ? '<em>'+esc(T.pow)+' '+myT.pow+'</em>' : '<em>'+esc(T.needXi(SQ.size))+'</em>', xiPhoto)+
      tile('club', T.tabClub, T.hClub, 'k-club', '<em>'+SQ.cards.filter(c=>!c.un).length+'</em>', clubPhoto)+
      tile('packs', T.tabPacks, T.hPacks, 'k-packs', SQ.packs.length ? '<em>'+esc(T.yourPacks)+': '+SQ.packs.length+'</em>' : '', 'art/mode-ewc.jpg')+
      tile('market', T.tabMkt, T.hMkt, 'k-market', '', 'art/lobby/s41.webp')+
      tile('evo', T.tabEvo, T.hEvo.split('.')[0]+'.', 'k-evo', SQ.ev ? '<em>'+esc(T.evoName[SQ.ev.eid])+(sqEvoDone() ? ' ✓' : '')+'</em>' : '', 'art/mode-trio.jpg')+
      tile('sbc', T.tabSbc, T.hSbc, 'k-sbc', '', 'art/mode-major1.jpg')+
      tile('obj', T.tabObj, T.hObj, 'k-obj', '<em>'+SQ_OBJ.filter(o=>!SQ.claimed[o.id] && o.cur(SQ)>=o.goal).length+' ✓</em>', 'art/mode-all-fncs.jpg')+
      '</div>';
  } else if(SQ_TAB==='squad'){
    title=T.tabSquad;
    const slot=(arr, i, where)=>{ const id=arr[i];
      if(!id) return '<div class="sq-c sq-empty">'+esc(T.empty)+'</div>';
      return '<div class="sq-c">'+(sqCardOf(id)._evo ? '<div class="sq-tag">EVO '+sqCardOf(id)._evo+'</div>' : '')+futCardHTML(sqCardOf(id))+(sqFit(id)<100 ? '<u class="sq-fit" title="'+esc(T.fit)+'"><s style="width:'+sqFit(id)+'%" class="'+(sqFit(id)<60 ? 'low' : '')+'"></s></u>' : '')+
        '<div class="sq-acts">'+(where==='xi' ? '<button onclick="sqMove(\''+id+'\',\'bench\')">'+esc(T.toBench)+'</button>'
          : '<button onclick="sqMove(\''+id+'\',\'xi\')">'+esc(T.toXi)+'</button>')+'<button onclick="sqMove(\''+id+'\',\'\')">'+esc(T.out)+'</button></div></div>'; };
    const coll=SQ.cards.filter(c=>!c.un && !sqInUse(c.id)).map(c=>({id:c.id, c:sqCardOf(c.id)})).filter(x=>x.c).sort((a, b)=>sqOvr(b.c)-sqOvr(a.c));
    body='<div class="sq-row sq-fmt">'+[2, 3, 4].map(n=>'<button class="'+(SQ.size===n ? 'on' : '')+'" onclick="sqSetSize('+n+')">'+esc(T.fmt[n])+'</button>').join('')+'</div>'+
      '<div class="sq-stats">'+(myT ? '<span><em>'+esc(T.pow)+'</em><b>'+myT.pow+'</b></span><span><em>'+esc(T.ovr)+'</em><b>'+Math.round(myT.ovrAvg||0)+'</b></span>'+
        '<span><em>'+esc(T.syn)+'</em><b>+'+synCap(myT.syn.bonus)+'</b></span>'+
        '<span class="'+(myT.roleBonus ? 'ok' : 'warn')+'">'+esc(myT.roleBonus ? T.igl : T.noIgl)+'</span>' : '<span class="warn">'+esc(T.needXi(SQ.size))+'</span>')+'</div>'+
      '<div class="sq-pitch"><h3 class="sq-h">'+esc(T.starters)+'</h3><div class="sq-grid sq-xi">'+Array.from({length:SQ.size}, (_, i)=>slot(SQ.xi, i, 'xi')).join('')+'</div></div>'+
      '<h3 class="sq-h">'+esc(T.bench)+'</h3><div class="sq-mgrid">'+Array.from({length:SQ_BENCH}, (_, i)=>{ const id=SQ.bench[i];
        return id ? sqMini(sqCardOf(id), {fit:sqFit(id), below:'<div class="sq-acts"><button onclick="sqMove(\''+id+'\',\'xi\')">'+esc(T.toXi)+'</button><button onclick="sqMove(\''+id+'\',\'\')">'+esc(T.out)+'</button></div>'})
          : '<div class="sq-m sq-empty">'+esc(T.empty)+'</div>'; }).join('')+'</div>'+
      '<h3 class="sq-h">'+esc(T.club)+' · '+coll.length+'</h3><div class="sq-mgrid">'+coll.map(x=>sqMini(x.c, {fit:sqFit(x.id), below:'<div class="sq-acts">'+
        '<button onclick="sqMove(\''+x.id+'\',\'xi\')">'+esc(T.toXi)+'</button><button onclick="sqMove(\''+x.id+'\',\'bench\')">'+esc(T.toBench)+'</button></div>'})).join('')+'</div>';
  } else if(SQ_TAB==='club'){
    title=T.tabClub;
    const coll=SQ.cards.filter(c=>!c.un).map(c=>({id:c.id, c:sqCardOf(c.id)})).filter(x=>x.c).sort((a, b)=>sqOvr(b.c)-sqOvr(a.c));
    body='<div class="sq-mgrid">'+coll.map(x=>{ const v=sqValue(sqOvr(x.c)), q=sqQuick(sqOvr(x.c)), use=sqInUse(x.id);
      return sqMini(x.c, {fit:sqFit(x.id), below:use ? '<div class="sq-tag">'+esc(SQ.xi.indexOf(x.id)>=0 ? T.starters : T.bench)+'</div>' :
        '<div class="sq-acts"><button onclick="sqList(\''+x.id+'\')">'+esc(T.list)+' '+money(v)+'</button><button onclick="sqQuickSell(\''+x.id+'\')">'+esc(T.quick)+' '+money(q)+'</button></div>'}); }).join('')+'</div>';
  } else if(SQ_TAB==='un'){
    title=T.tabUn;
    const un=SQ.cards.filter(c=>c.un).map(c=>({id:c.id, inst:c, c:sqPool().byK.get(c.k)})).filter(x=>x.c).sort((a, b)=>sqOvr(b.c)-sqOvr(a.c));
    body=un.length ? '<div class="sq-row"><button class="sq-go sm" onclick="sqKeepAll()">'+esc(T.keepAll)+'</button>'+
        '<button class="sq-ghost" onclick="sqSellDupes()">'+esc(T.sellDupes)+'</button></div>'+
      '<div class="sq-mgrid'+(SQ_OPENED ? ' sq-reveal' : '')+'">'+un.map(x=>{ const v=sqValue(sqOvr(x.c)), q=sqQuick(sqOvr(x.c)), dup=sqIsDup(x.inst);
        return sqMini(x.c, {below:(dup ? '<div class="sq-dup">'+esc(T.dup)+'</div>' : '')+'<div class="sq-acts">'+
          (dup ? '' : '<button class="go" onclick="sqKeep(\''+x.id+'\')">'+esc(T.keep)+'</button>')+
          '<button onclick="sqQuickSell(\''+x.id+'\')">'+esc(T.quick)+' '+money(q)+'</button><button onclick="sqList(\''+x.id+'\')">'+esc(T.list)+' '+money(v)+'</button></div>'}); }).join('')+'</div>'
      : '<p class="sq-hint">'+esc(T.unEmpty)+'</p>';
  } else if(SQ_TAB==='rivals'){
    const S=sqSeason(), st=S.stage;
    title=T.seasonN(S.n);
    const ready=SQ.xi.length===SQ.size;
    body=sqSeasonPath()+
      '<div class="sq-stats"><span><em>'+esc(T.seasonLbl)+'</em><b>'+S.n+'</b></span>'+
      (st ? '' : '<span><em>'+esc(T.week)+'</em><b>'+S.week+' / '+SQ_SEASON_WEEKS+'</b></span><span><em>'+esc(T.cupsLbl)+'</em><b>'+S.cups+' / '+SQ_CUPS_WEEK+'</b></span>')+
      '<span><em>'+esc(T.qpLbl)+'</em><b>'+S.qp+' / '+SQ_QP_NEED+'</b></span>'+(myT ? '<span><em>'+esc(T.pow)+'</em><b>'+myT.pow+'</b></span>' : '')+'</div>'+
      (st ? '' : '<u class="sq-qp"><s style="width:'+Math.min(100, Math.round(S.qp/SQ_QP_NEED*100))+'%"></s></u>')+
      '<p class="sq-hint">'+esc(st ? T.stageHint[st] : T.seasonRule(SQ_QP_NEED))+'</p>'+
      (ready ? '<button class="sq-go" onclick="sqPlay()">'+esc(st ? T.playStage(T.stageName[st]) : T.playCupN)+'</button>' : '<p class="sq-warn">'+esc(T.needXi(SQ.size))+'</p>')+
      (SQ_LAST && SQ_LAST.kind==='season' ? sqResHTML() : '');
  } else if(SQ_TAB==='battles'){
    title=T.tabBattles;
    const left=SQ.sb.played<SQ_BATTLE_MAX, ready=SQ.xi.length===SQ.size;
    body='<div class="sq-stats"><span><em>'+esc(T.bPts)+'</em><b>'+SQ.sb.pts+'</b></span><span><em>'+esc(T.week)+'</em><b>'+SQ.week+'</b></span></div>'+
      '<p class="sq-hint">'+esc(T.bPlayed(SQ.sb.played, SQ_BATTLE_MAX))+' · '+esc(T.bReward)+'</p>'+
      (!ready ? '<p class="sq-warn">'+esc(T.needXi(SQ.size))+'</p>' : !left ? '<p class="sq-warn">'+esc(T.bLeft)+'</p>' :
        '<div class="sq-diffs">'+T.diff.map((n, d)=>'<button class="sq-diff d'+d+'" onclick="sqBattle('+d+')"><b>'+esc(n)+'</b><span>×'+SQ_BATTLE_MULT[d]+'</span></button>').join('')+'</div>')+
      (SQ_LAST && SQ_LAST.kind==='battle' ? sqResHTML() : '');
  } else if(SQ_TAB==='draft'){
    title=T.tabDraft;
    const dr=SQ.dr;
    if(!dr || dr.done){
      body=(dr && dr.done ? '<h3 class="sq-h">'+esc(T.drDone)+'</h3><div class="sq-mgrid">'+dr.picks.map(k=>sqMini(sqPool().byK.get(k))).join('')+'</div>' : '')+
        (SQ_LAST && SQ_LAST.kind==='draft' ? sqResHTML() : '')+
        '<p class="sq-hint">'+esc(T.hDraft)+' '+esc(T.drCost(money(SQ_DRAFT_COST)))+' · '+esc(T.fmt[SQ.size])+'</p>'+
        '<button class="sq-go"'+(SQ.coins<SQ_DRAFT_COST ? ' disabled' : '')+' onclick="sqDraftStart()">'+esc(dr ? T.drNew : T.drStart)+'</button>';
    } else if(dr.opts){
      const cap=!dr.picks.length;
      /* Как в драфте FC, главное — сыгранность: у каждого варианта видно, сколько она прибавит составу и будет ли
         ровно один IGL (27.10, его «fut draft ещё режим интересный»). Сверху — сила уже выбранных. */
      const got=dr.picks.map(k=>sqPool().byK.get(k)).filter(Boolean);
      const synOf=cs=>{ try{ return cs.length>1 ? computeSynergy(cs).bonus : 0; }catch(e){ return 0; } };
      const syn0=synOf(got), igl0=got.filter(c=>sqRole(c)==='roleIGL').length;
      const prev=SQ.size; SQ.size=dr.size;
      const pow0=got.length ? sqWithCards(()=>buildTeam(got)).pow : 0;
      SQ.size=prev;
      body=(got.length ? '<div class="sq-stats"><span><em>'+esc(T.pow)+'</em><b>'+pow0+'</b></span><span><em>'+esc(T.syn)+'</em><b>+'+synCap(syn0)+'</b></span></div>' : '')+
        '<div class="sq-mgrid sq-dpicks">'+got.map(c=>sqMini(c)).join('')+Array.from({length:dr.size-dr.picks.length}, ()=>'<div class="sq-m sq-empty">?</div>').join('')+'</div>'+
        '<h3 class="sq-h">'+esc(cap ? T.drPickCap : T.drPick(dr.picks.length+1, dr.size))+'</h3>'+
        '<div class="sq-mgrid">'+dr.opts.map((k, i)=>{ const c=sqPool().byK.get(k);
          const add=got.length ? synOf(got.concat([c]))-syn0 : 0, igl=igl0+(sqRole(c)==='roleIGL' ? 1 : 0);
          const last=dr.picks.length===dr.size-1;
          const hint=(got.length ? '<div class="sq-dsyn'+(add>0 ? ' up' : '')+'">'+esc(T.syn)+' '+(add>0 ? '+'+add : '0')+'</div>' : '')+
            (last && igl!==1 ? '<div class="sq-dup">'+esc(T.noIgl)+'</div>' : '');
          return sqMini(c, {click:'sqDraftPickI('+i+')', below:hint}); }).join('')+'</div>';
    } else {
      const cards=dr.picks.map(k=>sqPool().byK.get(k)).filter(Boolean);
      const prev=SQ.size; SQ.size=dr.size; const t=sqWithCards(()=>buildTeam(cards)); SQ.size=prev;
      body='<div class="sq-stats"><span><em>'+esc(T.pow)+'</em><b>'+t.pow+'</b></span><span><em>'+esc(T.syn)+'</em><b>+'+synCap(t.syn.bonus)+'</b></span>'+
        '<span class="'+(t.roleBonus ? 'ok' : 'warn')+'">'+esc(t.roleBonus ? T.igl : T.noIgl)+'</span></div>'+
        '<div class="sq-mgrid">'+cards.map(c=>sqMini(c)).join('')+'</div>'+
        '<p class="sq-hint">'+esc(T.drRound(dr.round+1))+' · '+esc(T.drNeed(Math.ceil(Math.round(100/dr.size)/4)))+'</p>'+
        '<button class="sq-go" onclick="sqDraftRound()">'+esc(T.drPlayRound)+'</button>'+(SQ_LAST && SQ_LAST.kind==='draft' ? sqResHTML() : '');
    }
  } else if(SQ_TAB==='sbc'){
    title=T.tabSbc;
    const reqTxt=s=>[T.sbcReq.n(s.n)].concat(s.req.min ? [T.sbcReq.min(s.req.min)] : [], s.req.avg ? [T.sbcReq.avg(s.req.avg)] : [], s.req.nat ? [T.sbcReq.nat] : [], s.req.reg ? [T.sbcReq.reg] : []).join(' · ');
    if(SQ_SBC_SEL){
      const s=SQ_SBC.find(x=>x.id===SQ_SBC_SEL.id), sel=SQ_SBC_SEL.sel, ok=sqSbcCheck(s, sel);
      const pool=sqSbcPool().sort((a, b)=>sqOvr(a.c)-sqOvr(b.c));
      body='<button class="sq-crumb" onclick="sqTab(\'sbc\')">‹ '+esc(T.tabSbc)+'</button><h3 class="sq-h">'+esc(T.sbc[s.id])+' · '+esc(T.packNames[s.r])+'</h3>'+
        '<p class="sq-hint">'+esc(reqTxt(s))+'. '+esc(T.sbcPick)+'</p>'+
        '<div class="sq-row"><button class="sq-ghost" onclick="sqSbcAuto()">'+esc(T.sbcAuto)+'</button><button class="sq-go sm"'+(ok ? '' : ' disabled')+' onclick="sqSbcSubmit()">'+esc(T.sbcSubmit)+' ('+sel.length+'/'+s.n+')</button></div>'+
        '<div class="sq-mgrid">'+pool.map(x=>sqMini(x.c, {sel:sel.indexOf(x.id)>=0, click:'sqSbcToggle(\''+x.id+'\')'})).join('')+'</div>';
    } else {
      body='<div class="sq-sbcs">'+SQ_SBC.map(s=>'<button class="sq-sbc p-'+s.r+'" onclick="sqSbcOpen(\''+s.id+'\')"><b>'+esc(T.sbc[s.id])+'</b><span>'+esc(reqTxt(s))+'</span><em>'+esc(T.packNames[s.r])+'</em></button>').join('')+'</div>';
    }
  } else if(SQ_TAB==='evo'){
    title=T.tabEvo;
    body=sqEvoHTML();
  } else if(SQ_TAB==='packs'){
    title=T.tabPacks;
    const own=SQ.packs.reduce((m, p)=>{ m[p]=(m[p]||0)+1; return m; }, {});
    body=(Object.keys(own).length ? '<h3 class="sq-h">'+esc(T.yourPacks)+'</h3><div class="sq-packs">'+Object.keys(own).map(p=>
        '<button class="sq-pack p-'+p+'" onclick="sqPackOpen(\''+p+'\', false)"><b>'+esc(T.packNames[p])+' ×'+own[p]+'</b><em>'+esc(T.open)+'</em></button>').join('')+'</div>' : '')+
      '<div class="sq-packs">'+SQ_PACKS.map(P=>'<button class="sq-pack p-'+P.id+'"'+(SQ.coins<P.cost ? ' disabled' : '')+' onclick="sqPackOpen(\''+P.id+'\', true)">'+
        '<b>'+esc(T.packNames[P.id])+'</b><span>'+esc(T.packDesc[P.id])+'</span><em><i class="cc-vb-ic"></i>'+money(P.cost)+'</em></button>').join('')+'</div>';
  } else if(SQ_TAB==='market'){
    title=T.tabMkt;
    sqMktTick();
    const now=Date.now();
    body='<p class="sq-hint">'+esc(T.mktHint)+'</p><div class="sq-mgrid">'+SQ.mkt.list.slice().sort((a, b)=>a.ends-b.ends).map(l=>{
      const c=sqPool().byK.get(l.k), bot=sqBotBid(l, now), lead=l.mine && l.mine>=bot;
      return sqMini(c, {below:'<div class="sq-lot"><span>'+esc(T.curBid)+' <b>'+money(Math.max(bot, l.mine))+'</b>'+(lead ? ' · <i>'+esc(T.youTop)+'</i>' : '')+'</span>'+
        '<span>'+sqLeft(l.ends-now)+'</span></div><div class="sq-acts"><button onclick="sqBid(\''+l.id+'\')">'+esc(T.bid)+'</button>'+
        '<button class="go" onclick="sqBuyNow(\''+l.id+'\')">'+esc(T.buyNow)+' '+money(l.buy)+'</button></div>'}); }).join('')+'</div>'+
      (SQ.sells.length ? '<h3 class="sq-h">'+esc(T.mySales)+'</h3><div class="sq-mgrid">'+SQ.sells.map(s=>sqMini(sqPool().byK.get(s.k), {below:
        '<div class="sq-lot"><span>'+esc(T.listed)+' <b>'+money(s.price)+'</b></span><span>'+sqLeft(s.ends-now)+'</span></div>'})).join('')+'</div>' : '');
    SQ_TIMER=setInterval(()=>{ if(SQ_TAB==='market' && document.getElementById('screen-sq').classList.contains('active')) sqRender(); else { clearInterval(SQ_TIMER); SQ_TIMER=null; } }, 5000);
  } else {
    title=T.tabObj;
    body=sqWqHTML()+'<div class="sq-objs">'+SQ_OBJ.map(o=>{ const cur=Math.min(o.goal, o.cur(SQ)), done=SQ.claimed[o.id];
      const rw=o.r.coins ? money(o.r.coins)+' '+T.coins : T.packNames[o.r.pack];
      return '<div class="sq-obj'+(done ? ' done' : '')+'"><b>'+esc(T.obj[o.id])+'</b><span>'+cur+' / '+o.goal+' · '+esc(T.reward)+': '+esc(rw)+'</span>'+
        (done ? '<em>'+esc(T.claimed)+'</em>' : '<button'+(cur<o.goal ? ' disabled' : '')+' onclick="sqClaim(\''+o.id+'\')">'+esc(T.claim)+'</button>')+'</div>'; }).join('')+'</div>';
  }
  root.innerHTML='<div class="sq-top">'+(SQ_TAB==='home' ? '<button class="sq-back" onclick="show(\'screen-mode\')">‹ '+esc(T.back)+'</button>' : back)+
    '<h2>'+esc(title)+'</h2><span class="sq-wal"><em>'+esc(T.coins)+'</em><b><i class="cc-vb-ic"></i>'+money(SQ.coins)+'</b></span>'+
    '<span class="sq-wal"><em>'+esc(T.seasonLbl)+'</em><b>'+sqSeason().n+'</b></span></div>'+
    (SQ_NOTE ? '<div class="sq-flash">'+esc(SQ_NOTE)+'</div>' : '')+
    '<div class="sq-body">'+body+'</div>'+
    (SQ_TAB==='home' ? '<div class="sq-foot"><button class="sq-reset" onclick="sqReset()">'+esc(T.reset)+'</button></div>' : '');
  SQ_NOTE='';
}

// Who the AI ends up with. This used to weight by 1 + rating/100*3, the same
// curve the player's packs were moved off years ago because it makes a 96 only
// about 1.4x likelier than a 60 -- which is to say the field was assembled
// almost at random while the player was dealt the top of the pool and then got
// to pick the best of four.
//
// On the 2026 islands that hid, because their pools are dense between 80 and 89
// and even a near-random draw lands there. The 2025 pool has a hollow middle and
// a median of 68, so the field collapsed to it: the player came out stronger
// than every single AI team and won 9 of 22 games.
//
// Card mode now deals to the AI from the same curve it deals to the player, so
// both sides see the same shape of pool. The free modes keep the old draw --
// they are not a competition against a seeded field.
function weightedPick(fromList){
  const weighted = CARD_MODE
    ? fromList.map(p=>({p, w: packWeightFor(p)}))
    : fromList.map(p=>({p, w: 1 + (p.rating/100)*3}));
  const total = weighted.reduce((s,x)=>s+x.w,0);
  const draw=()=>{
    let r=Math.random()*total, i=0;
    for(;i<weighted.length;i++){ r-=weighted[i].w; if(r<=0) break; }
    return Math.min(i, weighted.length-1);
  };
  if(!CARD_MODE) return draw();
  // The player is shown a pack of four and keeps one. Drawing once per slot
  // handed the field a quarter of that choice, which is the other half of why
  // the player outranked every AI team rather than merely most of them. The AI
  // now sees the same four and keeps the best of them, so both sides are
  // choosing rather than one choosing and one being dealt to.
  let best=-1, bestOvr=-Infinity;
  for(let k=0;k<PACK_SIZE;k++){
    const i=draw();
    const v=attrsFor(fromList[i]).ovr;
    if(v>bestOvr){ bestOvr=v; best=i; }
  }
  return best;
}

// AI-built teams share a region, or belong to the English-speaking cluster (EU/NAC/NAW),
// since players there can communicate regardless of home region. Other regions (Asia, Brazil,
// Middle East, Oceania) stay within their own region only.
const REGION_CLUSTER={ EU:'en', NAC:'en', NAW:'en', ASIA:'asia', BR:'br', ME:'me', OCE:'oce', UNK:'en' };
function clusterOf(p){ return REGION_CLUSTER[p.region] || 'en'; }

