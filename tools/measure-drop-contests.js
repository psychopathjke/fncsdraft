// Замер высадки на всех островах: кто садится на самые богатые точки и контестят ли их. Лобби по силе, 6 сидов по 8 турниров.
//   node tools/measure-drop-contests.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const trio=/^(t[1-4]|j[1-4])$/, solo=/^(s42solo|r5)$/;
const out=[];
for(const set of Object.keys(ZONE_SETS)){
  const runs=solo.test(set) ? [[1,set==='s42solo'?100:40]] : /^r[1-4]$/.test(set) ? [[2,50]] : trio.test(set)||set==='s43' ? [[3,33]] : [[2,50],[3,33]];
  for(const [size,N] of runs){
    squadSize=size; useLandingSet(set);
    const zones=ALL_LANDING_ZONES.map(z=>({k:z.x+','+z.y,r:z.r||0})).sort((a,b)=>b.r-a.r);
    if(zones.length<4) continue;
    const topK=zones.slice(0,5).map(z=>z.k), key=z=>z ? z.x+','+z.y : '?';
    const S={g:0, rank:0, alone:0, t10:0, t10c:0, t3:0, t3c:0, max:0};
    for(let s=0;s<6;s++){
      CAREER={career:{season:1+s, day:'2026-03-10'}};
      const field=[];
      for(let i=0;i<N;i++){ const sq=[]; for(let m=0;m<size;m++) sq.push({handle:'b'+s+'_'+i+'_'+m, rating:60}); field.push({name:'T'+s+'_'+i, pow:116-i*(30/N), closeEdge:0, stagePts:0, squad:sq, rank:i}); }
      for(let e=0;e<8;e++){
        const day='2026-03-'+String(1+e).padStart(2,'0');
        CAREER.career.day=day;
        field.forEach((t,i)=>{ t.stagePts=(i*37+e*101+s*13)%97; });
        CC_DROP_STAGE=day+'|'+(1+s)+'|s1|total';
        buildBotLandingAssignment(field);
        const by={}; field.forEach(t=>{ const k=key(t.landingZone); (by[k]=by[k]||[]).push(t.rank); });
        S.g++;
        const a=by[topK[0]]||[]; if(a.length){ S.rank+=a.reduce((x,y)=>x+y,0)/a.length+1; if(a.length===1) S.alone++; }
        Object.values(by).forEach(v=>{ if(v.length>S.max) S.max=v.length; });
        field.forEach(t=>{ const g=by[key(t.landingZone)]||[]; if(t.rank<10){ S.t10++; if(g.length>1) S.t10c++; } if(t.rank<3){ S.t3++; if(g.length>1) S.t3c++; } });
      }
    }
    out.push([set,size,N,zones.length,+(S.rank/S.g).toFixed(1),Math.round(S.alone/S.g*100),Math.round(S.t3c/S.t3*100),Math.round(S.t10c/S.t10*100),S.max]);
  }
}
return {out};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'drop-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '900000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log(res.err); process.exit(1); }
console.log('остров состав команд клеток | ранг на богатейшей, одна %, топ-3 контест %, топ-10 контест %, макс на точке');
res.out.forEach(r=>console.log(r.join(' ')));
