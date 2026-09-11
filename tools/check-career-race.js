// Гонка карьер: вдвоём, но каждый своей.
//
// Главное, что здесь проверяется, — что гонка НЕ включает командную карьеру:
// она живёт в cr.race, а весь локстеп висит на cr.mp. Плюс сводка, порядок
// «кто впереди», плитка и приём чужой сводки по каналу лобби.
//
//   node tools/check-career-race.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    const fresh = () => { CAREER = {player:{nick:'Racer', ovr:82, ovrExact:82.4, region:'EU',
      role:'roleIGL', country:'de', age:19, attrs:ccRookieAttrs(82,'roleIGL')},
      career:{season:1, day:'2026-03-02', division:3, balance:0, earnings:4200, reach:0,
              energy:CC_ENERGY_DAY, did:{}, log:[
                {season:1, day:'2026-02-10', div:3, place:4, of:150, pts:500, ovr:81,
                 games:11, wins:2, elims:30, avg:12.1, kind:'cup', prize:0}],
              news:[], ewc:[]},
      partners:[], gear:{own:[], train:0}, sponsor:null, org:null, coach:null}; };
    careerRenderHub = function(){};
    careerSave = function(){};

    // ---- гонка не включает командную карьеру -------------------------------
    fresh();
    check('a fresh career is neither', ccRaceOn() === false && ccMpTeam() === false);
    CAREER.career.race = {code:'ABC123', role:'a', since:'2026-03-02'};
    check('a race is on', ccRaceOn() === true);
    check('and the team career stays OFF', ccMpTeam() === false && ccMpOn() === false,
          'ccMpTeam=' + ccMpTeam() + ' ccMpOn=' + ccMpOn());
    // Ни один локстепный запрет не должен срабатывать в гонке.
    out.notes.gate = {why: ccMpWhy(), live: ccMpLive(), canCup: careerCanPlayKind('cup')};
    check('no lockstep gate blocks a race evening',
          !ccMpWhy() && ccMpLive() === true, JSON.stringify(out.notes.gate));
    check('the race lives in its own field', !!CAREER.career.race && !CAREER.career.mp);

    // ---- сводка -------------------------------------------------------------
    const card = careerRaceCard();
    out.notes.card = card;
    check('the summary names the career', card && card.nick === 'Racer' && card.div === 3);
    check('it carries what the race is judged on',
          card && card.ovr === 82 && card.money === 4200 && card.events === 1 && card.wins === 2,
          JSON.stringify(card));
    check('and the best finish so far', card && card.best === 4);

    // ---- кто впереди --------------------------------------------------------
    const A = {nick:'A', div:1, pr:20000, money:1000, ovr:90};
    const B = {nick:'B', div:2, pr:99000, money:900000, ovr:99};
    check('the division comes first', careerRaceScore(A) > careerRaceScore(B));
    const C = {nick:'C', div:1, pr:21000, money:0, ovr:80};
    check('then PR', careerRaceScore(C) > careerRaceScore(A));
    const D = {nick:'D', div:1, pr:20000, money:50000, ovr:80};
    check('then money', careerRaceScore(D) > careerRaceScore(A));
    check('nobody ties', careerRaceScore({nick:'x', div:1, pr:1, money:1, ovr:90}) !==
                          careerRaceScore({nick:'y', div:1, pr:1, money:1, ovr:89}));

    // ---- чужая сводка и таблица --------------------------------------------
    CC_RACE_PEERS = {};
    let rows = careerRaceRows();
    check('alone the table is one row', rows.length === 1 && rows[0].you === true);
    CC_RACE_PEERS['peer1'] = {nick:'Rival', div:1, pr:33000, money:120000, ovr:95, season:1};
    rows = careerRaceRows();
    out.notes.rows = rows.map(r => r.nick + (r.you ? '*' : ''));
    check('a peer joins the table', rows.length === 2, JSON.stringify(out.notes.rows));
    check('and a better career stands above', rows[0].nick === 'Rival' && rows[0].you === false);

    /* ---- ПУСТОЙ ДЕНЬ НЕ ЛОМАЕТ ХАБ ----------------------------------------
       Его скрин 11 сентября: вкладка КАРЬЕРА красным, «Cannot read properties of
       undefined (reading 'type')». Плитка гонки спрашивает причину «врозь» каждую
       перерисовку, в том числе в день без турнира, — и вопрос обязан пережить
       пустой вечер. Комната из одного соперника нужна, чтобы вопрос дошёл до
       разбора вечера: без неё он отвечает 'off' первой же строкой. */
    { const keep=CC_RACE_PEERS;
      CC_RACE_PEERS={p1:{id:'p1', card:{handle:'Rival', region:'EU', nat:'fr'}, mates:[],
        div:CAREER.career.division, day:careerToday(), pow:100, msh:''}};
      out.notes.apart=[null, undefined, {}, {type:'free'}, {type:'major'}, {type:'cup'}].map(function(nx){
        try{ return String(ccRaceApartWhy(nx))+'/'+String(ccRaceShared(nx)); }
        catch(e){ return 'ERR '+String(e && e.message || e); }
      });
      check('пустой вечер не ломает вопрос про врозь',
            out.notes.apart.every(function(x){ return x.indexOf('ERR')<0; }),
            JSON.stringify(out.notes.apart));
      CC_RACE_PEERS=keep; }

    // ---- плитка -------------------------------------------------------------
    const tile = careerRaceTileHTML();
    check('the tile shows the code', tile.indexOf('ABC123') >= 0);
    check('the tile lists both careers', tile.indexOf('Rival') >= 0 && tile.indexOf('Racer') >= 0);
    check('and says who is ahead', tile.indexOf(String(L().ccRaceBehind('Rival'))) >= 0);
    CC_RACE_PEERS = {};
    check('alone it asks for the code to be shared',
          careerRaceTileHTML().indexOf(String(L().ccRaceAlone)) >= 0);
    CAREER.career.race = null;
    check('no race, no tile', careerRaceTileHTML() === '');

    // ---- канал: приходящая сводка попадает в таблицу ------------------------
    fresh();
    CAREER.career.race = {code:'ZZ9', role:'b', since:'2026-03-02'};
    CC_RACE_PEERS = {}; CC_RACE_WIRED = false;
    // Подменяем MP на заглушку: гонка обязана работать через обычный act.
    const sent = [];
    const handlers = {};
    MP = {state:'live', on:function(t, fn){ (handlers[t]=handlers[t]||[]).push(fn); },
          act:function(kind, payload){ sent.push({kind:kind, payload:payload}); },
          drop:function(){}, peer:null};
    careerRaceWire();
    check('sending works over the plain act channel', careerRaceSend() === true &&
          sent.length === 1 && sent[0].kind === 'race', JSON.stringify(sent[0] || null));
    (handlers.act || []).forEach(fn => fn({kind:'race', by:'other',
      payload:{nick:'Peer', div:2, pr:9000, money:100, ovr:70}}));
    check('an incoming summary lands in the table',
          careerRaceRows().some(r => r.nick === 'Peer'), JSON.stringify(careerRaceRows().map(r=>r.nick)));
    (handlers.act || []).forEach(fn => fn({kind:'other', by:'other', payload:{nick:'Nope'}}));
    check('and other traffic is ignored', !careerRaceRows().some(r => r.nick === 'Nope'));

    /* ---- ОБЩИЙ КАЛЕНДАРЬ ---------------------------------------------------
       Его решение 4 сентября: «надо одновременно, как в дуо карьере». Вечера
       у каждого свои, а день закрывается вдвоём: шаг превращается в голос,
       шагают оба от второго голоса. Отстающий проходит насквозь, а если
       соперник ушёл — есть дверь наружу. См. ccRaceHold. */
    fresh();
    CAREER.career.race = {code:'DAY1', role:'a', since:'2026-03-02'};
    CC_RACE_PEERS = {}; CC_RACE_NEXT = {day:null, mine:false, theirs:false};
    CC_RACE_ALONE = null;
    sent.length = 0;
    const day0 = careerToday();
    // Соперник стоит на том же дне — значит ждём его.
    CC_RACE_PEERS['rival'] = {nick:'Rival', div:3, ovr:80, day:day0};
    check('день держится, пока соперник не закрыл свой', ccRaceHold(ccAddDays(day0, 1)) === true);
    careerAdvanceTo(ccAddDays(day0, 1));
    check('и шаг не прошёл, а стал голосом', careerToday() === day0 &&
          sent.some(s => s.kind === 'nextday'), careerToday() + ' / ' + JSON.stringify(sent));
    check('кнопка показывает счёт голосов', ccMpNextTag().trim() === '1/2', ccMpNextTag());
    check('и плитка говорит, чего ждём',
          careerRaceTileHTML().indexOf(String(L().ccRaceWait)) >= 0);
    // Голос соперника — и день идёт у обоих.
    ccRaceNextSaw({by:'rival', day:day0});
    check('второй голос двигает день', careerToday() === ccAddDays(day0, 1),
          careerToday());

    // Отстающий не ждёт никого.
    fresh();
    CAREER.career.race = {code:'DAY2', role:'b', since:'2026-03-02'};
    CC_RACE_NEXT = {day:null, mine:false, theirs:false}; CC_RACE_ALONE = null;
    CC_RACE_PEERS = {rival:{nick:'Rival', div:1, ovr:95, day:'2026-04-01'}};
    const behind = careerToday();
    check('отстающий идёт свободно', ccRaceHold(ccAddDays(behind, 1)) === false);
    careerAdvanceTo(ccAddDays(behind, 1));
    check('и его день шагает', careerToday() === ccAddDays(behind, 1));
    // Голос за день, до которого я ещё не дошёл, ждёт меня там (проба 9.09: год не закрывался).
    const ahead = ccAddDays(behind, 2);
    ccRaceNextSaw({by:'rival', day:ahead});
    check('голос вперёд не считается сегодня', ccRaceVotes() === 0, String(ccRaceVotes()));
    CC_RACE_PEERS = {rival:{nick:'Rival', div:1, ovr:95, day:ahead}};
    careerAdvanceTo(ahead);
    check('пришёл на тот день — голос уже в счёте', careerToday() === ahead && ccRaceVotes() === 1,
          careerToday() + ' / ' + ccRaceVotes());
    careerAdvanceTo(ccAddDays(ahead, 1));
    check('и мой голос закрывает день сразу', careerToday() === ccAddDays(ahead, 1), careerToday());

    // Соперник пропал — ждать некого.
    fresh();
    CAREER.career.race = {code:'DAY3', role:'a', since:'2026-03-02'};
    CC_RACE_PEERS = {}; CC_RACE_NEXT = {day:null, mine:false, theirs:false}; CC_RACE_ALONE = null;
    check('без сводки соперника гейта нет', ccRaceHold(ccAddDays(careerToday(), 1)) === false);
    // И дверь наружу, когда он есть, но молчит.
    const day3 = careerToday();
    CC_RACE_PEERS['rival'] = {nick:'Rival', div:3, ovr:80, day:day3};
    careerAdvanceTo(ccAddDays(day3, 1));
    check('снова ждём', careerToday() === day3);
    ccRaceGoAlone();
    check('«идти дальше одному» открывает день', careerToday() === ccAddDays(day3, 1),
          careerToday());

    // ---- выход --------------------------------------------------------------
    fresh();
    CAREER.career.race = {code:'ZZ9', role:'b', since:'2026-03-02'};
    careerRaceLeave();
    check('leaving clears the race', ccRaceOn() === false &&
          Object.keys(CC_RACE_PEERS).length === 0);
  } catch (e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrace-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('FAILED: ' + out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('career race: own state, no lockstep, summary, order, tile, channel');
