# Realistic simulation — design

**Date:** 2026-08-12
**Status:** awaiting review

## What this is

Every Major currently plays one way: you draft a squad out of loose player
cards, and the other forty-nine teams are assembled from whoever is left in the
pool. Nobody in that lobby is a team that ever existed.

This adds a second way to play the same Majors, chosen before anything else:

- **Realistic simulation** — you pick one of the Major's real duos (or trios).
  Its roster is fixed; you cannot swap a teammate. Every other team in the
  lobby is also its own real roster. Then loot, then the tournament as usual.
- **Draft simulation** — exactly what the app does today. Unchanged.

The name is the promise: a lobby where everybody plays with the people they
actually played with.

## Why it is affordable

The real rosters are already in the app. Every card set is built from rows that
are real teams with real results:

```js
[1,1071,21,3,12.81,16.9,"Focus","Th0masHD"],            // 2026, duo
[1,1054,19,3,14.37,13.95,546,"Tjino","PabloWingu","Fredoxie"],  // 2025, trio
```

The draft mode takes those rows apart into individual cards. Realistic mode
stops taking them apart. No new data, no new scraping.

Measured on the live app, Major 2 · Europe:

| | |
|---|---|
| rows across Play-In, LCQ and Grand Finals | 250 |
| unique duos among them | 179 |
| duos appearing on more than one stage | 66 |
| duos whose every member is in the mode pool | 179 — all of them |

## The four pieces

### 1. Mode choice, on the preview screen

`#screen-preregion` is the screen between picking a Major and drafting: region
filter, era filter, map filter, start button. Two themed buttons go at the top
of it, above the region choice, because the mode decides what the rest of the
screen means.

State: one global, `REALISTIC`, set here and read in three places. It is not a
new set of mode cards — eight Majors would become sixteen tiles for one bit of
information.

### 2. The duo list, in place of the player pack

The draft screen keeps its shape. The `PLAYER PACK` block is replaced by a
scrolling list of the Major's real teams, drawn as the same cards the pack
uses, so a team is two (or three) cards side by side.

**Order: by card rating, highest first.** Checked against live data — the real
Major 2 EU winner lands at the top and the list runs 96 down to 62:

```
96  Sky & Scroll            [GF #1]  732 pts     <- the team that actually won
95  Shxrk & t3eny           [GF #2]  574 pts
95  SwizzY & Pixie          [GF #3]  498 pts
95  Cr1nge & Twi            [GF #6]  420 pts
...
63  Triix & Snak            [LCQ #48]  0 pts
62  flamê 8! & paky 21!     [LCQ #49]  0 pts
```

Rules the data forced:

- **One row per roster.** 66 of the 179 duos appear on two or three stages. A
  team is listed once, under its strongest showing (Grand Finals over LCQ over
  Play-In). Listing each appearance would double a third of the list and lie
  about how many teams there are.
- **The stage and rank are printed beside the rating.** Rating is computed per
  player, so a pair's average does not always follow its finish — `Cr1nge & Twi`
  at GF #6 sits above `Shxrk & t3eny` at GF #2. Showing the finish makes that
  visible instead of looking like a sorting bug.
- **A team with a member missing from the pool is not listed**, and the count of
  those is printed on the screen. For Major 2 EU with no era filter that count is
  zero — every duo is whole — but a narrower filter can strand a player, and the
  rule is what stops an assembled team being served under a name that promises
  otherwise. An earlier draft of this spec claimed 1 of 179 was incomplete; that
  came from a one-off browser session whose pool was a player short, and two
  independent headless runs since put it at 179 of 179.
- Search by handle; region comes from the filter already on the preview screen.

Picking a team fills `drafted` with its roster. That is what keeps the change
small: everything downstream — `teamLabel()`, `buildTeam()`, `you.squad`,
scoring, the replay — reads `drafted` and needs no change at all.

### 3. Loot, unchanged

The weapon and heal rounds run exactly as they do now: `squadSize` rounds, one
weapon and one heal each. In realistic mode `roundPlayerPicked` is satisfied on
entry, so `maybeAdvanceRound()` is untouched.

### 4. The field

Five call sites read `const field=[you]; fillFieldTeams(avail, 49, squadSize, field)`.
Realistic mode calls a sibling that returns real rosters instead of assembled
ones, minus the team the player took.

**The field is seeded once, from the Play-In roster set, and carries through
every stage.** Using each stage's own real rows would mean the qualification
already happened — and the qualification is the thing being simulated.

Where the real field is short of `TEAM_TARGET`, the remainder is filled the way
it is filled today, and the number filled is logged.

## What gets worse

Card ratings are derived from the results of the very teams being simulated, so
the real favourite is nearly always the strongest team on the board. A realistic
run will be markedly more predictable than a drafted one. For a mode with this
name that is arguably the point, but it is a real change in how a run feels and
it should not arrive as a surprise.

## Checks

- The realistic field contains only real rosters — no assembled team, unless the
  field was short, in which case the count matches the log.
- The player's team appears once and is not duplicated among the opponents.
- Field size still equals `TEAM_TARGET[squadSize]`.
- The list is ordered by rating descending and contains no roster twice.
- A team with an incomplete roster is absent from the list and counted on screen.
- Both locales have every new key (`check-i18n`).
- **Draft mode is byte-for-byte unchanged in behaviour** — a regression test, not
  an afterthought: this feature's whole risk is breaking the mode that works.

## Not in scope

- New tournaments, regions or data.
- Changing how ratings or team power are computed.
- Realistic mode for ALL FNCS or the career mode.
