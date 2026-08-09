// Snaps roughly-placed rectangles onto the real edges under them.
//
//   node tools/snap-box.js <map.jpg> <rough.json> [radius]
//
// Finishing a drop grid by hand does not have to mean typing pixel coordinates
// by eye. A rectangle read off a ruler to within twenty pixels is easy to get
// right; the last twenty are what this does, by sliding each of the four edges
// to the strongest line or step within reach of where it was put.
//
// rough.json is [{x,y,w,h}, ...] in pixels. Out comes the same list, snapped,
// with the score each edge settled on so a bad fit is visible rather than
// silent.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const SRC = process.argv[2], ROUGH = process.argv[3];
const RADIUS = parseInt(process.argv[4] || '25', 10);
if (!SRC || !ROUGH) throw new Error('usage: snap-box.js <map.jpg> <rough.json> [radius]');

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const rough = JSON.parse(fs.readFileSync(ROUGH, 'utf8'));
const b64 = fs.readFileSync(SRC).toString('base64');

const page = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
var ROUGH = ${JSON.stringify(rough)}, R = ${RADIUS};
document.getElementById('i').onload = function(){
  var im = this, W = im.naturalWidth, H = im.naturalHeight;
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  var d = g.getImageData(0, 0, W, H).data;
  var lum = new Float32Array(W*H);
  for (var i = 0, p = 0; i < d.length; i += 4, p++)
    lum[p] = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
  var L = function(x, y){
    if (x < 0) x = 0; if (y < 0) y = 0;
    if (x >= W) x = W-1; if (y >= H) y = H-1;
    return lum[y*W+x];
  };
  var D = 3;
  // How much a border is present at this pixel, whichever way it is drawn: a
  // stroke darker than both sides, or a step between a wash and open ground.
  var hScore = function(x, y){
    var line = Math.min(L(x, y-D) - L(x, y), L(x, y+D) - L(x, y));
    var step = Math.abs(L(x, y-D) - L(x, y+D));
    return Math.max(line, step * 0.8);
  };
  var vScore = function(x, y){
    var line = Math.min(L(x-D, y) - L(x, y), L(x+D, y) - L(x, y));
    var step = Math.abs(L(x-D, y) - L(x+D, y));
    return Math.max(line, step * 0.8);
  };

  var out = ROUGH.map(function(b){
    var x0 = b.x, y0 = b.y, x1 = b.x + b.w, y1 = b.y + b.h;
    function bestRow(guess, xa, xb){
      var best = guess, bestV = -1e9;
      for (var y = guess - R; y <= guess + R; y++){
        if (y < 0 || y >= H) continue;
        var s = 0, n = 0;
        for (var x = xa; x <= xb; x += 2){ s += hScore(x, y); n++; }
        s /= Math.max(n, 1);
        if (s > bestV){ bestV = s; best = y; }
      }
      return {v: best, score: +bestV.toFixed(2)};
    }
    function bestCol(guess, ya, yb){
      var best = guess, bestV = -1e9;
      for (var x = guess - R; x <= guess + R; x++){
        if (x < 0 || x >= W) continue;
        var s = 0, n = 0;
        for (var y = ya; y <= yb; y += 2){ s += vScore(x, y); n++; }
        s /= Math.max(n, 1);
        if (s > bestV){ bestV = s; best = x; }
      }
      return {v: best, score: +bestV.toFixed(2)};
    }
    // Rows first against the rough columns, then columns against the snapped
    // rows, so each pass works with a better span than it was given.
    var top = bestRow(y0, x0 + 8, x1 - 8), bot = bestRow(y1, x0 + 8, x1 - 8);
    var lef = bestCol(x0, top.v + 8, bot.v - 8), rig = bestCol(x1, top.v + 8, bot.v - 8);
    return {x: lef.v, y: top.v, w: rig.v - lef.v, h: bot.v - top.v,
            scores: [top.score, bot.score, lef.score, rig.score],
            moved: [top.v - y0, bot.v - y1, lef.v - x0, rig.v - x1]};
  });
  document.getElementById('o').textContent = 'BEGINS' + JSON.stringify({W:W, H:H, out:out}) + 'ENDS';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
const f = path.join(dir, 's.html');
fs.writeFileSync(f, page);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=30000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINS(\{[\s\S]*?\})ENDS/);
if (!m) { console.error('snap failed; page at ' + f); process.exit(2); }
const res = JSON.parse(m[1]);
fs.rmSync(dir, { recursive: true, force: true });

res.out.forEach((b, i) => {
  console.error('#' + (i+1) + '  ' + b.x + ',' + b.y + ' ' + b.w + 'x' + b.h +
                '   edge scores ' + b.scores.join('/') + '   moved ' + b.moved.join('/'));
});
// Percentages, the shape ZONE_SETS wants.
console.log(JSON.stringify(res.out.map(b => ({
  x: +(100*b.x/res.W).toFixed(2), y: +(100*b.y/res.H).toFixed(2),
  w: +(100*b.w/res.W).toFixed(2), h: +(100*b.h/res.H).toFixed(2)
}))));
