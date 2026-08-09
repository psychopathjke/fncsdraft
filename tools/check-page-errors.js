// Reports the first error the page throws at load, with its line, and the ten
// lines around it. A thrown exception aborts the rest of that script block, so
// every later "Cannot access X before initialization" is a symptom rather than
// the fault -- this finds the fault.
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

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){
  window.__errs.push({msg: String(e.message), line: e.lineno, col: e.colno,
                      stack: String((e.error && e.error.stack) || '').slice(0, 600)});
});
<\/script>`;
const TAIL = `
<pre id="__err" style="display:none"></pre>
<script>
document.getElementById('__err').textContent =
  'BEGINERR' + encodeURIComponent(JSON.stringify(window.__errs || [])) + 'ENDERR';
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncserr-'));
const tmp = path.join(dir, 'index.html');
// The listener has to be installed before anything else runs.
fs.writeFileSync(tmp, HEAD + src + TAIL);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGINERR([\s\S]*?)ENDERR/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const errs = JSON.parse(decodeURIComponent(m[1]));

if (!errs.length) { console.log('no errors at load'); fs.rmSync(dir, {recursive: true, force: true}); process.exit(0); }

const lines = (HEAD + src).split('\n');
const headLines = HEAD.split('\n').length - 1;
errs.slice(0, 3).forEach((e, i) => {
  console.log('--- error ' + (i + 1) + ': ' + e.msg + '  (line ' + e.line + ', col ' + e.col + ')');
  const at = e.line - 1;
  for (let j = Math.max(0, at - 4); j <= Math.min(lines.length - 1, at + 4); j++) {
    console.log((j === at ? '>> ' : '   ') + (j + 1 - headLines) + ': ' + lines[j].slice(0, 150));
  }
  if (e.stack) console.log('   stack: ' + e.stack.split('\n').slice(0, 3).join(' | '));
});
fs.rmSync(dir, { recursive: true, force: true });
process.exit(1);
