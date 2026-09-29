// Призовые недель, квалификаторов и хитов FNCS 2020 (C2S2 дуо, C2S3 соло, C2S4 трио) из
// страниц Liquipedia в tools/measured/liqui-2020 (usdprize — на команду). В таблицу — доллары
// на игрока порогами [последнее место с этой суммой, $], как CC_FNCS19_WEEK_PAY: ccMXWeekPrize
// умножает обратно на размер состава. Место, прошедшее дальше (у хитов usdprize=0), — ноль.
// Выход: tools/measured/fncs2020-week-pay.json → вставляется в index.html как CC_FNCS20_WEEK_PAY.
const fs=require('fs'), path=require('path');
const DIR=path.join(__dirname, 'measured', 'liqui-2020');
const SEASON={'Season 2':{n:1, size:2}, 'Season 3':{n:2, size:1}, 'Season 4':{n:3, size:3}};
const REG={'Europe':'EU', 'North America East':'NAE', 'North America West':'NAW', 'Brazil':'BR', 'Asia':'ASIA', 'Oceania':'OCE', 'Middle East':'ME'};
const out={week:{}, heat:{}};
for(const f of fs.readdirSync(DIR)){
  const m=/^Fortnite Champion Series__Chapter 2__(Season \d)__(Week|Qualifier|Heat) (\d)__(.+)\.txt$/.exec(f);
  if(!m || !SEASON[m[1]] || !REG[m[4]]) continue;
  const {n, size}=SEASON[m[1]], reg=REG[m[4]], kind=m[2]==='Heat' ? 'heat' : 'week', k=+m[3];
  const txt=fs.readFileSync(path.join(DIR, f), 'utf8');
  const slots=[...txt.matchAll(/place=(\d+)(?:-(\d+))?\s*\|\s*usdprize=([\d,]*)/g)]
    .map(s=>({to:+(s[2]||s[1]), usd:+(s[3]||'0').replace(/,/g,'')})).sort((a,b)=>a.to-b.to);
  if(!slots.length) continue;
  const rows=[];
  slots.forEach(s=>{ const per=Math.round(s.usd/size*100)/100;
    if(rows.length && rows[rows.length-1][1]===per) rows[rows.length-1][0]=s.to; else rows.push([s.to, per]); });
  while(rows.length && rows[rows.length-1][1]===0) rows.pop();          // хвост без денег не нужен
  if(!rows.length) continue;
  if(kind==='week'){ ((out.week[n]=out.week[n]||{})[k]=out.week[n][k]||{})[reg]=rows; }
  else { const h=(out.heat[n]=out.heat[n]||{}); (h[reg]=h[reg]||{})[k]=rows; }
}
const dst=path.join(__dirname, 'measured', 'fncs2020-week-pay.json');
fs.writeFileSync(dst, JSON.stringify(out));
console.log(dst, JSON.stringify(out).length, 'bytes');
for(const n of Object.keys(out.week)) console.log('week n'+n, Object.keys(out.week[n]).join(','), 'EU w1', JSON.stringify((out.week[n][1]||{}).EU||[]).slice(0,160));
for(const n of Object.keys(out.heat)) console.log('heat n'+n, 'EU', JSON.stringify(out.heat[n].EU||{}).slice(0,200));
