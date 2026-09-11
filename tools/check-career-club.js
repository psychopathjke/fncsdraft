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
    /* РАСТОРЖЕНИЕ. Его правило 11.09: «если создаёшь, то должен расторгнуть с клубом
       контракт, если есть орга». Значит: неустойка в два оклада, клуб уходит из карьеры,
       и об этом пишут. */
    CAREER.org={name:'Old Club', salary:5000, tier:80, cut:0.1, since:1, paid:0};
    { const want=5000*CC_CLUB_BUYOUT;
      check('неустойка — два оклада', careerClubBuyout()===want, String(careerClubBuyout()));
      const keep=cr.balance; cr.balance=CC_CLUB_COST+want-1;
      check('на клуб с неустойкой не хватает — не основать', !careerClubFound('Too Poor'));
      cr.balance=keep; }
    const news0=(cr.news||[]).length;
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
    check('деньги списаны вместе с неустойкой', cr.balance === bal0 - CC_CLUB_COST - 5000*CC_CLUB_BUYOUT,
          bal0 + ' -> ' + cr.balance);
    check('старый клуб больше не мой', CAREER.org.name !== 'Old Club');
    check('об уходе написано', (cr.news||[]).length > news0);
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

    // ---- переговоры ---------------------------------------------------------
    /* Его слово 11.09: «потом можно писать игрокам, кому хочешь предлагать условия».
       Дуо держит свою цену: дал столько — идут, дал чуть меньше — торгуются, дал мало —
       отказ, и сегодня больше не говорят. */
    { const list = careerClubFree();
      const d = list.find(x => !careerClub().roster.some(r => r.id === x.id));
      check('есть с кем говорить', !!d);
      const low = careerClubOffer(d.id, Math.round(d.salary * 0.5));
      out.notes.talkLow = low;
      check('мало — отказ', low && low.state === 'no', JSON.stringify(low));
      check('после отказа сегодня не говорят',
            (careerClubOffer(d.id, d.salary) || {}).state === 'wait');
      careerClub().talks[d.id].day = '2000-01-01';            // назавтра разговор снова открыт
      const mid = careerClubOffer(d.id, Math.round(d.salary * 0.85));
      out.notes.talkMid = mid;
      check('чуть меньше — торгуются', mid && mid.state === 'ask', JSON.stringify(mid));
      check('названная цена не ниже настоящей', mid && mid.ask >= d.salary, JSON.stringify(mid));
      check('и не выше прежней', mid && mid.ask <= d.salary, JSON.stringify(mid));
      const yes = careerClubOffer(d.id, mid.ask);
      out.notes.talkYes = yes;
      check('дал столько — подписан', yes && yes.state === 'yes', JSON.stringify(yes));
      const row = careerClub().roster.find(r => r.id === d.id);
      check('в составе с той зарплатой, о которой договорились', row && row.salary === mid.ask,
            row && String(row.salary));
      check('поиск по нику находит', careerClubFree(d.who[0].slice(0, 3)).length > 0, d.who[0]); }

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
    const wages = club.roster.reduce((a, r) => a + r.salary, 0);
    const sponsor = CC_CLUB_SPONSOR * club.roster.length;
    careerClubMonth(1);
    out.notes.month = {before: before, after: club.cash, wages: wages, n: club.roster.length};
    check('за месяц ушли содержание и зарплаты, пришёл спонсор',
          club.cash === before + sponsor - CC_CLUB_KEEP - wages,
          before + ' -> ' + club.cash);

    // ---- нечем платить ------------------------------------------------------
    club.cash = 0; cr.balance = 0;
    const had = club.roster.length;
    careerClubMonth(1);
    out.notes.unpaid = {had: had, roster: club.roster.length, cash: club.cash};
    check('состав редеет, когда платить нечем', club.roster.length < had,
          had + ' -> ' + club.roster.length);
    for (let i = 0; i < 4 && club.roster.length; i++) careerClubMonth(1);
    check('без денег состав уходит весь', club.roster.length === 0, String(club.roster.length));
    check('касса не ушла в минус', club.cash >= 0, String(club.cash));

    // ---- выкуп, герб и касса ------------------------------------------------
    /* Его правила 11.09: «они разрывают контракт или мы выкупаем или предлагаем
       свободному агенту», «пусть копит клуб потом можно вывести себе». */
    { const all = careerClubFree('', true);
      const carded = all.find(d => d.org);
      out.notes.market = {всего: all.length, подКонтрактом: all.filter(d => d.org).length};
      check('под контрактом тоже видны', !!carded, String(all.length));
      if (carded) {
        check('у них стоят отступные', carded.buyout === carded.salary * CC_CLUB_BUYIN,
              String(carded.buyout));
        careerClub().cash = 0; cr.balance = 0;
        check('без денег на отступные сделки нет', !careerClubSign(carded.id, carded.salary));
        careerClub().cash = carded.buyout + carded.salary;
        const seats = careerClub().roster.length;
        check('с деньгами — подписан', careerClubSign(carded.id, carded.salary) || careerClub().roster.length > seats);
      }
      // Герб клуба переезжает на его людей в сцене карьеры.
      const who = (careerClub().roster[0] || {}).who || [];
      check('подписанный носит герб клуба', ccClubOf(who[0]) === careerClub().name, String(who[0]));
      const stamped = ccClubStamp([{handle: who[0]}]);
      check('метка ложится на карточку сцены', stamped[0].org === careerClub().name, JSON.stringify(stamped[0]));
      // Касса — в карман.
      careerClub().cash = 7000; cr.balance = 0;
      const got = careerClubCashOut(999999);
      out.notes.cashOut = {got: got, cash: careerClub().cash, balance: cr.balance};
      check('касса выведена вся', got === 7000 && careerClub().cash === 0, String(got));
      check('деньги в кармане', cr.balance === 7000, String(cr.balance));
      check('пустую кассу не вывести', careerClubCashOut(100) === 0); }

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
