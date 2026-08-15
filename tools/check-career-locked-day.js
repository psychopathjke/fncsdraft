// A tournament you cannot enter is a day off with a reason on it.
//
// A locked event — a Reload night with no qualification, a Weekly Final with no
// seat, a Major with no ticket — used to hand the player a picture of the
// tournament and a Skip button. The day is theirs either way, so it now draws
// the same panel an empty Tuesday does: the day's choices, with a line at the
// top naming the room that is playing without them.
//
//   node tools/check-career-locked-day.js
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
    const seed = (div, day) => { CAREER = {player:{nick:'Probe', ovr:70, region:'EU', role:'roleIGL',
      country:'de', age:16, attrs:ccRookieAttrs(70,'roleIGL')},
      career:{season:1, day:day, division:div, earnings:0, balance:0, tokens:[], log:[], news:[]},
      partner:null}; };
    // Find days the calendar carries an event this career cannot enter.
    seed(4, CC_YEAR_FROM);
    const days = careerYearDays();
    let lockedDay = null, lockedKind = null;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO && !lockedDay; d = ccAddDays(d, 1)) {
      CAREER.career.day = d;
      const list = days.get(d) || [];
      if (!list.length) continue;
      const n = careerNext();
      if (n.type !== 'free' && !careerCanPlayKind(n.type)) { lockedDay = d; lockedKind = n.type; }
    }
    out.notes.locked = lockedDay + ' (' + lockedKind + ')';
    check('the year holds a day this career cannot play', !!lockedDay);
    CAREER.career.day = lockedDay;
    const html = careerCentreHTML(careerCard(), attrsFor(careerCard()));
    check('it draws the day panel', /cc-day-in/.test(html));
    check('with a reason on it', /cc-day-locked/.test(html));
    check('and the day can be spent', /careerPickDay/.test(html));
    check('rather than a skip button', !/careerSkipWeek/.test(html));
    // A day the career can play is still the tournament.
    seed(4, CC_YEAR_FROM);
    let cupDay = null;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO && !cupDay; d = ccAddDays(d, 1))
      if ((days.get(d)||[]).some(e => e.kind === 'cup')) cupDay = d;
    CAREER.career.day = cupDay;
    const cupHtml = careerCentreHTML(careerCard(), attrsFor(careerCard()));
    check('a playable day still shows the match card', /careerPlay\\(\\)/.test(cupHtml));
    check('and not the day panel', !/cc-day-in/.test(cupHtml));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncslock-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a locked tournament is a day the player still spends');
fs.rmSync(dir, { recursive: true, force: true });
