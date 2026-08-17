// Three careers instead of one.
//
// The mode held exactly one save, so trying a different player — a different
// country, an older beginner, a different starting division — meant deleting
// the career you had.
//
// What this holds: three slots that do not read each other's saves, the tile
// opening the one you played last, the old single save carried into the first
// slot rather than left behind, and deleting one leaving the others alone.
//
//   node tools/check-career-slots.js
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
  const save = (nick, div, ovr) => JSON.stringify({
    v:1,
    player:{nick:nick, age:16, source:'rookie', country:'de', countryPing:15,
            closeRangeEdge:0, region:'EU', ovr:ovr, role:'roleIGL',
            attrs:ccRookieAttrs(ovr,'roleIGL'), ageEdge:0, photo:null,
            handle:null, cardRegion:null, nat:null},
    career:{season:1, day:'2026-02-02', division:div, earnings:div*100, balance:0,
            reach:0, tokens:[], log:[]},
    partner:null
  });
  try {
    // ---- the save that already exists is the first career ----------------
    // Nothing is migrated: slot 1's key is the key the mode has always
    // written, so a career played before slots existed is simply there.
    localStorage.clear();
    localStorage.setItem('fncsdraft_career', save('Legacy', 4, 62));
    const one = ccSlotCard(1);
    out.notes.legacy = one && {nick: one.nick, div: one.div};
    check('the save that existed is the first career', !!one && one.nick === 'Legacy');
    check('and the tile opens it', ccSlot() === 1, String(ccSlot()));
    check('it is still under the key it was always under',
          LS_SLOT(1) === 'fncsdraft_career', LS_SLOT(1));
    careerLoad();
    check('loading it gives that career', CAREER && CAREER.player.nick === 'Legacy',
          CAREER && CAREER.player.nick);
    check('and the new slots do not collide with it',
          LS_SLOT(2) !== LS_SLOT(1) && LS_SLOT(3) !== LS_SLOT(1) && LS_SLOT(2) !== LS_SLOT(3));

    // ---- three careers, side by side -------------------------------------
    localStorage.clear();
    localStorage.setItem('fncsdraft_career', save('One', 5, 55));
    localStorage.setItem('fncsdraft_career_s2', save('Two', 3, 70));
    localStorage.setItem('fncsdraft_career_s3', save('Three', 1, 88));
    const cards = [1,2,3].map(n => ccSlotCard(n));
    out.notes.slots = cards.map(c => c && (c.nick + '/' + c.div + '/' + c.ovr));
    check('all three are readable and different',
          cards[0].nick === 'One' && cards[1].nick === 'Two' && cards[2].nick === 'Three');
    check('and a card says what the career is without opening it',
          cards[2].div === 1 && cards[2].ovr === 88 && cards[2].earnings === 100,
          JSON.stringify(cards[2]));

    // Loading one loads that one, and saving writes back to it alone.
    ccSlotUse(2);
    careerLoad();
    check('opening the second gives the second', CAREER.player.nick === 'Two',
          CAREER.player.nick);
    CAREER.career.division = 2;
    careerSave();
    check('and saving it leaves the others where they were',
          ccSlotCard(1).div === 5 && ccSlotCard(3).div === 1 && ccSlotCard(2).div === 2,
          [1,2,3].map(n => ccSlotCard(n).div).join(','));

    // ---- deleting one ----------------------------------------------------
    // Two presses: the first arms, the second deletes. One press must not.
    careerRenderSlots();
    careerSlotDrop(3);
    check('one press does not delete a career', !!ccSlotCard(3));
    careerSlotDrop(3);
    check('the second press does', !ccSlotCard(3));
    check('and the other two are untouched', !!ccSlotCard(1) && !!ccSlotCard(2));
    // Arming one and then pressing another must not delete the second outright.
    careerSlotDrop(1);
    careerSlotDrop(2);
    check('arming one career does not arm the next', !!ccSlotCard(2) && !!ccSlotCard(1),
          [1,2].map(n => !!ccSlotCard(n)).join(','));

    // ---- the picker draws what is there ----------------------------------
    ccSlotUse(1);
    careerRenderSlots();
    const grid = document.getElementById('ccSlotGrid');
    const cells = grid.querySelectorAll('.cc-slot');
    const empties = grid.querySelectorAll('.cc-slot-empty');
    out.notes.drawn = {cells: cells.length, empty: empties.length,
                       here: grid.querySelectorAll('.cc-slot.on').length};
    check('the picker draws a card per slot', cells.length === CC_SLOTS, String(cells.length));
    check('the deleted one is drawn as empty', empties.length === 1, String(empties.length));
    check('and the open one is marked',
          grid.querySelectorAll('.cc-slot.on').length === 1);
    check('an empty slot offers to start a career',
          /onclick="careerSlotNew/.test(grid.innerHTML));

    // ---- entering with an empty active slot ------------------------------
    // The tile used to go straight to the create screen. With another career
    // sitting in slot 1, that would quietly start a third instead of offering
    // the one that exists.
    ccSlotUse(3);
    careerEntry();
    // A screen is shown by the 'active' class, not by an inline style.
    const shown = SHOWN_SCREEN;
    out.notes.entered = shown;
    check('an empty slot with careers elsewhere opens the picker',
          shown === 'screen-career-slots', shown);
    // And with nothing at all it still goes straight to creating one.
    localStorage.clear();
    careerEntry();
    check('no careers at all still goes straight to making one',
          SHOWN_SCREEN === 'screen-career-create', SHOWN_SCREEN);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsslot-'));
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
console.log('three careers, side by side, and the old save carried into the first');
fs.rmSync(dir, { recursive: true, force: true });
