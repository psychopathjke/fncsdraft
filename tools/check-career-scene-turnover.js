// Сцена после 2026 обновляется как в жизни (ccSceneDriftMap): из топ-20 через год остаётся 45–80%, через три года
// не больше 55% (жизнь по базе 2021–2026: 61% и 28%; до дрейфа было 88% и 88%). Уровень не уплывает: средний топ-50
// и лучший рейтинг региона в пятом сезоне в пределах ±2 от первого. Жребий повторяется при повторе.
//   node tools/check-career-scene-turnover.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const body = `
const REG=['EU','NAC'], out={keep:{}, lvl:{}};
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:7, closeRangeEdge:6, region:'EU', ovr:70, role:'roleIGL', attrs:null, ageEdge:4},
  career:{season:1, size:2, year:2026, year0:2026, day:null, division:3, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'turnover'},
  partners:[], dev:{}, devV:2}));
careerLoad(); CAREER.career.day='2026-07-01';
const sim={};
for(let s=1;s<=5;s++){
  sim[s]={};
  REG.forEach(r=>{ const l=ccSceneRoster(r); sim[s][r]={top:l.slice(0,20).map(c=>hKey(c)), t50:l.slice(0,50).reduce((q,c)=>q+c._ovr,0)/50, max:l[0]._ovr}; });
  if(s===2){ CC_DRIFT={tag:null, maps:{}}; CC_NOW_CARDS={}; out.again=REG.map(r=>ccSceneRoster(r).slice(0,20).map(c=>hKey(c)).join(',')===sim[2][r].top.join(',')).every(Boolean); }
  if(s<5){ CAREER.career.seasonOver=true; careerNewSeason(); }
}
const keep=(a,b)=>{ let t=0; REG.forEach(r=>{ const B=new Set(sim[b][r].top); t+=sim[a][r].top.filter(k=>B.has(k)).length/20; }); return Math.round(t/REG.length*100); };
out.keep={k1:keep(1,2), k3:keep(1,4)};
REG.forEach(r=>{ out.lvl[r]={t50:[Math.round(sim[1][r].t50*10)/10, Math.round(sim[5][r].t50*10)/10], max:[sim[1][r].max, sim[5][r].max]}; });
return out;`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'turn-'));
const probe = path.join(dir, 'probe.js');
fs.writeFileSync(probe, body);
let txt = '';
try { txt = execFileSync('node', [path.join(__dirname, 'probe-run.js'), probe, '900000'], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }); }
finally { fs.rmSync(dir, { recursive: true, force: true }); }
let r; try { r = JSON.parse(txt.slice(txt.indexOf('{'))); } catch (e) { console.log('FAIL проба не вернула JSON: ' + txt.slice(0, 300)); process.exit(2); }
const fails = [];
if (r.err) fails.push('ошибка: ' + r.err);
else {
  if (!(r.keep.k1 >= 45 && r.keep.k1 <= 80)) fails.push('через год в топ-20 осталось ' + r.keep.k1 + '% (жизнь 61%)');
  if (!(r.keep.k3 <= 55)) fails.push('через три года в топ-20 осталось ' + r.keep.k3 + '% (жизнь 28%)');
  Object.entries(r.lvl).forEach(([reg, v]) => {
    if (Math.abs(v.t50[1] - v.t50[0]) > 2) fails.push(reg + ': средний топ-50 уплыл ' + v.t50.join(' → '));
    if (Math.abs(v.max[1] - v.max[0]) > 2) fails.push(reg + ': лучший рейтинг уплыл ' + v.max.join(' → '));
  });
  if (!r.again) fails.push('дрейф не повторяется при пересчёте');
}
if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK топ-20 через год ' + r.keep.k1 + '%, через три ' + r.keep.k3 + '% (жизнь 61/28), уровень сцены на месте');
