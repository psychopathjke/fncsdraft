// Мини-Venture (набор r6): Reload на малом Venture, мобильные капы 2026 (Mobile Series, Reload (Mini Venture) Victory Cup).
// Карта и точки fortnite.gg, карта «Blitz - Venture» (data/blitz.js, map blitz5; вики: уменьшенная копия Venture из Reload),
// tools/fgg/r6-venture-points.json, тайлы /maps/blitz5/3/x/y.webp, вырез lng 70..194, lat -68..-192.
// rare — золотые сундуки Blitz. Зон Noble у острова нет: клетки — сгустки лута (добор, как в build-reload-nitemare.js),
// имя клетке даёт локация или ориентир fortnite.gg внутри неё.
//   node tools/build-reload-venture.js        (DRY=1 — только счёт, без записи)
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname, '..'), F=path.join(ROOT, 'index.html');
const P=JSON.parse(fs.readFileSync(path.join(__dirname, 'fgg', 'r6-venture-points.json'), 'utf8'));
const LNG0=70, LAT0=-68, SIZE=124;
const pct=c=>({X:(c[1]-LNG0)/SIZE*100, Y:(LAT0-c[0])/SIZE*100});
const chests=P.chests.map(pct), rare=P.rare.map(pct), ammo=P.ammo.map(pct), all=chests.concat(rare, ammo);
const r2=v=>Math.round(v*100)/100;
const title=s=>String(s).toLowerCase().replace(/(^|[\s.'$&-])([a-z])/g, (m, a, b)=>a+b.toUpperCase());
const bx=[];
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
// Добор: самый густой сгусток лута вне клеток становится клеткой, пока сгустки не кончатся.
const R=Number(process.env.R||4.5), MIN=Number(process.env.MIN||4);
const inB=(p, b)=>p.X>=b.x0 && p.X<=b.x1 && p.Y>=b.y0 && p.Y<=b.y1;
for(let guard=0; guard<60; guard++){
  const out=all.filter(p=>!bx.some(b=>inB(p, b)));
  let best=null, n=0;
  out.forEach(c=>{ const k=out.filter(o=>Math.abs(o.X-c.X)<R && Math.abs(o.Y-c.Y)<R).length; if(k>n){ n=k; best=c; } });
  if(!best || n<MIN) break;
  const g=out.filter(o=>Math.abs(o.X-best.X)<R && Math.abs(o.Y-best.Y)<R);
  const xs=g.map(p=>p.X), ys=g.map(p=>p.Y);
  const b={x0:Math.min(...xs)-.8, x1:Math.max(...xs)+.8, y0:Math.min(...ys)-.8, y1:Math.max(...ys)+.8};
  b.X=(b.x0+b.x1)/2; b.Y=(b.y0+b.y1)/2; bx.push(b);
  split();
}
const named=P.poi.concat(P.land).map(m=>Object.assign(pct(m.coords), {n:title(m.name)}));
const rects=bx.map(b=>({x:r2(Math.max(0, b.x0)+.2), y:r2(Math.max(0, b.y0)+.2), w:r2(Math.min(100, b.x1)-Math.max(0, b.x0)-.4), h:r2(Math.min(100, b.y1)-Math.max(0, b.y0)-.4)})).filter(z=>z.w>=2.5 && z.h>=2.5);
// Имя — ближайшая к центру клетки локация внутри неё; локации важнее ориентиров.
rects.forEach(z=>{ const cx=z.x+z.w/2, cy=z.y+z.h/2;
  const m=named.map((p, i)=>({p, i, d:Math.hypot(p.X-cx, p.Y-cy)})).filter(o=>o.p.X>=z.x && o.p.X<=z.x+z.w && o.p.Y>=z.y && o.p.Y<=z.y+z.h)
    .sort((a, b)=>(a.i<P.poi.length ? 0 : 1)-(b.i<P.poi.length ? 0 : 1) || a.d-b.d)[0];
  if(m) z.n=m.p.n; });
// Одно имя на одну клетку: повтор снимается с дальней.
const seen={}; rects.forEach(z=>{ if(!z.n) return; if(seen[z.n]) delete z.n; else seen[z.n]=1; });
// Локация между клетками (метка на дороге) — ближайшей безымянной клетке не дальше 6 %.
P.poi.map(m=>Object.assign(pct(m.coords), {n:title(m.name)})).filter(p=>!seen[p.n]).forEach(p=>{
  const dz=z=>Math.hypot(Math.max(z.x-p.X, 0, p.X-z.x-z.w), Math.max(z.y-p.Y, 0, p.Y-z.y-z.h));
  const z=rects.filter(z=>!z.n && dz(z)<6).sort((a, b)=>dz(a)-dz(b))[0];
  if(z){ z.n=p.n; seen[p.n]=1; }
});
rects.sort((a, b)=>a.y-b.y || a.x-b.x);
const inside=(p, z)=>p.X>=z.x && p.X<=z.x+z.w && p.Y>=z.y && p.Y<=z.y+z.h;
const stats=rects.map(z=>{ const c=chests.filter(p=>inside(p, z)).length, r=rare.filter(p=>inside(p, z)).length, a=ammo.filter(p=>inside(p, z)).length; return {r:c+a+r*3, loot:c+a+r*3, chests:c, rare:r, ammo:a}; });
const zLine='  r6:['+rects.map(z=>'{x:'+z.x+',y:'+z.y+',w:'+z.w+',h:'+z.h+(z.n ? ',n:'+JSON.stringify(z.n) : '')+'}').join(',')+'],/*@@R6-ZONES@@*/';
const sLine='  r6:'+JSON.stringify(stats).replace(/"/g, '')+',/*@@R6-STATS@@*/';
const msg='клеток '+rects.length+', с именем '+rects.filter(z=>z.n).length+' ('+rects.filter(z=>z.n).map(z=>z.n).join(', ')+'), сундуков '+stats.reduce((a, s)=>a+s.chests, 0)+' из '+chests.length+', золотых '+stats.reduce((a, s)=>a+s.rare, 0)+' из '+rare.length+', ящиков '+stats.reduce((a, s)=>a+s.ammo, 0)+' из '+ammo.length+', w '+Math.min(...rects.map(z=>z.w))+'..'+Math.max(...rects.map(z=>z.w))+', пустых '+stats.filter(s=>!s.r).length;
if(process.env.DRY){ console.log(msg); if(process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify({rects, named})); process.exit(0); }
let t=fs.readFileSync(F, 'utf8');
const zr=/^  r6:.*\/\*@@R6-ZONES@@\*\/$/m, sr=/^  r6:.*\/\*@@R6-STATS@@\*\/$/m;
const ins=(re, line, anchor)=>{
  if(re.test(t)){ t=t.replace(re, ()=>line); return; }
  const all=t.match(new RegExp(anchor.source, 'gm')); if(!all || all.length!==1) throw new Error('метка '+anchor);
  const m=new RegExp(anchor.source, 'm').exec(t); t=t.slice(0, m.index)+line+'\n'+t.slice(m.index);
};
ins(sr, sLine, /^  r5:.*\/\*@@R5-STATS@@\*\/$/);
ins(zr, zLine, /^  r5:.*\/\*@@R5-ZONES@@\*\/$/);
fs.writeFileSync(F, t);
console.log(msg);
