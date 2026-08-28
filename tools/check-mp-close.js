// Вечер закрывают оба, а день двигает сервер.
//
// Каждый браузер считает вечер сам, поэтому в конце они сверяются: хеш таблицы
// уходит на сервер вместе со своим состоянием команды, и день трогается только
// когда пришло 'close'. Расхождение решает сервер — истиной становится версия,
// пришедшая первой; спорить бессмысленно, у игрока на экране всё равно должно
// оказаться то же, что у напарника.
//
// Одиночная карьера ничего этого не замечает: закрытие возвращает управление
// сразу, день двигается нажатием, как двигался.
//
//   node tools/check-mp-close.js
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
    seed('EU', 2);
    const t1 = [{name:'a', stagePts:100, wins:1, stageElims:10},
                {name:'b', stagePts:90,  wins:0, stageElims:8}];
    const t2 = JSON.parse(JSON.stringify(t1));
    check('одинаковые таблицы дают один хеш', ccTableHash(t1) === ccTableHash(t2));
    t2[1].stagePts = 91;
    check('разные — разный', ccTableHash(t1) !== ccTableHash(t2));
    check('хеш не зависит от имён игроков',
          ccTableHash([{name:'zzz', stagePts:100, wins:1, stageElims:10},
                       {name:'yyy', stagePts:90, wins:0, stageElims:8}]) === ccTableHash(t1));

    check('в одиночной карьере закрытие ничего не ждёт',
          (await ccMpClose(t1)) === undefined);

    CAREER.career.mp = {code:'ABC123', role:'a'};
    let sentHash = null, sentTeam = null, closeFn = null;
    MP.digest = function(h, t){ sentHash = h; sentTeam = t; };
    MP.on = function(k, fn){ if(k === 'close') closeFn = fn; };
    const p = ccMpClose(t1);
    await new Promise(r => setTimeout(r, 40));
    check('хеш отправлен', sentHash === ccTableHash(t1), String(sentHash));
    check('и состояние команды вместе с ним', sentTeam && sentTeam.day === CAREER.career.day);
    closeFn({t:'close', team:{day:'2026-02-09'}});
    await p;
    check('день пришёл от сервера', CAREER.career.day === '2026-02-09', CAREER.career.day);

    /* И вторая половина того же правила: пока сервер не закрыл вечер, день
       не двигается ничем другим. Иначе один клиент ушёл бы в завтра, а
       второй остался бы во вчера — расхождение, которое никакой хеш уже не
       поймает, потому что вечера будут разные. */
    CAREER.career.day = '2026-02-09';
    careerAdvanceTo('2026-03-01');
    check('нажатие день в командной карьере не двигает',
          CAREER.career.day === '2026-02-09', CAREER.career.day);
    delete CAREER.career.mp;
    careerAdvanceTo('2026-03-01');
    check('а в одиночной двигает как двигало',
          CAREER.career.day === '2026-03-01', CAREER.career.day);

    // Врезка стоит во всех раннерах — читается по исходнику.
    const src = document.documentElement.outerHTML;
    ['runCareerCup','runCareerMajor','runCareerSummit','runCareerGlobals','runCareerGclc',
     'runCareerReload','runCareerReloadChampionship','runCareerWeeklyFinal','runCareerEval',
     'runCareerVictory','runCareerSoloSeries'].forEach(fn => {
      const at = src.indexOf('async function ' + fn + '(');
      const end = src.indexOf('\\nasync function ', at + 10);
      const body = at < 0 ? '' : src.slice(at, end < 0 ? at + 40000 : end);
      check(fn + ' закрывает вечер', body.indexOf('ccMpClose(') >= 0,
            at < 0 ? 'функции нет' : 'нет вызова');
    });

    /* ---- закрытие вечера тоже не ждёт вечно ------------------------------
       Его отчёт, 28 августа: «опять после 6 игры все сломалось, зависло, а у
       другого таблица». Шестая игра последняя — значит вставало уже не на
       вопросе: вопросы кончились. Вставало здесь. Сервер закрывает вечер по
       двум хешам, и если второй не придёт (оборвалась связь, закрылась
       вкладка), клиент стоял насмерть с готовой таблицей и без кнопок. */
    seed('EU', 2);
    CAREER.career.mp = {code:'ABC123', role:'a'};
    if(typeof ccMpWaitReset==='function') ccMpWaitReset();
    MP.send = function(){};
    let closed = false;
    const waiting = ccMpClose([]).then(function(){ closed = true; });
    await new Promise(function(r){ setTimeout(r, 80); });
    check('пока сервер молчит — ждём', closed === false);
    // Связь оборвалась: ждать больше нечего.
    ccMpLinkLost();
    await Promise.race([waiting, new Promise(function(r){ setTimeout(r, 600); })]);
    check('обрыв связи выпускает из закрытия', closed === true);
    check('и сид вечера снят', CC_MP_RAND === null, String(CC_MP_RAND));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpclose-'));
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
console.log('вечер сверяют оба, а день двигает сервер');
fs.rmSync(dir, { recursive: true, force: true });
