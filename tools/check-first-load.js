// What a phone fetches before it has scrolled anywhere.
//
// Seven mode tiles carried their art in an inline background-image, so the
// browser had all seven before the first screen finished drawing — 368KB, of
// which mode-ewc.jpg is 396KB on disk, on a screen that shows two tiles. And
// favicon.ico, at 111KB, was the icon listed first, so it was the one taken.
//
// This asks the page what it actually pulled.
//
//   node tools/check-first-load.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  function done(){ document.title='PBEGIN'+encodeURIComponent(JSON.stringify(out))+'PEND'; }
  window.addEventListener('load', function(){
    setTimeout(function(){
      try{
        const got = performance.getEntriesByType('resource')
          .map(function(r){ return r.name.split('/').slice(-2).join('/'); });
        const art = got.filter(function(n){ return /art\\/mode-/.test(n); });
        const ico = got.filter(function(n){ return /favicon\\.ico$/.test(n); });
        out.notes.tilesFetched = art;
        out.notes.faviconIco = ico.length > 0;
        out.notes.stillLazy = document.querySelectorAll('[data-art]').length;

        // The first screen shows the 2026 tiles. Nothing below it should have
        // been pulled before a scroll.
        if (art.length > 3)
          out.fails.push('the first screen pulled ' + art.length + ' tile images: ' + art.join(', '));
        if (ico.length)
          out.fails.push('favicon.ico was fetched — the 48px png should win');
        done();
      }catch(e){ out.err = String(e && e.stack || e); done(); }
    }, 400);
  });
})();
</script>
`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
// Copy what the page reaches for, so the fetches are real.
for (const d of ['art', 'logos', 'photos']) {
  const from = path.join(ROOT, d);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(dir, d), {recursive: true});
}
for (const f of ['favicon.ico', 'favicon-48.png', 'favicon-96.png', 'favicon-192.png',
                 'logo.png', 'zone-sim.js', 'zone-replay.js']) {
  const from = path.join(ROOT, f);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dir, f));
}
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=390,844',
  '--virtual-time-budget=30000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer: 512*1024*1024, encoding:'utf8'});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the first screen pulls only the art it can show');
fs.rmSync(dir, {recursive: true, force: true});
