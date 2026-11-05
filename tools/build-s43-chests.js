// Точки сундуков острова S43 для игры «Пиратские сундуки»: tools/fgg/s43-points.json (fortnite.gg, data/spawns.js и
// data/en.js патча 43) переводит в проценты art/map-s43.jpg и пишет в index.html между метками @@S43-CHESTS.
// Картинка острова: тайлы fortnite.gg/maps/43/3/{x}/{y}.webp, 2048 px на 256 единиц, вырез lng 64..212, lat -68..-216.
//   node tools/build-s43-chests.js
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname, '..'), F=path.join(ROOT, 'index.html');
const P=JSON.parse(fs.readFileSync(path.join(__dirname, 'fgg', 's43-points.json'), 'utf8'));
const LNG0=64, LAT0=-68, SIZE=148;
const flat=list=>{
  const out=[];
  list.forEach(([lat, lng])=>{
    const x=(lng-LNG0)/SIZE*100, y=(LAT0-lat)/SIZE*100;
    if(x>=2 && x<=98 && y>=2 && y<=98) out.push(+x.toFixed(1), +y.toFixed(1));
  });
  return out;
};
const data={n:flat(P.chests), r:flat(P.rare)};
const line='/*@@S43-CHESTS-FROM@@*/const CC_S43_CHESTS='+JSON.stringify(data)+';/*@@S43-CHESTS-TILL@@*/';
let t=fs.readFileSync(F, 'utf8');
const m=/\/\*@@S43-CHESTS-FROM@@\*\/[^\n]*\/\*@@S43-CHESTS-TILL@@\*\//;
if(!m.test(t)) throw new Error('нет меток @@S43-CHESTS в index.html');
t=t.replace(m, ()=>line);
fs.writeFileSync(F, t);
console.log('сундуков '+data.n.length/2+', редких '+data.r.length/2);
