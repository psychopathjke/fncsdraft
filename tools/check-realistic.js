// The real-team list that the realistic simulation is built on: it has to be
// every real roster in the Major's data, each one once, ordered by the rating
// of its cards, with nobody in it whose teammate is missing from the pool.
//
//   node tools/check-realistic.js
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
<pre id="__real" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    // Major 2, Europe, duos — the set the numbers in the spec were measured on.
    pendingSize = 2; pendingMajor = false; pendingCards = true;
    pendingCardSet = 'm2'; pendingMapSet = 'm2';
    preSelectedRegions = ['EU']; preSelectedYears = [];
    REALISTIC = true;
    startDraft(2, false);

    var built = realTeamsFor(pool);
    var teams = built.teams;
    out.dropped = built.dropped;
    out.count = teams.length;
    out.top = teams.slice(0, 3).map(function(t){
      return {who: t.handles.join(' & '), avg: Math.round(t.avg), stage: t.stage, rank: t.rank};
    });
    // Ordered, high to low.
    out.ordered = teams.every(function(t, i){ return i === 0 || teams[i-1].avg >= t.avg; });
    // Every roster once.
    var seen = {}, dupes = 0;
    teams.forEach(function(t){
      var k = t.handles.slice().sort().join('|');
      if (seen[k]) dupes++; else seen[k] = 1;
    });
    out.dupes = dupes;
    // Every listed team is complete and its members really are in the pool.
    var inPool = {};
    pool.forEach(function(p){ inPool[p.handle] = 1; });
    out.incomplete = teams.filter(function(t){
      return t.cards.length !== t.handles.length || t.handles.some(function(h){ return !inPool[h]; });
    }).length;
    // Every team is the right size for the mode.
    out.wrongSize = teams.filter(function(t){ return t.handles.length !== 2; }).length;
    // The drop rule, exercised rather than hoped for: hold one player of the
    // top team back and that team must vanish from the list.
    var stranded = teams[0].handles[0];
    var thinner = pool.filter(function(p){ return p.handle !== stranded; });
    var reduced = realTeamsFor(thinner);
    out.dropOnePool = {
      count: reduced.teams.length,
      dropped: reduced.dropped,
      strandedListed: reduced.teams.some(function(t){
        return t.handles.indexOf(stranded) >= 0;
      })
    };
  } catch (e) { out = {error: String(e && e.stack || e)}; }
  document.getElementById('__real').textContent =
    'BEGINREAL' + encodeURIComponent(JSON.stringify(out)) + 'ENDREAL';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsreal-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINREAL([\s\S]*?)ENDREAL/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

console.log('\nMajor 2 . Europe, duos');
console.log('  teams offered      ' + out.count);
console.log('  dropped, roster incomplete ' + out.dropped);
out.top.forEach(t => console.log('  ' + String(t.avg).padStart(3) + '  ' + t.who +
  '  [' + t.stage + ' #' + t.rank + ']'));

const fails = [];
// Measured twice, headless, on this branch: 179 real duos behind Major 2
// Europe's 250 rows, and with no era filter every one of them is whole. A
// number that moves means the card data moved or the builder is dropping teams
// it should not. (An earlier draft of the plan said 178 and 1 dropped; that came
// from a browser session whose pool was one player short and does not reproduce.)
if (out.count !== 179) fails.push('offered ' + out.count + ' teams, expected 179');
if (out.dropped !== 0) fails.push('dropped ' + out.dropped + ' teams, expected 0');
// The drop rule matters more than the count, and the full pool never exercises
// it. So it is exercised on purpose: take one player out and his team must
// leave the list rather than be completed from somewhere else.
if (out.dropOnePool.count !== 178)
  fails.push('with one player held back the list has ' + out.dropOnePool.count + ' teams, expected 178');
if (out.dropOnePool.dropped !== 1)
  fails.push('with one player held back ' + out.dropOnePool.dropped + ' teams were dropped, expected 1');
if (out.dropOnePool.strandedListed)
  fails.push('the team missing a player was listed anyway');
if (!out.ordered) fails.push('the list is not ordered by rating, high to low');
if (out.dupes) fails.push(out.dupes + ' rosters appear more than once');
if (out.incomplete) fails.push(out.incomplete + ' listed teams have a member missing from the pool');
if (out.wrongSize) fails.push(out.wrongSize + ' teams are not duos in a duo Major');
if (out.top[0] && out.top[0].who !== 'Sky & Scroll')
  fails.push('the top of the list is ' + out.top[0].who + ', not the team that won');

if (fails.length) { fails.forEach(f => console.error('  FAIL ' + f)); process.exit(1); }
console.log('\n  every real roster, once each, best first\n');
