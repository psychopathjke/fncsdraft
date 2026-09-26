// Матчевая статистика держится настоящих чисел.
//
// Опора — пост Kinch Analytics за день 1 Глобалов 2026 (26 сентября): лидеры дня
// НА ИГРОКА за шесть игр — урон 4128, урон в минуту 41.28, чистый урон 2063,
// соотношение урона 2.67, ассисты 26, нафармлено 20327, пройдено 34.02 км,
// время в шторме 47:03. Проба гоняет тот же день — пятьдесят дуо, шесть игр,
// места по силе — и сверяет лидера с каждым из этих чисел.
//
// Допуск ±35 %: это модель, а не запись матча, и разброс внутри лобби у нас свой.
// Он нужен именно как сторож: до калибровки урон был ×2.2, метсы ×0.19, шторм
// ×0.33, и ничто об этом не говорило.
//
//   node tools/check-matchstats-real.js
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

const BOOT = '<pre id="__m" style="display:none"></pre>' + OPEN +
  '(function(){var o={};try{' +
  'var N=50, GAMES=6, SIZE=2;' +
  'var teams=[];' +
  'for(var i=0;i<N;i++){ var r=96-Math.floor(i*22/N);' +
  '  teams.push({name:"T"+i, squad:[{handle:"a"+i, rating:r},{handle:"b"+i, rating:r-2}], _rate:r}); }' +
  'for(var g=0; g<GAMES; g++){' +
  '  var order=teams.slice().sort(function(a,b){ return (b._rate+Math.random()*26)-(a._rate+Math.random()*26); });' +
  '  order.forEach(function(t,idx){ var place=idx+1;' +
  '    t._elims=Math.max(0, Math.round((N-place)/N*4 + (Math.random()*2-0.6)));' +
  '    accumulateMatchStats(t, place, N, Math.max(0, 60-place), t._elims*2); });' +
  '}' +
  'var per=teams.map(function(t){ var s=t.mstats; var min=s.timeAlive/60;' +
  '  return {dmg:s.dmgTo/SIZE, dpm:(min>0? s.dmgTo/min : 0)/SIZE, net:(s.dmgTo-s.dmgFrom)/SIZE,' +
  '          ratio:(s.dmgFrom>0? s.dmgTo/s.dmgFrom : 0), ass:s.assists/SIZE,' +
  '          farm:(s.wood+s.stone+s.metal)/SIZE, dist:s.dist/1000, storm:s.inStorm, alive:min}; });' +
  // Дроби — только среди проживших не меньше среднего, тем же отбором, каким их
  // считает сама доска (ccStatLeaders): максимум дроби по лобби иначе вытягивает
  // не сильнейший, а рано умерший с удачной перестрелкой.
  'var aliveMid=per.map(function(p){return p.alive;}).sort(function(a,b){return a-b;})[Math.floor(per.length/2)];' +
  'var deep=per.filter(function(p){ return p.alive>=aliveMid; });' +
  'var top=function(k, pool){ var a=(pool||per); return Math.max.apply(null, a.map(function(p){ return p[k]; })); };' +
  'o={dmg:top("dmg"), dpm:top("dpm"), net:top("net"), ratio:top("ratio", deep), ass:top("ass"),' +
  '   farm:top("farm"), dist:top("dist"), storm:top("storm"), alive:top("alive")};' +
  '}catch(e){o={err:String(e && e.message || e)};}' +
  'document.getElementById("__m").textContent="MSB"+JSON.stringify(o)+"MSE";})();' + CLOSE;

const file = path.join(ROOT, '__matchstats.html');
fs.writeFileSync(file, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + file.split(path.sep).join('/')],
  {maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
fs.unlinkSync(file);
const m = /MSB(\{[^]*?\})MSE/.exec(dom);
if (!m) { console.error('проба не отчиталась'); process.exit(2); }
const o = JSON.parse(m[1]);
if (o.err) { console.error('ошибка: ' + o.err); process.exit(2); }

const REAL = {dmg: [4128, 'урон'], dpm: [41.28, 'урон в минуту'], net: [2063, 'чистый урон'],
              ratio: [2.67, 'соотношение урона'], ass: [26, 'ассисты'], farm: [20327, 'нафармлено'],
              dist: [34.02, 'пройдено, км'], storm: [2823, 'шторм, с'], alive: [100, 'минут в живых']};
const TOL = 0.35;
let bad = 0;
console.log('лидер дня на игрока: наш / настоящий');
for (const k of Object.keys(REAL)) {
  const [real, name] = REAL[k];
  const ours = o[k] || 0;
  const rel = ours / real;
  const ok = rel >= 1 - TOL && rel <= 1 + TOL;
  if (!ok) bad++;
  console.log('  ' + (ok ? 'ok  ' : 'БАГ ') + name.padEnd(20) +
              String(Math.round(ours * 100) / 100).padStart(9) + ' / ' + String(real).padStart(7) +
              '   ×' + rel.toFixed(2));
}
if (bad) { console.error('\nне сходится строк: ' + bad); process.exit(1); }
console.log('\nматчевая статистика держится чисел Кинча в пределах трети');
