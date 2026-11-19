const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Scr', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:86, role:'roleIGL', attrs:ccRookieAttrs(86,'roleIGL'), ageEdge:4, photo:null, handle:null},
  career:{season:1, size:2, year:2026, year0:2026, day:'2026-05-05', seasonOver:false, division:2, earnings:0, balance:500, reach:0, tokens:[], log:[], news:[], seed:'sc1', sim:true},
  partner:{card:card('M1',85), patience:60, since:'2020-01-01', dev:0}, partners:[{card:card('M1',85), patience:60, since:'2020-01-01', dev:0}]}));
careerLoad(); careerMigrateSize(); careerMigrateClock();
const out={};
// свободный день
for(let k=0;k<40 && !ccCentreDayOpen();k++){ CAREER.career.day=ccAddDays(CAREER.career.day,1); }
out.day=careerToday(); out.open=ccCentreDayOpen(); out.energy=careerEnergy();
CH_DC='pc'; careerRenderHub('discord');
const body=()=>document.getElementById('chBody').innerText;
out.hasAdmin=/Admin/.test(body()); out.noOldBtn=!document.querySelector('[onclick*="careerPickDay(\'scrim\')"]');
ccDcScrRegister('pc','b1'); ccDcScrCheckIn();
out.playDisabledBeforeMark=!!document.querySelector('[onclick="ccDcScrRun()"][disabled]');
ccDcDropOpen();
const m=document.getElementById('ccDropMapModal');
out.boxes=m.querySelectorAll('.cc-dm-box').length; out.taken=m.querySelectorAll('.cc-dm-box:not(.free)').length; out.hot=m.querySelectorAll('.cc-dm-box.hot').length;
const free=[...m.querySelectorAll('.cc-dm-box:not(.hot)')][0]; free.click();
const m2=document.getElementById('ccDropMapModal'); out.note=m2.querySelector('.cc-dm-note').textContent; out.me=m2.querySelectorAll('.cc-dm-box.me').length;
const r=ccDcScrReg(); out.spot=r.spot; out.marks=r.marks.length;
ccDropMapClose(); careerRenderHub('discord');
out.playEnabled=!!document.querySelector('[onclick="ccDcScrRun()"]:not([disabled])');
const e0=careerEnergy();
await ccDcScrRun();
out.res=r.res; out.matched=r.matched; out.energySpent=e0-careerEnergy(); out.dayClosed=careerDayClosed();
out.news=(CAREER.career.news||[]).slice(-2).map(n=>JSON.stringify(n).slice(0,160));
return out;
