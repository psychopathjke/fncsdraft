// Остров S43 (мини-сезон Treasure Hunters): клетки высадки по карте зон Noble Practice (его ссылка, патч 43.00,
// tools/measured/s43-noble-zones.json: рамки контуров в долях их кадра), только прямоугольниками. Зоны Noble идут
// вплотную и закрывают сушу; участки суши с лутом, которые в зоны не попали, добираются своими клетками.
// Лут клетки по точкам fortnite.gg (tools/fgg/s43-points.json): сундуки + ящики внутри рамки.
// Картинка art/map-s43.jpg: вырез lng 64..212, lat -68..-216 (см. build-s43-chests.js).
//   node tools/build-s43-island.js
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname, '..'), F=path.join(ROOT, 'index.html');
const P=JSON.parse(fs.readFileSync(path.join(__dirname, 'fgg', 's43-points.json'), 'utf8'));
const NB=JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 's43-noble-zones.json'), 'utf8'));
const pct=c=>({X:(c[1]-64)/148*100, Y:(-68-c[0])/148*100});
const chests=P.chests.map(pct), rare=P.rare.map(pct), ammo=P.ammo.map(pct), all=chests.concat(ammo);
const r2=v=>Math.round(v*100)/100;
const title=s=>String(s).toLowerCase().replace(/(^|[\s.'$-])([a-z])/g, (m, a, b)=>a+b.toUpperCase());
// Кадр Noble на экране → наш: линейно по краям острова, остаток видно на проверочной картинке.
const fx=f=>(f-NB.frame.x0)/(NB.frame.x1-NB.frame.x0)*(NB.ours.x1-NB.ours.x0)+NB.ours.x0;
const fy=f=>(f-NB.frame.y0)/(NB.frame.y1-NB.frame.y0)*(NB.ours.y1-NB.ours.y0)+NB.ours.y0;
const bx=NB.zones.map(z=>{ const x0=fx(z[0]), y0=fy(z[1]), x1=fx(z[0]+z[2]), y1=fy(z[1]+z[3]); return {x0, y0, x1, y1, X:(x0+x1)/2, Y:(y0+y1)/2}; });
// Вытянутые контуры дают рамки внахлёст: граница посередине по оси, где нахлёст меньше.
const split=()=>{ for(let pass=0; pass<10; pass++) for(let a=0; a<bx.length; a++) for(let b=a+1; b<bx.length; b++){
  const A=bx[a], B=bx[b];
  if(!(A.x0<B.x1 && B.x0<A.x1 && A.y0<B.y1 && B.y0<A.y1)) continue;
  if(Math.min(A.x1, B.x1)-Math.max(A.x0, B.x0) < Math.min(A.y1, B.y1)-Math.max(A.y0, B.y0)){
    const mid=(Math.max(A.x0, B.x0)+Math.min(A.x1, B.x1))/2;
    if(A.X<B.X){ A.x1=mid; B.x0=mid; } else { B.x1=mid; A.x0=mid; }
  } else {
    const mid=(Math.max(A.y0, B.y0)+Math.min(A.y1, B.y1))/2;
    if(A.Y<B.Y){ A.y1=mid; B.y0=mid; } else { B.y1=mid; A.y0=mid; }
  }
} };
split();
// Добор: сгусток лута вне всех рамок становится своей клеткой.
const inB=(p, b)=>p.X>=b.x0 && p.X<=b.x1 && p.Y>=b.y0 && p.Y<=b.y1;
for(let guard=0; guard<14; guard++){
  const out=all.filter(p=>!bx.some(b=>inB(p, b)));
  let best=null, n=0;
  out.forEach(c=>{ const k=out.filter(o=>Math.abs(o.X-c.X)<5 && Math.abs(o.Y-c.Y)<5).length; if(k>n){ n=k; best=c; } });
  if(!best || n<8) break;
  const g=out.filter(o=>Math.abs(o.X-best.X)<5 && Math.abs(o.Y-best.Y)<5);
  const xs=g.map(p=>p.X), ys=g.map(p=>p.Y);
  const b={x0:Math.min(...xs)-.8, x1:Math.max(...xs)+.8, y0:Math.min(...ys)-.8, y1:Math.max(...ys)+.8};
  b.X=(b.x0+b.x1)/2; b.Y=(b.y0+b.y1)/2; bx.push(b);
  split();
}
const named=P.poi.map(m=>Object.assign(pct(m.coords), {n:title(m.name)})).concat(P.land.map(m=>Object.assign(pct(m.coords), {n:title(m.name)})));
const rects=bx.map(b=>({x:r2(Math.max(0, b.x0)+.2), y:r2(Math.max(0, b.y0)+.2), w:r2(Math.min(100, b.x1)-Math.max(0, b.x0)-.4), h:r2(Math.min(100, b.y1)-Math.max(0, b.y0)-.4)})).filter(z=>z.w>=3 && z.h>=3);
rects.forEach(z=>{ const m=named.filter(p=>p.X>=z.x && p.X<=z.x+z.w && p.Y>=z.y && p.Y<=z.y+z.h)[0]; if(m) z.n=m.n; });
rects.sort((a, b)=>a.y-b.y || a.x-b.x);
const inside=(p, z)=>p.X>=z.x && p.X<=z.x+z.w && p.Y>=z.y && p.Y<=z.y+z.h;
const stats=rects.map(z=>{ const c=chests.filter(p=>inside(p, z)).length, r=rare.filter(p=>inside(p, z)).length, a=ammo.filter(p=>inside(p, z)).length; return {r:c+a+r*3, loot:c+a+r*3, chests:c, rare:r, ammo:a}; });
const zLine='  s43:['+rects.map(z=>'{x:'+z.x+',y:'+z.y+',w:'+z.w+',h:'+z.h+(z.n ? ',n:'+JSON.stringify(z.n) : '')+'}').join(',')+'],/*@@S43-ZONES@@*/';
const sLine='  s43:'+JSON.stringify(stats).replace(/"/g, '')+',/*@@S43-STATS@@*/';
let t=fs.readFileSync(F, 'utf8');
const zr=/^  s43:.*\/\*@@S43-ZONES@@\*\/$/m, sr=/^  s43:.*\/\*@@S43-STATS@@\*\/$/m;
if(!zr.test(t) || !sr.test(t)) throw new Error('нет меток S43');
t=t.replace(zr, ()=>zLine).replace(sr, ()=>sLine);
fs.writeFileSync(F, t);
console.log('клеток '+rects.length+' (Noble '+NB.zones.length+'), сундуков в клетках '+stats.reduce((a, s)=>a+s.chests, 0)+' из '+chests.length+', w '+Math.min(...rects.map(z=>z.w))+'..'+Math.max(...rects.map(z=>z.w))+', пустых '+stats.filter(s=>!s.r).length);
