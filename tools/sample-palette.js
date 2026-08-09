// Reads the dominant colours out of a reference screenshot so a theme is
// measured rather than guessed. Node has no image decoder here and this project
// has no dependencies, so the decoding is done by the browser: draw to a canvas
// and average regions of pixels.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const IMG = process.argv[2];
if (!IMG || !fs.existsSync(IMG)) throw new Error('pass the path to a reference screenshot');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const b64 = fs.readFileSync(IMG).toString('base64');
const html = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
document.getElementById('i').onload = function(){
  var im = this, c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  function avg(x0, y0, x1, y1){
    var d = g.getImageData(x0, y0, Math.max(1,x1-x0), Math.max(1,y1-y0)).data;
    var r = 0, gr = 0, b = 0, n = 0;
    for (var i = 0; i < d.length; i += 4){ r += d[i]; gr += d[i+1]; b += d[i+2]; n++; }
    function h(v){ v = Math.round(v/n).toString(16); return v.length < 2 ? '0'+v : v; }
    return '#' + h(r) + h(gr) + h(b);
  }
  var W = c.width, H = c.height, f = function(a,b){ return Math.round(a*b); };
  document.getElementById('o').textContent = 'BEGINPAL' + encodeURIComponent(JSON.stringify({
    size: W + 'x' + H,
    backdropTopRight:    avg(f(W,.72), f(H,.05), f(W,.96), f(H,.16)),
    backdropBottomRight: avg(f(W,.72), f(H,.80), f(W,.96), f(H,.96)),
    backdropLeft:        avg(f(W,.02), f(H,.60), f(W,.16), f(H,.90)),
    leaderRow:           avg(f(W,.12), f(H,.335), f(W,.42), f(H,.385)),
    altRow:              avg(f(W,.12), f(H,.415), f(W,.42), f(H,.465)),
    rowTextDark:         avg(f(W,.09), f(H,.350), f(W,.30), f(H,.372))
  })) + 'ENDPAL';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pal-'));
const f = path.join(dir, 'p.html');
fs.writeFileSync(f, html);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=10000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
  { maxBuffer: 128 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINPAL([\s\S]*?)ENDPAL/);
if (!m) { console.error('sampler did not run; harness at ' + f); process.exit(2); }
console.log(JSON.parse(decodeURIComponent(m[1])));
fs.rmSync(dir, { recursive: true, force: true });
