// The jersey somebody is wearing, and roughly what it pays.
//
// The cards have always carried the org a player really played for — M1_ORG and
// its siblings, read off each Major's own standings — and the career never
// showed it, so everybody you wrote to was a nameless free agent whatever team
// they were actually on.
//
// The wage is the mode's own formula rather than a second one: careerOrgSalary
// is what a club pays a player of that standard in that division, which is the
// number the player's own contract is quoted in. It says "about", because real
// Fortnite salaries are not published and the interface should not pretend to
// know somebody's contract.
//
// Also here, because it is the same screen: who says yes to a duo offer.
//
//   node tools/check-career-roster-club.js
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
(function(){
  // The seat is the player's to fill now: somebody free wrote, and the button
  // under their message seats them. Same door a player goes through.
  const ccProbeSeat = () => {
    if (careerPartnerCard()) return;
    const s = careerDms().find(x => x.state === 'offer' && !x.who.org && !x.who.brand);
    if (s) { careerDmAccept(s.id); careerRenderHub('centre'); }
  };
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (ovr, div) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:ovr, role:'roleIGL',
              attrs:ccRookieAttrs(ovr,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-10', division:div, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null
    }));
    careerEntry(); ccProbeSeat();
  };
  try {
    // ---- how many of the roster wear a jersey at all ---------------------
    const roster = careerRosterNowEU();
    const withClub = roster.filter(p => p.org);
    out.notes.roster = {people: roster.length, onAClub: withClub.length,
                        sample: withClub.slice(0, 4).map(p => p.handle + ' · ' + p.org)};
    check('the roster carries real clubs', withClub.length > 0, String(withClub.length));
    check('and it is not everybody, because it is not', withClub.length < roster.length,
          withClub.length + '/' + roster.length);

    // ---- what a club pays ------------------------------------------------
    const paid = withClub.map(p => ({ovr: p._ovr, pay: ccPlayerPay(p)}))
                         .filter(x => x.pay > 0);
    const top = paid.slice().sort((a,b) => b.ovr - a.ovr)[0];
    const low = paid.slice().sort((a,b) => a.ovr - b.ovr)[0];
    out.notes.pay = {rated: paid.length, best: top, worst: low};
    check('a player on a club has a wage to quote', paid.length > 0, String(paid.length));
    check('and a better player is on more', top.pay > low.pay,
          top.ovr + ':' + top.pay + ' vs ' + low.ovr + ':' + low.pay);
    // A free agent has no wage to estimate: their income is prize money.
    const free = roster.find(p => !p.org);
    check('somebody with no club has no wage quoted', !free || ccPlayerPay(free) === 0,
          free && String(ccPlayerPay(free)));
    check('and the label says it is an estimate',
          /около|about/.test(ccPayLabel(2400)), ccPayLabel(2400));

    // ---- it reaches the screen -------------------------------------------
    // Division 1, because that is the only rung whose inbox is real people now:
    // below it the list is the generated ladder, and a generated player has no
    // club to wear and no wage to estimate. Asked one rung down, this was
    // measuring the ladder and reporting it as a missing jersey.
    seed(80, 1);
    const pool = careerDmPool();
    out.notes.pool = pool.slice(0, 3).map(w => w.handle + ' · ' + (w.club||'-') + ' · ' + w.pay);
    check('the people you can write to carry their club',
          pool.some(w => w.club), JSON.stringify(out.notes.pool));
    // And the rung below is the other half of the same rule.
    seed(80, 2);
    const ladder = careerDmPool();
    out.notes.ladder = ladder.slice(0, 3).map(w => w.handle + ' · ' + (w.club||'-') + ' · ' + w.pay);
    check('below Division 1 nobody wears one, because nobody is real',
          ladder.every(w => !w.club && !w.pay && !w.roster),
          JSON.stringify(out.notes.ladder));
    seed(80, 1);
    check('and it is not filed as a club thread',
          pool.every(w => !w.org), 'a thread with org set is a club writing to you');
    // The social tab draws the feed; the inbox is its own block, so this
    // asks the block that actually lists people rather than the whole tab.
    // The tab opens on the feed unless something is unread; the list of
    // people to write to lives on the DMs view, so ask for that one.
    CH_SOCIAL = 'dms';
    const html = careerSocialHTML();
    out.notes.htmlHas = {dmItem: (html.match(/dm-item/g)||[]).length,
                         pay: (html.match(/dm-item-pay/g)||[]).length,
                         slice: html.slice(html.indexOf('dm-new'), html.indexOf('dm-new')+320)};
    const shown = pool.find(w => w.club);
    check('the list shows the jersey', !shown || html.indexOf(shown.club) >= 0,
          shown && shown.club);
    check('and shows what it pays', !shown || !shown.pay ||
          html.indexOf(shown.pay.toLocaleString('en-US')) >= 0,
          shown && String(shown.pay));

    // ---- who says yes ----------------------------------------------------
    // Out-rate somebody and the duo they are in stops being the argument: you
    // are the better player and that is the offer. This used to refuse anybody
    // with a standing partner however far above them you were.
    const paired = roster.find(p => ccRealMateOf(p));
    out.notes.paired = paired && {handle: paired.handle, ovr: paired._ovr,
                                  mate: (ccRealMateOf(paired)||{}).handle};
    if (paired) {
      const target = {handle: paired.handle, ovr: paired._ovr, roster: true};
      seed(Math.round(paired._ovr) + 6, 1);
      const above = careerDmWouldAccept(target);
      seed(Math.round(paired._ovr) - 1, 1);
      const below = careerDmWouldAccept(target);
      out.notes.duo = {above: above, below: below, target: paired._ovr};
      check('somebody you out-rate will leave their duo for you', above === true);
      check('somebody you do not will not', below === false);
    } else {
      check('the roster has a standing duo to test against', false);
    }
    // And a free agent still takes the call on the old reach rule.
    const solo = roster.find(p => !ccRealMateOf(p));
    if (solo) {
      seed(Math.round(solo._ovr) - 2, 1);
      check('a free agent within reach still says yes',
            careerDmWouldAccept({handle:solo.handle, ovr:solo._ovr, roster:true}) === true,
            solo.handle + ' ' + solo._ovr);
      seed(Math.round(solo._ovr) - 12, 1);
      check('and one far above you does not',
            careerDmWouldAccept({handle:solo.handle, ovr:solo._ovr, roster:true}) === false);
    }

    // ---- the Evaluation, while we are on who may enter what --------------
    // Epic's own page: "You must be Duos Division 1 to participate in this
    // event" — which includes whoever has just come up out of Division 2,
    // because clearing that cut is how you become Division 1.
    seed(82, 2);
    check('a Division 2 player is not offered the Evaluation',
          careerCanPlayKind('eval') === false);
    seed(82, 1);
    check('a Division 1 player is', careerCanPlayKind('eval') === true);
    CAREER.career.division = 1;
    CAREER.career.log = [{season:1, day:'2026-02-03', div:2, place:5, of:150,
                          kind:'cup', passed:true, games:11}];
    check('and so is somebody who came up out of Division 2 last night',
          careerCanPlayKind('eval') === true);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsclub-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the roster wears its jerseys, and being better is an argument');
fs.rmSync(dir, { recursive: true, force: true });
