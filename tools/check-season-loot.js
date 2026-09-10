// Лут по сезонам: у каждого острова своё оружие, и карьера раздаёт его.
//
// Его слово, 5 сентября 2026: «посмотри ещё меты в каждом сезоне компетив и
// добавь в каждом сезоне оружие, которое нужно». Проверяется по таблицам лута
// сезонов на Fortnite Wiki (глава 7, сезоны 3 и 4) и по тому, как пак карьеры
// выбирает пул:
//   в пуле главы 7 сезона 3 нет стволов второго сезона (Twin Mag SMG, Iron
//     Pump, Twin Hammer) и есть то, что лежало на острове ко второму Мажору;
//   у сорок второго острова свой пул — возвращённые стволы Override;
//   пак карьеры берёт пул своего острова: дуо до 21 августа — m2, после — s42,
//     трио — t1/t2/t3 по дате; без карьеры — m2, как раньше;
//   у каждого предмета каждого пула есть картинка, когда спрашивают островом.
//
//   node tools/check-season-loot.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:[], err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const names=pool=>pool.map(o=>o.name).filter((v,i,a)=>a.indexOf(v)===i);
  try{
    // ---- глава 7, сезон 3: состав по вики ------------------------------------
    const m2=names(WEAPON_POOL);
    ['Twin Mag SMG','Iron Pump Shotgun','Twin Hammer Shotguns','Chaos Reloader Shotgun','Flex SMG','Stinger SMG','Hunting Rifle'].forEach(n=>
      check('в сезоне 3 нет «'+n+'»', m2.indexOf(n)<0));
    ['Chaos Exploder Rifle','Surgical Burst Rifle','Warforged Assault Rifle','Spire Rifle','Extending Focus Shotgun','Striker Pump Shotgun',
     'Maven Auto Shotgun','Rapid Fire SMG','Ranger Pistol','Lancehead Pistol','Bank Shot Pistol','Heavy Impact Sniper Rifle'].forEach(n=>
      check('в сезоне 3 есть «'+n+'»', m2.indexOf(n)>=0));
    check('лесенка редкости — по вики: Lancehead с синего', !WEAPON_POOL.some(o=>o.name==='Lancehead Pistol' && (o.rarity==='common'||o.rarity==='uncommon')));
    check('и Bank Shot доходит до золота', WEAPON_POOL.some(o=>o.name==='Bank Shot Pistol' && o.rarity==='mythic'));
    check('у каждого ствола есть mod', WEAPON_POOL.every(o=>typeof o.mod==='number' && o.mod>0));
    out.notes.push('m2: '+m2.join(', '));
    // ---- сезон 4, остров s42 --------------------------------------------------
    const s42=names(S42_WEAPON_POOL);
    ['Pump Shotgun','8-Bit Shotgun','Assault Rifle','Ranger Assault Rifle','Drum Gun','Tactical Pistol'].forEach(n=>
      check('в сезоне 4 есть «'+n+'»', s42.indexOf(n)>=0));
    check('и ни одного ствола третьего сезона', !s42.some(n=>m2.indexOf(n)>=0), s42.filter(n=>m2.indexOf(n)>=0).join(','));
    const s42h=names(S42_CONSUMABLE_POOL);
    check('расходники сезона 4: без Seven Sliders, с Chug Splash', s42h.indexOf('Seven Sliders')<0 && s42h.indexOf('Chug Splash')>=0);
    out.notes.push('s42: '+s42.join(', '));
    // ---- пак карьеры идёт за островом ------------------------------------------
    let seed=1; const rng=()=>{ seed=(seed*1103515245+12345)%2147483648; return seed/2147483648; };
    const only=(pack, pool)=>pack.weapons.every(w=>names(pool).indexOf(w.name)>=0) &&
                              pack.heals.concat([pack.move]).every(h=>names(pool).indexOf(h.name)>=0);
    CAREER=null;
    check('без карьеры пак — m2, как раньше', ccLootSet()==='m2' && only(ccLootPack(rng), WEAPON_POOL.concat(M2_CONSUMABLE_POOL)));
    CAREER={player:{nick:'Loot', ovr:80}, career:{day:'2026-08-20', size:2}};
    check('дуо 20 августа — ещё m2', ccLootSet()==='m2');
    CAREER.career.day='2026-08-21';
    check('дуо 21 августа — s42', ccLootSet()==='s42');
    for(let i=0;i<40;i++){ const p=ccLootPack(rng); if(!only(p, S42_WEAPON_POOL.concat(S42_CONSUMABLE_POOL))){ check('пак s42 — только лут сезона 4', false, JSON.stringify(p)); break; } }
    CAREER.career.day='2026-10-05';
    const p42=ccLootPack(rng);
    check('пак дуо в октябре: два ствола, две хилки, мувмент', p42.weapons.length===2 && p42.heals.length===2 && !!p42.move);
    check('мувмент s42 — Overdrive или гарпун, не хилка', CC_MOVE_ITEMS.indexOf(p42.move.name)>=0, p42.move.name);
    CAREER.career.size=3; CAREER.career.day='2026-03-10';
    check('трио в марте — t1', ccLootSet()==='t1' && only(ccLootPack(rng), T1_WEAPON_POOL.concat(T1_CONSUMABLE_POOL)));
    CAREER.career.day='2026-05-01';
    check('трио 1 мая — t2', ccLootSet()==='t2' && only(ccLootPack(rng), T2_WEAPON_POOL.concat(T2_CONSUMABLE_POOL)));
    CAREER.career.day='2026-07-15';
    check('трио в июле — t3', ccLootSet()==='t3' && only(ccLootPack(rng), T3_WEAPON_POOL.concat(T3_CONSUMABLE_POOL)));
    check('явный набор сильнее даты', only(ccLootPack(rng, 'm1'), M1_WEAPON_POOL.concat(M1_CONSUMABLE_POOL)));
    // ---- Reload: свой пул у каждого круга, по дню карьеры, пока на столе остров Reload ------
    CAREER.career.size=2;
    const relAt=(day, set)=>{ CAREER.career.day=day; useLandingSet(set); const s=ccLootSet(); useLandingSet('m2'); return s; };
    check('Reload 24 января — круг 1', relAt('2026-01-24','r1')==='r1');
    check('Reload 27 февраля на острове r1 — круг 2', relAt('2026-02-27','r1')==='r2');
    check('Reload 16 мая на острове r4 — круг 3', relAt('2026-05-16','r4')==='r3');
    check('Reload 27 июня — круг 4', relAt('2026-06-27','r4')==='r4');
    check('Reload-вечер Victory Cup в июле на r4 — круг 4', relAt('2026-07-20','r4')==='r4');
    check('обычный вечер 27 февраля — не Reload', relAt('2026-02-27','m2')==='m2');
    const rn=k=>names(CC_LOOT_BY_SET[k].weapons);
    check('круг 1: Striker Burst и Sentinel Pump, без Havoc', rn('r1').indexOf('Striker Burst Rifle')>=0 && rn('r1').indexOf('Sentinel Pump Shotgun')>=0 && rn('r1').indexOf('Havoc Pump Shotgun')<0);
    check('круг 2: Havoc и Heavy Sniper пришли, Striker Burst ушёл', rn('r2').indexOf('Havoc Pump Shotgun')>=0 && rn('r2').indexOf('Heavy Sniper Rifle')>=0 && rn('r2').indexOf('Striker Burst Rifle')<0);
    check('круг 3: Red-Eye и Cube Rifle, без Morphite AR', rn('r3').indexOf('Red-Eye Assault Rifle')>=0 && rn('r3').indexOf('Cube Rifle')>=0 && rn('r3').indexOf('Morphite Assault Rifle')<0);
    check('круг 4: Collateral Damage и Wrecker Revolver', rn('r4').indexOf('Collateral Damage Assault Rifle')>=0 && rn('r4').indexOf('Wrecker Revolver')>=0);
    ['r1','r2','r3','r4'].forEach(k=>{ const p=CC_LOOT_BY_SET[k]; check(k+': стволы с mod и в лесенке', p.weapons.every(o=>typeof o.mod==='number' && RARITY_LADDER.indexOf(o.rarity)>=0));
      check(k+': есть хилки и передвижение', p.heals.some(ccIsHealItem) && p.heals.some(x=>CC_MOVE_ITEMS.indexOf(x.name)>=0)); });
    check('Chug Splash — хилка, не мувмент', CC_MOVE_ITEMS.indexOf('Chug Splash')<0 && !!CC_HEAL_KIT['Chug Splash']);
    // ---- пять слотов — пять предметов, пол не даёт силы -----------------------------------
    CAREER.career.day='2026-10-05';
    const five=p=>(p.weapons||[]).length+(p.heals||[]).length+(p.move?1:0);
    for(let i=0;i<30;i++){ const p=ccLootPack(rng); if(five(p)!==5){ check('пак третьей зоны — пять предметов', false, ccPackLine(p)); break; } }
    for(let n=1;n<=4;n++){ const p=ccChestPack(rng, null, n); if(five(p)!==5){ check('пак с '+n+' сундуков — пять предметов', false, ccPackLine(p)); } }
    { const p=ccChestPack(rng, null, 1); const bare={weapons:(p.weapons||[]).filter(o=>!o.floor), heals:(p.heals||[]).filter(o=>!o.floor), move:(p.move && !p.move.floor) ? p.move : null};
      check('пол не меняет силу пака', ccPackPow(p)===ccPackPow(bare), ccPackPow(p)+' vs '+ccPackPow(bare)); }
    { const p=ccLootPack(rng); p.move=null; ccPackFloor(p, null, rng); check('пад улетел — слот добрался полом', five(p)===5 && !!p.move && p.move.floor===true); }
    CAREER.career.size=2;
    // ---- картинки: каждый предмет каждого пула, когда спрашивают островом -------
    CARD_MODE=false;
    Object.keys(CC_LOOT_BY_SET).forEach(set=>{
      const pool=CC_LOOT_BY_SET[set];
      const miss=names(pool.weapons.concat(pool.heals)).filter(n=>{
        const o=pool.weapons.concat(pool.heals).find(x=>x.name===n);
        return !/src="/.test(weaponIconHTML(o, set)||'');
      });
      check(set+': у каждого предмета картинка', miss.length===0, miss.join(', '));
    });
    // Ствол сезона 4, чья картинка есть только в таблицах 2025 года, берёт её.
    check('Oni Shotgun на s42 — с картинкой', /t1-oni-shotgun/.test(weaponIconHTML({name:'Oni Shotgun', icon:'shotgun'}, 's42')));
    // Один и тот же экран у драфта не сломан: карты m1 по-прежнему идут за M1_ART.
    check('карта m1 — арт m1', /m1-iron-pump/.test(weaponIconHTML({name:'Iron Pump Shotgun'}, 'm1')));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsloot-'));
const tmp = path.join(dir, 'index.html');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
fs.writeFileSync(tmp, BASE + src + BOOT);
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.notes.forEach(n => console.log('  ' + n));
if (out.err) { console.error('ERROR: ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('every island deals its own season, and the career hands you that pool');
fs.rmSync(dir, { recursive: true, force: true });
