// Напарник не сползает вниз просто оттого, что время идёт.
//
// Его замер, 26 августа: «180 дней промотал, мой игрок вырос, напарник упал».
// Прогон той же кнопкой (careerFastForward, 180 дней, 78 вечеров): игрок
// 90 → 93, напарник 96 → 93, запись дуо −3.34. Возрастная половина при этом
// плюсовая — весь минус приезжал из ожидания: careerApplyGrowth считает своё по
// регрессии (fit, починено 24 августа), а рядом стоящий вызов передавал
// напарнику СЫРОЕ expected. У сильной пары доля поля, которую она сильнее,
// почти единица: выше ехать некуда, вниз — сколько угодно, и всю дисперсию
// оплачивал напарник.
//
//   node tools/check-career-mate-drift.js [папка сборки]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
  const seed = (mateHandle) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Drift', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleFragger',
              attrs:ccRookieAttrs(90,'roleFragger'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-12', division:1, earnings:0, balance:20000,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[{handle:mateHandle, cardRegion:'EU', dev:0, since:'2026-01-12'}]
    }));
    careerLoad();
  };
  const ovrMate=()=>{ const c=ccMateCardOf(careerMateRec());
    return c ? Math.round((attrsFor(c)||{}).ovr||0) : null; };
  try {
    const eu=ccSceneRoster('EU').slice().sort((a,b)=>
      ((b._ovr!=null?b._ovr:(attrsFor(b)||{}).ovr))-((a._ovr!=null?a._ovr:(attrsFor(a)||{}).ovr)));
    const mate=eu[2].handle;

    /* ---- арифметика: чем именно платит напарник ------------------------
       Сорок вечеров с медианным результатом. С СЫРЫМ ожиданием сильной пары
       (0.97) напарник обязан просесть — это и есть поломка. С ожиданием по
       регрессии (0.5 при среднем результате) он стоять почти на месте. */
    seed(mate);
    for(let i=0;i<40;i++) careerMateGrow(0.5, 0.97);
    const сырое=+((careerMateRec().dev)||0).toFixed(2);
    seed(mate);
    for(let i=0;i<40;i++) careerMateGrow(0.5, 0.5);
    const поРегрессии=+((careerMateRec().dev)||0).toFixed(2);
    out.notes.арифметика={сыроеОжидание:сырое, поРегрессии:поРегрессии};
    check('контроль: сырое ожидание действительно топит напарника',
          сырое < -1, String(сырое));
    check('с ожиданием по регрессии он держится',
          поРегрессии > сырое + 1, JSON.stringify(out.notes.арифметика));

    /* ---- и то же самое целиком, той же кнопкой, какой это делает игрок --- */
    seed(mate);
    /* Считается ЗАПИСЬ, а не карточка на экране: за полгода напарник может уйти
       (ccNewsMateLeftFor), и тогда careerMateRec — это уже другой человек, а
       карточка старого не строится вовсе. Запись того, с кем начинали, лежит в
       CAREER.partners и переживает разрыв. */
    const recOf=h=>(CAREER.partners||[]).find(x=>hKey(x.handle)===hKey(h))||{};
    const было={я:CAREER.player.ovr, напарник:ovrMate(), запись:+((recOf(mate).dev)||0)};
    await careerFastForward(120);
    const стало={я:CAREER.player.ovr, напарник:ovrMate(),
                 вечеров:(CAREER.career.log||[]).length,
                 ушёл: hKey((careerMateRec()||{}).handle)!==hKey(mate),
                 записьДуо:+(((recOf(mate).dev)||0)).toFixed(2)};
    out.notes.перемотка={было:было, стало:стало};
    check("перемотка вообще что-то отыграла", (стало.вечеров||0) > 20,
          JSON.stringify(стало));
    check('игрок за полгода вырос', стало.я >= было.я,
          было.я + ' -> ' + стало.я);
    /* Напарник у потолка и чуть выше игрока действительно тянется к его
       уровню — это правило дуо, а не поломка. Стеречь имеет смысл обвал:
       три очка за полгода это он, полтора — обычная тяга. */
    /* Обвал виден по записи: она и есть то, что этот вечер сделал с
       человеком. Три очка за полгода — поломка, полтора — обычная тяга к
       уровню игрока. Ушёл он или остался, на арифметику не влияет. */
    check('напарник за те же полгода не обваливается',
          стало.записьДуо >= -1.5,
          'запись дуо ' + стало.записьДуо +
          (стало.ушёл ? ' (за это время он ушёл из дуо)' : '') +
          ', овр ' + было.напарник + ' -> ' + стало.напарник);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'matedrift-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=2400000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('напарник не сползает от одного хода времени');
fs.rmSync(dir, { recursive: true, force: true });
