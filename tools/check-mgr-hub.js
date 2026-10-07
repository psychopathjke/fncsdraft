// Хаб менеджера «как в карьере» и выбор клуба (спека docs/specs/2026-10-07-fortnite-manager-fc-design.md).
//   node tools/check-mgr-hub.js            — все секции
//   node tools/check-mgr-hub.js бюджет     — только секции, в имени которых есть слово
// Каждая секция — тело async-функции внутри страницы: есть check(name, ok, detail), bad(html),
// lang ('ru'|'en'), wait(ms), out.notes. Секция с once:true идёт только на ru.
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CHROME=[process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>p && fs.existsSync(p));
if(!CHROME) throw new Error('Chrome not found');

const SECTIONS=[
];

const only=process.argv[2]||'';
const run=SECTIONS.filter(s=>!only || s.name.indexOf(only)>=0);
const body=run.map(s=>`
      if(${s.once?'lang===\'ru\'':'true'}){ try{ await (async()=>{ ${s.code} })(); }
        catch(e){ out.fails.push('${s.name} ['+lang+']: исключение '+(e && e.stack || e)); }
        try{ localStorage.removeItem('fncsdraft_manager'); MGR=null; if(typeof mgrLeave==='function') mgrLeave(); }catch(e){} }`).join('');
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null&&d!==''?': '+d:'')); };
  const bad=html=>/undefined|NaN|\\[object /.test(String(html));
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    localStorage.removeItem('fncsdraft_manager');
    for(const lang of ['ru','en']){
      LANG=lang;
      ${body}
    }
  }catch(e){ out.fails.push('исключение: '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mgrhub-')), tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
  '--virtual-time-budget=900000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],
  {maxBuffer:1<<30, encoding:'utf8', stdio:['ignore','pipe','ignore'], timeout:1500000});
fs.rmSync(dir,{recursive:true, force:true});
const m=dom.match(/BEGIN([\s\S]*?)END/);
if(!m){ console.log('FAIL нет вывода'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.errs.length) out.fails.push('JS: '+out.errs.slice(0,3).join(' | '));
if(out.fails.length){ console.log(['FAIL'].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK хаб менеджера ('+run.length+' секций)', JSON.stringify(out.notes));
