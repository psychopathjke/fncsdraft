// Париж тоже идёт по двум островам — и на всех трёх этапах.
//
// Его вопрос, 27 августа: «а карта меняется во франции?». Reload Championship
// в Париже — это крона круга, и играется она на островах круга. Правило
// чередования (ccRelIsland) у неё общее с Elite Series, но проверялось до сих
// пор только на кубках: check-career-reload-island гоняет живьём
// runCareerReload, а до runCareerReloadChampionship не доходит.
//
// Здесь Париж играется по-настоящему, все три его этапа — группа, выживание,
// финал, — и записывается, на каком острове стояла каждая игра. Контроль:
// острова должны быть ДВА и чередоваться, а не просто «где-то поменялся».
//
//   node tools/check-career-rc-island.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    /* Окно про метку отвечает за игрока, иначе харнесс висит до конца бюджета:
       careerSpotGate — это ccAsk, а не confirm, и вечер до ответа не начнётся.
       Проверяем по ТЕКСТУ кнопки: ccAsk носит ещё перемотку и новую карьеру,
       и слепой клик по «нет» сломал бы их. */
    setInterval(function(){
      const am = document.getElementById('ccAskModal');
      if (am && am.style.display === 'flex') {
        const no = document.getElementById('ccAskNo');
        if (no && no.textContent === L().ccSpotGatePlay) no.click();
      }
      document.querySelectorAll('.cc-choice-btn').forEach(b => b.click());
    }, 30);

    const row = CAREER_YEAR.find(r => r[2] === 'ReloadChampionshipParis');
    if (!row) fail('Парижа нет в календаре');
    const day0 = row[0];
    out.steps.push('Париж в календаре: ' + day0 + ' … ' + row[1]);

    const seed = (day, rc) => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
        player:{nick:'Paris', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
          attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
          handle:null, cardRegion:null, nat:null},
        career:{season:1, day:day, division:1, earnings:0, balance:5000,
          reach:9000, tokens:[], log:[], news:[],
          // Место в Париже берётся с финала круга — вот он.
          ewc:[{series:4, place:2, day:'2026-07-01'}],
          rc:rc},
        partners:[{handle:'Sbari', cardRegion:'EU', dev:0, since:'2026-01-12'}]}));
      careerLoad();
      skipAnimation = true; CC_SKIP_RUN = true;
    };

    // Каждый этап — свой день и своё состояние допуска (см. careerRcCan).
    const stages = [
      {name:'группа',    day:day0,                 rc:null},
      {name:'выживание', day:ccAddDays(day0, 1),   rc:{got:'group', dropped:true}},
      {name:'финал',     day:ccAddDays(day0, 2),   rc:{got:'survival', ticket:true}}
    ];

    for (const s of stages) {
      seed(s.day, s.rc);
      const ev = careerRcOn(careerToday());
      if (!ev) fail(s.name + ': ' + careerToday() + ' — не день Парижа');
      if (!careerRcCan(ev)) fail(s.name + ': этап недоступен (' + ev.stage + ')');

      const visited = [];
      const was = useLandingSet;
      useLandingSet = function(k){ visited.push(k); return was.apply(this, arguments); };
      try { await runCareerReloadChampionship(); }
      finally { useLandingSet = was; }

      /* Наборы круга — и подряд идущие повторы сжимаются в один.

         useLandingSet зовётся за игру ДВАЖДЫ: сначала его ставит mapEach
         (остров этой игры), потом careerLandingPick пересобирает сетку под
         тем же ключом, чтобы пикер не показал половину острова. Это одна
         игра, а не две, и считать их как две значит требовать смены острова
         между вопросом и высадкой — то есть требовать бага. */
      const raw = visited.filter(k => /^r\\d$/.test(k));
      const sets = raw.filter((k, i) => !i || k !== raw[i-1]);
      const art = sets.map(k => MAP_ART[k]);
      const islands = [...new Set(art)];
      out.steps.push(s.name + ' (' + ev.stage + '): ' + sets.join(' → ') +
                     ' (островов ' + islands.length + ', игр ' + sets.length + ')');
      if (!sets.length) fail(s.name + ': остров не ставился ни разу');
      if (sets.length < 2) fail(s.name + ': всего одна игра — чередовать нечего');
      if (islands.length !== 2) fail(s.name + ': вечер прошёл по ' + islands.length +
                                     ' острову, а не по двум (' + sets.join(',') + ')');
      // Чередование, а не «поменялся один раз»: соседние игры на разных.
      const flips = art.filter((a, i) => i && a !== art[i-1]).length;
      if (flips !== art.length - 1) fail(s.name + ': острова не чередуются — смен ' +
                                       flips + ' на ' + (art.length - 1) + ' переходов');
    }
    out.steps.push('все три этапа Парижа чередуют острова игра через игру');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rcisland-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=900000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('Париж играется по двум островам на всех трёх этапах');
fs.rmSync(dir, { recursive: true, force: true });
