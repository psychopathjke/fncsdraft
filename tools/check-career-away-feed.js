// Лента других регионов, подписка через океан и ответ человеку под своим постом.
//
// Его слово 8 сентября 2026: «чтоб твитер был и других регионов… могут ли игроки
// постить результаты своих матчей на других регионах», и его игрок из Notion тем же
// днём: «reply to the people in our own tweet», «follow people from nac while being EU».
//
// Что держится:
//   1. воскресенье пишет посты из шести чужих регионов, и у каждого автор с регионом;
//   2. подписка на человека из NAC — и его место приходит в ленту, в «подписках» тоже;
//   3. одна и та же ночь не пишется дважды, а свой пул после чужой недели — свой;
//   4. в ряду «кого читать» есть чужие регионы, и список оттуда живой;
//   5. под своим постом у строки есть «Ответить», ответ уходит с адресатом и рисуется
//      веткой под его строкой, а общего поля под своим постом по-прежнему нет;
//   6. обычный эфир идёт пятнадцать секунд.
//
//   node tools/check-career-away-feed.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  var out = {steps: [], fail: null, errs: null};
  function fail(s){ out.fail = s; throw new Error(s); }
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v: 1,
      player: {nick: 'AwayMan', age: 16, source: 'rookie', country: 'de',
               countryPing: 15, closeRangeEdge: 6, region: 'EU',
               ovr: 54, role: 'roleIGL', attrs: null, ageEdge: 4, photo: null,
               handle: null, cardRegion: null, nat: null},
      career: {season: 1, day: CC_YEAR_FROM, division: 1, earnings: 0, tokens: [], log: []},
      partners: []
    }));
    var s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    var cr = CAREER.career;

    // 4. Кого читать — из NAC.
    var sug = ccAwaySuggest('NAC');
    out.steps.push('подсказки NAC: ' + sug.map(function(w){ return w.handle + ' ' + w.ovr; }).join(', '));
    if (sug.length !== 4) fail('из NAC предлагают не четверых: ' + sug.length);
    if (sug.some(function(w){ return w.cardRegion !== 'NAC' || !w.roster; })) fail('подсказка из NAC без региона');
    CH_SUG_REG = 'NAC'; CH_SOCIAL = 'feed';
    careerRenderHub('social');
    var hub = document.getElementById('screen-career-hub').innerHTML;
    if (hub.indexOf('x-sug-reg on') < 0 || hub.indexOf('careerSugRegion(\\'BR\\')') < 0) fail('ряда регионов над «кого читать» нет');
    if (hub.indexOf(sug[0].handle) < 0) fail('список из NAC не нарисован');
    CH_SUG_REG = null;

    // 2. Подписка на человека из NAC — на сильного, чтобы он точно был в финале.
    var nac = ccSceneRoster('NAC');
    var star = nac[0];
    careerFollow(star.handle);
    if (!ccFollowing(star.handle)) fail('подписаться на NAC нельзя');
    var prof = careerWhoHTML(star.handle);
    if (prof.indexOf('x-reg') < 0) fail('в профиле человека из NAC нет кода региона');

    // 1. Воскресенье чужих регионов.
    var before = (cr.news || []).length;
    var t0 = performance.now();
    var sunday = ccAddDays(CC_YEAR_FROM, 7);
    careerRegionsWeek(sunday);
    var ms = Math.round(performance.now() - t0);
    var away = (cr.news || []).slice(0, (cr.news || []).length - before);
    var regs = {};
    away.forEach(function(n){ var r = n.by && n.by.card && n.by.card.region; regs[r] = (regs[r] || 0) + 1; });
    out.steps.push('чужая неделя: ' + away.length + ' постов за ' + ms + ' мс, по регионам ' + JSON.stringify(regs));
    if (away.length < 6) fail('чужих постов меньше шести: ' + away.length);
    if (regs.EU) fail('свой регион попал в чужую неделю');
    if (Object.keys(regs).length !== 6) fail('регионов не шесть: ' + Object.keys(regs).join(','));
    // Таблица — у каждого победителя; у подписанного её может забрать правило
    // careerNews «одна таблица за вечер», если он стоит в той же восьмёрке.
    if (away.some(function(n){ return n.k !== 'ccPostPlaced' || !(n.a && n.a[0] > 0); })) fail('чужой пост без места');
    var withTbl = away.filter(function(n){ return n.tbl && n.tbl.rows && n.tbl.rows.length; }).length;
    if (withTbl < 6) fail('таблиц под чужими постами меньше шести: ' + withTbl);
    if (away.some(function(n){ return n.day !== sunday; })) fail('чужой пост подписан не днём финала');
    var mine = away.filter(function(n){ return n.by && hKey(n.by.name) === hKey(star.handle); });
    out.steps.push('подписанный ' + star.handle + ': ' + (mine.length ? 'место #' + mine[0].a[0] : 'НЕ ПОСТИЛ'));
    if (!mine.length) fail('человек из NAC, на которого подписан, не постит результат');
    var html = ccPostHTML(mine[0]);
    if (html.indexOf('x-reg') < 0 || html.indexOf('>NAC<') < 0) fail('у поста из NAC нет кода региона');
    if (html.indexOf('x-co-r') < 0) fail('под постом из NAC пусто');
    CH_FEED = 'subs';
    var subs = careerFeedHTML();
    CH_FEED = 'all';
    if (subs.indexOf(star.handle) < 0) fail('пост подписанного из NAC не виден в «подписках»');
    if (ms > 4000) fail('чужая неделя слишком долгая: ' + ms + ' мс');

    // 3. Дважды одна ночь не пишется; свой пул после — свой.
    careerRegionsWeek(sunday);
    if ((cr.news || []).length !== before + away.length) fail('одна и та же ночь написана дважды');
    var pool = careerPools();
    if (pool.reg !== 'EU') fail('после чужой недели свой пул стал ' + pool.reg);
    if (ccCareerRegion() !== 'EU') fail('регион карьеры не вернулся: ' + ccCareerRegion());

    // 5. Ответ человеку под своим постом.
    careerNews('good', 'ccNewsResult', [3, 50, 1]);
    var own = (cr.news || [])[0];
    own.f = 60000;                      // аудитория, при которой под постом есть ответы
    var who = ccPostAuthor(own);
    if (!who.you) fail('свой пост подписан не игроком');
    var st = ccPostStats(own, who);
    if (!(st.replies > 0)) fail('под своим постом нет ответов — нечего проверять');
    if (ccPostActsHTML(own, who, st)) fail('под своим постом появилось общее поле ответа');
    var co = ccPostComments(own, who, st);
    var m = co.match(/careerReplyTo\\('([^']+)','([^']+)'\\)/);
    if (!m) fail('у строк под своим постом нет «Ответить»');
    careerReplyTo(m[1], m[2]);
    var box = document.getElementById('ccReplyBox' + own.id);
    if (!box) fail('поле ответа под строкой не открылось');
    box.value = 'gg, see you next week';
    careerReplyWrite(own.id);
    if (!(own.res && own.res.length === 1 && own.res[0].to === m[2])) fail('ответ не записался с адресатом');
    if (CC_REPLY_OPEN) fail('поле не закрылось после ответа');
    var co2 = ccPostComments(own, who, ccPostStats(own, who));
    var at = co2.indexOf('@' + ccHandle(m[2]) + '<'), sub = co2.indexOf('x-co-mine sub');
    out.steps.push('ответ ' + m[2] + ': ' + (sub > at && at >= 0 ? 'веткой под его строкой' : 'НЕ ТАМ'));
    if (!(at >= 0 && sub > at)) fail('свой ответ не стоит веткой под строкой адресата');
    if (co2.indexOf('<u>@' + ccHandle(m[2]) + '</u>') < 0) fail('в ответе нет адресата');

    // 7. Правила Про-Ама — пятью строками на каждом языке, все числа из констант.
    var lang0 = LANG;
    ['ru','en','fr','it','pt'].forEach(function(l){
      LANG = l;
      var how = ccProAmHowHTML();
      if ((how.match(/<li>/g) || []).length !== 5) fail('правила Про-Ама на ' + l + ': не пять строк');
      if (how.indexOf(String(CC_PROAM_TEAMS)) < 0 || how.indexOf(ccNum(CC_PROAM_REACH)) < 0) fail('в правилах Про-Ама нет чисел турнира (' + l + ')');
    });
    LANG = lang0;
    out.steps.push('правила Про-Ама: пять строк на пяти языках');

    // 8. Совет напарника молчит в соло-вечере (его скрин 8.09: «vic0 советует, когда соло»).
    {
      // Сначала напарник — без него мнения нет и в дуо, и проверка ничего не значит.
      var mateCard = ccSceneRoster(ccCareerRegion()).find(function(c){ return hKey(c) !== hKey(careerCard() || {}); });
      if (!careerMates().filter(Boolean).length && mateCard)
        careerMateSeat({handle: mateCard.handle, cardRegion: mateCard.region, patience: CAREER_PATIENCE_START, since: ccAddDays(careerToday(), -CC_CHEM_DAYS)});
      var duoNow = (function(){ try{ return ccMateOpinion([{title:'a'},{title:'b'}], {title:'a'}); }catch(e){ return 'ERR '+e; } })();
      if (!duoNow) fail('в дуо-вечере напарник не советует: ' + JSON.stringify(careerMates().map(function(m){ return m && m.handle; })));
      var sq0 = squadSize; squadSize = 1;
      var soloNow = (function(){ try{ return ccMateOpinion([{title:'a'},{title:'b'}], {title:'a'}); }catch(e){ return 'ERR '+e; } })();
      squadSize = sq0;
      out.steps.push('совет напарника: дуо ' + (duoNow ? 'есть' : 'нет (напарника нет)') + ', соло ' + (soloNow ? 'ЕСТЬ' : 'нет'));
      if (soloNow) fail('напарник советует в соло-вечере');
    }
    // 10. В гонке эфир с турнира выключен, обычные эфиры остаются (его слово 8.09).
    {
      cr.race = {code: 'ABC123', role: 'a', since: careerToday()};
      var why = ccStreamCupWhy();
      if (why !== L().ccTvRaceNo) fail('в гонке эфир с турнира не выключен: ' + why);
      if (!CC_STREAM_KINDS.length || careerDayClosed()) fail('обычных эфиров нет');
      delete cr.race;
      out.steps.push('гонка: эфир с турнира выключен, обычные эфиры на месте');
    }
    // 11. Разные режимы (симуляция/играть) в гонке: вечер не начинается ни у кого — «Играть» гаснет
    //     с причиной (его скрин 8.09 вечера: «у одного просто симуляция запустилась»).
    {
      cr.race = {code: 'ABC123', role: 'a', since: careerToday()};
      var st0 = MP.state; MP.state = 'live';
      var peers0 = CC_RACE_PEERS;
      CC_RACE_PEERS = {zz: {id: 'zz', card: {handle: 'Zed', region: 'EU', sim: true}, div: cr.division, day: careerToday(), pow: 100}};
      cr.sim = false;
      var apart1 = ccRaceApartWhy(careerNext());
      cr.sim = true;
      var apart2 = ccRaceApartWhy(careerNext());
      out.steps.push('гонка, режимы: разные → ' + apart1 + ', одинаковые → ' + apart2);
      if (apart1 !== 'mode') fail('разные режимы в гонке не замечены: ' + apart1);
      if (apart2 === 'mode') fail('одинаковые режимы читаются как разные');
      if (ccRaceModeWhy()) fail('одинаковые режимы, а ccRaceModeWhy держит вечер: ' + ccRaceModeWhy());
      if (careerSimRowHTML().indexOf(L().ccRaceWhymode) >= 0) fail('подсказка о режимах стоит при одинаковых режимах');
      var kinds = CC_PLAYABLE.filter(function(k){ return k !== 'solo'; });
      var okSame = kinds.some(function(k){ return careerCanPlayKindOn(careerToday(), k); });
      cr.sim = false;
      if (careerSimRowHTML().indexOf(L().ccRaceWhymode) < 0) fail('под кнопками режима нет подсказки о расхождении');
      if (careerSimRowHTML().indexOf('Zed: ') < 0) fail('под кнопками режима не видно режим соперника');
      if (ccRaceModeWhy() !== L().ccRaceWhymode) fail('разные режимы, а ccRaceModeWhy молчит');
      var okMixed = kinds.some(function(k){ return careerCanPlayKindOn(careerToday(), k); });
      out.steps.push('гонка, кнопка «Играть»: одинаковые режимы → ' + okSame + ', разные → ' + okMixed);
      if (okMixed) fail('при разных режимах «Играть» в гонке всё ещё доступна');
      // Его скрин 10.09: «нажал just watching — перебросило на некст скрин». При разных режимах
      // карточка матча остаётся, кнопки режима под рукой, панель дня не подменяет вечер.
      var day0 = cr.day;
      var cupDay = [].concat.apply([], [...careerEvents().entries()].map(function(e){ return e[1].some(function(x){ return x.kind === 'cup'; }) ? [e[0]] : []; })).filter(function(d){ return d > day0; }).sort()[0];
      cr.day = cupDay; CC_RACE_PEERS.zz.day = cupDay;
      careerRenderHub('centre');
      var hubMixed = document.getElementById('screen-career-hub').innerHTML;
      if (document.querySelectorAll('#screen-career-hub .ch-simbtn').length !== 2) fail('при разных режимах в гонке кнопки режима пропали с экрана: next=' + (careerNext()||{}).type + ' day=' + careerToday() + ' play=' + !!document.querySelector('#screen-career-hub .ch-play') + ' grp=' + !!document.querySelector('#screen-career-hub .cc-act-grp') + ' locked=' + ((document.querySelector('#screen-career-hub .cc-day-locked')||{}).textContent||'') + ' why=' + ccRaceModeWhy() + ' mp=' + ccMpOn());
      if (document.querySelector('#screen-career-hub .cc-act-grp, #screen-career-hub .cc-day-locked')) fail('при разных режимах в гонке карточку матча подменила панель дня');
      if (!document.querySelector('#screen-career-hub .ch-play[disabled]')) fail('при разных режимах «Играть» не погашена на карточке матча');
      cr.day = day0; CC_RACE_PEERS.zz.day = day0; careerRenderHub('centre');
      // Комната открытого этапа в гонке — малая у всех, не от устройства (его скрин 10.09: n2100 vs n900).
      if (ccOpenRoom() !== Math.min(CC_OPEN_ROOM_SMALL, careerLadderEntrants())) fail('в гонке комната зависит от устройства: ' + ccOpenRoom());
      // Финал недели от разных вторников — врозь (годовая проба 10.09, 8.02 «state wf»).
      { var dayF = day0; var finDay = [].concat.apply([], [...careerEvents().entries()].map(function(e){ return e[1].some(function(x){ return x.kind === 'final'; }) ? [e[0]] : []; })).filter(function(d){ return d > day0; }).sort()[0];
        cr.day = finDay; CC_RACE_PEERS.zz.day = finDay; cr.sim = false; CC_RACE_PEERS.zz.card.sim = false;
        cr.wf = {monday: careerMonday(finDay), cut: 'a;b;c'};
        var lineF = ccRaceMyLine();
        if (!lineF.wfh) fail('в строке гонки нет отпечатка недели (wfh)');
        CC_RACE_PEERS.zz.wfh = lineF.wfh; var whySame = ccRaceApartWhy(careerNext());
        CC_RACE_PEERS.zz.wfh = 'other'; var whyDiff = ccRaceApartWhy(careerNext());
        out.steps.push('финал недели: одинаковый вторник → ' + whySame + ', разный → ' + whyDiff);
        // 10.09 вечером: список вторника теперь ОБЩИЙ (книга мира), поэтому воскресенье не разводится.
        if (whyDiff === 'table' || whySame === 'table') fail('финал недели всё ещё разводится по вторнику: ' + whyDiff + '/' + whySame);
        if (CC_RACE_SEED_KEYS.indexOf('wf') < 0) fail('список вторника не едет в книге мира');
        delete cr.wf; delete CC_RACE_PEERS.zz.wfh; cr.day = dayF; CC_RACE_PEERS.zz.day = dayF; CC_RACE_PEERS.zz.card.sim = true; }
      // Книга мира несёт и рынок пар, и сид жизни пар (его скрин 10.09: пул 160 против 161).
      { var wp = ccRaceWorldPack(); if (!wp.dev || !wp.duoSplits || !wp.trios || !wp.splits || !wp.cseed) fail('книга мира без рынка пар или сида: ' + Object.keys(wp).join(','));
        var ds0 = cr.duoSplits, tr0 = cr.trios, sp0 = CAREER.splits;
        ccRaceWorldApply({dev:{}, duoSplits:{'aa+bb':'2026-01-01'}, trios:{'cc+dd':'ee'}, splits:{}, cseed:'zz-seed'});
        if (!(cr.duoSplits && cr.duoSplits['aa+bb']) || !(cr.trios && cr.trios['cc+dd']) || CC_RACE_WORLD_SEED !== 'zz-seed') fail('книга мира не легла: ' + JSON.stringify([cr.duoSplits, cr.trios, CC_RACE_WORLD_SEED]));
        if (ccWorldSeed() !== 'zz-seed') fail('сид мира в гонке не старшего: ' + ccWorldSeed());
        delete cr.race.wseed; if (ccWorldSeed() !== ccCareerSeed()) fail('без сида старшего мир не свой');
        cr.duoSplits = ds0; cr.trios = tr0; CAREER.splits = sp0; CC_RACE_WORLD_SEED = null; ccWorldReset(); }
      // Соло: квал врозь, финал на сто — общий (его скрин 10.09: два разных финала FNCS Solos).
      { var dS = day0; cr.day = '2026-01-06'; CC_RACE_PEERS.zz.day = cr.day; cr.sim = false; CC_RACE_PEERS.zz.card.sim = false;
        var wq = ccRaceApartWhy(careerNext());
        cr.day = '2026-01-25'; CC_RACE_PEERS.zz.day = cr.day;
        var wf = ccRaceApartWhy(careerNext());
        out.steps.push('соло в гонке: квал → ' + wq + ', финал → ' + wf);
        if (wq !== 'solo') fail('соло-квал в гонке не разведён: ' + wq);
        if (wf === 'solo') fail('финал соло на сто всё ещё врозь: ' + wf);
        cr.day = dS; CC_RACE_PEERS.zz.day = dS; CC_RACE_PEERS.zz.card.sim = true; }
      // Рынок пар — только записанные (его слово 10.09: «Malibuca Scroll в дуо не играли»).
      { var pd = careerPools().duos || []; var madeUp = pd.filter(function(d){ return d._remade && !ccRecordedTogether(d.cards[0], d.cards[1]); });
        if (madeUp.length) fail('в пуле выдуманные пары: ' + madeUp.slice(0,3).map(function(d){ return d.cards.map(function(c){ return c.handle; }).join('&'); }).join(', '));
        out.steps.push('рынок пар: пересобранных ' + pd.filter(function(d){ return d._remade; }).length + ', выдуманных 0'); }
      // ОДИН МИР НА ГОНКУ (его слово 10.09 «делай»): хиты, финалы навылет и ЛАНы — общие вечера.
      { var dW = cr.day;
        var kinds = [['2026-02-13', 'reload'], ['2026-03-14', 'major heats'], ['2026-05-30', 'summit']];
        kinds.forEach(function(pair){ cr.day = pair[0]; CC_RACE_PEERS.zz.day = pair[0];
          var nx = careerNext(); if (!nx) return;
          var w = ccRaceApartWhy(nx);
          if (w === 'heat' || w === 'lan' || w === 'table') fail(pair[1] + ' всё ещё врозь: ' + w); });
        cr.day = dW; CC_RACE_PEERS.zz.day = dW; }
      // Своя строка записи в гонке — настоящая (иначе запись нельзя отдать соседу).
      { var youT = {squad:[careerCard()]};
        if (ccSeedRow(youT, youT, ccStageSeatRow) === 'you') fail('в гонке своя строка записи всё ещё you');
        var race0 = cr.race; delete cr.race;
        if (ccSeedRow(youT, youT, ccStageSeatRow) !== 'you') fail('без гонки своя строка перестала быть you');
        cr.race = race0; }
      // Хит — один на комнату: люди меняются местами с соседями старшего.
      { var mk = function(h){ return {squad:[{handle:h, region:'EU'}], name:h}; };
        var heats = [[mk('a1'), mk('a2'), {squad:[careerCard()], isYou:true}],
                     [mk('b1'), mk(CC_RACE_PEERS.zz.card.handle), mk('b3')]];
        var youTeam = heats[0][2];
        var lock0 = CC_RACE_LOCK, room0 = CC_RACE_ROOM0;
        CC_RACE_LOCK = true; CC_RACE_ROOM0 = null;
        var at = ccRaceHeatTogether(heats, youTeam);
        CC_RACE_LOCK = lock0; CC_RACE_ROOM0 = room0;
        var hasMe = at >= 0 && heats[at].some(function(t){ return t === youTeam; });
        var hasRiv = at >= 0 && heats[at].some(function(t){ return (t.squad||[]).some(function(c){ return hKey(c) === hKey(CC_RACE_PEERS.zz.card); }); });
        out.steps.push('хит комнаты: индекс ' + at + ', я ' + hasMe + ', соперник ' + hasRiv);
        if (at < 0 || !hasMe || !hasRiv) fail('хит не свёл комнату: at=' + at + ' me=' + hasMe + ' riv=' + hasRiv);
        if (heats[0].length !== 3 || heats[1].length !== 3) fail('размер хитов поехал: ' + heats.map(function(h){ return h.length; }).join('/')); }
      // Книга мира несёт записи посева.
      { cr.majorSeed = {n:1, season:1, size:2, rows:[['x']]};
        var wp = ccRaceWorldPack();
        if (!wp.seeds || !wp.seeds.majorSeed) fail('книга мира без записей посева');
        delete cr.majorSeed;
        ccRaceWorldApply({dev:{}, seeds:{majorSeed:{n:2, season:1, size:2, rows:[]}}});
        if (!cr.majorSeed || cr.majorSeed.n !== 2) fail('запись посева от старшего не легла');
        delete cr.majorSeed; }
      // ДОСКИ ОДНИ НА ГОНКУ: вечер, сыгранный без меня, приезжает актом 'res' и ложится один раз.
      { var money0 = JSON.parse(JSON.stringify(careerMoney().rows));
        var res = {key:'2026-03-01|cup', by:'zz', day:'2026-03-01', yr:'1', fs:'1:S40',
                   money:{'Ghosty':10000}, pr:{'Ghosty':[500]}};
        var first = ccEvResApply(res);
        var again = ccEvResApply(res);
        var row = careerMoney().rows['Ghosty'];
        out.steps.push('чужой вечер в доски: ' + (row ? row.usd + '$/' + row.events : 'нет') + ', повтор ' + again);
        if (!first || again) fail('чужой вечер лёг дважды или не лёг: ' + first + '/' + again);
        if (!row || row.usd !== 10000 || row.events !== 1) fail('деньги чужого вечера не легли: ' + JSON.stringify(row));
        var pr = careerPrTally().rows['Ghosty'];
        if (!pr || !pr.v.length) fail('рейтинг чужого вечера не лёг');
        delete careerMoney().rows['Ghosty']; delete careerPrTally().rows['Ghosty']; }
      /* СВОЯ СТРОКА ВЕЧЕРА — ТОЖЕ В КОПИЛКУ. У соседа по гонке я обычный человек сцены, и мои
         призовые за вечер, который он не играл, должны доехать до его доски. Его скрин 11.09:
         у себя «Твой состав: Malibuca» 58 вечеров $553k, у соседа «Malibuca» 50 и $324k. */
      { var meCard = careerCard();
        var mineTeam = {name: L().yourTeamPrefix + meCard.handle + ' & Ghosty3', isYou:true};
        var otherTeam = {name: 'Ghosty4 & Ghosty5'};
        ccEvDeltaStart('2026-03-05|cup');
        careerMoneyAdd([mineTeam, otherTeam], function(place){ return place === 1 ? 20000 : 4000; });
        var pack = CC_EV_DELTA;
        out.steps.push('копилка вечера: ' + Object.keys(pack.money).join(','));
        if (!pack.money[meCard.handle]) fail('своя строка не поехала соседу: ' + JSON.stringify(pack.money));
        if (!pack.money['Ghosty4']) fail('чужая строка не поехала: ' + JSON.stringify(pack.money));
        // И в доске она зовётся ником, без подписи состава.
        if (careerMoney().rows[L().yourTeamPrefix + meCard.handle]) fail('в доске денег строка с подписью состава');
        var own = careerMoney().rows[meCard.handle];
        if (!own || !own.you) fail('своя строка доски не найдена по нику: ' + JSON.stringify(Object.keys(careerMoney().rows).slice(0, 8)));
        ccEvDeltaSend();
        // Чужая копилка со МНОЙ внутри мою строку не трогает.
        var was = careerMoney().rows[meCard.handle].usd;
        var mineRes = {}; mineRes[meCard.handle] = 99999; mineRes['Ghosty6'] = 7000;
        ccEvResApply({key:'2026-03-06|cup', by:'zz', day:'2026-03-06', money:mineRes, pr:{}});
        if (careerMoney().rows[meCard.handle].usd !== was) fail('чужая копилка переписала мою строку');
        if (!careerMoney().rows['Ghosty6']) fail('чужая строка из той же копилки не легла');
        ['Ghosty3','Ghosty4','Ghosty5','Ghosty6'].forEach(function(n){ delete careerMoney().rows[n]; }); }
      // Свой вечер помечен тем же ключом — присланный дубль не считается.
      { ccEvDeltaStart('2026-03-02|cup'); ccEvDeltaSend();
        if (ccEvResApply({key:'2026-03-02|cup', by:'zz', money:{'Ghosty2':5000}, pr:{}})) fail('свой вечер посчитан второй раз');
        if (careerMoney().rows['Ghosty2']) fail('дубль своего вечера всё же лёг'); }
      var tile = careerRaceTileHTML();
      if (tile.indexOf('&#128065;') < 0 || tile.indexOf('&#127918;') < 0) fail('на плитке гонки нет значков режима (глаз/геймпад)');
      CC_RACE_PEERS = peers0; MP.state = st0; delete cr.race; cr.sim = false;
    }
    // 12. Расписания года в ленте НЕТ (его слово 9.09 отменяет 8.09).
    {
      cr.told = {};
      var n0 = (cr.news || []).length;
      careerAnnounceTick();
      // 9.09: его слово «не надо подобные посты про даты» — расписания в ленте нет, старое вычищается.
      if ((cr.news || []).some(function(n){ return n.k === 'ccNewsRoadmap'; })) fail('расписание года всё ещё постится');
      cr.news.unshift({id: 'old-road', k: 'ccNewsRoadmap', a: [2026], day: cr.day});
      cr.news.unshift({id: 'old-road-reply', k: 'ccPostDates', a: ['x'], q: 'old-road', day: cr.day});
      careerAnnounceTick();
      if ((cr.news || []).some(function(n){ return n.k === 'ccNewsRoadmap' || n.q === 'old-road'; })) fail('старое расписание и ответы на него не вычищены');
      out.steps.push('расписания года в ленте нет, старое вычищено');
    }
    // 9. Команда поверх гонки на одном коде вычищается при загрузке.
    {
      cr.race = {code: 'ABC123', role: 'a', since: careerToday()};
      cr.mp = {code: 'abc123', role: 'b'};
      var tidy = ccMpRaceTidy();
      if (!tidy || cr.mp) fail('команда поверх гонки не вычищена');
      cr.mp = {code: 'ZZZ999', role: 'a'};
      if (ccMpRaceTidy() || !cr.mp) fail('чужая команда с другим кодом вычищена зря');
      delete cr.mp; delete cr.race;
      out.steps.push('команда поверх гонки: вычищена');
    }
    // 6. Обычный эфир — десять секунд, марафон — двадцать (его слово 8.09).
    var secs = function(id){ var k = ccStreamKind(id);
      return Math.max(8, Math.round((k.hours || 4) * CC_TV_PLAIN_SECS_PER_HOUR * 1000 / CC_TV_TICK)) * CC_TV_TICK / 1000; };
    out.steps.push('эфир: обычный ' + secs('grind') + ' с, марафон ' + secs('long') + ' с');
    if (Math.abs(secs('grind') - 10) > 0.6) fail('обычный эфир не десять секунд: ' + secs('grind'));
    if (Math.abs(secs('long') - 20) > 0.6) fail('марафон не двадцать секунд: ' + secs('long'));
  }catch(e){ if(!out.fail) out.fail = String(e && e.message || e) + ' ' + String(e && e.stack || '').split('\\n')[1]; }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsaway-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + HEAD + src + BOOT);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('ошибки страницы: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('лента других регионов, подписка через океан и ответ под своим постом на месте');
fs.rmSync(dir, { recursive: true, force: true });
