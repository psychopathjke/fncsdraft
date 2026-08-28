// Про клубы пишут клубы, а не Fortnite Competitive.
//
// Его слово, 25 августа, к скрину с галочкой «Fortnite Competitive · BIG
// продлевает контракт»: «фортнайт не должен ниче писать про орги».
//
// Новые записи уже приходят с автором (opt.by, см. ccOrgBy) — а вот в сейве,
// который играется с тех пор, лежат СТАРЫЕ записи без него, и они падали на
// карту CC_POST_BY, где эти ключи помечены 'press'. Имя клуба при этом никуда
// не девалось: оно стоит в аргументах строки, потому что строка его печатает.
//
//   node tools/check-career-org-posts.js
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
      career:{season:1, day:'2026-03-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  // Запись БЕЗ автора — ровно то, что лежит в старом сейве.
  const oldEntry = (k, args) => {
    seed();
    careerNews('flat', k, args || []);
    return ccPostAuthor(CAREER.career.news[0]);
  };
  try {
    seed();
    const pool = careerOrgPool();
    const org = pool[0] && pool[0].name;
    const other = pool[1] && pool[1].name;
    out.notes.org = org; out.notes.other = other;
    check('в сцене есть клубы', !!org && !!other, String(pool.length));

    // ---- старые записи о трансферах ---------------------------------------
    const cases = {
      ccNewsSigned:        [org, 5000],
      ccNewsSignedDuo:     [org, '@mate'],
      ccNewsSignedAcademy: [org, 3000],
      ccNewsReleased:      [org],
      ccNewsExtended:      [org, 6000],
      ccNewsPromotedRoster:[org, '6 000'],
      ccNewsRaise:         [org, '8 000'],
      // Уход: первым стоит клуб, ОТКУДА ушли, вторым — тот, кто подписал.
      // Постит подписавший, значит автор берётся из второго аргумента.
      ccNewsLeft:          [other, org]
    };
    out.notes.authors = {};
    Object.keys(cases).forEach(k => {
      const a = oldEntry(k, cases[k]);
      out.notes.authors[k] = a.name + (a.verified ? ' \\u2713' : '') + (a.you ? ' (you)' : '');
      check(k + ': пишет клуб, а не пресса', a.name === org, a.name);
      check(k + ': и с гербом', !!a.logo, String(a.logo));
      check(k + ': и не от лица игрока', !a.you);
    });

    // ---- новая запись, с автором ------------------------------------------
    // Она и раньше работала; здесь важно, что правка её не перебила.
    seed();
    careerNews('good', 'ccNewsExtended', [org, 6000], {by: ccOrgBy(org)});
    const withBy = ccPostAuthor(CAREER.career.news[0]);
    out.notes.withBy = withBy.name;
    check('запись со своим автором его и сохраняет', withBy.name === org, withBy.name);

    // ---- чужое имя в аргументе не превращается в клуб ----------------------
    // Аргумент приходит из сейва и может быть чем угодно. Клубом он считается,
    // только если такой клуб в сцене есть.
    const bogus = oldEntry('ccNewsExtended', ['Не Существующий Клуб', 6000]);
    out.notes.bogus = bogus.name + (bogus.you ? ' (you)' : '');
    check('выдуманное имя клубом не считается', bogus.name !== 'Не Существующий Клуб',
          bogus.name);
    const empty = oldEntry('ccNewsExtended', ['', 6000]);
    check('пустое имя тоже', empty.name !== '', empty.name);

    // ---- строки, которые пресса писать ДОЛЖНА ------------------------------
    // Правка не должна была отобрать у сцены то, что сцена и правда постит.
    seed();
    careerNews('good', 'ccNewsWinner', ['somebody']);
    const press = ccPostAuthor(CAREER.career.news[0]);
    out.notes.press = press.name;
    check('титул по-прежнему постит сцена', press.verified && !press.you, press.name);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsorgpost-'));
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
console.log('a club posts its own transfers, in every save');
fs.rmSync(dir, { recursive: true, force: true });
