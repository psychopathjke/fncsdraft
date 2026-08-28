// Прямоугольники домов: название карты над каждым, клик открывает её карту,
// выбор локи возвращает в карьеру. Его правка со скрином, 23 августа.
//
//   node tools/check-career-spot-ui.js
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
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  const tile = () => [...document.querySelectorAll('.ch-tile')]
    .find(e => e.querySelector('.cc-spot-cards, .cc-spot-open-head'));
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Homer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[],
              spots:{m2:[{i:0, aura:6, won:6, day:'2026-01-05'}],
                     r1:[{i:3, aura:3, won:3, day:'2026-01-20'}]}},
      partner:null}));
    careerEntry();
    careerRenderHub('me');

    // ---- название карты над каждым прямоугольником -------------------------
    let t=tile(); if(!t) fail('плитки точки нет в хабе');
    const names=[...t.querySelectorAll('.cc-spot-card-map')].map(e=>e.textContent.trim());
    // Три карты — три подписи: занятые и свободная. Пустой слот теперь тоже
    // квадрат с названием карты и сам открывает её (его правка 24 августа).
    if(names.length!==3) fail('подписей карт '+names.length+', ждали три');
    // Острова, а не круги: 1-2 — одна карта, 3-4 — другая (его правка 24 авг).
    if(names[0]!==L().ccSpotSeasonTab || names[1]!==L().ccSpotReloadA)
      fail('подписи карт не те: '+names.join('/'));
    // Вкладок-чипов над плиткой больше нет.
    if(t.querySelector('.cc-spot-tabs')) fail('чипы карт остались над плиткой');
    // У свободного спота — имена карт, куда его можно поставить.
    // Куда селиться — одной строкой под рядом, а не в каждом пустом квадрате.
    const pick=[...t.querySelectorAll('.cc-spot-pick button')].map(e=>e.textContent.trim());
    /* Отдельной строки кнопок под рядом больше нет: она называла ровно те же
       карты, что и пустые квадраты. Нажимают теперь на сам квадрат. */
    if(pick.length) fail('строка выбора карт осталась под рядом: '+pick.join(', '));
    const empty=[...t.querySelectorAll('.cc-spot-card-empty')];
    if(empty.length!==1) fail('пустых слотов '+empty.length+', ждали один');
    if(!empty[0].getAttribute('onclick')) fail('пустой слот не нажимается');
    if(!empty[0].querySelector('.cc-spot-card-map')) fail('на пустом слоте нет названия карты');
    if(t.querySelectorAll('.cc-spot-card-empty .cc-spot-pick').length)
      fail('список карт снова продублирован внутри пустых спотов');
    // Аура нарисована полосой, как энергия.
    if(t.querySelectorAll('.cc-aura-bar').length!==2) fail('полос ауры не две');
    out.steps.push('над прямоугольниками: '+names.join(', ')+'; пустой слот зовёт на свою карту сам');

    // ---- клик по прямоугольнику открывает его карту ------------------------
    careerSpotOpenFor('r12');
    t=tile();
    const head=t.querySelector('.cc-spot-open-head b');
    if(!head || head.textContent.trim()!==L().ccSpotReloadA)
      fail('открылась не карта Релоада 1-2');
    const boxes=t.querySelectorAll('.map-frame .land-zone');
    if(boxes.length!==ZONE_SETS.r1.length)
      fail('на карте '+boxes.length+' коробок вместо '+ZONE_SETS.r1.length);
    out.steps.push('клик по прямоугольнику открыл свою карту: '+boxes.length+' коробок Релоада 1');

    // ---- выбор локи возвращает в карьеру ------------------------------------
    careerSpotChoose(7);
    // Переезд по обжитой карте спрашивает — отвечаем «да», как игрок.
    if(document.getElementById('ccAskModal').style.display==='flex') ccAskGo(true);
    if(CC_SPOT_OPEN) fail('после выбора карта осталась открытой');
    if(careerSpotList('r1')[0].i!==7) fail('лока не сменилась');
    if(careerSpotAura('r1',0)!==0) fail('переезд не сжёг ауру этой карты');
    if(careerSpotAura('m2',0)!==6) fail('переезд задел другую карту');
    t=tile();
    if(!t.querySelector('.cc-spot-cards')) fail('в карьеру не вернулись');
    out.steps.push('выбор локи вернул в карьеру, аура сгорела только на своей карте');

    // ---- и так же с другой картой ------------------------------------------
    careerSpotOpenFor('m2');
    careerSpotChoose(11);
    if(document.getElementById('ccAskModal').style.display==='flex') ccAskGo(true);
    if(CC_SPOT_OPEN) fail('вторая карта осталась открытой');
    if(careerSpotList('m2')[0].i!==11) fail('вторая лока не сменилась');
    if(careerSpotUsed()!==2) fail('число домов изменилось: '+careerSpotUsed());
    out.steps.push('то же самое со второй картой — оба дома на месте, 2 из '+CC_SPOT_SLOTS);
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccspotui-'));
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
console.log('прямоугольники называют свою карту, открывают её и возвращают в карьеру');
