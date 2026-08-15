// Two goes a week, below Division 1.
//
// Monday and Tuesday are not two rounds of one tournament down there — they are
// two separate sessions, eleven games and a table each, with a chance at the
// token in both. Miss the cut on Monday and Tuesday is another go.
//
// And taking the token does not end the week. Promote out of Division 5 on
// Monday and Tuesday's session is Division 4's — the same evening, the next rung
// — and it can be won too. A player can climb twice in one week, so the clock
// must never skip the second session on the grounds that the first went well.
//
// This drives careerAfterSession directly rather than through a played cup: the
// question is where the clock lands, and a real run would decide that by whether
// the simulation happened to promote, which is not a thing to test against.
//
//   node tools/check-career-sessions.js

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
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Twice', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:careerStartDay(), division:5, earnings:0, tokens:[], log:[]},
      partner:null
    }));
    careerLoad();

    // A cup week: the first Monday the calendar carries a cup on. This used to
    // read the career's own start Monday and assume it was one. It stopped being
    // one when the Victory Cup made 5 January enterable — the start day is
    // derived from what a new career can play, and the first thing it can play
    // is no longer a divisional cup.
    const days = careerEvents();
    let monday = null;
    for (let d = careerMonday(CAREER.career.day); d <= CC_YEAR_TO && !monday; d = ccAddDays(d, 7))
      if ((days.get(d)||[]).some(e => e.kind === 'cup')) monday = d;
    if (!monday) fail('no Monday in the year carries a divisional cup');
    const onMon = (days.get(monday)||[]).some(e => e.kind === 'cup');
    const onTue = (days.get(ccAddDays(monday,1))||[]).some(e => e.kind === 'cup');
    out.steps.push('week of ' + monday + ': cup on Monday ' + onMon + ', on Tuesday ' + onTue);
    if (!onMon || !onTue) fail('a cup week should carry a session on both Monday and Tuesday');

    // The clock walks a day at a time, so Tuesday's session arrives because
    // Tuesday arrives — whether Monday promoted or not. What the ladder has to
    // guarantee is that the second session is reachable at all, and that nothing
    // jumps over the days between tournaments now that they hold decisions.
    CAREER.career.day = monday;
    const afterMon = careerAfterSession();
    out.steps.push('after Monday -> ' + afterMon);
    if (afterMon !== ccAddDays(monday,1))
      fail('the day after Monday should be Tuesday, went to ' + afterMon);
    const tueHasCup = (days.get(ccAddDays(monday,1))||[]).some(e => e.kind === 'cup');
    if (!tueHasCup) fail('Tuesday should carry the second session');
    out.steps.push('and Tuesday carries the second session');

    // Wednesday is nobody's tournament, and the clock still lands on it: that is
    // where the day gets to ask what it is spent on.
    CAREER.career.day = ccAddDays(monday,1);
    const afterTue = careerAfterSession();
    if (afterTue !== ccAddDays(monday,2))
      fail('the day after Tuesday should be Wednesday, went to ' + afterTue);
    if ((days.get(afterTue)||[]).some(e => e.kind === 'cup'))
      fail('Wednesday should not carry a cup');
    out.steps.push('and the clock lands on Wednesday, which is a day to spend');

    // And the label says what it is. "Round 2" would tell the player the first
    // session carries into the second, which below Division 1 it does not.
    const tueLabel = (days.get(ccAddDays(monday,1))||[]).filter(e=>e.kind==='cup')[0].label;
    out.steps.push('Tuesday reads: ' + tueLabel);
    if (/round|раунд/i.test(tueLabel))
      fail('the second window is labelled a round, and it is a separate session');

    // ---- Division 1 adds its two evenings together ---------------------
    // Below Division 1 the sessions are two goes; in it they are one
    // tournament played over two nights, and Monday only counts because
    // Tuesday adds it in.
    CAREER.career.division = 1;
    CAREER.career.day = monday;
    if (careerCupSession() !== 1) fail('Monday should be session 1');
    if (!careerBanking()) fail('Division 1 Monday should bank rather than settle');
    CAREER.career.day = ccAddDays(monday,1);
    if (careerCupSession() !== 2) fail('Tuesday should be session 2');
    if (careerBanking()) fail('Division 1 Tuesday should settle rather than bank');
    out.steps.push('Division 1: Monday banks, Tuesday settles');

    // And a division below it settles on both, because both are its own cup.
    CAREER.career.division = 4;
    CAREER.career.day = monday;
    if (careerBanking()) fail('Division 4 Monday should settle, not bank');
    CAREER.career.day = ccAddDays(monday,1);
    if (careerBanking()) fail('Division 4 Tuesday should settle, not bank');
    out.steps.push('and Division 4 settles on both');

    // The field has to be the same both evenings or adding the points means
    // nothing. careerSeed keys on the week rather than the day, so it is.
    CAREER.career.division = 1;
    CAREER.career.day = monday;
    const mon = careerCupField(CAREER.career, []).map(t => t.name).join('|');
    CAREER.career.day = ccAddDays(monday,1);
    const tue = careerCupField(CAREER.career, []).map(t => t.name).join('|');
    if (mon !== tue) fail('Tuesday drew a different field from Monday');
    out.steps.push('the same 150 duos are drawn on both evenings');

    // ---- and Tuesday counts from the week's total ------------------------
    // The live table is the tournament's, not the evening's: the field walks in
    // carrying Monday, so the fifty on screen are the fifty going through and
    // the cut line means something while the games are still running.
    const teams = careerCupField(CAREER.career, []).slice(0, 6);
    // One of them is the player, and the stage is skipped: a played-out stage
    // tears its live card down at the end, and a skipped one stops on its own
    // standings — which is the state the table can be read in.
    teams[4].isYou = true;
    const carry = {pts: {}, elims: {}};
    teams.forEach((t, i) => { carry.pts[t.name] = 100 + i; carry.elims[t.name] = i; });
    // Same reset-then-seed order the live stage runs, read off the live stage's
    // own option rather than reimplemented: one game, then the totals.
    // Skipped, the way the button skips it: the flag is cleared when a stage
    // begins, so it is set after the stage has started, and a skipped stage
    // stops on its own standings instead of tearing the card down.
    const stage = simulateGamesLive(teams, 1, pointsForPlace, 4, 'stage', 0, null, null,
      {stageName: 'probe', carry: carry, cutAt: 3});
    await new Promise(r => setTimeout(r, 0));
    skipAnimation = true;
    await stage;
    const carried = teams.every(t => t.stagePts >= (carry.pts[t.name] || 0));
    if (!carried) fail('Tuesday started from zero: ' +
      teams.map(t => t.name.replace(/<[^>]*>/g,'') + ' ' + t.stagePts + ' vs ' + carry.pts[t.name]).join(', '));
    const grew = teams.some(t => t.stagePts > (carry.pts[t.name] || 0));
    if (!grew) fail('the evening added nothing on top of Monday');
    out.steps.push('Tuesday counts from the week: every team walked in with Monday');
    const cutRow = document.querySelector('.lobby-live tr.lobby-cut');
    if (!cutRow) fail('the live table drew no cut line');
    out.steps.push('and the cut line is drawn on the live table');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sessions-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('two goes a week, and a token does not end it');
fs.rmSync(dir, { recursive: true, force: true });
