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

if(fails.length){ fails.forEach(f=>console.error('FAIL '+f)); process.exit(1); }
console.log('лобби нумерует и рассылает, ничего не считая');
