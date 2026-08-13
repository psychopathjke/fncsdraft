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

## Scoring: the same table said twice

The official rules print what a placing is worth outright. The leaderboard
prints the steps it is built from — "Reach Top 5: +5" — and they add up to each
other exactly, which is how the two were reconciled rather than one of them
being picked:

| finish | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th | 11th | 12th | 13th | 14th | 15th |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cup 1 | 60 | 50 | 42 | 36 | 32 | 28 | 24 | 20 | 16 | 12 | 8 | 4 | — | — | — |
| cups 2-4 | 60 | 50 | 45 | 40 | 35 | 30 | 27 | 24 | 21 | 18 | 15 | 12 | 9 | 6 | 3 |

Nothing past the end of a row scores. Cup 1 paid a steeper podium and stopped
at twelfth; the three after it pay flatter and further down. Cup 4 has no
Tracker page, so its table was derived from Epic's own `pointBreakdown` — the
same numbers, off 2314 counted eliminations and every placement in the cup.

**A kill is worth 2 in the Opens and the Play-Ins and 3 in the Heats and the
Final.** Attachment A of the rules says so and the payload measures out to it.
That rate is what splits a published score back into the half a team earned by
surviving and the half it earned by fragging, which is an axis the cards are
built on — so a Play-In card reads 95% placement and a Final card 59%.

FNCS is untouched by any of this: the table and the rates are picked by card
set, and the whole card dump comes out identical — 15191 cards, 0 moved.

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

## The islands, and what a lobby seats

The circuit played two islands: cups 1 and 2 on the green Chapter 7 Season 3
Reload island, cups 3 and 4 on the frozen one. What ships is the **season map**,
plain — the app draws its own lobby over the map, and a picture with another
tournament's duos printed across it is a picture of a different event.

The rectangles were still measured on the drop maps, because that is where the
spots are marked: `tools/extract-zones.js` reads a box off its borders, and
`tools/align-zones.js` moves the result onto the clean map by framing both
pictures on the island's own bounding box. Checked over the clean map by eye —
the boxes sit on Steamy Stacks, Boomin Base, Logjam Logging, Dirty Docks, Fort
Crumpet, Stilt Town and Lockdown Lighthouse; and on Hostile Hold, Top Tier
Training, Chiseled Cubes, Elite Experiments and Elite Armory.

15, 13, 14 and 12 rectangles. The detector only finds a box drawn as an outline,
so the translucent ones over the hot POIs are still missing, and a box found
inside a bigger one is dropped in favour of the bigger — the spot a team
actually calls. No `ZONE_STATS`: the published evals cover the Battle Royale
islands and the wiki loot counts cover Chapter 6, and nothing counts loot on a
Reload island, so every spot is worth one point rather than an invented number.

**A Victory Royale is not a ticket here.** FNCS ends a team's night on a
win — take the game and you are through, whatever the table says. This circuit
has no such rule: a heat is eight games for everybody and only the top five on
points come out, so a win is 60 points and nothing more. Both rules now live
behind one format flag, and tools/check-ewc-heats.js runs a heat under each to
make sure neither circuit borrows the other's: measured, a Reload heat plays
8 games for all twenty teams and its winners outside the five stay outside,
while a FNCS heat still stops on a win and sends every winner through.

**A Reload match seats twenty.** The bracket above is what `R_FORMAT` now says:
the Play-In runs in lobbies of twenty and sends its top eighty into four heats
of twenty, each heat is eight games and only its top five come out, and the
final is those twenty over eight games. A stage played in a fifty-duo lobby
would score every placement in the cup wrong. There is no last chance either —
FNCS hands its Play-In dropouts a Lobby, this circuit does not, so missing the
eighty ends the run rather than inventing a stage the cup never played.

## The Championship, and how the circuit ends

The four cups are qualifiers. The circuit ends at the **Reload Elite Series
Championship** at the Esports World Cup in Riyadh, on Epic's own event
`epicgames_Escargo_Official`, four days, **18-21 August 2026** — which has not
been played yet.

**Who goes, off the official rules:** advancement is decided by each Qualifier's
Finals leaderboard — EU 1st, 2nd and 3rd; NAC 1st and 2nd; one team each from
OCE, ASIA, ME, BR and NAW. Ten a qualifier, **40 teams** in all. A team that
cannot take its seat passes it to the next qualifier's leaderboard.

Europe's twelve seats, read straight off the four finals this mode already
holds:

| cup | 1st | 2nd | 3rd |
|---|---|---|---|
| 1 | Shxrk & t3eny | Sky & Scroll | Tjino & PabloWingu |
| 2 | Shxrk & t3eny | Japko & panzer | vic0 & Malibuca |
| 3 | Darm & demus | charyy & Kami | SwizzY & Pixie |
| 4 | Shxrk & t3eny | SwizzY & Pixie | Sky & Scroll |

Twelve seats, **eight duos**: Shxrk & t3eny qualified three times over, Sky &
Scroll and SwizzY & Pixie twice each. Nobody takes a second seat, so those four
spots pass down the same leaderboard — which is the rule the app already draws
as "already qualified" on a FNCS standings table.

**Two islands, alternating.** The Championship is played on both Reload maps,
not one: the circuit's own map pages split it into Group A on Slurp Rush, Group A
on Elite Stronghold, Group B on each, and then the Finals. Those are the two
islands this mode already ships — the green one the first two cups were played
on is **Slurp Rush**, the frozen one from cup 3 is **Elite Stronghold** — so a
Championship game changes island the way a qualifier game does not.

### What that needs, and does not have yet

- A field of 40 where the data names 12. The other 28 seats are other regions'
  and this circuit published none of them here.
- A map that changes between games. Every mode in the app so far picks one
  island for a whole run.
- The Championship's own format — groups, game counts, cuts — which the
  qualifier rules do not cover and which Epic has not published as a rules
  document.


## What is deliberately not in this pass

- **Career.** The circuit is a mode, not a ladder. Career's division cups stay
  FNCS.
- **Regions.** Every page is Europe. The region picker does not open for this
  mode rather than offering six empty ones.
- **Nothing dated by hand.** Every date in the table above is the window's own
  `beginTime` — cup 4's from the calendar the site reads, cups 1-3 from the
  event payload behind their Tracker pages. No tile carries a guessed date.

## What a card is worth

A card is rated by **the deepest stage its player reached**, on a ramp from the
top of that stage to its floor across the field that actually played it — the
same shape `tBase` gives the FNCS sets. There is no miss penalty here because
the stage bands already say where a player stopped.

| stage | top | floor |
|---|---|---|
| Final | 96 (`REGION_TOP.EU`) | 74 |
| Heat | 92 | 70 |
| Play-Ins | 86 | 64 |
| Opens | 78 | 50 |

The bands are not chosen, they are fitted. 428 of these handles already have a
FNCS card, so `tools/check-ewc-cards.js` puts each Reload card beside the same
player's FNCS card **of the same depth** — a Final against a Grand Final, an
Opens card against a Play-In card — and reports the gap. A player who reached a
FNCS Grand Final and went out in the Reload Opens *should* read lower; what has
to line up is like with like. After fitting:

| Reload stage | vs FNCS | handles | median gap | within 5 |
|---|---|---|---|---|
| Final | Grand Final | 73 | **0** | 70% |
| Heat | Grand Final | 74 | -3 | 62% |
| Play-Ins | Play-In | 13 | -6 | 38% |
| Opens | Play-In | 41 | -3 | 54% |

The circuit therefore rates a shade under FNCS at the shallow end and exactly
level at the top, which is the conservative direction: a Reload result cannot
inflate anybody.

### Two shared tables the circuit is kept out of

- **Experience.** `mkSorts` tallies how much competition a handle has played,
  ranked across every card in the game. Folding a second circuit into that pool
  would move the Experience attribute of every FNCS card ever built. EWC stages
  are ranked against themselves like any other stage but do not register, so a
  player keeps the experience their FNCS record earned.
- **The career average.** Cards are lifted toward a player's best three
  results, and with the four cups feeding it, Sky and Scroll's FNCS 2025 Play-In
  cards were lifted a point off a Reload result played a year later. The two
  2025 Majors were muted for exactly this reason; the Reload sets join them. A
  circuit may draw on a player's career number, it may not rewrite another
  circuit's cards by existing.

Guarded by `tools/dump-card-ratings.js` and `tools/diff-card-ratings.js`: with
the four cups in, **15 191 existing cards checked, 0 moved**.
