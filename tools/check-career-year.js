// The measured year, expanded into days the career can stand on.
//
// The events of 2026 lived in two places: RELOAD_CAL in the page, and the other
// forty blocks in tools/fortnite-2026-year.generated.js, which the page cannot
// see. This checks the inlined copy and the expansion that turns it into a map
// of date to what runs that day.
//
// The eight dates below are the ones the year turns on, read off the generated
// file rather than typed from memory. If one of them moves, either the copy is
// wrong or Epic rescheduled — and only one of those is a bug here.
//
//   node tools/check-career-year.js

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
    const days = careerYearDays();
    out.steps.push('days carrying something: ' + days.size);

    // Measured dates, read straight off the generated year. Each must land.
    const must = [
      ['2026-01-08', 'reload'],   // Reload 1 Opens, session 1
      ['2026-01-23', 'reload'],   // Reload 1 Play-In, day 1
      ['2026-02-01', 'reload'],   // Reload 1 heats
      ['2026-02-07', 'reload'],   // Reload 1 final
      ['2026-04-06', 'major'],    // Major 1 Play-In
      ['2026-04-25', 'major'],    // Major 1 Final
      // The Championship is a LAN and a LAN moves — it has already gone from the
      // 18th to the 19th once. Read the day off the constant that owns it so the
      // next hall it books does not read as a hole in the calendar.
      [CC_RC_DAY, 'gc'],          // Reload Championship, wherever it is held
      ['2025-12-04', 'eval']      // first Performance Evaluation night of S39
    ];
    for (const [d, kind] of must) {
      const on = days.get(d) || [];
      if (!on.some(e => e.kind === kind))
        fail(d + ' should carry a ' + kind + ', carries [' + on.map(e=>e.kind).join(',') + ']');
    }
    out.steps.push('every measured date lands: ' + must.length + ' checked');

    // The weekly spans expand. S39's divisional cup runs 2 Feb to 14 Mar, and
    // the rhythm is Monday and Tuesday with a Sunday final for Division 1.
    const feb = [...days.keys()].filter(k => k >= '2026-02-02' && k <= '2026-03-14');
    const cupDays = feb.filter(k => (days.get(k)||[]).some(e => e.kind === 'cup'));
    out.steps.push('divisional cup windows between 2 Feb and 14 Mar: ' + cupDays.length);
    if (cupDays.length < 10) fail('the weekly cup span did not expand into days');
    for (const k of cupDays) {
      const dow = (new Date(k + 'T00:00:00Z')).getUTCDay(); // 1=Mon, 2=Tue
      if (dow !== 1 && dow !== 2) fail('a cup window landed on day-of-week ' + dow + ' (' + k + ')');
    }
    out.steps.push('every cup window is a Monday or a Tuesday');

    // ---- the cups stop for the Major ------------------------------------
    // Measured on Epic's own schedule pages, Division 1 and Divisions 2-5.
    // The span these replaced ran straight through April and July and invented
    // seven cup weeks that never happened.
    // 17 недель S39–S41 + 4 недели Division 1 Practice S42, снятые с его
    // Tracker-сейвов 23 августа (одна сессия + финал, only:'d1').
    if (CC_CUP_WEEKS.length !== 21)
      fail('the year holds 21 measured cup weeks (17 + 4 S42 Practice), the table has ' + CC_CUP_WEEKS.length);
    const finals = [...days.keys()].filter(k => (days.get(k)||[]).some(e => e.kind === 'final'));
    if (finals.length !== 19) fail('19 Weekly Finals in the year (15 + 4 S42), got ' + finals.length);
    // Three of them are not on a Saturday, and they are these three.
    const odd = finals.filter(k => (new Date(k + 'T00:00:00Z')).getUTCDay() !== 6);
    if (odd.join() !== '2026-02-08,2026-04-02,2026-07-17')
      fail('the finals off a Saturday should be 8 Feb, 2 Apr and 17 Jul, got ' + odd.join(', '));
    out.steps.push('19 Weekly Finals, and the three off a Saturday are the measured ones');

    // What each division sees on the two Play-In weeks: Division 1 is away at
    // the Major, everyone below it plays an ordinary week.
    const seenBy = (division, iso) => {
      CAREER = {career:{division}};
      const on = careerEvents().get(iso) || [];
      CAREER = null;
      return on.map(e => e.kind);
    };
    for (const iso of ['2026-04-06','2026-04-07','2026-07-18','2026-07-19']) {
      if (seenBy(5, iso).indexOf('cup') < 0)
        fail(iso + ' is a cup week for Division 5 and it carries none');
      if (seenBy(1, iso).indexOf('cup') >= 0)
        fail(iso + ' should be empty for Division 1, which is at the Major');
    }
    out.steps.push('6-7 April and 18-19 July: a cup below Division 1, nothing in it');

    // And the pause itself: nothing on Division 1's calendar between the last
    // cup day of March and the first of May but the Major.
    const d1Ladder = [...days.keys()].filter(k =>
      k > '2026-04-02' && k < '2026-05-04' &&
      seenBy(1, k).some(kind => kind === 'cup' || kind === 'final'));
    if (d1Ladder.length)
      fail('Division 1 plays the ladder during the Major: ' + d1Ladder.join(', '));
    out.steps.push('Division 1 plays no ladder between 2 April and 4 May');

    // A Reload cup has two Opens and two Play-Ins, not however many days lie
    // between the first and the last. The generated year says so in words —
    // "Opens, two sessions", "Play-Ins, two days" — and a range read as a span
    // turned cup 1's Opens into nine sessions and cup 2's Play-Ins into three.
    const sessionsOf = frag => [...days.keys()]
      .filter(k => (days.get(k)||[]).some(e => (e.id||'').indexOf(frag) >= 0)).length;
    for (const cup of [1,2,3,4]) {
      const opens = sessionsOf('ReloadEliteSeries' + cup + 'Opens');
      const plays = sessionsOf('ReloadEliteSeries' + cup + 'PlayIn');
      out.steps.push('Reload cup ' + cup + ': ' + opens + ' opens, ' + plays + ' play-ins');
      if (opens !== 2) fail('cup ' + cup + ' has ' + opens + ' Opens, and a Reload cup has two');
      if (plays !== 2) fail('cup ' + cup + ' has ' + plays + ' Play-Ins, and a Reload cup has two');
    }
    // The Majors are the other shape: their days really are consecutive.
    const heats = sessionsOf('Major1_Heats');
    if (heats !== 3) fail('Major 1 Heats is three days, got ' + heats);
    out.steps.push('and Major 1 heats is still three days in a row');

    // Nothing outside the career year.
    const outside = [...days.keys()].filter(k => k < CC_YEAR_FROM || k > CC_YEAR_TO);
    if (outside.length) fail('dates outside the career year: ' + outside.slice(0,3).join(', '));
    out.steps.push('nothing falls outside ' + CC_YEAR_FROM + ' to ' + CC_YEAR_TO);

    // ---- the clock ----------------------------------------------------
    if (careerWeekIndex(CC_YEAR_FROM) !== 1) fail('the year does not start in week 1');
    if (careerWeekIndex('2025-12-07') !== 1) fail('the Sunday of week 1 is not week 1');
    if (careerWeekIndex('2025-12-08') !== 2) fail('the Monday after is not week 2');
    // Forty-three, not thirty-eight: the year runs to the Global Championship
    // in Antwerp on 27 September rather than stopping two days after Paris.
    if (careerWeekIndex(CC_YEAR_TO) !== CAREER_WEEKS)
      fail('the year is not ' + CAREER_WEEKS + ' weeks (last week reads ' +
           careerWeekIndex(CC_YEAR_TO) + ')');
    // 47 с хвостом S42 до 22 октября — его Tracker-сейвы, 23 августа.
    if (CAREER_WEEKS !== 47) fail('the measured year is 47 weeks, CAREER_WEEKS says ' + CAREER_WEEKS);
    if (careerMonday('2026-01-23') !== '2026-01-19')
      fail('Monday of the week holding 23 Jan should be 19 Jan, got ' + careerMonday('2026-01-23'));
    out.steps.push('the year is ' + CAREER_WEEKS + ' weeks and every day knows which one it is in');

    // An old save carries a week and no day, and must land on that week's Monday.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Old', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, week:3, division:5, earnings:0, tokens:[], log:[]}, partner:null
    }));
    careerLoad();
    careerMigrateClock();
    // Two weeks past the career's own start, not two past the year's: the old
    // week 1 was a cup week, and the year's week 1 has nothing in it.
    const want = ccAddDays(careerStartDay(), 14);
    if (CAREER.career.day !== want)
      fail('week 3 should migrate to ' + want + ', got ' + CAREER.career.day);
    out.steps.push('career starts ' + careerStartDay() + '; an old week 3 migrates to ' + CAREER.career.day);

    // ---- wages ---------------------------------------------------------
    // A contract is quoted per season, so a season of them must add up to the
    // contract — not to the contract times however many months it crossed.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Paid', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:careerStartDay(), division:5, earnings:0, tokens:[], log:[]},
      org:{name:'Test Org', salary:12000, goal:{type:'promote', target:4}}, partner:null
    }));
    careerLoad();
    const pays = careerWagePaydays();
    out.steps.push('paydays in a career year: ' + pays.length + ' (' + pays[0] + ' … ' + pays[pays.length-1] + ')');
    if (!pays.length) fail('a career year has no paydays in it');
    // careerSkipWeek moves a day, not a week — it kept its name when the clock
    // stopped jumping seven at a time. Sixty of them reached the beginning of
    // March and this check quietly measured two paydays out of six.
    let guard = 0;
    while (!CAREER.career.seasonOver && guard++ < 400) careerSkipWeek();
    if (!CAREER.career.seasonOver) fail('the year did not end in ' + guard + ' days');
    const paid = CAREER.career.wages || 0;
    // A monthly wage is paid monthly. This used to expect a year of wages to add
    // up to the salary, which is the bug behind 'they offer very little': the
    // offer said twelve thousand a month, the club paid a thousand, and a season
    // of that was the monthly figure once.
    const owed = 12000 * pays.length;
    out.steps.push('a 12,000 a month contract paid ' + paid + ' across ' + pays.length + ' paydays');
    if (paid !== owed)
      fail('a season of wages is the wage times the paydays, wanted ' + owed + ', got ' + paid);
    if ((CAREER.career.earnings || 0) !== 0)
      fail('wages leaked into prize money: ' + CAREER.career.earnings);
    out.steps.push('and none of it landed in prize money');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'careeryear-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--force-prefers-no-reduced-motion',
  '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('the measured year expands into days');
fs.rmSync(dir, { recursive: true, force: true });
