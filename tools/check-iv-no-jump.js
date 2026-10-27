// Ответ на интервью не двигает занятия дня.
// Notion 27.10, игрок: «на тренировке спрашивает, тащил ли я команду, и мышку уносит вниз, и запускаются скримы».
// Плитка интервью стояла над панелью дня: появлялась после вечера, пропадала по ответу, и кнопки занятий прыгали
// на её высоту — следующий клик садился в занятие под курсором. Здесь: свободный день после капа, интервью есть,
// меряется верх первой кнопки занятия, ответ, мера снова — должна совпасть.
//   node tools/check-iv-no-jump.js
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  try{
    const save={v:1, player:{nick:'IvP', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, sizes:{}, year:2026, year0:2026, day:'2026-01-07', seasonOver:false, division:5, earnings:0, balance:0, reach:0,
        tokens:[], news:[], seed:'iv', log:[{season:1, day:'2026-01-05', div:5, place:2, of:100, pts:50, kind:'cup', passed:true}]}, partners:[]};
    localStorage.setItem('fncsdraft_career', JSON.stringify(save));
    careerEntry();
    careerRenderHub('centre');
    const top=()=>{ const b=[...document.querySelectorAll('#screen-career-hub [onclick^="careerPickDay("]')].find(x=>x.offsetParent);
      return b ? Math.round(b.getBoundingClientRect().top+window.scrollY) : null; };
    out.iv=!!document.querySelector('#screen-career-hub .cc-iv');
    out.before=top();
    careerInterviewPass();
    out.ivAfter=!!document.querySelector('#screen-career-hub .cc-iv');
    out.after=top();
  }catch(e){ out.fail=String(e.stack||e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ivj-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--window-size=1280,1400','--virtual-time-budget=60000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:900000});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/BEGIN([\w%\-.!~*'()]*)END/); if(!m){console.error('no output');process.exit(2);}
const out=JSON.parse(decodeURIComponent(m[1]));
const fails=[];
if(out.fail) fails.push(out.fail);
if(out.errs.length) fails.push('JS: '+out.errs.slice(0,3).join(' | '));
if(!out.iv) fails.push('интервью не показалось — проба ничего не проверила');
if(out.ivAfter) fails.push('интервью не закрылось');
if(out.before==null || out.after==null) fails.push('кнопок занятий нет');
else if(out.before!==out.after) fails.push('занятия прыгнули на '+(out.after-out.before)+' px после ответа');
console.log(JSON.stringify(out));
if(fails.length){ console.log(['FAIL'].concat(fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK: ответ на интервью не двигает занятия дня');
