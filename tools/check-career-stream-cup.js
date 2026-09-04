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

    // ---- вкладка стримов знает про сегодняшний турнир ------------------------
    careerTab('streams');
    const cupBtn = document.querySelector('#chBody .tv-go-cup');
    check('the streams tab offers tonight tournament', !!cupBtn,
          cupBtn ? '' : 'no .tv-go-cup on a cup day');
    careerTab('centre');

    // ---- метка ставится до эфира, иначе окно метки съело бы вечер -----------
    careerSpotEnsure();

    const e0 = careerEnergy(), tw0 = (CAREER.career.twitch||0);
    const skipper = setInterval(() => {
      const b = document.getElementById('majorSkipBtn');
      if (b && !b.disabled) b.click();
    }, 20);
    document.querySelector('#screen-career-hub .ch-live-go').click();

    let card = null, sawMini = false, sawChat = false, sawRun = false;
    for (let i = 0; i < 4000 && !card; i++) {
      await wait(25);
      if (document.getElementById('ccTvMini')) {
        sawMini = true;
        if (document.querySelectorAll('#ccTvMini .cc-tvm-msg').length) sawChat = true;
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
    check('the window is gone when the evening is', !document.getElementById('ccTvMini'));
    check('and the career is off air', CC_STREAM_LIVE === false);

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
    ccTvMiniOpen({label: 'PROBE CUP'});
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
    ccTvMiniTick();
    const runTxt = (document.getElementById('ccTvRun')||{}).textContent || '';
    const boardTxt = (document.getElementById('ccTvBoard')||{}).textContent || '';
    const chatN = document.querySelectorAll('#ccTvMini .cc-tvm-msg').length;
    out.steps.push('window: "' + runTxt.replace(/\\s+/g, ' ').trim() + '"');
    out.steps.push('board: "' + boardTxt.replace(/\\s+/g, ' ').trim() + '", chat lines ' + chatN);
    check('the window counts the games out of the evening',
          runTxt.indexOf(L().ccTvGameOf(3, 11)) >= 0, runTxt);
    check('and says where the last one finished', runTxt.indexOf(L().ccTvLast(3)) >= 0, runTxt);
    check('and carries the points', runTxt.indexOf('87') >= 0, runTxt);
    check('the board shows who is winning', boardTxt.indexOf('TOP ONE') >= 0, boardTxt);
    check('and where you stand', boardTxt.indexOf('ME & MATE') >= 0, boardTxt);
    const meRow = document.querySelector('#ccTvMini .cc-tvm-row.me');
    check('a fourth of five is fourth',
          !!meRow && meRow.querySelector('i').textContent === '4',
          meRow ? meRow.textContent : 'no row of your own');
    check('and the cut is drawn as missed',
          !!document.querySelector('#ccTvMini .cc-tvm-cut.out'),
          (document.querySelector('#ccTvMini .cc-tvm-cut')||{}).className || 'no cut line');
    const width = (document.getElementById('ccTvBar')||{}).style.width;
    check('the evening has a progress bar', width === '27%', String(width));
    check('a win fills the chat', chatN >= 3, String(chatN));
    ccTvMiniFold();
    check('the window folds', document.getElementById('ccTvMini').classList.contains('fold'));
    ccTvMiniClose();
    check('and closes', !document.getElementById('ccTvMini'));

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

  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
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
