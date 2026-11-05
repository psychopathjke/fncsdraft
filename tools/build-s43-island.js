// Остров S43 (мини-сезон Treasure Hunters): клетки высадки и лут по точкам fortnite.gg (tools/fgg/s43-points.json).
// Клетки: именованная локация 11 % кадра, ориентир 7 %, дальше сгустки сундуков, пока не станет 40. Где две клетки
// налезают, граница посередине. Лут клетки как на s42: сундуки + ящики внутри прямоугольника, r = их сумма.
// Картинка art/map-s43.jpg: вырез lng 64..212, lat -68..-216 (см. build-s43-chests.js).
//   node tools/build-s43-island.js
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname, '..'), F=path.join(ROOT, 'index.html');
const P=JSON.parse(fs.readFileSync(path.join(__dirname, 'fgg', 's43-points.json'), 'utf8'));
const pct=c=>({X:(c[1]-64)/148*100, Y:(-68-c[0])/148*100});
const chests=P.chests.map(pct), rare=P.rare.map(pct), ammo=P.ammo.map(pct);
const r2=v=>Math.round(v*100)/100;
const title=s=>String(s).toLowerCase().replace(/(^|[\s.'$-])([a-z])/g, (m, a, b)=>a+b.toUpperCase());
const pts=P.poi.map(m=>Object.assign(pct(m.coords), {S:11, n:title(m.name)}));
P.land.forEach(m=>{ const p=pct(m.coords); if(pts.every(q=>Math.hypot(q.X-p.X, q.Y-p.Y)>=5)) pts.push(Object.assign(p, {S:7, n:title(m.name)})); });
// Сгустки: точка, у которой больше всего сундуков рядом и которая не ближе 6.5 % к уже взятым.
const WANT=40;
while(pts.length<WANT){
  let best=null, bestN=-1;
  chests.forEach(c=>{
    if(!pts.every(q=>Math.hypot(q.X-c.X, q.Y-c.Y)>=6.5)) return;
    const n=chests.filter(o=>Math.hypot(o.X-c.X, o.Y-c.Y)<3.5).length;
    if(n>bestN){ bestN=n; best=c; }
  });
  if(!best) break;
  pts.push({X:best.X, Y:best.Y, S:6.5, n:null});
}
const bx=pts.map(p=>({x0:Math.max(0, p.X-p.S/2), x1:Math.min(100, p.X+p.S/2), y0:Math.max(0, p.Y-p.S/2), y1:Math.min(100, p.Y+p.S/2), X:p.X, Y:p.Y, n:p.n}));
for(let pass=0; pass<6; pass++) for(let a=0; a<bx.length; a++) for(let b=a+1; b<bx.length; b++){
  const A=bx[a], B=bx[b];
  if(!(A.x0<B.x1 && B.x0<A.x1 && A.y0<B.y1 && B.y0<A.y1)) continue;
  if(Math.abs(A.X-B.X)>=Math.abs(A.Y-B.Y)){ const mid=(A.X+B.X)/2; if(A.X<B.X){ A.x1=Math.min(A.x1, mid); B.x0=Math.max(B.x0, mid); } else { B.x1=Math.min(B.x1, mid); A.x0=Math.max(A.x0, mid); } }
  else { const mid=(A.Y+B.Y)/2; if(A.Y<B.Y){ A.y1=Math.min(A.y1, mid); B.y0=Math.max(B.y0, mid); } else { B.y1=Math.min(B.y1, mid); A.y0=Math.max(A.y0, mid); } }
}
const rects=bx.map(b=>({x:r2(b.x0+.25), y:r2(b.y0+.25), w:r2(Math.max(3, b.x1-b.x0-.5)), h:r2(Math.max(3, b.y1-b.y0-.5)), n:b.n}));
rects.sort((a, b)=>a.y-b.y || a.x-b.x);
const inside=(p, z)=>p.X>=z.x && p.X<=z.x+z.w && p.Y>=z.y && p.Y<=z.y+z.h;
const stats=rects.map(z=>{ const c=chests.filter(p=>inside(p, z)).length, r=rare.filter(p=>inside(p, z)).length, a=ammo.filter(p=>inside(p, z)).length; return {r:c+a+r*3, loot:c+a+r*3, chests:c, rare:r, ammo:a}; });
const zLine='  s43:['+rects.map(z=>'{x:'+z.x+',y:'+z.y+',w:'+z.w+',h:'+z.h+(z.n ? ',n:'+JSON.stringify(z.n) : '')+'}').join(',')+'],/*@@S43-ZONES@@*/';
const sLine='  s43:'+JSON.stringify(stats).replace(/"/g, '')+',/*@@S43-STATS@@*/';
let t=fs.readFileSync(F, 'utf8');
const put=(mark, anchorRe, line)=>{
  const re=new RegExp('^  s43:.*/\\*@@'+mark+'@@\\*/$', 'm');
  if(re.test(t)){ t=t.replace(re, ()=>line); return; }
  const m=anchorRe.exec(t); if(!m) throw new Error('нет места для '+mark);
  t=t.slice(0, m.index)+line+'\n'+t.slice(m.index);
};
put('S43-STATS', /^  s42:\[\{r:/m, sLine);
{ const at=t.indexOf('const ZONE_SETS='); const k=t.indexOf('\n  s42:[', at); if(k<0) throw new Error('ZONE_SETS.s42');
  const re=/^  s43:.*\/\*@@S43-ZONES@@\*\/$/m;
  if(re.test(t)) t=t.replace(re, ()=>zLine); else t=t.slice(0, k+1)+zLine+'\n'+t.slice(k+1); }
fs.writeFileSync(F, t);
console.log('клеток '+rects.length+', с именем '+rects.filter(z=>z.n).length+', сундуков в клетках '+stats.reduce((a, s)=>a+s.chests, 0)+' из '+chests.length+', r макс '+Math.max(...stats.map(s=>s.r))+', пустых '+stats.filter(s=>!s.r).length);
