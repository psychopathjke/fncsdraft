// Every hub tab and every number in the identity bar has to be reachable
// at the width a phone gives them.
//
// The strip is a flex row, and it had no wrap: six tabs want 573px while a
// 390px phone leaves the panel 362, so TABLE, SHOP and HISTORY sat past the
// right edge. Not scrolled off — overflow-x on the strip is visible, so there
// was nothing to scroll. They were simply unreachable, and the shop read as a
// feature that did not exist.
//
//   node tools/check-hub-tabs.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// Two widths: the phone that broke, and a desktop that must not gain a second row.
const WIDTHS = [390, 1440];

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  function done(){
    document.title = 'PBEGIN' + encodeURIComponent(JSON.stringify(out)) + 'PEND';
  }
  window.addEventListener('load', function(){
    try{
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
      const nick = document.getElementById('ccNick');
      nick.value = 'TabProbe'; nick.dispatchEvent(new Event('input', {bubbles:true}));
      if (typeof ccSync === 'function') ccSync();
      const start = document.getElementById('ccStart');
      if (start.disabled) { out.err = 'start stayed disabled'; return done(); }
      start.click();

      const tabs = [].slice.call(document.querySelectorAll('[onclick*="careerTab"]'))
        .filter(function(e){ return e.offsetHeight > 0; });
      if (tabs.length < 6) { out.err = 'expected six tabs, saw ' + tabs.length; return done(); }

      const vw = window.innerWidth;
      const rows = {};
      const unreachable = [];
      tabs.forEach(function(t){
        const r = t.getBoundingClientRect();
        rows[Math.round(r.top)] = 1;
        if (r.right > vw + 1 || r.left < -1)
          unreachable.push((t.innerText || '').trim());
      });
      out.notes.width = vw;
      out.notes.tabs = tabs.length;
      out.notes.rows = Object.keys(rows).length;
      out.notes.unreachable = unreachable;

      if (unreachable.length)
        out.fails.push(vw + 'px: off the edge and unscrollable — ' + unreachable.join(', '));

      // The identity bar is the same shape of box and broke the same way:
      // flex, no wrap, overflow visible, so the season and the follower count
      // sat past the right edge with no way to reach them.
      const top = document.querySelector('.ch-top');
      if (!top) out.fails.push('no identity bar');
      else {
        out.notes.topScrollW = top.scrollWidth;
        out.notes.topClientW = top.clientWidth;
        if (top.scrollWidth > top.clientWidth + 1)
          out.fails.push(vw + 'px: the identity bar hides ' +
            (top.scrollWidth - top.clientWidth) + 'px with nothing to scroll');
        [].slice.call(top.children).forEach(function(el){
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > vw + 1)
            out.fails.push(vw + 'px: "' + (el.className||'?') + '" runs off the edge');
        });
      }

      // The shop has to actually open when pressed.
      const shop = tabs.filter(function(t){ return /SHOP|МАГАЗ/i.test(t.innerText || ''); })[0];
      if (!shop) out.fails.push('no shop tab');
      else {
        shop.click();
        const items = document.querySelectorAll('[onclick*="careerBuy"]').length;
        out.notes.shopItems = items;
        if (!items) out.fails.push(vw + 'px: the shop tab opened nothing');
      }
      done();
    } catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let bad = 0;
for (const w of WIDTHS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabs-'));
  const tmp = path.join(dir, 'probe.html');
  fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--window-size=' + w + ',900',
    '--virtual-time-budget=30000', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) { console.error(w + 'px: probe did not run; copy at ' + tmp); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.err) { console.error(w + 'px: ' + out.err); process.exit(1); }
  console.log(w + 'px ' + JSON.stringify(out.notes));
  out.fails.forEach(f => { console.error('FAIL ' + f); bad++; });
  fs.rmSync(dir, { recursive: true, force: true });
}
if (bad) process.exit(1);
console.log('every tab and every number is reachable at both widths, and the shop opens');
