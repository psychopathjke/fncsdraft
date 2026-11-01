// 2026 по сезонам: Major 1 = S40, Major 2 = S41, FNCS Solos = S42 (набор 's42').
// У каждого финалиста Solos своя карточка S42; финал Solos не входит в рейтинг Major 2; рейтинг года
// у 2026-го считается по своему сезону (карточки m1 и m2 одного человека не обязаны совпадать).
//   node tools/check-s42-cards.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const HEAD = '<script>window.__errs=[];addEventListener("error",function(e){__errs.push(String(e.message)+" @"+e.lineno);});</' + 'script>';
const BOOT = `<pre id="__out"></pre><script>(function(){
var out={fail:null, steps:[]};
function fail(m){ out.fail=m; throw new Error(m); }
try{
  var s42=PLAYERS_BASE.filter(function(q){ return q.cardSet==='s42'; });
  if(s42.length<600) fail('карточек S42 '+s42.length+', ждали ~695');
  var regs={}; s42.forEach(function(q){ regs[q.region]=(regs[q.region]||0)+1; });
  if(Object.keys(regs).length!==7) fail('S42 не во всех семи регионах: '+JSON.stringify(regs));
  out.steps.push('S42: '+s42.length+' карточек '+JSON.stringify(regs));
  if(cardSetName('s42')!=='FNCS Solos · S42' || cardSetName('m1')!=='FNCS Major 1 · S40' || cardSetName('m2')!=='FNCS Major 2 · S41')
    fail('подписи наборов: '+[cardSetName('m1'),cardSetName('m2'),cardSetName('s42')].join(' / '));
  var solosInM2=PLAYERS_BASE.filter(function(q){ return q.cardSet==='m2' && q._ratingParts && q._ratingParts.parts.some(function(x){ return x.label==='solos'; }); });
  if(solosInM2.length) fail('финал Solos всё ещё в рейтинге Major 2 у '+solosInM2.length+' карточек');
  out.steps.push('в Major 2 финала Solos нет');
  var noRate=s42.filter(function(q){ return !(q.rating>=30) || !q._ratingParts; });
  if(noRate.length) fail(noRate.length+' карточек S42 без рейтинга сезона, напр. '+noRate[0].handle);
  ['EU','NAC'].forEach(function(reg){
    var top=s42.filter(function(q){ return q.region===reg; }).sort(function(a,b){ return b.rating-a.rating; })[0];
    if(!(top.rating>=REGION_TOP[reg]-1)) fail(reg+': верх S42 '+top.rating+' ниже потолка региона '+REGION_TOP[reg]);
  });
  var win=s42.filter(function(q){ return q.placement===1; });
  if(win.length<7) fail('победителей финала Solos '+win.length+' из 7');
  var lowWin=win.filter(function(q){ return q.rating<REGION_TOP[q.region]-6; });
  if(lowWin.length) fail('победитель финала ниже потолка региона минус 6: '+lowWin.map(function(q){ return q.region+' '+q.handle+' '+q.rating; }).join(', '));
  out.steps.push('победители: '+win.map(function(q){ return q.region+' '+q.handle+' '+q.rating; }).join(', '));
  var byK={}; PLAYERS_BASE.forEach(function(q){ if(q.cardSet!=='m1' && q.cardSet!=='m2') return; var k=q.region+'|'+hKey(q); (byK[k]=byK[k]||{})[q.cardSet]=q.rating; });
  var both=Object.values(byK).filter(function(x){ return x.m1!=null && x.m2!=null; });
  var differ=both.filter(function(x){ return x.m1!==x.m2; }).length;
  if(differ<both.length*0.3) fail('m1 и m2 совпадают у '+(both.length-differ)+' из '+both.length+': рейтинг 2026-го не по сезонам');
  out.steps.push('m1 и m2 различаются у '+differ+' из '+both.length);
  var ex=s42[0]; var a=attrsFor(ex); if(!a || !(a.ovr>0)) fail('атрибуты карточки S42 не считаются');
}catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
out.errs=window.__errs;
document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();</` + `script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 's42-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs || []).length) console.error('ошибки страницы: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) process.exit(1);
console.log('OK check-s42-cards');
