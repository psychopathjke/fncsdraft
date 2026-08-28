// Топ карточек: чем живёт карьера и чем сажает ЛАН.
//
// Его вопрос, 27 августа: «сейчас все 2026 год?» и «покажи топ 10 карт».
// Печатаются две десятки рядом — сцена карьеры (ccSceneRoster, фильтрует год и
// берёт самую свежую) и пул ЛАНа (gcCardIndex, год не фильтрует и берёт самую
// высокую за всю историю). Разница между колонками — и есть ответ.
//
//   node tools/top-cards-probe.js [регион]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const REG = process.argv[2] || 'EU';
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={err:null, scene:[], lan:[], year:null, reg:'${REG}'};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Top', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'${REG}', ovr:92, role:'roleIGL',
        attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]}));
    careerLoad();
    out.year=CC_NOW_YEAR;
    const ovr=c=>{ const a=attrsFor(c)||{}; return Math.round(c._ovr!=null?c._ovr:(a.ovr||0)); };

    out.scene=ccSceneRoster('${REG}').slice()
      .sort((a,b)=>ovr(b)-ovr(a)).slice(0,10)
      .map(c=>({h:c.handle, o:ovr(c), y:ccCardYear(c), e:String(c.event||'').slice(0,42)}));

    // Именно тот индекс, которым карьера сажает ЛАН — за свой год.
    const idx=gcCardIndex(CC_NOW_YEAR);
    const seen=new Set();
    const lan=[];
    Object.keys(idx).forEach(k=>{ const c=idx[k];
      if((c.region||'')!=='${REG}') return;
      if(seen.has(k)) return; seen.add(k); lan.push(c); });
    out.lan=lan.sort((a,b)=>ovr(b)-ovr(a)).slice(0,10)
      .map(c=>({h:c.handle, o:ovr(c), y:ccCardYear(c), e:String(c.event||'').slice(0,42)}));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'topcards-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
const row = c => '  ' + String(c.o).padStart(3) + '  ' + String(c.y) + '  ' +
                 String(c.h).padEnd(20) + ' ' + c.e;
console.log('регион ' + out.reg + ', год карьеры ' + out.year);
console.log('');
console.log('СЦЕНА КАРЬЕРЫ (ccSceneRoster — фильтрует год, берёт свежую):');
out.scene.forEach(c => console.log(row(c)));
console.log('');
console.log('ПУЛ ЛАНА КАРЬЕРЫ (gcCardIndex за год карьеры, берёт высшую в этом году):');
out.lan.forEach(c => console.log(row(c)));
