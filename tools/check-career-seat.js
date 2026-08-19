// The seat beside the player, and who fills it.
//
// Nothing fills it for you any more: careerEnsurePartner is gone from the top of
// every runner, an empty seat locks the tournament, and the way out of it is the
// inbox. So the people who are free write first, their message is the offer, and
// taking it is one press with no day of waiting. Posting LFD moves the line by
// one reach, so somebody who would have refused a cold DM writes instead.
//
//   node tools/check-career-seat.js
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
  const duos = () => careerDms().filter(t => t.state === 'offer' && !t.who.org && !t.who.brand);
  try {
    const seed = (div, ovr, day) => { CAREER = {
      player:{nick:'Probe', ovr:ovr, region:'EU', role:'roleIGL', country:'de', age:16,
              attrs:ccRookieAttrs(ovr,'roleIGL')},
      career:{season:1, size:2, day:day||'2026-01-20', division:div, earnings:0, balance:0,
              tokens:[], log:[], news:[], rep:0},
      dms:[], partners:[]}; };

    // ---- the offers arrive on their own ---------------------------------
    seed(5, 54);
    careerSeatTopUp();
    const first = duos();
    out.notes.rookie = {offers: first.length, who: first.map(t => t.who.handle + ' ' + t.who.ovr)};
    check('a career with an empty seat is written to', first.length > 0);
    check('and not by more than the three that stand at once', first.length <= CC_SEAT_DMS);
    check('every one of them is an offer with a message on it',
          first.every(t => t.msgs.some(m => m.from === 'them')));
    // Nobody who would have said no is in there: the post is what moves that
    // line, and nothing has been posted yet.
    check('nobody writes who would have refused you',
          first.every(t => careerDmMargin(t.who) >= 0));
    // Below Division 1 the ladder is generated, and the ceiling holds here too.
    check('nothing generated is above the ceiling',
          first.every(t => t.who.ovr <= CC_GEN_TOP));

    // ---- and taking one is a single press --------------------------------
    const take = duos()[0];
    careerDmAccept(take.id);
    check('taking an offer seats them', !!careerPartnerCard());
    check('and seats the one who wrote',
          careerPartnerCard() && hKey(careerPartnerCard()) === hKey({handle:take.who.handle}));
    check('with nothing left pending', !take.pending);
    check('and the seat is not written to again while it is full',
          careerSeatDm('again') === false);

    // ---- the tournament, before and after --------------------------------
    seed(5, 54, '2026-01-20');
    const cupDay = (() => { const days = careerYearDays();
      for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
        if ((days.get(d)||[]).some(e => e.kind === 'cup')) return d;
      return null; })();
    CAREER.career.day = cupDay;
    out.notes.cupDay = cupDay;
    check('an empty seat cannot enter the cup', careerCanPlayKind('cup') === false);
    careerSeatTopUp();
    const one = duos()[0];
    if (one) careerDmAccept(one.id);
    check('and the same cup opens once somebody is in it', careerCanPlayKind('cup') === true);

    // ---- saying it out loud ----------------------------------------------
    // The post only exists while the seat is empty, and it says so.
    seed(4, 66);
    check('with a partner there is nothing to post', (() => {
      CAREER.partners = [{card:{handle:'Held', nat:'de', region:'EU', org:null, tier:'ladder',
        event:'', date:'-', placement:null, rating:66, _targetOvr:66,
        _attrs:ccRookieAttrs(66,'roleFRG')}, patience:80}];
      careerLfdPost();
      const posted = (CAREER.career.news||[]).some(n => n.k === 'ccNewsLfd');
      CAREER.partners = [];
      return !posted;
    })());

    seed(4, 66);
    careerLfdPost();
    check('the post reaches the feed',
          (CAREER.career.news||[]).some(n => n.k === 'ccNewsLfd'));
    check('and it is the player who posted it', CC_POST_BY.ccNewsLfd === 'you');
    check('it stands for a week', careerLfdUntil() === ccAddDays(CAREER.career.day, CC_LFD_DAYS));
    check('and it is up', careerLfdOn() === true);
    const reached = duos().filter(t => careerDmMargin(t.who) < 0);
    out.notes.lfd = {offers: duos().length, overReach: reached.length,
                     who: duos().map(t => t.who.handle + ' ' + t.who.ovr)};
    check('somebody read it', duos().length > 0);
    // What the post buys is exactly one reach and no more: nobody further above
    // than that writes, however loud the post is.
    check('and nobody further above than one reach',
          duos().every(t => careerDmMargin(t.who) >= -CC_LFD_REACH));
    // A week later it has run out.
    CAREER.career.day = ccAddDays(CAREER.career.day, CC_LFD_DAYS + 1);
    check('a week later the post is down', careerLfdOn() === false);

    // ---- and what the post is actually worth, measured -------------------
    // One career is one roll of the week's list, so the difference the post
    // makes is counted over twenty of them rather than asserted off one.
    const sweep = (post) => {
      let over = 0, offers = 0;
      for (let i = 0; i < 20; i++) {
        seed(4, 66, ccAddDays('2026-01-20', i * 7));
        if (post) careerLfdPost();
        careerSeatTopUp();
        duos().forEach(t => { offers++; if (careerDmMargin(t.who) < 0) over++; });
      }
      return {offers: offers, over: over};
    };
    const quiet = sweep(false), loud = sweep(true);
    out.notes.sweep = {quiet: quiet, posted: loud};
    check('a quiet week never brings somebody who would refuse you', quiet.over === 0);
    check('and the post does', loud.over > 0,
          'twenty careers posted LFD and none of them reached above the line');

    // ---- Division 1, where almost everybody already has somebody ---------
    // 887 of the 901 people on the roster stand in a recorded pair, so a filter
    // on free agents alone leaves a Division 1 career hearing from nobody. It
    // must never be a dead end: an empty seat cannot play.
    seed(1, 90);
    careerSeatTopUp();
    out.notes.d1 = {offers: duos().length, who: duos().map(t => t.who.handle + ' ' + t.who.ovr)};
    check('Division 1 hears from somebody too', duos().length > 0);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsseat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the seat is the player\'s to fill, and somebody is always writing about it');
fs.rmSync(dir, { recursive: true, force: true });
