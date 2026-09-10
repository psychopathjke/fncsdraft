// Машина состояний лобби: вход, готовность, порядок решений, догон, расхождение.
//
// Сервер — арбитр порядка, а не движок. Здесь проверяется ровно это: он
// нумерует и рассылает, ничего не считая. Ни Chrome, ни сети.
//
//   node server/tools/check-lobby.js
const { createLobby } = require('../src/lobby.js');
const fails=[];
const check=(n,ok,d)=>{ if(!ok) fails.push(n+(d?': '+d:'')); };
const CARD={handle:'a', nat:'ru', age:20, ovr:93, role:'roleIGL', attrs:{}, org:null,
            form:0, tired:0, sick:false, camp:null, gear:[]};

// ---- вход и проверка версии ----------------------------------------------
let L=createLobby({build:'aaaa1111', seed:'team-1', team:{day:'2026-02-02'}});
let o=L.join('A',{build:'aaaa1111', card:CARD});
check('первый вошёл и получил состояние', o.some(x=>x.msg.t==='state'), JSON.stringify(o));
o=L.join('B',{build:'BADBUILD', card:CARD});
check('чужая сборка не пускается', o[0] && o[0].msg.t==='bye' && o[0].msg.reason==='build',
      JSON.stringify(o));
// И отказ несёт обе метки: игрок должен видеть, чья версия чужая.
check('в отказе названы обе версии',
      o[0].msg.have==='aaaa1111' && o[0].msg.got==='BADBUILD', JSON.stringify(o[0].msg));
/* А сидящему в лобби летит 'stale' — устаревшим часто оказывается именно он,
   а раньше он не получал ничего и продолжал держать лобби на старом коде. */
check('и сидящему в лобби сказано, что он устарел',
      o.some(x=>x.to==='peer' && x.msg.t==='stale'), JSON.stringify(o));
/* ---- чужой дивизион не входит вовсе ---------------------------------
   Его слово, 29 августа: «запретить присоединяться, когда 1 и 5 див, чтоб даже
   в лобби не пускало». Раньше это ловил клиент — но уже войдя. */
let Ld=createLobby({build:'aaaa1111', seed:'team-d'});
Ld.join('A',{build:'aaaa1111', card:CARD, div:1, seed:'own-a'});
let od=Ld.join('B',{build:'aaaa1111', card:CARD, div:5, seed:'own-b'});
check('чужой дивизион не пускается', od[0] && od[0].msg.t==='bye' && od[0].msg.reason==='div',
      JSON.stringify(od));
check('и в отказе названы оба дивизиона', od[0].msg.have===1 && od[0].msg.got===5,
      JSON.stringify(od[0].msg));
check('отказанного нет в лобби', Object.keys(Ld.state.cards).length===1,
      JSON.stringify(Object.keys(Ld.state.cards)));
check('свой дивизион входит', Ld.join('B',{build:'aaaa1111', card:CARD, div:1, seed:'own-b'})
      .some(x=>x.msg.t==='state'));
// Свой же — по сиду команды, даже если его сейв отстал на повышение.
let Lo=createLobby({build:'aaaa1111', seed:'team-o'});
Lo.join('A',{build:'aaaa1111', card:CARD, div:2, seed:'own-a'});
check('свой по сиду лобби входит с любым дивизионом',
      Lo.join('B',{build:'aaaa1111', card:CARD, div:3, seed:'team-o'}).some(x=>x.msg.t==='state'));
// Повышение команды двигает дивизион лобби.
Lo.team('A',{division:1});
check('повышение переписывает дивизион лобби', Lo.state.div===1, String(Lo.state.div));

o=L.join('B',{build:'aaaa1111', card:Object.assign({},CARD,{handle:'b'})});
check('второй вошёл', o.some(x=>x.msg.t==='state'));
check('и обоим разослали карточку напарника', o.some(x=>x.to==='all'||x.to==='peer'));

// ---- вечер не начинается, пока не готовы оба ------------------------------
o=L.ready('A','2026-02-02');
check('один готов — старта нет', !o.some(x=>x.msg.t==='start'), JSON.stringify(o));
o=L.ready('B','2026-02-02');
const start=o.find(x=>x.msg.t==='start');
check('оба готовы — старт есть', !!start);
check('и у старта есть сид', start && typeof start.msg.seed==='string' && start.msg.seed.length>0);
check('старт ушёл обоим', start && start.to==='all');

// ---- решения нумеруются и рассылаются в одном порядке ---------------------
const n1=L.act('A','drop',{zone:7})[0].msg.n;
const n2=L.act('B','choice',{i:2})[0].msg.n;
const n3=L.act('A','drop',{zone:9})[0].msg.n;
check('номера растут', n1<n2 && n2<n3, [n1,n2,n3].join(','));
check('каждое решение уходит обоим', L.act('B','choice',{i:1})[0].to==='all');

// ---- догон по номерам после обрыва ---------------------------------------
const tail=L.since('B', n1);
check('догон отдаёт всё после названного номера', tail.length===3, String(tail.length));
check('и в том же порядке', tail.map(e=>e.n).join(',')===[n2,n3,n3+1].join(','),
      tail.map(e=>e.n).join(','));
check('догон с нуля отдаёт весь вечер', L.since('B',0).length===4, String(L.since('B',0).length));

// ---- расхождение: истина — та, что пришла первой --------------------------
o=L.digest('A','hash-AAA',{day:'2026-02-03'});
check('одного хеша мало', !o.some(x=>x.msg.t==='close'), JSON.stringify(o));
o=L.digest('B','hash-BBB',{day:'2026-02-99'});
const close=o.find(x=>x.msg.t==='close');
check('второй хеш закрывает вечер', !!close);
check('истиной стала первая версия', close && close.msg.team.day==='2026-02-03',
      close && JSON.stringify(close.msg.team));
check('и закрытие ушло обоим', close && close.to==='all');
check('расхождение названо', !!o.find(x=>x.msg.t==='close' && x.msg.split===true));

// Совпавшие хеши — тот же close, но без пометки расхождения.
L=createLobby({build:'aaaa1111', seed:'team-2', team:{day:'2026-02-02'}});
L.join('A',{build:'aaaa1111',card:CARD}); L.join('B',{build:'aaaa1111',card:CARD});
L.ready('A','2026-02-02'); L.ready('B','2026-02-02');
L.digest('A','same',{day:'2026-02-03'});
const ok=L.digest('B','same',{day:'2026-02-03'}).find(x=>x.msg.t==='close');
check('совпавшие хеши закрывают вечер без пометки', ok && !ok.msg.split);

// ---- разрыв дуо ------------------------------------------------------------
o=L.part('A');
check('разрыв объявляется обоим', o.some(x=>x.to==='all' && x.msg.t==='bye' && x.msg.reason==='part'),
      JSON.stringify(o));
check('после разрыва вход закрыт',
      L.join('B',{build:'aaaa1111',card:CARD})[0].msg.t==='bye');

// ---- уборка ---------------------------------------------------------------
// Часы приходят снаружи: машина обязана оставаться проверяемой, а Date.now()
// внутри неё сделал бы срок непроверяемым.
const DAY=86400000;
let K=createLobby({build:'aaaa1111', seed:'team-3', team:{}});
K.join('A',{build:'aaaa1111',card:CARD});
K.touch(1000);
check('свежее лобби не протухло', K.stale(1000+29*DAY, 30*DAY)===false);
check('через тридцать дней протухло', K.stale(1000+31*DAY, 30*DAY)===true);
K.touch(1000+31*DAY);
check('касание продлевает жизнь', K.stale(1000+31*DAY+DAY, 30*DAY)===false);

// ---- состояние команды доезжает СРАЗУ ---------------------------------------
// «Выбрал спот — у тимейта не показывается сразу»: клиент слал {t:'team'}, а
// разбирать его было некому, и метки доезжали только к концу вечера.
let T=createLobby({build:'aaaa1111', seed:'team-4', team:{day:'2026-02-02'}});
T.join('A',{build:'aaaa1111',card:CARD}); T.join('B',{build:'aaaa1111',card:CARD});
const sent=T.team('A',{day:'2026-02-02', spots:{m2:[{i:7, aura:0}]}});
check('состояние ушло напарнику', sent.length===1 && sent[0].to==='peer' &&
      sent[0].msg.t==='team', JSON.stringify(sent));
check('и в нём та самая метка',
      sent[0].msg.team.spots.m2[0].i===7, JSON.stringify(sent[0].msg.team));
check('лобби запомнило его у себя', T.state.team.spots.m2[0].i===7,
      JSON.stringify(T.state.team));
check('пустое состояние никуда не рассылается', T.team('A', null).length===0);
// И вошедший позже получает уже новое состояние, а не то, с которым лобби завели.
let C=createLobby({build:'aaaa1111', seed:'team-5', team:{day:'2026-02-02'}});
C.join('A',{build:'aaaa1111',card:CARD});
C.team('A',{day:'2026-03-03'});
const late=C.join('B',{build:'aaaa1111',card:CARD}).find(x=>x.msg.t==='state');
check('вошедший позже получает свежее состояние', late && late.msg.team.day==='2026-03-03',
      late && JSON.stringify(late.msg.team));

// ---- вечер переживает обрыв и перезагрузку ----------------------------------
// Его слово, 29 августа: «нужно добавить 3» — обрыв посреди вечера.
let V=createLobby({build:'aaaa1111', seed:'team-6', team:{day:'2026-02-02'}});
V.join('A',{build:'aaaa1111',card:CARD}); V.join('B',{build:'aaaa1111',card:CARD});
check('до вечера состояние без вечера', V.join('A',{build:'aaaa1111',card:CARD}).find(x=>x.msg.t==='state').msg.evening===null);
V.ready('A','2026-02-02'); const st0=V.ready('B','2026-02-02');
check('старт у обоих', st0[0].msg.t==='start' && st0[0].to==='all');
V.act('A','loot',{v:'take',q:1}); V.act('B','late',{v:'hg',q:1});
// Перезагрузка A: hello заново — состояние несёт вечер и ленту.
const re=V.join('A',{build:'aaaa1111',card:CARD}).find(x=>x.msg.t==='state').msg;
check('вечер в состоянии', re.evening && re.evening.day==='2026-02-02' && re.evening.seed===st0[0].msg.seed, JSON.stringify(re.evening));
check('лента в состоянии', re.feed.length===2 && re.feed[0].by==='A' && re.feed[1].by==='B', JSON.stringify(re.feed));
// Готовность в идущем вечере — тот же старт, только ему.
const again=V.ready('A','2026-02-02');
check('готовность в идущем вечере — старт себе', again.length===1 && again[0].to==='self' && again[0].msg.t==='start' && again[0].msg.resume===true && again[0].msg.seed===st0[0].msg.seed, JSON.stringify(again));
check('и вечер не перезаведён', V.state.evening.n===st0[0].msg.n);
// Закрытие остаётся в состоянии для того, кто его не получил.
V.digest('A','h',{day:'2026-02-02'}); V.digest('B','h',{day:'2026-02-02'});
const after=V.join('B',{build:'aaaa1111',card:CARD}).find(x=>x.msg.t==='state').msg;
check('после закрытия вечера нет, а закрытие есть', after.evening===null && after.closed && after.closed.team.day==='2026-02-02', JSON.stringify(after.closed));
check('лента после закрытия пуста', after.feed.length===0);

// ---- оба нажали «играть» заново в застрявшем вечере — новый вечер ------------
let W=createLobby({build:'aaaa1111', seed:'team-7', team:{day:'2026-02-02'}});
W.join('A',{build:'aaaa1111',card:CARD}); W.join('B',{build:'aaaa1111',card:CARD});
W.ready('A','2026-02-02','cup'); const s1=W.ready('B','2026-02-02','cup')[0].msg;
W.act('A','loot',{v:'take',q:1});
const rA=W.ready('A','2026-02-02','cup');
check('первый повтор — догон себе', rA.length===1 && rA[0].to==='self' && rA[0].msg.resume===true);
const rB=W.ready('B','2026-02-02','cup');
check('второй повтор — свежий старт всем', rB.length===1 && rB[0].to==='all' && rB[0].msg.fresh===true && rB[0].msg.seed!==s1.seed, JSON.stringify(rB));
check('лента застрявшего вечера выброшена', W.state.feed.length===0);
// Готовность на другой день бросает идущий вечер.
W.act('A','loot',{v:'take',q:1});
const rC=W.ready('A','2026-02-03','cup');
check('готовность на другой день — вечер брошен, ждём второго', rC[0].msg.t==='ready' && W.state.evening===null && W.state.feed.length===0, JSON.stringify(rC));

// ---- двое нажали РАЗНЫЕ турниры одного дня — старта нет ---------------------
// Его скрин 29 августа, 11 января: Solo Series против открытого квала Reload.
let X=createLobby({build:'aaaa1111', seed:'team-x', team:{day:'2026-01-11'}});
X.join('A',{build:'aaaa1111',card:CARD}); X.join('B',{build:'aaaa1111',card:CARD});
X.ready('A','2026-01-11','solo');
const xB=X.ready('B','2026-01-11','reload');
check('разные виды — старта нет', !xB.some(x=>x.msg.t==='start'), JSON.stringify(xB));
check('и обоим сказано, кто что нажал', xB.length===1 && xB[0].to==='all' && xB[0].msg.clash &&
      xB[0].msg.clash.A==='solo' && xB[0].msg.clash.B==='reload', JSON.stringify(xB));
check('готовность снята с обоих', Object.keys(X.state.ready).length===0, JSON.stringify(X.state.ready));
// Договорились — нажали одно и то же, вечер пошёл.
const x1=X.ready('A','2026-01-11','solo');
check('после сброса первый снова один', x1[0].msg.t==='ready' && x1[0].msg.ready===1);
const x2=X.ready('B','2026-01-11','solo');
check('один и тот же вид — старт', x2.some(x=>x.msg.t==='start'), JSON.stringify(x2));
/* Вечер идёт — и один нажимает ДРУГОЙ турнир того же дня (его скрин 10.09, 8 января: Solo
   Series против открытого отбора Reload, «разошлись на игре 1»). Догона со старым сидом нет:
   нажавшему — clash с обоими видами, вечер напарника остаётся, правильный вид догоняет. */
const x3=X.ready('B','2026-01-11','reload');
check('другой вид поверх идущего вечера — старта нет', !x3.some(x=>x.msg.t==='start'), JSON.stringify(x3));
check('и нажавшему сказано, кто что играет', x3.length===1 && x3[0].to==='self' && x3[0].msg.clash && x3[0].msg.clash.A==='solo' && x3[0].msg.clash.B==='reload', JSON.stringify(x3));
check('вечер напарника не снят', !!X.state.evening && X.state.evening.kind==='solo', JSON.stringify(X.state.evening));
const x4=X.ready('B','2026-01-11','solo');
check('тот же вид — догон со старым сидом', x4.some(x=>x.msg.t==='start' && x.msg.resume && x.to==='self'), JSON.stringify(x4));
/* Смесь сборок больше НЕ стартует: «без вида — согласен на всё» пропускало
   старую вкладку в вечер с новым календарём (скрины 8-9 страницы «баги»,
   31 августа: соло-квал n4900 против дуо Victory Cup n2450 в один день).
   В clash у старого клиента вид пустой — новый по нему объясняет про версию. */
let Y=createLobby({build:'aaaa1111', seed:'team-y', team:{day:'2026-01-11'}});
Y.join('A',{build:'aaaa1111',card:CARD}); Y.join('B',{build:'aaaa1111',card:CARD});
Y.ready('A','2026-01-11','solo');
const yB=Y.ready('B','2026-01-11');
check('вид только у одного — старта нет', !yB.some(x=>x.msg.t==='start'), JSON.stringify(yB));
check('и в clash у старого пусто', yB.length===1 && yB[0].msg.clash && yB[0].msg.clash.A==='solo' && yB[0].msg.clash.B==='', JSON.stringify(yB));
check('готовность снята с обоих (смесь)', Object.keys(Y.state.ready).length===0, JSON.stringify(Y.state.ready));
// Пара из двух вкладок без вида консистентна между собой — стартует как раньше.
let Z=createLobby({build:'aaaa1111', seed:'team-z', team:{day:'2026-01-11'}});
Z.join('A',{build:'aaaa1111',card:CARD}); Z.join('B',{build:'aaaa1111',card:CARD});
Z.ready('A','2026-01-11');
check('оба без вида — старт как раньше', Z.ready('B','2026-01-11').some(x=>x.msg.t==='start'));

/* ---- ГОНКА: людей больше двух и дивизион не сверяется --------------------
   Его вопрос 4 сентября: «а можно больше игроков сделать одновременно?».
   Командная карьера остаётся парой — локстеп написан на двоих; гонка общего
   счёта не ведёт, поэтому её лобби пускает до шести. Метит комнату первый
   вошедший полем race. */
let R=createLobby({build:'aaaa1111', seed:'race-1'});
check('первый в гонке вошёл',
      R.join('A',{build:'aaaa1111', card:CARD, race:true, div:1}).some(x=>x.msg.t==='state'));
check('комната помечена гонкой', R.state.race===true);
check('второй из ДРУГОГО дивизиона тоже входит',
      R.join('B',{build:'aaaa1111', card:CARD, race:true, div:5}).some(x=>x.msg.t==='state'),
      'дивизион в гонке не сверяется');
check('и третий', R.join('C',{build:'aaaa1111', card:CARD, race:true}).some(x=>x.msg.t==='state'));
['D','E','F'].forEach(id=>R.join(id,{build:'aaaa1111', card:CARD, race:true}));
check('шестеро помещаются', Object.keys(R.state.cards).length===6,
      String(Object.keys(R.state.cards).length));
const seventh=R.join('G',{build:'aaaa1111', card:CARD, race:true});
check('седьмой уже нет', seventh[0] && seventh[0].msg.t==='bye' && seventh[0].msg.reason==='full',
      JSON.stringify(seventh));
// А командное лобби осталось парой.
let T2=createLobby({build:'aaaa1111', seed:'team-2'});
T2.join('A',{build:'aaaa1111', card:CARD});
T2.join('B',{build:'aaaa1111', card:CARD});
const third=T2.join('C',{build:'aaaa1111', card:CARD});
check('в командной карьере третьего не пускают',
      third[0] && third[0].msg.t==='bye' && third[0].msg.reason==='full', JSON.stringify(third));
// И голоса гонки (act) расходятся всем, а не одному.
const votes=R.act ? R.act('A',{kind:'nextday', payload:{by:'A', day:'2026-03-02'}}) : null;
if(votes) check('голос за день уходит всем', votes.some(x=>x.to==='all'), JSON.stringify(votes));

/* ---- КОМНАТА ВЕЧЕРА в гонке: кто ушёл дальше или закрыл день, готовности не должен ----
   Годовая проба на шестерых 8.09: без напарника человек шагает через турнирный день,
   а остальные ждали шестой готовности вечно. */
let R6=createLobby({build:'aaaa1111', seed:'race-6'});
['A','B','C','D'].forEach(id=>R6.join(id,{build:'aaaa1111', card:CARD, race:true}));
R6.act('D','race',{by:'D', day:'2026-02-06'});                 // D уже на завтра
let r=R6.ready('A','2026-02-05','eval');
check('комната без ушедшего вперёд: 1 из 3', r[0].msg.t==='ready' && r[0].msg.of===3, JSON.stringify(r));
R6.ready('B','2026-02-05','eval');
r=R6.ready('C','2026-02-05','eval');
check('трое готовы — старт без D', r.some(x=>x.msg.t==='start'), JSON.stringify(r));
check('комната вечера записана', R6.state.evening && R6.state.evening.room.join()==='A,B,C', JSON.stringify(R6.state.evening));
// Закрытие ждёт хеши только от комнаты.
R6.digest('A','h1',{}); R6.digest('B','h1',{});
r=R6.digest('C','h1',{});
check('закрытие по трём хешам, без D', r.some(x=>x.msg.t==='close' && !x.msg.split), JSON.stringify(r));
// Голос «следующий день» — тоже выход из комнаты, и старт срабатывает по нему.
let R7=createLobby({build:'aaaa1111', seed:'race-7'});
['A','B','C'].forEach(id=>R7.join(id,{build:'aaaa1111', card:CARD, race:true}));
R7.ready('A','2026-02-09','cup'); R7.ready('B','2026-02-09','cup');
r=R7.act('C','nextday',{by:'C', day:'2026-02-09'});
check('C закрыл день голосом — вечер A и B стартует из act', r.some(x=>x.msg.t==='start'), JSON.stringify(r));
// Кто вернулся на день готовностью — снова в комнате.
let R8=createLobby({build:'aaaa1111', seed:'race-8'});
['A','B'].forEach(id=>R8.join(id,{build:'aaaa1111', card:CARD, race:true}));
R8.act('B','race',{by:'B', day:'2026-03-02'});
r=R8.ready('A','2026-03-01','cup');
check('вдвоём, второй ушёл вперёд — вечер одного стартует', r.some(x=>x.msg.t==='start'), JSON.stringify(r));
R8.act('B','race',{by:'B', day:'2026-03-01'});                // вернулся (перезагрузка/догон)
r=R8.ready('B','2026-03-01','cup');
check('вернулся и готов — старт', r.some(x=>x.msg.t==='start'), JSON.stringify(r));
// Команда: как было — двое, act день не трогает.
let T3=createLobby({build:'aaaa1111', seed:'team-3'});
T3.join('A',{build:'aaaa1111', card:CARD}); T3.join('B',{build:'aaaa1111', card:CARD});
T3.act('B','race',{by:'B', day:'2026-03-05'});
r=T3.ready('A','2026-03-01','cup');
check('команда: знаменатель 2 и ждёт второго', r[0].msg.t==='ready' && r[0].msg.of===2, JSON.stringify(r));

// Комната из одного: остальные ушли дальше — вечер стартует для одного.
let R9=createLobby({build:'aaaa1111', seed:'race-9'});
['A','B','C'].forEach(id=>R9.join(id,{build:'aaaa1111', card:CARD, race:true}));
r=R9.ready('A','2026-02-21','final');
check('один готов, двое на том же дне — ждём', !r.some(x=>x.msg.t==='start') && r[0].msg.of===3, JSON.stringify(r));
R9.act('B','race',{by:'B', day:'2026-02-22'});
r=R9.act('C','race',{by:'C', day:'2026-02-22'});
check('оба ушли дальше — старт для одного', r.some(x=>x.msg.t==='start'), JSON.stringify(r));

// День с двумя турнирами: комната — большинство по рангу, меньшинство не считается.
let R10=createLobby({build:'aaaa1111', seed:'race-10'});
['A','B','C'].forEach(id=>R10.join(id,{build:'aaaa1111', card:CARD, race:true}));
R10.act('A','race',{by:'A', day:'2026-06-13', kr:5});   // финал недели
R10.act('B','race',{by:'B', day:'2026-06-13', kr:7});   // Victory Cup
R10.act('C','race',{by:'C', day:'2026-06-13', kr:7});
r=R10.ready('B','2026-06-13','victory');
check('комната по большинству: 1 из 2', r[0].msg.t==='ready' && r[0].msg.of===2, JSON.stringify(r));
r=R10.ready('C','2026-06-13','victory');
check('двое Victory Cup стартуют без финалиста', r.some(x=>x.msg.t==='start'), JSON.stringify(r));
check('комната вечера — B и C', R10.state.evening && R10.state.evening.room.join()==='B,C', JSON.stringify(R10.state.evening));

// Повтор акта после переподключения не копится: тот же id, вид и номер вопроса.
let R11=createLobby({build:'aaaa1111', seed:'race-11'});
['A','B'].forEach(id=>R11.join(id,{build:'aaaa1111', card:CARD, race:true}));
r=R11.act('A','drop:a@',{by:'A', q:3, g:2});
check('первый приход уходит всем', r.some(x=>x.msg.t==='act'), JSON.stringify(r));
r=R11.act('A','drop:a@',{by:'A', q:3, g:2});
check('точный повтор выброшен', r.length===0, JSON.stringify(r));
r=R11.act('A','drop:a@',{by:'A', q:4, g:2});
check('следующий номер — новый акт', r.some(x=>x.msg.t==='act'), JSON.stringify(r));
r=R11.act('A','race',{by:'A', day:'2026-03-01'}); r=R11.act('A','race',{by:'A', day:'2026-03-01'});
check('строка без номера повторяется как была', r.some(x=>x.msg.t==='act'), JSON.stringify(r));

if(fails.length){ fails.forEach(f=>console.error('FAIL '+f)); process.exit(1); }
// Итог вечера (res) — раздаётся всем и в ленту не кладётся: он про чужие доски, не про вечер.
let RS=createLobby({build:'aaaa1111', seed:'race-res'});
['A','B'].forEach(id=>RS.join(id,{build:'aaaa1111', card:CARD, race:true}));
const rs=RS.act('A','res',{by:'A', key:'2026-03-01|cup', money:{x:100}});
check('итог вечера раздан всем', rs.length===1 && rs[0].to==='all' && rs[0].msg.kind==='res', JSON.stringify(rs));
check('итог вечера не в ленте', (RS.state.feed||[]).every(e=>e.kind!=='res'), String((RS.state.feed||[]).length));

console.log('лобби нумерует и рассылает, ничего не считая');
