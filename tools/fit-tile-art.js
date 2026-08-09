// Refits a wide key art into the 760x608 tile the mode grid expects.
//
// Every existing art in art/ is exactly 760x608, because .ec-art is
// aspect-ratio:5/4 with background-size:cover -- drop a 16:9 poster in and cover
// throws away about a third of its width, which is what displaced the FNCS 2025
// shield. Cropping to 5:4 would lose the same third, so instead the whole poster
// is fitted to the width and the bands above and below are filled from the
// colours already at its top and bottom edges.
//
//   node tools/fit-tile-art.js <source.jpg> <out.jpg>
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const SRC = process.argv[2], OUT = process.argv[3];
if (!SRC || !OUT || !fs.existsSync(SRC)) throw new Error('usage: fit-tile-art.js <source> <out.jpg>');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const TW = 760, TH = 608;
const b64 = fs.readFileSync(SRC).toString('base64');
const html = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
document.getElementById('i').onload = function(){
  var im = this;
  var probe = document.createElement('canvas');
  probe.width = im.naturalWidth; probe.height = im.naturalHeight;
  var pg = probe.getContext('2d'); pg.drawImage(im, 0, 0);
  // The brightest quartile of an edge row, not its mean. Averaging a row that
  // crosses red slashes yields a dusty pink that belongs to neither the art nor
  // the brand; the poster's own ground is white, so the band should be too.
  function edge(y){
    var d = pg.getImageData(0, y, im.naturalWidth, 1).data, lum = [];
    for (var i=0;i<d.length;i+=4) lum.push([0.299*d[i]+0.587*d[i+1]+0.114*d[i+2], d[i], d[i+1], d[i+2]]);
    lum.sort(function(a,b){ return b[0]-a[0]; });
    var take = Math.max(1, Math.floor(lum.length*0.25)), r=0,g2=0,b=0;
    for (var j=0;j<take;j++){ r+=lum[j][1]; g2+=lum[j][2]; b+=lum[j][3]; }
    return 'rgb(' + Math.round(r/take) + ',' + Math.round(g2/take) + ',' + Math.round(b/take) + ')';
  }
  var top = edge(0), bottom = edge(im.naturalHeight - 1);

  var c = document.createElement('canvas');
  c.width = ${TW}; c.height = ${TH};
  var g = c.getContext('2d');
  var grad = g.createLinearGradient(0, 0, 0, ${TH});
  grad.addColorStop(0, top); grad.addColorStop(1, bottom);
  g.fillStyle = grad; g.fillRect(0, 0, ${TW}, ${TH});

  var h = Math.round(${TW} * im.naturalHeight / im.naturalWidth);
  // Sat a little above centre: the tile paints its title over the lower third.
  var y = Math.round((${TH} - h) * 0.38);
  g.drawImage(im, 0, y, ${TW}, h);

  document.getElementById('o').textContent = 'BEGINF' +
    encodeURIComponent(JSON.stringify({ top: top, bottom: bottom, drawH: h, drawY: y,
      jpg: c.toDataURL('image/jpeg', 0.92) })) + 'ENDF';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fit-'));
const f = path.join(dir, 'f.html');
fs.writeFileSync(f, html);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=10000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
  { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINF([\s\S]*?)ENDF/);
if (!m) { console.error('refit did not run; harness at ' + f); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

fs.writeFileSync(OUT, Buffer.from(out.jpg.split(',')[1], 'base64'));
console.log('fitted to ' + TW + 'x' + TH + ' — poster drawn ' + TW + 'x' + out.drawH +
            ' at y=' + out.drawY + ', bands ' + out.top + ' to ' + out.bottom);
console.log('written to ' + OUT);
