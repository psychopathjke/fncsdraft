// Mobile Series по правилам Epic: лобби 16, путь раунды → хит (свой, змейкой) → квалификация → группы → полуфинал →
// чемпионат с матч-пойнтом; LCQ; мобильные скин-капы в календаре; мобильные скримы качают выше тренировки.
//   node tools/check-career-mobile-series.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const errs=[]; window.addEventListener('error', e=>errs.push(String(e.message)));
setInterval(()=>{ const am=document.getElementById('ccAskModal'); if(am && am.style.display==='flex'){ const no=document.getElementById('ccAskNo');
    if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } const y=document.getElementById('ccAskYes'); if(y) y.click(); }
  const p=document.querySelector('.landing-picker'); if(p){ const z=p.querySelectorAll('.land-zone'); if(z.length){ z[0].click(); const c=p.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click(); } }
  const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 30);
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const phone=CC_SHOP.find(x=>x.unlock==='mobile').id;
const save=(day, extra)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null},
  career:Object.assign({season:1, size:1, year:2026, year0:2026, day:day, seasonOver:false, division:5, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ms', mobOvr:88}, extra||{}),
  gear:{own:[phone]},
  partner:{card:card('M1',80), patience:60, since:'2020-01-01', dev:0}, partners:[{card:card('M1',80), patience:60, since:'2020-01-01', dev:0}]}));
  CC_POOLS=null; CC_VICTORY_LIST=null; careerLoad(); careerMigrateSize(); careerMigrateClock(); if(!CAREER.gear) CAREER.gear={own:[phone]}; };
const E=(id,day)=>CC_CONSOLE_2026.find(v=>v.id===id && (!day || v.day===day));

// Календарь: этапы и скин-капы на месте.
['S42_MobileSeriesLCQ','S42_MobileSeriesGroup1','S42_MobileSeriesGroup2','S42_MobileSeriesCupSemiFinal','MobileSeriesChampionship2026']
  .forEach(id=>check('в календаре '+id, !!E(id)));
const skins=CC_CONSOLE_2026.filter(v=>v.skin && ccConsoleNeed(v)==='mobile'); notes.skins=skins.length;
check('мобильные скин-капы', skins.length>=10, skins.length);
check('лобби серии 16', ccVictoryLobby(E('S41_MobileSeriesOpen'), true)===16, ccVictoryLobby(E('S41_MobileSeriesOpen'), true));
check('не серия — лобби как было', ccVictoryLobby(E('S41_MobileVictoryCup_BR'), true)===100);

// Переходы.
save('2026-06-13'); const cr=CAREER.career;
check('раунд 65-й не проходит', ccMobSeriesAfter(E('S41_MobileSeriesOpen','2026-06-13'), 65, 4940)===null);
check('раунд 6-й в хит', ccMobSeriesAfter(E('S41_MobileSeriesOpen','2026-06-13'), 6, 4940)==='heats' && cr.mobSer.heat===3, JSON.stringify(cr.mobSer));
check('только свой хит', [1,2,3,4].map(h=>ccMobSeriesOk(E('S41_MobileSeriesHeat'+h,'2026-06-20'))).join()==='false,false,true,false');
check('хит 5-й не проходит', ccMobSeriesAfter(E('S41_MobileSeriesHeat3','2026-06-20'), 5, 16)===null && !cr.mobSer);
cr.mobSer={next:'heats', until:'2026-07-01', heat:3};
check('хит топ-4 в квал', ccMobSeriesAfter(E('S41_MobileSeriesHeat3','2026-06-20'), 4, 16)==='cup');
check('квал после июня топ-3', ccMobSerCut(E('S41_MobileSeriesCupQual','2026-06-27'))===3 && ccMobSerCut(E('S40_MobileSeriesCupQual','2026-04-05'))===1);
check('квал в группы', ccMobSeriesAfter(E('S41_MobileSeriesCupQual','2026-06-27'), 2, 16)==='group' && cr.mobGS.grp===1, JSON.stringify(cr.mobGS));
check('LCQ закрыт для попавших в группы', !ccMobSeriesOk(E('S42_MobileSeriesLCQ','2026-09-05')));
check('своя группа', ccMobSeriesOk(E('S42_MobileSeriesGroup1')) && !ccMobSeriesOk(E('S42_MobileSeriesGroup2')));
check('группа топ-8 в полуфинал', ccMobSeriesAfter(E('S42_MobileSeriesGroup1'), 8, 16)==='semi');
check('EU: из полуфинала трое', ccMobSerCut(E('S42_MobileSeriesCupSemiFinal'))===3);
check('полуфинал в чемпионат', ccMobSeriesAfter(E('S42_MobileSeriesCupSemiFinal'), 3, 16)==='champ' && ccMobSeriesOk(E('MobileSeriesChampionship2026')));
delete cr.mobGS; cr.day='2026-09-05';
check('LCQ день 1 топ-160', ccMobSeriesAfter(E('S42_MobileSeriesLCQ','2026-09-05'), 160, 4940)==='lcq2' && ccMobSeriesOk(E('S42_MobileSeriesLCQ','2026-09-06')));
check('LCQ день 2 топ-12 в группы', ccMobSeriesAfter(E('S42_MobileSeriesLCQ','2026-09-06'), 3, 160)==='group' && cr.mobGS.grp===2, JSON.stringify(cr.mobGS));
const ch=ccMobileStageField(E('MobileSeriesChampionship2026'), 15), regs={};
ch.forEach(t=>{ const r=t.squad[0].region; regs[r]=(regs[r]||0)+1; }); notes.champRegs=regs;
check('чемпионат по квотам', ch.length===15 && regs.EU===2 && regs.NAC===3 && regs.BR===2, JSON.stringify(regs));

// Настоящие вечера.
skipAnimation=true; CC_SKIP_RUN=true;
const night=async (day, id, extra)=>{
  save(day, extra); CAREER.career.vpick={[day]:id};
  const on=careerVictoryOn(day); if(!on || on.id!==id) return {err:'not on '+(on&&on.id)};
  const n0=CAREER.career.log.length;
  await Promise.race([runCareerVictory(), new Promise(r=>setTimeout(r, 600000))]);
  const last=CAREER.career.log[CAREER.career.log.length-1]||{};
  return {logged:CAREER.career.log.length>n0, place:last.place, of:last.of, games:last.games, prize:last.prize, day:CAREER.career.day};
};
const rd=await night('2026-06-13', 'S41_MobileSeriesOpen'); notes.round=rd;
check('раунд сыгран одним раундом', rd.logged && rd.of>1000 && rd.games===8, JSON.stringify(rd));
const ht=await night('2026-06-20', 'S41_MobileSeriesHeat2', {mobSer:{next:'heats', until:'2026-07-01', heat:2}}); notes.heat=ht;
check('хит: 16 и 6 игр', ht.logged && ht.of===16 && ht.games===6, JSON.stringify(ht));
const c=await night('2026-10-24', 'MobileSeriesChampionship2026', {mobGS:{stage:'champ'}}); notes.champ=c;
check('чемпионат: 16, деньги, два дня', c.logged && c.of===16 && c.prize>0 && c.day==='2026-10-26', JSON.stringify(c));
check('матч-пойнт после первого дня', c.games>12 && c.games<=25, c.games);
const sk=await night('2026-09-18', 'S42_KingdomHeartsCup_Mobile'); notes.skin=sk;
check('мобильный скин-кап играется', sk.logged && !sk.prize, JSON.stringify(sk));

// Скримы.
save('2026-06-13', {mobOvr:87});
check('тренировка упирается в 85, скримы нет', ccMobileTrainGain(false)===0 && ccMobileTrainGain(true)>0);
check('без ошибок', !errs.length, errs.slice(0,3).join(' | '));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'mobser-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '1800000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const r=JSON.parse(out); if(r.err){ console.log('ERR', r.err); process.exit(1); }
console.log(JSON.stringify(r.notes));
if(r.fails.length){ console.log('FAIL\n- '+r.fails.join('\n- ')); process.exit(1); }
console.log('OK mobile series');
