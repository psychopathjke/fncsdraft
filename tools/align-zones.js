// Moves drop rectangles measured on an annotated map onto a clean map of the
// same island.
//
//   node tools/align-zones.js <annotated.jpg> <clean.jpg> <boxes.json>
//
// The rectangles are read off a drop map, but the drop map is somebody's
// screenshot with a caption bar and a watermark on it. What ships is the clean
// season map, and the app draws the boxes over it -- so the two images have to
// be put in the same frame first. They are both square renders of one island, so
// the island's own bounding box is the frame: find it in each, and the map from
// one to the other is a scale and a shift.
//
// The bounds are taken at the 0.5th and 99.5th percentile of land rather than at
// its extremes, so a caption, a logo or a stray bright pixel in the ocean cannot
// stretch the frame.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const SRC = process.argv[2], CLEAN = process.argv[3], BOXES = process.argv[4];
if (!SRC || !CLEAN || !BOXES) throw new Error('usage: align-zones.js <annotated> <clean> <boxes.json>');
for (const f of [SRC, CLEAN, BOXES]) if (!fs.existsSync(f)) throw new Error('missing: ' + f);

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

function islandBox(file) {
  const b64 = fs.readFileSync(file).toString('base64');
  const html = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
document.getElementById('i').onload = function(){
  var im = this, c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  var W = c.width, H = c.height, d = g.getImageData(0, 0, W, H).data;

  // Background is whatever the border of the picture is made of -- deep ocean on
  // one map, flat grey on another -- so it is sampled rather than assumed.
  var br = 0, bg = 0, bb = 0, n = 0;
  function sample(x, y){ var i = (y*W+x)*4; br += d[i]; bg += d[i+1]; bb += d[i+2]; n++; }
  for (var x = 0; x < W; x += 4){ sample(x, 2); sample(x, H-3); }
  for (var y = 0; y < H; y += 4){ sample(2, y); sample(W-3, y); }
  br /= n; bg /= n; bb /= n;

  var xs = new Int32Array(W), ys = new Int32Array(H), total = 0;
  for (var yy = 0; yy < H; yy++){
    for (var xx = 0; xx < W; xx++){
      var i2 = (yy*W+xx)*4;
      var dr = d[i2]-br, dg = d[i2+1]-bg, db = d[i2+2]-bb;
      if (dr*dr + dg*dg + db*db > 40*40){ xs[xx]++; ys[yy]++; total++; }
    }
  }
  function bound(counts, len, frac){
    var want = total * frac, acc = 0;
    for (var i = 0; i < len; i++){ acc += counts[i]; if (acc >= want) return i; }
    return len - 1;
  }
  document.getElementById('o').textContent = 'BEGINB' + JSON.stringify({
    W: W, H: H,
    x0: bound(xs, W, 0.005), x1: bound(xs, W, 0.995),
    y0: bound(ys, H, 0.005), y1: bound(ys, H, 0.995),
    bg: [Math.round(br), Math.round(bg), Math.round(bb)]
  }) + 'ENDB';
};
<\/script>`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'align-'));
  const f = path.join(dir, 'a.html');
  fs.writeFileSync(f, html);
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=30000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  const m = dom.match(/BEGINB(\{[\s\S]*?\})ENDB/);
  if (!m) throw new Error('island detection failed for ' + file);
  return JSON.parse(m[1]);
}

const a = islandBox(SRC);
const b = islandBox(CLEAN);
console.error('annotated ' + a.W + 'x' + a.H + '  island x ' + a.x0 + '-' + a.x1 + ', y ' + a.y0 + '-' + a.y1 + '  bg ' + a.bg);
console.error('clean     ' + b.W + 'x' + b.H + '  island x ' + b.x0 + '-' + b.x1 + ', y ' + b.y0 + '-' + b.y1 + '  bg ' + b.bg);

const aw = a.x1 - a.x0, ah = a.y1 - a.y0;
const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
console.error('scale x ' + (bw / aw).toFixed(4) + ', y ' + (bh / ah).toFixed(4));

// Boxes arrive as percentages of the annotated image and leave as percentages of
// the clean one.
const boxes = JSON.parse(fs.readFileSync(BOXES, 'utf8'));
const out = boxes.map(z => {
  const px = z.x / 100 * a.W, py = z.y / 100 * a.H;
  const pw = z.w / 100 * a.W, ph = z.h / 100 * a.H;
  const nx = b.x0 + (px - a.x0) * bw / aw;
  const ny = b.y0 + (py - a.y0) * bh / ah;
  const nw = pw * bw / aw, nh = ph * bh / ah;
  return {
    x: +(100 * nx / b.W).toFixed(2), y: +(100 * ny / b.H).toFixed(2),
    w: +(100 * nw / b.W).toFixed(2), h: +(100 * nh / b.H).toFixed(2)
  };
});
// Clamp to the picture: a rectangle drawn right at the island's edge can land a
// hair outside once rescaled, and a negative width breaks the picker's layout.
out.forEach(z => {
  if (z.x < 0){ z.w += z.x; z.x = 0; }
  if (z.y < 0){ z.h += z.y; z.y = 0; }
  if (z.x + z.w > 100) z.w = +(100 - z.x).toFixed(2);
  if (z.y + z.h > 100) z.h = +(100 - z.y).toFixed(2);
});
out.sort((p, q) => p.y - q.y || p.x - q.x);
console.log(out.map(z => '    {x:' + z.x + ',y:' + z.y + ',w:' + z.w + ',h:' + z.h + '},').join('\n'));
console.error(out.length + ' rectangles aligned');
