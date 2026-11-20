/* Соло-год после 2026-го (игрок: «в конце года выбираешь карту и формат, добавь соло»): в окне формата есть «Соло»,
   год с размером 1 перематывается целиком без ошибок, вечера идут на одного (без напарников в журнале), турниров
   в журнале не меньше, чем в дуо-году с тем же стартом.
   Запуск: node tools/check-career-solo-year.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=(size)=>String.raw`
const errs=[]; window.addEventListener('error', e=>errs.push(String(e.message)+' @'+e.lineno));
window.addEventListener('unhandledrejection', e=>errs.push('rej '+String(e.reason && (e.reason.stack||e.reason)).slice(0,300)));
setInterval(function(){
  const am=document.getElementById("ccAskModal");
  if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"); if(no){ no.click(); return; } }
  const cb=document.querySelector(".cc-choice-btn"); if(cb){ cb.click(); return; }
  const p=document.querySelector(".landing-picker"); if(p){ const z=p.querySelectorAll(".land-zone"); if(z.length){ z[0].click(); const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click(); } }
}, 30);
const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
localStorage.setItem('fncsdraft_career', JSON.stringify({
  v:1, player:{nick:'Solar', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
    region:'EU', ovr:90, role:'roleFRG', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, size:2, year:2026, year0:2026, day:'2026-11-29', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'solar'},
  partners:[{card:card('M1',88), patience:60, since:'2025-11-01', dev:0}]}));
const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleFRG'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
careerEntry(); careerNewSeason();
const cr=CAREER.career;
let btn=false;
try{ ccFmtYearOpen(); const m=document.getElementById('ccFmtModal'); btn=!!(m && m.querySelector('[data-fk="n"][data-fv="1"]')); }catch(e){ errs.push('open '+e); }
ccFmtYearSet(${size});
const size=careerSquadSize(), start=cr.day;
try{ careerRenderHub('centre'); }catch(e){ errs.push('hub '+String(e.stack||e).slice(0,300)); }
const t0=Date.now();
await careerFastForward(400);
for(let i=0;i<20000 && CC_FF;i++) await new Promise(r=>setTimeout(r, 50));
const log=(cr.log||[]).filter(e=>e && e.season===cr.season);
// Кап со своим форматом турнира (ev.fmt: сквад-кап S43 и т.п.) и Кубок наций (сборная) играются своим составом и в соло-год.
const fixedFmt=e=>{ if(e.kind==="nations") return true; try{ const v=(e.kind==="victory"||!e.kind) ? (ccVictoryAlts(e.day)||[]).find(x=>x.fmt) : null; return !!v; }catch(err){ return false; } };
const withMates=log.filter(e=>Array.isArray(e.mates) && e.mates.filter(Boolean).length && !fixedFmt(e));
const kinds={}; log.forEach(e=>{ kinds[e.kind||e.type||"?"]=(kinds[e.kind||e.type||"?"]||0)+1; });
let hub=''; try{ careerRenderHub('centre'); hub='ok'; ['history','profile','media'].forEach(t=>{ try{ careerRenderHub(t); }catch(e){ errs.push('tab '+t+' '+String(e.stack||e).slice(0,200)); } }); }catch(e){ hub=String(e.stack||e).slice(0,300); }
return {btn, size, start, end:cr.day, over:!!cr.seasonOver, n:log.length, kinds, withMates:withMates.length,
  mateSample:withMates.slice(0,3).map(e=>(e.kind||e.type)+' '+e.day+' '+JSON.stringify(e.mates).slice(0,80)), ffErr:(window.CC_FF_ERR||null), errs:errs.slice(0,8), hub, secs:Math.round((Date.now()-t0)/1000)};
`;
const run=(size)=>{
  const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'soloy-')),'body.js'); fs.writeFileSync(tmp, body(size));
  const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '3000000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','inherit']});
  return JSON.parse(out);
};
const solo=run(1);
if(process.env.CC_VERBOSE) console.log(JSON.stringify(solo, null, 1));
const fails=[];
if(solo.err){ console.log('FAIL', solo.err); process.exit(1); }
if(!solo.btn) fails.push('в окне формата нет кнопки «Соло»');
if(solo.size!==1) fails.push('размер после выбора '+solo.size);
if(!solo.over) fails.push('год не доехал до конца: '+solo.end);
if(solo.withMates) fails.push('вечера с напарниками в соло-год: '+solo.withMates+' '+solo.mateSample.join(' | '));
if(solo.errs.length) fails.push('ошибки: '+solo.errs.join(' | '));
if(solo.hub!=='ok') fails.push('хаб: '+solo.hub);
const duo=process.env.CC_NO_DUO ? null : run(2);
if(duo && !duo.err && solo.n < duo.n*0.8) fails.push('турниров в соло-год '+solo.n+' против '+duo.n+' в дуо-год');
console.log((fails.length ? 'FAIL ' : 'OK ')+'соло-год: '+solo.n+' вечеров '+JSON.stringify(solo.kinds)+(duo ? ' · дуо-год '+duo.n : '')+' · '+solo.secs+' с'+(fails.length ? '\n  '+fails.join('\n  ') : ''));
process.exit(fails.length ? 1 : 0);
