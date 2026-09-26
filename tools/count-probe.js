// Сколько в файле карточек, людей и турниров — по факту, а не по README.
const fs=require('fs'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
 (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
const OPEN='<'+'script>', CLOSE='<'+'/'+'script>';
const BOOT='<pre id="__c" style="display:none"></pre>'+OPEN+
 '(function(){var o={};try{'+
 'var byKey={}, byReg={}, ev={}, sets={}, yrs={};'+
 'PLAYERS.forEach(function(p){ byKey[hKey(p)]=1; byReg[hKey(p)+"|"+(p.region||"")]=1;'+
 '  if(p.event) ev[String(p.event)]=1; sets[String(p.cardSet||"")]=1;'+
 '  var y=(typeof ccCardYear==="function")?ccCardYear(p):0; yrs[y]=(yrs[y]||0)+1; });'+
 'o={cards:PLAYERS.length, people:Object.keys(byKey).length, peopleReg:Object.keys(byReg).length,'+
 '   events:Object.keys(ev).length, sets:Object.keys(sets).sort(), years:yrs};'+
 '}catch(e){o={err:String(e&&e.message||e)};}'+
 'document.getElementById("__c").textContent="CNB"+JSON.stringify(o)+"CNE";})();'+CLOSE;
const file=path.join(ROOT,'__count.html');
fs.writeFileSync(file, fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox',
 '--allow-file-access-from-files','--virtual-time-budget=40000','--dump-dom',
 'file:///'+file.split(path.sep).join('/')],
 {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.unlinkSync(file);
const m=/CNB(\{[^]*?\})CNE/.exec(dom);
if(!m){ console.error('проба не отчиталась'); process.exit(2); }
console.log(JSON.stringify(JSON.parse(m[1]), null, 1));
