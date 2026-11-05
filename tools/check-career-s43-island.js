// Остров S43: с 1 ноября 2026 сезонный остров s43 (картинка, 40 клеток, лут по клеткам, пул S42), до этого s42,
// соло-FNCS и 2027+ не тронуты; вечер проходит на этом острове.
//   node tools/check-career-s43-island.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const errs=[]; window.addEventListener('error', e=>errs.push(String(e.message)));
setInterval(()=>{ const am=document.getElementById('ccAskModal'); if(am && am.style.display==='flex'){ const y=document.getElementById('ccAskYes'); if(y) y.click(); }
  const p=document.querySelector('.landing-picker'); if(!p) return; const z=p.querySelectorAll('.land-zone'); if(!z.length) return; z[0].click(); const c=p.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click(); }, 30);
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const save=(day, extra)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null},
  career:Object.assign({season:1, size:2, year:2026, year0:2026, day:day, seasonOver:false, division:5, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'s43'}, extra||{}),
  partner:{card:card('M1',80), patience:60, since:'2026-01-01', dev:0}, partners:[{card:card('M1',80), patience:60, since:'2026-01-01', dev:0}]}));
  CC_POOLS=null; careerLoad(); careerMigrateSize(); careerMigrateClock(); };
save('2026-10-31'); check('31.10 ещё s42', careerBrSet()==='s42', careerBrSet());
save('2026-11-01'); check('1.11 уже s43', careerBrSet()==='s43', careerBrSet());
const zs=ZONE_SETS.s43, st=ZONE_STATS.s43;
notes.zones=zs.length;
check('клетки и лут вровень', zs.length>=22 && zs.length===st.length, zs.length+' '+st.length);
check('клетки разного размера', Math.max(...zs.map(z=>z.w))-Math.min(...zs.map(z=>z.w))>5);
check('клетки не пересекаются', zs.every((a,i)=>zs.every((b,j)=>i>=j || !(a.x<b.x+b.w-.01 && b.x<a.x+a.w-.01 && a.y<b.y+b.h-.01 && b.y<a.y+a.h-.01))));
check('Noble: большие клетки', Math.max(...zs.map(z=>z.w))>18, Math.max(...zs.map(z=>z.w)));
check('клетки в кадре', zs.every(z=>z.x>=0 && z.y>=0 && z.x+z.w<=100 && z.y+z.h<=100));
check('картинка и пропорция', MAP_ART.s43==='art/map-s43.jpg' && MAP_ASPECT.s43==='1/1');
check('лут сезона', ccLootSet('s43')==='s43' && CC_LOOT_BY_SET.s43.weapons===S43_WEAPON_POOL);
const was=ACTIVE_LANDING_SET, wasSq=squadSize; squadSize=3; useLandingSet('s43');
check('клетки встали', ACTIVE_LANDING_SET==='s43' && ALL_LANDING_ZONES.length>=20, ACTIVE_LANDING_SET+' '+ALL_LANDING_ZONES.length);
notes.named=ALL_LANDING_ZONES.filter(z=>z.n).length;
squadSize=wasSq; useLandingSet(was);
// Вечер на этом острове: кап Victory 9 ноября.
save('2026-11-09');
const next=careerNext(); notes.next=next && (next.type+' '+next.day);
check('в этот день играется кап', next && next.type==='victory', JSON.stringify(next));
check('вечер на s43', careerNightSet(next)==='s43', careerNightSet(next));
const n0=CAREER.career.log.length, seen=[]; const was2=useLandingSet; useLandingSet=function(k){ seen.push(k); return was2.apply(this, arguments); };
skipAnimation=true; CC_SKIP_RUN=true;
const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
await Promise.race([runCareerVictory(), new Promise(r=>setTimeout(r, 500000))]);
clearInterval(sk); useLandingSet=was2; notes.seen=[...new Set(seen)];
check('игры прошли на s43', seen.includes('s43') && !seen.includes('s42'), seen.slice(0,6).join());
notes.logged=CAREER.career.log.length-n0; notes.set=ACTIVE_LANDING_SET;
check('вечер записан', CAREER.career.log.length>n0, CAREER.career.log.length);
check('без ошибок', !errs.length, errs.slice(0,3).join(' | '));
// Трио: S43 идёт составом из трёх, кресла добирает режим; Trios Cash Cup 7 ноября в календаре и играется.
save('2026-10-31'); check('31.10 ещё дуо', careerSquadSize()===2 && !ccPhaseRoster(), careerSquadSize());
save('2026-11-02');
check('в S43 трио', careerSquadSize()===3, careerSquadSize());
check('кресла заняты', !careerMatesShort(), careerMatesShort());
notes.mates=careerMates().filter(Boolean).map(c=>c.handle);
CAREER.career.day='2026-11-07';
const v=ccVictoryAlts('2026-11-07').find(x=>x.id==='S43_TriosCashCup');
check('Trios Cash Cup в календаре', !!v && ccVictoryFormat(v)===3, JSON.stringify(v&&v.id));
check('приз из таблицы', v && ccVictoryPayOf(v,1)>0, v && ccVictoryPayOf(v,1));
// FNCS Solo Reload ноября: Nitemare Island (r5), а не старые острова Reload.
save('2026-11-07');
const rlEv={spec:CC_SOLOS_STAGES.rlr2};
check('Solo Reload на Nitemare', ccSoloFncsSet(rlEv)==='r5', ccSoloFncsSet(rlEv));
check('Nitemare: картинка и клетки', MAP_ART.r5==='art/map-r5.jpg' && ZONE_SETS.r5.length>=25 && ZONE_SETS.r5.length===ZONE_STATS.r5.length, ZONE_SETS.r5.length);
{ const was=ACTIVE_LANDING_SET, sq=squadSize; squadSize=1; useLandingSet('r5'); check('соло-клетки не дробятся', ALL_LANDING_ZONES.length===ZONE_SETS.r5.length, ALL_LANDING_ZONES.length); check('лут круга Reload', /^r[1-4]$/.test(ccLootSet()), ccLootSet()); squadSize=sq; useLandingSet(was); }
// Настоящий вечер трио 22 ноября.
save('2026-11-22');
const nx=careerNext(); notes.next22=nx && (nx.type+' '+nx.day);
const ev22=careerVictoryOn('2026-11-22'); check('22.11 это Trios Cash Cup', ev22 && ev22.id==='S43_TriosCashCup', ev22 && ev22.id);
const n22=CAREER.career.log.length, sk2=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
await Promise.race([runCareerVictory(), new Promise(r=>setTimeout(r, 500000))]);
clearInterval(sk2);
const last=CAREER.career.log[CAREER.career.log.length-1]; notes.trio={place:last&&last.place, label:last&&(last.label||last.id), size:careerSquadSize(), prize:last&&last.prize};
check('вечер трио записан', CAREER.career.log.length>n22, CAREER.career.log.length);
check('без ошибок в трио', !errs.length, errs.slice(0,3).join(' | '));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'s43-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '900000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
if(res.fails.length){ res.fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-career-s43-island');
