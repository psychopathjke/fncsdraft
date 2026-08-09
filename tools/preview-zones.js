// Draws a landing grid over a map so it can be checked by eye rather than
// trusted. Reads the grid out of index.html, which is the thing that ships.
//
//   node tools/preview-zones.js t2 out.jpg
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SET = process.argv[2] || 't1';
const OUT = process.argv[3] || path.join(os.tmpdir(), 'zones-' + SET + '.jpg');

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function carve(name, from) {
  const at = html.indexOf(name, from || 0);
  if (at < 0) throw new Error(name + ' not found');
  let i = html.indexOf('[', at), d = 0, end = -1;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === '[') d++;
    else if (c === ']') { d--; if (!d) { end = j + 1; break; } }
  }
  return JSON.parse(html.slice(i, end).replace(/([a-z]+):/g, '"$1":').replace(/,\s*]/g, ']'));
}

const zones = carve('\n  ' + SET + ':[');
const artMatch = html.match(new RegExp(SET + ':"(art/[^"]+)"'));
if (!artMatch) throw new Error('no MAP_ART entry for ' + SET);
const art = artMatch[1];
const b64 = fs.readFileSync(path.join(ROOT, art)).toString('base64');

const page = `<pre id="o"></pre><img id="i" src="data:image/jpeg;base64,${b64}">
<script>
var Z = ${JSON.stringify(zones)};
document.getElementById('i').onload = function(){
  var im = this, c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  g.lineWidth = Math.max(2, Math.round(c.width / 400));
  g.font = Math.round(c.width / 70) + 'px sans-serif';
  Z.forEach(function(z, i){
    var x = z.x/100*c.width, y = z.y/100*c.height, w = z.w/100*c.width, h = z.h/100*c.height;
    g.strokeStyle = '#00ff88'; g.fillStyle = '#00ff88';
    g.strokeRect(x, y, w, h);
    g.fillText(String(i+1), x + 6, y + Math.round(c.width/55));
  });
  document.getElementById('o').textContent = 'BEGINP' + c.toDataURL('image/jpeg', 0.85) + 'ENDP';
};
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zprev-'));
const f = path.join(dir, 'p.html');
fs.writeFileSync(f, page);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=30000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGINP(data:[\s\S]*?)ENDP/);
if (!m) { console.error('preview failed; page at ' + f); process.exit(2); }
fs.writeFileSync(OUT, Buffer.from(m[1].split(',')[1], 'base64'));
fs.rmSync(dir, { recursive: true, force: true });
console.log(SET + ': ' + zones.length + ' zones over ' + art + ' -> ' + OUT);
