/* Общая обвязка для разовых проб: node tools/probe-run.js тело.js [бюджет мс]
   Тело — содержимое async-функции, которая возвращает объект; он печатается JSON. */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
const body=fs.readFileSync(process.argv[2],'utf8');
const BOOT=`<pre id="__out" style="display:none"></pre><script>
(function(){const fin=o=>{document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(o))+'PE'+'ND';};
const go=async()=>{try{const r=await (async()=>{${body}})();fin(r);}catch(e){fin({err:String(e&&e.stack||e)});}};
if(typeof ccMapsReady==='function') ccMapsReady(go); else go();})();<\/script>`;
const src=fs.readFileSync(ROOT+'/index.html','utf8');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pr-'));const tmp=dir+'/index.html';
const fwd=s=>s.split(String.fromCharCode(92)).join('/');
fs.writeFileSync(tmp,'<base href="file:///'+fwd(ROOT)+'/">'+src+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
  '--virtual-time-budget='+(process.argv[3]||300000),'--dump-dom','file:///'+fwd(tmp)],{maxBuffer:1<<29,encoding:'utf8'});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/);if(!m){console.error('проба не отработала: '+tmp);process.exit(2);}
console.log(JSON.stringify(JSON.parse(decodeURIComponent(m[1])),null,1));fs.rmSync(dir,{recursive:true,force:true});
