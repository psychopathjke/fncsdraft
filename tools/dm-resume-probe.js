// Сверка и замер: индекс вместо перебора в ccDmResume даёт ТЕ ЖЕ карточки.
//   node tools/dm-resume-probe.js
const fs=require('fs'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
 (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
const OPEN='<'+'script>', CLOSE='<'+'/'+'script>';
const BOOT='<pre id="__d" style="display:none"></pre>'+OPEN+
 '(function(){var o={};try{'+
 'var keys=[]; for(var i=0;i<PLAYERS.length;i+=Math.max(1,Math.floor(PLAYERS.length/300))) keys.push(hKey(PLAYERS[i]));'+
 'var t0=performance.now(), a=[];'+
 'keys.forEach(function(hk){ a.push(PLAYERS.filter(function(p){return hKey(p)===hk && p.placement>0;}).length); });'+
 'var t1=performance.now(), b=[];'+
 'keys.forEach(function(hk){ b.push((ccCardsByKey().get(hk)||[]).filter(function(p){return p.placement>0;}).length); });'+
 'var t2=performance.now();'+
 'var diff=0; for(var j=0;j<a.length;j++) if(a[j]!==b[j]) diff++;'+
 'o={cards:PLAYERS.length, keys:keys.length, scanMs:Math.round(t1-t0), idxMs:Math.round(t2-t1), diff:diff};'+
 '}catch(e){o={err:String(e&&e.message||e)};}'+
 'document.getElementById("__d").textContent="DRB"+JSON.stringify(o)+"DRE";})();'+CLOSE;
const file=path.join(ROOT,'__dmresume.html');
fs.writeFileSync(file, fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox',
 '--allow-file-access-from-files','--virtual-time-budget=40000','--dump-dom',
 'file:///'+file.split(path.sep).join('/')],
 {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.unlinkSync(file);
const m=/DRB(\{[^]*?\})DRE/.exec(dom);
if(!m){ console.error('проба не отчиталась'); process.exit(2); }
const o=JSON.parse(m[1]);
if(o.err){ console.error('ошибка: '+o.err); process.exit(2); }
console.log('карточек в файле : '+o.cards);
console.log('ников в пробе    : '+o.keys);
console.log('перебором        : '+o.scanMs+' мс');
console.log('индексом         : '+o.idxMs+' мс');
console.log('расхождений      : '+o.diff);
process.exit(o.diff ? 1 : 0);
