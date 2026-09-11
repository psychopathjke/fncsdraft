// Своя организация: основать, содержать, подписать, получить долю, не заплатить.
//
// Его слова 11 сентября: «вот своя организация интересно», «создать организацию
// это же тоже денег стоит», «на поддержание». Значит и проверяется ровно это:
// деньги уходят при основании, уходят каждый месяц и уходят на зарплаты, а
// приходят с призовых состава и от спонсора. Не хватило — состав уходит.
//
//   node tools/check-career-club.js
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
      player:{nick:'Boss', age:22, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
              region:'EU', ovr:95, role:'roleIGL', attrs:ccRookieAttrs(95,'roleIGL'), ageEdge:0,
              photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-02', division:1, earnings:1500000, balance:1500000, reach:30000,
              tokens:[], log:[], news:[], size:2},
      gear:{own:[], conf:0}, partners:[]
    }));
    careerLoad();
    CARD_MODE = true; squadSize = 2;
    const cr = CAREER.career;

    // ---- основать -----------------------------------------------------------
    { const keep = cr.balance; cr.balance = CC_CLUB_COST - 1;
      check('без денег клуб не основать', !careerClubFound('NoCash'));
      check('и денег не тронул', cr.balance === CC_CLUB_COST - 1);
      cr.balance = keep; }
    const bal0 = cr.balance;
    check('пустое имя не проходит', !careerClubFound('   '));
    check('клуб основан', careerClubFound('  Boss Club  '));
    const club = careerClub();
    out.notes.club = club && {name: club.name, cash: club.cash};
    check('имя обрезано', club && club.name === 'Boss Club', club && club.name);
    check('деньги списаны', cr.balance === bal0 - CC_CLUB_COST, bal0 + ' -> ' + cr.balance);
    check('свой клуб стал клубом карьеры', CAREER.org && CAREER.org.own && CAREER.org.name === club.name);
    check('доля клуба с себя не берётся', careerOrgCut() === 0, String(careerOrgCut()));
    check('чужие предложения больше не приходят', careerOrgOffers().length === 0);
    check('второй раз не основать', !careerClubFound('Again'));

    // ---- подписать ----------------------------------------------------------
    const free = careerClubFree();
    out.notes.free = free.slice(0, 3).map(d => d.who.join('+') + ' ' + d.ovr + ' $' + d.salary);
    check('есть кого подписать', free.length > 0, String(free.length));
    const first = free[0];
    check('зарплата считается от рейтинга', first && first.salary > 0, first && String(first.salary));
    check('подписан', careerClubSign(first.id));
    check('в составе один', club.roster.length === 1);
    check('месяц вперёд ушёл из кассы', club.cash === -first.salary, String(club.cash));
    check('дважды одного не подписать', !careerClubSign(first.id));

    // ---- доля с призовых ----------------------------------------------------
    careerClubTake();                       // точка отсчёта
    const rows = careerMoney().rows;
    first.who.forEach(h => { rows[h] = rows[h] || {usd:0, events:0, yr:{}, fs:{}}; rows[h].usd += 10000; });
    const cash0 = club.cash;
    const got = careerClubTake();
    out.notes.take = {got: got, cash: club.cash};
    check('клуб взял свою долю', got === Math.round(20000 * CC_CLUB_CUT), String(got));
    check('касса выросла на долю', Math.round(club.cash - cash0) === got);
    check('повторный вечер без призовых ничего не даёт', careerClubTake() === 0);

    // ---- месяц --------------------------------------------------------------
    club.cash = 100000;
    const before = club.cash;
    careerClubMonth(1);
    const wages = first.salary, sponsor = CC_CLUB_SPONSOR * 1;
    out.notes.month = {before: before, after: club.cash, wages: wages};
    check('за месяц ушли содержание и зарплата, пришёл спонсор',
          club.cash === before + sponsor - CC_CLUB_KEEP - wages,
          before + ' -> ' + club.cash);

    // ---- нечем платить ------------------------------------------------------
    club.cash = 0; cr.balance = 0;
    careerClubMonth(1);
    out.notes.unpaid = {roster: club.roster.length, cash: club.cash};
    check('состав ушёл, когда платить нечем', club.roster.length === 0, String(club.roster.length));
    check('касса не ушла в минус', club.cash >= 0, String(club.cash));

    // ---- своя фотка вместо герба --------------------------------------------
    /* Его слово 11.09: «свою фотку лого типо». Саму загрузку делает браузер
       (FileReader и декодирование), а наше правило — потолок сейва и то, что герб
       после этого рисует картинку. Это и проверяется, без файла на диске. */
    { const cv=document.createElement('canvas'); cv.width=64; cv.height=64;
      const x=cv.getContext('2d'); x.fillStyle='#2ad18f'; x.fillRect(0,0,64,64);
      const small=cv.toDataURL('image/png');
      out.notes.logo={len: small.length, cap: CC_CLUB_LOGO_MAX};
      check('картинка размером с герб влезает в сейв', small.length<=CC_CLUB_LOGO_MAX, String(small.length));
      check('картинка легла', careerClubLogoSet(small));
      check('герб рисует картинку, а не буквы', careerClubCrest(48).indexOf('<img')===0,
            careerClubCrest(48).slice(0, 24));
      check('не картинку не берём', !careerClubLogoSet('нет'));
      check('слишком тяжёлую не берём', !careerClubLogoSet('data:image/png;base64,'+'A'.repeat(CC_CLUB_LOGO_MAX)));
      check('тяжёлая не затёрла прежнюю', (careerClub().logo||'').length===small.length);
      careerClub().logo=null;
      check('без картинки герб снова рисуется буквами', careerClubCrest(48).indexOf('<svg')===0); }

    // ---- плитка -------------------------------------------------------------
    const html = careerClubHTML();
    check('плитка рисуется', html.indexOf('Boss Club') >= 0 && html.indexOf('cc-club') >= 0);
    delete cr.club;
    check('без клуба плитка предлагает основать', careerClubHTML().indexOf('careerClubNew') >= 0);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccclub-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { const f=require('path').join(require('os').tmpdir(),'club-dom.html'); fs.writeFileSync(f, dom); console.error('проба не отработала, страница в '+f); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('свой клуб: стоит основать, стоит содержать, платит состав и уходит без зарплаты');
