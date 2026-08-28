// Спрашивают ОДНОГО, и решает роль.
//
// Его правка 28 августа, последняя: «сделай ток игл выбор, чтоб только он
// кликал а тимейт смотрел, иглу на первые два, а фрагер пусть в лейте
// выбирает — игл 2 первых стадии выбирает, фрг последнюю». Высадка и лут —
// игл, восьмая зона — фраггер.
//
// Стеречь надо не «игл главный», а СХОДИМОСТЬ: правило крутится на двух
// клиентах по отдельности, и если оба сочтут вопрос своим, решений станет
// два; если ни один — вечер встанет навсегда. Поэтому каждый случай
// проигрывается с ОБЕИХ сторон, и сумма ответов обязана быть ровно единицей.
//
// Плюс «пропустить»: его слово тем же вечером — «скип тоже работает, если
// вдвоем проголосуют». Пропуск это темп показа, а темп в командном вечере
// обязан быть общим.
//
//   node tools/check-mp-relay.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null, page:[]};
  window.addEventListener('error', function(e){ out.page.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const seed=(team)=>{
    const cr={season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world'};
    if(team) cr.mp={code:'ABC123', role:'a'};
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Relay', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
        attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:cr, partners:[]}));
    careerLoad();
    /* Каждый блок начинается с чистого листа: признак «напарник досчитал»
       и красная строка расхождения живут до конца вечера, а блоков здесь
       много и вечер у каждого свой. */
    if(typeof ccMpWaitReset==='function') ccMpWaitReset();
    if(typeof ccMpQnReset==='function') ccMpQnReset();
    CC_MP_SPLIT_AT=null;
    const old=document.querySelector('.cc-mp-split'); if(old) old.remove();
    const slow=document.getElementById('ccMpSlow'); if(slow) slow.remove();
  };
  // Одинаковое место в потоке у обеих сторон: в жизни это делает сид вечера.
  const atSameRoll=(fn)=>{ const was=Math.random;
    Math.random=careerRng(12345);
    try{ return fn(); } finally{ Math.random=was; } };

  try{
    // ---- одиночная карьера голосования не знает --------------------------
    seed(false);
    const solo=await ccMpChoose('drop', ()=>42);
    check('в одиночной карьере решение своё', solo.v===42 && solo.mine===true,
          JSON.stringify(solo));

    /* ---- кто решает: игл первые два, фраггер последний -------------------
       Каждая пара проигрывается с обеих сторон: сумма «моё» обязана быть
       единицей на каждом вопросе, иначе решат двое или никто. */
    const seat=(nick, role, mate, mateRole, lobbyRole)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:nick, age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:'EU', ovr:90, role:role,
          attrs:ccRookieAttrs(90, role), ageEdge:0, photo:null,
          handle:null, cardRegion:null, nat:null},
        career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
                reach:0, tokens:[], log:[], news:[], seed:'fixed-world',
                mp:{code:'ABC123', role:lobbyRole||'a'}},
        partners:[]}));
      careerLoad();
      MP.peer = mate===null ? null
        : {handle:mate, nat:'ru', region:'EU', rating:90, _targetOvr:90,
           _attrs:null, _roleKey:mateRole};
      return {drop:ccMpMine('drop'), loot:ccMpMine('loot'), late:ccMpMine('late')};
    };
    const igl=seat('alpha', 'roleIGL', 'bravo', 'roleFRG', 'a');
    const frg=seat('bravo', 'roleFRG', 'alpha', 'roleIGL', 'b');
    out.notes.игл=igl; out.notes.фраггер=frg;
    check('высадку решает игл', igl.drop===true && frg.drop===false, JSON.stringify([igl.drop, frg.drop]));
    check('лут решает игл', igl.loot===true && frg.loot===false, JSON.stringify([igl.loot, frg.loot]));
    check('восьмую зону решает фраггер', igl.late===false && frg.late===true,
          JSON.stringify([igl.late, frg.late]));
    ['drop','loot','late'].forEach(k=>
      check('на «'+k+'» решает ровно один', (igl[k]?1:0)+(frg[k]?1:0)===1));

    /* Ничьей не остаётся и в кривом составе: два игла, два фраггера, полные
       тёзки. Играть им нельзя (ccMpRolesWhy), но повиснуть вечер не должен. */
    [['два игла','roleIGL','roleIGL'], ['два фраггера','roleFRG','roleFRG'],
     ['тёзки','roleIGL','roleIGL']].forEach(([name, ra, rb], i)=>{
      const na=i===2 ? 'same' : 'alpha', nb=i===2 ? 'same' : 'zulu';
      const A=seat(na, ra, nb, rb, 'a'), B=seat(nb, rb, na, ra, 'b');
      out.notes[name]=JSON.stringify([A.late, B.late]);
      ['drop','loot','late'].forEach(k=>
        check(name+': на «'+k+'» решает ровно один', (A[k]?1:0)+(B[k]?1:0)===1,
              JSON.stringify([A[k], B[k]])));
    });

    // Напарника не видно — решает владелец лобби, иначе вопрос повиснет.
    check('без напарника решает владелец',
          seat('alpha','roleIGL',null,null,'a').late===true &&
          seat('alpha','roleIGL',null,null,'b').late===false);

    // ---- решение, приехавшее РАНЬШЕ вопроса ------------------------------
    /* Настоящая гонка: он нажал «пропустить», прошёл игру за кадр и ответил,
       пока этот клиент ещё досматривал. Без очереди в mp.js такой голос
       потерялся бы и вечер встал бы навсегда. */
    seed(true);
    MP.send=function(){};
    // Этот клиент — фраггер, значит лут не его вопрос: он ждёт ответа.
    CAREER.player.role='roleFRG';
    CAREER.player.attrs=ccRookieAttrs(90,'roleFRG');
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90,
             _attrs:null, _roleKey:'roleIGL'};
    MP.say({t:'act', kind:'loot', by:'peer', n:1, payload:{v:'swap', by:'peer'}});
    const early=await Promise.race([
      ccMpChoose('loot', ()=>'НЕ ДОЛЖНО СПРАШИВАТЬ'),
      new Promise(r=>setTimeout(()=>r({v:'ЗАВИС'}), 400))]);
    check('ответ, приехавший раньше вопроса, не потерян', early.v==='swap',
          JSON.stringify(early));
    check('и у смотрящего своего вопроса не было', early.mine===false,
          JSON.stringify(early));

    /* ---- приход и ответ спариваются С ТЕМ САМЫМ вопросом -----------------
       Раньше спаривали по очереди: кто первый пришёл, того и ответ. Пока оба
       идут шаг в шаг — работает; стоит одному съесть чужое сообщение раньше
       времени, и счёт разъезжается навсегда, каждый ждёт уже съеденного. Его
       отчёт: «после 5 игры все зависло, у двоих сразу… пишет у двоих ждем
       напарника» — оба стояли на барьере. */
    seed(true);
    ccMpQnReset();
    CAREER.player.role='roleIGL';
    CAREER.player.attrs=ccRookieAttrs(90,'roleIGL');
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90,
             _attrs:null, _roleKey:'roleFRG'};
    MP.send=function(){};
    // Ответ на ЧУЖОЙ вопрос (номер 9) не должен закрывать первый.
    MP.say({t:'act', kind:'late', by:'peer', n:40, payload:{v:'hg', by:'peer', q:9}});
    let done1=false;
    const w=ccMpChoose('late', ()=>'НЕ СПРАШИВАТЬ').then(r=>{ done1=true; return r; });
    MP.say({t:'act', kind:'late@', by:'peer', n:41, payload:{by:'peer', q:1}});
    await new Promise(r=>setTimeout(r, 120));
    check('ответ на чужой вопрос не закрывает этот', done1===false);
    // А свой — закрывает.
    MP.say({t:'act', kind:'late', by:'peer', n:42, payload:{v:'refresh', by:'peer', q:1}});
    const got1=await w;
    check('ответ со своим номером принят', got1.v==='refresh', JSON.stringify(got1));
    // И устаревшее из очереди выброшено, а не досталось следующему вопросу.
    check('старое из очереди выброшено', !(MP.peek && MP.peek('late', 2)),
          JSON.stringify(MP.peek && MP.peek('late', 2)));

    /* ---- напарник досчитал вечер — ждать его больше нечего ---------------
       Его отчёт: «у одного появилась таблица, у другого не успела прогрузиться
       симуляция, ждём напарника бесконечно просто». Досчитавший больше ничего
       не присылает — вопросов у него не осталось, — а второй ждал от него
       прихода на следующем вопросе. Сервер про это говорит: первому хешу
       отвечает 'digest' второму. */
    seed(true);
    ccMpQnReset(); ccMpWaitReset(); ccMpThirdWire();
    CAREER.player.role='roleIGL';
    CAREER.player.attrs=ccRookieAttrs(90,'roleIGL');
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90,
             _attrs:null, _roleKey:'roleFRG'};
    MP.send=function(){};
    let asked3=false;
    const stuck=ccMpChoose('late', function(){ asked3=true; return 'hg'; });
    await new Promise(r=>setTimeout(r, 80));
    check('пока он играет — ждём и не спрашиваем', asked3===false);
    // Он прислал хеш: вечер у него кончился.
    MP.say({t:'digest', by:'peer'});
    const freed=await Promise.race([stuck,
      new Promise(r=>setTimeout(()=>r({v:'ЗАВИС'}), 800))]);
    check('ожидание разбужено, а не висит', freed.v!=='ЗАВИС', JSON.stringify(freed));
    check('и решение принято своё', freed.v==='hg' && freed.mine===true,
          JSON.stringify(freed));
    check('расхождение при этом помечено', !!document.querySelector('.cc-mp-split'));
    /* Но его ГОЛОС ИЗ ОЧЕРЕДИ важнее флага «досчитал». Его фото, 28 августа
       (страница «neeww»): вечер сошёлся до очка, а надпись «разошлись на
       игре ?» стоит — быстрый напарник досчитал, все его ответы лежали в
       очереди, а этот клиент сперва смотрел на флаг. */
    CC_MP_SPLIT_AT=null; document.querySelectorAll('.cc-mp-split').forEach(e=>e.remove());
    const qn2=ccMpQn('late');       // номер следующего вопроса о высоте
    MP.say({t:'act', kind:'late', by:'peer', n:60, payload:{v:'refresh', by:'peer', q:qn2}});
    CC_MP_QN.late=qn2-1;            // вернуть счётчик: ccMpChoose возьмёт тот же номер
    let asked4=false;
    const queued=await ccMpChoose('late', function(){ asked4=true; return 'hg'; });
    check('после конца — ответ из очереди берётся, а не свой', queued.v==='refresh' && queued.mine===false && !asked4,
          JSON.stringify(queued)+' спросили: '+asked4);
    check('и расхождение НЕ помечено', !document.querySelector('.cc-mp-split') && CC_MP_SPLIT_AT==null);
    // Следующий вопрос уже не ждёт вовсе.
    const t0=Date.now();
    const quick=await ccMpChoose('drop', ()=>({id:'home'}));
    out.notes.послеКонца=(Date.now()-t0)+'мс';
    check('следующий вопрос не ждёт', quick.v.id==='home');

    /* ---- вопрос открывается у двоих одновременно ------------------------
       Его отчёт, 28 августа: «у кого-то быстрее симуляция идёт или
       по-разному, пусть одновременно выбор делается». Кадры у двоих идут
       своим темпом, и вопрос открывался тогда, когда до него доезжала СВОЯ
       анимация. Голосование само по себе барьер, но он стоял ПОСЛЕ вопроса.
       Теперь барьер стоит и перед ним. */
    seed(true);
    const outbox=[];
    MP.send=function(m){ outbox.push(m); };
    let opened=false;
    const voting=ccMpChoose('drop', function(){ opened=true; return {id:'home'}; },
                             null, '1|хеш');
    await new Promise(r=>setTimeout(r, 120));
    check('о приходе сказано напарнику',
          outbox.some(m=>m.t==='act' && m.kind==='drop@'), JSON.stringify(outbox));
    check('и вопрос ПОКА НЕ открыт: второй ещё не дошёл', opened===false);
    /* Текст со СЧЁТОМ СЕКУНД: ожидание должно быть видно, иначе оно
       неотличимо от зависания. Поэтому сравнение по вхождению, а не целиком. */
    check('а на экране сказано, чего ждём',
          ((document.querySelector('.cc-mp-wait')||{}).textContent||'').indexOf(L().ccMpWaitAt)===0,
          (document.querySelector('.cc-mp-wait')||{}).textContent);
    check('и ожидание считает секунды — оно живое',
          /[0-9]+ с$/.test((document.querySelector('.cc-mp-wait')||{}).textContent||''),
          (document.querySelector('.cc-mp-wait')||{}).textContent);
    /* Сверка на барьере: к «я дошёл» приложен хеш таблицы. Разошлись —
       красная строка с номером игры, и она не пропадает. */
    const arrival=outbox.filter(m=>m.kind==='drop@')[0];
    check('к приходу приложен хеш таблицы',
          !!(arrival && arrival.payload && arrival.payload.sum!==undefined),
          JSON.stringify(arrival && arrival.payload));
    // Напарник дошёл, и у него ТА ЖЕ таблица.
    MP.say({t:'act', kind:'drop@', by:'peer', n:20,
            payload:{by:'peer', sum:(arrival&&arrival.payload&&arrival.payload.sum)}});
    check('одинаковые таблицы молчат', !document.querySelector('.cc-mp-split'));
    await new Promise(r=>setTimeout(r, 60));
    check('дошли оба — вопрос открылся', opened===true);
    // И дальше всё как было: вечер ждёт двух голосов.
    MP.say({t:'act', kind:'drop', by:'peer', n:21, payload:{v:{id:'home'}, by:'peer'}});
    const both=await voting;
    check('решение состоялось', both && both.v && both.v.id==='home', JSON.stringify(both));
    /* Окно ожидания сменилось на «напарник выбрал» и уйдёт само — держать
       вечер ему нельзя, а сказать надо. */
    await new Promise(r=>setTimeout(r, 1800));
    check('и окно в итоге убрано', !document.querySelector('.cc-mp-wait'),
          (document.querySelector('.cc-mp-wait')||{}).textContent);

    /* А теперь чужая таблица не сходится — и это обязано быть НАЗВАНО, с
       номером игры. Сервер сверяет хеши только в конце вечера, а «в конце»
       бесполезно: к тому времени разошлось всё. */
    seed(true);
    /* Очередь чистится руками: от прошлых блоков в ней остались чужие
       ответы, а ccMpSync с уже приехавшим ответом барьер пропускает — то
       есть и сверку тоже. */
    while(MP.take && MP.take('drop')){}
    while(MP.take && MP.take('drop@')){}
    CC_MP_SPLIT_AT=null;
    const gone=document.querySelector('.cc-mp-split'); if(gone) gone.remove();
    MP.send=function(){};
    const p2=ccMpChoose('drop', ()=>({id:'home'}), null, '7|хеш-мой');
    await new Promise(r=>setTimeout(r, 60));
    MP.say({t:'act', kind:'drop@', by:'peer', n:30, payload:{by:'peer', sum:'7|хеш-чужой'}});
    await new Promise(r=>setTimeout(r, 60));
    const said=(document.querySelector('.cc-mp-split')||{}).textContent||'';
    out.notes.расхождение=said;
    check('расхождение названо', said.indexOf('7')>=0, said||'молчит');
    check('и запомнено', CC_MP_SPLIT_AT==='7', String(CC_MP_SPLIT_AT));
    MP.say({t:'act', kind:'drop', by:'peer', n:31, payload:{v:{id:'home'}, by:'peer'}});
    // Ждать бесконечно нельзя: сторож не должен виснуть вместе с игрой.
    await Promise.race([p2, new Promise(r=>setTimeout(r, 600))]);

    /* А если голос напарника уже приехал, барьера нет вовсе: он тут давно.
       Без этого исключения быстрый ждал бы медленного дважды. */
    seed(true);
    const box2=[];
    MP.send=function(m){ box2.push(m); };
    MP.say({t:'act', kind:'loot', by:'peer', n:22, payload:{v:'take', by:'peer'}});
    let asked=false;
    const fast=await Promise.race([
      ccMpChoose('loot', function(){ asked=true; return 'take'; }),
      new Promise(r=>setTimeout(()=>r({v:'ЗАВИС'}), 500))]);
    check('с уже приехавшим ответом барьер пропускается',
          asked===true && fast.v==='take', JSON.stringify(fast));
    /* И ГЛАВНОЕ: приход всё равно объявлен. Здесь была взаимная блокировка —
       клиент проходил барьер молча, а напарник ждал именно его прихода: один
       ждёт ответа, второй прихода, и оба стоят навсегда. */
    check('и приход всё равно объявлен напарнику',
          box2.some(m=>m.t==='act' && m.kind==='loot@'),
          JSON.stringify(box2.map(m=>m.kind)));

    /* ---- смотрящему видно, что выбрал напарник ---------------------------
       Его правка, 28 августа: «еще при выборе нужно показывать игроку, что его
       тимейт выбрал». Сейчас смотрящий не выбирает вовсе, поэтому показать
       надо не «пока ты думаешь», а «вот что решили»: сперва окно ожидания,
       потом на секунду-другую сам ответ, названный человеческим словом.

       И это окно не должно ДЕРЖАТЬ вечер: у того, кто ничего не решает, на
       каждый вопрос набегала бы лишняя секунда. Поэтому оно закрывается само,
       а игра идёт дальше сразу. */
    seed(true);
    // Этот клиент — игл, значит восьмая зона не его вопрос.
    CAREER.player.role='roleIGL';
    CAREER.player.attrs=ccRookieAttrs(90,'roleIGL');
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90,
             _attrs:null, _roleKey:'roleFRG'};
    MP.send=function(){};
    let asked2=false;
    const watching=ccMpChoose('late', function(){ asked2=true; return 'нет'; },
                              function(v){ return v==='hg' ? 'высота' : 'рефреш'; });
    await new Promise(r=>setTimeout(r, 80));
    out.notes.ждём=(document.querySelector('.cc-mp-wait')||{}).textContent||'';
    check('смотрящего ни о чём не спрашивают', asked2===false);
    check('и ему сказано, что ждём',
          out.notes.ждём.indexOf(L().ccMpWaitAt)===0 ||
          out.notes.ждём.indexOf(L().ccMpWaitPick)===0, out.notes.ждём);
    // Хозяин вопроса ответил.
    MP.say({t:'act', kind:'late', by:'peer', n:9, payload:{v:'hg', by:'peer'}});
    const seen=await watching;
    check('ответ доехал и он не свой', seen.v==='hg' && seen.mine===false,
          JSON.stringify(seen));
    out.notes.чужойВыбор=(document.querySelector('.cc-mp-wait')||{}).textContent||'';
    check('и на экране названо, ЧТО он выбрал',
          out.notes.чужойВыбор.indexOf('высота')>=0, out.notes.чужойВыбор);
    // Само окно вечер не держит: игра пошла дальше, окно уходит само.
    await new Promise(r=>setTimeout(r, 1800));
    check('и окно ушло само', !document.querySelector('.cc-mp-wait'),
          (document.querySelector('.cc-mp-wait')||{}).textContent);

    /* ---- «пропустить»: два голоса, и оба по ленте сервера ---------------
       Его слово: «нужно тоже чтоб два нажали и одновременно скипалось у них».
       Отсюда главное здесь свойство: СВОЙ клик сам по себе не включает
       ничего и даже счётчик не двигает. Считался бы он на месте — нажавший
       вторым уходил бы в пропуск сразу, а первый только через круг по сети,
       то есть ровно та рассинхронизация картинки, из-за которой всё и
       затевалось. Оба голоса приезжают одним и тем же путём. */
    seed(true);
    ccMpThirdWire();
    ccMpSkipReset();
    skipAnimation=false;
    const sent=[];
    MP.send=function(m){ sent.push(m); };
    ccMpSkipAsk();
    check('своё нажатие ушло голосом',
          sent.some(m=>m.t==='act' && m.kind==='skip'), JSON.stringify(sent));
    check('но само по себе ничего не включило и счёт не двинуло',
          skipAnimation===false && ccMpSkipN()===0, skipAnimation+' / '+ccMpSkipN());
    check('и дважды один голос не уходит',
          (ccMpSkipAsk(), sent.filter(m=>m.kind==='skip').length===1),
          String(sent.filter(m=>m.kind==='skip').length));

    // Своё эхо от сервера — это первый голос.
    MP.say({t:'act', kind:'skip', by:'me', n:2, payload:{by:ccMpId()}});
    check('своё эхо от сервера — первый голос',
          skipAnimation===false && ccMpSkipN()===1, skipAnimation+' / '+ccMpSkipN());
    check('и одного голоса мало', skipAnimation===false, String(skipAnimation));
    // Чужой — второй, и вот теперь пропуск.
    MP.say({t:'act', kind:'skip', by:'peer', n:3, payload:{by:'peer'}});
    check('на два голоса пропуск включается',
          skipAnimation===true && ccMpSkipN()===2, skipAnimation+' / '+ccMpSkipN());
    out.notes.скип=ccMpSkipTag();

    /* И с другой стороны: сначала нажал напарник. Порядок не должен решать
       ничего, кроме того, кто чей голос увидел первым. */
    seed(true); ccMpThirdWire(); ccMpSkipReset(); skipAnimation=false;
    MP.say({t:'act', kind:'skip', by:'peer', n:4, payload:{by:'peer'}});
    check('чужой голос первым — тоже мало', skipAnimation===false && ccMpSkipN()===1,
          skipAnimation+' / '+ccMpSkipN());
    MP.say({t:'act', kind:'skip', by:'me', n:5, payload:{by:ccMpId()}});
    check('а вторым своим — включается', skipAnimation===true, String(skipAnimation));

    // Новый вечер — голоса заново, иначе прошлый пропуск тянулся бы дальше.
    ccMpSeedOn('team-новый|2026-02-09');
    check('новый вечер обнуляет голоса пропуска', ccMpSkipN()===0, String(ccMpSkipN()));
    ccMpSeedOff();

    // ---- одиночная карьера подписи на кнопке не получает ------------------
    seed(false);
    check('в одиночной карьере на кнопке пропуска ничего не приписано',
          ccMpSkipTag()==='', JSON.stringify(ccMpSkipTag()));

    // ---- коробка по-прежнему называется местом в сетке --------------------
    const z=ALL_LANDING_ZONES && ALL_LANDING_ZONES[3];
    check('коробка находится по своему месту в сетке',
          !!z && ALL_LANDING_ZONES.indexOf(z)===3);
    check('у зоны по-прежнему нет собственного номера', z && z.n===undefined, String(z && z.n));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mprelay-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('спрашивают одного — и обе стороны сходятся, кого именно');
fs.rmSync(dir, { recursive: true, force: true });
