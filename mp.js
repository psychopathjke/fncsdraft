/* Командная карьера: транспорт и склейка.
 *
 * Единственный файл, знающий про сервер. index.html о вебсокете не знает
 * ничего — у него только точки врезки, названные в спеке.
 *
 * Правило про кэш скриптов действует и здесь: поменял этот файл — обнови
 * ?v= в теге, иначе браузер возьмёт старую версию и разойдётся с напарником.
 */
(function(){
'use strict';
var SOCK=null, CODE=null, ID=null, SEEN=0, HANDLERS={}, PEER=null;
/* Чужие решения, приехавшие раньше, чем до них дошёл этот клиент.

   Гонка настоящая, а не теоретическая: тот, кто жмёт «пропустить», проходит
   игру за один кадр и отвечает на вопрос о луте мгновенно, а второй в это
   время ещё досматривает предыдущую. Решение прилетает ему ДО того, как он
   подписался на него в ccMpDecide, — и без очереди он ждал бы его вечно.

   Складывается только ЧУЖОЕ: своё эхо владелец решения не разбирает, иначе
   очередь копила бы его собственные ответы. Чистится на старте и закрытии
   вечера, а сверх шестидесяти четырёх — самое старое выбрасывается: очередь
   это буфер на секунды, а не журнал. */
/* Очередь чужих ответов и — после перезагрузки — СВОИХ (OWN): вечер догоняется
   по ним, не спрашивая заново. Лимит вырос: за длинный вечер с барьером на
   каждую игру и тремя вопросами ленты набегает больше шестидесяти четырёх. */
var ACTS=[], ACTS_MAX=512, OWN=[];
function findIn(list, kind, q, take){
  for(var i=0;i<list.length;i++){
    var a=list[i];
    if(a.kind!==kind) continue;
    var aq=(a.payload && a.payload.q);
    if(aq!=null && q!=null && aq<q){ list.splice(i,1); i--; continue; }
    if(aq==null || q==null || aq===q) return take ? list.splice(i,1)[0] : a;
  }
  return null;
}
// Когда напарник последний раз подавал голос — любым сообщением. См. MP.peerSeen.
var LAST_PEER=0;
/* Состояние связи — четыре слова, и все четыре видны игроку.

   'off'  — карьера одиночная, лобби ни при чём;
   'wait' — подключаемся прямо сейчас;
   'live' — лобби отвечает, вечер можно начинать;
   'lost' — связи нет: не дозвонились или оборвалось;
   'old'  — лобби сказало «до свидания» по версии кода: у вас разные сборки,
            и это единственное состояние, из которого не переподключаются.

   Без этого первая же живая проба выглядела бы так: кнопка «играть» ничего не
   делает, и почему — нигде. День в командной карьере двигает только сервер
   (см. careerAdvanceTo), так что молчащий обрыв — это остановившаяся карьера. */
var TRY=0, TIMER=null;
var BACKOFF=[1500, 3000, 6000, 12000, 30000];

// Плитка команды и панель дня читают состояние на отрисовке — значит после
// каждой перемены надо перерисовать то, что открыто.
function redraw(){
  try{ if(typeof careerRenderHub==='function' && document.getElementById('chBody'))
         careerRenderHub(typeof CH_TAB!=='undefined' ? (CH_TAB||'centre') : 'centre'); }catch(e){}
}
function setState(s){
  if(MP.state===s) return;
  MP.state=s;
  redraw();
}
function emit(m){ (HANDLERS[m.t]||[]).forEach(function(fn){ try{ fn(m); }catch(e){} }); }
/* Разные сборки в одном лобби чинятся перезагрузкой — и делает её страница.

   Правило «в лобби одна версия» остаётся: два клиента с разным кодом считают
   вечер по-разному, и пускать их вместе нельзя. Менялось только то, ЧТО
   игрок должен делать. Раньше — читать «обновите страницу» и гадать, кому
   именно; причём отказ видел пришедший, а устаревшим часто был тот, кто уже
   сидел в лобби и никакого сообщения не получал вовсе.

   Теперь перезагружается тот, кто устарел, и делает это сам, с обходом кэша.

   Один раз на сборку, и это важно: метка запоминается ТА, С КОТОРОЙ мы
   перезагружались. Если после перезагрузки код остался прежним (сервер не
   ответил, отдался кэш), второй попытки не будет — иначе страница крутилась
   бы по кругу. Сменилась метка — значит обновление доехало, и следующее
   расхождение снова можно чинить. */
function reloadOnce(){
  try{
    var k='fncsdraft_mp_reload';
    if(sessionStorage.getItem(k)===String(CC_BUILD)) return;
    sessionStorage.setItem(k, String(CC_BUILD));
  }catch(e){ return; }
  try{ location.replace(location.pathname+'?b='+(new Date()).getTime()); }catch(e){}
}

var MP={
  /* Карточка напарника. Читается отовсюду, а ставится и лобби (пришло 'card'),
     и проверками — поэтому не только геттер: сторожу негде взять живой сокет,
     а подменять транспорт ради одной строки дороже, чем открыть запись. */
  get peer(){ return PEER; },
  set peer(c){ PEER=c; },
  get code(){ return CODE; },
  get peerSeen(){ return LAST_PEER; },
  // Состояние связи. Пишется и снаружи — проверкам негде взять живой сокет.
  state:'off',
  /* Кто уже нажал «играть»: {day, n, of}. Ставится сообщением сервера и
     читается кнопкой дня (ccMpReadyTag). null — никто ещё не нажимал либо
     вечер уже начался. */
  waiting:null,

  /* Подписка возвращает отписку.

     Без неё ccMpDecide вешал обработчик на КАЖДЫЙ вопрос каждой игры и не
     снимал ни одного: за сезон их набираются тысячи, и все они остаются в
     списке до конца страницы, а каждое пришедшее решение проходит через
     весь список. Старые вызовы возвращаемое значение не читают — им ничего
     менять не нужно. */
  on:function(t, fn){
    var a=(HANDLERS[t]=HANDLERS[t]||[]);
    a.push(fn);
    return function(){ var i=a.indexOf(fn); if(i>=0) a.splice(i,1); };
  },

  /* Ночная карточка: всё, что сегодня двигает мою силу, и ничего сверх.

     СОБИРАЕТСЯ ИЗ НАСТОЯЩЕЙ (careerCard), а не из полей игрока, и это не
     стилистика. Свою половину команды каждый берёт careerCard()-ом, а чужую —
     отсюда; значит обе должны читаться ОДНИМ И ТЕМ ЖЕ кодом. Симуляция читает
     карточку через attrsFor, а он смотрит `_attrs`, `_targetOvr`, `_roleKey`,
     `region`, `_pingEdge`, `_ageEdge` — и ни одного из этих имён в прежней
     версии не было: по проводу ехали `ovr`, `role`, `attrs`, и напарник у всех
     выходил сорокапятым фраггером, кем бы он ни был. Замер до правки
     (tools/check-mp-two-players.js): 94/IGL у себя против 45/FRG по проводу,
     сила команды 76 против 69 — то есть вечер расходился на первой же игре.

     Личного тут по-прежнему нет: деньги, журнал, инбокс и контракты не едут.
     Едет карточка и то, в каком она сегодня состоянии. */
  card:function(){
    var cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career)||{};
    var org=(typeof CAREER!=='undefined' && CAREER && CAREER.org)||null;
    var c=(typeof careerCard==='function') ? careerCard() : null;
    if(!c) return null;
    // Шесть чисел считаются ДО отправки: attrsFor кладёт их в _attrs, и
    // напарник получает карточку уже поднятой до рейтинга, а не сырой.
    if(typeof attrsFor==='function') attrsFor(c);
    /* Уезжает КАРТОЧКА ЦЕЛИКОМ, а не выборка полей.
     *
     * Выборкой это и было — и падало: у карточки напарника не оказалось поля
     * `event`, а карточку рисует общий код, который читает его без оглядки.
     * Его скрин 26 августа, момент входа второго: «Uncaught TypeError: Cannot
     * read properties of undefined (reading 'replace')». Список полей,
     * составленный вручную, обречён отставать от кода, который карточку
     * читает: она ездит по проводу и рисуется, и считается тем же самым
     * кодом, что и своя.
     *
     * Личного в карточке нет по устройству: деньги, журнал, инбокс и
     * контракты живут в CAREER.career и CAREER.dms, а не здесь. Сверху
     * докладывается только сегодняшнее состояние — форма, усталость,
     * болезнь, сборы, девайсы, — то, что двигает силу именно сегодня. */
    var out=JSON.parse(JSON.stringify(c));
    out.org = org ? org.name : null;
    out.form = cr.form||0;
    // И та же форма, уже посчитанная, — после перегруза и пола от машины.
    // Её читает ccTeamFormPow: у обоих одни и те же два числа. Сырое form
    // выше остаётся для плитки.
    out.formPow = (typeof careerForm==='function') ? careerForm() : 0;
    out.tired = cr.tired||0;
    out.sick = !!cr.sickUntil;
    out.camp = cr.camp||null;
    out.gear = (typeof CAREER!=='undefined' && CAREER && CAREER.gear && CAREER.gear.own)
                 ? CAREER.gear.own.slice() : [];
    /* Режим показа — «играть» или «смотреть».

       Он выглядит настройкой человека, а на деле решает, ЗАДАЮТ ЛИ ВОПРОСЫ:
       в «смотреть» playGameWithChoices не спрашивает вовсе. Двое в разных
       режимах проходят вечер по разным путям — то же самое, чем был опасен
       пропуск. Поэтому режим ездит вместе с карточкой, и вечер с разными
       режимами не начинается (см. ccMpModeWhy). */
    out.sim = !!cr.sim;
    /* Стаж дуо — вход силы (careerChem). Ключ командный, но у вошедшего
       вторым он появляется только с первым 'state': до этого химия нулевая
       и сила своей команды расходится на единицу. Оба берут РАННЮЮ из двух
       дат — см. careerChemDays. */
    out.chemSince = cr.chemSince || null;
    /* Своя соло-точка (метка) — центром коробки: у соло сетка дроблёная, и
       индекс на чужой стороне значил бы другое место. Напарник сажает нас на
       неё ДО раздачи ботов, как мы его. См. ccSoloHomeZoneOf. */
    var sh=(typeof careerSpotOn==='function') ? careerSpotOn('solo') : null;
    if(sh && (sh.cx==null || sh.cy==null) && typeof careerSpotGrid==='function' && typeof ZONE_SETS!=='undefined'){
      // Старая запись без центра — центр её крупной коробки.
      var box=(ZONE_SETS[careerSpotGrid('solo')]||[])[sh.i];
      if(box) sh={i:sh.i, cx:box.x+box.w/2, cy:box.y+box.h/2};
    }
    out.soloHome = sh ? {i:sh.i, cx:sh.cx, cy:sh.cy} : null;
    return out;
  },

  /* Состав из двух карточек, в устойчивом порядке.
     Порядок обязан не зависеть от того, кто спрашивает: иначе синергия и
     роли считаются по-разному и вечер разъезжается. Сортировка по нику —
     самый дешёвый устойчивый ключ, который есть у обеих сторон. */
  teamOf:function(mine, peer){
    return [mine, peer].filter(Boolean).sort(function(a,b){
      return String(a.handle).toLowerCase() < String(b.handle).toLowerCase() ? -1 : 1;
    });
  },

  /* Разбор пришедшего — отдельно от сокета, чтобы его можно было позвать
     руками: проверке негде взять живое лобби, а поведение по 'bye' проверять
     надо. Сокет просто зовёт это на каждое сообщение. */
  say:function(m){
    if(!m) return;
    if(m.n) SEEN=m.n;
    /* Признак жизни напарника. Любое его сообщение — ответ, приход, карточка,
       состояние, пульс — говорит «я здесь и считаю». Пульс (kind 'hb') в
       очередь решений не попадает: он ничего не решает и вытеснял бы из неё
       настоящие ответы (ACTS_MAX). */
    if(m.by && m.by!==ID) LAST_PEER=(new Date()).getTime();
    if(m.t==='act' && m.kind==='hb'){ if(m.by && m.by!==ID) MP.peerHb=m.payload||null; return; }
    /* Полное состояние команды. Применяется только если команда наша: с
       чужим дивизионом оно переписало бы карьеру вошедшего. Решает это
       index.html — здесь про дивизионы знать нечего. См. ccMpStateOk. */
    if(m.t==='state'){
      PEER=m.peer||PEER;
      /* Сид команды — ОТ СЕРВЕРА, и он старше всего, что лежит в сейве.

         Живой сторож 28 августа (check-mp-live-two): у двоих в одном лобби
         разные cr.seed — «LiveA» у одного, «LiveB» у другого. Сид рождался
         лениво из НИКА (ccCareerSeed), каждый успевал завести свой до первого
         обмена состоянием, а потом два состояния перетирали друг друга в
         порядке прихода. От сида считается всё поле вечера — двое собирали
         разные комнаты с первой игры при одном сиде генератора. Лобби своим
         сидом делится в каждом 'state'; здесь он и ставится. */
      // Знакома ли команда: сид лобби уже лежит в сейве (своя команда) или нет (вход в чужую).
      var known=!!(typeof CAREER!=='undefined' && CAREER && CAREER.career && m.seed && CAREER.career.lobbySeed===m.seed);
      if(m.seed && typeof ccMpLobbySeed==='function') ccMpLobbySeed(m.seed);
      if(typeof ccMpStateOk!=='function' || ccMpStateOk(m.team, known)) ccApplyTeamState(m.team);
      // Состояние принято — но напарник может оказаться тобой же.
      if(typeof ccMpPeerCheck==='function' && ccMpOn && ccMpOn()) ccMpPeerCheck();
      /* Вечер у сервера идёт — вкладке он либо нужен заново (перезагрузка),
         либо она ждала старта, который пропустила (обрыв). А если вечера нет,
         но было закрытие, — его мог пропустить тот, кто ждал close. */
      if(m.evening && typeof ccMpResume==='function'){
        var feed=m.feed||[], mine=[], theirs=[];
        var myId=(typeof ccMpId==='function') ? ccMpId() : ID;
        for(var i=0;i<feed.length;i++){
          var e=feed[i];
          if(!e || e.t!=='act' || e.kind==='hb') continue;
          if(e.n>SEEN) SEEN=e.n;
          if(e.by===myId) mine.push(e); else theirs.push(e);
        }
        ccMpResume(m.evening, mine, theirs);
      } else if(!m.evening && m.closed && typeof ccMpClosedLate==='function'){
        ccMpClosedLate(m.closed);
      }
    }
    if(m.t==='card'){
      PEER=m.card;
      // Кто это вообще — решает index.html: здесь про карточки знать нечего.
      if(typeof ccMpPeerCheck==='function') ccMpPeerCheck();
    }
    /* Готовность — под кнопку.

       Его слово, 27 августа: «нужно, чтоб при нажатие кнопки играть было
       написано 1/2 если жмет кто-то или 0/2». Считает сервер, здесь только
       запоминается и перерисовывается: свою готовность клиент знает, чужую —
       нет, а после обрыва не знает и своей. */
    if(m.t==='ready'){ MP.waiting={day:m.day, n:m.ready||0, of:m.of||2, clash:m.clash||null}; redraw(); }
    // Вечер начался — ждать больше нечего.
    if(m.t==='start'){ MP.waiting=null; if(!m.resume){ ACTS.length=0; OWN.length=0; } redraw(); }
    // Состояние, которое напарник изменил прямо сейчас: метка на карте, взятый
    // третий, что угодно командное. Применяется и показывается сразу — см.
    // ccMpApplyRemote, там же глушится отправка обратно.
    if(m.t==='team')  ccMpApplyRemote(m.team);
    if(m.t==='act' && m.by && m.by!==ID){
      ACTS.push(m);
      if(ACTS.length>ACTS_MAX) ACTS.shift();
    }
    if(m.t==='close'){ MP.waiting=null; ACTS.length=0; OWN.length=0; ccApplyTeamState(m.team); }
    /* «До свидания» по версии — единственный отказ, из которого не
       переподключаются: пока страница не обновлена, код у нас всё тот же, и
       лобби скажет то же самое. Разрыв дуо ('part') связь не ломает: его
       разбирает careerPart, а состояние остаётся живым. */
    /* Отказ по дивизиону: лобби не наше и им не станет. Связь закрывается
       насовсем, а словами это скажет ccMpByeDiv на той стороне. */
    if(m.t==='bye' && m.reason==='div'){
      CODE=null;
      setState('off');
      try{ if(SOCK) SOCK.close(); }catch(e){}
      SOCK=null;
      try{ if(typeof ccMpByeDiv==='function') ccMpByeDiv(m.got, m.have); }catch(e){}
    }
    if(m.t==='bye' && m.reason==='build'){
      CODE=null;
      MP.builds={have:m.have||null, got:m.got||CC_BUILD};
      setState('old');
      reloadOnce();
    }
    // Кто-то пришёл со свежей сборкой, а у нас старая — обновляемся сами.
    if(m.t==='stale') reloadOnce();
    emit(m);
  },

  connect:function(code, id){
    CODE=code; ID=id;
    setState('wait');
    return new Promise(function(res, rej){
      /* Свой поддомен вместо *.workers.dev: workers.dev в РФ блокируют
         целиком, и дуо-карьера оттуда не подключалась (его отчёт 30 августа:
         «с рф проблемы с заходом»). Старый адрес жив — старые вкладки
         доиграют; воркер тот же, домен добавлен в wrangler.toml. */
      var url=(MP.host||'wss://mp.fncsdraft.com')+
              '/lobby/'+code+'?id='+encodeURIComponent(id)+'&build='+CC_BUILD;
      var sock;
      try{ sock=new WebSocket(url); }
      catch(e){ setState('lost'); rej(e); return; }
      SOCK=sock;
      sock.onopen=function(){
        TRY=0;
        setState('live');
        /* Дивизион и сид команды — вместе с приветствием: по ним лобби решает,
           пускать ли вошедшего (см. lobby.join). Сид говорит «это моя команда»,
           дивизион — «мы одного уровня». */
        sock.send(JSON.stringify({t:'hello', build:CC_BUILD, card:MP.card(),
                                  div:MP.div(), seed:MP.seed()}));
        // Вернулся — догнал по номерам, ничего не переспрашивая.
        if(SEEN) sock.send(JSON.stringify({t:'since', n:SEEN}));
        res();
      };
      sock.onerror=function(e){ if(MP.state!=='old') setState('lost'); rej(e); };
      sock.onmessage=function(ev){
        var m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; }
        MP.say(m);
      };
      sock.onclose=function(){
        if(MP.state==='old' || !CODE) return;
        setState('lost');
        // Ждущие вечера не должны стоять до потолка: см. ccMpLinkLost.
        try{ if(typeof ccMpLinkLost==='function') ccMpLinkLost(); }catch(e){}
        /* Ждём всё дольше: полторы секунды, три, шесть, двенадцать, полминуты.
           Раньше здесь стоял один и тот же полуторасекундный повтор навсегда —
           и вкладка, забытая на ночь с выключенным лобби, стучалась в него
           пятьдесят тысяч раз. */
        var wait=BACKOFF[Math.min(TRY, BACKOFF.length-1)];
        TRY++;
        clearTimeout(TIMER);
        TIMER=setTimeout(function(){ if(CODE) MP.connect(CODE, ID).catch(function(){}); }, wait);
      };
    });
  },
  // Уйти из лобби совсем — связь больше не нужна и переподключаться незачем.
  drop:function(){
    CODE=null; clearTimeout(TIMER); TRY=0; MP.waiting=null; ACTS.length=0;
    try{ if(SOCK) SOCK.close(); }catch(e){}
    SOCK=null; setState('off');
  },

  /* Поиск по ВИДУ и НОМЕРУ ВОПРОСА.
   *
   * Раньше искали только по виду, а спаривали по очереди — кто первый пришёл,
   * тот и ответ на этот вопрос. Пока оба идут шаг в шаг, это работает; стоит
   * одному съесть чужое сообщение раньше времени — и счёт разъезжается
   * НАВСЕГДА: каждый ждёт того, что уже съедено. Его отчёт, 28 августа:
   * «после 5 игры все зависло, у двоих сразу… пишет у двоих ждем напарника».
   * Оба стояли на барьере и ждали прихода, который другой давно прислал, а
   * этот сам же и выбросил на прошлом вопросе.
   *
   * Номер вопроса считают оба, одинаково и по одному правилу (CC_MP_QN), так
   * что спаривание перестаёт зависеть от порядка и скорости. Всё, что старше
   * текущего вопроса, выбрасывается сразу: оно уже никому не пригодится.
   *
   * Сообщения без номера (старая сборка, проверки) принимаются как есть — на
   * них правило не распространяется. */
  find:function(kind, q, take){ return findIn(ACTS, kind, q, take); },
  /* Свой ответ из ленты вечера — после перезагрузки. См. ccMpResume. */
  own:function(kind, q){ return findIn(OWN, kind, q, true); },
  preload:function(mine, theirs){
    OWN.length=0; (mine||[]).forEach(function(a){ OWN.push(a); });
    (theirs||[]).forEach(function(a){ if(!ACTS.some(function(b){ return b.n===a.n; })) ACTS.push(a); });
    while(ACTS.length>ACTS_MAX) ACTS.shift();
  },
  // Заглянуть, не забирая: ответ ещё нужен самому вопросу.
  peek:function(kind, q){ return MP.find(kind, q, false); },
  /* Напарник уже в более поздней игре? Смотрит в очередь приходов: барьер
     ('kind@') с номером игры больше названного. См. ccMpSync — «peer ahead». */
  ahead:function(g){
    if(g==null) return null;
    for(var i=0;i<ACTS.length;i++){
      var a=ACTS[i], p=a.payload||{};
      if(/@$/.test(String(a.kind||'')) && p.g!=null && p.g>g) return a;
    }
    return null;
  },
  // Забрать чужое решение этого вопроса, если оно уже приехало.
  take:function(kind, q){ return MP.find(kind, q, true); },
  /* Напарник уже стоит на барьере, которого мы ещё не прошли: в очереди лежит
     его приход ('kind@'), не забранный нашим ccMpSync. Значит, всё, что мы
     сейчас показываем, держит его. См. ccMpHurry. */
  waitingOnMe:function(){
    for(var i=0;i<ACTS.length;i++){ if(/@$/.test(String(ACTS[i].kind||''))) return true; }
    return false;
  },
  send:function(m){ if(SOCK && SOCK.readyState===1) SOCK.send(JSON.stringify(m)); },
  push:function(team){ MP.send({t:'team', team:team}); },
  /* Свежая карточка напарнику.

     До 28 августа она уезжала РОВНО ОДИН РАЗ — в hello, при входе в лобби, — и
     больше никогда. То есть у напарника всю карьеру лежал снимок на момент
     входа: ни форма, ни усталость, ни болезнь, ни сборы, ни девайсы до него не
     доезжали. А из карточки собирается команда, из команды — сила, из силы —
     вечер: двое считали разные вечера, каждый со своей половиной правды.

     Шлётся перед вечером (ccMpGate, до готовности) и при смене режима. Порядок
     сообщений на сокете сохраняется, поэтому карточка гарантированно приходит
     напарнику раньше, чем сервер объявит старт. */
  sendCard:function(){ MP.send({t:'card', card:MP.card()}); },
  // Чем карьера представляется лобби на входе. Пусто — значит нечем сверять.
  div:function(){
    var cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career)||null;
    return (cr && cr.division) || null;
  },
  seed:function(){
    var cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career)||null;
    return (cr && cr.seed) || null;
  },
  // Вид вечера едет вместе с днём: двое обязаны нажать ОДИН турнир. См. ccMpGate.
  ready:function(day, kind){ MP.send({t:'ready', day:day, kind:kind||null}); },
  act:function(kind, payload){ MP.send({t:'act', kind:kind, payload:payload}); },
  digest:function(hash, team){ MP.send({t:'digest', hash:hash, team:team}); },
  part:function(){ MP.send({t:'part'}); }
};
window.MP=MP;
})();
