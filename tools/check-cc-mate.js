// В поиске игрока видно, с кем он играет сейчас.
//
// Его правка, 24 августа: рядом с рейтингом должно стоять и то, кто у него
// тиммейт. Проверяется не «строка есть», а то, ради чего она есть: напарник
// взят с САМОЙ карточки, поэтому у тёзки из другой сцены он свой, а не общий.
//
//   node tools/check-cc-mate.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={steps:[], fail:null};
  const fail=m=>{ if(!out.fail) out.fail=m; throw new Error(m); };
  try{
    // Пары есть у всех регионов, а не только у европейского: карьеру играют
    // из семи, и список строится по региону.
    const regs=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
    const seen={};
    regs.forEach(r=>{
      const roster=ccSceneRoster(r)||[];
      let withMate=0;
      roster.forEach(c=>{ if(ccMateNow(c)) withMate++; });
      seen[r]={n:roster.length, mate:withMate};
    });
    const eu=seen.EU;
    if(!eu.n) fail('европейского состава нет вовсе');
    if(eu.mate < eu.n*0.5)
      fail('напарник нашёлся только у '+eu.mate+' из '+eu.n+' европейцев');
    out.steps.push('напарник читается: '+regs.map(r=>r+' '+seen[r].mate+'/'+seen[r].n).join(', '));

    // Сам себе напарником не бывает.
    const bad=(ccSceneRoster('EU')||[]).filter(c=>{
      const m=ccMateNow(c);
      return m && m.split(', ').some(h=>hKey(h)===hKey(c));
    });
    if(bad.length) fail('в напарниках он сам: '+bad.slice(0,3).map(c=>c.handle).join(', '));
    out.steps.push('в напарниках никогда не он сам');

    // Тёзки: один ник в двух сценах — два разных напарника (или хотя бы не
    // один общий, взятый по голому нику).
    const byHandle=new Map();
    regs.forEach(r=>(ccSceneRoster(r)||[]).forEach(c=>{
      const k=hKey(c);
      if(!byHandle.has(k)) byHandle.set(k, []);
      byHandle.get(k).push({reg:r, mate:ccMateNow(c)});
    }));
    const twins=[...byHandle.entries()].filter(([,v])=>v.length>1 && v.every(x=>x.mate));
    const leaked=twins.filter(([,v])=>new Set(v.map(x=>x.mate)).size===1);
    out.steps.push('ников в двух сценах с напарником у обоих: '+twins.length+
      ', с одинаковым напарником: '+leaked.length);
    if(twins.length && leaked.length===twins.length)
      fail('у всех тёзок напарник один и тот же — значит взят по нику, а не с карточки');

    // И строка доходит до экрана.
    // CC объявлен через const — правится по полям, а не присваиванием.
    CC.mode='take'; CC.region='EU';
    show('screen-career-create');
    if(typeof ccRenderList==='function'){
      const grid=document.getElementById('ccGrid'), cards=document.getElementById('ccCards');
      if(!cards) fail('списка карточек на экране нет');
      ccRenderList();
      const rows=cards.querySelectorAll('.cc-card');
      const withLine=cards.querySelectorAll('.cc-card-mate');
      if(!rows.length) fail('список пуст');
      if(!withLine.length) fail('строки напарника нет ни в одной карточке из '+rows.length);
      out.steps.push('на экране: '+withLine.length+' карточек из '+rows.length+' со строкой напарника');
    }
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmate-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('в поиске игрока видно, с кем он играет сейчас');
