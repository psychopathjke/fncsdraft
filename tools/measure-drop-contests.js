// Замер высадки: кто садится на самые богатые точки и контестят ли их. Лобби по силе, 12 турниров подряд, разные сиды.
//   node tools/measure-drop-contests.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const runs=[['s43',3,33],['s43',2,50],['s42',2,50],['m2',2,50],['r5',1,40]];
const out=[];
for(const [set,size,N] of runs){
  squadSize=size; useLandingSet(set);
  const zones=ALL_LANDING_ZONES.map(z=>({z,k:z.x+','+z.y,r:z.r||0})).sort((a,b)=>b.r-a.r);
  const topK=zones.slice(0,5).map(z=>z.k), key=z=>z ? z.x+','+z.y : '?';
  const S={games:0, zone1Rank:0, top5Rank:0, top5Teams:0, top5Solo:0, top5Cnt:0, t10Contested:0, t10Top5:0, t10Cnt:0, t3Contested:0, t3Cnt:0, t3Top1:0, rest:0, restCnt:0, sameAsTop:0, zone1Solo:0};
  for(let s=0;s<16;s++){
    CAREER={career:{season:1+s, day:'2026-11-10'}};
    const field=[];
    for(let i=0;i<N;i++){ const sq=[]; for(let m=0;m<size;m++) sq.push({handle:'b'+s+'_'+i+'_'+m, rating:60}); field.push({name:'T'+s+'_'+i, pow:116-i*(30/N), closeEdge:0, stagePts:0, squad:sq, rank:i}); }
    for(let e=0;e<12;e++){
      const day='2026-11-'+String(1+e).padStart(2,'0');
      CAREER.career.day=day;
      field.forEach((t,i)=>{ t.stagePts=(i*37+e*101+s*13)%97; });
      CC_DROP_STAGE=day+'|'+(1+s)+'|s1|total';
      buildBotLandingAssignment(field);
      const by={}; field.forEach(t=>{ const k=key(t.landingZone); (by[k]=by[k]||[]).push(t.rank); });
      S.games++;
      topK.forEach((k,idx)=>{ const a=by[k]||[]; if(a.length){ const av=a.reduce((x,y)=>x+y,0)/a.length; S.top5Rank+=av; S.top5Cnt++; S.top5Teams+=a.length; if(a.length===1) S.top5Solo++; if(idx===0){ S.zone1Rank+=av; if(a.length===1) S.zone1Solo++; } } });
      field.forEach(t=>{ const a=by[key(t.landingZone)]||[], inTop=topK.includes(key(t.landingZone));
        if(t.rank<10){ S.t10Cnt++; if(a.length>1) S.t10Contested++; if(inTop) S.t10Top5++; if(a.some(x=>x<10&&x!==t.rank)) S.sameAsTop++; }
        if(t.rank<3){ S.t3Cnt++; if(a.length>1) S.t3Contested++; if(key(t.landingZone)===topK[0]) S.t3Top1++; }
        S.rest+=a.length; S.restCnt++; });
    }
  }
  out.push({set, size, N, cells:zones.length, top5rich:zones.slice(0,5).map(z=>(z.z.n||'?')+':'+z.r).join(', '),
    rankOnRichest:+(S.zone1Rank/S.games+1).toFixed(1), rankOnTop5:+(S.top5Rank/S.top5Cnt+1).toFixed(1), teamsOnTop5:+(S.top5Teams/S.top5Cnt).toFixed(2),
    richestAlonePct:Math.round(S.zone1Solo/S.games*100), top5AlonePct:Math.round(S.top5Solo/S.top5Cnt*100),
    top10ContestedPct:Math.round(S.t10Contested/S.t10Cnt*100), top10WithTop10Pct:Math.round(S.sameAsTop/S.t10Cnt*100), top10OnTop5Pct:Math.round(S.t10Top5/S.t10Cnt*100),
    top3ContestedPct:Math.round(S.t3Contested/S.t3Cnt*100), avgTeamsPerLanding:+(S.rest/S.restCnt).toFixed(2)});
}
return out;
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'drop-')),'body.js'); fs.writeFileSync(tmp, body);
const res=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
console.log(res);
