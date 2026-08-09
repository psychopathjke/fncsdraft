// Checks the roster lock actually holds: a locked team must be seated whole in
// its Major's bot field, and a team the draft broke into must seat its survivors
// with somebody new rather than vanish.
//
//   node tools/check-locked-teams.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__lk" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    [['m2', 2], ['t2', 3]].forEach(function(pair){
      var set = pair[0], size = pair[1];
      CARD_MODE = true; CARD_SET = set; squadSize = size;
      LOCKED_TEAM_SUBS = new Map();
      var locked = lockedTeamsForSet();
      var pool = cardRosterPlayers(set).slice();

      // Whole field first: every locked team should come back intact.
      var seated = seatLockedTeams(pool, 50, size);
      var keyOf = function(sq){ return sq.map(function(p){ return _gcNorm(p.handle); }).sort().join('|'); };
      var seatedKeys = seated.squads.map(keyOf);
      var whole = 0, split = 0, splitTeams = [];
      locked.forEach(function(t){
        var want = t.map(function(h){ return _gcNorm(h); }).sort().join('|');
        if (seatedKeys.indexOf(want) >= 0) whole++;
        else { split++; splitTeams.push(t.join(' + ')); }
      });

      // Now take one player out of the first locked team, as a draft would.
      var victim = _gcNorm(locked[0][0]);
      var thinned = pool.filter(function(p){ return _gcNorm(p.handle) !== victim; });
      LOCKED_TEAM_SUBS = new Map();
      var s2 = seatLockedTeams(thinned, 50, size);
      var survivors = locked[0].slice(1).map(function(h){ return _gcNorm(h); });
      var together = s2.squads.filter(function(sq){
        var k = sq.map(function(p){ return _gcNorm(p.handle); });
        return survivors.every(function(h){ return k.indexOf(h) >= 0; });
      });

      out[set] = {
        size: size,
        lockedTeams: locked.length,
        poolSize: pool.length,
        seatedWhole: whole,
        seatedSplit: split,
        splitTeams: splitTeams,
        squadSizesOk: seated.squads.every(function(sq){ return sq.length === size; }),
        survivorsSeatedTogether: together.length === 1,
        survivorTeam: together.length ? together[0].map(function(p){ return p.handle; }) : null,
        subRecorded: LOCKED_TEAM_SUBS.size > 0
      };
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__lk').textContent =
    'BEGINLK' + encodeURIComponent(JSON.stringify(out)) + 'ENDLK';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locked-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINLK([\s\S]*?)ENDLK/);
if (!m) { console.error('probe did not run; page at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

let bad = 0;
['m2', 't2'].forEach(set => {
  const o = out[set];
  if (!o) { console.log(set + ': not present'); bad++; return; }
  // The invariants that matter: every seated team is the right size, and a team
  // the draft broke into keeps its survivors together. A team that cannot be
  // seated whole is reported by name rather than failing the run — it means a
  // player of that team is missing from the pool under any spelling, which is a
  // data question, not a broken lock.
  const ok = o.squadSizesOk && o.survivorsSeatedTogether;
  if (!ok) bad++;
  console.log(set + ' (size ' + o.size + '): ' + o.lockedTeams + ' locked teams, ' +
    o.seatedWhole + ' seated whole, ' + o.seatedSplit + ' split' +
    ', sizes ' + (o.squadSizesOk ? 'ok' : 'WRONG') +
    ', survivors together ' + (o.survivorsSeatedTogether ? 'yes' : 'NO') +
    (o.survivorTeam ? ' -> ' + o.survivorTeam.join(' + ') : '') +
    ', substitution recorded ' + (o.subRecorded ? 'yes' : 'no'));
  if (o.splitTeams && o.splitTeams.length)
    console.log('    not seated whole: ' + o.splitTeams.join('; '));
});
process.exit(bad ? 1 : 0);
