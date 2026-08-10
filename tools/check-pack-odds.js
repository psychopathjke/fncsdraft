// How often a pack actually contains a mythic, per card set and per region, and
// how many mythics the pool holds in the first place. The pack deal is weighted
// by OVR, so "I never see a 95" can be either a thin pool or a flat curve, and
// these are different bugs.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
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
  var out = {};
  var TRIALS = 4000;
  [['m1',2],['m2',2],['t1',3],['t2',3],['t3',3]].forEach(function(pair){
    var set = pair[0], size = pair[1];
    CARD_SET = set; CARD_MODE = true; squadSize = size; drafted = [];
    var roster = cardRosterPlayers(set);
    var o = out[set] = {cards: roster.length, weights: PACK_WEIGHTS[set] || {exp: PACK_WEIGHT_EXPONENT, floor: PACK_WEIGHT_FLOOR}, regions: {}};
    var byRegion = {};
    roster.forEach(function(p){ (byRegion[p.region] = byRegion[p.region] || []).push(p); });
    Object.keys(byRegion).sort().forEach(function(reg){
      pool = byRegion[reg];
      var mythic = pool.filter(function(p){ return attrsFor(p).ovr >= 95; }).length;
      var legendary = pool.filter(function(p){ var o = attrsFor(p).ovr; return o >= 90 && o < 95; }).length;
      var hits = 0, best = 0;
      for (var i = 0; i < TRIALS; i++) {
        drafted = [];
        var pack = generatePack();
        var top = 0;
        pack.forEach(function(p){ top = Math.max(top, attrsFor(p).ovr); });
        if (top >= 95) hits++;
        best += top;
      }
      o.regions[reg] = {pool: pool.length, mythic: mythic, legendary: legendary,
                        packHasMythic: Math.round(1000 * hits / TRIALS) / 10 + '%',
                        avgBestInPack: Math.round(10 * best / TRIALS) / 10};
    });
  });
  document.getElementById('__probe').textContent =
    'BEGINPROBE' + encodeURIComponent(JSON.stringify(out)) + 'ENDPROBE';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncspack-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINPROBE([\s\S]*?)ENDPROBE/);
if (!m) { console.error('probe did not run'); process.exit(1); }
const res = JSON.parse(decodeURIComponent(m[1]));
Object.keys(res).forEach(set => {
  const s = res[set];
  console.log('\n' + set + '  ' + s.cards + ' cards  ·  weight exp ' + s.weights.exp + ', floor ' + s.weights.floor);
  Object.keys(s.regions).forEach(reg => {
    const r = s.regions[reg];
    console.log('  ' + reg.padEnd(5) + ' pool ' + String(r.pool).padStart(4) +
                '  mythic ' + String(r.mythic).padStart(3) + '  legendary ' + String(r.legendary).padStart(3) +
                '  pack has a mythic ' + r.packHasMythic.padStart(6) +
                '  best in pack ' + r.avgBestInPack);
  });
});
