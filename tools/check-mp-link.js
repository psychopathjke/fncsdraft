// Связь с лобби видна, и без неё карьера не запирается молча.
//
// Три дыры, которые вылезли бы на первой же живой пробе вдвоём:
//   1. Не подключились — а career.mp уже записан, и день с этого момента
//      двигает только сервер. Карьера стоит, причина нигде не сказана.
//   2. Оборвалось посреди — сокет молча переподключается, на экране ничего.
//   3. Разные сборки — лобби отвечает 'bye' по причине build, и клиент
//      закрывает сокет так же молча. Игрок видит «играть не начинается».
//
// Поэтому: код лобби записывается ТОЛЬКО после того, как подключились;
// состояние связи живёт в MP.state и видно на плитке команды; пока связи нет,
// вечер не начинается и об этом сказано словами.
//
//   node tools/check-mp-link.js
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
  const seed = () => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:2},
      partners:[]
    }));
    careerLoad();
  };
  try {
    // ---- 1. не подключились — карьера осталась одиночной ------------------
    seed();
    MP.connect = function(){ return Promise.reject(new Error('нет лобби')); };
    let threw = false;
    try { await careerMpCreate(); } catch(e) { threw = true; }
    check('неудачное подключение не роняет вызов наружу', threw === false);
    check('карьера осталась одиночной', ccMpOn() === false,
          JSON.stringify(CAREER.career.mp));
    check('и день двигается сам', (function(){
      const was = careerToday(); careerAdvanceTo(ccAddDays(was, 1));
      return careerToday() !== was; })(), careerToday());
    check('состояние связи названо', MP.state === 'lost', String(MP.state));

    // ---- 2. подключились — код записан, связь живая -----------------------
    seed();
    MP.connect = function(code, id){ MP.state = 'live'; return Promise.resolve(); };
    await careerMpCreate();
    check('код лобби записан', ccMpOn() === true, JSON.stringify(CAREER.career.mp));
    check('связь живая', ccMpLive() === true, String(MP.state));

    /* ---- 3. пока связи нет, вечер не начинается — и это сказано ----------
       Сравнивается с тем, что говорит ТА ЖЕ карьера без лобби: «играть можно»
       зависит ещё от напарника, дня и дивизиона, и проверять надо разницу,
       которую вносит связь, а не абсолютный ответ. */
    const mpWas = CAREER.career.mp;
    delete CAREER.career.mp;
    /* С напарником в кресле — иначе «играть можно» и так false (пустое кресло
       не пускает в лобби), и сравнение false с false ничего не значило бы. */
    CAREER.partners = [{handle:'mate', card:{handle:'mate', nat:'de', region:'EU',
                                             rating:88, role:'roleFRG'}}];
    const solo = careerCanPlayKind('cup');
    check('в одиночной с напарником играть можно — иначе сравнивать нечего',
          solo === true, String(solo));
    out.notes.одиночная = solo;
    MP.state = 'lost';
    check('одиночную карьеру связь не касается',
          careerCanPlayKind('cup') === solo && ccMpWhy() === null, ccMpWhy());

    CAREER.career.mp = mpWas;
    /* В команде кресло занимает живой напарник, и без его карточки играть
       нельзя — это правило кресла, а не связи (см. check-mp-no-randoms).
       Чтобы мерить именно связь, карточку напарника ставим. */
    MP.peer = {handle:"howly", nat:"ru", region:"EU", rating:91, _targetOvr:91,
               _attrs:null, _roleKey:"roleFRG", event:"probe", tier:"ranked"};
    MP.state = 'lost';
    check('без связи играть нельзя', careerCanPlayKind('cup') === false, String(MP.state));
    check('и причина названа', ccMpWhy() === L().ccMpLost, ccMpWhy());
    MP.state = 'old';
    check('чужая сборка — своя причина', ccMpWhy() === L().ccMpOld, ccMpWhy());
    MP.state = 'wait';
    check('пока подключаемся — тоже своя', ccMpWhy() === L().ccMpWait, ccMpWhy());
    MP.state = 'live';
    check('со связью — как в одиночной', careerCanPlayKind('cup') === solo,
          String(careerCanPlayKind('cup')) + ' против ' + String(solo));
    check('и причины нет', ccMpWhy() === null, ccMpWhy());

    // ---- 4. плитка команды говорит про связь ------------------------------
    CAREER.career.mp = {code:'ABC123', role:'a'};
    MP.state = 'lost';
    const tile = careerMpTileHTML();
    out.notes.tile = tile.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 150);
    check('на плитке видно, что связи нет', tile.indexOf(L().ccMpLost) >= 0, out.notes.tile);
    MP.state = 'live';
    check('и что она есть', careerMpTileHTML().indexOf(L().ccMpLive) >= 0,
          careerMpTileHTML().replace(/<[^>]+>/g, ' ').slice(0, 120));

    // ---- 5. «до свидания» по версии переводится в своё состояние ---------
    MP.state = 'live';
    MP.say({t:'bye', reason:'build'});
    check('чужая сборка ставит своё состояние', MP.state === 'old', String(MP.state));
    MP.state = 'live';
    MP.say({t:'bye', reason:'part'});
    check('а разрыв дуо — не поломка связи', MP.state !== 'old', String(MP.state));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mplink-'));
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
console.log('связь видно, и без неё карьера не запирается молча');
fs.rmSync(dir, { recursive: true, force: true });
