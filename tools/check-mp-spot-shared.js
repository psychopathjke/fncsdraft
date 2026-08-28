// Метка на карте — общая, и она доезжает сразу.
//
// Его отчёт, 26 августа, двумя снимками: у одного «дома на картах 3/3», у
// второго «0/3». Причин две, и обе настоящие.
//
//   1. Метки лежали в личной половине сейва. А дом не может быть личным:
//      команда садится в ОДНУ коробку, дом решает, в какую, и аура на нём —
//      это то, что комната знает про эту команду. Разные метки у двоих — это
//      разные комнаты, то есть разъехавшийся вечер, а не только пустая плитка.
//   2. Даже став общими, они бы не приехали вовремя: клиент слал состояние на
//      каждое сохранение, а сервер сообщение {t:'team'} не разбирал вовсе, и
//      командное доезжало только при входе и в конце вечера.
//
// Здесь проверяется всё вместе: метка попадает в командное состояние, приход
// чужого состояния виден сразу и не уезжает обратно кольцом.
//
//   node tools/check-mp-spot-shared.js
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
    // ---- метка едет в командном состоянии --------------------------------
    seed();
    CAREER.career.mp = {code:'ABC123', role:'a'};
    useLandingSet(careerBrSet());
    const set = ACTIVE_LANDING_SET;
    check('метка командная по списку полей', CC_TEAM_KEYS.indexOf('spots') >= 0,
          CC_TEAM_KEYS.join(','));
    careerSpotSet(3, set);
    check('метка поставлена', careerSpotList(set).length === 1,
          JSON.stringify(careerSpots()));
    const snap = ccTeamState();
    out.notes.снимок = snap.spots ? Object.keys(snap.spots) : null;
    check('и уехала в снимок команды', !!(snap.spots && snap.spots[careerSpotKey(set)]),
          JSON.stringify(snap.spots));

    // ---- и отправляется напарнику при сохранении -------------------------
    let pushed = null;
    MP.push = function(t){ pushed = t; };
    careerSpotClear(set);
    careerSpotSet(5, set);
    check('сохранение отправляет состояние напарнику', !!pushed && !!pushed.spots,
          JSON.stringify(pushed && Object.keys(pushed || {})));

    // ---- чужая метка появляется у меня сразу -----------------------------
    seed();
    CAREER.career.mp = {code:'ABC123', role:'b'};
    useLandingSet(careerBrSet());
    check('у второго меток нет', careerSpotList(ACTIVE_LANDING_SET).length === 0);
    pushed = null;
    MP.say({t:'team', team:{day:'2026-07-24', spots:{[careerSpotKey(ACTIVE_LANDING_SET)]:
             [{i:5, aura:2, won:0, day:'2026-07-24'}]}}});
    const mine = careerSpotList(ACTIVE_LANDING_SET);
    out.notes.после = mine.map(s => s && s.i);
    check('чужая метка появилась сразу', mine.length === 1 && mine[0].i === 5,
          JSON.stringify(mine));
    check('и аура вместе с ней', mine[0] && mine[0].aura === 2, JSON.stringify(mine[0]));
    check('и она НЕ уехала обратно кольцом', pushed === null, JSON.stringify(pushed));

    // ---- и записалась к себе, а не только в память -----------------------
    careerLoad();
    check('приехавшая метка сохранена', careerSpotList(ACTIVE_LANDING_SET).length === 1,
          JSON.stringify(careerSpots()));

    // ---- одиночная карьера ничего этого не делает ------------------------
    seed();
    useLandingSet(careerBrSet());
    pushed = null;
    careerSpotSet(2, ACTIVE_LANDING_SET);
    check('в одиночной карьере метка никуда не отправляется', pushed === null);
    check('но ставится как ставилась', careerSpotList(ACTIVE_LANDING_SET).length === 1);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpspot-'));
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
console.log('метка команды одна на двоих и показывается сразу');
fs.rmSync(dir, { recursive: true, force: true });
