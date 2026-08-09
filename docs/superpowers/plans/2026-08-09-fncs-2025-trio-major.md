# FNCS 2025 Major 1 trio card set — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add FNCS 2025 Major 1 to `index.html` as a third card-mode set, played in trios across all seven regions, built from harvested Tracker leaderboards.

**Architecture:** A Node generator turns the two harvested JSON files into literal row arrays that are pasted into `index.html`. One parameterised builder replaces what would otherwise be seven copies of a 340-line function. The duo row parser is generalised to any team size and a per-stage elimination multiplier. Every change to shared code is guarded by a before/after dump of all existing card ratings, which must come out identical.

**Tech Stack:** Plain ES5/ES6 in a single 27,000-line `index.html`, no build step, no framework, no test runner. Node 24 for generators and checks. Headless Chrome for running the page.

## Global Constraints

- **The only application file is `C:\Users\FoxOS_User\Desktop\fncsdraftmajor\index.html`.** Work on branch `fncs-2025-trio-major`. Do not touch `Desktop\career\index.html`.
- **Source data is already harvested and validated.** `Desktop\2025\fncs-2025-major1.json` (Play-In and Grand Finals) and `Desktop\2025\fncs-2025-major1-stages.json` (LCQ, Lobby, groups). Do not re-fetch.
- **The set key is `t1`. The event id is `S33_FNCSMajor1`.** Card `tier` is `'cardmode'`, matching `m1`/`m2`.
- **Elimination points are per stage:** LCQ 1, Play-In 2, Grand Finals 4.
- **Ratings of existing `m1` and `m2` cards must not move by a single point.** Any task that touches shared code re-runs the baseline dump and diffs.
- **`pushCard` caps every non-LAN card at 90** via `tierCapForEvent`. 2025 finals are online regional events, so their top cards land at 90. This is existing, correct behaviour — do not "fix" it.
- **Every commit message explains the reasoning**, matching the existing history. End with:
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- **No `<script>`-injected literal backslashes** when driving the page through browser tooling — they do not survive injection. Use `String.fromCharCode(92)`.

---

### Task 1: Regression harness for existing card ratings

Nothing else in this plan is safe without this. Tasks 3, 5 and 6 all edit code that
every existing card flows through, and the only way to prove nothing moved is to
compare a full dump before and after.

**Files:**
- Create: `tools/dump-card-ratings.js`
- Create: `tools/baseline-card-ratings.json` (generated output, committed)

**Interfaces:**
- Produces: `node tools/dump-card-ratings.js <out.json>` writes
  `{ "<cardSet>|<region>|<handle>|<event>": {rating, rarity, ovr} }` for every
  player with `tier === 'cardmode'`.

- [ ] **Step 1: Write the dump tool**

It copies `index.html` to a temp file, appends a bootstrap that serialises the
cards into a `<pre>`, runs headless Chrome with `--dump-dom`, and reads the block
back out. This is the same pattern already used for screenshots in this project.

```js
// tools/dump-card-ratings.js
// Dumps every card-mode player's rating so a refactor can be proven inert.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(__dirname, 'baseline-card-ratings.json');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME path in tools/dump-card-ratings.js');

const BOOTSTRAP = `
<pre id="__dump" style="display:none"></pre>
<script>
(function(){
  var out = {};
  PLAYERS_BASE.forEach(function(p){
    if (p.tier !== 'cardmode') return;
    var a = attrsFor(p);
    out[(p.cardSet||'?')+'|'+(p.region||'?')+'|'+p.handle+'|'+(p.event||'')] =
      { rating: p.rating, rarity: p.rarity, ovr: a.ovr };
  });
  document.getElementById('__dump').textContent =
    '<<<DUMP' + JSON.stringify(out) + 'DUMP>>>';
})();
<\/script>`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsdump-'));
const tmp = path.join(tmpDir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=20000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/&lt;&lt;&lt;DUMP([\s\S]*?)DUMP&gt;&gt;&gt;|<<<DUMP([\s\S]*?)DUMP>>>/);
if (!m) throw new Error('dump marker not found — the page probably threw before the bootstrap ran');
const json = JSON.parse((m[1] || m[2]).replace(/&quot;/g, '"').replace(/&amp;/g, '&'));

fs.writeFileSync(OUT, JSON.stringify(json, null, 0));
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('cards dumped: ' + Object.keys(json).length + ' -> ' + OUT);
```

- [ ] **Step 2: Run it and confirm it captures the existing sets**

Run: `cd ~/Desktop/fncsdraftmajor && node tools/dump-card-ratings.js tools/baseline-card-ratings.json`

Expected: a card count in the low thousands, and both sets present. Confirm with:

```bash
node -e "const d=require('./tools/baseline-card-ratings.json');const s={};for(const k in d){const t=k.split('|')[0];s[t]=(s[t]||0)+1}console.log(s)"
```

Expected: an object with `m1` and `m2` keys, each in the hundreds or more. If the
count is 0, the bootstrap ran before `PLAYERS_BASE` was populated — raise
`--virtual-time-budget` and re-run.

- [ ] **Step 3: Write the comparison tool**

```js
// tools/diff-card-ratings.js
const fs = require('fs');
const a = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const b = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const only = process.argv[4];            // optional cardSet filter, e.g. m1
const keys = Object.keys(a).filter(k => !only || k.startsWith(only + '|'));
let moved = 0, missing = 0;
for (const k of keys){
  if (!(k in b)){ missing++; if (missing <= 10) console.log('MISSING ' + k); continue; }
  const x = a[k], y = b[k];
  if (x.rating !== y.rating || x.rarity !== y.rarity || x.ovr !== y.ovr){
    moved++;
    if (moved <= 10) console.log('MOVED   ' + k + '  ' + JSON.stringify(x) + ' -> ' + JSON.stringify(y));
  }
}
console.log((only || 'all') + ': ' + keys.length + ' checked, ' + moved + ' moved, ' + missing + ' missing');
process.exit(moved || missing ? 1 : 0);
```

- [ ] **Step 4: Prove the harness is honest**

A harness that always passes is worthless. Temporarily change `NO_GF_PENALTY=10` to
`NO_GF_PENALTY=11` in `index.html`, dump to a scratch file, diff, and confirm it
reports moved cards.

```bash
node tools/dump-card-ratings.js /tmp/probe.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/probe.json
```

Expected: exit code 1 and a list of MOVED lines. Then revert `NO_GF_PENALTY` to 10,
re-dump, and confirm the diff is clean (exit 0).

- [ ] **Step 5: Commit**

```bash
git add tools/dump-card-ratings.js tools/diff-card-ratings.js tools/baseline-card-ratings.json
git commit -m "Add a rating harness before touching shared card code

Three tasks ahead edit the row parser, the attribute dispatch and the
format table, and every existing card flows through all three. Proving
they are inert needs a full before/after of every card-mode rating, not
a spot check.

The harness is verified by breaking it on purpose: nudging the missed-
finals penalty by one point makes it report moved cards, so a clean run
means something.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Generate the 2025 row literals

**Files:**
- Create: `tools/build-2025-rows.js`
- Create: `tools/2025-rows.generated.js` (generated output, committed)

**Interfaces:**
- Consumes: `Desktop\2025\fncs-2025-major1.json`, `Desktop\2025\fncs-2025-major1-stages.json`
- Produces: a text block declaring, for each of `EU NAC NAW BR ASIA ME OCE`:
  `CARD_T1<REG>_PLAYIN_RAW`, `CARD_T1<REG>_LCQ_RAW`, `CARD_T1<REG>_GF_RAW`,
  plus `T1_NAT` (handle → ISO code) and `CC_RU_EXTRA_T1` / `CC_EN_EXTRA_T1`.
  Row shape: `[rank, points, matches, wins, avgElims, avgPlace, elimPoints, ...names]`.

- [ ] **Step 1: Write the generator**

```js
// tools/build-2025-rows.js
// Turns the harvested leaderboards into literal rows for index.html.
// Nothing here is hand-typed: every number comes from Epic's payload.
const fs = require('fs'), path = require('path');

const SRC = process.argv[2] || path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', '2025');
const OUT = process.argv[3] || path.join(__dirname, '2025-rows.generated.js');

const A = JSON.parse(fs.readFileSync(path.join(SRC, 'fncs-2025-major1.json'), 'utf8'));
const B = JSON.parse(fs.readFileSync(path.join(SRC, 'fncs-2025-major1-stages.json'), 'utf8')).stages;
const REG = ['EU','NAC','NAW','BR','ASIA','ME','OCE'];
const STAGES = [['PLAYIN', r => A[r + '_playin']], ['LCQ', r => B[r + '_lcq']], ['GF', r => A[r + '_gf']]];

// Country names for codes index.html does not already carry.
const NEW_CC = {
  aq:['Антарктида','Antarctica'], ax:['Аландские острова','Åland Islands'],
  bg:['Болгария','Bulgaria'],     cd:['ДР Конго','DR Congo'],
  dj:['Джибути','Djibouti'],      je:['Джерси','Jersey'],
  kn:['Сент-Китс и Невис','Saint Kitts and Nevis'], ky:['Каймановы острова','Cayman Islands'],
  lu:['Люксембург','Luxembourg'], me:['Черногория','Montenegro'],
  mu:['Маврикий','Mauritius'],    sb:['Соломоновы Острова','Solomon Islands'],
  sk:['Словакия','Slovakia'],     tg:['Того','Togo'],
  tj:['Таджикистан','Tajikistan'],vi:['Виргинские острова (США)','U.S. Virgin Islands'],
  vu:['Вануату','Vanuatu']
};

const q = s => JSON.stringify(String(s));
const num = n => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));

const lines = [];
const nat = {};
const odd = [];
let total = 0;

for (const reg of REG){
  for (const [tag, get] of STAGES){
    const src = get(reg);
    if (!src) throw new Error('missing leaderboard: ' + reg + ' ' + tag);
    Object.assign(nat, src.nat);
    const rows = src.rows.map(r => {
      const names = r.slice(7);
      if (names.length !== 3) odd.push(reg + ' ' + tag + ' rank ' + r[0] + ': ' + names.join(' + '));
      total++;
      return '[' + [num(r[0]), num(r[1]), num(r[2]), num(r[3]), num(r[4]), num(r[5]), num(r[6])]
        .concat(names.map(q)).join(',') + ']';
    });
    lines.push('const CARD_T1' + reg + '_' + tag + '_RAW=[\n' + rows.join(',\n') + '\n];');
  }
}

const natPairs = Object.keys(nat).sort().map(n => q(n) + ':' + q(nat[n]));
lines.push('const T1_NAT={' + natPairs.join(',') + '};');

const used = new Set(Object.values(nat));
const ruPairs = [], enPairs = [];
for (const code of Object.keys(NEW_CC).sort()){
  if (!used.has(code)) continue;
  ruPairs.push(q(code) + ':' + q(NEW_CC[code][0]));
  enPairs.push(q(code) + ':' + q(NEW_CC[code][1]));
}
lines.push('const CC_RU_EXTRA_T1={' + ruPairs.join(',') + '};');
lines.push('const CC_EN_EXTRA_T1={' + enPairs.join(',') + '};');

fs.writeFileSync(OUT, lines.join('\n') + '\n');

console.log('rows written      : ' + total);
console.log('players with a nat: ' + natPairs.length);
console.log('country names added: ' + ruPairs.length);
console.log('teams not of size 3: ' + odd.length);
odd.forEach(s => console.log('  ' + s));
```

- [ ] **Step 2: Run it and check the invariants**

Run: `cd ~/Desktop/fncsdraftmajor && node tools/build-2025-rows.js`

Expected, exactly:
- `rows written      : 1627` — 700 Play-In (7 × 100), 700 LCQ (7 × 100) and 227
  finals (33, 33, 33, 33, 33, 30, 32)
- `teams not of size 3: 5`, listing the five known entries (ASIA Play-In 78,
  EU Play-In 80, NAC Play-In 50, NAW Play-In 32, NAW GF 15)
- `country names added: 17`

If the row count differs, the source JSON is not the validated harvest — stop and
re-check the files rather than adjusting the expectation.

- [ ] **Step 3: Verify the generated file parses and holds the golden values**

```bash
node -e "
const fs=require('fs');
const src=fs.readFileSync('tools/2025-rows.generated.js','utf8');
const ctx={}; new Function('with(this){'+src+';this.out={gf:CARD_T1EU_GF_RAW,nac:CARD_T1NAC_GF_RAW,nat:T1_NAT}}').call(ctx);
const top3=ctx.out.gf.slice(0,3).map(r=>r.slice(7).join(' + '));
console.log('EU GF top 3 :', JSON.stringify(top3));
console.log('NAC GF top 1:', ctx.out.nac[0].slice(7).join(' + '));
console.log('EU GF teams :', ctx.out.gf.length);
"
```

Expected:
- EU GF top 3 = `vic0 + Veno + Flickzy`, `P1ng + Wox + Malibuca`, `Vanyak3kk + Pixie + MariusCOW`
- NAC GF top 1 = `Ajerss + Acorn + Pollo`
- EU GF teams = 33

These are the same values that already cross-checked against `M1_2025_EU_RANKED`
and against the in-game screenshot, so a mismatch means the generator is wrong.

- [ ] **Step 4: Commit**

```bash
git add tools/build-2025-rows.js tools/2025-rows.generated.js
git commit -m "Generate the 2025 rows instead of typing them

The 2026 sets were transcribed by hand, which is why extending them is
expensive. Every 2025 number comes out of Epic's own payload through a
generator, so a future Major is a URL change rather than a week of
copying.

The generator asserts what it should find rather than reporting what it
did: 1627 rows, five teams the source returns with fewer than three
accounts, seventeen country names to add. A silent change in the source
now fails loudly.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Generalise the row parser to any team size

**Files:**
- Modify: `index.html` — `m1Entry` and the `KILL_MULT` constant near it

**Interfaces:**
- Produces: `rowEntry(r, opts)` where `opts = {killMult, elimPtsAt}`.
  `elimPtsAt` is the index of the measured elimination-points column, or `null`
  for the 2026 rows which do not carry one. Returns the same object shape as
  `m1Entry` did, with `duo` holding two or three names.

- [ ] **Step 1: Replace `m1Entry` with `rowEntry`, keeping `m1Entry` as a wrapper**

Find `function m1Entry(r){` in `index.html`. Replace the function with:

```js
// One parser for every set. 2026 rows carry two names and no elimination-points
// column; 2025 rows carry three names and the column Epic publishes, so the
// endgame share is read rather than inferred. Eliminations are not worth the
// same everywhere — 2026 duos pay 4, and 2025 pays 1 in the Last Chance
// Qualifier, 2 in the Play-In and 4 in the Grand Finals — so the multiplier is
// an argument, not a constant.
function rowEntry(r, opts){
  opts = opts || {};
  const killMult = opts.killMult == null ? KILL_MULT : opts.killMult;
  const at = opts.elimPtsAt == null ? -1 : opts.elimPtsAt;
  const names = r.slice(at >= 0 ? at + 1 : 6).filter(v => typeof v === 'string');
  const matches = Math.max(r[2], 1);
  const tpm = r[1] / matches;
  const elimPts = at >= 0 ? r[at] : r[4] * matches * killMult;
  return {rank:r[0], pts:r[1], matches:r[2], wins:r[3], avgElims:r[4], avgPlace:r[5],
          duo:names,
          wpm:r[3]/matches, tpm,
          survival:-r[5],
          // Share of the score that came from placement rather than kills.
          // Clamped because a low-scoring team can out-earn its own total on
          // eliminations alone, which would read as a negative share.
          endShare: r[1] > 0 ? clamp((r[1] - elimPts) / r[1], 0, 1) : 0};
}
// The 2026 sets call through this, unchanged in behaviour.
function m1Entry(r){ return rowEntry(r); }
```

Leave `const KILL_MULT=4;` and its comment exactly where they are.

- [ ] **Step 2: Prove the 2026 sets did not move**

```bash
cd ~/Desktop/fncsdraftmajor
node tools/dump-card-ratings.js /tmp/after-task3.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task3.json
```

Expected: `all: <N> checked, 0 moved, 0 missing` and exit code 0.

The old `endShare` was `(tpm - avgElims*KILL_MULT)/tpm`; the new one is
`(pts - avgElims*matches*killMult)/pts`. These are algebraically the same
expression with numerator and denominator both multiplied by `matches`, which is
why the diff must be clean. If it is not, the two are not equivalent for some row
— investigate rather than adjusting the tolerance.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Teach the row parser three names and a per-stage kill value

Two names were hardcoded and the elimination multiplier was a file
constant, which is the whole of what made card mode a duo feature. Names
now come off the tail of the row and the multiplier is an argument.

2025 also publishes the elimination points as their own column, so the
endgame share can be read instead of inferred. That matters more than it
sounds: the group stage marks a qualified team with a flat +1000, and
inferring the share for those teams would have handed a fake-high
Endgame to exactly the players the format already rewarded.

The 2026 sets go through a wrapper and their ratings are unchanged, all
of them, which the harness checks rather than assumes.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Insert the 2025 data and the new country names

**Files:**
- Modify: `index.html` — insert generated rows after the `m1` raw data block;
  extend `CC_RU` / `CC_EN`

**Interfaces:**
- Consumes: `tools/2025-rows.generated.js` from Task 2
- Produces: `CARD_T1<REG>_{PLAYIN,LCQ,GF}_RAW`, `T1_NAT`, `CC_RU_EXTRA_T1`,
  `CC_EN_EXTRA_T1` as globals in the page

- [ ] **Step 1: Insert the generated block**

Insert the entire contents of `tools/2025-rows.generated.js` into `index.html`
immediately **before** the line `const CARD_M1_PLAYIN_EVENT=`, preceded by this
header comment:

```js
// ---------- Card set: FNCS 2025 Major 1 (all seven regions, trios) ----------
// Event S33_FNCSMajor1. Generated by tools/build-2025-rows.js from Epic's own
// leaderboard payload — do not hand-edit; regenerate instead.
// [rank, points, matches, wins, avgElims, avgPlace, elimPoints, p1, p2, p3]
```

- [ ] **Step 2: Register the new country names**

Immediately after the inserted block, add:

```js
Object.assign(CC_RU, CC_RU_EXTRA_T1);
Object.assign(CC_EN, CC_EN_EXTRA_T1);
Object.keys(CC_RU).forEach(code=>{ FLAG_CODE[CC_RU[code]]=code; });
```

This mirrors how `CC_RU_EXTRA_M2` and `CC_RU_EXTRA2` are already applied. The
`FLAG_CODE` rebuild is required — the flag lookup is name-keyed, not code-keyed.

- [ ] **Step 3: Confirm the page still loads and nothing moved**

```bash
cd ~/Desktop/fncsdraftmajor
node tools/dump-card-ratings.js /tmp/after-task4.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task4.json
```

Expected: `0 moved, 0 missing`. The data is declared but nothing consumes it yet,
so the card count must also be unchanged. If the dump fails entirely, the inserted
block has a syntax error — check the console with:

```bash
node -e "new Function(require('fs').readFileSync('tools/2025-rows.generated.js','utf8'))" && echo "generated block parses"
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Land the 2025 rows and the countries they need

Data only: 1627 rows across three stages and seven regions, declared and
not yet consumed, so this commit cannot change a single existing card
and the harness confirms it did not.

Seventeen countries appear in the 2025 field that no earlier set had,
most with one player. They go in through the same Object.assign the
Major 2 block uses, and the flag lookup is rebuilt afterwards because it
is keyed by country name rather than by code.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Build the card set with one parameterised builder

**Files:**
- Modify: `index.html` — add `buildCardSetRegion`, the `t1` stage tables and base
  functions, and one branch in `attrsForRaw`

**Interfaces:**
- Consumes: `rowEntry` (Task 3), `CARD_T1*_RAW` and `T1_NAT` (Task 4)
- Produces: `CARD_TRIOS_T1` (array of `{handles:[…]}`), and `PLAYERS_BASE` entries
  with `cardSet:'t1'`, each carrying `p._t1 = {entry, sorts, base}` for attributes

- [ ] **Step 1: Add the stage tables and rating bands**

Insert after the inserted data block, before `buildCardSetRegion`:

```js
// Eliminations climb with the stage in 2025: 1 in the Last Chance Qualifier,
// 2 in the Play-In, 4 in the Grand Finals. Measured off Epic's point breakdown
// in all seven regions, so these are readings and not settings.
const T1_KILL={PLAYIN:2, LCQ:1, GF:4};
const T1_REGIONS=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
const _T1={};   // _T1[region] = {P:[…], L:[…], G:[…]} of parsed entries
T1_REGIONS.forEach(reg=>{
  const parse=(rows, stage)=>rows.map(r=>rowEntry(r, {killMult:T1_KILL[stage], elimPtsAt:6}));
  _T1[reg]={
    P: parse(window['CARD_T1'+reg+'_PLAYIN_RAW'], 'PLAYIN'),
    L: parse(window['CARD_T1'+reg+'_LCQ_RAW'],    'LCQ'),
    G: parse(window['CARD_T1'+reg+'_GF_RAW'],     'GF')
  };
});
// Percentile tables, one per stage per region — a card says "this good among the
// people who were in that lobby", same rule the 2026 sets use.
const _ST1={};
T1_REGIONS.forEach(reg=>{ _ST1[reg]={
  p: mkSorts(_T1[reg].P), l: mkSorts(_T1[reg].L), g: mkSorts(_T1[reg].G) }; });

// Same bands as 2026, compressed for the thin regions by REGION_TOP.
function t1Band(reg, top, drop, rank, field){
  const ceiling=Math.min(top, REGION_TOP[reg]||85);
  return ceiling - ((rank-1)/Math.max(field-1,1))*drop;
}
const t1PlayinBase = (reg,r) => t1Band(reg, 96, 34, r, _T1[reg].P.length);
const t1LcqBase    = (reg,r) => t1Band(reg, 62, 14, r, _T1[reg].L.length);
const t1GfBase     = (reg,r) => t1Band(reg, 96, 26, r, _T1[reg].G.length);

const CARD_T1_EVENT = reg => 'FNCS 2025 Major 1 — ' + regionName(reg);
const CARD_T1_DATE  = '\u0444\u0435\u0432 2025';   // фев 2025
```

- [ ] **Step 2: Add the builder**

```js
// One builder for every 2025 region. The fourteen 2026 builders are ~340 lines
// each and differ in ten values; copying that seven more times would add ~2400
// lines of duplication for no new behaviour. The 2026 builders are deliberately
// left alone — they are shipped and balanced, and rewriting them risks moving
// live ratings for nothing.
const CARD_TRIOS_T1=[];
function buildCardSetRegion(cfg){
  const known=new Set();
  const add=(entry, stageKey, base)=>{
    CARD_TRIOS_T1.push({handles:entry.duo.slice()});
    entry.duo.forEach(nm=>{
      if(known.has(nm)) return;
      known.add(nm);
      const rating=Math.round(clamp(base(entry.rank), 30, 99));
      const code=cfg.nat[nm]||'';
      const card={
        handle:nm, nat: code ? (CC_RU[code]||null) : null,
        natSource:'tracker',
        region:cfg.region, event:cfg.event, date:cfg.date,
        placement:entry.rank, note:'',
        tier:'cardmode', cardSet:cfg.set, rarity:rarityForRating(rating), rating,
        org:null,
        real:{rank:entry.rank, pts:entry.pts, matches:entry.matches, wins:entry.wins,
              avgElims:entry.avgElims, avgPlace:entry.avgPlace, stage:stageKey}
      };
      card._t1={entry, sorts:cfg.sorts[stageKey], base:()=>base(entry.rank)};
      card._t1Stage=stageKey;
      pushCard(card);
    });
  };
  cfg.stages.P.forEach(e=>{ TEAMMATE_GROUPS.push(e.duo.slice()); add(e,'p',cfg.baseP); });
  cfg.stages.L.forEach(e=>add(e,'l',cfg.baseL));
  cfg.stages.G.forEach(e=>add(e,'g',cfg.baseG));

  // Finalists are rebuilt from the Grand Finals; everyone else keeps their
  // qualifying rating minus the flat miss penalty. Same rule as m1 and m2.
  const byName={};
  PLAYERS_BASE.filter(p=>p.cardSet===cfg.set && p.region===cfg.region)
              .forEach(p=>{ byName[p.handle]=p; });
  const finalists=new Set();
  cfg.stages.G.forEach(entry=>{
    CARD_TRIOS_T1.unshift({handles:entry.duo.slice()});
    entry.duo.forEach(nm=>{
      const p=byName[nm]; if(!p) return;
      finalists.add(nm);
      p._t1={entry, sorts:cfg.sorts.g, base:()=>cfg.baseG(entry.rank)};
      p._t1Stage='g'; p._attrs=null; p.gfEvent=cfg.event;
      p.realGf={rank:entry.rank, pts:entry.pts, matches:entry.matches, wins:entry.wins,
                avgElims:entry.avgElims, avgPlace:entry.avgPlace};
      p.rating=Math.round(clamp(cfg.baseG(entry.rank), 30, 99));
      p.rarity=rarityForRating(p.rating);
    });
  });
  Object.keys(byName).forEach(nm=>{
    if(finalists.has(nm)) return;
    const p=byName[nm];
    p.missedGf=true;
    const base = p._t1Stage==='p' ? missedGfPlayinBase(p._t1.entry.rank, cfg.stages.P.length)
               : p._t1Stage==='l' ? missedGfLcqBase(p._t1.entry.rank, cfg.stages.L.length)
               : p.rating-NO_GF_PENALTY;
    p.rating=Math.round(clamp(base, 30, 99));
    p.rarity=rarityForRating(p.rating);
    p._attrs=null;
  });
}

T1_REGIONS.forEach(reg=>{
  buildCardSetRegion({
    set:'t1', region:reg, nat:T1_NAT,
    event:CARD_T1_EVENT(reg), date:CARD_T1_DATE,
    stages:_T1[reg], sorts:_ST1[reg],
    baseP:r=>t1PlayinBase(reg,r), baseL:r=>t1LcqBase(reg,r), baseG:r=>t1GfBase(reg,r)
  });
});
```

- [ ] **Step 3: Add the single attribute branch**

`attrsForRaw` is a chain of ~42 branches, one per region-stage. Twenty-one more
would drown it. Add exactly one, as the **first** branch inside `attrsForRaw`,
immediately after the `if(p._attrs) return p._attrs;` line:

```js
  // Every 2025 card carries its own stage descriptor, so one branch covers all
  // seven regions and three stages instead of twenty-one more of the below.
  if(p._t1){
    const b = p.missedGf
      ? (p._t1Stage==='p' ? missedGfPlayinBase(p._t1.entry.rank, _T1[p.region].P.length)
        : p._t1Stage==='l' ? missedGfLcqBase(p._t1.entry.rank, _T1[p.region].L.length)
        : p._t1.base())
      : p._t1.base();
    p._attrs=buildM1Attrs(p._t1.entry, p.handle, p._t1.sorts, b, 0);
    return p._attrs;
  }
```

- [ ] **Step 4: Dump and check both the new set and the old ones**

```bash
cd ~/Desktop/fncsdraftmajor
node tools/dump-card-ratings.js /tmp/after-task5.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task5.json m1
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task5.json m2
node -e "
const d=require('/tmp/after-task5.json');
const by={};
for(const k in d){ const [set,reg]=k.split('|'); if(set!=='t1') continue; (by[reg]=by[reg]||[]).push(d[k]); }
for(const reg of Object.keys(by).sort()){
  const rs=by[reg].map(x=>x.rating);
  console.log(reg.padEnd(5), 'cards', String(rs.length).padStart(4),
    'min', Math.min.apply(null,rs), 'max', Math.max.apply(null,rs),
    'at 99:', rs.filter(x=>x===99).length, 'at 30:', rs.filter(x=>x===30).length);
}"
```

Expected:
- both `m1` and `m2` diffs report `0 moved, 0 missing`
- seven `t1` regions appear
- `max` is **90** in every region — `tierCapForEvent` caps online events, exactly as
  it already does for 2026
- `at 99: 0` and `at 30: 0` everywhere — nothing clipped at either clamp

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Build the 2025 set from one builder, not seven copies

The fourteen 2026 builders are ~340 lines each and differ in ten values.
Following that pattern would have added roughly 2400 lines of
duplication to gain nothing, so 2025 gets a parameterised builder called
once per region. The 2026 builders are left untouched on purpose: they
are shipped and balanced, and rewriting them onto the new function would
risk moving live ratings in a commit that is supposed to add a mode.

The attribute dispatch is a chain of one branch per region-stage.
Twenty-one more would have buried it, so each 2025 card carries its own
stage descriptor and the chain grows by exactly one branch.

Ratings top out at 90 in every region because these were online regional
finals and tierCapForEvent already caps those — the same ceiling the
2026 majors sit under. Nothing is clipped at either clamp, and m1 and m2
are unmoved.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Teach the tournament format about 2025

**Files:**
- Modify: `index.html` — `majorFormat`, the Last Chance winner count, the Grand
  Finals game count

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `majorFormat(region, cardSet)` returning `{playInCut, heats, lclGames,
  lcqWinners, gfGames}`; `lcqWinners` and `gfGames` default so 2026 is unchanged

- [ ] **Step 1: Add the 2025 branch**

Insert at the top of `majorFormat`, before the existing `if(DEEP_MAJOR_REGIONS…)`:

```js
  // FNCS 2025 ran groups, not heats: three of them in Europe and NA Central and
  // two everywhere else — the same split this file already calls DEEP_MAJOR.
  // Thirty teams come out of the groups in every region, so the cut is ten per
  // group where there are three and fifteen where there are two.
  if(cardSet==='t1'){
    const deep=DEEP_MAJOR_REGIONS.has(region);
    // Brazil's second group ran six matches; everyone else played five.
    const g2=(region==='BR') ? 6 : 5;
    return {
      playInCut: deep ? 99 : 66,
      heats: deep ? [{games:5,cut:10},{games:5,cut:10},{games:5,cut:10}]
                  : [{games:5,cut:15},{games:g2,cut:15}],
      lclGames:3,
      // What the Last Chance route actually delivered. The Middle East Lobby
      // sent nobody — all 26 of its teams played all three matches, where every
      // other region had teams stop early on a win — and Oceania sent two.
      lcqWinners: (LCQ_WINNERS_2025[region] == null ? 3 : LCQ_WINNERS_2025[region]),
      gfGames:12
    };
  }
```

And above `majorFormat`, next to `DEEP_MAJOR_REGIONS`:

```js
const LCQ_WINNERS_2025={EU:3, NAC:3, NAW:3, BR:3, ASIA:3, ME:0, OCE:2};
```

- [ ] **Step 2: Make the winner count and game count read from the format**

In `runMajor` (the function containing `const FMT=currentMajorFormat(you);`),
three literals become format-driven. Replace:

```js
    const stillNeeded=FMT.lclGames-1-lcqOtherWinners.length;
```

with:

```js
    const lcqSlots = (FMT.lcqWinners == null ? FMT.lclGames : FMT.lcqWinners);
    const stillNeeded=lcqSlots-1-lcqOtherWinners.length;
```

Replace both `computeQuietLCQWinners(…, FMT.lclGames)` calls' **winner cap** usage
by passing the slot count as a third argument, changing the helper signature:

```js
function computeQuietLCQWinners(field, lclGames, slots){
  lclGames = lclGames || 5;
  if(slots == null) slots = lclGames;
```

and inside it, wherever the loop stops at `lclGames` winners, stop at `slots`
instead. Then update both call sites to
`computeQuietLCQWinners(field, FMT.lclGames, lcqSlots)`.

Replace:

```js
  await simulateGamesLive(finalTeams, 12, pointsForPlace, 4, 'stage', 0, null, zoneGroups, {stageName:L().liveRegionalFinals});
```

with:

```js
  await simulateGamesLive(finalTeams, (FMT.gfGames || 12), pointsForPlace, 4, 'stage', 0, null, zoneGroups, {stageName:L().liveRegionalFinals});
```

- [ ] **Step 3: Check the 2026 formats are byte-identical and 2025 adds up**

```bash
cd ~/Desktop/fncsdraftmajor
node -e "
const src=require('fs').readFileSync('index.html','utf8');
const body=src.slice(src.indexOf('const DEEP_MAJOR_REGIONS'), src.indexOf('function seedHeats'));
const ctx={};
new Function('with(this){'+body+'; this.f=majorFormat}').call(ctx);
const F=ctx.f;
for(const r of ['EU','NAC','NAW','BR','ASIA','ME','OCE']){
  const t=F(r,'t1');
  const fromGroups=t.heats.reduce((s,h)=>s+h.cut,0);
  console.log(r.padEnd(5),'groups',t.heats.length,'cut',JSON.stringify(t.heats.map(h=>h.games+'x'+h.cut)),
              'groups->',fromGroups,'+lcq',t.lcqWinners,'= field',fromGroups+t.lcqWinners);
}
console.log('--- 2026 unchanged ---');
console.log('m1 EU  ', JSON.stringify(F('EU','m1')));
console.log('m1 OCE ', JSON.stringify(F('OCE','m1')));
console.log('m2 OCE ', JSON.stringify(F('OCE','m2')));
"
```

Expected fields: EU 33, NAC 33, NAW 33, BR 33, ASIA 33, **ME 30**, **OCE 32** —
matching the measured Grand Finals row counts exactly. BR must show `5x15` and
`6x15`. The three 2026 lines must show `playInCut:150` for EU and `playInCut:100`
with a six-game second heat for `m1` OCE, unchanged from today.

- [ ] **Step 4: Confirm no card ratings moved**

```bash
node tools/dump-card-ratings.js /tmp/after-task6.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task6.json m1
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task6.json m2
```

Expected: `0 moved, 0 missing` on both.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Give 2025 its own bracket, measured rather than assumed

Epic's published bracket says "top 5 advance" per group, which would put
fifteen teams into a 33-team final. Matching group rosters against final
rosters says thirty come out of the groups everywhere — ten per group in
the two regions that ran three, fifteen in the five that ran two. The
five flagged teams per group are the Victory Royale instant-advance
subset, not the cut.

Last Chance is what makes two finals short, so its winner count stops
being borrowed from the number of Lobby games. Every region played three
Lobby matches; the Middle East sent nobody and Oceania sent two. Games
and winners are different quantities and now say so.

The three-group split lands exactly on DEEP_MAJOR_REGIONS, which the
file already knew about for 2026, and Brazil's six-match second group
mirrors the sixGameHeat2 quirk already sitting in the 2026 branch.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Mode tile, trio start, and theme wiring

**Files:**
- Modify: `index.html` — mode grid markup, `chooseMode`, `modeThemeKey`,
  `MODE_THEME`, both `I18N` blocks

**Interfaces:**
- Consumes: `t1` cards (Task 5), `majorFormat` branch (Task 6)
- Produces: a fourth tile starting `chooseMode(3, 'cards2025')`

- [ ] **Step 1: Route the new mode**

In `chooseMode`, replace the two `pendingCards` / `pendingCardSet` lines with:

```js
  pendingCards = (major==='cards' || major==='cards1' || major==='cards2025');
  pendingCardSet = (major==='cards1') ? 'm1' : (major==='cards2025') ? 't1' : 'm2';
```

In `modeThemeKey`, replace `if(cards) return set==='m1' ? 'm1' : 'm2';` with:

```js
  if(cards) return set==='m1' ? 'm1' : set==='t1' ? 't1' : 'm2';
```

- [ ] **Step 2: Add the tile**

In the first `mode-grid mode-grid-3` block, change the class to
`mode-grid mode-grid-4` and insert this tile **before** the career tile:

```html
      <div class="mode-card" onclick="chooseMode(3, 'cards2025')">
        <div class="ec-art" style="background-image:url(art/mode-major1.jpg)"><span class="ec-pill ec-pill-l" data-i18n="ecScope7"></span><span class="ec-pill ec-pill-r" data-i18n="ecStCards"></span><div class="ec-foot"><div class="ec-when" data-i18n="ecDateT1"></div><h3 class="ec-title" data-i18n="modeCardsT1Title"></h3><div class="ec-mode"><span class="ec-chip">Battle Royale</span><span class="ec-sub" data-i18n="ecSubTrios"></span></div></div></div>
        <p data-i18n="modeCardsT1Desc"></p>
        <span class="mode-count" data-i18n="modeCardsT1Count"></span>
      </div>
```

- [ ] **Step 3: Add the strings**

In the Russian `I18N` block, beside `ecDateM2:`, add `ecDateT1:'фев 2025',` and
beside `modeCards1Count:` add:

```js
modeCardsT1Title:'FNCS 2025 Major 1',
modeCardsT1Desc:'Все семь регионов FNCS 2025 Major 1 в трио: плей-ин, Last Chance Qualifier и региональный финал в каждом. Атрибуты по настоящим результатам — элим стоит 1 очко в LCQ, 2 в плей-ине и 4 в финале.',
modeCardsT1Count:'3 игрока · плей-ин, группы, региональный финал',
```

In the English block, `ecDateT1:'Feb 2025',` and:

```js
modeCardsT1Title:'FNCS 2025 Major 1',
modeCardsT1Desc:'All seven regions of FNCS 2025 Major 1 in trios: a Play-In, a Last Chance Qualifier and a regional final in each. Attributes drawn from actual results — an elimination is worth 1 point in the LCQ, 2 in the Play-In and 4 in the final.',
modeCardsT1Count:'3 players · play-in, groups, regional final',
```

- [ ] **Step 4: Add a placeholder theme entry**

In `MODE_THEME`, after the `m2` entry, add a provisional entry. Task 8 replaces
the numbers with sampled ones; this exists so the mode is playable now.

```js
  // FNCS 2025 is Chapter 6, and its leaderboard was pale steel rather than the
  // teal of Chapter 7. Held in a dark register for now — the true light
  // inversion is a separate change, see Task 8.
  t1:     {glow:[[132,138,158,.50],[196,200,216,.38],[38,40,52,.78]],
           pageBase:'linear-gradient(160deg,#2b2d3a 0%,#232530 46%,#1b1c25 100%)',
           panel:'rgba(30,32,42,.62)', panel2:'rgba(38,40,52,.58)',
           inkDim:'#c2c5d2', inkDimmer:'#9296a6', lineCol:'rgba(180,186,208,.22)'},
```

- [ ] **Step 5: Verify the mode starts and drafts three players**

Open `index.html` in a browser, click the new tile, pick Europe, and confirm:
the region screen shows a 2025 roster, the draft asks for **three** players, and
the lobby is steel-grey rather than teal.

Then re-run the regression:

```bash
node tools/dump-card-ratings.js /tmp/after-task7.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task7.json m1
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task7.json m2
```

Expected: `0 moved, 0 missing` on both.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Put the 2025 Major on the menu as a trio

The simulation has carried trios since the free modes shipped, so
starting card mode at size three needed routing rather than mechanics:
one more branch in chooseMode and one in the theme key.

The tile says what the mode actually is, including that an elimination
is worth 1, 2 or 4 depending on the stage, because that is the part a
player cannot infer from anywhere else.

The theme is a dark reading of the Chapter 6 leaderboard for now. The
real screen is pale, and inverting a dark app to a light table needs
every standings screen audited for hardcoded colours — worth doing, not
worth blocking a playable mode on.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Sample the Chapter 6 palette from the screenshot

**Files:**
- Create: `tools/sample-palette.js`
- Modify: `index.html` — the `t1` entry in `MODE_THEME`

**Interfaces:**
- Consumes: `Desktop\2025\photo_2026-08-09_15-03-19.jpg`
- Produces: measured hex values replacing the provisional ones from Task 7

- [ ] **Step 1: Write the sampler**

Node cannot decode a JPEG without a dependency, and this project has none. Use the
browser that is already available: draw the image to a canvas and read pixels.

```js
// tools/sample-palette.js — writes a small HTML harness that reports the
// dominant colours of the reference leaderboard, then runs it in headless Chrome.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const IMG = process.argv[2];
if (!IMG || !fs.existsSync(IMG)) throw new Error('pass the path to the reference screenshot');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const b64 = fs.readFileSync(IMG).toString('base64');
const html = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
document.getElementById('i').onload = function(){
  var im = this, c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  function avg(x0, y0, x1, y1){
    var d = g.getImageData(x0, y0, x1 - x0, y1 - y0).data, r = 0, gr = 0, b = 0, n = 0;
    for (var i = 0; i < d.length; i += 4){ r += d[i]; gr += d[i+1]; b += d[i+2]; n++; }
    var h = function(v){ v = Math.round(v / n).toString(16); return v.length < 2 ? '0' + v : v; };
    return '#' + h(r) + h(gr) + h(b);
  }
  var W = c.width, H = c.height;
  document.getElementById('o').textContent = '<<<' + JSON.stringify({
    size: W + 'x' + H,
    backdropTop:    avg(W*0.70|0, H*0.05|0, W*0.95|0, H*0.15|0),
    backdropBottom: avg(W*0.70|0, H*0.80|0, W*0.95|0, H*0.95|0),
    leaderRow:      avg(W*0.10|0, H*0.33|0, W*0.40|0, H*0.39|0),
    altRow:         avg(W*0.10|0, H*0.41|0, W*0.40|0, H*0.47|0),
    rowText:        avg(W*0.09|0, H*0.35|0, W*0.30|0, H*0.37|0)
  }) + '>>>';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pal-'));
const f = path.join(dir, 'p.html');
fs.writeFileSync(f, html);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--virtual-time-budget=8000','--dump-dom','file:///' + f.replace(/\\/g,'/')],
  { maxBuffer: 64*1024*1024, encoding:'utf8' });
const m = dom.match(/&lt;&lt;&lt;([\s\S]*?)&gt;&gt;&gt;|<<<([\s\S]*?)>>>/);
console.log(JSON.parse((m[1]||m[2]).replace(/&quot;/g,'"')));
fs.rmSync(dir, { recursive:true, force:true });
```

- [ ] **Step 2: Run it**

Run: `node tools/sample-palette.js "$HOME/Desktop/2025/photo_2026-08-09_15-03-19.jpg"`

Expected: five hex values. The backdrop pair should be greys in the `#8` to `#c`
range, `leaderRow` near white, `altRow` a muted lavender, `rowText` near black.

- [ ] **Step 3: Rewrite the `t1` theme from the readings**

Replace the provisional numbers in the `t1` entry. Keep the app dark, but take the
hues from the readings: `pageBase` is the sampled backdrop pair darkened to the
same lightness band as the `m1` and `m2` entries, and `lineCol` takes the lavender
hue from `altRow`. Record the sampled values in the comment above the entry so the
next person does not have to re-measure.

- [ ] **Step 4: Confirm the lobby still reads and nothing moved**

Open the mode, confirm text is legible on the new backdrop, then:

```bash
node tools/dump-card-ratings.js /tmp/after-task8.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/after-task8.json
```

Expected: `0 moved, 0 missing`.

- [ ] **Step 5: Commit**

```bash
git add tools/sample-palette.js index.html
git commit -m "Take the 2025 palette off the screenshot, not off taste

The m1 and m2 themes were sampled from real leaderboard captures and say
so in their comments. This one now is too, through a canvas readback
because the project has no image dependency and should not gain one.

The readings are written into the comment so the next change to this
theme starts from measurements rather than from a re-guess.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Run the mode end to end

**Files:**
- Modify: none expected; fix whatever this surfaces

- [ ] **Step 1: Play Europe to a champion**

Open `index.html`, start FNCS 2025 Major 1, pick Europe, draft three players, and
play through. Confirm at each stage:

- Play-In cuts to **99**
- **three** groups appear, five games each
- **30** teams come out of the groups
- Last Chance adds **3**, giving a **33**-team final
- the final runs **12** games
- a champion is crowned and the results screen renders without a prize card

- [ ] **Step 2: Play a two-group region and a short one**

Repeat for **Brazil** — confirm two groups, the second running **six** games, and a
33-team final.

Repeat for the **Middle East** — confirm two groups, **no** Last Chance qualifiers,
and a **30**-team final. This is the case most likely to break, because a zero-winner
Last Chance leg is a path the 2026 code never takes.

- [ ] **Step 3: Check the console is clean**

With DevTools open across a full run, confirm no uncaught errors. The five teams
Tracker returned with fewer than three accounts are the likeliest source of a
length assumption blowing up.

- [ ] **Step 4: Final regression**

```bash
cd ~/Desktop/fncsdraftmajor
node tools/dump-card-ratings.js /tmp/final.json
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/final.json m1
node tools/diff-card-ratings.js tools/baseline-card-ratings.json /tmp/final.json m2
```

Expected: `0 moved, 0 missing` on both.

- [ ] **Step 5: Commit any fixes and update the spec's verification section**

Tick off the "still to check" items in
`docs/superpowers/specs/2026-08-09-fncs-2025-trio-major-design.md`, recording what
was actually observed rather than what was expected.

```bash
git add -A
git commit -m "Play 2025 through in three regions and record what happened

Europe for the three-group path, Brazil for the two-group path with its
odd six-match second group, and the Middle East for the case the 2026
code never meets: a Last Chance leg that sends nobody and a final that
is deliberately short.

The spec's verification section now records observations instead of
intentions.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes

**Spec coverage.** Data source and shape → Tasks 2, 4. Per-stage elimination
multiplier → Tasks 3, 5. Measured `endShare` → Task 3. Nationality and the
seventeen country names → Tasks 2, 4. Size-anomaly logging → Task 2 Step 2.
`buildCardSetRegion` → Task 5. Leaving the fourteen 2026 builders alone → Task 5,
enforced by the harness in Task 1. Format, `lcqWinners`, `gfGames` → Task 6. Team
size → Task 7. Theme, two-step → Tasks 7, 8. Verification → Tasks 1, 9.

**Out-of-scope items are not in any task, deliberately:** the Chapter 6 map and
loot pool, a LAN continuation, Liquipedia enrichment, the Divisional Cup pages, and
migrating the 2026 builders.

**Known soft spot carried from the spec:** NA Central's groups measure 31 through
where the model uses 30. Task 6 simulates 30 and the discrepancy is one team.
