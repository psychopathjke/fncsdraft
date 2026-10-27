// Призовые, ждущие выплаты (cr.payQ), доходят и через стык сезона.
// Notion 27.10, игрок: «деньги за Кубок наций иногда не приходят — выплата через месяц, а новый год начинается раньше».
// Финал 28.11.2026, срок 28.12; со стыка часы откатываются на 2025-12-15 (календарь 2027+ по кругу), и выплата
// висела почти год. Здесь: приз в день финала, стык, сорок дней — деньги на балансе, очередь пуста.
//   node tools/check-pay-season-turn.js
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={rows:[], errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  try{
    const save={v:1, player:{nick:'PayP', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, sizes:{}, year:2026, year0:2026, day:'2025-12-15', seasonOver:false, division:1, earnings:0, balance:0, reach:0,
        tokens:[], log:[], news:[], seed:'pay'}, partners:[]};
    localStorage.setItem('fncsdraft_career', JSON.stringify(save));
    careerEntry();
    CAREER.career.day='2026-11-28'; ccPayIn(100000);
    CAREER.career.seasonOver=true; careerNewSeason();
    const d1=careerToday(), due=((CAREER.career.payQ||[])[0]||{}).due;
    for(let i=0;i<40;i++){ try{ careerAdvanceTo(ccAddDays(careerToday(),1)); }catch(e){ out.errs.push(String(e)); break; } }
    out.rows.push({d1, due, bal:CAREER.career.balance, q:(CAREER.career.payQ||[]).length, d2:careerToday()});
  }catch(e){ out.fail=String(e.stack||e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pst-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:900000});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\w%\-.!~*'()]*)END/); if(!m){console.error('no output');process.exit(2);}
const out=JSON.parse(decodeURIComponent(m[1]));
const fails=[], r=out.rows[0];
if(out.fail) fails.push(out.fail);
if(out.errs.length) fails.push('JS: '+out.errs.slice(0,3).join(' | '));
if(!r) fails.push('нет строки');
else {
  if(r.q) fails.push('выплата всё ещё ждёт (срок '+r.due+', сегодня '+r.d2+')');
  if(r.bal<100000) fails.push('баланс '+r.bal+' из 100000');
}
console.log(JSON.stringify(r));
if(fails.length){ console.log(['FAIL'].concat(fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK: призовые, ждавшие выплаты, пришли и через стык сезона');
