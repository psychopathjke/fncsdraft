// Остров FNCS Solo Reload, ноябрь 2026: Nitemare Island (набор r5). Карта и точки fortnite.gg (патч nitemare2,
// tools/fgg/r5-nitemare-points.json, тайлы /maps/nitemare2/3/x/y.webp), вырез lng 29..233, lat -22..-226.
// Клетки: зоны сессии Noble Solos Reload (tools/measured/r5-noble-zones.json, доли их экранного кадра) прямоугольниками,
// как на S43 (build-s43-island.js), плюс добор сгустков лута вне зон. Экран Noble (картинка 794x815 от 475,129) в единицы
// карты: линейно по берегам острова на его скрине и на тайлах.
//   node tools/build-reload-nitemare.js
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname, '..'), F=path.join(ROOT, 'index.html');
const P=JSON.parse(fs.readFileSync(path.join(__dirname, 'fgg', 'r5-nitemare-points.json'), 'utf8'));
const NB=JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'r5-noble-zones.json'), 'utf8'));
const LNG0=29, LAT0=-22, SIZE=204;
const pct=c=>({X:(c[1]-LNG0)/SIZE*100, Y:(LAT0-c[0])/SIZE*100});
const chests=P.chests.map(pct), rare=P.rare.map(pct), ammo=P.ammo.map(pct), all=chests.concat(ammo);
const r2=v=>Math.round(v*100)/100;
const title=s=>String(s).toLowerCase().replace(/(^|[\s.'$-])([a-z])/g, (m, a, b)=>a+b.toUpperCase());
const tx=f=>(55.6+(475+f*794-660)*.3326-LNG0)/SIZE*100, ty=f=>(29+(129+f*815-230)*.3137+LAT0)/SIZE*100;
const bx=NB.zones.filter(z=>z[0]>=0 && z[1]>=0 && z[2]<.3 && z[3]<.3).map(z=>{ const x0=tx(z[0]), y0=ty(z[1]), x1=tx(z[0]+z[2]), y1=ty(z[1]+z[3]); return {x0, y0, x1, y1, X:(x0+x1)/2, Y:(y0+y1)/2}; });
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
const inB=(p, b)=>p.X>=b.x0 && p.X<=b.x1 && p.Y>=b.y0 && p.Y<=b.y1;
for(let guard=0; guard<14; guard++){
  const out=all.filter(p=>!bx.some(b=>inB(p, b)));
  let best=null, n=0;
  out.forEach(c=>{ const k=out.filter(o=>Math.abs(o.X-c.X)<4 && Math.abs(o.Y-c.Y)<4).length; if(k>n){ n=k; best=c; } });
  if(!best || n<8) break;
  const g=out.filter(o=>Math.abs(o.X-best.X)<4 && Math.abs(o.Y-best.Y)<4);
  const xs=g.map(p=>p.X), ys=g.map(p=>p.Y);
  const b={x0:Math.min(...xs)-.7, x1:Math.max(...xs)+.7, y0:Math.min(...ys)-.7, y1:Math.max(...ys)+.7};
  b.X=(b.x0+b.x1)/2; b.Y=(b.y0+b.y1)/2; bx.push(b);
  split();
}
const named=P.poi.concat(P.land).map(m=>Object.assign(pct(m.coords), {n:title(m.name)}));
const rects=bx.map(b=>({x:r2(Math.max(0, b.x0)+.2), y:r2(Math.max(0, b.y0)+.2), w:r2(Math.min(100, b.x1)-Math.max(0, b.x0)-.4), h:r2(Math.min(100, b.y1)-Math.max(0, b.y0)-.4)})).filter(z=>z.w>=2.5 && z.h>=2.5);
rects.forEach(z=>{ const m=named.filter(p=>p.X>=z.x && p.X<=z.x+z.w && p.Y>=z.y && p.Y<=z.y+z.h)[0]; if(m) z.n=m.n; });
rects.sort((a, b)=>a.y-b.y || a.x-b.x);
const inside=(p, z)=>p.X>=z.x && p.X<=z.x+z.w && p.Y>=z.y && p.Y<=z.y+z.h;
const stats=rects.map(z=>{ const c=chests.filter(p=>inside(p, z)).length, r=rare.filter(p=>inside(p, z)).length, a=ammo.filter(p=>inside(p, z)).length; return {r:c+a+r*3, loot:c+a+r*3, chests:c, rare:r, ammo:a}; });
const zLine='  r5:['+rects.map(z=>'{x:'+z.x+',y:'+z.y+',w:'+z.w+',h:'+z.h+(z.n ? ',n:'+JSON.stringify(z.n) : '')+'}').join(',')+'],/*@@R5-ZONES@@*/';
const sLine='  r5:'+JSON.stringify(stats).replace(/"/g, '')+',/*@@R5-STATS@@*/';
let t=fs.readFileSync(F, 'utf8');
const zr=/^  r5:.*\/\*@@R5-ZONES@@\*\/$/m, sr=/^  r5:.*\/\*@@R5-STATS@@\*\/$/m;
if(sr.test(t)) t=t.replace(sr, ()=>sLine); else { const m=/^  s43:.*\/\*@@S43-STATS@@\*\/$/m.exec(t); if(!m) throw new Error('stats'); t=t.slice(0, m.index)+sLine+'\n'+t.slice(m.index); }
if(zr.test(t)) t=t.replace(zr, ()=>zLine); else { const m=/^  s43:.*\/\*@@S43-ZONES@@\*\/$/m.exec(t); if(!m) throw new Error('zones'); t=t.slice(0, m.index)+zLine+'\n'+t.slice(m.index); }
fs.writeFileSync(F, t);
console.log('клеток '+rects.length+', с именем '+rects.filter(z=>z.n).length+', сундуков '+stats.reduce((a, s)=>a+s.chests, 0)+' из '+chests.length+', w '+Math.min(...rects.map(z=>z.w))+'..'+Math.max(...rects.map(z=>z.w))+', пустых '+stats.filter(s=>!s.r).length);
