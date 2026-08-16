// A final asks where to land.
//
// The draft mode has asked since the Majors were built and the career never
// did: every career final dropped into a rectangle chosen off an index,
// including the ones with two million dollars on them.
//
// This holds the line the player drew — a final asks, an ordinary Tuesday does
// not — and the thing that makes the pick mean something: you choose in the
// order you qualified, so at Antwerp the Summit's fifteen have their markers
// down before the Last Chance's ten see the board.
//
//   node tools/check-career-landing.js
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // What the player does when the board comes up, and what the run records
  // about it: which zone was taken, and how many duos had already picked.
  let seen = null;
  const answer = () => {
    const p = document.querySelector('.landing-picker');
    if (!p) return;
    const z = p.querySelectorAll('.land-zone');
    if (!z.length) return;
    if (!seen) seen = {zones: z.length, detail: (p.querySelector('.stage-detail')||{}).textContent||''};
    z[0].click();
    const c = p.querySelector('#gameLandingConfirm');
    if (c && !c.disabled) c.click();
  };
  const playOut = async (limit) => {
    const btn = document.querySelector('#screen-career-hub .ch-play');
    if (!btn) {
      const n = careerNext();
      throw new Error('no play button; day=' + careerToday() + ' div=' + CAREER.career.division +
        ' next=' + JSON.stringify(n && {type:n.type, label:n.label}) +
        ' can=' + (n ? careerCanPlay(n) : '-') +
        ' buttons=' + [...document.querySelectorAll('#screen-career-hub button')]
          .map(b => b.className).join('|'));
    }
    btn.click();
    for (let i = 0; i < (limit||900); i++) {
      await wait(25);
      answer();
      skipAnimation = true;
      const card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
      if (card) return card;
    }
    throw new Error('no result card came back');
  };
  // wfMonday is the seat at Saturday: Division 1 earns it by clearing the week's
  // cut, and without one the final is not the player's to play.
  const seed = (day, div, log, wfMonday) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:17, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:88, role:'roleIGL',
              attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:10000,
              tokens:[], log:log||[],
              wf: wfMonday ? {monday:wfMonday} : undefined},
      partner:null
    }));
    careerEntry();
  };
  try {
    const days = careerYearDays();
    const find = (kind, from) => {
      for (let d = from || CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
        if ((days.get(d)||[]).some(e => e.kind === kind)) return d;
      return null;
    };

    // ---- an ordinary cup night does not ask ------------------------------
    seen = null;
    seed(find('cup'), 3);
    await playOut();
    out.notes.cupAsked = !!seen;
    check('a divisional cup night does not ask where to land', seen === null,
          JSON.stringify(seen));

    // ---- the Weekly Final does --------------------------------------------
    seen = null;
    seed(find('final'), 1, null, careerMonday(find('final')));
    const wf = careerNext();
    out.notes.final = wf && wf.type;
    check('the day is the Weekly Final', wf && wf.type === 'final');
    await playOut();
    out.notes.finalPicker = seen;
    check('the Weekly Final asks where to land', !!seen);
    check('and it draws the island\\u2019s whole grid',
          seen && seen.zones === ALL_LANDING_ZONES.length,
          seen && (seen.zones + '/' + ALL_LANDING_ZONES.length));

    // ---- the pick is on the team, and it is worth something ---------------
    // careerLandingPick hands the zone map back to the simulation; the proof it
    // was used is on the player's own team afterwards.
    seed(find('final'), 1, null, careerMonday(find('final')));
    careerEnsurePartner();
    const mine = [careerCard(), careerPartnerCard()];
    const me = careerYouTeam(mine);
    me.isYou = true;
    const field = [me, ...careerCupField(CAREER.career, mine, CAREER_CUP_CUT)];
    const before = me.pow;
    const zones = await Promise.race([
      careerLandingPick(field, me, 'probe'),
      (async () => { for (let i = 0; i < 400; i++) { await wait(25); answer(); } })()
    ]);
    out.notes.zone = me.landingZone && {points: me.landingZone.points,
                                        pow: before + ' -> ' + me.pow};
    check('the pick lands on the player\\u2019s team', !!me.landingZone);
    check('and the zone is worth what the map says it is',
          me.pow === Math.round(before + me.landingZone.points),
          before + ' + ' + (me.landingZone||{}).points + ' = ' + me.pow);
    check('everybody in the room is on the board', !!zones && zones.size > 0);
    let placed = 0;
    if (zones) zones.forEach(g => { placed += g.length; });
    out.notes.placed = placed;
    check('all fifty duos have a marker down', placed === field.length,
          placed + '/' + field.length);

    // ---- you pick in the order you qualified ------------------------------
    // At Antwerp that order is the route: the Summit's fifteen booked their
    // seats in May, the Major 2 qualifiers in August, the Last Chance last week.
    seed('2026-09-26', 1, [{season:1, day:'2026-05-31', div:1, place:4, of:50,
                            kind:'summit', stage:'final', passed:true, prize:0}]);
    careerEnsurePartner();
    const mine2 = [careerCard(), careerPartnerCard()];
    const ahead = (via) => {
      const t = careerYouTeam(mine2); t.isYou = true;
      const f = careerGlobalsField(t, mine2, via);
      return f.filter(x => x !== t && byQualOrder(x, t) < 0).length;
    };
    const aSummit = ahead('summit'), aM2 = ahead('major2'), aLcq = ahead('gclc');
    out.notes.pickSeat = {summit: aSummit + 1, major2: aM2 + 1, lastChance: aLcq + 1};
    check('a Summit seat picks inside the first fifteen', aSummit < 15, String(aSummit));
    check('a Major 2 seat picks after them', aM2 >= 15 && aM2 < 40, String(aM2));
    check('and the Last Chance picks last', aLcq >= 40, String(aLcq));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsland-'));
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
console.log('a final asks where to land, and you pick in the order you qualified');
fs.rmSync(dir, { recursive: true, force: true });
