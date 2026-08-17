// Player of the month, player of the season.
//
// A month of this mode is eight or nine tournaments and it ended in silence.
// Every result was already rated by the Power Rankings model, on Epic's own
// multiplier table, so the scene had all the arithmetic it needed to name a best
// month and never said a word.
//
// What this holds: the award goes to the best month rather than the best night,
// two results are needed to be eligible, the month is judged once and only once
// it is over, the season award is the year rather than a thirteenth month, and
// who announces it follows the rule already set for the scene's account.
//
//   node tools/check-career-award.js
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (day, div) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:17, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:86, role:'roleIGL',
              attrs:ccRookieAttrs(86,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:10000,
              tokens:[], log:[], news:[]},
      partner:null
    }));
    careerLoad();
  };
  // A rated result on a given day, straight into the board the awards read.
  const rate = (name, day, pr, you) => {
    const t = careerPrTally();
    const row = t.rows[name] || (t.rows[name] = {v: [], n: 0});
    row.v.push([pr, ccAbsDay(CAREER.career.season, day)]);
    row.n++;
    if (you) row.you = true;
  };
  try {
    // ---- the best month, not the best night ------------------------------
    seed('2026-02-10', 1);
    rate('One good night', '2026-02-05', 30000);          // one result, huge
    rate('A whole month', '2026-02-05', 20000);
    rate('A whole month', '2026-02-12', 20000);
    rate('A whole month', '2026-02-19', 19000);
    const from = ccAbsDay(1, '2026-02-01');
    const board = careerAwardBoard(from, from + 31);
    out.notes.board = board.map(b => b.name + '/' + b.pts + '/' + b.events);
    check('a month beats a night', board[0] && board[0].name === 'A whole month',
          board[0] && board[0].name);
    check('and one result is not a month at all',
          !board.some(b => b.name === 'One good night'),
          JSON.stringify(board.map(b => b.name)));
    check('two results are enough to be judged', CC_AWARD_MIN === 2, String(CC_AWARD_MIN));

    // ---- it is judged when the month ends, once --------------------------
    seed('2026-02-10', 1);
    rate('Somebody', '2026-02-05', 20000);
    rate('Somebody', '2026-02-12', 20000);
    careerAwards().last = '2026-02';
    check('a month still running is not judged', careerAwardCheck() === null);
    CAREER.career.day = '2026-03-02';
    const won = careerAwardCheck();
    out.notes.won = won && {name: won.name, pts: won.pts};
    check('the month that ended is judged', !!won && won.name === 'Somebody',
          won && won.name);
    check('and only once', careerAwardCheck() === null);
    check('it is written down', (careerAwards().won||[]).length === 1,
          JSON.stringify(careerAwards().won));

    // ---- winning it yourself -------------------------------------------
    seed('2026-02-10', 1);
    const reachBefore = careerReach();
    rate('Probe', '2026-02-05', 30000, true);
    rate('Probe', '2026-02-12', 30000, true);
    careerAwards().last = '2026-02';
    CAREER.career.day = '2026-03-02';
    const mine = careerAwardCheck();
    out.notes.mine = {you: mine && mine.you, reach: reachBefore + ' -> ' + careerReach(),
                      counted: careerAwardsWon('month')};
    check('the player can win it', !!mine && mine.you === true);
    check('winning is worth an audience', careerReach() > reachBefore,
          reachBefore + ' -> ' + careerReach());
    check('and the career counts it', careerAwardsWon('month') === 1,
          String(careerAwardsWon('month')));
    const news = (CAREER.career.news||[])[0];
    out.notes.news = news && {k: news.k, dv: news.dv};
    check('the feed says so', !!news && news.k === 'ccNewsAwardYou', news && news.k);
    // Division 1 is the scene's own room, so the scene's account posts it.
    check('and in Division 1 the scene announces it',
          CC_POST_BY.ccNewsAwardYou === 'press' && ccPressWorthy(news) === true);

    // ---- below Division 1 it is the player's own post --------------------
    // The rule the user set: Fortnite Competitive covers Division 1. The same
    // line has to survive that without going unposted.
    seed('2026-02-10', 4);
    rate('Probe', '2026-02-05', 9000, true);
    rate('Probe', '2026-02-12', 9000, true);
    careerAwards().last = '2026-02';
    CAREER.career.day = '2026-03-02';
    careerAwardCheck();
    const low = (CAREER.career.news||[])[0];
    out.notes.low = low && {k: low.k, dv: low.dv, press: ccPressWorthy(low)};
    check('below Division 1 the award is still posted', !!low && low.k === 'ccNewsAwardYou');
    check('by the player rather than by the scene', ccPressWorthy(low) === false,
          JSON.stringify(out.notes.low));

    // ---- the season ------------------------------------------------------
    seed('2026-09-20', 1);
    rate('Probe', '2026-02-05', 30000, true);
    rate('Probe', '2026-06-12', 30000, true);
    rate('Rival', '2026-03-05', 20000);
    rate('Rival', '2026-04-12', 20000);
    const season = careerAwardSeason();
    out.notes.season = season && {name: season.name, events: season.events};
    check('the season award reads the whole year', !!season && season.you === true,
          season && season.name);
    check('and it is a season, not a thirteenth month',
          careerAwardsWon('season') === 1, String(careerAwardsWon('season')));
    check('and it too is judged once', careerAwardSeason() === null);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsaward-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a month has a best month, and the scene says whose');
fs.rmSync(dir, { recursive: true, force: true });
