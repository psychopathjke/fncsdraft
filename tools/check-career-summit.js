// The Summit, and who gets to play it.
//
// Three days in Düsseldorf at the end of May, filled off Major 1's own Grand
// Finals: Europe's top 20 into the Upper Bracket, 21-28 into the Second Chance
// that fills the Lower. The career qualified for it all year and never played
// it — the calendar simply stepped over the three days.
//
// The format is the one the draft mode already holds, which is Epic's: 6 games
// upper with 25 through, 6 games lower with a Victory Royale advancing on its
// own, 8 games in the Grand Finals, and PRIZE_TABLES.SUMMIT on top.
//
//   node tools/check-career-summit.js
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
    // ---- the three days are on the calendar ------------------------------
    const days = careerYearDays();
    const found = {};
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
      (days.get(d)||[]).filter(e => e.kind === 'summit').forEach(e => { found[e.id] = d; });
    out.notes.days = found;
    ['Summit_Upper','Summit_Lower','Summit_Final'].forEach(id =>
      check('the calendar carries ' + id, !!found[id]));
    check('and it is the end of May', found.Summit_Final === '2026-05-31', found.Summit_Final);

    const seed = (majorPlace, extra) => {
      const log = majorPlace ? [{season:1, day:'2026-04-26', div:1, place:majorPlace, of:50,
                                 kind:'major', stage:'final', passed:true, prize:0}] : [];
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1,
        player:{nick:'Probe', age:16, source:'rookie', country:'de', countryPing:15,
                closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
                attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
                handle:null, cardRegion:null, nat:null},
        career:Object.assign({season:1, day:'2026-05-29', division:1, earnings:0,
                              balance:0, reach:10000, tokens:[], log:log}, extra||{}),
        partner:null
      }));
      careerLoad();
    };

    // ---- who is in it ----------------------------------------------------
    seed(null);
    check('a career that skipped the Major stays home', careerSummitCan(careerSummitOn('2026-05-29')) === false);
    seed(40);
    check('and so does one that finished 40th', careerSummitCan(careerSummitOn('2026-05-29')) === false);
    seed(12);
    check('the top twenty are in the Upper Bracket', ccSummitSeat() === 'main');
    check('which is what opens the first day', careerSummitCan(careerSummitOn('2026-05-29')) === true);
    seed(24);
    check('21 to 28 are the second chance', ccSummitSeat() === 'scq');
    check('so the first day is not theirs', careerSummitCan(careerSummitOn('2026-05-29')) === false);
    CAREER.career.day = '2026-05-30';
    check('but the second is', careerSummitCan(careerSummitOn('2026-05-30')) === true);

    // ---- and it plays, through the interface -----------------------------
    seed(3);
    careerEntry();
    const next = careerNext();
    out.notes.firstDay = next.type + ' / ' + next.label;
    check('the hub offers the Upper Bracket', next.type === 'summit');
    check('and it is playable', careerCanPlay(next) === true);
    document.querySelector('#screen-career-hub .ch-play').click();
    let card = null;
    for (let i = 0; i < 900 && !card; i++) {
      await wait(25);
      skipAnimation = true;
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    if (!card) throw new Error('no result card came back from the Upper Bracket');
    const save = JSON.parse(localStorage.getItem('fncsdraft_career')).career;
    const row = (save.log||[]).slice(-1)[0];
    out.notes.row = row && {kind:row.kind, stage:row.stage, place:row.place,
                            of:row.of, games:row.games};
    check('it wrote a Summit row', row && row.kind === 'summit' && row.stage === 'upper');
    check('the room is fifty duos', row && row.of === 50, row && String(row.of));
    check('over six games', row && row.games === 6, row && String(row.games));
    check('and the day is spent', save.day > '2026-05-29', save.day);
    check('the run is remembered', !!save.summit && save.summit.got === 'upper',
          JSON.stringify(save.summit||null));

    // ---- and Düsseldorf is a world event ---------------------------------
    // Epic's allocation, region by region: Europe's 28 are the season this
    // career played, the other six regions' 47 are their own Major 1 finals.
    seed(3);
    careerEnsurePartner();
    const mine = [careerCard(), careerPartnerCard()];
    const meTeam = careerYouTeam(mine);
    meTeam.isYou = true;
    const rooms = {};
    ['upper','lower','final'].forEach(st => {
      const f = careerSummitField(st, meTeam, mine);
      const reg = {};
      f.forEach(t => (t.squad||[]).forEach(p => {
        const r = p.region || '?'; reg[r] = (reg[r]||0) + 1;
      }));
      const seen = {}; let dup = 0;
      f.forEach(t => (t.squad||[]).forEach(p => {
        const k = String(p.handle||'').toLowerCase();
        if (seen[k]) dup++; seen[k] = 1;
      }));
      rooms[st] = {size: f.length, regions: reg, you: f.indexOf(meTeam) >= 0, dup: dup};
      check(st + ' seats fifty duos', f.length === 50, String(f.length));
      check(st + ' has the player in it', f.indexOf(meTeam) >= 0);
      check(st + ' seats nobody twice', dup === 0, String(dup));
      check(st + ' is not a European room', Object.keys(reg).length >= 5,
            Object.keys(reg).join(','));
    });
    out.notes.rooms = rooms;
    // North America's thirteen direct seats are the largest allocation after
    // Europe's, so they have to be visible in the Upper Bracket.
    check('the Upper Bracket carries North America\\u2019s share',
          (rooms.upper.regions.NAC||0) >= 20, String(rooms.upper.regions.NAC));

    // The purse is the published one.
    check('the Summit pays $250,000 at the top', summitPrize(1) === 250000, String(summitPrize(1)));
    check('and pays down to 74th', summitPrize(74) > 0 && summitPrize(75) === 0,
          summitPrize(74) + '/' + summitPrize(75));
    out.notes.prize = {first: summitPrize(1), last: summitPrize(74)};
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncssummit-'));
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
console.log('the Summit is on the calendar, filled off Major 1, and plays');
fs.rmSync(dir, { recursive: true, force: true });
