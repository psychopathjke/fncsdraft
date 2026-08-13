# Realistic Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second way to play any Major — pick one of its real duos/trios from a card list and play the tournament with every team in its real roster — alongside the existing draft mode, which must not change.

**Architecture:** One global flag `REALISTIC`, set by two buttons on the mode preview screen. When it is on, the draft screen's player pack becomes a list of real teams and picking one fills `drafted` with that whole roster; the loot rounds and everything downstream (`teamLabel`, `buildTeam`, scoring, replay) read `drafted` and are untouched. The tournament field is built from real rosters instead of assembled ones.

**Tech Stack:** Plain browser JavaScript in a single `index.html`. No build step, no framework, no modules. Tests are headless-Chrome probes under `tools/`, run with `node`.

## Global Constraints

- **Draft mode must be unchanged in behaviour.** Every new branch is gated on `REALISTIC`; the existing path keeps its exact code.
- Spec: `docs/superpowers/specs/2026-08-12-realistic-simulation-design.md`.
- Every `data-i18n` key must exist in **both** the `ru` and `en` dictionaries — `tools/check-i18n.js` fails otherwise. RU dictionary starts at `index.html:1821`, EN at `index.html:2289`.
- **Rosters are read set-agnostically.** 2026 sets store one property per stage (`card._m2Playin`, `card._n2Gf`, …, fourteen region-sets); 2025 sets store `card._t1 = {entry, sorts}` with `card._t1Stage` in `'P'|'L'|'G'`. Never hardcode a set prefix.
- A team is only offered if **every** member is in the mode pool. Teams dropped for an incomplete roster are counted and shown, never silently replaced.
- No new tournament data. Everything comes from the card sets already in the file.
- **Stage every commit with `git -c core.autocrlf=false add …`.** `core.autocrlf` is `true` in this repo but the committed blobs disagree: `index.html` is stored CRLF while `tools/*.js` are stored LF. Staging the normal way rewrites every line of the file — measured on this branch, a 434-line change is reported as 35,525 insertions and 35,168 deletions, an eighty-fold inflation that also buries every review diff. After staging, run `git diff --cached --stat`: four figures means the endings are wrong, not the change.
- Verification commands, all run from the repo root:
  - `node tools/check-index.js` — the single script block still parses
  - `node tools/check-i18n.js` — no missing keys in either language
  - `node tools/check-page-errors.js` — no console errors at load
  - `node tools/check-realistic.js` — this feature's own probe (built in Task 2)

---

### Task 1: The mode choice on the preview screen

**Files:**
- Modify: `index.html` — CSS near `.rf-btn` (`index.html:621-623`); markup at the top of `#screen-preregion` (`index.html:1420-1426`); `REALISTIC` declaration beside `pendingCardSet` (`index.html:27176`); `chooseMode()` (`index.html:27184-27192`); `confirmRegionsAndStart()` (`index.html:27383-27403`); both dictionaries (`index.html:1821`, `index.html:2289`)
- Test: `node tools/check-i18n.js`, `node tools/check-page-errors.js`

**Interfaces:**
- Consumes: nothing.
- Produces: global `let REALISTIC` (boolean, default `false`); `function setSimMode(realistic)` which sets it and repaints the two buttons. Tasks 2–4 read `REALISTIC`.

- [ ] **Step 1: Add the two i18n keys to both dictionaries**

In the RU dictionary (`index.html:1821`, the object beginning `yourSquadTitle:'Твой состав'`), add to the same object:

```js
simRealisticTitle:'Реалистичная симуляция', simRealisticNote:'Выбираешь настоящее дуо мажора. Составы не меняются — все играют теми, с кем играли на самом деле.',
simDraftTitle:'Драфт-симуляция', simDraftNote:'Собираешь свой состав из карточек игроков. Соперники собираются так же.',
simModeTitle:'Режим симуляции',
```

In the EN dictionary (`index.html:2289`, the object beginning `yourSquadTitle:'Your squad'`), add:

```js
simRealisticTitle:'Realistic simulation', simRealisticNote:'Pick one of the Major\'s real duos. Rosters are fixed — everybody plays with the people they actually played with.',
simDraftTitle:'Draft simulation', simDraftNote:'Build your own squad out of player cards. The rivals are built the same way.',
simModeTitle:'Simulation mode',
```

- [ ] **Step 2: Add the button styling**

Immediately after `.rf-btn.active` (`index.html:623`), add:

```css
  .sim-modes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;}
  @media(max-width:640px){.sim-modes{grid-template-columns:1fr;}}
  .sim-btn{text-align:left;background:var(--panel2);border:1px solid var(--line);color:var(--ink-dim);
    border-radius:10px;padding:13px 15px;cursor:pointer;transition:border-color .15s ease, background .15s ease;}
  .sim-btn h5{margin:0 0 4px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;color:var(--ink);}
  .sim-btn p{margin:0;font-size:11.5px;line-height:1.35;}
  .sim-btn.active{background:var(--accent);border-color:var(--accent);}
  .sim-btn.active h5,.sim-btn.active p{color:var(--accent-ink);}
```

- [ ] **Step 3: Add the markup at the top of the preview screen**

In `#screen-preregion`, immediately after the closing `</div>` of the first `.rating-explainer` block (`index.html:1424`) and **before** `<div class="region-filter" id="preRegionChecks"...>`, insert:

```html
    <div class="rating-explainer" style="margin-top:14px;">
      <h4 data-i18n="simModeTitle"></h4>
    </div>
    <div class="sim-modes">
      <button class="sim-btn" id="simRealisticBtn" onclick="setSimMode(true)">
        <h5 data-i18n="simRealisticTitle"></h5>
        <p data-i18n="simRealisticNote"></p>
      </button>
      <button class="sim-btn active" id="simDraftBtn" onclick="setSimMode(false)">
        <h5 data-i18n="simDraftTitle"></h5>
        <p data-i18n="simDraftNote"></p>
      </button>
    </div>
```

- [ ] **Step 4: Add the flag and its setter**

Beside `let pendingCardSet='m2';` (`index.html:27176`) add:

```js
// Which of the two simulations the next run is. Draft is the default because
// it is what every existing tile did before this existed.
let REALISTIC=false;
function setSimMode(realistic){
  REALISTIC=!!realistic;
  const r=document.getElementById('simRealisticBtn'), d=document.getElementById('simDraftBtn');
  if(r) r.classList.toggle('active', REALISTIC);
  if(d) d.classList.toggle('active', !REALISTIC);
}
```

- [ ] **Step 5: Reset the choice whenever a mode is opened**

In `chooseMode()` (`index.html:27184`), add `setSimMode(false);` as the last line before `show('screen-preregion');`, so returning to a tile never inherits the previous run's mode.

- [ ] **Step 6: Verify**

Run: `node tools/check-i18n.js`
Expected: `ru: 0 missing` and `en: 0 missing`.

Run: `node tools/check-page-errors.js`
Expected: `no errors at load`.

Run: `node tools/check-index.js`
Expected: `1/1 script blocks parse`.

- [ ] **Step 7: Commit**

```bash
git -c core.autocrlf=false add index.html
git commit -m "feat: choose realistic or draft simulation before a Major"
```

---

### Task 2: The real-team list, and the probe that checks it

**Files:**
- Modify: `index.html` — new functions beside `fillFieldTeams` (`index.html:30284`)
- Create: `tools/check-realistic.js`
- Test: `node tools/check-realistic.js`

**Interfaces:**
- Consumes: `REALISTIC` from Task 1; the module-level `pool` array of player cards.
- Produces:
  - `function rosterEntriesOf(card)` → `[{stage:'Playin'|'Lcq'|'Gf', entry:Object}]`
  - `function realTeamsFor(players)` → `{teams:[Team], dropped:Number}` where
    `Team = {handles:[String], cards:[Card], stage:String, rank:Number, pts:Number, wins:Number, matches:Number, avg:Number}`,
    sorted by `avg` descending. Tasks 3 and 4 consume `realTeamsFor`.

- [ ] **Step 1: Write the failing probe**

Create `tools/check-realistic.js`:

```js
// The real-team list that the realistic simulation is built on: it has to be
// every real roster in the Major's data, each one once, ordered by the rating
// of its cards, with nobody in it whose teammate is missing from the pool.
//
//   node tools/check-realistic.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__real" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    // Major 2, Europe, duos — the set the numbers in the spec were measured on.
    pendingSize = 2; pendingMajor = false; pendingCards = true;
    pendingCardSet = 'm2'; pendingMapSet = 'm2';
    preSelectedRegions = ['EU']; preSelectedYears = [];
    REALISTIC = true;
    startDraft(2, false);

    var built = realTeamsFor(pool);
    var teams = built.teams;
    out.dropped = built.dropped;
    out.count = teams.length;
    out.top = teams.slice(0, 3).map(function(t){
      return {who: t.handles.join(' & '), avg: Math.round(t.avg), stage: t.stage, rank: t.rank};
    });
    // Ordered, high to low.
    out.ordered = teams.every(function(t, i){ return i === 0 || teams[i-1].avg >= t.avg; });
    // Every roster once.
    var seen = {}, dupes = 0;
    teams.forEach(function(t){
      var k = t.handles.slice().sort().join('|');
      if (seen[k]) dupes++; else seen[k] = 1;
    });
    out.dupes = dupes;
    // Every listed team is complete and its members really are in the pool.
    var inPool = {};
    pool.forEach(function(p){ inPool[p.handle] = 1; });
    out.incomplete = teams.filter(function(t){
      return t.cards.length !== t.handles.length || t.handles.some(function(h){ return !inPool[h]; });
    }).length;
    // Every team is the right size for the mode.
    out.wrongSize = teams.filter(function(t){ return t.handles.length !== 2; }).length;
    // The drop rule, exercised rather than hoped for: hold one player of the
    // top team back and that team must vanish from the list.
    var stranded = teams[0].handles[0];
    var thinner = pool.filter(function(p){ return p.handle !== stranded; });
    var reduced = realTeamsFor(thinner);
    out.dropOnePool = {
      count: reduced.teams.length,
      dropped: reduced.dropped,
      strandedListed: reduced.teams.some(function(t){
        return t.handles.indexOf(stranded) >= 0;
      })
    };
  } catch (e) { out = {error: String(e && e.stack || e)}; }
  document.getElementById('__real').textContent =
    'BEGINREAL' + encodeURIComponent(JSON.stringify(out)) + 'ENDREAL';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsreal-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINREAL([\s\S]*?)ENDREAL/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

console.log('\nMajor 2 . Europe, duos');
console.log('  teams offered      ' + out.count);
console.log('  dropped, roster incomplete ' + out.dropped);
out.top.forEach(t => console.log('  ' + String(t.avg).padStart(3) + '  ' + t.who +
  '  [' + t.stage + ' #' + t.rank + ']'));

const fails = [];
// Measured twice, headless, on this branch: 179 real duos behind Major 2
// Europe's 250 rows, and with no era filter every one of them is whole. A
// number that moves means the card data moved or the builder is dropping teams
// it should not. (An earlier draft of the plan said 178 and 1 dropped; that came
// from a browser session whose pool was one player short and does not reproduce.)
if (out.count !== 179) fails.push('offered ' + out.count + ' teams, expected 179');
if (out.dropped !== 0) fails.push('dropped ' + out.dropped + ' teams, expected 0');
// The drop rule matters more than the count, and the full pool never exercises
// it. So it is exercised on purpose: take one player out and his team must
// leave the list rather than be completed from somewhere else.
if (out.dropOnePool.count !== 178)
  fails.push('with one player held back the list has ' + out.dropOnePool.count + ' teams, expected 178');
if (out.dropOnePool.dropped !== 1)
  fails.push('with one player held back ' + out.dropOnePool.dropped + ' teams were dropped, expected 1');
if (out.dropOnePool.strandedListed)
  fails.push('the team missing a player was listed anyway');
if (!out.ordered) fails.push('the list is not ordered by rating, high to low');
if (out.dupes) fails.push(out.dupes + ' rosters appear more than once');
if (out.incomplete) fails.push(out.incomplete + ' listed teams have a member missing from the pool');
if (out.wrongSize) fails.push(out.wrongSize + ' teams are not duos in a duo Major');
if (out.top[0] && out.top[0].who !== 'Sky & Scroll')
  fails.push('the top of the list is ' + out.top[0].who + ', not the team that won');

if (fails.length) { fails.forEach(f => console.error('  FAIL ' + f)); process.exit(1); }
console.log('\n  every real roster, once each, best first\n');
```

- [ ] **Step 2: Run it to see it fail**

Run: `node tools/check-realistic.js`
Expected: exit 2 with `realTeamsFor is not defined` inside the reported error.

- [ ] **Step 3: Write the builder**

Immediately above `function fillFieldTeams(` (`index.html:30284`), add:

```js
// --- the real rosters behind the cards
//
// Every card set is built from rows that were real teams, and the card keeps a
// reference back to the row it came from. Two shapes, because the two eras were
// built years apart: the 2026 sets hang one property per stage off the card
// (_m2Playin, _n2Gf, and so on for all fourteen region-sets), while the 2025
// trio sets hang a single _t1/_t2/_t3 holding the stage the card is currently
// rated on, with _t1Stage saying which. Read by shape rather than by name, so a
// new set needs no change here.
function rosterEntriesOf(card){
  const out=[];
  const STAGE_OF={P:'Playin', L:'Lcq', G:'Gf'};
  for(const k in card){
    if(k.charAt(0)!=='_') continue;
    const modern=/^_([a-z]\d)(Playin|Lcq|Gf)$/.exec(k);
    if(modern){
      if(card[k] && card[k].duo) out.push({stage:modern[2], entry:card[k]});
      continue;
    }
    if(/^_t[123]$/.test(k) && card[k] && card[k].entry && card[k].entry.duo)
      out.push({stage:STAGE_OF[card[k+'Stage']] || 'Playin', entry:card[k].entry});
  }
  return out;
}

// Which showing of a team the list should print. A third of the field played
// more than one stage, and a team is one team however many times it appeared.
const REAL_STAGE_RANK={Gf:3, Lcq:2, Playin:1};

// Every real roster in the pool, once each, strongest cards first.
//
// `dropped` is teams whose roster is not wholly in the pool — a region filter
// or an era filter can leave one player behind. They are counted rather than
// completed from elsewhere: a lobby of real teams with one invented member is
// the one thing a mode called realistic must not quietly serve.
function realTeamsFor(players){
  const byHandle={};
  players.forEach(p=>{ byHandle[p.handle]=p; });
  const best=new Map();
  players.forEach(p=>{
    rosterEntriesOf(p).forEach(({stage, entry})=>{
      const key=entry.duo.slice().sort().join('|');
      const prev=best.get(key);
      if(prev && REAL_STAGE_RANK[stage] <= REAL_STAGE_RANK[prev.stage]) return;
      best.set(key, {handles:entry.duo.slice(), stage,
                     rank:entry.rank, pts:entry.pts, wins:entry.wins, matches:entry.matches});
    });
  });
  const teams=[];
  let dropped=0;
  best.forEach(t=>{
    const cards=t.handles.map(h=>byHandle[h]).filter(Boolean);
    if(cards.length!==t.handles.length){ dropped++; return; }
    const avg=cards.reduce((s,c)=>s+c.rating, 0)/cards.length;
    teams.push({...t, cards, avg});
  });
  teams.sort((a,b)=>b.avg-a.avg || a.rank-b.rank);
  return {teams, dropped};
}
```

- [ ] **Step 4: Run the probe to verify it passes**

Run: `node tools/check-realistic.js`
Expected: `teams offered 179`, `dropped, roster incomplete 0`, top line `96  Sky & Scroll  [Gf #1]`, then `every real roster, once each, best first`.

- [ ] **Step 5: Verify nothing else moved**

Run: `node tools/check-index.js && node tools/check-page-errors.js`
Expected: `1/1 script blocks parse` and `no errors at load`.

- [ ] **Step 6: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-realistic.js
git commit -m "feat: build the list of a Major's real rosters from its cards"
```

---

### Task 3: The team picker in place of the player pack

**Files:**
- Modify: `index.html` — markup inside `#screen-draft` (`index.html:1456-1463`); `startDraft()` (`index.html:27406-27441`); `nextRound()` (`index.html:27564-27577`); new functions beside `renderCandidates` (`index.html:28058`)
- Test: `node tools/check-realistic.js` (extended), `node tools/check-i18n.js`

**Interfaces:**
- Consumes: `realTeamsFor(players)` from Task 2; `REALISTIC` from Task 1.
- Produces: `function renderTeamPicker()` which draws the list into `#candidates`; `function pickTeam(team)` which fills `drafted` and advances the round. Task 4 relies on `drafted` holding a real roster.

- [ ] **Step 1: Add the picker's i18n keys**

Add to the RU dictionary (`index.html:1821` object):

```js
teamPickTitle:'Выбор состава', teamPickDesc:'Выбери настоящую команду мажора. Состав менять нельзя.',
teamPickSearch:'Поиск по нику', teamPickCount:(n)=>n+' команд',
teamPickDropped:(n)=>n===0?'':'Не показаны: '+n+' — кто-то из состава вне выбранного фильтра',
teamPickBtn:'Взять',
```

Add to the EN dictionary (`index.html:2289` object):

```js
teamPickTitle:'Pick a squad', teamPickDesc:'Pick one of the Major\'s real teams. The roster is fixed.',
teamPickSearch:'Search by handle', teamPickCount:(n)=>n+' teams',
teamPickDropped:(n)=>n===0?'':'Not listed: '+n+' — a member is outside the chosen filter',
teamPickBtn:'Take',
```

- [ ] **Step 2: Add the picker's own head and search box to the markup**

In `#screen-draft`, immediately before `<div class="candidates" id="candidates"></div>` (`index.html:1463`), insert:

```html
          <div id="teamPickBar" style="display:none;margin-bottom:10px;">
            <input id="teamPickSearch" type="search" style="width:100%;background:var(--panel2);
              border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:9px 12px;font-size:13px;">
            <div id="teamPickMeta" style="margin-top:6px;font-size:11.5px;color:var(--ink-dim);"></div>
          </div>
```

- [ ] **Step 3: Write the picker**

Immediately above `function renderCandidates(list){` (`index.html:28058`), add:

```js
// The Major's real teams, as cards, best first. This takes the place of the
// player pack when the run is a realistic one: the pack asks which player you
// want, and here that is not a question — a real team is a whole roster or it
// is not that team.
let teamPickList=[];

function renderTeamPicker(){
  const el=document.getElementById('candidates');
  const bar=document.getElementById('teamPickBar');
  const box=document.getElementById('teamPickSearch');
  const built=realTeamsFor(pool);
  teamPickList=built.teams;
  bar.style.display='block';
  box.placeholder=L().teamPickSearch;
  document.getElementById('teamPickMeta').textContent =
    L().teamPickCount(built.teams.length) +
    (built.dropped ? ' · ' + L().teamPickDropped(built.dropped) : '');
  box.oninput=()=>paintTeamPicker(box.value);
  paintTeamPicker('');
}

function paintTeamPicker(query){
  const el=document.getElementById('candidates');
  const q=String(query||'').trim().toLowerCase();
  const shown=q ? teamPickList.filter(t=>t.handles.some(h=>h.toLowerCase().includes(q)))
                : teamPickList;
  el.innerHTML='';
  el.style.display='block';
  shown.forEach(t=>{
    const row=document.createElement('div');
    row.className='team-row';
    row.innerHTML=
      '<div class="team-row-head"><b>' + Math.round(t.avg) + '</b> ' +
        esc(t.handles.join(' & ')) +
        ' <span class="team-row-stage">' + t.stage + ' #' + t.rank + ' · ' + t.pts + ' pts</span></div>' +
      '<div class="team-row-cards">' + t.cards.map(c=>futCardHTML(c)).join('') + '</div>' +
      '<button class="pick-btn" style="width:100%;">' + L().teamPickBtn + '</button>';
    row.querySelector('.pick-btn').onclick=()=>pickTeam(t);
    el.appendChild(row);
  });
}

// Taking a team is the whole draft in one act: the roster goes into `drafted`
// entire, which is what every later stage of the app reads. Nothing downstream
// learns that this run was realistic.
function pickTeam(team){
  if(roundPlayerPicked) return;
  drafted=team.cards.slice();
  team.cards.forEach(c=>{ pool=pool.filter(x=>x.handle!==c.handle); });
  roundPlayerPicked=true;
  document.getElementById('teamPickBar').style.display='none';
  document.getElementById('candidates').style.display='';
  renderSlots();
  renderPicked('candidates', team.cards.map(c=>pickedPlayerCard(c)));
  maybeAdvanceRound();
}
```

- [ ] **Step 4: Add the row styling**

Immediately after the `.sim-btn.active h5,.sim-btn.active p` rule added in Task 1, add:

```css
  .team-row{background:var(--panel2);border:1px solid var(--line);border-radius:10px;
    padding:12px;margin-bottom:10px;}
  .team-row-head{font-size:13px;font-weight:800;color:var(--ink);margin-bottom:8px;}
  .team-row-head b{color:var(--accent);font-size:16px;margin-right:6px;}
  .team-row-stage{float:right;font-size:11px;font-weight:700;color:var(--ink-dim);}
  .team-row-cards{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
```

- [ ] **Step 5: Keep the loot rounds, and end the draft on rounds rather than on roster size**

This is the step to get right. `maybeAdvanceRound()` (`index.html:27578`) and
`draftIsComplete()` (`index.html:26043`) both end the draft when
`drafted.length>=squadSize`. In a realistic run `drafted` is full after the
first pick, so the draft would end after **one** loot round.

That is not cosmetic. AI teams roll their loadout as `randomLoadoutBonus(n)` —
one weapon and one consumable **per player** — while the player's
`loadoutBonus()` sums whatever they actually picked and scales both by the same
`2/n`. One round instead of two would leave a realistic duo with half the
lobby's loadout, and a trio with a third, every run.

So the end of the draft becomes the count of rounds, which is the same number
in both modes. Replace `draftIsComplete()` (`index.html:26043-26045`) with:

```js
// Draft over: every pack area turns into the full run of picks it produced, one
// card per round. A round rolls a player, a weapon and a consumable together,
// so all three areas end up the same length and read as one finished loadout.
//
// Counted in rounds, not in players. A realistic run takes its whole roster in
// the first round, and if the draft ended when the roster was full it would end
// after one loot round — leaving the player with one weapon and one consumable
// against a lobby whose teams roll a pair each, which is half the loadout in
// duos and a third of it in trios.
function draftedEnough(){
  return REALISTIC ? round>=squadSize : drafted.length>=squadSize;
}
function draftIsComplete(){
  return roundPlayerPicked && roundWeaponPicked && roundHealPicked && draftedEnough();
}
```

and in `maybeAdvanceRound()` (`index.html:27578`) replace `if(drafted.length>=squadSize){` with `if(draftedEnough()){`.

- [ ] **Step 6: Route the round to the picker**

In `nextRound()` (`index.html:27564`), replace these two lines:

```js
  currentCandidates=generatePack();
  renderCandidates(currentCandidates);
```

with:

```js
  if(REALISTIC){
    // The roster is taken once, in the first round; the rounds after it are
    // loot only, so the player half of them is already settled and the squad
    // that was taken stays on screen instead of the picker coming back.
    if(drafted.length){
      roundPlayerPicked=true;
      document.getElementById('teamPickBar').style.display='none';
      renderPicked('candidates', drafted.map(p=>pickedPlayerCard(p)));
    } else {
      renderTeamPicker();
    }
  } else {
    currentCandidates=generatePack();
    renderCandidates(currentCandidates);
  }
```

Also delete the line `if(squadSize-drafted.length<=0) return;` at the top of
`nextRound()` (`index.html:27567`) and put `if(round>squadSize) return;` in its
place — the old guard was the same roster-size assumption and would stop the
second loot round dead.

- [ ] **Step 7: Make the round total honest and hide the reroll**

First give the pack's heading and its line of description stable ids, because
what follows has to find them again on every run. In the markup at
`index.html:1457-1458`, inside the first `.pack-head`, change

```html
              <h2 data-i18n="packOpenTitle"></h2>
              <p data-i18n="packOpenDesc"></p>
```

to

```html
              <h2 id="packHeadTitle" data-i18n="packOpenTitle"></h2>
              <p id="packHeadDesc" data-i18n="packOpenDesc"></p>
```

Then in `startDraft()` (`index.html:27406`), immediately after
`document.getElementById('roundTotal').textContent=size;`, add:

```js
  // A realistic run has one roster and `size` loot rounds; the pack label counts
  // rounds, and the reroll is a player-pack control with nothing to reroll here.
  const rb=document.getElementById('rerollBtn');
  if(rb) rb.style.display = REALISTIC ? 'none' : '';
  // Found by id, never by the data-i18n value this then overwrites. Looking the
  // heading up by `h2[data-i18n="packOpenTitle"]` works exactly once: the first
  // realistic run renames the attribute, the selector stops matching, and every
  // later run — draft runs included — silently keeps whichever caption it was
  // last left with. A draft pack captioned "pick your real team" is draft mode
  // changing behaviour, which is the one thing this feature may not do.
  const packHead=document.getElementById('packHeadTitle');
  const packDesc=document.getElementById('packHeadDesc');
  if(packHead && packDesc){
    packHead.setAttribute('data-i18n', REALISTIC ? 'teamPickTitle' : 'packOpenTitle');
    packDesc.setAttribute('data-i18n', REALISTIC ? 'teamPickDesc' : 'packOpenDesc');
    applyStaticI18n();
  }
```

- [ ] **Step 8: Extend the probe to cover picking**

In `tools/check-realistic.js`, immediately before the closing `} catch (e)` of the bootstrap, add:

```js
    // Taking a team fills the squad with that whole roster and nothing else.
    renderTeamPicker();
    var target = teamPickList[0];
    pickTeam(target);
    out.draftedHandles = drafted.map(function(p){ return p.handle; });
    out.targetHandles = target.handles.slice();
    out.poolStillHasThem = target.handles.filter(function(h){
      return pool.some(function(p){ return p.handle === h; });
    }).length;
```

and add these checks beside the others at the bottom of the file:

```js
if (out.draftedHandles.join('|') !== out.targetHandles.join('|'))
  fails.push('taking ' + out.targetHandles.join(' & ') + ' drafted ' + out.draftedHandles.join(' & '));
if (out.poolStillHasThem)
  fails.push(out.poolStillHasThem + ' of the taken players are still in the pool for somebody else');
```

- [ ] **Step 9: Run the probe**

Run: `node tools/check-realistic.js`
Expected: passes, printing the same 178 / dropped 1 / `Sky & Scroll` lines.

- [ ] **Step 10: Verify the rest**

Run: `node tools/check-i18n.js && node tools/check-index.js && node tools/check-page-errors.js`
Expected: `0 missing` in both languages, `1/1 script blocks parse`, `no errors at load`.

- [ ] **Step 11: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-realistic.js
git commit -m "feat: pick a real squad from a card list instead of a player pack"
```

---

### Task 4: A field of real rosters

**Files:**
- Modify: `index.html` — new function beside `fillFieldTeams` (`index.html:30284-30304`); its five call sites at `index.html:31321`, `index.html:31754`, `index.html:31832`, `index.html:32217` and any further match of `fillFieldTeams(`
- Test: `node tools/check-realistic.js` (extended)

**Interfaces:**
- Consumes: `realTeamsFor(players)` from Task 2; `drafted` filled by Task 3.
- Produces: `function fillRealFieldTeams(remaining, needed, size, out)` with the same signature and return value as `fillFieldTeams` — returns the leftover player array — so the call sites change by one word.

- [ ] **Step 1: Write the failing check**

In the bootstrap of `tools/check-realistic.js`, after the picking block added in Task 3, add:

```js
    // The field the tournament plays: real rosters, the player's team not
    // among them twice, and the lobby the right size.
    var you = buildTeam(drafted); you.isYou = true;
    var field = [you];
    var leftover = fillRealFieldTeams(pool, 49, 2, field);
    out.fieldSize = field.length;
    out.fieldNames = field.map(function(t){ return t.name; });
    var realKeys = {};
    realTeamsFor(PLAYERS_BASE.filter(function(p){ return p.cardSet === 'm2' && p.region === 'EU'; }))
      .teams.forEach(function(t){ realKeys[t.handles.slice().sort().join('|')] = 1; });
    out.assembled = field.slice(1).filter(function(t){
      return !realKeys[t.squad.map(function(p){ return p.handle; }).sort().join('|')];
    }).length;
    out.mineDuplicated = field.slice(1).filter(function(t){
      return t.squad.some(function(p){ return drafted.some(function(d){ return d.handle === p.handle; }); });
    }).length;
```

and the checks at the bottom:

```js
if (out.fieldSize !== 50) fails.push('the lobby has ' + out.fieldSize + ' teams, expected 50');
if (out.mineDuplicated) fails.push('your own players turn up in ' + out.mineDuplicated + ' rival teams');
if (out.assembled) fails.push(out.assembled + ' teams in a realistic lobby are assembled, not real');
if (out.doubleBooked) fails.push(out.doubleBooked + ' players are in two rival teams in the lobby');
if (out.doubleBookedWide)
  fails.push(out.doubleBookedWide + ' players are in two rival teams once the field is deep ' +
    'enough to reach a shared roster — the double-booking guard is not holding');
if (out.wideFieldSize <= 49)
  fails.push('the deep field only reached ' + out.wideFieldSize + ' teams, which is not past the ' +
    'shallow scan, so the double-booking guard went unexercised again');
if (!out.shortLogged) fails.push('a lobby padded with assembled teams said nothing about it');
if (!out.shortField) fails.push('a short real field produced no lobby at all');
```

Two of those need their own setup, because the full pool exercises neither.
Add this to the bootstrap after the field block:

```js
    // No player may be in two rival teams at once. realTeamsFor keys a team by
    // its roster, and eleven players in this data legitimately appear in two
    // different real rosters across stages, so the field builder guards against
    // it.
    function countDoubleBooked(teams){
      var seen = {}, n = 0;
      teams.forEach(function(t){
        t.squad.forEach(function(p){
          if (seen[p.handle]) n++;
          seen[p.handle] = 1;
        });
      });
      return n;
    }
    out.doubleBooked = countDoubleBooked(field.slice(1));

    // And the same guard where it can actually be seen working. At a 49-team
    // lobby it never fires: every colliding pair's two rosters sit more than
    // forty-nine places apart in the rating order — the nearest are ranks 29 and
    // 77 — so the scan meets only one of each and removing the guard changes
    // nothing. Measured at ninety: two collisions without the guard, none with
    // it. Ninety is not a lobby size; it is the depth at which this guard is
    // testable, and a guard that has never been seen to fail is not yet tested.
    var wideField = [];
    fillRealFieldTeams(pool, 90, 2, wideField);
    out.wideFieldSize = wideField.length;
    out.doubleBookedWide = countDoubleBooked(wideField);

    // The shortfall path, which the full pool never reaches: ask for a lobby
    // larger than the supply of whole rosters and the padding must happen AND
    // say so. A realistic lobby quietly filled with invented teams is the one
    // failure this mode cannot be allowed to have.
    var said = [], realLog = console.log;
    console.log = function(){ said.push(Array.prototype.join.call(arguments, ' ')); };
    var thinField = [];
    fillRealFieldTeams(pool.slice(0, 60), 49, 2, thinField);
    console.log = realLog;
    out.shortField = thinField.length;
    out.shortLogged = said.some(function(s){ return s.indexOf('[realistic]') >= 0; });
```

- [ ] **Step 2: Run it to see it fail**

Run: `node tools/check-realistic.js`
Expected: exit 2 with `fillRealFieldTeams is not defined`.

- [ ] **Step 3: Write the field builder**

Immediately after `realTeamsFor` (added in Task 2), add:

```js
// The lobby, in real rosters. Same shape as fillFieldTeams so the call sites
// differ by one word: takes the players still available, pushes teams onto
// `out`, returns whoever is left over.
//
// Short fields are filled the old way rather than left small — a half-empty
// lobby scores differently and would quietly change every placement — but the
// number filled is logged, because a realistic lobby padded with invented teams
// is a thing the player is entitled to know about.
function fillRealFieldTeams(remaining, needed, size, out){
  const {teams}=realTeamsFor(remaining);
  const taken=new Set();
  let placed=0;
  for(const t of teams){
    if(placed>=needed) break;
    if(t.handles.length!==size) continue;
    if(t.handles.some(h=>taken.has(h))) continue;
    t.handles.forEach(h=>taken.add(h));
    const team=buildTeam(t.cards);
    team.loadout=randomLoadoutBonus(t.cards.length); team.pow+=team.loadout;
    team.name=teamLabel(t.cards);
    out.push(team);
    placed++;
  }
  let rest=remaining.filter(p=>!taken.has(p.handle));
  if(placed<needed){
    console.log('[realistic] the field was ' + (needed-placed) + ' teams short of ' + needed +
                '; the rest are assembled from players without a whole real roster left');
    rest=fillFieldTeams(rest, needed-placed, size, out);
  }
  return rest;
}
```

- [ ] **Step 4: Route the five call sites**

Run `grep -n "fillFieldTeams(avail" index.html` and, at each of the five results, replace

```js
  fillFieldTeams(avail, N, size, field);
```

with

```js
  (REALISTIC ? fillRealFieldTeams : fillFieldTeams)(avail, N, size, field);
```

keeping each site's own `N` and `size` arguments exactly as they are. The known sites are `index.html:31321` (`49, squadSize`), `index.html:31754` (`50-field.length, 2`), `index.html:31832` (`size-field.length, 2`) and `index.html:32217` (`GC2025_FIELD_SIZE-1-field.length, 3`); confirm the grep finds no others before finishing.

- [ ] **Step 5: Run the probe to verify it passes**

Run: `node tools/check-realistic.js`
Expected: passes, with no `FAIL` lines.

- [ ] **Step 6: Verify the rest**

Run: `node tools/check-index.js && node tools/check-page-errors.js && node tools/check-i18n.js`
Expected: all three clean.

- [ ] **Step 7: Commit**

```bash
git -c core.autocrlf=false add index.html tools/check-realistic.js
git commit -m "feat: fill a realistic lobby with real rosters"
```

---

### Task 5: Prove draft mode did not move

**Files:**
- Create: `tools/check-draft-unchanged.js`
- Test: `node tools/check-draft-unchanged.js`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: nothing the app uses; a standing guard.

- [ ] **Step 1: Write the guard**

Create `tools/check-draft-unchanged.js`:

```js
// The realistic simulation's whole risk is the mode that already worked. This
// starts a draft run with REALISTIC off and checks that the screen is the pack
// it has always been: four player cards to choose from, a working reroll, and a
// lobby of assembled teams.
//
//   node tools/check-draft-unchanged.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__draft" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    pendingSize = 2; pendingMajor = false; pendingCards = true;
    pendingCardSet = 'm2'; pendingMapSet = 'm2';
    preSelectedRegions = ['EU']; preSelectedYears = [];
    REALISTIC = false;
    startDraft(2, false);
    out.packCards = document.querySelectorAll('#candidates .pick-btn').length;
    out.pickerBarShown = document.getElementById('teamPickBar').style.display !== 'none';
    out.rerollShown = document.getElementById('rerollBtn').style.display !== 'none';
    out.drafted = drafted.length;
    // One pick takes one player, not a roster.
    pick(currentCandidates[0]);
    out.afterPick = drafted.length;
  } catch (e) { out = {error: String(e && e.stack || e)}; }
  document.getElementById('__draft').textContent =
    'BEGINDRAFT' + encodeURIComponent(JSON.stringify(out)) + 'ENDDRAFT';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsdraftchk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINDRAFT([\s\S]*?)ENDDRAFT/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

const fails = [];
if (out.packCards !== 4) fails.push('the player pack offered ' + out.packCards + ' cards, not 4');
if (out.pickerBarShown) fails.push('the team picker is on screen in a draft run');
if (!out.rerollShown) fails.push('the reroll button is missing from a draft run');
if (out.drafted !== 0) fails.push('a draft run started with ' + out.drafted + ' players already picked');
if (out.afterPick !== 1) fails.push('one pick drafted ' + out.afterPick + ' players, not 1');

console.log('\n  pack cards ' + out.packCards + ' · reroll ' + (out.rerollShown ? 'on' : 'off') +
            ' · picked ' + out.afterPick + ' of 2');
if (fails.length) { fails.forEach(f => console.error('  FAIL ' + f)); process.exit(1); }
console.log('\n  draft mode is the mode it was\n');
```

- [ ] **Step 2: Run it**

Run: `node tools/check-draft-unchanged.js`
Expected: `pack cards 4 · reroll on · picked 1 of 2`, then `draft mode is the mode it was`.

- [ ] **Step 3: Check that trios work at all**

The spec promises realistic simulation for trios as well as duos, and nothing
so far has run a single trio through it. The 2025 sets store their rosters in a
different shape from the 2026 ones — one `_t1` property of the form
`{entry, sorts}` rather than one property per stage — and `rosterEntriesOf`
reads that branch by shape. That branch has never been executed. If it is
wrong, realistic mode offers an empty list on every 2025 Major and the mode is
broken for a third of the tiles with nothing to say so.

Append this to the bootstrap of `tools/check-realistic.js`, after the field
block and before the closing `} catch (e)`:

```js
    // The other era, whose cards carry their roster in a different shape.
    pendingSize = 3; pendingCardSet = 't1'; pendingMapSet = 't1';
    preSelectedRegions = ['EU'];
    REALISTIC = true;
    startDraft(3, false);
    var trio = realTeamsFor(pool);
    out.trio = {
      count: trio.teams.length,
      dropped: trio.dropped,
      sizes: Array.from(new Set(trio.teams.map(function(t){ return t.handles.length; }))).sort(),
      top: trio.teams.length ? trio.teams[0].handles.join(' & ') : null
    };
```

and these checks beside the others at the bottom of the file:

```js
if (!out.trio.count)
  fails.push('the 2025 trio Major offered no real teams at all — rosterEntriesOf ' +
    'is not reading the shape those cards store');
if (out.trio.sizes.length !== 1 || out.trio.sizes[0] !== 3)
  fails.push('the trio Major produced teams of size ' + out.trio.sizes.join(',') + ', expected 3');
```

and print it in the summary:

```js
console.log('  2025 trio Major     ' + out.trio.count + ' teams, dropped ' + out.trio.dropped +
            (out.trio.top ? ', top ' + out.trio.top : ''));
```

Run: `node tools/check-realistic.js`
Expected: it still passes, and now prints a non-zero trio count with every team of size 3.

If the trio count is zero, that is a real finding about `rosterEntriesOf` — report
it, do not delete the check.

- [ ] **Step 4: A roster the mode cannot field is not a team**

Running the check above finds it: the 2025 sets return 177 real trios, but some
of them are not trios. Twenty-one rows across Majors 1 to 3 and five regions
have fewer than three names captured in the raw data, so `realTeamsFor` builds a
one- or two-player "team" out of them. `fillRealFieldTeams` already refuses
those (`if(t.handles.length!==size) continue;`), so a lobby is safe — but the
picker has no such rule, and would offer a one-man trio and let somebody take it
into a trio Major.

That is the same fact as a member missing from the pool: a roster this mode
cannot field. Give it the same treatment. In `realTeamsFor`, immediately above
the existing `if(cards.length!==t.handles.length){ dropped++; return; }`, add:

```js
    // A roster the mode cannot field is not a team. Twenty-one rows across the
    // 2025 sets carry fewer names than the mode plays — a trio row with one
    // handle on it — and without this the picker offers a one-man trio and lets
    // somebody take it into a trio Major. Counted as incomplete, because that is
    // what it is, so the number held back is the one the screen already prints.
    if(t.handles.length !== squadSize){ dropped++; return; }
```

Then tighten the trio check from Step 3: `out.trio.sizes` must be exactly `[3]`,
and `out.trio.count` must still be large — a size rule that emptied the list
would pass a sizes check and fail the mode:

```js
if (out.trio.count < 100)
  fails.push('the 2025 trio Major offered only ' + out.trio.count + ' teams — the size rule ' +
    'is throwing away rosters it should be keeping');
```

Run: `node tools/check-realistic.js`
Expected: passes, with the trio line reporting size 3 only and a non-zero dropped count.

- [ ] **Step 4: Run everything**

Run:

```bash
node tools/check-index.js && node tools/check-i18n.js && node tools/check-page-errors.js && \
node tools/check-realistic.js && node tools/check-draft-unchanged.js && node tools/zone-sim-test.js
```

Expected: every one clean; `zone-sim-test` reports `77 passed, 0 failed`.

- [ ] **Step 4: Commit**

```bash
git -c core.autocrlf=false add tools/check-draft-unchanged.js tools/check-realistic.js
git commit -m "test: guard that draft mode is unchanged by realistic simulation"
```

---

## Self-review notes

- **Spec coverage.** Mode buttons on the preview screen → Task 1. Card list, rating order, one row per roster, stage and rank shown, incomplete rosters counted, search, region from the existing filter → Tasks 2 and 3. Fixed rosters → Task 3 (`pickTeam` takes `team.cards` whole). Loot unchanged → Task 3 Step 5 leaves `maybeAdvanceRound` alone. Real field, seeded once, shortfall logged → Task 4. Draft mode unchanged → Task 5. Both locales → Tasks 1 and 3.
- **The one number to watch.** Task 2's probe pins the list at 178 teams and 1 dropped. If the card data is edited later this test will fail; that is the point, but the failure message should be read as "the data moved", not "the builder broke".
- **Caught while reviewing this plan, not while running it.** The first draft of Task 3 let the draft end when `drafted` was full, which in a realistic run is after the first round. AI teams roll a weapon and a consumable per player; the player would have rolled one pair total. A realistic duo would have gone into every tournament with half the lobby's loadout and a trio with a third, and nothing on screen would have said so. Task 3 Step 5 exists because of that, and `draftedEnough()` is the fix — the draft now ends on rounds, which is the same count in both modes.
- **Not covered by any task, deliberately:** realistic mode for ALL FNCS and career mode, per the spec's "not in scope".
