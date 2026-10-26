// Pro-Am — Reload, и киллы в нём как в Reload.
//
// Notion 26.10.26 (видео тестера, Pro-Am Dallas): t3eny & Ibai 14–20-е места и 9–20 киллов за игру, «очень много
// киллов, хотя умер в топ-20». У вечера proam не было своей настройки движка (ccZoneTuneSpec), и он играл движком по
// умолчанию, а не по реплеям Reload: 84–102 элима на лобби за игру при 51–68 в финалах Reload Elite Series.
//
// Настоящий вечер (runCareerProAm, 20 дуо, 7 игр), через ту же настройку, что ставит careerPlayRun:
//   * элимов на лобби за игру — не больше 70 (реплеи Reload 51–68);
//   * у пяти последних команд в среднем по вечерам меньше четырёх киллов за игру (без настройки — больше пяти).
//
//   node tools/check-career-proam-elims.js [вечеров]
const fs=require('fs'),os=require('os'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname, '..');
const RUNS=+(process.argv[2]||2);
const CHROME=[process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p && fs.existsSync(p));
if(!CHROME) throw new Error('Chrome not found');
const BOOT=`<pre id="__out"></pre><script>
window.__e=[]; window.addEventListener('error',e=>window.__e.push(e.message+' @'+e.lineno));
window.addEventListener('load', async function(){ const out={runs:[]}; try{
  for(let run=0; run<${RUNS}; run++){
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-07-12', division:1, earnings:0, balance:500, reach:900000, tokens:[], log:[], news:[]}, partner:null}));
    CAREER=null; careerEntry();
    careerProAmCan=()=>true;
    careerLandingPick=async()=>{};
    ccZoneTuneFor({type:'proam', day:'2026-07-12'});   // как careerPlayRun перед вечером
    const tick=setInterval(()=>{ const sk=document.getElementById('majorSkipBtn'); if(sk && !sk.disabled) sk.click(); }, 30);
    await runCareerProAm();
    clearInterval(tick);
    out.runs.push((window.__pa||[]).slice(-1)[0]);
  }
}catch(e){ out.err=String(e && e.stack || e); }
out.errs=window.__e;
document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND'; });
<\/script>`;
// Итог вечера каждой команды — сразу после careerRankField.
let html=fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const A='  ranked=careerRankField(field);', B='  const place=ranked.indexOf(you)+1;';
const i=html.indexOf(A), j=i<0 ? -1 : html.indexOf(B, i);
if(i<0 || j<0 || j-i>40){ console.error('runCareerProAm changed: ranked/place lines not found'); process.exit(2); }
html=html.slice(0, j)+"  try{ (window.__pa=window.__pa||[]).push(ranked.map(t=>({you:!!t.isYou, log:(t.stageLog||[]).map(g=>[g.place, g.elims])}))); }catch(e){}\n"+html.slice(j);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccproam-')), tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT.split(String.fromCharCode(92)).join('/')+'/">'+html+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--user-data-dir='+path.join(dir,'p'),
  '--virtual-time-budget=3000000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],
  {maxBuffer:1<<28,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:1500000});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if(!m){ console.error('the probe produced no output'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('FAILED: '+out.err); process.exit(1); }
if((out.errs||[]).length){ console.error('page errors: '+out.errs.join(' | ')); process.exit(1); }
let fail=null, tailSum=0, tailN=0;
out.runs.forEach((r, k)=>{
  if(!r){ fail='night '+k+' left no result'; return; }
  const games=r[0].log.length;
  const lobby=r.reduce((s,t)=>s+t.log.reduce((a,g)=>a+g[1],0),0)/games;
  const tail=r.slice(-5), tailK=tail.reduce((s,t)=>s+t.log.reduce((a,g)=>a+g[1],0),0)/(tail.length*games);
  console.log('  night '+(k+1)+': '+lobby.toFixed(1)+' elims per lobby per game, last five teams '+tailK.toFixed(1)+' a game');
  if(lobby>70) fail='night '+(k+1)+': '+lobby.toFixed(1)+' elims per lobby per game (Reload replays 51–68)';
  tailSum+=tailK; tailN++;
});
// Хвост — по всем вечерам вместе: один вечер шумит (2.9–4.0 до переноса возрождения, 1.6–3.1 после; без настройки 5+).
if(!fail && tailN && tailSum/tailN>=4) fail='the last five teams average '+(tailSum/tailN).toFixed(1)+' kills a game';
if(fail){ console.error('FAILED: '+fail); process.exit(1); }
console.log('Pro-Am kills sit where Reload kills sit');
