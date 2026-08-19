# Alternating trio seasons — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every second career season a trio season on the same 2026 calendar and the same card pool — season 1 duos, season 2 trios, season 3 duos.

**Architecture:** Squad size becomes a stored property of the season (`cr.size`) rather than a constant, read everywhere through `careerSquadSize()`. The single `CAREER.partner` record becomes a `CAREER.partners` list of up to two, reached through `careerMates()`, with `careerPartnerCard()` kept as "the first mate" so the ~40 existing duo-shaped call sites keep working. Field sizes and prize tables gain a trio branch that resolves to numbers Epic actually published for trios in 2025.

**Tech Stack:** One file, `index.html` — plain browser JavaScript, no build step, no framework. Tests are `tools/check-*.js`: node scripts that write a copy of `index.html` with a probe script appended, run it under headless Chrome, and read a JSON result back out of the DOM.

**Spec:** `docs/superpowers/specs/2026-08-19-trio-season-design.md`

## Global Constraints

- All code lives in `C:\Users\FoxOS_User\Desktop\fncsdraftmajor\index.html`. There is no module system; functions are top-level and hoisted.
- **Never edit `index.html` with a `node -e` one-liner.** Backtick and quote escaping through the shell has silently corrupted this file twice. Use the Edit tool, or a script written to a file first with a heredoc and then run.
- The file is LF-terminated in the working copy and CRLF in the git index, so `git diff` is not a useful review tool here. Review by reading the changed region.
- **Do not commit.** Commits in this repository are the owner's call. Each task ends with harnesses green, not with a commit.
- A duo season must behave identically after every task. `cr.size === 2` is the whole of the duo path, and the existing harnesses are the proof.
- Comments in this file explain *why*, in prose, and record the report or decision that caused the change. Match that. Do not add comments that restate the code.
- Run a harness with `node tools/<name>.js` from the repository root. Exit code 0 is a pass; failures print `FAIL <what>`.
- Regression set, run after every task: `check-career-year`, `check-career-major`, `check-career-summit`, `check-career-globals`, `check-career-gclc`, `check-career-seat`, `check-career-seat-keeps`, `check-career-agent`, `check-language-both`.

---

## File structure

| File | Responsibility |
|---|---|
| `index.html` | Everything. The changes cluster in four regions: the career save/migration block (~line 40000), the partner and growth block (~43500), the career runners (~51300–52900), and the prize tables (~33800). |
| `tools/check-career-trio.js` | New. Plays a trio season through the real functions and asserts squad size, field sizes, purse source, chemistry and the two-seat inbox. Grows across tasks 1–5. |

---

## Task 1: Squad size becomes a property of the season

**Files:**
- Modify: `index.html` — add `careerSquadSize()` and `careerMigrateSize()` next to `careerMigrateClock()`; set `cr.size` in `careerNewSeason()` and in `ccStart()`; call the migration in the career entry point beside the other three.
- Test: `tools/check-career-trio.js` (create)

**Interfaces:**
- Produces: `careerSquadSize() -> 2 | 3`, reading `CAREER.career.size`. `careerMigrateSize()`, called once on load.
- Consumes: nothing.

- [ ] **Step 1: Write the failing test**

Create `tools/check-career-trio.js`. Copy the harness scaffolding from `tools/check-agent-terms.js` — same Chrome discovery, same probe-injection, same `PBEGIN`/`PEND` result protocol — and use this probe body:

```javascript
'  window.addEventListener("load", function(){',
'    try{',
'      // A season number decides the shape of the year: odd is duos, even trios.',
'      CAREER = {v:1, player:{nick:"T", age:19, source:"built", country:"RS",',
'                             region:"EU", ovr:88},',
'                career:{season:1, day:"2026-01-05", division:1, earnings:0, log:[]},',
'                partner:null};',
'      CAREER.career.size = 2;',
'      check("a duo season is two", careerSquadSize() === 2, String(careerSquadSize()));',
'      CAREER.career.size = 3;',
'      check("a trio season is three", careerSquadSize() === 3, String(careerSquadSize()));',
'',
'      // A save written before this existed is a duo season, not a broken one.',
'      delete CAREER.career.size;',
'      careerMigrateSize();',
'      check("a save with no size migrates to duos", CAREER.career.size === 2,',
'            String(CAREER.career.size));',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tools/check-career-trio.js`
Expected: FAIL — the probe throws `careerSquadSize is not defined`, printed as the `err` field.

- [ ] **Step 3: Add the accessor and the migration**

Insert immediately after `careerMigrateClock()` in `index.html`:

```javascript
/* How many people a season is played by.

   His ask, 19 August: alternate the years, duos and then trios, on the same
   measured calendar and the same cards. So the size of a squad stops being a
   constant and becomes something a season owns.

   Stored on the career rather than worked out from the season number every time
   it is asked. A derived rule would re-shape a season somebody is halfway
   through the moment the rule is edited — the same reason an agreed agent fee
   lives on the contract instead of being looked up. */
function careerSquadSize(){
  const n=CAREER && CAREER.career && CAREER.career.size;
  return n===3 ? 3 : 2;
}
// A save from before the trio years is a duo season, which is what it played.
function careerMigrateSize(){
  const cr=CAREER && CAREER.career;
  if(!cr || cr.size!=null) return;
  cr.size=2;
  careerSave();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node tools/check-career-trio.js`
Expected: PASS, printing `the season decides the size of the squad`.

- [ ] **Step 5: Write the size at the two places a season begins**

In `ccStart()`, in the `career:` literal, add `size:2` beside `season:1` — a new career always starts in the duo year.

In `careerNewSeason()`, on the line that reads `cr.season++; cr.day=careerStartDay(); cr.seasonOver=false;`, append the size for the season just started:

```javascript
  cr.season++; cr.day=careerStartDay(); cr.seasonOver=false;
  // Odd years are duos and even years are trios. Written down rather than
  // derived — see careerSquadSize.
  cr.size = (cr.season % 2) ? 2 : 3;
```

- [ ] **Step 6: Call the migration where the other three are called**

In the career entry point, change:

```javascript
  if(careerExists()){ careerLoad(); careerMigrateClock(); careerMigrateMoney(); careerMigrateOrg(); openCareerHub(); return; }
```

to add `careerMigrateSize();` after `careerMigrateOrg();`.

- [ ] **Step 7: Extend the test to cover the boundary**

Append to the probe body, before `done();`:

```javascript
'      CAREER.career.season = 1; CAREER.career.size = 2;',
'      CAREER.career.division = 2;',   // avoids the Division 1 relegation branch
'      careerNewSeason();',
'      check("season two is a trio year", CAREER.career.size === 3,',
'            "season " + CAREER.career.season + " size " + CAREER.career.size);',
'      careerNewSeason();',
'      check("season three is back to duos", CAREER.career.size === 2,',
'            "season " + CAREER.career.season + " size " + CAREER.career.size);',
```

- [ ] **Step 8: Run the test and the regression set**

Run: `node tools/check-career-trio.js`
Expected: PASS.

Run each of: `node tools/check-career-year.js`, `check-career-major.js`, `check-career-summit.js`, `check-career-globals.js`, `check-career-gclc.js`, `check-career-seat.js`, `check-career-seat-keeps.js`, `check-career-agent.js`, `check-language-both.js`
Expected: all exit 0. Nothing observable has changed yet — `careerSquadSize()` exists but nothing reads it.

---

## Task 2: One partner record becomes a list of two

**Files:**
- Modify: `index.html` — `careerPartnerCard()` and the block around it; add `careerMates()`, `careerMateRecords()`, `careerMigratePartners()`; call the migration beside `careerMigrateSize()`.
- Test: `tools/check-career-trio.js`

**Interfaces:**
- Consumes: `careerSquadSize()` from Task 1.
- Produces: `careerMateRecords() -> Array<{handle, cardRegion, patience, since, dev, card}>` (the raw save records, length 0–2); `careerMates() -> Array<card>` (the lifted cards, one per filled slot); `careerPartnerCard() -> card | null` (unchanged meaning: the first mate); `careerMateSeats() -> number` (how many seats this season has, i.e. `careerSquadSize() - 1`).

- [ ] **Step 1: Write the failing test**

Append to the probe body in `tools/check-career-trio.js`, before `done();`:

```javascript
'      // The list, and the old field folded into it.',
'      var roster = careerRosterNowEU();',
'      CAREER = {v:1, player:{nick:"T", age:19, source:"built", country:"RS",',
'                             region:"EU", ovr:88},',
'                career:{season:2, size:3, day:"2026-03-02", division:1,',
'                        earnings:0, log:[]},',
'                partner:{handle:roster[1].handle, cardRegion:"EU",',
'                         patience:80, since:"2026-01-01"}};',
'      careerMigratePartners();',
'      check("the old single partner becomes slot zero",',
'            Array.isArray(CAREER.partners) && CAREER.partners.length === 1 &&',
'            CAREER.partners[0].handle === roster[1].handle,',
'            JSON.stringify(CAREER.partners));',
'      check("and the old field is gone", CAREER.partner == null,',
'            JSON.stringify(CAREER.partner));',
'      check("careerPartnerCard still answers with the first mate",',
'            (careerPartnerCard()||{}).handle === roster[1].handle);',
'      check("a trio season has two seats", careerMateSeats() === 2,',
'            String(careerMateSeats()));',
'      check("one of them is filled", careerMates().length === 1,',
'            String(careerMates().length));',
'      CAREER.partners.push({handle:roster[2].handle, cardRegion:"EU",',
'                            patience:80, since:"2026-02-01"});',
'      check("and now both are", careerMates().length === 2,',
'            String(careerMates().length));',
'      CAREER.career.size = 2;',
'      check("a duo season has one seat", careerMateSeats() === 1,',
'            String(careerMateSeats()));',
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tools/check-career-trio.js`
Expected: FAIL — `careerMigratePartners is not defined`.

- [ ] **Step 3: Add the list, the accessors and the migration**

Replace the body of `careerPartnerCard()` with the version below, and add the three functions above it. The `lift` closure moves out of `careerPartnerCard` so both it and `careerMates` use one copy.

```javascript
/* The seat next to you, which in a trio year is two seats.

   It was one record, CAREER.partner, and about forty places read it through
   careerPartnerCard. Most of them mean "the person I play with" in a place where
   one is the answer, so careerPartnerCard stays and answers with the first mate;
   what moved to careerMates is the handful that mean "everybody I play with" —
   the runners, the seat lock, the squad panel.

   Per slot, because they are per person: how long they have been here, how much
   patience they have left, and what this career has done to their rating. */
function careerMateRecords(){
  const list=(CAREER && CAREER.partners) || [];
  return list.filter(Boolean).slice(0, careerMateSeats());
}
function careerMateSeats(){ return careerSquadSize()-1; }
// What this career has done to them since they took the seat, applied to a copy:
// the roster's card is the roster's, and attrsFor lifts the six numbers onto
// whatever rating it is handed.
function ccMateLift(c, dev){
  if(!dev || !c) return c;
  const base=(c._ovr!=null ? c._ovr : (attrsFor(c)||{}).ovr);
  if(!(base>0)) return c;
  const to=clamp(Math.round(base+dev), 35, CAREER_SCALE_TOP);
  const out={...c, _targetOvr:to, rating:to};
  delete out._attrs; delete out._ovr;
  return out;
}
function ccMateCardOf(pr){
  if(!pr) return null;
  if(pr.card) return ccMateLift(pr.card, pr.dev||0);
  // The newest 2026 card first — a handle used to resolve to whichever card of
  // that person PLAYERS happened to list first, any era — then the whole roster
  // for a legacy save whose partner has no card this year.
  const now=careerRosterNowEU().find(x=>x.handle===pr.handle);
  if(now) return ccMateLift({...now}, pr.dev||0);
  const found=PLAYERS.find(x=>x.handle===pr.handle && x.region===(pr.cardRegion||'EU'));
  return found ? ccMateLift({...found}, pr.dev||0) : null;
}
function careerMates(){
  return careerMateRecords().map(ccMateCardOf).filter(Boolean);
}
function careerPartnerCard(){
  return careerMates()[0] || null;
}
// One record becomes a list of one. A career that has played a whole season in a
// duo keeps the person it played it with, in the seat they were already in.
function careerMigratePartners(){
  if(!CAREER || CAREER.partners) return;
  CAREER.partners = CAREER.partner ? [CAREER.partner] : [];
  delete CAREER.partner;
  careerSave();
}
```

- [ ] **Step 4: Point `careerMateDev` at the list**

`careerMateDev()` reads `CAREER.partner.dev` and is used by growth. It now means "the first mate's dev", which is what its callers mean:

```javascript
function careerMateDev(){ return (careerMateRecords()[0] || {}).dev || 0; }
```

- [ ] **Step 5: Call the migration**

In the career entry point, add `careerMigratePartners();` after `careerMigrateSize();`.

- [ ] **Step 6: Replace every remaining write to `CAREER.partner`**

Run `grep -n "CAREER\.partner\b" index.html` and change each write site to act on the list. There are two shapes:

- `CAREER.partner = null;` (a mate walking) becomes a removal of that mate's slot — see Task 3, which owns the poach path. For now change it to `CAREER.partners = [];` so the file has no reader of the dead field.
- `CAREER.partner = {...}` (a mate signing) becomes `CAREER.partners = (CAREER.partners||[]).concat([{...}]).slice(0, careerMateSeats());`

Verify with `grep -c "CAREER\.partner\b" index.html` — the only remaining hits must be inside `careerMigratePartners`.

- [ ] **Step 7: Run the test and the regression set**

Run: `node tools/check-career-trio.js`
Expected: PASS.

Run the full regression set.
Expected: all exit 0. A duo season has one seat and one mate, which is what it had.

---

## Task 3: Chemistry, the inbox, poaching and the seat lock

**Files:**
- Modify: `index.html` — `careerChemDays()`, `careerChem()`, `careerMateFactor()`, `careerSeatTopUp()`, `careerSeatDm()`, `careerMatePoach()`, `careerSlotHeld()`.
- Test: `tools/check-career-trio.js`

**Interfaces:**
- Consumes: `careerMates()`, `careerMateRecords()`, `careerMateSeats()` from Task 2.
- Produces: `careerMateDrop(handle) -> boolean`, which removes one named mate and leaves the others.

- [ ] **Step 1: Write the failing test**

Append to the probe body:

```javascript
'      // A trio is played in as far as its newest member is.',
'      CAREER.career.size = 3;',
'      CAREER.career.day = "2026-06-01";',
'      CAREER.partners = [{handle:roster[1].handle, cardRegion:"EU", patience:80,',
'                          since:"2026-01-01"},',
'                         {handle:roster[2].handle, cardRegion:"EU", patience:80,',
'                          since:"2026-05-29"}];',
'      check("chemistry reads the newest member", careerChemDays() === 3,',
'            String(careerChemDays()));',
'',
'      // Losing one leaves the other.',
'      careerMateDrop(roster[1].handle);',
'      check("dropping one mate leaves the other",',
'            careerMates().length === 1 &&',
'            careerMates()[0].handle === roster[2].handle,',
'            careerMates().map(function(m){return m.handle;}).join(","));',
'',
'      // And the inbox writes about every empty seat, not about one.',
'      CAREER.partners = [];',
'      CAREER.career.dms = [];',
'      CAREER.player.ovr = 88;',
'      careerSeatTopUp();',
'      var seatThreads = careerDms().filter(function(t){ return t.who && t.who.seat; });',
'      check("an empty trio writes about both seats",',
'            seatThreads.length >= 2, String(seatThreads.length));',
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tools/check-career-trio.js`
Expected: FAIL — `careerChemDays` returns the days since `CAREER.partner.since`, which is now `undefined`, so it answers 0 rather than 3; and `careerMateDrop` is not defined.

- [ ] **Step 3: Chemistry takes the shortest**

Replace `careerChemDays()`:

```javascript
/* How long this squad has been a squad.

   The shortest of them, not the average. A trio is played in as far as its
   newest member is, and an average would let a partnership of three months cover
   for somebody who arrived last week — which is not what the lobby sees. */
function careerChemDays(){
  const recs=careerMateRecords().filter(p=>p && p.since);
  if(!recs.length) return 0;
  return Math.min.apply(null, recs.map(p=>Math.max(0, ccDaysBetween(p.since, careerToday()))));
}
```

`careerChem()` already guards on `careerPartnerCard()`; change that guard to `if(!careerMates().length) return 0;` so a trio missing only its third still has the chemistry it has.

- [ ] **Step 4: Growth reads the strongest mate**

Replace the body of `careerMateFactor()`:

```javascript
function careerMateFactor(myOvr){
  const mates=careerMates();
  if(!mates.length) return 1;
  /* The best seat at the table, not the sum of them.

     Summing two gaps would hand a trio a faster arc than a duo for arithmetic
     reasons rather than for anything that happened in a lobby, and the range
     here is deliberately narrow — a partner should shape a career and never
     replace playing well. */
  const best=Math.max.apply(null, mates.map(m=>{
    const his=(m._ovr!=null ? m._ovr : (attrsFor(m)||{}).ovr);
    return isFinite(his) ? his : -Infinity;
  }));
  if(!isFinite(best)) return 1;
  const gap=best-myOvr;
  const f=1 + (gap>0 ? gap*CC_MATE_UP : gap*CC_MATE_DOWN);
  return clamp(f, CC_MATE_MIN, CC_MATE_MAX);
}
```

- [ ] **Step 5: Add `careerMateDrop`**

Place it beside `careerMigratePartners`:

```javascript
// One person leaves, not the squad. A poach takes the player it names and the
// rest of the seats are untouched — which is the whole difference between
// losing a partner and losing a team.
function careerMateDrop(handle){
  const list=(CAREER && CAREER.partners) || [];
  const at=list.findIndex(p=>p && p.handle===handle);
  if(at<0) return false;
  list.splice(at, 1);
  careerSave();
  return true;
}
```

In `careerMatePoach()`, replace `CAREER.partner=null;` with `careerMateDrop(mate.handle);`.

- [ ] **Step 6: The inbox writes about every empty seat**

`careerSeatTopUp()` currently writes `CC_SEAT_DMS` letters when the seat is empty. Make it write that many per empty seat:

```javascript
function careerSeatTopUp(){
  let wrote=false;
  // One conversation per empty chair, not one per career: a trio with two seats
  // open is two people short and hears from people about both.
  const open=careerMateSeats()-careerMates().length;
  for(let s=0; s<open; s++)
    for(let n=0; n<CC_SEAT_DMS; n++){
      if(!careerSeatDm(careerToday()+'|'+s+'|'+n)) break;
      wrote=true;
    }
  if(wrote) careerSave();
}
```

`careerSeatDm(tag)` returns falsy when the seat is full; it reads `careerPartnerCard()`. Change that check to `careerMates().length >= careerMateSeats()` so it stops at the right point.

The button that accepts a letter appends to `CAREER.partners` (Task 2, step 6) and so fills the first empty slot with no further change.

- [ ] **Step 7: The LAN seat lock holds the whole squad**

`careerSlotHeld()` needs no change — it asks what the career has qualified for, not who is in it. Confirm by reading it that no branch reads `CAREER.partner`; if one does, point it at `careerMates()`.

- [ ] **Step 8: Run the test and the regression set**

Run: `node tools/check-career-trio.js`
Expected: PASS.

Run the full regression set, and additionally `node tools/check-career-shop.js` (the coach's chemistry bonus rides on `careerChem`).
Expected: all exit 0.

---

## Task 4: Field sizes

**Files:**
- Modify: `index.html` — add the four accessors below near `CAREER_CUP_FIELD`; point the career runners at them.
- Test: `tools/check-career-trio.js`

**Interfaces:**
- Consumes: `careerSquadSize()`.
- Produces: `ccCupField()`, `ccCupCut()`, `ccMajorFinalField()`, `ccGlobField()` — each returning the duo number in a duo season and the trio number in a trio one.

- [ ] **Step 1: Write the failing test**

Append to the probe body:

```javascript
'      CAREER.career.size = 2;',
'      check("a duo cup is 150 of them", ccCupField() === 150, String(ccCupField()));',
'      check("cutting to 50", ccCupCut() === 50, String(ccCupCut()));',
'      check("a duo Major Final is 50", ccMajorFinalField() === 50, String(ccMajorFinalField()));',
'      check("and Antwerp is 50", ccGlobField() === 50, String(ccGlobField()));',
'      CAREER.career.size = 3;',
'      check("a trio cup is 100 of them", ccCupField() === 100, String(ccCupField()));',
'      check("cutting to 33", ccCupCut() === 33, String(ccCupCut()));',
'      check("a trio Major Final is 33", ccMajorFinalField() === 33, String(ccMajorFinalField()));',
'      check("and Antwerp is 33", ccGlobField() === 33, String(ccGlobField()));',
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tools/check-career-trio.js`
Expected: FAIL — `ccCupField is not defined`.

- [ ] **Step 3: Add the accessors**

Immediately after `const CAREER_CUP_FIELD=150, CAREER_CUP_GAMES=11, CAREER_CUP_CUT=50;`:

```javascript
/* The same room, a third fewer teams.

   A career cup seats three hundred players either way; in trios that is a
   hundred teams rather than a hundred and fifty, and the cut scales with it.
   The constants above stay at their duo values and are read through these, so a
   duo season is untouched by every one of these lines.

   TEAM_TARGET already holds the lobby itself — 50 duos, 33 trios — and most of
   the simulation reads it on its own. These four are the numbers that were
   written down as duo numbers instead. */
const CC_TRIO_CUP_FIELD=100, CC_TRIO_CUP_CUT=33, CC_TRIO_FINAL=33;
function ccCupField(){ return careerSquadSize()===3 ? CC_TRIO_CUP_FIELD : CAREER_CUP_FIELD; }
function ccCupCut(){ return careerSquadSize()===3 ? CC_TRIO_CUP_CUT : CAREER_CUP_CUT; }
function ccMajorFinalField(){ return careerSquadSize()===3 ? CC_TRIO_FINAL : 50; }
function ccGlobField(){ return careerSquadSize()===3 ? CC_TRIO_FINAL : CC_GLOB_FIELD; }
```

- [ ] **Step 4: Point the runners at them**

Run `grep -n "CAREER_CUP_FIELD\|CAREER_CUP_CUT\|CC_GLOB_FIELD" index.html`. Inside career runners and career gating functions only — not inside the draft mode — replace:

- `CAREER_CUP_FIELD` with `ccCupField()`
- `CAREER_CUP_CUT` with `ccCupCut()`
- `CC_GLOB_FIELD` with `ccGlobField()`

and in `runCareerMajor`, replace the hard `field:50` in `CC_MAJOR_STAGE.final` with a read of `ccMajorFinalField()` at the point the field is built.

Leave the constants themselves defined — the accessors and the draft mode both still name them.

- [ ] **Step 5: Run the test and the regression set**

Run: `node tools/check-career-trio.js`
Expected: PASS.

Run the full regression set.
Expected: all exit 0 — every one of them plays a duo season, where the accessors return the old constants.

---

## Task 5: Prizes

**Files:**
- Modify: `index.html` — `prizeTableFor()`, and the Reload/Summit note.
- Test: `tools/check-career-trio.js`

**Interfaces:**
- Consumes: `careerSquadSize()`.
- Produces: no new names; `prizeTableFor(table)` gains a trio branch.

- [ ] **Step 1: Write the failing test**

Append to the probe body:

```javascript
'      // A trio season is paid off the tables Epic published for trios.',
'      CARD_MODE = true; CARD_SET = "m2";',
'      CAREER.career.size = 3;',
'      check("a trio Major pays the 2025 trio table",',
'            prizeFor("EU", 1) === P2025_PRIZES.EU["1"],',
'            prizeFor("EU", 1) + " vs " + P2025_PRIZES.EU["1"]);',
'      check("and Antwerp pays Lyon\\u2019s 33 places",',
'            prizeFor("GC2026", 1) === GC2025_PRIZES["1"] &&',
'            prizeFor("GC2026", 34) === 0,',
'            prizeFor("GC2026", 1) + " / " + prizeFor("GC2026", 34));',
'      CAREER.career.size = 2;',
'      check("a duo Major still pays the 2026 duo table",',
'            prizeFor("EU", 1) === PRIZE_TABLES_M2.EU["1"],',
'            String(prizeFor("EU", 1)));',
'      check("and Antwerp pays its own", prizeFor("GC2026", 1) === GC2026_PRIZES["1"],',
'            String(prizeFor("GC2026", 1)));',
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tools/check-career-trio.js`
Expected: FAIL — a trio season still reads `PRIZE_TABLES_M2`, so the first check reports the 2026 duo number against the 2025 trio one.

- [ ] **Step 3: Add the trio branch**

At the top of `prizeTableFor(table)`, before the `GCLC` line:

```javascript
  /* A trio season is paid what a trio was actually paid.

     The 2026 calendar is a duo year and its purse is a duo purse, so a trio
     season played on it borrows the year that was measured in trios: P2025_PRIZES
     per region for a Major, and Lyon's own thirty-three places for Antwerp. Not
     a conversion of the duo table — a published one.

     The Reload Elite Series and the Summit are the exception and the only
     invented money in the mode's career: nobody has ever played either in trios,
     so there is no trio purse to read, and they keep their own 2026 table paid
     over a smaller field. It is the same fiction as the agents' spread and it is
     named here so nobody mistakes it for a measurement. */
  if(careerSquadSize()===3){
    if(table==='GC2026' || table==='GC2025') return GC2025_PRIZES;
    if(P2025_PRIZES[table]) return P2025_PRIZES[table];
  }
```

Note that `SUMMIT` and the Reload tables fall through this branch untouched, because `P2025_PRIZES` has no key for them — which is exactly the behaviour the comment describes.

- [ ] **Step 4: Run the test and the regression set**

Run: `node tools/check-career-trio.js`
Expected: PASS.

Run the full regression set plus `node tools/check-lan-prizes.js` and `node tools/check-career-shop.js`.
Expected: all exit 0.

---

## Task 6: The hub says which year it is

**Files:**
- Modify: `index.html` — the squad panel in `careerCentreHTML`, the "next up" card, and the two locale blocks (`ru` near line 3500, `en` near line 4750).
- Test: `tools/check-career-trio.js`, `tools/check-language-both.js`

**Interfaces:**
- Consumes: `careerSquadSize()`, `careerMates()`, `careerMateSeats()`.
- Produces: locale strings `ccSeasonDuos`, `ccSeasonTrios`, `ccSeatEmpty`.

- [ ] **Step 1: Write the failing test**

Append to the probe body:

```javascript
'      LANG = "en";',
'      check("the year names itself", !!L().ccSeasonTrios && !!L().ccSeasonDuos &&',
'            !!L().ccSeatEmpty);',
'      LANG = "ru";',
'      check("in both languages", !!L().ccSeasonTrios && !!L().ccSeasonDuos &&',
'            !!L().ccSeatEmpty);',
'      LANG = "en";',
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tools/check-career-trio.js`
Expected: FAIL — `the year names itself`, because the strings do not exist.

- [ ] **Step 3: Add the strings to both locales**

In the Russian block, beside the other `cc` career strings:

```javascript
ccSeasonDuos:'Сезон в дуо', ccSeasonTrios:'Сезон в трио',
ccSeatEmpty:'Место свободно',
```

In the English block, in the matching place:

```javascript
ccSeasonDuos:'A duos season', ccSeasonTrios:'A trios season',
ccSeatEmpty:'Seat open',
```

- [ ] **Step 4: Draw the squad with as many chairs as the season has**

In the squad panel of `careerCentreHTML`, replace the single partner row with a row per seat, drawing `L().ccSeatEmpty` for an empty one:

```javascript
  const seats=[];
  for(let i=0; i<careerMateSeats(); i++){
    const m=careerMates()[i];
    seats.push(m ? careerMateRowHTML(m)
                 : `<div class="ch-row ch-row-empty"><em>${L().ccSeatEmpty}</em></div>`);
  }
```

Use whatever the file already calls its partner-row builder; if the row is written inline rather than in a function, lift it into `careerMateRowHTML(card)` first and call it from both places.

- [ ] **Step 5: Say which year it is on the "next up" card**

In the header of the "next up" block, beside the season number, add:

```javascript
${careerSquadSize()===3 ? L().ccSeasonTrios : L().ccSeasonDuos}
```

- [ ] **Step 6: Run the test and the regression set**

Run: `node tools/check-career-trio.js` and `node tools/check-language-both.js`
Expected: PASS — `check-language-both` verifies that every key present in one locale is present in the other.

Run the full regression set.
Expected: all exit 0.

- [ ] **Step 7: Play it once, by hand**

Serve the file and open it: start a career, force `CAREER.career.size = 3` from the console, and open the hub. Confirm three chairs, two inbox letters about the empty seats, and that the "next up" card says it is a trios season.

---

---

## Task 7: A trio season is played on a 2025 island

**Files:**
- Modify: `index.html` — add `careerBrSet()` beside `careerSquadSize()`; point `careerPlay()` at it.
- Test: `tools/check-career-trio.js`

His ask, 19 August, arriving mid-build: in a trio season the map should change too.
The file already holds the three islands the trio year was actually played on —
`t1`, `t2` and `t3` in `MAP_ART`, each with its own drop-box grid and its own
counted loot, read off that Major's own drop map. So a trio season plays the trio
year's islands rather than the 2026 one, and the alternation stops being the same
year with an extra chair in it.

The Reload circuit is not in this. Reload has its own islands in every year —
`r1` to `r4` — and `runCareerReload`, `runCareerReloadChampionship` and
`runCareerVictory` already name them a line after the default. A trio Reload is
played on the Reload island, the same as a duo one.

**Interfaces:**
- Consumes: `careerSquadSize()`, `careerToday()`.
- Produces: `careerBrSet() -> 'm2' | 't1' | 't2' | 't3'`.

- [ ] **Step 1: Write the failing test**

Append to the probe body in `tools/check-career-trio.js`, before `done();`:

```javascript
'      // A duo season is the 2026 island, all year.',
'      CAREER.career.size = 2;',
'      CAREER.career.day = "2026-03-02";',
'      check("a duo season plays the 2026 island", careerBrSet() === "m2", careerBrSet());',
'      CAREER.career.day = "2026-08-20";',
'      check("and still does in August", careerBrSet() === "m2", careerBrSet());',
'',
'      // A trio season walks the three islands the trio year was played on.',
'      CAREER.career.size = 3;',
'      CAREER.career.day = "2026-03-02";',
'      check("a trio season opens on the first", careerBrSet() === "t1", careerBrSet());',
'      CAREER.career.day = "2026-05-20";',
'      check("moves to the second after Major 1", careerBrSet() === "t2", careerBrSet());',
'      CAREER.career.day = "2026-08-20";',
'      check("and to the third for the run to Antwerp",',
'            careerBrSet() === "t3", careerBrSet());',
'      check("every island it names has art",',
'            ["m2","t1","t2","t3"].every(function(k){ return !!MAP_ART[k]; }));',
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tools/check-career-trio.js`
Expected: FAIL — `careerBrSet is not defined`.

- [ ] **Step 3: Add the accessor**

Immediately after `careerMigrateSize()`:

```javascript
/* Which island a career night is played on.

   His ask, 19 August: in a trio year the map should change too. It can, because
   the trio year's islands are already here — t1, t2 and t3 are Chapter 6's three
   seasons, each with the drop grid and the counted loot read off that Major's own
   map, and the 2025 card sets have been playing them since they were built.

   Split on the year's own arc rather than on a date pulled out of the air: the
   island changes when the Major does, so a season opens on the first island, moves
   to the second once Major 1 is over and to the third for the run to Antwerp. Which
   is what a real year does — a new season, a new map.

   Reload is not in this. It has its own islands in every year and the three
   runners that play it name them a line after the default. */
const CC_TRIO_ISLANDS=[{from:'2026-05-01', set:'t2'}, {from:'2026-07-01', set:'t3'}];
function careerBrSet(){
  if(careerSquadSize()!==3) return 'm2';
  const day=careerToday();
  let set='t1';
  CC_TRIO_ISLANDS.forEach(r=>{ if(day>=r.from) set=r.set; });
  return set;
}
```

- [ ] **Step 4: Point the career's default at it**

In `careerPlay()`, replace `useLandingSet('m2');` with `useLandingSet(careerBrSet());`.
Leave the three Reload runners alone — they overwrite the default a line later,
which is the behaviour the comment above `useLandingSet('m2')` already describes.

- [ ] **Step 5: Run the test and the regression set**

Run: `node tools/check-career-trio.js`
Expected: PASS.

Run the regression set plus `node tools/check-career-map.js` and
`node tools/check-career-landing.js`.
Expected: all exit 0 — a duo season still resolves to `m2`, which is the string
that was hard-coded there.

---

---

## As built — where the work departed from this plan

All seven tasks are implemented. Five things came out differently, and the code
is the record; this section exists so the plan does not contradict it.

**Task 4 became one conversion rule, not four constants.** The plan named
`ccCupField`, `ccCupCut`, `ccMajorFinalField` and `ccGlobField` as separate trio
numbers. Reading the code showed the divisional cup was already per-division —
`CC_CUP_ENTRANTS` and `CC_CUP_QUOTA`, with the constants only as a fallback — so
four hand-written numbers would have converted the fallback and missed every real
cup. What went in instead is `ccTeams(duoCount)`: the same room counted in this
season's teams, `×2/3` rounded. The four accessors still exist and are all one
line over it. `ccScaleStage(st)` does the same for `CC_MAJOR_STAGE` and
`CC_GCLC_ROUND`, which are built once at load and so are scaled on read.

**Task 3 needed the seat-DM ceiling too.** Looping per empty chair was not
enough: `careerSeatDm` refuses once `careerSeatDmOpen()` reaches `CC_SEAT_DMS`,
a per-career ceiling, so a trio short of two people heard exactly as much as a
duo short of one and the second chair could sit empty behind a full inbox about
the first. The ceiling is now per empty chair.

**The migrations went into `careerLoad`, not the entry point.** The plan put
`careerMigrateSize` and `careerMigratePartners` beside the other three at
`careerEntry`. `careerLoad` already carries `careerNotesMigrate` with a comment
saying why — a save opened from the slot picker never passes the entry point —
and these are the same kind of thing. A career switched to from the picker would
otherwise have arrived at the hub with an empty seat and a person sat in it.

**`careerMateAdd` became `careerMateSeat`.** The plan had accepting an offer
append to the list. `check-career-chem` states the rule that was already there:
accepting a better card while seated *replaces* the person, and costs you the
season you had together. Appending silently did nothing once the squad was full.
It now takes an empty chair if there is one and the weakest mate's chair if there
is not.

**Task 7 was added mid-build**, on his ask, and is written up in full above.

Three real defects surfaced during the work, all caught by existing harnesses and
all fixed: a mate stored as a card rather than a handle could never be dropped;
the partner-upgrade path above; and `ccNewsGcSeat`, added earlier the same day for
the Last Chance seat, had no author in the feed's map.

Thirteen harnesses build a `CAREER` by hand and were moved to the list shape —
`chem`, `cup`, `day-value`, `dayevents`, `duo`, `ewc-seat`, `feed`, `interview`,
`locked-day`, `matedev`, `move`, `seat`, `talk`. They bypass `careerLoad`, so no
migration reaches them.

---

## Self-review

**Spec coverage.** Squad size as a season property — Task 1. Two seats, `careerMates`, migration — Task 2. Chemistry on the newest member, inbox per seat, poach one person, seat lock, `careerMateFactor` on the strongest — Task 3. Fields — Task 4. Prizes, and the named Reload/Summit invention — Task 5. Hub and squad panel — Task 6. What carries across the boundary needs no work: `careerNewSeason` already clears what a year owns and keeps what a career owns, and Task 1 adds `cr.size` to what it writes.

**Type consistency.** `careerMateSeats()`, `careerMateRecords()`, `careerMates()`, `careerMateDrop(handle)`, `ccMateCardOf(record)`, `ccMateLift(card, dev)`, `careerSquadSize()`, `ccCupField()`, `ccCupCut()`, `ccMajorFinalField()`, `ccGlobField()` — each defined once, in the task named in its Interfaces block, and spelled the same everywhere after.

**Known risk.** Task 2 step 6 is the one open-ended step in the plan: it asks the implementer to find every write to `CAREER.partner` rather than listing them, because the count moves as the earlier steps land. The grep in that step is the check, and the task does not pass until `CAREER.partner` appears only inside the migration.
