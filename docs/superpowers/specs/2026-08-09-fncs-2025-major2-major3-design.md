# FNCS 2025 Major 2 and Major 3 — trio card sets

9 August 2026

## What this adds

Two more trio sets beside `t1`, finishing the 2025 season:

| Set | Event | Chapter | Tile |
|---|---|---|---|
| `t2` | `S34_FNCSMajor2` | Chapter 6, Season 2 | FNCS 2025 Major 2 |
| `t3` | `S36_FNCSMajor3` | Chapter 6, Season 4 | FNCS 2025 Major 3 |

All seven regions, trios, one tile each in the 2025 row beside Major 1. Each
carries its own island, its own loot pool, its own bracket and its own dates —
the three Majors were three different games and the mode should not pretend
otherwise.

The precedent is `2026-08-09-fncs-2025-trio-major-design.md`. Everything that
spec settled about trios — the row shape, `rowEntry`, `buildCardSetRegion`, the
rating rules, the miss penalty, `REGION_TOP` — is inherited unchanged and is not
re-argued here. This spec covers only what is new or measured differently.

## Data

`2025/fncs-2025-major2-major3.json` already holds all 42 leaderboards: seven
regions × Play-In / Last Chance Qualifier / Grand Finals × two Majors, harvested
in the same browser pass that produced Major 1's files and in the same row shape:

```
[rank, points, matches, wins, avgElims, avgPlace, elimPoints, p1, p2, p3]
```

Each entry also carries the Epic window id it came from, which is where the
event names above are read rather than assumed.

| | Major 2 (S34) | Major 3 (S36) |
|---|---|---|
| distinct players | 3 390 | 3 399 |
| country code from Tracker | 2 277 (67 %), 120 countries | 2 284 (67 %), 119 countries |
| Play-In / LCQ per region | 100 / 100 | 100 / 100 |
| Grand Finals field | 33 33 33 33 33 **30** 32 | 33 33 **32** 33 33 **32** 32 |

Nationality coverage lands where Major 1's did; the existing cross-fill lifts it
further once the sets are in the same page as the Liquipedia-verified handles.

### The elimination ladder is the season's, not Major 1's

Measured from `elimPoints ÷ (avgElims × matches)` over every team in every region:

| Stage | Major 1 | Major 2 | Major 3 |
|---|---|---|---|
| Last Chance Qualifier | 1 | **1** | **1** |
| Play-In | 2 | **2** | **2** |
| Grand Finals | 4 | **4** | **4** |

Not "close to" — a single distinct multiplier per stage across all seven regions
in both Majors, no exceptions. `T1_KILL` turns out to describe FNCS 2025 rather
than Major 1, so the three sets share it instead of each carrying a copy.

### Dates come from the payload

Major 1's stage dates are hand-typed and disagree with each other: the mode tile
says `янв — фев 2025` while `M1_2025_EU_DATE` says `апр 2025` and
`M2_2025_EU_DATE` says `июн 2025`. The leaderboard windows carry real start and
end timestamps, so all three sets take their stage dates from there, and Major
1's two hand-typed constants are corrected to match. This is a fix to shipped
text, not to any rating.

### Teams Tracker returns with fewer than three accounts

Eight in Major 2, six in Major 3, listed in full in the implementation plan. They
are kept at the size the source reports, exactly as Major 1's five are, and the
build logs every one so none passes unnoticed.

## Code shape

`buildCardSetRegion(cfg)` is already parameterised and needs no change. What is
currently per-Major-1 becomes per-set, keyed `t1 | t2 | t3`:

- `T1_RAW` → a table of three, holding each set's 21 raw row arrays
- `t1Base` → takes the set, because the bands read `REGION_TOP` per set
- `T1_STAGE_DATE` → per set, populated from the window timestamps
- `CARD_TRIOS_T1` → per set, so a Major 2 draft cannot deal a Major 1 trio
- `T1_KILL` stays one shared table, for the reason measured above

`majorFormat`, `cardSetName`, `MAP_ART`, `MAP_ASPECT`, `ZONE_SETS`, the weapon
and consumable pool getters, `MODE_THEME` and `modeThemeKey` each gain two
entries alongside their `t1` one. None of them gains a new branch shape.

The fourteen shipped duo builders stay untouched, for the same reason the last
spec left them alone.

## Rating: one ledger per Major

Each set gets its own `S34_LEDGER` / `S36_LEDGER`, built by generalising
`tools/build-2025-ledger.js` to take a season. Sources are that Major's own
stages for all seven regions plus Europe's Division 1 cup weeks.

Seasons never mix. A Major 2 card is rated on S34 alone and a Major 3 card on
S36 alone, which is the rule the whole project already runs on.

On disk today there is one Division 1 week per Major — `S34_..._Week1Final_EU`
and `S36_..._Week1Final_EU` — against Major 1's five. (Two saved files are the
same S34 Week 1 page; they are deduplicated by window id, not by filename.) The
rest are pulled in the same browser pass as the group stages below.

**The count is not padded to match Major 1.** These seasons ran fewer cup weeks
than Major 1's five — Major 3 ran two — so a shorter ledger is the season being
reported accurately, not a hole in the harvest. Each Major's ledger carries the
weeks Tracker actually returns for it and no placeholder for the ones it does
not.

## Bracket: harvested, not assumed

The JSON holds Play-In, LCQ and Grand Finals only. The group stage and Last
Chance Lobby — which is what decides how many teams come out of groups and how
many out of the Lobby — were never captured for these two Majors, and only one
group-stage page (Major 2, Europe, Session 1) is on disk.

So they get harvested from Tracker the same way Major 1's were: a browser tab,
same-origin `fetch` of every other window, payload brace-matched out of the
returned HTML. From those leaderboards the format is **counted**:

- how many teams each group sent to the final, per region
- how many groups a region ran
- how many matches each group played
- how many teams the Lobby actually advanced, per region

A finalist came through Last Chance if it appears in that region's Lobby carrying
the +1000 advancement flag. Everything else came out of a group. Roster matching
is not used to settle the leg — the last spec records why it over- and
under-counts in both directions.

`majorFormat()` then gains a `t2` and a `t3` branch carrying counted values, and
`LCQ_WINNERS_2025` gains a table per Major. The published field sizes above are
the check: groups plus Lobby must add up to 33, 30 or 32 in each region, and
running the real `seedHeats` / `simulateGamesStopOnWin` / `heatQualifiers` must
land on the same number.

If a region's group stage turns out to be unavailable on Tracker, that region
falls back to Major 1's shape for its group count and cut, and the fallback is
named in the code comment and in the sources note. It is not presented as
measured.

## Loot

Two new pools, from each season's competitive loot as published on the Fortnite
wiki — Chapter 6 Season 2 for Major 2, Chapter 6 Season 4 for Major 3. Same
structure as `T1_WEAPON_POOL` and `T1_CONSUMABLE_POOL`: every weapon across its
real rarity ladder, plus mobility, utility, healing and the season's mythics.

Item art is fetched by the existing `tools/fetch-chapter6-art.js` into `items/`
under a `t2-` and `t3-` prefix, and any item without art falls back to the
built-in silhouette, which is the behaviour already in place.

`activeWeaponPool()` and `activeConsumablePool()` return the new pools, and
`lootPoolSeasonName()` returns "Глава 6, сезон 2" and "Глава 6, сезон 4" so the
loot panel names the season it is showing.

## Islands and drop spots

Each Major is played on its own island. Map art is extracted from the Fortnite.GG
Map Evolution pages already in the source folder — `34.html` for Major 2 and
`36.html` for Major 3 — cropped to the island, the same treatment `33.html` got.

Landing rectangles are built per island with `tools/extract-zones.js` and
finished by hand where the detector cannot resolve a POI, which is how the 2025
grid was built.

### Zone value: more loot, more points

`ZONE_STATS` today has entries for `m1` and `m2` only. The 2025 island has none,
so `useLandingSet` leaves every 2025 zone at `points = 1` and the landing picker
currently decides nothing in Major 1. All three 2025 islands are rated in this
work.

The rule is loot volume: **a spot is worth what it drops.** For each rectangle,
count the chests and floor-loot spawns inside it on that season's loot map, and
rank the rectangles against the other rectangles on their own island — the same
within-island grading `useLandingSet` already applies, so no island is richer
than another merely because its numbers run higher. The count goes into
`ZONE_STATS` as `loot`, and `r` is the count's percentile within the island.

Chest data comes from the same Fortnite.GG map source as the art, read per
season. If a season's loot layer cannot be read, that island's zones stay
unrated at 1 point rather than take numbers from a neighbouring season — the
picker being flat is a smaller lie than a made-up rating.

`teams` and `surv`, which the `m1`/`m2` entries carry from published competitive
evals, have no 2025 equivalent and are left absent. `useLandingSet` already
defaults `teams` to 1 for a zone that lacks it.

## Theme, tiles and text

Two tiles in the 2025 row: `chooseMode(3, 'cards2025major2')` and
`chooseMode(3, 'cards2025major3')`, each with its season's date range, art and
subtitle, in both languages.

**The three Majors share one theme, because Epic gives them one palette.**
`t1`'s colours came from `imp_event.Colors` in Tracker's payload rather than
from anyone's eye, and the Major 2 and Major 3 Grand Finals pages carry that
same block byte for byte:

```
HighlightColor #FF0040   PrimaryColor #977EA5   BackgroundLeftColor #829FA9
BackgroundRightColor #FFFFFF   SecondaryColor #161616
```

What varies in the metadata is the stage, not the Major — a group-stage page
reads `#08E164`, a divisional cup `#9C0013`, in every season alike. So
`modeThemeKey()` returns `t1` for all three sets and `MODE_THEME` gains no new
entry. Inventing a per-Major accent would be picking a colour Epic did not use.

The tiles still tell the modes apart, because each carries its own season's art.

The sources note gains both Majors with the stages they actually contribute, and
the card and event counts in it are regenerated rather than edited by hand.

## Deliberately out of scope

- **A LAN continuation.** `gfSlots` resolves to 0 for any set that is not `m1` or
  `m2`, so a 2025 run ends at its regional Grand Final. Existing fallback, no code.
- **Prize tables** for the 2025 Majors.
- **Migrating the fourteen duo builders** onto `buildCardSetRegion`.
- **Liquipedia nationality enrichment** beyond Tracker's 67 % plus cross-fill.
- **The 2025 Global Championship** as a playable set. Its cards already exist in
  the pool; it is not a mode.

## How it gets verified

Before any code:

- elimination points per stage are exact in all seven regions of both Majors — done
- the Grand Finals field sizes above are read off the harvested tables — done
- every team not returned at size three is enumerated — done
- Division 1 cup pages are identified by window id, not filename — done

After building, headlessly:

- every pre-existing card is dumped before and after; ratings and rarities do not
  move. Any card that shifts must be explained by the experience tally widening,
  and proven so by patching the new stages out of it
- ratings top out at `REGION_TOP` in each region with nothing clipped at either
  clamp and no card above 99
- both brackets run through the real tournament functions in all seven regions
  and land on the published final field size
- the drafts deal only from their own Major's trios
- each set's loot panel shows its own season's pool

By playing it:

- one full run of each Major in a real browser: three-player packs, correct stage
  cards, a legible theme on every standings screen, a champion crowned
- every region whose final came in short — Middle East and Oceania in Major 2,
  NA West, Middle East and Oceania in Major 3. Whether that is a thin Last Chance
  route, as it was for Major 1's Middle East, is for the harvest to say
- the landing picker visibly rewards the loot-rich spots on all three islands
- a clean console across both runs
