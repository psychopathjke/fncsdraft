// Every weapon and consumable the game can deal, and whether it has a picture.
// An item with no art falls back to a tinted outline, which is the thing being
// hunted here. Reports per mode, and lists the missing names so they can be
// fetched.
//
//   node tools/check-item-art.js
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
  var out = {modes: {}, files: {}};
  // The resolver returns an <img> for a real picture and a fixed inline icon for
  // the fallback, so "has art" is just "did it give me an img".
  function artOf(o){
    var html = weaponIconHTML(o);
    var m = /src="([^"]+)"/.exec(html || '');
    return m ? m[1] : null;
  }
  var MODES = [['m1', true], ['m2', true], ['t1', true], ['t2', true], ['t3', true], [null, false]];
  try {
  MODES.forEach(function(pair){
    var set = pair[0];
    CARD_MODE = pair[1];
    CARD_SET = set || 'm2';
    var key = set || 'no-cards';
    var heals = T_CONSUMABLE_POOLS[activeIslandSet()] ? T_CONSUMABLE_POOLS[activeIslandSet()]
              : (CARD_MODE && CARD_SET === 'm1') ? M1_CONSUMABLE_POOL : M2_CONSUMABLE_POOL;
    var items = activeWeaponPool().concat(heals);
    var seen = {}, missing = [], have = 0;
    items.forEach(function(o){
      if (seen[o.name]) return;
      seen[o.name] = 1;
      var src = artOf(o);
      if (src) { have++; out.files[src] = (out.files[src] || 0) + 1; }
      else missing.push(o.name);
    });
    out.modes[key] = {items: Object.keys(seen).length, withArt: have, missing: missing};
  });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__probe').textContent =
    'BEGINPROBE' + encodeURIComponent(JSON.stringify(out)) + 'ENDPROBE';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsart-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
// The bootstrap's own source is in the dumped DOM and contains the marker too,
// so match the encoded payload rather than "anything between the markers".
const m = dom.match(/BEGINPROBE((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)ENDPROBE/);
if (!m || !m[1]) { console.error('probe did not run'); process.exit(1); }
const res = JSON.parse(decodeURIComponent(m[1]));
if (res.error) { console.error(res.error); process.exit(1); }

Object.keys(res.modes).forEach(k => {
  const o = res.modes[k];
  console.log('\n' + k.padEnd(9) + o.items + ' items · ' + o.withArt + ' with a picture · ' +
              o.missing.length + ' without');
  if (o.missing.length) console.log('   ' + o.missing.join(' | '));
});

// A path in the table that has no file behind it is the same problem wearing a
// different hat: the browser shows a broken image instead of the silhouette.
const dead = Object.keys(res.files).filter(f => !/^data:/.test(f) && !fs.existsSync(path.join(ROOT, f)));
console.log('\nart paths referenced: ' + Object.keys(res.files).length +
            ' · pointing at a file that does not exist: ' + dead.length);
dead.forEach(f => console.log('   MISSING FILE ' + f));
