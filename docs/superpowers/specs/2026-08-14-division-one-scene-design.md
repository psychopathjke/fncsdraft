# The scene, and your place in it

14 August 2026

Supersedes the first draft of this file, which covered only the Division 1
simulation and a feed to report it. The feed grew into a screen, and the screen
needs a number behind it.

## What this is for

Two holes, and they are the same hole from opposite ends.

**Division 1 does not exist between your own runs.** `careerCupField` draws its
lobby fresh every week — real duos out of the roster, shuffled, a different 150
each time — so there are no standings, no form, and nobody whose year is going
anywhere. A career climbing through Division 4 has no idea who is winning above
it.

**And the career has no presence.** A player is a rating and a division. Nobody
outside the lobby knows they exist, clubs look only at the number, and a career
below Division 1 earns nothing at all, because that is where the prize money
starts. The scene cannot see you and you cannot see the scene.

## What runs

**The Division 1 cup is simulated in full on every day it is played** — 150
duos, 11 games, the same engine and the same scoring as the player's own run.

When the player is in Division 1, their run *is* that cup: the standings come
out of the run they just played and nothing extra is simulated. Only while they
are below does the cup run headless, once per cup week.

**Only Division 1.** Divisions 2 through 5 are generated ladder players — the EU
roster has nothing below OVR 60, which is why those rungs are generated at all —
so there is nobody there worth reporting on and nothing measured to report.

### The field, drawn once

Drawn at the start of the career year by the rule `careerCupField` already uses:
whole real duos out of the roster first, then the rest of the roster paired by
rating to fill the lobby. Those 150 duos are then the division for the year.
Same people every cup, which is the point — a table means nothing if the names
change weekly.

The player's own promotion into Division 1 is the only thing that moves anybody:
they take the seat of the duo standing last in the season table, and the feed
says so. Nobody else is promoted or relegated.

### What is kept

A season table for Division 1: per duo, their placement and points in each cup,
their total, and how many times they finished in the top ten.

**Ratings do not move.** A duo's form develops across the year — a good run, a
bad run, a streak in the top ten — but the numbers on the cards stay the ones
measured off the roster. What develops is the season, not the people. A career
save does not get to quietly drift the roster somewhere else over 38 weeks.

## The Social screen

Built as a shell on 14 August: the `DMs` tab became `Social`, holding a feed and
the messages as two halves of one screen, switched with a pair of pills. It
opens on the messages when one is waiting and on the feed otherwise. The centre
keeps a strip of the last five headlines, which is a glance; the whole feed
lives here.

What the feed carries, once Division 1 is alive:

- Your own lines, which it already carries.
- The winner of each Division 1 cup, the rest of the podium, and a duo whose
  streak is worth remarking on — a third top ten in a row, or a collapse after a
  strong start.
- Your own posts.
- Mentions of you when you are in Division 1 and finished somewhere worth
  naming.

Every line comes out of the season table, never a bag of flavour text, so the
feed can never say something the standings do not. Real handles are attached to
real simulated placements — which is what these players post — and nothing else
is put in their mouths.

## What gets posted

The shape of a post is built — author, handle, when, line, actions. What is
missing is things worth posting. This is the catalogue, and most of it needs
Division 1 alive first, because a post about somebody else is only true if
somebody else played.

**New duos, announced at the start of a season.** A pair holds for a year and
splits after bad results; the change, when it comes, comes at the turn of a
season and gets announced. This is the one item here that is not only a post:
the partner market today runs on patience that drains from any bad week, so a
duo can dissolve in March for no reason the scene would recognise. It should
hold through a season and be decided between them. That is a change to
`careerApplyMorale` and the patience model, not to the feed, and it wants the
arc harness rerun after — a partner who leaves less often is a partner who
carries you further, and the growth band was measured with the old one.

**Placements.** A finish at a cup, and the things a finish means: through to the
heats, through to the Grand Finals, money out of the Performance Evaluation or
any other cup that pays. The scene's account posts these; the player's own
account posts their own.

**Org announcements.** A signing, a release, a contract renewed. The club's
name is already in the save and 39 of them have a crest in `logos/`.

**Stream announcements.** Going live. This is the one that has no result behind
it — it is a thing a player does rather than a thing that happened — so it
belongs with posting and reach rather than with the simulation.

More to come from the user; this list is open.

### Read off the account itself

`x.com/FNCompetitive` on 14 August 2026, scrolled — the account this feed's
press voice is modelled on. Four posts, and three things worth copying:

- **It talks to people, not about them.** "@F1shyX_ and @HutyFN take a huge step
  towards Globals!" — the players are mentioned, not described. Our posts about
  a result should carry handles the same way.
- **Power Rankings is a post and a table.** "Sky and Scroll continue to dominate
  PR!" over a twenty-row image: position, player, rating, from 39,532 down to
  36,754. That is a better second leaderboard for this sport than earnings —
  it maps straight onto the roster's own ratings, and it is what the scene
  actually posts about. Earnings stays specced; PR goes beside it.
- **A stream announcement is a real post type**, and it looks like this: "It's
  time for Last Chance EU! ✨", the twitch link, and a lobby code.

And the counts are proportional rather than arbitrary: across those posts, views
run 40 to 60 times likes, and likes 30 to 50 times replies. When followers exist,
the numbers under a post are derived from reach in that ratio — not invented per
post, and not left blank once there is something true to put there.

The profile page, which the earlier shots did not show: banner, avatar over it,
name, handle, bio, joined date, **Following and Followers**, then tabs for
Posts, Replies, Reposts, Media, Articles.

### And off a player's account

`x.com/ScrollSZN` — AG Scroll, who is in our roster and won our Major 1 in the
data. The press account shows how the scene talks; this shows how a player does.

**A bio is the career card written out.** His reads:

> 17 🇩🇰 | Fortnite for @AGGlobalEsports | 2x FNCS WINNER | 340k$+ | b.e @Elyxxm

Age, country, club, titles, career prize money. The career already holds every
one of those, so the profile assembles from what is there rather than needing
anything new. It also settles the earnings question from the other end: what a
player displays publicly is prize money, and the number in that bio is $340k+.

**A player's result post is the result, the partner, and the standings.** The
pinned one is "🏆1ST PLACE FNCS GRAND FINALS 120,000$ @SkySZN_ 🏆" — the finish,
the prize, the partner tagged. A recent one is "Frosted In Finals @SkySZN_
@EgeXJerG @AlwyzPAPPIE @AGGlobalEsports" over a screenshot of the **Performance
Evaluation** standings: first place, 335 points, 7 matches, 2 wins, 93
eliminations, "Top 50: 240 pts to qualify", and a panel reading Victory Royales
2, Top 5s 3, Top 10s 5, Total Elims 93, Avg Elims 13.3, Avg Placement 13.9.

That is our event and those are our fields. `cr.log` already stores games, wins,
elims, average placement, points and finish, so a result post can carry a small
standings card built out of the run that happened — no invention anywhere in it.

He also posts about a monitor he tested after a bootcamp. That is what reach
turns into, and it is the sponsorship half of the money the followers section
describes.

**A scale for followers.** The section above called followers the second
invented number. It is less invented than that: Scroll — a two-time FNCS winner
sitting at the top of Power Rankings — has 39.1K followers, and the scene's own
press account has 2.6M. So the top of our roster lands in the tens of thousands,
not the millions, and the curve underneath it is anchored at its top end by
something real.

## Clubs, and how they reach you

From the user, 14 August. Three things, and the first changes where a contract
comes from.

**Offers arrive in the feed, not in a tile.** A club writing to you is a message
addressed to you, so it belongs in the inbox beside everything else addressed to
you. The tile stays as the place a signed contract is read; the offer itself is a
DM from the club.

**The money has a ceiling per division.** Division 3 is where clubs start
looking, and it is where the numbers start too:

| division | wage |
|---|---|
| 3 | up to $100 |
| 2 | up to $300 |
| 1 | no ceiling — it scales with how big the player is |

"How big" is reach and results, which is the followers number this spec already
describes. That is the point where the two halves meet: below Division 1 a wage
is what the ladder says you are worth, and in Division 1 it is what the audience
says.

**A club can poach.** Having an org does not stop offers arriving. The choice
between the deal you have and the one being waved at you is the interesting part,
and it only exists if the offers keep coming.

### The academy

A big club does not sign an unproven Division 3 player to its main roster — it
signs them to an **academy**, and moves them up when they earn it.

So an offer carries which roster it is for. An academy deal pays the lower end of
the division's band and does not put the crest on the card; the main roster pays
the top of it and does. Promotion from one to the other is the club's decision,
made on results, and it arrives the way the offer did — as a message.

This gives a big club a reason to be interested in a player it would otherwise
ignore, which is the thing missing today: right now the weakest club in
`logos/` averages 71, so nobody looks at a career until Division 3 and the
biggest clubs never look at all until it is nearly over.

## Followers

**The second invented number in this mode, after fatigue,** and it is treated
the same way: small, bounded, and calibrated against something that *was*
measured rather than tuned by feel.

It grows from three things: a placement in a cup, weighted by how good it was
and how high the division; the tone of a post; and being in Division 1 at all,
which is worth more reach than Division 5.

**The anchor is the wage table.** 115 organisations carry measured salaries, and
`tools/career-org-check.js` already measures how often a career gets signed at
all. So the size of the reach effect is not chosen — it is whatever leaves the
signing rate inside the band that harness already reports. If reach starts
signing careers that were never signed before, the reach term is cut. The
measured table wins.

### What followers are for

Three hooks, each into code that already exists:

- **Clubs look at reach, not only rating.** `careerOrgOffers` gates on rating —
  about 65, Division 3 and up, because the weakest club in `logos/` averages 71.
  Reach becomes a second route in: a player with a following gets looked at a
  rung lower than their play alone would earn, and carries a wage premium. This
  is how esports actually signs people.
- **It pays.** Streams and sponsorship pay on reach, on the same cadence wages
  do. This matters most below Division 1, where a career currently earns nothing
  whatsoever — the first money a player sees should not have to wait for the top
  division.
- **Partners answer.** `careerDmWouldAccept` weighs rating and the last result.
  Reach joins them: a known player gets a yes that their rating alone would not.

## Posting

After a cup — and after the other things worth reacting to — the player is
offered two or three finished posts with different tone, and "don't post".

Each says what it costs on the button itself:

> «Шаг за шагом. Спасибо Rimo» — +120 followers, morale up
> «Лобби было слабое, не мой потолок» — +640 followers, morale down

Cocky reaches further and costs the partner; grateful is the other way round.
That is the whole mechanic, and it is a real choice because the partner is
already a system with patience that runs out.

**No free text.** The game cannot read tone, so it cannot answer for it, and a
post with no consequence is decoration.

## What it looks like

FIFA's career hub carries a **ТАБЛИЦА** tile — the league table, four rows deep,
two narrow columns for games and points, the club's own row first. It is in all
three reference shots in `Desktop\карьера\` (`photo_2026-08-14_17-12-29`,
`_17-14-20`, `_17-15-00`), and it is the shape the Division 1 table takes on the
hub: the top few duos, cups played, points, and your own row pinned when you are
in the division. The full table belongs on its own screen; the tile is the
glance.

Beside it FIFA carries a second leaderboard — **БОМБАРДИРЫ**, the top scorers,
a short list with a number against each name. Ours is **earnings**: who has won
the most money this year. It is the right second table for this sport, because
prize money is what a Fortnite career is measured in publicly — it is the number
Liquipedia keeps on every player — where goals are what a footballer is measured
in.

It needs two things that do not exist yet. Division 1 has to be simulated, so
there are other players to have earned anything. And the events have to pay:
today the Performance Evaluation is the only thing in the build that hands out
money at all, at $400 a Victory Royale, and the divisional cups below Division 1
pay nothing — which is also why a career currently earns nothing until it
arrives. Major prize pools are measured and are not in the build.

So the earnings table lands with the Majors, and until then the honest version
of it is short: the Performance Evaluation, and whoever has been winning games
in it.

The follower count sits in the hub header beside Season, Week and Earned.

Corners follow Fortnite's own Compete screen — 14px on panels — which the hub
already does as of 14 August.

## Depends on

Nothing in the day clock. This is buildable on today's build, which is why it
can follow the clock rather than wait on it.

## Not in this change

Promotion and relegation among the AI divisions. Posts about Majors, Reload cups
or the Performance Evaluation — the shape generalises to them and will be reused
when those become playable, but nothing is built ahead of them.

## Testing

- **`tools/career-d1-scene.js`**, new: runs a career year from Division 5 and
  checks that the Division 1 field is the same 150 duos in the last cup as in
  the first, that every cup week produced exactly one set of standings, that the
  season table's totals match the per-cup rows, and that no post makes a claim
  the table does not support.
- **`tools/career-org-check.js`**, existing: the signing rate must stay in the
  band it already reports. This is the calibration gate for the whole reach
  mechanic — if it moves, reach is too strong.
- **`tools/career-arc-calibration.js`**, existing: followers must not become a
  second growth curve. The rating arc is measured; reach does not touch it.
- **`tools/career-cup-calibration.js`**, existing: a headless Division 1 cup must
  produce the same distribution of placements as a played one. If the two
  disagree, the feed is reporting a different tournament from the one the player
  enters.
- **`tools/i18n-check.js`** and **`tools/check-ui-language.js`**: a feed is
  nothing but strings. Post templates are stored as a key and its numbers, the
  way the feed already stores its lines, so a career that switches language
  switches its posts too.
