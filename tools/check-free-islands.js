// The free modes let you pick an island. This checks that picking one actually
// brings its season with it: its map art, its landing grid, and its loot.
//
//   node tools/check-free-islands.js
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
<pre id="__fi" style="display:none"></pre>
<script>
(function(){
  var out = {choices: [], islands: {}};
  try {
    out.choices = MAP_CHOICES.map(function(c){ return c.key + ':' + c.label; });
    CARD_MODE = false;
    MAP_CHOICES.forEach(function(c){
      pendingMapSet = c.key;
      useLandingSet(c.key);
      var w = activeWeaponPool();
      out.islands[c.key] = {
        label: c.label,
        art: MAP_ART[c.key],
        aspect: MAP_ASPECT[c.key],
        zones: ALL_LANDING_ZONES.length,
        season: lootPoolSeasonName(),
        weapons: new Set(w.map(function(x){ return x.name; })).size,
        heals: generateHealPack().map(function(x){ return x.name; })
      };
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__fi').textContent =
    'BEGINFI' + encodeURIComponent(JSON.stringify(out)) + 'ENDFI';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freeisl-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINFI([\s\S]*?)ENDFI/);
if (!m) { console.error('probe did not run; page at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
if (out.error) { console.error(out.error); process.exit(2); }

console.log('map choices: ' + out.choices.join(', '));
let bad = 0;
const seasons = new Set();
Object.keys(out.islands).forEach(k => {
  const o = out.islands[k];
  const artOk = o.art && fs.existsSync(path.join(ROOT, o.art));
  if (!artOk || !o.zones || !o.weapons) bad++;
  seasons.add(o.season);
  console.log('  ' + k.padEnd(3) + ' ' + String(o.label).padEnd(18) +
    ' art ' + (artOk ? 'ok' : 'MISSING') +
    '  zones ' + String(o.zones).padStart(2) +
    '  loot "' + o.season + '" ' + o.weapons + ' weapons' +
    '  heals: ' + o.heals.slice(0, 3).join(', '));
});
// Each 2025 island must draw its own season. The two 2026 islands are left as
// they were: in the free modes their loot comes from the era filter rather than
// from the map, which predates this and is not what picking an island changed.
const t = Object.keys(out.islands).filter(k => /^t\d$/.test(k));
const tSeasons = new Set(t.map(k => out.islands[k].season));
if (tSeasons.size !== t.length) {
  console.log('  FAIL: ' + t.length + ' islands from 2025 draw only ' + tSeasons.size + ' distinct pools');
  bad++;
}
process.exit(bad ? 1 : 0);
