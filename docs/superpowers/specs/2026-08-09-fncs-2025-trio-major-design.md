# FNCS 2025 Major 1 — trio card set

9 August 2026

## What this adds

A third card-mode set alongside the two duo Majors of 2026: **FNCS 2025 Major 1**,
played in **trios**, across all seven regions. It gets its own tile on the mode
screen, its own tournament format, its own leaderboard theme, and cards built from
the published stage results the same way `m1` and `m2` are.

The set key is `t1`. The event is `S33_FNCSMajor1`.

## Why it is not just more data

`m1` and `m2` are duos. Three things in the pipeline assume that, and each is a
one-line generalisation rather than a rewrite:

- the raw row parser hardcodes `duo:[r[6], r[7]]`
- the elimination multiplier is a file-level constant, `KILL_MULT = 4`
- card mode always starts with `chooseMode(2, …)`

Everything downstream already treats a team as an array of any length. `entry.duo`
is only ever read via `.slice()` and `.forEach`. The simulation has carried trios
since the free modes shipped — `PLACEMENT_POINTS_TRIO`, `TEAM_TARGET[3]` and
`LANDING_ZONE_SHARE[3]` all exist. Card mode has simply never been started with
`squadSize = 3`.

## Data

### Source

Fortnite Tracker pages carry Epic's own leaderboard payload in a
`var imp_leaderboard = {…}` assignment: every team, its rank, its total, a
`pointBreakdown` split by scoring rule, a `sessionHistory` with per-match
placement, eliminations and Victory Royale flags, and an `internal_Accounts` map
from account id to esports nickname and country code. A sibling `var imp_event`
carries the window list, `MatchCap` and `PlaylistId`.

Tracker refuses server-side fetches, so the pages are read in a browser tab: from
one open Tracker tab, every other window is pulled same-origin with `fetch` and the
payload brace-matched out of the returned HTML. Two passes captured 44 leaderboards
into `2025/fncs-2025-major1.json` and `2025/fncs-2025-major1-stages.json`.

**Nothing is transcribed by hand.** Adding a future Major is a URL change.

Three of those stages are card sources, the same three `m1` and `m2` use:

| Region | Play-In | Last Chance Qualifier | Grand Finals |
|---|---|---|---|
| EU | 100 | 100 | 33 |
| NAC | 100 | 100 | 33 |
| NAW | 100 | 100 | 33 |
| BR | 100 | 100 | 33 |
| ASIA | 100 | 100 | 33 |
| ME | 100 | 100 | 30 |
| OCE | 100 | 100 | 32 |

**3,475 distinct players.** Play-In and Last Chance figures are the cumulative
leaderboards, top 100 — the same kind of table the 2026 sets use.

The Group Stage and Last Chance Lobby leaderboards were also captured. They are not
card sources — neither is in `m1` or `m2` — but they are what settled the format
below, so they stay in the folder.

### Shape

```
CARD_T1<REGION>_PLAYIN_RAW / _LCQ_RAW / _GF_RAW
// [rank, points, matches, wins, avgElims, avgPlace, elimPoints, player1, player2, player3]
```

Identical to the duo rows with one more name and one more measured column. The
extractor emits these as literal rows committed into `index.html`, the way every
other set is, so the page stays a single file with no fetch at runtime.

### Parsing

`m1Entry` becomes `rowEntry(r, opts)`:

- players come from the trailing string entries, so one function reads both duos
  and trios
- the field stays named `duo` — it is used as a plain array everywhere, and
  renaming it would touch fourteen shipped builders for no behavioural gain
- the elimination multiplier arrives per stage, not per file

### Elimination points climb with the stage

Measured from `pointBreakdown.TEAM_ELIMS_STAT_INDEX:1`, pooled across all seven
regions, exact to three decimals:

| Stage | Per elimination |
|---|---|
| Last Chance Qualifier | **1** |
| Play-In | **2** |
| Group Stage | **3** |
| Grand Finals | **4** |
| Last Chance Lobby | **0** — placement and Victory Royale only |

A clean ladder: the deeper the stage, the more a kill is worth. This is why the
multiplier is a per-stage argument and not a constant. The 2026 duo value of 4
stays where it is.

### Endgame share is measured, not inferred

`endShare` — the attribute input separating players who score by surviving from
players who score by fragging — is currently inferred as
`(tpm − avgElims × KILL_MULT) / tpm`. With the real breakdown in hand it is simply
`(points − elimPoints) / points`, per team, per stage, which is why `elimPoints`
is carried in the row.

This also disposes of a trap. Group Stage and Last Chance Lobby totals carry a flat
**+1000 advancement flag** for qualifying teams. Inferring `endShare` for those
teams would have returned about 0.93 and handed a fake-high Endgame rating to
precisely the players the format already rewarded. Reading the breakdown avoids the
question. It also means the Lobby, where eliminations are worth nothing, cannot be
used as an attribute source at all — another reason it is not a card stage.

### Nationality

Tracker supplies a country code for **2,367 of 3,475 players (68%)**, spanning 121
countries. Coverage is even across regions except Asia, which sits near 48%.

Players without a code get no flag, which is the existing behaviour for unknowns in
the 2026 sets — `nat` is nullable and the card renders without one. Liquipedia can
lift the top names later; it is not a blocker.

Of the 121 codes, 104 already have names in `CC_RU` / `CC_EN`. Seventeen need
adding, all with one or two players each:
`aq bg cd dj je kn ky lu me mu sb sk tg tj vi vu ax`.

### Known data quirks

Five teams come back from Tracker with fewer than three accounts:

| Leaderboard | Rank | Returned |
|---|---|---|
| ASIA Play-In | 78 | qwqqqq245 + しょうごとてっしん |
| EU Play-In | 80 | syla! |
| NAC Play-In | 50 | Syn + andrew igl |
| NAW Play-In | 32 | Jagveer + Chris |
| NAW Grand Finals | 15 | Jagveer + Chris |

They are kept at the size Tracker reports rather than dropped or padded — the
placement is real and the roster is what the source says. `Jagveer + Chris` appears
at two stages consistently, so it is a genuine two-player entry rather than a lookup
failure. The build logs every team whose size is not three, so none passes
unnoticed.

## Building the set

The fourteen existing per-region builders (`buildMajor1EU` … `buildMajor2OCE`) are
~340 lines each and differ in exactly ten values: three stage arrays, three event
names, three dates, three base-rating functions, region, `cardSet`, the nationality
and org maps, and the card key prefix.

Copying that seven more times would be ~2,400 lines for no new behaviour. So 2025
gets one parameterised function, `buildCardSetRegion(cfg)`, called once per region.

**The fourteen existing builders are left alone.** They are shipped and balanced;
rewriting them onto the new function risks silently shifting live card ratings.
Migrating them is worth doing later as its own commit, with a before/after rating
diff to prove nothing moved.

Rating rules are inherited unchanged: finalists are rebuilt from the Grand Finals,
everyone else keeps their qualifying-stage rating minus the flat miss penalty, and
`REGION_TOP` compresses the thin regions to a ceiling of 85 instead of clipping
them.

## Format

Epic's published bracket reads "top 5 advance" per group, and an earlier draft of
this spec took that at face value and had the groups sending 15 to a 33-team final,
with Last Chance somehow finding 18 more. **That was wrong.** Matching group rosters
against final rosters shows what actually happened:

A finalist came through Last Chance if it appears in that region's Lobby carrying
the +1000 advancement flag. Everything else came out of a group:

| Region | Groups | From groups | Per group | From Last Chance | Final |
|---|---|---|---|---|---|
| EU | 3 | 30 | 10 | 3 | 33 |
| NAC | 3 | **31** | 10.3 | 2 | 33 |
| NAW | 2 | 30 | 15 | 3 | 33 |
| BR | 2 | 30 | 15 | 3 | 33 |
| ASIA | 2 | 30 | 15 | 3 | 33 |
| ME | 2 | 30 | 15 | 0 | 30 |
| OCE | 2 | 30 | 15 | 2 | 32 |

**Six regions send thirty out of the groups** — ten per group where there are three,
fifteen where there are two. NA Central reads 31, which is very likely a Lobby
qualifier whose flag did not land rather than a different cut, but the flag is the
only evidence available and it does not say so. The simulator uses a cut of 10 and
15; NA Central's extra team is a known and accepted one-team discrepancy, not a
modelled rule.

The five teams per group carrying the +1000 flag are the Victory Royale
instant-advance subset; the rest advance on points. "Top 5" described the flag, not
the cut.

**The short fields are entirely a Last Chance story, and the Middle East proves it
outright.** In every other region some Lobby teams played only one or two of the
three matches, because winning ends a team's run — the same stop-on-win rule the
groups use. In the Middle East all 26 Lobby teams played all three matches and not
one carried the flag. Nobody advanced, so its final is exactly the thirty the groups
sent. Oceania sent two instead of three. Group count does not explain this: NA West,
Brazil and Asia also ran two groups and all three filled to 33.

Two warnings for anyone re-deriving this. Matching finalists to a stage by exact
roster loses teams that changed a player in between — six did, of which four are one
player renaming himself (`Enzouzzawesomer` → `Enzouzz km 29 10`, `1ǃm` →
`もうちょびっと`, `dvs tt adzyǃ` → `DVS FELL OFFǃ`, `32 is the Hero` → `Blessed 32`).
But loosening to "any two of three players match" over-counts in the other
direction: players move between trios across stages, so two genuinely different
teams can share two members. An earlier pass using the loose rule alone credited
teams to the Lobby that had scored zero points in it. The flag, not the roster, is
what settles the leg.

Two other things fall out of the same data:

- **EU and NAC ran three groups; the other five ran two** — the same split the code
  already knows as `DEEP_MAJOR_REGIONS`.
- **Every group is five matches except Brazil's Group 2, which is six.** The 2026
  branch carries an equivalent quirk in `sixGameHeat2`.

So `majorFormat()` gains a branch on `cardSet`:

```js
// FNCS 2025 — EU and NAC
{ playInCut:99, heats:[{games:5,cut:10},{games:5,cut:10},{games:5,cut:10}],
  lclGames:3, lcqWinners:3, gfGames:12 }

// FNCS 2025 — everywhere else (Brazil's second group runs six)
{ playInCut:66, heats:[{games:5,cut:15},{games:region==='BR'?6:5,cut:15}],
  lclGames:3, lcqWinners:LCQ_WINNERS_2025[region], gfGames:12 }

// What the Last Chance route actually delivered, per region.
const LCQ_WINNERS_2025 = {EU:3, NAC:3, NAW:3, BR:3, ASIA:3, ME:0, OCE:2};
```

The groups always contribute 30, so the field a region ends up with is
`30 + LCQ_WINNERS_2025[region]` — 33 for five regions, 30 for the Middle East and
32 for Oceania. Both terms are counted rather than fitted; the one place the count
is soft is NA Central, which shows 31 out of its groups and is simulated at 30.

`playInCut` follows the observed group rosters: 93–97 teams across three groups in
the deep regions, 62–67 across two elsewhere.

Three things already line up and need no new code:

- `heatQualifiers()` seeds the advancing set with every team holding a VR and only
  then fills to `cut` on points — exactly the 2025 rule, written for 2026
- `simulateGamesStopOnWin()` already ends a team's group run at its first win, which
  is why group match counts range from 1 to 5
- the Grand Finals already simulate 12 games at 4 points per elimination, which is
  what 2025 ran

One new field is still needed, and the data makes the case for it outright. Today
the count of Last Chance qualifiers is taken from `lclGames`, because in 2026 an
*n*-game Lobby produced *n* winners. Every 2025 Lobby ran three matches, but the
Middle East sent nobody and Oceania sent two — so games and winners are plainly
different quantities here, not the same number wearing two hats. `lcqWinners`
becomes explicit, defaulting to `lclGames` where absent, leaving 2026 untouched.

`gfGames` is likewise made explicit rather than left as the literal 12 in the call.

## Team size

`chooseMode(3, 'cards2025')` sets `pendingSize = 3` and `pendingCardSet = 't1'`.
From there `squadSize = 3` flows through the draft, the bot squads, the placement
table and the landing-zone share without further change.

## Theme

`modeThemeKey()` gains a `t1` case and `MODE_THEME` a matching entry, the same
mechanism that gives `m1` its Summit ice and `m2` its Antwerp amber. The palette is
sampled from the Chapter 6 in-game leaderboard rather than picked by eye, using
headless Chrome and a canvas readback.

The reference screen is **light** — pale steel, white leader row, lavender
alternates, near-black text — and the application is dark. A full inversion means
flipping `--lb-ink` and auditing every standings screen for colours hardcoded past
the theme variables, where white text would vanish on a pale row.

So this lands in two steps. First a muted steel **dark** reading of the same
grey-lavender palette: it drops into the existing mechanism with no risk and already
reads as Chapter 6 rather than Chapter 7. The true light inversion follows once the
mode runs, when every standings screen can be compared before and after on a live
run. Shipping the mode is not blocked on styling.

## Deliberately out of scope

- **Chapter 6 map and landing zones.** `ZONE_SETS` has ~40 hand-placed zones per
  map; 2025 reuses the `m1` set until its own is drawn. Fortnite.GG Map Evolution
  pages for seasons 33, 34 and 36 are already in the source folder for that work.
- **Chapter 6 loot pool.** Reuses `M1_WEAPON_POOL` and its consumables.
- **A LAN continuation.** `gfSlots` resolves to 0 for any set that is not `m1` or
  `m2`, so a 2025 run ends at its regional Grand Final with no Summit leg and no
  prize card. This is the existing fallback and needs no code.
- **Liquipedia nationality enrichment** beyond Tracker's 68%.
- **The five Divisional Cup pages** in the source folder. They are Division 1 weeks
  1–5, not part of the Major — but they are exactly the division cups career mode
  still lacks, so they are kept for that work.
- **Migrating the fourteen duo builders** onto `buildCardSetRegion`.

## How it gets verified

Already passed, before any code was written:

- The browser harvest was re-derived independently from the two Tracker pages saved
  to disk. Both Europe leaderboards came out **byte-identical**, so the regions
  pulled only over the network rest on the same footing as the two on disk.
- The extracted Europe Grand Finals top ten matches `M1_2025_EU_RANKED`, already in
  `index.html` and entered by hand from a different source — **10 of 10**.
- The extracted NA Central finals top three matches the in-game leaderboard
  screenshot in the source folder.
- Elimination points per stage are exact in all seven regions.
- The finals field composition is derived from roster matching, not from the
  bracket graphic — which is how the bracket's "top 5" was caught as a misreading.
- Every team not returned at size three is enumerated above.

Checked after building, headlessly:

- All 4886 pre-existing cards were dumped before any edit and re-dumped after
  each one. Ratings and rarities never moved. Five cards shift by one point of
  overall, because experience is ranked against the whole dataset and a real
  Major was added to it; proven to be the only cause by patching the 2025 stages
  out of the experience tally, which makes the diff clean.
- The mode starts at squad size three with a 3491-card roster across all seven
  regions, and nationality resolves for 76% of it rather than Tracker's 68%,
  because the existing cross-fill lends Liquipedia-verified countries to the
  same handle in the same region.
- Ratings top out at 96–97 in the deep regions and 85 in the thin ones, with
  nothing clipped at either clamp and no card above 99. The last of those caught
  a real bug: the S1neD meme pins a card to 101 and exempts the competitive sets
  by name, so the new set walked past the exemption.
- The bracket was run through the real tournament functions — seedHeats,
  simulateGamesStopOnWin, heatQualifiers, computeQuietLCQWinners — for every
  region. Thirty come out of the groups everywhere and the final field lands on
  the published row count in all seven: 33, 33, 33, 33, 33, 30, 32.

Still to check, by playing it:

- Card ratings for each region's Grand Finals top three land inside the band
  `REGION_TOP` allows, with no card clipped at the 99 or 30 clamp.
- A full interactive run in a real browser: the draft dealing three-player packs,
  the stage cards reading correctly, the steel theme legible on every standings
  screen, and a champion crowned. The Middle East is the case most worth watching,
  because its Last Chance stage is skipped outright and no earlier set has ever
  taken that path.
- The console stays clean across a full run. The ten teams Tracker returned with
  fewer than three accounts are the likeliest place a length assumption breaks.
