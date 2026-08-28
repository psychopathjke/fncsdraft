// Ночная карточка и состав, который обе стороны собирают одинаково.
//
// Карточка — не украшение, а условие сходимости: если мой браузер считает нашу
// команду сильнее, чем его, вечер разъедется на первой же игре. Поэтому в ней
// ровно то, что двигает силу сегодня, и ничего личного; а состав из двух
// карточек складывается в порядке, который не зависит от того, кто спрашивает.
//
// Вторая половина проверки — про то, что в командной карьере напарник берётся
// из ЛОББИ, а не из сейва: в сейве лежит бот с одиночных времён.
//
//   node tools/check-mp-card.js
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
    // Ночная карточка — не украшение, а условие сходимости: если мой браузер
    // считает нашу команду сильнее, чем его, вечер разъедется.
    seed('EU', 2);
    const mine = MP.card();
    out.notes.keys = Object.keys(mine).sort();
    /* Контракт карточки — не список красивых имён, а то, что читает симуляция.
       До 26 августа здесь стояли ovr, role, attrs — имена, которых
       attrsFor не знает вовсе, и напарник приезжал сорокапятым фраггером, кем
       бы он ни был (замер: tools/check-mp-two-players.js). Поэтому проверяются
       те поля, по которым карточку читают, и сразу — что её читают правильно. */
    ['handle','nat','region','rating','_targetOvr','_attrs','_roleKey',
     '_ageEdge','_pingEdge','org','form','tired','sick','camp','gear']
      .forEach(k => check('в карточке есть ' + k, mine[k] !== undefined, JSON.stringify(mine)));
    check('шесть статов', mine._attrs && Object.keys(mine._attrs).length >= 6,
          JSON.stringify(mine._attrs));
    const real = careerCard();
    check('по проводу карточка читается так же, как своя',
          attrsFor(mine).ovr === attrsFor(real).ovr &&
          attrsFor(mine).roleKey === attrsFor(real).roleKey,
          attrsFor(mine).ovr + '/' + attrsFor(mine).roleKey + ' против ' +
          attrsFor(real).ovr + '/' + attrsFor(real).roleKey);
    /* И РИСУЕТСЯ. Именно на этом всё и упало у него в момент входа второго:
       «Cannot read properties of undefined (reading 'replace')» — карточку
       напарника рисует общий код, а у собранной вручную не было поля event.
       Считать и рисовать её должен один и тот же код, что и свою. */
    ['event','tier','rating','region','handle'].forEach(k =>
      check('карточка везёт поле ' + k, mine[k] !== undefined, JSON.stringify(mine[k])));
    let drew = null;
    try { drew = futCardHTML(mine, {}); } catch(e) { drew = 'БРОСИЛО: ' + (e && e.message); }
    check('карточка напарника рисуется без падения',
          typeof drew === 'string' && drew.indexOf('БРОСИЛО') < 0, String(drew).slice(0, 120));
    check('и на ней его ник', String(drew).indexOf(mine.handle) >= 0,
          String(drew).slice(0, 120));
    // Личного в ней нет: деньги напарника на мой расчёт не влияют и ему не видны.
    ['balance','earnings','log','dms','flat'].forEach(k =>
      check('личное поле ' + k + ' не уехало', mine[k] === undefined, String(mine[k])));

    // Обе стороны собирают ОДИН И ТОТ ЖЕ состав из двух карточек, в одном порядке.
    const a = Object.assign({}, mine, {handle:'aaa'});
    const b = Object.assign({}, mine, {handle:'bbb'});
    const t1 = MP.teamOf(a, b).map(c => c.handle).join('+');
    const t2 = MP.teamOf(b, a).map(c => c.handle).join('+');
    out.notes.order = [t1, t2];
    check('порядок состава не зависит от того, кто спрашивает', t1 === t2, t1 + ' / ' + t2);

    // В командной карьере напарник — из лобби, а не из сейва.
    CAREER.career.mp = {code:'ABC123', role:'a'};
    /* Запись напарника — с вложенной карточкой, как у выдуманного соседа:
       ccMateCardOf ищет по нику в ростере, и запись с ником, которого в мире
       нет, вернула бы null — то есть проверка мерила бы пустоту, а не подмену. */
    CAREER.partners = [{handle:'bot-from-save',
                        card:{handle:'bot-from-save', nat:'de', region:'EU',
                              rating:80, role:'roleFRG'}}];
    MP.peer = {handle:'howly', nat:'ru', age:20, ovr:91, role:'roleFRG', attrs:{}, org:null,
               form:0, tired:0, sick:false, camp:null, gear:[]};
    check('карточка напарника вообще ставится', MP.peer && MP.peer.handle === 'howly',
          JSON.stringify(MP.peer));
    const mates = careerMates();
    check('в составе один напарник', mates.length === 1, String(mates.length));
    check('и это человек из лобби', mates[0] && mates[0].handle === 'howly',
          mates[0] && mates[0].handle);
    check('бот из сейва не подставился', !mates.some(m => m && m.handle === 'bot-from-save'));
    check('карточка первого кресла — тот же человек',
          (careerPartnerCard() || {}).handle === 'howly',
          JSON.stringify(careerPartnerCard()));
    // Одиночная — как была.
    delete CAREER.career.mp;
    check('без лобби напарник снова из сейва',
          (careerMates()[0] || {}).handle === 'bot-from-save',
          JSON.stringify(careerMates()[0]));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpcard-'));
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
console.log('карточка одна на обе стороны, и напарник в команде — живой');
fs.rmSync(dir, { recursive: true, force: true });
