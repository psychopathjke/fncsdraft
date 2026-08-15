// A whole career year, walked through the interface rather than around it.
//
// The other harnesses each check one seam: the year expands into days, the
// clock moves, wages add up, a cup plays. This one asks whether a career
// survives the year end to end — every week reachable, none visited twice, the
// calendar carrying what the measured year says it carries, and the thing
// stopping on its own instead of running past August.
//
// It is the acceptance test for the day clock. If this passes and something is
// still wrong, the bug is in a screen rather than in the clock.
//
//   node tools/career-day-clock.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BASE = '<base href="file:///' + ROOT + '/">';
const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'YearMan', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:careerStartDay(), division:5, earnings:0, tokens:[], log:[]},
      partner:null
    }));
    const s0 = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s0.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s0));
    careerEntry();
    out.steps.push('career starts ' + CAREER.career.day + ', week ' + careerWeek() + ' of ' + CAREER_WEEKS);

    // The year a Division 5 player can see. Their own ladder is the divisional
    // cup; the Weekly Final and the Evaluation belong to Division 1 and must not
    // be on this calendar at all.
    const days = careerEvents();
    const cupDays = [...days.keys()].filter(k => (days.get(k)||[]).some(e => e.kind === 'cup'));
    out.steps.push('divisional cup windows in the year: ' + cupDays.length);
    if (cupDays.length < 30) fail('a year should hold more than thirty cup windows, got ' + cupDays.length);
    const d1only = [...days.keys()].filter(k =>
      (days.get(k)||[]).some(e => e.kind === 'final' || e.kind === 'eval'));
    if (d1only.length) fail('Division 1 events are on a Division 5 calendar: ' + d1only.slice(0,3).join(', '));
    out.steps.push('and nothing from Division 1 on a Division 5 calendar');

    // Walk it. Every day the clock stands on, once, in order, to the end. The
    // clock moves a day at a time now that the days between tournaments hold
    // decisions — a week-long jump would skip six of them.
    const stood = [];
    let guard = 0;
    while (!CAREER.career.seasonOver && guard++ < 400) {
      stood.push(CAREER.career.day);
      careerSkipWeek();
    }
    if (guard >= 400) fail('the year never ended');
    out.steps.push('days walked: ' + stood.length + ', ' + stood[0] + ' to ' + stood[stood.length-1]);
    if (new Set(stood).size !== stood.length) fail('a day was visited twice');
    for (let i = 1; i < stood.length; i++) {
      const gap = (new Date(stood[i]+'T00:00:00Z') - new Date(stood[i-1]+'T00:00:00Z')) / 86400000;
      if (gap !== 1) fail('a ' + gap + '-day step at ' + stood[i] + ' — the year has a hole in it');
    }
    out.steps.push('every step is one day, in order, and the year ends on its own');

    // Every cup window the year holds falls inside the stretch the career stood
    // in. A window the clock never reaches is a tournament nobody can enter.
    const first = stood[0], last = stood[stood.length-1];
    const missed = cupDays.filter(k => k < first || k > last);
    if (missed.length)
      fail(missed.length + ' cup windows fall outside the career: ' + missed.slice(0,3).join(', '));
    out.steps.push('and every cup window in the year is inside it');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dayclock-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--force-prefers-no-reduced-motion',
  '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('a career walks the measured year end to end');
fs.rmSync(dir, { recursive: true, force: true });
