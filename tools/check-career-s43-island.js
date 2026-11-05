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
check('40 клеток и столько же лута', zs.length===40 && st.length===40, zs.length+' '+st.length);
check('клетки в кадре', zs.every(z=>z.x>=0 && z.y>=0 && z.x+z.w<=100 && z.y+z.h<=100));
check('картинка и пропорция', MAP_ART.s43==='art/map-s43.jpg' && MAP_ASPECT.s43==='1/1');
check('лут сезона', ccLootSet('s43')==='s43' && CC_LOOT_BY_SET.s43.weapons===S43_WEAPON_POOL);
const was=ACTIVE_LANDING_SET; useLandingSet('s43');
check('клетки встали', ACTIVE_LANDING_SET==='s43' && ALL_LANDING_ZONES.length>=20, ACTIVE_LANDING_SET+' '+ALL_LANDING_ZONES.length);
notes.named=ALL_LANDING_ZONES.filter(z=>z.n).length;
useLandingSet(was);
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
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'s43-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '900000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
if(res.fails.length){ res.fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-career-s43-island');
