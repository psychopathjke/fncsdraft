// Reads the drop-spot rectangles off an annotated competitive map and emits them
// as the percentage boxes ZONE_SETS wants, plus an overlay image so the result
// can be checked by eye rather than trusted.
//
// Rectangles are reconstructed from line segments, not from connected
// components. Components cannot separate two boxes that share an edge -- they
// weld into one -- and on the FNCS 2025 map that lost half the grid. Segments
// find each border independently, so a shared edge simply serves both boxes.
//
//   node tools/extract-zones.js <annotated.jpg> [overlay-out.png]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const IMG = process.argv[2];
const OVERLAY = process.argv[3];
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
  var W = c.width, H = c.height, d = g.getImageData(0, 0, W, H).data;

  // Two kinds of box need two kinds of detection, which the first pass missed.
  // Black boxes are drawn as outlines, so their borders are line segments. Red
  // boxes are translucent FILLS, so treating them as outlines shreds each one
  // into a stack of stripes -- they are regions, and a region's bounding box is
  // already the rectangle.
  var DARK = ${process.env.DARK || 42};
  var mask = new Uint8Array(W * H);     // black strokes only
  var fill = new Uint8Array(W * H);     // red washes
  for (var i = 0, p = 0; i < d.length; i += 4, p++){
    var r = d[i], gg = d[i+1], b = d[i+2];
    if (r > 95 && (r - gg) > 38 && (r - b) > 38) fill[p] = 1;
    else if (r < DARK && gg < DARK && b < DARK) mask[p] = 1;
  }
  var on = function(x, y){ return (x>=0 && y>=0 && x<W && y<H) ? mask[y*W+x] : 0; };

  // A border stroke is a few pixels thick and can wobble, so a run is allowed
  // to hop one pixel up or down and to bridge small gaps.
  var MINLEN = Math.round(Math.min(W, H) * 0.05);
  var GAP = 4;

  function runsAlong(len, cross, get){
    var out = [];
    for (var cpos = 0; cpos < cross; cpos++){
      var start = -1, miss = 0;
      for (var t = 0; t <= len; t++){
        var hit = (t < len) && (get(t, cpos) || get(t, cpos-1) || get(t, cpos+1));
        if (hit){ if (start < 0) start = t; miss = 0; }
        else if (start >= 0){
          miss++;
          if (miss > GAP || t === len){
            var end = t - miss;
            if (end - start >= MINLEN) out.push({ c: cpos, a: start, b: end });
            start = -1; miss = 0;
          }
        }
      }
    }
    return out;
  }

  var hRuns = runsAlong(W, H, function(t, cpos){ return on(t, cpos); });
  var vRuns = runsAlong(H, W, function(t, cpos){ return on(cpos, t); });

  // Collapse the two or three parallel rows a thick stroke produces.
  function dedupe(runs){
    runs.sort(function(x, y){ return x.c - y.c || x.a - y.a; });
    var out = [];
    runs.forEach(function(r){
      for (var i = 0; i < out.length; i++){
        var o = out[i];
        if (Math.abs(o.c - r.c) <= 3 && Math.abs(o.a - r.a) <= 8 && Math.abs(o.b - r.b) <= 8){
          o.a = Math.min(o.a, r.a); o.b = Math.max(o.b, r.b);
          return;
        }
      }
      out.push({ c: r.c, a: r.a, b: r.b });
    });
    return out;
  }
  hRuns = dedupe(hRuns); vRuns = dedupe(vRuns);

  // A rectangle is two horizontals sharing an x-range with two verticals
  // sharing a y-range, meeting near the corners.
  var TOL = 10;
  var boxes = [];
  for (var t1 = 0; t1 < hRuns.length; t1++){
    for (var t2 = 0; t2 < hRuns.length; t2++){
      var top = hRuns[t1], bot = hRuns[t2];
      if (bot.c - top.c < MINLEN * 0.6) continue;
      var x0 = Math.max(top.a, bot.a), x1 = Math.min(top.b, bot.b);
      if (x1 - x0 < MINLEN) continue;
      if (Math.abs(top.a - bot.a) > TOL || Math.abs(top.b - bot.b) > TOL) continue;
      var left = null, right = null;
      for (var v = 0; v < vRuns.length; v++){
        var vr = vRuns[v];
        if (vr.a > top.c + TOL || vr.b < bot.c - TOL) continue;
        if (Math.abs(vr.c - x0) <= TOL && !left) left = vr;
        if (Math.abs(vr.c - x1) <= TOL) right = vr;
      }
      if (!left || !right) continue;
      boxes.push({ x: x0, y: top.c, w: x1 - x0, h: bot.c - top.c });
    }
  }
  // Keep the tightest rectangle for each corner, so a box is not also reported
  // together with its neighbour.
  boxes.sort(function(a, b){ return (a.w * a.h) - (b.w * b.h); });
  var kept = [];
  boxes.forEach(function(b){
    for (var i = 0; i < kept.length; i++){
      var k = kept[i];
      if (Math.abs(k.x - b.x) <= TOL && Math.abs(k.y - b.y) <= TOL &&
          Math.abs(k.w - b.w) <= TOL && Math.abs(k.h - b.h) <= TOL) return;
    }
    kept.push(b);
  });

  // Red regions: flood fill, keep components that are big and solid.
  var seenF = new Uint8Array(W * H), stackF = new Int32Array(W * H);
  for (var s0 = 0; s0 < W * H; s0++){
    if (!fill[s0] || seenF[s0]) continue;
    var topF = 0; stackF[topF++] = s0; seenF[s0] = 1;
    var mnx = W, mny = H, mxx = -1, mxy = -1, cnt = 0;
    while (topF > 0){
      var q = stackF[--topF], qx = q % W, qy = (q / W) | 0;
      cnt++;
      if (qx < mnx) mnx = qx; if (qx > mxx) mxx = qx;
      if (qy < mny) mny = qy; if (qy > mxy) mxy = qy;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++){
        var nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        var n = ny * W + nx;
        if (fill[n] && !seenF[n]){ seenF[n] = 1; stackF[topF++] = n; }
      }
    }
    var fw = mxx - mnx + 1, fh = mxy - mny + 1;
    if (fw < MINLEN || fh < MINLEN * 0.6) continue;
    if (fw > W * 0.55 || fh > H * 0.55) continue;
    if (cnt / (fw * fh) < 0.55) continue;      // must be solid, not a ring
    kept.push({ x: mnx, y: mny, w: fw, h: fh, red: true });
  }

  // Overlay for eyeballing.
  g.lineWidth = 3; g.strokeStyle = '#00ff88'; g.font = '14px sans-serif'; g.fillStyle = '#00ff88';
  kept.forEach(function(b, i){
    g.strokeStyle = b.red ? '#00d0ff' : '#00ff88';
    g.fillStyle = g.strokeStyle;
    g.strokeRect(b.x, b.y, b.w, b.h); g.fillText(String(i+1), b.x+4, b.y+16);
  });

  document.getElementById('o').textContent = 'BEGINZ' + encodeURIComponent(JSON.stringify({
    size: W + 'x' + H, hRuns: hRuns.length, vRuns: vRuns.length,
    boxes: kept, png: c.toDataURL('image/png')
  })) + 'ENDZ';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zones-'));
const f = path.join(dir, 'z.html');
fs.writeFileSync(f, html);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=40000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINZ([\s\S]*?)ENDZ/);
if (!m) { console.error('detector did not run; harness at ' + f); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

const [W, H] = out.size.split('x').map(Number);
out.boxes.sort((a, b) => a.y - b.y || a.x - b.x);
console.log('image ' + out.size + '  segments: ' + out.hRuns + ' horizontal, ' + out.vRuns + ' vertical');
console.log('rectangles found: ' + out.boxes.length);
console.log(out.boxes.map(b =>
  '    {x:' + (100*b.x/W).toFixed(2) + ',y:' + (100*b.y/H).toFixed(2) +
  ',w:' + (100*b.w/W).toFixed(2) + ',h:' + (100*b.h/H).toFixed(2) + '},').join('\n'));

if (OVERLAY) {
  fs.writeFileSync(OVERLAY, Buffer.from(out.png.split(',')[1], 'base64'));
  console.log('\noverlay written to ' + OVERLAY);
}
