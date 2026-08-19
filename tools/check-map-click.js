// Every country on the map can be clicked, including the four too small to
// carry their own number.
//
// Those four get a badge out at sea with a leader line pointing home, and the
// lines are drawn after the shapes — so each line lies on top of the country it
// points away from. On Andorra and Malta the line crosses the whole country:
// the cursor was over the line rather than the land, ccMapClick found no
// data-code above it, and the click was dropped. Neither could be picked at
// all. Luxembourg and Cyprus have room either side of theirs and were fine,
// which is why this went unnoticed. His report, 20 August.
//
// Decoration must not take a click, so the lines are pointer-events:none. This
// checks the rule rather than the two countries, because the next callout added
// would bring the bug back.
//
//   node tools/check-map-click.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  const start = () => {
    localStorage.clear();
    careerEntry();
    // The maps arrive on their own; the screen asks for them when it draws.
    return new Promise(res => {
      let tries = 0;
      const wait = () => {
        const svg = document.querySelector('#ccGrid .cc-map');
        if (svg && svg.querySelector('path[data-code]')) return res(svg);
        if (++tries > 200) return res(null);
        setTimeout(wait, 50);
      };
      wait();
    });
  };

  start().then(svg => {
    try{
      if (!svg) fail('the country map never drew');
      const paths = [...svg.querySelectorAll('path[data-code]')];
      if (paths.length < 40) fail('only ' + paths.length + ' countries drawn');
      out.steps.push(paths.length + ' countries on the map');

      // ---- decoration does not take clicks ------------------------------
      // Read off the stylesheet rather than off one country's geometry, so this
      // holds for any callout added later.
      const leads = [...svg.querySelectorAll('line.cc-lead')];
      if (!leads.length) fail('no leader lines on the map at all — the callouts are gone');
      const blocking = leads.filter(l => getComputedStyle(l).pointerEvents !== 'none');
      if (blocking.length)
        fail(blocking.length + ' of ' + leads.length + ' leader lines still take clicks — ' +
             'the country underneath cannot be picked');
      out.steps.push('all ' + leads.length + ' leader lines are pointer-events:none');

      // ---- and the countries they point at are reachable ----------------
      // The middle of a country this small is the only place a player can aim,
      // and it is exactly where the line used to sit.
      const tiny = ['ad','mt','lu','cy'];
      const missing = tiny.filter(c => !svg.querySelector('path[data-code="' + c + '"]'));
      if (missing.length) fail('not on the map: ' + missing.join(', '));
      const box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      const lost = [];
      tiny.forEach(c => {
        const p = svg.querySelector('path[data-code="' + c + '"]');
        const bb = p.getBBox();
        const x = box.x + (bb.x + bb.width / 2) / vb.width * box.width;
        const y = box.y + (bb.y + bb.height / 2) / vb.height * box.height;
        const top = document.elementFromPoint(x, y);
        if (!top) { lost.push(c + ': off-screen in this window'); return; }
        const owner = top.closest('[data-code]');
        if (!owner) lost.push(c + ': the click lands on ' + top.tagName +
                              '.' + (top.getAttribute('class') || '') + ', which carries no country');
        else if (owner.getAttribute('data-code') !== c)
          lost.push(c + ': aiming at it hits ' + owner.getAttribute('data-code'));
      });
      if (lost.length) fail('a country with a callout cannot be picked — ' + lost.join(' | '));
      out.steps.push('the four callout countries take a click at their centre: ' + tiny.join(', '));

      // ---- the handler itself still reads a country off a click ----------
      const before = CC.country;
      const es = svg.querySelector('path[data-code="es"]') || paths[0];
      const code = es.getAttribute('data-code');
      es.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
      if (CC.country !== code)
        fail('clicking ' + code + ' left the selection on ' + CC.country + ' (was ' + before + ')');
      out.steps.push('clicking a country selects it: ' + code);
    } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
    out.errs = window.__errs;
    document.getElementById('__out').textContent =
      'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
  });
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapclick-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--window-size=1280,2000','--allow-file-access-from-files','--virtual-time-budget=120000',
  '--dump-dom', 'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('every country takes a click, the callout lines do not');
