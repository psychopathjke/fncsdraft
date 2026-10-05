const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
localStorage.setItem('fncsdraft_career', JSON.stringify({
  v:1, player:{nick:'Nextyear', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:6,
    region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, size:2, year:2024, year0:2024, day:'2024-09-08', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'p05'},
  partner:{card:card('M1',80), patience:60, since:'2023-11-01', dev:0},
  partners:[{card:card('M1',80), patience:60, since:'2023-11-01', dev:0}]}));
const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
careerLoad(); careerMigrateSize();
const before=new Map(); careerPools().players.forEach(c=>before.set(c._k||hKey(c), c._ovr));
careerNewSeason();
const cr=CAREER.career;
const T=ccRealTargets(2025);
let gaps=[]; before.forEach((o,k)=>{ const t=T.get(k); if(t!=null) gaps.push(t-o); });
const stat=a=>({n:a.length, meanAbs:+(a.reduce((x,y)=>x+Math.abs(y),0)/a.length).toFixed(2), ge3:a.filter(x=>Math.abs(x)>=3).length, ge5:a.filter(x=>Math.abs(x)>=5).length});
const res={gaps:stat(gaps), at:[]};
const snap=()=>{ CC_POOLS=null; const p=careerPools().players; let ch=0, n=0, sum=0; p.forEach(c=>{ const b=before.get(c._k||hKey(c)); if(b==null) return; n++; const d=c._ovr-b; if(d) ch++; sum+=Math.abs(d); });
  const sw=p.find(c=>/^swizzy$/i.test(c.handle)), ma=p.find(c=>/^malibuca$/i.test(c.handle));
  res.at.push({day:careerToday(), frac:+ccRealPullFrac().toFixed(3), changed:ch+'/'+n, meanAbs:+(sum/n).toFixed(2), swizzy:sw&&sw._ovr, swT:T.get('swizzy'), mali:ma&&ma._ovr, maT:T.get('malibuca')}); };
snap();
for(let w=0; w<40 && !cr.seasonOver; w++){ careerSkipWeek(); if(w%6===0) snap(); }
snap();
return res;
