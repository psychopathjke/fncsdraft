// Сила СВОЕЙ команды одна на двоих — при разной личной жизни.
//
// Его скрины, утро 28 августа (страница «123»): игра 4 из 6, у одного вопрос
// «что подобрал», у второго «ждём выбор напарника», — и уже РАЗНЫЕ таблицы:
// 172 очка и 28 элимов против 181 и 26. Расхождение до всякого выбора.
//
// careerYouTeam складывает силу так: buildTeam(cards) + careerForm() +
// careerChem(). Первое слагаемое ездит по проводу и сверено
// (check-mp-two-players). Два других — ЛИЧНЫЕ: форма, перегруз, машина в
// гараже (пол формы) и стаж дуо из СВОЕГО списка напарников. Локстеп мерился с
// form:0, grind:0 у обоих — то есть ровно тот случай, когда они совпадают.
//
// Здесь двое с нарочно разной жизнью (форма +3 против 0, перегруз, машина,
// стаж) собирают одну команду, каждый своим порядком кресел, и сила обязана
// совпасть до единицы.
//
//   node tools/check-mp-you-pow.js
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
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (nick, ovr, role, life) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:nick, age:(life.age||19), source:'rookie', country:(life.country||'de'), countryPing:(life.ping!=null?life.ping:15),
              closeRangeEdge:(life.close||0), livesIn:life.livesIn||null, region:'EU', ovr:ovr, role:role,
              attrs:ccRookieAttrs(ovr, role), ageEdge:(life.ageEdge||0), photo:null,
              handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:2,
              mp:{code:'ABC123', role: nick==='Alpha' ? 'a' : 'b'}}, life.career||{}),
      gear:life.gear||{own:[], conf:0},
      partners:life.partners||[]
    }));
    careerLoad();
  };
  try {
    CARD_MODE = true; squadSize = 2;
    // A: в форме, перегружен, с машиной, дуо со стажем. B: пустая жизнь.
    const lifeA={age:17, ageEdge:4, ping:15, close:6, country:'de', career:{form:3, grind:14}, gear:{own:['car2'], conf:1.0},
                 partners:[{handle:'Bravo', since:'2026-02-01', patience:80}]};
    const lifeB={age:25, ageEdge:0, ping:60, close:1, country:'br', livesIn:'rs', career:{form:0, grind:0}, gear:{own:[], conf:0}, partners:[]};
    seed('Alpha', 94, 'roleIGL', lifeA);
    const mineA = careerCard(), wireA = MP.card();
    out.notes.formA = careerForm();
    seed('Bravo', 88, 'roleFRG', lifeB);
    const mineB = careerCard(), wireB = MP.card();
    out.notes.formB = careerForm();

    // Так вечер собирает команду у каждого: [я, напарник] — своё кресло первым.
    seed('Alpha', 94, 'roleIGL', lifeA); MP.peer = wireB;
    const youA = careerYouTeam([mineA, wireB]);
    const chemA = careerChem();
    seed('Bravo', 88, 'roleFRG', lifeB); MP.peer = wireA;
    const youB = careerYouTeam([mineB, wireA]);
    const chemB = careerChem();
    out.notes.pow = {A:youA.pow, B:youB.pow};
    out.notes.chem = {A:chemA, B:chemB};
    out.notes.name = {A:youA.name, B:youB.name};
    check('сила своей команды одна на двоих', youA.pow === youB.pow,
          youA.pow + ' против ' + youB.pow);
    check('ближний бой один', (youA.closeEdge||0) === (youB.closeEdge||0),
          (youA.closeEdge||0) + ' против ' + (youB.closeEdge||0));

    // Контроль: в одиночной карьере форма по-прежнему своя и по-прежнему считается.
    seed('Alpha', 94, 'roleIGL', lifeA); delete CAREER.career.mp; MP.peer = null;
    const solo = careerYouTeam([mineA, wireB]);
    const bare = careerTeam([mineA, wireB], true).pow;
    check('в одиночной форма считается', solo.pow !== bare,
          'solo ' + solo.pow + ' vs bare ' + bare + ' (form ' + careerForm() + ')');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmppow-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('сила своей команды одна на двоих, какой бы ни была личная жизнь');
