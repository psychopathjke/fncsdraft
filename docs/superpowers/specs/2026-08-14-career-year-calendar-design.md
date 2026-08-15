# The career calendar, a year long

14 August 2026

## What this is for

Career runs an eleven-week season on a made-up clock: week 1 starts on
5 January 2026 and everything after that is week plus seven days. The real year
is not shaped like that — it is three seasons of different lengths, with two
Majors, four Reload cups, a Global Championship and a weekly ladder that stops
and restarts. The calendar should be the real one.

## The year, measured

`tools/fortnite-2026-year.generated.js` holds it: 42 blocks with real dates,
read off Tracker's own event pages, where every window carries its BeginTime.
Nothing is typed from memory — a date not found is absent rather than guessed.

| month | what runs |
|---|---|
| Dec 2025 | Performance Evaluation opens the season |
| Jan | Reload Elite Series 1 — Opens, then Play-Ins |
| Feb | Reload 1 heats and final, divisional cups start, Reload 2 runs |
| Mar | Reload 2 final, Solo Victory Cup, S40 begins |
| Apr | **FNCS Major 1** — Play-In 6-7, Heats 17-19, LCQ 20-21, Final 25-26 |
| May | Reload Elite Series 3, ranked cups |
| Jun | Reload Elite Series 4, S41 divisional cups, ranked and victory cups |
| Jul | **FNCS Major 2** — Play-In 18-19, Heats 24-26, LCQ 27-28 |
| Aug | Major 2 Final 1-2, Global Championship Last Chance 3-14, **Reload Championship in Paris 18-21** |

The rhythm inside a block was counted off the window names rather than assumed:
a divisional cup is Monday and Tuesday with a Sunday final for Division 1, the
Performance Evaluation is one night of two rounds, a Reload cup is Opens on two
evenings, Play-Ins over two days, four heats in one night and the final two days
later.


## The Performance Evaluation

The one event that runs every week of the year, and the rules are printed on its
own page rather than inferred: **"You must be Duos Division 1 to participate in
this event"** and **"This event will occur over two rounds, with the top 40 teams
advancing to Round 2"**. It pays at the end of Round 2.

So in career it belongs to Division 1 alone, it is two rounds in one night, and
it is the only weekly thing a Division 1 player has beside the divisional cup.
Its nights are stored one by one rather than as a span, because a career
calendar has to put it on the right evening: 34 of them from 4 November 2025 to
13 August 2026, across four seasons — three nights in S38, thirteen in S39, ten
in S40, eight in S41.


### How it is scored, and why a simulation has to know

The two rounds are not the same tournament twice.

**Round 1** is eight games on the ordinary duo ladder: a Victory Royale adds 9
on top of everything below it, each of the top five adds 4, each of the top
twenty-five adds 2, and a kill is 1. Banked, that is 65 for a win, 56, 52, 48,
44, 40 and down to 2 for twenty-fifth — the same table the FNCS duo modes
already use, except a kill is worth one rather than four.

**Round 2** is four games and scores nothing but wins: **a Victory Royale is 100
points, an elimination is 0**. The rewards say the same thing — 100, 200, 300
and 400 points, which is one, two, three and four wins.

And it pays by the win: $400 a Victory Royale, so one win is $400, two $800,
three $1,200 and all four games $1,600. Round 1 pays nothing but the token into
Round 2, so every dollar in the evaluation comes from winning a game.

That second rule is the reason to read the tournament before simulating it. A
run that treats Round 2 as an ordinary points cup would have players farming
placement and kills for a score that does not exist: in Round 2 there is only
winning. The cut into it is the season own — the top fifty in S41, the top
forty by S38 own description.

## What changes in career

- **The clock.** `CAREER_WEEKS` and `careerDate(week, dow)` give way to real
  dates: a career runs from December to August and the calendar shows what was
  actually on that day.
- **The ladder.** Divisional cups stop being every week and run when they ran —
  February to mid-March, late March to late May, June to mid-July.
- **The Majors.** Three stages and an LCQ on their own days instead of one
  skippable week.
- **The Reload cups.** Four of them, on their real evenings, already in the
  build as a playable mode.
- **The season end.** The Global Championship and the Reload Championship close
  the year in August.

## What has to be decided while building

- A career season is currently eleven weeks and the loop advances one week at a
  time. A year is thirty-odd competitive nights spread unevenly, so "next week"
  becomes "next event".
- The divisional cup is the only thing a career player currently plays. The rest
  of the year is either playable (Reload cups, Majors) or a date on the calendar
  they cannot enter, and which of those each event is has to be said out loud.
