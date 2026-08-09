// Dumps every card-mode player's rating so a refactor can be proven inert.
//
// The page is a single self-contained index.html with no build step, so the
// cheapest way to ask it what it computed is to run it: copy it, append a
// bootstrap that serialises the cards, and read the result back out of a
// headless --dump-dom.
//
// The payload is percent-encoded rather than written as plain JSON. Player
// handles carry quotes, emoji and characters like the fullwidth exclamation in
// "f3kserǃ", and HTML escaping mangles them on the way through the DOM dump.
// encodeURIComponent sidesteps escaping entirely.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(__dirname, 'baseline-card-ratings.json');

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOTSTRAP = `
<pre id="__dump" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    PLAYERS_BASE.forEach(function(p){
      if (p.tier !== 'cardmode') return;
      var ovr = null;
      try { ovr = attrsFor(p).ovr; } catch (e) { ovr = 'ERR:' + e.message; }
      out[(p.cardSet || '?') + '|' + (p.region || '?') + '|' + p.handle + '|' + (p.event || '')] =
        { rating: p.rating, rarity: p.rarity, ovr: ovr };
    });
  } catch (e) {
    out = { __error: String(e && e.message || e) };
  }
  document.getElementById('__dump').textContent =
    'BEGINDUMP' + encodeURIComponent(JSON.stringify(out)) + 'ENDDUMP';
})();
<\/script>`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsdump-'));
const tmp = path.join(tmpDir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

let dom;
try {
  dom = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--virtual-time-budget=30000', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')
  ], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
} finally {
  // keep the temp copy only if something went wrong, so it can be opened by hand
}

const m = dom.match(/BEGINDUMP([\s\S]*?)ENDDUMP/);
if (!m) {
  console.error('dump marker not found — the page threw before the bootstrap ran.');
  console.error('the copy that failed is at: ' + tmp);
  process.exit(2);
}
const json = JSON.parse(decodeURIComponent(m[1]));
if (json.__error) {
  console.error('page reported: ' + json.__error);
  console.error('the copy that failed is at: ' + tmp);
  process.exit(2);
}

fs.writeFileSync(OUT, JSON.stringify(json));
fs.rmSync(tmpDir, { recursive: true, force: true });

const bySet = {};
for (const k in json) { const s = k.split('|')[0]; bySet[s] = (bySet[s] || 0) + 1; }
console.log('cards dumped: ' + Object.keys(json).length + ' -> ' + OUT);
console.log('by set: ' + JSON.stringify(bySet));
