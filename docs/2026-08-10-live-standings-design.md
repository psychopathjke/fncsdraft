# Live standings — design

Status: approved 10 August 2026.
Project: `C:\Users\FoxOS_User\Desktop\career`.

## What it is

Today a zone game plays out on the map and *then* its points land in the table.
The replay finishes, the rows animate, the next game starts. The table is a
report on something that already happened.

This makes the two one thing. While the map is playing, the standings above it
move with it: a squad dies on the island and the table reorders on the same
frame. When the last circle closes, the table is already showing the final
numbers — there is nothing left to award.

Nothing else changes. The gate stays where it is (All FNCS, duos), every other
mode keeps the model it has, and the engine's results are untouched.

## Why it can work at all

In a battle royale a squad's placement is known the moment it dies: it finishes
exactly as many places from the bottom as there are squads already out. Nothing
that happens afterwards can change it. So the points a dead squad has earned are
final from the second it goes down, and the points a living squad has earned are
computable too — it is currently in as many places as there are squads alive.

That is what a broadcast leaderboard shows, and it is why the live table
converges rather than being made to converge. With twelve alive, every one of
the twelve is provisionally twelfth; each death lifts all of them one row. When
one is left it is first. The last frame's arithmetic is the same arithmetic the
end-of-game award does, so the two agree by construction.

## One clock

The map and the table are driven by the same frames.

There are two other ways to do this and both are worse. A separate timer over
the list of deaths would drift from the drawing — and being in step is the whole
request. Replaying the score after the game is what already happens. Sharing the
frames makes a mismatch impossible rather than unlikely: if the table is wrong,
the map is wrong in the same way at the same instant.

```
zone-sim.js            timeline frames        index.html
  simulateZoneGame  ─────────────────────▶  onFrame(frame)
       ▲                                         │
       │ dots: {x, y, alive, a, elims}           ▼
       │ events: who died, to what           liveScore(frame)
       │                                         │
  zone-replay.js  ◀── draws the same frame ──────┘
```

## The three changes

Each sits on its own side of an existing boundary, and none of them widens it.

### `zone-sim.js` — carry eliminations and place in the frame

A recorded dot has a position, a heading and whether the squad is alive. It does
not have how many players that squad has eliminated, though the engine knows: it
is `squad.elims`, already maintained for the result. Add it to the dot.

Add the finished place too, zero while the squad is still alive. The place of a
dead squad is derivable from the frames — count how many are still standing —
but not unambiguously: three squads die between two recorded frames and the
frames cannot say which of them took sixth and which took eighth. The engine
knows, because it knows the order it eliminated them in. Carrying the number is
exact where recomputing it is a guess.

Cost is a hundred small integers a frame against the eighty-five frames a game
records. The alternative — reading kills back out of the feed strings — means
parsing names that can contain anything, to recover numbers the engine has.

### `zone-replay.js` — say which frame is on screen

`play` takes an optional `onFrame(frame)` and calls it with each frame it draws,
interpolated ones included. The renderer learns nothing about standings; it
reports what it is drawing and the caller decides what that means. `show` is left
alone: the only caller driving its own clock is the demo page, which has no
standings to keep in step.

The frame is drawn before `onFrame` is called, not after, and the call is
wrapped so a throw inside it cannot escape. `onFrame` runs inside the same
timer callback that schedules the next frame and resolves `play`'s promise; an
observer that throws before that scheduling would leave the promise neither
resolved nor rejected, and a tournament awaiting it would hang forever.
Drawing first also means a broken observer costs its own updates, not the
map's.

### `index.html` — score the frame and reorder

In `simulateGamesLive`, when a game is being replayed, `onFrame` computes each
team's live total. Two rates, deliberately different, because they cost
different things:

- **Numbers change on every frame.** Writing new text into the points cells of
  rows that are already on screen is cheap and nothing moves, so a kill shows up
  the instant it lands.
- **Rows reorder at most once every 380ms** — the length of the row-move
  animation already in the file. Rows that reorder faster than they can travel
  interrupt each other halfway and read as noise, which is what the endgame
  would be: several deaths a second.

So a frame updates the text always and calls the existing row-render only when
the order has actually changed and the last reorder was long enough ago.

## Scoring a frame

For each team in the lobby:

```
live = points carried into this game
     + placePoints(place)
     + elims × killMultiplier
```

where `place` is:

- for a squad still alive: the number of squads alive in this frame;
- for a squad already out: the place it finished in, which is fixed at death;
- for a squad that lost its landing fight: its final place, known before the map
  starts.

The landing losers are the one case worth stating plainly. They are eliminated
before the game begins, they are ordered among themselves already, and the
existing code appends them to the bottom of the result. They are therefore
credited in full from the first frame and sit at the bottom of the table while
the map plays — which is exactly where they are.

## Edges

- **Skip.** The existing skip button stops the replay through `isSkipped`. When
  it fires, the game's real points are applied at once and the table jumps to
  the end state, as it does today.
- **Modes without a replay.** Multi-lobby stages and every non-zone mode never
  mount a replay, never pass `onFrame`, and are not touched.
- **A game too small to play back.** Below `REPLAY_MIN_SQUADS` the game already
  runs headless; the table keeps awarding at the end.
- **The engine's own result is authoritative.** The live score is a view. When
  the game ends, points are awarded by the existing code path from the engine's
  `order`, not accumulated from frames. Nothing can drift into the standings.

## Testing

The property that matters is checkable under node, without a browser: run a
recorded timeline through the live-score function and assert that the last
frame's totals are identical to what the end-of-game award produces for the same
game. That is the whole claim — the table converges on the truth — and it is a
test in `tools/zone-sim-test.js` rather than something watched.

Two smaller ones alongside it:

- every frame's live places are a permutation of 1..N, with no duplicates among
  the dead and every living squad on the same provisional place;
- a team's live total never decreases across the game, since neither placement
  nor kills can be taken away.

The browser check is the one thing a test cannot do: that the reordering reads
as a broadcast rather than as a flicker.

## Verified in the browser

The app was served locally and `simulateGamesLive` was driven directly with a
synthetic 50-duo field, with `isMajorMode = true` and `squadSize = 2`, and with
one contested landing zone holding three teams — the case the landing kill bonus
covers.

Fifty-four frames reached `onFrame` during the replay. The table's numbers changed
as the game played: sampled every 250ms, the first and last samples differed. The
table did not jump when the game's points were awarded. The live totals were
snapshotted at the moment the replay's promise resolved and again after the award:
the maximum difference across all fifty teams was zero points.

The contested drop did fire — three teams carried landing feed lines and one carried
the landing-fight-won line — so the zero difference was measured with the landing
kill bonus actually in play. This confirms the defect the task review caught and
the fix round closed: before the fix, a three-team contest winner would have jumped
16 points at that moment.

The skip path completed cleanly. `skipAnimation` was set true mid-replay, the run
finished, points were awarded, and no errors occurred. Modes without a replay are
untouched: TRIO (squad size 3), SQUAD (squad size 4) and non-Major duos all reported
`useZoneSim` false, mounted no replay, awarded points normally, and produced no
errors. Zero console errors occurred across every run.

Two things were not checked. A full career run through the user interface to a real
Regional Grand Final was not exercised; `simulateGamesLive` was called directly with
a synthetic field, so the surrounding flow — the landing picker, stage sequencing,
the skip button as a button — remains untested end to end. The visual quality of the
reordering was not verified by eye: that rows travel one at a time and never interrupt
each other mid-animation is confirmed in code and by review, not by watching.
