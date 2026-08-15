# Career Day Clock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the career's eleven-week counter with a real date, so the mode runs the measured 2026 competitive year instead of a made-up clock.

**Architecture:** `cr.day` — an ISO date string — becomes the only clock in the save. The measured year moves into the page as a literal table beside `RELOAD_CAL`, and `careerEvents()` builds its whole date→events map from it. Every screen that reads `cr.week` reads a derived week index instead, so the change lands in one place rather than twenty-four.

**Tech Stack:** One file, `index.html`, plain ES2019 in a `<script>` block. Tests are headless-Chrome harnesses under `tools/`, run with `node tools/<name>.js` — this project has no unit-test runner and does not want one.

**Spec:** `docs/superpowers/specs/2026-08-14-career-day-clock-design.md`

## Global Constraints

- **Both languages, always.** Every string added goes into `I18N.ru` and `I18N.en` in the same edit. `node tools/i18n-check.js` must pass before every commit.
- **Line endings.** `index.html` is stored CRLF, every `.js` is LF. Never use `sed -i` on `index.html`. Stage with `git -c core.autocrlf=false add`, and check `git diff --cached --stat` before committing — thousands of changed lines means the endings are wrong, not the change.
- **Measured, not guessed.** Dates come from `tools/fortnite-2026-year.generated.js`. A date not in that file was not found; do not invent one.
- **The career year:** Monday 1 December 2025 to Sunday 23 August 2026, 38 weeks.
- **No new dependencies.** No build step, no npm install.

## What Monday and Tuesday actually are

A divisional cup block is **Monday and Tuesday**, and what that pair means
depends on the division. Settled by the user, 14 August, after this plan first
guessed at it:

- **Divisions 2 to 5: two independent sessions.** Each is its own eleven games
  and its own table, and each carries its own chance at the token. Miss the cut
  on Monday and Tuesday is another go. That happens every week, all season.
- **Division 1: the two sessions are summed** into one table, and the division
  also has a Weekly Final and the Performance Evaluation. This is what
  `2026-08-12-career-division-cups-design.md` already said — "Division 1's second
  session and its Weekly Final are not in this pass" — so the measured note was
  right and it is the lower divisions that were misread.
- **Reload and the EWC circuit sum too.** Opens are two sessions added together,
  Play-Ins likewise, and the combined table decides who goes through.

This plan originally wrote them down as "two windows of one tournament" for
every division. That is wrong twice over: it is two tournaments below Division 1
and one summed tournament in it.

It matters more than it reads. A Division 5 career gets **two chances a week**
rather than one, which is a different climb entirely — and every number measured
against one attempt a week is measured against the wrong thing. The growth rate
needs its own calibration pass with this in place, alongside the one the real
calendar already forced: a career year holds twenty-one cup weeks where the old
made-up season held eight.

---

### Task 1: The measured year, in the page, expanded to days

**Files:**
- Modify: `index.html` — insert after `RELOAD_CAL` (currently ends line 37050)
- Create: `tools/check-career-year.js`

**Interfaces:**
- Produces: `CAREER_YEAR` (array of `[fromISO, toISO, id, label]`), `CC_EVAL_NIGHTS` (array of ISO strings), `CC_YEAR_FROM='2025-12-01'`, `CC_YEAR_TO='2026-08-23'`, and `careerYearDays()` returning `Map<'YYYY-MM-DD', Array<{kind, label, id}>>`.
- `kind` is one of `'cup' | 'final' | 'eval' | 'major' | 'gc' | 'reload'` — the same set `CAREER_EV_ART` and the day-strip pips already use.

- [ ] **Step 1: Write the failing harness**

Create `tools/check-career-year.js`. Copy the Chrome-launch boilerplate from `tools/check-career-map.js` lines 26–45 (the `CHROME` lookup and `HEAD` error trap) verbatim, then use this probe body:

```js
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
      ['2026-08-18', 'gc'],       // Reload Championship, Paris
      ['2025-12-04', 'eval']      // first Performance Evaluation night of S39
    ];
    for (const [d, kind] of must) {
      const on = days.get(d) || [];
      if (!on.some(e => e.kind === kind))
        fail(d + ' should carry a ' + kind + ', carries [' + on.map(e=>e.kind).join(',') + ']');
    }
    out.steps.push('every measured date lands: ' + must.length + ' checked');

    // The weekly spans expand. S39_FNCSDivisionalCup runs 2 Feb to 14 Mar, and
    // the rhythm is Monday and Tuesday with a Sunday final for Division 1.
    const feb = [...days.keys()].filter(k => k >= '2026-02-02' && k <= '2026-03-14');
    const cupDays = feb.filter(k => (days.get(k)||[]).some(e => e.kind === 'cup'));
    out.steps.push('divisional cup days between 2 Feb and 14 Mar: ' + cupDays.length);
    if (cupDays.length < 10) fail('the weekly cup span did not expand into days');
    for (const k of cupDays) {
      const dow = (new Date(k + 'T00:00:00Z')).getUTCDay(); // 1=Mon, 2=Tue
      if (dow !== 1 && dow !== 2) fail('a cup window landed on day-of-week ' + dow + ' (' + k + ')');
    }
    out.steps.push('every cup window is a Monday or a Tuesday');

    // Nothing outside the career year.
    const outside = [...days.keys()].filter(k => k < CC_YEAR_FROM || k > CC_YEAR_TO);
    if (outside.length) fail('dates outside the career year: ' + outside.slice(0,3).join(', '));
    out.steps.push('nothing falls outside ' + CC_YEAR_FROM + ' to ' + CC_YEAR_TO);
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;
```

Then the runner, copied from `tools/check-career-map.js` lines 176–196, with `--force-prefers-no-reduced-motion` and this closing line:

```js
console.log('the measured year expands into days');
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tools/check-career-year.js`
Expected: FAIL — `careerYearDays is not defined`.

- [ ] **Step 3: Put the measured year in the page**

In `index.html`, immediately after the `RELOAD_CAL` array (which currently closes at line 37050), insert:

```js
/* The 2026 competitive year, as Epic scheduled it.

   Copied from tools/fortnite-2026-year.generated.js, which read it off
   Tracker's own event pages — every window there carries a real BeginTime.
   Inlined the way RELOAD_CAL is, rather than loaded as a script, because the
   page ships as one file and a career must not depend on tools/ being present.

   [from, to, id, kind] — the kind is this interface's own vocabulary, not
   Epic's: it decides the cover, the pip colour and the season square. */
const CC_YEAR_FROM='2025-12-01', CC_YEAR_TO='2026-08-23';
const CAREER_YEAR=[
  ['2026-01-08','2026-01-16','ReloadEliteSeries1Opens','reload'],
  ['2026-01-23','2026-01-28','ReloadEliteSeries1PlayIn','reload'],
  ['2026-02-01','2026-02-01','ReloadEliteSeries1Heats','reload'],
  ['2026-02-07','2026-02-07','ReloadEliteSeries1Final','reload'],
  ['2026-02-02','2026-03-14','S39_FNCSDivisionalCup','cup'],
  ['2026-02-13','2026-02-15','ReloadEliteSeries2Opens','reload'],
  ['2026-02-20','2026-02-22','ReloadEliteSeries2PlayIn','reload'],
  ['2026-02-27','2026-02-27','ReloadEliteSeries2Heats','reload'],
  ['2026-03-01','2026-03-01','ReloadEliteSeries2Final','reload'],
  ['2026-03-23','2026-05-23','S40_FNCSDivisionalCup','cup'],
  ['2026-04-06','2026-04-07','Major1_PlayIn','major'],
  ['2026-04-17','2026-04-19','Major1_Heats','major'],
  ['2026-04-20','2026-04-21','Major1_LCQ','major'],
  ['2026-04-25','2026-04-26','Major1_Final','major'],
  ['2026-05-01','2026-05-03','ReloadEliteSeries3Opens','reload'],
  ['2026-05-08','2026-05-10','ReloadEliteSeries3PlayIn','reload'],
  ['2026-05-15','2026-05-15','ReloadEliteSeries3Heats','reload'],
  ['2026-05-17','2026-05-17','ReloadEliteSeries3Final','reload'],
  ['2026-06-08','2026-07-19','S41_FNCSDivisionalCup','cup'],
  ['2026-06-12','2026-06-14','ReloadEliteSeries4Opens','reload'],
  ['2026-06-19','2026-06-21','ReloadEliteSeries4PlayIn','reload'],
  ['2026-06-26','2026-06-26','ReloadEliteSeries4Heats','reload'],
  ['2026-06-28','2026-06-28','ReloadEliteSeries4Final','reload'],
  ['2026-07-18','2026-07-19','Major2_PlayIn','major'],
  ['2026-07-24','2026-07-26','Major2_Heats','major'],
  ['2026-07-27','2026-07-28','Major2_LCQ','major'],
  ['2026-08-01','2026-08-02','Major2_Final','major'],
  ['2026-08-03','2026-08-14','GlobalChampionshipLastChance','gc'],
  ['2026-08-18','2026-08-21','ReloadChampionshipParis','gc']
];
// The Performance Evaluation, night by night rather than as a span: it is the
// one event that runs every week of the year, and a career calendar has to put
// it on the right evening. Division 1 only — its own page says so.
const CC_EVAL_NIGHTS=[
  '2025-12-04','2025-12-11','2025-12-18','2026-01-09','2026-01-15','2026-01-22',
  '2026-01-29','2026-02-05','2026-02-12','2026-02-19','2026-02-26','2026-03-05',
  '2026-03-12','2026-03-20','2026-03-26','2026-04-01','2026-04-09','2026-04-16',
  '2026-04-23','2026-05-07','2026-05-14','2026-05-21','2026-06-03','2026-06-07',
  '2026-06-11','2026-06-18','2026-07-16','2026-07-23','2026-07-30','2026-08-06',
  '2026-08-13'
];
// A block that repeats weekly is stored as the span it ran over, so the days
// inside it are counted off the rhythm rather than listed. The rhythm itself is
// measured — it was read off the window names — but the repetition is derived,
// and this is the only place in the year where a date is.
const CC_RHYTHM={cupDays:[1,2], d1Final:0};   // JS day-of-week: 1 = Monday, 0 = Sunday

function ccAddDays(iso, n){
  const t=new Date(iso+'T00:00:00Z');
  t.setUTCDate(t.getUTCDate()+n);
  return dateKey(t);
}
// Every day of the career year that carries something, built once and cached:
// this walks about 270 days and is called on every hub render.
let CC_YEAR_DAYS=null;
function careerYearDays(){
  if(CC_YEAR_DAYS) return CC_YEAR_DAYS;
  const out=new Map();
  const add=(iso, kind, label, id)=>{
    if(iso<CC_YEAR_FROM || iso>CC_YEAR_TO) return;
    if(!out.has(iso)) out.set(iso, []);
    out.get(iso).push({kind, label, id});
  };
  CAREER_YEAR.forEach(([from, to, id, kind])=>{
    if(kind==='cup'){
      // A weekly block: Monday and Tuesday every week it covers, with a Sunday
      // final that only Division 1 plays. Both are added; who may enter which
      // is the hub's question, not the calendar's.
      for(let d=from; d<=to; d=ccAddDays(d,1)){
        const dow=(new Date(d+'T00:00:00Z')).getUTCDay();
        if(CC_RHYTHM.cupDays.indexOf(dow)>=0)
          add(d, 'cup', L().calRound.replace('{N}', dow===1?'1':'2'), id);
        else if(dow===CC_RHYTHM.d1Final)
          add(d, 'final', L().calWeeklyFinal, id);
      }
      return;
    }
    // Everything else is the days it actually ran, end to end.
    for(let d=from; d<=to; d=ccAddDays(d,1)) add(d, kind, ccYearLabel(id, d, from), id);
  });
  CC_EVAL_NIGHTS.forEach(d=>add(d, 'eval', L().calPerfEval, 'PerformanceEvaluation'));
  CC_YEAR_DAYS=out;
  return out;
}
// What a day of a multi-day block is called. A three-day Heats block wants
// "Heats 2 of 3" rather than three identical rows.
function ccYearLabel(id, day, from){
  const base=L().ccYearNames[id] || id;
  if(day===from) return base;
  let n=1;
  for(let d=from; d<day; d=ccAddDays(d,1)) n++;
  return base+' '+n;
}
```

Language changes when the player switches it, so the cache must drop. Find `function setLang(lang, persist){` (line 3439) and add as its first statement inside the body:

```js
  CC_YEAR_DAYS=null;
```

- [ ] **Step 4: Add the block names to both dictionaries**

In `I18N.ru`, immediately after the `chWkCup:'Кубок', chWkReload:'Reload', chDayFree:'Свободный день',` line:

```js
ccYearNames:{
  ReloadEliteSeries1Opens:'Reload · кап 1, отборы', ReloadEliteSeries1PlayIn:'Reload · кап 1, плей-ин',
  ReloadEliteSeries1Heats:'Reload · кап 1, хиты',   ReloadEliteSeries1Final:'Reload · кап 1, финал',
  ReloadEliteSeries2Opens:'Reload · кап 2, отборы', ReloadEliteSeries2PlayIn:'Reload · кап 2, плей-ин',
  ReloadEliteSeries2Heats:'Reload · кап 2, хиты',   ReloadEliteSeries2Final:'Reload · кап 2, финал',
  ReloadEliteSeries3Opens:'Reload · кап 3, отборы', ReloadEliteSeries3PlayIn:'Reload · кап 3, плей-ин',
  ReloadEliteSeries3Heats:'Reload · кап 3, хиты',   ReloadEliteSeries3Final:'Reload · кап 3, финал',
  ReloadEliteSeries4Opens:'Reload · кап 4, отборы', ReloadEliteSeries4PlayIn:'Reload · кап 4, плей-ин',
  ReloadEliteSeries4Heats:'Reload · кап 4, хиты',   ReloadEliteSeries4Final:'Reload · кап 4, финал',
  Major1_PlayIn:'Мейджор 1 · плей-ин', Major1_Heats:'Мейджор 1 · хиты',
  Major1_LCQ:'Мейджор 1 · последний шанс', Major1_Final:'Мейджор 1 · финал',
  Major2_PlayIn:'Мейджор 2 · плей-ин', Major2_Heats:'Мейджор 2 · хиты',
  Major2_LCQ:'Мейджор 2 · последний шанс', Major2_Final:'Мейджор 2 · финал',
  GlobalChampionshipLastChance:'Мировой чемпионат · последний шанс',
  ReloadChampionshipParis:'Reload Championship · Париж'
},
```

In `I18N.en`, after `chWkCup:'Cup', chWkReload:'Reload', chDayFree:'Free day',`:

```js
ccYearNames:{
  ReloadEliteSeries1Opens:'Reload · cup 1 opens', ReloadEliteSeries1PlayIn:'Reload · cup 1 play-in',
  ReloadEliteSeries1Heats:'Reload · cup 1 heats', ReloadEliteSeries1Final:'Reload · cup 1 final',
  ReloadEliteSeries2Opens:'Reload · cup 2 opens', ReloadEliteSeries2PlayIn:'Reload · cup 2 play-in',
  ReloadEliteSeries2Heats:'Reload · cup 2 heats', ReloadEliteSeries2Final:'Reload · cup 2 final',
  ReloadEliteSeries3Opens:'Reload · cup 3 opens', ReloadEliteSeries3PlayIn:'Reload · cup 3 play-in',
  ReloadEliteSeries3Heats:'Reload · cup 3 heats', ReloadEliteSeries3Final:'Reload · cup 3 final',
  ReloadEliteSeries4Opens:'Reload · cup 4 opens', ReloadEliteSeries4PlayIn:'Reload · cup 4 play-in',
  ReloadEliteSeries4Heats:'Reload · cup 4 heats', ReloadEliteSeries4Final:'Reload · cup 4 final',
  Major1_PlayIn:'Major 1 · Play-In', Major1_Heats:'Major 1 · Heats',
  Major1_LCQ:'Major 1 · Last Chance', Major1_Final:'Major 1 · Final',
  Major2_PlayIn:'Major 2 · Play-In', Major2_Heats:'Major 2 · Heats',
  Major2_LCQ:'Major 2 · Last Chance', Major2_Final:'Major 2 · Final',
  GlobalChampionshipLastChance:'Global Championship · Last Chance',
  ReloadChampionshipParis:'Reload Championship · Paris'
},
```

- [ ] **Step 5: Run the harness and the language check**

Run: `node tools/check-career-year.js`
Expected: PASS, printing `days carrying something: ` around 190, `every measured date lands: 8 checked`, `divisional cup days between 2 Feb and 14 Mar: 12`, and the Monday-or-Tuesday line.

Run: `node tools/i18n-check.js`
Expected: `PASS — every string exists in every language.`

`ccYearNames` is an object rather than a string, so `i18n-check.js` compares its presence in both dictionaries but not its keys. Confirm by eye that both objects list the same 29 ids.

- [ ] **Step 6: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-career-year.js
git diff --cached --stat    # index.html must be tens of lines, not tens of thousands
git -c core.autocrlf=false commit -F - <<'MSG'
Put the measured year in the page, expanded day by day

The career's events lived in two places: RELOAD_CAL in the page, and the other
forty blocks in tools/fortnite-2026-year.generated.js, which the page cannot
see. So the year is inlined the way RELOAD_CAL already was — the page ships as
one file and a career must not depend on tools/ being present — and
careerYearDays() expands it into a map of date to what runs that day.

Weekly blocks are the one place a date is derived rather than read: a divisional
cup span becomes Mondays and Tuesdays with a Sunday final, off the rhythm that
was counted from the window names. Everything else is the days it actually ran.

tools/check-career-year.js checks the eight dates that matter land on their own
days, that the weekly spans expanded and every cup window is a Monday or a
Tuesday, and that nothing escapes the career year.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 2: `cr.day` becomes the clock, with the week derived from it

**Files:**
- Modify: `index.html` — `careerSchedule()` at 36653, `careerDate()` at 36994, `careerNewSeason` at 38010, save creation in `ccStart` (find with `grep -n "career:{season:1" index.html`)
- Modify: `tools/check-career-year.js` — add the clock probe below the year probe

**Interfaces:**
- Consumes: `CC_YEAR_FROM`, `careerYearDays()` from Task 1.
- Produces: `careerToday()` → ISO string; `careerMonday(iso)` → ISO string of that week's Monday; `careerWeekIndex(iso)` → 1-based week of the career year; `CAREER_WEEKS` becomes a computed constant equal to 38.

- [ ] **Step 1: Write the failing probe**

Append to the `try` block of `tools/check-career-year.js`, before the closing `} catch`:

```js
    // ---- the clock ----------------------------------------------------
    if (careerWeekIndex(CC_YEAR_FROM) !== 1)
      fail('the year does not start in week 1');
    if (careerWeekIndex('2025-12-07') !== 1)
      fail('the Sunday of week 1 is not week 1');
    if (careerWeekIndex('2025-12-08') !== 2)
      fail('the Monday after is not week 2');
    if (careerWeekIndex(CC_YEAR_TO) !== 38)
      fail('the year is not 38 weeks (last week reads ' + careerWeekIndex(CC_YEAR_TO) + ')');
    if (careerMonday('2026-01-23') !== '2026-01-19')
      fail('Monday of the week holding 23 Jan should be 19 Jan, got ' + careerMonday('2026-01-23'));
    out.steps.push('the year is 38 weeks and every day knows which one it is in');

    // An old save carries a week and no day, and must land on that week's Monday.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Old', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, week:3, division:5, earnings:0, tokens:[], log:[]}, partner:null
    }));
    careerLoad();
    careerMigrateClock();
    if (CAREER.career.day !== '2025-12-15')
      fail('week 3 should migrate to Monday 15 December, got ' + CAREER.career.day);
    out.steps.push('an old save migrates: week 3 -> ' + CAREER.career.day);
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tools/check-career-year.js`
Expected: FAIL — `careerWeekIndex is not defined`.

- [ ] **Step 3: Add the clock helpers**

Replace `careerDate()` and `CAREER_SEASON_START` (lines 36992–37001) with:

```js
/* The clock.

   cr.day, an ISO date, is the only clock in the save. A week number is derived
   where a screen wants one, so the two can never disagree — which is what
   storing both would guarantee.

   The career year runs Monday 1 December 2025 to Sunday 23 August 2026: it
   opens on the week of S39's first Performance Evaluation night and closes
   after the Reload Championship in Paris, which is the last block in the
   measured year. Both ends were checked rather than assumed — 1 December 2025
   is a Monday, 21 August 2026 is a Friday, so the last week runs to Sunday the
   23rd. */
const CAREER_WEEKS=38;

function careerToday(){
  return (CAREER && CAREER.career && CAREER.career.day) || CC_YEAR_FROM;
}
function careerMonday(iso){
  const t=new Date(iso+'T00:00:00Z');
  // getUTCDay is 0 for Sunday, so Sunday steps back six days, not none.
  const back=(t.getUTCDay()+6)%7;
  t.setUTCDate(t.getUTCDate()-back);
  return dateKey(t);
}
function careerWeekIndex(iso){
  const from=new Date(careerMonday(CC_YEAR_FROM)+'T00:00:00Z');
  const here=new Date(careerMonday(iso)+'T00:00:00Z');
  return Math.floor((here-from)/(7*86400000))+1;
}
// The date a career week starts on, for the screens that still think in weeks.
function careerWeekStart(week){
  return ccAddDays(careerMonday(CC_YEAR_FROM), (week-1)*7);
}
// An old save carries a week and no day. It lands on that week's Monday rather
// than being thrown away — a career in progress is somebody's season.
function careerMigrateClock(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.day) return;
  cr.day=careerWeekStart(Math.max(1, Math.min(CAREER_WEEKS, cr.week||1)));
  careerSave();
}
```

Every remaining `careerDate(week, dow)` call becomes `ccAddDays(careerWeekStart(week), dow)`. There are six, at lines 36805, 36807, 36828 (twice), 36856, 37063, 37108, 37128 and 37132 — `grep -n "careerDate(" index.html` after editing must return nothing.

Call the migration where the save is loaded. In `careerEntry()` (find with `grep -n "function careerEntry" index.html`), add `careerMigrateClock();` immediately after the `careerLoad();` call.

In `careerNewSeason` (line 38010), replace `cr.season++; cr.week=1; cr.seasonOver=false;` with:

```js
  // A second career year is the same year again: only 2026 is measured, and a
  // measured 2027 does not exist to copy. Said out loud in the spec rather than
  // hidden behind a date that looks real.
  cr.season++; cr.day=CC_YEAR_FROM; cr.seasonOver=false;
```

In the save `ccStart` creates, replace `week:1` with `day:CC_YEAR_FROM`.

- [ ] **Step 4: Make every reader derive its week**

Add beside the helpers:

```js
// What the screens mean when they say "the week": where the clock is standing.
function careerWeek(){ return careerWeekIndex(careerToday()); }
```

Then replace `cr.week` with `careerWeek()` at these nine reading sites — 36755, 36805, 36807, 36828, 36831, 36858, 36917, 37128, 37132, 37213 — and delete `cr.week` from the two writing sites (38010 handled above; 37998 and 38194 are Task 4).

Run `grep -n "cr\.week" index.html`. Only lines 37998, 38194, 37751, 37865, 38105 and 38168 may remain; those are Tasks 4 and 6.

- [ ] **Step 5: Run the harness**

Run: `node tools/check-career-year.js`
Expected: PASS, with `the year is 38 weeks and every day knows which one it is in` and `an old save migrates: week 3 -> 2025-12-15`.

Run: `node tools/check-career-cup.js`
Expected: PASS — the hub still renders and a cup still plays. It reads `saved.career.week`, which is now absent, so its final line will print `"week":undefined`; that is expected here and fixed in Task 7.

- [ ] **Step 6: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-career-year.js
git diff --cached --stat
git -c core.autocrlf=false commit -F - <<'MSG'
Make the date the clock, and derive the week from it

cr.day is the only clock in the save now. A week number is computed where a
screen wants one, so the two can never disagree — which is exactly what storing
both would guarantee. The career year is the measured one: Monday 1 December
2025 to Sunday 23 August 2026, thirty-eight weeks, both ends checked rather than
assumed.

careerDate(week, dow) is gone. It added seven days at a time from a start date
that was picked to make the arithmetic tidy, which is how a career came to run
eleven weeks from a January Monday instead of the year Epic actually ran.

A save carrying a week and no day lands on that week's Monday rather than being
thrown away. A second career year restarts the same measured year, because only
2026 was measured and a 2027 does not exist to copy.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 3: The hub reads the day, and the calendar spans the year

**Files:**
- Modify: `index.html` — `careerEvents()` at 37055, `careerMonthBounds()` at 37107, `careerCentreHTML` strip at 36800–36870

**Interfaces:**
- Consumes: `careerYearDays()`, `careerToday()`, `careerWeek()`, `careerWeekStart()`.
- Produces: `careerEvents()` returning the same `Map<'YYYY-MM-DD', Array<{kind,label,art}>>` shape it returns today, so the day strip, the season squares and the month calendar keep working unchanged.

- [ ] **Step 1: Write the failing probe**

Append to `tools/check-career-year.js`'s `try` block:

```js
    // The hub's own map is the year's map, with the art attached.
    const ev = careerEvents();
    if (!ev.get('2026-04-25') || !ev.get('2026-04-25').some(e => e.kind === 'major'))
      fail('careerEvents has lost Major 1 Final');
    if (!ev.get('2026-04-25')[0].art)
      fail('an event came through without a cover');
    // The month calendar must be able to reach both ends of the year.
    const b = careerMonthBounds();
    if (b.from.y !== 2025 || b.from.m !== 11) fail('the calendar cannot page back to December 2025');
    if (b.to.y !== 2026 || b.to.m !== 7) fail('the calendar cannot page to August 2026');
    out.steps.push('the calendar spans Dec 2025 to Aug 2026');
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tools/check-career-year.js`
Expected: FAIL — either `careerEvents has lost Major 1 Final` or the calendar bounds line, depending on which runs first.

- [ ] **Step 3: Rebuild `careerEvents` on the year**

Replace the whole body of `careerEvents()` (line 37055 to the `return out;` that closes it) with:

```js
function careerEvents(){
  const div=CAREER && CAREER.career ? CAREER.career.division : 5;
  const out=new Map();
  careerYearDays().forEach((list, day)=>{
    list.forEach(e=>{
      // The Weekly Final and the Performance Evaluation are Division 1's alone.
      // A player below it sees neither on their calendar, because neither is
      // theirs to enter — that is the division's own rule, not a display one.
      if((e.kind==='final' || e.kind==='eval') && div!==1) return;
      if(!out.has(day)) out.set(day, []);
      out.get(day).push({kind:e.kind, label:e.label, art:CAREER_EV_ART[e.kind]||null});
    });
  });
  return out;
}
```

Delete `RELOAD_CAL` and the `addOn` helper that fed it — `CAREER_YEAR` carries the same four cups, and two tables of the same dates is one table too many. `grep -n "RELOAD_CAL" index.html` must return nothing.

Replace `careerMonthBounds()` (line 37107) with:

```js
function careerMonthBounds(){
  const a=new Date(CC_YEAR_FROM+'T00:00:00Z'), b=new Date(CC_YEAR_TO+'T00:00:00Z');
  return {from:{y:a.getUTCFullYear(), m:a.getUTCMonth()},
          to:  {y:b.getUTCFullYear(), m:b.getUTCMonth()}};
}
```

- [ ] **Step 4: Point the strip and the squares at today**

In `careerCentreHTML`, replace the strip's week arithmetic. `const firstBusy=...` through `const seasonBar=...` currently start from `cr.week`; they start from the clock instead:

```js
  const monday=careerMonday(careerToday());
  const firstBusy=[0,1,2,3,4,5,6].find(d=>(dayEvents.get(ccAddDays(monday,d))||[]).length);
  const strip=[0,1,2,3,4,5,6].map(d=>{
    const iso=ccAddDays(monday, d);
    const when=new Date(iso+'T00:00:00Z');
    const on=dayEvents.get(iso)||[];
```

and the season squares walk the year's weeks rather than `careerSchedule()`:

```js
  const here=careerWeek();
  const seasonBar=[];
  for(let w=1; w<=CAREER_WEEKS; w++){
    const kinds=new Set();
    for(let d=0; d<7; d++)
      (dayEvents.get(ccAddDays(careerWeekStart(w), d))||[]).forEach(x=>kinds.add(x.kind));
    const top=KIND_RANK.find(k=>kinds.has(k));
    const state=w<here ? ' done' : (w===here ? ' now' : '');
    const what=top ? KIND_WORD[top] : L().chDayFree;
    seasonBar.push(`<i class="ch-sq${top?' ch-pip-'+top:' ch-sq-empty'}${state}"`+
                   ` title="${esc(L().chWeek+' '+w+' — '+what)}"></i>`);
  }
```

Thirty-eight squares at 15px plus a 4px gap is 718px, which fits the bar; `.ch-season` already wraps if a narrower window needs it.

- [ ] **Step 5: Run the harness and look at it**

Run: `node tools/check-career-year.js`
Expected: PASS, including `the calendar spans Dec 2025 to Aug 2026`.

Run: `SNAP_H=700 node tools/snap-career.js /tmp/hub.png centre` and open the image. Expected: 38 squares, the current week ringed, and the day strip showing the week the clock is standing in.

- [ ] **Step 6: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-career-year.js
git diff --cached --stat
git -c core.autocrlf=false commit -F - <<'MSG'
Build the hub's calendar out of the measured year

careerEvents() stopped assembling its map from a schedule and a second table of
Reload dates, and now reads the year straight through. RELOAD_CAL is gone with
it: CAREER_YEAR carries the same four cups, and two tables of the same dates is
one table too many.

The season squares run the year's thirty-eight weeks instead of a season's
eleven, and the month calendar reaches December 2025 to August 2026 rather than
stopping where an eleven-week season happened to end.

Division 1's Weekly Final and Performance Evaluation are filtered here rather
than in the strip, because a player below Division 1 cannot enter either and a
calendar that lists them is lying about what the week holds.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 4: Living the week

**Files:**
- Modify: `index.html` — `careerSkipWeek` at 37998, post-cup advance at 38194, `careerNext()` at 36668
- Modify: `tools/check-career-cup.js` — the save assertion at its end

**Interfaces:**
- Consumes: `careerToday()`, `careerYearDays()`, `ccAddDays()`.
- Produces: `careerAdvanceTo(iso)` setting the clock and ending the year past `CC_YEAR_TO`; `careerNextEventDay()` → ISO string or `null`.

- [ ] **Step 1: Write the failing probe**

Create `tools/check-career-clock-run.js` using the same boilerplate, with this body:

```js
    // A career walks its year one week at a time and lands on the last day.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Walker', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:CC_YEAR_FROM, division:5, earnings:0, tokens:[], log:[]},
      partner:null
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateClock();

    const seen = [];
    let guard = 0;
    while (!CAREER.career.seasonOver && guard++ < 60) {
      seen.push(CAREER.career.day);
      careerSkipWeek();
    }
    out.steps.push('weeks walked: ' + seen.length + ', last ' + seen[seen.length-1]);
    if (guard >= 60) fail('the year never ended');
    if (seen.length !== 38) fail('a career year should be 38 weeks, walked ' + seen.length);
    if (new Set(seen).size !== seen.length) fail('a week was visited twice');
    for (let i = 1; i < seen.length; i++)
      if (seen[i] <= seen[i-1]) fail('the clock went backwards at ' + seen[i]);
    out.steps.push('every week visited once, in order, and the year ends');
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tools/check-career-clock-run.js`
Expected: FAIL — `a career year should be 38 weeks, walked 11`, because `careerSkipWeek` still stops at `CAREER_WEEKS` as a week counter.

- [ ] **Step 3: Move the clock by days**

Add beside the clock helpers:

```js
// Moving the clock. Past the last day of the measured year the career year is
// over — there is no thirty-ninth week to walk into.
function careerAdvanceTo(iso){
  const cr=CAREER.career;
  if(iso>CC_YEAR_TO){ cr.seasonOver=true; cr.day=CC_YEAR_TO; }
  else cr.day=iso;
  careerSave();
}
// The next day from here that carries anything, or null if the year has none
// left. What "next" means to a player is the next thing to do, not the next
// square on a grid.
function careerNextEventDay(){
  const days=careerEvents();
  for(let d=ccAddDays(careerToday(),1); d<=CC_YEAR_TO; d=ccAddDays(d,1))
    if((days.get(d)||[]).length) return d;
  return null;
}
```

Replace `careerSkipWeek`'s body (line 37998) so it moves seven days:

```js
  careerAdvanceTo(ccAddDays(careerMonday(careerToday()), 7));
```

Replace the post-cup advance (line 38194) with the same call.

`careerNext()` (36668) returns the event the PLAY button leads to. Replace its body with:

```js
function careerNext(){
  const days=careerEvents(), monday=careerMonday(careerToday());
  for(let d=0; d<7; d++){
    const on=days.get(ccAddDays(monday,d))||[];
    if(on.length) return {type:on[0].kind, title:on[0].label,
                          sub:L().ccYearSub[on[0].kind]||'', day:ccAddDays(monday,d)};
  }
  return {type:'free', title:L().chDayFree, sub:'', day:monday};
}
```

Add `ccYearSub` to both dictionaries beside `ccYearNames`:

```js
// ru
ccYearSub:{cup:'Одно окно, 11 игр', final:'Финал недели, только Дивизион 1',
  eval:'Два раунда за вечер, только Дивизион 1', major:'Плей-ин, хиты, ЛАН',
  gc:'Конец года', reload:'Отдельный круг, не FNCS'},
// en
ccYearSub:{cup:'One window, 11 games', final:'Weekly Final, Division 1 only',
  eval:'Two rounds in a night, Division 1 only', major:'Play-In, Heats, LAN',
  gc:'The end of the year', reload:'Its own circuit, not FNCS'},
```

- [ ] **Step 4: Run both harnesses**

Run: `node tools/check-career-clock-run.js`
Expected: PASS — `weeks walked: 38, last 2026-08-17` and `every week visited once, in order, and the year ends`.

Run: `node tools/check-career-cup.js`
Expected: PASS.

Run: `node tools/i18n-check.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-career-clock-run.js
git diff --cached --stat
git -c core.autocrlf=false commit -F - <<'MSG'
Walk the career by the calendar rather than by a counter

Advancing was cr.week++ against a ceiling of eleven. It is a date plus seven
days now, and the year ends where the measured year ends rather than where the
counter ran out — past 23 August there is no thirty-ninth week to walk into.

careerNext() reads the week's own days for the thing the button leads to,
instead of asking a schedule what kind of week this was.

tools/check-career-clock-run.js walks a career from the first day to the last
and checks the shape of the walk: thirty-eight weeks, each visited once, in
order, ending on its own.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 5: Wages arrive on the first of the month

**Files:**
- Modify: `index.html` — the salary slice at 37680

**Interfaces:**
- Consumes: `careerToday()`, `ccAddDays()`, `careerAdvanceTo()`.
- Produces: `careerPayWages(fromISO, toISO)` — credits one month's salary for every 1st of a month in `(fromISO, toISO]`.

- [ ] **Step 1: Write the failing probe**

Append to `tools/check-career-clock-run.js`'s `try` block:

```js
    // Nine firsts of a month fall inside the career year: 1 Dec through 1 Aug.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Paid', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:CC_YEAR_FROM, division:5, earnings:0, tokens:[], log:[]},
      org:{name:'Test Org', salary:12000, goal:{type:'promote', target:4}}, partner:null
    }));
    careerLoad(); careerMigrateClock();
    let g2 = 0;
    while (!CAREER.career.seasonOver && g2++ < 60) careerSkipWeek();
    const paid = CAREER.career.earnings;
    out.steps.push('a 12,000 a month deal over a career year paid ' + paid);
    if (paid !== 9 * 12000)
      fail('nine months of a 12,000 deal is 108,000, got ' + paid);
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tools/check-career-clock-run.js`
Expected: FAIL — the earnings will be a weekly slice, not nine monthly payments.

- [ ] **Step 3: Pay by the month**

Replace the weekly slice at line 37680:

```js
// Clubs pay by the month, and now that the clock is a date the career can too.
// Every first of a month the run passes over is a payday, so a week that steps
// across one pays on the way — the wage does not wait for the clock to land
// exactly on the 1st, which it mostly will not.
function careerPayWages(fromISO, toISO){
  const org=CAREER.org;
  if(!org || !org.salary) return 0;
  let paid=0;
  for(let d=ccAddDays(fromISO,1); d<=toISO; d=ccAddDays(d,1))
    if(d.slice(8)==='01') paid+=org.salary;
  if(paid){ CAREER.career.earnings=(CAREER.career.earnings||0)+paid; }
  return paid;
}
```

In `careerAdvanceTo`, pay for the days crossed before the clock moves:

```js
function careerAdvanceTo(iso){
  const cr=CAREER.career;
  const paid=careerPayWages(cr.day, iso>CC_YEAR_TO?CC_YEAR_TO:iso);
  if(paid) careerNews('good', L().ccNewsWage(paid.toLocaleString('en-US')));
  if(iso>CC_YEAR_TO){ cr.seasonOver=true; cr.day=CC_YEAR_TO; }
  else cr.day=iso;
  careerSave();
}
```

Add to both dictionaries:

```js
ccNewsWage:v=>'Зарплата от клуба: $'+v,     // ru
ccNewsWage:v=>'Club wages: $'+v,            // en
```

- [ ] **Step 4: Run the harness**

Run: `node tools/check-career-clock-run.js`
Expected: PASS — `a 12,000 a month deal over a career year paid 108000`.

Run: `node tools/i18n-check.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-career-clock-run.js
git diff --cached --stat
git -c core.autocrlf=false commit -F - <<'MSG'
Pay wages on the first of the month, the way clubs do

A salary was divided by the length of a season and paid a slice a week, which is
a number no club has ever quoted. With a date for a clock the career can pay the
way the contract reads: every first of a month the run passes over is a payday,
nine of them across a career year.

Paid on the way through rather than on arrival — a week that steps across the
1st still pays, and the clock mostly will not land on it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 6: News, the log and DMs are stamped with a date

**Files:**
- Modify: `index.html` — `careerNews` at 37751, `careerDmPush` at 37865, the two `cr.log.push` calls at 38105 and 38168, `careerNewsHTML` at 37862, the history table renderer (find with `grep -n "function careerLogHTML" index.html`)

**Interfaces:**
- Consumes: `careerToday()`, `careerWeekIndex()`.
- Produces: entries carrying `day` (ISO) instead of `week`; `ccStamp(entry)` → short display string, falling back to the old `week` field for entries written before this task.

- [ ] **Step 1: Write the failing probe**

Append to `tools/check-career-clock-run.js`:

```js
    careerNews('good', 'a thing happened');
    const n = CAREER.career.news[0];
    if (!n.day) fail('a news entry was written without a date');
    if (n.day !== careerToday()) fail('a news entry is stamped ' + n.day + ', clock says ' + careerToday());
    // An entry written before this change still renders rather than showing undefined.
    if (!ccStamp({season:1, week:4})) fail('an old week-stamped entry lost its stamp');
    out.steps.push('news carries a date, and old entries still read');
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node tools/check-career-clock-run.js`
Expected: FAIL — `a news entry was written without a date`.

- [ ] **Step 3: Stamp with the day**

At 37751, replace the push:

```js
  cr.news.unshift({season:cr.season, day:careerToday(), kind, text});
```

At 37865:

```js
  t.msgs.push({from, text, season:cr.season, day:careerToday()});
```

At 38105 and 38168, replace `week:cr.week` with `day:careerToday()`.

Add the display helper beside `careerNewsHTML`:

```js
// What an entry says it happened on. Entries written before the clock became a
// date carry a week and no day, and they still have to read — a save is not
// worth breaking over a label.
function ccStamp(e){
  if(!e.day) return L().chWeek+' '+e.week;
  const t=new Date(e.day+'T00:00:00Z');
  // calDows starts on Monday; getUTCDay starts on Sunday.
  const dow=L().calDows[(t.getUTCDay()+6)%7];
  return dow+' '+t.getUTCDate()+' '+L().calMonthsShort[t.getUTCMonth()];
}
```

Add short month names to both dictionaries:

```js
// ru
calMonthsShort:['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'],
// en
calMonthsShort:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
```

Three places render a stamp, and all three take `ccStamp`:

- line 37776, in `careerNewsHTML`: the whole `(n.season===...)+L().chWeek+' '+n.week` expression becomes `ccStamp(n)`.
- line 37962, the DM thread's message stamp: `${L().chSeason} ${m.season} · ${L().chWeek} ${m.week}` becomes `${ccStamp(m)}`.
- line 38267, the history table's first column: `${L().chSeason} ${e.season} · ${L().chWeek} ${e.week}` becomes `${ccStamp(e)}`.

After editing, `grep -n "L().chWeek" index.html` must return only the hub's own
labels — 36755, 36831, 36861, 36917 — and nothing inside a feed, a thread or the
history table.

- [ ] **Step 4: Run everything**

Run: `node tools/check-career-clock-run.js` — PASS
Run: `node tools/check-career-cup.js` — PASS
Run: `node tools/i18n-check.js` — PASS
Run: `SNAP_H=1340 node tools/snap-career.js /tmp/hub.png centre` and check the feed reads e.g. `Mon 19 Jan` rather than `Week 3`.

- [ ] **Step 5: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-career-clock-run.js
git diff --cached --stat
git -c core.autocrlf=false commit -F - <<'MSG'
Stamp the feed, the log and the inbox with a date

An entry said which week it happened in, which was the only thing the old clock
could tell it. It says the day now. The history screen is shaped like a Tracker
profile and Tracker shows dates, so it gets more honest rather than less.

Entries written before this still render: ccStamp falls back to the week they
carry. A save is not worth breaking over a label.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 7: The year, end to end

**Files:**
- Create: `tools/career-day-clock.js`
- Modify: `tools/check-career-cup.js` — the final save assertion
- Modify: `tools/career-arc-calibration.js` — its week loop

**Interfaces:**
- Consumes: everything above.
- Produces: nothing the page uses; this is the acceptance test for the whole change.

- [ ] **Step 1: Write the harness**

Create `tools/career-day-clock.js` with the standard boilerplate and this body, which plays a career year through the interface rather than around it:

```js
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'YearMan', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:CC_YEAR_FROM, division:5, earnings:0, tokens:[], log:[]},
      partner:null
    }));
    const s0 = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s0.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s0));
    careerEntry();

    const days = careerEvents();
    const cupDays = [...days.keys()].filter(k => (days.get(k)||[]).some(e => e.kind === 'cup'));
    out.steps.push('divisional cup days in the year: ' + cupDays.length);
    if (cupDays.length < 30) fail('a year should hold more than thirty cup windows');

    // Every day of the year is reachable and none is visited twice.
    const visited = new Set();
    let guard = 0;
    while (!CAREER.career.seasonOver && guard++ < 60) {
      const monday = careerMonday(careerToday());
      for (let d = 0; d < 7; d++) visited.add(ccAddDays(monday, d));
      careerSkipWeek();
    }
    out.steps.push('days covered: ' + visited.size);
    if (visited.size < 38 * 7 - 7) fail('the year has holes in it: ' + visited.size + ' days');
    if (!CAREER.career.seasonOver) fail('the year did not end');
    out.steps.push('the year ends on ' + CAREER.career.day);
```

- [ ] **Step 2: Run it**

Run: `node tools/career-day-clock.js`
Expected: PASS, with more than thirty cup days and 266 days covered.

- [ ] **Step 3: Repair the two harnesses that count weeks**

In `tools/check-career-cup.js`, the final save block reads `week: saved.career.week`. Replace with `day: saved.career.day`.

In `tools/career-arc-calibration.js`, line 36 hard-codes the season's cup weeks:

```js
    const cupWeeks = [1,2,3,4,6,7,8,9];
```

Replace it with the career year's own cup weeks, read off the calendar rather
than listed — **weeks, not days**, per the decision at the top of this plan:

```js
    // The weeks of the career year that hold a divisional cup, off the measured
    // calendar rather than a list. A cup runs Monday and Tuesday and those are
    // two windows of one tournament, so this counts weeks: a career plays one
    // cup a week, the way it always has.
    const cupWeeks = [];
    for (let w = 1; w <= CAREER_WEEKS; w++) {
      let has = false;
      for (let d = 0; d < 7 && !has; d++)
        has = (careerYearDays().get(ccAddDays(careerWeekStart(w), d)) || [])
                .some(e => e.kind === 'cup');
      if (has) cupWeeks.push(w);
    }
```

Line 46 creates the save with `week: 1`; change to `day: CC_YEAR_FROM`.
Line 52 sets `CAREER.career.week = w`; change to:

```js
            CAREER.career.day = careerWeekStart(w);
```

The harness will report a different band: a career year holds about twenty-one
cup weeks where the old season held eight, so a career gains more rating per
year simply by playing more of them. **That is a change of scale, not of
balance** — the per-cup growth rule is untouched. Record the new band in the
commit message and in `2026-08-08-career-mode-design.md`, so the next person
comparing against the old numbers knows why they moved.

- [ ] **Step 4: Run every career harness**

```bash
node tools/check-career-year.js
node tools/check-career-clock-run.js
node tools/career-day-clock.js
node tools/check-career-cup.js
node tools/check-career-eval.js
node tools/check-career-map.js
node tools/career-arc-calibration.js
node tools/i18n-check.js
```

Expected: all pass. `career-arc-calibration.js` prints a different band from before; that is the point of running it.

- [ ] **Step 5: Commit**

```bash
git -c core.autocrlf=false add tools/
git -c core.autocrlf=false commit -F - <<'MSG'
Play a whole career year through the interface, and check it has no holes

tools/career-day-clock.js walks a career from the first day of the measured year
to the last, through the hub rather than around it, and checks the shape: more
than thirty divisional cup windows in a year, two hundred and sixty-six days
covered with none visited twice, and a year that ends on its own.

check-career-cup.js read a week out of the save, which no longer exists, and
career-arc-calibration.js counted eleven of them. Both count days now. The arc
harness reports a different band because a career year is three and a half times
the season it used to measure — a change of scale, not of balance.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

## What this plan does not build

Energy, the four activities, fatigue and the inversion that makes a career
player's six numbers primary. Those are the second half of the spec and get
their own plan, because this one produces working software on its own: a career
that runs the measured year, on real dates, with the calendar and the wages that
follow from it. The day's *choices* need the day's *clock* first, and this is
the clock.

The week planner's buttons, the three rings from the reference, the Division 1
standings tile, and the FIFA-style entry tiles all belong to that second plan or
to `2026-08-14-division-one-scene-design.md`.
