// The room, both halves of it, and the mark on the hub that says it spoke.
//
// Two things on this hub are addressed to the player — the inbox, and a feed
// Division 1 writes to every Saturday whether the career is in it or not — and
// both of them lived behind one tab with one dot for the first and nothing for
// the second. This checks the notifications tile that fixes that, and the
// haters, who are the half of an audience the inbox never held.
//
//   node tools/check-career-notes.js
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
    const fresh = reach => {
      CAREER = {player: {nick:'Probe', ovr:82, region:'EU', country:'de', countryPing:1,
                         age:16, role:'roleIGL', attrs:ccRookieAttrs(82,'roleIGL'), source:'rookie'},
        career: {season:1, day:'2026-02-10', division:1, balance:0, earnings:0,
                 reach, log:[], news:[], newsN:0, newsSeen:0},
        partner:null, gear:{own:[], train:0}, dms:[]};
      CH_DM = null; CH_SOCIAL = null;
    };

    /* ---- Haters ---------------------------------------------------------- */

    // A night at the bottom of a room, read by a hundred thousand people. Ten
    // of them, so a probability is measured rather than a coin flip.
    fresh(150000);
    let wrote = 0;
    for (let i = 0; i < 10; i++) {
      CAREER.dms = [];
      CAREER.career.day = '2026-02-' + String(10 + i).padStart(2, '0');
      if (careerHaterDm(140, 150, false)) wrote++;
    }
    out.notes.hatersIn10 = wrote;
    check('a big audience writes after a bad night', wrote > 0, String(wrote));

    // And never after a good one, whatever the audience is.
    fresh(150000);
    let goodNight = 0;
    for (let i = 0; i < 10; i++) {
      CAREER.dms = [];
      CAREER.career.day = '2026-02-' + String(10 + i).padStart(2, '0');
      if (careerHaterDm(3, 150, true)) goodNight++;
    }
    check('nobody is unpleasant about a podium', goodNight === 0, String(goodNight));

    // Nobody writes to a career nobody is reading.
    fresh(0);
    let unread = 0;
    for (let i = 0; i < 10; i++) {
      CAREER.dms = [];
      CAREER.career.day = '2026-02-' + String(10 + i).padStart(2, '0');
      if (careerHaterDm(140, 150, false)) unread++;
    }
    check('an audience of nobody has no haters', unread === 0, String(unread));

    // What a hater thread is: its own pile, no rating, nothing that moves a
    // number, and one button that is an answer.
    fresh(150000);
    let t = null;
    for (let i = 0; i < 30 && !t; i++) {
      CAREER.career.day = '2026-03-' + String(1 + i).padStart(2, '0');
      t = careerHaterDm(149, 150, false);
    }
    check('a hater thread was built at all', !!t);
    if (t) {
      check('it is marked as one', t.who.hater === true);
      check('it carries no rating', t.who.ovr == null, String(t.who.ovr));
      check('it says something about the night', (t.msgs[0].a || [])[1] === 150,
            JSON.stringify(t.msgs[0].a));
      check('and it arrives unread', t.unread === true);
      const html = careerSocialHTML();
      check('the inbox gives them their own heading', html.indexOf(L().dmSechaters) >= 0);
      check('the row does not print a null rating', html.indexOf('<i>null</i>') < 0);
      CH_DM = t.id;
      const thread = careerSocialHTML();
      check('and the thread offers the block button', /dm-foot-hate/.test(thread) &&
            thread.indexOf(L().dmBlock) >= 0);
      careerDmClose(t.id);
      check('blocking removes it', careerDms().length === 0, String(careerDms().length));
    }

    /* ---- Notifications --------------------------------------------------- */

    fresh(50000);
    check('a quiet career has no tile', careerNotesHTML() === '', 'tile drawn');
    check('and no count', careerNotesN() === 0, String(careerNotesN()));

    // Your own week is not a notification about you.
    careerNews('good', 'ccNewsRating', [82, 83]);
    check('your own post does not notify you', careerNotesN() === 0, String(careerNotesN()));

    // Division 1 playing without you is.
    careerNews('flat', 'ccPostPlaced', [1, 1, 'mate', 4],
               {by:{name:'Podasai', ovr:94}});
    careerNews('flat', 'ccNewsD1Table', [7]);
    out.notes.count = careerNotesN();
    check('the room above is', careerNotesN() === 2, String(careerNotesN()));
    const tile = careerNotesHTML();
    check('the tile is drawn', /cc-notes/.test(tile));
    check('it names who posted', tile.indexOf('Podasai') >= 0);
    check('and counts them', tile.indexOf('>' + careerNotesN() + '<') >= 0);

    // A message waiting counts too, and leads the list.
    const dm = careerDmThread({handle:'Vanyak', ovr:90, roster:false});
    careerDmPush(dm, 'them', 'dmNoPartner', [90]);
    check('an unread message counts', careerNotesN() === 3, String(careerNotesN()));
    const both = careerNotesHTML();
    check('and it leads the list', both.indexOf('Vanyak') < both.indexOf('Podasai'),
          both.indexOf('Vanyak') + ' vs ' + both.indexOf('Podasai'));

    // Opening the socials clears the feed's mark and nothing else: a thread is
    // read when it is opened, not when the tab is.
    careerNotesSeen();
    check('opening the socials clears the feed', careerNewsNew().length === 0,
          String(careerNewsNew().length));
    check('but not the message', careerNotesN() === 1, String(careerNotesN()));
    careerDmOpen(dm.id);
    check('opening the thread clears that', careerNotesN() === 0, String(careerNotesN()));
    check('and the tile is gone', careerNotesHTML() === '', 'tile drawn');

    // A save written before the mark existed starts level rather than
    // announcing forty posts it has already scrolled past.
    fresh(0);
    for (let i = 0; i < 12; i++) careerNews('flat', 'ccNewsD1Table', [i]);
    delete CAREER.career.newsSeen;
    careerNotesMigrate();
    check('an old save starts level', careerNotesN() === 0, String(careerNotesN()));

    /* ---- one of each kind before three of any ---------------------------- */
    // A night can produce four different kinds of message at once - a club with
    // an offer on it, a duo answering, a viewer, and somebody being unpleasant.
    // Taking the first three by arrival could hide the only one with a decision
    // on it.
    fresh(50000);
    const mk = (who, key) => {
      const t = careerDmThread(who);
      careerDmPush(t, 'them', key, [1, 150]);
      return t;
    };
    // Deliberately worst case: the club arrives last.
    mk({handle:'Hater1', ovr:null, roster:false, hater:true}, 'dmHateFlop');
    mk({handle:'Fan1', ovr:null, roster:false, fan:true}, 'dmFanWin');
    mk({handle:'Duo1', ovr:88, roster:false, card:{handle:'Duo1'}}, 'dmNoPartner');
    const club = careerDmThread({handle:'Probe Esports', ovr:80, roster:false, org:true});
    club.offer = {name:'Probe Esports', salary:1000, tier:80, goal:{type:'cut'}};
    careerDmPush(club, 'them', 'dmOrgMain', ['Probe Esports', '1,000']);
    const kindTile = careerNotesHTML();
    out.notes.kinds = ['club', 'duo', 'hater', 'fan']
      .filter(k => kindTile.indexOf('cc-note-' + k) >= 0);
    check('the club with terms on it is on the tile',
          kindTile.indexOf('cc-note-club') >= 0, 'club missing');
    check('and so is the duo', kindTile.indexOf('cc-note-duo') >= 0, 'duo missing');
    check('and the hater', kindTile.indexOf('cc-note-hater') >= 0, 'hater missing');
    check('and the viewer', kindTile.indexOf('cc-note-fan') >= 0, 'fan missing');
    check('the club leads, because it is the one with a decision on it',
          kindTile.indexOf('cc-note-club') < kindTile.indexOf('cc-note-fan'),
          kindTile.indexOf('cc-note-club') + ' vs ' + kindTile.indexOf('cc-note-fan'));
    check('and an offer says so rather than saying club',
          kindTile.indexOf(L().ccOffers) >= 0, L().ccOffers);

    /* ---- and each kind is its own inbox ---------------------------------- */
    // The side column stacked all four piles under each other, which is right
    // for six conversations and wrong for fourteen: finding the one hater who
    // wrote last night meant scrolling past everybody who wants to play.
    CH_SOCIAL = 'dms'; CH_DMKIND = null; CH_DM = null;
    const all = careerSocialHTML();
    out.notes.tabs = (all.match(/<button class="dm-tab/g) || []).length;
    check('there is a tab per kind and one for all',
          (all.match(/<button class="dm-tab/g) || []).length === 5,
          String((all.match(/<button class="dm-tab/g) || []).length));
    check('and all of them are listed at once by default',
          all.indexOf('Hater1') >= 0 && all.indexOf('Fan1') >= 0 &&
          all.indexOf('Duo1') >= 0 && all.indexOf('Probe Esports') >= 0);
    careerDmKind('haters');
    const only = careerSocialHTML();
    check('one kind shows only that kind',
          only.indexOf('Hater1') >= 0 && only.indexOf('Fan1') < 0 &&
          only.indexOf('Duo1') < 0, 'filter leaked');
    check('and the thread pane opens something from it',
          only.indexOf('dm-head') >= 0 && only.indexOf('Hater1') >= 0);
    // Switching away from the pile you were reading closes the thread rather
    // than leaving a club open under the viewers tab.
    CH_DMKIND = null; CH_DM = club.id;
    careerDmKind('fans');
    check('switching pile lets go of a thread from another one', CH_DM == null,
          String(CH_DM));
    // And a notification always lands somewhere it can be seen.
    careerDmKind('fans');
    careerOpenNote(club.id);
    check('a notification opens its own conversation whatever tab was up',
          CH_DMKIND == null && CH_DM === club.id, CH_DMKIND + '/' + CH_DM);
    CH_DMKIND = null; CH_DM = null;
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsnotes-'));
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
console.log('the room has two halves, and the hub says when either one spoke');
fs.rmSync(dir, { recursive: true, force: true });
