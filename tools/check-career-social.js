// Соцсеть карьеры: статус на человеке, анкета свободного агента, карточка PR
// под постом и скрин таблицы под вечером.
//
// Всё это рисуется только в ленте, то есть проверяется только через неё: пост
// пишется теми же функциями, что и в игре, а потом читается разметка. Ошибки
// здесь настоящие — например, карточка, которая молча выходит пустой, потому
// что PR-строки у человека нет.
//
//   node tools/check-career-social.js
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
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v: 1,
      player: {nick: 'AdMan', age: 16, source: 'rookie', country: 'de',
               countryPing: 15, closeRangeEdge: 6, region: 'EU',
               ovr: 54, role: 'roleIGL', attrs: null, ageEdge: 4, photo: null,
               handle: null, cardRegion: null, nat: null},
      // Дивизион 1: только там в поиске дуо стоят настоящие имена сцены
      // (ccRealNamesHere), а значит и анкеты. Ниже список генерируется.
      career: {season: 1, day: CC_YEAR_FROM, division: 1, earnings: 0, tokens: [], log: []},
      partners: []
    }));
    var s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();

    // Развод настоящей пары — той же записью, какую делает careerSceneTurn:
    // ключ из двух ников по алфавиту, и кэш пулов сброшен, иначе комната
    // осталась бы вчерашней и половинки по-прежнему стояли бы вместе.
    var duo = (careerPools().duos || []).find(d => (d.cards || []).length === 2);
    if (!duo) throw new Error('в пуле нет ни одной пары');
    var who = duo.cards[0], other = duo.cards[1];
    var t = careerPrTally();
    t.rows[who.handle] = {v: [[900, 4], [700, 40], [520, 120]], n: 3};

    // 1. Анкета: свободный агент с требованиями.
    CAREER.splits = {};
    CAREER.splits[[hKey(who), hKey(other)].sort().join('+')] = careerToday();
    CC_POOLS = null; CC_NOW_CARDS = {};
    var ad = ccAdMake(who);
    out.steps.push('анкета: ищет ' + ad.want + ', див ' + ad.div + '+, PR от ' + ad.pr);
    if (!(ad.pr > 0)) { out.fail = 'порог PR в анкете нулевой'; throw new Error(out.fail); }
    if (!ccAdOf(who.handle)) { out.fail = 'анкета не открыта'; throw new Error(out.fail); }

    // 2. Статус на человеке.
    var st = ccWhoStatus(who.handle);
    out.steps.push('статус: ' + (st ? st.kind + ' / ' + st.text : 'НЕТ'));
    if (!st || st.kind !== 'fa') { out.fail = 'свободный агент не помечен F/A'; throw new Error(out.fail); }

    // 3. Пост с карточкой под ним.
    careerNews('flat', 'ccPostLfdWant', [ccHandle(who.handle), ad.div, ad.pr],
               {card: ccHandle(who.handle)});
    var html = careerNewsHTML(4);
    var has = function(cls){ return html.indexOf(cls) >= 0; };
    out.steps.push('в ленте: карточка=' + has('x-card') + ' число=' + has('x-card-num') +
                   ' кривая=' + has('x-spark') + ' статус=' + has('x-who'));
    if (!has('x-card') || !has('x-card-num')) { out.fail = 'карточки PR под постом нет'; throw new Error(out.fail); }
    if (!has('x-spark')) { out.fail = 'кривой PR под постом нет'; throw new Error(out.fail); }
    if (!has('x-who')) { out.fail = 'статуса рядом с ником нет'; throw new Error(out.fail); }

    // Био человека сцены — не пустая строка и не своё био.
    var bio = ccBioLine(who.handle);
    out.steps.push('био: ' + bio);
    if (!bio) { out.fail = 'био человека сцены пустое'; throw new Error(out.fail); }

    // 4. Анкета в поиске дуо и закрытая кнопка, когда не проходишь по PR.
    ccDuoFindOpen();
    var find = document.getElementById('duoFindBody').innerHTML;
    out.steps.push('в поиске: анкета=' + (find.indexOf('cc-buy-ad') >= 0) +
                   ' отказ=' + (find.indexOf('cc-ad-no') >= 0));
    if (find.indexOf('cc-buy-ad') < 0) { out.fail = 'анкеты в поиске дуо нет'; throw new Error(out.fail); }
    // У игрока PR-строки нет вовсе, значит по порогу он не проходит — и кнопка
    // обязана погаснуть. Это и есть смысл требований.
    if (find.indexOf('cc-ad-no') < 0) { out.fail = 'кнопка не гаснет при недоборе PR'; throw new Error(out.fail); }
    ccDuoFindClose();

    // 5. Скрин таблицы вечера собирается из комнаты.
    var room = [{name: 'A', stagePts: 300}, {name: 'B', stagePts: 200}, {name: 'C', stagePts: 100}];
    var shot = ccStageShot(room, room[2], 5, 'Проба');
    out.steps.push('скрин: строк ' + shot.rows.length + ', своя ' + shot.me);
    if (!shot || shot.rows.length !== 3) { out.fail = 'скрин таблицы собрался не той длины'; throw new Error(out.fail); }

    // 6. Объявленная точка высадки: комната уже разложена, объявление берётся
    //    из неё и ничего не бросает заново.
    var zone = ALL_LANDING_ZONES[3];
    var pre = new Map();
    pre.set(zone, [{name: who.handle, pow: 90, squad: [{handle: who.handle}]}]);
    var me = {stageLog: [], isYou: true};
    var calls = ccDropCalls(pre, me, 'Проба');
    out.steps.push('высадка вслух: ' + (calls || 'ПУСТО'));
    if (!calls || calls.indexOf('@') < 0) { out.fail = 'никто не объявил точку'; throw new Error(out.fail); }
    if (careerNewsHTML(3).indexOf(who.handle) < 0) { out.fail = 'объявления нет в ленте'; throw new Error(out.fail); }
    // И карта с обведённой точкой — так это выглядит у настоящих.
    var callPost = (CAREER.career.news || []).find(function(n){ return n.k === 'ccPostDropCall'; });
    var mapHTML = ccDropMapHTML(callPost);
    out.steps.push('карта под объявлением: ' + (mapHTML ? 'есть' : 'НЕТ'));
    if (!mapHTML || mapHTML.indexOf('x-map') < 0) { out.fail = 'под объявлением нет карты'; throw new Error(out.fail); }
    if (mapHTML.indexOf('%') < 0) { out.fail = 'рамка на карте не поставлена'; throw new Error(out.fail); }

    // 7. Кастомка с порогом по PR: пока PR нет — не зовут; с PR — зовут, и
    //    вечер платит ровно за победы.
    if (ccCustomInvited()) { out.fail = 'на кастомку позвали без PR'; throw new Error(out.fail); }
    var meKey = CAREER.player.handle || CAREER.player.nick;
    careerPrTally().rows[meKey] = {v: [[CC_CUSTOM_PR + 5000, 5]], n: 1, you: true};
    if (!ccCustomInvited()) { out.fail = 'с набранным PR на кастомку не зовут'; throw new Error(out.fail); }
    var was = CAREER.career.balance || 0;
    var r = ccCustomPlay();
    out.steps.push('кастомка: побед ' + r.wins + ' из ' + CC_CUSTOM_GAMES + ', $' + r.cash);
    if (r.cash !== r.wins * CC_CUSTOM_PER_WIN) { out.fail = 'выплата кастомки не сходится с победами'; throw new Error(out.fail); }
    if ((CAREER.career.balance || 0) !== was + r.cash) { out.fail = 'деньги за кастомку не пришли на счёт'; throw new Error(out.fail); }
    /* И вечер, за который никогда не платят, — не вечер: сильный игрок за
       десять кастомок обязан выиграть хотя бы одну. Кривая шанса живёт в
       ccCustomPlay, и это её единственная проверка. */
    CAREER.player.ovr = 96; CAREER.player.ovrExact = 96;
    var top = 0, day0 = careerToday();
    for (var i = 0; i < 10; i++) { CAREER.career.day = ccAddDays(day0, i); top += ccCustomPlay().wins; }
    CAREER.career.day = day0;
    out.steps.push('кастомки у топа: побед за 10 вечеров ' + top);
    if (!top) { out.fail = 'сильный игрок не выиграл ни одной кастомки за десять вечеров'; throw new Error(out.fail); }

    // 8. Новостной хаб на центре: полки, выбранная новость и КАРТИНКА к ней.
    var hub = careerNewsHubHTML();
    out.steps.push('хаб: вкладок ' + (hub.match(/nh-tab/g) || []).length +
                   ', строк ' + (hub.match(/nh-row/g) || []).length +
                   ', арт=' + (hub.indexOf('nh-art') >= 0));
    if (hub.indexOf('nh-row') < 0) { out.fail = 'в новостном хабе нет ни одной новости'; throw new Error(out.fail); }
    if (hub.indexOf('nh-art') < 0) { out.fail = 'у новости нет картинки'; throw new Error(out.fail); }
    // Полка выводится из ключа: развод — это трансфер, а не «сцена вообще».
    var split = (CAREER.career.news || []).find(function(n){ return n.k === 'ccPostDuoSplitBy'; });
    if (split && ccNewsCat(split) !== 'moves') { out.fail = 'развод не попал в трансферы'; throw new Error(out.fail); }
    // Своя строка — на полке «ты», кем бы её ни написал режим.
    var mine = (CAREER.career.news || []).find(function(n){ return ccPostAuthor(n).you; });
    if (mine && ccNewsCat(mine) !== 'you') { out.fail = 'свой пост не попал на свою полку'; throw new Error(out.fail); }

    // 9. Что можно сделать под постом: написать свободному агенту и поручиться.
    var adPost = (CAREER.career.news || []).find(function(n){ return n.k === 'ccPostLfdWant'; });
    var acts = ccPostActsHTML(adPost, ccPostAuthor(adPost), ccPostStats(adPost, ccPostAuthor(adPost)));
    out.steps.push('под анкетой: ' + (acts.indexOf('careerPostDm') >= 0 ? 'ЛС' : '—') +
                   ' ' + (acts.indexOf("careerReply") >= 0 ? 'ответы' : '—'));
    if (acts.indexOf('careerPostDm') < 0) { out.fail = 'под анкетой нет кнопки написать'; throw new Error(out.fail); }
    if (acts.indexOf("'v'") < 0) { out.fail = 'под анкетой нет ответа V'; throw new Error(out.fail); }
    // Воуч пишется той же буквой «V», какой его пишут настоящие: это ответ под
    // постом, а не отдельная кнопка сбоку.
    careerReply(adPost.id, 'v');
    if (adPost.re !== 'v') { out.fail = 'ответ V не записался в пост'; throw new Error(out.fail); }
    if (!ccVouched(who.handle)) { out.fail = 'воуч не записался'; throw new Error(out.fail); }
    if (!(CAREER.career.news || []).some(function(n){ return n.k === 'ccPostVouch'; }))
      { out.fail = 'воуч не попал в ленту'; throw new Error(out.fail); }

    // 10. Подписки — решение игрока: жмёт он, а не режим.
    careerFollow(who.handle);
    if (!ccFollowing(who.handle)) { out.fail = 'подписка не записалась'; throw new Error(out.fail); }
    // И счётчик «подписки» в профиле считает именно их — его правка 3 сентября.
    CH_SOCIAL = 'me';
    careerRenderHub('social');
    var counts = document.querySelector('#chBody .x-counts');
    var following = counts ? counts.children[1].textContent : '';
    out.steps.push('в профиле подписок: ' + following.replace(/\s+/g, ' ').trim());
    if (following.indexOf('1') !== 0) { out.fail = 'подписка не попала в счётчик профиля'; throw new Error(out.fail); }
    careerUnfollow(who.handle);
    if (ccFollowing(who.handle)) { out.fail = 'отписка не сработала'; throw new Error(out.fail); }

    // 11. Уведомления: лайки на своём посте и новый подписчик за рост охвата.
    CAREER.career.notes = []; CAREER.career.noteReach = 0; CAREER.career.reach = 4200;
    (CAREER.career.news || []).forEach(function(n){ delete n.noted; });
    careerNotesTick();
    var kinds = careerNotes().map(function(t){ return t.kind; });
    out.steps.push('уведомления: ' + (kinds.join(',') || 'НЕТ') + ', непрочитано ' + careerNotesNew());
    if (!kinds.length) { out.fail = 'уведомления не приходят'; throw new Error(out.fail); }
    if (kinds.indexOf('follow') < 0) { out.fail = 'подписчик за рост охвата не пришёл'; throw new Error(out.fail); }
    careerNoteMarkSeen();
    out.steps.push('после открытия: seen=' + CAREER.career.noteSeen +
                   ' ids=' + careerNotes().map(function(t){ return t.id; }).join(',') +
                   ' непрочитано ' + careerNotesNew());
    if (careerNotesNew() !== 0) { out.fail = 'открытые уведомления не гаснут'; throw new Error(out.fail); }

    /* 12. Ответы — ТОЛЬКО под чужими постами и только там, где есть повод.
       Под своим постом отвечать некому: его правка 2 сентября, «зачем под свой
       твит чет писать». */
    var own = (CAREER.career.news || []).find(function(n){ return ccPostAuthor(n).you; });
    if (ccPostActsHTML(own, ccPostAuthor(own), ccPostStats(own, ccPostAuthor(own))))
      { out.fail = 'под своим постом предлагают ответить'; throw new Error(out.fail); }
    if (ccReplyOpts({k:'ccNewsCongrats'}).indexOf('w') < 0)
      { out.fail = 'под чужим титулом нет ответа W'; throw new Error(out.fail); }
    if (ccReplyOpts({k:'ccNewsResult'}))
      { out.fail = 'ответы предлагают под постом, где отвечать нечего'; throw new Error(out.fail); }
    // Дважды ответить нельзя, и ответ виден в комментариях под постом.
    careerReply(adPost.id, 'gl');
    if (adPost.re !== 'v') { out.fail = 'ответить можно дважды'; throw new Error(out.fail); }
    if (ccPostComments(adPost, ccPostAuthor(adPost), ccPostStats(adPost, ccPostAuthor(adPost)))
          .indexOf('x-co-mine') < 0)
      { out.fail = 'свой ответ не виден в комментариях'; throw new Error(out.fail); }

    /* 13. Пост человека сцены о вечере несёт СВОЮ таблицу — как у настоящих.
       Его правка 3 сентября: у игроков сцены скринов таблиц не было. */
    var room = [{name:'A & B', stagePts:300, squad:[{handle:'A'}], wins:2},
                {name:'C & D', stagePts:200, squad:[{handle:'C'}]},
                {name:'E & F', stagePts:150, squad:[{handle:'E'}]},
                {name:'G & H', stagePts:100, squad:[{handle:'G'}]}];
    var extras = careerD1Extras(room, careerToday(), 'Проба');
    var withTbl = extras.filter(function(e){ return e[3] && e[3].tbl && e[3].tbl.rows.length; });
    out.steps.push('посты сцены с таблицей: ' + withTbl.length + ' из ' + extras.length);
    if (extras.length && !withTbl.length)
      { out.fail = 'пост человека сцены пришёл без таблицы'; throw new Error(out.fail); }
    // И отмечена в ней СВОЯ строка автора, а не игрока.
    if (withTbl.length && !withTbl[0][3].tbl.me)
      { out.fail = 'в таблице сцены не отмечен её автор'; throw new Error(out.fail); }

    /* 14. Репост, цитата, свой ответ словами, лента подписок и чужой профиль —
       всё, что добавлено 3 сентября по его списку. */
    var other = (CAREER.career.news || []).find(function(n){ return !ccPostAuthor(n).you; });
    careerRepost(other.id);
    var repost = (CAREER.career.news || [])[0];
    if (repost.q !== other.id) { out.fail = 'репост не сослался на исходный пост'; throw new Error(out.fail); }
    if (ccQuoteHTML(repost).indexOf('x-quote') < 0) { out.fail = 'цитата не рисуется'; throw new Error(out.fail); }
    careerRepost(other.id);
    if ((CAREER.career.news || []).filter(function(n){ return n.q === other.id; }).length !== 1)
      { out.fail = 'репостнуть можно дважды'; throw new Error(out.fail); }
    // Свой ответ словами — сколько угодно, и он виден в комментариях.
    CC_REPLY_OPEN = other.id;
    CH_SOCIAL = 'feed';                 // иначе соцсеть открывается на личке
    careerRenderHub('social');
    var box = document.getElementById('ccReplyBox' + other.id);
    if (!box) { out.fail = 'поля ответа нет под постом'; throw new Error(out.fail); }
    box.value = 'W смотрел вживую';
    careerReplyWrite(other.id);
    if (!(other.res || []).length) { out.fail = 'ответ словами не записался'; throw new Error(out.fail); }
    out.steps.push('ответы: ' + other.res.map(function(r){ return r.t; }).join(' | '));
    // Лента подписок показывает только своих и тех, на кого подписан.
    careerFollow(who.handle);
    CH_FEED = 'subs';
    var subs = careerFeedHTML();
    CH_FEED = 'all';
    out.steps.push('в подписках постов: ' + (subs.match(/x-post /g) || []).length);
    if (subs.indexOf('x-post') < 0) { out.fail = 'лента подписок пустая при наличии подписки'; throw new Error(out.fail); }
    // Профиль чужого: био, карточка и его посты.
    var prof = careerWhoHTML(who.handle);
    if (prof.indexOf('x-card') < 0 || prof.indexOf('careerFollow') + prof.indexOf('careerUnfollow') < 0)
      { out.fail = 'в чужом профиле нет карточки или кнопки подписки'; throw new Error(out.fail); }
    out.steps.push('чужой профиль: собран');
    /* Анонс ближайшего события и реакции на него. Проходим год днями: анонс
       выходит за две недели до Мейджора, ЛАНа или Reload — значит за год их
       должно быть несколько, и под каждым цитата от человека сцены. */
    CAREER.career.told = {};
    var day0 = careerToday();
    for (var d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1)) {
      CAREER.career.day = d;
      careerAnnounceTick();
    }
    CAREER.career.day = day0;
    var ann = (CAREER.career.news || []).filter(function(n){ return n.k === 'ccNewsAnnounce'; });
    var hype = (CAREER.career.news || []).filter(function(n){ return n.k === 'ccPostHype' && n.q; });
    out.steps.push('анонсов за год: ' + ann.length + ', реакций цитатой: ' + hype.length);
    if (!ann.length) { out.fail = 'за год не вышло ни одного анонса'; throw new Error(out.fail); }
    if (!hype.length) { out.fail = 'сцена не отвечает на анонс'; throw new Error(out.fail); }
    if (!ann[0].art) { out.fail = 'у анонса нет арта события'; throw new Error(out.fail); }

    // 15. Карусель новостей: точки есть, и их столько же, сколько новостей.
    var hub2 = careerNewsHubHTML();
    var dots = (hub2.match(/nh-dot/g) || []).length;
    out.steps.push('карусель: точек ' + dots);
    if (!dots) { out.fail = 'у новостей нет карусели'; throw new Error(out.fail); }

    // 14. У клуба есть свой голос — и пост подписывается им, а не прессой.
    var org = (ccWhoCard(who.handle) || {}).org || 'TSM';
    careerNews('good', 'ccPostOrgWin', [org, '@' + ccHandle(who.handle), 'Проба']);
    var by = ccPostAuthor((CAREER.career.news || [])[0]);
    out.steps.push('пост клуба от: ' + (by ? by.name : 'НИКОГО'));
    if (!by || by.name !== org) { out.fail = 'пост про титул подписан не клубом'; throw new Error(out.fail); }
  }catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncssocial-'));
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
console.log('соцсеть карьеры: анкета, статус, карточка PR и скрин таблицы на месте');
fs.rmSync(dir, { recursive: true, force: true });
