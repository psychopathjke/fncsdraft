# Zone simulation — design

Status: approved in outline, 10 August 2026.
Project: `C:\Users\FoxOS_User\Desktop\career`.

## What it is

Today a game is decided by `simulateGame`: rounds of power-weighted coin flips
between randomly paired squads. Nobody is anywhere. There is no map, no storm, no
reason a fight happens other than the pairing function chose it.

This replaces that with a spatial simulation for one mode: **All FNCS, duos**.
Fifty duos stand on the real Major map, the storm closes in eleven phases, and
squads rotate from the big circle into the small one. Fights happen because two
squads ended up in the same place, not because a weighted pick said so.

Everything else keeps the existing engine untouched.

## Scope

Enabled only when both hold:

- the lobby theme is `allfncs` (the mode picked off the All FNCS card), and
- the squad size is 2.

Trio, squad, and every other card go through `simulateGame` exactly as now. The
zone simulation runs for **all 12 games** of the tournament, not only the one on
screen — a standings table assembled from two different models would drift, and
the drift would show up in averages nobody could explain.

## Files

The main file is 27,000 lines. This work does not go into it.

| file | holds | knows about the DOM |
|---|---|---|
| `zone-sim.js` | circle generation, rotation, fights, surge | no |
| `zone-replay.js` | drawing a finished timeline over the map | yes |
| `index.html` | two `<script src>` tags, one branch in `simulateGamesLive` | — |

`zone-sim.js` is pure: same inputs, same output, no globals, no rendering. That
is what makes it testable outside a browser, which is the whole point of pulling
it out.

## Coordinates

Everything is in map percent, `x` and `y` from 0 to 100, and radius as a percent
of map width. This is the same space `ZONE_SETS` already uses for the landing
rectangles, so a circle and a drop spot can be compared without converting
anything, and the replay draws on the same image the landing picker draws on.

## The telemetry

Everything below the drop is measured against three real Grand Finals rather than
reasoned about. `tools/real-matches.json` holds the extract — FNCS 2026 EU, 149
duos across three matches — pulled out of their saved Match Details pages: every
zone update with its radius and centre, all 480 elimination events with the
position of the killer and the victim, and every team's placement, time alive,
damage dealt and taken, ground travelled and number of heals.
`node tools/real-matches.js` reprints all of it.

It settles seven things that were guesses, and each guess was wrong in a way that
showed up somewhere else in the model:

| | was | logged |
|---|---|---|
| zones | 12, off screenshots | 11, and a collapse after them |
| zone 6 radius | 19% of the first circle | 10.5% |
| zone 8 radius | 9.2% | 2.6% |
| how the centre moves | two hand-set budgets | a fixed schedule, random bearing |
| rotation pace | 0.25 world units a second | 0.30 |
| fighting range | "about sixty metres", worked out to 29 | 54 at the 90th percentile |
| healing | none at all | 1,457 damage taken a match against 200 health |

### The storm is on rails

The three matches agree about it and disagree about almost nothing else. **Every
radius, every phase length, and from zone 5 down every distance the centre moves,
is identical in all three** — 32500, 20000, 15000, 12000, 10000, 7350 and 7350
game units, to the unit. What is drawn is the direction it takes and where the
first circle lands.

Zones 2 to 4 are the one exception: their drift varies from match to match, and
every one of the nine measurements sits inside the gap between the old radius and
the new one. That is the nesting rule the first design guessed at, and it is
right for exactly those three zones.

### Two clocks, and the mistake they caused

A team's `timeAlive` is counted from the moment it lands. The zone updates and
the elimination events are counted from the start of the session. The gap is
about fifty seconds of bus and freefall, fitted per match by lining team death
times up against the kill events.

The first version of this work compared the two directly. Every squad looked
fifty seconds shorter-lived than it was, so the curve the engine was fitted to
sat below the real one the whole way down — and the engine was calibrated to
match it. The correction moves the reference by five to twelve points a zone.

### Where the drop sits

Seven of the 149 duos are already out when the first circle finishes closing —
4.7% of the field. Those are the landing fights, and the engine plays them.

They used to be settled by the app before the map opened: a power-weighted coin
flip per contested spot, the losers deleted, and a game that started with 84 of
100 players already gone. It was wrong twice. The number was far too large,
because a coin flip resolves every contested drop and a real one mostly ends
with somebody leaving. And the deaths landed nowhere — the first frame showed a
lobby that had already lost a sixth of itself, and zones 1 to 3 were left with
no deaths of their own.

So the first `DROP_SEC` = 40 seconds of the game are the drop. Nobody rotates
during it: every squad is late to leave, which is a rule the engine already had.
Two things that hold the mid-game apart are switched off — there is no room
shortage, and there is nowhere to decline to when somebody else is on your roof,
so `caught()` is 1 for everybody. What is left is the rate, `DROP_PRESSURE`, and
it is small: 0.08, about half the base the mid-game starts from.

`tools/drop-calibration.js` is where that number comes from. It builds the lobby
the way the app does — every squad picks one of the picker's own rectangles and
lands in the middle of it, so squads that picked the same one land on each other
— and reports what the drop takes. At 0.08 it takes 4.2% of the field against a
real 4.7%, and 95.2% of the lobby is alive when the first circle closes against
a real 95%. Nearly half the lobby shares its ground with somebody; about one
contested drop in ten produces a body.

The app reads the result back rather than deciding it. The engine flags a squad
that died inside the window with `_droppedOut`, and `_deathCause` names the
squad that beat it — that is the landing win, the landing loss, the feed line
and the bonus, all four off the same game. Modes that do not play on the map
(anything that is not FNCS duos) still settle their contested spots up front,
because the round-based model they use has no drop at all.

## The circles

Eleven phases, and the radii and durations are the logged ones:

| zone | logged radius | world units | phase | damage/sec |
|---|---|---|---|---|
| 1 | 95000 | 39.43 | 2:05 | 1 |
| 2 | 75000 | 31.13 | 3:15 | 1 |
| 3 | 52500 | 21.79 | 2:30 | 2 |
| 4 | 32500 | 13.49 | 2:30 | 5 |
| 5 | 20000 | 8.30 | 2:35 | 8 |
| 6 | 10000 | 4.15 | 1:50 | 10 |
| 7 | 5000 | 2.08 | 1:50 | 10 |
| 8 | 2500 | 1.04 | 1:35 | 10 |
| 9 | 1650 | 0.68 | 1:20 | 10 |
| 10 | 1100 | 0.46 | 0:55 | 10 |
| 11 | 1000 | 0.42 | 0:51 | 10 |

One world unit is 2,410 game units: the elimination coordinates span 200,000
units of island and the app's own land mask spans 83 units of map width. The
phase durations are the gaps between logged zone updates, split into wait and
shrink on the published table's ratio. Damage and the Storm Surge thresholds are
the published columns and the log does not contradict them.

The radii the file used to carry were read off screenshots, and screenshots were
good to about zone 4 and badly wrong after it. The late circles were two to three
times too wide, which meant the endgame could never get dense enough to finish a
game — so the engine had been calibrated to make up the difference by having the
lobby brawl in zone 1 instead. That single error is upstream of everything the
model got wrong about when squads die.

### How far the centre moves

A schedule, not a rule, and the three matches carry it identically:

| zone | 2–4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|
| drift, world units | drawn inside the nesting gap | 13.49 | 8.30 | 6.23 | 4.98 | 4.15 | 3.05 | 3.05 |

Both behaviours the old two-budget rule had to be told about are in it:

- Zones 2 to 4 close **inside** the circle they came from, so rotating is a
  choice of where to stand.
- From zone 5 the circle is smaller than its own drift, so it lands somewhere
  else entirely and everybody has to cross the lobby. These are the moving zones,
  and they are where the late game comes from.

The centre is pulled toward land. The mask is the existing `ZONE_SETS`
rectangles: they were placed on the playable ground POI by POI, so they already
describe where the island is. No second map is needed.

## Where squads start

At the centre of the landing rectangle they already picked. The picker stays
exactly as it is — the map, the Kinch ratings, the bonus points — and the whole
lobby walks into the game alive; the contested spots are settled on the map, in
the drop window described above. Stages with no picker (Heats, the Play-In) get
a rectangle off the same grid by squad index, and land in the middle of it for
the same reason: a squad scattered to a random corner of its own rectangle is
out of contact range of the squad that drew the same one, and a Heat would play
with no landing fights at all.

This is what makes the drop choice matter for a second reason. A spot on the far
edge of the island is now a spot you have to rotate off, and the first circle
decides whether that was expensive.

## Rotation

At each phase every alive squad picks a target inside the next circle. Twelve
candidate points are sampled and scored on three things: how crowded the
neighbourhood is, how far the squad has to travel, and how close the point is to
the circle edge — an edge is better than the middle, because behind you is storm
rather than an enemy.

The best-scoring point wins, with noise added. The noise is what separates
squads:

- **END** (share of points earned from placement) sets how early the squad
  leaves and how well it reads the edge.
- **SUR** (average placement) sets how cleanly it dodges the crowd.

Movement speed is identical for everyone and it is measured: every team in the
logged match reports the ground it covered and how long it was alive, and the
median works out to 0.29 world units a second. In Fortnite everyone has the same
legs; what separates players is *when they leave*, not how fast they run. So a
weak squad leaves late, takes storm damage, and enters the circle from the side,
straight into someone. That is the mechanism, and it is why END drives placement
rather than a survival constant applied after the fact.

A squad rotates **with** the circle rather than through it: each tick it heads
for the closest point to its target that is inside the storm wall as the wall
stands right now. Running straight at where the next circle is going to be, and
standing there while the storm is still on its way, cost six squads a game to
the zone-8 storm in a game where the storm takes about one death in twenty. A
squad that is already outside is not redirected — it has to run for the circle,
and being late is exactly what that should cost.

Ping does not enter this. It is the same rule `simulateGame` already states in
its comments: rotating, reading the storm and holding a position play the same on
any connection; ping decides trades and nothing else. That rule is not being
changed here.

## Fights

After each movement tick, any pair of squads within `CONTACT_RANGE` of each other
may fight.

`CONTACT_RANGE` is an **absolute** distance in world units and not a fraction of
the current circle. Scaled to the circle, the expected number of squads within
range of any given squad works out to a constant times the number still alive:
density rises exactly as fast as the range falls, the two cancel, and because the
lobby is emptying the endgame ends up with *fewer* contacts than the mid-game.
In Fortnite the circle shrinks and weapon range does not.

The distance itself is measured. The log records where the killer and the victim
were standing for all 146 eliminations that had a killer: half are inside six
metres, three quarters inside fifteen, and ninety per cent inside eighty. Eighty
metres — 3.3 world units — is the range used, because a fight that starts at
range ends at a shotgun, so the far tail is the honest read of how close two
squads have to be for a fight to be possible at all.

### Room, not proximity

Being close is not why squads fight. This is the mechanism the engine was
missing, and the log is what shows it. Take the deaths in the logged match per
squad per second, against the ground the circle was leaving each squad:

| zone | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| ground per squad | 108 | 71 | 36 | 15 | 5.7 | 1.7 | 0.5 | 0.18 | 0.11 | 0.07 |
| deaths per squad per second, ×10⁻⁴ | 7 | 2 | 2 | 5 | 2 | 17 | 21 | 39 | 58 | 81 |

Across zones 1 to 5 the ground available falls nineteenfold and the death rate
does not move. Then it turns over and climbs with every circle after it.
Proximity cannot explain that — squads are far closer in zone 5 than in zone 1 —
but running out of room can. In the mid-game there is still somewhere else to
stand, so two duos that can see each other hold their own ground and wait. When
the circle can no longer give everybody a piece, the same proximity is a fight
nobody chose.

So every pair's chance is scaled by how crowded the circle is right now, with the
knee at about two square world units a squad — thirty-five metres square, the
size of a piece of ground a duo can hold. Underneath it sits a floor, for the
fights that happen because somebody went looking; that floor is what the flat
stretch across zones 1 to 5 is made of.

Without this the engine had contacts in proportion to density and had to be
calibrated either down until the endgame was empty or up until zone 1 was a
bloodbath. It was calibrated up, and the leader averaged tenth.

### Chip damage, and healing

The log makes both the main flow in the game and the engine modelled neither.
The median team absorbs 1,547 damage across a match — nearly eight full bars for
a duo with 200 health — and heals 134 times and shields 52 times doing it, about
once every five seconds.

- **Healing** is 0.8 health a second inside the circle, which is that measurement
  on the engine's own scale. Without it storm damage was permanent: forty health
  lost crossing zone 3 was still gone in zone 9, and once the fighting was pulled
  back to the rate a real match runs at, the storm was taking half the field by
  zone 5 in a game where it accounts for about one death in twenty.
- **Chip damage** is credited for standing in contact, across twice the range a
  kill lands in and scaled by how good the squad is. It is not applied to health,
  because the same log says it is healed back as fast as it lands. What it leaves
  behind is a damage number — and that number is what Storm Surge reads.

### Being caught, and going looking

Three dispositions, because one number could not fit the real finals and two
could not either.

- **Exposure** — how easily a squad is forced into a fight it did not choose.
  Read off END and SUR. This is the zone engine's equivalent of `SURVIVAL_BIAS`
  in `index.html`: without it, being good bought nothing but winning the trades
  you were already in, and the leader averaged 17th.
- **Seeking** — how readily a squad goes and starts one. Read off AIM and CLU,
  which are average eliminations and Victory Royales per match.
- **Picking** — whether it likes the matchup. The design has always said a real
  leader does not avoid fights, it picks them: third-parties, takes the weak
  squad, declines the even one. Only half of that was in the code — a squad
  picked on how catchable the other one was, never on whether it would win. So
  the best duo in the lobby spent the endgame starting coin flips and lost three
  in ten of them, finishing eighth by median and fifteenth by mean, which is the
  signature of a squad that either wins the game or throws it in one trade.

Exposure alone was tried first and could not be made to fit at any setting.
Turning it down gave a leader 7th place and 0.2 eliminations a match; turning it
up gave 4.7 eliminations and a table flat at 8× top-to-bottom. Neither is a real
final, where the winner takes 4.6 eliminations a match *and* averages 7th.

### The edge runs out with the ground

Exposure on its own is a property of the squad and nothing else, so the best
rotator in the lobby was exactly as hard to corner inside a ten-metre circle as
it was across the whole island. Measured, that made the leader almost
unkillable: placement came out at 7.85, right inside the real range, and the
same run had it winning half the tournaments it played against two to four
games in twelve in a real Grand Final.

A duo that reads the map perfectly still cannot read its way out of a box with
nine other squads in it. So the same measured room that decides how hard the
circle is pressing also decides how much of a squad's edge survives, and the fit
puts the loss of it in the final collapse and nowhere earlier. That one change
takes the leader from 5.7 wins a tournament to 1.8 — the endgame is where the
best squad can be beaten, and it has to be.

The trade itself is resolved by the **existing** formula: `_pc`,
`DUEL_POW_EXPONENT_BY_MODE`, and the hot-streak chain of up to three. Every
balance decision already made about who beats whom survives intact. What changes
is only *who meets whom* — geography instead of a weighted draw.

The streak had a hole in it worth naming: it took the first squad in range,
whoever that was, with no reading of the lobby at all. A squad on a heater could
walk straight through the one duo that never gets caught, and that is where the
best squad in the field was dying. It now goes through the same exposure and
matchup test as any other fight.

Three dispositions rather than one also make the fragger and the IGL genuinely
different players inside the simulation, rather than two labels on the same
behaviour, which is what the six attributes were always supposed to mean.

## Storm Surge

Not simulated today at all. The real FNCS thresholds:

| zone | surge above |
|---|---|
| 2–3 | 90 players |
| 4 | 74 |
| 5 | 60 |
| 6 | 50 |
| 7 | 40 |
| 8 | 36 |
| 9+ | 26 |

When more players are alive than the threshold, surge damages **the excess** —
the squads that have dealt the least, and only as many of them as the lobby is
above the threshold by. It is worth having for one reason: it is the thing that
stops a weak squad sitting in a box to a top-3.

The rule used to be "everybody under the lobby average", and that had a hole
underneath it. In a lobby where nobody has killed anybody yet, nobody is under
the average, so the code fell back to damaging the whole field at once. It was
invisible while the engine was calibrated to fight constantly — and the moment
the fighting was pulled back to the rate a real match runs at, surge went from a
footnote to the cause of three deaths in four, thirty-eight squads wiped in zone
2 before the circle had done anything.

What it ranks on matters as much. Ranking on eliminations was killing the best
squad in the lobby one game in ten, because with almost nobody eliminated yet the
whole field was tied on zero and surge was picking at random. It ranks on damage
dealt, which is what the real mechanic uses and what the chip counter above
exists to provide. The damage is 1 a second against 0.8 a second of healing, so a
squad under surge bleeds slowly and has to act — which is the point — rather than
being executed on a timer.

## Output

`simulateZoneGame(teams, plan, opts)` returns
`{order, timeline}`. `order` is the same array shape as `simulateGame` returns —
`[champion, ...eliminationOrder.reverse()]`, with `t._elims` and `t._feed` set —
so scoring, match history, per-player stat sheets, achievements and prize money
read it exactly as they read the old one and need no changes. `timeline` is the
recorded frames the replay plays back, built only when `opts.record` is set.

Two fields are added for the feed and the replay:

- `t._deathCause` — `'storm'`, `'surge'`, or the name of the squad that killed it
- `t._zoneReached` — the phase number the squad died in

## The replay

Above the live standings, for this mode only: the Major's map image with an SVG
layer over it. The storm is drawn the way the game draws it — everything outside
the safe circle washed purple, everything inside left alone — as one path with
the circle cut out of the viewBox rectangle by the even-odd rule, so there is no
mask to keep in step. A bright edge marks the circle itself and a dashed outline
shows where it is closing to. A marker per squad, and a header with phase, timer
and counts.

Stroke widths are in screen pixels, because the strokes carry non-scaling-stroke.
They were first given user units — 0.45 of a pixel — which is why the safe zone
was invisible however large the circle was. A
kill feed runs beside it.

### Markers, not dots

Squads are drawn as the arrowhead the real map uses, pointed the way they are
travelling. On a feature whose whole subject is rotations, a heading is worth
more than a position: an arrow says who is already moving to the next circle and
who is still sitting on their ground. The heading is held rather than reset when
a squad stands still, so a parked squad keeps pointing the way it last went
instead of snapping north.

This forced a fix underneath it. The frames used to arrive in percent-of-height
and were drawn through a square viewBox stretched into a rectangular box, which
scales x and y differently — so every zone circle was a slight ellipse, and a
rotated marker would have been sheared outright. The engine's world space is
already isotropic; that is what it is for. It now emits world units and the
renderer sizes its viewBox to the map's own shape, so one scale applies to both
axes.

### Telling squads apart

Every squad gets a colour off the golden angle, so neighbouring indices land far
apart on the wheel and fifty of them stay distinguishable on one island. The
colour is the same for the whole match, which is what lets you follow one squad
across its rotations rather than losing it every time the frame redraws. Yours is
the accent colour. The kill feed tints each name to match its dot.

Names are **not** drawn on the map, except yours. Nine of them printed over a
zone-9 circle land on top of each other and read as a smudge — and the endgame,
where the circle is tightest, is exactly when you most want to know who is left.
So below twelve alive a list of the remaining squads appears beside the map,
each line a colour swatch and a name. It is legible at any density because it
never has to fit inside the circle.

Team names carry markup in the app — a flag image sits inside them — so
everything the replay prints is stripped of tags first, and anything
interpolated into the feed markup is escaped.

Every one of the 12 games plays its replay, in order, above the standings table
that is already there — the map for the game being played, then the table
updating, then the next game. That is the thing being watched, not an
interruption to it.

### Not at one speed

One speed for the whole match spent the same eight seconds on the circle nobody
fought in as on the endgame, and twelve of those is a minute and a half of
mostly waiting. There are four gears now:

| | speed | where |
|---|---|---|
| fast | 1.6× | zones 1 to 4, nothing happening to you |
| late | 1.2× | from zone 5 |
| real time | 1× | a fight of yours, and the endgame |
| close | 0.5× | from zone 10 |

A game takes 7.1 seconds against 7.6 flat. The total is nearly what it was flat
and that is the point: zones 1 to 4 take 2.3 seconds against 3.5, and the time
that saves is spent on zone 10 onward, which takes 2.2 seconds against 1.1. The
mid-game is skipped through so the last circles can be lingered on.

The close gear is a **floor**, applied after every other rule, so a fight of
yours in zone 11 cannot put the speed back up to fight pace. By then the replay
is not being read for what happened but watched to find out whether your own
squad comes through, and at 1× that question goes by before it lands.

Zone 5 earns its own gear from the same fact the circles are built on: zones 1
to 4 close **inside** the circle they came from, so rotating is a choice of
where to stand, and from zone 5 the drift is larger than the new radius and
everybody has to cross the lobby. That is where a replay stops being fifty
squads sitting on their ground and starts being the game.

The first setting was 2.4× and it was reported as rushed. The quiet stretch is
not filler — it is where a rotation is legible — and at 38ms a frame the map
redraws faster than a squad's heading can be followed across it. The saving is
worth less than the thing being watched.

What counts as at stake is read off what happened, not off where anybody is
standing. Standing next to somebody was the first rule and it does not work:
measured over 120 recorded games, another squad is within contact range of yours
in **half of all frames**, and dropping the range to two world units only takes
that to 43%. It is the same finding the engine itself rests on — squads fight
when the circle stops leaving them room, not when they are near each other — so
proximity marks half the match and separates nothing.

A fight your squad was in does separate it. Two frames of run-up and one of
aftermath around every elimination naming your squad, plus the whole endgame,
which starts at `LABEL_BELOW` — the same count that puts the names of who is
left up beside the map, because the point the replay stops being a field and
becomes a list of squads is the point it is worth watching at all. Measured,
that catches 100% of your fights and slows down *before* rather than *on* them.
The landing fight and the last trade of the game are the same rule; neither
needs naming.

`opts.pace: false` plays flat, and a replay with nobody flagged as yours slows
for every elimination in the lobby, which is the same rule with the whole field
as its subject.

### The camera

The same two moments, seen closer. A fifty-duo island drawn into 520 pixels
gives a duo about four pixels of it — enough to follow a rotation, not enough to
watch a fight, and in the last circles the arrows overlap outright. So the map
moves in on whatever the pacing already decided is worth the time and plays wide
everywhere else.

- **A fight of yours**: you and everyone within 6 world units of you, fitted with
  a floor of 7, which lands at about 6.3×.
- **From zone 5**: the circle you are standing in and the circle it is closing
  to, held in one shot, plus your own squad wherever it is.
- **The endgame**: everybody still standing, floor 6.5, about 6.8×. It sits on
  the floor rather than tightening further, and that is the finding — by the
  time twelve squads are left they are inside a circle two units across, so what
  sets the shot is how close the map can usefully be read, not how close they
  are standing.
- **Everything else**: the whole map, at 1×.

**Both** circles, from zone 5, and that is the whole of the rule. Up to zone 4
the new circle closes inside the old one, so framing where you are frames where
you are going for free. From zone 5 it lands somewhere else entirely — frame
only the circle you are in and the map hides the one thing everybody on it is
looking at. Held together, the shot opens at about 3.4× when the two are far
apart and closes to the floor as they converge, so the zoom-in arrives on its
own rather than on a schedule:

| zone | 2–4 | 5 | 6 | 7 | 8 | 9–11 |
|---|---|---|---|---|---|---|
| camera | 1.0× | 2.8× | 4.9× | 6.7× | 6.7× | 6.7× |

Your own squad is enclosed with them, because being late for the rotation is
exactly when you want to see yourself, and a shot you have run out of is a shot
of somebody else's game.

### How close it can go, and why

Three things were blurring the zoomed map and two of them were the renderer's
own doing. `will-change: transform` promoted the stage to a composited layer,
and a promoted layer is rasterised once and then stretched — the one thing a
camera that zooms must not do. The `filter: saturate(.85) brightness(.7)` on the
map was the same problem again, since a filter forces its own raster; the map is
darkened by a plain fill laid over it now, and a fill has no resolution.

The third is the photograph. `art/map-m2.jpg` is 1100 pixels across and the box
is about 520, so at 6.8× the camera was showing 162 source pixels stretched over
520 — a threefold magnification. So the ceiling is the map's own: `MAX_UPSCALE`
screen pixels per map pixel, measured off `naturalWidth` rather than written
down, which puts this map at **4.2×** and would put a 1600-pixel one at 6.2×
without another line being changed. Everything drawn on top is vector and stays
sharp whatever the ceiling says; it is the island underneath that runs out.

The camera holds longer than the pacing does — two frames of lead, five of
aftermath. A fight window is four frames, under half a second, and zooming in
and back out inside that reads as a pump rather than as a camera. It eases over
360ms and it snaps rather than glides on the first frame of a game, so game two
does not slide in from wherever game one finished. A hand on the wheel, where
the caller has asked for `{zoom: true}`, takes the camera for good: two things
writing one transform is a fight the viewer always loses.

Markers and labels are drawn **against** the camera, at a constant size on
screen. Zooming in is for telling two squads apart when they are on the same
roof; magnifying the arrows with the ground would put them back on top of each
other at three times the size.

### Names, and squads standing on the same ground

Names on the map were ruled out twice, on the grounds that nine of them over a
zone-9 circle read as a smudge. They are back, and there is no zoom threshold
and no count behind them: a name goes up when there is room on screen for it and
does not when there is not, which is the only rule that holds at every zoom the
camera reaches. The list beside the map carries whoever was left over, and the
two never carry the same squad.

**One name on the map, and it is yours.** Three arrangements of many names were
tried — coloured text, coloured pills, the game's own plate for the six nearest —
and all three were reported unreadable. Naming every squad the map had room for
was the fourth, and the counting is what settles it rather than the taste: the
engine holds every surviving squad within a unit of one point, so the last
circles are a knot of arrows a few dozen pixels across. At zone 12 with nine
alive, four names fitted and five had nowhere to go. A map that names four of
nine is not a named map, it is a map with four names dropped on it.

So the map answers one question — where you are — and the list beside it answers
the other, which is who else is left. The list is a column and does not fight the
map for room.

What survives from the placement is the placement itself, and it still earns its
keep for one plate. Yours is offered **eight places around its own arrow** and
takes the first that is free: free of everybody else's arrow, free of the header
band and the kill feed and the list's own column, and inside what the camera is
showing. Above first, because that is where the game puts a nameplate and where
the eye looks for one, then the sides, then below, then the corners. "Не видно
ников из-за стрелочек" was an arrow drawn over the one name the map carried, and
this is what stops it: plates are drawn after every arrow, and the slot search
will not put one where an arrow already is.

If nothing is free it goes above its arrow anyway, pulled inside the frame. In
the last circles every place around your arrow has somebody else's arrow in it,
and the one thing the map is there to answer cannot be given up for that. The
slot it used is remembered and offered first next frame, so it does not flip from
over the arrow to under it as a neighbour drifts past — a name blinking between
two positions is harder to read than no name.

The plate carries a thread back to its own arrow, drawn from the nearest point of
its edge. Where it sits straight above the squad the thread is a few pixels and
invisible; where the knot has pushed it out to one side, it is what says the name
is still yours.

Which squads are on screen at all is a question the SVG cannot answer on its own
— the camera is a CSS transform on the stage, so the drawing inside it never
learns that anything moved. `setView()` writes the visible rectangle onto the
handle in the frames' own units, from both the camera and the hand-driven zoom,
and the layout above reads it. A name for a squad off the left edge is a name
nobody can read.

The arrow itself is drawn twice: the same shape as a fat near-black stroke
underneath, then the colour on top. One stroked path could not do it — a stroke
straddles the outline, so half of it eats into the colour, and thickening it
until the edge read turned a small arrow into a blob. Widths are screen pixels,
so the outline is the same crisp pixel and a half at every zoom the camera
reaches, against pale sand, dark water or the purple of the storm.

**A duo is two handles.** The app names a team `A & B` — `teamLabel()` joins
every member — and yours carries a "your squad" prefix in front of that. On one
line that is a pill fifteen characters wide, half a circle across at the zoom the
endgame plays at; stacked, it is as wide as the longer handle and twice as tall,
which is a shape a map has room for. The prefix is dropped on the map: it says
which row is yours among a hundred on a standings table, and here the white ring
already says it. Trios and squads take the first handle and a `+2`.

A handle longer than eleven characters is cut on the map and kept whole in the
list — the field is made of `Aegis Kijarssf` and `asparoyel*ar0`, not of
five-letter names, and a plate is as wide as its longest line.

The list beside the map carries **everybody but you**, once the field is short
enough to list — and you as well on the frames where the camera has left your
squad off the edge, since a name nobody can see is not a name. Nothing is in both
places at once, and nobody still standing goes unnamed.

They are drawn as **the game's own nameplate**: a near-black plate, the handles
on it in white, the squad's colour as a stripe down the left edge, and a health
bar under the name.

That is the third attempt and the reason the first two failed is the same one.
Coloured text with a dark outline could not be read at all — the generated
colours are one lightness by construction, the island underneath them is not.
A pill filled with the squad's colour could be read and was reported unreadable
anyway, because thirty-three of them are thirty-three bright rectangles over a
map. A dark plate is legible against everything, and the colour goes where it
costs nothing.

The bar is real. `hp` is a number the engine has always tracked and the frames
now carry it, so a short bar is a squad the storm caught out of position or one
that surge is pushing — the two things that take health here, since a lost duel
is a death rather than damage. It turns amber under 35%. A squad still standing
is never recorded at zero, because an empty bar over a live arrow reads as a bug.

The pill is sized off the character count, not off `getBBox()`, which would force
a layout of the SVG per label per frame — fifty of them ten times a second. A
bold sans is close enough to 0.58em a character for a name a handful long.

Size went 2.5 → 2.05 user units, about 11px on screen. The first size was legible
and far too heavy: thirty-one pills over a zone-7 circle is a wall of labels with
a map behind it. What makes a name readable here is the fill rather than the
size, so the size came back down until the markers were the loudest thing on the
map again.

The collapse then produced something no amount of zoom fixes: it pulls every
squad to one point, so the last five of a game are at *identical* coordinates —
one arrow drawn five times, under a header saying five are alive. A cluster is
now fanned onto a ring the width of a marker, measured in screen terms so it is
the same few pixels whatever the camera is doing. Only while zoomed in: at full
map a two-unit nudge is 2% of the island, and the overlap was never the problem
there. The names of a pile like that are what the placement above cannot fit —
a plate is several times wider than the fan — so they go to the list, which is
where the endgame's names live.

What counts as a cluster is wider than the fan — a name is several marker widths
long, so squads that do not overlap as arrows still overlap as labels — and it
is found greedily against the group's first squad rather than by rounding into a
grid of buckets. Buckets were the first version and they miss the case they
exist for: two squads a marker apart either side of a bucket edge land in
different groups, while two at opposite corners of one bucket land in the same.

### Every kill reaches the feed

The engine keeps every eighth tick, and until 12 August it threw the
eliminations on the other seven away with the frame they would have been drawn
on. A fifty-duo game logs about 49 and the feed was printing four. Nothing else
read the list — placements, death causes and the drop bonus all come off the
squads themselves — which is why it went unseen for as long as it did.

Deaths on a tick that is not kept now wait for the one that is. The last
elimination of the game was missing for a second reason: the squads still alive
when the collapse runs out were eliminated by hand rather than through
`onDeath`, so the kill that decides the match was the one death never announced.
Both are checked by test across 300 seeds: 49 eliminations named, none twice,
and never the champion — who, on the tick where the last two squads die together
and the win is handed back to one of them, has the line taken out of the feed
again.

The existing skip button (`ensureSkipButton`) finishes the rest of the tournament
headless and jumps straight to the result, exactly as it does now.

Cost is not a concern: 50 squads × 9 phases × ~40 ticks is 18,000 steps a game,
and twelve of those is still nothing. Drawing is the only real cost, and it is
50 dots and two circles a frame.

## Testing

The engine is pure, so it can be run outside the browser.
`tools/zone-sim-test.js` runs 10,000 games under node and checks:

- average placement correlates with power, and the gradient is at least as steep
  as the current engine's
- share of deaths caused by storm stays inside a stated band
- Victory Royale distribution across the field is not degenerate — no squad wins
  a share it could not win in a real lobby
- the same seed produces the same game

The important one is the comparison against the **old** engine. This changes how
placement is earned, so it can move the balance. If it moves it, that has to show
up as a number in a test run before it shows up as a feeling in a tournament.
This follows the rule the project already runs on: fix what is measured, not what
is imagined.

## Measured

Re-measured 10 August 2026 against the match telemetry.
`node tools/zone-sim-test.js --calibrate` reproduces this;
`tools/old-engine-baseline.js` reproduces the old column.

| column | zone engine | before the telemetry | old engine + old drop | real finals |
|---|---|---|---|---|
| #1 points | 672 | 653 | 624 | 732–738 |
| #1 Victory Royales | 2.02 | 2.39 | 1.75 | 2–4 |
| #1 average placement | 10.26 | 10.53 | 13.54 | 6.83–8.00 |
| #1 elims per match | 4.24 | 3.78 | 4.14 | 4.50–4.75 |
| #10 points | 463 | 449 | 403 | 376–380 |
| #25 points | 235 | 265 | 275 | 222–240 |
| #50 points | 25 | 50 | 88 | 8–28 |
| top:bottom | 26× | 13× | 7× | 26–92× |

The old column now includes the landing system that always ran in front of the
old engine — a pow³ coin flip on every contested spot, losers deleted before the
game started. Leaving it out was measuring something the player never played,
and it flattered exactly the column that matters most: with the drop included
the old engine's leader averages 13.54th, not 8.15th. On a field this
compressed a pow³ flip is close to a coin, so the leader lost its drop in about
a quarter of its games.

Against that, seven of the eight columns are better and one — #10 points — is
worse. The zone engine's midfield scores too much (463 against a real 376–380);
the old engine reaches 403 not by modelling the midfield better but by deleting
a quarter of the lobby before every game, which takes points off the whole
table on its way past. Average placement is still the weakest column in
absolute terms: 10.26 against a real 6.83–8.00.

### When squads die

The column nothing above measures, and the one the whole model rests on. A
leaderboard says a squad came 14th; it cannot say the squad was alive until the
eighth circle. The telemetry can, and `node tools/real-matches.js` puts the two
side by side:

| zone | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| real, three matches | 95% | 85% | 81% | 81% | 75% | 69% | 60% | 47% | 37% | 28% | 18% |
| engine | 95% | 93% | 91% | 86% | 77% | 68% | 49% | 41% | 35% | 32% | 26% |
| before the drop moved onto the map | 100% | 98% | 96% | 91% | 80% | 69% | 52% | 42% | 36% | 31% | 26% |
| before any of this | 72% | 55% | 45% | 37% | 32% | 27% | 23% | 20% | 16% | 13% | 11% |

The engine used to play the whole game in the first three circles: 28% of the
lobby gone in zone 1 and 55% by zone 3, where the real match had lost 14% by
then and 22% of it after eleven minutes. Everything downstream of that was
wrong, the leader's placement included, because a squad that rotates perfectly
still gets pulled into thirty fights when the lobby is fighting at full strength.

It now tracks the real curve to 5.4 points on average, worst zone 11.

Moving the drop onto the map is what closed the top of it: zone 1 was 100%
against a real 95% and is now 95% exactly, because the deaths that belong there
are finally happening there instead of before the game started. What it did not
close is the shape below it. Zones 2 and 3 are still 9 and 11 points too high
and zone 7 is 11 too low — the engine kills too slowly through the early
circles and then too quickly through the seventh. That is a mid-game rate, not a
drop, and it is the next thing to measure.

### The middle column is the finding

`index.html` records the old engine reaching 721 / 3.08 / 8.40 / 4.34 / 386 /
236 / 31 / 23× against the real finals. Run against the synthetic 50-duo field
the calibration harness uses, the same old engine produces 684 / 2.15 / 8.15 /
3.76 / 463 / 271 / 44 / 16×.

The difference is the field, not the engine. The harness spreads fifty duos
linearly from 83 to 104, so its first and tenth squads are four rating points
apart, where a real Grand Finals field is far more top-heavy. Holding the zone
engine to the real numbers on this field would hold it to a target the engine it
replaces also misses, in the same direction and by a similar margin.

So the acceptance test is like for like — same field, same twelve games, same
scoring — and it asks a specific question: is the replacement further from the
real range than what it replaces, column by column? On seven of eight it is not.

### Where it is behind

Average placement: 9.75 against the old engine's 8.15, with the real finals at
6.83–8.00. It was 10.53 before the telemetry, so this is most of the deficit
closed and not all of it, and it stays written down rather than tuned away —
the settings that take the last point of it cost five Victory Royales a
tournament, which is a worse table overall.

### Where it is ahead

Eliminations are 4.30 against the real 4.50–4.75, where the old engine reaches
3.76 and the zone engine used to reach 3.78. #25 points, #50 points and the
top-to-bottom ratio are all inside the real ranges now and none of them were
before. And the shape comes from somewhere: the leader places well because it
rotates well and picks its fights, not because a survival constant was raised
until the table looked right.

### What the telemetry changed about the model

Seven things, and not one of them is a knob. Each was found by a number that could
not be reached without it, and each is written up where it lives in
`zone-sim.js`:

- **Room, not proximity.** Squads fight when the circle stops leaving them
  ground, not when they are merely near each other. This is the one the whole
  survival curve turns on.
- **Healing**, at the rate the log measures. Without it storm damage was
  permanent and the storm took half the field by zone 5.
- **Chip damage**, traded for standing in contact. It is what Storm Surge ranks
  on, and without it surge was picking its victims at random out of a field tied
  on zero eliminations.
- **Surge takes the excess**, from the bottom of the damage table, instead of
  everybody under the lobby average — a rule with nothing to aim at in a lobby
  that has not fought, which took the whole field at once.
- **Rotating with the circle** rather than running to where it will be and
  standing in the storm until it arrives.
- **Picking the fight**, and the same test applied to the squads a hot streak
  runs into. The streak used to take whoever was nearest, straight through the
  exposure model, and that is where the best squad in the field was dying.
- **The drop is played, not decided.** Forty seconds where nobody rotates and
  nobody can decline, at a rate low enough that about one contested spot in ten
  produces a body. It is what put zone 1 on 95% exactly, and it is what stopped
  the leader losing a quarter of its games to a coin flip it never saw.

The published columns — storm damage and the Storm Surge thresholds — were not
touched. The rest of the storm table now comes from the log rather than from
screenshots.

## Verified in the browser

Run against the real page on 10 August 2026, driven through the app's own
entry points rather than the engine directly.

**This predates the telemetry work.** The engine has changed underneath it
since: eleven zones instead of twelve, different radii and timings, and four new
mechanisms. The app's side of the bridge did not change and the engine's output
shape did not either — a fifty-duo game still returns fifty unique placements, a
champion with no death cause, and a well-formed timeline, checked under node in
the app's own call shape — but the run below has not been repeated in a browser
and the numbers in it are the old engine's. One cost figure did move: a
fifty-duo game is now 28ms rather than 11ms, so a 22-round Play-In is about six
seconds of computation instead of five.

Confirmed working:

- The gate. On only for All FNCS duos; off for the DUO card, TRIO, SQUAD and
  both card Majors, all of which still return full placement lists from the old
  engine. Checked by calling `useZoneSim` and `simulateGame` in each mode.
- A full Play-In through the zone engine: #4 of 500 over 22 games, 4 Victory
  Royales, 6.18 eliminations a match, 12.55 average placement.
- The Heats replay, live: zone 1 with 45 squads alive thinning to 10 by zone 6,
  the circle closing on Shaken Sanctuary, the kill feed printing trades.
- Cost: 11ms for a fifty-duo game, so the Play-In's 22 rounds cost about five
  seconds of computation. The replay, not the simulation, is what takes time.

Two defects were found by running it and are fixed:

- **Every squad dropped on the same pixel.** Only the Regional Final runs the
  landing picker, so Play-In and Heats squads reached the engine with no drop
  spot and the fallback put all fifty on the middle of the island. They wiped
  each other out before zone 1 finished closing — three recorded frames, two
  survivors. Most of an All FNCS run was being decided that way. Unpicked
  squads now get their own rectangle off the same grid.
- **The replay played for two-squad lobbies.** Heats end a squad's stage on a
  Victory Royale, so their last games are tiny. Below eight squads the game
  still runs on the map but is not played back.

Not watched end to end: the Regional Grand Final's own twelve replays. It runs
the same code path as the Heats replay, which was watched in full, but it was
not observed directly. Chrome throttles `setTimeout` in a hidden tab, which
stretches an eight-second replay to about ninety seconds and made sitting
through the rest of a run impractical under automation. The app's existing
animation has always had this property; it is not new here.

## Stage profiles

The Play-In and the Grand Finals are not the same game, and `index.html` already
says so for the engine being replaced — it swaps `SURVIVAL_BIAS` and
`FORM_SPREAD` depending on whether the stage scores on placement, because the
real results demand it:

| | elims/match | avg placement |
|---|---|---|
| Play-In leader | 9.8–12.8 | 16.9–17.8 |
| Grand Finals leader | 4.50–4.75 | 6.83–8.00 |

An open stage is a kill race across a huge loose field where even the best duo
farms eliminations and dies mid-pack. A final is played for placement. One
setting fits one of them and wrecks the other.

The zone engine now carries the same split, switched off the same signal — the
scoring function — inside `applyStageBias`, so no call site has to remember it.

| | finals | open |
|---|---|---|
| engagement rate | 0.02 | 0.03 |
| exposure bias | 8.5 | 8.5 |
| exposure floor | 0.18 | 0.18 |
| streak chance / cap | 0.7 / 3 | 0.85 / 5 |
| crowd seeking | 0 | 8 |

The engagement rate is two orders of magnitude below what this table used to
carry, because it no longer stands alone: it is multiplied by how hard the circle
is pressing, and in the early game that term is small on purpose.

Crowd seeking is the one that mattered and it is worth saying why. Engaging
harder could not get the Play-In leader past about five eliminations a match at
any setting: after a kill or two there is nobody else within range, so the
ceiling was spatial rather than statistical. A squad that wants a kill race has
to rotate *toward* people. In a final it must not — there, empty ground is what
everybody wants — so the term is zero there and only the open stage turns it on.

### Measured, and still short

`node tools/playin-calibration.js` reproduces this: 500 duos, 22 games in
reshuffled 50-team lobbies, the app's own Play-In scoring.

| | open profile, now | when it was emptying the lobby | real |
|---|---|---|---|
| leader elims/match | 5.32 | 6.91 | 9.8–12.8 |
| leader avg placement | 7.82 | 17.28 | 16.9–17.8 |
| lobby alive at zone 3 | 88% | 21% | 81% |

The middle column is what the profile used to produce, and it looks better on
two rows out of three. It was not: it hit the leader's average placement by
emptying the lobby, and a stage where four squads in five are dead before the
third circle closes is broken in a way anybody can see — it was reported three
times from three different stages before it was measured.

So the leader's numbers are the ones written down as short. It farms about half
what a real Play-In leader farms and places far better than one, and both come
from the same place: in a field spread from 70 to 106, with the duel exponent
the app uses, the best duo simply wins its fights. Making it lose them means
either a flatter duel or a lobby that dies around it, and the second is what was
being done. This is a real deficit and it stays visible rather than being tuned
away, exactly as the finals' average placement does.

The test now asserts what actually distinguishes an open stage — it engages
more, seeks company and allows longer streaks — and asserts that both profiles
agree on how catchable a squad is, because that belongs to the map rather than
to the stage. Flattening the two profiles back into one, or reopening the gap on
exposure, would break loudly instead of silently.
