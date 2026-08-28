// Париж — один турнир в три этапа, и выбывший в него не возвращается.
//
// Поле каждого этапа собиралось одним и тем же careerCupField, а careerSeed
// сеется календарной неделей — весь Париж (19-22 августа) лежит в одной. Все
// три дня из ростера доставалась одна и та же двадцатка, так что вылет в
// группе не значил ничего: в финале та же команда сидела на своём месте.
//
// Его игрок, 25 августа: «в финале лан турнира евц меня может контестить
// команда, которая прошлую стадию не прошла, а я специально им гриферил, чтоб
// они не квальнулись».
//
// Здесь проверяется сам отбор — ccRcField, — а не пятнадцать игр за ним:
// кто в лобби, решается до первой высадки.
//
//   node tools/check-career-rc-stages.js
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
              closeRangeEdge:0, region:'EU', ovr:92, role:'roleIGL',
              attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-08-19', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  try {
    seed();
    const cr = CAREER.career;
    const me = careerCard();
    // Напарник карьере тут не нужен: ccRcField читает состав только как список
    // занятых карточек, а проверяется состав ЛОББИ.
    const drafted = [me];
    const world = Object.assign({}, cr, {division:1});
    const seatsOf = list => list.map(ccSeatKey);

    // ---- групповой этап: та же двадцатка, что и была ----------------------
    const A = ccRcField(cr, world, drafted, 'group', CC_RC_GROUP.teams);
    out.notes.group = A.length;
    check('групповой этап садит полное лобби',
          A.length === CC_RC_GROUP.teams - 1, String(A.length));
    // Бросок обязан повторяться: на нём держится опознание между этапами.
    check('и повторяется тем же самым',
          seatsOf(ccRcField(cr, world, drafted, 'group', CC_RC_GROUP.teams))
            .join('|') === seatsOf(A).join('|'));

    // ---- игрок прошёл группу седьмым --------------------------------------
    // Топ-7 — в финал, 8-17 — на сёрвайвл, 18-20 домой. Игрок седьмой, значит
    // из лобби прямых квалификантов кроме него шестеро.
    const gk = seatsOf(A);
    cr.rc = {got:'group', ticket:true, dropped:false,
             seats:{survival: gk.slice(6, 16), final: gk.slice(0, 6)}};
    const dead = gk.slice(16);            // те, кого лобби выбило совсем
    out.notes.dead = dead.length;

    const S = ccRcField(cr, world, drafted, 'survival', CC_RC_SURV.teams);
    const sSeats = seatsOf(S);
    out.notes.surv = S.length;
    check('сёрвайвл — полное лобби', S.length === CC_RC_SURV.teams - 1, String(S.length));
    check('на сёрвайвле нет никого из выбывших в группе',
          !dead.some(k => sSeats.indexOf(k) >= 0),
          dead.filter(k => sSeats.indexOf(k) >= 0).join(', '));
    check('и нет никого, кто уже прошёл в финал напрямую',
          !gk.slice(0, 6).some(k => sSeats.indexOf(k) >= 0),
          gk.slice(0, 6).filter(k => sSeats.indexOf(k) >= 0).join(', '));
    check('те, кто упал на сёрвайвл, на нём и играют',
          gk.slice(6, 16).every(k => sSeats.indexOf(k) >= 0),
          gk.slice(6, 16).filter(k => sSeats.indexOf(k) < 0).join(', '));
    out.notes.survNew = sSeats.filter(k => gk.indexOf(k) < 0).length;
    check('остальные места — приезжие из других групп',
          out.notes.survNew === (CC_RC_SURV.teams - 1) - 10, String(out.notes.survNew));

    // ---- сёрвайвл прошли шестеро -----------------------------------------
    const sixth = sSeats.slice(0, 6);
    const burned = sSeats.slice(6);       // не прошли сёрвайвл — домой
    cr.rc = {got:'survival', ticket:true, dropped:false,
             seats:{survival:[], final: gk.slice(0, 6).concat(sixth)}};
    const F = ccRcField(cr, world, drafted, 'final', CC_RC_FINAL.teams);
    const fSeats = seatsOf(F);
    out.notes.final = F.length;
    check('финал — полное лобби', F.length === CC_RC_FINAL.teams - 1, String(F.length));
    check('в финале нет никого, кто вылетел в группе',
          !dead.some(k => fSeats.indexOf(k) >= 0),
          dead.filter(k => fSeats.indexOf(k) >= 0).join(', '));
    check('и никого, кто не прошёл сёрвайвл',
          !burned.some(k => fSeats.indexOf(k) >= 0),
          burned.filter(k => fSeats.indexOf(k) >= 0).join(', '));
    check('прямые квалификанты группы в финале',
          gk.slice(0, 6).every(k => fSeats.indexOf(k) >= 0),
          gk.slice(0, 6).filter(k => fSeats.indexOf(k) < 0).join(', '));
    check('и прошедшие сёрвайвл тоже',
          sixth.every(k => fSeats.indexOf(k) >= 0),
          sixth.filter(k => fSeats.indexOf(k) < 0).join(', '));
    out.notes.finalNew = fSeats.filter(k => gk.indexOf(k) < 0 && sSeats.indexOf(k) < 0).length;
    check('остаток финала — приезжие из других групп',
          out.notes.finalNew === (CC_RC_FINAL.teams - 1) - 12, String(out.notes.finalNew));
    // Никто не садится дважды.
    check('в лобби нет одной команды дважды',
          new Set(fSeats).size === fSeats.length,
          fSeats.length + ' seats, ' + new Set(fSeats).size + ' unique');

    // ---- сейв, написанный до правки ---------------------------------------
    // Списка нет — этап играется как играл, а не падает и не садит пустое лобби.
    cr.rc = {got:'group', ticket:true, dropped:false};
    const old = ccRcField(cr, world, drafted, 'final', CC_RC_FINAL.teams);
    out.notes.oldSave = old.length;
    check('старый сейв садит полное лобби',
          old.length === CC_RC_FINAL.teams - 1, String(old.length));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsrc-'));
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
console.log('a stage of Paris seats the teams that earned it');
fs.rmSync(dir, { recursive: true, force: true });
