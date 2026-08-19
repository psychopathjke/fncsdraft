// Playing a week for yourself has to give the hub back.
//
// careerFastForward runs the days in a loop and only afterwards calls
// show('screen-career-hub') + careerRenderHub(). The try/finally around the loop
// restores skipAnimation and nothing else, so anything thrown inside leaves the
// run stranded: CC_FF stays set (which makes every later fast-forward return at
// the first line), the progress box stays on the body, and the player is left on
// whatever screen the last tournament used — a career with no top panel and no
// tabs, which is what the bug reports describe.
//
// This walks a week and asserts the hub is back, whole, on top.
//
//   node tools/check-career-ff-hub.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const DAYS = parseInt(process.argv[2], 10) || 7;
const BOOT = `
<script>window.FFDAYS = ${DAYS};</script>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  function done(){
    document.title = 'PBEGIN' + encodeURIComponent(JSON.stringify(out)) + 'PEND';
  }
  const errs = [];
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  window.addEventListener('unhandledrejection', function(e){
    errs.push('unhandled rejection: ' + String(e.reason && e.reason.message || e.reason));
  });

  window.addEventListener('load', async function(){
    try{
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
      const nick = document.getElementById('ccNick');
      nick.value = 'FfProbe'; nick.dispatchEvent(new Event('input', {bubbles:true}));
      if (typeof ccSync === 'function') ccSync();
      const start = document.getElementById('ccStart');
      if (start.disabled) { out.err = 'start stayed disabled'; return done(); }
      start.click();

      // A duo event needs somebody in the seat, so take the first offer.
      const offer = careerDms().filter(function(t){
        return t.who && !t.who.org && !t.who.fan && !t.who.hater && !t.who.agent; })[0];
      if (offer) careerDmAccept(offer.id);
      out.notes.partner = !!(CAREER.partner);

      const day0 = careerToday();
      const t0 = Date.now();
      await careerFastForward(window.FFDAYS);
      out.notes.seconds = Math.round((Date.now() - t0) / 100) / 10;
      out.notes.from = day0;
      out.notes.to = careerToday();
      out.notes.played = (CAREER.career.log || []).length;

      // What the player is looking at once it stops.
      const shown = [].slice.call(document.querySelectorAll('.screen.active')).map(function(s){ return s.id; });
      const tabs = [].slice.call(document.querySelectorAll('[onclick*="careerTab"]'))
        .filter(function(e){ return e.offsetHeight > 0; }).length;
      const top = document.querySelector('.ch-top');
      const box = document.getElementById('ccFfBox');

      out.notes.screen = shown.join(',');
      out.notes.tabs = tabs;
      out.notes.topBarHeight = top ? Math.round(top.getBoundingClientRect().height) : null;
      out.notes.progressBoxLeftBehind = !!box;
      out.notes.ffFlagStuck = (typeof CC_FF !== 'undefined') && CC_FF !== null;
      out.notes.pageErrors = errs;

      if (shown.indexOf('screen-career-hub') < 0)
        out.fails.push('left on "' + out.notes.screen + '" instead of the hub');
      if (!tabs) out.fails.push('the hub came back with no tabs');
      if (!top || top.getBoundingClientRect().height < 10)
        out.fails.push('the identity bar is missing or collapsed');
      if (box) out.fails.push('the progress box was left on the page');
      if (out.notes.ffFlagStuck)
        out.fails.push('CC_FF stayed set — no later fast-forward can start');
      if (errs.length) out.fails.push('threw during the run: ' + errs.join(' | '));
      done();
    } catch(e){
      out.err = String(e && e.stack || e);
      done();
    }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,900',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a week played for you gives the hub back');
fs.rmSync(dir, { recursive: true, force: true });
