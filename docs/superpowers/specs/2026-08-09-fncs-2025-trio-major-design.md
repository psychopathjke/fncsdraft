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
placement, eliminations and Victory Royale flags, and an `internal_Accounts`
map from account id to esports nickname and country code.

Tracker refuses server-side fetches, so the pages are read in a browser tab. Both
stages of all seven regions were pulled in one pass, by fetching each region's URL
same-origin from an already-open Tracker tab and brace-matching the payload out of
the returned HTML. The result is `2025/fncs-2025-major1.json` — 14 leaderboards,
927 teams, 2,102 distinct players.

**Nothing is transcribed by hand.** Adding a future Major is a URL change.

| Region | Play-In | Grand Finals |
|---|---|---|
| EU | 100 | 33 |
| NAC | 100 | 33 |
| NAW | 100 | 33 |
| BR | 100 | 33 |
| ASIA | 100 | 33 |
| ME | 100 | 30 |
| OCE | 100 | 32 |

Play-In figures are the cumulative leaderboard, top 100 — the same kind of table
the 2026 sets use, which took the cumulative top 150.

There is no Last Chance leaderboard, so each set is built from two stages rather
than three. This needs no special handling: `missedGfLcqBase` never fires, and a
Play-In player who missed the final takes the Play-In miss penalty.

Group Stage is not a card source in any set — `m1` and `m2` build from Play-In,
LCQ and Grand Finals — so it is not collected.

### Shape

```
CARD_T1<REGION>_PLAYIN_RAW / CARD_T1<REGION>_GF_RAW
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

### Elimination points are per stage: 2 and 4

Measured from `pointBreakdown.TEAM_ELIMS_STAT_INDEX:1`, which reports points
earned and eliminations achieved as separate totals, and identical in all seven
regions:

| Stage | Per elimination |
|---|---|
| Play-In | **2** |
| Grand Finals | **4** |
| Group Stage (not collected, read off a broadcast overlay) | 3 |

This corrects an earlier reading of 3 for the whole season, which came from a
Group Stage overlay and was true only of that stage. The 2026 duo constant of 4
stays where it is.

### Endgame share is measured, not inferred

`endShare` — the attribute input separating players who score by surviving from
players who score by fragging — is currently inferred as
`(tpm − avgElims × KILL_MULT) / tpm`. With the real breakdown in hand it is simply
`(points − elimPoints) / points`, per team, per stage, which is why `elimPoints`
is carried in the row.

This also disposes of a trap. Group Stage totals carry a flat **+1000 advancement
flag** for teams holding a Victory Royale. Inferring `endShare` for those teams
would have returned about 0.93 and handed a fake-high Endgame rating to precisely
the players the format already rewarded. Reading the breakdown avoids the question.

### Nationality

Tracker supplies a country code for **1,420 of 2,102 players (68%)**, spanning 95
distinct countries. Coverage is even across regions except Asia, which sits at 48%.

Players without a code get no flag, which is the existing behaviour for unknowns
in the 2026 sets — `nat` is nullable and the card renders without one. Liquipedia
can lift the top names later; it is not a blocker.

Of the 95 codes, 91 already have names in `CC_RU` / `CC_EN`. Four need adding:
**bg, dj, lu, sk**.

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
placement is real and the roster is what the source says. `Jagveer + Chris`
appears at two stages consistently, so it is a genuine two-player entry rather
than a lookup failure. The build logs every team whose size is not three, so none
passes unnoticed.

## Building the set

The fourteen existing per-region builders (`buildMajor1EU` … `buildMajor2OCE`) are
~340 lines each and differ in exactly ten values: three stage arrays, three event
names, three dates, three base-rating functions, region, `cardSet`, the
nationality and org maps, and the card key prefix.

Copying that seven more times would be ~2,400 lines for no new behaviour. So 2025
gets one parameterised function, `buildCardSetRegion(cfg)`, called once per region.
It takes whichever stages it is given, so a two-stage set is not a special case.

**The fourteen existing builders are left alone.** They are shipped and balanced;
rewriting them onto the new function risks silently shifting live card ratings.
Migrating them is worth doing later as its own commit, with a before/after rating
diff to prove nothing moved.

Rating rules are inherited unchanged: finalists are rebuilt from the Grand Finals,
everyone else keeps their qualifying-stage rating minus the flat miss penalty, and
`REGION_TOP` compresses the thin regions to a ceiling of 85 instead of clipping
them.

## Format

From Epic's published 2025 bracket for EU and NAC, confirmed against the data and
against Epic's own event metadata (`Playlist_ShowdownTournament_Trios`,
`MatchCap: 6` on each of two final days):

- **Play-In** — Division 1 only, 10 matches on each of two days, 99 advance
- **Group Stage** — three groups, five matches each, top 5 advance, a Victory
  Royale advances instantly
- **Last Chance** — an open qualifier for Divisions 1–3 feeding a Last Chance
  Lobby of 3 matches
- **Major Finals** — 6 matches on each of two days

The Group Stage data confirms the instant-advance rule outright: matches played per
team range from 1 to 5, because a team stops once it wins. Group 3 shows exactly
five teams over 1000 points and exactly five teams with a Victory Royale.

`majorFormat()` gains a branch on `cardSet`:

```js
// FNCS 2025
{ playInCut:99,
  heats:[{games:5,cut:5},{games:5,cut:5},{games:5,cut:5}],
  lclGames:3, lcqWinners:<field − 15>, gfGames:12 }
```

Three things already line up and need no new code:

- `heatQualifiers()` seeds the advancing set with every team holding a VR and only
  then fills to `cut` on points — exactly the 2025 rule, written for 2026
- `simulateGamesStopOnWin()` already ends a team's group run at its first win
- the Grand Finals already simulate 12 games at 4 points per elimination, which is
  what 2025 ran

One new field is needed. Today the count of Last Chance qualifiers is taken from
`lclGames`, because in 2026 an *n*-game Lobby produced *n* winners. In 2025 the
Lobby ran 3 matches but the finals fields are larger than the 15 the groups send.
So `lcqWinners` becomes explicit, defaulting to `lclGames` where absent — leaving
2026 untouched.

**Field size is measured per region; the split is set to reproduce it.** Grand
Finals fields are 33 everywhere except Middle East (30) and Oceania (32), so
`lcqWinners` is 18, 15 and 17 respectively. The bracket implies 15 from the groups
and 3 from Last Chance, which does not reach 33, and the Groups 1–2 and Last Chance
leaderboards were not collected to settle it. Rather than invent a qualification
path, the field size is taken from the row count and Last Chance makes up the
difference. If those pages are ever pulled, only `lcqWinners` changes.

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
grey-lavender palette: it drops into the existing mechanism with no risk and
already reads as Chapter 6 rather than Chapter 7. The true light inversion follows
once the mode runs, when every standings screen can be compared before and after on
a live run. Shipping the mode is not blocked on styling.

## Deliberately out of scope

- **Chapter 6 map and landing zones.** `ZONE_SETS` has ~40 hand-placed zones per
  map; 2025 reuses the `m1` set until its own is drawn.
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
  to disk. Both EU leaderboards came out **byte-identical**, so the six regions
  pulled only over the network rest on the same footing as the two on disk.
- The extracted EU Grand Finals top ten matches `M1_2025_EU_RANKED`, already in
  `index.html` and entered by hand from a different source — **10 of 10**.
- Elimination points per stage are exact integers in all seven regions.
- Every team not returned at size three is enumerated above.

Still to check, once built:

- Card ratings for each region's Grand Finals top three land inside the band
  `REGION_TOP` allows, with no card clipped at the 99 or 30 clamp.
- The mode runs end to end in a browser for at least EU and one thin region: 99
  into three groups, 15 out, Last Chance filling to the measured field, twelve
  games, a champion.
- `m1` and `m2` card ratings are byte-identical before and after, since `rowEntry`,
  `KILL_MULT` and `majorFormat` are all touched.
