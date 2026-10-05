const out={errs:[], calls:{}, dup:[], sw:{}};
window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
window.confirm=()=>true; window.alert=()=>{};
const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const P=(MATE)=>({card:MATE, patience:60, since:'2023-11-01', dev:0});
localStorage.setItem('fncsdraft_career', JSON.stringify({
  v:1, player:{nick:'Nextyear', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:6,
    region:'EU', ovr:93, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, size:2, year:2024, year0:2024, day:'2024-09-08', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'p05ff'},
  partner:P(card('M1',93)), partners:[P(card('M1',93)), P(card('M2',93))]}));
const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(93,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
careerLoad(); careerMigrateSize();
careerNewSeason();
const handlesOf=t=>{ const sq=t && (t.squad||t.cards||t.players||t.members); return Array.isArray(sq) ? sq.map(c=>String((c&&c.handle)||c||'')) : []; };
const look=(r, fn)=>{
  const arr=Array.isArray(r) ? r : (r && Array.isArray(r.teams) ? r.teams : (r && Array.isArray(r.field) ? r.field : null));
  if(!arr || !arr.length) return;
  out.calls[fn]=(out.calls[fn]||0)+1;
  const m={};
  arr.forEach((t,i)=>handlesOf(t).forEach(h=>{ const k=h.trim().toLowerCase(); if(!k) return; (m[k]=m[k]||[]).push(i); }));
  const d=Object.entries(m).filter(([k,v])=>v.length>1);
  if(d.length && out.dup.length<15) out.dup.push({fn, day:careerToday(), n:arr.length, d:d.slice(0,4).map(([k,v])=>k+' :: '+v.map(i=>handlesOf(arr[i]).join('&')).join(' | '))});
  arr.forEach(t=>{ const hs=handlesOf(t); if(hs.some(h=>/^\s*(swizzy|malibuca)\s*$/i.test(h))) { const key=fn+':'+hs.join('&'); out.sw[key]=(out.sw[key]||0)+1; } });
};
['careerCupField','careerGlobalsField','careerSummitField','careerVictoryField','careerWeeklyFinalField','ccRcField','ccCupField','ccMajorFinalField','ccGlobField','buildGlobalChampionship2025Field','fillRealFieldTeams','fillFieldTeams','lastChanceField','ccPrField','careerSoloField'].forEach(fn=>{
  if(typeof window[fn]!=='function') return;
  const orig=window[fn];
  window[fn]=function(){ const r=orig.apply(this, arguments); try{ look(r, fn); }catch(e){} return r; };
});
const t0=Date.now();
careerFastForward(+((window.__DAYS)||330));
let w=0; while((typeof CC_FF!=='undefined' && CC_FF) && w++<20000) await new Promise(r=>setTimeout(r, 200));
out.day=careerToday(); out.ms=Date.now()-t0;
try{ const rows=careerTableRows(); out.tableSw=rows.map((r,i)=>i+1+'. '+r.name).filter(x=>/swizz|malibuca|merstach/i.test(x));
  const cnt={}; rows.forEach(r=>String(r.name||'').split(/\s*[+&]\s*/).forEach(h=>{ const k=h.trim().toLowerCase(); cnt[k]=(cnt[k]||0)+1; }));
  out.tableDup=Object.entries(cnt).filter(([k,v])=>v>1).slice(0,20); }catch(e){ out.tableErr=String(e); }
try{ const pr=careerPrRows(); const cnt={}; pr.forEach(r=>{ const k=String(r.name).trim().toLowerCase(); cnt[k]=(cnt[k]||0)+1; }); out.prDup=Object.entries(cnt).filter(([k,v])=>v>1).slice(0,20);
  out.prSw=pr.map((r,i)=>i+1+'. '+r.name).filter(x=>/swizz|malibuca/i.test(x)); }catch(e){ out.prErr=String(e); }
return out;
