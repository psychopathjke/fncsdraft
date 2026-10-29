# Pro meta loadouts per island (fncsdraft pools.json names)

Method / honesty note (29.10.2026):
- Web search this session found almost no pro/FNCS-specific loadout write-ups (guides are casual "best weapons" SEO pages; Reddit not indexed; fortnite.com competitive posts cover format, not loot). Fetches to esports.gg / playnews.gg returned 403.
- So most entries rest on my own knowledge of FNCS broadcasts and comp discourse (Ch1-Ch5 fairly solid, Ch6+ weaker), cross-checked where a source existed. Confidence reflects that.
- Order inside each list = what a pro takes first if both are on the floor.
- "NOT IN POOL:" = a meta item missing from that island's pool.
- "none" for move = the season had no real comp mobility item in pool (rotate with builds/launches/natural mobility).
- pools.json has NO g5/g6/g7 keys; only h1 covers Ch1 S8-S9.
- Season identification from pool contents: m1 = Ch7 S2 (Combat AR + Iron Pump + Thunder Burst + Skyline, not S1's Deadeye AR), m2 = Ch7 S3 (Extending Focus / Surgical Burst / Chaos Exploder / Lancehead are the S3 newcomers), s42 = Ch7 S4 "Override"-ish (8-Bit Shotgun) BUT it contains things reported vaulted in S4 (Oni Shotgun, Drum Gun, Ranger AR, Dual Pistols, Flare Gun, Bass Boost, Chug Splash) -> pool itself is suspect. r3 = Reload "Elite Stronghold" (Apr 2026, Cube Rifle / Cube Splitter, per fortnite.com).

```
h1: { // Ch1 S8-S9 (World Cup 2019)
  rifle:   ["Assault Rifle", "Heavy Assault Rifle", "Tactical Assault Rifle"],   // gold/purple SCAR first
  shotgun: ["Pump Shotgun", "Combat Shotgun", "Tactical Shotgun"],
  third:   ["Drum Gun", "Heavy Sniper Rifle", "Hunting Rifle"],                 // spray in builds / 2nd pump not possible
  move:    ["Rift-To-Go", "Shockwave Grenade"],
  heals:   ["Chug Splash", "Slurp Juice", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Pump vs Combat changed patch to patch in S9; Storm Flip/Boogie used defensively endgame. 'Bush' not a pro carry. Ch1 heals stacked 2 slots (splash + mini/big pots).",
  sources: ["https://fortnite.fandom.com/wiki/Season_9_(Chapter_1)", "https://liquipedia.net/fortnite/Fortnite_World_Cup/2019"],
  confidence: MED
}
h3: { // Ch1 Season X / Champion Series
  rifle:   ["Assault Rifle", "Heavy Assault Rifle", "Suppressed Assault Rifle"],
  shotgun: ["Pump Shotgun", "Combat Shotgun", "Tactical Shotgun"],
  third:   ["Drum Gun", "Heavy Sniper Rifle", "Suppressed Submachine Gun"],
  move:    ["Shockwave Grenade", "Junk Rift"],
  heals:   ["Chug Splash", "Slurp Juice", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Season X mobility (Rift-To-Go) mostly gone; B.R.U.T.E mech was removed/limited in comp. Shield Bubble used endgame as utility, not move.",
  sources: ["https://fortnite.fandom.com/wiki/Season_X"],
  confidence: MED
}
h4: { // Ch2 S1
  rifle:   ["Assault Rifle", "Burst Assault Rifle", "Heavy Assault Rifle"],
  shotgun: ["Pump Shotgun", "Tactical Shotgun"],
  third:   ["Submachine Gun", "Bolt-Action Sniper Rifle"],
  move:    ["none"],                                   // no mobility; boats/fishing; Harpoon Gun is utility
  heals:   ["Shield Potion", "Small Shield Potion", "Med Kit", "Bandage", "Bandage Bazooka"],
  notes:   "Classic AR/Pump/Tac-or-SMG + 2 heal slots. Fish (Flopper/Slurpfish) were heavily used but are NOT in the h4 pool.",
  sources: ["https://fortnite.fandom.com/wiki/Season_1_(Chapter_2)"],
  confidence: HIGH
}
i1: { // Ch2 S2
  rifle:   ["Assault Rifle", "Burst Assault Rifle"],
  shotgun: ["Pump Shotgun", "Tactical Shotgun"],
  third:   ["Submachine Gun", "Pistol"],
  move:    ["Crash Pad", "none"],
  heals:   ["Shield Potion", "Small Shield Potion", "Med Kit", "Bandage", "Bandage Bazooka"],
  notes:   "Decoy Grenade not carried by pros. Fish again missing from pool.",
  sources: ["https://fortnite.fandom.com/wiki/Season_2_(Chapter_2)"],
  confidence: HIGH
}
i2: { // Ch2 S3
  rifle:   ["Assault Rifle", "Burst Assault Rifle"],
  shotgun: ["Charge Shotgun", "Tactical Shotgun"],       // Pump vaulted, Charge was the comp shotgun
  third:   ["Submachine Gun", "Hunting Rifle", "Bolt-Action Sniper Rifle"],
  move:    ["Crash Pad"],
  heals:   ["Chug Splash", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Flare Gun used by some in endgame, not a staple.",
  sources: ["https://fortnite.fandom.com/wiki/Season_3_(Chapter_2)"],
  confidence: HIGH
}
i3: { // Ch2 S4 (Marvel)
  rifle:   ["Assault Rifle", "Burst Assault Rifle", "Scoped Assault Rifle"],
  shotgun: ["Pump Shotgun", "Combat Shotgun"],
  third:   ["Tactical Submachine Gun", "Suppressed Submachine Gun", "Bolt-Action Sniper Rifle"],
  move:    ["Shockwave Grenade", "Crash Pad", "Stark Jetpack"],
  heals:   ["Chug Splash", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Marvel Mythics/abilities largely disabled in comp. Port-A-Fort as endgame utility.",
  sources: ["https://fortnite.fandom.com/wiki/Season_4_(Chapter_2)"],
  confidence: MED
}
j1: { // Ch2 S5
  rifle:   ["Heavy Assault Rifle", "Assault Rifle"],
  shotgun: ["Charge Shotgun", "Lever Action Shotgun", "Tactical Shotgun"],
  third:   ["Rapid Fire SMG", "Suppressed Submachine Gun", "Bolt-Action Sniper Rifle"],
  move:    ["Shockwave Grenade"],
  heals:   ["Chug Splash", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Exotic weapons (bought with bars) existed but are NOT in pool. Harpoon Gun = utility.",
  sources: ["https://fortnite.fandom.com/wiki/Season_5_(Chapter_2)"],
  confidence: MED
}
j2: { // Ch2 S6 (Primal)
  rifle:   ["Assault Rifle", "Primal Rifle", "Infantry Rifle", "Makeshift Rifle"],
  shotgun: ["Pump Shotgun", "Primal Shotgun", "Tactical Shotgun"],
  third:   ["Submachine Gun", "Primal SMG", "Mechanical Explosive Bow"],
  move:    ["Shockwave Grenade"],
  heals:   ["Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Pump returned mid-season and became first pick; Primal Shotgun was the launch meta. Bows mostly casual.",
  sources: ["https://fortnite.fandom.com/wiki/Season_6_(Chapter_2)"],
  confidence: MED
}
j3: { // Ch2 S7
  rifle:   ["Assault Rifle", "Burst Assault Rifle", "Heavy Assault Rifle"],
  shotgun: ["Pump Shotgun", "Tactical Shotgun", "Lever Action Shotgun"],
  third:   ["Rapid Fire SMG", "Submachine Gun", "Bolt-Action Sniper Rifle"],
  move:    ["none"],                                   // Shockwaves not in this pool
  heals:   ["Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Alien Nanites carried as build utility by some. Inflate-A-Bull etc. not comp.",
  sources: ["https://fortnite.fandom.com/wiki/Season_7_(Chapter_2)"],
  confidence: MED
}
j4: { // Ch2 S8
  rifle:   ["Combat Assault Rifle", "Assault Rifle", "Burst Assault Rifle"],
  shotgun: ["Pump Shotgun", "Combat Shotgun", "Charge Shotgun"],
  third:   ["Submachine Gun", "Automatic Sniper Rifle"],
  move:    ["Shockwave Launcher"],
  heals:   ["Chug Splash", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Pump vs Combat Shotgun debated all season.",
  sources: ["https://fortnite.fandom.com/wiki/Season_8_(Chapter_2)"],
  confidence: MED
}
k1: { // Ch3 S1
  rifle:   ["MK-Seven Assault Rifle", "Ranger Assault Rifle"],
  shotgun: ["Striker Pump Shotgun", "Auto Shotgun", "Heavy Shotgun"],
  third:   ["Stinger SMG", "Hunter Bolt-Action Sniper Rifle"],
  move:    ["none"],                                   // no Shockwaves at launch; sliding/mantle
  heals:   ["Chug Splash", "Shield Keg", "Med-Mist", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "MK-Seven + Striker Pump is near-certain. Tent was a utility carry for some.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_3:_Season_1"],
  confidence: HIGH
}
k2: { // Ch3 S2
  rifle:   ["MK-Seven Assault Rifle", "Striker Burst Rifle", "Ranger Assault Rifle"],
  shotgun: ["Striker Pump Shotgun", "Ranger Shotgun"],
  third:   ["Stinger SMG", "Combat SMG", "Hunter Bolt-Action Sniper"],
  move:    ["Shockwave Grenade", "Rift-To-Go"],
  heals:   ["Chug Splash", "Shield Keg", "Med-Mist", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Comp kept building. Jetpack/Balloons were casual picks.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_3:_Season_2"],
  confidence: HIGH
}
k3: { // Ch3 S3
  rifle:   ["Hammer Assault Rifle", "Striker Burst Rifle", "Ranger Assault Rifle"],
  shotgun: ["Striker Pump Shotgun", "Two-Shot Shotgun"],
  third:   ["Stinger SMG", "DMR"],
  move:    ["Crash Pad", "none"],
  heals:   ["Chug Splash", "Shield Keg", "Med-Mist", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "CONFIRMED comp rule: June 7 2022 hotfix vaulted Shockwave Grenade and Heavy Sniper Rifle from competitive playlists, Rift-To-Go and cars removed; DMR replaced snipers. So do NOT give comp bots Shockwave Grenade / Rift-To-Go / Heavy Sniper Rifle in k3. Grapple Glove stayed in comp but NOT IN POOL.",
  sources: ["https://www.esports.net/news/fortnite-season-3-competitive-mobility-gets-vaulted/", "https://fortnite.fandom.com/wiki/Chapter_3:_Season_3"],
  confidence: MED
}
k4: { // Ch3 S4
  rifle:   ["Ranger Assault Rifle", "Hammer Assault Rifle", "EvoChrome Burst Rifle"],
  shotgun: ["Prime Shotgun", "Lever Action Shotgun", "EvoChrome Shotgun"],
  third:   ["Rapid Fire SMG", "Cobra DMR"],
  move:    ["Shockwave Grenade", "Crash Pad", "Launch Pad"],
  heals:   ["Chug Splash", "Shield Keg", "Med-Mist", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Weakest-remembered Ch3 season; shotgun order is a guess between Prime and Lever.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_3:_Season_4"],
  confidence: LOW
}
e1: { // Ch4 S1
  rifle:   ["Red-Eye Assault Rifle", "Assault Rifle", "Burst Assault Rifle"],
  shotgun: ["Thunder Shotgun", "Maven Auto Shotgun"],
  third:   ["Twin Mag SMG", "DMR"],
  move:    ["Shockwave Hammer", "Launch Pad"],
  heals:   ["Chug Splash", "Shield Keg", "Med-Mist", "Slap Juice", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Shockwave Hammer was THE Ch4S1 mobility. Ex-Caliber Rifle is a Mythic (not standard comp carry). Port-A-Bunker used as endgame utility.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_4:_Season_1"],
  confidence: MED
}
e2: { // Ch4 S2 (MEGA)
  rifle:   ["Red-Eye Assault Rifle", "Havoc Suppressed Assault Rifle"],
  shotgun: ["Havoc Pump Shotgun", "Maven Auto Shotgun", "Combat Shotgun"],
  third:   ["Twin Mag SMG", "Submachine Gun", "Cobra DMR"],
  move:    ["none"],                                   // NOT IN POOL: Kinetic Blade (the season's comp mobility)
  heals:   ["Slap Juice", "Chug Splash", "Shield Keg", "Slurp Juice", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Kinetic Blade + grind rails were the mobility; Kinetic Blade missing from e2 pool. Shield Bubble endgame utility.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_4:_Season_2"],
  confidence: MED
}
e3: { // Ch4 S3 (WILDS)
  rifle:   ["MK-Alpha Assault Rifle", "Havoc Suppressed Assault Rifle"],
  shotgun: ["Havoc Pump Shotgun", "Lever Action Shotgun", "Maven Auto Shotgun"],
  third:   ["Thermal DMR", "Combat SMG"],
  move:    ["Shockwave Grenade", "Cloak Gauntlets"],
  heals:   ["Slap Splash", "Slap Juice", "Slurp Juice", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Vines/ziplines are map mobility, not items. Kinetic Boomerang mostly casual.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_4:_Season_3"],
  confidence: LOW
}
e4: { // Ch4 S4 (Last Resort / heist)
  rifle:   ["Havoc Suppressed Assault Rifle", "Twin Mag Assault Rifle"],
  shotgun: ["Infiltrator Pump Shotgun", "Sharp Tooth Shotgun", "Maven Auto Shotgun"],
  third:   ["Thermal DMR", "Combat SMG"],
  move:    ["Crash Pad Jr.", "Rocket Ram"],
  heals:   ["Chug Splash", "Slap Splash", "Slurp Juice", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Shotgun order uncertain (Infiltrator Pump vs Sharp Tooth). Business Turret not a pro carry.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_4:_Season_4"],
  confidence: LOW
}
f1: { // Ch5 S1 (Underground)
  rifle:   ["Nemesis AR", "Striker AR", "Enforcer AR"],
  shotgun: ["Hammer Pump Shotgun", "Frenzy Auto Shotgun"],
  third:   ["Hyper SMG", "Thunder Burst SMG", "Reaper Sniper Rifle"],
  move:    ["Shockwave Grenade", "Crash Pad Jr."],
  heals:   ["FlowBerry Fizz", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Nemesis + Hammer Pump/Frenzy + SMG + Shockwaves + Fizz is the well-known Ch5S1 comp kit. Port-A-Bunker endgame utility. Grapple Blade = Mythic.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_5:_Season_1"],
  confidence: HIGH
}
f2: { // Ch5 S2 (Myths & Mortals)
  rifle:   ["Nemesis AR", "Warforged Assault Rifle", "Tactical Assault Rifle"],
  shotgun: ["Gatekeeper Shotgun", "Hammer Pump Shotgun", "Frenzy Auto Shotgun"],
  third:   ["Thunder Burst SMG", "Harbinger SMG", "Huntress DMR"],
  move:    ["Shockwave Grenade"],
  heals:   ["Chug Splash", "FlowBerry Fizz", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Wings of Icarus is a Mythic/medallion-type item, not a standard carry. Shield Bubble Jr. + Port-A-Bunker endgame.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_5:_Season_2"],
  confidence: MED
}
f3: { // Ch5 S3 (Wrecked)
  rifle:   ["Combat Assault Rifle", "Enforcer AR", "Tactical Assault Rifle"],
  shotgun: ["Combat Shotgun", "Gatekeeper Shotgun", "Hammer Pump Shotgun"],
  third:   ["Thunder Burst SMG", "Harbinger SMG", "Boom Bolt"],
  move:    ["Nitro Fists", "Shockwave Grenade", "Crash Pad Jr."],
  heals:   ["FlowBerry Fizz", "Nitro Splash", "Med-Mist Smoke Grenade", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "Earlygame BR loadout: Combat AR, Combat Shotgun, Boom Bolt / Thunder Burst / Harbinger, Nitro Fists, Fizz + Nitro Splash. Combat AR was Mythic-only at launch. Vehicle-heavy season.",
  sources: ["https://earlygame.com/guides/fortnite/best-loadout-battle-royale-chapter-5-season-3", "https://www.fortnite.com/news/fortnite-br-chapter-5-season-3-competitive-details"],
  confidence: MED
}
f4: { // Ch5 S4 (Absolute Doom)
  rifle:   ["Striker AR", "Combat Assault Rifle", "Striker Burst Rifle"],
  shotgun: ["Hammer Pump Shotgun", "Gatekeeper Shotgun", "Sovereign Shotgun"],
  third:   ["Hyper SMG", "Thunder Burst SMG"],
  move:    ["Shockwave Grenade"],
  heals:   ["Chug Splash", "FlowBerry Fizz", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "War Machine / Captain America are Marvel items/Mythics, not pro standard. Port-A-Bunker + Shield Bubble Jr. endgame.",
  sources: ["https://fortnite.fandom.com/wiki/Chapter_5:_Season_4"],
  confidence: LOW
}
t1: { // Ch6 S1 (Hunters)
  rifle:   ["Holo Twister Assault Rifle", "Fury Assault Rifle", "Ranger Assault Rifle"],
  shotgun: ["Sentinel Pump Shotgun", "Oni Shotgun", "Twinfire Auto Shotgun"],
  third:   ["Veiled Precision SMG", "Surgefire SMG"],
  move:    ["Void Oni Mask", "Shockwave Grenade"],
  heals:   ["Chug Splash", "Shield Keg", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandages"],
  notes:   "Guides agree on Sentinel Pump + Veiled Precision SMG + Holo Twister; ONE Esports pairs Sentinel + Veiled + Void Oni Mask. Comp siphon 75 HP over 5s (Epic). AR first-pick between Holo Twister and Fury is UNCERTAIN.",
  sources: ["https://www.oneesports.gg/fortnite/best-weapons-in-fortnite-chapter-6-s1/", "https://www.gfinityesports.com/article/fortnite-chapter-6-season-1-best-weapons", "https://fortnite.fandom.com/wiki/Sentinel_Pump_Shotgun"],
  confidence: MED
}
t2: { // Ch6 S2 (Lawless)
  rifle:   ["Holo Twister Assault Rifle", "Twin Mag Assault Rifle", "Striker Burst Rifle"],
  shotgun: ["Sentinel Pump Shotgun", "Outlaw Shotgun", "Twinfire Auto Shotgun"],
  third:   ["Veiled Precision SMG", "Scoped Burst SMG"],
  move:    ["Shockwave Grenade", "Rocket Ram"],
  heals:   ["Chug Jug", "Shield Fish", "Flopper", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "FandomWire puts Sentinel Pump in S-tier for C6S2. Comp siphon 75/5s (Epic C6S2 post). Rest UNVERIFIED; Outlaw vs Sentinel order is a guess.",
  sources: ["https://fandomwire.com/fortnite-chapter-6-season-2-weapons-tier-list-all-guns-ranked/", "https://www.fortnite.com/competitive/news/fortnite-br-c6s2-competitive-details-new-and-improved-compete-tab"],
  confidence: LOW
}
t3: { // Ch6 S3 (Super)
  rifle:   ["Fury Assault Rifle", "Spire Rifle", "Deadeye DMR"],
  shotgun: ["Sentinel Pump Shotgun", "Outlaw Shotgun", "Twinfire Auto Shotgun"],
  third:   ["Veiled Precision SMG", "Surgefire SMG"],
  move:    ["Shockwave Grenade", "Myst Form"],
  heals:   ["Chug Jug", "Shield Fish", "Flopper", "Med-Mist", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "gamer.org: Fury pairs with Outlaw/Sentinel; Spire a strong ranged partner. Shield Bubble Jr. + Port-A-Bunker endgame. Order Fury vs Spire uncertain.",
  sources: ["https://www.gamer.org/fortnite-loadout-guide-best-weapons-and-items-for-chapter-6-season-3/", "https://www.fortnite.com/news/fortnite-br-chapter-6-season-3-competitive-details"],
  confidence: LOW
}
t4: { // Ch6 S4 (Shock 'n Awesome)
  rifle:   ["O.X.R. Rifle", "Fury Assault Rifle", "Deadeye DMR"],
  shotgun: ["Sentinel Pump Shotgun", "Sweeper Shotgun", "Twinfire Auto Shotgun"],
  third:   ["Veiled Precision SMG", "Wrecker Revolver"],
  move:    ["Shockwave Grenade", "Crash Pad Jr."],
  heals:   ["Chug Splash", "FlowBerry Fizz", "Shield Fish", "Flopper", "Med-Mist", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "One tier list: Veiled Precision SMG + Double Trouble Shotgun S-tier (NOT IN POOL: Double Trouble Shotgun), O.X.R. + Wrecker A, Sweeper B. Global Championship 2025 (Lyon) was this season. Pro specifics UNVERIFIED.",
  sources: ["https://ofzenandcomputing.com/fortnite-ch6s4-weapon-tier-list-guide/", "https://www.exitlag.com/blog/fortnite-guns/"],
  confidence: LOW
}
m1: { // Ch7 S2 (Showdown) -- identified by pool, see header
  rifle:   ["Combat Assault Rifle", "Nemesis AR"],
  shotgun: ["Iron Pump Shotgun", "Chaos Reloader Shotgun", "Twin Hammer Shotguns"],
  third:   ["Thunder Burst SMG", "Twin Mag SMG", "Vector 7 DMR"],
  move:    ["Skyline Deployer", "Seven Power Gloves"],
  heals:   ["Chug Jug", "Chug Splash", "Shield Fish", "Flopper", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "games.gg (C7S2): suggested Combat AR + Iron Pump + Thunder Burst SMG + Skyline Deployer; guides list Chug Jug/Splash + Seven Power Gloves/Skyline. Sources disagree Iron Pump vs Chaos Reloader. Not pro-sourced.",
  sources: ["https://games.gg/id/fortnite/guides/fortnite-chapter-7-season-2-peringkat-senjata-terbaik/", "https://tapin.gg/blogs/fortnite-chapter-7-season-2-showdown-guide"],
  confidence: LOW
}
m2: { // Ch7 S3 (Runners)
  rifle:   ["UNKNOWN"],  // candidates: Warforged Assault Rifle, Surgical Burst Rifle, Spire Rifle
  shotgun: ["UNKNOWN"],  // candidates: Striker Pump Shotgun, Extending Focus Shotgun, Maven Auto Shotgun
  third:   ["UNKNOWN"],  // candidates: Rapid Fire SMG, Heavy Impact Sniper Rifle
  move:    ["UNKNOWN"],  // pool has no clear mobility item besides Overdrive Grenade
  heals:   ["Chug Jug", "Shield Fish", "Flopper", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "No pro/comp source found. Heals ordering is generic fish-era default.",
  sources: ["https://beebom.com/fortnite-loot-pool-vaulted-unvaulted-weapons/amp/"],
  confidence: LOW
}
s42: { // Ch7 S4 (Override?) -- pool suspect
  rifle:   ["UNKNOWN"],  // candidates: Assault Rifle (unvaulted in S4)
  shotgun: ["UNKNOWN"],  // candidates: Pump Shotgun, 8-Bit Shotgun (S4 has NO SMGs per beebom)
  third:   ["UNKNOWN"],
  move:    ["UNKNOWN"],  // Sonic Power Sneakers is S4 mobility per beebom: NOT IN POOL
  heals:   ["UNKNOWN"],
  notes:   "beebom (upd. 7.10.2026) lists S4 vaulted: Oni Shotgun, Drum Gun, Ranger Assault Rifle, Dual Pistols, Flare Gun, Bass Boost, Chug Splash -- all present in s42 pool. s42 pool likely needs re-sync with Epic list before any meta mapping.",
  sources: ["https://beebom.com/fortnite-loot-pool-vaulted-unvaulted-weapons/amp/"],
  confidence: LOW
}
r1: { // Reload (Venture/launch rotation)
  rifle:   ["Hammer Assault Rifle", "Morphite Assault Rifle", "Striker Burst Rifle"],
  shotgun: ["Sentinel Pump Shotgun", "Morphite Pump Shotgun", "Twinfire Auto Shotgun"],
  third:   ["UNKNOWN"],
  move:    ["Shockwave Grenade", "Launch Pad", "Crash Pad Jr.", "Grappler"],
  heals:   ["Slap Splash", "FlowBerry Fizz", "Shield Potion", "Small Shield Potion", "Med Kit", "Bandage"],
  notes:   "No Reload pro loadout source found (Reload Elite Series coverage is results only). Order is my extrapolation from BR comp habits.",
  sources: ["https://www.hotspawn.com/?p=161985"],
  confidence: LOW
}
r2: { rifle:["UNKNOWN"], shotgun:["UNKNOWN"], third:["UNKNOWN"], move:["Shockwave Grenade","Launch Pad","Rift-To-Go"], heals:["Chug Splash","Slap Splash","Shield Keg","FlowBerry Fizz","Shield Potion","Small Shield Potion","Med Kit","Bandage"], notes:"Unsourced; move/heals are generic comp habits only.", sources:[], confidence: LOW }
r3: { // Reload Elite Stronghold (Apr 2026, v40.x)
  rifle:["UNKNOWN"], shotgun:["UNKNOWN"], third:["UNKNOWN"],
  move:["Launch Pad","Rift-To-Go","Jetpack"],
  heals:["Chug Splash","Shield Keg","Shield Potion","Small Shield Potion","Bandage"],
  notes:"fortnite.com: new Cube Rifle (rail beam + detonatable cube), Cube Splitter SMG later in v40.30, unvaulted Gatekeeper Shotgun, Holo-Twister AR, Seven Power Gloves (Gatekeeper + Seven Power Gloves NOT IN POOL r3). No meta source.",
  sources:["https://fortnite.com/news/join-the-elites-in-fortnite-reload-elite-stronghold?lang=en-us"], confidence: LOW }
r4: { rifle:["UNKNOWN"], shotgun:["UNKNOWN"], third:["UNKNOWN"], move:["Launch Pad","Rift-To-Go"], heals:["Chug Splash","Shield Keg","FlowBerry Fizz","Shield Potion","Small Shield Potion","Bandage"], notes:"Unsourced.", sources:[], confidence: LOW }
```
