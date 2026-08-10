// Compares the club each 2025 card currently carries against the club that
// player actually played for at the 2025 Global Championship, as Liquipedia's
// own field records it. Clubs are only recorded on the 2026 rosters today and
// then cross-filled onto every other card of the same person, so this is the
// measurement of how wrong that is.
//
//   node tools/check-2025-orgs.js <gc2025-orgs.json>
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ORGS = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const BOOTSTRAP = `
<pre id="__probe" style="display:none"></pre>
<script>
(function(){
  var real = ${JSON.stringify(ORGS)};
  var norm = function(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); };
  var byNorm = {};
  Object.keys(real).forEach(function(k){ byNorm[norm(k)] = real[k]; });
  var out = {sets:{}};
  ['t1','t2','t3'].forEach(function(set){
    var cards = cardRosterPlayers(set);
    var seen = {}, agree = 0, differ = 0, missing = 0, examples = [];
    cards.forEach(function(p){
      var want = byNorm[norm(p.handle)];
      if (!want) return;
      if (seen[norm(p.handle)]) return;
      seen[norm(p.handle)] = 1;
      if (!p.org) { missing++; examples.push(p.handle + ': (none) -> ' + want); return; }
      if (norm(p.org) === norm(want)) agree++;
      else { differ++; examples.push(p.handle + ': ' + p.org + ' -> ' + want); }
    });
    out.sets[set] = {matched: agree + differ + missing, agree: agree, differ: differ,
                     missing: missing, examples: examples.slice(0, 25)};
  });
  out.orgCoverage = {};
  ['t1','t2','t3','m1','m2'].forEach(function(set){
    var c = cardRosterPlayers(set);
    out.orgCoverage[set] = Math.round(100 * c.filter(function(p){ return !!p.org; }).length / c.length) + '%';
  });
  document.getElementById('__probe').textContent =
    'BEGINPROBE' + encodeURIComponent(JSON.stringify(out)) + 'ENDPROBE';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsorg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINPROBE([\s\S]*?)ENDPROBE/);
if (!m) { console.error('probe did not run'); process.exit(1); }
console.log(JSON.stringify(JSON.parse(decodeURIComponent(m[1])), null, 1));
