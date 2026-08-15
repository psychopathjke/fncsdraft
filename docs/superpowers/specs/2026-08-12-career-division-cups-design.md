# Career — division cups, and who you play against

Status: design, approved in outline (playable cup first, then growth, news, morale).
Project: `C:\Users\FoxOS_User\Desktop\career`, rebased on the live site 12 August 2026.
Builds on `2026-08-08-career-mode-design.md` — read that first for the ladder,
ping, age and the season shape.

## The hole this fills

The hub is finished and the Play button is `disabled`. Everything the career
holds — division, week, earnings, the whole calendar — describes events that
cannot be played. This is the event.

## The measurement that shapes the whole mode

The roster is not a cross-section of Fortnite. It is the people who reached an
FNCS Major. Read off `tools/baseline-card-ratings.json`, the 701 European cards:

| OVR band | cards |
|---|---|
| 60-64 | 18 |
| 65-69 | 43 |
| 70-74 | 49 |
| 75-79 | 175 |
| 80-84 | 263 |
| 85-89 | 103 |
| 90-94 | 34 |
| 95-99 | 16 |

Lowest card in Europe: 62. Median: 81. **Nothing exists below 60.**

The career's own division table puts Division 5 at 54, Division 4 at 61 and
Division 3 at 68. So two of the five divisions have no opponents in the roster
at all, and the third has 18 of them.

This is not a gap in the data — it is what the data means. Everybody in the
roster is Division 1. A Division 5 lobby is fifty duos nobody has ever heard of,
because the people you have heard of are four rungs above you.

So the mode takes it literally:

- **Divisions 5 to 2 are ladder players** — generated, anonymous, rated around
  the division's own band. They are labelled as generated, the same way
  `makeFiller` already labels its reserves, so nothing on screen claims a fake
  person played a real event.
- **Division 1 is the roster, in its real pairs.** Real cards, real handles,
  real flags — and, since the realistic simulation gave the app a way to read
  the duos out of the cards themselves, the pairs the roster actually played.
  The cards' own roster entries hold **240 whole European duos**, 207 of them
  at or above the Division 2 band, and a lobby needs 149. Only if that ever
  ran short would the rest be paired by rating, the way the whole division was
  before.

Climbing the ladder is therefore literally climbing toward the real scene. In
Division 5 you beat strangers; in Division 1 you are in a lobby with Focus and
Th0masHD. Nothing had to be invented to get that — it fell out of the roster.

## Recalibrated for the measured year and for days, 14 August 2026

The career runs the measured 2026 year — twenty-one cup weeks, two separate
sessions a week below Division 1, forty-two attempts — and every day between
those attempts is now a day the player spends. Both had to be paid for at once.

**The target, set by the user:** Division 1 should be reachable inside a
player's first season. Not handed over — before any of this the build gave it to
twelve careers out of twelve whatever they did — but reachable.

### A day is one decision

Three energy with cheap options meant a day held three or four trainings, which
is four hundred and eighty a year. At any per-press number worth showing, a
career sat on its ceiling before its first season was out.

So the size came from the other end. Division 5 to Division 1 is about twenty-one
points of rating; a season is roughly a hundred and eighty free days; that is a
tenth of a point a day, which at aim's weight of 0.22 is half a point of an
attribute. Half a point is what a press should show — so **a press is a day**,
every activity costs the whole of it, and energy says the thing it was always
for: a cup takes the day, so a tournament evening is not also a practice evening.

Training takes the same ceiling taper the cup's growth uses. Without it, training
ran at full speed to the ceiling and a career stood still for seven seasons after
its first.

| | |
|---|---|
| aim trainer | +0.32 aim, the whole day |
| customs | +0.20 aim, +0.18 clutch |
| ranked | +0.20 survival, +0.18 consistency |
| replays | +0.24 experience, +0.13 survival |
| scrims | +0.10 of four, and partner morale |
| `CAREER_GROWTH_MAX` | 0.55 |
| development at 15-17 | 0.16 a cup |

A cup is worth more than a day per event — real games are the best improvement
there is — and days still carry more of a season, because there are five times as
many of them.

### The arc

Six careers per starting age, five seasons each, from Division 5 at 54, playing
every cup and training every free day:

| start | reaches D1 | arrives | season 1 | season 2 |
|---|---|---|---|---|
| 15 | 6/6 | season 1 or 2 | 75.5, div 1.0 | 78.8 |
| 22 | 6/6 | season 1 or 2 | 74.4, div 1.3 | 76.0 |
| 29 | 6/6 | season 1 or 2 | — | — |

Careers finish on the ceiling they drew: 75 ends at 75, 96 ends at 93.

**What follows from the target, and is worth saying rather than discovering:** if
Division 1 is one season away and the average ceiling is 81, then growth is a one
to two season arc and everything after it is about results rather than
improvement. That is the shape the user asked for. Age now barely changes how
fast the climb goes — training does not care how old you are — and shows up in
the ceiling instead, which is the part the roster actually measured.

## Cup format

From Epic's own events, already read in the previous design:

- one window, **11 games** (MatchCap 11), lobbies of 50 duos, reshuffled every game
- duo scoring as published — `PLACEMENT_POINTS_DUO`, Victory Royale 65, +4 an elimination
- top N advance, and the reward is a token for the division above
- Divisions 2-5 pay nothing. Division 1 pays, and only in its Weekly Final.

Division 1's second session and its Weekly Final are **not in this pass**. D1
plays the same single window here; the final comes with the money.

## The cut, and why it is a third

Epic states quotas, not field sizes: top 400 out of Division 5, 200 out of
Division 4, 100 out of Division 3, 50 out of Division 2. A quota alone cannot
say how hard a cup is — 400 of 500 is a formality, 400 of 20,000 is a wall.

But the quotas chain. Division 4's field is, to a first approximation, the 400
who came out of Division 5, plus whoever already held the token. Division 3's is
the 200 from Division 4. Division 2's is the 100 from Division 3. Every rung
promotes half of what it was handed, and its field is what the rung below sent up
plus holdovers — so the promoted fraction sits somewhere between a half (no
holdovers) and a quarter (as many holdovers as newcomers).

**A third is the middle of that range, and it is the same third at every rung.**
The ladder is self-similar in Epic's own numbers, which is why the cut can be one
constant rather than five guesses.

So: a field of **150 duos**, three lobbies, **top 50 advance**. The 150 is a
performance choice — it is the size the Major's own card field already uses, and
it keeps the standings table short enough to read to the cut line. The third is
the derivation above, and at this size it lands exactly on Epic's own Division 2
quota: top 50.

### What it measures out at

`tools/career-cup-calibration.js` runs the app's own field builder and its own
lobby simulation for a player sitting at each division's rating, 40 cups each:

| div | band | field OVR | real cards | promoted at band | median place | promoted carrying the band below |
|---|---|---|---|---|---|---|
| 5 | 54 | 53.8 | 0 | 43% | 52 | — |
| 4 | 61 | 61.1 | 0 | 38% | 58 | 0% |
| 3 | 68 | 67.9 | 0 | 38% | 64 | 0% |
| 2 | 75 | 74.7 | 0 | 53% | 50 | 0% |
| 1 | 82 | 82.5 | 298 | 23% | 73 | 0% |

**15 August 2026 — one field per rung, and Epic's own quota out of it.** The one
constant for all five was the compromise while the field was one size, and it
does not have to be. Epic publishes the quota out of every rung — top 400 from
Division 5, 200 from Division 4, 100 from Division 3, 50 from Division 2 — and
those are the numbers that qualify in the real cups, so they are the numbers
that qualify here. The field is what the quota came out of, by the chain above:
three times it, which is 1,200 / 600 / 300 / 150 down the rungs.

Every one of those is the same third. Nothing about a career's odds moved; the
room did, and the number beside your name is now the real one — top 400 of a
Division 5 cup, top 100 of a Division 3 cup.

Division 1 is the one rung with no quota out of it and the one whose size is not
a modelling choice at all: Europe's Division 1 is a hundred and fifty duos and
fifty of them reach the Weekly Final.

**And then the room, set by the user rather than derived.** 2,000 duos in
Division 5, 1,000 in Division 4, 500 in Division 3, 200 in Division 2, and
Division 1 as everybody already in it plus everybody who just qualified out of
Division 2 — 241 real duos over the rating floor plus the quota of 50, which is
291. The quotas do not move with them, because the quota is the real number:
400, 200, 100, 50, and 50 into Division 1's Weekly Final.

That is a deliberate trade and the calibration is where it shows. A fixed quota
in a bigger room is a smaller share — a fifth out of Division 5 rather than a
third — and a player rated exactly at their own band sits around the fortieth
percentile of it, so clearing a fifth is much rarer than clearing a third.

Re-measured at 40 cups each:

| div | field / cut | band | field OVR | real cards | promoted at band | median place | promoted carrying the band below |
|---|---|---|---|---|---|---|---|
| 5 | 2000 / 400 | 54 | 54.0 | 0 | 8% | 785 | 8% |
| 4 | 1000 / 200 | 61 | 61.2 | 0 | 3% | 400 | 0% |
| 3 | 500 / 100 | 68 | 68.1 | 0 | 13% | 242 | 0% |
| 2 | 200 / 50 | 75 | 74.9 | 0 | 28% | 72 | 0% |
| 1 | 291 / 50 | 82 | 82.6 | 580 | 3% | 137 | 0% |

Against 43/38/38/53/23 at 150 duos and a third. The ladder is several times
longer now, which is what the real funnel is; the knob if it turns out to be too
long is CC_CUP_ENTRANTS, not the quota.

What the table also shows is how much noise forty cups carries — Division 1's
row read 23%, 15% and 20% across three runs of forty before its field changed at
all. Read the shape, not the percentage.

**15 August 2026, later — 5,000 / 2,500 / 1,250 / 725, and the ladder that
comes out of it.** The rooms are the user's. Promotion at your own band is 0%
in Divisions 5, 4 and 3, which reads like a broken ladder until you ask the
question the career actually answers: a career does not sit at its band, it
grows through it. Measured at 12 cups a cell, by how far the duo's rating leads
its division:

| div | field / cut | at band | +7 | +14 | +21 | +28 |
|---|---|---|---|---|---|---|
| 5 | 5000 / 400 | 0% | 25% | 67% | 100% | 100% |
| 4 | 2500 / 200 | 8% | 58% | 58% | 92% | 92% |
| 3 | 1250 / 100 | 0% | 42% | 83% | 83% | 100% |

Seven points is one rung. So the rule the big rooms buy is: **you go up when you
are already worth the division above**, and until then you train. At +7 a cup is
a one-in-three to a one-in-two, which is two or three cup weeks; at +14 it is
most weeks. Median place tells the same story — a Division 5 duo at its own band
finishes 2,773rd of 5,000 and at +7 finishes 538th, one rung short of the 400
that qualify.

That is a different mode from the one a third-of-150 built, and a truer one: the
ladder is a wall you climb by getting better rather than a queue you clear by
turning up. The career's own arithmetic supports it — a rookie starts at 54 with
a ceiling in the eighties, and the day loop was sized at about twenty-one points
of rating across a season.

**What it costs.** Field build plus eleven games of fifty-duo lobbies through
the zone engine, measured: 150 duos 0.3s, 300 0.4s, 500 0.7s, 1,000 1.5s, 2,000
2.8s, 5,000 7.2s. At Division 5's two thousand that is a quarter of a second a
game against the fifteen-odd seconds a game takes to watch, and only the
player's own lobby is ever drawn. Five thousand would cost about six tenths of a
second a game.

Two readings matter. A player rated at their own division promotes about four
times in ten — the third, as designed. A player who has just been promoted and
still carries the rung below's rating promotes **zero times in forty**. The wall
is real and it is exactly where it should be.

The harness found two things that were wrong before it found that:

- **A duo of two IGLs finished 99th of 150 while rated at the field's own band.**
  `buildTeam` pays `ROLE_BONUS_STEP` — four points of team power — for covering
  both roles, and half the generated field covers both by chance. So the
  auto-assigned partner now plays the role the career player does not.
- **Division 1's field averaged 71.** The roster reaches down to 62 because it
  holds everyone who ever appeared at a Major, one-off qualifiers included.
  Division 1 now draws only cards at or above the Division 2 band, and the field
  reads 82.5.
- **Real pairs carry synergy that invented pairs do not.** The moment Division 1
  became the roster's own duos, every team in it collected `SYN_TEAMMATES` —
  five points of power — and a player rated exactly at the Division 1 band fell
  from mid-field to **106th of 150**. A career duo is a standing pair too: you
  play the season with your partner and the generated field plays with theirs,
  so `careerTeam` pays every duo in a career cup the same bonus. Measured over
  400 cups a division, before and after: Division 1 sits at 24% promoted and a
  median place of 65-66 either way, and Divisions 2-5 do not move.

### Why this is hard even though a third sounds generous

The field is rated at your division's band, and so are you, when you arrive. A
Division 5 player at 54 in a field averaging 54 finishes near the middle and
promotes about as often as not. The same player in Division 4 is a 54 in a field
of 61s and almost never does.

The difficulty is not in the cut. It is that the cut moves and you have to
actually get better to keep meeting it, which is what the growth system is for.
Four cup weeks run before Major 1, so a season allows at most four promotions
even if you never fail — Division 5 to Division 1 is a full season of winning
everything.

## What a result does

One cup produces one row in `career.log` and moves four things:

- **Division** — inside the cut grants the token for the rung above, and the
  token is what division you play next week. Nothing ever demotes mid-season,
  per the previous design.
- **Rating** — see growth, below.
- **Earnings** — nothing outside Division 1, which is the point of the climb.
- **Partner patience** — see morale, below.

## Growth

The wall above is only fair if it can be broken, so the rating has to move. Three
things move it, and only one of them is a free parameter.

**Performance** is measured inside the run. Every team carries a `pow`, so the
share of the field you were expected to beat is the share you outpower — nothing
was invented for it. But it is unbiased by construction: on average you finish
where your power says, so alone it is a random walk and nobody climbs. It is the
noise, not the trend.

Two systematic errors hid inside that term, and the arc harness found both:

- **The connection was missing from the comparison.** `pow` does not carry ping —
  the engine adds it inside a duel as `closeEdge` — so a German player beat their
  own expectation every week for a reason that had nothing to do with playing
  well. Careers finished twelve points above the ceiling that was meant to stop
  them. The comparison now uses `pow + closeEdge`.
- **The partner was pinned to the division band.** A below-band player was being
  carried, the duo read stronger than the player was, and growth docked them for
  underperforming a number their partner earned: careers starting at 22 gained a
  point and a half a season less than their own development rate. The partner now
  follows your rating, two points above it — which is what the previous design
  already said should happen ("in Division 5 the strong ones say no").

**Development** is the trend, and it is the tuning choice. A Fortnite career is a
young person's career, so a fifteen year old improves every week whatever
happens, someone at 25 barely moves, and past thirty the number falls.

**Potential** is the ceiling, drawn once per career, and it is what stops every
career ending the same. Drawn from the whole European roster it capped a third of
careers at 56 — below Division 3, which is a soft lock rather than a career. Two
cuts fix it, and both are cuts this design already makes elsewhere: no `ranked`
tier (383 cards bunched at 70-74 that never played a Major) and at or above the
Division 2 band. What is left is **471 cards spread 75 to 96, median 81** — the
real answer to how good the people who get there get.

### The arc that comes out

`tools/career-arc-calibration.js` plays whole careers through the same code, 8
careers per starting age, 8 seasons each, everybody starting in Division 5 at 54.
Mean rating by season:

| season | age 15 start | age 22 start | age 29 start |
|---|---|---|---|
| 1 | 60.7 | 55.5 | 53.4 |
| 2 | 67.6 | 57.5 | 52.6 |
| 3 | 74.0 | 59.1 | 51.4 |
| 4 | 77.1 | 60.1 | 50.1 |
| 5 | 78.3 | 61.4 | 49.2 |
| 6 | 78.5 | 62.4 | 46.3 |
| 8 | 79.0 | 63.3 | 40.8 |

Reached Division 1: **8 of 8** starting at 15 (median season 3), **3 of 8**
starting at 22 (median season 6), **0 of 8** starting at 29.

That is three different games out of one age field. A teenager gets five seasons
of visible improvement and then plays out a peak — ceilings drawn between 75 and
96, one of the eight finishing at 93. Someone starting at 22 has three seasons of
growth and settles in Division 2. Someone starting at 29 declines from the first
week and never leaves the lower divisions.

**The one thing that is clearly wrong: careers that start old end pinned at the
rating floor of 40.** Four of eight sat there for the last two seasons. That is
not a balance problem, it is the missing feature the previous design already
flagged as an open question — how a career ends. Retirement is the answer, and it
is not written yet.

## Morale

The partner is the only part of a career that can walk away, and the previous
design already said it should ("a bad Major can make your partner leave on their
own"). Until the market exists, patience is what that means: a number from 0 to
100 starting at 60, moved every cup, and a seat that empties below 18.

The scale is invented — there is nothing to measure it against. The line it is
scored against is not, and the first attempt got it wrong: judging the week
against the promotion cut meant everyone outside the top third bled patience
every single week, and the arc harness priced it at **partners walking out of 22%
of cups for a teenager and 46% for a veteran** — a new name in the seat every
second or third week, which is not a relationship.

Only a third of the field promotes, so failing to promote is the normal state
rather than a grievance. The line is the middle of the field: hold your own and
the seat is safe, promote and it is better than safe, and three or four weeks in
the bottom third is what empties it. Re-measured over the same 512 cups per
starting age:

| start age | partners walked out |
|---|---|
| 15 | 10% of cups — about one change a season |
| 22 | 22% |
| 29 | 37% |

The churn that is left is not noise, it is the ladder telling the truth. Nothing
ever demotes you, so a player who is promoted past their rating stays in a
division they finish the bottom third of, and nobody stays in that seat for long.
The fix for it is between-season relegation, not a kinder patience curve.

## The feed

Every line is built from something that happened in the run — the placement, the
token, what the rating did, who actually won the cup, what the partner thinks —
rather than from a bank of flavour text. The feed cannot say anything the
standings do not, which is the same rule the rest of the app follows.

A week is filed in reading order: what happened first, small talk last.

## How the hub looks

Two references, and they do different jobs.

**The football career dashboard supplies the bones** — identity bar across the
top, tab strip under it, a wide band for what is coming, tiles beneath, your
card down the left. That structure was already here and it is not the part that
was missing.

**The FNCS broadcast supplies the surface.** `Desktop\дизайн` holds the Victory
Royale graphic and the FORMAT 2025 bracket, and both say the same things: a
near-white field of broken plate, black slabs cut at an angle carrying heavy
italic uppercase, teal where something is live, and holographic chrome on the
one thing you are meant to look at.

So the hub's tiles became plates with black slab headers instead of white cards
with dark text on them, the "next up" band went black with teal only on the week
you are standing in — the way the bracket colours only the live stage — and the
chrome gradient runs along the top of the band and the event panel, which are the
two things the screen steers you towards. Values are set in italic because that
is how the broadcast sets a number.

**Then the whole mode went dark.** The light STANDINGS field lasted one pass and
read as a spreadsheet: a month of white squares on a white plate is a table, not
a season. The lobby is where a Fortnite player actually reads what is on this
week, so the calendar took its colours first — deep indigo, day cells lifted out
in translucent light, the current week ringed in cyan — and then the hub and the
creation screen followed it, because a mode that opens on one palette and lives
in another is two screens, not one.

The broadcast layer survived the move intact: the black slabs, the italic
numbers, the chrome strip and the teal are all still there, they just sit on
indigo instead of on paper. Chips keep their meaning throughout — teal for a cup,
violet for a Major, gold for the Global Championship.

Two things stay bright on purpose. The ping map is a map, and reading a country
off its own colours is the entire point of it. And the card preview is drawn by
the app's card renderer, which owns its palette everywhere else in the game.

**Then the lobby itself arrived as a reference** (`Desktop\карьера\главное
меню.jpg`, the in-game main menu) and settled the furniture: the tabs are flat
uppercase text with the live one in a light pill, the event sits in a rounded
card with a red countdown badge, a number the size of the card, mode chips, and
a yellow button under it. The screen's own actions became a row of dark pills at
the bottom.

The yellow is the only colour in this mode that is not FNCS teal and it earns
its place: in the lobby it is the button you press to go, and this screen has
exactly one of those.

The number on that card is the cut — 50 of 150 — and putting it there caught the
hub contradicting itself. The ladder tile had been printing Epic's published
quota ("top 200" in Division 4) over a cup where fifty of a hundred and fifty
advance. Epic's quotas are the derivation, not the display; the tile now prints
what the cup actually does.

**The history screen has its own reference** (`Desktop\карьера\photo_2026-08-12_04-02-53.jpg`,
a Fortnite Tracker profile) and is described under its own heading below.

## Covers

A day with something on it wears that event's artwork, so a heavy week is
visible before a label is read.

The divisional cups were guessed at first and the guess was wrong — they were
given a different picture from the Majors, on the assumption that a different
event means a different cover. Epic's own event list
(`Desktop\карьера\photo_2026-08-12_04-17-38.jpg`) settles it: **Division 1
through 5 all carry the same picture, and it is the season's FNCS key art, the
same image the Majors carry.** One season, one cover; the division is a label on
it, not a different image.

So cups take that art too, and what separates a cup from a Major here is the
tone of the scrim over it — the same three colours the chips already use: teal
for a cup, violet for a Major, gold for the Global Championship. The artwork is
Epic's, the tint is this interface saying which kind of week it is.

The Global Championship is the exception it should be: it has no 2026 cover in
the project at all, and borrows the 2025 season-finale art rather than wearing
the same picture as a Tuesday.

The scrim is also what keeps this a calendar rather than a wall of pictures. The
art carries the mood; the date and the chip still have to be readable at sixty
pixels.

## The history screen

Reference: a Fortnite Tracker profile. It is the right shape because it answers
the same question — what has this player done. A summary strip on top: the
number the page is about with its own curve behind it, then the totals. Under
it, every event as a row: place, points, earnings, who you played with, matches,
wins, elims, average place, and what the rating read afterwards.

Every column is something the career already records. That is why there is **no
K/D column**: a cup counts team eliminations and never counts a death, so a
kill/death ratio would be a number with nothing behind it. Average place is the
honest version of the same thing and it is measured every game. The cup writes
matches, wins, elims and that average into the log as it finishes, because all
of it lives on the team object at that moment and nowhere afterwards.

The earnings column is always a dash, and it stays: four divisions paying
nothing is the point of the ladder, and a column of dashes says that better than
leaving the column out.

## Organisations

The first design put clubs out of scope, "to be added on top later if the ladder
works". The ladder works, so here they are — and none of who they are is
invented. The roster carries the real org of **284 European players across 115
organisations**, and a club's standing is the mean rating of its own players.
That one measured number drives everything: who looks at you, what they pay, and
what they want for it.

Two measurements shaped the feature more than any design decision did:

- **Only 39 of the 115 clubs have a crest in `logos/`.** A contract screen with a
  blank square where the badge should be is worse than a smaller pool, so a
  career signs only for clubs the app can draw. `tools/career-org-check.js`
  fails if that list ever stops being true.
- **The weakest of those clubs averages 71, and a career starts at 54.** So the
  first three divisions are played with nobody's name on you. That is not a
  balance choice — it is what the roster says: real orgs sign players who are
  already worth something. It also keeps the ladder's own promise that four
  divisions pay nothing.

The rest:

- **Reach** — a club looks at you at six points under its own standard. Enough
  that the club one rung up is a real target, not so much that the top of Europe
  signs a Division 4 player. Three offers at a time, the best that will have you.
- **Wage** — the one invented number, anchored to the only salary-shaped figure
  the app holds: a Division 1 Weekly Final pays its winning duo $5,000, so a wage
  sits under what winning outright is worth. About $1,500 at the bottom club,
  eight thousand at the very top, paid out across the weeks rather than in a lump
  so the number on the hub moves for a reason you can watch.
- **Objective** — below Division 1 they want the thing the ladder is for: get up
  a rung. In Division 1 there is no rung left, so they want a top-20 finish in
  any cup that season.
- **The season boundary judges it.** Met, and they extend with a raise. Missed,
  and you are a free agent again.

Signing puts the crest beside your name, on your card — the card renderer draws
one for any card carrying an org, so that came free — and in a club tile with the
wage, what has been paid so far, and whether the objective is met.

## Finding a teammate: the DMs

A transfer market is the wrong shape for this. Nobody in this scene is bought —
somebody writes to you, or you write to them. So the partner market is a
messages app: conversations down the left, the open one on the right, your side
of it aligned right in Twitter blue.

Everything said in there is built from something true. An inbound message quotes
the result that prompted it — the podium, the promotion, the fact that you have
nobody. A refusal names the rating and the division of the person refusing. There
is no bank of small talk: **if a line cannot be traced to a number on the screen
behind it, it does not get sent.**

Who says yes is the rule the first design already wrote down — "who will play
with you depends on your rating and division; in Division 5 the strong ones say
no". Three points of rating is the reach: your own level or a little above will
take the call, clearly above you will not. A cut is worth two points of
persuasion and a podium three, because a result is the only argument you have
that your rating does not already make.

Taking somebody up on it drops whoever you had, and the feed says so out loud
rather than letting it happen quietly.

Who is in the list is the same population as the cup field: ladder players below
Division 1, roster cards in Division 1 — so the moment you arrive in Division 1,
the people writing to you are people with names.

## Still to write, in order

1. ~~The cup~~ — playable, with the field above. Done.
2. ~~Growth~~ — rating, development, ceiling. Done.
3. ~~News~~ — a feed built out of the run. Done.
4. ~~Morale~~ — patience, and a partner who leaves. Done.
5. ~~The partner market~~ — the DMs. Done.
6. **Retirement** — see above; old careers currently sit on the rating floor.
7. **Division 1's Weekly Final** — the second session, the top-50 cut and the
   money. Division 1 pays nothing at all until this exists, which the result card
   says out loud rather than showing $0.
8. **Majors in a career** — week 5, 10 and 11 can currently only be skipped.

A partner is still auto-assigned when a career has nobody — somebody two points
above your own rating — so the mode works if you never open the DMs. The DMs are
how you change that.

## 15 August 2026, later still — the band spread is measured now

`CC_BAND_SD` was 4 with a comment that admitted it: "the spread is a design
choice". It is not any more. Epic's Power Rankings page carries one fully
specified example — a Division 3 cup of 1,000 in a field rated 20,000, where
100th place rates 23,000 and 900th rates 17,000. At 976 PR per OVR point (the
same anchors the career's PR model stands on), that puts the 10th percentile of
a divisional cup at **+3.07 OVR over the field's mean** and the 90th at −3.07.
The app's own PR line already agreed — `CC_PR_SPREAD = 7500` gives
7500 × (0.5 − 0.1) = +3,000 at the 10th percentile — so the field builder was
the one part of the game spreading a division wider than the game's own rating
model said a division spreads.

Swept against that observable with the app's own field builder and lobby
simulation (Division 3, 1,250 duos, 11 games, 14 runs a value):

| SD | p10 | p90 | Epic |
|---|---|---|---|
| 4 | +4.37 | −4.21 | ±3.07 |
| 3.3 | +3.17 | −3.45 | |
| **3.2** | **+2.94** | **−3.11** | ← this |
| 3 | +2.51 | −2.62 | |

What it does to the ladder: the quota's cut line moves from ~5.6 over the band
to ~4.5, and the odds through the growth a career actually makes — measured at
16 cups a cell with `tools/career-cup-calibration.js`, which now reads four
points per division:

| div | field / cut | from below | at band | +3.5 | +7 |
|---|---|---|---|---|---|
| 5 | 5000 / 400 | 0% | 6% | 56% | 75% |
| 4 | 2500 / 200 | 0% | 6% | 25% | 81% |
| 3 | 1250 / 100 | 0% | 0% | 31% | 81% |
| 2 | 725 / 50 | 0% | 0% | 19% | 81% |
| 1 | 645 / 50 | 0% | 0% | 13% | 88% |

Against the old curve — 0% at band and 25–58% at +7 — the two ends that were
right are still right: a duo fresh from the rung below promotes zero times in
sixteen, and the rooms and quotas are untouched, still Epic's. What moved is
the middle. Half-grown, +3.5 into a division, a cup is now a real chance
rather than a certainty of nothing, so the season a career spends growing
through a division has hope in it week by week. Fully grown, +7, promotion is
three cups in four rather than a coin flip — the ladder is shorter exactly
where a career has already done the work.

Division 1's row reads the same wall for its Weekly Final seat: at the band
you watch, at +7 you are in it most weeks. Its field is the 300-card Play-In
snapshot plus ladder to the measured 645.

## 16 August 2026 — the user's rooms, and what Division 1 is made of

**The rooms are smaller.** Division 5 felt like a crowd and the open events
lagged — an open is the whole ladder summed, and 9,766 duos cost seven-plus
seconds a stage. `CC_CUP_ENTRANTS` is 1000 / 500 / 300 / 150 now, with Division
1 the snapshot's own 150; the open ladder sums to 2,100 duos, about two seconds
a stage. The quotas scale with them and hold the measured shares — 8% out of
Divisions 5-3, 6.9% out of Division 2 — so promotion is exactly as hard as the
calibration says: 80/1000, 40/500, 24/300, 10/150. Division 1's fifty stays
fifty, because it is the Weekly Final's real size rather than a promotion.
Tracker's measured 5,000 / 2,500 / 1,250 / 725 / 645 stay in the comments as
what the real divisions hold.

**Nothing in Division 1 is generated.** The cup room was the measured 645 — 150
real pairs and 495 invented ones underneath — and even banded below the snapshot
the invented half was noise with names, winning cups over the real ones.
`careerCupSize(1)` is the snapshot's 150: every standings row in a Division 1
cup is somebody. Ten cups and ten Weekly Finals re-measured after: every winner
a real duo, 89-96.

**The band spread is Epic's own number.** `CC_BAND_SD` was 4 with a comment
admitting it was a guess. Epic's Power Rankings example — a Division 3 cup of
1,000 in a field rated 20,000, 100th at 23,000 and 900th at 17,000 — puts the
10th percentile at +3.07 OVR over the field's mean, and the app's own PR line
(`CC_PR_SPREAD` 7500 x 0.4 = +3,000) already agreed. Swept against it: SD 4 gives
±4.3, SD 3.2 gives +2.94/−3.11. Taken.

**A Division 1 week is one tournament.** Tuesday's live table counts from
Monday's total rather than from zero — the carry is handed to the live stage
instead of added after it — with the cut line drawn under the last qualifying
row, and the history row is the week: 22 games, both nights' points, one
placement.

**A tournament you cannot enter is a day you still spend.** A locked event draws
the day's own panel with a line naming the room playing without you, rather than
a skip button that throws the day away.

**The standings pay in public.** `prizeFor` takes a function as well as a table
name, so the career's own payouts — `wfPrize`, `majorPrize`, `rcPrize` — draw
the money column the Grand Finals standings have always had.
