/*@@PART js/career-2.js@@*/
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
  if(you && you.pow!=null){ CC_RACE_POW_NOW=you.pow; CC_RACE_EDGE_NOW=(you.closeEdge||0); }
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
/* ОБЛАЧНЫЕ СОХРАНЕНИЯ (16.10, «что ещё глобального» → «1»). Карьера жила только в localStorage: почистил браузер или
   сменил телефон — её нет. Теперь по коду-ключу (16 знаков, без путаных букв) сейвы карьер и менеджера уходят на сервер
   (mp.fncsdraft.com/vault, server/src/vault.js) сжатыми gzip и забираются на любом устройстве тем же кодом.
   Сервер о игре не знает ничего: ключ localStorage → строка. Отправка — через 45 с после сохранения и при уходе со
   вкладки, только изменившиеся слоты (подпись длина+хеш); удалённый тут слот удаляется и там. */
const CC_CLOUD_LS='fd_cloud_code', CC_CLOUD_SENT='fd_cloud_sent', CC_CLOUD_ALPH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// + fncsdraft_profile (30.10): ник и аватар вкладки «Профиль» едут в облако вместе с карьерами.
const CC_CLOUD_KEY=/^(fncsdraft_(career|manager)(_s\d{1,2})?|fncsdraft_profile)$/;
let CC_CLOUD_T=null, CC_CLOUD_AGAIN=false, CC_CLOUD_BUSY=false, CC_CLOUD_MSG='', CC_CLOUD_LIST=null, CC_CLOUD_ENTER=false, CC_CLOUD_ARM=false;
function ccCloudBase(){
  const h=(typeof MP!=='undefined' && MP.host) || '';
  if(!h && location.protocol==='file:') return null;
  return String(h||'wss://mp.fncsdraft.com').replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')+'/vault';
}
function ccCloudCode(){ try{ return localStorage.getItem(CC_CLOUD_LS)||''; }catch(e){ return ''; } }
function ccCloudFmt(c){ return String(c||'').replace(/(.{4})(?=.)/g, '$1-'); }
function ccCloudNewCode(){
  const a=new Uint32Array(16); crypto.getRandomValues(a);
  return Array.from(a, x=>CC_CLOUD_ALPH[x%32]).join('');
}
function ccCloudKeys(){
  const out=[];
  try{ for(let i=0; i<localStorage.length; i++){ const k=localStorage.key(i); if(CC_CLOUD_KEY.test(k)) out.push(k); } }catch(e){}
  return out.sort();
}
async function ccCloudPack(str){
  if(typeof CompressionStream==='undefined') return 'p:'+str;
  const cs=new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf=new Uint8Array(await new Response(cs).arrayBuffer());
  let bin=''; for(let i=0; i<buf.length; i+=0x8000) bin+=String.fromCharCode.apply(null, buf.subarray(i, i+0x8000));
  return 'g:'+btoa(bin);
}
async function ccCloudUnpack(d){
  d=String(d||'');
  if(d.slice(0,2)==='p:') return d.slice(2);
  const bin=atob(d.slice(2)), u=new Uint8Array(bin.length);
  for(let i=0; i<bin.length; i++) u[i]=bin.charCodeAt(i);
  const ds=new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(ds).text();
}
function ccCloudInfo(key, raw){
  try{
    if(key==='fncsdraft_profile'){ const p=JSON.parse(raw||'{}')||{}; return {kind:'profile', name:p.nick||''}; }
    const s=ccSaveParse(raw); if(!s) return {};
    if(/manager/.test(key)) return {kind:'mgr', name:(s.club||{}).name||'', day:((s.shadow||{}).career||{}).day||''};
    return {kind:'career', name:(s.player||{}).nick||'', day:(s.career||{}).day||'', earn:Math.round((s.career||{}).earnings||0)};
  }catch(e){ return {}; }
}
async function ccCloudPost(o){
  const b=ccCloudBase(); if(!b) throw new Error('offline');
  const r=await fetch(b, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(o)});
  const j=await r.json().catch(()=>({err:'json'}));
  if(!r.ok || j.err) throw new Error(j.err||('http '+r.status));
  return j;
}
function ccCloudSent(){ try{ return JSON.parse(localStorage.getItem(CC_CLOUD_SENT)||'{}')||{}; }catch(e){ return {}; } }
async function ccCloudPush(){
  const code=ccCloudCode(); if(!code || CC_CLOUD_BUSY) return;
  try{ ccLzFlush(); }catch(e){}
  CC_CLOUD_BUSY=true;
  const sent=ccCloudSent();
  try{
    const keys=ccCloudKeys();
    for(const k of keys){
      const raw=localStorage.getItem(k)||'';
      const sig=raw.length+':'+ccHashStr(raw);
      if(sent[k]===sig) continue;
      // Профиль — без права уронить отправку карьер: сервер до 30.10 этот ключ не знает и отвечает «key».
      if(k==='fncsdraft_profile'){
        try{ await ccCloudPost({code, op:'put', key:k, data:await ccCloudPack(raw), info:ccCloudInfo(k, raw), at:Date.now()}); sent[k]=sig; }catch(e){}
        continue;
      }
      await ccCloudPost({code, op:'put', key:k, data:await ccCloudPack(raw), info:ccCloudInfo(k, raw), at:Date.now()});
      sent[k]=sig;
    }
    // Слот удалён здесь — удаляется и в облаке, иначе на другом устройстве он вернулся бы.
    for(const k of Object.keys(sent)){
      if(k==='_at' || keys.indexOf(k)>=0) continue;
      await ccCloudPost({code, op:'del', key:k}); delete sent[k];
    }
    sent._at=Date.now();
    try{ localStorage.setItem(CC_CLOUD_SENT, JSON.stringify(sent)); }catch(e){}
    CC_CLOUD_MSG=''; CC_CLOUD_AGAIN=false;
  }catch(e){
    /* iPhone обрывает запрос свёрнутой вкладки («Load failed», Notion 23.10): это не отказ облака. Ошибку не
       показываем, а при возврате на вкладку отправляем снова (CC_CLOUD_AGAIN), как и обещает надпись. */
    CC_CLOUD_AGAIN=true;
    if(!(typeof document!=='undefined' && document.visibilityState==='hidden')) CC_CLOUD_MSG=String(e && e.message || e);
  }
  finally{ CC_CLOUD_BUSY=false; ccCloudDraw(); }
}
function ccCloudSoon(){
  if(!ccCloudCode()) return;
  clearTimeout(CC_CLOUD_T);
  CC_CLOUD_T=setTimeout(()=>{ ccCloudPush(); }, 45000);
}
try{ document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState==='hidden' && CC_CLOUD_T){ clearTimeout(CC_CLOUD_T); CC_CLOUD_T=null; ccCloudPush(); }
  else if(document.visibilityState==='visible' && CC_CLOUD_AGAIN){ CC_CLOUD_AGAIN=false; ccCloudPush(); }
}); }catch(e){}
// Панель на экране выбора карьеры.
function ccCloudDraw(){
  const box=document.getElementById('ccCloud'); if(!box) return;
  const T=L(), code=ccCloudCode();
  if(!ccCloudBase()){ box.hidden=true; return; }
  box.hidden=false;
  let h='<div class="cl-head"><b>☁ '+esc(T.clTitle)+'</b>';
  if(code){
    const sent=ccCloudSent();
    const when=sent._at ? new Date(sent._at).toLocaleString(LANG==='ru' ? 'ru-RU' : LANG, {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : '-';
    /* Код закрыт точками (28.10, его «скрой цифры облака, вдруг на стриме кто-то покажет»): показать — на 10 секунд,
       скопировать — не показывая. */
    h+='<span>'+esc(T.clOn)+'</span></div><div class="cl-code'+(CC_CLOUD_SHOW ? '' : ' cl-hid')+'">'+esc(CC_CLOUD_SHOW ? ccCloudFmt(code) : ccCloudFmt(code.replace(/./g, '•')))+'</div>'+
       '<div class="cl-row"><button class="cc-car-open" onclick="ccCloudShow()">'+esc(CC_CLOUD_SHOW ? T.clHide : T.clShow)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudCopy()">'+esc(CC_CLOUD_COPIED ? T.clCopied : T.clCopy)+'</button></div>'+
       '<p class="cl-sub">'+esc(T.clKeep)+'</p><p class="cl-sub">'+esc(T.clSent(when))+(CC_CLOUD_BUSY ? ' · '+esc(T.clBusy) : '')+'</p>'+
       '<div class="cl-row"><button class="cc-car-open" onclick="ccCloudPush()">'+esc(T.clPushNow)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudEnter()">'+esc(T.clOther)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudOff()">'+esc(T.clOff)+'</button></div>';
  } else {
    h+='<span>'+esc(T.clOffNow)+'</span></div><p class="cl-sub">'+esc(T.clWhy)+'</p>'+
       '<div class="cl-row"><button class="ch-play" onclick="ccCloudOn()">'+esc(T.clEnable)+'</button>'+
       '<button class="cc-car-open" onclick="ccCloudEnter()">'+esc(T.clHave)+'</button></div>';
  }
  if(CC_CLOUD_ENTER){
    h+='<div class="cl-enter"><input id="ccCloudIn" type="password" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX" autocapitalize="characters" autocomplete="off" spellcheck="false">'+
       '<button class="ch-play" onclick="ccCloudOpen()">'+esc(T.clOpen)+'</button></div>';
  }
  if(CC_CLOUD_LIST){
    const rows=CC_CLOUD_LIST.saves.map(sv=>{ let i={}; try{ i=JSON.parse(sv.info||'{}'); }catch(e){}
      return '<li><b>'+esc(i.name||sv.key)+'</b><span>'+esc((i.kind==='mgr' ? T.clMgr : i.kind==='profile' ? ccMeT().title : T.clCareer)+(i.day ? ' · '+i.day : '')+(i.earn ? ' · $'+ccNum(i.earn) : ''))+'</span></li>'; }).join('');
    h+='<div class="cl-list"><p class="cl-sub">'+esc(T.clFound(CC_CLOUD_LIST.saves.length))+'</p><ul>'+rows+'</ul>'+
       (CC_CLOUD_LIST.saves.length ? '<button class="ch-play" onclick="ccCloudRestore()">'+esc(CC_CLOUD_ARM ? T.clSure : T.clTake)+'</button>' : '')+'</div>';
  }
  if(CC_CLOUD_MSG) h+='<p class="cl-err">'+esc(T.clErr(CC_CLOUD_MSG))+'</p>';
  box.innerHTML=h;
}
let CC_CLOUD_SHOW=false, CC_CLOUD_COPIED=false, CC_CLOUD_SHOW_T=null;
function ccCloudShow(){
  CC_CLOUD_SHOW=!CC_CLOUD_SHOW; clearTimeout(CC_CLOUD_SHOW_T);
  if(CC_CLOUD_SHOW) CC_CLOUD_SHOW_T=setTimeout(function(){ CC_CLOUD_SHOW=false; ccCloudDraw(); }, 10000);
  ccCloudDraw();
}
function ccCloudCopy(){
  const t=ccCloudFmt(ccCloudCode()); if(!t) return;
  const done=function(){ CC_CLOUD_COPIED=true; ccCloudDraw(); setTimeout(function(){ CC_CLOUD_COPIED=false; ccCloudDraw(); }, 2000); };
  try{ navigator.clipboard.writeText(t).then(done, function(){}); }catch(e){}
}
function ccCloudOn(){
  try{ localStorage.setItem(CC_CLOUD_LS, ccCloudNewCode()); localStorage.removeItem(CC_CLOUD_SENT); }catch(e){}
  CC_CLOUD_MSG=''; ccCloudDraw(); ccCloudPush();
}
function ccCloudOff(){
  try{ localStorage.removeItem(CC_CLOUD_LS); localStorage.removeItem(CC_CLOUD_SENT); }catch(e){}
  CC_CLOUD_LIST=null; CC_CLOUD_ENTER=false; ccCloudDraw();
}
function ccCloudEnter(){ CC_CLOUD_ENTER=!CC_CLOUD_ENTER; CC_CLOUD_LIST=null; CC_CLOUD_ARM=false; ccCloudDraw(); try{ document.getElementById('ccCloudIn').focus(); }catch(e){} }
async function ccCloudOpen(){
  const el=document.getElementById('ccCloudIn');
  const code=String(el ? el.value : '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if(!/^[A-HJ-NP-Z2-9]{16}$/.test(code)){ CC_CLOUD_MSG=L().clBad; ccCloudDraw(); return; }
  try{ const j=await ccCloudPost({code, op:'list'}); CC_CLOUD_LIST={code, saves:j.saves||[]}; CC_CLOUD_MSG=''; CC_CLOUD_ARM=false; }
  catch(e){ CC_CLOUD_MSG=String(e && e.message || e); }
  ccCloudDraw();
}
// Забрать всё из облака: два нажатия — сейвы этого браузера с теми же ключами заменяются.
async function ccCloudRestore(){
  if(!CC_CLOUD_LIST) return;
  if(!CC_CLOUD_ARM){ CC_CLOUD_ARM=true; ccCloudDraw(); return; }
  const {code, saves}=CC_CLOUD_LIST, sent={};
  try{
    for(const sv of saves){
      const j=await ccCloudPost({code, op:'get', key:sv.key});
      const raw=await ccCloudUnpack(j.data);
      localStorage.setItem(sv.key, raw);
      sent[sv.key]=raw.length+':'+ccHashStr(raw);
    }
    sent._at=Date.now();
    localStorage.setItem(CC_CLOUD_LS, code);
    localStorage.setItem(CC_CLOUD_SENT, JSON.stringify(sent));
    CC_CLOUD_LIST=null; CC_CLOUD_ENTER=false; CC_CLOUD_ARM=false; CC_CLOUD_MSG='';
    CAREER=null;
    try{ careerRenderSlots(); }catch(e){}
    try{ homeRender(); }catch(e){}
  }catch(e){ CC_CLOUD_MSG=String(e && e.message || e); }
  ccCloudDraw();
}
/* ВКЛАДКА СО СТАРОЙ КАРЬЕРОЙ НЕ ПИШЕТ ПОВЕРХ НОВОЙ (Notion 22.10, игрок: «вышел и зашёл — карьеру отбросило к началу
   сезона»). Две вкладки одного слота (или проснувшаяся из кэша страница телефона) держат каждая свой CAREER, и
   любое сохранение старой стирало прогресс новой. Каждая запись ставит рядом с сейвом отметку <слот>_w (вкладка и
   счётчик); вкладка помнит свою. Отметка в хранилище чужая — слот переписан другой вкладкой: эта не пишет, а
   перечитывает сейв (перезагрузка), как только не идёт вечер. */
// var без значений: careerLoad может прийти раньше этой строки, а let/const там бросили бы (TDZ) и отметка не встала бы.
var CC_TAB_ID, CC_SAVE_MARK, CC_SAVE_N, CC_TAB_STALE;
function ccSaveMarkKey(){ return LS_SLOT(ccSlotMine())+'_w'; }
function ccSaveMarkAdopt(){ try{ CC_SAVE_MARK=localStorage.getItem(ccSaveMarkKey()); }catch(e){ CC_SAVE_MARK=null; } CC_TAB_STALE=false; }
function ccSaveStale(){
  if(CC_TAB_STALE) return true;
  let now=null; try{ now=localStorage.getItem(ccSaveMarkKey()); }catch(e){ return false; }
  if(now && CC_SAVE_MARK!==undefined && now!==CC_SAVE_MARK) CC_TAB_STALE=true;
  return CC_TAB_STALE;
}
function ccSaveStaleReload(){
  if(!CAREER || CAREER._mgr || !ccSaveStale()) return;
  if(typeof CAREER_RUN!=='undefined' && CAREER_RUN) return;
  location.reload();
}
try{
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') ccSaveStaleReload(); });
  window.addEventListener('pageshow', ()=>{ ccSaveStaleReload(); });
}catch(e){}
/* МЕСТО ПОД СЕЙВ — СНАЧАЛА БЕЗ ПОТЕРЬ (Notion 26.10, игрок: «3 дня не играли… в карьере 1 сентября закончили, сейчас
   17 августа»; журнал поломок 22.10 — QuotaExceededError, командная 2019, день 08-18). Сжатие своего сейва не спасало:
   квоту съели ДРУГИЕ слоты — карьеры и менеджеры, лежащие обычным JSON, — и снимки отмены каждого слота. Уровень 1:
   чужие слоты пересжимаются (без потерь, с проверкой распаковкой) и убираются чужие снимки отмены; уровень 2 — свой
   снимок отмены. Резать своё (CC_SAVE_TRIM) — только после этого. Сторож tools/check-career-save-room.js. */
function ccSaveMakeRoom(own, level){
  if(typeof LZString==='undefined') return false;
  let freed=false;
  const keys=[];
  try{ for(let i=0;i<localStorage.length;i++) keys.push(localStorage.key(i)); }catch(e){ return false; }
  keys.forEach(k=>{
    if(!k || k===own) return;
    try{
      if(/_undo$/.test(k)){
        if(level>=2 || k!==own+'_undo'){ localStorage.removeItem(k); freed=true; }
        return;
      }
      if(!/^fncsdraft_(career|manager)/.test(k) || /_(w|unread|undo)$/.test(k)) return;
      const raw=localStorage.getItem(k);
      if(!raw || raw.length<60000 || raw.slice(0, 3)===CC_SAVE_LZ) return;
      const z=LZString.compressToUTF16(raw);
      if(z.length+3>=raw.length || LZString.decompressFromUTF16(z)!==raw) return;
      localStorage.setItem(k, CC_SAVE_LZ+z); freed=true;
    }catch(e){}
  });
  return freed;
}
/* СЖАТИЕ В ФОНЕ (Notion 9.11, игрок на ПК: «если тренируюсь, жду 2–4 секунды… в новой карьере лагов нет»). Большой сейв
   не влезает обычным JSON и каждое сохранение сжималось lz-string прямо на клике (замер: 9 мс → 100–180 мс, на слабом ПК
   в разы дольше), а перед этим ещё раз пробовалась заведомо не влезающая запись. Теперь слот, раз ушедший в сжатие, сразу
   идёт в сжатие, а сжимает воркер: на клике остаётся только JSON.stringify. Очередь по ключу хранит последнее состояние,
   старые задачи не досчитываются. Уход со страницы и чтение слота дописывают очередь синхронно. */
var CC_LZ_ON={}, CC_LZ_SYNC=false, CC_LZ_Q={}, CC_LZ_W, CC_LZ_BUSY=null, CC_LZ_N=0;
function ccLzWorker(){
  if(CC_LZ_W!==undefined) return CC_LZ_W;
  CC_LZ_W=null;
  try{
    if(typeof Worker==='undefined' || typeof Blob==='undefined' || typeof URL==='undefined') return null;
    let src=null;
    for(const s of document.scripts){ const t=s.textContent||''; if(t.length<20000 && t.indexOf('var LZString=function')>=0){ src=t; break; } }
    if(!src) return null;
    const url=URL.createObjectURL(new Blob([src+'\n;onmessage=function(e){postMessage({key:e.data.key,n:e.data.n,z:LZString.compressToUTF16(e.data.json)});};'], {type:'text/javascript'}));
    const w=new Worker(url);
    w.onmessage=e=>ccLzDone(e.data);
    w.onerror=()=>{ CC_LZ_W=null; CC_LZ_BUSY=null; ccLzFlush(); };
    CC_LZ_W=w;
  }catch(e){ CC_LZ_W=null; }
  return CC_LZ_W;
}
function ccLzPut(key, json, write){
  CC_LZ_Q[key]={n:++CC_LZ_N, json:json, write:write};
  if(!ccLzWorker()) return ccLzFlush(key);
  ccLzKick();
}
function ccLzKick(){
  if(CC_LZ_BUSY || !CC_LZ_W) return;
  const key=Object.keys(CC_LZ_Q)[0]; if(!key) return;
  const j=CC_LZ_Q[key]; CC_LZ_BUSY={key:key, n:j.n};
  try{ CC_LZ_W.postMessage({key:key, n:j.n, json:j.json}); }catch(e){ CC_LZ_BUSY=null; ccLzFlush(); }
}
function ccLzDone(d){
  CC_LZ_BUSY=null;
  const j=d && CC_LZ_Q[d.key];
  if(j && j.n===d.n){ delete CC_LZ_Q[d.key]; try{ j.write(d.z); }catch(e){} }
  ccLzKick();
}
// key не задан — вся очередь. Синхронно: перед уходом со страницы и перед чтением слота.
function ccLzFlush(key){
  Object.keys(CC_LZ_Q).forEach(k=>{
    if(key && k!==key) return;
    const j=CC_LZ_Q[k]; delete CC_LZ_Q[k];
    try{ j.write(LZString.compressToUTF16(j.json)); }catch(e){}
  });
}
function ccLzDrop(key){ delete CC_LZ_Q[key]; }
try{
  const out=()=>{ if(CC_TAB_STALE) CC_LZ_Q={}; else ccLzFlush(); };
  window.addEventListener('pagehide', out);
  window.addEventListener('beforeunload', out);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') out(); });
}catch(e){}
function careerSave(){
  if(!CAREER) return;
  if(CAREER._mgr){ if(typeof mgrSave==='function') mgrSave(); return; }   // теневая карьера Fortnite Manager
  if(ccSaveStale()){ if(typeof console!=='undefined') console.warn('career save skipped: the slot was written by another tab'); ccSaveStaleReload(); return; }
  try{ if(typeof ccLockerCheck==='function') ccLockerCheck(); }catch(e){}
  try{ if(typeof ccBpCheck==='function') ccBpCheck(); }catch(e){}
  try{ if(typeof ccPirateCheck==='function') ccPirateCheck(); }catch(e){}
  // Экран карьер читает сейв не загружая его — пусть знает, есть ли у карьеры дивизионы сейчас.
  try{ if(CAREER.career) CAREER.career.noDiv=!!ccNoDivisions(); }catch(e){}
  try{ ccNightStamp(); }catch(e){}
  /* В командной карьере командная половина живёт на сервере, а не здесь.
     Пишется всё равно всё: localStorage — это кэш на случай обрыва, и карьера
     должна открыться, даже когда лобби недоступно. Наверх уходит только
     командная часть, и делает это mp.js по своему поводу. */
  // CC_MP_ADVANCE здесь значит «мы сейчас применяем ЧУЖОЕ состояние»: его
  // отправка обратно закольцевала бы двоих на одном и том же снимке.
  /* Посреди вечера командное состояние НЕ отправляется.

     Пока идёт вечер, оба считают его сами, шаг в шаг, под одним сидом; итог
     сводит сервер в конце (ccMpClose). Присланное в середине состояние
     применяется у напарника немедленно — а ccApplyTeamState выбрасывает кэши
     мира (ccWorldReset). То есть один игрок сохранился, а у второго посреди
     игры пересобралась сцена: дальше это уже разные вечера.

     Признак «идёт вечер» — подменённый генератор: он ставится на старте и
     снимается на закрытии (CC_MP_RAND). */
  if(!CC_MP_RAND && typeof ccMXCanStamp==='function') ccMXCanStamp();
  if(ccMpOn() && !CC_MP_ADVANCE && !CC_MP_RAND && !CC_MP_HOLD && typeof MP!=='undefined' && MP.push)
    MP.push(ccTeamState());
  try{ ccBoardSoon(); }catch(e){}
  const key=LS_SLOT(ccSlotMine());   // в свой слот, а не в тот, куда указывает другая вкладка
  /* НЕ ВЛЕЗЛО — СЖАТЬ, А НЕ РЕЗАТЬ (его скрин 1.10, iPhone: «This career is not being saved
     (QuotaExceededError)»). Safari даёт сайту около 5 МБ, строки там по два байта, а полгода карьеры —
     миллион символов (журнал игроков, PR, деньги, Мейджор), и слотов несколько. Сжатый сейв (lz-string)
     в ~7 раз меньше; пишется только когда обычный не влез, чтобы пробы и инструменты читали JSON как
     раньше. Обрезка (CC_SAVE_TRIM) — уже после сжатия. */
  let lz=false, room=0;
  for(let step=0; step<=CC_SAVE_TRIM.length; step++){
    try{
      const json=JSON.stringify(CAREER);
      if(!lz && CC_LZ_ON[key] && typeof LZString!=='undefined') lz=true;   // этот слот уже не влезал — сразу в сжатие
      if(!lz){ try{ localStorage.setItem(key, json); ccLzDrop(key); }
               catch(e1){ if(!/quota|exceed/i.test(String(e1&&e1.name||e1)) || typeof LZString==='undefined') throw e1; lz=true; } }
      if(lz){
        // В фон — только слот, уже писавшийся сжатым; первый раз, после чистки места и обрезки (room, step) — синхронно,
        // чтобы нехватку места увидел этот цикл.
        if(CC_LZ_ON[key] && step===0 && !room && !CC_LZ_SYNC)
          ccLzPut(key, json, z=>{ try{ localStorage.setItem(key, CC_SAVE_LZ+z); }
                                  catch(e2){ CC_LZ_SYNC=true; if(CAREER && !CAREER._mgr && LS_SLOT(ccSlotMine())===key) careerSave(); } });
        else { ccLzDrop(key); localStorage.setItem(key, CC_SAVE_LZ+LZString.compressToUTF16(json)); CC_LZ_ON[key]=1; }
      }
      try{ if(!CC_TAB_ID) CC_TAB_ID=Math.random().toString(36).slice(2, 10); CC_SAVE_N=(CC_SAVE_N||0)+1;
           const mk=CC_TAB_ID+':'+CC_SAVE_N; localStorage.setItem(ccSaveMarkKey(), mk); CC_SAVE_MARK=mk; }catch(e){}
      CC_SAVE_FAIL=null;
      careerSaveWarn();
      try{ ccCloudSoon(); }catch(e){}
      return;
    }catch(e){
      CC_SAVE_FAIL=String(e&&e.name||e);
      // Out of room rather than broken: give something up and write it again.
      // Anything else is not a size problem and trimming will not fix it.
      if(!/quota|exceed/i.test(CC_SAVE_FAIL)) break;
      // Сначала место за счёт чужого, без потерь (ccSaveMakeRoom) — тот же шаг ещё раз.
      let made=false;
      while(room<2 && !made){ room++; made=ccSaveMakeRoom(key, room); }
      if(made){ step--; continue; }
      if(step===CC_SAVE_TRIM.length) break;
      if(!CC_SAVE_TRIM[step](CAREER.career)) continue;
    }
  }
  if(typeof console!=='undefined') console.warn('career save failed: '+CC_SAVE_FAIL);
  careerSaveWarn();
}
/* And it says so on the screen, not only in the console.

   A console warning is a warning nobody reads. The player's report, 17 August:
   "the saves do not work" — and everything after that point was a career being
   played on a save that was never being written, which reads from the inside as
   the day resetting itself every time the page is opened. */
function careerSaveWarn(){
  const old=document.getElementById('ccSaveFail');
  if(!CC_SAVE_FAIL){ if(old) old.remove(); return; }
  try{ ccErrLog('save', CC_SAVE_FAIL); }catch(e){}
  const box=old || document.createElement('div');
  box.id='ccSaveFail'; box.className='cc-save-fail';
  box.textContent=L().ccSaveFail(CC_SAVE_FAIL);
  if(!old) document.body.appendChild(box);
}
function careerExists(){
  try{ return !!localStorage.getItem(LS_SLOT(ccSlotMine())); }catch(e){ return false; }
}

// The season, week by week. Division 1 is the only division with a weekly
// Performance Evaluation and the only one whose cup has a Weekly Final, so the
// same week reads differently depending on where you are standing.
//
// CAREER_WEEKS moved down to the clock and became the measured year's own
// forty-three. This still walks weeks because the ladder is weekly — a cup runs
// Monday and Tuesday and those are two windows of one tournament, not two.
function careerSchedule(){
  const div=CAREER && CAREER.career ? CAREER.career.division : 5;
  const out=[];
  for(let w=1;w<=CAREER_WEEKS;w++){
    if(w===5)  { out.push({w, type:'major', title:L().chEvMajor1, sub:L().chEvMajor1Sub}); continue; }
    if(w===10) { out.push({w, type:'major', title:L().chEvMajor2, sub:L().chEvMajor2Sub}); continue; }
    if(w===11) { out.push({w, type:'gc',    title:L().chEvGC,     sub:L().chEvGCSub});     continue; }
    out.push({w, type:'cup',
      title:L().chEvCup.replace('{N}', div),
      sub: div===1 ? L().chEvCupSubD1 : L().chEvCupSub});
  }
  return out;
}
// What the button below leads to: the first thing this week actually holds,
// read off the calendar rather than asked of a schedule. A week with nothing in
// it says so, and the button offers to move past it instead of pretending.
/* What today is.

   It used to answer for the week — the first thing the week held, whichever day
   it fell on — which was right while the clock jumped a week at a time and
   wrong the moment it started walking. On a Wednesday it kept showing Monday's
   cup, so a free day never arrived and the day never got to ask its question.

   Today, then, and nothing else. A day with nothing on it is 'free', which is
   what puts the day's own panel where the match card goes. */
// What a day is about when it holds more than one thing. 13 June is both a
// Victory Cup and a Division 1 Weekly Final; taking whichever the calendar
// happened to push first hid the final the player had spent a week earning.
//
// A Victory Cup outranks a Reload day but not the ladder: the ladder is what the
// career is for, and a day holding both is a ladder day.
/* Про-Ам — выше кубков: 12.07 и 6.09 — воскресенья, и в тот же день стоит Victory Cup; без ранга
   Про-Ам шёл последним, careerNext брал Victory Cup, и принятое приглашение было не сыграть
   (сторож check-career-proam-zb 9.09: «Duos Victory Cup» вместо Сан-Паулу). Играется он только по
   принятому письму (careerProAmCan), иначе день остаётся за Victory Cup. */
const CC_KIND_RANK=['globals','gc','summit','major','proam','nations','cup','final','eval','victory','reload'];
/* What the tile on the hub is actually looking at.

   His question, 17 August: why does it say 11 games when it plays 12. Because it
   said eleven whatever was next - the panel printed CAREER_CUP_GAMES and
   "careerCupCut of careerCupSize" no matter which event it was announcing, and
   those are the divisional cup's numbers. The cup was the only event that
   existed when the panel was written and nothing revisited it as the circuit
   grew, so a Reload final - eight games, twenty duos, three seats - announced
   itself as eleven games and fifty out of a hundred and fifty.

   Read off the same tables the runners read, so a number here can only be wrong
   if it is wrong where it is played. An Opens says the real open's numbers, the
   same ones its card and its standings say: see ccOpenScale. */
function ccNextShape(next){
  const cr=CAREER && CAREER.career;
  const div=cr ? cr.division : 5;
  const cup={games:CAREER_CUP_GAMES, cut:careerCupCut(div), of:careerCupSize(div)};
  const k=next && next.type;
  // In this season's teams, the way the runners read the same tables. Without
  // it the card over a trio night promised a room of fifty and a cut of
  // twenty-five and the night played thirty-three and seventeen.
  const stage=(tbl, ev)=>{ const st=ev && ccScaleStage(tbl[ev.stage]);
    return st ? {games:st.games, cut:st.cut, of:st.field} : cup; };
  if(k==='reload'){
    const ev=careerReloadOn(careerToday());
    const st=ev && ccScaleStage(CC_RELOAD_STAGE[ev.stage]);
    if(!st) return cup;
    return ev.stage==='open'
      ? {games:st.games, cut:ccOpenAdvanceNow(), of:ccOpenTrue()}
      : {games:st.games, cut:st.cut, of:st.field};
  }
  if(k==='major')   return stage(CC_MAJOR_STAGE, careerMajorOn(careerToday()));
  if(k==='summit')  return stage(CC_SUMMIT_STAGE, careerSummitOn(careerToday()));
  // The Weekly Final pays its top ten, which is the line the card draws.
  if(k==='final')   return {games:CC_WF_GAMES, cut:10, of:ccTeams(CAREER_CUP_CUT)};
  if(k==='eval')    return {games:ccEvalR1Games(), cut:ccTeams(CC_EVAL_CUT), of:ccTeams(CAREER_CUP_FIELD)};
  if(k==='victory'){
    // A Victory Cup runs solo or duo depending on the day, and the two are
    // different rooms - twice the entrants and twice the cut in solo.
    const ev=(careerYearDays().get(careerToday())||[]).find(e=>e.kind==='victory');
    const solo=!!(ev && ev.mode==='solo');
    const vc=ev ? ccCupScore(ev, 1) : null;
    return {games:(vc && vc.cap>0 && vc.cap<=15) ? vc.cap : CC_VICTORY_R1_GAMES, cut:careerVictoryCut(solo),
            of:careerVictoryField(solo)};
  }
  if(k==='globals') return {games:CC_GLOB_GAMES, cut:0, of:ccGlobField()};
  /* Кубок наций своей ветки не имел и падал в дивизионный кубок: финал в Катовице показывал «матч 1 из 11»
     и «50 проходят из 190» (Notion «19.10», скрин 16). Числа — те же, что читает runCareerNations:
     отбор — соло до ста человек, проходит один; квалификация — своя комната зоны и её квота; финал — 12 игр. */
  if(k==='nations'){
    try{
      const ev=careerNationsOn(careerToday()), st=ccNatStage(ev), S=CC_NATIONS[st], mine=ccNationsMine();
      if(st==='final') return {games:S.games, cut:0, of:CC_NATIONS_FIELD};
      if(st==='trial') return {games:S.games, cut:1, of:1+Math.min(99, Math.max(0, ((mine && mine.others)||[]).length-(CC_NATIONS_SQUAD-1)))};
      const lobbies=ccNatQualLobbies(mine.zone, mine);
      let at=0; lobbies.forEach((l,i)=>{ if(l.length<lobbies[at].length) at=i; });
      return {games:S.games, cut:ccNatSlotsOf(mine.zone, lobbies, at), of:lobbies[at].length+1};
    }catch(e){ return cup; }
  }
  /* Solo Series своей ветки не имела и падала в дивизионный кубок: скриншот
     30 августа, страница «playin» — «33 проходят из 113, матч 1 из 11» над
     квалом, который играет 4900 человек, десять игр и топ-100. Вопрос:
     «почему 33 из 113, разве так у Epic Solo Series работает?». Цифры — те
     же, что читает раннер (runCareerSoloSeries). */
  if(k==='solo'){
    const ev=careerSoloSeriesOn(careerToday());
    // FNCS Solos носит свои числа на самой стадии — та же таблица, что читает
    // раннер, чтобы плитка дня и вечер не расходились.
    if(ev && ev.spec) return {games:ev.spec.games, cut:ccSolosCut(ev.spec),
                              of:ev.spec.open ? careerVictoryField(true) : ev.spec.field};
    const st=ev ? ev.stage : 'qual';
    if(st==='heats') return {games:CC_SOLO_HEAT_GAMES, cut:soloSeriesHeatCut(), of:CC_SOLO_FIELD};
    if(st==='final') return {games:CC_SOLO_FINAL_GAMES, cut:0, of:CC_SOLO_FIELD};
    return {games:CC_SOLO_QUAL_GAMES, cut:soloSeriesQualCut(), of:careerVictoryField(true)};
  }
  if(k==='gc'){
    /* Two different tournaments share this kind — the Last Chance and the
       Championship in Paris — and this branch answered for neither.

       careerRcOn returns {stage, label}, and the three tests below compared it
       against a string, so none of them ever matched and both events fell
       through to the divisional cup at the bottom: Paris announced itself as
       eleven games and two hundred teams with a top fifty, against the ten
       games, forty duos and top seven it actually is. It had always done that;
       nothing read the shape until the next-up card asked it to. */
    const lc=careerGclcOn(careerToday());
    if(lc) return lc.final
      ? {games:CC_GCLC_FINAL.games, cut:0, of:ccTeams(CC_GCLC_FINAL.teams)}
      : {games:(CC_GCLC_ROUND[lc.round]||{}).games,
         cut:ccTeams((CC_GCLC_ROUND[lc.round]||{}).cut), of:ccTeams(CAREER_CUP_FIELD)};
    const g=careerRcOn(careerToday());
    const st=g && g.stage;
    // Two pools of twenty is a field of forty, which is what a player is in.
    if(st==='group')    return {games:CC_RC_GROUP.games, cut:ccTeams(CC_RC_GROUP.direct), of:ccTeams(CC_RC_GROUP.teams*2)};
    if(st==='survival') return {games:CC_RC_SURV.games,  cut:ccTeams(CC_RC_SURV.cut),     of:ccTeams(CC_RC_SURV.teams)};
    if(st==='final')    return {games:CC_RC_FINAL.games, cut:0,                           of:ccTeams(CC_RC_FINAL.teams)};
  }
  return cup;
}
function careerNext(){
  const days=careerEvents(), today=careerToday();
  for(let d=0; d<1; d++){
    let on=days.get(today)||[];
    if(on.length>1){
      /* ЛАН в тот же день, что кубок или Performance Evaluation, — значительнее их (правило 30.08 «оставить, где больше
         призов или значительный»; проба всех капов 9.10: Games of the Future 18.12.2025 уступал оценке недели). Ранг — как
         у Про-Ама; без приглашения день, как и раньше, отходит следующему играбельному вечеру. */
      const lanToday=(()=>{ try{ const v=careerVictoryOn(today); return !!(v && v.lan); }catch(e){ return false; } })();
      const rank=e=>{ const i=CC_KIND_RANK.indexOf(e.kind==='victory' && lanToday ? 'proam' : e.kind); return i<0 ? 99 : i; };
      const sorted=on.slice().sort((a,b)=>rank(a)-rank(b));
      // Something enterable beats something merely important: a day that offers a
      // Major nobody can play and a final they can should offer the final.
      /* В КОМАНДЕ — всегда СТАРШИЙ турнир дня, без оглядки на «могу ли я».
         «Могу» у двоих разное: напарник, отыгравший свою соло-сессию, получал
         от того же дня Reload, второй — соло-квал, оба жали «Играть», и
         вечер вставал на два разных турнира («field …m2.58.n4900h59+59 vs
         …r1.15.n900h68», его страница «баги», 30 августа, 2fbbde90; жалобы
         игроков — «разные капы играют»). Отзыв: «в один день запретить
         2 капа, оставить где больше призов или значительный». Старший — по
         CC_KIND_RANK; кто в него не может, видит причину на кнопке, а день
         уходит перемоткой по двум подтверждениям. Одиночная — как была. */
      /* И В ОДИНОЧНОЙ — тоже старший (23.10, его «пусть играется всегда турнир, который важнее, если в один день»; игрок:
         «пишет квал Мейджора 1, а играется соло-VCC» — финал Мейджора 1 4.03.2023 и Solo Cash Cup 9 в один день, не
         прошедшему в финал давался кап). Не прошёл — причина на кнопке, день уходит перемоткой. */
      /* Кроме явного выбора: в одиночной кап дня (ЗБ-сквады по субботам рядом с Weekly Final), выбранный кнопкой,
         играется вместо старшего. В команде и гонке выбора нет (ccVictoryLocked). */
      const vp=!ccVictoryLocked() && CAREER && CAREER.career && CAREER.career.vpick && CAREER.career.vpick[today];
      const chosen=vp ? on.find(e=>e.kind==='victory' && e.id===vp) : null;
      // Ноябрь 2026-го: этап Solo Reload, куда игрок прошёл, старше Trios Cash Cup того же дня. Не прошёл, значит кап.
      const soloNow=(!chosen && ccS43Trios(today)) ? on.find(e=>e.kind==='solo' && careerCanPlayKindOn(today, 'solo')) : null;
      /* Без выбора играется главное событие дня, а не кап рядом с ним: 'solo' нет в CC_KIND_RANK (ранг 99), и консольные
         капы и Mobile Series, которые с 14–15.11 стоят в дни Solo Series и Reload, забирали день, хотя горела кнопка главного,
         а её нажатие ничего не меняло. ЛАН и ноябрьский Trios Cash Cup (ccS43Trios) по-прежнему решают сами. */
      on=[chosen || soloNow || (lanToday || ccS43Trios(today) ? null : sorted.find(e=>e.kind!=='victory' && e.kind!=='gala')) || sorted[0]];
    }
    if(on.length && on[0].kind==='victory'){
      const v=careerVictoryOn(today), hit=v && (days.get(today)||[]).find(e=>e.kind==='victory' && e.id===v.id);
      if(hit) on=[hit];
    }
    if(on.length){
      const div=CAREER && CAREER.career ? CAREER.career.division : 5;
      // The tournament's own name, not the name of the window it opens in.
      // "Round 1" is which evening this is; the panel's headline is what the
      // player is entering, and the round is already said above it.
      const title = on[0].kind==='cup' ? L().chEvCup.replace('{N}', div) : on[0].label;
      /* id события едет вместе с видом. Вид врёт там, где под одним словом
         лежат разные турниры: 'solo' носят и январская Solo Series, и FNCS
         Solos, а обложка у них разная. Клетка календаря знала id всегда, а
         карточка карьеры — нет, и брала запасную. См. ccEventArt. */
      return {type:on[0].kind, id:on[0].id, title:title, label:on[0].label,
              sub:(L().ccYearSub && L().ccYearSub[on[0].kind])||'',
              day:today};
    }
  }
  return {type:'free', title:L().chDayFree, sub:L().chDayFreeSub, day:today};
}

/* Календарный год сезона N этой карьеры — для подписи на карточке. Карьера 2026-го:
   2026, 2027…; 2025-го: 2025, потом 2026…; 2024-го: 2024, 2025, потом 2026… */
function ccSeasonYearOf(s){
  const cr=CAREER && CAREER.career; const y0=(cr && cr.year0) || 2026; s=s||1;
  if(y0===2025) return s<=1 ? 2025 : 2026+(s-2);
  if(y0===2024) return s<=1 ? 2024 : s===2 ? 2025 : 2026+(s-3);
  if(y0===2020) return s<=1 ? 2020 : s===2 ? 2021 : s===3 ? 2022 : s===4 ? 2023 : s===5 ? 2024 : s===6 ? 2025 : 2026+(s-7);
  if(y0===2019) return s<=1 ? 2019 : s===2 ? 2020 : s===3 ? 2021 : s===4 ? 2022 : s===5 ? 2023 : s===6 ? 2024 : s===7 ? 2025 : 2026+(s-8);
  if(y0===2021) return s<=1 ? 2021 : s===2 ? 2022 : s===3 ? 2023 : s===4 ? 2024 : s===5 ? 2025 : 2026+(s-6);
  if(y0===2022) return s<=1 ? 2022 : s===2 ? 2023 : s===3 ? 2024 : s===4 ? 2025 : 2026+(s-5);
  if(y0===2023) return s<=1 ? 2023 : s===2 ? 2024 : s===3 ? 2025 : 2026+(s-4);
  return 2026+(s-1);
}
/* ЛУЧШИЙ ВЕЧЕР КАРЬЕРЫ — строкой события на карточке.

   Игрок (Notion, пункт 3): карточка карьеры звала себя «FNCS Division 1», что бы
   ни было сыграно — финал Мейджора, Саммит, Глобалы. У настоящей карточки строка события —
   тот турнир, откуда её число; у карьеры это её лучший вечер: по рангу турнира (Глобалы >
   Саммит > финал Мейджора > Париж > Ласт Ченс > финал Reload > финал недели > соло/Про-Ам/
   Victory/оценка > кубок), внутри ранга — по месту. Возвращает {event, placement} или null,
   когда играть было нечего. */
const CC_CARD_EV_RANK={globals:9, summit:8, major:7, rc:6, gclc:5, reload:4, final:3, solo:3, proam:2, victory:2, eval:2, cup:1};
function ccCareerBestRun(){
  const cr=CAREER && CAREER.career; if(!cr) return null;
  let best=null, bs=-1;
  (cr.log||[]).forEach(e=>{
    if(!e || !e.kind) return;
    let s=(CC_CARD_EV_RANK[e.kind]||0)*10;
    // Стадия до финала — ниже своего же финала, но выше кубка.
    if((e.kind==='major' || e.kind==='reload' || e.kind==='summit' || e.kind==='rc' || e.kind==='gclc') && e.stage && e.stage!=='final') s-=25;
    s+= e.place===1 ? 3 : e.place<=3 ? 2 : e.place<=10 ? 1 : 0;
    if(s>bs){ bs=s; best=e; }
  });
  return best;
}
function ccCareerCardEvent(){
  const best=ccCareerBestRun(); if(!best) return null;
  const name=String((typeof ccLogName==='function' ? ccLogName(best) : '')||'').replace(/<[^>]*>/g,'').trim();
  if(!name) return null;
  return {event:'FNCS '+ccSeasonYearOf(best.season)+' · '+name, placement:best.place||null, big:(CC_CARD_EV_RANK[best.kind]||0)>=7 && (!best.stage || best.stage==='final')};
}
// The player as a card. A taken card is looked up in the roster rather than
// copied into the save, so it always reads whatever the roster says today; the
// connection is layered on top without touching the roster object.
function careerCard(raw){
  if(!CAREER || !CAREER.player) return null;
  const pl=CAREER.player;
  let base;
  if(pl.handle){
    // The card as it stands in 2026 first — PLAYERS holds every era and its
    // find returned whichever the file listed first, so a career played as Sky
    // was reading a card from another season.
    const now=careerRosterNowEU().find(x=>hKey(x)===hKey(pl.handle));
    const found=now || PLAYERS.find(x=>x.handle===pl.handle && x.region===(pl.cardRegion||x.region) && (ccNowYear()>=2026 || ccCardYear(x)<=ccNowYear()));
    base = found ? {...found} : null;
    // The attributes are recomputed for this copy rather than inherited: the
    // roster object caches its own, already floored to the roster's rating, and
    // a cached set ignores the _targetOvr set below — which is how the hub and
    // the card printed 92 for a 96 career, and stayed at 92 while it grew.
    if(base){ delete base._attrs; delete base._ovr; }
    // Unless the career has trained: once a real card has six numbers of its
    // own they are the card, because they are what the player has been working
    // on. Before that it reads the roster, which is where a taken card starts.
    if(base && pl.attrs) base._attrs={...pl.attrs, _floored:false};
  }
  if(!base){
    base={ handle:pl.nick, nat:ccNatOf(pl.country)||pl.nat||null,
           region:pl.region||'EU', org:null, tier:'ranked',
           event:L().ccDivEvent.replace('{N}', CAREER.career.division), placement:null,
           rating:pl.ovr, _targetOvr:pl.ovr,
           // A copy with the floor flag cleared: attrsFor stamps _floored onto
           // the object it is handed, and the save holds that same object — so
           // once stamped, a rookie's six numbers stopped following the rating
           // until the next cup rebuilt them.
           _attrs:pl.attrs ? {...pl.attrs, _floored:false} : null,
           // Карьера за контент-мейкера носит его редкость — см. shownRarity.
           creator:!!pl.creator,
           /* Креатор без своего фото — с аватаркой своего канала (CC_PROAM_AVA). 30.10, его «я выбрал контент
              мейкера а у него нет аватарки» (At0m): сейв хранил только загруженное фото, и карточка падала на скин. */
           _photo:pl.photo || (pl.creator ? ccProAmAvatar(pl.nick) : null) || null };
  } else if(pl.photo){ base._photo=pl.photo; }
  /* Строка события — лучший вечер карьеры (см. ccCareerCardEvent): у построенного всегда,
     у взятой настоящей карточки — только когда карьера взяла больше, чем её собственная
     строка (финал Мейджора и выше): «Play-In 2026» на карточке, выигравшей Глобалы, — враньё. */
  try{
    const be=ccCareerCardEvent();
    if(be && (!pl.handle || be.big)){ base.event=be.event; base.placement=be.placement; }
  }catch(e){}
  // A career rating moves with results, so the card is lifted to whatever the
  // career says today rather than to whatever the roster froze. attrsFor reads
  // _targetOvr as the floor and scales the six numbers onto it; a rookie is
  // already built at its rating, so this only matters for a taken card.
  if(pl.handle) base._targetOvr=pl.ovr;
  /* Роль, которую карьера выбрала себе сама, едет на карточке: attrsFor
     читает её первой, поэтому она бьёт и настоящую роль настоящего игрока, и
     ту, что выводится из шести чисел. Пусто — значит роль никто не менял. */
  if(pl.role) base._roleKey=pl.role;
  // The card renderer draws a crest whenever a card carries an org, so signing
  // for a club puts its badge on your card with nothing else to write.
  base.org = CAREER.org ? CAREER.org.name : null;
  /* The country and the birthday are worth points to a player who was built,
     and to nobody else — including a career played as somebody real.

     Taking Sky is playing Sky: he is a 96 because of what he did, and a career
     that puts him on a Serbian connection at sixteen has not made him better,
     it has only chosen a flag and a number for a person who already has both.
     A made player is different — the country and the age are the two things
     that were actually decided about them, so they are the two that count.

     Always through the functions, never off the save: an old career carries
     whatever the edges were worth when it started, and reading those back would
     keep paying a bonus this rule no longer gives it. */
  const built = pl.source!=='card' && !pl.handle;
  /* Where they are sitting, not where they are from. A career that has moved
     plays on the connection it moved to — that is the whole of what a move buys
     — and the flag above is untouched, because a lease is not a passport. */
  /* И у взятой карточки связь стоит ровно столько, на сколько она переехала.

     Раньше — ноль и только ноль: Sky это 96 за то, что он сделал, и посадить
     его на сербский пинг не значит сделать его лучше. Это верно ровно до того
     дня, когда карьера снимает квартиру в другой стране. Правило: прибавлять только за переезд.

     Поэтому здесь не сам пинг, а разница. Дома она нулевая — карточка стоит
     столько же, сколько стоила, — а после переезда это то, что переезд купил
     или отнял: из Москвы во Франкфурт плюс, из Франкфурта в Баку минус. Потолок
     общий, 99, его держит сама карточка (см. shownOvr). */
  const homePing = pl.countryPing!=null ? pl.countryPing
                 : (pl.country!=null ? ccPingOf(pl.country, pl.homeRegion||pl.region||'EU') : null);
  const moved = !built && !!pl.livesIn && homePing!=null;
  base._pingEdge = ccEdgeOff(pl) ? 0 : built ? ccPingEdge(ccPingNow())
                 : moved ? Math.round((ccPingEdge(ccPingNow())-ccPingEdge(homePing))*10)/10
                         : 0;
  // Через ccPlayerAge, а не через счётчик: у игрока с введённой датой возраст
  // меняется в его собственный день, а не на границе сезона. Для всех
  // остальных это то же самое число, что и было. См. ccPlayerAge.
  base._ageEdge  = (built && !ccEdgeOff(pl)) ? ccAgeEdge(ccPlayerAge()) : 0;
  base._age      = ccPlayerAge();
  base._pingMs   = ccPingNow();
  /* The desk, on the card. Each owned device pays its point or two into the
     attribute it serves — see CC_SHOP — visible on the card's six numbers and
     read by the engine with them. Applied to this copy only, never written
     back: `raw` is how ccOwnAttrs samples the player without the desk, so a
     career's first training day does not bake the gear in and then double it
     on every read after. The rating is untouched — a mouse buys aim, not a
     number at the top of the card. */
  const gs=!raw && CAREER.gear && CAREER.gear.skill;
  if(gs && Object.keys(gs).length){
    const a=attrsFor(base);
    const bumped={...(base._attrs||a)};
    ATTR_KEYS.forEach(k=>{
      if(gs[k]) bumped[k]=clamp(Math.round((bumped[k]!=null?bumped[k]:a[k])+gs[k]), 35, 99);
    });
    bumped._floored=false;
    base._attrs=bumped;
  }
  return base;
}

function openCareerHub(){
  CH_MONTH=null;   // календарь закрыт вместе с прошлым визитом; см. careerTab
  if(!careerLoad()){
    // Нечитаемый сейв — не повод создавать карьеру поверх него (см. CC_LOAD_BAD).
    if(CC_LOAD_BAD){ openCareerSlots(); try{ ccTell(L().ccSaveUnread || 'This career save could not be read. It is kept aside; start the new career in another slot.'); }catch(e){} return; }
    openCareerCreate(); return; }
  // A career whose seat is empty finds the offers already in the inbox rather
  // than tomorrow — including a brand new one, which is the whole point.
  careerSeatTopUp();
  show('screen-career-hub');
  careerRenderHub('centre');
}

// Clicking the career tile picks up where you left off, or starts a new one.
/* direct=true — слот уже выбран, спрашивать нечего: так входит «Продолжить»
   с плитки. Без этого выбор карьеры замыкался на себя: нажатие звало
   careerEntry, тот видел две карьеры и снова рисовал выбор. Отчёт: «подключился по коду, но зайти не могу, continue жму». */
function careerEntry(direct){
  mgrLeaveIfActive();
  // Вход одиночной дверью — значит, вдвоём здесь ничего не заводится. См. ccMpNewCancel.
  CC_MP_NEW=null;
  CC_DRAFT_RUN=false;   // карьера — командный код снова в силе (см. ccMpOn)
  /* Карточка режима открывает ТЕКУЩУЮ карьеру, сколько бы их ни было.

     Утром 29 августа она при двух карьерах открывала выбор слота («а соло
     карьеру можно запустить?»), и к вечеру он же сказал: «захожу в карьеру и
     меня выкидывает, ещё раз нужно жать». Дорога к другим слотам и к новой
     карьере есть из хаба — кнопка «Карьеры» (openCareerSlots) — и с дверей
     «вдвоём» на карточке; с главного экрана — сразу в игру. */
  // A save from before the clock became a date is brought forward on the way in,
  // so nothing downstream has to know two shapes.
  /* Командная карьера подключается к своему лобби на входе — и БЕЗ await:
     карьера обязана открыться и без сети. localStorage держит последнее
     известное состояние команды, а 'state' от сервера приедет и перепишет его
     через ccApplyTeamState. См. ccMpBoot. */
  if(careerExists()){ careerLoad(); careerMigrateClock(); careerMigrateMoney(); careerMigrateOrg(); careerMigrateOwnClub(); ccMpBoot(); openCareerHub(); return; }
  // The slot the tile opens is empty, but another one may not be — that is what
  // switching careers looks like from here, so ask rather than start a third.
  let any=false;
  for(let n=1; n<=CC_SLOTS && !any; n++) any=!!ccSlotCard(n);
  if(any) openCareerSlots();
  else openCareerCreate();
}

// Ending a career deletes the only save there is, so it asks first — the same
// shape the app already uses for discarding a run. Focus lands on Cancel so a
// stray Enter keeps the career rather than burning it.
/* Разрыв дуо — аварийная дверь, а не фича.

   «День ждёт обоих» означает, что исчезнувший напарник запирает карьеру
   навсегда. Дверь превращает команду обратно в одиночную карьеру: история и
   деньги остаются, место напарника занимает бот с его последней карточкой —
   той самой ночной, которая и так обменивалась перед каждым вечером.
   Сторож — tools/check-mp-break.js. */
function careerPart(){
  if(!ccMpOn()) return;
  if(typeof MP!=='undefined' && MP.part) MP.part();
  // И связь больше не нужна: без drop сокет продолжал бы переподключаться к
  // лобби, из которого мы только что вышли.
  if(typeof MP!=='undefined' && MP.drop) MP.drop();
  var peer=(typeof MP!=='undefined' && MP.peer) || null;
  if(peer){
    CAREER.partners=CAREER.partners||[];
    /* Записью с вложенной карточкой, а не голым ником: ccMateCardOf ищет ник в
       ростере, а живого человека там нет — его карточку надо принести с
       собой, иначе место напарника осталось бы пустым. */
    /* КАРТОЧКА ЦЕЛИКОМ, а не выборка полей. Скриншот, хаб после
       разрыва дуо: «Cannot read properties of undefined (reading 'replace')»
       — вкладка «Я» рисует бывшего напарника через futCardHTML, а собранная
       здесь вручную карточка не везла `event`. Та же ловушка, что 26 августа
       в MP.card: список полей, составленный руками, отстаёт от кода, который
       карточку читает. По проводу и так приезжает вся карточка (см. MP.card)
       — её и кладём, поправив только регион, чтобы ростер её находил. */
    if(!CAREER.partners.some(function(p){ return p && p.handle===peer.handle; })){
      var kept=null; try{ kept=JSON.parse(JSON.stringify(peer)); }catch(e){ kept=Object.assign({}, peer); }
      if(!kept.region) kept.region=(CAREER.player&&CAREER.player.region)||'EU';
      if(kept.rating==null) kept.rating=peer.ovr||0;
      CAREER.partners.push({handle:peer.handle, role:peer.role||null, card:kept});
    }
  }
  delete CAREER.career.mp;
  careerSave();
  careerRenderHub('centre');
}
function careerPartAsk(){
  // Подпись ccAsk — (text, go, opts): подписи кнопок едут в opts.
  ccAsk(L().ccPartAsk, careerPart, {yes:L().ccPartYes, no:L().ccPartNo});
}
function careerEndAsk(){
  document.getElementById('careerEndModal').style.display='flex';
  const no=document.getElementById('careerEndNo'); if(no) no.focus();
  document.addEventListener('keydown', careerEndKey);
}
function careerEndClose(){
  document.getElementById('careerEndModal').style.display='none';
  document.removeEventListener('keydown', careerEndKey);
}
function careerEndKey(e){ if(e.key==='Escape') careerEndClose(); }
function careerEnd(){
  careerEndClose();
  if(typeof careerNewsRotStop==='function') careerNewsRotStop();   // лента хаба не должна тикать в пустую карьеру
  // Слот ЭТОЙ вкладки, а не общий указатель: вторая вкладка могла переставить его на другую карьеру (как 22.09 у записи).
  ccSlotWipe(ccSlotMine());
  CAREER=null;
  show('screen-mode');
}

/* The picker. Three cards, each the whole of what a slot holds — who, where on
   the ladder, how far into the year, what it has won. An empty one starts a
   career; a full one is opened or deleted, and deleting asks, because a season
   is hours of somebody's evening. */
function openCareerSlots(){
  mgrLeaveIfActive();
  careerRenderSlots();
  show('screen-career-slots');
}
function careerRenderSlots(){
  const grid=document.getElementById('ccSlotGrid');
  if(!grid) return;
  const here=ccSlot();
  /* Где в сезоне карьера остановилась — долей года, а не датой. Год у карьеры
     один и тот же (CC_YEAR_FROM…CC_YEAR_TO), поэтому позиция настоящая. */
  const railOf=(day)=>{
    const a=new Date(ccYearFrom()+'T00:00:00Z'), b=new Date(ccYearTo()+'T00:00:00Z');
    const d=new Date((day||CC_YEAR_FROM)+'T00:00:00Z');
    return Math.max(2, Math.min(100, Math.round((d-a)/(b-a)*100)));
  };
  const cells=[]; let free=0, firstFree=0;
  for(let n=1; n<=CC_SLOTS; n++){
    const c=ccSlotCard(n);
    if(!c){ free++; if(!firstFree) firstFree=n; continue; }
    const state = c.retired ? L().ccSlotRetired
                : c.over    ? L().ccSlotSeasonOver
                            : ccDayLabel(c.day);
    /* Одна строка под ником вместо пяти строк таблицы: возраст, страна, сезон,
       где встал, напарник — всё, что отвечает «что это за карьера». */
    const meta=[
      c.age ? String(c.age) : '',
      c.country ? '<img class="cc-car-flag" src="flags/w20/'+
        esc(ccCountryOf(String(c.country).toLowerCase()))+'.png" alt="">' : '',
      (function(){ const t=ccSeasonTag(c.day); return String(c.day||'').slice(0,4)+(t.full ? ' · '+esc(t.full) : ''); })(),
      esc(state),
      c.mate ? esc(c.mate)+(c.mates>1 ? ' +'+(c.mates-1) : '') : '',
      c.org ? esc(c.org) : '',
      c.earnings ? '$'+ccNum(c.earnings) : ''
    ].filter(Boolean).join('<span style="opacity:.4">·</span>');
    cells.push('<div class="cc-car'+(n===here?' on':'')+'">'+
      (c.face ? '<img class="cc-car-face" src="'+esc(c.face)+'" alt="" loading="lazy" onerror="this.remove()">'
              : '<span class="cc-car-face"></span>')+
      '<div class="cc-car-id"><b>'+esc(c.nick)+
        (c.team ? ' <span class="cc-car-duo">'+L().ccSlotDuoLive+'</span>' : '')+'</b>'+
        '<em>'+meta+'</em></div>'+
      '<div class="cc-car-ovr"><small>'+L().ccRoOvr+'</small>'+c.ovr+'</div>'+
      (c.noDiv
        ? '<div class="cc-car-div cc-car-se"><small>'+L().ccSlotSeason+'</small>'+esc(ccSeasonTag(c.day).short||'-')+'</div>'
        : '<div class="cc-car-div"><small>'+L().ccDivision+'</small>'+c.div+'</div>')+
      '<div class="cc-car-go">'+
        '<button class="'+(n===here?'ch-play':'cc-car-open')+'" onclick="careerSlotOpen('+n+')">'+
          L().ccSlotOpen+'</button>'+
        '<button class="cc-car-del'+(CC_SLOT_ARMED===n?' armed':'')+
          '" title="'+esc(L().ccSlotDelete)+'" onclick="careerSlotDrop('+n+')">'+
          (CC_SLOT_ARMED===n ? esc(L().ccSlotDropSure) : '&times;')+'</button>'+
      '</div>'+
      '<span class="cc-car-rail"><i style="width:'+railOf(c.day)+'%"></i></span></div>');
  }
  /* Свободные слоты — одной строкой, а не половиной экрана пустых коробок.
     Их число тут и есть вся нужная информация. */
  if(free) cells.push('<button class="cc-car cc-car-new" onclick="careerSlotNew('+firstFree+')">'+
    '<span><b>'+(L().ccSlotsNew||L().ccSlotStart)+'</b><em>'+
      (L().ccSlotsFree ? L().ccSlotsFree(free) : free+'/'+CC_SLOTS)+'</em></span>'+
    '<span class="cc-car-free">+</span></button>');
  grid.innerHTML=cells.join('');
  // Зал славы под сеткой: все карьеры на одном экране. См. careerHallHTML.
  const hall=document.getElementById('ccHall');
  if(hall) hall.innerHTML=careerHallHTML();
  try{ ccCloudDraw(); }catch(e){}
}
/* Дверь с главного экрана: сперва выбор, потом карьера.

   Правка: «когда игрок нажимает начать карьеру, ему дают на
   выбор сразу его карьеры, которые создал или свободные». До неё кнопка вела в
   последнюю карьеру мимо выбора — и это была правка
   («захожу в карьеру и меня выкидывает, ещё раз нужно жать»); мешал тогда сам
   экран выбора, а не лишнее нажатие. Экран переделан в ростер, дверь снова
   ведёт в него.

   Почему ОТДЕЛЬНОЙ функцией, а не внутри careerEntry: через careerEntry в
   карьеру заходят не только кнопки, но и все сторожа — их там четыре десятка, и
   каждый ждёт хаб, а не выбор. Первая попытка положить выбор внутрь careerEntry
   покрасила четырнадцать проверок из сорока четырёх. Выбор — решение кнопки,
   загрузка — дело careerEntry. */
function homeGuideOpen(){
  const m=document.getElementById('homeGuide'); if(!m) return;
  // Подробности на языке игрока: та же схема адресов, что у ссылки на Competitive.
  const lg=LANG, a=document.getElementById('homeGuideMore');
  if(a) a.setAttribute('href', (/\/(ru|fr|it|pt|de|es)\/(index\.html)?$/.test(location.pathname) ? '../' : '')+(lg==='en' ? '' : lg+'/')+'about');
  m.classList.add('on');
  const go=m.querySelector('.hero-btn-go'); if(go) go.focus();
}
function homeGuideClose(){ const m=document.getElementById('homeGuide'); if(m) m.classList.remove('on'); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') homeGuideClose(); });
function careerStart(){
  mgrLeaveIfActive();
  CC_MP_NEW=null;
  let has=false;
  for(let n=1; n<=CC_SLOTS && !has; n++) has=!!ccSlotCard(n);
  if(has){ openCareerSlots(); return; }
  careerEntry();
}
function careerSlotOpen(n){
  mgrLeaveIfActive();
  ccSlotUse(n);
  careerEntry(true);   // выбор уже сделан этой самой кнопкой
}
function careerSlotNew(n){
  mgrLeaveIfActive();
  ccSlotUse(n);
  CAREER=null;
  openCareerCreate();
}
// Two presses, not a browser dialog: the first arms the button and says what it
// is about to throw away, the second does it. A modal here would be the only one
// in the mode, and a career is not something to lose to a stray Enter.
let CC_SLOT_ARMED=null;
function careerSlotDrop(n){
  if(CC_SLOT_ARMED!==n){
    CC_SLOT_ARMED=n;
    careerRenderSlots();
    return;
  }
  CC_SLOT_ARMED=null;
  ccSlotWipe(n);
  if(n===ccSlotMine()) CAREER=null;
  careerRenderSlots();
}

let CH_TAB='centre';
function careerTab(t){
  /* Ушёл с календаря — он забывает, куда ты его листал. Отзыв:
     «когда закрываешь календарь, пусть всегда перемещает на то место, где ты
     сейчас». Пролистанный на июль календарь так и открывался июлём, и «Сейчас»
     приходилось жать руками каждый раз. CH_MONTH=null означает «текущий
     месяц» — см. careerCalendarHTML. */
  if(CH_TAB==='calendar' && t!=='calendar') CH_MONTH=null;   // календарь закрыт
  CH_TAB=t;
  // The shop opens where the career is living, every time. Whatever was being
  // looked at last visit was a look, not a decision. See CH_FLAT_PLACE.
  if(t==='shop') CH_FLAT_PLACE=null;
  careerRenderHub(t);
  // Opening the shop is what clears its mark: the render above still drew the
  // new rows, and the next visit will not call them new again.
  // Only when the mark moves: a full save (~1 MB JSON) on every tap was a fifth of the tab's cost on a phone.
  const cr=CAREER && CAREER.career;
  if(t==='shop' && cr && (cr.shopSeen||0)<(cr.balance||0)) careerShopSeen();
  // And opening the socials is what clears the feed's. Messages keep their own
  // unread flag — a thread is read when it is opened, not when the tab is.
  if(t==='social' && cr && cr.newsSeen!==(cr.newsN||0)) careerNotesSeen();
}

/* Перерисовка той же вкладки сохраняет прокрутку. Хаб перерисовывается целиком через innerHTML,
   и страница уезжала наверх, а в командной карьере перерисовку дёргает каждое действие напарника.
   Сравниваем с CH_DREW (последняя нарисованная вкладка), а не с CH_TAB: careerTab меняет CH_TAB
   до вызова. При смене вкладки прокрутку не трогаем.
   Сохраняем все три скроллера (страница, #chBody, обёртка): в разных раскладках крутится разное. */
let CH_DREW=null;
function ccHubScroll(){
  const b=document.getElementById('chBody');
  return {w:(window.scrollY||document.documentElement.scrollTop||0),
          b:(b?b.scrollTop:0),
          p:((b&&b.parentElement)?b.parentElement.scrollTop:0)};
}
// Последняя упавшая отрисовка хаба — текст ошибки, как у дня (CC_DAY_ERR).
let CC_HUB_ERR=null, CC_HUB_ERR_FULL=null;
/* Ошибку нужно уметь ПРИСЛАТЬ, а не только увидеть.
 *
 * Плашка ниже показывает игроку, что именно сломалось, но чинить по скриншоту
 * телефона нечего: там видна одна строка сообщения без стека и без метки
 * сборки. Кнопка кладёт в буфер всё сразу — сборку, вкладку и стек, — и это
 * ровно тот текст, которого не хватает, чтобы найти упавшую плитку.
 *
 * Два пути нарочно: navigator.clipboard живёт только на https и требует
 * разрешения, а у него игроки сидят и с превью-адресов, и с телефона. Если
 * первый не сработал, старое поле с execCommand работает везде. */
function ccHubErrCopy(btn){
  const text=CC_HUB_ERR_FULL||CC_HUB_ERR||'';
  const done=()=>{ try{ if(btn) btn.textContent=L().ccHubCopied; }catch(e){} };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done, ()=>ccHubErrCopyOld(text, done));
      return;
    }
  }catch(e){}
  ccHubErrCopyOld(text, done);
}
function ccHubErrCopyOld(text, done){
  try{
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    done();
  }catch(e){ console.error('скопировать ошибку не вышло:', e); }
}
/* КЭШ НА ОДНУ ПЕРЕРИСОВКУ ХАБА (игрок 9.10: «the game lag every clicks»). Замер на телефоне (Playwright, CPU ×6): вкладка
   «Медиа» 250–430 мс на КАЖДОЕ нажатие, из них ~90% — careerDmPool → careerDuoBeatsYou → ccDuoForm, который на каждого
   кандидата заново строил всю таблицу сезона. Внутри одной отрисовки таблица не меняется — считается один раз. */
let CC_RENDER_MEMO=null;
/* Классический вид (см. html.ui-classic в стилях): выбор живёт в браузере, не в сейве — это вид, а не карьера. */
function ccUiClassic(){ try{ return document.documentElement.classList.contains('ui-classic'); }catch(e){ return false; } }
function uiClassicToggle(){
  const on=!ccUiClassic();
  document.documentElement.classList.toggle('ui-classic', on);
  try{ if(on) localStorage.setItem('fd_ui_classic', '1'); else localStorage.removeItem('fd_ui_classic'); }catch(e){}
  try{ if(CAREER) careerRenderHub(); }catch(e){}
  try{ homeSceneDraw(); }catch(e){}
}
/* НАПАРНИК УШЁЛ — ОКНО (29.10). Ушёл в другое дуо, вырос выше или разошлись по итогам сезона: строка в новостях
   терялась среди остальных, а без напарника командный турнир не сыграть. После перерисовки хаба (не во время вечера и
   перемотки) — одно окно «найди нового» с поиском дуо; закрыл — больше не спрашивает. Уже нашёл замену — окна нет. */
const CC_MATE_GONE_KEYS=/^(ccNewsMateLeftFor|ccNewsDuoOutgrown|ccNewsDuoSplit|ccNewsDuoBehind)t?$/;
function ccMateGoneMaybe(){
  const cr=CAREER && CAREER.career; if(!cr || !cr.mateGone) return;
  if((typeof CAREER_RUN!=='undefined' && CAREER_RUN) || (typeof CC_FF!=='undefined' && CC_FF)) return;
  const hub=document.getElementById('screen-career-hub'); if(!hub || !hub.classList.contains('active')) return;
  const ask=document.getElementById('ccAskModal'); if(ask && ask.style.display==='flex') return;
  const g=cr.mateGone; cr.mateGone=null; careerSave();
  if(!(typeof careerMatesShort==='function' && careerMatesShort()>0)) return;
  const T=L();
  ccAsk(T.ccMateGoneAsk(g.who), ()=>ccDuoFindOpen(null), {yes:T.ccMateGoneFind, no:T.ccMateGoneLater});
}
function careerRenderHub(tab){
  setTimeout(()=>{ try{ ccMateGoneMaybe(); }catch(e){} }, 0);
  const outer=!CC_RENDER_MEMO;
  if(outer) CC_RENDER_MEMO=new Map();
  // Дефолты шкафчика и награды за новые вечера (кирка чемпиона FNCS) — до рисования, чтобы хаб и матч их видели.
  if(outer) try{ ccFnDefaults(); ccLockerCheck(); }catch(e){}
  try{ return careerRenderHubRaw(tab); }
  finally{ if(outer) CC_RENDER_MEMO=null; try{ ccHubTheme(); }catch(e){} try{ ccHubEraBg(); }catch(e){} try{ ccTabsSide(); }catch(e){} try{ ccTourMaybe(); }catch(e){} }
}
/* ОБУЧЕНИЕ ДЛЯ НОВИЧКА (Notion 27.10, игрок: «слишком много всего сразу, показал сайт брату, он потерялся»; его слово:
   «обучение для новых игроков сделать, чтоб всё понятно»). На первом экране карьеры 47 кнопок, 12 вкладок и десять
   чисел, и главная — «к турниру» — среди них теряется. Тур из семи шагов подсвечивает по одному месту и говорит одной
   фразой, что это. Сам открывается один раз, в свежей карьере (сезон 1, ни одного вечера), на Центре; кнопка «Как
   играть» внизу хаба открывает его снова. Шаг, чьего места на экране нет (другая раскладка, напарник уже есть), пропускается.
   Затемнение ловит клики: тур не должен нажать за игрока то, что под ним (см. интервью, тот же день). */
const CC_TOUR_KEY='fncsdraft_tour1';
const CC_TOUR_STEPS=[
  {sel:'#chOvr', k:'ccTourOvr'},
  {sel:'#screen-career-hub .ch-en', k:'ccTourEnergy'},
  {sel:'#screen-career-hub .cc-lb-playcol', k:'ccTourDay'},
  {sel:'#screen-career-hub .cc-lb-next, #screen-career-hub .ch-next', k:'ccTourSeason'},
  {sel:'#screen-career-hub .ch-skipto, #screen-career-hub .ch-col-play .ch-play', k:'ccTourGo'},
  {sel:'#screen-career-hub .ch-tile-ros', k:'ccTourMate', need:()=>!(careerMates()||[]).filter(Boolean).length},
  {sel:'#screen-career-hub .ch-tabs', k:'ccTourTabs'}
];
let CC_TOUR=null, CC_TOUR_SOON=false;
function ccTourSeen(){ try{ return localStorage.getItem(CC_TOUR_KEY)==='1'; }catch(e){ return true; } }
function ccTourMaybe(){
  if(CC_TOUR || CC_TOUR_SOON || ccTourSeen()) return;
  const cr=CAREER && CAREER.career; if(!cr) return;
  if(typeof CH_TAB!=='undefined' && CH_TAB!=='centre') return;
  if((cr.season||1)!==1 || (cr.log||[]).length || cr.seasonOver) return;
  if(typeof CC_FF!=='undefined' && CC_FF) return;
  CC_TOUR_SOON=true;
  setTimeout(()=>{ CC_TOUR_SOON=false;
    const hub=document.getElementById('screen-career-hub');
    if(!hub || !hub.classList.contains('active') || ccTourSeen() || CC_TOUR) return;
    ccTourStart(); }, 700);
}
function ccTourVisible(el){
  if(!el) return false;
  // Полоса вкладок на телефоне — position:fixed, у неё offsetParent пустой при видимой полосе.
  if(!el.offsetParent && getComputedStyle(el).position!=='fixed') return false;
  const cs=getComputedStyle(el); if(cs.display==='none' || cs.visibility==='hidden') return false;
  const r=el.getBoundingClientRect(); return r.width>8 && r.height>8;
}
function ccTourTarget(st){
  if(st.need && !st.need()) return null;
  return [...document.querySelectorAll(st.sel)].find(ccTourVisible)||null;
}
function ccTourStart(){
  ccTourEnd(true);
  const steps=CC_TOUR_STEPS.filter(st=>ccTourTarget(st));
  if(!steps.length) return;
  const wrap=document.createElement('div');
  wrap.className='cc-tour'; wrap.setAttribute('role','dialog'); wrap.setAttribute('aria-modal','true');
  wrap.innerHTML='<div class="cc-tour-dim"></div><div class="cc-tour-hole"></div><div class="cc-tour-tip"><em class="cc-tour-n"></em>'+
    '<p class="cc-tour-t"></p><div class="cc-tour-acts"><button class="cc-tour-skip" type="button"></button>'+
    '<button class="cc-tour-next" type="button"></button></div></div>';
  document.body.appendChild(wrap);
  CC_TOUR={wrap, steps, i:0};
  wrap.querySelector('.cc-tour-dim').onclick=()=>ccTourNext();
  wrap.querySelector('.cc-tour-skip').onclick=()=>ccTourEnd();
  wrap.querySelector('.cc-tour-next').onclick=()=>ccTourNext();
  window.addEventListener('resize', ccTourPlace); window.addEventListener('scroll', ccTourPlace, true);
  document.addEventListener('keydown', ccTourKey);
  ccTourShow();
}
function ccTourKey(e){ if(!CC_TOUR) return; if(e.key==='Escape') ccTourEnd(); else if(e.key==='Enter' || e.key==='ArrowRight'){ e.preventDefault(); ccTourNext(); } }
function ccTourShow(){
  const T=CC_TOUR; if(!T) return;
  const st=T.steps[T.i], el=ccTourTarget(st);
  if(!el){ return ccTourNext(); }
  try{ el.scrollIntoView({block:'center', inline:'nearest'}); }catch(e){}
  T.wrap.querySelector('.cc-tour-n').textContent=(T.i+1)+' / '+T.steps.length;
  T.wrap.querySelector('.cc-tour-t').textContent=L()[st.k]||'';
  T.wrap.querySelector('.cc-tour-skip').textContent=L().ccTourSkip;
  T.wrap.querySelector('.cc-tour-skip').style.visibility=T.i===T.steps.length-1 ? 'hidden' : '';
  T.wrap.querySelector('.cc-tour-next').textContent=T.i===T.steps.length-1 ? L().ccTourDone : L().ccTourNext;
  ccTourPlace();
  try{ T.wrap.querySelector('.cc-tour-next').focus({preventScroll:true}); }catch(e){}
}
function ccTourPlace(){
  const T=CC_TOUR; if(!T) return;
  const el=ccTourTarget(T.steps[T.i]); if(!el) return;
  const r=el.getBoundingClientRect(), pad=6, vw=window.innerWidth, vh=window.innerHeight;
  const hole=T.wrap.querySelector('.cc-tour-hole'), tip=T.wrap.querySelector('.cc-tour-tip');
  const top=Math.max(4, r.top-pad), left=Math.max(4, r.left-pad);
  const h=Math.min(vh-8, r.bottom+pad)-top, w=Math.min(vw-8, r.right+pad)-left;
  Object.assign(hole.style, {top:top+'px', left:left+'px', width:Math.max(0, w)+'px', height:Math.max(0, h)+'px'});
  const tw=Math.min(340, vw-32);
  tip.style.width=tw+'px';
  const th=tip.offsetHeight||140;
  // Под местом, если влезает; иначе над ним; иначе — внизу экрана поверх (высокая колонка дня на телефоне).
  let y=top+h+10;
  if(y+th>vh-12) y=top-th-10;
  if(y<12) y=Math.max(12, vh-th-16);
  const x=Math.min(Math.max(16, left+w/2-tw/2), vw-tw-16);
  tip.style.top=y+'px'; tip.style.left=x+'px';
}
function ccTourNext(){
  const T=CC_TOUR; if(!T) return;
  if(T.i>=T.steps.length-1) return ccTourEnd();
  T.i++; ccTourShow();
}
function ccTourEnd(quiet){
  const T=CC_TOUR; if(!T) return;
  CC_TOUR=null;
  try{ T.wrap.remove(); }catch(e){}
  window.removeEventListener('resize', ccTourPlace); window.removeEventListener('scroll', ccTourPlace, true);
  document.removeEventListener('keydown', ccTourKey);
  if(!quiet){ try{ localStorage.setItem(CC_TOUR_KEY, '1'); }catch(e){} }
  try{ window.scrollTo(0, 0); }catch(e){}
}
// Фон хаба по эпохе магазина (CSS #screen-career-hub[data-fs=…]); в менеджере свой экран, его не трогаем.
function ccHubEraBg(){
  const el=document.getElementById('screen-career-hub');
  if(!el || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return;
  const v=ccFnShopEra(careerToday()).v;
  if(el.dataset.fs!==v) el.dataset.fs=v;
}
// Справа в полосе вкладок хаба — значки (лички, лента, …) и кошелёк, как было в полосе меню; одинаково на всех вкладках.
function ccTabsSide(){
  const t=document.querySelector('#screen-career-hub .ch-tabs');
  if(!t || typeof CAREER==='undefined' || !CAREER || !CAREER.career) return;
  let s=t.querySelector('.ch-tabs-side');
  if(!s){ s=document.createElement('div'); s.className='ch-tabs-side'; t.appendChild(s); }
  let note=''; try{ note=careerNoteBarHTML(); }catch(e){}
  // Кошелёк здесь снят (Notion «20.10»: «одна и та же информация» — баланс и V-Bucks уже в верхней панели, там же выплаты).
  s.innerHTML=(note ? '<div class="cc-lb-note">'+note+'</div>' : '');
}
/* ЦВЕТ ХАБА — ПО СЕЗОНУ (19.10, его «мб дизайн хаба под каждый сезон под их цвета»). Оттенок берётся из картинки
   лобби сезона (ccLobbyBg): средний цвет по насыщенным пикселям, вектором по кругу оттенков. Из него — фон панели,
   стекло плашек, тёмные полосы и полоса вкладок меню; яркость и насыщенность свои, чтобы текст читался на любом
   сезоне. Картинка без цвета (серый бункер s12) оставляет привычный синий. Один расчёт на картинку (CC_HUB_THEME). */
const CC_HUB_THEME={};
function ccHubThemeApply(h, k){
  const el=document.getElementById('screen-career-hub'); if(!el) return;
  const props=['--fn-panel','--fn-deep','--fn-line','--lb-panel','--lb-deep','--th-a','--th-b','--th-c','--th-top','--th-hi','--th-soft','--th-tint'];
  const root=document.documentElement;
  if(h==null){ el.classList.remove('ch-themed'); props.forEach(p=>el.style.removeProperty(p)); ['--cc-th-a','--cc-th-b','--cc-th-c'].forEach(p=>root.style.removeProperty(p)); return; }
  const hsl=(s, l, a)=>'hsla('+Math.round(h)+','+Math.round(s*(k==null ? 1 : k))+'%,'+l+'%,'+(a==null ? 1 : a)+')';
  el.style.setProperty('--fn-panel', hsl(55, 66, .22)); el.style.setProperty('--fn-deep', hsl(65, 12, .72));
  el.style.setProperty('--fn-line', hsl(80, 85, .2));
  el.style.setProperty('--lb-panel', hsl(58, 38, .8)); el.style.setProperty('--lb-deep', hsl(68, 16, .84));
  el.style.setProperty('--th-a', hsl(62, 33)); el.style.setProperty('--th-b', hsl(66, 22)); el.style.setProperty('--th-c', hsl(70, 13));
  el.style.setProperty('--th-top', hsl(62, 30));
  // Яркий акцент (шапка сезона, вкладки), полупрозрачный верх правой панели и светлая подложка плиток в ней.
  el.style.setProperty('--th-hi', hsl(68, 50)); el.style.setProperty('--th-soft', hsl(62, 30, .72)); el.style.setProperty('--th-tint', hsl(60, 70, .2));
  /* Окна выбора штаба и переезда лежат вне хаба (#coachPickModal и т.д. на body) и цвета сезона не видели — синие
     в любой карьере (его слово 20.10: «дизайн стафа не меняется на разных карьерах»). Те же три оттенка — на html. */
  root.style.setProperty('--cc-th-a', hsl(62, 33)); root.style.setProperty('--cc-th-b', hsl(66, 22)); root.style.setProperty('--cc-th-c', hsl(70, 13));
  el.classList.add('ch-themed');
}
/* Оттенок хаба — от эпохи магазина, той же, что фон (ccHubEraBg). Отдельно взятый с картинки сезона, он красил шапку
   и плашки в коричневый поверх синего фона эпохи (Notion 22.10: «почему разные дизайны» — шапка одна, вкладки другие). */
const CC_ERA_HUE={a:[300, .22], b:[212, 1], c:[220, 1], d:[212, 1], e:[220, 1], og:[228, .7], f:[210, 1], g:[210, 1]};   // [оттенок, доля насыщенности]
function ccHubTheme(){
  if(typeof CAREER==='undefined' || !CAREER || !CAREER.career) return;
  try{ const v=ccFnShopEra(careerToday()).v; if(v in CC_ERA_HUE){ ccHubThemeApply(CC_ERA_HUE[v][0], CC_ERA_HUE[v][1]); return; } }catch(e){}
  const src=ccLobbyBg(careerToday());
  if(src in CC_HUB_THEME){ ccHubThemeApply(CC_HUB_THEME[src]); return; }
  const img=new Image();
  img.onload=()=>{
    let hue=null;
    try{
      const c=document.createElement('canvas'); c.width=64; c.height=36;
      const g=c.getContext('2d'); g.drawImage(img, 0, 0, 64, 36);
      const d=g.getImageData(0, 0, 64, 36).data;
      // Самый частый оттенок (24 корзины по 15°, вес — насыщенность×яркость), а не средний: у осеннего леса под
      // синим небом средний гасился в ноль.
      const bins=new Array(24).fill(0), bx=new Array(24).fill(0), by=new Array(24).fill(0);
      let wsum=0;
      for(let i=0; i<d.length; i+=4){
        const r=d[i]/255, gg=d[i+1]/255, b=d[i+2]/255, mx=Math.max(r, gg, b), mn=Math.min(r, gg, b), dl=mx-mn;
        if(dl<0.08 || mx<0.12) continue;
        let hh=mx===r ? ((gg-b)/dl)%6 : mx===gg ? (b-r)/dl+2 : (r-gg)/dl+4; hh=(hh*60+360)%360;
        const w=dl*mx, k=Math.floor(hh/15)%24;
        bins[k]+=w; bx[k]+=Math.cos(hh*Math.PI/180)*w; by[k]+=Math.sin(hh*Math.PI/180)*w; wsum+=w;
      }
      let best=0; for(let k=1; k<24; k++) if(bins[k]+bins[(k+1)%24]+bins[(k+23)%24]>bins[best]+bins[(best+1)%24]+bins[(best+23)%24]) best=k;
      const ks=[(best+23)%24, best, (best+1)%24], X=ks.reduce((s, k)=>s+bx[k], 0), Y=ks.reduce((s, k)=>s+by[k], 0), W=ks.reduce((s, k)=>s+bins[k], 0);
      // Мало цвета — остаётся синий по умолчанию.
      if(wsum>40 && W/wsum>0.2) hue=(Math.atan2(Y, X)*180/Math.PI+360)%360;
    }catch(e){ hue=null; }
    CC_HUB_THEME[src]=hue;
    if(ccLobbyBg(careerToday())===src) ccHubThemeApply(hue);
  };
  img.onerror=()=>{ CC_HUB_THEME[src]=null; };
  img.src=src;
}
function careerRenderHubRaw(tab){
  // 2019–2020: состав по этапу года (старый сейв со сквадом с апреля тоже сходит на дуо).
  try{ if(typeof ccSyncPhaseRoster==='function') ccSyncPhaseRoster(); }catch(e){}
  /* ОТРИСОВКА НЕ ТРАТИТ БРОСКИ ВЕЧЕРА. Пока идёт сеяный вечер (CC_MP_RAND), хаб всё равно
     перерисовывают сетевые события — строка гонки соседа, 'ready', переподключение, — и
     каждый Math.random внутри отрисовки уходил из общего генератора в СЛУЧАЙНЫЙ момент
     расчёта, свой у каждого клиента. Годовая проба на шестерых 8.09: у одного +4 броска на
     второй игре play-in, дальше другой набор вопросов и вечер стоит. Здесь генератор на время
     отрисовки подменяется настоящим (ccRaceUnseeded), как у вопроса и у сборки команд. */
  if(typeof CC_MP_RAND!=='undefined' && CC_MP_RAND && Math.random!==CC_MP_RAND && typeof ccRaceUnseeded==='function')
    return ccRaceUnseeded(function(){ return careerRenderHub(tab); });
  const next=tab||CH_TAB;
  const same=(CH_DREW===next);
  const at=same ? ccHubScroll() : null;
  /* Падение отрисовки не должно вешать экран. Шаг дня уже защищён (careerNextDay, CC_DAY_ERR),
     а упавшая после него плитка оставляла вчерашний экран с мёртвыми кнопками до F5.
     Теперь тело хаба заменяется красной плашкой с ошибкой и кнопкой на центр, стек уходит в консоль.
     Сам шаг дешёвый (tools/next-day-cost-probe.js: 12 мс на 1-м сезоне, 39 на 3-м, худший 541),
     так что «зависание» это именно оборванная отрисовка. */
  try{
    careerRenderHubBody(tab);
    CC_HUB_ERR=null;
  }catch(e){
    CC_HUB_ERR=String((e && e.message) || e);
    // Полный текст — для кнопки «скопировать»: сборка, вкладка и стек. Именно
    // его не хватало, чтобы найти упавшую плитку по отзыву игрока.
    CC_HUB_ERR_FULL='FNCS Draft '+(typeof CC_BUILD!=='undefined' ? CC_BUILD : '?')+
      ' · '+(tab||CH_TAB)+'\n'+String((e && e.stack) || e);
    console.error('careerRenderHub сломался на вкладке '+(tab||CH_TAB)+':', e);
    try{
      const b=document.getElementById('chBody');
      if(b) b.innerHTML='<div class="cc-ffo-err"><b>'+esc(L().ccHubBroke)+'</b>'+
        '<span>'+esc(CC_HUB_ERR)+'</span>'+
        '<span class="cc-ffo-build">'+
        esc('FNCS Draft '+(typeof CC_BUILD!=='undefined' ? CC_BUILD : '?')+' · '+(tab||CH_TAB))+
        '</span></div>'+
        '<button class="ch-play" onclick="careerRenderHub(\'centre\')">'+
        esc(L().ccHubBackCentre)+'</button>'+
        '<button class="cc-back cc-err-copy" onclick="ccHubErrCopy(this)">'+
        esc(L().ccHubCopy)+'</button>';
    }catch(e2){ console.error('и плашку показать не вышло:', e2); }
  }
  CH_DREW=CH_TAB;
  if(typeof ccNatNudge==='function') ccNatNudge();
  if(typeof ccFmtYearNudge==='function') ccFmtYearNudge();
  if(at) try{
    const b=document.getElementById('chBody');
    if(b && at.b) b.scrollTop=at.b;
    if(b && b.parentElement && at.p) b.parentElement.scrollTop=at.p;
    if(at.w) window.scrollTo(0, at.w);
  }catch(e){}
  /* Переписка — к последнему сообщению (его слово 7.10: «когда отправляю сообщение не сразу перекидывает на
     сообщение, нужно листать»). Окно .dm-msgs со своей прокруткой собирается заново и вставало в начало. */
  try{ document.querySelectorAll('#chBody .dm-msgs').forEach(m=>{ m.scrollTop=m.scrollHeight; }); }catch(e){}
  // На телефоне панель вкладок листается: открытая — посередине видимой части (его «не удобно с телефона кликать»).
  try{ const on=document.querySelector('#screen-career-hub .ch-tabs .ch-tab.on'), bar=on && on.parentElement;
    if(bar && bar.scrollWidth>bar.clientWidth) bar.scrollLeft=Math.max(0, on.offsetLeft-(bar.clientWidth-on.offsetWidth)/2); }catch(e){}
}
/* Число с карточки — одно на все экраны. Карточка и шапка хаба печатают
   рейтинг плюс пинг и возраст (см. shownOvr), а профиль соцсети и лист
   «Профиль» печатали голый pl.ovr: 78 на карточке против «Rating 68» строкой
   ниже. Игрок: «пофикси баг где якобы у тебя рейтинг на
   10 больше, хотя это не так». Потолок тот же, что у карточки. */
function ccMyShownOvr(){
  const card=careerCard(), a=card ? attrsFor(card) : null;
  return a ? Math.min(CAREER_SCALE_TOP, Math.round(a.ovr + (card._pingEdge||0) + (card._ageEdge||0)))
           : (CAREER && CAREER.player ? CAREER.player.ovr : 0);
}
/* Шапка: ближайший играбельный турнир (сегодня или впереди, до 120 дней) — старший
   по CC_KIND_RANK, если в день их несколько. */
function ccHdrNext(){
  const days=careerEvents(), today=careerToday(), rank=e=>{ const i=CC_KIND_RANK.indexOf(e.kind); return i<0 ? 99 : i; };
  for(let n=0, d=today; n<=120; n++, d=ccAddDays(d, 1)){
    if(d>CC_YEAR_TO) break;
    const on=(days.get(d)||[]).filter(e=>CC_PLAYABLE.indexOf(e.kind)>=0 && (n || careerCanPlayKind(e.kind)));
    if(on.length) return {ev:on.slice().sort((a,b)=>rank(a)-rank(b))[0], day:d, n:n};
  }
  return null;
}
function ccHdrDate(iso){ const m=(L().calMonthsShort||[])[Number(String(iso).slice(5,7))-1];
  return m ? Number(String(iso).slice(8,10))+' '+m : ccFmtDay(iso); }
// Сдвиг рейтинга за сезон: от первого вечера сезона до сейчас.
function ccHdrSeasonDelta(){
  const cr=CAREER.career, first=(cr.log||[]).find(r=>r.season===cr.season && r.ovr!=null);
  return first ? Math.round((CAREER.player.ovr||0)-first.ovr) : 0;
}
/* ===== Игроки сайта: общая таблица карьер =====================================

   Его выбор 2.10 из списка «чего не хватает»: таблица, где своя карьера стоит
   среди чужих. Строку карьеры игра шлёт сама (ccBoardSend) на воркер mp.fncsdraft.com
   (/board, см. server/src/board.js): не чаще раза в 10 минут и только когда что-то
   поменялось. id карьеры — случайный и наружу не уходит: по нему строка
   обновляется и прячется. С file:// (пробы, сторожа) не шлётся ничего, если хост
   не задан явно (MP.host), — иначе каждая проверка писала бы в живую таблицу.

   Проверить строку сервер не может — карьера считается в браузере, — и вкладка
   так и пишет. Пустая таблица и упавший сервер — не ошибка игры: вкладка говорит
   «не отвечает», карьера идёт дальше. */
const CC_BOARD_EVERY=10*60000;
let CC_BOARD_T=null, CC_BOARD_REGION=null, CC_BOARD_DATA=null, CC_BOARD_SORT=null, CC_BOARD_PAGE=0;
function ccBoardBase(){
  const h=(typeof MP!=='undefined' && MP.host) || '';
  if(!h && location.protocol==='file:') return null;
  return String(h||'wss://mp.fncsdraft.com').replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')+'/board';
}
function ccBoardOn(){
  const cr=CAREER && CAREER.career;
  return !!(cr && !CAREER._mgr && !(cr.board && cr.board.off) && ccBoardBase());
}
function ccBoardId(){
  const cr=CAREER.career;
  cr.board=cr.board||{};
  if(!cr.board.id){
    let id='';
    try{ id=crypto.randomUUID(); }catch(e){ id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2); }
    cr.board.id=String(id).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    // Сразу в сейв: иначе после перезагрузки до следующего сохранения карьера получала новый id и вторую строку.
    try{ careerSave(); }catch(e){}
  }
  return cr.board.id;
}
/* Не турнирные деньги внутри cr.earnings: бонус за подпись (ccPayIn в careerOrgSign) и призы своих турниров
   (игрок сам кладёт фонд и сам его выигрывает). Игрок 2.11: «пусть в таблице пишет призы только с турниров».
   Старые сейвы: бонусы — из ленты событий (tlSignBonus), свои капы — по дням cr.ownCups в журнале. */
function ccEarnSignOf(cr){
  if(cr.earnSign!=null) return cr.earnSign||0;
  let n=0; (cr.events||[]).forEach(e=>{ if(e && e.k && String(e.k).indexOf('tlSignBonus')===0) n+=Number(String((e.a||[])[1]||'').replace(/[^0-9]/g, ''))||0; });
  return n;
}
function ccEarnOwnOf(cr){
  const days=new Set(); (cr.ownCups||[]).forEach(c=>{ if(c && !c.off && c.day){ days.add(c.day); days.add(ccAddDays(c.day, 1)); } });
  let n=0; (cr.log||[]).forEach(r=>{ if(r && !r.who && r.prize>0 && (r.own || (r.kind==='victory' && days.has(r.day)))) n+=r.prize; });
  return n;
}
function ccEarnCups(cr){ return Math.max(0, Math.round((cr.earnings||0)-ccEarnSignOf(cr)-ccEarnOwnOf(cr))); }
// Строка карьеры: то, что о ней видно всем.
function ccBoardRow(){
  const pl=CAREER.player, cr=CAREER.career, log=cr.log||[];
  let best=null;
  log.forEach(r=>{ if(!(r && r.place>0 && r.of>0)) return;
    if(!best || r.place<best.place || (r.place===best.place && r.of>best.of)) best=r; });
  return {id:ccBoardId(), nick:String(pl.nick||pl.handle||'').slice(0, 24), region:ccCareerRegion(),
          country:String(pl.country||'').toLowerCase().slice(0, 2), seasons:Math.max(1, cr.season||1),
          earn:ccEarnCups(cr), earnAll:ccEarnCups(cr)+Math.round(ccEarnSignOf(cr)), ovr:Math.round(ccMyShownOvr()||pl.ovr||1),
          div:Math.min(5, Math.max(1, cr.division||5)), titles:log.filter(r=>r && r.place===1).length,
          year:(typeof ccCalYear==='function' ? ccCalYear() : 2026),
          best: best ? best.place+'/'+best.of : '', bestEv: best ? String(best.kind||'cup') : '',
          spent:ccSpentBig(), income:ccIncomeAll(cr)};
}
// Весь доход карьеры: призы (со своими турнирами и бонусами за подпись), зарплата, подработка и кастомки — строки статистики.
function ccIncomeAll(cr){ return Math.max(0, Math.round((cr.earnings||0)+Math.max(0, cr.wages||0)+(cr.side||0))); }
// После сохранения — отложенно, чтобы десять сохранений вечера дали одну отправку.
function ccBoardSoon(){
  if(!ccBoardOn()) return;
  clearTimeout(CC_BOARD_T);
  CC_BOARD_T=setTimeout(()=>{ try{ ccBoardSend(false); }catch(e){} }, 3000);
}
/* Notion 13.10, 0:41: «таблица не обновляется, с разных акков смотрю, уже как день». Было три дыры:
   ключ строки записывался ДО ответа сервера — упал запрос или сервер ответил «рано» (skip:'gap'), и
   строка считалась отправленной до следующих денег; отправка внутри 10 минут просто пропадала, без
   повтора; а сама таблица читалась один раз за жизнь вкладки (CC_BOARD_DATA). Теперь ключ — только
   после принятой строки, отложенная отправка дожидается окна, таблица перечитывается при открытии. */
function ccBoardLater(ms){
  clearTimeout(CC_BOARD_T);
  CC_BOARD_T=setTimeout(()=>{ try{ ccBoardSend(false); }catch(e){} }, Math.max(3000, ms));
}
function ccBoardSend(force){
  if(!ccBoardOn()) return Promise.resolve(false);
  const cr=CAREER.career, row=ccBoardRow();
  const key=[row.nick, row.region, row.earn, row.earnAll, row.div, row.titles, row.best, row.seasons, row.spent, row.income].join('|');
  const b=cr.board;
  if(!force && b.key===key) return Promise.resolve(false);
  if(!force && b.sent && Date.now()-b.sent < CC_BOARD_EVERY){ ccBoardLater(CC_BOARD_EVERY-(Date.now()-b.sent)); return Promise.resolve(false); }
  b.sent=Date.now();
  return fetch(ccBoardBase(), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(row)})
    .then(r=>r.ok ? r.json().catch(()=>({ok:true})) : null)
    .then(j=>{
      if(j && j.ok && !j.skip){ b.key=key; return true; }
      if(j && j.skip) ccBoardLater(61000);   // сервер берёт строку раз в минуту — повторить после неё
      return false;
    }).catch(()=>false);
}
function ccBoardToggle(){
  const cr=CAREER.career; cr.board=cr.board||{};
  const id=ccBoardId();
  cr.board.off=!cr.board.off;
  careerSave();
  const base=ccBoardBase();
  const done=()=>{ CC_BOARD_DATA=null; careerTab('world'); };
  if(!base){ done(); return; }
  (cr.board.off ? fetch(base, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:id, del:true})})
                : ccBoardSend(true)).catch(()=>{}).then(done, done);
}
function ccBoardRegion(r){ CC_BOARD_REGION=r||null; CC_BOARD_PAGE=0; CC_BOARD_DATA=null; careerTab('world'); }
// Страницы по сто строк (его «и они листаются»).
function ccBoardPage(d){ CC_BOARD_PAGE=Math.max(0, CC_BOARD_PAGE+d); CC_BOARD_DATA=null; careerTab('world'); }
// По призовым или по тратам (15.10: роскошь и «Потрачено»).
function ccBoardSort(k){ CC_BOARD_SORT=k||null; CC_BOARD_PAGE=0; CC_BOARD_DATA=null; careerTab('world'); }
function ccBoardLoad(){
  const base=ccBoardBase();
  if(!base) return Promise.resolve({err:true});
  const cr=CAREER.career;
  const q='?'+(CC_BOARD_REGION ? 'region='+encodeURIComponent(CC_BOARD_REGION)+'&' : '')+
          (CC_BOARD_SORT ? 'sort='+CC_BOARD_SORT+'&' : '')+(CC_BOARD_PAGE ? 'page='+CC_BOARD_PAGE+'&' : '')+'me='+encodeURIComponent((cr.board && cr.board.id) || '');
  return fetch(base+q).then(r=>r.ok ? r.json() : {err:true}).catch(()=>({err:true}));
}
function careerWorldHTML(){
  const T=L(), cr=CAREER.career, off=!!(cr.board && cr.board.off);
  const regs=[[null, T.lbAll]].concat(['EU','NAC','NAW','BR','ASIA','ME','OCE'].map(r=>[r, ccRegShort(r)]));
  const head='<div class="lb-top"><div class="lb-regs">'+regs.map(([k,t])=>
      '<button class="ch-subtab'+(CC_BOARD_REGION===k?' on':'')+'" onclick="ccBoardRegion('+(k?'\''+k+'\'':'null')+')">'+esc(t)+'</button>').join('')+
    '</div><button class="ch-swap" onclick="ccBoardToggle()">'+esc(off ? T.lbShow : T.lbHide)+'</button></div>'+
    '<div class="lb-regs">'+[[null, T.lbByEarn], ['all', T.lbByAll], ['inc', T.lbByInc], ['spent', T.lbBySpent]].map(([k,t])=>
      '<button class="ch-subtab'+(CC_BOARD_SORT===k?' on':'')+'" onclick="ccBoardSort('+(k?'\''+k+'\'':'null')+')">'+esc(t)+'</button>').join('')+'</div>'+
    '<div class="ch-hint">'+esc(T.lbNote)+' '+esc(CC_BOARD_SORT==='all' ? T.lbAllNote : CC_BOARD_SORT==='inc' ? T.lbIncNote : CC_BOARD_SORT==='spent' ? '' : T.lbCupNote)+'</div>';
  /* Прочитанная таблица живёт минуту и только для своей карьеры: старше — перечитывается при открытии
     (старая видна, пока идёт новая), другая карьера в слоте — читает свою. */
  const bid=(cr.board && cr.board.id) || '';
  let d=CC_BOARD_DATA;
  if(d && d._for!==bid) d=CC_BOARD_DATA=null;
  if(!d || (!d._busy && Date.now()-(d._at||0) > 60000)){
    if(d) d._busy=true;
    // Сначала своя строка (чтобы таблица увидела сегодняшние деньги), потом чтение.
    ccBoardSend(false).then(()=>ccBoardLoad()).then(x=>{
      CC_BOARD_DATA=Object.assign(x||{err:true}, {_at:Date.now(), _for:bid});
      if(CH_TAB==='world') careerTab('world'); });
    if(!d) return head+'<div class="ch-hint">'+esc(T.lbLoad)+'</div>';
  }
  if(d.err) return head+'<div class="ch-hint">'+esc(T.lbErr)+'</div>';
  /* Одна и та же карьера двумя строками (Notion 13.10: «FLC sharko» дважды, все числа одни) — строка ушла
     с новым id до сохранения сейва. Одинаковые строки показываются один раз. */
  const seenRow=new Set(), rows=(d.rows||[]).filter(r=>{ if(r.you) return true;
    const k=[r.nick, r.region, r.country, r.seasons, r.earn, r.titles].join('|');
    if(seenRow.has(k)) return false; seenRow.add(k); return true; });
  /* Скрытая карьера — заметно и с кнопкой рядом (Notion 13.10: «меня с таблицы убрали… не обновляется
     таблица» — у него была нажата «Не показывать меня», а подпись об этом терялась серой строкой). */
  const me=d.you ? '<div class="lb-you">'+esc(T.lbYou(d.you.rank, d.total))+'</div>'
                 : (off ? '<div class="lb-you">'+esc(T.lbHidden)+' <button class="ch-swap" onclick="ccBoardToggle()">'+esc(T.lbShow)+'</button></div>' : '');
  if(!rows.length) return head+me+'<div class="ch-hint">'+esc(T.lbEmpty)+'</div>';
  const c=T.lbCols.slice(); if(CC_BOARD_SORT==='spent') c[3]=T.lbSpentCol; else if(CC_BOARD_SORT==='all') c[3]=T.lbAllCol; else if(CC_BOARD_SORT==='inc') c[3]=T.lbIncCol;
  const base0=(d.page||0)*(d.per||100);
  const flag=cc=>cc ? '<img class="ch-bio-flag" src="flags/w20/'+esc(ccCountryOf(cc))+'.png" alt="" onerror="this.remove()"> ' : '';
  const evw=k=>{ try{ return ccFfKindWord(k)||''; }catch(e){ return ''; } };
  const tr=(r,i,abs)=>'<tr class="'+(r.you?'lb-me':'')+'"><td>'+(abs ? i+1 : base0+i+1)+'</td><td>'+flag(r.country)+esc(r.nick)+
    '<small> · '+esc(T.lbSeasons(r.seasons))+'</small></td><td>'+esc(r.region)+'</td><td>$'+ccNum(CC_BOARD_SORT==='spent' ? (r.spent||0) : CC_BOARD_SORT==='inc' ? (r.income||0) : CC_BOARD_SORT==='all' ? (r.earnAll!=null ? r.earnAll : r.earn) : r.earn)+
    '</td><td>'+r.ovr+'</td><td>'+r.div+'</td><td>'+r.titles+'</td><td>'+(r.best ? esc(r.best)+(r.bestEv ? ' <small>'+esc(evw(r.bestEv))+'</small>' : '') : '-')+'</td></tr>';
  let body=rows.map((r,i)=>tr(r,i)).join('');
  if(d.you && !rows.some(r=>r.you)) body+='<tr class="lb-gap"><td colspan="8">…</td></tr>'+tr(Object.assign({you:true}, d.you.row), d.you.rank-1, true);
  const per=d.per||100, pages=Math.max(1, Math.ceil((d.total||0)/per)), pg=d.page||0;
  const nav=pages>1 ? '<div class="lb-regs lb-pages"><button class="ch-subtab"'+(pg>0?'':' disabled')+' onclick="ccBoardPage(-1)">‹</button>'+
    '<span class="ch-hint">'+esc(T.lbPage(pg*per+1, Math.min(d.total||0, (pg+1)*per), d.total||0))+'</span>'+
    '<button class="ch-subtab"'+(pg<pages-1?'':' disabled')+' onclick="ccBoardPage(1)">›</button></div>' : '';
  return head+me+'<div class="lb-wrap"><table class="lb-table"><thead><tr>'+c.map(x=>'<th>'+esc(x)+'</th>').join('')+
    '</tr></thead><tbody>'+body+'</tbody></table></div>'+nav;
}
// Подвкладки объединённых вкладок: «Медиа» = соцсети + стримы, «Таблицы» = PR/призовые + моя статистика + игроки сайта.
function ccSubTabsHTML(group){
  // Discord — своей вкладкой рядом с соцсетями (его скрин 19.11: стрелка из меню ленты на ряд вкладок).
  const list=group==='media' ? [['social', L().chTabSocial], ['streams', L().chTabStreams], ['youtube', L().chTabYt], ['discord', 'Discord']]
                             : [['table', L().lfSubPrMoney], ['stats', L().chTabStats], ['world', L().lbTab]];
  return '<div class="ch-subtabs">'+list.map(([k,t])=>'<button class="ch-subtab ch-subtab-'+k+(CH_TAB===k?' on':'')+'" onclick="careerTab(\''+k+'\')">'+esc(t)+'</button>').join('')+'</div>';
}
function careerRenderHubBody(tab){
  CH_TAB=tab||CH_TAB;
  try{ ccPirateNews(); }catch(e){}
  try{ ccYearThemeApply(); }catch(e){}
  // На «Центре» вкладки хаба живут в шапке лобби (Notion «19.10»: две полосы вкладок одна над другой) — своя прячется.
  try{ document.getElementById('screen-career-hub').classList.toggle('ch-lobby-on', CH_TAB==='centre'); }catch(e){}
  const pl=CAREER.player, cr=CAREER.career;
  const card=careerCard(), a=card?attrsFor(card):null;
  // The same number the card prints: base plus connection plus age. The header
  // was leaving age out, so the hub said 63 while the card next to it said 67.
  // Capped at the top of the scale, the same way the card is: see shownOvr.
  const shown=ccMyShownOvr();

  const face=card ? (photoURL(card)||'') : '';
  document.getElementById('chWho').innerHTML=
    (face ? `<img class="ch-face" src="${face}" alt="" onerror="this.remove()">`
          : `<span class="ch-face"></span>`)+
    `<div><div class="ch-name">${CAREER.org?careerCrestImg(CAREER.org.name,17,'ch-crest'):''}${esc(pl.nick||'')}</div>`+
    /* The strip under the name, which he pointed at on 18 August: a bio rather
       than a stat line.

       It cannot be the whole bio — that is five clauses long by the second
       season and this is one line beside the rating, the energy and the money.
       So it takes the half a profile actually leads with: how old you are, the
       flag, who you play for, where you stand, and the one thing you have won
       that is worth saying first. The rest of it — every trophy, the earnings,
       the manager — is in the profile tile on the centre, which is the place
       built to hold it. */
    `<div class="ch-sub">${[
      // Age and flag are one thing, the way "17 🇩🇰" is one thing: a separator
      // between them would be a dot standing on its own.
      [ccPlayerAge() ? String(ccPlayerAge()) : '',
       pl.country ? `<img class="ch-bio-flag" src="flags/w20/${
         esc(ccCountryOf(String(pl.country).toLowerCase()))}.png" alt="" title="${
         esc(ccCountryName(pl.country)||'')}">` : ''].filter(Boolean).join(' '),
      CAREER.org ? esc(CAREER.org.name) : '',
      ccNoDivisions() ? '' : L().ccDivision+' '+cr.division,
      L()[a?a.roleKey:pl.role]||'',
      ccInputIcon(ccInputOf(pl)),
      careerTopHonour()
    ].filter(Boolean).join(' · ')}</div></div>`+
    '';   // колокольчик снят 29.09 («хаб такой же как был») — входящие строкой в «Центре»
  const dOvr=ccHdrSeasonDelta();
  document.getElementById('chOvr').innerHTML=`${shown}<span class="ch-ovr-side"><small>${L().ccRoOvr}</small>`+
    (dOvr ? `<i class="ch-ovr-d ${dOvr>0?'up':'down'}" title="${esc(L().lfHdrSeason)}">${dOvr>0?'▲ +'+dOvr:'▼ '+dOvr}</i>` : '')+`</span>`;
  const chOvrEl=document.getElementById('chOvr');
  chOvrEl.onclick=()=>careerTab('log'); chOvrEl.classList.add('ch-go');
  // Energy is the only number up here that belongs to today rather than to the
  // career, and it was only ever drawn inside the day panel — which is the one
  // thing that is not on screen on a day with a tournament on it. It leads the
  // row so the two money numbers stay together at the end of it.
  // A bar rather than a number, the way a health bar reads: how much of the day
  // is left is a length you can see without reading it.
  const energyLeft=careerEnergy();
  document.getElementById('chPurseNow').innerHTML=
    `<div class="ch-en"><em>${L().ccRingEnergy}</em>`+
      `<div class="ch-en-row"><span class="ch-en-mark">${L().ccEnergyMark}</span>`+
      `<span class="ch-en-bar${energyLeft?'':' out'}">`+
      `<i style="width:${Math.round(energyLeft/careerEnergyMax()*100)}%"></i></span>`+
      `<b class="${energyLeft?'':'ch-spent'}">${energyLeft}</b></div></div>`+
    // Настрой напарника — рядом с энергией, только когда напарник есть.
    ((careerMateRec() || (typeof ccMpTeam==='function' && ccMpTeam())) ? (()=>{ const m=Math.round(careerPatience());
      return `<div class="ch-en ch-mood"><em>${L().ccRingMood}</em>`+
        `<div class="ch-en-row"><span class="ch-en-mark">🤝</span>`+
        `<span class="ch-en-bar${m<35?' low':''}"><i style="width:${Math.max(0,Math.min(100,m))}%"></i></span>`+
        `<b>${m}</b></div></div>`; })() : '')+
    // The balance rather than the lifetime prize money: this strip is read
    // before spending — a coach, a month at the bootcamp, a rig — and the
    // number that answers "can I" is what is left, not what was ever won. The
    // career's total keeps its place in the ladder tile and the history.
    `<div class="ch-go" onclick="careerTab('shop')"><em>${L().ccBalance}</em><b class="ch-cash">${ccMoney(cr.balance||0)}</b>${
      ccPayPending()>0 ? ccPayPendHTML() : ''}</div>`+
      // V-Bucks рядом с балансом (Notion «18.10»): тап — магазин предметов.
      `<div class="ch-go" onclick="ccFnShopOpen()"><em>V-Bucks</em><b class="ch-cash ch-vb"><i class="cc-vb-ic"></i>${ccNum(CAREER.vb||0)}</b></div>`+
    (ccTechToday() ? `<div><em>${esc(L().ccTechLbl||'Connection')}</em><b class="cc-pen bad">📶 −${CC_TECH_PEN}</b></div>` : '')+
    /* Form, reputation and burnout, which used to live in the ladder tile.

       They belong up here rather than in a tile you scroll to: all three are the
       state a career is in today, they change what the next tournament does, and
       burnout in particular is a penalty — the one number this file refuses to
       let move silently. Each is drawn only when it is not zero, so a career
       with nothing wrong with it does not carry three empty labels. */
    /* Форма и репутация — всегда, с пределом и подсказкой (его слово 21.10: «не понятно, как работает, мб когда
       наводишься — говорит», «не понятно, сколько максимум, минимум»). Наведение на ПК, нажатие на телефоне. */
    (()=>{ const f=careerForm(), T=L(), v=Math.round(f*10)/10;
      return `<div class="ch-tipw" tabindex="0" onclick="ccTipToggle(this, event)"><em>${T.ccForm} ⓘ</em><b class="${f>0?'ch-goal-met':f<0?'cc-pen bad':''}">${
        f ? T[f>0?'ccFormHot':'ccFormCold']+' ' : ''}${(v>0?'+':'')+v} <small>${esc(T.ccOfRange(CC_FORM_MAX))}</small></b>${
        '<div class="ch-tip">'+esc(T.ccFormTip(CC_FORM_MAX))+'</div>'}</div>`; })()+
    // The garage, said where the form is said — confidence is the floor under
    // it, and a number nobody can see is a number that does not exist. His
    // report, 20 August: confidence нигде не пишется.
    (()=>{ const c=(CAREER.gear && CAREER.gear.conf)||0; if(!c) return '';
      return `<div><em>${L().ccShopConf}</em><b class="ch-goal-met">+${c} · ${
        L().ccConfFloor(Math.round((CC_FORM_MAX-c)*10)/10)}</b></div>`; })()+
    (()=>{ const r=careerRep(), T=L();
      return `<div class="ch-tipw" tabindex="0" onclick="ccTipToggle(this, event)"><em>${T.ccRep} ⓘ</em><b class="${r>0?'ch-goal-met':r<0?'cc-pen bad':''}">${
        T[careerRepKey()]} ${r>0?'+':''}${r} <small>${esc(T.ccOfRange(CC_REP_MAX))}</small></b>${
        '<div class="ch-tip">'+esc(T.ccRepTip(CC_REP_MAX, CC_REP_PER_OVR, T))+'</div>'}</div>`; })()+
    (()=>{ const b=careerBurnout(); if(!b) return '';
      return `<div><em>${L().ccBurnout}</em><b class="cc-pen bad">${
        L().ccBurnoutDays(cr.grind||0)} · -${b}</b></div>`; })();
  document.getElementById('chPurse').innerHTML=
    `<div><em>${L().chSeason}</em><b>${cr.season}</b></div>`+
    `<div class="ch-go" onclick="careerTab('calendar')"><em>${L().chWeek} ${careerWeek()}/${ccYearWeeks()}</em><b>${
      esc(ccHdrDate(careerToday()))}</b></div>`+
    `<div class="ch-go" onclick="careerTab('social')"><em>${L().xFollowers}</em><b>${ccFollowers(careerReach())}</b></div>`+
    // Твич — своя аудитория, врозь с твиттером.
    `<div class="ch-go" onclick="careerTab('streams')"><em>Twitch</em><b>${ccFollowers(CAREER.career.twitch||0)}</b></div>`;
  // Полоса «Далее»: ближайший турнир и сколько до него дней.
  let nx=document.getElementById('chNext');
  if(!nx){ nx=document.createElement('div'); nx.id='chNext'; nx.className='ch-hnext';
    const top=document.querySelector('#screen-career-hub .ch-top'); if(top) top.appendChild(nx); }
  const nxt=cr.seasonOver ? null : ccHdrNext();
  nx.style.display=nxt ? '' : 'none';
  if(nxt){
    const art=(typeof ccEventArt==='function') ? ccEventArt(nxt.ev) : '';
    nx.onclick=()=>careerTab(nxt.n ? 'calendar' : 'centre');
    nx.innerHTML=(art ? `<img src="${esc(art)}" alt="" onerror="this.remove()">` : '')+
      `<em>${esc(nxt.n ? L().lfHdrNext : L().lfHdrToday)}</em>`+
      `<b>${esc(nxt.ev.label||'')}</b>`+
      `<span>${esc(nxt.n ? L().lfHdrIn(nxt.n)+' · '+ccHdrDate(nxt.day) : L().lfHdrPlay)}</span>`;
  }

  document.querySelectorAll('#screen-career-hub .ch-tab').forEach(b=>{
    // Стримы живут внутри «Медиа», статистика — внутри «Таблиц».
    b.classList.toggle('on', b.dataset.tab===({streams:'social', youtube:'social', discord:'social', stats:'table', world:'table'}[CH_TAB]||CH_TAB));
  });
  // The unread dot is the lobby's own notification mark — it is the only thing
  // on this screen that asks to be clicked.
  // The dot counts both halves of that screen now: a message waiting, and a feed
  // that has moved since it was last read. The tab is one button, so it cannot
  // promise only one of the two things behind it.
  const dot=document.getElementById('chDmDot');
  if(dot) dot.style.display = careerNotesN() ? 'inline-block' : 'none';
  // The same mark on the shop: something is affordable that was not the last
  // time it was opened. A desk of twelve rows does not announce itself, and
  // the money arrives on a payday the player was not looking at.
  const sdot=document.getElementById('chShopDot');
  if(sdot) sdot.style.display = careerShopNew().length ? 'inline-block' : 'none';

  const body=document.getElementById('chBody');
  // A finished career has no next week. Every other tab still opens — the
  // history, the table, the feed and the card are what is left of it.
  // Забаненному закрыт и календарь — правка: «когда банят,
  // календарь не должен работать». Ушедшему на пенсию он остаётся: пенсия —
  // это решение смотреть на сцену со стороны, бан — дверь, закрытая Epic.
  if(careerRetired() && (CH_TAB==='centre' || CH_TAB==='shop' ||
     (CH_TAB==='calendar' && careerBanned()))){
    body.innerHTML=careerRetiredHTML(); return;
  }
  if(CH_TAB==='calendar'){ body.innerHTML=careerCalendarHTML()+ccOwnCupPanelHTML(); return; }
  // 'log' — вкладка Профиль (ключ остался прежним ради сохранений),
  // 'hist' — История: сезоны и лента карьеры.
  if(CH_TAB==='log'){ body.innerHTML=careerProfileHTML(); return; }
  if(CH_TAB==='hist'){ body.innerHTML=careerHistoryHTML(); return; }
  if(CH_TAB==='stats'){ body.innerHTML=ccSubTabsHTML('boards')+careerStatsHTML(); return; }
  if(CH_TAB==='world'){ body.innerHTML=ccSubTabsHTML('boards')+careerWorldHTML(); return; }
  if(CH_TAB==='streams'){ body.innerHTML=ccSubTabsHTML('media')+'<div class="cc-media cc-media-tw">'+careerStreamsHTML()+'</div>'; return; }
  // Two standings on one tab: the division's season table, which only Division 1
  // has, and the money, which everybody is in.
  if(CH_TAB==='table'){
    // Сезонной таблицы Д1 больше нет — отзыв: «убери эту
    // таблицу, power ranking оставь». Вкладка — деньги и ПР.
    body.innerHTML=ccSubTabsHTML('boards')+'<div class="ch-grid ch-standings">'+careerMoneyHTML()+
                   careerPrHTML()+careerMobileHTML()+'</div>';
    return;
  }
  if(CH_TAB==='shop'){ body.innerHTML=careerShopHTML(); ccPaintMoveMap(); return; }
  // Медиа в цветах своих сетей (28.10, его «соцсети в цвете X, стримы в цвете твич, youtube в цветах ютуб»).
  if(CH_TAB==='social'){ body.innerHTML=ccSubTabsHTML('media')+'<div class="cc-media cc-media-x">'+careerSocialHTML()+'</div>'; return; }
  if(CH_TAB==='youtube'){ body.innerHTML=ccSubTabsHTML('media')+'<div class="cc-media cc-media-yt">'+careerYtHTML()+'</div>'; return; }
  if(CH_TAB==='discord'){ body.innerHTML=ccSubTabsHTML('media')+'<div class="cc-media cc-media-dc">'+ccDiscordHTML()+'</div>'; return; }
  /* The career itself, on its own screen.

     The centre was doing two jobs — what to do today, and who you have deals
     with — and the second one is read once a month while taking most of the
     room. His call, 18 August, after four passes at rearranging it: the centre
     is today, and everything that describes the career rather than the day gets
     its own tab. The two cards, who you are, the seat beside you, and the four
     people who pay you or take a cut. */
  // Шкафчик — и во вкладке «Я» (17.10, его «где шкафчик»: на телефоне правая колонка соцсети уезжает под ленту).
  // Шкафчик из карьеры убран целиком (19.10: «в карьере убери шкафчик», «и в медиа тоже не нужна»).
  if(CH_TAB==='me'){ body.innerHTML=careerMeHTML(); return; }
  // Шкафчик: образ (выбор скина открыт сразу) и награды.
  // Item Shop — своя вкладка рядом со шкафчиком (18.10, его «сделай item shop отдельный рядом с шкафчиком»).
  if(CH_TAB==='items'){ body.innerHTML='<div class="ch-grid" style="grid-template-columns:minmax(0,1fr);">'+ccFnShopHTML()+'</div>'; return; }
  // 19.10 вечером шкафчик вернулся своей вкладкой (его «шкафчик верни, он должен быть отдельным»), не внутри Медиа/Профиля.
  // Батл пасс сезона — рядом со шкафчиком.
  if(CH_TAB==='bp'){ body.innerHTML='<div class="ch-grid cc-bp" style="grid-template-columns:minmax(0,1fr);">'+ccBpHTML()+'</div>'; return; }
  if(CH_TAB==='locker'){ if(!CC_FN_PICK) CC_FN_PICK='o'; body.innerHTML='<div class="ch-grid" style="grid-template-columns:minmax(0,1fr);">'+ccLockerHTML()+'</div>'; return; }
  if(CH_TAB==='club'){ body.innerHTML=careerClubTabHTML(); return; }
  // Цели и развитие — сверху «Тренировки»: с «Центра» они ушли, когда он вернулся к виду прода (29.09).
  /* Тренировка без повторов (27.10, его «тренировки чет облегчить, слишком много информации»): шесть параметров стояли
     трижды (Развитие, Фокус/Цель, панель дня), усталость дважды, пустая плитка задач без клуба. Здесь — задачи, только
     если они есть (без своей цели и фокуса: они в плане недели); параметры — один раз, в панели дня. Плитки «Развитие»
     нет: рейтинг и его ход за сезон уже стоят в шапке (#chOvr). */
  if(CH_TAB==='train'){ const goals=ccGoalsTileHTML(true);
    body.innerHTML=(goals ? '<div class="ch-grid ch-grid-me ch-train-goals">'+goals+'</div>' : '')+careerTrainTabHTML(); return; }
  // The card tab is gone — the centre already wears the card, and a whole tab
  // that repeated it sat between the calendar and the socials for no reason.
  body.innerHTML=careerCentreHTML(card, a);
}

/* Лобби как в Fortnite (его «главное меню как в фортнайте сейчас, чтоб было видно скин и кнопка реди»): посередине
   свой надетый скин в полный рост, по бокам напарники (у них своего образа нет — стандартные скины Fortnite, у
   каждого свой по нику), над головами ник и рейтинг; справа внизу — ближайшее событие и большая жёлтая кнопка.
   Кнопка — та же, что в панели ниже (первая .ch-play из btn): её действие, подпись и запрет, ничего своего. */
const CC_LB_DEFAULTS=['cid_005_athena_commando_m_default','cid_001_athena_commando_f_default','cid_006_athena_commando_m_default',
  'cid_002_athena_commando_f_default','cid_007_athena_commando_m_default','cid_003_athena_commando_f_default',
  'cid_008_athena_commando_m_default','cid_004_athena_commando_f_default'];
/* Популярные у про-игроков скины (его «просто добавь рандомные популярные скины»: реальных «чей скин у кого» нет —
   они только в реплеях, см. Osirion) — [id, первый день в магазине по fn-shop.js]: в 2019-м никто не стоит в скине 2024-го. */
const CC_LB_POPULAR=[['cid_044_athena_commando_f_scipop','2019-01-02'],['cid_170_athena_commando_f_luchador','2019-01-02'],
  ['cid_160_athena_commando_m_speedyred','2019-01-03'],['cid_102_athena_commando_m_raven','2019-01-05'],['cid_334_athena_commando_m_scrapyard','2019-02-10'],
  ['cid_061_athena_commando_f_skigirl','2019-02-20'],['cid_397_athena_commando_f_treasurehunterfashion','2019-05-08'],
  ['cid_452_athena_commando_f_cyberfu','2019-07-12'],['cid_472_athena_commando_f_cyberkarate','2019-07-21'],
  ['cid_493_athena_commando_f_jurassicarchaeology','2019-08-04'],['cid_029_athena_commando_f_halloween','2019-10-31'],
  ['cid_748_athena_commando_f_hitman','2020-04-18'],['cid_726_athena_commando_m_targetpractice','2020-05-15'],
  ['cid_784_athena_commando_f_renegaderaiderfire','2020-06-28'],['cid_795_athena_commando_m_dummeez','2020-08-05'],
  ['cid_a_158_athena_commando_f_buffet_yc20h','2021-08-05'],['cid_a_359_athena_commando_f_bunnypurple','2022-03-11'],
  ['cid_a_377_athena_commando_f_littleegg_omnb5','2022-05-08'],['cid_028_athena_commando_f','2024-12-20']];
// Icon-скины самих игроков: на своём хозяине — с даты выхода.
const CC_LB_ICON={ninja:['cid_605_athena_commando_m_tourbus','2020-01-17'], lachlan:['cid_891_athena_commando_m_lunchbox','2020-11-13'],
  loserfruit:['cid_764_athena_commando_f_loofah','2020-06-22'], thegrefg:['cid_990_athena_commando_m_grilledcheese_snx4k','2021-01-17'],
  bugha:['cid_a_140_athena_commando_m_bluecheese','2021-07-21'], 'ali-a':['cid_a_415_athena_commando_m_alfredo','2022-05-20'],
  clix:['character_twilightspotspell','2025-03-23'], mongraal:['character_vigorknackdill','2026-06-28']};
/* ГЛАВНОЕ МЕНЮ ТОГО СЕЗОНА (его «посмотри главное меню каждого сезона и сделай так же», «модельки расположены как в
   фортнайте», «внизу не должно быть информации, всё в главном меню»). Три семейства по истории лобби Fortnite Wiki
   (Template:LobbyHistory, скриншоты по версиям):
     A — Глава 1: узкая полоса вкладок сверху, слева «SEASON N», уровень с полоской XP, золотой тир, «DAILY CHALLENGES»,
         справа внизу плашка режима и широкая жёлтая PLAY, снизу полоса кнопок;
     B — Главы 2–4 (v11.00): открытые белые вкладки, слева «CHAPTER N / SEASON M», уровень, синяя VIEW QUESTS, ресурсы
         сезона; справа карточка новости, режим, синяя CHANGE, жёлтая PLAY!, синяя FILL;
     C — с v26.30 (октябрь 2023): вкладки-пилюли с сеткой и поиском, слева новость и тёмная карточка режима с серой
         плашкой и скруглённой PLAY, справа внизу кольцо LVL, снизу ряд плиток.
   Общее у всех: четыре подиума — свой впереди посередине и светится, три сзади (один слева, два справа), на пустых «+»,
   над головой корона хозяина, ник и Ready / Not Ready. Фон — настоящий фон лобби сезона (ccLobbyBg).
   Всё, что было на «Центре» ниже, лежит в листе «Подробнее» (ccLbSheet) внутри меню: ничего под ним. */
let CC_LB_SHEET=false;
function ccLbSheet(on){
  CC_LB_SHEET=(on==null) ? !CC_LB_SHEET : !!on;
  const s=document.getElementById('ccLbSheet'); if(s) s.hidden=!CC_LB_SHEET;
  if(CC_LB_SHEET && s) try{ s.scrollIntoView({block:'start'}); }catch(e){}
}
// Подиумы как в лобби Fortnite: [x центра в % ширины, низ ног в % высоты, высота фигуры в % высоты].
const CC_LB_SLOTS=[[50, 9, 70], [37, 21, 55], [61, 21, 55], [72, 22, 53]];
/* Кто стоит в лобби рядом с тобой — состав того вечера, что идёт сегодня (Notion «19.10»: «когда кап
   на четверых — все четверо в лобби, и так же с трио»): сквад-кап в дуо-год — сквад-составом
   (CAREER.rosters[4]), трио-кап — трио, сборная — её состав, соло — один. В другие дни — состав сезона. */
function ccLobbySquadFor(next){
  const base=careerMates()||[];
  if(!next || !next.day) return base;
  try{
    if(next.type==='solo') return [];
    if(next.type==='nations'){
      const ev=careerNationsOn(next.day), mine=ccNationsMine();
      if(ev && mine){
        if(ccNatStage(ev)==='trial') return [];
        const me=hKey(careerCard());
        return (mine.full||[]).filter(c=>c && hKey(c)!==me);
      }
    }
    if(next.type==='victory' && !(typeof ccMpOn==='function' && ccMpOn())){
      const f=ccVictoryFormat(careerVictoryOn(next.day));
      if(f===1) return [];
      if(f && f!==careerSquadSize())
        return ccFmtRoster(f).map(ccMateCardOf).filter(c=>c && c.handle).slice(0, f-1);
    }
  }catch(e){}
  return base;
}
function ccLobbyHTML(card, btn, next, when, strip, ex){
  ex=ex||{};
  const T=L(), pl=CAREER.player, cr=CAREER.career, eq=CAREER.fnEq||{}, own=CAREER.fnOwn||{};
  const era=ccFnShopEra(careerToday()), fam=era.k==='c1' ? 'A' : (era.k==='c2' || era.k==='c3') ? 'B' : 'C';
  const today=careerToday(), used=new Set();
  const myOvr=Math.round((card && (card._ovr||card.rating)) || pl.ovr || 0);
  const myIcon=CC_LB_ICON[hKey(pl.handle||pl.nick||'')];
  const mySkin=eq.o && own[eq.o] ? eq.o : (myIcon && myIcon[1]<=today ? myIcon[0] : CC_LB_DEFAULTS[0]);
  used.add(mySkin);
  // Скин напарника: своя icon-скин, если уже вышла; иначе популярный у про-игроков, вышедший к этому дню; без повторов.
  const skinOf=c=>{
    // Живой напарник онлайн — в том, что надел сам (mp.js MP.card, fnSkin).
    if(c && c.fnSkin && !used.has(c.fnSkin)){ used.add(c.fnSkin); return c.fnSkin; }
    const icon=CC_LB_ICON[hKey(c)];
    if(icon && icon[1]<=today && !used.has(icon[0])){ used.add(icon[0]); return icon[0]; }
    const pool=CC_LB_POPULAR.filter(p=>p[1]<=today && !used.has(p[0]));
    if(pool.length){ const id=pool[ccHashStr(hKey(c))%pool.length][0]; used.add(id); return id; }
    const id=CC_LB_DEFAULTS.find(x=>!used.has(x)) || CC_LB_DEFAULTS[1]; used.add(id); return id;
  };
  // Готов ли вечер: сегодня есть что играть и кнопка не заперта — тогда Ready, иначе Not Ready (как в лобби).
  let ready=false; try{ ready=!!(next && next.day===today && careerCanPlay(next) && !cr.seasonOver); }catch(e){}
  const party=[{id:mySkin, name:pl.nick||pl.handle||'', ovr:myOvr, me:true, input:ccInputOf(pl)}]
    .concat(ccLobbySquadFor(next).filter(Boolean).slice(0, 3).map(c=>({id:skinOf(c), name:c.handle, ovr:Math.round(c._ovr||c.rating||0), input:ccProInput(c)})));
  // Места — классами cc-lb-s0…s3 (CSS: на ПК как в лобби, на телефоне шире), числа CC_LB_SLOTS — для ПК.
  const slot=(i)=>{
    const p=party[i], s=' cc-lb-s'+i;
    const ped='<span class="cc-lb-ped'+(i===0 ? ' me' : '')+s+'"></span>';
    if(!p) return ped+'<button class="cc-lb-plus'+s+'" onclick="careerTab(\'me\')" title="'+esc(T.lfRosters)+'">+</button>';
    return ped+'<div class="cc-lb-fig'+(p.me ? ' me' : '')+s+'"'+(p.me ? ' onclick="ccFnLockerOpen(\'o\')"' : '')+'>'+
      '<img class="full" src="'+ccFnFull(p.id)+'" data-id="'+esc(p.id)+'" alt="" loading="lazy" crossorigin="anonymous" onload="ccLbFigCut(this)" onerror="ccFnHeroErr(this)">'+
      '<div class="cc-lb-plate">'+(p.me ? '<i class="cc-lb-crown">♛</i>' : '')+'<span class="cc-lb-hex">'+p.ovr+'</span><b>'+esc(p.name)+' <u>'+p.ovr+'</u></b>'+
      '<span class="cc-lb-in">'+ccInputIcon(p.input)+'</span>'+
      /* В свободный день метки нет вовсе: красное «Not Ready» без турнира читалось как ошибка (аудит ПК 22.10).
         Not Ready — только в день турнира, когда играть правда нельзя (нет напарника, кресло пустое). */
      ((next && next.day===today && next.type!=='free') ? '<em class="'+(ready ? 'ok' : '')+'">'+(ready ? 'Ready' : 'Not Ready')+'</em>' : '')+'</div></div>';
  };
  const stage='<div class="cc-lb-stage">'+[1,2,3,0].map(slot).join('')+'</div>';
  // Кнопка — та же, что в панели (первая .ch-play из btn): действие, подпись, запрет.
  const m=/<button class="ch-play([^"]*)"([^>]*)>([\s\S]*?)<\/button>/.exec(btn||'');
  const play=m ? '<button class="cc-lb-play'+m[1].replace(/\bch-/g, ' cc-lb-')+'"'+m[2]+'>'+m[3]+'</button>' : '';
  let evFmt=0; try{ if(next && next.type==='victory') evFmt=ccVictoryFormat(careerVictoryOn(next.day)); }catch(e){}
  const fmtWord=((next && next.type==='solo') || evFmt===1) ? 'Solo' : ({2:'Duos', 3:'Trios', 4:'Squads'})[evFmt||careerSquadSize()] || 'Duos';
  const evName=next ? (next.label||next.title||'') : '';
  const sn=ccLobbySeasonName(today);
  const lvlFrac=Math.max(0, Math.min(1, ((pl.ovrExact!=null ? pl.ovrExact : pl.ovr)||0)%1));
  let todayEv=null; try{ todayEv=(careerEvents().get(today)||[])[0]||null; }catch(e){}
  /* Фон — всегда фон сезона, как в ранкеде (его поправка 19.10: «во время капов тоже задний фон как в ранкеде, только кап
     меняется слева»): от капа меняются карточка новостей и карточка вечера слева. */
  const evBg='';
  // Карточка новостей — ближайший турнир (в свободный день — следующий по календарю), с его обложкой.
  let newsEv=null, newsDay='';
  try{ const ev=careerEvents(); for(let d=0; d<21 && !newsEv; d++){ const iso=ccAddDays(today, d), on=ev.get(iso)||[]; if(on.length){ newsEv=on[0]; newsDay=iso; } } }catch(e){}
  const nextArt=(newsEv && ccEventArt(newsEv)) || ccLobbyBg(today);
  const newsWhen=newsDay ? L().calDows[(new Date(newsDay+'T00:00:00Z').getUTCDay()+6)%7]+' '+Number(newsDay.slice(8))+' '+L().calMonthsShort[Number(newsDay.slice(5,7))-1] : (when||'');
  const sched=strip ? '<div class="cc-lb-sched"><div class="ch-weeks ch-days">'+strip+'</div></div>' : '';
  // Карточка вечера с «Центра» (ex.play): LIVE, матч N из M, сколько проходит, где высадка, кто играет, PLAY, эфир,
  // пропуск, перемотка. Без неё (старые вызовы) — простой блок режима.
  const playBox=ex.play ? '<div class="cc-lb-playbox">'+ex.play+'</div>' : '<div class="cc-lb-go">'+play+'</div>';
  // Внизу у всех глав: полоса сезона (недели) и расписание недели плитками — как на прошлом «Центре».
  const bottomBar=(ex.bar||'')+sched;
  let left='', right='';
  if(fam==='A'){
    left='<div class="cc-lb-season">'+esc(sn.a)+'</div>'+
      '<div class="cc-lb-lvl"><span class="cc-lb-banner">'+esc(String(cr.division||1))+'</span><div><b>LEVEL '+myOvr+'</b>'+
        '<u class="cc-lb-xp"><s style="width:'+Math.round(lvlFrac*100)+'%"></s></u></div></div>'+
      '<div class="cc-lb-tier" onclick="careerTab(\'table\')"><b>'+esc(T.ccDivision||'Division')+' '+(cr.division||1)+'</b><em>'+esc(ccLobbyWeek())+'</em></div>'+
      ccLobbyQuestsHTML('DAILY CHALLENGES')+(ex.side||'');
    // С карточкой вечера (ex.play) плашка режима не нужна: формат, название и день уже на ней (Notion «19.10», скрин 31).
    right='<div class="cc-lb-region">'+esc(regionName(ccCareerRegion()))+'</div>'+
      (ex.play ? '' : '<div class="cc-lb-modebox"><b>'+esc(fmtWord)+'</b><em>'+esc(evName)+(when ? ' · '+esc(when) : '')+'</em></div>')+playBox;
  } else if(fam==='B'){
    left='<div class="cc-lb-chap">'+esc(sn.c)+'</div><div class="cc-lb-sea">'+esc(sn.s)+'</div>'+
      '<div class="cc-lb-lvl2"><b>LEVEL '+myOvr+'</b><u class="cc-lb-xp"><s style="width:'+Math.round(lvlFrac*100)+'%"></s><i>'+esc(ccLobbyWeek())+'</i></u></div>'+
      '<button class="cc-lb-quests" onclick="this.nextElementSibling.hidden=!this.nextElementSibling.hidden">VIEW QUESTS</button>'+
      '<div hidden>'+ccLobbyQuestsHTML('')+'</div>'+
      (ex.side||'');
    // Плашки «день · вечер» и «DUOS» над карточкой вечера повторяли её же (Notion «19.10», скрин 31) — с ex.play их нет.
    right=(ex.play ? '' : '<div class="cc-lb-news" onclick="careerTab(\'calendar\')"><em>'+esc(when||'')+'</em><b>'+esc(evName)+'</b></div>'+
      '<div class="cc-lb-modebox"><b>'+esc(fmtWord)+'</b></div>')+playBox;
  } else {
    /* Лобби как в Fortnite (27.10): справа составы; кнопки Media / Item Shop / Locker повторяли вкладки — сняты, кольцо
       LVL осталось. Карточка новостей слева сверху — ВОЗВРАЩЕНА (27.10, его «новости в карьере на главной вернуть
       дизайн, который был, он точно лишним не был»): снимал её как повтор турнира, а она — лента новостей карьеры. */
    left=(ccLobbyNewsCardHTML() || '<div class="cc-lb-news cc-lb-card" onclick="careerTab(\'calendar\')"'+(nextArt ? ' style="--card-art:url('+nextArt+')"' : '')+'>'+
        '<em>'+esc(newsWhen)+'</em><b>'+esc(newsEv ? (newsEv.label||evName) : (evName||sn.s))+'</b></div>')+playBox;
    right='<div class="cc-lb-stack">'+(ex.side||'')+'</div>'+
      '<div class="cc-lb-ringrow">'+
      '<div class="cc-lb-ring" onclick="careerTab(\'train\')" style="--p:'+Math.round(lvlFrac*100)+'"><em>LVL</em><b>'+myOvr+'</b></div></div>';
  }
  if(ex.play){ setTimeout(ccLobbyFit, 0); setTimeout(ccLobbyFit, 800); }
  return '<div class="cc-lobby cc-lb-'+era.k+' cc-lb-fam'+fam+(ex.play ? ' cc-lb-full' : '')+(evBg ? ' cc-lb-evbg' : '')+'" style="--lb-bg:url('+(evBg||ccLobbyBg(today))+')">'+
    ccLobbyTopHTML(fam, ex.note)+stage+'<div class="cc-lb-left">'+left+'</div><div class="cc-lb-right">'+right+'</div>'+
    '<div class="cc-lb-bottom">'+bottomBar+'</div></div>';
}
// Подпись сезона дня: Глава 1 — «SEASON 9 / SEASON X»; дальше — «CHAPTER N» и «SEASON M» (или имя: OG, Remix…).
/* Новости слева сверху, как карусель новостей в лобби Fortnite: пять свежих из ленты карьеры, листаются сами,
   точки снизу; нажатие открывает ленту. */
let CC_LB_NEWS_T=null;
/* НОВОСТЬ КРУПНО (28.10, его «когда нажимаешь на новости, побольше приближает, больше подробностей, и закрыть
   крестиком»). Клик по карточке новостей открывает окно с той новостью, что сейчас на слайде: большая картинка,
   рубрика и полная дата, текст целиком (на карточке он обрезан до трёх строк), автор с аватаром, таблица мест, если
   она приложена к посту, стрелки по пяти свежим новостям и миниатюры. «Вся лента» — туда же, куда вела карточка.
   Закрывается крестиком, Esc и кликом мимо окна. */
let CC_NZ_I=0;
function ccNewsZoomFromCard(){
  const box=document.querySelector('.cc-lb-newsc');
  const i=box ? [...box.querySelectorAll('.cc-lb-slide')].findIndex(x=>x.classList.contains('on')) : 0;
  ccNewsZoom(Math.max(0, i));
}
function ccNewsZoom(i){
  const list=((CAREER.career && CAREER.career.news)||[]).slice(0, 5);
  if(!list.length) return;
  CC_NZ_I=(i+list.length)%list.length;
  const n=list[CC_NZ_I], T=L();
  let art=null; try{ art=ccNewsArtOf(n); }catch(e){}
  let txt=''; try{ txt=ccText(n); }catch(e){}
  let cat=''; try{ cat=T['ccNewsCat'+ccNewsCat(n)]||''; }catch(e){}
  let who=null; try{ who=ccPostAuthor(n); }catch(e){}
  let day=''; try{ day=n.day ? ccDayFull(n.day) : ccStamp(n); }catch(e){ day=ccStamp(n); }
  let shot=''; try{ shot=n.tbl ? ccShotHTML(n.tbl) : ''; }catch(e){}
  let av=''; try{ av=who ? ccAvatar(who) : ''; }catch(e){}
  const thumbs=list.map((m, k)=>{ let a=null; try{ a=ccNewsArtOf(m); }catch(e){}
    return '<button type="button" class="cc-nz-th'+(k===CC_NZ_I ? ' on' : '')+'" onclick="ccNewsZoom('+k+')"'+(a ? ' style="--card-art:url('+a.src+')"' : '')+' aria-label="'+(k+1)+'"></button>'; }).join('');
  let el=document.getElementById('ccNz');
  if(!el){ el=document.createElement('div'); el.id='ccNz'; el.className='cc-nz'; document.body.appendChild(el);
    el.addEventListener('click', e=>{ if(e.target===el) ccNewsZoomClose(); });
    document.addEventListener('keydown', ccNewsZoomKey); }
  el.innerHTML='<div class="cc-nz-box" role="dialog" aria-modal="true">'+
    '<button type="button" class="cc-nz-x" onclick="ccNewsZoomClose()" aria-label="Close">×</button>'+
    '<div class="cc-nz-art'+(art && art.kind!=='art' ? ' face' : '')+'"'+(art ? ' style="--card-art:url('+art.src+')"' : '')+'>'+
      (list.length>1 ? '<button type="button" class="cc-nz-nav prev" onclick="ccNewsZoom('+(CC_NZ_I-1)+')" aria-label="Prev">‹</button>'+
                       '<button type="button" class="cc-nz-nav next" onclick="ccNewsZoom('+(CC_NZ_I+1)+')" aria-label="Next">›</button>' : '')+
      '<em>'+esc(cat || '')+'</em></div>'+
    '<div class="cc-nz-body"><div class="cc-nz-meta">'+(av ? '<span class="cc-nz-av">'+av+'</span>' : '')+
      '<span><b>'+esc((who && (who.name || who.handle)) || '')+'</b><i>'+esc(day)+'</i></span></div>'+
      '<p class="cc-nz-t">'+esc(txt)+'</p>'+shot+
      (list.length>1 ? '<div class="cc-nz-ths">'+thumbs+'</div>' : '')+
      '<button type="button" class="cc-nz-feed" onclick="ccNewsZoomClose();careerOpenFeed()">'+esc(T.ccNewsHub||'Feed')+' ›</button></div></div>';
  el.style.display='flex';
}
function ccNewsZoomKey(e){
  const el=document.getElementById('ccNz'); if(!el || el.style.display==='none') return;
  if(e.key==='Escape') ccNewsZoomClose();
  else if(e.key==='ArrowRight') ccNewsZoom(CC_NZ_I+1);
  else if(e.key==='ArrowLeft') ccNewsZoom(CC_NZ_I-1);
}
function ccNewsZoomClose(){ const el=document.getElementById('ccNz'); if(el) el.style.display='none'; }
function ccLobbyNewsCardHTML(){
  const list=((CAREER.career && CAREER.career.news)||[]).slice(0, 5);
  if(!list.length) return '';
  const T=L();
  const slides=list.map((n, i)=>{
    let art=null; try{ art=ccNewsArtOf(n); }catch(e){}
    let txt=''; try{ txt=ccText(n); }catch(e){}
    let cat=''; try{ cat=T['ccNewsCat'+ccNewsCat(n)]||''; }catch(e){}
    return '<div class="cc-lb-slide'+(i===0 ? ' on' : '')+'"'+(art ? ' style="--card-art:url('+art.src+')"' : '')+'>'+
      '<em>'+esc(cat)+(cat ? ' · ' : '')+ccStamp(n)+'</em><b>'+esc(txt)+'</b></div>';
  }).join('');
  clearInterval(CC_LB_NEWS_T);
  if(list.length>1) CC_LB_NEWS_T=setInterval(()=>{
    const box=document.querySelector('.cc-lb-newsc');
    if(!box){ clearInterval(CC_LB_NEWS_T); return; }
    const sl=[...box.querySelectorAll('.cc-lb-slide')], dots=[...box.querySelectorAll('.cc-lb-dots s')];
    const k=sl.findIndex(x=>x.classList.contains('on')), nx=(k+1)%sl.length;
    sl.forEach((x, i)=>x.classList.toggle('on', i===nx)); dots.forEach((x, i)=>x.classList.toggle('on', i===nx));
  }, 6000);
  return '<div class="cc-lb-news cc-lb-card cc-lb-newsc" onclick="ccNewsZoomFromCard()" title="'+esc(T.ccNewsHub||'')+'">'+slides+
    '<i class="cc-lb-dots">'+list.map((n, i)=>'<s'+(i===0 ? ' class="on"' : '')+'></s>').join('')+'</i></div>';
}
/* Колонка с капом не листается (его «листается кап всё равно»): если карточке вечера мало места (высадка, отборы,
   эфир), меню само становится выше ровно на нехватку. На телефоне колонки и так идут столбиком. */
/* НАРИСОВАННЫЕ ПОДИУМЫ (Notion «19.10», скрин 25: «видно, где игроки должны стоять, тут даже нарисованы»).
   На трёх фонах (s11, s27, s33) четыре подиума уже есть в картинке, и свои CSS-подиумы стояли мимо них. Для этих фонов
   фигуры ставятся по координатам подиумов в картинке (центр диска и его ширина, в пикселях кадра 1280 по ширине),
   пересчитанным под то, как фон лёг в меню (cover, по центру, низом к низу), а свои подиумы прячутся.
   Порядок мест — как у cc-lb-s0…s3: свой впереди, слева, справа, дальний справа. */
const CC_LB_PADS={
  s11:{h:677, p:[[640,656,255],[476,602,210],[790,597,190],[927,575,180]]},
  s27:{h:720, p:[[640,636,250],[475,580,200],[783,573,195],[927,553,180]]},
  s33:{h:720, p:[[640,636,255],[475,578,200],[785,573,197],[925,553,180]]}
};
function ccLobbyPads(lb){
  const m=/s(\d\d)\.webp/.exec(lb.style.getPropertyValue('--lb-bg')||getComputedStyle(lb).getPropertyValue('--lb-bg')||''); const pad=m && CC_LB_PADS['s'+m[1]];
  const stage=lb.querySelector('.cc-lb-stage'); if(!stage) return;
  const els=[...stage.children];
  lb.classList.toggle('cc-lb-painted', !!pad);
  if(!pad || innerWidth<=700){ els.forEach(e=>{ e.style.left=''; e.style.bottom=''; e.style.height=''; e.style.top=''; }); return; }
  const W=lb.clientWidth, H=lb.clientHeight, k=Math.max(W/1280, H/pad.h), offX=(W-1280*k)/2, offY=H-pad.h*k;
  const sr=stage.getBoundingClientRect(), lr=lb.getBoundingClientRect(), sTop=sr.top-lr.top, sH=sr.height;
  // Низ полосы недель в координатах сцены: на широком окне фон крупнее, фигура по диску растёт и вместе с ником
  // уходила под полосу (скрин 34 «ник не видно», s33). Фигура с ником (+6% сверху и строка ника) не выше полосы.
  const bar=lb.querySelector('.cc-lb-bottom'), barY=bar ? bar.getBoundingClientRect().bottom-sr.top : -1e9;
  pad.p.forEach(([x, y, w], i)=>{
    const cx=offX+x*k, cy=offY+y*k-sTop, dw=w*k;
    stage.querySelectorAll('.cc-lb-s'+i).forEach(e=>{
      e.style.left=cx+'px';
      if(e.classList.contains('cc-lb-fig')){
        const foot=cy+dw*0.07, h=Math.max(120, Math.min(dw*(i===0 ? 1.55 : 1.6), (foot-barY-30)/1.06));
        e.style.height=h+'px'; e.style.bottom=(sH-foot)+'px';
      }
      else if(e.classList.contains('cc-lb-plus')){ e.style.bottom=(sH-cy+dw*0.55)+'px'; }
    });
  });
}
/* Notion 21.10 («когда кликаешь что-либо и потом возвращаешься вот такое»): фигуры стояли мимо дисков. Диски
   считались по высоте меню ДО того, как меню вытягивалось под колонку, а фон растягивается по новой высоте — диски
   уезжали, фигуры оставались. Теперь сначала высота, потом диски; и колонка, доросшая позже (аватарки, перерисовка),
   пересчитывает всё заново (ResizeObserver, один на меню). */
function ccLobbyFit(){
  const lb=document.querySelector('.cc-lobby.cc-lb-full');
  /* Скрины 8–9 той же страницы: вопрос «Asked after the match» встаёт в правую колонку над карточкой вечера уже после
     подгонки — меню оставалось 920 px, низ колонки («Play live») срезан, фигуры висят над дисками. Следим и за
     размером того, что в колонках, и за новыми узлами в них. */
  if(lb && !lb.__fitRO && typeof ResizeObserver!=='undefined'){
    const again=()=>{ clearTimeout(window.__ccLbFitT); window.__ccLbFitT=setTimeout(ccLobbyFit, 120); };
    lb.__fitRO=new ResizeObserver(again);
    if(typeof MutationObserver!=='undefined'){ lb.__fitMO=new MutationObserver(again);
      lb.querySelectorAll('.cc-lb-left, .cc-lb-right').forEach(c=>lb.__fitMO.observe(c, {childList:true, subtree:true})); }
  }
  if(lb && lb.__fitRO) lb.querySelectorAll('.cc-lb-left, .cc-lb-right').forEach(c=>{ [...c.children].forEach(k=>lb.__fitRO.observe(k)); });
  // Скрытое меню (другой экран сайта) меряется нулями — не трогаем; покажется — сработает наблюдатель.
  if(lb && !lb.getClientRects().length) return;
  try{ ccLobbyFitHeight(lb); }catch(e){}
  if(lb) try{ ccLobbyPads(lb); }catch(e){}
  if(lb && innerWidth>700) try{ ccLobbyPlatesClear(lb); }catch(e){}
}
function ccLobbyFitHeight(lb){
  /* Витрина магазина под составами — только если влезает целиком: обрезанная по краю колонки она читалась
     поломкой, а составы важнее (его слово 19.10: «чтоб все составы вмещались»). */
  if(lb) lb.querySelectorAll('.cc-lb-stack, .cc-lb-famA .cc-lb-left, .cc-lb-famB .cc-lb-left').forEach(col=>{
    const pk=col.querySelector('.cc-peek'); if(!pk) return;
    pk.style.display='';
    if(col.scrollHeight>col.clientHeight+2) pk.style.display='none';
  });
  if(!lb || innerWidth<=700) return;
  lb.style.height='';
  // Колонка с карточкой вечера: в нынешнем меню слева, в меню Глав 1–4 справа.
  const c=lb.querySelector(lb.classList.contains('cc-lb-famC') ? '.cc-lb-left' : '.cc-lb-right');
  /* Растёт под колонку только до высоты окна: дальше колонка листается сама, а меню со скинами целиком на экране. */
  if(c){ c.classList.remove('cc-lb-colscroll'); const extra=c.scrollHeight-c.clientHeight;
    if(extra>0){ const cap=Math.max(640, innerHeight-12), want=lb.offsetHeight+extra+6;
      lb.style.height=Math.min(want, Math.max(cap, lb.offsetHeight))+'px';
      if(want>cap) c.classList.add('cc-lb-colscroll'); } }
}
/* Notion «19.10», скрин 34 («ник не видно»): в невысоком окне ник над передней фигурой уходил под полосу недель
   сверху (она лежит поверх сцены). Подпись, что залезает под полосу, опускается ниже неё, на голову фигуры. */
function ccLobbyPlatesClear(lb){
  const bar=lb.querySelector('.cc-lb-bottom'); if(!bar) return;
  const plates=[...lb.querySelectorAll('.cc-lb-plate')];
  plates.forEach(p=>{ p.style.top=''; });
  const limit=bar.getBoundingClientRect().bottom+6;
  plates.forEach(p=>{
    const over=limit-p.getBoundingClientRect().top;
    if(over>0) p.style.top=(p.offsetTop+over)+'px';
  });
}
window.addEventListener('resize', ()=>{ clearTimeout(window.__ccLbFitT); window.__ccLbFitT=setTimeout(ccLobbyFit, 200); });
function ccLobbySeasonName(day){
  let n=0, ch=null; try{ n=ccSeasonNumOn(day)||0; ch=ccChapterOf(n); }catch(e){}
  if(!ch) return {a:'SEASON', c:'', s:'SEASON'};
  if(ch.c===1) return {a:'SEASON '+(ch.s===10 ? 'X' : ch.s), c:'CHAPTER 1', s:'SEASON '+(ch.s===10 ? 'X' : ch.s)};
  const s=ch.name ? String(ch.name).toUpperCase() : 'SEASON '+ch.s;
  return {a:'CHAPTER '+ch.c+' · '+s, c:'CHAPTER '+(ch.c||''), s:s};
}
function ccLobbyWeek(){
  try{ return L().chWeek+' '+careerWeek()+'/'+ccYearWeeks(); }catch(e){ return ''; }
}
// Задания (цель клуба, месяца, своя) — как «Daily Challenges» / «Quests» той главы.
function ccLobbyQuestsHTML(h){
  const T=L(), q=[];
  try{
    const org=CAREER.org;
    if(org && !org.own && org.goal) q.push([careerOrgGoalText(org.goal), careerOrgGoalMet()]);
    const mg=careerMonthGoal(); if(mg) q.push([careerMonthGoalText(mg), careerMonthGoalMet()]);
    const g=ccLife().goal; if(g && !g.done) q.push([ccAttrFull(g.k)+' → '+g.to, false]);
  }catch(e){}
  return '<div class="cc-lb-panel cc-lb-qs" onclick="careerTab(\'train\')">'+(h ? '<h5>'+esc(h)+'</h5>' : '<h5>'+esc(T.hgTitle)+'</h5>')+
    (q.length ? q.slice(0, 3).map(([t, ok])=>'<div class="cc-lb-q'+(ok ? ' ok' : '')+'"><i>'+(ok ? '✓' : '')+'</i>'+esc(t)+'</div>').join('')
      : '<div class="cc-lb-sub">'+esc(T.hgSet)+'</div>')+'</div>';
}
/* Фон лобби — настоящий фон главного меню того сезона (Fortnite Wiki, «Lobby Background», 1280 px, art/lobby/sNN.webp):
   Season 7 … Глава 7 Сезон 3, по номеру сезона дня (ccSeasonNumOn). Раньше 7-го — 7-й, позже 41-го — 41-й. */
function ccLobbyBg(day){
  let n=0; try{ n=ccSeasonNumOn(day)||0; }catch(e){}
  n=Math.max(7, Math.min(41, n||41));
  return 'art/lobby/s'+String(n).padStart(2, '0')+'.webp';
}
function ccLobbyTopHTML(fam, note){
  // Вкладки — те же, что у хаба (#screen-career-hub .ch-tabs): все, со своими метками; скрытые хабом не показываются.
  const hub=[...document.querySelectorAll('#screen-career-hub .ch-tabs .ch-tab')].filter(b=>b.dataset.tab && !b.hidden && b.style.display!=='none');
  const tabs=hub.length ? hub.map(b=>[b.dataset.tab, b.innerHTML]) : [['centre', esc(L().chTabCentre)]];
  const party='<span class="cc-lb-partyc" onclick="careerTab(\'me\')">👥 '+(1+((careerMates()||[]).filter(Boolean).length))+'</span>';
  const icons=fam==='C' ? '<button class="cc-lb-ico" onclick="careerTab(\'hist\')">▦</button><button class="cc-lb-ico" onclick="careerTab(\'table\')">⌕</button>' : '';
  return '<div class="cc-lb-top">'+(fam!=='C' ? party : '')+'<nav class="cc-lb-nav">'+icons+tabs.map(([k, html])=>
      '<button class="'+(k==='centre' ? 'on' : '')+'" onclick="careerTab(\''+k+'\')">'+html+'</button>').join('')+'</nav>'+(note ? '<div class="cc-lb-note">'+note+'</div>' : '')+
    '<div class="cc-lb-wallet"><span onclick="ccFnShopOpen()"><i class="cc-vb-ic"></i>'+ccNum(CAREER.vb||0)+'</span>'+
    '<span onclick="careerTab(\'shop\')">'+ccMoney(CAREER.career.balance||0)+'</span></div></div>';
}
function careerCentreHTML(card, a){
  const cr=CAREER.career, pl=CAREER.player;
  const next=careerNext();
  // The week the player is in, a day to a cell, Monday on the left.
  //
  // The proportions are the reference's: the day of the month is the big number
  // and everything else is small around it. That is the right way round for a
  // strip whose job is "which day is this happening on" — the old cells put the
  // kind of event in 19px and the date in 9px, which answered the question the
  // panel below already answers and buried the one only this row can.
  //
  // The days come from the same map the calendar draws from, so a cell says
  // whatever that date actually carries and no schedule is written twice.
  const dayEvents=careerEvents();
  const KIND_WORD={cup:L().chWkCup, final:L().calWeeklyFinal, eval:L().calPerfEval,
                   victory:ccWkVictoryWord(),
                   major:ccWkMajorWord(), gc:L().chWkGC, reload:L().chWkReload};
  // The pip under the number, standing in for the reference's icon per fixture.
  // A colour is enough to tell a cup night from a Reload night at a glance, and
  // the word beside it says which for anyone who is not going by colour — the
  // pip is never the only thing carrying it.
  //
  // The colour is a class rather than an inline style so the highlighted cell
  // can take it back: that cell is already the accent, and a teal pip on a teal
  // background is a pip nobody can see.
  // The teal used to mark the week you are standing in. Every cell is now that
  // week, so it marks the next thing you will actually play instead — which is
  // the day the button below leads to.
  const monday=careerMonday(careerToday());
  const firstBusy=[0,1,2,3,4,5,6].find(d=>(dayEvents.get(ccAddDays(monday,d))||[]).length);
  const strip=[0,1,2,3,4,5,6].map(d=>{
    const iso=ccAddDays(monday, d);
    const when=new Date(iso+'T00:00:00Z');
    const on=dayEvents.get(iso)||[];
    /* The day you are standing in, said on the strip itself.

       The ring already on this strip marks the next thing you will play, which
       is a different question — and the only place that said what today IS was
       the small date in the corner. A player wrote it up, 20 August: "почти не
       понятно какой сегодня день... надо всматриваться слева в маленький
       текст". So today's cell carries the word, and the styling below makes it
       the loudest thing on the row. */
    const today=iso===careerToday();
    const head=`<em>${L().calDows[d]}${today?' · '+L().chToday:''}</em><b>${when.getUTCDate()}</b>`;
    const cls=(today?' ch-today':'');
    // A free day says it once. The line under it is where what you decided to
    // do with the day will go, and until there is something to decide it stays
    // empty rather than repeating the headline in smaller type.
    if(!on.length)
      return `<div class="ch-week ch-day ch-day-free${cls}">${head}`+
             `<span class="ch-day-what">${L().chDayFree}</span></div>`;
    // A day can carry more than one thing — a divisional cup window and a
    // Reload session land on the same evening more than once in a season — so
    // the first is named and the rest are counted rather than dropped.
    const more=on.length>1 ? ` +${on.length-1}` : '';
    /* Строка под словом говорит то, чего в самом слове нет.

       Его снимок, 26 августа: пятница читается «Reload / Reload — кап 2,
       отборы», а суббота — «Финал недели / Финал недели». У финала недели имя
       события и есть его вид, и клетка повторяла себя вслух. Правило тут уже
       было записано выше, для пустого дня: заголовок не переписывается мелким
       шрифтом. Счётчик остальных событий дня при этом остаётся — он несёт своё. */
    // World Cup 2019 (недели Online Open и финал в Нью-Йорке) — не FNCS (его скрин 29.09: «это же не фнкс»).
    const word=(on[0].kind==='major' && /^Major[12]_2019_/.test(String(on[0].id||''))) ? 'World Cup'
             : (KIND_WORD[on[0].kind]||L().chWkCup);
    const sub=String(on[0].label||'')===word ? '' : on[0].label;
    /* День турнира несёт арт своего события (CAREER_EV_ART по виду) фоном
       клетки, а ближайший к игре — лаймовую пилюлю «Next up», как первая
       карточка Compete в лобби. Его «давай» на 3-й пункт, 30 августа. */
    const dayArt=(typeof ccEventArt==='function' ? ccEventArt(on[0]) : '') || '';
    const artAttr=dayArt ? ` style="--day-art:url(${dayArt})"` : '';
    const nextAttr=d===firstBusy ? ` data-next="${esc(L().chNext)}"` : '';
    return `<div class="ch-week ch-day${dayArt?' ch-day-art':''}${d===firstBusy?' now':''}${cls}"${artAttr}${nextAttr}>${head}`+
           `<span class="ch-day-what"><i class="ch-pip ch-pip-${on[0].kind||'cup'}">${ccKindIconSVG(on[0].kind)}</i>`+
           `${word}</span>`+
           `<span class="ch-day-sub">${sub}${more}</span></div>`;
  }).join('');
  // The month the week sits in, the way the reference puts it at the right of
  // the bar. A week that straddles two of them says both rather than picking
  // the one its Monday happens to fall in.
  const wkFrom=new Date(monday+'T00:00:00Z'), wkTo=new Date(ccAddDays(monday,6)+'T00:00:00Z');
  const months=L().calMonths[wkFrom.getUTCMonth()] +
    (wkTo.getUTCMonth()!==wkFrom.getUTCMonth() ? ' — '+L().calMonths[wkTo.getUTCMonth()] : '');
  const stripWhen=`${months} ${ccShowYear(wkTo.getUTCFullYear())} · ${L().chWeek} ${careerWeek()}`;

  // The season above the week: one square a week, the whole thing at a glance.
  //
  // The day row says what this week holds and nothing about where the week
  // sits, so a player could read the hub all season and never see the shape of
  // it — which weeks are cups, where the Majors fall, how much is left. That is
  // the one question a row of days structurally cannot answer.
  //
  // A square takes the colour of what that week is about *for this career*,
  // which is not the same as which event is the biggest in the world. The
  // divisional cup outranks a Reload session here: the cup is what the player
  // enters every week, and Reload is a circuit running past them until they are
  // good enough to be in it.
  //
  // Ranked the other way round the season came out almost entirely orange —
  // Reload's opens, play-ins and heats touch most of the early weeks — and the
  // ladder, the one thing the row exists to show running, disappeared under it.
  //
  // Weeks already played are dimmed rather than removed: how far in you are is
  // the other half of what this row is for.
  const KIND_RANK=CC_KIND_RANK;
  const here=careerWeek();
  const seasonBar=[];
  const dows=L().calDows;
  let peekRuns=null;
  let barSsn=null;
  for(let w=1; w<=ccYearWeeks(); w++){
    // Смена фортнайтовского сезона — подпись перед квадратиком его первой
    // недели. См. CSS у .ch-ssn.
    const ssn=careerFncsSeason(careerWeekStart(w));
    if(ssn && ssn.id!==barSsn){
      barSsn=ssn.id;
      seasonBar.push(`<span class="ch-ssn" title="${esc(ssn.id+' — '+ccDayLabel(ssn.from))}">${esc(ssn.id)}</span>`);
    }
    const kinds=new Set();
    for(let d=0; d<7; d++)
      (dayEvents.get(ccAddDays(careerWeekStart(w), d))||[]).forEach(x=>kinds.add(x.kind));
    const top=KIND_RANK.find(k=>kinds.has(k));
    const state=w<here ? ' done' : (w===here ? ' now' : '');
    /* Все капы недели на её квадратике — его пункт 2 со страницы «ы»,
       22 августа. Подпись говорила только главное («Неделя N — Мейджор»), и
       мейджорская неделя молчала про кубок, который в ней тоже играется.
       Теперь строка на событие: дни и название; сессии одного турнира,
       идущие подряд, складываются в диапазон («Пн–Вт — Кубок»). Наведение
       обводит квадратик, клик открывает превью недели под полосой —
       careerWeekPeek. */
    const runs=[];
    let run=null;
    for(let d=0; d<7; d++){
      (dayEvents.get(ccAddDays(careerWeekStart(w), d))||[]).forEach(x=>{
        // Кубку — имя кубка: его дни подписаны «Session 1/2», и без замены
        // строки не склеиваются и не говорят, что это за турнир.
        const lbl = x.kind==='cup'
          ? L().chEvCup.replace('{N}', String(cr.division)) : x.label;
        if(run && run.label===lbl && run.to===d-1){ run.to=d; return; }
        if(run) runs.push(run);
        run={label:lbl, from:d, to:d, kind:x.kind};
      });
    }
    if(run) runs.push(run);
    if(w===CH_WEEK_PEEK) peekRuns=runs;
    const tip=runs.length
      ? runs.map(r=>(r.from===r.to ? dows[r.from] : dows[r.from]+'–'+dows[r.to])+' — '+r.label).join('\n')
      : L().chDayFree;
    seasonBar.push(`<i class="ch-sq${top?' ch-pip-'+top:' ch-sq-empty'}${state}`+
                   `${w===CH_WEEK_PEEK?' peeked':''}"`+
                   ` onclick="careerWeekPeek(${w})"`+
                   ` title="${esc(L().chWeek+' '+w+'\n'+tip)}">${w}</i>`);   // кнопка недели: номер, цвет вида — полоской сверху
  }
  const weekPeek = (CH_WEEK_PEEK && peekRuns) ? `<div class="ch-week-peek">
    <h5>${esc(L().chWeek)} ${CH_WEEK_PEEK}<button onclick="careerWeekPeek(null)" aria-label="close">&times;</button></h5>
    ${peekRuns.length ? peekRuns.map(r=>`<div class="wp-row">`+
        `<i class="wp-pip${r.kind?' ch-pip-'+r.kind:''}">${ccKindIconSVG(r.kind||'cup')}</i>`+
        `<span class="wp-days">${r.from===r.to ? dows[r.from] : dows[r.from]+'–'+dows[r.to]}</span>`+
        `<span>${esc(r.label)}</span></div>`).join('')
      : `<div class="wp-row">${esc(L().chDayFree)}</div>`}
  </div>` : '';

  // Same covers the calendar uses, from the same table — a cup carries the
  // season's FNCS key art because that is the picture Epic puts on it.
  const art = ccEventArt(next) || CAREER_EV_ART.cup;
  // A cup can be played; a Major cannot yet. The button says which, and a week
  // that cannot be played can still be passed, or the season stops at week five.
  // A Reload day is only yours if you came through the stage before it, so the
  // kind alone does not decide this one.
  const playable = careerCanPlay(next) && !cr.seasonOver;
  // Is the thing the button leads to happening today, or later this week? The
  // reference — Desktopкарьераы.jpg — leads with exactly that, because it is
  // what a player opening the screen asks before anything else.
  const onToday = next.day===careerToday();
  const nextWhen = next.day
    ? L().calDows[(new Date(next.day+'T00:00:00Z').getUTCDay()+6)%7]+' '+
      Number(next.day.slice(8))+' '+L().calMonthsShort[Number(next.day.slice(5,7))-1]
    : '';
  // At the boundary a career that has stopped growing can stop. The button sits
  // beside the one that starts another year rather than instead of it: going on
  // is always allowed, it is just no longer free.
  const retireBtn = (cr.seasonOver && careerMayRetire())
    ? `<button class="ch-play ch-retire" onclick="careerRetire(false)"
         title="${esc(L().ccRetireHint(careerRetireAge()))}">${L().ccRetire}</button>` : '';
  /* Церемония закрытия — кнопкой, а не сама собой (см. ccGalaOpen о том,
     почему). Стоит ПОСЛЕ «Нового сезона» в разметке намеренно: половина
     проверок жмёт первую .ch-play на экране, и вставать перед ней значило бы
     менять им дорогу. */
  const galaBtn = cr.seasonOver
    ? `<button class="ch-play ch-gala" onclick="ccGalaOpen()">${L().ccGalaWatch}</button>` : '';
  const btn = cr.seasonOver
    ? `<button class="ch-play" onclick="if(CAREER.career.seasonOver) careerNewSeason()" title="${esc(L().ccSeasonOverSub)}">${L().ccNewSeason}</button>`+galaBtn+retireBtn
    /* Командный вечер, который нельзя начать, не предлагает «Пропустить». По одиночному правилу непроходимый вечер
       (разные режимы) превращал «Играть» в «Пропустить», и следующее нажатие скипало турнир. Сам режим «только
       смотрю» матч показывает (tools/sim-shows-probe.js).
       В команде день двигает только сервер (careerAdvanceTo), пропуск бессмыслен, поэтому кнопка гаснет и называет
       причину. Чинится кнопками режима, плиткой команды или разрывом дуо. */
    /* И в гонке: разные режимы — «Играть» гаснет с причиной, а не превращается в
       «Пропустить». Скриншот: у одного вечер убежал сам. См. ccRaceModeWhy. */
    : (!playable && ccRaceModeWhy())
      ? `<button class="ch-play" disabled title="${esc(ccRaceModeWhy())}">${L().chPlay}${ccMpReadyTag()}</button>`+
        `<div class="ch-hint" style="margin:6px 0 0;color:#ff9b9b;">${esc(ccRaceModeWhy())}</div>`
    : (ccMpOn() && !playable)
      ? `<button class="ch-play" disabled title="${esc(ccMpBlockWhy()||L().chSoonHint)}">${
            L().chPlay}${ccMpReadyTag()}</button>`+
         (ccMpBlockWhy()
           ? `<div class="ch-hint" style="margin:6px 0 0;color:#ff9b9b;">${
                esc(ccMpBlockWhy())}</div>` : '')
    /* Тот же вечер, но в эфир — вторая кнопка рядом с «Играть», и только в
       день турнира. Гаснет со своей причиной: командная карьера, закрытый
       день, нет энергии. См. careerPlayLive. */
    : playable
      ? `<button class="ch-play" onclick="careerPlay()">${L().chPlay}${ccMpReadyTag()}</button>`+
        (onToday && !ccMpOn() ? (()=>{ const why=ccStreamCupWhy();
           return `<button class="ch-play ch-live-go"${why?' disabled':''} onclick="careerPlayLive()"
             title="${esc(why||L().ccStreamCupHint(CC_STREAM_CUP.energy, CC_STREAM_POW))}">${
             L().ccStreamCupGo}</button>`+
             /* Цена эфира — строкой под кнопкой, а не только во всплывающей
                подсказке: отзыв «и это должно быть написано». */
             `<div class="ch-hint ch-live-hint">${esc(why||L().ccStreamCupHint(CC_STREAM_CUP.energy, CC_STREAM_POW))}</div>`; })() : '')+
        /* Стиль игры у «Играть» снят (его скрин в Notion 8.10: «убрать стиль игры перед капом, он же есть в самом капе»):
           внутри вечера он спрашивается перед каждой игрой на любом турнире (ccStyleAskGame), второй переключатель дублировал. */
        /* «Не играть» — в день турнира (Notion 12.10: «добавите возможность не участвовать в этом турнире? Играть во
           всех — это так утомительно»). Раньше играемый вечер давал только «Играть»: пропустить его было нечем. В
           команде и в гонке день двигают вместе — там кнопки нет. */
        (onToday && !ccMpOn() && !(typeof ccRaceLock==='function' && ccRaceLock())
          ? `<button class="ch-play ch-skipev" onclick="careerSkipEventAsk()">${L().chSkipEv}</button>` : '')+
        /* Наём на турнир (ccHireOpen): нанятый — строкой с отменой, иначе кнопка. */
        /* Соло-вечер (Solo Series, FNCS Solos, соло-кап) напарника не берёт — и нанимать некого (его Notion 29.10 «на соло можно нанять»). */
        (onToday && typeof ccHireAllowed==='function' && ccHireAllowed() && careerNeedsMate(next.type)
          ? (ccHireActive()
              ? `<div class="ch-hint ch-hire-on">${esc(L().ccHireOn(ccHireList().map(x=>x.handle).join(' & '), ccMoney(ccHireList().reduce((s,x)=>s+(x.fee||0), 0))))} <button class="ch-sign" onclick="careerHireCancel()">${L().ccHireCancel}</button>${ccHireList().length<careerMateSeats() ? ` <button class="cc-back" onclick="ccHireOpen()">${L().ccHireBtn}</button>` : ''}</div>`
              : `<button class="ch-play ch-skipev" onclick="ccHireOpen()">${L().ccHireBtn}</button>`)
          : '')
      : `<button class="ch-play" onclick="careerSkipAsk()" title="${esc(
            ccRaceModeWhy() ? ccRaceModeWhy()
          /* Арена, ранг, травма, бан (ccLifeWhy) закрывают вечер в careerCanPlayKindOn, а сюда
             не доходили: кэшкап 2019–2022 без Champion League печатал «Majors are not wired
             into a career yet» (скрин: «cant play any cashcups in chapter 1/2»). */
          : ccLifeWhy(careerToday(), next.type) ? L()[ccLifeWhy(careerToday(), next.type)]
          : careerNoMate(next.type) ? (careerMatesOver()>0 ? L().ccMateOver : L().ccNoMateN(careerMatesShort()))
          : next.type==='victory'? (ccConsoleOk(careerVictoryOn(careerToday())) ? L().ccVicNoInvite : ccConsoleWhy(careerVictoryOn(careerToday())))
          : next.type==='reload' ? L().ccRelLocked
          : next.type==='final'  ? L().ccWfLocked
          : next.type==='major'  ? ccMajWhyLocked()
          : next.type==='summit' ? L().ccSumLocked
          : next.type==='globals'? L().ccGlobLocked(ccLanCity('globals'))
          : next.type==='gc'     ? (careerGclcOn(careerToday()) ? L().ccGcLocked : L().ccRcLocked)
          : next.type==='solo'   ? ccSoloWhyLocked()
          : next.type==='proam'  ? ccProAmWhyLocked()
          : next.type==='nations'? ccNatWhyLocked()
                                 : L().chSoonHint)}">${L().chSkip}</button>`+
        // И сразу до турнира, одной кнопкой — см. careerSkipToBtnHTML.
        careerSkipToBtnHTML();
  const mate = careerPartnerCard();
  const evalRow = cr.division===1
    ? `<div class="ch-row"><em>${L().chPerfEval}</em><b>$400</b></div>`
    : `<div class="ch-row"><em>${L().chPerfEval}</em><b>${L().chD1Only}</b></div>`;

  /* Всё, что было на «Центре», — в самом главном меню (Notion «19.10»: «вот эта информация должна быть расположена на
     экране»): карточка вечера с кнопками — на месте блока режима, ростер и новости — справа, полоса сезона — над
     расписанием недели. Листа «Подробнее» больше нет. */
  const lbBar=`<div class="ch-next cc-lb-next">
    <div class="ch-next-head"><h3>${L().chNext}</h3><span>${
      // Which year this is, beside when it is. A season that alternates has to
      // say which one it is on the screen a player opens first, or the extra
      // chair in the squad tile is the only clue that anything changed.
      ccSeasonWord(careerSquadSize())} · ${stripWhen}</span>${
      // The Paris seat, which the ladder tile used to carry: a thing won in
      // February that is not played until August belongs beside the calendar
      // rather than in a list of standings.
      // Места этого сезона: в прошлом году выигранное на этот Championship не
      // везёт — см. ccRelMySeats.
      ccRelMySeats(cr).length ? `<em class="ch-next-seat">${esc(L().ccEwcSeat)} · ${
        esc(L().ccEwcSeatOn(ccDayLabel(CC_RC_DAY), ccRelMySeats(cr).length))}</em>` : ''}</div>
    ${/* Полосы из 35 недель в лобби нет (27.10, «лобби как в Fortnite»): неделя — плитками дней ниже, год — во вкладке
         «Календарь». */ ''}
    ${weekPeek}
    ${/* Перемотка «неделя / месяц» — здесь, у полосы сезона, а не в карточке капа (его «сделать аккуратно где-то скип недели/месяца»). */
      careerFfButtonsHTML()}
  </div>`;
  const lbPlay=`<div class="ch-col-play cc-lb-playcol">
      ${typeof ccRosterSoonHTML==='function' ? ccRosterSoonHTML() : ''}
      ${typeof ccMapPickHTML==='function' ? ccMapPickHTML() : ''}
      ${careerMpTileHTML()}
      ${careerRaceTileHTML()}
      ${ccAwayLateHTML()}
      ${/* Закрытый старший вечер (не прошёл в Weekly Final) — кап того же дня кнопкой здесь, иначе день уходит перемоткой. */
        !cr.seasonOver && !playable && next.day===careerToday() ? ccVictoryAltsHTML() : ''}
      ${/* Командный вечер, заблокированный командной причиной, остаётся карточкой матча, а не панелью дня.
           Иначе пропадали кнопки режима, которыми и чинится расхождение режимов, а показывалась
           чужая причина из цепочки про мейджоры и релоад.
           Командные запреты (связь, дивизион, одинаковые игроки, разные режимы) глушат кнопку на карточке
           с причиной. Свободный день, незаквалившийся релоад, невыстроенный мейджор как раньше. */
        /* И в гонке то же самое: «Нажал just watching и меня просто перебросило на некст скрин»
           (скриншот) — разные режимы в комнате гонки держат карточку матча, а не день. */
        (!cr.seasonOver && (next.type==='free' || (!playable && !ccMpBlockWhy() && !ccRaceModeWhy())))
        /* Свободный день — панель дня с прокачкой прямо в главном меню (его «в каждом сезоне во время фри дня должна
           быть прокачка в главном меню»); меню само вытягивается под неё (ccLobbyFit). */
        /* День церемонии (вид 'gala') — не закрытый вечер, а свободный день; кнопка церемонии — под панелью (первая
           .ch-play на экране остаётся «К турниру»). Раньше он шёл замком с заглушкой «Majors are not wired…» (Notion «19.10», скрин 20). */
        ? careerDayPanelHTML((next.type==='free' || next.type==='gala') ? null : {label:next.label||next.title, why:
            ccRaceModeWhy() ? ccRaceModeWhy()
          : (next.type==='victory' || next.type==='eval' || next.type==='cup') && ccAwayHomeBusy(careerToday()) ? L().awBusy
          /* Арена, ранг, травма, бан (ccLifeWhy) закрывают вечер в careerCanPlayKindOn, а сюда
             не доходили: кэшкап 2019–2022 без Champion League печатал «Majors are not wired
             into a career yet» (скрин: «cant play any cashcups in chapter 1/2»). */
          : ccLifeWhy(careerToday(), next.type) ? L()[ccLifeWhy(careerToday(), next.type)]
          : careerNoMate(next.type) ? (careerMatesOver()>0 ? L().ccMateOver : L().ccNoMateN(careerMatesShort()))
          : next.type==='victory'? (ccConsoleOk(careerVictoryOn(careerToday())) ? L().ccVicNoInvite : ccConsoleWhy(careerVictoryOn(careerToday())))
          : next.type==='reload' ? L().ccRelLocked
          : next.type==='final'  ? L().ccWfLocked
          : next.type==='major'  ? ccMajWhyLocked()
          // The Summit and the Globals were in the Skip button's chain above and
          // not in this one, so the panel fell through to a placeholder from
          // before the Majors were built and told a player standing on Summit
          // day that Majors are not wired into a career yet. His report,
          // 17 August. The two chains say the same thing now.
          : next.type==='summit' ? L().ccSumLocked
          : next.type==='globals'? L().ccGlobLocked(ccLanCity('globals'))
          : next.type==='gc'     ? (careerGclcOn(careerToday()) ? L().ccGcLocked : L().ccRcLocked)
          : next.type==='solo'   ? ccSoloWhyLocked()
          : next.type==='proam'  ? ccProAmWhyLocked()
          : next.type==='nations'? ccNatWhyLocked()
                                 : L().chSoonHint})+(next.type==='gala' ? '<button class="ch-play ch-gala" onclick="ccGalaOpen()">'+L().ccGalaWatch+'</button>' : '')
        : `<div class="ch-art" style="background-image:url(${art});">
          <div class="ch-livebar">
            ${onToday ? `<b>${L().chLiveTag}</b><span>${L().chLiveNow}</span>`
                      : `<b class="ch-live-soon">${L().chLiveSoonTag}</b><span>${nextWhen}</span>`}
          </div>
          <div class="ch-art-in">
            ${playable ? `<div class="ch-matchof">${L().chMatchOf(ccNextShape(next).games)}</div>` : ''}
            <h3>${cr.seasonOver ? L().ccSeasonOver : next.title}</h3>
            ${!cr.seasonOver && (next.type==='victory' || next.day===careerToday()) ? ccVictoryAltsHTML()+ccMobPrepHTML(next) : ''}
            ${cr.seasonOver ? `<p>${L().ccSeasonOverSub}</p>`
              : playable
              ? (()=>{ const sh=ccNextShape(next);
                  // A final that cuts to nobody has nothing to advance to: it is
                  // the last room, and what it says is how many are in it.
                  return sh.cut
                    ? `<div class="ch-big"><b>${sh.cut}</b><span>${L().ccAdvanceOf(sh.of)}</span></div>`
                    : `<div class="ch-big"><b>${sh.of}</b><span>${ccSquadWordCap()}</span></div>`; })()
              : `<p>${next.sub}</p>`}
            <div class="ch-mode"><span>${[careerNightSolo(next) ? L().ccSpotSoloTab : ccSquadWordCap(),
                (ccNoDivisions() || next.type==='nations') ? '' : L().ccDivision+' '+cr.division].filter(Boolean).join(' · ')}</span></div>
            <!-- Про-Ам играется НЕ с напарником, а с контент-мейкером, и это
                 надо знать до нажатия: с кем сидишь и сколько его смотрят.
                 См. ccProAmMate и CC_PROAM_TWITCH. -->
            ${next.type==='proam' && typeof ccProAmMate==='function' ? (()=>{
                const c=ccProAmMate();
                return `<div class="ch-mode ch-mode-proam"><span>${
                  esc(L().ccProAmMateLine(c.handle, ccNum(c.followers||0)))}</span></div>`; })() : ''}
            <!-- И как он проходит — отзыв: «pro am ещё распиши
                 как работает». Все числа читаются из констант турнира. -->
            ${next.type==='proam' && typeof ccProAmHowHTML==='function' ? ccProAmHowHTML() : ''}
            <!-- Куда уже квалифицировались. Строка появляется, только когда
                 место действительно держится, — см. careerQualHTML. -->
            ${careerQualHTML()}
            ${playable ? careerNightSpotHTML(next) : ''}
            ${/* В команде строка режима нужна ИМЕННО когда играть нельзя:
                 расхождение режимов чинится ею же. Спрятать её вместе с
                 кнопкой значило бы запереть игрока без выхода. */
              (playable || ccMpOn() || ccRaceModeWhy()) ? careerSimRowHTML() : ''}
            ${btn}
          </div>
        </div>`}
      ${/* Интервью — ПОД днём, не над ним (Notion 27.10, игрок: «на тренировке спрашивает, тащил ли я команду, и мышку
           уносит вниз, и запускаются скримы»). Плитка над панелью дня появлялась после вечера и пропадала по ответу, и
           занятия прыгали на её высоту: следующий клик садился в занятие под курсором. Снизу она ничего не двигает. */
        cr.seasonOver ? '' : careerInterviewHTML()}
      ${/* Выезд в другие регионы — своим блоком под карточкой вечера (ccAwayRowHTML). */ cr.seasonOver ? '' : ccAwayHTML()}
      ${(typeof ccNatSquadHTML==='function') ? ccNatSquadHTML() : ''}
      <!-- At the boundary the shop is shut and the year is the thing worth
           reading: where this career finished at its Grand Finals and its LANs.
           His report, 20 August. See careerSeasonBoardHTML. -->
      ${cr.seasonOver ? careerSeasonAwardHTML()+careerSeasonCatsHTML()+careerSeasonBoardHTML() : ''}
  </div>`;
  const lbSide=`
      <!-- The ladder tile stood here and is gone, his call, 18 August: division,
           rating, awards, the evaluation and the prize money all say themselves
           somewhere else now — the strip at the top, the bio, the money screen.
           What only it carried has moved rather than been deleted: form,
           reputation and burnout to the strip beside the energy, because they
           are today's condition; the promotion cut into the day panel; the
           Paris seat into the week bar. Deleting them outright would have put
           back exactly the thing this file spent a night removing — a number
           that moves for a reason nothing on screen names. -->
      <!-- The two deals a career is on, side by side: the man who does the
           talking on the left, the club he talked to on the right. His layout,
           17 August. Below them the two people a career plays with. -->
      <!-- The tournament first, the contracts under it: what a career does this
           week outranks what it signed last month. See careerNextCardHTML. -->
      <!-- The profile leads the centre and the tournament card sits with the
           career, his call, 18 August: the two swapped places. -->
      <!-- Как на проде: профиль, под ним новости. Цели и развитие — во вкладке «Тренировка». -->
      ${(typeof ccPressHTML==='function') ? ccPressHTML() : ''}
      ${/* Справа — только составы (27.10, «лобби как в Fortnite»): витрина магазина снята, магазин — своей вкладкой;
           сборная — за три недели до своего этапа (ccRostersStripHTML(true)). Пресс-конференция остаётся: это вопрос. */
        careerProfileTileHTML(true)}`;
  return ccLobbyHTML(card, btn, next, nextWhen, strip, {bar:lbBar, play:lbPlay, side:lbSide, note:careerNoteBarHTML()});
}

/* The coach is the player's own, not the duo's — he works with you, and your
   partner has one of his own somewhere. So he stands in his own tile beside the
   duo rather than inside it. All three are on screen at once rather than behind
   a picker, because the choice is the point: what this career is trying to
   become. The hired one is marked, the rest carry their fee, and one that
   cannot be afforded says so by being unpressable rather than by hiding. */
function careerCoachColHTML(){
  const cr=CAREER.career, working=ccCoach();
  const paid=ccOrgPaysCoach();
  /* A shelf rather than three buttons, his call of 18 August: the same rows the
     shop is built from, because hiring a coach is the same gesture as buying a
     desk — a face, what he is for, what he costs, and one press.

     All of them rather than a shortlist of three. The three-up strip was a
     picker when there were three archetypes; with twelve named people the point
     is that you choose, and a choice you cannot see is not one. The one you have
     hired reads as owned, the same way a rig on the desk does. */
  /* The tile is the man you hired, and the twelve live behind a press.

     His call, 18 August: a window to choose in, and afterwards one face — the
     one you picked. Twelve rows standing open is a catalogue, and a catalogue is
     the right shape for the moment you are choosing and the wrong one for the
     rest of the season, when the only thing you want to know is who is working
     with you and until when. */
  if(working){
    const what=working.keys.length>=ATTR_KEYS.length ? L().ccCoachAll
             : working.keys.map(k=>L()[ATTR_LABEL[k]]).join(' · ');
    return `<div class="ch-tile ch-tile-coach">
      <h4>${L().ccCoachTitle}</h4>
      <div class="ch-orghead">${working.photo
        ? `<img class="ch-coach-av" src="${PHOTO_DIR}${esc(working.photo)}" alt="" onerror="this.remove()">` : ''}
        <b>${esc(working.name)}</b>${working.at?`<em class="ch-agent-at">@${esc(working.at)}</em>`:''}</div>
      <div class="ch-row"><em>${L().ccCoachFor}</em><b>${what}</b></div>
      <div class="ch-row"><em>${L().ccShopTrain}</em><b class="ch-goal-met">+${
        Math.round(working.train*100)}%</b></div>
      <div class="ch-row"><em>${L().ccWage}</em><b>$${
        ccNum(working.cost)}${L().ccPerSeason}</b></div>
      ${working.chem ? `<div class="ch-row"><em>${L().ccChem}</em><b class="ch-goal-met">+${
        working.chem}</b></div>` : ''}
      <div class="ch-row"><em>${L().ccCoachUntil}</em><b>${ccDayLabel(CAREER.coach.until)}</b></div>
      <button class="ch-swap" onclick="ccCoachPickOpen()">${L().ccCoachChange}</button>
    </div>`;
  }
  return `<div class="ch-tile ch-tile-coach">
    <h4>${L().ccCoachTitle}</h4>
    <div class="ch-hint">${L().ccCoachHint}</div>
    <div class="ch-empty">${L().ccCoachNone}</div>
    <button class="ch-swap" onclick="ccCoachPickOpen()">${L().ccCoachPick}</button>
  </div>`;
}
/* The window itself: every coach, and one press hires. Built on the same modal
   the card peek uses, so it closes on the backdrop and on Escape like the rest
   of them. */
function ccCoachPickOpen(){
  const cr=CAREER.career, working=ccCoach(), paid=ccOrgPaysCoach();
  // His order too, 20 August — the same list the other three windows read, so
  // the coaches stop being the one window whose order is the file's. The
  // grouping the table keeps, heads before specialists, is still the table's.
  const rows=ccByHand(CC_COACHES).map(c=>{
    const on=!!working && working.id===c.id;
    const can=!on && (paid || (cr.balance||0)>=c.cost);
    const what=c.keys.length>=ATTR_KEYS.length ? L().ccCoachAll
             : c.keys.map(k=>L()[ATTR_LABEL[k]]).join(' · ');
    return `<div class="cc-buy${on?' own':''}">
      ${c.photo ? `<img class="cc-buy-img cc-buy-face" src="${PHOTO_DIR}${esc(c.photo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <!-- The shop's own three lines: the name, a grey line saying what the
           thing is, and a green line saying what it does to a career, in the
           words the shop already uses for it. A coach is a purchase like the
           desk is, so it reads like one. -->
      <div class="cc-buy-in"><b><span class="cc-buy-nm">${esc(c.name)}</span> ${ccStaffBadge(c.rating||ccCoachRatingOf(c)).replace('cc-staff-rt', 'cc-staff-rt mgf-rt')}</b>
        <i class="cc-buy-who">${CC_COACH_X[c.at] ? '👥 '+ccFollowers(CC_COACH_X[c.at])+' · ' : ''}${c.at?'@'+esc(c.at):''}</i>
        <span class="cc-buy-chips"><em class="up">${L().ccShopTrain} +${Math.round(c.train*100)}%</em>${
          c.chem ? '<em class="up">'+L().ccCoachChem(c.chem)+'</em>' : ''}<em>${what}</em></span></div>
      ${on ? `<span class="cc-owned">${L().ccShopUntil(ccDayLabel(CAREER.coach.until))}</span>`
           : ccHireBtns(can, paid ? 0 : c.cost, "ccCoachPickTake('"+c.id+"')", "ccCoachPickTake('"+c.id+"',12)", paid ? L().ccOrgPays(esc(CAREER.org.name)) : null)}
    </div>`;
  }).join('');
  document.getElementById('coachPickBody').innerHTML=
    `<h4 class="cc-pick-h">${L().ccCoachTitle}</h4>
     <div class="ch-hint">${L().ccCoachHint} · ${L().ccShopMonth}</div>
     <div class="cc-buys">${rows}</div>`;
  document.getElementById('coachPickModal').style.display='flex';
  document.addEventListener('keydown', ccCoachPickKey);
}
function ccCoachPickClose(){
  const m=document.getElementById('coachPickModal');
  if(m) m.style.display='none';
  document.removeEventListener('keydown', ccCoachPickKey);
}
// Escape closes it, the way every other window here does.
function ccCoachPickKey(e){ if(e.key==='Escape') ccCoachPickClose(); }
// Hire from inside the window: the deal is done, the window is finished with.
function ccCoachPickTake(id, months){
  if(careerHireCoach(id, months)) ccCoachPickClose();
  else ccCoachPickOpen();
}

/* The sponsor tile: what the audience is worth, and what it would take to be
   worth more. It says the next tier's number when there is nothing on the
   table, because a follower count with no scale beside it is not information —
   the whole point of a stream day is knowing what it is buying. */
function careerMktTileHTML(){
  const on=ccMkt(), have=ccSponsor(), offer=ccSponsorOffer();
  const reach=careerReach();
  const next=CC_SPONSORS.find(s=>reach<s.need);
  const head=on
    ? `<div class="ch-orghead">${on.photo
        ? `<img class="ch-coach-av" src="${PHOTO_DIR}${esc(on.photo)}" alt="" onerror="this.remove()">` : ''}
        <b>${esc(on.name)}</b>${on.at?`<em class="ch-agent-at">@${esc(on.at)}</em>`:''}</div>
       <div class="ch-row"><em>${L().ccMktRate}</em><b class="ch-goal-met">+${
         Math.round(((on.rate||1)-1)*100)}%</b></div>
       <div class="ch-row"><em>${L().ccCoachUntil}</em><b>${ccDayLabel(on.until)}</b></div>`
    : `<div class="ch-hint">${L().ccMktHint}</div>
       <div class="ch-empty">${L().ccMktNone}</div>`;
  return `<div class="ch-tile">
    <h4>${L().ccMkt}</h4>
    <div class="ch-row"><em>${L().xFollowers}</em><b>${ccFollowers(reach)}</b></div>
    ${head}
    ${have ? `<div class="ch-row"><em>${L().ccSponsorDeal}</em><b>${ccBrandLogo(have.id)}${L()['ccSponsor'+have.id]}</b></div>`+
             `<div class="ch-row"><em>${L().ccWage}</em><b>$${
               ccNum(have.pay)}${L().ccPerStream}</b></div>`+
             `<div class="ch-row"><em>${L().ccPaid}</em><b>$${
               ccNum((CAREER.sponsor.paid||0))}</b></div>`
          : on ? `<div class="ch-empty">${L().ccSponsorNone}</div>` : ''}
    ${offer ? `<div class="ch-offer">
        <div class="ch-offer-terms"><span>${ccMoney(offer.pay)}${L().ccPerStream}</span>
          <span>${ccBrandLogo(offer.id)}${L()['ccSponsor'+offer.id]}</span></div>
        <button class="ch-sign" onclick="careerSignSponsor(\'${offer.id}\')">${L().ccSign}</button>
      </div>`
      : on && next ? `<div class="ch-hint" style="margin:6px 0 0;">${
          L().ccSponsorNext(ccFollowers(next.need), ccBrandLogo(next.id, 13)+L()['ccSponsor'+next.id])}</div>` : ''}
    <button class="ch-swap" onclick="${on ? 'careerEndMkt()' : 'ccMktPickOpen()'}">${
      on ? L().ccAgentEnd : L().ccMktSee}</button>
  </div>`;
}
/* СПОНСОРЫ В КАРЬЕРЕ — НАСТОЯЩИЕ, С ЛОГОТИПАМИ (его слово 8.10: «и тогда в карьеру игрока добавь настоящих спонсоров»).
   После «Штаба» текущий спонсор и предложения пропали с экрана — они жили в старой плитке маркетинга. Теперь отдельный
   блок на «Клубе»: текущий спонсор (логотип, за эфир, выплачено) и вся линейка брендов: с какого числа подписчиков
   открывается, сколько платил бы сейчас, подписан / подписать / закрыт. Предложение по-прежнему приносит маркетолог. */
function careerSponsorsHTML(){
  const T=L(), all=ccSponsorsAll(), offer=ccSponsorOffer(), reach=careerReach(), mkt=ccMkt(), slots=ccSpSlots(), next=ccSpNextSlotAt();
  const logo=id=>'<span class="cc-spb-logo"><img src="'+PHOTO_DIR+'sp_'+(CC_SPONSOR_LOGO[id]||'x')+'.png" alt="" loading="lazy" onerror="this.remove()"></span>';
  const free=all.length<slots;
  const cur=all.map(x=>'<div class="cc-spb-cur">'+logo(x.id)+'<span class="cc-spb-in"><b>'+esc(T['ccSponsor'+x.id]||x.id)+'</b><small>'+ccMoney(x.pay)+T.ccPerStream+' · '+esc(T.ccPaid)+' '+ccMoney(x.paid||0)+'</small></span>'+
      (ccSpPostWait(x) ? '<small class="cc-spb-note">'+esc(T.ccSpPostWaitT(ccSpPostWait(x)))+'</small>' : '<button class="ch-sign cc-sp-post" onclick="careerSponsorPost(\''+x.id+'\')">'+esc(T.ccSpPostBtn(ccMoney(ccSpPostPay(x))))+'</button>')+
      '<button class="cc-staff-end" onclick="careerDropSponsor(\''+x.id+'\')">'+esc(T.ccSpbDrop)+'</button></div>').join('')+
    (free ? '<div class="cc-spb-free">＋ '+esc(T.ccSpbFree(slots-all.length))+'</div>' : '')+
    (next ? '<div class="cc-spb-free lock">🔒 '+esc(T.ccSpbNextSlot(ccFollowers(next)))+'</div>' : '');
  const left=CC_SPONSORS.filter(b=>!all.some(x=>x.id===b.id));
  const rows=left.filter(b=>reach>=b.need).reverse().concat(left.filter(b=>reach<b.need)).map(b=>{
    const open=reach>=b.need, pay=open ? ccSponsorPayNow(b) : Math.round(ccSponsorRate(b, b.need)*(mkt ? (mkt.rate||1) : CC_SP_NOMKT));
    const canSign=open && (free || (offer && offer.id===b.id && offer.replaces));
    return '<div class="cc-spb-row'+(open ? '' : ' lock')+'">'+logo(b.id)+'<span class="cc-spb-in"><b>'+esc(T['ccSponsor'+b.id]||b.id)+'</b><small>'+
      esc(T.ccSpbFrom(ccFollowers(b.need)))+' · ≈'+ccMoney(pay)+T.ccPerStream+'</small></span>'+
      (canSign ? '<button class="ch-sign" onclick="careerSignSponsor(\''+b.id+'\')">'+esc(free ? T.ccSign : T.ccSpbSwap)+'</button>'
        : open ? '<small class="cc-spb-note">'+esc(T.ccSpbFull)+'</small>'
        : '<small class="cc-spb-note lock">🔒</small>')+'</div>';
  }).join('');
  return '<section class="cc-staff-wrap cc-sp-modal" id="ccSpBlock"><h3 class="cc-sect-h">'+esc(T.ccSpbTitle||T.ccSponsorTitle)+' · '+all.length+'/'+slots+' · '+ccFollowers(reach)+'</h3>'+
    '<div class="ch-tile cc-spb"><div class="cc-spb-mine">'+cur+'</div>'+
    '<div class="cc-spb-hint">'+esc(mkt ? T.ccSpbMktOn(String((mkt.rate||1).toFixed(2))) : T.ccSpbMktOff)+'</div>'+
    '<div class="cc-spb-list">'+rows+'</div></div></section>';
}
function careerSponsorTileHTML(){
  const have=ccSponsor(), offer=ccSponsorOffer();
  const reach=careerReach();
  const next=CC_SPONSORS.find(s=>reach<s.need);
  return `<div class="ch-tile">
    <h4>${L().ccSponsorTitle}</h4>
    <div class="ch-hint">${L().ccSponsorHint}</div>
    <div class="ch-row"><em>${L().xFollowers}</em><b>${ccFollowers(reach)}</b></div>
    ${have ? `<div class="ch-row"><em>${L().ccSponsorDeal}</em><b>${ccBrandLogo(have.id)}${L()['ccSponsor'+have.id]}</b></div>`+
             `<div class="ch-row"><em>${L().ccWage}</em><b>${ccMoney(have.pay)}${L().ccPerStream}</b></div>`+
             `<div class="ch-row"><em>${L().ccPaid}</em><b>${ccMoney(CAREER.sponsor.paid||0)}</b></div>`
          : `<div class="ch-empty">${L().ccSponsorNone}</div>`}
    ${offer ? `<div class="ch-offer">
        <div class="ch-offer-terms"><span>${ccMoney(offer.pay)}${L().ccPerStream}</span>
          <span>${ccBrandLogo(offer.id)}${L()['ccSponsor'+offer.id]}</span></div>
        <button class="ch-sign" onclick="careerSignSponsor(\'${offer.id}\')">${L().ccSign}</button>
      </div>`
      : next ? `<div class="ch-hint" style="margin:6px 0 0;">${L().ccSponsorNext(ccFollowers(next.need), L()['ccSponsor'+next.id])}</div>` : ''}
  </div>`;
}

/* The club tile has three states and they are the three states of a career:
   nobody wants you yet, somebody does, or somebody already has you. The offer
   state is the only place in this mode with a decision on it, so it gets the
   crest, the wage and what they want for it, all on one row you can say yes to. */
/* Leaving a contract on your own. Costs half of what the club would still pay you this year:
   enough to be a decision, affordable once prize money comes in. Can't pay, can't leave.
   Scene reputation drops by 2, same as a partner walking out on you. */
const CC_BUYOUT_SHARE=0.5;
function careerBuyoutCost(){
  const org=CAREER.org;
  if(!org || !org.salary) return 0;
  const pays=careerWagePaydays();
  const left=pays.filter(d=>d>careerToday()).length;
  const each=Math.round(org.salary/Math.max(1, pays.length));
  // Контракт на два сезона (29.10, его «контракты: срок, отступные»): целые сезоны после этого — тоже в отступных.
  const more=ccOrgSeasonsLeft(org)*org.salary;
  return Math.max(50, Math.round((each*left+more)*CC_BUYOUT_SHARE/50)*50);
}
/* СРОК КОНТРАКТА (29.10, его «8 надо»: срок, отступные, выкуп другим клубом). org.to — последний сезон контракта
   (номер cr.season); старые контракты без срока — годовые, как и жили. Сколько ЦЕЛЫХ сезонов осталось после текущего. */
function ccOrgSeasonsLeft(org){
  const cr=CAREER && CAREER.career;
  if(!org || org.own || !cr || org.to==null) return 0;
  return Math.max(0, org.to-(cr.season||1));
}
// Срок в оффере: академия — год; основной состав — иногда два, у топ-клубов чаще (держат вложенное).
function ccOrgTermRoll(tier, academy, rnd){
  if(academy) return 1;
  return rnd() < (tier>=88 ? 0.5 : 0.3) ? 2 : 1;
}
// Контракт идёт и после этого сезона: уйти можно только выкупом, и выкупить могут клубы заметно выше нынешнего.
const CC_ORG_POACH_STEP=3;
// Слухи о трансфере: не чаще раза в три недели и не в каждое окно (careerOrgOffers).
const CC_RUMOR_GAP=21, CC_RUMOR_ODDS=0.35;
function careerLeaveOrg(){
  const cr=CAREER.career, org=CAREER.org;
  if(!org) return false;
  const cost=careerBuyoutCost();
  if((cr.balance||0)<cost) return false;
  cr.balance-=cost;
  cr.bought=(cr.bought||0)+cost;
  CAREER.org=null;
  CAREER.offers=null;
  careerRepAdd(-2);
  careerNews('bad', 'ccNewsBoughtOut', [org.name, ccNum(cost)]);
  careerEvent('tlBoughtOut', [org.name, ccNum(cost)]);
  careerSave();
  careerRenderHub();
  return true;
}
/* The man who does the talking, in his own tile beside the club's.

   He has lived in the inbox since he was built, which is where he is signed and
   where he is let go — and nowhere on the screen did a career see what he was
   costing or buying once the thread scrolled away. His call, 17 August: manager
   on the left, club on the right, the two deals a career is on side by side.

   Signed, it prints the deal it is actually on rather than the table's — see
   careerAgentTerms, which is what an older save keeps. Unsigned, it says the
   same thing the empty club tile says: whether that is the player or the month.
   Nobody is represented below CC_AGENT_FROM, so the number is on the tile. */
/* The player's own account, at the top of the feed column.

   Written off the three profiles he sent on 17 August — Vanyak3k, Panzer,
   Malibuca — which are the same bio three times: age and flag, what you are and
   who you play for, what you have won, what you have earned, and who represents
   you. Everything in it is already in the save; nothing is invented, and the
   two things those bios carry that a career cannot know — an email and a Twitch
   channel — are left out rather than made up.

   The club reads as a tag where its handle is known and as plain text where it
   is not, the same rule the agents follow. Three are known because he sent them
   himself, written by the clubs and players on their own profiles. Deriving the
   rest from the club's name would be inventing a real organisation's handle. */
const CC_ORG_AT={'Gentle Mates':'GentleMates', 'Geekay Esports':'geekay_esports',
                 'BIG':'BIGCLANgg', 'BIG Clan':'BIGCLANgg', 'Loyalty Gamer':'TeamLG__', 'Kraven Esport':'kravenesport'};
function ccOrgAt(name){ return CC_ORG_AT[String(name||'')] || null; }
/* The one line a career leads with, for the strip under the name.

   Ordered the way a profile is read rather than the way the log is stored: a
   Major beats a stack of cups, a cup beats a place at the Globals, and Player
   of the Season is the thing you say when you have not won a tournament yet.
   Nothing here is new — it is careerBioHTML's own arithmetic, asked for one
   answer instead of all of them. */
function careerTopHonour(){
  const log=CAREER.career.log||[];
  const maj=log.filter(r=>!r.who && ccFncsTitle(r)).length;
  if(maj) return L().ccBioMajor(maj);
  /* Отзыв: «я выиграл EWC, и в bio сошиал не пишет 1x EWC
     Reload». Выигранный ЛАН — титул не ниже Мейджора; считается тем же
     журналом, что и плитка трофеев (careerTrophies). */
  const t=careerTrophies();
  if(t.paris) return L().ccBioRc(t.paris);
  if(t.summit) return L().ccBioSummit(t.summit);
  const cups=log.filter(r=>r.kind==null && r.place===1).length;
  if(cups) return L().ccBioCups(cups);
  const best=log.filter(r=>r.kind==='globals').map(r=>r.place).sort((a,b)=>a-b)[0];
  if(best) return L().ccBioGlobals(best);
  const s=careerAwardsWon('season'); if(s) return L().ccAwardSeason+' ×'+s;
  const m=careerAwardsWon('month');  if(m) return L().ccAwardMonth+' ×'+m;
  return '';
}
/* СВОЁ БИО (5.10, Notion «05», испанский игрок: «edición de biografía»). Авто-строка ниже
   остаётся по умолчанию; написанное игроком встаёт на её место в профиле (ccBioLine) и
   отдельной строкой в шапке соцсети. Текст — только текст: чистится от управляющих символов,
   режется по CC_BIO_MAX и выводится через esc (память: поверхность self-XSS — свои поля). */
const CC_BIO_MAX=160;
function ccBioClean(v){
  return String(v==null ? '' : v).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, CC_BIO_MAX);
}
function ccMyBio(){ const cr=CAREER && CAREER.career; return cr ? ccBioClean(cr.bio) : ''; }
function careerBioSet(v){
  const cr=CAREER && CAREER.career; if(!cr) return '';
  const t=ccBioClean(v);
  cr.bio=t || null;
  try{ careerSave(); }catch(e){}
  return t;
}
function ccBioOwnHTML(){
  const b=ccMyBio();
  return (b ? `<span class="x-bio-txt">${esc(b)}</span>` : '')+
    `<button class="x-bio-edit" type="button" onclick="careerBioEdit()">✎ ${esc(L().ccBioEdit)}</button>`;
}
function careerBioEdit(){
  const box=document.getElementById('xBioOwn'); if(!box) return false;
  const T=L();
  box.innerHTML=`<textarea id="xBioIn" class="x-bio-in" maxlength="${CC_BIO_MAX}" rows="2"
      placeholder="${esc(T.ccBioPh(CC_BIO_MAX))}">${esc(ccMyBio())}</textarea>
    <div class="x-bio-btns"><button class="ch-sign" type="button" onclick="careerBioCommit(false)">${esc(T.ccBioSave)}</button>
      <button type="button" onclick="careerBioCommit(true)">${esc(T.ccBioAuto)}</button>
      <button type="button" onclick="careerBioCancel()">${esc(T.ccBioCancel)}</button></div>`;
  const inp=document.getElementById('xBioIn'); if(inp) inp.focus();
  return true;
}
function careerBioCommit(reset){
  const inp=document.getElementById('xBioIn');
  careerBioSet(reset ? '' : (inp ? inp.value : ''));
  careerBioCancel();
}
function careerBioCancel(){ const box=document.getElementById('xBioOwn'); if(box) box.innerHTML=ccBioOwnHTML(); }
function careerBioHTML(){
  // Своё био, если написано, — вместо собранного.
  if(ccMyBio()) return esc(ccMyBio());
  const pl=CAREER.player, cr=CAREER.career, org=CAREER.org, on=careerAgent();
  const bits=[];
  const age=ccPlayerAge();
  // Age and the flag, the way all three of those bios open.
  bits.push([age ? String(age) : '',
             pl.country ? `<img class="ch-bio-flag" src="flags/w20/${
               esc(ccCountryOf(String(pl.country).toLowerCase()))}.png" alt="" title="${
               esc(ccCountryName(pl.country)||'')}">` : ''].filter(Boolean).join(' '));
  bits.push(L().ccBioPro+(org ? ' '+(ccOrgAt(org.name)
      ? '<span class="x-at">@'+esc(ccOrgAt(org.name))+'</span>'
      : '<b>'+esc(org.name)+'</b>') : ''));
  // What it has won, counted off the log the history screen reads.
  const log=cr.log||[];
  const cupWins=log.filter(r=>r.kind==null && r.place===1).length;
  const majWins=log.filter(r=>!r.who && ccFncsTitle(r)).length;
  const best=log.filter(r=>r.kind==='globals').map(r=>r.place).sort((a,b)=>a-b)[0];
  if(majWins) bits.push(L().ccBioMajor(majWins));
  const lan=careerTrophies();
  if(lan.paris) bits.push(L().ccBioRc(lan.paris));
  if(lan.summit) bits.push(L().ccBioSummit(lan.summit));
  if(cupWins) bits.push(L().ccBioCups(cupWins));
  if(best) bits.push(L().ccBioGlobals(best));
  const mAw=careerAwardsWon('month'), sAw=careerAwardsWon('season');
  if(sAw) bits.push(L().ccAwardSeason+' ×'+sAw);
  else if(mAw) bits.push(L().ccAwardMonth+' ×'+mAw);
  if(cr.earnings) bits.push(ccMoney(cr.earnings)+'+');
  // Malibuca's profile does not tag a manager and prints a business line
  // instead; a career without one says the same kind of thing rather than
  // leaving the slot empty.
  bits.push(on ? L().ccBioManager+' '+((ccAgentFace(on).at)
      ? '<span class="x-at">@'+esc(ccAgentFace(on).at)+'</span>' : '<b>'+esc(on.name)+'</b>')
    : L().ccBioNoManager);
  const smm=ccSmm();
  if(smm) bits.push(L().ccSmmBio('<b>'+esc(smm.name)+'</b>'));
  return bits.filter(Boolean).join(' · ');
}
/* Next-event card: what the tournament is before you play it. Length, room size, what knocks you out, what 1st
   is worth to you (not to the pair). Unpaid stages say so (Reload Opens and Play-In pay nothing).
   Only uses what the file holds: ccNextShape for the shape, the same prize functions the runners pay from. A row
   with no number isn't drawn. */
function ccNextTopPrize(next){
  const k=next && next.type, cr=CAREER.career;
  const half=cash=>ccShareOf(cash, {squad:[1,2]});
  try{
    if(k==='final')  return half(wfPrize(1));
    if(k==='eval')   return half(ccEvalWinCash());
    if(k==='major'){ const ev=careerMajorOn(careerToday());
      return ev && ev.stage==='final' ? half(majorPrize(1)) : 0; }
    if(k==='reload'){ const ev=careerReloadOn(careerToday());
      return ev ? half(relStagePrize(ev.stage, 1)) : 0; }
    if(k==='gc'){ return careerGclcOn(careerToday()) ? half(gclcPrize(1)) : half(rcPrize(1)); }
    if(k==='cup')    return cr.division===1 ? 0 : 0;
  }catch(e){}
  return 0;
}
function careerNextCardHTML(next, playable){
  if(!next || CAREER.career.seasonOver) return '';
  const shape=ccNextShape(next)||{};
  const money=ccNextTopPrize(next);
  const when = next.day===careerToday() ? L().chLiveNow
    : L().calDows[(new Date(next.day+'T00:00:00Z').getUTCDay()+6)%7]+' '+
      Number(next.day.slice(8))+' '+L().calMonthsShort[Number(next.day.slice(5,7))-1];
  const row=(k,v)=>`<div class="ch-row"><em>${k}</em><b>${v}</b></div>`;
  return `<div class="ch-tile ch-tile-next">
    <h4>${L().chNext}</h4>
    <div class="ch-nextcard-head"><b>${esc(next.label||next.title||'')}</b>
      <em class="${next.day===careerToday()?'ch-next-now':''}">${esc(when)}</em></div>
    ${shape.games ? row(L().ccNextGames, shape.games+' '+L().ccNextGamesUnit) : ''}
    ${shape.of ? row(L().ccNextField, shape.of) : ''}
    ${shape.cut ? row(L().ccNextCut, L().ccNextTop(shape.cut)) : ''}
    ${money ? row(L().ccNextPays, ccMoney(money))
            : `<div class="ch-row"><em>${L().ccNextPays}</em><b class="cc-pen">${L().ccNextNoPay}</b></div>`}
    ${playable ? '' : `<div class="ch-hint">${L().ccNextLocked}</div>`}
  </div>`;
}
/* The duo panel, lifted out of the centre's markup so the career tab can hold
   it. Nothing about it changed — the card is up with the player's own, and what
   is left is what the duo actually is: who, how old, what mood, how long you
   have been a pair and what that is worth to your own growth. */
/* One block per person, because a trio year has two of them.

   A duo draws exactly what it drew before — who, their role, their age, their
   mood — and a trio draws that twice, with an empty chair saying so rather than
   being left out. Chemistry and what the seat is worth to your own growth are
   said once at the bottom, because both are properties of the squad rather than
   of a person: see careerChemDays, which reads the newest of them, and
   careerMateFactor, which reads the strongest. */
function ccMateBlockHTML(mate, rec){
  if(!mate) return `<div class="ch-row ch-row-empty"><em>${L().ccResPartner}</em><b>${L().ccSeatEmpty}</b></div>`;
  const pat = rec && rec.patience!=null ? rec.patience : CAREER_PATIENCE_START;
  return `<div class="ch-row"><em>${L().ccResPartner}</em><b>${flagFor(mate)}${esc(mate.handle)} (${attrsFor(mate).ovr})</b></div>`+
    `<div class="ch-row"><em>${L().ccRole}</em><b>${L()[attrsFor(mate).roleKey]||''}</b></div>`+
    (()=>{ const a=ccAgeShown(mate.handle);
      return a ? `<div class="ch-row"><em>${L().ccAge}</em><b>${L().ccYearsOld(a)}</b></div>` : ''; })()+
    `<div class="ch-row"><em>${L().ccMood}</em><b>${L()[careerMoodKey(pat)]}</b></div>`;
}
function careerDuoTileHTML(){
  const mates=careerMates(), recs=careerMateRecords(), seats=careerMateSeats();
  const mate=mates[0];
  const blocks=[];
  for(let i=0; i<seats; i++) blocks.push(ccMateBlockHTML(mates[i], recs[i]));
  return `<div class="ch-tile">
    <h4>${seats>1 ? L().ccSquadTrio : L().chSquad}</h4>
    <div class="ch-hint">${seats>1 ? L().chSquadHintTrio : L().chSquadHint}</div>
    <div class="ch-duo"><div class="ch-duo-rows">
    ${mates.length ? blocks.join('')+
             `<div class="ch-row"><em>${L().ccChem}</em><b class="${careerChem()>0?'ch-goal-met':''}">+${
                careerChem()} · ${L().ccChemDays(careerChemDays())}</b></div>`+
             (()=>{ const f=careerMateFactor(CAREER.player.ovrExact!=null?CAREER.player.ovrExact:CAREER.player.ovr);
               const pct=Math.round((f-1)*100);
               return `<div class="ch-row"><em>${L().ccMateLearn}</em><b class="${pct>0?'ch-goal-met':pct<0?'cc-pen bad':''}">${pct>0?'+':''}${pct}%</b></div>`; })()
           : `<div class="ch-empty">${L().chNoPartner}</div>`}
    <!-- The one button that used to sit here asked for somebody without saying
         which chair it meant, so in a trio there was no way to say "this one,
         not that one" — it took whoever was rated lowest. It now sits under each
         card instead, one per chair. His report, 20 August. See careerMeHTML. -->
    </div></div>
  </div>`;
}
/* The career tab: who this player is and who they are tied to.

   Left, the person — both cards, the profile with the bio and the counts, and
   the seat beside them. Right, everyone with a claim on the money: the man who
   negotiates, the club that pays, the brand that rents the audience, the coach
   who is hired by the month. The rival closes it, because he is the only one
   here who does not want anything from you except to finish above you. */
function careerMeHTML(){
  const card=careerCard(), mates=careerMates(), seats=careerMateSeats();
  /* One card per chair, and an empty chair drawn as an empty chair.

     His report, 19 August, off a trio season: the tile said three people and the
     row underneath it showed two cards, so there was nothing on the screen that
     said a seat was still open — you had to read the rows to find out. */
  /* Роль стоит под собственной карточкой и меняется оттуда же.
     Кнопка под чужой карточкой меняет напарника; под своей — меняет то
     единственное в себе, что выбирают, а не зарабатывают. Ролей две, поэтому
     на кнопке написана та, в которую переходят. */
  const roleNow=ccRoleNow(), roleCan=ccRoleSwapCan();
  const cardTiles=[`<div class="ch-tile ch-tile-card">
      <h4>${esc(CAREER.player.nick||'')}</h4>
      <div class="ch-cardwrap">${card?futCardHTML(card,{wide:true, noEvent:true, peek:true}):''}</div>
      ${ccMeEditHTML()}
      ${(CAREER.career.sp||0) ? `<div class="ch-sp">
        <!-- Очки в карьере больше не начисляются (правка: раздача
             один раз на экране создания). Плитка живёт только ради сейвов, в
             которых очки успели скопиться, — потратил и её больше нет. -->
        <em>${L().ccSpTitle}: <b>${CAREER.career.sp}</b></em>
        <div class="ch-sp-btns">${ATTR_KEYS.map(k=>
          `<button onclick="careerSpSpend(\'${k}\')" title="+0.5">+ ${
            L()['attr'+k.charAt(0).toUpperCase()+k.slice(1)]}</button>`).join('')}</div>
      </div>` : ''}
      ${roleNow ? `<div class="ch-row"><em>${L().ccRole}</em><b>${L()[roleNow]||''}</b></div>
      <button class="ch-swap" onclick="careerRoleSwap()"${roleCan.ok?'':' disabled'}>${
        L().ccRoleSwapTo(L()[ccRoleOther(roleNow)])}</button>`+
      // Погасшая кнопка обязана сказать, почему: команда уже собрана, и
      // пересесть значит оставить её с двумя ИГЛами или без единого.
      (roleCan.ok ? '' : `<div class="ch-hint">${
        roleCan.why==='cool' ? L().ccRoleCool(roleCan.days) : roleCan.why==='two' ? L().ccRoleLockedTwo : L().ccRoleLockedNone}</div>`) : ''}
      ${(()=>{ const r=ccSquadRoles(); return (r.length>=careerSquadSize() && r.indexOf('roleIGL')<0) ? `<div class="ch-hint">${esc(L().ccRoleNoIgl||'')}</div>` : ''; })()}
    </div>`];
  /* One button per chair, under the card sitting in it.

     Asking from under a card is asking for that card to be replaced, and the
     seat travels with the request: through the search, into the conversation,
     and out the other side on the day they say yes. An empty chair asks to be
     filled instead, which is the same button with the other word on it.

     His report, 20 August: with one button above all of them there was no way
     to say which of two partners he wanted gone. See careerMateSeat. */
  /* Too many for the season: the year turned from trios to duos with both
     partners still held. Every one of them is drawn, and the button under each
     says the only thing there is to decide — who stays. Nothing else on these
     tiles works until it is decided, because there is no squad to work on. */
  if(careerMatesOver()>0){
    const all=(CAREER.partners||[]).filter(Boolean);
    all.forEach((pr, i)=>{
      const m=ccMateCardOf(pr);
      cardTiles.push(`<div class="ch-tile ch-tile-card">
        <h4>${L().ccResPartner}</h4>
        <div class="ch-cardwrap">${m?futCardHTML(m,{wide:true, noEvent:true, peek:true}):''}</div>
        <button class="ch-sign" onclick="careerMateChoose(${i})">${L().ccMateKeep}</button>
      </div>`);
    });
    return `<div class="ch-grid ch-grid-me">
      <div class="ch-col">
        <div class="ch-tile"><h4>${L().chSquad}</h4>
          <div class="ch-hint">${L().ccMateOver}</div></div>
        <div class="ch-pair ch-pair-cards ch-pair-trio">${cardTiles.join('')}</div>
      </div>
      <div class="ch-col">
        ${careerOrgTileHTML()}
        ${careerStaffPanelHTML()}
      </div>
    </div>`;
  }
  for(let i=0;i<seats;i++){
    const m=mates[i];
    /* Крестик — только когда в кресле кто-то есть, и только рядом с чужой
       карточкой. Распустить состав можно и не подобрав замену: в трио это
       ровно то, что делают. Подтверждение на careerMateKickAsk. */
    cardTiles.push(`<div class="ch-tile ch-tile-card">
      <h4>${L().ccResPartner}${m && !(i===0 && ccMpOn() && typeof MP!=='undefined' && MP.peer)?`<button class="ch-kick" title="${
        esc(L().ccMateKick)}" aria-label="${esc(L().ccMateKick)}"
        onclick="careerMateKickAsk(${i})">×</button>`:''}</h4>
      <div class="ch-cardwrap">${m?futCardHTML(m,{wide:true, noEvent:true, peek:true})
        :`<div class="ch-empty ch-empty-seat">${(i===0 && !mates.length)?L().chNoPartner:L().ccSeatEmpty}</div>`}</div>
      <button class="ch-swap" onclick="ccDuoFindOpen(${i})">${
        m ? ccSay('ccMateReplace') : ccSay('ccFindDuo')}</button>
    </div>`);
  }
  /* «Карьера» — только игра: состав слева, справа своя точка, составы по размерам и коуч.
     Клуб, менеджер, маркетинг и SMM переехали во вкладку «Клуб» (careerClubTabHTML). */
  return `<div class="ch-grid ch-grid-me">
    <div class="ch-col">
      <!-- The duo reads first, the two cards under it, and the tournament last,
           his order of 18 August. -->
      ${careerDuoTileHTML()}
      <div class="ch-pair ch-pair-cards${seats>1?' ch-pair-trio':''}">${cardTiles.join('')}</div>
      ${careerNextCardHTML(careerNext(), careerCanPlay(careerNext()) && !CAREER.career.seasonOver)}
    </div>
    <div class="ch-col">
      ${careerSpotTileHTML()}
      ${ccMateCompareHTML()}
      ${ccChemTileHTML()}
      ${ccRostersTileHTML()}
    </div>
  </div>`;
}
// Составы по размерам — дуо, трио, сквад: кто в каком, какой играет сейчас.
function ccRostersTileHTML(){
  if(!CAREER) return '';
  const now=CAREER.rosterSize||careerSquadSize();
  const all=Object.assign({}, CAREER.rosters||{});
  all[now]=(CAREER.partners||[]).slice();
  const names={2:L().lfRosterDuo, 3:L().lfRosterTrio, 4:L().lfRosterSquad};
  /* Всегда три строки — дуо, трио, сквад (его слово 29.09: «в карьере нет трио-состава, непонятно, с кем
     играешь»): кто в составе, сколько из скольких, и у неполного — «Позвать» (поиск с личкой, ccDuoFindOpen(fmt)). */
  const me=CAREER.player.nick||CAREER.player.handle||'';
  const mpNow=(typeof ccMpOn==='function' && ccMpOn());
  const rows=[2,3,4].map(s=>{
    // Онлайн трио/сквад — те же двое живых (+ филл на вечер), а не пустой одиночный состав формата (скрин 22.10: «трио · 1/3»).
    const picks=(mpNow && s!==now) ? (((CAREER.career||{}).fmtPick||{})[s]||[]).map(h=>({handle:h})) : [];
    const src=(mpNow && s!==now) ? careerMates().filter(c=>c && c.handle).slice(0, 1).map(c=>({handle:c.handle})).concat(picks) : (all[s]||[]);
    const who=src.filter(Boolean).map(r=>{ const c=ccMateCardOf(r); return c && c.handle; }).filter(Boolean).slice(0, s-1);
    const full=who.length>=s-1;
    // Сбор не текущего формата — за неделю до его первого вечера (его слово 8.10: «во вкладке карьера можно уже трио и
    // сквад собрать, хотя турниры ещё не скоро»), как и метка на карте (ccFmtOpenFrom). Нет вечеров формата — нет кнопки.
    const from=(s!==now) ? ccFmtOpenFrom(s) : null, plays=s===now || (typeof ccFormatNext==='function' && !!ccFormatNext(s));
    /* ОНЛАЙН — не «Позвать» (Telegram 22.10: «в трио чела позвать невозможно»): в командной карьере поиск по личкам
       закрыт (ccDuoFindOpen), третий и четвёртый садятся на вечер филлом у обоих (ccMpFmtBegin). Кнопка была мёртвой —
       жмёшь, ничего. Теперь та же подпись, что в Центре (ccRostersStripHTML). */
    const mpFill=(typeof ccMpOn==='function' && ccMpOn() && s!==now && s>2 && plays);
    const btn=mpFill ? (CC_MP_FMT_ON ? ` <button class="cc-rost-ask" onclick="ccDuoFindOpen(null, ${s})">${esc(full ? (L().roMpSwap||L().lfRosterAsk) : L().lfRosterAsk)}</button>` +
        (!full && L().roMpFill ? ` <small class="cc-rost-from">${esc(L().roMpFill(s-1-who.length))}</small>` : '') : '')
      : (full || s===now || !plays) ? ''
      : from ? ` <small class="cc-rost-from">${esc(L().roSpotFrom(ccDayLabel(from)))}</small>`
      : ` <button class="cc-rost-ask" onclick="ccDuoFindOpen(null, ${s})">${esc(L().lfRosterAsk)}</button>`;
    return `<div class="ch-row"><em>${names[s]}${s===now?' · '+L().lfRosterNow:''} · ${who.length+1}/${s}</em><b>${esc([me].concat(who).join(', '))}${btn}</b></div>`;
  });
  return `<div class="ch-tile"><h4>${L().lfRosters}</h4><div class="ch-hint">${L().lfRostersHint}</div>${rows.join('')}</div>`;
}
// Доходы карьеры по статьям.
function ccIncomeTileHTML(){
  const cr=CAREER.career, rows=[];
  const add=(k,v,always)=>{ if(v || always) rows.push(`<div class="ch-row"><em>${L()[k]}</em><b>${ccMoney(v||0)}</b></div>`); };
  add('lfPrize', cr.earnings, true); add('lfWages', cr.wages, true); add('lfSponsor', cr.sponsored, true); add('lfSide', cr.side); add('lfOrgCut', cr.orgCut);
  rows.push(`<div class="ch-row"><em>${L().lfBalance}</em><b>${ccMoney(cr.balance||0)}</b></div>`);
  return `<div class="ch-tile"><h4>${L().lfIncome}</h4>${rows.join('')}</div>`;
}
// Вкладка «Клуб»: организация, контракт и цель, менеджер, маркетинг, SMM, доходы.
/* ШТАБ — весь персонал карьеры одной панелью (его «делай» 8.10 на «дизайн и панельки понятней, чтоб не аишно и
   всё понятно»). Было шесть плиток в двух вкладках: коуч на «Карьере», остальные пятеро на «Клубе» длинным столбцом,
   у каждого абзац пояснений и по две кнопки во всю ширину. Теперь — карточки как в FC: аватар, роль, рейтинг в цвете
   (золото от 85, серебро от 75, бронза ниже), одна строка того, что он даёт, и срок. Пустая карточка — «＋ Нанять».
   Нажатие открывает то же окно выбора, что и раньше; «разорвать» — маленькой ссылкой, где расторжение есть. */
/* СРОК И АВТОПРОДЛЕНИЕ ШТАБА (его слова 8.10: «может автоматически продлеваются коуч смм и тд», «или сразу на год
   возможность дать»). Месяц — 30 дней, год — 12 месяцев со скидкой 10% (оценка режима). Найм помнит срок и месячную
   цену; когда срок выходит, контракт продлевается на тот же срок, если включено автопродление (по умолчанию да) и хватает
   денег; коуча, которого оплачивает клуб, — бесплатно. Не хватило — человек уходит, новость об этом одна. Менеджера это
   не касается: у него нет срока, он берёт долю. */
const CC_STAFF_YEAR=12, CC_STAFF_YEAR_DISC=0.10;
function ccStaffTermCost(month, months){
  return months>=CC_STAFF_YEAR ? Math.round(month*CC_STAFF_YEAR*(1-CC_STAFF_YEAR_DISC)/50)*50 : month;
}
function ccStaffTermDays(months){ return 30*(months>=CC_STAFF_YEAR ? CC_STAFF_YEAR : 1); }
function ccAutoRenewOn(){ return !CAREER || CAREER.autoRenew!==false; }
function careerAutoRenewToggle(){ CAREER.autoRenew=!ccAutoRenewOn(); careerSave(); careerRenderHub(); }
// Все пять «сроковых» ролей: где лежит найм, его месячная цена, кто платит.
function ccStaffTermRecs(){
  const S=L().ccStaffRole, out=[];
  if(CAREER.coach){ const c=CC_COACHES.find(x=>x.id===CAREER.coach.id);
    if(c) out.push({key:'coach', rec:CAREER.coach, role:S.coach, name:c.name, month:CAREER.coach.cost||c.cost, free:()=>ccOrgPaysCoach()}); }
  if(CAREER.smm) out.push({key:'smm', rec:CAREER.smm, role:S.smm, name:CAREER.smm.name, month:CAREER.smm.cost||CC_SMM_FROM});
  if(CAREER.mkt) out.push({key:'mkt', rec:CAREER.mkt, role:S.mkt, name:CAREER.mkt.name, month:CAREER.mkt.cost||0});
  for(const k of ['analyst','psych']) if(CAREER[k]) out.push({key:k, rec:CAREER[k], role:S[k], name:CAREER[k].name, month:CAREER[k].cost||0, free:()=>ccOrgPays(k)});
  return out;
}
function ccStaffAutoRenew(toISO){
  const cr=CAREER.career;
  ccStaffTermRecs().forEach(t=>{
    const r=t.rec; if(!r || !r.until || r.gone) return;
    let guard=0;
    while(r.until<toISO && guard++<40){
      if(!ccAutoRenewOn()){ return; }
      const months=r.months||1, free=t.free && t.free(), cost=free ? 0 : ccStaffTermCost(t.month, months);
      if((cr.balance||0)<cost){ r.gone=true; careerNews('bad', 'ccNewsStaffGone', [t.role, t.name]); return; }
      cr.balance-=cost;
      r.until=ccAddDays(r.until, ccStaffTermDays(months));
      // В ленту продление не пишется (16.10, его слово): это бухгалтерия, а не новость; деньги видны в балансе.
    }
  });
}
// Кнопки найма в окнах выбора: месяц и год рядом.
function ccHireBtns(can, month, onMonth, onYear, label){
  const y=ccStaffTermCost(month, CC_STAFF_YEAR);
  return `<span class="cc-buy-btns"><button class="ch-sign"${can?'':' disabled'} onclick="${onMonth}">${label||ccMoney(month)}</button>`+
    `<button class="ch-sign cc-year"${can && (CAREER.career.balance||0)>=y ?'':' disabled'} onclick="${onYear}">${L().ccStaffYear} · ${ccMoney(y)}</button></span>`;
}
function ccStaffBadge(r){
  const cls=r>=85 ? 'gold' : r>=75 ? 'silver' : 'bronze';
  return `<span class="cc-staff-rt ${cls}">${r}</span>`;
}
function ccStaffCards(){
  const T=L(), S=T.ccStaffRole, out=[];
  // Коуч
  { const w=ccCoach(), row=w ? (CC_COACHES.find(c=>c.id===w.id)||w) : null;
    out.push(w ? {role:S.coach, name:w.name, at:w.at, photo:w.photo, r:row.rating||ccCoachRatingOf(row),
                  fx:T.ccShopTrain+' +'+Math.round((w.train||row.train||0)*100)+'%', until:CAREER.coach && CAREER.coach.until, year:(CAREER.coach.months||1)>=12, open:'ccCoachPickOpen()'}
               : {role:S.coach, open:'ccCoachPickOpen()'}); }
  // Менеджер
  { const a=careerAgent();
    if(a){ const row=CC_AGENTS.find(x=>x.name===a.name)||{at:a.at, x:0}, t=careerAgentTerms();
      out.push({role:S.agent, name:a.name, at:a.at, photo:(ccAgentFace({name:a.name, photo:a.photo, at:a.at})||{}).photo||a.photo, r:ccStaffRating(row),
                fx:T.ccAgentReachRow+' +'+t.reach+' · '+Math.round(t.cut*100)+'%', open:'ccAgentPickOpen()', end:'careerEndAgent()'}); }
    else out.push({role:S.agent, open:'ccAgentPickOpen()'}); }
  // SMM
  { const m=ccSmm();
    out.push(m ? {role:S.smm, name:m.name, at:m.at, photo:m.photo, r:ccStaffRating(ccSmmOf(m.id)||m),
                  fx:T.ccSmmGain+' +'+Math.round(ccSmmBoost()*100)+'%', until:m.until, year:(m.months||1)>=12, open:'ccSmmPickOpen()', end:'careerEndSmm()'}
               : {role:S.smm, open:'ccSmmPickOpen()'}); }
  // Маркетинг
  { const m=ccMkt(), row=m ? (ccMktOf(m.id)||m) : null;
    out.push(m ? {role:S.mkt, name:row.name||m.name, at:row.at, photo:row.photo, r:ccStaffRating(row),
                  fx:T.ccStaffMktFx((m.rate!=null ? m.rate : ccMktTermsOf(row).rate).toFixed(2)), until:m.until, year:(m.months||1)>=12, open:'ccMktPickOpen()', end:'careerEndMkt()'}
               : {role:S.mkt, open:'ccMktPickOpen()'}); }
  // Аналитик и психолог
  for(const kind of ['analyst','psych']){
    const m=ccStaff2(kind);
    out.push(m ? {role:S[kind], name:m.name, at:m.at, photo:m.photo, r:m.rating, fx:ccStaff2Effect(kind, m.rating),
                  until:m.until, year:(m.months||1)>=12, open:"ccStaff2PickOpen('"+kind+"')", end:"careerEndStaff2('"+kind+"')"}
               : {role:S[kind], open:"ccStaff2PickOpen('"+kind+"')"});
  }
  // Коуч, аналитик, психолог — можно попросить свой клуб оплатить (careerOrgPayAsk).
  const orgOn=CAREER.org && !CAREER.org.own;
  out.forEach((c,i)=>{ const kind=['coach',null,null,null,'analyst','psych'][i]; if(!kind || !orgOn) return;
    if(ccOrgPays(kind)) c.pay='<small class="cc-staff-paid">'+esc(L().ccOrgPays(CAREER.org.name))+'</small>';
    else { const no=ccOrgPayAskUntil(kind);
      c.pay=no ? '<small class="cc-staff-until">'+esc(L().ccOrgPayNoUntil(ccDayLabel(no)))+'</small>'
               : '<button class="cc-staff-ask" onclick="event.stopPropagation();careerOrgPayAsk(\''+kind+'\')">'+esc(L().ccOrgPayAskBtn)+'</button>'; } });
  return out;
}
function careerStaffPanelHTML(){
  const T=L();
  const card=c=>c.name
    ? `<div class="cc-staff-card" onclick="${c.open}">
        ${ccStaffBadge(c.r)}
        <span class="cc-staff-av">${c.photo ? `<img src="${PHOTO_DIR}${esc(c.photo)}" alt="" onerror="this.remove()">` : ''}<i>${esc(String(c.name).slice(0,2).toUpperCase())}</i></span>
        <em class="cc-staff-role">${esc(c.role)}</em>
        <b class="cc-staff-name">${esc(c.name)}</b>
        <span class="cc-staff-fx">${esc(c.fx)}</span>
        ${c.until ? `<small class="cc-staff-until">${T.ccCoachUntil} ${ccDayLabel(c.until)}${c.year ? ' · '+T.ccStaffYear : ''}${ccAutoRenewOn() ? ' · ↻' : ''}</small>` : ''}
        ${c.pay ? c.pay : ''}
        ${c.end ? `<button class="cc-staff-end" onclick="event.stopPropagation();${c.end}">${T.ccAgentEnd}</button>` : ''}
      </div>`
    : `<div class="cc-staff-card cc-staff-empty" onclick="${c.open}">
        <span class="cc-staff-plus">＋</span>
        <em class="cc-staff-role">${esc(c.role)}</em>
        <span class="cc-staff-hire">${T.ccStaffHire}</span>
        ${c.pay ? c.pay : ''}
      </div>`;
  return `<section class="cc-staff-wrap">
    <div class="cc-sect-row"><h3 class="cc-sect-h">${T.ccStaffTitle}</h3>
      <button class="cc-auto${ccAutoRenewOn()?' on':''}" onclick="careerAutoRenewToggle()">${T.ccStaffAuto}: ${ccAutoRenewOn() ? T.ccStaffOn : T.ccStaffOff}</button></div>
    <div class="cc-staff">${ccStaffCards().map(card).join('')}</div>
  </section>`;
}
/* «Контракт» отдельной плиткой убран (его слово 8.10: «контракт нужно убрать — вкладка «Организация» будто это и есть
   организация»): зарплата, доля, цель, выкуп и выплаты — строками внутри «Организации». На его месте — «Спонсоры»
   коротко (его слово 8.10: «в клубе где-то должны быть спонсоры у игрока»): кто подписан, слоты, ссылка на список. */
// В «Организации» уже есть зарплата, доля, выплачено, задача и выкуп — добавляем только то, чего там нет: с какого сезона.
function ccContractRowsHTML(){
  return '';   // «в клубе с сезона» — в «Подробнее» плитки клуба (8.10)
  const org=CAREER && CAREER.org; if(!org || !org.since) return '';
  return `<div class="ch-row"><em>${L().lfSince}</em><b>${org.since}</b></div>`;
}
function ccSponsorMiniHTML(){
  const T=L(), all=ccSponsorsAll(), slots=ccSpSlots(), offer=ccSponsorOffer();
  const per=all.reduce((x,y)=>x+(y.pay||0), 0);
  const logos=all.map(x=>'<span class="cc-spb-logo" onclick="ccSpPickOpen()" title="'+esc(T['ccSponsor'+x.id]||x.id)+'"><img src="'+PHOTO_DIR+'sp_'+(CC_SPONSOR_LOGO[x.id]||'x')+'.png" alt="" onerror="this.remove()"></span>').join('')+
    Array.from({length:Math.max(0, slots-all.length)}, ()=>'<span class="cc-spb-logo cc-spm-free" onclick="ccSpPickOpen()">＋</span>').join('');
  return '<div class="ch-tile cc-spm"><h4>'+esc(T.ccSpbTitle||T.ccSponsorTitle)+'</h4><div class="cc-spm-logos">'+logos+'</div>'+
    '<div class="ch-row"><em>'+esc(T.ccSpbTitle||T.ccSponsorTitle)+'</em><b>'+all.length+'/'+slots+'</b></div>'+
    (per ? '<div class="ch-row"><em>'+esc(T.ccSpbPer)+'</em><b>'+ccMoney(per)+T.ccPerStream+'</b></div>' : '')+
    (all.length && ccSpPostsReady() ? '<div class="ch-row cc-spm-post" onclick="ccSpPickOpen()"><em>📣 '+esc(T.ccSpPostReady)+'</em><b>'+ccSpPostsReady()+'</b></div>' : '')+
    (offer ? '<div class="ch-row"><em>'+esc(T.ccSpbOfferNow)+'</em><b>'+esc(T['ccSponsor'+offer.id]||offer.id)+' · '+ccMoney(offer.pay)+'</b></div>' : '')+
    '<button class="cc-back cc-spm-go" onclick="ccSpScroll()">'+esc(T.ccSpbAll)+'</button></div>';
}
/* Бренды — окном поверх, как выбор коуча/аналитика (его слово 8.10: «пусть спонсоры будут поверх, как с выбором коуча,
   а не в самом низу»). Плитка «Спонсоры» в верхнем ряду открывает его: ＋ в слоте, логотип, кнопка. */
function ccSpPickOpen(){
  const b=document.getElementById('spPickBody'), m=document.getElementById('spPickModal'); if(!b || !m) return;
  b.innerHTML=careerSponsorsHTML();
  m.style.display='flex';
  document.addEventListener('keydown', ccSpPickKey);
}
function ccSpPickClose(){ const m=document.getElementById('spPickModal'); if(m) m.style.display='none'; document.removeEventListener('keydown', ccSpPickKey); }
function ccSpPickKey(e){ if(e.key==='Escape') ccSpPickClose(); }
function ccSpPickRefresh(){ const m=document.getElementById('spPickModal'); if(m && m.style.display==='flex') ccSpPickOpen(); }
function ccSpScroll(){ ccSpPickOpen(); }
function careerClubTabHTML(){
  // Клуб строкой сверху (организация с контрактом, спонсоры, доходы), под ним штаб и полный список брендов.
  const org=careerOrgTileHTML(), i=org.lastIndexOf('</div>');
  const btn=org.indexOf('<button'), at=btn>0 ? btn : i;
  const orgFull=at>0 ? org.slice(0,at)+ccContractRowsHTML()+org.slice(at) : org+ccContractRowsHTML();
  // Штаб первым (его слово 23.10: «хочу стафф видеть сразу на вкладке»), клуб строкой под ним.
  return `${careerStaffPanelHTML()}
    <div class="cc-club-top">
      ${orgFull}
      ${ccSponsorMiniHTML()}
      ${ccIncomeTileHTML()}
    </div>`;
}
/* Смена ника и аватарки внутри карьеры.
   Безопасно, потому что от ника ничего не хранится: @-адрес считает ccHandle(nick) при отрисовке, автора постов
   ccPostAuthor берёт из CAREER.player при показе. Старые посты переименовываются сами, миграция не нужна.
   Имя настоящего игрока менять нельзя: pl.handle держит человека из ростера, по нему careerCard ищет карточку,
   и карьера потеряет результаты. Там меняется только фото.
   careerNickSet и careerPhotoSet чистые (их зовёт тест), careerNickAsk и careerPhotoPick висят на кнопках. */
const CC_NICK_MAX=20;
function careerNickSet(next){
  const pl=CAREER && CAREER.player; if(!pl) return false;
  if(pl.handle) return false;                       // чужое имя не наше дело
  const nick=String(next==null?'':next).trim().slice(0, CC_NICK_MAX);
  /* Ник должен содержать хоть одну букву или цифру — в любом алфавите.

     Сначала тут стояло «ccHandle(nick) не пустой», и это не работало: ccHandle
     при пустом результате возвращает исходную строку, чтобы кириллица и
     иероглифы всё-таки получили @-адрес, — поэтому «!!!» проходило проверку и
     становилось ником. Замерено пробой, а не придумано.

     \p{L} и \p{N} с флагом u, а не [a-z0-9]: Кирилл и ゆうま — нормальные ники,
     и отсекать их заодно с «!!!» нельзя. */
  if(!nick || !/[\p{L}\p{N}]/u.test(nick)) return false;
  if(nick===pl.nick) return true;
  pl.nick=nick;
  careerSave();
  careerRenderHub();
  return true;
}
function careerNickAsk(){
  const pl=CAREER && CAREER.player; if(!pl) return;
  if(pl.handle){ if(typeof alert==='function') alert(L().ccNickLocked); return; }
  const next=(typeof prompt==='function') ? prompt(L().ccNickAsk, pl.nick||'') : null;
  if(next==null) return;                            // отменил — ничего не было
  if(!careerNickSet(next) && typeof alert==='function') alert(L().ccNickBad);
}
function careerPhotoSet(url){
  const pl=CAREER && CAREER.player; if(!pl) return false;
  pl.photo=url||null;
  careerSave();
  careerRenderHub();
  return true;
}
function careerPhotoChosen(input){
  const f=input && input.files && input.files[0]; if(!f) return;
  const r=new FileReader();
  // Тот же путь, что и при создании карьеры: картинка ужимается до CC_PHOTO_MAX,
  // иначе один снимок с телефона не влезет в localStorage вместе с сейвом.
  r.onload=()=>{ ccPhotoShrink(String(r.result||''), function(url){ careerPhotoSet(url); }); };
  r.readAsDataURL(f);
  input.value='';
}
function careerPhotoPick(){
  const el=document.getElementById('chPhotoInput');
  if(el) el.click();
}
/* СОСТАВЫ ПО ФОРМАТАМ ГОДА — в шапке профиля (его скрин 30.09 с тремя рамками: «тут будут составы
   смотря какие режимы есть в году; вот дуо сейчас — пишет дуо, а если трио есть в этом сезоне — будет
   написано: турнир тогда-то первый трио, и за неделю можно собрать состав»). По блоку на каждый
   командный формат, который в году ещё играется: текущий — с составом, будущий — с датой первого
   турнира; за CC_ROSTER_WEEK дней до него — кнопка «Собрать состав» (личка того формата, ccDuoFindOpen). */
const CC_ROSTER_WEEK=7;
// Размер состава года на день: 2019/2020 — по этапам (ccPhaseRoster), остальные годы — как сейчас.
function ccSizeOnDay(d){
  if(typeof ccIs2019==='function' && ccIs2019()) return d<'2019-08-01' ? 2 : d<'2019-10-13' ? 3 : 4;
  if(typeof ccIs2020==='function' && ccIs2020()) return d<'2020-08-27' ? 2 : 3;
  if(ccS43Trios(d)) return 3;
  const n=CAREER && CAREER.career && CAREER.career.size;
  return n===1 ? 1 : n===3 ? 3 : n===4 ? 4 : 2;
}
// Первый день >= сегодня, когда играется формат f: этап года или кап этого формата.
function ccFormatNext(f){
  const today=careerToday(), to=ccYearTo();
  let best=null;
  const cand=d=>{ if(d>=today && d<=to && (!best || d<best)) best=d; };
  if(ccSizeOnDay(today)===f) cand(today);
  [['2019-08-01',3],['2019-10-13',4],['2020-08-27',3]].forEach(([d,n])=>{ if(n===f && ccSizeOnDay(d)===f) cand(d); });
  const MODE={2:'duo', 3:'trio', 4:'squad'};
  // С 2026 кап без своего формата играется составом года (ccVictoryFormat 0): он не зовёт собирать другой состав.
  (typeof ccVictoryList==='function' ? ccVictoryList() : []).forEach(v=>{ if(v.mode===MODE[f] && !v.invite && ccVictoryFormat(v)===f) cand(v.day); });
  return best;
}
function ccRostersStripHTML(lobby){
  if(!CAREER || !CAREER.career || careerRetired()) return '';
  const T=L(), today=careerToday(), cur=careerSquadSize();
  const NAME={2:T.lfRosterDuo, 3:T.lfRosterTrio, 4:T.lfRosterSquad};
  const cardsOf=f=>{
    if(f===cur) return careerMates().filter(c=>c && c.handle);
    // Онлайн состав другого формата — тот же живой напарник (+ филлы на вечер), а не одиночный список.
    if(ccMpOn()) return careerMates().filter(c=>c && c.handle).slice(0, 1).concat((((CAREER.career||{}).fmtPick||{})[f]||[]).map(h=>ccMateCardOf({handle:h})).filter(c=>c && c.handle));
    return (((CAREER.rosters||{})[f])||[]).map(r=>ccMateCardOf(r)).filter(c=>c && c.handle);
  };
  /* Тиммейт — не одним ником (его слово 30.09: «мало информации о тимейте»): фото, флаг, ник,
     рейтинг, роль и клуб. */
  const orgName=(CAREER.org && CAREER.org.name && !(typeof careerClub==='function' && careerClub())) ? CAREER.org.name : null;
  const mateHTML=(c, f)=>{
    const a=(typeof attrsFor==='function' ? attrsFor(c) : null)||{};
    const noUntil=orgName ? ccClubAskNoUntil(c.handle, orgName) : null;
    const asking=orgName ? ccClubAskPending(c.handle, orgName) : null;
    const bring=(orgName && f && c.org!==orgName && !(typeof ccMpOn==='function' && ccMpOn()) && asking)
      ? '<small class="ch-ro-clubno ch-ro-asking">'+esc(T.roClubWait(ccDayLabel(asking.due)))+'</small>'
      : (orgName && f && c.org!==orgName && !(typeof ccMpOn==='function' && ccMpOn()) && noUntil)
      ? '<small class="ch-ro-clubno">'+esc(T.roClubNoUntil(ccDayLabel(noUntil)))+'</small>'
      : (orgName && f && c.org!==orgName && !(typeof ccMpOn==='function' && ccMpOn()))
      ? '<button class="ch-ro-club" onclick="event.stopPropagation();ccOrgBringMate(\''+esc(String(c.handle).replace(/'/g, ''))+'\', '+f+')">'+esc(T.roClubAsk)+'</button>' : '';
    const ovr=Math.round(ccCardOvr(c)||a.ovr||c.rating||0);
    const u=photoURL(c);
    const meta=[ovr||'', T[a.roleKey]||'', c.org||''].filter(Boolean).map(x=>esc(String(x))).join(' · ');
    return '<span class="ch-ro-m"><span class="ch-ro-av">'+esc(String(c.handle||'?').slice(0,2).toUpperCase())+
      (u ? '<img src="'+u+'" alt="" loading="lazy" onerror="this.remove()">' : '')+'</span>'+
      '<span class="ch-ro-t"><b>'+(c.nat ? flagImg(c.nat, 13)+' ' : '')+esc(c.handle)+'</b><small>'+meta+'</small>'+bring+'</span></span>';
  };
  /* И спот (его слово 30.09: «spot может ещё там»): метка высадки на острове, где этот формат
     играет первым — сезонный остров или остров вечера (Reload и т.п., careerNightSpotKey). Клик —
     карта этого острова во вкладке, где живёт плитка спота. */
  let lastSpot=null;
  const spotOf=(f, day)=>{
    lastSpot=null;
    let key=null;
    try{
      const v=(day && typeof careerVictoryOn==='function') ? careerVictoryOn(day) : null;
      key=(f!==cur) ? ccFmtSpotKey(f, careerBrSet()) : careerSpotKey(careerBrSet());
      if(v && f!==cur && ((v.mode==='trio'?3:v.mode==='squad'?4:v.mode==='duo'?2:0)===f)) key=careerNightSpotKey({type:'victory', day:day});
    }catch(e){ key=null; }
    if(!key || key==='solo') return '';
    // Формат ещё не открыт — метку не поставить, пока не откроется сбор состава.
    { const from=(f!==cur) ? ccFmtOpenFrom(f) : null;
      if(from && !careerSpotList(key)[0]) return '<span class="ch-ro-spot ch-ro-spot-lock"><em>'+esc(T.roSpot)+'</em><i>'+esc(T.roSpotFrom(ccDayLabel(from)))+'</i></span>'; }
    const sp=careerSpotList(key)[0];
    const myth=sp ? (CC_MYTHIC_POI[careerSpotGrid(key)]||{})[sp.i] : null;
    const txt=sp ? esc(L().landingZoneSuffix(sp.i+1))+(myth ? ' · ⚡ '+esc(myth) : '') : '<i>'+esc(T.roSpotNone)+'</i>';
    const go='careerTab(\'me\');careerSpotOpenFor(\''+esc(key)+'\')';
    /* Картинкой справа (его скрин в Notion 8.10: «мб тут спот картинку где-то красиво написать» — справа в карточке
       было пусто). Кусок острова той же careerSpotShotHTML, что и в плитке «Своя точка», подпись поверх: зона крупно,
       под ней сила точки и мифическое место. Без метки — прежняя строка «поставить». */
    if(sp){
      const shot=careerSpotShotHTML(sp.i, key, 'ch-ro-shot', 16/7);
      // И аура (его слово 8.10: «может ауру и ещё что-то добавить туда») — та же полоса, что в «Своей точке»; плюс
      // сундуки на точке, где счёт настоящий (ccZoneChestsOf — fortnite.gg / вики / Kinch).
      const chests=ccZoneChestsOf(careerSpotGrid(key), sp.i);
      lastSpot={sp, key, chests, myth};
      if(shot) return '<div class="ch-ro-spotcard" onclick="'+go+'">'+shot+
        '<span class="ch-ro-spotcap"><em>'+esc(T.roSpot)+'</em><b>'+esc(L().landingZoneSuffix(sp.i+1))+'</b>'+
        (myth ? '<small>⚡ '+esc(myth)+'</small>' : '')+'</span></div>';
    }
    return '<span class="ch-ro-spot" onclick="'+go+'"><em>'+esc(T.roSpot)+'</em>'+txt+'</span>';
  };
  const blocks=[2,3,4].map(f=>{
    const next=ccFormatNext(f);
    if(f!==cur && !next) return '';
    const mates=cardsOf(f), need=f-1, full=mates.length>=need;
    const days=next ? ccDaysBetween(today, next) : 0;
    const soon=f!==cur && next && days<=CC_ROSTER_WEEK;
    const who=mates.length ? '<span class="ch-ro-ms">'+mates.map(c=>mateHTML(c, f)).join('')+'</span>' : '<b><i>'+esc(T.lfRosterEmpty)+'</i></b>';
    const when=f===cur ? esc(T.lfRosterNow) : esc(T.roFirst(ccDayLabel(next)));
    const act=(f===cur && !full) ? '<button onclick="ccDuoFindOpen(null)">'+esc(T.roFind)+'</button>'
            : (f!==cur && f>2 && ccMpOn()) ? (CC_MP_FMT_ON ? '<button onclick="ccDuoFindOpen(null, '+f+')">'+esc(full ? (T.roMpSwap||T.lfRosterAsk) : T.lfRosterAsk)+'</button>'+(!full && T.roMpFill ? '<small>'+esc(T.roMpFill(f-1-mates.length))+'</small>' : '') : '')   // онлайн: филлы на вечер (ccMpFmtBegin)
            : (soon && !full) ? '<button onclick="ccDuoFindOpen(null, '+f+')">'+esc(T.roGather)+'</button>'
            : (f!==cur && !full) ? '<small>'+esc(T.roWeek)+'</small>' : '';
    const spot=spotOf(f, next), card=spot.indexOf('ch-ro-spotcard')>=0;
    /* Цифры точки и пары — строками под напарником (его скрин в Notion 8.10: «мб добавить туда сундуки, ауру и тд» —
       под тиммейтом было пусто, а цифры лежали поверх картинки). Сундуки — настоящий счёт (ccZoneChestsOf), аура
       и сила точки — те же, что в «Своей точке», сыгранность — для формата, который играет сейчас. */
    let stats='';
    if(card && lastSpot){
      const ls=lastSpot, row=(k, v)=>'<span><em>'+esc(k)+'</em>'+v+'</span>';
      const parts=[];
      if(ls.chests!=null) parts.push(row(T.roChests, '<b>'+ls.chests+'</b>'));
      parts.push(row(T.roSpotPow, '<b>'+esc(careerSpotPointsOf(ls.sp.i, ls.key))+'</b>'));
      parts.push(row(T.ccSpotAuraRow, careerSpotAuraBarHTML(ls.sp.aura||0)));
      if(f===cur && mates.length && careerPartnerCard()){ const d=careerChemDays(), pct=Math.min(100, Math.round(d/CC_CHEM_DAYS*100));
        parts.push(row(T.ccChem, '<b>'+pct+'% · +'+careerChem()+'</b>')); }
      stats='<div class="ch-ro-stats">'+parts.join('')+'</div>';
      /* В колонке меню — миниатюрой справа от цифр (его слово 20.10: «может расширить красиво как-то ростеры, чтоб
         не листать»): полоса карты на всю ширину под каждым составом и уводила сборную за край. Большая карта
         остаётся на «Профиле», где широко; здесь та же точка тем же кликом, только маленькая. */
      stats='<div class="ch-ro-sx">'+stats+spot.replace('class="ch-ro-spotcard"', 'class="ch-ro-spotcard ch-ro-spotmini"')+'</div>';
    }
    return card
      ? '<div class="ch-ro has-spot'+(f===cur ? ' on' : '')+(soon ? ' soon' : '')+'"><div class="ch-ro-main"><em>'+esc(NAME[f])+' · '+when+'</em>'+who+stats+act+'</div>'+spot+'</div>'
      : '<div class="ch-ro'+(f===cur ? ' on' : '')+(soon ? ' soon' : '')+'"><em>'+esc(NAME[f])+' · '+when+'</em>'+who+spot+act+'</div>';
  }).filter(Boolean);
  /* И сборная — Кубок наций (его слово 30.09: «и nation кап тоже там пусть будет, сборка состава»).
     Страна, ближайший этап, состав (пустые места капитана — «пусто»), у капитана за неделю до
     квалификации — «Собрать состав» (то же окно выбора, ccNatModalOpen). */
  try{
    const mine=(typeof ccNationsMine==='function') ? ccNationsMine() : null;
    const N=mine ? ccNatState() : null;
    const nd=mine ? ccNatNextDay() : null;
    // В лобби сборная — за три недели до своего этапа, не с первого дня сезона (27.10, «лобби как в Fortnite»).
    if(mine && nd && !N.finalDone && !(lobby && ccDaysBetween(today, nd)>CC_ROSTER_WEEK*3)){
      const days=ccNatDays(), qd=days.qual, dq=qd ? ccDaysBetween(today, qd) : 99;
      const others=(mine.squad||[]).filter((p,i)=>i>0);
      const chips=others.map(p=>p ? mateHTML(p) : '<span class="ch-ro-m"><span class="ch-ro-av">?</span><span class="ch-ro-t"><b><i>'+esc(T.lfRosterEmpty)+'</i></b></span></span>').join('');
      const needPick=typeof ccNatPickNeeded==='function' && ccNatPickNeeded();
      const act=(mine.captain && needPick && dq<=CC_ROSTER_WEEK) ? '<button onclick="ccNatModalOpen()">'+esc(T.roGather)+'</button>'
              : (mine.captain && needPick) ? '<small>'+esc(T.roWeek)+'</small>'
              : (!mine.inSquad && mine.seat==='trial' && !mine.trialDone) ? '<small>'+esc(T.roNatTrial)+'</small>' : '';
      const soon=mine.captain && needPick && dq<=CC_ROSTER_WEEK;
      blocks.push('<div class="ch-ro ch-ro-nat'+(soon ? ' soon' : '')+'"><em>'+flagImg(mine.nat, 12)+' '+esc(T.roNat)+(mine.captain ? ' · '+esc(T.roCaptain) : '')+' · '+esc(T.roFirst(ccDayLabel(nd)))+'</em>'+
        (chips ? '<span class="ch-ro-ms">'+chips+'</span>' : '')+act+'</div>');
    }
  }catch(e){}
  return blocks.length ? '<div class="ch-ros">'+blocks.join('')+'</div>' : '';
}
function careerProfileTileHTML(lobby){
  /* Только составы (его слово 30.09: «убери там вообще информацию о игроке, за которого играешь,
     она есть точь-в-точь такая же сверху»). Ник, фото, возраст, флаг, клуб и подписчики — в шапке
     карьеры; смена ника и фото — во вкладке «Профиль», под своей карточкой (ccMeEditHTML). */
  const ros=ccRostersStripHTML(lobby);
  return ros ? '<div class="ch-tile ch-tile-ros"><h4>'+esc(L().lfRosters)+'</h4>'+ros+'</div>' : '';
}
// Смена ника и фото — под своей карточкой во вкладке «Профиль».
function ccMeEditHTML(){
  const pl=CAREER.player;
  return `<div class="ch-me-edit ch-me-edit-card">
      ${pl.handle ? '' : `<button type="button" onclick="careerNickAsk()">${L().ccNickAsk}</button>`}
      <button type="button" onclick="careerPhotoPick()">${L().ccPhotoPick}</button>
      ${pl.photo ? `<button type="button" onclick="careerPhotoSet(null)">${L().ccPhotoClear}</button>` : ''}
      <input type="file" id="chPhotoInput" accept="image/*" style="display:none" onchange="careerPhotoChosen(this)">
    </div>`;
}
/* Плитка своей точки: где стоит метка, сколько на ней ауры и чем стоит переезд.

   Карта раскрывается прямо в плитке — той же сеткой и тем же артом, что и
   пикер в прогоне, чтобы «моя точка» на хабе и «моя точка» на высадке были
   одним и тем же прямоугольником, а не двумя разными представлениями. Сетка
   строится под дуо (squadSize сезона), потому что метка живёт в наборе, а не
   в дроблёной соло-сетке — см. careerSpotIndexOf. */
/* Кусок острова одной коробки. Отдельного арта у точек нет и рисовать его не
   из чего, поэтому это сама карта: background-size растягивает её так, чтобы
   коробка заняла окно, а background-position ставит её центр в центр окна.
   Проценты позиции считаются от «свободного хода» фона (100-w), иначе край
   острова уезжает — на крайних коробках это видно сразу. */
/* Отношение сторон кадра с куском острова и то, какую его долю занимает
   коробка. Живут здесь и в CSS одним числом: по ним считается зум, поэтому
   вёрстка и арифметика обязаны совпадать.

   Его образец, 23 августа (кроп вокруг Lifty Lodge, присланный в Notion):
   почти квадратный кадр, место занимает почти всё, название POI читается.
   Широкий 16/9 с коробкой в половину кадра давал не это — на нём POI терялся
   среди соседей. */
const CC_SPOT_SHOT_RATIO=4/3, CC_SPOT_SHOT_FILL=78;
function careerSpotShotHTML(i, set, cls, ratio){
  /* ratio — отношение сторон КАДРА, в котором картинка будет показана.
     Брать его из константы вслепую нельзя: кнопка выбора рисует широкий кадр
     (16/7), а зум, посчитанный под 4/3, оставлял сверху полосу пустоты —
     кадр вылезал за край карты. */
  const RATIO=ratio||CC_SPOT_SHOT_RATIO;
  // Ключ хранения может быть островом ('r12'), а сетка и картинка — у круга.
  const key=careerSpotGrid(set||careerBrSet());
  const z=(ZONE_SETS[key]||[])[i];
  if(!z) return '';
  const art=MAP_ART[key]||MAP_ART.m2;
  /* Насколько приближать — считается по обеим осям, иначе рамка не влезает.

     Две прошлые версии промахнулись каждая по-своему: первая тянула коробку
     во весь кадр (зум до шести) и остров превращался в мыло — карта всего
     около тысячи пикселей по ширине; вторая считала зум только по ширине, и
     на низком широком кадре рамка вылезала сверху и снизу, оставляя на
     картинке две вертикальные полосы вместо квадратика.

     Кадр теперь с фиксированным отношением сторон (CC_SPOT_SHOT_RATIO), и
     зум берётся такой, чтобы коробка заняла CC_SPOT_SHOT_FILL процентов кадра
     по той стороне, которая упирается первой — то есть почти весь кадр, как
     на его образце: место крупно, с названием POI, а не точка среди острова. */
  const ar=String(MAP_ASPECT[key]||'1100/970').split('/');
  const hOverW=(Number(ar[1])||970)/(Number(ar[0])||1100);
  const byW=CC_SPOT_SHOT_FILL/Math.max(z.w, 3);
  const byH=CC_SPOT_SHOT_FILL/(Math.max(z.h, 3)*hOverW*RATIO);
  const zoom=Math.max(1.2, Math.min(9, Math.min(byW, byH)));
  /* И на куске нарисован тот самый квадратик, который выбираешь, — правка. Ради него кадр устроен не фоном, а вложенным слоем:
     фон (background-position) умеет только двигать картинку, и посчитать в
     процентах кадра, где на нём оказалась коробка, нельзя — высота фона
     зависит от ширины плитки, которая в вёрстке неизвестна.

     Слой же — это сама карта целиком, растянутая в zoom раз, с собственным
     aspect-ratio острова. Внутри него координаты те же, что в ZONE_SETS, то
     есть рамка ставится ровно по z.x/z.y/z.w/z.h, а translate(-cx%,-cy%)
     подводит центр коробки к центру кадра: проценты в translate считаются от
     размера самого слоя, поэтому это работает при любой ширине плитки. */
  /* Куда смотрит кадр. Центр коробки — но не ближе к краю карты, чем половина
     видимого окна, иначе у береговых точек в кадр заезжает пустота: зона 18
     стоит у самого левого края, и первая версия рисовала слева чёрную
     полосу. Прижатый кадр показывает ту же коробку, просто не по центру —
     ровно так же ведёт себя любая карта, доехавшая до своего края. */
  const halfW=Math.min(50, 50/zoom);
  const halfH=Math.min(50, 50/(zoom*hOverW*RATIO));
  const cx=clamp(z.x+z.w/2, halfW, 100-halfW);
  const cy=clamp(z.y+z.h/2, halfH, 100-halfH);
  const asp=MAP_ASPECT[key]||'1100/970';
  return `<div class="cc-spot-shot${cls?' '+cls:''}">
    <div class="cc-spot-shot-map" style="width:${(zoom*100).toFixed(0)}%;aspect-ratio:${asp};
      background-image:url('${art}');
      transform:translate(${(-cx).toFixed(2)}%, ${(-cy).toFixed(2)}%);">
      <i class="cc-spot-shot-box" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;"></i>
    </div></div>`;
}
/* Аура полосой, как энергия — правка: «ауру сделай полосочку
   тип энергии». Устройство то же, что у полосы дня в шапке (.ch-en-bar):
   дорожка, заливка по доле и число справа, — только цвет свой, бирюзовый:
   жёлтый в этом интерфейсе уже занят энергией, и две жёлтые полосы читались бы
   как одна и та же величина. */
function careerSpotAuraBarHTML(a){
  const pct=Math.round(clamp(a/CC_SPOT_AURA_MAX, 0, 1)*100);
  return `<span class="cc-aura-row"><span class="cc-aura-bar${a?'':' out'}">`+
    `<i style="width:${pct}%"></i></span>`+
    `<b class="${a?'':'cc-aura-none'}">${a}</b></span>`;
}
// Остров целиком, миниатюрой: тем же кадром, что и вырезка точки, только
// карта не приближена — видно, куда именно откроется выбор.
function careerIslandThumbHTML(set, cls, mark){
  // Ключ хранения может быть островом ('r12'), а сетка и картинка — у круга.
  const key=careerSpotGrid(set||careerBrSet());
  const art=MAP_ART[key]||MAP_ART.m2;
  // mark — номер коробки в сетке острова: на миниатюре ставится её рамка, так
  // видно, где твоя точка на всём острове (заголовок вопроса о высадке).
  const z=mark!=null ? (ZONE_SETS[key]||[])[mark] : null;
  const box=z ? `<i class="cc-spot-shot-box" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;"></i>` : '';
  return `<div class="cc-spot-shot${cls?' '+cls:''}">
    <div class="cc-spot-shot-map" style="width:100%;aspect-ratio:${MAP_ASPECT[key]||'1100/970'};
      background-image:url('${art}'); transform:translate(-50%, -50%);">${box}</div></div>`;
}
// Место живой коробки в сетке острова (ZONE_SETS): сетка вечера бывает урезана
// под лобби, и своего номера у коробки нет — ищется по координатам.
function ccZoneGridIndex(zone, set){
  if(!zone) return -1;
  const key=careerSpotGrid(set||careerBrSet());
  return (ZONE_SETS[key]||[]).findIndex(z=>Math.abs(z.x-zone.x)<0.01 && Math.abs(z.y-zone.y)<0.01);
}
// Картинки заголовка вопроса о высадке: слева своя точка, справа остров с её
// рамкой. Без дома — ничего: показывать нечего.
function ccDropSideHTML(home, set){
  const at=ccZoneGridIndex(home, set);
  if(at<0) return null;
  return {left:careerSpotShotHTML(at, set, '', 1), right:careerIslandThumbHTML(set, '', at)};
}
// Чего стоит лут коробки — теми же очками, что видит пикер на высадке.
function careerSpotPointsOf(i, set){
  const p=careerSpotPowOf(i, set);
  return p==null ? '-' : L().landingPoints(p);
}
/* Сила, которую точка даёт команде на вечер (applyLandingPow: очки точки идут в силу
   один к одному). null — точки нет на загруженном острове. */
function careerSpotPowOf(i, set){
  // Ключ хранения может быть островом ('r12'), а сетка и картинка — у круга.
  const key=careerSpotGrid(set||careerBrSet());
  if(!(ZONE_SETS[key]||[])[i]) return null;
  /* Считается по САМОМУ острову, а не по загруженному в игру: выбор спота открывает и
     острова других сезонов, и там подпись силы была только у мифических точек (скрин
     Notion «29», Chapter 5 S1 — у обычных коробок голый номер). */
  return zonePointsOfSet(key)[i];
}
/* Сила каждой коробки острова — то же правило, что в useLandingSet: место в рейтинге
   своего острова даёт 1..LANDING_POINTS_MAX, мифическая точка — максимум плюс CC_MYTHIC_POW. */
const ZONE_POINTS_CACHE={};
function zonePointsOfSet(set){
  if(ZONE_POINTS_CACHE[set]) return ZONE_POINTS_CACHE[set];
  const stats=ZONE_STATS[set]||[];
  const rs=(ZONE_SETS[set]||[]).map((z,i)=>{ const r=(stats[i]||{}).r; return r!=null ? r : z.r; });
  const rated=rs.filter(v=>v!=null).sort((a,b)=>a-b);
  const myth=CC_MYTHIC_POI[set]||{};
  return ZONE_POINTS_CACHE[set]=rs.map((r,i)=>{
    if(myth[i]) return LANDING_POINTS_MAX+CC_MYTHIC_POW;
    if(r==null || !rated.length) return 1;
    const pct=rated.filter(v=>v<r).length/rated.length;
    return Math.max(1, Math.min(LANDING_POINTS_MAX, 1+Math.floor(pct*LANDING_POINTS_MAX)));
  });
}
/* Острова, на которых у карьеры может быть дом.

   Не один: год играется не только на карте сезона. Релоад — свой круг со
   своими островами, и метка там нужна ровно так же — правка:
   «ещё для релоад карты нужно добавить». Их четыре, потому что четыре сетки:
   арт у кубков 1-2 и 3-4 общий (map-reload-a и -b), но ZONE_SETS у каждого
   свой — от двенадцати боксов до пятнадцати, — и метка привязана к сетке, а
   не к картинке.

   Карта сезона идёт первой и подписана сезоном, а не ключом: игрок знает
   «этот год», а не «m2». */
/* Карт под дом ровно три, и это те три, что он назвал 24 августа: «1 сезон —
   выбрать локацию; 2 — выбрать локацию на релоад 1-2, там одна карта, Слюрпи;
   3-4 — локация на карте Стронгхолд».

   Кругов Релоада четыре, а островов у них два: первый и второй играются на
   одном, третий и четвёртый на другом. Раньше плитка предлагала пять карт на
   три спота — то есть предлагала выбрать между первым и вторым кругом, хотя
   это одна и та же карта, и дом на ней один. Теперь острова и есть строки:
   три карты, три дома, выбирать не из чего — и это ровно то, что он описал.

   key — ключ хранения (остров), grid — сетка, по которой рисуется карта:
   у круга своя опубликованная дроп-карта, и показывать надо какую-то одну. */
// Какие ключи Reload-меток нужны году: по вечерам его календаря (careerNightSpotKey). Кэш на год.
let _CC_RELOAD_SPOT_KEYS={};
function ccYearReloadSpotKeys(){
  const y=ccCalYear();
  if(_CC_RELOAD_SPOT_KEYS[y]) return _CC_RELOAD_SPOT_KEYS[y];
  const out={};
  if(y>=2026){ out.r12=true; out.r34=true; }
  try{
    careerYearDays().forEach((list, d)=>list.forEach(e=>{
      const k=careerNightSpotKey({type:e.kind, day:d, id:e.id, title:e.title});
      if(k==='r12' || k==='r34') out[k]=true;
    }));
  }catch(e){ return out; }
  return (_CC_RELOAD_SPOT_KEYS[y]=out);
}
// Ключ спота формата на острове: 'f3@m1'. См. careerSpotSets.
/* Метка формата открывается вместе со сбором состава (его слово 8.10: «метку на карте можно поставить тогда, когда
   тиммейта искать можно будет — трио, например, в начале сезона можно поставить, хотя турниров ещё долго не будет»):
   за CC_ROSTER_WEEK дней до первого вечера формата, как кнопка «Собрать состав». Текущий формат открыт всегда. */
function ccFmtOpenFrom(f){
  if(f===careerSquadSize()) return null;
  const next=(typeof ccFormatNext==='function') ? ccFormatNext(f) : null; if(!next) return null;
  const from=ccAddDays(next, -CC_ROSTER_WEEK);
  return careerToday()>=from ? null : from;
}
function ccFmtSpotKey(f, isl){ return 'f'+f+'@'+(isl||careerBrSet()); }
function ccIsFmtSpotKey(k){ return /^f[234]@/.test(String(k||'')); }
function careerSpotSets(){
  const out=[{key:careerBrSet(), grid:careerBrSet(), label:L().ccSpotSeasonTab}];
  /* Карты Reload под метку — в тот год, где у карьеры есть вечера на них. Стояло «только
     2026-й»: тогда в 2024/2025 Reload-вечеров не было, а с архивом капов они пришли
     (S31 Reload Cash Cup, S37 Reload Quick Cup, Cracked Cup) — и окно «поставь метку»
     открывало карту, которой нет в списке. Отзыв 30.09: «доходишь до турниров в релоуде —
     не можешь поставить метку на карте». */
  const rk=ccYearReloadSpotKeys();
  if(ZONE_SETS.r1 && rk.r12) out.push({key:'r12', grid:'r1', label:L().ccSpotReloadA});
  if(ZONE_SETS.r3 && rk.r34) out.push({key:'r34', grid:'r3', label:L().ccSpotReloadB});
  /* Четвёртая карта — СОЛО. Отзыв: «карты почему-то 3, до сих
     пор нет 4 для соло». Solo Series не командный турнир: точка на нём у
     каждого своя, хранится лично (cr.soloSpots, не ключ команды) и в три
     командных слота не считается. Остров — сезонный.

     ДО 2 СЕНТЯБРЯ ЭТА КАРТА БЫЛА ТОЛЬКО В КОМАНДЕ, и это была дыра: в
     одиночной карьере соло-вечер садился на общий сезонный дом — тот же, что
     дуо-турниры, — и выбрать под соло отдельную метку было негде. Правка:
     «чтоб можно было выбрать метку на карте в соло и дуо карьере». Личное
     хранение при этом ни при чём: в одиночной карьере личное и командное — это
     один человек, а вот ТУРНИР другой, и точка на нём своя. */
  // Остров — сезонный в дуо-год, ближайшего соло-вечера в трио-год: см. careerSoloSet.
  out.push({key:'solo', grid:careerSoloSet(), label:L().ccSpotSoloTab});
  /* Споты форматов (его слово 30.09: «споты пишет, в career сквада и трио нет почему-то»): трио- и
     сквад-капы в дуо-год (и дуо-капы в трио-год) садились на сезонный дом. Свой ключ на формат и
     остров — 'f3@m1': командный склад (cr.spots, общий в игре вдвоём), слотов не занимает. */
  try{
    const isl=careerBrSet(), cur=careerSquadSize(), NAME={2:L().lfRosterDuo, 3:L().lfRosterTrio, 4:L().lfRosterSquad};
    // И сегодняшний турнир по приглашению (Notion 27.10, скрин 16: сквад-LAN «Lost Legends» в дуо-год — ccFormatNext
    // приглашения пропускает, вкладки не было, и окно метки звало на карту «» без выхода).
    const vt=typeof careerVictoryOn==='function' ? careerVictoryOn(careerToday()) : null, MODE={2:'duo', 3:'trio', 4:'squad'};
    [2,3,4].forEach(f=>{ if(f!==cur && ((typeof ccFormatNext==='function' && ccFormatNext(f) && !ccFmtOpenFrom(f)) || (vt && vt.mode===MODE[f]))) out.push({key:ccFmtSpotKey(f, isl), grid:isl, label:NAME[f]}); });
  }catch(e){}
  /* Метка сборной на Кубок наций — своя (cr.natSpots), на сезонном острове, в командные слоты не
     считается; карта рисуется под сквады (ccSquadKeep). Появляется, пока висит карточка сборной.
     Отзыв: «где команда сборной, должен быть выбор локации». */
  if(typeof ccNatCardOn==='function' && ccNatCardOn()) out.push({key:'nations', grid:careerBrSet(), squad:true, label:L().ccSpotNationsTab});
  return out;
}
function careerSpotStore(key){
  const cr=CAREER && CAREER.career;
  if(!cr) return {};
  if(key==='solo'){
    /* Соло-метка — на каждом острове своя, как командные (cr.spots по набору):
       остров под соло-вкладкой меняется вместе с сезоном (m1 → m2 → s42, см.
       careerSoloSet), а одна запись на все острова читалась бы по координатам
       на чужой сетке — не той коробкой или никакой. Склад: cr.soloSpots[остров]
       = {solo:[…]}. Старый формат cr.soloSpots.solo (до 16.09) переезжает на
       текущий остров — на каком его ставили, сейв не помнит. */
    if(!cr.soloSpots) cr.soloSpots={};
    const isl=careerSoloSet();
    if(cr.soloSpots.solo){
      if(!cr.soloSpots[isl]) cr.soloSpots[isl]={solo:cr.soloSpots.solo};
      delete cr.soloSpots.solo;
    }
    if(!cr.soloSpots[isl]) cr.soloSpots[isl]={};
    return cr.soloSpots[isl];
  }
  if(key==='nations'){
    if(!cr.natSpots) cr.natSpots={};
    const isl=careerBrSet();
    if(!cr.natSpots[isl]) cr.natSpots[isl]={};
    return cr.natSpots[isl];
  }
  return careerSpots();
}
// Сетка, по которой рисуется остров под этим ключом хранения.
function careerSpotGrid(key){
  if(ccIsFmtSpotKey(key)) return String(key).split('@')[1];
  const s=careerSpotSets().find(x=>x.key===careerSpotKey(key));
  return (s && s.grid) || careerSpotKey(key);
}
let CC_SPOT_OPEN=false, CC_SPOT_PEEK=null, CC_SPOT_SET=null;
// Какой остров сейчас показывает плитка. По умолчанию — тот, на котором
// играется сезон; если сохранённый ключ устарел (год сменил карту), молча
// возвращаемся к сезонному.
function careerSpotShown(){
  const sets=careerSpotSets();
  return (CC_SPOT_SET && sets.some(s=>s.key===CC_SPOT_SET)) ? CC_SPOT_SET : sets[0].key;
}
// Открыть карту нужного острова прямо с его прямоугольника — и вернуться в
// плитку, как только лока выбрана (careerSpotChoose закрывает карту сам).
function careerSpotOpenFor(key){
  CC_SPOT_SET=key; CC_SPOT_PEEK=null; CC_SPOT_OPEN=true;
  careerRenderHub(CH_TAB);
}
function careerSpotToggle(){ CC_SPOT_OPEN=!CC_SPOT_OPEN; CC_SPOT_PEEK=null; careerRenderHub(CH_TAB); }
// Клик по коробке сперва показывает её, а переезжает вторая кнопка: переезд
// жжёт ауру, и делать это одним промахом по карте нельзя.
function careerSpotPeek(i){ CC_SPOT_PEEK=(CC_SPOT_PEEK===i?null:i); careerRenderHub(CH_TAB); }
function careerSpotTileHTML(){
  if(!CAREER || !CAREER.career || careerRetired()) return '';
  const set=careerSpotShown();
  // Показанный остров и сетка, по которой он рисуется, — разные ключи: у
  // Релоада один остров на два круга, а дроп-карта у каждого своя.
  const gridKey=careerSpotGrid(set);
  const grid=ZONE_SETS[gridKey]||[];
  const stats=ZONE_STATS[gridKey]||[];
  const s=careerSpotOn(set);
  const aura=careerSpotAura(set);
  /* Вкладок-чипов над плиткой больше нет — правка (скрин с
     обведёнными RELOAD 1/2/4): «пусть тут название карт над прямоугольниками,
     нажимаешь на прямоугольник — можешь сменить локу». Название карты стоит
     над своим прямоугольником, и он же кнопка: клик открывает карту этого
     острова, выбор возвращает обратно в плитку. */
  const head=`<h4>${L().ccSpotTitle}</h4>`;
  if(!CC_SPOT_OPEN){
    /* Три спота — три карточки, и каждая на своей карте: карта, коробка,
       квадратик и своя аура. Пустые показываются тоже, чтобы было видно,
       сколько домов ещё можно поставить и что карт в году больше, чем
       спотов, — выбирать приходится. */
    /* Карт три и спотов три, поэтому строка плитки — это просто список карт:
       занятая показывает дом, свободная — свободный слот. И то и другое
       нажимается и открывает СВОЮ карту.

       Правка: «пусть игрок сам нажмёт на квадратик, где
       написано, что слот свободен, и он выберет просто локацию». До неё
       пустой квадрат был картинкой, а звала на карту отдельная строка кнопок
       под рядом — то есть нажимать надо было не туда, куда смотришь. Строку
       убрал: она называла ровно те же карты, что пустые квадраты, и теперь
       дублировала бы их. */
    const cards=careerSpotSets().map(t=>{
      const sp=careerSpotList(t.key)[0];
      if(!sp)
        return `<div class="cc-spot-card cc-spot-card-empty"
          onclick="careerSpotOpenFor(\'${t.key}\')" title="${esc(L().ccSpotPickHere)}">
          <b class="cc-spot-card-map">${t.label}</b>
          <span>+</span><em>${L().ccSpotSlotFree}</em></div>`;
      const a=sp.aura||0;
      return `<div class="cc-spot-card" onclick="careerSpotOpenFor(\'${t.key}\')"
        title="${esc(L().ccSpotChange)}">
        <b class="cc-spot-card-map">${t.label}</b>
        ${careerSpotShotHTML(sp.i, t.key)}
        <div class="cc-spot-card-in">
          <span class="cc-spot-card-zone">${L().landingZoneSuffix(sp.i+1)}${
            (CC_MYTHIC_POI[careerSpotGrid(t.key)]||{})[sp.i] ? ' · ⚡ '+esc(CC_MYTHIC_POI[careerSpotGrid(t.key)][sp.i]) : ''}</span>
          ${careerSpotAuraBarHTML(a)}
        </div></div>`;
    });
    const used=careerSpotUsed();
    return `<div class="ch-tile">${head}
      <div class="cc-spot-cards">${cards.join('')}</div>
      <div class="ch-row"><em>${L().ccSpotSlotsRow}</em><b>${used}/${CC_SPOT_SLOTS}</b></div>
      <div class="ch-hint">${aura ? L().ccSpotAuraOn(aura) : L().ccSpotAuraNone}</div>
      <!-- Имя видно там же, где аура: иначе прибавка за гранд-финал и слот на
           LAN работала бы молча, а игрок читал бы «пока никто не знает, чьё это
           место» ровно в тот вечер, когда его дом обходят. -->
      ${careerRenown() ? `<div class="ch-hint">${L().ccSpotRenown(careerRenown())}</div>` : ''}
      <div class="ch-hint">${L().ccSpotHow}</div></div>`;
  }
  const art=MAP_ART[gridKey]||MAP_ART.m2;
  const asp=MAP_ASPECT[gridKey]||'1100/970';
  /* Картинка выбранной коробки — просьба: «пусть будет
     картинка когда выбираешь локу в карьере». Отдельного арта у точек нет и
     взять негде, поэтому это сама карта, увеличенная и сдвинутая так, чтобы в
     окне стоял именно этот прямоугольник: background-size в процентах от
     размера окна и background-position по центру коробки. Настоящий кусок
     острова, а не иконка — видно, куда садишься. */
  const list=careerSpotList(set);
  const slotOf=i=>list.findIndex(x=>x.i===i);
  const peek=CC_SPOT_PEEK!=null ? grid[CC_SPOT_PEEK] : null;
  /* Что предлагает превью. На своей коробке — снять дом. На чужой: если на
     этой карте дом уже стоит, это переезд внутри карты и он жжёт её ауру;
     если карта пустая, нужен свободный спот, а когда все три заняты —
     предлагаем освободить одну из других карт, называя её и её ауру. */
  const peekBtns=(()=>{
    if(CC_SPOT_PEEK==null) return '';
    const at=slotOf(CC_SPOT_PEEK);
    if(at>=0) return `<button class="ch-decline" onclick="careerSpotDrop()">${
      L().ccSpotDrop}</button>`;
    if(list.length || careerSpotRoom(set))
      return `<button class="ch-sign" onclick="careerSpotChoose(${CC_SPOT_PEEK})">${
        list.length ? L().ccSpotMove : L().ccSpotTake}</button>`;
    return `<div class="ch-hint">${L().ccSpotNoRoom}</div>`+
      careerSpotSets().filter(t=>careerSpotList(t.key).length)
        .map(t=>{ const sp=careerSpotList(t.key)[0];
          return `<button class="ch-sign cc-spot-swap"
            onclick="careerSpotFree('${t.key}', ${CC_SPOT_PEEK})">${
            L().ccSpotFreeUp(t.label, sp.aura||0)}</button>`; }).join('');
  })();
  const peekHTML=peek
    ? `<div class="cc-spot-peek">${careerSpotShotHTML(CC_SPOT_PEEK, set)}
        <div class="cc-spot-peek-in">
          <b>${L().landingZoneSuffix(CC_SPOT_PEEK+1)}</b>
          <div class="ch-row"><em>${L().ccSpotLoot}</em><b>${
            careerSpotPointsOf(CC_SPOT_PEEK, set)}</b></div>
          ${(CC_MYTHIC_POI[gridKey]||{})[CC_SPOT_PEEK] ? `<div class="ch-row cc-spot-mythic-row"><em>⚡ ${
            L().ccRaritymythic}</em><b>${esc(CC_MYTHIC_POI[gridKey][CC_SPOT_PEEK])}</b></div>
            <div class="cc-spot-drops">${ccMythicDrops(gridKey, CC_MYTHIC_POI[gridKey][CC_SPOT_PEEK]).map(d=>
              `<span><img class="zp-ic${d.med?' zp-med':''}" src="${d.src}" alt="" decoding="async">${esc(d.n)}</span>`).join('')}</div>` : ''}
          ${peekBtns}
        </div></div>`
    : `<div class="ch-hint">${L().ccSpotTap}</div>`;
  /* Мифические POI (CC_MYTHIC_POI) подписаны и здесь: отзыв 29.09 «когда выбираешь
     спот не показывает» — на карте вечера молния с боссом была, а в выборе дома
     стоял голый номер коробки. И сквадный набор их не теряет (ccKeepMythic). */
  const myth=CC_MYTHIC_POI[gridKey]||{};
  const keepSq=(careerSpotSets().find(t=>t.key===set)||{}).squad
    ? new Set([...ccSquadKeep(gridKey), ...Object.keys(myth).map(Number)]) : null;
  const boxes=grid.map((z,i)=>{
    if(keepSq && !keepSq.has(i)) return '';
    const at=slotOf(i);
    const mine=at>=0;
    // На коробке только молния: имя в узкой подписи режется в «11 · …», полностью оно в превью.
    const boss=myth[i] ? (ccMythicIconsHTML(gridKey, myth[i]) || ' ⚡') : '';
    // Сколько силы даёт коробка — числом рядом с номером («11 · +7»), слово «сила» в превью.
    const pw=careerSpotPowOf(i, set);
    const powTag=pw!=null ? ' · '+L().landingPoints(pw) : '';   // «4 · +3 силы» — видно, что это сила
    return `<div class="land-zone${mine?' cc-spot-mine':''}${CC_SPOT_PEEK===i?' cc-spot-peeked':''}${myth[i]?' cc-spot-mythic':''}"
      title="${L().landingZoneSuffix(i+1)}"
      onclick="careerSpotPeek(${i})"
      style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;${
        mine?'border-color:var(--accent);box-shadow:inset 0 0 0 1px rgba(0,0,0,.55),0 0 0 2px rgba(0,208,168,.35);'
            :'border-color:rgba(10,10,10,.75);background:transparent;'}"><div
      class="land-zone-label"${mine?' style="color:var(--accent);font-weight:900;"':''}>${
      (mine ? L().ccSpotTag(list[at].aura||0) : (i+1))+powTag+boss}</div>${ccChestBadgeHTMLAt(gridKey, i)}</div>`;
  }).join('');
  // Открытая карта называет себя: сюда попадают кликом по прямоугольнику, и
  // без подписи не видно, чей это остров.
  const mapName=(careerSpotSets().find(t=>t.key===set)||{}).label||'';
  return `<div class="ch-tile">${head}
    <div class="cc-spot-open-head"><b>${mapName}</b>
      <span>${L().ccSpotHint}</span></div>
    <div class="map-frame cc-spot-map" style="position:relative;width:100%;aspect-ratio:${asp};border-radius:8px;
         background:#000;border:1px solid var(--line);overflow:hidden;margin-top:8px;">
      <img src="${art}" alt="" decoding="async"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">
      <div style="position:absolute;inset:0;">${boxes}</div>
      ${ccChestToggleHTML()}
    </div>
    ${peekHTML}
    <button class="ch-decline" onclick="careerSpotToggle()">${L().ccSpotBack}</button></div>`;
}
/* Клик по коробке. Переезд жжёт ауру, поэтому он спрашивает — и спрашивает
   только тогда, когда есть что терять: первая метка и возврат на своё же
   место ставятся молча. */
/* Поставить дом на этой карте. Пустая карта при свободном споте берётся
   молча; переезд внутри карты спрашивает и называет ауру, которая сгорит. */
function careerSpotChoose(i){
  const set=careerSpotShown();
  const old=careerSpotList(set)[0];
  if(old && old.i===i) return;
  // Выбрал — и сразу назад в карьеру, к прямоугольникам: отзыв, «когда
  // меняешь локу сразу возвращает в карьеру и можешь с другими то же самое».
  const done=()=>{ careerSpotSet(i, set); CC_SPOT_PEEK=null; CC_SPOT_OPEN=false;
                   careerRenderHub(CH_TAB); };
  if(old && (old.aura||0)>0) ccAsk(L().ccSpotMoveAsk(old.aura), done);
  else done();
}
// Снять дом с этой карты — спот возвращается в общий запас.
function careerSpotDrop(){
  const set=careerSpotShown();
  const sp=careerSpotList(set)[0];
  if(!sp) return;
  const done=()=>{ careerSpotClear(set); CC_SPOT_PEEK=null; CC_SPOT_OPEN=false;
                   careerRenderHub(CH_TAB); };
  if((sp.aura||0)>0) ccAsk(L().ccSpotDropAsk(sp.aura), done);
  else done();
}
/* Освободить спот на ДРУГОЙ карте и тут же занять коробку на этой. Нужен,
   когда все три заняты: иначе игрок должен был бы сам догадаться сходить на
   ту карту и снять дом там. */
function careerSpotFree(from, i){
  const to=careerSpotShown();
  const sp=careerSpotList(from)[0];
  const done=()=>{ careerSpotClear(from); careerSpotSet(i, to);
                   CC_SPOT_PEEK=null; CC_SPOT_OPEN=false; careerRenderHub(CH_TAB); };
  if(sp && (sp.aura||0)>0) ccAsk(L().ccSpotDropAsk(sp.aura), done);
  else done();
}
function careerAgentTileHTML(){
  const on=careerAgent();
  if(on){
    const t=careerAgentTerms();
    // The face off the roster, the terms off the contract. See ccAgentFace.
    const f=ccAgentFace(on);
    return `<div class="ch-tile ch-tile-agent">
      <h4>${L().ccAgentTag}</h4>
      <div class="ch-orghead"><span class="ch-agent-av">${
        f.photo ? `<img src="${PHOTO_DIR}${esc(f.photo)}" alt="" onerror="this.remove()">` : ''}${
        esc(String(on.name||'').slice(0,2).toUpperCase())}</span><b>${esc(on.name)}</b>${
        f.at ? `<em class="ch-agent-at">@${esc(f.at)}</em>` : ''}</div>
      <div class="ch-row"><em>${L().ccAgentCutRow}</em><b>${Math.round(t.cut*100)}%</b></div>
      <div class="ch-row"><em>${L().ccAgentReachRow}</em><b class="ch-goal-met">+${t.reach}</b></div>
      <div class="ch-row"><em>${L().ccAgentWageRow}</em><b class="ch-goal-met">+${
        Math.round((t.wage-1)*100)}%</b></div>
      <div class="ch-row"><em>${L().ccAgentPaid}</em><b>$${
        ccNum((CAREER.career.agentPaid||0))}</b></div>
      <!-- Просьба найти клуб — с плитки, а не только из переписки. Правка: «пусть у менеджера будет кнопка, чтоб игрок запросил офер
           у орги, и это сообщение автоматически пишется в лс менеджеру». Пока
           просьба в работе — вместо кнопки строка о том, до какого числа он
           ходит; так же, как в самом диалоге. -->
      ${careerPitchOn()
        ? `<div class="ch-row"><em>${esc(careerPitchClub()||'')}</em><b>${
            L().ccPitchOn(ccDayLabel(careerPitchDue()))}</b></div>`
        : (careerPitchClubs().length
            ? `<button class="ch-swap" title="${esc(L().ccPitchWhat)}"
                onclick="careerPitchAsk()">${L().ccPitchBtn}</button>`
            : '')}
      <button class="ch-decline" onclick="careerEndAgent()">${L().ccAgentEnd}</button>
    </div>`;
  }
  const ovr=CAREER.player.ovrExact!=null ? CAREER.player.ovrExact : CAREER.player.ovr;
  const waiting=careerDms().find(t=>t.who && t.who.agent);
  return `<div class="ch-tile ch-tile-agent">
    <h4>${L().ccAgentTag}</h4>
    <div class="ch-empty">${waiting ? L().ccAgentWrote
      : ovr<CC_AGENT_FROM ? L().ccAgentFrom(CC_AGENT_FROM) : L().ccAgentNone}</div>
    <button class="ch-swap" onclick="ccAgentPickOpen()">${L().ccAgentSee}</button>
  </div>`;
}
/* Плитка команды: кто в лобби и как оттуда выйти.

   Показывается только то, что напарнику и так видно по спеке: ник, флаг,
   овер, роль. Деньги, контракт и инбокс — личное, и в плитку не попадают.
   Код лобби здесь же, потому что он и есть приглашение: аккаунтов в режиме
   нет, код пересылается как угодно. Сторож — tools/check-mp-tile.js. */
function careerMpTileHTML(){
  if(!ccMpOn()){
    // Команду завести не вышло — плитка всё равно стоит и говорит почему. См. ccMpEnter.
    if(!CC_MP_FAIL) return '';
    return `<div class="ch-tile ch-tile-org">
      <h4>${L().ccMpTitle}</h4>
      <div class="ch-row"><em>${L().ccMpLink}</em><b>${L().ccMpFailLink}</b></div>
      <div class="ch-empty">${esc(CC_MP_FAIL.role==='b'
        ? L().ccMpFailJoin(CC_MP_FAIL.code) : L().ccMpFailNew)}</div>
      <button class="ch-sign" onclick="ccMpRetry()">${L().ccMpRetry}</button>
      <button class="ch-decline" onclick="ccMpFailOff()">${L().ccMpFailOff}</button>
    </div>`;
  }
  const peer=(typeof MP!=='undefined' && MP.peer) || null;
  const code=CAREER.career.mp.code;
  // Связь — первой строкой: пока её нет, всё остальное на плитке не значит
  // ничего, потому что вечер не начнётся. См. ccMpWhy.
  const why=ccMpWhy();
  return `<div class="ch-tile ch-tile-org">
    <h4>${L().ccMpTitle}</h4>
    <div class="ch-row"><em>${L().ccMpLink}</em><b class="${why?'':'ch-goal-met'}">${
      why || L().ccMpLive}</b></div>
    <div class="ch-row"><em>${L().ccMpCode}</em><b>${esc(code)}</b></div>
    ${ccMpInviteHTML(code)}
    ${peer
      ? `<div class="ch-orghead">${flagImg(peer.nat,15)}<b>${esc(peer.handle||'')}</b></div>
         <div class="ch-row"><em>${L().ccResPartner}</em><b>${peer.ovr||0}</b></div>
         <div class="ch-row"><em>${L().ccRole}</em><b>${esc(L()[peer.role]||peer.role||'')}</b></div>`
      : `<div class="ch-empty">${L().ccMpAlone}</div>`}
    <!-- Кого можно брать в это кресло. В дуо — никого, кресло напарника; в
         трио открыто одно кресло для взятого, и он общий. Правила его. См. careerSeatDm и ccMpBotSeats. -->
    <div class="ch-hint" style="margin:0;">${
      ccMpBotSeats()>0 ? L().ccMpThirdOk : L().ccMpOnlyMate}</div>
    <button class="ch-decline" onclick="careerPartAsk()">${L().ccMpPart}</button>
  </div>`;
}
function careerOrgTileHTML(){
  const org=CAREER.org, offers=CAREER.offers||[];
  /* СВОЯ ОРГАНИЗАЦИЯ — ЭТО НЕ КОНТРАКТ. Зарплата, доля, бонус, задача сезона и отступные
     существуют между игроком и клубом, который его нанял; со своим клубом их нет ни
     одной, и строки с нулями и прочерками врали бы про него. Плитка говорит то, что
     правда: чей герб, сколько людей и сколько в кассе, — а управление там же, где его
     построили, в магазине (careerClubHTML). */
  if(org && org.own){
    const club=careerClub();
    const T=L();
    return `<div class="ch-tile ch-tile-org">
      <h4>${T.ccOrg}</h4>
      <div class="ch-orghead">${careerCrestImg(org.name,30)}<b>${esc(org.name)}</b></div>
      <div class="ch-row"><em>${T.ccClubTitle}</em><b>${T.ccClubOwn}</b></div>
      ${club ? `<div class="ch-row"><em>${T.ccClubSeats(careerClubSeats(), CC_CLUB_SEATS)}</em><b></b></div>
      <div class="ch-row"><em>${T.ccClubCash}</em><b>$${ccNum(Math.round(club.cash||0))}</b></div>` : ''}
      <div class="ch-hint">${T.ccClubWhere}</div>
    </div>`;
  }
  /* КОМПАКТНАЯ ПЛИТКА КЛУБА (его Notion 8.10: «уменьшить организацию, чтоб стафф выглядел выше, и улучши дизайн орги»):
     было 13 строк и две кнопки во всю ширину — штаб уезжал за экран. Теперь шапка (герб, название, состав, подписчики),
     четыре ячейки главного (зарплата, доля клуба, задача, цель месяца), остальное — в «Подробнее», кнопки — в строку. */
  if(org){
    const T=L(), met=careerOrgGoalMet(), f=ccOrgFollowers(org.name, org.tier);
    const cell=(k, v, ok)=>'<span class="cc-orgc-cell'+(ok ? ' ok' : '')+'"><small>'+k+'</small><b>'+v+'</b></span>';
    const g=careerMonthGoal(), gOk=g && (g.paid||careerMonthGoalMet());
    const cost=careerBuyoutCost(), can=(CAREER.career.balance||0)>=cost;
    const row=(k, v)=>'<div class="ch-row"><em>'+k+'</em><b>'+v+'</b></div>';
    return `<div class="ch-tile ch-tile-org cc-orgc">
      <h4>${T.ccOrg}</h4>
      <div class="cc-orgc-head"><span class="cc-orgc-crest">${careerCrestImg(org.name, 52)}</span>
        <span class="cc-orgc-id"><b>${esc(org.name)}</b><small>${org.academy ? T.ccAcademy : T.ccMainRoster} · 👥 <span title="${f.est ? esc(T.ccOrgFansEst) : ''}">${ccOrgFolText(f)}</span></small></span>
        ${org.perk ? `<em class="ch-perk">${T['ccPerk'+org.perk]}</em>` : ''}</div>
      <div class="cc-orgc-cells">
        ${cell(T.ccWage, ccMoney(org.salary)+T.ccPerSeason)}
        ${cell(T.ccOrgCutRow, careerOrgCut() ? Math.round(careerOrgCut()*100)+'%' : '-')}
        ${cell(T.ccGoal, careerOrgGoalText(org.goal)+(met ? ' ✓' : ''), met)}
        ${g ? cell(T.ccMgTitle, careerMonthGoalText(g)+(g.bonus ? ' · '+ccMoney(g.bonus) : '')+(gOk ? ' ✓' : ''), gOk) : ''}
      </div>
      ${ccOrgGoalPickHTML()}
      ${ccMgPickHTML()}
      <details class="cc-orgc-more"><summary>${esc(T.ccOrgMore)}</summary>
        ${row(T.ccOrgMedia, esc(T.ccOrgMediaRow(ccNum(ccOrgMediaMonth(org.name, org.tier, org.academy)))))}
        ${row(T.ccOrgBonusRow, ccMoney(careerOrgBonus(org)))}
        ${(CAREER.career.orgCut||0) ? row(T.ccOrgCutPaid, '$'+ccNum(CAREER.career.orgCut||0)) : ''}
        ${row(T.ccPaid, ccMoney(org.paid||0))}
        ${org.since ? row(T.lfSince, org.since) : ''}
        ${!org.own ? row(T.ccOrgTermRow, esc(T.ccOrgTermLeft(ccOrgSeasonsLeft(org)))) : ''}
      </details>
      <div class="cc-orgc-btns">
        <button class="ch-decline"${can ? '' : ' disabled'} onclick="careerLeaveOrg()" title="${esc(T.ccBuyoutWhat)}">${T.ccBuyout(ccNum(cost))}</button>
        <button class="ch-swap" onclick="careerScoutToggle()">${CAREER.scoutOff ? T.ccScoutOn : T.ccScoutOff}</button>
      </div>
    </div>`;
  }
  if(offers.length){
    return `<div class="ch-tile ch-tile-org">
      <h4>${L().ccOffers}</h4>
      <div class="ch-hint">${careerWindowNow() ? L().ccOffersHint
        : L().ccWindowShut(ccDayLabel(careerWindowNext()||CC_YEAR_TO))}</div>
      ${offers.map((o,i)=>`<div class="ch-offer">
        <div class="ch-orghead">${careerCrestImg(o.name,26)}<b>${esc(o.name)}</b></div>
        <div class="ch-offer-terms"><span>${ccMoney(o.salary)}${L().ccPerSeason}</span>
          ${(f=>`<span title="${f.est ? esc(L().ccOrgFansEst) : ''}">👥 ${ccOrgFolText(f)} · ${esc(L().ccOrgSignRow(ccFollowers(ccOrgMediaSign(o.name, o.tier, o.academy))))} · ${esc(L().ccOrgMediaRow(ccNum(ccOrgMediaMonth(o.name, o.tier, o.academy))))}</span>`)(ccOrgFollowers(o.name, o.tier))}
          <span>${L().ccOrgBonusRow}: ${ccMoney(careerOrgBonusFor(o.salary))}</span>
          ${o.perk ? `<span class="ch-perk">${L()['ccPerk'+o.perk]}</span>` : ''}
          <span>${careerOrgGoalText(o.goal)}</span></div>
        <button class="ch-sign" onclick="careerSign(${i})">${L().ccSign}</button>
      </div>`).join('')}
      <button class="ch-decline" onclick="careerDeclineOffers()">${L().ccDecline}</button>
    </div>`;
  }
  /* Пустая плитка обязана сказать, почему она пустая, — и сказать правду.

     Причин три: окно закрыто, рейтинг ниже того, с которого вообще подписывают,
     или тебя просто ещё никто не позвал. Плитка знала первую и валила остальные
     две в одну строку «клубы смотрят с Дивизиона 3». Игроку с карточкой 99 в
     первом дивизионе она читалась как отказ: он этот порог прошёл давно, а
     мод объяснял ему, что он до него не дорос. Его сообщение, 21 августа: «в
     моменте дропнула орга и больше не могу искать, мол я не в д3».

     Клубы подписывают с третьего дивизиона и выше, то есть номер должен быть
     не больше трёх: первый старше третьего, и сравнение здесь именно такое. */
  const shut=!careerWindowNow();
  const pl=CAREER.player;
  const band=ccWageDiv(pl.ovrExact!=null ? pl.ovrExact : pl.ovr);
  const tooLow=!band || band>CC_CLUBS_FROM;
  /* Четвёртая причина пустой плитки — и до 26 августа она была немой:
     поиск выключен самим игроком.

     Переключатель стоял только в ветке с подписанным клубом. Его случай:
     нажал «не искать клуб», потом разорвал контракт — и включить обратно
     негде, а плитка при этом говорила «клубы тебя видят». Ни одного письма,
     и ни одной причины на экране. Теперь переключатель есть в обеих ветках,
     а строка говорит правду. */
  const off=ccScoutOff();
  return `<div class="ch-tile ch-tile-org">
    <h4>${L().ccOrg}</h4>
    <div class="ch-empty">${L().ccFreeAgent}</div>
    <div class="ch-hint" style="margin:0;">${off
      ? L().ccScoutOffHint
      : shut ? L().ccWindowShut(ccDayLabel(careerWindowNext()||CC_YEAR_TO))
      : tooLow ? L().ccFreeAgentHint
      : L().ccFreeAgentOpen}</div>
    <button class="ch-swap" onclick="careerScoutToggle()">${
      off ? L().ccScoutOn : L().ccScoutOff}</button>
  </div>`;
}

// Epic's own quotas, kept for the record. They are not what the hub prints any
// more: the cup this mode actually plays is 150 duos cutting to 50, and a tile
// promising "top 200" over a lobby where fifty advance is a tile that lies. The
// derivation from these numbers to that one is in the design doc.
const CAREER_CUT={1:'-', 2:'top 50', 3:'top 100', 4:'top 200', 5:'top 400'};

/* Calendar: the season on real months, one square per day, tournaments inside.
   Dates are this career's schedule, but weekdays follow Epic: FNCS divisional cups run Round 1 Monday and Round 2
   Tuesday at 19:00, Division 1 adds a Weekly Final on Saturday, Division 5 has no third round
   (S41_FNCSDivisionalCup_Division1/_Division5, Feb 2026). Major and Global Championship weekends are shaped here.
   The season opens on the first Monday of January and runs eleven weeks. */
/* The clock: cr.day (ISO date) is the only clock in the save. Week numbers are derived where needed so the two can't disagree.
   Career year is Mon 1 Dec 2025 to Sun 27 Sep 2026, 301 days = 43 weeks: from S39's first Performance Evaluation night to the Global Championship in Antwerp.
   The weeks between Paris (23 Aug) and Antwerp hold only training days and the 1 September wage. */
// 47, не 43: хвост года дотянут до Перфоманса 9 (22 октября, S42) — его
// Tracker-сейвы, 23 августа.
// 48, не 47: последний вечер года — финал FNCS Solos 27 октября (правила Epic
// от 1 сентября 2026), и неделя у него своя. См. CC_YEAR_TO.
// 50, не 48: за Solos — три субботы Кубка наций и церемония 15 ноября (отзыв
// «в конец года»). Выдумка режима, см. ccNationsBook.
// 52, не 50: FNCS Solo Reload 3–22 ноября, Кубок наций за ним, год до 29 ноября.
const CAREER_WEEKS=52;
// Недель в ГОДЕ карьеры: 2026-й — все 48, 2025-й короче (11 декабря — 7 сентября).
function ccYearWeeks(){ return (ccIs2025() || ccIs2024() || ccIs2023() || ccIs2022() || ccIs2021() || ccIs2020() || ccIs2019()) ? careerWeekIndex(ccYearTo()) : CAREER_WEEKS; }

function careerToday(){
  return (CAREER && CAREER.career && CAREER.career.day) || ccYearFrom();
}
function careerMonday(iso){
  const t=new Date(iso+'T00:00:00Z');
  // getUTCDay is 0 on Sunday, so Sunday steps back six days rather than none.
  t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7));
  return dateKey(t);
}
function careerWeekIndex(iso){
  const from=new Date(careerMonday(ccYearFrom())+'T00:00:00Z');
  const here=new Date(careerMonday(iso)+'T00:00:00Z');
  return Math.floor((here-from)/(7*86400000))+1;
}
// The date a career week starts on, for the screens that still think in weeks.
function careerWeekStart(week){
  return ccAddDays(careerMonday(ccYearFrom()), (week-1)*7);
}
// What the screens mean when they say "the week": where the clock is standing.
function careerWeek(){ return careerWeekIndex(careerToday()); }
// Which kinds a career can actually enter today. The divisional cup is the only
// one wired up; the Reload Opens belong here the moment they are — they are open
// qualifiers and take every division, which is the whole point of an open.
/* ---- The day itself -------------------------------------------------------

   Energy is three points and refills every morning. Unspent energy is lost: it
   shapes the day rather than carrying into the next one, so a week is seven
   small decisions instead of one long saving-up.

   A day with a tournament on it spends its energy there. A day without one asks
   the player what they are doing with it, and does not move on until they
   answer — a day nobody decided may as well not be in the calendar.

   Every option says what it gives, on its own face. The gains are small on
   purpose: a day is a day, and a career year is two hundred of them.
*/
// A hundred, because the bar in the header reads like a health bar and a health
// bar is out of a hundred. Nothing about the day changed with it: one press is
// still the whole day, so every option below costs the lot and the bar is full
// until the day is decided and empty afterwards.
const CC_ENERGY_DAY=100;
// A cup takes the day. Eleven games is the whole evening, and whatever the
// player might have squeezed in around it is not a thing that happens.
// A cup takes an evening out of the same store a training day comes from —
// eleven games is the heaviest thing in a week. Nothing reads this yet; the
// cup spends it where it is played, in runCareerCup.
const CC_TOURNEY_ENERGY=35;

/* What a day can be spent on.

   gain names the card numbers it moves and by how much. reach is followers,
   which nothing reads yet — the social spec owns that number — and it is written
   down here so the day that earns it does not have to be invented twice.

   Streaming is the one option that improves nothing. That is the trade the mode
   is about: reach pays, and the hours it takes are hours not spent getting
   better. It costs focus as well, which the next tournament feels. */
/* A day should be worth seeing. At a sixth of a point an attribute the rating
   did not move at all — a press cost a day and showed nothing, which is the one
   thing a daily choice cannot do.

   And a cup is the best improvement there is, because it is the only real game
   in the week. Training moves one or two numbers; playing moves the player. That
   ordering is what careerDevelopBase carries, and it sits above anything here. */
/* A day is one decision, and it costs the day.

   Three energy and cheap options meant a day held three or four of these, and a
   career sat at its ceiling before its first season was out — four hundred and
   eighty trainings a year will do that at any per-press number worth showing.

   So the arithmetic runs from the other end. Division 5 to Division 1 is about
   twenty-one points of rating; a season is roughly a hundred and eighty free
   days; that is a tenth of a point a day, which at aim's weight of 0.22 is half
   a point of an attribute. Half a point is exactly what a press should show, so
   a press is a day.

   Energy stays, and it says the thing it was always for: a cup takes the whole
   day, so an evening with a tournament in it is not also an evening of practice. */
// Every one of them costs the day, so they cost CC_ENERGY_DAY rather than a
// number of their own — the day's worth is written down once.
/* A training day is worth 0.5 rating. At the old 0.07 a day, D5 to D1 took three seasons; at 0.5 it takes two.
   Each row spreads that half point in the activity's usual proportions; gains weighted by ATTR_W sum to 0.500 (aim
   day all into aim, scrim day split four ways).
   Still shaped by the taper near the ceiling (careerDoAct), desk, coach and the ceiling, so daily training hits
   its limit in the first season and results take over. */
/* What each day costs out of the store, and what a rest day puts back.

   Measured against the year rather than picked: a career year holds about 170
   free days. Training at 30 with a night worth 12 runs a store of a hundred
   down in five days, and a rest day at +45 buys three more — so a season comes
   out at roughly 125 days of work and 45 of rest, and the week reads three on,
   one off. Scrims cost more because they are somebody else's evening too, and
   a stream is the cheap day that trains nothing. */
const CC_ENERGY_NIGHT=12, CC_ENERGY_REST=45;
/* Six sessions, one per attribute, +0.5 each. The old five trainings moved 2-3 attributes by 0.71..2.40 and
   nothing trained endurance at all.
   Named after what players actually do: KovaaK's for aim, Noble's endgames, ranked for survival, replays for
   experience, 1v1s for clutch; consistency keeps gym/routine.
   Gear and coach multiply it, the taper slows the last stretch so a career can't max out in one season. Rating
   value is the attribute's weight (0.11 aim, 0.05 experience), the ladder is climbed by results, see
   careerApplyGrowth. */
/* Half a point of rating, into whichever one you chose.

   His number is 0.5 and the file's number was already 0.5 - the two are not the
   same 0.5, and the difference is worth writing down. A day here has been worth
   half a point of RATING since it was calibrated: the old aim day moved aim by
   2.27, and aim is weighted 0.22, so 2.27 x 0.22 = 0.5. Half a point of the
   ATTRIBUTE instead would be 0.11 of a rating on aim and 0.05 on experience,
   five to ten times slower, and the year does not have the days for it - the
   trainable band is four points wide and it would take ninety sessions to cross.

   So the structure is his and the value is the measured one: pick a stat, and
   the session is worth half a point of rating in it, which is 2.27 of aim or 5
   of experience. tools/check-career-day-value.js holds that invariant. */
/* +0.5 to the trained ATTRIBUTE, not to rating. In rating that's the stat's weight: 0.11 aim, 0.10 endgame and
   survival, 0.08 consistency, 0.06 clutch, 0.05 experience.
   Reading it as rating only made sense with the division ceiling, which is gone; the scale just runs to 99 now.
   Invariant: tools/check-career-day-value.js. */
const CC_TRAIN_DAY=0.5;
const ccStep=k=>CC_TRAIN_DAY;
/* ---- A scrim is against somebody, and it has a score -----------------------

   Who: the strongest person in this week's own inbox list, because that is who a
   player could actually get hold of, and the list is the week's rather than a
   fresh draw — so who is available to scrim is a consequence of who has been
   writing to you.

   What it is worth: playing somebody better teaches more. Half again against
   somebody five points over you, two thirds against somebody five under, and
   the clamp is what those two sentences mean.

   The score is a real count off the two ratings rather than a decoration:
   twelve rounds, each decided by the gap. Seeded on the day, so the evening
   does not re-roll itself when the screen redraws. */
const CC_SCRIM_ROUNDS=12, CC_SCRIM_FORM=0.25;
function ccScrimFoe(){
  let best=null;
  (careerDmPool()||[]).forEach(w=>{ if(!best || w.ovr>best.ovr) best=w; });
  return best;
}
function ccScrimSet(foe, mineOvr){
  if(!foe) return null;
  const rnd=careerRng(ccHashStr('scrim|'+careerToday()+'|'+String(foe.handle||'')));
  const gap=(foe.ovr||0)-mineOvr;
  let mine=0;
  for(let i=0;i<CC_SCRIM_ROUNDS;i++){
    if(rnd() < clamp(0.5-gap*0.03, 0.1, 0.9)) mine++;
  }
  return {who:foe.handle, ovr:foe.ovr, mine:mine, theirs:CC_SCRIM_ROUNDS-mine,
          won:mine*2>CC_SCRIM_ROUNDS, mult:clamp(1+gap*0.1, 0.66, 1.5)};
}
const CC_DAY_ACTS=[
  {id:'trAim', energy:30, gain:{aim:ccStep('aim')}},
  {id:'trSur', energy:30, gain:{sur:ccStep('sur')}},
  {id:'trCon', energy:30, gain:{con:ccStep('con')}},
  {id:'trClu', energy:30, gain:{clu:ccStep('clu')}},
  {id:'trExp', energy:22, gain:{exp:ccStep('exp')}},
  {id:'trEnd', energy:26, gain:{end:ccStep('end')}},
  /* Карты Creative, на которых тренируются настоящие: Clix Box Fights (сделал Pandvil),
     Desert Zone Wars, эдит-курс. Каждая качает два атрибута по половине шага — за ту же
     энергию, что и занятие на один атрибут, то есть скорость роста не меняется. */
  {id:'trBox',  energy:30, gain:{clu:ccStep('clu')/2, aim:ccStep('aim')/2}},
  {id:'trZw',   energy:30, gain:{end:ccStep('end')/2, sur:ccStep('sur')/2}},
  {id:'trEdit', energy:30, gain:{clu:ccStep('clu')/2, con:ccStep('con')/2}},
  // The Pit: свалка всех со всеми, стрельба и стройка под огнём.
  {id:'trPit',  energy:30, gain:{aim:ccStep('aim')/2, con:ccStep('con')/2}},
  // «Своя карта» (trMap) снята из занятий его словом 29.09 («own map убрать»); вышедшая раньше карта платит по-прежнему (ccMapPay).
  // Разбор меты нового сезона: показывается три недели после смены сезона,
  // три дня — и форма, вместо штрафа за незнание острова. См. ccMetaOpen.
  {id:'trMeta', energy:24, gain:{}, meta:true},
  /* Scrims, back where they were.

     They were a day in the store — thirty-eight energy, a quarter step into four
     attributes and six points of the partner's morale — and the rewrite that
     turned them into a set with a score dropped the row itself. The comments
     inside careerDoAct went on describing who a scrim is against, ccGiveMood
     went on being the label for a day that raises morale, and careerDoAct went
     on reading act.morale, and nothing in the mode fed any of it: the only
     `morale:` left in the file was the −4 on the scrimup event. So a partner's
     mood could fall and could not be raised by anything a player did.

     His tester, 20 August, found the hole from the inside: stuck on one rung,
     morale falling, nothing to do about it. */
  // Его слово 21.10: «вместо скримов сделай креатив», энергия 40 у креатива, Noble и стрима (было 38/32/30).
  {id:'scrim',   energy:40, morale:6, versus:true,
   gain:{aim:ccStep('aim')/4, sur:ccStep('sur')/4, clu:ccStep('clu')/4, con:ccStep('con')/4}},
  // Сессия Noble Pro Scrims (сервер — по уровню, см. ccNobleServer): игра на сотню, таблица недели.
  {id:'noble',   energy:40, noble:true,
   gain:{end:ccStep('end')/3, sur:ccStep('sur')/3, clu:ccStep('clu')/3}},
  /* Поговорить — второй способ держать настрой, и он не про тренировку.
   *
   * Правка: «сделаю реалистичней диалог между дуо или трио и чтоб мораль
   * можно было поддерживать, чтоб диалоги влияли на это не только совместные
   * скримсы». До этого дня скрим был единственным, что поднимает настрой соседа
   * — тридцать восемь энергии за вечер, — и карьера, у которой напарник кисло
   * относится к результатам, могла только играть дальше и надеяться.
   *
   * Дешёвый по энергии и без прибавки к статам: это разговор, а не занятие.
   * Сколько он стоит, решается на месте (careerTalkMove), потому что постоянное
   * число здесь было бы краном: жми каждый день, и настрой всегда сто. */
  /* 20 энергии и +7 настроя — его пункт 15 со страницы «ы», 22 августа:
     «поговорить не дает настрой». База была 5/3/1 по терпению, и с довольным
     соседом разговор читался как пустая кнопка. Число теперь его; краном не
     становится — повторный разговор в CC_TALK_GAP всё так же режется вдвое и
     вчетверо. */
  {id:'talk',    energy:20, gain:{}, talk:true, morale:1},
  {id:'stream',  energy:40, gain:{}, reach:1, focus:-1},
  // Тренировка на телефоне (его слово 15.11: «мобильный рейтинг отдельно надо качать»): только мобильный рейтинг, нужен
  // телефон или планшет (ccMobileTrain).
  {id:'mobile',  energy:30, gain:{}, mobile:true},
  /* Мобильные скримы (идея игрока с мобильной сцены, 19.11: «add scrims, people do host like takeovers»): катки против
     мобильных игроков на 16, как в серии. Дороже тренировки, качают меньше, зато и выше её потолка: до 90. Решение, не замер. */
  {id:'mobScrim', energy:40, gain:{}, mobile:true, mobScrim:true},
  {id:'rest',    energy:0,  gain:{}, rest:CC_ENERGY_REST}
];
/* Цена разговора. Довольному почти ничего не даёт (иначе его можно держать на ста), недовольному больше всего.
   Повтор в течение трёх дней стоит вдвое меньше, дальше ещё вдвое. Границы настроя те же, что в careerMoodKey. */
const CC_TALK_GAP=3;
// День берётся аргументом, а не только из карьеры: иначе правило нельзя
// проверить, не подняв сначала целый сезон, — и первая же проверка это поймала.
function careerTalkMove(rec, iso){
  const today=iso || careerToday();
  const pat=(rec && rec.patience!=null) ? rec.patience : CAREER_PATIENCE_START;
  // Плоские +7 — его число (пункт 15). Ступени по терпению убраны: за 20
  // энергии разговор обязан быть слышен и довольному соседу.
  const base = 7;
  const last=rec && rec.talked;
  if(!last || !today) return base;
  const since=ccDaysBetween(last, today);
  if(since>=CC_TALK_GAP*2) return base;
  if(since>=CC_TALK_GAP) return Math.max(1, Math.round(base/2));
  return Math.max(0, Math.round(base/4));
}
function ccActById(id){ return CC_DAY_ACTS.find(a=>a.id===id) || null; }

/* ---- What happens to you --------------------------------------------------
   Rare day events: a stronger duo short a player, a paid showmatch, a sponsor
   video, a night the line dies. Two answers each, both spend the day.
   Rolled with real Math.random the day it arrives and stored in cr.luck, so a
   reload doesn't re-roll. Not seeded off the date: that made the same calendar
   of events for every playthrough. See ccDayRoll. */
const CC_DAY_EVENT_CHANCE=1/6;
const CC_DAY_EVENTS=[
  // A better duo needs a stand-in tonight: an evening with people above you.
  {id:'scrimup', take:{energy:34, form:0.5, morale:-4}, pass:{energy:0}},
  // A showmatch: money and an audience for an evening that trains nothing.
  {id:'show',    take:{energy:30, cash:400, reach:2}, pass:{energy:0}},
  // The sponsor wants a video. Saying no costs nothing today and a little of
  // what they think of you, which is what reach is.
  {id:'promo',   take:{energy:30, cash:250, reach:1}, pass:{reach:-1}},
  // The line goes down. There is no good answer, only which loss.
  {id:'offline', take:{energy:0, restore:20}, pass:{energy:30, form:-0.5}},
  /* Кастомка организатора — с порогом по PR.

     Это самая обычная вещь на сцене и её у нас не было. Живой пример,
     2 сентября 2026: «$100 PER WIN SOLO VICTORY CUP — 1 Pro Lobby + 1 Lobby
     for Top 2.5k PR 2026, среда 19:00 CEST, регистрация в дискорде», и
     @ScrollSZN отвечает «ty for invite». То есть турнир вне календаря Epic, в
     который пускают по числу, которое игрок и так себе набивает.

     Здесь так же: приглашают, только если PR дорос (CC_CUSTOM_PR), платят за
     победы в играх, и это не квалификация никуда — деньги и вечер. Выплата
     считается в ccCustomPlay, потому что она зависит от того, как сыграл, а
     не от того, что согласился. */
  /* Форма — в таблице, деньги — в самом вечере: за кастомками ходят не за
     сотней, а за лобби, где все играют всерьёз. Тот же смысл, что у скримов,
     только с призом за победу. */
  {id:'custom',  take:{energy:30, form:0.4}, pass:{energy:0}},
  /* События-развилки, 3 сентября 2026 — его пункт 2 из разбора «чего не
     хватает». У каждого два-три ответа (opts) вместо «да/нет», условие when,
     и след в репутации, форме, настрое или охвате. Все с живой сцены:
     напарник хочет другую точку, клуб задержал зарплату, слив в ленте,
     контент-хаус на неделю, тренер-волонтёр, вчерашний провал. Школа и
     уход клуба приходят не жребием, а по делу — см. careerForcedEvent. */
  {id:'mateSpot', when:()=>!!careerMateRec() && !!careerSpotOn(), opts:[
    {id:'move',  eff:{spotClear:true, morale:6}},
    {id:'keep',  eff:{morale:-5}},
    {id:'trial', eff:{energy:20, morale:2, form:0.2}}]},
  // Только чужой клуб: свой (own) зарплату не задерживает и сливать нечего.
  {id:'orgLate', when:()=>!!CAREER.org && !CAREER.org.own, opts:[
    {id:'wait',   eff:{rep:1}},
    {id:'public', eff:{reach:2, rep:-2}},
    {id:'leave',  eff:{orgLeave:true, reach:1}}]},
  {id:'leak', when:()=>!!CAREER.org && !CAREER.org.own, opts:[
    {id:'deny',    eff:{reach:1}},
    {id:'confirm', eff:{reach:3, rep:-2}},
    {id:'silent',  eff:{}}]},
  {id:'house', when:()=>careerReach()>=20000, opts:[
    {id:'go', eff:{energy:40, reach:4, form:-0.3}},
    {id:'no', eff:{}}]},
  {id:'coachFree', when:()=>!ccCoach(), opts:[
    {id:'take', eff:{energy:30, form:0.3, stat:0.5}},
    {id:'pass', eff:{}}]},
  {id:'tilt', when:()=>!!careerMateRec() && ccBadNightYesterday(), opts:[
    {id:'blame', eff:{rep:-3, morale:-6, form:0.2}},
    {id:'own',   eff:{rep:1, morale:4}},
    {id:'talk',  eff:{energy:20, morale:7}}]},
  {id:'orgQuit', forced:true, opts:[
    {id:'fa',    eff:{orgGone:true, lft:true}},
    {id:'quiet', eff:{orgGone:true}}]}
];
/* Порог приглашения. У них он «топ-2500 PR сезона», у нас — число той же
   шкалы: столько за год набирает игрок, который регулярно доходит до финалов
   недели, но ещё не живёт в Дивизионе 1. Ниже — на кастомки не зовут. */
const CC_CUSTOM_PR=12000;
const CC_CUSTOM_GAMES=5;
const CC_CUSTOM_PER_WIN=100;
function ccCustomPr(){
  const pl=CAREER && CAREER.player;
  const pr=pl ? ccPrCardOf(pl.handle||pl.nick) : null;
  return pr ? pr.pr : 0;
}
function ccCustomInvited(){
  // Позвали по числу — или позвали лично, потому что попросился. См. careerCustomAsk.
  return ccCustomPr()>=CC_CUSTOM_PR ||
         (CAREER.career.customInvite && CAREER.career.customInvite>=careerToday());
}
/* Почти дотянул: с шестидесяти процентов порога уже можно попроситься.

   Так это и делают: под постом организатора пишут «Yo would love an invite
   boss» (@MrSavage, 28 августа), и иногда зовут. Его пункт 6, 3 сентября. */
function ccCustomNear(){
  const pr=ccCustomPr();
  return pr>=CC_CUSTOM_PR*0.6 && pr<CC_CUSTOM_PR;
}
function careerCustomAsk(id){
  const cr=CAREER.career;
  const n=(cr.news||[]).find(x=>x.id===id);
  if(!n || n.asked) return;
  n.asked=1;
  const rnd=careerRng(ccHashStr('ask|'+(cr.season||1)+'|'+careerToday()));
  const yes=rnd()<0.5;
  if(yes){
    // Приглашение действует до завтрашнего дня: вечер играется, пока оно живо.
    cr.customInvite=ccAddDays(careerToday(), 1);
    careerNews('good', 'ccPostAskYes', []);
  } else careerNews('flat', 'ccPostAskNo', []);
  careerSave();
  careerRenderHub('social');
}
/* Пост организатора: набор в кастомку. Приходит раз в неделю тем, кто рядом с
   порогом, — тем, кому есть смысл проситься. */
function careerCustomsPostTick(){
  const cr=CAREER.career;
  if(!ccCustomNear()) return;
  const key='cu|'+(cr.season||1)+'|'+careerWeek();
  cr.told=cr.told||{};
  if(cr.told[key]) return;
  cr.told[key]=1;
  careerNews('flat', 'ccPostCustomsOpen', [ccNum(CC_CUSTOM_PR), CC_CUSTOM_PER_WIN],
             {by:{name:L().ccCustomsHost, handle:'poyocustoms', verified:true}});
}
/* Вечер кастомки. Лобби про, пять игр, сто долларов за победу.

   Считается посеянным броском, как 1v1: это не турнир карьеры — журнал,
   квалификации и PR он не трогает, — а вечер за деньги, и живая симуляция
   ради него не поднимается. Сила игрока против лобби, где все примерно
   уровня Дивизиона 1. */
function ccCustomPlay(){
  const cr=CAREER.career, pl=CAREER.player;
  const rnd=careerRng(ccHashStr('custom|'+(cr.season||1)+'|'+careerToday()));
  const mine=pl.ovrExact!=null?pl.ovrExact:pl.ovr;
  /* Победа в лобби из полусотни — редкость даже у сильного, но не небылица:
     у топа выходит одна-две из пяти, у того, кого позвали впритык, — одна на
     вечер-другой. Шанс идёт от разницы с уровнем Дивизиона 1. */
  const p=clamp(0.05+(mine-ccBand(1))*0.012, 0.02, 0.45);
  let wins=0;
  for(let g=0; g<CC_CUSTOM_GAMES; g++) if(rnd()<p) wins++;
  const cash=wins*CC_CUSTOM_PER_WIN;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  careerReachAdd(wins ? 2 : 1);
  return {wins:wins, cash:cash};
}
/* СВОЯ КАСТОМКА — организатор ты.

   Игрок: «было бы интересно сделать организацию собственных
   турниров/кастомок». Кастомки в этой сцене держат те, у кого есть аудитория
   (Poyo, Rax): фонд из своего кармана, лобби из знакомых имён, вечер идёт в
   эфир и растит канал. Так и здесь: кнопка дня рядом со стримом, фонд с
   баланса, лобби — люди своего региона ближайшие по рейтингу, победители игр
   получают деньги на общую доску (careerMoneyAdd), а ты — охват и пост в ленте.

   Кто может: аудитория от CC_HOST_REACH, либо свой клуб, либо тот PR, с
   которого зовут на чужие кастомки. Ставка за победу растёт с каналом, а не
   выбирается — так вечер стоит ровно столько, сколько ты уже собрал зрителей.
   Своя игра считается тем же броском, что и на чужой кастомке (ccCustomPlay):
   это не турнир карьеры — журнал, квалификации и PR не трогаются. */
const CC_HOST_REACH=3000;
function ccHostPerWin(){
  const r=careerReach();
  return r>=100000 ? 500 : r>=20000 ? 250 : 100;
}
function ccHostPot(){ return ccHostPerWin()*CC_CUSTOM_GAMES; }
// Почему нельзя — словом для кнопки; null — можно.
function ccHostWhy(){
  const cr=CAREER && CAREER.career; if(!cr) return 'reach';
  const own=typeof careerClub==='function' && careerClub();
  if(!(careerReach()>=CC_HOST_REACH || own || ccCustomPr()>=CC_CUSTOM_PR)) return 'reach';
  if((cr.balance||0)<ccHostPot()) return 'cash';
  return null;
}
// Лобби: 49 человек своего региона, ближайшие по рейтингу; свои люди не зовутся.
function ccHostField(){
  const pl=CAREER.player, mine=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  const taken=ccMyPeople();
  const ovrOf=c=>(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr||0);
  return careerRosterNowEU().filter(p=>!taken.has(hKey(p)))
    .map(p=>({handle:p.handle, ovr:ovrOf(p)}))
    .sort((a,b)=>Math.abs(a.ovr-mine)-Math.abs(b.ovr-mine))
    .slice(0, 49);
}
function ccHostRun(){
  const cr=CAREER.career, pl=CAREER.player;
  if(ccHostWhy()) return null;
  const per=ccHostPerWin(), pot=per*CC_CUSTOM_GAMES;
  cr.balance=(cr.balance||0)-pot;
  cr.hosted=(cr.hosted||0)+pot;
  const rnd=careerRng(ccHashStr('host|'+(cr.season||1)+'|'+careerToday()));
  const mine=pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  const pMe=clamp(0.05+(mine-ccBand(1))*0.012, 0.02, 0.45);
  const field=ccHostField();
  const weight=c=>Math.exp((c.ovr-90)/4);
  const total=field.reduce((s,c)=>s+weight(c), 0);
  const wins=new Map(); let myWins=0;
  for(let g=0; g<CC_CUSTOM_GAMES; g++){
    if(rnd()<pMe){ myWins++; continue; }
    let r=rnd()*total, w=field[field.length-1];
    for(let i=0;i<field.length;i++){ r-=weight(field[i]); if(r<=0){ w=field[i]; break; } }
    wins.set(w.handle, (wins.get(w.handle)||0)+1);
  }
  const cash=myWins*per;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  // Победители игр — на общую доску денег, своими именами.
  const winners=[...wins.keys()];
  if(winners.length) careerMoneyAdd(winners.map(h=>({name:h})), (i,t)=>wins.get(t.name)*per);
  // Организатор в эфире: вечер растит охват сильнее обычного стрима и даёт репутацию.
  careerReachAdd(3*CC_REACH_DIV(cr.division));
  careerRepAdd(1);
  const who=winners.length
    ? winners.map(h=>'@'+ccHandle(h)+(wins.get(h)>1 ? ' ×'+wins.get(h) : '')).join(', ')
    : '-';
  careerNews('flat', 'ccPostHosted', [per, who, myWins]);
  cr.hostLast={day:careerToday(), a:[myWins, cash ? ccNum(cash) : 0, who]};
  return {wins:myWins, cash:cash, pot:pot, per:per, winners:winners};
}
/* DISCORD В СОЦСЕТИ (его слово 19.11: «добавить дискорд в social, чтоб сделать кастомки на пк и на мобил и прочее»).
   Кастомки этой сцены живут в Discord: сервер организатора, канал объявлений, вход по порогу. Здесь три сервера:
   PC Customs — та же кастомка, что приходила событием дня (ccCustomPlay, порог PR CC_CUSTOM_PR), теперь по желанию;
   Mobile Customs — пять игр по 16, только тач (как Mobile Series), зовут с мобильного рейтинга CC_DC_MOB_RATE, качает
   мобильный рейтинг как скрим (игрок мобильной сцены: «every cup I just get destroyed, no way to practice»);
   Мой сервер — провести свою кастомку на ПК (ccHostRun) или на мобиле, фонд с баланса. И канал скримов со ссылками на
   занятия дня. Каждое — раз в день, 40 энергии, в свободный день. Пороги и ставки мобилы — решение, не замер. */
const CC_DC_ENERGY=40, CC_DC_MOB_RATE=75, CC_DC_MOB_PER_WIN=50;
let CH_DC='pc';
function ccDcDid(kind){ const d=CAREER.career.dcDid; return !!(d && d.day===careerToday() && d.kinds.indexOf(kind)>=0); }
function ccMobHostPer(){ return Math.max(50, ccHostPerWin()/2); }
function ccMobHostWhy(){
  const cr=CAREER && CAREER.career; if(!cr) return 'reach';
  if(!ccMobileOwn()) return 'phone';
  const own=typeof careerClub==='function' && careerClub();
  if(!(careerReach()>=CC_HOST_REACH || own || ccCustomPr()>=CC_CUSTOM_PR)) return 'reach';
  if((cr.balance||0)<ccMobHostPer()*CC_CUSTOM_GAMES) return 'cash';
  return null;
}
// Почему нельзя (строкой) или null.
function ccDcWhy(kind){
  const cr=CAREER.career, T=L();
  if(!ccCentreDayOpen()) return T.dcDayClosed;
  if(ccDcDid(kind)) return T.dcDone;
  if(typeof ccMpOn==='function' && ccMpOn()) return T.dcMpOff;
  if(kind==='mobJoin' && !ccMobileOwn()) return T.ccMobTrainNeed;
  if(kind==='pcHost' || kind==='mobHost'){
    const w=kind==='pcHost' ? ccHostWhy() : ccMobHostWhy();
    if(w==='phone') return T.ccMobTrainNeed;
    if(w==='reach') return T.dcNeedReach(ccNum(CC_HOST_REACH));
    if(w==='cash') return T.dcNeedCash(ccNum((kind==='pcHost' ? ccHostPot() : ccMobHostPer()*CC_CUSTOM_GAMES)-(cr.balance||0)));
  }
  if(careerEnergy()<CC_DC_ENERGY) return T.ccNeedEnergy(CC_DC_ENERGY-careerEnergy());
  return null;
}
// Мобильная кастомка: пять игр по 16, шанс победы от мобильного рейтинга против верха сцены (~85), одна шестнадцатая на равных.
function ccMobCustomPlay(){
  const cr=CAREER.career;
  const rnd=careerRng(ccHashStr('mcustom|'+(cr.season||1)+'|'+careerToday()));
  const p=clamp(1/16+(ccMobileOvr()-85)*0.015, 0.02, 0.5);
  let wins=0; for(let g=0; g<CC_CUSTOM_GAMES; g++) if(rnd()<p) wins++;
  const cash=wins*CC_DC_MOB_PER_WIN;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  const grow=ccMobileTrain(true);
  careerReachAdd(wins ? 2 : 1);
  return {wins:wins, cash:cash, grow:grow};
}
// Своя мобильная кастомка: 15 мобильных игроков своего региона ближе всех по рейтингу, победители — их ники в посте.
function ccMobHostRun(){
  const cr=CAREER.career;
  if(ccMobHostWhy()) return null;
  const per=ccMobHostPer(), pot=per*CC_CUSTOM_GAMES, mine=ccMobileOvr();
  cr.balance=(cr.balance||0)-pot; cr.hosted=(cr.hosted||0)+pot;
  const R=(typeof CC_MOBILE_ROSTER!=='undefined') ? (CC_MOBILE_ROSTER[ccCareerRegion()] || CC_MOBILE_ROSTER.EU || []) : [];
  const field=R.map(x=>({handle:x[0], ovr:ccMobileRate(x[0], x[2])})).sort((a,b)=>Math.abs(a.ovr-mine)-Math.abs(b.ovr-mine)).slice(0, 15);
  const rnd=careerRng(ccHashStr('mhost|'+(cr.season||1)+'|'+careerToday()));
  const pMe=clamp(1/16+(mine-85)*0.015, 0.02, 0.5);
  const weight=c=>Math.exp((c.ovr-85)/4), total=field.reduce((s,c)=>s+weight(c), 0);
  const wins=new Map(); let myWins=0;
  for(let g=0; g<CC_CUSTOM_GAMES; g++){
    if(rnd()<pMe || !field.length){ myWins++; continue; }
    let r=rnd()*total, w=field[field.length-1];
    for(let i=0;i<field.length;i++){ r-=weight(field[i]); if(r<=0){ w=field[i]; break; } }
    wins.set(w.handle, (wins.get(w.handle)||0)+1);
  }
  const cash=myWins*per;
  if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
  careerReachAdd(2*CC_REACH_DIV(cr.division));
  const winners=[...wins.keys()];
  const who=winners.length ? winners.map(h=>'@'+ccHandle(h)+(wins.get(h)>1 ? ' ×'+wins.get(h) : '')).join(', ') : '-';
  careerNews('flat', 'ccPostHosted', [per, who, myWins]);
  return {wins:myWins, cash:cash, pot:pot, per:per, winners:winners};
}
function ccDcGo(kind){
  if(ccDcWhy(kind)) return;
  const cr=CAREER.career;
  careerSpend(CC_DC_ENERGY);
  let r=null;
  if(kind==='pcJoin'){ r=ccCustomPlay(); careerNews(r.wins ? 'good' : 'flat', 'ccDayEvcustomTake', [r.wins, ccNum(r.cash)]); }
  else if(kind==='mobJoin'){ r=ccMobCustomPlay(); careerNews(r.wins ? 'good' : 'flat', 'ccDayEvcustomTake', [r.wins, ccNum(r.cash)]); }
  else if(kind==='pcHost') r=ccHostRun();
  else if(kind==='mobHost') r=ccMobHostRun();
  const d=(cr.dcDid && cr.dcDid.day===careerToday()) ? cr.dcDid : {day:careerToday(), kinds:[]};
  d.kinds.push(kind); cr.dcDid=d;
  cr.dcLast={day:careerToday(), kind:kind, wins:r ? r.wins : 0, cash:r ? r.cash : 0, grow:r && r.grow ? r.grow : 0,
             who:r && r.winners ? r.winners.slice(0, 5) : null};
  careerSave();
  careerRenderHub('discord');
}
/* СЕССИЯ КАСТОМОК КАК НА НАСТОЯЩИХ (его слово 19.11: «сделать симуляции игр, регистрацию кастомок, как на настоящих
   кастомках»). Как у Noble (nobleprac.com, сессии и таблицы 18.11.2026): в день несколько сессий (Session 1, 2, Late Night),
   запись, чек-ин, код лобби, игры, таблица «убийства / игры / победы / очки». Noble Solos — 2 игры за сессию, топ-5 зовут
   в Solos Closed; Practice Scrims — Solo/Duo/Trio Customs, топ-5 зовут в Division 3 (правила там же: файт до 60 живых, после
   4-й зоны снова можно, играть на эндгейм). Здесь: регистрация бесплатная, чек-ин даёт код, «Играть» — живые игры на карте
   с игроками своего региона уровня твоего сервера; 40 энергии, вечер дня. Командные кастомки — 3 игры, мобильные — 5 по 16
   (решение, не замер). Очки — как в первом раунде капа, 2 за элим. */
const CC_DC_SESS=[{id:'s1', n:'Session 1', t:'18:00'}, {id:'s2', n:'Session 2', t:'20:00'}, {id:'ln', n:'Late Night', t:'23:00'}];
// Куда зовёт топ-5 сессии (nobleprac.com): Practice Scrims → Division 3, Solos Closed и Division 3 → Division 2, Division 2 → Division 1.
// Выше Division 1 приглашением не попасть: Pro Scrims — по PR, Noble X — только tier 1.
const CC_NOBLE_PROMO={6:4, 5:3, 4:3, 3:2};
function ccDcReg(){ const r=CAREER.career.dcReg; return (r && r.day===careerToday()) ? r : null; }
function ccDcSessFmt(kind){
  if(kind==='mob') return {solo:true, games:5, lobby:16};
  const solo=careerSquadSize()<=1 || /Solos/.test(ccNobleServer().name) || !(careerMates()||[]).length || careerMates().some(m=>!m);
  return {solo:solo, games:solo ? 2 : 3, lobby:solo ? 100 : ccTeams(50)};
}
function ccDcSessTitle(kind, s){
  const d=careerToday(), dd=d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4);
  const f=ccDcSessFmt(kind), fmt=f.solo ? 'Solos' : (['','Solos','Duo','Trio','Squad'][careerSquadSize()]||'Duo')+' Customs';
  return (kind==='mob' ? L().dcSrvMob : ccNobleServer().name)+' · '+(kind==='mob' ? 'Touch' : fmt)+' '+s.n+' ['+dd+']';
}
function ccDcRegister(kind, sid){
  const cr=CAREER.career;
  if(ccDcReg()) return;
  const rnd=careerRng(ccHashStr('dccode|'+careerToday()+'|'+kind+'|'+sid));
  const code=(kind==='mob' ? 'TOUCH' : ccCareerRegion()==='EU' ? 'NOBLE' : String(ccPracSrv()).split(' ')[0].toUpperCase())+(1000+Math.floor(rnd()*9000));
  cr.dcReg={day:careerToday(), kind:kind, sess:sid, code:code, checked:false};
  careerSave(); careerRenderHub('discord');
}
function ccDcCheckIn(){ const r=ccDcReg(); if(!r) return; r.checked=true; careerSave(); careerRenderHub('discord'); }
function ccDcUnreg(){ const r=ccDcReg(); if(!r || r.done) return; delete CAREER.career.dcReg; careerSave(); careerRenderHub('discord'); }
function ccDcBack(){ careerBackToHub(); careerTab('discord'); }
async function ccScrimRun(){
  const r=ccDcReg(); if(!r || !r.checked || r.done || r.spot==null) return;
  const kind=r.kind, why=ccDcWhy(kind==='mob' ? 'mobJoin' : 'pcJoin'); if(why) return;
  const cr=CAREER.career, me=careerCard(); if(!me) return;
  const f=ccDcSessFmt(kind), s=CC_DC_SESS.find(x=>x.id===r.sess)||CC_DC_SESS[0], title=ccDcSessTitle(kind, s);
  careerSpend(CC_DC_ENERGY);
  r.done=true;
  const d=(cr.dcDid && cr.dcDid.day===careerToday()) ? cr.dcDid : {day:careerToday(), kinds:[]};
  d.kinds.push(kind==='mob' ? 'mobJoin' : 'pcJoin'); cr.dcDid=d;
  careerSave();
  const S=ccDcScrSetup(r, true); if(!S) return;
  ccDcScrMarks(r, S);
  const field=S.field, you=S.you, tier=ccNobleTier();
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
  const sc=kind==='mob' ? ccCupScore({id:'S41_MobileSeriesHeat1'}, 1) : null;
  await simulateGamesLive(field, f.games, sc ? sc.pts : victoryR1Points, sc ? sc.kill : CC_VICTORY_R1_KILL, 'stage', 0, null, null,
    {lobbySize:Math.min(field.length, kind==='mob' ? 16 : (f.solo ? 100 : ccTeams(50))), stageName:title, mapReplay:true, choices:true, stopOnYourDeath:true,
     // Как на сессиях Noble: точки отмечены заранее в канале карты дропов, первая игра — по этим меткам.
     dropEachGame:(g,room)=>(g===1 && r.spot!=null) ? ccDcDropGroups(room||field, you, r) : careerLandingPick(room||field, you, title, ['victory'])});
  removeSkipButton();
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1, wins=you.wins||0, kills=you.stageElims||0;
  // Итог: форма (как у сессии Noble), мобилка — рейтинг и деньги за победы, EU — инвайт выше по лестнице за топ-5.
  let note='', promo=null;
  cr.form=clamp((cr.form||0)+ccNobleForm(place, field.length), -CC_FORM_MAX, CC_FORM_MAX);
  if(kind==='mob'){
    const cash=wins*CC_DC_MOB_PER_WIN; if(cash){ cr.balance=(cr.balance||0)+cash; cr.side=(cr.side||0)+cash; }
    const g=ccMobileTrain(true); note=L().ccMobTitle+' +'+g.toFixed(2)+(cash ? ' · '+ccMoney(cash) : '');
  } else if(ccCareerRegion()==='EU' && place<=5 && CC_NOBLE_PROMO[tier]!=null){
    promo=CC_NOBLE_LADDER[CC_NOBLE_PROMO[tier]].name; cr.nobleInv=Math.min(cr.nobleInv!=null ? cr.nobleInv : 9, CC_NOBLE_PROMO[tier]);
    note=L().dcPromoGot(promo);
  } else if(ccCareerRegion()==='EU' && CC_NOBLE_PROMO[tier]!=null) note=L().dcPromo(CC_NOBLE_LADDER[CC_NOBLE_PROMO[tier]].name);
  // Неделя сервера: очки сессии в таблицу недели (та же, что у занятия в «Тренировке»).
  if(kind!=='mob'){ const lf=ccLife(), wk=ccMonthKey(careerToday())+'|'+Math.floor(((+careerToday().slice(8,10))-1)/7), sv=ccNobleServer();
    if(!lf.noble || lf.noble.wk!==wk) lf.noble={wk, server:sv.name, me:0, n:0, rows:ccNobleRivals(sv, wk)};
    lf.noble.me+=you.stagePts||0; lf.noble.n++; lf.noble.server=sv.name; }
  careerReachAdd(1);
  careerNews(place<=10 ? 'good' : 'flat', 'lfNewsNoble', [title, place, field.length, kills, you.stagePts||0, ccNobleForm(place, field.length)]);
  r.res={place:place, of:field.length, pts:you.stagePts||0, kills:kills, wins:wins, note:note};
  cr.dcLast={day:careerToday(), kind:kind==='mob' ? 'mobJoin' : 'pcJoin', wins:wins, cash:kind==='mob' ? wins*CC_DC_MOB_PER_WIN : 0, grow:0, who:null};
  careerSave();
  const shell=createStageCardShell(title+' · '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, place<=5, false, L().dcSessRes(place, field.length, you.stagePts||0, kills, wins)+(note ? ' · '+note : ''));
  await revealStandings(shell, ranked, you, 5, null, null, null, null, false);
  S.restore();
  const box=document.createElement('div'); box.className='stage-card '+(place<=5 ? 'pass' : 'fail');
  box.innerHTML='<h4>'+esc(title)+' <span class="stage-badge '+(place<=5 ? 'pass' : 'fail')+'">#'+place+'</span></h4>'+
    '<div class="stage-detail"><div>'+esc(L().dcSessRes(place, field.length, you.stagePts||0, kills, wins))+'</div>'+(note ? '<div>'+esc(note)+'</div>' : '')+'</div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="ccDcBack()">'+esc(L().dcBackDc)+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
/* СКРИМЫ ХОСТЯТ АДМИНЫ СЕРВЕРА, игрок их не создаёт (его слово 19.11: «scrims не создавать, а что хостили админы и ты
   регаешься, так же работает; и метку на карту ставишь с другими игроками»). Блоки дня от админа сервера практики
   региона, запись на блок, чек-ин с кодом, потом канал карты дропов: метки других команд уже стоят (раздача комнаты
   тем же buildBotLandingAssignment), свою ставишь нажатием на квадрат. Первая игра блока идёт ровно по этим меткам,
   дальше точка спрашивается как обычно. Цена и прибавка — занятие дня «скрим» / «мобильные скримы» (careerDoAct). */
const CC_DC_SCR_SESS=[{id:'b1', n:'Scrims Block 1', t:'19:00'}, {id:'b2', n:'Scrims Block 2', t:'21:30'}];
function ccDcScrReg(){ const r=CAREER.career.dcScr; return (r && r.day===careerToday()) ? r : null; }
function ccDcScrAct(kind){ return kind==='mob' ? 'mobScrim' : 'scrim'; }
function ccDcScrOrg(kind){ return kind==='mob' ? L().dcSrvMob : ccPracSrv(); }
function ccDcScrWhy(kind){
  const T=L(), a=ccActById(ccDcScrAct(kind));
  if(!a) return '-';
  if(typeof ccMpOn==='function' && ccMpOn()) return T.dcScrBusy;
  if(!ccCentreDayOpen() || careerDayClosed()) return T.dcScrBusy;
  if(a.mobile && !ccMobileOwn()) return T.ccMobTrainNeed;
  if(careerEnergy()<a.energy) return T.ccNeedEnergy(a.energy-careerEnergy());
  return null;
}
function ccDcScrTitle(kind, s){
  const d=careerToday(), dd=d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(2,4);
  const fmt=kind==='mob' ? 'Touch' : (['','Solo','Duo','Trio','Squad'][careerSquadSize()]||'Duo');
  return ccDcScrOrg(kind)+' · '+fmt+' Scrims '+s.n.replace('Scrims ','')+' ['+dd+']';
}
function ccDcScrRegister(kind, sid){
  const cr=CAREER.career;
  if(ccDcScrReg() || ccDcScrWhy(kind)) return;
  const rnd=careerRng(ccHashStr('dcscr|'+careerToday()+'|'+kind+'|'+sid));
  cr.dcScr={day:careerToday(), kind:kind, sess:sid, code:'SCRIM'+(1000+Math.floor(rnd()*9000)), checked:false, spot:null, marks:null};
  careerSave(); careerRenderHub('discord');
}
function ccDcScrCheckIn(){ const r=ccDcScrReg(); if(!r) return; r.checked=true; careerSave(); careerRenderHub('discord'); }
function ccDcScrUnreg(){ const r=ccDcScrReg(); if(!r || r.done) return; delete CAREER.career.dcScr; careerSave(); careerRenderHub('discord'); }
// Ключ команды для меток: ники состава, как их видит раскладка (одинаков при сборке комнаты заново).
function ccDcTk(t){ return (t && t.squad || []).map(c=>c ? hKey(c) : '').filter(Boolean).sort().join('+') || String(t && t.name || ''); }
// Комната блока: тот же состав, остров и поле, что и в игре; restore() возвращает драфт как было.
function ccDcScrSetup(r, cust){
  const me=careerCard(); if(!me) return null;
  const kind=r.kind, mates=(careerMates()||[]).filter(Boolean), sf=cust ? ccDcSessFmt(kind) : null;
  const solo=sf ? sf.solo : (kind==='mob' || careerSquadSize()<=1 || !mates.length);
  const games=sf ? sf.games : (kind==='mob' ? 5 : 3), lobby=sf ? sf.lobby : (kind==='mob' ? 16 : (solo ? 100 : ccTeams(50)));
  const prev={mode:CARD_MODE, size:squadSize, drafted:drafted, set:ACTIVE_LANDING_SET};
  CARD_MODE=true; squadSize=solo ? 1 : careerSquadSize(); drafted=solo ? [me] : [me].concat(mates);
  useLandingSet(kind==='mob' && ZONE_SETS.r6 ? 'r6' : careerBrSet());
  const you=careerYouTeam(drafted);
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  if(kind==='mob') you.pow=ccMobileSelfPow();
  const tier=ccNobleTier(), crT=Object.assign({}, CAREER.career, {division:[1,1,1,2,3,4,5][tier]||5});
  const field=[you].concat(kind==='mob' ? ccMobileField(lobby-1, 'reg')
    : solo ? careerSoloField(crT, [me], lobby, true)
    : careerCupField(crT, drafted, lobby, (cust ? 'dc|' : 'dcs|')+r.day+'|'+r.sess, true, tier<=1 ? CC_FIELD_SHARP.lan : 0));
  return {field:field, you:you, games:games, lobby:lobby, solo:solo, prev:prev,
          restore:function(){ CARD_MODE=prev.mode; squadSize=prev.size; drafted=prev.drafted; useLandingSet(prev.set); }};
}
// Метки остальных команд — один раз на блок, дальше лежат в записи (r.marks: [ключ, квадрат, ники]).
function ccDcScrMarks(r, S){
  if(r.marks) return r.marks;
  const zones=ALL_LANDING_ZONES||[], m=[];
  const nameOf=t=>(t.squad||[]).map(c=>c && c.handle).filter(Boolean).join(' + ') || String(t.name||'').replace(/<[^>]*>/g,'');
  const pre=buildBotLandingAssignment(S.field.filter(t=>t!==S.you)).zoneGroups;
  pre.forEach((list, z)=>{ const i=zones.indexOf(z); if(i<0) return;
    (list||[]).forEach(t=>{ if(t && !t.isYou) m.push([ccDcTk(t), i, nameOf(t)]); }); });
  r.marks=m; r.grid=ACTIVE_LANDING_SET;
  careerSave();
  return m;
}
function ccDcDropReg(which){ return which==='cust' ? ccDcReg() : ccDcScrReg(); }
function ccDcDropOpen(which){
  which=which==='cust' ? 'cust' : 'scr';
  const r=ccDcDropReg(which); if(!r || !r.checked || r.done) return;
  const S=ccDcScrSetup(r, which==='cust'); if(!S) return;
  let html='';
  try{
    const T=L(), zones=ALL_LANDING_ZONES||[], marks=ccDcScrMarks(r, S), grid=ACTIVE_LANDING_SET;
    const art=MAP_ART[grid]||MAP_ART.m2, asp=MAP_ASPECT[grid]||'1100/970';
    const by=new Map(); marks.forEach(m=>{ if(!by.has(m[1])) by.set(m[1], []); by.get(m[1]).push(m[2]); });
    const meName=(S.you.squad||[]).map(c=>c && c.handle).filter(Boolean).join(' + ') || ccHandle(CAREER.player.nick||'');
    const boxes=zones.map((z,i)=>{
      const who=(by.get(i)||[]).slice(), me=r.spot===i; if(me) who.unshift(meName);
      const cls='cc-dm-box pick'+(who.length>=2 ? ' hot' : '')+(me ? ' me' : '')+(who.length ? '' : ' free');
      return '<button type="button" class="'+cls+'" style="left:'+z.x+'%;top:'+z.y+'%;width:'+z.w+'%;height:'+z.h+'%" onclick="ccDcDropPick('+i+',\''+which+'\')" aria-label="'+
        esc(T.landingZoneSuffix(i+1))+'"><span>'+who.slice(0, 3).map(n=>esc(n)).join('<br>')+(who.length>3 ? '<br>+'+(who.length-3) : '')+'</span></button>';
    }).join('');
    const mineN=r.spot!=null ? (by.get(r.spot)||[]).length : 0;
    html='<div class="cc-dm" role="dialog" aria-modal="true"><div class="cc-dm-head"><b>#'+esc(T.dcDropChan)+'</b><em>'+
      esc(which==='cust' ? ccDcSessTitle(r.kind, CC_DC_SESS.find(s=>s.id===r.sess)||CC_DC_SESS[0]) : ccDcScrTitle(r.kind, CC_DC_SCR_SESS.find(s=>s.id===r.sess)||CC_DC_SCR_SESS[0]))+'</em>'+
      '<button class="cc-dm-x" onclick="ccDropMapClose()" aria-label="'+esc(T.ccDropMapClose)+'">×</button></div>'+
      '<div class="cc-dm-map" style="aspect-ratio:'+asp+';background-image:url(\''+art+'\')">'+boxes+'</div>'+
      '<p class="cc-dm-note">'+esc(r.spot!=null ? T.dcDropMine(T.landingZoneSuffix(r.spot+1), mineN) : T.dcDropHint)+'</p>'+
      (r.spot!=null ? '<div class="dc-act"><button class="dc-btn" onclick="ccDropMapClose();careerRenderHub(\'discord\')">'+esc(T.dcDropDone)+'</button></div>' : '')+'</div>';
  } finally{ S.restore(); }
  ccDropMapClose();
  const el=document.createElement('div');
  el.id='ccDropMapModal'; el.className='cc-dm-wrap cc-dc-drop';
  el.onclick=e=>{ if(e.target===el){ ccDropMapClose(); careerRenderHub('discord'); } };
  el.innerHTML=html;
  document.body.appendChild(el);
}
function ccDcDropPick(i, which){
  const r=ccDcDropReg(which); if(!r || !r.checked || r.done) return;
  r.spot=i; careerSave(); ccDcDropOpen(which);
}
// Первая игра блока — по меткам канала: своя команда на свой квадрат, остальные на свои; кого не нашли — раздачей.
function ccDcDropGroups(field, you, r){
  const zones=ALL_LANDING_ZONES||[], groups=new Map(), byKey=new Map((r.marks||[]).map(m=>[m[0], m[1]]));
  CC_STYLE_TEAM=you; ccApplyPlayStyle(you);
  const put=(t, z)=>{ t.landingZone=z; t.landingResult=null; t.landingRival=null; applyLandingPow(t, z.points);
    if(!groups.has(z)) groups.set(z, []); groups.get(z).push(t); };
  const rest=[];
  (field||[]).forEach(t=>{
    const i=t===you ? r.spot : byKey.get(ccDcTk(t)), z=i!=null ? zones[i] : null;
    if(z) put(t, z); else rest.push(t);
  });
  if(rest.length) buildBotLandingAssignment(rest, {into:groups});
  r.matched=(field||[]).length-rest.length;
  return groups;
}
async function ccDcScrRun(){
  const r=ccDcScrReg(); if(!r || !r.checked || r.done || r.spot==null) return;
  const kind=r.kind; if(ccDcScrWhy(kind)) return;
  if(!careerDoAct(ccDcScrAct(kind))) return;
  const cr=CAREER.career;
  r.done=true; careerSave();
  const s=CC_DC_SCR_SESS.find(x=>x.id===r.sess)||CC_DC_SCR_SESS[0], title=ccDcScrTitle(kind, s);
  const S=ccDcScrSetup(r); if(!S){ return; }
  ccDcScrMarks(r, S);
  const field=S.field, you=S.you;
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
  const sc=kind==='mob' ? ccCupScore({id:'S41_MobileSeriesHeat1'}, 1) : null;
  await simulateGamesLive(field, S.games, sc ? sc.pts : victoryR1Points, sc ? sc.kill : CC_VICTORY_R1_KILL, 'stage', 0, null, null,
    {lobbySize:Math.min(field.length, S.lobby), stageName:title, mapReplay:true, choices:true, stopOnYourDeath:true,
     dropEachGame:(g, room)=>(g===1 && r.spot!=null) ? ccDcDropGroups(room||field, you, r) : careerLandingPick(room||field, you, title, ['victory'])});
  removeSkipButton();
  const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
  const place=ranked.indexOf(you)+1, wins=you.wins||0, kills=you.stageElims||0;
  cr.form=clamp((cr.form||0)+ccNobleForm(place, field.length), -CC_FORM_MAX, CC_FORM_MAX);
  careerReachAdd(1);
  careerNews(place<=10 ? 'good' : 'flat', 'lfNewsNoble', [title, place, field.length, kills, you.stagePts||0, ccNobleForm(place, field.length)]);
  r.res={place:place, of:field.length, pts:you.stagePts||0, kills:kills, wins:wins};
  careerSave();
  const shell=createStageCardShell(title+' · '+field.length);
  await revealStageLog(you, shell, true);
  finalizeStageCard(shell, place, field.length, you.stagePts, place<=5, false, L().dcSessRes(place, field.length, you.stagePts||0, kills, wins));
  await revealStandings(shell, ranked, you, 5, null, null, null, null, false);
  S.restore();
  const box=document.createElement('div'); box.className='stage-card '+(place<=5 ? 'pass' : 'fail');
  box.innerHTML='<h4>'+esc(title)+' <span class="stage-badge '+(place<=5 ? 'pass' : 'fail')+'">#'+place+'</span></h4>'+
    '<div class="stage-detail"><div>'+esc(L().dcSessRes(place, field.length, you.stagePts||0, kills, wins))+'</div></div>'+
    '<div class="stage-actions"><button class="btn-primary" onclick="ccDcBack()">'+esc(L().dcBackDc)+'</button></div>';
  document.getElementById('majorStages').appendChild(box);
  box.scrollIntoView({block:'end', behavior:'smooth'});
}
// Каналы скримов: объявление админа, запись на блок, чек-ин с кодом, карта дропов, игра.
function ccDcScrHTML(kind, chan, msg){
  const T=L(), r=ccDcScrReg(), mine=r && r.kind===kind ? r : null, other=r && r.kind!==kind;
  const why=ccDcScrWhy(kind), org=ccDcScrOrg(kind), a=ccActById(ccDcScrAct(kind));
  const ann=chan(T.dcScrims, msg(org+' Admin', true, '<p>'+esc(T.dcScrAnn(CC_DC_SCR_SESS.map(s=>s.n+' '+s.t).join(', ')))+'</p>'));
  const list=CC_DC_SCR_SESS.map(s=>{ const on=mine && mine.sess===s.id;
    const b=on ? '<span class="dc-ok">✓ '+esc(T.dcRegDone)+'</span>'+(mine.done ? '' : ' <button class="dc-btn ghost sm" onclick="ccDcScrUnreg()">'+esc(T.dcUnreg)+'</button>')
      : (r || why) ? '' : '<button class="dc-btn sm" onclick="ccDcScrRegister(\''+kind+'\',\''+s.id+'\')">'+esc(T.dcReg)+'</button>';
    return '<div class="dc-sess'+(on ? ' on' : '')+'"><span><b>'+esc(s.n)+'</b> <i>'+s.t+'</i></span>'+b+'</div>'; }).join('');
  let step='';
  if(mine && mine.done && mine.res){
    const x=mine.res; step='<div class="dc-res">'+esc(T.dcSessRes(x.place, x.of, x.pts, x.kills, x.wins))+'</div>';
  } else if(mine && !mine.checked){
    step='<div class="dc-act"><button class="dc-btn" onclick="ccDcScrCheckIn()">'+esc(T.dcCheckIn)+'</button></div>';
  } else if(mine){
    const has=mine.spot!=null;
    step='<p class="dc-code">'+esc(T.dcCode(mine.code))+'</p>'+
      '<div class="dc-act"><button class="dc-btn'+(has ? ' ghost' : '')+'" onclick="ccDcDropOpen(\'scr\')">📍 '+esc(has ? T.dcDropEdit : T.dcDropBtn)+'</button>'+
      (has ? '<span class="dc-sub">'+esc(T.landingZoneSuffix(mine.spot+1))+'</span>' : '')+'</div>'+
      '<div class="dc-act"><button class="dc-btn"'+(why || !has ? ' disabled' : '')+' onclick="ccDcScrRun()">'+esc(T.dcPlay)+' <em>'+(a ? a.energy : 40)+T.ccEnergyMark+'</em></button>'+
      (why ? '<span class="dc-why">'+esc(why)+'</span>' : !has ? '<span class="dc-why">'+esc(T.dcDropNeed)+'</span>' : '')+'</div>';
  } else step='<p class="dc-sub">'+esc(other ? T.dcRegOther : why || T.dcSteps)+'</p>';
  return ann+
    '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcScrims)+'-'+esc(T.dcRegChan)+'</div>'+list+'</div>'+
    '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcDropChan)+'</div>'+step+'</div>';
}
// Каналы регистрации и чек-ина сервера (kind: 'pc' | 'mob').
function ccDcSessHTML(kind){
  const T=L(), r=ccDcReg(), mine=r && r.kind===kind ? r : null, other=r && r.kind!==kind;
  const why=ccDcWhy(kind==='mob' ? 'mobJoin' : 'pcJoin');
  const list=CC_DC_SESS.map(s=>{ const on=mine && mine.sess===s.id;
    const b=on ? '<span class="dc-ok">✓ '+esc(T.dcRegDone)+'</span>'+(mine.done ? '' : ' <button class="dc-btn ghost sm" onclick="ccDcUnreg()">'+esc(T.dcUnreg)+'</button>')
      : (r || why) ? '' : '<button class="dc-btn sm" onclick="ccDcRegister(\''+kind+'\',\''+s.id+'\')">'+esc(T.dcReg)+'</button>';
    return '<div class="dc-sess'+(on ? ' on' : '')+'"><span><b>'+esc(s.n)+'</b> <i>'+s.t+'</i></span>'+b+'</div>'; }).join('');
  let check='';
  if(mine && mine.done && mine.res){
    const x=mine.res; check='<div class="dc-res">'+esc(T.dcSessRes(x.place, x.of, x.pts, x.kills, x.wins))+(x.note ? ' · '+esc(x.note) : '')+'</div>';
  } else if(mine && !mine.checked){
    check='<div class="dc-act"><button class="dc-btn" onclick="ccDcCheckIn()">'+esc(T.dcCheckIn)+'</button></div>';
  } else if(mine){
    const has=mine.spot!=null;
    check='<p class="dc-code">'+esc(T.dcCode(mine.code))+'</p>'+
      '<div class="dc-act"><button class="dc-btn'+(has ? ' ghost' : '')+'" onclick="ccDcDropOpen(\'cust\')">📍 '+esc(has ? T.dcDropEdit : T.dcDropBtn)+'</button>'+
      (has ? '<span class="dc-sub">'+esc(T.landingZoneSuffix(mine.spot+1))+'</span>' : '')+'</div>'+
      '<div class="dc-act"><button class="dc-btn"'+(why || !has ? ' disabled' : '')+' onclick="ccScrimRun()">'+
      esc(T.dcPlay)+' <em>'+CC_DC_ENERGY+T.ccEnergyMark+'</em></button>'+(why ? '<span class="dc-why">'+esc(why)+'</span>' : !has ? '<span class="dc-why">'+esc(T.dcDropNeed)+'</span>' : '')+'</div>';
  } else check='<p class="dc-sub">'+esc(other ? T.dcRegOther : why || T.dcSteps)+'</p>';
  const f=ccDcSessFmt(kind);
  return '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcRegChan)+'</div>'+
      '<p class="dc-sub">'+esc(T.dcFmt(f.games, kind==='mob' ? 16 : 100))+(kind!=='mob' && ccCareerRegion()==='EU' ? ' '+esc(T.dcRules) : '')+'</p>'+list+'</div>'+
    '<div class="dc-chan"><div class="dc-chan-h"># '+esc(T.dcCheckChan)+'</div>'+check+'</div>';
}
function ccDcServer(id){ CH_DC=id; careerRenderHub('discord'); }
function ccDiscordHTML(){
  const T=L(), cr=CAREER.career, srv=CH_DC||'pc';
  const servers=[['pc', 'PC', ccPracSrv()], ['mob', '📱', T.dcSrvMob], ['own', '★', T.dcSrvOwn]];
  const last=cr.dcLast && cr.dcLast.day===careerToday() ? cr.dcLast : null;
  const btn=(kind, label)=>{ const why=ccDcWhy(kind);
    return '<div class="dc-act"><button class="dc-btn"'+(why ? ' disabled' : '')+' onclick="ccDcGo(\''+kind+'\')">'+esc(label)+
      ' <em>'+CC_DC_ENERGY+T.ccEnergyMark+'</em></button>'+(why ? '<span class="dc-why">'+esc(why)+'</span>' : '')+'</div>'; };
  const res=kinds=>(last && kinds.indexOf(last.kind)>=0)
    ? '<div class="dc-res">'+esc(T.dcResult(last.wins, ccNum(last.cash)))+(last.grow ? ' · '+esc(T.ccMobTitle)+' +'+last.grow.toFixed(2) : '')+'</div>' : '';
  const msg=(author, bot, body)=>'<div class="dc-msg"><span class="dc-av'+(bot ? ' bot' : '')+'">'+esc(String(author).slice(0, 2).toUpperCase())+'</span>'+
    '<div class="dc-msg-in"><b>'+esc(author)+(bot ? '<i class="dc-bot">BOT</i>' : '')+'</b>'+body+'</div></div>';
  const chan=(name, body)=>'<div class="dc-chan"><div class="dc-chan-h"># '+esc(name)+'</div>'+body+'</div>';
  let body='';
  if(srv==='pc'){
    // Кастомки ПК — сессии сервера практики региона (занятие noble: одна игра на сотню, таблица недели, форма от места).
    const sv=ccNobleServer(), tier=ccNobleTier();
    const ladder=ccCareerRegion()==='EU' ? chan(T.dcLadder, '<div class="dc-ladder">'+CC_NOBLE_LADDER.map((t,i)=>
        '<span class="dc-tier'+(i===tier ? ' on' : i<tier ? ' lock' : '')+'">'+(i<tier ? '🔒 ' : i===tier ? '✓ ' : '')+esc(t.name)+(i===tier ? ' · '+esc(T.dcYouHere) : '')+'</span>').join('')+'</div>') : '';
    body=chan(T.dcSession, msg(ccPracSrv(), true, '<p>'+esc(T.dcSessionTxt(sv.name))+'</p>'))+ccDcSessHTML('pc')+ladder+
         ccDcScrHTML('pc', chan, msg);
  } else if(srv==='mob'){
    body=chan(T.dcAnnounce, msg(T.dcSrvMob, true, '<p>'+esc(T.dcLobbyMob(CC_DC_MOB_RATE, CC_DC_MOB_PER_WIN))+'</p>'+
           '<p class="dc-sub">'+esc(T.ccMobTitle+' '+ccMobileOvr().toFixed(1))+'</p>'))+ccDcSessHTML('mob')+
         ccDcScrHTML('mob', chan, msg);
  } else {
    body=chan(T.dcHostChan, msg(CAREER.player.nick, false, '<p>'+esc(T.dcHostPc(ccNum(ccHostPerWin())))+'</p>'+btn('pcHost', T.dcHostBtn))+
           msg(CAREER.player.nick, false, '<p>'+esc(T.dcHostMob(ccNum(ccMobHostPer())))+'</p>'+btn('mobHost', T.dcHostBtn))+
           res(['pcHost','mobHost'])+(last && last.who && last.who.length && /Host/.test(last.kind) ? '<div class="dc-res">'+esc(T.dcWinners(last.who.map(h=>'@'+ccHandle(h)).join(', ')))+'</div>' : ''));
  }
  return '<div class="ch-tile dc-wrap"><div class="dc-srvs">'+servers.map(([id, ic, name])=>
      '<button class="dc-srv'+(srv===id ? ' on' : '')+'" title="'+esc(name)+'" aria-label="'+esc(name)+'" onclick="ccDcServer(\''+id+'\')">'+esc(ic)+'</button>').join('')+'</div>'+
    '<div class="dc-body"><h4 class="dc-name">'+esc((servers.find(s=>s[0]===srv)||servers[0])[2])+'</h4>'+body+'</div></div>';
}
/* Бросок дня. Один на день, кидается когда день впервые спросили, и сразу
   в сейв: перезагрузка страницы читает уже брошенное, а не кидает заново —
   релоадом лучший день не выторговать. Прошлые дни никто не спрашивает
   (careerDayClosed и панель смотрят только на сегодня), поэтому хранится
   ровно один день, и сейв не растёт. */
function ccDayRoll(iso){
  const cr=CAREER && CAREER.career;
  if(!cr) return null;
  if(!cr.luck || cr.luck.day!==iso){
    cr.luck={day:iso,
      woe: Math.random()<CC_MISFORTUNE_CHANCE
             ? (Math.random()<0.7 ? 'power' : 'sick') : null,
      ev:  Math.random()<CC_DAY_EVENT_CHANCE
             // Жребий — среди того, что сегодня возможно: развилка с условием
             // (when) не занимает место в броске, пока условия нет, иначе
             // доля дней с событием проседала бы вдвое. Принудительные не в жребии.
             ? (function(){ const pool=CC_DAY_EVENTS.filter(e=>!e.forced && (typeof e.when!=='function' || e.when()));
                            return pool.length ? pool[Math.floor(Math.random()*pool.length)].id : null; })() : null};
    careerSave();
  }
  return cr.luck;
}
function ccDayEventOn(iso){
  const cr=CAREER && CAREER.career;
  if(!cr) return null;
  if((careerYearDays().get(iso)||[]).length) return null;
  if((cr.did||{})[iso]) return null;
  // Школа и уход клуба приходят по делу, раньше жребия. См. careerForcedEvent.
  const forced=careerForcedEvent(iso);
  if(forced) return forced;
  const luck=ccDayRoll(iso);
  const ev=luck && luck.ev && CC_DAY_EVENTS.find(e=>e.id===luck.ev);
  if(!ev) return null;
  if(typeof ev.when==='function' && !ev.when()) return null;
  // A stand-in offer needs somebody to stand in beside, and a sponsor cannot
  // ask for a video when there is no sponsor.
  if(ev.id==='scrimup' && !careerMateRec()) return null;
  if(ev.id==='promo' && !ccSponsor()) return null;
  // На кастомку зовут по числу, а не по знакомству: не дорос PR — приглашения
  // нет вовсе, и день проходит как обычный. См. CC_CUSTOM_PR.
  if(ev.id==='custom' && !ccCustomInvited()) return null;
  return ev;
}
function careerDayEvent(id, take){
  const ev=CC_DAY_EVENTS.find(e=>e.id===id); if(!ev) return false;
  if(careerDayDone()) return false;
  // Развилка: take — это id ответа; у старых событий — да/нет.
  let eff, optId=null;
  if(ev.opts){
    const o=ev.opts.find(x=>x.id===take) || ev.opts[0];
    eff=o.eff||{}; optId=o.id;
  } else eff=take ? ev.take : ev.pass;
  const cr=CAREER.career;
  if((eff.energy||0)>careerEnergy()) return false;
  if(eff.rep) careerRepAdd(eff.rep);
  if(eff.spotClear) careerSpotClear();
  if(eff.stat) careerStatBump(ccWeakestAttr(), eff.stat);
  if(eff.orgLeave && CAREER.org && !CAREER.org.own){
    const org=CAREER.org;
    careerNews('flat', 'ccNewsLeftOrg', [org.name], {by:ccOrgBy(org.name)});
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null;
  }
  if(eff.orgGone && CAREER.org && !CAREER.org.own){
    // Клуб закрывает состав: месяц зарплаты на прощание, и ты свободен.
    const org=CAREER.org, sev=org.salary||0;
    if(sev){ cr.balance=(cr.balance||0)+sev; cr.wages=(cr.wages||0)+sev; }
    careerNews('bad', 'ccNewsOrgGone', [org.name, ccMoney(sev)], {by:ccOrgBy(org.name)});
    careerNews('flat', 'ccPostBye', [ccHandle(org.name)]);
    CAREER.org=null; CAREER.offers=null; cr.orgQuit=null;
  }
  if(eff.lft){ careerNews('flat', 'ccPostLft', []); careerReachAdd(2*CC_REACH_DIV(cr.division)); }
  if(eff.energy) careerSpend(eff.energy);
  if(eff.restore) careerRestore(eff.restore);
  if(eff.form) cr.form=clamp((cr.form||0)+eff.form, -CC_FORM_MAX, CC_FORM_MAX);
  if(eff.cash){ cr.balance=(cr.balance||0)+eff.cash; cr.side=(cr.side||0)+eff.cash; }
  if(eff.reach) careerReachAdd(eff.reach*CC_REACH_DIV(cr.division));
  // Every seat feels the week, not only the first one.
  if(eff.morale) careerMateRecords().forEach(pr=>{
    pr.patience=clamp((pr.patience||0)+eff.morale, 0, 100); });
  cr.did=cr.did||{};
  cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat('ev:'+id);
  /* У кастомки выплата не в таблице событий, а в самом вечере: сыграл — и
     столько, сколько выиграл. Отказ пишется общей строкой, как у всех. */
  if(id==='custom' && take){
    const r=ccCustomPlay();
    careerNews(r.wins?'good':'flat', 'ccDayEvcustomTake', [r.wins, ccNum(r.cash)]);
    careerSave();
    careerRenderHub('centre');
    return true;
  }
  if(optId!=null) careerNews(eff.rep<0 || eff.form<0 || eff.orgGone ? 'flat' : 'good', 'ccDayEv'+id+'R'+optId, []);
  else careerNews(take?'good':'flat', 'ccDayEv'+id+(take?'Take':'Pass'), []);
  careerSave();
  careerRenderHub('centre');
  return true;
}

/* Energy, one bar. There used to be energy plus a hidden fatigue that cut a day's value by up to half; now energy
   is a store. Training spends it, a night gives a little back, a rest day a lot. A day is always worth half a point,
   what runs out is the ability to do another one: roughly three work days per day off.
   Nothing is dated, so a save that skips a month comes back rested by the nights slept, not by a reset. */
/* How big the store is. A hundred by default, and the desk can make it bigger:
   the chair and the treadmill are the two things in the shop that buy days
   rather than percentages — every ten points of store is another third of a
   training day a week, which is the one upgrade a player feels in the calendar
   rather than in a number. */
function careerEnergyMax(){
  // Best of each slot, plus everything that stands alone: two chairs are one
  // chair, and the better one is the one you are sitting in.
  const slots={};
  // The rooms you are not working in are part of what a day is worth too.
  let extra=(typeof ccFlatCap==='function') ? ccFlatCap() : 0;
  CC_SHOP.forEach(it=>{
    if(!it.cap || !careerOwns(it.id)) return;
    if(!it.slot){ extra+=it.cap; return; }
    slots[it.slot]=Math.max(slots[it.slot]||0, it.cap);
  });
  Object.keys(slots).forEach(k=>{ extra+=slots[k]; });
  /* Больная неделя (см. ev:sick) режет запас на треть, пока не пройдёт. */
  let cap=CC_ENERGY_DAY+extra;
  const cr=CAREER && CAREER.career;
  if(cr && cr.sickUntil && careerToday()<cr.sickUntil) cap=Math.round(cap*2/3);
  return Math.max(30, cap);
}
function careerEnergy(){
  const cr=CAREER.career;
  return clamp(cr.energy!=null ? cr.energy : careerEnergyMax(), 0, careerEnergyMax());
}
function careerSpend(n){
  const cr=CAREER.career;
  cr.energy=clamp(careerEnergy()-n, 0, careerEnergyMax());
}
function careerRestore(n){
  const cr=CAREER.career;
  cr.energy=clamp(careerEnergy()+n, 0, careerEnergyMax());
}
// One thing a day, whatever it costs: the day is the unit, energy is the week.
function careerDayDone(){
  const cr=CAREER.career;
  return ((cr.did||{})[careerToday()]||[]).length>0;
}
/* Energy is the limit for a day, not the calendar. The six sessions are an hour each and you take as many as
   you can pay for. Career pacing comes from income (12 a night, 45 for a rest day), so it does not change.
   Scrim, stream and rest still take the whole day; rest has to, or resting three times a day would print energy.
   A day that already has something on it is the same. */
/* Стрим и спонсорские вечера больше не съедают день — его пункт 16 со
   страницы «ы», 22 августа: «стримы и спонсор тратят весь день иногда, пусть
   30 энергии тратят». День закрывают отдых и события, которые и есть весь
   вечер (чужой скрим, оффлайн); эфир — это тридцать энергии из магазина дня,
   как любое занятие. */
const CC_DAY_WHOLE={rest:1, host:1};
const CC_DAY_OPEN_EV={'ev:show':1, 'ev:promo':1};
function ccDayShuts(id){
  return CC_DAY_WHOLE[id] ||
         (String(id).indexOf('ev:')===0 && !CC_DAY_OPEN_EV[id]);
}
function careerDayClosed(){
  const list=((CAREER.career.did||{})[careerToday()]||[]);
  // Вечер без света — вечер без кнопок. См. ccMisfortune.
  if(typeof ccMisfortune==='function' && ccMisfortune(careerToday())==='power') return true;
  return list.some(ccDayShuts);
}

/* Doing one.

   The numbers move the player's own six rather than the rating, so where a
   career spent its year shows in the shape of the card and not only in its
   headline. The rating follows from the six through ATTR_W, the way it does for
   every other card on the roster, and it still cannot pass the ceiling the
   career drew.

   A coach and a desk multiply this, and they read as one number from one place
   so a new thing in the shop never has to be wired into seven activities. */
function careerDayGear(){ return 1 + ((CAREER.gear && CAREER.gear.train) || 0) + ccStayTrain(); }
// What the stream rig adds to a night's followers. Nothing owned, nothing added.
function ccGearReach(){ return (CAREER.gear && CAREER.gear.reach) || 0; }
function careerDoAct(id){
  const act=ccActById(id); if(!act) return null;
  const cr=CAREER.career, pl=CAREER.player;
  // The store is what says how much of a day there is, and the three things
  // that take all of it say when there is none left. See careerDayClosed.
  if(careerDayClosed()) return null;
  // С травмой — только отдых, разговор и эфир.
  if(typeof ccLifeHurt==='function' && ccLifeHurt() && !(act.rest || act.id==='talk' || act.id==='stream')) return null;
  /* Цена вечера — у ВИДА эфира, а не у кнопки дня. Виды стоят по-разному
     (марафон 55, эфир с турнира 20), и раньше careerDoAct брал плоские
     тридцать, а разницу доплачивал вызывающий. Пока виды были только дороже,
     это работало; турнирный эфир дешевле — и порог «хватит ли энергии» стоял
     на тридцати, то есть с двадцатью пятью кнопка молча ничего не делала.
     Считает цену тот, кто её списывает. См. CC_STREAM_KINDS. */
  const cost = (act.id==='stream' && typeof ccStreamKind==='function')
    ? (ccStreamKind(CC_STREAM_KIND).energy || act.energy) : act.energy;
  if(careerEnergy()<cost) return null;
  // A rest on a full store restores nothing and takes the whole day with it.
  // The button already says so; this is the same rule where the day is spent,
  // so no other caller can hand a player an evening for nothing.
  if(act.rest && careerEnergy()>=careerEnergyMax()) return null;
  // Своя кастомка без аудитории или без фонда не проводится — и день не тратит.
  if(act.host && ccHostWhy()) return null;
  if(act.mobile && !ccMobileOwn()) return null;   // без телефона или планшета не тренируется
  careerSpend(cost);
  if(act.mobile){
    const g=ccMobileTrain(!!act.mobScrim);
    cr.did=cr.did||{}; cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat(id);
    careerSave();
    return {id, moved:{}, energy:careerEnergy(), mobile:g};
  }
  if(act.host) ccHostRun();
  if(act.rest) careerRestore(act.rest);
  // The same taper the cup's own growth uses. Without it training ran at full
  // speed right up to the ceiling and every career hit its own in the first
  // season, then stood still for seven more — a mode that is over after a year.
  // The last ten points before the ceiling are where a career slows down, and
  // that has to be true whether the points come from a tournament or a day at
  // the aim trainer.
  const now = pl.ovrExact!=null ? pl.ovrExact : pl.ovr;
  // Training lifts you to the level of the room you are in, and no further:
  // past your division's own band you are no longer learning from the people
  // around you, and the only thing left that makes you better is beating them.
  // Everything above the cap comes from results — careerApplyGrowth, which
  // still reads the top of the scale.
  const taper = clamp((careerTrainCap()-now)/CAREER_TAPER, 0, 1);
  // What a day is worth never changes: the store is what runs out, not the
  // value of the work. That is the whole point of folding fatigue into it.
  const mult=careerDayGear()*taper;
  // Who a scrim is against and how the set went, both decided before the day is
  // spent — see ccScrimFoe and ccScrimSet. A day that is not a scrim gets null
  // for both and reads exactly as it did.
  /* Who a scrim is against, decided before the day is worth anything, because
     who it is against is most of what it is worth.

     The strongest person in this week's own inbox list - that is who you could
     actually get hold of, and the list is already the week's rather than a new
     draw. Playing somebody better teaches more: half again against somebody five
     points over you, two thirds against somebody five under. */
  const foe=act.versus ? ccScrimFoe() : null;
  const scrim=foe ? ccScrimSet(foe, now) : null;
  // The coach pays into his own half of the game, so which one is hired shows
  // in the shape of the card and not only in how fast it grows.
  const coach=ccCoach();
  const moved={};
  // A career with no six numbers of its own spent every training day on nothing:
  // the block below was skipped, the energy was gone and neither an attribute nor
  // the rating moved, silently, for as long as the save lasted. That is an old
  // save, and it is every career played as a real card — their shape lives on the
  // roster. Both get their own copy the first time they train, taken from the
  // card they are actually playing, so the day is always worth something.
  if(!pl.attrs) pl.attrs=ccOwnAttrs();
  {
    /* And the difficulty sits on the training too.

       It sat only on careerDevelopNow — the age curve — which the composition
       measurement of 19 August showed is a sliver of actual growth: a career is
       built in the training room, so a Legend career was 7% longer, not five
       times. A player then finished the whole game in three or four hours and
       said the improving is too fast; his answer was to make the harder modes
       cut what a session pays. Same factor the develop term already uses, so
       one setting means one thing everywhere: Easy 1.00, Pro 0.50, Elite 0.25,
       Legend 0.10. Easy is untouched. */
    // Оценка занятия D…A+ (ccDrillGrade) — только у тренировок с приростом.
    const grade=(String(act.id).indexOf('tr')===0 && Object.keys(act.gain||{}).length) ? ccDrillGrade(act.id) : null;
    // Эфир с тренировкой берёт прирост тренировки trPit в доле вида (CC_STREAM_KINDS train).
    const sk=(act.id==='stream' && typeof ccStreamKind==='function') ? ccStreamKind(CC_STREAM_KIND) : null;
    const gain=(sk && sk.train) ? (g=>{ const o={}; Object.keys(g).forEach(k=>{ o[k]=g[k]*sk.train; }); return o; })((ccActById('trPit')||{}).gain||{}) : (act.gain||{});
    Object.keys(gain).forEach(k=>{
      const by=gain[k]*mult*(coach && coach.keys.indexOf(k)>=0 ? 1+coach.train : 1)
               *careerDiff().age*(scrim ? scrim.mult : 1)*ccFocusMult(k)*(grade ? grade.mult : 1);
      pl.attrs[k]=clamp((pl.attrs[k]||50)+by, ccAttrFloor(k), 99);
      moved[k]=by;
    });
    if(Object.keys(moved).length){
      const raw=ATTR_KEYS.reduce((sum,k)=>sum+(pl.attrs[k]||50)*ATTR_W[k],0);
      // Never past the cap by training, and never downwards: a career already
      // above its room's band keeps what it won, it just stops learning there.
      pl.ovrExact=clamp(Math.max(now, Math.min(raw, careerTrainCap())), 40, 99);
      pl.ovr=Math.round(pl.ovrExact);
      // And the six carry their own rating, because the card reads it: attrsFor
      // lifts a card onto _targetOvr starting from the ovr stored beside the
      // attributes, and a stale one there is a first shift of thirty points that
      // clamps every high attribute at 99 and flattens the shape for good.
      pl.attrs.ovr=Math.round(raw);
      ccGoalCheck();
    }
  }
  // Everything tires except the thing that is for not tiring.
  // Reach grows faster the higher you are: the same stream in Division 1 is seen
  // by more people than in Division 5, which is what a division is from outside.
  // A stream that nobody is told about is not a stream. The day both grows the
  // audience and posts, which is the only reason the growth is visible at all.
  // Разбор меты: день в новом сезоне, который снимает штраф. См. careerMetaDay.
  if(act.meta) careerMetaDay();
  if(act.noble) ccNobleRun();
  if(act.id==='trSur') ccRkSession();
  if(act.versus) ccChemBump(2);   // скрим вместе — сыгранность
  // Прирост недели — для панели Тренировочного центра (ccTrainPanelHTML).
  try{ const lf=ccLife(), wk=ccWeekTag(); if(!lf.tw || lf.tw.wk!==wk) lf.tw={wk, g:{}};
       Object.keys(moved).forEach(k=>{ lf.tw.g[k]=(lf.tw.g[k]||0)+moved[k]; }); }catch(e){}
  if(act.map) ccMapWork();
  if(act.reach){
    // A night on stream, priced per rung. See CC_STREAM_REACH.
    /* Вид эфира. Кнопка дня — это 'grind' с множителями в единицу, поэтому
       день, нажатый как раньше, и считается как раньше; остальные виды
       приходят из вкладки стримов (careerStreamGo). Коллаб добавляет часть
       аудитории напарника — та же арифметика, что у Про-Ама. */
    const sk = act.id==='stream' ? ccStreamKind(CC_STREAM_KIND) : {reach:1, cash:1, subs:1};
    const per = act.id==='stream'
      ? CC_STREAM_REACH(cr.division) * (1 + ccGearReach())
      : CC_REACH_DIV(cr.division);
    careerReachAdd(act.reach*per*(sk.reach||1));
    if(sk.mate){
      const cm=ccStreamMate();
      // Повторы с тем же креатором дают меньше; ему уходит своя доля (см. CC_COLAB_*).
      const from=(cm && typeof ccColabFrom==='function') ? ccColabFrom(cm.name) : 0;
      if(from){
        const give=ccColabGive();
        careerReachAdd(from, true);
        cr.colabN=cr.colabN||{}; cr.colabN[hKey(cm.name)]=(cr.colabN[hKey(cm.name)]||0)+1;
        cr.colabGave=cr.colabGave||{}; cr.colabGave[hKey(cm.name)]=(cr.colabGave[hKey(cm.name)]||0)+give;
        if(cm.deal) cr.colabWith=null;   // договор — на один эфир
        careerNews('good', 'ccNewsStreamColab',
                   [ccHandle(cm.name), ccNum((cm.tw && cm.tw[1])||0), ccNum(from), give ? ccNum(give) : '']);
      }
    }
    /* And a stream pays, which is the other half of what an audience is for.

       Followers already priced a sponsor and a club offer, so the number was
       worth something twice over and never in the player's hand. A stream day
       is somebody sitting there for an evening being watched, and that is paid
       work in this scene - subs, bits, ads - so the day that grows the audience
       also earns off the one already there.

       Deliberately small against a Weekly Final: at fifty thousand readers it is
       twenty-five dollars, and a month of streaming every day is under a
       thousand. It is not a career, it is what makes the desk reachable in
       Division 4 where the ladder pays nothing at all. Read off the audience
       standing before the stream, so the first payday is not the same day the
       first follower arrives. */
    // Деньги эфира — с множителем вида: общение платит лучше, марафон длиннее.
    const own=Math.round(careerReach()/CC_STREAM_PER*(sk.cash||1));
    // And the brand's slot, on the nights there is a stream to put it in.
    const sps=ccSponsorsAll();
    const ad=sps.reduce((sum,x)=>sum+(x.pay||0), 0);
    const paid=own+ad;
    if(ad){
      sps.forEach(x=>{ x.paid=(x.paid||0)+(x.pay||0); });
      cr.sponsored=(cr.sponsored||0)+ad;
    }
    /* Твич — своя аудитория, а не твиттер. Его пункт 8 со страницы «ы»,
       22 августа: подписчики врозь, трансляция максимум два часа, и после неё
       приходит статистика. Зрители читаются с обеих аудиторий, твич растёт от
       самого эфира; пик посеян от даты, чтобы отчёт вечера не менялся от
       перерисовки.

       И пункт 9 там же: без спонсора, но с менеджером, вечер несёт разовый
       рекламный баннер — бренд из своего списка, деньги сразу на баланс. */
    const tw=cr.twitch||0;
    const rndS=careerRng(ccHashStr('stream|'+(cr.season||1)+'|'+careerToday()));
    // Доли с насыщением по размеру канала — см. CC_TW_SAT (его «слишком много стримы онлайн», 13.09).
    const viewers=ccTwViewersOf(tw, careerReach());
    const peak=Math.round(viewers*(1.6+rndS()*0.9));
    const newTw=Math.max(1, Math.round(viewers*0.18*ccTwFolRate(tw)*(0.7+rndS()*0.6)*(sk.subs||1)));
    cr.twitch=tw+newTw;
    const dono=Math.round(viewers*0.04*(sk.cash||1));
    let banner=0, brand=null;
    if(!sps.length && CAREER.agent){
      brand=CC_STREAM_BRANDS[Math.floor(rndS()*CC_STREAM_BRANDS.length)];
      banner=20+Math.round(viewers*0.1);
    }
    const takeAll=paid+dono+banner;
    if(takeAll>0){
      cr.balance=(cr.balance||0)+dono+banner+(paid>0?paid:0);
      cr.streamed=(cr.streamed||0)+own+dono+banner;
    }
    /* Весь стрим — лично, не в ленту. Первый скриншот, снял
       твит со статистикой; второй («не нужно это в сошиал», лента Sky из трёх
       «Отстримил вечер. $71» подряд) — снял и денежные твиты: ccNewsStreamAd/
       Banner/Paid больше не постятся, ключи живы ради старых сейвов. Деньги
       на балансе, отчёт вечера — строкой в панели дня, теперь с заработком. */
    // Шестым — длина эфира: до партнёрки часы считались, а отчёт всё равно
    // писал «2 ч» текстом. Старые сейвы шестого не имеют, у них и остаётся 2.
    /* m — тот же заработок вечера числом. Строка a[3] уже отформатирована, а
       эфиру с турнира её потом досчитывать (ccStreamCupAfter): разбирать число
       обратно из «1 200» нельзя, поэтому оно едет рядом. */
    cr.streamLast={day:careerToday(), m:dono+banner+(paid>0?paid:0),
                   a:[viewers, peak, newTw,
                   ccNum(dono+banner+(paid>0?paid:0)), ccNum(cr.twitch), sk.hours||4]};
    /* Журнал эфиров за месяц — на нём стоит партнёрская программа (ccTwStatus):
       Twitch считает разные дни, часы и средний онлайн за последние 30 дней,
       поэтому вечер должен оставить после себя день, длину и зрителей. */
    cr.streamLog=(cr.streamLog||[]).concat([{d:careerToday(), v:viewers, h:sk.hours||4}]);
    ccStreamLogTrim(cr);
    careerTwTick();
  }
  /* The week that does not let go.

     Everything in the day loop costs energy and a night gives it back, so a
     career could train three hundred and sixty days a year and the only thing
     that ever said otherwise was the bar. Nobody plays a year like that: the
     scene's own word for what happens is burnout, and it is the reason the
     shop sells a chair, a standing desk and a gym in the first place.

     Counted in days rather than energy, because that is what it is - a run of
     days with no day off in them. Rest is the only thing that clears it, and it
     clears it whole: a day off is a day off. What it costs is form, which is
     the number every result already reads, so a burnt-out career finishes worse
     without anything new having to be invented to punish it. */
  if(act.rest) cr.grind=0;
  else cr.grind=(cr.grind||0)+1;
  /* A scrim is against a named duo and shows the score. Opponent is the strongest
     in this week's inbox list. Gain scales with the gap: up to x1.5 against someone
     5 points above, x2/3 against 5 below. A win gives +0.25 form. The score is twelve
     rounds, each decided by the rating gap the same way a lobby is. */
  /* And the score, which is the part a player can argue with.

     A scrim used to be the most expensive day in the store and the only one with
     no evidence attached: thirty-eight energy, four attributes up a fraction,
     and nothing on the screen afterwards. A scrim in this scene is a set against
     a named duo and everybody remembers the score. Twelve rounds, each decided
     by the gap the same way a lobby is, and taking the set is worth a quarter
     point of form - a result you can point at. */
  if(act.focus) cr.focus=act.focus;
  /* Разговор считается на месте, у каждого свой: настрой у соседей разный, и
     одному вечер нужен, а другому нечего сказать. Скрим по-прежнему плоские
     шесть — он общий на всех и не про слова. */
  if(act.talk){
    const said=[];
    careerMateRecords().forEach((pr,i)=>{
      const was=pr.patience==null?CAREER_PATIENCE_START:pr.patience;
      const move=careerTalkMove(pr);
      pr.patience=clamp(was+move, 0, 100);
      pr.talked=careerToday();
      const card=careerMates()[i];
      if(card) said.push({who:card.handle, was:was, move:move});
    });
    /* И разговор говорит, о чём он был. Строка выбирается по тому же порогу,
       по которому careerMoodKey рисует настрой: с недовольным разбирают, что
       не идёт, с ровным договариваются держать. Без этого «поговорить» была бы
       кнопкой «+3», а он просил диалог. */
    said.forEach(s=>{
      const key = s.move<=0 ? 'ccNewsTalkAgain'
                : s.was<45  ? 'ccNewsTalkFix'
                : s.was<70  ? 'ccNewsTalkKeep'
                :             'ccNewsTalkFine';
      /* «С @X всё и так нормально, просто поболтали» твитом в ленту — шум:
         Скриншот («не нужно это в сошиал»). Разговор, в котором
         ничего не случилось, ленты не заслуживает; остальные три исхода —
         починили, договорились, не вышло — остаются. */
      if(key==='ccNewsTalkFine') return;
      careerNews(s.move>=3 ? 'good' : 'flat', key, [s.who]);
    });
  }else if(act.morale) careerMateRecords().forEach(pr=>{
    pr.patience=clamp((pr.patience==null?CAREER_PATIENCE_START:pr.patience)+act.morale, 0, 100); });
  // And the set, said out loud with the score in it: taking one is a quarter
  // point of form, which is a result a player can point at.
  if(scrim){
    if(scrim.won) cr.form=clamp((cr.form||0)+CC_SCRIM_FORM, -CC_FORM_MAX, CC_FORM_MAX);
    careerNews(scrim.won ? 'good' : 'flat', 'ccNewsScrim',
               [ccHandle(scrim.who), scrim.mine, scrim.theirs]);
  }
  cr.did=cr.did||{};
  cr.did[careerToday()]=(cr.did[careerToday()]||[]).concat(id);
  careerSave();
  return {id, moved, energy:careerEnergy(), scrim:scrim};
}
const CC_PLAYABLE=['cup','victory','eval','reload','final','major','gc','summit','globals','solo','proam','nations'];
// The Major's Play-In and Heats belong to Division 1, but its Last Chance is
// open to all five divisions in Epic's own words, so 'major' cannot be listed
// here wholesale — careerMajorCan decides it stage by stage, and careerEvents
// hides the days that are not this player's.
const CC_D1_ONLY=['final','eval'];
// Where a new career starts: the first week of the measured year holding
// something this player can enter.
//
// Derived rather than written down, because the answer moves. The year opens on
// 1 December and the divisional cups do not start until 2 February, so a career
// pinned to the first of December sits through nine weeks with nothing to press.
// Pinning it to February instead would be wrong the day Reload's Opens become
// enterable — they run on 8 January — so the rule is stated once and the date
// follows from it.
function careerStartDay(){
  const days=careerYearDays();
  /* Карьера, начатая с сезона внутри года (cr.startFrom, экран создания): первый год — с этой даты, не раньше,
     иначе первые дни стояли бы в прошлом сезоне со старыми составами. Следующие годы — с начала. */
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  const at=(cr && cr.startFrom && (cr.season||1)===1) ? cr.startFrom : null;
  for(let w=1; w<=ccYearWeeks(); w++){
    const from=careerWeekStart(w);
    for(let d=0; d<7; d++){
      if(at && ccAddDays(from,d)<at) continue;
      // A Reload day counts only when it is the Opens: everything after them
      // needs a qualification a new career does not have.
      if((days.get(ccAddDays(from,d))||[]).some(e=>
           CC_PLAYABLE.indexOf(e.kind)>=0 && CC_D1_ONLY.indexOf(e.kind)<0 &&
           (e.kind!=='reload' || /Opens$/.test(String(e.id||'')))))
        return (at && from<at) ? at : from;
    }
  }
  return at || ccYearFrom();
}
// Moving the clock. Past the last day of the measured year the career year is
// over — there is no thirty-ninth week to walk into.
/* Where the clock goes after a cup session.
   Below Division 1, Monday and Tuesday are separate sessions (11 games, own table, own token). Promoting on Monday makes Tuesday the next division's session, so you can climb twice a week.
   So the clock goes to the next cup day of the week, else next Monday. Division 1 adds both sessions into one table (careerBanking, cr.d1), but the clock walks the same way. */
/* Which of the week's cup sessions today is.
   Division 1 adds both into one table, below that it's just a label.
   The field is the same both evenings because careerSeed keys on the week, not the day. Exception: Div 2-5 play 13-14 and 18-19 July in one calendar week, split by ccCupWeekSalt.
   Session comes from the cup week, not from counting cup days since Monday, otherwise 18 July would be session three. */
function careerCupSession(){
  const today=careerToday();
  const w=ccCupWeeks().find(r=>r[1]===today || r[2]===today);
  // Неделя из одной сессии (Division 1 Practice, S42): этот вечер и решает —
  // банковать нечего, второго не приедет.
  if(w && !w[2]) return 2;
  return w && w[2]===today ? 2 : 1;
}
// True while Division 1's first evening is being played: the points are banked
// and nothing is settled, because the table this belongs to does not exist yet.
function careerBanking(){
  return CAREER.career.division===1 && careerCupSession()===1;
}
function careerAfterSession(){
  // An evening of eleven games comes out of the same store a training day
  // does, which is what makes a heavy tournament week cost something: play
  // Monday and Tuesday and the days around them are shorter.
  careerSpend(CC_TOURNEY_ENERGY);
  // The next day, like every other move. Tuesday's session arrives because
  // Tuesday arrives, not because the cup hunted for it — and the days between
  // tournaments are days the player still gets to spend.
  return ccAddDays(careerToday(), 1);
}
function careerAdvanceTo(iso){
  /* В командной карьере день двигает close от сервера, а не нажатие.

     Иначе один клиент ушёл бы в завтра, а второй остался бы во вчера — и это
     расхождение уже никакой хеш не поймает, потому что вечера у них будут
     разные. Дверь открывает ccApplyTeamState на время своей работы: день,
     пришедший от сервера, — единственный, который здесь принимается. */
  if(ccMpOn() && !CC_MP_ADVANCE){
    if(!CC_MP_DAY_DUE) return;
    CC_MP_DAY_DUE=false;
  }
  /* А в ГОНКЕ день общий, но карьеры разные: шаг здесь превращается в голос,
     и шагают оба, когда день закрыли оба. Отстающий проходит насквозь — см.
     ccRaceHold. Стоит после командного гейта: одно и то же место, где день
     перестаёт быть личным делом. */
  if(typeof ccRaceHold==='function' && ccRaceHold(iso)){
    ccRaceVote();
    if(typeof careerRenderHub==='function' && document.getElementById('chBody'))
      careerRenderHub('centre');
    return;
  }
  CC_MP_HOLD=true;
  try{ careerAdvanceBody(iso); }
  finally{ CC_MP_HOLD=false; }
  try{ ccRealTeamCall(); }catch(e){}
  // 2023-й: после Мейджора 1 дивизионов нет — ступень сходит в «вся сцена» (ccNoDivisions).
  if(typeof ccIs2023==='function' && ccIs2023()){ ccDiv23Place(); careerMigrateNoDiv(); }
  // 2022-й: дивизионы только осенью — ступень по рейтингу в день Placement Cup, после — «вся сцена».
  if(typeof ccIs2022==='function' && ccIs2022()){ ccDiv22Place(); careerMigrateNoDiv(); }
  // 2019–2020: состав по этапу года (дуо → трио → сквад). См. ccPhaseRoster.
  if(typeof ccSyncPhaseRoster==='function') ccSyncPhaseRoster();
  careerSave();
}
/* ЖИЗНЬ МЕЖДУ ТУРНИРАМИ — ранкед, травмы, поездки на ЛАН, скандалы, икон-скин, Noble.

   Всё хранится в cr.life; тик — раз в день (ccLifeTick из careerAdvanceBody), запреты —
   в careerCanPlayKindOn через ccLifeWhy. Числа — оценка режима, кроме того, что названо
   источником: серверы и формат Noble — nobleprac.com (сессия = одна игра на 90–100 человек,
   уровни Practice / Division 3–1 / Pro Scrims), ранги — лестница Ranked Epic. */
function ccLife(){ const cr=CAREER.career; if(!cr.life) cr.life={}; return cr.life; }
function ccLifeRng(tag){ return careerRng(ccHashStr('life|'+tag+'|'+(CAREER.player.nick||'')+'|'+careerToday())); }

// ---- Травм нет: запястье от выгорания закрывало FNCS-вечера подряд, механику сняли.
// Функция осталась, чтобы вызовы не ломались.
function ccLifeHurt(day){ return null; }

// ---- Скандалы: жалоба → разбор → оправдан / штраф / бан открытых турниров.
const CC_BAN_KINDS=['cup','final','victory','solo','eval','reload'];
// Своего бана нет с 5.10 (см. ccLifeTick): старый из сейва вечер не закрывает.
function ccLifeBan(day){ return null; }

function ccLifeWhy(day, kind){
  if(ccLifeHurt(day)) return 'lfWhyHurt';
  if(ccLifeBan(day) && CC_BAN_KINDS.indexOf(kind)>=0) return 'lfWhyBan';
  return null;
}

// ---- Noble Pro Scrims: сессия — одна игра, таблица по игрокам, сервер по уровню.
/* Сервер практики региона (19.11, его слово: «pc customs это нобл на еу, у других регионов свои кастомки»).
   Проверено 19.11.2026: EU — Noble Practice (nobleprac.com, «EU's Tier 1 Fortnite Practice Server»); NAC, NAW, OCE —
   Vital Scrims (профиль @VitalScrims: «NAC | NAW | ME | OCE», 700K+); ME — Vital Scrims Middle East (@vitalscrimsme);
   BR — Major Scrims (@MajorScrims_, «Fortnite Server Practice Brasil»); ASIA — LYNX Pro Scrim (@LYNX_e_sports, Япония,
   раз в две недели по четвергам; одного большого сервера на регион в X не нашлось). */
const CC_PRAC_SRV={EU:'Noble Practice', NAC:'Vital Scrims', NAW:'Vital Scrims', OCE:'Vital Scrims', ME:'Vital Scrims Middle East',
                   BR:'Major Scrims', ASIA:'LYNX Pro Scrim'};
function ccPracSrv(){ return CC_PRAC_SRV[ccCareerRegion()]||'Vital Scrims'; }
/* Лестница Noble (nobleprac.com, 2026): Noble X — только tier 1 по приглашению; Pro Scrims — топ-1000 Tracker Build PR;
   Division 1 — топ-500…2500 PR; Division 2 — FNCS Division 3 или 1000 PR; Division 3 и Solos Closed — по местам на
   открытых; Practice Scrims и Division 0 — всем. У нас PR — таблица региона карьеры, поэтому пороги те же, что были
   откалиброваны раньше (Pro — Д1 и топ-100 или сила от 88), а Д1/Д2 FNCS ведут в Division 1, Д3 — в Division 2. */
const CC_NOBLE_LADDER=[
  {name:'Noble X',              avg:90, ok:(pr,cr,o)=>o>=93 || (cr.division===1 && pr && pr<=10)},
  {name:'Noble Pro Scrims',     avg:88, ok:(pr,cr,o)=>(cr.division===1 && (pr && pr<=100 || o>=88)) || o>=92},
  {name:'Noble Division 1',     avg:84, ok:(pr,cr,o)=>!ccNoDivisions() && cr.division<=2},
  {name:'Noble Division 2',     avg:80, ok:(pr,cr,o)=>!ccNoDivisions() && cr.division<=3},
  {name:'Noble Division 3',     avg:77, ok:(pr,cr,o)=>o>=80},
  {name:'Noble Solos Closed',   avg:75, ok:(pr,cr,o)=>o>=76},
  {name:'Noble Practice Scrims',avg:72, ok:()=>true}];
function ccNobleTier(){
  const cr=CAREER.career, pr=(typeof careerPrPlace==='function') ? careerPrPlace() : null, o=(CAREER.player && CAREER.player.ovr)||70;
  const i=CC_NOBLE_LADDER.findIndex(t=>t.ok(pr, cr, o));
  // Инвайт за топ-5 сессии (CC_NOBLE_PROMO) держится: на ступень ниже уже не опускает.
  return (cr.nobleInv!=null && cr.nobleInv<i) ? cr.nobleInv : i;
}
function ccNobleServer(){
  const t=CC_NOBLE_LADDER[ccNobleTier()];
  // Вне EU — свой сервер региона; уровень комнаты тот же, по силе и дивизиону.
  return ccCareerRegion()==='EU' ? {name:t.name, avg:t.avg} : {name:ccPracSrv(), avg:t.avg};
}
// Сессия Noble поднимает форму: игра на сотню про — та же практика вечера, что и кап. Чем выше место, тем больше.
function ccNobleForm(place, of){ return place<=Math.ceil(of*0.1) ? 0.4 : place<=Math.ceil(of*0.35) ? 0.2 : 0.1; }
function ccNobleRun(){
  const lf=ccLife(), sv=ccNobleServer(), rng=ccLifeRng('noble');
  const o=(CAREER.player && CAREER.player.ovr)||70, of=90+Math.floor(rng()*9);
  const g=()=>{ let s=0; for(let i=0;i<6;i++) s+=rng(); return (s-3)/Math.sqrt(0.5); };
  const z=(o+careerForm()+g()*4-sv.avg)/5.5;
  const pct=1/(1+Math.exp(-1.7*z));
  const place=Math.max(1, Math.min(of, Math.round((1-pct)*(of-1))+1));
  const kills=Math.max(0, Math.round(pct*6+g()*1.5));
  const pts=victoryR1Points(place)+kills*2;
  const wk=ccMonthKey(careerToday())+'|'+Math.floor(((+careerToday().slice(8,10))-1)/7);
  if(!lf.noble || lf.noble.wk!==wk) lf.noble={wk, server:sv.name, me:0, n:0, rows:ccNobleRivals(sv, wk)};
  lf.noble.me+=pts; lf.noble.n++; lf.noble.server=sv.name;
  // Соперники сервера играют ту же сессию.
  Object.keys(lf.noble.rows).forEach(h=>{ const r=lf.noble.rows[h]; r.p+=Math.max(0, Math.round(victoryR1Points(1+Math.floor(rng()*of))+rng()*8)); });
  const fg=ccNobleForm(place, of), cr=CAREER.career;
  cr.form=clamp((cr.form||0)+fg, -CC_FORM_MAX, CC_FORM_MAX);
  careerNews(place<=10?'good':'flat', 'lfNewsNoble', [sv.name, place, of, kills, pts, fg]);
  return {server:sv.name, place, of, kills, pts, form:fg};
}
function ccNobleRivals(sv, wk){
  const reg=ccCareerRegion(), rows={};
  const pool=PLAYERS.filter(p=>p.region===reg && (p._ovr||p.rating||0)>=sv.avg-4).slice(0, 400);
  const rng=careerRng(ccHashStr('noblewk|'+wk+'|'+reg));
  for(let i=0;i<12 && pool.length;i++){ const p=pool.splice(Math.floor(rng()*pool.length),1)[0]; if(p && p.handle && !rows[p.handle]) rows[p.handle]={p:0}; }
  return rows;
}

/* ---- РАНКЕД И АРЕНА. Занятие trSur — это сессия настоящих матчей: место, киллы, кто выбил, кто был в лобби.
   До 17.05.2023 (v24.40) — Арена с Hype, дальше — Ranked. Пороги, очки и автобус Арены — вики Fortnite по эпохам
   (tools/measured/arena-ranked-history.json). Ranked: Bronze–Diamond по три ступени, Elite, Champion, Unreal;
   Unreal не падает, у него место в таблице; с v26.00 (25.08.2023) ранг каждый сезон сбрасывается и первый матч
   сезона — квалификационный. Сколько процентов даёт матч, Epic не публикует — таблица мест, цена входа по рангу и
   сила лобби — ОЦЕНКА режима. Кэш-капы ранг не спрашивает (замков нет по его слову 30.09). */
const CC_ARENA_OLD=[0,250,500,1000,1500,2500,4000,6000,12000,16000];
const CC_ARENA_NEW=[0,400,800,1200,2000,3000,5000,7500,10000,15000];
const CC_ARENA_CHAMP=7;   // индекс дивизиона 8
const CC_ARENA_ERAS=[
  {id:'s8', from:'2019-03-27', upd:'v8.20', guess:true, thr:CC_ARENA_OLD, fare:[0,0,0,10,20,30,30,60,60,60], pts:{
    1:{teams:100, rows:[[1,60],[5,30],[15,30],[25,60]], elim:20},
    2:{teams:50,  rows:[[1,60],[3,30],[7,30],[12,60]], elim:10},
    3:{teams:33,  rows:[[1,60],[2,30],[4,30],[8,60]],  elim:7}}},
  {id:'x', from:'2019-08-01', upd:'v10.00', reset:true, thr:CC_ARENA_OLD, fare:[0,0,0,10,20,30,30,60,60,60], pts:null},
  {id:'v18', from:'2021-09-28', upd:'v18.10', reset:true, thr:CC_ARENA_NEW, fare:[0,0,0,10,20,30,50,60,70,80], pts:{
    1:{teams:100, rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[20,15],[25,15],[30,10],[40,10],[50,10]], elim:[20,20,20,15,15,15,15,10,10,10], lastOff:true},
    2:{teams:50,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[12,15],[15,15],[17,10],[20,10],[25,10]], elim:[20,20,20,10,10,10,10,10,10,10], lastOff:true},
    3:{teams:33,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[6,10],[7,15],[8,15],[9,10],[10,10],[15,10]], elim:[15,15,15,15,10,10,10,10,10,10], lastOff:true}}},
  {id:'v21', from:'2022-06-21', upd:'v21.10', thr:CC_ARENA_NEW, fare:[0,0,0,0,30,40,50,60,70,70], pts:{
    1:{teams:100, rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[20,15],[25,15],[30,10],[40,10],[50,10]], elim:[15,15,15,10,10,10,10,5,5,5], lastOff:true},
    2:{teams:50,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[10,10],[12,15],[15,15],[17,10],[20,10],[25,10]], elim:[15,15,15,5,5,5,5,5,5,5], lastOff:true},
    3:{teams:33,  rows:[[1,50],[2,25],[3,10],[4,10],[5,20],[6,10],[7,15],[8,15],[9,10],[10,10],[15,10]], elim:[10,10,10,10,5,5,5,5,5,5], lastOff:true}}}
];
CC_ARENA_ERAS[1].pts=CC_ARENA_ERAS[0].pts;   // Season X — те же числа (у s8 они взяты с неё)
const CC_RANKS=['Bronze I','Bronze II','Bronze III','Silver I','Silver II','Silver III','Gold I','Gold II','Gold III',
  'Platinum I','Platinum II','Platinum III','Diamond I','Diamond II','Diamond III','Elite','Champion','Unreal'];
const CC_RANK_UNREAL=17, CC_RANK_RESET_FROM='2023-08-25', CC_RANK_SPLIT_FROM='2026-04-17';
const CC_RK_GAMES=3;   // матчей за сессию — оценка режима
// Сила лобби по рангу и по дивизиону Арены (рейтинг карточки) — оценка: про 90+ живут в Unreal/Champion League.
const CC_RK_LOBBY=[52,54,56,58,60,62,64,66,68,70,72,74,77,79,81,86,90,93];
const CC_AR_LOBBY=[54,57,60,63,66,69,72,76,80,84];
// Цена входа (вычет за матч) по тиру ранга и множитель прироста: чем выше, тем дороже ошибка — оценка.
const CC_RK_COST=[0,0,0,0,0,0,4,4,4,8,8,8,12,12,12,18,24,0];
const CC_RK_UNREAL_N=6000, CC_RK_UNREAL_K=420;
function ccRkTier(i){ return ['bronze','bronze','bronze','silver','silver','silver','gold','gold','gold','plat','plat','plat','dia','dia','dia','elite','champ','unreal'][i]||'bronze'; }
function ccArenaEra(day){ day=day||careerToday(); let e=CC_ARENA_ERAS[0]; CC_ARENA_ERAS.forEach(x=>{ if(day>=x.from) e=x; }); return e; }
function ccArenaOn(day){ return (day||careerToday())<CC_RANKED_FROM; }
function ccArenaLeague(i){ const t=L().rkLeagues||['Open','Contender','Champion']; return i>=CC_ARENA_CHAMP ? t[2] : i>=4 ? t[1] : t[0]; }
function ccArenaDivOf(h, day){ const t=ccArenaEra(day).thr; let i=0; t.forEach((v,j)=>{ if(h>=v) i=j; }); return i; }
function ccArenaName(i){ return ccArenaLeague(i)+' · '+(L().rkDiv||'div.')+' '+(i+1); }
function ccRkSize(){ return Math.min(3, Math.max(1, careerSquadSize()||2)); }
function ccRkTeams(){ return {1:100, 2:50, 3:33}[ccRkSize()]; }
// Ключ сезона: после 2026-го даты повторяются, поэтому с годом карьеры.
function ccRkSeasonKey(day){ const s=careerFncsSeason(day||careerToday()); return s ? (s.id||s.from)+'|'+(CAREER.career.year||'') : null; }
function ccRk(){
  const lf=ccLife();
  if(!lf.rk || lf.rk.v!==1) lf.rk={v:1, p:null, unr:0, hype:null, era:null, sid:null, peak:{}, last:null, prev:null};
  const rk=lf.rk, day=careerToday();
  if(ccArenaOn(day)){
    const era=ccArenaEra(day);
    if(rk.hype==null) rk.hype=0;
    if(rk.era!==era.id){ if(rk.era!=null && era.reset){ rk.hype=0; careerNews('flat', 'rkNewsArenaReset', [era.upd]); } rk.era=era.id; }
  } else {
    // Сброс сезона с v26.00: ранг уходит, первый матч сезона ставит заново от прошлого ранга.
    const sid=ccRkSeasonKey(day);
    if(sid && rk.sid!==sid){
      if(rk.sid!=null && day>=CC_RANK_RESET_FROM && rk.p!=null){ rk.prev=ccRkIdx(rk.p); rk.p=null; rk.unr=0; careerNews('flat', 'rkNewsReset', []); }
      rk.sid=sid;
    }
  }
  return rk;
}
function ccRkIdx(p){ return Math.min(CC_RANK_UNREAL, Math.floor((p||0)/100)); }
function ccRkName(i, p){
  if(i==null) return L().rkUnranked;
  if((i===15 || i===16) && careerToday()>=CC_RANK_SPLIT_FROM) return ccRkTierName(i)+' '+['I','II','III'][Math.min(2, Math.floor(((p||0)%100)/34))];
  return ccRkLabel(i);
}
// Название ранга на языке игрока (как в русском/французском/... клиенте Fortnite); CC_RANKS остаётся ключом иконок.
function ccRkTierIdx(i){ return i<15 ? Math.floor(i/3) : i-10; }
function ccRkTierName(i){ const t=L().rkTiers; return t ? t[ccRkTierIdx(i)] : CC_RANKS[i].replace(/ I+$/, ''); }
function ccRkLabel(i){ return ccRkTierName(i)+(i<15 ? ' '+['I','II','III'][i%3] : ''); }
function ccRkUnrealPos(unr){ return Math.max(1, Math.round(CC_RK_UNREAL_N*Math.exp(-(unr||0)/CC_RK_UNREAL_K))); }
// Про своего региона на верху таблицы Unreal / Champion League: сильнейшие по рейтингу, по полтора места на человека.
function ccRkLadder(){
  const reg=ccCareerRegion(), key=reg+'|'+(CAREER.career.year||'');
  if(ccRkLadder.c && ccRkLadder.k===key) return ccRkLadder.c;
  const seen=new Set(), me=hKey({handle:CAREER.player.handle||CAREER.player.nick||''});
  const pool=PLAYERS.filter(p=>p && p.handle && p.region===reg).sort((a,b)=>(b._ovr||b.rating||0)-(a._ovr||a.rating||0))
    .filter(p=>{ const k=hKey(p); if(k===me || seen.has(k)) return false; seen.add(k); return true; }).slice(0, 100);
  ccRkLadder.k=key;
  return ccRkLadder.c=pool.map((p,i)=>({h:p.handle, nat:p.nat, pos:Math.round(1+i*1.5)}));
}
function ccRkNear(pos){
  if(!(pos<=160)) return null;
  const lad=ccRkLadder(); let up=null, down=null;
  lad.forEach(r=>{ if(r.pos<=pos && (!up || r.pos>up.pos)) up=r; if(r.pos>pos && (!down || r.pos<down.pos)) down=r; });
  return {up, down};
}
// Игроки сцены под силу лобби — из них «кто выбил» и «кто был в лобби».
function ccRkLobbyPool(lvl){
  const reg=ccCareerRegion(), k=reg+'|'+lvl, c=ccRkLobbyPool.c||(ccRkLobbyPool.c=new Map());
  if(!c.has(k)) c.set(k, PLAYERS.filter(p=>p && p.handle && p.region===reg && Math.abs((p._ovr||p.rating||0)-lvl)<=4));
  return c.get(k);
}
function ccRkMatch(rnd, lvl, teams){
  const g=()=>{ let s=0; for(let i=0;i<6;i++) s+=rnd(); return (s-3)/Math.sqrt(0.5); };
  const six=CAREER.player.attrs||{}, o=ccMyShownOvr();
  const z=(o+careerForm()+g()*4-lvl)/5.5, pct=1/(1+Math.exp(-1.7*z));
  const place=clamp(Math.round((1-pct)*(teams-1)+g()*teams*0.04)+1, 1, teams);
  const kills=Math.max(0, Math.round(pct*4.5+g()*1.3+((six.aim||70)-70)/15));
  const pool=ccRkLobbyPool(lvl), pick=()=>pool.length ? pool[Math.floor(rnd()*pool.length)] : null;
  const by=place>1 ? pick() : null;
  const stars=[]; for(let i=0;i<8 && stars.length<2;i++){ const p=pick(); if(p && (!by || p.handle!==by.handle) && !stars.some(s=>s.h===p.handle)) stars.push({h:p.handle, nat:p.nat}); }
  return {place, of:teams, kills, lvl, by:by ? {h:by.handle, nat:by.nat} : null, stars};
}
// Ranked: проценты за место (доля лобби) и за киллы, множитель по рангу, вычет входа — ОЦЕНКА.
function ccRkGain(i, place, of, kills){
  const f=place/of;
  const pg=place===1 ? 50 : f<=0.03 ? 32 : f<=0.05 ? 26 : f<=0.10 ? 20 : f<=0.15 ? 15 : f<=0.25 ? 10 : f<=0.5 ? 4 : 0;
  const kg=6*(1+(1-f));
  const m=1.25-0.95*Math.min(16, i)/16;
  return Math.round((pg+kills*kg)*m)-(CC_RK_COST[i]||0);
}
function ccArenaPts(div, place, kills, day){
  const era=ccArenaEra(day), t=era.pts[ccRkSize()];
  const pl=t.rows.reduce((s,r,j)=>s+((place<=r[0] && (!t.lastOff || j<t.rows.length-1 || div<CC_ARENA_CHAMP)) ? r[1] : 0), 0);
  const el=Array.isArray(t.elim) ? t.elim[div] : t.elim;
  return pl+kills*el-(era.fare[div]||0);
}
function ccRkSession(){
  const rk=ccRk(), rnd=ccLifeRng('ranked|'+(ccRk().n||0)), day=careerToday(), arena=ccArenaOn(day);
  const games=[], sess={day, arena, games};
  if(arena){
    const teams=ccArenaEra(day).pts[ccRkSize()].teams, h0=rk.hype, d0=ccArenaDivOf(h0, day);
    for(let n=0;n<CC_RK_GAMES;n++){
      const div=ccArenaDivOf(rk.hype, day), m=ccRkMatch(rnd, CC_AR_LOBBY[div], teams);
      m.div=div; m.fare=ccArenaEra(day).fare[div]||0; m.d=ccArenaPts(div, m.place, m.kills, day);
      m.h0=rk.hype; rk.hype=Math.max(0, rk.hype+m.d); m.h1=rk.hype; games.push(m);
    }
    sess.from=h0; sess.to=rk.hype;
    const d1=ccArenaDivOf(rk.hype, day);
    if(d1>d0) careerNews('good', d1>=CC_ARENA_CHAMP && d0<CC_ARENA_CHAMP ? 'rkNewsChamp' : 'rkNewsArenaUp', [ccArenaName(d1)]);
    const k='a|'+ccArenaEra(day).id+'|'+(CAREER.career.year||'');
    rk.peak[k]=Math.max(rk.peak[k]||0, rk.hype);
  } else {
    const teams=ccRkTeams(), i0=rk.p==null ? null : ccRkIdx(rk.p), u0=rk.unr||0;
    for(let n=0;n<CC_RK_GAMES;n++){
      if(rk.p==null){
        // Квалификационный матч: от прошлого ранга (минус две ступени) или от рейтинга, не выше Diamond III.
        const o=ccMyShownOvr(), byOvr=clamp(Math.round((o-58)/2.2), 0, 14);
        const lvl=CC_RK_LOBBY[byOvr], m=ccRkMatch(rnd, lvl, teams);
        const perf=m.place/m.of<=0.1 ? 1 : m.place/m.of>0.5 ? -1 : 0;
        const base=rk.prev!=null ? Math.min(rk.prev-2, byOvr+1) : byOvr;
        const idx=clamp(base+perf, 0, 14);
        rk.p=idx*100+20; m.place0=true; m.d=null; m.rank=idx; m.p0=null; m.p1=rk.p; games.push(m); continue;
      }
      const i=ccRkIdx(rk.p), m=ccRkMatch(rnd, CC_RK_LOBBY[i], teams);
      m.p0=rk.p; m.u0=rk.unr||0;
      if(i>=CC_RANK_UNREAL){
        const pg=ccRkGain(16, m.place, m.of, m.kills)+(CC_RK_COST[16]||0)-10;
        m.d=null; m.u=pg; rk.unr=Math.max(0, (rk.unr||0)+pg);
      } else {
        m.d=ccRkGain(i, m.place, m.of, m.kills);
        rk.p=clamp(rk.p+m.d, 0, CC_RANK_UNREAL*100);
      }
      m.rank=ccRkIdx(rk.p); m.p1=rk.p; m.u1=rk.unr||0; games.push(m);
    }
    const i1=ccRkIdx(rk.p);
    sess.from=i0; sess.to=i1; sess.u0=u0; sess.u1=rk.unr||0;
    if(i0!=null && i1>i0){
      careerNews('good', i1>=CC_RANK_UNREAL ? 'rkNewsUnreal' : 'rkNewsUp', [ccRkName(i1, rk.p)]);
      if(i1>=15) careerReachAdd(Math.round(4000*(i1-14)));
    } else if(i0!=null && i1<i0) careerNews('bad', 'rkNewsDown', [ccRkName(i1, rk.p)]);
    else if(i0==null) careerNews('flat', 'rkNewsPlaced', [ccRkName(i1, rk.p)]);
    if(i1>=CC_RANK_UNREAL){
      const p0=ccRkUnrealPos(u0), p1=ccRkUnrealPos(rk.unr);
      if(p1<=100 && p0>100){ careerNews('good', 'rkNewsTop100', [p1]); careerReachAdd(15000); }
      if(p1===1 && p0>1){ careerNews('good', 'rkNewsTop1', []); careerReachAdd(40000); }
    }
    const k='r|'+(rk.sid||'');
    rk.peak[k]=Math.max(rk.peak[k]||0, (rk.p||0)+(i1>=CC_RANK_UNREAL ? Math.min(99, Math.round((rk.unr||0)/40)) : 0));
  }
  // Сессия даёт и форму: хорошая — плюс, провал — минус, по-малому.
  const good=games.filter(m=>m.place/m.of<=0.1).length, bad=games.filter(m=>m.place/m.of>0.6).length;
  const fg=good>=2 ? 0.3 : bad>=2 ? -0.2 : 0;
  if(fg){ const cr=CAREER.career; cr.form=clamp((cr.form||0)+fg, -CC_FORM_MAX, CC_FORM_MAX); }
  sess.form=fg;
  rk.last=sess;
  rk.n=(rk.n||0)+games.length;
  return sess;
}
// ---- Плитка во вкладке «Тренировка».
function ccRkIconSrc(i){ return 'items/ranks/'+(i==null ? 'unranked' : CC_RANKS[i].toLowerCase().replace(/ /g, '-'))+'.webp'; }
function ccRkIcon(i, cls){ return '<img class="rk-ic'+(cls ? ' '+cls : '')+'" src="'+ccRkIconSrc(i)+'" alt="" aria-hidden="true" width="160" height="160" decoding="async">'; }
function ccRkBadge(i){ return ccRkIcon(i); }
// Лесенка по тирам (8 значков, на телефоне 18 слишком мелкие): свой тир со своей ступенью и обведён.
const CC_RK_TIERS=[[0,2],[3,5],[6,8],[9,11],[12,14],[15,15],[16,16],[17,17]];
function ccRkLadderHTML(cur){
  return '<div class="rk-steps" role="img" aria-label="'+esc(ccRkName(cur))+'">'+CC_RK_TIERS.map(([a,b])=>{
    const on=cur>=a && cur<=b, i=on ? cur : a, n=ccRkTierName(a);
    return '<span class="rk-step'+(on ? ' on' : cur>b ? ' past' : '')+'" title="'+esc(n)+'">'+ccRkIcon(i)+'<small>'+esc(n)+'</small></span>';
  }).join('')+'</div>';
}
function ccRkTileHTML(){
  if(!CAREER || !CAREER.career) return '';
  const T=L(), rk=ccRk(), day=careerToday(), arena=ccArenaOn(day), last=rk.last;
  let head='', bar='', side='';
  if(arena){
    const div=ccArenaDivOf(rk.hype, day), thr=ccArenaEra(day).thr, next=thr[div+1];
    head='<span class="rk-badge rk-a'+(div>=CC_ARENA_CHAMP ? ' rk-champ' : div>=4 ? ' rk-gold' : ' rk-silver')+'" aria-hidden="true"><i>'+(div+1)+'</i></span>'+
      '<div class="rk-nm"><b>'+esc(ccArenaName(div))+'</b><small>'+ccNum(rk.hype)+' Hype · '+esc(T.rkRules(ccArenaEra(day).upd))+'</small></div>';
    if(next!=null){ const pc=Math.max(0, Math.min(100, (rk.hype-thr[div])/(next-thr[div])*100));
      bar='<u class="rk-bar"><s style="width:'+pc.toFixed(1)+'%"></s></u><div class="rk-hint">'+esc(T.rkToNext(ccNum(next-rk.hype)+' Hype', ccArenaName(div+1)))+'</div>'; }
    else { const pos=Math.max(1, Math.round(4000*Math.exp(-(rk.hype-thr[9])/2500)));
      side='<div class="rk-pos"><b>#'+ccNum(pos)+'</b><span>'+esc(T.rkHypeBoard)+'</span></div>'+ccRkNearHTML(pos); }
  } else if(rk.p==null){
    head=ccRkIcon(null)+'<div class="rk-nm"><b>'+esc(T.rkUnranked)+'</b><small>'+esc(rk.prev!=null ? T.rkPlaceFrom(ccRkName(rk.prev)) : T.rkPlaceFirst)+'</small></div>';
  } else {
    const i=ccRkIdx(rk.p);
    head=ccRkBadge(i)+'<div class="rk-nm"><b>'+esc(ccRkName(i, rk.p))+'</b><small>'+esc(T.rkSeasonLine(rk.n||0))+'</small></div>';
    if(i<CC_RANK_UNREAL){ const pc=rk.p%100;
      bar='<u class="rk-bar rk-'+ccRkTier(i)+'"><s style="width:'+pc+'%"></s></u><div class="rk-hint">'+esc(T.rkToNext(pc+'%', ccRkName(i+1)))+(CC_RK_COST[i] ? ' · '+esc(T.rkCost(CC_RK_COST[i])) : '')+'</div>'; }
    else { const pos=ccRkUnrealPos(rk.unr); side='<div class="rk-pos"><b>#'+ccNum(pos)+'</b><span>'+esc(T.rkUnrealBoard)+'</span></div>'+ccRkNearHTML(pos); }
    bar+=ccRkLadderHTML(i);
  }
  const flag=n=>(n && typeof flagImg==='function') ? flagImg(n, 14) : '';
  let games='';
  if(last && last.games && last.games.length){
    games='<div class="rk-last"><em>'+esc(T.rkLast(ccFmtDay(last.day)))+(last.form ? ' · '+esc(T.rkForm(last.form)) : '')+'</em>'+last.games.map((m,n)=>{
      const d=m.place0 ? '<i class="rk-pl">'+esc(T.rkPlaced(ccRkName(m.rank)))+'</i>'
        : m.u!=null ? '<i class="'+(m.u>=0?'up':'down')+'">'+(m.u>=0?'+':'')+m.u+' '+esc(T.rkUnrealPts)+'</i>'
        : '<i class="'+(m.d>=0?'up':'down')+'">'+(m.d>=0?'+':'')+m.d+(last.arena ? ' Hype' : '%')+'</i>';
      const who=m.place===1 ? '<span class="rk-vr">'+esc(T.rkVictory)+'</span>' : m.by ? '<span>'+esc(T.rkBy)+' '+flag(m.by.nat)+esc(m.by.h)+'</span>' : '';
      const lob=m.stars && m.stars.length ? '<small>'+esc(T.rkLobby)+' '+m.stars.map(s=>flag(s.nat)+esc(s.h)).join(', ')+'</small>' : '';
      return '<div class="rk-m"><b>#'+m.place+'<small>/'+m.of+'</small></b><div class="rk-mw">'+who+lob+'</div><span class="rk-k">'+m.kills+' '+esc(T.rkKills)+'</span>'+d+(!last.arena && m.rank!=null ? ccRkIcon(m.rank, 'sm') : '')+'</div>';
    }).join('')+'</div>';
  }
  // Пики прошлых сезонов.
  const peaks=Object.keys(rk.peak||{}).filter(k=>k[0]==='r' && k!=='r|'+(rk.sid||'')).slice(-4).map(k=>{
    const v=rk.peak[k], i=ccRkIdx(v); return '<span class="rk-peak">'+ccRkIcon(i, 'sm')+esc(String(k.split('|')[1]||''))+' · '+esc(ccRkLabel(i))+'</span>'; }).join('');
  const why=(typeof ccArenaPlayWhy==='function') ? ccArenaPlayWhy() : '';
  const act=ccActById('trSur');
  return '<div class="ch-tile rk-tile"><h4>'+esc(arena ? T.rkArenaTitle : T.rkTitle)+'</h4>'+
    '<div class="rk-head">'+head+'</div>'+bar+side+
    '<button class="hero-btn hero-btn-go rk-play" '+(why ? 'disabled' : 'onclick="ccRkPlay()"')+'>'+esc(T.rkPlay(CC_RK_GAMES))+' · '+(act ? act.energy : 30)+(T.ccEnergyMark||'')+'</button>'+
    (why ? '<div class="rk-hint">'+esc(why)+'</div>' : '')+games+
    (peaks ? '<div class="rk-peaks"><em>'+esc(T.rkPeaks)+'</em>'+peaks+'</div>' : '')+'</div>';
}
/* Быстрый прогон сессии: матчи уже сыграны и сохранены (ccRkSession), окно только показывает их по шагам:
   автобус, высадка, круги, лента киллов, место, полоска ранга. «Пропустить» сразу ставит итог. */
function ccRkPlay(){
  const n0=ccRk().n||0;
  careerPickDay('trSur');
  const rk=ccRk();
  if((rk.n||0)!==n0 && rk.last && rk.last.games && rk.last.games.length) ccRkSimOpen(rk.last);
}
function ccRkSimOpen(sess){
  ccRkSimClose();
  const T=L(), arena=sess.arena, games=sess.games, rnd=ccLifeRng('rksim|'+(ccRk().n||0));
  const el=document.createElement('div'); el.id='rkSim'; el.className='rk-sim'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.setAttribute('aria-label', arena ? T.rkArenaTitle : T.rkTitle);
  el.innerHTML='<div class="rk-sim-box"><div class="rk-sim-top"><b id="rkSimN"></b><button type="button" class="rk-sim-skip" id="rkSimSkip">'+esc(T.rkSimSkip)+'</button></div>'+
    '<div class="rk-sim-main"><div class="rk-sim-ic" id="rkSimIc"></div><div class="rk-sim-st"><b id="rkSimPh"></b><span id="rkSimAl"></span></div><div class="rk-sim-k"><b id="rkSimK">0</b><small>'+esc(T.rkKills)+'</small></div></div>'+
    '<u class="rk-bar rk-sim-bar"><s id="rkSimBar"></s></u><div class="rk-sim-rk" id="rkSimRk"></div>'+
    '<div class="rk-sim-feed" id="rkSimFeed" aria-live="polite"></div><div class="rk-sim-sum" id="rkSimSum"></div>'+
    '<button type="button" class="hero-btn hero-btn-go rk-sim-done" id="rkSimDone" hidden>'+esc(T.rkSimDone)+'</button></div>';
  document.body.appendChild(el);
  const $=id=>document.getElementById(id);
  const flag=n=>(n && typeof flagImg==='function') ? flagImg(n, 14) : '';
  // ранг/Hype до матча и после: полоска и иконка
  const show=(m, after)=>{
    if(arena){
      const h=after ? m.h1 : m.h0, div=ccArenaDivOf(h, sess.day), thr=ccArenaEra(sess.day).thr, nx=thr[div+1];
      $('rkSimIc').innerHTML='<span class="rk-badge rk-a'+(div>=CC_ARENA_CHAMP ? ' rk-champ' : div>=4 ? ' rk-gold' : ' rk-silver')+'"><i>'+(div+1)+'</i></span>';
      $('rkSimBar').style.width=(nx!=null ? Math.max(0, Math.min(100, (h-thr[div])/(nx-thr[div])*100)) : 100).toFixed(1)+'%';
      $('rkSimRk').textContent=ccArenaName(div)+' · '+ccNum(h)+' Hype';
      return;
    }
    const p=after ? m.p1 : m.p0;
    if(p==null){ $('rkSimIc').innerHTML=ccRkIcon(null); $('rkSimBar').style.width='0%'; $('rkSimRk').textContent=T.rkUnranked; return; }
    const i=ccRkIdx(p);
    $('rkSimIc').innerHTML=ccRkIcon(i);
    $('rkSimBar').style.width=(i>=CC_RANK_UNREAL ? 100 : p%100)+'%';
    $('rkSimRk').textContent=ccRkName(i, p)+(i>=CC_RANK_UNREAL ? ' · #'+ccNum(ccRkUnrealPos(after ? m.u1 : m.u0)) : ' · '+(p%100)+'%');
  };
  // Сценарий матча: шаги по 170 мс, живые падают к месту, киллы на случайных шагах.
  const steps=[];
  games.forEach((m, gi)=>{
    const N=11, alive=[];
    for(let t=0;t<=N;t++){ const f=t<2 ? 0 : (t-1)/(N-1); alive.push(Math.max(m.place, Math.round(m.of*Math.pow(m.place/m.of, Math.pow(f, 0.8))))); }
    const kt=new Map(); for(let k=0;k<m.kills;k++){ const t=2+Math.floor(rnd()*(N-2)); kt.set(t, (kt.get(t)||0)+1); }
    const pool=ccRkLobbyPool(m.lvl||60); let kills=0;
    steps.push({ms:450, run:()=>{ $('rkSimN').textContent=T.rkSimMatch(gi+1, games.length); $('rkSimFeed').innerHTML=''; $('rkSimFeed').hidden=false; $('rkSimK').textContent='0';
      $('rkSimPh').textContent=T.rkSimBus; $('rkSimAl').textContent=m.of+' '+T.rkSimAlive; show(m, false); }});
    steps.push({ms:300, run:()=>{ $('rkSimPh').textContent=T.rkSimLand; }});
    for(let t=2;t<=N;t++){
      steps.push({ms:170, run:()=>{
        $('rkSimPh').textContent=T.rkSimStorm(Math.min(9, 1+Math.floor((t-2)*9/(N-1))));
        $('rkSimAl').textContent=alive[t]+' '+T.rkSimAlive;
        const k=kt.get(t)||0;
        for(let j=0;j<k;j++){ kills++; const v=pool.length ? pool[Math.floor(rnd()*pool.length)] : null;
          $('rkSimFeed').insertAdjacentHTML('afterbegin', '<div>'+esc(T.rkSimKill)+' '+(v ? flag(v.nat)+esc(v.handle) : '')+'</div>'); }
        $('rkSimK').textContent=String(kills);
      }});
    }
    steps.push({ms:1100, run:()=>{
      $('rkSimK').textContent=String(m.kills);
      $('rkSimPh').innerHTML=m.place===1 ? '<span class="rk-vr">'+esc(T.rkVictory)+'</span>' : '#'+m.place+'<small>/'+m.of+'</small>';
      const d=m.place0 ? T.rkPlaced(ccRkName(m.rank)) : m.u!=null ? (m.u>=0?'+':'')+m.u+' '+T.rkUnrealPts : (m.d>=0?'+':'')+m.d+(arena ? ' Hype' : '%');
      const up=m.place0 || (m.u!=null ? m.u>=0 : m.d>=0);
      $('rkSimAl').innerHTML='<i class="'+(m.place0 ? 'rk-pl' : up ? 'up' : 'down')+'">'+esc(d)+'</i>'+(m.by ? ' · '+esc(T.rkBy)+' '+flag(m.by.nat)+esc(m.by.h) : '');
      show(m, true);
      const r0=!arena && m.p0!=null ? ccRkIdx(m.p0) : null, r1=!arena ? ccRkIdx(m.p1) : null;
      if(r0!=null && r1!==r0) $('rkSimRk').insertAdjacentHTML('afterbegin', '<b class="'+(r1>r0 ? 'up' : 'down')+'">'+esc(r1>r0 ? T.rkSimUp : T.rkSimDown)+'</b> ');
    }});
  });
  const finish=()=>{
    clearTimeout(ccRkSimOpen.t);
    const last=games[games.length-1]; show(last, true);
    $('rkSimN').textContent=T.rkSimTotal; $('rkSimSkip').hidden=true;
    $('rkSimPh').textContent=arena ? ccArenaName(ccArenaDivOf(sess.to, sess.day)) : ccRkName(sess.to, last.p1);
    $('rkSimAl').innerHTML=games.map(m=>'#'+m.place).join(' · ');
    $('rkSimK').textContent=String(games.reduce((a,m)=>a+m.kills, 0));
    $('rkSimFeed').innerHTML=''; $('rkSimFeed').hidden=true;
    $('rkSimSum').innerHTML=(sess.form ? esc(T.rkForm(sess.form)) : '');
    const d=$('rkSimDone'); d.hidden=false; try{ d.focus(); }catch(e){}
  };
  let n=0;
  const tick=()=>{ if(!document.getElementById('rkSim')) return; if(n>=steps.length) return finish(); const st=steps[n++]; st.run(); ccRkSimOpen.t=setTimeout(tick, st.ms); };
  $('rkSimSkip').onclick=finish;
  $('rkSimDone').onclick=ccRkSimClose;
  el.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if($('rkSimDone').hidden) finish(); else ccRkSimClose(); } });
  try{ $('rkSimSkip').focus(); }catch(e){}
  tick();
}
function ccRkSimClose(){ clearTimeout(ccRkSimOpen.t); const el=document.getElementById('rkSim'); if(el) el.remove(); }
function ccRkNearHTML(pos){
  const n=ccRkNear(pos); if(!n || (!n.up && !n.down)) return '';
  const row=(r, cls)=>r ? '<div class="rk-nb '+cls+'"><b>#'+r.pos+'</b><span>'+esc(r.h)+'</span></div>' : '';
  return '<div class="rk-near">'+row(n.up, 'up')+'<div class="rk-nb me"><b>#'+pos+'</b><span>'+esc(CAREER.player.nick||'')+'</span></div>'+row(n.down, 'down')+'</div>';
}
function ccArenaPlayWhy(){
  const act=ccActById('trSur');
  if(CAREER.career.seasonOver) return L().ccSeasonOver;
  if(typeof ccLifeHurt==='function' && ccLifeHurt()) return L().lfWhyHurt;
  /* Ранкед — и в турнирный день (его «ранкед не играется», 15.11: капов в календаре стало почти каждый день): днём сессия,
     вечером турнир, как в игре. Закрывает только закрытый день (ccDayShuts), не сам вечер. */
  if(careerDayClosed()) return L().rkDayBusy;
  if(act && careerEnergy()<act.energy) return L().ccNeedEnergy(act.energy-careerEnergy());
  return '';
}

// ---- Икон-скин: титул Глобалов, два титула Мейджора или миллион призовых.
function ccIconDue(){
  const cr=CAREER.career, lf=ccLife(); if(lf.icon) return false;
  const log=cr.log||[];
  const gc=log.some(e=>e.kind==='globals' && e.place===1);
  const mj=log.filter(e=>!e.who && ccFncsTitle(e)).length;
  return gc || mj>=2 || (cr.earnings||0)>=1000000;
}

// ---- Дневной тик.
function ccLifeTick(){
  const cr=CAREER.career, lf=ccLife(), today=careerToday();
  const from=lf.tick||today; lf.tick=today;
  const days=Math.min(60, Math.max(0, ccDaysBetween(from, today)));
  for(let i=1;i<=days;i++){
    const d=ccAddDays(from, i), rng=careerRng(ccHashStr('lifeday|'+d+'|'+(CAREER.player.nick||'')));
    // Травм больше нет — старая из сейва просто снимается.
    if(lf.hurt) lf.hurt=null;
    /* Бана своего больше нет — так же, как травм (03.10). Игрок 5.10 (Notion
       «05»): «why i always got banned from open events in fncs draft». Жалоба
       падала сама, игрок ничего не делал, а 15% разборов закрывали ВСЕ открытые
       вечера на две недели; день сеется датой и ником — новая карьера с тем же
       ником ловила бан в те же дни, отсюда «always». Жалоба теперь кончается
       снятием или штрафом; бан из старого сейва снимается. */
    if(lf.ban) lf.ban=null;
    // Разбор жалобы.
    if(lf.case && d>=lf.case.until){
      const r=rng(), k=lf.case.k; lf.case=null;
      if(r<0.6) careerNews('good', 'lfNewsCleared', [L()['lfCase'+k]]);
      else { const fine=Math.max(100, Math.round((cr.balance||0)*0.05/50)*50); cr.balance=Math.max(0,(cr.balance||0)-fine);
        careerNews('bad', 'lfNewsFined', [L()['lfCase'+k], ccMoney(fine)]); }
    }
    // Новая жалоба: редко, чаще с большим охватом.
    if(!lf.case && rng()<(1+Math.min(3, careerReach()/200000))/240){
      const k=['team','snipe','toxic'][Math.floor(rng()*3)];
      lf.case={k, until:ccAddDays(d, 3+Math.floor(rng()*5))};
      careerNews('bad', 'lfNewsCase', [L()['lfCase'+k]]);
    }
    ccLiveEventTick(d);
    // Бан на сцене — у чужих тоже (новость).
    if(rng()<1/75){
      const reg=ccCareerRegion(), pool=PLAYERS.filter(p=>p.region===reg && (p._ovr||0)>=80);
      const p=pool[Math.floor(rng()*pool.length)];
      if(p) careerNews('flat', 'lfNewsSceneBan', [p.handle, L()['lfCase'+(rng()<0.6?'team':'snipe')]]);
    }
  }
  // Икон-скин.
  if(ccIconDue()){
    const pay=150000+Math.round(Math.min(350000, careerReach()*0.5)/1000)*1000;
    lf.icon={day:today, pay};
    cr.balance=(cr.balance||0)+pay; cr.side=(cr.side||0)+pay;
    careerReachAdd(Math.round(Math.max(20000, careerReach()*0.3)), true);
    careerNews('good', 'lfNewsIcon', [(CAREER.player.nick||''), ccMoney(pay)]);
    if(typeof careerEvent==='function') careerEvent('lfTlIcon', []);
  }
}

// ---- Плитка хаба.
/* Срочные дела жизни — строками в плитке «Цели»: почему вечер закрыт, травма, жалоба,
   бан, перелёты на ЛАН (без брони ЛАН не пускает). Отдельной плитки «Между турнирами»
   больше нет (его правка 28.09); Noble — во вкладке «Тренировка», оценка — в профиле. */
function ccLifeAlertRows(){
  if(!CAREER || !CAREER.career) return [];
  const lf=ccLife(), cr=CAREER.career, rows=[];
  // Почему сегодняшний вечер закрыт — кнопка «Играть» сама причину не пишет.
  const todayEv=(careerYearDays().get(careerToday())||[]);
  const whyK=todayEv.map(e=>ccLifeWhy(careerToday(), e.kind)).find(Boolean);
  if(whyK) rows.push(`<div class="ch-row"><em>${L().lfToday}</em><b style="color:var(--bad,#f66);">${esc(L()[whyK])}</b></div>`);
  // Ранг живёт в плитке «Развитие» (ccDevTileHTML).
  const h=ccLifeHurt(); if(h) rows.push(`<div class="ch-row"><em>${L().lfHurt}</em><b>${L()[h.k==='wrist'?'lfWrist':'lfIll']} · ${L().lfUntil} ${ccFmtDay(h.until)}</b></div>`);
  if(lf.case) rows.push(`<div class="ch-row"><em>${L().lfCaseOpen}</em><b>${L()['lfCase'+lf.case.k]}</b></div>`);
  const bn=ccLifeBan(); if(bn) rows.push(`<div class="ch-row"><em>${L().lfBan}</em><b>${L().lfUntil} ${ccFmtDay(bn)}</b></div>`);
  return rows;
}
// Таблица недели Noble Pro Scrims — во вкладке «Тренировка».
function ccNobleBoardHTML(){
  const lf=ccLife(), rows=[];
  // Noble — неделя.
  if(lf.noble && lf.noble.n){
    const me=(CAREER.player.nick||'you');
    const board=Object.keys(lf.noble.rows).map(k=>({n:k, p:lf.noble.rows[k].p})).concat([{n:me, p:lf.noble.me, you:true}])
      .sort((a,b)=>b.p-a.p).slice(0,8);
    rows.push(`<div class="ch-row"><em>${esc(lf.noble.server)} · ${L().lfWeek}</em><b>${lf.noble.n} ${L().lfSessions}</b></div>`);
    board.forEach((r,i)=>rows.push(`<div class="ch-row"><em>${i+1}. ${esc(r.n)}</em><b class="${r.you?'ch-goal-met':''}">${r.p}</b></div>`));
  }
  return rows.length ? '<div class="tw-noble">'+rows.join('')+'</div>' : '';
}
function ccFmtDay(iso){ return String(iso||'').slice(8,10)+'.'+String(iso||'').slice(5,7); }

/* ГЛАВНАЯ ПО ОБРАЗЦУ КАРЬЕРЫ EA FC: слева следующее событие и одна главная кнопка,
   справа — цели (клуб, месяц, своя), развитие игрока и новости. Цели были и раньше,
   но жили по разным вкладкам (контракт — в «Клубе», месяц — там же, своя — в
   «Тренировке»); здесь они собраны в одну плитку, как «цели сезона» у тренера в FC. */
function ccGoalsTileHTML(inTrain){
  if(!CAREER || !CAREER.career) return '';
  const cr=CAREER.career, org=CAREER.org, lf=ccLife(), rows=[];
  const row=(who, what, state, ok, bar)=>`<div class="hg-row${ok?' ok':''}"><div class="hg-top"><em>${esc(who)}</em>`+
    `<b>${esc(what)}</b><i>${state}</i></div>${bar!=null ? `<u class="hg-bar"><s style="width:${Math.round(bar)}%"></s></u>` : ''}</div>`;
  if(org && !org.own && org.goal){
    const met=careerOrgGoalMet();
    let now;
    if(org.goal.type==='promote') now=L().ccDivision+' '+cr.division;
    else { const best=(cr.log||[]).filter(e=>e.season===cr.season).reduce((b,e)=>Math.min(b, e.place||999), 999);
      now=best<999 ? '#'+best : '-'; }
    rows.push(row(L().hgClub+' · '+org.name, careerOrgGoalText(org.goal), met ? '✓ '+esc(L().hgDone) : esc(L().hgNow)+' '+esc(now), met));
  }
  const mg=careerMonthGoal();
  if(mg){ const met=careerMonthGoalMet();
    rows.push(row(L().hgMonth, careerMonthGoalText(mg)+(mg.bonus ? ' · '+ccMoney(mg.bonus) : ''), met ? '✓ '+esc(L().hgDone) : esc(L().hgOpen), met));
    const pick=ccMgPickHTML(); if(pick) rows.push(pick); }
  const g=lf.goal, six=CAREER.player.attrs||ccOwnAttrs();
  const wk=ccWeekTag(), f=(lf.focus && lf.focus.wk===wk) ? lf.focus.k : null;
  // На вкладке «Тренировка» своя цель и фокус — в плане недели под плиткой (ccTrainPlanHTML), здесь не повторяются.
  if(!inTrain){
    if(g && !g.done){
      const v=six[g.k]||0, pct=Math.max(0, Math.min(100, (v-g.from)/Math.max(0.1, g.to-g.from)*100));
      rows.push(row(L().hgOwn, ccAttrFull(g.k)+' → '+g.to, (Math.round(v*10)/10).toFixed(1)+' / '+g.to, false, pct));
    }
    if(f) rows.push(row(L().lfFocusH, ccAttrFull(f), '+'+Math.round(CC_FOCUS_BONUS*100)+'%', false));
  }
  // Срочное сверху: закрытый вечер, травма, бан (ccLifeAlertRows).
  const alerts=ccLifeAlertRows();
  if(inTrain && !rows.length && !alerts.length) return '';
  const empty=!rows.length ? `<div class="ch-empty">${esc(org ? L().hgNone : L().hgNoClub)}</div>` : '';
  const ask=(!inTrain && (!g || g.done || !f)) ? `<button class="hg-go" onclick="careerTab('train')">${esc(L().hgSet)}</button>` : '';
  return `<div class="ch-tile hg-tile"><h4>${L().hgTitle}</h4>${alerts.length ? '<div class="hg-alerts">'+alerts.join('')+'</div>' : ''}${rows.join('')}${empty}${ask}</div>`;
}
// Развитие: рейтинг и его ход за сезон, ранг, шесть атрибутов с приростом недели и усталость.
// С 27.10 на вкладке «Тренировка» не рисуется (всё это там уже есть: шапка и панель дня); оставлена, чтобы вернуть одной строкой.
function ccDevTileHTML(){
  if(!CAREER || !CAREER.career) return '';
  const six=CAREER.player.attrs || ccOwnAttrs();
  const d=ccHdrSeasonDelta();
  return `<div class="ch-tile hd-tile"><h4>${L().hdTitle}</h4>`+
    `<div class="hd-head"><b class="hd-ovr">${ccMyShownOvr()}</b><span><em>${esc(L().ccRoOvr)}</em>`+
    (d ? `<i class="${d>0?'up':'down'}">${d>0?'▲ +'+d:'▼ '+d} · ${esc(L().lfHdrSeason)}</i>` : `<i>${esc(L().lfHdrSeason)}: 0</i>`)+`</span></div>`+
    ccTrainPanelHTML(six, false)+
    `<button class="hg-go" onclick="careerTab('train')">${esc(L().hdToTrain)}</button></div>`;
}
/* ОЦЕНКА ЗАНЯТИЯ, как у дриллов в EA FC: D, C, B, A, A+. Множитель прироста — оценка
   режима, не замер; средний по свежему игроку ≈1.0, так что темп роста карьеры не
   меняется, меняется разброс. Усталость и выгорание тянут оценку вниз. */
const CC_GRADES=[['D',0.7],['C',0.85],['B',1],['A',1.15],['A+',1.3]];
function ccDrillGrade(id){
  const cr=CAREER.career, lf=ccLife(), today=careerToday();
  const n=((cr.did||{})[today]||[]).length;
  const burn=careerBurnout(), tired=(cr.grind||0)>CC_GRIND_FREE;
  const s=0.52+(ccLifeRng('drill|'+id+'|'+n)()-0.5)*0.8-(burn>=1 ? 0.25 : tired ? 0.1 : 0);
  const i=s<0.2 ? 0 : s<0.4 ? 1 : s<0.62 ? 2 : s<0.82 ? 3 : 4;
  lf.gr=lf.gr||{};
  (lf.gr[today]=lf.gr[today]||[]).push({id:id, g:CC_GRADES[i][0]});
  // Хранится три недели — столько видит полоса недели и её соседи.
  Object.keys(lf.gr).forEach(d=>{ if(ccDaysBetween(d, today)>21) delete lf.gr[d]; });
  return {g:CC_GRADES[i][0], mult:CC_GRADES[i][1]};
}
function ccDrillLast(id){
  const gr=ccLife().gr||{}; const days=Object.keys(gr).sort().reverse();
  for(const d of days){ const r=gr[d].filter(x=>x.id===id).pop(); if(r) return r.g; }
  return '';
}

/* СВОЯ КАРТА В CREATIVE. Пять вечеров стройки (trMap), потом карта выходит и платит
   раз в месяц — как выплаты авторам островов у Epic. Число игр — от охвата и качества
   (оценки вечеров стройки), без обновлений тает на десятую в месяц; цена тысячи игр
   CC_MAP_RATE — оценка режима, настоящих выплат по картам про-игроков нет в открытом виде. */
const CC_MAP_BUILD=5, CC_MAP_RATE=3;
function ccMap(){ const lf=ccLife(); return lf.map||null; }
function ccMapWork(){
  const lf=ccLife(), nick=CAREER.player.nick||'Player';
  const g=ccLifeRng('map|'+(lf.map ? lf.map.prog : 0))();
  if(!lf.map) lf.map={prog:0, q:1, plays:0, earned:0};
  const m=lf.map;
  if(!m.pub){
    m.prog++; m.q=clamp(m.q+(g-0.45)*0.2, 0.6, 1.5);
    if(m.prog>=CC_MAP_BUILD){
      const r=careerRng(ccHashStr('mapcode|'+nick));
      const code=[0,1,2].map(()=>String(1000+Math.floor(r()*9000))).join('-');
      m.pub=careerToday(); m.upd=m.pub; m.code=code;
      m.name=nick+' '+(['Box Fights','Zone Wars','1v1 Build Fights','Edit Course'][Math.floor(r()*4)]);
      careerNews('good', 'lfNewsMapOut', [m.name, code]);
    }
  } else {
    m.upd=careerToday(); m.q=clamp(m.q+0.05, 0.6, 1.5);
    careerNews('flat', 'lfNewsMapUpd', [m.name]);
  }
}
function ccMapPay(months){
  const m=ccMap(); if(!m || !m.pub || !months) return 0;
  const cr=CAREER.career;
  let paid=0;
  for(let i=0; i<months; i++){
    const stale=Math.max(0, Math.floor(ccDaysBetween(m.upd, careerToday())/30));
    const plays=Math.round((500+careerReach()*1.2)*m.q*Math.pow(0.9, stale));
    const pay=Math.round(plays*CC_MAP_RATE/1000);
    m.plays=(m.plays||0)+plays; m.last=plays; paid+=pay;
  }
  if(paid){ cr.balance=(cr.balance||0)+paid; m.earned=(m.earned||0)+paid;
    careerNews('good', 'lfNewsMapPay', [m.name, ccNum(m.last), ccMoney(paid)]); }
  return paid;
}

// Ранг в одну строку с полосой — ранкед с 2023-го (ccRank), до него — Арена с Hype.

/* НАСТОЯЩИЙ СОСТАВ ПИШЕТ САМ (идея игрока 30.09: «чтобы и персонаж игрока, если он настоящий, в реальную
   команду попадал» — ответ ему: «в начале каждого сезона будут писать игроки, с которыми играл в реальной
   жизни, и будет собираться настоящий состав»). Карьера за настоящую карточку: на смене снимка составов
   (сезон FNCS, ccSnapshotNow) его настоящие напарники этого сезона — из тех же таблиц FNCS, что и снимок, —
   пишут в личку готовым предложением (t.state='offer', одна кнопка — и он в составе). Раз на снимок
   (cr.realCall). Своих, уже сидящих в составе, не зовут; кого нет в сцене года — тоже. */
function ccRealTeamCall(){
  const cr=CAREER && CAREER.career, pl=CAREER && CAREER.player;
  if(!cr || !pl || !pl.handle || ccNowYear()>=2026) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const snap=ccSnapshotNow(); if(!snap || !snap.tag) return;
  if(cr.realCall===snap.tag) return;
  cr.realCall=snap.tag;
  const me=hKey(pl.handle), res=[snap.playIn, snap.lcq].filter(Boolean);
  let best=null, bestRank=-1;
  const rankOf=st=>({Gf:3, Lcq:2, Playin:1}[st]||0);
  PLAYERS.forEach(p=>{
    if(hKey(p)!==me || !res.some(r=>r.test(String(p.event||'')))) return;
    rosterEntriesOf(p).forEach(({stage, entry})=>{
      const hs=(entry.duo||[]);
      if(hs.length<2 || !hs.some(h=>hKey(h)===me)) return;
      if(rankOf(stage)>bestRank){ bestRank=rankOf(stage); best={hs, ev:String(p.event||'').split(' — ')[0].replace(/\s*\(.*\)\s*$/, '')}; }
    });
  });
  // Предложения прошлого сезона — уже не в силе.
  careerDms().forEach(t=>{ if(t.realCall && t.realCall!==snap.tag && t.state==='offer') t.state='open'; });
  if(!best) return;
  const mine=new Set(careerMateRecords().map(r=>{ const c=ccMateCardOf(r); return c ? hKey(c) : null; }).filter(Boolean));
  const scene=careerRosterNowEU();
  best.hs.filter(h=>hKey(h)!==me && !mine.has(hKey(h))).slice(0, Math.max(1, careerMateSeats())).forEach(h=>{
    const c=scene.find(x=>hKey(x)===hKey(h));
    if(!c) return;
    const who={handle:c.handle, ovr:c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr, nat:c.nat, role:(attrsFor(c)||{}).roleKey,
               roster:true, card:c, cardRegion:c.region, club:c.org||null, pay:0};
    const t=careerDmFind(c.handle) || careerDmThread(who);
    t.who=t.who||who;
    careerDmPush(t, 'them', 'dmRealTeam', [best.ev]);
    t.state='offer'; t.realCall=snap.tag;
  });
}
function careerAdvanceBody(iso){
  const cr=CAREER.career;
  // The month's objective is judged before the clock leaves the day that may
  // have met it: every runner writes its history row and then moves the day,
  // so one hook here covers the cup, the final, the Major and the rest.
  careerMonthGoalCheck();
  const to=iso>ccYearTo() ? ccYearTo() : iso;
  // A night takes some of the week off by itself, so a career that simply
  // stops for a few days comes back fresh without spending them on rest.
  const nights=Math.max(0, Math.round((new Date(to+'T00:00:00Z')-new Date(cr.day+'T00:00:00Z'))/86400000));
  if(nights){ careerRestore(nights*CC_ENERGY_NIGHT); careerFormFade(nights); }
  // And the person paid to post, posts — on the days nothing was won too.
  if(nights) ccSmmWork(nights);
  try{ ccStaffAutoRenew(to); }catch(e){}   // штаб продлевается сам (ccStaffAutoRenew)
  const paid=careerPayWages(cr.day, to);
  // Бонус клуба за финал Мейджора и выплата за свою карту — тем же днём.
  careerOrgBonusTick();
  ccMapPay(careerWagePaydays().filter(d=>d>cr.day && d<=to).length);
  // The rest of the scene keeps playing while the player's own week passes.
  careerWorldTurns(cr.day, to);
  // And has birthdays while it does.
  careerBirthdays(cr.day, to);
  // And the clubs work through their week too: an answer that was owed lands,
  // and an offer nobody signed runs out. The people you wrote to answer on the
  // same clock.
  careerOrgDays(cr.day, to);
  // И то, что пришло в уведомления: лайки на своих постах и новые подписчики.
  // См. careerNotesTick — ничего нового не считается, всё из охвата и постов.
  careerNotesTick();
  // Анонс ближайшего крупного вечера и реакция на него — см. careerAnnounceTick.
  careerAnnounceTick();
  // Слухи и опросы сцены (16.10). Ошибка в них не должна останавливать день.
  try{ careerRumorTick(); }catch(e){ console.error('rumor', e); }
  try{ careerPollTick(); }catch(e){ console.error('poll', e); }
  try{ careerDebateTick(); }catch(e){ console.error('debate', e); }
  // Хотфиксы и выплаты призовых (16.10).
  try{ careerHotfixTick(); }catch(e){ console.error('hotfix', e); }
  try{ careerPayTick(); }catch(e){ console.error('pay', e); }
  careerCustomsPostTick();
  careerAdPostTick();
  // Трансферный рынок сцены и месячный «кто выстрелил». См. careerSceneMovesTick.
  careerSceneMovesTick();
  careerSceneRiseTick();
  // Приглашение на Про-Ам — за две недели до даты. См. careerProAmInviteTick.
  careerProAmInviteTick();
  careerDmDays(cr.day, to);
  try{ ccStaffDmTick(to); }catch(e){}   // штаб пишет в личку по делу (ccStaffDmTick)
  try{ ccClubAskTick(to); }catch(e){ console.error('clubAsk', e); }
  try{ ccSacTick(cr.day, to); }catch(e){ console.error('sac', e); }   // свой код автора платит раз в месяц (ccSacTick)   // итог «позвать в клуб» через менеджера (ccOrgBringMate)
  // And the seat, if it is empty, hears from somebody who is free.
  careerSeatDms(cr.day, to);
  careerFmtSeatDms(cr.day, to);
  // And a brand that has decided the audience is now worth a slot.
  careerSponsorDm();
  // And somebody who would like to do the talking with the clubs.
  careerAgentDm();
  if(iso>ccYearTo()){ cr.seasonOver=true; cr.day=ccYearTo(); }
  else cr.day=iso;
  /* Гонка карьер: сводка уезжает соперникам каждый прожитый день — ПОСЛЕ смены
     даты. До 8.09 вечера она уходила строкой выше, со вчерашним днём: в перемотке
     на турнирный день все видели друг друга «на вчера» (ccRaceApartWhy='day'),
     ждали минуту и играли каждый в своей комнате — годовая проба на шестерых
     (check-race-live-six) показала ноль общих бросков и по минуте на вечер. */
  if(typeof ccRaceNextCatch==='function') ccRaceNextCatch();   // голоса за этот день, приехавшие раньше меня
  if(typeof careerRaceSend==='function') careerRaceSend();
  // A month that has ended gets its award, and a year that has ended gets its
  // own. Both are judged after the clock has moved, because the month is only
  // over once the day is in the next one.
  careerAwardCheck();
  try{ ccLifeTick(); }catch(e){ if(typeof console!=='undefined') console.warn('life tick', e); }
  if(typeof careerSacTick==='function') careerSacTick();       // код поддержки — за месяц
  if(typeof careerTwSubsTick==='function') careerTwSubsTick(); // подписки на каналы — продление
  try{ ccYtTick(); }catch(e){ if(typeof console!=='undefined') console.warn('yt tick', e); }   // YouTube: просмотры роликов за день
  if(cr.seasonOver) careerAwardSeason();
}
// An old save carries a week and no day, and it is brought forward rather than
// thrown away — a career in progress is somebody's season.
//
// Counted from the career's own start, not from the year's. Its week 1 was a cup
// week; the year's week 1 is the first of December, where nothing runs at all,
// so mapping the number straight across would drop every save in progress into
// a dead stretch. What the old number meant was "this far in", and that is what
// carries over.
/* A save from before wages and prize money were told apart.

   The old careerPayWeek added the same slice to cr.earnings and to org.paid, so
   a career that has been paid anything carries its wages inside its winnings —
   which is why a Division 3 player with no prize money at all was shown $619 of
   it, the exact number the club had paid.

   Undone rather than estimated: org.paid is the amount, to the dollar, and it is
   moved across instead of guessed at. Runs once, when cr.wages is still absent. */
function careerMigrateMoney(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.wages!=null) return;
  const paid=(CAREER.org && CAREER.org.paid) || 0;
  cr.wages=paid;
  if(paid) cr.earnings=Math.max(0, (cr.earnings||0)-paid);
  // Everything earned so far is money that was never spent, since there was
  // nothing to spend it on until the shop existed.
  if(cr.balance==null) cr.balance=(cr.earnings||0)+paid;
  careerSave();
}
/* A contract signed before clubs remembered their own standard.

   Without the tier there is no bar to clear, so an academy player from an older
   save could never come up. The club is in the pool under its name; read the
   standard back from there. */
/* «Не искать клуб», нажатое в клубе, живёт, пока ты в нём. Контракт кончается многими дорогами (расторжение, выкуп,
   событие, переезд), и после любой выключенный поиск молчал навсегда: свободный агент с 99 без единого письма.
   Свободным агентом выключил сам (scoutOffFree) — держится. */
function ccScoutOff(){ return !!(CAREER && CAREER.scoutOff && (CAREER.org || CAREER.scoutOffFree)); }
function careerMigrateOrg(){
  const org=CAREER && CAREER.org;
  if(!org || org.tier!=null) return;
  const club=careerOrgPool().find(o=>o.name===org.name);
  if(club) org.tier=club.tier;
  careerSave();
}
/* Свой клуб, у которого сейв потерял CAREER.org.

   До 13 сентября careerOrgSeasonEnd на стыке года «расторгал контракт» и со своим
   клубом (цели у него нет — читалось как провал): cr.club оставался, CAREER.org
   пропадал, плитка говорила «нет клуба», а careerOrgOffers из-за cr.club молчал.
   Клуб — тот же, что и был; ставится обратно тем же объектом, каким его ставит
   careerClubFound. Сторож — tools/check-career-own-club.js. */
function careerMigrateOwnClub(){
  const cr=CAREER && CAREER.career, club=cr && cr.club;
  if(!club || !club.name || CAREER.org) return;
  CAREER.org={name:club.name, salary:0, cut:0, tier:70, own:true, since:cr.season, paid:0};
  careerSave();
}
function ccS43TrioSync(){
  try{ if(CAREER && CAREER.career && CAREER.career.day && ccS43Trios(careerToday()) && careerSquadSize()!==3) ccSyncPhaseRoster(); }catch(e){}
}
function careerMigrateClock(){
  const cr=CAREER && CAREER.career;
  if(cr && cr.day) ccS43TrioSync();
  if(!cr || cr.day) return;
  const wasIn=Math.max(1, Math.min(CAREER_WEEKS, cr.week||1))-1;
  cr.day=ccAddDays(careerStartDay(), wasIn*7);
  if(cr.day>ccYearTo()) cr.day=ccYearTo();
  // The old field goes with it. Left in place it is a second clock that never
  // ticks, and the first thing to read it believes the career never moved.
  delete cr.week;
  careerSave();
  // Старт с сезона S43: сразу трио, без пустого кресла до первого вечера.
  ccS43TrioSync();
}
/* How many people a season is played by.

   His ask, 19 August: alternate the years, duos and then trios, on the same
   measured calendar and the same cards. So the size of a squad stops being a
   constant and becomes something a season owns.

   Stored on the career rather than worked out from the season number every time
   it is asked. A derived rule would re-shape a season somebody is halfway
   through the moment the rule is edited — the same reason an agreed agent fee
   lives on the contract instead of being looked up. */
/* Размер команды на одно событие. В 2019-м и 2020-м формат менялся внутри года (World Cup
   соло и дуо, FNCS трио, C2S3 соло): состав года — трио, а вечер идёт в своём формате —
   соло один, дуо с первым тиммейтом. Ставится только на время вечера или молчаливого
   досчёта (ccWithEventSize) — не днём календаря: иначе найм тиммейта в соло-день
   (careerMateSeat) обрезал бы трио. */
var CC_EVENT_SIZE=0;   // var, не let: careerSquadSize зовут и до этой строки при загрузке
function ccWithEventSize(n, fn){
  const prev=CC_EVENT_SIZE; CC_EVENT_SIZE=n||0;
  try{ return fn(); } finally{ CC_EVENT_SIZE=prev; }
}
// Тег «Мейджор» в календаре: до 2023-го Мейджоров не было — шли сезоны FNCS (и World Cup).
// И капы: Victory Cups у Epic — с апреля 2023-го; раньше — просто кубки (Solo Cash Cup, Daily Trios Cup…).
function ccWkVictoryWord(){ const y=ccCalYear(); return (ccPastYear(y) && y<=2022) ? L().chWkCup : L().chWkVictory; }
function ccWkMajorWord(){ const y=ccCalYear(); return (ccPastYear(y) && y<=2022) ? 'FNCS' : L().chWkMajor; }
function careerSquadSize(){
  if(CC_EVENT_SIZE) return CC_EVENT_SIZE;
  const n=CAREER && CAREER.career && CAREER.career.size;
  return n===1 ? 1 : n===3 ? 3 : n===4 ? 4 : 2;   // 1: соло-год после 2026 (ccFmtYearSet)
}
// Состав года карьеры при создании: 2019 — сквад (C2S1 FNCS), трио-годы — трио, остальные — дуо.
function ccYearRosterSize(y){ return y===2019 ? 2 : y===2020 ? 2 : (y===2025 || y===2021) ? 3 : 2; }
/* Состав 2019-го и 2020-го идёт по этапам года, как было у игроков: 2019 — дуо на World Cup
   (соло-недели — одному), с августа трио (FNCS Season X), с 13 октября сквад (C2S1); 2020 — дуо
   (C2S2; C2S3 — соло одному), с 27 августа трио (C2S4). Вне этих лет — 0 (размер не трогается). */
function ccPhaseRoster(){
  if(typeof ccIs2019==='function' && ccIs2019()){ const d=careerToday(); return d<'2019-08-01' ? 2 : d<'2019-10-13' ? 3 : 4; }
  if(typeof ccIs2020==='function' && ccIs2020()) return careerToday()<'2020-08-27' ? 2 : 3;
  if(ccS43Trios(careerToday())) return 3;
  return 0;
}
// Мини-сезон S43: командный формат Epic трио (Performance Cup Trios, Trios Cash Cup). Только настоящий ноябрь 2026-го.
function ccS43Trios(d){
  return ccCalYear()===2026 && ccYearShift()===0 && String(d)>=CC_SEASONS[4].from && String(d)<=CC_YEAR_TO;
}
function ccSyncPhaseRoster(){
  const cr=CAREER && CAREER.career; if(!cr || CC_EVENT_SIZE) return;
  const ps=ccPhaseRoster(); if(ps && cr.size!==ps) cr.size=ps;
  ccRosterSwap();
  if(ps) ccPhaseFillSeats(ps);
}
/* ПУСТОЕ КРЕСЛО НА СТЫКЕ ЭТАПА (Notion «0910», тестер: «квалификации дуо, хиты и финал уже трио»;
   его слово: «у меня не сыгралось половина капов когда началось трио»). Состав растёт сам — 1 августа
   2019-го дуо становится трио, 13 октября сквадом, 27 августа 2020-го снова трио, — а новый состав
   начинался с теми же людьми, то есть с пустым креслом. Пустое кресло закрывает каждый командный
   вечер (careerNoMate), и «До турнира» с перемоткой проходили их молча: мир доигрывал Season X без
   игрока. Игрок формат не выбирал — режим сменил его сам, значит и кресло садит режим: сначала
   настоящих тиммейтов своих людей по записям этого сезона (ccRealMatesOf), потом ближайших по силе
   со сцены; одно правило ИГЛа. Один раз на этап (cr.phaseFilled) — убрать кого-то потом его право. */
function ccPhaseFillSeats(size){
  const cr=CAREER && CAREER.career;
  if(!cr || CAREER._mgr || CC_EVENT_SIZE || ccMpOn() || (typeof ccRacePairOn==='function' && ccRacePairOn())) return;   // менеджер добирает сам (mgrPhaseSync)
  const done=cr.phaseFilled=cr.phaseFilled||{};
  const tag=cr.season+'|'+size;
  if(done[tag]) return;
  done[tag]=1;
  const need=careerMatesShort();
  if(need<=0){ careerSave(); return; }
  const me=careerCard(), mates=careerMates().filter(Boolean);
  const team=new Set([me].concat(mates).filter(Boolean).map(hKey));
  const taken=(typeof ccRaceOn==='function' && ccRaceOn()) ? ccRaceTakenKeys() : new Set();
  const roles=ccSquadRoles(), picks=[];
  const take=c=>{
    if(!c || picks.length>=need) return;
    const k=hKey(c);
    if(team.has(k) || taken.has(k)) return;
    const r=attrsFor(c).roleKey;
    if(!ccSquadRoleFits(roles.concat(r ? [r] : []), size)) return;
    team.add(k); picks.push(c); if(r) roles.push(r);
  };
  [me].concat(mates).forEach(c=>{ if(c) ccRealMatesOf(c, size-1).forEach(take); });
  if(picks.length<need){
    const own=[me].concat(mates).filter(Boolean);
    const avg=own.reduce((s,c)=>s+ccCardOvr(c), 0)/Math.max(1, own.length);
    // Рейтинг — один раз на карточку: сравнение внутри sort звало ccCardOvr n·log n раз и вешало стык этапа.
    const near=careerRosterNowEU().map(c=>({c, d:Math.abs(ccCardOvr(c)-avg)})).sort((x,y)=>x.d-y.d);
    near.forEach(x=>take(x.c));
    /* Состав, который уже не проходит по ролям (два ИГЛа: ты и напарник), правило ролей отсекает каждого — и кресло
       оставалось пустым, а пустое кресло закрывает все вечера (24.10, сквад-год на выбор, ccFmtYearSet). Тогда — ближайшие
       по силе без правила ролей: пустое кресло хуже лишнего ИГЛа. */
    if(picks.length<need) near.forEach(x=>{ const c=x.c; if(picks.length>=need) return; const k=hKey(c);
      if(team.has(k) || taken.has(k)) return; team.add(k); picks.push(c); });
  }
  picks.forEach(c=>careerMateSeat({handle:c.handle, cardRegion:c.region||ccCareerRegion(), patience:CAREER_PATIENCE_START, since:careerToday()}));
  if(picks.length){
    const tags=careerMates().filter(Boolean).map(m=>'@'+ccHandle(m.handle)).join(' ');
    careerNews('good', 'ccNewsSquadNew', [size===4 ? 'SQUAD' : size===3 ? 'TRIO' : 'DUO', tags]);
  }
  careerSave();
}
/* ДУО, ТРИО И СКВАД — ОТДЕЛЬНЫЕ СОСТАВЫ.

   Просьба: «пусть дуо трио это отдельные составы чтоб ниче не путалось, но игроки могут
   одинаковые быть». Раньше состав был один: пара, переходя в трио-этап года, добирала
   третьего в ту же запись — и место на ЛАН пары, взятое в дуо, «ломалось» от приёма в трио.
   Теперь на каждый размер свой список (CAREER.rosters[2|3|4]): когда размер состава года
   меняется, текущий откладывается, а поднимается сохранённый для нового размера. Нового ещё
   не было — он начинается с тех же людей (сколько влезает), дальше живёт сам. В командной
   карьере состав общий на двоих и едет с сервера — там не трогаем. */
function ccRosterSwap(){
  if(!CAREER || !CAREER.career || CC_EVENT_SIZE) return;
  if(typeof ccMpOn==='function' && ccMpOn()) return;
  const size=careerSquadSize();
  if(!CAREER.rosters) CAREER.rosters={};
  const was=CAREER.rosterSize;
  if(was===size) return;
  CAREER.rosterSize=size;
  if(!was) return;
  CAREER.rosters[was]=(CAREER.partners||[]).slice();
  const saved=CAREER.rosters[size];
  CAREER.partners = saved ? saved.slice() : (CAREER.partners||[]).slice(0, size-1);
  careerSave();
}
/* What a season was played in, which is not what its number implies.

   The archive read the format off the parity of the season number — season two
   is even, so season two was trios. That is the rule the mode follows from now
   on, but it is a day old and the careers are older: a season played before it
   was a duo season whatever number it carries. The tile told a player who had
   just won Major 3 in a duo that he had been in a trio, with his own two names
   printed under the line saying so. His report, 20 August.

   So the size is recorded at the boundary now — see careerNewSeason — and a
   season with no record reads as duos, which is the reading careerSquadSize
   already gives a save from before the rule. */
function careerSeasonSize(sn){
  const cr=CAREER && CAREER.career;
  if(!cr) return 2;
  if(sn===cr.season) return careerSquadSize();
  const rec=cr.sizes && cr.sizes[sn];
  return rec===1 ? 1 : rec===3 ? 3 : rec===4 ? 4 : 2;
}
/* ФОРМАТ ГОДА НА ВЫБОР ПОСЛЕ 2026 (24.10, Notion «24.10.26», его ответ игроку: «следующие года сделаю, чтоб игрок
   выбирал мод, в котором играть»). До этого год после 2026 брал формат по чётности: дуо, трио, дуо… Теперь на
   стыке года открывается окно: дуо, трио или сквад; по умолчанию стоит прежний (чётность). Выбрать можно, пока в
   новом году не сыграно ни одного вечера; дальше состав живёт как у 2019-го на стыке этапа (ccRosterSwap +
   ccPhaseFillSeats садит пустые кресла). Соло-год (размер 1): все вечера на одного, напарников нет.
   Онлайн (команда, гонка) и менеджер формат не выбирают: он общий и решается правилом. */
function ccFmtYearCan(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.fmtOpen!==cr.season || CAREER._mgr) return false;
  if((typeof ccMpTeam==='function' && ccMpTeam()) || (typeof ccRaceOn==='function' && ccRaceOn())) return false;
  return !(cr.log||[]).some(e=>e && e.season===cr.season);
}
/* Карта года выбирается в том же окне, что и формат (его слово 13.11: «пусть карта года выбирается так же, как и мод»,
   «по кругу не надо»). По умолчанию отмечена глава, на которую год встал бы сам. */
let CC_FMT_SEL=null;
function ccFmtMapOn(){ return ccYearShift()>0 && !ccPastYearIsland(); }
function ccFmtYearSel(k, v){
  if(!CC_FMT_SEL) return;
  CC_FMT_SEL[k]=v;
  const m=document.getElementById('ccFmtModal'); if(!m) return;
  m.querySelectorAll('[data-fk="'+k+'"]').forEach(b=>{ const on=+b.dataset.fv===v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
}
function ccFmtYearGo(){ const s=CC_FMT_SEL; if(s) ccFmtYearSet(s.n, s.m); }
function ccFmtYearSet(n, map){
  const cr=CAREER && CAREER.career; if(!cr || !ccFmtYearCan() || [1,2,3,4].indexOf(n)<0) return;
  delete cr.fmtOpen;
  ccFmtYearClose();
  if(Number.isInteger(map) && map>=0 && map<CC_CYCLE.length && ccFmtMapOn()){ cr.mapCh=map; CC_YEAR_DAYS=null; }
  if(cr.size!==n){
    cr.size=n; (cr.sizes=cr.sizes||{})[cr.season]=n;
    CC_POOLS=null; CC_NOW_CARDS={}; CC_YEAR_DAYS=null;
    try{ ccTrioMarket(cr, true); }catch(e){}
    ccRosterSwap();
    try{ ccPhaseFillSeats(n); }catch(e){}
  }
  careerSave();
  careerRenderHub('centre');
}
function ccFmtYearClose(){ const m=document.getElementById('ccFmtModal'); if(m) m.remove(); }
function ccFmtYearOpen(){
  if(!ccFmtYearCan() || document.getElementById('ccFmtModal')) return;
  const T=L(), cr=CAREER.career, now=careerSquadSize();
  let ch=null; try{ ch=ccChapterOf(ccSeasonNumOn(careerToday())); }catch(e){}
  const m=document.createElement('div');
  m.id='ccFmtModal';
  const mapOn=ccFmtMapOn(), mapNow=ccCycleChapter(ccYearShift());
  CC_FMT_SEL={n:now, m:mapOn ? mapNow : null};
  const btn=(k, v, w, on)=>'<button type="button" data-fk="'+k+'" data-fv="'+v+'" class="'+(on ? 'on' : '')+'" aria-pressed="'+(on ? 'true' : 'false')+'" onclick="ccFmtYearSel(\''+k+'\','+v+')">'+esc(w)+'</button>';
  m.innerHTML='<div class="cc-ask-box"><p>'+esc(T.ccFmtYearQ(ccSeasonYear(), ch && ch.c ? ch.c : ''))+'</p><div class="cc-fmt-btns">'+
    [[1, T.ccFmtSolo||'Solos'], [2, T.ccFmtDuo], [3, T.ccFmtTrio], [4, T.ccFmtSquad]].map(([n, w])=>btn('n', n, w, n===now)).join('')+'</div>'+
    (mapOn ? '<p class="cc-fmt-h">'+esc(T.mapPickH||'Map this year')+'</p><div class="cc-fmt-btns cc-fmt-maps">'+
      CC_CYCLE_NAMES.map((w, i)=>btn('m', i, w, i===mapNow)).join('')+'</div>' : '')+
    '<div class="cc-fmt-go"><button type="button" onclick="ccFmtYearGo()">'+esc(T.ccFmtGo||'Play')+'</button></div></div>';
  document.body.appendChild(m);
}
function ccFmtYearNudge(){
  try{
    if((typeof CC_FF!=='undefined' && CC_FF) || CAREER_RUN) return;
    const hub=document.getElementById('screen-career-hub'); if(!hub || !hub.classList.contains('active')) return;
    if(ccFmtYearCan()) ccFmtYearOpen();
  }catch(e){}
}
/* Everybody who sat beside the player that night, and not the first seat alone.

   A log entry carried `mate`, one handle, from the years when one was all there
   was — so the archive built the player's own winning team out of two names in
   a season of threes. `mate` stays where it is, for the saves already written
   and for every reader that means "his partner"; this is the team. */
function ccLogMates(mates){
  return (mates||[]).map(m=>m && m.handle).filter(Boolean);
}
/* A save from before home was written down.

   There is no way to tell, after the fact, whether a career standing in NA
   Central started there or flew there — nothing recorded the difference. So it is
   read as home, which is the reading that cannot hurt anybody: a career that did
   fly there stops paying that rent, and one that started there stops being
   evicted for a lease it never signed. The second is the bug; the first is a
   month's rent forgiven once, to a handful of saves, and worth it. */
/* Сейв, заведённый до этой правки, стоит в том дивизионе, который выбрали на
   экране создания, и выйти из него ему нечем. Один раз — в первый. */
/* Сейв из региона, где ступеней три, мог сидеть в четвёртом или пятом:
   до сегодняшней правки их предлагали везде. Опускаем на нижнюю ступень
   региона — это то же место в лестнице, просто названное верно. */
function careerMigrateDivDepth(){
  const cr=CAREER && CAREER.career;
  if(!cr) return;
  const n=ccDivCount(typeof ccCareerRegion==='function' ? ccCareerRegion() : null);
  if((cr.division||1)>n){ cr.division=n; if(typeof careerSave==='function') careerSave(); }
}
function careerMigrateNoDiv(){
  const cr=CAREER && CAREER.career;
  if(!cr || !ccNoDivisions()) return;
  if((cr.division||1)!==1) cr.division=1;
}
function careerMigrateHome(){
  const pl=CAREER && CAREER.player;
  if(!pl || pl.homeRegion!=null) return;
  pl.homeRegion=pl.region||'EU';
  careerSave();
}
/* Дома Релоада переезжают с круга на остров.

   До 24 августа дом хранился по ключу круга (r1…r4), и таких сейвов уже
   написано. Молча оставить их значит потерять дом вместе с накопленной аурой:
   careerSpotList теперь спрашивает 'r12' и 'r34', а там пусто. Поэтому записи
   сводятся к островам — первая по счёту остаётся, вторая (если игрок успел
   поставить дома и на первом круге, и на втором) отдаёт свою ауру той, что
   старше: это одно и то же место на одной карте, и складывать его репутацию
   честнее, чем выбрасывать половину. */
function careerMigrateSpotIslands(){
  const cr=CAREER && CAREER.career;
  if(!cr || !cr.spots) return;
  let moved=false;
  [['r12','r1','r2'], ['r34','r3','r4']].forEach(function(g){
    const to=g[0], from=g.slice(1);
    from.forEach(function(k){
      const v=cr.spots[k];
      if(!v) return;
      const list=Array.isArray(v) ? v : [v];
      delete cr.spots[k];
      moved=true;
      if(!list.length) return;
      if(!cr.spots[to]){ cr.spots[to]=list.slice(0,1); return; }
      const keep=cr.spots[to][0], drop=list[0];
      if(keep && drop) keep.aura=Math.max(keep.aura||0, drop.aura||0);
    });
  });
  if(moved) careerSave();
}
// A save from before the trio years is a duo season, which is what it played.
function careerMigrateSize(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.size!=null) return;
  cr.size=2;
  careerSave();
}
/* Which island a career night is played on.

   His ask, 19 August: in a trio year the map should change too. It can, because
   the trio year's islands are already here — t1, t2 and t3 are Chapter 6's three
   seasons, each with the drop grid and the counted loot read off that Major's
   own map, and the 2025 card sets have been playing them since they were built.

   Split on the year's own arc rather than on a date pulled out of the air: the
   island turns over when the Major does, so a season opens on the first, moves
   to the second once Major 1 is behind it and to the third for the run to
   Antwerp. Which is what a real year does — a new season, a new map.

   Reload is not in this. It has its own islands in every year, and the three
   runners that play it name them a line after the default. */
const CC_TRIO_ISLANDS=[{from:'2026-05-01', set:'t2'}, {from:'2026-07-01', set:'t3'}];
/* 2025-й: остров меняется в день нового сезона Fortnite (CC_SEASONS: S34 с 21.02, S36 с 7.06). Стояло «с Плей-Ином
   следующего Мейджора» (9.04 и 16.07): сезон, магазин и новости уже новые, а карта полтора месяца старая — «сезон
   поменялся карта не обновилась» (Notion 24.10.26, скрин острова C6S1). Острова C6S4 (S37, с 7.08) в сборке нет — стоит C6S3. */
const CC_TRIO_ISLANDS_2025=[{from:'2025-02-21', set:'t2'}, {from:'2025-06-07', set:'t3'}, {from:'2025-08-07', set:'t4'}];   // C6S4 с 7.08 — Лион (Notion 26.10.26)
/* Остров прошлого года (2019–2024) — по дате, при любом размере команды: трио-годы (2020,
   2021) и вечера в своём формате (2019) иначе проваливались в острова 2025–2026. */
function ccPastYearIsland(){
  if(!ccPastYear(ccCalYear()) || ccIs2025()) return null;
  if(ccIs2024()){ const d0=careerToday(); if(d0>='2024-11-02' && ZONE_SETS.i1) return 'i1';   // Chapter 2 Remix — остров C2S2
    return d0>='2024-08-16' ? 'f4' : d0>='2024-06-14' ? 'f3' : d0>='2024-04-12' ? 'f2' : 'f1'; }
  // 2022-й — Chapter 3: остров по сезону (C3S2 с 20.03, C3S3 с 5.06, C3S4 с 18.09 — Роли).
  // 2021-й — Chapter 2: остров по сезону (C2S6 с 16.03, C2S7 с 8.06, C2S8 с 13.09).
  // 2019-й: World Cup — Season 9, осень — Season X, с 13.10 — Chapter 2 Season 1.
  // 2020-й: остров сезона (C2S3 с 17.06, C2S4 с 27.08).
  if(ccIs2020()){ const d0=careerToday(); const k=d0>='2020-08-27' ? 'i3' : d0>='2020-06-17' ? 'i2' : 'i1';
    return ZONE_SETS[k] ? k : 'h4'; }
  if(ccIs2019()){ const d0=careerToday(); const k=d0>='2019-10-13' ? 'h4' : d0>='2019-08-01' ? 'h3' : 'h1';
    return ZONE_SETS[k] ? k : 'j1'; }
  if(ccIs2021()){ const d0=careerToday(); const k=d0>='2021-09-13' ? 4 : d0>='2021-06-08' ? 3 : d0>='2021-03-16' ? 2 : 1;
    return ZONE_SETS['j'+k] ? 'j'+k : ZONE_SETS['k'+k] ? 'k'+k : 'f'+k; }
  if(ccIs2022()){ const d0=careerToday(); const k=d0>='2022-09-18' ? 4 : d0>='2022-06-05' ? 3 : d0>='2022-03-20' ? 2 : 1;
    return ZONE_SETS['k'+k] ? 'k'+k : ZONE_SETS['e'+k] ? 'e'+k : 'f'+k; }
  /* Season OG (3.11–2.12.2023) — остров Главы 1, как в игре по неделям (пункт 7 списка 20.10): 3–9.11 Сезон 5 (g5),
     9–16.11 Сезон 6 (g6), 16–23.11 Сезоны 7–8 (g7), с 23.11 Сезоны 9/X (h1). Карты — вики (tools/build-mx-islands.js). */
  if(ccIs2023() && careerToday()>='2023-11-03'){ const d0=careerToday();
    const k=d0<'2023-11-09' ? 'g5' : d0<'2023-11-16' ? 'g6' : d0<'2023-11-23' ? 'g7' : 'h1';
    if(ZONE_SETS[k]) return k; if(ZONE_SETS.h1) return 'h1'; }
  if(ccIs2023()){ const d0=careerToday(); const k=d0>='2023-08-25' ? 4 : d0>='2023-06-09' ? 3 : d0>='2023-03-10' ? 2 : 1;
    return ZONE_SETS['e'+k] ? 'e'+k : 'f'+k; }
  return null;
}
/* ГЛАВЫ ПО КРУГУ ПОСЛЕ 2026 (24.10, Notion «24.10.26», игрок: «после 7 главы главы (карты) идут по кругу 6-7-6-7»,
   просил по кругу с первой главы; его ответ игроку: «после 7 главы были другие карты, а не чередовались две»). Год после
   2026 — тот же календарь 2026-го, и остров выбирался по размеру команды: дуо-год на седьмой главе, трио-год на шестой.
   Теперь год берёт главу по кругу: 2027 — Глава 1, 2028 — Глава 2 (S1–S4), 2029 — Глава 2 (S5–S8), 2030 — Глава 3,
   2031 — Глава 4, 2032 — Глава 5, 2033 — Глава 6, 2034 — Глава 7, 2035 — снова Глава 1. Внутри года четыре окна по
   стыкам сезонов 2026-го (19.03, 6.06, 21.08), остров при любом размере команды, как у прошлых лет (ccPastYearIsland).
   Второе число — номер сезона Fortnite этого острова: по нему подпись лобби, фон и всё, что читает ccSeasonNumOn.
   Острова C6S4 и мини-сезонов (Galactic Battle, Simpsons) в сборке нет — их окна стоят на соседнем острове главы. */
const CC_CYCLE_CUTS=['2026-03-19', '2026-06-06', '2026-08-21'];
const CC_CYCLE=[
  [['g5',5], ['g6',6], ['g7',7], ['h1',9]],
  [['h4',11], ['i1',12], ['i2',13], ['i3',14]],
  [['j1',15], ['j2',16], ['j3',17], ['j4',18]],
  [['k1',19], ['k2',20], ['k3',21], ['k4',22]],
  [['e1',23], ['e2',24], ['e3',25], ['e4',26]],
  [['f1',28], ['f2',29], ['f3',30], ['f4',31]],
  [['t1',33], ['t2',34], ['t3',36], ['t4',37]],
  [['m1',39], ['m1',40], ['m2',41], ['s42',42]]
];
function ccCycleSlot(day){
  const k=(typeof ccYearShift==='function') ? ccYearShift() : 0;
  if(!(k>0) || ccPastYearIsland()) return null;
  const d=String(day||careerToday());
  // Только дни календаря года (2026-го, по которому идут все годы после него): даты прошлых лет (кирки FNCS, журналы)
  // остаются своими сезонами.
  if(d<'2025-11-29' || d>='2027-01-01') return null;
  let w=0; CC_CYCLE_CUTS.forEach(c=>{ if(d>=c) w++; });
  const slot=CC_CYCLE[ccCycleChapter(k)][w];
  return (slot && ZONE_SETS[slot[0]]) ? slot : null;
}
function ccCycleIsland(day){ const s=ccCycleSlot(day); return s ? s[0] : null; }
/* СВОЯ КАРТА ПОСЛЕ 2026 (отзыв игрока 11.11: «не возвращай OG-карту после 2026, дай выбрать карту»). cr.mapCh — номер строки
   CC_CYCLE (глава), null — по кругу, как было. Выбор держится, пока его не сменят; в команде и гонке не показывается,
   там год общий. */
function ccCycleChapter(k){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  const m=cr && cr.mapCh;
  return (Number.isInteger(m) && m>=0 && m<CC_CYCLE.length) ? m : (k-1)%CC_CYCLE.length;
}
const CC_CYCLE_NAMES=['C1', 'C2 S1-4', 'C2 S5-8', 'C3', 'C4', 'C5', 'C6', 'C7'];
function ccMapPickHTML(){
  // Плитки в лобби больше нет: карта выбирается в окне нового года вместе с форматом (ccFmtYearOpen).
  return '';
  if(!(ccYearShift()>0) || ccPastYearIsland()) return '';
  if((typeof ccMpOn==='function' && ccMpOn()) || (typeof ccRaceOn==='function' && ccRaceOn())) return '';
  const cr=CAREER.career, cur=Number.isInteger(cr.mapCh) ? cr.mapCh : -1, T=L();
  const b=(i, label)=>'<button class="cc-back'+(i===cur ? ' on' : '')+'" onclick="ccMapPick('+i+')"'+(i===cur ? ' aria-pressed="true"' : '')+'>'+esc(label)+'</button>';
  return '<div class="ch-tile cc-soon cc-mappick"><div class="cc-soon-h">'+esc(T.mapPickH||'Map this year')+'</div>'+
    '<div class="dm-ask">'+b(-1, T.mapPickCycle||'Rotation')+CC_CYCLE_NAMES.map((n, i)=>b(i, n)).join('')+'</div></div>';
}
function ccMapPick(i){
  if(!CAREER || !CAREER.career) return;
  CAREER.career.mapCh=(Number.isInteger(i) && i>=0 && i<CC_CYCLE.length) ? i : null;
  careerSave(); careerRenderHub('centre');
}
function careerBrSet(){
  const py=ccPastYearIsland(); if(py) return py;
  const cy=ccCycleIsland(careerToday()); if(cy) return cy;
  /* Notion «26.10.26», тестер: «we don't have the 2 same map for duo and trio» — в игре один остров на сезон, какой
     ни будь формат. Трио-год на календаре 2026-го сидел на шестой главе (t1–t3), а дуо в те же дни — на седьмой.
     Теперь остров по сезону для обоих; шестая глава — только у 2025-го, где она и была сезоном. */
  if(careerSquadSize()!==3 || !ccIs2025()){
    /* Остров дуо-года — по сезону Fortnite, как у трио-года. Тестер, 16.09:
       «начинается сезон S40, и карта меняется только в соло, а в дуо меняется
       только в сезоне S42». Так и было: до 21 августа дуо-год весь жил на m2.
       Теперь S39–S40 (до 5 июня) — m1, остров Chapter 7 Season 2 (Major 1),
       S41 — m2 (Major 2), с 21 августа — s42. Границы — CC_SEASONS. */
    const d=careerToday();
    /* 2024-й — остров Chapter 5, которого у нас нет (ни карты, ни клеток, ни лута):
       стоим на первом острове Chapter 6 (t1, декабрь 2024) — ближайшем по времени.
       Снять Chapter 5 с fortnite.gg — отдельная работа. */
    /* 2023-й — Chapter 4: остров по Мейджору (C4S1 до 10.03, C4S2 до 9.06, C4S3 до 25.08, дальше
       C4S4 — Копенгаген). Пока островов Chapter 4 в сборке нет, стоят острова 2024-го. */
    if(d>=CC_SEASONS[4].from && ZONE_SETS.s43) return 's43';
    if(d>='2026-08-21') return 's42';
    return d>=CC_SEASONS[2].from ? 'm2' : 'm1';
  }
  const day=careerToday();
  let set='t1';
  CC_TRIO_ISLANDS_2025.forEach(r=>{ if(day>=r.from) set=r.set; });
  return set;
}
/* Остров соло-вечера, не всегда сезонный. Метка и вечер обязаны быть на одном острове.
   Дуо-год: все соло-вечера идут на острове сезона (Solo Series в январе m1, соло-Victory Cup m1/m2, FNCS Solos
   в октябре и сезон с 21 августа s42), поэтому ответ = сезон.
   Трио-год: остров ближайшего соло-вечера. Сезон на шестой главе (t1/t2/t3), а FNCS Solos (ev.spec) на s42solo,
   как их сыграют careerNightSet и runCareerSoloSeries.
   Метка хранится на каждом острове своя (careerSpotStore). Один ответ на вкладку метки, карточку вечера и дом в
   раздаче (ccSoloHomeZone). */
function careerSoloSet(){
  if(careerSquadSize()!==3 || !ccIs2025() || ccPastYearIsland() || ccCycleIsland(careerToday())) return careerBrSet();
  const days=(typeof careerYearDays==='function') ? careerYearDays() : null;
  if(days && typeof careerNightSet==='function' && typeof careerNightSolo==='function'){
    const today=careerToday();
    const ahead=[...days.keys()].filter(d=>d>=today).sort();
    for(const d of ahead){
      const e=(days.get(d)||[]).find(x=>careerNightSolo({type:x.kind, day:d}));
      if(e) return careerNightSet({type:e.kind, day:d});
    }
  }
  return careerBrSet();
}
/* Своя точка на карте и аура на ней. Игрок выбирает локацию на сезон, может сменить; на точке копится аура,
   чтобы туда боялись падать.
   Точка своя на каждый остров (сетки разные): cr.spots = {m2:{i, aura, won, day}, …}.
   Аура растёт от выигранных стычек на своей точке (careerGrowEvent), упирается в CC_SPOT_AURA_MAX и сгорает при
   смене точки. Даёт только меньше ботов на точке: landingScore считает страх как с CONTEST_FEAR, соседом тут
   выступает репутация. К pow ничего не добавляет, сила идёт от рейтинга. */
const CC_SPOT_AURA_MAX=10;
/* Аура в глазах бота, вес 1.05 / 1.0. Сосед в коробке стоит CONTEST_COST = 2.4, полная аура
   CONTEST_COST · CC_SPOT_FEAR · gap, gap = BASE + (твоя сила - его)/CONTEST_FEAR. Чтобы дом обходили, нужно > 2.4.
   Мерить вечером (11 игр, высадка заново перед каждой), не раздачей: 90% тишины на игру = 69% вечеров с коном.
   tools/spot-aura-cup-probe.js, 30 кубков, аура 10: вес 1.00 91% игр один, кон в 37% вечеров; 1.05 98% и 7%;
   1.10 100% и 0%, но точка заперта наглухо. На ауре 7 почти ноль везде: это порог, а не склон.
   Разброс на команду и CC_SPOT_FEAR_SWING (выключен) пробовали, оба хуже. Полная аура теперь замок
   (CC_SPOT_LOCK_ZONES): аура 10 = 100% игр один, 0 конов. Проверка tools/check-spot-aura.js. */
let CC_SPOT_FEAR=1.05, CC_SPOT_FEAR_BASE=1.0;
function careerSpots(){
  const cr=CAREER && CAREER.career;
  if(!cr) return {};
  if(!cr.spots) cr.spots={};
  return cr.spots;
}
/* Спотов ВСЕГО три, и каждый — на своей карте. Его уточнение, 23 августа:
   «всего 3 спота, каждый спот на 1 карту типо… аура фармится на локах одной
   карты, [а другой спот] на карте другой».

   То есть три — это не три коробки на одном острове, а три дома на весь год:
   карт в году пять (карта сезона и четыре круга Релоада), и выбрать под дом
   можно только три из них. На одной карте дом один — там и копится его аура.

   Хранится по-прежнему в cr.spots[остров], по одной записи на карту; предел
   считается по числу карт, где дом уже стоит. Старый сейв мог хранить и один
   объект, и список — careerSpotList поднимает оба вида молча. */
const CC_SPOT_SLOTS=3;
/* Дом привязан к острову, а не к кругу. Кругов Reload четыре (r1..r4), островов два: r1-r2 на Слюрпи
   (art/map-reload-a.jpg), r3-r4 на Стронгхолде. Ключ хранения 'r12' и 'r34'.
   Сеток всё равно четыре (у каждого круга своя дроп-карта, 15 и 13 коробок), один индекс в них значит разное.
   Поэтому храним и точку, центр коробки в процентах острова, по ней находим коробку на любой сетке. Индекс остался
   для старых сейвов и как запасной путь. */
function careerSpotKey(set){
  const k=set||ACTIVE_LANDING_SET;
  if(k==='r1' || k==='r2') return 'r12';
  if(k==='r3' || k==='r4') return 'r34';
  return k;
}
/* Сколько карт уже заняты домом — из ТЕХ, НА КОТОРЫХ ИГРАЮТ В ЭТОМ ГОДУ.

   Баг игрока, 24 августа: «when you play your own career then after a season
   you cant pick the spots anymore». Считалось по всем ключам cr.spots, а год
   меняет сезонный остров: дом на прошлогоднем острове держал слот вечно, и уже
   на второй сезон три слота были заняты — сезонный прошлый, r12 и r34, — а
   новый сезонный остров не влезал. Окно честно писало «все три уже стоят на
   других картах», и поставить дом было нельзя вовсе: карт, на которых играют,
   всего три (см. CC_SPOT_SLOTS и careerSpotSets), и одна из них каждый год
   новая.

   Старые дома при этом НЕ стираются: карта может вернуться (циклы островов у
   Epic), и аура, накопленная на ней, — заработанная. Они просто перестают
   считаться, пока на их острове не играют. */
function careerSpotUsed(){
  return careerSpotSets()
    .map(t=>careerSpotKey(t.key))
    .filter(k=>k!=='solo' && k!=='nations' && !ccIsFmtSpotKey(k) && careerSpotList(k).length).length;
}
function careerSpotRoom(set){
  if(careerSpotKey(set)==='solo' || careerSpotKey(set)==='nations' || ccIsFmtSpotKey(careerSpotKey(set))) return true;      // слоты команды не занимает
  // На этой карте дом уже есть — менять его можно всегда, это не новый спот.
  if(careerSpotList(set).length) return true;
  return careerSpotUsed()<CC_SPOT_SLOTS;
}
/* Возвращает САМ массив, а не копию: по нему и ходят, и правят — снять точку
   значит вырезать её отсюда. Первая версия отдавала `v.filter(...)`, то есть
   новый массив, и careerSpotClear резал копию: точка «снималась» и оставалась
   на месте. Поэтому мусор (пустые дырки от старых сейвов) вычищается здесь же,
   на месте, а наружу уходит живой список. */
function careerSpotList(set){
  const key=careerSpotKey(set);
  const spots=careerSpotStore(key);
  let v=spots[key];
  if(!v) return [];
  // Миграция формата: было {i,aura,won,day} — стало [{...}].
  if(!Array.isArray(v)){ v=[v]; spots[key]=v; }
  for(let k=v.length-1;k>=0;k--) if(!v[k] || v[k].i==null) v.splice(k,1);
  return v;
}
// Первая точка списка — та, что подставляется, когда спрашивают «где дом»
// одним ответом (перемотка, старые вызовы). Остальные равноправны.
function careerSpotOn(set){ return careerSpotList(set)[0] || null; }
// Зона по слоту. Индекс живёт в наборе, а не в ALL_LANDING_ZONES: соло-режим
// дробит сетку (splitLandingZonesForSolo), и один и тот же индекс значил бы
// там другое место. Ищем по геометрии — прямоугольник, накрывающий центр.
/* slot — запись дома: либо сам объект {i, cx, cy}, либо голый индекс (так его
   зовут плитка и старые вызовы). Точка вернее индекса: у каждого круга Релоада
   своя сетка на общем острове, и один индекс значит там разные места. */
function careerSpotZoneOf(slot, set){
  /* Сетка — по КЛЮЧУ ХРАНЕНИЯ, а не по имени острова: у соло свой склад
     (cr.soloSpots), а геометрия у него сезонного острова, и ZONE_SETS['solo']
     не существует. careerSpotGrid переводит ключ в остров — см. careerSpotSets. */
  const grid=ZONE_SETS[careerSpotGrid(set||ACTIVE_LANDING_SET)]||ZONE_SETS[set||ACTIVE_LANDING_SET]||[];
  const obj = (slot && typeof slot==='object') ? slot : null;
  let cx = obj && obj.cx, cy = obj && obj.cy;
  const home = grid[obj ? obj.i : slot];
  if(cx==null || cy==null){
    if(!home) return null;
    cx=home.x+home.w/2; cy=home.y+home.h/2;
  }
  const hit=ALL_LANDING_ZONES.find(z=>cx>=z.x && cx<=z.x+z.w && cy>=z.y && cy<=z.y+z.h)
      || (home ? ALL_LANDING_ZONES.find(z=>Math.abs(z.x-home.x)<0.01 && Math.abs(z.y-home.y)<0.01) : null);
  if(hit) return hit;
  /* Коробки — это POI, а не плитка: между ними есть зазоры, и у одного острова
     сетки бывают разные (соло-FNCS играет ту же s42 на сто клеток вместо
     тридцати). Точка, выбранная на одной сетке, на другой попадает в дырку —
     и дом пропадал совсем. Берём ближайшую коробку, если она рядом: это то же
     место острова, просто нарезанное иначе. Далеко — значит другой остров, и
     дома здесь честно нет. */
  let best=null, bestD=CC_SPOT_NEAR*CC_SPOT_NEAR;
  ALL_LANDING_ZONES.forEach(z=>{
    const dx=(z.x+z.w/2)-cx, dy=(z.y+z.h/2)-cy, d=dx*dx+dy*dy;
    if(d<bestD){ bestD=d; best=z; }
  });
  return best;
}
// Насколько близко «рядом» — в процентах карты. Половина типичной коробки:
// дальше начинается уже соседний POI, а не другая нарезка того же места.
const CC_SPOT_NEAR=6;
function careerSpotZone(set){
  const s=careerSpotOn(set);
  return s ? careerSpotZoneOf(s, set) : null;
}
/* ЧЕЙ ДОМ ЧИТАЕТ ЭТОТ ВЕЧЕР.

   Правка: «в соло ещё метки, не для соло, а для других
   режимов». Метка соло хранится отдельно (cr.soloSpots, ключ 'solo') — плитка
   в хабе и карточка вечера это знали (careerNightSpotKey), а сам вечер нет:
   пикер, страх комнаты, начисление ауры и «сел — значит дом» спрашивали
   ACTIVE_LANDING_SET, то есть сезонный дуо-остров. В соло-вечере на карте
   горела чужая метка, аура капала не туда, а выбранная в соло точка не
   показывалась вовсе.

   Один указатель на весь вечер: раннер соло поднимает его перед посадкой и
   гасит после. Всё остальное спрашивает ccNightSpot(ACTIVE_LANDING_SET). */
let CC_SPOT_NIGHT=null;
function ccNightSpot(set){
  return CC_SPOT_NIGHT || careerSpotKey(set||ACTIVE_LANDING_SET);
}
function ccNightSpotOn(key){ CC_SPOT_NIGHT=key||null; }
function ccNightSpotOff(){ CC_SPOT_NIGHT=null; }
// Все свои зоны острова разом: их подсвечивает пикер и их боятся боты.
function careerSpotZones(set){
  const key=set||ACTIVE_LANDING_SET;
  return careerSpotList(key).map(s=>({slot:s, zone:careerSpotZoneOf(s, key)}))
    .filter(x=>x.zone);
}
// Аура конкретного слота, а без номера — лучшая на острове: чипу и строке
// «сколько накоплено» нужен один ответ.
function careerSpotAura(set, slot){
  const list=careerSpotList(set);
  if(slot!=null) return list[slot] ? (list[slot].aura||0) : 0;
  return list.reduce((m,s)=>Math.max(m, s.aura||0), 0);
}
/* Обратный перевод: клик по прямоугольнику — в индекс набора. В соло сетка
   дроблёная, и кликнутый кусок надо привести к его родителю, иначе метка на
   следующий вечер (дуо) не нашлась бы. Родитель — тот, внутри которого лежит
   центр куска. */
function careerSpotIndexOf(zone, set){
  const grid=ZONE_SETS[set||ACTIVE_LANDING_SET]||[];
  if(!zone) return -1;
  const cx=zone.x+zone.w/2, cy=zone.y+zone.h/2;
  let at=grid.findIndex(z=>cx>=z.x && cx<=z.x+z.w && cy>=z.y && cy<=z.y+z.h);
  if(at<0) at=grid.findIndex(z=>Math.abs(z.x-zone.x)<0.01 && Math.abs(z.y-zone.y)<0.01);
  return at;
}
/* Поставить дом на карте. Пока свободные споты есть, новая карта берётся
   молча; переезд внутри карты жжёт её ауру — репутация остаётся месту, и дома
   на других картах этого не замечают. Клик по своей же коробке не делает
   ничего, иначе промах по карте сжигал бы полсезона. */
function careerSpotSet(i, set, geom){
  const cr=CAREER && CAREER.career; if(!cr) return false;
  // Сетка, по которой кликнули (у ключа-острова своей сетки нет), и остров,
  // на котором ставится дом.
  const from=careerSpotGrid(set||careerBrSet());
  const key=careerSpotKey(set||careerBrSet());
  const spots=careerSpotStore(key);
  const list=careerSpotList(key);
  if(list.some(s=>s.i===i)) return true;         // уже стоит на этой коробке
  if(!careerSpotRoom(key)) return false;         // три карты уже заняты
  // Центр выбранной коробки — то, чем дом найдётся на любой сетке этого
  // острова: у второго круга Релоада своя дроп-карта, и индекса ей мало.
  const box=(ZONE_SETS[from]||[])[i];
  // geom — центр, заданный снаружи: коробка дроблёной соло-сетки, см. ccSoloHomeSet.
  /* Отзыв 2.10 (Notion «02»): «aura should be tied to your character, and if you leave your aura
     gets cut in half». Раньше переезд и каждая новая карта (новый год, новая глава) начинали с нуля,
     и до полного дома нужно было заново пять разгромных вечеров — на каждом острове. Теперь аура
     идёт за игроком: новый дом стартует с половины лучшего, что у него было (старый дом этой карты,
     любой другой дом или рекорд cr.auraBest), округление вниз. Порог страха (CC_SPOT_FEAR) не тронут:
     замок по-прежнему только на полных 10, их надо добрать вечерами уже на новом месте. */
  const carry=Math.floor(careerSpotCarry()/2);
  spots[key]=[{i:i, aura:carry, won:0, day:careerToday(),
               cx: geom && geom.cx!=null ? geom.cx : (box ? box.x+box.w/2 : undefined),
               cy: geom && geom.cy!=null ? geom.cy : (box ? box.y+box.h/2 : undefined)}];
  careerSave();
  return true;
}
// Лучшая аура игрока: все дома (включая острова прошлых лет в cr.spots) и рекорд cr.auraBest.
function careerSpotCarry(){
  const cr=CAREER && CAREER.career; if(!cr) return 0;
  let best=cr.auraBest||0;
  const sp=cr.spots||{};
  Object.keys(sp).forEach(k=>{ const v=sp[k]; (Array.isArray(v) ? v : [v]).forEach(x=>{ if(x && (x.aura||0)>best) best=x.aura; }); });
  return Math.min(CC_SPOT_AURA_MAX, best);
}
// Снять дом с карты — спот освобождается вместе со своей аурой и уходит в
// общий запас: его можно поставить на другую карту.
function careerSpotClear(set){
  const key=careerSpotKey(set||careerBrSet());
  const spots=careerSpotStore(key);
  if(!careerSpotList(key).length) return;
  delete spots[key];
  careerSave();
}
/* Вечер, а не стычка.

   Сначала аура росла на каждую выигранную высадку — и замер
   (career-spot-farm-probe.js) показал, во что это превращается: в комнате на
   пятьдесят своя коробка делится почти каждую игру, за вечер выходит десяток
   стычек, и потолок в десять брался за ДВА вечера. Репутация, которую можно
   выкупить за два вторника, ничего не значит, а он просил фарм на сезон.

   Поэтому единица ауры — вечер: удержал дом (выиграл больше, чем проиграл) —
   плюс один, вынесли дома (проиграл больше) — минус один, поровну — ничего.
   Полный дом стоит десяти удержанных вечеров, то есть половины сезона, и его
   можно потерять, не переезжая: перестал держать — перестали бояться. */
// slot — какая из трёх точек отыграла вечер; ауру получает только она.
/* beef — вечер, в котором дома сошлись те, между кем уже есть ссора. Такой
   вечер сцена запоминает вдвое лучше — в обе стороны.

   Сначала удваивался только плюс, и это было неправдой про то, что я ему сам
   же и обещал: «ускоритель фарма с риском». Односторонний множитель — это не
   риск, а подарок: биф не гаснет сам, пока соперник приходит, а приходит он
   как раз потому, что биф жив (см. CC_BEEF_PULL). Получалась вечная двойная
   ставка без обратной стороны. Теперь разнесённый дома вечер против того же
   человека тоже стоит вдвое. */
function careerSpotNight(won, lost, set, slot, beef){
  const key=set||ACTIVE_LANDING_SET;
  const s=careerSpotList(key)[slot||0];
  if(!s) return 0;
  /* Шкала вечера по замеру. Симметричные +1/-1 давали блуждание: карьера на 92 за 20 вечеров дорастала до 3 и сползала обратно.
         разгром (побед вдвое больше и хотя бы 4)       +2
         удержал (побед больше)                         +1
         поровну                                         0
         разнесли (поражений вдвое больше и хотя бы 4)  -1
     Мелкий минус ничего не отнимает. На этой шкале (career-spot-farm-probe.js, карьера 92, 20 вечеров дома): аура 0 → 5, полный дом примерно за сезон. */
  const w=won||0, l=lost||0;
  let d = (w>=2*l && w>=4) ? 2 : (w>l ? 1 : (l>=2*w && l>=4 ? -1 : 0));
  if(beef) d*=CC_BEEF_AURA;
  if(!d) return 0;
  const before=s.aura||0;
  s.aura=Math.max(0, Math.min(CC_SPOT_AURA_MAX, before+d));
  if(d>0) s.won=(s.won||0)+1;
  { const cr=CAREER && CAREER.career; if(cr && s.aura>(cr.auraBest||0)) cr.auraBest=s.aura; }
  return s.aura-before;
}
/* Имя, за которым следят: гранд-финал (+2) и слот на LAN (+7) добавляются к ауре дома, комната реже
   конит дроп. Та же шкала и потолок, что у ауры (CC_SPOT_FEAR), чтобы не калибровать отдельно;
   копится только при метке дома, как и аура.
   Замер tools/renown-drop-probe.js (30 кубков по 11 игр, комната 50, средняя коробка, карьера 92),
   дом/имя: игр один / вечеров с коном: 0 любое 0%/100%; 1 гранд+LAN 7%/100%; 2 гранд+LAN 70%/77%;
   3 гранд+LAN 99%/7%; 5 нет или гранд 0%/100%; 5 гранд+LAN 99%/3%; 8 нет 6%/100%;
   10 нет 100%/0% (замок, CC_SPOT_LOCK_ZONES). Имя само не защищает, а сдвигает старт по шкале ауры. */
const CC_RENOWN_GRAND=2;   // сыгран гранд-финал мейджора — когда-либо
const CC_RENOWN_LAN=5;     // слот на Global Championship — в этом сезоне
function careerRenown(){
  const cr=CAREER && CAREER.career;
  if(!cr) return 0;
  let r=0;
  if((cr.log||[]).some(x=>x && x.kind==='major' && x.stage==='final')) r+=CC_RENOWN_GRAND;
  /* Слот, а не сыгранный турнир: «you qualify for end of year globals and you
     have another major to play» — весь смысл в мейджорах МЕЖДУ квалификацией и
     ЛАНом. ccGlobalsSeat смотрит этот сезон, поэтому в следующем имя
     начинается заново с гранд-финалов. */
  try{ if(ccGlobalsSeat()) r+=CC_RENOWN_LAN; }catch(e){}
  return r;
}

/* ===== Бифы ==================================================================

   Правка: «можно сделать какие-то бифы в твиттере и за
   локации допустим, ауру фармить, как-то типо».

   Ссора заводится не словами, а картой: если один и тот же человек сходится с
   тобой на ТВОЕЙ точке дважды за полтора месяца, между вами уже что-то есть, и
   лента это замечает. Дальше биф работает в обе стороны — он чаще садится
   тебе на голову (значит стычек больше), а вечер, в котором ты его вынес,
   стоит вдвое дороже по ауре. То есть биф — это ускоритель фарма с риском, а
   не украшение: те же вечера, но крупнее ставка.

   Гаснет сам: месяц без встреч — и запись уходит. Промолчать на его пост тоже
   значит погасить, только сразу. */
const CC_BEEF_WINDOW=45;   // дней, за которые две стычки читаются как одна ссора
const CC_BEEF_NEED=2;      // сколько раз надо сойтись, чтобы это стало бифом
const CC_BEEF_COOL=30;     // дней тишины — и биф гаснет
const CC_BEEF_AURA=2;      // во столько раз дороже вечер, где вынес соперника
const CC_BEEF_PULL=6;      // насколько сильнее его тянет на твою коробку
const CC_BEEF_REACH=1200;  // подписчиков за ответ на его пост
/* Бифы выключены целиком. Отзыв страница «playin»: «убери
   бифы с игры» — лента за один вечер собрала семь одинаковых постов «@… опять
   сел нам на голову»: каждый, с кем сошёлся дважды дома за шесть игр, писал
   свой. Код ссор оставлен на месте, но с этим ключом ни одна встреча не
   записывается, тяги на дом нет, ярлыка на точке нет, а старые посты ссор и
   сами ссоры вычищаются из сейва при загрузке (careerMigrateBeefsOff). */
const CC_BEEFS_ON=false;
function careerBeefs(){
  const cr=CAREER && CAREER.career;
  if(!cr) return [];
  if(!Array.isArray(cr.beefs)) cr.beefs=[];
  return cr.beefs;
}
/* Старые посты ссор уходят из сейва вместе с самими ссорами — иначе лента
   держала бы «Ответить/Промолчать» к тому, чего в игре больше нет. */
function careerMigrateBeefsOff(){
  const cr=CAREER && CAREER.career;
  if(CC_BEEFS_ON || !cr) return;
  if(Array.isArray(cr.news) && cr.news.some(n=>n && n.beef))
    cr.news=cr.news.filter(n=>!(n && n.beef));
  if(Array.isArray(cr.beefs) && cr.beefs.length) cr.beefs=[];
}
function careerBeefOf(handle){
  const k=hKey(handle);
  return careerBeefs().find(b=>hKey(b.h)===k) || null;
}
// Живые ссоры: те, что уже переросли в биф и по которым недавно виделись.
function careerBeefHot(){
  if(!CC_BEEFS_ON) return [];
  const today=careerToday();
  return careerBeefs().filter(b=>b.hot &&
    ccDaysBetween(b.last, today)<=CC_BEEF_COOL);
}
// Лицо чужой команды — тот, кто в ней сильнее: биф с человеком, а не с парой.
function careerBeefFace(team){
  const squad=(team && team.squad) || [];
  let best=null;
  squad.forEach(p=>{ if(!best || ccCardOvr(p)>ccCardOvr(best)) best=p; });
  return best;
}
/* Одна встреча на точке. won — ты его вынес или он тебя.
   Возвращает true, если этой встречей ссора стала бифом. */
function careerBeefBump(card, won){
  if(!CC_BEEFS_ON || !card || !card.handle) return false;
  const today=careerToday();
  const list=careerBeefs();
  let b=careerBeefOf(card.handle);
  if(!b){ b={h:card.handle, w:0, l:0, met:0, since:today, last:today, hot:false}; list.push(b); }
  // Встречи считаются в окне: две стычки в разные концы года — это не ссора.
  if(ccDaysBetween(b.last, today)>CC_BEEF_WINDOW){ b.met=0; b.hot=false; }
  b.met=(b.met||0)+1;
  b.last=today;
  if(won) b.w=(b.w||0)+1; else b.l=(b.l||0)+1;
  if(b.hot || b.met<CC_BEEF_NEED) return false;
  b.hot=true; b.since=today;
  // Первый пост пишет он: это его претензия, не твоя.
  careerNews('bad', 'ccBeefStart', [ccHandle(CAREER.player.nick)], {
    by:{name:card.handle, handle:ccHandle(card.handle), verified:false,
        card:card, ovr:ccCardOvr(card)},
    beef:card.handle});
  return true;
}
/* Что вечер сделал с ссорами: кого ты вынес у себя дома, а кто вынес тебя.
   Зовётся из creditLandingFights — там, где стычки уже прочитаны с карты. */
function careerBeefNight(list){
  const cr=CAREER && CAREER.career;
  if(!CC_BEEFS_ON || !cr || !Array.isArray(list)) return;
  const you=list.find(t=>t.isYou);
  if(!you || !you.landingZone) return;
  // Только дома: биф — это ссора ЗА ЛОКАЦИЮ, а не за случайную коробку.
  const home=careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET)).some(x=>x.zone===you.landingZone);
  if(!home) return;
  const seen=new Set();
  const meet=(team, won)=>{
    if(!team || team===you) return;
    const face=careerBeefFace(team);
    if(!face || seen.has(hKey(face))) return;
    seen.add(hKey(face));
    const was=careerBeefOf(face.handle);
    const hotBefore=!!(was && was.hot);
    careerBeefBump(face, won);
    // Сошёлся дома с тем, с кем уже был биф, — вечер идёт по двойному счёту.
    // Именно СОШЁЛСЯ, а не «вынес»: удваивается и выигранный вечер, и
    // разнесённый, иначе ссора была бы бесплатной ставкой. См. careerSpotNight.
    if(hotBefore) you._beefMet=true;
  };
  list.forEach(t=>{
    if(t===you || !t._droppedOut) return;
    if(t._deathCause===you.name) meet(t, true);
  });
  if(you._droppedOut){
    const killer=list.find(t=>t.name===you._deathCause);
    if(killer) meet(killer, false);
  }
  careerSave();
}
/* Ответить ему или промолчать. Ответ — это громко: подписчики приходят, ссора
   остаётся живой. Молчание её гасит в тот же день, и это честная цена: биф
   кормит ауру, отказ от него кормит спокойствие. */
function careerBeefAnswer(id, how){
  const cr=CAREER && CAREER.career;
  if(!cr) return;
  const post=(cr.news||[]).find(n=>n.id===id);
  if(!CC_BEEFS_ON || !post || !post.beef || post.beefDone) return;
  post.beefDone=how;
  const b=careerBeefOf(post.beef);
  if(how==='hit'){
    careerNews('good', 'ccBeefHit', [ccHandle(post.beef)]);
    careerReachAdd(CC_BEEF_REACH);
    if(b){ b.hot=true; b.last=careerToday(); }
  } else {
    if(b) b.hot=false;
    careerNews('flat', 'ccBeefQuiet', [ccHandle(post.beef)]);
  }
  careerSave();
  careerRenderHub();
}
/* Чего боится комната. Ставится на время расстановки ботов и снимается сразу
   после: landingScore — общая функция, её зовёт и драфт, где никакой карьеры
   нет, и оставленный флаг красил бы чужую игру. */
// Зон три, и у каждой своя аура — поэтому не одна зона с числом, а карта
// зона→аура: комната боится каждой ровно настолько, насколько та заработала.
let CC_SPOT_FEAR_MAP=null, CC_SPOT_FEAR_POW=0;
/* Коробки, куда на время расстановки нельзя вообще: аура на потолке закрывает точку. Без замка полная аура держала 97 вечеров из 100, а сотым прилетал кто-то сильнее (страх гаснет по gap в landingScore).
   Замок вешает только нафармленная аура (десять удержанных вечеров), careerRenown лишь ускоряет рост, иначе слот на LAN и три вечера дома давали бы неприкосновенность.
   Следствие: с закрытой коробки тебя никто не выбьет, аура больше не падает, и соперник по бифу тоже перестаёт долетать. */
let CC_SPOT_LOCK_ZONES=null;
// Дома игрока и ники, с которыми у него открытый биф, — на время расстановки.
let CC_BEEF_ZONES=null, CC_BEEF_SET=null;
// pow — хозяина, иначе «боится тот, кто слабее» не с чем сравнивать. Свою
// команду вечера передаёт тот, кто её уже собрал; без неё берётся рейтинг
// карточки, что верно для хаба и для проб.
/* Насколько репутация весома СЕГОДНЯ. Бросок один на игру и на всю комнату
   сразу — и это принципиально.

   Разброс на каждой команде я пробовал 25 августа: стало хуже, чем без него
   (доля вечеров «ты один» упала с 90% до 5-10%). Причина в том, что решение
   принимает не средний, а самый смелый: чтобы точка осталась пустой, обойти её
   должны ВСЕ сорок девять, и хватает одного, кому бросок выдал маленький страх.

   Один бросок на комнату этим не страдает: в этой игре репутация либо весит
   больше обычного, либо меньше, но одинаково для всех. Отсюда и склон, которого
   он просил, — «чем больше аура, тем реже к тебе падают»: у половины ауры
   тихими выходят те игры, где бросок лёг высоко, у полной — почти все. */
const CC_SPOT_FEAR_SWING=0;      // 0 — без броска; замер ниже, почему
function careerSpotFearOn(you){
  /* ОБЩАЯ КОМНАТА ГОНКИ: страха нет. Аура точек и известность читаются из СВОЕГО сейва, и у
     шести клиентов боты обходили шесть разных домов — раздача комнаты расходилась, как только
     у кого-то выросла аура (годовая проба 8.09: Evaluation 18.12, игра 3, у одного −76 бросков
     на высадке и дальше другой набор вопросов). Своя точка в гонке садится голосом «домой». */
  if(typeof ccRaceLock==='function' && ccRaceLock()){ CC_SPOT_FEAR_MAP=null; CC_SPOT_LOCK_ZONES=null; return; }
  /* И СОЛО ВДВОЁМ В КОМАНДЕ: соло-метка у каждого своя (четвёртая карта, careerSpotSets 'solo'), и боты общей сотни
     обходили у двоих разные точки — вечер расходился на первой же высадке (командный год 20.10: хиты Solo Series 17.01,
     «drop=101/728691 vs drop=101/109494»). Дуо-метка у команды одна, там страх остаётся. */
  if(typeof ccMpOn==='function' && ccMpOn() && squadSize===1){ CC_SPOT_FEAR_MAP=null; CC_SPOT_LOCK_ZONES=null; CC_BEEF_ZONES=null; CC_BEEF_SET=null; return; }
  /* Дом боятся за две вещи разом: за то, сколько ты его держал (аура), и за то,
     кто ты теперь (careerRenown — гранд-финал и слот на LAN). Оба слагаемых
     живут на одной шкале и вместе упираются в тот же потолок. */
  const renown=careerRenown();
  const mine=careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET));
  const zones=mine
    .map(x=>({zone:x.zone, fear:Math.min(CC_SPOT_AURA_MAX, (x.slot.aura||0)+renown)}))
    .filter(x=>x.fear>0);
  const swing=1 - CC_SPOT_FEAR_SWING + Math.random()*CC_SPOT_FEAR_SWING*2;
  CC_SPOT_FEAR_MAP = zones.length
    ? new Map(zones.map(x=>[x.zone, x.fear*swing])) : null;
  // Потолок — не цена, а замок: см. CC_SPOT_LOCK_ZONES. Считается по своей
  // ауре, без имени.
  const locked=mine.filter(x=>(x.slot.aura||0)>=CC_SPOT_AURA_MAX);
  CC_SPOT_LOCK_ZONES = locked.length ? new Set(locked.map(x=>x.zone)) : null;
  const pl=CAREER && CAREER.player;
  CC_SPOT_FEAR_POW = (you && you.pow) ||
    (pl ? (pl.ovrExact!=null ? pl.ovrExact : pl.ovr) : 0) || 0;
  /* И кого твоя точка, наоборот, ПРИТЯГИВАЕТ. Ставится отдельным набором, а не
     вместе со страхом: бояться начинают с первой ауры, а ссориться можно и на
     пустом доме — биф не про репутацию места, а про конкретного человека.
     Дома здесь все три, включая те, где ауры ещё нет. */
  /* Соперник по ссоре падает в один твой дом за игру, а не во все сразу. Тяга 6 при разбросе раздачи 1.15
     перебивает всё; на всех трёх домах он был на игроке в 100% игр против 13% без ссоры (career-beef-pull-probe.js).
     Команда высаживается в одной коробке, значит и охотится в одной, какую выбрать, решает игра. С тремя домами
     встреча примерно раз в три игры, с одним всегда.
     Сама тяга не ослаблена, страх её не перебивает. */
  const homes=careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET));
  CC_BEEF_ZONES = homes.length
    ? new Set([homes[Math.floor(Math.random()*homes.length)].zone]) : null;
  const hot=careerBeefHot();
  CC_BEEF_SET = hot.length ? new Set(hot.map(b=>hKey(b.h))) : null;
}
function careerSpotFearOff(){
  CC_SPOT_FEAR_MAP=null; CC_SPOT_FEAR_POW=0; CC_SPOT_LOCK_ZONES=null;
  CC_BEEF_ZONES=null; CC_BEEF_SET=null;
}
function dateKey(t){
  return t.getUTCFullYear()+'-'+String(t.getUTCMonth()+1).padStart(2,'0')+'-'+
         String(t.getUTCDate()).padStart(2,'0');
}

// Every tournament in the season, pinned to a day. Division 1 plays a different
// week from everybody else — two sessions and a final instead of one window — and
// it is the only division with a Performance Evaluation, so the same week fills
// with different squares depending on where you are standing.
// The cover a day wears in the calendar.
//
// The divisional cups were guessed at first and the guess was wrong. Epic's own
// event list settles it: Division 1 through 5 all carry the same picture, and it
// is the season's FNCS key art — the crest on ice — which is the same image the
// Majors carry. One season, one cover, and the division is a label on it rather
// than a different picture.
//
// So the cups take that art too, and cup, Major and Global Championship are told
// apart by the tone of the scrim over them instead of by different pictures.
// That is the honest split: the artwork is Epic's, the tint is this interface
// saying which kind of week it is.
//
// The Global Championship is the exception it should be. It has no 2026 cover in
// the project at all, and borrows the 2025 season-finale art rather than wearing
// the same picture as a Tuesday.
// The season's own key art, added for this: `fncs-2026.jpg` is the 2026 FNCS
// cover — crest, broken white plate, holographic chrome — which is the picture
// the divisional cups carry, and `fncs-2026-major1.jpg` is the same set with the
// MAJOR 1 SUMMIT lockup on it. The mode screen's older crops are left where they
// are; these two belong to the career.
const CAREER_EV_ART={
  cup:  'art/fncs-2026.jpg',
  final:'art/fncs-2026.jpg',
  eval: 'art/fncs-2026.jpg',
  major:'art/fncs-2026-major1.jpg',
  gc:   'art/mode-major3-2025.jpg',
  // The Reload Elite Series is not FNCS and does not wear its crest: it carries
  // the circuit's own tile art, the one the mode screen uses.
  reload: 'art/mode-ewc.jpg',
  // Open to everybody and not part of the divisional ladder, so it does not wear
  // the FNCS crest either.
  // The Victory Cup wore the Reload circuit's tile art, so a Duos Victory Cup
  // in January read as a Reload night. It is an open duos event and there is a
  // duos crop in the folder; the circuit keeps its own.
  victory: 'art/mode-duo.jpg',
  // The Solo Series is an open solo circuit, not FNCS — same call as the
  // Victory Cup, and the same crop until a solo one exists in the folder.
  solo: 'art/mode-duo.jpg',
  /* Церемония закрытия носит герб сезона — тот же ключевой арт, что стоит на
     полосе карьеры на главной и в шапке хаба. Год кончается тем же знаком,
     под которым он шёл. См. careerEvents и ccGalaDraw. */
  gala: 'art/fncs-2026.jpg'
};
/* Обложка по САМОМУ СОБЫТИЮ, а не по его виду, — там где вид врёт.

   Вид 'solo' носят два разных турнира: январская Solo Series, открытый соло-круг
   вне FNCS, и FNCS Solos 2026, который FNCS и есть. Одна обложка на оба была бы
   неправдой в любую сторону, поэтому у FNCS Solos своя, а январский круг
   остаётся на нейтральном кропе (см. комментарий у solo выше).

   art/fncs-solo.jpg собрана 2 сентября 2026 из официального арта Epic: у соло-
   этапов и постер, и фон — тот же FNCS 2026, отдельной обложки Epic не выпускает,
   поэтому на их фон положен заголовок в том же языке, что на их же обложке
   Reload Solo — герб сверху, мелкое FORTNITE, крупное FNCS SOLO, полоска в цветах
   события из imp_event.Colors. */
const CAREER_EV_ART_ID={
  // Мейджоры 2025-го — со своими постерами Epic (те же, что на плитках драфта); Лион — Major 3's.
  Major1_2025_PlayIn:'art/mode-major1-2025.jpg', Major1_2025_Group1:'art/mode-major1-2025.jpg', Major1_2025_Group2:'art/mode-major1-2025.jpg', Major1_2025_Group3:'art/mode-major1-2025.jpg', Major1_2025_LCQ:'art/mode-major1-2025.jpg', Major1_2025_LCLobby:'art/mode-major1-2025.jpg', Major1_2025_Final:'art/mode-major1-2025.jpg',
  Major2_2025_PlayIn:'art/mode-major2-2025.jpg', Major2_2025_Group1:'art/mode-major2-2025.jpg', Major2_2025_Group2:'art/mode-major2-2025.jpg', Major2_2025_Group3:'art/mode-major2-2025.jpg', Major2_2025_LCQ:'art/mode-major2-2025.jpg', Major2_2025_LCLobby:'art/mode-major2-2025.jpg', Major2_2025_Final:'art/mode-major2-2025.jpg',
  Major3_2025_PlayIn:'art/mode-major3-2025.jpg', Major3_2025_Group1:'art/mode-major3-2025.jpg', Major3_2025_Group2:'art/mode-major3-2025.jpg', Major3_2025_Group3:'art/mode-major3-2025.jpg', Major3_2025_LCQ:'art/mode-major3-2025.jpg', Major3_2025_LCLobby:'art/mode-major3-2025.jpg', Major3_2025_Final:'art/mode-major3-2025.jpg',
  GlobalChampionship2025:'art/mode-major3-2025.jpg',
  // 2024-й — своих постеров нет; дуо-обложка драфта и она же на Форт-Уэрт.
  GlobalChampionship2024:'art/map-f4.jpg',
  // 2023-й — острова своих финалов (Chapter 4): Мейджор n — остров e<n>, LCM и Копенгаген — e4.
  GlobalChampionship2023:'art/map-e4.jpg',
  Major1_2024_Q1R1:'art/map-f1.jpg', Major1_2024_Q1R2:'art/map-f1.jpg', Major1_2024_Q1R3:'art/map-f1.jpg', Major1_2024_Q2R1:'art/map-f1.jpg', Major1_2024_Q2R2:'art/map-f1.jpg', Major1_2024_Q2R3:'art/map-f1.jpg', Major1_2024_Semi1:'art/map-f1.jpg', Major1_2024_Semi2:'art/map-f1.jpg', Major1_2024_Semi3:'art/map-f1.jpg', Major1_2024_Final:'art/map-f1.jpg', Major2_2024_Q1R1:'art/map-f2.jpg', Major2_2024_Q1R2:'art/map-f2.jpg', Major2_2024_Q1R3:'art/map-f2.jpg', Major2_2024_Q2R1:'art/map-f2.jpg', Major2_2024_Q2R2:'art/map-f2.jpg', Major2_2024_Q2R3:'art/map-f2.jpg', Major2_2024_Semi1:'art/map-f2.jpg', Major2_2024_Semi2:'art/map-f2.jpg', Major2_2024_Semi3:'art/map-f2.jpg', Major2_2024_Final:'art/map-f2.jpg', Major3_2024_Q1R1:'art/map-f3.jpg', Major3_2024_Q1R2:'art/map-f3.jpg', Major3_2024_Q1R3:'art/map-f3.jpg', Major3_2024_Q2R1:'art/map-f3.jpg', Major3_2024_Q2R2:'art/map-f3.jpg', Major3_2024_Q2R3:'art/map-f3.jpg', Major3_2024_Semi1:'art/map-f3.jpg', Major3_2024_Semi2:'art/map-f3.jpg', Major3_2024_Semi3:'art/map-f3.jpg', Major3_2024_Final:'art/map-f3.jpg',
  Showdown4_2025_LCQ:'art/mode-trio.jpg', Showdown4_2025_Final:'art/mode-trio.jpg', Showdown5_2025_LCQ:'art/mode-trio.jpg', Showdown5_2025_Final:'art/mode-trio.jpg', Showdown6_2025_LCQ:'art/mode-trio.jpg', Showdown6_2025_Final:'art/mode-trio.jpg',
  FNCSSolos_Q1Round1:'art/fncs-solo.jpg', FNCSSolos_Q2Round1:'art/fncs-solo.jpg', FNCSSolos_Q1Round2:'art/fncs-solo.jpg', FNCSSolos_Q1Round3:'art/fncs-solo.jpg',
  FNCSSolos_FastTrack:'art/fncs-solo.jpg', FNCSSolos_Q2Round2:'art/fncs-solo.jpg',
  FNCSSolos_Q2Round3:'art/fncs-solo.jpg', FNCSSolos_Heats:'art/fncs-solo.jpg', FNCSSolos_Heats2:'art/fncs-solo.jpg',
  FNCSSolos_LCQRound1:'art/fncs-solo.jpg', FNCSSolos_LCQFinal:'art/fncs-solo.jpg',
  FNCSSolos_Final:'art/fncs-solo.jpg',
  FNCSSoloReload_Round2:'art/fncs-solo.jpg',
  FNCSSoloReload_Round3:'art/fncs-solo.jpg',
  FNCSSoloReload_Heats:'art/fncs-solo.jpg',
  FNCSSoloReload_LCQRound1:'art/fncs-solo.jpg',
  FNCSSoloReload_LCQFinal:'art/fncs-solo.jpg',
  FNCSSoloReload_Final:'art/fncs-solo.jpg',
  // Pro-Am играется на острове Reload — арт берём Reload'а, своего у нас нет.
  ProAm_Dallas:'art/mode-ewc.jpg',
  ProAm_SaoPaulo:'art/mode-ewc.jpg',
  ProAm_Paris:'art/mode-ewc.jpg',
  ProAm_Seoul:'art/mode-ewc.jpg',
  proam:'art/mode-ewc.jpg',
  nations:'art/mode-squad.jpg'
};
/* Капы — в своих постерах из игры: вкладка «Соревнования» показывала у каждого капа постер
   Epic (poster_front_image), архив Tracker (events/archived, EU, 2019–2026) хранит его у
   каждого события; файлы — cdn2.unrealengine.com, в art/cups. Ключ — id события Epic;
   Epic и сам переиспользовал постеры (у S19 Duos — трио-постер S18), это их выбор, не наш.
   Трио-кэшкапа 2019 (S10) в архиве нет, но на его странице Tracker висит плитка режима Epic (10BR CashCup ModeTile Trios) — она. */
const CC_CUP_POSTER={
  S10_CC_Trios:'cups/c10t',
  S15_CashCup:'cups/c15', S15_SoloCashCup:'cups/c15', S16_CashCup:'cups/c16t', S16_SoloCashCup:'cups/c16s',
  S17_CashCup:'cups/c17t', S17_SoloCashCup:'cups/c17s', S18_CashCup:'cups/c18t', S18_SoloCashCup:'cups/c18s',
  S19_DuosCashCup:'cups/c18t', S19_SoloCashCup:'cups/c17s', S20_DuosCashCup:'cups/c20d', S20_SoloCashCup:'cups/c20s',
  S21_DuosCashCup:'cups/c21d', S21_SoloCashCup:'cups/c21s', S23_SoloCashCup:'cups/c23s',
  S24_DuosCashCup:'cups/c24d', S24_SoloVictoryCup:'cups/c23s', S25_DuosCashCup:'cups/c25d', S25_SoloVictoryCashCup:'cups/c25s',
  S26_DuosCashCup:'cups/c25d', S26_SoloVictoryCashCup:'cups/c25s', S28_DuosCashCup:'cups/c25d', S28_SoloVictoryCup:'cups/c25s',
  S29_DuosCashCup:'cups/c25d', S29_SoloVictoryCup:'cups/c29s', S30_DuosCashCup:'cups/c25d', S30_SoloVictoryCup:'cups/c29s',
  S31_DuosCashCup:'cups/c25d', S31_SoloVictoryCup:'cups/c31s', S36_SquidGroundsCashCup:'cups/c36',
  S39_DuosVictoryCup:'cups/c38d', S39_SoloVictoryCup:'cups/c38s', S40_SoloVictoryCup:'cups/c38s', S41_SoloVictoryCup:'cups/c38s',
  S41_ReloadSoloVictoryCup:'cups/c41r', S43_SquadsVictoryCup:'cups/c43q', S43_TriosCashCup:'comp/fnce-33-30-tileview-cash-cups-03-800x800-800x800-7e4d95d3afe5',
  S22_DivisionalCups:'cups/d22', S23_DivisionalCups:'cups/d23', S33_FNCSDivisionalCup:'cups/d33', S34_FNCSDivisionalCup:'cups/d34',
  S36_FNCSDivisionalCup:'cups/d34', S39_FNCSDivisionalCup:'cups/d39', S40_FNCSDivisionalCup:'cups/d39', S41_FNCSDivisionalCup:'cups/d41',
  S42_FNCSDivisionalCup_Division1:'cups/d39'
};
/* CUP ROUNDS begin — tools/build-cup-rounds.js */
const CC_CUP_ROUNDS={"S11_TwitchRivalsCS":1,"S11_WinterRoyale_Mobile":1,"S11_WinterRoyale_Console":1,"S11_WinterRoyale_PC":1,"S11_WR_ScoringTest":1,"S11_TwitchTesting":1,"S11_FNCS_Finals":2,"S11_DreamhackWinter_BYOC":2,"S11_CC_Contenders":1,"S11_FNCS_Week3":2,"S11_PlatformCup_Mobile":1,"S11_FNCS_Week4":2,"S11_FNCS_Week1":2,"S11_FNF":1,"S11_FNCS_Week2":2,"S11_HypeNight":1,"S11_FNCS_Warmup":2,"S11_PlatformCup_Console":1,"S10_FNCS_Finals":2,"PrivateCompTest":2,"S11_PlatformCup_PC":1,"S10_FNCS_Week5":2,"S10_FNCS_Week4":2,"S10_CC_Contenders":1,"S10_CC_Champions":1,"S10_FNCS_Week3":2,"S10_FNCS_Week2":2,"ONSITE_WorldCup_Solos":1,"S10_FNCS_Week1":2,"S10_CC_Trios":1,"ONSITE_WorldCup_Duos":1,"ONSITE_WorldCup_ProAm":1,"ONSITE_Worldcup_Creative":2,"XboxCup_Solo1":1,"OnlineOpen_Week10":1,"CashCup_Trios2":2,"OnlineOpen_Week9":1,"CashCup_Trios1":1,"OnlineOpen_Week7":1,"OnlineOpen_Week6":1,"OnlineOpen_Week8":1,"OnlineOpen_Week5":1,"OnlineOpen_Week4":1,"JaymeeTesting_Solo":1,"OnlineOpen_Week3":1,"OnlineOpen_Week2":1,"WorldCupWarmup":1,"OnlineOpen_Week1":1,"LuxeCup":1,"BlackheartCup":1,"ScallywagCup":1,"GauntletTest_Duo_Finals":2,"GauntletTest_Solo_Finals":2,"GauntletTest_Solo":1,"ShareTheLove_Champion_Duo":2,"GauntletTest_Duo":2,"ShareTheLove_Prospect_Duo":1,"ShareTheLove_Champion_Solo":2,"ShareTheLove_Contender_Duo":1,"ShareTheLove_Open_Duo":1,"ShareTheLove_Contender_Solo":1,"ShareTheLove_Placement_Duo":2,"ArchitectPopUpSoloEU":1,"ShareTheLove_Placement_Solo":2,"ArchitectPopUpSquadEU":1,"ShareTheLove_Prospect_Solo":1,"ShareTheLove_Open_Solo":1,"TriosOneDayCup1EU":2,"ArchitectPopUpDuoEU":1,"S15_Dreamhack_December":2,"S14_EUEncore":2,"S15_BhangraBoogieCup":1,"S15_PSGenerationsCup":1,"S14_MarvelSuperCup":2,"S15_FrostyFrenzy":2,"S14_VenomCup":2,"S14_Dreamhack_November":2,"S14_BlackWidowCup":1,"S14_LachlanPickaxeFrenzy":1,"S14_GhostRiderCup":1,"S14_FNCS_Finals":2,"S14_Dreamhack_October":2,"S14_FNCS_Qualifier3":2,"S14_CC_Champions":1,"S14_FNCS_Qualifier2":2,"S14_WildWednesday":1,"S14_FNCS_Qualifier1":2,"S14_DaredevilCup":1,"S14_FNCS_Warmup":2,"S14_CC_Platform":1,"S14_Dreamhack_September":2,"S14_HypeNite":1,"S14_CC_Contenders":1,"S13_LlobetiTriosCup":2,"S14_SolidGoldTest":1,"S13":2,"S13_Dreamhack_August":2,"S14_Season4HypeCup":1,"S13_FNCS":2,"S13_FreeFortniteCup":1,"S13_RaiseTheCup":1,"S13_BlueFlatline_EUNAE_Contender":1,"S13_TwoPlayersOneConsole":1,"S13_CC_Champions":1,"S13_AquaNyhroxThrowbackCup":1,"S13_CC_Contenders":1,"S13_CC_Platform":1,"S13_DailyHypeCup":1,"S13_DailyTrios":1,"S13_BughaThrowbackCup":1,"S13_DoigCupTrios":2,"S13_GalaxyCupSolo":1,"S13_Dreamhack_July":2,"S13_MongraalSoloCup":2,"S13_LTMTests":1,"S13_MrSavageTriosCup":2,"S13_HypeNight":1,"S13_HypeNight_Plus":1,"S13_AmarTriosCup":2,"S13_JacobSoloCup":1,"S13_TelefonicaTest":1,"S12_DoigbyCup":1,"S12_CCV2_Platform":2,"S12_BenjyFishyCup_Round2":2,"S12_FNCS_Invitational":1,"S12_TestEvent_SBMM_Test":1,"S12_BenjyFishyCup_Round1":1,"S12_RegistrationTestEvent_Ewron":1,"S12_CCV2_Contenders":2,"S12_InvitedPerfTest":1,"S12_CC_TestFormat2":2,"S12_CC_TestFormat1":2,"S12_FNCS_Finals_Console":2,"S12_FNCS_Finals_PC":2,"S12_FNCS_Week4":2,"S12_PiazzDuos":1,"S12_FNCS_Week3":2,"S12_DailyDuos":1,"S12_OperationKnockout":1,"S12_HypeNight":1,"S12_CC_Platform":1,"S12_CC_Contenders":1,"S12_FNCS_Week2":2,"S12_FNCS_Week1":2,"S12_FNCS_Warmup":2,"S12":1,"S12_limitedTest":1,"S11_CelebrationCup":1,"SourDropper_LoveAndWar":1,"SourDropper_WeekendTournament_Day2":1,"SourDropper_WeekendTournament_Day1":1,"CelebrationCup_Test":1,"S18_GrandRoyale_VictoryPath":2,"S18_GrandRoyale_Finals":2,"S18_GrandRoyaleCommunityCup":1,"S18_ConsoleChampionsCup":2,"S18_CashCupExtraDH":2,"S18_GrandRoyale_Load":1,"S18_GrandRoyale_Reload":2,"S18_CashCup":1,"S18_TriosHypeCup":1,"S18_SoloCashCup":1,"S18_PlaystationCup":2,"S18_BlueCheese_Quick_Cup_Trios":1,"S18_FNCS_SemiFinals_Day2":2,"S18_DuosHypeCup":1,"S18_SoloTestEvent":2,"S18_FNCS_SemiFinals_Day1":2,"S18_FNCS_Finals":2,"S18_FNCS_Qualifier2":2,"S18_BlueCheese_Quick_Cup_Solo":1,"S18_FNCS_Qualifier1":2,"S18_Dreamhack_October":2,"S17_FNCS_Finals":2,"S18_BlueCheese":2,"S18_BlueCheese_Solo":2,"S18_PreseasonWarmup":2,"S18_FloorRestoresLTM":1,"S17_FNCS_RebootRound":1,"S17_GalaxyCup":1,"S17_FNCS_SemiFinals":2,"S17_FNCS_Qualifier3":2,"S17_Dreamhack_August":2,"S17_FNCS_Qualifier2":2,"S17_ZoneWarsLTM":1,"S17_JBalvinCup":1,"S17_SuperKnockBackLTM":1,"S17_WonderWomanCup":1,"S17_GamoraCup":1,"S17_CammyCup":1,"S17_SoloCashCup":1,"S17_FNCS_Qualifier1":2,"S17_CashCup":1,"S17_HypeCup":1,"S17_CashCupExtraDH":1,"S17_BlueCheese":2,"S17_ConsoleChampionsCup":2,"S17_OneShotLTM":1,"S17_PickaxeFrenzyLTM":1,"S17_FNCS_SoloFinals":1,"S17_FloorIsLavaSoloLTM":1,"S17_FNCS_SoloPlayIns":2,"S16_UEFA_Euro_Cup_2020":1,"S16_FNCS_RebootRound":1,"S16_FNCS_Finals":2,"S17_ThanosCup":1,"S16_FNCS_SemiFinals":2,"S16_Dreamhack_April":1,"S16_DeathstrokeCup":1,"S16_FNCS_Qualifier3":2,"S16_ConsoleChampionsCup":2,"S16_EliteScrims":1,"S16_TeenTitansCup":1,"S16_CashCup":1,"S16_OneShotLTM":1,"S16_CashCupExtraDH":1,"S16_OpenScrims":1,"S16_HypeCup":1,"S16_SoloCashCup":1,"S16_FNCS_Qualifier2":2,"S16_FNCS_Qualifier1":2,"S16_CloseEncountersLTM":1,"S16_NeymarJrCup":1,"S16_HighExplosivesLTM":1,"S16_AloyCup":1,"S16_FridayNiteBraggingRights":1,"S16_FloorIsLavaSoloLTM":1,"S16_SpringBreakoutCup":1,"S15_FNCS_GrandFinals":2,"S15_FNCS_RebootRound":1,"S15_FNCS_SemiFinals":2,"S15_TrinityCup":1,"S15_FNCS_Qualifier3":2,"S15_SwitchCup3":1,"S15_LazarAndFreshSuperKnockback":1,"S15_CyprusCup":1,"S15_FloorIsLavaLTM":1,"S15_SolidGoldLTM":1,"S15_FNCS_Qualifier2":2,"S15_CashCupTestWeek":1,"FreeForAllArenaTest_S16_Solo":2,"S15_FNCS_Qualifier1":2,"S15_FridayNiteBraggingRightsTestWeek":1,"S15_SoloCashCupTestWeek":1,"S15_RagsToRichesLTM":1,"S15_SoloCashCup":1,"S15_HeartsWildCup":1,"S15_HypeCup":1,"S15_FridayNiteBraggingRights":1,"S15_FlashCup":1,"S15_Dreamhack_January":2,"S15_CashCup":1,"S15_ASRomaCup":1,"S15_ACMilanCup":1,"S15_OneShotLTM":1,"S15_InterMilanCup":1,"S23_ZBMQuickCupFill":1,"S23_PlacementCup":1,"S15_FazeCityCup":1,"S23_Lettuce":1,"S22_PlaystationCupNov":1,"S15_PeleCup":1,"S15_GrefGSquads":1,"S22_ConsoleChampionsCup":2,"S22_Invitational":1,"S15_GrefGSolo":1,"S22_DivisionalCups_Elite_Finals":1,"S22_FNCSInvitationalCommunityCup":1,"S22_PoloStadiumCup":1,"S22_PlaystationCupOct":1,"S22_ZBMCashCup":1,"S22_LGSoloQuickTest_public":1,"S22_DivisionalCups_Challenger":1,"S22_ZBMQuickCup":1,"S22_DivisionalCups_Elite":1,"S22_PlacementCup":2,"S22_PlaystationCupSep":1,"S22_QueasyCup":2,"S22_DivisionalCups_Contender":1,"S22_SypherPKIconCup":1,"S22_Moneywars_Test1":1,"S21_LGSolosQuickCup_BR":1,"S21_LGSoloCashCup":2,"S21_LGSolosQuickCup_ME":1,"S21_LGTriosCashCup":2,"S21_PlaystationCupAug":1,"S21_LGSolosQuickCup":1,"S21_LGTriosQuickCup":1,"S21_LCTargetPracticeDuos":1,"S21_ConsoleChampionsCup":2,"S21_DreamerCup":1,"S21_LGSoloQuickCup":1,"S21_QuarterbackCup":1,"S21_ConsoleChampionsCupZBM":2,"S21_PgodCup":2,"S21_LCHotDropDuos":1,"S21_TournamentOfPower":1,"S21_FNCS_Finals":2,"S21_LCWildStormDuos":1,"S21_DuosHypeCup_Open":1,"S21_DuosHypeCup_Contender":1,"S21_LCNoSweatSquadsZBM":1,"S21_LCNoSweatDuos":1,"S21_LCNoSweatSolo":1,"S21_FNCS_SemiFinals":2,"S21_LCNoSweatTrios":1,"S21_PlaystationCupJuly":1,"S21_FNCS_Qualifier3":2,"S21_FNCS_Qualifier1":2,"S21_LCStartingLoadoutDuos":1,"S21_GalaxyCup":1,"S21_FNCS_Qualifier2":2,"S21_LCArchitectSolo":1,"S21_LCStartingLoadoutSolo":1,"S21_JewelRush":1,"S21_Whiplash_Test1":1,"S21_SoloCashCupConsole":2,"S21_SoloCashCup":2,"S21_DuosCashCup":2,"S21_SoloHypeCup_Open":1,"S21_SoloHypeCup_Contender":1,"S21_Moneywars_Test1":1,"S21_2v2_Test1":1,"S21_TriosCashCupZBM":2,"S21_TriosQuickCashCup":1,"S21_LCElimOnlyHighScoreZBMSquads":1,"S21_LCElimOnlyHighScoreDuos":1,"S21_PlaystationCupJune":2,"S21_DreamhackSummerZBM":2,"S21_DreamhackSummer":2,"S21_LCQuickCupTriosZBM":2,"S21_SommersetCup":1,"S21_LCQuickCup":2,"S20_ConsoleChampionsCup":2,"S20_LCElimOnlySolo":1,"S20_LCElimOnlyDuos":1,"S20_LCMicroSessionsTriosZBM":2,"S20_PlaystationCupMay":2,"S20_FNCS_Finals":2,"S21_SuperHypeCup":2,"S20_LCMicroSessionsDuos":2,"S20_FNCS_SemiFinals":2,"S20_LCStartingLoadoutDuos":1,"S20_FNCSCommunityCup":1,"S20_FNCS_Qualifier3":2,"S20_LCStartingLoadoutSolos":1,"S20_LCArchitectDuos":1,"s20_LCArchitectSolos":1,"S20_ObiWanCup":1,"S20_FNCS_Qualifier2":2,"S20_AliaACup":1,"S20_LCElegantWeaponsDuos":1,"S20_FNCS_Qualifier1":2,"S20_DuosCashCup":2,"s20_FridayNightZeroBuild":1,"S20_ChicaCup":1,"S20_TriosHypeCup_Champion":1,"S20_DuosHypeCup_Contender":2,"S20_TriosHypeCup_Contender":1,"S20_DuosHypeCup_Open":2,"s20_TriosHypeCup_Open":1,"S20_SoloHypeCup_Open":2,"S20_SoloCashCup":2,"S20_SoloHypeCup_Contender":2,"S20_AndroidStreetFighterCup":1,"S20_LCSuperBlitzDuos":1,"S20_LCNoBuildDuos":1,"S20_StreetFighterCup":1,"S20_LCElimOnlyHighScoreDuos":2,"S20_TwovTwoGlobalTest":1,"S20_PlaystationCupApril_Round1":1,"S20_LCElimOnlyHighScoreTrios":2,"S19_ConsoleChampionsCup":2,"S20_TwovTwo":1,"S20_ChloeKimCup":1,"S19_LCHighScore":1,"S19_LCBestOf":1,"S19_FNCS_Finals":2,"S19_FNCS_SemiFinals":2,"S19_PlaystationCupMarch":1,"S20_LCNoBuildSquads":1,"S19_FNCS_Qualifier2":2,"S19_ThriveCup":1,"S19_FNCSCommunityCup":1,"S19_FNCS_Qualifier1":2,"S19_SoloHypeCup_Open":2,"S19_SoloCashCup":2,"S19_PlaystationCup":2,"S19_SoloHypeCup_Contender":2,"S19_SilkSonicCup":1,"S19_TriosHypeCup_Champion":1,"S19_TriosHypeCup_Contender":1,"S19_DuosCashCup":2,"S19_DuosHypeCup_Contender":2,"S19_TriosHypeCup_Open":1,"S28_MixUpMondaysZB":1,"S19_DuosHypeCup_Open":2,"S28_MixUpMondaysBR":1,"S28_PerformanceEvaluation":2,"S19_AllValleyCup":1,"S28_ConsoleCashCups":2,"S28_DuosCashCup":2,"S28_ConsoleCashCupsZB":2,"S28_DuosZBVictoryCashCup":2,"S28_PlaystationCupDecember":1,"S27_SoloVictoryCashCup":2,"S28_SoloVictoryCashCup":2,"S28_PlaystationCupZBDecember":1,"S27_DuosZBVictoryCashCup":2,"S27_RankedCupZBPlatinumSquads":1,"S27_RankedCupPlatinumSquads":1,"S27_RankedCupDiamondSquads":1,"S27_RankedCupBronzeSquads":1,"S27_RankedCupGoldSquads":1,"S27_RankedCupSilverSquads":1,"S27_RankedCupZBBronzeSquads":1,"S27_RankedCupZBDiamondSquads":1,"S27_RankedCupZBGoldSquads":1,"S27_RankedCupZBSilverSquads":1,"S27_RankedCupDiamondDuos":1,"S27_RankedCupZBDiamondDuos":1,"S27_RankedCupZBPlatinumDuos":1,"S27_RankedCupPlatinumDuos":1,"S27_RankedCupBronzeDuos":1,"S27_RankedCupGoldDuos":1,"S27_RankedCupZBGoldDuos":1,"S27_RankedCupSilverDuos":1,"S27_RankedCupZBBronzeDuos":1,"S27_RankedCupZBSilverDuos":1,"S27_RankedCupBronzeSolo":1,"S27_RankedCupGoldSolo":1,"S27_RankedCupPlatinumSolo":1,"S27_RankedCupZBDiamondSolo":1,"S27_RankedCupZBBronzeSolo":1,"S27_RankedCupSilverSolo":1,"S27_RankedCupZBGoldSolo":1,"S27_RankedCupDiamondSolo":1,"S27_RankedCupZBPlatinumSolo":1,"S27_OGGrefg_Duos":1,"S27_RankedCupZBSilverSolo":1,"S26_ConsoleChampionsCupZB":2,"S27_OGGrefg_Squads":1,"S26_ConsoleChampionsCup":2,"S27_OGJacob_Duos":2,"S27_OGAmar_Duos":2,"S27_OGInoxtag_Duos":1,"S26_DuosCashCup":2,"S26_MixUpMondaysBR":1,"S26_DuosZBVictoryCashCup":2,"S26_MixUpMondaysZB":1,"S26_SoloVictoryCashCup":2,"S26_PlaystationCupSeptember":1,"S26_FNCSCommunityCup":1,"S26_PlaystationCupZBSeptember":1,"S25_ConsoleChampionsCup":2,"S25_FNCS_LastChanceMajor":1,"S26_PerfEvaluation":2,"S25_FNCS_Major3_GrandFinals":1,"S25_FNCS_Major3_Week3":1,"S25_FNCS_Major3_Week2":1,"S25_FNCS_Major3_Week1":1,"S25_FNCSCommunityCup":1,"S25_GalaxyCup4Android":1,"S25_GalaxyCup4":1,"S25_JJKCup":1,"S25_ZBDuosFillQuickCup":1,"S25_DuosFillQuickCup":1,"S25_DuosCashCup":2,"S25_SoloVictoryCashCup":2,"S25_DuosZBVictoryCashCup":2,"S25_PlaystationCupJune":1,"S25_PerfEvaluation":2,"S25_PlaystationCupZBJune":1,"S24_ConsoleChampionsCupMay":2,"S24_FNCS_Major2_GrandFinals":1,"S24_SoloVictoryCup":2,"S24_TriosZBVictoryCashCup":2,"S24_FNCS_Major2_SurgeWeek":1,"S24_FNCS_Major2_Week3":1,"S24_DuosFillQuickCup":1,"S24_FNCS_Major2_Week2":1,"S24_FNCS_CommunityCup":1,"S24_FNCS_Major2_Week1":1,"S24_DuosCashCup":2,"S24_PlaystationCupMar":1,"S24_MamaBenjyFishy":2,"S23_FNCS_Major1_GrandFinals":1,"S24_ConsoleChampionsCup":2,"S24_RenegadeRunnerCupBuild":1,"S24_RenegadeRunnerCupBuildZB":1,"S24_ZBTriosFillQuickCup":1,"S23_FNCS_Major1_SurgeWeek":1,"S23_FNCS_Major1_Week2":1,"S23_PlaystationCupFeb":1,"S23_FNCS_Major1_Week3":1,"S23_CreedCup":1,"S23_FNCS_CommunityCup":1,"S23_FNCS_Major1_Week1":1,"S23_SoloCashCup":2,"S23_SuperFlakesCup":1,"S23_DivisionalCups_Challenger":1,"S23_DivisionalCups_Elite_Finals":1,"S23_ZBMQuickCup":1,"S23_ThunderCup":2,"S23_ZBMCashCup":1,"S23_DuosFillQuickCup":1,"S23_DivisionalCups_Elite":1,"S23_DivisionalCups_Contender":1,"S23_LGTriosCashCup":2,"S23_LGSoloCashCup":2,"S23_PlaystationCupJan":1,"S33_SoloCashCup":2,"S23_LGTriosQuickCup":1,"S22_LGTriosQuickTest_public":1,"S23_thekidlaroi":1,"S23_LGSoloQuickCup":1,"S33_RankedCupEliteDuos":1,"S33_RankedCupBSGDuos":1,"S33_RankedCupPDDuos":1,"S33_OGCupZB":1,"S33_PerformanceEvaluation":2,"S33_RankedCupBSSolo":1,"S33_OGCup":1,"S33_RankedCupBSGSolo":1,"S33_FNCSDivisionalCup_Division1":1,"S33_RankedCupEliteSolo":1,"S33_RankedCupPDSolo":1,"S33_FNCSDivisionalCup_Division2":1,"S33_FNCSDivisonalCup_Division3":1,"S32_SoloVictoryCashCup":2,"S32_PerformanceEvaluation":2,"S33_PlaystationCup":1,"S33_FNCS_Trial":1,"S32_SoloZBVictoryCashCup":2,"S32_RankedCupEliteDuos":1,"S32_TriosCashCup":2,"S32_RankedCupZBPlatinumDuos":1,"S32_RankedCupZBBSGDuos":1,"S32_RankedCupPDDuos":1,"S32_RankedCupBSGSolo":1,"S32_RankedCupEliteSolo":1,"S32_RankedCupBSGDuos":1,"S32_TriosCashCup_ZB":2,"S32_RankedCupZBBSGSolo":1,"S32_RankedCupZBPlatinumSolo":1,"S32_RankedCupPDSolo":1,"S32_PlatformReloadDuosCashCupMobile":1,"S32_SquadsReloadCup":1,"S32_FNCSCommunityCups":1,"S31_TriosCashCup":2,"S32_PlatformReloadDuosCashCupConsole":1,"S32_PlatformReloadDuosCashCupPC":1,"S31_RankedCupBRBSGDuos":1,"S31_SquadsReloadCup":1,"S31_RankedCupBREliteDuos":1,"S31_SymbioteCup":1,"S31_RankedCupBRPDDuos":1,"S31_RankedCupZB_BSGDuos":1,"S31_SoloVictoryCashCup":2,"S31_RankedCupZB_PlatinumDuos":1,"S31_SoloZBVictoryCashCup":2,"S31_SquadsReloadVictoryCashCup":2,"BambiRaptor":1,"S31_PerformanceEvaluationReloadTest":1,"S31_InfluencerCup":2,"S31_PlatformReloadDuosCashCupMobile":2,"S31_PlatformReloadDuosCashCupConsole":2,"S31_PlatformReloadDuosCashCupPC":2,"S31_RubiusIconCup":1,"S31_RankedCupBSGDuos":1,"S31_DuosCashCupZB":2,"S31_RankedCupPDDuos":1,"S31_DuosCashCup":2,"S31_RankedCupZBBSGDuos":1,"S31_RankedCupEliteDuos":1,"S31_RankedCupZBPlatinumDuos":1,"S31_PerformanceEvaluation":2,"S31_PlaystationSypherPKCup":1,"S31_FNCSCommunityCups_KunoRenzo":1,"S30_Reload":2,"S31_FNCSCommunityCups_Siren":1,"S31_FNCSCommunityCups_Sparkplug":1,"S30_ReloadZB":2,"S30_d4vd_Cup":1,"S30_FNCS_Major3_GrandFinals":1,"S30_FNCS_Major3_SemiFinalLowerBracket":2,"S30_FNCS_Major3_SemiFinalUpperBracket":2,"S30_SoloVictoryCashCup":2,"S30_FNCSCommunityCups":1,"S30_SoloZBVictoryCashCup":2,"S31_FNCSCommunityCups_Stashd":1,"S30_RankedCupBSGDuos":1,"S30_RankedCupEliteDuos":1,"S30_ConsoleCashCups":2,"S30_RankedCupPDDuos":1,"S30_SquadsVictoryCashCup":2,"S31_FNCSCommunityCups_Kyra":1,"S30_RankedCupZBPlatinumDuos":1,"S30_RankedCupZBBSGDuos":1,"S30_OpenTriosCupBR":1,"S30_OpenTriosCupZB":1,"S30_RankedCupBSGSolo":1,"S30_RankedCupEliteSolo":1,"S30_RankedCupPDSolo":1,"S30_RankedCupZBBSGSolo":1,"S30_OpenDuosCupZB":1,"S30_DuosCashCupZB":2,"S30_RankedCupZBPlatinumSolo":1,"S30_OpenDuosCupBR":1,"S30_DuosCashCup":2,"S30_RankedCupBSGSquads":1,"S30_RankedCupEliteSquads":1,"S30_RankedCupZBPlatinumSquads":1,"S30_NickEh":1,"S30_RankedCupZBBSGSquads":1,"S30_RankedCupPDSquads":1,"S30_PlaystationCupJune":1,"S30_FNCS_Major3_Qualifier2":2,"S30_FNCS_Major3_Qualifier1":2,"S30_MetallicaCup":1,"S30_PerformanceEvaluation":2,"S29_FNCS_Major2_GrandFinals":1,"S29_FNCS_Major2_SemiFinalLowerBracket":2,"S29_FNCS_Major2_SemiFinalUpperBracket":2,"S30_PlaystationCupZBJune":1,"S29_RankedCupBronzeSquads":1,"S29_FNCSCommunityCups":1,"S29_RankedCupDiamondSquads":1,"S29_RankedCupPlatinumSquads":1,"S29_RankedCupGoldSquads":1,"S29_RankedCupSilverSquads":1,"S29_RankedCupEliteSquads":1,"S29_RankedCupZBBronzeSquads":1,"S29_RankedCupZBEliteSquads":1,"S29_RankedCupZBDiamondSquads":1,"S29_RankedCupZBSilverSquads":1,"S29_RankedCupZBPlatinumSquads":1,"S29_RankedCupBronzeDuos":1,"S29_RankedCupZBGoldSquads":1,"S29_RankedCupGoldDuos":1,"S29_RankedCupSilverDuos":1,"S29_RankedCupDiamondDuos":1,"S29_RankedCupPlatinumDuos":1,"S29_RankedCupZBDiamondDuos":1,"S29_RankedCupZBBronzeDuos":1,"S29_RankedCupEliteDuos":1,"S29_RankedCupZBEliteDuos":1,"S29_RankedCupZBGoldDuos":1,"S29_RankedCupBronzeSolo":1,"S29_RankedCupZBPlatinumDuos":1,"S29_RankedCupZBSilverDuos":1,"S29_RankedCupDiamondSolo":1,"S29_RankedCupGoldSolo":1,"S29_RankedCupEliteSolo":1,"S29_RankedCupPlatinumSolo":1,"S29_RankedCupZBEliteSolo":1,"S29_RankedCupZBBronzeSolo":1,"S29_RankedCupSilverSolo":1,"S29_RankedCupZBDiamondSolo":1,"S29_RankedCupZBGoldSolo":1,"S29_RankedCupZBPlatinumSolo":1,"S29_RankedCupZBSilverSolo":1,"S29_FNCS_Major2_Qualifier2":2,"S29_ConsoleCashCupsZB":2,"S29_ConsoleCashCups":2,"S29_FNCS_Major2_Qualifier1":2,"S29_MixUpMondaysZB":1,"S29_PerformanceEvaluation":2,"S29_MixUpMondaysBR":1,"S29_DuosZBVictoryCashCup":2,"S29_SoloVictoryCashCup":2,"S29_DuosCashCup":2,"S29_PlaystationCupMarch":1,"S28_FNCS_Major1_GrandFinals":1,"S29_PlaystationCupZBMarch":1,"S28_FNCS_Major1_SemiFinalUpperBracket":2,"S28_FNCS_Major1_SemiFinalLowerBracket":2,"S28_RankedCupBronzeSquads":1,"S28_FNCS_Major1_Qualifier2":2,"S28_FNCSCommunityCups":1,"S28_RankedCupGoldSquads":1,"S28_RankedCupPlatinumSquads":1,"S28_RankedCupDiamondSquads":1,"S28_RankedCupSilverSquads":1,"S28_RankedCupZBBronzeSquads":1,"S28_RankedCupZBDiamondSquads":1,"S28_RankedCupZBGoldSquads":1,"S28_RankedCupBronzeDuos":1,"S29_RiseofMidasCup":1,"S28_RankedCupZBSilverSquads":1,"S28_RankedCupZBPlatinumSquads":1,"S28_RankedCupGoldDuos":1,"S28_RankedCupSilverDuos":1,"S28_RankedCupPlatinumDuos":1,"S28_RankedCupZBPlatinumDuos":1,"S28_RankedCupZBBronzeDuos":1,"S28_RankedCupZBDiamondDuos":1,"S28_RankedCupZBGoldDuos":1,"S28_RankedCupDiamondDuos":1,"S28_RankedCupBronzeSolo":1,"S28_RankedCupZBSilverDuos":1,"S28_RankedCupSilverSolo":1,"S28_RankedCupGoldSolo":1,"S28_RankedCupZBBronzeSolo":1,"S28_RankedCupPlatinumSolo":1,"S28_RankedCupZBDiamondSolo":1,"S28_RankedCupDiamondSolo":1,"S28_RankedCupZBGoldSolo":1,"S28_RankedCupZBPlatinumSolo":1,"S39_PerformanceEvaluation":2,"S39_ReloadCashVictoryCup_Dec":2,"S28_RankedCupZBSilverSolo":1,"S28_FNCS_Major1_Qualifier1":2,"S39_NvidiaCup":1,"S38_PlayStationCupReload":2,"S38_SoloSeriesCup":1,"S38_SquadsVictoryCup":2,"S39_1MillionUnrealCup":1,"S39_SoloSeriesCup":1,"S38_RankedCupDuosZB":1,"S38_RankedCupDuosBR":1,"S38_OGCup_BR":1,"S38_OGCup":1,"S38_OGCup_ZB":1,"S38_DuosVictoryCup":2,"S39_BleachCup":1,"S38_BlitzMobileCup":2,"S38_ReloadQuickCup_Group3":2,"S38_ReloadQuickCup":2,"S38_RankedCupSolo":1,"S38_ReloadQuickCup_Group2":2,"S38_StrangerThingsMobileCup":1,"S38_PerformanceEvaluation":2,"S38_TouchOnlyMobileCup":2,"S38_RankedCupReloadDuos":1,"S37_DuosDivisionalCup_Division1":1,"S37_HauntedCupWednesday":1,"S37_EarlyAccessCup":2,"S37_HauntedCupJason":1,"S38_StrangerThingsCup":1,"S37_DuosDivisionalCup_Division2":1,"S37_DuosDivisionalCup_Division3":1,"S37_DuosDivisionalCup_Division4":1,"S37_ReloadQuickCup":2,"S37_SoloSeriesCup":1,"S37_ReloadQuickCup_Group2":2,"S37_DuosDivisionalCup_Division5":1,"S37_ReloadQuickCup_Group3":2,"S37_PerformanceEvaluationDuos":2,"S39_RankedCupReloadDuosDec":1,"S37_FrenchWeekly":1,"S37_DuosDivisionalCupTrial":1,"Dinosauron_Official":1,"S37_PlayStationCup":1,"S37_KaiCenatIconCup":1,"S37_MrSavageIconCup":1,"S37_OGCups_BR":1,"S37_BlitzMobileCupWeekly":1,"S37_ConsoleDuosCashCups":2,"S37_RankedCupReloadDuos":1,"S37_OGCups_ZB":1,"S37_PerformanceEvaluation":2,"S37_RankedCupDuos":1,"S37_FNCSDivisionalCup_Division1":1,"S37_SurfWitchBlitzMobileCup":1,"S37_RankedCupSolo":1,"S37_AxeOfChampsBlitzMobileCup":1,"S37_EliteZadieCup_Group3":2,"S37_EliteZadieCup_Group2":2,"S37_EliteZadieCup":2,"S37_BlitzCupOneSwing":1,"S37_BladeOfChampsCupGroup3":2,"S37_FNCSDivisionalCup_Division3":1,"S37_FNCSDivisionalCup_Division2":1,"S37_BladeOfChampsCupGroup2":2,"S37_AxeOfChampionsCup":1,"S37_SurfWitchCup":1,"S37_FNCSCommunityCups_Clix":1,"S37_BladeOfChampsCup":2,"S37_BlitzCups":1,"S37_BlitzMobileCup":1,"S37_BlitzCupsAllPlatforms":1,"S37_AceWildCardCup_Group3":2,"S37_FNCSCommunityCups_Bugha":1,"S37_ChampionCrystalCup":1,"S37_FNCSCommunityCups_Loserfruit":1,"S37_AceWildCardCup":2,"S37_FNCSCommunityCups_Lachlan":1,"S37_AceWildCardCup_Group2":2,"S36_FNCSMajor3_Final":1,"S36_FNCSMajor3_LastChanceQualifier":1,"S36_RangerCup_Pink":1,"S36_SquidGroundVictoryDuosCup":2,"S36_FNCSMajor3_GroupStage":1,"S37_ChampionPJCup":1,"S36_RangerCup_Red":1,"S36_PlayStationCup":1,"S36_FNCSMajor3_PlayInStage":1,"S36_OGCups_ZB":1,"S36_OGCups_BR":1,"S36_VictoryDuosCup":2,"S36_FantasticFourCups":1,"S36_FNCSCommunityCup":1,"S36_PerformanceEvaluation":2,"S36_RankedCupReloadDuos":1,"S36_RankedCupTrios":1,"S36_FNCSDivisionalCup_Division1":1,"S36_RankedCupSolo":1,"S36_FNCSDivisionalCup_Division3":1,"S36_FNCSDivisionalCup_Division2":1,"S35_VictoryDuosCup":2,"S35_OGCupZB":1,"S36_SquidGroundsCups":1,"S35_OGCup":1,"S35_RankedCupBSGDuos":1,"S35_PerformanceEvaluation":2,"S35_RankedCupPDDuos":1,"S35_RankedCupEliteDuos":1,"S35_RankedCupBSGSolo":1,"S35_FNSCShowdown":2,"S35_RankedCupEliteSolo":1,"S35_ReloadRankedCup_PD_Duos":1,"S35_ReloadRankedCup_BSG_Duos":1,"S35_RankedCupPDSolo":1,"S35_RankedCupBSGTrios":1,"S35_RankedCupPDTrios":1,"Acrocanthosaurus_Official":1,"S35_ReloadRankedCup_Elite_Duos":1,"S35_RankedCupEliteTrios":1,"S34_PerformanceEvaluationReloadAll":2,"S34_PlaystationCup":1,"S34_FNCSMajor2_Final":1,"S35_FNCSCommunityCups_Lachlan":1,"S35_FNCSCommunityCups_Loserfruit":1,"S35_FNCSCommunityCups_Clix":1,"S34_FNCSMajor2_LastChanceQualifier":1,"S34_FNCSMajor2_GroupStage":1,"S35_FNCSCommunityCups_Bugha":1,"S34_EliteZadieCup":1,"S34_FNCSMajor2_PlayInStage":1,"S34_ThunderboltsCup":1,"S34_SoloCashCup":2,"S34_RankedCupBSGDuos":1,"S34_RankedCupEliteDuos":1,"S34_FNCSCommunityCups":1,"S34_RankedCupBSGSolo":1,"S34_RankedCupPDDuos":1,"S34_FNCSDivisionalCup_Division1":2,"S34_RankedCupPDSolo":1,"S34_RankedCupEliteSolo":1,"S34_FNCSDivisionalCup_Division3":2,"S34_PerformanceEvaluationReload":2,"S34_FNCSDivisionalCup_Division2":2,"S34_PerformanceEvaluation":2,"S34_OGCupZB":1,"S33_FNCSMajor1_Final":1,"S33_FNCSMajor1_LastChanceQualifier":1,"S34_ClixIconCup":1,"S34_OGCup":1,"S34_ShoheiOhtaniCup":1,"S33_FNCSMajor1_GroupStage":1,"S42_ReloadReloadSoloVictoryCup":2,"S42_FNCSSolo_HeatsStage":1,"S42_FNCSSoloFastTracks":1,"S33_FNCSMajor1_PlayInStage":1,"S42_FNCSSolo_LastChanceQualifier":1,"S42_FNCSSoloQualifiers":2,"S42_PSNickEh30_ZB":1,"S33_OGCommunityCupZB":1,"S42_PSNickEh30":1,"S33_FNCSCommunityCups":1,"MannekenPis_Official":1,"S42_FNCSSolo_Final":1,"S34_LanternFestCup":1,"S42_MadisonBeerIconCup":1,"S42_MobileVictoryCup_ReloadminiV":2,"S33_OGCommunityCup":1,"S42_Persona5Cup_ZB":1,"S42_Persona5Cup":1,"S42_Persona5Cup_Mobile":1,"S42_SoloVictoryCup":2,"S42_MadisonBeerIconCup_ZB":1,"S42_ArenaPerfEval":1,"S42_MadisonBeerIconCup_Mobile":1,"S42_ChampionFocusFNCSCup_ZB":1,"S42_ChampionFocusFNCSCup":1,"S42_ChampionFocusFNCSMobileCup":1,"S42_CyperpranksCup":1,"S42_CyperpranksCup_ZB":1,"S42_CyperpranksCup_Mobile":1,"S42_KingdomHeartsCup":1,"S42_KingdomHeartsCup_ZB":1,"S42_KingdomHeartsCup_Mobile":1,"S39_RankedCupSoloDec":1,"S42_IronmouseIconCup":1,"S42_MobileSeriesCupSemiFinal":1,"S42_IronmouseIconCup_ZB":1,"S42_WeezyIconCup":1,"S42_MobileSeriesGroup2":1,"S42_WeezyIconCup_ZB":1,"S42_MobileSeriesGroup1":1,"S42_MegaManCup":1,"S42_RankedCupSoloReload":1,"S42_PerformanceEvaluation":2,"S42_RankedCupSoloReload_ZB":1,"S42_MegaManCup_Mobile":1,"S42_MegaManCup_ZB":1,"S42_TheHectorino_Mobile":1,"S42_ConsoleVCC_SolosZB":2,"S42_MobileSeriesLCQ":2,"S42_RankedCupDuos":1,"S42_ReloadCashCup_DuosZB":2,"S42_RankedCupSolo":1,"S42_RankedCupReloadDuos":1,"S42_RankedCupSolo_ZB":1,"S42_FNCSDivisionalCup_Division1":1,"S42_ArenaTestCup":1,"S42_FNCSDivisionalCup_Division5":1,"S42_FNCSDivisionalCup_Division3":1,"S42_FNCSDivisionalCup_Division2":1,"S42_FNCSDivisionalCup_Division4":1,"S42_ReloadDuosVictoryCup":2,"S42_CrashBandicootCup":1,"S42_CrashBandicootMobileCup":1,"S42_CrashBandicootCup_ZB":1,"S42_ShadowCup":1,"S42_ShadowCup_ZB":1,"S42_ShadowCup_Mobile":1,"S41_ReloadReloadSoloVictoryCup":2,"S41_FNCSLastChanceMajor":2,"S41_MobileVictoryCup_RES":2,"S41_MobileVictoryCup_ZB":2,"S41_DiamondTestCup":1,"S41_DiamondReloadTestCup":1,"S41_FNCSMajor2_Final":1,"S41_PSTypicalGamer_ZB":1,"S41_CashCup_DuosZB":2,"S41_FNCSMajor2_HeatsStage":1,"S41_FNCSMajor2_LastChanceQualifier":1,"S41_FNCSCommunityCup_Mobile":1,"S41_FNCSCommunityCup_ZB":1,"S41_FNCSCommunityCup":1,"S41_PSTypicalGamer":1,"S41_MobileVictoryCup_ZBReload":2,"S41_DavidBeckham_ZB":1,"S41_FNCSMajor2_PlayInStage":1,"S41_DavidBeckham":1,"S41_TheOdysseyCup":1,"S41_TheOdysseyCup_ZB":1,"S41_TheOdysseyCup_Mobile":1,"S41_ConsoleCC_DuosZB":2,"S41_MobileSeriesCupQual":1,"S41_ConsoleVCC_SolosZB":2,"S41_RankedCupDuos":1,"S41_MobileSeriesHeat4":1,"S41_MobileSeriesHeat3":1,"S41_MobileSeriesHeat2":1,"S41_MobileSeriesHeat1":1,"S41_PerformanceEvaluation":2,"S41_SoloVictoryCup":2,"S41_MobileSeriesOpen":2,"S41_PerformanceEvaluationReload":2,"S41_FNCSDivisionalCup_Division5":1,"S41_FNCSDivisionalCup_Division4":1,"S41_FNCSDivisionalCup_Division3":1,"S41_FNCSDivisionalCup_Division1":1,"S41_FNCSDivisionalCup_Division2":1,"S41_MobileTestCup":2,"S41_ReloadEliteSeries4Final":1,"S41_MobileVictoryCup_BR":2,"S41_ReloadEliteSeries4Heat4":1,"S41_ReloadEliteSeries4Heat3":1,"S41_MongraalIconCup":1,"S42_RankedCupDuos_ZB":1,"S42_RankedCupReloadDuos_ZB":1,"S41_ReloadEliteSeries4Heat2":1,"S41_ReloadEliteSeries4Heat1":1,"S41_SupergirlCup":1,"S41_SupergirlCup_ZB":1,"S41_SupergirlMobileCup":1,"S41_ReloadEliteSeries4PlayIn":1,"S41_MobileVictoryCup_ReloadminiV":2,"S41_ReloadEliteSeries4Opens":1,"S41_ViniJr":1,"S41_ViniJr_ZB":1,"S41_PSCupDaysOfPlay":1,"S41_ViniJr_Mobile":1,"Bratwurst_Official":1,"S41_PSCupDaysOfPlay_ZB":1,"S40_DuosReloadVictoryCup":2,"S40_TypicalGamerCup":1,"S40_MandalorianCup":1,"S40_MandalorianCup_ZB":1,"S40_ReloadEliteSeries3Final":1,"S40_MandalorianMobileCup":1,"S40_CashCup_TriosZB":2,"S40_ReloadEliteSeries3Heat4":1,"S40_ReloadEliteSeries3Heat3":1,"S40_MobileSeriesMay":2,"S40_ReloadEliteSeries3Heat2":1,"S40_ReloadEliteSeries3PlayIn":1,"S40_ReloadEliteSeries3Heat1":1,"S40_BakMobileCup":1,"S40_ReloadEliteSeries3Opens":1,"S40_TheDonatoMobileCup":1,"S40_PlayStationCupClixZB":1,"S40_RankedCupDuos":1,"S40_MobileSeriesCupQual":1,"S40_PlayStationCupClix":1,"S40_MobileSeriesApr":2,"S40_PerformanceEvaluationReload":2,"S40_FNCSMajor1_SecondChance":1,"S40_FNCSMajor1_Final":1,"S41_RankedCupSoloReload":1,"S40_ConsoleCC_TriosZB":2,"S40_FNCSMajor1_LastChanceQualifier":1,"S40_EliteStrongholdTestCups":1,"S40_FNCSMajor1_HeatsStage":1,"S40_EliteStrongholdEA":1,"S40_TripleThreatCup":1,"S40_TripleThreatMobileCup":1,"S40_ChampionKorFNCSCup":1,"S40_ChampionKorFNCSCupMobile":1,"S40_ShowdownSeries_EmperorZurgCup":1,"S40_ShowdownSeries_BuzzLightyearCup":1,"S40_SpidergamerCupMobile":1,"S40_FNCSMajor1_PlayInStage":1,"S40_ShowdownSeries_BuffPerryCup":1,"S40_ShowdownSeries_DrDoofenshmirtzCup":1,"S40_PerformanceEvaluation":2,"S40_FNCSDivisionalCup_Division1":1,"S40_FNCSDivisionalCup_Division5":1,"S40_FNCSDivisionalCup_Division4":1,"S40_FNCSDivisionalCup_Division3":1,"S40_FNCSDivisionalCup_Division2":1,"S40_RankedCupDuosZB":1,"S40_ConsoleVCC_SolosZB":2,"S41_RankedCupReloadDuos":1,"S40_RankedCupReloadDuos":1,"S41_RankedCupDuosZB":1,"S40_SoloVictoryCup":2,"S40_MobileSeriesMar":1,"S40_PlayStationCupMrSavage_Final":1,"S40_ShowdownSeries_DaffyCup":1,"S40_PlayStationCupMrSavageZB":1,"S40_PlayStationCupMrSavage_Qualifier":1,"S40_ShowdownSeries_LolaBunnyCup":1,"S40_DuckythegamerCupMobile":1,"S41_RankedCupSolo":1,"S39_SoloVictoryCup":2,"S40_ShowdownSeries_JonSnow":1,"S40_ShowdownSeries_NightKing":1,"S39_MobileSeriesCupMarQual":1,"S39_LanternFestCupMobile":1,"S39_FNCSDivisionalCup_Division1":1,"S39_ReloadEliteSeries2Final":1,"S39_LanternFestCup":1,"S39_FNCSDivisionalCup_Division5":1,"S39_FNCSDivisionalCup_Division4":1,"S39_PickleRickCup":1,"S39_FNCSDivisionalCup_Division3":1,"S39_ReloadEliteSeries2Heat4":1,"S39_FNCSDivisionalCup_Division2":1,"S39_MobileSeriesMar":2,"S39_ReloadEliteSeries2Heat1":1,"S39_MobileTestCup":2,"S39_ReloadEliteSeries2Heat2":1,"S39_ReloadEliteSeries2Heat3":1,"S39_MobileSeriesCupFebQual":1,"S39_ReloadEliteSeries1Final":1,"S39_ReloadEliteSeries2PlayIn":2,"S39_ReloadEliteSeries1Heat4":1,"S39_SoloLevelingMobileCup":1,"S39_ReloadEliteSeries2Opens":1,"S39_ReloadEliteSeries1Heat2":1,"S39_ReloadEliteSeries1Heat3":1,"S39_ReloadEliteSeries1Heat1":1,"S39_RankedCupSoloJan":1,"S39_KPDHCup":1,"S39_PlayStationCupZB":1,"S39_MobileSeriesFeb":2,"S39_SoloLevelingCup":1,"S39_DuosConsoleVictoryCupZB_Jan":2,"S39_PlayStationCup":1,"S39_ReloadEliteSeries1PlayIn":2,"S39_SoloSeriesCupFinal":1,"S39_FNCSDivisionalCupTrial":1,"S39_MobileSeriesCupJanQual":1,"S39_ReloadCashVictoryCup_Jan":2,"S39_DuosVictoryCup":2,"S39_SoloSeriesCupHeats":2,"S39_ReloadEliteSeries1Opens":1,"S39_MobileSeriesJan":2,"S39_KizunaAICupMobile":1,"S39_ReloadEliteSeries1OpenTEST":1,"S39_KizunaAICup":1,"S40_RankedCupSolo":1,"S39_RankedCupDuosBR":1,"S39_RankedCupReloadDuosJan":1,"S39_RankedCupDuosZBJan":1};
/* CUP ROUNDS end */
/* Раундов у капа за вечер — по окнам Epic (его вопрос 28.09: «два ли раунда в соло кэшкапах
   2020… и в дейли капах вроде не два было»). Замер: Solo Cash Cup 2019–20, Daily Duos/Trios,
   капы 2021 — одно окно в день; Victory Cup 2023+ и Cash Cup V2 (весна 2020) — Round 1 и 2.
   null — события нет в выгрузке (ЛАН, Кубок наций…), вечер идёт как шёл. */
function ccCupRounds(ev){
  if(!ev || typeof CC_CUP_ROUNDS==='undefined') return null;
  const id=String(ev.id||'');
  if(!id) return null;
  let r=null;
  Object.keys(CC_CUP_ROUNDS).forEach(k=>{ if(k===id || k.indexOf(id+'_')===0) r=Math.max(r||0, CC_CUP_ROUNDS[k]); });
  return r;
}
/* CUP SCORING begin — tools/build-cup-scoring.js */
const CC_SCORE_R=[[[[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1]],1],[[],[]],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],4],[[[1,16],[2,6],[3,6],[4,6],[5,6],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3],[18,3],[19,3],[20,3],[21,3],[22,3],[23,3],[24,3],[25,3]],6],[[[1,3],[5,2],[15,2],[25,3]],1],[[[1,944],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],4],[[[1,3],[2,3],[4,3],[8,3]],1],[[[1,3],[2,3],[4,3],[8,3],[12,3]],1],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],4],[[[1,3],[3,2],[7,2],[12,3]],1],[[[1,3],[5,2],[10,2],[15,3]],1],[[[0,20],[1,15],[3,10],[7,10]],0],[[[1,3],[2,3],[4,3],[6,3],[12,3]],1],[[[1,10],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],5],[[[1,3],[2,3],[4,3],[6,3],[8,3]],1],[[[1,15]],1],[[[1,2],[3,2],[6,2],[10,2],[15,2],[21,2],[28,1]],1],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],2],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],4],[[[1,7],[2,4],[3,3],[4,2],[5,3],[6,2],[7,2],[8,2],[9,2],[10,4],[15,3],[20,3],[30,2],[40,2]],4],[[[1,7],[2,4],[3,3],[4,2],[5,3],[6,2],[7,2],[8,2],[9,2],[10,4],[15,3],[20,3],[30,2],[40,2]],2],[[[1,7],[2,4],[3,3],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,3],[15,2],[20,2],[30,2],[40,1],[50,1],[75,1]],4],[[[1,7],[3,4],[6,2],[10,1],[15,1],[21,1],[28,1]],1],[[[1,7],[2,4],[3,3],[4,2],[5,1],[6,1],[7,1],[8,1],[9,1],[10,3],[15,2],[20,2],[30,2],[40,1],[50,1],[75,1]],4],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],3],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],4],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1]],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1]],3],[[[1,20]],0],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1]],2],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,3],[2,2],[3,1],[4,1],[5,1],[6,1],[8,1],[10,1],[13,1],[17,1],[25,1]],1],[[[1,3],[2,1],[3,1],[5,1],[10,1],[15,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,3],[9,3],[12,2],[15,2],[18,2],[21,2],[24,1],[27,1],[30,1]],1],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],5],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],5],[[[0,20]],0],[[[1,10]],1],[[[1,3],[10,3],[20,3],[30,3],[40,3],[50,3],[60,3],[70,3],[80,3],[90,3]],2],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],4],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1]],2],[[[1,6],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[11,2],[14,2],[17,2],[20,2]],1],[[[1,15],[2,5],[4,2],[8,2],[16,1]],0],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],5],[[[1,5],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],1],[[[1,100]],0],[[[1,6],[2,3],[3,3],[4,3],[5,3],[8,3],[11,3],[14,2],[17,2],[20,2],[23,2],[26,1],[29,1],[30,1]],1],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,1],[45,1]],5],[[[1,1],[3,1],[5,1],[7,1],[9,1],[12,1],[15,1],[25,1],[35,1],[50,1]],1],[[[1,5],[2,2],[3,3],[5,2],[10,1],[15,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,3],[5,2],[15,2],[25,2],[100,1]],1],[[[1,5],[2,2],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],1],[[[1,6],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[29,3],[34,3],[39,1],[44,1],[50,1]],1],[[[1,5],[2,5],[3,6],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],2],[[[1,10]],0],[[[1,4],[2,3],[3,2],[4,1],[5,1],[10,2],[15,2],[20,2],[25,1],[35,1]],1],[[[1,5],[2,5],[3,5],[4,5],[5,5],[10,3],[20,2]],2],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1]],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1]],2],[[[1,4],[2,3],[3,3],[4,1],[5,1],[10,1],[15,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,3],[5,2],[15,2],[25,2],[50,1]],1],[[[1,5],[2,2],[3,3],[5,2],[10,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,6],[3,3],[6,2],[10,2],[20,2],[33,1]],1],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,3]],6],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,2],[30,1],[35,1],[40,1],[50,1],[75,1]],1],[[[1,4],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,3],[24,5]],2],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],4],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],6],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],0],[[[1,6],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[29,1],[34,1],[39,1],[44,1],[50,1]],1],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],3],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,2],[30,1],[35,1],[40,1],[50,1],[75,1]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,2],[30,1],[35,1],[40,1],[50,1]],1],[[[1,6],[16,1]],1],[[[1,5],[2,5],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],1],[[[1,3],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,2],[12,2]],0],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1]],3],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1]],4],[[[1,8],[2,4],[3,4],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,6],[24,10]],4],[[[1,1000],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,3],[24,5]],1],[[[1,3],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[25,1]],1],[[[1,4],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,1]],3],[[[1,1000],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,1]],3],[[],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[20,1]],1],[[[1,3],[2,2],[3,2],[4,1],[5,12],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[25,1]],3],[[[1,3],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,4]],2],[[[1,1000],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,4]],2],[[[1,4],[2,1]],0],[[[1,25]],1],[[[1,3],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[24,1],[25,1],[30,1],[35,4]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],1],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,1],[30,1],[35,1],[40,1],[50,1],[75,1]],1],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,1],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],1],[[[1,1000],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],4],[[[1,1]],0],[[[1,5],[2,2],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[16,1],[20,2],[25,1],[30,1],[35,1]],1],[[[1,5],[2,2],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[16,1],[20,2],[25,1],[30,1],[35,1]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,1],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,1],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,3],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[25,1]],1],[[[1,9],[2,5],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[25,1]],1],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[25,1]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,4],[30,1],[35,1],[40,1],[50,1],[75,1]],1],[[],5],[[[1,65]],0],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2],[30,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[60,2],[75,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,4],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[75,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],0],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],1],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],1],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[75,2]],1],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[75,2]],4],[[[1,5],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1]],[[4,1],[8,1],[12,1]]],[[[1,5],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1]],1],[[[1,10],[2,4],[3,4],[4,4],[5,4],[6,4],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,4]],4],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],2],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],3],[[[1,946],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],3],[[[1,1000]],0],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,1],[75,3]],1],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,1],[75,3]],4],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,1],[75,3]],2],[[[10,50]],1],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],3],[[[1,7],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],0],[[[1,6],[2,4],[3,3],[4,2],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1]],1],[[[1,10],[2,5],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3]],1],[[[1,3],[2,2],[3,2],[4,2],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],1],[[[1,10],[2,8],[3,6],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4]],2],[[[1,10],[2,8],[3,6],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4]],3],[[[1,10],[2,5],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3]],3],[[[1,10],[2,5],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3]],2],[[[1,947],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,3],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],1],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],1],[[[1,944],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],3],[[[1,944],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],0],[[[1,3],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,3],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1]],1],[[[1,10],[2,8],[3,6],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4]],1],[[[1,6],[2,4],[3,4],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,2],[12,2],[13,2],[14,2],[15,2],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1]],2],[[[1,7],[2,5],[3,5],[4,4],[5,4],[6,3],[7,3],[8,3],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2]],1],[[[1,10],[2,6],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,2],[13,2],[14,2],[15,2]],0],[[[1,6],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4]],1],[[[1,7],[2,5],[3,5],[4,4],[5,4],[6,3],[7,3],[8,3],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2]],1],[[[0,10]],0],[[[1,4],[2,3],[3,3],[5,3],[10,2],[15,2],[20,2],[25,2],[30,2]],2]];
const CC_CUP_SCORE={"Acrocanthosaurus_Official":[0,-1,0,0],"ArchitectPopUpDuoEU":[1,-1,30,0],"ArchitectPopUpSoloEU":[1,-1,30,0],"ArchitectPopUpSquadEU":[1,-1,30,0],"BambiRaptor":[2,-1,0,0],"BlackheartCup":[4,-1,10,0],"Bratwurst_Official":[2,-1,0,0],"CashCup_Trios1":[6,-1,10,0],"CashCup_Trios2":[7,-1,10,0],"Dinosauron_Official":[8,-1,0,0],"LuxeCup":[9,-1,10,0],"MannekenPis_Official":[2,-1,0,0],"ONSITE_WorldCup_Duos":[10,10,0,0],"ONSITE_WorldCup_ProAm":[10,10,0,0],"ONSITE_WorldCup_Solos":[4,4,0,0],"ONSITE_Worldcup_Creative":[11,11,0,0],"OnlineOpen_Week10":[10,-1,10,0],"OnlineOpen_Week1":[4,-1,10,0],"OnlineOpen_Week2":[10,-1,10,0],"OnlineOpen_Week3":[4,-1,10,0],"OnlineOpen_Week4":[10,-1,10,0],"OnlineOpen_Week5":[4,-1,10,0],"OnlineOpen_Week6":[10,-1,10,0],"OnlineOpen_Week7":[4,-1,10,0],"OnlineOpen_Week8":[10,-1,10,0],"OnlineOpen_Week9":[4,-1,10,0],"S10_CC_Champions":[4,-1,15,0],"S10_CC_Contenders":[4,-1,15,0],"S10_CC_Trios":[12,-1,15,0],"S10_FNCS_Finals":[12,-1,6,0],"S10_FNCS_Week1":[12,-1,10,0],"S10_FNCS_Week2":[12,-1,10,0],"S10_FNCS_Week3":[12,-1,10,0],"S10_FNCS_Week4":[12,-1,10,0],"S10_FNCS_Week5":[12,-1,10,0],"S11_CC_Contenders":[4,-1,10,0],"S11_CelebrationCup":[4,-1,10,0],"S11_DreamhackWinter_BYOC":[13,-1,10,0],"S11_FNCS_Finals":[14,-1,6,0],"S11_FNCS_Warmup":[14,-1,10,0],"S11_FNCS_Week1":[14,-1,10,0],"S11_FNCS_Week2":[14,-1,10,0],"S11_FNCS_Week3":[14,-1,10,0],"S11_FNCS_Week4":[14,-1,10,0],"S11_FNF":[12,-1,10,0],"S11_HypeNight":[4,-1,10,0],"S11_PlatformCup_Console":[4,-1,10,0],"S11_PlatformCup_Mobile":[4,-1,10,0],"S11_PlatformCup_PC":[4,-1,10,0],"S11_WinterRoyale_Console":[15,-1,15,0],"S11_WinterRoyale_Mobile":[15,-1,15,0],"S11_WinterRoyale_PC":[15,-1,15,0],"S12_BenjyFishyCup_Round1":[17,-1,10,0],"S12_BenjyFishyCup_Round2":[18,18,0,10],"S12_CCV2_Contenders":[19,19,0,10],"S12_CCV2_Platform":[21,21,0,6],"S12_CC_Contenders":[10,-1,10,0],"S12_CC_Platform":[4,-1,10,0],"S12_DailyDuos":[22,-1,10,0],"S12_DoigbyCup":[10,-1,4,0],"S12_FNCS_Finals_Console":[10,-1,6,0],"S12_FNCS_Finals_PC":[10,-1,6,0],"S12_FNCS_Invitational":[23,-1,6,0],"S12_FNCS_Warmup":[10,-1,10,0],"S12_FNCS_Week1":[10,-1,10,0],"S12_FNCS_Week2":[10,-1,10,0],"S12_FNCS_Week3":[10,-1,10,0],"S12_FNCS_Week4":[10,-1,10,0],"S12_HypeNight":[4,-1,10,0],"S12_PiazzDuos":[22,-1,10,0],"S13_AmarTriosCup":[24,-1,10,0],"S13_AquaNyhroxThrowbackCup":[26,-1,12,0],"S13_BlueFlatline_EUNAE_Contender":[28,-1,1,0],"S13_BughaThrowbackCup":[29,-1,12,0],"S13_CC_Champions":[31,-1,10,0],"S13_CC_Contenders":[31,-1,10,0],"S13_CC_Platform":[32,-1,10,0],"S13_DailyHypeCup":[32,-1,10,0],"S13_DailyTrios":[33,-1,10,0],"S13_DoigCupTrios":[34,-1,5,0],"S13_Dreamhack_August":[35,35,10,6],"S13_Dreamhack_July":[35,35,10,8],"S13":[36,-1,20,0],"S13_FNCS":[32,32,7,7],"S13_FreeFortniteCup":[37,-1,12,0],"S13_GalaxyCupSolo":[4,-1,10,0],"S13_HypeNight":[32,-1,10,0],"S13_HypeNight_Plus":[32,-1,10,0],"S13_JacobSoloCup":[38,-1,6,0],"S13_LlobetiTriosCup":[24,-1,10,0],"S13_MongraalSoloCup":[39,-1,10,0],"S13_MrSavageTriosCup":[24,-1,10,0],"S13_RaiseTheCup":[41,-1,10,0],"S13_TwoPlayersOneConsole":[42,-1,10,0],"S14_BlackWidowCup":[43,-1,10,0],"S14_CC_Champions":[31,-1,10,0],"S14_CC_Contenders":[31,-1,10,0],"S14_CC_Platform":[32,-1,10,0],"S14_DaredevilCup":[43,-1,10,0],"S14_Dreamhack_November":[44,44,10,6],"S14_Dreamhack_October":[35,35,10,6],"S14_Dreamhack_September":[35,19,10,6],"S14_EUEncore":[25,-1,10,0],"S14_FNCS_Finals":[45,-1,6,0],"S14_FNCS_Qualifier1":[45,-1,10,0],"S14_FNCS_Qualifier2":[45,-1,10,0],"S14_FNCS_Qualifier3":[45,-1,10,0],"S14_FNCS_Warmup":[45,-1,10,0],"S14_GhostRiderCup":[43,-1,10,0],"S14_HypeNite":[47,-1,10,0],"S14_LachlanPickaxeFrenzy":[24,-1,10,0],"S14_MarvelSuperCup":[48,-1,10,0],"S14_Season4HypeCup":[47,-1,10,0],"S14_VenomCup":[43,-1,10,0],"S14_WildWednesday":[49,-1,10,0],"S15_ACMilanCup":[50,-1,7,0],"S15_ASRomaCup":[50,-1,7,0],"S15_BhangraBoogieCup":[51,-1,10,0],"S15_CashCup":[52,-1,10,0],"S15_CyprusCup":[53,-1,10,0],"S15_Dreamhack_December":[44,44,10,6],"S15_Dreamhack_January":[44,44,10,8],"S15_FNCS_GrandFinals":[54,54,6,6],"S15_FNCS_Qualifier1":[45,-1,10,0],"S15_FNCS_Qualifier2":[45,-1,10,0],"S15_FNCS_Qualifier3":[45,-1,10,0],"S15_FNCS_RebootRound":[55,-1,1,0],"S15_FNCS_SemiFinals":[54,-1,6,0],"S15_FazeCityCup":[50,-1,7,0],"S15_FlashCup":[53,-1,10,0],"S15_FloorIsLavaLTM":[56,-1,10,0],"S15_FridayNiteBraggingRights":[45,-1,10,0],"S15_FrostyFrenzy":[45,57,6,10],"S15_GrefGSolo":[58,-1,12,0],"S15_GrefGSquads":[59,-1,12,0],"S15_HeartsWildCup":[53,-1,10,0],"S15_HypeCup":[52,-1,10,0],"S15_InterMilanCup":[50,-1,7,0],"S15_LazarAndFreshSuperKnockback":[60,-1,10,0],"S15_OneShotLTM":[61,-1,10,0],"S15_PSGenerationsCup":[62,-1,10,0],"S15_PeleCup":[50,-1,10,0],"S15_RagsToRichesLTM":[61,-1,10,0],"S15_SolidGoldLTM":[61,-1,10,0],"S15_SoloCashCup":[61,-1,10,0],"S15_SwitchCup3":[63,-1,10,0],"S15_TrinityCup":[64,-1,10,0],"S16_AloyCup":[60,-1,10,0],"S16_CashCupExtraDH":[65,-1,10,0],"S16_CashCup":[52,-1,10,0],"S16_CloseEncountersLTM":[66,-1,10,0],"S16_ConsoleChampionsCup":[45,-1,10,0],"S16_DeathstrokeCup":[66,-1,10,0],"S16_Dreamhack_April":[68,69,10,10],"S16_EliteScrims":[70,-1,6,0],"S16_FNCS_Finals":[67,67,6,6],"S16_FNCS_Qualifier1":[45,-1,10,0],"S16_FNCS_Qualifier2":[45,-1,10,0],"S16_FNCS_Qualifier3":[45,-1,10,0],"S16_FNCS_RebootRound":[55,-1,3,0],"S16_FNCS_SemiFinals":[67,-1,6,0],"S16_FloorIsLavaSoloLTM":[66,-1,10,0],"S16_FridayNiteBraggingRights":[45,-1,10,0],"S16_HighExplosivesLTM":[66,-1,10,0],"S16_HypeCup":[52,-1,10,0],"S16_NeymarJrCup":[66,-1,10,0],"S16_OneShotLTM":[66,-1,10,0],"S16_OpenScrims":[70,-1,6,0],"S16_SoloCashCup":[66,-1,10,0],"S16_SpringBreakoutCup":[53,-1,10,0],"S16_TeenTitansCup":[71,-1,10,0],"S16_UEFA_Euro_Cup_2020":[17,-1,10,0],"S17_BlueCheese":[24,-1,10,0],"S17_CammyCup":[53,-1,10,0],"S17_CashCupExtraDH":[65,-1,10,0],"S17_CashCup":[45,-1,10,0],"S17_ConsoleChampionsCup":[45,-1,10,0],"S17_Dreamhack_August":[73,68,10,10],"S17_FNCS_Finals":[67,67,6,8],"S17_FNCS_Qualifier1":[45,-1,10,0],"S17_FNCS_Qualifier2":[45,-1,10,0],"S17_FNCS_Qualifier3":[45,-1,10,0],"S17_FNCS_RebootRound":[55,-1,4,0],"S17_FNCS_SemiFinals":[67,-1,6,0],"S17_FNCS_SoloFinals":[74,-1,6,0],"S17_FNCS_SoloPlayIns":[66,-1,10,0],"S17_FloorIsLavaSoloLTM":[75,-1,10,0],"S17_GalaxyCup":[76,-1,25,0],"S17_GamoraCup":[53,-1,10,0],"S17_HypeCup":[52,-1,10,0],"S17_JBalvinCup":[53,-1,10,0],"S17_OneShotLTM":[66,-1,10,0],"S17_PickaxeFrenzyLTM":[77,-1,10,0],"S17_SoloCashCup":[66,-1,10,0],"S17_SuperKnockBackLTM":[66,-1,10,0],"S17_ThanosCup":[53,-1,10,0],"S17_WonderWomanCup":[53,-1,10,0],"S17_ZoneWarsLTM":[78,-1,10,0],"S18_BlueCheese":[24,-1,12,0],"S18_BlueCheese_Quick_Cup_Solo":[79,-1,12,0],"S18_BlueCheese_Quick_Cup_Trios":[24,-1,12,0],"S18_BlueCheese_Solo":[79,-1,12,0],"S18_CashCupExtraDH":[65,-1,6,0],"S18_CashCup":[45,-1,10,0],"S18_ConsoleChampionsCup":[45,-1,10,0],"S18_Dreamhack_October":[73,68,10,10],"S18_DuosHypeCup":[53,-1,10,0],"S18_FNCS_Finals":[67,67,6,8],"S18_FNCS_Qualifier1":[45,-1,10,0],"S18_FNCS_Qualifier2":[45,-1,10,0],"S18_FNCS_SemiFinals_Day1":[67,-1,4,0],"S18_FNCS_SemiFinals_Day2":[55,-1,6,0],"S18_FloorRestoresLTM":[53,-1,10,0],"S18_GrandRoyaleCommunityCup":[45,-1,10,0],"S18_GrandRoyale_Finals":[67,81,6,6],"S18_GrandRoyale_Load":[45,-1,10,0],"S18_GrandRoyale_Reload":[45,-1,10,0],"S18_GrandRoyale_VictoryPath":[82,-1,8,0],"S18_PlaystationCup":[66,-1,10,0],"S18_PreseasonWarmup":[45,-1,10,0],"S18_SoloCashCup":[66,-1,10,0],"S18_TriosHypeCup":[52,-1,10,0],"S19_AllValleyCup":[66,-1,10,0],"S19_ConsoleChampionsCup":[83,83,10,7],"S19_DuosCashCup":[83,84,10,6],"S19_DuosHypeCup_Contender":[83,84,10,6],"S19_DuosHypeCup_Open":[83,84,10,6],"S19_FNCSCommunityCup":[83,-1,10,0],"S19_FNCS_Finals":[84,84,6,6],"S19_FNCS_Qualifier1":[83,83,10,7],"S19_FNCS_Qualifier2":[83,83,10,10],"S19_FNCS_SemiFinals":[85,85,5,5],"S19_LCBestOf":[83,-1,7,0],"S19_LCHighScore":[83,-1,99,0],"S19_PlaystationCupMarch":[83,-1,10,0],"S19_PlaystationCup":[66,74,10,6],"S19_SilkSonicCup":[83,-1,10,0],"S19_SoloCashCup":[66,74,10,6],"S19_SoloHypeCup_Contender":[66,74,10,6],"S19_SoloHypeCup_Open":[66,74,10,6],"S19_ThriveCup":[66,-1,10,0],"S19_TriosHypeCup_Champion":[52,-1,10,0],"S19_TriosHypeCup_Contender":[52,-1,10,0],"S19_TriosHypeCup_Open":[52,-1,10,0],"S20_AliaACup":[83,-1,10,0],"S20_AndroidStreetFighterCup":[66,-1,10,0],"S20_ChicaCup":[83,-1,10,0],"S20_ChloeKimCup":[83,-1,10,0],"S20_ConsoleChampionsCup":[83,83,10,10],"S20_DuosCashCup":[83,84,10,6],"S20_DuosHypeCup_Contender":[83,84,10,6],"S20_DuosHypeCup_Open":[83,84,10,6],"S20_FNCSCommunityCup":[83,-1,10,0],"S20_FNCS_Finals":[84,84,6,6],"S20_FNCS_Qualifier1":[83,83,10,10],"S20_FNCS_Qualifier2":[83,83,10,10],"S20_FNCS_Qualifier3":[83,83,10,10],"S20_FNCS_SemiFinals":[85,85,5,6],"S20_LCArchitectDuos":[83,-1,7,0],"S20_LCElegantWeaponsDuos":[83,-1,7,0],"S20_LCElimOnlyDuos":[86,-1,7,0],"S20_LCElimOnlyHighScoreDuos":[86,86,99,99],"S20_LCElimOnlyHighScoreTrios":[86,86,99,99],"S20_LCElimOnlySolo":[86,-1,7,0],"S20_LCMicroSessionsDuos":[83,83,99,99],"S20_LCMicroSessionsTriosZBM":[52,52,99,99],"S20_LCNoBuildDuos":[83,-1,7,0],"S20_LCNoBuildSquads":[87,-1,7,0],"S20_LCStartingLoadoutDuos":[83,-1,7,0],"S20_LCStartingLoadoutSolos":[66,-1,7,0],"S20_LCSuperBlitzDuos":[83,-1,7,0],"S20_ObiWanCup":[83,-1,10,0],"S20_PlaystationCupApril_Round1":[66,-1,10,0],"S20_PlaystationCupMay":[83,83,0,10],"S20_SoloCashCup":[66,74,10,6],"S20_SoloHypeCup_Contender":[66,74,10,6],"S20_SoloHypeCup_Open":[66,74,10,6],"S20_StreetFighterCup":[66,-1,10,0],"S20_TriosHypeCup_Champion":[52,-1,10,0],"S20_TriosHypeCup_Contender":[52,-1,10,0],"S21_ConsoleChampionsCupZBM":[83,83,10,10],"S21_ConsoleChampionsCup":[83,83,10,10],"S21_DreamerCup":[59,-1,10,0],"S21_DreamhackSummer":[72,35,10,6],"S21_DreamhackSummerZBM":[72,35,10,6],"S21_DuosCashCup":[83,89,10,6],"S21_DuosHypeCup_Contender":[84,-1,10,0],"S21_DuosHypeCup_Open":[84,-1,10,0],"S21_FNCS_Finals":[89,89,6,6],"S21_FNCS_Qualifier1":[83,83,10,10],"S21_FNCS_Qualifier2":[83,83,10,10],"S21_FNCS_Qualifier3":[83,83,10,10],"S21_FNCS_SemiFinals":[90,90,5,6],"S21_GalaxyCup":[66,-1,7,0],"S21_JewelRush":[91,-1,0,0],"S21_LCArchitectSolo":[66,-1,7,0],"S21_LCElimOnlyHighScoreDuos":[86,-1,7,0],"S21_LCElimOnlyHighScoreZBMSquads":[86,-1,7,0],"S21_LCHotDropDuos":[83,-1,7,0],"S21_LCNoSweatDuos":[92,-1,7,0],"S21_LCNoSweatSolo":[92,-1,7,0],"S21_LCNoSweatSquadsZBM":[92,-1,8,0],"S21_LCNoSweatTrios":[92,-1,7,0],"S21_LCQuickCupTriosZBM":[45,67,5,3],"S21_LCQuickCup":[83,89,5,3],"S21_LCStartingLoadoutDuos":[83,-1,7,0],"S21_LCStartingLoadoutSolo":[66,-1,7,0],"S21_LCTargetPracticeDuos":[83,-1,7,0],"S21_LCWildStormDuos":[83,-1,7,0],"S21_LGSoloCashCup":[79,80,12,10],"S21_LGSoloQuickCup":[79,-1,12,0],"S21_LGSolosQuickCup_BR":[24,-1,12,0],"S21_LGSolosQuickCup":[79,-1,12,0],"S21_LGSolosQuickCup_ME":[24,-1,12,0],"S21_LGTriosCashCup":[24,25,12,10],"S21_LGTriosQuickCup":[24,-1,12,0],"S21_PgodCup":[52,52,10,6],"S21_PlaystationCupAug":[66,74,10,6],"S21_PlaystationCupJuly":[66,74,10,6],"S21_PlaystationCupJune":[66,66,10,10],"S21_QuarterbackCup":[59,-1,10,0],"S21_SoloCashCupConsole":[66,74,10,6],"S21_SoloCashCup":[66,74,10,6],"S21_SoloHypeCup_Contender":[66,-1,10,0],"S21_SoloHypeCup_Open":[66,-1,10,0],"S21_SommersetCup":[83,-1,10,0],"S21_SuperHypeCup":[83,93,7,6],"S21_TournamentOfPower":[83,-1,10,0],"S21_TriosCashCupZBM":[45,67,6,3],"S21_TriosQuickCashCup":[52,-1,5,0],"S22_ConsoleChampionsCup":[83,83,10,10],"S22_DivisionalCups_Challenger":[94,-1,10,0],"S22_DivisionalCups_Contender":[95,-1,10,0],"S22_DivisionalCups_Elite":[94,-1,10,0],"S22_DivisionalCups_Elite_Finals":[2,-1,6,0],"S22_FNCSInvitationalCommunityCup":[83,-1,10,0],"S22_Invitational":[89,-1,6,0],"S22_PlacementCup":[95,-1,10,0],"S22_PlaystationCupNov":[66,74,10,6],"S22_PlaystationCupOct":[66,74,10,6],"S22_PlaystationCupSep":[66,74,10,6],"S22_PoloStadiumCup":[66,-1,10,0],"S22_QueasyCup":[52,52,10,6],"S22_SypherPKIconCup":[83,-1,10,0],"S22_ZBMCashCup":[96,-1,10,0],"S22_ZBMQuickCup":[94,-1,6,0],"S23_CreedCup":[97,-1,10,0],"S23_DivisionalCups_Challenger":[94,-1,10,0],"S23_DivisionalCups_Contender":[95,-1,10,0],"S23_DivisionalCups_Elite":[2,-1,10,0],"S23_DivisionalCups_Elite_Finals":[2,-1,6,0],"S23_DuosFillQuickCup":[98,-1,10,0],"S23_FNCS_CommunityCup":[83,-1,10,0],"S23_FNCS_Major1_GrandFinals":[2,-1,6,0],"S23_FNCS_Major1_SurgeWeek":[99,-1,5,0],"S23_FNCS_Major1_Week1":[2,2,10,6],"S23_FNCS_Major1_Week2":[2,2,10,6],"S23_FNCS_Major1_Week3":[2,2,10,6],"S23_LGSoloCashCup":[79,80,12,10],"S23_LGSoloQuickCup":[79,-1,12,0],"S23_LGTriosCashCup":[24,25,12,10],"S23_LGTriosQuickCup":[24,-1,12,0],"S23_PlacementCup":[95,-1,10,0],"S23_PlaystationCupFeb":[66,74,10,6],"S23_PlaystationCupJan":[66,74,10,6],"S23_SoloCashCup":[66,100,10,10],"S23_SuperFlakesCup":[83,-1,10,0],"S23_ThunderCup":[101,102,4,4],"S23_ZBMCashCup":[96,-1,10,0],"S23_ZBMQuickCupFill":[104,-1,6,0],"S23_ZBMQuickCup":[94,-1,6,0],"S23_thekidlaroi":[105,-1,10,0],"S24_ConsoleChampionsCupMay":[83,83,10,10],"S24_ConsoleChampionsCup":[83,83,10,10],"S24_DuosCashCup":[94,2,10,6],"S24_DuosFillQuickCup":[106,-1,7,0],"S24_FNCS_CommunityCup":[83,-1,10,0],"S24_FNCS_Major2_GrandFinals":[2,-1,6,0],"S24_FNCS_Major2_SurgeWeek":[99,-1,5,0],"S24_FNCS_Major2_Week1":[94,94,10,6],"S24_FNCS_Major2_Week2":[94,94,10,6],"S24_FNCS_Major2_Week3":[94,94,10,6],"S24_MamaBenjyFishy":[107,108,7,4],"S24_PlaystationCupMar":[66,74,10,6],"S24_RenegadeRunnerCupBuildZB":[83,-1,10,0],"S24_RenegadeRunnerCupBuild":[83,-1,10,0],"S24_SoloVictoryCup":[66,46,7,3],"S24_TriosZBVictoryCashCup":[107,46,7,3],"S24_ZBTriosFillQuickCup":[108,-1,10,0],"S25_ConsoleChampionsCup":[94,94,10,10],"S25_DuosCashCup":[94,2,10,6],"S25_DuosFillQuickCup":[2,-1,10,0],"S25_DuosZBVictoryCashCup":[94,46,7,3],"S25_FNCSCommunityCup":[94,-1,10,0],"S25_FNCS_LastChanceMajor":[94,2,10,6],"S25_FNCS_Major3_GrandFinals":[2,-1,6,0],"S25_FNCS_Major3_Week1":[94,94,10,6],"S25_FNCS_Major3_Week2":[94,94,10,6],"S25_FNCS_Major3_Week3":[94,94,10,6],"S25_GalaxyCup4Android":[109,-1,7,0],"S25_GalaxyCup4":[109,-1,7,0],"S25_JJKCup":[94,-1,10,0],"S25_PerfEvaluation":[95,94,7,4],"S25_PlaystationCupJune":[66,74,10,6],"S25_PlaystationCupZBJune":[66,74,10,6],"S25_SoloVictoryCashCup":[109,46,7,3],"S25_ZBDuosFillQuickCup":[94,-1,10,0],"S26_ConsoleChampionsCupZB":[2,2,10,10],"S26_ConsoleChampionsCup":[2,2,10,10],"S26_DuosCashCup":[94,2,10,6],"S26_DuosZBVictoryCashCup":[94,46,7,3],"S26_FNCSCommunityCup":[94,-1,10,0],"S26_MixUpMondaysBR":[92,-1,7,0],"S26_MixUpMondaysZB":[92,-1,7,0],"S26_PerfEvaluation":[95,94,7,4],"S26_PlaystationCupSeptember":[66,74,10,6],"S26_PlaystationCupZBSeptember":[66,74,10,6],"S26_SoloVictoryCashCup":[66,46,7,3],"S27_DuosZBVictoryCashCup":[94,46,7,3],"S27_OGAmar_Duos":[10,-1,10,0],"S27_OGGrefg_Duos":[10,-1,10,0],"S27_OGGrefg_Squads":[14,-1,10,0],"S27_OGInoxtag_Duos":[10,-1,10,0],"S27_OGJacob_Duos":[10,-1,10,0],"S27_RankedCupBronzeDuos":[112,-1,0,0],"S27_RankedCupBronzeSolo":[113,-1,0,0],"S27_RankedCupBronzeSquads":[114,-1,0,0],"S27_RankedCupDiamondDuos":[112,-1,0,0],"S27_RankedCupDiamondSolo":[113,-1,0,0],"S27_RankedCupDiamondSquads":[114,-1,0,0],"S27_RankedCupGoldDuos":[112,-1,0,0],"S27_RankedCupGoldSolo":[113,-1,0,0],"S27_RankedCupGoldSquads":[114,-1,0,0],"S27_RankedCupPlatinumDuos":[112,-1,0,0],"S27_RankedCupPlatinumSolo":[113,-1,0,0],"S27_RankedCupPlatinumSquads":[114,-1,0,0],"S27_RankedCupSilverDuos":[112,-1,0,0],"S27_RankedCupSilverSolo":[113,-1,0,0],"S27_RankedCupSilverSquads":[114,-1,0,0],"S27_RankedCupZBBronzeDuos":[112,-1,0,0],"S27_RankedCupZBBronzeSolo":[113,-1,0,0],"S27_RankedCupZBBronzeSquads":[114,-1,0,0],"S27_RankedCupZBDiamondDuos":[112,-1,0,0],"S27_RankedCupZBDiamondSolo":[113,-1,0,0],"S27_RankedCupZBDiamondSquads":[114,-1,0,0],"S27_RankedCupZBGoldDuos":[112,-1,0,0],"S27_RankedCupZBGoldSolo":[113,-1,0,0],"S27_RankedCupZBGoldSquads":[114,-1,0,0],"S27_RankedCupZBPlatinumDuos":[112,-1,0,0],"S27_RankedCupZBPlatinumSolo":[113,-1,0,0],"S27_RankedCupZBPlatinumSquads":[114,-1,0,0],"S27_RankedCupZBSilverDuos":[112,-1,0,0],"S27_RankedCupZBSilverSolo":[113,-1,0,0],"S27_RankedCupZBSilverSquads":[114,-1,0,0],"S27_SoloVictoryCashCup":[66,46,7,3],"S28_ConsoleCashCupsZB":[94,2,10,6],"S28_ConsoleCashCups":[94,2,10,6],"S28_DuosCashCup":[94,2,10,6],"S28_DuosZBVictoryCashCup":[94,46,7,3],"S28_FNCSCommunityCups":[94,-1,10,0],"S28_FNCS_Major1_GrandFinals":[2,-1,6,0],"S28_FNCS_Major1_Qualifier1":[94,94,10,10],"S28_FNCS_Major1_Qualifier2":[94,94,10,10],"S28_FNCS_Major1_SemiFinalLowerBracket":[2,2,10,10],"S28_FNCS_Major1_SemiFinalUpperBracket":[5,5,5,5],"S28_MixUpMondaysBR":[92,-1,7,0],"S28_MixUpMondaysZB":[92,-1,7,0],"S28_PerformanceEvaluation":[95,94,7,4],"S28_PlaystationCupDecember":[66,74,10,6],"S28_PlaystationCupZBDecember":[66,74,10,6],"S28_RankedCupBronzeDuos":[94,-1,0,0],"S28_RankedCupBronzeSolo":[115,-1,0,0],"S28_RankedCupBronzeSquads":[116,-1,0,0],"S28_RankedCupDiamondDuos":[94,-1,0,0],"S28_RankedCupDiamondSolo":[115,-1,0,0],"S28_RankedCupDiamondSquads":[116,-1,0,0],"S28_RankedCupGoldDuos":[94,-1,0,0],"S28_RankedCupGoldSolo":[115,-1,0,0],"S28_RankedCupGoldSquads":[116,-1,0,0],"S28_RankedCupPlatinumDuos":[94,-1,0,0],"S28_RankedCupPlatinumSolo":[115,-1,0,0],"S28_RankedCupPlatinumSquads":[116,-1,0,0],"S28_RankedCupSilverDuos":[94,-1,0,0],"S28_RankedCupSilverSolo":[115,-1,0,0],"S28_RankedCupSilverSquads":[116,-1,0,0],"S28_RankedCupZBBronzeDuos":[94,-1,0,0],"S28_RankedCupZBBronzeSolo":[115,-1,0,0],"S28_RankedCupZBBronzeSquads":[116,-1,0,0],"S28_RankedCupZBDiamondDuos":[94,-1,0,0],"S28_RankedCupZBDiamondSolo":[115,-1,0,0],"S28_RankedCupZBDiamondSquads":[116,-1,0,0],"S28_RankedCupZBGoldDuos":[94,-1,0,0],"S28_RankedCupZBGoldSolo":[115,-1,0,0],"S28_RankedCupZBGoldSquads":[116,-1,0,0],"S28_RankedCupZBPlatinumDuos":[94,-1,0,0],"S28_RankedCupZBPlatinumSolo":[115,-1,0,0],"S28_RankedCupZBPlatinumSquads":[116,-1,0,0],"S28_RankedCupZBSilverDuos":[94,-1,0,0],"S28_RankedCupZBSilverSolo":[115,-1,0,0],"S28_RankedCupZBSilverSquads":[116,-1,0,0],"S28_SoloVictoryCashCup":[66,46,7,3],"S29_ConsoleCashCupsZB":[94,2,10,6],"S29_ConsoleCashCups":[94,2,10,6],"S29_DuosCashCup":[94,2,10,6],"S29_DuosZBVictoryCashCup":[94,46,7,3],"S29_FNCSCommunityCups":[94,-1,10,0],"S29_FNCS_Major2_GrandFinals":[2,-1,6,0],"S29_FNCS_Major2_Qualifier1":[94,94,10,10],"S29_FNCS_Major2_Qualifier2":[94,94,10,10],"S29_FNCS_Major2_SemiFinalLowerBracket":[2,2,10,10],"S29_FNCS_Major2_SemiFinalUpperBracket":[5,5,5,5],"S29_MixUpMondaysBR":[92,-1,7,0],"S29_MixUpMondaysZB":[92,-1,7,0],"S29_PerformanceEvaluation":[117,100,7,4],"S29_PlaystationCupMarch":[66,74,10,6],"S29_PlaystationCupZBMarch":[66,74,10,6],"S29_RankedCupBronzeDuos":[94,-1,0,0],"S29_RankedCupBronzeSolo":[115,-1,0,0],"S29_RankedCupBronzeSquads":[116,-1,0,0],"S29_RankedCupDiamondDuos":[94,-1,0,0],"S29_RankedCupDiamondSolo":[115,-1,0,0],"S29_RankedCupDiamondSquads":[116,-1,0,0],"S29_RankedCupEliteDuos":[94,-1,0,0],"S29_RankedCupEliteSolo":[115,-1,0,0],"S29_RankedCupEliteSquads":[116,-1,0,0],"S29_RankedCupGoldDuos":[94,-1,0,0],"S29_RankedCupGoldSolo":[115,-1,0,0],"S29_RankedCupGoldSquads":[116,-1,0,0],"S29_RankedCupPlatinumDuos":[94,-1,0,0],"S29_RankedCupPlatinumSolo":[115,-1,0,0],"S29_RankedCupPlatinumSquads":[116,-1,0,0],"S29_RankedCupSilverDuos":[94,-1,0,0],"S29_RankedCupSilverSolo":[115,-1,0,0],"S29_RankedCupSilverSquads":[116,-1,0,0],"S29_RankedCupZBBronzeDuos":[94,-1,0,0],"S29_RankedCupZBBronzeSolo":[115,-1,0,0],"S29_RankedCupZBBronzeSquads":[116,-1,0,0],"S29_RankedCupZBDiamondDuos":[94,-1,0,0],"S29_RankedCupZBDiamondSolo":[115,-1,0,0],"S29_RankedCupZBDiamondSquads":[116,-1,0,0],"S29_RankedCupZBEliteDuos":[94,-1,0,0],"S29_RankedCupZBEliteSolo":[115,-1,0,0],"S29_RankedCupZBEliteSquads":[116,-1,0,0],"S29_RankedCupZBGoldDuos":[94,-1,0,0],"S29_RankedCupZBGoldSolo":[115,-1,0,0],"S29_RankedCupZBGoldSquads":[116,-1,0,0],"S29_RankedCupZBPlatinumDuos":[94,-1,0,0],"S29_RankedCupZBPlatinumSolo":[115,-1,0,0],"S29_RankedCupZBPlatinumSquads":[116,-1,0,0],"S29_RankedCupZBSilverDuos":[94,-1,0,0],"S29_RankedCupZBSilverSolo":[115,-1,0,0],"S29_RankedCupZBSilverSquads":[116,-1,0,0],"S29_RiseofMidasCup":[74,-1,10,0],"S29_SoloVictoryCashCup":[66,46,7,3],"S30_ConsoleCashCups":[94,2,10,6],"S30_DuosCashCupZB":[94,2,10,6],"S30_DuosCashCup":[94,2,10,6],"S30_FNCSCommunityCups":[94,-1,10,0],"S30_FNCS_Major3_GrandFinals":[2,-1,6,0],"S30_FNCS_Major3_Qualifier1":[94,94,10,10],"S30_FNCS_Major3_Qualifier2":[94,94,10,10],"S30_FNCS_Major3_SemiFinalLowerBracket":[2,2,10,10],"S30_FNCS_Major3_SemiFinalUpperBracket":[5,5,5,5],"S30_MetallicaCup":[118,-1,10,0],"S30_NickEh":[95,-1,10,0],"S30_OpenDuosCupBR":[95,-1,10,0],"S30_OpenDuosCupZB":[95,-1,10,0],"S30_OpenTriosCupBR":[119,-1,10,0],"S30_OpenTriosCupZB":[119,-1,10,0],"S30_PerformanceEvaluation":[117,100,7,4],"S30_PlaystationCupJune":[66,74,10,6],"S30_PlaystationCupZBJune":[66,74,10,6],"S30_RankedCupBSGDuos":[95,-1,0,0],"S30_RankedCupBSGSolo":[120,-1,0,0],"S30_RankedCupBSGSquads":[118,-1,0,0],"S30_RankedCupEliteDuos":[2,-1,0,0],"S30_RankedCupEliteSolo":[121,-1,0,0],"S30_RankedCupEliteSquads":[118,-1,0,0],"S30_RankedCupPDDuos":[94,-1,0,0],"S30_RankedCupPDSolo":[115,-1,0,0],"S30_RankedCupPDSquads":[116,-1,0,0],"S30_RankedCupZBBSGDuos":[95,-1,0,0],"S30_RankedCupZBBSGSolo":[120,-1,0,0],"S30_RankedCupZBBSGSquads":[118,-1,0,0],"S30_RankedCupZBPlatinumDuos":[94,-1,0,0],"S30_RankedCupZBPlatinumSolo":[115,-1,0,0],"S30_RankedCupZBPlatinumSquads":[116,-1,0,0],"S30_ReloadZB":[122,-1,7,0],"S30_Reload":[122,-1,7,0],"S30_SoloVictoryCashCup":[120,46,7,3],"S30_SoloZBVictoryCashCup":[120,46,7,3],"S30_SquadsVictoryCashCup":[118,46,7,3],"S30_d4vd_Cup":[95,-1,10,0],"S31_DuosCashCupZB":[95,94,10,6],"S31_DuosCashCup":[95,94,10,6],"S31_FNCSCommunityCups_KunoRenzo":[94,-1,10,0],"S31_FNCSCommunityCups_Kyra":[94,-1,10,0],"S31_FNCSCommunityCups_Siren":[94,-1,10,0],"S31_FNCSCommunityCups_Sparkplug":[94,-1,10,0],"S31_FNCSCommunityCups_Stashd":[94,-1,10,0],"S31_InfluencerCup":[95,46,7,3],"S31_PerformanceEvaluation":[95,46,7,4],"S31_PlatformReloadDuosCashCupConsole":[123,122,7,6],"S31_PlatformReloadDuosCashCupMobile":[123,122,7,6],"S31_PlatformReloadDuosCashCupPC":[123,122,7,6],"S31_PlaystationSypherPKCup":[120,115,10,6],"S31_RankedCupBRBSGDuos":[95,-1,0,0],"S31_RankedCupBREliteDuos":[2,-1,0,0],"S31_RankedCupBRPDDuos":[94,-1,0,0],"S31_RankedCupBSGDuos":[95,-1,0,0],"S31_RankedCupEliteDuos":[2,-1,0,0],"S31_RankedCupPDDuos":[94,-1,0,0],"S31_RankedCupZBBSGDuos":[95,-1,0,0],"S31_RankedCupZBPlatinumDuos":[94,-1,0,0],"S31_RankedCupZB_BSGDuos":[95,-1,0,0],"S31_RankedCupZB_PlatinumDuos":[94,-1,0,0],"S31_RubiusIconCup":[124,-1,10,0],"S31_SoloVictoryCashCup":[120,46,7,3],"S31_SoloZBVictoryCashCup":[120,46,7,3],"S31_SquadsReloadCup":[123,-1,7,0],"S31_SquadsReloadVictoryCashCup":[122,46,7,3],"S31_SymbioteCup":[95,-1,10,0],"S31_TriosCashCup":[119,125,10,10],"S32_FNCSCommunityCups":[94,-1,10,0],"S32_PerformanceEvaluation":[95,46,7,4],"S32_PlatformReloadDuosCashCupConsole":[123,-1,7,0],"S32_PlatformReloadDuosCashCupMobile":[123,-1,7,0],"S32_PlatformReloadDuosCashCupPC":[123,-1,7,0],"S32_RankedCupBSGDuos":[95,-1,0,0],"S32_RankedCupBSGSolo":[120,-1,0,0],"S32_RankedCupEliteDuos":[2,-1,0,0],"S32_RankedCupEliteSolo":[121,-1,0,0],"S32_RankedCupPDDuos":[94,-1,0,0],"S32_RankedCupPDSolo":[115,-1,0,0],"S32_RankedCupZBBSGDuos":[95,-1,0,0],"S32_RankedCupZBBSGSolo":[120,-1,0,0],"S32_RankedCupZBPlatinumDuos":[94,-1,0,0],"S32_RankedCupZBPlatinumSolo":[115,-1,0,0],"S32_SoloVictoryCashCup":[120,46,7,3],"S32_SoloZBVictoryCashCup":[120,46,7,3],"S32_SquadsReloadCup":[123,-1,7,0],"S32_TriosCashCup":[119,125,10,6],"S32_TriosCashCup_ZB":[119,125,10,6],"S33_FNCSCommunityCups":[17,-1,10,0],"S33_FNCSDivisionalCup_Division1":[125,126,10,6],"S33_FNCSDivisionalCup_Division2":[119,-1,10,0],"S33_FNCSDivisonalCup_Division3":[119,-1,10,0],"S33_FNCSMajor1_Final":[8,-1,6,0],"S33_FNCSMajor1_GroupStage":[127,-1,5,0],"S33_FNCSMajor1_LastChanceQualifier":[119,128,10,3],"S33_FNCSMajor1_PlayInStage":[125,-1,10,0],"S33_FNCS_Trial":[119,-1,10,0],"S33_OGCommunityCupZB":[94,-1,10,0],"S33_OGCommunityCup":[94,-1,10,0],"S33_OGCupZB":[116,-1,10,0],"S33_OGCup":[116,-1,10,0],"S33_PerformanceEvaluation":[119,46,7,4],"S33_PlaystationCup":[17,72,10,6],"S33_RankedCupBSGDuos":[95,-1,0,0],"S33_RankedCupBSGSolo":[129,-1,0,0],"S33_RankedCupBSSolo":[129,-1,0,0],"S33_RankedCupEliteDuos":[2,-1,0,0],"S33_RankedCupEliteSolo":[130,-1,0,0],"S33_RankedCupPDDuos":[94,-1,0,0],"S33_RankedCupPDSolo":[131,-1,0,0],"S33_SoloCashCup":[17,72,10,10],"S34_ClixIconCup":[119,-1,10,0],"S34_EliteZadieCup":[0,-1,10,0],"S34_FNCSCommunityCups":[17,-1,10,0],"S34_FNCSDivisionalCup_Division1":[125,126,10,6],"S34_FNCSDivisionalCup_Division2":[119,-1,10,0],"S34_FNCSDivisionalCup_Division3":[119,-1,10,0],"S34_FNCSMajor2_Final":[8,-1,6,0],"S34_FNCSMajor2_GroupStage":[127,-1,5,0],"S34_FNCSMajor2_LastChanceQualifier":[119,128,10,3],"S34_FNCSMajor2_PlayInStage":[125,-1,10,0],"S34_LanternFestCup":[17,-1,10,0],"S34_OGCupZB":[116,-1,10,0],"S34_OGCup":[116,-1,10,0],"S34_PerformanceEvaluationReloadAll":[0,46,7,4],"S34_PerformanceEvaluationReload":[132,132,7,4],"S34_PerformanceEvaluation":[119,46,7,4],"S34_PlaystationCup":[17,72,10,6],"S34_RankedCupBSGDuos":[95,-1,0,0],"S34_RankedCupBSGSolo":[129,-1,0,0],"S34_RankedCupEliteDuos":[2,-1,0,0],"S34_RankedCupEliteSolo":[130,-1,0,0],"S34_RankedCupPDDuos":[94,-1,0,0],"S34_RankedCupPDSolo":[131,-1,0,0],"S34_ShoheiOhtaniCup":[17,-1,10,0],"S34_SoloCashCup":[17,72,10,10],"S34_ThunderboltsCup":[94,-1,10,0],"S35_FNCSCommunityCups_Bugha":[0,-1,10,0],"S35_FNCSCommunityCups_Clix":[0,-1,10,0],"S35_FNCSCommunityCups_Lachlan":[0,-1,10,0],"S35_FNCSCommunityCups_Loserfruit":[0,-1,10,0],"S35_FNSCShowdown":[125,126,10,6],"S35_OGCupZB":[116,-1,10,0],"S35_OGCup":[116,-1,10,0],"S35_PerformanceEvaluation":[119,46,7,4],"S35_RankedCupBSGDuos":[95,-1,0,0],"S35_RankedCupBSGSolo":[129,-1,0,0],"S35_RankedCupBSGTrios":[119,-1,0,0],"S35_RankedCupEliteDuos":[2,-1,0,0],"S35_RankedCupEliteSolo":[130,-1,0,0],"S35_RankedCupEliteTrios":[8,-1,0,0],"S35_RankedCupPDDuos":[94,-1,0,0],"S35_RankedCupPDSolo":[131,-1,0,0],"S35_RankedCupPDTrios":[125,-1,0,0],"S35_ReloadRankedCup_BSG_Duos":[0,-1,0,0],"S35_ReloadRankedCup_Elite_Duos":[0,-1,0,0],"S35_ReloadRankedCup_PD_Duos":[0,-1,0,0],"S35_VictoryDuosCup":[94,46,7,3],"S36_FNCSCommunityCup":[17,-1,10,0],"S36_FNCSDivisionalCup_Division1":[125,126,10,7],"S36_FNCSDivisionalCup_Division2":[119,-1,10,0],"S36_FNCSDivisionalCup_Division3":[119,-1,10,0],"S36_FNCSMajor3_Final":[8,-1,6,0],"S36_FNCSMajor3_GroupStage":[127,-1,5,0],"S36_FNCSMajor3_LastChanceQualifier":[119,128,10,3],"S36_FNCSMajor3_PlayInStage":[125,-1,10,0],"S36_FantasticFourCups":[118,-1,10,0],"S36_OGCups_BR":[116,-1,10,0],"S36_OGCups_ZB":[116,-1,10,0],"S36_PerformanceEvaluation":[119,46,7,4],"S36_PlayStationCup":[17,72,10,6],"S36_RangerCup_Pink":[17,-1,10,0],"S36_RangerCup_Red":[17,-1,10,0],"S36_SquidGroundVictoryDuosCup":[94,46,7,3],"S36_SquidGroundsCups":[0,-1,10,0],"S36_VictoryDuosCup":[94,46,7,3],"S37_AceWildCardCup":[0,0,3,3],"S37_AceWildCardCup_Group2":[0,0,0,3],"S37_AceWildCardCup_Group3":[0,0,0,3],"S37_AxeOfChampionsCup":[17,-1,10,0],"S37_AxeOfChampsBlitzMobileCup":[0,-1,10,0],"S37_BladeOfChampsCupGroup2":[0,0,0,3],"S37_BladeOfChampsCupGroup3":[0,0,0,3],"S37_BladeOfChampsCup":[0,0,3,3],"S37_BlitzCupOneSwing":[0,-1,10,0],"S37_BlitzCupsAllPlatforms":[0,-1,10,0],"S37_BlitzCups":[0,-1,10,0],"S37_BlitzMobileCupWeekly":[0,-1,10,0],"S37_BlitzMobileCup":[0,-1,10,0],"S37_ChampionCrystalCup":[17,-1,10,0],"S37_ChampionPJCup":[17,-1,10,0],"S37_ConsoleDuosCashCups":[94,46,7,3],"S37_DuosDivisionalCupTrial":[95,-1,10,0],"S37_DuosDivisionalCup_Division1":[133,2,10,6],"S37_DuosDivisionalCup_Division2":[95,-1,10,0],"S37_DuosDivisionalCup_Division3":[95,-1,10,0],"S37_DuosDivisionalCup_Division4":[95,-1,10,0],"S37_DuosDivisionalCup_Division5":[117,-1,10,0],"S37_EarlyAccessCup":[0,0,10,10],"S37_EliteZadieCup":[0,0,3,3],"S37_EliteZadieCup_Group2":[0,0,0,3],"S37_EliteZadieCup_Group3":[0,0,0,3],"S37_FNCSCommunityCups_Bugha":[0,-1,10,0],"S37_FNCSCommunityCups_Clix":[0,-1,10,0],"S37_FNCSCommunityCups_Lachlan":[0,-1,10,0],"S37_FNCSCommunityCups_Loserfruit":[0,-1,10,0],"S37_FNCSDivisionalCup_Division1":[125,126,10,7],"S37_FNCSDivisionalCup_Division2":[119,-1,10,0],"S37_FNCSDivisionalCup_Division3":[119,-1,10,0],"S37_HauntedCupJason":[0,-1,10,0],"S37_HauntedCupWednesday":[0,-1,10,0],"S37_KaiCenatIconCup":[0,-1,15,0],"S37_MrSavageIconCup":[95,-1,10,0],"S37_OGCups_BR":[116,-1,10,0],"S37_OGCups_ZB":[116,-1,10,0],"S37_PerformanceEvaluationDuos":[95,46,7,4],"S37_PerformanceEvaluation":[119,46,7,4],"S37_PlayStationCup":[17,72,10,6],"S37_ReloadQuickCup":[0,0,3,3],"S37_ReloadQuickCup_Group2":[0,0,0,3],"S37_ReloadQuickCup_Group3":[0,0,0,3],"S37_SoloSeriesCup":[17,72,10,6],"S37_SurfWitchBlitzMobileCup":[0,-1,10,0],"S37_SurfWitchCup":[17,-1,10,0],"S38_BlitzMobileCup":[134,135,10,10],"S38_DuosVictoryCup":[94,46,7,3],"S38_OGCup_BR":[94,-1,10,0],"S38_OGCup":[94,-1,10,0],"S38_OGCup_ZB":[94,-1,10,0],"S38_PerformanceEvaluation":[95,46,7,4],"S38_PlayStationCupReload":[0,0,5,5],"S38_ReloadQuickCup":[0,0,3,3],"S38_ReloadQuickCup_Group2":[0,0,0,3],"S38_ReloadQuickCup_Group3":[0,0,0,3],"S38_SoloSeriesCup":[17,46,10,3],"S38_SquadsVictoryCup":[136,46,7,3],"S38_StrangerThingsCup":[0,-1,15,0],"S38_StrangerThingsMobileCup":[0,-1,15,0],"S38_TouchOnlyMobileCup":[134,134,10,10],"S39_1MillionUnrealCup":[95,-1,10,0],"S39_BleachCup":[17,-1,10,0],"S39_DuosConsoleVictoryCupZB_Jan":[94,46,7,3],"S39_DuosVictoryCup":[95,46,7,3],"S39_FNCSDivisionalCupTrial":[95,-1,11,0],"S39_FNCSDivisionalCup_Division1":[133,2,11,6],"S39_FNCSDivisionalCup_Division2":[95,-1,11,0],"S39_FNCSDivisionalCup_Division3":[95,-1,11,0],"S39_FNCSDivisionalCup_Division4":[95,-1,11,0],"S39_FNCSDivisionalCup_Division5":[117,-1,11,0],"S39_KPDHCup":[17,-1,10,0],"S39_KizunaAICupMobile":[137,-1,10,0],"S39_KizunaAICup":[95,-1,10,0],"S39_LanternFestCupMobile":[137,-1,10,0],"S39_LanternFestCup":[138,-1,12,0],"S39_MobileSeriesCupFebQual":[135,-1,10,0],"S39_MobileSeriesCupJanQual":[135,-1,10,0],"S39_MobileSeriesCupMarQual":[135,-1,10,0],"S39_MobileSeriesFeb":[137,137,10,10],"S39_MobileSeriesJan":[137,137,10,10],"S39_MobileSeriesMar":[137,137,10,10],"S39_NvidiaCup":[17,-1,10,0],"S39_PerformanceEvaluation":[95,46,7,4],"S39_PickleRickCup":[17,-1,10,0],"S39_PlayStationCupZB":[17,72,10,6],"S39_PlayStationCup":[17,72,10,6],"S39_ReloadCashVictoryCup_Dec":[138,46,10,3],"S39_ReloadCashVictoryCup_Jan":[138,46,10,3],"S39_ReloadEliteSeries1Final":[139,-1,8,0],"S39_ReloadEliteSeries1Heat1":[139,-1,8,0],"S39_ReloadEliteSeries1Heat2":[139,-1,8,0],"S39_ReloadEliteSeries1Heat3":[139,-1,8,0],"S39_ReloadEliteSeries1Heat4":[139,-1,8,0],"S39_ReloadEliteSeries1Opens":[138,-1,12,0],"S39_ReloadEliteSeries1PlayIn":[138,-1,12,0],"S39_ReloadEliteSeries2Final":[140,-1,8,0],"S39_ReloadEliteSeries2Heat1":[140,-1,8,0],"S39_ReloadEliteSeries2Heat2":[140,-1,8,0],"S39_ReloadEliteSeries2Heat3":[140,-1,8,0],"S39_ReloadEliteSeries2Heat4":[140,-1,8,0],"S39_ReloadEliteSeries2Opens":[141,-1,12,0],"S39_ReloadEliteSeries2PlayIn":[141,-1,12,0],"S39_SoloLevelingCup":[17,-1,10,0],"S39_SoloLevelingMobileCup":[137,-1,10,0],"S39_SoloSeriesCupFinal":[72,-1,6,0],"S39_SoloSeriesCupHeats":[142,-1,6,0],"S39_SoloSeriesCup":[17,-1,10,0],"S39_SoloVictoryCup":[17,46,7,3],"S40_BakMobileCup":[143,-1,10,0],"S40_CashCup_TriosZB":[125,126,11,6],"S40_ChampionKorFNCSCupMobile":[143,-1,10,0],"S40_ChampionKorFNCSCup":[94,-1,11,0],"S40_ConsoleCC_TriosZB":[125,126,11,6],"S40_ConsoleVCC_SolosZB":[144,46,8,3],"S40_DuckythegamerCupMobile":[143,-1,10,0],"S40_DuosReloadVictoryCup":[141,46,10,3],"S40_FNCSDivisionalCup_Division1":[133,2,11,6],"S40_FNCSDivisionalCup_Division2":[95,-1,11,0],"S40_FNCSDivisionalCup_Division3":[95,-1,11,0],"S40_FNCSDivisionalCup_Division4":[95,-1,11,0],"S40_FNCSDivisionalCup_Division5":[117,-1,11,0],"S40_FNCSMajor1_Final":[2,-1,6,0],"S40_FNCSMajor1_HeatsStage":[145,-1,5,0],"S40_FNCSMajor1_LastChanceQualifier":[95,146,11,5],"S40_FNCSMajor1_PlayInStage":[94,-1,11,0],"S40_FNCSMajor1_SecondChance":[94,2,11,6],"S40_MandalorianCup":[94,-1,11,0],"S40_MandalorianCup_ZB":[94,-1,11,0],"S40_MandalorianMobileCup":[143,-1,10,0],"S40_MobileSeriesApr":[143,143,10,10],"S40_MobileSeriesCupQual":[147,-1,10,0],"S40_MobileSeriesMar":[143,-1,10,0],"S40_MobileSeriesMay":[143,143,10,10],"S40_PerformanceEvaluationReload":[141,46,10,4],"S40_PerformanceEvaluation":[95,46,8,4],"S40_PlayStationCupClixZB":[17,-1,11,0],"S40_PlayStationCupClix":[17,46,11,6],"S40_PlayStationCupMrSavageZB":[17,-1,11,0],"S40_PlayStationCupMrSavage_Final":[46,-1,6,0],"S40_PlayStationCupMrSavage_Qualifier":[17,-1,11,0],"S40_ReloadEliteSeries3Final":[140,-1,8,0],"S40_ReloadEliteSeries3Heat1":[140,-1,8,0],"S40_ReloadEliteSeries3Heat2":[140,-1,8,0],"S40_ReloadEliteSeries3Heat3":[140,-1,8,0],"S40_ReloadEliteSeries3Heat4":[140,-1,8,0],"S40_ReloadEliteSeries3Opens":[141,-1,12,0],"S40_ReloadEliteSeries3PlayIn":[141,-1,12,0],"S40_ShowdownSeries_BuffPerryCup":[17,-1,11,0],"S40_ShowdownSeries_BuzzLightyearCup":[94,-1,11,0],"S40_ShowdownSeries_DaffyCup":[141,-1,12,0],"S40_ShowdownSeries_DrDoofenshmirtzCup":[17,-1,11,0],"S40_ShowdownSeries_EmperorZurgCup":[94,-1,11,0],"S40_ShowdownSeries_JonSnow":[17,-1,11,0],"S40_ShowdownSeries_LolaBunnyCup":[141,-1,12,0],"S40_ShowdownSeries_NightKing":[17,-1,11,0],"S40_SoloVictoryCup":[17,46,8,3],"S40_SpidergamerCupMobile":[143,-1,10,0],"S40_TheDonatoMobileCup":[143,-1,10,0],"S40_TripleThreatCup":[125,-1,11,0],"S40_TripleThreatMobileCup":[143,-1,10,0],"S40_TypicalGamerCup":[17,-1,11,0],"S41_CashCup_DuosZB":[94,133,11,6],"S41_ConsoleCC_DuosZB":[94,133,11,6],"S41_ConsoleVCC_SolosZB":[144,46,8,3],"S41_DavidBeckham":[125,-1,11,0],"S41_DavidBeckham_ZB":[125,-1,11,0],"S41_FNCSCommunityCup":[148,-1,11,0],"S41_FNCSCommunityCup_Mobile":[143,-1,8,0],"S41_FNCSCommunityCup_ZB":[148,-1,11,0],"S41_FNCSDivisionalCup_Division1":[94,2,11,6],"S41_FNCSDivisionalCup_Division2":[95,-1,11,0],"S41_FNCSDivisionalCup_Division3":[95,-1,11,0],"S41_FNCSDivisionalCup_Division4":[95,-1,11,0],"S41_FNCSDivisionalCup_Division5":[117,-1,11,0],"S41_FNCSLastChanceMajor":[95,95,11,11],"S41_FNCSMajor2_Final":[2,-1,6,0],"S41_FNCSMajor2_HeatsStage":[145,-1,5,0],"S41_FNCSMajor2_LastChanceQualifier":[95,146,11,5],"S41_FNCSMajor2_PlayInStage":[94,-1,11,0],"S41_MobileSeriesCupQual":[147,-1,6,0],"S41_MobileSeriesHeat1":[147,-1,6,0],"S41_MobileSeriesHeat2":[147,-1,6,0],"S41_MobileSeriesHeat3":[147,-1,6,0],"S41_MobileSeriesHeat4":[147,-1,6,0],"S41_MobileSeriesOpen":[143,143,8,8],"S41_MobileVictoryCup_BR":[17,46,6,3],"S41_MobileVictoryCup_RES":[149,46,6,3],"S41_MobileVictoryCup_ReloadminiV":[137,46,8,6],"S41_MobileVictoryCup_ZBReload":[149,46,6,3],"S41_MobileVictoryCup_ZB":[17,46,6,3],"S41_MongraalIconCup":[150,-1,12,0],"S41_PSCupDaysOfPlay":[17,72,11,6],"S41_PSCupDaysOfPlay_ZB":[17,72,11,6],"S41_PSTypicalGamer":[17,46,11,6],"S41_PSTypicalGamer_ZB":[17,46,11,6],"S41_PerformanceEvaluationReload":[141,46,10,4],"S41_PerformanceEvaluation":[95,46,8,4],"S41_ReloadEliteSeries4Final":[140,-1,8,0],"S41_ReloadEliteSeries4Heat1":[140,-1,8,0],"S41_ReloadEliteSeries4Heat2":[140,-1,8,0],"S41_ReloadEliteSeries4Heat3":[140,-1,8,0],"S41_ReloadEliteSeries4Heat4":[140,-1,8,0],"S41_ReloadEliteSeries4Opens":[141,-1,12,0],"S41_ReloadEliteSeries4PlayIn":[141,-1,12,0],"S41_ReloadReloadSoloVictoryCup":[151,46,10,3],"S41_SoloVictoryCup":[17,46,8,3],"S41_SupergirlCup":[148,-1,11,0],"S41_SupergirlCup_ZB":[148,-1,11,0],"S41_SupergirlMobileCup":[152,-1,8,0],"S41_TheOdysseyCup":[17,-1,11,0],"S41_TheOdysseyCup_Mobile":[152,-1,8,0],"S41_TheOdysseyCup_ZB":[17,-1,11,0],"S41_ViniJr":[125,-1,11,0],"S41_ViniJr_Mobile":[143,-1,8,0],"S41_ViniJr_ZB":[125,-1,11,0],"S42_ArenaPerfEval":[153,-1,10,0],"S42_ChampionFocusFNCSCup":[17,-1,11,0],"S42_ChampionFocusFNCSCup_ZB":[17,-1,11,0],"S42_ChampionFocusFNCSMobileCup":[152,-1,8,0],"S42_ConsoleVCC_SolosZB":[17,46,8,3],"S42_CrashBandicootCup":[141,-1,12,0],"S42_CrashBandicootCup_ZB":[141,-1,12,0],"S42_CrashBandicootMobileCup":[155,-1,8,0],"S42_CyperpranksCup":[125,-1,11,0],"S42_CyperpranksCup_Mobile":[152,-1,8,0],"S42_CyperpranksCup_ZB":[125,-1,11,0],"S42_FNCSDivisionalCup_Division1":[94,2,11,6],"S42_FNCSDivisionalCup_Division2":[95,-1,11,0],"S42_FNCSDivisionalCup_Division3":[95,-1,11,0],"S42_FNCSDivisionalCup_Division4":[95,-1,11,0],"S42_FNCSDivisionalCup_Division5":[117,-1,11,0],"S42_FNCSSoloFastTracks":[18,-1,4,0],"S42_FNCSSoloQualifiers":[17,17,11,11],"S42_FNCSSolo_Final":[18,-1,6,0],"S42_FNCSSolo_HeatsStage":[72,-1,6,0],"S42_FNCSSolo_LastChanceQualifier":[17,72,11,5],"S42_IronmouseIconCup":[141,-1,12,0],"S42_IronmouseIconCup_ZB":[141,-1,12,0],"S42_KingdomHeartsCup":[17,-1,11,0],"S42_KingdomHeartsCup_Mobile":[152,-1,8,0],"S42_KingdomHeartsCup_ZB":[17,-1,11,0],"S42_MadisonBeerIconCup":[141,-1,12,0],"S42_MadisonBeerIconCup_Mobile":[152,-1,8,0],"S42_MadisonBeerIconCup_ZB":[141,-1,12,0],"S42_MegaManCup":[94,-1,11,0],"S42_MegaManCup_Mobile":[152,-1,8,0],"S42_MegaManCup_ZB":[94,-1,11,0],"S42_MobileSeriesCupSemiFinal":[147,-1,6,0],"S42_MobileSeriesGroup1":[147,-1,6,0],"S42_MobileSeriesGroup2":[147,-1,6,0],"S42_MobileSeriesLCQ":[143,143,8,8],"S42_MobileVictoryCup_ReloadminiV":[137,46,8,6],"S42_PSNickEh30":[17,72,11,6],"S42_PSNickEh30_ZB":[17,72,11,6],"S42_PerformanceEvaluation":[95,46,8,4],"S42_Persona5Cup":[151,-1,12,0],"S42_Persona5Cup_Mobile":[152,-1,8,0],"S42_Persona5Cup_ZB":[151,-1,12,0],"S42_ReloadCashCup_DuosZB":[141,140,12,6],"S42_ReloadDuosVictoryCup":[141,46,10,3],"S42_ReloadReloadSoloVictoryCup":[151,46,10,3],"S42_ShadowCup":[17,-1,11,0],"S42_ShadowCup_Mobile":[152,-1,8,0],"S42_ShadowCup_ZB":[17,-1,11,0],"S42_SoloVictoryCup":[17,46,8,3],"S42_TheHectorino_Mobile":[152,-1,8,0],"S42_WeezyIconCup":[17,-1,11,0],"S42_WeezyIconCup_ZB":[17,-1,11,0],"ScallywagCup":[9,-1,10,0],"ShareTheLove_Champion_Duo":[1,-1,15,0],"ShareTheLove_Champion_Solo":[1,-1,15,0],"ShareTheLove_Contender_Duo":[1,-1,15,0],"ShareTheLove_Contender_Solo":[1,-1,15,0],"ShareTheLove_Open_Duo":[1,-1,20,0],"ShareTheLove_Open_Solo":[1,-1,20,0],"ShareTheLove_Placement_Duo":[1,-1,20,0],"ShareTheLove_Placement_Solo":[1,-1,20,0],"ShareTheLove_Prospect_Duo":[1,-1,20,0],"ShareTheLove_Prospect_Solo":[1,-1,20,0],"SourDropper_LoveAndWar":[156,-1,10,0],"SourDropper_WeekendTournament_Day1":[156,-1,15,0],"SourDropper_WeekendTournament_Day2":[156,-1,15,0],"TriosOneDayCup1EU":[1,-1,15,0],"WorldCupWarmup":[10,-1,10,0],"XboxCup_Solo1":[4,-1,10,0],"s20_FridayNightZeroBuild":[157,-1,7,0],"s20_LCArchitectSolos":[83,-1,7,0],"s20_TriosHypeCup_Open":[52,-1,10,0]};
/* CUP SCORING end */
/* ОЧКИ КАПА — КАК У EPIC (его слово 29.09: «поинт система должна быть у каждого капа такая
   же, как и у настоящего фортнайт… в каждом году каждый турнир разные»). Правила — ScoringRules
   окон события Epic (tools/build-cup-scoring.js → CC_SCORE_R / CC_CUP_SCORE): места — пороги
   «топ N» с MatchRule lte, каждый пройденный порог добавляет свои очки; элимы — очки за каждый
   (или пороги gte). Раунд 2 — своё правило, если оно у события было. Семейство ищется по id
   капа так же, как раунды (ccCupRounds); кубок дивизиона — по сезону дня и номеру дивизиона.
   Нет правила — null, и вечер считает, как считал. */
// Свои id капов, записанные не так, как у Epic: Victory Cup 2024 у Epic — VictoryCashCup,
// Reload-кап 2026 — ReloadReload…, Squid Grounds 2025 (дуо) — SquidGroundVictoryDuosCup.
// World Cup Warmup 2019 (кап из lans.json, id ONL_) — своё правило Epic WorldCupWarmup: 10 матчей, VR 10, топ-5 7, топ-10 5, топ-15 3, элим 1.
const CC_CUP_FAM_ALIAS={'S36_SquidGroundsCashCup':'S36_SquidGroundVictoryDuosCup', 'ONL_Fortnite_World_Cup_2019_Warmup':'WorldCupWarmup'};
function ccCupFamily(id){
  if(!id || typeof CC_CUP_SCORE==='undefined') return null;
  const tries=[CC_CUP_FAM_ALIAS[id], id, id.replace(/VictoryCup$/, 'VictoryCashCup'), id.replace(/_Reload/, '_ReloadReload')];
  for(const t of tries){
    if(!t) continue;
    if(CC_CUP_SCORE[t]) return t;
    const k=Object.keys(CC_CUP_SCORE).find(f=>f.indexOf(t+'_')===0); if(k) return k;
  }
  return null;
}
function ccScorePlaceFn(rule){
  const tiers=rule[0]||[];
  return function(place){
    if(!(place>0)) return 0;
    let p=0; for(let i=0;i<tiers.length;i++) if(place<=tiers[i][0]) p+=tiers[i][1];
    return p;
  };
}
// Очки за элим числом: пороги gte сводятся к среднему за первые десять (у Epic они почти всегда
// ровные «+1 за каждый», и тогда это просто 1).
function ccScoreKill(rule){
  const e=rule[1];
  if(typeof e==='number') return e;
  if(!Array.isArray(e) || !e.length) return 0;
  let s=0; for(let k=1;k<=10;k++) e.forEach(t=>{ if(t[0]===k) s+=t[1]; });
  return s/10;
}
function ccCupScoreOf(famKey, round){
  const row=famKey && typeof CC_CUP_SCORE!=='undefined' ? CC_CUP_SCORE[famKey] : null;
  if(!row) return null;
  const ix=(round===2 && row[1]>=0) ? row[1] : row[0];
  if(round===2 && row[1]<0) return null;
  const rule=CC_SCORE_R[ix]; if(!rule) return null;
  return {pts:ccScorePlaceFn(rule), kill:ccScoreKill(rule), cap:round===2 ? row[3] : row[2], fam:famKey};
}
function ccCupScore(ev, round){ return ev ? ccCupScoreOf(ccCupFamily(String(ev.id||'')), round||1) : null; }
// Кубок дивизиона: семейство сезона дня — FNCSDivisionalCup_DivisionN (2025–26) или
// DivisionalCups_* (2022–23); у Epic очки у дивизионов одинаковые, берётся свой, иначе первый.
/* Очки финалов и отборов прошлых лет — по правилам Epic своего события (его правка 29.09:
   «птс система не та, на ворлд капе точно»; было — таблица FNCS 2024 для всех лет).
   World Cup 2019: неделя Online Open (Epic OnlineOpen_WeekN) и финал в Нью-Йорке
   (ONSITE_WorldCup_Solos/Duos). FNCS прошлых лет — семейство сезона дня: финал → *Final*,
   остальное → неделя/квалификация/полуфинал. Нет правила — null (остаётся прежняя таблица). */
function ccPastMajorScore(ev){
  if(!ev || typeof CC_CUP_SCORE==='undefined') return null;
  const id=String(ev.id||'');
  const wc=/^Major([12])_2019_(?:W(\d+)|Final)/.exec(id);
  if(wc) return ccCupScoreOf(wc[2] ? 'OnlineOpen_Week'+wc[2] : (wc[1]==='1' ? 'ONSITE_WorldCup_Solos' : 'ONSITE_WorldCup_Duos'), 1);
  const n=ccSeasonNumOn(ev.day||careerToday()); if(!n) return null;
  // Побочные события сезона (Surge Week — свои очки за «сёрдж», Community Cup, Warmup) — мимо.
  const fams=Object.keys(CC_CUP_SCORE).filter(k=>k.indexOf('S'+n+'_FNCS')===0 && !/Surge|Community|Warmup|Invitational/i.test(k)).sort();
  if(!fams.length) return null;
  const fin=ev.stage==='final' || /Final|_GF|Grand/i.test(id);
  /* Полуфинал — своим правилом Epic (S15–S17 SemiFinals, S18 SemiFinals_Day1, S19–S21 SemiFinals):
     раньше брался первый по алфавиту квалификатор (аудит 29.09). Правило «только победа»
     (Reboot Round, S18 Day2: 10 за победу, 0 за элим) — CC_WIN_ONLY: место в таблице решают победы. */
  if(ev.stage==='reboot') return CC_WIN_ONLY;
  if(ev.stage==='semi'){
    const semi=fams.find(k=>new RegExp('SemiFinals_Day'+(ev.r||1)+'$').test(k)) || fams.find(k=>/SemiFinals$/.test(k));
    const rule=semi && CC_CUP_SCORE[semi] && CC_SCORE_R[CC_CUP_SCORE[semi][0]];
    const winOnly=rule && rule[0].length===1 && !rule[1];
    if(winOnly) return CC_WIN_ONLY;
    if(semi) return ccCupScoreOf(semi, 1);
  }
  const pick=fin ? fams.find(k=>/Final/i.test(k) && !/Semi/i.test(k))
                 : fams.find(k=>/Week|Qualifier|Heat|SemiFinal|Semi/i.test(k) && !/Grand/i.test(k));
  return ccCupScoreOf(pick || fams[0], 1);
}
function ccDivCupScore(day, div){
  if(typeof CC_CUP_SCORE==='undefined') return null;
  const n=ccSeasonNumOn(day||careerToday()); if(!n) return null;
  const fams=Object.keys(CC_CUP_SCORE).filter(k=>new RegExp('^S'+n+'_(FNCS)?Divis[io]*nalCups?(_|$)').test(k) && !/Trial|Finals/.test(k));
  if(!fams.length) return null;
  // 2022–23 (S22–S23) дивизионы у Epic по именам: 1 — Elite, 2 — Challenger, 3 — Contender
  // (у Contender и элим дешевле всех — 1). Раньше искалось «DivisionN» и всё падало в Challenger.
  const byName={1:'Elite', 2:'Challenger', 3:'Contender'}[div];
  const own=fams.find(k=>new RegExp('Division'+div+'$').test(k)) || (byName && fams.find(k=>new RegExp('_'+byName+'$').test(k)));
  return ccCupScoreOf(own || fams.sort()[0], 1);
}
/* EVENT COLORS begin — tools/build-event-colors.js */
const CC_EV_PAL=[["4C00A9","FFFFFF","08E164","FFFFFF"],["A6FFCB","3272FF","4420CC","FFF736"],["1AF3FB","9C46FD","6E00D4","31F3FF"],["B537FB","41108C","5000BE","0BFFAC"],["D8D7E3","9D9FAD","114FF5","FFFFFF"],["00B7A4","006D6E","25FFF4","FFEA00"],["025768","00B89C","",""],["0127A6","2F7FF1","08E164","FFFFFF"],["0127A6","2F7FF1","",""],["7E00FF","F33C17","FFFFFF","FFFFFF"],["B537FB","41108C","5000BE","FFFFFF"],["EAF943","FE20CC","FFFFFF","6B0356"],["FD2ED8","17D6FF","FFFFFF","010D2F"],["000000","151414","FFFFFF","FFFFFF"],["0126B7","000410","","0EFFA7"],["A6FFCB","3272FF","4420CC","FFFFFF"],["201E1D","070707","FFFFFF","FFFFFF"],["124AEC","124AEC","F7FF00","FFFFFF"],["3A1598","9933FF","FFFFFF","0EFFA7"],["004BAA","004BAA","F7FF00","FFFFFF"],["006BD5","00D2FF","","FFFFFF"],["17D6FF","FD2ED8","FFFFFF","010D2F"],["004BAA","00E8FA","4FFF6C","FFFFFF"],["DA0528","FF6725","F7FF00","FFFFFF"],["FE20CC","EAF943","FFF608","6B0356"],["780162","EC0A52","","FFFFFF"],["171615","000000","","FFFFFF"],["3A1598","9933FF","","0EFFA7"],["09CCF8","8DFBA5","F7FF00","FFFFFF"],["FF4286","FFA349","F7FF00","FFFFFF"],["124AEC","00F0FF","F7FF00","FFFFFF"],["F50249","FF4B0A","FFED27","FFFFFF"],["0971B8","30E3FF","F7FF00","FFFFFF"],["0495E9","00529E","F7FF00","FFFFFF"],["0126B7","000410","6DFDFF","0EFFA7"],["3A1598","9933FF","","FFFFFF"],["EB1939","731428","F7FF00","FFFFFF"],["EF172C","000000","F7FF00","FFFFFF"],["FE20CC","EAF943","FFF608","FFFFFF"],["17D6FF","FD2ED8","FFF608","FFFFFF"],["06035C","FF0BA6","FF03A3","FFFFFF"],["3A1598","9933FF","06E4FF","FFFFFF"],["590191","38025A","F7FF00","FFFFFF"],["0056CC","51E5FF","F7FF00","FFFFFF"],["E82D3C","FCC711","6DFDFF","FFFFFF"],["0078FF","020C14","F7FF00","FFFFFF"],["E92622","F4A11E","FFE9AF","FFFFFF"],["FF0000","870011","FF0020","FFFFFF"],["00FCFF","071989","00FF72","FFFFFF"],["4FACFE","00F2FE","F7FF00","FFFFFF"],["D7144F","3F0B38","F6F45F","010D2F"],["0126B7","000410","6DFDFF","FFFFFF"],["249B15","D1FC5B","F7FF00","FFFFFF"],["3A0004","FF0012","FFFFFF","010D2F"],["E2236D","FF9804","F7FF00","FFFFFF"],["0076C3","012162","F7FF00","FFFFFF"],["E51717","FF730A","F7FF00","FFFFFF"],["FFA312","FB33F2","F7FF00","FFFFFF"],["091147","0472D0","FF6D01","FFFFFF"],["17D6FF","FD2ED8","FFF608","010D2F"],["1B0347","5118D2","F7FF00","FFFFFF"],["00B7FB","4AD53E","FFF608","FFFFFF"],["A7108B","F13C42","FFE92B","FFFFFF"],["320C55","9A1DB8","74D82B","FFFFFF"],["15161C","313139","58FE85","FFFFFF"],["F50249","FF4B0A","F7FF00","FFFFFF"],["0CA104","67E10D","F7FF00","FFFFFF"],["39B701","50E805","F7FF00","FFFFFF"],["36027C","130026","F7FF00","FFFFFF"],["230049","7000E7","F334FF","FFFFFF"],["5300AB","5000A5","D7FF00","FFFFFF"],["05002D","526FBC","FEEF02","FFFFFF"],["3A1598","9933FF","6DFDFF","FFFFFF"],["200347","7818D2","F7FF00","FFFFFF"],["1F0141","7818D2","F7FF00","FFFFFF"],["101C46","003B8A","F7FF00","FFFFFF"],["7818D2","200347","F7FF00","FFFFFF"],["FF3D00","FB7635","F7FF00","FFFFFF"],["C3C5D7","EEEDFB","F7FF00","FFFFFF"],["D8D7E3","AAACBB","F7FF00","FFFFFF"],["0126B7","000410","F7FF00","FFFFFF"],["E2E1B6","B0A570","F7FF00","FFFFFF"],["04CBD7","65E86B","F7FF00","FFFFFF"],["02004B","009AEA","F7FF00","FFFFFF"],["E61107","FFD909","F7FF00","FFFFFF"],["00FE6A","0068FD","F7FF00","FFFFFF"],["00C3B8","FD37FF","F7FF00","FFFFFF"],["5801B3","7802F3","F7FF00","FFFFFF"],["E82CBE","680652","F7FF00","FFFFFF"],["9D35FF","3C0999","F7FF00","FFFFFF"],["AAACBB","AAACBB","F7FF00","FFFFFF"],["FF5900","C04400","F7FF00","FFFFFF"],["6532F6","A2169C","F7FF00","FFFFFF"],["00265F","0054D3","F7FF00","FFFFFF"],["BC1A84","0085D9","F7FF00","FFFFFF"],["870FF9","2E0578","F7FF00","FFFFFF"],["00A9D3","001179","F7FF00","FFFFFF"],["0434E3","029DD7","F7FF00","FFFFFF"],["05D6E9","071898","F7FF00","FFFFFF"],["7F0B1B","C31829","F7FF00","FFFFFF"],["D87D4F","C12A9F","F7FF00","FFFFFF"],["BC3900","FF730C","F7FF00","FFFFFF"],["9802C9","DC0168","F7FF00","FFFFFF"],["79053E","E0006F","F7FF00","FFFFFF"],["001BBA","00D0FF","F7FF00","FFFFFF"],["650C18","C60F21","F7FF00","FFFFFF"],["2D0760","6912E0","F7FF00","FFFFFF"],["D8D7E3","9D9FAD","08E164","FFFFFF"],["2D0670","6912E0","F7FF00","FFFFFF"],["00002D","00002D","C8FF00","FFFFFF"],["00265F","00002D","C8FF00","FFFFFF"],["BC3900","FF730C","C8FF00","FFFFFF"],["171D55","0054CC","F7FF00","FFFFFF"],["441208","C77D00","F7FF00","FFFFFF"],["829FA9","FFFFFF","FF0040","FFFFFF"],["829FA9","FFFFFF","08E164","FFFFFF"],["FF5013","E9DB3B","F7FF00","FFFFFF"],["051342","096E4C","",""],["9C0013","F21630","",""],["9C0013","F31630","08E164","FFFFFF"],["421777","A71621","F7FF00","FFFFFF"],["0189C4","43D5F7","F7FF00","FFFFFF"],["001718","31D9D8","F7FF00","FFFFFF"],["050F77","0039F5","F7FF00","FFFFFF"],["00002D","33337D","C8FF00","FFFFFF"],["000000","FF283D","F7FF00","FFFFFF"],["0664F0","8912FF","F7FF00","FFFFFF"],["CB3900","FF6321","",""],["4C00A9","8321FB","",""],["829FA9","FFFFFF","","FFFFFF"],["00002D","33337D","",""],["FB33F2","FF6321","",""],["9C0013","F3233D","",""],["0C6CC9","3DB5FF","",""],["C6328F","FD73B8","",""],["A90B09","FF4946","",""],["481C2B","E82077","",""],["061414","14685F","",""],["092382","2557FF","",""],["141414","545454","",""],["0664F0","8912FF","08E164","FFFFFF"],["00629A","43D5F7","08E164","FFFFFF"],["140001","3F3953","",""],["092832","2557FF","",""],["140000","403954","",""],["460000","C40001","",""],["2B2B2B","FE7A04","",""],["092382","2557FF","F7FF00","FFFFFF"],["041827","0076C9","",""],["FFB300","FFC000","F7FF00","FFFFFF"],["FB33F2","FFA312","",""],["520003","C62B29","",""],["101216","1D2027","",""],["3A6474","6E9DAF","",""],["7D726A","CDC3BC","",""],["B38EFF","FEC5FF","",""],["152C1C","198565","",""],["252424","3C3B3C","",""],["007B14","76B900","",""],["001821","0F2F3D","",""],["050F77","0039F5","",""],["2D2D2D","14161C","",""],["F5941D","F9E92A","",""],["04101D","1E3472","",""],["300083","F055D5","",""],["5A000B","FE0120","",""],["0664F0","8912FF","",""],["003A47","00B89C","",""],["0E3E7C","16519D","",""],["37561F","5B9214","",""],["010A82","0137ED","",""],["DF9A0E","EDD27B","",""],["08225F","69CBF0","",""],["30003E","BE00FF","",""],["1150B7","00D6F8","",""],["131415","2F3437","",""],["1D1D1D","4A4A4A","",""],["0E0C3D","19166F","",""],["390E70","921EE5","",""],["15476B","0FD0AB","",""],["803923","ED7E2B","",""],["473C7C","22182D","",""],["041468","2550F6","",""],["240580","7910B6","",""],["521963","AD59A2","",""],["0B0321","180B56","",""],["0E3F5C","3E7292","",""],["06010D","1A0D5E","",""],["3D1182","835AD9","",""],["000000","B80101","",""],["352A30","FD1577","FF46AB","FF46AB"],["0075FF","FB0172","","FFFFFF"],["8B008D","3C096B","","7E058F"],["8B008D","3C096B","FFFFFF","7E058F"],["39FF6F","9718E8","39FF6F","FFFFFF"],["E33404","E2C002","F7FF00","FFFFFF"]];
const CC_EV_COL={"Acrocanthosaurus_Official":0,"ArchitectPopUpDuoEU":1,"ArchitectPopUpSoloEU":2,"ArchitectPopUpSquadEU":3,"BambiRaptor":4,"BlackheartCup":5,"Bratwurst_Official":6,"CashCup_Trios1":1,"CashCup_Trios2":1,"Dinosauron_Official":7,"LuxeCup":5,"MannekenPis_Official":8,"ONSITE_WorldCup_Duos":9,"ONSITE_WorldCup_ProAm":10,"ONSITE_WorldCup_Solos":9,"ONSITE_Worldcup_Creative":9,"OnlineOpen_Week10":9,"OnlineOpen_Week1":9,"OnlineOpen_Week2":9,"OnlineOpen_Week3":9,"OnlineOpen_Week4":9,"OnlineOpen_Week5":9,"OnlineOpen_Week6":9,"OnlineOpen_Week7":9,"OnlineOpen_Week8":9,"OnlineOpen_Week9":9,"S10_CC_Champions":11,"S10_CC_Contenders":12,"S10_CC_Trios":11,"S10_FNCS_Finals":13,"S10_FNCS_Finals_Runback":13,"S10_FNCS_Week1":13,"S10_FNCS_Week2":13,"S10_FNCS_Week3":13,"S10_FNCS_Week4":13,"S10_FNCS_Week5":13,"S11_CC_Contenders":12,"S11_CelebrationCup":14,"S11_DreamhackWinter_BYOC":15,"S11_FNCS_Finals":16,"S11_FNCS_Warmup":16,"S11_FNCS_Week1":16,"S11_FNCS_Week2":16,"S11_FNCS_Week3":16,"S11_FNCS_Week4":16,"S11_FNF":17,"S11_HypeNight":18,"S11_HypeNight_Level1":18,"S11_PlatformCup_Console":19,"S11_PlatformCup_Mobile":19,"S11_PlatformCup_PC":11,"S11_WinterRoyale_Console":20,"S11_WinterRoyale_Mobile":20,"S11_WinterRoyale_PC":20,"S12_BenjyFishyCup_Round1":5,"S12_BenjyFishyCup_Round2":5,"S12_CCV2_Contenders_Round1":21,"S12_CCV2_Contenders_Round2":21,"S12_CCV2_Platform_Console_Round1":22,"S12_CCV2_Platform_Console_Round2":22,"S12_CCV2_Platform_Mobile_Round1":23,"S12_CCV2_Platform_Mobile_Round2":23,"S12_CCV2_Platform_PC_Round1":24,"S12_CCV2_Platform_PC_Round2":24,"S12_CC_Contenders_Ghost":21,"S12_CC_Contenders_Shadow":21,"S12_CC_Platform_Console_Ghost":22,"S12_CC_Platform_Console_Shadow":22,"S12_CC_Platform_Mobile_Ghost":23,"S12_CC_Platform_Mobile_Shadow":23,"S12_CC_Platform_PC_Ghost":24,"S12_CC_Platform_PC_Shadow":24,"S12_DailyDuos_Console":25,"S12_DailyDuos_PC":25,"S12_DoigbyCup":26,"S12_FNCS_Finals_Console":26,"S12_FNCS_Finals_PC":26,"S12_FNCS_Invitational_Open":26,"S12_FNCS_Invitational_Reboot":26,"S12_FNCS_Invitational_Week1":26,"S12_FNCS_Invitational_Week2":26,"S12_FNCS_Invitational_Week3":26,"S12_FNCS_Warmup_Console":26,"S12_FNCS_Warmup_PC":26,"S12_FNCS_Week1_Console":26,"S12_FNCS_Week1_PC":26,"S12_FNCS_Week2_Console":26,"S12_FNCS_Week2_PC":26,"S12_FNCS_Week3_Console":26,"S12_FNCS_Week3_PC":26,"S12_FNCS_Week4_Console":26,"S12_FNCS_Week4_PC":26,"S12_HypeNight_Level1_Ghost":27,"S12_HypeNight_Level1_Shadow":27,"S12_HypeNight_Level2_Ghost":27,"S12_HypeNight_Level2_Shadow":27,"S12_PiazzDuos":25,"S13_AmarTriosCup":28,"S13_AquaNyhroxThrowbackCup":9,"S13_BlueFlatline_EUNAE_Contender":26,"S13_BughaThrowbackCup":9,"S13_CC_Champions":21,"S13_CC_Contenders":21,"S13_CC_Platform_Console":22,"S13_CC_Platform_Mobile":23,"S13_CC_Platform_PC":24,"S13_DailyHypeCup":29,"S13_DailyTrios_Console":29,"S13_DailyTrios_PC":29,"S13_DoigCupTrios":30,"S13_Dreamhack_August_Finals":31,"S13_Dreamhack_August_Heat1":31,"S13_Dreamhack_August_Heat2":31,"S13_Dreamhack_August_SemiFinals":31,"S13_Dreamhack_July_Finals":31,"S13_Dreamhack_July_Heat1":31,"S13_Dreamhack_July_Heat2":31,"S13_Dreamhack_July_SemiFinals":31,"S13_BlueFlatlineBracket_Champion":26,"S13_BlueFlatline_Champion":26,"S13_FNCS_Finals_Console":32,"S13_FNCS_Finals_PC":32,"S13_FNCS_Qualifier1_Console":32,"S13_FNCS_Qualifier1_PC":32,"S13_FNCS_Qualifier2_Console":32,"S13_FNCS_Qualifier2_PC":32,"S13_FNCS_Qualifier3_Console":32,"S13_FNCS_Qualifier3_PC":32,"S13_FNCS_Qualifier4_Console":32,"S13_FNCS_Qualifier4_PC":32,"S13_FreeFortniteCup":33,"S13_GalaxyCupSolo":34,"S13_HypeNight":35,"S13_HypeNight_Plus":35,"S13_JacobSoloCup":30,"S13_LlobetiTriosCup":28,"S13_MongraalSoloCup":28,"S13_MrSavageTriosCup":28,"S13_RaiseTheCup":36,"S13_TwoPlayersOneConsole":30,"S14_BlackWidowCup":37,"S14_CC_Champions":38,"S14_CC_Contenders":39,"S14_CC_Platform_Console":22,"S14_CC_Platform_PC":22,"S14_DaredevilCup":37,"S14_Dreamhack_November_Finals":31,"S14_Dreamhack_November_Heat1":31,"S14_Dreamhack_November_Heat2":31,"S14_Dreamhack_November_SemiFinals":31,"S14_Dreamhack_October_Finals":31,"S14_Dreamhack_October_Heat1":31,"S14_Dreamhack_October_Heat2":31,"S14_Dreamhack_October_SemiFinals":31,"S14_Dreamhack_September_Finals":31,"S14_Dreamhack_September_Heat1":31,"S14_Dreamhack_September_Heat2":31,"S14_Dreamhack_September_SemiFinals":31,"S14_EUEncore":28,"S14_FNCS_Finals_Console":40,"S14_FNCS_Finals_Console_Grandfinals":40,"S14_FNCS_Finals_Console_Heat1":40,"S14_FNCS_Finals_Console_Heat2":40,"S14_FNCS_Finals_Console_Heat3":40,"S14_FNCS_Finals_Console_Heat4":40,"S14_FNCS_Finals_PC":40,"S14_FNCS_Finals_PC_Grandfinals":40,"S14_FNCS_Finals_PC_Heat1":40,"S14_FNCS_Finals_PC_Heat2":40,"S14_FNCS_Finals_PC_Heat3":40,"S14_FNCS_Finals_PC_Heat4":40,"S14_FNCS_Qualifier1_Console":40,"S14_FNCS_Qualifier1_PC":40,"S14_FNCS_Qualifier2_Console":40,"S14_FNCS_Qualifier2_PC":40,"S14_FNCS_Qualifier3_Console":40,"S14_FNCS_Qualifier3_PC":40,"S14_FNCS_Warmup_Console":40,"S14_FNCS_Warmup_PC":40,"S14_GhostRiderCup":37,"S14_HypeNite":35,"S14_LachlanPickaxeFrenzy":30,"S14_MarvelSuperCup":37,"S14_Season4HypeCup":41,"S14_VenomCup":37,"S14_WildWednesday":42,"S15_ACMilanCup":43,"S15_ASRomaCup":43,"S15_BhangraBoogieCup":44,"S15_CashCup":39,"S15_CyprusCup":45,"S15_Dreamhack_December_Finals":31,"S15_Dreamhack_December_Heat1":31,"S15_Dreamhack_December_Heat2":31,"S15_Dreamhack_December_SemiFinals":31,"S15_Dreamhack_January_Finals":31,"S15_Dreamhack_January_Heat1":31,"S15_Dreamhack_January_Heat2":31,"S15_Dreamhack_January_Heat3":31,"S15_Dreamhack_January_SemiFinals":31,"S15_FNCS_GrandFinals":46,"S15_FNCS_Qualifier1":46,"S15_FNCS_Qualifier2":46,"S15_FNCS_Qualifier3":46,"S15_FNCS_RebootRound":46,"S15_FNCS_SemiFinals":46,"S15_FazeCityCup":43,"S15_FlashCup":47,"S15_FloorIsLavaLTM":42,"S15_FridayNiteBraggingRights":48,"S15_FridayNiteBraggingRights_Console":48,"S15_FridayNiteBraggingRights_Mobile":48,"S15_FrostyFrenzy":49,"S15_GrefGSolo":30,"S15_GrefGSquads":30,"S15_HeartsWildCup":50,"S15_HypeCup":35,"S15_InterMilanCup":43,"S15_LazarAndFreshSuperKnockback":30,"S15_OneShotLTM":42,"S15_PSGenerationsCup":51,"S15_PeleCup":52,"S15_RagsToRichesLTM":42,"S15_SolidGoldLTM":42,"S15_SoloCashCup":39,"S15_SwitchCup3":53,"S15_TrinityCup":54,"S16_AloyCup":55,"S16_CashCupExtraDH":56,"S16_CashCup":39,"S16_CloseEncountersLTM":42,"S16_ConsoleChampionsCup":57,"S16_DeathstrokeCup":58,"S16_Dreamhack_April_Finals":31,"S16_Dreamhack_April_Heat1":31,"S16_Dreamhack_April_Heat2":31,"S16_Dreamhack_April_SemiFinals":31,"S16_EliteScrims":59,"S16_FNCS_Finals":60,"S16_FNCS_Qualifier1":60,"S16_FNCS_Qualifier2":60,"S16_FNCS_Qualifier3":60,"S16_FNCS_RebootRound":60,"S16_FNCS_SemiFinals":60,"S16_FloorIsLavaSoloLTM":42,"S16_FridayNiteBraggingRights_Console":48,"S16_FridayNiteBraggingRights_Mobile":48,"S16_FridayNiteBraggingRights_PC":48,"S16_HighExplosivesLTM":42,"S16_HypeCup":35,"S16_NeymarJrCup":61,"S16_OneShotLTM":42,"S16_OpenScrims":59,"S16_SoloCashCup":38,"S16_SpringBreakoutCup":62,"S16_TeenTitansCup":63,"S16_UEFA_Euro_Cup_2020":43,"S17_BlueCheese":43,"S17_BlueCheese_trial":43,"S17_CammyCup":64,"S17_CashCupExtraDH":65,"S17_CashCup":39,"S17_ConsoleChampionsCup":57,"S17_Dreamhack_August_Finals":31,"S17_Dreamhack_August_Prelim1":31,"S17_Dreamhack_August_Prelim2":31,"S17_Dreamhack_August_Prelim3":31,"S17_Dreamhack_August_SemiFinals":31,"S17_FNCS_Finals":66,"S17_FNCS_Qualifier1":66,"S17_FNCS_Qualifier2":66,"S17_FNCS_Qualifier3":66,"S17_FNCS_RebootRound":66,"S17_FNCS_SemiFinals":66,"S17_FNCS_SoloFinals":67,"S17_FNCS_SoloPlayIns":67,"S17_FloorIsLavaSoloLTM":42,"S17_GalaxyCup":68,"S17_GamoraCup":69,"S17_HypeCup":35,"S17_JBalvinCup":70,"S17_OneShotLTM":42,"S17_PickaxeFrenzyLTM":42,"S17_SoloCashCup":38,"S17_SuperKnockBackLTM":42,"S17_ThanosCup":69,"S17_WonderWomanCup":71,"S17_ZoneWarsLTM":42,"S18_BlueCheese":30,"S18_BlueCheese_Quick_Cup_Solo":30,"S18_BlueCheese_Quick_Cup_Trios":30,"S18_BlueCheese_Solo":30,"S18_CashCupExtraDH":65,"S18_CashCup":39,"S18_ConsoleChampionsCup":57,"S18_Dreamhack_October_Finals":31,"S18_Dreamhack_October_Prelim1":31,"S18_Dreamhack_October_Prelim2":31,"S18_Dreamhack_October_Prelim3":31,"S18_Dreamhack_October_SemiFinals":31,"S18_DuosHypeCup":72,"S18_FNCS_Finals":73,"S18_FNCS_Qualifier1":73,"S18_FNCS_Qualifier2":73,"S18_FNCS_SemiFinals_Day1":73,"S18_FNCS_SemiFinals_Day2":73,"S18_FloorRestoresLTM":42,"S18_GrandRoyaleCommunityCup":74,"S18_GrandRoyale_Finals":75,"S18_GrandRoyale_Load":75,"S18_GrandRoyale_Reload":75,"S18_GrandRoyale_VictoryPath":75,"S18_PlaystationCup":51,"S18_PreseasonWarmup":76,"S18_SoloCashCup":38,"S18_TriosHypeCup":72,"S19_AllValleyCup":77,"S19_ConsoleChampionsCup":57,"S19_DuosCashCup":39,"S19_DuosHypeCup_Contender":39,"S19_DuosHypeCup_Open":39,"S19_FNCSCommunityCup":78,"S19_FNCS_Finals":79,"S19_FNCS_Qualifier1":79,"S19_FNCS_Qualifier2":79,"S19_FNCS_SemiFinals":79,"S19_LCBestOf":42,"S19_LCHighScore":42,"S19_PlaystationCupMarch":80,"S19_PlaystationCup":80,"S19_SilkSonicCup":81,"S19_SoloCashCup":38,"S19_SoloHypeCup_Contender":38,"S19_SoloHypeCup_Open":38,"S19_ThriveCup":82,"S19_TriosHypeCup_Champion":72,"S19_TriosHypeCup_Contender":72,"S19_TriosHypeCup_Open":72,"S20_AliaACup":83,"S20_AndroidStreetFighterCup":84,"S20_ChicaCup":85,"S20_ChloeKimCup":86,"S20_ConsoleChampionsCup":87,"S20_DuosCashCup":88,"S20_DuosHypeCup_Contender":89,"S20_DuosHypeCup_Open":89,"S20_FNCSCommunityCup":90,"S20_FNCS_Finals":79,"S20_FNCS_Qualifier1":79,"S20_FNCS_Qualifier2":79,"S20_FNCS_Qualifier3":79,"S20_FNCS_SemiFinals":79,"S20_LCArchitectDuos":42,"S20_LCElegantWeaponsDuos":42,"S20_LCElimOnlyDuos":42,"S20_LCElimOnlyHighScoreDuos":42,"S20_LCElimOnlyHighScoreTrios":42,"S20_LCElimOnlySolo":42,"S20_LCMicroSessionsDuos":42,"S20_LCMicroSessionsTriosZBM":42,"S20_LCNoBuildDuos":42,"S20_LCNoBuildSquads":42,"S20_LCStartingLoadoutDuos":42,"S20_LCStartingLoadoutSolos":42,"S20_LCSuperBlitzDuos":42,"S20_ObiWanCup":91,"S20_PlaystationCupApril_Round1":80,"S20_PlaystationCupMay_Round1":80,"S20_PlaystationCupMay_Round2":80,"S20_PlaystationCupMay_Round3":80,"S20_SoloCashCup":88,"S20_SoloHypeCup_Contender":89,"S20_SoloHypeCup_Open":89,"S20_StreetFighterCup":84,"S20_TriosHypeCup_Champion":89,"S20_TriosHypeCup_Contender":89,"S21_ConsoleChampionsCupZBM":92,"S21_ConsoleChampionsCup":92,"S21_DreamerCup":93,"S21_DreamhackSummer":31,"S21_DreamhackSummerZBM":31,"S21_DuosCashCup":94,"S21_DuosHypeCup_Contender":95,"S21_DuosHypeCup_Open":95,"S21_FNCS_Finals":79,"S21_FNCS_Qualifier1":79,"S21_FNCS_Qualifier2":79,"S21_FNCS_Qualifier3":79,"S21_FNCS_SemiFinals":79,"S21_GalaxyCup":96,"S21_JewelRush":97,"S21_LCArchitectSolo":42,"S21_LCElimOnlyHighScoreDuos":42,"S21_LCElimOnlyHighScoreZBMSquads":42,"S21_LCHotDropDuos":42,"S21_LCNoSweatDuos":42,"S21_LCNoSweatSolo":42,"S21_LCNoSweatSquadsZBM":42,"S21_LCNoSweatTrios":42,"S21_LCQuickCupTriosZBM":42,"S21_LCQuickCup":42,"S21_LCStartingLoadoutDuos":42,"S21_LCStartingLoadoutSolo":42,"S21_LCTargetPracticeDuos":42,"S21_LCWildStormDuos":42,"S21_LGSoloCashCup":97,"S21_LGSoloQuickCup":97,"S21_LGSolosQuickCup_BR":97,"S21_LGSolosQuickCup":97,"S21_LGSolosQuickCup_ME":97,"S21_LGTriosCashCup":97,"S21_LGTriosQuickCup":97,"S21_PgodCup":98,"S21_PlaystationCupAug":93,"S21_PlaystationCupJuly":96,"S21_PlaystationCupJune":96,"S21_QuarterbackCup":99,"S21_SoloCashCupConsole":100,"S21_SoloCashCup":100,"S21_SoloHypeCup_Contender":95,"S21_SoloHypeCup_Open":95,"S21_SommersetCup":98,"S21_SuperHypeCup":95,"S21_TournamentOfPower":101,"S21_TriosCashCupZBM":88,"S21_TriosQuickCashCup":102,"S22_ConsoleChampionsCup":103,"S22_DivisionalCups_Challenger":93,"S22_DivisionalCups_Contender":93,"S22_DivisionalCups_Elite":93,"S22_DivisionalCups_Elite_Finals":93,"S22_FNCSInvitationalCommunityCup":79,"S22_Invitational":79,"S22_PlacementCup":93,"S22_PlaystationCupNov":93,"S22_PlaystationCupOct":96,"S22_PlaystationCupSep":104,"S22_PoloStadiumCup":105,"S22_QueasyCup":98,"S22_SypherPKIconCup":106,"S22_ZBMCashCup":105,"S22_ZBMQuickCup":105,"S23_CreedCup":105,"S23_DivisionalCups_Challenger":93,"S23_DivisionalCups_Contender":93,"S23_DivisionalCups_Elite":93,"S23_DivisionalCups_Elite_Finals":93,"S23_DuosFillQuickCup":93,"S23_FNCS_CommunityCup":107,"S23_FNCS_Major1_GrandFinals":107,"S23_FNCS_Major1_SurgeWeek":107,"S23_FNCS_Major1_Week1":107,"S23_FNCS_Major1_Week2":107,"S23_FNCS_Major1_Week3":107,"S23_LGSoloCashCup":106,"S23_LGSoloQuickCup":106,"S23_LGTriosCashCup":106,"S23_LGTriosQuickCup":106,"S23_Lettuce":103,"S23_PlacementCup":93,"S23_PlaystationCupFeb":93,"S23_PlaystationCupJan":93,"S23_SoloCashCup":93,"S23_SuperFlakesCup":93,"S23_ThunderCup":42,"S23_ZBMCashCup":101,"S23_ZBMQuickCupFill":101,"S23_ZBMQuickCup":101,"S23_thekidlaroi":103,"S24_ConsoleChampionsCupMay":108,"S24_ConsoleChampionsCup":108,"S24_DuosCashCup":93,"S24_DuosFillQuickCup":93,"S24_FNCS_CommunityCup":107,"S24_FNCS_Major2_GrandFinals":107,"S24_FNCS_Major2_SurgeWeek":107,"S24_FNCS_Major2_Week1":107,"S24_FNCS_Major2_Week2":107,"S24_FNCS_Major2_Week3":107,"S24_MamaBenjyFishy":93,"S24_PlaystationCupMar":93,"S24_RenegadeRunnerCupBuildZB":103,"S24_RenegadeRunnerCupBuild":103,"S24_SoloVictoryCup":93,"S24_TriosZBVictoryCashCup":101,"S24_ZBTriosFillQuickCup":101,"S25_ConsoleChampionsCup":108,"S25_DuosCashCup":93,"S25_DuosFillQuickCup":93,"S25_DuosZBVictoryCashCup":93,"S25_FNCSCommunityCup":107,"S25_FNCS_LastChanceMajor":107,"S25_FNCS_Major3_GrandFinals":107,"S25_FNCS_Major3_Week1":107,"S25_FNCS_Major3_Week2":107,"S25_FNCS_Major3_Week3":107,"S25_GalaxyCup4Android":93,"S25_GalaxyCup4":93,"S25_JJKCup":93,"S25_PerfEvaluation":93,"S25_PlaystationCupJune":93,"S25_PlaystationCupZBJune":93,"S25_SoloVictoryCashCup":93,"S25_ZBDuosFillQuickCup":93,"S26_ConsoleChampionsCupZB":108,"S26_ConsoleChampionsCup":108,"S26_DuosCashCup":93,"S26_DuosZBVictoryCashCup":93,"S26_FNCSCommunityCup":4,"S26_MixUpMondaysBR":93,"S26_MixUpMondaysZB":93,"S26_PerfEvaluation":93,"S26_PlaystationCupSeptember":93,"S26_PlaystationCupZBSeptember":93,"S26_SoloVictoryCashCup":93,"S27_DuosZBVictoryCashCup":93,"S27_OGAmar_Duos":93,"S27_OGGrefg_Duos":93,"S27_OGGrefg_Squads":93,"S27_OGInoxtag_Duos":93,"S27_OGJacob_Duos":93,"S27_RankedCupBronzeDuos":109,"S27_RankedCupBronzeSolo":109,"S27_RankedCupBronzeSquads":109,"S27_RankedCupDiamondDuos":109,"S27_RankedCupDiamondSolo":109,"S27_RankedCupDiamondSquads":109,"S27_RankedCupGoldDuos":109,"S27_RankedCupGoldSolo":109,"S27_RankedCupGoldSquads":109,"S27_RankedCupPlatinumDuos":109,"S27_RankedCupPlatinumSolo":109,"S27_RankedCupPlatinumSquads":109,"S27_RankedCupSilverDuos":109,"S27_RankedCupSilverSolo":109,"S27_RankedCupSilverSquads":109,"S27_RankedCupZBBronzeDuos":109,"S27_RankedCupZBBronzeSolo":109,"S27_RankedCupZBBronzeSquads":109,"S27_RankedCupZBDiamondDuos":109,"S27_RankedCupZBDiamondSolo":109,"S27_RankedCupZBDiamondSquads":109,"S27_RankedCupZBGoldDuos":109,"S27_RankedCupZBGoldSolo":109,"S27_RankedCupZBGoldSquads":109,"S27_RankedCupZBPlatinumDuos":109,"S27_RankedCupZBPlatinumSolo":109,"S27_RankedCupZBPlatinumSquads":110,"S27_RankedCupZBSilverDuos":109,"S27_RankedCupZBSilverSolo":109,"S27_RankedCupZBSilverSquads":109,"S27_SoloVictoryCashCup":93,"S28_ConsoleCashCupsZB":103,"S28_ConsoleCashCups":103,"S28_DuosCashCup":93,"S28_DuosZBVictoryCashCup":93,"S28_FNCSCommunityCups_v1":107,"S28_FNCSCommunityCups_v2":4,"S28_FNCS_Major1_GrandFinals":107,"S28_FNCS_Major1_Qualifier1":107,"S28_FNCS_Major1_Qualifier2":107,"S28_FNCS_Major1_SemiFinalLowerBracket":107,"S28_FNCS_Major1_SemiFinalUpperBracket":107,"S28_MixUpMondaysBR":93,"S28_MixUpMondaysZB":93,"S28_PerformanceEvaluation":93,"S28_PlaystationCupDecember":96,"S28_PlaystationCupZBDecember":93,"S28_RankedCupBronzeDuos":109,"S28_RankedCupBronzeSolo":109,"S28_RankedCupBronzeSquads":109,"S28_RankedCupDiamondDuos":109,"S28_RankedCupDiamondSolo":109,"S28_RankedCupDiamondSquads":109,"S28_RankedCupGoldDuos":109,"S28_RankedCupGoldSolo":109,"S28_RankedCupGoldSquads":109,"S28_RankedCupPlatinumDuos":109,"S28_RankedCupPlatinumSolo":109,"S28_RankedCupPlatinumSquads":109,"S28_RankedCupSilverDuos":109,"S28_RankedCupSilverSolo":109,"S28_RankedCupSilverSquads":109,"S28_RankedCupZBBronzeDuos":109,"S28_RankedCupZBBronzeSolo":109,"S28_RankedCupZBBronzeSquads":109,"S28_RankedCupZBDiamondDuos":109,"S28_RankedCupZBDiamondSolo":109,"S28_RankedCupZBDiamondSquads":109,"S28_RankedCupZBGoldDuos":109,"S28_RankedCupZBGoldSolo":109,"S28_RankedCupZBGoldSquads":109,"S28_RankedCupZBPlatinumDuos":109,"S28_RankedCupZBPlatinumSolo":109,"S28_RankedCupZBPlatinumSquads":110,"S28_RankedCupZBSilverDuos":109,"S28_RankedCupZBSilverSolo":109,"S28_RankedCupZBSilverSquads":109,"S28_SoloVictoryCashCup":93,"S29_ConsoleCashCupsZB":106,"S29_ConsoleCashCups":106,"S29_DuosCashCup":93,"S29_DuosZBVictoryCashCup":106,"S29_FNCSCommunityCups_v1":107,"S29_FNCSCommunityCups_v2":4,"S29_FNCS_Major2_GrandFinals":107,"S29_FNCS_Major2_Qualifier1":107,"S29_FNCS_Major2_Qualifier2":107,"S29_FNCS_Major2_SemiFinalLowerBracket":107,"S29_FNCS_Major2_SemiFinalUpperBracket":107,"S29_MixUpMondaysBR":93,"S29_MixUpMondaysZB":93,"S29_PerformanceEvaluation":93,"S29_PlaystationCupMarch":96,"S29_PlaystationCupZBMarch":93,"S29_RankedCupBronzeDuos":109,"S29_RankedCupBronzeSolo":109,"S29_RankedCupBronzeSquads":109,"S29_RankedCupDiamondDuos":109,"S29_RankedCupDiamondSolo":109,"S29_RankedCupDiamondSquads":109,"S29_RankedCupEliteDuos":109,"S29_RankedCupEliteSolo":109,"S29_RankedCupEliteSquads":109,"S29_RankedCupGoldDuos":109,"S29_RankedCupGoldSolo":109,"S29_RankedCupGoldSquads":109,"S29_RankedCupPlatinumDuos":109,"S29_RankedCupPlatinumSolo":109,"S29_RankedCupPlatinumSquads":109,"S29_RankedCupSilverDuos":109,"S29_RankedCupSilverSolo":109,"S29_RankedCupSilverSquads":109,"S29_RankedCupZBBronzeDuos":109,"S29_RankedCupZBBronzeSolo":109,"S29_RankedCupZBBronzeSquads":109,"S29_RankedCupZBDiamondDuos":109,"S29_RankedCupZBDiamondSolo":109,"S29_RankedCupZBDiamondSquads":109,"S29_RankedCupZBEliteDuos":109,"S29_RankedCupZBEliteSolo":109,"S29_RankedCupZBEliteSquads":109,"S29_RankedCupZBGoldDuos":109,"S29_RankedCupZBGoldSolo":109,"S29_RankedCupZBGoldSquads":109,"S29_RankedCupZBPlatinumDuos":109,"S29_RankedCupZBPlatinumSolo":109,"S29_RankedCupZBPlatinumSquads":110,"S29_RankedCupZBSilverDuos":109,"S29_RankedCupZBSilverSolo":109,"S29_RankedCupZBSilverSquads":109,"S29_RiseofMidasCup":111,"S29_SoloVictoryCashCup":106,"S30_ConsoleCashCups":106,"S30_DuosCashCupZB":93,"S30_DuosCashCup":93,"S30_FNCSCommunityCups_v1":107,"S30_FNCSCommunityCups_v2":4,"S30_FNCS_Major3_GrandFinals":107,"S30_FNCS_Major3_Qualifier1":107,"S30_FNCS_Major3_Qualifier2":107,"S30_FNCS_Major3_SemiFinalLowerBracket":107,"S30_FNCS_Major3_SemiFinalUpperBracket":107,"S30_MetallicaCup":101,"S30_NickEh":105,"S30_OpenDuosCupBR":93,"S30_OpenDuosCupZB":101,"S30_OpenTriosCupBR":93,"S30_OpenTriosCupZB":101,"S30_PerformanceEvaluation":93,"S30_PlaystationCupJune":96,"S30_PlaystationCupZBJune":93,"S30_RankedCupBSGDuos":109,"S30_RankedCupBSGSolo":109,"S30_RankedCupBSGSquads":109,"S30_RankedCupEliteDuos":109,"S30_RankedCupEliteSolo":109,"S30_RankedCupEliteSquads":109,"S30_RankedCupPDDuos":109,"S30_RankedCupPDSolo":109,"S30_RankedCupPDSquads":109,"S30_RankedCupZBBSGDuos":109,"S30_RankedCupZBBSGSolo":109,"S30_RankedCupZBBSGSquads":109,"S30_RankedCupZBPlatinumDuos":109,"S30_RankedCupZBPlatinumSolo":109,"S30_RankedCupZBPlatinumSquads":110,"S30_ReloadZB":93,"S30_Reload":93,"S30_SoloVictoryCashCup":106,"S30_SoloZBVictoryCashCup":106,"S30_SquadsVictoryCashCup":106,"S30_d4vd_Cup":93,"S31_DuosCashCupZB":101,"S31_DuosCashCup":93,"S31_FNCSCommunityCups_KunoRenzo":4,"S31_FNCSCommunityCups_Kyra":4,"S31_FNCSCommunityCups_Siren":107,"S31_FNCSCommunityCups_Sparkplug":107,"S31_FNCSCommunityCups_Stashd":107,"S31_InfluencerCup":93,"S31_PerformanceEvaluation":93,"S31_PlatformReloadDuosCashCupConsole":93,"S31_PlatformReloadDuosCashCupMobile":93,"S31_PlatformReloadDuosCashCupPC":93,"S31_PlaystationSypherPKCup":93,"S31_RankedCupBRBSGDuos":109,"S31_RankedCupBREliteDuos":109,"S31_RankedCupBRPDDuos":109,"S31_RankedCupBSGDuos":109,"S31_RankedCupEliteDuos":109,"S31_RankedCupPDDuos":109,"S31_RankedCupZBBSGDuos":109,"S31_RankedCupZBPlatinumDuos":109,"S31_RankedCupZB_BSGDuos":109,"S31_RankedCupZB_PlatinumDuos":109,"S31_RubiusIconCup":112,"S31_SoloVictoryCashCup":106,"S31_SoloZBVictoryCashCup":106,"S31_SquadsReloadCup":93,"S31_SymbioteCup":106,"S31_TriosCashCup":93,"S32_FNCSCommunityCups":107,"S32_PerformanceEvaluation":93,"S32_PlatformReloadDuosCashCupConsole":93,"S32_PlatformReloadDuosCashCupMobile":93,"S32_PlatformReloadDuosCashCupPC":93,"S32_RankedCupBSGDuos":109,"S32_RankedCupBSGSolo":109,"S32_RankedCupEliteDuos":109,"S32_RankedCupEliteSolo":109,"S32_RankedCupPDDuos":109,"S32_RankedCupPDSolo":109,"S32_RankedCupZBBSGDuos":109,"S32_RankedCupZBBSGSolo":109,"S32_RankedCupZBPlatinumDuos":109,"S32_RankedCupZBPlatinumSolo":109,"S32_SoloVictoryCashCup":113,"S32_SoloZBVictoryCashCup":113,"S32_SquadsReloadCup":93,"S32_TriosCashCup":93,"S32_TriosCashCup_ZB":101,"S33_FNCSCommunityCups":107,"S33_FNCSDivisionalCup_Division1":107,"S33_FNCSDivisionalCup_Division2":107,"S33_FNCSDivisonalCup_Division3":107,"S33_FNCSMajor1_Final":114,"S33_FNCSMajor1_GroupStage":114,"S33_FNCSMajor1_LastChanceQualifier":115,"S33_FNCSMajor1_PlayInStage":115,"S33_FNCS_Trial":107,"S33_OGCommunityCupZB":93,"S33_OGCommunityCup":93,"S33_OGCupZB":93,"S33_OGCup":93,"S33_PerformanceEvaluation":93,"S33_PlaystationCup":96,"S33_RankedCupBSGDuos":109,"S33_RankedCupBSGSolo":109,"S33_RankedCupBSSolo":109,"S33_RankedCupEliteDuos":109,"S33_RankedCupEliteSolo":109,"S33_RankedCupPDDuos":109,"S33_RankedCupPDSolo":109,"S33_SoloCashCup":101,"S34_ClixIconCup":116,"S34_EliteZadieCup":117,"S34_FNCSCommunityCups":118,"S34_FNCSDivisionalCup_Division1":119,"S34_FNCSDivisionalCup_Division2":119,"S34_FNCSDivisionalCup_Division3":119,"S34_FNCSMajor2_Final":114,"S34_FNCSMajor2_GroupStage":115,"S34_FNCSMajor2_LastChanceQualifier":115,"S34_FNCSMajor2_PlayInStage":115,"S34_LanternFestCup":120,"S34_OGCupZB":121,"S34_OGCup":121,"S34_PerformanceEvaluationReloadAll":122,"S34_PerformanceEvaluationReload":122,"S34_PerformanceEvaluation":122,"S34_PlaystationCup":123,"S34_RankedCupBSGDuos":124,"S34_RankedCupBSGSolo":124,"S34_RankedCupEliteDuos":124,"S34_RankedCupEliteSolo":124,"S34_RankedCupPDDuos":124,"S34_RankedCupPDSolo":124,"S34_ShoheiOhtaniCup":125,"S34_SoloCashCup":126,"S34_ThunderboltsCup":127,"S35_FNCSCommunityCups_Bugha":128,"S35_FNCSCommunityCups_Clix":128,"S35_FNCSCommunityCups_Lachlan":128,"S35_FNCSCommunityCups_Loserfruit":128,"S35_FNSCShowdown":129,"S35_OGCupZB":121,"S35_OGCup":121,"S35_PerformanceEvaluation":122,"S35_RankedCupBSGDuos":130,"S35_RankedCupBSGSolo":130,"S35_RankedCupBSGTrios":130,"S35_RankedCupEliteDuos":130,"S35_RankedCupEliteSolo":130,"S35_RankedCupEliteTrios":130,"S35_RankedCupPDDuos":130,"S35_RankedCupPDSolo":130,"S35_RankedCupPDTrios":130,"S35_ReloadRankedCup_BSG_Duos":130,"S35_ReloadRankedCup_Elite_Duos":130,"S35_ReloadRankedCup_PD_Duos":130,"S35_VictoryDuosCup":131,"S36_FNCSCommunityCup":132,"S36_FNCSDivisionalCup_Division1":119,"S36_FNCSDivisionalCup_Division2":119,"S36_FNCSDivisionalCup_Division3":119,"S36_FNCSMajor3_Final":114,"S36_FNCSMajor3_GroupStage":115,"S36_FNCSMajor3_LastChanceQualifier":115,"S36_FNCSMajor3_PlayInStage":115,"S36_FantasticFourCups":133,"S36_OGCups_BR":121,"S36_OGCups_ZB":121,"S36_PerformanceEvaluation":122,"S36_PlayStationCup":123,"S36_RangerCup_Pink":134,"S36_RangerCup_Red":135,"S36_RankedCupReloadDuos":130,"S36_RankedCupSolo":130,"S36_RankedCupTrios":130,"S36_SquidGroundVictoryDuosCup":136,"S36_SquidGroundsCups":137,"S36_VictoryDuosCup":131,"S37_AceWildCardCup":138,"S37_AceWildCardCup_Group2":138,"S37_AceWildCardCup_Group3":138,"S37_AxeOfChampionsCup":138,"S37_AxeOfChampsBlitzMobileCup":138,"S37_BladeOfChampsCupGroup2":138,"S37_BladeOfChampsCupGroup3":138,"S37_BladeOfChampsCup":138,"S37_BlitzCupOneSwing":139,"S37_BlitzCupsAllPlatforms":139,"S37_BlitzCups":139,"S37_BlitzMobileCupWeekly":139,"S37_BlitzMobileCup":139,"S37_ChampionCrystalCup":138,"S37_ChampionPJCup":138,"S37_ConsoleDuosCashCups":131,"S37_DuosDivisionalCupTrial":140,"S37_DuosDivisionalCup_Division1":141,"S37_DuosDivisionalCup_Division2":141,"S37_DuosDivisionalCup_Division3":141,"S37_DuosDivisionalCup_Division4":141,"S37_DuosDivisionalCup_Division5":141,"S37_EarlyAccessCup":142,"S37_EliteZadieCup":143,"S37_EliteZadieCup_Group2":143,"S37_EliteZadieCup_Group3":143,"S37_FNCSCommunityCups_Bugha":138,"S37_FNCSCommunityCups_Clix":138,"S37_FNCSCommunityCups_Lachlan":138,"S37_FNCSCommunityCups_Loserfruit":138,"S37_FNCSDivisionalCup_Division1":7,"S37_FNCSDivisionalCup_Division2":7,"S37_FNCSDivisionalCup_Division3":7,"S37_FrenchWeekly":130,"S37_HauntedCupJason":144,"S37_HauntedCupWednesday":144,"S37_KaiCenatIconCup":145,"S37_MrSavageIconCup":146,"S37_OGCups_BR":121,"S37_OGCups_ZB":121,"S37_PerformanceEvaluationDuos":122,"S37_PerformanceEvaluation":122,"S37_PlayStationCup":147,"S37_RankedCupDuos":130,"S37_RankedCupReloadDuos":130,"S37_RankedCupSolo":130,"S37_ReloadQuickCup":148,"S37_ReloadQuickCup_Group2":148,"S37_ReloadQuickCup_Group3":148,"S37_SoloSeriesCup":149,"S37_SurfWitchBlitzMobileCup":8,"S37_SurfWitchCup":8,"S38_BlitzMobileCup":139,"S38_DuosVictoryCup":150,"S38_OGCup_BR":121,"S38_OGCup":121,"S38_OGCup_ZB":121,"S38_PerformanceEvaluation":122,"S38_PlayStationCupReload":147,"S38_RankedCupDuosBR":130,"S38_RankedCupDuosZB":130,"S38_RankedCupReloadDuos":130,"S38_RankedCupSolo":130,"S38_ReloadQuickCup":148,"S38_ReloadQuickCup_Group2":148,"S38_ReloadQuickCup_Group3":148,"S38_SoloSeriesCup":149,"S38_SquadsVictoryCup":150,"S38_StrangerThingsCup":151,"S38_StrangerThingsMobileCup":151,"S38_TouchOnlyMobileCup":139,"S39_1MillionUnrealCup":152,"S39_BleachCup":153,"S39_DuosConsoleVictoryCupZB_Jan":150,"S39_DuosVictoryCup":150,"S39_FNCSDivisionalCupTrial":6,"S39_FNCSDivisionalCup_Division1":6,"S39_FNCSDivisionalCup_Division2":6,"S39_FNCSDivisionalCup_Division3":6,"S39_FNCSDivisionalCup_Division4":6,"S39_FNCSDivisionalCup_Division5":6,"S39_KPDHCup":154,"S39_KizunaAICupMobile":155,"S39_KizunaAICup":155,"S39_LanternFestCupMobile":156,"S39_LanternFestCup":156,"S39_MobileSeriesCupFebQual":157,"S39_MobileSeriesCupJanQual":157,"S39_MobileSeriesCupMarQual":157,"S39_MobileSeriesFeb":157,"S39_MobileSeriesJan":157,"S39_MobileSeriesMar":157,"S39_NvidiaCup":158,"S39_PerformanceEvaluation":122,"S39_PickleRickCup":159,"S39_PlayStationCupZB":160,"S39_PlayStationCup":160,"S39_RankedCupDuosBR":130,"S39_RankedCupDuosZBJan":130,"S39_RankedCupReloadDuosDec":161,"S39_RankedCupReloadDuosJan":130,"S39_RankedCupSoloDec":161,"S39_RankedCupSoloJan":130,"S39_ReloadCashVictoryCup_Dec":162,"S39_ReloadCashVictoryCup_Jan":150,"S39_ReloadEliteSeries1Final":163,"S39_ReloadEliteSeries1Heat1":163,"S39_ReloadEliteSeries1Heat2":163,"S39_ReloadEliteSeries1Heat3":163,"S39_ReloadEliteSeries1Heat4":163,"S39_ReloadEliteSeries1Opens":163,"S39_ReloadEliteSeries1PlayIn":163,"S39_ReloadEliteSeries2Final":163,"S39_ReloadEliteSeries2Heat1":163,"S39_ReloadEliteSeries2Heat2":163,"S39_ReloadEliteSeries2Heat3":163,"S39_ReloadEliteSeries2Heat4":163,"S39_ReloadEliteSeries2Opens":163,"S39_ReloadEliteSeries2PlayIn":163,"S39_SoloLevelingCup":164,"S39_SoloLevelingMobileCup":164,"S39_SoloSeriesCupFinal":149,"S39_SoloSeriesCupHeats":149,"S39_SoloSeriesCup":149,"S39_SoloVictoryCup":150,"S40_BakMobileCup":165,"S40_CashCup_TriosZB":166,"S40_ChampionKorFNCSCupMobile":167,"S40_ChampionKorFNCSCup":167,"S40_ConsoleCC_TriosZB":150,"S40_ConsoleVCC_SolosZB":150,"S40_DuckythegamerCupMobile":168,"S40_DuosReloadVictoryCup":150,"S40_FNCSDivisionalCup_Division1":6,"S40_FNCSDivisionalCup_Division2":6,"S40_FNCSDivisionalCup_Division3":6,"S40_FNCSDivisionalCup_Division4":6,"S40_FNCSDivisionalCup_Division5":6,"S40_FNCSMajor1_Final":6,"S40_FNCSMajor1_HeatsStage":6,"S40_FNCSMajor1_LastChanceQualifier":6,"S40_FNCSMajor1_PlayInStage":6,"S40_FNCSMajor1_SecondChance":6,"S40_MandalorianCup":169,"S40_MandalorianCup_ZB":169,"S40_MandalorianMobileCup":169,"S40_MobileSeriesApr":157,"S40_MobileSeriesCupQual":157,"S40_MobileSeriesMar":157,"S40_MobileSeriesMay":157,"S40_PerformanceEvaluationReload":122,"S40_PerformanceEvaluation":122,"S40_PlayStationCupClixZB":170,"S40_PlayStationCupClix":170,"S40_PlayStationCupMrSavageZB":170,"S40_PlayStationCupMrSavage_Final":170,"S40_PlayStationCupMrSavage_Qualifier":170,"S40_RankedCupDuosZB":130,"S40_RankedCupDuos":130,"S40_RankedCupReloadDuos":130,"S40_RankedCupSolo":130,"S40_ReloadEliteSeries3Final":163,"S40_ReloadEliteSeries3Heat1":163,"S40_ReloadEliteSeries3Heat2":163,"S40_ReloadEliteSeries3Heat3":163,"S40_ReloadEliteSeries3Heat4":163,"S40_ReloadEliteSeries3Opens":163,"S40_ReloadEliteSeries3PlayIn":163,"S40_ShowdownSeries_BuffPerryCup":171,"S40_ShowdownSeries_BuzzLightyearCup":171,"S40_ShowdownSeries_DaffyCup":172,"S40_ShowdownSeries_DrDoofenshmirtzCup":172,"S40_ShowdownSeries_EmperorZurgCup":172,"S40_ShowdownSeries_JonSnow":171,"S40_ShowdownSeries_NightKing":172,"S40_SoloVictoryCup":150,"S40_SpidergamerCupMobile":173,"S40_TheDonatoMobileCup":174,"S40_TripleThreatCup":175,"S40_TripleThreatMobileCup":175,"S40_TypicalGamerCup":176,"S41_ConsoleVCC_SolosZB":150,"S41_DavidBeckham":177,"S41_DavidBeckham_ZB":177,"S41_FNCSCommunityCup":167,"S41_FNCSCommunityCup_Mobile":167,"S41_FNCSCommunityCup_ZB":167,"S41_FNCSDivisionalCup_Division1":6,"S41_FNCSDivisionalCup_Division2":6,"S41_FNCSDivisionalCup_Division3":6,"S41_FNCSDivisionalCup_Division4":6,"S41_FNCSDivisionalCup_Division5":6,"S41_FNCSLastChanceMajor":6,"S41_FNCSMajor2_Final":6,"S41_FNCSMajor2_HeatsStage":6,"S41_FNCSMajor2_LastChanceQualifier":6,"S41_FNCSMajor2_PlayInStage":6,"S41_MobileSeriesCupQual":157,"S41_MobileSeriesHeat1":157,"S41_MobileSeriesHeat2":157,"S41_MobileSeriesHeat3":157,"S41_MobileSeriesHeat4":157,"S41_MobileSeriesOpen":157,"S41_MobileVictoryCup_BR":150,"S41_MobileVictoryCup_RES":150,"S41_MobileVictoryCup_ReloadminiV":150,"S41_MobileVictoryCup_ZBReload":150,"S41_MobileVictoryCup_ZB":150,"S41_MongraalIconCup":178,"S41_PSCupDaysOfPlay":160,"S41_PSCupDaysOfPlay_ZB":160,"S41_PSTypicalGamer":170,"S41_PSTypicalGamer_ZB":170,"S41_PerformanceEvaluationReload":122,"S41_PerformanceEvaluation":122,"S41_RankedCupDuosZB":130,"S41_RankedCupDuos":130,"S41_RankedCupReloadDuos":130,"S41_RankedCupSoloReload":130,"S41_RankedCupSolo":130,"S41_ReloadEliteSeries4Final":163,"S41_ReloadEliteSeries4Heat1":163,"S41_ReloadEliteSeries4Heat2":163,"S41_ReloadEliteSeries4Heat3":163,"S41_ReloadEliteSeries4Heat4":163,"S41_ReloadEliteSeries4Opens":163,"S41_ReloadEliteSeries4PlayIn":163,"S41_ReloadReloadSoloVictoryCup":150,"S41_SoloVictoryCup":150,"S41_SupergirlCup":179,"S41_SupergirlCup_ZB":179,"S41_SupergirlMobileCup":179,"S41_TheOdysseyCup":180,"S41_TheOdysseyCup_Mobile":180,"S41_TheOdysseyCup_ZB":180,"S41_ViniJr":179,"S41_ViniJr_Mobile":179,"S41_ViniJr_ZB":179,"S42_ArenaPerfEval":181,"S42_ChampionFocusFNCSCup":182,"S42_ChampionFocusFNCSCup_ZB":182,"S42_ChampionFocusFNCSMobileCup":182,"S42_ConsoleVCC_SolosZB":150,"S42_CrashBandicootCup":183,"S42_CrashBandicootCup_ZB":183,"S42_CrashBandicootMobileCup":183,"S42_CyperpranksCup":183,"S42_CyperpranksCup_Mobile":183,"S42_CyperpranksCup_ZB":183,"S42_FNCSDivisionalCup_Division1":6,"S42_FNCSDivisionalCup_Division2":6,"S42_FNCSDivisionalCup_Division3":6,"S42_FNCSDivisionalCup_Division4":6,"S42_FNCSDivisionalCup_Division5":6,"S42_FNCSSoloFastTracks":6,"S42_FNCSSoloQualifiers":6,"S42_FNCSSolo_Final":6,"S42_FNCSSolo_HeatsStage":6,"S42_FNCSSolo_LastChanceQualifier":6,"S42_IronmouseIconCup":184,"S42_IronmouseIconCup_ZB":184,"S42_KingdomHeartsCup":185,"S42_KingdomHeartsCup_Mobile":185,"S42_KingdomHeartsCup_ZB":185,"S42_MadisonBeerIconCup":186,"S42_MadisonBeerIconCup_Mobile":186,"S42_MadisonBeerIconCup_ZB":186,"S42_MegaManCup":183,"S42_MegaManCup_Mobile":183,"S42_MegaManCup_ZB":183,"S42_MobileSeriesCupSemiFinal":157,"S42_MobileSeriesGroup1":157,"S42_MobileSeriesGroup2":157,"S42_MobileSeriesLCQ":157,"S42_MobileVictoryCup_ReloadminiV":150,"S42_PSNickEh30":170,"S42_PSNickEh30_ZB":170,"S42_PerformanceEvaluation":122,"S42_Persona5Cup":183,"S42_Persona5Cup_Mobile":183,"S42_Persona5Cup_ZB":183,"S42_RankedCupDuos":130,"S42_RankedCupDuos_ZB":130,"S42_RankedCupReloadDuos":130,"S42_RankedCupReloadDuos_ZB":130,"S42_RankedCupSoloReload":130,"S42_RankedCupSoloReload_ZB":130,"S42_RankedCupSolo":130,"S42_RankedCupSolo_ZB":130,"S42_ReloadDuosVictoryCup":150,"S42_ReloadReloadSoloVictoryCup":150,"S42_ShadowCup":187,"S42_ShadowCup_Mobile":187,"S42_ShadowCup_ZB":187,"S42_SoloVictoryCup":150,"S42_TheHectorino_Mobile":188,"S42_WeezyIconCup":189,"S42_WeezyIconCup_ZB":189,"ScallywagCup":5,"ShareTheLove_Champion_Duo":190,"ShareTheLove_Champion_Solo":190,"ShareTheLove_Contender_Duo":190,"ShareTheLove_Contender_Solo":190,"ShareTheLove_Open_Duo":190,"ShareTheLove_Open_Solo":190,"ShareTheLove_Placement_Duo":190,"ShareTheLove_Placement_Solo":190,"ShareTheLove_Prospect_Duo":190,"ShareTheLove_Prospect_Solo":190,"SourDropper_LoveAndWar":191,"SourDropper_WeekendTournament_Day1":192,"SourDropper_WeekendTournament_Day2":192,"TriosOneDayCup1EU":1,"WorldCupWarmup":193,"XboxCup_Solo1":194,"s20_FridayNightZeroBuild":195,"s20_LCArchitectSolos":42,"s20_TriosHypeCup_Open":89};
/* EVENT COLORS end */
/* ТАБЛИЦЫ В ЦВЕТАХ ТУРНИРА, как лидерборд в игре тех лет (его просьба 28.09): у каждого
   события Epic своя палитра (imp_event.Colors — фон слева/справа, выделение, заголовок).
   Капы и события Epic — по своему id; FNCS прошлых лет (MajorN_YYYY) — по сезону дня;
   World Cup 2019 — палитра Online Open; своё (ЛАН, Кубок наций) — сезон, иначе бирюза как была. */
// Номер сезона Fortnite на дату — по спискам сезонов всех лет, а не только года карьеры.
function ccSeasonNumOn(day){
  const d=String(day||'');
  // Год главы по кругу (2027+, ccCycleSlot): сезон — тот, чей остров стоит в этот день.
  try{ if(typeof ccCycleSlot==='function' && d){ const cy=ccCycleSlot(d); if(cy) return cy[1]; } }catch(e){}
  const lists=[typeof CC_SEASONS_2019!=='undefined'?CC_SEASONS_2019:[], typeof CC_SEASONS_2020!=='undefined'?CC_SEASONS_2020:[],
    typeof CC_SEASONS_2021!=='undefined'?CC_SEASONS_2021:[], typeof CC_SEASONS_2022!=='undefined'?CC_SEASONS_2022:[],
    typeof CC_SEASONS_2023!=='undefined'?CC_SEASONS_2023:[], typeof CC_SEASONS_2024!=='undefined'?CC_SEASONS_2024:[],
    typeof CC_SEASONS_2025!=='undefined'?CC_SEASONS_2025:[], typeof CC_SEASONS!=='undefined'?CC_SEASONS:[]];
  const s=[].concat.apply([], lists).find(x=>d>=x.from && d<=x.to);
  if(s) return +String(s.id).slice(1);
  const f=(typeof careerFncsSeason==='function') ? careerFncsSeason(d) : null;
  return f ? +String(f.id).slice(1) : 0;
}
/* ГЛАВА И СЕЗОН ПО НОМЕРУ (его правка 29.09, Notion «27» скрин 24: «пусть больше информации
   будет, какой сезон и чаптер»). Нумерация Fortnite: S1–S10 — Глава 1, S11–S18 — Глава 2,
   S19–S22 — Глава 3, S23–S26 — Глава 4 и S27 — OG, S28–S31 — Глава 5 и S32 — Remix, S33–S37 —
   Глава 6 (S35 — мини-сезон Galactic Battle, дальше счёт главы идёт с S36 как с сезона 3),
   S38 — мини-сезон, S39–S42 — Глава 7 (S42 — Override), S43 — мини-сезон Treasure Hunters. Дальше только «S44». */
function ccChapterOf(n){
  if(!(n>0)) return null;
  if(n<=10) return {c:1, s:n};
  if(n<=18) return {c:2, s:n-10};
  if(n<=22) return {c:3, s:n-18};
  if(n<=26) return {c:4, s:n-22};
  if(n===27) return {c:4, name:'OG'};
  if(n<=31) return {c:5, s:n-27};
  if(n===32) return {c:5, name:'Remix'};
  if(n<=34) return {c:6, s:n-32};
  if(n===35) return {c:6, name:'Galactic Battle'};
  if(n<=37) return {c:6, s:n-33};
  if(n===38) return {c:6, name:'Simpsons'};
  if(n<=42) return {c:7, s:n-38};
  if(n===43) return {c:7, name:'Treasure Hunters'};
  return {n:n};
}
// Полное имя («Глава 2, сезон 5») и короткое («C2S5») сезона дня.
function ccSeasonTag(day){
  const n=ccSeasonNumOn(day), c=ccChapterOf(n), T=L();
  if(!c) return {full:'', short:''};
  if(c.n) return {full:'S'+c.n, short:'S'+c.n};
  if(c.name) return {full:T.ccChapterName(c.c, c.name), short:'C'+c.c+' '+c.name};
  return {full:T.ccChapterSeason(c.c, c.s), short:'C'+c.c+'S'+c.s};
}
/* Сезон в постах — «C7S2», а не внутренний номер «S40» (16.10, «сделай твиттер реалистичней»). */
function ccSeasonTagOf(season){ try{ return ccSeasonTag(season.from).short || season.id; }catch(e){ return season.id; } }
function ccEvPalOf(fam){ const i=CC_EV_COL[fam]; return i==null ? null : CC_EV_PAL[i]; }
function ccEvPalette(ev, day){
  if(!ev || typeof CC_EV_COL==='undefined') return null;
  const id=String(ev.id||ev.eid||'');
  let p=ccEvPalOf(id);
  if(!p && id){ const k=Object.keys(CC_EV_COL).find(f=>f.indexOf(id+'_')===0); if(k) p=ccEvPalOf(k); }
  if(p) return p;
  if(/^Major[12]_2019_/.test(id)) return ccEvPalOf(/Final/.test(id) ? (/^Major1/.test(id) ? 'ONSITE_WorldCup_Solos' : 'ONSITE_WorldCup_Duos') : 'OnlineOpen_Week1');
  const n=ccSeasonNumOn(day||careerToday());
  if(!n) return null;
  const fam=Object.keys(CC_EV_COL).filter(f=>new RegExp('^S'+n+'_FNCS').test(f));
  const pick=fam.find(f=>/Final/i.test(f)) || fam[0];
  return pick ? ccEvPalOf(pick) : null;
}
// Ставит палитру вечера на страницу: CSS-переменные --ev-* и класс ev-pal на <html>.
function ccEvPaletteApply(ev){
  const root=document.documentElement;
  /* 2026-й — свой вид сайта, без палитр событий (его правка 29.09: «с таблицами не то, не те
     цвета 2026» — Victory Cup красил таблицу в розово-оранжевый с бордовыми строками). Палитры
     турниров и экран тех лет — для прошлых годов, 2019–2025. */
  const own2026=!!(CAREER && CAREER.career) && ccCalYear()>=2026;
  /* Прошлый год без своей палитры у события (ЛАН, свой турнир) — палитра года, как у хаба
     (ccYearThemeApply): сезон дня, до Season X — Online Open 2019. Его правка 29.09: «пусть дизайн
     будет в стиле карьеры, в котором году он играет, а не синий, как в 26 году». */
  const past=!!(CAREER && CAREER.career) && ccCalYear()<2026;
  const dayP=()=>{ const d=careerToday(), n=ccSeasonNumOn(d);
    return ccEvPalette({id:''}, d) || (n<=9 ? ccEvPalOf('OnlineOpen_Week1') : null); };
  const p=own2026 ? null : (ccEvPalette(ev) || (past ? dayP() : null));
  if(!p){ root.classList.remove('ev-pal', 'ev-classic', 'ev-light'); return; }
  const s=root.style;
  s.setProperty('--ev-l', '#'+p[0]); s.setProperty('--ev-r', '#'+p[1]);
  s.setProperty('--ev-h', '#'+(p[2]||'FFE600'));
  s.setProperty('--ev-th', ccEvLight(p) ? '#0b0f16' : '#fff');
  root.classList.add('ev-pal');
  /* Прошлые годы — таблица как экран турнира в игре тех лет (скрины: Solos Cash Cup Europe
     2019, Solo Cash Cup Week 3 2020, Victory Cash Cup 2023): название события и регион крупно
     в самой таблице, полосы вместо плашек, лидер и своя строка — белые. 2026-й — свой вид. */
  const classic=(CAREER && CAREER.career) ? ccCalYear()<2026 : false;
  root.classList.toggle('ev-classic', classic);
  root.classList.toggle('ev-light', classic && ccEvLight(p));
  const q=v=>'"'+String(v||'').replace(/["\\]/g,'').toUpperCase()+'"';
  s.setProperty('--ev-name', q((ev && (ev.label||ev.title||ev.name))||''));
  let reg=''; try{ reg=regionName(ccCareerRegion()); }catch(e){}
  s.setProperty('--ev-reg', reg ? q('('+reg+')') : '""');
}
/* ТЕМА КАРЬЕРЫ ПО ГОДУ (его просьба 28.09: «дизайн карьеры под каждый год — разные палитры
   в годах были»). Хаб прошлых лет — в палитре FNCS текущего сезона (Epic, CC_EV_PAL):
   фон, шапка с постером сезона, плашки плиток, активная вкладка. 2026-й — как был (его
   бирюза и есть палитра года). До FNCS 2019-го (S8–S9) — палитра World Cup / Online Open. */
/* Выключено 29.09 его словом: «верни дизайн как было … главного меню и centre», «раньше
   выглядело лучше». Хаб и «Центр» снова в оформлении сайта; палитры турниров остаются у
   таблиц и экрана вечера (ccEvPaletteApply). Включить обратно — true. */
const CC_YEAR_THEME=false;
function ccYearThemeApply(){
  const root=document.documentElement;
  if(!CC_YEAR_THEME){ root.classList.remove('yr-pal'); return; }
  const today=(CAREER && CAREER.career) ? careerToday() : '';
  const y=today ? ccCalYear() : 2026;
  if(y>=2026){ root.classList.remove('yr-pal'); return; }
  const n=ccSeasonNumOn(today);
  const p=ccEvPalette({id:''}, today) || (n<=9 ? ccEvPalOf('OnlineOpen_Week1') : null);
  if(!p){ root.classList.remove('yr-pal'); return; }
  const s=root.style, art=ccSeasonArtOn(today);
  s.setProperty('--yr-l', '#'+p[0]); s.setProperty('--yr-r', '#'+p[1]);
  s.setProperty('--yr-h', '#'+(p[2]||'FFE600'));
  s.setProperty('--yr-hi', ccEvLight([p[2]||'FFE600','FFE600']) ? '#0b0f16' : '#fff');
  s.setProperty('--yr-art', art ? 'url('+art+')' : 'none');
  root.classList.add('yr-pal');
}
// Светлый ли фон палитры (серебро FNCS 2022–2025) — тогда шапка таблицы тёмная.
function ccEvLight(p){
  const lum=h=>{ const n=parseInt(h,16); return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255; };
  return (lum(p[0])+lum(p[1]))/2>0.62;
}
function ccCupPoster(id){
  id=String(id||'');
  let k=CC_CUP_POSTER[id];
  if(!k){ const m=/^SoloCash(\d+)_/.exec(id); if(m) k=+m[1]<=8 ? 'cups/s33' : 'cups/s34'; }
  if(!k && /^SoloSeries_/.test(id)) k='cups/ss39';
  return k ? 'art/'+k+'.jpg' : '';
}
/* FNCS прошлых лет — в постерах сезона из игры (архив Tracker, у сезона — постер финала, где он
   был): Season X, C2S1–C2S8, Grand Royale, C3S1–C3S3, Invitational 2022, C4S1–S3 и LCM, 2024.
   World Cup 2019 остаётся на своём ключевом арте, у 2025–2026 постеры Мейджоров уже свои. */
const CC_FNCS_POSTER={
  Major3_2019:'f10', Major4_2019:'f11',
  Major1_2020:'f12', Major2_2020:'f13', Major3_2020:'f14',
  Major1_2021:'f15', Major2_2021:'f16', Major3_2021:'f17', Major4_2021:'f18', Major5_2021:'f18gr',
  Major1_2022:'f19', Major2_2022:'f20', Major3_2022:'f21', Invitational2022:'f22inv',
  Major1_2023:'f23', Major2_2023:'f24', Major3_2023:'f25', Major4_2023:'f25',
  Major1_2024:'f28', Major2_2024:'f28', Major3_2024:'f28'
};
function ccFncsPoster(id){
  const m=/^(Major\d_\d{4}|Invitational2022)/.exec(String(id||''));
  const k=m && CC_FNCS_POSTER[m[1]];
  return k ? 'art/cups/'+k+'.jpg' : '';
}
// Обложка события: постер FNCS сезона, потом по id, потом постер капа, потом по виду. Одна дверь для календаря и карточки.
// Календарь хранит у своего турнира только id: аватарку берём из записи турнира.
function ccOwnLogoOf(ev){
  if(!ev) return '';
  if(ev.own && ev.logo) return ev.logo;
  const id=String(ev.id||ev.eid||''); if(id.indexOf('OWN_')!==0) return '';
  const cr=typeof CAREER!=='undefined' && CAREER && CAREER.career;
  const c=cr && (cr.ownCups||[]).find(x=>x.id===id);
  return (c && c.logo) || '';
}
function ccEventArt(ev){
  if(!ev) return '';
  const own=ccOwnLogoOf(ev); if(own) return own;
  const byId=ccFncsPoster(ev.id||ev.eid) || CAREER_EV_ART_ID[ev.id||ev.eid||''] || ccCupPoster(ev.id||ev.eid);
  if(byId) return byId;
  const k=ev.kind||ev.type||'';
  return CAREER_EV_ART[k==='cup'?'cup':k] || '';
}
/* Epic's 2026 competitive schedule, inlined from tools/fortnite-2026-year.generated.js
   (read off Tracker event pages, real BeginTime) so the career doesn't depend on tools/.
   Divisional cups live in CC_CUP_WEEKS. Row: [from, to, id, kind, shape]; kind is our own label
   for cover, pip colour and season square. shape 'pair' (Opens, Play-Ins): only the two endpoint
   dates run; no shape (Heats): every day in the range. Without it a cup with two Opens got nine. */
/* The year ends where the season does.
   It used to end on 23 August, two days after Paris, and that cut the season's
   own last event off the calendar: the Global Championship is in Antwerp on
   26-27 September 2026, which is where every road in this mode has been going
   all year. A career could win a seat there — the Summit, Major 2, the Last
   Chance all hand one out — and then the year simply stopped before the flight.
   The month between is the real gap between Paris and Antwerp, and it is
   training days, wages on 1 September and nothing else, which is what that
   month is. */
/* Хвост года дотянут до последнего измеренного вечера S42 — Перфоманс 9,
   22 октября, с его Tracker-сейвов 23 августа. Дальше Epic пока молчит. */
/* …молчал. 1 сентября Epic опубликовал правила FNCS Solos 2026, и последний
   вечер года — не Перфоманс, а финал соло 27 октября. Год дотянут до него:
   иначе турнир, ради которого весь октябрь и стоит на календаре, обрывался бы
   за пять дней до собственного финала. Даты — из Attachment B тех же правил,
   и они сходятся с окнами Epic по NAC до дня. */
/* Год кончается Кубком наций: три субботы после финала FNCS Solos, церемония 15 ноября. Слово
   21.09: «это может быть в конец года?». Раньше год закрывался 27 октября финалом Solos. */
/* 19.10: Epic объявил FNCS Solo Reload (3–22 ноября), и он сел на квал и финал Кубка наций.
   Настоящий турнир важнее выдуманного: Кубок наций уехал за его хиты (отбор 18.11, квал 25, финал 28),
   год дотянут до 29 ноября. */
const CC_YEAR_FROM='2025-12-01', CC_YEAR_TO='2026-11-29';
const CAREER_YEAR=[
  // Кубок наций — закрытие сезона (выдумка режима, см. ccNationsBook): после FNCS Solo Reload: отбор 18.11, квал 25.11, финал 28.11.
  ['2026-11-18','2026-11-18','NationsTrial','nations'],
  ['2026-11-25','2026-11-25','NationsQual','nations'],
  ['2026-11-28','2026-11-28','NationsFinal','nations'],
  /* FNCS Solo Reload, ноябрь 2026 — пост Fortnite Competitive 19.10 (x.com/FNCompetitive/status/2112236444211429766),
     две схемы Stage 1 и Stage 2. Машина та же, что у FNCS Solos (CC_SOLOS_STAGES, ключи rl*), остров — Reload.
     Round 1 (3–4.11) не играется по тому же правилу, что у Solos: поле его Epic не называет (порог «топ-200 000 PR»).
     Финал — один вечер 21 ноября во всех регионах (календарь Epic S43, снят 2.11; у NAC/NAW это 22-е по UTC). */
  ['2026-11-07','2026-11-07','FNCSSoloReload_Round2','solo'],
  ['2026-11-08','2026-11-08','FNCSSoloReload_Round3','solo'],
  ['2026-11-14','2026-11-15','FNCSSoloReload_Heats','solo'],
  ['2026-11-16','2026-11-16','FNCSSoloReload_LCQRound1','solo'],
  ['2026-11-17','2026-11-17','FNCSSoloReload_LCQFinal','solo'],
  ['2026-11-21','2026-11-21','FNCSSoloReload_Final','solo'],
  /* Solo Series, S39 — его два Tracker-сейва 23 августа (Solo Series Heats /
     Finals EU). Epic гнал квалификации четыре недели с 7 декабря, но карьера
     начинается 5 января — играется последняя, четвёртая сессия (11.01), и это
     честно по правилам Epic: в зачёт шла одна лучшая неделя. Хиты у Epic
     17-18 января (1-2 и 3-4), финал 24-25 — 12 игр одной посадкой, правило
     Глобалов. Кап есть в каждом из семи регионов и платит по своему региону
     — таблицы в CC_SOLO_PRIZES. 19 января не занято нарочно: там третий
     Duos Victory Cup. */
  /* ТРИ СЕССИИ КВАЛА, ИДЁТ ЛУЧШАЯ. Замер (tools/career-solo-qual-probe.js,
     60 прогонов на силу): с одной попытки в топ-100 из 4900 проходили 43% карт
     96, 33% — 88, 25% — 78; отзыв: «лучшими карточками даже в хиты не могу
     пройти». У Epic сессий было четыре и считалась лучшая — карьера даёт три
     на свободных днях первой недели (6, 10 и 11 января), правило то же: прошёл
     в одной — остальные не играются, не прошёл — играешь следующую. Форма
     'session' нумерует их в подписи. */
  ['2026-01-06','2026-01-06','SoloSeries_Qualifier','solo','session'],
  ['2026-01-10','2026-01-10','SoloSeries_Qualifier','solo','session'],
  ['2026-01-11','2026-01-11','SoloSeries_Qualifier','solo','session'],
  ['2026-01-17','2026-01-18','SoloSeries_Heats','solo'],
  ['2026-01-24','2026-01-25','SoloSeries_Final','solo'],
  ['2026-01-08','2026-01-16','ReloadEliteSeries1Opens','reload','pair'],
  ['2026-01-23','2026-01-28','ReloadEliteSeries1PlayIn','reload','pair'],
  ['2026-02-01','2026-02-01','ReloadEliteSeries1Heats','reload'],
  ['2026-02-07','2026-02-07','ReloadEliteSeries1Final','reload'],
  ['2026-02-13','2026-02-15','ReloadEliteSeries2Opens','reload','pair'],
  ['2026-02-20','2026-02-22','ReloadEliteSeries2PlayIn','reload','pair'],
  ['2026-02-27','2026-02-27','ReloadEliteSeries2Heats','reload'],
  ['2026-03-01','2026-03-01','ReloadEliteSeries2Final','reload'],
  ['2026-04-06','2026-04-07','Major1_PlayIn','major'],
  ['2026-04-17','2026-04-19','Major1_Heats','major'],
  ['2026-04-20','2026-04-21','Major1_LCQ','major'],
  ['2026-04-25','2026-04-26','Major1_Final','major'],
  // The Major 1 Summit, off the roster's own cards: the Group Stage is dated
  // 29 May 2026 and the Grand Finals 31 May, so the Lower Bracket sits between
  // them. Three days in Düsseldorf, and until now the career watched them go
  // past — the one FNCS event of the year it qualified for and never played.
  /* SECOND CHANCE QUALIFIER (Notion 20.10, игрок: «a cup to qual for globals if you didn't in grands of Major 1, only
     those who didn't qual and were div 1 could play, and who qualified go to the lower of summit»). Epic и Liquipedia:
     28 апреля открытый день для дивизиона 1 без места на Саммите, 29 апреля финал — 50 дуо, 6 игр, квоты регионов
     (EU 8, NAC 7, остальные по 2) в нижнюю сетку. */
  ['2026-04-28','2026-04-28','Summit_SCQPlay','summit'],
  ['2026-04-29','2026-04-29','Summit_SCQ','summit'],
  ['2026-05-29','2026-05-29','Summit_Upper','summit'],
  ['2026-05-30','2026-05-30','Summit_Lower','summit'],
  ['2026-05-31','2026-05-31','Summit_Final','summit'],
  ['2026-05-01','2026-05-03','ReloadEliteSeries3Opens','reload','pair'],
  ['2026-05-08','2026-05-10','ReloadEliteSeries3PlayIn','reload','pair'],
  ['2026-05-15','2026-05-15','ReloadEliteSeries3Heats','reload'],
  ['2026-05-17','2026-05-17','ReloadEliteSeries3Final','reload'],
  ['2026-06-12','2026-06-14','ReloadEliteSeries4Opens','reload','pair'],
  ['2026-06-19','2026-06-21','ReloadEliteSeries4PlayIn','reload','pair'],
  ['2026-06-26','2026-06-26','ReloadEliteSeries4Heats','reload'],
  ['2026-06-28','2026-06-28','ReloadEliteSeries4Final','reload'],
  ['2026-07-18','2026-07-19','Major2_PlayIn','major'],
  ['2026-07-24','2026-07-26','Major2_Heats','major'],
  ['2026-07-27','2026-07-28','Major2_LCQ','major'],
  ['2026-08-01','2026-08-02','Major2_Final','major'],
  // The Global Championship Last Chance is seven days, not two: two qualifiers
  // of three rounds and then a final. They are in CC_GCLC, because a 'pair' row
  // could only ever hold the first day and the last.
  // 19-22 August, Paris Expo Porte de Versailles: the Championship's own page
  // and the Esports World Cup's both say Wednesday to Saturday. This row was a
  // day early at both ends, which put the whole four-day block — and the seat
  // tile that names its opening day — on the wrong dates.
  ['2026-08-19','2026-08-22','ReloadChampionshipParis','gc'],
  // Antwerp, 26-27 September 2026. One cumulative leaderboard over the two days
  // rather than a bracket, so it is one stage and a career plays it on the
  // Saturday — the same rule the Heats and the Play-In already run under.
  ['2026-09-26','2026-09-27','GlobalChampionship','globals'],
  /* FNCS Solos 2026. Правила Epic fortnite-championship-series-fncs-solos-2026-official-rules: шесть стадий, поле
     100, финал два дня, топ EU 60 000. Даты из Attachment B.
     Играем Round 2 и 3 квала: из Round 1 проходят 8000 EU, 4000 NAC, 2000 остальные, дальше 1000, потом 100. R1 не
     играем: поля Epic не даёт.
     R3 первого круга ведёт в Fast Track, второго в хиты; второй круг только без места. 10 октября два
     взаимоисключающих вечера, решает careerSoloSeriesOn.
     LCQ Final: места 36-50 в хите или LCQ Round 1 (19 октября, поля нет, выход 70, открытая комната с отсечкой
     Epic). */
  ['2026-09-28','2026-09-28','FNCSSolos_Q1Round1','solo'],
  ['2026-10-03','2026-10-03','FNCSSolos_Q1Round2','solo'],
  ['2026-10-04','2026-10-04','FNCSSolos_Q1Round3','solo'],
  ['2026-10-05','2026-10-05','FNCSSolos_Q2Round1','solo'],
  ['2026-10-10','2026-10-10','FNCSSolos_FastTrack','solo'],
  ['2026-10-10','2026-10-10','FNCSSolos_Q2Round2','solo'],
  ['2026-10-11','2026-10-11','FNCSSolos_Q2Round3','solo'],
  // Два хита в два дня, каждый играет один (правила Epic: Heat 1 17.10, Heat 2 18.10; сверка 29.10).
  ['2026-10-17','2026-10-17','FNCSSolos_Heats','solo'],
  ['2026-10-18','2026-10-18','FNCSSolos_Heats2','solo'],
  ['2026-10-19','2026-10-19','FNCSSolos_LCQRound1','solo'],
  ['2026-10-20','2026-10-20','FNCSSolos_LCQFinal','solo'],
  ['2026-10-26','2026-10-27','FNCSSolos_Final','solo'],
  /* Pro-Am: Pro-Am Creator Series 2026, первая остановка 12 июля, Даллас (Comets
     LANding, UT Dallas, Epic + Dignitas). Вторая (6 сентября, Сан-Паулу) не взята:
     призов и очков ещё нет. По Liquipedia, сверено обратным счётом по таблице:
     Reload дуо, 20 команд в одном лобби, 7 игр, места 60/50/45/40/35/30/27/24/21/
     18/15/12/9/6/3, дальше 0, элим 3. Фонд $50 000 = $38 100 по местам + $11 900
     бонусов за игры ($1000/$500/$200 за 1-3). Поле по приглашению, квалификации у
     Epic нет; кого зовут, решает наша мерка careerProAmCan. */
  ['2026-07-12','2026-07-12','ProAm_Dallas','proam'],
  // Вторая остановка серии — Сан-Паулу, Zero Build. См. CC_PROAM_EVENTS.
  ['2026-09-06','2026-09-06','ProAm_SaoPaulo','proam'],
  /* Третья и четвёртая остановки — отзыв: «добавь 2 pro am ещё».
     Epic на этот день объявил только Даллас и Сан-Паулу («multiple events are
     planned throughout the year, each hosted by different organizations» —
     Liquipedia, next= пусто). Города и хозяева — НАШИ, по образцу серии (клуб
     принимает у себя): Париж, Team Vitality, воскресенье 20 сентября — свободный
     день за неделю до Антверпена; Сеул, Gen.G, воскресенье 25 октября — перед
     финалом FNCS Solos. Числа — Сан-Паулу (20 пар, 6 игр, $50 000), стройки как
     в Далласе. Объявит Epic другое — заменить даты и города здесь и в CC_PROAM_EVENTS. */
  ['2026-09-20','2026-09-20','ProAm_Paris','proam'],
  ['2026-10-25','2026-10-25','ProAm_Seoul','proam']
];
/* ---- The other year: FNCS 2025, in trios ------------------------------------
   Second calendar for trio years: 5 cup weeks, 3 Majors, Group Stage instead of
   Heats, a Last Chance Lobby, no Reload, no Summit, Globals 33 seats from Majors.
   EU dates from fortnitetracker.com window lists (epicgames_S3x_FNCS<event>_EU);
   season codes skip: C6S1 = S33, S2 = S34, S3 = S36. Play-In has no Tracker page,
   dates from the published schedule (Wed/Thu before Group Stage). S2 cup week 4
   Final is Monday 31 March on purpose: Week4Final_EU_mg was a make-good replay.
   Nothing reads this yet, see CC_YEAR_2025_FROM for what wiring still needs. */
const CAREER_YEAR_2025=[
  // Кубок наций — закрытие сезона, три субботы после последнего турнира FNCS (выдумка режима, см. ccNationsBook).
  ['2025-09-13','2025-09-13','NationsTrial','nations'],
  ['2025-09-20','2025-09-20','NationsQual','nations'],
  ['2025-09-27','2025-09-27','NationsFinal','nations'],
  /* Всё, что платило деньгами в сезоне 2025 (кроме FNCS) — с архива Tracker
     (events/archived?region=EU&year=2024|2025, imp_event.Windows с PayoutTable,
     снято 21 сентября 2026). Отзыв: «чет очень мало капов, добавляй все
     призовые, которые были». Консольные (PlayStation Cup, Console Victory Cash
     Cup) не взяты — карьера играется с ПК. Практика дивизионов S37 (14–30
     августа) не взята: её финал шёл в дуо, а дни — в трио, это тест нового
     формата, а не сезон.

     Solo Cash Cup — шестнадцать капов (восемь в S33, восемь в S34): раунд 1
     открытый, десять игр, топ-600 в раунд 2; раунд 2 десять игр, $32 000 на
     кап (№1 $8 000 … 21–25 $160). См. CC_SOLOS_STAGES (sc<n>r1 / sc<n>r2). */
  ['2024-12-15','2024-12-15','SoloCash1_R1','solo'],
  ['2024-12-15','2024-12-15','SoloCash1_R2','solo'],
  ['2024-12-20','2024-12-20','SoloCash2_R1','solo'],
  ['2024-12-22','2024-12-22','SoloCash2_R2','solo'],
  ['2025-01-10','2025-01-10','SoloCash3_R1','solo'],
  ['2025-01-12','2025-01-12','SoloCash3_R2','solo'],
  ['2025-01-17','2025-01-17','SoloCash4_R1','solo'],
  ['2025-01-19','2025-01-19','SoloCash4_R2','solo'],
  ['2025-01-24','2025-01-24','SoloCash5_R1','solo'],
  ['2025-01-26','2025-01-26','SoloCash5_R2','solo'],
  ['2025-02-01','2025-02-01','SoloCash6_R1','solo'],
  ['2025-02-02','2025-02-02','SoloCash6_R2','solo'],
  ['2025-02-05','2025-02-05','SoloCash7_R1','solo'],
  ['2025-02-06','2025-02-06','SoloCash7_R2','solo'],
  ['2025-02-17','2025-02-17','SoloCash8_R1','solo'],
  ['2025-02-18','2025-02-18','SoloCash8_R2','solo'],
  ['2025-03-07','2025-03-07','SoloCash9_R1','solo'],
  ['2025-03-09','2025-03-09','SoloCash9_R2','solo'],
  ['2025-03-14','2025-03-14','SoloCash10_R1','solo'],
  ['2025-03-16','2025-03-16','SoloCash10_R2','solo'],
  ['2025-03-23','2025-03-23','SoloCash11_R1','solo'],
  ['2025-03-24','2025-03-24','SoloCash11_R2','solo'],
  ['2025-03-28','2025-03-28','SoloCash12_R1','solo'],
  ['2025-03-30','2025-03-30','SoloCash12_R2','solo'],
  ['2025-04-04','2025-04-04','SoloCash13_R1','solo'],
  ['2025-04-06','2025-04-06','SoloCash13_R2','solo'],
  ['2025-04-11','2025-04-11','SoloCash14_R1','solo'],
  ['2025-04-12','2025-04-12','SoloCash14_R2','solo'],
  ['2025-04-17','2025-04-17','SoloCash15_R1','solo'],
  ['2025-04-18','2025-04-18','SoloCash15_R2','solo'],
  ['2025-04-25','2025-04-25','SoloCash16_R1','solo'],
  ['2025-04-29','2025-04-29','SoloCash16_R2','solo'],
  /* FNCS Showdown (S35, Galactic Battle): три капа для дивизионов 1–2 в трио,
     раунд 1 десять игр, топ-33 в раунд 2; раунд 2 шесть игр, $9 600 на игрока
     в сумме (№1 $3 000). Идёт машиной Мейджора как «Мейджор 4–6»: LCQ = раунд 1,
     финал = раунд 2. */
  ['2025-05-13','2025-05-13','Showdown4_2025_LCQ','major'],
  ['2025-05-14','2025-05-14','Showdown4_2025_Final','major'],
  ['2025-05-20','2025-05-20','Showdown5_2025_LCQ','major'],
  ['2025-05-21','2025-05-21','Showdown5_2025_Final','major'],
  ['2025-05-27','2025-05-27','Showdown6_2025_LCQ','major'],
  ['2025-05-28','2025-05-28','Showdown6_2025_Final','major'],
  // Major 1, Chapter 6 Season 1 (S33). Play-In is two days rather than one
  // window: a cumulative leaderboard over both, ten matches a day, top 99 in
  // Europe through to the Group Stage.
  ['2025-01-29','2025-01-30','Major1_2025_PlayIn','major'],
  // The Group Stage, which is not the 2026 Heats: three groups of the field, one
  // day each, five matches, and they are not consecutive days — Europe's first
  // group played the Sunday and the other two the weekend after it, with the
  // other six regions filling the days between. A career plays its own group, so
  // all three days are on the calendar and one of them is the player's.
  ['2025-02-02','2025-02-02','Major1_2025_Group1','major'],
  ['2025-02-08','2025-02-08','Major1_2025_Group2','major'],
  ['2025-02-09','2025-02-09','Major1_2025_Group3','major'],
  // The back door is two stages in 2025, not one: a ten-match qualifier that
  // cuts to thirty-three, and then a three-match Lobby where a Victory Royale is
  // the ticket. 2026 folded both into a single Last Chance Qualifier day.
  ['2025-02-12','2025-02-12','Major1_2025_LCQ','major'],
  ['2025-02-13','2025-02-13','Major1_2025_LCLobby','major'],
  ['2025-02-15','2025-02-16','Major1_2025_Final','major'],

  // Major 2, Chapter 6 Season 2 (S34).
  ['2025-04-09','2025-04-10','Major2_2025_PlayIn','major'],
  ['2025-04-13','2025-04-13','Major2_2025_Group1','major'],
  ['2025-04-19','2025-04-19','Major2_2025_Group2','major'],
  ['2025-04-20','2025-04-20','Major2_2025_Group3','major'],
  ['2025-04-23','2025-04-23','Major2_2025_LCQ','major'],
  ['2025-04-24','2025-04-24','Major2_2025_LCLobby','major'],
  ['2025-04-26','2025-04-27','Major2_2025_Final','major'],

  // Major 3, Chapter 6 Season 3 (S36) — the last road to Lyon.
  ['2025-07-16','2025-07-17','Major3_2025_PlayIn','major'],
  ['2025-07-20','2025-07-20','Major3_2025_Group1','major'],
  ['2025-07-26','2025-07-26','Major3_2025_Group2','major'],
  ['2025-07-27','2025-07-27','Major3_2025_Group3','major'],
  ['2025-07-30','2025-07-30','Major3_2025_LCQ','major'],
  ['2025-07-31','2025-07-31','Major3_2025_LCLobby','major'],
  ['2025-08-02','2025-08-03','Major3_2025_Final','major'],

  // Lyon, LDLC Arena, 6-7 September 2025. Thirty-three trios, twelve matches
  // over two days on one cumulative leaderboard — the Antwerp shape, and the
  // reason the 2026 row is played on its Saturday is the reason this one is.
  // Eleven of the thirty-three seats are Europe's; there is no Last Chance into
  // it, so the three Majors' Finals leaderboards fill the plane on their own.
  ['2025-09-06','2025-09-07','GlobalChampionship2025','globals']
];
/* The 2025 divisional cups, week by week: [id, session 1, session 2, Weekly Final].

   Five weeks in each of the first two seasons and two in the third — twelve cup
   weeks against 2026's seventeen, because Chapter 6 Season 3 was short. The
   rhythm is the Wednesday and the Thursday with the Final on the Saturday, where
   2026 runs Monday and Tuesday — but only ten of the twelve: week 2 of Season 1
   and week 1 of Season 3 open on the Tuesday instead, and are written here as
   they ran rather than as the pattern says they should have. Ten matches a
   session throughout; the Final is six matches in the first two seasons and
   seven in the third, which is Epic's own MatchCap and not a rounding of it. */
/* Дивизионные кубки C4S1 (январь — февраль 2023): Elite, Contender, Challenger — три ступени
   в любом регионе. Недели Elite (Tracker, S23_DivisionalCups_Elite): среда и пятница, финал
   Elite в субботу; Contender и Challenger играют в те же вечера. После 25 февраля дивизионов
   нет (ccNoDivisions). Placement Cup 15–16 декабря не играется: ступень выбирается при создании. */
const CC_CUP_WEEKS_2023=[
  ['S23_DivisionalCups','2023-01-04','2023-01-06','2023-01-07'],
  ['S23_DivisionalCups','2023-01-11','2023-01-13','2023-01-14'],
  ['S23_DivisionalCups','2023-01-18','2023-01-20','2023-01-21'],
  ['S23_DivisionalCups','2023-01-25','2023-01-27','2023-01-28'],
  ['S23_DivisionalCups','2023-02-22','2023-02-24','2023-02-25']
];
// Последний день, когда в 2023-м есть дивизионы: финал Мейджора 1 (туда пускали только Elite).
const CC_DIV_END_2023='2023-03-05';
const CC_CUP_WEEKS_2025=[
  ['S33_FNCSDivisionalCup','2024-12-11','2024-12-12','2024-12-14'],
  ['S33_FNCSDivisionalCup','2024-12-17','2024-12-19','2024-12-21'],
  ['S33_FNCSDivisionalCup','2025-01-08','2025-01-09','2025-01-11'],
  ['S33_FNCSDivisionalCup','2025-01-15','2025-01-16','2025-01-18'],
  ['S33_FNCSDivisionalCup','2025-01-22','2025-01-23','2025-01-25'],
  ['S34_FNCSDivisionalCup','2025-03-05','2025-03-06','2025-03-08'],
  ['S34_FNCSDivisionalCup','2025-03-12','2025-03-13','2025-03-15'],
  ['S34_FNCSDivisionalCup','2025-03-19','2025-03-20','2025-03-22'],
  // The make-good Monday. See the note above the calendar.
  ['S34_FNCSDivisionalCup','2025-03-26','2025-03-27','2025-03-31'],
  ['S34_FNCSDivisionalCup','2025-04-02','2025-04-03','2025-04-05'],
  ['S36_FNCSDivisionalCup','2025-06-17','2025-06-19','2025-06-21'],
  ['S36_FNCSDivisionalCup','2025-06-25','2025-06-26','2025-06-28']
];
/* What a stage of this year is worth playing, in the shape CC_MAJOR_STAGE uses.

   Epic's own MatchCap per window, and the cuts off the tournament's published
   format. Trios, so the room is a third smaller in teams than a duo year at the
   same head count — which is the one number a career mode has to get right
   before anything else about a trio season is worth building. */
const CC_MAJOR_STAGE_2025={
  playin  :{games:10, days:2, cut:99},   // cumulative over both days, top 99 EU
  /* Ten a group: five Victory Royales and five more on points. The cut counts
     the winners inside it — a group win is 944 points (majorHeatPoints), so the
     top of the table IS the winners. At cut 5 the five winners took every seat,
     nobody came through on points, and the groups sent 15 to a 33-trio final
     (tester, 5 Oct: «проходят только те, кто выиграл игру… в финалах всего 17»).
     3 × 10 = 30 is what majorFormat measured for t1–t3, + 3 Lobby winners = 33. */
  group   :{games:5,  cut:10},
  lcq     :{games:10, cut:33},
  lclobby :{games:3,  cut:0},            // a Victory Royale is the ticket
  final   :{games:6,  days:2, cut:0}
};
const CC_CUP_2025={games:10, finalGames:6, finalGamesS36:7};
/* Bounds of 2026 (CC_YEAR_FROM / CC_YEAR_TO). Still missing for a trio season:
   a third seat (everything from careerPartnerCard on assumes a pair: LAN duo lock, chemistry,
   poaching, inbox seat top-up); the Group Stage draw (one of three days, 2026 Heats are a block);
   no Reload, Summit or Globals LCQ, so the calendar strip has to show the gap.
   Cards exist: CARD_SET t1–t3 are the three Majors, GC2025_PRIZES is Lyon ($2,001,000, 33 places). */
// До 29.11: после Лиона — капы Главы 6 октября и сезон Симпсонов (C6 мини-сезон, 1–29 ноября 2025: Duos и Squads
// Victory Cup, Reload Quick Cup из архива Epic). 2026-й начинается 1 декабря.
const CC_YEAR_2025_FROM='2024-12-07', CC_YEAR_2025_TO='2025-11-29';   // + Кубок наций после Лиона
// ==== FNCS 2019 cal (tools/splice-2019.js) ====
/* ---- 2019 в карьере --------------------------------------------------------------
   Формат меняется по ходу года: World Cup (недели Online Open — соло по нечётным, дуо по
   чётным; финалы в Нью-Йорке 27–28 июля), FNCS Season X (трио, август — сентябрь), FNCS
   Chapter 2 Season 1 (сквады, октябрь — декабрь). Состав года — сквад; вечер — в своём
   формате (см. runCareerMajorMX). Даты и квоты — окна Epic с Tracker
   (tools/measured/tracker-2019.json), финалы Нью-Йорка — Liquipedia; спека —
   docs/superpowers/specs/2026-09-27-career-year-2019-2020-design.md. */
// Год начинается 1 марта (его слово 29.09: «2019 может с марта начать, мало турниров до этого»); было 21 января.
const CC_YEAR_2019_FROM='2019-03-01', CC_YEAR_2019_TO='2019-12-29';
const CAREER_YEAR_2019=[
  // World Cup Solo («Мейджор 1»): суббота — открытый раунд, воскресенье — финал недели (3000).
  ['2019-04-13','2019-04-13','Major1_2019_W1R1','major'], ['2019-04-14','2019-04-14','Major1_2019_W1R2','major'],
  ['2019-04-20','2019-04-20','Major2_2019_W2R1','major'], ['2019-04-21','2019-04-21','Major2_2019_W2R2','major'],
  ['2019-04-27','2019-04-27','Major1_2019_W3R1','major'], ['2019-04-28','2019-04-28','Major1_2019_W3R2','major'],
  ['2019-05-04','2019-05-04','Major2_2019_W4R1','major'], ['2019-05-05','2019-05-05','Major2_2019_W4R2','major'],
  ['2019-05-11','2019-05-11','Major1_2019_W5R1','major'], ['2019-05-12','2019-05-12','Major1_2019_W5R2','major'],
  ['2019-05-18','2019-05-18','Major2_2019_W6R1','major'], ['2019-05-19','2019-05-19','Major2_2019_W6R2','major'],
  ['2019-05-25','2019-05-25','Major1_2019_W7R1','major'], ['2019-05-26','2019-05-26','Major1_2019_W7R2','major'],
  ['2019-06-01','2019-06-01','Major2_2019_W8R1','major'], ['2019-06-02','2019-06-02','Major2_2019_W8R2','major'],
  ['2019-06-08','2019-06-08','Major1_2019_W9R1','major'], ['2019-06-09','2019-06-09','Major1_2019_W9R2','major'],
  ['2019-06-20','2019-06-20','Major2_2019_W10R1','major'], ['2019-06-21','2019-06-21','Major2_2019_W10R2','major'],
  // Финалы World Cup, Arthur Ashe Stadium: дуо 27 июля, соло 28 июля.
  ['2019-07-27','2019-07-27','Major2_2019_Final','major'],
  ['2019-07-28','2019-07-28','Major1_2019_Final','major'],
  // FNCS Season X («Мейджор 3», трио): суббота — раунды 1 и 2, воскресенье — финал недели.
  ['2019-08-17','2019-08-17','Major3_2019_W1R12','major'], ['2019-08-18','2019-08-18','Major3_2019_W1R3','major'],
  ['2019-08-24','2019-08-24','Major3_2019_W2R12','major'], ['2019-08-25','2019-08-25','Major3_2019_W2R3','major'],
  ['2019-08-31','2019-08-31','Major3_2019_W3R12','major'], ['2019-09-01','2019-09-01','Major3_2019_W3R3','major'],
  ['2019-09-07','2019-09-07','Major3_2019_W4R12','major'], ['2019-09-08','2019-09-08','Major3_2019_W4R3','major'],
  ['2019-09-14','2019-09-14','Major3_2019_W5R12','major'], ['2019-09-15','2019-09-15','Major3_2019_W5R3','major'],
  ['2019-09-20','2019-09-20','Major3_2019_Heat1','major'], ['2019-09-21','2019-09-21','Major3_2019_Heat2','major'],
  ['2019-09-22','2019-09-22','Major3_2019_Final','major'],
  // FNCS Chapter 2 Season 1 («Мейджор 4», сквады): разминка (неделя 0) и четыре недели.
  ['2019-10-26','2019-10-26','Major4_2019_W0R12','major'], ['2019-10-27','2019-10-27','Major4_2019_W0R3','major'],
  ['2019-11-02','2019-11-02','Major4_2019_W1R1','major'], ['2019-11-03','2019-11-03','Major4_2019_W1R23','major'],
  ['2019-11-09','2019-11-09','Major4_2019_W2R12','major'], ['2019-11-10','2019-11-10','Major4_2019_W2R3','major'],
  ['2019-11-16','2019-11-16','Major4_2019_W3R12','major'], ['2019-11-17','2019-11-17','Major4_2019_W3R3','major'],
  ['2019-11-23','2019-11-23','Major4_2019_W4R12','major'], ['2019-11-24','2019-11-24','Major4_2019_W4R3','major'],
  ['2019-12-06','2019-12-06','Major4_2019_Heat1','major'], ['2019-12-07','2019-12-07','Major4_2019_Heat2','major'],
  ['2019-12-08','2019-12-08','Major4_2019_Final','major'],
  // Кубок наций — после FNCS C2S1 (выдумка режима, см. ccNationsBook).
  ['2019-12-14','2019-12-14','NationsTrial','nations'],
  ['2019-12-21','2019-12-21','NationsQual','nations'],
  ['2019-12-28','2019-12-28','NationsFinal','nations']
];
const CC_SEASONS_2019=[
  {id:'S8', from:'2019-02-28', to:'2019-05-08'},
  {id:'S9', from:'2019-05-09', to:'2019-07-31'},
  {id:'S10', from:'2019-08-01', to:'2019-10-12'},
  {id:'S11', from:'2019-10-13', to:'2019-12-31'}
];
CAREER_YEAR_2019.forEach(r=>{
  const m=/^Major(\d)_2019_/.exec(r[2]);
  // World Cup (Solo и Duos) — ключевой арт World Cup, как у квалов турнира; FNCS — остров сезона.
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]=(m[1]==='1' || m[1]==='2') ? 'art/fncs-2019.jpg' : 'art/map-h'+m[1]+'.jpg';
});
const CC_SNAPSHOTS_2019=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'h1', from:CC_YEAR_2019_FROM, playIn:/2019 World Cup (Solo|Duos) . Grand Finals/, lcq:/2019 World Cup (Solo|Duos) . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'h3', from:'2019-08-01', playIn:/2019 Season X . Grand Finals/, lcq:/2019 Season X . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'h4', from:'2019-10-13', playIn:/2019 C2S1 . Grand Finals/, lcq:/2019 C2S1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
/* Сезоны 2019-го для машины runCareerMajorMX. rounds — раунды недели по порядку (open — зал
   из лестницы, без записи); у World Cup последний раунд — финал недели, верх по квоте региона
   (WC2019_QUOTA) едет в Нью-Йорк. heats — хиты финальной недели: день и квота. Число игр в
   раундах — своя оценка режима (в окнах Epic его нет). */
var CC_MX_SPEC=CC_MX_SPEC||{};
CC_MX_SPEC[2019]={
  1:{set:'h1', name:'World Cup Solo', size:1, kind:'wc', weeks:[1,3,5,7,9],
     rounds:[{games:10, cut:3000, open:true}, {games:10, cut:0, open:true}], finalGames:6, island:'h1'},
  2:{set:'h2', name:'World Cup Duos', size:2, kind:'wc', weeks:[2,4,6,8,10],
     rounds:[{games:10, cut:1500, open:true}, {games:10, cut:0, open:true}], finalGames:6, island:'h1'},
  3:{set:'h3', name:'FNCS Season X', size:3, weeks:[1,2,3,4,5],
     rounds:[{games:10, cut:1000, open:true}, {games:10, cut:150, open:true}, {games:10, cut:0}],   // Liquipedia: Semifinals и Week Finals — «10 match limit» (сверка 7.10)
     heats:[{day:1, cut:8}, {day:2, cut:8}, {day:2, cut:8}, {day:2, cut:8}], heatGames:6, finalGames:6, island:'h3'},
  4:{set:'h4', name:'FNCS Chapter 2 Season 1', size:4, weeks:[0,1,2,3,4],
     rounds:[{games:10, cut:500, open:true}, {games:10, cut:25, open:true}, {games:6, cut:0}],    // Semifinals — «10 match limit», Week Finals — 6
     heats:[{day:1, cut:6}, {day:2, cut:6}, {day:2, cut:6}, {day:2, cut:6}], heatGames:6, finalGames:6, island:'h4'}
};
// Generated by tools/build-2019-cal.js — капы и выплаты 2019-го.
const CC_VICTORY_2019=[
  {day:'2019-08-23',id:'S10_CC_Trios',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S10'},
  {day:'2019-08-30',id:'S10_CC_Trios',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S10'},
  {day:'2019-09-06',id:'S10_CC_Trios',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S10'},
  {day:'2019-09-13',id:'S10_CC_Trios',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S10'}
];
const CC_DCC_PAY_2019={S10:{EU:[[1,6000],[2,5000],[3,4000],[4,2300],[5,1100],[6,900],[7,800],[8,600],[9,500],[10,400],[20,300],[30,200]],NAC:[[1,4000],[2,3300],[3,2500],[4,1335],[5,900],[6,800],[7,600],[8,500],[9,400],[10,300],[20,200]],NAW:[[1,1700],[2,1300],[3,1000],[4,700],[5,500],[6,400],[9,300],[10,200]],BR:[[1,1700],[2,1300],[3,1000],[4,700],[5,500],[6,400],[9,300],[10,200]],ASIA:[[1,1500],[2,900],[3,600],[4,500],[5,400],[6,300],[10,200]],OCE:[[1,1500],[2,900],[3,600],[4,500],[5,400],[6,300],[10,200]]}};
const CC_MX_PAY_2019={3:{EU:[[1,160000],[2,72000],[3,48000],[4,17600],[8,6400],[32,3200]],NAC:[[1,100000],[2,45000],[3,30000],[4,11000],[8,4000],[32,2000]],NAW:[[1,40000],[2,18000],[3,12000],[4,4400],[8,1600],[32,800]],BR:[[1,40000],[2,18000],[3,12000],[4,4400],[8,1600],[32,800]]},4:{EU:[[1,75000],[2,30000],[3,24000],[4,18000],[5,15000],[6,12000],[7,9000],[8,6000],[9,4800],[24,2400]],NAC:[[1,46875],[2,18750],[3,15000],[4,11250],[5,9375],[6,7500],[7,5625],[8,3750],[9,3000],[24,1500]],NAW:[[1,18750],[2,7500],[3,6000],[4,4500],[5,3750],[6,3000],[7,2250],[8,1500],[9,1200],[24,600]],BR:[[1,18750],[2,7500],[3,6000],[4,4500],[5,3750],[6,3000],[7,2250],[8,1500],[9,1200],[24,600]]}};
// ==== /FNCS 2019 cal ====
// ==== FNCS 2020 cal (tools/splice-2020.js) ====
/* ---- 2020 в карьере -----------------------------------------------------------------
   Формат меняется по ходу года: FNCS C2S2 — дуо, C2S3 — соло, C2S4 — трио. Состав года — трио,
   вечер — в своём формате (runCareerMajorMX). Даты — страницы Liquipedia (на Tracker этих
   сезонов нет), квота хита — финал Европы поровну на хиты; генерируется tools/build-2020-cal.js. */
const CC_YEAR_2020_FROM='2020-01-06', CC_YEAR_2020_TO='2020-11-29';
const CAREER_YEAR_2020=[
  ['2020-03-21','2020-03-21','Major1_2020_W1R1','major'],
  ['2020-03-22','2020-03-22','Major1_2020_W1R2','major'],
  ['2020-03-28','2020-03-28','Major1_2020_W2R1','major'],
  ['2020-03-29','2020-03-29','Major1_2020_W2R2','major'],
  ['2020-04-04','2020-04-04','Major1_2020_W3R1','major'],
  ['2020-04-05','2020-04-05','Major1_2020_W3R2','major'],
  ['2020-04-11','2020-04-11','Major1_2020_W4R1','major'],
  ['2020-04-12','2020-04-12','Major1_2020_W4R2','major'],
  ['2020-04-17','2020-04-17','Major1_2020_Heat1','major'],
  ['2020-04-18','2020-04-18','Major1_2020_Heat2','major'],
  ['2020-04-19','2020-04-19','Major1_2020_Final','major'],
  ['2020-08-01','2020-08-01','Major2_2020_W1R12','major'],
  ['2020-08-02','2020-08-02','Major2_2020_W2R12','major'],
  ['2020-08-08','2020-08-08','Major2_2020_W3R12','major'],
  ['2020-08-09','2020-08-09','Major2_2020_W4R12','major'],
  ['2020-08-14','2020-08-14','Major2_2020_Heat1','major'],
  ['2020-08-15','2020-08-15','Major2_2020_Heat2','major'],
  ['2020-08-16','2020-08-16','Major2_2020_Final','major'],
  ['2020-10-09','2020-10-09','Major3_2020_W1R1','major'],
  ['2020-10-11','2020-10-11','Major3_2020_W1R2','major'],
  ['2020-10-16','2020-10-16','Major3_2020_W2R1','major'],
  ['2020-10-18','2020-10-18','Major3_2020_W2R2','major'],
  ['2020-10-23','2020-10-23','Major3_2020_W3R1','major'],
  ['2020-10-25','2020-10-25','Major3_2020_W3R2','major'],
  ['2020-10-29','2020-10-29','Major3_2020_Heat1','major'],
  ['2020-10-31','2020-11-01','Major3_2020_Final','major'],
  ['2020-11-08','2020-11-08','NationsTrial','nations'], ['2020-11-15','2020-11-15','NationsQual','nations'], ['2020-11-22','2020-11-22','NationsFinal','nations']
];
const CC_SEASONS_2020=[{id:'S11', from:'2019-10-15', to:'2020-02-19'}, {id:'S12', from:'2020-02-20', to:'2020-06-16'}, {id:'S13', from:'2020-06-17', to:'2020-08-26'}, {id:'S14', from:'2020-08-27', to:'2020-12-01'}];
CAREER_YEAR_2020.forEach(r=>{ const m=/^Major(\d)_2020_/.exec(r[2]); if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-i'+m[1]+'.jpg'; });
const CC_SNAPSHOTS_2020=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'i0', from:CC_YEAR_2020_FROM, playIn:/2019 C2S1 . Grand Finals/, lcq:/2019 C2S1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/, yr:2019},
  {tag:'i1', from:'2020-02-20', playIn:/2020 C2S2 . Grand Finals/, lcq:/2020 C2S2 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'i3', from:'2020-08-27', playIn:/2020 C2S4 . Grand Finals/, lcq:/2020 C2S4 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
var CC_MX_SPEC=CC_MX_SPEC||{};
CC_MX_SPEC[2020]={1:{set:'i1',name:'FNCS Chapter 2 Season 2',size:2,qual:false,weeks:[1,2,3,4],rounds:[{games:10,cut:50,open:true},{games:6,cut:0}],heats:[{day:1,cut:12},{day:1,cut:12},{day:2,cut:12},{day:2,cut:12}],heatGames:6,finalGames:12,island:'i1'},2:{set:'i2',name:'FNCS Chapter 2 Season 3',size:1,qual:true,weeks:[1,2,3,4],rounds:[{games:10,cut:100,open:true},{games:6,cut:0}],heats:[{day:1,cut:25},{day:1,cut:25},{day:2,cut:25},{day:2,cut:25}],heatGames:6,finalGames:12,island:'i2'},3:{set:'i3',name:'FNCS Chapter 2 Season 4',size:3,qual:false,weeks:[1,2,3],rounds:[{games:10,cut:33,open:true},{games:6,cut:0}],heats:[{day:1,cut:8},{day:1,cut:8},{day:1,cut:8},{day:1,cut:8}],heatGames:6,finalGames:12,island:'i3'}};
// ==== /FNCS 2020 cal ====
/* WILDCARD C2S4 (Liquipedia «Fortnite Champion Series/Chapter 2/Season 4/Wildcard/<регион>», окна Epic
   S14_FNCS_Finals_*_Wildcard_Event1): 31 октября в 17:00, за 45 минут до Гранд-финала, — один матч. Играют
   9–16-е места каждого из четырёх хитов (32 команды; хит-призы Epic за 9–16 нулевые именно поэтому),
   победитель — 33-я команда Гранд-финала. Призы на игрока: EU $1800 и NAE $1200 на команду за 2–32-е,
   остальные регионы — ноль. Вне генератора build-2020-cal.js, чтобы пересборка календаря это не стёрла. */
/* Сверка с правилами Liquipedia 7.10 (тоже вне генератора): Гранд-финалы C2S2 и C2S3 — «6 match limit»
   (окно Epic S12_FNCS_Finals_PC тоже 6), квалы C2S3 — «Round 1/2: 7 match limit»; финал недели C2S4 —
   Round 3 «(Day 1) 6 match limit … (Day 2) 6 match limit, Top 15 after both days», хиты C2S4 — два дня
   по 6 («Top 8 teams after both days»). Двухдневное здесь играется одним вечером на сумму игр, как финалы. */
if(CC_MX_SPEC[2020]){
  if(CC_MX_SPEC[2020][1]){ CC_MX_SPEC[2020][1].finalGames=6; CC_MX_SPEC[2020][1].finalN=48; }   // финал Европы C2S2 — 48 дуо (Liquipedia, сверка 20.10; было 50 — добор из серии до лобби)
  if(CC_MX_SPEC[2020][2]){ CC_MX_SPEC[2020][2].finalGames=6; CC_MX_SPEC[2020][2].rounds[0].games=7; }
  if(CC_MX_SPEC[2020][3]){ CC_MX_SPEC[2020][3].rounds[1].games=12; CC_MX_SPEC[2020][3].heatGames=12; }
}
if(CC_MX_SPEC[2020] && CC_MX_SPEC[2020][3]) CC_MX_SPEC[2020][3].wild={from:9, to:16, games:1,
  pay:{EU:[[1,0],[32,600]], NAC:[[1,0],[32,400]]}};
function ccMXWildRows(m, sp){
  ccMXSettleHeats(m);
  const n=sp.wild.to-sp.wild.from+1, out=[];
  ccMXHeats(m).forEach((h,i)=>((m.heatRes[i]||{}).rest||[]).slice(0, n).forEach(r=>{ if(r!=='you') out.push(r); }));
  return out;
}
// Победитель Wildcard без тебя — один матч движком, раз на сезон (m.wildRes). Пока ты сам в Wildcard и не сыграл его — никого.
function ccMXWildWinner(m, sp){
  if(m.wildRes) return m.wildRes.win;
  if(m.wild) return null;
  const rows=ccMXWildRows(m, sp);
  if(!rows.length) return null;
  let win=null;
  ccWithEventSize(sp.size, ()=>{
    const room=rows.map(ccMajorTeamFrom);
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWorldRun('mxw|'+m.season+'|'+m.y+'|'+m.n, ()=>simulateGames(room, sp.wild.games, ccM24Points, CC_M24_KILL));
    win=ccMajorSeatRow(ccM24Rank(room)[0]);
  });
  m.wildRes={win};
  return win;
}
function ccMXWildPrize(sp){
  const t=(sp.wild.pay||{})[careerPrizeRegion()];
  // Таблица на игрока, как хиты 2020-го (ccMXHeatPrize), — функция отдаёт сумму на команду.
  // Без таблицы региона — ноль (NAW/BR/OCE/ASIA/ME Wildcard не платили), а не европейская, как в ccPay24.
  return t ? (place=>{ const row=t.find(x=>place<=x[0]); return (row ? row[1] : 0)*sp.size; }) : null;
}
// ==== FNCS 2021 cal (tools/splice-2021.js) ====
/* ---- FNCS 2021 в карьере ------------------------------------------------------
   Трио весь год, Chapter 2 (сезоны 5–8), ЛАНов нет. Даты и квоты — окна Epic с архива
   Tracker (tools/measured/tracker-2021.json), места финалов NA — Liquipedia (liqui-2021/);
   спека — docs/superpowers/specs/2026-09-27-career-year-2021-design.md.

   Четыре сезона FNCS (C2S5–C2S8) — «Мейджоры» карьеры: квалификаторы по четыре раунда →
   полуфинал хитами → Reboot Round → Гранд-финал. «Мейджор 5» — FNCS Grand Royale, финал
   20–21 ноября. См. runCareerMajor2021. */
const CC_YEAR_2021_FROM='2020-12-07', CC_YEAR_2021_TO='2021-12-05';   // + Кубок наций после Grand Royale
const CAREER_YEAR_2021=[
  // Мейджор 1 (C2S5): три квалификатора — пятница раунд 1, суббота 2 и 3, воскресенье 4.
  ['2021-02-12','2021-02-12','Major1_2021_Q1R1','major'],
  ['2021-02-13','2021-02-13','Major1_2021_Q1R23','major'],
  ['2021-02-14','2021-02-14','Major1_2021_Q1R4','major'],
  ['2021-02-19','2021-02-19','Major1_2021_Q2R1','major'],
  ['2021-02-20','2021-02-20','Major1_2021_Q2R23','major'],
  ['2021-02-21','2021-02-21','Major1_2021_Q2R4','major'],
  ['2021-02-26','2021-02-26','Major1_2021_Q3R1','major'],
  ['2021-02-27','2021-02-27','Major1_2021_Q3R23','major'],
  ['2021-02-28','2021-02-28','Major1_2021_Q3R4','major'],
  ['2021-03-06','2021-03-06','Major1_2021_Semi1','major'],
  ['2021-03-07','2021-03-07','Major1_2021_Semi2','major'],
  ['2021-03-08','2021-03-08','Major1_2021_Reboot','major'],
  ['2021-03-13','2021-03-14','Major1_2021_Final','major'],
  // Мейджор 2 (C2S6).
  ['2021-04-23','2021-04-23','Major2_2021_Q1R1','major'],
  ['2021-04-24','2021-04-24','Major2_2021_Q1R23','major'],
  ['2021-04-25','2021-04-25','Major2_2021_Q1R4','major'],
  ['2021-04-30','2021-04-30','Major2_2021_Q2R1','major'],
  ['2021-05-01','2021-05-01','Major2_2021_Q2R23','major'],
  ['2021-05-02','2021-05-02','Major2_2021_Q2R4','major'],
  ['2021-05-07','2021-05-07','Major2_2021_Q3R1','major'],
  ['2021-05-08','2021-05-08','Major2_2021_Q3R23','major'],
  ['2021-05-09','2021-05-09','Major2_2021_Q3R4','major'],
  ['2021-05-22','2021-05-22','Major2_2021_Semi1','major'],
  ['2021-05-23','2021-05-23','Major2_2021_Reboot','major'],
  ['2021-05-29','2021-05-30','Major2_2021_Final','major'],
  // Мейджор 3 (C2S7).
  ['2021-07-30','2021-07-30','Major3_2021_Q1R1','major'],
  ['2021-07-31','2021-07-31','Major3_2021_Q1R23','major'],
  ['2021-08-01','2021-08-01','Major3_2021_Q1R4','major'],
  ['2021-08-13','2021-08-13','Major3_2021_Q2R1','major'],
  ['2021-08-14','2021-08-14','Major3_2021_Q2R23','major'],
  ['2021-08-15','2021-08-15','Major3_2021_Q2R4','major'],
  ['2021-08-20','2021-08-20','Major3_2021_Q3R1','major'],
  ['2021-08-21','2021-08-21','Major3_2021_Q3R23','major'],
  ['2021-08-22','2021-08-22','Major3_2021_Q3R4','major'],
  ['2021-08-28','2021-08-28','Major3_2021_Semi1','major'],
  ['2021-08-29','2021-08-29','Major3_2021_Reboot','major'],
  ['2021-09-04','2021-09-05','Major3_2021_Final','major'],
  // Мейджор 4 (C2S8): два квалификатора, полуфинал в два дня, без Reboot Round.
  ['2021-10-15','2021-10-15','Major4_2021_Q1R12','major'],
  ['2021-10-16','2021-10-16','Major4_2021_Q1R3','major'],
  ['2021-10-17','2021-10-17','Major4_2021_Q1R4','major'],
  ['2021-10-22','2021-10-22','Major4_2021_Q2R12','major'],
  ['2021-10-23','2021-10-23','Major4_2021_Q2R3','major'],
  ['2021-10-24','2021-10-24','Major4_2021_Q2R4','major'],
  ['2021-10-28','2021-10-28','Major4_2021_Semi1','major'],
  ['2021-10-29','2021-10-29','Major4_2021_Semi2','major'],
  ['2021-10-30','2021-10-31','Major4_2021_Final','major'],
  // FNCS Grand Royale — финал 20–21 ноября («Мейджор 5»), онлайн по регионам.
  ['2021-11-20','2021-11-21','Major5_2021_Final','major'],
  // Кубок наций — после Grand Royale (выдумка режима, см. ccNationsBook).
  ['2021-11-27','2021-11-27','NationsTrial','nations'],
  ['2021-12-01','2021-12-01','NationsQual','nations'],
  ['2021-12-04','2021-12-04','NationsFinal','nations']
];
// Сезоны 2021-го — Chapter 2 (S15–S18), границы по патчам.
const CC_SEASONS_2021=[
  {id:'S15', from:'2020-12-02', to:'2021-03-15'},
  {id:'S16', from:'2021-03-16', to:'2021-06-07'},
  {id:'S17', from:'2021-06-08', to:'2021-09-12'},
  {id:'S18', from:'2021-09-13', to:'2021-12-04'}
];
// Обложки дней 2021-го — остров своего сезона (Мейджор n — j<n>, Grand Royale — j4).
CAREER_YEAR_2021.forEach(r=>{
  const m=/^Major(\d)_2021_/.exec(r[2]);
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-j'+Math.min(+m[1], 4)+'.jpg';
});
// Одна книга трио на год: трио Гранд-финалов и полуфиналов четырёх сезонов (j1–j4).
const CC_SNAPSHOTS_2021=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'j1', from:CC_YEAR_2021_FROM, playIn:/2021 C2S5 . Grand Finals/, lcq:/2021 C2S5 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'j2', from:'2021-03-16', playIn:/2021 C2S6 . Grand Finals/, lcq:/2021 C2S6 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'j3', from:'2021-06-08', playIn:/2021 C2S7 . Grand Finals/, lcq:/2021 C2S7 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'j4', from:'2021-09-13', playIn:/2021 C2S8 . Grand Finals/, lcq:/2021 C2S8 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
// Generated by tools/build-2021-cal.js — капы, выплаты и Grand Royale FNCS 2021.
const CC_VICTORY_2021=[
  {day:'2021-01-11',id:'S15_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-01-25',id:'S15_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-01-30',id:'S15_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S15SOLO'},
  {day:'2021-02-01',id:'S15_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-02-06',id:'S15_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S15SOLO'},
  {day:'2021-02-08',id:'S15_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-02-15',id:'S15_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-03-01',id:'S15_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-04-03',id:'S16_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-04-10',id:'S16_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-04-12',id:'S16_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-04-17',id:'S16_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-04-19',id:'S16_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-04-26',id:'S16_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-03',id:'S16_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-10',id:'S16_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-16',id:'S16_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-05-17',id:'S16_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-24',id:'S16_CashCup',mode:'trio',n:7,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-07-13',id:'S17_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-07-18',id:'S17_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S17SOLO'},
  {day:'2021-07-19',id:'S17_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-07-25',id:'S17_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S17SOLO'},
  {day:'2021-07-26',id:'S17_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-02',id:'S17_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-04',id:'S17_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S17SOLO'},
  {day:'2021-08-09',id:'S17_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-16',id:'S17_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-23',id:'S17_CashCup',mode:'trio',n:7,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-30',id:'S17_CashCup',mode:'trio',n:8,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-10-03',id:'S18_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-10-04',id:'S18_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-10-10',id:'S18_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-10-11',id:'S18_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-10-18',id:'S18_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-10-25',id:'S18_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-01',id:'S18_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-07',id:'S18_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-11-08',id:'S18_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-14',id:'S18_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-11-15',id:'S18_CashCup',mode:'trio',n:7,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-22',id:'S18_CashCup',mode:'trio',n:8,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-28',id:'S18_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-11-29',id:'S18_CashCup',mode:'trio',n:9,name:'Trios Cash Cup',pay:'S18'}
];
const CC_DCC_PAY_2021={S15:{EU:[[1,767],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S15SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]},S16:{EU:[[1,767],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S16SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]},S17:{EU:[[1,767],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[5,250],[8,200]],BR:[[1,500],[2,450],[3,400],[4,300],[5,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S17SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,250],[25,225],[55,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[8,200]],BR:[[1,450],[2,350],[3,300],[6,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]},S18:{EU:[[1,800],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[55,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,300],[23,200]],NAW:[[1,400],[2,350],[3,270],[5,250],[8,200]],BR:[[1,500],[2,450],[3,400],[4,300],[5,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S18SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,250],[25,225],[55,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[8,200]],BR:[[1,450],[2,350],[3,300],[6,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]}};
const CC_MAJOR_PAY_2021={1:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1000]],NAC:[[1,50000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,10000],[9,8000],[10,5000],[15,3000],[20,1800],[26,1000],[33,600]],NAW:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},2:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1000]],NAC:[[1,50000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,10000],[9,8000],[10,5000],[15,3000],[20,1800],[26,1000],[33,600]],NAW:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},3:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1200]],NAC:[[1,45000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,8000],[9,5000],[10,3500],[15,2300],[20,1400],[26,700],[33,500]],NAW:[[1,16000],[2,11500],[3,8000],[4,7000],[5,5000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,30000],[2,25000],[3,17000],[4,14000],[5,10000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1000],[26,625],[33,425]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},4:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1200]],NAC:[[1,45000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,8000],[9,5000],[10,3500],[15,2300],[20,1400],[26,700],[33,500]],NAW:[[1,16000],[2,11500],[3,8000],[4,7000],[5,5000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,30000],[2,25000],[3,17000],[4,14000],[5,10000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1000],[26,625],[33,425]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},5:{EU:[[1,200000],[2,150000],[3,90000],[4,60000],[5,40000],[6,30000],[7,25000],[8,20000],[9,18000],[10,14800],[15,6500],[20,5000],[25,4000],[33,3100]],NAC:[[1,95000],[2,70000],[3,42000],[4,28000],[5,18000],[6,14000],[7,12000],[8,10000],[9,8000],[10,6500],[15,3000],[20,2300],[25,1950],[33,1500]],NAW:[[1,35000],[2,27000],[3,16000],[4,10500],[5,7000],[6,5500],[7,4500],[8,3500],[9,3000],[10,2300],[15,1100],[20,950],[25,800],[33,550]],BR:[[1,60000],[2,47000],[3,28000],[4,19000],[5,12000],[6,9500],[7,8000],[8,6500],[9,5300],[10,4000],[15,2000],[20,1600],[25,1400],[33,1100]],ASIA:[[1,21500],[2,16500],[3,10000],[4,6500],[5,4500],[6,3500],[7,2700],[8,2100],[9,1900],[10,1400],[15,700],[20,600],[26,500],[33,400]],ME:[[1,17000],[2,13333],[3,8000],[4,5000],[5,3500],[6,2800],[7,2300],[8,1700],[9,1500],[10,1100],[15,600],[20,500],[25,400],[33,300]],OCE:[[1,13000],[2,10000],[3,6000],[4,4000],[5,2500],[6,2000],[7,1750],[8,1300],[9,1150],[10,900],[15,500],[20,400],[25,300],[33,250]]}};
const GR2021_TRIOS={"EU":[["Setty","Kami","teeq"],["Queasy","Anas","Th0masHD"],["Hen","TaySon","Chapix"],["Vadeal","JannisZ","Noahreyli"],["Safik","1Lusha","Putrick"],["dyox","Crow VII","100T MrJoseeh"],["Acrian","FuryLegendary","97default"],["Kefyy","pkr","mlodyy771"],["FlowiS","Hellfire","Skram"],["drain gang chief","Shady","Stompy"],["Bloomy","PabloWingu","Swag"],["еtq","Hottie","elokratz"],["FΟRK 381","dzimker","Chico"],["Fastroki","Aqua","rezon ay"],["Endretta","Benjyfishy","MrSavage"],["JOE","Karma","Kylie"],["Floki","Clement","Decyptos"],["Aurerofiez","Poul","Fornax"],["DKS","graye초기","MCES Mirza 愛"],["7aaID gty","Flyy 281","Waiz"],["Andilex","4zr","Xsweeze"],["Skite","Bubak","Ovlder"],["Saevid","Umplify","Matsoe"],["Pinq","Nebs","TruleX"],["TuNa","Mikson","pokimen21"],["Kirb1","banw1se19","69 Minty"],["Merstach","Malibuca","Shizoanmee"],["Skydeun","bitflox ツ","COOKIE SIUUU"],["Kiryache32","Stormyrite","Toose"],["Jules785971","fire228","Art1st "],["Michael ","AstroSMZ","Verox"],["slay kamilek","Jimmy Rozprówacz","Blacha "],["savateschaudtoi","BadSniper","STRAW Force"]],"NAC":[["Dukez","Mero","Bugha"],["Jamper","Deyy","Tragix"],["Slackes","Acorn","Jahq"],["Bucke","Peterbot","MackWood"],["Ceice","Cold","Elitxe"],["Commandment","Cented","Stretch"],["Nittle","Casqer","clarityG"],["Ajerss","Saf","Khanada"],["Degen","Nosh","Eomzo"],["DeRoller","Speguu","Charlie"],["skqttles","Justice","Userz"],["Zlem","Tkay","Chukky"],["PaMstou","wCarey","Fatch"],["Osp","Visxals","Fryst"],["Av","Dmur","Edan"],["Okis","Nani","Dusky"],["Voil","Xccept","Snake"],["Cobolt","Sparkg","Aminished"],["Narwhal","Bully","Tabnae"],["Muz","Joji","Rocaine"],["Nexy","Crackly","Wrigley"],["Mikey","Jays","Smqcked"],["Brycx","Cam","Pdplague"],["Kreo","Knight","RogueShark"],["Shadow","Jayth","Savaje"],["tiekko","Nosn","Gold"],["Blakeps","Scoped","verT"],["Megga","Pxmp","Dubs"],["Dom","Chimp","Ganzo"],["Kn1pher","Doniee","Simple"],["Crumble","Marzz_OW","Bank"],["Mudzi","Mnrr","Yuddn"],["Neeqo","Nounzy","Pxlarized"]],"NAW":[["Arkhram","Reet","EpikWhale"],["poffiee","cyrzr","eclipseNA"],["andyvencha","Criizux","Jelty"],["g0dku","Glace","fecoy"],["Middi","Nico","Chris"],["RichHomieQuinn","WAVE","Kewl"],["Frapai","Blizy","Nate"],["Grim","Yumi","Squishy"],["Rehx","favs","Snacky"],["Kenshi","Maken","Jay"],["Bacca","Nitrix","Kytrex"],["Rexzi","Dynamic","Zehlo"],["Ark","Aiden","Nigel"],["Mony","Hov","Reguletor"],["Chicken","Lush","Mechton"],["Cash","Jibba","natee"],["jayrosez","Dog","Zinqxz"],["Symetrical","Temple","wavyjacob"],["Trashy","Verny","exe"],["Jarritos","Keto","Walay"],["defiable","Salko","Kaboo"],["Combxt","Zays","Ordepz"],["Nach","G5RC","Antraxs"],["Drew","Kuhvn","Cheatrs"],["Flixx","Mudio","Sirbrian"],["Falconer","KadenOX","4DRStorm"],["Jagveer","Batman Bugha","Wheels"],["Genshink","DragonRG","Deih"],["Quickamon","Rasso","Yawn"],["Ghouls","Pollo","Vlux"],["Lime","Chip","Rex"],["fakie","Yuki","Izo"],["Slick","ChickenItza","Alliege"]],"BR":[["OPai","Phzin","gsx"],["H4wwk","Wey","nov1ce"],["XI rynm","KBR","Diguera"],["guneves","edson","roomtrash6-.-"],["Pattaty","njrⓐⓢשٍّ","Kitoz"],["Cadu","seeyunǃ","EdRoadToGlory"],["Fishy","riqueessj.","Sanku"],["Frans","Filipe","Jpsk1ng"],["xxxxǃǃǃǃ","C9 blхckoutz","KING"],["Frosty ","Bagu","Redlee"],["Suetam","spitflow","K1nG"],["kaykywhale","insanofv.","Lorde"],["Liimaa","Xeat","fаcu on top"],["Collet","mojakhub","AG1RRE."],["dott1 wype mode","Barroso","Scarpa"],["tortugafishy","Eladiojal JM","Twistz 츠"],["nikti mt quente","gxT","nathes"],["Pingu","manocaki","hugody1"],["RustyK","Tecne","fazer"],["ᵐᵃˢᵗᵉᵉʳ","Persa","Nicks"],["xx never gone di","retake2bleeak47","klose"],["Nuti","Diamond","iKalifa PLS"],["yagasfv","Caduzin","Pastzk"],["Culiаcan","leleo","lorax "],["LaroKashi","Gangifishy","Magni"],["santidead22","keicox","fakkz endless"],["Snowspampiunpiun","gbzn 亗","twitter lereqfn"],["Sweet is back","champissj","xlг8"],["Bryan","Gustyx 7","FNCS 鬼"],["Pulga","PINA ICEMAN","Ed.Winter"],["Betto69Carabina","Cocak1ng","naviaposentado"],["tavarezao","лучший прицел","xLuchi7"],["unsualhino 懶惰","optıcalrr","BIG divecabot 10"],["Pulga","pina 00","Ed.Winter"]],"ASIA":[["Albedo","Dokn","Buyuriru"],["Ruri","Pepoclip","Koyota"],["Runa","raru","Yusea"],["Qjac","Naetor","Alice"],["Rainy","Ess","Peterpan"],["estebanosh","seаk.","backhou- -"],["2SNgNlalah","Jozya","Leyyner"],["MrPickels52","frenzy stan 윈터","SCION HOLDS W"],["upsilonε","clxxer","ALBA くりまんじゅう -v-"],["Moon ӝ","ALBA-A fa1zzy"],["Gyen","キリアンエンバぺ","cor fatman"],["Maesar","Bot","KUREN"],["Rxrx26","Yama","bykn"],["SwizzY","Zotax","Shamokiy"],["WildHawk","Maufin","Rimr"],["Zagou","Flot0r","goma"],["AdaM 水","Cigol 火","nocluebuddy12"],["미야.","Fram","Pina"],["Spayed","A2リテイルローのしゅうと","Jaemon"],["Minipiyo","よっしゃと太郎","User-3448db3db3"],["TinkerBel1x","seita isono","KENTAch"],["Rialy","Kogane","Kagetora"],["あんそにーていらー","Vallhd","おにぎり-.-"],["Koa","CODE_lCEMAN","KWZ Clemens"],["Mainly","マニマニRio","EDGE Ruisana"],["Syamu","badmind.","ぁさ."],["Masatxﱞ","Duduzera25","User-7cf55fe64f"],["Shunsyan","RizArt","Bob"],["Otome","EEHNOW","LODSTK"],["まる","Weathering.","RRRRRPRRRR"],["herokis .","mikufo777","ごっとまさくんだお"],["Fire","RazL","Shinckyfishy"],["Toraa","Æ IGNITE.soufini","Ank仲村"]],"ME":[["Snow","Raed less","Snowyka"],["Fahad","Yonx","Nm7"],["FKS","і lоve doоpie","P5EK"],["Hulks","kix.i","Bleed"],["Spy","Rapit","RV"],["SCYTES Hellon 廴","murloc is back","vagnaR."],["DRaFTell","Smsomfishy","Rakan Fo"],["Xx731","Hero","KiritoKun"],["Phaпtom2x","Kai","ABUFAL7"],["231ef7fe","Jounior 7","Eroxkun ʕᵒᴥᵒʔ"],["Balor","Adapter","Mansour"],["Poor","lil Mshary","br1ckzlǃ"],["Kroolsta1x","LeziX ","Exp Msg"],["M7SN 456","N ོ","LORDUID"],["NagaWithAttitude","Dexefite"],["mancity TT","MAXM0N","salman ay non"],["viiroos","Nаif 505","Lord"],["Modisk","fаhаd","Metab911 不"],["QnDx","Nachiiri","fb376e2a"],["Puma ","India on Top 7","iNOTTRX"],["Abdullah lalala","Escdark","Rudy M10"],["KuKi","Souriano","Nyle"],["stoyvaks","RdŁz","الموهوب سابقا"],["RuTzMK","ASМR FT","L2 SOJOD9"],["rtaw222","ŁvR","ＫＳＡ-"],["Faisal 17","FlixyGOTY 10","Wqzzi"],["kaiz_-","Medal Originz","cccovolskxiii"],["map xo","2912 Lozer","tackyfv"],["LND fzkLOLǃ","Kalgamer","RVL trikshotz"],["A7mdRqx","Таx.","Trickviv 7"],["L8afh ネ","PNR","7ámąnz"],["3jmy ","HisssBackkkkk","Smasher 7"],["EGOISTAAAAAAAAA","Crow M3touq","Sweatykunfvǃ"]],"OCE":[["Suns","vanner tuii","alex"],["dev0nhendryx","Scammed","xalky utch clay"],["VortexM","Jace","Sunz"],["Pumpkin","volx","Looter"],["Sorif","Oreo","Loyal Eshz 11 真"],["X2twins Jordan","x2twins Jesse","radius"],["Zedox","sio tzu","Raiku"],["Spiker","fab","Keemo 24ǃ"],["Jynx","danath","worthy"],["remi ihmo","overt zanzjerss","radial fa"],["APOLOXSMURDA","PWR BАSIL","sahilgoundar69"],["eggy","Macheew","DAWGSLAYERJOHN92"],["goeg.","Chef Jeff Lаd","Skits"],["Mildojos914","Moozsama","gіlle"],["Flenny","Cynical","cyrexブカ"],["Sierra Cabot","Gazer","Baily"],["Newbatoon","50ㅤ","рhluxzy"],["alz the carry","Oatley","Price"],["angy445","rhyzah","Mysty"],["Megadan","Sah4pf","Pogue"],["Jvano","Bluezie .","Maniaswag 神"],["dіstrict","bantis free","Tekmarr"],["2Faulty","Mooty Grimes","Lunr"],["Bathan","kuda","Rel"],["ryanvd2324","LOYAL DEATH ち","va Mammal7"],["Maihaze","Synxk","Twenty 6ix"],["Daresome","sрrоut","Soaked"],["srw uchiha","SNG xXgamergirlx","BMP"],["BLYNK","Zuruuyu","trexygod"],["Maw","aimer grizz 24","Atua"],["Fisher","Pâd","Heeney Fan"],["Holtay","Toyswagger","blynks"],["vF relay","ssjbobbfan","arken 11"]]};
// ==== /FNCS 2021 cal ====
// ==== FNCS 2022 cal (tools/splice-2022.js) ====
/* ---- FNCS 2022 в карьере ------------------------------------------------------
   Дуо весь год, Chapter 3. Даты и квоты — окна Epic с архива Tracker
   (tools/measured/tracker-2022-*.json), места финалов NA — Liquipedia (liqui-2022/);
   спека — docs/superpowers/specs/2026-09-27-career-year-2022-design.md.

   Три сезона FNCS (C3S1–C3S3) — «Мейджоры» карьеры: квалификаторы → полуфинал в три
   сессии → Гранд-финал. См. runCareerMajor2022. Осенью (C3S4) FNCS нет — дивизионные
   кубки Elite / Challenger / Contender, семь недель; потом Invitational в Роли. */
const CC_YEAR_2022_FROM='2021-12-06', CC_YEAR_2022_TO='2022-12-11';   // + Кубок наций после Роли
const CAREER_YEAR_2022=[
  // Мейджор 1 (C3S1): два квалификатора по три раунда, раунды 2 и 3 — одним вечером.
  ['2022-02-17','2022-02-17','Major1_2022_Q1R1','major'],
  ['2022-02-18','2022-02-18','Major1_2022_Q1R23','major'],
  ['2022-02-19','2022-02-19','Major1_2022_Q2R1','major'],
  ['2022-02-20','2022-02-20','Major1_2022_Q2R23','major'],
  ['2022-02-25','2022-02-25','Major1_2022_Semi1','major'],
  ['2022-02-26','2022-02-26','Major1_2022_Semi2','major'],
  ['2022-02-27','2022-02-27','Major1_2022_Semi3','major'],
  ['2022-03-05','2022-03-06','Major1_2022_Final','major'],
  // Мейджор 2 (C3S2): три квалификатора по четыре раунда.
  ['2022-05-02','2022-05-02','Major2_2022_Q1R1','major'],
  ['2022-05-04','2022-05-04','Major2_2022_Q1R2','major'],
  ['2022-05-05','2022-05-05','Major2_2022_Q1R3','major'],
  ['2022-05-06','2022-05-06','Major2_2022_Q1R4','major'],
  ['2022-05-07','2022-05-07','Major2_2022_Q2R12','major'],
  ['2022-05-08','2022-05-08','Major2_2022_Q2R34','major'],
  ['2022-05-13','2022-05-13','Major2_2022_Q3R1','major'],
  ['2022-05-14','2022-05-14','Major2_2022_Q3R23','major'],
  ['2022-05-15','2022-05-15','Major2_2022_Q3R4','major'],
  ['2022-05-20','2022-05-20','Major2_2022_Semi1','major'],
  ['2022-05-21','2022-05-21','Major2_2022_Semi2','major'],
  ['2022-05-22','2022-05-22','Major2_2022_Semi3','major'],
  ['2022-05-28','2022-05-29','Major2_2022_Final','major'],
  // Мейджор 3 (C3S3).
  ['2022-07-08','2022-07-08','Major3_2022_Q1R1','major'],
  ['2022-07-09','2022-07-09','Major3_2022_Q1R23','major'],
  ['2022-07-10','2022-07-10','Major3_2022_Q1R4','major'],
  ['2022-07-11','2022-07-11','Major3_2022_Q2R1','major'],
  ['2022-07-13','2022-07-13','Major3_2022_Q2R2','major'],
  ['2022-07-14','2022-07-14','Major3_2022_Q2R3','major'],
  ['2022-07-15','2022-07-15','Major3_2022_Q2R4','major'],
  ['2022-07-16','2022-07-16','Major3_2022_Q3R12','major'],
  ['2022-07-17','2022-07-17','Major3_2022_Q3R34','major'],
  ['2022-07-22','2022-07-22','Major3_2022_Semi1','major'],
  ['2022-07-23','2022-07-23','Major3_2022_Semi2','major'],
  ['2022-07-24','2022-07-24','Major3_2022_Semi3','major'],
  ['2022-08-13','2022-08-14','Major3_2022_Final','major'],
  // FNCS Invitational, PNC Arena (Роли), 12–13 ноября: 50 приглашённых дуо.
  ['2022-11-12','2022-11-13','Invitational2022','globals'],
  // Кубок наций — три субботы после Роли (выдумка режима, см. ccNationsBook).
  ['2022-11-26','2022-11-26','NationsTrial','nations'],
  ['2022-12-03','2022-12-03','NationsQual','nations'],
  ['2022-12-10','2022-12-10','NationsFinal','nations']
];
// Сезоны 2022-го — Chapter 3 (S19–S22), границы по патчам.
const CC_SEASONS_2022=[
  {id:'S19', from:'2021-12-05', to:'2022-03-19'},
  {id:'S20', from:'2022-03-20', to:'2022-06-04'},
  {id:'S21', from:'2022-06-05', to:'2022-09-17'},
  {id:'S22', from:'2022-09-18', to:'2022-12-03'}
];
/* Дивизионные кубки C3S4 (Tracker, S22_DivisionalCups): Elite по средам и пятницам, финал
   Elite в субботу; Challenger и Contender — в те же вечера. Placement Cup 24 сентября не
   играется: ступень ставится по рейтингу в день старта кубков (ccDiv22Place). */
const CC_CUP_WEEKS_2022=[
  ['S22_DivisionalCups','2022-09-28','2022-09-30','2022-10-01'],
  ['S22_DivisionalCups','2022-10-05','2022-10-07','2022-10-08'],
  ['S22_DivisionalCups','2022-10-12','2022-10-14','2022-10-15'],
  ['S22_DivisionalCups','2022-10-19','2022-10-21','2022-10-22'],
  ['S22_DivisionalCups','2022-10-26','2022-10-28','2022-10-29'],
  ['S22_DivisionalCups','2022-11-02','2022-11-04','2022-11-05'],
  ['S22_DivisionalCups','2022-11-16','2022-11-18','2022-11-19']
];
// Дивизионы 2022-го живут только в C3S4: с Placement Cup до финала седьмой недели.
const CC_DIV_FROM_2022='2022-09-24', CC_DIV_END_2022='2022-11-19';
// Обложки дней 2022-го — остров своего сезона (Мейджор n — k<n>, Роли — k4).
CAREER_YEAR_2022.forEach(r=>{
  const m=/^Major(\d)_2022_/.exec(r[2]);
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-k'+m[1]+'.jpg';
});
CAREER_EV_ART_ID.Invitational2022='art/map-k4.jpg';
// Одна книга пар на год, как у 2023-го: пары Гранд-финалов и полуфиналов трёх сезонов (k1–k3).
const CC_SNAPSHOTS_2022=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'k1', from:CC_YEAR_2022_FROM, playIn:/2022 C3S1 . Grand Finals/, lcq:/2022 C3S1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'k2', from:'2022-03-20', playIn:/2022 C3S2 . Grand Finals/, lcq:/2022 C3S2 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'k3', from:'2022-06-05', playIn:/2022 C3S3 . Grand Finals/, lcq:/2022 C3S3 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
// Generated by tools/build-2022-cal.js — капы, выплаты и Invitational FNCS 2022.
const CC_VICTORY_2022=[
  {day:'2022-01-10',id:'S19_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-01-15',id:'S19_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-01-19',id:'S19_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-01-22',id:'S19_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-01-24',id:'S19_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-01-29',id:'S19_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-01-31',id:'S19_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-05',id:'S19_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-02-07',id:'S19_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-12',id:'S19_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-02-14',id:'S19_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-19',id:'S19_SoloCashCup',mode:'solo',n:6,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-02-21',id:'S19_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-26',id:'S19_SoloCashCup',mode:'solo',n:7,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-03-07',id:'S19_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-03-12',id:'S19_SoloCashCup',mode:'solo',n:8,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-03-14',id:'S19_SoloCashCup',mode:'solo',n:9,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-04-04',id:'S20_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-09',id:'S20_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-04-11',id:'S20_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-16',id:'S20_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-04-18',id:'S20_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-23',id:'S20_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-04-25',id:'S20_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-30',id:'S20_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-05-09',id:'S20_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-05-16',id:'S20_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-05-21',id:'S20_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-05-23',id:'S20_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-05-30',id:'S20_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-06-25',id:'S21_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-06-27',id:'S21_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-07-02',id:'S21_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-07-04',id:'S21_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-07-19',id:'S21_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-08',id:'S21_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-15',id:'S21_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-08-20',id:'S21_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-22',id:'S21_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-08-27',id:'S21_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-29',id:'S21_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-09-03',id:'S21_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-09-05',id:'S21_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-09-10',id:'S21_DuosCashCup',mode:'duo',n:9,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-09-12',id:'S21_SoloCashCup',mode:'solo',n:6,name:'Solo Cash Cup',pay:'S21SOLO'}
];
const CC_DCC_PAY_2022={S19:{EU:[[1,1250],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,550],[10,500],[15,400],[20,350],[25,325],[30,300],[35,275],[40,250]],NAC:[[1,600],[2,500],[3,475],[4,450],[5,425],[6,400],[7,375],[8,350],[9,325],[10,300],[15,275],[20,250],[25,225]],NAW:[[1,500],[2,300],[3,275],[4,250],[5,225],[10,200]],BR:[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ASIA:[[1,425],[2,275],[3,250],[4,225],[8,200]],ME:[[1,400],[2,250],[3,225],[6,200]],OCE:[[1,375],[4,300]]},S19SOLO:{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[15,500],[25,450],[35,400],[45,300],[55,200]],NAC:[[1,800],[2,550],[3,500],[4,450],[5,400],[10,350],[15,300],[25,250],[35,200]],NAW:[[1,700],[2,450],[3,400],[4,350],[5,300],[10,250]],BR:[[1,750],[2,600],[3,500],[4,400],[5,350],[10,300],[15,250],[25,200]],ASIA:[[1,600],[2,400],[5,250],[8,200]],ME:[[1,500],[4,300],[7,200]],OCE:[[1,400],[2,300],[3,250],[6,200]]},S20:{EU:[[1,1250],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,550],[10,500],[15,400],[20,350],[25,325],[30,300],[35,275],[40,250]],NAC:[[1,600],[2,500],[3,475],[4,450],[5,425],[6,400],[7,375],[8,350],[9,325],[10,300],[15,275],[20,250],[25,225]],NAW:[[1,500],[2,300],[3,275],[4,250],[5,225],[10,200]],BR:[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ASIA:[[1,425],[2,275],[3,250],[4,225],[8,200]],ME:[[1,400],[2,250],[3,225],[6,200]],OCE:[[1,375],[4,300]]},S20SOLO:{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[15,500],[25,450],[35,400],[45,300],[55,200]],NAC:[[1,800],[2,550],[3,500],[4,450],[5,400],[10,350],[15,300],[25,250],[35,200]],NAW:[[1,700],[2,450],[3,400],[4,350],[5,300],[10,250]],BR:[[1,750],[2,600],[3,500],[4,400],[5,350],[10,300],[15,250],[25,200]],ASIA:[[1,600],[2,400],[5,250],[8,200]],ME:[[1,500],[4,300],[7,200]],OCE:[[1,400],[2,300],[3,250],[6,200]]},S21:{EU:[[1,1250],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,550],[10,500],[15,400],[20,350],[25,325],[30,300],[35,275],[40,250]],NAC:[[1,600],[2,500],[3,475],[4,450],[5,425],[6,400],[7,375],[8,350],[9,325],[10,300],[15,275],[20,250],[25,225],[30,200]],NAW:[[1,350],[2,325],[3,300],[4,275],[5,250],[9,225],[12,200]],BR:[[1,350],[2,325],[3,300],[4,275],[5,250],[9,225],[12,200]],ASIA:[[1,350],[2,325],[3,300],[4,275],[5,250],[9,225],[12,200]],ME:[[1,325],[2,250],[3,225],[6,200]],OCE:[[1,325],[2,250],[3,225],[6,200]]},S21SOLO:{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[15,500],[25,450],[35,400],[45,300],[55,200]],NAC:[[1,800],[2,550],[3,500],[4,450],[5,400],[10,350],[15,300],[25,250],[40,200]],NAW:[[1,650],[2,500],[3,450],[4,400],[5,350],[6,300],[9,250],[12,200]],BR:[[1,650],[2,500],[3,450],[4,400],[5,350],[6,300],[9,250],[12,200]],ASIA:[[1,650],[2,500],[3,450],[4,400],[5,350],[6,300],[9,250],[12,200]],ME:[[1,500],[4,300],[7,200]],OCE:[[1,500],[4,300],[7,200]]}};
const CC_MAJOR_PAY_2022={1:{EU:[[1,150000],[2,100000],[3,75000],[4,60000],[5,50000],[6,40000],[7,30000],[8,20000],[9,15000],[10,10000],[15,8000],[20,5000],[25,3500],[30,3000],[35,2500],[40,2000],[45,1500],[50,750]],NAC:[[1,65000],[2,45000],[3,35000],[4,28000],[5,20000],[6,16000],[7,12000],[8,9000],[9,7500],[10,5000],[15,4000],[20,3000],[25,2500],[30,2000],[35,1500],[40,1000],[45,750],[50,500]],NAW:[[1,22500],[2,18000],[3,14000],[4,11000],[5,9000],[6,7000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1500],[20,1000],[25,600],[30,450],[35,400],[40,350],[45,300],[50,250]],BR:[[1,40000],[2,30000],[3,25000],[4,20000],[5,15000],[6,10000],[7,7500],[8,6000],[9,5000],[10,4000],[15,3000],[20,2000],[25,1500],[30,1000],[35,600],[40,450],[45,400],[50,350]],ASIA:[[1,15000],[2,10000],[3,8000],[4,5000],[5,4000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,700],[25,500],[30,400],[40,300],[50,200]],ME:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]],OCE:[[1,9000],[2,6000],[3,4500],[4,2500],[5,2000],[6,1500],[7,1400],[8,1300],[9,1200],[10,1100],[15,800],[20,550],[25,400],[30,350],[40,300],[50,200]]},2:{EU:[[1,150000],[2,100000],[3,75000],[4,60000],[5,50000],[6,40000],[7,30000],[8,20000],[9,15000],[10,10000],[15,8000],[20,5000],[25,3500],[30,3000],[35,2500],[40,2000],[45,1500],[50,750]],NAC:[[1,65000],[2,45000],[3,35000],[4,28000],[5,20000],[6,16000],[7,12000],[8,9000],[9,7500],[10,5000],[15,4000],[20,3000],[25,2500],[30,2000],[35,1500],[40,1000],[45,750],[50,500]],NAW:[[1,22500],[2,18000],[3,14000],[4,11000],[5,9000],[6,7000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1500],[20,1000],[25,600],[30,450],[35,400],[40,350],[45,300],[50,250]],BR:[[1,40000],[2,30000],[3,25000],[4,20000],[5,15000],[6,10000],[7,7500],[8,6000],[9,5000],[10,4000],[15,3000],[20,2000],[25,1500],[30,1000],[35,600],[40,450],[45,400],[50,350]],ASIA:[[1,15000],[2,10000],[3,8000],[4,5000],[5,4000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,700],[25,500],[30,400],[40,300],[50,200]],ME:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]],OCE:[[1,9000],[2,6000],[3,4500],[4,2500],[5,2000],[6,1500],[7,1400],[8,1300],[9,1200],[10,1100],[15,800],[20,550],[25,400],[30,350],[40,300],[50,200]]},3:{EU:[[1,150000],[2,100000],[3,75000],[4,60000],[5,50000],[6,40000],[7,30000],[8,20000],[9,15000],[10,10000],[15,8000],[20,5000],[25,3500],[30,3000],[35,2500],[40,2000],[45,1500],[50,750]],NAC:[[1,80000],[2,50000],[3,40000],[4,28000],[5,20000],[6,16000],[7,12000],[8,9000],[9,7500],[10,5000],[15,4000],[20,3000],[25,2500],[30,2000],[35,1500],[40,1200],[45,800],[50,700]],NAW:[[1,22500],[2,18000],[3,14000],[4,11000],[5,9000],[6,7000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1500],[20,1000],[25,600],[30,450],[35,400],[40,350],[45,300],[50,250]],BR:[[1,20000],[2,15000],[3,12000],[4,9000],[5,8000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1500],[25,1000],[30,600],[35,400],[40,300],[45,250],[50,200]],ASIA:[[1,20000],[2,15000],[3,12000],[4,9000],[5,8000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1500],[25,1000],[30,600],[35,400],[40,300],[45,250],[50,200]],ME:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]],OCE:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]]}};
const CC_WF_PAY_2022={EU:[[1,5000],[2,2700],[3,1800],[10,900],[25,450],[40,300]],NAC:[[1,2500],[2,1200],[3,800],[10,400],[40,200]],NAW:[[1,1250],[2,600],[3,400],[40,200]],BR:[[1,1250],[2,600],[3,400],[40,200]],ASIA:[[1,1250],[2,600],[3,400],[40,200]],ME:[[1,1250],[2,600],[3,400],[40,200]],OCE:[[1,1250],[2,600],[3,400],[40,200]]};
const INV2022_DUOS=[["Setty","Kami"],["Veno","Queasy"],["Cented","Cold"],["Th0masHD","Trippernn"],["Phzin","Kitoz"],["Vortex","Hen"],["BadSniper","Noahreyli"],["JoeFN","zAndy"],["KBR","Xeat"],["Smite","Larson"],["Commandment","Avery"],["Klown","Refsgaard"],["Acorn","Edgey"],["Bevvys","Vortexers"],["Dukez","Clix"],["Malibuca","Merstach"],["Juu","Yousri"],["Vic0try0na","Merijn"],["Pinq","Anas"],["TruleX","Chico"],["Vadeal","JannisZ"],["Khanada","MackWood"],["Robban","Wox"],["Bacca","On1"],["Kewl","Yumi"],["K1nG","EdRoadToGlory"],["EpikWhale","Reet"],["Rapit","Andilex"],["Alice","Threats"],["Zagou","Merem"],["MrSavage","IDrop"],["TaySon","Chapix"],["Belusi","Hijoe"],["Runa","Pepo"],["Fatch","PaMstou"],["Bugha","Mero"],["Jamper","Peterbot"],["Skram","Chimp"],["Parz","Rays"],["Grolzz","Rifty"],["PabloWingu","Swag"],["favs","Snacky"],["Falconer","Hellfire"],["Mikson","artor"],["Rezon ay","aqua"],["Alex","Baily"],["Muz","Looter"],["Basil","Jace"],["Spy","FKS"],["Nov1ce","Retake"]];
const INV2022_SEATS={EU:22,NAC:10,BR:4,NAW:6,ME:2,ASIA:3,'?':1,OCE:2};
const INV2022_PRIZES={"1":200000,"2":140000,"3":120000,"4":90000,"5":70000,"6":60000,"7":50000,"8":40000,"9":30000,"10":20000,"11":16000,"12":14000,"13":10000,"14":9500,"15":8000,"16":7000,"17":7000,"18":7000,"19":7000,"20":7000,"21":6000,"22":6000,"23":6000,"24":6000,"25":6000,"26":4000,"27":4000,"28":4000,"29":4000,"30":4000,"31":3000,"32":3000,"33":3000,"34":3000,"35":3000,"36":2000,"37":2000,"38":2000,"39":2000,"40":2000,"41":1500,"42":1500,"43":1500,"44":1500,"45":1500,"46":1000,"47":1000,"48":1000,"49":1000,"50":1000};
// ==== /FNCS 2022 cal ====
/* ---- FNCS 2023 в карьере ------------------------------------------------------
   Отзыв: «сделай 2023 год теперь». Дуо весь год, Chapter 4. Снято с архива Tracker
   (tools/measured/tracker-2023-*.json) и Liquipedia (liqui-2023/); спека —
   docs/superpowers/specs/2026-09-27-career-year-2023-design.md.

   Мейджор 2023-го (Epic): три недели, у каждой Day 1 (открытый, топ-200) → Day 2
   (топ-50) → финал недели (50 дуо, шесть игр) — он даёт очки серии. Гранд-финал —
   50 дуо: топ серии и топ-10 Surge Week (у Мейджора 3 Surge нет — 50 по серии),
   двенадцать игр за два дня. После Мейджора 3 — Last Chance Major (Day 1 → топ-250
   → Day 2 → топ-50 → финал) в нижнюю сетку Копенгагена. См. runCareerMajor2023. */
// До 30.11: после Кубка наций — сезон OG (C4 Season OG, остров Главы 1): денежные OG Skirmish креаторов 5–6 и 17–19 ноября,
// Solo Victory и ZB Duos Victory Cash Cup 13–30 ноября (архив Epic).
const CC_YEAR_2023_FROM='2022-12-05', CC_YEAR_2023_TO='2023-11-30';   // + Кубок наций после Копенгагена
const CAREER_YEAR_2023=[
  // Мейджор 1 (C4S1): недели 2–5, 9–12, 16–19 февраля, Surge 26 февраля, финал 4–5 марта.
  ['2023-02-02','2023-02-02','Major1_2023_W1D1','major'],
  ['2023-02-03','2023-02-03','Major1_2023_W1D2','major'],
  ['2023-02-05','2023-02-05','Major1_2023_W1F','major'],
  ['2023-02-09','2023-02-09','Major1_2023_W2D1','major'],
  ['2023-02-10','2023-02-10','Major1_2023_W2D2','major'],
  ['2023-02-12','2023-02-12','Major1_2023_W2F','major'],
  ['2023-02-16','2023-02-16','Major1_2023_W3D1','major'],
  ['2023-02-17','2023-02-17','Major1_2023_W3D2','major'],
  ['2023-02-19','2023-02-19','Major1_2023_W3F','major'],
  ['2023-02-26','2023-02-26','Major1_2023_Surge','major'],
  ['2023-03-04','2023-03-05','Major1_2023_Final','major'],
  // Мейджор 2 (C4S2): недели 13–15, 20–22, 27–29 апреля, Surge 6 мая, финал 13–14 мая.
  ['2023-04-13','2023-04-13','Major2_2023_W1D1','major'],
  ['2023-04-14','2023-04-14','Major2_2023_W1D2','major'],
  ['2023-04-15','2023-04-15','Major2_2023_W1F','major'],
  ['2023-04-20','2023-04-20','Major2_2023_W2D1','major'],
  ['2023-04-21','2023-04-21','Major2_2023_W2D2','major'],
  ['2023-04-22','2023-04-22','Major2_2023_W2F','major'],
  ['2023-04-27','2023-04-27','Major2_2023_W3D1','major'],
  ['2023-04-28','2023-04-28','Major2_2023_W3D2','major'],
  ['2023-04-29','2023-04-29','Major2_2023_W3F','major'],
  ['2023-05-06','2023-05-06','Major2_2023_Surge','major'],
  ['2023-05-13','2023-05-14','Major2_2023_Final','major'],
  // Мейджор 3 (C4S3): недели 20–22, 27–29 июля, 3–5 августа, финал 12–13 августа (без Surge).
  ['2023-07-20','2023-07-20','Major3_2023_W1D1','major'],
  ['2023-07-21','2023-07-21','Major3_2023_W1D2','major'],
  ['2023-07-22','2023-07-22','Major3_2023_W1F','major'],
  ['2023-07-27','2023-07-27','Major3_2023_W2D1','major'],
  ['2023-07-28','2023-07-28','Major3_2023_W2D2','major'],
  ['2023-07-29','2023-07-29','Major3_2023_W2F','major'],
  ['2023-08-03','2023-08-03','Major3_2023_W3D1','major'],
  ['2023-08-04','2023-08-04','Major3_2023_W3D2','major'],
  ['2023-08-05','2023-08-05','Major3_2023_W3F','major'],
  ['2023-08-12','2023-08-13','Major3_2023_Final','major'],
  // Last Chance Major 18–20 августа — «Мейджор 4» машины 2023-го.
  ['2023-08-18','2023-08-18','Major4_2023_W1D1','major'],
  ['2023-08-19','2023-08-19','Major4_2023_W1D2','major'],
  ['2023-08-20','2023-08-20','Major4_2023_W1F','major'],
  // Копенгаген, Royal Arena, 13–15 октября: верхняя сетка, нижняя, финал. См. runCareerGlobals2023.
  ['2023-10-13','2023-10-15','GlobalChampionship2023','globals'],
  // Кубок наций — три субботы после Копенгагена (выдумка режима, см. ccNationsBook).
  ['2023-10-21','2023-10-21','NationsTrial','nations'],
  ['2023-10-28','2023-10-28','NationsQual','nations'],
  ['2023-11-04','2023-11-04','NationsFinal','nations']
];
// Сезоны 2023-го — Chapter 4 (S23–S26), границы по патчам.
const CC_SEASONS_2023=[
  {id:'S23', from:'2022-12-04', to:'2023-03-09'},
  {id:'S24', from:'2023-03-10', to:'2023-06-08'},
  {id:'S25', from:'2023-06-09', to:'2023-08-24'},
  {id:'S26', from:'2023-08-25', to:'2023-11-02'},
  {id:'S27', from:'2023-11-03', to:'2023-12-02'}   // Season OG
];
// Обложки дней 2023-го — остров своего финала (Мейджор n — e<n>, Last Chance Major — e4).
CAREER_YEAR_2023.forEach(r=>{
  const m=/^Major(\d)_2023_/.exec(r[2]);
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-e'+Math.min(+m[1], 4)+'.jpg';
});
// Дивизионы C4S1 (январь — март) — см. CC_CUP_WEEKS_2023 ниже, у кубков.
// ==== FNCS 2023 cal (tools/splice-2023-rows.js) ====
// Generated by tools/build-2023-cal.js — капы и выплаты FNCS 2023 с Tracker.
const CC_VICTORY_2023=[
  {day:'2023-01-07',id:'S23_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',cash:100},
  {day:'2023-01-14',id:'S23_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',cash:100},
  {day:'2023-01-21',id:'S23_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',cash:100},
  {day:'2023-01-28',id:'S23_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-04',id:'S23_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-11',id:'S23_SoloCashCup',mode:'solo',n:6,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-18',id:'S23_SoloCashCup',mode:'solo',n:7,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-25',id:'S23_SoloCashCup',mode:'solo',n:8,name:'Solo Cash Cup',cash:100},
  {day:'2023-03-04',id:'S23_SoloCashCup',mode:'solo',n:9,name:'Solo Cash Cup',cash:100},
  {day:'2023-03-31',id:'S24_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-04-02',id:'S24_SoloVictoryCup',mode:'solo',n:1,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-07',id:'S24_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-04-09',id:'S24_SoloVictoryCup',mode:'solo',n:2,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-16',id:'S24_SoloVictoryCup',mode:'solo',n:3,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-23',id:'S24_SoloVictoryCup',mode:'solo',n:4,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-30',id:'S24_SoloVictoryCup',mode:'solo',n:5,name:'Solo Victory Cup',cash:100},
  {day:'2023-05-04',id:'S24_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-05-07',id:'S24_SoloVictoryCup',mode:'solo',n:6,name:'Solo Victory Cup',cash:100},
  {day:'2023-05-11',id:'S24_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-05-14',id:'S24_SoloVictoryCup',mode:'solo',n:7,name:'Solo Victory Cup',cash:100},
  {day:'2023-05-26',id:'S24_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-05-28',id:'S24_SoloVictoryCup',mode:'solo',n:8,name:'Solo Victory Cup',cash:100},
  {day:'2023-06-02',id:'S24_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-06-18',id:'S25_SoloVictoryCashCup',mode:'solo',n:1,name:'Solo Victory Cup',cash:100},
  {day:'2023-06-23',id:'S25_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-06-25',id:'S25_SoloVictoryCashCup',mode:'solo',n:2,name:'Solo Victory Cup',cash:100},
  {day:'2023-06-28',id:'S25_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-06-30',id:'S25_SoloVictoryCashCup',mode:'solo',n:3,name:'Solo Victory Cup',cash:100},
  {day:'2023-07-17',id:'S25_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-07-23',id:'S25_SoloVictoryCashCup',mode:'solo',n:4,name:'Solo Victory Cup',cash:100},
  {day:'2023-07-24',id:'S25_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-07-30',id:'S25_SoloVictoryCashCup',mode:'solo',n:5,name:'Solo Victory Cup',cash:100},
  {day:'2023-07-31',id:'S25_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-08-06',id:'S25_SoloVictoryCashCup',mode:'solo',n:6,name:'Solo Victory Cup',cash:100},
  {day:'2023-08-09',id:'S25_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-08-16',id:'S25_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-08-21',id:'S25_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-09-07',id:'S26_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-09-10',id:'S26_SoloVictoryCashCup',mode:'solo',n:1,name:'Solo Victory Cup',cash:100},
  {day:'2023-09-14',id:'S26_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-09-17',id:'S26_SoloVictoryCashCup',mode:'solo',n:2,name:'Solo Victory Cup',cash:100},
  {day:'2023-09-22',id:'S26_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-09-24',id:'S26_SoloVictoryCashCup',mode:'solo',n:3,name:'Solo Victory Cup',cash:100},
  {day:'2023-09-29',id:'S26_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-10-01',id:'S26_SoloVictoryCashCup',mode:'solo',n:4,name:'Solo Victory Cup',cash:100},
  {day:'2023-10-06',id:'S26_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-10-08',id:'S26_SoloVictoryCashCup',mode:'solo',n:5,name:'Solo Victory Cup',cash:100},
  {day:'2023-10-20',id:'S26_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-10-22',id:'S26_SoloVictoryCashCup',mode:'solo',n:6,name:'Solo Victory Cup',cash:100},
  {day:'2023-10-25',id:'S26_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-11-01',id:'S26_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S26'}
];
const CC_DCC_PAY_2023={S24:{EU:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],NAC:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],BR:[[3,250],[10,150],[40,100]],ASIA:[[3,250],[10,150],[40,100]],ME:[[1,250],[10,150],[40,100]],OCE:[[1,250],[10,150],[40,100]]},S25:{EU:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],NAC:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],BR:[[3,250],[10,150],[40,100]],ASIA:[[3,250],[10,150],[40,100]],ME:[[1,250],[10,150],[40,100]],OCE:[[1,250],[10,150],[40,100]]},S26:{EU:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],NAC:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],BR:[[3,250],[10,150],[40,100]],ASIA:[[3,250],[10,150],[40,100]],ME:[[1,250],[10,150],[40,100]],OCE:[[1,250],[10,150],[40,100]]}};
const CC_MAJOR_PAY_2023={1:{EU:[[1,100000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],NAC:[[1,60000],[2,35000],[3,25000],[4,18000],[5,14000],[6,10000],[7,8000],[8,6000],[9,4000],[10,3000],[15,2500],[20,2000],[25,1500],[30,1000],[35,750],[40,500],[45,300],[50,200]],BR:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ASIA:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ME:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]],OCE:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]]},2:{EU:[[1,100000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],NAC:[[1,75000],[2,47500],[3,34000],[4,25000],[5,20000],[6,15000],[7,12000],[8,9000],[9,6000],[10,4500],[15,3500],[20,2750],[25,2000],[30,1300],[35,850],[40,600],[45,400],[50,300]],BR:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ASIA:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ME:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]],OCE:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]]},3:{EU:[[1,100000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],NAC:[[1,75000],[2,47500],[3,34000],[4,25000],[5,20000],[6,15000],[7,12000],[8,9000],[9,6000],[10,4500],[15,3500],[20,2750],[25,2000],[30,1300],[35,850],[40,600],[45,400],[50,300]],BR:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ASIA:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ME:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]],OCE:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]]}};
const GC2023_DUOS={m1:[["Merstach","TaySon"],["Malibuca","Th0masHD"],["Acorn","Cold"],["Boltz","THORIK"],["Kitoz","Phzin"],["Pepo","Zagou"],["Anon","Suns"],["QnDx","Rapit"]],m2:[["Queasy","Veno"],["Karmy","Vanyak3kk"],["Kami","Setty"],["Flickzy","Gripey"],["IDrop","Mappi"],["Dukez","Edgey"],["Cooper","Mero"],["Pollo","Sphinx"],["Fazer","K1nG"],["Jaemon","Yuma"],["Skits","Sorif"],["7man","Kalgamer"]],m3:[["Chico","TruleX"],["Misha","t3eny"],["Blacha","Mikson"],["Axeforce","Robban"],["PodaSai","Snayzy"],["Pinq","vic0"],["Grolzz","Klown"],["Fastroki","Kylie"],["Kyry","P1ng"],["charyy","G13ras"],["Ajerss","Khanada"],["Bugha","Threats"],["Eomzo","Rise"],["Brycx","Chubs"],["Bacca","Parz"],["Batman Bugha","Rapid"],["Reet","Ritual"],["Muz","paper"],["Source","Yumi"],["Okis"],["916Gon","Pingu"],["Gabzera","Nuti"],["axadasz","Stryker"],["Boby","Larkpex"],["DayDus","Stain"],["Mkmkpapa","Shelom"],["Alex","worthy"],["Mshx","Rew"],["FHD","Hero"]],lcm:[["MrSavage","Vadeal"],["Clement","Kyzen"],["Hen","Vaske1x"],["Belusi","Vortex"],["Fnajen","Moneymaker"],["JannisZ","rezon ay"],["Liwshe","Stenno"],["Cheatiin","Pixie"],["Bylah","Peterbot"],["Cented","Pxlarized"],["Death","Tahi"],["Clix","EpikWhale"],["Kwanti","Tkay"],["Krisp","Noxy"],["Fatch","PaMstou"],["Bully","Shadow"],["Fishy","Talls"],["Frosty","WeY"],["Persa","Diguera"],["Dog","Raru"],["Aim","Zazi"],["Gazer","River"],["Adapter","FKS"],["Kirb1","wickesy"]]};
const GC2023_SEATS={m1:{EU:2,NAC:2,BR:1,ASIA:1,OCE:1,ME:1},m2:{EU:5,NAC:3,BR:1,ASIA:1,OCE:1,ME:1},m3:{EU:10,NAC:11,BR:3,ASIA:3,ME:2},lcm:{EU:9,NAC:8,BR:3,ASIA:2,OCE:1,ME:1}};
const GC2023_PRIZES={"1":1000000,"2":650000,"3":400000,"4":300000,"5":200000,"6":150000,"7":120000,"8":100000,"9":80000,"10":50000,"11":50000,"12":50000,"13":50000,"14":50000,"15":50000,"16":30000,"17":30000,"18":30000,"19":30000,"20":30000,"21":20000,"22":20000,"23":20000,"24":20000,"25":20000,"26":18000,"27":18000,"28":18000,"29":18000,"30":18000,"31":16000,"32":16000,"33":16000,"34":16000,"35":16000,"36":14000,"37":14000,"38":14000,"39":14000,"40":14000,"41":12000,"42":12000,"43":12000,"44":12000,"45":12000,"46":10000,"47":10000,"48":10000,"49":10000,"50":10000,"51":4000,"52":4000,"53":4000,"54":4000,"55":4000,"56":4000,"57":4000,"58":4000,"59":4000,"60":4000,"61":4000,"62":4000,"63":4000,"64":4000,"65":4000,"66":4000,"67":4000,"68":4000,"69":4000,"70":4000,"71":4000,"72":4000,"73":4000};
// ==== /FNCS 2023 cal ====
/* ---- FNCS 2024 в карьере ----
   Дуо весь год. Источники: tools/measured/tracker-2024-eu.json (окна EU), tracker-2024-regions.json (выплаты шести
   регионов, NA West в 2024 не было), Liquipedia (формат полуфиналов, Форт-Уэрт).
   Мейджор: два открытых квала (у EU и NAC 4 раунда, здесь у всех 3, раунд в вечер, отсечки 1000 → 250 → очки
   серии), полуфиналы в две сетки (верхняя топ-50 серии: пт/сб по 5 игр, победа в матче = финал, вс 3 игры топ-25;
   нижняя 51–250: пт 10, сб 6, вс 3, топ-15), финал 50 дуо, 12 игр за два дня (×1.5 второго дня не считаем).
   Очки серии линейные по месту последнего раунда (таблицы Epic в архиве нет). См. runCareerMajor2024. */
// До 30.11: после Форт-Уэрта — капы Главы 5 Сезона 4 (октябрь) и Chapter 2 Remix (2–30 ноября, остров Главы 2 Сезона 2):
// Trios Cash Cup, Solo Victory, Reload-капы из архива Epic.
const CC_YEAR_2024_FROM='2023-12-05', CC_YEAR_2024_TO='2024-11-30';   // + Кубок наций после Форт-Уэрта
const CAREER_YEAR_2024=[
  // Кубок наций — закрытие сезона, три субботы после последнего турнира FNCS (выдумка режима, см. ccNationsBook).
  ['2024-09-14','2024-09-14','NationsTrial','nations'],
  ['2024-09-21','2024-09-21','NationsQual','nations'],
  ['2024-09-28','2024-09-28','NationsFinal','nations'],
  // Major 1 (S28): квалификаторы 26–28 января и 2–4 февраля, полуфиналы 16–18 февраля, финал 24–25 февраля.
  ['2024-01-26','2024-01-26','Major1_2024_Q1R1','major'],
  ['2024-01-27','2024-01-27','Major1_2024_Q1R2','major'],
  ['2024-01-28','2024-01-28','Major1_2024_Q1R3','major'],
  ['2024-02-02','2024-02-02','Major1_2024_Q2R1','major'],
  ['2024-02-03','2024-02-03','Major1_2024_Q2R2','major'],
  ['2024-02-04','2024-02-04','Major1_2024_Q2R3','major'],
  ['2024-02-16','2024-02-16','Major1_2024_Semi1','major'],
  ['2024-02-17','2024-02-17','Major1_2024_Semi2','major'],
  ['2024-02-18','2024-02-18','Major1_2024_Semi3','major'],
  ['2024-02-24','2024-02-25','Major1_2024_Final','major'],
  // Major 2 (S29): 12–14 и 19–21 апреля, полуфиналы 10–12 мая, финал 18–19 мая.
  ['2024-04-12','2024-04-12','Major2_2024_Q1R1','major'],
  ['2024-04-13','2024-04-13','Major2_2024_Q1R2','major'],
  ['2024-04-14','2024-04-14','Major2_2024_Q1R3','major'],
  ['2024-04-19','2024-04-19','Major2_2024_Q2R1','major'],
  ['2024-04-20','2024-04-20','Major2_2024_Q2R2','major'],
  ['2024-04-21','2024-04-21','Major2_2024_Q2R3','major'],
  ['2024-05-10','2024-05-10','Major2_2024_Semi1','major'],
  ['2024-05-11','2024-05-11','Major2_2024_Semi2','major'],
  ['2024-05-12','2024-05-12','Major2_2024_Semi3','major'],
  ['2024-05-18','2024-05-19','Major2_2024_Final','major'],
  // Major 3 (S30): 14–16 и 21–23 июня, полуфиналы 19–21 июля, финал 27–28 июля.
  ['2024-06-14','2024-06-14','Major3_2024_Q1R1','major'],
  ['2024-06-15','2024-06-15','Major3_2024_Q1R2','major'],
  ['2024-06-16','2024-06-16','Major3_2024_Q1R3','major'],
  ['2024-06-21','2024-06-21','Major3_2024_Q2R1','major'],
  ['2024-06-22','2024-06-22','Major3_2024_Q2R2','major'],
  ['2024-06-23','2024-06-23','Major3_2024_Q2R3','major'],
  ['2024-07-19','2024-07-19','Major3_2024_Semi1','major'],
  ['2024-07-20','2024-07-20','Major3_2024_Semi2','major'],
  ['2024-07-21','2024-07-21','Major3_2024_Semi3','major'],
  ['2024-07-27','2024-07-28','Major3_2024_Final','major'],
  // Форт-Уэрт, 7–8 сентября 2024: 50 дуо, двенадцать игр, $2 000 000. Последнего шанса не было.
  ['2024-09-07','2024-09-08','GlobalChampionship2024','globals']
];
/* Капы с деньгами 2024-го (окна Tracker, только с выплатой): Duos Cash Cup — раунд 1
   открытый, раунд 2 на 6 игр с таблицей мест (pay — таблица на игрока, по региону);
   Solo Victory Cup — $100 на игрока за победу во втором раунде (три игры); Reload
   Duos Cash Cup (PC) 30 августа. Двухдневные капы стоят днём первого раунда.
   Zero Build, Squads Victory Cup, консольные и PlayStation Cup не взяты. */
const CC_VICTORY_2024=[
  {day:'2023-12-09', id:'S28_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S28'},
  {day:'2023-12-17', id:'S28_DuosCashCup', mode:'duo', n:2, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-01-20', id:'S28_DuosCashCup', mode:'duo', n:3, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-01-24', id:'S28_DuosCashCup', mode:'duo', n:4, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-02-20', id:'S28_DuosCashCup', mode:'duo', n:5, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-03-30', id:'S29_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-04-10', id:'S29_DuosCashCup', mode:'duo', n:2, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-04-15', id:'S29_DuosCashCup', mode:'duo', n:3, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-05-01', id:'S29_DuosCashCup', mode:'duo', n:4, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-06-05', id:'S30_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-06-11', id:'S30_DuosCashCup', mode:'duo', n:2, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-06-19', id:'S30_DuosCashCup', mode:'duo', n:3, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-06-26', id:'S30_DuosCashCup', mode:'duo', n:4, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-07-17', id:'S30_DuosCashCup', mode:'duo', n:5, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-07-24', id:'S30_DuosCashCup', mode:'duo', n:6, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-07-31', id:'S30_DuosCashCup', mode:'duo', n:7, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-08-07', id:'S30_DuosCashCup', mode:'duo', n:8, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-08-28', id:'S31_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S31'},
  {day:'2023-12-08', id:'S28_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-10', id:'S28_SoloVictoryCup', mode:'solo', n:2, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-15', id:'S28_SoloVictoryCup', mode:'solo', n:3, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-16', id:'S28_SoloVictoryCup', mode:'solo', n:4, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-20', id:'S28_SoloVictoryCup', mode:'solo', n:5, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-21', id:'S28_SoloVictoryCup', mode:'solo', n:6, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-22', id:'S28_SoloVictoryCup', mode:'solo', n:7, name:'Solo Victory Cup', cash:100},
  {day:'2024-01-19', id:'S28_SoloVictoryCup', mode:'solo', n:8, name:'Solo Victory Cup', cash:100},
  {day:'2024-01-21', id:'S28_SoloVictoryCup', mode:'solo', n:9, name:'Solo Victory Cup', cash:100},
  {day:'2024-02-09', id:'S28_SoloVictoryCup', mode:'solo', n:10, name:'Solo Victory Cup', cash:100},
  {day:'2024-02-11', id:'S28_SoloVictoryCup', mode:'solo', n:11, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-17', id:'S29_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-22', id:'S29_SoloVictoryCup', mode:'solo', n:2, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-29', id:'S29_SoloVictoryCup', mode:'solo', n:3, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-31', id:'S29_SoloVictoryCup', mode:'solo', n:4, name:'Solo Victory Cup', cash:100},
  {day:'2024-04-03', id:'S29_SoloVictoryCup', mode:'solo', n:5, name:'Solo Victory Cup', cash:100},
  {day:'2024-04-24', id:'S29_SoloVictoryCup', mode:'solo', n:6, name:'Solo Victory Cup', cash:100},
  {day:'2024-05-05', id:'S29_SoloVictoryCup', mode:'solo', n:7, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-03', id:'S30_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-10', id:'S30_SoloVictoryCup', mode:'solo', n:2, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-17', id:'S30_SoloVictoryCup', mode:'solo', n:3, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-24', id:'S30_SoloVictoryCup', mode:'solo', n:4, name:'Solo Victory Cup', cash:100},
  {day:'2024-07-15', id:'S30_SoloVictoryCup', mode:'solo', n:5, name:'Solo Victory Cup', cash:100},
  {day:'2024-07-22', id:'S30_SoloVictoryCup', mode:'solo', n:6, name:'Solo Victory Cup', cash:100},
  {day:'2024-07-29', id:'S30_SoloVictoryCup', mode:'solo', n:7, name:'Solo Victory Cup', cash:100},
  {day:'2024-08-05', id:'S30_SoloVictoryCup', mode:'solo', n:8, name:'Solo Victory Cup', cash:100},
  {day:'2024-08-12', id:'S30_SoloVictoryCup', mode:'solo', n:9, name:'Solo Victory Cup', cash:100},
  {day:'2024-09-02', id:'S31_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  // Reload Duos Cash Cup 30.08 снят: Reload — только в 2026-м (отзыв).
];
// Таблицы выплат 2024-го — на игрока, [место-порог, $]; NA West читает NA Central.
const CC_MAJOR_PAY_2024={
  EU:[[1,85000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],
  NAC:[[1,70000],[2,45000],[3,35000],[4,30000],[5,25000],[6,18000],[7,15000],[8,12500],[9,7000],[10,5500],[15,3750],[20,3000],[25,2250],[30,1500],[35,1000],[45,750],[50,500]],
  BR:[[1,10000],[2,7000],[3,5500],[4,4500],[5,3250],[6,2250],[7,1500],[8,1300],[9,1200],[10,1000],[15,750],[20,500],[25,250],[50,100]],
  ASIA:[[1,10000],[2,7000],[3,5500],[4,4500],[5,3250],[6,2250],[7,1500],[8,1300],[9,1200],[10,1000],[15,750],[20,500],[25,250],[50,100]],
  ME:[[1,10000],[2,7000],[3,5500],[4,4500],[5,3250],[6,2250],[7,1500],[8,1300],[9,1200],[10,1000],[15,750],[20,500],[25,250],[50,100]],
  OCE:[[1,8000],[2,5000],[3,3000],[4,2000],[5,1750],[6,1400],[7,1300],[8,1200],[9,1100],[10,1000],[15,500],[20,250],[50,100]]
};
const CC_DCC_PAY_2024={
  S28:{EU:[[1,2000],[2,1750],[3,1250],[4,1000],[5,875],[6,750],[7,625],[8,500],[9,425],[10,400],[11,325],[12,300],[13,275],[14,250],[15,225],[19,175],[20,150],[35,125],[50,100]], NAC:[[1,1600],[2,1250],[3,1000],[4,875],[5,750],[6,500],[7,375],[8,350],[9,300],[10,250],[15,175],[25,125],[50,100]], BR:[[1,275],[2,250],[3,225],[4,175],[5,150],[8,125],[10,100]], ASIA:[[1,275],[2,250],[3,225],[4,175],[5,150],[8,125],[10,100]], ME:[[1,275],[2,250],[3,225],[4,175],[5,150],[8,125],[10,100]], OCE:[[1,250],[2,200],[5,180]]},
  S30:{EU:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]], NAC:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]], BR:[[1,625],[2,400],[3,300],[5,200],[40,100]], ASIA:[[1,625],[2,400],[3,300],[5,200],[40,100]], ME:[[1,625],[2,400],[3,300],[5,200],[40,100]], OCE:[[1,625],[2,400],[3,300],[5,200],[40,100]]},
  S31:{EU:[[1,5000],[2,1350],[3,900],[10,450],[25,300],[40,150]], NAC:[[1,5000],[2,1350],[3,900],[10,450],[25,225],[40,100]], BR:[[1,625],[2,400],[3,300],[5,200],[40,100]], ASIA:[[1,625],[2,400],[3,300],[5,200],[40,100]], ME:[[1,625],[2,400],[3,300],[5,200],[40,100]], OCE:[[1,625],[2,400],[3,300],[5,200],[40,100]]}
};
const CC_RDCC_PAY_2024={EU:[[1,2500],[2,675],[3,450],[10,225]], NAC:[[1,2500],[2,675],[3,450],[10,225]], BR:[[1,325],[2,200],[3,150],[5,100],[10,50]], ASIA:[[1,325],[2,200],[3,150],[5,100],[10,50]], ME:[[1,325],[2,200],[3,150],[5,100],[10,50]], OCE:[[1,325],[2,200],[3,150],[5,100],[10,50]]};

function ccPay24Table(tables){
  // У 2022-го NA West платил своей таблицей; где её нет — таблица NA Central.
  let r=careerPrizeRegion(); if(r==='NAW' && !(tables && tables.NAW)) r='NAC';
  return (tables && (tables[r] || tables.EU)) || null;
}
function ccPay24(tables, place){
  const t=ccPay24Table(tables); if(!t) return 0;
  const row=t.find(x=>place<=x[0]);
  return row ? row[1] : 0;
}
// Кап с таблицей мест (Duos Cash Cup / Reload Duos Cash Cup): выплата на состав.
// Сколько человек в команде на этом капе: на вечере — CC_EVENT_SIZE, до него — формат капа (трио-кап дуо-года
// играется тройкой со стэнд-ином, ccEventRosterBegin), в онлайне и гонке формат не меняется.
function ccVictoryTeamSize(ev){
  if(CC_EVENT_SIZE) return CC_EVENT_SIZE;
  const f=ccVictoryFormat(ev);
  if(f && !(typeof ccMpOn==='function' && ccMpOn()) && !(typeof ccRacePairOn==='function' && ccRacePairOn())) return f;
  return careerSquadSize();
}
function ccVictoryPayOf(ev, place){
  // Кап из архива Tracker несёт таблицу Epic с собой: по регионам, «до места N — сумма на игрока».
  if(ev && ev.payT) return ccPay24(ev.payT, place)*(ev.mode==='solo' ? 1 : ccVictoryTeamSize(ev));
  if(!ev || !ev.pay) return 0;
  // 2023-й — свои сезоны (S24–S26) в CC_DCC_PAY_2023.
  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2019() && CC_DCC_PAY_2019[ev.pay]) ? CC_DCC_PAY_2019[ev.pay] : (ccIs2021() && CC_DCC_PAY_2021[ev.pay]) ? CC_DCC_PAY_2021[ev.pay] : (ccIs2022() && CC_DCC_PAY_2022[ev.pay]) ? CC_DCC_PAY_2022[ev.pay] : (ccIs2023() && CC_DCC_PAY_2023[ev.pay]) ? CC_DCC_PAY_2023[ev.pay] : CC_DCC_PAY_2024[ev.pay];
  // Соло-кап 2022-го платит таблицей на одного.
  return ccPay24(t, place)*(ev.mode==='solo' ? 1 : ccVictoryTeamSize(ev));
}
/* Victory Cash Cup из архива: таблица Epic у него по очкам раунда 2 (100 за победу → $100, 200 → $200,
   300 → $300 на игрока), а не по месту. Читали её как места 1–100, и в комнате прошедших платили всем,
   в том числе командам без побед. Перевод: сумма на игрока за одну победу, 0 — таблица обычная. */
function ccVicPerWin(ev){
  const t=ev && ev.payT ? ccPay24Table(ev.payT) : null;
  if(!t || !t.length || !t.every(function(r, i){ return r[0]===100*(i+1); })) return 0;
  return t[0][1];
}
// Деньги команды за победы: строка таблицы по числу побед, побед больше строк — последняя строка.
function ccVicWinsCash(ev, wins, size){
  const t=ccPay24Table(ev.payT), w=Math.min(wins||0, t ? t.length : 0);
  return w ? t[w-1][1]*Math.max(1, size||1) : 0;
}
/* Снимки сцены 2024-го: дивизион 1 — сотня полуфиналов ближайшего Мейджора (верхняя
   и нижняя сетки), других дверей в 2024-м не было. Набор f2 — с первого квалификатора
   второго Мейджора, f3 — третьего. */
/* 2024: одна книга пар на весь год. С книгой на каждый Мейджор составы менялись посреди года, а у Мейджора 3
   отборочный записан на ~50 строк (CARD_F3*_Q_RAW), и люди без пары получали нового напарника каждый вечер.
   Теперь все три снимка читают весь год: 381/379/374 пары вместо 263/241/100. ccSeat сажает первого и пропускает
   занятых, так что книга сама дедуплицируется.
   Порядок решает, какая пара годовая: финалы (Форт-Уэрт, гранд-финалы), потом полуфиналы, потом отборочные, то
   есть пара, с которой прошёл дальше всего. Так P1ng с Wox (GC2024_M3_DUOS); «сначала полуфиналы» ставил бы его с
   Mikson.
   Даты и теги снимков оставлены: от них ключ кеша пула. */
/* 2023-й — та же одна книга пар на год, что у 2024-го: пары Гранд-финалов и финалов
   недель всех трёх Мейджоров (наборы e1–e3). */
const CC_SNAPSHOTS_2023=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'e1', from:CC_YEAR_2023_FROM, playIn:/2023 Major 1 . Grand Finals/, lcq:/2023 Major 1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'e2', from:'2023-03-10', playIn:/2023 Major 2 . Grand Finals/, lcq:/2023 Major 2 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'e3', from:'2023-06-09', playIn:/2023 Major 3 . Grand Finals/, lcq:/2023 Major 3 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
const CC_SNAPSHOTS_2024=[
  {tag:'f1', from:CC_YEAR_2024_FROM, playIn:/2024 (Global Championship|Major [123] . Grand Finals)/, lcq:/2024 Major [123] . (Semi-Finals|Open Qualifier)/},
  {tag:'f2', from:'2024-04-12',      playIn:/2024 (Global Championship|Major [123] . Grand Finals)/, lcq:/2024 Major [123] . (Semi-Finals|Open Qualifier)/},
  {tag:'f3', from:'2024-06-14',      playIn:/2024 (Global Championship|Major [123] . Grand Finals)/, lcq:/2024 Major [123] . (Semi-Finals|Open Qualifier)/}
];
/* Форт-Уэрт 2024: места по Мейджорам и регионам — с участников Liquipedia
   (Fortnite Champion Series/2024): Мейджор 1 — семь дуо, Мейджор 2 — двенадцать,
   Мейджор 3 — тридцать одно; при уже занятом месте оно уходит следующему. */
const GC2024_M1_SEATS={EU:2, NAC:1, BR:1, ASIA:1, ME:1, OCE:1};
const GC2024_M2_SEATS={EU:5, NAC:3, BR:1, ASIA:1, ME:1, OCE:1};
const GC2024_M3_SEATS={EU:10, NAC:12, BR:2, ASIA:2, ME:3, OCE:2};
// Настоящие дуо Форт-Уэрта по дороге туда (Liquipedia, участники).
const GC2024_M1_DUOS=[['Malibuca','Merstach'],['Queasy','Th0masHD'],['Acorn','Cold'],['Cadu','Seeyun'],['Shelom','Zagou'],['7man','Kalgamer'],['alex','worthy']];
const GC2024_M2_DUOS=[['SwizzY','Japko'],['Chap','t3eny'],['Kami','Setty'],['rezon ay','Vadeal'],['Andilex','Seyyto'],['Peterbot','Pollo'],['Reet','Ritual'],['Cooper','Khanada'],['EdRoadToGlory','Persa'],['Job','Michael8'],['Adapter','FKS'],['danath','Tinka']];
const GC2024_M3_DUOS=[['Flickzy','vic0'],['Czb','Nxthan'],['P1ng','Wox'],['JannisZ','Pixie'],['Scroll','Sky'],['Cheapz','Krisp'],['Casperinovic','Prism'],['Chico','TruleX'],['charyy','G13ras'],['Huty','KovaaksXD'],['Batman Bugha','Rapid'],['Clix','Veno'],['Threats','Trashy'],['Dukez','Sphinx'],['Avivv','Bugha'],['Boltz','Brycx'],['paper','VicterV'],['EpikWhale','Muz'],['Shadow','Vergo'],['Bacca','Parz'],['Fazer','K1nG'],['916Gon','Kwanti'],['Kayky','Kchorro'],['Koyota','xMipoli'],['Rise','yuma'],['BOBY','Larkpex'],['Braydz','Visxals'],['Clone','KramSu'],['Ajerss','Rise'],['Aspect','Cazi'],['Deymo','Resignz']];
// $2 000 000 на 50 дуо — на команду (Liquipedia).
const GC2024_PRIZES={"1":400000,"2":300000,"3":200000,"4":160000,"5":120000,"6":90000,"7":60000,"8":50000,"9":40000,"10":30000,"11":24000,"12":24000,"13":24000,"14":24000,"15":24000,"16":20000,"17":20000,"18":20000,"19":20000,"20":20000,"21":16000,"22":16000,"23":16000,"24":16000,"25":16000,"26":14000,"27":14000,"28":14000,"29":14000,"30":14000,"31":12000,"32":12000,"33":12000,"34":12000,"35":12000,"36":10000,"37":10000,"38":10000,"39":10000,"40":10000,"41":8000,"42":8000,"43":8000,"44":8000,"45":8000,"46":6000,"47":6000,"48":6000,"49":6000,"50":6000};

/* Какой календарный год играет ТЕКУЩИЙ сезон карьеры.

   Отзыв: «сделай карьеру как для выбора с расписанием 2025
   года полностью и игроки тоже из того года». Год живёт на карьере (cr.year),
   как и размер состава: сейв без поля — 2026, каким он и был. Год 2025
   играется один раз, трио, и на стыке переходит в 2026 (cr.year0 помнит,
   с какого года карьера началась — от этого зависит сдвиг номеров сезонов и
   чётность дуо/трио). Всё, что раньше читало константы 2026 года, читает эти
   функции; сами константы остались как есть. */
function ccCalYear(){
  /* На экране создания год — это чип (отзыв: «сначала выбираешь
     год карьеры, потом игроков»): карточки и рейтинги в выборе идут за ним,
     а не за карьерой, которая могла остаться в памяти от другого слота. */
  if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create' && typeof CC!=='undefined' && CC)
    return ccPastYear(CC.year) ? CC.year : 2026;
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  return cr && ccPastYear(cr.year) ? cr.year : 2026;
}
// Годы до 2026-го, которые можно выбрать: у каждого свой календарь и свои карточки.
function ccPastYear(y){ return y===2025 || y===2024 || y===2023 || y===2022 || y===2021 || y===2020 || y===2019; }
function ccIs2025(){ return ccCalYear()===2025; }
// 2024-й — отзыв: «добавь 2024 год и рейтинги карточек этого года», «и календарь все как и прошлые».
function ccIs2024(){ return ccCalYear()===2024; }
// 2023-й — отзыв: «сделай 2023 год теперь». FNCS 2023, дуо, Chapter 4; см. CAREER_YEAR_2023.
function ccIs2023(){ return ccCalYear()===2023; }
// 2022-й — FNCS Chapter 3, дуо; см. CAREER_YEAR_2022.
function ccIs2022(){ return ccCalYear()===2022; }
// 2021-й — FNCS Chapter 2, трио, онлайн; см. CAREER_YEAR_2021.
function ccIs2021(){ return ccCalYear()===2021; }
// 2019-й — World Cup и первые FNCS, формат на вечер; см. CAREER_YEAR_2019.
function ccIs2019(){ return ccCalYear()===2019; }
// 2020-й — FNCS онлайн, формат на вечер; см. CAREER_YEAR_2020.
function ccIs2020(){ return ccCalYear()===2020; }
function ccYearFrom(){ return ccIs2020() ? CC_YEAR_2020_FROM : ccIs2019() ? CC_YEAR_2019_FROM : ccIs2021() ? CC_YEAR_2021_FROM : ccIs2022() ? CC_YEAR_2022_FROM : ccIs2023() ? CC_YEAR_2023_FROM : ccIs2024() ? CC_YEAR_2024_FROM : ccIs2025() ? CC_YEAR_2025_FROM : CC_YEAR_FROM; }
function ccYearTo(){ return ccIs2020() ? CC_YEAR_2020_TO : ccIs2019() ? CC_YEAR_2019_TO : ccIs2021() ? CC_YEAR_2021_TO : ccIs2022() ? CC_YEAR_2022_TO : ccIs2023() ? CC_YEAR_2023_TO : ccIs2024() ? CC_YEAR_2024_TO : ccIs2025() ? CC_YEAR_2025_TO : CC_YEAR_TO; }
function ccYearRows(){ return ccIs2020() ? CAREER_YEAR_2020 : ccIs2019() ? CAREER_YEAR_2019 : ccIs2021() ? CAREER_YEAR_2021 : ccIs2022() ? CAREER_YEAR_2022 : ccIs2023() ? CAREER_YEAR_2023 : ccIs2024() ? CAREER_YEAR_2024 : ccIs2025() ? CAREER_YEAR_2025 : CAREER_YEAR; }
// 2024-й: дивизионов ещё не было — кубковых недель нет вовсе. 2023-й — см. CC_CUP_WEEKS_2023.
function ccCupWeeks(){ return (ccIs2021() || ccIs2020() || ccIs2019()) ? [] : ccIs2022() ? CC_CUP_WEEKS_2022 : ccIs2023() ? CC_CUP_WEEKS_2023 : ccIs2024() ? [] : ccIs2025() ? CC_CUP_WEEKS_2025 : CC_CUP_WEEKS; }
/* Год без дивизионов. В 2024 кубков нет (ccCupWeeks пуст, на Мейджор шли через открытые квалы), и без этого
   карьера сидела в пятом дивизионе навсегда. Такой год играется без лестницы: вся сцена и настоящие напарники,
   как Дивизион 1 в остальных годах. Признак берём у календаря, а не у числа 2024: на стыке
   карьера 2024 уходит в календарь 2025, где кубки есть. */
function ccNoDivisions(){
  // 2021-й: дивизионных кубков нет (дивизионы Arena — не турнир).
  if(ccIs2021() || ccIs2020() || ccIs2019()) return true;
  /* 2022-й: дивизионы только в C3S4 (кубки осени). Создание — без ступени, как у 2024-го;
     ступень ставится в день Placement Cup (ccDiv22Place). */
  if(ccIs2022()){
    if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create') return true;
    const d=careerToday(); return d<CC_DIV_FROM_2022 || d>CC_DIV_END_2022;
  }
  /* 2023-й: дивизионы только до Мейджора 1 включительно. На экране создания — есть (ступень
     выбирается), в карьере — пока не кончился финал Мейджора 1. */
  if(ccIs2023()){
    if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create') return false;
    return careerToday()>CC_DIV_END_2023;
  }
  return !ccCupWeeks().length;
}
/* Performance Evaluation 2025-го — с архива Tracker (21 сентября 2026): раунд 1
   семь игр, топ-33 в раунд 2 того же вечера, четыре игры, $400 на игрока за
   каждую победу. Только Дивизион 1 — как и в 2026-м. */
const CC_EVAL_NIGHTS_2025=[
  '2024-12-18','2025-01-07','2025-01-14','2025-01-21','2025-01-28','2025-02-04','2025-02-11',
  '2025-02-25','2025-03-04','2025-03-11','2025-03-18','2025-03-25','2025-04-01','2025-04-08','2025-04-15','2025-04-22',
  '2025-05-09','2025-05-16','2025-05-22','2025-05-29',
  '2025-06-10','2025-06-18','2025-06-24','2025-07-15','2025-07-22','2025-07-29',
  '2025-08-08','2025-08-12','2025-08-19','2025-08-26','2025-09-02'
];
// И Reload Performance Evaluation (S34): те же правила, остров Reload.
const CC_EVAL_RELOAD_2025=['2025-03-17','2025-04-09','2025-04-10','2025-04-16','2025-04-21','2025-04-28'];
/* Оценка 2024-го шла только в Европе (в архиве Tracker страниц других регионов нет —
   404 на NAC/BR/ASIA/ME/OCE; у NAC в S31 есть лишь Reload-оценка, и та после года).
   Раунд 1 семь игр, раунд 2 четыре игры (MatchCap окон). */
const CC_EVAL_NIGHTS_2024=['2023-12-05','2023-12-12','2024-01-10','2024-01-16','2024-01-23','2024-01-31','2024-02-13','2024-02-22','2024-02-28',
  '2024-03-12','2024-03-19','2024-03-26','2024-04-02','2024-04-09','2024-04-16','2024-04-23','2024-04-30','2024-05-07','2024-05-14',
  '2024-05-28','2024-05-31','2024-06-04','2024-06-25','2024-07-23','2024-07-30','2024-08-06','2024-08-17','2024-08-27','2024-09-04'];
/* Оценка 2023-го — S25 и S26, только Европа (у других регионов в архиве её нет):
   раунд 1 → топ-50 → раунд 2 того же вечера, топ-5 по $200 на игрока. */
const CC_EVAL_NIGHTS_2023=['2023-06-12','2023-06-27','2023-08-29','2023-09-12','2023-09-26'];
function ccEvalNights(){
  if(ccIs2022() || ccIs2021() || ccIs2020() || ccIs2019()) return [];   // у 2022-го и 2021-го оценки в архиве нет
  if(ccIs2023()) return ccCareerRegion()==='EU' ? CC_EVAL_NIGHTS_2023 : [];
  return ccIs2024() ? (ccCareerRegion()==='EU' ? CC_EVAL_NIGHTS_2024 : []) : ccIs2025() ? CC_EVAL_NIGHTS_2025 : CC_EVAL_NIGHTS;
}
// Reload-оценка 2025-го снята с календаря: Reload — только в 2026-м (отзыв). Список оставлен как замер.
function ccEvalReloadNights(){ return []; }
function ccEvalIsReload(iso){ return ccEvalReloadNights().indexOf(iso||careerToday())>=0; }
// Оценка в ночь Reload — лобби Reload по 40 игроков, как везде в Reload (было 50 команд, игрок 2.11: «во всех релоад турнирах по 40?»).
function ccEvalLobby(){ return ccEvalIsReload() ? ccReloadLobby(careerSquadSize()) : ccTeams(50); }
// Победа в оценке: 2026-й — $800 на дуо; 2025-й — $400 на игрока, то есть на состав.
/* 2024-й — три эпохи по таблицам окон Tracker: до 2 апреля раунд 2 платил топ-5 по $200
   на игрока (PayoutTable rank), со 2 апреля $250 за победу, с 28 мая $400 за победу. */
function ccEvalWinCash(){
  if(ccIs2023() || ccIs2022() || ccIs2021() || ccIs2020() || ccIs2019()) return 0;   // 2023-й платил топ-5, а не за победу — см. ccEvalTop5Cash
  if(ccIs2024()){ const d=careerToday(); return (d<'2024-04-02' ? 0 : d<'2024-05-28' ? 250 : 400)*careerSquadSize(); }
  return ccIs2025() ? 400*careerSquadSize() : CC_EVAL_WIN_CASH;
}
function ccEvalTop5Cash(){ return (ccIs2023() || (ccIs2024() && careerToday()<'2024-04-02')) ? 200*careerSquadSize() : 0; }
function ccEvalR1Games(){ return (ccIs2025() || ccIs2024() || ccIs2023()) ? 7 : CC_EVAL_R1_GAMES; }
/* Год КАРТОЧЕК — не то же, что год календаря.

   Отзыв: «2025 — собирается дуо-сезон сам по себе, не
   ориентируясь на рейтинги 2026 года настоящие, а на 25». Карьера, начатая в
   2025-м, дальше живёт своим миром: в 2026-м (и дальше) сцена — те же люди
   2025-го с тем, что они наиграли в этой карьере (CAREER.dev), а не карточки
   2026-го. Календарь при этом 2026-й. Пары в дуо-год — ядра трио 2025-го,
   остальные собираются по силе (ccContinuityDuos). */
function ccNowYear(){
  // Расчёт целей потенциала (ccRealTargets) смотрит на год календаря как свежая карьера.
  if(typeof CC_NOW_YEAR_FORCE!=='undefined' && CC_NOW_YEAR_FORCE) return CC_NOW_YEAR_FORCE;
  if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create' && typeof CC!=='undefined' && CC)
    return ccPastYear(CC.year) ? CC.year : 2026;
  /* НОВАЯ ГЛАВА — НАСТОЯЩИЙ ГОД (Notion «17.10», тестер: «команды не все как в жизни в новых
     главах», «типы на европе фнкс выиграли, а у них 70 рейтинга»; его предложение — «чтобы
     полностью настоящие данные переносились в новую главу, будто ты только начал играть в этой
     главе», и ответ автора «думаю, да»). Было: сцена жила людьми года старта (cr.year0), рейтинг
     лишь подтягивался к году календаря (ccRealPull), составы года ставились только если оба
     человека дожили, остальные сводились по силе. Теперь сцена, составы и рейтинги — года
     календаря, как у свежей карьеры; прошлая глава остаётся небольшой поправкой (ccChapterCarry). */
  return ccCalYear();
}
/* Что сцена наиграла в прошлой главе — поправкой, а не вторым рейтингом: на стыке книги роста
   (CAREER.dev, CAREER.devL) сжимаются вдвое и не дальше ±3 (тестер: «у кого-то может побольше
   или немного меньше рейтинг быть, если хороший результат в прошлой главе показали, но всё равно
   чтобы рейтинг сильно не отличался»). Один раз на год: сейв, уже стоящий в новой главе, сжимается
   при загрузке. Годы после 2026-го — та же глава 2026-го, их не трогает. */
const CC_CHAPTER_CARRY=0.5, CC_CHAPTER_CAP=3;
/* Карьера уже перешла в новую главу (год календаря не год старта). Сцена у неё — года календаря,
   как у свежей (ccNowYear), но составы собираются тем же путём, что и до правки 17.10: настоящие
   составы года (ccRealTeamDuos) плюс свободные сильные в пары и тройки (ccContinuityDuos/Thirds) —
   иначе в первый день главы до трети топ-40 стояли без состава (check-career-chapter-squads). */
function ccChapterMoved(){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  if(CC_NOW_YEAR_FORCE || !cr || !ccPastYear(cr.year0)) return false;
  if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create') return false;
  return ccCalYear()!==cr.year0;
}
function ccChapterCarry(){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  if(!cr || cr.chapterY===cr.year) return false;
  const moved=cr.chapterY!=null || (cr.year0!=null && cr.year!==cr.year0);
  cr.chapterY=cr.year;
  if(!moved) return true;
  // Тройки и ядра, посеянные из людей года старта, — заново из сцены года (careerPools).
  delete cr.triosSeeded; delete cr.trioCores; delete cr.trioFilled;
  if(typeof CC_POOLS!=='undefined') CC_POOLS=null;
  ['dev', 'devL'].forEach(b=>{
    const book=CAREER[b];
    if(!book || typeof book!=='object') return;
    Object.keys(book).forEach(k=>{
      const v=Math.max(-CC_CHAPTER_CAP, Math.min(CC_CHAPTER_CAP, (+book[k]||0)*CC_CHAPTER_CARRY));
      if(Math.abs(v)<0.05) delete book[k]; else book[k]=Math.round(v*10)/10;
    });
  });
  return true;
}
// Второй и дальше год карьеры 2025-го (или 2024-го): календарь новее, люди свои.
function ccContinuity(){ return ccNowYear()<2026 && ccNowYear()!==ccCalYear(); }
// Сколько 2026-х годов карьера уже прожила до текущего сезона (для номеров сезонов и года на экране).
function ccYearShift(){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  if(!cr) return 0;
  const past=(cr.season||1)-1 - (cr.year0===2025 ? 1 : cr.year0===2024 ? 2 : cr.year0===2023 ? 3 : cr.year0===2022 ? 4 : cr.year0===2021 ? 5 : cr.year0===2020 ? 6 : cr.year0===2019 ? 7 : 0);
  return Math.max(0, past);
}
// Год, который стоит писать на экране за этот сезон.
function ccSeasonYear(){ return ccIs2020() ? 2020 : ccIs2019() ? 2019 : ccIs2021() ? 2021 : ccIs2022() ? 2022 : ccIs2023() ? 2023 : ccIs2024() ? 2024 : ccIs2025() ? 2025 : 2026+ccYearShift(); }
// The Performance Evaluation, night by night rather than as a span: it is the
// one event that runs every week of the year, and a career calendar has to put
// it on the right evening. Division 1 only — its own page says so.
const CC_EVAL_NIGHTS=[
  '2025-12-04','2025-12-11','2025-12-18','2026-01-09','2026-01-15','2026-01-22',
  '2026-01-29','2026-02-05','2026-02-12','2026-02-19','2026-02-26','2026-03-05',
  '2026-03-12','2026-03-20','2026-03-26','2026-04-01','2026-04-09','2026-04-16',
  '2026-04-23','2026-05-07','2026-05-14','2026-05-21','2026-06-03','2026-06-07',
  '2026-06-11','2026-06-18','2026-07-16','2026-07-23','2026-07-30','2026-08-06',
  '2026-08-13',
  // Сорок второй сезон, с его Tracker-сейва 23 августа
  // (epicgames_S42_PerformanceEvaluation_EU): девять вечеров, два раунда в
  // каждый — раунды идут одним вечером, как и раньше.
  '2026-08-23','2026-09-03','2026-09-10','2026-09-17','2026-09-24',
  '2026-10-01','2026-10-08','2026-10-15','2026-10-22',
  // S43 (мини-сезон с 1.11): Performance Cup по четвергам, календарь Epic (S43_PerformanceEvaluationTrios_EU).
  '2026-11-05','2026-11-12','2026-11-19','2026-11-26'
];
/* Divisional cups week by week, off Epic's schedule pages
   (www.fortnite.com/competitive/events/S39_FNCSDivisionalCup_Division1/schedule?region=EU, plus S40/S41 and
   Divisions 2-5). Not a plain Mon/Tue/Sat rhythm:
   - cups stop for the Major: D1 plays nothing 3 Apr to 3 May and from 18 Jul to year end;
   - 3 of 15 finals aren't on Saturday: Sun 8 Feb, Thu 2 Apr (S40 week 2), Fri 17 Jul;
   - the pause is D1 only: 6-7 Apr and 18-19 Jul are normal weeks for D2-5, marked 'low', no Weekly Final.
   D2-5 run identical dates, one row serves them.
   [id, session 1, session 2, Weekly Final or null, 'low' if Division 1 is away] */
const CC_CUP_WEEKS=[
  ['S39_FNCSDivisionalCup','2026-02-02','2026-02-03','2026-02-08'],
  ['S39_FNCSDivisionalCup','2026-02-09','2026-02-10','2026-02-14'],
  ['S39_FNCSDivisionalCup','2026-02-16','2026-02-17','2026-02-21'],
  ['S39_FNCSDivisionalCup','2026-02-23','2026-02-24','2026-02-28'],
  ['S39_FNCSDivisionalCup','2026-03-02','2026-03-03','2026-03-07'],
  ['S39_FNCSDivisionalCup','2026-03-09','2026-03-10','2026-03-14'],
  ['S40_FNCSDivisionalCup','2026-03-23','2026-03-24','2026-03-28'],
  ['S40_FNCSDivisionalCup','2026-03-30','2026-03-31','2026-04-02'],
  ['S40_FNCSDivisionalCup','2026-04-06','2026-04-07',null,'low'],
  ['S40_FNCSDivisionalCup','2026-05-04','2026-05-05','2026-05-09'],
  ['S40_FNCSDivisionalCup','2026-05-11','2026-05-12','2026-05-16'],
  ['S40_FNCSDivisionalCup','2026-05-18','2026-05-19','2026-05-23'],
  ['S41_FNCSDivisionalCup','2026-06-08','2026-06-09','2026-06-13'],
  ['S41_FNCSDivisionalCup','2026-06-15','2026-06-16','2026-06-20'],
  ['S41_FNCSDivisionalCup','2026-06-22','2026-06-23','2026-06-27'],
  ['S41_FNCSDivisionalCup','2026-07-13','2026-07-14','2026-07-17'],
  ['S41_FNCSDivisionalCup','2026-07-18','2026-07-19',null,'low'],
  /* Сорок второй сезон, снятый с его же Tracker-сейвов 23 августа
     (epicgames_S42_FNCSDivisionalCup_Division1_EU — «FNCS Division 1
     Practice»): одна сессия в неделю вместо двух и финал в субботу, только
     Дивизион 1 — страница Epic так и называется. Финал третьей недели —
     суббота 13:00, не опечатка: так стоит окно Week3Final_EU. */
  ['S42_FNCSDivisionalCup_Division1','2026-08-25',null,'2026-08-29','d1'],
  ['S42_FNCSDivisionalCup_Division1','2026-08-31',null,'2026-09-05','d1'],
  ['S42_FNCSDivisionalCup_Division1','2026-09-07',null,'2026-09-12','d1'],
  ['S42_FNCSDivisionalCup_Division1','2026-09-14',null,'2026-09-19','d1']
];

function ccAddDays(iso, n){
  const t=new Date(iso+'T00:00:00Z');
  t.setUTCDate(t.getUTCDate()+n);
  return dateKey(t);
}
// Every day of the career year that carries something, built once and kept:
// this walks about 270 days and the hub asks for it on every render.
let CC_YEAR_DAYS=null;
/* Мир, построенный этой страницей, — выбросить.

   Пул, снимок сцены, европейский список, флаги лестницы, клубы, подписи года,
   пары и таблицы архива строятся на ПЕРВОЕ обращение и живут до конца страницы.
   Одиночной карьере это правильно: мир у неё один. Командная получает мир от
   сервера ПОСЛЕ загрузки — и если построенное не выбросить, клиент считает
   вечер по вчерашней сцене и расходится с напарником МОЛЧА: на экране у обоих
   всё выглядит нормально до самой таблицы.

   Найдено при измерении локстепа, до единой строки мультиплеера.
   Сторож — tools/check-mp-world-reset.js. */
function ccWorldReset(){
  CC_POOLS=null; CC_REC_MATES=null;
  CC_NOW_CARDS={}; CC_NOW_TAG=null; CC_ARC_PAIRS={};
  CC_EU_ALL={};
  /* И ростер региона с готовыми рейтингами (_ovr на момент сборки) и ники сцены над ним: мир сменился (книга мира,
     новый год) — собираются заново, как остальные снимки. */
  CC_EU_CARDS={}; CC_REAL_NAMES={};
  CC_NAT_POOL={};
  CC_ORG_POOL={}; CC_ORG_NAMES={}; CC_LADDER_POOL={};
  CC_YEAR_DAYS=null;
  CH_ARC_TBL={};
}
let CC_YEAR_DAYS_OF=null;
function careerYearDays(){
  const ydKey=(typeof ccVictoryListKey==='function') ? ccVictoryListKey() : ccCalYear();
  if(CC_YEAR_DAYS && CC_YEAR_DAYS_OF===ydKey) return CC_YEAR_DAYS;
  CC_YEAR_DAYS_OF=ydKey;
  const out=new Map();
  const add=(iso, kind, label, id, only)=>{
    if(iso<ccYearFrom() || iso>ccYearTo()) return;
    if(!out.has(iso)) out.set(iso, []);
    out.get(iso).push({kind, label, id, only:only||null});
  };
  // The cups first, day by day off the measured table. "Session", not "Round":
  // below Division 1 these are two separate goes at the same cut rather than two
  // rounds of one tournament, and a label that says round tells the player the
  // first one carries into the second. It does not.
  ccCupWeeks().forEach(function(w){
    const id=w[0], final=w[3], only=w[4]||null;
    add(w[1], 'cup', L().calSession.replace('{N}', '1'), id, only);
    // Неделя из одной сессии (Division 1 Practice, S42) второго вечера не имеет.
    if(w[2]) add(w[2], 'cup', L().calSession.replace('{N}', '2'), id, only);
    // Both go on the calendar; who may enter which is the hub's question.
    if(final) add(final, 'final', L().calWeeklyFinal, id);
  });
  const sessions={};
  ccYearRows().forEach(function(row){
    const from=row[0], to=row[1], id=row[2], kind=row[3], shape=row[4];
    // A session is one of several goes at the same cut, numbered in order.
    if(shape==='session'){
      sessions[id]=(sessions[id]||0)+1;
      add(from, kind, ccYearLabel(id, from, from)+' · '+L().calSession.replace('{N}', String(sessions[id])), id);
      return;
    }
    // A pair is two sessions with a gap between them: only the two dates run,
    // and the second is session two rather than "day nine".
    if(shape==='pair'){
      add(from, kind, ccYearLabel(id, from, from), id);
      if(to!==from) add(to, kind, ccYearLabel(id, ccAddDays(from,1), from), id);
      return;
    }
    // Everything else is the days it actually ran, end to end.
    for(let d=from; d<=to; d=ccAddDays(d,1)) add(d, kind, ccYearLabel(id, d, from), id);
  });
  ccEvalNights().forEach(d=>add(d, 'eval', L().calPerfEval, 'PerformanceEvaluation'));
  ccEvalReloadNights().forEach(d=>add(d, 'eval', L().calPerfEval+' · Reload', 'PerformanceEvaluationReload'));
  CC_GCLC.forEach(v=>add(v.day, 'gc',
    v.q===0 ? L().ccGcFinal : L().ccGcRound(v.q, v.round), 'GlobalChampionshipLastChance'));
  ccVictoryList().forEach(v=>add(v.day, 'victory',
    v.lan ? v.lan
          : v.name ? v.name+' '+v.n
          : (v.mode==='duo'?ccVictoryCupName():L().calVictorySolo)+' '+v.n, v.id));
  CC_YEAR_DAYS=out;
  return out;
}
/* ---- LAN cities rotate after the first year ----
   Pool is only cities that hosted a Fortnite LAN: New York (2019 WC), Raleigh 2022, Copenhagen 2023, Fort Worth
   2024, Lyon 2025, Düsseldorf and Antwerp 2026, Paris (Reload Championship), Riyadh (EWC).
   Year one is the measured 2026 calendar. After that each year draws three of the nine, seeded off the season so a
   save is stable, never repeating last year's city for the same event. */
/* The first nine are the rooms this game has really been played in — New York
   2019, Raleigh 2022, Copenhagen 2023, Fort Worth 2024, Lyon 2025, Düsseldorf
   and Antwerp 2026, Paris for the Reload Championship, Riyadh for the Esports
   World Cup. The rest are his, 17 August: a LAN does not have to go back where
   it has been, and these are cities that hold events of this size. */
const CC_LAN_HOSTS=[
  {key:'Dus', nat:'de'}, {key:'Ant', nat:'be'}, {key:'Lyo', nat:'fr'},
  {key:'Cph', nat:'dk'}, {key:'Ftw', nat:'us'}, {key:'Rdu', nat:'us'},
  {key:'Par', nat:'fr'}, {key:'Ryd', nat:'sa'}, {key:'Nyc', nat:'us'},
  {key:'Tok', nat:'jp'}, {key:'Bel', nat:'rs'}, {key:'Kat', nat:'pl'},
  {key:'Sto', nat:'se'}, {key:'Mad', nat:'es'}, {key:'Ams', nat:'nl'},
  {key:'Sao', nat:'br'}, {key:'Seo', nat:'kr'}, {key:'Tor', nat:'ca'},
  {key:'Syd', nat:'au'}, {key:'Mex', nat:'mx'}, {key:'Dub', nat:'ae'},
  {key:'Ist', nat:'tr'}, {key:'Mil', nat:'it'}, {key:'Lon', nat:'gb'},
  {key:'Sin', nat:'sg'},
  {key:'Bue', nat:'ar'}, {key:'Alm', nat:'kz'}, {key:'Scl', nat:'cl'}
];
/* ГОДЫ 2027–2030 — СТРАНЫ ТЕХ, КТО ИГРАЕТ (его слово 24.10: «пусть страны ланов будут в следующих годах
   … основываясь на онлайн стран, которые играют fncs draft»). Порядок — визиты Web Analytics fncsdraft.com
   за 25.09–24.10.2026 (люди, без ботов): RU 1940, US 1610, BR 990, UA 710, AR 560, CA 540, RS 410, JP 370,
   KZ 350, BY 290, CL 210, AU 190. Россию, Украину и Беларусь не берём: «москва киев не надо без политики».
   Год берёт следующие три: Глобалы — самой большой, Саммит — второй, чемпионат Reload — третьей.
   Девять стран — ровно 2027–2029, каждая по разу; дальше прежний жребий. */
const CC_LAN_PLAYER_NATS=['us','br','ar','ca','rs','jp','kz','cl','au'];
// How far back a country is remembered. One year was the rule when there were
// six of them and it was all six could carry; twenty-one hold two comfortably,
// so a career does not see the same flag twice in three seasons.
const CC_LAN_LOOKBACK=2;
const CC_LAN_FIRST={summit:'Dus', globals:'Ant', rc:'Par'};
// The countries there are, in the order the roster lists their cities.
function ccLanNats(){
  const out=[];
  CC_LAN_HOSTS.forEach(h=>{ if(out.indexOf(h.nat)<0) out.push(h.nat); });
  return out;
}
function ccLanShuffle(list, rnd){
  const pool=list.slice();
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    const t=pool[i]; pool[i]=pool[j]; pool[j]=t;
  }
  return pool;
}
/* A year is settled as a year, and settled on countries.

   His rule, said again after the first version shipped: a new country every
   year, not merely a new city — Lyon after Paris is still France, and going
   back to Germany the season after Düsseldorf is going back to Germany.

   So the draw picks three of the six countries the nine rooms sit in, none of
   which held anything last year, and then a city inside each. Six countries and
   three events a year means the two halves alternate, which is what nine real
   rooms allow — and the halves do not look alike, because the United States has
   three of them and France two, so the same country is a different building.

   Memoised, so asking for season twelve does not redraw eleven years every time
   a label is rendered. */
const CC_LAN_YEARS={};
function ccLanFixed(season){
  const s=Math.max(1, season|0);
  if(s<=1) return CC_LAN_FIRST;
  if(CC_LAN_YEARS[s]) return CC_LAN_YEARS[s];
  const prev=ccLanFixed(s-1);
  const seats=['summit','globals','rc'];
  const by=(s-2)*3;
  if(by+3<=CC_LAN_PLAYER_NATS.length){
    const rnd0=careerRng(ccHashStr('lan|'+s)), out0={};
    [['globals',0],['summit',1],['rc',2]].forEach(function(p){
      const inNat=CC_LAN_HOSTS.filter(h=>h.nat===CC_LAN_PLAYER_NATS[by+p[1]]).map(h=>h.key);
      out0[p[0]]=inNat[Math.floor(rnd0()*inNat.length)] || prev[p[0]];
    });
    CC_LAN_YEARS[s]=out0;
    return out0;
  }
  const was=[];
  for(let back=1; back<=CC_LAN_LOOKBACK && s-back>=1; back++)
    seats.forEach(k=>was.push(ccLanNat(k, s-back)));
  const rnd=careerRng(ccHashStr('lan|'+s));
  const nats=ccLanShuffle(ccLanNats(), rnd);
  const pick=nats.filter(n=>was.indexOf(n)<0).slice(0, seats.length);
  // Fewer than three left is not possible with six countries and three seats,
  // and if a city is ever added or removed it fills up rather than throwing.
  nats.forEach(n=>{ if(pick.length<seats.length && pick.indexOf(n)<0) pick.push(n); });
  const out={};
  seats.forEach(function(kind, i){
    const inNat=CC_LAN_HOSTS.filter(h=>h.nat===pick[i]).map(h=>h.key);
    out[kind]=inNat[Math.floor(rnd()*inNat.length)] || prev[kind];
  });
  CC_LAN_YEARS[s]=out;
  return out;
}
function ccLanHostKey(kind, season){
  const cr=(CAREER && CAREER.career) || null;
  // Кубок наций — свой жребий по Европе, см. ccNatHostKey.
  if(kind==='nations') return ccNatHostKey(season || ((cr && cr.season) || 1));
  let s=season || ((cr && cr.season) || 1);
  /* Карьера, начатая в 2025-м: первый год — Лион (это факт, а не жребий),
     второй — 2026-й, то есть первый измеренный год со своими залами; жребий
     дальше идёт с той же точки, что у карьеры 2026-го. */
  if(cr && cr.year0===2025){
    if(s<=1) return kind==='globals' ? 'Lyo' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-1;
  }
  if(cr && cr.year0===2024){
    if(s<=1) return kind==='globals' ? 'Ftw' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    if(s===2) return kind==='globals' ? 'Lyo' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-2;
  }
  // Карьера 2020-го: 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.
  if(cr && cr.year0===2020){
    const fact=[null, 'Rdu', 'Rdu', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-6;
  }
  // Карьера 2019-го: Нью-Йорк (World Cup), 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.
  if(cr && cr.year0===2019){
    const fact=[null, 'Nyc', 'Nyc', 'Nyc', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-7;
  }
  // Карьера 2021-го: своего ЛАНа нет (онлайн), дальше Роли, Копенгаген, Форт-Уэрт, Лион; жребий после.
  if(cr && cr.year0===2021){
    const fact=[null, 'Rdu', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-5;
  }
  // Карьера 2022-го: Роли, Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.
  if(cr && cr.year0===2022){
    const fact=[null, 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-4;
  }
  // Карьера 2023-го: Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.
  if(cr && cr.year0===2023){
    if(s<=1) return kind==='globals' ? 'Cph' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    if(s===2) return kind==='globals' ? 'Ftw' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    if(s===3) return kind==='globals' ? 'Lyo' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-3;
  }
  return ccLanFixed(s)[kind] || CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit;
}
/* Цвета флага страны, где стоит ЛАН.

   Правка: «в календаре вместо лого, которого нет у лана».
   У кубка, финала недели, Мейджора и Релоада в календаре своя картинка
   (CAREER_EV_ART), а у Саммита, Глобалов и чемпионата Релоада её нет и быть
   не может: это не турнир с обложкой, это город. Поэтому день красится флагом
   того города — Дюссельдорф чёрно-красно-жёлтым, Антверпен чёрно-жёлто-красным,
   Париж сине-бело-красным, — и по календарю сразу видно, куда едут.

   Цвета флагов, а не фотографии: они и есть тот минимум, который читается в
   клетке размером с ноготь. */
/* Флаги рисуются по настоящим осям и долям, а не одним косым градиентом.
   Эмблемы не влезают, вместо них главное пятно (круг Кореи, полумесяц Турции,
   ромб Бразилии): точны ось, число полос и доли, эмблема примерная.
   Ключи: bands 'h' сверху вниз, 'v' слева направо; w доли полос (по умолчанию
   равные); hoist полоса у древка; cross [поле, крест]; disc [цвет, x%, y%, r%];
   bar горизонтальная полоса; stripes 13 полос с кантоном (США). */
const CC_FLAGS={
  de:{bands:'h', c:['#000000','#dd0000','#ffce00']},
  nl:{bands:'h', c:['#ae1c28','#ffffff','#21468b']},
  rs:{bands:'h', c:['#c6363c','#0c4076','#ffffff']},
  be:{bands:'v', c:['#000000','#fdda24','#ef3340']},
  fr:{bands:'v', c:['#002395','#ffffff','#ed2939']},
  it:{bands:'v', c:['#008c45','#f4f5f0','#cd212a']},
  mx:{bands:'v', c:['#006847','#ffffff','#ce1126']},
  ca:{bands:'v', c:['#ff0000','#ffffff','#ff0000'], w:[25,50,25],
      disc:[['#ff0000',50,50,13]]},
  es:{bands:'h', c:['#aa151b','#f1bf00','#aa151b'], w:[25,50,25]},
  pl:{bands:'h', c:['#ffffff','#dc143c']},
  ae:{bands:'h', c:['#00732f','#ffffff','#000000'], hoist:'#ff0000'},
  dk:{cross:['#c8102e','#ffffff']},
  se:{cross:['#006aa7','#fecc00']},
  jp:{field:'#ffffff', disc:[['#bc002d',50,50,19]]},
  kr:{field:'#ffffff', disc:[['#cd2e3a',50,43,16],['#0047a0',50,57,16]]},
  /* Полумесяц — два круга, и МЕНЬШИЙ идёт первым: слои читаются сверху вниз,
     и вырезающий круг цвета поля обязан лежать НАД белым. Стояли наоборот —
     белый перекрывал вырез, и вместо полумесяца выходило пятно. */
  tr:{field:'#e30a17', disc:[['#e30a17',45,50,14],['#ffffff',38,50,17]]},
  sg:{bands:'h', c:['#ef3340','#ffffff'], disc:[['#ef3340',29,25,10],
      ['#ffffff',22,25,12]]},
  sa:{field:'#006c35', bar:'#ffffff'},
  br:{field:'#009c3b', disc:[['#ffdf00',50,50,32],['#002776',50,50,14]]},
  au:{field:'#012169', disc:[['#ffffff',26,72,9],['#ffffff',72,34,7],
      ['#ffffff',80,60,5],['#ffffff',62,78,5]]},
  gb:{union:1},
  us:{stripes:1},
  ar:{bands:'h', c:['#74acdf','#ffffff','#74acdf'], disc:[['#f6b40e',50,50,9]]},
  kz:{field:'#00afca', disc:[['#fec50c',50,45,15]]},
  cl:{bands:'h', c:['#ffffff','#d52b1e'], disc:[['#ffffff',17,25,5],['#0039a6',17,25,13]]}
};
// Дни календаря, у которых города вместо обложки.
const CC_LAN_KINDS={summit:1, globals:1, rc:1};
/* Слои флага, верхний первым — так их и читает background-image.

   Всё считается в процентах самой клетки, поэтому ни background-size, ни
   background-position не нужны нигде, кроме звёздно-полосатого: он один
   собирается из повторяющихся полос и кантона. Круг задан эллипсом с явными
   радиусами, а не `circle`: процентный радиус у circle в CSS невалиден. */
function ccFlagLayers(f){
  const L=[];
  const disc=(c,x,y,r)=>'radial-gradient(ellipse '+r+'% '+r+'% at '+x+'% '+y+'%,'+
                        c+' 0 99%,transparent 100%)';
  (f.disc||[]).forEach(d=>L.push(disc(d[0], d[1], d[2], d[3])));
  if(f.bar) L.push('linear-gradient(to bottom,transparent 0 56%,'+f.bar+
                   ' 56% 66%,transparent 66%)');
  if(f.hoist) L.push('linear-gradient(to right,'+f.hoist+' 0 25%,transparent 25%)');
  if(f.cross){
    // Скандинавский крест смещён к древку: вертикаль стоит не по центру.
    L.push('linear-gradient(to right,transparent 0 26%,'+f.cross[1]+
           ' 26% 42%,transparent 42%)');
    L.push('linear-gradient(to bottom,transparent 0 40%,'+f.cross[1]+
           ' 40% 60%,transparent 60%)');
    L.push('linear-gradient('+f.cross[0]+','+f.cross[0]+')');
  }
  if(f.union){
    // Красный крест поверх белого, диагонали опущены — в ноготь они не читаются.
    L.push('linear-gradient(to right,transparent 0 44%,#c8102e 44% 56%,transparent 56%)');
    L.push('linear-gradient(to bottom,transparent 0 42%,#c8102e 42% 58%,transparent 58%)');
    L.push('linear-gradient(to right,transparent 0 38%,#ffffff 38% 62%,transparent 62%)');
    L.push('linear-gradient(to bottom,transparent 0 34%,#ffffff 34% 66%,transparent 66%)');
    L.push('linear-gradient(#012169,#012169)');
  }
  if(f.bands){
    const c=f.c, w=f.w || c.map(()=>100/c.length);
    const total=w.reduce((s,v)=>s+v,0);
    let at=0;
    const stops=c.map((col,i)=>{
      const from=at/total*100; at+=w[i];
      return col+' '+from.toFixed(2)+'% '+(at/total*100).toFixed(2)+'%';
    });
    L.push('linear-gradient(to '+(f.bands==='h'?'bottom':'right')+','+stops.join(',')+')');
  }
  if(f.field) L.push('linear-gradient('+f.field+','+f.field+')');
  return L;
}
// Полный набор свойств, а не одна картинка: полосам США нужен ещё и размер.
function ccLanFlagStyle(kind, season){
  const nat=ccLanNat(kind, season), f=CC_FLAGS[nat] || CC_FLAGS.de;
  /* Настоящий флаг картинкой (flags/w320, есть у всех стран ЛАНов) — нарисованный градиентами остаётся под ним
     запасным. Градиент упрощал: у Бразилии ромб стал жёлтым кругом, и день Саммита читался непонятным флагом
     (его Notion 29.10 «что это за флаг»). */
  if(/^[a-z]{2}$/.test(nat||'')){
    const under=f.stripes ? 'linear-gradient(#3c3b6e,#3c3b6e)' : ccFlagLayers(f).join(',');
    return 'background-image:url(flags/w320/'+nat+'.png),'+under+';background-size:cover;background-position:center;';
  }
  if(f.stripes){
    return 'background-image:linear-gradient(#3c3b6e,#3c3b6e),'+
           'repeating-linear-gradient(to bottom,#b22234 0 7.6923%,#ffffff 7.6923% 15.3846%);'+
           'background-size:40% 53.85%,100% 100%;'+
           'background-position:0 0,0 0;background-repeat:no-repeat,repeat;';
  }
  return 'background-image:'+ccFlagLayers(f).join(',')+';background-size:cover;';
}
function ccLanNat(kind, season){
  const k=ccLanHostKey(kind, season);
  const h=CC_LAN_HOSTS.find(x=>x.key===k);
  return h ? h.nat : 'de';
}
// The city, in the two shapes a sentence needs it in: named, and travelled to.
function ccLanCity(kind, season){
  const k=ccLanHostKey(kind, season);
  return (L().ccCity && L().ccCity[k]) || k;
}
function ccLanCityIn(kind, season){
  const k=ccLanHostKey(kind, season);
  return (L().ccCityIn && L().ccCityIn[k]) || ccLanCity(kind, season);
}
// What a day of a multi-day block is called. A three-day Heats block wants
// "Heats 2" rather than three identical rows.
function ccYearLabel(id, day, from){
  /* Строки 2025-го носят имена 2026-го: Major1_2025_PlayIn — это тот же
     «Мейджор 1 · плей-ин». Группы и лобби последнего шанса — своё, у 2026-го
     их в календаре нет (там хиты и лобби в день LCQ). */
  const m25=/^Major(\d)_2025_(PlayIn|Group([123])|LCQ|LCLobby|Final)$/.exec(id);
  if(m25){
    const names=L().ccYearNames||{};
    const majName=(names['Major'+m25[1]+'_PlayIn']||('Major '+m25[1]+' · Play-In')).split(' · ')[0];
    if(m25[3]) return majName+' · '+L().ccYr25Group(+m25[3]);
    if(m25[2]==='LCLobby') return majName+' · '+L().ccYr25Lobby;
    id='Major'+m25[1]+'_'+m25[2];
  }
  /* 2019–2020: неделя/квалификатор (раунды вечера), хиты (день), финал — по спеке сезона (CC_MX_SPEC). */
  const mx=/^Major(\d)_(2019|2020)_(?:W(\d+)R([1-4]+)|Heat([12])|Final)$/.exec(id);
  if(mx){
    const sp=(typeof ccMXSpec==='function') ? ccMXSpec(+mx[2], +mx[1]) : null, nm=sp ? sp.name : 'FNCS';
    if(mx[3]!=null) return nm+' · '+L().ccYrXWeek(+mx[3], mx[4].split('').join('–'), !!(sp && sp.qual));
    if(mx[5]) return nm+' · '+L().ccYrXHeats(+mx[5]);
    return nm+' · '+L().ccYrXFinal(!!(sp && sp.kind==='wc'));
  }
  /* 2021-й: квалификатор (раунды вечера), полуфинал (день), Reboot Round, Гранд-финал; «Мейджор 5» — Grand Royale. */
  const m21=/^Major(\d)_2021_(?:Q([123])R([1-4]+)|Semi([12])|(Reboot)|Final)$/.exec(id);
  if(m21){
    const n21=+m21[1], nm21=ccSeasonEvName(2021, n21);
    if(m21[2]) return nm21+' · '+L().ccYrXWeek(+m21[2], m21[3].split('').join('–'), true);
    if(m21[4]) return nm21+' · '+L().ccYrSemiDay(+m21[4]);
    if(m21[5]) return nm21+' · Reboot Round';
    return nm21+' · '+L().ccYrXFinal(false);
  }
  /* 2022-й: квалификатор (раунды вечера), полуфинал (сессия), Гранд-финал; Invitational — Роли. */
  const m22=/^Major(\d)_2022_(?:Q([123])R([1-4]+)|Semi([123])|Final)$/.exec(id);
  if(m22){
    const nm22=ccSeasonEvName(2022, +m22[1]);
    if(m22[2]) return nm22+' · '+L().ccYrXWeek(+m22[2], m22[3].split('').join('–'), true);
    if(m22[4]) return nm22+' · '+L().ccYrSemiDay(+m22[4]);
    return nm22+' · '+L().ccYrXFinal(false);
  }
  if(id==='Invitational2022') return L().ccYr22Inv;
  /* 2023-й: недели (день 1, день 2, финал недели), Surge Week, финал; «Мейджор 4» — Last Chance Major. */
  const m23=/^Major(\d)_2023_(?:W([123])(D1|D2|F)|(Surge)|(Final))$/.exec(id);
  if(m23){
    const n=+m23[1], d=m23[3]==='D1' ? 1 : m23[3]==='D2' ? 2 : 3;
    if(n===4) return L().ccYr23Lcm(d);
    if(m23[2]) return d===3 ? L().ccYr23WeekFinal(n, +m23[2]) : L().ccYr23Day(n, +m23[2], d);
    if(m23[4]) return L().ccYr23Surge(n);
    id='Major'+n+'_Final';
  }
  if(id==='GlobalChampionship2023') id='GlobalChampionship';
  /* 2024-й: квалификатор (раунд), полуфинал (день), финал — под именем финала 2026-го. */
  const m24=/^Major(\d)_2024_(?:Q([12])R([123])|Semi([123])|Final)$/.exec(id);
  if(m24){
    if(m24[2]){
      // Европа и NA Central: четыре раунда — суббота «2–3», воскресенье «4». См. CC_M24.qDeep.
      const deep=(typeof DEEP_MAJOR_REGIONS!=='undefined' && typeof ccCareerRegion==='function' && CAREER && CAREER.career && DEEP_MAJOR_REGIONS.has(ccCareerRegion()));
      const r=+m24[3];
      return L().ccYr24Qual(+m24[1], +m24[2], deep ? (r===2 ? '2–3' : r===3 ? '4' : '1') : r);
    }
    if(m24[4]) return L().ccYr24Semi(+m24[1], +m24[4]);
    id='Major'+m24[1]+'_Final';
  }
  if(id==='GlobalChampionship2024') id='GlobalChampionship';
  const sd=/^Showdown(\d)_2025_(LCQ|Final)$/.exec(id);
  if(sd) return L().ccYr25Showdown(+sd[1]-3, sd[2]==='LCQ' ? 1 : 2);
  const sc=/^SoloCash(\d+)_R([12])$/.exec(id);
  if(sc) return L().ccYr25SoloCash(+sc[1], +sc[2]);
  if(id==='GlobalChampionship2025') id='GlobalChampionship';
  let base=(L().ccYearNames && L().ccYearNames[id]) || id;
  // Третьего Мейджора в подписях 2026-го нет: имя берётся у первого с заменой номера.
  if(base===id){ const mm=/^Major(\d)_(\w+)$/.exec(id); const one=mm && L().ccYearNames && L().ccYearNames['Major1_'+mm[2]]; if(one) base=one.replace('1', mm[1]); }
  // The two rows that name a city name whichever city it is this year.
  const hasCity=base.indexOf('{CITY}')>=0;
  if(hasCity){
    const kind = /Reload/.test(id) ? 'rc' : /^Nations/.test(id) ? 'nations' : 'globals';
    base=base.split('{CITY}').join(ccLanCity(kind));
  }
  if(day===from) return base;
  let n=1;
  for(let d=from; d<day; d=ccAddDays(d,1)) n++;
  /* Номер дня не приклеивается к ГОРОДУ.

     Строка кончается городом ровно у двух событий года — Мирового чемпионата и
     Reload Championship, — и счётчик, приписанный к ней хвостом, читался как
     часть названия: скриншот, две плитки календаря за 26 и 27
     сентября, «Мировой чемпионат · Форт-Уэрт» и «Мировой чемпионат · Форт-Уэрт
     2». Второго Форт-Уэрта не существует, это второй день одного турнира.

     Сессия — то самое слово, которым календарь уже называет второй вечер
     кубка, и оно переведено во всех локалях. Остальные блоки (Хиты, Плей-Ин)
     города не называют, и у них хвостовой номер читается как задумано. */
  return hasCity ? base+' · '+L().calSession.replace('{N}', String(n))
                 : base+' '+n;
}

function careerEvents(){
  const div=CAREER && CAREER.career ? CAREER.career.division : 5;
  const out=new Map();
  careerYearDays().forEach((list, day)=>{
    list.forEach(e=>{
      // The Weekly Final and the Performance Evaluation belong to Division 1
      // alone. A player below it sees neither on their calendar, because neither
      // is theirs to enter — that is the division's own rule, not a display one.
      if(CC_D1_ONLY.indexOf(e.kind)>=0 && div!==1) return;
      // And the other way round: the two cup weeks Division 1 spends at the
      // Major Play-In are days it has nothing on, while the divisions below it
      // play them as an ordinary week.
      if(e.only==='low' && div===1) return;
      // И зеркально: Division 1 Practice сорок второго сезона — страница
      // самого Epic зовёт его Division 1 и никого больше.
      if(e.only==='d1' && div!==1) return;
      if(!out.has(day)) out.set(day, []);
      // id едет вместе со строкой: без него клетка календаря знает, что на ней
      // «мейджор», но не знает, КОТОРЫЙ, — а метка «ты сюда уже прошёл» стоит
      // на конкретном турнире. См. ccQualOn.
      /* Париж — ЛАН, а не картинка: его день в календаре носит флаг страны,
         как Саммит и Антверпен (ccLanFlagStyle), а не обложку своего вида.
         Отзыв: «у Парижа тоже нет логотипа Reload, можешь
         просто флаг сделать, как и остальным ЛАНам». */
      out.get(day).push({kind:e.kind, label:e.label, id:e.id,
                         lan: ccLanKindOf(e.id, e.kind),
                         // По id раньше, чем по виду: Мейджоры 2025-го — со своими постерами, 2024-го — со своим островом (ccEventArt).
                         art: ccLanKindOf(e.id, e.kind) ? null : ((typeof ccEventArt==='function' && ccEventArt(e)) || CAREER_EV_ART[e.kind] || null)});
    });
  });
  /* ПОСЛЕДНИЙ ДЕНЬ ГОДА — ЦЕРЕМОНИЯ. Правка: «церемонию сделать
     отдельный последний день, и там что-то показывают игроку за весь сезон».

     Это строка календаря, а не турнир: вида 'gala' нет в CC_PLAYABLE, поэтому
     careerCanPlayKind отвечает на него «нет», а в CC_KIND_RANK его нет — значит
     в день, где стоит настоящий турнир, он никогда не перебьёт его. Стоит он
     ровно на CC_YEAR_TO, то есть на том дне, на котором карьера и замирает
     (см. careerAdvanceBody: всё, что дальше, сажается на эту дату). */
  if(!out.has(ccYearTo())) out.set(ccYearTo(), []);
  out.get(ccYearTo()).push({kind:'gala', label:L().ccGalaDay, id:'SeasonGala',
                            lan:null, art:CAREER_EV_ART.gala});
  return out;
}

/* Какой это ЛАН — по строке года, а не по её виду: Париж идёт под видом 'gc'
   (общая с Last Chance краска), но город у него свой. */
function ccLanKindOf(id, kind){
  if(String(id||'')==='ReloadChampionshipParis') return 'rc';
  if(String(id||'')==='NationsFinal') return 'nations';   // финал — ЛАН, отбор и квалификация — онлайн
  return (kind && CC_LAN_KINDS[kind]) ? kind : null;
}
// Which month the calendar is showing. It opens on the month the player is
// actually standing in rather than on the start of the season, and the arrows
// stop at the two ends of it — there is nothing to page to outside the season.
let CH_MONTH=null;
function careerMonthBounds(){
  const a=new Date(ccYearFrom()+'T00:00:00Z'), b=new Date(ccYearTo()+'T00:00:00Z');
  return {from:{y:a.getUTCFullYear(), m:a.getUTCMonth()},
          to:  {y:b.getUTCFullYear(), m:b.getUTCMonth()}};
}
function careerMonthShift(n){
  const idx=CH_MONTH.y*12+CH_MONTH.m+n;
  const b=careerMonthBounds();
  const lo=b.from.y*12+b.from.m, hi=b.to.y*12+b.to.m;
  if(idx<lo || idx>hi) return;
  CH_MONTH={y:Math.floor(idx/12), m:idx%12};
  careerRenderHub('calendar');
}
/* ЗНАЧКИ ВИДОВ ТУРНИРА в календаре — отзыв: «измени иконки под стиль фортнайта в
   календаре, где месяц и недели». Вместо цветных точек и квадратов — глифы, как на плитках
   Compete: кубок FNCS, звезда финала, диаграмма Перфоманса, корона Мейджора, глобус, стрелки
   Reload, медаль Victory Cup, силуэт соло, микрофон Про-Ама, вершины Саммита, билет Ласт Ченса.
   Цвет остаётся тот же, что был у точки (ch-pip-*), — по нему неделю читают с расстояния. */
const CC_KIND_ICON={
  cup:'<path d="M4 2h8v2h2v3a3 3 0 0 1-3 3h-.3A3 3 0 0 1 9 11.6V13h2v1.5H5V13h2v-1.4A3 3 0 0 1 5.3 10H5a3 3 0 0 1-3-3V4h2V2zm0 3.5H3.5V7a1.5 1.5 0 0 0 1.5 1.5V5.5zm8 0V8.5A1.5 1.5 0 0 0 13.5 7V5.5H12z"/>',
  final:'<path d="M8 1.5l2 4.2 4.6.6-3.4 3.2.9 4.6L8 11.8l-4.1 2.3.9-4.6L1.4 6.3 6 5.7z"/>',
  eval:'<path d="M2 9h3v5H2zM6.5 5h3v9h-3zM11 2h3v12h-3z"/>',
  major:'<path d="M2 5l3.2 2.6L8 3l2.8 4.6L14 5l-1.3 7H3.3zM3.3 13h9.4v1.5H3.3z"/>',
  summit:'<path d="M1.5 13.5L6 5l2.4 4.2L10 6.5l4.5 7z"/>',
  globals:'<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm-1 1.7c-.9 1-1.6 2.3-1.9 3.8H3.3a5 5 0 0 1 3.7-3.8zM3.3 9h1.8c.3 1.5 1 2.8 1.9 3.8A5 5 0 0 1 3.3 9zM8 13.1C7 12 6.5 10.6 6.4 9h3.2C9.5 10.6 9 12 8 13.1zM6.4 7C6.5 5.4 7 4 8 2.9 9 4 9.5 5.4 9.6 7zm4.7 2h1.6a5 5 0 0 1-3.5 3.8c.9-1 1.6-2.3 1.9-3.8zm0-2c-.3-1.5-1-2.8-1.9-3.8A5 5 0 0 1 12.7 7z"/>',
  gc:'<path d="M1.5 4h13v3a1.5 1.5 0 0 0 0 3v3h-13V10a1.5 1.5 0 0 0 0-3zm3.5 1.5v6h1.2v-6zm2.5 0v6h1.2v-6z"/>',
  gclc:'<path d="M1.5 4h13v3a1.5 1.5 0 0 0 0 3v3h-13V10a1.5 1.5 0 0 0 0-3zm3.5 1.5v6h1.2v-6zm2.5 0v6h1.2v-6z"/>',
  reload:'<path d="M8 2.5a5.5 5.5 0 0 1 4.9 3H15l-2.6 3.3L9.8 5.5h1.5A3.8 3.8 0 0 0 4.2 8H2.5A5.5 5.5 0 0 1 8 2.5zm-4.9 8H1l2.6-3.3 2.6 3.3H4.7A3.8 3.8 0 0 0 11.8 8h1.7a5.5 5.5 0 0 1-10.4 2.5z"/>',
  rc:'<path d="M8 2.5a5.5 5.5 0 0 1 4.9 3H15l-2.6 3.3L9.8 5.5h1.5A3.8 3.8 0 0 0 4.2 8H2.5A5.5 5.5 0 0 1 8 2.5zm-4.9 8H1l2.6-3.3 2.6 3.3H4.7A3.8 3.8 0 0 0 11.8 8h1.7a5.5 5.5 0 0 1-10.4 2.5z"/>',
  victory:'<path d="M5 1.5h6l-1.2 4.2h-3.6zM8 6.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 1.6l-.8 1.7-1.8.2 1.3 1.3-.3 1.8L8 12.2l1.6.9-.3-1.8 1.3-1.3-1.8-.2z"/>',
  solo:'<path d="M8 1.5a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM2.5 14.5c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3z"/>',
  proam:'<path d="M8 1.5a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0V4A2.5 2.5 0 0 1 8 1.5zM3.5 8h1.5a3 3 0 0 0 6 0h1.5a4.5 4.5 0 0 1-3.75 4.4V13.5h2.25V15h-6v-1.5h2.25v-1.1A4.5 4.5 0 0 1 3.5 8z"/>',
  free:'<circle cx="8" cy="8" r="3"/>'
};
function ccKindIconSVG(kind){
  const k=String(kind||'cup');
  const p=CC_KIND_ICON[k] || CC_KIND_ICON.cup;
  return '<svg viewBox="0 0 16 16" aria-hidden="true">'+p+'</svg>';
}
/* КНОПКИ КАЛЕНДАРЯ — как кнопки Fortnite: скошенные чипы, стрелки месяца и перемотки векторные, а не
   символы шрифта (скриншот: «значки не нравятся возле месяца и недели, мб дизайн изменить
   кнопочки» — это ‹ › у месяца и ⏩ у «неделя/месяц»). */
const CC_BTN_ICON={
  prev:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5L5 8l5.5 5.5 1.5-1.5-4-4 4-4z"/></svg>',
  next:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 2.5L11 8l-5.5 5.5L4 12l4-4-4-4z"/></svg>',
  ff:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3l6 5-6 5zM8.5 3l6 5-6 5z"/></svg>',
  skip:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3l7 5-7 5zM11 3h3v10h-3z"/></svg>'
};
function careerCalendarHTML(){
  const ev=careerEvents();
  const cr=CAREER.career;
  const nowFrom=careerMonday(careerToday()), nowTo=ccAddDays(nowFrom,6);

  // Open on the month the player is in, not on the first of the season.
  if(!CH_MONTH){
    const here=new Date(careerMonday(careerToday())+'T00:00:00Z');
    CH_MONTH={y:here.getUTCFullYear(), m:here.getUTCMonth()};
  }
  const b=careerMonthBounds();
  const idx=CH_MONTH.y*12+CH_MONTH.m;
  const atStart=idx<=b.from.y*12+b.from.m, atEnd=idx>=b.to.y*12+b.to.m;

  // Everything the tab shows lives inside one dark panel, so the month is a
  // screen rather than a dark rectangle dropped on a white page.
  let html=`<div class="cal-stage"><div class="cal-bar">`+
    `<button class="cal-nav" ${atStart?'disabled':''} onclick="careerMonthShift(-1)" aria-label="prev">${CC_BTN_ICON.prev}</button>`+
    `<h4>${L().calMonths[CH_MONTH.m]} ${ccShowYear(CH_MONTH.y)}</h4>`+
    `<button class="cal-nav" ${atEnd?'disabled':''} onclick="careerMonthShift(1)" aria-label="next">${CC_BTN_ICON.next}</button>`+
    `<button class="cal-today" onclick="CH_MONTH=null; careerRenderHub('calendar');">${L().calNow}</button>`+
    // The day that was picked, and the press that actually runs it. A month of
    // a career is too much to hand to one click on a screen people scroll.
    (CH_FF_ASK && CH_FF_ASK>careerToday() && !cr.seasonOver ? `<div class="cal-ask">
      <span>${L().calFfAsk(ccDayLabel(CH_FF_ASK), ccFfDays(CH_FF_ASK), ccFfEvents(CH_FF_ASK))} ${ccFfEtaText(CH_FF_ASK)}</span>
      ${ccMpOn() && ccMpFfPending() && ccMpFfPending().mine && ccMpFfPending().until===CH_FF_ASK
        ? `<span class="ch-hint" style="margin:0;">${L().ccMpFfWait(ccDayLabel(CH_FF_ASK))}</span>`
        : `<button class="ch-sign" onclick="careerFfToDay(\'${CH_FF_ASK}\')">${ccMpOn() ? L().ccMpFfYes : L().calFfGo}</button>`}
      ${/* Тот же день, но без турниров по дороге — пропуск, не перемотка.
           См. careerSkipTo; в команде день двигает сервер. */
        ccMpOn() ? '' : `<button class="ch-sign cal-skip" onclick="careerSkipTo(\'${CH_FF_ASK}\')" title="${esc(L().calSkipHint)}">${L().calSkipGo}</button>`}
      <button class="cc-back" onclick="careerFfCancel()">${L().ccDecline}</button>
    </div>` : '')+
    // The same fast-forward the main screen offers, on the screen where a
    // player is actually looking at time passing. Asked for here rather than
    // only beside Play, which is where you are when you want to move.
    (cr.seasonOver ? '' : careerFfButtonsHTML())+
    `</div><div class="cal-wrap">`;
  {
    const y=CH_MONTH.y, m=CH_MONTH.m;
    const daysIn=new Date(Date.UTC(y, m+1, 0)).getUTCDate();
    // Monday-first, which is how a European competitive week reads.
    const lead=(new Date(Date.UTC(y,m,1)).getUTCDay()+6)%7;
    let cells='';
    for(let i=0;i<lead;i++) cells+='<div class="cal-day cal-void"></div>';
    for(let d=1; d<=daysIn; d++){
      const k=dateKey(new Date(Date.UTC(y,m,d)));
      const list=ev.get(k)||[];
      const inWeek = k>=nowFrom && k<=nowTo;
      // A day wears the cover of the first thing happening on it. The Major
      // weekend is three days of the same event, so the block reads as one.
      const art=list.length ? list[0].art : null;
      const kind=list.length ? list[0].kind : null;
      /* У ЛАНа обложки нет — есть город. Флаг его страны и красит день:
         см. ccLanFlagStyle. */
      const lanKind=list.length ? list[0].lan : null;
      const lanFlag=(!art && lanKind) ? ccLanFlagStyle(lanKind) : null;
      /* A day ahead is a day you can go to.

         The calendar was the one screen in the mode that only ever told you
         things. It holds the whole year - which Saturday the Major is on, where
         the Reload final sits, how far it is to Antwerp - and the way to get
         there was pressing "a week" until the number matched. Pressing the day
         itself is the same fast-forward with the arithmetic done for you: it
         plays everything on the way, exactly as the two buttons do.

         Only forward, and only inside the season: the past is played and the
         boundary is a decision. */
      const ahead = k>careerToday() && !cr.seasonOver;
      cells+=`<div class="cal-day${list.length?' has':''}${art?' art art-'+kind:''}${lanFlag?' art art-lan':''}${inWeek?' now':''}`+
        `${ahead?' cal-go':''}${k===CH_FF_ASK?' cal-picked':''}${
          list.some(ccQualOn)?' cal-qual':''}"`+
        `${art?` style="background-image:url(${art});"`:(lanFlag?` style="${lanFlag}"`:'')}`+
        `${ahead?` onclick="careerFfAsk(\'${k}\')" title="${esc(L().calGoHere)}"`:''}>`+
        `<span class="cal-n">${d}</span>`+
        list.map(x=>`<span class="cal-ev cal-${x.kind}">${x.label}</span>`).join('')+
        // Плашка: место уже твоё (квалификация) или ЛАН зовёт тебя (приглашение).
        (list.some(ccQualOn) ? `<span class="cal-badge ok">✓ ${esc(L().lfCalQual)}</span>`
          : (k>=careerToday() && list.some(x=>x.kind==='victory' && (()=>{ const v=careerVictoryOn(k); return v && v.invite && ccVictoryInvited(v); })()))
            ? `<span class="cal-badge inv">✉ ${esc(L().lfCalInvited)}</span>` : '')+
        `</div>`;
    }
    html+=`<div class="cal-month">`+
      `<div class="cal-dow">${L().calDows.map(d=>`<span>${d}</span>`).join('')}</div>`+
      `<div class="cal-grid">${cells}</div></div>`;
  }
  return html+'</div></div>';
}

/* Career division cup. Below Division 1 the lobby is generated ladder players (labelled as such); in Division 1
   it's the real roster. All 701 EU cards in tools/baseline-card-ratings.json are 62+ (median 81): the roster is Major
   players, i.e. Division 1, so there's nobody to draw from for D2-D5.
   Format is Epic's: 11 games, lobbies of 50, PLACEMENT_POINTS_DUO, 4 per kill. Epic publishes quotas (400/200/100/50)
   but not field sizes; quotas chain, so each rung promotes a quarter to a half. One third everywhere; at 150 that's
   50, Epic's own D2 quota. See docs/superpowers/specs/2026-08-12-career-division-cups-design.md */

const CAREER_CUP_FIELD=150, CAREER_CUP_GAMES=11, CAREER_CUP_CUT=50;

/* Divisional cup size and quota per division. Epic quotas: top 400 from D5, 200 from D4, 100 from D3, 50 from D2.
   Field = 3x quota (1,200 / 600 / 300 / 150), the same one-third ratio the calibration measured.
   D1 has no quota (its 50 is a Weekly Final seat), size measured, see CC_CUP_ENTRANTS.
   CAREER_CUP_FIELD/CAREER_CUP_CUT stay for the Major Play-In, Victory Cup top 50 and Reload Opens cut. */
/* Quotas scaled to our room sizes, keeping Epic's measured shares (400/5000, 200/2500, 100/1250 = 8%, 50/725 =
   6.9%); ladder calibration depends on the shares, not the absolutes.
   Rounded to tens, shares land at 8.0/7.9/7.5/8.0, well inside room-size noise. Division 2 at 20/250 is 8% vs
   Epic's 6.9%, so it's as hard as the three below; 17 restores Epic's share.
   Division 1's 50 isn't a promotion, it's the Weekly Final's real size. */
const CC_CUP_QUOTA={1:50, 2:20, 3:30, 4:50, 5:80};
/* Division 1's is measured, not chosen, and it is not the 150 this used to say.
   That 150 was the Major's own card field — the strongest of the Play-In, the
   ones who are certainly there — and it was never Division 1's size.

   Tracker's leaderboard for S41_FNCSDivisionalCup_Division1 Week 4 Day 1 in
   Europe runs to 7 pages, the last of them 45 rows: 645 duos. Its Weekly Final
   is one page of exactly 50, which is where the quota of 50 above comes from
   and why it is the one rung whose quota is its own final rather than a
   promotion. Fifty of 645 is one in thirteen. */
/* Room sizes. tools/career-room-size.js runs the same duo through the same cup at each size with the cut at the
   same share: size doesn't matter. D4 median 11/12.8/6.8/11.1/8.2 and D2 12/12.4/12.6/12 for rooms
   100/250/500/1000/2000, promote rates 33-55% with no trend (stderr ~5 points at 100 runs).
   The only floor is cut granularity: at 8% you want 17+ seats, so Division 2's 250 is binding. Rest is
   1000/630/400/250, each rung 0.63 of the one below (D5 1.9 s a cup vs 3.7). Tracker's real 5000/2500/1250/725/645
   made the open 9,766 duos, 7+ s a stage.
   Division 1 isn't generated: every current card in the career's region, paired (206 pairs in EU).
   Quotas keep Epic's 8% (D5-3) and 6.9% (D2) shares. */
// Read off the pool rather than typed: Division 1 is the real duos there are to
// seat, which is also why it is the right size in every region. Down to a round
// ten, his call on 17 August: 206 recorded pairs seats 200 of them, and which
// six sit out is a different six every week, because careerRealDuos shuffles.
function ccDiv1Size(){
  return Math.max(50, Math.floor(careerPools().duos.length/10)*10);
}
const CC_CUP_ENTRANTS={2:250, 3:400, 4:630, 5:1000,
  get 1(){ return ccDiv1Size(); }};
