// Сундуки на приближенной точке (лут руками, ccLootRoom) для островов, где у нас есть точки fortnite.gg:
//   s42 — tools/fgg/spawns.js (патч 42.03) в кадр art/map-s42.jpg подгонкой из tools/fgg/chests-by-zone.json (build-fgg-chests.js);
//   r5  — tools/fgg/r5-nitemare-points.json, вырез lng 29..233, lat -22..-226 (как build-reload-nitemare.js).
// S43 пишет build-s43-chests.js (CC_S43_CHESTS). Здесь — CC_LR_CHESTS между метками @@LR-CHESTS в index.html.
//   node tools/build-loot-chests.js
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname, '..'), F=path.join(ROOT, 'index.html'), G=path.join(__dirname, 'fgg');
const flat=list=>{ const out=[]; list.forEach(p=>{ if(p.X>=0 && p.X<=100 && p.Y>=0 && p.Y<=100) out.push(+p.X.toFixed(1), +p.Y.toFixed(1)); }); return out; };

const w={L10N:new Proxy({}, {get:(_, k)=>String(k)})};
vm.runInContext(fs.readFileSync(path.join(G, 'spawns.js'), 'utf8'), vm.createContext({window:w, L10N:w.L10N}));
const pts=g=>(g||[]).reduce((a, m)=>a.concat(m.coords||[]), []);
const fit=JSON.parse(fs.readFileSync(path.join(G, 'chests-by-zone.json'), 'utf8')).fit;
const s42=c=>({X:fit.fx.a*c[1]+fit.fx.b, Y:fit.fy.a*(-c[0])+fit.fy.b});

const R=JSON.parse(fs.readFileSync(path.join(G, 'r5-nitemare-points.json'), 'utf8'));
const r5=c=>({X:(c[1]-29)/204*100, Y:(-22-c[0])/204*100});

const data={
  s42:{n:flat(pts(w.Spawns.chests).map(s42)), r:flat(pts(w.Spawns.rare_chests).map(s42))},
  r5:{n:flat((R.chests||[]).map(r5)), r:flat((R.rare||[]).map(r5))}
};
const line='/*@@LR-CHESTS-FROM@@*/const CC_LR_CHESTS='+JSON.stringify(data)+';/*@@LR-CHESTS-TILL@@*/';
let t=fs.readFileSync(F, 'utf8');
const m=/\/\*@@LR-CHESTS-FROM@@\*\/[^\n]*\/\*@@LR-CHESTS-TILL@@\*\//;
if(!m.test(t)) throw new Error('нет меток @@LR-CHESTS в index.html');
t=t.replace(m, ()=>line);
fs.writeFileSync(F, t);
Object.keys(data).forEach(k=>console.log(k+': сундуков '+data[k].n.length/2+', редких '+data[k].r.length/2));
