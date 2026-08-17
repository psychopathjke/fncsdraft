// Training one attribute, ten days running, read off the card the player reads.
//
// His card, 17 August: AIM 75 while everything else sat at 88-89, and pressing
// the aim session moved nothing. So this presses the button the way the day
// screen does and prints both numbers — the one in the save and the one on the
// card — because those are two different numbers and only the second is the one
// he is looking at.
//
//   node tools/check-career-train.js
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
    const seed = (ovr, role, div) => { CAREER = {
      player:{nick:'Trainee', ovr:ovr, region:'EU', role:role, country:'de', age:16,
              attrs:ccRookieAttrs(ovr, role), ovrExact:ovr},
      career:{season:1, day:'2026-01-20', division:div||5, earnings:0, balance:0,
              tokens:[], log:[], news:[], energy:999},
      dms:[], partner:null, gear:{own:[], train:0}};
      // ccRookieAttrs builds the six around the rating and lands within half a
      // point of it, so the rating is read back off them: otherwise the first
      // day is measured from a number the card does not hold.
      CAREER.player.ovrExact = ATTR_KEYS.reduce((s,k)=>s+CAREER.player.attrs[k]*ATTR_W[k], 0); };
    const cardAttr = k => { const c = careerCard(); const a = attrsFor(c); return a[k.toLowerCase()]; };
    const train = (id, days) => {
      for (let i = 0; i < days; i++) {
        CAREER.career.day = ccAddDays(CAREER.career.day, 1);
        CAREER.career.energy = careerEnergyMax();
        if (CAREER.career.did) delete CAREER.career.did[CAREER.career.day];
        careerDoAct(id);
      }
    };

    // ---- a rookie, ten days on aim ---------------------------------------
    seed(54, 'roleIGL');
    const a0 = {save: CAREER.player.attrs.aim, card: cardAttr('aim'), ovr: CAREER.player.ovrExact};
    train('trAim', 10);
    const a1 = {save: CAREER.player.attrs.aim, card: cardAttr('aim'), ovr: CAREER.player.ovrExact};
    out.notes.rookieAim = {before: a0, after: a1};
    // Half a point a day on the stat itself — his number, said literally.
    check('ten aim days are five points of aim',
          Math.abs((a1.save - a0.save) - 5) < 0.05, a0.save + ' -> ' + a1.save);
    check('and the card shows it', Math.abs((a1.card - a0.card) - 5) <= 1,
          a0.card + ' -> ' + a1.card);
    // And the rating moves by the stat's own weight, which is what makes the six
    // buttons different from each other.
    check('and the rating by aim’s own weight',
          Math.abs((a1.ovr - a0.ovr) - 5*ATTR_W.aim) < 0.05, a0.ovr + ' -> ' + a1.ovr);

    // ---- his own card: a built IGL up at 84 in Division 1 -----------------
    seed(84, 'roleIGL', 1);
    const b0 = {save: CAREER.player.attrs.aim, card: cardAttr('aim'),
                ovr: CAREER.player.ovrExact, end: cardAttr('end'), clu: cardAttr('clu')};
    train('trAim', 10);
    const b1 = {save: CAREER.player.attrs.aim, card: cardAttr('aim'),
                ovr: CAREER.player.ovrExact, end: cardAttr('end'), clu: cardAttr('clu')};
    out.notes.highAim = {before: b0, after: b1};
    check('the same ten days move an 84 as well',
          Math.abs((b1.save - b0.save) - 5) < 0.05, b0.save + ' -> ' + b1.save);
    check('and his card shows it too', Math.abs((b1.card - b0.card) - 5) <= 1,
          b0.card + ' -> ' + b1.card);
    check('the card and the save agree to the point', Math.abs(b1.card - b1.save) <= 1,
          b1.save + ' in the save, ' + b1.card + ' on the card');
    // And a maxed attribute is not a day to spend: the button says so rather
    // than taking the energy for a number that cannot move.
    CAREER.player.attrs.aim = 99;
    const panel = careerDayPanelHTML(null);
    check('a session on a maxed attribute is shut', panel.indexOf(L().ccAttrMaxed) >= 0);
    const held = CAREER.player.attrs.aim;
    CAREER.career.energy = careerEnergyMax();
    CAREER.career.day = ccAddDays(CAREER.career.day, 1);
    careerDoAct('trAim');
    check('and 99 is 99', CAREER.player.attrs.aim === held, String(CAREER.player.attrs.aim));
    // The others must not move: one session is one attribute.
    check('training aim does not move endgame', Math.abs(b1.end - b0.end) <= 1,
          b0.end + ' -> ' + b1.end);
    check('nor clutch', Math.abs(b1.clu - b0.clu) <= 1, b0.clu + ' -> ' + b1.clu);

    // ---- a save that never had the six numbers ---------------------------
    // Old saves carry attrs:null. Training read them, found nothing, and did
    // nothing at all — silently, for the whole career.
    seed(60, 'roleFRG');
    CAREER.player.attrs = null;
    const c0 = CAREER.player.ovrExact;
    train('trAim', 4);
    out.notes.oldSave = {ovr: c0 + ' -> ' + CAREER.player.ovrExact,
                         attrs: !!CAREER.player.attrs};
    check('a save with no attributes builds them rather than ignoring the day',
          !!CAREER.player.attrs);
    check('and that day is worth something', CAREER.player.ovrExact > c0);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncstrain-'));
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
console.log('a session moves the attribute it is for, on the card as well as in the save');
fs.rmSync(dir, { recursive: true, force: true });
