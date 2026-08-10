// A standalone replica of simulateGame from index.html, so the old engine can
// be measured on exactly the field the zone engine is measured on. Copied
// structure for structure: fight fraction by lobby size, survival-bias
// weighting, duo duel exponent 7, hot streak to 3. Finals settings, so
// FORM_SPREAD is 0 and SURVIVAL_BIAS is 16.
const SURVIVAL_BIAS=16, DUEL_EXP=7, FORM_SPREAD=0;
function gameForm(){ return 1 + ((Math.random()+Math.random()+Math.random())/3-0.5)*2*FORM_SPREAD; }
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function pickWeighted(pool,w,count){
  const arr=pool.slice(),picked=[];
  while(picked.length<count&&arr.length){
    const ws=arr.map(w),tot=ws.reduce((s,x)=>s+x,0)||1;
    let r=Math.random()*tot,i=0;
    for(;i<arr.length;i++){r-=ws[i];if(r<=0)break;}
    i=Math.min(i,arr.length-1);picked.push(arr[i]);arr.splice(i,1);
  }
  return picked;
}
function simulateGame(teams){
  if(!teams.length) return [];
  let alive=teams.slice(); const out=[];
  alive.forEach(t=>{t._elims=0;t._pf=Math.max(1,t.pow*gameForm());t._pc=Math.max(1,t._pf);});
  let round=0; const maxRounds=teams.length+8;
  while(alive.length>1&&round<maxRounds){
    round++;
    const n=alive.length;
    const frac=n>35?0.18:n>20?0.32:n>8?0.55:1;
    let fc=Math.max(2,Math.round(n*frac)); fc-=fc%2;
    const cap=n-(n%2); if(fc<2)fc=2; if(fc>cap)fc=cap;
    const avg=alive.reduce((s,t)=>s+t._pf,0)/alive.length||1;
    const fighters=pickWeighted(alive,t=>Math.pow(avg/Math.max(t._pf,1),SURVIVAL_BIAS),fc);
    for(let i=fighters.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[fighters[i],fighters[j]]=[fighters[j],fighters[i]];}
    for(let i=0;i<fighters.length;i+=2){
      const a=fighters[i],b=fighters[i+1];
      if(!alive.includes(a)||!alive.includes(b))continue;
      const wa=Math.pow(a._pc,DUEL_EXP),wb=Math.pow(b._pc,DUEL_EXP);
      const win=Math.random()*(wa+wb)<wa?a:b, los=win===a?b:a;
      win._elims+=los.squad.length; out.push(los); alive.splice(alive.indexOf(los),1);
      let st=win,ch=0;
      while(ch<3&&alive.length>1&&Math.random()<clamp(st._pc/460,0.05,0.4)){
        const cand=alive.filter(t=>t!==st); if(!cand.length)break;
        const v=pickWeighted(cand,t=>1/(t._pf+30),1)[0];
        const sw=Math.pow(st._pc,DUEL_EXP),vw=Math.pow(v._pc,DUEL_EXP);
        const cwn=Math.random()*(sw+vw)<sw?st:v, cl=cwn===st?v:st;
        cwn._elims+=cl.squad.length; out.push(cl); alive.splice(alive.indexOf(cl),1);
        if(cwn!==st)break; st=cwn; ch++;
      }
    }
  }
  if(alive.length>1){for(let i=alive.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[alive[i],alive[j]]=[alive[j],alive[i]];}}
  return [alive[0],...out.slice().reverse()];
}
const PLACE=[65,56,52,48,44,40,38,36,34,32,30,28,26,24,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,2,2,2,2,2,1,1,1,1,1,0,0,0,0,0];
function field(){const t=[];for(let i=0;i<50;i++){const q=1-i/49,a=25+q*70,c=v=>Math.max(5,Math.min(99,v)),tl=(i%2?1:-1)*12;
  t.push({name:'F'+i,pow:83+q*21,squad:[{},{}],attrs:{END:c(a-tl),SUR:c(a-tl*0.6),AIM:c(a+tl),CLU:c(a+tl*0.6)}});}return t;}
// The landing system that ran in front of the old engine, replicated the same
// way the engine is: 36 spots off the map, drawn fresh every game, and every
// contested one settled by a pow^3 coin flip before the game starts. The loser
// is out — it finishes below everybody who played — and the winner banks two
// eliminations per squad it beat.
//
// This is here because leaving it out made the comparison dishonest. The zone
// engine plays its drop on the map and can lose the leader there; a baseline
// with no drop at all cannot, so the old column looked better on average
// placement for a reason that had nothing to do with either engine. The app
// always played this fight — it just played it off-screen.
const SPOTS=36, LANDING_EXP=3;
function landingFights(teams){
  const spots=teams.map(()=>Math.floor(Math.random()*SPOTS));
  const groups=new Map();
  teams.forEach((t,i)=>{ if(!groups.has(spots[i])) groups.set(spots[i],[]); groups.get(spots[i]).push(t); });
  const out=[], bonus=new Map();
  groups.forEach(group=>{
    if(group.length<2) return;
    const tot=group.reduce((s,t)=>s+Math.pow(Math.max(t.pow,1),LANDING_EXP),0)||1;
    let r=Math.random()*tot, win=group[0];
    for(const t of group){ r-=Math.pow(Math.max(t.pow,1),LANDING_EXP); if(r<=0){ win=t; break; } }
    bonus.set(win,(group.length-1)*2);
    group.forEach(t=>{ if(t!==win) out.push(t); });
  });
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return {out, bonus};
}

const acc={pts:0,w:0,pl:0,el:0,p10:0,p25:0,p50:0}, RUNS=200;
for(let s=0;s<RUNS;s++){
  const teams=field(); teams.forEach(t=>{t.pts=0;t.el=0;t.w=0;t.ps=0;});
  for(let g=0;g<12;g++){
    const {out, bonus}=landingFights(teams);
    const gone=new Set(out);
    out.forEach(t=>{t._elims=0;});
    const order=[...simulateGame(teams.filter(t=>!gone.has(t))), ...out];
    order.forEach((t,i)=>{const e=t._elims+(bonus.get(t)||0);
      t.pts+=PLACE[i]+e*4;t.el+=e;t.ps+=i+1;if(i===0)t.w++;});
  }
  const T=teams.slice().sort((a,b)=>b.pts-a.pts);
  acc.pts+=T[0].pts;acc.w+=T[0].w;acc.pl+=T[0].ps/12;acc.el+=T[0].el/12;acc.p10+=T[9].pts;acc.p25+=T[24].pts;acc.p50+=T[49].pts;
}
Object.keys(acc).forEach(k=>acc[k]/=RUNS);
console.log('OLD ENGINE on the same synthetic field, '+RUNS+' finals:');
console.log('  #1 points      '+acc.pts.toFixed(0)+'   (real 732-738, index.html reports 721)');
console.log('  #1 wins        '+acc.w.toFixed(2)+'   (real 2-4, index.html reports 3.08)');
console.log('  #1 avg place   '+acc.pl.toFixed(2)+'   (real 6.83-8.00, index.html reports 8.40)');
console.log('  #1 elims/match '+acc.el.toFixed(2)+'   (real 4.50-4.75, index.html reports 4.34)');
console.log('  #10 points     '+acc.p10.toFixed(0)+'   (real 376-380, index.html reports 386)');
console.log('  #25 points     '+acc.p25.toFixed(0)+'   (real 222-240, index.html reports 236)');
console.log('  #50 points     '+acc.p50.toFixed(0)+'   (real 8-28, index.html reports 31)');
console.log('  top:bottom     '+(acc.p50>0?(acc.pts/acc.p50).toFixed(0):'inf')+'x  (real 26-92x, index.html reports 23x)');
