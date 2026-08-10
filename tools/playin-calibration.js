// Play-In calibration: 500 duos, 22 games, reshuffled 50-team lobbies, the app's
// own playInPointsForPlace and 2 points a kill. Targets from index.html:
// leader 9.8-12.8 elims a match, average placement 16.9-17.8.
const P=require('path').join(__dirname,'..') + '/';
const Z=require(P+'zone-sim.js'), fs=require('fs');
const src=fs.readFileSync(P+'tools/zone-sim-test.js','utf8');
const LAND=eval(src.match(/const LAND = (\[[\s\S]*?\n\];)/)[1].replace(/;$/,''));
const ASPECT=970/1100, PLAYIN_VR_BONUS=9;
function playInPoints(place){
  if(place>25) return 0;
  let pts=2*(26-Math.max(place,6));
  if(place<=5) pts+=4*(6-Math.max(place,2));
  if(place===1) pts+=PLAYIN_VR_BONUS;
  return pts;
}
// A Play-In field is thousands deep and far more spread than a final's fifty.
function field(n){
  const t=[], c=v=>Math.max(5,Math.min(99,v));
  for(let i=0;i<n;i++){
    const q=1-i/(n-1), a=20+q*75, tl=(i%2?1:-1)*12;
    t.push({name:'P'+i, pow:70+q*36, squad:[{},{}], _uid:i,
      attrs:{END:c(a-tl),SUR:c(a-tl*0.6),AIM:c(a+tl),CLU:c(a+tl*0.6)}});
  }
  return t;
}
function run(runs, N=500, GAMES=22){
  const acc={el:0,pl:0,w:0,pts:0};
  for(let s=1;s<=runs;s++){
    const rng=Z.createRng(s), teams=field(N);
    teams.forEach(t=>{t.pts=0;t.el=0;t.w=0;t.ps=0;t.g=0;});
    const duel=(a,b)=>{const wa=Math.pow(a.pow,7),wb=Math.pow(b.pow,7);return rng()*(wa+wb)<wa?a:b;};
    for(let g=0;g<GAMES;g++){
      const pool=teams.slice();
      for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
      for(let k=0;k<pool.length;k+=50){
        const lobby=pool.slice(k,k+50); if(lobby.length<2) continue;
        const {order}=Z.simulateZoneGame(lobby,{rng,land:LAND,aspect:ASPECT,
          startOf:()=>({x:12+rng()*76,y:8+rng()*84}),duel,record:false});
        order.forEach((t,i)=>{t.pts+=playInPoints(i+1)+t._elims*2;t.el+=t._elims;t.ps+=i+1;t.g++;if(i===0)t.w++;});
      }
    }
    const T=teams.slice().sort((a,b)=>b.pts-a.pts);
    acc.pts+=T[0].pts; acc.el+=T[0].el/T[0].g; acc.pl+=T[0].ps/T[0].g; acc.w+=T[0].w;
  }
  Object.keys(acc).forEach(k=>acc[k]/=runs); return acc;
}
const G=JSON.parse(process.argv[2]||'{}');
if(G.ec){
  console.log('  chance bias floor chain | elims  place  wins  pts   (real 9.8-12.8 / 16.9-17.8)');
  for(const ec of G.ec) for(const eb of G.eb) for(const ef of G.ef){
    Z.tune({ENGAGE_CHANCE:ec,ENGAGE_BIAS:eb,EXPOSURE_FLOOR:ef,CHAIN_CHANCE:G.ch||0.7});
    const r=run(G.n||3);
    console.log('  '+String(ec).padEnd(6)+' '+String(eb).padEnd(4)+' '+String(ef).padEnd(5)+' '+
      String(G.ch||0.7).padEnd(5)+' | '+r.el.toFixed(2).padStart(5)+'  '+r.pl.toFixed(2).padStart(5)+
      '  '+r.w.toFixed(2).padStart(4)+'  '+r.pts.toFixed(0).padStart(4));
  }
} else {
  Z.profile('open');
  const r=run(4);
  console.log('current profile:', Z.profile());
  console.log('  elims/match', r.el.toFixed(2), '(real 9.8-12.8)');
  console.log('  avg place  ', r.pl.toFixed(2), '(real 16.9-17.8)');
  console.log('  wins       ', r.w.toFixed(2), ' points', r.pts.toFixed(0));
}
