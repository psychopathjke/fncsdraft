// Обучение новичка (ccTourStart) — Notion 27.10, игрок: «слишком много всего сразу», его слово: «обучение для новых игроков».
// Свежая карьера: тур открывается сам; у каждого шага подсказка целиком на экране и не закрывает подсвеченное место;
// «Дальше» до конца; после — флаг стоит, затемнения нет, перерисовка хаба тур не возвращает; «Как играть» открывает снова.
// Карьера с сыгранным вечером — тур сам не открывается.
//   node tools/check-tour.js            (ширины 1280 и 480)
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..').split(String.fromCharCode(92)).join('/');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
window.addEventListener('load', ()=>setTimeout(async function(){
  const out={steps:[], errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const mk=(log)=>({v:1, player:{nick:'NewGuy', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
      region:'EU', ovr:60, role:'roleIGL', attrs:ccRookieAttrs(60,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
    career:{season:1, size:2, sizes:{}, year:2026, year0:2026, day:'2025-12-15', seasonOver:false, division:5, earnings:0, balance:0, reach:0,
      tokens:[], log:log, news:[], seed:'tour'}, partners:[]});
  try{
    try{ localStorage.removeItem('fncsdraft_tour1'); }catch(e){}
    localStorage.setItem('fncsdraft_career', JSON.stringify(mk([])));
    careerEntry(); careerRenderHub('centre');
    await wait(1500);
    out.auto=!!document.querySelector('.cc-tour');
    for(let i=0; i<12 && CC_TOUR; i++){
      await wait(50);
      const T=CC_TOUR, hole=T.wrap.querySelector('.cc-tour-hole').getBoundingClientRect(), tip=T.wrap.querySelector('.cc-tour-tip').getBoundingClientRect();
      const vw=innerWidth, vh=innerHeight;
      const ov=Math.max(0, Math.min(hole.right, tip.right)-Math.max(hole.left, tip.left))*Math.max(0, Math.min(hole.bottom, tip.bottom)-Math.max(hole.top, tip.top));
      out.steps.push({k:T.steps[T.i].k, text:T.wrap.querySelector('.cc-tour-t').textContent.length,
        inView:tip.left>=0 && tip.top>=0 && tip.right<=vw+1 && tip.bottom<=vh+1, holeH:Math.round(hole.height),
        cover:Math.round(ov/Math.max(1, hole.width*hole.height)*100), fits:hole.height<vh*0.8});
      T.wrap.querySelector('.cc-tour-next').click();
    }
    out.after=!!document.querySelector('.cc-tour');
    out.flag=localStorage.getItem('fncsdraft_tour1');
    careerRenderHub('centre'); await wait(1000);
    out.again=!!document.querySelector('.cc-tour');
    document.querySelector('.cc-tour-btn').click(); await wait(100);
    out.btn=!!document.querySelector('.cc-tour');
    ccTourEnd();
    try{ localStorage.removeItem('fncsdraft_tour1'); }catch(e){}
    localStorage.setItem('fncsdraft_career', JSON.stringify(mk([{season:1, day:'2025-12-14', div:5, place:40, of:100, kind:'cup'}])));
    careerEntry(); careerRenderHub('centre'); await wait(1500);
    out.veteran=!!document.querySelector('.cc-tour');
  }catch(e){ out.fail=String(e.stack||e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 1200));
<\/script>`;
let bad=0;
for(const W of [1280, 480]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tour-')); const tmp=path.join(dir,'index.html');
  fs.writeFileSync(tmp,'<base href="file:///'+ROOT+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
  const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--window-size='+W+',900','--virtual-time-budget=60000','--dump-dom','file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:1<<30,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:900000});
  fs.rmSync(dir,{recursive:true,force:true});
  const m=dom.match(/BEGIN([\w%\-.!~*'()]*)END/); if(!m){ console.log(W+': no output'); bad=1; continue; }
  const out=JSON.parse(decodeURIComponent(m[1]));
  const fails=[];
  if(out.fail) fails.push(out.fail);
  if(out.errs.length) fails.push('JS: '+out.errs.slice(0,3).join(' | '));
  if(!out.auto) fails.push('в свежей карьере тур сам не открылся');
  if(out.steps.length<5) fails.push('шагов '+out.steps.length+' (меньше пяти — места не нашлись)');
  out.steps.forEach(s=>{
    if(!s.text) fails.push(s.k+': пустой текст');
    if(!s.inView) fails.push(s.k+': подсказка за краем экрана');
    if(s.fits && s.cover>15) fails.push(s.k+': подсказка закрывает '+s.cover+'% подсвеченного места');
  });
  if(out.after) fails.push('после последнего шага затемнение осталось');
  if(out.flag!=='1') fails.push('флаг «тур пройден» не встал');
  if(out.again) fails.push('пройденный тур открылся снова');
  if(!out.btn) fails.push('кнопка «Как играть» тур не открыла');
  if(out.veteran) fails.push('карьера с сыгранным вечером тоже получила тур');
  console.log(W+': '+out.steps.map(s=>s.k.replace('ccTour','')+(s.cover?'('+s.cover+'%)':'')).join(' '));
  if(fails.length){ bad=1; console.log(['FAIL '+W].concat(fails).join(String.fromCharCode(10))); }
}
if(bad) process.exit(1);
console.log('OK: тур новичка открывается сам один раз, шаги на экране, кнопка открывает снова');
