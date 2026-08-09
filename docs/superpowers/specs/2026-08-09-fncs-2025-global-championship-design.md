# FNCS 2025 Global Championship — the LAN that ends the season

9 August 2026

## What this adds

A LAN leg for the 2025 set, the way Major 1 2026 continues into the Summit and
Major 2 2026 into Antwerp. Win a seat in your Major 3 Grand Final and you fly to
**Lyon-Décines, 6–7 September 2025**: 33 trios, 12 games over two days, six a day,
$2,001,000 on the table.

It also brings the season's roster rule into Major 2, and gives the LAN the weight
in a Major 3 card's rating that it has in 2026.

## What the rules actually say

Epic's own FNCS 2025 rules are the source for all of this
(`fortnite.com/news/fncs-2025-official-rules`, saved as
`~/Desktop/GLOBAL 2025/gc2025-rules.json`).

### Seats, by Major and region (section 6)

Advancement is decided by each Major's Finals Leaderboard.

| | EU | NAC | NAW | BR | ASIA | ME | OCE | total |
|---|---|---|---|---|---|---|---|---|
| Major 1 | 2 | 2 | 1 | 1 | 1 | 1 | 1 | **9** |
| Major 2 | 5 | 3 | 1 | 1 | 1 | 1 | 1 | **13** |
| Major 3 | 4 | 2 | 1 | 1 | 1 | 1 | 1 | **11** |

33 in total. What actually travelled was 8 / 13 / 12 — a Major 1 seat went unused
and Major 3 carried one more, which the rules allow: an unused advancement spot
passes to the next-highest team in that region, or to another region of Epic's
choosing. **The nominal table is what the simulation runs on and the real field is
what fills it**; the one-team difference is recorded, not modelled.

### The roster lock (section 4.1.7)

> A player who has qualified for the Global Championship from a Major is locked to
> that qualifying trio for the Global Championship **and for any following Major**.
> To enter a following Major with a new team, all three must unanimously disband,
> forfeiting the trio's advancement spot.

Separately: a player who reached a Major's Finals through the Last Chance Lobby is
locked to the team they played it with.

This is the same rule the 2026 branch already implements for duos —
`lockedDuosForSet()` holds a Summit-qualified pair together through Major 2, and
`LOCKED_DUO_SUBS` lets the survivor of a drafted pair carry the LAN seat to
whoever they entered with instead. Trios need the same mechanism with one more
seat in the team.

## The field

`~/Desktop/GLOBAL 2025/gc2025-qualification.json` carries all 33 trios as
Liquipedia records them — three players each, with country and club, grouped by
the Major they came through.

The player's own seat is **earned, not granted**: the eleven Major 3 seats are
played for in their own Major 3 run under the table above, and the other 22 are
the real Major 1 and Major 2 qualifiers. Whichever real Major 3 trios the player
did not displace fill the rest of that Major's allocation.

Final standings, prize money and the day-by-day results are on the Liquipedia
page; the drop map is `~/Desktop/GLOBAL 2025/photo_2026-08-09_20-15-33.jpg`.

## Rating

A Major 3 card is rated on S36, and the LAN becomes the heaviest thing in that
ledger — weight **3.0**, against 2.0 for a regional Grand Final, which is exactly
what the Summit is worth in the 2026 tables. Nothing else in `S2025_WEIGHT`
moves, and Majors 1 and 2 are untouched: neither had a LAN of its own.

## Nationalities and photos

The Liquipedia field gives a verified country for all 99 players at the LAN, which
is a better source than Tracker's duo flag and should win over it the same way
`natSource:'liquipedia'` already wins in the cross-fill. Player photos come from
the individual Liquipedia pages; `photos/` already holds 106 and the rest are
fetched by name.

## Out of scope

- Simulating the Major 1 and Major 2 seats. Those 22 trios are real data and stay
  real, which is the whole reason the LAN field is worth having.
- The Last Chance Lobby roster lock. It binds a team within one Major, which the
  simulation does not model at that granularity today.

## How it gets verified

- The eleven Major 3 seats add up per region, and the field always reaches 33.
- A locked trio never appears split across two teams in Major 2, and a trio the
  player broke into always seats its survivors with a new third.
- Ratings: every card outside `t3` is byte-identical before and after; `t3` moves
  only where a LAN result exists to move it.
- One full run: Major 3 → a seat in Lyon → 12 games → a champion.
