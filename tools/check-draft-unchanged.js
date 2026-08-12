// The realistic simulation's whole risk is the mode that already worked. This
// starts a draft run with REALISTIC off and checks that the screen is the pack
// it has always been: four player cards to choose from, a working reroll, the
// mode's own name in the badge, and no trace of the team picker anywhere.
//
// It checks that twice. The second time it first opens a realistic run, walks
// away from it at the picker without taking a team, and only then starts the
// draft run — because that is the sequence every leaked global on this branch
// has lived in. Two bugs were found there before this file was written (the
// pack caption, and the roster lost on a language switch) and a third after it
// (the picker itself left on screen with its Take buttons still bound), so the
// abandoned-realistic-run path is a standing assertion rather than a one-off.
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
    function startPlainDraft(){
      pendingSize = 2; pendingMajor = false; pendingCards = true;
      pendingCardSet = 'm2'; pendingMapSet = 'm2';
      preSelectedRegions = ['EU']; preSelectedYears = [];
      REALISTIC = false;
      startDraft(2, false);
    }
    // Everything a draft run's screen is, in one reading, so both scenarios are
    // held to the same standard rather than to whichever half was remembered.
    function snapshot(){
      var box = document.getElementById('teamPickSearch');
      return {
        packCards: document.querySelectorAll('#candidates .pick-btn').length,
        // The picker's own rows, which carry the Take buttons. In a draft run
        // there must be none: a Take button drafts a whole roster, and with
        // REALISTIC false draftedEnough() counts players, so the run would end
        // after one loot round with half the lobby's loadout.
        teamRows: document.querySelectorAll('#candidates .team-row').length,
        pickerBarShown: document.getElementById('teamPickBar').style.display !== 'none',
        candidatesDisplay: document.getElementById('candidates').style.display,
        searchValue: box.value,
        searchBound: !!box.oninput,
        teamPickListLen: teamPickList.length,
        rerollShown: document.getElementById('rerollBtn').style.display !== 'none',
        badge: document.getElementById('topBadge').textContent,
        currentCandidates: currentCandidates.length,
        drafted: drafted.length,
        realistic: REALISTIC
      };
    }

    // What the badge must say, and what it must not. It carries
    // data-i18n="badgeMode", so the applyStaticI18n() this branch added to
    // startDraft rewrote it to the generic "select mode" on every single run
    // until the assignment was moved below that call.
    out.badgeGeneric = L().badgeMode;

    // 1. a draft run, cold.
    startPlainDraft();
    out.badgeExpected = cardSetName(CARD_SET) + ' \\u00b7 ' + regionName('EU');
    out.a = snapshot();
    pick(currentCandidates[0]);
    out.a.afterPick = drafted.length;

    // 2. a realistic run abandoned at the picker, then a draft run.
    REALISTIC = true;
    startDraft(2, false);
    out.abandoned = {
      realistic: REALISTIC,
      pickerBarShown: document.getElementById('teamPickBar').style.display !== 'none',
      teamRows: document.querySelectorAll('#candidates .team-row').length,
      teamPickListLen: teamPickList.length,
      searchBound: !!document.getElementById('teamPickSearch').oninput
    };
    // Type into the search box, so the leak has something to leak, then walk
    // away without taking a team.
    document.getElementById('teamPickSearch').value = 'sk';
    document.getElementById('teamPickSearch').oninput();
    show('screen-mode');

    startPlainDraft();
    out.b = snapshot();
    pick(currentCandidates[0]);
    out.b.afterPick = drafted.length;
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

function checkDraftRun(where, s) {
  const at = ' (' + where + ')';
  if (s.realistic) fails.push('the run is still flagged realistic' + at);
  if (s.packCards !== 4) fails.push('the player pack offered ' + s.packCards + ' cards, not 4' + at);
  if (s.currentCandidates !== 4)
    fails.push('currentCandidates holds ' + s.currentCandidates + ' cards, not 4' + at +
      ' — the pack on screen and the pack in memory are not the same pack');
  if (s.teamRows) fails.push(s.teamRows + ' team-picker rows are on screen, each with a live Take ' +
    'button that drafts a whole roster' + at);
  if (s.pickerBarShown) fails.push('the team picker bar is on screen in a draft run' + at);
  if (s.candidatesDisplay !== '')
    fails.push('#candidates carries an inline display of "' + s.candidatesDisplay + '"' + at +
      ' — the picker set it and nothing put it back');
  if (s.searchValue !== '')
    fails.push('the team search box still reads "' + s.searchValue + '"' + at);
  if (s.searchBound)
    fails.push('the team search box still has an oninput handler bound' + at +
      ' — typing in it repaints the previous run\'s team list');
  if (s.teamPickListLen)
    fails.push('teamPickList still holds ' + s.teamPickListLen + ' teams from a previous run' + at);
  if (!s.rerollShown) fails.push('the reroll button is missing from a draft run' + at);
  if (s.drafted !== 0) fails.push('a draft run started with ' + s.drafted + ' players already picked' + at);
  if (s.afterPick !== 1) fails.push('one pick drafted ' + s.afterPick + ' players, not 1' + at);
  if (s.badge === out.badgeGeneric)
    fails.push('the badge reads the generic "' + s.badge + '"' + at +
      ' — applyStaticI18n has overwritten the mode label');
  if (s.badge !== out.badgeExpected)
    fails.push('the badge reads "' + s.badge + '", expected "' + out.badgeExpected + '"' + at);
}

checkDraftRun('cold', out.a);
// The abandoned run has to have really been a realistic run, or the second
// scenario is just the first one twice.
if (!out.abandoned.realistic || !out.abandoned.pickerBarShown || !out.abandoned.teamRows)
  fails.push('the realistic run being abandoned never put a team picker on screen (' +
    out.abandoned.teamRows + ' rows), so the leak it is meant to catch was never created');
checkDraftRun('after an abandoned realistic run', out.b);

console.log('\n  cold          pack ' + out.a.packCards + ' · reroll ' + (out.a.rerollShown ? 'on' : 'off') +
            ' · picked ' + out.a.afterPick + ' of 2 · badge "' + out.a.badge + '"');
console.log('  after abandon pack ' + out.b.packCards + ' · reroll ' + (out.b.rerollShown ? 'on' : 'off') +
            ' · picked ' + out.b.afterPick + ' of 2 · badge "' + out.b.badge + '"');
if (fails.length) { fails.forEach(f => console.error('  FAIL ' + f)); process.exit(1); }
console.log('\n  draft mode is the mode it was\n');
