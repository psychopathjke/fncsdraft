// Эфир с турнира: кнопка «Играть в эфире», окошко трансляции поверх вечера,
// и то, чем за него платят.
//
// Правило, ради которого написано: стрим с турнира ЗАБИРАЕТ СИЛУ. Всё
// остальное здесь — про то, что вечер при этом остался вечером: турнир
// доигрывается, окошко висит и снимается, эфир записан в журнал партнёрки, а
// результат довешивает подписчиков.
//
//   node tools/check-career-stream-cup.js
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
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // Метка и выборы по ходу вечера — за игрока, как в остальных харнессах.
  setInterval(function(){
    const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {steps: [], fails: [], errs: null, fail: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const ccProbeSeat = () => {
    if (careerPartnerCard()) return;
    const s = careerDms().find(x => x.state === 'offer' && !x.who.org && !x.who.brand);
    if (s) { careerDmAccept(s.id); careerRenderHub('centre'); }
  };
  const ccFirstCupDay = () => {
    const days = careerYearDays();
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
      if ((days.get(d)||[]).some(e => e.kind === 'cup')) return d;
    throw new Error('the year holds no divisional cup at all');
  };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v: 1,
      player: {nick: 'LiveMan', age: 16, source: 'rookie', country: 'de',
               countryPing: 15, closeRangeEdge: 6, region: 'EU',
               ovr: 54, role: 'roleIGL', attrs: null, ageEdge: 4, photo: null,
               handle: null, cardRegion: null, nat: null},
      career: {season: 1, day: ccFirstCupDay(), division: 5, earnings: 0, tokens: [],
               log: [], twitch: 4000, reach: 30000},
      partners: []
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry(); ccProbeSeat();

    // ---- сила: эфир стоит ровно CC_STREAM_POW -------------------------------
    const cards = [careerCard()].concat(careerMates());
    const powOff = careerYouTeam(cards).pow;
    CC_STREAM_LIVE = true;
    const powOn = careerYouTeam(cards).pow;
    CC_STREAM_LIVE = false;
    out.steps.push('team power: ' + powOff + ' -> ' + powOn + ' on air');
    check('an evening on air costs power', powOff - powOn === CC_STREAM_POW,
          powOff + ' vs ' + powOn);
    check('and costs nothing when the stream is off', careerYouTeam(cards).pow === powOff);

    // ---- кнопка на панели дня ----------------------------------------------
    const live = document.querySelector('#screen-career-hub .ch-live-go');
    check('the live button is on the day of a tournament', !!live);
    if (!live) { out.fail = 'no live button on a cup day'; throw new Error(out.fail); }
    check('and it is pressable', !live.disabled, live.title);
    out.steps.push('live button: ' + live.textContent.trim());
    /* Цена написана под кнопкой, не только в подсказке при наведении — его
       слово 5 сентября: «−10 будто, и это должно быть написано». */
    const liveHint = document.querySelector('#screen-career-hub .ch-live-hint');
    check('the price of the air is written under the button', !!liveHint &&
          liveHint.textContent.indexOf(L().ccStreamCupHint(CC_STREAM_CUP.energy, CC_STREAM_POW)) >= 0,
          liveHint ? liveHint.textContent : 'no hint');
    check('and the price is ten', CC_STREAM_POW === 10, String(CC_STREAM_POW));
    out.steps.push('hint under the button: ' + (liveHint ? liveHint.textContent : '—'));

    // ---- вкладка стримов знает про сегодняшний турнир ------------------------
    careerTab('streams');
    const cupBtn = document.querySelector('#chBody .tv-go-cup');
    check('the streams tab offers tonight tournament', !!cupBtn,
          cupBtn ? '' : 'no .tv-go-cup on a cup day');
    /* Причина, а не цена. Его скрин 5 сентября («в трио не работает кнопка»):
       под выключенной кнопкой стояло «20 energy» — та же строка, что цена на
       включённой. Теперь строка говорит, сколько есть и сколько нужно, и её
       несут и турнирная кнопка, и обычные виды эфира. */
    const eKeep = CAREER.career.energy;
    CAREER.career.energy = 5;
    careerTab('streams');
    const offBtn = document.querySelector('#chBody .tv-go-cup');
    check('the streams tab button is off on 5 energy', !!offBtn && offBtn.disabled);
    check('and carries the reason, not the price', !!offBtn && offBtn.textContent.indexOf(L().ccStreamNeed(CC_STREAM_CUP.energy, 5)) >= 0,
          offBtn ? offBtn.textContent.replace(/\\s+/g, ' ').trim() : 'no button');
    const offRanked = document.querySelector('#chBody .tv-go:not(.tv-go-cup)');
    check('so does an ordinary stream button', !!offRanked && offRanked.textContent.indexOf(L().ccStreamNeed(30, 5)) >= 0,
          offRanked ? offRanked.textContent.replace(/\\s+/g, ' ').trim() : 'no button');
    CAREER.career.energy = eKeep;
    careerTab('centre');

    // ---- метка ставится до эфира, иначе окно метки съело бы вечер -----------
    careerSpotEnsure();

    const e0 = careerEnergy(), tw0 = (CAREER.career.twitch||0);
    const skipper = setInterval(() => {
      const b = document.getElementById('majorSkipBtn');
      if (b && !b.disabled) b.click();
    }, 20);
    document.querySelector('#screen-career-hub .ch-live-go').click();

    let card = null, sawMini = false, sawChat = false, sawRun = false, sawOnAir = false;
    for (let i = 0; i < 4000 && !card; i++) {
      await wait(25);
      if (document.getElementById('ccTvFrame')) {
        sawMini = true;
        // Рамка отодвигает экран прогона полями — это класс на body.
        if (document.body.classList.contains('cc-onair')) sawOnAir = true;
        if (document.querySelectorAll('#ccTvFrame .cc-tvm-msg').length) sawChat = true;
        const run = document.getElementById('ccTvRun');
        if (run && /\\d/.test(run.textContent) && run.textContent.indexOf(L().ccTvWait) < 0) sawRun = true;
      }
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(skipper);
    if (!card) { out.fail = 'no result card after a streamed cup'; throw new Error(out.fail); }
    out.steps.push('result card: ' + card.querySelector('h4').textContent.replace(/\\s+/g, ' ').trim());
    check('the stream window is up during the tournament', sawMini);
    check('and the chat is talking in it', sawChat);
    out.steps.push('window during the run: mini=' + sawMini + ' chat=' + sawChat + ' run=' + sawRun);

    card.querySelector('button[onclick*="careerBackToHub"]').click();
    await wait(60);
    check('the window is gone when the evening is', !document.getElementById('ccTvFrame'));
    check('the page was on air while the frame stood', sawOnAir);
    check('and the page is back to its width', !document.body.classList.contains('cc-onair'));
    check('and the career is off air', CC_STREAM_LIVE === false);
    /* ---- сводка после эфира ---------------------------------------------------
       Его скрин 5 сентября — «Stream Summary» из дашборда Twitch: «в конце
       стрима пусть показывает, сколько заработал и сколько средний онлайн».
       Карточка встаёт, когда вечер закрыт, несёт плитки и закрывается; те же
       числа лежат в streamLast.sum и показываются на вкладке стримов. */
    const sumBox = document.getElementById('ccTvSum');
    check('the stream summary comes up when the evening is closed', !!sumBox);
    const tiles = sumBox ? [...sumBox.querySelectorAll('.cc-tvs-tile')].map(t => t.textContent.replace(/\\s+/g, ' ').trim()) : [];
    out.steps.push('summary tiles: ' + tiles.join(' | '));
    check('and it has the seven tiles', tiles.length === 7, String(tiles.length));
    const sum = CAREER.career.streamLast && CAREER.career.streamLast.sum;
    check('the summary is kept on the evening report', !!sum && sum.avg > 0 && sum.fol > 0, JSON.stringify(sum));
    check('the average viewers tile shows the average', !!sum && tiles[0] && tiles[0].indexOf(ccNum(sum.avg)) === 0, tiles[0]);
    check('and the earned tile shows the money', !!sum && tiles[4] && tiles[4].indexOf(ccMoney(sum.cash)) === 0, tiles[4]);
    ccTvSummaryClose();
    check('the summary closes', !document.getElementById('ccTvSum'));
    careerTab('streams');
    check('the streams tab keeps the summary', !!document.querySelector('#chBody .tv-sum .cc-tvs-tile'));
    careerTab('centre');
    // График рисуется из сохранённой кривой — проверяется на своей.
    const chart = ccTvSumChartHTML({hist: [{v:10,g:0},{v:14,g:1},{v:30,g:1},{v:22,g:2},{v:40,g:3}]});
    check('the viewers chart is drawn from the curve', /<svg/.test(chart) && /polyline/.test(chart) && chart.indexOf(L().ccTvGame(1)) >= 0,
          chart.slice(0, 120));
    check('and a curve of one point draws nothing', ccTvSumChartHTML({hist: [{v:5,g:0}]}) === '');

    const cr = CAREER.career;
    out.steps.push('energy ' + e0 + ' -> ' + careerEnergy() +
                   ', twitch ' + tw0 + ' -> ' + (cr.twitch||0));
    check('the evening on air was paid for in energy', careerEnergy() <= e0 - CC_STREAM_CUP.energy,
          String(careerEnergy()));
    check('a streamed cup grows the twitch audience', (cr.twitch||0) > tw0);
    check('the day is on the stream log the partner programme reads',
          (cr.streamLog||[]).length > 0, JSON.stringify(cr.streamLog||[]));
    check('the evening report belongs to the day it was streamed',
          !!cr.streamLast && (cr.streamLast.a||[]).length >= 5);
    const news = (cr.news||[]).map(n => n.k || '');
    check('the result of the stream is reported', news.indexOf('ccNewsStreamCup') >= 0,
          news.slice(0, 8).join(','));
    check('the tournament itself was played', (cr.log||[]).length > 0);

    // ---- окошко показывает сам турнир, а не только заголовок ----------------
    // Отдельно от вечера: под скипом вечер проскакивает быстрее, чем окно
    // успевает перерисоваться, и проверять там было бы проверкой скорости.
    ccTvOpen({label: 'PROBE CUP'});
    CC_TV_YOU = {name: 'ME & MATE', stagePts: 87, stageElims: 9, wins: 1,
                 stageLog: [{game:1, place:1}, {game:2, place:14}, {game:3, place:3}]};
    // Поле вечера — как его отдаёт simulateGamesLive: свои очки, чужие очки,
    // отсечка. Табло обязано найти в нём и место, и тройку лидеров.
    CC_TV_RUN = {teams: [CC_TV_YOU,
                   {name:'TOP ONE', stagePts:140, wins:2},
                   {name:'TOP TWO', stagePts:120, wins:1},
                   {name:'TOP THREE', stagePts:99, wins:0},
                   {name:'BELOW', stagePts:12, wins:0}],
                 pts: 'stagePts', n: 11, cut: 3, name: 'PROBE'};
    ccTvTick();
    const runTxt = (document.getElementById('ccTvRun')||{}).textContent || '';
    const boardTxt = (document.getElementById('ccTvBoard')||{}).textContent || '';
    const chatN = document.querySelectorAll('#ccTvFrame .cc-tvm-msg').length;
    out.steps.push('window: "' + runTxt.replace(/\\s+/g, ' ').trim() + '"');
    out.steps.push('board: "' + boardTxt.replace(/\\s+/g, ' ').trim() + '", chat lines ' + chatN);
    check('the window counts the games out of the evening',
          runTxt.indexOf(L().ccTvGameOf(3, 11)) >= 0, runTxt);
    check('and says where the last one finished', runTxt.indexOf(L().ccTvLast(3)) >= 0, runTxt);
    check('and carries the points', runTxt.indexOf('87') >= 0, runTxt);
    check('the board shows who is winning', boardTxt.indexOf('TOP ONE') >= 0, boardTxt);
    check('and where you stand', boardTxt.indexOf('ME & MATE') >= 0, boardTxt);
    const meRow = document.querySelector('#ccTvFrame .cc-tvm-row.me');
    check('a fourth of five is fourth',
          !!meRow && meRow.querySelector('i').textContent === '4',
          meRow ? meRow.textContent : 'no row of your own');
    check('and the cut is drawn as missed',
          !!document.querySelector('#ccTvFrame .cc-tvm-cut.out'),
          (document.querySelector('#ccTvFrame .cc-tvm-cut')||{}).className || 'no cut line');
    const width = (document.getElementById('ccTvBar')||{}).style.width;
    check('the evening has a progress bar', width === '27%', String(width));
    check('a win fills the chat', chatN >= 3, String(chatN));
    /* ---- чат смотрит игру ------------------------------------------------------
       Его правка 5 сентября: «когда выбор, то в чате что-то подобное, и после
       победы www или goat». Победа в первой игре лога — спам с «W»; вопрос —
       чат выкрикивает варианты; исход — хвалит или «говорил же». Вне эфира
       чат на вопросы не отвечает. */
    check('a win is spammed with W or GOAT',
          CC_TV_MSGS.some(m => !m.ev && /^W{3,}$|GOAT|W W W/.test(m.text)),
          CC_TV_MSGS.map(m => m.text).join(' | ').slice(0, 200));
    CC_STREAM_LIVE = true;
    const before = CC_TV_MSGS.length;
    ccTvOnChoice([{title: 'HIGHGROUNDX'}, {title: 'REFRESHX'}]);
    const shouted = CC_TV_MSGS.slice(before).map(m => m.text);
    check('chat shouts the options of a question', shouted.some(t => /HIGHGROUNDX|REFRESHX/i.test(t)) && shouted.length >= 3,
          shouted.join(' | '));
    ccTvOnResult(true);
    const praised = CC_TV_MSGS[CC_TV_MSGS.length - 1].text;
    check('and praises a call that worked', L().ccTvChatCallGood.indexOf(praised) >= 0, praised);
    ccTvOnResult(false);
    const scolded = CC_TV_MSGS[CC_TV_MSGS.length - 1].text;
    check('and told you so when it did not', L().ccTvChatCallBad.indexOf(scolded) >= 0, scolded);
    CC_STREAM_LIVE = false;
    const quiet = CC_TV_MSGS.length;
    ccTvOnChoice([{title: 'X'}]);
    check('off air the chat does not answer questions', CC_TV_MSGS.length === quiet);
    /* ---- события канала: фолловеры, сабы, донаты ----------------------------
       Его правка 5 сентября: «во время лайва чат двигается и тд, фоловки,
       сабки, платные донаты». Бюджет событий — из тех же чисел, что платит
       вечер, поэтому за сотню тиков с двумя сотнями зрителей и победой в
       кадре что-то обязано прийти, и счёт эфира обязан это показать. */
    CC_TV_VIEW = 3000; CC_TV_BASE = 3000; CC_TV_BURST = 4;
    // Ты наверху таблицы — доля поля полная, бюджет событий тоже.
    CC_TV_YOU.stagePts = 200;
    for (let i = 0; i < 120; i++) ccTvTick();
    const evN = document.querySelectorAll('#ccTvFrame .cc-tv-ev-fol, #ccTvFrame .cc-tv-ev-sub, #ccTvFrame .cc-tv-ev-dono').length;
    const evTxt = (document.getElementById('ccTvEv')||{}).textContent || '';
    out.steps.push('events after 120 ticks: ' + evN + ' in chat, tally "' + evTxt + '", CC_TV_EV=' + JSON.stringify(CC_TV_EV));
    check('the channel gets followers, subs or donations during the evening', evN > 0 && CC_TV_EV.fol > 0,
          evN + ' / ' + JSON.stringify(CC_TV_EV));
    check('and the tally line counts them', evTxt === L().ccTvEvSum(CC_TV_EV.fol, CC_TV_EV.subs, Math.round(CC_TV_EV.cash)), evTxt);
    check('the chat keeps moving: newest lines are kept, oldest dropped', CC_TV_MSGS.length <= 40 && CC_TV_MSGS.length >= 20, String(CC_TV_MSGS.length));
    check('the frame shows followed channels', document.querySelectorAll('#ccTvFrame .cc-tv-srow').length >= 1);
    /* Под плеером — строка канала как на twitch.tv (его референс 7 сентября):
       онлайн тот же, что в правой колонке, аптайм ч:мм:сс, кнопки Follow /
       Gift a Sub / Subscribe; в чате — топ донатеров после доната и значки у
       ников; слева — «зрители также смотрят». */
    const under = document.getElementById('ccTvUnder');
    check('the channel row sits under the player', !!under && under.querySelectorAll('.cc-tv-btn').length === 3);
    check('its viewer count matches the column', !!under && under.querySelector('#ccTvV2').textContent === document.getElementById('ccTvV').textContent);
    const up2 = under ? (under.querySelector('#ccTvUp2') || {}).textContent : 'no row';
    check('its uptime reads h:mm:ss', /^[0-9]+:[0-9][0-9]:[0-9][0-9]$/.test(String(up2 || '')), JSON.stringify(up2));
    check('subs today is on the header', /[0-9]/.test((document.getElementById('ccTvSubs')||{}).textContent || ''));
    const topBefore = Object.values(CC_TV_TOP).reduce((a, b) => a + b, 0);
    ccTvEvent('dono', 50); ccTvTick();
    const lead = document.getElementById('ccTvLead');
    const topAfter = Object.values(CC_TV_TOP).reduce((a, b) => a + b, 0);
    // Тик после доната сам может добросить событий, поэтому «не меньше», а не «ровно».
    // [$] вместо \\$: внутри шаблонной строки BOOT обратная косая съедается.
    check('a donation lands on the leaderboard', !!lead && topAfter >= topBefore + 50 && lead.querySelectorAll('span').length >= 1 && /[$][0-9]+/.test(lead.textContent), lead && lead.textContent);
    check('some chatters wear badges', document.querySelectorAll('#ccTvFrame .cc-tv-bdg').length >= 1 || CC_TV_WHO.some(w => w.b));
    check('the sidebar has "viewers also watch"', !!document.querySelector('#ccTvFrame .cc-tv-side-h2'));
    check('the message box is there for looks', !!document.querySelector('#ccTvFrame .cc-tv-say'));
    /* Кто в чате — его правка 5 сентября: «в основном рандомные ники, без
       циферок, маленькими буквами; про и креаторы могут иногда». Считается
       по списку людей эфира: не меньше двух третей — выдуманные строчные
       без цифр, и хоть один настоящий (напарник сидит в чате всегда). */
    const nicks = CC_TV_WHO.map(w => w.who);
    const plain = nicks.filter(h => /^[a-z]+$/.test(h)).length;
    out.steps.push('chat people: ' + nicks.slice(0, 12).join(', ') + ' … plain ' + plain + '/' + nicks.length);
    check('the chat is mostly random lowercase nicks without digits', plain >= Math.ceil(nicks.length * 2 / 3), plain + '/' + nicks.length);
    // Цифры и заглавные — только у настоящих (vic0 остаётся vic0), то есть у меньшинства.
    const real = nicks.filter(h => !/^[a-z]+$/.test(h));
    check('the scene is the minority in the chat', real.length <= Math.floor(nicks.length / 3), real.join(','));
    check('and a made-up nick never carries a digit', Array.from({length: 50}, () => ccChatNick()).every(h => /^[a-z]+$/.test(h)));
    check('and the uptime clock', /^\\d+:\\d\\d$/.test((document.getElementById('ccTvUp')||{}).textContent || ''),
          (document.getElementById('ccTvUp')||{}).textContent);
    ccTvFold();
    check('the window folds', document.getElementById('ccTvFrame').classList.contains('fold'));
    check('and folding gives the page its width back', document.body.classList.contains('cc-onair-fold'));
    ccTvClose();
    check('and closes', !document.getElementById('ccTvFrame'));
    check('closing takes the on-air class off the page', !document.body.classList.contains('cc-onair'));

    /* ---- цена вида, а не плоские тридцать ----------------------------------
       Турнирный эфир стоит двадцати, и с двадцатью пятью в запасе он обязан
       начаться. careerDoAct раньше списывал базовые act.energy (30) и на 25
       молча возвращал null: кнопка нажималась и не делала ничего. */
    cr.energy = 25;
    check('twenty-five energy is enough for a twenty-energy stream', !ccStreamCupWhy(),
          ccStreamCupWhy() || '');
    CC_STREAM_KIND = CC_STREAM_CUP.id;
    const okAt25 = !!careerDoAct('stream');
    CC_STREAM_KIND = 'grind';
    check('and the day actually takes it', okAt25 && careerEnergy() === 5,
          okAt25 + ' / ' + careerEnergy());

    // ---- без энергии эфира нет ---------------------------------------------
    cr.energy = 5;
    out.steps.push('why not on 5 energy: ' + (ccStreamCupWhy() || 'still allowed'));
    check('an empty day cannot go live', !!ccStreamCupWhy());
    /* Причина, а не цена. Его скрин 5 сентября («в трио не работает кнопка»):
       под выключенной кнопкой стояло «20 energy» — та же строка, что цена на
       включённой. Теперь строка говорит, сколько есть и сколько нужно, и
       кнопка на вкладке стримов несёт её же. */
    check('the reason names the shortfall, not the price',
          ccStreamCupWhy() === L().ccStreamNeed(CC_STREAM_CUP.energy, 5), ccStreamCupWhy());

  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  // Маркер разрезан: иначе исходник этого скрипта в дампе DOM сам подходит под регэксп
  // маркера, и пустой <pre> читается как «вывод» — так и было 7 сентября. По той же
  // причине слово-маркер нельзя писать в комментариях внутри BOOT целиком.
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncstvcup-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, HEAD + src + BOOT);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('a tournament can be streamed, and it costs power');
fs.rmSync(dir, { recursive: true, force: true });
