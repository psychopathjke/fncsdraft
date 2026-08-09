# FNCS 2025 Major 1 — trio card set

9 August 2026

## What this adds

A third card-mode set alongside the two duo Majors of 2026: **FNCS 2025 Major 1,
Europe**, played in **trios**. It gets its own tile on the mode screen, its own
tournament format, its own leaderboard theme, and cards built from the published
stage results the same way `m1` and `m2` are.

The set key is `t1`. The event is `S33_FNCSMajor1`.

Europe is the whole of the first pass. The six other regions come later, as their
leaderboard pages are captured; the code is shaped to take them without change.

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

Saved Fortnite Tracker pages carry Epic's own leaderboard payload in a
`var imp_leaderboard = {…}` assignment: every team, its rank, its total, a
`pointBreakdown` split by scoring rule, a `sessionHistory` with per-match
placement, eliminations and Victory Royale flags, and an `internal_Accounts`
map from account id to esports nickname and country code.

That payload is read by brace-matching from the assignment and parsed. **Nothing
is transcribed by hand**, which is what makes the 2026 sets expensive to extend
and easy to get wrong.

Two stages are available for Europe:

| Window | Teams | Matches |
|---|---|---|
| `S33_FNCSMajor1_PlayInStage_EU_cumulative` | 100 | 14–20 |
| `S33_FNCSMajor1_Final_EU_cumulative` | 33 | 11–12 |

300 distinct players, zero unresolved account ids.

There is no Last Chance leaderboard in hand, so the set is built from two stages
rather than three. This needs no special handling: `missedGfLcqBase` simply never
fires, and a Play-In player who missed the final takes the Play-In miss penalty.

Group Stage is not a card source in any set — `m1` and `m2` build from Play-In,
LCQ and Grand Finals — so having only Group 3 costs nothing.

### Shape

```
CARD_T1EU_PLAYIN_RAW / CARD_T1EU_GF_RAW
// [rank, points, matches, wins, avgElims, avgPlace, elimPts, player1, player2, player3]
```

Identical to the duo rows with one more name and one more measured column. The
extractor emits this from the payload; it is committed to `index.html` as
literal rows, the way every other set is, so the page stays a single file with
no fetch at runtime.

### Parsing

`m1Entry` becomes `rowEntry(r, opts)`:

- players come from the trailing string entries, so one function reads both duos
  and trios
- the field stays named `duo` — it is used as a plain array everywhere, and
  renaming it would touch fourteen shipped builders for no behavioural gain
- the elimination multiplier arrives per stage, not per file

### Elimination points are per stage: 2, 3, 4

Measured from `pointBreakdown.TEAM_ELIMS_STAT_INDEX:1`, which reports points
earned and eliminations achieved as separate totals:

| Stage | Elim points | Eliminations | Per elim |
|---|---|---|---|
| Play-In (cumulative) | 17,448 | 8,724 | **2** |
| Group Stage (Group 3) | 1,392 | 464 | **3** |
| Grand Finals | 5,024 | 1,256 | **4** |
| Divisional Cup, weeks 1–5 | ~1,750 each | ~585 each | 3 |

Exact integers, no rounding. This corrects an earlier reading of 3 taken from a
broadcast overlay of the Group Stage: that number was right for that stage and
wrong as a property of the season. The 2026 duo constant of 4 stays where it is.

### Endgame share is measured, not inferred

`endShare` — the attribute input separating players who score by surviving from
players who score by fragging — is currently inferred as
`(tpm − avgElims × KILL_MULT) / tpm`. With the real breakdown in hand it is
simply `(pointsEarned − elimPoints) / pointsEarned`, per team, per stage.

This also disposes of a trap. Group Stage totals carry a flat **+1000
advancement flag** for teams holding a Victory Royale — Group 3 shows exactly
five teams over 1000 and exactly five teams with a VR. Inferring `endShare` for
those teams would have returned about 0.93 and handed a fake-high Endgame rating
to precisely the players the format already rewarded. Reading the breakdown
avoids the question entirely.

### Known data quirks

- Play-In rank 80 (`syla!`) returns one account id instead of three. The row is
  kept, with the team recorded at the size Tracker reports; the extractor logs
  every team whose size is not three so none passes silently.
- 222 of 298 Play-In accounts carry a `countryCode`. The rest take their
  nationality from the saved Liquipedia Grand Finals page, matching the existing
  preference of Liquipedia over the team flag.

## Building the set

The fourteen existing per-region builders (`buildMajor1EU` … `buildMajor2OCE`) are
~340 lines each and differ in exactly ten values: three stage arrays, three event
names, three dates, three base-rating functions, region, `cardSet`, the
nationality and org maps, and the card key prefix.

Copying that for 2025 would be ~340 lines per region for no new behaviour. So 2025
gets one parameterised function, `buildCardSetRegion(cfg)`, called once for Europe
now and once per region later. It takes whichever stages it is given, so a
two-stage set is not a special case.

**The fourteen existing builders are left alone.** They are shipped and balanced;
rewriting them onto the new function risks silently shifting live card ratings.
Migrating them is worth doing later as its own commit, with a before/after rating
diff to prove nothing moved.

Rating rules are inherited unchanged: finalists are rebuilt from the Grand Finals,
everyone else keeps their qualifying-stage rating minus the flat miss penalty, and
`REGION_TOP` compresses the thin regions to a ceiling of 85 instead of clipping
them.

## Format

From Epic's published 2025 bracket for EU and NAC, confirmed against the data:

- **Play-In** — Division 1 only, 10 matches on each of two days, 99 advance
- **Group Stage** — three groups, five matches each, top 5 advance, a Victory
  Royale advances instantly
- **Last Chance** — an open qualifier for Divisions 1–3 feeding a Last Chance
  Lobby of 3 matches
- **Major Finals** — 33 teams, 6 matches on each of two days

The Group Stage data confirms the instant-advance rule outright: matches played
per team range from 1 to 5, because a team stops once it wins.

`majorFormat()` gains a branch on `cardSet`:

```js
// FNCS 2025, Europe
{ playInCut:99,
  heats:[{games:5,cut:5},{games:5,cut:5},{games:5,cut:5}],
  lclGames:3, lcqWinners:18, gfGames:12 }
```

Three things already line up and need no new code:

- `heatQualifiers()` seeds the advancing set with every team holding a VR and only
  then fills to `cut` on points — exactly the 2025 rule, written for 2026
- `simulateGamesStopOnWin()` already ends a team's group run at its first win
- the Grand Finals already simulate 12 games at 4 points per elimination, which
  is what 2025 ran

One new field is needed. Today the count of Last Chance qualifiers is taken from
`lclGames`, because in 2026 an *n*-game Lobby produced *n* winners. In 2025 the
Lobby ran 3 matches but the Grand Finals field is a measured 33, against 15 from
the groups. So `lcqWinners` becomes explicit, defaulting to `lclGames` where it is
absent — leaving 2026 untouched.

**Where 33 comes from is measured; how it splits is set to match.** The bracket
image implies 15 from the groups and 3 from Last Chance, which is 18, not 33. The
Groups 1–2 and Last Chance leaderboards are not in hand to settle it. Rather than
invent a qualification path, the field size is taken from the Grand Finals row
count and the Last Chance leg is set to make up the difference. If the missing
pages later show a different split, only `lcqWinners` changes.

`gfGames` is likewise made explicit rather than left as the literal 12 in the
call, so a future region with a shorter final does not need a code change.

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

- **The other six regions.** Their pages are not captured yet. The extractor and
  `buildCardSetRegion` both take a region as input, so adding one is data plus a
  call.
- **Chapter 6 map and landing zones.** `ZONE_SETS` has ~40 hand-placed zones per
  map; 2025 reuses the `m1` set until its own is drawn.
- **Chapter 6 loot pool.** Reuses `M1_WEAPON_POOL` and its consumables.
- **A LAN continuation.** `gfSlots` resolves to 0 for any set that is not `m1` or
  `m2`, so a 2025 run ends at its regional Grand Final with no Summit leg and no
  prize card. This is the existing fallback and needs no code.
- **The five Divisional Cup pages** now in the source folder. They are Division 1
  weeks 1–5, not part of the Major — but they are exactly the division cups career
  mode still lacks, so they are kept for that work.
- **Migrating the fourteen duo builders** onto `buildCardSetRegion`.

## How it gets verified

- Elimination points per stage are already confirmed as exact integers across all
  seven captured leaderboards.
- The extracted Grand Finals top three must read `vic0 + Veno + Flickzy`,
  `P1ng + Wox + Malibuca`, `Vanyak3kk + Pixie + MariusCOW` — which is what
  `M1_2025_EU_RANKED` in `index.html` already records, entered independently.
- Every extracted team is size 3, or logged by name if not.
- Card ratings for the Grand Finals top 3 must land inside the band `REGION_TOP`
  allows, with no card clipped at the 99 or 30 clamp.
- Run the mode end to end in a browser: 99 into three groups, 15 out, the Last
  Chance leg filling to a 33-team final, twelve games, and a champion.
- Confirm `m1` and `m2` card ratings are byte-identical before and after, since
  `rowEntry`, `KILL_MULT` and `majorFormat` were all touched.
