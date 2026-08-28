/* Лобби командной карьеры: арбитр порядка.
 *
 * Здесь НЕТ ни одной строки симуляции и быть не должно. Сервер решает только
 * два вопроса: кто уже готов и в каком порядке пришли решения. Вечер считает
 * каждый браузер сам — это измерено (tools/check-lockstep.js), и на этом
 * стоит весь режим.
 *
 * Ни Workers API, ни fetch: поэтому машина проверяется обычным node за
 * секунду, а worker.js остаётся тонким переходником.
 */
'use strict';

function createLobby(opts){
  const o=opts||{};
  const st={
    build:o.build||null,
    seed:o.seed||('team-'+Math.random().toString(36).slice(2,10)),
    team:o.team||{},
    cards:{},            // id -> ночная карточка
    ready:{},            // id -> день, на который заявлена готовность
    feed:[],             // нумерованная лента решений текущего вечера
    n:0,                 // последний выданный номер
    evening:null,        // {seed, n} пока вечер идёт
    digests:{},          // id -> {hash, team}
    seen:0,              // когда лобби трогали в последний раз
    over:false           // дуо разорвано
  };
  const ids=()=>Object.keys(st.cards);
  const peerOf=id=>ids().find(x=>x!==id)||null;
  const stateMsg=id=>({t:'state', team:st.team, seed:st.seed,
                       peer:st.cards[peerOf(id)]||null});

  return {
    get state(){ return st; },

    join(id, msg){
      if(st.over) return [{to:'self', msg:{t:'bye', reason:'over'}}];
      /* Версия сверяется ДО всего остального: пустить клиента с чужим кодом
         значит согласиться на молчаливое расхождение в середине вечера.

         Но сказать надо ОБОИМ. Раньше отказ получал только пришедший, и на
         экране у него стояло «обновите страницу» — а обновлять надо было
         второму, который сидел в лобби со старой сборкой и ни о чём не знал.
         Теперь ему летит 'stale', и он перезагружается сам. Две стороны
         сходятся на свежей сборке без единого нажатия.

         Свою версию отказ несёт с собой: без неё игрок видит «разные версии»
         и не знает, чья именно чужая. */
      if(st.build && msg && msg.build!==st.build)
        return [{to:'self', msg:{t:'bye', reason:'build', have:st.build, got:msg.build}},
                {to:'peer', msg:{t:'stale', build:msg.build, have:st.build}}];
      if(ids().length>=2 && !st.cards[id])
        return [{to:'self', msg:{t:'bye', reason:'full'}}];
      st.cards[id]=(msg&&msg.card)||null;
      const out=[{to:'self', msg:stateMsg(id)}];
      const p=peerOf(id);
      if(p) out.push({to:'peer', msg:{t:'card', card:st.cards[id], by:id}});
      return out;
    },

    card(id, card){
      st.cards[id]=card;
      return [{to:'peer', msg:{t:'card', card:card, by:id}}];
    },

    /* Состояние команды, изменённое одним из двоих, — сразу второму.
     *
     * Его отчёт, 26 августа: «выбрал спот, у тимейта не показывается сразу».
     * Клиент слал сюда {t:'team'} с самого начала, а разбирать его было
     * некому — состояние доезжало только при входе (state) и в конце вечера
     * (close). Между ними двое сидели с разными метками на карте.
     *
     * Сервер по-прежнему ничего не считает: он кладёт присланное к себе и
     * пересказывает напарнику. Кто прислал последним, того и состояние —
     * тот же порядок прихода, что решает расхождение в digest. */
    team(id, t){
      if(!t) return [];
      st.team=t;
      return [{to:'peer', msg:{t:'team', team:st.team, by:id}}];
    },

    /* Сколько человек уже нажали «играть» — счёт ведёт сервер.

       Его слово, 27 августа: «нужно, чтоб при нажатие кнопки играть было
       написано 1/2 если жмет кто-то или 0/2, игра начинается если нажмут два
       человека». Считать это на клиенте нечем: свою готовность он знает, а
       чужую — только со слов сервера, и после обрыва у него не осталось бы
       ничего. Здесь готовность лежит и так.

       Число едет полем `ready`, а не `n`: `n` в этом протоколе — номер
       события, по нему клиент догоняет пропущенное после обрыва (см. since).
       Положить в него счётчик значило бы сдвинуть клиенту метку прочитанного.

       Знаменатель всегда 2, а не число подключённых: команда — это двое, и
       пока второй не вошёл, честный ответ «1 из 2», а не «1 из 1». */
    ready(id, day){
      st.ready[id]=day;
      const all=ids();
      const both=all.length===2 && all.every(x=>st.ready[x]===day);
      const n=all.filter(x=>st.ready[x]===day).length;
      if(!both) return [{to:'all', msg:{t:'ready', by:id, day:day, ready:n, of:2}}];
      st.ready={};
      st.feed=[]; st.digests={};
      st.evening={seed:st.seed+'|'+day, n:++st.n};
      return [{to:'all', msg:{t:'start', seed:st.evening.seed, n:st.evening.n, day:day}}];
    },

    act(id, kind, payload){
      const e={t:'act', n:++st.n, kind:kind, payload:payload, by:id};
      st.feed.push(e);
      return [{to:'all', msg:e}];
    },

    // Догон после обрыва: всё, что случилось после названного номера.
    since(id, n){ return st.feed.filter(e=>e.n>n); },

    /* Расхождение решается ПОРЯДКОМ ПРИХОДА, а не спором и не часами.

       Часов здесь нет нарочно: Date.now() в машине состояний сделал бы её
       непроверяемой, а порядок прихода — это порядок вызовов, он и так
       нумеруется. Первый пришедший хеш и становится истиной: у игрока на
       экране обязано оказаться то же, что у напарника, и любой другой ответ
       означал бы, что один из двоих доигрывает вечер, которого не было. */
    digest(id, hash, team){
      if(!st.digests[id]) st.digests[id]={hash:hash, team:team, seq:++st.n};
      const all=ids();
      if(!all.every(x=>st.digests[x])) return [{to:'peer', msg:{t:'digest', by:id}}];
      const win=st.digests[all[0]].seq<=st.digests[all[1]].seq ? all[0] : all[1];
      const same=st.digests[all[0]].hash===st.digests[all[1]].hash;
      st.team=st.digests[win].team||st.team;
      st.evening=null; st.feed=[]; st.digests={};
      const msg={t:'close', team:st.team};
      if(!same) msg.split=true;
      return [{to:'all', msg:msg}];
    },

    part(id){
      st.over=true;
      return [{to:'all', msg:{t:'bye', reason:'part', by:id||null}}];
    },

    /* Часы приходят СНАРУЖИ, а не берутся из Date.now().

       Иначе срок жизни лобби нельзя было бы проверить, не подкручивая
       системное время, — а вся ценность этой машины в том, что она
       проверяется обычным node за секунду. Настоящие часы подставляет
       worker.js, который и так живёт в мире побочных эффектов. */
    touch(atMs){ st.seen=atMs||0; },
    stale(atMs, ttlMs){ return (atMs-st.seen) >= ttlMs; }
  };
}

module.exports={ createLobby };
