# Alternating trio seasons — design

Status: approved 19 August 2026.
Project: `C:\Users\FoxOS_User\Desktop\fncsdraftmajor`.

## What it is

A career currently plays one year over and over: the measured 2026 FNCS calendar,
in duos, with the 2026 card pool. Seasons two and three are the same year again
with an older player on it.

This makes every other season a trio season. The calendar does not change, the
cards do not change, the events do not change — the Reload circuit, the Summit
and Antwerp all still happen, and all of them are played by three people instead
of two. Season 1 is duos, season 2 is trios, season 3 is duos again.

The point is that the year stops being the same year. A trio lobby is 33 teams
rather than 50, the room is a third smaller in teams at the same head count, and
the seat next to you becomes two seats to fill and two people to keep.

## What this is not

It is not the 2025 calendar. That year's schedule was measured on 19 August 2026
and sits in `CAREER_YEAR_2025` / `CC_CUP_WEEKS_2025`, but nothing reads it and
nothing in this design will. It stays as reference data: a trio year built on the
2026 calendar was the choice, because one calendar and one card pool is a smaller
and more honest thing to maintain than two of each.

## The one invented number, named up front

A trio 2026 season did not happen. Everywhere it can, this design pays measured
money: the trio prize tables Epic published for 2025 are already in the file as
`P2025_PRIZES` (reached through `PRIZE_TABLES_2025`), and Lyon's own 33-place
purse is `GC2025_PRIZES`.

Two events have no measured trio purse anywhere, because they have never been
played in trios by anyone: the **Reload Elite Series** and the **Major 1 Summit**.
Their own 2026 duo purse is kept and paid out over a trio-sized field. That is the
mode's invention and it is labelled as one in the code, the same way the manager
terms spread is labelled. No other number in a trio season is invented.

## Squad size is a property of the season

`careerSquadSize()` reads `cr.size`, written once when a season starts and never
recomputed. It is stored rather than derived from the season number because a
derived rule would re-shape a season somebody is halfway through the moment the
rule is edited — the same reason agreed agent terms live on the contract rather
than being looked up.

- `careerNewSeason()` sets `cr.size = (cr.season % 2) ? 2 : 3`.
- A save from before this change has no `cr.size`. A migration writes `2`, beside
  `careerMigrateMoney`, `careerMigrateOrg` and `careerMigrateClock`.
- The nine career runners replace `CARD_MODE=true; squadSize=2; drafted=[me, mate];`
  with `squadSize=careerSquadSize(); drafted=[me, ...careerMates()];`.

## Two seats instead of one

`CAREER.partner` becomes `CAREER.partners`, a list of nought to two records, each
carrying what the single record carries today: `handle`, `cardRegion`, `patience`,
`since`, `dev`, and an optional cached `card`.

- `careerMates()` returns the filled cards, in slot order.
- `careerPartnerCard()` stays, and returns the first mate. Around forty call sites
  read it and most of them mean "the person I play with" in a context where one
  is the answer; they keep working. The call sites that mean "everyone I play
  with" — the runners, the LAN seat lock, the squad display — move to
  `careerMates()`.
- Migration: an existing `CAREER.partner` becomes `partners[0]`.

### Chemistry reads the newest member

`careerChem()` today measures the days since `partner.since`. For a trio it takes
the **shortest** of the members' times, not the average: a trio is played in as
far as its newest member. An average would let an old partnership cover for
somebody who joined last week, and the lobby does not work that way.

`CC_CHEM_DAYS` and `CC_CHEM_MAX` are unchanged.

### The inbox fills every empty seat

`careerSeatTopUp()` and `careerSeatDms()` already write `CC_SEAT_DMS` letters when
the seat is empty. They gain a loop over empty slots, so a trio with one seat open
hears from people about that seat, and a trio with two open hears about both.
Accepting a letter fills the first empty slot.

### Poaching takes a person, not a squad

`careerMatePoach()` names one member and removes that member. The other stays.

### The LAN seat lock holds the whole squad

`careerSlotHeld()` and `careerSlotGiveUp()` are unchanged in meaning and now apply
to the trio: break the squad while it holds a seat and the seat rolls down to the
next trio entire, because a qualification belongs to the team that won it.

### Growth reads the better of the two

`careerMateFactor()` today reads the gap between you and your partner. For a trio
it reads the gap to the **strongest** member rather than summing or averaging both.
Summing would hand a trio a faster arc than a duo for arithmetic reasons rather
than for anything that happened in a lobby.

## Fields

`TEAM_TARGET={2:50, 3:33, 4:25}` already exists and most of the simulation reads
`TEAM_TARGET[squadSize]` on its own, so the lobby maths largely follows for free.

What is written as a duo number and needs a trio counterpart:

| Constant | Duos | Trios | Why |
|---|---|---|---|
| Major Final field | 50 | 33 | a trio final is 33 teams |
| `CAREER_CUP_FIELD` | 150 | 100 | same head count, a third fewer teams |
| `CAREER_CUP_CUT` | 50 | 33 | the cut scales with the field |
| `CC_GLOB_FIELD` | 50 | 33 | Antwerp on the Lyon shape |

Read through one accessor per number rather than by editing the constants, so a
duo season is untouched.

## Prizes

`prizeTableFor()` gains a squad-size branch ahead of its existing `CARD_SET`
branches: in a trio season, a regional table resolves to `P2025_PRIZES[region]`
and the Global Championship resolves to `GC2025_PRIZES`.

The Reload Elite Series and the Summit keep their 2026 tables — the invention
named above — paid over the trio field.

`ccShareOf()` divides a team prize by the number of people in the team; it reads
the team, so a trio takes a third where a duo takes a half, with no change.

## What carries across the boundary

Everything a career is: rating, money, club, agent, followers, division, the log,
the trophy case. The season boundary already carries them and already clears what
a year owns. The only additions are `cr.size` and, on a duo-to-trio boundary, a
second seat that starts empty and is filled through the inbox like any other.

## Order of work

1. `careerSquadSize()`, `cr.size` on the season boundary, the migration, and the
   nine runners. Nothing visibly changes yet: a duo season still resolves to 2.
2. `CAREER.partners`, `careerMates()`, the migration from `CAREER.partner`.
3. Chemistry, the inbox, poaching, the seat lock, `careerMateFactor`.
4. Fields and prize tables.
5. The hub and the calendar strip: a trio season has to say it is one, and the
   squad panel has to draw three chairs.

Each step ends with the existing harnesses green — `check-career-year`,
`check-career-major`, `check-career-summit`, `check-career-globals`,
`check-career-gclc`, `check-career-seat`, `check-career-seat-keeps` — plus a new
`check-career-trio` that plays a trio season end to end and asserts the field
sizes, the purse source and the two-seat inbox.

## Testing

- A duo season after the change must be byte-identical in behaviour to one
  before it. `cr.size` of 2 is the whole of the duo path.
- A trio season: 33 teams in a Major Final, 100 in a divisional cup, a purse read
  off `P2025_PRIZES`, Antwerp off `GC2025_PRIZES`, and a third of a team prize
  reaching the player.
- Chemistry with one member of three months and one of three days reads as three
  days.
- Losing one member of a trio that holds a LAN seat forfeits the seat.
- An old save loads as a duo season with its partner in slot 0.
