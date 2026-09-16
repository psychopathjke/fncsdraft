// Одиннадцать пунктов тестера с безымянной страницы Notion 3ddb…b120 (16 сентября
// 2026) — что из них починено кодом, то здесь и сторожится:
//   1. брошенный напарник две недели не садится к сироте новой пары (ccMateParted);
//   2. в Reload третья зона не предлагает «набить сёрдж», ccSurgeState молчит
//      при пороге Infinity;
//   3. карточка хитов/LCQ мейджора не пишет «место на Esports World Cup»;
//   5/11. ранний круг дешевле (ccMatsZoneCost), фарм — прибавка до потолка, уход с
//      занятой точки даёт половину открываемого, а не половину коробки;
//   6/7. мувмент на ротации — только настоящий предмет; сгорает за силу; ожидание
//      фармит;
//   9. под вопросом есть раскрывашка «как это считается»;
//   10. дома сильных ботов — жирные коробки (очередь ccBotHomes).
//
//   node tools/check-career-tester-1609.js
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

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Tester', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:'tester1609', cardRegion:'EU', nat:null},
      career:{season:1, size:2, day:'2026-02-10', division:1, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    skipAnimation=true;
    const cr=CAREER.career, me=careerCard();

    // ---- 1. брошенный напарник ---------------------------------------------------
    const pool=careerPools();
    const paired=new Set(); pool.duos.forEach(d=>d.cards.forEach(c=>paired.add(c._k||hKey(c))));
    const free=(pool.players||[]).filter(c=>!paired.has(c._k||hKey(c)) && Math.abs(ccCardOvr(c)-86)<3);
    const dB=(pool.duos||[]).filter(x=>x.cards.length===2 && Math.abs(ccDuoOvr(x)-86)<4)[3];
    if(!free.length || !dB) fail('no free agent / pair near 86 to stage the swap');
    const E=free[0], B=dB.cards[0], Y=dB.cards[1];
    careerMateSeat({handle:E.handle, card:E, dev:0});
    careerMateSeat({handle:B.handle, card:B, dev:0});
    if(!(cr.exMates||{})[hKey(E)]) fail('the dropped partner is not written into cr.exMates');
    if(!ccMateJustParted(hKey(E))) fail('ccMateJustParted is false right after the swap');
    const mateOf=(field, h)=>{ const t=(field||[]).find(x=>(x.squad||[]).some(c=>hKey(c)===h)); return t ? (t.squad||[]).map(c=>hKey(c)).filter(k=>k!==h).join('&') : null; };
    const f1=careerCupField(cr, [me, B], careerCupSize(1), null, false, 0);
    if(mateOf(f1, hKey(Y))===hKey(E)) fail('the orphan '+Y.handle+' got the just-dropped '+E.handle+' the same day');
    cr.day=ccAddDays(cr.day, 20); CC_POOLS=null;
    if(ccMateJustParted(hKey(E))) fail('twenty days later the dropped partner is still held off the market');
    out.steps.push('a dropped partner sits out two weeks before an orphan can take him');

    // ---- 3. карточка мейджора без чужого места ---------------------------------------
    const stage=document.getElementById('majorStages'); if(stage) stage.innerHTML='';
    careerReloadResultCard({label:'Heats', place:5, of:50, through:true, cut:10, seat:false, seatText:null, money:null});
    const card=stage ? stage.lastElementChild : null;
    if(!card) fail('no result card rendered');
    if(/Esports World Cup/.test(card.textContent)) fail('the heats card still names the Esports World Cup seat');
    if(card.textContent.indexOf(L().ccRelPass(10))<0) fail('the heats card does not say the through line');
    out.steps.push('a Major stage card names the pass, not a Reload seat');

    // ---- 2. Reload без сёрджа ------------------------------------------------------
    const brSet=ACTIVE_LANDING_SET;
    const relSet=Object.keys(ZONE_SETS).find(k=>/^r\\d$/.test(k));
    if(!relSet) fail('no Reload island in ZONE_SETS');
    useLandingSet(relSet);
    if(!ccNoSurge()) fail('ccNoSurge is false on '+relSet);
    const fakeGame={frames:()=>[{zone:3, players:40, surgeAt:Infinity, surgeLine:null}]};
    if(ccSurgeState({_game:fakeGame, _sq:{dealt:100, taken:20}})!==null) fail('ccSurgeState speaks with an Infinity threshold');
    const realBox=ccChoiceBox; let seen=null;
    ccChoiceBox=async function(title, hint, options){ seen=options; return options.find(o=>o.def)||options[0]; };
    const you={isYou:true, name:'ME', pow:90, _pf:90, _pc:90, _mats:300, _loot:{weapons:[{name:'Striker Pump Shotgun', rarity:'rare', icon:'shotgun'}], heals:[], move:null}};
    await ccAskFarm(you, null);
    if(seen.some(o=>o.id==='surge')) fail('Reload zone 3 still offers surge farming');
    useLandingSet(brSet);
    await ccAskFarm(Object.assign({}, you, {_mats:300}), null);
    if(!seen.some(o=>o.id==='surge')) fail('Battle Royale zone 3 lost the surge option');
    out.steps.push('Reload knows no surge: not on zone 3, not in ccSurgeState');

    // ---- 5. ресы: ранний круг, фарм-прибавка -------------------------------------------
    if(ccMatsZoneCost(1)!==CC_MATS_EARLY_ZONE || ccMatsZoneCost(3)!==CC_MATS_EARLY_ZONE || ccMatsZoneCost(4)!==CC_MATS_ZONE) fail('ccMatsZoneCost is not early/late');
    const f={_mats:300};
    await ccAskFarm(Object.assign(f, {isYou:true, name:'F', pow:90, _pf:90, _pc:90, _loot:you._loot}), null);
    if(f._mats!==Math.min(CC_MATS_FULL, 300+CC_MATS_FARM)) fail('farming is not +'+CC_MATS_FARM+': '+f._mats);
    const g={_mats:1200}; ccMatsAdd(g, CC_MATS_FARM); if(g._mats!==CC_MATS_FULL) fail('ccMatsAdd does not cap at the full stock');
    const room=[{_mats:300, pow:90}, {_mats:300, pow:90}, {_mats:300, pow:90}];
    ccRoomFarm(room, null);
    if(!room.every(t=>t._mats===300+CC_MATS_FARM || t._mats===300+CC_MATS_FARM_SHORT)) fail('the room farms by another rule: '+room.map(t=>t._mats).join(','));
    ccChoiceBox=realBox;
    out.steps.push('early circles cost '+CC_MATS_EARLY_ZONE+', farming adds '+CC_MATS_FARM+' up to the cap, the room too');

    // ---- 11. уход с занятой точки — половина открываемого ------------------------------------
    const big=ALL_LANDING_ZONES.slice().sort((a,b)=>ccSiteChests(b)-ccSiteChests(a))[0];
    const nOpen=ccSiteOpen(ccSiteChests(big));
    const nLeave=Math.max(1, Math.round(nOpen*CC_CHESTS_LEAVE_SHARE));
    if(!(nLeave<nOpen)) fail('leaving to the richest box opens as much as staying: '+nLeave+' vs '+nOpen);
    out.steps.push('leaving opens '+nLeave+' of '+nOpen+' on the richest box');

    // ---- 6/7. ротация ------------------------------------------------------------
    if(CC_MOVE_ITEMS.indexOf('Harpoon Gun')>=0 || CC_MOVE_ITEMS.indexOf('Pro Fishing Rod')>=0) fail('fishing gear still counts as movement');
    if(CC_CHEST_NOT_HEAL.indexOf('Harpoon Gun')<0 || CC_CHEST_NOT_HEAL.indexOf('Pro Fishing Rod')<0) fail('fishing gear is not kept out of the heal slot');
    const mk=(move, mats)=>({isYou:true, name:'R', pow:90, _pf:90, _pc:90, _mats:mats, _gamePow:0,
      _loot:{weapons:[{name:'Striker Pump Shotgun', rarity:'rare', icon:'shotgun'}], heals:[], move:move||null}});
    let WANT=null; ccChoiceBox=async function(title, hint, options){ seen=options; return options.find(o=>o.id===WANT)||options.find(o=>o.def)||options[0]; };
    let r=mk({name:'Shockwave Grenade', rarity:'epic'}, 600); WANT='move';
    await ccAskRot(r, null);
    if(r._rot!=='move') fail('move did not take');
    if(r._loot.move && !r._loot.move.floor) fail('the movement item did not burn');
    if(r._pf!==90-CC_ROT_MOVE_POW || r._pc!==90-CC_ROT_MOVE_POW) fail('burning the item did not cost '+CC_ROT_MOVE_POW+' power: '+r._pf+'/'+r._pc);
    r=mk(null, 600); WANT='late'; await ccAskRot(r, null);
    if(r._mats!==600+CC_ROT_FARM.late) fail('late did not farm +'+CC_ROT_FARM.late+': '+r._mats);
    r=mk(null, 600); WANT='with'; await ccAskRot(r, null);
    if(r._mats!==600+CC_ROT_FARM.with) fail('with did not farm +'+CC_ROT_FARM.with+': '+r._mats);
    r=mk(null, 600); WANT='early'; await ccAskRot(r, null);
    if(r._mats!==600) fail('early farmed: '+r._mats);
    if(!seen.every(o=>/−|-/.test(o.note))) fail('a rotation note has no mats cost: '+seen.map(o=>o.note).join(' | '));
    ccChoiceBox=realBox;
    out.steps.push('rotation: no fishing-gear movement, waiting farms, notes carry the cost');

    // ---- 9. «как это считается» --------------------------------------------------------------
    const how=ccGameHowHTML();
    if(!/<details class="cc-how">/.test(how) || (how.match(/<li>/g)||[]).length<5) fail('the how-it-counts block is missing or short');
    ['ru','en','fr','it','pt'].forEach(l=>{ const T=Object.assign({}, I18N.en, I18N[l]||{}); if(typeof T.ccGameHow!=='function' || typeof T.ccRotCost!=='function') fail('dictionary '+l+' lacks ccGameHow/ccRotCost'); });
    out.steps.push('every question carries the scoring sheet');

    // ---- 10. дома сильных -------------------------------------------------------------
    useLandingSet(careerBrSet());
    const field=careerCupField(cr, [me], careerCupSize(1), null, false, 0).filter(t=>!t.isYou);
    const byCh=ALL_LANDING_ZONES.slice().sort((a,b)=>ccSiteChests(b)-ccSiteChests(a));
    const strong=field.slice().sort((a,b)=>(b.pow||0)-(a.pow||0)).slice(0, 10);
    const ranks=strong.map(t=>byCh.indexOf(ccBotHome(t))+1);
    const avgR=ranks.reduce((s,v)=>s+v,0)/ranks.length;
    if(!(avgR<ALL_LANDING_ZONES.length/2-1)) fail('the strongest ten still home on average boxes: ranks '+ranks.join(','));
    const q=ccBotHomes(strong[0]);
    if(q.length<3 || new Set(q).size!==q.length) fail('the home queue is short or repeats: '+q.length);
    if(ccBotHome(strong[0])!==q[0]) fail('ccBotHome is not the head of the queue');
    out.steps.push('the strongest ten home on rich boxes (mean chest rank '+Math.round(avgR*10)/10+' of '+ALL_LANDING_ZONES.length+')');

    // ---- скрин 16.09 (чат): остров дуо-года по сезону, рыба не из сундука, мир платит финалы ----
    const dayWas=cr.day; cr.size=2;
    cr.day='2026-04-10'; if(careerBrSet()!=='m1') fail('duo year in April is on '+careerBrSet()+', not m1');
    cr.day='2026-06-06'; if(careerBrSet()!=='m2') fail('duo year on 6 June is on '+careerBrSet()+', not m2');
    cr.day='2026-08-21'; if(careerBrSet()!=='s42') fail('duo year on 21 August is on '+careerBrSet()+', not s42');
    cr.day=dayWas;
    const FISH=['Flopper','Spicy Fish','Slurpfish','Shield Fish','Jellyfish','Midas Flopper','Small Fry','Small Fries'];
    ['m1','m2','s42','t2'].forEach(setK=>{ for(let i=0;i<120;i++){ const pk=ccChestPack(Math.random, setK, 12);
      const bad=(pk.heals||[]).find(h=>FISH.indexOf(h.name)>=0); if(bad) fail('a chest pack on '+setK+' carries fish: '+bad.name); } });
    out.steps.push('the duo year changes island with the Fortnite season; chests hold no fish');
    // Мир платит финал, в котором игрока нет: карьера пятого дивизиона проходит финал Reload 1.
    cr.division=5; cr.day='2026-02-06'; cr.log=[]; delete cr.worldPaid; CC_POOLS=null;
    const rowsBefore=Object.keys(careerMoney().rows||{}).length;
    const n=careerWorldFinals('2026-02-06', '2026-02-09');
    if(!(n>=1)) fail('the world did not play the Reload 1 final without the player: '+n);
    if(!(cr.worldPaid||{})['1|reload1']) fail('worldPaid lacks the Reload 1 key: '+JSON.stringify(cr.worldPaid));
    if(!(Object.keys(careerMoney().rows||{}).length>rowsBefore)) fail('the money board did not grow after a world final');
    if(careerWorldFinals('2026-02-06', '2026-02-09')!==0) fail('the same final was paid twice');
    if(!(cr.news||[]).some(x=>x.k==='ccNewsWorldWon' && x.day==='2026-02-07')) fail('no feed line dated by the night for the world final');
    out.steps.push('finals without the player are played by the world, paid once, and dated by the night');
  } catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cct1609-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the check produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('OK career-tester-1609');
