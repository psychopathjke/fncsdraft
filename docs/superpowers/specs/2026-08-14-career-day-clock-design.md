# The career clock, in days

14 August 2026

## What this is for

A career counts weeks: `CAREER_WEEKS=11`, `cr.week` from 1 to 11, and
`careerDate(week, dayOfWeek)` turning that counter back into a date by adding
seven days at a time from 5 January. The year it is meant to model is not
shaped like that, and it is already measured — `tools/fortnite-2026-year.generated.js`
holds 42 blocks of real dates, and the last commit put the Reload circuit on its
own evenings rather than on a career week.

Two things follow. The clock should be a date rather than a counter. And once it
is, the days between events stop being nothing: a year is thirty-odd competitive
nights and two hundred and something ordinary ones, and what a player does with
the ordinary ones is the mode.

## The clock

**`cr.day`, an ISO date, is the only clock in the save.** The week number is no
longer stored. Where a screen wants to say which week it is, it counts from the
start of the career year.

The career year runs **Monday 1 December 2025 to Sunday 23 August 2026** — 38
weeks. It opens on the week of the first Performance Evaluation night of S39
(4 December) and closes after the Reload Elite Series Championship in Paris
(18-21 August), which is the last block in the measured year. Both ends were
checked rather than assumed: 1 December 2025 is a Monday, and 21 August 2026 is
a Friday, so the last week runs to Sunday the 23rd.

`CAREER_WEEKS` and `careerDate(week, dow)` go. `careerEvents()` already returns
a Map of date to what runs that day; it stops building half of that Map through
`careerDate` and builds all of it from the three measured sources —
`FN_YEAR_2026`, `FN_PERF_EVAL_NIGHTS` and `RELOAD_CAL`.

Fifteen places read `cr.week` today. Nothing else in the file does, so the
change is contained.

### The blocks that say "weekly"

Most of the measured year is a span with a real start and end. Some spans are
one event repeating — `S39_FNCSDivisionalCup` runs 2 February to 14 March,
weekly — and those expand into days through `FN_YEAR_RHYTHM`, which was counted
off the window names rather than assumed: a divisional cup is Monday and
Tuesday, and Division 1 adds a Sunday final.

This is the only place where a day is derived rather than read. The rhythm is
still measured; it is the repetition that is inferred, and it is inferred from
the block's own start and end.

### Old saves

A save carrying `week` migrates to the Monday of that week counted from the old
season start, so a career in progress lands somewhere sensible rather than being
thrown away.

## The week is the screen, the day is the choice

The hub's calendar tab becomes a week: seven columns, Monday on the left.

A column holds either **an event** — then the day is taken, and the square shows
what runs and whether the player can enter it — or **a free day**, which takes
one thing the player chooses.

Under the week is one button, **Live the week**. It runs forward to the next
tournament the player is entered in, where the existing run opens, or to Sunday
if there is none. Thirty-eight presses carry a whole career year, rather than
two hundred and fifty.

A free day left empty is a day spent doing nothing: no gain, and no fatigue
either. Nothing is assigned on the player's behalf, and nothing nags them to
fill it.

The month calendar stays where it is, as the wider view.

## What it looks like

Four references sit in `Desktop\карьера\`: `dni.jpg`, which is this project's own
strip with the day cells marked out in red, and three shots of FIFA's career
hub — `photo_2026-08-14_17-12-29`, `_17-14-20` and `_17-15-00`.

They agree on furniture, and three pieces of it belong to this change.

**The day strip** — built, 14 August. The date is the big number, the weekday
sits above it, and a coloured pip with a word underneath says what is on:
teal for a divisional cup, orange for Reload, blue for the Performance
Evaluation, purple for a Major, red for the Global Championship, yellow for a
Weekly Final. The colour is never the only thing carrying it; the word is beside
it every time. The month and the week number sit at the right of the bar.

**The day's own panel**, which is FIFA's ТРЕНИРОВКА tile: a date, and three
rings reading физ. форма, тонус, настрой. Ours are **energy, fatigue and partner
morale** — the first two arrive with this change and the third already exists as
`careerPatience()`. That panel is where the day's activities are chosen, so it
replaces the reference's rings-only readout with rings plus the four buttons.

**A tile per entry point**, the reference's РАСПИСАНИЕ НА НЕДЕЛЮ: an icon, a
heading and one line of description. The week planner is reached this way rather
than through another tab.

**The event panel becomes Fortnite's own live-tournament card** —
`Desktop\карьера\ы.jpg`, which is what the game puts on screen while a
tournament is open. Top to bottom: a red LIVE pill with the time remaining,
"Match 1 of 11", the tournament's name large and italic, the running points as a
big number over a small "pts", the mode row, and the yellow Play button. Ours
carries the divisional cup — or whichever cup falls on that day — in place of
the reference's Ranked Cup, and the panel moves to the **left** of the hub with
the columns to its right, which is the side the game itself puts it on.

The pieces are all already on our panel; what changes is the order and the
weight. Today it reads cover, name, a big number, chips, button, with the week
in a corner badge. The reference leads with the state of the thing — live, how
long is left, which game of eleven — because that is what a player opening the
screen is asking.

The reference's ТАБЛИЦА belongs to the other spec, and its notification card is
the feed this hub already carries.

## Energy, and what a day holds

**Energy is 3 points and refills every morning.** Unspent energy is lost. It
shapes the day; it does not carry.

A tournament costs energy too — it is the most tiring thing in the week, and
whatever is left after it is what the rest of the day can hold.

### The day always asks

On a day with no tournament the player is **made to choose**. Not offered a
menu they can walk past: the day does not advance until something is picked,
because a day nobody decided is a day that may as well not be in the calendar.

Every option says on its face what it gives. No option is a mystery box.

| | energy | what it gives |
|---|---|---|
| **NOBL customs** | 2 | aim and clutch — real fights against people who can play |
| **Ranked** | 2 | survival and consistency, the grind that makes a floor |
| **Watch replays** | 1 | experience and survival: rotations, where you died and why |
| **Aim trainer** | 1 | aim, and only aim |
| **Scrim with your partner** | 2 | a little of everything, and partner morale |
| **Stream** | 2 | followers — and **nothing else**. No improvement, and less focus tomorrow. |
| **Rest** | 3 | takes fatigue off |

Streaming is the one that costs something real rather than merely spending the
day: it is the trade the mode is about. Reach pays, and the hours it takes are
hours not spent getting better.

### The shop

Prize money is spendable. The career carries a **balance**, and what it buys
makes training worth more:

- **A PC and a monitor** — the input the player actually has. Improves what
  close range and consistency can reach.
- **A coach** — a standing cost that multiplies what every training day gives.
- **Devices** — mouse, keyboard, pad: small, cheap, aim.
- **A bootcamp** — expensive, one-off, a large jump.

Wages fund it and prize money fills it, which is where the two numbers separated
last week finally matter: a career below Division 1 lives on its contract, and a
career in it lives on what it wins.

## Age, and what it is allowed to decide

Age currently decides two things and it should only decide one.

**Measured, and it stays:** where a card starts. The roster says FNCS is won by
teenagers — that is what the ceiling draw and the age edge on the card are built
from, and it is not a tuning choice.

**Invented, and it goes soft:** how fast anybody develops afterwards. The
development curve currently takes a thirty-year-old's rating *down* every week
until it hits the floor, so a player who makes themselves at 30 cannot climb at
all. That is my number, not a measurement, and it makes a whole way of playing
the mode impossible.

So: age sets what the card is worth on the day it is made, and after that a
career develops on its results like any other. Decline stays but late and shallow
— a career should fade, not be born fading.


## Fatigue

A scale from 0 to 100. Every activity adds to it, a tournament adds most, rest
takes it off. It does two things:

- **It cuts your play at a tournament.** A worn-out player enters the lobby
  below their own rating.
- **It is visible.** The news feed and the inbox say when a player is burning
  out, because a number that only lives in a formula is a number the player
  cannot plan around.

It does not touch training returns and it does not touch partner morale. Both
were considered and dropped: fatigue cutting tournament play is already the
whole tension — train hard and arrive tired, or arrive fresh and improve
slower — and a second and third channel would only make that trade harder to
read.

### The one place with nothing to measure

Every other number in this mode was taken from something: the roster answers who
competes, Epic's own pages answer how a tournament scores, real Grand Finals
results answer what a duo looks like. **There is no measurement of how tired a
Fortnite player gets.** This is the first invented system in the career, and it
is treated as one:

- The cut starts small — **no more than −6 OVR at 100 fatigue** — and it is a
  starting value, not a finding.
- `tools/career-arc-calibration.js` runs the season with energy in place and
  compares the arc against the band it measured before. If a career's rating
  arc leaves that band, the fatigue effect gets cut. The measured arc wins.
- The final number goes in the commit message and back into this document, the
  way every other table did.

## The six numbers become primary

Today a career card's six numbers are derived from its rating: `attrsFor` reads
`_targetOvr` as a floor and scales the six onto it. Training one number cannot
work that way round — the next call to `attrsFor` would flatten it.

So for the career player the six numbers become the truth and the rating is
computed from them. A rookie already carries its own six (`pl.attrs`). A card
taken from the roster gets its six snapshotted once, when the career starts, and
they live their own life from there — the roster itself is never written to.

## What else moves onto days

- **Wages.** An org's salary is paid as `salary/CAREER_WEEKS` today. With real
  dates it is paid on the first of each month, which is how clubs actually pay.
  Nine payments across a career year.
- **News, DMs and the log** stamp a date instead of a season and week number.
  The history screen is shaped like a Tracker profile, and Tracker shows dates,
  so it gets more honest rather than less.
- **The end of the year** is the Paris final, not week 11.
- **The next career year** reuses the same shape shifted by 52 weeks. Only 2026
  is measured, and a second measured year does not exist to copy. This is said
  out loud rather than hidden: the calendar of a second season is a repeat.

## Not in this change

Retirement, Majors playable inside a career, Division 1's Weekly Final prize
money, and the Global Championship all stay where they are. Days do not depend
on them and they do not depend on days.

## Testing

- **`tools/career-day-clock.js`**, new, headless Chrome against the real page:
  runs the career year end to end and checks that every measured event lands on
  its own date, that no day is skipped or visited twice, that wages arrive nine
  times, that energy never goes negative or exceeds 3, and that fatigue stays
  inside 0-100.
- **`tools/career-arc-calibration.js`**, updated: it counts in weeks today. It
  gets the day clock and then answers the question above — whether energy and
  fatigue moved the season arc out of the band it already measured.
- **`tools/check-career-cup.js`** drives the whole UI loop and will need the new
  week screen taught to it.
- **`tools/i18n-check.js`** has to pass. Every name this change puts on screen —
  the four activities, the energy and fatigue labels, the week header, the
  wage-day line — goes into both dictionaries in the same edit that adds it.
  A string in one language renders as nothing in the other, and only for the
  player who is not the author.

## 16 August 2026 — one bar, a cap on training, and the day that happens to you

Three things this spec described are gone or changed, and the reasons are the
user's own readings of the screen.

**A day is worth half a point of rating.** It used to be 0.07 — the activities'
gains are per-attribute and ATTR_W turns them into rating — and Division 5 to
Division 1 took three seasons of playing every cup. At half a point it takes
two. The gains are that half point spread over whatever the activity trains, so
on the weights every training row now sums to 0.500 and the shape of the card
still says where a year went.

**There is no drawn ceiling.** It was pulled once from the roster (471 cards, 75
to 96, median 81) and kept in the save, so a career's whole arc was decided at
creation: a 76 was never leaving Division 2 however it played. `careerPotential`
is the top of the scale now, 99, and nothing is stored — an old save's drawn
ceiling is ignored rather than migrated.

**Training tops out at the room you are in.** With no ceiling and 170 free days
a season, any per-day value worth having runs the whole scale inside a year: at
0.5 a career ended season one at 98, and stretching the taper six times wider
still put it at 88. So the limit is the ladder rather than a number — training
stops at the division's own band plus four (58, 65, 72, 79, and 86 in Division
1), which is the calibration's "trained as far as this room can teach you, now
go and win": a duo at its band promotes about never, one at +3.5 promotes 19-42%
of the time. Everything above the cap is won — `careerApplyGrowth` still reads
the top of the scale — so the nineties are a record of results, not of days.

**Fatigue is gone; energy is a store.** There were two bars, and one of them
(energy) only ever meant "the day is not spent yet" while the other (fatigue)
quietly cut a day's value by up to half on a number nobody could act on. They
are one thing now: energy is spent by days (22-38 a training day, 35 a cup
evening), given back by nights (+12) and by a rest day (+45), and what a day is
worth never changes. The rhythm falls out of the numbers — about five days of
work off a full store, a rest day buying three more, so three on and one off —
and a week with two cup evenings makes the next one lighter by itself. The desk
can raise the store: the chairs (+10 Titan, +20 Embody, one slot), the standing
desk (+8) and the gym (+15) buy days rather than percentages, so a fully kitted
career carries 143 against a bare 100.

**Who you play with is who you learn from.** The development half of a result's
growth is multiplied by the gap to the partner: x1.5 ten points above, x1 level,
x0.7 ten below, capped both ways. The performance half is untouched, because the
field already knows how strong the pair was.

**Form.** A short memory of results in rating points, ±3 at the extreme, fading
0.15 a night, applied to the player's team through `careerYouTeam`. Honestly a
design choice: we never harvested the same duos week after week, so there is no
autocorrelation in the data to read a curve off. Only its size is argued — under
half a division's band.

**A day can arrive with something on it.** About one free day in six carries an
offer with two answers, both of which spend the day: a stronger duo a player
short, a showmatch, the sponsor wanting a video, the line going down. Drawn on
the date, so a reload cannot shop for a better one, and never on a day the
calendar already owns.

Measured after all of it, four careers from Division 5: Division 1 in season 3,
80 on arrival, 89 by season six.

Harnesses: `check-career-day-value` (the half point, the cap, the store, the
partner factor), `check-career-dayevents`, `check-career-shop` (the desk, the
slots, the stamina), `check-career-monthgoal`, `check-career-sponsor`,
`check-career-inbox`.
