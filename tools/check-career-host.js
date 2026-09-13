// Своя кастомка: кто может, что стоит, кому платит и что оставляет после себя.
//
// Его игрок, 13 сентября: «было бы интересно сделать организацию собственных
// турниров/кастомок». Кнопка дня рядом со стримом: фонд с баланса, лобби из
// людей региона, победители на доске денег, пост в ленте от себя, охват растёт.
//
//   node tools/check-career-host.js
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
      player:{nick:'Host', age:21, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
              region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0,
              photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-04', division:1, earnings:0, balance:2000, reach:0,
              tokens:[], log:[], news:[], size:2},
      gear:{own:[], conf:0}, partners:[]
    }));
    careerLoad();
    const cr = CAREER.career;

    // ---- кто может ----------------------------------------------------------
    check('без аудитории, клуба и PR — нельзя', ccHostWhy() === 'reach', String(ccHostWhy()));
    const act = ccActById('host');
    check('кнопка дня есть', !!act && act.host);
    check('без права день не тратится', careerDoAct('host') === null);
    check('и день не закрыт', !careerDayClosed());
    cr.reach = CC_HOST_REACH;
    check('с аудиторией — можно', ccHostWhy() === null, String(ccHostWhy()));
    cr.balance = ccHostPot() - 1;
    check('без фонда — нельзя', ccHostWhy() === 'cash', String(ccHostWhy()));
    cr.balance = 2000;
    // Ставка растёт с каналом, а не выбирается.
    check('ставка от канала: 100 → 250 → 500',
          (function(){ const r = cr.reach; cr.reach = 1000; const a = ccHostPerWin();
            cr.reach = 30000; const b = ccHostPerWin(); cr.reach = 200000; const c = ccHostPerWin();
            cr.reach = r; return a === 100 && b === 250 && c === 500; })());
    // Панель дня рисует кнопку со ставкой и фондом.
    const panel = careerDayPanelHTML(null);
    check('кнопка на панели дня', panel.indexOf("careerPickDay('host')") >= 0);
    check('со ставкой и фондом', panel.indexOf(L().ccHostLine(ccNum(ccHostPerWin()), ccNum(ccHostPot()))) >= 0);

    // ---- лобби ----------------------------------------------------------------
    const field = ccHostField();
    out.notes.field = field.slice(0, 5).map(c => c.handle + ':' + Math.round(c.ovr));
    check('лобби на 49 человек', field.length === 49, String(field.length));
    check('в лобби нет своих', !field.some(c => ccMyPeople().has(hKey(c))));
    check('лобби — рядом по рейтингу', field.every(c => Math.abs(c.ovr - 90) <= 12),
          JSON.stringify(field.map(c => Math.round(c.ovr)).sort((a, b) => a - b).slice(0, 3)));

    // ---- вечер ----------------------------------------------------------------
    const bal0 = cr.balance, reach0 = careerReach(), news0 = (cr.news || []).length, energy0 = careerEnergy();
    const money0 = Object.keys(careerMoney().rows).length;
    const r = careerDoAct('host');
    check('вечер сыгран', !!r);
    const last = cr.hostLast;
    out.notes.last = last;
    check('отчёт вечера записан на сегодня', last && last.day === careerToday());
    const myWins = last ? last.a[0] : 0;
    const per = ccHostPerWin(), pot = ccHostPot();
    check('фонд ушёл с баланса, свои победы вернулись',
          cr.balance === bal0 - pot + myWins * per, bal0 + ' -> ' + cr.balance + ' (побед ' + myWins + ')');
    check('энергия потрачена', careerEnergy() === energy0 - act.energy, energy0 + ' -> ' + careerEnergy());
    check('день закрыт целиком', careerDayClosed());
    check('охват вырос', careerReach() > reach0, reach0 + ' -> ' + careerReach());
    const post = (cr.news || []).find(n => n.k === 'ccPostHosted');
    check('пост в ленте', !!post);
    check('пост — свой', post && ccPostAuthor(post).you);
    check('в ленте он читается', post && careerNewsHTML(3).indexOf('$' + per) >= 0);
    // Победители — на доске денег, кроме тех вечеров, где все пять забрал сам.
    if (myWins < CC_CUSTOM_GAMES)
      check('победители попали на доску денег', Object.keys(careerMoney().rows).length > money0);
    // Отчёт на панели дня.
    check('отчёт на панели дня', careerDayPanelHTML(null).indexOf(L().ccHostReport.apply(null, last.a)) >= 0);
    // Второй раз в тот же день не провести.
    check('второй раз в день нельзя', careerDoAct('host') === null);
    // Свой клуб открывает кнопку и без аудитории.
    cr.reach = 0; delete cr.hostLast; cr.did = {};
    check('без клуба и аудитории снова нельзя', ccHostWhy() === 'reach');
    cr.club = {name: 'Boss Club', since: careerToday(), cash: 0, roster: [], paid: 0, got: 0};
    check('свой клуб даёт право', ccHostWhy() === null, String(ccHostWhy()));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cchost-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { const f = path.join(os.tmpdir(), 'host-dom.html'); fs.writeFileSync(f, dom); console.error('проба не отработала, страница в ' + f); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('своя кастомка: право, фонд, лобби, доска, пост и отчёт на месте');
