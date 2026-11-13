// Лут на своей точке руками (ccLootRoom): сундуки по одному, автоподбор в свободные слоты, пять слотов,
// стак хилок, одно передвижение, земля и обмен, «Собрать лучшее», ресы от числа открытых, пак из рук.
//   node tools/check-career-loot-room.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `<pre id="__out" style="display:none"></pre><script>
window.addEventListener("load", function(){ setTimeout(async function(){
  const out={fails:[], errs:[], notes:{}}; window.addEventListener('error', e=>out.errs.push(String(e.message)));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const set=ccLootSet('m2'); const pool=ccLootPool(set);
    const rng=careerRng(12345); const rolls=[]; for(let i=0;i<20;i++) rolls.push(ccChestRoll(rng, set));
    const host=document.createElement('div'); document.body.appendChild(host);
    const pr=ccLootRoom(host, {rolls, nFast:4, nOpen:12, at:''});
    const q=s=>host.querySelector(s), qa=s=>[...host.querySelectorAll(s)];
    check('окно открыто, 20 сундуков закрыты', qa('.lr-ch[data-c]').length===20, String(qa('.lr-ch[data-c]').length));
    check('«Собрать лучшее» неактивно до первого сундука', q('[data-a="auto"]').disabled);
    q('.lr-ch[data-c]').click();
    check('сундук открылся, ствол сам встал в слот', qa('.lr-ch.open').length===1 && qa('.lr-slot[data-d]').length>=1);
    check('ресы до трети сундуков в плюс', /\\+300/.test(q('.lr-time').textContent), q('.lr-time').textContent);
    q('[data-a="o5"]').click(); q('[data-a="o5"]').click();
    check('открыто 11', qa('.lr-ch.open').length===11);
    check('слотов не больше пяти', qa('.lr-slot[data-d]').length<=5);
    check('лишнее на земле', qa('.lr-g').length>0, String(qa('.lr-g').length));
    // Стак хилок не выше потолка вики, передвижение одно.
    const inv=qa('.lr-slot[data-d]').map(b=>b.textContent);
    out.notes.inv=inv;
    // Выбросить первый слот и взять с земли.
    const n0=qa('.lr-g').length; q('.lr-slot[data-d="0.0"]').click();
    check('выброшенное легло на землю', qa('.lr-g').length>=n0 && qa('.lr-slot[data-d]').length<=4);
    q('.lr-g[data-g="0"]').click();
    check('взял с земли', qa('.lr-slot[data-d]').length>=1);
    q('[data-a="o5"]').click(); q('[data-a="o5"]').click();
    check('сверх обычного счёта ресы в минус', /−|-\\d/.test(q('.lr-time b').textContent) || q('.lr-time b').classList.contains('down'), q('.lr-time').textContent);
    // Предметов столько, сколько выпало: «Собрать лучшее» и перекладывание ничего не множат.
    const total=()=>qa('.lr-slot[data-d], .lr-g').reduce((s,b)=>{ const e=b.querySelector('em'); return s+(e ? +e.textContent.replace(/\\D/g,'') : 1); }, 0);
    const t0=total();
    for(let k=0;k<6;k++){ q('[data-a="auto"]').click(); if(q('.lr-g')) q('.lr-g').click(); if(q('.lr-slot[data-d="0.0"]')) q('.lr-slot[data-d="0.0"]').click(); }
    q('[data-a="auto"]').click();
    check('предметы не множатся', total()===t0, t0+' → '+total());
    q('[data-a="go"]').click();
    const res=await pr;
    check('окно закрылось', !host.querySelector('.cc-loot'));
    check('пак из рук: открыто 20, ресы −300', res.opened===20 && res.mats===-300, res.opened+' '+res.mats);
    const p=ccPackFloor(res.pack, set, Math.random);
    check('пак полный: пять слотов', p.weapons.length+p.heals.length+(p.move?1:0)===5, JSON.stringify(p).slice(0,200));
    check('сила считается', typeof ccPackPow(p)==='number');
    check('ручной пак без выброшенного', res.pack.manual && res.pack.dropped.length===0);
    // Ушёл сразу — пол острова, сила низкая.
    const h2=document.createElement('div'); document.body.appendChild(h2);
    const pr2=ccLootRoom(h2, {rolls, nFast:4, nOpen:12, at:''}); h2.querySelector('[data-a="go"]').click();
    const r2=await pr2; const p2=ccPackFloor(r2.pack, set, Math.random);
    check('ушёл без сундуков: ресы +300, пак с пола, сила минимальна', r2.opened===0 && r2.mats===300 && ccPackPow(p2)<=-3, r2.mats+' '+ccPackPow(p2));
    check('онлайн и пропуск экран не открывают', (()=>{ const s=skipAnimation; skipAnimation=true; const v=ccLootRoomOn(); skipAnimation=s; return v===false; })());
    // Точка крупно: сундуки на карте острова, у S43 и S42 — на точках fortnite.gg внутри коробки; там же редкие и ящики.
    const keep=ACTIVE_LANDING_SET, keepSq=squadSize;
    ['s43','s42','m2'].forEach(key=>{
      ACTIVE_LANDING_SET=key; squadSize=1;
      const zs=ZONE_SETS[key]||[]; const z=zs.slice().sort((a,b)=>(b.chests||0)-(a.chests||0))[0];
      const v=ccLrView(z, 20);
      const nc=v ? v.spots.filter(p=>p.k==='c').length : 0, na=v ? v.spots.filter(p=>p.k==='a').length : 0;
      check(key+': вид точки, 20 сундуков', v && nc===20, nc);
      check(key+': ящики с патронами есть', na>=1, na);
      if(key!=='m2') check(key+': настоящие сундуки внутри коробки', v && v.real>=10, v && v.real);
      check(key+': всё в коробке', v && v.spots.every(p=>p.x>=z.x && p.x<=z.x+z.w && p.y>=z.y && p.y<=z.y+z.h));
      const h3=document.createElement('div'); document.body.appendChild(h3);
      const pr3=ccLootRoom(h3, {rolls, nFast:4, nOpen:12, at:'', zone:z, set});
      const pins=()=>h3.querySelectorAll('.lr-pin.lr-c[data-c]').length;
      check(key+': 20 сундуков на карте', pins()===20 && h3.querySelector('.lr-map-l'), String(pins()));
      const c7=h3.querySelectorAll('.lr-pin.lr-c[data-c]')[7].dataset.c;
      h3.querySelector('.lr-pin[data-c="'+c7+'"]').click();
      check(key+': открыт тот сундук, по которому нажал', !h3.querySelector('.lr-pin[data-c="'+c7+'"]') && h3.querySelectorAll('.lr-pin.open').length===1);
      const ammo0=h3.querySelector('.lr-time').textContent;
      const a1=h3.querySelector('.lr-pin.lr-a[data-c]'); a1.click();
      check(key+': ящик даёт патроны', h3.querySelector('.lr-time').textContent!==ammo0 && h3.querySelectorAll('.lr-pin.open.lr-a').length===1);
      h3.querySelector('[data-a="o5"]').click();
      check(key+': «Открыть 5» открывает ещё пять', h3.querySelectorAll('.lr-pin.open').length===7, String(h3.querySelectorAll('.lr-pin.open').length));
      h3.querySelector('[data-a="go"]').click();
      out.notes[key]=v && {real:v.real, zoom:+v.zoom.toFixed(2), ammo:na, rare:v.spots.filter(p=>p.k==='r').length};
    });
    // Дуо: напарник открывает свой сундук на каждый твой, его находки в его слотах, «Поделить» даёт обоим по два ствола.
    ACTIVE_LANDING_SET='s42'; squadSize=2;
    { const zs=ZONE_SETS.s42; const z=zs.slice().sort((a,b)=>(b.chests||0)-(a.chests||0))[0];
      const h4=document.createElement('div'); document.body.appendChild(h4);
      const pr4=ccLootRoom(h4, {rolls, nFast:4, nOpen:12, at:'', zone:z, set, mates:['Mate']});
      h4.querySelector('.lr-pin.lr-c[data-c]').click();
      check('дуо: напарник открыл свой', h4.querySelectorAll('.lr-pin.open').length===2 && h4.querySelectorAll('.lr-pin.open.by1').length===1);
      check('дуо: два хотбара поверх карты', h4.querySelector('.lr-map .lr-hud-b') && h4.querySelectorAll('.lr-hb').length===2 && h4.querySelectorAll('.lr-slot[data-d^="1."]').length>=1);
      h4.querySelector('[data-a="o5"]').click(); h4.querySelector('[data-a="o5"]').click();
      const t4=()=>[...h4.querySelectorAll('.lr-slot[data-d], .lr-g')].reduce((s,b)=>{ const e=b.querySelector('em'); return s+(e ? +e.textContent.replace(/\\D/g,'') : 1); }, 0);
      const before=t4(); h4.querySelector('[data-a="auto"]').click();
      check('дуо: «Поделить» ничего не множит', t4()===before, before+' → '+t4());
      const w0=h4.querySelectorAll('.lr-hb')[0].querySelectorAll('.lr-slot[data-d]').length, w1=h4.querySelectorAll('.lr-hb')[1].querySelectorAll('.lr-slot[data-d]').length;
      check('дуо: у обоих что-то в руках', w0>=2 && w1>=2, w0+' '+w1);
      h4.querySelector('[data-to="1"]').click();
      check('дуо: переключатель «брать для напарника»', h4.querySelector('[data-to="1"]').classList.contains('on'));
      h4.querySelector('[data-a="go"]').click();
      const r4=await pr4;
      check('дуо: сила отряда считается из всех рук', r4.powPack && r4.mates.length===1 && typeof r4.pen==='number', JSON.stringify({pen:r4.pen, split:r4.split}));
    }
    // Автобус: линия через остров, далеко от неё сундуков меньше, а ближе всего — без потерь.
    { const g={frames:()=>[{circle:{cx:40.5, cy:51.2, radius:30}}]}; CC_BUS_GAME=g; CC_BUS=null;
      const b=ccBus(); check('автобус: отрезок от края до края', b && Math.min(b.x1,b.x2,b.y1,b.y2)>=-0.01 && Math.max(b.x1,b.x2,b.y1,b.y2)<=100.01, JSON.stringify(b));
      const zs=ZONE_SETS.s42, d=zs.map(z=>ccBusDist(z)), lates=zs.map(z=>ccBusLate(z));
      check('автобус: рядом без потерь, далеко с потерями', Math.min(...lates)===0 && Math.max(...lates)>0, Math.min(...d).toFixed(1)+'..'+Math.max(...d).toFixed(1));
      check('автобус: одна и та же линия на ту же игру', (CC_BUS=null, JSON.stringify(ccBus()))===JSON.stringify(b));
      CC_BUS_GAME=null; CC_BUS=null; }
    // BR: на своей коробке соседи («в батл рояль не лутаются сундуки») — ушёл или выиграл, и всё равно лутаешь руками.
    for(const pickBtn of ['leave','fight']){
      ACTIVE_LANDING_SET='s42'; squadSize=1; const keepRun=CAREER_RUN; CAREER_RUN=CAREER_RUN||{};
      const zs=ZONE_SETS.s42, z0=zs[3], z1=zs[4];
      const you={name:'You', pow:200, _pf:200, _pc:200, landingZone:z0, _mats:300};
      const foe={name:'Foe', pow:1, _pf:1, _pc:1, landingZone:z0};
      const other={name:'Far', pow:50, landingZone:z1};
      const sq={team:you, alive:true, x:0, y:0}, fsq={team:foe, alive:true}, osq={team:other, alive:true};
      you._sq=sq; you._game={squads:[sq, fsq, osq], eliminate:(a)=>{ (a===you?sq:fsq).alive=false; }};
      const h5=document.createElement('div'); document.body.appendChild(h5);
      const r0=Math.random; if(pickBtn==='fight') Math.random=(()=>{ let k=0; return ()=>{ k++; return k===1 ? r0() : 0.01; }; })();
      const pr5=ccAskSite(you, {map:h5});
      let lr=null;
      for(let i=0;i<120 && !lr;i++){
        const b=[...h5.querySelectorAll('[data-at]')].find(x=>x.textContent.indexOf(pickBtn==='leave' ? L().ccSiteLeave : L().ccSiteFight)>=0);
        if(b) b.click(); else { const ok=h5.querySelector('.cc-choice-result button, .cc-res-ok'); if(ok) ok.click(); }
        await new Promise(r=>setTimeout(r, 40)); lr=h5.querySelector('.cc-loot');
      }
      Math.random=r0;
      check('BR '+pickBtn+': открылась комната лута', !!lr);
      if(lr){ lr.querySelector('.lr-pin.lr-c[data-c]') && lr.querySelector('.lr-pin.lr-c[data-c]').click(); lr.querySelector('[data-a="go"]').click(); }
      for(let i=0;i<40;i++){ const b=h5.querySelector('button'); if(!b) break; b.click(); await new Promise(r=>setTimeout(r, 40)); }
      await Promise.race([pr5, new Promise(r=>setTimeout(r, 3000))]);
      check('BR '+pickBtn+': пак в руках', you._loot && (you._loot.weapons||[]).length>=1, JSON.stringify(you._loot||null).slice(0,120));
      CAREER_RUN=keepRun;
    }
    ACTIVE_LANDING_SET=keep; squadSize=keepSq;
    ['ru','en','fr','it','pt'].forEach(lg=>['lrTitle','lrHint','lrOpened','lrGo','lrAuto','lrInv','lrGround','lrFull','lrAmmo','lrAmmoBox','lrRare','lrAmmoLow','lrSplitPen','lrTakeFor','lrMe','lrInvOf','lrSplit','lrBusLate','lrBusNear'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lroom-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + fs.readFileSync(process.env.INDEX || path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--user-data-dir=' + path.join(dir, 'prof'),
    '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs.length) out.fails.push('ошибки страницы: ' + out.errs.join(' | '));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK лут на точке руками: сундуки, слоты, земля, ресы, пак из рук');
