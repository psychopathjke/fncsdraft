# EWC Reload Elite Series — four cups, a mode of their own

13 August 2026

## What this adds

A second circuit beside FNCS: the Reload Elite Series, the European road to the
Esports World Cup. Four cups, duos, one region, played on the Reload island —
its own row of tiles, its own card sets, its own bracket, its own scoring.

| Set | Cup | Source |
|---|---|---|
| `r1` | Reload Elite Series 1 | Fortnite Tracker, seven saved stage pages |
| `r2` | Reload Elite Series 2 | Fortnite Tracker, seven saved stage pages |
| `r3` | Reload Elite Series 3 | Fortnite Tracker, seven saved stage pages |
| `r4` | Reload Elite Series 4 | the series' own site, eleven screenshots |

The precedent is `2026-08-09-fncs-2025-major2-major3-design.md`. Everything it
settled about a card set — `rowEntry`, the percentile attributes, the miss
penalty, the rating bands — is inherited and not re-argued. What is new is that
this circuit is not FNCS: a different bracket, a different points table, a
different island and a different number of stages.

## Where the data comes from

FNCS 2025 came out of Epic's own JSON. This circuit has no payload — what exists
is what Tracker rendered, saved as HTML — so `tools/build-ewc-rows.js` reads the
rendered leaderboard. Everything it takes is printed on the page: rank, points,
matches, wins, average eliminations, average place, both handles, their orgs and
the flags Tracker puts beside them.

Measured over the twenty-one saved pages:

| | cup 1 | cup 2 | cup 3 |
|---|---|---|---|
| Opens | 100 teams, 12 games | 100, 24 | 100, 24 |
| Play-Ins | 100 teams, 23 games | 100, 24 | 100, 24 |
| Heats 1-4 | 19/20/19/20, 8 games | 20/19/20/20, 8 | 20/20/20/20, 8 |
| Finals | 20 teams, 8 games | 20, 8 | 20, 8 |

897 rows in all, 440 handles carrying a nationality flag (60%, where the 2025
sets' payload gave 67%) and 225 carrying an org. Opens and Play-Ins are Tracker's
top 100, not the whole field — the pages say so themselves and the mode should
not pretend the qualifier was a hundred teams deep.

Heat lobbies of 19 are the source's own: a team that did not turn up is absent
rather than blank, exactly as the 2025 sets' short trios are kept short.

## The bracket, counted rather than read

Every stage was matched against the next by duo, not taken off a bracket page:

- **Opens → Play-Ins**: 26, 32 and 35 of the top hundred come through, seeded as
  deep as rank 100. The Opens are a wide funnel, and where its teams land in the
  Play-Ins says the cut is not a clean top-N of the hundred Tracker shows.
- **Play-Ins → Heats**: the four heats are disjoint — nobody plays two — and
  together they hold 80 teams, seeded no deeper than rank 80. **The top 80 of the
  Play-Ins go through, split four ways.**
- **Heats → Finals**: exactly 5 from each heat, and never a rank below 5.
  **Top 5 of each heat, 20 in the final.**

So the mode's own bracket is: Play-Ins → four heats of 20, eight games each,
top 5 → Final of 20, eight games. The Opens sit before it as the open qualifier
they were.

## Scoring is the circuit's, and it changed between cups

Read off each cup's own page rather than assumed:

| | Victory Royale | 2nd | 3rd | 4th-5th | 6th-12th | 13th-15th | elimination |
|---|---|---|---|---|---|---|---|
| cup 1 | 10 | 8 | 6 | 4 | 4 | — | 3 |
| cups 2, 3 | 10 | 5 | 5 | 5 | 3 | 3 | 3 |

Three a kill throughout, which is what lets the elimination half of a score be
split back out of the total the way `rowEntry` wants it. Cup 1 pays a steeper
podium and stops paying at 12th; cups 2 and 3 pay flatter and further down.

## Cup 4 has no Tracker pages

Eleven screenshots of the series' own site instead: Heats 1-4 and the Finals,
twenty teams each, with points, matches, wins and eliminations, and the finals
drop map. No Opens, no Play-Ins, and no average place — the site does not print
one. So `r4` is built from the heats and the final only, and its cards say so:
a card whose deepest stage is a heat is rated as a heat card, and nothing
invents the two stages the screenshots do not carry.

## The island

Reload is not the Battle Royale island, so the mode carries its own map art and
its own landing grid. The source is the same kind of picture the 2025 sets' grids
came from — the series' published drop map for that cup, one per cup, with every
team's box drawn on it — which is what lets the rectangles be percentages of the
picture rather than a fitting exercise. Cups 1-3 have theirs as `map1-3.jpg`;
cup 4's is a screenshot of the same map with the site's chrome around it.

## What is deliberately not in this pass

- **Career.** The circuit is a mode, not a ladder. Career's division cups stay
  FNCS.
- **Regions.** Every page is Europe. The region picker does not open for this
  mode rather than offering six empty ones.
- **Dates.** Only cup 4's screenshots carry any (heats 26.06, finals 28.06), and
  a tile that says a date it guessed is worse than a tile that says the season
  the source names: CH7 S3.
