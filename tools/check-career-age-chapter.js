// Возраст и глава на стыке сезонов в карьере с ранних лет.
// 1) Карьера с 2019, созданный игрок с датой рождения и Sky: ровно +1 год за сезон, и до 2026, и после.
// 2) Вдвоём напарник уже начал сезон, а у второго открыта церемония: её кнопка не начинает ещё один (C4 не пропускается).
//   node tools/check-career-age-chapter.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const body = `
const out={};
const pl={nick:'Age', age:16, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null, born:'2003-06-01'};
const seed=(y0)=>{
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
    career:{season:1, size:2, year:y0, year0:y0, day:null, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'fx'+y0},
    partners:[], dev:{}, devV:2}));
  careerLoad(); CAREER.career.day=careerStartDay();
};
const chap=()=>{ const c=ccChapterOf(ccSeasonNumOn(careerToday())); return c ? c.c : 0; };
seed(2022); CAREER.career.day='2022-12-11'; CAREER.career.seasonOver=true;
ccGalaOpen(); CC_GALA_STEP=CC_GALA_SLIDES-1; ccGalaDraw();
careerNewSeason();
ccGalaFinish();
out.gala={season:CAREER.career.season, year:CAREER.career.year, chapter:chap()};
seed(2019); out.ages=[]; out.sky=[];
for(let i=0;i<10;i++){ out.ages.push(ccPlayerAge()); out.sky.push(ccAgeNow('sky')); CAREER.career.seasonOver=true; careerNewSeason(); }
return out;`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agech-'));
const probe = path.join(dir, 'probe.js');
fs.writeFileSync(probe, body);
let txt = '';
try { txt = execFileSync('node', [path.join(__dirname, 'probe-run.js'), probe, '600000'], { encoding: 'utf8', maxBuffer: 1 << 28 }); }
finally { fs.rmSync(dir, { recursive: true, force: true }); }
const j = txt.slice(txt.indexOf('{'));
let r; try { r = JSON.parse(j); } catch (e) { console.log('FAIL проба не вернула JSON: ' + txt.slice(0, 300)); process.exit(2); }
const fails = [];
if (!r.gala || r.gala.season !== 2 || r.gala.year !== 2023) fails.push('кнопка церемонии после начатого напарником сезона перевернула ещё один: ' + JSON.stringify(r.gala));
const steps = (a, name) => { for (let i = 1; i < a.length; i++) if (a[i] - a[i - 1] !== 1) { fails.push(name + ': за сезон ' + i + ' возраст ' + a[i - 1] + ' → ' + a[i]); return; } };
steps(r.ages || [], 'созданный игрок');
steps(r.sky || [], 'Sky');
if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK возраст +1 за сезон с 2019 (' + r.ages.join(',') + '), кнопка церемонии не перескакивает главу');
