# Career mode — design

Status: approved in outline (option B, "division ladder"). Screen 1 detail approved.
Project: `C:\Users\FoxOS_User\Desktop\career` — a copy of the FNCS Draft simulator.
Only `career/index.html` is modified from here on; `fncsdraftmajor` stays as it is.

## What it is

You play as a single player, not a drafted duo. You start at the bottom, climb the
division ladder, find and lose partners, and try to reach a LAN. A career runs
across multiple seasons.

The existing game drafts a duo from packs and plays one Major. Career reuses every
tournament already written and wraps a persistent player around them.

## Starting a career

Two ways in, chosen on the first screen:

- **Create a rookie** — nickname, age, country, photo, role and division. The
  division you pick sets the starting rating, so it is really a difficulty
  choice: how much of the ladder do you want to climb.
- **Take an existing card** — any EU player in the roster. Their real rating,
  nationality, role and attributes carry over, and their division is set from
  that rating.

### Role and division

Role is IGL or fragger. The game holds no role field — `roleFromProfile` reads it
off the attributes, weighing aim/clutch/consistency against endgame/survival — so
choosing a role tilts the six numbers, and the tilt is what makes the role true.
Experience starts low either way; a rookie has none.

Division sets the rating, one rarity per rung:

| division | rating | card |
|---|---|---|
| 5 | 54 | common, grey |
| 4 | 61 | uncommon, green |
| 3 | 68 | uncommon, green |
| 2 | 75 | rare, blue |
| 1 | 82 | epic, purple |

Division 1 started at 90 — legendary — and a young player from a good country
read 100 before playing a game, which is the best card in Europe. That was wrong
about what Division 1 is. Everybody who plays a Major Play-In is in Division 1,
thousands of them, and hardly any hold a gold card. Division 1 is where the good
players are, not where the best ones are.

So the ladder drops and Division 1 tops out epic. The same thirteen-year-old
German now reads 92 rather than 100 — still the ideal profile in Europe, which is
honest, but no longer the finished article. The cost is the one-colour-per-rung
property: there are only four bands under legendary, so Divisions 3 and 4 share
green. Being right about the ladder beats being tidy about the palette.

Ping and age were left alone. Both are calibrated against the roster — Russians
are 172 of the EU field and win, the Caucasus has never produced a qualifier,
FNCS is won by teenagers — while the division table was invented here. Fix the
invention, not the measurement.

**A taken card may start anywhere.** Its role is fixed, because the role is read
off its attributes, but the division is a free choice: its natural rung is only
suggested. Drop a 92 into Division 5 and walk over it, or take a 60 into Division
1 and find out what that feels like.

### Screen 1 — creation

Visual reference: the FNCS broadcast "STANDINGS" graphic (light faceted background,
teal accent slabs, heavy italic headline, black plates). The share card already uses
this style — reuse its palette and facet approach.

Everything on one screen:

- **Nickname** — free text
- **Age** — free entry
- **Photo** — the player's portrait
- **Country** — picked by clicking a flag map, in the style of the ping map
  reference. The map shows each country's ping to the region server.

Country is not cosmetic: it sets your ping (see below) and your region.

## Ping

Each country has a ping to its region's server (Europe → Frankfurt, and the
equivalent for other regions). Ping affects play: a high-ping player is worse in
close-range fights specifically, not weaker across the board.

This makes country a real decision at creation — playing out of Germany is an
advantage over playing out of Georgia — and it gives the map a reason to exist.

Numbers come from the reference ping map, which measures to each country's main
population centre — Moscow for Russia, not Novosibirsk. They were checked against
distance to Frankfurt and hold up: Ljubljana 640 km reads 18 ms, Belgrade 1000 km
reads 26, Athens 1800 km reads 33. Replacing measured values with estimates would
be a step backwards, so they stand as they are.

Ping is an edge you earn, not a fine you pay. A good connection is worth up to six
points of close-range strength; a bad one is worth less of it, down to nothing.
Nobody is ever pushed below the field for where they live — the worst country on
the map simply gets no head start.

The curve is bent, not straight. Everything up to 25 ms pays in full — the whole of
western and central Europe, where a German gets no more than a Dane — and the bonus
only falls away where the distance is real:

| country | ping | close range |
|---|---|---|
| Germany, Poland, Sweden | 1-23 | +6.0 |
| United Kingdom | 32 | +5.8 |
| Spain | 45 | +5.1 |
| Ukraine | 49 | +4.8 |
| Turkey | 56 | +4.2 |
| Russia (Moscow) | 60 | +3.9 |
| Georgia | 82 | +1.6 |
| Azerbaijan | 89 | +0.8 |

### Where it lands in the simulation

The game already separates the two halves of a Battle Royale. Who gets dragged into
a fight is decided by `_pf` weighted by SURVIVAL_BIAS — rotations, storm reads,
positioning. Who wins the fight is a duel on `_pf` raised to DUEL_POW_EXPONENT.

Ping touches only the second. Teams carry `_pc`, the same power seen from inside a
fight, which is `_pf` plus the ping edge. A good connection wins trades and wins
nothing else; rotating and holding a position play the same on any ping.

It applies to the career player alone. No card in the roster carries a connection,
so every rival team sits at zero — verified, 0 of 6,892 cards and 0 of 20 built bot
teams. The edge is a player property, so a duo carries the mean of its two, and the
partner card brings nothing: a German career player gives their duo +3.

Measured over 4,000 games in a 50-team field of real EU cards, base power 101:

| team edge | avg place | wins | top 10 |
|---|---|---|---|
| 0 | 20.2 | 7.1% | 35.1% |
| 0.4 (Baku) | 20.3 | 6.7% | 34.3% |
| 1.95 (Moscow) | 19.5 | 8.1% | 36.9% |
| 3.0 (Germany) | 19.0 | 9.3% | 38.4% |

So a German career player gains about 1.2 places and lifts their win rate from 7%
to 9%. A player out of Baku gains nothing — but loses nothing either, which is the
point of flipping it: country is a reward for a good choice, never a punishment for
a bad one.

Ping never touches the six attributes — they are identical whichever country is
picked. It appears on the card twice instead:

- a **PNG** row under the six, below a rule and in mint, showing what the
  connection is worth
- **in the headline number**, which is rating plus connection: a Division 2 player
  reads 88 out of Germany, 86 out of Moscow, 83 out of Baku, with the base printed
  small underneath

Colour follows the number printed on the card, not the base — a 92 reads legendary
rather than sitting in epic purple with a legendary number on it. Division does not:
that stays on the base, so a good country still cannot move you up a rung — all three of those players are epic
purple and Division 2. Division decides who you are; country decides how easy your
life is.

One number per country is a simplification, and it is only wrong where a country is
both huge and populous. Russia is the only such case on this map, and it resolves to
Moscow, which is where its players actually are: 172 of the roster's EU players are
Russian, and they are not in Vladivostok.

## Age

A second modifier, on a different axis from ping. Ping only decides fights; age
decides everything — reactions, and holding a level across eleven games in a night
— so it moves the whole power number rather than just the close-range one.

Full value to twenty, because that is what the scene looks like: FNCS is won by
teenagers. Then a slow slide to thirty, and after thirty it costs 0.6 a year and
keeps going until it is a real handicap.

| age | edge |
|---|---|
| 13-20 | +4.0 |
| 25 | +3.0 |
| 30 | +2.0 |
| 33 | +0.2 |
| 36 | -1.6 |
| 40 | -4.0 |
| 41 | -5.2 |
| 43 | -8.8 |
| 45 | -14.9 |
| 48 and past | -20.0 (floor) |

Past forty it stops being a slide and compounds: each further year multiplies
what the last one cost, ratio 1.3. A year at forty-one is not the same year as one
at twenty-five. The floor at -20 exists only so a typo cannot produce nonsense.

The field runs 13 to 50. Thirteen is Fortnite own age floor, not a game-design
choice, and going under it now says so in red instead of silently greying the
button — a disabled control with no reason reads as a broken page, not as a rule.

Measured over 3,000 games in the same 50-team field, moving the team power
directly. A duo carries the mean, so a 17-year-old career player brings +2 to the
team and a 40-year-old brings -2:

| team age edge | avg place | wins |
|---|---|---|
| -2 | 21.0 | 5.6% |
| 0 | 20.5 | 6.3% |
| +2 | 19.6 | 8.5% |

So being young is worth about a place and two points of win rate, and being past
forty costs about the same. Roster cards carry no age at all, so the field never
moves — verified, 0 of 50 bot teams shifted.

Age shows on the card as an AGE row beside PNG, and both feed the headline number
while neither touches the base. A Division 2 player out of Germany reads 92 at
seventeen, 90 at thirty and 84 at forty, and stays epic purple in Division 2 at
all three.

## Divisions

Five divisions, as in real FNCS. Your division decides which events you may enter:

| division | access |
|---|---|
| 1 | Performance Evaluation weekly, Division 1 Cups with a Weekly Final and prize money, direct entry to a Major |
| 2-5 | own division's single cup window only — no final, no money, only a promotion token |

You move up on cup results and never down mid-season (see Promotion and relegation).
A rookie starts in Division 5; an existing card starts where its rating puts it.

The ladder is the point of the mode: Division 5 → Division 1 → Major → LAN.

## Season calendar

A season opens on the first Monday of January and runs eleven weeks:

```
division cups (4 weeks) → MAJOR 1 → division cups (4) → MAJOR 2 → GLOBAL CHAMPIONSHIP
```

In Division 1, a **Performance Evaluation** runs every week as well: 4 games,
Division 1 only, $400 per player for winning the final. It is the reward for
reaching Division 1, not just another calendar entry.

Between Majors there is a decision phase: your partner may leave, and you may go
looking for a better one.

### The calendar

Shown as month grids, one square per day, tournaments written inside them. The
shape of a week is Epic's — two Division 1 sessions midweek and the Weekly Final
on Sunday, a single cup window for the lower divisions, a Major spread across a
weekend — but the exact weekdays are this career's, chosen so the season lands on
a calendar you can read rather than transcribed from Epic.

A week fills differently depending on where you stand, which is the point of
showing it as squares: Division 5 plays 16 dates across the season, Division 1
plays 40, because it alone has two sessions, a Weekly Final and a Performance
Evaluation every week.

## Partners

The mechanic that replaces drafting. You are one of the two; the other has to be
found.

- Available partners are cards not currently tied to another duo.
- Who will play with you depends on your rating and division — in Division 5 the
  strong ones say no.
- A bad Major can make your partner leave on their own.

## What carries between events

Persisted in `localStorage` under a new key `fncsdraft_career`, alongside the
existing history and achievements keys:

- **Player** — nickname, age, country, region, six attributes, rating, whether
  created or taken from the roster, ping
- **Career** — season number, current week, division, career earnings, a log of
  every result
- **Partner** — the current partner's card and how patient they are

One active career at a time. Starting a new one overwrites the old, with a
confirmation.

Your rating moves with results, the way card ratings are already computed from
finishes — but rolling across the career rather than fixed.

## How it plugs into the existing code

Tournaments are not rewritten. Career sets `drafted = [you, partner]` and calls the
existing `runMajorTournament()`. Everything downstream — the lobby, the stages, the
share card — works unchanged.

New code needed:

1. **Career hub screen** — your card, division, calendar, money, next event
2. **Creation screen** — as described above
3. **Division Cups** — do not exist yet; only their historical rank tables do
4. **Performance Evaluation** — does not exist yet
5. **Division movement** — promotion and relegation on cup results
6. **Partner market** — who is available, who accepts, who leaves
7. **Save/load** — the `fncsdraft_career` record

`index.html` is a single 1.25 MB file. Career code goes in one clearly marked
section rather than being scattered through it.


## Division Cup format — from Epic's own event data

Read off the live Division 1 Europe event. Tracker blocks automated fetches, so the
page was opened in a real browser instead. Epic's description:

> Unlock this FNCS divisional cup by qualifying from the previous season or by
> advancing through FNCS Division 2. Qualification to the FNCS Division 1 Weekly
> Final is based on your performance across both FNCS Division 1 sessions each
> week, with the top 50 teams in each region qualifying to the Weekly Final.

So a cup week is:

- **two sessions**, 11 games each (MatchCap 11)
- the **top 50 teams** across both sessions reach the **Weekly Final**
- the Weekly Final is **6 games** (MatchCap 6)

This matches what the app already holds: D1W1..D1W4_RANK each carry 50 duos, ranks
1-50 — those are the Weekly Finals.

Division 1 Weekly Final prize money, per team:

| place | prize |
|---|---|
| 1 | $5,000 |
| 2 | $2,500 |
| 3 | $1,500 |
| 4 | $1,000 |
| 5 | $750 |
| 7 | $500 |
| 10 | $400 |
| 20 | $300 |

### The whole ladder

All five European events were read the same way. The shape is consistent and the
quota doubles at every step down:

| div | how you get in | window | who advances |
|---|---|---|---|
| 5 | Gold or higher in Ranked | 11 games | top 400 → Division 4 |
| 4 | token from Division 5 | 11 games | top 200 → Division 3 |
| 3 | token from Division 4 | 11 games | top 100 → Division 2 |
| 2 | token from Division 3 | 11 games | top 50 → Division 1 |
| 1 | token from Division 2, or last season's standing | two sessions of 11 | top 50 → Weekly Final, 6 games |

Three things fall out of this that the design has to respect:

**Only Division 1 has a Weekly Final.** Divisions 2-5 are a single cup window and
stop there. So the D1W1..D1W4_RANK tables already in the app are Division 1 only,
and the lower divisions need their own, simpler event: one window, one ranking, a
cut line.

**Only Division 1 pays.** In Divisions 2-5 `payoutTable` is literally empty. The
only reward is the promotion token — for example Division 3's Top #100 grants
`S39_FNCS_Division2_EU`, an entry token for the division above. Money starts at
Division 1 and nowhere earlier, which is exactly the pressure the career ladder
wants: four divisions of climbing for nothing, then the game starts paying.

**Entry to Division 5 is a rank gate, not an invite.** Epic: you and your teammate
must be Gold or higher in Ranked. A rookie career therefore opens below the ladder,
not on it.

Divisions 4 and 5 state their quotas for EU and NAC only; other regions presumably
cut smaller. The career runs one region at a time, so this only matters if a
non-EU career is ever started.

### Promotion and relegation

Promotion is not a rule Epic describes in prose — it is a **reward object**. Finish
inside the cut and you are granted a token that unlocks the next division's event.
That makes promotion easy to model exactly: a career holds tokens, and a token is
what lets you enter a cup.

Relegation appears nowhere in any of the five events. Nothing takes a token away.
The honest reading is that FNCS has no demotion within a season — you keep the
division you earned, and the season boundary is where standing is re-decided
("qualifying from the previous season").

So the career model is: **you never fall mid-season.** Between seasons, Division 1
is kept only by last season's standing; otherwise you re-enter through Division 2.
This is a design decision made from the absence of evidence, not from a documented
rule, and it is the one place the ladder deviates knowingly from Epic.

## Out of scope

Deliberately not in this design (this was option C):

- Organisations, contracts, salaries
- Training between events to raise specific attributes

These can be added on top later if the ladder works.

### Countries the map does not cover

The roster holds 47 nationalities that have played EU events; the map carries 45
countries. The gap that matters is **Israel — 17 EU players**, more than several
countries already on the map. Tel Aviv sits at 32.1N, below the frame's southern
edge, so including it means re-framing the map southward and bringing the North
African coast in with it. Not done; worth deciding.

The rest of the gap is noise: Scotland and Wales resolve to the United Kingdom, and
Egypt, Algeria, Iraq, Oman, Bahrain and Saudi Arabia have one to three EU players
each. Georgia, Armenia and Azerbaijan are the reverse case — on the map, but with
zero players in the entire roster. They stay selectable; starting there is simply
the hard way in.

## Open questions

- How a career ends — retirement at an age, or open-ended
