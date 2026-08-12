// The realistic simulation's whole risk is the mode that already worked. This
// starts a draft run with REALISTIC off and checks that the screen is the pack
// it has always been: four player cards to choose from, a working reroll, and a
// lobby of assembled teams.
//
//   node tools/check-draft-unchanged.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__draft" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    pendingSize = 2; pendingMajor = false; pendingCards = true;
    pendingCardSet = 'm2'; pendingMapSet = 'm2';
    preSelectedRegions = ['EU']; preSelectedYears = [];
    REALISTIC = false;
    startDraft(2, false);
    out.packCards = document.querySelectorAll('#candidates .pick-btn').length;
    out.pickerBarShown = document.getElementById('teamPickBar').style.display !== 'none';
    out.rerollShown = document.getElementById('rerollBtn').style.display !== 'none';
    out.drafted = drafted.length;
    // One pick takes one player, not a roster.
    pick(currentCandidates[0]);
    out.afterPick = drafted.length;
  } catch (e) { out = {error: String(e && e.stack || e)}; }
  document.getElementById('__draft').textContent =
    'BEGINDRAFT' + encodeURIComponent(JSON.stringify(out)) + 'ENDDRAFT';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsdraftchk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINDRAFT([\s\S]*?)ENDDRAFT/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

const fails = [];
if (out.packCards !== 4) fails.push('the player pack offered ' + out.packCards + ' cards, not 4');
if (out.pickerBarShown) fails.push('the team picker is on screen in a draft run');
if (!out.rerollShown) fails.push('the reroll button is missing from a draft run');
if (out.drafted !== 0) fails.push('a draft run started with ' + out.drafted + ' players already picked');
if (out.afterPick !== 1) fails.push('one pick drafted ' + out.afterPick + ' players, not 1');

console.log('\n  pack cards ' + out.packCards + ' · reroll ' + (out.rerollShown ? 'on' : 'off') +
            ' · picked ' + out.afterPick + ' of 2');
if (fails.length) { fails.forEach(f => console.error('  FAIL ' + f)); process.exit(1); }
console.log('\n  draft mode is the mode it was\n');
