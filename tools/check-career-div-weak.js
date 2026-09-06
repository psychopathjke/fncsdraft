// Комната дивизиона дерётся по своим реплеям: единицы слабости уходят в движок.
//
// CC_DIV_WEAK (index.html) собран по восьми реплеям на дивизион
// (tools/real-division-curves.json). Проверяется:
//   * дивизионный кап ставит движку единицы своего дивизиона, первый — нули;
//   * не кап (финал, соло, мейджор) единицы снимает — движок считает по силе;
//   * таблица монотонна там, где реплеи это говорят: у D2–D4 высадка злее,
//     чем у D1 и D5;
//   * файл эталона на месте, по 6–8 игр на дивизион, кривые убывают.
//
//   node tools/check-career-div-weak.js
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

// ---- эталон -----------------------------------------------------------------
const real = JSON.parse(fs.readFileSync(path.join(__dirname, 'real-division-curves.json'), 'utf8'));
for (const d of ['1','2','3','4','5']) {
  const rows = real.sessions[d];
  if (!rows || rows.length < 6) { console.error('FAIL division ' + d + ' has ' + (rows ? rows.length : 0) + ' replays in the reference'); process.exit(1); }
  rows.forEach(([id, c]) => { for (let i = 1; i < c.length; i++) if (c[i] > c[i-1]) { console.error('FAIL ' + id + ': the curve rises at zone ' + (i+1)); process.exit(1); } });
}

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    const start = (div) => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Weak', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
        career:{season:1, day:'2026-02-02', division:div, earnings:0, balance:500, reach:0,
                tokens:[], log:[], news:[]},
        partner:null}));
      careerEntry();
    };
    // Читаем то, что реально стоит в движке: подменяем tune и смотрим аргумент.
    const realTune = ZoneSim.tune; let last = null;
    ZoneSim.tune = function(v){ last = v; return realTune.call(ZoneSim, v); };
    const got = {};
    for(const d of [1,2,3,4,5]){
      start(d); last = null;
      ccZoneTuneFor({type:'cup', day:careerToday()});
      if(!last || last.LOBBY_WEAK_UNITS == null || last.DROP_WEAK_UNITS == null) fail('division ' + d + ': the cup set no units: ' + JSON.stringify(last));
      got[d] = [last.LOBBY_WEAK_UNITS, last.DROP_WEAK_UNITS];
    }
    if(!(got[1][0] === 0 && got[1][1] === 0)) fail('division 1 carries units ' + JSON.stringify(got[1]));
    [2,3,4].forEach(d => { if(!(got[d][1] > got[1][1] && got[d][1] > got[5][1])) fail('division ' + d + ' drop units ' + got[d][1] + ' are not above D1 ' + got[1][1] + ' and D5 ' + got[5][1]); });
    [2,3,4,5].forEach(d => { if(!(got[d][0] > 0)) fail('division ' + d + ' has no early units'); });
    out.steps.push('cups: ' + [1,2,3,4,5].map(d => 'D' + d + ' ' + got[d].join('/')).join(', '));
    // Не кап — свои единицы по реплеям этапа (CC_STAGE_WEAK), а не по силе карточек:
    // одиночки на шкале team.pow слабее дуо, и запасная формула резала соло.
    start(4); last = null;
    ccZoneTuneFor({type:'solo', day:careerToday()});
    if(!last || last.LOBBY_WEAK_UNITS !== 0 || last.DROP_WEAK_UNITS !== 0) fail('the solo series carries units ' + JSON.stringify(last) + ', not 0/0');
    ccZoneTuneFor({type:'final', day:careerToday()});
    if(!last || last.LOBBY_WEAK_UNITS !== 0 || last.DROP_WEAK_UNITS !== 0) fail('the weekly final carries units ' + JSON.stringify(last) + ', not 0/0');
    ccZoneTuneFor({type:'eval', day:careerToday()});
    if(!last || !(last.LOBBY_WEAK_UNITS > 0 && last.DROP_WEAK_UNITS > 0 && last.DROP_WEAK_UNITS < got[2][1])) fail('perf eval units ' + JSON.stringify(last) + ' are not between D1 and D2');
    ccZoneTuneFor({type:'victory', mode:'solo', day:careerToday()});
    if(!last || !(last.LOBBY_WEAK_UNITS > 0 && last.DROP_WEAK_UNITS > 0)) fail('the solo victory cup has no units: ' + JSON.stringify(last));
    if(CC_ZONE_PROFILE!=='open') fail('the solo victory cup is not open: ' + CC_ZONE_PROFILE);
    ccZoneTuneFor({type:'victory', mode:'duo', day:careerToday()});
    if(!last || !(last.LOBBY_WEAK_UNITS > 0 && last.DROP_WEAK_UNITS > 0) || CC_ZONE_PROFILE!=='finals') fail('the duo victory cup: ' + JSON.stringify(last) + ' ' + CC_ZONE_PROFILE);
    ccZoneTuneFor({type:'victory', mode:'solo', reload:true, day:careerToday()});
    if(!last || last.LOBBY_WEAK_UNITS !== 0 || CC_ZONE_PROFILE!=='finals') fail('the reload solo victory cup: ' + JSON.stringify(last) + ' ' + CC_ZONE_PROFILE);
    ccZoneTuneFor({type:'major', stage:'playin', day:careerToday()});
    if(!last || !(last.DROP_WEAK_UNITS > 0) || CC_ZONE_PROFILE!=='finals') fail('the play-in: ' + JSON.stringify(last) + ' ' + CC_ZONE_PROFILE);
    ccZoneTuneFor({type:'major', stage:'heats', day:careerToday()});
    if(!last || last.DROP_WEAK_UNITS !== 0 || CC_ZONE_PROFILE!=='finals') fail('the heats: ' + JSON.stringify(last) + ' ' + CC_ZONE_PROFILE);
    ccZoneTuneFor({type:'solo', stage:'qual', day:careerToday()});
    if(!last || !(last.DROP_WEAK_UNITS > 0) || CC_ZONE_PROFILE!=='finals') fail('the solo qualifier: ' + JSON.stringify(last) + ' ' + CC_ZONE_PROFILE);
    // Неизмеренное остаётся на запасной формуле и на таблице очков.
    ccZoneTuneFor({type:'proam', day:careerToday()});
    if(!last || !('LOBBY_WEAK_UNITS' in last) || last.LOBBY_WEAK_UNITS !== null || last.DROP_WEAK_UNITS !== null || CC_ZONE_PROFILE !== null)
      fail('an unmeasured evening did not clear the units: ' + JSON.stringify(last) + ' ' + CC_ZONE_PROFILE);
    out.steps.push('solo 0/0, final 0/0, eval between D1 and D2, victory cups (solo open, duo finals, reload solo finals), play-in and solo qualifier carry drop units, pro-am cleared');
    // Профиль: финал соло и финал недели — finals, хотя очки у них не pointsForPlace; неизмеренное — по таблице очков.
    start(1);
    const finalDay=[...careerYearDays().keys()].find(d=>(careerYearDays().get(d)||[]).some(e=>/^SoloSeries_Final$/.test(e.id)));
    if(!finalDay) fail('no Solo Series final in the calendar');
    ccZoneTuneFor({type:'solo', day:finalDay});
    if(CC_ZONE_PROFILE!=='finals') fail('the solo final does not force the finals profile: ' + CC_ZONE_PROFILE);
    applyStageBias(victoryR1Points);
    if(ZoneSim.profile()!=='finals') fail('applyStageBias ignored the forced profile: ' + ZoneSim.profile());
    ccZoneTuneFor({type:'final', day:careerToday()});
    if(CC_ZONE_PROFILE!=='finals') fail('the weekly final is not finals: ' + CC_ZONE_PROFILE);
    applyStageBias(wfPoints);
    if(ZoneSim.profile()!=='finals') fail('the weekly final points did not play finals: ' + ZoneSim.profile());
    ccZoneTuneFor({type:'proam', day:careerToday()});
    applyStageBias(victoryR1Points);
    if(ZoneSim.profile()!=='open') fail('without a forced profile victory points are not open: ' + ZoneSim.profile());
    ccZoneTuneFor(null);
    if(CC_ZONE_PROFILE!==null || !last || last.LOBBY_WEAK_UNITS!==null) fail('ccZoneTuneFor(null) did not reset: ' + CC_ZONE_PROFILE + ' ' + JSON.stringify(last));
    applyStageBias(pointsForPlace);
    out.steps.push('solo final and weekly final play under finals; unmeasured evenings follow the scoring table; null resets');
    ZoneSim.tune = realTune;
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdivweak-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('each division fights the way its replays do; everything else falls back to strength');
