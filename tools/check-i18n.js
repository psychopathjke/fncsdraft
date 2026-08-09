// Every data-i18n key in the markup must exist in both dictionaries. A missing
// one renders as empty text with no error in the console, so a whole mode tile
// can go blank in one language and look fine in the other.
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
<pre id="__i18n" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    var keys = [];
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var k = el.getAttribute('data-i18n');
      if (keys.indexOf(k) < 0) keys.push(k);
    });
    var missing = {ru: [], en: []};
    ['ru','en'].forEach(function(lang){
      var was = LANG;
      LANG = lang;
      var dict = L();
      keys.forEach(function(k){ if (dict[k] === undefined) missing[lang].push(k); });
      LANG = was;
    });
    out = {keys: keys.length, missing: missing};
  } catch (e) { out = {error: String(e && e.stack || e)}; }
  document.getElementById('__i18n').textContent =
    'BEGINI18N' + encodeURIComponent(JSON.stringify(out)) + 'ENDI18N';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsi18n-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINI18N([\s\S]*?)ENDI18N/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

if (out.error) { console.error(out.error); process.exit(2); }
console.log(out.keys + ' keys used in the markup');
let bad = 0;
['ru','en'].forEach(lang => {
  const miss = out.missing[lang];
  console.log('  ' + lang + ': ' + miss.length + ' missing' + (miss.length ? ' -> ' + miss.join(' ') : ''));
  bad += miss.length;
});
process.exit(bad ? 1 : 0);
