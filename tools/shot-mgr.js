// Снимок экрана менеджера: node tools/shot-mgr.js <вкладка|new|own> <ширина> <высота> <out.png> [lang]
// Вкладки: centre squad transfers inbox club tables; new — выбор настоящего клуба, own — форма своего.
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
const [tab='centre', w='430', h='932', outPng='shot-mgr.png', lang='ru', sub='']=process.argv.slice(2);
const BOOT=`<script>
window.addEventListener('load', ()=>setTimeout(()=>{ try{
  LANG=${JSON.stringify(lang)}; try{ applyLang && applyLang(); }catch(e){}
  localStorage.removeItem('fncsdraft_manager'); MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU';
  const tab=${JSON.stringify(tab)}, sub=${JSON.stringify(sub)};
  if(tab==='new'){ MGR_NEW_SIDE='real'; mgrOpenNew(2024); }
  else if(tab==='own'){ MGR_NEW_SIDE='own'; mgrOpenNew(2024); }
  else { MGR_NEW_SIDE='real'; mgrOpenNew(2024); mgrTake(0);
    if(sub){ const g={transfers:'transfers', club:'club', tables:'tables'}[tab]; if(g) MGR_SUB[g]=sub; }
    if(sub==='scout'){ mgrScoutHire(2); mgrScoutSet(MGR.scouts[0].id,'region','NAC'); let d=CAREER.career.day; for(let i=0;i<3;i++){ d=ccAddDays(d,7); mgrScoutWeek(d); } }
    if(sub==='staff'){ MGR_SUB.club='train'; mgrHirePerson('coach','flaire'); }
    if(sub==='youth'){ mgrYScoutHire('fr'); mgrYouthMonth('2024-01'); mgrYouthMonth('2024-02'); }
    mgrRenderHub(tab);
    if(sub==='sheet'){ const c=document.querySelector('#mgBody .mgs-card'); if(c) c.click(); } }
  window.scrollTo(0,0);
}catch(e){ document.body.insertAdjacentHTML('afterbegin','<pre style="color:red;font-size:20px">'+e.stack+'</pre>'); } }, 300));
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mgrshot-')), tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--hide-scrollbars',
  '--virtual-time-budget=60000','--window-size='+w+','+h,'--screenshot='+path.resolve(outPng),'file:///'+tmp.split(String.fromCharCode(92)).join('/')],
  {stdio:'ignore', timeout:300000});
fs.rmSync(dir,{recursive:true, force:true});
console.log('saved', path.resolve(outPng));
