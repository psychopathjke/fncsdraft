// Reads the drop-spot rectangles off an annotated competitive map and emits them
// as the percentage boxes ZONE_SETS wants.
//
// STATUS: not good enough to ship from. On the FNCS 2025 Major 1 Grand Finals
// map it finds 17 of roughly 35 boxes, and merges any pair that shares an edge
// into one oversized rectangle. Connected components cannot separate touching
// outlines, and the black strokes blend into dark terrain. Reconstructing
// rectangles from horizontal and vertical run segments would handle both, and
// is where the next attempt should start.
//
// The rectangles are drawn as closed black or red outlines over a darkened map,
// so each one is a single connected component whose bounding box IS the
// rectangle. Terrain also goes dark in places, so components are kept only when
// they look like an outline rather than a blob: a rectangle border fills a small
// fraction of its own bounding box, a dark lake fills most of it.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const IMG = process.argv[2];
if (!IMG || !fs.existsSync(IMG)) throw new Error('pass the annotated map image');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const b64 = fs.readFileSync(IMG).toString('base64');
const html = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
document.getElementById('i').onload = function(){
  var im = this, c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  var W = c.width, H = c.height;
  var d = g.getImageData(0, 0, W, H).data;

  // Outline mask: near-black strokes, or the saturated red ones.
  var mask = new Uint8Array(W * H);
  for (var i = 0, p = 0; i < d.length; i += 4, p++){
    var r = d[i], gg = d[i+1], b = d[i+2];
    var black = (r < 70 && gg < 70 && b < 70);
    var red   = (r > 110 && gg < 80 && b < 80 && (r - Math.max(gg, b)) > 55);
    mask[p] = (black || red) ? 1 : 0;
  }

  // Connected components, 8-way, iterative so a long border cannot blow the stack.
  var seen = new Uint8Array(W * H);
  var boxes = [];
  var stack = new Int32Array(W * H);
  for (var s = 0; s < W * H; s++){
    if (!mask[s] || seen[s]) continue;
    var top = 0; stack[top++] = s; seen[s] = 1;
    var minx = W, miny = H, maxx = -1, maxy = -1, count = 0;
    while (top > 0){
      var q = stack[--top];
      var qx = q % W, qy = (q / W) | 0;
      count++;
      if (qx < minx) minx = qx; if (qx > maxx) maxx = qx;
      if (qy < miny) miny = qy; if (qy > maxy) maxy = qy;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++){
        if (!dx && !dy) continue;
        var nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        var n = ny * W + nx;
        if (mask[n] && !seen[n]){ seen[n] = 1; stack[top++] = n; }
      }
    }
    var bw = maxx - minx + 1, bh = maxy - miny + 1;
    if (bw < 40 || bh < 30) continue;                 // too small to be a drop spot
    if (bw > W * 0.6 || bh > H * 0.6) continue;        // page furniture, not a box
    var fill = count / (bw * bh);
    if (fill > 0.30) continue;                         // a blob, not an outline
    boxes.push({ x: minx, y: miny, w: bw, h: bh, fill: +fill.toFixed(3) });
  }
  document.getElementById('o').textContent = 'BEGINZ' + encodeURIComponent(JSON.stringify({
    size: W + 'x' + H, boxes: boxes
  })) + 'ENDZ';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zones-'));
const f = path.join(dir, 'z.html');
fs.writeFileSync(f, html);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=30000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
  { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINZ([\s\S]*?)ENDZ/);
if (!m) { console.error('detector did not run; harness at ' + f); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

const [W, H] = out.size.split('x').map(Number);
out.boxes.sort((a, b) => a.y - b.y || a.x - b.x);
console.log('image ' + out.size + ', candidate zones: ' + out.boxes.length);
const pct = out.boxes.map(b => ({
  x: +(100 * b.x / W).toFixed(2), y: +(100 * b.y / H).toFixed(2),
  w: +(100 * b.w / W).toFixed(2), h: +(100 * b.h / H).toFixed(2)
}));
console.log(pct.map(z => '    {x:' + z.x + ',y:' + z.y + ',w:' + z.w + ',h:' + z.h + '},').join('\n'));
