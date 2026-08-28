// Саммит — мировой турнир, а не домашний.
//
// Жалоба его игрока, 26 августа: «if you qual summit in major 1 oce there is
// like 15 oce teams and 0 eu teams in all of summit». Замер
// (tools/probe-lan-regions.js) показал ровно это: у карьеры из Океании в поле
// 45 карточек OCE и ОДНА европейская, у карьеры из Северной Америки — 69 NAC и
// ни одной EU.
//
// Причина: контингент, который карьера строит из своего пула, садился в
// ЕВРОПЕЙСКУЮ квоту (20 в основную сетку и 8 во Второй шанс), а Европа своих
// мест не получала вовсе. Для европейской карьеры это выглядело правильно и
// потому дожило до Океании.
//
// Здесь проверяется правило: своя квота — своего региона, все остальные
// регионы приезжают со своих досок, включая Европу. И порог места на Саммит
// считается по своим числам, а не по европейским.
//
//   node tools/check-career-summit-regions.js
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
  const seed = (region, place) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'LanProbe', age:20, source:'rookie', country:region==='EU'?'de':'au',
              countryPing:15, closeRangeEdge:0, region:region, ovr:95, role:'roleIGL',
              attrs:ccRookieAttrs(95,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-20', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    if(place){
      CAREER.career.log=[{season:1, day:'2026-04-20', kind:'major', stage:'final',
                          place:place, of:50}];
    }
    skipAnimation=true; CC_SKIP_RUN=true;
    drafted=[careerCard()]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
  };
  // Команда числится за регионом своей первой карточки.
  const byRegion = (field) => {
    const by={};
    field.forEach(t=>{
      const c=(t.squad||[])[0];
      const r=(c && (c.region || (typeof regionForNatOrUnknown==='function'
                                  ? regionForNatOrUnknown(c.nat) : null))) || '?';
      by[r]=(by[r]||0)+1;
    });
    return by;
  };
  const fieldFor = (region) => {
    seed(region);
    const me=careerCard();
    const you=careerYouTeam([me]); you.isYou=true; you.name='you';
    return byRegion(careerSummitField('upper', you, [me]));
  };
  try {
    const eu=fieldFor('EU');
    out.notes.изЕвропы=eu;
    check('у европейской карьеры Европа — самая большая делегация',
          eu.EU >= Math.max.apply(null, Object.values(eu)), JSON.stringify(eu));

    const oce=fieldFor('OCE');
    out.notes.изОкеании=oce;
    check('у океанийской карьеры Европа НЕ пропала',
          (oce.EU||0) >= ccTeams(SUMMIT_SLOTS.EU) - 2,
          'EU=' + (oce.EU||0) + ' при квоте ' + ccTeams(SUMMIT_SLOTS.EU));
    check('и Океания сидит по своей квоте, а не по европейской',
          (oce.OCE||0) <= ccTeams(SUMMIT_SLOTS.OCE) + ccTeams(SUMMIT_SCQ_SLOTS.OCE) + 2,
          'OCE=' + (oce.OCE||0) + ' при квоте ' +
          (ccTeams(SUMMIT_SLOTS.OCE)+ccTeams(SUMMIT_SCQ_SLOTS.OCE)));

    const nac=fieldFor('NAC');
    out.notes.изАмерики=nac;
    check('у американской карьеры Европа тоже на месте',
          (nac.EU||0) >= ccTeams(SUMMIT_SLOTS.EU) - 2, 'EU=' + (nac.EU||0));
    check('и все семь регионов представлены',
          Object.keys(SUMMIT_SLOTS).every(r => (nac[r]||0) > 0),
          JSON.stringify(nac));

    /* И порог места: место в гранд-финале своего Мейджора даёт место на Саммит
       по квоте СВОЕГО региона. Океании Epic даёт три и два, а не двадцать и
       восемь — четвёртое место там не проходит. */
    seed('OCE', 4);
    out.notes.океанияЧетвёртое=ccSummitSeat();
    check('в Океании четвёртое место на Саммит не проходит',
          ccSummitSeat() !== 'main', String(ccSummitSeat()));
    seed('OCE', 2);
    check('а второе — проходит', ccSummitSeat() === 'main', String(ccSummitSeat()));
    seed('EU', 4);
    check('в Европе четвёртое по-прежнему проходит', ccSummitSeat() === 'main',
          String(ccSummitSeat()));
    seed('EU', 24);
    check('и двадцать четвёртое — во Второй шанс', ccSummitSeat() === 'scq',
          String(ccSummitSeat()));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'summreg-'));
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
console.log('на Саммите все семь регионов, и каждый по своей квоте');
fs.rmSync(dir, { recursive: true, force: true });
