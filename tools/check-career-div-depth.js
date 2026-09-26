// Лестница дивизионов у каждого региона своя: пять ступеней в Европе и NA
// Central, три во всех остальных.
//
// У Epic дивизионные капы 4 и 5 идут только в EU и NAC — проверено по id
// событий на Tracker (177 капов в архиве: D1-D3 во всех семи регионах, D4 и D5
// только в двух). Его слово 26 сентября: «в мидл ист океания азия вест их 3
// вроде, не как в еу и нак».
//
// Стережём три вещи: глубину, выбор на экране создания (там не должно быть
// ступеней, которых в регионе нет) и старый сейв, заведённый до правки.
//
//   node tools/check-career-div-depth.js
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const OPEN = '<' + 'script>', CLOSE = '<' + '/' + 'script>';

const BOOT = '<pre id="__out" style="display:none"></pre>' + OPEN +
  '(function(){var out={fails:[], notes:{}};' +
  'var check=function(n, ok, d){ if(!ok) out.fails.push(n+(d?": "+d:"")); };' +
  'try{' +
  'var deep=["EU","NAC"], small=["NAW","BR","ME","ASIA","OCE"];' +
  'deep.forEach(function(r){ check("у "+r+" пять ступеней", ccDivCount(r)===5, String(ccDivCount(r))); });' +
  'small.forEach(function(r){ check("у "+r+" три ступени", ccDivCount(r)===3, String(ccDivCount(r))); });' +
  // полоса: верх и низ совпадают у любой глубины, середина своя
  'check("верх один и тот же", ccBand(1,"EU")-ccDivShift("EU")===ccBand(1,"OCE")-ccDivShift("OCE"),' +
  '      ccBand(1,"EU")+" / "+ccBand(1,"OCE"));' +
  'check("низ один и тот же", ccBand(5,"EU")-ccDivShift("EU")===ccBand(3,"OCE")-ccDivShift("OCE"),' +
  '      ccBand(5,"EU")+" / "+ccBand(3,"OCE"));' +
  'check("средняя ступень трёхступенчатой лестницы между ними",' +
  '      ccBand(2,"OCE")<ccBand(1,"OCE") && ccBand(2,"OCE")>ccBand(3,"OCE"), String(ccBand(2,"OCE")));' +
  // экран создания
  'if(typeof careerStart==="function") careerStart();' +
  'var chips=function(r){ ccPickRegion(r); return document.querySelectorAll("#ccDivChips .cc-chip").length; };' +
  'deep.forEach(function(r){ var n=chips(r); check("на создании у "+r+" пять чипов", n===5, String(n)); });' +
  'small.forEach(function(r){ var n=chips(r); check("на создании у "+r+" три чипа", n===3, String(n)); });' +
  // выбор, оставшийся за краем
  'ccPickRegion("EU"); ccPickDiv(5); ccPickRegion("OCE");' +
  'check("выбор съезжает на нижнюю ступень региона", CC.div===3, String(CC.div));' +
  // старый сейв
  'localStorage.setItem("fncsdraft_career", JSON.stringify({v:1,' +
  ' player:{nick:"Mig", age:20, source:"rookie", country:"au", countryPing:15, closeRangeEdge:0,' +
  '  region:"OCE", homeRegion:"OCE", ovr:70, role:"roleIGL", attrs:null, ageEdge:0, photo:null},' +
  ' career:{season:1, size:2, year:2026, year0:2026, day:"2026-02-10", division:5, earnings:0,' +
  '  balance:0, reach:0, tokens:[], log:[], news:[], seed:"mig"}}));' +
  'careerLoad();' +
  'var after=CAREER && CAREER.career && CAREER.career.division;' +
  'check("сейв с пятым дивизионом в Океании встаёт на третий", after===3, String(after));' +
  'out.notes.bands={EU:[1,2,3,4,5].map(function(d){return ccBand(d,"EU");}),' +
  '                 OCE:[1,2,3].map(function(d){return ccBand(d,"OCE");})};' +
  '}catch(e){ out.fails.push("упало: "+(e && e.message || e)); }' +
  'document.getElementById("__out").textContent="DVB"+JSON.stringify(out)+"DVE";})();' + CLOSE;

const file = path.join(ROOT, '__divdepth-check.html');
fs.writeFileSync(file, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + file.split(path.sep).join('/')],
  {maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
fs.unlinkSync(file);
const m = /DVB(\{[^]*?\})DVE/.exec(dom);
if (!m) { console.error('проба не отчиталась'); process.exit(2); }
const out = JSON.parse(m[1]);
console.log('полосы EU : ' + (out.notes.bands ? out.notes.bands.EU.join(' / ') : '—'));
console.log('полосы OCE: ' + (out.notes.bands ? out.notes.bands.OCE.join(' / ') : '—'));
if (out.fails.length) { out.fails.forEach(f => console.error('  БАГ  ' + f)); process.exit(1); }
console.log('лестница у каждого региона своя: пять ступеней в EU и NAC, три в остальных');
