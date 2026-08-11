// Which Majors restore the real field, and which assemble one.
//
// The rule the season actually runs on: Major 1 is the opener. Nobody has
// qualified yet and nobody is locked to anybody, so its lobby is drafted, the
// same way the player drafts. From Major 2 the field is the teams that won their
// way in — Major 1's qualifiers into Major 2, Major 1's and Major 2's into
// Major 3 — so those are restored and seated intact.
//
// Before this was enforced, the 1332 real trios read out of the 2025 results
// were seated into every trio set, Major 1 included: all 49 opponents in the
// opener were teams that had really played together.
//
//   node tools/check-field-seating.js
'use strict';

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__fs" style="display:none"></pre>
<script>
(function(){
  var out = {checks: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    var norm = function(hs){ return hs.map(function(h){ return _gcNorm(h); }).sort().join('|'); };

    [['m1',2],['m2',2],['t1',3],['t2',3],['t3',3]].forEach(function(pair){
      var set = pair[0], size = pair[1];
      CARD_MODE = true; CARD_SET = set; squadSize = size; isMajorMode = true;
      var poolAll = cardRosterPlayers(set).slice();
      if (!poolAll.length) return;
      pool = poolAll.slice();
      drafted = poolAll.slice(0, size);

      var locked = lockedTeamsForSet(), real = realTeamsForSet(), seating = seatingTeamsForSet();
      var opener = locked.length === 0;

      // An opener seats nobody: with no qualifiers there is nothing to lock, and
      // the real rosters must not be restored in their place.
      if (opener) {
        check(set + ': the opener seats nobody',
          seating.length === 0,
          'seating holds ' + seating.length + ' teams (' + locked.length + ' locked, ' + real.length + ' real)');
      } else {
        // A qualifying Major keeps every team that won its way in.
        check(set + ': every qualified team is in the seating',
          locked.every(function(t){ return seating.some(function(s){ return norm(s) === norm(t); }); }),
          locked.length + ' locked teams');
        check(set + ': the rest of the real field is seated too',
          real.length === 0 || seating.length > locked.length,
          'seating ' + seating.length + ' vs locked ' + locked.length);
      }

      // And what that produces in a lobby.
      var teams = [];
      fillFieldTeams(poolAll.slice(size), 49, size, teams);
      var realKeys = {};
      real.forEach(function(t){ realKeys[norm(t)] = 1; });
      locked.forEach(function(t){ realKeys[norm(t)] = 1; });
      var restored = teams.filter(function(t){
        return realKeys[norm(t.squad.map(function(p){ return p.handle; }))]; }).length;

      if (opener) {
        // Assembly can rebuild a real trio by chance; it must not be the rule.
        check(set + ': the opener lobby is assembled, not restored',
          restored <= Math.ceil(teams.length * 0.1),
          restored + ' of ' + teams.length + ' opponents are real rosters');
      } else if (real.length) {
        // 2025 carries every trio that played, so a qualifying Major there is
        // the real field top to bottom.
        check(set + ': the qualifying lobby is the real field',
          restored >= Math.floor(teams.length * 0.8),
          restored + ' of ' + teams.length + ' opponents are real rosters');
      } else {
        // 2026 records only who qualified, not the whole field, so the seats go
        // to the qualifiers and the rest of the lobby is drafted.
        check(set + ': the qualifiers take their seats',
          restored > 0,
          restored + ' of ' + teams.length + ' opponents are qualified pairs');
      }
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__fs').textContent =
    'BEGINFS' + encodeURIComponent(JSON.stringify(out)) + 'ENDFS';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-field-seating.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINFS([\s\S]*?)ENDFS/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

let bad = 0;
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
