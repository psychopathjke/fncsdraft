/* Тройка, у которой игрок забрал человека (отзыв 25.10: «команда, у которой я забрал игрока, начинает
   либо с каким-то слабым игроком играть, либо на каждый турнир из других триосов воровать по игроку»).
   Трио-год 2026, Д1. Забираем третьего у сильнейшей тройки (A) и одного из ядра у второй (B) и шесть
   комнат подряд смотрим: у A один и тот же третий и близкий по силе; у B оставшиеся двое вместе, третий
   тот же и близкий; никто из них не сидит с чужим запомненным третьим. См. ccTrioRefill.
   Запуск: node tools/check-career-trio-steal.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
localStorage.setItem('fncsdraft_career', JSON.stringify({
  v:1, player:{nick:'ProbeSteal', age:19, source:'rookie', country:'de', countryPing:15,
    closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
    photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:2, size:3, day:'2026-02-05', division:1, earnings:0, balance:0,
          reach:0, tokens:[], log:[], news:[]},
  partner:null}));
careerEntry();
CARD_MODE=true; squadSize=3;
const cr=CAREER.career, fails=[];
const ovr=c=>Math.round(ccCardOvr(c)*10)/10;
const real=c=>c && c.handle && c.tier!=='ladder';
const f0=careerCupField(cr, [], careerCupSize(1), 'steal0', false, 0);
const trios=f0.map(t=>(t.squad||[]).filter(Boolean)).filter(s=>s.length===3 && s.every(real));
const memo=cr.trios;
const withMemo=trios.map(s=>{ const ks=s.map(hKey); const key=Object.keys(memo).find(k=>{ const p=k.split('+'); return p.every(x=>ks.indexOf(x)>=0) && ks.indexOf(memo[k])>=0; }); return key ? {s, key, third:memo[key]} : null; })
  .filter(Boolean).sort((a,b)=>b.s.reduce((x,c)=>x+ccCardOvr(c),0)-a.s.reduce((x,c)=>x+ccCardOvr(c),0));
if(withMemo.length<2) return {fails:['нет двух троек с записанным третьим'], notes:{}};
const A=withMemo[0], B=withMemo[1];
const thirdCard=A.s.find(c=>hKey(c)===A.third);
const coreB=B.key.split('+'); const takeB=B.s.find(c=>hKey(c)===coreB[0]); const leftB=coreB[1];
const mine=[thirdCard, takeB];
const others=()=>{ const o=new Set(); Object.keys(cr.trios).forEach(k=>{ if(!k.split('+').some(x=>x===hKey(thirdCard)||x===hKey(takeB)||x===leftB)) o.add(cr.trios[k]); }); return o; };
const rows=[], sizes=[['cup', careerCupSize(1), false], ['final', ccTeams(50), false], ['open', 2100, true]];
const aSeen=new Set(), bSeen=new Set();
for(let w=0; w<6; w++){
  const [nm, sz, op]=sizes[w%3];
  const before=others();
  const f=careerCupField(cr, mine, sz, 'steal'+(w+1), op, 0);
  const sqOf=h=>{ const t=f.find(t=>(t.squad||[]).some(c=>c && hKey(c)===h)); return t ? t.squad.filter(Boolean) : null; };
  const aCore=A.key.split('+'), a=sqOf(aCore[0]), b=sqOf(leftB);
  if(a){ const t=a.find(c=>aCore.indexOf(hKey(c))<0); if(t){ aSeen.add(hKey(t));
    const avg=(ccCardOvr(a.find(c=>hKey(c)===aCore[0]))+ccCardOvr(a.find(c=>hKey(c)===aCore[1])))/2;
    if(avg-ccCardOvr(t)>6) fails.push(nm+': у A слабый третий '+t.handle+' '+ovr(t)+' при '+avg.toFixed(1)); } }
  if(b){ b.forEach(c=>{ if(hKey(c)!==leftB) bSeen.add(hKey(c)); });
    if(!b.some(c=>hKey(c)===B.third)) fails.push(nm+': у B нет бывшего третьего '+B.third);
    b.filter(c=>hKey(c)!==leftB && before.has(hKey(c))).forEach(c=>fails.push(nm+': B увёл чужого третьего '+c.handle)); }
  rows.push(nm+' A: '+(a ? a.map(c=>c.handle+' '+ovr(c)).join(' & ') : '-')+' | B: '+(b ? b.map(c=>c.handle+' '+ovr(c)).join(' & ') : '-'));
}
if(aSeen.size>1) fails.push('у A третий меняется: '+[...aSeen].join(','));
if(bSeen.size>2) fails.push('у B состав меняется: '+[...bSeen].join(','));
if(!aSeen.size) fails.push('A ни разу не в комнате');
if(!bSeen.size) fails.push('B ни разу не в комнате');
return {fails, notes:{A:A.s.map(c=>c.handle).join(' & ')+' без '+thirdCard.handle, B:B.s.map(c=>c.handle).join(' & ')+' без '+takeB.handle, rows}};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tsteal-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-trio-steal'); process.exit(res.fails.length?1:0);
