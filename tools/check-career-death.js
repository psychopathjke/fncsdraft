// Карточка смерти пишет число сёрджа, а не урон за игру — его слово 7 сентября
// 2026: «пиши количество сюрджа, а не урона за игру, то нереалистичные данные».
//
// Проверяется:
//   * ccSurgeGapAt при включённом сёрдже — чистый урон минус линия кадра;
//   * пока сёрдж не бьёт, но живых больше порога следующего круга — линия
//     предварительная (k-й снизу по чистому урону), как у панели набора;
//   * без сёрджа — null, и карточка пишет «сёрдж не включён»;
//   * карточка на карте несёт «сёрдж +N» и не несёт урон за игру; строки в 5 языках.
//
//   node tools/check-career-death.js
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

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<div id="__map" style="position:relative;width:600px;height:400px"></div>
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Faller', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    skipAnimation=false; if(typeof CC_FF!=='undefined') CC_FF=false;

    // ---- сёрдж включён: число = чистый урон минус линия кадра ----------------
    const on=ccSurgeGapAt([{zone:5, players:50, surgeAt:44, surgeLine:300, dots:[]}], 449);
    if(on!==149) fail('surge on: expected 149, got '+on);
    const under=ccSurgeGapAt([{zone:5, players:50, surgeAt:44, surgeLine:300, dots:[]}], 260);
    if(under!==-40) fail('surge under: expected -40, got '+under);
    out.steps.push('surge on: 449 net against line 300 = +149; 260 = -40');

    // ---- предупреждение: линия предварительная, как у HUD ----------------------
    const ph=ZoneSim.PHASES; let z=-1;
    for(let i=2;i<ph.length;i++){ if(isFinite(ph[i].surgeAt) && ph[i].surgeAt>0){ z=i; break; } }
    if(z<0) fail('no phase with a surge threshold');
    const at=ph[z].surgeAt;
    // кадр зоны z (следующая фаза — ph[z]), живых на 4 больше порога, пары по 2: отсекут 2 отряда
    const dots=[]; for(let i=0;i<(at+4)/2;i++) dots.push({alive:true, n:i*10});
    const warn=ccSurgeGapAt([{zone:z, players:at+4, surgeAt:0, surgeLine:null, dots:dots}], 100);
    // k = ceil(4/2) = 2, линия = третья снизу = 20, 100-20 = 80
    if(warn!==80) fail('warning line: expected 80, got '+warn);
    out.steps.push('warning: '+(at+4)+' alive over next threshold '+at+', provisional line 20, net 100 = +80');

    // ---- сёрджа нет ---------------------------------------------------------------
    const off=ccSurgeGapAt([{zone:1, players:100, surgeAt:0, surgeLine:null, dots:dots}], 100);
    if(off!==null) fail('no surge: expected null, got '+off);
    if(ccSurgeGapAt(null, 100)!==null || ccSurgeGapAt([], 100)!==null) fail('no frames: expected null');
    out.steps.push('first zone or no frame: null');

    // ---- карточка на карте --------------------------------------------------------
    const map=document.getElementById('__map');
    const T=L();
    ccDeathCard(map, {zone:6, cause:'Team X', who:'Team X', gun:'Pump', range:'close', place:12, net:2300, elims:2, surge:149});
    let card=map.querySelector('.cc-death'); if(!card) fail('card not drawn');
    let txt=card.textContent;
    if(txt.indexOf(T.ccDeathSurgeAbove(ccNum(149)))<0) fail('card lacks the surge number: '+txt);
    if(/2300/.test(txt)) fail('card still shows whole-game damage: '+txt);
    card.remove();
    ccDeathCard(map, {zone:2, cause:'storm', place:40, net:120, elims:0, surge:null});
    card=map.querySelector('.cc-death'); if(!card) fail('storm card not drawn');
    txt=card.textContent;
    if(txt.indexOf(T.ccDeathSurgeOff)<0) fail('storm card without "surge off": '+txt);
    card.remove();
    ccDeathCard(map, {zone:7, cause:'surge', place:20, net:100, elims:1, surge:-35});
    card=map.querySelector('.cc-death'); if(!card) fail('surge card not drawn');
    txt=card.textContent;
    if(txt.indexOf(T.ccDeathSurgeBelow(ccNum(35)))<0) fail('surge card without "-35": '+txt);
    card.remove();
    out.steps.push('card: "'+T.ccDeathSurgeAbove(ccNum(149))+'", no whole-game damage; storm: "'+T.ccDeathSurgeOff+'"; surge: "'+T.ccDeathSurgeBelow(ccNum(35))+'"');

    // ---- пять языков ------------------------------------------------------------------
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; const D=L();
      if(typeof D.ccDeathSurgeAbove!=='function' || typeof D.ccDeathSurgeBelow!=='function' || typeof D.ccDeathSurgeOff!=='string' || typeof D.ccDeathStats!=='function') fail(l+': death surge strings'); });
    out.steps.push('five languages carry the surge strings');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdeath-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the death card says how far from the surge line you fell, not how much you hit all game');
