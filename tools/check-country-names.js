// Asks the built page which country codes it can actually name.
//
// Reading CC_RU out of index.html with a regex does not work: the file also
// carries ledger maps keyed by player handle, and handles like "mv" and "ht"
// are indistinguishable from country codes to a pattern. Only the page knows,
// and only after every CC_*_EXTRA table has been assigned in.
//
//   node tools/check-country-names.js t2 t3
//
// Exits non-zero if a set uses a code the page cannot name in either language.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SETS = process.argv.slice(2).length ? process.argv.slice(2) : ['t1', 't2', 't3'];

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const BOOTSTRAP = `
<pre id="__cc" style="display:none"></pre>
<script>
(function(){
  var out = {};
  try {
    var TABLES = {t1: (typeof T1_NAT !== 'undefined') && T1_NAT,
                  t2: (typeof T2_NAT !== 'undefined') && T2_NAT,
                  t3: (typeof T3_NAT !== 'undefined') && T3_NAT};
    Object.keys(TABLES).forEach(function(set){
      var nat = TABLES[set];
      if (!nat) { out[set] = null; return; }
      var used = {}, ru = [], en = [];
      Object.keys(nat).forEach(function(h){ used[nat[h]] = 1; });
      Object.keys(used).forEach(function(code){
        if (!CC_RU[code]) ru.push(code);
        if (!CC_EN[code]) en.push(code);
      });
      out[set] = {codes: Object.keys(used).length, missingRu: ru, missingEn: en};
    });
  } catch (e) { out = {__error: String(e && e.message || e)}; }
  document.getElementById('__cc').textContent =
    'BEGINCC' + encodeURIComponent(JSON.stringify(out)) + 'ENDCC';
})();
<\/script>`;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncscc-'));
const tmp = path.join(tmpDir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINCC([\s\S]*?)ENDCC/);
if (!m) { console.error('probe did not run; page copy at ' + tmp); process.exit(2); }
const res = JSON.parse(decodeURIComponent(m[1]));
if (res.__error) { console.error('page reported: ' + res.__error); process.exit(2); }
fs.rmSync(tmpDir, { recursive: true, force: true });

let bad = 0;
for (const set of SETS) {
  const r = res[set];
  if (!r) { console.log(set + ': not present in the page yet'); continue; }
  console.log(set + ': ' + r.codes + ' codes used, ' +
              r.missingRu.length + ' unnamed in Russian, ' + r.missingEn.length + ' unnamed in English');
  if (r.missingRu.length) { console.log('  RU: ' + r.missingRu.join(' ')); bad++; }
  if (r.missingEn.length) { console.log('  EN: ' + r.missingEn.join(' ')); bad++; }
}
process.exit(bad ? 1 : 0);
