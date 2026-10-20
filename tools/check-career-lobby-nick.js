// The nickname over every figure in the main menu has to be visible.
//
// Notion «19.10», screen 34 («ник не видно»): in a 1893×839 window the name
// over the front figure sat under the week strip at the top of the menu (the
// strip lies over the stage), so only the bottom half of it showed.
//
//   node tools/check-career-lobby-nick.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// His window from the screenshot, a short laptop, and a tall desktop.
const SIZES = [[1893, 839], [1366, 700], [1920, 1080], [2560, 1080], [2560, 1440], [3440, 1440]];

const BOOT = `
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  function done(){ document.title = 'PBEGIN' + encodeURIComponent(JSON.stringify(out)) + 'PEND'; }
  window.addEventListener('load', function(){
    try{
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(5); ccPickRegion('EU'); ccPickCountry('de');
      const nick = document.getElementById('ccNick');
      nick.value = 'NickProbe'; nick.dispatchEvent(new Event('input', {bubbles:true}));
      if (typeof ccSync === 'function') ccSync();
      const start = document.getElementById('ccStart');
      if (start.disabled) { out.err = 'start stayed disabled'; return done(); }
      start.click();
      function look(bg){
        const names = [].slice.call(document.querySelectorAll('.cc-lobby .cc-lb-plate b'))
          .filter(function(b){ return b.offsetHeight > 0; });
        if (!names.length) out.fails.push(bg + ': no nickname over any figure');
        const bar = document.querySelector('.cc-lobby .cc-lb-bottom');
        const barB = bar ? bar.getBoundingClientRect().bottom : -1e9;
        out.notes[bg] = names.map(function(b){ return Math.round(b.getBoundingClientRect().top - barB); }).join('/');
        names.forEach(function(b){
          b.scrollIntoView({block: 'center'});
          const r = b.getBoundingClientRect(), who = (b.innerText || '').trim();
          // Under the week strip, whatever the scroll.
          if (r.top < bar.getBoundingClientRect().bottom)
            out.fails.push(bg + ': "' + who + '" starts ' + Math.round(bar.getBoundingClientRect().bottom - r.top) + 'px under the week strip');
          // Top and middle of the name: whatever is drawn there has to be the name itself.
          [r.top + 2, r.top + r.height / 2].forEach(function(y){
            const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 20), y);
            if (!hit || !b.closest('.cc-lb-plate').contains(hit))
              out.fails.push(bg + ': "' + who + '" covered at y=' + Math.round(y) + ' by ' + (hit ? hit.className || hit.tagName : 'nothing'));
          });
        });
      }
      // The season's own background, then the three with podiums drawn in the picture (ccLobbyPads sizes the
      // figures from the picture there, not from the stage: his screen was s33, December 2024).
      setTimeout(function(){
        try{
          look('own');
          const lb = document.querySelector('.cc-lobby.cc-lb-full');
          if (!lb) out.fails.push('no full lobby on Centre');
          else ['s11', 's27', 's33'].forEach(function(s){
            lb.style.setProperty('--lb-bg', 'url(art/lobby/' + s + '.webp)');
            ccLobbyFit();
            if (!lb.classList.contains('cc-lb-painted')) out.fails.push(s + ': podiums from the picture not applied');
            look(s);
          });
        } catch(e){ out.err = String(e && e.stack || e); }
        done();
      }, 2000);
    } catch(e){ out.err = String(e && e.stack || e); done(); }
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let bad = 0;
for (const [w, h] of SIZES) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lbnick-'));
  const tmp = path.join(dir, 'probe.html');
  fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--window-size=' + w + ',' + h,
    '--virtual-time-budget=30000', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
  if (!m) { console.error(w + 'x' + h + ': probe did not run; copy at ' + tmp); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.err) { console.error(w + 'x' + h + ': ' + out.err); process.exit(1); }
  console.log(w + 'x' + h + ' ' + JSON.stringify(out.notes));
  out.fails.forEach(f => { console.error('FAIL ' + w + 'x' + h + ': ' + f); bad++; });
  fs.rmSync(dir, { recursive: true, force: true });
}
if (bad) process.exit(1);
console.log('every nickname over the figures is visible at every window size');
