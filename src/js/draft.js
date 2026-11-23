/*@@PART js/draft.js@@*/
const WEAPON_ART_BY_NAME={
  "Chaos Exploder Rifle": "chaos",
  "Surgical Burst Rifle": "surgical",
  "Extending Focus Shotgun": "extending",
  "Maven Auto Shotgun": "maven",
  "Striker Pump Shotgun": "striker",
  "Rapid Fire SMG": "rapid",
  "Bank Shot Pistol": "bankshot",
  "Ranger Pistol": "ranger"
};
// Artwork is keyed by item name, so it is worth trying in every mode rather
// than only inside the Major card decks — a Chug Jug is a Chug Jug whether it
// was drawn in a Major run or a plain duo draft. Only items with no artwork
// (the older seasons' guns) fall back to the tinted outline icon.
// The art maps now hold file paths rather than inline data, so the browser can
// defer anything the player never scrolls to — only a handful of the 58 icons
// are on screen in any given loot pack.
// The loot the pools deal that had no picture at all — mostly Chapter 6 Season 2
// and Season 3 guns that landed after the first art pass. Fetched by
// tools/fetch-missing-item-art.js; tools/check-item-art.js is what found them.
//
// Five of these have no art of their own anywhere: an Enhanced gun is the base
// weapon in a different tint, and a mythic named after a character is the base
// gun with a skin on it — the wiki says so itself, its infobox for the Baron
// pistol points at the Mammoth Pistol. Those carry the base weapon picture, and
// the substitution is written down in the fetcher rather than hidden here.
const EXTRA_ITEM_ART={
 // Лут мини-сезона S43 (fortnite.gg/weapons).
 "Bundlebuss Repeater Rifle": "items/s43/bundlebuss-repeater-rifle.webp",
 "Gilded Dragoon Shotgun": "items/s43/gilded-dragoon-shotgun.webp",
 "Sentinel Pump Shotgun": "items/s43/sentinel-pump-shotgun.webp",
 "Usopp's Slingshot": "items/s43/usopp-s-slingshot.webp",
 "Meat on a Stick": "items/s43/meat-on-a-stick.webp",
 "Nami's Tangerine": "items/s43/nami-s-tangerine.webp",
 "Overdrive Grenade": "items/s43/overdrive-grenade.webp",
 // ==== FNCS 2019–2020 art (tools/fetch-mx-item-art.js) ====
 "Scoped Assault Rifle": "items/itm-scoped-assault-rifle.webp",
 "Burst SMG": "items/itm-burst-smg.webp",
 "Compact SMG": "items/itm-compact-smg.webp",
 "Semi-Automatic Sniper Rifle": "items/itm-semi-automatic-sniper-rifle.webp",
 "Storm Scout Sniper Rifle": "items/itm-storm-scout-sniper-rifle.webp",
 "Boom Bow": "items/itm-boom-bow.webp",
 "Double Barrel Shotgun": "items/itm-double-barrel-shotgun.webp",
 "Tactical Submachine Gun": "items/itm-tactical-submachine-gun.webp",
 "Bush": "items/itm-bush.webp",
 "Stink Bomb": "items/itm-stink-bomb.webp",
 "Storm Flip": "items/itm-storm-flip.webp",
 "Shadow Bomb": "items/itm-shadow-bomb.webp",
 "Decoy Grenade": "items/itm-decoy-grenade.webp",
 "Creepin' Cardboard": "items/itm-creepin-cardboard.webp",
 "Stark Jetpack": "items/itm-stark-jetpack.webp",
 // ==== /FNCS 2019–2020 art ====
 // ==== FNCS 2021 art (tools/fetch-2021-item-art.js) ====
 "Heavy Assault Rifle": "items/itm-heavy-assault-rifle.webp",
 "Bolt-Action Sniper Rifle": "items/itm-bolt-action-sniper-rifle.webp",
 "Lever Action Rifle": "items/itm-lever-action-rifle.webp",
 "Primal Rifle": "items/itm-primal-rifle.webp",
 "Makeshift Rifle": "items/itm-makeshift-rifle.webp",
 "Primal Shotgun": "items/itm-primal-shotgun.webp",
 "Makeshift Shotgun": "items/itm-makeshift-shotgun.webp",
 "Primal SMG": "items/itm-primal-smg.webp",
 "Makeshift Submachine Gun": "items/itm-makeshift-submachine-gun.webp",
 "Primal Pistol": "items/itm-primal-pistol.webp",
 "Makeshift Revolver": "items/itm-makeshift-revolver.webp",
 "Makeshift Bow": "items/itm-makeshift-bow.webp",
 "Mechanical Bow": "items/itm-mechanical-bow.webp",
 "Primal Bow": "items/itm-primal-bow.webp",
 "Mechanical Shockwave Bow": "items/itm-mechanical-shockwave-bow.webp",
 "Mechanical Explosive Bow": "items/itm-mechanical-explosive-bow.webp",
 "Suppressed Assault Rifle": "items/itm-suppressed-assault-rifle.webp",
 "Flint-Knock Pistol": "items/itm-flint-knock-pistol.webp",
 "Automatic Sniper Rifle": "items/itm-automatic-sniper-rifle.webp",
 "Dual Fiend Hunters": "items/itm-dual-fiend-hunters.webp",
 "Alien Nanites": "items/itm-alien-nanites.webp",
 "Inflate-A-Bull": "items/itm-inflate-a-bull.webp",
 "Grab-itron": "items/itm-grab-itron.webp",
 "Prop-ifier": "items/itm-prop-ifier.webp",
 "Shockwave Launcher": "items/itm-shockwave-launcher.webp",
 // ==== /FNCS 2021 art ====
 // ==== FNCS 2022 art (tools/fetch-2022-item-art.js) ====
 "MK-Seven Assault Rifle": "items/itm-mk-seven-assault-rifle.webp",
 "Auto Shotgun": "items/itm-auto-shotgun.webp",
 "Machine Pistol": "items/itm-machine-pistol.webp",
 "Sidearm Pistol": "items/itm-sidearm-pistol.webp",
 "Hunter Bolt-Action Sniper Rifle": "items/itm-hunter-bolt-action-sniper-rifle.webp",
 "Thermal Scoped Assault Rifle": "items/itm-thermal-scoped-assault-rifle.webp",
 "Revolver": "items/itm-revolver.webp",
 "Hunter Bolt-Action Sniper": "items/itm-hunter-bolt-action-sniper.webp",
 "Prime Shotgun": "items/itm-prime-shotgun.webp",
 "Two-Shot Shotgun": "items/itm-two-shot-shotgun.webp",
 "Charge SMG": "items/itm-charge-smg.webp",
 "EvoChrome Burst Rifle": "items/itm-evochrome-burst-rifle.webp",
 "EvoChrome Shotgun": "items/itm-evochrome-shotgun.webp",
 "Suppressed Submachine Gun": "items/itm-suppressed-submachine-gun.webp",
 "Pizza Slices": "items/itm-pizza-slices.webp",
 "Tent": "items/itm-tent.webp",
 "Recon Scanner": "items/itm-recon-scanner.webp",
 "Repair Torch": "items/itm-repair-torch.webp",
 "Air Strike": "items/itm-air-strike.webp",
 "Balloon": "items/itm-balloon.webp",
 "Reality Seed": "items/itm-reality-seed.webp",
 "Port-A-Fort": "items/itm-port-a-fort.webp",
 "Crash Pad": "items/itm-crash-pad.webp",
 "Boogie Bomb": "items/itm-boogie-bomb.webp",
 "Ripsaw Launcher": "items/itm-ripsaw-launcher.webp",
 "Lil'Whip's Special Serve": "items/itm-lil-whip-s-special-serve.webp",
 "Frozen Icecream Cone": "items/itm-frozen-icecream-cone.webp",
 "Icecream Cone": "items/itm-icecream-cone.webp",
 "Spicy Icecream Cone": "items/itm-spicy-icecream-cone.webp",
 "Guzzling Icecream Cone": "items/itm-guzzling-icecream-cone.webp",
 "Junk Rift": "items/itm-junk-rift.webp",
 "Dial-A-Drop": "items/itm-dial-a-drop.webp",
 "Chrome Splash": "items/itm-chrome-splash.webp",
 // ==== /FNCS 2022 art ====
 // ==== FNCS 2023 art (tools/fetch-2023-item-art.js) ====
 "Burst Assault Rifle": "items/itm-burst-assault-rifle.webp",
 "Infantry Rifle": "items/itm-infantry-rifle.webp",
 "Thunder Shotgun": "items/itm-thunder-shotgun.webp",
 "Machine SMG": "items/itm-machine-smg.webp",
 "Six Shooter": "items/itm-six-shooter.webp",
 "Ex-Caliber Rifle": "items/itm-ex-caliber-rifle.webp",
 "DMR": "items/itm-dmr.webp",
 "Primal Stink Bow": "items/itm-primal-stink-bow.webp",
 "Primal Flame Bow": "items/itm-primal-flame-bow.webp",
 "Havoc Suppressed Assault Rifle": "items/itm-havoc-suppressed-assault-rifle.webp",
 "Submachine Gun": "items/itm-submachine-gun.webp",
 "Cobra DMR": "items/itm-cobra-dmr.webp",
 "MK-Alpha Assault Rifle": "items/itm-mk-alpha-assault-rifle.webp",
 "Flapjack Rifle": "items/itm-flapjack-rifle.webp",
 "Sharp Tooth Shotgun": "items/itm-sharp-tooth-shotgun.webp",
 "Lever Action Shotgun": "items/itm-lever-action-shotgun.webp",
 "Drum Shotgun": "items/itm-drum-shotgun.webp",
 "Combat SMG": "items/itm-combat-smg.webp",
 "Thermal DMR": "items/itm-thermal-dmr.webp",
 "Tactical DMR": "items/itm-tactical-dmr.webp",
 "Suppressed Sniper Rifle": "items/itm-suppressed-sniper-rifle.webp",
 "Shockwave Hammer": "items/itm-shockwave-hammer.webp",
 "Impulse Grenade": "items/itm-impulse-grenade.webp",
 "Guardian Shield": "items/itm-guardian-shield.webp",
 "Slurp Juice": "items/itm-slurp-juice.webp",
 "Cloak Gauntlets": "items/itm-cloak-gauntlets.webp",
 "Kinetic Boomerang": "items/itm-kinetic-boomerang.webp",
 // ==== /FNCS 2023 art ====
 // Chapter 5 (2024), пулы f1–f4 — 21 сентября 2026.
 "Striker AR": "items/itm-striker-ar.webp",
 "Enforcer AR": "items/itm-enforcer-ar.webp",
 "Hammer Pump Shotgun": "items/itm-hammer-pump-shotgun.webp",
 "Hyper SMG": "items/itm-hyper-smg.webp",
 "Grapple Blade": "items/itm-grapple-blade.webp",
 "Harbinger SMG": "items/itm-harbinger-smg.webp",
 "Hand Cannon": "items/itm-hand-cannon.webp",
 "Huntress DMR": "items/itm-huntress-dmr.webp",
 "Wings of Icarus": "items/itm-wings-of-icarus.webp",
 "Combat Shotgun": "items/itm-combat-shotgun.webp",
 "Boom Bolt": "items/itm-boom-bolt.webp",
 "Nitro Fists": "items/itm-nitro-fists.webp",
 "Nitro Splash": "items/itm-nitro-splash.webp",
 "Stark Industries Energy Rifle": "items/itm-stark-industries-energy-rifle.webp",
 "Sovereign Shotgun": "items/itm-sovereign-shotgun.webp",
 "Wood Stake Shotgun": "items/itm-wood-stake-shotgun.webp",
 "Dual Micro SMGs": "items/itm-dual-micro-smgs.webp",
 "Monarch Pistol": "items/itm-monarch-pistol.webp",
 "War Machine's Hover Jets": "items/itm-war-machine-s-hover-jets.webp",
 "Captain America's Shield": "items/itm-captain-america-s-shield.webp",
 "Twin Mag Assault Rifle": "items/itm-twin-mag-assault-rifle.webp",
 "Collateral Damage Assault Rifle": "items/itm-collateral-damage-assault-rifle.webp",
 "Baron's Double Down Pistol": "items/itm-baron-s-double-down-pistol.webp",
 "Midas' Gilded Eye Drum Gun": "items/itm-midas-gilded-eye-drum-gun.webp",
 "Brutus' Minigun": "items/itm-brutus-minigun.webp",
 "Enhanced Holo Twister Assault Rifle": "items/itm-enhanced-holo-twister-assault-rifle.webp",
 "Enhanced Sentinel Pump Shotgun": "items/itm-enhanced-sentinel-pump-shotgun.webp",
 "Spire Rifle": "items/itm-spire-rifle.webp",
 "Enhanced Spire Rifle": "items/itm-enhanced-spire-rifle.webp",
 "Kor's Deadeye DMR": "items/itm-kor-s-deadeye-dmr.webp",
 "Med-Mist": "items/itm-med-mist.webp",
 "Small Fries": "items/itm-small-fries.webp",
 "Warforged Assault Rifle": "items/itm-warforged-assault-rifle.webp",
 "Lancehead Pistol": "items/itm-lancehead-pistol.webp",
 "Heavy Impact Sniper Rifle": "items/itm-heavy-impact-sniper-rifle.webp",
 "Flex SMG": "items/itm-flex-smg.webp",
 "Stinger SMG": "items/itm-stinger-smg.webp",
 "Hunting Rifle": "items/itm-hunting-rifle.webp",
 "Assault Rifle": "items/itm-assault-rifle.webp",
 "Pump Shotgun": "items/itm-pump-shotgun.webp",
 "8-Bit Shotgun": "items/itm-8-bit-shotgun.webp",
 "Drum Gun": "items/itm-drum-gun.webp",
 "Tactical Pistol": "items/itm-tactical-pistol.webp",
 "Dual Pistols": "items/itm-dual-pistols.webp",
 "Minigun": "items/itm-minigun.webp",
 "Flare Gun": "items/itm-flare-gun.webp",
 "Spicy Taco": "items/itm-spicy-taco.webp",
 "Morphite Assault Rifle": "items/itm-morphite-assault-rifle.webp",
 "Morphite Heavy Assault Rifle": "items/itm-morphite-heavy-assault-rifle.webp",
 "Morphite Hammer Assault Rifle": "items/itm-morphite-hammer-assault-rifle.webp",
 "Hammer Assault Rifle": "items/itm-hammer-assault-rifle.webp",
 "Morphite Pump Shotgun": "items/itm-morphite-pump-shotgun.webp",
 "Morphite Tactical Shotgun": "items/itm-morphite-tactical-shotgun.webp",
 "Morphite Sentinel Pump Shotgun": "items/itm-morphite-sentinel-pump-shotgun.webp",
 "Morphite Submachine Gun": "items/itm-morphite-submachine-gun.webp",
 "Morphite Mammoth Pistol": "items/itm-morphite-mammoth-pistol.webp",
 "Ranger Shotgun": "items/itm-ranger-shotgun.webp",
 "Heavy Shotgun": "items/itm-heavy-shotgun.webp",
 "Havoc Pump Shotgun": "items/itm-havoc-pump-shotgun.webp",
 "Frenzy Auto Shotgun": "items/itm-frenzy-auto-shotgun.webp",
 "Charge Shotgun": "items/itm-charge-shotgun.webp",
 "Tactical Shotgun": "items/itm-tactical-shotgun.webp",
 "Gatekeeper Shotgun": "items/itm-gatekeeper-shotgun.webp",
 "Twin Siphon Shotguns": "items/itm-twin-siphon-shotguns.webp",
 "Light Machine Gun": "items/itm-light-machine-gun.webp",
 "Heavy Sniper Rifle": "items/itm-heavy-sniper-rifle.webp",
 "Reaper Sniper Rifle": "items/itm-reaper-sniper-rifle.webp",
 "Red-Eye Assault Rifle": "items/itm-red-eye-assault-rifle.webp",
 "Red-Eye Submachine Gun": "items/itm-red-eye-submachine-gun.webp",
 "Tactical Assault Rifle": "items/itm-tactical-assault-rifle.webp",
 "Cube Rifle": "items/itm-cube-rifle.webp",
 "Cube Splitter SMG": "items/itm-cube-splitter-smg.webp",
 "Wrecker Revolver": "items/itm-wrecker-revolver.webp",
 "Combat Pistol": "items/itm-combat-pistol.webp",
 "Grappler": "items/itm-grappler.webp",
 "Launch Pad": "items/itm-launch-pad.webp",
 "Crash Pad Jr.": "items/itm-crash-pad-jr.webp",
 "Rift-To-Go": "items/itm-rift-to-go.webp",
 "Jetpack": "items/itm-jetpack.webp",
 "FlowBerry Fizz": "items/itm-flowberry-fizz.webp",
 "Slap Splash": "items/itm-slap-splash.webp",
 "Slap Juice": "items/itm-slap-juice.webp",
 "Slap Berry": "items/itm-slap-berry.webp",
 "Chug Cannon": "items/itm-chug-cannon.webp",
 "Bandage Bazooka": "items/itm-bandage-bazooka.webp",
 "Slapperoni Slice": "items/itm-slapperoni-slice.webp",
 "Spicy Slapperoni Slice": "items/itm-spicy-slapperoni-slice.webp",
 "Pizza Party": "items/itm-pizza-party.webp",
 "Pizza Slice": "items/itm-pizza-slice.webp"
};

function weaponIconHTML(o, set){
  const tag=src=>'<img alt="" loading="lazy" decoding="async" src="'+src+'">';
  // The 2025 sets share most of their loot with each other, so a picture missing
  // from one season's table is very often present in another's. Own set first,
  // then the other two, then the silhouette. The set is the card deck in the
  // draft and the island of the night in the career, which passes it in.
  const own=set || (CARD_MODE ? CARD_SET : null);
  if(T_ART[own]){
    for(const tbl of [T_ART[own], T1_ART, T2_ART, T3_ART]){
      if(tbl && tbl[o.name]) return tag(tbl[o.name]);
    }
  }
  const m1=M1_ART[o.name];
  if(m1) return tag(m1);
  const w=WEAPON_ART[WEAPON_ART_BY_NAME[o.name]];
  if(w) return tag(w);
  const it=ITEM_ART[o.name];
  if(it) return tag(it);
  const ex=EXTRA_ITEM_ART[o.name];
  if(ex) return tag(ex);
  // A 2026 island dealing a gun that only the 2025 tables have a picture of --
  // the Oni Shotgun and Ranger AR came back for Season 4 -- takes that picture
  // rather than the outline. The shared names (Shield Potion, Med Kit) were
  // already found above, so no season borrows another's art for those.
  for(const tbl of [T1_ART, T2_ART, T3_ART]){
    if(tbl[o.name]) return tag(tbl[o.name]);
  }
  return WEAPON_ICON[o.icon];
}

function futItemCardHTML(o){
  const key=CARD_SKIN[o.rarity] ? o.rarity : (CONSUMABLE_SKIN_KEY[o.rarity]||'common');
  const skin=CARD_SKIN[key];
  const sign=o.mod>=0?'+':'';
  const powerWord=LANG==='ru'?'СИЛА':'POWER';
  return `
  <div class="fut-card" style="background:${skin.bg};color:#fff;padding:13px 13px 11px;flex:1;
    box-shadow:0 0 0 1px rgba(255,255,255,.42) inset, 0 8px 22px rgba(0,0,0,.55), 0 0 30px -8px ${skin.glow}, 0 0 0 2.5px ${skin.glow};">
    <div class="fut-item-row" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">
      <div style="text-align:center;min-width:46px;">
        <div class="fut-ovr" style="font-size:29px;color:#fff;">${sign}${o.mod}</div>
        <div class="fut-role" style="font-size:8px;">${powerWord}</div>

      </div>
      <div class="fut-item-text" style="flex:1;min-width:0;padding-top:2px;">
        <div class="fut-name" style="font-size:14px;">${o.name}</div>
        <div style="display:inline-block;margin-top:7px;font-size:8px;font-weight:900;
          letter-spacing:.12em;padding:2px 7px;background:rgba(0,0,0,.45);color:${skin.glow};
          clip-path:polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%);">${String(CONSUMABLE_RARITY_LABEL[o.rarity]||o.rarity).toUpperCase()}</div>
      </div>
    </div>
    <div class="loot-art" style="color:${skin.glow};">${weaponIconHTML(o)}</div>
  </div>`;
}

function renderItemPack(list, elId, onPick){
  const el=document.getElementById(elId);
  el.innerHTML='';
  list.forEach(o=>{
    {
      const c=document.createElement('div');
      c.style.cssText='display:flex;flex-direction:column;gap:2px;';
      c.style.setProperty('--r-color', o.color);
      c.innerHTML=futItemCardHTML(o)+`<button class="pick-btn" style="width:100%;">${L().pickBtn}</button>`;
      c.querySelector('.pick-btn').onclick=()=>onPick(o);
      el.appendChild(c);
      return;
    }
    const c=document.createElement('div');
    c.className='pcard';
    c.style.setProperty('--r-color',o.color);
    const sign = o.mod>=0 ? '+' : '';
    c.innerHTML = `
      <div class="pcard-top">
        <div class="rarity-tag">${o.rarity}</div>
        <div class="rating-pill" style="color:var(--r-color);">${sign}${o.mod}</div>
      </div>
      <div class="p-handle">${weaponIconHTML(o)} ${o.name}</div>
      <button class="pick-btn">${L().pickBtn}</button>`;
    c.querySelector('.pick-btn').onclick=()=>onPick(o);
    el.appendChild(c);
  });
}

// A resolved pack shows what was taken out of it, drawn as the same card the
// choice was made on. The three packs used to collapse to a line of grey text,
// which threw away the only thing the round produced.
function renderPicked(elId, cards, note){
  const el=document.getElementById(elId);
  el.innerHTML='';
  if(note){
    const n=document.createElement('div');
    n.className='picked-note';
    n.textContent=note;
    el.appendChild(n);
  }
  cards.forEach(c=>{
    const cell=document.createElement('div');
    cell.style.cssText='display:flex;flex-direction:column;gap:2px;';
    cell.style.setProperty('--r-color', c.color);
    cell.innerHTML=c.html+`<div class="picked-tag">${L().draftedLabel}</div>`;
    if(c.player) wireCardPeek(cell, c.player);
    el.appendChild(cell);
  });
}

const pickedItemCard=o=>({html:futItemCardHTML(o), color:o.color});
const pickedPlayerCard=p=>({html:futCardHTML(p), color:RARITY_COLOR[shownRarity(p)], player:p});

function pickWeapon(o){
  if(roundWeaponPicked) return;
  draftedWeapons.push(o);
  roundWeaponPicked=true;
  renderPicked('weaponCandidates', [pickedItemCard(o)]);
  renderSlots();
  maybeAdvanceRound();
}

function pickHeal(o){
  if(roundHealPicked) return;
  draftedHeals.push(o);
  roundHealPicked=true;
  renderPicked('healCandidates', [pickedItemCard(o)]);
  renderSlots();
  maybeAdvanceRound();
}

// Switching language redraws the draft screen. A leg of the round that is
// already resolved has to come back as the pick it produced — redrawing it as a
// live pack offers choices the round will refuse.
const lastOf=a=>a[a.length-1];

// Draft over: every pack area turns into the full run of picks it produced, one
// card per round. A round rolls a player, a weapon and a consumable together,
// so all three areas end up the same length and read as one finished loadout.
//
// Counted in rounds, not in players. A realistic run takes its whole roster in
// the first round, and if the draft ended when the roster was full it would end
// after one loot round — leaving the player with one weapon and one consumable
// against a lobby whose teams roll a pair each, which is half the loadout in
// duos and a third of it in trios.
function draftedEnough(){
  return REALISTIC ? round>=squadSize : drafted.length>=squadSize;
}
function draftIsComplete(){
  return roundPlayerPicked && roundWeaponPicked && roundHealPicked && draftedEnough();
}
function renderDraftResult(){
  renderPicked('candidates', drafted.map(p=>pickedPlayerCard(p)), L().squadCompleted);
  renderPicked('weaponCandidates', draftedWeapons.map(o=>pickedItemCard(o)));
  renderPicked('healCandidates', draftedHeals.map(o=>pickedItemCard(o)));
}

function rerenderDraftPacks(){
  if(draftIsComplete()) return renderDraftResult();
  if(REALISTIC){
    // The roster is taken whole, so the finished half of it is the whole squad
    // rather than the last card picked.
    if(drafted.length) renderPicked('candidates', drafted.map(p=>pickedPlayerCard(p)));
    else renderTeamPicker();
  } else if(currentCandidates.length){
    if(roundPlayerPicked) renderPicked('candidates', [pickedPlayerCard(lastOf(drafted))]);
    else renderCandidates(currentCandidates);
  }
  if(currentWeaponOptions.length){
    if(roundWeaponPicked) renderPicked('weaponCandidates', [pickedItemCard(lastOf(draftedWeapons))]);
    else renderItemPack(currentWeaponOptions, 'weaponCandidates', pickWeapon);
  }
  if(currentHealOptions.length){
    if(roundHealPicked) renderPicked('healCandidates', [pickedItemCard(lastOf(draftedHeals))]);
    else renderItemPack(currentHealOptions, 'healCandidates', pickHeal);
  }
}

function loadoutBonus(){
  const raw = draftedWeapons.reduce((s,o)=>s+o.mod,0) + draftedHeals.reduce((s,o)=>s+o.mod,0);
  // Loadout items are rolled one per player, so squad mode (4 players) rolls
  // twice as many items as duo (2) and the raw sum came out roughly twice as
  // large just from headcount, not better luck. Scaling by 2/squadSize keeps
  // it an even comparison across modes, same approach as the kill-point fix.
  // ...and LOADOUT_POW_SCALE then cuts what the roll is worth at all: the items
  // are luck, so they get to nudge a close matchup, not decide it.
  const n = drafted.length || 1;
  return Math.round(raw * (2/n) * LOADOUT_POW_SCALE);
}

function randomLoadoutBonus(n){
  let total=0;
  for(let i=0;i<n;i++){
    const w=WEAPON_POOL[Math.floor(Math.random()*WEAPON_POOL.length)];
    const h=M2_CONSUMABLE_POOL[Math.floor(Math.random()*M2_CONSUMABLE_POOL.length)];
    total+=w.mod+h.mod;
  }
  return Math.round(total * (2/n) * LOADOUT_POW_SCALE);
}

// ---------- Card mode: FIFA-style player attributes ----------
// Every player card gets six attributes derived deterministically from their
// handle + event, so the same card always looks the same. The weighted mean
// of the attributes is pinned to the player's existing 0-100 rating, so the
// card's OVR never contradicts the rating the rest of the game uses.
let CARD_MODE=false;
let CARD_SET='m2';
let lastSummit=null;

function hashStr(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0;
}
function seededRng(seed){
  let x=seed||123456789;
  return ()=>{ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296; };
}

// Every attribute is a percentile over a published leaderboard column. Mechanics
// and game sense used to sit here on a value seeded from the player's name —
// 38% of the overall was invented — and are replaced by the two things the same
// tables do support: how a duo earned its points, and how much FNCS it has
// played. Weights follow how directly each column is measured, so the two
// derived columns carry less than the raw ones.
//   aim ← avg eliminations      sur ← avg placement
//   end ← placement share of pts  con ← points per match
//   clu ← Victory Royales/match   exp ← career matches in the dataset
const ATTR_W={aim:0.22, end:0.20, sur:0.20, exp:0.10, clu:0.12, con:0.16};
const ATTR_KEYS=['aim','end','sur','exp','clu','con'];
const ATTR_LABEL={aim:'attrAim', end:'attrEnd', sur:'attrSur', exp:'attrExp', clu:'attrClu', con:'attrCon'};
const ATTR_FULL={aim:'attrAimFull', end:'attrEndFull', sur:'attrSurFull', exp:'attrExpFull', clu:'attrCluFull', con:'attrConFull'};
// Which published column each attribute is read from, shown on hover so the
// number on the card can be traced back to the standings it came from.
const ATTR_SRC={aim:'attrAimSrc', end:'attrEndSrc', sur:'attrSurSrc', exp:'attrExpSrc', clu:'attrCluSrc', con:'attrConSrc'};
// Attribute copy goes into a title="" attribute, so the quote characters have
// to survive the trip even though today every string is our own.
function esc(s){ return ccTameMarks(String(s==null?'':s)).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
/* Строка внутри onclick="f('…')": сначала правила строки JS (обратный слэш, кавычка, перенос), потом атрибута.
   Одна замена кавычки без слэша пропускала ник вида \'); код; // — так ник напарника из онлайна запускал код. */
function jsq(s){ return esc(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/[\r\n\u2028\u2029]/g,' ')); }
/* Стопки диакритики в никах. Игрок, 3.10: «у одного чела в 5 главе вместо ника
   огромное количество символов». Это настоящие ники лестницы, где над одной
   буквой висело до одиннадцати огласовок, и строка таблицы рисовала из них
   высокую кляксу. Пятнадцать таких ников подрезаны прямо в данных (совпадений
   после подрезки нет), а esc делает то же со всем, что приходит со стороны —
   ники «Игроков сайта», чат: одинаковые знаки подряд склеиваются, и над буквой
   остаётся не больше двух — столько и нужно настоящему арабскому или ивриту. */
function ccTameMarks(s){
  // Литерал внутри функции, а не const рядом: esc может позваться раньше, чем дойдёт до объявления.
  const runs=/[\u0300-\u036f\u0483-\u0489\u0591-\u05c7\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0f71-\u0f84\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]{3,}/g;
  if(s.length<3 || !runs.test(s)) return s;
  runs.lastIndex=0;
  return s.replace(runs, run=>{
    const kept=[];
    for(const ch of run){ if(kept[kept.length-1]!==ch) kept.push(ch); if(kept.length===2) break; }
    return kept.join('');
  });
}
// Two roles instead of six. The card still picks a player's strongest attribute,
// but everything that decides fights (aim, consistency, clutch) reads as a
// fragger, and everything that decides where the squad goes (endgame, survival,
// experience) reads as the caller.
// Real in-game roles, scraped from the NBF Fantasy tables (EU and NAC — the
// Major 2 heats, days 1-3, plus both grand finals). "I" is the duo's in-game leader, "F" the fragger.
// Everyone not on that list keeps the old guess-from-attributes fallback.
const PLAYER_ROLE={
  "P1ng":"I",
  "1Vanjkee":"I",
  "1px pessiǃ":"F",
  "1ukeM":"I",
  "1vanjkee":"I",
  "1x Dinker":"I",
  "1xǃ":"F",
  "2nappytr0nǃ":"I",
  "7VEN Yawnǃ":"F",
  "Acidz":"F",
  "Acorn":"I",
  "Adn":"F",
  "AlbaXna":"F",
  "Aleezy":"F",
  "Aloe":"I",
  "Alvin":"I",
  "AlvinIr":"I",
  "Aminished":"I",
  "Amplify":"I",
  "Anas":"F",
  "Artskill":"F",
  "Ary":"F",
  "Aryan":"I",
  "Asa":"F",
  "Atlas 413":"I",
  "Atreyu fvǃ":"F",
  "Avenger":"I",
  "Avivv":"I",
  "Axeforce":"F",
  "AzatGo":"F",
  "BatmanJoe":"I",
  "Benek":"F",
  "Birk":"F",
  "Blacha":"I",
  "Blu 413":"I",
  "Borsuk":"F",
  "Braydz":"F",
  "Bugha":"I",
  "Cam":"F",
  "Carbone":"F",
  "Castle":"I",
  "Channce":"I",
  "Chap":"F",
  "Charyy":"F",
  "Cheatiin":"F",
  "Chico":"F",
  "Chris":"F",
  "Circ":"I",
  "Clix":"F",
  "Cold":"F",
  "Coldy":"I",
  "Cr1nge":"I",
  "Cringe":"F",
  "Cugo":"F",
  "Curly":"F",
  "Curve":"F",
  "Cxshy":"I",
  "CyaThya":"I",
  "D00mguy":"I",
  "Darkos":"F",
  "Darky":"I",
  "Darm":"I",
  "Dash":"F",
  "Decay":"I",
  "Dela":"I",
  "Demus":"F",
  "DiegoPlayzFN":"I",
  "Dinus":"I",
  "Dolzeur":"F",
  "Doxey":"I",
  "DragonRG":"I",
  "Drey":"F",
  "Dylangodoy9":"F",
  "Echo":"I",
  "Efexy":"F",
  "Eisi":"I",
  "Encrypted":"I",
  "Eyne":"I",
  "F1n4ik":"I",
  "F1shyX":"F",
  "FRANEK":"F",
  "Faded":"F",
  "Fastroki":"I",
  "Ferdy":"F",
  "Firen":"F",
  "Flickzy":"I",
  "Floww":"F",
  "Flyx":"F",
  "Fnajen":"I",
  "FoCuS":"I",
  "Focus":"I",
  "Franek":"F",
  "Fredoxie":"I",
  "G0lDx2":"I",
  "G13ras":"I",
  "Gabix":"F",
  "Gary":"F",
  "Ghonzo":"F",
  "Ghost":"F",
  "Ghxst 999":"F",
  "Glubschi":"I",
  "Golden":"F",
  "Hcube":"I",
  "Hedra":"F",
  "Hellfire":"I",
  "Higgs":"I",
  "Hizixx":"F",
  "Hlechis":"I",
  "Hris":"F",
  "Huty":"I",
  "Hxvac":"I",
  "IDrop":"I",
  "Iced":"I",
  "Izzi":"F",
  "JannisZ":"I",
  "Japko":"F",
  "Jaqck":"I",
  "JarKo":"I",
  "Jargue":"I",
  "JariesFire":"I",
  "Jayse1x":"F",
  "Jemitty":"F",
  "Joni":"I",
  "Julle":"I",
  "Jurdy":"I",
  "Juu":"I",
  "KANTRI":"F",
  "Kaan":"I",
  "Kacpi":"F",
  "Kami":"I",
  "Kenrop":"I",
  "Kenty":"I",
  "Khanada":"F",
  "Kiire":"F",
  "Kingaling":"F",
  "Kirillian":"F",
  "Kiro":"I",
  "Kizers":"F",
  "Klixey":"F",
  "Kombek":"F",
  "Kqrma":"F",
  "Kulb":"I",
  "Kxyin":"F",
  "Kylie":"I",
  "L0WK3Y":"F",
  "LEAF Neemo":"F",
  "LF7ǃ":"I",
  "Lericx":"F",
  "Light":"F",
  "Lixium":"I",
  "Lorzizs":"F",
  "Lu984":"I",
  "LuLu":"F",
  "LuckyTeed":"I",
  "Maciak":"F",
  "Maddenv":"I",
  "Magma":"I",
  "Maku":"F",
  "Mald1s":"I",
  "Malibuca":"I",
  "Maloyache":"I",
  "MariusCOW":"F",
  "Mason":"F",
  "Matice":"F",
  "Merstach":"F",
  "Mikson":"F",
  "Minori":"I",
  "Mirops":"I",
  "Misq":"I",
  "Momsy":"I",
  "MrSavage":"I",
  "Muz":"F",
  "Mаtez":"I",
  "Nano":"I",
  "NeFrizi":"I",
  "Nebs":"F",
  "NoahWPlays":"I",
  "Noahreyli":"F",
  "Nociff":"I",
  "Noobplays":"I",
  "Northern":"F",
  "Nova":"I",
  "Noxy":"I",
  "Nut":"I",
  "Nxthan":"I",
  "OliverOG":"I",
  "Olk":"I",
  "Owl":"F",
  "Ozone":"I",
  "PabloWingu":"I",
  "Paper":"I",
  "Peakz":"F",
  "Peshka":"F",
  "Peterbot":"I",
  "Pilky lytdk":"F",
  "Pinq":"I",
  "Pixie":"F",
  "Pixovsky":"F",
  "Pixx":"I",
  "Plaazy":"F",
  "Plurreyli Ӝ":"F",
  "PlxzmaGOTY 7ǃ":"I",
  "PodaSai":"I",
  "Polish":"I",
  "Pollo":"F",
  "Power":"F",
  "Predage":"I",
  "Purchawa":"I",
  "Pure":"I",
  "Pykz":"F",
  "Qkay":"F",
  "Quick":"F",
  "Quix":"F",
  "REGULARBRD":"I",
  "RGN Realxze":"F",
  "Rad3on":"F",
  "Rapid":"I",
  "Rax":"F",
  "Reet":"F",
  "Repairs":"I",
  "Rise":"I",
  "Robin":"F",
  "Rogue":"F",
  "S1neD":"F",
  "S1ned":"F",
  "SM1LY.":"I",
  "SaNyaGoD":"F",
  "Sails":"F",
  "Sbari":"I",
  "Scroll":"F",
  "Seek":"I",
  "Seekk":"F",
  "Seili":"F",
  "SereN":"I",
  "Setty":"I",
  "Seyyto":"F",
  "Sharkman":"I",
  "Shaykoz":"I",
  "Shur4":"F",
  "Shxrk":"F",
  "Sifulwk":"F",
  "SirDinkDinkDinkǃ":"F",
  "Ski":"F",
  "Skrill":"F",
  "Skvii":"I",
  "Sky":"I",
  "SkyJump":"F",
  "Skyjump":"F",
  "Skykame7":"F",
  "Skyy":"F",
  "SnozQ":"F",
  "Sphinx":"I",
  "Srapt":"I",
  "SwizzY":"I",
  "Sxdia":"I",
  "Syaaz":"I",
  "Syn":"F",
  "Szarik":"I",
  "TTV NiteNite":"I",
  "Takii":"F",
  "TaySon":"I",
  "Th0masHD":"F",
  "Threats":"F",
  "Tidi":"F",
  "Tisma":"I",
  "Tjino":"F",
  "Toose":"F",
  "Trexer":"F",
  "Trippernn":"I",
  "Trooly":"F",
  "TruleX":"I",
  "Turbulence":"I",
  "Turtl3":"I",
  "Twek":"I",
  "Twi":"F",
  "Twitch Dimzyfv":"F",
  "Twitch RealJxe":"F",
  "Twitch Tobi Safe":"I",
  "Twunti":"F",
  "Unrealiana":"F",
  "User-9273c978b1":"F",
  "Vadeal":"F",
  "Vanyak3kk":"F",
  "Veer":"F",
  "Velofps":"F",
  "Vergo":"F",
  "Vexi":"I",
  "Vibez Juh":"I",
  "VicterV":"F",
  "Visxals":"I",
  "Volko":"I",
  "WBOTY Webster":"F",
  "Wed1":"F",
  "Werex":"F",
  "Wheat":"I",
  "Wifi":"I",
  "Winther":"F",
  "Wolvax":"I",
  "Wox":"F",
  "Wozah":"F",
  "Xantify":"F",
  "YT Sevenatra":"F",
  "Yummy":"F",
  "Yuz":"F",
  "Zarbeh":"F",
  "Zayni":"I",
  "Zenox":"I",
  "Zeus":"I",
  "Zucki":"I",
  "angel":"F",
  "bevvys":"I",
  "bologn4":"I",
  "brennenboiᵀᴵᴷᵀᴼᴷ":"I",
  "buba":"I",
  "carlitos 1000-7":"I",
  "charyy":"F",
  "chase 2ǃ":"F",
  "chrisc":"I",
  "city 2ǃ":"F",
  "clxut":"F",
  "codack":"F",
  "coldr":"I",
  "covix5ft7balding":"I",
  "crz":"F",
  "cyclops":"I",
  "dandepuzo":"I",
  "dejavuto":"F",
  "demus":"F",
  "devade bää 19":"I",
  "dinqtryona":"F",
  "dinus":"I",
  "f3kserǃ":"F",
  "flying backwards":"I",
  "footy":"F",
  "frizi":"I",
  "frxstyy":"F",
  "fs kasz 7":"F",
  "ghost":"F",
  "hadi":"I",
  "helgizikk":"I",
  "hizixx":"F",
  "iFr0zi":"I",
  "jezejearimǃ":"F",
  "jojofishy":"F",
  "josh":"F",
  "kantri":"F",
  "kashfv":"I",
  "keron":"I",
  "kescary":"F",
  "kiduoo":"I",
  "kingaling":"F",
  "kluоs":"I",
  "kramprus":"F",
  "krazy":"F",
  "kyrie jit":"I",
  "leaf quvozǃ":"F",
  "liamtfup":"I",
  "loganKR":"F",
  "macko281":"I",
  "mopy19":"F",
  "morlezǃ":"F",
  "mydro":"F",
  "naevz":"I",
  "nebs":"F",
  "nvtylerh":"I",
  "oreoraga":"I",
  "pack a piece":"F",
  "panchitoǃ":"F",
  "panzer":"I",
  "phoenixyk":"F",
  "pixx":"I",
  "pollazǃ":"I",
  "prax":"F",
  "proхy 19":"I",
  "psyc solow":"I",
  "realiseal":"F",
  "rezon ay":"F",
  "rxlphy":"I",
  "sandman":"F",
  "shxrk":"F",
  "skqttles":"I",
  "spita":"I",
  "sylaǃ":"I",
  "synixski":"F",
  "t3eny":"I",
  "tank 28-3":"I",
  "tenyа":"F",
  "teramcrazy":"F",
  "tidi":"F",
  "titan malcolmǃ":"F",
  "trippernn":"I",
  "trp angxl 4321ǃ":"I",
  "ttv.latinologic":"I",
  "twitch jefe bob":"I",
  "twitch kyle1x":"I",
  "twitch passionfn":"I",
  "twitter PercntFN":"I",
  "twitter sparky2x":"F",
  "twtr autummn2x":"F",
  "twtr freeswagfv":"I",
  "vadeal":"F",
  "verT":"I",
  "vertify 15":"I",
  "vexi":"I",
  "vic0":"F",
  "vixy":"I",
  "vleccks":"F",
  "void resetǃ":"F",
  "wekipedia.":"I",
  "xeely 7":"I",
  "xylo 13ǃ":"I",
  "xzeevit":"F",
  "yuki 1000-7":"F",
  "zelofvǃ":"F",
  "zenn":"F",
  "zwxxwzxx":"F",
  "zynipǃ":"F",
  "ťrae":"I",
  "коро supero 289":"I"
};
// A role belongs to the player, not to the spelling of their name. The table is
// keyed on the handle the fantasy tables printed, and the same person is written
// differently from event to event — case, an org tag, a decorated character — so
// an exact lookup gives a 2025 trio card a guessed role while that player's 2026
// duo card carries the real one. Matching on the stripped handle as well carries
// the role across both.
//
// Where two different people strip to the same key and disagree, the key is
// dropped: a coin-flip between two real roles is worse than the attribute
// fallback, which at least reads the player's own numbers.
const _roleNorm=s=>String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]/g,'');
// The fantasy tables only cover the 2026 Major 2 lobbies in Europe and NA
// Central, so a player who was not in one of those is left to the guess from
// attributes — and the guess gets some of them plainly wrong. These are the
// corrections, hand-labelled rather than scraped, each one a player whose role
// is not in dispute in the scene. They win over both the table and the guess,
// and the list is meant to grow as wrong ones are spotted.
const PLAYER_ROLE_KNOWN={
  "Queasy":"I"          // called for Merstach and SwizzY through the 2025 season
};
let _ROLE_BY_NORM=null;
function roleByNorm(){
  if(_ROLE_BY_NORM) return _ROLE_BY_NORM;
  _ROLE_BY_NORM={};
  Object.keys(PLAYER_ROLE).forEach(h=>{
    const k=_roleNorm(h);
    if(!k) return;
    if(!(k in _ROLE_BY_NORM)) _ROLE_BY_NORM[k]=PLAYER_ROLE[h];
    else if(_ROLE_BY_NORM[k]!==PLAYER_ROLE[h]) _ROLE_BY_NORM[k]=null;
  });
  // The hand-labelled ones go in last so a correction really corrects.
  Object.keys(PLAYER_ROLE_KNOWN).forEach(h=>{
    const k=_roleNorm(h);
    if(k) _ROLE_BY_NORM[k]=PLAYER_ROLE_KNOWN[h];
  });
  return _ROLE_BY_NORM;
}
function realRoleKey(p){
  const h=p && p.handle;
  if(!h) return null;
  const r=roleByNorm()[_roleNorm(h)] || PLAYER_ROLE[h]
       || (p.liquiName && (roleByNorm()[_roleNorm(p.liquiName)] || PLAYER_ROLE[p.liquiName]));
  return r==='I' ? 'roleIGL' : (r==='F' ? 'roleFRG' : null);
}

// ROLE_FOR_ATTR used to map the single tallest attribute to a role. roleFromProfile
// replaced it — nothing reads it now, and a stale lookup table is how the last
// batch of dead code got left behind.

// Ratings set by the flagship results below. A card built from an old qualifier
// used to keep that night's numbers, so a Summit finalist could still show up as
// a 70. If the player's best real finish says otherwise, every one of their
// cards is lifted to match — the six attributes move together so the card still
// reads honestly, and a card already above the floor is left alone.
function attrsFor(p){
  const a=attrsForRaw(p);
  if(a._floored) return a;
  a._floored=true;
  // Роль ставится до всех выходов: карточка, которой не нужно поднимать
  // рейтинг, возвращается на две строки ниже, и выбранная роль не доживала
  // до строки в конце функции.
  if(p._roleKey) a.roleKey=p._roleKey;
  /* Роль по профилю — с СЫРОГО профиля, до подтяжки к рейтингу. Вопрос
     16.09: «почему тип из игла у меня в команде становится фраггером со
     временем?». Подтяжка ниже прибавляет всем статам одно число и режет на 99:
     у растущего напарника сильная половина упирается в потолок, слабая
     догоняет — и roleFromProfile переворачивалась. Роль человека от того, что
     он вырос, не меняется. */
  const rawRole=roleFromProfile(a);
  const floor=p._targetOvr
    || RATING_FLOOR[(p.handle||'').toLowerCase()]
    || (p.liquiName && RATING_FLOOR[p.liquiName.toLowerCase()]);
  /* Настоящая роль (Liquipedia) — и на карточке без подтяжки: раньше её ставила
     только подтяжка, и семь карточек (Sky, Trooly, Nebs…) меняли роль ровно в
     момент, когда напарник подрастал. */
  if(!floor || a.ovr===floor){ a.roleKey=p._roleKey || realRoleKey(p) || rawRole; return a; }
  let gap=floor-a.ovr, guard=0;
  while(gap!==0 && guard++<40){
    ATTR_KEYS.forEach(k=>{ a[k]=Math.round(clamp(a[k]+gap, 35, 99)); });
    a.ovr=Math.round(ATTR_KEYS.reduce((s,k)=>s+a[k]*ATTR_W[k],0));
    gap=floor-a.ovr;
  }
  a.bestAttr=bestPlayAttr(a);
  /* Выбранная роль бьёт настоящую: карьера, которая пересела, играет ту
     половину, на которую пересела, — и за настоящего игрока тоже, где до
     21 августа роль приходила из Liquipedia и не менялась ничем. */
  a.roleKey=p._roleKey || realRoleKey(p) || rawRole;
  return a;
}

// The roster spells the same person more than one way across events — "Shxrk"
// and "shxrk", "FoCuS" and "Focus". Every check for "is this player already in
// the lobby" goes through this, so a bot can never end up with another card of
// someone the player has already drafted.
/* Пробел по краям ника — мусор выгрузки, а не имя: в таблицах 2024-2025 тот же
   человек приезжает как «Japko », а в 2026-м как «Japko», и без trim это два
   разных человека во всём файле сразу — в парах, в ростере, в пуле карьеры.
   Отзыв: «только двое japko в 25 году». Замер до правки: 90 ников с пробелом
   по краям, у 71 есть близнец без пробела. */
// Memo by raw string: hKey runs hundreds of thousands of times per render. Property, not const: called during load.
function hKey(p){ const s=String(p && p.handle || p || ''), m=hKey.m || (hKey.m=new Map());
  let v=m.get(s); if(v===undefined){ const k=s.toLowerCase().trim(); v=hKeySame(k) || k; m.set(s, v); } return v; }
/* Тег клуба перед ником: «Evenezy Howly» и «Howly» в одной сцене одного года стояли двумя людьми,
   и трио-рынок сажал его в две тройки сразу. Склеены только пары с общим напарником в строках
   (в той же сцене тег+ник ещё у 179, там есть настоящие тёзки, Misty Aim и Aim). Функция, а не
   const: hKey зовут и выше по файлу, при загрузке. */
function hKeySame(k){
  const m=hKeySame.m || (hKeySame.m={
"4114 elevate":"elevate","4d chap":"chap","7months galassia":"galassia","86 union":"union",
"aegis sekayg0d":"sekayg0d","alba-a fa1zzy":"fa1zzy","amg znappy":"znappy","anb tuna":"tuna",
"aurora heror3h":"heror3h","axn compton":"compton","axr sleepy":"sleepy","big dusky":"dusky",
"bld gxra":"gxra","boomer blootea":"blootea","celis あおねこ416":"あおねこ416","code adonis":"adonis",
"code ronaldo":"ronaldo","demonio luis":"luis","detect exqu":"exqu","die nx1xyfvǃ":"nx1xyfvǃ",
"egoist try":"try","ehre zuko":"zuko","evenezy howly":"howly","evo thiaz":"thiaz",
"f4tality guizera":"guizera","fake vorwenn":"vorwenn","fl tofpita":"tofpita","fpx sad":"sad",
"fs kasz 7":"kasz 7","ge eraser":"eraser","gw voxe":"voxe","le danicush":"danicush","lil mshary":"mshary",
"loyal angel":"angel","mtrx nevify":"nevify","mystry vbzxy":"vbzxy","naw venji":"venji","nobu beef":"beef",
"noob teyo":"teyo","ortensia gepard":"gepard","outcast litzinio":"litzinio","pdr kenty":"kenty",
"power 7mood":"7mood","re あおねこ416":"あおねこ416","reds wolfizsf1":"wolfizsf1","reject たろう":"たろう",
"rns jadennx":"jadennx","rxb qerz":"qerz","señor seeyun":"seeyun","sfg whizxiy":"whizxiy",
"smg arkive":"arkive","sol noward":"noward","svn chipson":"chipson","swift taytan":"taytan","top puzz":"puzz",
"triggy triggy":"triggy","twitch icyybtw":"icyybtw","twitch uxsif":"uxsif","un granjero":"granjero",
"vin ϟnip":"ϟnip","wasp nomfu":"nomfu","wave zandy":"zandy","wtr kisen":"kisen","x2twins jesse":"jesse",
"x2twins jordan":"jordan","xrb rqzrim3 喰":"rqzrim3 喰","yvl blizy":"blizy",
"100 nate":"nate","1vx noam":"noam","32 aziz":"aziz","38 nate":"nate","420 cadu":"cadu","50cal delta":"delta",
"50cal fruit":"fruit","7 hynei":"hynei","aegis kar4sen":"kar4sen","ag rhys":"rhys","anton k1ng":"k1ng",
"arm jafet":"jafet","asian aiden":"aiden","asp falex":"falex","aurora 7tor":"7tor","batman bugha":"bugha",
"batman leo":"leo","bay codyǃ":"codyǃ","begenius jules":"jules","big fhd":"fhd","bld mvtnfiez":"mvtnfiez",
"blz stark":"stark","cheese price":"price","claim psy":"psy","code crimz":"crimz","code tendai":"tendai",
"cold fhd":"fhd","console faxuty":"faxuty","consort vortex":"vortex","csm kiwify":"kiwify",
"detect cavera":"cavera","diktator alex":"alex","edg fire":"fire","egoist avery":"avery",
"egy iceleoǃ":"iceleoǃ","exa buzzbusy":"buzzbusy","fa horde":"horde","fear nevo":"nevo","fear pxmp":"pxmp",
"fpx xiaohong":"xiaohong","fut phzin":"phzin","g natanyo":"natanyo","gary rain":"rain",
"glore splasheax":"splasheax","glory barq":"barq","gm dom":"dom","gt jakeocuh":"jakeocuh","heil bean":"bean",
"hst しゅんコロ":"しゅんコロ","hwk acez":"acez","hwk river":"river","hwk tom":"tom","intz drakonz":"drakonz",
"jft orvix":"orvix","jobz buzz":"buzz","jogo oatley":"oatley","jpg tнz1nz7":"tнz1nz7","kevinn fishy":"fishy",
"kng lipex":"lipex","knockoff cented":"cented","ko mjood":"mjood","kwz clemens":"clemens",
"kyoto dekeltryr.":"dekeltryr.","kёяιs みやお たいが":"たいが","ld1 okram":"okram","leaf neemo":"neemo",
"lex rodri btj":"rodri btj","lil jay":"jay","litery peterbot":"peterbot","loyal wreckless":"wreckless",
"lucky mr.j":"mr.j","lx kbr":"kbr","lynx-y えあるやけん":"えあるやけん","m7 royale7s":"royale7s","makulacha pala":"pala",
"mini naevz":"naevz","mini worthy":"worthy","monki solou":"solou","mr chris":"chris","nvx okram":"okram",
"og prisi0n3r0":"prisi0n3r0","ookla zas":"zas","owl sohib":"sohib","p90 bot":"bot","piggy bread":"bread",
"prime woodsy":"woodsy","prs freemok":"freemok","psr tricks":"tricks","psyc benskinator":"benskinator",
"r2p anik":"anik","respect leyyner":"leyyner","retconpunch epsy":"epsy","riddιe rise":"rise",
"rvl saad":"saad","sab iceleoǃ":"iceleoǃ","salvatorre salt":"salt","sfg ark":"ark","smfdb mayhem":"mayhem",
"ss brakz":"brakz","strive darkiizz":"darkiizz","t1 mase":"mase","td edson":"edson",
"tga dylangodoy9":"dylangodoy9","thegreat faisal":"faisal","thiccboy luneze":"luneze","titans fahad":"fahad",
"triggerqq uniq":"uniq","tse didzzz":"didzzz","ttk ricardinfvǃ":"ricardinfvǃ","twis strike":"strike",
"twitch 17_jd":"17_jd","twitch adsfishy":"adsfishy","twitch metritt":"metritt","twitch zdog":"zdog",
"twitter maxifv99":"maxifv99","unstopable fahad":"fahad","vacan boss":"boss","vam0s ありす":"ありす",
"venly flowsstarr":"flowsstarr","vf m1nt":"m1nt","vinsmoke voltzzz":"voltzzz","vks seeyun":"seeyun",
"vng corbzz":"corbzz","wgs macchan":"macchan","wkey lyght":"lyght","xp42 louieblanc":"louieblanc",
"yjm zacks":"zacks","yonder july":"july","zeta minipiyo":"minipiyo","zeta yuma":"yuma",
"zynbl prurun":"prurun","あいくん bot":"bot","みやお たいが":"たいが","鬼 issa":"issa"});
  return m[k];
}

function attrsForRaw(p){
  if(p._attrs) return p._attrs;
  // A Reload Elite Series card carries its stage the same way a 2025 card does:
  // one descriptor, so four cups times seven stages do not become twenty-eight
  // more branches in the chain below. The band is the stage's own — see rBase.
  if(p._r){
    p._attrs=buildM1Attrs(p._r.entry, p.handle, p._r.sorts,
                          rBase(p.cardSet, p.region, p._rStage, p._r.entry.rank), 0);
    return p._attrs;
  }
  // Финал недели дивизиона 1 несёт свою неделю тем же способом: один
  // описатель на четыре набора, полоса своя — см. divBase.
  if(p._dv){
    p._attrs=buildM1Attrs(p._dv.entry, p.handle, p._dv.sorts,
                          divBase(p._dv.week, p._dv.entry.rank), 0);
    return p._attrs;
  }
  // FNCS Solos (S42): строка отбора финалиста, полоса по месту в финале.
  if(p._s42){
    p._attrs=buildM1Attrs(p._s42.entry, p.handle, p._s42.sorts, p._s42.base, 0);
    return p._attrs;
  }
  // Every 2025 card carries its own stage descriptor, so one branch covers all
  // seven regions and three stages. The chain below is already forty-odd
  // branches deep because the 2026 sets encode the stage in the property name;
  // twenty-one more would have buried it.
  if(p._t1){
    const st=p._t1Stage;
    // The set has to come off the card. Reading the field size and the band
    // from Major 1 for every 2025 card would rate a Major 3 Play-In against
    // Major 1's Play-In -- a different tournament with a different field.
    const set=p.cardSet;
    const base = p.missedGf
      ? (st==='P' ? missedGfPlayinBase(p._t1.entry.rank, _T[set][p.region].P.length)
        : st==='L' ? missedGfLcqBase(p._t1.entry.rank, _T[set][p.region].L.length)
        : tBase(set, p.region, st, p._t1.entry.rank))
      : tBase(set, p.region, st, p._t1.entry.rank);
    p._attrs=buildM1Attrs(p._t1.entry, p.handle, p._t1.sorts, base, 0);
    return p._attrs;
  }
  const pen = p.missedGf ? NO_GF_PENALTY : 0;
  if(p._m2Gf){ p._attrs=buildM1Attrs(p._m2Gf, p.handle, _S.m2g, m2GfBase(p._m2Gf.rank), 0); return p._attrs; }
  if(p._m2Playin){ p._attrs=buildM1Attrs(p._m2Playin, p.handle, _S.m2p,
    p.missedGf ? missedGfPlayinBase(p._m2Playin.rank, _M2P.length) : m2PlayinBase(p._m2Playin.rank), 0); return p._attrs; }
  if(p._m2Lcq){ p._attrs=buildM1Attrs(p._m2Lcq, p.handle, _S.m2l,
    p.missedGf ? missedGfLcqBase(p._m2Lcq.rank, _M2L.length) : m2LcqBase(p._m2Lcq.rank), 0); return p._attrs; }
  if(p._m2Lcq1){ p._attrs=buildM1Attrs(p._m2Lcq1, p.handle, _S.m2l1,
    p.missedGf ? missedGfLcqBase(_M2L.length+p._m2Lcq1.rank, m2LcqLen()) : m2Lcq1Base(p._m2Lcq1.rank), 0); return p._attrs; }
  if(p._n2Gf){ p._attrs=buildM1Attrs(p._n2Gf, p.handle, _S.n2g, n2GfBase(p._n2Gf.rank), 0); return p._attrs; }
  if(p._w2Gf){ p._attrs=buildM1Attrs(p._w2Gf, p.handle, _S.w2g, w2GfBase(p._w2Gf.rank), 0); return p._attrs; }
  if(p._b2Gf){ p._attrs=buildM1Attrs(p._b2Gf, p.handle, _S.b2g, b2GfBase(p._b2Gf.rank), 0); return p._attrs; }
  if(p._a2Gf){ p._attrs=buildM1Attrs(p._a2Gf, p.handle, _S.a2g, a2GfBase(p._a2Gf.rank), 0); return p._attrs; }
  if(p._e2Gf){ p._attrs=buildM1Attrs(p._e2Gf, p.handle, _S.e2g, e2GfBase(p._e2Gf.rank), 0); return p._attrs; }
  if(p._o2Gf){ p._attrs=buildM1Attrs(p._o2Gf, p.handle, _S.o2g, o2GfBase(p._o2Gf.rank), 0); return p._attrs; }
  if(p._o2Playin){ p._attrs=buildM1Attrs(p._o2Playin, p.handle, _S.o2p,
    p.missedGf ? missedGfPlayinBase(p._o2Playin.rank, _O2P.length) : o2PlayinBase(p._o2Playin.rank), 0); return p._attrs; }
  if(p._o2Lcq){ p._attrs=buildM1Attrs(p._o2Lcq, p.handle, _S.o2l,
    p.missedGf ? missedGfLcqBase(p._o2Lcq.rank, _O2L.length) : o2LcqBase(p._o2Lcq.rank), 0); return p._attrs; }
  if(p._o2Lcq1){ p._attrs=buildM1Attrs(p._o2Lcq1, p.handle, _S.o2l1,
    p.missedGf ? missedGfLcqBase(_O2L.length+p._o2Lcq1.rank, o2LcqLen()) : o2Lcq1Base(p._o2Lcq1.rank), 0); return p._attrs; }
  if(p._e2Playin){ p._attrs=buildM1Attrs(p._e2Playin, p.handle, _S.e2p,
    p.missedGf ? missedGfPlayinBase(p._e2Playin.rank, _E2P.length) : e2PlayinBase(p._e2Playin.rank), 0); return p._attrs; }
  if(p._e2Lcq){ p._attrs=buildM1Attrs(p._e2Lcq, p.handle, _S.e2l,
    p.missedGf ? missedGfLcqBase(p._e2Lcq.rank, _E2L.length) : e2LcqBase(p._e2Lcq.rank), 0); return p._attrs; }
  if(p._e2Lcq1){ p._attrs=buildM1Attrs(p._e2Lcq1, p.handle, _S.e2l1,
    p.missedGf ? missedGfLcqBase(_E2L.length+p._e2Lcq1.rank, e2LcqLen()) : e2Lcq1Base(p._e2Lcq1.rank), 0); return p._attrs; }
  if(p._a2Playin){ p._attrs=buildM1Attrs(p._a2Playin, p.handle, _S.a2p,
    p.missedGf ? missedGfPlayinBase(p._a2Playin.rank, _A2P.length) : a2PlayinBase(p._a2Playin.rank), 0); return p._attrs; }
  if(p._a2Lcq){ p._attrs=buildM1Attrs(p._a2Lcq, p.handle, _S.a2l,
    p.missedGf ? missedGfLcqBase(p._a2Lcq.rank, _A2L.length) : a2LcqBase(p._a2Lcq.rank), 0); return p._attrs; }
  if(p._a2Lcq1){ p._attrs=buildM1Attrs(p._a2Lcq1, p.handle, _S.a2l1,
    p.missedGf ? missedGfLcqBase(_A2L.length+p._a2Lcq1.rank, a2LcqLen()) : a2Lcq1Base(p._a2Lcq1.rank), 0); return p._attrs; }
  if(p._b2Playin){ p._attrs=buildM1Attrs(p._b2Playin, p.handle, _S.b2p,
    p.missedGf ? missedGfPlayinBase(p._b2Playin.rank, _B2P.length) : b2PlayinBase(p._b2Playin.rank), 0); return p._attrs; }
  if(p._b2Lcq){ p._attrs=buildM1Attrs(p._b2Lcq, p.handle, _S.b2l,
    p.missedGf ? missedGfLcqBase(p._b2Lcq.rank, _B2L.length) : b2LcqBase(p._b2Lcq.rank), 0); return p._attrs; }
  if(p._b2Lcq1){ p._attrs=buildM1Attrs(p._b2Lcq1, p.handle, _S.b2l1,
    p.missedGf ? missedGfLcqBase(_B2L.length+p._b2Lcq1.rank, b2LcqLen()) : b2Lcq1Base(p._b2Lcq1.rank), 0); return p._attrs; }
  if(p._w2Playin){ p._attrs=buildM1Attrs(p._w2Playin, p.handle, _S.w2p,
    p.missedGf ? missedGfPlayinBase(p._w2Playin.rank, _W2P.length) : w2PlayinBase(p._w2Playin.rank), 0); return p._attrs; }
  if(p._w2Lcq){ p._attrs=buildM1Attrs(p._w2Lcq, p.handle, _S.w2l,
    p.missedGf ? missedGfLcqBase(p._w2Lcq.rank, _W2L.length) : w2LcqBase(p._w2Lcq.rank), 0); return p._attrs; }
  if(p._w2Lcq1){ p._attrs=buildM1Attrs(p._w2Lcq1, p.handle, _S.w2l1,
    p.missedGf ? missedGfLcqBase(_W2L.length+p._w2Lcq1.rank, w2LcqLen()) : w2Lcq1Base(p._w2Lcq1.rank), 0); return p._attrs; }
  if(p._n2Playin){ p._attrs=buildM1Attrs(p._n2Playin, p.handle, _S.n2p,
    p.missedGf ? missedGfPlayinBase(p._n2Playin.rank, _N2P.length) : n2PlayinBase(p._n2Playin.rank), 0); return p._attrs; }
  if(p._n2Lcq){ p._attrs=buildM1Attrs(p._n2Lcq, p.handle, _S.n2l,
    p.missedGf ? missedGfLcqBase(p._n2Lcq.rank, _N2L.length) : n2LcqBase(p._n2Lcq.rank), 0); return p._attrs; }
  if(p._n2Lcq1){ p._attrs=buildM1Attrs(p._n2Lcq1, p.handle, _S.n2l1,
    p.missedGf ? missedGfLcqBase(_N2L.length+p._n2Lcq1.rank, n2LcqLen()) : n2Lcq1Base(p._n2Lcq1.rank), 0); return p._attrs; }
  if(p._m1Gf){ p._attrs=buildM1Attrs(p._m1Gf, p.handle, _S.m1g, m1GfBase(p._m1Gf.rank), 0); return p._attrs; }
  if(p._m1Playin){ p._attrs=buildM1Attrs(p._m1Playin, p.handle, _S.m1p,
    p.missedGf ? missedGfPlayinBase(p._m1Playin.rank, _M1P.length) : m1PlayinBase(p._m1Playin.rank), 0); return p._attrs; }
  if(p._m1Lcq){ p._attrs=buildM1Attrs(p._m1Lcq, p.handle, _S.m1l,
    p.missedGf ? missedGfLcqBase(p._m1Lcq.rank, _M1L.length) : m1LcqBase(p._m1Lcq.rank), 0); return p._attrs; }
  if(p._m1Lcq1){ p._attrs=buildM1Attrs(p._m1Lcq1, p.handle, _S.m1l1,
    p.missedGf ? missedGfLcqBase(_M1L.length+p._m1Lcq1.rank, m1LcqLen()) : m1Lcq1Base(p._m1Lcq1.rank), 0); return p._attrs; }
  if(p._n1Gf){ p._attrs=buildM1Attrs(p._n1Gf, p.handle, _S.n1g, n1GfBase(p._n1Gf.rank), 0); return p._attrs; }
  if(p._n1Playin){ p._attrs=buildM1Attrs(p._n1Playin, p.handle, _S.n1p,
    p.missedGf ? missedGfPlayinBase(p._n1Playin.rank, _N1P.length) : n1PlayinBase(p._n1Playin.rank), 0); return p._attrs; }
  if(p._n1Lcq){ p._attrs=buildM1Attrs(p._n1Lcq, p.handle, _S.n1l,
    p.missedGf ? missedGfLcqBase(p._n1Lcq.rank, _N1L.length) : n1LcqBase(p._n1Lcq.rank), 0); return p._attrs; }
  if(p._n1Lcq1){ p._attrs=buildM1Attrs(p._n1Lcq1, p.handle, _S.n1l1,
    p.missedGf ? missedGfLcqBase(_N1L.length+p._n1Lcq1.rank, n1LcqLen()) : n1Lcq1Base(p._n1Lcq1.rank), 0); return p._attrs; }
  if(p._w1Gf){ p._attrs=buildM1Attrs(p._w1Gf, p.handle, _S.w1g, w1GfBase(p._w1Gf.rank), 0); return p._attrs; }
  if(p._w1Playin){ p._attrs=buildM1Attrs(p._w1Playin, p.handle, _S.w1p,
    p.missedGf ? missedGfPlayinBase(p._w1Playin.rank, _W1P.length) : w1PlayinBase(p._w1Playin.rank), 0); return p._attrs; }
  if(p._w1Lcq){ p._attrs=buildM1Attrs(p._w1Lcq, p.handle, _S.w1l,
    p.missedGf ? missedGfLcqBase(p._w1Lcq.rank, _W1L.length) : w1LcqBase(p._w1Lcq.rank), 0); return p._attrs; }
  if(p._w1Lcq1){ p._attrs=buildM1Attrs(p._w1Lcq1, p.handle, _S.w1l1,
    p.missedGf ? missedGfLcqBase(_W1L.length+p._w1Lcq1.rank, w1LcqLen()) : w1Lcq1Base(p._w1Lcq1.rank), 0); return p._attrs; }
  if(p._b1Gf){ p._attrs=buildM1Attrs(p._b1Gf, p.handle, _S.b1g, b1GfBase(p._b1Gf.rank), 0); return p._attrs; }
  if(p._b1Playin){ p._attrs=buildM1Attrs(p._b1Playin, p.handle, _S.b1p,
    p.missedGf ? missedGfPlayinBase(p._b1Playin.rank, _B1P.length) : b1PlayinBase(p._b1Playin.rank), 0); return p._attrs; }
  if(p._b1Lcq){ p._attrs=buildM1Attrs(p._b1Lcq, p.handle, _S.b1l,
    p.missedGf ? missedGfLcqBase(p._b1Lcq.rank, _B1L.length) : b1LcqBase(p._b1Lcq.rank), 0); return p._attrs; }
  if(p._b1Lcq1){ p._attrs=buildM1Attrs(p._b1Lcq1, p.handle, _S.b1l1,
    p.missedGf ? missedGfLcqBase(_B1L.length+p._b1Lcq1.rank, b1LcqLen()) : b1Lcq1Base(p._b1Lcq1.rank), 0); return p._attrs; }
  if(p._o1Gf){ p._attrs=buildM1Attrs(p._o1Gf, p.handle, _S.o1g, o1GfBase(p._o1Gf.rank), 0); return p._attrs; }
  if(p._o1Playin){ p._attrs=buildM1Attrs(p._o1Playin, p.handle, _S.o1p,
    p.missedGf ? missedGfPlayinBase(p._o1Playin.rank, _O1P.length) : o1PlayinBase(p._o1Playin.rank), 0); return p._attrs; }
  if(p._o1Lcq){ p._attrs=buildM1Attrs(p._o1Lcq, p.handle, _S.o1l,
    p.missedGf ? missedGfLcqBase(p._o1Lcq.rank, _O1L.length) : o1LcqBase(p._o1Lcq.rank), 0); return p._attrs; }
  if(p._o1Lcq1){ p._attrs=buildM1Attrs(p._o1Lcq1, p.handle, _S.o1l1,
    p.missedGf ? missedGfLcqBase(_O1L.length+p._o1Lcq1.rank, o1LcqLen()) : o1Lcq1Base(p._o1Lcq1.rank), 0); return p._attrs; }
  if(p._a1Gf){ p._attrs=buildM1Attrs(p._a1Gf, p.handle, _S.a1g, a1GfBase(p._a1Gf.rank), 0); return p._attrs; }
  if(p._a1Playin){ p._attrs=buildM1Attrs(p._a1Playin, p.handle, _S.a1p,
    p.missedGf ? missedGfPlayinBase(p._a1Playin.rank, _A1P.length) : a1PlayinBase(p._a1Playin.rank), 0); return p._attrs; }
  if(p._a1Lcq){ p._attrs=buildM1Attrs(p._a1Lcq, p.handle, _S.a1l,
    p.missedGf ? missedGfLcqBase(p._a1Lcq.rank, _A1L.length) : a1LcqBase(p._a1Lcq.rank), 0); return p._attrs; }
  if(p._a1Lcq1){ p._attrs=buildM1Attrs(p._a1Lcq1, p.handle, _S.a1l1,
    p.missedGf ? missedGfLcqBase(_A1L.length+p._a1Lcq1.rank, a1LcqLen()) : a1Lcq1Base(p._a1Lcq1.rank), 0); return p._attrs; }
  if(p._e1Gf){ p._attrs=buildM1Attrs(p._e1Gf, p.handle, _S.e1g, e1GfBase(p._e1Gf.rank), 0); return p._attrs; }
  if(p._e1Playin){ p._attrs=buildM1Attrs(p._e1Playin, p.handle, _S.e1p,
    p.missedGf ? missedGfPlayinBase(p._e1Playin.rank, _E1P.length) : e1PlayinBase(p._e1Playin.rank), 0); return p._attrs; }
  if(p._e1Lcq){ p._attrs=buildM1Attrs(p._e1Lcq, p.handle, _S.e1l,
    p.missedGf ? missedGfLcqBase(p._e1Lcq.rank, _E1L.length) : e1LcqBase(p._e1Lcq.rank), 0); return p._attrs; }
  if(p._e1Lcq1){ p._attrs=buildM1Attrs(p._e1Lcq1, p.handle, _S.e1l1,
    p.missedGf ? missedGfLcqBase(_E1L.length+p._e1Lcq1.rank, e1LcqLen()) : e1Lcq1Base(p._e1Lcq1.rank), 0); return p._attrs; }
  // No stage entry for this card — reserves, and anyone whose only record is a
  // final standing with no per-match line. There is exactly one real number to
  // work from, the rating the placement earned, so the profile is flat at that
  // rating instead of an invented archetype. Experience still resolves whenever
  // the player appears anywhere else in the dataset, which is the one column a
  // bare standing can still fill honestly.
  const base=p.rating||45;
  const off={};
  ATTR_KEYS.forEach(k=>{ off[k]=0; });
  const known=_EXP[String(p.handle||'').toLowerCase()];
  if(known) off.exp=(expPct(p.handle)-0.5)*22;
  const a=finishAttrs(off, base);
  a.roleKey=realRoleKey(p) || a.roleKey;
  a.flat=!known;          // card has no per-match data behind it
  p._attrs=a;
  return a;
}

// Runs below ATTR_KEYS and attrsFor on purpose: calling it any earlier throws a
// temporal-dead-zone error that kills the whole script, which it did once.
applyS1nedMeme(true);

const CARD_SKIN={
  common:   {bg:'linear-gradient(155deg,#c9ced4 0%,#7c838c 48%,#3d424a 100%)', glow:'#b1b1b1', tag:'COMMON'},
  uncommon: {bg:'linear-gradient(155deg,#5bff4d 0%,#2fcb1f 48%,#11660a 100%)', glow:'#5bff4d', tag:'UNCOMMON'},
  rare:     {bg:'linear-gradient(155deg,#31b6ff 0%,#0f74dd 48%,#063a80 100%)', glow:'#00a3ff', tag:'RARE'},
  epic:     {bg:'linear-gradient(155deg,#c64cff 0%,#8e2bd6 48%,#4a0e85 100%)', glow:'#c64cff', tag:'EPIC'},
  legendary:{bg:'linear-gradient(155deg,#ffa53d 0%,#e56a00 48%,#7f3600 100%)', glow:'#ff8c1a', tag:'LEGENDARY'},
  mythic:   {bg:'linear-gradient(155deg,#ffe14d 0%,#e0a500 48%,#7a5a00 100%)', glow:'#ffd200', tag:'MYTHIC'},
  /* Exotic — редкость контент-мейкера (см. shownRarity). Её тут не было, и
     карточка креатора рисовалась серой: CARD_SKIN[rarity] не находил ключа и
     падал на common. Отчёт — «у карточки цвет не exotic».
     Цвет — тот же #70C7F8 из --exotic, снятый с фортнайтовской вики. */
  exotic:   {bg:'linear-gradient(155deg,#cdefff 0%,#70c7f8 48%,#186a9e 100%)', glow:'#70c7f8', tag:'EXOTIC'},
  /* Карточка формы — как TOTW/TOTS в ФИФЕ: чёрная, с золотой каймой и бликом, чтобы в паке её было видно
     сразу и не путать с мифической (та золотая целиком). См. yearRatingPass, ccFormCardsFor. */
  form:     {bg:'linear-gradient(118deg,rgba(255,214,102,0) 38%,rgba(255,214,102,.22) 46%,rgba(255,214,102,0) 54%),linear-gradient(155deg,#3b3f4a 0%,#15181f 46%,#000 100%)', glow:'#f6c343', tag:'IN FORM'}
};

// Real photos, keyed by handle, for players where we actually have the rights
// to use the image. Anyone not listed here falls back to a generated monogram
// portrait, so the deck stays visually consistent instead of half-empty.
// Photographs of real people, cropped to the card's portrait frame. Keyed by
// handle; anyone without an entry falls back to the drawn monogram.
// Portraits are stored next to this file in ./photos/ rather than inlined,
// which keeps the page itself small and lets the browser cache and load
// them lazily. A key of the form "Handle@REGION" pins a photo to one player
// when two different people share a handle (a Japanese "Rainy" in ASIA and
// an Australian one in OCE); the bare handle is the default for everyone else.
const PHOTO_DIR='photos/';
const PLAYER_PHOTO={
  // Portraits from Liquipedia profiles, CC-BY-SA 3.0.
  /* Пополнение 22 августа: восемнадцать портретов дивизиона 1 Европы, снятых
     с их же профилей. Ключ с регионом, а не голый ник, — ровно для того, для
     чего он тут и заведён: в файле 137 ников заняты двумя разными людьми, и
     голый ключ отдал бы лицо европейца его тёзке из другого региона.

     Каждый сверен по стране: у мода она своя, и совпасть должна. Из ста
     двадцати восьми найденных страниц шестнадцать оказались тёзками — Velo,
     Gold, Hyper, Polo, Yanni, Wifi и другие уехали в United States, — и ни
     один из них сюда не попал. K0tyarich придержан отдельно: страны у него в
     моде нет, сверять не с чем.

     Размер тот же, что у соседей по папке: наибольшая сторона 240. */
  "Akiira@EU": "Akiira.jpg",
  "Fastroki@EU": "Fastroki.jpg",
  "Cheetiin@EU": "Cheetiin.jpg",
  "JannisZ@EU": "JannisZ.jpg",
  "Hellfire@EU": "Hellfire.jpg",
  "Hijoe@EU": "Hijoe.jpg",
  "Kiro@EU": "Kiro.jpg",
  "Nebs@EU": "Nebs.jpg",
  "Moneymaker@EU": "Moneymaker.jpg",
  "Mikson@EU": "Mikson.jpg",
  "Kyry@EU": "Kyry.jpg",
  "PodaSai@EU": "PodaSai.jpg",
  "Pinq@EU": "Pinq.jpg",
  "Nxthan@EU": "Nxthan.jpg",
  "Repairs@EU": "Repairs.jpg",
  "Trexer@EU": "Trexer.jpg",
  "Seyyto@EU": "Seyyto.jpg",
  "Shxrk@EU": "Shxrk.jpg",
  /* Дополнительные портреты. Регион проверен tools/photo-handle-probe.js: ник ищется по всем
     карточным таблицам, регион берётся из имени таблицы (CARD_T1NAC_GF_RAW → NAC).
     Где ник занят дважды, нужен ключ с регионом: yuma = ASIA (японец, не мексиканский Yuma),
     P1ng различается регистром и попадает только в европейца.
     Имена файлов не совпадают с ником: HERORH3.jpg = «Aurora Heror3h», 916Gon.jpg (был пробел в имени),
     phzin записан с тегом команды. Старый ключ Phzin оставлен: в Глобалах трио бьются по голому нику. */
  "Bugha@NAC": "BUGHA.jpg",
  "Braydz@NAC": "BRAYDZ.jpg",
  "yuma@ASIA": "YUMA.jpg",
  "Koyota@ASIA": "KOYOTA.jpg",
  "Goofy@OCE": "GOOFY.jpg",
  "anon@OCE": "ANON.jpg",
  "Oatley@OCE": "OATLEY.jpg",
  "F1n4ik@EU": "F1N4IK.jpg",
  "Aurora Heror3h@EU": "HERORH3.jpg",
  "916Gon@BR": "916Gon.jpg",
  "FUT phzin 伊万尔@BR": "Phzin.jpg",
  "Cadu": "Cadu.jpg",
  "Chico": "Chico.jpg",
  "Clix": "Clix.jpg",
  "Fazer": "Fazer.jpg",
  "Fredoxie": "Fredoxie.jpg",
  "Higgs": "Higgs.jpg",
  "IDrop": "IDrop.jpg",
  "K1nG": "K1nG.jpg",
  "MariusCOW": "MariusCOW.jpg",
  "Merstach": "Merstach.jpg",
  "MrSavage": "MrSavage.jpg",
  "Muz": "Muz.jpg",
  "Phzin": "Phzin.jpg",
  "Queasy": "Queasy.jpg",
  "Rapid": "Rapid.jpg",
  "Setty": "Setty.jpg",
  "Sphinx": "Sphinx.jpg",
  "Stryker": "Stryker.jpg",
  "TaySon": "TaySon.jpg",
  "Tisco": "Tisco.jpg",
  "Wox": "Wox.jpg",
  "NeFrizi": "NeFrizi.jpg",
  "P1ng": "P1ng.jpg",
  "Vanyak3kk": "Vanyak3kk.jpg",
  "1Lusha": "1Lusha.jpg",
  "S1neD": "S1neD.jpg",
  "S1ned": "S1neD.jpg",
  "Howly": "Howly.jpg",
  "Rainy@ASIA": "Rainy_ASIA.jpg",
  "Nalu": "Nalu.jpg",
  "Cole": "Cole.jpg",
  "Maddenv": "Maddenv.jpg",
  "Cazi": "Cazi.jpg",
  "Deymo": "Deymo.jpg",
  "LBworks": "LBworks.jpg",
  "Bot": "Bot.jpg",
  "Izzi": "Izzi.jpg",
  "Nociff": "Nociff.jpg",
  "QnDx": "QnDx.jpg",
  "Phantom": "Phantom.jpg",
  "KING": "KING.jpg",
  "Teuzz": "Teuzz.jpg",
  "josh": "josh.jpg",
  "Eomzo": "Eomzo.jpg",
  "Noahreyli": "Noahreyli.jpg",
  "rezon ay": "rezon_ay.jpg",
  "Werex": "Werex.jpg",
  "kiduoo": "kiduoo.jpg",
  "FKS": "FKS.jpg",
  "Hero": "Hero.jpg",
  "Darm": "Darm.jpg",
  "Demus": "Demus.jpg",
  "demus": "Demus.jpg",
  "liamtfup": "liamtfup.jpg",
  "Jayse1x": "Jayse1x.jpg",
  "VicterV": "VicterV.jpg",
  "Khanada": "Khanada.jpg",
  "nvtylerh": "nvtylerh.jpg",
  "Channce": "Channce.jpg",
  "Vadeal": "Vadeal.jpg",
  "vadeal": "Vadeal.jpg",
  "Juu": "Juu.jpg",
  "Xavi": "Xavi.jpg",
  "Aminished": "Aminished.jpg",
  "pixx": "pixx.jpg",
  "Pixx": "pixx.jpg",
  "ghost": "ghost.jpg",
  "Ghost": "ghost.jpg",
  "Curve": "Curve.jpg",
  "Veno": "Veno.jpg",
  "veno": "Veno.jpg",
  "Minipiyo": "Minipiyo.jpg",
  "FuuKun": "FuuKun.jpg",
  "Fuukun": "FuuKun.jpg",
  "alex": "alex.jpg",
  "Wreckless": "Wreckless.jpg",
  "Cringe": "Cringe.jpg",
  "Volko": "Volko.jpg",
  "Minori": "Minori.jpg",
  "Darkos": "Darkos.jpg",
  "Lewa": "Lewa.jpg",
  "Romero": "Romero.jpg",
  "Belusi": "Belusi.jpg",
  "Zangi": "Zangi.jpg",
  "Nutifps": "Nutifps.jpg",
  "Gabzera": "Gabzera.jpg",
  "Akira": "Akira.jpg",
  "Kurama": "Kurama.jpg",
  "EpikWhale": "EpikWhale.jpg",
  "PXMP": "PXMP.jpg",
  "SkyJump": "SkyJump.jpg",
  "Skyjump": "SkyJump.jpg",
  "Momsy": "Momsy.jpg",
  "Tiggz": "Tiggz.jpg",
  "DaNicush": "DaNicush.jpg",
  "Resignz": "Resignz.jpg",
  "Tinka": "Tinka.jpg",
  "Syaaz": "Syaaz.jpg",
  "Scaryy": "Scaryy.jpg",
  "FoCuS": "FoCuS.jpg",
  "Focus": "FoCuS.jpg",
  "Th0masHD": "Th0masHD.jpg",
  "Golden": "Golden.jpg",
  "Ozone": "Ozone.jpg",
  "Tjino": "Tjino.jpg",
  "PabloWingu": "PabloWingu.jpg",
  "Chap@EU": "Chap_EU.jpg",
  "Flickzy": "Flickzy.jpg",
  "charyy": "charyy.jpg",
  "Charyy": "charyy.jpg",
  "Kami": "Kami.jpg",
  "Ajerss": "Ajerss.jpg",
  "Ritual": "Ritual.jpg",
  "Cold": "Cold.jpg",
  "cold": "Cold.jpg",
  "Rapid@NAC": "Rapid_NAC.jpg",
  "Cr1nge": "Cr1nge.jpg",
  "Twi": "Twi.jpg",
  "Japko": "Japko.jpg",
  "panzer": "panzer.jpg",
  "Sky": "Sky.jpg",
  "Scroll": "Scroll.jpg",
  "Acorn": "Acorn.jpg",
  "Boltz": "Boltz.jpg",
  "Kingaling": "Kingaling.jpg",
  "kingaling": "Kingaling.jpg",
  "Kraez": "Kraez.jpg",
  "Reet": "Reet.jpg",
  "Cooper": "Cooper.jpg",
  "Shadow": "Shadow.jpg",
  "Vergo": "Vergo.jpg",
  "SwizzY": "SwizzY.jpg",
  "Pixie": "Pixie.jpg",
  "vic0": "vic0.jpg",
  "Malibuca": "Malibuca.jpg",
  "Peterbot": "Peterbot.jpg",
  "Pollo": "Pollo.jpg",
  /* Ключа "shxrk" здесь больше нет. Карточки с таким ником в нижнем регистре
     в файле не существует — есть только "Shxrk" (EU), и он назван выше вместе
     с регионом. Запись жила зря и вдобавок указывала на shxrk.jpg: на Windows
     это тот же файл, что Shxrk.jpg, а на Cloudflare — 404. */
  "t3eny": "t3eny.jpg",
  // The scene around the players: coaches, casters and the people who run the
  // clubs. Most are not on the roster, so nothing looks them up yet — the
  // portraits are here so the accounts that will carry them have a face.
  "At0m_GG": "At0m_GG.jpg",
  "BoopNL_": "BoopNL_.jpg",
  "CoachEsteh": "CoachEsteh.jpg",
  "Coach_F0x": "Coach_F0x.jpg",
  "JoaovEU": "JoaovEU.jpg",
  "PeanutBrainTS": "PeanutBrainTS.jpg",
  "Rabidfn": "Rabidfn.jpg",
  "RazZzero0oFN": "RazZzero0oFN.jpg",
  "SvenSE_": "SvenSE_.jpg",
  "ZykomaTV": "ZykomaTV.jpg",
  "diaspaulin_": "diaspaulin_.jpg",
  "spidryx": "spidryx.jpg",
  "stormyrite": "stormyrite.jpg",
  "tallami1": "tallami1.jpg",
  /* Семь портретов, положенных им в photos/ 24 августа. Ключи С РЕГИОНОМ, а не
     голые: в файле 137 ников заняты дважды, и голый ключ отдаёт лицо тёзке из
     другого региона. Регион у каждого взят из самого ростера (PLAYERS), а не
     на глаз.

     Curly — единственный спорный: их два, американец (девять строк ростера,
     США) и европеец одной строкой без страны. Лицо отдано американцу; если
     снят европейский — поменять ключ на Curly@EU, правка в один символ. */
  "Curly@NAC": "curly.jpg",
  "Kirillian@NAC": "kirillian.jpg",
  "Night@BR": "night.jpg",
  "Randu@BR": "randu.jpg",
  "Vazen@OCE": "vazen.jpg",
  "Velofps@EU": "velofps.jpg",
  "Visxals@NAC": "visxals.jpg",
  /* Пополнение 21 сентября 2026 — портреты людей 2025-го (наборы t1–t3), отзыв
     «добавь в 25 году аватарки людям, у которых их нет». Liquipedia (инфобокс игрока,
     tools/fetch-player-photos-v2.js, CC-BY-SA 3.0) и Twitch (аватар канала под тем же ником,
     tools/fetch-twitch-portraits.js — берётся только с приметой Fortnite). Ключ — с регионом. */
  "Mongraal@EU": "Mongraal.jpg",   // Liquipedia
  "Andilex@EU": "Andilex.jpg",   // Liquipedia
  "Refsgaard@EU": "Refsgaard.jpg",   // Liquipedia
  "Hen@EU": "Hen.jpg",   // Liquipedia
  "Nakoo@EU": "Nakoo.jpg",   // Liquipedia
  "Dela@EU": "Dela.jpg",   // Liquipedia
  "Xsweeze@EU": "Xsweeze.jpg",   // Liquipedia
  "Voxe@EU": "Voxe.jpg",   // Liquipedia
  "Merijn@EU": "Merijn.jpg",   // Liquipedia
  "zAndy@EU": "zAndy.jpg",   // Liquipedia
  "Anas@EU": "Anas.jpg",   // Liquipedia
  "Ceice@NAC": "Ceice.jpg",   // Liquipedia
  "Edgey@NAC": "Edgey.jpg",   // Liquipedia
  "Blake@NAC": "Blake.jpg",   // Liquipedia
  "Avivv@NAC": "Avivv.jpg",   // Liquipedia
  "Kwanti@NAC": "Kwanti.jpg",   // Liquipedia
  "Threats@NAC": "Threats.jpg",   // Liquipedia
  "npen@NAC": "npen.jpg",   // Liquipedia
  "NoahWPlays@NAC": "NoahWPlays.jpg",   // Liquipedia
  "oSydd@NAC": "oSydd.jpg",   // Liquipedia
  "Jargue@NAC": "Jargue.jpg",   // Liquipedia
  "verT@NAC": "verT.jpg",   // Liquipedia
  "Doxey@NAC": "Doxey.jpg",   // Liquipedia
  "Mackwood@NAC": "Mackwood.png",   // Liquipedia
  "Cam@NAC": "Cam.jpg",   // Liquipedia
  "Trashy@NAC": "Trashy.jpg",   // Liquipedia
  "Parz@NAW": "Parz.jpg",   // Liquipedia
  "Quinn@NAW": "Quinn.jpg",   // Liquipedia
  "Bacca@NAW": "Bacca.jpg",   // Liquipedia
  "Sxhool@NAW": "Sxhool.jpg",   // Liquipedia
  "Salko@NAW": "Salko.jpg",   // Liquipedia
  "Ark@NAW": "Ark.jpg",   // Liquipedia
  "minit@NAW": "minit.jpg",   // Liquipedia
  "Xpon@NAW": "Xpon.jpg",   // Liquipedia
  "Scarpa@BR": "Scarpa.jpg",   // Liquipedia
  "Faxuty@NAW": "Faxuty.jpg",   // Liquipedia
  "Pulga@BR": "Pulga.png",   // Liquipedia
  "blackoutz@BR": "blackoutz.jpg",   // Liquipedia
  "Grx@BR": "Grx.jpg",   // Liquipedia
  "Frosty@BR": "Frosty.jpg",   // Liquipedia
  "Buyuriru@ASIA": "Buyuriru.jpg",   // Liquipedia
  "Taiya@ASIA": "Taiya.jpg",   // Liquipedia
  "TEITEI@ASIA": "TEITEI.jpg",   // Liquipedia
  "Raito@ASIA": "Raito.jpg",   // Liquipedia
  "Razl@ASIA": "Razl.jpg",   // Liquipedia
  "Zagou@ASIA": "Zagou.jpg",   // Liquipedia
  "bykn@ASIA": "bykn.jpg",   // Liquipedia
  "merem@ASIA": "merem.jpg",   // Liquipedia
  "wickesy@ASIA": "wickesy.jpg",   // Liquipedia
  "Mansour@ME": "Mansour.jpg",   // Liquipedia
  "Kalgamer@ME": "Kalgamer.jpg",   // Liquipedia
  "Adapter@ME": "Adapter.jpg",   // Liquipedia
  "Escdark@ME": "Escdark.jpg",   // Liquipedia
  "Rew@ME": "Rew.jpg",   // Liquipedia
  "Rxtr@ME": "Rxtr.jpg",   // Liquipedia
  "Balor@ME": "Balor.jpg",   // Liquipedia
  "7man@ME": "7man.jpg",   // Liquipedia
  "Yo7med@ME": "Yo7med.jpg",   // Liquipedia
  "Snowy@ME": "Snowy.jpg",   // Liquipedia
  "Lord@ME": "Lord.png",   // Liquipedia
  "Aspect@OCE": "Aspect.png",   // Liquipedia
  "volx@OCE": "volx.jpg",   // Liquipedia
  "M0untain@OCE": "M0untain.jpg",   // Liquipedia
  "xavier@OCE": "xavier.jpg",   // Liquipedia
  "Sazers@OCE": "Sazers.jpg",   // Liquipedia
  "Looter@OCE": "Looter.jpg",   // Liquipedia
  "worthy@OCE": "worthy.jpg",   // Liquipedia
  "Kylie@EU": "Kylie.jpg",   // Liquipedia
  "k0tyarich@EU": "k0tyarich.jpg",   // Liquipedia
  "DeRoller@NAC": "DeRoller.jpg",   // Liquipedia
  "Jerald@OCE": "Jerald.jpg",   // Liquipedia
  "pxmp@OCE": "PXMP.jpg",   // Liquipedia
  "Dukez@NAC": "Dukez.png",   // Liquipedia
  "Mero@NAW": "Mero.png",   // Liquipedia
  "Paper@NAW": "Paper.jpg",   // Liquipedia
  "Controller@ME": "Controller.jpg",   // Liquipedia
  "dandepuzo@EU": "dandepuzo.png",   // Twitch
  "Pixovsky@EU": "Pixovsky.png",   // Twitch
  "Rezoy@EU": "Rezoy.png",   // Twitch
  "Gripey@EU": "Gripey.png",   // Twitch
  "Shaykoz@EU": "Shaykoz.png",   // Twitch
  "Liwshe@EU": "Liwshe.png",   // Twitch
  "SloxZay@EU": "SloxZay.png",   // Twitch
  "Marco@EU": "Marco.png",   // Twitch
  "Th3ioF@EU": "Th3ioF.png",   // Twitch
  "Hyper@EU": "Hyper.png",   // Twitch
  "Artskill@EU": "Artskill.png",   // Twitch
  "Fnajen@EU": "Fnajen.png",   // Twitch
  "Shamokiy@EU": "Shamokiy.png",   // Twitch
  "Snayzy@EU": "Snayzy.png",   // Twitch
  "Jakebuca@EU": "Jakebuca.png",   // Twitch
  "Sami@EU": "Sami.png",   // Twitch
  "Abdelfnr@EU": "Abdelfnr.png",   // Twitch
  "GudnBre@EU": "GudnBre.png",   // Twitch
  "Skyz@EU": "Skyz.png",   // Twitch
  "F1shyX@EU": "F1shyX.png",   // Twitch
  "neofinny@EU": "neofinny.png",   // Twitch
  "Schmalibuca@EU": "Schmalibuca.png",   // Twitch
  "Mald1s@EU": "Mald1s.png",   // Twitch
  "AlbaXna@EU": "AlbaXna.png",   // Twitch
  "Polo@EU": "Polo.png",   // Twitch
  "Praidyy@EU": "Praidyy.png",   // Twitch
  "Ricky@EU": "Ricky.png",   // Twitch
  "trippernn@EU": "trippernn.png",   // Twitch
  "Maloyache@EU": "Maloyache.png",   // Twitch
  "Zayni@EU": "Zayni.png",   // Twitch
  "97default@EU": "97default.png",   // Twitch
  "Autm0@EU": "Autm0.png",   // Twitch
  "Jqst1ce@EU": "Jqst1ce.png",   // Twitch
  "Waiz@EU": "Waiz.png",   // Twitch
  "Stormyrite@EU": "Stormyrite.png",   // Twitch
  "Ve1ryy@EU": "Ve1ryy.png",   // Twitch
  "xzeevit@EU": "xzeevit.png",   // Twitch
  "vouyyy@EU": "vouyyy.png",   // Twitch
  "palochka@EU": "palochka.png",   // Twitch
  "zVortex000@EU": "zVortex000.png",   // Twitch
  "G13ras@EU": "G13ras.png",   // Twitch
  "Kyto@EU": "Kyto.png",   // Twitch
  "Gold@EU": "Gold.png",   // Twitch
  "karad1m@EU": "karad1m.png",   // Twitch
  "KovaaksXD@EU": "KovaaksXD.png",   // Twitch
  "Casperinovic@EU": "Casperinovic.png",   // Twitch
  "Yanni@EU": "Yanni.png",   // Twitch
  "thrtysevnn@EU": "thrtysevnn.png",   // Twitch
  "skqttles@NAC": "skqttles.png",   // Twitch
  "Chimp@NAC": "Chimp.png",   // Twitch
  "Doniee@NAC": "Doniee.png",   // Twitch
  "Salt@NAC": "Salt.png",   // Twitch
  "OliverOG@NAC": "OliverOG.png",   // Twitch
  "Bylah@NAC": "Bylah.png",   // Twitch
  "Liam@NAC": "Liam.png",   // Twitch
  "FredbotFN@NAC": "FredbotFN.png",   // Twitch
  "Krreon@NAC": "Krreon.png",   // Twitch
  "Sparebow@NAC": "Sparebow.png",   // Twitch
  "Moxy3k@NAC": "Moxy3k.png",   // Twitch
  "cverce@NAC": "cverce.png",   // Twitch
  "Kickz@NAC": "Kickz.png",   // Twitch
  "bologn4@NAC": "bologn4.png",   // Twitch
  "Drecept@NAC": "Drecept.png",   // Twitch
  "cauzerz@NAC": "cauzerz.png",   // Twitch
  "Aaron@NAC": "Aaron.png",   // Twitch
  "Joji@NAC": "Joji.png",   // Twitch
  "AsianJeff@NAC": "AsianJeff.png",   // Twitch
  "Aloe@NAC": "Aloe.png",   // Twitch
  "tuhronto@NAC": "tuhronto.png",   // Twitch
  "ayokod@NAC": "ayokod.png",   // Twitch
  "Sommerset@NAC": "Sommerset.png",   // Twitch
  "Drew@NAC": "Drew.png",   // Twitch
  "Zaris@NAC": "Zaris.png",   // Twitch
  "Hakkioo@NAC": "Hakkioo.png",   // Twitch
  "Bobby@NAC": "Bobby.png",   // Twitch
  "REGULARBRD@NAC": "REGULARBRD.png",   // Twitch
  "teramcrazy@NAC": "teramcrazy.png",   // Twitch
  "HydraSZN@NAC": "HydraSZN.png",   // Twitch
  "2xBrando@NAC": "2xBrando.png",   // Twitch
  "Co1azo@NAC": "Co1azo.png",   // Twitch
  "Twunti@NAC": "Twunti.png",   // Twitch
  "Larson@NAC": "Larson.png",   // Twitch
  "Natmozs@NAC": "Natmozs.png",   // Twitch
  "Khetzui@NAC": "Khetzui.png",   // Twitch
  "Electrofv@NAC": "Electrofv.png",   // Twitch
  "lopiezz@NAC": "lopiezz.png",   // Twitch
  "Anshubuca@NAC": "Anshubuca.png",   // Twitch
  "cresy4k@NAC": "cresy4k.png",   // Twitch
  "anoniana@NAC": "anoniana.png",   // Twitch
  "Vibefiez@NAC": "Vibefiez.png",   // Twitch
  "Saucyrn@NAC": "Saucyrn.png",   // Twitch
  "Stomfishy@NAC": "Stomfishy.png",   // Twitch
  "snazfv@NAC": "snazfv.png",   // Twitch
  "Razz@NAC": "Razz.png",   // Twitch
  "agileszn@NAC": "agileszn.png",   // Twitch
  "Crackly@NAC": "Crackly.png",   // Twitch
  "CloverFnx@NAC": "CloverFnx.png",   // Twitch
  "Rogue@NAC": "Rogue.png",   // Twitch
  "ImploderOfErasSC@NAC": "ImploderOfErasSC.png",   // Twitch
  "Giganticboogy@NAC": "Giganticboogy.png",   // Twitch
  "littlelango83@NAC": "littlelango83.png",   // Twitch
  "Figics@NAC": "Figics.png",   // Twitch
  "Yumi@NAW": "Yumi.png",   // Twitch
  "BludGansta47@NAW": "BludGansta47.png",   // Twitch
  "beasty@NAW": "beasty.png",   // Twitch
  "Zyro@NAW": "Zyro.png",   // Twitch
  "Yasir@NAW": "Yasir.png",   // Twitch
  "larccoz@NAW": "larccoz.png",   // Twitch
  "ZLinkRain@NAW": "ZLinkRain.png",   // Twitch
  "Blizy@NAW": "Blizy.png",   // Twitch
  "Jeulzz@NAW": "Jeulzz.png",   // Twitch
  "Qasruh@NAW": "Qasruh.png",   // Twitch
  "ChickenItza@NAW": "ChickenItza.png",   // Twitch
  "Leonyfishy@NAW": "Leonyfishy.png",   // Twitch
  "YooSaltyy@NAW": "YooSaltyy.png",   // Twitch
  "AliTHY@NAW": "AliTHY.png",   // Twitch
  "refinefnx@NAW": "refinefnx.png",   // Twitch
  "Resypical@NAW": "Resypical.png",   // Twitch
  "Slick@NAW": "Slick.png",   // Twitch
  "KomanderK@NAW": "KomanderK.png",   // Twitch
  "Saltloverr@NAW": "Saltloverr.png",   // Twitch
  "bluzro@NAW": "bluzro.png",   // Twitch
  "GuyAiden@NAW": "GuyAiden.png",   // Twitch
  "bullyslayrr@NAW": "bullyslayrr.png",   // Twitch
  "Crank@NAW": "Crank.png",   // Twitch
  "tinytawn@NAW": "tinytawn.png",   // Twitch
  "susscript@NAW": "susscript.png",   // Twitch
  "Flixxset@NAW": "Flixxset.png",   // Twitch
  "Rehx@NAW": "Rehx.png",   // Twitch
  "Delux@NAW": "Delux.png",   // Twitch
  "THORIK@NAW": "THORIK.png",   // Twitch
  "Torvenn@NAW": "Torvenn.png",   // Twitch
  "Jelty@NAW": "Jelty.png",   // Twitch
  "eryxton7@NAW": "eryxton7.png",   // Twitch
  "benfv7@NAW": "benfv7.png",   // Twitch
  "Trey509@NAW": "Trey509.png",   // Twitch
  "Oceanx1x@NAW": "Oceanx1x.png",   // Twitch
  "Gosu@NAW": "Gosu.png",   // Twitch
  "ArceSD@NAW": "ArceSD.png",   // Twitch
  "quaxzywtf@NAW": "quaxzywtf.png",   // Twitch
  "Sywizen@NAW": "Sywizen.png",   // Twitch
  "Kerzuh@NAW": "Kerzuh.png",   // Twitch
  "Virus@NAW": "Virus.png",   // Twitch
  "elirayyy@NAW": "elirayyy.png",   // Twitch
  "kennesiss@NAW": "kennesiss.png",   // Twitch
  "Myst@BR": "Myst.png",   // Twitch
  "axadasz@BR": "axadasz.png",   // Twitch
  "N3Wghoost@BR": "N3Wghoost.png",   // Twitch
  "keicox@BR": "keicox.png",   // Twitch
  "Fuzettin@BR": "Fuzettin.png",   // Twitch
  "EdRoadToGlory@BR": "EdRoadToGlory.png",   // Twitch
  "Tecne@BR": "Tecne.png",   // Twitch
  "Diguera@BR": "Diguera.png",   // Twitch
  "Paulinyache32@BR": "Paulinyache32.png",   // Twitch
  "N6hue@BR": "N6hue.png",   // Twitch
  "Nahuxwq@BR": "Nahuxwq.png",   // Twitch
  "Strendd@BR": "Strendd.png",   // Twitch
  "jonyleex@BR": "jonyleex.png",   // Twitch
  "Chizi@BR": "Chizi.png",   // Twitch
  "Tatinocho@BR": "Tatinocho.png",   // Twitch
  "Marsfps1@BR": "Marsfps1.png",   // Twitch
  "Azgiu@BR": "Azgiu.png",   // Twitch
  "readysz@BR": "readysz.png",   // Twitch
  "killerkjj@BR": "killerkjj.png",   // Twitch
  "Nicksreyn@BR": "Nicksreyn.png",   // Twitch
  "Dediez@BR": "Dediez.png",   // Twitch
  "Luizinzxbr@BR": "Luizinzxbr.png",   // Twitch
  "Covrezinn@BR": "Covrezinn.png",   // Twitch
  "Canvinis@BR": "Canvinis.png",   // Twitch
  "Velxcista@BR": "Velxcista.png",   // Twitch
  "blummss@BR": "blummss.png",   // Twitch
  "d1egobtw67@BR": "d1egobtw67.png",   // Twitch
  "pietrofn6@BR": "pietrofn6.png",   // Twitch
  "langonifv@BR": "langonifv.png",   // Twitch
  "loffsz@BR": "loffsz.png",   // Twitch
  "JPFK1NG@BR": "JPFK1NG.png",   // Twitch
  "VxttorFN@BR": "VxttorFN.png",   // Twitch
  "Dutraftn@BR": "Dutraftn.png",   // Twitch
  "Txtuba@BR": "Txtuba.png",   // Twitch
  "nitrzrr@BR": "nitrzrr.png",   // Twitch
  "xMipoli@ASIA": "xMipoli.png",   // Twitch
  "Yucky@ASIA": "Yucky.png",   // Twitch
  "bell@ASIA": "bell.png",   // Twitch
  "Allen@ASIA": "Allen.png",   // Twitch
  "4DRStork@ASIA": "4DRStork.png",   // Twitch
  "Lily@ASIA": "Lily.png",   // Twitch
  "R1ze@ASIA": "R1ze.png",   // Twitch
  "rara@ASIA": "rara.png",   // Twitch
  "steamywiny@ASIA": "steamywiny.png",   // Twitch
  "Silent@ASIA": "Silent.png",   // Twitch
  "fuwa@ASIA": "fuwa.png",   // Twitch
  "Taxruxx@ASIA": "Taxruxx.png",   // Twitch
  "Skydeun@ME": "Skydeun.png",   // Twitch
  "Sultan@ME": "Sultan.png",   // Twitch
  "Fahad@ME": "Fahad.png",   // Twitch
  "Nachiiri@ME": "Nachiiri.png",   // Twitch
  "Devy9x@ME": "Devy9x.png",   // Twitch
  "erinozy@ME": "erinozy.png",   // Twitch
  "Slay@ME": "Slay.png",   // Twitch
  "Hza3fv@ME": "Hza3fv.png",   // Twitch
  "ba7rb@ME": "ba7rb.png",   // Twitch
  "chepast1k@ME": "chepast1k.png",   // Twitch
  "i5adx@ME": "i5adx.png",   // Twitch
  "Alifnbr1@ME": "Alifnbr1.png",   // Twitch
  "Abodeet@ME": "Abodeet.png",   // Twitch
  "C10yyy@ME": "C10yyy.png",   // Twitch
  "Javix@ME": "Javix.png",   // Twitch
  "Cubix@ME": "Cubix.png",   // Twitch
  "iTzM7mdFN@ME": "iTzM7mdFN.png",   // Twitch
  "Vayro@ME": "Vayro.png",   // Twitch
  "Voetx@ME": "Voetx.png",   // Twitch
  "BQuuu@ME": "BQuuu.png",   // Twitch
  "rushfnz@ME": "rushfnz.png",   // Twitch
  "1Momed@ME": "1Momed.png",   // Twitch
  "Santaiwnl@ME": "Santaiwnl.png",   // Twitch
  "speedy@ME": "speedy.png",   // Twitch
  "ZDog@OCE": "ZDog.png",   // Twitch
  "Mace@OCE": "Mace.png",   // Twitch
  "Jxsn@OCE": "Jxsn.png",   // Twitch
  "Phazma@OCE": "Phazma.png",   // Twitch
  "Merc@OCE": "Merc.png",   // Twitch
  "Hezzaar@OCE": "Hezzaar.png",   // Twitch
  "wpuc@OCE": "wpuc.png",   // Twitch
  "Pudnara@OCE": "Pudnara.png",   // Twitch
  "Inxnct@OCE": "Inxnct.png",   // Twitch
  "Sorif@OCE": "Sorif.png",   // Twitch
  "Pumpkin@OCE": "Pumpkin.png",   // Twitch
  "Jakeocuh@OCE": "Jakeocuh.png",   // Twitch
  "VortexM@OCE": "VortexM.png",   // Twitch
  "vaxsr@OCE": "vaxsr.png",   // Twitch
  "SematicFN@OCE": "SematicFN.png",   // Twitch
  "Beat@OCE": "Beat.png",   // Twitch
  "jayd7z@OCE": "jayd7z.png",   // Twitch
  "Newbatoon@OCE": "Newbatoon.png",   // Twitch
  "trixxcuz@OCE": "trixxcuz.png",   // Twitch
  "zycra@OCE": "zycra.png",   // Twitch
  "Wharfers@OCE": "Wharfers.png",   // Twitch
  "Ceaqul@OCE": "Ceaqul.png",   // Twitch
  "naicosfv@OCE": "naicosfv.png",   // Twitch
  "STRE4MLESS@OCE": "STRE4MLESS.png",   // Twitch
  "MooMooOnMilk@OCE": "MooMooOnMilk.png",   // Twitch
  "harrycuh@OCE": "harrycuh.png",   // Twitch
  "John@OCE": "John.png",   // Twitch
  "Ranveerzr4x@OCE": "Ranveerzr4x.png",   // Twitch
  "Brock@OCE": "Brock.png",   // Twitch
  "ItsSambo3@OCE": "ItsSambo3.png",   // Twitch
  "Comawtf@OCE": "Comawtf.png",   // Twitch
  "Nerdzfv@OCE": "Nerdzfv.png",   // Twitch
  "Slaya@OCE": "Slaya.png",   // Twitch
  "Sync@OCE": "Sync.png",   // Twitch
  "zavfn@OCE": "zavfn.png",   // Twitch
  "clusvfv@OCE": "clusvfv.png",   // Twitch
  "Lofeo@OCE": "Lofeo.png",   // Twitch
  "BrunoFernandes1x@OCE": "BrunoFernandes1x.png",   // Twitch
  "Vynxyfishy@OCE": "Vynxyfishy.png",   // Twitch
  "Skyking1x@OCE": "Skyking1x.png",   // Twitch
  "KPLAGOD@OCE": "KPLAGOD.png",   // Twitch
  "Burga@OCE": "Burga.png",   // Twitch
  "Lynx1zr@EU": "Lynx1zr.png",   // Twitch
  "bevvys@EU": "bevvys.png",   // Twitch
  "Deckzee@EU": "Deckzee.png",   // Twitch
  "Dylangodoy9@EU": "Dylangodoy9.png",   // Twitch
  "Rela1zz@EU": "Rela1zz.png",   // Twitch
  "louiemontblanc@EU": "louiemontblanc.png",   // Twitch
  "Ricyszn@EU": "Ricyszn.png",   // Twitch
  "kescary@EU": "kescary.png",   // Twitch
  "Lu984@EU": "Lu984.png",   // Twitch
  "Bloodx@EU": "Bloodx.png",   // Twitch
  "NixGOTY@EU": "NixGOTY.png",   // Twitch
  "AyarBaffo@EU": "AyarBaffo.png",   // Twitch
  "Czesiack@EU": "Czesiack.png",   // Twitch
  "fert1cks@EU": "fert1cks.png",   // Twitch
  "LATTYMONEK@EU": "LATTYMONEK.png",   // Twitch
  "Lixium@EU": "Lixium.png",   // Twitch
  "Letflo@EU": "Letflo.png",   // Twitch
  "veteranopia@EU": "veteranopia.png",   // Twitch
  "ivifom@EU": "ivifom.png",   // Twitch
  "Avenger@NAC": "Avenger.png",   // Twitch
  "kashfv@NAC": "kashfv.png",   // Twitch
  "NoisyMilitaryMan@NAC": "NoisyMilitaryMan.png",   // Twitch
  "zenn@NAC": "zenn.png",   // Twitch
  "Glace@NAC": "Glace.png",   // Twitch
  "Aerctix@NAC": "Aerctix.png",   // Twitch
  "heavenfv7@NAC": "heavenfv7.png",   // Twitch
  "KYNSOUL@NAC": "KYNSOUL.png",   // Twitch
  "m3trol@NAC": "m3trol.png",   // Twitch
  "SplatNxte@NAC": "SplatNxte.png",   // Twitch
  "lmlwo@NAC": "lmlwo.png",   // Twitch
  "1ukeM@NAC": "1ukeM.png",   // Twitch
  "Slxy1k@NAC": "Slxy1k.png",   // Twitch
  "Skykame7@NAC": "Skykame7.png",   // Twitch
  "CyaThya@NAC": "CyaThya.png",   // Twitch
  "ryaic@NAW": "ryaic.png",   // Twitch
  "CONANIZED@NAW": "CONANIZED.png",   // Twitch
  "1xSwag@NAW": "1xSwag.png",   // Twitch
  "Bean@NAW": "Bean.png",   // Twitch
  "Vorzul@NAW": "Vorzul.png",   // Twitch
  "Kenzo@NAW": "Kenzo.png",   // Twitch
  "ItsFlashyJunior@NAW": "ItsFlashyJunior.png",   // Twitch
  "Henphix@NAW": "Henphix.png",   // Twitch
  "mxttfv_@NAW": "mxttfv_.png",   // Twitch
  "zCxrita@NAW": "zCxrita.png",   // Twitch
  "Luckfn31@NAW": "Luckfn31.png",   // Twitch
  "SudoFTW@NAW": "SudoFTW.png",   // Twitch
  "Flakes@BR": "Flakes.png",   // Twitch
  "oBartx@BR": "oBartx.png",   // Twitch
  "leleo@BR": "leleo.png",   // Twitch
  "StevinFN@BR": "StevinFN.png",   // Twitch
  "Kp7Blood@BR": "Kp7Blood.png",   // Twitch
  "toemfn6@BR": "toemfn6.png",   // Twitch
  "Kenyto@BR": "Kenyto.png",   // Twitch
  "Luchovp@BR": "Luchovp.png",   // Twitch
  "Palermo@BR": "Palermo.png",   // Twitch
  "Detpullzzz@BR": "Detpullzzz.png",   // Twitch
  "Nana@ASIA": "Nana.png",   // Twitch
  "Roy@ASIA": "Roy.png",   // Twitch
  "Maufnbr@ASIA": "Maufnbr.png",   // Twitch
  "Saud@ME": "Saud.png",   // Twitch
  "F1lckyy@ME": "F1lckyy.png",   // Twitch
  "sdahmedfv@ME": "sdahmedfv.png",   // Twitch
  "Aienreyli@ME": "Aienreyli.png",   // Twitch
  "Aggroxyz@ME": "Aggroxyz.png",   // Twitch
  "8atel_@ME": "8atel_.png",   // Twitch
  "xha3o0@ME": "xha3o0.png",   // Twitch
  "Rain@OCE": "Rain.png",   // Twitch
  "Carter@OCE": "Carter.png",   // Twitch
  "Nyxlr@OCE": "Nyxlr.png",   // Twitch
  "Wavy@OCE": "Wavy.png",   // Twitch
  "Bliss@OCE": "Bliss.png",   // Twitch
  "timelqss@OCE": "timelqss.png",   // Twitch
  "arxidz@OCE": "arxidz.png",   // Twitch
  "beadyink@OCE": "beadyink.png",   // Twitch
  "Lynnxfnt@OCE": "Lynnxfnt.png",   // Twitch
  "Insight@OCE": "Insight.png",   // Twitch
  "lachsaim@OCE": "lachsaim.png",   // Twitch
  "Vampi@EU": "Vampi.png",   // Twitch
  "Sonnif@EU": "Sonnif.png",   // Twitch
  "glubfnbr@EU": "glubfnbr.png",   // Twitch
  "AceFrac@EU": "AceFrac.png",   // Twitch
  "g0dag@EU": "g0dag.png",   // Twitch
  "jus1x3@EU": "jus1x3.png",   // Twitch
  "LuckyTeed@NAC": "LuckyTeed.png",   // Twitch
  "Voidiana@NAC": "Voidiana.png",   // Twitch
  "Sigma@NAC": "Sigma.png",   // Twitch
  "Willrz@NAC": "Willrz.png",   // Twitch
  "icyfai@NAC": "icyfai.png",   // Twitch
  "makofvv@NAC": "makofvv.png",   // Twitch
  "Aye2Fly@NAC": "Aye2Fly.png",   // Twitch
  "Nekyzs@NAC": "Nekyzs.png",   // Twitch
  "Jakozy@NAC": "Jakozy.png",   // Twitch
  "Ultra@NAC": "Ultra.png",   // Twitch
  "meifv@NAC": "meifv.png",   // Twitch
  "uhMattex@NAC": "uhMattex.png",   // Twitch
  "Boliyin_@NAW": "Boliyin_.png",   // Twitch
  "BbossFN@NAW": "BbossFN.png",   // Twitch
  "ModernZay@NAW": "ModernZay.png",   // Twitch
  "Survibear@NAW": "Survibear.png",   // Twitch
  "iZoxy7@NAW": "iZoxy7.png",   // Twitch
  "AcoroZr1@NAW": "AcoroZr1.png",   // Twitch
  "crystal5x@NAW": "crystal5x.png",   // Twitch
  "Scuffcat@NAW": "Scuffcat.png",   // Twitch
  "villak3k@BR": "villak3k.png",   // Twitch
  "Davidominee@BR": "Davidominee.png",   // Twitch
  "Jerok@BR": "Jerok-logo.png",   // логотип игрока
  "imccaii@BR": "imccaii.png",   // Twitch
  "uAniqui@BR": "uAniqui.png",   // Twitch
  "Jaime_profis@BR": "Jaime_profis.png",   // Twitch
  "swailai@ASIA": "swailai.png",   // Twitch
  "IxSaww@ME": "IxSaww.png",   // Twitch
  "alooshfv@ME": "alooshfv.png",   // Twitch
  "Clapsy@ME": "Clapsy.png",   // Twitch
  "Rayz@ME": "Rayz.png",   // Twitch
  "i3zfv7@ME": "i3zfv7.png",   // Twitch
  "Rakanhimself@ME": "Rakanhimself.png",   // Twitch
  "Falconfv@ME": "Falconfv.png",   // Twitch
  "Chaozfv@ME": "Chaozfv.png",   // Twitch
  "Elaptt@OCE": "Elaptt.png",   // Twitch
  "Caleb@OCE": "Caleb.png",   // Twitch
  "KingShanie@OCE": "KingShanie.png",   // Twitch
  "Trotfv@OCE": "Trotfv.png",   // Twitch
  "Jazzsku@OCE": "Jazzsku.png",   // Twitch
  "alyhes@OCE": "alyhes.png",   // Twitch
  "Sh1vyfn@OCE": "Sh1vyfn.png",   // Twitch
  "Rz Frxzify@EU": "RzFrxzify.png",   // Twitch
  "GLORE Splasheax@EU": "GLORESplasheax.png",   // Twitch
  "GWT RIZQUEZ@EU": "GWTRIZQUEZ.png",   // Twitch
  "Twitch noahjr10@EU": "Twitchnoahjr10.png",   // Twitch
  "Szumich.@EU": "Szumich..png",   // Twitch
  "HvN Kupcio71@EU": "HvNKupcio71.png",   // Twitch
  "7 Emppu@EU": "7Emppu.png",   // Twitch
  "Mask Fridge@EU": "MaskFridge.png",   // Twitch
  "Prooffer.@EU": "Prooffer..png",   // Twitch
  "twitch yoshxde@NAC": "twitchyoshxde.png",   // Twitch
  "twitter ralfn_@NAC": "twitterralfn_.png",   // Twitch
  "jezejearimǃ@NAC": "jezejearim.png",   // Twitch
  "twitch cirzl@NAC": "twitchcirzl.png",   // Twitch
  "Ferticeǃ@NAC": "Fertice.png",   // Twitch
  "twitch kirafv@NAC": "twitchkirafv.png",   // Twitch
  "Sxkezǃ@NAC": "Sxkez.png",   // Twitch
  "Twitch wileyggs@NAC": "Twitchwileyggs.png",   // Twitch
  "twitter cyrizfn@NAC": "twittercyrizfn.png",   // Twitch
  "Twitch Strikes1x@NAC": "TwitchStrikes1x.png",   // Twitch
  "x6 vqoux@NAC": "x6vqoux.png",   // Twitch
  "tiktok sovzy4x@NAC": "tiktoksovzy4x.png",   // Twitch
  "twitch 1xtofuu@NAC": "twitch1xtofuu.png",   // Twitch
  "twitch passionfn@NAC": "twitchpassionfn.png",   // Twitch
  "zelofvǃ@NAC": "zelofv.png",   // Twitch
  "C9 Doongoos@NAC": "C9Doongoos.png",   // Twitch
  "TP hqmkame@NAC": "TPhqmkame.png",   // Twitch
  "twitch zulpixfnx@NAC": "twitchzulpixfnx.png",   // Twitch
  "twtr spexzfn4@NAC": "twtrspexzfn4.png",   // Twitch
  "yоutube kingswpr@NAC": "yutubekingswpr.png",   // Twitch
  "Twitch kubi4x@NAC": "Twitchkubi4x.png",   // Twitch
  "Twitch WydSycho@NAC": "TwitchWydSycho.png",   // Twitch
  "twitch koazqy@NAC": "twitchkoazqy.png",   // Twitch
  "asl wave@NAC": "aslwave.png",   // Twitch
  "ttv 12lwis@NAC": "ttv12lwis.png",   // Twitch
  "i play faded@NAW": "iplayfaded.png",   // Twitch
  "Papi Blast@NAW": "PapiBlast.png",   // Twitch
  "kilo luh@NAW": "kiloluh.png",   // Twitch
  "denying.@NAW": "denying..png",   // Twitch
  "Mystry Spritewth@NAW": "MystrySpritewth.png",   // Twitch
  "Twitch Icyybtw@NAW": "TwitchIcyybtw.png",   // Twitch
  "TT Aarushftw@NAW": "TTAarushftw.png",   // Twitch
  "TWITCH ORCFN@NAW": "TWITCHORCFN.png",   // Twitch
  "Twitch paizawyd@NAW": "Twitchpaizawyd.png",   // Twitch
  "twitch spultyy_@NAW": "twitchspultyy_.png",   // Twitch
  "Hyper On Combat@NAW": "HyperOnCombat.png",   // Twitch
  "Piggy is bad@NAW": "Piggyisbad.png",   // Twitch
  "twitch bruinsfv@NAW": "twitchbruinsfv.png",   // Twitch
  "psr Tightfv@NAW": "psrTightfv.png",   // Twitch
  "El Made@NAW": "ElMade.png",   // Twitch
  "YouTube a11ract@NAW": "YouTubea11ract.png",   // Twitch
  "YouTube 1bwfn@NAW": "YouTube1bwfn.png",   // Twitch
  "z lynxfv@NAW": "zlynxfv.png",   // Twitch
  "TikTok WPS_FaTaL@NAW": "TikTokWPS_FaTaL.png",   // Twitch
  "twitter eranitfn@NAW": "twittereranitfn.png",   // Twitch
  "Twitch Jaxi74@NAW": "TwitchJaxi74.png",   // Twitch
  "Gu1 Prime@BR": "Gu1Prime.png",   // Twitch
  "5kz Dankame44@BR": "5kzDankame44.png",   // Twitch
  "Zett1nǃ@BR": "Zett1n.png",   // Twitch
  "v.takaa@BR": "v.takaa.png",   // Twitch
  "AG1RRE.@BR": "AG1RRE..png",   // Twitch
  "alands3ǃ@BR": "alands3.png",   // Twitch
  "Twitch Benjitix@BR": "TwitchBenjitix.png",   // Twitch
  "Diveca 23@BR": "Diveca23.png",   // Twitch
  "EGO pr0mpt@BR": "EGOpr0mpt.png",   // Twitch
  "Nicandro Reis1x@BR": "NicandroReis1x.png",   // Twitch
  "twitch bgftn@BR": "twitchbgftn.png",   // Twitch
  "avix 1@BR": "avix1.png",   // Twitch
  "House Happinyfv1@BR": "HouseHappinyfv1.png",   // Twitch
  "205 Marxv@BR": "205Marxv.png",   // Twitch
  "TTV avxjoao@BR": "TTVavxjoao.png",   // Twitch
  "vt malado@BR": "vtmalado.png",   // Twitch
  "ricardinfvǃ@BR": "ricardinfv.png",   // Twitch
  "Pretaxz.@BR": "Pretaxz..png",   // Twitch
  "SebaGoury.@BR": "SebaGoury..png",   // Twitch
  "lets get greedy@ASIA": "letsgetgreedy.png",   // Twitch
  "foolish cynsrr@ASIA": "foolishcynsrr.png",   // Twitch
  "generic peterbot@ASIA": "genericpeterbot.png",   // Twitch
  "Аfrican peterbot@ASIA": "fricanpeterbot.png",   // Twitch
  "skull nosh@ASIA": "skullnosh.png",   // Twitch
  "zeta yumafv@ASIA": "zetayumafv.png",   // Twitch
  "Jokuneyyǃ@ME": "Jokuneyy.png",   // Twitch
  "Twitch 7qme@ME": "Twitch7qme.png",   // Twitch
  "1х PsFN@ME": "1PsFN.png",   // Twitch
  "A7 melam3d@ME": "A7melam3d.png",   // Twitch
  "grizzy fv@ME": "grizzyfv.png",   // Twitch
  "CS TryHard@ME": "CSTryHard.png",   // Twitch
  "22 Batmanqueasy@ME": "22Batmanqueasy.png",   // Twitch
  "TW byarnau99FN@ME": "TWbyarnau99FN.png",   // Twitch
  "SSF SPEEDY@ME": "SSFSPEEDY.png",   // Twitch
  "23 Sceptic@ME": "23Sceptic.png",   // Twitch
  "779 Joseph@ME": "779Joseph.png",   // Twitch
  "Tslar 305@ME": "Tslar305.png",   // Twitch
  "Twitch DeaJayy@OCE": "TwitchDeaJayy.png",   // Twitch
  "fl tofpita@OCE": "fltofpita.png",   // Twitch
  "twitch kaiuuuu_@OCE": "twitchkaiuuuu_.png",   // Twitch
  "flіxbuca@OCE": "flxbuca.png",   // Twitch
  "Twitch FadezzAU@OCE": "TwitchFadezzAU.png",   // Twitch
  "fusion kun@OCE": "fusionkun.png",   // Twitch
  "Twitch adsfishy@OCE": "Twitchadsfishy.png",   // Twitch
  "chewy ebok@OCE": "chewyebok.png",   // Twitch
  "joshjerssǃ@OCE": "joshjerss.png",   // Twitch
  "Ch6 S1 1tsMango@OCE": "Ch6S11tsMango.png",   // Twitch
  "fv saint@OCE": "fvsaint.png",   // Twitch
  "twitch flavuhfnt@OCE": "twitchflavuhfnt.png",   // Twitch
  "TTV IMFULLMONTY@OCE": "TTVIMFULLMONTY.png",   // Twitch
  "Twitch Faint7x@OCE": "TwitchFaint7x.png",   // Twitch
  "become peterbot@OCE": "becomepeterbot.png",   // Twitch
  "madz1nnǃ@EU": "madz1nn.png",   // Twitch
  "bexs1306ǃ@EU": "bexs1306.png",   // Twitch
  "CrxckEu-_-@EU": "CrxckEu-_-.png",   // Twitch
  "Twitch s2pcolin@EU": "Twitchs2pcolin.png",   // Twitch
  "rxnnysznǃ@EU": "rxnnyszn.png",   // Twitch
  "Dictator Vaiiint@EU": "DictatorVaiiint.png",   // Twitch
  "1sha.@EU": "1sha..png",   // Twitch
  "tiktok hazardsfv@NAC": "tiktokhazardsfv.png",   // Twitch
  "AVTR ExhaleKAR@NAC": "AVTRExhaleKAR.png",   // Twitch
  "Twitch Dommfn_@NAC": "TwitchDommfn_.png",   // Twitch
  "twitch itsatheir@NAC": "twitchitsatheir.png",   // Twitch
  "bowlcut tyler@NAC": "bowlcuttyler.png",   // Twitch
  "gloomfv.@NAC": "gloomfv..png",   // Twitch
  "Twitch Mussfv@NAC": "TwitchMussfv.png",   // Twitch
  "pluzzyfvǃ@NAC": "pluzzyfv.png",   // Twitch
  "twitch 1xcomett@NAC": "twitch1xcomett.png",   // Twitch
  "twitter jacevvz@NAC": "twitterjacevvz.png",   // Twitch
  "twitch ajcheez@NAC": "twitchajcheez.png",   // Twitch
  "tiktok carbotfv1@NAC": "tiktokcarbotfv1.png",   // Twitch
  "Temppǃ@NAC": "Tempp.png",   // Twitch
  "Twitch RealJxe@NAC": "TwitchRealJxe.png",   // Twitch
  "Kju 7@NAC": "Kju7.png",   // Twitch
  "Twitch Dimzyfv@NAC": "TwitchDimzyfv.png",   // Twitch
  "omarsit0o.@NAW": "omarsit0o..png",   // Twitch
  "Typical Gamer@NAW": "TypicalGamer.png",   // Twitch
  "twitch agentkpvi@NAW": "twitchagentkpvi.png",   // Twitch
  "TWITCH FXSION1X@NAW": "TWITCHFXSION1X.png",   // Twitch
  "twitch uxsif@NAW": "twitchuxsif.png",   // Twitch
  "RS chucky@NAW": "RSchucky.png",   // Twitch
  "ftc slidcr@NAW": "ftcslidcr.png",   // Twitch
  "TT Zaybecrazyy@NAW": "TTZaybecrazyy.png",   // Twitch
  "WavyBeCrazy.@NAW": "WavyBeCrazy..png",   // Twitch
  "yukofvǃ@NAW": "yukofv.png",   // Twitch
  "Ohh Hope@NAW": "OhhHope.png",   // Twitch
  "kinxg1x-@BR": "kinxg1x-.png",   // Twitch
  "poperulin jakzy@BR": "poperulinjakzy.png",   // Twitch
  "punkstar cryzz@BR": "punkstarcryzz.png",   // Twitch
  "izecvǃ@BR": "izecv.png",   // Twitch
  "diegafaǃ@BR": "diegafa.png",   // Twitch
  "code batman9br@BR": "codebatman9br.png",   // Twitch
  "Fnajenǃ@ASIA": "Fnajen.png",   // Twitch
  "BoF MariusCOW@ASIA": "BoFMariusCOW.png",   // Twitch
  "KERNEL MentoS1K7@ASIA": "KERNELMentoS1K7.png",   // Twitch
  "44 PsFN@ME": "44PsFN.png",   // Twitch
  "twitch snezzyfn_@ME": "twitchsnezzyfn_.png",   // Twitch
  "TX SINA@ME": "TXSINA.png",   // Twitch
  "Blz sephrfv@ME": "Blzsephrfv.png",   // Twitch
  "hxnt7rǃ@ME": "hxnt7r.png",   // Twitch
  "Dirxネ@ME": "Dirx.png",   // Twitch
  "Twitch 666k2b@ME": "Twitch666k2b.png",   // Twitch
  "24 Rko@ME": "24Rko.png",   // Twitch
  "33 NUV3SIT4@ME": "33NUV3SIT4.png",   // Twitch
  "eggman 5678@OCE": "eggman5678.png",   // Twitch
  "ZO xbxstr@OCE": "ZOxbxstr.png",   // Twitch
  "kade nzr@OCE": "kadenzr.png",   // Twitch
  "Twitch Jovifv@OCE": "TwitchJovifv.png",   // Twitch
  "oce t3eny@OCE": "ocet3eny.png",   // Twitch
  "ThorLoverTylerǃ@OCE": "ThorLoverTyler.png",   // Twitch
  "Twitch rmxnau@OCE": "Twitchrmxnau.png",   // Twitch
  "Twitch XerbiuZ@OCE": "TwitchXerbiuZ.png",   // Twitch
  "Boardzz1x-@OCE": "Boardzz1x-.png",   // Twitch
  "TTV TwerkyClerk@OCE": "TTVTwerkyClerk.png",   // Twitch
  "twitch plumpfnt@OCE": "twitchplumpfnt.png",   // Twitch
  "Ryflexz.@OCE": "Ryflexz..png",   // Twitch
  "keanugheeǃ@OCE": "keanughee.png",   // Twitch
  "tiktok crypxnz@OCE": "tiktokcrypxnz.png",   // Twitch
  "twitch odilonfn@EU": "twitchodilonfn.png",   // Twitch
  "twitch ratasfn@EU": "twitchratasfn.png",   // Twitch
  "Twitch Gaadav@EU": "TwitchGaadav.png",   // Twitch
  "Poyo Speedsaw@EU": "PoyoSpeedsaw.png",   // Twitch
  "f3kserǃ@EU": "f3kser.png",   // Twitch
  "ttv hyperzz@NAC": "ttvhyperzz.png",   // Twitch
  "Nerve Focake@NAC": "NerveFocake.png",   // Twitch
  "iwnlǃ@NAC": "iwnl.png",   // Twitch
  "Exot1c 7@NAC": "Exot1c7.png",   // Twitch
  "twitch regretsfn@NAC": "twitchregretsfn.png",   // Twitch
  "yt cinimodfn@NAC": "ytcinimodfn.png",   // Twitch
  "twitch sebifn6@NAC": "twitchsebifn6.png",   // Twitch
  "youtube owen1x_@NAC": "youtubeowen1x_.png",   // Twitch
  "twtr funguswyd_@NAC": "twtrfunguswyd_.png",   // Twitch
  "ttv cyclonefnx@NAC": "ttvcyclonefnx.png",   // Twitch
  "Sebinsqui.@NAC": "Sebinsqui..png",   // Twitch
  "twitch fnbluish@NAC": "twitchfnbluish.png",   // Twitch
  "twtr hpzxtv@NAC": "twtrhpzxtv.png",   // Twitch
  "Twitch UKOiQ@NAC": "TwitchUKOiQ.png",   // Twitch
  "Jixcs.@NAC": "Jixcs..png",   // Twitch
  "BIG MF ISO@NAC": "BIGMFISO.png",   // Twitch
  "TTV ZA1Nxr@NAC": "TTVZA1Nxr.png",   // Twitch
  "tiktok verrnexx@NAW": "tiktokverrnexx.png",   // Twitch
  "Twitch Ex0tic1x@NAW": "TwitchEx0tic1x.png",   // Twitch
  "Twitch bash350_@NAW": "Twitchbash350_.png",   // Twitch
  "TIKTOK VEXSEIXY@NAW": "TIKTOKVEXSEIXY.png",   // Twitch
  "Twitch Rochanzin@BR": "TwitchRochanzin.png",   // Twitch
  "k2g chronicbtw1@BR": "k2gchronicbtw1.png",   // Twitch
  "greed stellsn@BR": "greedstellsn.png",   // Twitch
  "richkid usd@BR": "richkidusd.png",   // Twitch
  "vaz mcc 33@BR": "vazmcc33.png",   // Twitch
  "CH.yama 姫 IGNITE@ASIA": "CH.yamaIGNITE.png",   // Twitch
  "viei.@ME": "viei..png",   // Twitch
  "talos Haplatypus@ME": "talosHaplatypus.png",   // Twitch
  "aresgz iwnl@OCE": "aresgziwnl.png",   // Twitch
  // ==== Portraits by strongest card (tools/splice-player-photos.js) ====
  /* Игроки с рейтингом от 80 без портрета: Liquipedia (инфобокс, CC-BY-SA 3.0), где там
     заглушка — аватар Twitch с приметой Fortnite. Ключ — регион сильнейшей карточки ника. */
  "Benjyfishy@EU": "Benjyfishy.jpg",   // Liquipedia
  "Skram@EU": "Skram.png",   // Liquipedia
  "xsweeze@EU": "Xsweeze.jpg",   // Liquipedia
  "Mero@NAC": "Mero.png",   // Liquipedia
  "Chap@NAC": "Chap.png",   // Liquipedia
  "psalm@NAC": "psalm.jpg",   // Liquipedia
  "Bucke@NAC": "Bucke.jpg",   // Liquipedia
  "MackWood@NAC": "Mackwood.png",   // Liquipedia
  "Cented@NAC": "Cented.jpg",   // Liquipedia
  "Dubs@NAC": "Dubs.jpg",   // Liquipedia
  "Megga@NAC": "Megga.jpg",   // Liquipedia
  "CizLucky@NAC": "CizLucky.jpg",   // Liquipedia
  "Nikof@EU": "Nikof.jpg",   // Liquipedia
  "Skite@EU": "Skite.jpg",   // Liquipedia
  "Xccept@NAC": "Xccept.jpg",   // Liquipedia
  "Parz@NAC": "Parz.jpg",   // Liquipedia
  "pgod@NAC": "pgod.png",   // Liquipedia
  "paper@NAC": "Paper.jpg",   // Liquipedia
  "Okis@NAC": "Okis.jpg",   // Liquipedia
  "Bacca@NAC": "Bacca.jpg",   // Liquipedia
  "Aspect@NAC": "Aspect.png",   // Liquipedia
  "benjyfishy@EU": "Benjyfishy.jpg",   // Liquipedia
  "BadSniper@EU": "BadSniper.jpg",   // Liquipedia
  "verT@NAW": "verT.jpg",   // Liquipedia
  "PeterBot@NAC": "Peterbot.jpg",   // Liquipedia
  "Paper@NAC": "Paper.jpg",   // Liquipedia
  "shxrk@EU": "Shxrk.jpg",   // Liquipedia
  "itemm@EU": "itemm.png",   // Liquipedia
  "blakeps@NAC": "blakeps.jpg",   // Liquipedia
  "nebs@EU": "Nebs.jpg",   // Liquipedia
  "Bully@NAC": "Bully.jpg",   // Liquipedia
  "Edgey@NAW": "Edgey.jpg",   // Liquipedia
  "k1nG@BR": "K1nG.jpg",   // Liquipedia
  "fazer@BR": "Fazer.jpg",   // Liquipedia
  "Ceice@NAW": "Ceice.jpg",   // Liquipedia
  "Kurtz@BR": "Kurtz.jpg",   // Liquipedia
  "RichHomieQuinn@NAW": "RichHomieQuinn.jpg",   // Liquipedia
  "Mojak@BR": "Mojak.jpg",   // Liquipedia
  "LeTsHe@EU": "LeTsHe.jpg",   // Liquipedia
  "Tkay@NAC": "Tkay.jpg",   // Liquipedia
  "Seeyun@BR": "Seeyun.jpg",   // Liquipedia
  "Batman Bugha@NAW": "BatmanBugha.jpg",   // Liquipedia
  "WeY@BR": "WeY.jpg",   // Liquipedia
  "Kinstaar@EU": "Kinstaar.jpg",   // Liquipedia
     // Liquipedia
  "Medusa@ASIA": "Medusa.jpg",   // Liquipedia
  "Blakeps@NAC": "blakeps.jpg",   // Liquipedia
  "Pxmp@NAC": "PXMP.jpg",   // Liquipedia
  "Cheatiin@EU": "Cheatiin.jpg",   // Liquipedia
  "Mikson@NAC": "Mikson.jpg",   // Liquipedia
  "Vivid@NAC": "Vivid.jpg",   // Liquipedia
  "kurtz@BR": "Kurtz.jpg",   // Liquipedia
  "grx@BR": "Grx.jpg",   // Liquipedia
     // Liquipedia
  "Ninja@NAC": "Ninja.jpg",   // Liquipedia
  "pinq@EU": "Pinq.jpg",   // Liquipedia
  "Trashy@NAW": "Trashy.jpg",   // Liquipedia
  "VerT@NAC": "verT.jpg",   // Liquipedia
  "Merem@ASIA": "merem.jpg",   // Liquipedia
  "BOBY@ASIA": "BOBY.jpg",   // Liquipedia
  "GntL@ME": "GntL.jpg",   // Liquipedia
  "Npen@NAC": "npen.jpg",   // Liquipedia
     // Liquipedia
  "Alex@NAW": "alex.jpg",   // Liquipedia
  "Issa@EU": "Issa.png",   // Liquipedia
  "Oslo@EU": "Oslo.jpg",   // Liquipedia
  "Worthy@OCE": "worthy.jpg",   // Liquipedia
  "SaLva@ME": "SaLva.jpg",   // Liquipedia
  "m0untain@OCE": "M0untain.jpg",   // Liquipedia
  "Kimkana@ASIA": "Kimkana.jpg",   // Liquipedia
  "Bulldogz@OCE": "Bulldogz.jpg",   // Liquipedia
  "looter@OCE": "Looter.jpg",   // Liquipedia
  "Gntl@ME": "GntL.jpg",   // Liquipedia
  "sxhool@NAW": "Sxhool.jpg",   // Liquipedia
  "vazen@OCE": "vazen.jpg",   // Liquipedia
  "Rainy@OCE": "Rainy.jpg",   // Liquipedia
  "BlackoutZ@BR": "blackoutz.jpg",   // Liquipedia
  "Fray@EU": "Fray.jpg",   // Liquipedia
  "BlastR@EU": "BlastR.jpg",   // Liquipedia
  "Scarebear@NAC": "Scarebear.jpg",   // Liquipedia
  "Animal@NAC": "Animal.png",   // Liquipedia
  "Hunter@EU": "Hunter.png",   // Liquipedia
  "NinGDO@ASIA": "NinGDO.png",   // Liquipedia
  "bugha@NAC": "BUGHA.jpg",   // Liquipedia
  "Kpzet@EU": "Kpzet.jpg",   // Liquipedia
  "kylie@EU": "Kylie.jpg",   // Liquipedia
  "Sxhool@NAC": "Sxhool.jpg",   // Liquipedia
  "Xpon@NAC": "Xpon.jpg",   // Liquipedia
  "Nounzy@NAC": "Nounzy.jpg",   // Liquipedia
  "Mongraal@NAC": "Mongraal.jpg",   // Liquipedia
  "Kylie@NAC": "Kylie.jpg",   // Liquipedia
  "Pinq@NAC": "Pinq.jpg",   // Liquipedia
  "50@OCE": "50.png",   // Twitch
  "teeq@EU": "teeq.png",   // Twitch
  "Decyptos@EU": "Decyptos.png",   // Twitch
  "Chapix@EU": "Chapix.png",   // Twitch
  "RedRush@EU": "RedRush.png",   // Twitch
  "nayte@EU": "nayte.png",   // Twitch
  "Mitr0@EU": "Mitr0.png",   // Twitch
  "Avery@NAC": "Avery.png",   // Twitch
  "Commandment@NAC": "Commandment.png",   // Twitch
  "crue@EU": "crue.png",   // Twitch
  "Zayt@NAC": "Zayt.png",   // Twitch
  "Reverse2k@NAC": "Reverse2k.png",   // Twitch
  "Coop@NAC": "Coop.png",   // Twitch
  "nyhrox@EU": "nyhrox.png",   // Twitch
  "Slackes@NAC": "Slackes.png",   // Twitch
  "Elevate@NAC": "Elevate.png",   // Twitch
  "Jahq@NAC": "Jahq.png",   // Twitch
  "Endretta@EU": "Endretta.png",   // Twitch
  "Flikk@EU": "Flikk.png",   // Twitch
  "FlowiS@EU": "FlowiS.png",   // Twitch
  "Wolfiez@EU": "Wolfiez.png",   // Twitch
  "wolfiez@EU": "Wolfiez.png",   // Twitch
  "RogueShark@NAC": "RogueShark.png",   // Twitch
  "Tragix@NAC": "Tragix.png",   // Twitch
  "Jamper@NAC": "Jamper.png",   // Twitch
  "Knight@NAC": "Knight.png",   // Twitch
  "Spayde@NAC": "Spayde.png",   // Twitch
  "nanolite@NAC": "nanolite.png",   // Twitch
  "Resypical@NAC": "Resypical.png",   // Twitch
  "Raifla@EU": "Raifla.png",   // Twitch
  "Verox@EU": "Verox.png",   // Twitch
  "Kubx@EU": "Kubx.png",   // Twitch
  "MOTOR@EU": "MOTOR.png",   // Twitch
  "Tchub@EU": "Tchub.png",   // Twitch
  "Bizzle@NAC": "Bizzle.png",   // Twitch
  "Kreo@NAC": "Kreo.png",   // Twitch
  "Eclipsae@NAC": "Eclipsae.png",   // Twitch
  "TabzG@NAC": "TabzG.png",   // Twitch
  "Stretch@NAC": "Stretch.png",   // Twitch
  "Whofishy@NAC": "Whofishy.png",   // Twitch
  "Umplify@EU": "Umplify.png",   // Twitch
  "Crue@EU": "crue.png",   // Twitch
  "Tohaj@EU": "Tohaj.png",   // Twitch
  "letw1k3@EU": "letw1k3.png",   // Twitch
  "Kaxie@EU": "Kaxie.png",   // Twitch
  "Rijas77@EU": "Rijas77.png",   // Twitch
  "HazThaGreat@NAC": "HazThaGreat.png",   // Twitch
  "stompy@EU": "stompy.png",   // Twitch
  "AstroSMZ@EU": "AstroSMZ.png",   // Twitch
  "k1nzell@EU": "k1nzell.png",   // Twitch
  "Domentos@EU": "Domentos.png",   // Twitch
  "Arkhram@NAW": "Arkhram.png",   // Twitch
  "IboooHai@EU": "IboooHai.png",   // Twitch
  "Jayrosez@NAW": "Jayrosez.png",   // Twitch
  "rehx@NAW": "Rehx.png",   // Twitch
  "baackup@NAW": "baackup.png",   // Twitch
  "Snacky@NAW": "Snacky.png",   // Twitch
  "Milan@EU": "Milan.png",   // Twitch
  "Trippernn@EU": "trippernn.png",   // Twitch
  "Turtle@EU": "Turtle.png",   // Twitch
  "4DRStorm@NAW": "4DRStorm.png",   // Twitch
  "Posick@NAC": "Posick.png",   // Twitch
  "ZexRow@NAC": "ZexRow.png",   // Twitch
  "Vinny1x@NAC": "Vinny1x.png",   // Twitch
  "wavyjacob@NAW": "wavyjacob.png",   // Twitch
  "Ditrxx@EU": "Ditrxx.png",   // Twitch
  "Wizz@NAW": "Wizz.png",   // Twitch
  "Caleb@NAW": "Caleb.png",   // Twitch
  "Wheels@NAW": "Wheels.png",   // Twitch
  "Brunao@BR": "Brunao.png",   // Twitch
  "Cyperzz@NAW": "Cyperzz.png",   // Twitch
  "Jur3ky@EU": "Jur3ky.png",   // Twitch
  "Packo@EU": "Packo.png",   // Twitch
  "Stenno@EU": "Stenno.png",   // Twitch
  "K1nzell@EU": "k1nzell.png",   // Twitch
  "chapix@EU": "Chapix.png",   // Twitch
  "DragonRG@NAW": "DragonRG.png",   // Twitch
     // Twitch
  "Zeus@NAW": "Zeus.png",   // Twitch
  "clarityG@NAC": "clarityG.png",   // Twitch
  "casqer@NAC": "casqer.png",   // Twitch
  "Nicks@BR": "Nicks.png",   // Twitch
  "Zyfa@NAC": "Zyfa.png",   // Twitch
  "Pxlarized@NAC": "Pxlarized.png",   // Twitch
  "Keys@NAC": "Keys.png",   // Twitch
  "Crimz@NAC": "Crimz.png",   // Twitch
  "Punisher@NAW": "Punisher.png",   // Twitch
  "Alliege@NAW": "Alliege.png",   // Twitch
  "nosh@NAC": "nosh.png",   // Twitch
  "jayrosez@NAW": "Jayrosez.png",   // Twitch
  "TrapKilled@NAW": "TrapKilled.png",   // Twitch
  "Nosh@NAC": "nosh.png",   // Twitch
  "Chicken@NAW": "Chicken.png",   // Twitch
  "Bluzro@NAW": "bluzro.png",   // Twitch
  "Nico@NAW": "Nico.png",   // Twitch
  "Skqttles@NAC": "skqttles.png",   // Twitch
  "Gold@NAC": "Gold.png",   // Twitch
  "Yumi@NAC": "Yumi.png",   // Twitch
  "Michael@ASIA": "Michael.png",   // Twitch
  "AirkNn@EU": "AirkNn.png",   // Twitch
  "Shmeky@EU": "Shmeky.png",   // Twitch
  "Cyrzr@NAW": "Cyrzr.png",   // Twitch
     // Twitch
  "Tfue@NAC": "Tfue.png",   // Twitch
  "jammyz@NAW": "jammyz.png",   // Twitch
  "technoviking46@BR": "technoviking46.png",   // Twitch
  "torifyx@ASIA": "torifyx.png",   // Twitch
  "TAKAMURA@ASIA": "TAKAMURA.png",   // Twitch
  "Noward@EU": "Noward.png",   // Twitch
  "znappy@EU": "znappy.png",   // Twitch
  "spideyy@NAW": "spideyy.png",   // Twitch
  "Ming@ASIA": "Ming.png",   // Twitch
  "Caspersa@EU": "Caspersa.png",   // Twitch
  "Zhiny@EU": "Zhiny.png",   // Twitch
  "Kn1pher@NAC": "Kn1pher.png",   // Twitch
  "Symfuhny@NAC": "Symfuhny.png",   // Twitch
  "steelix@EU": "steelix.png",   // Twitch
  "Strobe@NAC": "Strobe.png",   // Twitch
  "Cozz@NAW": "Cozz.png",   // Twitch
  "spitflow@BR": "spitflow.png",   // Twitch
  "XMipoli@ASIA": "xMipoli.png",   // Twitch
  "WAVE@NAW": "WAVE.png",   // Twitch
  "symetrical@NAW": "symetrical.png",   // Twitch
  "Shamokiy@ASIA": "Shamokiy.png",   // Twitch
  "Poffiee@NAW": "Poffiee.png",   // Twitch
  "Mxrcio@BR": "Mxrcio.png",   // Twitch
  "Shur4@EU": "Shur4.png",   // Twitch
  "Zara@EU": "Zara.png",   // Twitch
  "Grolzz@EU": "Grolzz.png",   // Twitch
  "Skydeun@EU": "Skydeun.png",   // Twitch
  "1lushaFN@EU": "1lushaFN.png",   // Twitch
  "GMoney@NAC": "GMoney.png",   // Twitch
  "FunkBomb@NAC": "FunkBomb.png",   // Twitch
  "Swillium@ASIA": "Swillium.png",   // Twitch
  "Jozya@ASIA": "Jozya.png",   // Twitch
  "MinZho@EU": "MinZho.png",   // Twitch
  "JulianCoM@EU": "JulianCoM.png",   // Twitch
  "Dexefite@ME": "Dexefite.png",   // Twitch
  "ABUFAL7@ME": "ABUFAL7.png",   // Twitch
  "Modisk@ME": "Modisk.png",   // Twitch
  "snacky@NAW": "Snacky.png",   // Twitch
  "Trix@NAW": "Trix.png",   // Twitch
  "Sheco@BR": "Sheco.png",   // Twitch
  "souriano@ME": "souriano.png",   // Twitch
  "Xx731@ME": "Xx731.png",   // Twitch
  "Speedy@ME": "speedy.png",   // Twitch
  "airknn@EU": "AirkNn.png",   // Twitch
  "Pastzk@BR": "Pastzk.png",   // Twitch
  "Flare@EU": "Flare.png",   // Twitch
  "Zroqz@EU": "Zroqz.png",   // Twitch
  "ClarityG@NAC": "clarityG.png",   // Twitch
  "THORIK@NAC": "THORIK.png",   // Twitch
  "Leyyner@ASIA": "Leyyner.png",   // Twitch
  "pkr29@EU": "pkr29.png",   // Twitch
  "Joseeh@EU": "Joseeh.png",   // Twitch
  "SnozQ@ME": "SnozQ.png",   // Twitch
  "Silent@ME": "Silent.png",   // Twitch
  "Dexteriity@NAW": "Dexteriity.png",   // Twitch
  "Pina@ASIA": "Pina.png",   // Twitch
  "GallaxyPK@ASIA": "GallaxyPK.png",   // Twitch
  "Souriano@ME": "souriano.png",   // Twitch
  "Snowvaks@ME": "Snowvaks.png",   // Twitch
  "Iciev@NAC": "Iciev.png",   // Twitch
  "DRaFTell@ME": "DRaFTell.png",   // Twitch
  "Alithy@NAW": "AliTHY.png",   // Twitch
  "Slick@NAC": "Slick.png",   // Twitch
  "alithy@NAW": "AliTHY.png",   // Twitch
  "tackyfv@ME": "tackyfv.png",   // Twitch
  "alexcod556@EU": "alexcod556.png",   // Twitch
  "Flecken@EU": "Flecken.png",   // Twitch
  "kejseR@EU": "kejseR.png",   // Twitch
  "Scriwy@EU": "Scriwy.png",   // Twitch
  "Jelty@NAC": "Jelty.png",   // Twitch
  "Jynx@OCE": "Jynx.png",   // Twitch
  "RepulseGod@OCE": "RepulseGod.png",   // Twitch
  "Xsterioz@EU": "Xsterioz.png",   // Twitch
  "xmeltze@NAW": "xmeltze.png",   // Twitch
  "serpennt@OCE": "serpennt.png",   // Twitch
  "Hype@OCE": "Hype.png",   // Twitch
  "scrupools@NAW": "scrupools.png",   // Twitch
  "Njby@ME": "Njby.png",   // Twitch
  "meCyx@ME": "meCyx.png",   // Twitch
  "Bathan@OCE": "Bathan.png",   // Twitch
  "sync@OCE": "Sync.png",   // Twitch
  "smqcked@NAC": "smqcked.png",   // Twitch
  "Nutex@NAC": "Nutex.png",   // Twitch
  "Devious@NAW": "Devious.png",   // Twitch
  "Felipersa@BR": "Felipersa.png",   // Twitch
  "xJam@ME": "xJam.png",   // Twitch
  "xalkerr@OCE": "xalkerr.png",   // Twitch
  "susscript@NAC": "susscript.png",   // Twitch
  "heifiu@ME": "heifiu.png",   // Twitch
  "7tor@EU": "7tor.png",   // Twitch
  "Siberiajkee@EU": "Siberiajkee.png",   // Twitch
  "iRezUmi@EU": "iRezUmi.png",   // Twitch
  "Karma@EU": "Karma.png",   // Twitch
  "Dream@BR": "Dream.png",   // Twitch
  "Stella@ASIA": "Stella.png",   // Twitch
  "DiegoGB@EU": "DiegoGB.png",   // Twitch
  "Fuzzy301@NAC": "Fuzzy301.png",   // Twitch
  "Twayko@BR": "Twayko.png",   // Twitch
  "slaya@OCE": "Slaya.png",   // Twitch
  "Link@OCE": "Link.png",   // Twitch
  "h4count@EU": "h4count.png",   // Twitch
  "Kylix@EU": "Kylix.png",   // Twitch
  "Rampage@ME": "Rampage.png",   // Twitch
  "Ranger@ME": "Ranger.png",   // Twitch
  "Gooboz@OCE": "Gooboz.png",   // Twitch
  "Caryion@OCE": "Caryion.png",   // Twitch
  "Tobi@ME": "Tobi.png",   // Twitch
  "Grazca@NAC": "Grazca.png",   // Twitch
  "LDamienS@NAC": "LDamienS.png",   // Twitch
  "Darkz@ME": "Darkz.png",   // Twitch
  "Phazma@ASIA": "Phazma.png",   // Twitch
  "Mage@ME": "Mage.png",   // Twitch
  "Tuii@OCE": "Tuii.png",   // Twitch
  "Skvts@OCE": "Skvts.png",   // Twitch
  "Snake@NAC": "Snake.png",   // Twitch
  "AbuFal7@ME": "ABUFAL7.png",   // Twitch
  "manocaki@BR": "manocaki.png",   // Twitch
  "Susscript@NAC": "susscript.png",   // Twitch
  "Trey@NAW": "Trey.png",   // Twitch
  "Hazard@NAC": "Hazard.png",   // Twitch
  "Diablo@EU": "Diablo.png",   // Twitch
  "ardit@EU": "ardit.png",   // Twitch
  "Wanlast@EU": "Wanlast.png",   // Twitch
  "Klinberi@EU": "Klinberi.png",   // Twitch
  "thaitanks@NAW": "thaitanks.png",   // Twitch
  "Shaedess@NAC": "Shaedess.png",   // Twitch
  "parpy@OCE": "parpy.png",   // Twitch
  "Twizz@OCE": "Twizz.png",   // Twitch
  "Zeeyadx@ME": "Zeeyadx.png",   // Twitch
  "Raed@ME": "Raed.png",   // Twitch
  "Jax@OCE": "Jax.png",   // Twitch
  "radius@OCE": "radius.png",   // Twitch
  "Shinorj@BR": "Shinorj.png",   // Twitch
  "Habiebsh@ME": "Habiebsh.png",   // Twitch
  "Thomuss@NAW": "Thomuss.png",   // Twitch
  "Domo@NAW": "Domo.png",   // Twitch
  "mystick@BR": "mystick.png",   // Twitch
  "caryion@OCE": "Caryion.png",   // Twitch
  "Jaspaay@EU": "Jaspaay.png",   // Twitch
  "MooseGGs@NAW": "MooseGGs.png",   // Twitch
  "Dxcaying@NAW": "Dxcaying.png",   // Twitch
  "Casqer@NAC": "casqer.png",   // Twitch
  "Sp1aash@EU": "Sp1aash.png",   // Twitch
  "packo@EU": "Packo.png",   // Twitch
  "WaiZ@EU": "Waiz.png",   // Twitch
  "flex@EU": "flex.png",   // Twitch
  "zytlee@BR": "zytlee.png",   // Twitch
  "NicFN@NAC": "NicFN.png",   // Twitch
  "tekashi@OCE": "tekashi.png",   // Twitch
  "crrimson@OCE": "crrimson.png",   // Twitch
  "Javery@OCE": "Javery.png",   // Twitch
  "Swaggi@EU": "Swaggi.png",   // Twitch
  "Ferrrnando@NAC": "Ferrrnando.png",   // Twitch
  "BankTeller@NAC": "BankTeller.png",   // Twitch
  "Marzz_OW@NAC": "Marzz_OW.png",   // Twitch
  "Playify@NAC": "Playify.png",   // Twitch
  "Kyzui@NAW": "Kyzui.png",   // Twitch
  "grovr@NAW": "grovr.png",   // Twitch
  "MisterX@EU": "MisterX.png",   // Twitch
  "Styrsix@EU": "Styrsix.png",   // Twitch
  "Milad@EU": "Milad.png",   // Twitch
  "Sol7T2@OCE": "Sol7T2.png",   // Twitch
  "ImCluTcHz@NAW": "ImCluTcHz.png",   // Twitch
  "Maihaze@OCE": "Maihaze.png",   // Twitch
  "Paulin@BR": "Paulin.png",   // Twitch
  "STAQI@NAC": "STAQI.png",   // Twitch
  "Ryaic@NAW": "ryaic.png",   // Twitch
  "Ghaple@EU": "Ghaple.png",   // Twitch
  "Tonyreyli@NAC": "Tonyreyli.png",   // Twitch
  "Prisi0n3r0@EU": "Prisi0n3r0.png",   // Twitch
  "Nyhrox@EU": "nyhrox.png",   // Twitch
  "Reeloads@NAC": "Reeloads.png",   // Twitch
  "slays@NAW": "slays.png",   // Twitch
  "Squeakz@OCE": "Squeakz.png",   // Twitch
  "Ardit@EU": "ardit.png",   // Twitch
  "ivide@NAW": "ivide.png",   // Twitch
  "Sami@ME": "Sami.png",   // Twitch
  "snowvaks@ME": "Snowvaks.png",   // Twitch
  "Synaf@OCE": "Synaf.png",   // Twitch
  "Phrazn@NAW": "Phrazn.png",   // Twitch
  "BeckTHD@NAW": "BeckTHD.png",   // Twitch
  "Saad@ME": "Saad.png",   // Twitch
  "zadiafn@OCE": "zadiafn.png",   // Twitch
  "Gangifishy@BR": "Gangifishy.png",   // Twitch
  "Polo@NAC": "Polo.png",   // Twitch
  "Maku@EU": "Maku.png",   // Twitch
  "yexfnbr@NAC": "yexfnbr.png",   // Twitch
  "doggofv@NAC": "doggofv.png",   // Twitch
  "Glace@NAW": "Glace.png",   // Twitch
  "helgizikk@EU": "helgizikk.png",   // Twitch
  "pfzin@BR": "pfzin.png",   // Twitch
  "Tekmarr@OCE": "Tekmarr.png",   // Twitch
  "Zoommba@NAW": "Zoommba.png",   // Twitch
  "Natanyo@OCE": "Natanyo.png",   // Twitch
  "Zarby@OCE": "Zarby.png",   // Twitch
  "Trapped@OCE": "Trapped.png",   // Twitch
  "Sticks@NAC": "Sticks.png",   // Twitch
  "Nong9@ME": "Nong9.png",   // Twitch
  "saevid@EU": "saevid.png",   // Twitch
  "basil@OCE": "basil.png",   // Twitch
  "Trentman@NAC": "Trentman.png",   // Twitch
  "Tuexy@NAC": "Tuexy.png",   // Twitch
  "jaggyfn@EU": "jaggyfn.png",   // Twitch
  "cyrzr@NAW": "Cyrzr.png",   // Twitch
  "Kimchi@NAW": "Kimchi.png",   // Twitch
  "Thor@NAW": "Thor.png",   // Twitch
  "Zyro@NAC": "Zyro.png",   // Twitch
  "Yasir@NAC": "Yasir.png",   // Twitch
  "VE1RYY@EU": "Ve1ryy.png",   // Twitch
  "Zeston@EU": "Zeston.png",   // Twitch
  "Remz7k@NAW": "Remz7k.png",   // Twitch
  "Sifulwk@NAC": "Sifulwk.png",   // Twitch
  "Core@EU": "Core.png",   // Twitch
  "Clipnode@BR": "Clipnode.png",   // Twitch
  "Leno@NAW": "Leno.png",   // Twitch
  "Magl@EU": "Magl.png",   // Twitch
  "Yasenoppo@ASIA": "Yasenoppo.png",   // Twitch
  "Dataim@OCE": "Dataim.png",   // Twitch
  "Tuna@ME": "Tuna.png",   // Twitch
  "Kezzaa@OCE": "Kezzaa.png",   // Twitch
  "Mateo@NAW": "Mateo.png",   // Twitch
  "Yuki@NAW": "Yuki.png",   // Twitch
  "VichiN@BR": "VichiN.png",   // Twitch
  "Leobas@BR": "Leobas.png",   // Twitch
  "javery@OCE": "Javery.png",   // Twitch
  "ZGMT@OCE": "ZGMT.png",   // Twitch
  "Basil@OCE": "basil.png",   // Twitch
  "Griff@EU": "Griff.png",   // Twitch
  "Corseu@NAW": "Corseu.png",   // Twitch
  "Sidlah@NAW": "Sidlah.png",   // Twitch
  "Korq@OCE": "Korq.png",   // Twitch
  "Kwolit@OCE": "Kwolit.png",   // Twitch
  "Nevify@NAC": "Nevify.png",   // Twitch
  "Wigly@NAW": "Wigly.png",   // Twitch
  "opezor@ME": "opezor.png",   // Twitch
  "GMONEY@NAC": "GMoney.png",   // Twitch
  "SNOWVAKS@ME": "Snowvaks.png",   // Twitch
  "SPEEDY@ME": "speedy.png",   // Twitch
  "Saf@NAC": "Saf.png",   // Twitch
  "Boyer@EU": "Boyer.png",   // Twitch
  "Ronaldo@NAC": "Ronaldo.png",   // Twitch
  "Stompy@EU": "stompy.png",   // Twitch
  "Nayte@EU": "nayte.png",   // Twitch
  "aqua@EU": "aqua.png",   // Twitch
  "Aqua@EU": "aqua.png",   // Twitch
  "Rojo@EU": "Rojo.png",   // Twitch
  "Tschinken@EU": "Tschinken.png",   // Twitch
  "Clement@EU": "Clement.png",   // Twitch
  "Toose@EU": "Toose.png",   // Twitch
  "4zr@EU": "4zr.png",   // Twitch
  "artor@EU": "artor.png",   // Twitch
  "Floki@EU": "Floki.png",   // Twitch
  "Deyy@NAC": "Deyy.png",   // Twitch
  "Rakso@EU": "Rakso.png",   // Twitch
  "TruleX@EU": "TruleX.png",   // Twitch
  "Justice@NAC": "Justice.png",   // Twitch
  "elokratz@EU": "elokratz.png",   // Twitch
  "Userz@NAC": "Userz.png",   // Twitch
  "Fatch@NAC": "Fatch.png",   // Twitch
  "Smite@NAC": "Smite.png",   // Twitch
  "PaMstou@NAC": "PaMstou.png",   // Twitch
  "Sangild@EU": "Sangild.png",   // Twitch
  "Rise@NAC": "Rise.png",   // Twitch
  "Brycx@NAC": "Brycx.png",   // Twitch
  "Chubs@NAC": "Chubs.png",   // Twitch
  "Revised@NAC": "Revised.png",   // Twitch
  "Riversan@NAC": "Riversan.png",   // Twitch
  "Crr@EU": "Crr.png",   // Twitch
  "Matsoe@EU": "Matsoe.png",   // Twitch
  "Av@NAC": "Av.png",   // Twitch
  "Degen@NAC": "Degen.png",   // Twitch
  "Ajay@NAC": "Ajay.png",   // Twitch
  "Mexe@EU": "Mexe.png",   // Twitch
  "Fryst@NAC": "Fryst.png",   // Twitch
  "Louis@EU": "Louis.png",   // Twitch
  "Plege@NAC": "Plege.png",   // Twitch
  "Vortex@EU": "Vortex.png",   // Twitch
  "Nani@NAC": "Nani.png",   // Twitch
  "Death@NAC": "Death.png",   // Twitch
  "Klown@EU": "Klown.png",   // Twitch
  "Tahi@NAC": "Tahi.png",   // Twitch
  "Rocaine@NAC": "Rocaine.png",   // Twitch
  "Axeforce@EU": "Axeforce.png",   // Twitch
  "Robban@EU": "Robban.png",   // Twitch
  "yung calculator@NAC": "yungcalculator.png",   // Twitch
  "Krisp@NAC": "Krisp.png",   // Twitch
  "Osp@NAC": "Osp.png",   // Twitch
  "Nate@EU": "Nate.png",   // Twitch
  "DABUEL@EU": "DABUEL.png",   // Twitch
  "Vexi@EU": "Vexi.png",   // Twitch
  "Noxy@NAC": "Noxy.png",   // Twitch
  "Aoxy@NAC": "Aoxy.png",   // Twitch
  "TheVic@EU": "TheVic.png",   // Twitch
  "Assault@NAC": "Assault.png",   // Twitch
  "crr@EU": "Crr.png",   // Twitch
  "Kyzen@EU": "Kyzen.png",   // Twitch
  "Falconer@NAW": "Falconer.png",   // Twitch
  "Cazz@NAC": "Cazz.png",   // Twitch
  "favs@NAW": "favs.png",   // Twitch
  "Rhux@NAC": "Rhux.png",   // Twitch
  "Swag@EU": "Swag.png",   // Twitch
  "Glubschi@EU": "Glubschi.png",   // Twitch
  "Xoonies@NAC": "Xoonies.png",   // Twitch
  "domo@NAW": "Domo.png",   // Twitch
  "Kiox@NAC": "Kiox.png",   // Twitch
  "Kaan@EU": "Kaan.png",   // Twitch
  "jojofishy@NAC": "jojofishy.png",   // Twitch
  "phoenix@NAW": "phoenix.png",   // Twitch
  "Retro@NAW": "Retro.png",   // Twitch
  "Faded@EU": "Faded.png",   // Twitch
  "Twek@EU": "Twek.png",   // Twitch
  "Froggy@EU": "Froggy.png",   // Twitch
  "mydro@EU": "mydro.png",   // Twitch
  "Kefyy@EU": "Kefyy.png",   // Twitch
  "Pika@NAC": "Pika.png",   // Twitch
  "Persa@BR": "Persa.png",   // Twitch
  "Smqcked@NAC": "smqcked.png",   // Twitch
  "Xeat@BR": "Xeat.png",   // Twitch
  "Chris@NAW": "Chris.png",   // Twitch
  "Barroso@BR": "Barroso.png",   // Twitch
  "Vortexers@EU": "Vortexers.png",   // Twitch
  "Zookez@NAW": "Zookez.png",   // Twitch
  "edson@BR": "edson.png",   // Twitch
  "Pingu@BR": "Pingu.png",   // Twitch
  "Miro@EU": "Miro.png",   // Twitch
  "Convic@NAW": "Convic.png",   // Twitch
  "Silxzys@NAW": "Silxzys.png",   // Twitch
  "Skvii@EU": "Skvii.png",   // Twitch
  "Upl@EU": "Upl.png",   // Twitch
  "Hris@EU": "Hris.png",   // Twitch
  "Prism@EU": "Prism.png",   // Twitch
  "Cheapz@EU": "Cheapz.png",   // Twitch
  "Tidi@EU": "Tidi.png",   // Twitch
  "Dark@NAW": "Dark.png",   // Twitch
  "Rax@EU": "Rax.png",   // Twitch
  "Mack@BR": "Mack.png",   // Twitch
  "Enough@NAC": "Enough.png",   // Twitch
  "Teqqz@NAC": "Teqqz.png",   // Twitch
  "Thomuss_@NAW": "Thomuss_.png",   // Twitch
  "Kenshi@NAW": "Kenshi.png",   // Twitch
  "Frapai@NAW": "Frapai.png",   // Twitch
  "Dokko@EU": "Dokko.png",   // Twitch
  "Lasers@BR": "Lasers.png",   // Twitch
  "Dynamic@NAW": "Dynamic.png",   // Twitch
  "snap@EU": "snap.png",   // Twitch
  "Spitflow@BR": "spitflow.png",   // Twitch
  "Bacon@NAW": "Bacon.png",   // Twitch
  "defiable@NAW": "defiable.png",   // Twitch
  "Tautai@NAW": "Tautai.png",   // Twitch
  "Dog@NAW": "Dog.png",   // Twitch
  "Mikey@NAC": "Mikey.png",   // Twitch
  "little@NAW": "little.png",   // Twitch
  "xOwN@BR": "xOwN.png",   // Twitch
  "reign@NAW": "reign.png",   // Twitch
  "Snipe@EU": "Snipe.png",   // Twitch
  "Ghonzo@EU": "Ghonzo.png",   // Twitch
  "M11Z@EU": "M11Z.png",   // Twitch
  "Deadra@EU": "Deadra.png",   // Twitch
  "Filipe@BR": "Filipe.png",   // Twitch
  "Tavern@NAW": "Tavern.png",   // Twitch
  "danath@OCE": "danath.png",   // Twitch
  "K1nzеll@EU": "K1nzll.png",   // Twitch
  "dyox@EU": "dyox.png",   // Twitch
  "Slovay@EU": "Slovay.png",   // Twitch
  "Slender@EU": "Slender.png",   // Twitch
  "Lawrence@NAC": "Lawrence.png",   // Twitch
  "Gabe@NAC": "Gabe.png",   // Twitch
  "kchorro@BR": "kchorro.png",   // Twitch
  "Pattaty@BR": "Pattaty.png",   // Twitch
  "Kytrex@NAW": "Kytrex.png",   // Twitch
  "Powur@NAW": "Powur.png",   // Twitch
  "Snow@BR": "Snow.png",   // Twitch
  "Tristan Hipp@NAC": "TristanHipp.png",   // Twitch
  "Asa@EU": "Asa.png",   // Twitch
  "Tossily@NAC": "Tossily.png",   // Twitch
  "Firen@EU": "Firen.png",   // Twitch
  "Cxshy@EU": "Cxshy.png",   // Twitch
  "wakie@EU": "wakie.png",   // Twitch
  "Wavyjacob@NAW": "wavyjacob.png",   // Twitch
  "advise@EU": "advise.png",   // Twitch
  "Icy@NAW": "Icy.png",   // Twitch
  "Safik@EU": "Safik.png",   // Twitch
  "Crow VII@EU": "CrowVII.png",   // Twitch
  "Gabix@EU": "Gabix.png",   // Twitch
  "Symetrical@NAW": "symetrical.png",   // Twitch
  "Huty@EU": "Huty.png",   // Twitch
  "Kikoo@EU": "Kikoo.png",   // Twitch
  "Nigel@NAW": "Nigel.png",   // Twitch
  "Skits@OCE": "Skits.png",   // Twitch
  "persa@BR": "Persa.png",   // Twitch
  "Eclipse@EU": "Eclipse.png",   // Twitch
  "Chukky@NAC": "Chukky.png",   // Twitch
  "Jagveer@NAW": "Jagveer.png",   // Twitch
  "p1ng@ASIA": "p1ng.png",   // Twitch
  "technoviking@BR": "technoviking.png",   // Twitch
  "Kaboo@NAW": "Kaboo.png",   // Twitch
  "Hov@NAW": "Hov.png",   // Twitch
  "Bumboy@NAW": "Bumboy.png",   // Twitch
  "SpiroK@NAC": "SpiroK.png",   // Twitch
  "mannii14@NAW": "mannii14.png",   // Twitch
  "Julle@EU": "Julle.png",   // Twitch
  "Adity@NAW": "Adity.png",   // Twitch
  "Trooly@EU": "Trooly.png",   // Twitch
  "Maufin@ASIA": "Maufin.png",   // Twitch
  "Zno@NAW": "Zno.png",   // Twitch
  "xeat@BR": "Xeat.png",   // Twitch
  "Vanillaz@NAW": "Vanillaz.png",   // Twitch
  "gxT@BR": "gxT.png",   // Twitch
  "Mason@NAC": "Mason.png",   // Twitch
  "Stain@ASIA": "Stain.png",   // Twitch
  "Takii@NAC": "Takii.png",   // Twitch
  "Dolzeur@NAC": "Dolzeur.png",   // Twitch
  "pardal@BR": "pardal.png",   // Twitch
  "Dash@NAC": "Dash.png",   // Twitch
  "SHRSHF@ME": "SHRSHF.png",   // Twitch
  "Eshouu@NAC": "Eshouu.png",   // Twitch
  "Zarbeh@EU": "Zarbeh.png",   // Twitch
  "Hawk@NAC": "Hawk.png",   // Twitch
  "Veer@NAC": "Veer.png",   // Twitch
  "Fatla@ME": "Fatla.png",   // Twitch
  "Mofu@ASIA": "Mofu.png",   // Twitch
  "Timko@NAW": "Timko.png",   // Twitch
  "bobo@EU": "bobo.png",   // Twitch
  "toff@NAW": "toff.png",   // Twitch
  "Peterpan@ASIA": "Peterpan.png",   // Twitch
  "tahi@NAC": "Tahi.png",   // Twitch
  "H4wwk@BR": "H4wwk.png",   // Twitch
  "Nexy@NAC": "Nexy.png",   // Twitch
  "Narwhal@NAC": "Narwhal.png",   // Twitch
  "Hood.J@ASIA": "Hood.J.png",   // Twitch
  "Voil@NAC": "Voil.png",   // Twitch
  "Nach@NAW": "Nach.png",   // Twitch
  "Mony@NAW": "Mony.png",   // Twitch
  "Diamond@BR": "Diamond.png",   // Twitch
  "Robot@BR": "Robot.png",   // Twitch
  "Virsuh@EU": "Virsuh.png",   // Twitch
  "Primzhy@EU": "Primzhy.png",   // Twitch
  "Blacky@EU": "Blacky.png",   // Twitch
  "L1nk@EU": "L1nk.png",   // Twitch
  "Dyox@EU": "dyox.png",   // Twitch
  "Seanvp@EU": "Seanvp.png",   // Twitch
  "RELLVIS@EU": "RELLVIS.png",   // Twitch
  "Kruyor@NAW": "Kruyor.png",   // Twitch
  "ZQ@EU": "ZQ.png",   // Twitch
  "Rabid@EU": "Rabid.png",   // Twitch
  "Blacha@EU": "Blacha.png",   // Twitch
  "nathes@BR": "nathes.png",   // Twitch
  "vexi@EU": "Vexi.png",   // Twitch
  "Wheat@EU": "Wheat.png",   // Twitch
  "kantri@EU": "kantri.png",   // Twitch
  "Ricbor@EU": "Ricbor.png",   // Twitch
  "adxm@NAW": "adxm.png",   // Twitch
  "FHD@ME": "FHD.png",   // Twitch
  "Rapit@ME": "Rapit.png",   // Twitch
  "Raze@NAW": "Raze.png",   // Twitch
  "27Q8@ME": "27Q8.png",   // Twitch
  "Minty@ASIA": "Minty.png",   // Twitch
  "CZR@NAW": "CZR.png",   // Twitch
  "Backtalk@NAC": "Backtalk.png",   // Twitch
  "Yuleys@OCE": "Yuleys.png",   // Twitch
  "letz@BR": "letz.png",   // Twitch
  "Spectral@BR": "Spectral.png",   // Twitch
  "Azizis@BR": "Azizis.png",   // Twitch
  "Phenom@NAC": "Phenom.png",   // Twitch
  "zyft@NAC": "zyft.png",   // Twitch
  "Nate Hill@NAC": "NateHill.png",   // Twitch
  "Scoped@NAC": "Scoped.png",   // Twitch
  "Spy@ME": "Spy.png",   // Twitch
  "Yonx@ME": "Yonx.png",   // Twitch
  "Arrow@ME": "Arrow.png",   // Twitch
  "Nm7@ME": "Nm7.png",   // Twitch
  "SinOoh@ASIA": "SinOoh.png",   // Twitch
  "Robabz@EU": "Robabz.png",   // Twitch
  "Wqzzi@ME": "Wqzzi.png",   // Twitch
  "Damage.-13@BR": "Damage.-13.png",   // Twitch
  "Bryan@BR": "Bryan.png",   // Twitch
  "Unit@ME": "Unit.png",   // Twitch
  "Kai@ME": "Kai.png",   // Twitch
  "NM7@ME": "Nm7.png",   // Twitch
  "Nyle@ME": "Nyle.png",   // Twitch
  "KuKi@ME": "KuKi.png",   // Twitch
  "narwhal@NAC": "Narwhal.png",   // Twitch
  "Beast@NAW": "Beast.png",   // Twitch
  "exe@NAW": "exe.png",   // Twitch
  "Reducs@NAC": "Reducs.png",   // Twitch
  "Lekmaluco@BR": "Lekmaluco.png",   // Twitch
  "Lxdesman@NAW": "Lxdesman.png",   // Twitch
  "Dopi@NAW": "Dopi.png",   // Twitch
  "Barella@BR": "Barella.png",   // Twitch
  "Tade@BR": "Tade.png",   // Twitch
  "Sane@ME": "Sane.png",   // Twitch
  "nomfu@ME": "nomfu.png",   // Twitch
  "Cursive@ME": "Cursive.png",   // Twitch
  "Pancake@ME": "Pancake.png",   // Twitch
  "Dyfs@BR": "Dyfs.png",   // Twitch
  "Closr@NAW": "Closr.png",   // Twitch
  "Acrian@EU": "Acrian.png",   // Twitch
  "Klusia@EU": "Klusia.png",   // Twitch
  "Adn@EU": "Adn.png",   // Twitch
  "Bleed@ME": "Bleed.png",   // Twitch
  "Shizogod@EU": "Shizogod.png",   // Twitch
  "Snap@EU": "snap.png",   // Twitch
  "jagveer@NAW": "Jagveer.png",   // Twitch
  "Savaje@NAC": "Savaje.png",   // Twitch
  "osp@NAC": "Osp.png",   // Twitch
  "Keto@NAW": "Keto.png",   // Twitch
  "Rasso@NAW": "Rasso.png",   // Twitch
  "Predage@EU": "Predage.png",   // Twitch
  "JarKo@EU": "JarKo.png",   // Twitch
  "Pirozz@EU": "Pirozz.png",   // Twitch
  "Kiire@EU": "Kiire.png",   // Twitch
  "Polar@NAC": "Polar.png",   // Twitch
  "prax@EU": "prax.png",   // Twitch
  "Hellonsteam@ME": "Hellonsteam.png",   // Twitch
  "Rialy@ASIA": "Rialy.png",   // Twitch
  "TuNa@ME": "Tuna.png",   // Twitch
  "Edson@BR": "edson.png",   // Twitch
  "Noizy@NAC": "Noizy.png",   // Twitch
  "Sanjog@OCE": "Sanjog.png",   // Twitch
  "Protoon@OCE": "Protoon.png",   // Twitch
  "Gazer@OCE": "Gazer.png",   // Twitch
  "Dandir@ME": "Dandir.png",   // Twitch
  "Crusades@OCE": "Crusades.png",   // Twitch
  "Broken@ME": "Broken.png",   // Twitch
  "Mase@OCE": "Mase.png",   // Twitch
  "Encrypted@NAC": "Encrypted.png",   // Twitch
  "Lucx@BR": "Lucx.png",   // Twitch
  "Braden@NAW": "Braden.png",   // Twitch
  "Sudds@NAW": "Sudds.png",   // Twitch
  "Wagers@NAC": "Wagers.png",   // Twitch
  "Listen@NAC": "Listen.png",   // Twitch
  "ronaldo@NAC": "Ronaldo.png",   // Twitch
  "CoolPenguin48@NAW": "CoolPenguin48.png",   // Twitch
  "Envy@ASIA": "Envy.png",   // Twitch
  "Herrions@NAW": "Herrions.png",   // Twitch
  "NetZz@NAC": "NetZz.png",   // Twitch
  "Little@NAW": "little.png",   // Twitch
  "Gustavo@BR": "Gustavo.png",   // Twitch
  "salvo@NAW": "salvo.png",   // Twitch
  "Aimhero_o@ASIA": "Aimhero_o.png",   // Twitch
  "VanilLa@ASIA": "VanilLa.png",   // Twitch
  "Arisakaaa@ASIA": "Arisakaaa.png",   // Twitch
  "Vexy@NAC": "Vexy.png",   // Twitch
  "Sails@NAC": "Sails.png",   // Twitch
  "Νm7@ME": "m7.png",   // Twitch
  "Mаеstго@EU": "Mst.png",   // Twitch
  "Fares@ME": "Fares.png",   // Twitch
  "retake@BR": "retake.png",   // Twitch
  "Criizux@NAW": "Criizux.png",   // Twitch
  "LazarP@NAC": "LazarP.png",   // Twitch
  "Defiable@NAW": "defiable.png",   // Twitch
  "Taka@BR": "Taka.png",   // Twitch
  "Peace@NAW": "Peace.png",   // Twitch
  "Styler@EU": "Styler.png",   // Twitch
  "Totot@ASIA": "Totot.png",   // Twitch
  "CoSa@ASIA": "CoSa.png",   // Twitch
  "DaddyFaisal@ME": "DaddyFaisal.png",   // Twitch
  "Elmtd@BR": "Elmtd.png",   // Twitch
  "Losted@BR": "Losted.png",   // Twitch
  "Lucas@NAW": "Lucas.png",   // Twitch
  "xKumu@EU": "xKumu.png",   // Twitch
  "Jurdy@EU": "Jurdy.png",   // Twitch
  "Lozer@ME": "Lozer.png",   // Twitch
  "Mana@OCE": "Mana.png",   // Twitch
  "Rad3on@EU": "Rad3on.png",   // Twitch
  "SereN@EU": "SereN.png",   // Twitch
  "Skayter@NAC": "Skayter.png",   // Twitch
  "FRANEK@EU": "FRANEK.png",   // Twitch
  "dinus@EU": "dinus.png",   // Twitch
  "Kizers@EU": "Kizers.png",   // Twitch
  "Kaspr@ME": "Kaspr.png",   // Twitch
  "Shady@EU": "Shady.png",   // Twitch
  "Anon@OCE": "Anon.png",   // Twitch
  "Suetam@BR": "Suetam.png",   // Twitch
  "slw@BR": "slw.png",   // Twitch
  "zeykoo@EU": "zeykoo.png",   // Twitch
  "Sunddely@EU": "Sunddely.png",   // Twitch
  "Jules@EU": "Jules.png",   // Twitch
  "Ceneto@NAC": "Ceneto.png",   // Twitch
  "trippn@OCE": "trippn.png",   // Twitch
  "Wolfie@BR": "Wolfie.png",   // Twitch
  "Gary@NAC": "Gary.png",   // Twitch
  "Highr@NAC": "Highr.png",   // Twitch
  "Jaus@NAW": "Jaus.png",   // Twitch
  "Jai@OCE": "Jai.png",   // Twitch
  "Mezega@NAW": "Mezega.png",   // Twitch
  "noia@EU": "noia.png",   // Twitch
  "flinty@NAW": "flinty.png",   // Twitch
  "Clayrixx@OCE": "Clayrixx.png",   // Twitch
  "Hcube@NAC": "Hcube.png",   // Twitch
  "paceve@EU": "paceve.png",   // Twitch
  "Winther@EU": "Winther.png",   // Twitch
  "Jordan@OCE": "Jordan.png",   // Twitch
  "g0dku@NAW": "g0dku.png",   // Twitch
  "Jace@OCE": "Jace.png",   // Twitch
  "alecc@OCE": "alecc.png",   // Twitch
  "KiritoKun@ME": "KiritoKun.png",   // Twitch
  "Suns@OCE": "Suns.png",   // Twitch
  "Arius@ASIA": "Arius.png",   // Twitch
  "Unlocalize@NAW": "Unlocalize.png",   // Twitch
  "steanzz@NAC": "steanzz.png",   // Twitch
  "Rvvr@ME": "Rvvr.png",   // Twitch
  "Matrx@ME": "Matrx.png",   // Twitch
  "Cryzstl@ME": "Cryzstl.png",   // Twitch
  "Jesse@OCE": "Jesse.png",   // Twitch
  "MarkusC@EU": "MarkusC.png",   // Twitch
  "Gheez@OCE": "Gheez.png",   // Twitch
  "Forbes@OCE": "Forbes.png",   // Twitch
  "Zlem@NAC": "Zlem.png",   // Twitch
  "joysick@NAW": "joysick.png",   // Twitch
  "Bedin@BR": "Bedin.png",   // Twitch
  "Zum@NAC": "Zum.png",   // Twitch
  "Wood@NAW": "Wood.png",   // Twitch
  "Vinny@NAW": "Vinny.png",   // Twitch
  "kquid@OCE": "kquid.png",   // Twitch
  "MacChan@ASIA": "MacChan.png",   // Twitch
  "Zepher@ASIA": "Zepher.png",   // Twitch
  "ToRmen@ME": "ToRmen.png",   // Twitch
  "LeziX@ME": "LeziX.png",   // Twitch
  "captainy@NAW": "captainy.png",   // Twitch
  "gabe@NAC": "Gabe.png",   // Twitch
  "Asfit@OCE": "Asfit.png",   // Twitch
  "AB@ME": "AB.png",   // Twitch
  "klown@EU": "Klown.png",   // Twitch
  "Edison@EU": "Edison.png",   // Twitch
  "ARDI@EU": "ARDI.png",   // Twitch
  "Hlechis@EU": "Hlechis.png",   // Twitch
  "Skrill@EU": "Skrill.png",   // Twitch
  "Srapt@EU": "Srapt.png",   // Twitch
  "LILY@ASIA": "Lily.png",   // Twitch
  "Phazgod@OCE": "Phazgod.png",   // Twitch
  "Fant@EU": "Fant.png",   // Twitch
  "Satisfy@OCE": "Satisfy.png",   // Twitch
  "purebx@NAW": "purebx.png",   // Twitch
  "clayrixx@OCE": "Clayrixx.png",   // Twitch
  "Joshbot@EU": "Joshbot.png",   // Twitch
  "Sharkman@NAC": "Sharkman.png",   // Twitch
  "JKReet@ME": "JKReet.png",   // Twitch
  "Yuz@NAC": "Yuz.png",   // Twitch
  "OB@ME": "OB.png",   // Twitch
  "BARQ@ME": "BARQ.png",   // Twitch
  "Solvey@OCE": "Solvey.png",   // Twitch
  "White@BR": "White.png",   // Twitch
  "Hxvac@NAC": "Hxvac.png",   // Twitch
  "Fuzz@NAW": "Fuzz.png",   // Twitch
  "PureBx@NAW": "purebx.png",   // Twitch
  "Scuffys@NAC": "Scuffys.png",   // Twitch
  "Power@NAC": "Power.png",   // Twitch
  "XXiF@NAC": "XXiF.png",   // Twitch
  "LeftEye@EU": "LeftEye.png",   // Twitch
  "Rel@OCE": "Rel.png",   // Twitch
  "Monty@NAC": "Monty.png",   // Twitch
  "MrFreshAsian@OCE": "MrFreshAsian.png",   // Twitch
  "mrfreshasian@OCE": "MrFreshAsian.png",   // Twitch
  "zoreh@OCE": "zoreh.png",   // Twitch
  "Triggy@NAW": "Triggy.png",   // Twitch
  "Retake@BR": "retake.png",   // Twitch
  "Simple@NAC": "Simple.png",   // Twitch
  "Obito@ME": "Obito.png",   // Twitch
  "Nasir@ME": "Nasir.png",   // Twitch
  "Litzinio@NAW": "Litzinio.png",   // Twitch
  "PhluxZy@OCE": "PhluxZy.png",   // Twitch
  "Brabo@BR": "Brabo.png",   // Twitch
  "SINLORD@ME": "SINLORD.png",   // Twitch
  "Lush@NAW": "Lush.png",   // Twitch
  "Tisora@BR": "Tisora.png",   // Twitch
  "Malkawi@ME": "Malkawi.png",   // Twitch
  "Krypas@NAW": "Krypas.png",   // Twitch
  "Athiel@ASIA": "Athiel.png",   // Twitch
  "Artor@EU": "artor.png",   // Twitch
  "L0WK3Y@EU": "L0WK3Y.png",   // Twitch
  "Coope@EU": "Coope.png",   // Twitch
  "Purchawa@EU": "Purchawa.png",   // Twitch
  "Anchor@EU": "Anchor.png",   // Twitch
  "Leo@NAW": "Leo.png",   // Twitch
  "Forzen@EU": "Forzen.png",   // Twitch
  "Nekko@NAC": "Nekko.png",   // Twitch
  "Maciak@EU": "Maciak.png",   // Twitch
  "Shadox@EU": "Shadox.png",   // Twitch
  "Trezy@NAW": "Trezy.png",   // Twitch
  "Chase@NAW": "Chase.png",   // Twitch
  "AmoZz@EU": "AmoZz.png",   // Twitch
  "Neo@NAC": "Neo.png",   // Twitch
  "thetik@NAC": "thetik.png",   // Twitch
  "Unknown@NAC": "Unknown.png",   // Twitch
  "Chenkinz@NAC": "Chenkinz.png",   // Twitch
  "Crypty@OCE": "Crypty.png",   // Twitch
  "hizixx@EU": "hizixx.png",   // Twitch
  "Puzera@BR": "Puzera.png",   // Twitch
  "Turtl3@EU": "Turtl3.png",   // Twitch
  "Sully@OCE": "Sully.png",   // Twitch
  "forbes@OCE": "Forbes.png",   // Twitch
  "Jahlyn@OCE": "Jahlyn.png",   // Twitch
  "Alecc@OCE": "alecc.png",   // Twitch
  "Thome@BR": "Thome.png",   // Twitch
  "Msg@ME": "Msg.png",   // Twitch
  "Snagged@EU": "Snagged.png",   // Twitch
  "Maseff@NAC": "Maseff.png",   // Twitch
  "Ozirvo@NAC": "Ozirvo.png",   // Twitch
  "Salvo@ME": "salvo.png",   // Twitch
  "Lucid@OCE": "Lucid.png",   // Twitch
  "Westy@OCE": "Westy.png",   // Twitch
  "Yonduh@OCE": "Yonduh.png",   // Twitch
  "Nunker@OCE": "Nunker.png",   // Twitch
  "OutLaw@ME": "OutLaw.png",   // Twitch
  "Akai@ME": "Akai.png",   // Twitch
  "Mjood@ME": "Mjood.png",   // Twitch
  "FLK@ME": "FLK.png",   // Twitch
  "Icee@EU": "Icee.png",   // Twitch
  "Toff@NAW": "toff.png",   // Twitch
  "Macheew@OCE": "Macheew.png",   // Twitch
  "Lime@NAW": "Lime.png",   // Twitch
  "Joyza@ASIA": "Joyza.png",   // Twitch
  "Ale@NAC": "Ale.png",   // Twitch
  "LLJFT@ME": "LLJFT.png",   // Twitch
  "Fuzeac@NAC": "Fuzeac.png",   // Twitch
  "Kirb1@EU": "Kirb1.png",   // Twitch
  "Costa@NAC": "Costa.png",   // Twitch
  "cillic@NAC": "cillic.png",   // Twitch
  "Kielba@EU": "Kielba.png",   // Twitch
  "Kaliper@NAC": "Kaliper.png",   // Twitch
  "7xde@ME": "7xde.png",   // Twitch
  "Northern@NAC": "Northern.png",   // Twitch
  "Chuckxz@EU": "Chuckxz.png",   // Twitch
  "ADC@ME": "ADC.png",   // Twitch
  "Shaker@ASIA": "Shaker.png",   // Twitch
  "Whizxiy@NAW": "Whizxiy.png",   // Twitch
  "Venox@OCE": "Venox.png",   // Twitch
  "Rafast@BR": "Rafast.png",   // Twitch
  "Letw1k3@EU": "letw1k3.png",   // Twitch
  "DRG@EU": "DRG.png",   // Twitch
  "smeef@EU": "smeef.png",   // Twitch
  "Rift@NAW": "Rift.png",   // Twitch
  "Tyraxe@OCE": "Tyraxe.png",   // Twitch
  "Spidermon@ASIA": "Spidermon.png",   // Twitch
  "Zemo@NAC": "Zemo.png",   // Twitch
  "a9far@ME": "a9far.png",   // Twitch
  "Azizz@ME": "Azizz.png",   // Twitch
  "Rajrooj@ME": "Rajrooj.png",   // Twitch
  "Ronin@OCE": "Ronin.png",   // Twitch
  "HighSky@NAC": "HighSky.png",   // Twitch
  "Spraz@OCE": "Spraz.png",   // Twitch
  "heatzy@EU": "heatzy.png",   // Twitch
  "Crumble@NAC": "Crumble.png",   // Twitch
  "TeeJay@NAC": "TeeJay.png",   // Twitch
  "Swapz@EU": "Swapz.png",   // Twitch
  "Fredy@EU": "Fredy.png",   // Twitch
  "Master@BR": "Master.png",   // Twitch
  "sto@NAC": "sto.png",   // Twitch
  "Devour@OCE": "Devour.png",   // Twitch
  "Abdulelah@ME": "Abdulelah.png",   // Twitch
  "SFA7@ME": "SFA7.png",   // Twitch
  "Hurtyn@NAW": "Hurtyn.png",   // Twitch
  "kube@NAW": "kube.png",   // Twitch
  "Nyx@NAC": "Nyx.png",   // Twitch
  "Mesportt@OCE": "Mesportt.png",   // Twitch
  "Antorak@EU": "Antorak.png",   // Twitch
  "Ace1xx@NAC": "Ace1xx.png",   // Twitch
  "Remsy@NAW": "Remsy.png",   // Twitch
  "Crmzn@NAW": "Crmzn.png",   // Twitch
  "Alpha@EU": "Alpha.png",   // Twitch
  "sketch@NAW": "sketch.png",   // Twitch
  "zLeoSZN@EU": "zLeoSZN.png",   // Twitch
  "lxcas@OCE": "lxcas.png",   // Twitch
  "Bahiense@BR": "Bahiense.png",   // Twitch
  "Mv@BR": "Mv.png",   // Twitch
  "Chele@NAW": "Chele.png",   // Twitch
  "Sirence@BR": "Sirence.png",   // Twitch
  "Twx@ME": "Twx.png",   // Twitch
  "Tatto@ASIA": "Tatto.png",   // Twitch
  "Zinxii@OCE": "Zinxii.png",   // Twitch
  "spraz@OCE": "Spraz.png",   // Twitch
  "Neeqo@NAC": "Neeqo.png",   // Twitch
  "kikoo@EU": "Kikoo.png",   // Twitch
  "skyla@OCE": "skyla.png",   // Twitch
  "Goku@NAC": "Goku.png",   // Twitch
  "Fffakkz@BR": "Fffakkz.png",   // Twitch
  "Nebby@EU": "Nebby.png",   // Twitch
  "LunR@OCE": "LunR.png",   // Twitch
  "Colt@OCE": "Colt.png",   // Twitch
  "Steady@ME": "Steady.png",   // Twitch
  "wGoon@NAW": "wGoon.png",   // Twitch
  "Fex@EU": "Fex.png",   // Twitch
  "Optimal@NAW": "Optimal.png",   // Twitch
  "Linx@ME": "Linx.png",   // Twitch
  "Wokes@OCE": "Wokes.png",   // Twitch
  "Kchorro@BR": "kchorro.png",   // Twitch
  "Art1st@EU": "Art1st.png",   // Twitch
  "N7R@ME": "N7R.png",   // Twitch
  "Tjohnso@OCE": "Tjohnso.png",   // Twitch
  "Jairo@BR": "Jairo.png",   // Twitch
  "Tarpz@EU": "Tarpz.png",   // Twitch
  "Carlin@BR": "Carlin.png",   // Twitch
  "Blink@NAW": "Blink.png",   // Twitch
  "Efexy@EU": "Efexy.png",   // Twitch
  "Steg@BR": "Steg.png",   // Twitch
  "Syn@NAC": "Syn.png",   // Twitch
  "Omaar@ME": "Omaar.png",   // Twitch
  "3peace@ASIA": "3peace.png",   // Twitch
  "Purav@OCE": "Purav.png",   // Twitch
  "swizz@OCE": "swizz.png",   // Twitch
  "kumo@ASIA": "kumo.png",   // Twitch
  "Funk@NAC": "Funk.png",   // Twitch
  "SurprisE@EU": "SurprisE.png",   // Twitch
  "H.man@ME": "H.man.png",   // Twitch
  "playerone@ME": "playerone.png",   // Twitch
  "snirot@NAW": "snirot.png",   // Twitch
  "Krool@ME": "Krool.png",   // Twitch
  "Yung calculator@NAC": "yungcalculator.png",   // Twitch
  "codgenesis@NAC": "codgenesis.png",   // Twitch
  "Remi@OCE": "Remi.png",   // Twitch
  "joey@NAC": "joey.png",   // Twitch
  "Wicked@OCE": "Wicked.png",   // Twitch
  "Loki@ME": "Loki.png",   // Twitch
  "HMb@BR": "HMb.png",   // Twitch
  "Raizen@EU": "Raizen.png",   // Twitch
  "Bqrbie@OCE": "Bqrbie.png",   // Twitch
  "Vimcu@ME": "Vimcu.png",   // Twitch
  "Gwooble@OCE": "Gwooble.png",   // Twitch
  "Poppin@NAW": "Poppin.png",   // Twitch
  "Saevid@EU": "saevid.png",   // Twitch
  "EMXXRR@EU": "EMXXRR.png",   // Twitch
  "Mawakha@EU": "Mawakha.png",   // Twitch
  "egrm@EU": "egrm.png",   // Twitch
  "Dylxn@OCE": "Dylxn.png",   // Twitch
  "dark@NAW": "Dark.png",   // Twitch
  "Tamakii@NAW": "Tamakii.png",   // Twitch
  "Cyluss@OCE": "Cyluss.png",   // Twitch
  "Cazo@OCE": "Cazo.png",   // Twitch
  "Drvcz@OCE": "Drvcz.png",   // Twitch
  "Takeru@OCE": "Takeru.png",   // Twitch
  "Spexz@NAW": "Spexz.png",   // Twitch
  "Monsterz@BR": "Monsterz.png",   // Twitch
  "JarkoS@EU": "JarkoS.png",   // Twitch
  "Owl@EU": "Owl.png",   // Twitch
  "Tetchra@NAC": "Tetchra.png",   // Twitch
  "Banny@ASIA": "Banny.png",   // Twitch
  "Daxthon@NAC": "Daxthon.png",   // Twitch
  "AlvinIr@EU": "AlvinIr.png",   // Twitch
  "Hycr1s@EU": "Hycr1s.png",   // Twitch
  "voil@NAC": "Voil.png",   // Twitch
  "The Uzi@NAC": "TheUzi.png",   // Twitch
  "Gandhi@NAC": "Gandhi.png",   // Twitch
  "Vichoo@BR": "Vichoo.png",   // Twitch
  "Vitinho@BR": "Vitinho.png",   // Twitch
  "Trixy@OCE": "Trixy.png",   // Twitch
  "Nephrite@ASIA": "Nephrite.png",   // Twitch
  "Hookka@EU": "Hookka.png",   // Twitch
  "Punga@OCE": "Punga.png",   // Twitch
  "nunker@OCE": "Nunker.png",   // Twitch
  "Scorpion@ME": "Scorpion.png",   // Twitch
  "Hop@NAW": "Hop.png",   // Twitch
  "buzzo@NAW": "buzzo.png",   // Twitch
  "Bryanvyy@BR": "Bryanvyy.png",   // Twitch
  "nurface@NAC": "nurface.png",   // Twitch
  "Kalco@OCE": "Kalco.png",   // Twitch
  "Joakofishy@BR": "Joakofishy.png",   // Twitch
  "Toadslayer@OCE": "Toadslayer.png",   // Twitch
  // ==== /Portraits by strongest card ====
  // Team Eldia (30.09): аватары из X — @magmafavelado и @emilfn12.
  "Chainsaw mag@BR":"Chainsaw_mag.jpg", "Chapofn1@EU":"Chapofn1.jpg", "Zukiri@EU":"Zukiri.jpg",
  "serkkovv@ME":"serkkovv.jpg", "luk3@BR":"luk3.jpg", "Vicens@NAC":"Vicens.jpg",   // Team Eldia, X-аватарки 8.10
  "Buedelupro@BR":"Buedelupro.jpg",   // Team Eldia, X-аватарка (x.com/Buedelupro, Notion «19.10»; у X она всего 65×65)
  "Kyzenn@EU":"Kyzenn.jpg", "Xeno@EU":"Xeno.jpg", "hydra@EU":"hydra.jpg", "Helena@EU":"Helena.jpg", "Lix@EU":"Lix.jpg", "Ariaa@EU":"Ariaa.jpg"   // Shimo, X-аватарки 9.10
};

// Strip a leading team tag ("S8UL KAAN BABA" -> "KAAN BABA") so the monogram
// comes from the player's own name rather than their org.
function displayWords(handle){
  const words=String(handle).replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/).filter(Boolean);
  if(words.length>=2){
    const first=words[0];
    const looksLikeTag = first.length<=5 && first===first.toUpperCase() && /\p{L}/u.test(first);
    if(looksLikeTag) return words.slice(1);
  }
  return words;
}
function initialsFor(handle){
  // Only real letters count — handles are full of decorative symbols.
  const w=displayWords(handle).filter(x=>/^[\p{Script=Latin}\p{Script=Cyrillic}]/u.test(x));
  if(!w.length) return String(handle).replace(/[^\p{L}\p{N}]/gu,'').slice(0,2).toUpperCase() || '?';
  if(w.length===1) return w[0].slice(0,2).toUpperCase();
  return (w[0][0]+w[1][0]).toUpperCase();
}

// Real usage shares from fortnite.gg's most-used skins board. Only the names
// are used — the artwork belongs to Epic, so nothing is copied here. Licensed
// crossover skins are left out on purpose.
const META_SKINS=[
  ['Chani',3.658], ['Vix',2.894], ['Serenade',2.609], ['Holly Jammer',2.17],
  ['Surf Witch',1.853], ['Lyric',1.827], ['Aura',1.005], ['Shady Zadie',0.414],
  ['Cozy Chomps',0.399], ['Chaos Double Agent',0.103], ['Etheria',0.076],
  ['Charlotte',0.052], ['Lexa',0.032], ['Toona Fish',0.014]
];
const META_SKIN_TOTAL=META_SKINS.reduce((s,x)=>s+x[1],0);

// A player's skin is fixed by their handle, so the same person always wears the
// same thing, and the draw is weighted by the real usage rates — the meta skins
// turn up as often in a lobby here as they do in the game.
function skinFor(p){
  let r=seededRng(hashStr(p.handle+'|skin'))()*META_SKIN_TOTAL;
  for(const [name,share] of META_SKINS){
    r-=share;
    if(r<=0) return name;
  }
  return META_SKINS[0][0];
}

// Organisation crests live next to this file in ./logos/, same as the portraits.
// The filename is derived from the club name, so dropping "Virtus.pro.png" into
// that folder is all it takes — no code change. CLUB_LOGO below is only for the
// odd club whose file has to be named differently.
const LOGO_DIR='logos/';
// Crests that are on disk under a name the slug rule cannot reach. Each of these
// was shipping as no crest at all: clubLogoHTML builds "Virtus_Pro.png" from the
// club name, the file is called "Virtus.pro.png", the onerror handler removes
// the image and nothing says why. Seven files, seven badges back.
const CLUB_LOGO={
  'Shimo Crew':'Shimo.png',   // сейв, подписавший клуб под старым именем (21.09, несколько часов на проде)
  'Virtus Pro':'Virtus.pro.png',
  'SOLARY':'Solary.png',
  'GodLike Esports':'GodLike.png',
  'FOKUS':'FOKUS_CLAN.png',
  'Aspect Esports':'Aspect_Esport.png',
  'Knights of Shadows':'KoS_Esports.png',
  'Falcons Esport':'Team_Falcons.png',
  'Team Eldia':'Team_Eldia.jpg',   // аватар x.com/Team_Eldia (30.09)
  'Kraven Esport':'Kraven_Esport.jpg'   // аватар x.com/kravenesport (26.10)
};
function clubLogoFile(org){
  if(CLUB_LOGO[org]) return CLUB_LOGO[org];
  const slug=String(org).replace(/[^A-Za-z0-9.\-]+/g,'_').replace(/^_+|_+$/g,'');
  return slug ? slug+'.png' : null;
}
/* Есть ли файл герба вообще. Имя строится из названия клуба для любого, а файлов в logos/ 83 на 299 гербов
   ростера; <img> с onerror давал 404 на каждую отрисовку (~19k 4xx с origin за сутки,
   tools/check-missing-files.js).
   CAREER_CRESTS = содержимое папки (генерит tools/career-org-check.js).
   try, потому что const объявлен ниже по файлу и до своей строки бросает; тогда ведём себя как раньше. */
function ccHasCrest(f){
  if(!f) return false;
  try{ return CAREER_CRESTS.has(f); }catch(e){ return true; }
}
function clubLogoHTML(org, wide){
  const f=org && clubLogoFile(org);
  if(!ccHasCrest(f)) return '';
  const h=wide?12:10;
  // Crests come in wildly different proportions — some are square, some are wide
  // banners. Height alone would let a banner run three times the width of a
  // square mark, so the width is capped and the image letterboxed inside it.
  return `<img src="${LOGO_DIR}${f}" alt="" onerror="this.remove()"
    style="height:${h}px;max-width:${wide?34:28}px;object-fit:contain;width:auto;
    vertical-align:-1px;margin-right:4px;display:inline-block;">`;
}

// The big version, shown under the flag. Same file, but sized to sit as a peer of
// the flag rather than as a bullet in front of the club name. The slot around it
// keeps a fixed height, so cards without a crest still line up with the rest.
function clubCrestHTML(org, wide){
  const f=org && clubLogoFile(org);
  if(!ccHasCrest(f)) return '';
  const solid=(typeof ccCrestSolid==='function') && ccCrestSolid(f);
  return `<img class="${solid?'crest-tile':''}" src="${LOGO_DIR}${f}" alt="" onerror="this.remove()"
    style="max-height:${wide?30:24}px;max-width:${wide?50:42}px;object-fit:contain;
    display:block;${solid ? '' : 'filter:drop-shadow(0 1px 2px rgba(0,0,0,.45));'}">`;
}

// Фото игрока, а если его нет — «Рекрут» за ником (см. ccRecruitURL). Настоящее — photoURLReal.
function photoURL(p){ return photoURLReal(p) || ccRecruitURL(p); }
function ccRecruitURL(p){
  const h=String((p && p.handle)||'').trim(); if(!h) return null;
  return 'photos/default/recruit-'+(1+(Math.abs(hashStr(h+'|recruit'))%8))+'.png';
}
function photoURLReal(p){
  // A career player uploads their own portrait, so it travels on the card
  // object rather than living in the photos folder.
  // Карточка может прийти от другого игрока по проводу: в src идёт только картинка data: или свой путь.
  if(p && p._photo) return /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+|[a-z0-9_\/.%-]+)$/i.test(String(p._photo)) ? p._photo : null;
  /* Сгенерированный игрок лестницы (ccLadderEvent) — не человек сцены: ник у него из общего списка, и голый ключ
     отдавал ему лицо настоящего тёзки (Notion 29.10: бот «Cold 49» из Европы с фото американского Cold). */
  if(p && p.tier==='ladder' && /generat|сгенерир|généré|gerado/i.test(String(p.event||''))) return null;
  // Trimmed, because some cards carry a trailing space in the handle — "Japko ",
  // "5AALD ", "Braydz " — and an exact lookup missed a portrait that was sitting
  // in the folder. It costs nothing and it matters more the more photos there
  // are: a name keyed clean in the map never matches a card keyed with a space.
  const h = String((p && p.handle) || '').trim();
  const f = PLAYER_PHOTO[h+'@'+p.region] || PLAYER_PHOTO[h];
  return f ? PHOTO_DIR+f : null;
}

function portraitHTML(p, h, skin){
  /* Фото нет (у игроков квалификаторов их нет нигде) — стандартный персонаж Fortnite: один из
     восьми «Рекрутов», закреплённый за ником, чтобы у человека всегда было одно лицо. */
  const real=photoURLReal(p);
  const url=real || ccRecruitURL(p);
  const box=`width:${Math.round(h*0.92)}px;height:${h}px;position:relative;overflow:hidden;
    border-radius:10px;
    box-shadow:0 3px 10px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.14);`;
  // The monogram is always drawn underneath. If the photos folder is missing or a
  // single file fails to load, the <img> removes itself and the card degrades to
  // the monogram instead of showing an empty frame.
  const rnd=seededRng(hashStr(p.handle+'|portrait'));
  const hue=Math.floor(rnd()*360);
  const ini=initialsFor(p.handle);
  // Фото и ник карточки напарника приезжают по сети: оба экранируются целиком, не только кавычка.
  const alt=esc(String(p.handle));
  const photo = url ? `<img src="${esc(url)}" alt="${alt}" loading="lazy" onerror="this.remove()"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
      object-position:top center;display:block;">` : '';
  return `<div style="${box}background:radial-gradient(120% 100% at 50% 0%, hsl(${hue} 45% 34%) 0%, rgba(0,0,0,.55) 100%);">
    <svg viewBox="0 0 60 60" preserveAspectRatio="xMidYMax meet"
      style="position:absolute;inset:0;width:100%;height:100%;opacity:.3;">
      <circle cx="30" cy="23" r="13.5" fill="#000"></circle>
      <path d="M2 62c0-15 13-24 28-24s28 9 28 24z" fill="#000"></path>
    </svg>
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
      <span class="fut-ovr" style="font-size:${Math.round(h*0.42)}px;color:rgba(255,255,255,.92);
        letter-spacing:.01em;${real ? '' : 'opacity:0;'}">${ini}</span>
    </div>${photo}
  </div>`;
}

function futCardHTML(p, opts){
  opts=opts||{};
  const a=attrsFor(p);
  const skin=CARD_SKIN[shownRarity(p)]||CARD_SKIN.common;
  const wide=!!opts.wide;
  const flag=cardFlag(p, wide?18:15);
  // A career's own numbers are carried unrounded — a day at the aim trainer is
  // worth a third of a point and has to add up over a season — so the card
  // rounds them for the eye the way the rating already does with ovrExact.
  // Printed raw they came out as 61.33 next to 61, and a five-character value
  // in a slot sized for two ran straight over its own bar.
  const attrRows=ATTR_KEYS.map(k=>{
    const pct=clamp((a[k]-30)/69*100, 4, 100);
    // Every attribute names the leaderboard column it is read from, so the
    // number on the card can be checked against the published standings.
    const src=L()[ATTR_FULL[k]]+' — '+L()[ATTR_SRC[k]]
      +(a.flat ? '\n'+L().attrFlatNote : '');
    return `<div class="fut-attr" style="font-size:${wide?11:10}px;" title="${esc(src)}">
      <span class="lab">${L()[ATTR_LABEL[k]]}</span>
      <span class="val" style="font-size:${wide?13:12}px;">${Math.round(a[k])}</span>
      <span class="fut-bar"><i style="width:${pct.toFixed(0)}%;"></i></span>
    </div>`;
  }).join('');
  // A career player's connection, shown under the six. It is not a seventh
  // attribute — it never moves OVR, which is what sets the division and the card
  // colour — so it sits below a rule, marked as the thing the country buys.
  // Zero is not a stat: since ping and age stopped giving anything, a career
  // card carries the rows only if an old save still holds a real number.
  /* Прибавки за возраст и пинг на карточке не рисуются (его правка 29.09, Notion «27» скрин 22:
     «пусть это не пишется на карте, пусть будет понятно за что дают в начале выбора страны,
     возраста»). Объяснение — на экране создания, ccGainNotes. */
  const ageRow = true ? '' : (()=>{
    const e=p._ageEdge;
    const pct=clamp((e+CC_AGE_EDGE)/(CC_AGE_EDGE*2)*100, 3, 100);
    return `<div class="fut-attr fut-attr-ping${e<0?' neg':''}" style="font-size:${wide?11:10}px;"
      title="${esc(L().attrAgeFull)}${p._age?' — '+p._age:''}">
      <span class="lab">${L().attrAge}</span>
      <span class="val" style="font-size:${wide?13:12}px;">${e>0?'+':''}${Math.round(e)}</span>
      <span class="fut-bar"><i style="width:${pct.toFixed(0)}%;"></i></span>
    </div>`;
  })();
  const pingRow = true ? '' : (()=>{
    const pct=clamp(p._pingEdge/CC_PING_EDGE*100, 3, 100);
    const ms=p._pingMs!=null ? p._pingMs+' ms' : '';
    return `<div class="fut-attr fut-attr-ping" style="font-size:${wide?11:10}px;"
      title="${esc(L().attrPingFull)}${ms?' — '+ms:''}">
      <span class="lab">${L().attrPing}</span>
      <span class="val" style="font-size:${wide?13:12}px;">+${Math.round(p._pingEdge)}</span>
      <span class="fut-bar"><i style="width:${pct.toFixed(0)}%;"></i></span>
    </div>`;
  })();
  // Show the player's best finish: if they reached a Grand Finals, that result
  // outranks the Play-In or LCQ line they qualified through.
  const bestEvent = p.realGf && p.gfEvent ? p.gfEvent : p.event;
  const bestPlace = p.realGf ? p.realGf.rank : p.placement;
  /* Карточка без турнира — не поломка, а пустая строка внизу.

     Скриншот хаб командной карьеры: «Cannot read properties of
     undefined (reading 'replace') @39716» — то же падение, что 26 августа,
     только карточка другая. Карточку рисует один код, а приходят они отовсюду:
     по проводу от напарника, из записи о взятом, из старого сейва, — и
     список полей у них у всех свой. Рисовалка обязана переживать любую. */
  let evtName=bestEvent ? String(translateEventText(bestEvent)||'')
    .replace(/\s*\([^)]*участ[^)]*\)/i,'')
    .replace(/\s*\([^)]*participant[^)]*\)/i,'') : '';
  let evt=bestPlace!=null ? `${evtName} · ${ccTopC(bestPlace)}` : evtName;
  // Карточка формы называет выступление, за которое она дана, — а не событие базовой карточки.
  if(ccIsFormCard(p)) evt=`${String(L().formTag||'').toUpperCase()} · ${String(translateEventText(p.form.event)||p.form.event)} · ${ccTopC(p.form.place)}`;
  // The headline number is what the player actually is in a fight: their rating
  // plus what their connection and their age are worth. Rarity, colour and
  // division are still read from the rating alone, so choosing a country can
  // never move you up a rung.
  // Пинг - скрытая сила (его слово 23.11), в цифру карточки не идёт: только возраст.
  const extra = (p._ageEdge||0);
  /* And it stops at the top of the scale.

     The connection and the age are added on top of the rating, and the rating is
     already allowed all the way to 99 — so a 97 with a good ping and the right
     age printed 108, a number that exists nowhere else in the app and that the
     scale does not have a colour for. His call, 17 August: the ceiling is 99 and
     it is the ceiling for what is printed too.

     A second line reading "base 62" used to sit under the number to keep the two
     apart. It asked more than it answered — a player looking at two ratings on
     one card wants to know which one is him — so his call, 21 August: it comes
     off the card. Nothing is hidden by that: the PNG and AGE rows further down
     still print what each edge is worth, and the number itself says the whole
     sum in a sentence on hover. */
  const shownOvr = extra ? Math.min(CAREER_SCALE_TOP, Math.round(a.ovr + extra)) : a.ovr;
  /* Разбивка под числом вернулась, но не второй «базой»: «68 +6 +4» — база и
     две прибавки, те же, что строки PNG и AGE ниже. Тестер 5.10: «чтобы на
     карточке показывался настоящий рейтинг, а не с учётом плюсов за страну и
     возраст, путает это». Большое число остаётся суммой (решение 21.08), а
     откуда она — видно без наведения: на iPhone title не всплывает. */
  const sgn = v => (v<0 ? '−'+Math.abs(Math.round(v)) : '+'+Math.round(v));
  const ovrSplit = ccIsFormCard(p) && !extra
    ? `<div class="fut-ovr-split" style="font-size:${wide?9:8}px;color:${skin.glow};" title="${esc(L().brkFormBoost)}">${p.form.base} +${p.form.boost}</div>`
    : extra
    ? `<div class="fut-ovr-split" style="font-size:${wide?9:8}px;" title="${esc(L().cardOvrFull)}">${Math.round(a.ovr)} ${
        [p._ageEdge].filter(v=>Math.round(v||0)).map(sgn).join(' ')}</div>`
    : '';
  // The rarity, in the language the page is in. It used to print the skin's own
  // tag, which is the English word baked into CARD_SKIN beside the gradient —
  // fine as a key, wrong on screen, and on the card the player looks at most.
  const rarityKey = 'ccRarity'+shownRarity(p);
  // A ladder player carries a rating and no qualification — they never played a
  // qualifier, so printing "qualifier" across their card is simply untrue. They
  // read as their rarity, the same as a ranked card; the qualifier tag belongs
  // to cards that came out of a qualifier.
  const rated = p.tier==='ranked' || p.tier==='ladder';
  const tag = ccIsFormCard(p) ? (L().formTag||skin.tag).toUpperCase()
            : rated ? (L()[rarityKey]||skin.tag).toUpperCase()
                    : (L().qualifierTag||'').toUpperCase();
  const portraitH = wide?104:82;
  /* Карьерная карточка — без строки ФНКС-турнира и с лупой, как в драфте.
     Его пункт 17 со страницы «ы», 22 августа: «с карточек убрать фнксы, дать
     возможность лупы». Строка события — паспорт драфтовой карточки; в карьере
     она съедала низ, а посмотреть стату было нечем. noEvent прячет строку,
     peek вешает тот же openCardPeek, что открывает драфт. */
  const peekAttr = opts.peek
    ? ` onclick="ccPeekByHandle('${jsq(String(p.handle||''))}')"`+
      ` title="${esc(L().cardPeekHint)}"` : '';
  return `
  <div class="fut-card" style="background:${skin.bg};color:#fff;${opts.peek?'cursor:zoom-in;':''}
    padding:${wide?'16px 17px 14px':'13px 13px 11px'};
    box-shadow:0 0 0 1px rgba(255,255,255,.42) inset, 0 8px 22px rgba(0,0,0,.55), 0 0 30px -8px ${skin.glow}, 0 0 0 2.5px ${skin.glow};"${peekAttr}>
    <div style="display:flex;gap:${wide?12:9}px;align-items:flex-start;">
      <div style="text-align:center;min-width:${wide?54:46}px;">
        <div class="fut-ovr" style="font-size:${wide?40:33}px;color:#fff;" title="${esc(L().cardOvrFull)}">${shownOvr}</div>${ovrSplit}
        <div class="fut-role" style="font-size:${wide?10:9}px;">${L()[a.roleKey]}</div>
        <div style="margin-top:6px;height:${wide?18:15}px;">${flag}</div>
        <div class="fut-meta" style="font-size:${wide?9:8}px;margin-top:4px;">${regionName(p.region)}</div>
        <div style="margin-top:${wide?7:6}px;height:${wide?30:24}px;display:flex;
          align-items:center;justify-content:center;">${clubCrestHTML(p.org, wide)}</div>
      </div>
      <div style="flex:1;min-width:0;display:flex;justify-content:flex-end;">
        ${portraitHTML(p, portraitH, skin)}
      </div>
    </div>
    <div class="fut-name" style="font-size:${wide?20:15}px;margin-top:${wide?10:8}px;text-align:center;
      height:${wide?46:34}px;display:flex;align-items:center;justify-content:center;overflow:hidden;
      line-height:1.05;">${esc(p.handle)}</div>
    <div style="text-align:center;margin-top:5px;display:flex;gap:5px;justify-content:center;
      align-items:center;height:${wide?18:16}px;overflow:hidden;">
      ${(()=>{
        // A player with no club is a free agent, so the pill still shows rather
        // than leaving a gap next to the rarity tag. Dimmer than a real club,
        // so a card with an org still reads as the stronger one at a glance.
        const fa=!p.org;
        return `<span style="display:inline-block;font-size:${wide?9:8}px;font-weight:900;
        letter-spacing:.1em;padding:2px 7px;background:rgba(255,255,255,${fa?'.10':'.18'});
        color:${fa?'rgba(255,255,255,.62)':'#fff'};
        max-width:${wide?200:104}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        clip-path:polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);">${fa?'F/A':p.org}</span>`;
      })()}
      <span style="display:inline-block;font-size:${wide?9:8}px;font-weight:900;
        letter-spacing:.12em;padding:2px 7px;background:rgba(0,0,0,.45);color:${skin.glow};
        clip-path:polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%);">${tag}</span>
    </div>
    <div class="fut-div" style="margin:${wide?'12px 0 11px':'10px 0 9px'};"></div>
    <div style="display:grid;grid-template-columns:${wide?'1fr 1fr':'1fr'};gap:${wide?'6px 16px':'5px'};">${attrRows}</div>${pingRow}${ageRow}
    ${opts.noEvent ? '' : `<div class="fut-foot" style="font-size:${wide?9:8}px;margin-top:${wide?11:9}px;
      height:${wide?36:32}px;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;
      -webkit-line-clamp:${wide?3:3};">${evt}</div>`}
  </div>`;
}
/* Лупа карьерной карточки: тот же лист статы, что в драфте, — карточка ищется
   по нику среди своих, соседей и ростера. См. openCardPeek. */
function ccPeekByHandle(h){
  const k=hKey(h);
  const me=careerCard();
  if(me && hKey(me)===k) return openCardPeek(me);
  const m=(careerMates()||[]).find(x=>x && hKey(x)===k);
  if(m) return openCardPeek(m);
  const r=careerRosterNowEU().find(x=>hKey(x)===k);
  if(r) return openCardPeek(r);
  // Чужой регион — та же лупа: таблица финала Саммита или Глобалов держит весь мир.
  try{ for(const reg of CC_REGIONS){ const x=ccSceneRoster(reg).find(c=>hKey(c)===k); if(x) return openCardPeek(x); } }catch(e){}
  // Завершил карьеру — со сцены ушёл, но карточка его последнего года есть: лист с пометкой (ccRetiredOf).
  try{ if(typeof ccRetiredOf==='function' && ccRetiredOf(h)){
    const last=PLAYERS.filter(p=>hKey(p)===k && ccCardYear(p)===2026).sort((a,b)=>(ccCardDay(b)||0)-(ccCardDay(a)||0))[0];
    if(last) return openCardPeek(last); } }catch(e){}
  // Лестничное имя без карточки — один лист сезона, без атрибутов.
  const body=document.getElementById('cardPeekBody');
  const st=(typeof careerPlayerStatsHTML==='function') ? careerPlayerStatsHTML(h) : '';
  if(!body || !st) return;
  body.innerHTML='<div class="fut-back" style="padding:15px 16px;"><div class="fut-name" style="font-size:15px;margin-bottom:6px;">'+esc(String(h))+'</div>'+st+'</div>';
  document.getElementById('cardPeekModal').style.display='flex';
}

// Set while a career cup is on the results screen. Declared here rather than
// with the rest of the career code at the bottom of the file, because show()
// reads it and show() runs long before that section is evaluated.
var CAREER_RUN=false;
// The screen showing right now, so that changing it can put the page back at
// the top. A results screen is metres long — eleven stage cards, a standings
// table each — and leaving one from the bottom used to open the next screen at
// that same height: the main menu, scrolled past its own end. Only an actual
// change scrolls, because show() is also called with the screen already up
// (a hub redraw, a mode switch) and those must not jump the page.
let SHOWN_SCREEN=null;
function show(id){
  // Ушёл с турнира дня, не доиграв (лого, «назад») — сеянный Math.random не должен пережить его и попасть в карьеру.
  try{ if(DAILY_RAND && id!=='screen-results') dailySimOff(); }catch(e){}
  const moved = SHOWN_SCREEN!==id;
  SHOWN_SCREEN=id;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='screen-mode' && typeof ccHeroCareerText==='function') ccHeroCareerText();   // «Продолжить карьеру», если она есть
  // Навбар: светлая пилюля — тот раздел, чей экран показан.
  try{
    const nav = /career/.test(id) ? 'career' : (id==='screen-history' ? 'history' : 'draft');
    document.querySelectorAll('.nav-pill[data-nav]').forEach(b=>b.classList.toggle('on', b.dataset.nav===nav));
    // Шапка из трёх вкладок (30.10): «Профиль» светлая на своём экране, «Карьера» — на всех остальных.
    const me=id==='screen-profile';
    document.querySelectorAll('.site-nav .nav-main').forEach(b=>b.classList.toggle('on', !me));
    document.querySelectorAll('.site-nav .nav-me').forEach(b=>b.classList.toggle('on', me));
    if(!me && location.hash==='#me') history.replaceState(null, '', location.pathname+location.search);
    if(!me && typeof ccMeCloudHome==='function') ccMeCloudHome();   // панель облака обратно на экран карьеры
  }catch(e){}
  if(moved) window.scrollTo(0, 0);
  // Tiles on a screen that was display:none have no box to intersect, so the
  // lazy-art pass gets another look the moment a screen is put up.
  try{ window.dispatchEvent(new Event('cc-screen-shown')); }catch(e){}
  /* Career screens get the wider page; everything else keeps the reading width.

     Экран прогона (screen-results) — тоже широкий, правка:
     «может расширить симуляцию, чтоб текст лучше было видно… чтоб карта и
     таблица больше была». Он жил в колонке на 1180, которую делили карта и
     таблица: карте доставалось около шестисот пикселей, и ники на ней падали
     в нижний предел (7px), а таблица теряла столбец силы. Ширина здесь —
     единственный рычаг, который делает и то и другое: размер ников считается в
     cqh от высоты карты, а карта растёт вместе с колонкой. */
  const wrap=document.querySelector('.wrap');
  if(wrap) wrap.classList.toggle('wrap-wide',
    id.indexOf('screen-career')===0 || id==='screen-results');
  // "New draft" is how a one-off run starts over, and a career has no such
  // thing: the way out of a cup is back to the hub, and the result card carries
  // that button. Leaving the results screen for anything ends the career run, so
  // the flag clears itself and the button comes back for the normal modes.
  if(id!=='screen-results') CAREER_RUN=false;
  const nd=document.querySelector('.new-draft-btn');
  if(nd) nd.style.display = CAREER_RUN ? 'none' : '';
  // The skip chip is fixed to the page body, so leaving the tournament screen
  // has to take it with us — otherwise it hangs around on the menu. A run in
  // flight goes the same way: the results screen is the only place it belongs,
  // so navigating off it abandons the run and clears anything it had parked on
  // the body.
  if(id!=='screen-results'){
    abandonRun();
    const btn=document.getElementById('majorSkipBtn');
    if(btn) btn.remove();
    // The landing prompt is fixed to the body too, and only makes sense while
    // its own card is still on screen waiting on a click — gone the moment
    // that screen is.
    removeLandingPrompt();
    document.querySelectorAll('.qual-overlay, .conf').forEach(o=>o.remove());
  }
}



let rerollsLeft=2;
let isMajorMode=false;
let pendingSize=2, pendingMajor=false;
let pendingCards=false;
let pendingCardSet='m2';
// Ключ плитки «весь год», если старт пришёл с неё, иначе null. См. YEAR_CHAINS.
let pendingYear=null;
let preSelectedRegions=[];
let preSelectedYears=[];   // empty means every year
/* Which region's tournament a multi-region card run plays. myPrizeRegion and myGfRegion used to read
   drafted[0].region, so field, prize table and LAN allocation came from whichever card was opened first.
   Now the pool can mix regions but the event is one region picked on the same screen, and everything reads this. */
let preHomeRegion=null;
function ccHomeRegion(){
  if(preHomeRegion) return preHomeRegion;
  return (drafted && drafted[0] && drafted[0].region)
      || (preSelectedRegions && preSelectedRegions[0]) || 'EU';
}

// Which of the two simulations the next run is. Draft is the default because
// it is what every existing tile did before this existed.
let REALISTIC=false;
function setSimMode(realistic){
  REALISTIC=!!realistic;
  const r=document.getElementById('simRealisticBtn'), d=document.getElementById('simDraftBtn');
  if(r) r.classList.toggle('active', REALISTIC);
  if(d) d.classList.toggle('active', !REALISTIC);
}

/* Играть самому или смотреть. Разница только в вопросах посреди матча
   (лут после второй зоны, высота на восьмой), остальное одинаково: карта,
   реплей, таблица, скип, состав на Ласт Ченс и метка высадки (метка это ход
   до игры). В карьере свой смысл у «за меня» (перемотка ccFf), поэтому флаг
   читаем через playSelfOn(), не напрямую. */
let PLAY_SELF=true;
function setPlayMode(self){
  PLAY_SELF=!!self;
  const s=document.getElementById('playSelfBtn'), w=document.getElementById('playWatchBtn');
  if(s) s.classList.toggle('active', PLAY_SELF);
  if(w) w.classList.toggle('active', !PLAY_SELF);
}
function playSelfOn(){
  if(typeof CAREER_RUN!=='undefined' && CAREER_RUN) return true;
  return PLAY_SELF;
}

// Which card set each tile starts. Named rather than derived so a tile can be
// renamed without silently falling through to Major 2.
// Плитки «весь год» стартуют первым кругом своего сезона — дальше их ведёт
// YEAR_CHAINS, а не эта таблица.
const TILE_CARD_SET={cards:'m2', cards1:'m1',
                     cards2025:'t1', cards2025major2:'t2', cards2025major3:'t3',
                     cards2024:'f1', cards2024major2:'f2', cards2024major3:'f3', year2024:'f1',
                     // One card, four cups: the tile hands the chosen one straight through.
                     ewc1:'r1', ewc2:'r2', ewc3:'r3', ewc4:'r4',
                     year:'m1', year2025:'t1', yearReload:'r1'};

/* Год — это список кругов, которые играются одним составом подряд.

   Порядок тот же, в котором их играли на самом деле, и каждый круг сам знает,
   чем он заканчивается: m1 уводит на Саммит в Дюссельдорфе, m2 — на Ласт Ченс
   и Антверпен, t3 — в Лион. Поэтому здесь только имена наборов: продолжения
   уже написаны внутри runMajorTournament и переписывать их не надо.

   Reload — четыре капа подряд, LAN у него свой и внутри капа. */
const YEAR_CHAINS={year:['m1','m2'],
                   year2025:['t1','t2','t3'],
                   year2024:['f1','f2','f3'],
                   yearReload:['r1','r2','r3','r4']};
/* Ключевой арт плитки — подложкой страницы на экранах режима (см. --mode-art
   у body). Ключ — то, с чем плитка зовёт chooseMode; без ключа — по размеру. */
const MODE_ART={cards1:'art/mode-major1.jpg', cards:'art/fncs-2026.jpg',
                cards2025:'art/mode-major1-2025.jpg', cards2025major2:'art/mode-major2-2025.jpg',
                cards2025major3:'art/mode-major3-2025.jpg',
                cards2024:'art/map-f1.jpg', cards2024major2:'art/map-f2.jpg', cards2024major3:'art/map-f3.jpg', year2024:'art/map-f1.jpg',
                ewc1:'art/mode-ewc.jpg', ewc2:'art/mode-ewc.jpg', ewc3:'art/mode-ewc.jpg', ewc4:'art/mode-ewc.jpg',
                year:'art/mode-major1.jpg', year2025:'art/mode-major1-2025.jpg', yearReload:'art/mode-ewc.jpg',
                allfncs:'art/mode-all-fncs.jpg', duo:'art/mode-duo.jpg', trio:'art/mode-trio.jpg', squad:'art/mode-squad.jpg'};
/* ДРАФТ ПО ГОДАМ НА ГЛАВНОЙ (его слово 29.09: «когда нажимаешь играть драфт, там все года, которые
   есть на сайте, игрок может выбрать»). 2024–2026 — плитки в разметке; 2019–2023 собираются здесь из
   наборов карточек этих лет (те же, что в карьере). Соло-наборы (World Cup Solo, C2S3) в драфт не
   идут — драфт собирает команду. Круг — общий движок Мейджора (Play-In → хиты → финал). */
const DRAFT_PAST=[
  {y:2023, sets:['e1','e2','e3']},
  {y:2022, sets:['k1','k2','k3']},
  {y:2021, sets:['j1','j2','j3','j4']},
  {y:2020, sets:['i1','i3']},
  {y:2019, sets:['h2','h3','h4']}
];
const DRAFT_SET_SIZE={h2:2, h3:3, h4:4, i1:2, i3:3, j1:3, j2:3, j3:3, j4:3, k1:2, k2:2, k3:2, e1:2, e2:2, e3:2};
const DRAFT_SET_MAJOR={h3:'Major3_2019', h4:'Major4_2019', i1:'Major1_2020', i3:'Major3_2020',
  j1:'Major1_2021', j2:'Major2_2021', j3:'Major3_2021', j4:'Major4_2021',
  k1:'Major1_2022', k2:'Major2_2022', k3:'Major3_2022', e1:'Major1_2023', e2:'Major2_2023', e3:'Major3_2023'};
function draftSetArt(s){
  const p=(typeof ccFncsPoster==='function' && DRAFT_SET_MAJOR[s]) ? ccFncsPoster(DRAFT_SET_MAJOR[s]) : '';
  return p || (s==='h2' ? 'art/fncs-2019.jpg' : 'art/map-'+s+'.jpg');
}
// Плитки — сразу; обложки — при первой отрисовке (ccFncsPoster читает константу, объявленную ниже по файлу).
DRAFT_PAST.forEach(g=>g.sets.forEach(s=>{ TILE_CARD_SET['cards_'+s]=s; }));
let DP_YEAR='2026';
const DRAFT_YEAR_ART={
  2023:{main:'art/fncs-2023.jpg', big:['art/cups/f25.jpg', 'art/cups/f24.jpg']},
  2022:{main:'art/fncs-2022.jpg', big:['art/cups/f22inv.jpg', 'art/cups/f21.jpg']},
  2021:{main:'art/fncs-2021.jpg', big:['art/cups/f18gr.jpg', 'art/cups/f17.jpg']},
  2020:{main:'art/fncs-2020.jpg', big:['art/cups/f14.jpg', 'art/cups/f12.jpg']},
  2019:{main:'art/fncs-2019.jpg', big:['art/cups/f10.jpg', 'art/cups/f11.jpg']}
};
/* Плитки форматов — коллаж логотипов своих сезонов (его слово 29.09: «в all fncs куча логотипов всех
   фнкс, дуо — логотипы всех дуо, трио — всех трио, сквад — логотип сквада, он вроде один»). */
const DRAFT_FMT_LOGOS={
  all:['art/fncs-2019.jpg','art/cups/f10.jpg','art/cups/f11.jpg','art/cups/f12.jpg','art/cups/f14.jpg','art/cups/f15.jpg','art/cups/f18gr.jpg',
       'art/cups/f19.jpg','art/cups/f22inv.jpg','art/cups/f23.jpg','art/cups/f25.jpg','art/cups/f28.jpg','art/mode-major1-2025.jpg','art/fncs-2026.jpg'],
  duo:['art/fncs-2019.jpg','art/cups/f12.jpg','art/cups/f19.jpg','art/cups/f20.jpg','art/cups/f21.jpg','art/cups/f23.jpg','art/cups/f24.jpg',
       'art/cups/f25.jpg','art/cups/f28.jpg','art/fncs-2026.jpg'],
  trio:['art/cups/f10.jpg','art/cups/f14.jpg','art/cups/f15.jpg','art/cups/f16.jpg','art/cups/f17.jpg','art/cups/f18.jpg',
        'art/mode-major1-2025.jpg','art/mode-major2-2025.jpg','art/mode-major3-2025.jpg'],
  squad:['art/cups/f11.jpg']
};
function draftFmtWalls(){
  const box=document.getElementById('dpFormats'); if(!box) return;
  const keys=['all','duo','trio','squad'];
  box.querySelectorAll('.mode-card > .ec-art').forEach((art, i)=>{
    const k=keys[i]; if(!k || art.querySelector('.fmt-wall')) return;
    const list=DRAFT_FMT_LOGOS[k];
    /* Один постер на всю плитку (самый свежий турнир формата), остальные сезоны — полоской
       миниатюр в углу: коллаж из обрезанных постеров с подписью поверх выглядел кашей (скрин «29»). */
    art.classList.add('fmt-art', 'fmt-'+k);
    art.removeAttribute('data-art');
    art.style.backgroundImage='url('+list[list.length-1]+')';
    const rest=list.slice(0, -1).reverse(), show=rest.slice(0, 3);
    if(show.length) art.insertAdjacentHTML('afterbegin', '<div class="fmt-wall">'+
      show.map(src=>'<i style="background-image:url('+src+')"></i>').join('')+
      (rest.length>show.length ? '<b>+'+(rest.length-show.length)+'</b>' : '')+'</div>');
  });
}
function draftPastRowHTML(g){
  const T=L(), sub=n=>n===4 ? T.ecSubSquads : n===3 ? T.ecSubTrios : T.ecSubDuos;
  // Превью года — ключевой арт года в полном размере и постеры его крупнейших турниров
  // (его слово 29.09: «превьюхи у каждого года — самые большие турниры и в хорошем качестве»).
  const YA=DRAFT_YEAR_ART[g.y];
  // Одна картинка года целиком: куски постеров рядом резали скины и смотрелись неуместно (его слово 29.09).
  const arts=YA ? [YA.main] : g.sets.map(draftSetArt);
  const name=s=>String((typeof T_EVENT_NAME!=='undefined' && T_EVENT_NAME[s]) || s).replace(/^(FNCS|Fortnite) \d{4} /, '');
  const sizes=[...new Set(g.sets.map(s=>DRAFT_SET_SIZE[s]))].map(sub).join(' · ');
  return '<div class="year-row dp-past" data-year="'+g.y+'"><div class="year-label">'+g.y+'</div>'+
    '<div class="mode-grid mode-grid-3"><div class="mode-card mode-card-span">'+
      '<div class="ec-art" style="background-image:url('+arts[0]+');background-position:center">'+
        arts.slice(1, 3).map((a,i)=>'<i class="ec-slice'+(i?' ec-slice-3':'')+'" style="background-image:url('+a+')"></i>').join('')+
        '<span class="ec-pill ec-pill-l">'+esc(T.dpRealCards)+'</span>'+
        '<div class="ec-foot"><div class="ec-when">'+g.y+'</div><h3 class="ec-title">FNCS '+g.y+'</h3>'+
        '<div class="ec-mode"><span class="ec-chip">Battle Royale</span><span class="ec-sub">'+esc(sizes)+'</span></div></div></div>'+
      '<div class="ec-cups">'+g.sets.map(s=>'<button class="ec-cup ec-cup-arted" style="--cup-art:url('+draftSetArt(s)+')" '+
        'onclick="event.stopPropagation();chooseMode('+DRAFT_SET_SIZE[s]+',\'cards_'+s+'\')"><span>'+esc(name(s))+'</span><small>'+esc(sub(DRAFT_SET_SIZE[s]))+'</small></button>').join('')+'</div>'+
      '<p>'+esc(T.dpPastDesc2)+'</p>'+
    '</div></div></div>';
}
/* ЭКРАН ДРАФТА (его слово 29.09: «когда нажимаю play the draft, переношусь на новую вкладку, где сверху
   вниз с 2026 года по 2019 драфты»). Панель годов из разметки главной переезжает на свой экран
   screen-drafts один раз; там все ряды видны сразу, сверху вниз по годам, форматы — в конце. */
function homeDraftScreen(){
  let scr=document.getElementById('screen-drafts');
  const panel=document.getElementById('draftPanel');
  if(!scr){
    const home=document.getElementById('screen-mode'); if(!home || !panel) return null;
    scr=document.createElement('div');
    scr.className='screen'; scr.id='screen-drafts';
    scr.innerHTML='<div class="dp-top"><button class="dp-back" type="button" onclick="show(\'screen-mode\')">← <span data-i18n="dpBack"></span></button>'+
      '<div><span class="dp-tag" data-i18n="hmDraftTag"></span><h2 class="dp-title" data-i18n="hmDraftTitle"></h2></div></div>';
    home.parentNode.insertBefore(scr, home.nextSibling);
  }
  if(panel && panel.parentNode!==scr){ scr.appendChild(panel); }
  if(panel) panel.classList.remove('dp-shut');
  // Подписи новой шапки — тем же механизмом, что вся страница.
  scr.querySelectorAll('[data-i18n]').forEach(el=>{ const v=L()[el.dataset.i18n]; if(typeof v==='string') el.innerHTML=v; });
  return scr;
}
function homeDraftInit(){
  const panel=document.getElementById('draftPanel');
  if(!panel) return;
  DRAFT_PAST.forEach(g=>g.sets.forEach(s=>{ MODE_ART['cards_'+s]=draftSetArt(s); }));
  panel.querySelectorAll('.year-row:not(.dp-past)').forEach(r=>{
    const lbl=r.querySelector('.year-label'); if(lbl && !r.dataset.year) r.dataset.year=String(lbl.textContent||'').trim();
  });
  // Ряды 2019–2023 — после ряда 2024 (перестраиваются при смене языка).
  panel.querySelectorAll('.dp-past').forEach(r=>r.remove());
  const after=panel.querySelector('.year-row[data-year="2024"]');
  if(after) after.insertAdjacentHTML('afterend', DRAFT_PAST.map(draftPastRowHTML).join(''));
  // Форматы (All FNCS, дуо, трио, сквады) — своим рядом с подписью, в конце списка.
  const fmt=document.getElementById('dpFormats');
  if(fmt && !fmt.previousElementSibling?.classList?.contains('dp-fmt-label')){
    fmt.insertAdjacentHTML('beforebegin', '<div class="dp-fmt-label year-label" data-i18n="dpFormats"></div>');
  }
  const fl=panel.querySelector('.dp-fmt-label'); if(fl) fl.textContent=L().dpFormats;
  draftFmtWalls();
  // Полоса лет больше не нужна: все годы видны сразу.
  const bar=document.getElementById('dpYears'); if(bar) bar.innerHTML='';
  panel.querySelectorAll('[data-year]').forEach(el=>{ el.style.display=''; });
  panel.querySelectorAll('[data-art]').forEach(el=>{ if(!el.style.backgroundImage) el.style.backgroundImage='url('+el.dataset.art+')'; });
  if(document.getElementById('screen-drafts')) homeDraftScreen();
}
function homeOpenDraft(){
  homeDraftInit();
  if(!homeDraftScreen()) return;
  show('screen-drafts');
}
let MODE_ART_NOW=null;
function modeArtFor(size, major){
  if(typeof major==='string' && MODE_ART[major]) return MODE_ART[major];
  if(major) return MODE_ART.allfncs;
  return size===3 ? MODE_ART.trio : (size===4 ? MODE_ART.squad : MODE_ART.duo);
}
function chooseMode(size, major){
  pendingSize=size; pendingMajor=!!major;
  pendingCards = TILE_CARD_SET[major]!==undefined;
  // Год или один кубок. Ставится ЗДЕСЬ, а не в startDraft: экран регионов уже
  // читает список кругов, чтобы сказать, сколько их и чем год кончается.
  pendingYear = YEAR_CHAINS[major] ? major : null;
  DAILY=null;   // любой режим, выбранный руками, — не драфт дня (dailyStart ставит его после)
  MODE_ART_NOW=modeArtFor(size, major);
  CC_DRAFT_RUN=true;   // драфт, не командный вечер — мультиплеер молчит (см. ccMpOn)
  // Настройка комнаты прошлого карьерного вечера (единицы слабости дивизиона,
  // принудительный профиль финала соло) в драфт не переносится.
  if(typeof ccZoneTuneFor==='function') ccZoneTuneFor(null);
  pendingCardSet = TILE_CARD_SET[major] || 'm2';
  applyLobbyTheme(true);
  buildPreRegionChecks();
  buildMapChecks();
  // The realistic simulation is built on the roster back-references the cards
  // carry, and only card-set cards carry them: ALL FNCS, Duo, Trio and Squad
  // draw from players with no roster attached, so the picker there is empty, no
  // player is ever taken, and the run cannot be finished or left except through
  // the logo. Squad is impossible on top of that — no roster in the data has
  // four members. Asked of the data for this tile at this size rather than of a
  // list of tile names, so a new card set is offered the choice automatically
  // and a set that loses its rosters stops offering it.
  const canReal=realTeamsExistFor(pendingPool(), pendingSize);
  const simHead=document.getElementById('simModeHead'), simModes=document.getElementById('simModes');
  if(simHead) simHead.style.display = canReal ? '' : 'none';
  if(simModes) simModes.style.display = canReal ? '' : 'none';
  setSimMode(false);
  // По умолчанию — симуляция, левая кнопка. Отзыв: «пусть слева
  // автоматически будет кнопка симулейт, а справа играть».
  setPlayMode(false);
  show('screen-preregion');
}

function getPlayerYear(p){
  const m = (p.date||'').match(/(\d{4})/);
  return m ? parseInt(m[1],10) : null;
}

// Applies the same region/era selection the user picked to the whole tournament field,
// so AI-built teams are drawn from the same pool as the player's own draft, not the full base.
function tournamentPool(){
  // The player's region choice only narrows who THEY can draft — AI opponents
  // are pulled from every region, same as a real cross-region bracket.
  let base = modePool();
  if(preSelectedYears.length) base = base.filter(p=>preSelectedYears.includes(getPlayerYear(p)));
  return base;
}

// The pool the mode about to start will draw from — needed before CARD_MODE
// itself is set, so the region/era screen can offer only what really exists.
function pendingPool(){
  if(pendingCards){
    const roster=cardRosterPlayers(pendingCardSet);
    if(roster.length) return roster;
  }
  return freeModePool();
}

// Which island the free modes are played on. The Majors force their own map,
// so the picker only shows for ALL FNCS / Duo / Trio / Squad.
let pendingMapSet='m2';
// The free modes pick their island, and now the 2025 ones are on the list too.
// Choosing one takes its loot with it — the season the map is from is the season
// the packs are drawn from, which is what makes an island a choice rather than a
// backdrop.
const MAP_CHOICES=[{key:'m1', label:'Chapter 7 Season 2'}, {key:'m2', label:'Chapter 7 Season 3'},
                   {key:'t1', label:'Chapter 6 Season 1'}, {key:'t2', label:'Chapter 6 Season 2'},
                   {key:'t3', label:'Chapter 6 Season 3'}, {key:'t4', label:'Chapter 6 Season 4'},
                   // Chapter 5 (2024): острова финалов трёх Мейджоров и Форт-Уэрта, со своим лутом.
                   {key:'f1', label:'Chapter 5 Season 1'}, {key:'f2', label:'Chapter 5 Season 2'},
                   {key:'f3', label:'Chapter 5 Season 3'}, {key:'f4', label:'Chapter 5 Season 4'},
                   // Chapter 4 (2023): острова финалов трёх Мейджоров и Копенгагена.
                   {key:'e1', label:'Chapter 4 Season 1'}, {key:'e2', label:'Chapter 4 Season 2'},
                   {key:'e3', label:'Chapter 4 Season 3'}, {key:'e4', label:'Chapter 4 Season 4'},
                   // Chapter 3 (2022): острова трёх сезонов FNCS и Роли.
                   {key:'k1', label:'Chapter 3 Season 1'}, {key:'k2', label:'Chapter 3 Season 2'},
                   {key:'k3', label:'Chapter 3 Season 3'}, {key:'k4', label:'Chapter 3 Season 4'},
                   // Chapter 2 (2021): острова четырёх сезонов FNCS.
                   {key:'j1', label:'Chapter 2 Season 5'}, {key:'j2', label:'Chapter 2 Season 6'},
                   {key:'j3', label:'Chapter 2 Season 7'}, {key:'j4', label:'Chapter 2 Season 8'},
                   // 2019: остров World Cup (Season 9), Season X, Chapter 2 Season 1.
                   {key:'h1', label:'Chapter 1 Season 9'}, {key:'h3', label:'Chapter 1 Season X'}, {key:'h4', label:'Chapter 2 Season 1'},
                   {key:'i1', label:'Chapter 2 Season 2'}, {key:'i2', label:'Chapter 2 Season 3'}, {key:'i3', label:'Chapter 2 Season 4'}];

function buildMapChecks(){
  const block=document.getElementById('mapBlock');
  const el=document.getElementById('mapChecks');
  if(!block || !el) return;
  block.style.display = pendingCards ? 'none' : '';
  if(pendingCards) return;
  el.innerHTML='';
  // По порядку, от новых к старым: глава, потом сезон (Season X — десятый). Список выше собран по годам
  // и шёл вперемешку — C7S2 перед C7S3, Chapter 1 между Chapter 2 (Notion «29»).
  const ord=c=>{ const m=/Chapter (\d+) Season (\w+)/.exec(c.label)||[]; return (+m[1]||0)*100+(m[2]==='X' ? 10 : (+m[2]||0)); };
  MAP_CHOICES.slice().sort((a,b)=>ord(b)-ord(a)).forEach(c=>{
    const b=document.createElement('button');
    b.className='rf-btn'+(c.key===pendingMapSet?' active':'');
    b.dataset.map=c.key;
    b.textContent=c.label;
    b.onclick=()=>{
      pendingMapSet=c.key;
      el.querySelectorAll('.rf-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    };
    el.appendChild(b);
  });
}


// A region plate: the code the scene actually uses, with the long name under it
// as the caption rather than the label. Broadcast standings, brackets and every
// conversation about a Major say EU and NAC; "Middle East" set in eleven pixels
// inside a pill is the app's word for it, not the sport's. The code leads, the
// name explains it once, and the target is a plate you can hit rather than a
// chip you have to aim at.
function regionPlateHTML(code){
  if(code==='ALL') return '<span class="rf-code">' + esc(L().allRegions) + '</span>';
  return '<span class="rf-code">' + esc(code) + '</span>' +
         '<span class="rf-name">' + esc(regionName(code)) + '</span>';
}
function buildPreRegionChecks(){
  const src=pendingPool();
  const avail=new Set(src.map(p=>p.region));
  const regions=REGIONS.filter(r=>avail.has(r.code));
  const el=document.getElementById('preRegionChecks');
  el.innerHTML='';
  const regionBtns=[];

  /* The pool may be several regions; the event is still one.

     A card-mode run used to be exclusive here, because a Major is one region's
     tournament and the screen had only one question to ask with. His user asked
     for the free modes' multi-select, so the pool question is the same in every
     mode now and the event gets its own question below - see buildHomeRegion. */
  const singlePick = regions.length<=1;
  // By id, not by position: this screen has two headings now and the first of
  // them is the mode question, so 'the first h4' silently retitled the wrong one.
  const titleEl=document.getElementById('preregionTitle');
  const noteEl=document.getElementById('preregionNote');
  if(titleEl) titleEl.textContent = singlePick ? L().preregionTitleOne : L().preregionTitle;
  if(noteEl) noteEl.textContent = singlePick ? L().preregionNoteOne : L().preregionNote;

  if(singlePick){
    const list = regions.length ? regions : [{code:'ALL'}];
    list.forEach((r,i)=>{
      const b=document.createElement('button');
      b.className='rf-btn rf-plate'+(i===0?' active':'');
      b.dataset.region=r.code;
      b.innerHTML = regionPlateHTML(r.code);
      b.onclick=()=>{
        el.querySelectorAll('.rf-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        document.getElementById('regionWarning').style.display='none';
        updateEraAvailability(); buildHomeRegion();
      };
      el.appendChild(b);
    });
  } else {
    const allRegionsBtn=document.createElement('button');
    allRegionsBtn.className='rf-btn rf-plate'; allRegionsBtn.innerHTML=regionPlateHTML('ALL'); allRegionsBtn.dataset.region='ALL';
    regionBtns.push(allRegionsBtn);
    allRegionsBtn.onclick=()=>{
      const nowActive=!allRegionsBtn.classList.contains('active');
      regionBtns.forEach(b=>b.classList.remove('active'));
      if(nowActive) allRegionsBtn.classList.add('active');
      document.getElementById('regionWarning').style.display='none';
      updateEraAvailability(); buildHomeRegion();
    };
    el.appendChild(allRegionsBtn);
    regions.forEach(r=>{
      const b=document.createElement('button');
      b.className='rf-btn rf-plate'; b.innerHTML=regionPlateHTML(r.code); b.dataset.region=r.code;
      b.onclick=()=>{ b.classList.toggle('active'); allRegionsBtn.classList.remove('active'); document.getElementById('regionWarning').style.display='none'; updateEraAvailability(); buildHomeRegion(); };
      regionBtns.push(b);
      el.appendChild(b);
    });
  }

  // Drawn here as well as at the tail, because the era section below returns
  // early when the pool is one era and the event question is not the era's.
  buildHomeRegion();

  // The era filter only makes sense when the pool actually spans both eras.
  const hasOldAny=src.some(p=>{ const y=getPlayerYear(p); return y!==null && y<2024; });
  const hasNowAny=src.some(p=>{ const y=getPlayerYear(p); return y!==null && y>=2024; });
  const eraBlock=document.getElementById('eraBlock');
  const showEra = hasOldAny && hasNowAny;
  if(eraBlock) eraBlock.style.display = showEra ? '' : 'none';

  const eraEl=document.getElementById('eraChecks');
  eraEl.innerHTML='';
  if(!showEra) return;

  // One button per season present in the pool, plus an "all years" toggle.
  // Years are multi-select; "all years" is exclusive.
  const years=[...new Set(src.map(getPlayerYear).filter(y=>y!==null))].sort();
  const allBtn=document.createElement('button');
  allBtn.className='rf-btn active'; allBtn.textContent=L().eraAll; allBtn.dataset.year='all';
  eraEl.appendChild(allBtn);
  const yearBtns=[allBtn];
  // Labelled by the chapter each year actually was — "Chapter 6", not "2025".
  // The mapping is the one SEASON_LOOT already keeps, so the button and the
  // guns a pick hands you can never drift apart; the year rides along because
  // it is what the cards themselves are stamped with, and the value behind the
  // button stays the year so nothing downstream has to change.
  years.forEach(y=>{
    const era=SEASON_LOOT[y];
    const name=era ? (era[LANG] || era.en) : null;
    const b=document.createElement('button');
    b.className='rf-btn';
    // Только год (его слово 29.09: «пусть будут года, только без чаптеров»); глава — в подсказке.
    b.textContent = String(y);
    if(name) b.title=name;
    b.dataset.year=String(y);
    eraEl.appendChild(b);
    yearBtns.push(b);
  });
  yearBtns.forEach(btn=>{
    btn.onclick=()=>{
      if(btn.disabled) return;
      if(btn.dataset.year==='all'){
        yearBtns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        allBtn.classList.remove('active');
        btn.classList.toggle('active');
        // deselecting the last year falls back to "all years"
        if(!eraEl.querySelector('.rf-btn.active')) allBtn.classList.add('active');
      }
      document.getElementById('eraWarning').style.display='none';
    };
  });
  updateEraAvailability(); buildHomeRegion();
}

// Grey out (and deselect) any era option that would leave zero players for
// the currently-selected region(s) — e.g. picking Oceania shouldn't let you
// also pick an era with no Oceania cards in it, since that'd empty the pool.
// Grey out (and deselect) any season that has no players for the currently
// selected region(s) — picking Oceania shouldn't let you also pick a year with
// no Oceania cards in it, since that would leave the pool empty.
/* The second question: which region's tournament is this.

   Only asked of a card run - a free mode has no regional event to belong to,
   its field is whoever was drafted - and only when the pool spans more than one
   region, because one region answers it by itself. The field, the prize table
   and the LAN allocation all read the answer through ccHomeRegion.

   Redrawn whenever the pool changes, keeping the current answer if it is still
   one of the regions selected. */
function buildHomeRegion(){
  const block=document.getElementById('homeRegionBlock');
  const el=document.getElementById('homeRegionChecks');
  if(!block || !el) return;
  const active=[...document.querySelectorAll('#preRegionChecks .rf-btn.active')];
  const all=active.some(b=>b.dataset.region==='ALL');
  const picked=all ? REGIONS.map(r=>r.code) : active.map(b=>b.dataset.region);
  if(!pendingCards){ block.style.display='none'; preHomeRegion=null; return; }
  /* Every region the set holds, whatever the pool is.

     His question, 17 August: what if I want a European squad and Oceania's
     tournament? The two are independent and the screen was tying them together -
     it only asked which event when the pool spanned more than one region, so
     ticking EU alone silently answered "Europe" for both.

     They are separate questions about separate things: where the squad comes
     from, and whose tournament it turns up to. An EU duo in the Oceanic Major is
     a thing this mode can simulate and somebody will want to see. */
  const src=pendingPool();
  const avail=REGIONS.map(r=>r.code).filter(c=>src.some(p=>p.region===c));
  if(avail.length<2){ block.style.display='none'; preHomeRegion=avail[0]||null; return; }
  block.style.display='';
  // Defaults to the pool when the pool is one region, which is what somebody who
  // ticked one region and read no further would expect.
  if(avail.indexOf(preHomeRegion)<0)
    preHomeRegion = (picked.length===1 ? picked[0] : (picked[0]||avail[0]));
  el.innerHTML='';
  avail.forEach(code=>{
    const b=document.createElement('button');
    b.className='rf-btn rf-plate'+(code===preHomeRegion?' active':'');
    b.dataset.region=code;
    b.innerHTML=regionPlateHTML(code);
    b.onclick=()=>{
      preHomeRegion=code;
      el.querySelectorAll('.rf-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    };
    el.appendChild(b);
  });
}
function updateEraAvailability(){
  const activeRegionBtns=[...document.querySelectorAll('#preRegionChecks .rf-btn.active')];
  const regions = activeRegionBtns.some(b=>b.dataset.region==='ALL') ? [] : activeRegionBtns.map(b=>b.dataset.region);
  const src=pendingPool();
  const pool = regions.length>0 ? src.filter(p=>regions.includes(p.region)) : src;
  const present=new Set(pool.map(getPlayerYear).filter(y=>y!==null));

  const eraEl=document.getElementById('eraChecks');
  if(!eraEl) return;
  const allBtn=eraEl.querySelector('.rf-btn[data-year="all"]');
  eraEl.querySelectorAll('.rf-btn').forEach(btn=>{
    if(btn.dataset.year==='all') return;
    const has=present.has(parseInt(btn.dataset.year,10));
    btn.disabled=!has;
    btn.style.opacity=has?'1':'0.3';
    btn.style.cursor=has?'pointer':'not-allowed';
    btn.title=has?'':L().yearEmptyHint;
    if(!has) btn.classList.remove('active');
  });
  if(allBtn && !eraEl.querySelector('.rf-btn.active')) allBtn.classList.add('active');
}


function confirmRegionsAndStart(){
  const active=[...document.querySelectorAll('#preRegionChecks .rf-btn.active')];
  if(active.length===0){
    document.getElementById('regionWarning').style.display='block';
    document.getElementById('regionWarning').scrollIntoView && document.getElementById('regionWarning').scrollIntoView({block:'center'});
    return;
  }
  const eraBlock=document.getElementById('eraBlock');
  const eraShown = eraBlock && eraBlock.style.display!=='none';
  const eraActive=document.querySelector('#eraChecks .rf-btn.active');
  if(eraShown && !eraActive){
    document.getElementById('eraWarning').style.display='block';
    document.getElementById('eraWarning').scrollIntoView && document.getElementById('eraWarning').scrollIntoView({block:'center'});
    return;
  }
  preSelectedRegions = active.some(b=>b.dataset.region==='ALL') ? [] : active.map(b=>b.dataset.region);
  // And which of them the tournament is. One region answers itself; several were
  // asked about on the screen; a free mode has no event to belong to.
  const homeBtn=document.querySelector('#homeRegionChecks .rf-btn.active');
  preHomeRegion = !pendingCards ? null
    : (homeBtn ? homeBtn.dataset.region : (preHomeRegion || preSelectedRegions[0] || null));
  const yearBtns = eraShown ? [...document.querySelectorAll('#eraChecks .rf-btn.active')] : [];
  preSelectedYears = yearBtns.some(b=>b.dataset.year==='all') ? []
    : yearBtns.map(b=>parseInt(b.dataset.year,10)).filter(y=>!isNaN(y));
  startDraft(pendingSize, pendingMajor);
}

function startDraft(size, major){
  squadSize=size;
  drafted=[];
  draftedWeapons=[]; draftedHeals=[]; roundPlayerPicked=false; roundWeaponPicked=false; roundHealPicked=false;
  chosenLanding=null;
  __shareCtx=null;
  __runRecorded=false;
  const shareBtn=document.getElementById('shareResultBtn'); if(shareBtn) shareBtn.style.display='none';
  document.getElementById('locationPickerBox').style.display='none';
  document.getElementById('goBtn').disabled=true;
  // Everything the team picker puts on screen or leaves in a global, cleared
  // for every run whatever mode it is. A realistic run that was abandoned at the
  // picker — opened, no team taken, back to the menu — used to leave the search
  // box up, its oninput bound to the old list, and teamPickList still holding
  // the previous run's teams; the next draft run then had a live Take button on
  // screen that drafted a whole roster with REALISTIC false, and finished after
  // one loot round because draftedEnough() counts players in draft mode.
  const tpBar=document.getElementById('teamPickBar');
  if(tpBar) tpBar.style.display='none';
  const tpCands=document.getElementById('candidates');
  if(tpCands){ tpCands.style.display=''; tpCands.classList.remove('team-grid'); }
  const tpSearch=document.getElementById('teamPickSearch');
  if(tpSearch){ tpSearch.value=''; tpSearch.oninput=null; }
  currentCandidates=[];
  teamPickList=[];
  CARD_MODE=pendingCards;
  CARD_SET=pendingCardSet;
  // Палитра прошлого драфта не переезжает в следующий: её ставит сам круг (pastDraftPalette).
  document.documentElement.classList.remove('ev-pal', 'ev-classic', 'ev-light');
  // Год начинается с первого круга и с чистой памяти о нём: место на LAN,
  // которое даёт Саммит, и сводка по кругам копятся ТОЛЬКО внутри одного года.
  YEAR_KEY=pendingYear; YEAR_AT=0; YEAR_LEGS=[]; YEAR_SEAT=false;
  // Major 1 and Major 2 are played on different islands — load the matching
  // map art and landing grid before anything reads the zones.
  useLandingSet(CARD_MODE ? CARD_SET : pendingMapSet);
  const src=modePool();
  let base = preSelectedRegions.length>0 ? src.filter(p=>preSelectedRegions.includes(p.region)) : src.slice();
  if(preSelectedYears.length) base = base.filter(p=>preSelectedYears.includes(getPlayerYear(p)));
  pool = base;
  // Belt and braces. chooseMode does not offer the realistic simulation where
  // the data cannot serve it, but a run entered any other way must not strand
  // the player: with no real roster in the pool the picker has nothing to take,
  // roundPlayerPicked never turns true and the run has no way forward at all.
  // Falling back to the draft is the one outcome that still gives a tournament.
  if(REALISTIC && !realTeamsExistFor(pool, size)) REALISTIC=false;
  activeRegion='ALL'; round=0; rerollsLeft=2;
  isMajorMode=!!major;
  applyLobbyTheme();
  // В год бейдж называет ГОД, а не первый его круг: состав драфтится один на
  // весь сезон, и в шапке всё это время должно стоять то, во что играют.
  const modeLabel = YEAR_KEY ? yearName(YEAR_KEY)
    : CARD_MODE ? cardSetName(CARD_SET)
    : (isMajorMode ? 'ALL FNCS' : (size===2?L().modeDuoTitle:(size===3?L().modeTrioTitle:L().modeSquadTitle)));
  const regionsLabel = preSelectedRegions.length>0 ? ' · '+preSelectedRegions.map(c=>regionName(c)).join(', ') : '';
  const eraLabel = preSelectedYears.length ? ' · '+preSelectedYears.slice().sort().join(', ') : '';
  document.getElementById('squadTotal').textContent=size;
  document.getElementById('roundTotal').textContent=size;
  // A realistic run has one roster and `size` loot rounds; the pack label counts
  // rounds, and the reroll is a player-pack control with nothing to reroll here.
  const rb=document.getElementById('rerollBtn');
  if(rb) rb.style.display = REALISTIC ? 'none' : '';
  // Found by id, never by the data-i18n value this then overwrites. Looking the
  // heading up by `h2[data-i18n="packOpenTitle"]` works exactly once: the first
  // realistic run renames the attribute, the selector stops matching, and every
  // later run — draft runs included — silently keeps whichever caption it was
  // last left with.
  const packHead=document.getElementById('packHeadTitle');
  const packDesc=document.getElementById('packHeadDesc');
  if(packHead && packDesc){
    packHead.setAttribute('data-i18n', REALISTIC ? 'teamPickTitle' : 'packOpenTitle');
    packDesc.setAttribute('data-i18n', REALISTIC ? 'teamPickDesc' : 'packOpenDesc');
    applyStaticI18n();
  }
  // After applyStaticI18n, never before it. #topBadge carries data-i18n="badgeMode",
  // so the redraw above overwrites whatever is written here first — the badge
  // read "select mode" on every run, in both modes, instead of the Major and
  // region it is there to name. Same reason goBtn is written down here.
  document.getElementById('topBadge').textContent = modeLabel+regionsLabel+eraLabel;
  document.getElementById('goBtn').textContent = YEAR_KEY
    ? ((LANG==='ru'?'Начать ':'Start ')+yearName(YEAR_KEY))
    : CARD_MODE
    ? ((LANG==='ru'?'Начать ':'Start ')+cardSetName(CARD_SET))
    : (isMajorMode ? (LANG==='ru'?'Начать ALL FNCS':'Start ALL FNCS') : L().goToTournamentBtn);
  updateRerollUI();
  buildRegionFilter();
  renderSlots();
  nextRound();
  show('screen-draft');
  dailyBanner();
}

function updateRerollUI(){
  const btn=document.getElementById('rerollBtn');
  document.getElementById('rerollCount').textContent=rerollsLeft;
  btn.disabled = rerollsLeft<=0;
  btn.style.opacity = rerollsLeft<=0 ? '0.4' : '1';
  btn.style.cursor = rerollsLeft<=0 ? 'not-allowed' : 'pointer';
}

function buildRegionFilter(){
  const el=document.getElementById('regionFilter');
  el.innerHTML='';
  // Card modes are already locked to one region, so the in-draft filter would
  // only offer choices that do nothing. A realistic run has no player pack at
  // all, and the chip handler repaints one: refreshFilterUI calls
  // renderCandidates(currentCandidates), which would put a stale pack with live
  // pick() buttons on top of the team picker.
  if(CARD_MODE || REALISTIC){ el.style.display='none'; activeRegion='ALL'; return; }
  el.style.display='';
  // Same plates as the screen before this one. It is the same seven regions
  // asked about twice, and they were reading as two different controls.
  const all=document.createElement('button');
  all.className='rf-btn rf-plate active'; all.innerHTML=regionPlateHTML('ALL');
  all.onclick=()=>{activeRegion='ALL'; refreshFilterUI(all);};
  el.appendChild(all);
  REGIONS.forEach(r=>{
    const b=document.createElement('button');
    b.className='rf-btn rf-plate'; b.innerHTML=regionPlateHTML(r.code);
    b.onclick=()=>{activeRegion=r.code; refreshFilterUI(b);};
    el.appendChild(b);
  });
  function refreshFilterUI(active){
    el.querySelectorAll('.rf-btn').forEach(x=>x.classList.remove('active'));
    active.classList.add('active');
    renderCandidates(currentCandidates);
  }
}

let currentCandidates=[];

// How sharply a pack leans on rating. The old draft weighted by 1 + rating/100*3,
// which made a 96 only about 1.4x likelier to appear than a 60 — across three
// hundred cards the region's best were effectively unreachable, and a player
// taking the strongest card in every pack still ended up below the field's own
// median. Cutting straight to a top-N slice fixed that but went too far the
// other way: every card offered was elite, so the draft stopped being a risk.
//
// Weighting the whole pool by (OVR - PACK_WEIGHT_FLOOR) ^ PACK_WEIGHT_EXPONENT
// keeps both. Strong cards dominate the deal, but the tail is still there — some
// packs come out thin, and a bad draft is a real outcome rather than something
// the dealer protects you from.
const PACK_SIZE=4;   // cards shown per pack, and candidates the AI weighs per slot
let PACK_WEIGHT_EXPONENT=5, PACK_WEIGHT_FLOOR=45;
// Per set, because the curve has to answer to the shape of the pool it deals
// from. Measured, not guessed: with the 2026 numbers the 2025 pool returned a
// best-of-four of 94.5 and made 8.7% of packs elite from top to bottom, against
// 0.1-0.6% for 2026. These bring it to 90.9 and 0.6%.
//
// Major 2 and Major 3 landed after that was measured and were left on the 2026
// curve, which is the same mistake in the same pool: Europe dealt two mythics or
// more 12.4% of the time and a pack that was 90+ top to bottom 2.8% of the time.
//
// But the Major 1 curve overshot the other way — 22.6% of Europe packs held a
// mythic against 29.5% and 40.3% in the two 2026 sets, so the 2025 season was
// the stingiest thing in the game rather than the richest. Swept five settings
// against what 2026 actually deals; exp 3 / floor 40 is the one that lands
// inside that band on every measure at once:
//
//   Europe            1+ mythic   2+ mythic   all 90+   best of four
//   2026 Major 1        29.5%       3.4%       0.2%        90.7
//   2026 Major 2        40.3%       6.5%       0.6%        91.7
//   2025 exp2 floor35   22.6%       1.8%       0.1%        89.2
//   2025 exp3 floor40   31.9%       3.2%       0.2%        91.0   <- this
//   2025 exp5 floor45   53.0%      13.2%       3.0%        93.5
//
// So a mythic turns up about as often as it does in 2026, and the 95/95/96 pack
// is as rare. tools/check-pack-odds.js is where those numbers come from.
const P2025_PACK={exp:3, floor:40};
const PACK_WEIGHTS={ t1:P2025_PACK, t2:P2025_PACK, t3:P2025_PACK };
function packWeightFor(p){
  const c=PACK_WEIGHTS[p.cardSet];
  const exp=c?c.exp:PACK_WEIGHT_EXPONENT, floor=c?c.floor:PACK_WEIGHT_FLOOR;
  return Math.pow(Math.max(1, attrsFor(p).ovr - floor), exp);
}
/* КАРТОЧКИ ФОРМЫ В ПАКЕ (как TOTW/TOTS в ФИФЕ). Тот же человек, что базовая карточка, с прибавкой за выступление
   (YEAR_RATING.form, см. yearRatingPass): чемпион гранд-финала, лучшая по килам команда топ-10 финала, призёры ЛАНов
   и World Cup. Вес в паке — обычный вес по рейтингу × FORM_PACK_RATE: подобрано под «спецкарточка примерно в каждом
   десятом паке» (tools/check-fifa-rating.js меряет долю). Взятая карточка формы убирает человека из пула по нику,
   как любая другая (pick), — базу после неё не предложат. */
const FORM_PACK_RATE=0.2;
function ccIsFormCard(p){ return !!(p && p.form && typeof p.form==='object' && p.form.base!=null); }
const CC_FORM_CACHE=new WeakMap();
function ccFormCardsFor(src){
  const F=(typeof YEAR_RATING!=='undefined' && YEAR_RATING && YEAR_RATING.form) || null;
  if(!F) return [];
  const out=[];
  src.forEach(p=>{
    const f=p && p.id!=null ? F[p.id] : null;
    if(!f || p.form) return;
    let c=CC_FORM_CACHE.get(p);
    if(!c || c.form.base!==p.rating){
      const r=Math.min(f.cap||99, p.rating+f.boost);
      if(r<=p.rating) return;
      c={...p, rating:r, _targetOvr:r, rarity:rarityForRating(r), _attrs:null,
         form:{event:f.event, place:f.place, why:f.why, boost:r-p.rating, base:p.rating}};
      CC_FORM_CACHE.set(p, c);
    }
    out.push(c);
  });
  return out;
}
function generatePack(){
  const remaining=squadSize-drafted.length;
  if(remaining<=0) return [];
  /* Which regions the packs may offer.

     A squad used to have to come from one region - real duos never mix EU with
     NAC - so once the first card was in, later packs only offered that region.
     His user asked for the free modes' multi-select, so the answer is now
     whatever was ticked before the draft: one region behaves exactly as it did,
     several offer all of them, and every region ticked - which is what the ALL
     plate means, and what leaves preSelectedRegions empty - offers the lot. The
     tournament itself is still one region's, see ccHomeRegion. */
  let src=pool;
  if(CARD_MODE && drafted.length>0 && preSelectedRegions && preSelectedRegions.length){
    const same=pool.filter(p=>preSelectedRegions.indexOf(p.region)>=0);
    if(same.length>0) src=same;
  }
  // Grey commons stay in the pool — the lobby still fills with them — but they are
  // not offered to the player. Kept as a fallback only if a region has too few
  // cards above common to build a pack of four.
  const aboveCommon = src.filter(p=>shownRarity(p)!=='common');
  if(aboveCommon.length>=4) src = aboveCommon;
  /* Драфт дня — без зелёных (его слово 24.10: «daily draft я бы зелёные карточки убрал и сделал бы как-то интересней»).
     Год дня случайный, и паки из всего года сыпали игроков 60–69: четыре одинаковые зелёные карточки подряд. В паке дня
     редкий (70+) и выше; в поле турнира зелёные остаются. Мало синих в году — пак как раньше. */
  if(typeof DAILY!=='undefined' && DAILY){
    const aboveGreen = src.filter(p=>{ const r=shownRarity(p); return r!=='common' && r!=='uncommon'; });
    if(aboveGreen.length>=4) src = aboveGreen;
  }

  // You draft before anybody else, so the deal leans hard on rating — but across
  // the whole pool, not a protected slice of it, so a thin pack can still happen.
  let weighted = src.map(p=>({p, w: packWeightFor(p)}));
  // Карточки формы (как TOTW) — в паке вместе с обычными, но редко; базу и её форму один пак не даёт (hKey ниже).
  if(CARD_MODE) ccFormCardsFor(src).forEach(c=>weighted.push({p:c, w:packWeightFor(c)*FORM_PACK_RATE}));
  let picks=[];

  // No reserved slot for a real partner. One existed briefly, for a field that
  // no longer exists: when a qualifying Major restored every real roster, all 49
  // opponents carried full teammate chemistry and the player was the only squad
  // that could have none, so a pack held one of their partners. Now that only
  // the teams holding a seat are kept together, two to six opponents carry
  // chemistry rather than all of them, and a guaranteed partner would be the
  // thumb on the scale it was introduced to remove. Chemistry is back to being
  // something you notice in a pack and take, or miss.
  for(let i=picks.length;i<PACK_SIZE && weighted.length>0;i++){
    const total=weighted.reduce((s,x)=>s+x.w,0);
    let r=Math.random()*total, idx=0;
    for(;idx<weighted.length;idx++){ r-=weighted[idx].w; if(r<=0) break; }
    idx=Math.min(idx,weighted.length-1);
    const picked=weighted[idx].p;
    picks.push(picked);
    weighted=weighted.filter(x=>hKey(x.p)!==hKey(picked));
  }
  return picks;
}

function nextRound(){
  round++;
  document.getElementById('roundNum').textContent=round;
  if(round>squadSize) return;
  roundPlayerPicked=false; roundWeaponPicked=false; roundHealPicked=false;
  if(REALISTIC){
    // The roster is taken once, in the first round; the rounds after it are
    // loot only, so the player half of them is already settled and the squad
    // that was taken stays on screen instead of the picker coming back.
    if(drafted.length){
      roundPlayerPicked=true;
      document.getElementById('teamPickBar').style.display='none';
      renderPicked('candidates', drafted.map(p=>pickedPlayerCard(p)));
    } else {
      renderTeamPicker();
    }
  } else {
    currentCandidates=dailyRoll('p', generatePack);
    renderCandidates(currentCandidates);
  }
  currentWeaponOptions=dailyRoll('w', generateWeaponPack);
  renderItemPack(currentWeaponOptions, 'weaponCandidates', pickWeapon);
  updateLootPoolNote();
  currentHealOptions=dailyRoll('h', generateHealPack);
  renderItemPack(currentHealOptions, 'healCandidates', pickHeal);
  updateRerollUI();
}

function maybeAdvanceRound(){
  if(!roundPlayerPicked || !roundWeaponPicked || !roundHealPicked) return;
  if(draftedEnough()){
    // Last round resolved: the pack areas stop being packs and become the
    // finished squad and its loadout, all on screen at once.
    renderDraftResult();
    const rb=document.getElementById('rerollBtn'); rb.disabled=true; rb.style.opacity='0.4'; rb.style.cursor='not-allowed';
    // The landing spot is picked later, once the rest of the lobby is known
    // (right on the results screen, same as the FNCS Major Finals flow) —
    // confirming the squad here just unlocks the "enter tournament" button.
    chosenLanding=null;
    document.getElementById('locationPickerBox').style.display='none';
    document.getElementById('goBtn').disabled=false;
  } else {
    nextRound();
  }
}

let chosenLanding=null;

// Fixed positions (percent of the map image) matching where each name is labeled on the custom map art.
const POI_COORDS=[
  {x:32, y:12},  // Lifty Lodge
  {x:59, y:20},  // Latte Landing
  {x:76, y:29},  // Wonkeeland
  {x:16, y:33},  // Chopped Shop
  {x:41, y:34},  // The Battlewoods
  {x:59, y:47},  // Frosted Flats
  {x:23, y:51},  // Calamari Canyon
  {x:79, y:54},  // Golden Grove
  {x:44, y:61},  // Sinister Strip
  {x:66, y:69},  // Shaken Sanctuary
  {x:21, y:70},  // Heatwave Harbor
  {x:44, y:80},  // Sunken Shores
  {x:70, y:84},  // Cluster Coast
];

// All possible landing rectangles (irregular, varied sizes, scattered across the island).
// Each Major is played on its own island, so the map art and the landing grid
// both switch with the mode. ALL_LANDING_ZONES keeps its identity (teams hold
// references to individual zone objects) — only its contents are swapped.
const MAP_ART={
  m1:"art/map-m1.jpg",
  m2:"art/map-m2.jpg",
  // Остров сорок второго сезона — его картинка, 23 августа.
  s42:"art/map-s42.jpg",
  // Тот же остров, но сеткой на сотню — под соло, см. ZONE_SETS.s42solo.
  s42solo:"art/map-s42.jpg",
  // Остров мини-сезона S43 (Treasure Hunters): тайлы fortnite.gg, tools/build-s43-island.js.
  s43:"art/map-s43-hd.jpg",   // 19.11: плитки fortnite.gg z4, 2368 px (tools/build-fgg-map-art.js), было 1000
  // Nitemare Island: FNCS Solo Reload ноября 2026, tools/build-reload-nitemare.js.
  r5:"art/map-r5-hd.jpg",     // 19.11: плитки fortnite.gg z4, 3264 px, было 1000
  // Мини-Venture: мобильный Reload 2026, тайлы fortnite.gg (blitz5), tools/build-reload-venture.js.
  r6:"art/map-r6-hd.jpg",     // 19.11: z4, 1984 px, было 1000
  // Chapter 5, 2024: карты eucompetitive.com (ch5s1map … ch5s4map), сжаты в JPEG.
  f1:"art/map-f1.jpg",
  f2:"art/map-f2.jpg",
  f3:"art/map-f3.jpg",
  f4:"art/map-f4.jpg",
  // Chapter 4, 2023: карты eucompetitive.com (ch4s1map … ch4s4map), сжаты в JPEG (tools/png-to-jpg.js).
  e1:"art/map-e1.jpg",
  e2:"art/map-e2.jpg",
  e3:"art/map-e3.jpg",
  e4:"art/map-e4.jpg",
  // Chapter 3, 2022: карты eucompetitive.com (ch3s1map … ch3s3map; у C3S4 — остров C3S3), JPEG.
  k1:"art/map-k1.jpg",
  k2:"art/map-k2.jpg",
  k3:"art/map-k3.jpg",
  k4:"art/map-k4.jpg",
  // Chapter 2, 2021: карты eucompetitive.com (ch2s5map … ch2s8map), JPEG.
  j1:"art/map-j1.jpg",
  j2:"art/map-j2.jpg",
  j3:"art/map-j3.jpg",
  j4:"art/map-j4.jpg",
  // 2019: карты вики (tools/build-mx-islands.js).
  h1:"art/map-h1.jpg", g5:"art/map-g5.jpg", g6:"art/map-g6.jpg", g7:"art/map-g7.jpg",
  h3:"art/map-h3.jpg",
  h4:"art/map-h4.jpg",
  i1:"art/map-i1.jpg",
  i2:"art/map-i2.jpg",
  i3:"art/map-i3.jpg",
  t1:"art/map-t1.jpg",
  // The islands Majors 2 and 3 were actually played on. Map and grid come from
  // the same place -- eucompetitive.com's own drop map for that Major -- so the
  // rectangles need no fitting: they are percentages of this exact picture.
  t2:"art/map-t2.jpg",
  t3:"art/map-t3.jpg",
  t4:"art/map-t4.jpg",   // Chapter 6 Season 4: карта eucompetitive ch6s4map, остров Лиона
  // Reload is not the Battle Royale island, and the circuit played two of them:
  // cups 1 and 2 on the green island, cups 3 and 4 on the frozen one. These are
  // the season maps themselves — no drop boxes, no team names printed on them —
  // because the app draws its own lobby over the map and a picture that already
  // has somebody else's duo on it is a picture of another tournament.
  r1:"art/map-reload-a.jpg",
  r2:"art/map-reload-a.jpg",
  r3:"art/map-reload-b.jpg",
  r4:"art/map-reload-b.jpg"
};
const MAP_ASPECT={m1:'1100/1142', m2:'1100/970', s42:'921/843', s42solo:'921/843', s43:'1/1', r5:'1/1', r6:'1/1', t1:'1701/1714',
                  f1:'1600/1600', f2:'1600/1600', f3:'1600/1600', f4:'1600/1600',
                  e1:'1600/1600', e2:'1600/1600', e3:'1600/1600', e4:'1600/1600',
                  k1:'1600/1600', k2:'1600/1600', k3:'1600/1600', k4:'1600/1600',
                  j1:'1600/1600', j2:'1600/1600', j3:'1600/1600', j4:'1600/1600',
                  h1:'2048/2048', g5:'2048/2048', g6:'2048/2048', g7:'2048/2048', h3:'2048/2048', h4:'2048/2048', i1:'2048/2048', i2:'2048/2048', i3:'2048/2048',
                  t2:'1600/1600', t3:'1600/1600', t4:'1600/1600',
                  r1:'1062/776', r2:'1062/776', r3:'1034/770', r4:'1034/770'};
// ---------- Real drop-spot data (Kinch Premium competitive evals) ----------
// Zone quality used to be guessed from the rectangle: bigger box = more points.
// These are the published numbers for the seasons the two islands are from —
// C7S1 (Duos VCC, OCE) for m1 and C7S3 (Eval, EU) for m2 — matched to each
// rectangle by overlaying the app map on the source map and taking the POI the
// rectangle covers. The rectangles themselves are untouched; this array is
// index-parallel to ZONE_SETS.
//   r     — Kinch Overall Rating for the spot that season
//   loot  — items the spot yields
//   teams — average number of teams that actually drop there (contest rate)
//   surv  — share of drops that survive the landing
// A handful of rectangles sit between two neighbouring POIs; those took the
// nearer one, so their numbers can be a spot off. Everything else is a direct hit.
const ZONE_STATS={
  /* S42 — СЧИТАННЫЙ ЛУТ, а не глазомер.

     Правка: «забалансить не по квадрату размера, а по
     луту». До неё здесь стоял рейтинг с картинки — именованные точки выше
     безымянных, центр дороже краёв, — потому что у сезона не было ни
     дроп-карты с числами, ни лут-переписи. Она нашлась там же, где для
     островов 2025: интерактивная карта вики (Map:Chapter 7: Season 4 (42.00),
     39 точек с координатами на кадре 2048x2048) плюс страница каждой локации
     со счётом сундуков и ящиков. Считано tools/build-2025-zone-loot.js.

     Числа — сумма сундуков и ящиков с патронами внутри прямоугольника.
     Флор-лут и ящики с продуктами не считаются: их заполняют не везде, и
     учитывать их значило бы ранжировать локацию по тому, насколько подробно
     её описали. Ноль у зоны — не пробел, а пустое поле между локациями. */
  r6:[{r:17,loot:17,chests:7,rare:1,ammo:7},{r:12,loot:12,chests:6,rare:1,ammo:3},{r:8,loot:8,chests:3,rare:1,ammo:2},{r:5,loot:5,chests:3,rare:0,ammo:2},{r:10,loot:10,chests:5,rare:1,ammo:2},{r:10,loot:10,chests:8,rare:0,ammo:2},{r:6,loot:6,chests:5,rare:0,ammo:1},{r:28,loot:28,chests:12,rare:2,ammo:10},{r:19,loot:19,chests:14,rare:0,ammo:5},{r:22,loot:22,chests:12,rare:1,ammo:7},{r:10,loot:10,chests:3,rare:1,ammo:4},{r:8,loot:8,chests:4,rare:1,ammo:1},{r:12,loot:12,chests:6,rare:0,ammo:6},{r:5,loot:5,chests:3,rare:0,ammo:2},{r:19,loot:19,chests:13,rare:0,ammo:6},{r:5,loot:5,chests:3,rare:0,ammo:2},{r:12,loot:12,chests:5,rare:0,ammo:7},{r:12,loot:12,chests:6,rare:1,ammo:3},{r:11,loot:11,chests:6,rare:1,ammo:2},{r:6,loot:6,chests:2,rare:1,ammo:1},{r:6,loot:6,chests:5,rare:0,ammo:1},{r:25,loot:25,chests:8,rare:2,ammo:11},{r:27,loot:27,chests:10,rare:2,ammo:11},{r:12,loot:12,chests:3,rare:1,ammo:6}],/*@@R6-STATS@@*/
  r5:[{r:15,loot:15,chests:9,rare:0,ammo:6},{r:7,loot:7,chests:7,rare:0,ammo:0},{r:65,loot:65,chests:27,rare:5,ammo:23},{r:18,loot:18,chests:9,rare:0,ammo:9},{r:21,loot:21,chests:9,rare:0,ammo:12},{r:40,loot:40,chests:25,rare:0,ammo:15},{r:48,loot:48,chests:19,rare:1,ammo:26},{r:40,loot:40,chests:12,rare:1,ammo:25},{r:23,loot:23,chests:6,rare:2,ammo:11},{r:26,loot:26,chests:13,rare:0,ammo:13},{r:22,loot:22,chests:10,rare:1,ammo:9},{r:18,loot:18,chests:11,rare:0,ammo:7},{r:6,loot:6,chests:2,rare:0,ammo:4},{r:49,loot:49,chests:17,rare:3,ammo:23},{r:21,loot:21,chests:11,rare:0,ammo:10},{r:35,loot:35,chests:18,rare:1,ammo:14},{r:16,loot:16,chests:11,rare:0,ammo:5},{r:23,loot:23,chests:8,rare:0,ammo:15},{r:31,loot:31,chests:10,rare:0,ammo:21},{r:17,loot:17,chests:8,rare:0,ammo:9},{r:22,loot:22,chests:10,rare:1,ammo:9},{r:39,loot:39,chests:9,rare:0,ammo:30},{r:45,loot:45,chests:10,rare:0,ammo:35},{r:67,loot:67,chests:13,rare:1,ammo:51},{r:10,loot:10,chests:6,rare:0,ammo:4},{r:42,loot:42,chests:15,rare:0,ammo:27},{r:25,loot:25,chests:11,rare:0,ammo:14},{r:37,loot:37,chests:12,rare:0,ammo:25},{r:41,loot:41,chests:13,rare:0,ammo:28},{r:69,loot:69,chests:27,rare:1,ammo:39}],/*@@R5-STATS@@*/
  s43:[{r:130,loot:130,chests:55,rare:5,ammo:60},{r:150,loot:150,chests:61,rare:6,ammo:71},{r:93,loot:93,chests:36,rare:4,ammo:45},{r:12,loot:12,chests:7,rare:0,ammo:5},{r:38,loot:38,chests:23,rare:0,ammo:15},{r:75,loot:75,chests:29,rare:0,ammo:46},{r:56,loot:56,chests:24,rare:0,ammo:32},{r:43,loot:43,chests:19,rare:0,ammo:24},{r:79,loot:79,chests:38,rare:0,ammo:41},{r:62,loot:62,chests:30,rare:0,ammo:32},{r:14,loot:14,chests:7,rare:0,ammo:7},{r:78,loot:78,chests:43,rare:0,ammo:35},{r:62,loot:62,chests:27,rare:4,ammo:23},{r:8,loot:8,chests:5,rare:0,ammo:3},{r:85,loot:85,chests:41,rare:4,ammo:32},{r:18,loot:18,chests:10,rare:0,ammo:8},{r:88,loot:88,chests:34,rare:4,ammo:42},{r:48,loot:48,chests:30,rare:0,ammo:18},{r:14,loot:14,chests:8,rare:0,ammo:6},{r:55,loot:55,chests:27,rare:0,ammo:28},{r:34,loot:34,chests:15,rare:0,ammo:19},{r:2,loot:2,chests:1,rare:0,ammo:1},{r:27,loot:27,chests:18,rare:0,ammo:9},{r:55,loot:55,chests:33,rare:0,ammo:22},{r:112,loot:112,chests:57,rare:4,ammo:43},{r:11,loot:11,chests:7,rare:0,ammo:4},{r:12,loot:12,chests:6,rare:0,ammo:6},{r:14,loot:14,chests:10,rare:0,ammo:4}],/*@@S43-STATS@@*/
  s42:[{r:100,loot:100,chests:62,rare:0,ammo:42},{r:67,loot:67,chests:27,rare:0,ammo:25},{r:65,loot:65,chests:44,rare:0,ammo:34},{r:0,loot:0,chests:27,rare:0,ammo:16},{r:130,loot:130,chests:117,rare:4,ammo:83},{r:0,loot:0,chests:68,rare:0,ammo:9},{r:0,loot:0,chests:65,rare:0,ammo:31},{r:89,loot:89,chests:56,rare:1,ammo:40},{r:0,loot:0,chests:52,rare:3,ammo:44},{r:73,loot:73,chests:60,rare:0,ammo:46},{r:83,loot:83,chests:93,rare:0,ammo:44},{r:57,loot:57,chests:53,rare:0,ammo:31},{r:62,loot:62,chests:43,rare:2,ammo:48},{r:19,loot:19,chests:18,rare:2,ammo:7},{r:0,loot:0,chests:34,rare:0,ammo:21},{r:0,loot:0,chests:2,rare:0,ammo:2},{r:12,loot:12,chests:5,rare:0,ammo:4},{r:0,loot:0,chests:26,rare:0,ammo:6},{r:0,loot:0,chests:8,rare:0,ammo:4},{r:0,loot:0,chests:12,rare:0,ammo:4},{r:0,loot:0,chests:0,rare:0,ammo:0},{r:0,loot:0,chests:1,rare:0,ammo:0},{r:0,loot:0,chests:11,rare:2,ammo:7},{r:12,loot:12,chests:6,rare:0,ammo:6},{r:16,loot:16,chests:15,rare:0,ammo:10},{r:19,loot:19,chests:18,rare:0,ammo:9},{r:0,loot:0,chests:11,rare:0,ammo:5},{r:0,loot:0,chests:2,rare:0,ammo:0},{r:15,loot:15,chests:9,rare:0,ammo:6},{r:0,loot:0,chests:12,rare:0,ammo:2},{r:0,loot:0,chests:13,rare:0,ammo:3},{r:0,loot:0,chests:4,rare:0,ammo:4},{r:0,loot:0,chests:11,rare:0,ammo:7}],
  /* Соло-сотня — тот же считанный лут, разложенный по площади.

     Метод «в какой клетке стоит точка локации» работает на крупной сетке и
     разваливается на мелкой: локация у вики это ТОЧКА, и из ста клеток лут
     достался бы тринадцати, а восемьдесят семь стали бы одинаково пустыми.
     Поэтому footprint'ами берутся сами зоны s42 — их и рисовали вокруг
     локаций, — и клетка получает долю лута зоны по площади перекрытия.
     Выдуманных коэффициентов тут нет ни одного: только геометрия и те же
     счётные сундуки. Стало 65 клеток с лутом из ста вместо тринадцати. */
  s42solo:[{r:16,loot:16,chests:9,rare:0,ammo:7},{r:8,loot:8,chests:0,rare:0,ammo:0},{r:0,loot:0,chests:2,rare:0,ammo:0},{r:12,loot:12,chests:24,rare:0,ammo:13},{r:25,loot:25,chests:3,rare:0,ammo:2},{r:14,loot:14,chests:8,rare:0,ammo:7},{r:16,loot:16,chests:5,rare:0,ammo:1},{r:8,loot:8,chests:19,rare:2,ammo:10},{r:7,loot:7,chests:5,rare:0,ammo:1},{r:4,loot:4,chests:3,rare:0,ammo:0},{r:10,loot:10,chests:17,rare:0,ammo:9},{r:2,loot:2,chests:7,rare:0,ammo:2},{r:1,loot:1,chests:7,rare:0,ammo:3},{r:3,loot:3,chests:19,rare:0,ammo:15},{r:18,loot:18,chests:5,rare:0,ammo:3},{r:0,loot:0,chests:11,rare:0,ammo:6},{r:14,loot:14,chests:23,rare:0,ammo:21},{r:0,loot:0,chests:2,rare:0,ammo:0},{r:8,loot:8,chests:1,rare:0,ammo:1},{r:4,loot:4,chests:8,rare:0,ammo:2},{r:0,loot:0,chests:10,rare:0,ammo:3},{r:15,loot:15,chests:5,rare:0,ammo:1},{r:0,loot:0,chests:6,rare:0,ammo:3},{r:5,loot:5,chests:10,rare:0,ammo:4},{r:5,loot:5,chests:8,rare:0,ammo:5},{r:3,loot:3,chests:11,rare:0,ammo:4},{r:0,loot:0,chests:9,rare:0,ammo:8},{r:3,loot:3,chests:10,rare:0,ammo:6},{r:1,loot:1,chests:4,rare:0,ammo:1},{r:10,loot:10,chests:19,rare:0,ammo:12},{r:3,loot:3,chests:6,rare:0,ammo:3},{r:4,loot:4,chests:16,rare:0,ammo:5},{r:0,loot:0,chests:12,rare:0,ammo:7},{r:0,loot:0,chests:6,rare:0,ammo:0},{r:5,loot:5,chests:11,rare:0,ammo:5},{r:0,loot:0,chests:0,rare:0,ammo:0},{r:0,loot:0,chests:5,rare:0,ammo:4},{r:0,loot:0,chests:10,rare:0,ammo:2},{r:1,loot:1,chests:6,rare:0,ammo:4},{r:0,loot:0,chests:7,rare:0,ammo:0},{r:0,loot:0,chests:8,rare:0,ammo:0},{r:0,loot:0,chests:23,rare:1,ammo:6},{r:0,loot:0,chests:9,rare:0,ammo:3},{r:0,loot:0,chests:12,rare:0,ammo:1},{r:0,loot:0,chests:6,rare:0,ammo:4},{r:29,loot:29,chests:6,rare:0,ammo:2},{r:0,loot:0,chests:0,rare:0,ammo:0},{r:0,loot:0,chests:11,rare:0,ammo:4},{r:0,loot:0,chests:10,rare:0,ammo:5},{r:0,loot:0,chests:11,rare:0,ammo:9},{r:0,loot:0,chests:3,rare:0,ammo:1},{r:1,loot:1,chests:6,rare:0,ammo:1},{r:0,loot:0,chests:13,rare:0,ammo:0},{r:12,loot:12,chests:10,rare:1,ammo:4},{r:0,loot:0,chests:7,rare:0,ammo:3},{r:5,loot:5,chests:0,rare:0,ammo:0},{r:0,loot:0,chests:7,rare:0,ammo:2},{r:8,loot:8,chests:22,rare:0,ammo:17},{r:0,loot:0,chests:7,rare:0,ammo:6},{r:7,loot:7,chests:1,rare:0,ammo:1},{r:0,loot:0,chests:6,rare:0,ammo:3},{r:1,loot:1,chests:6,rare:0,ammo:4},{r:5,loot:5,chests:1,rare:0,ammo:1},{r:20,loot:20,chests:27,rare:0,ammo:23},{r:0,loot:0,chests:12,rare:2,ammo:9},{r:0,loot:0,chests:6,rare:0,ammo:5},{r:0,loot:0,chests:1,rare:0,ammo:0},{r:0,loot:0,chests:3,rare:0,ammo:2},{r:3,loot:3,chests:1,rare:0,ammo:0},{r:12,loot:12,chests:9,rare:0,ammo:2},{r:16,loot:16,chests:16,rare:0,ammo:7},{r:7,loot:7,chests:16,rare:0,ammo:13},{r:9,loot:9,chests:7,rare:0,ammo:8},{r:11,loot:11,chests:14,rare:0,ammo:5},{r:10,loot:10,chests:10,rare:0,ammo:9},{r:0,loot:0,chests:8,rare:0,ammo:4},{r:17,loot:17,chests:27,rare:0,ammo:15},{r:1,loot:1,chests:0,rare:0,ammo:0},{r:0,loot:0,chests:5,rare:0,ammo:0},{r:6,loot:6,chests:1,rare:0,ammo:0},{r:9,loot:9,chests:10,rare:0,ammo:7},{r:4,loot:4,chests:1,rare:0,ammo:0},{r:3,loot:3,chests:13,rare:0,ammo:4},{r:3,loot:3,chests:8,rare:0,ammo:7},{r:4,loot:4,chests:13,rare:0,ammo:8},{r:4,loot:4,chests:5,rare:1,ammo:4},{r:4,loot:4,chests:6,rare:0,ammo:1},{r:8,loot:8,chests:4,rare:0,ammo:0},{r:7,loot:7,chests:5,rare:0,ammo:6},{r:9,loot:9,chests:25,rare:0,ammo:27},{r:8,loot:8,chests:11,rare:0,ammo:7},{r:0,loot:0,chests:3,rare:1,ammo:1},{r:2,loot:2,chests:0,rare:0,ammo:0},{r:0,loot:0,chests:0,rare:0,ammo:1},{r:6,loot:6,chests:4,rare:0,ammo:2},{r:6,loot:6,chests:0,rare:0,ammo:0},{r:5,loot:5,chests:0,rare:0,ammo:0},{r:3,loot:3,chests:1,rare:0,ammo:2},{r:2,loot:2,chests:0,rare:0,ammo:0},{r:4,loot:4,chests:0,rare:0,ammo:0}],
  // The three 2025 islands, rated by the loot the wiki counts inside each
  // rectangle: every named location and landmark on the patch that Major was
  // played on, placed by its real map coordinates, scored on chests plus ammo
  // boxes. Written by tools/build-2025-zone-loot.js. A rectangle with no counted
  // POI in it stays at zero and comes out as a one-point spot, which is what an
  // empty field is worth. There is no "teams" or "surv" here: those come from
  // competitive evals that exist for the 2026 islands and not for these, and
  // useLandingSet already defaults the contest rate to 1 rather than inventing one.
  /* Острова 2024-го (Chapter 5) — лут вики по коробкам дроп-карт: карты патчей 28.30 / 29.40 /
     30.30 / 31.00 (выходные финалов и Форт-Уэрта), сундуки и ящики с инфобоксов локаций.
     Написано tools/build-2025-zone-loot.js f1 f2 f3 f4 (21 сентября 2026). */
  f1:[{r:37,loot:37,chests:18,ammo:19},{r:4,loot:4,chests:2,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:48,loot:48,chests:18,ammo:30},{r:34,loot:34,chests:10,ammo:24},{r:35,loot:35,chests:20,ammo:15},{r:45,loot:45,chests:30,ammo:15},{r:117,loot:117,chests:28,ammo:89},{r:34,loot:34,chests:21,ammo:13},{r:10,loot:10,chests:6,ammo:4},{r:31,loot:31,chests:15,ammo:16},{r:29,loot:29,chests:13,ammo:16},{r:18,loot:18,chests:10,ammo:8},{r:94,loot:94,chests:38,ammo:56},{r:97,loot:97,chests:32,ammo:65},{r:222,loot:222,chests:52,ammo:170},{r:27,loot:27,chests:13,ammo:14},{r:58,loot:58,chests:25,ammo:33},{r:44,loot:44,chests:25,ammo:19},{r:31,loot:31,chests:18,ammo:13},{r:29,loot:29,chests:16,ammo:13},{r:22,loot:22,chests:10,ammo:12},{r:26,loot:26,chests:11,ammo:15},{r:7,loot:7,chests:4,ammo:3},{r:55,loot:55,chests:30,ammo:25},{r:0,loot:0,chests:0,ammo:0},{r:34,loot:34,chests:13,ammo:21},{r:38,loot:38,chests:14,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:84,loot:84,chests:26,ammo:58},{r:157,loot:157,chests:81,ammo:76},{r:111,loot:111,chests:46,ammo:65},{r:39,loot:39,chests:18,ammo:21},{r:151,loot:151,chests:69,ammo:82},{r:50,loot:50,chests:22,ammo:28},{r:0,loot:0,chests:0,ammo:0},{r:50,loot:50,chests:16,ammo:34},{r:15,loot:15,chests:8,ammo:7},{r:44,loot:44,chests:22,ammo:22}],
  f2:[{r:18,loot:18,chests:12,ammo:6},{r:0,loot:0,chests:0,ammo:0},{r:48,loot:48,chests:18,ammo:30},{r:34,loot:34,chests:10,ammo:24},{r:35,loot:35,chests:20,ammo:15},{r:45,loot:45,chests:30,ammo:15},{r:117,loot:117,chests:28,ammo:89},{r:34,loot:34,chests:21,ammo:13},{r:16,loot:16,chests:8,ammo:8},{r:0,loot:0,chests:0,ammo:0},{r:72,loot:72,chests:45,ammo:27},{r:3,loot:3,chests:2,ammo:1},{r:18,loot:18,chests:10,ammo:8},{r:29,loot:29,chests:13,ammo:16},{r:15,loot:15,chests:7,ammo:8},{r:65,loot:65,chests:36,ammo:29},{r:97,loot:97,chests:32,ammo:65},{r:7,loot:7,chests:6,ammo:1},{r:222,loot:222,chests:52,ammo:170},{r:31,loot:31,chests:13,ammo:18},{r:52,loot:52,chests:24,ammo:28},{r:24,loot:24,chests:14,ammo:10},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:18,loot:18,chests:11,ammo:7},{r:55,loot:55,chests:30,ammo:25},{r:29,loot:29,chests:16,ammo:13},{r:118,loot:118,chests:50,ammo:68},{r:0,loot:0,chests:0,ammo:0},{r:31,loot:31,chests:14,ammo:17},{r:95,loot:95,chests:44,ammo:51},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:6,loot:6,chests:2,ammo:4},{r:50,loot:50,chests:22,ammo:28},{r:39,loot:39,chests:18,ammo:21},{r:50,loot:50,chests:16,ammo:34},{r:0,loot:0,chests:0,ammo:0},{r:44,loot:44,chests:22,ammo:22},{r:64,loot:64,chests:31,ammo:33}],
  f3:[{r:18,loot:18,chests:12,ammo:6},{r:0,loot:0,chests:0,ammo:0},{r:48,loot:48,chests:18,ammo:30},{r:34,loot:34,chests:10,ammo:24},{r:45,loot:45,chests:30,ammo:15},{r:117,loot:117,chests:28,ammo:89},{r:72,loot:72,chests:45,ammo:27},{r:34,loot:34,chests:21,ammo:13},{r:31,loot:31,chests:15,ammo:16},{r:18,loot:18,chests:10,ammo:8},{r:29,loot:29,chests:13,ammo:16},{r:65,loot:65,chests:36,ammo:29},{r:97,loot:97,chests:32,ammo:65},{r:222,loot:222,chests:52,ammo:170},{r:7,loot:7,chests:6,ammo:1},{r:5,loot:5,chests:2,ammo:3},{r:52,loot:52,chests:24,ammo:28},{r:0,loot:0,chests:0,ammo:0},{r:24,loot:24,chests:14,ammo:10},{r:24,loot:24,chests:14,ammo:10},{r:29,loot:29,chests:16,ammo:13},{r:49,loot:49,chests:31,ammo:18},{r:0,loot:0,chests:0,ammo:0},{r:55,loot:55,chests:30,ammo:25},{r:118,loot:118,chests:50,ammo:68},{r:31,loot:31,chests:14,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:95,loot:95,chests:44,ammo:51},{r:46,loot:46,chests:25,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:40,loot:40,chests:16,ammo:24},{r:36,loot:36,chests:15,ammo:21},{r:78,loot:78,chests:36,ammo:42},{r:7,loot:7,chests:4,ammo:3},{r:44,loot:44,chests:22,ammo:22},{r:49,loot:49,chests:23,ammo:26},{r:104,loot:104,chests:25,ammo:79},{r:67,loot:67,chests:37,ammo:30},{r:29,loot:29,chests:11,ammo:18},{r:39,loot:39,chests:20,ammo:19}],
  f4:[{r:37,loot:37,chests:18,ammo:19},{r:36,loot:36,chests:15,ammo:21},{r:34,loot:34,chests:10,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:61,loot:61,chests:37,ammo:24},{r:96,loot:96,chests:51,ammo:45},{r:0,loot:0,chests:0,ammo:0},{r:187,loot:187,chests:81,ammo:106},{r:0,loot:0,chests:0,ammo:0},{r:31,loot:31,chests:15,ammo:16},{r:7,loot:7,chests:5,ammo:2},{r:45,loot:45,chests:25,ammo:20},{r:72,loot:72,chests:45,ammo:27},{r:14,loot:14,chests:7,ammo:7},{r:65,loot:65,chests:36,ammo:29},{r:97,loot:97,chests:32,ammo:65},{r:7,loot:7,chests:6,ammo:1},{r:222,loot:222,chests:52,ammo:170},{r:57,loot:57,chests:26,ammo:31},{r:24,loot:24,chests:14,ammo:10},{r:0,loot:0,chests:0,ammo:0},{r:29,loot:29,chests:16,ammo:13},{r:24,loot:24,chests:14,ammo:10},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:31,loot:31,chests:14,ammo:17},{r:111,loot:111,chests:46,ammo:65},{r:4,loot:4,chests:3,ammo:1},{r:0,loot:0,chests:0,ammo:0},{r:95,loot:95,chests:44,ammo:51},{r:46,loot:46,chests:25,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:78,loot:78,chests:36,ammo:42},{r:7,loot:7,chests:4,ammo:3},{r:9,loot:9,chests:7,ammo:2},{r:36,loot:36,chests:15,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:44,loot:44,chests:22,ammo:22},{r:49,loot:49,chests:23,ammo:26},{r:104,loot:104,chests:25,ammo:79},{r:67,loot:67,chests:37,ammo:30},{r:39,loot:39,chests:20,ammo:19}],
  // ==== FNCS 2023 zone stats (tools/splice-2023-zone-stats.js) ====
  // Острова 2023-го: лут и сундуки локаций вики патча финала, по клеткам (build-2025-zone-loot.js).
  e1:[{r:11,loot:11,chests:7,ammo:4},{r:57,loot:57,chests:32,ammo:25},{r:40,loot:40,chests:23,ammo:17},{r:40,loot:40,chests:18,ammo:22},{r:97,loot:97,chests:33,ammo:64},{r:25,loot:25,chests:13,ammo:12},{r:49,loot:49,chests:25,ammo:24},{r:3,loot:3,chests:3,ammo:0},{r:14,loot:14,chests:7,ammo:7},{r:15,loot:15,chests:7,ammo:8},{r:76,loot:76,chests:24,ammo:52},{r:28,loot:28,chests:13,ammo:15},{r:13,loot:13,chests:7,ammo:6},{r:3,loot:3,chests:3,ammo:0},{r:17,loot:17,chests:10,ammo:7},{r:92,loot:92,chests:49,ammo:43},{r:34,loot:34,chests:18,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:4,loot:4,chests:2,ammo:2},{r:121,loot:121,chests:66,ammo:55},{r:21,loot:21,chests:9,ammo:12},{r:27,loot:27,chests:10,ammo:17},{r:14,loot:14,chests:8,ammo:6},{r:50,loot:50,chests:27,ammo:23},{r:26,loot:26,chests:11,ammo:15},{r:10,loot:10,chests:6,ammo:4},{r:129,loot:129,chests:63,ammo:66},{r:0,loot:0,chests:0,ammo:0},{r:15,loot:15,chests:6,ammo:9},{r:0,loot:0,chests:0,ammo:0},{r:37,loot:37,chests:20,ammo:17},{r:49,loot:49,chests:12,ammo:37},{r:42,loot:42,chests:26,ammo:16},{r:11,loot:11,chests:5,ammo:6},{r:43,loot:43,chests:23,ammo:20},{r:21,loot:21,chests:11,ammo:10},{r:13,loot:13,chests:6,ammo:7}],
  e2:[{r:11,loot:11,chests:7,ammo:4},{r:57,loot:57,chests:32,ammo:25},{r:40,loot:40,chests:18,ammo:22},{r:40,loot:40,chests:23,ammo:17},{r:97,loot:97,chests:33,ammo:64},{r:49,loot:49,chests:25,ammo:24},{r:25,loot:25,chests:13,ammo:12},{r:3,loot:3,chests:3,ammo:0},{r:14,loot:14,chests:7,ammo:7},{r:76,loot:76,chests:24,ammo:52},{r:32,loot:32,chests:17,ammo:15},{r:13,loot:13,chests:7,ammo:6},{r:28,loot:28,chests:13,ammo:15},{r:104,loot:104,chests:47,ammo:57},{r:34,loot:34,chests:18,ammo:16},{r:92,loot:92,chests:49,ammo:43},{r:0,loot:0,chests:0,ammo:0},{r:121,loot:121,chests:66,ammo:55},{r:21,loot:21,chests:9,ammo:12},{r:27,loot:27,chests:10,ammo:17},{r:18,loot:18,chests:10,ammo:8},{r:20,loot:20,chests:12,ammo:8},{r:0,loot:0,chests:0,ammo:0},{r:36,loot:36,chests:25,ammo:11},{r:21,loot:21,chests:13,ammo:8},{r:15,loot:15,chests:6,ammo:9},{r:50,loot:50,chests:27,ammo:23},{r:0,loot:0,chests:0,ammo:0},{r:40,loot:40,chests:23,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:49,loot:49,chests:12,ammo:37},{r:42,loot:42,chests:26,ammo:16},{r:11,loot:11,chests:5,ammo:6},{r:56,loot:56,chests:39,ammo:17},{r:208,loot:208,chests:121,ammo:87},{r:8,loot:8,chests:6,ammo:2},{r:39,loot:39,chests:21,ammo:18},{r:13,loot:13,chests:6,ammo:7},{r:29,loot:29,chests:15,ammo:14},{r:18,loot:18,chests:14,ammo:4},{r:57,loot:57,chests:30,ammo:27}],
  e3:[{r:0,loot:0,chests:0,ammo:0},{r:52,loot:52,chests:29,ammo:23},{r:40,loot:40,chests:18,ammo:22},{r:33,loot:33,chests:20,ammo:13},{r:25,loot:25,chests:17,ammo:8},{r:97,loot:97,chests:33,ammo:64},{r:84,loot:84,chests:37,ammo:47},{r:49,loot:49,chests:25,ammo:24},{r:3,loot:3,chests:3,ammo:0},{r:35,loot:35,chests:18,ammo:17},{r:76,loot:76,chests:24,ammo:52},{r:32,loot:32,chests:17,ammo:15},{r:13,loot:13,chests:7,ammo:6},{r:13,loot:13,chests:7,ammo:6},{r:104,loot:104,chests:47,ammo:57},{r:34,loot:34,chests:18,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:57,loot:57,chests:19,ammo:38},{r:12,loot:12,chests:8,ammo:4},{r:21,loot:21,chests:9,ammo:12},{r:121,loot:121,chests:66,ammo:55},{r:11,loot:11,chests:3,ammo:8},{r:111,loot:111,chests:36,ammo:75},{r:12,loot:12,chests:8,ammo:4},{r:20,loot:20,chests:12,ammo:8},{r:0,loot:0,chests:0,ammo:0},{r:42,loot:42,chests:31,ammo:11},{r:21,loot:21,chests:13,ammo:8},{r:14,loot:14,chests:6,ammo:8},{r:0,loot:0,chests:0,ammo:0},{r:15,loot:15,chests:6,ammo:9},{r:50,loot:50,chests:27,ammo:23},{r:0,loot:0,chests:0,ammo:0},{r:40,loot:40,chests:23,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:49,loot:49,chests:12,ammo:37},{r:42,loot:42,chests:26,ammo:16},{r:11,loot:11,chests:5,ammo:6},{r:56,loot:56,chests:39,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:8,loot:8,chests:6,ammo:2},{r:13,loot:13,chests:6,ammo:7},{r:29,loot:29,chests:15,ammo:14},{r:23,loot:23,chests:18,ammo:5},{r:57,loot:57,chests:30,ammo:27}],
  e4:[{r:36,loot:36,chests:24,ammo:12},{r:57,loot:57,chests:32,ammo:25},{r:40,loot:40,chests:18,ammo:22},{r:28,loot:28,chests:16,ammo:12},{r:172,loot:172,chests:94,ammo:78},{r:97,loot:97,chests:33,ammo:64},{r:84,loot:84,chests:37,ammo:47},{r:3,loot:3,chests:3,ammo:0},{r:35,loot:35,chests:18,ammo:17},{r:50,loot:50,chests:32,ammo:18},{r:32,loot:32,chests:17,ammo:15},{r:13,loot:13,chests:7,ammo:6},{r:104,loot:104,chests:47,ammo:57},{r:34,loot:34,chests:18,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:57,loot:57,chests:19,ammo:38},{r:12,loot:12,chests:8,ammo:4},{r:10,loot:10,chests:6,ammo:4},{r:121,loot:121,chests:66,ammo:55},{r:32,loot:32,chests:12,ammo:20},{r:111,loot:111,chests:36,ammo:75},{r:12,loot:12,chests:8,ammo:4},{r:36,loot:36,chests:25,ammo:11},{r:21,loot:21,chests:13,ammo:8},{r:60,loot:60,chests:33,ammo:27},{r:29,loot:29,chests:12,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:42,loot:42,chests:26,ammo:16},{r:40,loot:40,chests:23,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:9,loot:9,chests:4,ammo:5},{r:56,loot:56,chests:39,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:91,loot:91,chests:52,ammo:39},{r:47,loot:47,chests:27,ammo:20},{r:78,loot:78,chests:41,ammo:37},{r:23,loot:23,chests:18,ammo:5}],
  // ==== /FNCS 2023 zone stats ====
  // ==== FNCS 2022 zone stats (tools/splice-2022-zone-stats.js) ====
  // Острова 2022-го: лут и сундуки локаций вики патча финала, по клеткам (build-2025-zone-loot.js).
  k1:[{r:0,loot:0,chests:0,ammo:0},{r:12,loot:12,chests:7,ammo:5},{r:10,loot:10,chests:6,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:3,loot:3,chests:1,ammo:2},{r:80,loot:80,chests:37,ammo:43},{r:31,loot:31,chests:20,ammo:11},{r:118,loot:118,chests:41,ammo:77},{r:22,loot:22,chests:11,ammo:11},{r:9,loot:9,chests:5,ammo:4},{r:17,loot:17,chests:11,ammo:6},{r:144,loot:144,chests:40,ammo:104},{r:82,loot:82,chests:48,ammo:34},{r:59,loot:59,chests:35,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:3,loot:3,chests:3,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:64,loot:64,chests:42,ammo:22},{r:0,loot:0,chests:0,ammo:0},{r:80,loot:80,chests:29,ammo:51},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:12,loot:12,chests:6,ammo:6},{r:90,loot:90,chests:40,ammo:50},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:9,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:65,loot:65,chests:33,ammo:32},{r:3,loot:3,chests:3,ammo:0},{r:57,loot:57,chests:27,ammo:30},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:10,loot:10,chests:4,ammo:6},{r:17,loot:17,chests:11,ammo:6},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:82,loot:82,chests:33,ammo:49},{r:70,loot:70,chests:44,ammo:26}],
  k2:[{r:0,loot:0,chests:0,ammo:0},{r:12,loot:12,chests:7,ammo:5},{r:15,loot:15,chests:8,ammo:7},{r:0,loot:0,chests:0,ammo:0},{r:80,loot:80,chests:37,ammo:43},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:35,loot:35,chests:22,ammo:13},{r:22,loot:22,chests:11,ammo:11},{r:1,loot:1,chests:1,ammo:0},{r:17,loot:17,chests:11,ammo:6},{r:3,loot:3,chests:1,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:82,loot:82,chests:48,ammo:34},{r:59,loot:59,chests:35,ammo:24},{r:58,loot:58,chests:38,ammo:20},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:173,loot:173,chests:69,ammo:104},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:11,loot:11,chests:3,ammo:8},{r:2,loot:2,chests:2,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:15,loot:15,chests:5,ammo:10},{r:80,loot:80,chests:29,ammo:51},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:9,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:65,loot:65,chests:33,ammo:32},{r:0,loot:0,chests:0,ammo:0},{r:57,loot:57,chests:27,ammo:30},{r:0,loot:0,chests:0,ammo:0},{r:24,loot:24,chests:10,ammo:14},{r:82,loot:82,chests:33,ammo:49},{r:70,loot:70,chests:44,ammo:26},{r:71,loot:71,chests:27,ammo:44}],
  k3:[{r:12,loot:12,chests:7,ammo:5},{r:3,loot:3,chests:1,ammo:2},{r:10,loot:10,chests:6,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:25,loot:25,chests:14,ammo:11},{r:32,loot:32,chests:20,ammo:12},{r:118,loot:118,chests:41,ammo:77},{r:17,loot:17,chests:11,ammo:6},{r:6,loot:6,chests:4,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:111,loot:111,chests:61,ammo:50},{r:82,loot:82,chests:47,ammo:35},{r:38,loot:38,chests:22,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:60,loot:60,chests:40,ammo:20},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:13,loot:13,chests:9,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:65,loot:65,chests:33,ammo:32},{r:34,loot:34,chests:26,ammo:8},{r:57,loot:57,chests:27,ammo:30},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:3,loot:3,chests:2,ammo:1},{r:104,loot:104,chests:43,ammo:61},{r:69,loot:69,chests:43,ammo:26},{r:71,loot:71,chests:27,ammo:44},{r:0,loot:0,chests:0,ammo:0}],
  k4:[{r:12,loot:12,chests:7,ammo:5},{r:3,loot:3,chests:1,ammo:2},{r:7,loot:7,chests:4,ammo:3},{r:0,loot:0,chests:0,ammo:0},{r:79,loot:79,chests:34,ammo:45},{r:48,loot:48,chests:24,ammo:24},{r:30,loot:30,chests:19,ammo:11},{r:80,loot:80,chests:30,ammo:50},{r:17,loot:17,chests:11,ammo:6},{r:6,loot:6,chests:4,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:111,loot:111,chests:61,ammo:50},{r:71,loot:71,chests:41,ammo:30},{r:38,loot:38,chests:22,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:51,loot:51,chests:20,ammo:31},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:60,loot:60,chests:40,ammo:20},{r:0,loot:0,chests:0,ammo:0},{r:39,loot:39,chests:32,ammo:7},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:90,loot:90,chests:40,ammo:50},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:13,loot:13,chests:9,ammo:4},{r:65,loot:65,chests:39,ammo:26},{r:65,loot:65,chests:33,ammo:32},{r:0,loot:0,chests:0,ammo:0},{r:57,loot:57,chests:27,ammo:30},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:44,loot:44,chests:29,ammo:15},{r:175,loot:175,chests:75,ammo:100},{r:69,loot:69,chests:43,ammo:26},{r:71,loot:71,chests:27,ammo:44},{r:0,loot:0,chests:0,ammo:0}],
  // ==== /FNCS 2022 zone stats ====
  // ==== FNCS 2021 zone stats (tools/splice-2021-zone-stats.js) ====
  // Острова 2021-го: лут и сундуки локаций вики патча финала, по клеткам (build-2025-zone-loot.js).
  j1:[{r:30,loot:30,chests:17,ammo:13},{r:15,loot:15,chests:6,ammo:9},{r:33,loot:33,chests:30,ammo:3},{r:19,loot:19,chests:19,ammo:0},{r:3,loot:3,chests:3,ammo:0},{r:54,loot:54,chests:44,ammo:10},{r:74,loot:74,chests:57,ammo:17},{r:24,loot:24,chests:17,ammo:7},{r:3,loot:3,chests:3,ammo:0},{r:48,loot:48,chests:24,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:38,loot:38,chests:28,ammo:10},{r:17,loot:17,chests:17,ammo:0},{r:8,loot:8,chests:6,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:24,loot:24,chests:12,ammo:12},{r:6,loot:6,chests:6,ammo:0},{r:9,loot:9,chests:4,ammo:5},{r:28,loot:28,chests:28,ammo:0},{r:15,loot:15,chests:10,ammo:5},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:32,loot:32,chests:16,ammo:16},{r:74,loot:74,chests:35,ammo:39},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:21,loot:21,chests:9,ammo:12}],
  j2:[{r:84,loot:84,chests:61,ammo:23},{r:19,loot:19,chests:19,ammo:0},{r:23,loot:23,chests:13,ammo:10},{r:43,loot:43,chests:35,ammo:8},{r:3,loot:3,chests:3,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:23,loot:23,chests:16,ammo:7},{r:48,loot:48,chests:24,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:28,loot:28,chests:28,ammo:0},{r:28,loot:28,chests:28,ammo:0},{r:8,loot:8,chests:6,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:50,loot:50,chests:50,ammo:0},{r:13,loot:13,chests:7,ammo:6},{r:6,loot:6,chests:6,ammo:0},{r:8,loot:8,chests:7,ammo:1},{r:10,loot:10,chests:10,ammo:0},{r:15,loot:15,chests:10,ammo:5},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:46,loot:46,chests:23,ammo:23},{r:0,loot:0,chests:0,ammo:0},{r:32,loot:32,chests:16,ammo:16},{r:11,loot:11,chests:8,ammo:3},{r:49,loot:49,chests:30,ammo:19}],
  j3:[{r:84,loot:84,chests:61,ammo:23},{r:19,loot:19,chests:19,ammo:0},{r:15,loot:15,chests:6,ammo:9},{r:2,loot:2,chests:1,ammo:1},{r:3,loot:3,chests:3,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:2,loot:2,chests:2,ammo:0},{r:23,loot:23,chests:16,ammo:7},{r:48,loot:48,chests:24,ammo:24},{r:34,loot:34,chests:34,ammo:0},{r:28,loot:28,chests:28,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:5,loot:5,chests:4,ammo:1},{r:0,loot:0,chests:0,ammo:0},{r:19,loot:19,chests:13,ammo:6},{r:6,loot:6,chests:6,ammo:0},{r:8,loot:8,chests:3,ammo:5},{r:10,loot:10,chests:10,ammo:0},{r:15,loot:15,chests:10,ammo:5},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:35,ammo:39},{r:33,loot:33,chests:16,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:4,loot:4,chests:2,ammo:2},{r:18,loot:18,chests:18,ammo:0}],
  j4:[{r:70,loot:70,chests:50,ammo:20},{r:19,loot:19,chests:19,ammo:0},{r:16,loot:16,chests:7,ammo:9},{r:2,loot:2,chests:1,ammo:1},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:23,loot:23,chests:16,ammo:7},{r:2,loot:2,chests:2,ammo:0},{r:34,loot:34,chests:34,ammo:0},{r:28,loot:28,chests:28,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:8,loot:8,chests:6,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:1,loot:1,chests:1,ammo:0},{r:68,loot:68,chests:31,ammo:37},{r:6,loot:6,chests:6,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:10,loot:10,chests:10,ammo:0},{r:15,loot:15,chests:10,ammo:5},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:35,ammo:39},{r:11,loot:11,chests:11,ammo:0},{r:44,loot:44,chests:21,ammo:23},{r:0,loot:0,chests:0,ammo:0},{r:18,loot:18,chests:18,ammo:0}],
  // ==== /FNCS 2021 zone stats ====
  // ==== FNCS 2019–2020 zone stats (tools/splice-mx-zone-stats.js) ====
  // Острова 2019–2020: лут и сундуки локаций вики, по клеткам (build-2025-zone-loot.js).
  g5:[{r:13,loot:13,chests:6,ammo:7},{r:16,loot:16,chests:10,ammo:6},{r:21,loot:21,chests:14,ammo:7},{r:21,loot:21,chests:11,ammo:10},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:39,loot:39,chests:23,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:26,loot:26,chests:11,ammo:15},{r:0,loot:0,chests:0,ammo:0},{r:58,loot:58,chests:38,ammo:20},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:12,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:11,ammo:22},{r:90,loot:90,chests:40,ammo:50},{r:0,loot:0,chests:0,ammo:0},{r:20,loot:20,chests:16,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:65,loot:65,chests:33,ammo:32},{r:0,loot:0,chests:0,ammo:0},{r:22,loot:22,chests:11,ammo:11},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:14,ammo:19},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:77,loot:77,chests:25,ammo:52},{r:32,loot:32,chests:15,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:17,loot:17,chests:10,ammo:7},{r:21,loot:21,chests:11,ammo:10}],
  g6:[{r:13,loot:13,chests:6,ammo:7},{r:16,loot:16,chests:10,ammo:6},{r:21,loot:21,chests:14,ammo:7},{r:21,loot:21,chests:11,ammo:10},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:39,loot:39,chests:23,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:26,loot:26,chests:11,ammo:15},{r:0,loot:0,chests:0,ammo:0},{r:29,loot:29,chests:16,ammo:13},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:12,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:11,ammo:22},{r:90,loot:90,chests:40,ammo:50},{r:0,loot:0,chests:0,ammo:0},{r:20,loot:20,chests:16,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:65,loot:65,chests:33,ammo:32},{r:0,loot:0,chests:0,ammo:0},{r:22,loot:22,chests:11,ammo:11},{r:33,loot:33,chests:14,ammo:19},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:77,loot:77,chests:25,ammo:52},{r:32,loot:32,chests:15,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:17,loot:17,chests:10,ammo:7},{r:21,loot:21,chests:11,ammo:10}],
  g7:[{r:13,loot:13,chests:6,ammo:7},{r:5,loot:5,chests:5,ammo:0},{r:21,loot:21,chests:14,ammo:7},{r:21,loot:21,chests:11,ammo:10},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:39,loot:39,chests:23,ammo:16},{r:0,loot:0,chests:0,ammo:0},{r:26,loot:26,chests:11,ammo:15},{r:0,loot:0,chests:0,ammo:0},{r:58,loot:58,chests:38,ammo:20},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:12,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:11,ammo:22},{r:90,loot:90,chests:40,ammo:50},{r:20,loot:20,chests:16,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:22,loot:22,chests:11,ammo:11},{r:33,loot:33,chests:14,ammo:19},{r:28,loot:28,chests:24,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:46,loot:46,chests:25,ammo:21},{r:77,loot:77,chests:25,ammo:52},{r:32,loot:32,chests:15,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:34,ammo:36},{r:21,loot:21,chests:11,ammo:10}],
  h1:[{r:13,loot:13,chests:6,ammo:7},{r:5,loot:5,chests:5,ammo:0},{r:21,loot:21,chests:11,ammo:10},{r:15,loot:15,chests:15,ammo:0},{r:82,loot:82,chests:47,ammo:35},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:16,loot:16,chests:16,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:58,loot:58,chests:38,ammo:20},{r:33,loot:33,chests:12,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:11,ammo:22},{r:20,loot:20,chests:16,ammo:4},{r:37,loot:37,chests:37,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:110,loot:110,chests:37,ammo:73},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:22,loot:22,chests:11,ammo:11},{r:33,loot:33,chests:14,ammo:19},{r:0,loot:0,chests:0,ammo:0},{r:28,loot:28,chests:24,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:77,loot:77,chests:25,ammo:52},{r:46,loot:46,chests:25,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:32,loot:32,chests:15,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:34,ammo:36},{r:21,loot:21,chests:11,ammo:10}],
  h3:[{r:13,loot:13,chests:6,ammo:7},{r:5,loot:5,chests:5,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:21,loot:21,chests:11,ammo:10},{r:15,loot:15,chests:15,ammo:0},{r:82,loot:82,chests:47,ammo:35},{r:0,loot:0,chests:0,ammo:0},{r:74,loot:74,chests:57,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:16,loot:16,chests:16,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:58,loot:58,chests:38,ammo:20},{r:33,loot:33,chests:12,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:33,loot:33,chests:11,ammo:22},{r:7,loot:7,chests:3,ammo:4},{r:55,loot:55,chests:40,ammo:15},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:37,ammo:33},{r:0,loot:0,chests:0,ammo:0},{r:65,loot:65,chests:33,ammo:32},{r:0,loot:0,chests:0,ammo:0},{r:22,loot:22,chests:11,ammo:11},{r:33,loot:33,chests:14,ammo:19},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:28,loot:28,chests:24,ammo:4},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:25,loot:25,chests:25,ammo:0},{r:46,loot:46,chests:25,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:32,loot:32,chests:15,ammo:17},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:34,ammo:36},{r:0,loot:0,chests:0,ammo:0},{r:21,loot:21,chests:11,ammo:10}],
  h4:[{r:8,loot:8,chests:3,ammo:5},{r:19,loot:19,chests:19,ammo:0},{r:3,loot:3,chests:3,ammo:0},{r:18,loot:18,chests:11,ammo:7},{r:7,loot:7,chests:4,ammo:3},{r:21,loot:21,chests:7,ammo:14},{r:74,loot:74,chests:57,ammo:17},{r:7,loot:7,chests:6,ammo:1},{r:0,loot:0,chests:0,ammo:0},{r:30,loot:30,chests:16,ammo:14},{r:15,loot:15,chests:6,ammo:9},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:16,loot:16,chests:10,ammo:6},{r:3,loot:3,chests:3,ammo:0},{r:11,loot:11,chests:4,ammo:7},{r:0,loot:0,chests:0,ammo:0},{r:3,loot:3,chests:2,ammo:1},{r:37,loot:37,chests:16,ammo:21},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:14,loot:14,chests:5,ammo:9},{r:0,loot:0,chests:0,ammo:0},{r:70,loot:70,chests:37,ammo:33},{r:15,loot:15,chests:8,ammo:7},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:1,loot:1,chests:1,ammo:0},{r:8,loot:8,chests:3,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:8,ammo:5},{r:8,loot:8,chests:3,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:5,ammo:8},{r:6,loot:6,chests:2,ammo:4},{r:18,loot:18,chests:18,ammo:0},{r:4,loot:4,chests:3,ammo:1}],
  i1:[{r:11,loot:11,chests:11,ammo:0},{r:16,loot:16,chests:16,ammo:0},{r:8,loot:8,chests:3,ammo:5},{r:19,loot:19,chests:19,ammo:0},{r:3,loot:3,chests:3,ammo:0},{r:18,loot:18,chests:11,ammo:7},{r:7,loot:7,chests:4,ammo:3},{r:74,loot:74,chests:57,ammo:17},{r:7,loot:7,chests:6,ammo:1},{r:0,loot:0,chests:0,ammo:0},{r:30,loot:30,chests:16,ammo:14},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:16,loot:16,chests:10,ammo:6},{r:3,loot:3,chests:3,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:11,loot:11,chests:4,ammo:7},{r:3,loot:3,chests:2,ammo:1},{r:37,loot:37,chests:16,ammo:21},{r:23,loot:23,chests:23,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:12,loot:12,chests:12,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:9,loot:9,chests:4,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:75,loot:75,chests:37,ammo:38},{r:1,loot:1,chests:1,ammo:0},{r:8,loot:8,chests:3,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:8,ammo:5},{r:17,loot:17,chests:6,ammo:11},{r:24,loot:24,chests:24,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:5,ammo:8},{r:6,loot:6,chests:2,ammo:4},{r:18,loot:18,chests:18,ammo:0}],
  i2:[{r:19,loot:19,chests:14,ammo:5},{r:19,loot:19,chests:19,ammo:0},{r:9,loot:9,chests:3,ammo:6},{r:3,loot:3,chests:3,ammo:0},{r:18,loot:18,chests:11,ammo:7},{r:74,loot:74,chests:57,ammo:17},{r:7,loot:7,chests:4,ammo:3},{r:10,loot:10,chests:7,ammo:3},{r:0,loot:0,chests:0,ammo:0},{r:30,loot:30,chests:16,ammo:14},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:16,loot:16,chests:10,ammo:6},{r:3,loot:3,chests:3,ammo:0},{r:11,loot:11,chests:4,ammo:7},{r:3,loot:3,chests:2,ammo:1},{r:0,loot:0,chests:0,ammo:0},{r:37,loot:37,chests:16,ammo:21},{r:23,loot:23,chests:23,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:75,loot:75,chests:37,ammo:38},{r:9,loot:9,chests:4,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:1,loot:1,chests:1,ammo:0},{r:8,loot:8,chests:3,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:39,loot:39,chests:20,ammo:19},{r:20,loot:20,chests:20,ammo:0},{r:13,loot:13,chests:8,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:17,loot:17,chests:15,ammo:2},{r:13,loot:13,chests:5,ammo:8},{r:12,loot:12,chests:5,ammo:7},{r:6,loot:6,chests:2,ammo:4},{r:12,loot:12,chests:5,ammo:7},{r:18,loot:18,chests:18,ammo:0}],
  i3:[{r:8,loot:8,chests:3,ammo:5},{r:19,loot:19,chests:19,ammo:0},{r:9,loot:9,chests:3,ammo:6},{r:3,loot:3,chests:3,ammo:0},{r:29,loot:29,chests:29,ammo:0},{r:18,loot:18,chests:11,ammo:7},{r:84,loot:84,chests:35,ammo:49},{r:7,loot:7,chests:4,ammo:3},{r:8,loot:8,chests:7,ammo:1},{r:30,loot:30,chests:16,ammo:14},{r:0,loot:0,chests:0,ammo:0},{r:2,loot:2,chests:2,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:16,loot:16,chests:10,ammo:6},{r:5,loot:5,chests:5,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:11,loot:11,chests:4,ammo:7},{r:3,loot:3,chests:2,ammo:1},{r:37,loot:37,chests:16,ammo:21},{r:23,loot:23,chests:23,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:73,loot:73,chests:39,ammo:34},{r:9,loot:9,chests:4,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:1,loot:1,chests:1,ammo:0},{r:8,loot:8,chests:3,ammo:5},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:39,loot:39,chests:20,ammo:19},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:8,ammo:5},{r:20,loot:20,chests:20,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:13,loot:13,chests:5,ammo:8},{r:12,loot:12,chests:5,ammo:7},{r:6,loot:6,chests:2,ammo:4},{r:12,loot:12,chests:5,ammo:7},{r:18,loot:18,chests:18,ammo:0}],
  // ==== /FNCS 2019–2020 zone stats ====
  t1:[{r:25,loot:25,chests:16,ammo:9},{r:99,loot:99,chests:46,ammo:53},{r:70,loot:70,chests:33,ammo:37},{r:15,loot:15,chests:8,ammo:7},{r:84,loot:84,chests:57,ammo:27},{r:77,loot:77,chests:37,ammo:40},{r:90,loot:90,chests:43,ammo:47},{r:40,loot:40,chests:18,ammo:22},{r:48,loot:48,chests:29,ammo:19},{r:20,loot:20,chests:12,ammo:8},{r:71,loot:71,chests:39,ammo:32},{r:34,loot:34,chests:19,ammo:15},{r:51,loot:51,chests:45,ammo:6},{r:60,loot:60,chests:38,ammo:22},{r:51,loot:51,chests:33,ammo:18},{r:122,loot:122,chests:71,ammo:51},{r:159,loot:159,chests:87,ammo:72},{r:71,loot:71,chests:39,ammo:32},{r:46,loot:46,chests:22,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:97,loot:97,chests:59,ammo:38},{r:42,loot:42,chests:33,ammo:9},{r:73,loot:73,chests:44,ammo:29},{r:92,loot:92,chests:64,ammo:28},{r:78,loot:78,chests:42,ammo:36},{r:77,loot:77,chests:43,ammo:34},{r:0,loot:0,chests:0,ammo:0}],
  t2:[{r:25,loot:25,chests:16,ammo:9},{r:99,loot:99,chests:46,ammo:53},{r:19,loot:19,chests:12,ammo:7},{r:95,loot:95,chests:44,ammo:51},{r:84,loot:84,chests:57,ammo:27},{r:77,loot:77,chests:37,ammo:40},{r:90,loot:90,chests:43,ammo:47},{r:48,loot:48,chests:29,ammo:19},{r:15,loot:15,chests:7,ammo:8},{r:35,loot:35,chests:24,ammo:11},{r:71,loot:71,chests:34,ammo:37},{r:34,loot:34,chests:19,ammo:15},{r:73,loot:73,chests:57,ammo:16},{r:15,loot:15,chests:7,ammo:8},{r:39,loot:39,chests:28,ammo:11},{r:46,loot:46,chests:26,ammo:20},{r:121,loot:121,chests:68,ammo:53},{r:42,loot:42,chests:31,ammo:11},{r:133,loot:133,chests:78,ammo:55},{r:9,loot:9,chests:7,ammo:2},{r:97,loot:97,chests:59,ammo:38},{r:27,loot:27,chests:26,ammo:1},{r:70,loot:70,chests:44,ammo:26},{r:0,loot:0,chests:0,ammo:0},{r:15,loot:15,chests:11,ammo:4},{r:111,loot:111,chests:77,ammo:34},{r:78,loot:78,chests:42,ammo:36},{r:85,loot:85,chests:51,ammo:34},{r:0,loot:0,chests:0,ammo:0}],
  t3:[{r:25,loot:25,chests:16,ammo:9},{r:0,loot:0,chests:0,ammo:0},{r:99,loot:99,chests:46,ammo:53},{r:0,loot:0,chests:0,ammo:0},{r:0,loot:0,chests:0,ammo:0},{r:90,loot:90,chests:43,ammo:47},{r:71,loot:71,chests:43,ammo:28},{r:20,loot:20,chests:12,ammo:8},{r:40,loot:40,chests:18,ammo:22},{r:71,loot:71,chests:34,ammo:37},{r:34,loot:34,chests:19,ammo:15},{r:73,loot:73,chests:57,ammo:16},{r:56,loot:56,chests:31,ammo:25},{r:42,loot:42,chests:31,ammo:11},{r:93,loot:93,chests:53,ammo:40},{r:72,loot:72,chests:40,ammo:32},{r:63,loot:63,chests:46,ammo:17},{r:90,loot:90,chests:55,ammo:35},{r:35,loot:35,chests:26,ammo:9},{r:70,loot:70,chests:44,ammo:26},{r:11,loot:11,chests:8,ammo:3},{r:97,loot:97,chests:73,ammo:24},{r:78,loot:78,chests:42,ammo:36},{r:38,loot:38,chests:23,ammo:15},{r:69,loot:69,chests:44,ammo:25}],
  // Лион (C6S4, патч 37.10): лут вики по клеткам дроп-карты Глобалов (build-2025-zone-loot.js t4).
  t4:[{r:25,loot:25,chests:16,ammo:9},{r:0,loot:0,chests:0,ammo:0},{r:12,loot:12,chests:10,ammo:2},{r:0,loot:0,chests:0,ammo:0},{r:20,loot:20,chests:11,ammo:9},{r:71,loot:71,chests:43,ammo:28},{r:20,loot:20,chests:12,ammo:8},{r:62,loot:62,chests:47,ammo:15},{r:47,loot:47,chests:23,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:73,loot:73,chests:57,ammo:16},{r:45,loot:45,chests:30,ammo:15},{r:56,loot:56,chests:31,ammo:25},{r:59,loot:59,chests:35,ammo:24},{r:0,loot:0,chests:0,ammo:0},{r:63,loot:63,chests:46,ammo:17},{r:42,loot:42,chests:31,ammo:11},{r:0,loot:0,chests:0,ammo:0},{r:90,loot:90,chests:55,ammo:35},{r:35,loot:35,chests:26,ammo:9},{r:70,loot:70,chests:44,ammo:26},{r:11,loot:11,chests:8,ammo:3},{r:0,loot:0,chests:0,ammo:0},{r:78,loot:78,chests:42,ammo:36},{r:38,loot:38,chests:23,ammo:15},{r:36,loot:36,chests:23,ammo:13}],
  m1:[
    {r:29,loot:68,teams:3.46,surv:51},{r:16,loot:23,teams:1.68,surv:58},{r:37,loot:53,teams:1.96,surv:57},
    {r:29,loot:33,teams:1.38,surv:58},{r:55,loot:49,teams:1.74,surv:65},{r:48,loot:28,teams:0.78,surv:60},
    {r:56,loot:42,teams:1.40,surv:65},{r:56,loot:27,teams:0.73,surv:75},{r:22,loot:26,teams:1.95,surv:59},
    {r:41,loot:17,teams:0.67,surv:69},{r:87,loot:31,teams:0.45,surv:80},{r:82,loot:63,teams:2.03,surv:76},
    {r:25,loot:29,teams:1.56,surv:63},{r:46,loot:44,teams:1.73,surv:62},{r:46,loot:44,teams:1.73,surv:62},
    {r:68,loot:56,teams:1.47,surv:63},{r:29,loot:31,teams:2.02,surv:65},{r:28,loot:17,teams:0.62,surv:63},
    {r:44,loot:49,teams:1.81,surv:59},{r:25,loot:29,teams:1.56,surv:63},{r:29,loot:31,teams:2.02,surv:65},
    {r:130,loot:49,teams:0.87,surv:82},{r:38,loot:25,teams:1.19,surv:70},{r:38,loot:25,teams:1.19,surv:70},
    {r:20,loot:26,teams:1.74,surv:51},{r:27,loot:31,teams:1.96,surv:68},{r:48,loot:42,teams:1.84,surv:67},
    {r:48,loot:42,teams:1.84,surv:67},{r:75,loot:60,teams:1.78,surv:70},{r:25,loot:27,teams:1.57,surv:55},
    {r:28,loot:20,teams:1.43,surv:74},{r:91,loot:34,teams:0.53,surv:69},{r:75,loot:60,teams:1.78,surv:70},
    {r:27,loot:31,teams:1.96,surv:68},{r:97,loot:46,teams:0.82,surv:69},{r:97,loot:46,teams:0.82,surv:69},
    {r:28,loot:20,teams:1.43,surv:74},{r:88,loot:38,teams:0.49,surv:62},{r:88,loot:38,teams:0.49,surv:62}
  ],
  m2:[
    {r:90,loot:36,teams:0.55,surv:68},{r:66,loot:56,teams:1.66,surv:68},{r:34,loot:50,teams:1.81,surv:52},
    {r:19,loot:42,teams:2.12,surv:44},{r:29,loot:46,teams:2.10,surv:50},{r:34,loot:40,teams:1.68,surv:57},
    {r:40,loot:26,teams:0.57,surv:67},{r:51,loot:43,teams:1.08,surv:55},{r:79,loot:31,teams:0.63,surv:75},
    {r:87,loot:101,teams:2.31,surv:64},{r:61,loot:46,teams:1.22,surv:64},{r:34,loot:35,teams:1.69,surv:63},
    {r:25,loot:17,teams:0.80,surv:65},{r:29,loot:49,teams:1.60,surv:69},{r:32,loot:26,teams:1.35,surv:66},
    {r:35,loot:51,teams:2.19,surv:55},{r:60,loot:67,teams:2.12,surv:63},{r:24,loot:27,teams:0.96,surv:57},
    {r:72,loot:76,teams:1.84,surv:61},{r:28,loot:39,teams:2.28,surv:60},{r:30,loot:48,teams:2.42,surv:63},
    {r:56,loot:52,teams:1.75,surv:69},{r:61,loot:68,teams:1.96,surv:61},{r:38,loot:28,teams:0.99,surv:64},
    {r:30,loot:48,teams:2.42,surv:63},{r:49,loot:58,teams:2.03,surv:60},{r:83,loot:31,teams:0.48,surv:67},
    {r:56,loot:52,teams:1.75,surv:69},{r:55,loot:38,teams:1.25,surv:66},{r:49,loot:58,teams:2.03,surv:60},
    {r:70,loot:53,teams:1.04,surv:59},{r:61,loot:42,teams:1.20,surv:65},{r:42,loot:32,teams:1.42,surv:71},
    {r:63,loot:45,teams:1.15,surv:66},{r:69,loot:60,teams:1.24,surv:57},{r:61,loot:42,teams:1.20,surv:65}
  ],
  // The Reload islands are rated by the size of the box the circuit drew
  // around each POI — see tools/build-reload-zone-value.js.
  r1:[{r:82},{r:162},{r:73},{r:95},{r:68},{r:157},{r:210},{r:231},{r:125},{r:68},{r:31},{r:56},{r:145},{r:132},{r:128}],
  r2:[{r:175},{r:171},{r:115},{r:71},{r:184},{r:219},{r:262},{r:131},{r:55},{r:28},{r:188},{r:154},{r:140}],
  r3:[{r:38},{r:406},{r:102},{r:14},{r:188},{r:129},{r:120},{r:218},{r:364},{r:299},{r:324},{r:176},{r:254},{r:241}],
  r4:[{r:197},{r:263},{r:91},{r:213},{r:245},{r:97},{r:136},{r:363},{r:272},{r:521},{r:113},{r:232}]
};
const ZONE_SETS={
  /* Сто клеток на острове, по одной на игрока соло-турнира, для выбора дропа в соло FNCS.
     Рамки сняты с референсной картинки детектором по тёмному контуру и сведены на нашу карту:
     масштаб 1.2741 по крайним точкам острова, сдвиг по красному призраку у Sunken Shores
     (левый край 60.9 при настоящих 62, правый 892.9 при 894).
     Клетки 32, 63, 86, 100 и 39 (была эллипсом) добавлены руками. Нумерация своя, сверху вниз и слева направо. */
  s42solo:[
    {x:21.1,y:2,w:11.9,h:10.1}, {x:34.7,y:6.2,w:8.3,h:5}, {x:50.3,y:8.6,w:5.8,h:5.6}, {x:35.1,y:11.3,w:5.4,h:5.7},
    {x:65.4,y:12.7,w:6.6,h:10.3}, {x:25.8,y:13.1,w:5.5,h:5.6}, {x:54.3,y:14.5,w:7.6,h:7.6}, {x:44,y:15.7,w:9.5,h:7.4},
    {x:62.8,y:16.9,w:2.9,h:5.6}, {x:84.9,y:17.7,w:5.8,h:11}, {x:32.3,y:18.6,w:6.8,h:7.6}, {x:39,y:22.4,w:5.3,h:6.3},
    {x:54.8,y:23,w:5.4,h:6.5}, {x:47.6,y:24,w:5,h:5.6}, {x:78.7,y:24.6,w:6.4,h:8.8}, {x:62.1,y:24.8,w:6.8,h:7.3},
    {x:72.7,y:26.7,w:6.1,h:7.1}, {x:12.8,y:27.1,w:4.4,h:5.1}, {x:27.8,y:27.1,w:8.4,h:11.2}, {x:27.8,y:27.1,w:8.4,h:5.9},
    {x:22.9,y:29.3,w:4.6,h:8.5}, {x:38.8,y:29.3,w:7.7,h:3.2}, {x:17.3,y:29.6,w:5.9,h:3.3}, {x:43.9,y:32.6,w:2.5,h:2.9},
    {x:40.9,y:32.8,w:3,h:2.7}, {x:27.9,y:32.9,w:7.9,h:5.6}, {x:17.4,y:33.1,w:4.3,h:3}, {x:50.3,y:33.1,w:13,h:6.5},
    {x:67.5,y:33.7,w:5.1,h:3.9}, {x:42.6,y:34.3,w:3.7,h:4.5}, {x:11.2,y:35.7,w:6.5,h:5.3}, {x:71.9,y:38.2,w:8,h:12.2},
    {x:79.7,y:38.8,w:12.3,h:6.2}, {x:25.8,y:39.7,w:5.8,h:5.6}, {x:44.1,y:39.9,w:13.1,h:4.1}, {x:25.7,y:40,w:6.1,h:10.4},
    {x:65.4,y:40,w:5.3,h:7.9}, {x:58.4,y:40.7,w:6.2,h:6.2}, {x:16,y:41.3,w:6.4,h:4.4}, {x:43,y:44.3,w:5.1,h:4.7},
    {x:25.7,y:44.9,w:5.9,h:5.6}, {x:48,y:45.3,w:5.8,h:5.7}, {x:15.7,y:45.8,w:7.9,h:7.9}, {x:31.5,y:45.8,w:6.9,h:3.5},
    {x:60.8,y:47.5,w:2.9,h:2.5}, {x:82.6,y:47.9,w:15.5,h:9.7}, {x:63.5,y:48.1,w:2.6,h:3.9}, {x:37,y:49.7,w:6.6,h:5.7},
    {x:53.6,y:49.7,w:4.4,h:7.4}, {x:60,y:49.9,w:3.6,h:2.5}, {x:25.7,y:50.2,w:3.5,h:4.2}, {x:24.9,y:50.6,w:4.4,h:6.5},
    {x:30,y:50.8,w:6.1,h:6}, {x:74.5,y:51.4,w:6.2,h:4.1}, {x:63.3,y:52.6,w:7.9,h:3.6}, {x:85.2,y:53.3,w:3.3,h:3.5},
    {x:44.8,y:53.8,w:6.6,h:5.4}, {x:80.6,y:54.1,w:4.8,h:3.6}, {x:58.8,y:54.3,w:4.7,h:7.6}, {x:75.5,y:56.2,w:3.3,h:6.5},
    {x:67.6,y:57.1,w:5.5,h:6.3}, {x:15.3,y:57.3,w:5.8,h:4.2}, {x:83.1,y:57.9,w:4.7,h:2.5}, {x:22.2,y:59.5,w:11.6,h:9.1},
    {x:43.6,y:60,w:5.4,h:3.9}, {x:35.5,y:61.2,w:5.5,h:3.9}, {x:58.9,y:61.4,w:4,h:2.5}, {x:80.3,y:63.2,w:7.2,h:6.8},
    {x:58.6,y:63.6,w:5.9,h:2.9}, {x:58.2,y:63.8,w:6.5,h:10.3}, {x:70.2,y:63.8,w:8.6,h:5}, {x:64.4,y:68.6,w:5.1,h:3.2},
    {x:25.4,y:68.9,w:7.9,h:4.1}, {x:69.4,y:68.9,w:5.4,h:4.8}, {x:20.9,y:69.1,w:4.7,h:5.7}, {x:44.9,y:69.4,w:8,h:8.3},
    {x:45.2,y:69.4,w:7.3,h:16.3}, {x:36.8,y:70.7,w:4,h:12.1}, {x:36.8,y:70.7,w:4,h:5}, {x:9.4,y:73.1,w:9.4,h:5.1},
    {x:76.9,y:73.8,w:7.9,h:9.5}, {x:70.9,y:73.9,w:4.6,h:2.9}, {x:27.9,y:74.1,w:6.6,h:14.5}, {x:53.8,y:74.8,w:6.6,h:4.2},
    {x:36.2,y:76,w:6.9,h:6.3}, {x:61.4,y:76.5,w:8.3,h:4.1}, {x:15.3,y:79.6,w:6.9,h:7.4}, {x:53.2,y:81,w:5.7,h:7.6},
    {x:59.2,y:81,w:5.5,h:7.9}, {x:66.1,y:81,w:7.3,h:6}, {x:45.6,y:81.5,w:6.6,h:4.2}, {x:27.9,y:81.9,w:6.6,h:6.7},
    {x:35.7,y:83,w:5.3,h:5.3}, {x:22,y:84.5,w:5,h:5}, {x:46.6,y:86,w:5.4,h:9.8}, {x:73.2,y:86.6,w:4,h:4.5},
    {x:76.9,y:87.1,w:3.7,h:3.8}, {x:81.6,y:88.4,w:7.2,h:7.4}, {x:11.2,y:89.6,w:4.4,h:5.1}, {x:65.1,y:90.4,w:6.9,h:4.1}
  ],
  /* Сорок второй сезон — его карта, 23 августа: он прислал остров (Lifty
     Lodge, Wonkeeland, Green Hill Zone, Reality's Reign…) и сетку
     прямоугольников с неё же — «сделай такие прямоугольники на новой карте».
     Тринадцать именованных точек плюс двадцать одна безымянная между ними,
     той же нерегулярной формы, что его сетка. Координаты — проценты
     art/map-s42.jpg, положены по самой картинке; опубликованной дроп-карты
     у сезона ещё нет, снять нечего. */
  r6:[{x:49.77,y:9.19,w:6.91,h:9.85,n:"Snobby Shoals"},{x:57.08,y:12.58,w:3.86,h:7.14},{x:35.33,y:16.42,w:7.5,h:6.97},{x:65.17,y:24.25,w:6.9,h:5.51},{x:39.98,y:24.84,w:3,h:8.61,n:"Scoops & Shells"},{x:47.55,y:32.21,w:9.13,h:8.79},{x:33.29,y:35.63,w:7.95,h:5.46},{x:58.85,y:39.21,w:7.16,h:9.53,n:"Sandy Sheets"},{x:32.88,y:46.8,w:8.38,h:9.95},{x:20.17,y:47.12,w:8.94,h:8.71,n:"Pleasant Park"},{x:70.03,y:54.3,w:4.47,h:7.78},{x:37.04,y:57.21,w:5.52,h:6.45},{x:20.75,y:58.11,w:6.63,h:5.78},{x:75.37,y:60.13,w:6.77,h:5.98},{x:27.78,y:61.04,w:8.86,h:6.5},{x:67.41,y:65.8,w:3.23,h:3.16},{x:71.03,y:66.84,w:7.02,h:8.7,n:"Retail Row"},{x:43.99,y:67.29,w:8.47,h:7.67,n:"Empty Store"},{x:64.58,y:69.37,w:4.17,h:9.57},{x:30.54,y:70.12,w:5.8,h:5.18},{x:71.88,y:76.86,w:6.46,h:4.45},{x:30.9,y:81.38,w:8.51,h:7.73,n:"Lazy Laps"},{x:67.76,y:81.71,w:9.66,h:6.4},{x:46.8,y:89.09,w:3.11,h:3.66,n:"Seaside Lodge"}],/*@@R6-ZONES@@*/
  r5:[{x:13.08,y:4.25,w:13.62,h:27.13},{x:40.47,y:6.55,w:19.65,h:12.82},{x:27.1,y:16.4,w:12.48,h:6.67},{x:59.22,y:23.01,w:20.31,h:10.59},{x:28.57,y:23.78,w:2.53,h:7.9,n:"Terror Turrets"},{x:31.5,y:25.62,w:16.51,h:19.59},{x:49.11,y:25.93,w:7.75,h:8.52,n:"Estranged Estate"},{x:13.89,y:32.69,w:13.46,h:12.21,n:"Gravey Gates"},{x:73.56,y:34,w:11.67,h:2.75},{x:48.41,y:35,w:13.91,h:15.29},{x:62.72,y:38.08,w:5.71,h:7.9,n:"Creepy Cabins"},{x:68.84,y:38.08,w:6.45,h:10.06},{x:41.44,y:46.23,w:6.37,h:2.6},{x:21.47,y:46.38,w:16.47,h:17.28,n:"Leech Lake"},{x:38.84,y:49.22,w:4.49,h:7.06},{x:43.89,y:50.69,w:5.47,h:5.6,n:"Haunted Hamlet"},{x:66.23,y:53.92,w:12.81,h:9.44},{x:56.77,y:55.3,w:7.75,h:8.06,n:"Revenge Reels"},{x:11.93,y:60.37,w:9.14,h:14.36},{x:42.59,y:63.6,w:6.94,h:11.75},{x:24.16,y:67.6,w:4.82,h:9.29},{x:29.38,y:68.06,w:8.24,h:7.6,n:"Punishment Patch"},{x:71.38,y:69.91,w:4.07,h:5.83},{x:55.63,y:70.98,w:13.95,h:4.75},{x:79.76,y:71.29,w:5.31,h:9.75},{x:38.02,y:76.67,w:13.95,h:5.14},{x:19.76,y:78.52,w:17.86,h:16.82},{x:71.17,y:80.24,w:7.7,h:6.8},{x:61.82,y:80.31,w:8.57,h:7.81},{x:38.18,y:82.36,w:11.99,h:5.29,n:"Retail Ruin"}],/*@@R5-ZONES@@*/
  s43:[{x:66.88,y:6.25,w:23.72,h:23.22},{x:10.28,y:6.64,w:21.42,h:16.95,n:"Rubber Resort"},{x:45.96,y:18.11,w:16.84,h:17.44,n:"Loot Lagoon"},{x:32.1,y:18.46,w:8.16,h:5.49},{x:8.89,y:24.37,w:18.53,h:17.92,n:"The Chest"},{x:28.42,y:24.37,w:17.14,h:15.99},{x:63.45,y:30.25,w:22.77,h:17.49,n:"Boogie Boat"},{x:45.96,y:36.14,w:16.34,h:8.47},{x:29.02,y:41.15,w:11.76,h:4.81,n:"Lantern Landing"},{x:6.29,y:43.08,w:14.03,h:8.08,n:"Arlong Park"},{x:20.72,y:43.38,w:6.69,h:8.26},{x:47.35,y:45.2,w:15.3,h:10.98,n:"Cursed Cavern"},{x:27.81,y:46.35,w:18.94,h:15.12,n:"Giant'S Battlefield"},{x:63.05,y:48.15,w:6.9,h:5.19},{x:72.07,y:48.19,w:13.15,h:20.13,n:"The $.$. Rocky"},{x:19.95,y:52.04,w:6.35,h:15.9},{x:4.7,y:52.33,w:14.3,h:34.95,n:"Windmill Village"},{x:47.65,y:56.77,w:23.62,h:14.93,n:"The Salty Skull"},{x:26.7,y:61.87,w:4.43,h:5.52},{x:31.81,y:63.9,w:15.44,h:10,n:"Loguetown"},{x:19.4,y:68.33,w:9.02,h:11.51},{x:65.69,y:72.09,w:18.14,h:3.36},{x:57.08,y:75.08,w:8.01,h:17.92,n:"Henry"},{x:29.07,y:75.68,w:25.43,h:14.66},{x:67.08,y:75.85,w:22.12,h:15.22,n:"Busy Bay"},{x:20.18,y:80.25,w:8.49,h:9.47},{x:13.68,y:87.68,w:4.36,h:5.19},{x:35.92,y:90.93,w:10.5,h:4.34}],/*@@S43-ZONES@@*/
  s42:[
    {x:24,y:8,w:16,h:14},  {x:57,y:13,w:14,h:11}, {x:71,y:22,w:16,h:13},
    {x:12,y:26,w:14,h:11}, {x:35,y:28,w:16,h:13}, {x:25,y:42,w:17,h:14},
    {x:55,y:42,w:16,h:13}, {x:74,y:49,w:16,h:12}, {x:40,y:59,w:16,h:13},
    {x:15,y:65,w:16,h:12}, {x:62,y:64,w:16,h:12}, {x:40,y:78,w:16,h:12},
    {x:69,y:80,w:15,h:12},
    {x:41,y:12,w:10,h:10}, {x:48,y:20,w:9,h:9},   {x:66,y:9,w:10,h:9},
    {x:8,y:38,w:10,h:9},   {x:43,y:44,w:9,h:9},   {x:47,y:53,w:9,h:8},
    {x:72,y:40,w:10,h:8},  {x:79,y:68,w:8,h:8},  {x:8,y:76,w:10,h:9},
    {x:28,y:78,w:9,h:8},   {x:60,y:86,w:8,h:8},   {x:57,y:76,w:9,h:9},
    {x:20,y:56,w:9,h:8},   {x:60,y:56,w:9,h:7},   {x:84,y:33,w:9,h:9},
    {x:12,y:84,w:10,h:8},  {x:52,y:28,w:8,h:8},   {x:28,y:22,w:8,h:8},
    {x:44,y:71,w:8,h:7},   {x:78,y:38,w:8,h:8}
  ],
  // FNCS 2025 played on the Chapter 6 island. These are the spots teams
  // actually took in the European Grand Final, read off the published drop map
  // rather than drawn by hand -- see tools/extract-zones.js.
  //
  // They are percentages of the ISLAND, not of the screenshot they were
  // measured on, which is why art/map-t1.jpg is cropped to the island too. The
  // two frames were matched by measuring land density per row and column in
  // each image; both put the island at an aspect of 0.99, which is the check
  // that they describe the same thing.
  //
  // Twenty-seven, which is every box the published map labels. Twenty-one came
  // out of the detector -- black outlines read as line segments, red translucent
  // ones as filled regions -- and the six it cannot separate were added by hand
  // and checked by drawing all of them back over the source: the three stacked
  // red boxes down the west coast, the red one in the middle, and the two large
  // black ones at Tayson and Liwshe. Every one of those shares an edge with a
  // neighbour, which is exactly what connected components and segment pairing
  // both get wrong.
  /* Острова 2024-го (Chapter 5): клетки — дроп-карты eucompetitive.com финалов трёх
     Мейджоров (ch5s1/s2/s3-fncs-finals) и Форт-Уэрта (ch5s4-fncs-finals), снятые 21 сентября
     2026 (tools/measured/eucomp-2024-dropmaps.json): координаты редактора в кадре 800×800
     поверх той же картинки 1600×1600, в проценты — делением на восемь. Каждый прямоугольник —
     место, где садилось настоящее дуо того финала (39–43 коробки на 50 дуо). Рейтинг — лут с
     вики (ZONE_STATS), см. tools/build-2025-zone-loot.js. */
  f1:[
    {x:42.79,y:10.81,w:11.75,h:9.88},
    {x:59.02,y:12.13,w:8.63,h:9.13},
    {x:33.83,y:13.22,w:7.5,h:14.38},
    {x:71.98,y:14.82,w:8.75,h:13.63},
    {x:23.16,y:15.17,w:9.71,h:10.35},
    {x:82.39,y:16.16,w:10.63,h:17.75},
    {x:63.55,y:21.84,w:7.5,h:2.88},
    {x:42.21,y:23.22,w:5.25,h:7.63},
    {x:57.35,y:25.99,w:8.75,h:10.88},
    {x:17.21,y:28.94,w:10.88,h:7.5},
    {x:48.61,y:30.42,w:7.63,h:11.13},
    {x:68.77,y:30.55,w:11.5,h:8.38},
    {x:35.64,y:31.89,w:10.88,h:12.88},
    {x:12.91,y:37.4,w:9.88,h:6.38},
    {x:77.24,y:40.28,w:13.88,h:9.88},
    {x:59.71,y:41.6,w:12.75,h:8.38},
    {x:23.68,y:45.46,w:13.88,h:8},
    {x:42.18,y:46.57,w:13.5,h:7.88},
    {x:8.92,y:46.65,w:11.38,h:8.88},
    {x:69.25,y:51.42,w:20.38,h:13.13},
    {x:32.2,y:54.38,w:8.38,h:10},
    {x:57.74,y:55.58,w:10.25,h:9.63},
    {x:49.36,y:55.79,w:7.38,h:9.5},
    {x:9.22,y:56.51,w:10,h:9},
    {x:20.2,y:56.66,w:8.69,h:6.5},
    {x:41.76,y:58.29,w:6.38,h:7.25},
    {x:25.18,y:65.01,w:11.75,h:6.88},
    {x:71.28,y:65.8,w:14.88,h:8.38},
    {x:37.71,y:66.15,w:5.88,h:4.75},
    {x:58.81,y:66.29,w:10.25,h:7},
    {x:44.43,y:66.32,w:7,h:5},
    {x:9.82,y:66.92,w:13.5,h:7},
    {x:43.52,y:72.45,w:7.88,h:11.25},
    {x:25.46,y:72.79,w:6.63,h:9.63},
    {x:33.86,y:73.35,w:8,h:12.63},
    {x:19.66,y:74.69,w:5.25,h:7.13},
    {x:54.08,y:74.72,w:8.13,h:7.38},
    {x:64.17,y:74.94,w:9.13,h:13.38},
    {x:74.42,y:76.12,w:10.25,h:12.13}
  ],
  f2:[
    {x:42.41,y:9.76,w:21,h:9},
    {x:32.21,y:14.99,w:8.25,h:11.5},
    {x:73.17,y:15.18,w:8.88,h:12.88},
    {x:24.58,y:15.54,w:6.88,h:12.75},
    {x:84.26,y:16.08,w:8.5,h:17.25},
    {x:62.13,y:19.73,w:9,h:5.5},
    {x:41.57,y:23.7,w:6.5,h:7.88},
    {x:59.9,y:26.14,w:9.63,h:12.38},
    {x:50.01,y:26.64,w:8.88,h:7.25},
    {x:7.65,y:28.02,w:8.88,h:12.63},
    {x:17.35,y:29.49,w:7.63,h:10},
    {x:25.99,y:32.37,w:9.63,h:7.38},
    {x:36.87,y:32.65,w:10.25,h:13.5},
    {x:70.59,y:32.85,w:10.5,h:7.5},
    {x:48.44,y:34.95,w:8.63,h:11.75},
    {x:25.79,y:41.06,w:9.63,h:7.88},
    {x:80.43,y:41.35,w:11.5,h:8.75},
    {x:13.42,y:41.53,w:11.13,h:7.75},
    {x:59.54,y:42.05,w:11,h:7.13},
    {x:49.19,y:48.62,w:7.63,h:15.88},
    {x:40.34,y:48.74,w:7.86,h:7.25},
    {x:67.51,y:49.87,w:11.5,h:12.88},
    {x:26.32,y:50.01,w:10.5,h:6},
    {x:15.77,y:50.17,w:9.75,h:5.75},
    {x:79.78,y:51.79,w:13.13,h:13.63},
    {x:21.04,y:56.71,w:8,h:7.38},
    {x:30.37,y:57.13,w:8.25,h:11},
    {x:7.78,y:59.17,w:12,h:15.38},
    {x:40.19,y:60.89,w:7.63,h:6},
    {x:57.97,y:61.34,w:6.63,h:11.5},
    {x:65.25,y:66.46,w:10.38,h:10.88},
    {x:78.29,y:66.49,w:10.5,h:8.75},
    {x:40.22,y:67.67,w:7.88,h:4.88},
    {x:26.48,y:72.59,w:7.5,h:10},
    {x:35.05,y:73.83,w:7,h:12.25},
    {x:43.01,y:74.79,w:7.25,h:11},
    {x:53.73,y:75.18,w:9.13,h:8.88},
    {x:18.51,y:75.57,w:7.25,h:7.13},
    {x:75.35,y:78.36,w:8.25,h:9.5},
    {x:64.49,y:79.48,w:9.63,h:10}
  ],
  f3:[
    {x:42.63,y:9.86,w:21,h:9},
    {x:32.21,y:14.99,w:8.25,h:11.5},
    {x:72.17,y:15.18,w:11,h:11.5},
    {x:24.58,y:15.54,w:6.88,h:12.75},
    {x:62.13,y:19.73,w:9,h:5.5},
    {x:41.57,y:23.7,w:6.5,h:7.88},
    {x:7.18,y:24.6,w:16.5,h:16.5},
    {x:59.9,y:26.14,w:9.63,h:12.38},
    {x:48.98,y:30.14,w:8.88,h:12.5},
    {x:36.24,y:32.65,w:10.13,h:13.5},
    {x:70.59,y:32.85,w:10.5,h:7.5},
    {x:25.79,y:41.06,w:9.63,h:6.63},
    {x:81.81,y:41.35,w:10.13,h:8.75},
    {x:59.54,y:42.05,w:11,h:7.13},
    {x:12.55,y:42.15,w:12.25,h:13.5},
    {x:50.68,y:45.76,w:7.75,h:7.25},
    {x:40.64,y:47.16,w:8.49,h:7.63},
    {x:25.69,y:48.46,w:12.75,h:5.13},
    {x:67.51,y:49.87,w:11.5,h:12.88},
    {x:79.78,y:51.79,w:13.13,h:13.63},
    {x:30.53,y:54.38,w:8.25,h:11.13},
    {x:52.79,y:54.4,w:7.13,h:7.5},
    {x:40.17,y:56.06,w:11.5,h:7.5},
    {x:21.04,y:56.71,w:8,h:6.75},
    {x:9.98,y:58.45,w:10.13,h:16.25},
    {x:59.09,y:63.09,w:7,h:8.38},
    {x:50.19,y:64.75,w:7.75,h:6.75},
    {x:67.02,y:64.96,w:9.38,h:11.25},
    {x:40.57,y:65.14,w:7.5,h:5.5},
    {x:77.29,y:66.49,w:9.75,h:10.25},
    {x:31.45,y:70.29,w:7.88,h:11.38},
    {x:41.95,y:71.91,w:7.5,h:12.63},
    {x:21.9,y:72.89,w:7,h:8.13},
    {x:52.98,y:73.08,w:11,h:8.25},
    {x:75.35,y:78.36,w:8.25,h:9.5},
    {x:65.99,y:80.6,w:7.25,h:7.13},
    {x:52.76,y:82.71,w:7.13,h:5.38},
    {x:29.62,y:84.24,w:8.25,h:8.63},
    {x:40.81,y:85.67,w:7.25,h:9.5},
    {x:55.63,y:88.87,w:12.25,h:7}
  ],
  f4:[
    {x:42.63,y:9.86,w:12.25,h:13},
    {x:61.64,y:11.82,w:27,h:7.5},
    {x:25.2,y:14.42,w:13.75,h:15.5},
    {x:75.61,y:20.25,w:9,h:5.13},
    {x:59.13,y:20.35,w:11.25,h:8.75},
    {x:39.94,y:23.7,w:8,h:4.13},
    {x:7.65,y:25.77,w:8.88,h:14.88},
    {x:75.57,y:26.11,w:8.88,h:6.88},
    {x:39.94,y:28.58,w:8.25,h:4.75},
    {x:48.98,y:30.14,w:8.88,h:12.5},
    {x:25.69,y:31.25,w:13.25,h:7.5},
    {x:60.59,y:31.35,w:14.25,h:8.88},
    {x:17.3,y:32.98,w:7,h:6.63},
    {x:36.24,y:39.52,w:10.13,h:8},
    {x:25.79,y:41.06,w:9.63,h:7.5},
    {x:80.93,y:41.35,w:11,h:8.75},
    {x:13.92,y:41.4,w:10.88,h:8.5},
    {x:59.54,y:42.05,w:11,h:7.13},
    {x:41.92,y:48.54,w:14.24,h:7.63},
    {x:69.51,y:49.87,w:9.5,h:12.88},
    {x:15.44,y:51.1,w:7.88,h:11},
    {x:32.28,y:51.51,w:6.75,h:13.88},
    {x:79.78,y:51.79,w:13.13,h:13.63},
    {x:23.96,y:53.03,w:7.5,h:8},
    {x:49.19,y:57.5,w:7.63,h:12.13},
    {x:40.19,y:60.64,w:7.88,h:6.5},
    {x:57.97,y:61.34,w:8.13,h:10.13},
    {x:9.98,y:63.07,w:12.88,h:11.63},
    {x:24.86,y:66.12,w:13,h:5.63},
    {x:77.29,y:66.49,w:9.75,h:10.25},
    {x:67.62,y:67.33,w:8,h:4.63},
    {x:40.23,y:67.78,w:7.88,h:5.13},
    {x:67.67,y:72.59,w:8,h:4.75},
    {x:25.15,y:73.02,w:7.38,h:8.5},
    {x:52.98,y:73.08,w:11,h:8.25},
    {x:33.2,y:74.04,w:7.88,h:7.63},
    {x:41.95,y:75.16,w:7.5,h:9.38},
    {x:16.67,y:75.54,w:7.75,h:5.88},
    {x:75.35,y:78.36,w:8.25,h:9.5},
    {x:65.24,y:80.6,w:8.25,h:7.13},
    {x:50.51,y:82.33,w:10.38,h:5.75},
    {x:29.62,y:84.24,w:10.5,h:8.63},
    {x:55.63,y:88.87,w:12.25,h:7}
  ],
  // ==== FNCS 2023 zones (tools/build-2023-zones.js) ====
  /* Острова 2023-го (Chapter 4): клетки — дроп-карты eucompetitive.com финалов трёх
     Мейджоров (ch4s1/s2/s3-fncs-finals) и Копенгагена (ch4s4-fncs-finals), в проценты кадра
     делением на восемь (tools/build-2023-zones.js). Рейтинг — лут с вики (ZONE_STATS). */
  e1:[
    {x:38.93,y:4.81,w:12.75,h:13.38},
    {x:52.85,y:5.3,w:12.13,h:15.88},
    {x:68.4,y:7.26,w:14.75,h:10.63},
    {x:24.36,y:8.43,w:11.13,h:13},
    {x:13.35,y:16.3,w:9.38,h:7.75},
    {x:39.12,y:19.32,w:11.75,h:7.5},
    {x:73.98,y:19.4,w:10.5,h:7.5},
    {x:59.42,y:21.97,w:13.5,h:7},
    {x:30.06,y:22.95,w:7.63,h:9.5},
    {x:7.83,y:24.8,w:11.88,h:7.5},
    {x:21.39,y:26.12,w:7.88,h:13.75},
    {x:39.41,y:28.14,w:16.25,h:8.38},
    {x:74.47,y:28.16,w:12,h:9.75},
    {x:59.37,y:29.76,w:13.63,h:7},
    {x:7.69,y:33.22,w:12.13,h:9.38},
    {x:35.9,y:38.16,w:9.5,h:7.5},
    {x:53.47,y:38.36,w:14.25,h:7.5},
    {x:74.9,y:39.13,w:9.75,h:6.63},
    {x:12.5,y:43.78,w:19.63,h:8.13},
    {x:74.86,y:46.51,w:11.25,h:5.63},
    {x:63.44,y:47.24,w:9.75,h:7.5},
    {x:51.69,y:47.35,w:10.75,h:7.5},
    {x:33.09,y:47.71,w:11.5,h:12.13},
    {x:18.43,y:53.09,w:9.75,h:12.5},
    {x:74.39,y:53.2,w:8.75,h:10.88},
    {x:8.37,y:53.51,w:8.88,h:14.25},
    {x:53.29,y:56.06,w:9,h:7.5},
    {x:63.43,y:56.07,w:8.63,h:7.13},
    {x:38.62,y:60.61,w:11.5,h:6},
    {x:53.41,y:64.21,w:9.88,h:7.25},
    {x:64.81,y:65.26,w:13,h:14.75},
    {x:23.11,y:67.6,w:13.75,h:12},
    {x:37.87,y:68.46,w:9.88,h:10.25},
    {x:9.81,y:69.5,w:12.25,h:14.75},
    {x:52.53,y:73.18,w:10.88,h:11.38},
    {x:37.82,y:79.57,w:11.75,h:9.88},
    {x:26.21,y:80.93,w:10.63,h:9.63}
  ],
  e2:[
    {x:41.18,y:10.43,w:10.5,h:11.38},
    {x:53.6,y:10.92,w:10.88,h:12.63},
    {x:27.36,y:13.18,w:9.88,h:11.13},
    {x:66.12,y:15.28,w:12.13,h:6.38},
    {x:17.12,y:20.84,w:9.13,h:6.25},
    {x:70.99,y:22.82,w:8.5,h:6.75},
    {x:41,y:23.32,w:9.88,h:6},
    {x:58.54,y:25.35,w:11,h:5.75},
    {x:32.56,y:25.7,w:6.38,h:10.25},
    {x:24.26,y:28.37,w:7.5,h:11.5},
    {x:12.44,y:28.72,w:10.5,h:15.13},
    {x:74.22,y:30.53,w:8.5,h:8},
    {x:40.04,y:30.89,w:14.88,h:7.5},
    {x:58.37,y:31.88,w:11.25,h:5.5},
    {x:52.6,y:39.11,w:13.13,h:6.75},
    {x:36.52,y:39.41,w:9.88,h:8.38},
    {x:71.9,y:39.75,w:9.5,h:6},
    {x:71.73,y:46.51,w:9.88,h:9.25},
    {x:61.82,y:47.24,w:7.63,h:7.5},
    {x:51.69,y:47.35,w:8.63,h:7.5},
    {x:33.59,y:48.59,w:11,h:8.38},
    {x:13.62,y:49.76,w:8.5,h:15.5},
    {x:22.97,y:52.48,w:8.25,h:5.88},
    {x:56.28,y:55.98,w:11,h:6.25},
    {x:73.14,y:57.1,w:13.5,h:10.25},
    {x:42.75,y:58.3,w:10.38,h:6},
    {x:22.91,y:58.92,w:8.38,h:6.25},
    {x:56.74,y:63.76,w:7.13,h:6.25},
    {x:46.93,y:64.96,w:8.13,h:9.63},
    {x:64.47,y:66.47,w:7.13,h:8.13},
    {x:24.73,y:67,w:11.5,h:9},
    {x:37.66,y:67.49,w:8.13,h:7.38},
    {x:14.44,y:68.48,w:9.25,h:11.75},
    {x:79.83,y:68.71,w:8.75,h:10.75},
    {x:56.77,y:70.76,w:6.88,h:5.75},
    {x:38.19,y:76.13,w:8.5,h:8.25},
    {x:47.5,y:76.36,w:7.88,h:7.88},
    {x:29.13,y:77.12,w:8,h:8.13},
    {x:59.1,y:77.37,w:19.75,h:6.63},
    {x:45.54,y:85.01,w:11.38,h:5.88},
    {x:60.67,y:85.17,w:13.88,h:9}
  ],
  e3:[
    {x:38.57,y:10.32,w:8.13,h:7.5},
    {x:54.73,y:10.92,w:9.75,h:12.13},
    {x:27.36,y:13.18,w:9.88,h:11.38},
    {x:66.12,y:15.28,w:12.13,h:6.38},
    {x:47.78,y:16.74,w:5.88,h:8.88},
    {x:17.12,y:20.84,w:9.13,h:6.25},
    {x:41.59,y:21.88,w:5.38,h:7.5},
    {x:70.99,y:22.82,w:8.5,h:6.75},
    {x:58.54,y:25.35,w:11,h:5.75},
    {x:32.56,y:25.7,w:8.38,h:11.13},
    {x:24.26,y:28.37,w:7.5,h:11.5},
    {x:12.44,y:28.72,w:10.5,h:15.13},
    {x:41.66,y:30.14,w:10.38,h:9.5},
    {x:74.22,y:30.53,w:8.5,h:8},
    {x:58.37,y:31.88,w:11.25,h:5.5},
    {x:52.97,y:39.11,w:12.75,h:6.13},
    {x:71.9,y:39.75,w:9.5,h:6},
    {x:44.09,y:40.57,w:7,h:6},
    {x:33.15,y:40.66,w:10,h:7.13},
    {x:62.2,y:46.06,w:8.63,h:9.25},
    {x:71.73,y:46.51,w:9.88,h:9.25},
    {x:54.07,y:47.24,w:6.75,h:7.5},
    {x:33.59,y:48.59,w:10,h:8.38},
    {x:45.38,y:49.06,w:7.75,h:7.5},
    {x:13.62,y:49.76,w:8.5,h:15.5},
    {x:22.93,y:52.97,w:8.25,h:6},
    {x:57.16,y:56.48,w:12.5,h:6.25},
    {x:73.14,y:57.1,w:13.5,h:10.25},
    {x:48.37,y:57.3,w:7.63,h:7},
    {x:32.03,y:58.37,w:8.5,h:7.5},
    {x:41.14,y:58.5,w:5.5,h:5.75},
    {x:22.91,y:59.76,w:8.25,h:6},
    {x:56.74,y:63.76,w:7.13,h:6.25},
    {x:46.93,y:64.96,w:8.13,h:9.63},
    {x:64.47,y:66.47,w:7.13,h:8.13},
    {x:24.73,y:67,w:11.5,h:9},
    {x:37.66,y:67.49,w:8.13,h:7.38},
    {x:14.44,y:68.48,w:9.25,h:11.75},
    {x:79.83,y:68.71,w:8.75,h:10.75},
    {x:56.77,y:70.76,w:6.88,h:5.75},
    {x:39.69,y:76.13,w:7.88,h:14.38},
    {x:29.13,y:77.12,w:9.63,h:8.5},
    {x:59.1,y:77.37,w:19.75,h:5.88},
    {x:48.42,y:84.01,w:14.63,h:10.75},
    {x:64.04,y:85.17,w:12,h:9}
  ],
  e4:[
    {x:41.18,y:10.43,w:10.5,h:10.38},
    {x:53.6,y:10.92,w:9,h:12.63},
    {x:27.36,y:13.18,w:9.88,h:11.38},
    {x:63.49,y:17.9,w:7.13,h:6.25},
    {x:72.09,y:18.55,w:10,h:12},
    {x:17.12,y:20.84,w:9.13,h:6.25},
    {x:42.5,y:21.69,w:8.38,h:7.63},
    {x:58.54,y:25.35,w:11,h:5.75},
    {x:32.06,y:25.7,w:9.5,h:11.13},
    {x:24.26,y:28.37,w:6.63,h:13},
    {x:12.44,y:28.72,w:10.5,h:15.13},
    {x:42.66,y:30.89,w:9.38,h:8.75},
    {x:58.37,y:31.88,w:11.25,h:5.5},
    {x:52.97,y:39.11,w:12.75,h:6.75},
    {x:71.9,y:40.5,w:9.5,h:5.25},
    {x:44.09,y:40.57,w:7,h:6},
    {x:33.15,y:40.66,w:10,h:7.13},
    {x:13.62,y:44.89,w:14.5,h:12},
    {x:71.73,y:46.51,w:9.88,h:9.25},
    {x:56.69,y:47.24,w:11.75,h:7.5},
    {x:33.59,y:48.59,w:10,h:8.38},
    {x:45.38,y:49.06,w:9.63,h:7.5},
    {x:56.28,y:55.98,w:11,h:6.25},
    {x:73.14,y:57.1,w:13.5,h:10.25},
    {x:13.93,y:57.51,w:14.26,h:5.25},
    {x:33.25,y:58.3,w:19.88,h:5.63},
    {x:56.66,y:63.7,w:7.13,h:6.25},
    {x:25.2,y:64.62,w:13,h:9.5},
    {x:39.01,y:64.62,w:7.26,h:9.33},
    {x:47.27,y:64.96,w:7.78,h:10.38},
    {x:64.47,y:66.47,w:7.13,h:8.13},
    {x:13.86,y:66.6,w:10.13,h:17.38},
    {x:79.83,y:68.71,w:8.75,h:10.75},
    {x:56.77,y:70.76,w:6.88,h:5.75},
    {x:25.38,y:75.9,w:12,h:10.65},
    {x:41.38,y:76.11,w:14,h:8.13},
    {x:64.67,y:77.04,w:14.75,h:17.13},
    {x:45.54,y:85.01,w:17.88,h:10.25}
  ],
  // ==== /FNCS 2023 zones ====
  // ==== FNCS 2022 zones (tools/build-2022-zones.js) ====
  /* Острова 2022-го (Chapter 3): клетки — дроп-карты eucompetitive.com Гранд-финалов
     C3S1–C3S3 (ch3s1/s2/s3-fncs-finals; у C3S4 финала не было — клетки C3S3), в проценты кадра
     делением на восемь (tools/build-2022-zones.js). Рейтинг — лут с вики (ZONE_STATS). */
  k1:[
    {x:39.57,y:2.37,w:11.38,h:13},
    {x:18.78,y:4.18,w:18.63,h:10.88},
    {x:63.89,y:10.25,w:9.38,h:18.38},
    {x:52.65,y:10.62,w:10,h:7},
    {x:10.82,y:16.55,w:14.38,h:11.75},
    {x:27.97,y:16.55,w:9.5,h:7.5},
    {x:74.02,y:17.89,w:16,h:10.75},
    {x:52.44,y:18.45,w:10.13,h:6.75},
    {x:41.11,y:20.04,w:10.25,h:10.63},
    {x:26.5,y:25.2,w:11,h:6.5},
    {x:52.61,y:27.02,w:10.5,h:7.5},
    {x:13.66,y:29.2,w:11.63,h:6.25},
    {x:66.5,y:29.79,w:9.75,h:7.5},
    {x:80.35,y:30.53,w:13.88,h:10.25},
    {x:28.2,y:32.53,w:14.13,h:6.63},
    {x:51.81,y:35.55,w:10.13,h:8.63},
    {x:15.04,y:36.39,w:9.63,h:6.63},
    {x:64.13,y:38.06,w:14,h:6.25},
    {x:27.76,y:39.96,w:18.13,h:6.25},
    {x:79.04,y:42.05,w:17,h:17},
    {x:4.46,y:44.35,w:10.13,h:14.13},
    {x:63.51,y:45.36,w:13.25,h:5.88},
    {x:47.75,y:45.69,w:14.38,h:16.75},
    {x:16.05,y:46.97,w:8.25,h:11.38},
    {x:34.02,y:47.41,w:11.13,h:6.75},
    {x:25.42,y:48.16,w:7.38,h:10.75},
    {x:63.89,y:52.19,w:11.88,h:8.25},
    {x:33.83,y:55.19,w:11.38,h:6.88},
    {x:84.26,y:60.52,w:9,h:21},
    {x:74.51,y:61.4,w:8.88,h:9.25},
    {x:15.69,y:63.31,w:14.5,h:8},
    {x:56.81,y:63.49,w:9.75,h:14.38},
    {x:45.83,y:64.08,w:8.38,h:7.5},
    {x:16.06,y:72.62,w:10.38,h:12.75},
    {x:67.58,y:73.8,w:9.75,h:6},
    {x:40.16,y:73.88,w:7.75,h:10.75},
    {x:27.63,y:74.05,w:11.5,h:17.63},
    {x:48.89,y:79.53,w:10.13,h:6.75},
    {x:59.95,y:80.58,w:6.63,h:10.75},
    {x:67.66,y:80.73,w:10,h:12.5},
    {x:47.21,y:86.95,w:12,h:9.5}
  ],
  k2:[
    {x:39.69,y:2.5,w:11.38,h:13},
    {x:18.97,y:4.3,w:18.63,h:10.88},
    {x:63.76,y:10.5,w:9.25,h:16.63},
    {x:52.65,y:10.99,w:9.88,h:6.63},
    {x:27.97,y:16.55,w:9.5,h:7.5},
    {x:11.1,y:16.67,w:14.38,h:10.5},
    {x:52.66,y:18.47,w:9.63,h:6.13},
    {x:73.63,y:18.74,w:6.5,h:10.13},
    {x:42.39,y:19.08,w:8.75,h:10.25},
    {x:81.25,y:21.14,w:10,h:7.75},
    {x:52.61,y:27.02,w:10.5,h:7.5},
    {x:18.87,y:28,w:8.63,h:5.5},
    {x:9,y:28.12,w:9.25,h:5.38},
    {x:66.5,y:29.79,w:7.88,h:7.5},
    {x:85.72,y:30.03,w:8.5,h:10.75},
    {x:38.07,y:30.66,w:6.5,h:11.25},
    {x:75.71,y:32.44,w:8.88,h:8.25},
    {x:45.48,y:33.25,w:5.88,h:8.5},
    {x:12.69,y:34.09,w:8.88,h:4},
    {x:22.18,y:34.11,w:6,h:4},
    {x:52.68,y:35.55,w:8.75,h:7.5},
    {x:28.99,y:37.12,w:8.13,h:7.25},
    {x:62.88,y:38.06,w:11,h:7.5},
    {x:14.95,y:38.71,w:10.38,h:4.88},
    {x:79.39,y:41.98,w:16,h:17.25},
    {x:43.47,y:42.77,w:7.38,h:15.5},
    {x:1.84,y:44.47,w:15.5,h:13},
    {x:32.14,y:45.63,w:10.38,h:8.13},
    {x:20.05,y:46.35,w:10.88,h:12.25},
    {x:64.02,y:46.63,w:11.13,h:5.25},
    {x:51.75,y:46.82,w:9.63,h:15.63},
    {x:63.01,y:52.69,w:12.75,h:7.75},
    {x:31.98,y:54.51,w:10.5,h:5.88},
    {x:84.36,y:60.74,w:9,h:21},
    {x:74.73,y:61.47,w:8.5,h:9},
    {x:15.75,y:63.48,w:14.75,h:8},
    {x:58.68,y:63.49,w:7.88,h:16.38},
    {x:45.83,y:64.08,w:8.38,h:8.25},
    {x:16.31,y:72.62,w:14,h:14},
    {x:31.38,y:73.55,w:18.13,h:9.75},
    {x:67.66,y:75.1,w:8.88,h:10.63},
    {x:51.29,y:81.77,w:12.75,h:15},
    {x:34.26,y:84.39,w:10.13,h:7.38}
  ],
  k3:[
    {x:34.56,y:2.5,w:16.5,h:13},
    {x:11.22,y:8.3,w:15.63,h:20.13},
    {x:63.76,y:10.5,w:9.25,h:16.63},
    {x:52.65,y:10.99,w:9.88,h:6.63},
    {x:27.97,y:16.55,w:9.5,h:7.5},
    {x:39.35,y:17.42,w:11.13,h:12},
    {x:74.12,y:18.39,w:14.38,h:10.5},
    {x:52.66,y:18.47,w:9.63,h:6.13},
    {x:52.61,y:27.02,w:10.5,h:7.5},
    {x:28.58,y:28.03,w:8.13,h:16.25},
    {x:9,y:29.37,w:9.25,h:7.25},
    {x:18.87,y:29.38,w:8.38,h:7.13},
    {x:66.5,y:29.79,w:9.75,h:7.5},
    {x:81.1,y:30.03,w:13.13,h:10.75},
    {x:38.1,y:31.05,w:10.25,h:7.5},
    {x:52.68,y:35.55,w:8.75,h:7.5},
    {x:16.45,y:37.46,w:8.13,h:6.13},
    {x:1.84,y:37.97,w:9,h:18.75},
    {x:64.13,y:38.06,w:14,h:7.5},
    {x:40.99,y:39.72,w:9.13,h:6.38},
    {x:79.39,y:41.98,w:16,h:17.25},
    {x:12.28,y:46.02,w:9.13,h:11.88},
    {x:22.3,y:46.35,w:8.63,h:12.25},
    {x:64.02,y:46.63,w:11.13,h:5.25},
    {x:47.25,y:46.82,w:14.13,h:15.63},
    {x:32.14,y:46.88,w:10.38,h:6.38},
    {x:63.01,y:52.69,w:12.75,h:7.75},
    {x:31.9,y:53.89,w:10.5,h:6.5},
    {x:2.18,y:59.21,w:14.25,h:10.5},
    {x:84.36,y:60.74,w:9,h:11.5},
    {x:74.73,y:61.47,w:8.5,h:9},
    {x:21.62,y:63.48,w:8.88,h:8},
    {x:58.68,y:63.49,w:7.88,h:16.38},
    {x:45.83,y:64.08,w:8.38,h:8.25},
    {x:12.19,y:72.62,w:18.5,h:6.88},
    {x:77.72,y:73.12,w:12.88,h:9.88},
    {x:32.26,y:73.67,w:17.25,h:8},
    {x:67.77,y:75.09,w:8.88,h:10.88},
    {x:50.67,y:81.77,w:8.63,h:7.75},
    {x:34.26,y:82.89,w:10.13,h:8.88},
    {x:59.96,y:83.49,w:6.63,h:10.75}
  ],
  k4:[
    {x:34.56,y:2.5,w:16.5,h:13},
    {x:11.22,y:8.3,w:15.63,h:20.13},
    {x:63.76,y:10.5,w:9.25,h:16.63},
    {x:52.65,y:10.99,w:9.88,h:6.63},
    {x:27.97,y:16.55,w:9.5,h:7.5},
    {x:39.35,y:17.42,w:11.13,h:12},
    {x:74.12,y:18.39,w:14.38,h:10.5},
    {x:52.66,y:18.47,w:9.63,h:6.13},
    {x:52.61,y:27.02,w:10.5,h:7.5},
    {x:28.58,y:28.03,w:8.13,h:16.25},
    {x:9,y:29.37,w:9.25,h:7.25},
    {x:18.87,y:29.38,w:8.38,h:7.13},
    {x:66.5,y:29.79,w:9.75,h:7.5},
    {x:81.1,y:30.03,w:13.13,h:10.75},
    {x:38.1,y:31.05,w:10.25,h:7.5},
    {x:52.68,y:35.55,w:8.75,h:7.5},
    {x:16.45,y:37.46,w:8.13,h:6.13},
    {x:1.84,y:37.97,w:9,h:18.75},
    {x:64.13,y:38.06,w:14,h:7.5},
    {x:40.99,y:39.72,w:9.13,h:6.38},
    {x:79.39,y:41.98,w:16,h:17.25},
    {x:12.28,y:46.02,w:9.13,h:11.88},
    {x:22.3,y:46.35,w:8.63,h:12.25},
    {x:64.02,y:46.63,w:11.13,h:5.25},
    {x:47.25,y:46.82,w:14.13,h:15.63},
    {x:32.14,y:46.88,w:10.38,h:6.38},
    {x:63.01,y:52.69,w:12.75,h:7.75},
    {x:31.9,y:53.89,w:10.5,h:6.5},
    {x:2.18,y:59.21,w:14.25,h:10.5},
    {x:84.36,y:60.74,w:9,h:11.5},
    {x:74.73,y:61.47,w:8.5,h:9},
    {x:21.62,y:63.48,w:8.88,h:8},
    {x:58.68,y:63.49,w:7.88,h:16.38},
    {x:45.83,y:64.08,w:8.38,h:8.25},
    {x:12.19,y:72.62,w:18.5,h:6.88},
    {x:77.72,y:73.12,w:12.88,h:9.88},
    {x:32.26,y:73.67,w:17.25,h:8},
    {x:67.77,y:75.09,w:8.88,h:10.88},
    {x:50.67,y:81.77,w:8.63,h:7.75},
    {x:34.26,y:82.89,w:10.13,h:8.88},
    {x:59.96,y:83.49,w:6.63,h:10.75}
  ],
  // ==== /FNCS 2022 zones ====
  // ==== FNCS 2021 zones (tools/build-2021-zones.js) ====
  /* Острова 2021-го (Chapter 2): клетки — дроп-карты eucompetitive.com Гранд-финалов
     C2S5–C2S8 (ch2s5 … ch2s8-fncs-finals), в проценты кадра
     делением на восемь (tools/build-2021-zones.js). Рейтинг — лут с вики (ZONE_STATS). */
  j1:[
    {x:15.94,y:3.47,w:15.75,h:9.25},
    {x:65.35,y:6.52,w:14.5,h:12.88},
    {x:33.1,y:6.67,w:17.25,h:11.88},
    {x:54.38,y:7.32,w:9.63,h:8},
    {x:81.8,y:13.64,w:8.88,h:7.5},
    {x:11.04,y:13.88,w:18.13,h:14.38},
    {x:39.25,y:19.94,w:9.13,h:10},
    {x:50.57,y:20.24,w:10.13,h:18.75},
    {x:63.06,y:20.44,w:15.5,h:10.63},
    {x:2.38,y:29.47,w:10.38,h:18.5},
    {x:15.82,y:30.7,w:12.25,h:10.13},
    {x:32.47,y:33.25,w:12.25,h:18.88},
    {x:61.9,y:34.46,w:7.75,h:7.88},
    {x:71.26,y:35.08,w:14.75,h:23.38},
    {x:87.07,y:37.64,w:9.13,h:12},
    {x:45.99,y:43.54,w:21,h:10.75},
    {x:8.26,y:49.82,w:14.5,h:8},
    {x:26.36,y:53.69,w:16.63,h:14.5},
    {x:46.03,y:55.4,w:18,h:13.5},
    {x:8.13,y:59.64,w:17,h:15.13},
    {x:81.14,y:60.7,w:10.5,h:7.25},
    {x:65.16,y:63.19,w:9.13,h:9.13},
    {x:26.46,y:70.19,w:10.5,h:7.5},
    {x:37.9,y:72.17,w:12.88,h:17.38},
    {x:76.12,y:72.33,w:20.63,h:14.63},
    {x:59.9,y:73.8,w:8.63,h:11.38},
    {x:51.87,y:74.3,w:7.25,h:11.25},
    {x:51.6,y:86.72,w:17.75,h:10.75}
  ],
  j2:[
    {x:11.29,y:4.38,w:18.13,h:21.88},
    {x:54.63,y:7.32,w:9.63,h:8.88},
    {x:65.35,y:7.77,w:14.5,h:23},
    {x:32.35,y:8.42,w:12.25,h:10.38},
    {x:80.96,y:13.66,w:9.63,h:9.88},
    {x:39.25,y:19.94,w:8.5,h:10},
    {x:50.08,y:23.22,w:10.38,h:17},
    {x:2.63,y:28.02,w:12,h:19.88},
    {x:16.44,y:30.18,w:11.75,h:10.13},
    {x:33.84,y:32.37,w:10.75,h:18},
    {x:61.47,y:32.82,w:9.13,h:9.38},
    {x:72.64,y:35.08,w:14.25,h:23.38},
    {x:88.11,y:37.64,w:8.75,h:12},
    {x:47.51,y:41.82,w:9.5,h:9.25},
    {x:58.51,y:42.99,w:12.88,h:11.25},
    {x:8.26,y:49.82,w:14.5,h:8},
    {x:27.49,y:53.69,w:15.5,h:11.75},
    {x:46.03,y:55.65,w:16.38,h:13.25},
    {x:11.13,y:59.64,w:15,h:22.25},
    {x:81.14,y:60.7,w:10.5,h:7.88},
    {x:64.53,y:63.19,w:9.5,h:9.13},
    {x:76.12,y:69.58,w:17.13,h:8.88},
    {x:27.08,y:70.19,w:9.88,h:7.5},
    {x:38.15,y:73.05,w:12.63,h:22.75},
    {x:54.19,y:73.6,w:12,h:17.75},
    {x:70.68,y:79.33,w:17.13,h:18.13}
  ],
  j3:[
    {x:11.29,y:4.38,w:19.25,h:21.88},
    {x:54.63,y:7.32,w:9.63,h:8.88},
    {x:65.07,y:7.66,w:13.13,h:13},
    {x:32.35,y:8.42,w:12.25,h:10.38},
    {x:79.59,y:13.66,w:11,h:10.5},
    {x:39.25,y:19.94,w:8.5,h:10},
    {x:64.87,y:21.87,w:13.38,h:9.63},
    {x:50.08,y:23.22,w:10.38,h:17},
    {x:5.75,y:28.02,w:10.75,h:19.88},
    {x:17.32,y:30.18,w:10.88,h:10.13},
    {x:33.84,y:32.37,w:10.75,h:18},
    {x:61.47,y:32.82,w:9.13,h:11.13},
    {x:72.64,y:35.08,w:14.25,h:23.38},
    {x:88.11,y:37.64,w:8.75,h:12},
    {x:47.51,y:44.94,w:20,h:9.38},
    {x:8.26,y:49.82,w:14.5,h:8},
    {x:28.49,y:54.31,w:14.5,h:13.88},
    {x:46.03,y:55.65,w:16.38,h:13.25},
    {x:11.13,y:59.64,w:16.5,h:24.88},
    {x:81.14,y:60.7,w:10.5,h:7.88},
    {x:64.53,y:63.19,w:9.5,h:9.13},
    {x:28.33,y:70.19,w:8.63,h:7.5},
    {x:76.12,y:71.83,w:16.63,h:14.88},
    {x:37.9,y:73.05,w:12.88,h:22.75},
    {x:51.56,y:73.6,w:7.63,h:10.75},
    {x:59.96,y:74.17,w:9.25,h:9.88},
    {x:51.8,y:85.22,w:16.88,h:12},
    {x:71.06,y:89.08,w:13.38,h:8.38}
  ],
  j4:[
    {x:11.29,y:4.38,w:15.5,h:21.88},
    {x:54.63,y:7.32,w:9.63,h:8.88},
    {x:65.35,y:7.77,w:14.5,h:13.88},
    {x:32.34,y:8.07,w:13.5,h:9.88},
    {x:80.96,y:13.66,w:7.88,h:9.88},
    {x:28.89,y:18.83,w:9.88,h:11.63},
    {x:40.25,y:20.56,w:7.5,h:9.38},
    {x:50.08,y:23.22,w:10.38,h:17},
    {x:61.91,y:24.15,w:14.63,h:7.5},
    {x:16.44,y:30.18,w:11.75,h:10.13},
    {x:35.09,y:32.37,w:9.5,h:18},
    {x:61.47,y:32.82,w:9.13,h:9.38},
    {x:72.64,y:35.08,w:14.25,h:23.38},
    {x:88.11,y:37.64,w:9,h:15.75},
    {x:18.6,y:41.62,w:14.88,h:8.5},
    {x:47.51,y:42.99,w:20.63,h:11.25},
    {x:8.26,y:50.82,w:14.5,h:7},
    {x:28.74,y:53.69,w:14.25,h:11.75},
    {x:46.03,y:55.65,w:16.38,h:13.25},
    {x:11.13,y:59.64,w:16.13,h:24.13},
    {x:81.14,y:60.7,w:10.5,h:7.88},
    {x:64.53,y:63.19,w:9.5,h:9.13},
    {x:76.74,y:69.58,w:18.25,h:17.38},
    {x:27.96,y:70.19,w:9,h:7.5},
    {x:37.9,y:73.05,w:14.75,h:22.75},
    {x:53.94,y:73.6,w:12.25,h:13.38},
    {x:65.44,y:88.25,w:19.63,h:9.63}
  ],
  // ==== /FNCS 2021 zones ====
  // ==== FNCS 2019–2020 zones (tools/build-mx-islands.js) ====
  /* Острова 2019–2020: интерактивные карты вики (картинка — сама карта режима), клетки —
     7 % кадра вокруг именованных локаций (tools/build-mx-islands.js). Рейтинг — лут вики (ZONE_STATS). */
  h1:[{x:13.22,y:6.31,w:12.4,h:9.92},{x:32.06,y:9.62,w:12.4,h:9.16},{x:9.38,y:16.83,w:12.15,h:6.26},{x:78.38,y:17.31,w:9.56,h:12.4},{x:52.65,y:18.88,w:9.49,h:12.4},{x:39.06,y:19.39,w:7.4,h:6.66},{x:24.05,y:23.2,w:10.23,h:12.4},{x:11.67,y:23.7,w:7.4,h:5.69},{x:70.52,y:23.83,w:7.26,h:12.4},{x:62.74,y:27.95,w:6.99,h:7.4},{x:15.72,y:29.99,w:7.4,h:6.69},{x:37.26,y:31.06,w:12.4,h:12.06},{x:82.61,y:36.18,w:12.4,h:9.69},{x:21.43,y:37.28,w:7.4,h:6.88},{x:2.83,y:38.3,w:12.4,h:12.4},{x:55.7,y:42.11,w:10.2,h:9.44},{x:31.11,y:43.71,w:12.4,h:12.06},{x:20.18,y:44.76,w:7.4,h:7.04},{x:47.4,y:45.03,w:7.4,h:6.73},{x:79.85,y:46.46,w:7.4,h:6.84},{x:67.83,y:46.9,w:8.36,h:12.4},{x:51.05,y:52.36,w:7.4,h:5.68},{x:76.79,y:53.91,w:5.86,h:7.06},{x:85.44,y:55.67,w:7.4,h:7.4},{x:31.38,y:56.6,w:11.64,h:9.28},{x:49.82,y:58.64,w:12.4,h:6.13},{x:69.22,y:62.24,w:7.4,h:7.4},{x:19.14,y:63.84,w:11.64,h:12.4},{x:56.58,y:65.37,w:7.4,h:6.9},{x:46.18,y:66.38,w:7.4,h:7.4},{x:39.17,y:66.48,w:6.22,h:6.78},{x:77.44,y:67.36,w:10.11,h:12.4},{x:5.27,y:67.62,w:12.4,h:12.4},{x:32.35,y:70.06,w:6.22,h:6.39},{x:55.18,y:72.87,w:10.9,h:8.16},{x:33.39,y:77.05,w:6.39,h:5.36},{x:40.38,y:77.41,w:6.39,h:7.4},{x:47.37,y:82.67,w:6.18,h:7.4},{x:26.75,y:83.01,w:10.96,h:8.87},{x:54.14,y:84.21,w:8.68,h:12.4}],
  h3:[{x:13.22,y:6.31,w:9.39,h:9.92},{x:32.62,y:9,w:11.83,h:9.47},{x:23.2,y:10.55,w:8.82,h:12.22},{x:9.38,y:16.83,w:12.15,h:6.26},{x:78.38,y:17.31,w:9.56,h:12.4},{x:52.65,y:18.88,w:9.49,h:12.4},{x:39.06,y:19.08,w:7.4,h:6.97},{x:24.05,y:23.37,w:10.23,h:12.22},{x:11.67,y:23.7,w:7.4,h:5.69},{x:70.52,y:23.83,w:7.26,h:12.4},{x:62.74,y:27.95,w:6.99,h:7.4},{x:15.72,y:29.99,w:7.4,h:6.69},{x:37.26,y:31.06,w:12.4,h:12.06},{x:82.61,y:36.18,w:12.4,h:9.69},{x:21.43,y:37.28,w:7.4,h:6.88},{x:2.83,y:38.3,w:12.4,h:12.4},{x:55.08,y:38.76,w:9.57,h:11.12},{x:31.11,y:43.71,w:12.4,h:12.06},{x:20.18,y:44.76,w:7.4,h:7.04},{x:47.4,y:45.03,w:7.07,h:6.73},{x:79.85,y:46.46,w:7.4,h:7.19},{x:67.83,y:46.9,w:10.66,h:12.4},{x:51.05,y:52.36,w:7.4,h:5.68},{x:16.55,y:55.57,w:12.4,h:10.04},{x:85.44,y:55.67,w:7.4,h:7.4},{x:31.38,y:56.6,w:11.64,h:9.28},{x:49.82,y:58.64,w:12.4,h:6.13},{x:69.22,y:62.24,w:7.4,h:7.4},{x:56.58,y:65.37,w:7.4,h:6.9},{x:19.14,y:66.2,w:11.64,h:10.04},{x:46.18,y:66.38,w:7.4,h:7.4},{x:39.17,y:66.48,w:6.22,h:6.78},{x:77.44,y:67.36,w:10.11,h:12.4},{x:5.27,y:67.62,w:12.4,h:12.4},{x:32.35,y:70.06,w:6.22,h:7.4},{x:55.18,y:72.87,w:10.9,h:8.24},{x:40.3,y:78.41,w:6.93,h:7.4},{x:26.75,y:79.49,w:12.4,h:12.4},{x:47.83,y:82.83,w:5.71,h:7.4},{x:54.14,y:84.21,w:8.68,h:12.4}],
  h4:[{x:47.41,y:6.73,w:7.4,h:7.4},{x:55.96,y:7.91,w:10.45,h:12.4},{x:79.54,y:14.01,w:12.4,h:12.4},{x:11.44,y:16.42,w:7.4,h:7.4},{x:22.56,y:19.36,w:7.4,h:7.4},{x:30.59,y:19.68,w:7.4,h:7.4},{x:39.43,y:19.7,w:10.74,h:12.4},{x:52.37,y:21.48,w:7.4,h:7.4},{x:65.78,y:23.4,w:7.4,h:7.4},{x:6.51,y:27.45,w:7.4,h:7.4},{x:82.58,y:30.77,w:7.4,h:6.48},{x:16.9,y:31.28,w:12.4,h:12.4},{x:59.57,y:32.67,w:9.92,h:12.4},{x:37.1,y:33.23,w:7.4,h:7.4},{x:50.55,y:34.68,w:7.4,h:7.4},{x:78.11,y:37.85,w:7.4,h:6.48},{x:3.95,y:39.16,w:7.4,h:7.4},{x:86.13,y:39.56,w:12.4,h:10.69},{x:70.1,y:40.01,w:7.4,h:7.4},{x:34.55,y:41.38,w:12.4,h:10.06},{x:48.25,y:44.84,w:7.4,h:7.4},{x:13.92,y:48.44,w:12.4,h:10.54},{x:61.83,y:54.06,w:7.4,h:7.4},{x:34.52,y:54.79,w:12.4,h:9.44},{x:80.23,y:58.94,w:9.49,h:12.4},{x:8.85,y:60.22,w:7.4,h:5.9},{x:20.57,y:60.95,w:7.4,h:7.15},{x:63.82,y:62.9,w:12.4,h:10.73},{x:90.31,y:63.19,w:6.99,h:7.4},{x:31.24,y:64.83,w:7.4,h:6.05},{x:11.83,y:66.72,w:5.55,h:5.9},{x:17.98,y:68.7,w:5.55,h:7.15},{x:25.88,y:71.48,w:12.4,h:9.01},{x:42.13,y:73.23,w:7.4,h:7.4},{x:79.5,y:74.84,w:7.4,h:7.4},{x:53.96,y:77.25,w:9.34,h:12.4},{x:69.13,y:78.07,w:7.4,h:7.26},{x:63.9,y:85.94,w:6.84,h:5.74},{x:73.38,y:90.47,w:7.4,h:7.4},{x:58.59,y:92.27,w:7.4,h:5.87}],
  i1:[{x:85.86,y:2.07,w:12.4,h:11.87},{x:12.06,y:3.57,w:12.4,h:11.08},{x:47.41,y:6.73,w:7.4,h:7.4},{x:55.96,y:7.91,w:10.45,h:12.4},{x:79.54,y:14.54,w:12.4,h:11.87},{x:11.44,y:16.42,w:7.4,h:7.4},{x:22.56,y:19.36,w:7.4,h:7.4},{x:37.77,y:19.7,w:12.4,h:12.4},{x:52.37,y:21.48,w:7.4,h:7.4},{x:65.78,y:23.4,w:7.4,h:7.4},{x:6.51,y:27.45,w:7.4,h:7.4},{x:16.9,y:31.28,w:12.4,h:12.4},{x:59.57,y:32.67,w:9.92,h:12.4},{x:37.1,y:33.23,w:7.4,h:7.4},{x:50.55,y:34.68,w:7.4,h:7.4},{x:78.11,y:36.92,w:7.4,h:7.4},{x:86.13,y:37.84,w:12.4,h:12.39},{x:3.95,y:39.16,w:7.4,h:7.4},{x:70.1,y:40.01,w:7.4,h:7.4},{x:34.55,y:41.38,w:11.5,h:10.06},{x:46.65,y:43.76,w:11.5,h:10.7},{x:13.92,y:48.44,w:12.4,h:10.54},{x:84.72,y:50.84,w:12.4,h:9.95},{x:34.52,y:55.06,w:12.4,h:9.17},{x:8.85,y:60.22,w:7.4,h:5.9},{x:20.57,y:60.95,w:7.4,h:7.15},{x:63.82,y:61.23,w:12.4,h:12.4},{x:80.23,y:61.38,w:9.49,h:9.95},{x:90.31,y:63.19,w:6.99,h:7.4},{x:31.24,y:64.83,w:7.4,h:6.05},{x:11.83,y:66.72,w:5.55,h:5.9},{x:17.98,y:68.7,w:5.55,h:6.33},{x:25.88,y:71.48,w:12.4,h:9.01},{x:42.13,y:73.23,w:7.4,h:7.4},{x:79.5,y:74.84,w:7.4,h:7.4},{x:11.87,y:75.63,w:12.4,h:9.09},{x:53.96,y:77.25,w:9.34,h:12.4},{x:69.13,y:78.07,w:7.4,h:7.26},{x:63.9,y:85.94,w:6.84,h:7.26},{x:73.38,y:90.47,w:7.4,h:7.4}],
  i2:[{x:47.41,y:6.73,w:7.4,h:7.4},{x:56.51,y:10.41,w:7.4,h:7.4},{x:65.34,y:11.63,w:7.4,h:7.4},{x:79.54,y:14.01,w:12.4,h:12.4},{x:11.44,y:16.42,w:7.4,h:7.4},{x:37.77,y:19.7,w:12.4,h:12.4},{x:23.68,y:19.75,w:7.4,h:7.4},{x:52.37,y:21.48,w:7.4,h:7.4},{x:65.78,y:23.4,w:7.4,h:7.4},{x:6.51,y:27.45,w:7.4,h:7.4},{x:16.9,y:31.28,w:12.4,h:12.4},{x:59.57,y:32.67,w:9.92,h:12.4},{x:37.1,y:33.23,w:7.4,h:7.4},{x:50.55,y:34.68,w:7.4,h:7.4},{x:78.11,y:36.92,w:7.4,h:7.4},{x:3.95,y:39.16,w:7.4,h:7.4},{x:70.1,y:40.01,w:7.4,h:7.4},{x:88.63,y:40.34,w:7.4,h:7.4},{x:34.55,y:41.38,w:11.5,h:10.06},{x:46.65,y:43.76,w:11.5,h:10.98},{x:13.92,y:48.44,w:12.4,h:10.54},{x:78.1,y:48.8,w:7.4,h:7.4},{x:37.02,y:57.29,w:7.4,h:6.94},{x:80.23,y:58.94,w:9.49,h:11.21},{x:8.85,y:60.22,w:7.4,h:5.9},{x:20.57,y:60.95,w:7.4,h:7.4},{x:63.82,y:61.23,w:10.8,h:12.4},{x:90.31,y:63.19,w:6.99,h:7.4},{x:31.24,y:64.83,w:7.4,h:6.94},{x:11.83,y:66.72,w:7.4,h:5.29},{x:76.63,y:70.75,w:9.4,h:9.24},{x:12.03,y:72.61,w:12.4,h:9.29},{x:42.13,y:73.23,w:7.4,h:7.4},{x:56.59,y:77.25,w:6.71,h:12.4},{x:27.91,y:78.06,w:12.4,h:12.4},{x:69.13,y:78.07,w:6.73,h:7.26},{x:76.45,y:81.11,w:6.73,h:7.4},{x:63.9,y:85.94,w:6.84,h:7.26},{x:48.73,y:86.14,w:7.26,h:7.4},{x:73.38,y:90.47,w:7.4,h:7.4}],
  i3:[{x:47.41,y:6.73,w:7.4,h:7.4},{x:55.96,y:7.91,w:8.37,h:12.4},{x:65.34,y:11.63,w:7.4,h:7.4},{x:79.54,y:14.01,w:12.4,h:12.4},{x:18.42,y:14.5,w:5.52,h:12.4},{x:11.44,y:16.42,w:6.38,h:7.4},{x:37.77,y:19.7,w:10.79,h:12.4},{x:24.54,y:19.75,w:6.54,h:7.4},{x:50.06,y:21.58,w:7.4,h:7.4},{x:6.51,y:27.45,w:7.4,h:7.4},{x:16.9,y:31.28,w:12.4,h:12.4},{x:37.1,y:33.23,w:7.4,h:7.4},{x:59.72,y:33.79,w:9.84,h:12.4},{x:50.55,y:34.68,w:7.4,h:7.4},{x:78.11,y:36.92,w:7.4,h:7.4},{x:86.13,y:37.84,w:12.4,h:12.4},{x:3.95,y:39.16,w:7.4,h:7.4},{x:70.16,y:40.01,w:7.34,h:7.4},{x:34.55,y:41.38,w:11.5,h:10.06},{x:46.65,y:43.76,w:11.5,h:10.7},{x:13.92,y:48.44,w:12.4,h:10.54},{x:34.52,y:55.06,w:12.4,h:9.17},{x:80.23,y:58.94,w:9.49,h:11.21},{x:8.85,y:60.22,w:7.4,h:5.9},{x:20.57,y:60.95,w:7.4,h:7.15},{x:63.82,y:61.23,w:10.8,h:12.4},{x:90.31,y:63.19,w:6.99,h:7.4},{x:31.24,y:64.83,w:7.4,h:5.92},{x:11.83,y:66.72,w:5.55,h:5.9},{x:17.98,y:68.7,w:5.55,h:7.15},{x:76.63,y:70.75,w:9.4,h:9.24},{x:26.19,y:71.35,w:12.4,h:8.88},{x:42.13,y:73.23,w:7.4,h:7.4},{x:13,y:76.84,w:12.4,h:10.3},{x:56.59,y:77.25,w:6.71,h:12.4},{x:69.13,y:78.07,w:6.73,h:7.26},{x:76.45,y:81.11,w:6.73,h:7.4},{x:63.9,y:85.94,w:6.84,h:7.26},{x:48.73,y:86.14,w:7.26,h:7.4},{x:73.38,y:90.47,w:7.4,h:7.4}],
  g5:[{x:13.55,y:6.14,w:12.4,h:9.92},{x:67.52,y:13.89,w:12.4,h:10.55},{x:46.32,y:14.81,w:10.9,h:12.4},{x:9.23,y:16.66,w:12.22,h:9.92},{x:84.46,y:16.91,w:7.4,h:7.4},{x:58.81,y:19.53,w:7.4,h:7.4},{x:23.98,y:23.2,w:10.3,h:12.4},{x:75.75,y:25.05,w:12.4,h:10.54},{x:89.18,y:26.44,w:7.4,h:7.4},{x:59.88,y:27.98,w:12.4,h:6.21},{x:15.58,y:29.4,w:7.4,h:7.26},{x:36.86,y:31.28,w:12.4,h:12.06},{x:65.23,y:34.79,w:5.28,h:5.77},{x:82.61,y:36.19,w:12.4,h:9.67},{x:71.11,y:36.68,w:5.28,h:7.4},{x:21.43,y:37.26,w:7.4,h:6.83},{x:2.29,y:38.7,w:12.4,h:12.4},{x:30.74,y:43.94,w:12.4,h:12.01},{x:20.12,y:44.69,w:7.4,h:6.97},{x:57.64,y:44.82,w:8.49,h:11.3},{x:47.4,y:45.03,w:7.4,h:6.73},{x:79.85,y:46.46,w:7.4,h:6.84},{x:67.83,y:46.9,w:8.36,h:12.4},{x:51.05,y:52.36,w:5.99,h:5.94},{x:76.79,y:53.91,w:5.86,h:7.06},{x:16.51,y:55.78,w:12.4,h:12.4},{x:86.33,y:56.01,w:7.4,h:7.4},{x:30.33,y:56.55,w:8.84,h:9.09},{x:39.77,y:57.67,w:6.34,h:7.4},{x:50.35,y:58.9,w:12.4,h:6.13},{x:56.58,y:65.63,w:7.4,h:6.63},{x:32.52,y:66.24,w:6.14,h:6.63},{x:39.26,y:66.44,w:6.14,h:6.83},{x:46.09,y:67.02,w:7.4,h:7.4},{x:74.98,y:67.23,w:12.4,h:12.4},{x:55.14,y:72.87,w:10.95,h:8.11},{x:33.39,y:76.04,w:7.4,h:6.75},{x:47.41,y:82.58,w:6.12,h:7.4},{x:28.92,y:83.39,w:12.4,h:9.25},{x:54.13,y:84.33,w:8.62,h:12.4}],
  g6:[{x:13.55,y:6.14,w:12.4,h:9.92},{x:67.52,y:13.89,w:12.4,h:10.55},{x:48.49,y:14.81,w:8.73,h:12.4},{x:9.23,y:16.66,w:12.22,h:9.92},{x:84.46,y:16.91,w:7.4,h:7.4},{x:58.81,y:19.53,w:7.4,h:7.4},{x:40.16,y:20.9,w:7.4,h:7.4},{x:23.98,y:23.2,w:10.3,h:12.4},{x:75.75,y:25.05,w:12.4,h:10.54},{x:89.18,y:26.44,w:7.4,h:7.4},{x:59.88,y:27.98,w:12.4,h:6.21},{x:15.58,y:29.4,w:7.4,h:7.26},{x:36.86,y:31.28,w:12.4,h:12.06},{x:65.23,y:34.79,w:5.28,h:5.77},{x:82.61,y:36.19,w:12.4,h:9.67},{x:71.11,y:36.68,w:5.28,h:7.4},{x:21.43,y:37.26,w:7.4,h:6.83},{x:2.29,y:38.7,w:12.4,h:12.4},{x:30.74,y:43.94,w:12.4,h:12.01},{x:20.12,y:44.69,w:7.4,h:6.97},{x:57.64,y:44.82,w:8.49,h:11.3},{x:47.4,y:45.03,w:7.4,h:6.73},{x:79.85,y:46.46,w:7.4,h:6.84},{x:67.83,y:46.9,w:8.36,h:12.4},{x:51.05,y:52.36,w:5.99,h:5.94},{x:76.79,y:53.91,w:5.86,h:7.06},{x:16.51,y:55.78,w:12.4,h:12.4},{x:86.33,y:56.01,w:7.4,h:7.4},{x:30.33,y:56.55,w:12.4,h:9.09},{x:50.35,y:58.9,w:12.4,h:6.13},{x:56.58,y:65.63,w:7.4,h:6.63},{x:32.52,y:66.24,w:6.14,h:6.63},{x:39.26,y:66.44,w:6.14,h:6.83},{x:46.09,y:67.02,w:7.4,h:7.4},{x:74.98,y:67.23,w:12.4,h:12.4},{x:55.14,y:72.87,w:10.95,h:8.11},{x:33.39,y:76.04,w:7.4,h:6.75},{x:47.41,y:82.58,w:6.12,h:7.4},{x:28.92,y:83.39,w:12.4,h:9.25},{x:54.13,y:84.33,w:8.62,h:12.4}],
  g7:[{x:13.55,y:6.14,w:12.4,h:9.92},{x:67.52,y:13.89,w:12.4,h:10.55},{x:48.49,y:14.81,w:8.73,h:12.4},{x:9.23,y:16.66,w:12.22,h:9.92},{x:84.46,y:16.91,w:7.4,h:7.4},{x:58.81,y:19.53,w:7.4,h:7.4},{x:40.16,y:20.9,w:7.4,h:7.4},{x:23.98,y:23.2,w:10.3,h:12.4},{x:75.75,y:25.05,w:12.4,h:10.54},{x:89.18,y:26.44,w:7.4,h:7.4},{x:59.88,y:27.98,w:12.4,h:6.21},{x:15.58,y:29.4,w:7.4,h:7.26},{x:36.86,y:31.28,w:12.4,h:12.06},{x:65.23,y:34.79,w:5.28,h:5.77},{x:82.61,y:36.19,w:12.4,h:9.67},{x:71.11,y:36.68,w:5.28,h:7.4},{x:21.43,y:37.26,w:7.4,h:7.26},{x:2.29,y:38.7,w:12.4,h:12.4},{x:30.74,y:43.94,w:12.4,h:12.01},{x:57.64,y:44.82,w:8.49,h:11.3},{x:47.4,y:45.03,w:7.4,h:6.73},{x:79.85,y:46.46,w:7.4,h:6.84},{x:67.83,y:46.9,w:8.36,h:12.4},{x:51.05,y:52.36,w:5.99,h:5.94},{x:76.79,y:53.91,w:5.86,h:7.06},{x:86.33,y:56.01,w:7.4,h:7.4},{x:31.24,y:56.55,w:11.49,h:9.09},{x:50.35,y:58.9,w:12.4,h:6.13},{x:19.15,y:63.98,w:11.49,h:12.4},{x:56.58,y:65.63,w:7.4,h:6.63},{x:32.52,y:66.24,w:6.14,h:6.63},{x:39.26,y:66.44,w:6.14,h:6.83},{x:46.09,y:67.02,w:7.4,h:7.4},{x:5.68,y:67.18,w:12.4,h:12.4},{x:74.98,y:67.23,w:12.4,h:12.4},{x:55.14,y:72.87,w:10.95,h:8.11},{x:33.39,y:76.04,w:7.4,h:6.51},{x:47.41,y:82.58,w:6.12,h:7.4},{x:26.57,y:83.15,w:12.4,h:9.01},{x:54.13,y:84.33,w:8.62,h:12.4}],
  // ==== /FNCS 2019–2020 zones ====
  t1:[
    {x:53.15,y:0,w:37.78,h:16.27},
    {x:36.02,y:1.18,w:13.76,h:18.2},
    {x:3.07,y:4.59,w:19.76,h:13.76},
    {x:23.87,y:5.02,w:10.84,h:22.48},
    {x:50.37,y:14.5,w:13.62,h:14.35},
    {x:79.5,y:14.94,w:20.5,h:12.28},
    {x:65.16,y:15.09,w:13.18,h:15.09},
    {x:3.51,y:18.94,w:19.33,h:11.68},
    {x:36.02,y:19.38,w:13.76,h:8.88},
    {x:79.36,y:27.95,w:20.64,h:9.91},
    {x:33.53,y:28.85,w:15.23,h:12.28},
    {x:52.42,y:31.07,w:20.94,h:15.68},
    {x:2.64,y:32.25,w:21.23,h:17.01},
    {x:80.97,y:39.35,w:19.03,h:21.75},
    {x:36.16,y:42.6,w:15.23,h:23.37},
    {x:63.83,y:48.23,w:16.25,h:14.2},
    {x:7.76,y:49.26,w:16.84,h:8.43},
    {x:25.32,y:55.92,w:10.98,h:5.03},
    {x:2.64,y:57.69,w:20.5,h:17.46},
    {x:25.32,y:60.94,w:10.24,h:6.5},
    {x:81.7,y:61.83,w:18.01,h:17.46},
    {x:62.81,y:62.73,w:18.01,h:16.57},
    {x:25.62,y:68.79,w:24.16,h:15.24},
    {x:50.95,y:74.26,w:11.13,h:21},
    {x:6.73,y:78.4,w:16.7,h:16.12},
    {x:64.71,y:79.74,w:30.9,h:20.26},
    {x:24.6,y:85.35,w:25.19,h:10.8}
  ],
  // Majors 2 and 3, read off each one's own Grand Final drop map and moved onto
  // the clean season map by tools/align-zones.js. These are the spots the
  // finalists actually took, not a grid drawn to look plausible.
  //
  // The source is the clean version of each drop map -- thin bright outlines on
  // an unwatermarked island -- which the detector reads far better than the
  // washed-over screenshots do.
  //
  // The source is the clean version of each drop map -- thin bright outlines on
  // an unwatermarked island -- which the detector reads far better than the
  // washed-over screenshots do.
  //
  // The source is the clean version of each drop map -- thin bright outlines on
  // an unwatermarked island -- which the detector reads far better than the
  // washed-over screenshots do.
  t2:[
    {x:49.51,y:6.19,w:32.38,h:14},
    {x:34.29,y:9.42,w:12.88,h:14.63},
    {x:23.86,y:12.47,w:9.38,h:15},
    {x:6.5,y:12.5,w:17,h:17.38},
    {x:47.46,y:20.62,w:11,h:12.38},
    {x:71.38,y:20.83,w:19.13,h:10.38},
    {x:59.37,y:21.11,w:11.38,h:13},
    {x:34.34,y:24.73,w:11.88,h:6.88},
    {x:19.73,y:30.13,w:12.25,h:8},
    {x:71.57,y:31.99,w:17.63,h:13.25},
    {x:32.37,y:32.34,w:12.5,h:7.88},
    {x:48.69,y:34.9,w:16.88,h:12.88},
    {x:17.87,y:39.53,w:11.88,h:7.25},
    {x:32.89,y:40.59,w:14.13,h:6.75},
    {x:4.77,y:43.46,w:12.5,h:13.5},
    {x:73.05,y:45.73,w:17.13,h:14},
    {x:25.9,y:47.89,w:9.63,h:12.63},
    {x:36.84,y:48.49,w:15.5,h:12.13},
    {x:58.43,y:49.29,w:13.75,h:11.5},
    {x:15.66,y:56.92,w:9,h:7},
    {x:73.54,y:60.58,w:15.5,h:15},
    {x:57.34,y:61.37,w:15.5,h:14.25},
    {x:25.09,y:61.42,w:9.75,h:19.88},
    {x:35.85,y:62.51,w:11,h:18.88},
    {x:5.79,y:64.08,w:18.25,h:9},
    {x:47,y:70.6,w:9.63,h:18.38},
    {x:9.52,y:74.67,w:14.38,h:13.88},
    {x:58.94,y:76.13,w:26.38,h:16.63},
    {x:24.69,y:82.32,w:21.63,h:8.88},
  ],
  t3:[
    {x:48.74,y:8.42,w:20.75,h:10.88},
    {x:72.52,y:8.55,w:11.63,h:14},
    {x:34.29,y:9.42,w:11.25,h:14.63},
    {x:25.45,y:12.67,w:8,h:19.25},
    {x:10.63,y:12.75,w:14.63,h:13.25},
    {x:57.8,y:20.36,w:10,h:12.63},
    {x:46.96,y:20.99,w:9,h:8.38},
    {x:71.58,y:23.52,w:19.13,h:16.75},
    {x:9.41,y:26.25,w:14.38,h:9.38},
    {x:30.99,y:32.15,w:12.75,h:9.75},
    {x:47.06,y:33.77,w:17.5,h:14},
    {x:6.62,y:36.88,w:16.88,h:12.5},
    {x:73.05,y:41.35,w:17.13,h:18.38},
    {x:36.84,y:48.49,w:15.5,h:12.13},
    {x:24.38,y:49.15,w:10.63,h:11.38},
    {x:58.43,y:49.29,w:13.75,h:11.5},
    {x:5.79,y:49.95,w:17.25,h:23.13},
    {x:78.17,y:61.21,w:10.75,h:14.38},
    {x:58.09,y:61.37,w:19,h:14.25},
    {x:24.47,y:61.42,w:10.38,h:15.63},
    {x:35.23,y:64.64,w:10.25,h:14.88},
    {x:47.5,y:67.97,w:9.63,h:9.5},
    {x:9.52,y:74.67,w:14.38,h:13.88},
    {x:58.68,y:75.96,w:26.38,h:16.63},
    {x:24.69,y:80.2,w:21.63,h:10.63},
  ],
  /* Остров Лиона (Global Championship 2025, 6–7 сентября, Chapter 6 Season 4, патч 37.10): клетки — дроп-карта
     eucompetitive.com ch6s4-fncs-global-2025 (tools/measured/eucomp-2025-gc-dropmap.json), кадр 800 → проценты делением на 8. */
  t4:[
    {x:44.61,y:8.42,w:24.38,h:10.38},
    {x:72.52,y:8.55,w:11.13,h:13.5},
    {x:27.2,y:10.79,w:14.63,h:12.63},
    {x:10.63,y:12.75,w:15.13,h:12.75},
    {x:58.07,y:20.78,w:10.63,h:22},
    {x:42.97,y:20.99,w:12.5,h:7.88},
    {x:71.58,y:23.52,w:18.63,h:16.25},
    {x:27.87,y:24.77,w:12.88,h:12},
    {x:9.55,y:26.34,w:16.63,h:8.88},
    {x:47.23,y:30.01,w:9.88,h:17.5},
    {x:6.62,y:36.88,w:20,h:12},
    {x:31.97,y:38.16,w:13.63,h:10.63},
    {x:73.68,y:43.35,w:15,h:13.63},
    {x:61.29,y:49.18,w:9.5,h:11},
    {x:24.38,y:49.9,w:10.13,h:10.13},
    {x:5.79,y:49.95,w:16.75,h:22.63},
    {x:36.84,y:52.74,w:11.13,h:8.63},
    {x:49.01,y:54.02,w:8.13,h:10.75},
    {x:78.17,y:58.58,w:11,h:16.5},
    {x:58.09,y:61.37,w:18.5,h:12.88},
    {x:24.47,y:61.42,w:9.88,h:14.38},
    {x:35.23,y:64.51,w:9.75,h:14.5},
    {x:47.5,y:67.98,w:9.13,h:10.38},
    {x:9.52,y:74.67,w:13.88,h:13.38},
    {x:59.44,y:77.13,w:25.13,h:13.38},
    {x:24.69,y:80.07,w:27.75,h:10.25},
  ],
  m1:[
    {x:24.92,y:8.0,w:20.87,h:11.73},
    {x:46.73,y:9.88,w:10.91,h:11.59},
    {x:58.27,y:10.32,w:9.49,h:11.15},
    {x:8.47,y:14.95,w:12.17,h:15.35},
    {x:69.82,y:15.39,w:9.01,h:14.05},
    {x:79.62,y:19.3,w:10.43,h:14.77},
    {x:26.02,y:20.46,w:10.43,h:10.28},
    {x:37.41,y:20.46,w:8.06,h:18.54},
    {x:46.26,y:22.48,w:13.44,h:9.12},
    {x:60.01,y:24.37,w:8.7,h:7.1},
    {x:8.47,y:31.61,w:24.03,h:8.69},
    {x:46.73,y:31.9,w:15.49,h:7.53},
    {x:79.78,y:34.79,w:11.07,h:13.47},
    {x:57.17,y:38.56,w:7.59,h:9.85},
    {x:65.55,y:38.99,w:9.17,h:8.11},
    {x:35.67,y:40.01,w:11.86,h:13.61},
    {x:48.16,y:41.17,w:8.7,h:7.39},
    {x:8.16,y:42.32,w:9.64,h:15.21},
    {x:18.59,y:43.92,w:15.81,h:8.11},
    {x:80.41,y:48.26,w:10.59,h:8.11},
    {x:48.95,y:49.13,w:11.22,h:12.46},
    {x:61.28,y:49.28,w:11.38,h:6.95},
    {x:31.56,y:54.49,w:16.6,h:8.69},
    {x:31.56,y:55.36,w:3.64,h:7.82},
    {x:20.02,y:55.5,w:11.22,h:7.68},
    {x:80.57,y:56.52,w:10.12,h:10.28},
    {x:60.8,y:56.66,w:18.97,h:10.14},
    {x:55.59,y:62.31,w:13.44,h:6.23},
    {x:38.35,y:63.9,w:4.27,h:3.04},
    {x:8.0,y:64.05,w:10.75,h:11.88},
    {x:42.94,y:64.05,w:12.02,h:6.81},
    {x:11.48,y:64.34,w:20.39,h:20.28},
    {x:32.82,y:65.21,w:8.85,h:10.43},
    {x:69.66,y:67.52,w:14.39,h:7.1},
    {x:57.01,y:68.97,w:11.86,h:5.21},
    {x:57.01,y:74.77,w:16.92,h:8.11},
    {x:44.84,y:74.91,w:11.86,h:6.81},
    {x:27.29,y:75.06,w:16.13,h:6.95},
    {x:28.55,y:82.88,w:21.82,h:9.12}
  ],
  m2:[
  {x:20.18,y:4.0,w:12.45,h:17.71},
  {x:33.4,y:8.53,w:8.09,h:14.28},
  {x:42.26,y:8.53,w:9.88,h:12.91},
  {x:59.33,y:14.99,w:9.76,h:16.61},
  {x:69.86,y:18.42,w:19.64,h:15.38},
  {x:47.65,y:22.81,w:10.78,h:9.89},
  {x:25.57,y:23.22,w:10.27,h:12.5},
  {x:11.97,y:28.72,w:12.84,h:7.0},
  {x:54.33,y:33.66,w:14.76,h:9.61},
  {x:37.25,y:35.44,w:9.63,h:7.96},
  {x:25.83,y:35.86,w:7.32,h:9.75},
  {x:10.55,y:36.54,w:14.12,h:9.47},
  {x:71.79,y:39.15,w:17.71,h:10.3},
  {x:32.12,y:44.23,w:11.04,h:11.4},
  {x:43.93,y:45.47,w:11.04,h:9.06},
  {x:58.82,y:45.74,w:5.01,h:8.38},
  {x:23.01,y:46.7,w:7.19,h:8.79},
  {x:13.12,y:47.25,w:9.11,h:17.16},
  {x:77.18,y:50.96,w:12.32,h:10.16},
  {x:64.47,y:51.37,w:12.07,h:12.22},
  {x:52.92,y:55.36,w:9.76,h:7.28},
  {x:30.19,y:56.59,w:9.88,h:9.47},
  {x:41.23,y:59.75,w:8.09,h:8.79},
  {x:71.14,y:62.63,w:12.45,h:20.32},
  {x:53.3,y:62.91,w:12.19,h:9.61},
  {x:65.62,y:63.73,w:5.39,h:4.53},
  {x:8.5,y:65.1,w:11.68,h:11.12},
  {x:31.09,y:66.89,w:10.27,h:10.57},
  {x:20.95,y:67.16,w:6.16,h:6.04},
  {x:66.14,y:68.4,w:5.01,h:6.87},
  {x:50.99,y:73.76,w:14.51,h:20.19},
  {x:8.5,y:76.78,w:17.07,h:10.44},
  {x:26.6,y:78.56,w:12.07,h:9.2},
  {x:39.69,y:79.11,w:9.24,h:16.2},
  {x:69.09,y:83.64,w:16.3,h:12.36},
  {x:8.5,y:87.9,w:17.46,h:6.32}
  ],
  // The Reload islands. The rectangles were read off each cup's own drop map by
  // tools/extract-zones.js and then moved onto the clean season map by
  // tools/align-zones.js, which frames both pictures on the island's own
  // bounding box and scales between them. What ships is the clean map; what was
  // measured is the drop map. 15, 14, 35 and 12 rectangles against roughly
  // twenty teams a cup — extract-zones finds a box by its borders, so the solid
  // outlines came out and the translucent ones over the hot POIs did not, and
  // those are still to be added by hand.
  //
  // No ZONE_STATS ride along with these. The published evals cover the Battle
  // Royale islands and the wiki loot counts cover Chapter 6; nothing counts loot
  // on a Reload island, so every spot is worth one point and contests at the
  // default rate rather than carrying an invented number.
  r1:[
    {x:28.6,y:18.56,w:10.57,h:7.75},
    {x:43.77,y:24.71,w:7.69,h:21.06},
    {x:28.6,y:26.32,w:10.47,h:7.02},
    {x:52.21,y:29.98,w:8.33,h:11.4},
    {x:24.11,y:33.92,w:8.65,h:7.89},
    {x:34.69,y:36.12,w:7.91,h:19.88},
    {x:67.7,y:40.94,w:12.29,h:17.11},
    {x:54.45,y:42.7,w:11.54,h:20.03},
    {x:22.94,y:43.57,w:11.11,h:11.25},
    {x:43.77,y:45.76,w:7.69,h:8.78},
    {x:41.64,y:56.15,w:5.99,h:5.11},
    {x:48.04,y:57.75,w:6.19,h:9.07},
    {x:60.76,y:63.9,w:10.68,h:13.6},
    {x:29.88,y:64.34,w:11.43,h:11.55},
    {x:49.33,y:67.99,w:10.26,h:12.43}
  ],
  r2:[
    {x:26.25,y:15.06,w:11.71,h:14.98},
    {x:42.13,y:21.8,w:8.32,h:20.53},
    {x:51.22,y:25.4,w:8.54,h:13.48},
    {x:23.08,y:30.64,w:8.21,h:8.69},
    {x:33.26,y:31.39,w:8.1,h:22.77},
    {x:67.09,y:38.43,w:12.59,h:17.38},
    {x:53.08,y:40.22,w:12.59,h:20.82},
    {x:21.22,y:41.13,w:11.38,h:11.53},
    {x:42.46,y:46.07,w:8.21,h:6.75},
    {x:40.81,y:54.46,w:6.24,h:4.5},
    {x:28.11,y:59.85,w:11.71,h:16.03},
    {x:59.97,y:61.8,w:10.95,h:14.08},
    {x:48.15,y:66.29,w:10.84,h:12.88}
  ],
  r3:[
    {x:48.57,y:12.02,w:6.15,h:6.21},
    {x:17.18,y:14.62,w:22.84,h:17.76},
    {x:40.23,y:18.23,w:8.34,h:12.27},
    {x:66.35,y:25.6,w:3.62,h:3.75},
    {x:19.49,y:32.97,w:10.87,h:17.33},
    {x:62.18,y:39.61,w:8.56,h:15.02},
    {x:71.51,y:39.89,w:8.13,h:14.73},
    {x:42.65,y:47.84,w:13.72,h:15.89},
    {x:16.08,y:53.04,w:24.48,h:14.87},
    {x:54.72,y:55.2,w:15.81,h:18.92},
    {x:70.52,y:55.93,w:11.74,h:27.59},
    {x:19.59,y:68.63,w:12.95,h:13.58},
    {x:36.94,y:69.8,w:16.47,h:15.45},
    {x:53.84,y:74.84,w:12.85,h:18.78}
  ],
  r4:[
    {x:46.5,y:11.19,w:11.54,h:17.06},
    {x:59.76,y:17.21,w:12.26,h:21.47},
    {x:37.67,y:17.42,w:8.55,h:10.63},
    {x:27.12,y:29.65,w:9.83,h:21.67},
    {x:60.9,y:39.09,w:17.24,h:14.24},
    {x:17,y:40.49,w:9.26,h:10.44},
    {x:41.09,y:49.12,w:9.98,h:13.65},
    {x:17.57,y:52.73,w:22.09,h:16.45},
    {x:52.21,y:53.53,w:14.11,h:19.26},
    {x:67.17,y:56.55,w:17.53,h:29.7},
    {x:27.84,y:71.19,w:8.55,h:13.25},
    {x:51.79,y:75.41,w:13.11,h:17.66}
  ]
};
const ALL_LANDING_ZONES=[];

// Populate once at load so anything reading the zones before a mode is picked
// still sees a full grid.
setTimeout(()=>{ if(!ALL_LANDING_ZONES.length) useLandingSet('m2'); }, 0);

// A trio lobby is 33 squads and a squad lobby is 25, against 50 in duos, so the
// full grid leaves the map covered in boxes nobody is standing in and the
// labels fight for room. Keep the biggest zones — they are the named POIs and
// they have space for a name inside.
const LANDING_ZONE_SHARE={2:1, 3:0.68, 4:0.52};
/* Соло садится поодиночке, поэтому сетка точек мельче: на настоящей дроп-карте Solo Series ~60 боксов против 36 в дуо.
   Соло-карты для остальных островов нет, режем сами: самый большой бокс делится по длинной стороне надвое, пока сетка не дойдёт до соло-плотности.
   Половины лежат внутри родителя (в воду не уезжают) и наследуют его рейтинг. */
/* Соло-сетка меряется КЛЕТКАМИ, а не «во сколько раз больше дуошной».

   Правка: «сделай подобные квадратики для всех карт» — то есть
   как на присланной им карте сотни дропов, где клетка приходится на игрока
   лобби. Коэффициент 1.6 давал от девятнадцати клеток на островах Reload до
   шестидесяти двух на m1: на сотню человек это не сетка, а несколько крупных
   пятен.

   Теперь цель — CC_SOLO_GRID клеток, а тормозит дробление только читаемость:
   клетку не режут, если половинка станет уже LANDING_ZONE_SOLO_MIN процентов
   карты. Сколько клеток на самом деле вышло у каждого острова, держит сторож
   check-landing-solo-grid — у мелких наборов Reload потолок ниже сотни, и это
   честный предел их собственных прямоугольников, а не недосмотр. */
/* Сто клеток на сотню игроков — это высадка без единого контеста: на s42
   дробление доходило до ста, 97 ботов садились в 97 разных клеток, и за
   первую зону выбывал один при реальных одиннадцати из 97 (реплей финала
   Solo Series EU 24.01.2026). Январская серия на m2 дробилась только до 58
   (упор в LANDING_ZONE_SOLO_MIN) — и именно её карту с красными коробками по
   два-три ника он прислал как образец 6 сентября: «как на соло выглядела,
   так и на solo fncs, а не 100 квадратиков». Потолок дробления — 60: m2 как
   была, s42 — 60 коробок на сотню, сорок из них на двоих. */
const CC_SOLO_GRID=60, LANDING_ZONE_SOLO_MIN=2.5;
/* Набор, который уже нарисован под соло, дробить нечем и незачем.

   Дробление существует потому, что дуо-сетка на соло-лобби редка: тридцать
   четыре клетки на сотню человек. s42solo — это его собственная карта под соло,
   сто клеток на сотню игроков, по одной на каждого. Разрезать её пополам
   значило бы отдать игроку не те прямоугольники, которые он просил перенести. */
const ZONE_SETS_SOLO_READY={s42solo:true, r5:true, r6:true};
function splitLandingZonesForSolo(){
  const want=CC_SOLO_GRID;
  let guard=0;
  while(ALL_LANDING_ZONES.length<want && guard++<400){
    let at=-1, area=0;
    ALL_LANDING_ZONES.forEach((z,i)=>{ const a=z.w*z.h; if(a>area){ area=a; at=i; } });
    if(at<0) return;
    const z=ALL_LANDING_ZONES[at];
    // Ниже пяти процентов бокс перестаёт быть точкой высадки и становится
    // меткой, которую не прочитать, — такой не делим и на этом останавливаемся.
    const wide=z.w>=z.h;
    if((wide?z.w:z.h)/2 < LANDING_ZONE_SOLO_MIN) return;
    const a={...z}, b={...z};
    if(wide){ a.w=z.w/2; b.w=z.w/2; b.x=z.x+z.w/2; }
    else    { a.h=z.h/2; b.h=z.h/2; b.y=z.y+z.h/2; }
    ALL_LANDING_ZONES.splice(at, 1, a, b);
  }
}
/* Какие коробки острова остаются под сквады: крупнейшие по площади, доля LANDING_ZONE_SHARE[4],
   но не меньше CC_SQUAD_KEEP_MIN. Считается по набору, а не по ALL_LANDING_ZONES, — тем же
   списком рисует карту метка сборной (careerSpotTileHTML), и на вечере лежат те же коробки. */
const CC_SQUAD_KEEP_MIN=16;
const CC_SQUAD_KEEP={};
function ccSquadKeep(set){
  if(CC_SQUAD_KEEP[set]) return CC_SQUAD_KEEP[set];
  const grid=ZONE_SETS[set]||[];
  const share=LANDING_ZONE_SHARE[4]||1;
  const keep=Math.min(grid.length, Math.max(CC_SQUAD_KEEP_MIN, Math.round(grid.length*share)));
  const out=grid.map((z,i)=>({i, area:z.w*z.h})).sort((a,b)=>b.area-a.area).slice(0, keep).map(x=>x.i).sort((a,b)=>a-b);
  CC_SQUAD_KEEP[set]=out;
  return out;
}
/* Под какой размер команды обрезан загруженный остров — см. проверку в simulateGamesLive. */
let LANDING_TRIM_SIZE=0;
function trimLandingZonesForMode(){
  LANDING_TRIM_SIZE=squadSize;
  if(ZONE_SETS_SOLO_READY[ACTIVE_LANDING_SET]) return;
  if(squadSize===1) return splitLandingZonesForSolo();
  if(squadSize===4){
    /* Сквады прореживаются на ВСЕХ островах, а не только на «стенах» из тридцати с лишним
       коробок: острова 2025-го (25–29 коробок) шли под сквады целиком. Отзыв:
       «прямоугольники для всех карт должны быть под сквады». */
    const keep=ccSquadKeep(ACTIVE_LANDING_SET);
    if(keep.length>=ALL_LANDING_ZONES.length) return;
    const kept=ccKeepMythic(keep.map(i=>ALL_LANDING_ZONES[i]).filter(Boolean));
    ALL_LANDING_ZONES.length=0;
    kept.forEach(z=>ALL_LANDING_ZONES.push(z));
    return;
  }
  const share=LANDING_ZONE_SHARE[squadSize] || 1;
  if(share>=1) return;
  // The trim exists to stop a forty-box island reading as a wall of rectangles.
  // A set that is already sparse has nothing to declutter, and thinning it just
  // stacks teams on top of each other. The 2026 islands carry 36 and 39 boxes
  // and still thin; the 2025 one carries 21 and is left whole.
  if(ALL_LANDING_ZONES.length<=30) return;
  const keep=Math.max(12, Math.round(ALL_LANDING_ZONES.length*share));
  // Мифическая точка остаётся при любом прореживании: иначе в трио-вечере 2024-го
  // (f3, f4) босса с мификом на карте просто не было (замер 29.09).
  const ranked=ALL_LANDING_ZONES
    .map((z,i)=>({z, i, area:z.mythic ? Infinity : z.w*z.h}))
    .sort((a,b)=>b.area-a.area)
    .slice(0, keep)
    .sort((a,b)=>a.i-b.i)          // back to the original order
    .map(x=>x.z);
  ALL_LANDING_ZONES.length=0;
  ranked.forEach(z=>ALL_LANDING_ZONES.push(z));
}
/* Сквадный набор коробок подобран без наложений, и мифической точки в нём может не
   быть. Она добавляется, а коробка набора, которую она заметно перекрывает, уходит. */
function ccKeepMythic(kept){
  const myth=ALL_LANDING_ZONES.filter(z=>z.mythic && !kept.includes(z));
  if(!myth.length) return kept;
  const over=(a,b)=>{
    const w=Math.min(a.x+a.w, b.x+b.w)-Math.max(a.x, b.x), h=Math.min(a.y+a.h, b.y+b.h)-Math.max(a.y, b.y);
    return w>0 && h>0 && w*h > 0.25*Math.min(a.w*a.h, b.w*b.h);
  };
  const out=kept.filter(z=>z.mythic || !myth.some(m=>over(m, z))).concat(myth);
  return ALL_LANDING_ZONES.filter(z=>out.includes(z));   // исходный порядок
}

// Which island is actually loaded. In card mode it tracks CARD_SET, but the
// normal cups let you pick a map of your own, and everything that draws the map
// used to read CARD_SET regardless — so picking Chapter 6 Season 3 in a normal
// duo cup laid that island's landing grid over last season's satellite photo.
let ACTIVE_LANDING_SET='m2';
// Чей счёт сундуков у острова (поле chests в ZONE_STATS): подпись в подсказке точки.
const CC_CHESTS_SRC={s42:'fortnite.gg', s42solo:'fortnite.gg', s43:'fortnite.gg', r5:'fortnite.gg', r6:'fortnite.gg', t1:'wiki', t2:'wiki', t3:'wiki', f1:'wiki', f2:'wiki', f3:'wiki', f4:'wiki', e1:'wiki', e2:'wiki', e3:'wiki', e4:'wiki', k1:'wiki', k2:'wiki', k3:'wiki', k4:'wiki', j1:'wiki', j2:'wiki', j3:'wiki', j4:'wiki', h1:'wiki', h3:'wiki', h4:'wiki', i1:'wiki', i2:'wiki', i3:'wiki', m1:'Kinch', m2:'Kinch'};
/* Сила точки = сундуки + ящики с патронами + 3 за редкий сундук, как у всех островов с переписью fortnite.gg. У S42 (дуо и
   соло-сотня) r оставался от старой переписи вики, а сундуки потом пересчитаны по fortnite.gg: точка с 5 сундуками давала
   +3, а с 68 — +1 (его вопрос 19.11: «у меня локация +3 повер, а там 5 сундуков»). Считаем r из тех же чисел, что видит
   лут-комната. У s43/r5/r6 формула и так совпадает с r — ничего не меняется. */
Object.keys(CC_CHESTS_SRC).forEach(set=>{ if(CC_CHESTS_SRC[set]!=='fortnite.gg') return;
  (ZONE_STATS[set]||[]).forEach(z=>{ if(z && z.chests!=null){ z.r=z.loot=(z.chests||0)+(z.ammo||0)+3*(z.rare||0); } }); });
/* МИФИЧЕСКИЕ POI Chapter 5–6 (острова 2024 f1–f4 и 2025 t1–t3): точка, где стоит босс с мификом.
   Босс и его место — вики (страница Bosses и страницы боссов), клетка — по маркеру локации на
   вики-карте патча финала (tools/build-2025-zone-loot.js, DUMP_POIS). Ключ — индекс клетки в
   ZONE_SETS. Точка ценится как лучшая на острове плюс CC_MYTHIC_POW: сюда летят сильные,
   и кто выжил на высадке, уходит с мификом (прибавка к силе на игру). */
const CC_MYTHIC_POW=3;
const CC_MYTHIC_POI={
  // f1 24.10.2026 (Notion «24.10.26», тестер: «медальки в локах где кружок, забыли помп с петей
  // грифином, в корту не было медальки»): Oscar стоял на Classy Courts, Nisha на Lavish Lair.
  // По вики: Oscar Lavish Lair (8), Nisha Fencing Fields (31), Peter Griffin Snooty Steppes (34).
  f1:{7:'Oscar', 14:'Montague', 15:'Valeria', 30:'Nisha', 33:'Peter Griffin'},
  f2:{10:'Hades', 15:'Cerberus', 30:'Zeus', 39:'Ares'},
  f3:{28:'Ringmaster Scarr', 36:'The Machinist', 37:'Megalo Don'},
  f4:{5:'Mysterio', 7:'Doctor Doom', 23:'Emma Frost'},
  t1:{5:'Night Rose', 24:'Shogun X'},
  t2:{4:'Fletcher Kane', 26:'Shogun X'},
  t3:{21:'Daigo'}
};
/* Что роняет босс мифической точки — вики, страница Bosses (таблицы Chapter 5–6): мифик(и)
   и медальон ([имя, иконка items/boss/<иконка>.webp, 1 = медальон]). Medusa в Chapter 5 S2 —
   торговец, а не босс: ни мифика, ни медальона, поэтому её клетки в CC_MYTHIC_POI больше нет. */
const CC_MYTHIC_DROP={
  f1:{"Oscar":[["Oscar's Frenzy Auto Shotgun","modular-frenzy-auto-shotgun"],["Oscar's Medallion","oscar-s-medallion",1]],
      "Nisha":[["Nisha's Striker AR","striker-ar"],["Nisha's Medallion","nisha-s-medallion",1]],
      "Montague":[["Montague's Nemesis AR","nemesis-ar"],["Montague's Medallion","montague-s-medallion",1]],
      "Valeria":[["Valeria's Hyper SMG","hyper-smg"],["Valeria's Medallion","valeria-s-medallion",1]],
      "Peter Griffin":[["Peter Griffin's Hammer Pump Shotgun","modular-hammer-pump-shotgun"],["Peter Griffin's Medallion","peter-griffin-s-medallion",1]]},
  f2:{"Hades":[["Hades' Harbinger SMG","modular-harbinger-smg"],["Chains of Hades","chains-of-hades"],["Aspect of Siphon","aspect-of-siphon",1]],
      "Cerberus":[["Cerberus' Gatekeeper Shotgun","modular-gatekeeper-shotgun"],["Aspect of Agility","aspect-of-agility",1]],
      "Zeus":[["Zeus' Huntress DMR","modular-huntress-dmr"],["Thunderbolt of Zeus","thunderbolt-of-zeus"],["Aspect of Speed","aspect-of-speed",1]],
      "Ares":[["Ares' Warforged Assault Rifle","warforged-assault-rifle"],["Aspect of Combat","aspect-of-combat",1]]},
  f3:{"Ringmaster Scarr":[["Ringmaster's Boom Bolt","modular-boom-bolt"],["Ringmaster Scarr's Medallion","ringmaster-scarr-s-medallion",1]],
      "The Machinist":[["The Machinist's Modular Combat Assault Rifle","modular-combat-assault-rifle"],["The Machinist's Medallion","the-machinist-s-medallion",1]],
      "Megalo Don":[["Megalo Don's Combat Shotgun","modular-combat-shotgun"],["Megalo Don's Nitro Fists","nitro-fists"],["Megalo Don's Medallion","megalo-don-s-medallion",1]]},
  f4:{"Mysterio":[["Mysterio's Sovereign Shotgun","modular-sovereign-shotgun"],["Mysterio's Stealth Medallion","mysterio-s-stealth-medallion",1]],
      "Doctor Doom":[["Doctor Doom's Monarch Pistol","modular-monarch-pistol"],["Doctor Doom's Arcane Gauntlets","doctor-doom-s-arcane-gauntlets"],["Doombot's Siphon Medallion","doombot-s-siphon-medallion",1]],
      "Emma Frost":[["Emma Frost's Striker Burst AR","modular-striker-burst-rifle"],["Emma Frost's Reveal Medallion","emma-frost-s-reveal-medallion",1]]},
  t1:{"Night Rose":[["Night Rose Veiled Precision SMG","veiled-precision-smg"],["Night Rose's Void Oni Mask","void-oni-mask"],["Night Rose Medallion","night-rose-medallion",1]],
      "Shogun X":[["Typhoon Blade","typhoon-blade"],["Shogun X's Fire Oni Mask","fire-oni-mask"],["Shogun X Medallion","shogun-x-medallion",1]]},
  t2:{"Fletcher Kane":[["Baron's Double Down Pistol","mammoth-pistol"],["Unstoppable Medallion","unstoppable-medallion",1]],
      "Shogun X":[["Enhanced Holo Twister Assault Rifle","holo-twister-assault-rifle"],["Super Shield Medallion","super-shield-medallion",1]]},
  t3:{"Daigo":[["Enhanced Spire Rifle","spire-rifle"],["Infernal Defenses Medallion","infernal-defenses-medallion",1]]},
};
function useLandingSet(key){
  if(key && typeof SET_ISLAND!=='undefined' && SET_ISLAND[key]) key=SET_ISLAND[key];
  const set = ZONE_SETS[key] ? key : 'm2';
  ACTIVE_LANDING_SET=set;
  const stats = ZONE_STATS[set] || [];
  ALL_LANDING_ZONES.length=0;
  // The rectangle is copied through untouched; the season's real numbers ride
  // along beside it.
  ZONE_SETS[set].forEach((z,i)=>ALL_LANDING_ZONES.push({...z, ...(stats[i]||{})}));
  /* Сундуков в коробке (chests) — откуда: s42/s42solo по точкам fortnite.gg, острова
     2025 — со страниц локаций на вики; у m1/m2 вики покрывает 17 коробок из 36
     (Ch7S2–S3 там описаны наполовину), зато у каждой коробки есть Kinch «loot —
     items the spot yields», и там, где вики считала, числа сходятся (Lifty Lodge
     60/56, Cluster Coast 27/28, Shaken Sanctuary 53/58, Calamari 55/46) — он и идёт
     за счёт сундуков у этих двух островов. Подпись источника — CC_CHESTS_SRC. */
  if(CC_CHESTS_SRC[set]==='Kinch') ALL_LANDING_ZONES.forEach(z=>{ if(z.chests==null && z.loot!=null) z.chests=z.loot; });
  // Zone value comes from that season's published drop-spot rating, not from
  // how big the rectangle happens to be. Ratings are graded against the rest of
  // the same island — a spot is worth what it is worth relative to its own
  // season's field — so both maps span the full 1..LANDING_POINTS_MAX range and
  // neither island is richer than the other just because its numbers run higher.
  const rated=ALL_LANDING_ZONES.map(z=>z.r).filter(v=>v!=null).sort((a,b)=>a-b);
  ALL_LANDING_ZONES.forEach(z=>{
    if(z.teams==null) z.teams=1;
    if(z.r==null || !rated.length){ z.points=1; return; }
    const pct=rated.filter(v=>v<z.r).length/rated.length;
    z.points=Math.max(1, Math.min(LANDING_POINTS_MAX, 1+Math.floor(pct*LANDING_POINTS_MAX)));
  });
  // Мифические POI 2024–2025: босс с мификом на точке — она дороже любой другой (см. CC_MYTHIC_POI).
  const myth=CC_MYTHIC_POI[set];
  if(myth) ALL_LANDING_ZONES.forEach((z,i)=>{ if(myth[i]){ z.mythic=myth[i]; z.mythicSet=set; z.points=LANDING_POINTS_MAX+CC_MYTHIC_POW; } });
  trimLandingZonesForMode();
  document.querySelectorAll('.map-frame').forEach(el=>{ el.style.aspectRatio=MAP_ASPECT[set]; });
  const picker=document.querySelector('#landingMapWrap img');
  if(picker) picker.src=MAP_ART[set];
  ['gameLandingMapImg','landingResultsMapImg'].forEach(id=>{
    const el=document.getElementById(id);
    if(el && el.src) el.src=MAP_ART[set];
  });
}

// Rating-tier colors (1-10 scale) — green = best drop, red = worst, matching
// the classic Kinch-style landing-spot heatmap look.
// Every nickname in a rectangle, one name per line, sized against the map rather
// than against the screen. `cqh` is one percent of the map frame's height and the
// rectangles are measured in exactly that unit, so the column is laid out to the
// box it sits in at any window size.
//
// One name per line, not one team per line: a trio written out as
// "Player & Player & Player" is three times wider than a POI box, so the old
// single-line label had to shrink to 3-6px and was then cropped to an ellipsis —
// which is to say the drop map printed nobody's name. Below the floor the column
// is allowed to spill out of the rectangle instead of shrinking further; an
// unreadable name in the box is worth less than a readable one just outside it.
/* Ники на карте. Потолок поднят с 13 до 16 вместе с шириной прогона (правка: «чтоб текст лучше было видно»). Размер считается в cqh от
   высоты карты, то есть сам растёт вместе с ней, — но упирался в тринадцать
   ровно там, где места стало много. Потолок только РАЗРЕШАЕТ рост: когда в
   коробке тесно, решает cqh, и он меньше. */
const ZONE_NAME_MIN_PX=7, ZONE_NAME_MAX_PX=16;
/* Что на экране занято не картой: шапка страницы, заголовок этапа и строка
   под ним. Отсюда берётся потолок высоты карты — см. --zr-cap. */
const CC_MAP_TOP=210;
// The opening letters of the name itself, tag stripped. See fillZoneNames.
const ZONE_NAME_SHORT_AT=640, ZONE_NAME_SHORT_LEN=4;
function zoneShortName(handle){
  const w=displayWords(handle);
  const first=(w[0]||String(handle||'')).trim();
  return first.length>ZONE_NAME_SHORT_LEN ? first.slice(0, ZONE_NAME_SHORT_LEN) : first;
}
/* Подпись силы точки («+7 силы · ⚡ Zeus») — на КАЖДОЙ коробке, и на занятой тоже:
   раньше занятая показывала только ники, и сколько даёт точка, было не видно. */
function zonePowLabel(z){
  const label=document.createElement('div');
  label.className='land-zone-label';
  label.textContent=L().landingPoints(z.points);
  ccMythicMark(label, z);
  return label;
}
/* Мифическая точка на подписи: вместо имени босса — то, что он роняет (мифик и медальон,
   иконки с вики, CC_MYTHIC_DROP). Отзыв: «где зевс добавить монетку или что там дают такого,
   что даёт силу». Имя босса и названия предметов — в подсказке и в превью спота. */
function ccMythicDrops(set, boss){
  return ((CC_MYTHIC_DROP[set]||{})[boss]||[]).map(([n, ic, med])=>({n, src:'items/boss/'+ic+'.webp', med:!!med}));
}
function ccMythicIconsHTML(set, boss){
  return ccMythicDrops(set, boss).map(d=>
    `<img class="zp-ic${d.med?' zp-med':''}" src="${d.src}" alt="" title="${esc(d.n)}" decoding="async">`).join('');
}
function ccMythicMark(label, z){
  if(!z || !z.mythic) return;
  const set=z.mythicSet||ACTIVE_LANDING_SET;
  label.classList.add('zp-myth');
  label.title=z.mythic+': '+ccMythicDrops(set, z.mythic).map(d=>d.n).join(', ');
  const icons=ccMythicIconsHTML(set, z.mythic);
  label.insertAdjacentHTML('beforeend', icons || ' ⚡ '+esc(z.mythic));
}
function fillZoneNames(plot, teams, zone){
  // A block per squad, so the cut below can only ever fall between squads —
  // half a duo on the map read as a solo nobody could find in the list.
  const blocks=(teams||[]).map(t=>{
    const squad=t.squad||[];
    const names=squad.length ? squad.map(p=>p.handle)
                             : [String(t.name||'').replace(/<[^>]+>/g,'')];
    return names.map((n,i)=>({text:n, isYou:!!t.isYou, gap:i===0}));
  }).filter(b=>b.length);
  if(!blocks.length) return;
  const total=blocks.reduce((s,b)=>s+b.length, 0);
  // Spilling out of the rectangle is the right call for a final, where a
  // contested box holds two or three squads. A Play-In holds two hundred, and
  // the same rule wrote four hundred names across the whole island — his
  // screenshot, 23 August: the map was a wall and nothing on it could be read.
  // So the column keeps what the box can carry at a readable size and folds
  // the rest into one «+N» line; the click-through list still names everybody.
  const cap=Math.max(4, Math.floor((zone.h*0.92)/1.2));
  let kept=blocks, extra=0;
  if(total>cap){
    const youB=blocks.find(b=>b.some(l=>l.isYou));
    kept=[];
    // Room is reserved for your own squad up front: being cut out of the box
    // you are standing in is the one fold that reads as a bug.
    let used=0, reserve=youB ? youB.length : 0;
    for(const b of blocks){
      const mine=b===youB;
      if(used+b.length+(mine?0:reserve) > cap-1) break;
      kept.push(b); used+=b.length;
      if(mine) reserve=0;
    }
    if(youB && kept.indexOf(youB)<0) kept.push(youB);
    extra=total-kept.reduce((s,b)=>s+b.length, 0);
  }
  const shown=[];
  kept.forEach((b,bi)=>b.forEach(l=>shown.push({...l, gap:l.gap && bi>0})));
  // 0.92 leaves the border and padding their two pixels; 2.0cqh is where a name
  // stops growing, so a single squad in a huge box does not print a headline.
  const k=Math.min(2.0, (zone.h*0.92)/(shown.length+(extra?1:0)));
  const size='clamp('+ZONE_NAME_MIN_PX+'px, '+k.toFixed(2)+'cqh, '+ZONE_NAME_MAX_PX+'px)';
  shown.forEach(l=>{
    const el=document.createElement('div');
    el.className='zone-name'+(l.isYou?' zone-name-you':'');
    el.style.fontSize=size;
    if(l.gap) el.style.marginTop='0.3em';
    // Cut on a phone, whole everywhere else; the title always carries the name.
    el.textContent = window.innerWidth<=ZONE_NAME_SHORT_AT ? zoneShortName(l.text) : l.text;
    el.title=l.text;
    plot.appendChild(el);
  });
  if(extra){
    const more=document.createElement('div');
    more.className='zone-name';
    more.style.fontSize=size;
    more.style.opacity='.75';
    more.textContent='+'+extra;
    more.title='+'+extra;
    plot.appendChild(more);
  }
}

/* «ПОКАЗАТЬ СУНДУКИ» НА КАРТЕ (отзыв: «может на карте писать количество
   сундуков, типо когда выбираешь метку там будет еще кнопка (показать сундуки)»).
   Каждая коробка на любой карте высадки несёт бирку с числом сундуков (поле chests,
   см. CC_CHESTS_SRC — fortnite.gg / вики / Kinch); бирки спрятаны, кнопка под картой
   включает их классом cc-chests-on на body, состояние помнится в localStorage. */
let CC_CHESTS_ON=false;
try{ CC_CHESTS_ON=localStorage.getItem('fncsdraft_chests')==='1'; }catch(e){}
function ccChestBadgeHTML(z){
  if(!ccSiteReal(z)) return '';
  return '<div class="land-zone-chests" title="'+ccSiteSrc()+'">'+L().landingChestsN(z.chests)+'</div>';
}
// Сколько сундуков в i-й коробке сетки key — по ZONE_STATS, без useLandingSet (карта
// своих меток рисует ZONE_SETS напрямую, у тех прямоугольников поля chests нет).
function ccZoneChestsOf(key, i){
  const s=(typeof ZONE_STATS!=='undefined' && ZONE_STATS[key] && ZONE_STATS[key][i]) || null;
  if(!s) return null;
  if(s.chests!=null) return s.chests;
  if(CC_CHESTS_SRC[key]==='Kinch' && s.loot!=null) return s.loot;
  return null;
}
function ccChestBadgeHTMLAt(key, i){
  const n=ccZoneChestsOf(key, i);
  if(n==null) return '';
  return '<div class="land-zone-chests" title="'+(CC_CHESTS_SRC[key]||'')+'">'+L().landingChestsN(n)+'</div>';
}
function ccChestBadge(plot, z){
  if(!ccSiteReal(z)) return;
  const b=document.createElement('div');
  b.className='land-zone-chests'; b.title=ccSiteSrc();
  b.textContent=L().landingChestsN(z.chests);
  plot.appendChild(b);
}
function ccChestsApply(){
  document.body.classList.toggle('cc-chests-on', CC_CHESTS_ON);
  document.querySelectorAll('.cc-chests-btn').forEach(b=>{ b.textContent=CC_CHESTS_ON ? L().landingChestsHide : L().landingChestsShow; });
}
function ccChestsToggle(){
  CC_CHESTS_ON=!CC_CHESTS_ON;
  try{ localStorage.setItem('fncsdraft_chests', CC_CHESTS_ON ? '1' : '0'); }catch(e){}
  ccChestsApply();
}
function ccChestToggleHTML(){
  return '<button type="button" class="cc-chests-btn" onclick="ccChestsToggle()">'+(CC_CHESTS_ON ? L().landingChestsHide : L().landingChestsShow)+'</button>';
}

function rerollAll(){
  if(rerollsLeft<=0) return;
  if(roundPlayerPicked && roundWeaponPicked && roundHealPicked) return;
  rerollsLeft--;
  updateRerollUI();
  if(!roundPlayerPicked){ currentCandidates=dailyRoll('p', generatePack); renderCandidates(currentCandidates); }
  if(!roundWeaponPicked){ currentWeaponOptions=dailyRoll('w', generateWeaponPack); renderItemPack(currentWeaponOptions, 'weaponCandidates', pickWeapon); }
  updateLootPoolNote();
  if(!roundHealPicked){ currentHealOptions=dailyRoll('h', generateHealPack); renderItemPack(currentHealOptions, 'healCandidates', pickHeal); }
}

// The Major's real teams, as cards, best first. This takes the place of the
// player pack when the run is a realistic one: the pack asks which player you
// want, and here that is not a question — a real team is a whole roster or it
// is not that team.
let teamPickList=[];

function renderTeamPicker(){
  const bar=document.getElementById('teamPickBar');
  const box=document.getElementById('teamPickSearch');
  const built=realTeamsFor(pool);
  teamPickList=built.teams;
  bar.style.display='block';
  box.placeholder=L().teamPickSearch;
  // The two reasons a roster is held back read as two clauses, because one
  // sentence about a filter was simply untrue for the twenty-one 2025 rows that
  // are the wrong size for the mode.
  document.getElementById('teamPickMeta').textContent =
    L().teamPickCount(built.teams.length) +
    (built.droppedSize ? ' · ' + L().teamPickDroppedSize(built.droppedSize) : '') +
    (built.droppedMissing ? ' · ' + L().teamPickDroppedMissing(built.droppedMissing) : '');
  box.oninput=()=>paintTeamPicker(box.value);
  paintTeamPicker(box.value);
}

function paintTeamPicker(query){
  const el=document.getElementById('candidates');
  const q=String(query||'').trim().toLowerCase();
  const shown=q ? teamPickList.filter(t=>t.handles.some(h=>h.toLowerCase().includes(q)))
                : teamPickList;
  el.innerHTML='';
  // A class rather than an inline display, so the one thing that has to be
  // cleared between runs is the one thing startDraft clears. #candidates is a
  // four-column pack grid by default and the team tiles want three wider ones;
  // both are grids, so nothing has to be switched off to switch the other on.
  el.classList.add('team-grid');
  if(!shown.length) el.classList.remove('team-grid');
  // An empty list must say it is empty. Rendering nothing leaves the player
  // looking at a blank panel with no way to tell a search that matched nobody
  // from a pool that holds no real roster at all.
  if(!shown.length){
    const note=document.createElement('div');
    note.className='region-note';
    note.style.cssText='padding:14px 4px;';
    note.textContent = teamPickList.length ? L().teamPickNoMatch : L().teamPickNone;
    el.appendChild(note);
    return;
  }
  shown.forEach(t=>{
    const row=document.createElement('div');
    row.className='team-row';
    // The same thing the weapon and consumable packs do: the wrapper carries the
    // rarity colour and .pick-btn draws itself from it. A player card takes that
    // from its own rarity and an item from its own; a team has neither, so it
    // takes it from the rating printed on the tile — which is the number the
    // list is ordered by, so the button's colour rises through the list with it.
    row.style.setProperty('--r-color', RARITY_COLOR[rarityForRating(Math.round(t.avg))]);
    row.innerHTML=
      '<div class="team-row-head"><b>' + Math.round(t.avg) + '</b>' +
        '<span class="team-row-who" title="' + esc(t.handles.join(' & ')) + '">' +
          esc(t.handles.join(' & ')) + '</span>' +
        '<span class="team-row-stage">' + t.stage + ' #' + t.rank + '</span></div>' +
      '<div class="team-row-cards">' + t.cards.map(c=>futCardHTML(c)).join('') + '</div>' +
      '<button class="pick-btn" style="width:100%;">' + L().teamPickBtn + '</button>';
    row.querySelector('.pick-btn').onclick=()=>pickTeam(t);
    el.appendChild(row);
  });
}

// Taking a team is the whole draft in one act: the roster goes into `drafted`
// entire, which is what every later stage of the app reads. Nothing downstream
// learns that this run was realistic.
function pickTeam(team){
  if(roundPlayerPicked) return;
  drafted=team.cards.slice();
  team.cards.forEach(c=>{ pool=pool.filter(x=>x.handle!==c.handle); });
  roundPlayerPicked=true;
  document.getElementById('teamPickBar').style.display='none';
  const cands=document.getElementById('candidates');
  cands.style.display='';
  cands.classList.remove('team-grid');
  renderSlots();
  renderPicked('candidates', team.cards.map(c=>pickedPlayerCard(c)));
  maybeAdvanceRound();
}

/* СИНЕРГИЯ ДО ВЫБОРА (16.10, его «да» на «показывать на карточке кандидата, что она даст»). Раньше синергию было видно
   только после выбора — в блоке состава; в паке игрок не знал, что кандидат сыгран с уже взятым, и в драфте дня
   терял до +10 силы. Здесь — сколько синергии прибавит именно этот выбор: та же computeSynergy на составе с ним и
   без него, оба с потолком SYN_POW_CAP (столько и пойдёт в силу), и откуда она: с кем сыгран, страна, язык. */
function synPickHint(p){
  if(!p) return '';
  const daily=(typeof DAILY!=='undefined' && DAILY);
  // В драфте дня роль решает силу, поэтому она видна на каждой карточке.
  const roleKey=daily ? dailyRoleOf(p) : null;
  const roleChip=daily && (roleKey || p.org) ? '<div class="syn-role'+(roleKey==='roleIGL' ? ' igl' : '')+'">'+esc([roleKey ? L()[roleKey]||'' : '', p.org||''].filter(Boolean).join(' · '))+'</div>' : '';
  if(!drafted.length) return roleChip;
  const cap=b=>synCap(b);
  const before=draftSynergy(drafted), after=draftSynergy(drafted.concat([p]));
  const d=cap(after.bonus)-cap(before.bonus);
  if(d<=0) return roleChip;
  const was=new Set(before.links.map(l=>l.type+'|'+l.a+'|'+l.b));
  const fresh=after.links.filter(l=>(l.a===p.handle || l.b===p.handle) && !was.has(l.type+'|'+l.a+'|'+l.b));
  const W=({ru:['страна', 'язык', 'с'], fr:['pays', 'langue', 'avec'], it:['paese', 'lingua', 'con'], pt:['país', 'idioma', 'com'],
    de:['Land', 'Sprache', 'mit'], es:['país', 'idioma', 'con']}[LANG]) || ['country', 'language', 'with'];
  const mates=fresh.filter(l=>l.type==='partner').map(l=>l.a===p.handle ? l.b : l.a);
  const why=[];
  if(mates.length) why.push(W[2]+' '+mates.join(', '));
  // Страна и язык платятся раз на состав: причина — только если этот выбор их и открывает.
  const has=(s, t)=>s.links.some(l=>l.type===t);
  if(has(after, 'nation') && !has(before, 'nation')) why.push(W[0]);
  if(has(after, 'language') && !has(before, 'language')) why.push(W[1]);
  if(daily && after.role>before.role) why.push(L().roleIGL||'IGL');
  if(daily && after.chain && !before.chain) why.push(dailySynWords().chain+' '+after.chain.via);
  if(daily && after.club && !before.club) why.push(after.club.org);
  return roleChip+'<div class="syn-hint" title="'+esc(L().synergyLabel||'')+'">🔗 +'+d+(why.length ? ' · '+esc(why.join(' · ')) : '')+'</div>';
}
function renderCandidates(list){
  const el=document.getElementById('candidates');
  el.innerHTML='';
  const filtered = activeRegion==='ALL' ? list : list.filter(p=>p.region===activeRegion);
  const shown = filtered.length>0 ? filtered : list;
  shown.forEach(p=>{
    {
      const c=document.createElement('div');
      c.style.cssText='display:flex;flex-direction:column;gap:2px;';
      const rar=shownRarity(p);
      c.style.setProperty('--r-color', RARITY_COLOR[rar]);
      c.innerHTML=futCardHTML(p)+synPickHint(p)+`<button class="pick-btn" style="width:100%;">${L().pickBtn}</button>`;
      c.querySelector('.pick-btn').onclick=()=>pick(p);
      wireCardPeek(c, p);
      el.appendChild(c);
      return;
    }
    const c=document.createElement('div');
    c.className='pcard'+(p.rating===101?' s1ned-special':'');
    c.style.setProperty('--r-color',RARITY_COLOR[shownRarity(p)]);
    const flag = cardFlag(p, 15);
    const statLine = p.placement!=null
      ? `${translateEventText(p.event)}<br>${translateDate(p.date)} - <b>${ccTop(p.placement)}</b>`
      : `${translateEventText(p.event)}<br>${translateDate(p.date)} — <b>${L().placeholderNotPublished}</b>`;
    c.innerHTML = `
      <div class="pcard-top">
        <div class="rarity-tag">${p.tier==='ranked'?shownRarity(p):L().qualifierTag}</div>
        <div class="rating-pill">${p.rating}</div>
      </div>
      <div class="p-handle">${flag}${p.handle}</div>
      <div class="p-meta">${regionName(p.region)}${p.nat?' · '+natDisplay(p.nat):''}</div>
      <div class="p-stats">${statLine}</div>
      <button class="pick-btn">${L().pickBtn}</button>`;
    c.querySelector('.pick-btn').onclick=()=>pick(p);
    el.appendChild(c);
  });
}

function pick(p){
  if(roundPlayerPicked) return;
  drafted.push(p);
  pool=pool.filter(x=>x.handle!==p.handle);
  roundPlayerPicked=true;
  renderSlots();
  renderPicked('candidates', [pickedPlayerCard(p)]);
  maybeAdvanceRound();
}

function vertexPositions(n){
  const cx=130, cy=115, R=85;
  const pos=[];
  for(let i=0;i<n;i++){
    const angle = -Math.PI/2 + i*(2*Math.PI/n);
    pos.push({x:cx+R*Math.cos(angle), y:cy+R*Math.sin(angle)});
  }
  return pos;
}

function renderSynergySvg(syn){
  const svg=document.getElementById('synergySvg');
  const n=squadSize;
  const pos=vertexPositions(n);
  let lines='', nodes='';
  for(let i=0;i<n;i++){
    for(let j=i+1;j<n;j++){
      const a=drafted[i], b=drafted[j];
      let link=null;
      if(a&&b) link=syn.links.find(l=>(l.a===a.handle&&l.b===b.handle)||(l.a===b.handle&&l.b===a.handle));
      const stroke = link ? (link.type==='partner' ? 'var(--accent)' : link.type==='language' ? 'var(--epic)' : link.type==='chain' ? 'var(--legendary, #f5a623)' : link.type==='club' ? 'var(--mythic, #ffd200)' : 'var(--rare)') : 'var(--line)';
      const width = link ? 2.5 : 1;
      lines += `<line x1="${pos[i].x}" y1="${pos[i].y}" x2="${pos[j].x}" y2="${pos[j].y}" stroke="${stroke}" stroke-width="${width}"/>`;
      if(link){
        const mx=(pos[i].x+pos[j].x)/2, my=(pos[i].y+pos[j].y)/2;
        lines += `<circle cx="${mx}" cy="${my}" r="9" fill="var(--panel)" stroke="${stroke}" stroke-width="1"/>`;
        lines += `<text x="${mx}" y="${my+3}" text-anchor="middle" font-size="9" font-family="ui-monospace,Menlo,monospace" fill="${stroke}">+${link.val}</text>`;
      }
    }
  }
  for(let i=0;i<n;i++){
    const p=drafted[i];
    const color = p ? RARITY_COLOR[shownRarity(p)].replace('var(','').replace(')','') : '--line';
    const fill = p ? `var(${color})` : 'var(--line)';
    nodes += `<circle cx="${pos[i].x}" cy="${pos[i].y}" r="22" fill="var(--panel2)" stroke="${fill}" stroke-width="2"/>`;
    const label = p ? (p.handle.length>8?p.handle.slice(0,7)+'…':p.handle) : '?';
    nodes += `<text x="${pos[i].x}" y="${pos[i].y+4}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--ink)">${label}</text>`;
    if(p && p.nat && FLAG_CODE[p.nat]){
      nodes += `<image href="flags/w40/${FLAG_CODE[p.nat]}.png" x="${pos[i].x-11}" y="${pos[i].y-38}" width="22" height="16" style="border-radius:2px;"/>`;
    }
  }
  svg.innerHTML = lines + nodes;
}

function renderSlots(){
  document.getElementById('squadFilled').textContent=drafted.length;
  const avgEl=document.getElementById('squadAvg');
  if(drafted.length>0){
    const avg=Math.round(drafted.reduce((s,p)=>s+p.rating,0)/drafted.length);
    avgEl.innerHTML=avg+'/100';
  } else {
    avgEl.innerHTML='-';
  }
  const syn=draftSynergy(drafted);
  document.getElementById('synergyVal').textContent='+'+syn.bonus;
  document.getElementById('synergyDetails').innerHTML=syn.details.map(d=>'· '+d).join('<br>');
  renderSynergySvg(syn);
  const loadoutEl=document.getElementById('loadoutVal');
  const lb=loadoutBonus();
  loadoutEl.textContent=(lb>=0?'+':'')+lb;
  loadoutEl.style.color = lb>=0 ? 'var(--accent)' : 'var(--danger)';

  // Roles: what the squad covers, and what that is worth. Two players of the
  // same kind cover one role and earn nothing.
  const roleEl=document.getElementById('roleVal');
  const roleNamesEl=document.getElementById('roleNames');
  if(roleEl){
    if(CARD_MODE && drafted.length>0){
      const t=buildTeam(drafted);
      roleEl.textContent=(t.roleBonus>0?'+':'')+t.roleBonus;
      roleEl.style.color = t.roleBonus>0 ? 'var(--accent)' : 'var(--ink-dim)';
      roleNamesEl.textContent=[...(t.roles||[])].map(k=>L()[k]).join(' + ');
    } else {
      roleEl.textContent='+0'; roleEl.style.color='var(--ink-dim)';
      roleNamesEl.textContent='';
    }
  }

  const totalPowerEl=document.getElementById('totalPowerVal');
  if(drafted.length>0){
    const landingPts = (chosenLanding && chosenLanding.zone) ? chosenLanding.points : 0;
    // Exactly what buildFullLobby will hand the simulation, so the number on
    // screen is the number that plays.
    const totalPower=Math.round(buildTeam(drafted).pow)+lb+landingPts;
    totalPowerEl.textContent=totalPower;
    totalPowerEl.style.color = totalPower>100 ? '#ffd700' : (totalPower<0 ? 'var(--danger)' : 'var(--accent)');
    totalPowerEl.style.textShadow = totalPower>100 ? '0 0 8px rgba(255,215,0,.6)' : 'none';
  } else {
    totalPowerEl.textContent='-';
    totalPowerEl.style.textShadow='none';
  }

  const el=document.getElementById('slots');
  el.innerHTML='';
  for(let i=0;i<squadSize;i++){
    const p=drafted[i];
    const d=document.createElement('div');
    if(p){
      d.className='slot filled'+(p.rating===101?' s1ned-special':'');
      d.style.setProperty('--r-color',RARITY_COLOR[shownRarity(p)]);
      const flag = cardFlag(p, 14);
      const a=attrsFor(p);
      d.innerHTML=`<div><div class="h">${flag}${p.handle}</div><div class="r">${L()[a.roleKey]} · ${regionName(p.region)}</div></div><div class="sr">${a.ovr}</div>`;
      d.style.cursor='zoom-in';
      d.title=L().cardPeekHint;
      d.onclick=()=>openCardPeek(p);
    } else {
      d.className='slot empty';
      d.textContent=L().emptySlot;
    }
    el.appendChild(d);
  }
}

const PLACEMENT_POINTS_DUO=[65,56,52,48,44,40,38,36,34,32,30,28,26,24,22,20,18,16,14,12,10,8,6,4,2];
// Epic publishes placement scoring as thresholds you bank on the way up, not as
// a payout for the finish you ended on: "Victory Royale +11, Reach Top 2 +6,
// Reach Top 3 +4 …". A squad that wins reaches every one of those, so it banks
// all of them — a Victory Royale is worth 65, not 11.
//
// The trio and squad tables were entered as the published increments and used
// as if they were the totals, so a win paid 11 while a single elimination paid
// 4: three kills outscored winning the game, and the whole trio standings were
// a kill race with placement as a rounding error. The duo table above was
// already written out in banked totals, which is why it starts at the same 65
// and why duos never looked wrong.
//
// Kept as the published steps and added up here rather than as a hand-totalled
// array, so the next table copied off a rules page cannot make the same mistake.
function bankedPlacementTable(steps){
  const last=steps.length ? steps[steps.length-1][0] : 0;
  const table=[];
  for(let place=1; place<=last; place++){
    let sum=0;
    steps.forEach(function(step){ if(place<=step[0]) sum+=step[1]; });
    table.push(sum);
  }
  return table;
}
// FNCS 2025 trios, straight off the rules page: VR +11, Top 2 +6, Top 3-5 +4
// each, Top 6-17 +3 each, nothing past 17th. Totals: 65, 54, 48, 44, 40, 36 …
const PLACEMENT_POINTS_TRIO=bankedPlacementTable(
  [[1,11],[2,6],[3,4],[4,4],[5,4]].concat(
    Array.from({length:12}, (_, i) => [6+i, 3])));
// Same shape, cut off at 13th instead of 17th — a squad lobby is 25 teams, not
// 33, so the points stop higher up the table.
const PLACEMENT_POINTS_SQUAD=bankedPlacementTable(
  [[1,11],[2,6],[3,4],[4,4],[5,4]].concat(
    Array.from({length:8}, (_, i) => [6+i, 3])));
/* Converts a ladder to the trio room, two thirds of the lobby.
   Epic only published a trio table for FNCS: duos pay 25 places, trios 17 (ccTeams of 25), VR is 65 in both.
   So keep the published steps, cut where the shorter room ends, rescale so the VR keeps its value.
   On the FNCS duo ladder this gives 65, 56, 51, 46, 41, 36, 33, 30... vs Epic's 65, 54, 48, 44, 40, 36, 33, 30, never more than 3 apart (check-career-trio-points).
   FNCS itself uses the measured table, this is only for ladders with no trio data. */
function ccTrioLadder(duo){
  const n=Math.max(1, ccTeams((duo||[]).length));
  const top=(duo||[])[0]||0;
  if(!top) return (duo||[]).slice();
  // The published steps, cut off where the trio room ends.
  const steps=[];
  for(let i=0;i<n;i++) steps.push((duo[i]||0)-(duo[i+1]||0));
  const sum=steps.reduce((a,b)=>a+b, 0) || 1;
  const k=top/sum;
  const up=steps.map(s=>Math.max(1, Math.round(s*k)));
  const out=new Array(n);
  let run=0;
  for(let i=n-1;i>=0;i--){ run+=up[i]; out[i]=run; }
  /* And the win is made exact rather than left to the rounding: what a Victory
     Royale pays is the one number the rules print outright, so it is the one
     number that must survive being carried across. */
  out[0]=top;
  return out;
}
// Кэш: таблица одна на формат, а спрашивают её каждую игру каждого лобби.
const CC_TRIO_LADDERS={};
function ccTrioLadderOf(key, duo){
  if(!CC_TRIO_LADDERS[key]) CC_TRIO_LADDERS[key]=ccTrioLadder(duo);
  return CC_TRIO_LADDERS[key];
}
function placementTable(){
  return squadSize===3 ? PLACEMENT_POINTS_TRIO : squadSize===4 ? PLACEMENT_POINTS_SQUAD : PLACEMENT_POINTS_DUO;
}
function pointsForPlace(place){ const rl=reloadPointsForPlace(place); if(rl!==null) return rl;
  const t=placementTable(); return place<=t.length ? t[place-1] : 0; }

// The Reload Elite Series pays its own table, and both the way it is published
// and the way it is scored say the same thing twice. The official rules print
// what a placing is worth outright — a Victory Royale 60, second 50, third 45,
// down to 3 for fifteenth — while the leaderboard prints the steps it is built
// from: 10 for the win, 5 for reaching each of the top five, 3 for reaching
// each of the top fifteen. They add up to each other exactly, and Epic's
// payload for cup 4 breaks a team's score down into those same steps.
//
// Cup 1 paid a steeper podium and stopped at twelfth; cups 2, 3 and 4 pay
// flatter and further down. Nothing past the end of a table scores.
const R_PLACEMENT={
  r1:[60,50,42,36,32,28,24,20,16,12,8,4],
  r2:[60,50,45,40,35,30,27,24,21,18,15,12,9,6,3],
  r3:[60,50,45,40,35,30,27,24,21,18,15,12,9,6,3],
  r4:[60,50,45,40,35,30,27,24,21,18,15,12,9,6,3]
};
// One table for every stage of a cup: the rules give the Opens and the Heats
// the same placement ladder and differ only on what a kill is worth.
function reloadPlacementTable(){
  return (CARD_MODE && R_PLACEMENT[CARD_SET]) || null;
}
function reloadPointsForPlace(place){
  const t=reloadPlacementTable();
  return t ? (place<=t.length ? t[place-1] : 0) : null;
}

const TEAM_TARGET={2:50, 3:33, 4:25};
let fillerSeq=0;
function makeFiller(){
  fillerSeq++;
  return {handle:'Резерв-'+fillerSeq, partner:null, nat:null, region:'GEN',
    event:'Резервный игрок (не реальный участник FNCS)', date:'-', placement:null,
    rarity:'common', rating:38, tier:'filler'};
}

const PLAYIN_TARGET=500;
const CARD_FIELD=150;
function fieldTarget(){ return CARD_MODE ? CARD_FIELD : PLAYIN_TARGET; }

// AI drafting for card mode. Each bot team is dealt a pack of random candidates
// per slot and takes the strongest one, with enough noise that lobbies are not
// perfectly sorted by rating, plus a nudge toward covering a second role — the
// same trade-off the player is making.
// Duos that were already locked when this Major was played.
//
// Major 1 is an open field: everybody enters with whoever they like, so nothing
// is fixed and the bots are pack-drafted exactly as before.
//
// Major 2 is not. The fifteen duos that came out of the Major 1 Summit already
// held a seat at the Belgian LAN before Major 2 started, and a seat belongs to a
// pair, not to two individuals — they are obliged to enter Major 2 together and
// to turn up in Antwerp as the same duo. They used to be pack-drafted like
// everyone else, which is how vic0 and Malibuca ended up on two different teams
// in the same Play-In while the LAN roster still listed them as a pair.
//
// Everyone else in Major 2 is unlocked and drafted at random, the same as
// Major 1. The one thing that breaks a locked pair is the player drafting one of
// its two players: the pool handed in here already has the player's picks
// removed, so the survivor simply never finds their partner — vic0 taken leaves
// Malibuca needing somebody new, exactly as Pollo would if you took Peterbot.
// 2025 works the same way and Epic wrote it down: rule 4.1.7 of the FNCS 2025
// rules locks a player who qualified for the Global Championship from a Major to
// that trio "for the Global Championship and for any following FNCS Major(s)",
// and the only way out is all three disbanding and forfeiting the seat. So the
// trios that took a Global Championship seat out of Major 1 enter Major 2
// together, exactly as the Summit duos enter 2026's Major 2 together.
// The lock compounds: a Major 1 qualifier is held together through Major 2 *and*
// Major 3, and by Major 3 the Major 2 qualifiers are locked as well. So Major 3's
// lobby seats both sets of trios as they really entered it.
function lockedTeamsForSet(){
  return CARD_SET==='m2' ? GC_SUMMIT_DUOS
       : CARD_SET==='t2' ? GC2025_M1_TRIOS
       : CARD_SET==='t3' ? GC2025_M1_TRIOS.concat(GC2025_M2_TRIOS)
       // 2024: места в Форт-Уэрт давали все три Мейджора — к третьему заняты дуо первых двух.
       : CARD_SET==='f2' ? GC2024_M1_DUOS
       : CARD_SET==='f3' ? GC2024_M1_DUOS.concat(GC2024_M2_DUOS) : [];
}
// Every trio that really played this Major, deduplicated -- a team that reached
// the Grand Final is recorded at both stages it played.
//
// These are not seated, and the distinction is the whole rule. Holding a seat is
// what binds three players together: rule 4.1.7 locks a Global Championship
// qualifier to the trio they won it with, and nothing binds anybody else. A trio
// that entered Major 2 and qualified for nothing is free to be three different
// people by Major 3, so restoring all 1309 of them filled the lobby with teams
// that had earned no right to be intact — 47 of 49 opponents in Major 2, every
// one of them carrying full teammate chemistry against a player who drafts.
//
// Kept because it is the honest count of what the results sheet holds, and
// tools/check-field-seating.js reads it to prove those teams are not seated.
function realTeamsForSet(){
  const trios=(typeof CARD_TRIOS_BY_SET!=='undefined') && CARD_TRIOS_BY_SET[CARD_SET];
  if(!trios || !trios.length) return [];
  const seen=new Set(), out=[];
  trios.forEach(t=>{
    const hs=t.handles||[];
    if(hs.length<2) return;
    const k=hs.map(h=>_gcNorm(h)).sort().join('|');
    if(seen.has(k)) return;
    seen.add(k); out.push(hs);
  });
  return out;
}
// Who is seated: the teams that hold a seat, and nobody else.
//
// A seat is the only thing that binds three players together. Rule 4.1.7 locks a
// Global Championship qualifier to the trio they won it with for that event and
// every Major after it; everyone else may enter the next Major with whoever they
// like, and mostly does. So Major 1 seats nobody — nobody has qualified yet —
// and Majors 2 and 3 seat exactly their qualifiers, the eight trios out of Major
// 1 and, by Major 3, the Major 2 trios as well.
//
// The rest of every lobby is drafted, in an opener and in a qualifying Major
// alike. This used to also restore realTeamsForSet(), which is every trio the
// results sheet records rather than every trio that won something, and it put
// 47 intact rosters into a 49-team Major 2 lobby — each with full teammate
// chemistry, against a player who is drafting one card at a time.
function seatingTeamsForSet(){
  return lockedTeamsForSet();
}
// A LAN seat follows the pair, and the pair is whoever actually entered Major 2
// together. Normally that is the duo off the Summit; when the player drafts one
// of them the survivor enters with somebody new, and it is that new pair which
// flies to Antwerp. Recorded as the lobby is built so the LAN roster can look it
// up instead of dropping the stranded qualifier altogether.
let LOCKED_TEAM_SUBS=new Map();
// Team size is an argument now, because 2025's locked teams are trios. For a
// duo this does exactly what it did before: survivors first, paired by rating,
// the odd one given the best free player from their own region, then the teams
// that are still whole.
function seatLockedTeams(pool, teamCount, size){
  const lockedOnly=lockedTeamsForSet();
  const locked=seatingTeamsForSet();
  if(!locked.length) return {squads:[], rest:pool};
  // Only a locked team's survivors get the priority seat. Doing it for every
  // real team fills the lobby with rebuilt fragments before a single intact team
  // is placed — with eighteen hundred real trios in the list that seated none of
  // the locked ones at all. A real team that cannot be seated whole simply steps
  // aside and its players go back into the random fill.
  const lockedKeys=new Set(lockedOnly.map(t=>t.map(h=>_gcNorm(h)).sort().join('|')));
  // Лучшая карточка на ник, а не первая попавшаяся — то же правило, что у
  // gcCardIndex этажом выше и по той же причине: один человек держит и
  // карточку плей-ина, и карточку финала, а на ЛАН летит второй.
  // «Первая попавшаяся» держалась только на том, что у большинства карточка
  // была одна. Как только сведение написаний добавило вторым тем, кто был
  // записан двумя способами, посадка стала зависеть от порядка в массиве.
  const byKey=new Map();
  pool.forEach(pl=>{ const k=_gcNorm(pl.handle); const cur=byKey.get(k);
    if(!cur || (pl.rating||0)>(cur.rating||0)) byKey.set(k, pl); });
  const look=h=>{ const k=_gcNorm(h); return byKey.get(k) || byKey.get(_gcNorm(GC_HANDLE_ALIAS[k]||'')); };
  const intact=[], orphans=[], claimed=new Set();
  locked.forEach(team=>{
    const found=team.map(look).filter(Boolean).filter((pl,i,a)=>a.indexOf(pl)===i)
                    .filter(pl=>!claimed.has(hKey(pl)));
    if(found.length===team.length){
      found.forEach(pl=>claimed.add(hKey(pl)));
      intact.push(found);
    } else if(lockedKeys.has(team.map(h=>_gcNorm(h)).sort().join('|'))){
      // The rest of the team is gone -- drafted by the player, or simply not in
      // this pool. A locked team's survivor keeps their seat and needs a new team.
      found.forEach(pl=>{ claimed.add(hKey(pl)); orphans.push(pl); });
    }
  });
  const squads=[], used=new Set();
  const orphanKeys=new Set(orphans.map(pl=>_gcNorm(pl.handle)));
  const take=sq=>{
    squads.push(sq); sq.forEach(pl=>used.add(hKey(pl)));
    // if this seat was made for a stranded qualifier, remember the new team
    sq.forEach(pl=>{ if(orphanKeys.has(_gcNorm(pl.handle))) LOCKED_TEAM_SUBS.set(_gcNorm(pl.handle), sq.slice()); });
  };
  // Survivors are seated before the teams that are still whole, so a player the
  // draft stranded cannot be squeezed out of their own tournament by them.
  orphans.sort((a,b)=>attrsFor(b).ovr-attrsFor(a).ovr);
  let k=0;
  while(k+size<=orphans.length && squads.length<teamCount){ take(orphans.slice(k,k+size)); k+=size; }
  if(k<orphans.length && squads.length<teamCount){
    const rest=orphans.slice(k);
    const need=size-rest.length;
    const mates=pool.filter(pl=>!claimed.has(hKey(pl)) && !used.has(hKey(pl)) && pl.region===rest[0].region)
      .sort((a,b)=>attrsFor(b).ovr-attrsFor(a).ovr).slice(0, need);
    if(mates.length===need) take(rest.concat(mates));
  }
  intact.forEach(t=>{ if(squads.length<teamCount) take(t); });
  return {squads, rest: pool.filter(pl=>!used.has(hKey(pl)))};
}

function draftBotSquads(pool, teamCount, size){
  const squads=[];
  let remaining=pool;
  // Real teams first, wherever the set has any. This used to be duos only, on
  // the grounds that trio and squad modes are fantasy formats with no real
  // pairings to preserve — true of the free modes, and not true of 2025, whose
  // Major 1 qualifiers are locked together by rule into Major 2.
  if(CARD_MODE && seatingTeamsForSet().length){
    const seated=seatLockedTeams(remaining, teamCount, size);
    squads.push(...seated.squads);
    remaining=seated.rest;
  }
  // Region-locked drafting for whatever the real pairings did not cover: each
  // bot team is assigned a region and only ever sees cards from it, so no squad
  // ends up half European and half American.
  const byRegion={};
  remaining.forEach(p=>{ (byRegion[p.region]=byRegion[p.region]||[]).push(p); });
  for(let i=squads.length; i<teamCount; i++){
    // Prefer whichever region still has the most players left, so the field
    // stays proportional to how many cards each region contributes.
    const codes=Object.keys(byRegion).filter(c=>byRegion[c].length>=size);
    if(!codes.length) break;
    codes.sort((a,b)=>byRegion[b].length-byRegion[a].length);
    const region=codes[Math.floor(Math.random()*Math.min(2, codes.length))];
    const avail=byRegion[region];
    const squad=[];
    for(let s=0; s<size; s++){
      const packSize=Math.min(PACK_SIZE, avail.length);
      // Dealt off the same curve the player is dealt off. This used to draw
      // uniformly out of the region's remaining cards, which is a pool with a
      // long tail and a low median, so a bot team almost never collected three
      // elite players while the player — whose packs are weighted (ovr-floor)^exp
      // — routinely did. Measured in the 2025 Major 1 opener: the best draft
      // averaged 96 OVR against a best bot team of 82-85, and finished 13 power
      // clear of the entire field. weightedPick already says card mode deals to
      // both sides off one curve; this is the path card mode actually takes.
      const picked=new Set();
      const weights=avail.map(packWeightFor);
      let total=weights.reduce((s,w)=>s+w,0);
      let guard=0;
      while(picked.size<packSize && guard++<packSize*40){
        let r=Math.random()*total, idx=0;
        for(;idx<avail.length;idx++){ r-=weights[idx]; if(r<=0) break; }
        picked.add(Math.min(idx, avail.length-1));
      }
      // A degenerate pool (every weight equal to zero) still has to return a pack.
      while(picked.size<packSize) picked.add(Math.floor(Math.random()*avail.length));
      const have=new Set(squad.map(p=>attrsFor(p).roleKey));
      let best=null, bestScore=-Infinity;
      picked.forEach(idx=>{
        const p=avail[idx], a=attrsFor(p);
        const score = a.ovr + (have.has(a.roleKey) ? 0 : 4) + Math.random()*14;
        if(score>bestScore){ bestScore=score; best=p; }
      });
      squad.push(best);
      avail.splice(avail.indexOf(best), 1);
    }
    squads.push(squad);
  }
  const rest=[];
  Object.keys(byRegion).forEach(c=>rest.push(...byRegion[c]));
  return {squads, rest};
}

function buildFullLobby(){
  LOCKED_TEAM_SUBS=new Map();
  const usedHandles=new Set(drafted.map(hKey));
  const teams=[];
  const you=buildTeam(drafted);
  you.pow+=loadoutBonus();
  you.name=L().yourTeamPrefix+teamLabel(drafted); you.isYou=true;
  teams.push(you);
  let remaining=tournamentPool().filter(p=>!usedHandles.has(hKey(p)));
  // In card mode the AI drafts exactly like the player does: each opponent team
  // opens packs from the same pool and picks, so the field is built by drafting
  // rather than restored from the historical duos.
  if(CARD_MODE && cardRosterPlayers().length){
    // Each region runs its own tournament, exactly like the real FNCS — so the
    // whole field is drawn from the region your own squad plays in.
    const myRegion=ccHomeRegion();
    const sameRegion=remaining.filter(p=>p.region===myRegion);
    if(sameRegion.length>=squadSize*2) remaining=sameRegion;
    const need=fieldTarget()-teams.length;
    // This is the Major itself — Play-In, Heats, LCQ and the Grand Final all
    // read the field this builds. A realistic run plays it against the Major's
    // own rosters, by the same rules the later stages use: whole real teams
    // first, nobody in two of them, and whatever the pool cannot fill drafted
    // the old way and logged. Routed through fillRealFieldTeams rather than
    // reimplemented, so there is one description of what a real field is.
    if(REALISTIC){
      remaining=fillRealFieldTeams(remaining, need, squadSize, teams);
    } else {
      const res=draftBotSquads(remaining, need, squadSize);
      res.squads.forEach(sq=>{
        const t=buildTeam(sq); t.loadout=randomLoadoutBonus(sq.length); t.pow+=t.loadout; t.name=teamLabel(sq);
        teams.push(t);
      });
      remaining=res.rest;
    }
  }
  while(remaining.length>=2 && teams.length<fieldTarget()){
    const {chunk, remaining:rest}=pickTeamChunk(remaining, 2);
    remaining=rest;
    const t=buildTeam(chunk); t.loadout=randomLoadoutBonus(chunk.length); t.pow+=t.loadout; t.name=teamLabel(chunk); teams.push(t);
  }
  while(teams.length<fieldTarget()){
    const chunk=[makeFiller(), makeFiller()];
    const t=buildTeam(chunk); t.loadout=randomLoadoutBonus(chunk.length); t.pow+=t.loadout; t.name=teamLabel(chunk); teams.push(t);
  }
  return teams;
}

// Play-In and Heats, per squad size, on the same banked-threshold rule as the
// finals: every "Reach Top N" a team passes is collected, so a Victory Royale
// takes all of them plus its own bonus.
//
// Both stages used to be written out as the duo table and used at every squad
// size, so a trio Major played its first two stages on one scale and its final
// on another. These are the published tables instead — duo below, trio from the
// 2025 rules page, and squads on the shape both of them share.
//
// The Top-N rows, without the Victory Royale, which is handled separately.
const PLAYIN_STEPS={
  2: [[2,4],[3,4],[4,4],[5,4]].concat(Array.from({length:20}, (_, i) => [6+i, 2])),
  3: [[2,6],[3,4],[4,4],[5,4]].concat(Array.from({length:12}, (_, i) => [6+i, 3])),
  4: [[2,6],[3,4],[4,4],[5,4]].concat(Array.from({length:8},  (_, i) => [6+i, 3]))
};

// What a won game is worth, whole. Not a constant anybody chose — it is what
// the two published tables both come out at, and it is the reason the Victory
// Royale bonus is the odd number it is.
//
//   Play-In duo:  9 + 4×4 + 2×20 = 65      Play-In trio: 11 + 6 + 4×3 + 3×12 = 65
//   Heats   duo: 944 + 4×4 + 2×20 = 1000   Heats   trio: 946 + 6 + 4×3 + 3×12 = 1000
//
// Two modes, two stages, four exact hits — so the bonus is derived from the
// total rather than copied per mode, and the squad column (which no rules page
// covers) falls out of the same rule instead of being invented.
const PLAYIN_WIN_TOTAL=65;
// The Heats bonus is enormous on purpose: it is what makes one won game an
// instant qualification rather than something a rival can grind past on points.
const HEATS_WIN_TOTAL=1000;

function bankedStageTable(steps, winTotal){
  let below=0;
  steps.forEach(function(step){ below+=step[1]; });
  return bankedPlacementTable([[1, winTotal-below]].concat(steps));
}
const PLAYIN_TABLE={}, HEATS_TABLE={};
[2,3,4].forEach(function(size){
  PLAYIN_TABLE[size]=bankedStageTable(PLAYIN_STEPS[size], PLAYIN_WIN_TOTAL);
  HEATS_TABLE[size] =bankedStageTable(PLAYIN_STEPS[size], HEATS_WIN_TOTAL);
});
const PLAYIN_VR_BONUS=PLAYIN_WIN_TOTAL-PLAYIN_STEPS[2].reduce((a,s)=>a+s[1],0);
const HEATS_VR_BONUS =HEATS_WIN_TOTAL -PLAYIN_STEPS[2].reduce((a,s)=>a+s[1],0);

function playInPointsForPlace(place){
  const rl=reloadPointsForPlace(place); if(rl!==null) return rl;
  const t=PLAYIN_TABLE[squadSize]||PLAYIN_TABLE[2];
  return place<=t.length ? t[place-1] : 0;
}
function heatsScoreForPlace(place){
  const rl=reloadPointsForPlace(place); if(rl!==null) return rl;
  const t=HEATS_TABLE[squadSize]||HEATS_TABLE[2];
  return place<=t.length ? t[place-1] : 0;
}

// Heats standings are ordered on points, the way the real leaderboard reads.
// Qualification is separate: a Victory Royale qualifies you outright and you
// stop playing, so a winner can sit low on points and still be through — those
// rows are flagged instead of being shoved to the top of the table.
function heatsRank(a, b){
  /* Level on points, and then the wins.

     Every table in this file broke a tie on eliminations and only looked at
     Victory Royales third, which put a duo on four wins under a duo on two with
     the same 479 — his screenshot, 18 August. A win is the thing the format is
     about; kills are how you got there. So the order is points, then wins, then
     kills, everywhere a standing is sorted. */
  return b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims;
}

// The top of the table up to the cut, and everyone with a Victory Royale
// besides. Returns a Set for the standings table to mark.
// Per-region Major format, straight out of the 2026 official rules
// (sections 2.2.2 through 2.2.6). EU and NAC are the deep regions: 150 teams
// out of Play-In, three heats, a narrow top-10 points cut. Everywhere else the
// field is 100, split across two heats, and the thinner bracket is balanced by
// a much wider top-18 cut. Match counts differ too — in Major 1 only, OCE and
// ASIA play a sixth game in Heat 2, and their Last Chance Lobby is three games
// rather than four.
//
// Every branch lands on the same Finals field of 50, because each heat sends
// through its Victory Royales plus the points cut, and the Last Chance Lobby
// contributes exactly one winner per game it plays:
//   EU/NAC      3 x (5 VR + 10 pts) = 45, + 5 LCL games = 50
//   OCE/ASIA M1 (5+18) + (6+18)     = 47, + 3 LCL games = 50
//   others      (5+18) + (5+18)     = 46, + 4 LCL games = 50
const DEEP_MAJOR_REGIONS=new Set(['EU','NAC']);
// What the 2025 Last Chance route actually delivered, region by region. Every
// Lobby ran three matches, but the Middle East sent nobody -- all 26 of its
// teams played all three, where every other region had teams stop early on a
// win -- and Oceania sent two. Games and qualifiers are different quantities
// in 2025, which is why this exists separately from lclGames.
const LCQ_WINNERS_2025={EU:3, NAC:3, NAW:3, BR:3, ASIA:3, ME:0, OCE:2};
// Majors 2 and 3, counted the same way by tools/count-2025-bracket.js. A Lobby
// leaderboard scores exactly 1000 for a team that advanced and exactly 0 for one
// that did not -- placement and Victory Royale are worth nothing there -- so the
// total is the flag, not a proxy for it. Every one of these qualifiers was then
// found in its region's Grand Final, which is what makes the count safe to use.
const LCQ_WINNERS_T2={EU:3, NAC:3, NAW:3, BR:3, ASIA:3, ME:3, OCE:2};
const LCQ_WINNERS_T3={EU:3, NAC:3, NAW:2, BR:3, ASIA:3, ME:2, OCE:3};
const LCQ_WINNERS_2025_BY_SET={t1:LCQ_WINNERS_2025, t2:LCQ_WINNERS_T2, t3:LCQ_WINNERS_T3};
// What a Play-In advances is however many teams the Heats can seat: one lobby
// per heat. Every number this file used to hard-code falls out of it — three
// heats of fifty duos is 150, three of thirty-three trios is 99, two of each is
// 100 and 66 — which is why it is computed rather than listed. A player reported
// the trio Major sending 150 through when the answer is 99, and it was the free
// modes doing it: they run majorFormat with no card set, so they were handed the
// duo shape whatever size the squads were.
function playInSeats(heatCount){
  return heatCount * (TEAM_TARGET[squadSize] || 50);
}
// Reload is not Battle Royale and its bracket is not FNCS's. A match is twenty
// duos, not fifty; the Play-In sends its top eighty into four heats of twenty;
// each heat is eight games and only its top five come out; the final is those
// twenty over eight games. All of it counted off the circuit's own leaderboards
// rather than read off a bracket page — see the spec. And there is no last
// chance: miss the eighty and the cup is over.
const R_FORMAT={playInGames:22, playInCut:80, lobby:20,
                heats:[{games:8,cut:5},{games:8,cut:5},{games:8,cut:5},{games:8,cut:5}],
                gfGames:8, gfKill:3, noLcq:true, lclGames:0, winAdvances:false};
function isReloadSet(set){ return /^r\d$/.test(set||''); }
function majorFormat(region, cardSet){
  if(isReloadSet(cardSet)) return R_FORMAT;
  // FNCS 2025 ran groups, not heats: three in Europe and NA Central and two
  // everywhere else, the same split DEEP_MAJOR_REGIONS already describes.
  // Thirty teams come out of the groups in every region, so the cut is ten per
  // group where there are three and fifteen where there are two -- measured by
  // matching group rosters against final rosters, not read off the bracket,
  // which says "top 5" and means the Victory Royale flag.
  //
  // All three Majors ran that same shape, counted independently for each. Two
  // regions ended a man short of what it implies: Major 2's Middle East played
  // its final with 30 teams and Major 3's Oceania with 32, when the groups plus
  // the counted Lobby qualifiers come to 33 and 35. In both, every Lobby
  // qualifier is present in the final, so what is missing is group qualifiers
  // who did not turn up -- a no-show, not a different cut. The cut is modelled;
  // the absence is not, exactly as Major 1's NA Central was left at 30.
  if(LCQ_WINNERS_2025_BY_SET[cardSet]){
    const deep=DEEP_MAJOR_REGIONS.has(region) || !region;
    const winners=LCQ_WINNERS_2025_BY_SET[cardSet];
    return {
      playInCut: playInSeats(deep ? 3 : 2),
      heats: deep ? [{games:5,cut:10},{games:5,cut:10},{games:5,cut:10}]
                  // Brazil's second group ran six matches in Major 1 and five in
                  // both later Majors, so the quirk stays pinned to the set.
                  : [{games:5,cut:15},{games:(cardSet==='t1' && region==='BR')?6:5,cut:15}],
      lclGames:3,
      lcqWinners: (winners[region]==null ? 3 : winners[region]),
      gfGames:12
    };
  }
  if(DEEP_MAJOR_REGIONS.has(region) || !region){
    return {playInCut:playInSeats(3), heats:[{games:5,cut:15},{games:5,cut:15},{games:5,cut:15}], lclGames:5};
  }
  // The Middle East belongs in this list too. Its Major 1 Last Chance Lobby
  // produced three winners, not four — checked against CARD_E1_LCQ_RAW — and a
  // three-game Lobby is what a 47-qualifier heat bracket leaves room for. The
  // app was sending 46 through the heats and running a four-game Lobby, which
  // still added up to fifty but split them the wrong way.
  const sixGameHeat2 = (cardSet==='m1' && (region==='OCE' || region==='ASIA' || region==='ME'));
  const heat2Games = sixGameHeat2 ? 6 : 5;
  return {
    playInCut:playInSeats(2),
    heats:[{games:5, cut:23}, {games:heat2Games, cut:heat2Games+18}],
    lclGames: (cardSet==='m1' && sixGameHeat2) ? 3 : 4
  };
}
// The rules seed the heats in a serpentine, not a plain round robin: 1st goes
// to Heat 1, 2nd to Heat 2, 3rd to Heat 3, then it turns around — 4th to Heat
// 3, 5th to Heat 2, 6th back to Heat 1. That keeps the strength of the three
// (or two) lobbies even instead of loading Heat 1 with every top seed.
function seedHeats(teams, heatCount){
  const heats=Array.from({length:heatCount}, ()=>[]);
  teams.forEach((t,i)=>{
    const lap=Math.floor(i/heatCount), pos=i%heatCount;
    heats[lap%2 ? heatCount-1-pos : pos].push(t);
  });
  return heats;
}
function currentMajorFormat(you){
  const region = CARD_MODE ? ((you && you.squad[0] || {}).region || null) : null;
  return majorFormat(region, CARD_SET);
}

// Does a Victory Royale qualify anybody in the run on screen? FNCS says yes,
// the Reload Elite Series says no. The standings table and the stage card both
// print the answer, so both ask here rather than reading gotVR and assuming.
function winIsATicket(){
  const f = CARD_MODE ? majorFormat(null, CARD_SET) : null;
  return !(f && f.winAdvances === false);
}
function heatQualifiers(heatTeams, cut, winAdvances){
  // FNCS qualifies a Victory Royale outright — win your heat and your night is
  // over. The Reload Elite Series has no such rule: its heats are eight games
  // and only the top five on points come out, so a win there is worth 60 points
  // and nothing else. Passed in rather than read off a global so the two
  // circuits cannot borrow each other's rule by accident.
  /* Победа проходит СВЕРХ отсечки, а не вместо неё.

     Тестер, 22 сентября: «в хитах к грандам квал топ 3, а должен быть топ 10 —
     там просто 5 виннеров каток проходят в гранды, а я с топ 8 мимо улетел».
     Так и было: победители ложились в список первыми и съедали места отсечки —
     пять побед в комнате оставляли на очки три места, — а карточка и таблица
     по-прежнему рисовали линию там, где её объявил этап. То есть проход был
     уже, чем написано, и ровно на число выигранных каток.

     И это не случайность счёта: комната играется stopOnWin — выигравший
     ВСТАЁТ и доигрывает вечер меньшим числом игр. Потому победа и есть свой,
     отдельный билет: у Epic из группы выходят топ-N по очкам ПЛЮС каждая
     Victory Royale, а не N всего на двоих. */
  const ranked=heatTeams.slice().sort(heatsRank);
  const through=ranked.slice(0, Math.max(0, cut));
  if(winAdvances!==false) ranked.forEach(t=>{ if(t.gotVR && through.indexOf(t)<0) through.push(t); });
  return new Set(through);
}
// Real LCQ Round 1 scoring, straight off Epic's ScoringRules for the
// Last Chance Qualifier session (MatchRule "lte", so the tiers are
// CUMULATIVE — every threshold you pass is banked): Victory Royale +9,
// top 2-5 +4 each, top 6-25 +2 each. A win is therefore worth 65, 2nd 56,
// 5th 44 and 25th 2 — the same table Play-In uses. Eliminations are +1 each
// (killMult at the call site), which is what makes the real top-50 cut land
// around 360 points over 11 games rather than the ~100 a flat 9/4/2 table
// would produce.
function lcqRound1PointsForPlace(place){
  if(place>25) return 0;
  let pts=2*(26-Math.max(place,6));          // Top 25 → Top 6, +2 a step
  if(place<=5) pts+=4*(6-Math.max(place,2)); // Top 5 → Top 2, +4 a step
  if(place===1) pts+=PLAYIN_VR_BONUS;
  return pts;
}
function thresholdLabel(place){
  if(place===1) return L().victoryRoyaleWord;
  if(place<=7) return 'Top '+place;
  if(place<=25) return 'Top 25';
  return '-';
}

let skipAnimation=false;

// A run is a long chain of awaited animations, so leaving one has to actually
// stop that chain. An abandoned run used to keep playing into a screen nobody
// was on, and its qualification overlay — appended to the body, not the screen
// — landed on top of whatever the player had navigated to. Every stage waits on
// sleep(), so that is where an abandoned run unwinds: the rejection travels up
// through the whole chain to startRun(), which is the only place that swallows
// it. Generations rather than a flag, so a new run started right after an old
// one is abandoned cannot be stopped by the old one's pending timers.
const RUN_ABANDONED='run-abandoned';

/* Красная плашка с текстом ошибки. Без неё упавший прогон выглядит как застывший экран (карта есть, таблица в
   нулях), а ошибка только в консоли.
   Не больше трёх за сеанс: одна поломка часто даёт пачку одинаковых, а важна первая. RUN_ABANDONED не ошибка, в
   плашку не идёт. */
let CC_ERR_SHOWN=0;
function ccErrShow(text){
  const s=String(text==null?'':text);
  if(!s || s===RUN_ABANDONED || CC_ERR_SHOWN>=3) return;
  CC_ERR_SHOWN++;
  const box=document.createElement('div');
  box.className='cc-err';
  box.innerHTML='<b>'+esc(L().ccErrTitle)+'</b><span>'+esc(s.slice(0,700))+'</span>'+
    '<div class="cc-err-btns">'+
      '<button type="button" class="cc-err-copy">'+esc(L().ccErrCopy)+'</button>'+
      '<button type="button" class="cc-err-x">'+esc(L().ccErrClose)+'</button></div>';
  box.querySelector('.cc-err-x').onclick=()=>box.remove();
  box.querySelector('.cc-err-copy').onclick=function(){
    // Буфер обмена может быть недоступен (не https, отказ) — тогда выделяем
    // текст, чтобы скопировать руками. Молча не отваливаемся.
    const t=s;
    try{ navigator.clipboard.writeText(t).then(()=>{ this.textContent=L().ccErrCopied; },
      ()=>ccErrSelect(box)); }
    catch(e){ ccErrSelect(box); }
  };
  document.body.appendChild(box);
}
function ccErrSelect(box){
  const el=box.querySelector('span');
  try{ const r=document.createRange(); r.selectNodeContents(el);
       const s=window.getSelection(); s.removeAllRanges(); s.addRange(r); }catch(e){}
}
/* ЖУРНАЛ ПОЛОМОК НА СЕРВЕР (22.10). Баги приходили скриншотами, и половина «не воспроизвелась»: на картинке не было
   ни сборки, ни дня карьеры, ни режима. Теперь поломка, красная строка онлайна и несохранившийся сейв сами уходят
   на mp.fncsdraft.com/errlog (смотреть: GET /errlog?limit=100). Только сборка, вид, текст, место и контекст карьеры —
   ни ника, ни id. Не больше восьми записей за загрузку, одинаковые — один раз. text/plain — без предзапроса CORS. */
var CC_ERRLOG_SENT;
function ccErrLogBase(){
  try{
    const h=(typeof MP!=='undefined' && MP.host) || '';
    if(!h && location.protocol==='file:') return null;
    return String(h||'wss://mp.fncsdraft.com').replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')+'/errlog';
  }catch(e){ return null; }
}
function ccErrLogCtx(){
  const p=[];
  try{ p.push('lang '+(typeof LANG!=='undefined' ? LANG : '?')); }catch(e){}
  try{ const a=document.querySelector('.screen.active'); if(a) p.push('scr '+a.id); }catch(e){}
  try{ if(typeof CAREER!=='undefined' && CAREER && CAREER.career){ const c=CAREER.career;
    p.push('day '+c.day, 'y '+(c.year0||c.year||''), 's '+(c.season||''), 'div '+(c.division||''),
      CAREER._mgr ? 'mgr' : (typeof ccMpTeam==='function' && ccMpTeam()) ? 'team' : (typeof ccRaceOn==='function' && ccRaceOn()) ? 'race' : 'solo');
    if(typeof CH_TAB!=='undefined') p.push('tab '+CH_TAB);
    if(typeof CAREER_RUN!=='undefined' && CAREER_RUN) p.push('run');
  } }catch(e){}
  try{ p.push(innerWidth+'px'); }catch(e){}
  return p.join(' · ');
}
function ccErrLog(kind, msg, src){
  try{
    const m=String(msg==null ? '' : msg).slice(0, 300);
    if(!m || (typeof RUN_ABANDONED!=='undefined' && msg===RUN_ABANDONED)) return;
    CC_ERRLOG_SENT=CC_ERRLOG_SENT||{};
    const k=kind+'|'+m;
    if(CC_ERRLOG_SENT[k] || Object.keys(CC_ERRLOG_SENT).length>=8) return;
    CC_ERRLOG_SENT[k]=1;
    const base=ccErrLogBase(); if(!base) return;
    let build='-'; try{ build=CC_BUILD; }catch(e){}
    const ua=String(navigator.userAgent||'').replace(/^Mozilla\/5\.0 /, '').slice(0, 80);
    fetch(base, {method:'POST', keepalive:true, headers:{'Content-Type':'text/plain'},
      body:JSON.stringify({kind, msg:m, src:String(src||'').slice(0, 200), build, ctx:ccErrLogCtx(), ua})}).catch(()=>{});
  }catch(e){}
}
window.addEventListener('error', function(e){
  // Не отдавшийся файл — это тоже событие error, но у него есть target и нет
  // message: картинка, которой нет в папке, не должна выглядеть как поломка.
  if(!e || !e.message) return;
  ccErrShow(e.message + (e.lineno ? ' @' + e.lineno : ''));
  ccErrLog('err', e.message, (e.filename ? String(e.filename).split('/').pop().split('?')[0] : '')+(e.lineno ? ':'+e.lineno+':'+(e.colno||0) : ''));
});
window.addEventListener('unhandledrejection', function(e){
  const r=e && e.reason;
  ccErrShow((r && (r.stack || r.message)) || r);
  ccErrLog('rej', (r && r.message) || r, r && r.stack ? String(r.stack).split('\n').slice(1, 3).join(' < ').replace(/\s+/g, ' ') : '');
});
let runGeneration=0, currentRunGen=0;
function abandonRun(){ runGeneration++; try{ if(typeof ccMpIdleEpoch==='function') ccMpIdleEpoch(); }catch(e){} try{ if(typeof ccFmtSwapLeak==='function') ccFmtSwapLeak(); }catch(e){} }
function runIsCurrent(){ return currentRunGen===runGeneration; }

/* Показ выключен — пропуском или тем, что смотреть некому.

   Отзыв: «я пошёл в другое окно, и у меня поломалось — может,
   проблема, что когда окно не открыто, не работает симуляция». Так и было:
   в фоновой вкладке Chrome не даёт кадров (rAF стоит) и режет таймеры до
   одного в секунду, а через пять минут — до одного в минуту. Вечер в фоне
   полз, напарник ждал на барьере, а сторож реплея (45 с) включал у фоновой
   вкладки ОБЩИЙ пропуск в одиночку — и дальше двое считали разные вечера.

   В команде показ у скрытой вкладки просто не ждётся: паузы нулевые, реплей
   мотается до конца, а вопросы по-прежнему ждут человека — он вернётся.
   Одиночная карьера этого не видит: там некому ждать. */
function ccShowOff(){
  return skipAnimation || (typeof CC_MP_REPLAY!=='undefined' && CC_MP_REPLAY) ||
         (typeof ccMpOn==='function' && ccMpLock() &&
          typeof document!=='undefined' && document.hidden===true) ||
         ccMpHurry();
}
/* Напарник уже ждёт — показ перематывается.

   Отзыв: «почему-то долго после выбора тимейта другой ждёт».
   В соло на двоих вопросы идут по очереди, и между ними один смотрит кадры
   зоны в реальном времени, а второй (уже выбывший или пропускающий) стоит на
   следующем барьере и ждёт, пока первый досмотрит. Кадры и паузы — это ТОЛЬКО
   показ (расчёт от них не зависит, см. ccMpSeedOn), поэтому как только в
   очереди лежит приход напарника на барьер, который мы ещё не прошли, свой
   показ идёт перемоткой, как в скрытой вкладке. Вопросы это не трогает: их
   ccShowOff не читает — человек отвечает сам. */
function ccMpHurry(){
  return typeof MP!=='undefined' && typeof ccMpOn==='function' && ccMpLock() &&
         typeof MP.waitingOnMe==='function' && !!MP.waitingOnMe();
}
/* Отдать поток между играми. Видимая вкладка — таймер, как было: между задачами браузер рисует.
   Скрытая — сообщение через MessageChannel: таймеры там зажаты до раза в секунду (а через пять
   минут — до раза в минуту), и перемотка, пока игрок ждёт её в другой вкладке, стояла на каждом
   уступе. Твит тестера 2.10: «162 дня перематываются больше пяти минут». Замер: 8 дней в скрытом
   окне — 54 с, в видимом — 4 с. */
let CC_YIELD_CH=null;
function ccYield(){
  if(typeof document==='undefined' || document.hidden!==true || typeof MessageChannel==='undefined')
    return new Promise(res=>setTimeout(res, 0));
  if(!CC_YIELD_CH){
    CC_YIELD_CH=new MessageChannel();
    CC_YIELD_CH.q=[];
    CC_YIELD_CH.port1.onmessage=function(){ const f=CC_YIELD_CH.q.shift(); if(f) f(); };
  }
  return new Promise(res=>{ CC_YIELD_CH.q.push(res); CC_YIELD_CH.port2.postMessage(0); });
}
/* Конец первого дня финала (simulateGamesLive, opts.twoDay/days): карточка на карте, очки идут дальше. */
async function ccDayBreak(host, stageName, day){
  if(!host) return;
  const card=document.createElement('div');
  card.className='vr-card';
  card.innerHTML='<div class="vr-slab"><div class="vr-title">'+esc(L().ccDayEnd(day))+'</div></div>'+
    '<div class="vr-strip"><span class="vr-stage">'+stageName+'</span><span class="vr-game">'+esc(L().ccDayEndSub)+'</span></div>';
  host.appendChild(card);
  void card.offsetHeight;
  card.classList.add('vr-in');
  try{ await sleep(2400); }
  finally{ card.classList.remove('vr-in'); setTimeout(()=>card.remove(), 400); }
}
/* Паузы показа, которые ещё тикают. Пропуск, нажатый посреди паузы, не дожидается её таймера:
   пока она считалась ожиданием (CC_MP_IDLE), вечер уже бежал дальше, и его броски уходили мимо
   общего сида (у одного «foreign 101», вечер вдвоём расходился). См. ccSleepFlush. */
const CC_SLEEPS=new Set();
function ccSleepFlush(){ if(CC_SLEEPS.size) [...CC_SLEEPS].forEach(f=>f()); }
function sleep(ms){
  const gen=runGeneration;
  const ep=CC_MP_IDLE_EPOCH;
  let held=!!CC_MP_RAND; if(held) CC_MP_IDLE++;
  return new Promise((res,rej)=>{
    let done=false;
    const settle=()=>{
      if(done) return; done=true; CC_SLEEPS.delete(settle);
      // Ожидание снимается сразу, а не в микрозадаче: следующий бросок может прийти синхронно.
      if(held){ held=false; if(ep===CC_MP_IDLE_EPOCH && CC_MP_IDLE>0) CC_MP_IDLE--; }
      gen===runGeneration ? res() : rej(RUN_ABANDONED);
    };
    if(ccShowOff()){ settle(); return; }
    CC_SLEEPS.add(settle);
    setTimeout(settle, ms);
  });
}

function startRun(){
  currentRunGen=runGeneration;
  // Драфт дня: попытка сгорает здесь, симуляция сеется днём (см. dailyRoll).
  if(DAILY && !YEAR_KEY && !isMajorMode){ dailyBurn(); dailySimOn(); } else DAILY=null;
  Promise.resolve(YEAR_KEY ? runYearTournament()
                : isMajorMode ? runMajorTournament() : runTournament())
    .catch(e=>{ if(e!==RUN_ABANDONED) throw e; })
    .finally(dailySimOff);
}

/* ---------- Весь год одним составом ----------

   Круг за кругом одним и тем же драфтом: FNCS 2026 — Мейджор 1 и Дюссельдорф,
   потом Мейджор 2, Ласт Ченс и Антверпен; FNCS 2025 — три мейджора и Лион;
   Reload — четыре капа Elite Series. Что чем кончается, знает сам круг
   (runMajorTournament), поэтому здесь только переход между ними.

   Устроено обёрткой, а не правками внутри раннера мейджора. У того четыре
   выхода — Лион, Антверпен, Саммит и обычный финал, плюс ранний выход тех, кого
   срезал плей-ин без Ласт Ченса, — и каждый из них уже показывает свой баннер,
   таблицу и кнопку «поделиться». Год ничего из этого не отменяет: круг
   заканчивается как заканчивался, и только ПОСЛЕ него встаёт мост. */
let YEAR_KEY=null;     // ключ плитки года ('year' | 'year2025' | 'yearReload') либо null
let YEAR_AT=0;         // какой круг из YEAR_CHAINS[YEAR_KEY] сейчас играется
let YEAR_LEGS=[];      // сводки сыгранных кругов: места и деньги
let YEAR_SEAT=false;   // своё место на LAN, выигранное на Саммите этого же года

function yearChain(){ return (YEAR_KEY && YEAR_CHAINS[YEAR_KEY]) || []; }
function yearName(key){
  return key==='year2025' ? L().yearName2025
       : key==='yearReload' ? L().yearNameReload : L().yearName2026;
}
// Как называется круг в сводке года. У Reload собственных имён наборов нет
// (cardSetName знает только FNCS), поэтому капы названы здесь.
function yearLegName(set){
  const cup={r1:1, r2:2, r3:3, r4:4}[set];
  return cup ? L().yearReloadCup(cup) : cardSetName(set);
}

/* Тот же человек, но карточка следующего круга.

   Драфт собран из карточек первого круга, а следующий — это тот же игрок с
   тем, что он показал ТАМ. Поэтому состав переводится на набор нового круга:
   карточка ищется по нику И РЕГИОНУ (тёзок в базе 137, и без региона состав
   уехал бы в чужой мейджор), а кто в новом круге не играл, остаётся со своей
   старой карточкой — выкидывать человека из состава посреди года нельзя. */
function yearRecard(nextSet){
  const roster=cardRosterPlayers(nextSet);
  if(!roster.length) return [];
  const by=new Map();
  roster.forEach(p=>by.set(p.region+'|'+_gcNorm(p.handle), p));
  const moved=[];
  drafted=drafted.map(p=>{
    const next=by.get(p.region+'|'+_gcNorm(p.handle));
    if(!next || next===p) return p;
    moved.push({handle:next.handle, from:p.rating, to:next.rating});
    return next;
  });
  return moved;
}

// Мост между кругами: что было, что дальше и кнопка. Ждёт нажатия — год идёт
// столько, сколько человек готов смотреть, а не столько, сколько влезло в один
// проход. Забег, который бросили, разрешает промис через runIsCurrent ниже.
function yearBridgeCard(nextSet, moved){
  const box=document.getElementById('yearBridge');
  if(!box) return Promise.resolve();
  const rows=moved.map(m=>{
    const d=m.to-m.from;
    const col=d>0?'var(--accent)':d<0?'var(--danger)':'var(--ink-dim)';
    return `<div class="prize-row"><span>${esc(m.handle)}</span>
      <b style="color:${col};">${m.from} → ${m.to}</b></div>`;
  }).join('');
  const card=document.createElement('div');
  card.className='stage-card';
  card.innerHTML=`<h4>${L().yearNextTitle(yearLegName(nextSet))}</h4>
    <div class="stage-detail">${L().yearNextNote}</div>
    ${rows ? `<div style="margin-top:10px;font-size:12px;font-weight:800;text-transform:uppercase;
      letter-spacing:.06em;color:var(--accent);">${L().yearRecardTitle}</div>${rows}` : ''}
    <button class="go-btn" id="yearNextBtn" style="margin-top:14px;max-width:280px;">${L().yearNextBtn}</button>`;
  box.innerHTML='';
  box.appendChild(card);
  card.scrollIntoView({block:'start',
    behavior:(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ? 'auto' : 'smooth'});
  return new Promise(res=>{
    card.querySelector('#yearNextBtn').onclick=()=>{ box.innerHTML=''; res(); };
  });
}

// Итог года: по строке на круг и общая сумма. Считается по снимкам, снятым
// после каждого круга, — свой собственный runPlaces у круга обнуляется.
function renderYearCard(){
  const box=document.getElementById('yearBridge');
  if(!box || !YEAR_LEGS.length) return;
  const money=YEAR_LEGS.reduce((s,l)=>s+l.earnings.reduce((a,e)=>a+e.amount,0), 0);
  const rows=YEAR_LEGS.map(l=>{
    const best=l.places.length ? l.places[l.places.length-1] : null;
    const paid=l.earnings.reduce((a,e)=>a+e.amount,0);
    return `<tr class="lobby-row">
      <td>${esc(l.title)}</td>
      <td class="num">${best ? `<b style="color:${best.passed?'var(--accent)':'var(--ink-dim)'};">#${best.rank}</b>
        <span style="color:var(--ink-dimmer);">/${best.total}</span>` : '-'}</td>
      <td class="num" style="color:var(--ink-dim);">${paid?fmtMoney(paid):'-'}</td></tr>`;
  }).join('');
  const card=document.createElement('div');
  card.className='stage-card';
  card.innerHTML=`<h4>${L().yearCardTitle(yearName(YEAR_KEY))}</h4>
    <div class="lobby-wrap" style="margin-top:6px;">
      <table class="lobby-table">
        <thead><tr><th>${L().yearCardLeg}</th><th class="num">${L().placeHeader}</th>
          <th class="num">${L().runSummaryEarned}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="prize-row" style="margin-top:12px;"><span>${L().yearCardTotal}</span>
      <b style="color:var(--accent);">${fmtMoney(money)}</b></div>`;
  box.innerHTML='';
  box.appendChild(card);
}

async function runYearTournament(){
  const chain=yearChain();
  for(YEAR_AT=0; YEAR_AT<chain.length; YEAR_AT++){
    const set=chain[YEAR_AT];
    if(YEAR_AT>0){
      // Новый круг — новый набор карточек, свой остров и своя таблица призовых.
      const moved=yearRecard(set);
      CARD_SET=set;
      useLandingSet(set);
      await yearBridgeCard(set, moved);
      if(!runIsCurrent()) return;
    }
    await runMajorTournament();
    if(!runIsCurrent()) return;
    YEAR_LEGS.push({title:yearLegName(set), places:runPlaces.slice(), earnings:runEarnings.slice()});
    /* Место на LAN, выигранное СВОИМ Саммитом.

       Топ-15 Дюссельдорфа едут в Антверпен — это правило уже написано
       (SUMMIT_GC_SLOTS/holdsLanSeat), но списком настоящих дуо: до этого режима
       выиграть Саммит своим составом было негде. Теперь есть, и своё место
       обязано считаться так же, как чужое. Чужие остаются настоящими: круг
       Мейджора 2 сажает в Антверпен тех, кто сел туда на самом деле. */
    if(set==='m1' && lastSummit && lastSummit.rank && lastSummit.rank<=SUMMIT_GC_SLOTS) YEAR_SEAT=true;
    // 2024: место в Форт-Уэрт, взятое на первом или втором Мейджоре, действует до конца года.
    if((set==='f1' || set==='f2') && LAST_GC24_SEAT) YEAR_SEAT=true;
  }
  renderYearCard();
}

/* Кнопка «смотреть до конца» была и убрана 25 августа по отзыву «лишняя
   кнопка»: плавающая кнопка рядом со скипом мозолила глаза ради случая, который
   бывает раз за вечер. Показ снова останавливается на кадре твоей смерти — как
   и было задумано (см. stopOnYourDeath: вечер смотрят с одного кресла). Если
   выбор понадобится снова, ему место в переключателе режима, а не второй
   кнопкой поверх карты. */
function ensureSkipButton(){
  if(document.getElementById('majorSkipBtn')) return;
  const btn=document.createElement('button');
  btn.id='majorSkipBtn'; btn.className='skip-btn-prominent';
  btn.innerHTML=L().skipBtn;
  btn.onclick=()=>{
    // В команде пропуск общий: нажатие — это голос. См. ccMpSkipAsk.
    if(ccMpLock()){ ccMpSkipAsk(); return; }
    skipAnimation=true;
    // Inside a career night one press covers the whole event — see
    // beginAnimatedStage. In the draft mode it is still this stage only.
    if(CAREER_RUN) CC_SKIP_RUN=true;
    btn.textContent = CAREER_RUN ? L().skipPressedRun : L().skipPressed;
    btn.disabled=true;
  };
  document.body.appendChild(btn);
  // В команде на кнопке стоит счёт голосов с первой же секунды, а не с
  // начала следующей стадии.
  if(ccMpLock()) ccMpSkipDraw();
}
function removeSkipButton(){
  const btn=document.getElementById('majorSkipBtn');
  if(btn) btn.remove();
}

// The card the broadcast puts up when a game ends: who won it.
//
// It goes over the map rather than beside it, because the map is where the
// question was — the circle closes on two arrows and it is genuinely hard to
// tell which one was left. The strip underneath carries the stage and the game
// number, so a card seen out of the corner of an eye still says which of twelve
// games it belongs to.
//
// Timed with sleep(), which means a skipped stage passes through it without
// stopping, and an abandoned run unwinds through it like everything else.
// The card the broadcast puts up when a game ends: who won, and where you
// finished.
//
// Naming the winner was the whole of it, and it answered somebody else's
// question. The replay's own header carries your placement while the game is
// running, but it is a chip in a corner and it goes when the map does — at the
// moment the game actually ends, the one number a player wants is their own,
// and it was nowhere on the screen. So the strip carries both: the squad that
// won on one side, yours on the other.
//
// Not when you are the winner, because then they are the same squad and the
// slab above already says #1 in letters an inch high.
/* Реплей под сторожем.

   Скриншот: Перфоманс, раунд 2, «игра 1 из 4» — карта нарисована,
   таблица в нулях, и всё стоит. Воспроизвести не удалось ни на живой сборке, ни
   локально, и это само по себе диагноз: висит что-то, что случается не всегда —
   кадр, который не пришёл, вкладка, которую увели, окно, которое свернули.
   Чинить наугад нечего, а вот сделать так, чтобы вечер не мог встать НАВСЕГДА,
   можно: реплей — это показ уже посчитанной игры, и если он не уложился в
   REPLAY_GUARD_MS, показ прекращается, а турнир идёт дальше со счётом, который
   и так уже посчитан.

   Ставится флаг скипа, а не просто бросается промис: play() слушает isSkipped и
   закрывается сам, иначе его таймеры продолжали бы рисовать поверх следующей
   игры. */
// let, а не const: пробе нужно уметь укоротить ожидание, иначе проверка
// сторожа стоила бы сорок пять секунд на ровном месте.
let REPLAY_GUARD_MS=45000;
/* Двое в одной сотне (Solo Series в команде): кого разбросало по другим
   лобби, меняется местами с последним ботом из лобби первого. Один и тот же
   шаг с обеих сторон — расклад у двоих один. Сторож: check-mp-solo-shared. */
function ccLobbiesTogether(lobbies, together){
  const home=lobbies.find(l=>l.indexOf(together[0])>=0);
  if(!home) return lobbies;
  together.slice(1).forEach(t=>{
    const from=lobbies.find(l=>l.indexOf(t)>=0);
    if(!from || from===home) return;
    let j=home.length-1;
    while(j>=0 && together.indexOf(home[j])>=0) j--;
    if(j<0) return;
    const b=home[j]; home[j]=t; from[from.indexOf(t)]=b;
  });
  return lobbies;
}
/* ТОЧКИ КОМАНД НА КАРТЕ БОЯ. Перед каждой игрой большая карта показывает, кто куда сел: ник(и) в коробке, стычки красным,
   своя — жёлтой рамкой. Слой лежит внутри рамки острова (первый ребёнок .zone-replay), поэтому ездит вместе с камерой.
   Пока идёт сама игра, подписи приглушены (класс zr-playing). Кнопка «Точки» в углу прячет и показывает. */
let CC_RUN_DROPS_ON=true;
function ccRunDropsDraw(wrap, teams){
  const stage=wrap && wrap.firstElementChild; if(!stage) return;
  const old=stage.querySelector('.cc-run-drops'); if(old) old.remove();
  const by=new Map();
  (teams||[]).forEach(t=>{ const z=t && t.landingZone; if(!z || z.x==null) return; if(!by.has(z)) by.set(z, []); by.get(z).push(t); });
  if(!by.size) return;
  const nm=t=>(t.squad||[]).map(c=>c && c.handle).filter(Boolean).join(' + ') || String(t.name||'').replace(/<[^>]*>/g,'');
  const layer=document.createElement('div'); layer.className='cc-run-drops'+(CC_RUN_DROPS_ON ? '' : ' off');
  by.forEach((list, z)=>{
    const me=list.some(t=>t.isYou), hot=list.length>1;
    const b=document.createElement('div');
    b.className='cc-rd-box'+(hot ? ' hot' : '')+(me ? ' me' : '');
    b.style.cssText='left:'+z.x+'%;top:'+z.y+'%;width:'+z.w+'%;height:'+z.h+'%';
    b.innerHTML='<span>'+list.slice(0, 3).map(t=>esc(nm(t))).join('<br>')+(list.length>3 ? '<br>+'+(list.length-3) : '')+'</span>';
    layer.appendChild(b);
  });
  stage.appendChild(layer);
  if(!wrap.querySelector('.cc-rd-toggle')){
    const btn=document.createElement('button'); btn.type='button'; btn.className='cc-rd-toggle';
    btn.textContent=L().ccDropMap;
    btn.onclick=e=>{ e.stopPropagation(); CC_RUN_DROPS_ON=!CC_RUN_DROPS_ON;
      const l=wrap.querySelector('.cc-run-drops'); if(l) l.classList.toggle('off', !CC_RUN_DROPS_ON); btn.classList.toggle('off', !CC_RUN_DROPS_ON); };
    wrap.appendChild(btn);
  }
}
/* АВТОБУС ПЕРЕД ИГРОЙ (его слово 19.11: «в начале анимацию с автобусом, что летит и все игроки летят на свои локи»).
   Над островом пролетает автобус по случайной прямой, каждая команда выпрыгивает в точке маршрута, ближайшей к своей
   локации, и планирует на неё. Только картинка: генератор свой (careerRng от дня и номера игры), броски игры не тратит.
   Своя команда жёлтая с ником, спорные точки красные. ~4 секунды, кнопка пропуска обрывает. Это содержимое игры, а не
   украшение страницы, поэтому reduced motion его не выключает (у него в Chrome он всегда включён). */
const CC_BUS_MS=3000, CC_BUS_GLIDE_MS=900;
/* МАРШРУТ АВТОБУСА РЕШАЕТ, КТО СЕЛ ПЕРВЫМ (19.11, его выбор из списка механик турниров). Одна прямая на игру: от дня и номера
   игры (одинакова у двух игроков в локстепе), её рисует ccBusIntro и по ней же считается, когда отряд приземлился:
   автобус идёт через остров CC_BUS_CROSS с, до своей точки отряд планирует CC_BUS_GLIDE с на каждый процент карты от маршрута.
   Это оценки по игре, не замер: реплеи времени высадки не пишут. В стычке на высадке (resolveDropDuel) севший раньше на
   CC_BUS_LEAD_SEC и больше получает CC_BUS_LEAD_P к шансу: успел взять оружие. Сколько стычек, не меняется, только кто выиграл. */
const CC_BUS_CROSS=60, CC_BUS_GLIDE=0.5, CC_BUS_LEAD_SEC=8, CC_BUS_LEAD_P=0.10;
let CC_BUS_G=null;
function ccBusRoute(g){
  const day=(typeof careerToday==='function') ? careerToday() : '';
  const rnd=careerRng(ccHashStr('bus|'+day+'|'+(g||0)));
  // Через остров, со сдвигом от центра до ±18%, под случайным углом. Координаты — проценты карты.
  const ang=rnd()*Math.PI*2, off=(rnd()-0.5)*36, cx=50+Math.cos(ang+Math.PI/2)*off, cy=50+Math.sin(ang+Math.PI/2)*off;
  const dx=Math.cos(ang), dy=Math.sin(ang);
  return {cx, cy, dx, dy, ax:cx-dx*75, ay:cy-dy*75, bx:cx+dx*75, by:cy+dy*75};
}
function ccBusSetLand(teams, aspect){
  const route=CC_BUS_G!=null ? ccBusRoute(CC_BUS_G) : null;
  (teams||[]).forEach(t=>{ const z=t && t.landingZone; if(t) t._land=(route && z) ? ccBusLand(z.x+z.w/2, z.y+z.h/2, route, aspect) : null; });
}
// Секунда приземления на точку (x, y в процентах карты); k — высота карты к ширине, расстояние в настоящей форме острова.
function ccBusLand(x, y, r, k){
  if(!r) return null;
  const ax=r.ax, ay=r.ay*k, bx=r.bx, by=r.by*k, px=x, py=y*k, vx=bx-ax, vy=by-ay, l2=vx*vx+vy*vy||1;
  const t=Math.max(0.1, Math.min(0.9, ((px-ax)*vx+(py-ay)*vy)/l2));
  const qx=ax+vx*t, qy=ay+vy*t, d=Math.hypot(px-qx, py-qy);
  return CC_BUS_CROSS*t+CC_BUS_GLIDE*d;
}
// Насколько раньше (+) или позже (−) своих соседей села команда: медиана по отрядам в CC_BUS_MATES процентах карты.
const CC_BUS_MATES=18;
function ccBusLeadOf(you, list){
  if(!you || you._land==null || !you.landingZone) return null;
  const z=you.landingZone, c={x:z.x+z.w/2, y:z.y+z.h/2}, d=[];
  (list||[]).forEach(t=>{ if(t===you || t._land==null || !t.landingZone) return;
    const q=t.landingZone; if(Math.hypot(q.x+q.w/2-c.x, q.y+q.h/2-c.y)>CC_BUS_MATES) return; d.push(t._land-you._land); });
  if(!d.length) return null;
  d.sort((a,b)=>a-b);
  return Math.round(d[Math.floor(d.length/2)]);
}
function ccBusIntro(wrap, teams, g){
  return new Promise(resolve=>{
    const stage=wrap && wrap.firstElementChild, NS='http://www.w3.org/2000/svg';
    const list=(teams||[]).filter(t=>t && t.landingZone && t.landingZone.x!=null);
    if(!stage || !list.length || typeof ZoneReplay==='undefined' || !ZoneReplay.marker){ resolve(); return; }
    // Те же единицы, что у карты боя: viewBox 100 × (100 × высота/ширина), проценты клеток переводятся в них.
    const base=stage.querySelector('svg'), vbH=Number(base && base.dataset.vbh) || 100;
    const P=(x,y)=>({x:x, y:y/100*vbH});
    // Маршрут — тот же, по которому игра считает, кто сел первым (ccBusRoute).
    const R=ccBusRoute(g), A=P(R.ax, R.ay), B=P(R.bx, R.by);
    const L2=(B.x-A.x)*(B.x-A.x)+(B.y-A.y)*(B.y-A.y);
    const proj=p=>Math.max(0.1, Math.min(0.9, ((p.x-A.x)*(B.x-A.x)+(p.y-A.y)*(B.y-A.y))/L2));
    const at=t=>({x:A.x+(B.x-A.x)*t, y:A.y+(B.y-A.y)*t});
    const svg=document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 '+vbH.toFixed(3)); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'cc-bus-layer');
    /* Маршрут как в игре: цепочка бирюзовых шевронов «V» носом по ходу полёта (скриншоты карты Fortnite с путём автобуса),
       а не пунктир. Пройденная автобусом часть бледнеет. */
    const chev=document.createElementNS(NS, 'g'), chevs=[], len=Math.sqrt(L2), STEP=2.5, deg=Math.atan2(B.y-A.y, B.x-A.x)*180/Math.PI;
    for(let d=STEP/2; d<len; d+=STEP){
      const t=d/len, p=at(t), c=document.createElementNS(NS, 'path');
      c.setAttribute('d', 'M -0.9 -1.25 L 0.55 0 L -0.9 1.25 L -0.35 0 Z');
      c.setAttribute('transform', 'translate('+p.x.toFixed(3)+' '+p.y.toFixed(3)+') rotate('+deg.toFixed(1)+')');
      c.setAttribute('class', 'cc-bus-chev'); chev.appendChild(c); chevs.push({c, t});
    }
    svg.appendChild(chev);
    const arrows=document.createElementNS(NS, 'g'); svg.appendChild(arrows);
    /* Автобус — значок Battle Bus с карты самой игры (вики Fortnite, «Battle Bus - Icon - Fortnite», 64 px,
       art/ui/battle-bus.webp): синий круг с белым автобусом под шаром. */
    const bus=document.createElementNS(NS, 'g');
    /* Battle Bus сверху — прямо из игры: вырезан из его скриншота карты (Ranked Reload, 19.11), art/ui/battle-bus-top.png,
       носом вправо; поворачивается на угол маршрута. */
    bus.innerHTML='<g transform="rotate('+deg.toFixed(1)+')"><image href="art/ui/battle-bus-top.png" x="-6.2" y="-1.8" width="12.4" height="3.6" preserveAspectRatio="none"/></g>';
    svg.appendChild(bus);
    const byZone=new Map(); list.forEach(t=>{ const z=t.landingZone; byZone.set(z, (byZone.get(z)||0)+1); });
    // Цвет стрелки — как в игре: своя акцентом, остальные по номеру в комнате (ZoneReplay.colourFor).
    /* Стрелка у каждого игрока, как в игре: напарники прыгают друг за другом и садятся рядом, цвет команды общий. */
    const jumpers=[];
    /* Команды в одном квадрате садятся каждая в своё место квадрата, по кругу от центра. Раньше все — в центр, и стрелки
       ложились одна на другую: 100 стрелок, 78 мест (его вопрос 19.11: «почему не 100 треугольников»). */
    const zSeen=new Map();
    list.forEach((t, i)=>{
      const z=t.landingZone, zk=zSeen.get(z)||0, zn=byZone.get(z)||1; zSeen.set(z, zk+1);
      const ang0=zn>1 ? zk/zn*Math.PI*2 : 0, rr=zn>1 ? 0.28 : 0;
      const c=P(z.x+z.w/2+Math.cos(ang0)*z.w*rr, z.y+z.h/2+Math.sin(ang0)*z.h*rr), tj=proj(c), from=at(tj), n=Math.max(1, ((t.squad||[]).filter(Boolean)).length);
      const fill=t.isYou ? 'var(--accent)' : ZoneReplay.colourFor(i);
      for(let m=0; m<n; m++){
        // Прыгают по одному, садятся в одну точку: на земле команда одна стрелка, как на карте боя.
        const to={x:c.x, y:c.y};
        jumpers.push({t, i, tj, lag:m*110, from, to, a:Math.atan2(to.y-from.y, to.x-from.x)*180/Math.PI,
                      fill, you:!!t.isYou && m===0});
      }
    });
    let tag=null;
    const me=jumpers.find(j=>j.you);
    if(me){ tag=document.createElementNS(NS, 'text'); tag.setAttribute('class', 'cc-bus-tag');
      const k=vbH/100; list.forEach(t=>{ const z=t.landingZone; t._land=ccBusLand(z.x+z.w/2, z.y+z.h/2, R, k); });
      const lead=ccBusLeadOf(me.t, list), T=L();
      tag.textContent=(me.t.squad||[]).map(c=>c && c.handle).filter(Boolean).join(' + ')+
        (lead==null || Math.abs(lead)<2 ? '' : ' · '+(lead>0 ? T.busEarly(lead) : T.busLate(-lead)));
      svg.appendChild(tag); }
    stage.appendChild(svg);
    let raf=0, t0=0, done=false;
    /* Страховка: кадры (requestAnimationFrame) стоят в фоновой вкладке и в headless с виртуальным временем — автобус
       тогда кончается по таймеру, а не держит вечер. */
    const guard=setTimeout(()=>end(), CC_BUS_MS+CC_BUS_GLIDE_MS+1300);
    const end=()=>{ if(done) return; done=true; clearTimeout(guard); cancelAnimationFrame(raf); svg.remove(); resolve(); };
    const step=ts=>{
      if(!t0) t0=ts;
      if(skipAnimation || !svg.isConnected){ end(); return; }
      const e=ts-t0, tb=Math.min(1, e/CC_BUS_MS), p=at(tb);
      bus.setAttribute('transform', 'translate('+p.x.toFixed(3)+' '+p.y.toFixed(3)+')');
      chevs.forEach(o=>{ const past=o.t<tb-0.02; if(o.past!==past){ o.past=past; o.c.classList.toggle('past', past); } });
      arrows.innerHTML='';
      jumpers.forEach(j=>{
        const jumpAt=j.tj*CC_BUS_MS+j.lag; if(e<jumpAt) return;
        const k=Math.min(1, (e-jumpAt)/CC_BUS_GLIDE_MS), s=k*k*(3-2*k);
        const x=j.from.x+(j.to.x-j.from.x)*s, y=j.from.y+(j.to.y-j.from.y)*s;
        arrows.appendChild(ZoneReplay.marker(x, y, j.a, j.fill, j.you, 1));
        if(j.you && tag){ tag.setAttribute('x', (x+2.4).toFixed(3)); tag.setAttribute('y', (y+0.9).toFixed(3)); }
      });
      if(e>=CC_BUS_MS+CC_BUS_GLIDE_MS+600){ end(); return; }
      raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
  });
}
function playReplayGuarded(handle, timeline, opts){
  return ccMpIdle(new Promise(function(resolve){
    let done=false;
    const finish=v=>{ if(done) return; done=true; resolve(v); };
    /* В команде пропуск — общий голос (ccMpSkipSaw), и сторож его не отдаёт:
       он обрезает только ЭТОТ показ, локальным флагом в isSkipped. */
    let cut=false;
    const was=opts && opts.isSkipped;
    if(opts) opts.isSkipped=function(){ return cut || ccShowOff() || !!(was && was()); };
    const timer=setTimeout(function(){
      if(done) return;
      if(ccMpLock()) cut=true;
      else skipAnimation=true;            // play() сам увидит и закроется
      finish(false);
    }, REPLAY_GUARD_MS);
    const w=handle && handle.wrap; if(w) w.classList.add('zr-playing');
    /* Игра пошла — точек высадки на карте больше нет до следующей высадки (его слово 19.11: «во время симуляции не должно
       быть прямоугольников»; приглушение не спасало: на остановках с вопросами класс снимался). */
    if(w){ const l=w.querySelector('.cc-run-drops'); if(l) l.remove(); const tg=w.querySelector('.cc-rd-toggle'); if(tg) tg.remove(); }
    Promise.resolve(ZoneReplay.play(handle, timeline, opts))
      .then(v=>{ clearTimeout(timer); if(w) w.classList.remove('zr-playing'); finish(!!v); })
      .catch(()=>{ clearTimeout(timer); if(w) w.classList.remove('zr-playing'); finish(false); });
  }));
}
async function showVictoryRoyale(host, stageName, gameNum, gamesTotal, winner, myPlace, fieldSize){
  if(!host || !winner) return;
  const card=document.createElement('div');
  card.className='vr-card';
  const mine = (myPlace > 1)
    ? `<span class="vr-you">${L().yourSquadTitle} <b>${ccTop(myPlace)}</b> ${L().place2plus}${fieldSize}${L().teamsWord}</span>`
    : '';
  card.innerHTML=`<div class="vr-slab">
      <div class="vr-title"><span class="vr-hash">#1</span> ${L().victoryRoyaleWord}</div>
    </div>
    <div class="vr-strip">
      <span class="vr-stage">${stageName}</span>
      <span class="vr-game">${L().gameOfWord(gameNum, gamesTotal)}</span>
      <span class="vr-team">${winner.name}</span>
    </div>
    ${mine ? `<div class="vr-strip vr-mine">${mine}</div>` : ''}`;
  host.appendChild(card);
  // Reading a layout property commits the starting state, so the class that
  // follows animates from it instead of being folded into the same frame.
  // Waiting for an actual animation frame would have been the obvious way and
  // is a trap: frames stop entirely in a hidden tab, and a run that is waiting
  // for one there waits for ever — the same hazard the replay loop already had
  // to be moved off.
  void card.offsetHeight;
  card.classList.add('vr-in');
  await sleep(2200);
  card.classList.remove('vr-in');
  await sleep(260);
  card.remove();
}

// A landing card gets appended below the standings and scrolled to once, but a
// player already reading the standings can miss that scroll — the run then
// just sits there awaiting a click nobody knows to make. This floating prompt
// stays up for as long as a choice is outstanding and jumps the player to the
// card on click, same idea as the skip chip but pointing at something to do
// rather than something to cut short.
/* The pick is not finished until it is confirmed, and confirming was a button
   under a map taller than the screen — so the run waited on a click that was
   off the bottom of the page. A floating pill at the top used to point at it,
   which is a sign to somewhere rather than the thing itself.

   The bar is the thing itself: it sits at the bottom of the window while a
   pick is open, it says what is chosen, and pressing it confirms. Nothing to
   scroll to. The button inside the card stays where it is, after the map, for
   anybody who scrolled anyway — they are the same button. */
/* Полоса внизу экрана, пока дроп не выбран.

   И вторая кнопка на ней — «выбрать за меня». Без неё турнир может стоять
   молча: пикер ждёт клика вечно, а карточка этапа висит ниже сгиба экрана, и
   со стороны это выглядит как «не идёт симуляция финалов» — жалоба. Замерено: через шесть секунд после старта финала на живом сайте
   пикер на месте, кнопка подтверждения неактивна, журнал пуст, и так до
   первого клика. Теперь выхода два, и ни один из них не «ждать». */
function ensureLandingPrompt(target, auto){
  removeLandingPrompt();
  const bar=document.createElement('div');
  bar.id='landingPromptBtn'; bar.className='landing-pick-bar';
  bar.innerHTML='<span id="landingBarWhat">'+L().landingPickPrompt+'</span>'+
    (auto ? '<button class="restart-btn" id="landingBarAuto">'+L().landingAutoBtn+'</button>' : '')+
    '<button class="go-btn" id="landingBarGo" disabled>'+L().landingConfirmBtn+'</button>';
  document.body.appendChild(bar);
  // The bar's button is the card's button: one place decides what a pick means.
  const go=bar.querySelector('#landingBarGo');
  go.onclick=()=>{ const real=target.querySelector('#gameLandingConfirm');
                   if(real && !real.disabled) real.click(); };
  const off=bar.querySelector('#landingBarAuto');
  if(off) off.onclick=auto;
}
// Called when a zone is clicked, so the bar can say what is about to happen and
// stop being disabled.
function landingPromptReady(text){
  const bar=document.getElementById('landingPromptBtn');
  if(!bar) return;
  const what=bar.querySelector('#landingBarWhat');
  if(what && text) what.innerHTML=text;
  const go=bar.querySelector('#landingBarGo');
  if(go) go.disabled=false;
}
function removeLandingPrompt(){
  const btn=document.getElementById('landingPromptBtn');
  if(btn) btn.remove();
}

/* Skip is per-stage in the draft mode, and that is deliberate: pressing it
   fast-forwards whatever is playing right now so you can skip a slow Play-In
   and still watch the Finals in full.

   A career night is not that. A Major there is four stages, and skipping it
   meant pressing skip four times and watching the animation start again in
   between — the player asked for one button that stops the watching and shows
   the results, and four is not one. So inside a career run the press sticks for
   the rest of the event, and the next event starts animated again.

   The drop is not an animation and is not skipped: it changes where you land
   and therefore what the results are, so it is still asked. */
let CC_SKIP_RUN=false;
/* РАУНД ЗА РАУНДОМ (его просьба 28.09): «первый раунд нажать скипнуть, а уже второй дать
   выбор симулировать или играть». Кнопка «Пропустить» по-прежнему ставит CC_SKIP_RUN на весь
   вечер, но перед каждым следующим раундом вечер останавливается и спрашивает: симулировать
   этот раунд, симулировать всё до конца или играть. Молчание 10 с — симулировать (перемотка и
   пробы кликают первую .cc-choice-btn, она и есть «симулировать»). Не спрашивает в команде,
   в гонке и на перемотке недели/месяца — там за игрока никто не сидит. */
let CC_SKIP_ALL=false;
const CC_ROUND_ASK_MS=10000;
async function ccRoundChoiceMaybe(){
  if(!CAREER_RUN || !CC_SKIP_RUN || CC_SKIP_ALL) return;
  if((typeof ccMpLock==='function' && ccMpLock()) || (typeof ccMpOn==='function' && ccMpOn())) return;
  if(typeof ccRaceOn==='function' && ccRaceOn()) return;
  if(typeof CC_FF!=='undefined' && CC_FF) return;
  const pick=await ccRoundChoice();
  if(pick==='play'){ CC_SKIP_RUN=false; skipAnimation=false; }
  else if(pick==='all') CC_SKIP_ALL=true;
}
function ccRoundChoice(){
  return new Promise(function(done){
    const box=document.createElement('div');
    /* Та же карточка, что вопрос перед игрой (.cc-choice-head, .cc-choice-btn, полоса
       времени), а в годы с палитрой — в цветах таблиц турнира (его скрин 38, 29.09). */
    box.className='cc-round-ask';
    box.style.setProperty('--rc-ms', CC_ROUND_ASK_MS+'ms');
    box.innerHTML='<div class="cc-choice-head"><b><span class="cc-choice-t">'+esc(L().rcNextH)+'</span></b>'+
      '<span>'+esc(L().rcNextSub(Math.round(CC_ROUND_ASK_MS/1000)))+'</span></div>'+
      '<div class="cc-choice-row"><button class="cc-choice-btn def" data-p="sim"><b>'+esc(L().rcSim)+'</b></button>'+
      '<button class="cc-choice-btn rc-play" data-p="play"><b>'+esc(L().rcPlay)+'</b></button></div>'+
      '<div class="cc-choice-bar"><i></i></div>';
    let over=false;
    const end=p=>{ if(over) return; over=true; box.remove(); done(p); };
    box.querySelectorAll('button').forEach(b=>b.onclick=()=>end(b.dataset.p));
    document.body.appendChild(box);
    setTimeout(()=>end('sim'), CC_ROUND_ASK_MS);
  });
}
function beginAnimatedStage(){
  /* Пропущен ли показ — решает ТОЛЬКО кнопка «пропустить», нажатая заранее или
     по ходу. Каждый раннер гасит CC_SKIP_RUN у себя на входе, поэтому
     настройка спрашивается здесь — в единственной точке, через которую
     проходит каждый этап.

     Раньше здесь стояла и правая кнопка режима: «Симуляция» значила и не
     спрашивать, и не показывать. Правка — отзыв по просьбе
     игрока («после обновы появилась старая идея: добавить кнопку играешь сам,
     но без выбора действий, то есть радар движется»; его: «сделай на правую
     кнопку, чтоб было как раньше, а то человек не хочет кликать, а хочет
     смотреть круги»). Теперь правая кнопка значит ровно одно: НЕ СПРАШИВАТЬ.
     Матч идёт на карте, как он шёл до вопросов; кому нужен результат сразу —
     жмёт «Пропустить», она умеет пройти весь турнир одним нажатием. */
  skipAnimation = (CAREER_RUN && CC_SKIP_RUN);
  const btn=document.getElementById('majorSkipBtn');
  if(btn){
    // В команде на кнопке стоит счёт голосов, а не только её название.
    if(ccMpLock()){ ccMpSkipDraw(); }
    else {
      btn.disabled=skipAnimation;
      btn.innerHTML=skipAnimation ? L().skipBtnOn : L().skipBtn;
    }
  }
}

// Live-animated Finals leaderboard: plays through each game one at a time,
// updating a standings table in place so teams visibly swap positions as
// points come in — like watching a real broadcast overlay update live.
// opts:
//   stopOnWin — a Victory Royale ends that team's stage (Heats rule)
//   mapReplay — this stage plays its games out on the map above the standings.
//               Off unless asked for: the map belongs to the stages that are
//               about your own lobby — Heats, Last Chance round 2, the Regional
//               Grand Finals and the LAN — and not to an open qualifier where
//               your lobby is one of many
//   lobbySize — each game is played in reshuffled lobbies of this size instead
//               of one big field (Play-In / LCQ), while the leaderboard stays
//               cumulative across the whole stage
/* Elim points per match, capped at 10 on the Reload circuit. Epic's Opens boards only add up with the cap:
   shxrk & t3eny 991 pts over 24 matches with 351 elims, and with the cap the remainder matches the placement table
   at an average of 11th. Three other duos close the same way.
   Exception: the Q4 EU final has them at 11 elims, and their 402 only works uncapped. Epic's rules say ten, so ten
   everywhere; check this if a final looks a few points light. */
const CC_RELOAD_KILL_CAP=10;
let CC_KILL_CAP=0;
// Строка очков турнира над таблицей: за места и за элим, из тех же правил, по которым считается вечер.
Object.assign(I18N.ru, {ccPtsRule:'Очки за место', ccPtsKill:'элим', ccPtsCap:n=>'не больше '+n+' за игру'});
Object.assign(I18N.en, {ccPtsRule:'Points for place', ccPtsKill:'elim', ccPtsCap:n=>'up to '+n+' a game'});
Object.assign(I18N.fr, {ccPtsRule:'Points au classement', ccPtsKill:'élim', ccPtsCap:n=>'max '+n+' par game'});
Object.assign(I18N.it, {ccPtsRule:'Punti per piazzamento', ccPtsKill:'elim', ccPtsCap:n=>'max '+n+' a partita'});
Object.assign(I18N.pt, {ccPtsRule:'Pontos por colocação', ccPtsKill:'elim', ccPtsCap:n=>'até '+n+' por partida'});
function ccPtsRuleHTML(pointsFn, killMult, lobby){
  try{
    const T=L(), n=Math.max(2, lobby||100);
    // Броски генератора здесь не тратятся: таблица очков чистая функция места.
    const at=[1,2,3,5,10,15,25,50].filter(p=>p<=n);
    const cells=at.map(p=>({p:p, v:Math.round(pointsFn(p)*10)/10})).filter((c,i,a)=>i===0 || c.v!==a[i-1].v || c.p===at[at.length-1]);
    const k=Math.round(ccKillPts(1, killMult)*10)/10;
    const cap=CC_KILL_CAP>0 ? CC_KILL_CAP : (reloadPlacementTable() ? CC_RELOAD_KILL_CAP : 0);
    return '<div class="live-note cc-pts-rule"><b>'+esc(T.ccPtsRule)+'</b> '+cells.map(c=>'#'+c.p+' '+c.v).join(' · ')+
      (k ? ' · <b>'+esc(T.ccPtsKill)+'</b> +'+k+(cap ? ' ('+esc(T.ccPtsCap(cap))+')' : '') : '')+'</div>';
  }catch(e){ return ''; }
}
function ccKillPts(elims, mult){
  // Set by the career's own Reload runners; the free Reload modes are known by
  // their placement table, which only exists for a Reload card set.
  const cap = CC_KILL_CAP>0 ? CC_KILL_CAP
            : (reloadPlacementTable() ? CC_RELOAD_KILL_CAP : 0);
  /* Множитель может быть и вопросом, а не числом: второй день гранд-финала
     2024-го платит за элим шесть вместо четырёх, и знает об этом только та
     игра, которая идёт (см. ccM24KillGf). Все прочие вызовы передают число,
     как передавали. */
  const m=(typeof mult==='function') ? mult() : mult;
  return (cap>0 ? Math.min(elims, cap) : elims)*m;
}
/* Карта идущего этапа — её ставит simulateGamesLive и снимает в конце.
   Нужна вопросу о высадке: он задаётся снаружи прогона (careerLandingPick),
   а лечь должен на остров, как ложатся лут и высокая земля. */
let CC_RUN_MAP=null;
/* БОТЫ ИГРАЮТ ПО ТАБЛИЦЕ (19.11, его выбор). Последние CC_STAKE_GAMES игр сессии бот смотрит, где он относительно того, за что
   играют: черта (opts.cutAt — квалификация) или, без черты, победа. Дальше — агрессия (team._seekMul, zone-sim seek):
     safe   — проходит с запасом больше, чем можно отыграть: сидит на месте, ×CC_STAKE_SAFE;
     edge   — у черты в пределах одной игры: осторожно, ×CC_STAKE_EDGE;
     chase  — под чертой, но догнать можно: идёт на килы, ×CC_STAKE_CHASE;
     lost   — не догнать: играет на килы ради своих чисел, ×CC_STAKE_LOST.
   Без черты (финал): лидер с запасом — safe, нижняя половина — lost, остальные как были. В последней игре — полная сила,
   за CC_STAKE_GAMES до неё — половина. Только боты: свой отряд, напарник и соперник-человек решают сами.
   «Сколько можно отыграть» — CC_STAKE_PPG × средние очки за игру десятки лидеров на оставшиеся игры. Посыгровых данных
   (кто где стоял перед последней игрой и как играл) нет — множители настройка, проверка tools/check-career-stakes.js:
   смерти в последней игре растут, сила по-прежнему решает, кто прошёл. */
const CC_STAKE_GAMES=2, CC_STAKE_SAFE=0.7, CC_STAKE_EDGE=0.85, CC_STAKE_CHASE=1.6, CC_STAKE_LOST=1.3, CC_STAKE_PPG=2.5;
function ccStakeKind(t, sorted, ptsKey, gamesLeft, cut){
  const top=sorted.slice(0, 10), done=Math.max(1, (sorted[0] && sorted[0]._stakeGames) || 1);
  const ppg=top.reduce((a, x)=>a+(x[ptsKey]||0), 0)/Math.max(1, top.length)/done;
  const reach=CC_STAKE_PPG*ppg*gamesLeft, oneGame=ppg, me=t[ptsKey]||0, rank=sorted.indexOf(t);
  if(cut>0 && cut<sorted.length){
    const line=sorted[cut-1][ptsKey]||0, below=sorted[cut][ptsKey]||0;
    if(rank<cut){ const lead=me-below; return lead>reach ? 'safe' : lead<=oneGame ? 'edge' : null; }
    const gap=line-me; return gap>reach ? 'lost' : gap<=oneGame ? 'edge' : 'chase';
  }
  if(rank===0 && sorted[1] && me-(sorted[1][ptsKey]||0)>reach) return 'safe';
  if(rank>=sorted.length/2) return 'lost';
  return null;
}
function ccStakesSet(teams, ptsKey, g, numGames, cut){
  const left=numGames-g;
  teams.forEach(t=>{
    if(!t || t.isYou || t.isRival || t.isMate) return;
    // Основа — то, что стоит у команды сейчас, если её поменял кто-то другой (черта игрока, стиль клуба).
    if(t._seekMul!==t._seekLast) t._seekBase=(typeof t._seekMul==='number') ? t._seekMul : 1;
    if(t._seekBase===undefined) t._seekBase=1;
    t._stake=null;
    t._seekMul=t._seekBase; t._seekLast=t._seekMul;
  });
  if(numGames<2 || left>CC_STAKE_GAMES) return;
  const sorted=teams.filter(Boolean).slice().sort((a,b)=>(b[ptsKey]||0)-(a[ptsKey]||0));
  if(sorted[0]) sorted[0]._stakeGames=Math.max(1, g);
  const k=left===1 ? 1 : 0.5, M={safe:CC_STAKE_SAFE, edge:CC_STAKE_EDGE, chase:CC_STAKE_CHASE, lost:CC_STAKE_LOST};
  teams.forEach(t=>{
    if(!t || t.isYou || t.isRival || t.isMate) return;
    const kind=ccStakeKind(t, sorted, ptsKey, left, cut||0);
    if(!kind) return;
    t._stake=kind;
    t._seekMul=t._seekBase*(1+(M[kind]-1)*k); t._seekLast=t._seekMul;
  });
}
// Конец сессии: агрессия ботов — снова своя.
function ccStakesClear(teams){ (teams||[]).forEach(t=>{ if(t && t._seekLast!==undefined && t._seekMul===t._seekLast){ t._seekMul=t._seekBase; t._seekLast=t._seekMul; } if(t) t._stake=null; }); }
async function simulateGamesLive(teams, numGames, pointsFn, killMult, fieldPrefix, maxGap, squadKillDampen, zoneGroups, opts){
  opts=opts||{};
  CC_SEATS_REMIX=false;
  /* ПАМЯТЬ МЕСТ ЭТАПА — С НУЛЯ НА КАЖДОМ ПРОГОНЕ В ЛОКСТЕПЕ (прогон 2026, 20.10: Duos Victory Cup 5.01, первое
     лобби без людей — память этапа 17 мест у одного клиента и 49 у другого, боты сели в разные коробки, вечер
     разошёлся на второй игре). Она живёт во вкладке и держится, пока жетон этапа тот же, — а вечер, начатый
     заново (свежий старт после «напарник не дошёл до вопроса»), идёт под тем же жетоном. В одиночной карьере
     всё как было. */
  if(typeof ccMpLock==="function" && ccMpLock()){ CC_DROP_SEATS=null; CC_DROP_SEATS_STAGE=null; }
  /* Остров обрезается под размер команды в момент загрузки (trimLandingZonesForMode). Загруженный
     при чужом размере (сквад-состав на дуо-вечере) оставлял 19–20 клеток из сорока — по две-три
     команды на точку и треть лобби мёртвой к первой зоне. Вечер перезагружает остров под свои команды. */
  { const sz=(teams[0] && teams[0].squad && teams[0].squad.length) || squadSize;
    if(sz && sz!==LANDING_TRIM_SIZE && ZONE_SETS[ACTIVE_LANDING_SET]){ const was=squadSize; squadSize=sz; useLandingSet(ACTIVE_LANDING_SET); squadSize=was; } }
  // Общая комната гонки: люди в поле и в одном лобби (together), иначе большое поле
  // развело бы их по разным; боты у всех уже одинаковы (общий сид, см. ccRaceFieldSync).
  if(typeof ccRaceLock==='function' && ccRaceLock()){
    await ccRaceFieldSync(teams, opts);
    const hs=teams.filter(t=>t.isYou || t.isRival);
    // Порядок — по адресу, один у обоих клиентов: склейка лобби сажает всех к первому
    // в списке, и «я первый» у каждого своё (проба check-race-live-two: комнаты расходились).
    // Со сплитом (ccRaceSplitLobbies) людей разводит жребий; склейка осталась для отката.
    if(!ccRaceSplitLobbies() && hs.length>1 && !(opts.together && opts.together.length>1))
      opts.together=hs.sort((a,b)=>String(a.mpTag||'')<String(b.mpTag||'') ? -1 : 1);
  }
  /* Жетон этапа — им и держится раздача высадки все игры подряд (ccLandingRoll).
     Свой у каждого прогона: два кубка подряд не обязаны лечь одинаково, а
     двенадцать игр одного финала — обязаны. */
  /* Жетон — от ДНЯ и СЕЗОНА карьеры, а счётчик только нумерует этапы внутри
     вечера. Скриншоты (перемотка, fc5067f6): «rolls @ #2 drop=184/394265
     vs drop=184/146114» — броски равны, раздача разная, то есть разошёлся не
     поток, а соль разброса высадки (ccLandingRoll солится этим жетоном).
     Счётчик сбрасывается на старте вечера (ccMpSeedOn) и на старте раннера
     (careerPlayRun), поэтому перезапуск раннера посреди вечера (resume/fresh)
     нумерует этапы так же, как у напарника. Вне карьеры — как было. */
  const stageDay=(typeof CAREER!=='undefined' && CAREER && CAREER.career && typeof careerToday==='function')
    ? careerToday()+'|'+(CAREER.career.season||1)+'|' : '';
  CC_DROP_STAGE=stageDay+'s'+(++CC_DROP_STAGE_N)+'|'+fieldPrefix;
  // Первый раунд пропущен — перед вторым спросить: играть или симулировать (ccRoundChoice).
  if(CC_DROP_STAGE_N>1) await ccRoundChoiceMaybe();
  ccMpCalcStart();
  applyStageBias(pointsFn);
  beginAnimatedStage();
  const ptsKey=fieldPrefix+'Pts', elimsKey=fieldPrefix+'Elims';
  const logKey=fieldPrefix==='total' ? 'gameLog' : 'stageLog';
  // qualSeat гаснет вместе с очками этапа: очередь на метку принадлежит тому
  // этапу, который её проставил. Без этого поле, которое следующий этап собрал
  // заново и не пронумеровал, вставало в очередь по вчерашним местам — см.
  // stampQualSeats.
  teams.forEach((t,i)=>{ t[ptsKey]=0; t[elimsKey]=0; t[logKey]=[]; t.gotVR=false; t.wins=0; t.qualByWin=false; t.qualSeat=0; t._uid=i; t.landingWins=0; t.landingLosses=0; t.multiKillLandingWins=0; t.landingContests=0; });
  /* Вечер в эфир: окошко трансляции читает этап отсюда — поле, ключ очков,
     сколько игр и где отсечка. Один вход на все раннеры, потому что живой этап
     у всех один и тот же. См. ccTvTick. */
  if(typeof CC_STREAM_LIVE!=='undefined' && CC_STREAM_LIVE)
    CC_TV_RUN={teams:teams, pts:ptsKey, n:numGames, cut:opts.cutAt||0,
               name:opts.stageName||''};
  /* carry — points the field walks in with, by team name. Division 1's Tuesday
     is the second session of one tournament, and the standings a player reads
     during it have to be the tournament's: with Monday left out, the table said
     nothing about the cut, the fifty on screen were not the fifty going
     through, and there was no way to tell from the live board whether you had
     qualified. Applied after the reset above, so the live table counts from the
     week's total and the game log stays this evening's own. */
  if(opts.carry) teams.forEach(t=>{
    // Keyed on the duo rather than on the row: see ccRelKey. An older banked
    // evening was keyed on the name, so read that too when it is what is there.
    const k=(opts.carry.byName ? t.name : ccRelKey(t));
    t[ptsKey]+=(opts.carry.pts[k]||0);
    t[elimsKey]+=(opts.carry.elims[k]||0);
    /* And the games behind those points.

       The table read a team's game count off the length of its own log for this
       evening, so on the second session everybody showed eleven while their
       points said twenty-two - and the player showed twenty-two, because theirs
       is the only log stitched together afterwards. One row in a standings table
       counting a different number of games from the row under it is the table
       contradicting itself.

       Wins for the same reason: a Victory Royale on Monday is still one on
       Tuesday. */
    t._carryGames=(opts.carry.games && opts.carry.games[k])||0;
    t.wins=(t.wins||0)+((opts.carry.wins && opts.carry.wins[k])||0);
  });
  // Whether this stage's games are played on the map. When they are, the drop
  // is played there too — the engine puts every squad on its own `landingZone`
  // and the first forty seconds settle who shares with whom — so nothing is
  // decided here. When they are not, the round-based model has no drop at all
  // and the landing fights still have to be resolved up front, which is what
  // contestedGroups is for: zone-mates from the picker, a fresh coin flip at
  // the top of every game rather than one outcome locked in once.
  const dropOnMap = useZoneSim(teams);
  /* Считается ПЕРЕД КАЖДОЙ игрой, а не один раз на этап: с 24 августа дроп
     спрашивается каждую игру (см. opts.dropEachGame), и раздача может стать
     другой. Вне карты это и есть весь дроп, поэтому список стычек обязан
     ехать за ней. */
  const contestedNow = () => (zoneGroups && !dropOnMap)
    ? [...zoneGroups.values()].filter(g=>g.length>=2) : [];

  const container=document.getElementById('majorStages');
  const shell=document.createElement('div');
  shell.className='stage-card';
  // The map and the table share one row so they can sit side by side for the
  // whole stage (stage-live-playing, added once below when a replay actually
  // mounts) and fall back to plain block flow — table alone, full width —
  // for every mode with no replay at all: nothing here turns that on for them.
  shell.innerHTML=`<h4 id="finalsLiveTitle"></h4>
    ${ccPtsRuleHTML(pointsFn, killMult, opts.lobbySize||teams.length)}
    ${(typeof ccRaceOn==='function' && ccRaceOn()) ? '<div class="live-note cc-rival-live" id="ccRivalLive" style="display:none"></div>' : ''}
    ${opts.carry ? `<div class="live-note">${L().ccLiveWeekNote}</div>` : ''}
    <div class="stage-live">
      <!-- Высота таблицы тоже от окна, а не 520 навсегда: рядом с картой,
           которая теперь занимает почти весь экран по высоте, таблица на
           пятьсот двадцать показывала десяток строк из пятидесяти. Ниже
           прежнего не станет — max() держит старое значение полом. -->
      <div class="lobby-wrap" style="margin-top:6px;max-height:max(520px, calc(100vh - 300px));overflow-y:auto;">
        <table class="lobby-table lobby-live">
          <thead><tr><th>${L().rankHeader}</th><th>${L().teamHeader}</th><th class="num">${L().ptsHeader}</th><th class="num">${L().matchesWord}</th><th class="num">${L().winsWord}</th><th class="num">${L().killsHeader}</th><th class="num">${L().avgHeader}</th></tr></thead>
          <tbody id="finalsLiveBody"></tbody>
        </table>
      </div>
    </div>`;
  container.appendChild(shell);
  shell.scrollIntoView({block:'start', behavior:'smooth'});

  const titleEl=document.getElementById('finalsLiveTitle');
  const body=document.getElementById('finalsLiveBody');
  const stageLive=shell.querySelector('.stage-live');
  let currentGameNum=0;

  // What the table shows while a game is being played out on the map. Keyed by
  // _uid and never written into the team's own totals: those are awarded once,
  // at the end, by the code that has always awarded them. This is a view, and a
  // view that is wrong cannot take the standings with it.
  let liveScore=null;   // Map uid -> {pts, elims} while a replay is running
  const livePts   = t => liveScore ? (liveScore.get(t._uid)||{pts:0}).pts   + t[ptsKey]   : t[ptsKey];
  const liveElims = t => liveScore ? (liveScore.get(t._uid)||{elims:0}).elims + t[elimsKey] : t[elimsKey];
  /* Сколько матчей сыграно — считая тот, что идёт прямо сейчас.

     Правка: «не сразу игру засчитывает, хотя уже 2 идёт». На
     скрине заголовок «ИГРА 2 ИЗ 4», очки и килы за вторую игру уже капают в
     таблицу — а столбец МАТЧИ показывает единицу. Так и было: очки и килы
     живые (см. выше), а матчи считались по журналу, куда игра попадает только
     когда закончится. Хуже того, в лобби-этапах чужие лобби досчитываются в
     тот же тик, то есть у них уже двойка, а у твоего лобби единица — одна
     таблица показывала два разных счёта.

     liveScore держит ровно тех, кто в идущей игре, — по нему и считается. */
  const livePlayed = t => (t[logKey]||[]).length + (t._carryGames||0) +
    (liveScore && liveScore.has(t._uid) ? 1 : 0);
  /* Сила — ИГРОВАЯ, пока игра идёт.

     Правка со скрином строки: «во время игры не
     насчитывается, не плюс не минус». Столбец показывал `pow` — силу
     карточки, — а она за матч не меняется никогда. Всё, что игрок делает по
     ходу игры, живёт в `_pf`: лут даёт +4, высокая земля +6 или −2, комната
     ходит тем же. То есть колонка стояла ровно там, где он и смотрел на
     результат своего решения.

     Между играми — снова карточка: `_pf` там пересобирается от `pow` с формой
     на игру, и показывать этот шум как «силу» значило бы врать в другую
     сторону. Живая игра опознаётся по liveScore, как и очки с килами. */
  const livePow = t => {
    if(t.pow==null && t._pf==null) return '-';
    const live = liveScore && liveScore.has(t._uid) && t._pf!=null;
    if(!live) return Math.round(t.pow);
    /* Сила карточки плюс то, что игрок с ней сделал: лут после второй зоны и
       высокая земля на восьмой прибавляются к _pf абсолютом, а бросок формы —
       множителем, и он же записан в _pfBase. Вычитаем базу — остаётся ровно
       то, что можно объяснить: «поднял лут, +4». Иначе колонка каждую игру
       начиналась с нового числа (замер: 96 показывалось как 91-102), и игрок 24 августа спросил, в чём проблема. */
    const base = t._pfBase!=null ? t._pfBase : t.pow;
    return Math.round(t.pow + (t._pf - base));
  };
  // Rows carry their team's uid as a string. Looking the team up by scanning
  // the field would be fifty scans of fifty teams on every frame, thirty-five
  // times a second, for a lookup that never changes.
  const byUid=new Map(teams.map(t=>[String(t._uid), t]));

  /* The live table is a window on the standings, not the whole of them.

     It used to draw a row per team and rebuild every one on every reorder, with
     a getBoundingClientRect on each for the move animation. That is fine at
     fifty and it is not fine at nine thousand: an open cup put ten thousand
     rows in the DOM and measured all of them thirty times a second, and the run
     stopped being watchable long before the simulation was the slow part.

     So it shows the top LIVE_ROWS and, when the player is below them, their own
     row pinned underneath — the same shape the money and Power Rankings boards
     use. Every team is still scored, sorted and placed; this only decides how
     many of them are on screen. */
  // Живая таблица — шестьдесят и всегда: сотня строк в финале соло лагала на движении зон (Notion 27.10 скрин 33, 29.10).
  // Итог этапа (revealStandings) показывает всю сотню.
  // Строк — сколько отрядов в одном лобби режима (его слово 29.10: «топ 50 в дуо, 33 трио, 25 сквад, соло 100»).
  const LIVE_ROWS=({1:100, 2:50, 3:33, 4:25})[squadSize] || 50;
  /* ОКНО У ТВОЕГО МЕСТА (29.10, его «пусть таблица будет рядом с плейсами игрока, чтоб меньше лагов»): живая таблица
     — лидеры (LIVE_TOP) и строки вокруг тебя (±LIVE_NEAR), плюс строка черты прохода; ~25 строк вместо 60, меньше
     перерисовки на движении зон. Без своей команды в поле (смотришь чужой кап) — верх LIVE_ROWS, как было. */
  const LIVE_TOP=5, LIVE_NEAR=10;
  function liveWindow(sorted){
    // Верх LIVE_ROWS, своя строка — снизу, если ты ниже (окно у своего места снято по его слову того же дня).
    const top=sorted.slice(0, LIVE_ROWS), mine=sorted.find(t=>t.isYou);
    if(mine && sorted.indexOf(mine)>=LIVE_ROWS) top.push(mine);
    return top;
  }
  /* Строки живут между перерисовками.

     Замер на телефоне (Chrome, CPU ×6, 30 секунд вечера): пересчёт стилей
     5-6 секунд из 30 — больше, чем вся симуляция. Таблица пересобиралась
     ЦЕЛИКОМ на каждой перестановке: body.innerHTML='' и шестьдесят новых
     строк по семь ячеек, то есть четыреста двадцать разобранных кусков
     разметки ради того, что почти всегда сводится к паре изменившихся чисел
     и новому порядку.

     Теперь узел строки принадлежит команде и переживает перестановку:
     appendChild ПЕРЕНОСИТ существующий узел, а не создаёт новый, — и это же
     чинит подсветку места, которая раньше моргала вместе с пересборкой.
     Пишется только то, что стало другим (см. putCell). */
  const rowByUid=new Map();
  const putCell=(cell, val)=>{ if(!cell) return;
    const s=String(val); if(cell.textContent!==s) cell.textContent=s; };
  /* Живой порядок поля — ключи считаются ОДИН раз на команду, а не в каждом сравнении сортировки: в открытом капе поле
     2470 дуо, и сравнение звало livePts/liveElims десятки тысяч раз на кадр (профиль 20.10 под эмуляцией телефона:
     ~3 с из 40 секунд показа). Порядок тот же. */
  function liveSorted(){
    const n=teams.length, P=new Float64Array(n), E=new Float64Array(n), W=new Float64Array(n), ix=new Array(n);
    for(let k=0;k<n;k++){ const t=teams[k]; P[k]=livePts(t); E[k]=liveElims(t); W[k]=t.wins||0; ix[k]=k; }
    // Этап, где победа — билет (stopOnWin): взявшие Виктори стоят над всеми, как у Epic с их 947 за победу.
    if(opts.stopOnWin) ix.sort((a,b)=>((teams[b].qualByWin?1:0)-(teams[a].qualByWin?1:0)) || P[b]-P[a] || E[b]-E[a] || W[b]-W[a] || a-b);
    else ix.sort((a,b)=>P[b]-P[a] || E[b]-E[a] || W[b]-W[a] || a-b);
    return ix.map(k=>teams[k]);
  }
  function renderRows(){
    const sorted=liveSorted();
    sorted.forEach((t,i)=>{ t._liveRank=i+1; });
    const shown=liveWindow(sorted);
    const frag=document.createDocumentFragment();
    const live=new Set();
    shown.forEach((t)=>{
      const i=t._liveRank-1;
      const uid=String(t._uid);
      live.add(uid);
      let tr=rowByUid.get(uid);
      if(!tr){
        tr=document.createElement('tr');
        tr.dataset.uid=uid;
        tr.innerHTML='<td class="lobby-rank"></td><td></td><td class="num lobby-pts"></td>'+
          '<td class="num lobby-num"></td><td class="num lobby-num"></td>'+
          '<td class="num lobby-num"></td><td class="num lobby-num"></td>';
        rowByUid.set(uid, tr);
      }
      // The line the evening is played for, drawn under the last qualifying row
      // — the same rule the standings card uses when the stage ends, so a
      // player can read "am I through" off the live table instead of counting.
      const cls='lobby-row'+((t.isYou||t.isClub)?' lobby-you':'')+(t.isMate?' lobby-mate':'')+
        (opts.cutAt && t._liveRank===opts.cutAt ? ' lobby-cut' : '');
      if(tr.className!==cls) tr.className=cls;
      // A Victory Royale ends that team's stage, so they stop at whatever game
      // they won on — show their own games played, not the current game number.
      const done = opts.stopOnWin && t.gotVR;
      const played = livePlayed(t);
      const regTag = t.regionRank
        ? ` <span style="color:var(--ink-dimmer);font-size:11px;font-weight:600;">${regionName(t.summitRegion||(t.squad&&t.squad[0]||{}).region||'')} #${t.regionRank}</span>`
        : '';
      // Надетый скин — значок твоей команды (Notion «18.10»: «видеть купленное во время игры»).
      const skin = t.isYou && typeof ccFnWorn==='function' && typeof CAREER!=='undefined' && CAREER ? ccFnWorn('o') : null;
      const nameStyled = (skin ? '<img class="lb-skin" src="'+ccFnImg(skin.id, true)+'" alt="" onerror="this.remove()">' : '')
        + ((t.isYou||t.isClub) ? '<b style="color:var(--lb-you);">'+t.name+'</b>' : t.name)
        + regTag
        // Приз за текущее место — у ника, как в итоговой таблице (его слово 29.09: «во всех таблицах, где есть призы»).
        + (opts.prize ? stPrizeHTML(prizeFor(opts.prize, i+1), (t.squad||[]).length||squadSize) : '')
        + (done ? ' <span style="color:var(--accent);font-weight:900;" title="'+L().qualByVR+'">★</span>' : '');
      const powerVal = livePow(t);
      const op = done ? '.72' : '';
      if(tr.style.opacity!==op) tr.style.opacity=op;
      const c=tr.children;
      putCell(c[0], '#'+(i+1));
      // Имя — разметкой: в нём флаг региона и звезда за ВР. Пишется только
      // когда изменилось, потому что разбор разметки и есть дорогая часть.
      if(c[1].innerHTML!==nameStyled) c[1].innerHTML=nameStyled;
      putCell(c[2], livePts(t));
      putCell(c[3], played);
      putCell(c[4], t.wins||0);
      putCell(c[5], liveElims(t));
      putCell(c[6], powerVal);
      frag.appendChild(tr);
    });
    // Перенос всех показанных строк в новый порядок — одной операцией.
    body.appendChild(frag);
    // И вынос тех, кого в этой выборке больше нет (своя строка ушла из-под
    // отсечки, комната сжалась после ВР): они остались бы выше перенесённых.
    Array.from(body.children).forEach(tr=>{ if(!live.has(tr.dataset.uid)) tr.remove(); });
  }

  /* Перестановка строк с анимацией — и ВСЕ ЗАМЕРЫ ОДНОЙ ПАЧКОЙ.

     Профиль на телефоне (Chrome, CPU ×6, живой сайт, вечер дивизионного кубка):
     47% простоя, 34% в движке браузера (лэйаут и отрисовка) и 5% в самом
     getBoundingClientRect — при том, что вся симуляция вместе с зон-движком
     занимала около четырёх. Причина не в количестве замеров, а в их порядке:
     нижний цикл читал прямоугольник строки и тут же писал ей стиль, читал
     следующую — и снова писал. Каждое такое чтение после записи заставляет
     браузер пересчитать раскладку заново, то есть шестьдесят раскладок на одну
     перестановку вместо одной (forced synchronous layout).

     Теперь два прохода: сперва читаются все новые прямоугольники, потом
     пишутся все стили. Картинка та же, порядок работы — нет. */
  const LIVE_SMALL=(typeof window!=='undefined' && window.matchMedia) ? window.matchMedia('(max-width: 760px)').matches : false;
  /* ПЕРЕСТАНОВКА БЕЗ ЗАМЕРОВ (29.10, его «поищи внимательней все таблицы симуляции»). Профиль Solo Series (сто строк):
     долгие кадры 60–160 мс, и почти всё в них — вынужденная раскладка (forced style and layout) внутри шага повтора:
     перестановка читала прямоугольник каждой строки до и после renderRows, а followYou — offsetTop своей строки; оба
     чтения шли сразу после записей в таблицу, и браузер каждый раз пересчитывал страницу. Теперь сдвиг строки — разница
     номеров × высота строки, видимое окно и прокрутка — из кэша (событие scroll, ResizeObserver), высоты строки и шапки
     меряются один раз. Едут только строки в окне. */
  const liveWrap=shell.querySelector('.lobby-wrap');
  const LV={rowH:0, headH:0, top:0, h:0};
  function liveMeasure(){
    if(LV.rowH) return;
    const r=body.children[0]; if(!r) return;
    LV.rowH=r.offsetHeight||34;
    const th=shell.querySelector('.lobby-wrap thead'); LV.headH=th ? th.offsetHeight : 0;
    if(liveWrap){ LV.top=liveWrap.scrollTop; LV.h=liveWrap.clientHeight; }
  }
  if(liveWrap){
    liveWrap.addEventListener('scroll', ()=>{ LV.top=liveWrap.scrollTop; }, {passive:true});
    try{ new ResizeObserver(()=>{ LV.h=liveWrap.clientHeight; }).observe(liveWrap); }catch(e){}
  }
  function animatedRerender(){
    /* Под пропуском (перемотка, «пропустить») строки не едут: замер 2.10 — месяц перемотки
       ставил ~780 пар кадров и столько же таймеров уборки ради анимации, которую никто не видит. */
    if(skipAnimation){ renderRows(); return; }
    /* На телефоне строки встают на места без полёта (его слово 20.10). */
    if(LIVE_SMALL){ renderRows(); followYou(); return; }
    const before=new Map(Array.from(body.children).map((tr,i)=>[tr.dataset.uid, i]));
    renderRows();
    if(!LV.rowH){ liveMeasure(); followYou(); return; }
    const rows=Array.from(body.children), H=LV.rowH;
    const vis=i=>{ const y=LV.headH+i*H; return !LV.h || (y+H>LV.top-40 && y<LV.top+LV.h+40); };
    const moved=[];
    rows.forEach((tr, ni)=>{
      const oi=before.get(tr.dataset.uid);
      if(oi==null || oi===ni) return;
      if(!vis(oi) && !vis(ni)) return;
      const dy=(oi-ni)*H;
      // Only animate short hops. A row flying across forty places just smears
      // through everything else, so long jumps snap into place instead.
      if(Math.abs(dy)<420) moved.push([tr, dy]);
    });
    moved.forEach(([tr, dy])=>{
      tr.style.transition='none';
      tr.style.transform=`translateY(${dy}px)`;
      // opaque and raised while it travels, so it doesn't blend into the
      // rows it passes over
      tr.style.position='relative';
      tr.style.zIndex='2';
      if(!tr.classList.contains('lobby-you')) tr.style.background='var(--lobby-row)';
    });
    // Один кадр на всю пачку, а не по два на каждую строку.
    if(moved.length) requestAnimationFrame(()=>requestAnimationFrame(()=>{
      moved.forEach(([tr])=>{ tr.style.transition='transform 380ms cubic-bezier(.2,.8,.3,1)'; tr.style.transform=''; });
      setTimeout(()=>{ moved.forEach(([tr])=>{ tr.style.zIndex=''; tr.style.background=''; tr.style.position=''; }); }, 400);
    }));
    followYou();
  }

  // The table watches your squad, not the top of the leaderboard: the scroll
  // follows your row wherever the standings put it. Position from the row index
  // and the cached row height — no offsetTop read in the middle of a game.
  function followYou(){
    if(!liveWrap) return;
    setTimeout(()=>{
      const rows=body.children; let i=-1;
      for(let k=0;k<rows.length;k++) if(rows[k].classList.contains('lobby-you')){ i=k; break; }
      if(i<0) return;
      if(!LV.rowH) liveMeasure();
      const target=Math.max(0, LV.headH+i*LV.rowH - (LV.h||liveWrap.clientHeight)/2 + LV.rowH/2);
      if(Math.abs(LV.top-target) < 4) return;
      LV.top=target;
      liveWrap.scrollTo ? liveWrap.scrollTo({top:target, behavior:'smooth'})
                        : (liveWrap.scrollTop=target);
    }, 420);
  }

  renderRows();
  followYou();

  // The map replay, for the mode that has one. It mounts into the same row as
  // the standings and plays a game before that game's points land in the
  // table, so the table updating is the result of what was just watched
  // rather than a separate event.
  // Whichever island this stage is actually being played on. It used to be
  // written out as a choice between the two 2026 Majors, which was true when
  // there were only two — and quietly wrong the moment the app grew the 2025
  // trio Majors, because t1, t2 and t3 all fell through to the duo island and
  // a trio Major was played out on a map it never visits. useLandingSet
  // already publishes what it picked; this reads that instead of guessing.
  const zoneSet    = ZONE_SETS[ACTIVE_LANDING_SET] ? ACTIVE_LANDING_SET : 'm2';
  // Which stages get a map, asked for one at a time.
  //
  // It used to appear wherever the zone engine ran, which meant an open
  // qualifier — hundreds of duos, your lobby one of many, nothing riding on the
  // game in front of you — opened with a map nobody was watching for. The map
  // is for the stages that are about your own lobby: the Heats, the Last
  // Chance, the Regional Grand Finals and the LAN. Everything else plays out in
  // the table, which is what those stages are actually read from.
  //
  // Opt-in rather than opt-out, so a stage added later has to say it wants one
  // instead of inheriting it by accident.
  const replayOn   = !!opts.mapReplay && typeof ZoneReplay !== 'undefined' && useZoneSim(teams);
  const zoneRatio  = MAP_ASPECT[zoneSet].split('/');
  const zoneAspect = Number(zoneRatio[1]) / Number(zoneRatio[0]);
  // let, а не const: остров может смениться посреди этапа — см. opts.mapEach
  // и переподключение карты в начале игры.
  let replay       = replayOn
    ? ZoneReplay.mount(stageLive, MAP_ART[zoneSet], MAP_ASPECT[zoneSet].replace('/', ' / '), zoneAspect)
    : null;
  /* Карта этапа — там же, где её видит вопрос о высадке.

     Правка: «про то, куда падать, сделай так же, как в mid
     гейме и late: маленькое окошко, и потом перебрасывает, если хочешь
     конить, и там кликаешь». Лут и высокая земля кладут панель на остров
     (ui.map), а высадка спрашивалась карточкой в ленте под таблицей — то есть
     о карте, не глядя на карту.

     careerLandingPick живёт снаружи и про этот прогон ничего не знает,
     поэтому карта называется здесь и снимается в конце этапа: между этапами
     ссылки нет, и первый вопрос вечера (он задаётся до входа сюда) как
     спрашивался карточкой, так и спрашивается. */
  CC_RUN_MAP=(replay && replay.wrap) || null;
  /* Сколько карта может занять в ширину, чтобы не перерасти окно в высоту.
     zoneAspect — это высота на единицу ширины, значит предельная ширина равна
     высоте, оставшейся от окна, делённой на него. CC_MAP_TOP — то, что стоит
     над картой и под ней: шапка страницы, заголовок этапа и подпись. Считается
     здесь, а не в CSS, потому что у каждого острова своё отношение сторон. */
  if(replay && replay.wrap)
    replay.wrap.style.setProperty('--zr-cap',
      'min(100%, calc((100vh - ' + CC_MAP_TOP + 'px) / ' + zoneAspect.toFixed(4) + '))');
  // Two columns for the whole stage, not just while a game is actually
  // animating — added once here (only when there is a map to sit beside the
  // table) so the card stops snapping between layouts every single game.
  if(replay) stageLive.classList.add('stage-live-playing');
  const replayLabels = {zone:L().zoneWord, alive:L().aliveWord, storm:L().stormWord, surge:L().surgeWord};

  // The table, driven off the same frames the map is drawing.
  //
  // A squad's place is fixed the moment it dies and a living squad is currently
  // in as many places as there are squads alive, so every frame carries enough
  // to score the whole lobby. The last frame scores the same as the end of the
  // game — tools/zone-sim-test.js asserts exactly that — so the table arrives at
  // the right numbers rather than being corrected onto them.
  let lastOrder='', lastMove=0;
  function onZoneFrame(lobby, frame){
    try{ if(CAREER_RUN) ccCastFrame(lobby, frame); }catch(e){}
    let alive=0;
    for(const d of frame.dots) if(d.alive) alive++;
    const next=new Map();
    frame.dots.forEach((d,i)=>{
      const t=lobby[i];
      if(!t) return;
      // Every squad in the lobby owns a dot, including the ones that lose their
      // drop: the landing fight is played on the map now, so its kills are in
      // d.e like any other and nothing has to be folded in from outside.
      let elims=d.e;
      if(squadKillDampen) elims=Math.max(0, Math.round(elims*squadKillDampen));
      next.set(t._uid, {pts: pointsFn(d.p || alive) + ccKillPts(elims, killMult), elims});
    });
    liveScore=next;
    /* HUD набора на карте — после того как посчитан живой счёт: золотой
       шестиугольник у полосок показывает очки сессии (этап плюс текущая игра),
       как «поинты» на турнирном HUD. См. ccKitPanel. */
    try{
      const meT=lobby.find(t=>t && t.isYou);
      CC_KIT_PTS=meT ? Math.round(livePts(meT)) : null;
      ccKitPanel(lobby, frame);
    }catch(e){}

    // Numbers first: writing text into rows that are already on screen moves
    // nothing, so a kill can show the instant it lands.
    /* Ячейка пишется, ТОЛЬКО ЕСЛИ в ней теперь другое число.

       Замер на телефоне (Chrome, CPU ×6, вечер дивизионного кубка, 30 секунд):
       задачи главного потока 21.8 с, из них скрипт 3.9 с, а пересчёт стилей и
       раскладка — 9.2 с, то есть интерфейс стоил в два с лишним раза дороже
       самой симуляции. Причина — вот этот цикл: шестьдесят строк по четыре
       ячейки на каждом кадре, и присвоение textContent помечает узел грязным
       даже тогда, когда строка та же самая. За игру в комнате меняется
       несколько чисел, а платили мы за все двести сорок.

       Сравнение — со строкой, потому что textContent и так строка; число
       приводится тем же способом, каким браузер привёл бы его при записи. */
    for(const tr of body.children){
      const t=byUid.get(tr.dataset.uid);
      if(!t) continue;
      const cells=tr.children;
      const put=putCell;
      put(cells[2], livePts(t));
      // Матчи вместе с очками: они меняются в один и тот же момент — когда
      // игра началась, — и обновлять их врозь значит снова их разойти.
      put(cells[3], livePlayed(t));
      put(cells[5], liveElims(t));
      // И сила: лут и высокая земля меняют её посреди матча, а колонка о них
      // узнавала только при полной перерисовке строки — то есть почти никогда.
      put(cells[6], livePow(t));
    }

    // Order second, and slowly. Rows that reorder faster than they can travel
    // interrupt each other halfway, and the endgame is several deaths a second.
    // Порядок считается только тогда, когда его вообще можно применить (раз в 380 мс / 1 с): между перестановками он
    // никому не нужен, а в большом поле это сортировка тысяч команд на каждом кадре.
    const now=Date.now();
    if(now-lastMove>=(LIVE_SMALL ? 1000 : 380)){
      const sorted=liveSorted();
      const pos=new Map(sorted.map((t,i)=>[t,i]));
      const order=liveWindow(sorted).map(t=>t._uid+':'+pos.get(t)).join(',');
      if(order!==lastOrder){ lastOrder=order; lastMove=now; animatedRerender(); }
    }
  }

  const liveLabel = opts.stageName || L().finalsLiveDefault;
  /* ФИНАЛ В ДВА ДНЯ (29.10, его «финалы все по два дня, во всех модах… суммируются во второй»): у Epic гранд-финалы
     играются двумя днями по половине матчей, и таблица второго дня — продолжение первого. opts.days — сколько игр в
     первый день (Мейджоры 2024: CC_M24_DAY1_GAMES, со своим ×1.5), opts.twoDay — поровну. Очки не трогаются: это
     тот же счёт, только с днями, подписью «день N» и экраном «Конец дня 1» между ними. */
  const dayOne=(opts.days>0 && opts.days<numGames) ? opts.days : (opts.twoDay && numGames>=6 ? Math.ceil(numGames/2) : 0);
  for(let g=0; g<numGames; g++){
    if(dayOne && g===dayOne){
      try{ await ccDayBreak(replay && replay.wrap, liveLabel, 1); }catch(e){ if(e===RUN_ABANDONED) throw e; }
    }
    // The label can carry a flag image, so it has to go in as markup — as text
    // the <img> tag would be printed out literally.
    titleEl.innerHTML=dayOne
      ? L().finalsLiveDayLabel(liveLabel, g<dayOne ? 1 : 2, g<dayOne ? g+1 : g+1-dayOne, g<dayOne ? dayOne : numGames-dayOne)
      : L().finalsLiveGameLabel(liveLabel, g+1, numGames);
    /* Второй день Гранд-финала 2024-го платит ×1.5 (ruleset Epic 152: элим 6, день 1 — 4). Игрок, 3.10:
       «дают почему-то 6 поинтов за килл, хотя должно быть 4» — правило настоящее, но его не было видно. */
    if(killMult===ccM24KillGf && g+1>CC_M24_DAY1_GAMES)
      titleEl.innerHTML+=' · <span class="cc-day2">'+esc(L().ccLiveDay2(CC_M24_KILL*CC_M24_DAY2))+'</span>';
    currentGameNum=g+1;
    ccStakesSet(teams, ptsKey, g, numGames, opts.cutAt||0);   // боты в конце сессии играют по таблице
    /* Барьер на КАЖДУЮ игру — в команде.

       Сверка стояла только на вопросе о высадке, а открытый раунд его не
       задаёт: шесть игр Victory Cup шли без единой сверки, и расхождение в
       них всплывало знаком «?» уже на следующем раунде — без номера игры и
       без чисел (скриншот, оба экрана). Здесь каждая игра
       начинается с «я дошёл» и несёт номер, хеш таблицы и счётчик бросков:
       разойдётся — красная строка назовёт игру и покажет, кто потратил
       больше. Цена — один круг по сети на игру. */
    if(ccMpLock() && typeof ccMpSync==='function'){
      CC_MP_GAME++;
      // Первая игра везёт весь список поля: разошлось поле — красная строка назовёт строку. См. ccMpFieldList.
      /* И каждую игру, пока комната невелика: скриншоты — «field …
         vs …» на игре 2 без строки, потому что список ехал только с первой.
         Сотня на 4900 едет один раз, как ехала. */
      CC_MP_FIELD_LIST=((g===0 || teams.length<=600) && typeof ccMpFieldList==='function') ? ccMpFieldList(teams) : null;
      CC_MP_STATE_KEYS=ccMpStateKeys();
      await ccMpSync('game', (g+1)+'|'+ccTableHash(teams)+'|'+CC_MP_ROLLS+'|'+ccFieldSig(teams)+'|'+CC_MP_LEDGER.join(',')+'|'+ccTableTop(teams)+'|'+(CC_MP_FIELD_FP||'')+ccMpHumansTag(teams), ccMpQn('game'));   // 7-е поле — отпечаток сборки, только для показа
      CC_MP_FIELD_LIST=null;
      ccMpLedgerReset();
      ccMpCalcStart();
    }

    /* Остров ЭТОЙ игры, если вечер играется на двух.

       Отзыв: «1 игра слюрпи, другая стронхолд». Круг Reload
       идёт по двум островам, и настоящий вечер их чередует — а здесь карта
       монтировалась один раз на этап, и все игры проходили на одном.

       Меняется до вопроса о высадке: спрашивать, куда падать, надо уже глядя
       на тот остров, где будет игра. Сетка коробок, точка игрока и его аура
       живут по островам отдельно (cr.spots), поэтому useLandingSet переключает
       их заодно — и на новом острове спросят заново.

       Карта переподключается целиком: у островов разные пропорции, и растянуть
       старую рамку под новую картинку нельзя. */
    if(typeof opts.mapEach==='function'){
      const want=opts.mapEach(g+1);
      if(want && ZONE_SETS[want] && want!==ACTIVE_LANDING_SET){
        useLandingSet(want);
        if(replay){
          ZoneReplay.unmount(replay);
          const rr=String(MAP_ASPECT[want]||'1100/970').split('/');
          const asp=Number(rr[1])/Number(rr[0]);
          replay=ZoneReplay.mount(stageLive, MAP_ART[want],
                                  String(MAP_ASPECT[want]).replace('/', ' / '), asp);
          CC_RUN_MAP=(replay && replay.wrap) || null;
          if(replay && replay.wrap)
            replay.wrap.style.setProperty('--zr-cap',
              'min(100%, calc((100vh - ' + CC_MAP_TOP + 'px) / ' + asp.toFixed(4) + '))');
        }
      }
    }

    /* Куда падать — вопрос КАЖДОЙ игры, а не вечера.

       Правка со скрина игрока: «пусть каждую игру будет
       вопрос куда падать». Драфт так и играет с самого начала — дроп и стычка
       решаются заново перед каждой из двенадцати игр, — а карьера спрашивала
       один раз на этап и потом одиннадцать игр падала в ту же коробку.

       Раннер отдаёт сюда свою же функцию высадки, поэтому вопрос и раздача
       остаются его: карьера спрашивает «дом или контест», перемотка отвечает
       сама, а режим «только смотрю» берёт первый вариант — всё это уже внутри
       careerLandingPick и ccChoiceBox. Первая игра пользуется тем, что уже
       разложил раннер до входа сюда: два вопроса подряд на одну игру — это не
       выбор, а щелчок. */
    /* И перед ПЕРВОЙ игрой тоже — правка: «не надо первой
       таблички, пусть 1 игра стартует, с картой и табличкой, которая ниже».
       Раньше первый вопрос задавал раннер, до входа сюда: карты на экране ещё
       не было, и он выходил карточкой в ленте — той самой «первой табличкой».
       Теперь спрашивают все игры одинаково и в одном месте: этап начинается,
       появляется остров, и на нём встаёт то же маленькое окно, что в середине
       и в конце игры. */
    /* Лобби этой игры разбиваем ДО вопроса о высадке, и вопрос задаём по своему
       лобби. Раньше careerLandingPick раскладывал всё поле этапа (в Плей-Ине 520
       команд, 11 лобби), а делилось оно потом случайно: цель контеста попадала
       к тебе примерно раз из 11, и «на коробке трое» превращалось в одного.
       Чужие лобби раскладываются тем же алгоритмом, каждое отдельно, по 50 команд,
       как в дивизионном кубке. */
    let gameLobbies=null, myLobby=null;
    CC_SEATS_REMIX=false;
    if(opts.lobbySize){
      const pool=teams.filter(t=>!(opts.stopOnWin && t.gotVR));
      const shuffled=pool.slice();
      for(let i=shuffled.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]; }
      /* ЛОББИ ПО ОЧКАМ, как в турнирах Фортнайта. Первая игра — жребий, дальше
         Epic сажает вместе тех, у кого похожий счёт: лидеры играют друг с
         другом, а тот, кого три игры подряд убивали на высадке, попадает в
         лобби таких же — и там своя игра на двадцать килов. Его переписка с
         игроком (страница «bags 13.09»): «by the 3rd or 4th game I was supposed
         to get a win with 10 or 20 kills to get back on track» — «there's no
         variation in points like in Fortnite; I'll think about this mechanic».
         Раньше лобби каждой игры были чистым жребием, и восьмидесятка, слившая
         три игры, четвёртую играла в той же комнате с лидерами.

         Сортировка по очкам с размытием на CC_LOBBY_MIX от разброса счёта:
         очередь Epic не режет строго по таблице, соседние лобби смешиваются.
         Одно лобби на всё поле (дивизионный кубок, финалы) — ничего не меняет:
         разбивать нечего. */
      if(g>0 && shuffled.length>opts.lobbySize){
        let lo=Infinity, hi=-Infinity;
        shuffled.forEach(t=>{ const p=t[ptsKey]||0; if(p<lo) lo=p; if(p>hi) hi=p; });
        const mix=(hi-lo)*CC_LOBBY_MIX;
        const key=new Map(shuffled.map(t=>[t, (t[ptsKey]||0)+(Math.random()-0.5)*mix]));
        shuffled.sort((a,b)=>key.get(b)-key.get(a));
      }
      gameLobbies=[...splitIntoLobbies(shuffled, opts.lobbySize)];
      /* Двое в одной сотне (Solo Series в команде): кого разбросало по другим
         лобби, меняется местами с последним ботом из лобби первого. Один и тот
         же шаг с обеих сторон — расклад у двоих один. */
      if(opts.together && opts.together.length>1) ccLobbiesTogether(gameLobbies, opts.together);
      myLobby=gameLobbies.find(l=>l.some(t=>t.isYou))||null;
      CC_SEATS_REMIX=gameLobbies.length>1;
      // Жетон этапа в книге: разошёлся он — красная строка назовёт его на #1.
      ccMpMark('lob~'+String(CC_DROP_STAGE||'').replace(/[|,]/g,'/'));
    }
    /* Лобби с людьми этой игры: в общей комнате гонки — каждое, куда жребий посадил человека
       (см. ccRaceSplitLobbies), иначе только своё. Дроп и матч у них идут в порядке жребия. */
    /* ДВОЕ В ОДНОЙ СОТНЕ (opts.together, соло в команде): выигравший игру хита выходит из пула (stopOnWin), и лобби
       напарника у него было «чужим» — считалось одним куском, без вопросов напарника, а у самого напарника тем же
       движком с остановками. С этой игры таблицы у двоих разъезжались (командный год 20.10: хиты Solo Series 17.01 и
       Solo Reload 14.11 — 3.5 тысячи бросков против 270). Лобби напарника — тоже лобби с человеком. */
    const pairLobbies=!!(gameLobbies && opts.together && opts.together.length>1 && ccMpLock());
    const humanLobbies=(gameLobbies && (ccRaceSplitLobbies() || pairLobbies))
      ? gameLobbies.filter(l=>l.some(t=>t.isYou||t.isRival||(pairLobbies && t.isMate))) : (myLobby ? [myLobby] : []);
    if(typeof CC_RACE_DBG!=='undefined' && CC_RACE_DBG && gameLobbies) CC_RACE_DBG.split=humanLobbies.length+'/'+gameLobbies.length;
    /* Стиль игры — на КАЖДУЮ игру карьеры, а не только туда, где спрашивают высадку.
       5.10, игрок (Notion «05»): «started a career in 2025 and it won't let me select it… only
       lets me do that in FNCS». Первый раунд капов — раздача без вопроса, careerLandingPick
       там не зовётся, и «кейить» молча не работал. Тут ставится всем вечерам; где вопрос
       есть, careerLandingPick поставит то же самое.
       5.10 вечером: «пусть перед каждой игрой везде» — стиль спрашивается своим вопросом здесь, перед
       каждой игрой (ccStyleAskGame); в команде и в гонке — через ccMpChoose, одинаково у всех. */
    // Менеджер: «Симулировать» и просмотр чужого капа — без вопросов, и без этого тоже (8.10).
    const mgrQuiet=(typeof MGR_SIM_MODE!=='undefined' && MGR_SIM_MODE) || (typeof MGR_WATCH!=='undefined' && MGR_WATCH);
    if(CAREER_RUN){ CC_GAME_PICKS={}; CC_GAME_OPTS={}; }
    if(CAREER_RUN && !mgrQuiet && g===0 && typeof CAREER!=='undefined' && CAREER && CAREER.career){
      if(replay && ZoneReplay.whole) ZoneReplay.whole(replay);
      try{ await ccCoachPlanShow(); }catch(e){ CC_COACH_PLAN=null; }
    }
    // Черты ботов (ccTraitApply) — в любом вечере карьеры, и в «Симулировать» тоже: это их игра, а не вопрос тебе.
    if(CAREER_RUN && typeof ccTraitApply==='function') teams.forEach(ccTraitApply);
    if(CAREER_RUN && !mgrQuiet && typeof ccStyleAskGame==='function' && typeof CAREER!=='undefined' && CAREER && CAREER.career){
      // Команды людей без вопроса (в общем вечере их стиль приходит ответом) — сперва по проводу.
      teams.forEach(t=>{ if(t && !t.isYou && (t.isRival || t.isMate)){ t._styleGame=null; ccApplyPlayStyle(t); } });
      // Вопрос лежит на острове (CC_RUN_MAP) — остров целиком, а не последний круг прошлой игры.
      if(replay && ZoneReplay.whole && !(skipAnimation && !(typeof ccMpLock==='function' && ccMpLock()))) ZoneReplay.whole(replay);   // под скипом вопросов не видно — остаётся кадр прошлой игры
      await ccStyleAskGame(teams);
    }
    if(typeof opts.dropEachGame==='function'){
      // Спрашивают, глядя на остров, а не на последний круг прошлой игры:
      // карта возвращается к целому виду до вопроса. См. ZoneReplay.whole.
      if(replay && ZoneReplay.whole && !(skipAnimation && !(typeof ccMpLock==='function' && ccMpLock()))) ZoneReplay.whole(replay);
      const dropped=new Set();
      let fresh=null;
      if(humanLobbies.length>1 || (humanLobbies.length===1 && humanLobbies[0]!==myLobby)){
        for(const l of humanLobbies){
          const f=await opts.dropEachGame(g+1, l);
          ccMpMark('drop', l);
          if(f){ dropped.add(l); if(l===myLobby) fresh=f; }
        }
      } else {
        fresh=await opts.dropEachGame(g+1, myLobby);
        ccMpMark('drop', myLobby||teams);
        if(fresh) dropped.add(myLobby);
      }
      if(fresh) zoneGroups=fresh;
      /* Точек высадки на карте боя нет (его слово 19.11: «во время начала симуляции прямоугольники на заднем фоне»): карта
         высадок — окном перед первой игрой этапа (ccDropOverlay), а карта боя остаётся чистой. ccRunDropsDraw не зовётся. */
      /* Чужие лобби — своими комнатами. Раньше им хватало общей раздачи, но
         своей у них теперь нет: вопрос разложил только твоё. Каждое лобби
         садится на остров отдельно, как садится твоё.

         Только если ТВОЁ вообще садилось. Опены дропа не спрашивают
         (dropEachGame там возвращает null), и раскладывать одни лишь чужие
         лобби значило бы: у всех коробки есть, а у тебя нет — и остров под
         тобой пустой.

         Опен без вопроса садит всех, и тебя тоже, той же раздачей: без коробок
         движок считал сотню соло без высадки, и к первой зоне оставалось
         тридцать с лишним живых. */
      if(gameLobbies) gameLobbies.forEach(l=>{
        if(!dropped.has(l)) buildBotLandingAssignment(l, ccLobbyMine(l) ? undefined : {noBook:true});
      });
    } else if(gameLobbies){
      /* Раунд без вопроса о высадке (первый раунд Victory/Cash Cup): лобби, где не сидит
         никто, садится той же раздачей — без неё к первой зоне оставалось ~57 из сотни. */
      // Со второй игры лобби пересобраны, а точки прошлой игры у команд остались — раздаём заново.
      /* В ЛОКСТЕПЕ каждое лобби первой игры садится заново (в этой ветке вопроса о высадке нет): точка у бота могла остаться с прошлого вечера (объекты
         команд живут дольше вечера), и у клиента с другой историей (LAN или Evaluation 18.12) такое лобби
         пропускалось — боты сидели на старых местах, вечер расходился (прогон 2026, 20.10: Duos Victory Cup 5.01). */
      const lockFresh=(typeof ccMpLock==="function" && ccMpLock());
      gameLobbies.forEach(l=>{ if(g>0 || !l.some(t=>t.landingZone) || lockFresh) buildBotLandingAssignment(l, ccLobbyMine(l) ? undefined : {noBook:true}); });
    }

    CC_BUS_G=g;   // маршрут этой игры (ccBusRoute): по нему считается, кто сел первым
    // Автобус: пролёт и прыжки на свои точки, перед игрой, на целом острове (ccBusIntro).
    if(typeof CAREER_RUN!=='undefined' && CAREER_RUN && replay && replay.wrap && !skipAnimation && !careerSimOn()
       && !(typeof CC_FF!=='undefined' && CC_FF) && !(typeof ccMpLock==='function' && ccMpLock())){
      try{ if(ZoneReplay.whole) ZoneReplay.whole(replay); await ccBusIntro(replay.wrap, myLobby||teams, g); }catch(e){}
    }
    // Resolve this game's landing scraps: for each zone with 2+ teams,
    // a fresh power-weighted mini-fight decides one survivor — everyone
    // else in that zone is dead before the game's main battle even starts,
    // guaranteed bottom placement and 0 kills for this game specifically.
    // Stage played in reshuffled lobbies: each game is its own set of smaller
    // matches, but the table above stays cumulative for the whole stage.
    /* A stage played in lobbies, which is every career event: a field of 150
       is three matches of 50 and the table above them stays cumulative.

       Your own lobby is played on the map. It used to be that none of them
       were: this branch simulated every lobby and `continue`d, and the whole
       replay — the island, the circles, your own dot, stopping the moment you
       die — sat below it in the branch no career event ever reached. The map
       mounted beside the table and then watched eleven games go past without
       drawing one of them.

       Only yours can be drawn, because there is one map and three matches. The
       other lobbies are settled the way they always were, in the same tick. */
    if(opts.lobbySize){
      // Жеребьёвка этой игры уже прошла — выше, до вопроса о высадке.
      const lobbies=gameLobbies||[];
      // The one to watch. A lobby of four dots is not worth a replay, which is
      // what REPLAY_MIN_SQUADS is for on the other path too.
      /* В командном вечере своё лобби идёт своим путём и под пропуском.
         Пропуск обнулял эту строку, и лобби уходило в ветку lobby!==mine (одним куском через simulateGame,
         без остановок). У двоих выходили разные вечера: tools/check-mp-seed.js при одном сиде дал
         11 решений против 33 и две разные таблицы.
         Поэтому в команде путь один, пропуск только мотает кадры (isSkipped), а ccChoiceBox отвечает сам,
         одинаково у обоих. Одиночная карьера без изменений. */
      const mine = (replay && (ccMpLock() || !skipAnimation) && myLobby &&
                    myLobby.length>=REPLAY_MIN_SQUADS) ? myLobby : null;
      const score=(order)=>{
        order.forEach((t,i)=>{
          const place=i+1;
          let elims=t._elims||0;
          if(squadKillDampen) elims=Math.max(0, Math.round(elims*squadKillDampen));
          const gamePts=pointsFn(place)+ccKillPts(elims, killMult);
          t[ptsKey]+=gamePts; t[elimsKey]+=elims;
          t[logKey].push({game:g+1, place, elims, pts:gamePts, elimPts:ccKillPts(elims, killMult), label:thresholdLabel(place), feed:t._feed});
          if(CAREER_RUN && t.isYou) ccEveningRecord(t, g+1, place, elims, gamePts, order.length);
          // Матчевая статистика вечера — здесь же: живой показ копит её наравне с
          // быстрым счётом, иначе доска лидеров после сыгранного вечера пуста.
          accumulateMatchStats(t, place, order.length, pointsFn(place), ccKillPts(elims, killMult));
          // Only where a win ends your stage is a win a qualification, and only
          // then does it earn the first pick next time — see byQualOrder.
          if(place===1){ t.gotVR=true; t.wins++; if(opts.stopOnWin) t.qualByWin=true; }
        });
      };
      // Skipping used to freeze here for seconds: sleep() returns straight away
      // under skip, and a real division is a hundred lobbies a game — eleven
      // games of them ran in one tick with nothing painted. The same time-based
      // yield the quiet path uses hands the thread back, and a real timeout
      // rather than a resolved promise, because the browser will not paint
      // between microtasks. Abandonment is read the way sleep() reads it — the
      // generation captured here against the counter — not runIsCurrent(),
      // which is startRun's view and stale for a career, whose runs never pass
      // through startRun.
      const yieldGen=runGeneration;
      let lastYield=performance.now();
      // Комната делится на лобби каждую игру, и высадка в каждом своя: с кем
      // ты сидишь в коробке сегодня — вопрос жеребьёвки. Поэтому и стычки
      // считаются по лобби, а не по всему полю. См. creditLandingFights.
      /* СВОЁ ЛОББИ — ПЕРВЫМ (вне онлайна). В большом капе (2470 дуо, ~50 лобби) лобби до своего считались до показа
         матча — десятки задач по 50–70 мс на глазах у игрока, пока на карте уже стоит высадка (его слово 20.10:
         «симуляция карты подлагивает»; трасса по сезонам под эмуляцией телефона — 90–125 таких задач за 40 с во всех
         годах с открытыми капами). Теперь своё лобби показывается сразу, а чужие досчитываются после. В локстепе (команда,
         гонка) порядок общий: свой у каждого свой, и общий поток бросков разошёлся бы. */
      const lobbyOrder=(mine && !(typeof ccMpLock==='function' && ccMpLock()))
        ? [mine].concat(lobbies.filter(l=>l!==mine)) : lobbies;
      /* Скип: своё лобби без показа, но на карте — его кадр (см. ниже, его Notion 29.10 «скип в соло — нет кругов»). */
      const skipRec=lobby=>!mine && skipAnimation && replay && myLobby && lobby===myLobby && !(typeof ccMpLock==='function' && ccMpLock());
      const skipShow=()=>{ const tl=LAST_ZONE_TIMELINE; if(!tl || !tl.length) return; const at=tl.findIndex(f=>f && (f.zone||0)>=6);
        try{ ZoneReplay.show(replay, tl[at>=0 ? at : Math.floor(tl.length*0.5)], {labels:replayLabels, roster:LAST_ZONE_ROSTER}); }catch(e){} };
      for(const lobby of lobbyOrder){
        if(dropOnMap) creditLandingContests(lobby);
        /* Лобби с человеком, которое не показывается (чужое — или своё, когда карты нет): тот же
           движок с остановками, что и у своего на карте, только без показа. Иначе у соперника его
           лобби считалось бы по вопросам, а у меня одним куском — и таблицы разошлись бы. */
        if(lobby!==mine && humanLobbies.length && humanLobbies.indexOf(lobby)>=0 &&
           opts.choices && dropOnMap && useZoneSim(lobby) && playSelfOn()){
          const info={lobbySquads:lobby.length, lobbyPlayers:lobby.reduce((s,t)=>s+((t.squad&&t.squad.length)||1), 0)};
          const rec=skipRec(lobby); if(rec) RECORD_NEXT_ZONE_GAME=true;
          const order=await playGameWithChoices(lobby, info, {note:function(){}, show:null, map:null});
          RECORD_NEXT_ZONE_GAME=false;
          if(rec) skipShow();
          LAST_ZONE_TIMELINE=[];
          if(dropOnMap) creditLandingFights(lobby);
          score(order);
          ccMpMark('riv');
          if(performance.now()-lastYield > 24){
            await ccMpIdle(ccYield());
            if(yieldGen!==runGeneration) throw RUN_ABANDONED;
            lastYield=performance.now();
          }
          continue;
        }
        if(lobby!==mine){
          /* ЛОББИ БЕЗ ЛЮДЕЙ В ЛОКСТЕПЕ — СВОЙ ГЕНЕРАТОР (сид вечера · игра · номер лобби), не общий поток.
             Общий поток к этому месту у двоих мог разойтись на десятки тысяч бросков, не меняя таблицы своего
             лобби (показ, повтор, ответы — командный год 20.10: Duos Victory Cup 12.01, r0 79199 против 85508
             перед первым чужим лобби), и чужие лобби расходились, а за ними весь вечер. Сверка игры смотрит
             только своё лобби — она это пропускала. Теперь чужие лобби у всех одни, как бы ни шёл свой. */
          const lockRng=(typeof ccMpLock==='function' && ccMpLock() && CC_MP_SEED)
            ? careerRng(ccHashStr('oth|'+CC_MP_SEED+'|'+(CC_MP_GAME||g)+'|'+lobbies.indexOf(lobby))) : null;
          const mr0=Math.random;
          if(lockRng) Math.random=lockRng;
          /* Скип — своё лобби тоже без показа, но карта не пустая (его Notion 29.10: «во время соло скип странный —
             таблица обновляется, а кругов нет»). В большом поле (Solo Series: 4940 игроков, ~50 лобби) скип идёт
             секунды на игру, и всё это время на карте стоял пустой остров между играми. Теперь своё лобби пишется
             (запись кадров броски не тратит — исход тот же) и на карту ложится поздний кадр игры: круг и кто жив. */
          const recMine=skipRec(lobby);
          if(recMine) RECORD_NEXT_ZONE_GAME=true;
          let off;
          /* Перемотка календаря (22.11, его «не ждать по несколько минут»): лобби без людей - быстрой моделью чужих
             регионов (CC_WORLD_FAST, сверена 16.10 с полным движком: связь силы и места 0.624 против 0.625). Своё лобби,
             лобби с людьми, командная карьера и гонка - полным движком, как было. CC_FF_FAST_OFF - выключатель для сверки. */
          const ffFast=((typeof CC_FF!=='undefined' && !!CC_FF) || (typeof MGR_FF_BUSY!=='undefined' && MGR_FF_BUSY)) && !CC_FF_FAST_OFF && !lockRng && !recMine &&
                       lobby!==myLobby && humanLobbies.indexOf(lobby)<0 && ccFfFastSize(lobby) &&
                       !(typeof ccMpOn==='function' && ccMpOn()) && !(typeof ccRaceFfOn==='function' && ccRaceFfOn());
          const wf0=CC_WORLD_FAST, wn0=CC_WORLD_FAST_NOISE, we0=CC_WORLD_FAST_EXP;
          if(ffFast){ CC_WORLD_FAST=true; CC_WORLD_FAST_NOISE=CC_FF_FAST_NOISE; CC_WORLD_FAST_EXP=CC_FF_FAST_EXP; }
          try{
            off=simulateGame(lobby);
            if(dropOnMap) creditLandingFights(lobby);
          } finally { if(lockRng) Math.random=mr0; RECORD_NEXT_ZONE_GAME=false; CC_WORLD_FAST=wf0; CC_WORLD_FAST_NOISE=wn0; CC_WORLD_FAST_EXP=we0; }
          if(recMine){ skipShow(); LAST_ZONE_TIMELINE=[]; }
          if(ffFast) ccFfFastElims(off);
          score(off);
          ccMpMark('oth');
          if(performance.now()-lastYield > 24){
            await ccMpIdle(ccYield());
            if(yieldGen!==runGeneration) throw RUN_ABANDONED;
            lastYield=performance.now();
          }
          continue;
        }
        ZoneReplay.clearFeed(replay);
        RECORD_NEXT_ZONE_GAME=true;
        const lobbyInfo={lobbySquads: lobby.length,
          lobbyPlayers: lobby.reduce((s,t)=>s+((t.squad&&t.squad.length)||1), 0)};
        /* Вечер карьеры спрашивает игрока по ходу игры — лут после второй зоны
           и высокую землю на восьмой (opts.choices ставят карьерные ранеры).
           Всё остальное — драфт, чужие лобби, перемотка — считается как
           считалось, одним куском. */
        lastOrder=''; lastMove=0;
        const youOnMap = opts.stopOnYourDeath ? lobby.findIndex(t=>t.isYou) : -1;
        // Смотрящий не отвечает на вопросы по ходу игры: лут и высокая земля
        // считаются как в чужих лобби, одним куском. См. playSelfOn.
        const withChoices=(opts.choices && dropOnMap && useZoneSim(lobby) && playSelfOn());
        /* Показ куска матча. Кадры приходят такими, какие есть на эту секунду,
           а показывается только то, что новое, — так вопрос застаёт игрока
           посреди игры, а не перед ней. Возвращает true, если смотреть больше
           нечего: игрок погиб и остаток матча его не касается. */
        let shownTo=0, cutShort=false;
        const showPart=async frames=>{
          if(cutShort) return true;
          const part=frames.slice(shownTo);
          shownTo=frames.length;
          if(!part.length) return false;
          cutShort=await playReplayGuarded(replay, part,
            {frameMs: (typeof opts.frameMs==='function' ? opts.frameMs() : opts.frameMs) || 90, labels: replayLabels, roster: LAST_ZONE_ROSTER,
             isSkipped: () => skipAnimation,
             // Fortnite Manager: показ кончается, когда на карте не осталось ни одной команды клуба (уровни «ключевые»/«расширенный»).
             stopWhen: (typeof opts.replayStop==='function') ? opts.replayStop(lobby)
                     : youOnMap < 0 ? null
                                    : f => { const d=f.dots[youOnMap]; return !!d && !d.alive; },
             onFrame: f => onZoneFrame(lobby, f)});
          return cutShort;
        };
        /* Вечер карьеры спрашивает игрока по ходу игры — лут после второй зоны
           и высокую землю на восьмой (opts.choices ставят карьерные ранеры).
           Всё остальное — драфт, чужие лобби, перемотка — считается как
           считалось, одним куском и показывается одним куском. */
        const order=withChoices
          ? await playGameWithChoices(lobby, lobbyInfo,
              {note:t=>ZoneReplay.note(replay, [ccAskTag(t)]), show:showPart,
               // Сама карта: вопрос ложится на неё, а не под неё.
               map:(replay && replay.wrap) || null})
          : simulateGame(lobby, lobbyInfo);
        ccMpMark('own');
        // Своё лобби считает стычки там же, где и чужие, — до реплея: кадры
        // рисуют то, что уже случилось, а не решают его.
        if(dropOnMap) creditLandingFights(lobby);
        // Матч без вопросов показывается как показывался: целиком, после счёта.
        if(!withChoices && LAST_ZONE_TIMELINE.length) await showPart(LAST_ZONE_TIMELINE);
        /* Матч доигрывается в таблице и после твоей смерти.
           stopOnYourDeath обрывает показ, onZoneFrame больше не зовётся, и таблица замирала до конца матча (tools/check-live-row.js).
           Кадры уже лежат в LAST_ZONE_TIMELINE, поэтому остаток гоним через тот же onZoneFrame без карты и без пауз, иначе чужие киллы и места падают одним скачком в конце. */
        /* И не одним скачком: остаток гонится ступенями, чтобы числа доехали
           на глазах. Восемь шагов примерно на секунду — этого хватает, чтобы
           было видно, что игра идёт, и мало, чтобы ждать её после смерти. */
        if(cutShort && LAST_ZONE_TIMELINE.length>shownTo){
          const tail=LAST_ZONE_TIMELINE.length-shownTo;
          const steps=skipAnimation ? 1 : Math.min(8, tail);
          const per=Math.ceil(tail/steps);
          for(let i=shownTo;i<LAST_ZONE_TIMELINE.length;i++){
            onZoneFrame(lobby, LAST_ZONE_TIMELINE[i]);
            if(!skipAnimation && (i-shownTo+1)%per===0) await sleep(110);
          }
        }
        LAST_ZONE_TIMELINE=[];
        liveScore=null;
        score(order);
        ccMpMark('score');
        const mineIdx=order.findIndex(t=>t.isYou);
        // Named only when you watched the game out. After your own death the
        // card stands between you and the next of eleven games.
        if(!cutShort)
          await showVictoryRoyale(replay.wrap, liveLabel, g+1, numGames, order[0],
                                  mineIdx < 0 ? 0 : mineIdx + 1, order.length);
        ccMpMark('vr');
      }
      if(maxGap) compressLeaderGap(teams, ptsKey, elimsKey, maxGap, logKey);
      await sleep(mine ? 380 : 320);
      animatedRerender();
      await sleep(mine ? 260 : 220);
      ccMpMark('end');
      /* Путь лобби кончает игру здесь, минуя хвост цикла: первая правка
         (30 августа) стояла только внизу и финал Парижа всё равно шёл до
         пятнадцатой — отзыв: «15 игр опять прошло, и в конце ток на 12
         показал». Правило матч-поинта читается на обоих выходах из игры. */
      if(typeof opts.stopWhen==='function' && opts.stopWhen(teams, g+1)) break;
      continue;
    }

    // Off the map: settle the contested spots before the game starts and hand
    // the round-based model the survivors.
    //
    // On the map this whole block is skipped — contestedGroups is empty there —
    // and the whole lobby plays the whole game. Every game used to run through
    // here: a power-weighted coin flip, the losers deleted, and the map then
    // opening on a game that had already lost a sixth of its players before the
    // first frame. The fight was real; it was just happening somewhere nobody
    // could watch.
    const eliminatedAtStart=[];
    const landingBonusElims=new Map();
    const contestedGroups = contestedNow();
    contestedGroups.forEach(group=>{
      // Fought one rival at a time, on the same capped odds the picker quotes —
      // landingWinChanceVs, so what the spot promised is what the spot pays. It
      // used to be a single pow³ draw across the whole group, which let power
      // decide a contested spot outright; off the spawn nobody has anything yet,
      // so the better squad is favoured and never safe. Clearing three squads
      // still means winning three times, which is what makes a busy spot a risk.
      const order=group.slice();
      for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
      let winner=order[0];
      for(let i=1;i<order.length;i++){
        const rival=order[i];
        if(Math.random()>=landingWinChanceVs(winner, rival)) winner=rival;
      }
      landingBonusElims.set(winner, (group.length-1)*2);
      winner.landingWins++;
      if(group.length>=3) winner.multiKillLandingWins++;
      group.forEach(t=>{ if(t!==winner){ eliminatedAtStart.push(t); t.landingLosses++; } });
    });
    for(let i=eliminatedAtStart.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [eliminatedAtStart[i],eliminatedAtStart[j]]=[eliminatedAtStart[j],eliminatedAtStart[i]]; }
    const eliminatedSet=new Set(eliminatedAtStart);

    const activeField=teams.filter(t=>!(opts.stopOnWin && t.gotVR));

    // How often a squad had company on its drop, whether or not anybody died
    // there. Wins and losses only count fights that ended in a wipe, and since
    // the drop was moved onto the map that is about one contested spot in ten —
    // real, and measured against the telemetry, but it left the record on the
    // standings reading "1-0" after twelve games and saying nothing about the
    // eleven other times you landed on somebody and both of you walked away.
    creditLandingContests(activeField);

    const survivors=activeField.filter(t=>!eliminatedSet.has(t));
    eliminatedAtStart.forEach(t=>{ t._elims=0; t._feed=[L().landingFightLost]; });
    if(survivors.length<2){ await sleep(240); animatedRerender(); await sleep(160);
      if(typeof opts.stopWhen==='function' && opts.stopWhen(teams, g+1)) break;
      continue; }
    // Heats stop a squad's stage on a Victory Royale, so by the end of one the
    // lobby can be down to a handful — and a map replay of two dots wandering an
    // island is not worth watching. Below this the game still runs on the map,
    // it just is not played back.
    if(replay && !skipAnimation && survivors.length >= REPLAY_MIN_SQUADS) RECORD_NEXT_ZONE_GAME = true;
    const lobbyInfo={lobbySquads: activeField.length,
      lobbyPlayers: activeField.reduce((s,t)=>s+((t.squad&&t.squad.length)||1), 0)};
    /* Мид/лейт вопросы в драфте тоже. Ветка с вопросами (playGameWithChoices) выше, под opts.lobbySize, а его
       ставит только карьера (поле 150 делится на лобби по 50). У драфта поле = лобби, поэтому матч шёл сюда одним
       куском и opts.choices ничего не делал.
       Условия те же, что в карьере: матч реально идёт на карте, показ по кускам и выбрано «Играть». */
    const youOnMap = opts.stopOnYourDeath ? survivors.findIndex(t => t.isYou) : -1;
    const withChoices = !!(opts.choices && dropOnMap && useZoneSim(survivors)
      && playSelfOn() && replay && !skipAnimation
      && survivors.length >= REPLAY_MIN_SQUADS);
    let shownTo=0, cutShort=false;
    /* Показ куска матча: кадры на эту секунду, проигрывается только новое —
       так вопрос застаёт посреди игры, а не стоит перед ней. Тот же showPart,
       что у карьеры. */
    const showPart=async frames=>{
      if(cutShort) return true;
      const part=frames.slice(shownTo);
      shownTo=frames.length;
      if(!part.length) return false;
      cutShort=await playReplayGuarded(replay, part,
        {frameMs: 90, labels: replayLabels, roster: LAST_ZONE_ROSTER,
         isSkipped: () => skipAnimation,
         stopWhen: youOnMap < 0 ? null
                                : f => { const d=f.dots[youOnMap]; return !!d && !d.alive; },
         onFrame: f => onZoneFrame(survivors, f)});
      return cutShort;
    };
    if(withChoices) ZoneReplay.clearFeed(replay);
    const played = withChoices
      ? await playGameWithChoices(survivors, lobbyInfo,
          {note:t=>ZoneReplay.note(replay, [ccAskTag(t)]), show:showPart,
           map:(replay && replay.wrap) || null})
      : simulateGame(survivors, lobbyInfo);
    const order=[...played, ...eliminatedAtStart];

    // On the map: who won and who lost their drop, read back off the game
    // instead of decided before it. A squad the engine flagged as dropping out
    // died inside that first window, and the squad named as its cause won that
    // fight. A squad the storm took on the way down is not a landing loss, and
    // falls out here on its own — there is no team by that name.
    //
    // Кто именно выиграл высадку, нужно и строке журнала ниже (landingOutcome),
    // поэтому счёт возвращает свою карту победителей. Когда счёт переехал в
    // creditLandingFights, локальная landingWins исчезла вместе с ним, а
    // ссылка на неё осталась — и каждая вторая игра драфта падала
    // ReferenceError'ом уже после первой (карьера играет другой веткой, лобби
    // по пятьдесят, и потому молчала).
    const landingWins = dropOnMap ? creditLandingFights(survivors) : new Map();
    // Off the map the win was already counted above, before the game; only the
    // feed line has to wait, because the game rewrites _feed.
    landingBonusElims.forEach((n,winner)=>{ winner._feed=[L().landingFightWon, ...(winner._feed||[])]; });
    if(replay && (withChoices || LAST_ZONE_TIMELINE.length)){
      // The squads on the map, in the order the frames index them: the same
      // list the engine was handed, which on the map is the whole lobby.
      const shown = survivors;
      lastOrder=''; lastMove=0;
      // Матч с вопросами уже показан по кускам — второй раз его не проигрывают.
      // Всё остальное ниже (счёт, плашка победителя, уборка) общее для обоих.
      if(!withChoices){
      // Cleared here rather than inside play(), so the feed is empty before the
      // first frame draws instead of being wiped the instant play() starts.
      // The landing kills write themselves into it from the frames now.
      ZoneReplay.clearFeed(replay);
      cutShort = await playReplayGuarded(replay, LAST_ZONE_TIMELINE,
        {frameMs: 90, labels: replayLabels, roster: LAST_ZONE_ROSTER,
         isSkipped: () => skipAnimation,
         // A career game is watched from one seat. When that seat is empty the
         // rest of the game is somebody else's, so the map stops on the frame
         // you died in and the run moves to the next game. Nothing about the
         // result depends on this: the timeline was generated whole and `order`
         // is already scored, so stopping early only stops the drawing.
         stopWhen: youOnMap < 0 ? null
                                : f => { const d = f.dots[youOnMap]; return !!d && !d.alive; },
         onFrame: f => onZoneFrame(shown, f)});
      }
      LAST_ZONE_TIMELINE = [];
      // The real points land next, from the engine's own result. Dropping the
      // view first means the table is never showing two answers at once.
      liveScore=null;
      // Then the card the broadcast puts up: who actually won the game. The map
      // empties in the last seconds and it is easy to miss which of the last
      // two arrows was still standing, so the winner is named before the table
      // moves on. sleep() carries it, so a skipped stage passes straight
      // through without stopping.
      // Your own finish, read off the same order the table is about to be
      // scored from, so the card and the standings can never disagree.
      //
      // Not shown when the map was cut short by your own death: it names the
      // winner of a game you stopped watching, and it stands between you and
      // the next game, which is the one thing a run of eleven of them cannot
      // afford. Winning still reaches it — a squad that is alive at the end is
      // a squad the replay played to the end.
      const mineIdx = order.findIndex(t => t.isYou);
      if(!cutShort)
        await showVictoryRoyale(replay.wrap, liveLabel, g+1, numGames, order[0],
                                mineIdx < 0 ? 0 : mineIdx + 1, order.length);
    }
    order.forEach((t,i)=>{
      const place=i+1;
      let elims=t._elims + (landingBonusElims.get(t)||0);
      if(squadKillDampen) elims=Math.max(0, Math.round(elims*squadKillDampen));
      const gamePts=pointsFn(place)+ccKillPts(elims, killMult);
      t[ptsKey]+=gamePts; t[elimsKey]+=elims;
      const landingOutcome = (landingWins.has(t) || landingBonusElims.has(t)) ? 'won'
                           : ((dropOnMap ? t._droppedOut : eliminatedSet.has(t)) ? 'lost' : null);
      t[logKey].push({game:g+1, place, elims, pts:gamePts, elimPts:ccKillPts(elims, killMult), label:thresholdLabel(place), feed:t._feed, landingOutcome});
      // Матчевая статистика вечера — здесь же: живой показ копит её наравне с
      // быстрым счётом, иначе доска лидеров после сыгранного вечера пуста.
      accumulateMatchStats(t, place, order.length, pointsFn(place), ccKillPts(elims, killMult));
      // As above: a win is a qualification only where it ends the stage.
      if(place===1){ t.gotVR=true; t.wins++; if(opts.stopOnWin) t.qualByWin=true; }
    });
    if(maxGap) compressLeaderGap(teams, ptsKey, elimsKey, maxGap, logKey);
    await sleep(380);
    animatedRerender();
    await sleep(260);
    /* Вечер, который кончается раньше сетки: матч-поинт финала Reload
       Championship. Отзыв: «я выиграл игру после 350 поинтов,
       но кап не закончился, просто дальше симуляция» — правило применялось
       задним числом (rcMatchPoint), а игры после чемпиона всё равно игрались и
       показывались. Решение читается из журналов команд, у двоих оно одно. */
    if(typeof opts.stopWhen==='function' && opts.stopWhen(teams, g+1)) break;
  }

  titleEl.innerHTML=L().finalsLiveDoneLabel(liveLabel);
  clearLandingPow(teams);
  // Layout goes back to one column (table full width) in the same breath as
  // the map itself coming down, so the table is what the scroll below lands on.
  if(replay){ stageLive.classList.remove('stage-live-playing'); ZoneReplay.unmount(replay); }
  // Skipping the animation is not the same as not wanting the result. The run
  // used to tear this card down before anybody could read it: sleep() returns
  // instantly while the skip flag is set, and the card is removed on the next
  // line, so the table the player skipped to reach flashed past and was gone.
  // A skipped stage now stops on its own standings and waits to be let go.
  if(skipAnimation){
    // Skipping asks for the result, so the result is where it stops. The
    // finished card stays on the page and the run carries straight on to what
    // comes next. It used to stop here on a Continue button, and the complaint
    // was fair: nothing said another press was needed, so the run looked stuck
    // on a table it had already drawn.
    //
    // The card is deliberately not removed. That removal is what made skipping
    // useless in the first place: sleep() returns instantly while the skip flag
    // is set, so the standings flashed past before anybody could read them.
    shell.scrollIntoView({block:'start', behavior:'smooth'});
    // Left on the page, so its ids have to go. The next stage builds a card
    // with the same ones - finalsLiveBody, finalsLiveTitle - and
    // getElementById answers with the first match, so a kept card would quietly
    // swallow the following stage rows and leave that stage looking at an empty
    // table. The card is finished; nothing needs to find it by id again.
    shell.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  } else {
    await sleep(500);
    shell.remove();
  }
  // Этап кончился — карты больше нет, и следующий вопрос о высадке (он
  // задаётся до входа сюда) не должен целиться в чужой остров.
  ccStakesClear(teams);   // агрессия ботов по таблице — только на эту сессию
  CC_RUN_MAP=null;
  // Вместе с картой снимается и жетон этапа: следующая комната — новый бросок.
  CC_DROP_STAGE=null;
}

// Real prize money, straight from the Fortnite Tracker payout tables for each
// FNCS 2026 Major 1 regional final and for the Düsseldorf Summit. Values are
// the duo total; each player takes half.
const PRIZE_TABLES={"EU":{"1":120000,"2":80000,"3":60000,"4":50000,"5":40000,"6":30000,"7":25000,"8":20000,"9":18000,"10":16000,"11":14000,"12":12000,"13":10000,"14":8000,"15":6000,"16":5500,"17":5000,"18":4500,"19":4000,"20":3500,"21":3000,"22":3000,"23":3000,"24":3000,"25":3000,"26":3000,"27":3000,"28":3000,"29":3000,"30":3000,"31":2000,"32":2000,"33":2000,"34":2000,"35":2000,"36":2000,"37":2000,"38":2000,"39":2000,"40":2000,"41":1000,"42":1000,"43":1000,"44":1000,"45":1000,"46":1000,"47":1000,"48":1000,"49":1000,"50":1000},"NAC":{"1":100000,"2":50000,"3":40000,"4":30000,"5":25000,"6":20000,"7":16000,"8":14000,"9":12000,"10":10000,"11":9000,"12":8000,"13":7000,"14":6000,"15":5000,"16":4500,"17":4000,"18":3500,"19":3000,"20":2500,"21":2000,"22":2000,"23":2000,"24":2000,"25":2000,"26":2000,"27":2000,"28":2000,"29":2000,"30":2000,"31":1500,"32":1500,"33":1500,"34":1500,"35":1500,"36":1500,"37":1500,"38":1500,"39":1500,"40":1500,"41":750,"42":750,"43":750,"44":750,"45":750,"46":750,"47":750,"48":750,"49":750,"50":750},"NAW":{"1":30000,"2":15000,"3":10000,"4":8000,"5":6000,"6":5000,"7":4000,"8":3500,"9":3000,"10":2500,"11":2000,"12":2000,"13":2000,"14":2000,"15":2000,"16":2000,"17":2000,"18":2000,"19":2000,"20":2000,"21":1500,"22":1500,"23":1500,"24":1500,"25":1500,"26":1500,"27":1500,"28":1500,"29":1500,"30":1500,"31":1000,"32":1000,"33":1000,"34":1000,"35":1000,"36":1000,"37":1000,"38":1000,"39":1000,"40":1000,"41":500,"42":500,"43":500,"44":500,"45":500,"46":500,"47":500,"48":500,"49":500,"50":500},"BR":{"1":30000,"2":15000,"3":10000,"4":8000,"5":6000,"6":5000,"7":4000,"8":3500,"9":3000,"10":2500,"11":2000,"12":2000,"13":2000,"14":2000,"15":2000,"16":2000,"17":2000,"18":2000,"19":2000,"20":2000,"21":1500,"22":1500,"23":1500,"24":1500,"25":1500,"26":1500,"27":1500,"28":1500,"29":1500,"30":1500,"31":1000,"32":1000,"33":1000,"34":1000,"35":1000,"36":1000,"37":1000,"38":1000,"39":1000,"40":1000,"41":500,"42":500,"43":500,"44":500,"45":500,"46":500,"47":500,"48":500,"49":500,"50":500},"ASIA":{"1":16000,"2":12000,"3":8000,"4":6000,"5":4000,"6":2000,"7":1800,"8":1600,"9":1400,"10":1200,"11":1000,"12":1000,"13":1000,"14":1000,"15":1000,"16":1000,"17":1000,"18":1000,"19":1000,"20":1000,"21":500,"22":500,"23":500,"24":500,"25":500,"26":500,"27":500,"28":500,"29":500,"30":500,"31":400,"32":400,"33":400,"34":400,"35":400,"36":400,"37":400,"38":400,"39":400,"40":400,"41":200,"42":200,"43":200,"44":200,"45":200,"46":200,"47":200,"48":200,"49":200,"50":200},"ME":{"1":16000,"2":12000,"3":8000,"4":6000,"5":4000,"6":2000,"7":1800,"8":1600,"9":1400,"10":1200,"11":1000,"12":1000,"13":1000,"14":1000,"15":1000,"16":1000,"17":1000,"18":1000,"19":1000,"20":1000,"21":500,"22":500,"23":500,"24":500,"25":500,"26":500,"27":500,"28":500,"29":500,"30":500,"31":400,"32":400,"33":400,"34":400,"35":400,"36":400,"37":400,"38":400,"39":400,"40":400,"41":200,"42":200,"43":200,"44":200,"45":200,"46":200,"47":200,"48":200,"49":200,"50":200},"OCE":{"1":16000,"2":12000,"3":8000,"4":6000,"5":4000,"6":2000,"7":1800,"8":1600,"9":1400,"10":1200,"11":1000,"12":1000,"13":1000,"14":1000,"15":1000,"16":1000,"17":1000,"18":1000,"19":1000,"20":1000,"21":500,"22":500,"23":500,"24":500,"25":500,"26":500,"27":500,"28":500,"29":500,"30":500,"31":400,"32":400,"33":400,"34":400,"35":400,"36":400,"37":400,"38":400,"39":400,"40":400,"41":200,"42":200,"43":200,"44":200,"45":200,"46":200,"47":200,"48":200,"49":200,"50":200},"SUMMIT":{"1":250000,"2":150000,"3":100000,"4":70000,"5":60000,"6":50000,"7":40000,"8":35000,"9":30000,"10":25000,"11":20000,"12":19000,"13":18000,"14":17000,"15":16000,"16":15000,"17":14000,"18":13000,"19":12000,"20":11000,"21":10000,"22":10000,"23":10000,"24":10000,"25":10000,"26":9000,"27":9000,"28":9000,"29":9000,"30":9000,"31":8000,"32":8000,"33":8000,"34":8000,"35":8000,"36":7000,"37":7000,"38":7000,"39":7000,"40":7000,"41":6000,"42":6000,"43":6000,"44":6000,"45":6000,"46":6000,"47":6000,"48":6000,"49":6000,"50":6000,"51":5000,"52":5000,"53":5000,"54":5000,"55":5000,"56":4000,"57":4000,"58":4000,"59":4000,"60":4000,"61":4000,"62":4000,"63":4000,"64":4000,"65":4000,"66":4000,"67":4000,"68":4000,"69":4000,"70":4000,"71":4000,"72":4000,"73":4000,"74":4000}};
// Major 2 keeps its own payout table, taken from that event's finals page.
//
// The Global Championship Last Chance and the Major 1 Second Chance Qualifier
// both pay, and both pay differently in every region — Epic's FNCS 2026 rules,
// Attachment C. The Last Chance is why a duo that is already qualified still
// turns up: the money is real and their seat rolling down costs them nothing.
//
// The single table that used to sit here was Europe's, halved — the per-player
// share of a team prize, in a file where every other table is the team total.
// So the Last Chance line on the earnings card paid a quarter of what it should
// have, and paid Oceania what Europe won.
const GCLC_PRIZES_BY_REGION={
  EU:  {"1":40000,"2":25000,"3":20000,"4":16000,"5":12000,"6":10000,"7":8000,"8":6000,"9":5500,"10":5000,"11":4500,"12":4000,"13":3500,"14":3000,"15":2500,"16":2000,"17":1800,"18":1600,"19":1400,"20":1200,"21":1000,"22":1000,"23":1000,"24":1000,"25":1000,"26":1000,"27":1000,"28":1000,"29":1000,"30":1000,"31":600,"32":600,"33":600,"34":600,"35":600,"36":600,"37":600,"38":600,"39":600,"40":600,"41":400,"42":400,"43":400,"44":400,"45":400,"46":400,"47":400,"48":400,"49":400,"50":400},
  NAC: {"1":30000,"2":20000,"3":16000,"4":12000,"5":10000,"6":8000,"7":6000,"8":5000,"9":4000,"10":3000,"11":2500,"12":2000,"13":1800,"14":1600,"15":1400,"16":1200,"17":1000,"18":900,"19":800,"20":700,"21":600,"22":600,"23":600,"24":600,"25":600,"26":600,"27":600,"28":600,"29":600,"30":600,"31":400,"32":400,"33":400,"34":400,"35":400,"36":400,"37":400,"38":400,"39":400,"40":400,"41":300,"42":300,"43":300,"44":300,"45":300,"46":300,"47":300,"48":300,"49":300,"50":300},
  NAW: {"1":10000,"2":5000,"3":3000,"4":2500,"5":2000,"6":1600,"7":1400,"8":1200,"9":1000,"10":800,"11":600,"12":600,"13":600,"14":600,"15":600,"16":500,"17":500,"18":500,"19":500,"20":500,"21":400,"22":400,"23":400,"24":400,"25":400,"26":400,"27":400,"28":400,"29":400,"30":400,"31":300,"32":300,"33":300,"34":300,"35":300,"36":300,"37":300,"38":300,"39":300,"40":300},
  BR:  {"1":10000,"2":5000,"3":3000,"4":2500,"5":2000,"6":1600,"7":1400,"8":1200,"9":1000,"10":800,"11":600,"12":600,"13":600,"14":600,"15":600,"16":500,"17":500,"18":500,"19":500,"20":500,"21":400,"22":400,"23":400,"24":400,"25":400,"26":400,"27":400,"28":400,"29":400,"30":400,"31":300,"32":300,"33":300,"34":300,"35":300,"36":300,"37":300,"38":300,"39":300,"40":300},
  ASIA:{"1":5000,"2":4000,"3":3000,"4":2000,"5":1600,"6":1400,"7":1200,"8":1000,"9":800,"10":600,"11":400,"12":400,"13":400,"14":400,"15":400,"16":400,"17":400,"18":400,"19":400,"20":400,"21":300,"22":300,"23":300,"24":300,"25":300,"26":300,"27":300,"28":300,"29":300,"30":300,"31":200,"32":200,"33":200,"34":200,"35":200,"36":200,"37":200,"38":200,"39":200,"40":200},
  ME:  {"1":5000,"2":4000,"3":3000,"4":2000,"5":1600,"6":1400,"7":1200,"8":1000,"9":800,"10":600,"11":400,"12":400,"13":400,"14":400,"15":400,"16":400,"17":400,"18":400,"19":400,"20":400,"21":300,"22":300,"23":300,"24":300,"25":300,"26":300,"27":300,"28":300,"29":300,"30":300,"31":200,"32":200,"33":200,"34":200,"35":200,"36":200,"37":200,"38":200,"39":200,"40":200},
  OCE: {"1":5000,"2":4000,"3":3000,"4":2000,"5":1600,"6":1400,"7":1200,"8":1000,"9":800,"10":600,"11":400,"12":400,"13":400,"14":400,"15":400,"16":400,"17":400,"18":400,"19":400,"20":400,"21":300,"22":300,"23":300,"24":300,"25":300,"26":300,"27":300,"28":300,"29":300,"30":300,"31":200,"32":200,"33":200,"34":200,"35":200,"36":200,"37":200,"38":200,"39":200,"40":200}
};
// Major 1 Second Chance Qualifier Finals, same Attachment. A flatter ladder —
// it is a route to the LAN rather than a payday — but it is not nothing, and the
// stage was paying nothing at all.
const SCQ_PRIZES_BY_REGION={
  EU:  {"1":1000,"2":1000,"3":1000,"4":1000,"5":1000,"6":1000,"7":1000,"8":1000,"9":1000,"10":1000,"11":800,"12":800,"13":800,"14":800,"15":800,"16":600,"17":600,"18":600,"19":600,"20":600,"21":400,"22":400,"23":400,"24":400,"25":400,"26":400,"27":400,"28":400,"29":400,"30":400,"31":200,"32":200,"33":200,"34":200,"35":200,"36":200,"37":200,"38":200,"39":200,"40":200},
  NAC: {"1":1000,"2":1000,"3":1000,"4":1000,"5":1000,"6":1000,"7":1000,"8":1000,"9":1000,"10":1000,"11":800,"12":800,"13":800,"14":800,"15":800,"16":600,"17":600,"18":600,"19":600,"20":600,"21":400,"22":400,"23":400,"24":400,"25":400,"26":400,"27":400,"28":400,"29":400,"30":400,"31":200,"32":200,"33":200,"34":200,"35":200,"36":200,"37":200,"38":200,"39":200,"40":200},
  NAW: {"1":1000,"2":1000,"3":1000,"4":600,"5":400,"6":400,"7":400,"8":400,"9":400,"10":400,"11":200,"12":200,"13":200,"14":200,"15":200,"16":200,"17":200,"18":200,"19":200,"20":200,"21":100,"22":100,"23":100,"24":100,"25":100,"26":100,"27":100,"28":100,"29":100,"30":100,"31":100,"32":100,"33":100,"34":100,"35":100,"36":100,"37":100,"38":100,"39":100,"40":100},
  BR:  {"1":1000,"2":1000,"3":1000,"4":600,"5":400,"6":400,"7":400,"8":400,"9":400,"10":400,"11":200,"12":200,"13":200,"14":200,"15":200,"16":200,"17":200,"18":200,"19":200,"20":200,"21":100,"22":100,"23":100,"24":100,"25":100,"26":100,"27":100,"28":100,"29":100,"30":100,"31":100,"32":100,"33":100,"34":100,"35":100,"36":100,"37":100,"38":100,"39":100,"40":100},
  ASIA:{"1":1000,"2":1000,"3":1000,"4":600,"5":400,"6":400,"7":400,"8":400,"9":400,"10":400,"11":200,"12":200,"13":200,"14":200,"15":200,"16":200,"17":200,"18":200,"19":200,"20":200,"21":100,"22":100,"23":100,"24":100,"25":100,"26":100,"27":100,"28":100,"29":100,"30":100,"31":100,"32":100,"33":100,"34":100,"35":100,"36":100,"37":100,"38":100,"39":100,"40":100},
  ME:  {"1":1000,"2":1000,"3":1000,"4":600,"5":400,"6":400,"7":400,"8":400,"9":400,"10":400,"11":200,"12":200,"13":200,"14":200,"15":200,"16":200,"17":200,"18":200,"19":200,"20":200,"21":100,"22":100,"23":100,"24":100,"25":100,"26":100,"27":100,"28":100,"29":100,"30":100,"31":100,"32":100,"33":100,"34":100,"35":100,"36":100,"37":100,"38":100,"39":100,"40":100},
  OCE: {"1":1000,"2":1000,"3":1000,"4":600,"5":400,"6":400,"7":400,"8":400,"9":400,"10":400,"11":200,"12":200,"13":200,"14":200,"15":200,"16":200,"17":200,"18":200,"19":200,"20":200,"21":100,"22":100,"23":100,"24":100,"25":100,"26":100,"27":100,"28":100,"29":100,"30":100,"31":100,"32":100,"33":100,"34":100,"35":100,"36":100,"37":100,"38":100,"39":100,"40":100}
};
// Both of those are regional events, so the table follows the squad's own region.
function myPrizeRegion(){
  return ccHomeRegion();
}
const PRIZE_TABLES_M2={"EU":M2_EU_PRIZES,"NAC":M2_NAC_PRIZES,"NAW":M2_NAW_PRIZES,"BR":M2_BR_PRIZES,"ASIA":M2_ASIA_PRIZES,"ME":M2_ME_PRIZES,"OCE":M2_OCE_PRIZES};

const PRIZE_POOL_TOTAL={"EU":591500,"NAC":412000,"NAW":137000,"BR":137000,"ASIA":75000,"ME":75000,"OCE":75000,"SUMMIT":1296000};

// The 2025 season paid on its own tables and they are nothing like 2026's: a
// trio Grand Final in Europe paid $180,000 for the win against the duo Major's
// $120,000, only the top 25 of 33 were paid at all, and the thin regions stop
// paying at 15th. Straight out of Epic's FNCS 2025 rules, Attachment C "Event
// Prizes" — one table per region, the same one at each of the three Majors,
// which is what Liquipedia's Major 1 and Major 2 pages independently declare.
// tools/build-2025-prizes.js writes these literals and refuses to emit any of
// them unless every region adds up to the pool its pages declare.
//
// GC2025_PRIZES is the Lyon Grand Finals: 33 places, $2,001,000, which is the
// figure Epic published and exactly what these 33 numbers add up to.
const GC2025_PRIZES={"1":450000,"2":300000,"3":225000,"4":180000,"5":135000,"6":90000,"7":75000,"8":60000,"9":45000,"10":36000,"11":33000,"12":30000,"13":27000,"14":27000,"15":24000,"16":24000,"17":21000,"18":21000,"19":18000,"20":18000,"21":15000,"22":15000,"23":15000,"24":15000,"25":15000,"26":12000,"27":12000,"28":12000,"29":12000,"30":12000,"31":9000,"32":9000,"33":9000};
// Antwerp, 26-27 September 2026: 50 duos, $2,000,000. Epic's own payout table, read off
// the event after it was played (Tracker, epicgames_MannekenPis_Official, PayoutTable of the
// cumulative leaderboard; tools/measured/gc2026-antwerp.json). Epic pays per player; these
// are per duo, both halves together — the same unit the 2024 stand-in used.
const GC2026_PRIZES={"1":400000,"2":240000,"3":160000,"4":120000,"5":100000,"6":80000,"7":70000,"8":60000,"9":50000,"10":40000,"11":38000,"12":36000,"13":34000,"14":32000,"15":30000,"16":28000,"17":26000,"18":24000,"19":22000,"20":20000,"21":18000,"22":18000,"23":18000,"24":18000,"25":18000,"26":16000,"27":16000,"28":16000,"29":16000,"30":16000,"31":14000,"32":14000,"33":14000,"34":14000,"35":14000,"36":12000,"37":12000,"38":12000,"39":12000,"40":12000,"41":10000,"42":10000,"43":10000,"44":10000,"45":10000,"46":8000,"47":8000,"48":8000,"49":8000,"50":8000};
const P2025_PRIZES={"EU":{"1":180000,"2":120000,"3":81000,"4":60900,"5":47850,"6":34800,"7":34800,"8":34800,"9":34800,"10":34800,"11":17400,"12":17400,"13":17400,"14":17400,"15":17400,"16":8700,"17":8700,"18":8700,"19":8700,"20":8700,"21":4350,"22":4350,"23":4350,"24":4350,"25":4350},"NAC":{"1":180000,"2":76500,"3":51000,"4":35700,"5":28050,"6":20400,"7":20400,"8":20400,"9":20400,"10":20400,"11":10200,"12":10200,"13":10200,"14":10200,"15":10200,"16":5100,"17":5100,"18":5100,"19":5100,"20":5100,"21":2550,"22":2550,"23":2550,"24":2550,"25":2550},"NAW":{"1":45000,"2":27000,"3":18000,"4":15300,"5":11700,"6":7200,"7":7200,"8":7200,"9":7200,"10":7200,"11":3600,"12":3600,"13":3600,"14":3600,"15":3600,"16":1800,"17":1800,"18":1800,"19":1800,"20":1800},"BR":{"1":45000,"2":27000,"3":18000,"4":15300,"5":11700,"6":7200,"7":7200,"8":7200,"9":7200,"10":7200,"11":3600,"12":3600,"13":3600,"14":3600,"15":3600,"16":1800,"17":1800,"18":1800,"19":1800,"20":1800},"ASIA":{"1":27000,"2":13500,"3":9000,"4":7650,"5":5850,"6":3600,"7":3600,"8":3600,"9":3600,"10":3600,"11":1800,"12":1800,"13":1800,"14":1800,"15":1800},"ME":{"1":27000,"2":13500,"3":9000,"4":7650,"5":5850,"6":3600,"7":3600,"8":3600,"9":3600,"10":3600,"11":1800,"12":1800,"13":1800,"14":1800,"15":1800},"OCE":{"1":27000,"2":13500,"3":9000,"4":7650,"5":5850,"6":3600,"7":3600,"8":3600,"9":3600,"10":3600,"11":1800,"12":1800,"13":1800,"14":1800,"15":1800}};
const PRIZE_TABLES_2025={t1:P2025_PRIZES, t2:P2025_PRIZES, t3:P2025_PRIZES};

function prizeTableFor(table){
  /* A trio season pays what trios were actually paid: P2025_PRIZES per region
     for a Major and Lyon's own 33 places for Antwerp, a published table rather than
     a conversion of the duo one. Reload Elite Series and the Summit were never played
     in trios, so they keep the 2026 table over a smaller field (invented, the only
     such money in a career); they fall through since P2025_PRIZES has no key for them.
     Gated on CAREER_RUN, not the save: draft mode shares this function. */
  if(CAREER_RUN && careerSquadSize()===3){
    if(table==='GC2026' || table==='GC2025') return GC2025_PRIZES;
    if(P2025_PRIZES[table]) return P2025_PRIZES[table];
  }
  if(table==='GCLC') return GCLC_PRIZES_BY_REGION[myPrizeRegion()] || GCLC_PRIZES_BY_REGION.EU;
  if(table==='SCQ')  return SCQ_PRIZES_BY_REGION[myPrizeRegion()] || SCQ_PRIZES_BY_REGION.EU;
  if(table==='GC2025') return GC2025_PRIZES;
  if(table==='GC2024') return GC2024_PRIZES;
  // 2024-й в драфте: окно финала своего региона (Tracker, на игрока — на дуо вдвое). См. DRAFT_M24.
  if(/^f\d$/.test(String(CARD_SET||'')) && CC_MAJOR_PAY_2024[table==='NAW' ? 'NAC' : table]) return pay24DraftTable(table);
  // Antwerp, on the 2024 split — see GC2026_PRIZES. Still guarded on the table
  // being non-empty, so emptying it goes back to paying nothing rather than
  // paying zeroes.
  if(table==='GC2026') return Object.keys(GC2026_PRIZES).length ? GC2026_PRIZES : null;
  if(PRIZE_TABLES_2025[CARD_SET]){
    // A 2025 place is never paid off a 2026 table. A region whose table has not
    // been read yet pays nothing and says so, rather than borrowing numbers from
    // a different season and a different team size.
    return PRIZE_TABLES_2025[CARD_SET][table] || null;
  }
  if(CARD_SET==='m2' && PRIZE_TABLES_M2[table]) return PRIZE_TABLES_M2[table];
  return PRIZE_TABLES[table] || null;
}
function prizeFor(table, rank){
  // The career pays off its own functions rather than the draft's named tables
  // — wfPrize, majorPrize, rcPrize — so a function is a prize table too.
  if(typeof table==='function') return table(rank)||0;
  const t=prizeTableFor(table);
  return t ? (t[String(rank)] || 0) : 0;
}
function fmtMoney(v){ return '$'+Math.round(v).toLocaleString(LANG==='ru'?'ru-RU':'en-US'); }
/* Приз у ника: таблицы платят на команду, а Fortnite пишет долю игрока — «$320 each»
   (его правка 29.09 «не пишет призы each»). Соло — без подписи. */
function stPrizeHTML(total, size){
  if(!total) return '';
  const n=Math.max(1, size||1);
  /* Обе суммы рядом (его слово 29.09: «пиши две суммы — всего и each рядом»): на команду и на игрока. */
  return '<span class="st-prize">'+fmtMoney(total)+(n>1 ? ' · '+fmtMoney(total/n)+' '+esc(L().stPrizeEach) : '')+'</span>';
}

// A single earnings card: regional final, the Summit, and the squad total.
function renderPrizeCard(lines, total){
  const container=document.getElementById('majorStages');
  const card=document.createElement('div');
  card.className='stage-card prize-card';
  card.innerHTML=`
    <div class="prize-glow"></div>
    <h4>${L().prizeTitle}</h4>
    <div class="prize-total">${fmtMoney(total)}</div>
    <div class="prize-sub">${L().prizePerPlayer(fmtMoney(total/(squadSize||2)))}</div>
    <div class="prize-rows">
      ${lines.map(l=>`<div class="prize-row">
        <span>${l.label}</span>
        <b>${fmtMoney(l.amount)}</b>
      </div>`).join('')}
    </div>`;
  container.appendChild(card);
  card.scrollIntoView({block:'center', behavior:'smooth'});
  return card;
}

// The whole run on one card: where the squad finished at every stage it played,
// and what the run paid. A tournament used to end with the last stage card and a
// two-line earnings box that only knew about the regional final and the Summit,
// so a player had to scroll back through the page to answer "how did I do" and
// could not answer "what did I earn" at all.
function renderRunSummaryCard(){
  if(!runPlaces.length) return null;
  const total=runEarnings.reduce((s,l)=>s+l.amount,0);
  // Under the final placement, not among the stage cards — it is the summary of
  // everything above it.
  const container=document.getElementById('runSummary') || document.getElementById('majorStages');
  container.innerHTML='';
  const card=document.createElement('div');
  card.className='stage-card';
  const placeRows=runPlaces.map(p=>`<tr class="lobby-row">
      <td>${esc(p.title)}</td>
      <td class="num"><b style="color:${p.passed?'var(--accent)':'var(--ink-dim)'};">#${p.rank}</b>
        <span style="color:var(--ink-dimmer);">/${p.total}</span></td>
      <td class="num" style="color:var(--ink-dim);">${p.points}</td></tr>`).join('');
  const moneyRows=runEarnings.map(l=>`<div class="prize-row">
      <span>${l.label}</span><b>${fmtMoney(l.amount)}</b></div>`).join('');
  // The LAN line sits above the money, because it is the answer to what the run
  // was for and the money is what it paid on the way.
  const lan = runLanSeat ? `<div class="prize-row" style="margin-top:10px;padding:8px 10px;border-radius:8px;
      background:${runLanSeat.got?'rgba(0,176,144,.12)':'rgba(255,59,59,.10)'};
      border:1px solid ${runLanSeat.got?'rgba(0,176,144,.45)':'rgba(255,59,59,.35)'};">
      <span><b style="color:${runLanSeat.got?'var(--accent)':'var(--danger)'};">
        ${runLanSeat.got?L().lanSeatWon:L().lanSeatMissed}</b>
        <span style="color:var(--ink-dim);"> · ${esc(runLanSeat.event)}</span>
        ${runLanSeat.detail?`<div style="color:var(--ink-dimmer);font-size:11px;margin-top:2px;">${esc(runLanSeat.detail)}</div>`:''}
      </span></div>` : '';
  card.innerHTML=`<h4>${L().runSummaryTitle}</h4>
    <div class="lobby-wrap" style="margin-top:6px;">
      <table class="lobby-table">
        <thead><tr><th>${L().runSummaryStage}</th><th class="num">${L().placeHeader}</th><th class="num">${L().ptsHeader}</th></tr></thead>
        <tbody>${placeRows}</tbody>
      </table>
    </div>
    ${lan}
    <div style="margin-top:14px;font-size:12px;font-weight:800;text-transform:uppercase;
      letter-spacing:.06em;color:var(--accent);">${L().runSummaryEarned}</div>
    ${total>0
      ? `<div class="prize-rows" style="margin-left:0;">${moneyRows}
         <div class="prize-row" style="border-top:1px solid var(--line);margin-top:6px;padding-top:8px;">
           <span><b>${L().totalWord}</b></span><b>${fmtMoney(total)}</b></div></div>
         <div class="prize-sub" style="text-align:left;">${L().prizePerPlayer(fmtMoney(total/(squadSize||2)))}</div>`
      : `<div class="stage-detail">${L().runSummaryNoEarnings}</div>`}`;
  container.appendChild(card);
  return card;
}

/* The live table is the stage while it plays; the stage card is the stage when
   it is over, and it draws its own standings. A skipped stage keeps its live
   card on the page so the player can read what they skipped to — which is
   right until the card that replaces it appears, and then the page carries the
   same table twice. So building a stage card takes the live one down. */
function ccDropLiveCard(){
  document.querySelectorAll('#majorStages .stage-card').forEach(c=>{
    if(c.querySelector('.lobby-live')) c.remove();
  });
}
/* Дата вечера — на самой плашке.

   Просьба зрителя: «добавить плашку даты в день игры, так как на
   самой плашке когда турик, не показывает день недели и дату». Полоска недели
   их показывает, но внутри забега её на экране нет, и вечер повисает вне
   календаря.

   Только в карьере: у драфта своей даты нет — там карточки этапов те же, а
   числа за ними никакого. */
function ccStageWhen(){
  if(typeof CAREER==='undefined' || !CAREER || !CAREER.career) return '';
  const iso=(typeof careerToday==='function') ? careerToday() : '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||''))) return '';
  const d=new Date(iso+'T00:00:00Z');
  // calDows начинается с понедельника, getUTCDay — с воскресенья.
  const dow=L().calDows[(d.getUTCDay()+6)%7];
  return dow+' · '+ccDayLabel(iso);
}
