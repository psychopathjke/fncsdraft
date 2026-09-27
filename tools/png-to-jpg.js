// PNG → JPEG через headless Chrome (canvas.toDataURL): ImageMagick на машине нет.
//   node tools/png-to-jpg.js <in.png> <out.jpg> [quality=0.82]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [inp, outp, q] = process.argv.slice(2);
const b64 = fs.readFileSync(inp).toString('base64');
const html = `<pre id="o"></pre><script>
const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight;
  c.getContext('2d').drawImage(im,0,0); document.getElementById('o').textContent='JB'+c.toDataURL('image/jpeg',${+(q || 0.82)}).split(',')[1]+'JE'; };
im.src='data:image/png;base64,${b64}';
</script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pj-'));
const tmp = path.join(dir, 'p.html'); fs.writeFileSync(tmp, html);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--virtual-time-budget=20000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 28 }).toString();
const m = /JB([A-Za-z0-9+/=]+)JE/.exec(dom);
if (!m) { console.log('no output'); process.exit(1); }
fs.writeFileSync(outp, Buffer.from(m[1], 'base64'));
console.log(outp, fs.statSync(outp).size);
