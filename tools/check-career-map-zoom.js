// The map can be brought closer, and coming closer is not choosing.
//
// His ask, 20 August: Rhode Island is four pixels wide and Delaware is smaller,
// so at the map's own scale neither can be hit or read. The map zooms instead —
// wheel, pinch, or the buttons — and drags when it is zoomed. What must hold:
// the frame never leaves the map, the whole map is the floor, and a drag that
// ends over a country does not pick that country.
//
//   node tools/check-career-map-zoom.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const vb = svg => String(svg.getAttribute('viewBox')).split(' ').map(Number);
  const done = () => {
    try {
      // The map is drawn into a box of its own, the way the creation screen
      // draws it, and given a size so client rectangles mean something.
      const host = document.createElement('div');
      host.style.cssText = 'width:800px;height:600px;position:absolute;left:0;top:0';
      host.innerHTML = ccBuildMap(null, 'NAW');
      document.body.appendChild(host);
      const box = host.querySelector('.cc-mapzoom');
      const svg = host.querySelector('.cc-map');
      check('the map comes wrapped in a zoom box', !!box && !!svg);
      check('with buttons on it', host.querySelectorAll('.cc-zoomc button').length === 3);

      const full = vb(svg);
      out.notes.full = full;

      // ---- closer -------------------------------------------------------
      ccMapZoomAt(svg, 2, .5, .5);
      const near = vb(svg);
      out.notes.near = near;
      check('zooming halves the frame', Math.abs(near[2] - full[2]/2) < 1, near.join(' '));
      check('and keeps the middle in the middle',
            Math.abs((near[0] + near[2]/2) - (full[0] + full[2]/2)) < 1, near.join(' '));
      check('the box says it is zoomed', box.classList.contains('cc-zoomed'));

      // ---- and no further than the map ----------------------------------
      for (let i = 0; i < 40; i++) ccMapZoomAt(svg, 2, .5, .5);
      const deep = vb(svg);
      out.notes.deep = deep;
      check('there is a floor under the zoom', deep[2] >= full[2]/12 - 0.01, deep.join(' '));
      for (let i = 0; i < 60; i++) ccMapZoomAt(svg, 0.5, .5, .5);
      const back = vb(svg);
      out.notes.back = back;
      check('and a ceiling: the whole map', Math.abs(back[2] - full[2]) < 0.01 &&
            back[0] === 0 && back[1] === 0, back.join(' '));

      // ---- the frame stays on the map -----------------------------------
      ccMapZoomAt(svg, 4, 0, 0);          // hard into the north-west corner
      ccMapZoomAt(svg, 1, 0, 0);
      const corner = vb(svg);
      out.notes.corner = corner;
      check('the frame never leaves the map',
            corner[0] >= -0.01 && corner[1] >= -0.01 &&
            corner[0] + corner[2] <= full[2] + 0.01 &&
            corner[1] + corner[3] <= full[3] + 0.01, corner.join(' '));

      // ---- dragging moves it, and does not pick -------------------------
      const before = vb(svg);
      const at = (t, x, y) => svg.dispatchEvent(new PointerEvent(t, {
        pointerId: 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      const chosen = () => CC.country;
      CC.mode = 'rookie'; CC.region = 'NAW'; CC.country = null;
      at('pointerdown', 400, 300);
      at('pointermove', 340, 300);
      at('pointermove', 300, 280);
      const moved = vb(svg);
      out.notes.drag = {before, moved};
      check('a drag moves the frame', Math.abs(moved[0] - before[0]) > 1, moved.join(' '));
      // The click the browser sends after the drag lands on whatever is under
      // the finger — here, a country. It must not become the pick.
      const shape = svg.querySelector('[data-code]');
      shape.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
      at('pointerup', 300, 280);
      out.notes.afterDrag = chosen();
      check('but a drag is not a pick', chosen() === null, String(chosen()));

      // ---- a plain click still is ---------------------------------------
      at('pointerdown', 300, 280);
      at('pointerup', 300, 280);
      shape.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
      out.notes.picked = chosen();
      check('a click without a drag still picks', chosen() === shape.getAttribute('data-code'),
            String(chosen()));
    } catch (e) { out.err = String(e && e.stack || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cczoom-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the map comes closer, and coming closer is not choosing');
fs.rmSync(dir, { recursive: true, force: true });
