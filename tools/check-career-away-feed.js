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
        if (whyDiff !== 'table') fail('финал недели от разных вторников не разведён: ' + whyDiff);
        if (whySame === 'table') fail('одинаковый вторник читается как разный');
        delete cr.wf; delete CC_RACE_PEERS.zz.wfh; cr.day = dayF; CC_RACE_PEERS.zz.day = dayF; CC_RACE_PEERS.zz.card.sim = true; }
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
