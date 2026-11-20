/*@@PART js/career/loot-bus-endgame.js@@*/
/* СУНДУКОВ НА ТОЧКЕ — КАК В ИГРЕ (отзыв: «сундуков на локациях, как в
   настоящем фортнайте, как на fortnite gg»). У коробки поле chests — сколько сундуков
   стоит в ней на самом деле: s42/s42solo считаны по точкам fortnite.gg (патч 42.03,
   tools/build-fgg-chests.js, кадр сведён по 30 локациям с расхождением ≤1.7 %), у
   остальных островов — с инфобоксов локаций на вики (build-2025-zone-loot.js). Такая
   коробка отдаёт своё число как есть (Battlewoods с окрестностями — 117, пустой
   берег — 0); коробка без счёта — по луту, как ниже. Открывает же отряд не всё:
   CC_CHESTS_OPEN_PER_PLAYER на игрока до первой зоны (ccSiteOpen) — РЕШЕНИЕ, не замер
   (в JSON реплеев Tracker сундуков нет); в пак идут только открытые. */
const CC_CHESTS_OPEN_PER_PLAYER=12;
// Чей счёт сундуков у острова — CC_CHESTS_SRC рядом с useLandingSet; подпись в подсказке точки.
const ccSiteSrc=()=>CC_CHESTS_SRC[(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '']||'';
const ccSiteReal=zone=>!!(zone && zone.chests!=null);
function ccSiteOpen(n){
  const cap=CC_CHESTS_OPEN_PER_PLAYER*Math.max(1, (typeof squadSize==='number' && squadSize) || 1);
  return Math.max(1, Math.min(Math.round(n), cap));
}
/* СУНДУКИ СТОЯТ НЕ ВСЕ (его «сундуки не 100% с какого-то сезона», 13.11). Вики Fortnite, Chest: v14.00 (27.08.2020) —
   спавн обычного сундука 50 %, v28.00 (3.12.2023) — 40 %. Счёт fortnite.gg и инфобоксов вики — это места сундуков, поэтому
   стоит из них доля спавна на дату. До v14.00 вики доли не называет — там как было, все места. Дата — день карьеры, вне карьеры
   — остров (2019/m* без доли, j/k/e* 50 %, f/t/s/r* 40 %). Комнате то же правило (ccRoomSite зовёт эту же функцию). */
const CC_CHEST_SPAWN=[['2023-12-03', 0.4], ['2020-08-27', 0.5]];
function ccChestSpawnRate(){
  let d='';
  try{ if(typeof CAREER!=='undefined' && CAREER && CAREER.career && typeof careerToday==='function') d=String(careerToday()||''); }catch(e){ d=''; }
  if(!d){ const k=String((typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '');
    d=/^[ftsr]/.test(k) ? '2024-01-01' : /^[jke]/.test(k) ? '2021-06-01' : '2019-01-01'; }
  for(const [from, r] of CC_CHEST_SPAWN) if(d>=from) return r;
  return 1;
}
// Сколько точек списка (плоский [x,y,…] в процентах картинки) внутри коробки.
function ccLrCount(list, z){ let n=0; if(list && z) for(let i=0;i+1<list.length;i+=2){ const x=list[i], y=list[i+1]; if(x>=z.x && x<=z.x+z.w && y>=z.y && y<=z.y+z.h) n++; } return n; }
function ccSiteChests(zone, share){
  share = share==null ? 1 : share;
  if(ccSiteReal(zone)){
    // У fortnite.gg часть сундуков с золотой обводкой — «100% spawn rate»: они стоят всегда, доля спавна только у остальных.
    const src=(typeof ccLrSrc==='function') ? ccLrSrc((typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '') : null;
    const g=src && src.g ? Math.min(zone.chests, ccLrCount(src.g, zone)) : 0;
    return Math.max(0, Math.round((g+(zone.chests-g)*ccChestSpawnRate())*share));
  }
  let n=CC_CHESTS_POI;
  const zones=(typeof ALL_LANDING_ZONES!=='undefined') ? ALL_LANDING_ZONES : [];
  const loots=zones.map(z=>z.loot).filter(v=>v>0).sort((a,b)=>a-b);
  if(zone && loots.length && zone.loot!=null){
    const med=loots[Math.floor(loots.length/2)];
    n = zone.loot>0 ? Math.max(CC_CHESTS_MIN, Math.min(CC_CHESTS_MAX, Math.round(CC_CHESTS_POI*zone.loot/med))) : CC_CHESTS_MIN;
  }
  return Math.max(1, Math.round(n*share));
}
/* Класс ствола из сундука — таблица Hypex по Chapter 2 Season 5 (Sportskeeda,
   «data miner reveals how chest loot pool works»): AR 43 %, дробовик 22 %,
   ПП 14 %, пистолет 11 %, снайперка 10 %. Единственная опубликованная таблица
   классов; для Ch7 Epic её не даёт. Классов, которых в пуле сезона нет,
   в броске не бывает — веса перенормируются на те, что есть. Раньше класс
   выпадал равновероятно по списку имён пула: пистолетов было 25 %, снайперка
   шла винтовкой. */
const CC_CHEST_CLASS={rifle:0.43, shotgun:0.22, smg:0.14, pistol:0.11, sniper:0.10};
// Что из пула расходников не хилка и не мувмент — ключи, удочки, сигналка, золотая
// рыба. В слот хилки из сундука не идёт (отзыв: «epic карт не надо»).
// И рыба: она ловится удочкой, а не лежит в сундуках (тестер, 16.09: «в инвентаре постоянно
// рыба, хотелось бы, чтобы хил настоящий был»). Хилки из сундука — зелья, аптечки, бинты, чаги.
const CC_CHEST_NOT_HEAL=['Epic Vault Keycard','Vault Key','Fishing Rod','Pro Fishing Rod','Harpoon Gun','Flare Gun','Bass Boost','Mythic Goldfish',
                         'Flopper','Spicy Fish','Slurpfish','Shield Fish','Jellyfish','Midas Flopper','Small Fry','Small Fries','Hop Flopper','Thermal Fish','Zero Point Fish','Vendetta Flopper','Stink Flopper','Cuddle Fish'];
const ccIsHealItem=x=>x && CC_MOVE_ITEMS.indexOf(x.name)<0 && CC_CHEST_NOT_HEAL.indexOf(x.name)<0;
function ccChestClass(rng, weapons){
  const have={}; weapons.forEach(w=>{ have[w.icon]=1; });
  const keys=Object.keys(CC_CHEST_CLASS).filter(k=>have[k]);
  if(!keys.length) return null;
  const tot=keys.reduce((a,k)=>a+CC_CHEST_CLASS[k], 0);
  let r=rng()*tot;
  for(const k of keys){ r-=CC_CHEST_CLASS[k]; if(r<0) return k; }
  return keys[keys.length-1];
}
// Преимущество первого сундука в стычке на высадке — его числа «+1 +3 +7», в
// процентных пунктах к шансу (CC_SITE_EDGE_PP за очко).
const CC_LOOT_EDGE={common:0, uncommon:1, rare:3, epic:7, legendary:7, mythic:7};
const CC_SITE_EDGE_PP=0.02;
function ccChestRarity(rng){
  const r=rng(); let acc=0;
  for(const k of RARITY_LADDER){ acc+=CC_CHEST_RARITY[k]||0; if(r<acc) return k; }
  return 'uncommon';
}
// Один сундук: сначала класс (CC_CHEST_CLASS), потом редкость (CC_CHEST_RARITY);
// ствол этого класса этой редкости, если такой редкости у класса нет — ближайшая
// ниже, если класс пуст совсем — любой ствол пула. С шансом CC_CHEST_CONSUMABLE —
// расходник.
function ccChestRoll(rng, set){
  const pool=ccLootPool(set);
  const cls=ccChestClass(rng, pool.weapons);
  const inCls=cls ? pool.weapons.filter(w=>w.icon===cls) : pool.weapons;
  const rar=ccChestRarity(rng);
  let cands=inCls.filter(w=>w.rarity===rar);
  for(let i=RARITY_LADDER.indexOf(rar)-1; !cands.length && i>=0; i--) cands=inCls.filter(w=>w.rarity===RARITY_LADDER[i]);
  if(!cands.length) cands=inCls.length ? inCls : pool.weapons;
  const weapon=cands[Math.floor(rng()*cands.length)];
  const hs=pool.heals.filter(x=>ccIsHealItem(x) || CC_MOVE_ITEMS.indexOf(x.name)>=0);
  const cons = rng()<CC_CHEST_CONSUMABLE ? hs[Math.floor(rng()*hs.length)] : null;
  return {weapon, cons};
}
// Пак по правилу «два ствола разных классов, две хилки, мувмент» — из того, что выпало.
/* МЕТА ПРО ПО СЕЗОНАМ (29.10, его «посмотри лут метовый у про игроков в инвентаре, чтоб игроки и боты брали нужное»).
   r — автоматы, s — дробовики, m — передвижение; порядок — что про берёт первым, если лежит и то и другое.
   Только сезоны, где мету удалось подтвердить (HIGH/MED в tools/measured/meta-loadouts.md); остальные острова — как было,
   по редкости. Мета берёт верх над стволом на ступень редче; что вытеснено, уходит в dropped — сила пака (ccPackPow)
   считает его как раньше, поэтому мета меняет руки, а не силу. */
const CC_META_BY_SET={"h1":{"r":["Assault Rifle","Heavy Assault Rifle","Tactical Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun","Tactical Shotgun"],"m":["Rift-To-Go","Shockwave Grenade"]},"h3":{"r":["Assault Rifle","Heavy Assault Rifle","Suppressed Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun","Tactical Shotgun"],"m":["Shockwave Grenade","Junk Rift"]},"h4":{"r":["Assault Rifle","Burst Assault Rifle","Heavy Assault Rifle"],"s":["Pump Shotgun","Tactical Shotgun"],"m":[]},"i1":{"r":["Assault Rifle","Burst Assault Rifle"],"s":["Pump Shotgun","Tactical Shotgun"],"m":["Crash Pad"]},"i2":{"r":["Assault Rifle","Burst Assault Rifle"],"s":["Charge Shotgun","Tactical Shotgun"],"m":["Crash Pad"]},"i3":{"r":["Assault Rifle","Burst Assault Rifle","Scoped Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun"],"m":["Shockwave Grenade","Crash Pad","Stark Jetpack"]},"j1":{"r":["Heavy Assault Rifle","Assault Rifle"],"s":["Charge Shotgun","Lever Action Shotgun","Tactical Shotgun"],"m":["Shockwave Grenade"]},"j2":{"r":["Assault Rifle","Primal Rifle","Infantry Rifle","Makeshift Rifle"],"s":["Pump Shotgun","Primal Shotgun","Tactical Shotgun"],"m":["Shockwave Grenade"]},"j3":{"r":["Assault Rifle","Burst Assault Rifle","Heavy Assault Rifle"],"s":["Pump Shotgun","Tactical Shotgun","Lever Action Shotgun"],"m":[]},"j4":{"r":["Combat Assault Rifle","Assault Rifle","Burst Assault Rifle"],"s":["Pump Shotgun","Combat Shotgun","Charge Shotgun"],"m":["Shockwave Launcher"]},"k1":{"r":["MK-Seven Assault Rifle","Ranger Assault Rifle"],"s":["Striker Pump Shotgun","Auto Shotgun","Heavy Shotgun"],"m":[]},"k2":{"r":["MK-Seven Assault Rifle","Striker Burst Rifle","Ranger Assault Rifle"],"s":["Striker Pump Shotgun","Ranger Shotgun"],"m":["Shockwave Grenade","Rift-To-Go"]},"k3":{"r":["Hammer Assault Rifle","Striker Burst Rifle","Ranger Assault Rifle"],"s":["Striker Pump Shotgun","Two-Shot Shotgun"],"m":["Crash Pad"]},"e1":{"r":["Red-Eye Assault Rifle","Assault Rifle","Burst Assault Rifle"],"s":["Thunder Shotgun","Maven Auto Shotgun"],"m":["Shockwave Hammer","Launch Pad"]},"e2":{"r":["Red-Eye Assault Rifle","Havoc Suppressed Assault Rifle"],"s":["Havoc Pump Shotgun","Maven Auto Shotgun","Combat Shotgun"],"m":[]},"f1":{"r":["Nemesis AR","Striker AR","Enforcer AR"],"s":["Hammer Pump Shotgun","Frenzy Auto Shotgun"],"m":["Shockwave Grenade","Crash Pad Jr."]},"f2":{"r":["Nemesis AR","Warforged Assault Rifle","Tactical Assault Rifle"],"s":["Gatekeeper Shotgun","Hammer Pump Shotgun","Frenzy Auto Shotgun"],"m":["Shockwave Grenade"]},"f3":{"r":["Combat Assault Rifle","Enforcer AR","Tactical Assault Rifle"],"s":["Combat Shotgun","Gatekeeper Shotgun","Hammer Pump Shotgun"],"m":["Nitro Fists","Shockwave Grenade","Crash Pad Jr."]},"t1":{"r":["Holo Twister Assault Rifle","Fury Assault Rifle","Ranger Assault Rifle"],"s":["Sentinel Pump Shotgun","Oni Shotgun","Twinfire Auto Shotgun"],"m":["Void Oni Mask","Shockwave Grenade"]}};
function ccProMeta(set){ try{ return CC_META_BY_SET[ccLootSet(set)] || null; }catch(e){ return null; } }
function ccMetaRank(meta, o){
  if(!meta || !o) return 99;
  const l=o.icon==='rifle' ? meta.r : o.icon==='shotgun' ? meta.s : CC_MOVE_ITEMS.indexOf(o.name)>=0 ? meta.m : null;
  const i=l ? l.indexOf(o.name) : -1;
  return i<0 ? 99 : i;
}
// Лучший из списка по мете: метовый, если он не больше чем на ступень редче лучшего по редкости.
function ccMetaBest(list, meta){
  const mod=o=>o ? (RARITY_MOD[o.rarity]||0) : -1;
  if(!list.length) return null;
  const top=list.reduce((a,b)=>mod(b)>mod(a) ? b : a);
  if(!meta) return top;
  const ok=list.filter(o=>ccMetaRank(meta, o)<99 && mod(o)>=mod(top)-1)
    .sort((a,b)=>(ccMetaRank(meta, a)-ccMetaRank(meta, b)) || (mod(b)-mod(a)));
  return ok[0] || top;
}
function ccPackFrom(weapons, cons){
  const mod=o=>o ? (RARITY_MOD[o.rarity]||0) : -1;
  const byMod=(a,b)=>mod(b)-mod(a);
  const ws=weapons.slice().sort(byMod);
  /* Отзыв: «должны быть 2 оружия автомат дробовик». Пара — лучшая винтовка и
     лучший дробовик из выпавшего; нет одного из них — лучший ствол другого класса
     (ПП, пистолет, снайперка); класс один на всех рулонах — второй лучший, что есть. */
  const meta=ccProMeta();
  const best=cls=>ccMetaBest(ws.filter(w=>w.icon===cls), meta);
  let first=best('rifle'), second=best('shotgun');
  // Метовый ствол встал вместо более редкого того же класса — тот в dropped (ccPackPow его считает).
  const pushed=[first, second].filter(Boolean).map(w=>ws.find(o=>o.icon===w.icon && mod(o)>mod(w))).filter(Boolean);
  if(!first || !second){
    first=first||second||ws[0]||null;
    second=(first && ws.find(w=>w!==first && w.icon!==first.icon)) || (first && ws.find(w=>w!==first)) || null;
  }
  if(first && second && mod(second)>mod(first)){ const t=first; first=second; second=t; }
  const moves=cons.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0).sort(byMod);
  const move=ccMetaBest(moves, meta);
  const healsAll=cons.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)<0).sort(byMod);
  /* Две хилки — РАЗНЫЕ, и каждая СТАКОМ (отзыв: «можно стакать хилы, 3 биги
     6 миников»). Сколько нашли, столько и лежит, но не больше стака этой хилки по вики
     (CC_HEAL_KIT): шесть маленьких зелий, три больших, три аптечки. Слотов по-прежнему
     два — это два места в инвентаре, а не два предмета. */
  const cnt={}; const order=[];
  healsAll.forEach(x=>{ if(!cnt[x.name]){ cnt[x.name]={item:x, n:0}; order.push(x.name); } cnt[x.name].n++; });
  const heals=order.slice(0, 2).map(n=>Object.assign({}, cnt[n].item, {n:Math.min(cnt[n].n, ccHealOf(cnt[n].item).stack)}));
  const out={weapons:[first, second].filter(Boolean), heals, move:move||null};
  if(pushed.length) out.dropped=pushed;
  return out;
}
function ccPackFromRolls(rolls){
  const p=ccPackFrom(rolls.map(r=>r.weapon), rolls.map(r=>r.cons).filter(Boolean));
  p.chests=rolls.length; p.first=rolls[0]; p.rolls=rolls;
  return p;
}
function ccChestPack(rng, set, n){
  const rolls=[]; for(let i=0;i<n;i++) rolls.push(ccChestRoll(rng, set));
  return ccPackFloor(ccPackFromRolls(rolls), set, rng);
}
/* ПЯТЬ СЛОТОВ — ПЯТЬ ПРЕДМЕТОВ. Отзыв: «иногда пустой слот есть — будто всегда
   что-то можно положить в инвентарь». Слот пустел, когда сундуков было мало («схватить и ехать»,
   тесная точка), когда в пуле не было передвижения или когда пад улетел в ротации. В игре так не
   бывает: к третьей зоне пять слотов заняты хоть чем-то с пола. Поэтому недостающее добирается
   ПОЛОМ острова — тем же предметом пула, но в его низшей редкости, хилка одной штукой, — и
   помечается floor. Сила пака (ccPackPow) пол не считает: цена быстрого лута и пустого слота
   остаётся той, что решена (−2 за ствол, −1 за хилку, −1 без мувмента), меняется только то, что
   лежит в руках. Порядок добора: передвижение, вторая хилка, третий ствол другого класса, хилка. */
/* ЛУТ ТОЛЬКО УЛУЧШАЕТСЯ. Отзыв: «должен улучшать лут, а не менять». Новый пак (соседняя
   точка на третьей зоне, коробка после ухода с точки) не подменяет руки, а вливается в них:
   ствол того же класса встаёт только если он редже; класса не было — добавляется; хилка того же
   имени — стак растёт до потолка вики, иная — занимает свободное место или место слабейшей, если
   она редже; передвижение — если своего нет или новое редже. Сверх пяти — ccPackFloor режет
   (пол первым). Возвращает НОВЫЙ пак, руки не трогает. */
function ccPackMerge(cur, add, set, rng){   // rng больше не берётся: пол и выбор — своим броском (ccPackRng)
  const mod=o=>o ? (RARITY_MOD[o.rarity]||0) : -1;
  const out={weapons:((cur&&cur.weapons)||[]).slice(), heals:((cur&&cur.heals)||[]).map(h=>Object.assign({}, h)), move:(cur&&cur.move)||null};
  /* Пак помнит, из скольких сундуков он собран, и что из него выпало сверх пяти слотов:
     строка на карте считает сундуки (ccSiteOwn), а сила пака — выброшенное (ccPackPow).
     Слияние их складывает, иначе уход с точки обнулял и то и другое. */
  out.chests=(((cur&&cur.chests)||0)+((add&&add.chests)||0))||undefined;
  out.dropped=((cur&&cur.dropped)||[]).concat((add&&add.dropped)||[]);
  out.first=(cur&&cur.first)||(add&&add.first)||undefined;
  if(!add) return out;
  const meta=ccProMeta(set);
  (add.weapons||[]).forEach(w=>{
    if(!w) return;
    const i=out.weapons.findIndex(o=>o && o.icon===w.icon);
    if(i<0){ out.weapons.push(w); return; }
    const old=out.weapons[i];
    if(w!==old && ccMetaBest([old, w], meta)===w){
      if(!old.floor && mod(old)>mod(w)) out.dropped.push(old);
      out.weapons[i]=w;
    }
  });
  (add.heals||[]).forEach(h=>{
    if(!h) return;
    const same=out.heals.find(o=>o.name===h.name);
    if(same){ same.n=Math.min(ccHealOf(same).stack, (same.n||1)+(h.n||1)); same.floor=same.floor && h.floor; return; }
    if(out.heals.length<2){ out.heals.push(Object.assign({}, h)); return; }
    const weak=out.heals.reduce((a,b)=>(a.floor && !b.floor) ? a : (b.floor && !a.floor) ? b : (mod(a)<=mod(b) ? a : b));
    if(weak.floor || mod(h)>mod(weak)) out.heals[out.heals.indexOf(weak)]=Object.assign({}, h);
  });
  if(add.move && (!out.move || out.move.floor || ccMetaBest([out.move, add.move], meta)===add.move)) out.move=add.move;
  return ccPackFloor(out, set, rng);
}
/* СВОЙ БРОСОК, НЕ ОБЩИЙ. Пол и слияние берут предметы своим PRNG от содержимого пака, а не из
   потока вечера: сколько раз они бросают, зависит от того, чего в паке не хватает, — а не хватает
   у каждой команды своего. Скриншот (вечер разошёлся на игре 2, «table,rolls @ #30
   p3=6022 vs p3=6034»): двенадцать лишних бросков на третьей зоне у одного из двоих. Из общего
   потока здесь не берётся ничего, поэтому счёт бросков у всех одинаков. */
function ccPackRng(pack, salt){
  const key=[...(pack&&pack.weapons||[]), ...(pack&&pack.heals||[]), pack&&pack.move].filter(Boolean)
    .map(o=>String(o.name)+":"+String(o.rarity||"")+(o.n>1?"x"+o.n:"")).join("|");
  return careerRng(ccHashStr("pack|"+(salt||"")+"|"+key));
}
function ccPackFloor(pack, set, rng){
  if(!pack) return pack;
  const r=ccPackRng(pack, "floor"), pool=ccLootPool(set);
  if(!pool) return pack;
  pack.weapons=pack.weapons||[]; pack.heals=pack.heals||[];
  const lowest=list=>{ const by={}; list.forEach(o=>{ const k=o.name; if(!by[k] || RARITY_LADDER.indexOf(o.rarity)<RARITY_LADDER.indexOf(by[k].rarity)) by[k]=o; }); return Object.keys(by).map(k=>by[k]); };
  const guns=lowest(pool.weapons), heals=lowest(pool.heals.filter(ccIsHealItem)), moves=pool.heals.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0);
  const meta=ccProMeta(set);
  const one=list=>{ const m=meta ? list.filter(o=>ccMetaRank(meta, o)<99).sort((a,b)=>ccMetaRank(meta, a)-ccMetaRank(meta, b)) : [];
    return m.length ? m[0] : list[Math.floor(r()*list.length)]; };
  const count=()=>pack.weapons.length+pack.heals.length+(pack.move?1:0);
  /* АВТОМАТ И ДРОБОВИК — ВСЕГДА. Отзыв: «дробовик+автомат должен всегда быть в
     инвентаре». Нет класса в руках — с пола берётся его серый ствол; пара встаёт в первые два
     слота. Что не влезло в пять (третий ствол другого класса, лишняя хилка) — выбрасывается,
     но сила пака его помнит (dropped, см. ccPackPow): цена лута прежняя, меняются только руки. */
  ['rifle','shotgun'].forEach(cls=>{
    if(pack.weapons.some(w=>w && w.icon===cls)) return;
    const g=guns.filter(w=>w.icon===cls); if(g.length) pack.weapons.push(Object.assign({}, one(g), {floor:true}));
  });
  // Первый автомат — слот 1, первый дробовик — слот 2, остальное (и второй автомат) — дальше.
  const seen={}; const rank=w=>{ if((w.icon==='rifle'||w.icon==='shotgun') && !seen[w.icon]){ seen[w.icon]=1; return w.icon==='rifle' ? 0 : 1; } return 2; };
  pack.weapons=pack.weapons.map((w,i)=>[w,i,rank(w)]).sort((a,b)=>(a[2]-b[2])||(a[1]-b[1])).map(x=>x[0]);
  pack.dropped=pack.dropped||[];
  for(let guard=0; count()>5 && guard<8; guard++){
    const fh=pack.heals.findIndex(h=>h.floor);
    if(fh>=0){ pack.heals.splice(fh, 1); continue; }
    if(pack.weapons.length>2){
      let k=-1; for(let i=pack.weapons.length-1;i>=2;i--){ if(pack.weapons[i].floor){ k=i; break; } }
      const w=k>=0 ? pack.weapons.splice(k, 1)[0] : pack.weapons.pop();
      if(!w.floor) pack.dropped.push(w); continue; }
    if(pack.heals.length>1){ pack.heals.pop(); continue; }
    break;
  }
  for(let guard=0; count()<5 && guard<8; guard++){
    const held=pack.weapons.map(w=>w.icon), hn=pack.heals.map(h=>h.name);
    const g=guns.filter(w=>held.indexOf(w.icon)<0), h=heals.filter(x=>hn.indexOf(x.name)<0);
    if(!pack.move && moves.length) pack.move=Object.assign({}, one(moves), {floor:true});
    else if(pack.heals.length<2 && h.length) pack.heals.push(Object.assign({}, one(h), {n:1, floor:true}));
    else if(pack.weapons.length<3 && g.length) pack.weapons.push(Object.assign({}, one(g), {floor:true}));
    else if(h.length) pack.heals.push(Object.assign({}, one(h), {n:1, floor:true}));
    else if(pack.weapons.length<5 && guns.length) pack.weapons.push(Object.assign({}, one(guns), {floor:true}));
    else break;
  }
  return pack;
}
/* СВОЯ ТОЧКА — ТРИ ХОДА (скриншот «добавил 1 выбор, почему-то»: на свободной
   точке стояла одна кнопка). Время на точке — это время, которого потом нет на фарм:
     «схватить и ехать» — треть обычной доли сундуков (CC_SITE_FAST_SHARE от ccSiteOpen),
       зато по дороге фармим — +CC_MATS_ZONE ресов (один круг стройки);
     «забрать и идти» — как было, ccSiteOpen сундуков, ресы как есть;
     «обшарить всё» — до CC_SITE_FULL_MUL × ccSiteOpen, но не больше, чем стоит на точке,
       и без фарма: −CC_MATS_ZONE ресов. Показывается, только если на точке есть что
       обшаривать сверх обычной доли.
   Пак «схватить» — первые сундуки того же броска, «обшарить» — те же плюс новые:
   ходы вложены, лучший пак не может оказаться у быстрого. Доли — решение, не замер. */
const CC_SITE_FAST_SHARE=1/3, CC_SITE_FULL_MUL=2;
/* Что пак стоит в силе: редкость двух стволов над uncommon (rare +1, epic +2,
   legendary +3 за ствол), пустой слот ствола −2, хилки −1 за каждую недостающую,
   без мувмента −1. Комната получает то же самое (ccRoomSite), так что это не
   подарок игроку, а разброс лута на всех. */
function ccPackPow(p){
  if(!p) return 0;
  // Пол острова (ccPackFloor, floor) в силу не идёт: слот занят, цена лута прежняя.
  // Выброшенный ради пары настоящий ствол (ccPackFloor, dropped) считается, как считался бы в руках.
  const mod=o=>RARITY_MOD[o.rarity]||2;
  const ws=(p.weapons||[]).concat(p.dropped||[]).filter(o=>o && !o.floor).sort((a,b)=>mod(b)-mod(a)), hs=(p.heals||[]).filter(o=>o && !o.floor);
  let v=0;
  for(let i=0;i<2;i++){ const o=ws[i]; v += o ? Math.max(0, (RARITY_MOD[o.rarity]||2)-2) : -2; }
  v -= Math.max(0, 2-hs.length);
  if(!p.move || p.move.floor) v -= 1;
  return Math.max(-5, Math.min(6, v));
}
const ccRarityWord=r=>{ const k=ccRarityKey(r); return k ? k.charAt(0).toUpperCase()+k.slice(1) : ''; };
// Стак пишется числом рядом с названием, как в инвентаре: «Small Shield Potion ×6».
const ccStackTag=o=>(o && o.n>1) ? ' ×'+o.n : '';
function ccItemLabel(o){ return o ? o.name+ccStackTag(o)+' ('+ccRarityWord(o.rarity)+')' : '-'; }
function ccPackLine(p){
  const name=o=>o ? o.name+ccStackTag(o) : '-';
  return [...(p.weapons||[]), ...(p.heals||[]), p.move].map(name).join(' · ');
}
// Шанс стычки на высадке: сила как у высадочной дуэли (LANDING_POW_EXPONENT,
// потолок LANDING_ODDS_CAP), плюс разница первых сундуков в процентных пунктах.
function ccSiteOdds(you, foe, eMine, eFoe){
  const a=Math.max(1, you._pc||you._pf||you.pow||1), b=Math.max(1, foe._pc||foe._pf||foe.pow||1);
  const wa=Math.pow(a, LANDING_POW_EXPONENT), wb=Math.pow(b, LANDING_POW_EXPONENT);
  const base=clamp(wa/(wa+wb), 1-LANDING_ODDS_CAP, LANDING_ODDS_CAP);
  return clamp(base+((eMine||0)-(eFoe||0))*CC_SITE_EDGE_PP, 0.2, 0.8);
}
/* Куда уходят, не приняв стычку: самая свободная коробка, из равных — ближняя.
   В комнате на пятьдесят отрядов и двадцать коробок пустых почти не бывает, и
   «соседняя точка» — это та, где сидят меньше всех; там стычка тоже возможна,
   но уже руками движка. */
function ccFreeBoxNear(game, you){
  const busy=new Map();
  (game && game.squads ? game.squads : []).forEach(s=>{ if(s.alive && s.team!==you && s.team.landingZone) busy.set(s.team.landingZone, (busy.get(s.team.landingZone)||0)+1); });
  const z0=you.landingZone; if(!z0) return null;
  let best=null, bn=Infinity, bd=Infinity;
  ALL_LANDING_ZONES.forEach(z=>{
    if(z===z0) return;
    const n=busy.get(z)||0;
    const dx=(z.x+z.w/2)-(z0.x+z0.w/2), dy=(z.y+z.h/2)-(z0.y+z0.h/2), d=dx*dx+dy*dy;
    if(n<bn || (n===bn && d<bd)){ bn=n; bd=d; best=z; }
  });
  return best;
}
/* ЛУТ НА СВОЕЙ ТОЧКЕ РУКАМИ (его слово 13.11: «сундуки открывать, чтоб игрок выбирал», «делай максимально реалистичней
   к игре»). Сундуки точки стоят сеткой, каждый открывается тапом: выпадает ствол и иногда расходник, как в ccChestRoll.
   Подобранное само встаёт в свободные слоты (как автоподбор в игре), инвентарь пять слотов, хилки стаком до потолка вики,
   передвижение одно. Лишнее лежит на земле, его можно поменять местами со слотом. Время — полоса до первой зоны:
   до трети сундуков ресы как у «быстро» (+CC_MATS_ZONE), к обычному счёту 0, сверх него до −CC_MATS_ZONE, как у «всё».
   Сила пака — от того, что в руках (dropped пуст), пустые слоты добирает пол острова (ccPackFloor), как раньше.
   Онлайн, перемотка, симуляция и пропуск — прежние три кнопки / «забрать» (ccLootRoomOn). */
function ccLootRoomOn(){
  if(typeof ccMpLock==='function' && ccMpLock()) return false;
  if(skipAnimation || (typeof careerSimOn==='function' && careerSimOn()) || (typeof CC_FF!=='undefined' && CC_FF)) return false;
  return typeof CAREER_RUN!=='undefined' && !!CAREER_RUN;
}
function ccLrKind(o){ return CC_MOVE_ITEMS.indexOf(o.name)>=0 ? 'm' : 'h'; }
function ccLrColor(o){ return (o && (RARITY_COLOR[o.rarity] || (typeof CONSUMABLE_RARITY_COLOR!=='undefined' && CONSUMABLE_RARITY_COLOR[o.rarity]))) || 'var(--common)'; }
/* Точка крупно, на ней сундуки, редкие сундуки и ящики с патронами (его слова 13.11: «когда на локе приблизить локу и там
   сундуки лутать», «иконки сундуков как в фортнайте», и выбранные 1/3/6: патроны, автобус, напарник лутает рядом).
   Кадр как у careerSpotShotHTML: слой всей карты в zoom раз, коробка почти во весь кадр. Где что стоит: точки fortnite.gg
   внутри коробки (CC_LR_CHESTS: s42, s43, r5, r6; n сундуки, r редкие, a ящики), у островов без точек разброс по коробке (место
   условное, число сундуков то же). Порядок обхода: от левого к ближайшему следующему, так открывает «Открыть 5». */
// Коробка во всю свободную часть кадра (его «больше локация должна быть», 13.11): 100 % и зум до 9.
const CC_LR_RATIO=4/3, CC_LR_FILL=100;
/* Ширина картинки острова в пикселях: приближение лут-комнаты не растягивает её больше чем в CC_LR_UPSCALE раз
   (его скрин 19.11 с широкого экрана: «слишком приближено» — S42 в 921 px под 9× расплывалась). */
const CC_ART_PX={'map-m1.jpg':1100, 'map-m2.jpg':1100, 'map-s42.jpg':921, 'map-s43.jpg':1000, 'map-s43-hd.jpg':2368, 'map-r5.jpg':1000, 'map-r5-hd.jpg':3264,
  'map-r6.jpg':1000, 'map-r6-hd.jpg':1984, 'map-reload-a.jpg':1062, 'map-reload-b.jpg':1034}, CC_LR_UPSCALE=2.5;
function ccArtPx(art){ const k=String(art||'').split('/').pop(); return CC_ART_PX[k] || (/map-[ghi][0-9]/.test(k) ? 2048 : 1600); }
/* Патроны: сундук даёт пачку, редкий сундук и ящик по две. На отряд нужно CC_AMMO_NEED пачек на игрока, иначе −1 к силе
   (стрелять нечем, третий файт без патронов). Порог и пачки — решение, не замер: в реплеях Tracker патронов нет. Комната
   (ccRoomSite) открывает ccSiteOpen сундуков, а это от 12 пачек на игрока, поэтому ботам штраф не грозит и не считается. */
const CC_AMMO_NEED=4, CC_AMMO_BOX=2, CC_AMMO_RARE=2, CC_LR_RARE_MAX=2, CC_LR_AMMO_MAX=4;
// Редкий сундук: ствол не ниже rare (вики Fortnite, Rare Chest: «higher chance of better loot»), расходник всегда.
function ccChestRollRare(rng, set){
  let best=null;
  for(let i=0;i<6;i++){ const r=ccChestRoll(rng, set); if(!best || (RARITY_MOD[r.weapon && r.weapon.rarity]||0)>(RARITY_MOD[best.weapon && best.weapon.rarity]||0)) best=r;
    if((RARITY_MOD[best.weapon && best.weapon.rarity]||0)>=(RARITY_MOD.rare||3)) break; }
  if(!best.cons){ const r=ccChestRoll(rng, set); best=Object.assign({}, best, {cons:r.cons}); }
  return best;
}
function ccLrSrc(key){
  const k=key==='s42solo' ? 's42' : key;
  if(typeof CC_LR_CHESTS!=='undefined' && CC_LR_CHESTS[k]) return CC_LR_CHESTS[k];
  if(key==='s43' && typeof CC_S43_CHESTS!=='undefined') return CC_S43_CHESTS;
  return null;
}
/* cam — кадр под HUD (его «может поверх карты», 13.11: в трио три инвентаря уезжали под карту и всё скролилось):
   W×H кадра в px и доли сверху/снизу, занятые полосой времени и хотбарами. Коробка ставится в свободную середину, зум под неё. */
function ccLrView(z, n, cam, boss){
  const key=(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '';
  const art=MAP_ART[key];
  if(!z || !art || !(n>0) || !(z.w>0) || !(z.h>0)) return null;
  const asp=MAP_ASPECT[key]||'1100/970', ar=String(asp).split('/');
  const hOverW=(Number(ar[1])||1)/(Number(ar[0])||1);
  const R=cam ? cam.W/cam.H : CC_LR_RATIO, ah=cam ? Math.max(0.3, 1-cam.top-cam.bot) : 1, fy=cam ? cam.top+ah/2 : 0.5;
  const zMax=cam ? Math.max(1.2, Math.min(9, ccArtPx(art)*CC_LR_UPSCALE/Math.max(320, cam.W))) : 9;
  const zoom=Math.max(1.2, Math.min(zMax, Math.min(CC_LR_FILL/Math.max(z.w, 2), CC_LR_FILL*ah/(Math.max(z.h, 2)*hOverW*R))));
  const visW=100/zoom, visH=100/(zoom*hOverW*R), halfW=Math.min(50, visW/2), halfH=Math.min(50, visH/2);
  const cx=clamp(z.x+z.w/2, halfW, 100-halfW), cy=clamp(z.y+z.h/2-(fy-0.5)*visH, halfH, 100-halfH);
  const rng=careerRng(ccHashStr('lr|'+key+'|'+z.x+'|'+z.y));
  // Не ближе пальца друг к другу: ~30 px в кадре.
  const sx=3000/((cam ? cam.W : 600)*zoom), sy=sx/hOverW, near=(p, x, y)=>Math.abs(p.x-x)<sx && Math.abs(p.y-y)<sy;
  const src=ccLrSrc(key);
  const inZone=list=>{ const out=[]; if(list) for(let i=0;i+1<list.length;i+=2){ const x=list[i], y=list[i+1];
    if(x>=z.x && x<=z.x+z.w && y>=z.y && y<=z.y+z.h) out.push({x, y}); }
    for(let i=out.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const s=out[i]; out[i]=out[j]; out[j]=s; }
    return out; };
  // Сундуки со 100 % спавном — первыми: они на точке всегда.
  const gold=inZone(src && src.g), all=gold.concat(inZone(src && src.n).filter(p=>!gold.some(q=>Math.abs(q.x-p.x)<0.05 && Math.abs(q.y-p.y)<0.05))), spots=[];
  // Ящики мельче сундука (24 px против 30): им хватает двух третей зазора.
  const put=(p, k)=>{ const f=k==='a' ? 0.67 : 1; if(spots.some(q=>Math.abs(q.x-p.x)<sx*f && Math.abs(q.y-p.y)<sy*f)) return false; spots.push({x:p.x, y:p.y, k}); return true; };
  all.forEach(p=>{ if(spots.length<n) put(p, 'c'); });
  const real=spots.length;
  // Добор: у острова с точками рядом с настоящим сундуком (в постройке, не в воде), иначе по коробке.
  const around=k=>{ const b=all.length ? all[Math.floor(rng()*all.length)] : null, a=rng()*Math.PI*2, d=1.1+rng()*0.6;
    return {x:b ? clamp(b.x+Math.cos(a)*sx*d, z.x, z.x+z.w) : z.x+z.w*(0.1+0.8*rng()),
            y:b ? clamp(b.y+Math.sin(a)*sy*d, z.y, z.y+z.h) : z.y+z.h*(0.1+0.8*rng())}; };
  for(let g=0; spots.filter(s=>s.k==='c').length<n && g<n*20; g++){ const p=around(); if(!put(p, 'c') && g>=n*15) spots.push({x:p.x, y:p.y, k:'c'}); }
  // Редкие сундуки и ящики — только настоящие точки (без данных: ящики разбросом, редких нет: их на острове единицы).
  inZone(src && src.r).slice(0, CC_LR_RARE_MAX).forEach(p=>put(p, 'r'));
  const am=src ? inZone(src.a) : [];
  let na=0; am.forEach(p=>{ if(na<CC_LR_AMMO_MAX && put(p, 'a')) na++; });
  for(let g=0; na<(src ? 1 : 3) && g<60; g++){ if(put(around(), 'a')) na++; }
  // Хранилища (fortnite.gg, Vaults): малые v и большое V — только где они на острове есть.
  // Без зазора: хранилище стоит где стоит; сундук, что на нём, отходит на соседнее место (число сундуков то же).
  const vault=(p, k)=>{ spots.forEach(q=>{ if(q.k!=='c' || !(Math.abs(q.x-p.x)<sx*0.8 && Math.abs(q.y-p.y)<sy*0.8)) return;
      for(let g=0; g<30; g++){ const r=around(); if(Math.hypot(r.x-p.x, r.y-p.y)>sx && !spots.some(s=>s!==q && Math.abs(s.x-r.x)<sx*0.6 && Math.abs(s.y-r.y)<sy*0.6)){ q.x=r.x; q.y=r.y; break; } } });
    spots.push({x:p.x, y:p.y, k}); };
  inZone(src && src.v).forEach(p=>vault(p, 'v')); inZone(src && src.V).forEach(p=>vault(p, 'V'));
  // Пол: места у построек (рядом с настоящими сундуками), меньше зазор — предметы мелкие.
  for(let g=0, nf=0; nf<CC_FLOOR_N && g<CC_FLOOR_N*12; g++){ const p=around(); if(!spots.some(q=>Math.abs(q.x-p.x)<sx*0.55 && Math.abs(q.y-p.y)<sy*0.55)){ spots.push({x:p.x, y:p.y, k:'f'}); nf++; } }
  // Босс мифической точки (CC_MYTHIC_POI) — в середине коробки: где именно он ходит, у нас нет.
  if(boss) spots.push({x:z.x+z.w/2, y:z.y+z.h/2, k:'b'});
  // Обход: от самого левого к ближайшему следующему.
  const left=spots.slice(), out=[];
  let cur=left.reduce((a, p)=>p.x<a.x ? p : a, left[0]);
  const dist=(a, b)=>Math.hypot(a.x-b.x, (a.y-b.y)*hOverW);
  while(left.length){ out.push(left.splice(left.indexOf(cur), 1)[0]); if(!left.length) break;
    const last=out[out.length-1]; cur=left.reduce((a, p)=>dist(p, last)<dist(a, last) ? p : a, left[0]); }
  return {key, art, asp, zoom, cx, cy, z, hOverW, spots:out, real};
}
const CC_LR_ART={c:'items/chest.webp', r:'items/rare-chest.webp', a:'items/ammo-box.webp'};
const CC_LR_KIND_T={c:1, r:1, a:0.5, f:0.25};
/* БОСС НА МИФИЧЕСКОЙ ТОЧКЕ (его «миф сундуки», «монетку забрать с босса и оружие миф», 13.11). Дроп — CC_MYTHIC_DROP (вики,
   Bosses): мифик(и) встают в слоты, медальон — значком у хотбара (в игре он не занимает слот оружия). Бой с боссом стоит
   CC_BOSS_T сундуков времени. Сила: точка и так стоит LANDING_POINTS_MAX+CC_MYTHIC_POW (сели — получили), поэтому мифик в руках
   считается как легендарка, а ушёл без босса — минус CC_MYTHIC_POW: мифика у тебя нет. Комната босса берёт всегда. */
const CC_BOSS_T=2;
/* ЛУТ НА ПОЛУ (его «ещё спавны на земле есть», 13.11). Вики, Floor Loot: у каждой локации свои места пола, каждое либо
   даёт предмет, либо пусто; чаще всего на полу патроны; по редкости обычные чаще всех, легендарные очень редко, мификов нет.
   Чисел вики не даёт, поэтому доли ниже — РЕШЕНИЕ по этому порядку, не замер: CC_FLOOR_N мест на коробку, CC_FLOOR_AMMO из
   них патроны, остальное ствол (CC_FLOOR_GUN) или хилка, редкость по CC_FLOOR_RARITY. Подобрать — CC_FLOOR_T сундука времени. */
/* ХРАНИЛИЩЕ (его «миф честы есть?», 13.11): в 2026 мифики — у боссов и в хранилищах; у fortnite.gg на S42 7 малых и одно
   большое. Что внутри, таблиц нет: решение — малое = CC_VAULT_ROLLS[0] бросков редкого сундука (не ниже rare), большое —
   CC_VAULT_ROLLS[1]; вскрыть — CC_VAULT_T времени (малое/большое). Ключа в игре нет, время и есть цена. */
const CC_VAULT_ROLLS=[2, 3], CC_VAULT_T=[2, 3];
const CC_FLOOR_N=6, CC_FLOOR_AMMO=0.4, CC_FLOOR_GUN=0.7, CC_FLOOR_T=0.25;
const CC_FLOOR_RARITY={common:0.5, uncommon:0.35, rare:0.12, epic:0.03, legendary:0};
/* ШАНСЫ ПО СЕЗОНУ (его «делай по каждому сезону свои шансы», 13.11). Опубликованной таблицы редкостей по сезонам нет ни у
   Epic, ни у датамайнеров (одна — Hypex, Chapter 2 S5, она и есть CC_CHEST_RARITY/CC_CHEST_CLASS). Но у каждого сезона свой
   пул: каких классов нет, тех не бывает, а редкость, которой у класса нет, уходит на ближайшую ниже (ccChestRoll). Поэтому
   итоговые шансы считаются ТОЧНО тем же правилом по пулу острова — это то, что реально выпадает в этом сезоне. */
const CC_LOOT_SEASON_NAME={f1:'C5S1', f2:'C5S2', f3:'C5S3', f4:'C5S4', e1:'C4S1', e2:'C4S2', e3:'C4S3', e4:'C4S4', k1:'C3S1', k2:'C3S2', k3:'C3S3', k4:'C3S4', j1:'C2S5', j2:'C2S6', j3:'C2S7', j4:'C2S8', t1:'C6S1', t2:'C6S2', t3:'C6S3', t4:'C6S4'};
// Подпись сезона к шансам: ключ пула острова (s42 → S42, f1 → C5S1 и т. п. — как называет его сам пул), иначе ключ.
function ccLootSeasonName(set){ try{ const k=ccLootSet(set); return (typeof CC_LOOT_SEASON_NAME!=='undefined' && CC_LOOT_SEASON_NAME[k]) || String(k||'').toUpperCase(); }catch(e){ return ''; } }
function ccLootOdds(set, base, ladderDown){
  const pool=ccLootPool(set), out={rar:{common:0, uncommon:0, rare:0, epic:0, legendary:0}, cls:{rifle:0, shotgun:0, smg:0, pistol:0, sniper:0}};
  if(!pool || !pool.weapons || !pool.weapons.length) return out;
  const have={}; pool.weapons.forEach(w=>{ have[w.icon]=1; });
  const keys=Object.keys(CC_CHEST_CLASS).filter(k=>have[k]), tot=keys.reduce((a,k)=>a+CC_CHEST_CLASS[k], 0);
  keys.forEach(k=>{ const wk=CC_CHEST_CLASS[k]/tot, inCls=pool.weapons.filter(w=>w.icon===k); out.cls[k]=wk;
    Object.keys(base).forEach(r=>{ const pr=base[r]; if(!pr) return;
      let c=inCls.filter(w=>w.rarity===r);
      const L=RARITY_LADDER, i0=L.indexOf(r);
      if(ladderDown){ for(let i=i0-1; !c.length && i>=0; i--) c=inCls.filter(w=>w.rarity===L[i]); }
      else { for(let i=i0+1; !c.length && i<L.length; i++) c=inCls.filter(w=>w.rarity===L[i]); }
      if(!c.length) c=inCls;
      c.forEach(w=>{ const rr=out.rar[w.rarity]!=null ? w.rarity : 'legendary'; out.rar[rr]+=wk*pr/c.length; }); }); });
  return out;
}
function ccFloorRoll(rng, set){
  if(rng()<CC_FLOOR_AMMO) return {ammo:1};
  const pool=ccLootPool(set);
  if(rng()<CC_FLOOR_GUN){
    const cls=ccChestClass(rng, pool.weapons), inCls=cls ? pool.weapons.filter(w=>w.icon===cls) : pool.weapons;
    let r=rng(), rar='common'; for(const k of Object.keys(CC_FLOOR_RARITY)){ r-=CC_FLOOR_RARITY[k]; if(r<0){ rar=k; break; } }
    let c=inCls.filter(w=>w.rarity===rar);
    for(let i=RARITY_LADDER.indexOf(rar)+1; !c.length && i<RARITY_LADDER.length; i++) c=inCls.filter(w=>w.rarity===RARITY_LADDER[i]);
    if(!c.length) c=inCls.length ? inCls : pool.weapons;
    return {weapon:c[Math.floor(rng()*c.length)]};
  }
  const hs=pool.heals.filter(x=>ccIsHealItem(x));
  return hs.length ? {cons:hs[Math.floor(rng()*hs.length)]} : {ammo:1};
}
function ccBossItem(d){
  const n=d.n, icon=/shotgun|pump/i.test(n) ? 'shotgun' : /smg/i.test(n) ? 'smg' : /pistol/i.test(n) ? 'pistol' : /dmr|sniper|bolt/i.test(n) ? 'sniper' : /rifle|\bar\b|assault|blade|burst/i.test(n) ? 'rifle' : 'other';
  return {name:n, rarity:'legendary', myth:true, img:d.src, icon};
}
function ccLrMapHTML(v, st, icon, T, first, bus, hud, cam){
  const pins=v.spots.map((p, i)=>{
    const pos='left:'+p.x.toFixed(2)+'%;top:'+p.y.toFixed(2)+'%';
    const o=st.at[i];
    const lab=p.k==='a' ? T.lrAmmoBox : p.k==='r' ? T.lrRare : p.k==='b' ? T.lrBoss(st.boss ? st.boss.name : '') : T.lrOpen1;
    if(p.k==='b'){ const img=st.boss && st.boss.drops[0] ? st.boss.drops[0].src : CC_LR_ART.r;
      return o==null ? '<button type="button" class="lr-pin lr-b" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(lab)+'" title="'+esc(lab)+'"><img src="'+img+'" alt="" width="40" height="40"><i>'+esc(st.boss ? st.boss.name : '')+'</i></button>'
                     : '<span class="lr-pin open lr-b" style="'+pos+'"><img src="'+img+'" alt=""></span>'; }
    if(p.k==='v' || p.k==='V'){ const vl=p.k==='V' ? T.lrVaultBig : T.lrVault;
      return o==null ? '<button type="button" class="lr-pin lr-v'+(p.k==='V' ? ' big' : '')+'" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(vl)+'" title="'+esc(vl)+'"><img src="'+CC_LR_ART.r+'" alt=""><i>'+esc(vl)+'</i></button>'
                     : '<span class="lr-pin open lr-v" style="'+pos+'">'+(o.roll && o.roll.weapon ? icon(o.roll.weapon) : '')+'</span>'; }
    if(p.k==='f') return o==null ? '<button type="button" class="lr-pin lr-f" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(T.lrFloor)+'" title="'+esc(T.lrFloor)+'"><i></i></button>'
      : '<span class="lr-pin open lr-f" style="'+pos+'">'+(o.roll && (o.roll.weapon||o.roll.cons) ? icon(o.roll.weapon||o.roll.cons) : '<img src="'+CC_LR_ART.a+'" alt="">')+'</span>';
    if(o==null) return '<button type="button" class="lr-pin lr-'+p.k+'" data-c="'+i+'" style="'+pos+'" aria-label="'+esc(lab)+'" title="'+esc(lab)+'"><img src="'+CC_LR_ART[p.k]+'" alt="" width="30" height="30"></button>';
    const who=o.by ? ' by'+o.by : '';
    if(p.k==='a') return '<span class="lr-pin open lr-a'+who+'" style="'+pos+'"><img src="'+CC_LR_ART.a+'" alt=""></span>';
    return '<span class="lr-pin open'+who+'" style="'+pos+'" title="'+esc((o.name ? o.name+': ' : '')+ccItemLabel(o.roll.weapon))+'">'+(o.roll.weapon ? icon(o.roll.weapon) : '<img src="'+CC_LR_ART[p.k]+'" alt="">')+'</span>';
  }).join('');
  const zw=(v.zoom*100).toFixed(0)+'%', tx=(-v.cx).toFixed(2)+'%', ty=(-v.cy).toFixed(2)+'%';
  // Автобус — линия через весь остров (ccBus), в координатах карты; viewBox высотой в долю картинки.
  const H=(100*v.hOverW).toFixed(2);
  const busSvg=bus ? '<svg class="lr-bus" viewBox="0 0 100 '+H+'" preserveAspectRatio="none"><line x1="'+bus.x1.toFixed(2)+'" y1="'+(bus.y1*v.hOverW).toFixed(2)+'" x2="'+bus.x2.toFixed(2)+'" y2="'+(bus.y2*v.hOverW).toFixed(2)+'"/></svg>' : '';
  return '<div class="lr-map'+(hud ? ' lr-hud' : '')+(first ? ' lr-in' : '')+'"'+(cam ? ' style="width:'+Math.round(cam.W)+'px;height:'+Math.round(cam.H)+'px;aspect-ratio:auto;max-height:none"' : '')+'><div class="lr-map-l" style="--zw:'+zw+';--tx:'+tx+';--ty:'+ty+';aspect-ratio:'+v.asp+';background-image:url(\''+v.art+'\')">'+
    busSvg+'<i class="lr-map-box" style="left:'+v.z.x+'%;top:'+v.z.y+'%;width:'+v.z.w+'%;height:'+v.z.h+'%"></i>'+pins+'</div>'+(hud||'')+'</div>';
}
/* Напарники на точке (squadSize>1): каждый раз, когда ты открываешь сундук, каждый напарник открывает ближайший к себе
   закрытый сундук. Его находки встают в его пять слотов, лишнее на общую землю. Сила отряда считается так же, как у комнаты
   (лучший пак из всего, что у отряда в руках, ccPackFrom), минус 1 за каждого, у кого меньше двух стволов (ccLrSplitPen,
   не больше −2): комната делит лут без ошибок, ошибка дележа — только у людей. */
function ccLrMates(){
  if(typeof squadSize!=='number' || squadSize<2) return [];
  const m=(typeof careerMates==='function') ? careerMates().filter(Boolean).slice(0, squadSize-1) : [];
  const out=m.map(x=>String(x.handle||x.nick||'').replace(/<[^>]+>/g,'')).filter(Boolean);
  while(out.length<squadSize-1) out.push('#'+(out.length+2));
  return out;
}
function ccLrSplitPen(invs){
  let pen=0; invs.forEach(inv=>{ if(inv.filter(x=>x.kind==='w').length<2) pen++; });
  return Math.min(2, pen);
}
function ccLootRoom(host, opt){
  return new Promise(resolve=>{
    const T=L(), rolls=opt.rolls, nFast=opt.nFast, nOpen=opt.nOpen, nFull=rolls.length;
    const names=['', ...(opt.mates||[])];
    const z0=opt.zone, bossName=z0 && z0.mythic ? z0.mythic : null;
    const st={opened:0, t:0, ammo:0, invs:names.map(()=>[]), ground:[], at:[], to:0, medals:[],
              boss:bossName ? {name:bossName, drops:ccMythicDrops(z0.mythicSet||ACTIVE_LANDING_SET, bossName)} : null};
    const box=document.createElement('div');
    box.className='cc-choice cc-choice-map cc-loot';
    const full=!!(opt.zone && MAP_ART[(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '']);
    // На весь экран — в body: у карты игры бывает transform, и fixed внутри неё прилипал бы к карте.
    if(full) box.classList.add('lr-full');
    /* Широкий экран: лут слева, на месте карты боя, таблица справа остаётся видна (его слово 19.11: «от таблицы слева
       лутаться»). Рамка — по карте боя в окне; карта слишком мала или не видна — на весь экран, как на телефоне. */
    if(full && (window.innerWidth||0)>=900 && typeof CC_RUN_MAP!=='undefined' && CC_RUN_MAP && CC_RUN_MAP.isConnected){
      const r=CC_RUN_MAP.getBoundingClientRect(), top=Math.max(0, r.top), h=Math.min(r.bottom, window.innerHeight)-top;
      if(r.width>=560 && h>=420){
        box.classList.add('lr-side');
        Object.assign(box.style, {left:Math.round(Math.max(0, r.left))+'px', top:Math.round(top)+'px', width:Math.round(r.width)+'px', height:Math.round(h)+'px', right:'auto', bottom:'auto'});
      }
    }
    (full ? document.body : host).appendChild(box);
    const cam=(()=>{ const vv=window.visualViewport, W=Math.max(320, (full && box.clientWidth) || (vv && vv.width) || window.innerWidth || 800), H=Math.max(400, (full && box.clientHeight) || (vv && vv.height) || window.innerHeight || 700);
      const m=names.length, wide=W>=560, per=Math.max(1, Math.floor((W-24)/(5*(wide ? 46 : 42)+18))), rows=Math.ceil(m/per);
      return {W, H, top:(W>=700 ? 96 : 116)/H, bot:(rows*(wide ? 66 : 60)+50+52+30)/H}; })();
    const view=full ? ccLrView(opt.zone, nFull, cam, st.boss) : null;
    if(!view) box.classList.remove('lr-full');
    const pos=[]; // где стоит каждый (индекс точки), для «ближайшего» у напарника
    const mats=()=>{ const o=st.t, span=Math.max(1, nOpen-nFast); return Math.round(CC_MATS_ZONE*clamp((nOpen-o)/span, -1, 1)); };
    const groundPut=it=>{
      if(it.kind!=='h'){ st.ground.push(it); return; }
      const cap=ccHealOf(it.o).stack; let n=it.n;
      for(const g of st.ground){ if(n<=0) break; if(g.kind==='h' && g.o.name===it.o.name && g.n<cap){ const mv=Math.min(cap-g.n, n); g.n+=mv; n-=mv; } }
      while(n>0){ const k=Math.min(cap, n); st.ground.push({o:it.o, kind:'h', n:k}); n-=k; }
    };
    const add=(o, kind, who)=>{
      const inv=st.invs[who], it={o, kind, n:1};
      /* Ствол — один на класс, как держат про (его «2 снапы 2 дробовика — не должно быть так»): того же класса подбирается,
         только если редже, а старый ложится на землю; иначе сам на землю. Руками с земли взять второй можно. */
      if(kind==='w'){ const md=x=>RARITY_MOD[x.rarity]||0, cls=x=>x.icon==='other' ? 'o:'+x.name : x.icon;
        const j=inv.findIndex(x=>x.kind==='w' && cls(x.o)===cls(o));
        if(j>=0){ if(md(o)>md(inv[j].o)){ groundPut(inv[j]); inv[j]=it; } else groundPut(it); return; } }
      // Хилка одного вида — один слот, как в игре (две пиццы в разных слотах нельзя): полный стак — лишнее на землю.
      if(kind==='h'){ const same=inv.find(x=>x.kind==='h' && x.o.name===o.name); if(same){ if(same.n<ccHealOf(o).stack) same.n++; else groundPut(it); return; } }
      if(kind==='m' && inv.some(x=>x.kind==='m')){ st.ground.push(it); return; }
      if(inv.length<5){ inv.push(it); return; }
      groundPut(it);
    };
    const giveRoll=(r, who)=>{ if(r.weapon) add(r.weapon, 'w', who); if(r.cons) add(r.cons, ccLrKind(r.cons), who); };
    // Открыть точку i тем, кто who. Сундук берёт следующий бросок, редкий бросает свой, ящик — патроны.
    const openSpot=(i, who)=>{
      const p=view.spots[i]; if(!p || st.at[i]!=null) return false;
      if(p.k==='a'){ st.at[i]={by:who}; st.ammo+=CC_AMMO_BOX; st.t+=0.5; pos[who]=i; return true; }
      if(p.k==='v' || p.k==='V'){ const big=p.k==='V' ? 1 : 0, rs=[]; for(let q=0;q<CC_VAULT_ROLLS[big];q++) rs.push(ccChestRollRare(Math.random, opt.set));
        st.at[i]={by:who, roll:rs[0], name:names[who]}; st.t+=CC_VAULT_T[big]; st.ammo+=CC_AMMO_RARE; pos[who]=i; rs.forEach(r=>giveRoll(r, who)); return true; }
      if(p.k==='f'){ const roll=ccFloorRoll(Math.random, opt.set); st.at[i]={by:who, roll, name:names[who]}; st.t+=CC_FLOOR_T; pos[who]=i;
        if(roll.ammo) st.ammo+=roll.ammo; else giveRoll(roll, who); return true; }
      if(p.k==='b'){ st.at[i]={by:who}; st.t+=CC_BOSS_T; st.bossDown=true; pos[who]=i;
        (st.boss ? st.boss.drops : []).forEach(d=>{ if(d.med) st.medals.push(d); else add(ccBossItem(d), 'w', who); }); return true; }
      if(p.k==='r'){ const roll=ccChestRollRare(Math.random, opt.set); st.at[i]={by:who, roll, name:names[who]}; st.ammo+=CC_AMMO_RARE; st.t+=1; giveRoll(roll, who); pos[who]=i; return true; }
      if(st.opened>=nFull) return false;
      const roll=rolls[st.opened++]; st.at[i]={by:who, roll, name:names[who]}; st.ammo+=1; st.t+=1; giveRoll(roll, who); pos[who]=i; return true;
    };
    const nearestFree=(who, kinds)=>{ let best=-1, bd=Infinity; const from=view.spots[pos[who]] || view.spots[0];
      view.spots.forEach((p, j)=>{ if(st.at[j]!=null || kinds.indexOf(p.k)<0) return; const d=Math.hypot(p.x-from.x, (p.y-from.y)*view.hOverW); if(d<bd){ bd=d; best=j; } });
      return best; };
    const firstFree=()=>view.spots.findIndex((p, j)=>st.at[j]==null && p.k!=='b' && p.k!=='v' && p.k!=='V' && (p.k!=='c' || st.opened<nFull));
    /* Напарник добирает пустые слоты с общей земли: ствол класса, которого у него нет (лучший по редкости), потом мувмент,
       если его нет, потом хилка. Того же класса второй не берёт. Без этого слот оставался пустым при полной земле. */
    const mateFill=who=>{ const inv=st.invs[who], md=x=>RARITY_MOD[x.rarity]||0, cls=x=>x.icon==='other' ? 'o:'+x.name : x.icon;
      while(inv.length<5){ let best=-1;
        st.ground.forEach((g, i)=>{ if(g.kind!=='w' || inv.some(x=>x.kind==='w' && cls(x.o)===cls(g.o))) return; if(best<0 || md(g.o)>md(st.ground[best].o)) best=i; });
        if(best<0 && !inv.some(x=>x.kind==='m')) best=st.ground.findIndex(g=>g.kind==='m');
        if(best<0) best=st.ground.findIndex(g=>g.kind==='h' && !inv.some(x=>x.kind==='h' && x.o.name===g.o.name));
        if(best<0) break;
        inv.push(st.ground.splice(best, 1)[0]); } };
    const mateTurn=()=>{ for(let w=1; w<names.length; w++){ const j=nearestFree(w, st.opened<nFull ? ['c','r'] : ['r']); if(j>=0) openSpot(j, w); mateFill(w); } };
    const open=(k, at)=>{
      for(let i=0;i<k;i++){
        if(view){ const j=(i===0 && at!=null && st.at[at]==null) ? at : firstFree(); if(j<0) break; if(!openSpot(j, 0)) break; mateTurn(); }
        else { if(st.opened>=nFull) break; const r=rolls[st.opened++]; st.ammo++; st.t++; giveRoll(r, 0); st.grid=(st.grid||0)+1; }
      }
      draw(); };
    const take=i=>{ const it=st.ground[i]; if(!it) return; const inv=st.invs[st.to];
      if(it.kind==='m' && inv.some(x=>x.kind==='m')){ const j=inv.findIndex(x=>x.kind==='m'); st.ground[i]=inv[j]; inv[j]=it; draw(); return; }
      if(it.kind==='h'){ const same=inv.find(x=>x.kind==='h' && x.o.name===it.o.name); if(same){ const cap=ccHealOf(it.o).stack, mv=Math.min(it.n, cap-same.n); if(mv>0){ same.n+=mv; it.n-=mv; if(!it.n) st.ground.splice(i,1); } else st.full=true; draw(); return; } }
      if(inv.length>=5){ st.full=true; draw(); return; }
      inv.push(it); st.ground.splice(i,1); draw(); };
    const drop=(who, i)=>{ const inv=st.invs[who], it=inv[i]; if(!it) return; inv.splice(i,1); groundPut(it); draw(); };
    /* ПЕРЕКЛАДЫВАНИЕ (Notion 15.11: «возможность передвинуть предметы»). Тап по предмету выбирает его, тап по другому слоту
       (своему или напарника, пустому или занятому) кладёт туда или меняет местами, второй тап по тому же — выбросить.
       Тапами, а не перетаскиванием: на iPhone drag&drop в Safari не работает. Хилки одного имени складываются в стак
       до потолка; мувмент у каждого один (как в take). */
    const move=(fw, fi, tw, ti)=>{ const from=st.invs[fw], to=st.invs[tw], it=from[fi]; if(!it) return;
      if(fw===tw){ if(ti<from.length){ from[fi]=from[ti]; from[ti]=it; } else { from.splice(fi,1); from.push(it); } return; }
      const tgt=to[ti];
      if(it.kind==='h' && (!tgt || (tgt.kind==='h' && tgt.o.name===it.o.name))){ const same=to.find(x=>x.kind==='h' && x.o.name===it.o.name);
        if(same){ const mv=Math.min(it.n, ccHealOf(it.o).stack-same.n); if(mv>0){ same.n+=mv; it.n-=mv; if(!it.n) from.splice(fi,1); return; } } }
      const oneMove=(inv, keep, x)=>!(x.kind==='m' && inv.some((y, k)=>k!==keep && y.kind==='m'));
      if(!tgt){ if(to.length>=5){ st.full=true; return; }
        if(!oneMove(to, -1, it)){ st.warn=T.lrOneMove; return; }
        from.splice(fi,1); to.push(it); return; }
      if(!oneMove(to, ti, it) || !oneMove(from, fi, tgt)){ st.warn=T.lrOneMove; return; }
      from[fi]=tgt; to[ti]=it; };
    const slotTap=(w, i, filled)=>{ const sel=st.sel; st.sel=null;
      if(sel && sel[0]===w && sel[1]===i){ drop(w, i); return; }
      if(sel){ move(sel[0], sel[1], w, i); draw(); return; }
      if(filled) st.sel=[w, i];
      draw(); };
    /* Свободные слоты после «Поделить»/«Собрать лучшее» (Notion 15.11: «когда жму поделить, у тиммейта слот свободный»):
       ccPackFrom берёт обычный набор, остальное лежало на земле. Добирается по кругу, лучшее первым: тому, у кого меньше
       двух стволов, — ствол, остальным — хилка (в свой стак, если есть место), потом ствол, потом мувмент, если его нет. */
    const fillFree=()=>{ let moved=true;
      while(moved && st.ground.length){ moved=false;
        st.invs.forEach(inv=>{ if(inv.length>=5 || !st.ground.length) return;
          const guns=inv.filter(x=>x.kind==='w').length, hasM=inv.some(x=>x.kind==='m');
          let bi=-1, bs=-1;
          st.ground.forEach((g, i)=>{ if(g.kind==='m' && hasM) return;
            const same=g.kind==='h' && inv.find(x=>x.kind==='h' && x.o.name===g.o.name);
            if(same && same.n>=ccHealOf(g.o).stack) return;   // одна хилка — один слот, полный стак не добирается
            const twin=g.kind==='w' && inv.some(x=>x.kind==='w' && x.o.name===g.o.name);
            const base=g.kind==='w' ? (guns<2 ? 400 : 200) - (twin ? 250 : 0) : g.kind==='h' ? 300 : 100, sc=base+(RARITY_MOD[g.o.rarity]||0);
            if(sc>bs){ bs=sc; bi=i; } });
          if(bi<0) return;
          const g=st.ground[bi];
          const same=g.kind==='h' && inv.find(x=>x.kind==='h' && x.o.name===g.o.name);
          if(same){ const mv=Math.min(g.n, ccHealOf(g.o).stack-same.n); same.n+=mv; g.n-=mv; if(!g.n) st.ground.splice(bi,1); }
          else { st.ground.splice(bi,1); inv.push(g); }
          moved=true; }); } };
    /* «Собрать лучшее» / «Поделить»: всё, что у отряда, раскладывается заново. Один — лучший пак себе. Отряд — змейкой:
       автоматы по порядку (ты, напарник…), дробовики в обратном, хилки и мувмент по кругу; у каждого потом ccPackFrom
       из доставшегося. Остаток считается по имени (хилки ccPackFrom отдаёт копиями), иначе стаки множились. */
    const auto=()=>{ const all=[].concat(...st.invs, st.ground), m=names.length;
      const ws=[], cs=[]; all.forEach(x=>{ for(let k=0;k<x.n;k++) (x.kind==='w' ? ws : cs).push(x.o); });
      const mod=o=>RARITY_MOD[o.rarity]||0, byMod=(a,b)=>mod(b)-mod(a);
      const share=names.map(()=>({ws:[], cs:[]}));
      const rifles=ws.filter(w=>w.icon==='rifle').sort(byMod), shots=ws.filter(w=>w.icon==='shotgun').sort(byMod), rest=ws.filter(w=>w.icon!=='rifle' && w.icon!=='shotgun').sort(byMod);
      rifles.forEach((w, i)=>share[i%m].ws.push(w));
      shots.forEach((w, i)=>share[(m-1-(i%m))].ws.push(w));
      rest.forEach((w, i)=>share[i%m].ws.push(w));
      const heals=cs.filter(c=>ccLrKind(c)==='h'), moves=cs.filter(c=>ccLrKind(c)==='m').sort(byMod);
      heals.forEach((c, i)=>share[i%m].cs.push(c)); moves.forEach((c, i)=>share[i%m].cs.push(c));
      st.invs=share.map(s=>{ const p=ccPackFrom(s.ws, s.cs), inv=[];
        (p.weapons||[]).forEach(w=>inv.push({o:w, kind:'w', n:1}));
        (p.heals||[]).forEach(h=>inv.push({o:h, kind:'h', n:h.n||1}));
        if(p.move) inv.push({o:p.move, kind:'m', n:1});
        return inv; });
      const key=x=>x.kind==='w' ? x.o : x.kind+':'+x.o.name, left=new Map();
      all.forEach(x=>{ const e=left.get(key(x)); if(e) e.n+=x.n; else left.set(key(x), {o:x.o, kind:x.kind, n:x.n}); });
      st.invs.forEach(inv=>inv.forEach(x=>{ const e=left.get(key(x)); if(e) e.n-=x.n; }));
      st.ground=[]; left.forEach(e=>{ if(e.n<=0) return; if(e.kind==='h') groundPut(e); else for(let k=0;k<e.n;k++) st.ground.push({o:e.o, kind:e.kind, n:1}); });
      fillFree(); st.sel=null;
      draw(); };
    const packOf=inv=>{ const pack={weapons:[], heals:[], move:null, dropped:[], manual:true};
      inv.forEach(x=>{ if(x.kind==='w') pack.weapons.push(x.o); else if(x.kind==='m' && !pack.move) pack.move=x.o; else pack.heals.push(Object.assign({}, x.o, {n:x.n})); });
      return pack; };
    const finish=()=>{ if(!box.isConnected) return; box.remove();
      for(let w=1; w<names.length; w++) mateFill(w);
      const pack=packOf(st.invs[0]);
      const r=rolls.slice(0, Math.max(1, st.opened)); pack.chests=st.opened; pack.first=r[0]; pack.rolls=r;
      // Сила отряда: один — пак из рук (как было); отряд — лучший пак из всех рук, как у комнаты, минус ошибки дележа.
      let powPack=null, pen=0;
      if(names.length>1){ const ws=[], cs=[]; st.invs.forEach(inv=>inv.forEach(x=>{ if(x.kind==='w') ws.push(x.o); else cs.push(Object.assign({}, x.o, {n:x.n})); }));
        const flat=[]; cs.forEach(c=>{ for(let k=0;k<(c.n||1);k++) flat.push(c); });
        powPack=ccPackFrom(ws, flat); pen+=ccLrSplitPen(st.invs); }
      const ammoLow=st.ammo<CC_AMMO_NEED*names.length;
      if(ammoLow) pen+=1;
      if(st.boss && !st.bossDown) pen+=CC_MYTHIC_POW;
      resolve({pack, opened:st.opened, mats:mats(), powPack, pen, ammo:st.ammo, ammoLow, boss:st.boss ? st.boss.name : null, bossDown:!!st.bossDown, medals:st.medals, split:names.length>1 ? ccLrSplitPen(st.invs) : 0,
               mates:st.invs.slice(1).map((inv, k)=>({name:names[k+1], pack:packOf(inv)}))}); };
    const icon=o=>'<span class="lr-ic" style="--rc:'+(o.myth ? 'var(--mythic)' : ccLrColor(o))+'">'+(o.img ? '<img src="'+o.img+'" alt="">' : ccItemIconHTML(o, '<i>'+esc(String(o.name||'?').slice(0,2))+'</i>'))+'</span>';
    const tag=x=>x.n>1 ? '<em>×'+x.n+'</em>' : '';
    const slotsOf=who=>[0,1,2,3,4].map(i=>{ const x=st.invs[who][i];
      const on=!!(st.sel && st.sel[0]===who && st.sel[1]===i);
      return x ? '<button type="button" class="lr-slot'+(on ? ' sel' : '')+'" data-d="'+who+'.'+i+'" aria-pressed="'+on+'" title="'+esc(on ? T.lrDrop : T.lrMoveTip)+'">'+icon(x.o)+tag(x)+'<small>'+esc(x.o.name)+'</small></button>'
               : '<button type="button" class="lr-slot empty'+(st.sel ? ' can' : '')+'" data-e="'+who+'.'+i+'" aria-label="'+esc(T.lrMoveTip)+'"></button>'; }).join('');
    function draw(){
      const o=st.t, m=mats(), pct=Math.round(clamp(o/Math.max(1,nFull), 0, 1)*100), zone=o<=nFast ? 'ok' : o<=nOpen ? 'mid' : 'late';
      const need=CC_AMMO_NEED*names.length;
      const ground=st.ground.map((x,i)=>'<button type="button" class="lr-g" data-g="'+i+'">'+icon(x.o)+tag(x)+'<small>'+esc(x.o.name)+'</small></button>').join('');
      const toSel=names.length>1 ? '<div class="lr-to" role="group" aria-label="'+esc(T.lrTakeFor)+'"><span>'+esc(T.lrTakeFor)+'</span>'+
        names.map((n, w)=>'<button type="button" data-to="'+w+'" aria-pressed="'+(st.to===w)+'"'+(st.to===w?' class="on"':'')+'>'+esc(w ? n : T.lrMe)+'</button>').join('')+'</div>' : '';
      const done=view ? firstFree()<0 : st.opened>=nFull;
      const timeHTML='<div class="lr-time lr-'+zone+'"><u><s style="width:'+pct+'%"></s><i style="left:'+(nFast/nFull*100)+'%"></i><i style="left:'+(nOpen/nFull*100)+'%"></i></u>'+
        '<span>'+esc(T.lrOpened(st.opened, nFull))+' · '+ccMatsIconHTML()+' <b class="'+(m>0?'up':m<0?'down':'')+'">'+(m>0?'+':'')+m+'</b>'+
        ' · <img src="'+CC_LR_ART.a+'" alt=""> <b class="'+(st.ammo<need?'down':'up')+'">'+esc(T.lrAmmo(st.ammo, need))+'</b></span></div>';
      const btns='<div class="lr-btns"><button type="button" class="lr-b" data-a="o5"'+(done?' disabled':'')+'>'+esc(T.lrOpen5)+'</button>'+
        '<button type="button" class="lr-b" data-a="auto"'+(st.opened?'':' disabled')+'>'+esc(names.length>1 ? T.lrSplit : T.lrAuto)+'</button>'+
        '<button type="button" class="lr-b lr-go" data-a="go">'+esc(T.lrGo)+'</button></div>';
      const pc=v=>Math.round(v*100)+'%';
      const oc=st.oddsC || (st.oddsC=ccLootOdds(opt.set, CC_CHEST_RARITY, true)), of=st.oddsF || (st.oddsF=ccLootOdds(opt.set, CC_FLOOR_RARITY, false));
      const RK=['common','uncommon','rare','epic','legendary'];
      const odds=T.lrOdds(RK.map(k=>pc(oc.rar[k])), ['rifle','shotgun','smg','pistol','sniper'].map(k=>pc(oc.cls[k])), pc(CC_CHEST_CONSUMABLE),
        RK.map(k=>pc(of.rar[k])), pc(CC_FLOOR_AMMO), ccLootSeasonName(opt.set));
      const hud=view ? '<div class="lr-hud-t"><b class="lr-hud-ttl">'+esc(T.lrTitle)+'</b><small>'+esc(opt.at+T.lrHint(nOpen))+(opt.busLine ? ' · '+esc(opt.busLine) : '')+'</small><small class="lr-odds">'+odds+'</small>'+timeHTML+'</div><div class="lr-hud-b">'+
        (st.full ? '<div class="lr-warn">'+esc(T.lrFull)+'</div>' : '')+lrNote()+
        '<div class="lr-gs" aria-label="'+esc(T.lrGround)+'">'+(st.ground.length ? st.ground.map((x,i)=>'<button type="button" class="lr-g" data-g="'+i+'" title="'+esc(x.o.name)+'" aria-label="'+esc(x.o.name)+'">'+icon(x.o)+tag(x)+'</button>').join('') : '<span class="lr-gs-e">'+esc(T.lrGround)+'</span>')+'</div>'+
        '<div class="lr-hbs">'+names.map((n, w)=>'<div class="lr-hb'+(names.length>1 && st.to===w ? ' to' : '')+'">'+
          (names.length>1 ? '<button type="button" class="lr-hb-n" data-to="'+w+'" aria-pressed="'+(st.to===w)+'" title="'+esc(T.lrTakeFor)+'">'+esc(w ? n : T.lrMe)+'</button>'
                          : '<span class="lr-hb-n">'+esc(T.lrMe)+'</span>')+
          '<div class="lr-hb-s">'+slotsOf(w)+(w===0 ? st.medals.map(d=>'<span class="lr-medal" title="'+esc(d.n)+'"><img src="'+d.src+'" alt="'+esc(d.n)+'"></span>').join('') : '')+'</div></div>').join('')+'</div>'+btns+'</div>' : '';
      const chests=view ? ccLrMapHTML(view, st, icon, T, !st.drawn, opt.bus, hud, cam) : '<div class="lr-chests">'+rolls.map((r,i)=>i<st.opened
        ? '<span class="lr-ch open" title="'+esc(ccItemLabel(r.weapon))+'">'+icon(r.weapon)+'</span>'
        : '<button type="button" class="lr-ch" data-c="'+i+'" aria-label="'+esc(T.lrOpen1)+'">'+CC_CHOICE_ICON.chest+'</button>').join('')+'</div>';
      const invs=names.map((n, w)=>'<div class="lr-lab">'+esc(w ? T.lrInvOf(n) : T.lrInv)+'</div><div class="lr-inv">'+slotsOf(w)+'</div>').join('');
      box.innerHTML=view ? chests : '<div class="cc-choice-head"><b><span class="cc-choice-t">'+esc(T.lrTitle)+'</span></b><div class="cc-choice-sub"><span>'+esc(opt.at+T.lrHint(nOpen))+(opt.busLine ? '<br>'+esc(opt.busLine) : '')+'</span></div></div>'+
        timeHTML+chests+toSel+invs+
        (st.full ? '<div class="lr-warn">'+esc(T.lrFull)+'</div>' : '')+lrNote()+
        (ground ? '<div class="lr-lab">'+esc(T.lrGround)+'</div><div class="lr-ground">'+ground+'</div>' : '')+btns;
      st.full=false; st.warn=null; st.drawn=1;
    }
    function lrNote(){ const x=st.sel && st.invs[st.sel[0]][st.sel[1]];
      return (st.warn ? '<div class="lr-warn">'+esc(st.warn)+'</div>' : '')+(x ? '<div class="lr-selhint">'+esc(T.lrSelHint(x.o.name))+'</div>' : ''); }
    box.addEventListener('click', e=>{
      const b=e.target.closest('button'); if(!b || !box.contains(b) || b.disabled) return;
      if(b.dataset.c!=null) open(1, +b.dataset.c);
      else if(b.dataset.d!=null){ const [w, i]=b.dataset.d.split('.'); slotTap(+w, +i, true); }
      else if(b.dataset.e!=null){ const [w, i]=b.dataset.e.split('.'); slotTap(+w, +i, false); }
      else if(b.dataset.g!=null){ st.sel=null; take(+b.dataset.g); }
      else if(b.dataset.to!=null){ st.to=+b.dataset.to; draw(); }
      else if(b.dataset.a==='o5') open(5);
      else if(b.dataset.a==='auto') auto();
      else if(b.dataset.a==='go') finish();
    });
    // Пропуск посреди комнаты: открыть то, что успели бы до зоны, собрать лучшее и уйти (как ccChoiceBox отвечает сам).
    const watch=setInterval(()=>{
      if(!box.isConnected){ clearInterval(watch); return; }
      if(!skipAnimation) return;
      clearInterval(watch);
      if(st.opened<nOpen) open(nOpen-st.opened);
      auto(); finish();
    }, 120);
    draw();
  });
}
/* АВТОБУС (выбор 3, 13.11). В каждой игре автобус летит прямой линией через остров; на точку далеко от линии отряд
   приземляется позже, и до первой зоны там открывают меньше сундуков. Линия своя у каждой игры и одинакова у всех клиентов:
   она выводится из первого круга движка (кадр 0), бросков не тратит. Угол любой, линия проходит через середину острова
   ±20 %. Задержка: до CC_BUS_NEAR % от линии ничего, дальше линейно до CC_BUS_LATE доли сундуков на CC_BUS_FAR %.
   Числа — решение, не замер: полёт в Fortnite ~1 мин на остров, свои точки про выбирают так, чтобы успеть. */
const CC_BUS_NEAR=10, CC_BUS_FAR=55, CC_BUS_LATE=0.3;
let CC_BUS_GAME=null, CC_BUS_KEY=null, CC_BUS=null;
function ccBus(){
  // 19.11: линия — маршрут игры (ccBusRoute), тот же, что летит в пролёте и решает, кто сел первым. Без номера игры — по первому кругу, как было.
  const set=(typeof ACTIVE_LANDING_SET!=='undefined' ? ACTIVE_LANDING_SET : '');
  let px, py, dx, dy, key;
  if(CC_BUS_G!=null){
    key='g'+CC_BUS_G+'|'+(typeof careerToday==='function' ? careerToday() : '')+'|'+set;
    if(CC_BUS && CC_BUS_KEY===key) return CC_BUS;
    const R=ccBusRoute(CC_BUS_G); px=R.cx; py=R.cy; dx=R.dx; dy=R.dy;
  } else {
    const g=CC_BUS_GAME, fr=g && g.frames ? g.frames() : null, f=fr && fr[0];
    if(!f || !f.circle) return null;
    key=f.circle.cx.toFixed(3)+'|'+f.circle.cy.toFixed(3)+'|'+set;
    if(CC_BUS && CC_BUS_KEY===key) return CC_BUS;
    const r=careerRng(ccHashStr('bus|'+key));
    const a=r()*Math.PI; px=50+(r()-0.5)*40; py=50+(r()-0.5)*40; dx=Math.cos(a); dy=Math.sin(a);
  }
  // Отрезок от края до края кадра 0..100 по обеим осям (в процентах картинки).
  let t0=-Infinity, t1=Infinity;
  [[px, dx], [py, dy]].forEach(([p, d])=>{ if(Math.abs(d)<1e-6) return; const a1=(0-p)/d, a2=(100-p)/d; t0=Math.max(t0, Math.min(a1, a2)); t1=Math.min(t1, Math.max(a1, a2)); });
  CC_BUS={x1:px+dx*t0, y1:py+dy*t0, x2:px+dx*t1, y2:py+dy*t1, px, py, dx, dy};
  CC_BUS_KEY=key;
  return CC_BUS;
}
// Расстояние от центра коробки до линии автобуса, в процентах ширины картинки.
function ccBusDist(z){
  const b=ccBus(); if(!b || !z) return 0;
  const key=(typeof ACTIVE_LANDING_SET!=='undefined') ? ACTIVE_LANDING_SET : '', ar=String(MAP_ASPECT[key]||'1/1').split('/');
  const k=(Number(ar[1])||1)/(Number(ar[0])||1);
  const x=z.x+z.w/2-b.px, y=(z.y+z.h/2-b.py)*k;
  return Math.abs(x*b.dy*k-y*b.dx)/Math.hypot(b.dx, b.dy*k);
}
function ccBusLate(z){ return CC_BUS_LATE*clamp((ccBusDist(z)-CC_BUS_NEAR)/(CC_BUS_FAR-CC_BUS_NEAR), 0, 1); }
function ccBusOpen(n, z){ return Math.max(1, Math.round(n*(1-ccBusLate(z)))); }
/* Комната лута и что из неё в силу: своя точка, точка после выигранной стычки и соседняя после ухода (его слово 13.11:
   «в батл рояль не лутаются сундуки» — в BR своя коробка почти всегда с соседями, и лут шёл строкой). merge — влить в то,
   что уже в руках (ушёл на соседнюю), иначе пак из рук. */
async function ccLootRoomRun(you, ui, host, o, say, merge){
  const T=L(), set=o.set;
  const res=await ccLootRoom(host, Object.assign({mates:ccLrMates(), bus:ccBus()}, o));
  const p=ccPackFloor(res.pack, set, Math.random);
  // Отряд: сила лучшего пака из всех рук (как у комнаты); один — пак из рук. Минус ошибки дележа и нехватка патронов.
  you._loot=merge ? ccPackMerge(you._loot, p, set, Math.random) : p; you._mateLoot=res.mates;
  ccAddGamePow(you, ccPackPow(res.powPack ? ccPackFloor(res.powPack, set, Math.random) : p)-(res.pen||0));
  you._mats=clamp(ccMats(you)+res.mats, 0, CC_MATS_FULL);
  you._medals=res.medals||[];
  const warn=[res.ammoLow ? T.lrAmmoLow : '', res.split ? T.lrSplitPen(res.split) : '', res.boss && !res.bossDown ? T.lrBossLeft(res.boss, CC_MYTHIC_POW) : ''].filter(Boolean).join(' · ');
  await say(T.ccSiteOwn(res.opened, ccPackLine(you._loot))+(warn ? ' · '+warn : ''), warn ? false : null);
  return res;
}
async function ccAskSite(you, ui){
  if(!you) return;
  const game=you._game, sq=you._sq;
  if(!game || !game.squads) return;
  const zone=you.landingZone;
  /* Соперники на точке — все, кроме своего напарника. Условие симметричное:
     'isMate' есть только у ЧУЖОЙ вкладки моего напарника, поэтому у одного
     клиента напарник из списка выпадал, а у второго — нет, и на общей точке
     один считал стычку, а другой сундуки. В гонке (isRival) всё как было. */
  const rivals=zone ? game.squads.filter(s=>s.alive && s.team!==you && !s.team.isMate &&
      !(s.team.isYou && you.isMate) && s.team.landingZone===zone).map(s=>s.team) : [];
  const set=ccLootSet();
  const T=L();
  ccMpMark('st0'+(you.mpTag||''));
  // Сундуков на точке — сколько их там стоит (fortnite.gg / вики) или по луту коробки
  // (ccSiteChests); открываем до первой зоны не всё (ccSiteOpen); уходя — доля
  // сундуков ближней свободной коробки.
  // Автобус (ccBus): далеко от линии — сели позже, сундуков до зоны меньше. Комнате так же (ccRoomSite).
  const nPoi=ccSiteChests(zone), nOpen=ccBusOpen(ccSiteOpen(nPoi), zone);
  const busLate=Math.round(ccBusLate(zone)*100);
  const free=ccFreeBoxNear(game, you);
  /* Доля соседней коробки — ПОСЛЕ потолка открытия, а не до. Тестер, 16.09:
     «сплитнуть без файта — лут примерно такой же, как анкон». Так и было: у
     настоящего счёта сундуков (fortnite.gg, 50–100 на коробку) половина всё
     равно упиралась в потолок ccSiteOpen, и уход давал те же 24 сундука, что
     своя точка. Замер career-pack-chests-probe: 24 сундука — сила пака 3.4,
     12 — 2.4; теперь уход стоит этот балл. */
  const nLeave=Math.max(1, Math.round(ccSiteOpen(ccSiteChests(free))*CC_CHESTS_LEAVE_SHARE));
  const at=(ccSiteReal(zone) ? T.ccSiteAt(nPoi, nOpen, ccSiteSrc())+' · ' : '')+(busLate>0 ? T.lrBusLate(busLate)+' · ' : '');
  const mine=ccChestPack(Math.random, set, nOpen);
  const say=async (line, ok)=>{ if(ui && ui.note) ui.note(line); await ccChoiceResult(ui && ui.map, line, ok); };
  if(!rivals.length){
    /* Своя точка без чужих — сундуки открываются НА ЭКРАНЕ, а не строкой на две
       секунды: отзыв «нет симуляции на локации, о которой я
       писал». Панель одна кнопка — что выпало из восьми сундуков, какой пак
       собран и сколько он стоит; под скипом и в симуляции берётся сама. */
    /* Три хода (см. CC_SITE_FAST_SHARE): быстро — часть того же броска, всё — тот же
       бросок плюс новые сундуки; пак «забрать и идти» показан целиком, остальные
       два — числом сундуков и ценой в ресах. Под скипом и в симуляции — «забрать». */
    const nFast=Math.max(1, Math.round(nOpen*CC_SITE_FAST_SHARE));
    const nFull=Math.min(Math.round(nPoi), nOpen*CC_SITE_FULL_MUL);
    const extra=[]; for(let i=nOpen;i<nFull;i++) extra.push(ccChestRoll(Math.random, set));
    // Лут руками (ccLootRoom): сундуки по одному, свой инвентарь. Онлайн и пропуск — три кнопки ниже.
    const lrHost=ccLootRoomOn() ? ((ui && ui.map) || document.getElementById('majorStages')) : null;
    if(lrHost){
      await ccLootRoomRun(you, ui, lrHost, {rolls:(mine.rolls||[]).concat(extra), nFast, nOpen, at, zone, set, busLine:busLate>0 ? '' : T.lrBusNear}, say);
      ccMpMark('st1:room');
      return;
    }
    const packs={fast:ccPackFloor(ccPackFromRolls(mine.rolls.slice(0, nFast)), set, Math.random), take:mine,
                 full:nFull>nOpen ? ccPackFloor(ccPackFromRolls(mine.rolls.concat(extra)), set, Math.random) : mine};
    const pv=ccPackPow(mine);
    const labels=[...(mine.weapons||[]), ...(mine.heals||[]), mine.move].filter(Boolean).map(ccItemLabel).join(' · ');
    const opts=[
      {id:'fast', icon:CC_CHOICE_ICON.run, title:T.ccSiteFast, note:T.ccSiteFastNote(nFast, CC_MATS_ZONE), pack:packs.fast},
      {id:'take', def:true, icon:ccItemIconHTML(mine.weapons[0], CC_CHOICE_ICON.chest), title:T.ccSiteTake,
       note:labels+' — '+T.ccSitePackPow(pv), pack:mine}
    ];
    if(nFull>nOpen) opts.push({id:'full', icon:CC_CHOICE_ICON.chest, title:T.ccSiteFull, note:T.ccSiteFullNote(nFull, nPoi, CC_MATS_ZONE), pack:packs.full});
    const titleOf=v=>v==='fast' ? T.ccSiteFast : v==='full' ? T.ccSiteFull : T.ccSiteTake;
    const pick=(await ccMpChoose('own'+(you.mpTag||''), async function(){
      return (await ccChoiceBox(T.ccSiteOwnTitle, at+T.ccSiteOwnHint(nOpen), opts, ui && ui.map, null, 'site')).id;
    }, titleOf)).v;
    const id=packs[pick] && opts.some(o=>o.id===pick) ? pick : 'take';
    const p=packs[id];
    you._loot=p; ccAddGamePow(you, ccPackPow(p));
    if(id==='fast') you._mats=Math.min(CC_MATS_FULL, ccMats(you)+CC_MATS_ZONE);
    if(id==='full') you._mats=Math.max(0, ccMats(you)-CC_MATS_ZONE);
    ccMpMark('st1:'+id);
    await say(T.ccSiteOwn(p.chests, ccPackLine(p)), null);
    return;
  }
  // Стычка — с сильнейшими из тех, кто сел на ту же коробку; остальные остаются движку.
  const foe=rivals.slice().sort((a,b)=>(b._pc||b.pow||0)-(a._pc||a.pow||0))[0];
  const theirs=ccChestRoll(Math.random, set);
  const eMine=CC_LOOT_EDGE[ccRarityKey(mine.first.weapon.rarity)]||0, eFoe=CC_LOOT_EDGE[ccRarityKey(theirs.weapon.rarity)]||0;
  const p=ccSiteOdds(you, foe, eMine, eFoe);
  const bare=t=>String(t.name||'').replace(/<[^>]+>/g,'').trim();
  const names=rivals.map(bare).join(' · ');
  const pickId=(await ccMpChoose('site'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(T.ccSiteTitle(names), at+T.ccSiteHint(ccItemLabel(mine.first.weapon), ccItemLabel(theirs.weapon)), [
      {id:'leave', def:true, icon:CC_CHOICE_ICON.run, title:T.ccSiteLeave, note:T.ccSiteLeaveNote(nLeave, nOpen)},
      {id:'fight', icon:ccItemIconHTML(mine.first.weapon, CC_CHOICE_ICON.fight), title:T.ccSiteFight,
       note:T.ccSiteFightNote(Math.round(p*100), nOpen, eMine, eFoe)}
    ], ui && ui.map, null, 'site')).id;
  }, function(v){ return v==='fight' ? T.ccSiteFight : T.ccSiteLeave; })).v;
  ccMpMark('a1:'+pickId);
  if(pickId==='fight'){
    const won=Math.random()<p;
    ccMpMark('w1:'+(won?1:0));
    // Смерть на высадке — как её считает движок (droppedOut → стычки, аура).
    const fs=game.squads.find(s=>s.team===foe);
    if(won){
      if(fs) fs.droppedOut=true;
      game.eliminate(foe, you);
      const lh=ccLootRoomOn() ? ((ui && ui.map) || document.getElementById('majorStages')) : null;
      if(lh){
        await say(T.ccSiteWon(bare(foe), nOpen), true);
        await ccLootRoomRun(you, ui, lh, {rolls:mine.rolls||[], nFast:Math.max(1, Math.round(nOpen*CC_SITE_FAST_SHARE)), nOpen, at, zone, set}, say);
        return;
      }
      you._loot=mine; ccAddGamePow(you, ccPackPow(mine));
      await say(T.ccSiteWon(bare(foe), nOpen), true);
    } else {
      if(sq) sq.droppedOut=true;
      game.eliminate(you, foe);
      await say(T.ccSiteLost(bare(foe)), false);
    }
    return;
  }
  if(free){ you.landingZone=free; if(sq){ sq.x=free.x+free.w/2; sq.y=free.y+free.h/2; } }
  const small=ccChestPack(Math.random, set, nLeave);
  const lh=ccLootRoomOn() ? ((ui && ui.map) || document.getElementById('majorStages')) : null;
  if(lh){
    await ccLootRoomRun(you, ui, lh, {rolls:small.rolls||[], nFast:Math.max(1, Math.round(nLeave*CC_SITE_FAST_SHARE)), nOpen:nLeave, at:'', zone:free||zone, set}, say, true);
    return;
  }
  you._loot=ccPackMerge(you._loot, small, set, Math.random); ccAddGamePow(you, ccPackPow(small));
  await say(T.ccSiteLeft(nLeave, ccPackLine(small)), null);
}
// Комната открывает свои сундуки тем же правилом; под симуляцией (you=null) — и игрок.
// Сундуков у каждого — сколько стоит в его коробке (ccSiteChests) и сколько отряд
// успевает открыть (ccSiteOpen), как у игрока.
function ccRoomSite(field, you){
  const set=ccLootSet();
  field.forEach(t=>{
    if(you && (t===you || t.isMate || t.isRival)) return;   // людям (и сопернику по гонке) — вопрос, не бросок
    const p=ccChestPack(Math.random, set, ccBusOpen(ccSiteOpen(ccSiteChests(t.landingZone)), t.landingZone));
    t._loot=p; ccAddGamePow(t, ccPackPow(p));
  });
}
const CC_LOOT_POI_ODDS=0.4, CC_LOOT_POI_BONUS=4, CC_LOOT_POI_FAIL=2;
async function ccAskLoot(you, ui){
  if(!you) return;
  ccMpMark('l0'+(you.mpTag||''));
  // Свой пак — тот, что собран из сундуков на точке (ccAskSite); соседний — чужой.
  const mine=you._loot||ccLootPack(), other=ccLootPack();
  // С чем уйдёшь с соседней точки: своё плюс её лучшее (ccPackMerge), а не её пак вместо своего.
  const merged=ccPackMerge(mine, other, null, Math.random);
  ccMpMark('l1');
  const name=o=>o ? esc(o.name) : '-';
  const listOf=p=>[...p.weapons, ...p.heals, p.move].map(name).join(' · ');
  /* Спрашивают обоих, а решение всё равно одно.

     Правка: «дай возможность двоим кликать вариант… двоем
     нужно нажать одно и тоже если, два разных нажало рандомно тогда
     выбирается». Раньше здесь решал игл, а второй смотрел.

     По проводу уходит ТОЛЬКО id выбора. Паки считать и слать незачем: они у
     обоих уже одинаковые (ccLootPack выше тянет из сида вечера), а ссылки на
     объекты по сети всё равно не переживают. Бросок исхода остаётся общим и
     на своём месте — ни окно выбора, ни окно ожидания броска не тратят, так
     что счёт вызовов Math.random у двоих не разъезжается; монетка на
     несогласии тратит по одному у каждого, и оба доходят до неё одинаково.
     Спрашивают одного — того, чья это роль. См. ccMpChoose и ccMpSeedOn. */
  const pickId=(await ccMpChoose('loot'+(you.mpTag||''), async function(){
    return (await ccChoiceBox(L().ccLootTitle, L().ccLootHint,
      [{id:'take', title:L().ccLootTake, note:listOf(mine)+' — '+L().ccLootTakeSafe, pack:mine,
        icon:ccItemIconHTML(mine.weapons[0], CC_CHOICE_ICON.home)},
       {id:'swap', title:L().ccLootSwap, icon:ccItemIconHTML(other.weapons[0], CC_CHOICE_ICON.contest),
        note:listOf(merged)+' — '+L().ccLootSwapRisk(CC_LOOT_POI_BONUS, CC_LOOT_POI_FAIL,
          Math.round(CC_LOOT_POI_ODDS*100)), pack:merged}],
      ui && ui.map, null, 'loot')).id;
  }, function(v){ return v==='swap' ? L().ccLootSwap : L().ccLootTake; })).v;
  ccMpMark('a3:'+pickId);
  // Остался на своей — ничего не выиграл и ничего не потерял. Сказать об этом
  // всё равно надо: молчащая панель читается как «выбор не засчитался».
  // Что подобрал — то и показывается потом в строке «что у меня есть».
  you._loot = pickId==='swap' ? merged : mine;   // улучшает, не меняет
  if(pickId!=='swap'){
    if(ui && ui.note) ui.note(L().ccLootKept);
    await ccChoiceResult(ui && ui.map, L().ccLootKept, null);
    return;
  }
  // Побежал на чужую точку — либо забрал её и ушёл богаче, либо разменялся и
  // добираешь круг битым.
  const won=Math.random()<CC_LOOT_POI_ODDS;
  ccAddGamePow(you, won ? CC_LOOT_POI_BONUS : -CC_LOOT_POI_FAIL);
  ccMpMark('w3:'+(won?1:0));
  const line = won ? L().ccLootGot(CC_LOOT_POI_BONUS) : L().ccLootHurt(CC_LOOT_POI_FAIL);
  if(ui && ui.note) ui.note(line);
  await ccChoiceResult(ui && ui.map, line, won);
}
/* Восьмая зона. Хайграунд — монетка: выиграл контест, забрал высоту, иначе
   ничего и остаток игры снизу. Рефреш даёт меньше, но наверняка. */
/* КОНЦОВКА ДВУМЯ ОСТАНОВКАМИ. В трёх играх Гранд-финала FNCS 2026 EU (tools/real-matches.json) к восьмому кругу
   живы 21–25 отрядов из 50, и дальше до конца уходят 44% всех убийств игры, а вопрос там был один.
   Двигающиеся круги (ccAskMoving): ротация заново, её читает движок (team._rot, zone-sim runPhase), или третья
   сторона через движок (ccThirdApply). Выживание по реплеям Major 2 EU, зоны 8+: вышли сразу, дожили 63%; со
   штормом 49% (CC_END_ROT). По умолчанию ответ четвёртой зоны, так что под пропуском баланс не сдвинут.
   Последние отряды (ccAskLast): держать место, третьить или давить ради элимов. Исходы стычки концовки по тем же
   реплеям (312 сторон): разошлись 30%, размен 20%, соседа выбили 19%, выбили самих 31% (CC_FIGHT_LATE).
   В финале победитель в среднем брал 6.3 элима, места 2–5 по 5.2, 11–20 по 2.5. */
const CC_END_ROT={early:63, with:49};
const CC_FIGHT_LATE=Object.assign({}, CC_FIGHT, {decide:0.50, trade:0.20});
// Номера кругов двух остановок по шторму вечера: 11 кругов → 10 и 11, 9 кругов → только 9.
function ccEndZones(){
  const n=(typeof CC_GAME_PHASES!=='undefined' && CC_GAME_PHASES && CC_GAME_PHASES.length) || 0;
  return n>=11 ? {move:10, last:11} : n>=9 ? {move:9, last:0} : {move:0, last:0};
}
const ccFoeName=foe=>foe ? String(foe.name||'').replace(/<[^>]+>/g,'') : '';
/* КОНЦОВКА КАК У ПРО (его «лейт реалистичней выборы, посмотри как у про игроков», 13.11).
   1) Тэг на сюрдж — и в концовке. В финалах FNCS 2026 EU сюрдж шёл с 4-й по 10-ю зону в двух играх из трёх (см.
      CC_SURGE_FARM), и про в двигающихся кругах «тэгают» — бьют по кому угодно ради урона, чтобы не срезало. Ход тот же, что в
      меню середины (те же числа замера), и появляется по тому же правилу: сюрдж включён и запас над линией меньше CC_SURGE_SAFE.
   2) Низ в эпоху двигающихся кругов — тоннель (ccLateLowName): с 2023 года концовки FNCS играются низом через тоннели,
      высоту берут редко. Числа хода прежние, меняется название.
   3) Строка над вопросом — замер тех же реплеев (tools/real-matches.json): к 8-й зоне живы 21–25 отрядов из 50, 44% киллов
      игры случаются после неё. */
function ccLateSurgeOpt(you, T){
  const sg=ccSurgeState(you);
  if(!(sg && sg.on && (sg.gap==null || sg.gap<CC_SURGE_SAFE))) return null;
  return {id:'surge', icon:CC_CHOICE_ICON.surge, title:T.ccLateTag,
    note:T.ccMidSurgeNote(CC_SURGE_FARM, CC_SURGE_TAKEN, CC_SURGE_FARM_POW)+' · '+T.ccMidSurgeLine(sg.players, sg.at, sg.gap)};
}
async function ccLateSurgeApply(you, say, T){
  if(you._sq){ you._sq.dealt=(you._sq.dealt||0)+CC_SURGE_FARM; you._sq.taken=(you._sq.taken||0)+CC_SURGE_TAKEN; }
  ccAddGamePow(you, -CC_SURGE_FARM_POW);
  await say(T.ccMidSurgeGot(CC_SURGE_FARM, CC_SURGE_TAKEN, CC_SURGE_FARM_POW), true);
}
function ccLateLowName(T){ const y=(typeof ccCalYear==='function') ? ccCalYear() : 2026; return y>=2023 ? T.ccLateTunnel : T.ccLateLg; }
function ccLateProLine(you, T){ const g=you && you._game, n=g && g.aliveCount ? g.aliveCount() : 0; return n ? T.ccLatePro(n) : ''; }
/* ОКНО КОНЦОВКИ (8-я зона): позиция и стойка до конца игры одним окном. Сила позиции — её ценность в ситуации против хода
   по умолчанию (низ, при мало ресов рефреш). Третьить — настоящая стычка через движок (ccThirdPairApply). Стойка уходит в
   you._stance: двигающиеся круги и последние отряды играются по ней без окон (ccAutoMoving, ccAutoLast). Онлайн: стойка едет
   вместе с ходом одной строкой «ход|стойка» через ccMpChoose, у обоих одно и то же. */
function ccEndName(T, id){ return id==='lg' ? ccLateLowName(T) : T[CC_LATE_NAME[id]]||id; }
function ccEndDefault(you){ return (!CC_ZB && ccMatsLow(you)) ? 'refresh' : 'lg'; }
async function ccAskEndWindow(you, ui){
  if(!you) return;
  ccMpMark('a8s'+(you.mpTag||''));
  const T=L(), sit=ccSitOf(you), def=ccEndDefault(you);
  you._stance='hold';
  const ids=CC_SIT_END_IDS.filter(id=>ccSitAvail('end', id, sit));
  const opts=ids.map(id=>({id, def:id===def, icon:CC_CHOICE_ICON[CC_LATE_ICON[id]]||CC_CHOICE_ICON.stay, title:ccEndName(T, id),
    note:ccSitFacts(T, 'end', id, sit)+(ccSitUseless('end', id, sit) ? ' · '+T.sitUseless : '')}));
  opts.sort((a,b)=>(b.def?1:0)-(a.def?1:0));   // ход по умолчанию первым: пропуск и сторожа берут первую кнопку
  const chips='<div class="cc-chips" data-hold="1"><span class="cc-chips-h">'+esc(T.esChips)+'</span>'+CC_SIT_STANCE_IDS.map(id=>
    '<button type="button" class="cc-chip'+(id==='hold' ? ' on' : '')+'" data-chip="'+id+'">'+esc(id==='hold' ? T.lsHold : T.lsPush)+'</button>').join('')+
    '<small>'+esc(T.lsHold+': '+ccSitFacts(T, 'stance', 'hold', sit)+' · '+T.lsPush+': '+ccSitFacts(T, 'stance', 'push', sit))+'</small></div>';
  const pro=ccLateProLine(you, T);
  let stance='hold';
  const v=(await ccMpChoose('late'+(you.mpTag||''), async function(){
    const pr=ccChoiceBox(T.ccLateTitle, ccKitLine(you)+(pro ? '<br>'+esc(pro) : '')+chips, opts, ui && ui.map, null, 'late');
    const host=(ui && ui.map) || document.getElementById('majorStages');
    const box=ccChoiceIn(host);
    if(box) box.querySelectorAll('[data-chip]').forEach(b=>b.addEventListener('click', ()=>{
      stance=b.dataset.chip; box.querySelectorAll('[data-chip]').forEach(x=>x.classList.toggle('on', x===b)); }));
    return (await pr).id+'|'+stance;
  }, function(x){ const p=String(x).split('|'); return ccEndName(T, p[0])+' · '+(p[1]==='push' ? T.lsPush : T.lsHold); })).v;
  const parts=String(v).split('|');
  const pickId=ids.indexOf(parts[0])>=0 ? parts[0] : def;
  you._stance=parts[1]==='push' ? 'push' : 'hold';
  ccMpMark('a8:'+pickId+'|'+you._stance);
  const say=async (line, ok)=>{ if(ui && ui.note) ui.note(line); await ccChoiceResult(ui && ui.map, line, ok); };
  if(pickId==='third'){
    const pair=ccThirdPair(you);
    if(pair){ const res=ccThirdPairApply(you, pair); await say(T.tpGot(res), res.out==='win' ? true : res.out==='die' ? false : null); return; }
  }
  const gain=Math.round(ccSitValue('end', pickId, sit)-ccSitValue('end', def, sit));
  if(gain) ccAddGamePow(you, gain);
  if(pickId==='refresh') ccMatsFill(you);
  if(pickId==='hg') ccKitSpend([you], CC_MATS_HG_EXTRA);
  await say(ccEndName(T, pickId)+(gain ? ' · '+(gain>0 ? '+' : '')+gain : '')+' · '+(you._stance==='push' ? T.lsPush : T.lsHold), gain>0 ? true : gain<0 ? false : null);
}
// Концовка по стойке, без окна: держать — ничего, давить — стычка с ближайшим (числа концовки CC_FIGHT_LATE).
async function ccAutoEndFight(you, ui, tag){
  if(!you || you._stance!=='push') return;
  const game=you._game, foe=game && game.nearest ? game.nearest(you) : null;
  if(!foe) return;
  const T=L(), gun=you._loot && you._loot.weapons && you._loot.weapons[0];
  const tac=ccTacOf(you._tac||'push', you, foe);
  const out=ccFightApply(you, Math.random(), foe, CC_FIGHT_LATE, tac);
  ccMpMark(tag+out);
  const line=ccFightLine(T, out, CC_FIGHT_LATE, ccFoeName(foe), gun, you, tac);
  if(ui && ui.note) ui.note(line);
}
async function ccAutoMoving(you, ui){ return ccAutoEndFight(you, ui, 'w10f:'); }
async function ccAutoLast(you, ui){ return ccAutoEndFight(you, ui, 'w11f:'); }
async function ccAskLate(you, ui){ return ccAskEndWindow(you, ui); }
async function ccAskMoving(you, ui){ return ccAutoMoving(you, ui); }
async function ccAskLast(you, ui){ return ccAutoLast(you, ui); }
function simulateGameOnMap(teams, lobbyOpts){
  teams.forEach(t=>{
    t._elims=0; t._feed=[];
    t._pos=null;   // позиция в круге для движка (chooseTarget), на одну игру
    t._tac=null; t._stance=null;   // тактика встреч и стойка концовки: из окон этой игры
    t._pf=Math.max(1, t.pow*gameForm());
    /* Что выпало форме — отдельно от того, что сделал игрок.

       Жалоба игрока: «в начале каждой игры почему-то разная
       сила, в чём проблема?». Колонка показывала _pf, то есть силу карточки,
       умноженную на бросок формы (±16% на игру, FORM_SPREAD_OPEN), — и на
       замере одна и та же связка 96 показывала 91-102 за одиннадцать игр.
       Бросок нужен движку (он откалиброван и правит дисперсию открытых
       этапов), но игроку он не виден и решать по нему нечего.

       Поэтому база броска запоминается, и колонка показывает силу карточки
       плюс то, что к ней добавили ЛУТ и ВЫСОКАЯ ЗЕМЛЯ, — ровно то, на что
       игрок влияет. См. livePow. */
    t._pfBase=t._pf;
    t._pc=Math.max(1, t._pf+(CC_ZB ? 0 : (t.closeEdge||0)));   // Zero Build: край построек не считается
  });

  // The island this game is played on — the one the landing picker put
  // everybody on, not a guess between the first two the app ever had.
  const set    = ZONE_SETS[ACTIVE_LANDING_SET] ? ACTIVE_LANDING_SET : 'm2';
  const ratio  = MAP_ASPECT[set].split('/');
  const aspect = Number(ratio[1]) / Number(ratio[0]);
  const exponent = DUEL_POW_EXPONENT_BY_MODE[squadSize] || 5;
  // Когда отряд сел (маршрут автобуса, ccBusRoute): решает стычки на высадке, resolveDropDuel.
  ccBusSetLand(teams, aspect);

  ccSetKillW(teams);
  const result = ZoneSim.simulateZoneGame(teams, {
    rng: Math.random,
    land: ZONE_SETS[set],
    phases: ccStormPhases(set, squadSize),
    // В соло-Reload возрождать некому — без напарника смерть окончательная
    // (реплеи Reload Solo Victory Cup S41: 40 → 27 к восьмому кругу, а не 40).
    respawnUntilZone: (/^r\d$/.test(set) && squadSize>1) ? CC_RELOAD_RESPAWN_ZONE : 0,
    aspect: aspect,
    startOf: t => {
      const z = t.landingZone;
      if(z) return {x: z.x + z.w/2, y: z.y + z.h/2};
      // No drop spot: the Heats and the Play-In never run the picker. Falling
      // back to one point put all fifty squads on the same pixel, and they wiped
      // each other out inside the first circle. So an unpicked squad gets a
      // rectangle off the same grid — but it lands in the middle of it, not
      // scattered across it. There are more squads than rectangles, so some of
      // them share, and sharing is the point: a squad spread to a random corner
      // of its own rectangle is out of contact range of the squad that drew the
      // same one, and a Heat would play with no landing fights at all.
      const grid = ZONE_SETS[set];
      const r = grid[(t._uid != null ? t._uid : Math.floor(Math.random()*grid.length)) % grid.length];
      return {x: r.x + r.w/2 + (Math.random()-0.5),
              y: r.y + r.h/2 + (Math.random()-0.5)};
    },
    duel: (a, b, dropping) => dropping ? resolveDropDuel(a, b) : resolveDuel(a, b, exponent),
    record: RECORD_NEXT_ZONE_GAME,
    lobbySquads: lobbyOpts && lobbyOpts.lobbySquads,
    lobbyPlayers: lobbyOpts && lobbyOpts.lobbyPlayers
  });

  LAST_ZONE_TIMELINE = result.timeline;
  LAST_ZONE_ROSTER = result.roster;
  RECORD_NEXT_ZONE_GAME = false;

  // Turn the causes the engine recorded into the feed lines the match history
  // already knows how to print.
  teams.forEach(t=>{
    const cause = t._deathCause;
    if(cause === 'storm')      t._feed.push(L().feedStorm);
    else if(cause === 'surge') t._feed.push(L().feedSurge);
    else if(cause)             t._feed.push(L().feedDied(String(cause).replace(/<[^>]+>/g,'')));
  });

  return result.order;
}

/* ===== Решения внутри игры =================================================
   Mid game после 2 зоны выбор лута, late game на 8 зоне: высота (50/50), низ
   или рефреш. Лут платит той же монетой, что драфтовый лоадаут
   (LOADOUT_POW_SCALE и пулы предметов), иначе предмет значил бы в карьере не то,
   что в драфте. Выигранная высота примерно как хороший лут, рефреш половина её.
   Сила кладётся в _pf/_pc, а не в pow: pow принадлежит вечеру, это одной игре. */
/* Прибавки замерены tools/career-choice-value-probe.js: 500 игр, прибавка на восьмой зоне пошаговым движком.
     решение               ср. место  побед %  топ-10 %
     ничего (лоуграунд)       28.24      5.4     31.2
     рефреш +2                28.13      5.2     30.4
     хайграунд +6             27.20      7.2     36.0
   +4 у хайграунда тонул в шуме. Рефреш поэтому половина хайграунда: +3 наверняка против +6 монеткой.
   Разброс пробы на 500 играх ±1 место и ±2% побед, строки с монеткой по ней не сравнивать. */
const CC_HG_ODDS=0.5;              // «50 на 50» — отзыв
/* +10 и −10 — отзыв: «сделай хайграунд взять +10, а нет −10».
   Было +6 / −2. Что это меняет по смыслу: ожидание хода становится ровно
   нулём (0.5·10 − 0.5·10), то есть высота больше не покупает среднее — она
   покупает только потолок, и платит за него ровно столько же. Рядом стоит
   рефреш с гарантированными +3, и теперь между ходами не «чуть лучше — чуть
   хуже», а «надёжно плюс три» против «орёл или решка на десять». */
// Рефреш с 3 сентября — риск на пять, а не верные три: ожидание то же (+3),
// см. таблицу у CC_LATE_MOVES. При полных ресах прибавка половинная.
const CC_HG_POW=10, CC_REFRESH_POW=5;
/* Хайграунд: взял +10, провалил −10 (было +6/−2, и проваленный размен ничего не стоил). Замер career-choice-value-probe, 600 игр:
     решение            было +6/−2            стало +10/−10
     высота взята       26.56 · 3.2% · 36.8   27.03 · 7.2% · 37.0
     высота провалена   29.30 · 3.0% · 28.0   30.21 · 0.5% · 23.0
     (ср. место · побед % · топ-10 %)
   Ожидание ноль против +3 у рефреша: высота покупает потолок, а не среднее. Шум на 600 играх ~±1 место и ±2% побед.
   Комната играет теми же числами (ccRoomLate). */
const CC_HG_FAIL=10;
/* Ходы восьмой зоны. Ожидание = odds*pow - (1-odds)*fail:
   низ 0/0 (ожид. 0), рефреш 100% +3 (ожид. +3), хайграунд 50% +10/-10 (ожид. 0,
   потолок +10). Раньше были ещё «третьить» (35% +16/-8) и «отжать точку»
   (70% +6/-4), убраны. Числа подобраны так, чтобы ни один ход не бил другой и по
   среднему, и по потолку. Комната играет тем же меню (ccRoomLate): бонус только
   игроку ломает откалиброванную лестницу (career-choice-balance-probe). */
/* Рефреш рискованный: удаётся в 75%, провал −3. Прибавка зависит от ресов: при полных половинная,
   при пустых полная, а отказ идти даёт штраф на концовку (CC_MATS_PEN). Ожидание при пустых 0.75·5−0.25·3 = +3,
   как у старого гарантированного рефреша, так что калибровка вокруг не едет. Без риска рефреш бил лоуграунд
   по всем числам. Игра за зоной (edge): 55% +8 / 45% −8. Ни один ход не бьёт другой и по шансу, и по потолку:
     ход         шанс   +    −   ожидание  потолок
     низ          -     0    0      0        0
     рефреш      75%   5*   3   +3 / +0*    5*     (* при полных ресах вдвое меньше)
     за зоной    55%   8    8      0        8;  хайграунд 50%  10  10  0  10 */
const CC_EDGE_ODDS=0.55, CC_EDGE_POW=8, CC_EDGE_FAIL=8;
/* МИД ГРАУНД — его страница «simulation» 7 сентября: «в какой позиции играть:
   хг, мид граунд, лоу граунд — чем выше, тем сложнее, но больше повер».
   Середина лестницы между высотой и низом: 65% на +6, провал −4, ожидание
   +2.5, потолок 6 — ниже высоты по потолку, выше по шансу, и не бьёт рефреш
   при пустых ресах (+3). Числа подобраны под лестницу, не замер. */
const CC_MID_ODDS=0.65, CC_MID_POW=6, CC_MID_FAIL=4;
const CC_REFRESH_ODDS=0.75, CC_REFRESH_FAIL=3;
/* ТРЕТЬЯ СТОРОНА — снова в меню, но уже ПО ЗАМЕРУ, и через движок. Слово
   6 сентября: «делай дальше». Ход стоял здесь до 1 сентября как +16/−8 на
   35% — числа с потолка, и его сняли. Теперь это не бросок силы, а реальная
   стычка: сосед выбит движком (элим, ресы с трупа) или выбиты мы.

   Замер (три реплея финала Major 2 EU, 2 августа 2026): третья сторона =
   отряд, впервые ударивший одну из двух дерущихся команд через 3 с после
   начала их стычки и до её конца плюс 15 с; исход — за 30 с после его первого
   выстрела. Концовка (зоны 8+), 156 стычек и 108 заходов третьими (69%):
   33% кончаются чужим килом, 17% — собственной смертью третьего, 3% —
   потерей игрока, 47% — постреляли и разошлись. Середина (96 заходов): 32%
   кил, 2% смерть, 63% разошлись — там третьих ловят редко. */
const CC_THIRD={kill:0.33, die:0.17, pow:6, dmg:70};
const CC_LATE_MOVES=[
  {id:'hg',      pow:CC_HG_POW,      odds:CC_HG_ODDS,       fail:CC_HG_FAIL},
  {id:'mid',     pow:CC_MID_POW,     odds:CC_MID_ODDS,      fail:CC_MID_FAIL},
  {id:'edge',    pow:CC_EDGE_POW,    odds:CC_EDGE_ODDS,     fail:CC_EDGE_FAIL},
  // real: решается движком (ccThirdApply), не броском силы; комната его не ходит.
  {id:'third',   pow:CC_THIRD.pow,   odds:CC_THIRD.kill,    fail:0, real:true},
  {id:'refresh', pow:CC_REFRESH_POW, odds:CC_REFRESH_ODDS,  fail:CC_REFRESH_FAIL, mats:true},
  {id:'lg',      pow:0,              odds:1,                fail:0}
];
/* Что делает третья сторона с отрядом — отдельно от вопроса, чтобы
   проверялось. r — бросок [0,1); foe — ближайший сосед (его стычку и третьим).
   Без соседа выбить некого и погибнуть не от кого — «постреляли». */
function ccThirdApply(you, r, foe){
  const sq=you._sq, game=you._game;
  const can=!!(foe && game && game.eliminate);
  if(r<CC_THIRD.kill && can){
    game.eliminate(foe, you);
    ccAddGamePow(you, CC_THIRD.pow);
    you._mats=Math.min(CC_MATS_FULL, ccMats(you)+CC_FIGHT.mats);
    return 'win';
  }
  if(r<CC_THIRD.kill+CC_THIRD.die && can){
    game.eliminate(you, foe);
    return 'die';
  }
  if(sq){ sq.dealt=(sq.dealt||0)+CC_THIRD.dmg; sq.taken=(sq.taken||0)+Math.round(CC_THIRD.dmg/2); }
  return 'none';
}
/* ТРЕТЬЯ СТОРОНА В СЕРЕДИНЕ (план 125, пункт 2). На 5-й и 7-й зоне, если два чужих отряда стоят ближе CC_THIRD_PAIR друг к
   другу (дерутся) и оба ближе CC_THIRD_NEAR к нам, в меню середины есть «третьить». Пока доехали, их файт мог решиться сам
   (CC_THIRD_SELF): проигравшего выбивает движок, третьим идём на выжившего. Шансы — CC_THIRD (замер концовки) с поправкой на
   силу: ×(0.5+p) на кил, ×(1.5−p) на смерть, p — дуэльная формула против цели. Если оба живы и цель выбита, второго
   добиваем с CC_THIRD_BOTH (он тоже битый) за половину прибавки. Поправки и CC_THIRD_SELF/BOTH — решение, не замер. */
/* Сколько сифон отнимает у третьей стороны: при 50 сразу шанс выбить ×0.7, меньше сифона — меньше; «за время» (hot) — как 60%
   от суммы: победитель хилится, пока ты подходишь, но не мгновенно. Настройка, не замер. */
const CC_SIPHON_TP=0.3;
function ccSiphonTp(s){ if(!s) return 1; const eff=(s.split ? s.split*2 : s.hp)*(s.hot ? 0.6 : 1); return 1-CC_SIPHON_TP*Math.min(1.2, eff/50); }
const CC_THIRD_PAIR=6, CC_THIRD_NEAR=22, CC_THIRD_SELF=0.5, CC_THIRD_BOTH=0.5;
function ccThirdPair(you){
  const game=you && you._game, me=you && you._sq;
  if(!game || !game.squads || !me || !me.alive || !game.eliminate) return null;
  const near=game.squads.filter(s=>s.alive && s!==me && s.team!==you && !s.team.isMate && Math.hypot(s.x-me.x, s.y-me.y)<CC_THIRD_NEAR);
  let best=null, bd=Infinity;
  for(let i=0;i<near.length;i++) for(let j=i+1;j<near.length;j++){
    const d=Math.hypot(near[i].x-near[j].x, near[i].y-near[j].y);
    if(d<CC_THIRD_PAIR && d<bd){ bd=d; best={a:near[i], b:near[j]}; }
  }
  return best;
}
function ccThirdOdds(you, foe){
  const p=ccFightWinOdds(you, foe);
  const kill=clamp(CC_THIRD.kill*(0.5+p), 0.05, 0.7), die=clamp(CC_THIRD.die*(1.5-p), 0.02, 0.5);
  return {kill, die:Math.min(die, 1-kill)};
}
function ccThirdPairApply(you, pair, rr){
  const rnd=rr||Math.random, game=you._game, sq=you._sq;
  const res={out:'none', self:false, both:false, pow:CC_THIRD.pow, dmg:CC_THIRD.dmg};
  let tgt=pair.a.team, oth=pair.b.team;
  if(rnd()<CC_THIRD_SELF){
    // Их файт кончился без нас: победителя называет та же дуэльная формула.
    const pa=ccFightWinOdds(pair.a.team, pair.b.team), aWon=rnd()<pa;
    const w=aWon ? pair.a.team : pair.b.team, l=aWon ? pair.b.team : pair.a.team;
    game.eliminate(l, w);
    res.self=true; res.w=ccFoeName(w); res.l=ccFoeName(l);
    tgt=w; oth=null;
  }
  res.t=ccFoeName(tgt); res.o=oth ? ccFoeName(oth) : '';
  const o=ccThirdOdds(you, tgt), r=rnd();
  // Сифон эпохи (zone-sim siphonFor): победитель чужого файта уже хилится за кил, прийти на готовое труднее.
  const sph=CC_GAME_PHASES && CC_GAME_PHASES.siphon;
  if(res.self && sph){ const f=ccSiphonTp(sph); o.kill*=f; o.die=Math.min(1-o.kill, o.die/f); res.siphon=true; }
  if(r<o.kill){
    game.eliminate(tgt, you);
    ccAddGamePow(you, CC_THIRD.pow);
    you._mats=Math.min(CC_MATS_FULL, ccMats(you)+CC_FIGHT.mats);
    res.out='win';
    if(oth && rnd()<CC_THIRD_BOTH){
      game.eliminate(oth, you);
      const half=Math.round(CC_THIRD.pow/2);
      ccAddGamePow(you, half); res.pow+=half; res.both=true;
    }
    return res;
  }
  if(r<o.kill+o.die){ game.eliminate(you, tgt); res.out='die'; return res; }
  if(sq){ sq.dealt=(sq.dealt||0)+CC_THIRD.dmg; sq.taken=(sq.taken||0)+Math.round(CC_THIRD.dmg/2); }
  return res;
}
// Ход с монеткой — тот, у которого есть чем платить за провал. Так и панель, и
// строка исхода, и комната узнают новый ход, не перечисляя его по имени.
function ccLateRisky(m){ return !!(m && m.fail>0 && m.odds<1); }
// Имена словарных строк каждого хода — по id, чтобы новый ход добавлялся
// строкой здесь, а не поиском 'hg' по файлу.
const CC_LATE_NAME={hg:'ccLateHg', mid:'ccLateMid', third:'ccLateThird', take:'ccLateTake',
                    edge:'ccLateEdge', refresh:'ccLateRefresh', lg:'ccLateLg'};
// Картинка каждого хода концовки — ключ в CC_CHOICE_ICON.
const CC_LATE_ICON={hg:'fnStair', mid:'fnFloor', third:'fnElims', take:'contest', edge:'fnStorm', refresh:'chest', lg:'stay'};
const CC_LATE_NOTE={hg:'ccLateHgNote', mid:'ccLateMidNote', third:'ccLateThirdNote', take:'ccLateTakeNote',
                    edge:'ccLateEdgeNote', refresh:'ccLateRefreshNote', lg:'ccLateLgNote'};
const CC_LATE_WON ={hg:'ccLateHgWon', mid:'ccLateMidWon', third:'ccLateThirdWon', take:'ccLateTakeWon',
                    edge:'ccLateEdgeWon', refresh:'ccLateRefreshWon'};
const CC_LATE_LOST={hg:'ccLateHgLost', mid:'ccLateMidLost', third:'ccLateThirdLost', take:'ccLateTakeLost',
                    edge:'ccLateEdgeLost', refresh:'ccLateRefreshLost'};
/* Подпись под ходом. Строка у «низа» — просто строка (прибавки нет и называть
   нечего), у остальных функция; у ходов с монеткой ей нужны все три числа,
   чтобы игрок читал цену риска, а не только награду. */
function ccLateNote(m, pow){
  const n=L()[CC_LATE_NOTE[m.id]];
  if(typeof n!=='function') return n;
  // Третья сторона: подпись — три исхода по замеру, а не «шанс / прибавка / штраф».
  if(m.real) return n(Math.round(CC_THIRD.kill*100), Math.round(CC_THIRD.die*100), CC_THIRD.pow);
  const p=pow!=null ? pow : m.pow;
  return ccLateRisky(m) ? n(p, m.fail, Math.round(m.odds*100)) : n(p);
}
/* Незнакомый ход — это чужой сейв: 'third' и 'take' лежат в журналах карьер,
   которые играли до 1 сентября. Такой ход читается как «низ» — ход без
   прибавки и без риска, самый безобидный из возможных ответов. Индексом
   отвечать нельзя: список меняется, а 'lg' — это 'lg'. */
function ccLateMove(id){
  return CC_LATE_MOVES.find(m=>m.id===id) ||
         CC_LATE_MOVES.find(m=>m.id==='lg') || CC_LATE_MOVES[CC_LATE_MOVES.length-1];
}
/* Пак лута середины игры: два оружия, два хила и мувмент — «как в драфте
   каждому игроку по 2 оружия 2 хила и 1 мувмент». Мувмента отдельным слотом в
   пулах нет, он живёт среди расходников (гарпун, слайдеры, граната), поэтому
   он и берётся оттуда — по имени, а не по выдуманному полю. */
// Гарпун и удочка отсюда убраны 16.09 (тестер: «мувмент доступен, даже когда есть только
// удочка или гарпун») — это снасти, не ротация; в слот хилки они тоже не идут (CC_CHEST_NOT_HEAL).
const CC_MOVE_ITEMS=['Seven Sliders','Overdrive Grenade',
                     'Skyline Deployer','Seven Power Gloves','Shockwave Grenade','Rocket Ram',   // Chug Splash отсюда убран 10.09: это хилка (CC_HEAL_KIT)
                     // Reload: крюк, пады, рифт и джетпак — передвижение, не хилка.
                     'Grappler','Crash Pad Jr.','Launch Pad','Super Launch Pad','Rift-To-Go','Jetpack',
                     // Chapter 5 (2024): клинок-крюк, крылья, нитро-кулаки, реактивные ботинки — передвижение.
                     'Grapple Blade','Wings of Icarus','Nitro Fists','War Machine\'s Hover Jets',
                     // Chapter 4 (2023): ударный молот, перчатки-плащ — передвижение.
                     'Shockwave Hammer','Cloak Gauntlets',
                     // Chapter 3 (2022): батут, шар, рифт из мусора — передвижение.
                     'Crash Pad','Balloon','Junk Rift',
                     // Chapter 2 (2021): ударная пусковая, надувной бык — передвижение.
                     'Shockwave Launcher','Inflate-A-Bull'];
/* Лут острова, а не один пул на все вечера. Отзыв: «посмотри
   меты в каждом сезоне компетив и добавь в каждом сезоне оружие, которое
   нужно». Остров вечера даёт careerBrSet(): дуо-год — m2 (глава 7, сезон 3) и
   с 21 августа s42 (сезон 4), трио-год — t1/t2/t3 (глава 6). У каждого свой
   пул оружия и расходников, тот же, что раздают карты драфта. */
const CC_LOOT_BY_SET={
  m1:{weapons:M1_WEAPON_POOL, heals:M1_CONSUMABLE_POOL},
  m2:{weapons:WEAPON_POOL, heals:M2_CONSUMABLE_POOL},
  s42:{weapons:S42_WEAPON_POOL, heals:S42_CONSUMABLE_POOL},
  s43:{weapons:S43_WEAPON_POOL, heals:S43_CONSUMABLE_POOL},
  t1:{weapons:T1_WEAPON_POOL, heals:T1_CONSUMABLE_POOL},
  t2:{weapons:T2_WEAPON_POOL, heals:T2_CONSUMABLE_POOL},
  t3:{weapons:T3_WEAPON_POOL, heals:T3_CONSUMABLE_POOL},
  t4:{weapons:T4_WEAPON_POOL, heals:T4_CONSUMABLE_POOL},
  f1:{weapons:F1_WEAPON_POOL, heals:F1_CONSUMABLE_POOL},
  f2:{weapons:F2_WEAPON_POOL, heals:F2_CONSUMABLE_POOL},
  f3:{weapons:F3_WEAPON_POOL, heals:F3_CONSUMABLE_POOL},
  f4:{weapons:F4_WEAPON_POOL, heals:F4_CONSUMABLE_POOL},
  e1:{weapons:E1_WEAPON_POOL, heals:E1_CONSUMABLE_POOL},
  e2:{weapons:E2_WEAPON_POOL, heals:E2_CONSUMABLE_POOL},
  e3:{weapons:E3_WEAPON_POOL, heals:E3_CONSUMABLE_POOL},
  e4:{weapons:E4_WEAPON_POOL, heals:E4_CONSUMABLE_POOL},
  k1:{weapons:K1_WEAPON_POOL, heals:K1_CONSUMABLE_POOL},
  k2:{weapons:K2_WEAPON_POOL, heals:K2_CONSUMABLE_POOL},
  k3:{weapons:K3_WEAPON_POOL, heals:K3_CONSUMABLE_POOL},
  k4:{weapons:K4_WEAPON_POOL, heals:K4_CONSUMABLE_POOL},
  j1:{weapons:J1_WEAPON_POOL, heals:J1_CONSUMABLE_POOL},
  j2:{weapons:J2_WEAPON_POOL, heals:J2_CONSUMABLE_POOL},
  j3:{weapons:J3_WEAPON_POOL, heals:J3_CONSUMABLE_POOL},
  j4:{weapons:J4_WEAPON_POOL, heals:J4_CONSUMABLE_POOL},
  h1:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL},
  g5:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL}, g6:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL}, g7:{weapons:H1_WEAPON_POOL, heals:H1_CONSUMABLE_POOL},
  h3:{weapons:H3_WEAPON_POOL, heals:H3_CONSUMABLE_POOL},
  h4:{weapons:H4_WEAPON_POOL, heals:H4_CONSUMABLE_POOL},
  i1:{weapons:I1_WEAPON_POOL, heals:I1_CONSUMABLE_POOL},
  i2:{weapons:I2_WEAPON_POOL, heals:I2_CONSUMABLE_POOL},
  i3:{weapons:I3_WEAPON_POOL, heals:I3_CONSUMABLE_POOL},
  r1:{weapons:R1_WEAPON_POOL, heals:R1_CONSUMABLE_POOL},
  r2:{weapons:R2_WEAPON_POOL, heals:R2_CONSUMABLE_POOL},
  r3:{weapons:R3_WEAPON_POOL, heals:R3_CONSUMABLE_POOL},
  r4:{weapons:R4_WEAPON_POOL, heals:R4_CONSUMABLE_POOL}
};
/* Какой круг Reload идёт сейчас — по дню карьеры (окна кругов из CAREER_YEAR): пул лута берётся
   у круга, а не у острова — острова чередуются игра через игру (ccRelIsland), а Reload-вечера
   Victory Cup и Чемпионат круга тоже играют на острове r4 в свой день. */
function ccRelLootSeries(){
  let d=null; try{ d=(CAREER && CAREER.career) ? String(careerToday()).slice(5) : null; }catch(e){ d=null; }
  if(!d) return 'r4';
  return d<'02-13' ? 'r1' : d<'05-01' ? 'r2' : d<'06-12' ? 'r3' : 'r4';
}
function ccLootSet(set){
  let s=set;
  // Остров Reload на столе (r1–r4) — вечер Reload: лут его круга по дню, не острова.
  if(!s && /^r[1-6]$/.test(ACTIVE_LANDING_SET||'')) return ccRelLootSeries();
  /* Драфт — лут острова своего турнира (набор карточек или выбранный остров), а не карьеры и не
     2026-го по умолчанию (его слово 29.09: «где выборы, иногда предметы лута из этого года, а не того
     сезона»). Без карьеры здесь всегда выходил m2. */
  if(!s && typeof CC_DRAFT_RUN!=='undefined' && CC_DRAFT_RUN && !CAREER_RUN){
    const d=(typeof activeIslandSet==='function') ? activeIslandSet() : null;
    s=(d && CC_LOOT_BY_SET[d]) ? d : (CC_LOOT_BY_SET[ACTIVE_LANDING_SET] ? ACTIVE_LANDING_SET : null);
  }
  if(!s){ try{ s=(CAREER && CAREER.career) ? careerBrSet() : null; }catch(e){ s=null; } }
  return CC_LOOT_BY_SET[s] ? s : 'm2';
}
/* Пул острова без того, что хотфикс выключил в этом сезоне (careerHotfixTick, 16.10). Только карьера: драфт и
   менеджер играют пул острова как есть. */
function ccHotfixVault(k){
  try{
    if(typeof CC_DRAFT_RUN!=='undefined' && CC_DRAFT_RUN && !CAREER_RUN) return null;
    const cr=CAREER && CAREER.career, h=cr && cr.hotfix;
    if(!h || h.set!==k || !cr.meta || h.sid!==cr.meta.id || !(h.vault||[]).length) return null;
    return new Set(h.vault);
  }catch(e){ return null; }
}
function ccLootPool(set){
  const k=ccLootSet(set), p=CC_LOOT_BY_SET[k];
  const hv=p && ccHotfixVault(k);
  return hv ? {weapons:p.weapons.filter(w=>!hv.has(w.name)), heals:p.heals} : p;
}
function ccLootPack(rng, set){
  const pick=(pool,n)=>{
    const left=pool.slice(), out=[];
    while(out.length<n && left.length)
      out.push(left.splice(Math.floor((rng?rng():Math.random())*left.length), 1)[0]);
    return out;
  };
  const pool=ccLootPool(set);
  const heals=pool.heals.filter(ccIsHealItem);
  const moves=pool.heals.filter(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0);
  // Автомат и дробовик (отзыв), не два случайных класса; нет класса в пуле — добор ниже.
  const rifles=pool.weapons.filter(w=>w.icon==='rifle'), shotguns=pool.weapons.filter(w=>w.icon==='shotgun');
  const meta=ccProMeta(set);
  const metaPick=list=>{ if(!list.length) return null; const m=meta ? list.filter(o=>ccMetaRank(meta, o)<99) : [];
    if(!m.length) return pick(list, 1)[0];
    const r0=Math.min(...m.map(o=>ccMetaRank(meta, o))), top=m.filter(o=>ccMetaRank(meta, o)===r0);
    return pick(top, 1)[0]; };
  const pack={weapons:[metaPick(rifles), metaPick(shotguns)].filter(Boolean),
              heals:pick(heals, 2), move:metaPick(moves)};
  return ccPackFloor(pack, set, rng);   // пять слотов — пять предметов, см. ccPackFloor
}
/* Пак больше не переводится в силу. Он был прибавкой (ccLootPow, той же
   монетой, что лоадаут в драфте), пока «забрать своё» стоило четыре; с
   правкой своя точка стоит ноль, и предметы в списке остались тем,
   чем и были на экране — тем, что ты подобрал, а не тем, сколько это весит. */
// Прибавка к силе на остаток игры. Обе величины идут в _pc тоже: ближний бой
// решается им, а лучший ствол и высокая земля — как раз про ближний бой.
function ccAddGamePow(team, add){
  if(!team || !add) return;
  team._pf=Math.max(1, (team._pf||team.pow||1)+add);
  team._pc=Math.max(1, (team._pc||team._pf)+add);
}
function simulateGame(teams, lobbyOpts){
  if(teams.length===0) return [];

  // All FNCS duos play on the map. Everything else keeps the round-based model
  // below. The branch lives here rather than at the call sites so that every
  // stage of a run uses one model — a standings table assembled from two would
  // drift, and the drift would surface as averages nobody could explain.
  if(useZoneSim(teams)) return simulateGameOnMap(teams, lobbyOpts);
  let alive=teams.slice();
  const eliminationOrder=[]; // first eliminated pushed first
  // _pf is this game's power: the squad's real strength shaded by its form for
  // this game. Everything below reads _pf, never pow, so the roll applies to
  // fighting, surviving and chaining alike.
  // _pc is the same power seen from inside a fight. Ping is the only thing that
  // separates it from _pf, and it separates them in one direction: a good
  // connection wins trades, and wins nothing else. Rotating, reading the storm
  // and holding a position play the same on any ping. So _pf still decides who
  // gets caught out, and _pc decides who walks away from it.
  alive.forEach(t=>{
    t._elims=0; t._feed=[];
    t._pf=Math.max(1, t.pow*gameForm()*(CC_WORLD_FAST && CC_WORLD_FAST_NOISE ? 1+CC_WORLD_FAST_NOISE*(Math.random()*2-1) : 1));   // чужие регионы быстрой моделью — шире бросок (CC_WORLD_FAST)
    /* Что выпало форме — отдельно от того, что сделал игрок.

       Жалоба игрока: «в начале каждой игры почему-то разная
       сила, в чём проблема?». Колонка показывала _pf, то есть силу карточки,
       умноженную на бросок формы (±16% на игру, FORM_SPREAD_OPEN), — и на
       замере одна и та же связка 96 показывала 91-102 за одиннадцать игр.
       Бросок нужен движку (он откалиброван и правит дисперсию открытых
       этапов), но игроку он не виден и решать по нему нечего.

       Поэтому база броска запоминается, и колонка показывает силу карточки
       плюс то, что к ней добавили ЛУТ и ВЫСОКАЯ ЗЕМЛЯ, — ровно то, на что
       игрок влияет. См. livePow. */
    t._pfBase=t._pf;
    t._pc=Math.max(1, t._pf+(CC_ZB ? 0 : (t.closeEdge||0)));   // Zero Build: край построек не считается
  });
  const lobbySquadSize=(teams[0].squad && teams[0].squad.length) || 2;
  const DUEL_POW_EXPONENT=(DUEL_POW_EXPONENT_BY_MODE[lobbySquadSize]||5)*(CC_WORLD_FAST ? CC_WORLD_FAST_EXP : 1);
  let round=0;
  const maxRounds=teams.length+8;
  while(alive.length>1 && round<maxRounds){
    round++;
    const n=alive.length;
    const fightFraction = n>35?0.18 : n>20?0.32 : n>8?0.55 : 1;
    let fighterCount=Math.max(2, Math.round(n*fightFraction));
    fighterCount -= fighterCount%2;
    const cap=n-(n%2);
    if(fighterCount<2) fighterCount=2;
    if(fighterCount>cap) fighterCount=cap;
    // Weaker teams (lower pow) are disproportionately more likely to be the
    // ones caught out and forced into a fight this round — this is what a good
    // squad's rotations and map awareness buy them, and it is the main thing
    // that decides average placement.
    //
    // Weighting by 1/(pow + a constant) barely separated anyone: across a
    // Grand Finals field, power runs about 83 to 104, so the best team was only
    // ~20% less likely to be dragged into a fight than the worst. Real finals
    // are nowhere near that flat. Weighting by (fieldAverage / pow) raised to
    // SURVIVAL_BIAS makes the gap meaningful and, because it is a ratio against
    // the field's own average, it behaves identically at duo/trio/squad power
    // scales.
    const avgPow = alive.reduce((s,t)=>s+t._pf,0)/alive.length || 1;
    const fighters=pickWeighted(alive, t=>Math.pow(avgPow/Math.max(t._pf,1), SURVIVAL_BIAS), fighterCount);
    for(let i=fighters.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [fighters[i],fighters[j]]=[fighters[j],fighters[i]]; }
    for(let i=0;i<fighters.length;i+=2){
      const a=fighters[i], b=fighters[i+1];
      if(!alive.includes(a) || !alive.includes(b)) continue; // already caught in a chain this round
      const winner = resolveDuel(a, b, DUEL_POW_EXPONENT);
      const loser = winner===a ? b : a;
      const loserSize = (loser.squad && loser.squad.length) || 1;
      winner._elims += loserSize;
      winner._feed.push(L().feedElim(String(loser.name||'').replace(/<[^>]+>/g,'')));
      loser._feed.push(L().feedDied(String(winner.name||'').replace(/<[^>]+>/g,'')));
      eliminationOrder.push(loser);
      alive.splice(alive.indexOf(loser),1);

      // Hot streak: a strong winner can immediately catch another nearby team
      // this same round instead of getting exactly one kill and stopping —
      // this is how dominant real squads rack up multi-kill games.
      let streaker=winner, chains=0;
      while(chains<3 && alive.length>1 && Math.random()<clamp(streaker._pc/460,0.05,0.4)){
        const candidates=alive.filter(t=>t!==streaker);
        if(!candidates.length) break;
        const victim=pickWeighted(candidates, t=>1/(t._pf+30), 1)[0];
        const chainWinner = resolveDuel(streaker, victim, DUEL_POW_EXPONENT);
        const chainLoser = chainWinner===streaker ? victim : streaker;
        const chainLoserSize=(chainLoser.squad && chainLoser.squad.length) || 1;
        chainWinner._elims += chainLoserSize;
        chainWinner._feed.push(L().feedElim(chainLoser.name.replace(/<[^>]+>/g,'')));
        chainLoser._feed.push(L().feedDied(chainWinner.name.replace(/<[^>]+>/g,'')));
        eliminationOrder.push(chainLoser);
        alive.splice(alive.indexOf(chainLoser),1);
        if(chainWinner!==streaker) break; // streak broken — the streaker themselves got caught
        streaker=chainWinner; chains++;
      }
    }
  }
  if(alive.length>1){
    for(let i=alive.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [alive[i],alive[j]]=[alive[j],alive[i]]; }
  }
  const champion=alive[0];
  return [champion, ...eliminationOrder.slice().reverse()];
}

const NUM_GAMES=12;

async function runTournament(){
  resetRunRecord();
  document.getElementById('majorStages').innerHTML='';
  const rsPrev2=document.getElementById('runSummary'); if(rsPrev2) rsPrev2.innerHTML='';
  document.getElementById('lobbyBody').innerHTML='';
  clearEventPanel();
  document.getElementById('finalBanner').style.display='none';
  clearLandingResultsMap();
  skipAnimation=false;
  show('screen-results');
  ensureSkipButton();

  const {teams, zoneGroups}=await showRegularLandingPicker();
  // No more artificial leader-gap clamp — the raw simulated totals are what
  // get shown, same as a real bracket. Competitiveness now comes from tuning
  // the duel odds and streak mechanics themselves (see DUEL_POW_EXPONENT and
  // the hot-streak loop in simulateGame), not from squashing numbers after
  // the fact — which also means match history always matches the totals
  // with nothing to keep in sync.
  // Confirmed against the real point table: kills are +4 flat in every
  // mode, including squad (not scaled down). An earlier guess here scaled
  // the multiplier down for squad to fight point blowouts, but that
  // contradicted the actual scoring table — squads legitimately rack up
  // more elim points because a wipe kills more players, and that's by
  // design in the real format, not a bug to normalize away.
  await simulateGamesLive(teams, NUM_GAMES, pointsForPlace, 4, 'total', 0, null, zoneGroups,
    {mapReplay:true, choices:true, stageName:L().liveTournament});
  // Landing zone + fight now happen fresh before every one of the 12 games
  // (see pickZoneForGame, called from inside simulateGamesLive) instead of
  // once before the whole tournament — so the bonus/penalty is already
  // folded into each game's own score line, with nothing to add on after.

  const you=teams.find(t=>t.isYou);
  removeSkipButton();

  // Same as Major Finals — leader-gap cap and squad kill dampening already
  // applied inline during simulateGamesLive, so no retroactive change here.
  teams.sort((a,b)=>b.totalPts-a.totalPts || (b.wins||0)-(a.wins||0) || b.totalElims-a.totalElims);
  const place=teams.indexOf(you)+1;
  if(place===1) await celebrate(L().celKicker, L().celWinTitle, L().celWinSub, 'gold', 140);
  else if(place<=3) await celebrate(L().celKicker, L().celPodiumTitle(place), L().celPodiumSub, 'gold', 70);
  else if(place<=10) await celebrate(L().celKicker, L().celTop10Title, L().celTop10Sub, 'blue', 40);
  document.getElementById('finalBanner').style.display='block';
  document.getElementById('finalPlace').textContent='#'+place;
  document.getElementById('finalSub').textContent = place===1 ? L().victoryRoyaleResult : L().placeOfTeams(place, teams.length);
  document.getElementById('lobbyTitle').innerHTML=L().lobbyResultTitle(teams.length, NUM_GAMES);
  document.getElementById('lobbyTitle').scrollIntoView({block:'start', behavior:'smooth'});

  renderLobby(teams, you);
  renderStats();
  finalizeRunStats(squadSize, false, place, teams.length, false, false, false, you, teams);
  showShareButton(you, place, teams.length, false, teams);
  { const dr=document.getElementById('dailyResult'); if(dr && !DAILY) dr.hidden=true; }
  if(DAILY) dailyFinish(you, place, teams);
}

// Set before the results render so the standings can show what each row won.
let lobbyPrizeTable=null;
/* ---------- Драфт дня (16.10, его «3» из «что добавить, чтобы привлечь игроков») ----------

   Как Wordle: у всех в один день (по UTC) одни и те же паки, одна попытка и таблица дня на сервере
   (mp.fncsdraft.com/daily, server/src/daily.js). Режим — свободный сквад (его слово 16.10: «пусть сквад драфт будет»): все годы и все регионы, 12 игр,
   остров дня из MAP_CHOICES по номеру дня.

   Одинаковые паки: каждый пак игроков, оружия и хилок сдаётся своим генератором от «день|пак|круг|рерол»
   (dailyRoll) — сколько бросков ушло на анимацию или на чужой выбор, на сдачу не влияет. Сама симуляция
   тоже сеется днём (dailySimOn в startRun): тот же состав и те же решения дают тот же итог.

   Попытка сгорает, когда нажата «В турнир», а не на выборе: пересдать паки нельзя, переиграть плохой
   турнир — тоже. Итог дня хранится в localStorage (fd_daily), таблица — на сервере. Сервер игру не
   считает, строку присылает браузер; таблица честно это говорит. */
const DAILY_EPOCH='2026-10-17';   // 17.10 его слово «пусть с сегодняшнего дейли драфт»: #1 — 17 октября
let DAILY=null;            // {day, n, map} — пока идёт драфт дня, иначе null
let DAILY_RAND=null;       // родной Math.random на время сеянной симуляции
let DAILY_BOARD=null;      // последний ответ /daily
function dailyDay(ms){ return new Date(ms==null ? Date.now() : ms).toISOString().slice(0, 10); }
function dailyNum(day){ return Math.round((Date.parse(day+'T00:00:00Z')-Date.parse(DAILY_EPOCH+'T00:00:00Z'))/864e5)+1; }
function dailyMap(day){ return MAP_CHOICES[ccHashStr('daily-map|'+day)%MAP_CHOICES.length]; }
function dailyBase(){ const b=ccBoardBase(); return b ? b.replace(/\/board$/, '/daily') : null; }
/* Debug и локальные сборки пишут в свою таблицу дня (17.10, его «сделай ещё на debug больше драфтов»): у debug и
   прода один сервер, тестовые драфты не должны вставать в настоящий топ. Сервер держит её отдельно (?t=dbg → daily_dbg). */
function dailyDbg(){ try{ return !/^(www\.)?fncsdraft\.com$/.test(location.hostname); }catch(e){ return true; } }
function dailyQ(){ return dailyDbg() ? 't=dbg&' : ''; }
function dailyStore(){ try{ return JSON.parse(localStorage.getItem('fd_daily')||'{}')||{}; }catch(e){ return {}; } }
function dailySave(o){ try{ localStorage.setItem('fd_daily', JSON.stringify(o)); }catch(e){} }
function dailyId(){
  const s=dailyStore();
  if(!s.id){
    let id=''; try{ id=crypto.randomUUID(); }catch(e){ id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2); }
    s.id=String(id).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40); dailySave(s);
  }
  return s.id;
}
function dailyToday(){ const s=dailyStore(), d=dailyDay(); return (s.days||{})[d]||null; }
function dailyNick(){
  const s=dailyStore(); if(s.nick) return s.nick;
  try{ const pl=CAREER && CAREER.player; if(pl && (pl.nick||pl.handle)) return String(pl.nick||pl.handle).slice(0, 24); }catch(e){}
  return '';
}
