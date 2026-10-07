// Ники всех игроков данных (уникально по hKey) с регионом, страной и лучшим рейтингом — для сбора дат рождения.
//   node tools/dump-player-handles.js  → tools/measured/player-handles.json
const fs=require('fs'), os=require('os'), path=require('path'); const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CH=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
const BOOT=`<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const by=new Map();
PLAYERS.forEach(p=>{ if(!p||!p.handle) return; const k=hKey(p); const r=Math.round(ccCardOvr(p)||p.rating||0); const cur=by.get(k);
  if(!cur) by.set(k,{h:String(p.handle).trim(), k, reg:p.region||null, nat:p.nat||null, liq:p.liquiName||null, ovr:r, n:1}); else { cur.n++; if(r>cur.ovr){ cur.ovr=r; cur.reg=p.region||cur.reg; } if(!cur.nat && p.nat) cur.nat=p.nat; if(!cur.liq && p.liquiName) cur.liq=p.liquiName; } });
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify([...by.values()]))+'@@E@@'; }, 500));<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dh-')), tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CH,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const list=JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@]*)@@E@@/)[1])).sort((a,b)=>b.ovr-a.ovr);
fs.writeFileSync(path.join(__dirname,'measured','player-handles.json'), JSON.stringify(list));
console.log('players', list.length, 'with liquiName', list.filter(x=>x.liq).length, 'ovr>=80', list.filter(x=>x.ovr>=80).length);
