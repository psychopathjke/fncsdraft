// Свой клуб не расторгает контракт с хозяином.
//
// Его игрок MarkeL, 13 сентября: «ты как бы ушёл из клуба потому что он не
// выполнил цели, то есть твой клуб, но он есть. И после этого, когда ты
// пытаешься найти новый клуб, тебе никто не пишет». Стык года читал «цели нет»
// как «цель провалена»: CAREER.org пропадал, cr.club оставался, и careerOrgOffers
// из-за него молчал. Здесь: стык года, «клуб закрывает состав», премии, задача
// месяца и события про чужой клуб — всё обходит свой; сейв с дырой чинится.
//
//   node tools/check-career-own-club.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Boss', age:22, source:'rookie', country:'mx', countryPing:15, closeRangeEdge:0,
              region:'NAC', ovr:95, role:'roleIGL', attrs:ccRookieAttrs(95,'roleIGL'), ageEdge:0,
              photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-02', division:1, earnings:1500000, balance:1500000, reach:30000,
              tokens:[], log:[], news:[], size:2},
      gear:{own:[], conf:0}, partners:[]
    }));
    careerLoad();
    CARD_MODE = true; squadSize = 2;
    const cr = CAREER.career;
    check('клуб основан', careerClubFound('Boss Club'));
    check('свой клуб стал клубом карьеры', CAREER.org && CAREER.org.own);

    // ---- стык года: своего клуба не теряют ---------------------------------
    // Задачи у своего клуба нет, значит careerOrgGoalMet честно отвечает «нет» —
    // и это не провал сезона.
    check('цель своего клуба не «выполнена»', !careerOrgGoalMet());
    const news0 = (cr.news || []).length;
    careerOrgSeasonEnd();
    check('после стыка года клуб на месте', CAREER.org && CAREER.org.own && CAREER.org.name === 'Boss Club',
          JSON.stringify(CAREER.org));
    check('клуб не «расторгал контракт»',
          !(cr.news || []).slice(0, (cr.news || []).length - news0).some(n => n.k === 'ccNewsReleased'));

    // ---- «клуб закрывает состав» и события про чужой клуб ------------------
    cr.told = {};
    let quit = false;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1)) if (careerOrgQuitDue(d)) { quit = true; break; }
    check('свой клуб состав не закрывает', !quit);
    const late = CC_DAY_EVENTS.find(e => e.id === 'orgLate'), leak = CC_DAY_EVENTS.find(e => e.id === 'leak');
    check('«клуб задержал зарплату» — не про свой', late && !late.when());
    check('«слив» — не про свой', leak && !leak.when());
    // Уход по развилке и закрытие состава — тоже не про свой клуб.
    careerDayEvent('orgLate', 'leave');
    check('уйти из своего клуба по развилке нельзя', CAREER.org && CAREER.org.own);

    // ---- деньги: свой клуб хозяину не платит --------------------------------
    check('премии от своего клуба нет', careerOrgBonus(CAREER.org) === 0, String(careerOrgBonus(CAREER.org)));
    check('задачи месяца у своего клуба нет', careerMonthGoal() === null);
    check('чужие предложения при своём клубе не приходят', careerOrgOffers().length === 0);

    // ---- сейв с дырой: CAREER.org потерян, cr.club есть ----------------------
    CAREER.org = null;
    check('плитка без org говорит «нет клуба»', careerOrgTileHTML().indexOf('Boss Club') < 0);
    careerMigrateOwnClub();
    check('миграция вернула свой клуб', CAREER.org && CAREER.org.own && CAREER.org.name === 'Boss Club',
          JSON.stringify(CAREER.org));
    check('плитка снова показывает свой клуб', careerOrgTileHTML().indexOf('Boss Club') >= 0);
    // Чужой контракт миграция не трогает.
    delete cr.club;
    CAREER.org = {name:'Other', salary:1000, tier:80, cut:0.1, since:1, paid:0};
    careerMigrateOwnClub();
    check('чужой контракт миграция не трогает', CAREER.org.name === 'Other' && !CAREER.org.own);
    // И без клуба ничего не выдумывает.
    CAREER.org = null;
    careerMigrateOwnClub();
    check('без клуба org не выдумывается', CAREER.org === null);

    // ---- закрыть клуб: дорога обратно к чужим предложениям ----------------------
    cr.club = {name: 'Boss Club', since: careerToday(), cash: 1500, roster: [{id: 'x', who: ['A', 'B'], salary: 100}], paid: 0, got: 0};
    careerMigrateOwnClub();
    check('плитка клуба зовёт закрыть', careerClubHTML().indexOf('careerClubCloseAsk') >= 0);
    check('при своём клубе чужие предложения молчат', careerOrgOffers().length === 0);
    const bal = cr.balance;
    check('клуб закрыт', careerClubClose());
    check('касса вернулась на баланс', cr.balance === bal + 1500, bal + ' -> ' + cr.balance);
    check('клуба больше нет', !careerClub() && CAREER.org === null);
    check('о закрытии написано клубом', (cr.news || []).some(n => n.k === 'ccNewsClubClosed'));
    check('скаутинг снова открыт', !CAREER.scoutOff);
    check('второй раз закрывать нечего', !careerClubClose());
    out.notes.ok = true;
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccownclub-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { const f = path.join(os.tmpdir(), 'ownclub-dom.html'); fs.writeFileSync(f, dom); console.error('проба не отработала, страница в ' + f); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('свой клуб: стык года, закрытие состава, премии и события его не трогают; сейв с дырой починен');
