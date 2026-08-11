// Does the app hand the zone engine the squads it was calibrated on?
//
// The engine reads four attributes off every team — END, SUR, AIM, CLU — and
// falls back to 50 for anything it cannot find. The calibration harness builds
// its teams by hand and always sets them, so the suite can be green while the
// app quietly plays a lobby of identical squads: rotation skill, aggression and
// target selection all collapse to one value, and the only thing left telling
// a 96 from a 60 is the duel.
//
// This checks the bridge rather than the engine: a team the app built, read the
// way the engine reads it.
//
//   node tools/check-engine-inputs.js
'use strict';

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
<pre id="__ei" style="display:none"></pre>
<script>
(function(){
  var out = {checks: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  // The engine's own accessor, copied exactly: zone-sim.js attr().
  var attrOf = function(team, key){
    var a = team.attrs || {};
    var v = a[key];
    return (typeof v === 'number') ? v : 50;
  };
  try {
    [['m2', 2], ['t2', 3]].forEach(function(pair){
      var set = pair[0], size = pair[1];
      CARD_MODE = true; CARD_SET = set; squadSize = size; isMajorMode = false;
      pool = cardRosterPlayers(set).slice();
      if (!pool.length) return;
      var byOvr = pool.slice().sort(function(a,b){ return attrsFor(b).ovr - attrsFor(a).ovr; });
      var elite = byOvr.slice(0, size);
      var weak  = byOvr.slice(-size);

      var top = buildTeam(elite), bottom = buildTeam(weak);

      check(set + ': a built team carries attributes the engine can read',
        top.attrs && ['END','SUR','AIM','CLU'].every(function(k){ return typeof top.attrs[k] === 'number'; }),
        'attrs = ' + JSON.stringify(top.attrs || null));

      var keys = ['END','SUR','AIM','CLU'];
      var readTop = keys.map(function(k){ return attrOf(top, k); });
      var readBot = keys.map(function(k){ return attrOf(bottom, k); });

      check(set + ': the best squad on the board does not read as a default 50',
        readTop.some(function(v){ return v !== 50; }),
        'engine reads ' + keys.map(function(k,i){ return k + '=' + readTop[i]; }).join(' '));

      check(set + ': the engine can tell the best squad from the worst',
        keys.some(function(k, i){ return readTop[i] - readBot[i] >= 10; }),
        'best ' + readTop.join('/') + '  worst ' + readBot.join('/'));

      // The attributes have to agree with the cards they came from, or the
      // engine is reading a squad nobody drafted.
      var avg = function(sq, k){
        return Math.round(sq.reduce(function(s,p){ return s + attrsFor(p)[k]; }, 0) / sq.length); };
      check(set + ': the numbers are the squad\\'s own cards, averaged',
        keys.every(function(k){ return Math.abs(attrOf(top, k) - avg(elite, k.toLowerCase())) <= 1; }),
        'engine ' + readTop.join('/') + '  cards ' +
        keys.map(function(k){ return avg(elite, k.toLowerCase()); }).join('/'));
    });

    // The free modes play on the map too, and they build teams down a different
    // path — so the bridge has to hold there as well.
    CARD_MODE = false; squadSize = 2; isMajorMode = false;
    var free = tournamentPool().slice(0, 2);
    if (free.length === 2) {
      var t = buildTeam(free);
      check('free mode: a built team carries attributes the engine can read',
        t.attrs && typeof t.attrs.END === 'number',
        'attrs = ' + JSON.stringify(t.attrs || null));
    }
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__ei').textContent =
    'BEGINEI' + encodeURIComponent(JSON.stringify(out)) + 'ENDEI';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'einp-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINEI([\s\S]*?)ENDEI/);
if (!m) { console.error('probe did not run; page at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

let bad = 0;
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
