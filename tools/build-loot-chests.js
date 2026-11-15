// Сундуки на приближенной точке (лут руками, ccLootRoom) для островов, где у нас есть точки fortnite.gg:
//   s42 — tools/fgg/spawns.js (патч 42.03) в кадр art/map-s42.jpg подгонкой из tools/fgg/chests-by-zone.json (build-fgg-chests.js);
//   r5  — tools/fgg/r5-nitemare-points.json, вырез lng 29..233, lat -22..-226 (как build-reload-nitemare.js);
//   r6  — tools/fgg/r6-venture-points.json (мини-Venture, blitz5), вырез lng 70..194, lat -68..-192 (как build-reload-venture.js);
//   s43 — tools/fgg/s43-points.json, вырез lng 64..212, lat -68..-216 (как build-s43-chests.js).
// n — сундуки, r — редкие сундуки, a — ящики с патронами. CC_LR_CHESTS между метками @@LR-CHESTS в index.html.
//   node tools/build-loot-chests.js
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.resolve(__dirname, '..'), F=path.join(ROOT, 'index.html'), G=path.join(__dirname, 'fgg');
const flat=list=>{ const out=[]; list.forEach(p=>{ if(p.X>=0 && p.X<=100 && p.Y>=0 && p.Y<=100) out.push(+p.X.toFixed(1), +p.Y.toFixed(1)); }); return out; };

const w={L10N:new Proxy({}, {get:(_, k)=>String(k)})};
const ctx=vm.createContext({window:w, L10N:w.L10N});
vm.runInContext(fs.readFileSync(path.join(G, 'spawns.js'), 'utf8'), ctx); ctx.Spawns=w.Spawns;
vm.runInContext(fs.readFileSync(path.join(G, 'en.js'), 'utf8'), ctx);
// g — сундуки с золотой обводкой fortnite.gg («gold outline = 100% spawn rate», icon 1327); v — малые хранилища (1631), V — большое (1624).
const gold=w.Spawns.chests.filter(m=>m.icon===1327).reduce((a,m)=>a.concat(m.coords), []);
const vm2=((w.Data.data.spawns.sub.vaults||{}).markers)||[], vOf=ic=>vm2.filter(m=>m.icon===ic).reduce((a,m)=>a.concat(m.coords), []);
const pts=g=>(g||[]).reduce((a, m)=>a.concat(m.coords||[]), []);
const fit=JSON.parse(fs.readFileSync(path.join(G, 'chests-by-zone.json'), 'utf8')).fit;
const s42=c=>({X:fit.fx.a*c[1]+fit.fx.b, Y:fit.fy.a*(-c[0])+fit.fy.b});

const R=JSON.parse(fs.readFileSync(path.join(G, 'r5-nitemare-points.json'), 'utf8'));
const r5=c=>({X:(c[1]-29)/204*100, Y:(-22-c[0])/204*100});
const V=JSON.parse(fs.readFileSync(path.join(G, 'r6-venture-points.json'), 'utf8'));
const r6=c=>({X:(c[1]-70)/124*100, Y:(-68-c[0])/124*100});
const S=JSON.parse(fs.readFileSync(path.join(G, 's43-points.json'), 'utf8'));
const s43=c=>({X:(c[1]-64)/148*100, Y:(-68-c[0])/148*100});

const data={
  s42:{n:flat(pts(w.Spawns.chests).map(s42)), r:flat(pts(w.Spawns.rare_chests).map(s42)), a:flat(pts(w.Spawns.ammo_boxes).map(s42)),
        g:flat(gold.map(s42)), v:flat(vOf(1631).map(s42)), V:flat(vOf(1624).map(s42))},
  r5:{n:flat((R.chests||[]).map(r5)), r:flat((R.rare||[]).map(r5)), a:flat((R.ammo||[]).map(r5))},
  r6:{n:flat((V.chests||[]).map(r6)), r:flat((V.rare||[]).map(r6)), a:flat((V.ammo||[]).map(r6))},
  s43:{n:flat((S.chests||[]).map(s43)), r:flat((S.rare||[]).map(s43)), a:flat((S.ammo||[]).map(s43))}
};
const line='/*@@LR-CHESTS-FROM@@*/const CC_LR_CHESTS='+JSON.stringify(data)+';/*@@LR-CHESTS-TILL@@*/';
let t=fs.readFileSync(F, 'utf8');
const m=/\/\*@@LR-CHESTS-FROM@@\*\/[^\n]*\/\*@@LR-CHESTS-TILL@@\*\//;
if(!m.test(t)) throw new Error('нет меток @@LR-CHESTS в index.html');
t=t.replace(m, ()=>line);
fs.writeFileSync(F, t);
Object.keys(data).forEach(k=>console.log(k+': сундуков '+data[k].n.length/2+', редких '+data[k].r.length/2+', ящиков '+data[k].a.length/2+(data[k].g ? ', 100%: '+data[k].g.length/2+', хранилищ '+data[k].v.length/2+'+'+data[k].V.length/2 : '')));
