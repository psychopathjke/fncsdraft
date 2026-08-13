# EWC Reload Elite Series — four cups, a mode of their own

13 August 2026

## What this adds

A second circuit beside FNCS: the Reload Elite Series, the European road to the
Esports World Cup. Four cups, duos, one region, played on the Reload island —
its own row of tiles, its own card sets, its own bracket, its own scoring.

| Set | Cup | Played | Source |
|---|---|---|---|
| `r1` | Reload Elite Series 1 | heats 1 Feb, final 7 Feb 2026 | Fortnite Tracker, seven saved stage pages |
| `r2` | Reload Elite Series 2 | heats 27 Feb, final 1 Mar 2026 | Fortnite Tracker, seven saved stage pages |
| `r3` | Reload Elite Series 3 | final 17 May 2026 | Fortnite Tracker, seven saved stage pages |
| `r4` | Reload Elite Series 4 | Opens 12/14 Jun, Play-Ins 19/21 Jun, heats 26 Jun, final 28 Jun 2026 | Epic's own leaderboard payload |

The precedent is `2026-08-09-fncs-2025-major2-major3-design.md`. Everything it
settled about a card set — `rowEntry`, the percentile attributes, the miss
penalty, the rating bands — is inherited and not re-argued. What is new is that
this circuit is not FNCS: a different bracket, a different points table, a
different island and a different number of stages.

## Where the data comes from

Two sources, because no single one covers the circuit. Epic's own payload is
still being served for cup 4 and is read straight (see below); for the first
three cups Epic has dropped everything but a ranking, and what exists is what
Tracker rendered, saved as HTML. So `tools/build-ewc-rows.js` reads both and
prefers the payload wherever it has a match log behind it. Everything the
Tracker reader takes is printed on the page: rank, points, matches, wins,
average eliminations, average place, both handles, their orgs and the flags.

Measured over the twenty-one saved pages:

| | cup 1 | cup 2 | cup 3 |
|---|---|---|---|
| Opens | 100 teams, 12 games | 100, 24 | 100, 24 |
| Play-Ins | 100 teams, 23 games | 100, 24 | 100, 24 |
| Heats 1-4 | 19/20/19/20, 8 games | 20/19/20/20, 8 | 20/20/20/20, 8 |
| Finals | 20 teams, 8 games | 20, 8 | 20, 8 |

1097 rows in all across the four cups, 642 handles carrying a nationality — 60%
of the seats Tracker rendered, and every seat of cup 4 — and 225 carrying an
org. Opens and Play-Ins are the top 100, not the whole field: that is all
Tracker shows, and cup 4's fuller field is cut to match rather than making one
cup a different shape from the other three.

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

## Cup 4 is not on Tracker, and did not need to be

Tracker does not carry the fourth cup under any name: thirty event ids were
tried across three seasons and every one came back 404, and the only other
Reload event it knows is the Championship in Riyadh on 18 August. What it does
carry is a dead end, not a missing page.

The circuit's own site, eucompetitive.com, proxies **Epic's leaderboard service
unchanged** — the same payload shape the FNCS 2025 harvest read. So `r4` is
built from the source rather than from a rendering of it, by
`tools/fetch-ewc.js`, and it is the best data in the mode: every match of every
team, the elimination points as a published column rather than an inference,
and a nationality on every seat.

| stage | teams | note |
|---|---|---|
| Opens | — | Epic returns nothing for either Opens window |
| Play-Ins | **1936** | both days, **added up** |
| Heats 1-4 | 20 each | 8 games |
| Final | 20 | 8 games |

A Play-In runs over two days and, as in FNCS, the two days **add up** — points,
matches, wins and eliminations — rather than the better one counting. The
measurement says the same: summed, cup 4's Play-In teams have played 17 to 24
games each, which is where Tracker's own Play-In rows put the first three cups
(14-24). Taking the better day alone would have read 12, and would have rated
the whole stage as if it were half a tournament. Averages are recomputed from
the totals, not averaged with each other, so a three-game day does not weigh
the same as a twelve-game one.

Epic's payload spells a handle the way the player typed it, in capitals, while
Tracker prints the spelling the scene uses. 126 handles were spelled both ways
across the circuit; each is normalised to the spelling that is not a shout, so
the same person is not one card in cup 1 and a louder one in cup 4.

**Checked against what a human saw:** six rows across three heats — points,
matches, wins, total eliminations and both handles — read off the screenshots of
the site and compared with the payload. None disagree.

The same payload was asked for the first three cups too. Epic keeps the ranking
of an old window long after it drops the match log behind it: those three finals
come back as twenty teams with no sessions, no points and no handles. A row with
no match in it is not a result, so cups 1-3 stay on the Tracker pages, and the
builder refuses those shells rather than letting them overwrite good rows.

Cup 4's Play-Ins are cut to the top 100 for the card set, which is the shape
Tracker gives the other three cups. The cut is printed by the builder and the
whole harvest stays on disk.

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
- **Nothing dated by hand.** Every date in the table above is the window's own
  `beginTime` — cup 4's from the calendar the site reads, cups 1-3 from the
  event payload behind their Tracker pages. No tile carries a guessed date.
