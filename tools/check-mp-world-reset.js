// Мир, построенный этой страницей, выбрасывается по команде.
//
// Пул карточек, снимок сцены, европейский список, флаги лестницы, клубы,
// подписи года, пары и таблицы архива строятся на ПЕРВОЕ обращение и живут до
// конца страницы. Одиночной карьере это правильно: мир у неё один и он свой.
//
// Командная карьера получает мир от сервера ПОСЛЕ загрузки. Не выбросишь
// построенное — клиент посчитает вечер по вчерашней сцене и разойдётся с
// напарником МОЛЧА: на экране у обоих всё нормально до самой таблицы. Ловушка
// найдена при измерении локстепа (tools/check-lockstep.js), до единой строки
// мультиплеера, и стоит она одну функцию — ccWorldReset.
//
//   node tools/check-mp-world-reset.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (region, size) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:region, ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:size},
      partners:[]
    }));
    careerLoad();
  };
  try {
    // Мир строится один раз и живёт до конца страницы. Командная карьера
    // получает чужой мир ПОСЛЕ загрузки — значит построенное надо выбросить.
    seed('EU', 2);
    careerPools(); ccSceneRoster('EU'); careerOrgPool(); careerYearDays();
    /* Флаги лестницы и пары архива строятся своими дорогами (архивные пары — только для ЧУЖОГО региона, свой считается из пула на месте), и без этих двух
       вызовов половина проверки мерила бы пустые словари: они и до сброса
       были бы нулями, и после сброса нулями остались бы. */
    careerNatPool(); ccArcPairs('NAC');
    // Таблица архива строится по конкретному финалу — берётся первый, какой
    // сезон предлагает, иначе CH_ARC_TBL остался бы пустым и его строка в
    // проверке ничего бы не значила.
    (function(){ const a=careerArchiveSeason(1);
      const ev=(a && a.regional && a.regional[0]);
      if(ev) careerArchiveFinal(1, 'm|'+ev.n+'|'+(a.home||'EU')); })();
    out.notes.before = {
      pools: !!CC_POOLS, now: Object.keys(CC_NOW_CARDS).length,
      eu: Object.keys(CC_EU_ALL).length, nat: Object.keys(CC_NAT_POOL).length,
      orgs: Object.keys(CC_ORG_POOL).length, year: !!CC_YEAR_DAYS,
      arc: Object.keys(CC_ARC_PAIRS).length, tbl: Object.keys(CH_ARC_TBL).length
    };
    check('мир построен, иначе проверять нечего',
          !!CC_POOLS && !!CC_YEAR_DAYS, JSON.stringify(out.notes.before));

    ccWorldReset();

    out.notes.after = {
      pools: CC_POOLS, now: Object.keys(CC_NOW_CARDS).length,
      eu: Object.keys(CC_EU_ALL).length, nat: Object.keys(CC_NAT_POOL).length,
      orgs: Object.keys(CC_ORG_POOL).length, year: CC_YEAR_DAYS,
      arc: Object.keys(CC_ARC_PAIRS).length, tbl: Object.keys(CH_ARC_TBL).length
    };
    check('пул сброшен', CC_POOLS === null, String(CC_POOLS));
    check('снимок сцены сброшен', Object.keys(CC_NOW_CARDS).length === 0);
    check('и его метка тоже', CC_NOW_TAG === null, String(CC_NOW_TAG));
    check('европейский список сброшен', Object.keys(CC_EU_ALL).length === 0);
    check('флаги лестницы сброшены', Object.keys(CC_NAT_POOL).length === 0);
    check('клубы сброшены', Object.keys(CC_ORG_POOL).length === 0);
    check('подписи года сброшены', CC_YEAR_DAYS === null);
    check('пары архива сброшены', Object.keys(CC_ARC_PAIRS).length === 0);
    check('таблицы архива сброшены', Object.keys(CH_ARC_TBL).length === 0);

    // И мир строится заново, а не остаётся пустым.
    const again = careerPools();
    check('после сброса мир строится заново', !!again && !!CC_POOLS);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpworld-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('чужой мир не наследует ничего от построенного этой страницей');
fs.rmSync(dir, { recursive: true, force: true });
