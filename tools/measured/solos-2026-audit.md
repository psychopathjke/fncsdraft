# FNCS Solos 2026: real format vs career implementation (audit 29.10.2026)

Sources
- [R] Official rules, Epic, dated 31.08.2026: https://www.fortnite.com/competitive/rules-guidelines/rules-library/fortnite-championship-series-fncs-solos-2026-official-rules (read via Chrome; sections 2.2.2-2.2.10, Attachments A/B/C)
- [LQ] Liquipedia (API wikitext): Fortnite_Champion_Series/2026/Solos/Battle_Royale/Europe, /Europe/Fast_Track, /Europe/Heat_1, /Europe/Heat_2, /Europe/Last_Chance_Qualifier
  (note: Liquipedia uses "Champion Series", not "Championship Series"; there are no Liquipedia pages for qualifier rounds 1-3)
- Ours: scratchpad/solos-code.txt + index.html lines ~165950, ~169059-169230, ~170590-170730
- Epic news posts were not read separately. The rules page covers everything the brief asked about.

Placement scoring in every stage [R Att. A] = 60/53/49/47/46/45/44/.../1 for 50th, 0 below. Ours victoryR1Points gives the same values (checked 1=60, 2=53, 3=49, 4=47, 10=41, 50=1). Exception: in Heats and LCQ Final a Victory Royale scores **1000** instead of 60 [R 2.2.6/2.2.8; LQ p1=1000 on Heat 1, Heat 2 and LCQ pages; Fast Track p1=60].

Lobby: 100 players in every stage (Solos BR; LQ player_number=100 for FT, Heats, LCQ and Finals). Ours: field 100 everywhere except LCQ R1 (open room).

Kill caps: the rules have **no elimination cap** and no match cap beyond "max N matches per session". Ours: no killCap for the October stages (killCap is only on Solo Reload). MATCH.

---

## Stage 0: Qualifier Round 1 (Q1 and Q2)

| | Real [R] | Ours |
|---|---|---|
| Dates | Q1: 28 Sep + 29 Sep; Q2: 5 Oct + 6 Oct | **missing** (no calendar rows) |
| Sessions | 2 sessions of about 3 h, points added together | none |
| Matches | max 11 per session (22 total) | none |
| Elim pts | 2 | none |
| Entry | Top 200,000 Power Rankings; top 2,000 PR may skip straight to R2 (playing R1 means losing the skip) | everyone is effectively seeded into R2 |
| Advance | EU top 8,000; NAC 4,000; OCE/ASIA/ME/BR/NAW 2,000 to R2 | used only as the denominator in solosR2Cut |

## Stage 1: Qualifier Round 2

| | Real [R 2.2.3] | Ours q1r2 / q2r2 |
|---|---|---|
| Dates | Q1 3 Oct, Q2 10 Oct | 3 Oct, 10 Oct. MATCH |
| Sessions | 1 session of about 3 h | 1 |
| Matches | max 11 | 11. MATCH |
| Elim | 2 | 2. MATCH |
| Field | R1 advancers (EU 8,000) **plus** top-2,000 PR skippers who chose to skip | assumes exactly 8,000 / 4,000 / 2,000 |
| Advance | top 1,000 per region to R3 | cut = 100*1000/adv: EU 13, NAC 25, others 50. MATCH (slightly generous because skippers are not counted) |

## Stage 2: Qualifier Round 3

| | Real [R 2.2.4] | Ours q1r3 / q2r3 |
|---|---|---|
| Dates | Q1 4 Oct, Q2 11 Oct | 4 Oct, 11 Oct. MATCH |
| Matches / elim | max 11 / 2 | 11 / 2. MATCH |
| Field | 1,000 | 100 room (= 1,000 scaled down) |
| Advance | Q1: top 100 to Fast Track; Q2: top 108 to Heats (all regions) | Q1 cut 10 to fast; Q2 cut 11 to heats (10.8 rounded up). MATCH |
| Q2 lockout | players who reached Fast Track via Q1 cannot play Q2 [R 2.2.2] | q2r2 needs !seat, so a fast/heats/final seat blocks it. MATCH |

## Stage 3: Fast Track

| | Real [R 2.2.5; LQ EU/Fast_Track] | Ours fast |
|---|---|---|
| Date | 10 Oct (same day as Q2 R2), about 2 h | 10 Oct. MATCH |
| Matches | max 4, one every ~30 min, missed match = last place | 4. MATCH |
| Elim | 4 | 4. MATCH |
| VR | 60 points, no instant qualification | no vr. MATCH |
| Field | Q1 R3 top 100 | 100. MATCH |
| Advance | top 8 to Finals; 9-100 (92) to Heats, snake-seeded (9th to H1, 10th H2, 11th H2, 12th H1, ...) | cut 8 to final, rest to heats. MATCH (heat split UNKNOWN in ours, see Heats) |

## Stage 4: Heats

| | Real [R 2.2.6; LQ Heat_1/Heat_2] | Ours heats |
|---|---|---|
| Dates | Heat 1 **17 Oct**, Heat 2 **18 Oct**; each player plays ONE heat | one row 17-18 Oct. Which day the player plays is UNKNOWN from the dump |
| Seeding | snake: FT 9-100 and Q2R3 1-108, giving 2 heats x 100 | 100 room; seeding not modelled |
| Matches | max 6, about 3 h, one every ~30 min | 6. MATCH |
| Elim | 3 | 3. MATCH |
| VR | **1,000 points**, instant Finals qualification, winner may not play more Heat matches | instant qualification + stopOnWin. MATCH. But the win scores **60, not 1,000** (soloHeatsPoints bonus removed; spec has no pts) |
| Advance | 6 VR winners + top **29 non-VR** players to Finals (= 35; LQ shows 35 per heat in EU); next **15** non-VR players (36th-50th) to LCQ Final | clean top 29 + VR winners. MATCH. Tail = **raw rank 36-50** in the points table. BUG, see #1 |
| Other regions | same 29/15 rule in every region | same |

## Stage 5: LCQ Round 1

| | Real [R 2.2.7] | Ours lcq1 |
|---|---|---|
| Date | 19 Oct, 1 session of about 3 h | 19 Oct. MATCH |
| Matches / elim | max 11 / 2 | 11 / 2. MATCH |
| Eligibility | played a Round 1 session and did not reach LCQ Final or Finals | `!!got && !seat`: played any of our stages and has no seat. MATCH apart from the missing R1 (top-2,000 PR skippers who never played R1 are NOT eligible in reality) |
| Field | open; size not published (all R1 non-advancers, likely tens of thousands in EU) | open room = careerVictoryField(true) = career ladder entrants x2 (~4.6k+), same in every region. UNKNOWN whether this is realistic |
| Advance | top 70 per region to LCQ Final | cut 70. MATCH |

## Stage 6: LCQ Final

| | Real [R 2.2.8; LQ EU/LCQ] | Ours lcqf |
|---|---|---|
| Date | 20 Oct, about 2.5 h | 20 Oct. MATCH |
| Field | 70 (LCQ R1) + 15 + 15 (Heats 36-50) = 100 | 100. MATCH |
| Matches / elim | max 5 / 3 | 5 / 3. MATCH |
| VR | 1,000 points + instant Finals, then stops playing | instant + stop. MATCH; scores 60 instead of 1,000 |
| Advance | VR winners + top **17** non-VR (= 22 in EU per LQ) | 17 clean + VR. MATCH |

## Stage 7: Finals

| | Real [R 2.2.9; LQ EU] | Ours final |
|---|---|---|
| Dates | 26 Oct + 27 Oct | 26-27 Oct. MATCH |
| Sessions | **2 sessions** of 6 matches, points added together | 12 games in one sitting (deliberate simplification; the total is the same) |
| Elim | 4 | 4. MATCH |
| Field | 8 FT + 35 + 35 Heats + 22 LCQ = 100 | 100. MATCH |
| VR | 60, no special rule | MATCH |
| Prize EU | 1st 60,000; 2nd 40,000; 3rd 25,000; 4th 15,000; 5th 12,500; 6th 10,000; 7th 9,000; 8th 8,000; 9th 6,000; 10th 5,000; 11th 4,000; 12th 3,000; 13th 2,500; 14th 2,000; 15th 1,500; 16-20 1,250; 21-25 1,000; 26-50 750; 51-75 500; 76-100 300 = **$253,500** (LQ prizepool 253,500 matches) | identical. MATCH |
| Prize NAC | 50k/30k/20k/10k/8k/6k/5k/4k/3k/2.5k/2k/1.75k/1.5k/1.25k/1k; 16-20 750; 21-25 500; 26-50 400; 51-75 300; 76-100 200 | identical. MATCH |
| Prize NAW | 12.5k/8k/6k/4k/3k/2k/1.5k/1.25k/1k/750; 11-20 500; 21-50 300; 51-75 200; 76-100 150 | identical. MATCH |
| Prize BR | 15k/10k/7.5k/5k/4k/3k/2k/1.5k/1k/750; 11-20 500; 21-50 300; 51-75 200; 76-100 150 | identical. MATCH |
| Prize ASIA/ME/OCE | 7k/4k/3k/2k/1.5k/1.25k/1k/750/500/400; 11-20 300; 21-50 200; 51-100 100 | ASIA table, with ME and OCE aliased to it (index.html 169073-74). MATCH |
| Tiebreak | points, then VRs, then **average** elims, then average placement, then seconds survived | points, then wins, then **total** elims. Minor |

---

## Prioritized mismatches

1. **BUG, Heats tail to LCQ Final (ccSolosSeat).** The rule is "next 15 players who did not win a VR" (non-VR ranks 30-44). Ours checks the raw points rank 36-50. Because a winner (a) scores only 60 instead of 1,000 and (b) stops playing after the win, winners usually sit far below 35th in `ranked`. So the raw rank 36-50 window is off by up to six places. Non-VR players at raw ranks 30+k..35 (k = winners in the raw top 35) get **no seat at all**, and the window covers 15 minus (winners inside 36-50) real players. Fix: compute the tail on the clean rank: `const cr=clean.indexOf(t)+1; if(cr>cut && cr<=cut+15) return spec.tailSeat;` (cut=29). Equivalently, define the tail as `[cut+1, cut+15]` over `clean`.
2. **VR worth 1,000 points in Heats and LCQ Final** [R, LQ]. Ours gives 60. This affects only the displayed board and point totals (qualification is already instant), plus bug #1. Either restore the 1,000 (pts override on heats/lcqf: place 1 gives 1000, otherwise victoryR1Points) or keep 60 and fix #1 by clean rank. The 29.10 comment says the bonus was removed on purpose ("947 on top"; the real figure is 1000 total, +940).
3. **Round 1 missing** (Q1 28-29 Sep, Q2 5-6 Oct: 2 sessions x 11 matches, elim 2, EU top 8,000 / NAC 4,000 / rest 2,000). Today every career player enters R2 for free. If you keep it out, at least gate R2 entry (for example, PR or division as a proxy for the top-2,000 skip). As a side effect, Q1 R2/R3 losers currently go straight to Q2 **R2**, but in reality they must replay Q2 R1 unless they are top-2,000 PR.
4. **Heats are two separate days** (Heat 1 on 17 Oct, Heat 2 on 18 Oct) with snake seeding from the FT and Q2R3 boards. Ours is one 17-18 row. Check which day the player's evening lands on, and seed by FT/Q2R3 place parity (FT 9 to H1, 10/11 to H2, 12 to H1...; Q2R3 1 to H1, 2/3 to H2, 4 to H1...).
5. **LCQ R1 eligibility:** real requires having played R1. PR skippers who started in R2 cannot play LCQ. Depends on #3; UNKNOWN impact without R1.
6. **LCQ R1 field size:** ours is the same open ladder room (about entrants x2) in every region. The real field is not published (UNKNOWN), but it is surely much larger in EU than in OCE/ME. Consider scaling by the region's R1 advancement (8,000 / 4,000 / 2,000) the way solosR2Cut does.
7. **R2 field** includes top-2,000 PR skippers, so the real share advancing is below 1,000/8,000. Our 13 / 25 / 50 is slightly generous. The exact number of skippers is UNKNOWN.
8. **Finals = 2 days x 6** in reality; ours plays 12 in one sitting. Same total, so this is cosmetic or a known simplification.
9. **Tiebreak** uses total elims instead of average elims, average placement and survival time. Minor.

No mismatch found in: dates of R2/R3/FT/LCQ1/LCQF/Finals; matches per stage; elim points per stage; placement table; R2 cut formula; R3 cuts (100 / 108); FT 8 + rest to Heats; Heats 29 non-VR; LCQ R1 top 70; LCQ Final 17 non-VR + VR; all seven prize tables (EU total $253,500); no kill cap (correct, the rules have none).
