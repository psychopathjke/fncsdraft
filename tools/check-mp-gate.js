// Вечер не начинается, пока не готовы оба.
//
// Решение заказчика и следствие локстепа сразу: играть без напарника нельзя,
// потому что вечер считают ОБА браузера, а результат принадлежит команде.
// Одиночная карьера гейта не замечает вовсе.
//
// Вторая половина проверки — про то, что гейт стоит во ВСЕХ одиннадцати
// раннерах. Читается по исходнику, а не по вере: раннер, который его не
// спросил, начал бы вечер в одиночку и разошёлся бы с напарником молча.
//
//   node tools/check-mp-gate.js
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
    // Одиночная карьера гейта не замечает вовсе.
    seed('EU', 2);
    const solo = await ccMpGate();
    check('в одиночной карьере гейт пропускает сразу', solo === null, JSON.stringify(solo));

    // Командная — ждёт, пока сервер не скажет «оба».
    CAREER.career.mp = {code:'ABC123', role:'a'};
    let sent = null;
    MP.ready = function(d){ sent = d; };
    let fired = null;
    MP.on = function(t, fn){ if(t === 'start') fired = fn; };
    const p = ccMpGate();
    let done = false; p.then(() => { done = true; });
    await new Promise(r => setTimeout(r, 60));
    check('готовность заявлена', sent === careerToday(), String(sent));
    check('и вечер НЕ начался', done === false);
    fired({t:'start', seed:'team-1|2026-02-02', n:7});
    const got = await p;
    check('старт от сервера открывает гейт', got && got.seed === 'team-1|2026-02-02',
          JSON.stringify(got));

    /* Перемотка в командной карьере отказывается — следствие того же
       правила, что и гейт. День двигает только close от сервера
       (careerAdvanceTo), вечер начинается по готовности обоих; перемотка не
       знает ни того, ни другого и на турнирном дне встаёт в гейте навсегда.
       Замерено 28 августа: без отказа цикл уходит в ccMpGate и не выходит. */
    const wasDay = careerToday();
    await careerFastForward(30);
    check('перемотка в командной карьере не двигает день',
          careerToday() === wasDay && !CC_FF, careerToday() + ' / ' + JSON.stringify(CC_FF));
    check('и кнопки перемотки называют причину',
          careerFfButtonsHTML().indexOf(L().ccMpNoFf) >= 0, careerFfButtonsHTML());
    // А в одиночной карьере она как была.
    delete CAREER.career.mp;
    check('в одиночной карьере кнопки перемотки на месте',
          careerFfButtonsHTML().indexOf('careerFfConfirm') >= 0, careerFfButtonsHTML());

    // Каждый раннер спрашивает гейт. Читается по исходнику, а не по вере.
    const src = document.documentElement.outerHTML;
    ['runCareerCup','runCareerMajor','runCareerSummit','runCareerGlobals','runCareerGclc',
     'runCareerReload','runCareerReloadChampionship','runCareerWeeklyFinal','runCareerEval',
     'runCareerVictory','runCareerSoloSeries'].forEach(fn => {
      const at = src.indexOf('async function ' + fn + '(');
      const body = at < 0 ? '' : src.slice(at, at + 1800);
      check(fn + ' спрашивает гейт', body.indexOf('ccMpGate()') >= 0, at < 0 ? 'функции нет' : 'нет вызова');
    });
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpgate-'));
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
console.log('вечер ждёт обоих, и это спрашивает каждый раннер');
fs.rmSync(dir, { recursive: true, force: true });
