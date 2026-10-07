// Стык сезона в командной карьере (с другом): живой напарник не «расходится».
// Тестер, Notion «fncsdraft» 7.10: «команды сплитятся в начале сезона в 6 главе».
//   node tools/check-mp-season-turn.js
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
    for(const yr of [2025, 2026]) for(const size of [2,3]){
    const START=yr===2025?'2025-02-18':'2026-03-15';
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'TurnP', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:size, year:yr, year0:yr, day:START, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'trn'}, partners:[]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(88,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    const cr=CAREER.career;
    cr.mp={code:'ABCDE', role:'a'};
    MP.peer={handle:'FriendNick', region:'EU', _ovr:87, rating:87, tier:'ladder', event:'ladder', nat:'de'};
    const st=careerFncsSeason(yr===2025?'2025-02-21':'2026-03-19');
    cr.day=st.from;
    const n0=(cr.news||[]).length;
    const r=careerSeasonTurn(st);
    out.rows.push({yr, size, mpOn:ccMpOn(), turn:r, news:(cr.news||[]).slice(n0).concat((cr.news||[]).slice(0,3)).map(n=>JSON.stringify(n).slice(0,160)), mates:careerMates().map(m=>m&&m.handle)});
    }
  }catch(e){ out.fail=String(e.stack||e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'trn-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:900000});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\s\S]*?)END/); if(!m){console.error('no output');process.exit(2);}
const out=JSON.parse(decodeURIComponent(m[1]));
const fails=[];
if(out.fail) fails.push(out.fail);
if(out.errs.length) fails.push('JS: '+out.errs.slice(0,3).join(' | '));
out.rows.forEach(r=>{
  const tag=r.yr+'/'+(r.size===3?'трио':'дуо');
  if(!r.mpOn) fails.push(tag+': команда не включилась');
  if(r.turn && r.turn.split) fails.push(tag+': стык сезона развёл с живым другом');
  if(r.news.some(n=>/DuoSplit/.test(n))) fails.push(tag+': в ленте «Расходимся с @друг»');
  if(!r.mates.includes('FriendNick')) fails.push(tag+': друга нет в составе');
});
if(out.rows.length!==4) fails.push('строк '+out.rows.length+' из 4');
if(fails.length){ console.log(['FAIL'].concat(fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK: стык сезона в командной карьере не разводит с другом (2025/2026, дуо/трио)');
