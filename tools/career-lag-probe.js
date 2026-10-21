// «Карьера с временем начинает лагать» (Notion 21.10, игрок из чата: «лагает только определённая карьера, где поиграл
// минимум 1–2 сезона, сайт сильно замедляется, помогает только запуск новой карьеры»).
//
// Карьера перематывается кусками (careerFastForward), и на каждой точке снимается: размер сейва по ключам, время
// careerSave, отрисовка хаба по вкладкам, один обычный день (careerAdvanceTo +1). Что растёт с возрастом карьеры —
// то и тормозит.
//
//   node tools/career-lag-probe.js [дней на шаг] [шагов]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const STEP = +(process.argv[2] || 180), STEPS = +(process.argv[3] || 4);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={errs:null, err:null, pts:[]};
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1)) if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'LagProbe', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:88,
        role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){ careerSeatTopUp(); const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand); if(s) careerDmAccept(s.id); }
    const ms=f=>{ const t=performance.now(); try{ f(); }catch(e){ return -1; } return Math.round((performance.now()-t)*10)/10; };
    const TABS=['centre','profile','career','training','club','calendar','media','boards','shop','items','locker','history'];
    const snap=label=>{
      const raw=localStorage.getItem('fncsdraft_career')||'';
      const sizes={}; let parsed={};
      try{ parsed=JSON.parse(raw); }catch(e){}
      const walk=(o, pre)=>Object.keys(o||{}).forEach(k=>{ const v=o[k]; const n=JSON.stringify(v===undefined?null:v).length;
        if(n>2000) sizes[pre+k]=n; if(v && typeof v==='object' && !Array.isArray(v) && pre.split('.').length<3 && n>20000) walk(v, pre+k+'.'); });
      walk(parsed, '');
      let lsTotal=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); lsTotal+=(localStorage.getItem(k)||'').length; }
      const tabs={}; TABS.forEach(t=>{ tabs[t]=ms(()=>careerRenderHub(t)); });
      const save=ms(()=>careerSave());
      const before=careerToday();
      const adv=ms(()=>careerAdvanceTo(ccAddDays(careerToday(), 1)));
      out.pts.push({label, day:before, save, adv, saveKB:Math.round(raw.length/1024), lsKB:Math.round(lsTotal/1024),
        dom:document.getElementsByTagName('*').length, heap:performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null,
        tabs, top:Object.entries(sizes).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,n])=>k+':'+Math.round(n/1024)+'K')});
    };
    snap('start');
    const realDigest=careerFfDigest; careerFfDigest=function(){};
    out.saves=[];
    for(let s=0; s<${STEPS}; s++){
      for(let k=0; k<3 && careerMatesShort() > 0; k++){ careerSeatTopUp(); const o=careerDms().filter(t=>t.state==='offer' && t.who && !t.who.org && !t.who.fan && !t.who.hater && !t.who.agent && !t.who.brand)[0]; if(!o) break; careerDmAccept(o.id); }
      await careerFastForward(${STEP});
      if(CAREER.career.seasonOver){ out.saves.push(localStorage.getItem('fncsdraft_career')); careerNewSeason(); }
      snap('s'+CAREER.career.season+'/'+((s+1)*${STEP})+'d');
    }
    careerFfDigest=realDigest;
    out.save=localStorage.getItem('fncsdraft_career');
  }catch(e){ out.err=String((e&&(e.stack||e.message))||e).slice(0,600); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lagprobe-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--enable-precise-memory-info',
  '--allow-file-access-from-files','--virtual-time-budget=9000000','--dump-dom','file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs && out.errs.length) console.error('ошибки страницы: ' + out.errs.slice(0,3).join(' | '));
if (out.err) console.error('встала: ' + out.err);
(out.saves||[]).forEach((x, i) => fs.writeFileSync(path.join(os.tmpdir(), 'lag-save-s' + (i + 1) + '.json'), x));
if (out.save) { fs.writeFileSync(path.join(os.tmpdir(), 'lag-save.json'), out.save); console.log('сейв записан: ' + path.join(os.tmpdir(), 'lag-save.json')); }
out.pts.forEach(p => {
  console.log(p.label.padEnd(7) + p.day + '  сейв ' + p.saveKB + ' КБ (всё хранилище ' + p.lsKB + ' КБ)  careerSave ' + p.save + ' мс  день ' + p.adv + ' мс  DOM ' + p.dom + '  heap ' + p.heap + ' МБ');
  console.log('        вкладки: ' + Object.entries(p.tabs).map(([k,v])=>k+' '+v).join(', '));
  console.log('        крупное: ' + p.top.join(' '));
});
