// Лион (FNCS 2025 Global Championship, 6–7 сентября 2025) играется на острове Chapter 6 Season 4.
//
// Notion 26.10.26, игрок: «карта не того сезона». Лион шёл на C6S3 (t3) — острова C6S4 в сборке не было.
// Мейджор 3 (2–3 августа) остаётся на C6S3: четвёртый сезон начался 7 августа.
//   * у t4 есть клетки, рейтинг лута, картинка, пул оружия и расходников;
//   * на время Лиона драфт берёт остров и пул t4, после — прежний t3;
//   * карьера 2025: 3 августа — t3, 6 сентября — t4.
//
//   node tools/check-lyon-island.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const HEAD = `<script>window.__errs=[];window.addEventListener('error',e=>window.__errs.push(String(e.message)+' @'+e.lineno));<\/script>`;
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    if(!ZONE_SETS.t4 || ZONE_SETS.t4.length < 20) fail('no C6S4 landing zones: ' + (ZONE_SETS.t4||[]).length);
    if(!ZONE_STATS.t4 || ZONE_STATS.t4.length !== ZONE_SETS.t4.length) fail('loot rating does not cover every zone');
    if(MAP_ART.t4 !== 'art/map-t4.jpg') fail('no map picture for t4');
    if(!T_WEAPON_POOLS.t4 || !T_WEAPON_POOLS.t4.some(w => w.name === 'O.X.R. Rifle')) fail('no C6S4 weapon pool');
    if(T_WEAPON_POOLS.t4.some(w => w.name === 'Spire Rifle')) fail('a Season 3 gun is in the Lyon pool');
    out.steps.push('t4: ' + ZONE_SETS.t4.length + ' zones, loot rated, ' + T4_WEAPON_NAMES.length + ' guns');
    // Драфт: карточки Мейджора 3, остров — по этапу.
    CARD_MODE = true; CARD_SET = 't3';
    if(activeWeaponPool() !== T3_WEAPON_POOL) fail('Major 3 does not play the Season 3 pool');
    const prev = ACTIVE_LANDING_SET;
    useLandingSet('t4'); LOOT_ISLAND_NOW = 't4';
    if(ACTIVE_LANDING_SET !== 't4' || activeWeaponPool() !== T4_WEAPON_POOL) fail('Lyon does not switch to the C6S4 island and pool');
    LOOT_ISLAND_NOW = null; useLandingSet('t3');
    if(activeWeaponPool() !== T3_WEAPON_POOL) fail('the pool did not come back after Lyon');
    out.steps.push('draft: Major 3 on t3, Lyon on t4 with its own guns, then back');
    CARD_MODE = false;
    // Карьера 2025, трио.
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Lyoner', age:20, source:'rookie', country:'fr',
      countryPing:15, closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, size:3, year:2025, year0:2025, day:'2025-08-03', division:1, earnings:0, balance:500, reach:0, tokens:[], log:[], news:[]}, partner:null}));
    careerEntry(); CAREER.career.size = 3;
    const isl = d => { CAREER.career.day = d; return careerBrSet(); };
    if(isl('2025-08-03') !== 't3') fail('Major 3 weekend is on ' + isl('2025-08-03'));
    if(isl('2025-09-06') !== 't4') fail('Lyon weekend in the career is on ' + isl('2025-09-06'));
    out.steps.push('career 2025: 3 Aug t3, 6 Sep t4');
    localStorage.clear();
  }catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclyon-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
  '--user-data-dir=' + path.join(dir, 'prof'), '--virtual-time-budget=60000','--dump-dom','file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('Lyon is played on the Chapter 6 Season 4 island');
