# FNCS 2025 Major — trio card set

9 August 2026

## What this adds

A third card-mode set alongside the two duo Majors of 2026: one Major of the 2025
season, played in **trios**, across all seven regions. It gets its own tile on the
mode screen, its own tournament format, its own leaderboard theme, and cards built
from the published stage results the same way `m1` and `m2` are.

The set key is `t1`.

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

### Shape

Per region, three stages, one array each:

```
CARD_T1EU_PLAYIN_RAW / CARD_T1EU_LCQ_RAW / CARD_T1EU_GF_RAW
CARD_T1NAC_… CARD_T1NAW_… CARD_T1BR_… CARD_T1OCE_… CARD_T1ASIA_… CARD_T1ME_…

// [rank, points, matches, wins, avgElims, avgPlace, player1, player2, player3]
```

Identical to the duo rows with one more name on the end. Sourced the same way as
2026: Fortnite Tracker for the leaderboards, Liquipedia for per-player nationality
with the team flag as fallback.

### Parsing

`m1Entry` becomes `rowEntry(r, killMult)`:

- players come from `r.slice(6)` instead of `r[6], r[7]`, so one function reads
  both duos and trios
- the field stays named `duo` — it is used as a plain array everywhere, and
  renaming it would touch fourteen shipped builders for no behavioural gain
- `killMult` is a parameter; existing call sites pass 4

`_T1P_EU = CARD_T1EU_PLAYIN_RAW.map(r => rowEntry(r, 3))`, and so on.

### Elimination multiplier: 3

Derived from the broadcast standings overlay for Major 1 Group 1, NA Central,
which prints `PTS`, `PLCMNT PTS` and `ELIMS` as separate columns:

| Team | PTS | PLCMNT | Δ | ELIMS | Δ / elim |
|---|---|---|---|---|---|
| ZEUSP + HYBRID KRREÓN + TONYFV | 1102 | 1021 | 81 | 27 | 3 |
| DONIEE + EGY MASON + FT CHANNCE SLAM | 1090 | 1039 | 51 | 17 | 3 |
| KICKZ 13 + LEVEL ONE CROOK + I.LOVE.TOTTENHAM | 1033 | 1000 | 33 | 11 | 3 |
| SEEK HELP + GMONSTER + WTJ OSYDD 86 | 1027 | 1000 | 27 | 9 | 3 |
| XSET CLIX + 2AM BATMAN BUGHA + ELITE EOMZO | 272 | 167 | 105 | 35 | 3 |
| VISXALS + TWITCH BRAYDZ + AMINISHED | 272 | 176 | 96 | 32 | 3 |
| SHADOW1X + FT CURVE + SMT NVTYLERH | 207 | 147 | 60 | 20 | 3 |
| PL DEATH + 1TA SAILS + ENCRYPTED | 183 | 117 | 66 | 22 | 3 |
| GZKE AIDENKBM + HOUND IWNL + 2AM HIGHR | 172 | 130 | 42 | 14 | 3 |

Nine rows out of nine. An elimination is worth 3 in FNCS 2025 trios, against 4 in
2026 duos.

### The +1000 advancement flag

The same overlay shows placement points of 1000, 1000, 1021 and 1039 for the four
teams holding a Victory Royale, against 167 for the fifth-placed team. That is not
placement scoring — it is a flat +1000 that lifts a qualified team above the rest
of the group.

This matters because `endShare` — the attribute input that separates players who
score by surviving from players who score by fragging — is currently inferred as
`(tpm - avgElims × KILL_MULT) / tpm`. Applied to a VR team in 2025 that yields
about 0.93 and hands them a fake-high Endgame rating.

**Rule:** where a source prints placement points as their own column, `endShare`
is taken as `plcmntPts / pts` with the 1000 subtracted first. Where it does not,
the formula stands. This is the evidence-over-invention rule the balance work
already runs on: fix what the data measures, not what a formula guesses.

## Building the set

The fourteen existing per-region builders (`buildMajor1EU` … `buildMajor2OCE`) are
~340 lines each and differ in exactly ten values: three stage arrays, three event
names, three dates, three base-rating functions, region, `cardSet`, the
nationality and org maps, and the card key prefix.

Adding seven more copies for 2025 would be roughly 2,400 lines of duplication. So
2025 gets one parameterised function instead:

```js
buildCardSetRegion({
  set:'t1', region:'EU', keyPrefix:'_t1', teams:CARD_TRIOS_T1,
  stages:{ Playin:{rows:_T1P_EU, event:CARD_T1EU_PLAYIN_EVENT,
                   date:CARD_T1EU_PLAYIN_DATE, base:t1PlayinBase},
           Lcq:   {rows:_T1L_EU, event:CARD_T1EU_LCQ_EVENT,
                   date:CARD_T1EU_LCQ_DATE,    base:t1LcqBase},
           Gf:    {rows:_T1G_EU, event:CARD_T1EU_GF_EVENT,
                   date:CARD_T1EU_GF_DATE,     base:t1GfBase} },
  natLiqui:T1_NAT_LIQUI, natTrn:T1_NAT_TRN, org:T1_ORG
})
```

called seven times.

**The fourteen existing builders are left alone.** They are shipped and balanced;
rewriting them onto the new function risks silently shifting live card ratings.
Migrating them is worth doing later as its own commit, with a before/after rating
diff to prove nothing moved.

Rating rules are inherited unchanged: finalists are rebuilt from the Grand Finals,
everyone else keeps their qualifying-stage rating minus the flat miss penalty, and
`REGION_TOP` compresses the thin regions to a ceiling of 85 instead of clipping
them.

## Format

From Epic's published 2025 bracket, EU and NAC:

- **Play-In** — Division 1 only, 10 matches on each of two days, 99 advance
- **Group Stage** — three groups of 33, five matches each, top 5 advance, a
  Victory Royale advances instantly
- **Last Chance** — an open qualifier for Divisions 1–3 feeding a Last Chance
  Lobby of 3 matches, 3 advance
- **Major Finals** — 6 matches on each of two days

`majorFormat()` gains a branch on `cardSet`:

```js
// FNCS 2025, EU and NAC
{ playInCut:99, heats:[{games:5,cut:5},{games:5,cut:5},{games:5,cut:5}], lclGames:3 }
```

Three things already line up and need no new code:

- `heatQualifiers()` seeds the advancing set with every team holding a VR and only
  then fills to `cut` on points — exactly the 2025 instant-advance rule, written
  for 2026
- `simulateGamesStopOnWin()` already stops a team's group run at its first win
- `lclGames` doubles as the number of Last Chance winners, and 2025 ran 3 matches
  producing 3 qualifiers

The published bracket covers EU and NAC only. The other five regions ran a smaller
format, as they did in 2026; their branch is written from their own stage results.

**Grand Finals field size is read from the data, not hardcoded.** The bracket
image implies a 33-team final while the group stage sends 15 and Last Chance sends
3. Rather than guess which leg makes up the difference, the field is the row count
of the Grand Finals leaderboard, and the qualifying legs are set to sum to it.

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
  prize card. This is the existing fallback and needs no code; prize tables and
  Global Championship allocations for 2025 come later.
- **Migrating the fourteen duo builders** onto `buildCardSetRegion`.

## How it gets verified

- The elimination multiplier is already confirmed against nine published rows.
- Rebuild the broadcast Group 1 standings from the parsed rows and check the
  points, placement points and elimination columns reproduce exactly.
- Card ratings for the Grand Finals top 3 in each region must land inside the band
  `REGION_TOP` allows, with no card clipped at the 99 or 30 clamp.
- Run the mode end to end in a browser for at least EU and NAC: 99 into three
  groups, 15 out, 3 from Last Chance, the finals field matching the source row
  count, and a champion.
- Confirm `m1` and `m2` card ratings are byte-identical before and after, since
  `rowEntry` and `KILL_MULT` were touched.
