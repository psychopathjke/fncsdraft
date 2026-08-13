// Crops a competitive drop map down to the island, dropping the source's
// caption bar, and writes the result plus the exact pixel size the CSS
// aspect-ratio has to carry.
//
//   node tools/crop-map.js <source.jpg> <out.jpg> <cropBottomPx> [cropTopPx] [cropLeftPx] [cropRightPx]
//
// Left and right came along with the Reload maps, which are screenshots of a
// page rather than a bare map: the island sits beside a sidebar, and a grid
// measured on the whole screenshot would be a grid of the sidebar too.
//
// The landing rectangles in ZONE_SETS are percentages of the image they were
// measured on, so a map must be cropped BEFORE its grid is extracted, never
// after -- cropping afterwards moves every box.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const SRC = process.argv[2], OUT = process.argv[3];
const CUT_BOTTOM = parseInt(process.argv[4] || '0', 10);
const CUT_TOP = parseInt(process.argv[5] || '0', 10);
const CUT_LEFT = parseInt(process.argv[6] || '0', 10);
const CUT_RIGHT = parseInt(process.argv[7] || '0', 10);
if (!SRC || !OUT || !fs.existsSync(SRC)) throw new Error('usage: crop-map.js <source> <out.jpg> <cropBottom> [cropTop]');

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const b64 = fs.readFileSync(SRC).toString('base64');
const html = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
document.getElementById('i').onload = function(){
  var im = this, W = im.naturalWidth, H = im.naturalHeight;
  var h = H - ${CUT_BOTTOM} - ${CUT_TOP};
  var w = W - ${CUT_LEFT} - ${CUT_RIGHT};
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  var g = c.getContext('2d');
  g.drawImage(im, ${CUT_LEFT}, ${CUT_TOP}, w, h, 0, 0, w, h);
  document.getElementById('o').textContent =
    'BEGIN' + JSON.stringify({w: w, h: h, data: c.toDataURL('image/jpeg', 0.92)}) + 'END';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncscrop-'));
const tmp = path.join(dir, 'crop.html');
fs.writeFileSync(tmp, html);

const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=20000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN(\{[\s\S]*?\})END/);
if (!m) { console.error('crop did not run; page at ' + tmp); process.exit(2); }
const out = JSON.parse(m[1]);
fs.writeFileSync(OUT, Buffer.from(out.data.split(',')[1], 'base64'));
fs.rmSync(dir, { recursive: true, force: true });
console.log('written ' + OUT + '  ' + out.w + 'x' + out.h + "   MAP_ASPECT: '" + out.w + '/' + out.h + "'");
