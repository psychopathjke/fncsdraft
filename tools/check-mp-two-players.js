// Двое РАЗНЫХ игроков считают свою команду одинаково.
//
// Его вопрос, 26 августа: «за разных можно играть?». Играть-то можно — карточка
// у каждого своя, — но локстеп держится на том, что оба браузера собирают ОДНУ
// команду. А собирают они её из разного: у себя каждый берёт careerCard() —
// настоящую карточку своей карьеры, — а напарника получает ночной карточкой по
// проводу (MP.card). Если по проводу едет не всё, что читает сила, две стороны
// посчитают разные команды и вечер разъедется молча.
//
// Здесь это и меряется: два разных игрока (ник, рейтинг, роль, страна, регион),
// команда собирается глазами каждого, и сила обязана совпасть.
//
//   node tools/check-mp-two-players.js
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
  const seed = (nick, ovr, role, country, region) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:nick, age:19, source:'rookie', country:country, countryPing:15,
              closeRangeEdge:0, region:region, ovr:ovr, role:role,
              attrs:ccRookieAttrs(ovr, role), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:2},
      partners:[]
    }));
    careerLoad();
  };
  try {
    CARD_MODE = true; squadSize = 2;
    // Игрок A и игрок B — разные во всём, что видно на карточке.
    seed('Alpha', 94, 'roleIGL', 'de', 'EU');
    const mineA = careerCard(), wireA = MP.card();
    seed('Bravo', 88, 'roleFRG', 'br', 'EU');
    const mineB = careerCard(), wireB = MP.card();
    out.notes.карточки = {A:{ovr:attrsFor(mineA).ovr, role:attrsFor(mineA).roleKey},
                          B:{ovr:attrsFor(mineB).ovr, role:attrsFor(mineB).roleKey}};

    // Так команду видит каждый клиент: своя настоящая карточка плюс ночная
    // карточка напарника.
    const teamA = MP.teamOf(mineA, wireB), teamB = MP.teamOf(mineB, wireA);
    check('состав в одном порядке у обоих',
          teamA.map(c=>String(c.handle).toLowerCase()).join('+') ===
          teamB.map(c=>String(c.handle).toLowerCase()).join('+'),
          teamA.map(c=>c.handle).join('+') + ' / ' + teamB.map(c=>c.handle).join('+'));

    const powA = buildTeam(teamA), powB = buildTeam(teamB);
    out.notes.сила = {A:powA.pow, B:powB.pow,
                      ovrA:Math.round(powA.ovrAvg*10)/10, ovrB:Math.round(powB.ovrAvg*10)/10};
    check('сила команды одна и та же', powA.pow === powB.pow,
          powA.pow + ' против ' + powB.pow);
    check('и средний овер тот же', Math.abs(powA.ovrAvg - powB.ovrAvg) < 0.01,
          powA.ovrAvg + ' против ' + powB.ovrAvg);
    check('и роли те же', powA.roleBonus === powB.roleBonus,
          powA.roleBonus + ' против ' + powB.roleBonus);
    check('и ближний бой тот же', powA.closeEdge === powB.closeEdge,
          powA.closeEdge + ' против ' + powB.closeEdge);

    // Каждая карточка читается одинаково, с какой бы стороны ни пришла.
    check('карточка A одинакова у себя и по проводу',
          attrsFor(mineA).ovr === attrsFor(wireA).ovr &&
          attrsFor(mineA).roleKey === attrsFor(wireA).roleKey,
          attrsFor(mineA).ovr + '/' + attrsFor(mineA).roleKey + ' против ' +
          attrsFor(wireA).ovr + '/' + attrsFor(wireA).roleKey);
    check('карточка B одинакова у себя и по проводу',
          attrsFor(mineB).ovr === attrsFor(wireB).ovr &&
          attrsFor(mineB).roleKey === attrsFor(wireB).roleKey,
          attrsFor(mineB).ovr + '/' + attrsFor(mineB).roleKey + ' против ' +
          attrsFor(wireB).ovr + '/' + attrsFor(wireB).roleKey);

    /* И регион. Он ЛИЧНЫЙ (CAREER.player.region), а читает его пул, из которого
       строится лобби (ccPoolRegion), и сетка хитов Мейджора. Двое из разных
       регионов посчитали бы разные комнаты — это расхождение, которого не
       видно до самой таблицы. */
    seed('Alpha', 94, 'roleIGL', 'de', 'EU');
    CAREER.career.mp = {code:'ABC123', role:'a'};
    CAREER.career.region = 'EU';
    const regA = ccCareerRegion();
    seed('Bravo', 88, 'roleFRG', 'br', 'BR');
    CAREER.career.mp = {code:'ABC123', role:'b'};
    CAREER.career.region = 'EU';           // приезжает от сервера вместе с днём
    const regB = ccCareerRegion();
    out.notes.регион = {A:regA, B:regB, личныйB:CAREER.player.region};
    check('в команде регион один на двоих', regA === regB, regA + ' / ' + regB);
    check('и это регион команды, а не свой', regB === 'EU', regB);
    check('регион команды ездит по проводу', CC_TEAM_KEYS.indexOf('region') >= 0,
          CC_TEAM_KEYS.join(','));
    // А в одиночной карьере он снова свой.
    delete CAREER.career.mp;
    check('в одиночной регион личный', ccCareerRegion() === 'BR', ccCareerRegion());
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mptwo-'));
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
console.log('двое разных игроков считают свою команду одинаково');
fs.rmSync(dir, { recursive: true, force: true });
