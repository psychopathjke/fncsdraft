// Skipping a week, and skipping a month.
//
// A season is about thirty cup nights and three hundred days, and nobody should
// have to watch every one of them to see where a career goes. The fast-forward
// plays them instead — the same runners, the same fields, the same growth,
// money, promotion and history, with the skip button held down.
//
// So what this holds is that it really is the same career: the clock lands
// where it should, the tournaments in the span were actually played and wrote
// their rows, the days off were spent, and the things that are the player's to
// decide — an offer from a club, a duo asking to play — are still waiting
// afterwards.
//
//   node tools/check-career-ff.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
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
  // The seat is the player's to fill now: somebody free wrote, and the button
  // under their message seats them. Same door a player goes through.
  const ccProbeSeat = () => {
    if (careerPartnerCard()) return;
    const s = careerDms().find(x => x.state === 'offer' && !x.who.org && !x.who.brand);
    if (s) { careerDmAccept(s.id); careerRenderHub('centre'); }
  };
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const seed = (day, div) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:16, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:60, role:'roleIGL',
              attrs:ccRookieAttrs(60,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[]},
      partner:null
    }));
    careerEntry(); ccProbeSeat();
  };
  try {
    const days = careerYearDays();
    const firstCup = (() => {
      for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
        if ((days.get(d)||[]).some(e => e.kind === 'cup')) return d;
      return null;
    })();

    // ---- a week ----------------------------------------------------------
    seed(firstCup, 4);
    const startOvr = CAREER.player.ovrExact != null ? CAREER.player.ovrExact : CAREER.player.ovr;
    const startDiv = CAREER.career.division;
    // How many cup nights the week actually holds, counted off the calendar
    // rather than assumed — that is what the run has to have played.
    let cupNights = 0;
    for (let i = 0; i < CC_FF_WEEK; i++)
      if ((days.get(ccAddDays(firstCup, i))||[]).some(e => e.kind === 'cup')) cupNights++;
    out.notes.week = {from: firstCup, cupNights: cupNights};

    await careerFastForward(CC_FF_WEEK);
    for (let i = 0; i < 400 && CC_FF; i++) await wait(25);

    const cr = CAREER.career;
    out.notes.after = {day: cr.day, div: cr.division, rows: (cr.log||[]).length,
                       ovr: Math.round((CAREER.player.ovrExact||CAREER.player.ovr) * 10) / 10};
    check('the week is over and the clock says so',
          cr.day === ccAddDays(firstCup, CC_FF_WEEK) || cr.seasonOver, cr.day);
    check('the tournaments in it were played, not skipped',
          (cr.log||[]).length >= cupNights,
          (cr.log||[]).length + ' rows for ' + cupNights + ' cup nights');
    check('every row it wrote is a real result',
          (cr.log||[]).every(r => r.place > 0 && r.of > 1 && r.games > 0),
          JSON.stringify((cr.log||[])[0] || null));
    const grew = (CAREER.player.ovrExact != null ? CAREER.player.ovrExact : CAREER.player.ovr);
    check('and the days off were spent on something', grew > startOvr,
          startOvr + ' -> ' + grew);
    check('a promotion still happens on its own', cr.division <= startDiv,
          startDiv + ' -> ' + cr.division);
    check('the run cleans up after itself', CC_FF === null);
    check('and it leaves no counter on the screen',
          !document.getElementById('ccFfBox'));
    check('the hub is what the player comes back to',
          document.getElementById('screen-career-hub').style.display !== 'none');
    /* Итог перемотки — слой поверх хаба, а не карточка внутри него.

       Тут стоял селектор cc-ff-card, и это был не признак итога, а его адрес:
       карточку вставляли первой в тело хаба. Его правка 22 августа — «поверх
       главного меню, чтоб крестик нажать или продолжить нажать» — адрес и
       поменяла.

       Проверяется поэтому то, что осталось истиной и до, и после: итог показан,
       и из него есть чем выйти. Старый селектор оставлен запасным на случай
       отката. */
    const digest = document.querySelector('.cc-ffo') || document.querySelector('.cc-ff-card');
    out.notes.digest = digest && digest.textContent.replace(/\\s+/g, ' ').slice(0, 120);
    out.notes.ffTiles = digest ? digest.querySelectorAll('.cc-ffo-t').length : 0;
    check('with a digest of what happened', !!digest);
    check('and a way out of it', !!(digest && (digest.querySelector('.cc-ffo-go') ||
                                               digest.querySelector('.cc-ffo-x') ||
                                               digest.classList.contains('cc-ff-card'))));

    // ---- energy is real, not refunded ------------------------------------
    // A fast-forward that ignored the store would train thirty days straight
    // and come out the far side worth more than a played month.
    check('the store is spent, not topped up', careerEnergy() < careerEnergyMax(),
          careerEnergy() + '/' + careerEnergyMax());

    // ---- a month, and the decisions it must not make ---------------------
    seed(firstCup, 5);
    // Something for it to leave alone: an offer sitting in the inbox.
    // Threads live in CAREER.dms, not CAREER.career.dms — planting one in
    // the wrong store proved only that the plant survived.
    careerDms().push({id:'probe-dm', who:{handle:'Probe Org', org:true}, msgs:[],
                      unread:true, state:'org'});
    const dmsBefore = careerDms().length;
    const balBefore = CAREER.career.balance || 0;
    await careerFastForward(CC_FF_MONTH);
    // Four minutes: a month of a career plays eleven tournaments, and a machine
    // running the rest of the suite beside this one takes its time over them.
    let waited = 0;
    for (; waited < 9600 && CC_FF; waited++) await wait(25);
    if (CC_FF) check('the month finished inside four minutes', false,
                     'still playing after ' + Math.round(waited * 25 / 1000) + ' seconds');
    const c2 = CAREER.career;
    out.notes.month = {day: c2.day, div: c2.division, rows: (c2.log||[]).length,
                       dms: careerDms().length};
    check('a month moves the clock a month',
          c2.day === ccAddDays(firstCup, CC_FF_MONTH) || c2.seasonOver, c2.day);
    check('a month plays more than a week', (c2.log||[]).length > 1,
          String((c2.log||[]).length));
    check('the offer is still waiting to be answered',
          careerDms().some(d => d.id === 'probe-dm'),
          dmsBefore + ' -> ' + careerDms().length);
    check('and nothing was bought on the player\\u2019s behalf',
          (c2.balance||0) >= balBefore || (c2.earnings||0) > 0,
          balBefore + ' -> ' + (c2.balance||0));

    // ---- it stops at the season boundary ---------------------------------
    // A new year is a decision and a retirement is a bigger one, so a
    // fast-forward that ran through them would make both for the player.
    seed(ccAddDays(CC_YEAR_TO, -3), 3);
    await careerFastForward(CC_FF_MONTH);
    for (let i = 0; i < 400 && CC_FF; i++) await wait(25);
    out.notes.boundary = {day: CAREER.career.day, over: !!CAREER.career.seasonOver};
    check('it stops at the end of the season rather than starting the next',
          CAREER.career.day <= CC_YEAR_TO, CAREER.career.day);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsff-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1800000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a week and a month play themselves, and leave the decisions alone');
fs.rmSync(dir, { recursive: true, force: true });
