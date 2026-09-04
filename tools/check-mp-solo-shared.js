// Solo Series в команде — одно лобби на двоих, каждый за себя; фоновая вкладка не голосует за пропуск.
//
// Его отчёты, 28 августа («neeww»): «solo series тоже разные лобби играют»
// (красная строка: field … vs …) — его выбор: «одно лобби на двоих»;
// «я пошёл в другое окно, и у меня поломалось».
//
//   node tools/check-mp-solo-shared.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nexty', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-17', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ss'},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.send=function(){};
    await ccMpEnter({code:'SOLO01', role:'a'});
    MP.peer={handle:'Zed', nat:'ru', region:'EU', rating:88, _targetOvr:88, _attrs:null, _roleKey:'roleFRG', formPow:2};
    const me=careerCard();
    // 1. Вопрос с адресатом.
    check('свой адресный вопрос — мой', ccMpMine('drop:'+hKey(me))===true);
    check('чужой адресный вопрос — не мой', ccMpMine('loot:'+hKey(MP.peer))===false);
    check('вопрос без адресата — по роли, как был', ccMpMine('drop')===true && ccMpMine('late')===false);
    // 2. Проход — на каждого.
    const ev=careerSoloSeriesOn('2026-01-17');
    check('день хитов найден', !!ev && ev.stage==='heats', JSON.stringify(ev));
    check('без прохода хиты закрыты', careerSoloSeriesCan(ev)===false);
    ccSoloSet(MP.peer, {got:'qual', pass:'qual'});
    check('проход напарника мне хитов не открывает', careerSoloSeriesCan(ev)===false);
    check('но у напарника открывает', careerSoloSeriesCanFor(ev, ccSoloOf(MP.peer))===true);
    ccSoloSet(me, {got:'qual', pass:'qual'});
    check('свой проход открывает', careerSoloSeriesCan(ev)===true);
    check('лежит под ником в soloBy', !!(CAREER.career.soloBy && CAREER.career.soloBy[hKey(me)]) && !CAREER.career.solo);
    check('soloBy — ключ команды', CC_TEAM_KEYS.indexOf('soloBy')>=0);
    /* 2б. Личный вечер, общий день. Его слова 29 августа: «зачем друг друга
       ждать, когда это соло» / «личный вечер, но турнир один и тот же».
       Соло в команде — всегда одиночный вечер: гейт не спрашивается, а день
       шагает, когда отыграли оба (или второму играть нечего). */
    const day0=careerToday();
    CAREER.career.soloBy={};
    ccSoloSet(MP.peer, {got:'qual', pass:'qual'});   // напарник прошёл в хиты, но хиты ещё не играл
    check('пока сам не играл — день стоит', ccSoloTeamSettle()===false && careerToday()===day0);
    ccSoloSet(me, {got:'heats', pass:'heats'});       // я отыграл хиты
    check('панель дня знает, что ждём напарника', ccSoloWaitingPeer()===true && ccMpBlockWhy()===L().ccMpSoloWait, String(ccMpBlockWhy()));
    check('напарник ещё может сыграть — день стоит', ccSoloTeamSettle()===false && careerToday()===day0, careerToday());
    ccSoloSet(MP.peer, {got:'heats', pass:null});     // приехал его итог
    check('отыграли оба — день шагнул', ccSoloTeamSettle()===true && careerToday()===ccAddDays(day0, 1), careerToday());
    /* Напарник-бот в сотне — только когда он допущен на этап и ещё не играл.
       Его скрин 30 августа (вкладка напарника, финал): Малибука третьим в
       финале, куда сам не прошёл. */
    {
      const q=careerSoloSeriesOn('2026-01-06'), h=careerSoloSeriesOn('2026-01-17'), f=careerSoloSeriesOn('2026-01-24');
      check('квал: напарник в сотне', ccSoloPeerSeat(q, null)===true);
      check('квал: уже прошёл — в сотне не стоит', ccSoloPeerSeat(q, {got:'qual', pass:'qual', day:'2026-01-06'})===false);
      check('хиты: не прошёл квал — в сотне не стоит', ccSoloPeerSeat(h, null)===false && ccSoloPeerSeat(h, {got:'qual', pass:null})===false);
      check('хиты: прошёл квал — стоит', ccSoloPeerSeat(h, {got:'qual', pass:'qual'})===true);
      check('финал: не прошёл хиты — не стоит', ccSoloPeerSeat(f, {got:'heats', pass:'qual'})===false);
      check('финал: прошёл хиты — стоит', ccSoloPeerSeat(f, {got:'heats', pass:'heats'})===true);
      check('финал: уже отыграл — не стоит', ccSoloPeerSeat(f, {got:'final', pass:'final', day:'2026-01-24'})===false);
      /* Состояние напарника берётся через ccSoloStateOf, а не через ccSoloOf:
         со 2 сентября у соло два круга — январская Solo Series и FNCS Solos, —
         и лежат они в разных полях сейва. Строка сверки отстала от этой
         правки и держала сторож красным. */
      check('раннер сажает бота через допуск',
            String(runCareerSoloSeries).indexOf('ccSoloPeerSeat(ev, ccSoloStateOf(ev, peerCard))')>=0);
      // И подсказка закрытого соло — про этап, а не про Мейджоры.
      const keepDay=CAREER.career.day, keepSolo=CAREER.career.soloBy;
      CAREER.career.day='2026-01-24'; CAREER.career.soloBy={};
      check('закрытый финал объясняется хитами', ccSoloWhyLocked()===L().ccSoloNeedHeats, String(ccSoloWhyLocked()));
      CAREER.career.day='2026-01-17';
      check('закрытые хиты объясняются квалом', ccSoloWhyLocked()===L().ccSoloNeedQual, String(ccSoloWhyLocked()));
      CAREER.career.day=keepDay; CAREER.career.soloBy=keepSolo;
    }
    /* Слова ожидания — по причине. Его скрин 30 августа (сессия 2 квала):
       «ты отыграл своё соло», а он в этот день не играл — прошёл в первой. */
    {
      const keep=CAREER.career.day;
      CAREER.career.day='2026-01-10';   // сессия 2 квала
      ccSoloSet(me, {got:'qual', pass:'qual', day:'2026-01-06'});
      ccSoloSet(MP.peer, null);
      check('прошёл раньше — панель говорит «уже в хитах»', ccSoloWaitingPeer()===true && ccMpBlockWhy()===L().ccMpSoloThrough, String(ccMpBlockWhy()));
      ccSoloSet(me, {got:'qual', pass:null, day:'2026-01-10'});
      check('сыграл сегодня — панель говорит «отыграл»', ccSoloWaitingPeer()===true && ccMpBlockWhy()===L().ccMpSoloWait, String(ccMpBlockWhy()));
      CAREER.career.day=keep;
      CAREER.career.soloBy={};
      ccSoloSet(MP.peer, {got:'heats', pass:null}); ccSoloSet(me, {got:'heats', pass:'heats'});
    }
    // Хиты идут два дня (17-18 января): второй день обоим играть нечего — шагает и он; дальше соло нет — стоп.
    check('второй день хитов, обоим нечего играть — шагает', ccSoloTeamSettle()===true && careerToday()===ccAddDays(day0, 2), careerToday());
    check('а дальше не соло — не шагает', ccSoloTeamSettle()===false && careerToday()===ccAddDays(day0, 2), careerToday());
    // Напарнику играть нечего (не прошёл) — ждать его незачем.
    CAREER.career.day=day0; CAREER.career.soloBy={};
    ccSoloSet(me, {got:'heats', pass:'heats'}); ccSoloSet(MP.peer, {got:'qual', pass:null});
    check('напарник не прошёл — день шагает сразу', ccSoloTeamSettle()===true && careerToday()===ccAddDays(day0, 1), careerToday());
    // Чужой итог приезжает командным состоянием — день шагает оттуда же.
    CAREER.career.day=day0; CAREER.career.soloBy={};
    ccSoloSet(me, {got:'heats', pass:'heats'});
    const remote=ccTeamState(); remote.soloBy=Object.assign({}, remote.soloBy); remote.soloBy[hKey(MP.peer)]={got:'heats', pass:'heats'};
    ccMpApplyRemote(remote);
    check('итог напарника приехал состоянием — день шагнул', careerToday()===ccAddDays(day0, 1), careerToday());
    CAREER.career.day=day0; CAREER.career.soloBy={};
    // Гейт в соло не спрашивается: раннер ставит CC_MP_ALONE до него.
    const src=document.documentElement.outerHTML; const at=src.indexOf('async function runCareerSoloSeries(');
    const body=src.slice(at, at+20000);
    check('соло-раннер: локстеп, когда играют оба, одиночный вечер — когда второму нечего', /const alone=ccMpTeam\\(\\) && !peerIn;/.test(body) && body.indexOf('ccSoloTeamSettle()')>=0);
    // Из сотни вычитаются ОБА человека (тёзки обоих). Его Sky и Scroll, 29 августа: «diff 1 of 4900: #278 scroll:96 vs sky:96».
    check('сотня строится без обоих людей', body.indexOf('careerSoloField(lobbyCr, mate ? [me, pc]')>=0);
    // Соло-Victory Cup в команде — та же схема: оба человека, тёзки обоих вычтены, вопросы адресные.
    const atV=src.indexOf('async function runCareerVictory('); const bodyV=src.slice(atV, atV+20000);
    check('соло-Victory Cup: оба в сотне и тёзки вычтены', bodyV.indexOf('careerSoloField(cr, pc ? [me, pc] : drafted')>=0 && bodyV.indexOf('soloMate.isMate=true')>=0 && bodyV.indexOf('ccSoloDrops(')>=0);
    check('соло-вечер узнаётся по виду, а не по типу', careerNightSolo({type:'victory', day:'2026-03-08'})===true && careerNightSolo({type:'cup', day:'2026-03-08'})===false);
    // 3. Двое в одной сотне.
    const mk=n=>({name:'t'+n});
    const A=mk('A'), B=mk('B');
    const lobbies=[[mk(1), mk(2), A, mk(3)], [mk(4), B, mk(5)], [mk(6)]];
    ccLobbiesTogether(lobbies, [A, B]);
    check('второй перешёл в лобби первого', lobbies[0].indexOf(A)>=0 && lobbies[0].indexOf(B)>=0, JSON.stringify(lobbies.map(l=>l.map(t=>t.name))));
    check('размеры лобби не поменялись', lobbies[0].length===4 && lobbies[1].length===3, JSON.stringify(lobbies.map(l=>l.length)));
    check('бот ушёл на место второго', lobbies[1].map(t=>t.name).indexOf('t3')>=0, JSON.stringify(lobbies[1].map(t=>t.name)));
    const same=[[A, B, mk(7)]]; ccLobbiesTogether(same, [A, B]);
    check('уже вместе — без изменений', same[0][0]===A && same[0][1]===B);
    // 3б. Настрой в команде — общий: от стажа дуо, не от бота из личного списка.
    CAREER.partners=[{handle:'bot', patience:13, since:'2026-01-01'}];
    CAREER.career.chemSince=ccAddDays(careerToday(), -45);
    const p1=careerPatience();
    CAREER.partners=[{handle:'other', patience:77, since:'2025-01-01'}];
    check('настрой в команде не зависит от личного списка', careerPatience()===p1, p1+' / '+careerPatience());
    check('и растёт со стажем дуо', p1>CAREER_PATIENCE_START && p1<100, String(p1));
    CAREER.career.chemSince=careerToday();
    check('в день сбора — стартовый', careerPatience()===CAREER_PATIENCE_START, String(careerPatience()));
    // 4. Фоновая вкладка: паузы нулевые, сторож реплея не голосует за пропуск.
    Object.defineProperty(document, 'hidden', {get:()=>true, configurable:true});
    skipAnimation=false;
    const t=Date.now(); await sleep(3000);
    check('в фоне пауза не ждётся', Date.now()-t<500, (Date.now()-t)+' мс');
    check('пропуск при этом не включён', skipAnimation===false);
    REPLAY_GUARD_MS=50;
    const hang={};
    ZoneReplay.play=function(){ return new Promise(()=>{}); };
    const v=await playReplayGuarded(hang, [], {isSkipped:()=>false});
    check('сторож обрезал показ', v===false);
    check('но общий пропуск не тронул', skipAnimation===false);
    // Одиночная: сторож ставит пропуск, как ставил.
    delete CAREER.career.mp;
    const v2=await playReplayGuarded(hang, [], {isSkipped:()=>false});
    check('в одиночной сторож ставит пропуск', v2===false && skipAnimation===true);
    skipAnimation=false;
    Object.defineProperty(document, 'hidden', {get:()=>false, configurable:true});
    check('одиночная: solo как был', (ccSoloSet(me, {got:'qual', pass:'qual'}), CAREER.career.solo && CAREER.career.solo.got==='qual'));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccsolo-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
if(out.notes.second) console.log(JSON.stringify(out.notes.second));
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('соло в команде: адресные вопросы, проход на каждого, одна сотня на двоих; фон не голосует за пропуск');
