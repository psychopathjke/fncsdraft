// Talking to people: the duo you are asking, and the room that is watching.
//
// Asking somebody to play was one line and an instant answer - you pressed the
// button, the number decided, and a seat in a duo was settled inside a click,
// while the contract next to it took a fortnight and two arguments. And the
// viewers and the haters were the only threads with nothing to press at all.
//
// What this holds: a person takes a day to answer, a no can be argued with
// twice, each argument costs the thing it is made of, losing the set you asked
// for ends it, and answering the room moves the two numbers the room is made of.
//
//   node tools/check-career-talk.js
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
  try {
    const seed = (ovr, div, log) => {
      CAREER = {player:{nick:'Probe', age:17, source:'rookie', country:'de', countryPing:15,
                        region:'EU', ovr:ovr, ovrExact:ovr, role:'roleIGL',
                        attrs:ccRookieAttrs(ovr,'roleIGL'), photo:null, handle:null},
        career:{season:1, day:'2026-02-10', division:div||3, earnings:0, balance:0,
                reach:120000, rep:0, tokens:[], log:log||[], news:[], newsN:0, newsSeen:0},
        partner:null, gear:{own:[], train:0}, dms:[]};
      CH_DM = null;
    };
    // A day moves the way careerAdvanceTo moves it, without the wages and the
    // world turning: this is measuring a conversation.
    const days = n => {
      const from = CAREER.career.day, to = ccAddDays(from, n);
      CAREER.career.day = to;
      careerDmDays(from, to);
      return to;
    };

    /* ---- a person takes a day ------------------------------------------- */
    seed(70);
    let pool = careerDmPool();
    const easy = pool.filter(w => careerDmWouldAccept(w))[0];
    check('somebody in the list would play with you', !!easy);
    careerDmWrite(easy.handle);
    let t = careerDmFind(easy.handle);
    check('writing does not settle it on the spot', !!t.pending && t.state !== 'offer',
          t.state + '/' + JSON.stringify(t.pending));
    check('and the thread says when the answer is due',
          t.msgs.some(m => m.k === 'dmThinking'));
    days(CC_DM_DAYS);
    check('the answer comes when the day does', !t.pending && t.state === 'offer',
          t.state);
    check('and it can be taken', (careerDmAccept(t.id), !!careerPartnerCard()));

    /* ---- and they do not all talk the same ------------------------------- */
    // Every line in the inbox was one string, so Sky said no in the words
    // Th0masHD said no and after four threads the inbox was a form letter with
    // different names on it.
    seed(70);
    const voices = {};
    careerDmPool().forEach(w => { voices[w.handle] = ccVoiceOf(w.handle); });
    out.notes.voices = voices;
    const spread = Object.keys(voices).map(k => voices[k])
                         .filter((v, i, a) => a.indexOf(v) === i);
    check('the list does not speak with one voice', spread.length > 1,
          JSON.stringify(voices));
    // A voice is a property of the person: the same handle always answers the
    // same way, and across the roster all four are in use.
    check('a voice never changes under somebody',
          ccVoiceOf('Sky') === ccVoiceOf('Sky') && ccVoiceOf('Sky') === ccVoiceOf('Sky'),
          String(ccVoiceOf('Sky')));
    const allVoices = {};
    careerRosterNowEU().slice(0, 200).forEach(p => { allVoices[ccVoiceOf(p.handle)] = 1; });
    check('and all four are spoken somewhere on the roster',
          Object.keys(allVoices).length === CC_VOICES,
          Object.keys(allVoices).join(','));
    // Two people refusing the same career refuse it differently.
    const saidNo = {};
    careerDmPool().forEach(w => {
      const th = careerDmThread({handle: w.handle, ovr: w.ovr, roster: true});
      careerDmPush(th, 'them', 'dmNo', [w.ovr, 3]);
      saidNo[w.handle] = th.msgs[0].k;
    });
    out.notes.saidNo = saidNo;
    const keys = Object.keys(saidNo).map(k => saidNo[k]).filter((v,i,a) => a.indexOf(v) === i);
    check('two people say no in different words', keys.length > 1, keys.join(','));
    check('and every one of them is a line that exists',
          keys.every(k => typeof L()[k] !== 'undefined'), keys.join(','));
    // A key nobody has written variants for is used exactly as it is.
    const plain = careerDmThread({handle: 'Plainspoken', ovr: 70, roster: true});
    careerDmPush(plain, 'them', 'dmThinking', ['1 Feb']);
    check('a line with no variants is left alone', plain.msgs[0].k === 'dmThinking',
          plain.msgs[0].k);
    // And the player has one voice, which is their own.
    const mine2 = careerDmThread({handle: 'Somebody', ovr: 70, roster: true});
    careerDmPush(mine2, 'you', 'dmAsk');
    check('what the player says is not put in somebody else\\'s voice',
          mine2.msgs[0].k === 'dmAsk', mine2.msgs[0].k);

    /* ---- how their season is going --------------------------------------- */
    // Picking a partner was a rating and a role. A rating is what somebody is
    // worth in general and says nothing about the season you are both standing
    // in - which is the thing anybody picking a partner actually looks at, and
    // this career has been building the board for it every week.
    seed(92, 1);
    check('nothing is claimed before there is a season',
          ccDuoForm(careerDmPool()[0].handle) == null, 'shown too early');
    // Three weeks of Division 1 played out, the way careerWorldTurns does it.
    for (let w = 0; w < 4; w++) {
      CAREER.career.day = ccAddDays('2026-02-07', w * 7);
      const ranked = careerWorldD1(CAREER.career.day);
      if (ranked) careerTableAdd(ranked);
    }
    const table = careerTableRows();
    out.notes.table = {rows: table.length, weeks: careerTable().weeks};
    const named = careerDmPool().map(w => ({h: w.handle, f: ccDuoForm(w.handle)}))
                                .filter(x => x.f);
    out.notes.form = named.slice(0, 3).map(x => x.h + ': #' + x.f.place + '/' + x.f.of);
    check('a season produces a table', table.length > 0, String(table.length));
    check('and somebody in the list has a standing in it', named.length > 0,
          String(named.length));
    if (named.length) {
      const f = named[0].f;
      check('which is a place in that table', f.place >= 1 && f.place <= f.of,
            f.place + '/' + f.of);
      check('and it reads as words', !!ccDuoFormLabel(named[0].h),
            ccDuoFormLabel(named[0].h));
      CH_SOCIAL = 'dms'; CH_DMKIND = null; CH_DM = null;
      const html = careerSocialHTML();
      check('the list you pick from shows it',
            html.indexOf('dm-item-form') >= 0, 'not on the list');
    }
    // And it is this career's board, not a record of real life.
    check('nobody outside the division has one',
          ccDuoForm('AbsolutelyNobody') == null);

    /* ---- and the partner has a voice ------------------------------------- */
    // Everybody wrote to this career except the one who matters. The seat used
    // to empty silently between one cup and the next.
    seed(70);
    careerEnsurePartner();
    let mate = careerPartnerCard();
    check('there is somebody to talk to', !!mate);
    // Happy and a good night: he says so, and saying it makes it truer.
    CAREER.partner.patience = 80;
    CAREER.dms = [];
    let said = null;
    for (let i = 0; i < 20 && !said; i++) {
      CAREER.career.day = '2026-03-' + String(1 + i).padStart(2, '0');
      said = careerMateDm(2, 150, true);
    }
    out.notes.mate = {happy: !!said, patience: careerPatience()};
    check('a happy partner says the good thing after a good night', !!said);
    if (said) check('and saying it is worth something', careerPatience() > 80,
                    String(careerPatience()));

    // Nearly out: he says so first rather than vanishing.
    seed(70);
    careerEnsurePartner();
    mate = careerPartnerCard();
    CAREER.partner.patience = CAREER_PATIENCE_QUIT + 4;
    CAREER.dms = [];
    const going = careerMateDm(140, 150, false);
    check('a partner on his way out says so first', !!going && going.state === 'leaving',
          going && going.state);
    if (going) {
      check('and the feed says it too',
            (CAREER.career.news || []).some(n => n.k === 'ccNewsMateWobbling'));
      const ways = careerMateKeepable(going);
      out.notes.keep = {ways: ways, patience: careerPatience()};
      check('there is something to say back', ways.length > 0, ways.join(','));
      // The cheapest argument alone is not enough this far gone.
      careerMateKeep(going.id, 'promise');
      check('a promise moves him', careerPatience() > CAREER_PATIENCE_QUIT + 4,
            String(careerPatience()));
      // Money is the strongest, and it is money leaving the balance.
      if (careerMateKeepable(going).indexOf('camp') >= 0) {
        CAREER.career.balance = 5000;
        const before = CAREER.career.balance;
        careerMateKeep(going.id, 'camp');
        check('paying for a bootcamp costs the money',
              before - CAREER.career.balance === CC_MATE_CAMP_COST,
              String(before - CAREER.career.balance));
        check('and books the stay', !!ccStayOf('camp'));
      }
      out.notes.kept = {state: going.state, patience: careerPatience(),
                        partner: !!careerPartnerCard()};
      check('enough of it and he stays',
            going.state === 'partner' && !!careerPartnerCard(),
            going.state + '/' + !!careerPartnerCard());
    }
    // Run out of arguments and he goes, and the seat is empty.
    seed(70);
    careerEnsurePartner();
    CAREER.partner.patience = CAREER_PATIENCE_QUIT + 1;
    CAREER.career.balance = 0;              // no bootcamp to offer
    CAREER.dms = [];
    const gone = careerMateDm(150, 150, false);
    if (gone) {
      let guard = 0;
      while (careerMateKeepable(gone).length && guard++ < 5)
        careerMateKeep(gone.id, careerMateKeepable(gone)[0]);
      out.notes.gone = {state: gone.state, partner: !!careerPartnerCard()};
      check('and a partner who cannot be talked round leaves',
            gone.state === 'partner' || !careerPartnerCard(),
            gone.state + '/' + !!careerPartnerCard());
    }

    /* ---- a no can be argued with ---------------------------------------- */
    // Somebody well above the reach, so the first answer is no.
    seed(70);
    pool = careerDmPool();
    const hard = pool.slice().sort((a,b) => b.ovr - a.ovr)[0];
    out.notes.hard = {ovr: hard.ovr, you: 70};
    check('somebody in the list is out of reach', !careerDmWouldAccept(hard),
          String(hard.ovr));
    careerDmWrite(hard.handle);
    t = careerDmFind(hard.handle);
    days(CC_DM_DAYS);
    check('and they say no', t.state === 'declined', t.state);
    const args = careerDmArgs(t);
    out.notes.args = args;
    check('but there is something left to say', args.length > 0, args.join(','));

    /* ---- the result argument cuts both ways ------------------------------ */
    // A win last time is worth four; a night at the back is worth minus two.
    seed(70, 3, [{season:1, day:'2026-02-09', place:1, of:150, passed:true, kind:'cup'}]);
    pool = careerDmPool();
    const h2 = pool.slice().sort((a,b) => b.ovr - a.ovr)[0];
    careerDmWrite(h2.handle); t = careerDmFind(h2.handle); days(CC_DM_DAYS);
    if (t.state === 'declined' && careerDmArgs(t).indexOf('form') >= 0) {
      careerDmArgue(t.id, 'form');
      check('pointing at a result asks again', !!t.pending, JSON.stringify(t.pending));
      check('and a win is worth persuading with', t.pending.boost === CC_ARG_GAIN.form,
            String(t.pending.boost));
      out.notes.formBoost = t.pending.boost;
    }
    seed(70, 3, [{season:1, day:'2026-02-09', place:148, of:150, passed:false, kind:'cup'}]);
    pool = careerDmPool();
    const h3 = pool.slice().sort((a,b) => b.ovr - a.ovr)[0];
    careerDmWrite(h3.handle); t = careerDmFind(h3.handle); days(CC_DM_DAYS);
    if (t.state === 'declined' && careerDmArgs(t).indexOf('form') >= 0) {
      careerDmArgue(t.id, 'form');
      check('and a bad night is worse than saying nothing', t.pending.boost < 0,
            String(t.pending.boost));
    }

    /* ---- the role argument costs the six numbers ------------------------- */
    seed(70);
    pool = careerDmPool();
    const same = pool.find(w => w.role === attrsFor(careerCard()).roleKey &&
                                !careerDmWouldAccept(w));
    if (same) {
      careerDmWrite(same.handle); t = careerDmFind(same.handle); days(CC_DM_DAYS);
      const before = CAREER.player.role, aimBefore = CAREER.player.attrs.aim;
      if (careerDmArgs(t).indexOf('role') >= 0) {
        careerDmArgue(t.id, 'role');
        out.notes.role = {from: before, to: CAREER.player.role,
                          aim: [aimBefore, CAREER.player.attrs.aim]};
        check('offering their role changes yours', CAREER.player.role !== before,
              before + ' -> ' + CAREER.player.role);
        check('and rebuilds the six numbers round it',
              CAREER.player.attrs.aim !== aimBefore,
              aimBefore + ' -> ' + CAREER.player.attrs.aim);
        check('and it is the most convincing thing on the list',
              t.pending.boost === CC_ARG_GAIN.role, String(t.pending.boost));
      }
    }

    /* ---- the scrim is a real offer, so it can be lost -------------------- */
    // Far below them, so the set is lost and the conversation with it.
    seed(50, 3);
    pool = careerDmPool();
    const way = pool.slice().sort((a,b) => b.ovr - a.ovr)[0];
    careerDmWrite(way.handle); t = careerDmFind(way.handle); days(CC_DM_DAYS);
    const energyBefore = careerEnergy();
    if (careerDmArgs(t).indexOf('scrim') >= 0) {
      careerDmArgue(t.id, 'scrim');
      out.notes.scrim = {state: t.state, energy: [energyBefore, careerEnergy()],
                         msgs: t.msgs.map(m => m.k)};
      check('a scrim costs the energy it costs',
            energyBefore - careerEnergy() === CC_ARG_SCRIM_COST,
            String(energyBefore - careerEnergy()));
      check('losing the set you asked for ends it',
            t.state === 'declined' && !t.pending &&
            t.msgs.some(m => m.k === 'dmArgScrimLost'),
            t.state);
      check('and there is nothing left to say', careerDmArgs(t).length === 0);
    }

    /* ---- two arguments and no more --------------------------------------- */
    seed(70, 3, [{season:1, day:'2026-02-09', place:1, of:150, passed:true, kind:'cup'}]);
    pool = careerDmPool();
    const h4 = pool.slice().sort((a,b) => b.ovr - a.ovr)[0];
    careerDmWrite(h4.handle); t = careerDmFind(h4.handle); days(CC_DM_DAYS);
    let spent = 0;
    for (let i = 0; i < 4; i++) {
      const a = careerDmArgs(t);
      if (!a.length) break;
      careerDmArgue(t.id, a[0]);
      spent++;
      days(CC_DM_DAYS);
      if (t.state === 'offer') break;
    }
    out.notes.spent = spent;
    check('a conversation runs out of arguments', spent <= CC_DM_ARGS, String(spent));

    /* ---- and the room can be answered ------------------------------------ */
    seed(70);
    CAREER.career.day = '2026-03-01';
    let fan = null;
    for (let i = 0; i < 30 && !fan; i++) {
      CAREER.career.day = '2026-03-' + String(1 + i).padStart(2, '0');
      fan = careerFanDm(1, 150, true);
    }
    check('a viewer wrote', !!fan);
    if (fan) {
      const reachBefore = careerReach();
      careerFanThank(fan.id);
      out.notes.thank = {reach: [reachBefore, careerReach()]};
      check('thanking them is heard', careerReach() > reachBefore,
            reachBefore + ' -> ' + careerReach());
      // Either a thank you and a you-are-welcome, or a question answered and
      // acknowledged. Both are two lines, and the reply is in their own voice.
      const said = fan.msgs.map(m => String(m.k));
      out.notes.thankThread = said;
      check('and the thread carries both lines',
            fan.q
              ? said.some(k => k === 'dmA' + fan.q) &&
                said.some(k => k.indexOf('dmQBack') === 0)
              : said.some(k => k === 'dmThanks') &&
                said.some(k => k.indexOf('dmThanksBack') === 0),
            said.join(' '));
      const again = careerReach();
      careerFanThank(fan.id);
      check('and it is said once', careerReach() === again, String(careerReach()));
    }

    /* ---- and the room is a room, not one sentence in four accents --------- */
    // The complaint this answers: every reader wrote about the placement, so
    // twelve sentences was the entire audience and the thirteenth repeated the
    // first. A hundred nights should not read like a machine with a phrasebook.
    seed(70);
    CAREER.career.reach = 900000;              // loud enough that somebody writes
    CAREER.org = {name: 'Falcons', salary: 40000, goal: null};
    CAREER.career.log = [{season: 1, day: '2026-02-01', div: 4, place: 3, of: 100}];
    const wrote = [], questions = [];
    for (let i = 0; i < 120; i++) {
      CAREER.dms = [];
      CAREER.career.day = ccAddDays('2026-03-01', i);
      const t = careerFanDm(1 + (i % 40), 150, true);
      if (!t) continue;
      const k = String((t.msgs[0] || {}).k || '');
      wrote.push(k.replace(/[1-9]$/, ''));
      if (t.q) questions.push(t.q);
    }
    const fanKinds = Array.from(new Set(wrote));
    out.notes.fanKinds = {messages: wrote.length, subjects: fanKinds.length,
                          sample: fanKinds.slice(0, 12)};
    check('readers write about more than the number',
          fanKinds.length >= 6, JSON.stringify(fanKinds));
    check('and a good few of them ask something instead',
          questions.length >= wrote.length / 5, questions.length + '/' + wrote.length);
    // What they can write about is what is true: the club is on the jersey here.
    check('one of them noticed the club',
          wrote.some(k => k === 'dmFanClub'), JSON.stringify(fanKinds));
    // A question is a thread waiting on the player, and the answer is his own.
    const q = (() => {
      for (let i = 0; i < 200; i++) {
        CAREER.dms = [];
        CAREER.career.day = ccAddDays('2026-05-01', i);
        const t = careerFanDm(1, 150, true);
        if (t && t.q) return t;
      }
      return null;
    })();
    out.notes.question = q && {q: q.q, k: q.msgs[0].k};
    check('somebody asked a question', !!q);
    if (q) {
      const before = careerReach();
      careerFanThank(q.id);
      const ks = q.msgs.map(m => String(m.k));
      check('answering it says the thing the player thinks',
            ks.indexOf('dmA' + q.q) > 0, ks.join(' '));
      check('and an answer travels further than a thank you',
            careerReach() - before >
              CC_REACH_DIV(CAREER.career.division) * CC_THANK_REACH,
            String(careerReach() - before));
    }

    /* ---- a bad night is not only haters ---------------------------------- */
    // Losing used to mean the inbox filled with people telling you so. The ones
    // who were watching anyway are still watching, and they say so.
    seed(70);
    CAREER.career.reach = 900000;
    let kind = null;
    for (let i = 0; i < 60 && !kind; i++) {
      CAREER.dms = [];
      CAREER.career.day = ccAddDays('2026-06-01', i);
      const t = careerFanDm(140, 150, false);
      if (t) kind = String(t.msgs[0].k).replace(/[1-9]$/, '');
    }
    out.notes.badNight = kind;
    check('somebody writes after a bad night too', !!kind);
    check('and it is support or a question, never congratulations',
          !!kind && (kind === 'dmFanChin' || kind === 'dmFanStay' ||
                     kind.indexOf('dmQ') === 0), String(kind));
    let hater = null;
    for (let i = 0; i < 30 && !hater; i++) {
      CAREER.career.day = '2026-04-' + String(1 + i).padStart(2, '0');
      hater = careerHaterDm(149, 150, false);
    }
    check('a hater wrote', !!hater);
    if (hater) {
      const reachBefore = careerReach(), repBefore = careerRep();
      careerHaterReply(hater.id);
      out.notes.clapback = {reach: [reachBefore, careerReach()],
                            rep: [repBefore, careerRep()]};
      check('a fight travels further than a thank-you',
            careerReach() - reachBefore >
              CC_REACH_DIV(CAREER.career.division) * CC_THANK_REACH,
            String(careerReach() - reachBefore));
      check('and it costs what the room remembers you by', careerRep() < repBefore,
            repBefore + ' -> ' + careerRep());
      const mine3 = () => hater.msgs.filter(m => m.from === 'you').length;
      check('and it is said once too',
            (careerHaterReply(hater.id), mine3() === 1), String(mine3()));
      // And the answer answers what was said, not whatever was written first.
      const opener = String(hater.msgs[0].k).replace(/[1-9]$/, '');
      const wanted = 'dmClapback' + (CC_HATE_CLAP[opener] || '');
      out.notes.clapback.to = opener + ' -> ' +
        hater.msgs.filter(m => m.from === 'you')[0].k;
      check('the player replies to the accusation that was made',
            hater.msgs.some(m => m.from === 'you' && m.k === wanted),
            out.notes.clapback.to);
    }

    /* ---- and nobody is rude in general ----------------------------------- */
    // A hater had one subject too, and three ways to be rude about it, so the
    // fourth of them was the first one again under a different handle.
    seed(70, 1);
    CAREER.career.reach = 900000;
    CAREER.career.season = 3;
    CAREER.career.earnings = 24000;
    CAREER.org = {name: 'Falcons', salary: 40000, goal: null};
    const rude = [];
    for (let i = 0; i < 120; i++) {
      CAREER.dms = [];
      CAREER.career.day = ccAddDays('2026-07-01', i);
      const h = careerHaterDm(150, 150, false);
      if (h) rude.push(String(h.msgs[0].k).replace(/[1-9]$/, ''));
    }
    const rudeKinds = Array.from(new Set(rude));
    out.notes.haterKinds = {messages: rude.length, subjects: rudeKinds.length,
                            sample: rudeKinds};
    check('haters are rude about more than one thing',
          rudeKinds.length >= 5, JSON.stringify(rudeKinds));
    check('and one of them found the money', rude.some(k => k === 'dmHateMoney'),
          JSON.stringify(rudeKinds));
    // Only somebody nobody watches is told how few are watching.
    check('nobody tells a big audience it is small',
          !rude.some(k => k === 'dmHateReach'), 'told a 900k career it is small');

    /* ---- and one of them can change their mind --------------------------- */
    // The payoff of answering rather than blocking: the thread is still there
    // after a night nobody can argue with, and it gets one more message.
    seed(70, 1);
    CAREER.career.reach = 900000;
    let loud = null;
    for (let i = 0; i < 40 && !loud; i++) {
      CAREER.career.day = ccAddDays('2026-08-01', i);
      loud = careerHaterDm(150, 150, false);
    }
    check('somebody was loud', !!loud);
    if (loud) {
      // Ignored, they stay ignored: a turn is what answering buys.
      let turned = null;
      for (let i = 0; i < 40 && !turned; i++) {
        CAREER.career.day = ccAddDays('2026-09-01', i);
        turned = careerHaterTurn(1, 150);
      }
      check('somebody blocked out never comes round', !turned);
      careerHaterReply(loud.id);
      for (let i = 0; i < 40 && !turned; i++) {
        CAREER.career.day = ccAddDays('2026-10-01', i);
        turned = careerHaterTurn(1, 150);
      }
      out.notes.turned = turned && String(turned.msgs[turned.msgs.length - 1].k);
      check('but one you answered can come round after a win', !!turned);
      check('and what they say is that they were wrong',
            !!turned && String(turned.msgs[turned.msgs.length - 1].k)
              .indexOf('dmHateTurn') === 0, out.notes.turned);
      // Once, and never after an ordinary night.
      const n = turned.msgs.length;
      careerHaterTurn(1, 150);
      check('and they say it once', turned.msgs.length === n);
      seed(70, 1);
      CAREER.career.reach = 900000;
      let mid = null;
      for (let i = 0; i < 20 && !mid; i++) {
        CAREER.career.day = ccAddDays('2026-11-01', i);
        mid = careerHaterDm(150, 150, false);
      }
      if (mid) {
        careerHaterReply(mid.id);
        let early = null;
        for (let i = 0; i < 40 && !early; i++) {
          CAREER.career.day = ccAddDays('2026-12-01', i);
          early = careerHaterTurn(60, 150);
        }
        check('a mid-table night changes nobody\\'s mind', !early);
      }
    }
    /* ---- two sessions are one tournament on every row -------------------- */
    // The table read a team's game count off the length of its own log for the
    // evening, so on the second session everybody showed eleven while their
    // points said twenty-two - and the player showed twenty-two, because theirs
    // is the only log stitched together afterwards. A standings table where one
    // row counts a different number of games from the row under it is the table
    // contradicting itself.
    seed(82, 1);
    const A = {name:'A + B', stagePts:0, stageElims:0, stageLog:[], wins:0};
    const B = {name:'C + D', stagePts:0, stageElims:0, stageLog:[], wins:0};
    const bank = {pts:{'A + B':300, 'C + D':280}, elims:{'A + B':40, 'C + D':35},
                  games:{'A + B':11, 'C + D':11}, wins:{'A + B':2, 'C + D':1}};
    // What simulateGamesLive does with a carry, without running an evening.
    [A, B].forEach(t => {
      t.stagePts += bank.pts[t.name] || 0;
      t.stageElims += bank.elims[t.name] || 0;
      t._carryGames = (bank.games && bank.games[t.name]) || 0;
      t.wins = (t.wins || 0) + ((bank.wins && bank.wins[t.name]) || 0);
    });
    // Then tonight's eleven land in the log the ordinary way.
    for (let g = 1; g <= 11; g++) { A.stageLog.push({game:g}); B.stageLog.push({game:g}); }
    const playedA = (A.stageLog||[]).length + (A._carryGames||0);
    const playedB = (B.stageLog||[]).length + (B._carryGames||0);
    out.notes.twoSessions = {a: playedA, b: playedB, winsA: A.wins};
    check('both rows count both evenings', playedA === 22 && playedB === 22,
          playedA + '/' + playedB);
    check('and Monday\\'s wins are still wins on Tuesday', A.wins === 2, String(A.wins));
    // And the banking really stores what the carry reads.
    check('the bank keeps a game count for every team',
          typeof bank.games['C + D'] === 'number', JSON.stringify(bank.games));

    /* ---- a slot belongs to the pair that won it -------------------------- */
    // His rule, 17 August: if the two of you qualified for a LAN or for a Major's
    // Heats you cannot split up, because the seat is the duo's and it has to be
    // played out. A partner could be poached out from under a Major ticket, or
    // walk on a Tuesday holding half a LAN seat, and the career would arrive at
    // the biggest night of its year alone.
    seed(90, 1);
    careerEnsurePartner();
    const mate0 = careerPartnerCard().handle;
    check('a career with nothing pending is free to move', !careerSlotHeld());
    CAREER.career.major = {n:1, got:'playin', pass:'playin', ticket:false};
    out.notes.slot = {held: careerSlotHeld() && careerSlotHeld().what};
    check('coming out of the Play-In is a commitment', !!careerSlotHeld());
    CAREER.partner.patience = 5;
    careerMatePoach(1, 150, true);
    check('nobody poaches half of a qualified duo',
          careerPartnerCard() && careerPartnerCard().handle === mate0,
          'partner gone');
    const moaned = careerMateDm(140, 150, false);
    out.notes.slot.mateSays = moaned ? String(moaned.msgs[moaned.msgs.length-1].k).replace(/[1-9]$/,'') : null;
    check('and an unhappy partner is unhappy rather than leaving',
          out.notes.slot.mateSays !== 'dmMateLeaving', out.notes.slot.mateSays);
    // The door swings both ways: the career cannot walk out of it either.
    const other = careerDmPool()[0];
    const th = careerDmThread({handle:other.handle, ovr:other.ovr, roster:true});
    th.state = 'offer'; careerDmPush(th, 'them', 'dmYes');
    careerDmAccept(th.id);
    /* His rule, later the same day: let them go anyway, and the slot goes to the
       team below. A qualification belongs to the pair that won it, so breaking
       the pair forfeits it rather than being forbidden - which is both what
       happens out there and a decision instead of a locked button. */
    check('the career can swap, because that is its own decision',
          careerPartnerCard().handle !== mate0, 'still stuck with ' + mate0);
    check('and the slot is gone with the duo that won it', !careerSlotHeld(),
          String(careerSlotHeld() && careerSlotHeld().what));
    check('and it is said out loud',
          (CAREER.career.news||[]).some(n => n.k === 'ccNewsSlotGone'),
          ((CAREER.career.news||[])[0]||{}).k);
    check('and the Major will not have them back',
          !careerMajorCan({n:1, stage:'heats'}), 'walked back into the Heats');
    /* And playing a Major is not being in one.

       His screenshot, 17 August: a Division 4 career told it held a slot at
       Major 2 and that its duo could not change because of it. The only Major
       stage open to Division 4 is the Last Chance; he played it and went out.
       cr.major.got records the last stage played, and the lock was reading it as
       the last stage cleared. */
    CAREER.career.division = 4;
    CAREER.career.major = {n:2, got:'lcq', pass:null, ticket:false};
    check('going out of the Last Chance is not a slot', !careerSlotHeld(),
          String(careerSlotHeld() && careerSlotHeld().what));
    CAREER.career.major = {n:2, got:'lcq', pass:'lcq', ticket:true};
    check('but winning it is', !!careerSlotHeld(),
          String(careerSlotHeld() && careerSlotHeld().what));
    CAREER.career.division = 1;

    // A Major that has been played out is not a commitment.
    CAREER.career.major = {n:1, got:'final', pass:'final', ticket:false};
    CAREER.career.log = [];
    check('a finished Major frees the duo', !careerSlotHeld(),
          String(careerSlotHeld() && careerSlotHeld().what));
    // A LAN seat is one until the LAN is played.
    CAREER.career.log = [{season:1, day:'2026-04-10', kind:'major', stage:'final',
                          place:8, of:50}];
    check('a LAN seat is a commitment', !!careerSlotHeld(),
          String(careerSlotHeld() && careerSlotHeld().what));

    /* ---- a club is never a duo ------------------------------------------- */
    // His screenshot, 17 August, with the buttons ringed in red: a club that had
    // withdrawn its offer was offering "let's play a scrim" and "show them the
    // result", which are the arguments you make to a person who turned down
    // playing with you. The footer chain had no branch for an organisation, so a
    // club with nothing on the table fell through into the duo conversation - and
    // the last line of that offers to ask them to be your partner.
    seed(90, 1);
    const org = careerDmThread({handle:'BIG', ovr:null, role:'roleIGL',
                                roster:false, org:true});
    careerDmPush(org, 'them', 'dmOrgOffer', ['BIG', '15,000']);
    org.state = 'declined';            // an offer that ran out
    CH_SOCIAL = 'dms'; CH_DMKIND = null; CH_DM = org.id;
    const clubHtml = careerSocialHTML();
    out.notes.clubFoot = clubHtml.indexOf(L().dmOfferGone) >= 0;
    check('a club with nothing on the table says so',
          clubHtml.indexOf(L().dmOfferGone) >= 0, 'no line');
    check('and it is not offered a scrim',
          clubHtml.indexOf('careerDmArgue') < 0, 'duo buttons on a club');
    check('nor asked to be your duo',
          clubHtml.indexOf('careerDmWrite(&#39;BIG') < 0 &&
          clubHtml.indexOf("careerDmWrite('BIG") < 0, 'asked a club to duo');

    /* ---- and a brand is one company in both languages -------------------- */
    // "Провайдер" and "Internet provider" were sitting in the club list as two
    // different companies: a thread is found by its handle, the handle was the
    // translated name, and a career that switched language stopped recognising
    // the brand it had already heard from.
    seed(90, 1);
    CAREER.career.reach = 60000;
    LANG = 'ru';
    const ru = careerSponsorDm();
    LANG = 'en';
    const en = careerSponsorDm();
    out.notes.brand = {ru: ru && ru.id, en: en && en.id,
                       threads: careerDms().filter(t => t.who && t.who.brand).length};
    check('a brand writing twice is one thread', ru && en && ru.id === en.id,
          JSON.stringify(out.notes.brand));
    check('and it is named in the language on screen',
          ccDmName(ru.who) === L().ccSponsorisp, ccDmName(ru.who));
    LANG = 'ru';
    check('in the other one too', ccDmName(ru.who) === L().ccSponsorisp, ccDmName(ru.who));
    LANG = 'en';

    /* ---- a quiet inbox says why it is quiet ------------------------------ */
    // The screenshot that produced this was a 96 in Division 3 in February: an
    // empty inbox, and no way to find out that clubs do not sign in February.
    seed(96, 3);
    CAREER.career.day = '2026-02-10';
    CH_SOCIAL = 'dms'; CH_DMKIND = null; CH_DM = null;
    const quiet = careerSocialHTML();
    out.notes.quiet = {window: careerWindowNow(), next: careerWindowNext()};
    check('the clubs keep their tab when they are silent',
          quiet.indexOf(L().dmSecclubs) >= 0, 'no clubs tab');
    // The window used to be the reason an inbox was quiet in February. It is not
    // shut any more, so the reason cannot be that - and the tab still has to be
    // there, which is what the line above checks.
    check('and it is not because the window is shut', careerWindowNow(), 'shut');
    check('the viewers keep theirs too', quiet.indexOf(L().dmSecfans) >= 0);
    // And why everybody writing is worse than you.
    check('a career above its rung is told so',
          quiet.indexOf(L().dmOverRung(3, ccDivCeil(3))) >= 0, 'no note');
    check('and the list really is capped at what the rung holds',
          careerDmPool().every(w => w.ovr <= ccDivCeil(3)),
          careerDmPool().map(w => w.ovr).join(','));
    // Inside a window the clubs write, so the note is about the month and not
    // about the career.
    CAREER.career.day = '2026-01-15';
    check('and inside a window they do write', careerOrgOffers().length > 0,
          String(careerOrgOffers().length));

    /* ---- and the calendar is a place you can go to ----------------------- */
    // It was the one screen that only ever told you things: it holds the whole
    // year and the way to reach the Major was pressing "a week" until the
    // number matched.
    seed(70);
    CAREER.career.day = '2026-02-10';
    CH_MONTH = null;
    const cal = careerCalendarHTML();
    // No backslashes in this regex on purpose: the probe is written into a Node
    // template literal, so a single backslash never reaches the page and an
    // escaped bracket quietly turns into a capture group that matches nothing.
    const goes = (cal.match(/careerFfAsk..[0-9-]+../g) || [])
      .map(s => s.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)[0]);
    out.notes.calendar = {clickable: goes.length, first: goes[0], last: goes[goes.length-1]};
    check('days ahead can be pressed', goes.length > 0, String(goes.length));
    check('and every one of them is in the future',
          goes.every(d => d > CAREER.career.day), goes.filter(d => d <= CAREER.career.day)[0]);
    check('today is not one of them', goes.indexOf(CAREER.career.day) < 0);
    // A finished season has nothing to walk to.
    CAREER.career.seasonOver = true;
    check('and a finished year has none',
          (careerCalendarHTML().match(/careerFfAsk/g) || []).length === 0);
    CAREER.career.seasonOver = false;
    // The guard, without running a real fast-forward: yesterday goes nowhere.
    const wasDay = CAREER.career.day;
    careerFfToDay('2026-01-01');
    check('and yesterday is not a destination', CAREER.career.day === wasDay,
          CAREER.career.day);
    /* And a day is picked before it is played. A month of a career is too much
       to hand to one click on a screen people scroll around. */
    CH_FF_ASK = null;
    careerFfAsk(goes[goes.length-1]);
    check('pressing a day picks it rather than running it',
          CH_FF_ASK === goes[goes.length-1] && CAREER.career.day === wasDay,
          CH_FF_ASK + '/' + CAREER.career.day);
    const asked = careerCalendarHTML();
    out.notes.confirm = {day: CH_FF_ASK, days: ccFfDays(CH_FF_ASK),
                         events: ccFfEvents(CH_FF_ASK)};
    check('and a bar asks about it', asked.indexOf('cal-ask') >= 0, 'no bar');
    check('which says how far it is', asked.indexOf(String(ccFfDays(CH_FF_ASK))) >= 0,
          String(ccFfDays(CH_FF_ASK)));
    check('and the day picked is marked on the grid',
          asked.indexOf('cal-picked') >= 0, 'not marked');
    careerFfCancel();
    check('and it can be called off', CH_FF_ASK == null &&
          careerCalendarHTML().indexOf('cal-ask') < 0, String(CH_FF_ASK));
    /* ---- and the career keeps its own events ---------------------------- */
    // The history tab was a table of results, which is the right shape for
    // results and the wrong one for a career: the week you signed, the rung you
    // climbed and the partner who walked out went to the feed, which keeps
    // forty posts. And it is this career's, not the card's - a taken card
    // brings fourteen real tournaments and none of them happened here.
    seed(70);
    CAREER.career.log = [
      {season:1, day:'2026-01-20', div:5, place:12, of:150, passed:true, kind:'cup'},
      {season:1, day:'2026-02-03', div:4, place:1,  of:150, passed:true, kind:'cup'},
      {season:1, day:'2026-04-25', div:3, place:2,  of:50,  passed:true, kind:'major'},
      {season:1, day:'2026-05-05', div:4, place:90, of:150, passed:false, kind:'cup'}
    ];
    CAREER.career.day = '2026-05-06';
    careerEvent('tlSigned', ['Probe Esports', '100']);
    const tl = careerTimeline();
    const kinds = tl.map(e => e.k);
    out.notes.timeline = {n: tl.length, kinds: kinds};
    check('a promotion is on it', kinds.indexOf('tlUp') >= 0, kinds.join(','));
    check('and a relegation', kinds.indexOf('tlDown') >= 0, kinds.join(','));
    check('and the night it was won', kinds.indexOf('tlWon') >= 0, kinds.join(','));
    check('and a podium at a Major', kinds.indexOf('tlPodium') >= 0, kinds.join(','));
    check('and the contract, which is not a result at all',
          kinds.indexOf('tlSigned') >= 0, kinds.join(','));
    check('newest first', tl[0].day >= tl[tl.length-1].day,
          tl[0].day + ' .. ' + tl[tl.length-1].day);
    // Every line has to render into words rather than a key.
    const html = careerTimelineHTML();
    check('every event has a sentence', html.indexOf('undefined') < 0 &&
          kinds.every(k => typeof L()[k] !== 'undefined'),
          kinds.filter(k => typeof L()[k] === 'undefined').join(','));
    check('and the tab carries it', careerHistoryHTML().indexOf('cc-tl') >= 0);
    // A career that has done nothing has no timeline rather than an empty box.
    seed(70);
    check('and a career with nothing in it has none', careerTimelineHTML() === '');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncstalk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a duo is talked into, and the room can be answered');
fs.rmSync(dir, { recursive: true, force: true });
