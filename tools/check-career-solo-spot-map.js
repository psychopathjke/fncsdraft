// У соло-турнира своя карта под метку — и в одиночной карьере, и в командной.
//
// Его правка 2 сентября 2026: «чтоб можно было выбрать метку на карте в соло и
// дуо карьере». До неё четвёртая карта (соло) появлялась в плитке только при
// открытой команде: в одиночной карьере соло-вечер садился на общий сезонный
// дом — тот же, что дуо-турниры, — и отдельной метки под соло не было негде
// поставить.
//
// Проверяется в обоих форматах карьеры:
//   * плитка домов даёт карту с ключом 'solo';
//   * у соло-вечера ключ метки именно 'solo', а у дуо-вечера — сезонный;
//   * метка соло хранится отдельно (cr.soloSpots) и не занимает командный слот;
//   * поставленная соло-метка открывает вечер, который до неё был закрыт.
//
//   node tools/check-career-solo-spot-map.js
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
  try{
    const start = () => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Spotter', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
        career:{season:1, day:'2026-10-04', division:1, earnings:0, balance:500, reach:0,
                tokens:[], log:[], news:[]},
        partner:null}));
      careerEntry();
    };

    start();
    // ---- карта под соло есть и в одиночной карьере ------------------------
    const keys = () => careerSpotSets().map(s => s.key);
    if(keys().indexOf('solo') < 0)
      fail('a single career offers no solo map: ' + JSON.stringify(keys()));
    out.steps.push('single career: the spot tiles are ' + JSON.stringify(keys()));

    // ---- у соло-вечера свой ключ, у дуо-вечера сезонный --------------------
    const soloDay = careerSoloSeriesOn('2026-10-04');
    if(!soloDay) fail('4 Oct is not a solo evening any more');
    const soloNext = {type:'solo', day:'2026-10-04'};
    if(careerNightSpotKey(soloNext) !== 'solo')
      fail('a solo evening asks for the ' + careerNightSpotKey(soloNext) + ' spot, not the solo one');
    const cupNext = {type:'cup', day:'2026-10-05'};
    if(careerNightSpotKey(cupNext) === 'solo')
      fail('a cup evening was given the solo spot');
    out.steps.push('the solo evening wants the solo spot, the cup evening the season one');

    // ---- метка соло лежит отдельно и не ест командный слот ----------------
    const cr = CAREER.career;
    if(!careerSpotSet(0, 'solo')) fail('the solo spot could not be placed at all');
    if(!(cr.soloSpots && Object.keys(cr.soloSpots).length))
      fail('the solo spot did not land in cr.soloSpots');
    const teamSlots = careerSpotSets().filter(t => t.key !== 'solo')
      .reduce((n, t) => n + careerSpotList(t.key).length, 0);
    if(teamSlots !== 0)
      fail('placing the solo spot took ' + teamSlots + ' of the season slots');
    out.steps.push('the solo spot lives in its own store and costs no season slot');

    // ---- и она открывает вечер, который без неё закрыт --------------------
    delete cr.soloSpots;
    if(careerSpotGate(soloNext) !== false)
      fail('a solo evening with no spot was let through');
    careerSpotSet(0, 'solo');
    if(careerSpotGate(soloNext) !== true)
      fail('a solo evening is still blocked with the solo spot placed');
    out.steps.push('no solo spot, no solo evening — and placing one opens it');

    // ---- то же самое в командной карьере ----------------------------------
    start();
    CAREER.career.mp = {code:'TEST01', role:'host'};
    if(typeof ccMpTeam === 'function' && !ccMpTeam())
      out.steps.push('(the duo career could not be faked here; the single one is the case that was broken)');
    else {
      if(careerSpotSets().map(s => s.key).indexOf('solo') < 0)
        fail('a duo career lost its solo map');
      if(careerNightSpotKey({type:'solo', day:'2026-10-04'}) !== 'solo')
        fail('a duo career stopped asking for the solo spot');
      out.steps.push('duo career: the solo map is still there and still asked for');
    }
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccspot-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the solo tournament has its own map to mark, in either career');
