// Стык сезона в команде: формат года (дуо/трио) у того, кто стык НЕ нажимал, тот же, что у нажавшего.
// errlog 26.10 (пара с карьерой 2021-го): в 2026-м у одного «ник+ник» в дуо, у другого «ник+ник+zandy» —
// новый сезон запускает кнопкой один, второй берёт его состояние (ccApplyTeamState), а cr.size в нём не ехал.
//   node tools/check-mp-size-turn.js
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
    // [год начала, сезон до стыка, формат до стыка]: 2021 s4 дуо -> s5 трио, s5 трио -> s6 дуо
    for(const [y0, sn, size] of [[2021, 4, 2], [2021, 5, 3]]){
      const yr=y0+sn-1;
      const save={v:1, player:{nick:'TurnP', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
          region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
        career:{season:sn, size:size, sizes:{}, year:yr, year0:y0, day:yr+'-11-29', seasonOver:true, division:1, earnings:0, balance:0, reach:0,
          tokens:[], log:[], news:[], seed:'trn', mp:{code:'ABCDE', role:'a'}}, partners:[]};
      localStorage.setItem('fncsdraft_career', JSON.stringify(save));
      careerEntry();
      MP.peer={handle:'FriendNick', region:'EU', _ovr:87, rating:87, tier:'ladder', event:'ladder', nat:'de'};
      careerNewSeason();
      const a={season:CAREER.career.season, size:careerSquadSize(), age:CAREER.player.age, pr:JSON.stringify(CAREER.career.pr||{})}, t=ccTeamState();
      // второй: тот же сейв до стыка, кнопку не жал, получил состояние нажавшего
      save.career.mp.role='b';
      localStorage.setItem('fncsdraft_career', JSON.stringify(save));
      careerEntry();
      ccApplyTeamState(t);
      out.rows.push({y0, sn, a, b:{season:CAREER.career.season, size:careerSquadSize(), age:CAREER.player.age, pr:JSON.stringify(CAREER.career.pr||{})}});
    }
  }catch(e){ out.fail=String(e.stack||e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'szt-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:900000});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\w%\-.!~*'()]*)END/); if(!m){console.error('no output');process.exit(2);}
const out=JSON.parse(decodeURIComponent(m[1]));
const fails=[];
if(out.fail) fails.push(out.fail);
if(out.errs.length) fails.push('JS: '+out.errs.slice(0,3).join(' | '));
out.rows.forEach(r=>{
  const tag=r.y0+' s'+r.sn+'→';
  if(r.a.season!==r.sn+1) fails.push(tag+': стык не прошёл (сезон '+r.a.season+')');
  if(r.b.season!==r.a.season) fails.push(tag+': второй не перешёл в сезон '+r.a.season);
  if(r.b.age!==r.a.age) fails.push(tag+': возраст у нажавшего '+r.a.age+', у второго '+r.b.age+' (личная часть стыка не прошла)');
  if(r.b.pr!==r.a.pr) fails.push(tag+': PR после стыка разный');
  if(r.b.size!==r.a.size) fails.push(tag+': формат у нажавшего '+r.a.size+', у второго '+r.b.size);
});
if(out.rows.length!==2) fails.push('строк '+out.rows.length+' из 2');
console.log(JSON.stringify(out.rows.map(r=>({y0:r.y0, sn:r.sn, a:[r.a.season, r.a.size, r.a.age], b:[r.b.season, r.b.size, r.b.age]}))));
if(fails.length){ console.log(['FAIL'].concat(fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK: формат нового сезона у обоих в команде один');
