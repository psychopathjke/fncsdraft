// Эфир 9 сентября 2026 — его четыре просьбы одной строкой: «стрим чужого финала, кнопки
// фоллоу и сабскрайб, и пусть сабки и рейды на экране показывает» плюс «код поддержки:
// био и на стриме». Проверяется через интерфейс, как остальные стрим-сторожа:
//   — в день чужого финала на плеере есть кнопка «Смотрим финал», эфир идёт рамкой с
//     каналом хозяина под плеером и таблицей финала, доигрывает все игры и оставляет сводку;
//   — Follow и Subscribe на чужом канале работают: отслеживание бесплатно и держится,
//     подписка стоит денег, продлевается на стыке месяца и слетает без денег;
//   — алерты (сабы, рейды) в рамке имеют куда падать, и события турнирного эфира считаются
//     без CC_TV_PLAIN (CC_TV_CUPX);
//   — код поддержки: закрыт до тысячи фолловеров, потом стоит в био и в рамке, платит за
//     месяц по аудитории и за эфир по онлайну.
//
//   node tools/check-career-stream-watch.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/"><script>window.__errs=[];' +
  "window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); });" +
  "window.addEventListener('unhandledrejection', function(e){ var r=e.reason; window.__errs.push('rejection: '+String(r && (r.stack||r.message||r))); });" +
  '<' + '/script>';

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], fails: [], errs: null, fail: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try{
    const save = (day) => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v: 1,
        player: {nick: 'LiveMan', age: 16, source: 'rookie', country: 'de', countryPing: 15, closeRangeEdge: 6,
                 region: 'EU', ovr: 54, role: 'roleIGL', attrs: null, ageEdge: 4, photo: null, handle: null, cardRegion: null, nat: null},
        career: {season: 1, day: day, division: 5, earnings: 0, tokens: [], log: [], twitch: 4000, reach: 30000, balance: 500, energy: 100},
        partners: []
      }));
      const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
      s.player.attrs = ccRookieAttrs(54, 'roleIGL');
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      careerEntry();
    };
    save(CC_YEAR_FROM);
    // День чужого финала: первый, где careerNext — финал/Мейджор, а «играть» нельзя.
    let day = null;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO && !day; d = ccAddDays(d, 1)) {
      CAREER.career.day = d;
      if (ccStreamWatchEvent()) day = d;
    }
    check('the year has a final you are not in', !!day, String(day));
    save(day);
    const ev = ccStreamWatchEvent();
    out.steps.push('watch day: ' + day + ' · ' + (ev && (ev.label || ev.title)));
    check('the day offers a watch stream', !!ev);
    careerTab('streams');
    const wb = document.querySelector('#chBody .tv-go-watch');
    check('the player has the watch button', !!wb && !wb.disabled, wb ? wb.outerHTML.slice(0, 120) : 'none');
    check('and no tournament-stream button (you are not playing)', !document.querySelector('#chBody .tv-go-cup'));

    // ---- чужой финал в эфире -----------------------------------------------------------
    const bal0 = CAREER.career.balance;
    check('the watch stream starts', careerStreamGo('watch') === true);
    const plain = CC_TV_PLAIN;
    check('it is a watch stream with a host and a field', !!(plain && plain.watch && plain.watch.host && plain.watch.teams.length >= 20),
          JSON.stringify(plain && plain.watch && {host: plain.watch.host && plain.watch.host.name, n: plain.watch.teams.length}));
    const host = plain.watch.host;
    out.steps.push('host: ' + host.name + (host.creator ? ' (creator)' : ' (pro)') + ' · field ' + plain.watch.teams.length + ' · games ' + plain.watch.games);
    const frame = document.getElementById('ccTvFrame');
    check('the frame is up', !!frame);
    check('the frame has an alert host', !!(frame && frame.querySelector('.cc-tv-alert')));
    const under = frame && frame.querySelector('#ccTvUnder .cc-tv-under-in b');
    check('the channel under the player is the host', !!under && under.textContent.trim() === host.name, under && under.textContent);
    // Follow — на чужом канале работает.
    const fb = frame && frame.querySelector('#ccTvHostBtns .cc-tv-btn-fol');
    check('the Follow button is live', !!fb && /ccTwFollowToggle/.test(fb.getAttribute('onclick') || ''));
    fb.click();
    check('following the host', ccTwFollowing(host.name) === true);
    check('and the button says so', /ccTwFollowToggle/.test(document.querySelector('#ccTvHostBtns .cc-tv-btn-fol').getAttribute('onclick')) &&
          document.querySelector('#ccTvHostBtns .cc-tv-btn-fol').classList.contains('on'));
    fb.click(); // second press — off
    check('a second press unfollows', ccTwFollowing(host.name) === false);
    ccTwFollowToggle(host.name);
    check('the sidebar puts a followed channel first', (function(){
      const first = frame.querySelector('.cc-tv-left .cc-tv-srow .cc-tv-sin b');
      return !!first && hKey(first.textContent) === hKey(host.name); })());
    // Subscribe — только у креатора; берём любого креатора из списка.
    const cre = careerLiveNow(12).find(s => s.creator);
    if (cre) {
      const b1 = CAREER.career.balance;
      check('subscribing costs the price', ccTwSubToggle(cre.name) === true && Math.abs((b1 - CAREER.career.balance) - CC_TW_SUB_PRICE) < 0.01,
            String(b1 - CAREER.career.balance));
      check('and is remembered', ccTwSubbed(cre.name) === true);
      check('the news says so', (CAREER.career.news || []).some(n => n.k === 'ccNewsTwSubbed'));
      out.steps.push('subscribed to ' + cre.name + ' for $' + CC_TW_SUB_PRICE);
    } else out.steps.push('no creator live today — subscribe not exercised');
    // Таблица финала доигрывается до конца эфира.
    let maxN = 0, sawBoard = false; const ats = new Set(); let clipOk = true, clipSrc = '';
    const end0 = ccStreamRunEnd; ccStreamRunEnd = function(){ if (CC_TV_PLAIN && CC_TV_PLAIN.watch) maxN = Math.max(maxN, CC_TV_PLAIN.watch.n); return end0.apply(this, arguments); };
    for (let i = 0; i < 1500 && CC_TV_PLAIN; i++) {
      await wait(100);
      if (CC_TV_PLAIN && CC_TV_PLAIN.watch) maxN = Math.max(maxN, CC_TV_PLAIN.watch.n);
      if (document.querySelector('#ccTvBoard .cc-tvm-row')) sawBoard = true;
      const clip = document.querySelector('#chBody .tv-clip');
      if (clip) { ats.add(clip.dataset.at); clipSrc = clip.getAttribute('src') || ''; const at = +clip.dataset.at, to = +clip.dataset.to;
        if (!/xGTo4-XSFkw/.test(clipSrc) || at < CC_TV_WATCH_CLIP.from || to > CC_TV_WATCH_CLIP.to || to - at > CC_TV_CUT) clipOk = false; }
    }
    check('the stream ended on its own', !CC_TV_PLAIN);
    out.steps.push('clip moments: ' + [...ats].join(',') + ' · ' + clipSrc.slice(0, 90));
    check('the player shows his grand-final video between 1:00 and 26:20', clipOk && ats.size > 0, clipSrc);
    check('and moves through its moments', ats.size >= 3, [...ats].join(','));
    check('the final played all its games on the board', maxN === CC_WATCH_GAMES && sawBoard, 'games ' + maxN + ' board ' + sawBoard);
    const sum = CAREER.career.streamLast && CAREER.career.streamLast.sum;
    check('the summary names the final', !!sum && /:/.test(CAREER.career.streamLast.label || ''), JSON.stringify(sum && sum.label));
    check('the summary card is up', !!document.getElementById('ccTvSum'));
    ccTvSummaryClose();
    check('no power was lost — you were not playing', CC_STREAM_LIVE === false);
    out.steps.push('summary: ' + JSON.stringify(sum && {avg: sum.avg, fol: sum.fol, cash: sum.cash, label: sum.label}));

    // ---- подписки на стыке месяца ------------------------------------------------------------
    if (cre) {
      CAREER.career.balance = 100;
      CAREER.career.twSubsMonth = ccMonthKey(CAREER.career.day);
      CAREER.career.day = ccAddDays(CAREER.career.day, 32);
      careerTwSubsTick();
      check('a new month renews the sub', ccTwSubbed(cre.name) === true && Math.abs(100 - CAREER.career.balance - CC_TW_SUB_PRICE) < 0.01, String(CAREER.career.balance));
      CAREER.career.balance = 1;
      CAREER.career.day = ccAddDays(CAREER.career.day, 32);
      careerTwSubsTick();
      check('no money — the sub drops', ccTwSubbed(cre.name) === false);
    }

    // ---- код поддержки ------------------------------------------------------------------------
    save(CC_YEAR_FROM);
    CAREER.career.twitch = 500;
    check('the code is locked under a thousand followers', ccSacOn() === false);
    careerTab('streams');
    check('the bio says when it unlocks', /1[  ,.]?000/.test(document.querySelector('#chBody .tv-sac.off').textContent));
    CAREER.career.twitch = 1500;
    check('and open past it', ccSacOn() === true && ccSacCode() === 'LIVEMAN', ccSacCode());
    careerTab('streams');
    check('the bio shows the code', /LIVEMAN/.test((document.querySelector('#chBody .tv-sac') || {}).textContent || ''));
    check('a stream pays by online', ccSacStream(200, 4) === Math.round(200 * 4 * CC_SAC.perView) && ccSacStream(200, 4) > 0);
    const b2 = CAREER.career.balance;
    careerSacTick();
    check('the first month only starts the clock', CAREER.career.balance === b2);
    CAREER.career.day = ccAddDays(CAREER.career.day, 32);
    const paid = careerSacTick();
    check('the next month pays by followers', paid === Math.round(1500 * CC_SAC.perFol) && CAREER.career.balance === b2 + paid, String(paid));
    check('and posts it', (CAREER.career.news || []).some(n => n.k === 'ccNewsSacPay'));
    check('the same month does not pay twice', careerSacTick() === 0);
    // В рамке своего эфира код стоит под плеером.
    CAREER.career.day = ccAddDays(CAREER.career.day, 1);
    check('a ranked stream runs', careerStreamGo('grind') === true);
    check('the code is on the stream', /LIVEMAN/.test((document.querySelector('#ccTvUnder .cc-tv-sac') || {}).textContent || ''));
    check('own stream keeps the viewer-side buttons', !/ccTwFollowToggle/.test((document.querySelector('#ccTvHostBtns') || {}).innerHTML || ''));
    // Событие турнирного эфира считается без CC_TV_PLAIN и падает алертом в рамку.
    CC_TV_PLAIN = null;
    CC_TV_CUPX = {n: 0, got: [], want: {fol: 100}, hap: []};
    ccStreamHappen({id: 'clip'});
    check('a cup-stream happening lands in CC_TV_CUPX', CC_TV_CUPX.got.length === 1 && CC_TV_CUPX.got[0].id === 'clip');
    check('and shows as an alert in the frame', !!document.querySelector('#ccTvFrame .cc-tv-alert .cc-tv-al'));
    ccStreamHappen({id: 'raid'});
    check('a raid too', CC_TV_CUPX.got.some(g => g.id === 'raid') && !!document.querySelector('#ccTvFrame .cc-tv-alert .cc-tv-al.raid'));
    const haps = ccStreamHappenings(CC_STREAM_CUP, 450);
    check('a cup stream schedules at most two happenings', haps.length <= 2 && haps.every(h => h.at >= 2));
    CC_TV_CUPX = null;
    ccTvClose();
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG' + 'IN' + encodeURIComponent(JSON.stringify(out)) + 'E' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsstreamwatch-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, HEAD + src + BOOT);
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('streams: somebody else’s final on air, Follow and Subscribe work, alerts land in the frame, the creator code pays');
fs.rmSync(dir, { recursive: true, force: true });
