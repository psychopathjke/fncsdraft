// Antwerp, and the three doors into it.
//
// The Global Championship is what every road in this mode leads to, and the
// career year used to end on 23 August — a month before the flight. A career
// could take a seat three different ways and never fly.
//
// This holds the doors (Summit top 15, Major 2 Final top 9, Last Chance top 3),
// the room (50 duos, 12 games over the two days, one cumulative leaderboard) and
// the purse (GC2026_PRIZES: $400,000 at the top of $2,000,000, all fifty paid).
//
//   node tools/check-career-globals.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
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
  // A final asks the player where to land. A harness is the player: answer it
  // the moment a picker appears, always the first zone, so the run is the same
  // every time. Without this a probe waits forever on a click nobody makes.
  setInterval(function(){
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    // ---- the year now reaches it ----------------------------------------
    check('the career year runs to Antwerp', CC_YEAR_TO >= '2026-09-27', CC_YEAR_TO);
    const days = careerYearDays();
    const on = [];
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
      if ((days.get(d)||[]).some(e => e.kind === 'globals')) on.push(d);
    out.notes.days = on;
    check('and it is the two days Liquipedia prints',
          on.join(',') === '2026-09-26,2026-09-27', on.join(','));

    // ---- the doors -------------------------------------------------------
    // Each seed writes one history row and asks whether it is a seat.
    const seed = rows => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1,
        player:{nick:'Probe', age:17, source:'rookie', country:'de', countryPing:15,
                closeRangeEdge:0, region:'EU', ovr:92, role:'roleIGL',
                attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0, photo:null,
                handle:null, cardRegion:null, nat:null},
        career:{season:1, day:'2026-09-26', division:1, earnings:0, balance:0,
                reach:10000, tokens:[], log:rows},
        partner:null
      }));
      careerLoad();
    };
    const row = (day, kind, stage, place) =>
      ({season:1, day:day, div:1, place:place, of:50, kind:kind, stage:stage,
        passed:true, prize:0});
    const seatVia = () => { const s = ccGlobalsSeat(); return s ? s.via : null; };

    seed([]);
    check('a career that won nothing stays home', seatVia() === null);
    check('and the day is not playable', careerCanPlayKind('globals') === false);

    seed([row('2026-05-31','summit','final', 15)]);
    check('15th at the Summit is the last seat it hands out', seatVia() === 'summit');
    seed([row('2026-05-31','summit','final', 16)]);
    check('16th is not', seatVia() === null);

    // Major 2's Final, told from Major 1's by the day it was played.
    seed([row('2026-08-01','major','final', 9)]);
    check('9th in the Major 2 Final is Europe\\u2019s last seat', seatVia() === 'major2');
    seed([row('2026-08-01','major','final', 10)]);
    check('10th is not', seatVia() === null);
    seed([row('2026-04-25','major','final', 1)]);
    check('and winning Major 1 is a Summit seat, not an Antwerp one', seatVia() === null);

    seed([row('2026-08-14','gclc','final', 3)]);
    check('3rd in the Last Chance is a seat', seatVia() === 'gclc');
    seed([row('2026-08-14','gclc','final', 4)]);
    check('4th is not', seatVia() === null);

    // ---- and it plays ----------------------------------------------------
    seed([row('2026-05-31','summit','final', 4)]);
    careerEntry();
    const next = careerNext();
    out.notes.next = next.type + ' / ' + next.label;
    check('the hub offers Antwerp', next.type === 'globals');
    check('and it is playable', careerCanPlay(next) === true);
    document.querySelector('#screen-career-hub .ch-play').click();
    let card = null;
    for (let i = 0; i < 1200 && !card; i++) {
      await wait(25);
      skipAnimation = true;
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    if (!card) throw new Error('no result card came back from Antwerp');
    const save = JSON.parse(localStorage.getItem('fncsdraft_career')).career;
    const last = (save.log||[]).slice(-1)[0];
    out.notes.row = last && {kind:last.kind, place:last.place, of:last.of,
                             games:last.games, prize:last.prize};
    check('it wrote a Global Championship row', last && last.kind === 'globals');
    check('fifty duos', last && last.of === 50, last && String(last.of));
    check('over twelve games', last && last.games === 12, last && String(last.games));
    check('every place at Antwerp is paid', last && last.prize > 0,
          last && String(last.prize));
    check('and the money is banked', save.earnings === last.prize,
          save.earnings + '/' + (last && last.prize));
    check('the run is remembered', !!save.globals && save.globals.via === 'summit',
          JSON.stringify(save.globals||null));
    check('the day is spent', save.day > '2026-09-26', save.day);
    check('and it cannot be played twice', careerGlobalsCan(careerGlobalsOn('2026-09-27')) === false);

    // ---- and the room is the world ---------------------------------------
    // Fifty duos off the three real qualification lists, not fifty Europeans.
    seed([row('2026-05-31','summit','final', 4)]);
    careerEnsurePartner();
    const mine = [careerCard(), careerPartnerCard()];
    const meTeam = careerYouTeam(mine);
    meTeam.isYou = true;
    const gcField = careerGlobalsField(meTeam, mine, 'summit');
    const routes = {};
    gcField.forEach(t => { routes[t.gcRoute || '?'] = (routes[t.gcRoute || '?']||0) + 1; });
    const regions = {};
    gcField.forEach(t => (t.squad||[]).forEach(p => {
      const r = p.region || '?'; regions[r] = (regions[r]||0) + 1;
    }));
    out.notes.routes = routes;
    out.notes.regions = regions;
    check('fifty seats in Antwerp', gcField.length === 50, String(gcField.length));
    check('fifteen of them came out of the Summit', routes.summit === 15, String(routes.summit));
    check('twenty-five out of the Major 2 finals', routes.m2 === 25, String(routes.m2));
    check('and ten out of the Last Chance', routes.lcq === 10, String(routes.lcq));
    check('every region is in the room', Object.keys(regions).length >= 5,
          Object.keys(regions).join(','));
    check('and it is not a European field',
          (regions.EU||0) < gcField.length * 2 * 0.8, JSON.stringify(regions));
    // Nobody is at the LAN twice.
    const seen = {}; let dupes = 0;
    gcField.forEach(t => (t.squad||[]).forEach(p => {
      const k = String(p.handle||'').toLowerCase();
      if (seen[k]) dupes++; seen[k] = 1;
    }));
    check('and nobody is seated twice', dupes === 0, String(dupes));
    // A real duo carries the standing-pair synergy every career duo carries;
    // building the foreign seats any other way docks them five points of power.
    const foreign = gcField.find(t => t.lanRegion && t.lanRegion !== 'EU');
    out.notes.foreign = foreign && {name: foreign.name.replace(/<[^>]*>/g,''),
                                    region: foreign.lanRegion, pow: foreign.pow};
    check('a foreign duo is a standing pair', !!foreign &&
          (foreign.syn.links||[]).some(l => l.type === 'partner'));

    // ---- the purse -------------------------------------------------------
    let pool = 0, paid = 0;
    for (let p = 1; p <= 60; p++) { const v = gcPrize(p); if (v) { pool += v; paid = p; } }
    out.notes.purse = {first: gcPrize(1), places: paid, pool: pool};
    check('Antwerp pays $2,000,000', pool === 2000000, String(pool));
    check('across fifty places', paid === 50, String(paid));
    check('with $400,000 at the top', gcPrize(1) === 400000, String(gcPrize(1)));

    // Epic's own multiplier table puts the Global Championship on its top line.
    check('and PR rates it x1.6', ccPrWeight({kind:'globals'}) === 1.6,
          String(ccPrWeight({kind:'globals'})));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsglobals-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the career flies to Antwerp, through one of three doors, and plays it');
fs.rmSync(dir, { recursive: true, force: true });
