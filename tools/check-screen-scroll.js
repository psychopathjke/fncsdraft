// Leaving a long screen opens the next one at the top.
//
// A results screen runs for metres — eleven stage cards with a standings table
// each — and show() never touched the scroll position, so leaving one from the
// bottom opened the main menu at that same height, past its own end. The rule
// has two halves and both are here: a change of screen scrolls to the top, and
// re-showing the screen already up does not, because show() is called that way
// by hub redraws and mode switches that must not jump the page.
//
//   node tools/check-screen-scroll.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    // A results screen with something long on it.
    show('screen-results');
    const box = document.getElementById('majorStages');
    box.innerHTML = '<div style="height:4000px"></div>';
    await wait(30);
    window.scrollTo(0, 2600);
    await wait(30);
    out.notes.scrolledTo = window.scrollY;
    check('the page really scrolled', window.scrollY > 1000, String(window.scrollY));
    // Out to the menu.
    show('screen-mode');
    await wait(30);
    out.notes.afterLeaving = window.scrollY;
    check('the menu opens at the top', window.scrollY === 0, String(window.scrollY));
    // And redrawing the screen that is already up does not jump the page.
    window.scrollTo(0, 0);
    show('screen-mode');
    const menu = document.getElementById('screen-mode');
    menu.style.minHeight = '3000px';
    await wait(20);
    window.scrollTo(0, 900);
    await wait(20);
    show('screen-mode');
    await wait(20);
    out.notes.sameScreen = window.scrollY;
    check('re-showing the same screen keeps the place', window.scrollY === 900, String(window.scrollY));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsscroll-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000',
  '--window-size=1280,900', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a screen change lands at the top, a redraw stays put');
fs.rmSync(dir, { recursive: true, force: true });
