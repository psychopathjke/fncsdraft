# Competitive storm and Storm Surge by era, 2019–2026 (sourced)

Researched 2026-10-29. fortnitetracker.com and tracker.gg were not used.
Key to sources:
- [W] Fortnite Wiki "The Storm", current text (as of v41.20) plus its patch-history section: https://fortnite.fandom.com/wiki/The_Storm
- [Wr:DATE] the same page as an older revision, fetched through the MediaWiki API (`action=query&prop=revisions&titles=The_Storm&rvstart=DATE`)
- [WC] Wiki "Competitive (Gamemode)": https://fortnite.fandom.com/wiki/Competitive_(Gamemode)
- [AMA] Epic, Competitive AMA Transcript, 1 Jun 2019: https://www.fortnite.com/news/competitive-ama-transcript
- [B22] Epic, C3S3 Competitive Storm Surge Update, 20 Jul 2022: https://www.fortnite.com/news/fortnite-chapter-3-season-3-competitive-storm-surge-update
- [DX18] Dexerto, 6 Dec 2018: https://www.dexerto.com/fortnite-battle-royale/epic-games-announces-explorer-pop-up-cup-set-to-begin-with-season-7-243188/
- [T22] @FNCompetitive, 19 Jul 2022: https://x.com/fncompetitive/status/1549492690622062594
- [T23a] @FortniteStatus, 10 Mar 2023 (Solo/Duo): https://x.com/FortniteStatus/status/1634225450376474625
- [T23b] @FortniteStatus, 10 Mar 2023 (Trios): https://x.com/FortniteStatus/status/1634225452842733578
- [T23c] @FortniteStatus, 11 Apr 2023 (Performance Evaluation): https://x.com/FortniteStatus/status/1645811815765426177
- [T23d] @FortniteStatus, 11 Apr 2023 (later circles move in all BR "similar to Competitive"): https://x.com/FortniteStatus/status/1645906136657174531
- [T24] @FortniteStatus, 20 Feb 2024 (Duos Cash Cup test): https://x.com/FortniteStatus/status/1759972547624628305
- [T25a] @FNCompetitive, 1 Oct 2025 (net-damage test): https://x.com/FNCompetitive/status/1973454025195430079
- [T25b] @FNCompetitive, 23 Oct 2025 (net damage in all BR tournaments): https://x.com/FNCompetitive/status/1981360625390338199
- [V24] Wiki "Update v24.00" page, copying Epic's "Mega Forecasting" note: https://fortnite.fandom.com/wiki/Update_v24.00
- [EPIC17] Epic, "Unreal Engine Improvements for Fortnite: Battle Royale" (2017): https://www.unrealengine.com/tech-blog/unreal-engine-improvements-for-fortnite-battle-royale

The tweet texts were read through api.fxtwitter.com. Both Epic blog posts were read in full in a browser.

## Main caveat: no competitive-specific storm table was ever published
I found no Epic rulebook, blog or tweet giving per-zone wait, shrink, DPS and radius for tournaments in any era. What the sources do say:
- Competitive used the standard BR timings with different movement. Phase 5 forms "half in, half out", phases 6–9 move fully, and phases 7–9 have no wait [WC], [Wr:2023-01-01].
- The wiki claims Arena's first zone closed 30 s slower than in public matches. It gives no exact numbers [WC].
- From v10.20, moving zones were removed from public playlists but kept in competitive ([W], v10.20 history).
- From Apr 2023 (v24.20), later circles move as they close in all of BR, "similar to Competitive play" [T23d].

So every table below is the **public BR table** from the same period. Competitive-only timing changes are **UNKNOWN**.

## Era tables (public BR storm in force at the time)

### Chapter 1 S8–X (2019) and Chapter 2 (2020–2021): 9 zones [Wr:2019-07-01], [Wr:2020-08-01], [Wr:2021-07-01]
| Zone | Wait | Shrink | DPS while shrinking / after |
|---|---|---|---|
| 1 | 200 | 180 (2019); 240 (wiki from 2020) | 1 / 1 |
| 2 | 120 | 120 | 1 / 2 |
| 3 | 90 | 90 | 2 / 5 |
| 4 | 80 | 70 | 5 / 8 |
| 5 | 50 | 60 | 8 / 10 |
| 6 | 30 | 60 | 10 / 10 |
| 7 | 0 | 55 | 10 / 10 |
| 8 | 0 | 45 | 10 / 10 |
| 9 | 0 | 75 | 10 / 10 |

- Radii: **UNKNOWN**. The 2019–2021 revisions carry no size column.
- Notes: v7.40 changed zone 9 shrink to 75 s [W]. The v13.00 storm returned with the same damage [W]. Dynamic storm (shorter waits at low player counts) was added on 22 Nov 2021 [W]. Whether competitive used it is UNKNOWN.

### Chapter 3 (2022) and Chapter 4 S1: 9 zones [Wr:2022-07-01], [Wr:2023-01-01]
- Timings and DPS are the same as the table above. Zone 1 shrink is 240 s, and zone 0 forms 60 s after the bus's last stop.
- Size column, labelled "Storm Eye **Diameter** after closing", for zones 1–9: 1600, 800, 400, 200, 100, 50, 35, 20, 0 m.
- The v24.00 history in [W] uses the same numbers (800, 400, 200 m…) but calls them **radius**. So whether these are diameters or radii is **UNKNOWN**.

### Chapter 4 S2 (v24.00, Mar 2023) onward: 12 zones (from [W] v24.00 history)
| Zone | Wait | Shrink | DPS | Radius |
|---|---|---|---|---|
| 1 | 120 | 120 | 1% | 1200 m |
| 2 | 90 | 90 | 1% | 950 m |
| 3 | 105 | 90* | 1% | 700 m |
| 4 | 90 | 90 | 1% | 550 m |
| 5 | 60 | 60* | 1% | 325 m |
| 6 | 60 | 60* | 2% | 200 m |
| 7 | 60 | 60 | 5% | 100 m |
| 8 | 45 | 45* | 8% | 50 m |
| 9 | 30 | 45 | 10% | 25 m |
| 10 | 0 | 40 | 10% | 17 m |
| 11 | 0 | 40 | 10% | 11 m |
| 12 | 0 | 60 | 10% | 0 m |

- Cells marked * did not change in v24.00, so the value comes from [Wr:2024-06-01] (shrink 1:30 / 1:00 / 1:00 / 0:45).
- Damage is given as % of max HP. With 100 HP, 1% = 1 HP/s.
- v24.20 re-enabled the dynamic storm. Its thresholds and wait times are in [W]. Whether tournaments used it is UNKNOWN.

### Chapter 5 (2024)
- 4 Dec 2023 hotfix: zones 1–2 shrink +20 s [W]. No other confirmed table exists.
- A wiki revision from May 2024 [Wr:2024-06-01] lists a size column of 2200 / 1800 / 1400 / 1000 / 600 / 350 / 200 / 100 / 50 / 20 m. It contradicts the v24.00 values, so treat it as unreliable. C5 radii: **UNKNOWN**.

### Chapter 6 (2025) [Wr:2025-10-01], "as of C6S1"
| Zone | Wait | Shrink | DPS | Radius | Move |
|---|---|---|---|---|---|
| 0 | 60 | – | – | 1850 m | 0 |
| 1 | 120 | 110 | 1% | 1200 | 0 |
| 2 | 90 | 110 | 1% | 950 | 0 |
| 3 | 95 | 95 | 1% | 700 | 0 |
| 4 | 90 | 90 | 1% | 550 | 0 |
| 5 | 50 | 70 | 1% | 325 | 0 |
| 6 | 50 | 70 | 2% | 200 | 325 |
| 7 | 50 | 70 | 5% | 100 | 200 |
| 8 | 35 | 60 | 8% | 50 | 150 |
| 9 | 20 | 60 | 10% | 25 | 120 |
| 10 | 0 | 55 | 10% | 16.7 | 100 |
| 11 | 0 | 50 | 10% | 11.1 | 75 |
| 12 | 0 | 80 | 10% | 0 | 100 |

### Chapter 7 (2026) [W], public, as of v41.20 (29 Jul 2026 hotfix)
| Zone | Wait | Shrink | DPS | Radius | Move |
|---|---|---|---|---|---|
| 0 | 60 | – | – | 1500 m | 0 |
| 1 | 110 | 85 | 1% | 950 | 0 |
| 2 | 60 | 90 | 1% | 725 | 0 |
| 3 | 70 | 110 | 1% | 500 | 0 |
| 4 | 50 | 80 | 1% | 400 | 0 |
| 5 | 30 | 65 | 1% | 225 | 0 |
| 6 | 35 | 70 | 2% | 120 | 0 |
| 7 | 35 | 70 | 5% | 60 | 150 |
| 8 | 25 | 60 | 8% | 40 | 120 |
| 9 | 10 | 60 | 10% | 20 | 120 |
| 10 | 1 | 50 | 10% | 13.5 | 48 |
| 11 | 1 | 50 | 10% | 10 | 66 |
| 12 | 1 | 80 | 10% | 0 | 0 |

- Dynamic storm was disabled in v40.00, and again in all playlists from v41.30 [W].
- A secondary source says the July 2026 storm speed-up left competitive playlists unchanged: https://allthings.how/fortnite-speeds-up-the-storm-and-removes-triangle-circles-in-the-hotfix/
- The actual C7 competitive table is **UNKNOWN**.
- Comparison with the project's 2026 telemetry: its radii (950/750/525/325/200/100/50/25/16.5/11 m) do not match this public table. Competitive zone sizes have never been published.

## Storm Surge timeline
| When | What | Source |
|---|---|---|
| v6.31 (Nov 2018) | Introduced, competitive playlists only | [W] |
| Dec 2018 (S7 pop-up cups) | Max 3 activations. Checked after circle 2 closes (>70 alive), circle 4 (>50) and circle 6 (>30) | [DX18] |
| v8.00 | Also enabled in non-competitive playlists | [W] |
| By 1 Jun 2019 (2019 season) | Phases 0–1: 100; 2–3: 70; 4–5: 50; 6–9: 30 (surge only if alive > value). 25 dmg every 5 s to players under the damage threshold, 5 s warning, ends the moment the count reaches the cap | [AMA] |
| v10.20 | Damage to a B.R.U.T.E. no longer counts toward the threshold | wiki Update v10.20 |
| v10.31 | An eliminated teammate's damage is no longer removed from the team total | wiki Update v10.31 |
| 2020–2021 (Ch2) | No change found; values presumably still 70/70/50/50/30 (UNKNOWN whether changed) | – |
| v20.00 / v20.20 (2022) | Tick interval 5 s → 10 s, then back to 5 s | [W] |
| 19 Jul 2022 (Arena + Duos tourneys; Solo/Trios from 7 Sep 2022) | Phases 2–5 changed: 70→64, 70→54, 50→44, 50→40; 6–9 stay 30 | [B22]; the tweet numbers the same values as zones 3–6 [T22] |
| 10 Mar 2023 (v24.00, new 12-zone storm), Solo/Duo | Z0–1 none; Z2–3 90; Z4 78; Z5 64; Z6 54; Z7 44; Z8 40; Z9–12 30 | [T23a], [V24] |
| 10 Mar 2023, Trios | Z2–3 90; Z4 78; Z5 63; Z6 54; Z7 42; Z8 39; Z9–12 30 | [T23b] |
| 11 Apr 2023 (Performance Evaluation) | Z2 90; Z3 80; Z4 70; Z5 58; Z6 48; Z7 40; Z8 30; Z9–12 26 | [T23c] |
| 20 Feb 2024 (Duos Cash Cup test, considered for the C5S1 FNCS GF) | Z2–3 90; Z4 74; Z5 60; Z6 50; Z7 40; Z8 36; Z9–12 26 (all zones after the 4th −4) | [T24]; the wiki listed the same values in May 2024 [Wr:2024-06-01] |
| Current wiki (BR/Reload/OG, undated) | Z2–3 90; Z4 78; Z5 64; Z6 54; Z7 44; Z8 40; Z9–12 30 | [W] |
| 2 Oct 2025 | Net damage (dealt − taken, only damage between non-downed players, carries through elimination/reboot) tested in Performance Evaluation Cups | [T25a] |
| 23 Oct 2025 | All BR tournaments use net damage; "player caps remain the same as before" | [T25b] |

- **Damage per hit**: 25 every 5 s, in every era that has a source (except the v20.00–v20.20 window, when the interval was 10 s).
- **Threshold damage value** (how much damage gets you safe): never published. The wiki's version is that players under the threshold get hit, and Epic's is "players that have dealt the least amount of damage" [B22]. The exact formula is **UNKNOWN**.
- **Scaling with lobby size**: the thresholds count players alive, not teams. The only team-size-specific table is Trios in C4S2 [T23b], which differs from Solo/Duo by 1–2 players. There is no evidence of scaling for 50 duos / 33 trios / 25 squads. Squads values are **UNKNOWN**.
- Your table (Inf, 90, 90, 74, 60, 50, 40, 36, 26, 26, 26) matches exactly the 20 Feb 2024 Duos values [T24] (Epic zone N = your zone N).

## Map size
- 2017 Chapter 1 launch: "5.5 km²" playable area [EPIC17].
- The zone 0 radius gives a rough island scale: 1850 m in C6 [Wr:2025-10-01] and 1500 m in C7 [W].
- Island width in game units for any chapter: **UNKNOWN**. No datamined source was found. 1 m = 100 uu is the Unreal default and is not Fortnite-confirmed here.

## Gaps (UNKNOWN)
- A competitive-only storm table for any era.
- Pre-2023 radii in game units.
- Squads surge values.
- 2025–2026 surge caps beyond "unchanged".
- Chapter 2 surge changes.
- Map widths.
