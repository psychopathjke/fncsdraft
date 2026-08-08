# FNCS Draft

Draft a squad of real Fortnite Champion Series players, then run the tournament
they actually played — play-in, heats, last chance, grand finals and the LAN.

**Live: [fncsdraft.com](https://fncsdraft.com/)** · English and Russian · no signup

---

## What it is

A single-page card drafting game built around real FNCS results. Every card is a
real player from a real tournament, and the number on it is derived from what
that player actually did that season — not from anything invented.

- **6 892 cards** across 62 tournaments, from Chapter 2 Season 5 through FNCS 2026 Major 2
- **7 regions** — Europe, NA Central, NA West, Brazil, Asia, Middle East, Oceania
- **76 achievements**, a card collection, run history and per-run grading
- Duo, trio and squad modes, a landing-spot picker with per-zone scoring, and a
  full tournament simulation with live standings

## Where the numbers come from

The interesting part of this project is not the game loop, it is that nothing on
a card is made up.

### Rating

A player's rating is their **whole season**, blended across every stage they
played, weighted by how much each result says:

| Stage | Weight | Field |
|---|---|---|
| Summit LAN (Major 1 only) | 3.0 | global |
| Grand Final | 2.0 | 50 duos |
| Heats | 0.9 | 50 duos per group |
| Play-In | 0.5 | 150 duos |
| Last Chance Qualifier | 0.4 | ~50 duos |
| Division 1 Cup, per week | 0.15 | 50 duos |

Each finish is mapped onto a 0–100 scale by a curve that accounts for the size of
the field, so 30th of 150 in a Play-In is not read as 30th of 50 in a final.

**Seasons never mix.** A Major 1 card is rated on Season 40 alone and a Major 2
card on Season 41 alone — different patches, different meta. Cards from earlier
years keep the result of their own event and nothing later touches them.

Inside a region the ladder is stretched so its best player lands on the region's
ceiling: 96 for Europe and NA Central, 85 elsewhere, where the field is thinner.

### Attributes

Six attributes, each a percentile of a published leaderboard column measured
against the players who were in that same lobby:

| | Reads |
|---|---|
| **AIM** | average eliminations per match |
| **END** | share of points earned by placement rather than kills |
| **SUR** | average placement |
| **CON** | points per match |
| **CLU** | Victory Royales per match |
| **EXP** | total FNCS matches played across every stage |

`END` is derived: eliminations are worth 4 points in FNCS 2026 duos, so the
published point total splits back into what was earned by fighting and what was
earned by surviving — an axis the standings never print directly.

Hovering an attribute on a card shows which column it came from.

## How it was built

Built AI-assisted, with Claude. The assistant wrote most of the code; the design
decisions behind the model are the part worth reading, and they were argued out
rather than generated:

- Attributes used to be partly invented — mechanics and game sense were seeded
  from the player's name, which was 38% of a card's overall. They were replaced
  with two columns the standings actually support.
- Ratings originally leaned on one event: a 6th place at the Summit LAN was 78%
  of a player's number. That is now spread across six stages.
- Season 40 and Season 41 were being blended together until the season IDs in the
  Epic event data made it obvious they were different metas.
- Region ceilings, tiebreaks and achievement thresholds were all calibrated
  against the real distribution rather than picked by feel.

Stack: HTML, CSS and vanilla JavaScript in one file. No framework, no build step.
Deployed on Netlify.

## Sources

Standings and player data from [Fortnite Tracker](https://fortnitetracker.com/),
[Liquipedia](https://liquipedia.net/fortnite/) and [Osirion](https://osirion.gg/).
Flags, orgs and nationalities cross-filled from the same.

Not affiliated with or endorsed by Epic Games. Portions of the materials used are
trademarks and/or copyrighted works of Epic Games, Inc.

## Running it

There is no build step. The whole game is one `index.html` plus its images.

```
git clone <this repo>
cd fncsdraftmajor
npx http-server -p 8080
```

Then open `http://127.0.0.1:8080`. Opening the file directly off disk works too,
though some browsers restrict local image loading.

## Layout

```
index.html        the game — markup, styles, data and logic
art/              mode covers and island maps
photos/           player portraits
logos/            organisation crests, resolved by club name
items/            weapon and heal icons for the loot packs
```
