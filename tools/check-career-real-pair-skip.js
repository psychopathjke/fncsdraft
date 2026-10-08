// Реальная пара не рвётся на стыке сезонов, пока вы не сыграли вместе (его слово 8.10: «скипаю месяц в 2019 за Монграла,
// и тиммейт сразу бросает после перемотки»).
//   node tools/check-career-real-pair-skip.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');const CH='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BOOT=`<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{const out={};
try{
  localStorage.removeItem('fncsdraft_career');
  openCareerCreate(); ccPickYear(2019); ccPickRegion('EU');
  CC.mode='card'; ccRenderList();
  const now=careerRosterNowEU(); const m=now.find(p=>p.handle==='Mongraal');
  out.found=!!m; if(m){ out.mate0=ccMateNow(m); ccPickCard(m.handle); }
  ccStart();
  const snap=(tag)=>{ const recs=(CAREER.partners||[]).filter(Boolean).map(r=>{ const c=ccMateCardOf(r); return {h:c&&c.handle, pat:r.patience, since:r.since, role:r.role}; });
    out[tag]={day:careerToday(), size:careerSquadSize(), mates:recs, partner:careerPartnerCard()&&careerPartnerCard().handle,
      news:(CAREER.career.news||[]).slice(-12).map(n=>n.k+':'+(n.a||[]).join('/')), log:(CAREER.career.log||[]).length}; };
  snap('start');
  const d0=careerToday(); careerSkipTo(ccAddDays(d0, 30)); snap('after30');
  // кто и почему: последние сообщения тиммейта в личке
  const t=(careerDms()||[]).filter(x=>x.who && (x.who.mate || (out.start.partner && hKey(x.who.handle)===hKey(out.start.partner))));
  out.dm=t.map(x=>({h:x.who.handle, state:x.state, last:x.msgs.slice(-4).map(m=>m.from+':'+m.k)}));
}catch(e){ out.err=String(e.stack); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@';},600));<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mong-')),tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(ROOT+'/index.html','utf8')+BOOT);
const dom=execFileSync(CH,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore']});
const o=JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
const fails=[]; if(o.err) fails.push(o.err); if(!o.found) fails.push('Mongraal не найден в 2019 EU');
if(o.start && o.start.partner!=='Mitr0') fails.push('старт не с Mitr0: '+(o.start&&o.start.partner));
if(o.after30 && o.after30.partner!=='Mitr0') fails.push('после перемотки на месяц Mitr0 ушёл: '+JSON.stringify(o.after30.news));
if(fails.length){ console.log(['FAIL'].concat(fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK реальная пара 2019 переживает перемотку и стык S8 без единого вечера', JSON.stringify(o.after30.news));
