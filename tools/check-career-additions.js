// Девять пунктов 3 сентября 2026 — сторож на всё сразу.
//
// Статистика читается из журнала, зал славы из слотов, план недели ведёт
// перемотку, мета сезона штрафует и снимает штраф, ЛАН стоит перелёта и
// пишет пост, клуб платит бонус за финал Мейджора ровно один раз и может
// закрыть состав, онлайн-школа берёт плату, развилки дня оставляют след.
// План на вечер и нервы ЛАНа замерены и НЕ выпущены — см.
// career-spread-probe.js; сторож следит, чтобы их не осталось в коде.
//
//   node tools/check-career-additions.js
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
    const fresh = () => { CAREER = {player:{nick:'Probe', ovr:70, region:'EU', role:'roleIGL',
      country:'de', age:16, attrs:ccRookieAttrs(70,'roleIGL')},
      career:{season:1, day:CC_YEAR_FROM, division:3, balance:1000, earnings:0, reach:60000,
              energy:CC_ENERGY_DAY, did:{}, log:[], news:[], school:'in'},
      partners:[{card:{handle:'Mate', region:'EU', tier:'ranked', rating:70, _targetOvr:70,
                     _attrs:ccRookieAttrs(70,'roleFRG')}, patience:60}],
      gear:{own:[], train:0}, sponsor:null, org:null, coach:null}; };
    careerRenderHub = function(){};
    careerSave = function(){};
    const someFree = () => { for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1))
      if (!(careerYearDays().get(d)||[]).length) return d; return CC_YEAR_FROM; };
    const row = (o) => Object.assign({season:1, day:CC_YEAR_FROM, div:3, place:12, of:50, pts:40,
      games:10, wins:1, elims:14, avg:12.5, ovr:70, kind:'cup', mate:'Mate', prize:0}, o);

    // 3. Статистика.
    fresh();
    check('stats: empty log says so', careerStatsHTML().indexOf(L().ccStEmpty) >= 0);
    CAREER.career.log = [row({}), row({kind:'final', place:3, wins:3, prize:400, day:ccAddDays(CC_YEAR_FROM, 7)}),
                         row({kind:'major', stage:'final', place:20, season:1, day:ccAddDays(CC_YEAR_FROM, 30)})];
    CAREER.career.earnings = 400;
    const st = careerStatsHTML();
    check('stats: totals tile is there', st.indexOf(L().ccStTitle) >= 0 && st.indexOf(L().ccStGames) >= 0);
    check('stats: kinds are grouped', st.indexOf(L().ccStByKind) >= 0 && st.indexOf(L().calWeeklyFinal) >= 0);
    check('stats: partner table is there', st.indexOf(L().ccStPartners) >= 0 && st.indexOf('Mate') >= 0);
    check('stats: best night names the final', st.indexOf(L().ccStBestNight) >= 0);
    check('stats: a rating curve is drawn', st.indexOf('ev-spark') >= 0);
    out.notes.stats = st.length;

    // 4. Зал славы из слотов.
    const saved = {};
    for (let n = 1; n <= CC_SLOTS; n++) { saved[n] = localStorage.getItem(LS_SLOT(n)); localStorage.removeItem(LS_SLOT(n)); }
    check('hall: nothing saved, nothing drawn', careerHallHTML() === '');
    localStorage.setItem(LS_SLOT(2), JSON.stringify({v:1,
      player:{nick:'HallProbe', ovr:88, region:'EU', role:'roleIGL', country:'de', age:19},
      career:{season:2, day:'2026-03-01', division:1, balance:0, earnings:12345, log:[
        row({season:1, div:2, place:5}), row({season:2, div:1, place:1, wins:4, day:'2026-02-10'}),
        row({season:2, div:1, kind:'major', stage:'final', place:7, day:'2026-02-28'})]}}));
    const hall = careerHallHTML();
    check('hall: the saved career is listed', hall.indexOf('HallProbe') >= 0, hall.slice(0, 200));
    check('hall: four records are named', [L().ccHallRich, L().ccHallEarlyD1, L().ccHallMostWins, L().ccHallBestMajor]
      .every(k => hall.indexOf(k) >= 0));
    check('hall: the best Major finish is the seventh', hall.indexOf('#7') >= 0);
    for (let n = 1; n <= CC_SLOTS; n++) { if (saved[n] != null) localStorage.setItem(LS_SLOT(n), saved[n]); else localStorage.removeItem(LS_SLOT(n)); }

    // 11. План недели снят по его слову («верни как было»): перемотка
    // тренирует лучшее за энергию, и плитки на центре нет.
    fresh(); CAREER.career.day = someFree();
    careerFfSpendDay();
    check('week: the fast-forward still spends the day on its own', careerDayDone());
    check('week: no plan tile is left behind', typeof careerWeekPlanTileHTML === 'undefined' && !L().ccWeekTitle);

    // 12. Мета сезона.
    fresh(); CAREER.career.day = someFree();
    const formBefore = careerForm();
    careerMetaStart('S99');
    check('meta: a new season opens the review', ccMetaOpen() === true);
    check('meta: and costs form until reviewed', Math.abs((formBefore - careerForm()) - CC_META_PEN) < 0.001,
          String(formBefore - careerForm()));
    check('meta: the review is a session of the day', !!ccActById('trMeta'));
    for (let i = 0; i < CC_META_DAYS; i++) {
      CAREER.career.energy = careerEnergyMax(); CAREER.career.did = {};
      check('meta: review day ' + (i+1) + ' works', careerDoAct('trMeta') !== null);
    }
    check('meta: three days close the review', ccMetaOpen() === false && ccMetaPen() === 0);
    check('meta: and the form came back up', careerForm() > formBefore, String(careerForm()));
    careerMetaStart('S99');
    check('meta: the same season does not restart it', CAREER.career.meta.days === CC_META_DAYS);
    fresh(); CAREER.career.day = someFree(); careerMetaStart('S98');
    CAREER.career.day = ccAddDays(CAREER.career.day, CC_META_WINDOW + 1);
    check('meta: the penalty fades after two weeks anyway', ccMetaPen() === 0);

    // 8. ЛАН: перелёт и пост, раз за ЛАН в сезоне.
    fresh(); CAREER.career.day = someFree(); CAREER.career.energy = careerEnergyMax();
    const eBefore = careerEnergy();
    check('lan: arrival works', careerLanArrive('summit', {id:'x'}) === true);
    check('lan: the flight costs energy', careerEnergy() === eBefore - CC_LAN_TRAVEL, String(careerEnergy()));
    check('lan: the arrival is posted', CAREER.career.news.some(n => n.k === 'ccPostLanArrive'));
    check('lan: the same LAN is not arrived at twice', careerLanArrive('summit', {id:'x'}) === false);
    check('lan: another LAN the same season is a new trip', careerLanArrive('rc', {id:'y'}) === true);
    CAREER.career.season = 2;
    check('lan: and next season the same LAN is a trip again', careerLanArrive('summit', {id:'x'}) === true);
    // Нервы и план на вечер не выпущены — замер в career-spread-probe.js.
    check('lan: no nerves mechanic is left behind', typeof CC_NERVES === 'undefined' && typeof careerPlanAsk === 'undefined');

    // 5. Бонус клуба и уход клуба.
    fresh(); CAREER.career.day = someFree();
    CAREER.org = {name:'Probe Org', salary:1000, goal:{type:'promote', target:2}, since:1, paid:0};
    check('org: the bonus is half a wage', careerOrgBonus(CAREER.org) === 500, String(careerOrgBonus(CAREER.org)));
    check('org: nothing to pay without a Major final', careerOrgBonusTick() === 0);
    CAREER.career.log.push(row({kind:'major', stage:'final', place:30, season:1}));
    const cashBefore = CAREER.career.balance;
    check('org: the Major final pays the bonus', careerOrgBonusTick() === 500);
    check('org: into the balance', CAREER.career.balance === cashBefore + 500);
    check('org: and only once', careerOrgBonusTick() === 0);
    check('org: last season\\'s final pays nothing', (function(){
      CAREER.career.log.push(row({kind:'major', stage:'final', place:30, season:0}));
      return careerOrgBonusTick() === 0; })());
    const iso = someFree();
    CAREER.career.orgQuit = {org:'Probe Org', day:iso};
    CAREER.career.told = {['oq|1|Probe Org']: 1};
    check('org: the closing day is due', careerOrgQuitDue(iso) === true);
    check('org: and the day carries the event', (ccDayEventOn(iso)||{}).id === 'orgQuit');
    CAREER.career.day = iso;
    const cashQ = CAREER.career.balance;
    check('org: answering closes the roster', careerDayEvent('orgQuit', 'fa') === true && CAREER.org === null);
    check('org: with a month of severance', CAREER.career.balance === cashQ + 1000, String(CAREER.career.balance));
    check('org: and the LFT post', CAREER.career.news.some(n => n.k === 'ccPostLft'));
    fresh(); CAREER.org = {name:'Other Org', salary:1000, goal:{type:'promote', target:2}, since:1, paid:0};
    CAREER.career.orgQuit = {org:'Probe Org', day:iso};
    CAREER.career.told = {['oq|1|Other Org']: 1};
    check('org: another club\\'s closing day is not this one\\'s', careerOrgQuitDue(iso) === false);
    // Шанс — сеяный: два одинаковых сезона решают одинаково.
    fresh(); CAREER.org = {name:'Seed Org', salary:1000, goal:{type:'promote', target:2}, since:1, paid:0};
    careerOrgQuitDue(iso); const q1 = JSON.stringify(CAREER.career.orgQuit||null);
    fresh(); CAREER.org = {name:'Seed Org', salary:1000, goal:{type:'promote', target:2}, since:1, paid:0};
    careerOrgQuitDue(iso); const q2 = JSON.stringify(CAREER.career.orgQuit||null);
    check('org: the closing roll is seeded', q1 === q2, q1 + ' vs ' + q2);

    // 13. Онлайн-школа берёт плату, и без денег возвращает в обычную.
    fresh(); CAREER.career.school = 'online'; CAREER.career.balance = 1000;
    check('school: online is paid monthly', careerSchoolFee(2) === 2*CC_SCHOOL_ONLINE && CAREER.career.balance === 1000 - 2*CC_SCHOOL_ONLINE);
    CAREER.career.balance = 10;
    check('school: unpaid means back to the regular one', careerSchoolFee(1) === 0 && CAREER.career.school === 'in');
    check('school: the regular one costs ten', ccSchoolCap(16) === 10 && ccSchoolCap(20) === 0);

    /* ---- Страница Notion 3 сентября: четыре правки соцсети ---- */

    // 1. Два почти одинаковых поста за вечер — итог и «проход в финал недели».
    check('feed: the Weekly Final line is folded into the result',
          !!L().ccNewsResultWf && !!L().ccNewsResultWeekWf &&
          String(L().ccNewsResultWf(5, 170, 600)).indexOf(String(L().ccNewsWfIn(5)).slice(-10)) < 0 === false ||
          String(L().ccNewsResultWf(5, 170, 600)).length > 20);
    check('feed: both folded lines have an author',
          CC_POST_BY.ccNewsResultWf === 'you' && CC_POST_BY.ccNewsResultWeekWf === 'you');

    // 2. Анкета выходит не в день развода, а через два дня.
    fresh(); CAREER.career.day = someFree();
    CAREER.ads = {};
    const adCard = {handle:'AdProbe', region:'EU', tier:'ranked', rating:80, nat:'Germany',
                    _targetOvr:80, _attrs:ccRookieAttrs(80,'roleFRG')};
    const ad = ccAdMake(adCard);
    check('ad: an ad remembers whose it is', ad && ad.handle === 'AdProbe');
    ad.post = 1;
    check('ad: nothing is posted the same day', careerAdPostTick() === 0);
    CAREER.career.day = ccAddDays(CAREER.career.day, CC_AD_POST_DELAY);
    check('ad: two days later the ad goes up', careerAdPostTick() === 1);
    check('ad: with the PR card attached',
          (CAREER.career.news||[]).some(n => n.k === 'ccPostLfdWant' && n.card));
    check('ad: and only once', careerAdPostTick() === 0);

    // 3. Таблица под постом — окно вокруг своей строки, флаги, отсечка, пин.
    fresh();
    const field = [];
    for (let i = 0; i < 40; i++) field.push({name:'Team'+i+' & M'+i, stagePts:1000-i*10,
      wins:1, stageElims:20, stageLog:[{place:5, elims:4}],
      squad:[{nat:'Germany'}, {nat:'France'}]});
    const meTeam = field[32];
    const shot = ccStageShot(field, meTeam, 1, 'Probe Cup', 20);
    out.notes.shot = {rows:shot.rows.length, first:shot.rows[0].p, pin:shot.pin && shot.pin.p, cutPts:shot.cutPts};
    // Ровно как в кадре из твита: #29…#36, своя строка #33 внутри окна.
    check('shot: it is a window around your row, not the top five',
          shot.rows.length === 8 && shot.rows[0].p === 29 && shot.rows.some(r => r.p === 33),
          JSON.stringify(out.notes.shot));
    check('shot: your row is pinned underneath', shot.pin && shot.pin.p === 33);
    check('shot: flags come off the squad cards', (shot.rows[0].f||[]).length === 2);
    check('shot: the qualifying line is priced', shot.cutPts === 1000 - 19*10, String(shot.cutPts));
    const shotHTML = ccShotHTML(shot);
    check('shot: the cut line is printed on it', shotHTML.indexOf(String(L().ccShotCut(20, ccNum(shot.cutPts)))) >= 0);
    check('shot: and the pinned row is drawn', shotHTML.indexOf('x-shot-r pin') >= 0 || shotHTML.indexOf(' pin"') >= 0);
    const topShot = ccStageShot(field, field[2], 1, 'Probe Cup', 20);
    check('shot: inside the top eight it is just the top', topShot.rows[0].p === 1);

    /* 3b. Карта под постом — вырезка вокруг коробки, а не весь остров.
       Его правка со ссылкой на пост @MalibucaFN: «карта слишком большая». */
    fresh();
    useLandingSet(careerBrSet());
    const zi = 3, zs = ACTIVE_LANDING_SET;
    const map = ccDropMapHTML({zone:zi, set:zs});
    // ВНИМАНИЕ: это шаблонная строка Node — каждый обратный слэш регулярки
    // пишется двойным, иначе \( доедет до браузера как ( и скобки разъедутся.
    const zoom = Number((map.match(/width:(\\d+)%/)||[])[1]||0);
    out.notes.map = {zoom:zoom, shot:map.indexOf('x-map-shot') >= 0};
    check('drop map: it is a crop, not the whole island',
          map.indexOf('x-map-shot') >= 0 && map.indexOf('x-map-in') >= 0, map.slice(0, 120));
    check('drop map: the island is blown up around the box', zoom > 130, String(zoom));
    // Кадр не выезжает за остров: центр прижат к краю (translate в пределах).
    const tx = Number((map.match(/translate\\((-?[\\d.]+)%/)||[])[1]||0);
    check('drop map: the frame stays on the island', tx <= 0 && tx >= -100, String(tx));
    check('drop map: the box is still drawn on it', map.indexOf('left:') >= 0 && map.indexOf('<i ') >= 0);
    // Каждый остров считается сам: у Релоада своя сетка и свой арт.
    Object.keys(ZONE_SETS).slice(0, 6).forEach(k => {
      if (!MAP_ART[k] || !(ZONE_SETS[k]||[]).length) return;
      const m = ccDropMapHTML({zone:0, set:k});
      check('drop map: ' + k + ' draws too', m.indexOf('x-map-in') >= 0);
    });

    /* 3c. Соло-вечер читает СВОЮ метку, а не сезонный дуо-дом.
       Его правка: «в соло ещё метки, не для соло, а для других режимов». */
    fresh();
    useLandingSet(careerBrSet());
    /* Коробки берём из ЖИВЫХ зон острова: сетка подрезается под размер лобби
       (trimLandingZonesForMode), и произвольный индекс может в неё не попасть
       — первая версия этой пробы так и промахнулась мимо соло-метки. */
    const iOf = z => careerSpotIndexOf(z, careerBrSet());
    careerSpotSet(iOf(ALL_LANDING_ZONES[1]), careerBrSet());   // дуо-дом сезона
    careerSpotSet(iOf(ALL_LANDING_ZONES[2]), 'solo');          // своя точка на соло
    const duoZone = careerSpotZone(careerBrSet());
    const soloZone = careerSpotZone('solo');
    out.notes.spotKeys = {duo:!!duoZone, solo:!!soloZone,
                          same: !!(duoZone && soloZone && duoZone === soloZone)};
    check('solo spot: a solo mark resolves to a zone of its own',
          !!soloZone && !!duoZone && soloZone !== duoZone, JSON.stringify(out.notes.spotKeys));
    check('solo spot: the two stores are separate',
          Object.keys(CAREER.career.soloSpots||{}).length > 0 &&
          Object.keys(CAREER.career.spots||{}).length > 0);
    // Указатель вечера: без него читается дуо-дом, с ним — соло.
    ccNightSpotOff();
    check('solo spot: by default the evening reads the season home',
          ccNightSpot(ACTIVE_LANDING_SET) === careerSpotKey(careerBrSet()) &&
          careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET)).some(x => x.zone === duoZone));
    ccNightSpotOn('solo');
    check('solo spot: under the pointer it reads the solo mark',
          ccNightSpot(ACTIVE_LANDING_SET) === 'solo' &&
          careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET)).some(x => x.zone === soloZone));
    check('solo spot: and the duo home is not on the map then',
          !careerSpotZones(ccNightSpot(ACTIVE_LANDING_SET)).some(x => x.zone === duoZone));
    // Аура за вечер идёт в тот же склад, что читал вечер.
    const soloAuraBefore = (careerSpotList('solo')[0]||{}).aura || 0;
    const duoAuraBefore = (careerSpotList(careerBrSet())[0]||{}).aura || 0;
    careerSpotNight(6, 1, ccNightSpot(ACTIVE_LANDING_SET), 0, false);
    check('solo spot: the aura goes to the solo mark',
          ((careerSpotList('solo')[0]||{}).aura||0) > soloAuraBefore &&
          ((careerSpotList(careerBrSet())[0]||{}).aura||0) === duoAuraBefore);
    ccNightSpotOff();
    // Соло-остров FNCS Solos — своя сетка на сто клеток, метка та же по месту.
    /* Остров FNCS Solos — тот же s42, только на сто клеток вместо тридцати
       (ZONE_SETS_SOLO_READY). Метка ставится на сезонном острове, а он с
       21 августа как раз s42 — поэтому проба переносит день в осень, иначе
       careerBrSet() отдаёт январский m2, другой остров, и метка честно никуда
       не попадает. Размер лобби тоже ставим соло: сетку режет он. */
    if (ZONE_SETS.s42solo) {
      const dayWas = CAREER.career.day, sizeWas = squadSize;
      CAREER.career.day = '2026-10-06';
      CAREER.career.soloSpots = {};
      squadSize = 1;
      useLandingSet(careerBrSet());
      careerSpotSet(careerSpotIndexOf(ALL_LANDING_ZONES[2], careerBrSet()), 'solo');
      useLandingSet('s42solo');
      ccNightSpotOn('solo');
      const z = careerSpotZone(ccNightSpot(ACTIVE_LANDING_SET));
      out.notes.soloIsland = {island:careerBrSet(), zones:ALL_LANDING_ZONES.length, found:!!z};
      check('solo spot: it resolves on the hundred-box island too', !!z,
            JSON.stringify(out.notes.soloIsland));
      ccNightSpotOff();
      squadSize = sizeWas; CAREER.career.day = dayWas;
      useLandingSet(careerBrSet());
    }
    check('solo spot: the runner raises and lowers the pointer',
          String(runCareerSoloSeries).indexOf("ccNightSpotOn('solo')") >= 0 &&
          String(runCareerSoloSeries).indexOf('ccNightSpotOff()') >= 0);

    // 4. Уведомления: кто именно, кусок поста, репосты.
    fresh(); CAREER.career.day = someFree();
    CAREER.career.reach = 60000;
    CAREER.partners = [{card:{handle:'Mate', region:'EU', tier:'ranked', rating:70, nat:'Germany',
      _targetOvr:70, _attrs:ccRookieAttrs(70,'roleFRG')}, patience:60}];
    careerNews('good', 'ccNewsRating', [70, 71]);
    careerNotesTick();
    const notes = careerNotes();
    out.notes.kinds = notes.map(t => t.kind);
    check('notes: a like notification names somebody', notes.some(t => t.kind === 'like' && t.who),
          JSON.stringify(out.notes.kinds));
    check('notes: reposts are a notification too', notes.some(t => t.kind === 'repost'));
    const noteHTML = careerNoteRowHTML(notes.find(t => t.kind === 'like'));
    check('notes: the row quotes the post itself', noteHTML.indexOf('x-note-post') >= 0);
    check('notes: and shows who liked it', noteHTML.indexOf('x-note-av') >= 0);

    // 5. «Квал на ЛАН» рядом с заработком.
    fresh();
    CH_SOCIAL = 'me';   // отметка стоит в своём профиле, а не в ленте
    CAREER.career.ewc = [{season:1, ev:'rc'}];
    check('profile: a seat shows next to the earnings',
          careerSocialHTML().indexOf('x-lanq') >= 0);
    CAREER.career.ewc = [];
    check('profile: and no seat, no mark', careerSocialHTML().indexOf('x-lanq') < 0);
    CH_SOCIAL = 'feed';

    // 6. Чат с напарником: темы, настрой, никакой траты дня.
    fresh(); CAREER.career.day = someFree();
    CAREER.career.log = [row({})];
    careerSpotSet(3, careerBrSet());
    const topics = careerMateTopics();
    out.notes.topics = topics;
    check('mate chat: every topic has something behind it',
          topics.indexOf('night') >= 0 && topics.indexOf('spot') >= 0 && topics.indexOf('life') >= 0,
          JSON.stringify(topics));
    const patBefore = CAREER.partners[0].patience;
    check('mate chat: talking works', careerMateTalk('night') === true);
    const thread = careerMateThread();
    check('mate chat: both sides said something', thread.msgs.length >= 2 &&
          thread.msgs.some(m => m.from === 'you') && thread.msgs.some(m => m.from === 'them'));
    check('mate chat: the mood moved', CAREER.partners[0].patience > patBefore,
          patBefore + ' -> ' + CAREER.partners[0].patience);
    check('mate chat: the day is not spent', careerDayDone() === false);
    const patAfter = CAREER.partners[0].patience;
    careerMateTalk('life');
    check('mate chat: talking again the same day is worth less',
          CAREER.partners[0].patience - patAfter < patAfter - patBefore,
          String(CAREER.partners[0].patience - patAfter));
    check('mate chat: every topic has its words', CC_MATE_TOPICS.every(k =>
      L()['dmMateBtn'+k] && L()['dmMateWhat'+k] && L()['dmMeTalk'+k] && L()['dmMateTalk'+k]));
    CAREER.partners = [];
    check('mate chat: no partner, no thread', careerMateThread() === null && careerMateTopics().length === 0);

    // Хук агрессии в движке остаётся для проб: seek = aggression × _seekMul.
    const sq = (mul) => ZoneSim.simulateZoneGame([{name:'a', attrs:{AIM:80, CLU:80, END:80, SUR:80}, _seekMul:mul},
                                                 {name:'b', attrs:{AIM:80, CLU:80, END:80, SUR:80}}],
      {rng:Math.random, land:ZONE_SETS.m2, aspect:1, record:false, stepwise:true,
       startOf:()=>({x:50,y:50}), duel:(a,b)=>a}).squads;
    const seeks = sq(2);
    check('engine: the probe hook multiplies a squad\\'s seek', Math.abs(seeks[0].seek / seeks[1].seek - 2) < 1e-9,
          seeks.map(s => s.seek).join(' vs '));
    check('engine: and nothing in the career sets it', sq(undefined)[0].seek === sq(undefined)[1].seek);

    // 2. Развилки: след в настрое, репутации, точке.
    fresh(); const d = someFree(); CAREER.career.day = d;
    CAREER.career.spots = {}; careerSpotSet(3, careerBrSet());
    check('fork: a spot is set for the test', !!careerSpotOn());
    CAREER.career.luck = {day:d, woe:null, ev:'mateSpot'};
    check('fork: the spot event is on the day', (ccDayEventOn(d)||{}).id === 'mateSpot');
    const pat = CAREER.partners[0].patience;
    check('fork: moving works', careerDayEvent('mateSpot', 'move') === true);
    check('fork: the spot is cleared', !careerSpotOn());
    check('fork: and the partner is happier', CAREER.partners[0].patience === pat + 6, String(CAREER.partners[0].patience));
    check('fork: the answer is posted', CAREER.career.news.some(n => n.k === 'ccDayEvmateSpotRmove'));
    fresh(); CAREER.career.day = d;
    CAREER.career.log = [row({day:ccAddDays(d, -1), place:40, of:50})];
    CAREER.career.luck = {day:d, woe:null, ev:'tilt'};
    check('fork: a bad night brings the tilt', (ccDayEventOn(d)||{}).id === 'tilt');
    const rep = careerRep();
    careerDayEvent('tilt', 'blame');
    check('fork: blame costs reputation', careerRep() === rep - 3, String(careerRep()));
    check('fork: an unknown answer falls to the first', (function(){
      fresh(); CAREER.career.day = d; CAREER.career.luck = {day:d, woe:null, ev:'coachFree'};
      return careerDayEvent('coachFree', 'nonsense') === true && CAREER.career.news.some(n => n.k === 'ccDayEvcoachFreeRtake'); })());
    check('fork: every option has its words', CC_DAY_EVENTS.filter(e => e.opts).every(e =>
      L()['ccDayEv'+e.id] && L()['ccDayEv'+e.id+'Sub'] &&
      e.opts.every(o => L()['ccDayEv'+e.id+'O'+o.id] && L()['ccDayEv'+e.id+'R'+o.id])));
    check('fork: every option answer has an author', CC_DAY_EVENTS.filter(e => e.opts).every(e =>
      e.opts.every(o => CC_POST_BY['ccDayEv'+e.id+'R'+o.id])));
  } catch (e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccadd-'));
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
console.log('additions: stats, hall, meta, LAN trip, contract, school, forks; plus the Notion four: folded post, delayed ad, in-game table, X notifications, LAN mark, mate chat');
