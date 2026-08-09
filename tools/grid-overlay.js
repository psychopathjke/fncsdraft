// Draws a labelled pixel grid over a map, plus any rectangles already found, and
// writes one quadrant at a time so the picture is big enough to read edges off.
//
//   node tools/grid-overlay.js <map.jpg> <boxes.json|-> <out-prefix> [step]
//
// This is the tool for the part of the job a detector cannot do: finishing a
// drop grid by hand. Reading a rectangle's bounds off a screenshot by eye is
// guesswork; reading them off a ruler laid over the same screenshot is not.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const SRC = process.argv[2], BOXES = process.argv[3], PREFIX = process.argv[4];
const STEP = parseInt(process.argv[5] || '50', 10);
if (!SRC || !PREFIX) throw new Error('usage: grid-overlay.js <map.jpg> <boxes.json|-> <out-prefix> [step]');

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const boxes = (BOXES && BOXES !== '-') ? JSON.parse(fs.readFileSync(BOXES, 'utf8')) : [];
const b64 = fs.readFileSync(SRC).toString('base64');

const page = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
var B = ${JSON.stringify(boxes)}, STEP = ${STEP};
document.getElementById('i').onload = function(){
  var im = this, W = im.naturalWidth, H = im.naturalHeight;
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);

  // Everything already found, so what is missing is what has no box on it.
  g.lineWidth = 3; g.strokeStyle = '#00ff88';
  B.forEach(function(z){ g.strokeRect(z.x/100*W, z.y/100*H, z.w/100*W, z.h/100*H); });

  // The ruler.
  g.lineWidth = 1; g.font = '13px monospace';
  for (var x = 0; x <= W; x += STEP){
    var major = (x % (STEP*2) === 0);
    g.strokeStyle = major ? 'rgba(255,255,0,.75)' : 'rgba(255,255,0,.30)';
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  for (var y = 0; y <= H; y += STEP){
    var majy = (y % (STEP*2) === 0);
    g.strokeStyle = majy ? 'rgba(255,255,0,.75)' : 'rgba(255,255,0,.30)';
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  // Labels last, so they sit on top of the lines.
  for (var x2 = 0; x2 <= W; x2 += STEP*2){
    for (var y2 = 0; y2 <= H; y2 += STEP*2){
      g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(x2+1, y2+1, 62, 14);
      g.fillStyle = '#ffff33'; g.fillText(x2 + ',' + y2, x2+3, y2+12);
    }
  }

  // Four quadrants, each drawn at twice the size.
  var out = [];
  [[0,0],[1,0],[0,1],[1,1]].forEach(function(q){
    var qw = Math.ceil(W/2), qh = Math.ceil(H/2);
    var d2 = document.createElement('canvas');
    d2.width = qw*2; d2.height = qh*2;
    var g2 = d2.getContext('2d');
    g2.imageSmoothingEnabled = false;
    g2.drawImage(c, q[0]*qw, q[1]*qh, qw, qh, 0, 0, qw*2, qh*2);
    out.push(d2.toDataURL('image/jpeg', 0.85));
  });
  document.getElementById('o').textContent = 'BEGINQ' + JSON.stringify({W:W, H:H, q:out}) + 'ENDQ';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grid-'));
const f = path.join(dir, 'g.html');
fs.writeFileSync(f, page);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=30000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINQ(\{[\s\S]*?\})ENDQ/);
if (!m) { console.error('overlay failed; page at ' + f); process.exit(2); }
const out = JSON.parse(m[1]);
fs.rmSync(dir, { recursive: true, force: true });

const names = ['tl', 'tr', 'bl', 'br'];
out.q.forEach((data, i) => {
  const file = PREFIX + '-' + names[i] + '.jpg';
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  console.log(file);
});
console.log('image ' + out.W + 'x' + out.H + ', grid every ' + STEP + 'px, labels every ' + (STEP*2) + 'px');
