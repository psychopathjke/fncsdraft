// Does a card say which stage its numbers come from?
//
// The real-data block on the back of a card used to know two stages — the
// Play-In and the Last Chance Qualifier — and called everything else a Play-In.
// That is how the winner of a Reload final came out labelled "PLAY-IN — REAL
// DATA" over the numbers he put up in the final. This asks a card of every
// stage what it calls itself.
//
//   node tools/check-card-stage-label.js
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
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {rows: [], error: null};
  try{
    setLang('en', false);
    const want = [['final','Final'], ['heat1','Heat 1'], ['heat4','Heat 4'],
                  ['playin','Play-In'], ['open','Opens']];
    want.forEach(([stage, expect]) => {
      const card = PLAYERS.find(p => /^r\\d$/.test(p.cardSet || '') && p._rStage === stage);
      if(!card){ out.rows.push({stage, missing: true}); return; }
      const html = playerStatSheetHTML(null, 0, card);
      const title = (html.match(/fut-foot[^>]*>([^<]*real data[^<]*)</i) || [])[1] || '(none)';
      const rank = (html.match(/<span>([^<]*rank[^<]*)<\\/span>/i) || [])[1] || '(none)';
      out.rows.push({stage, expect, handle: card.handle, title: title.trim(), rank: rank.trim(),
                     pts: card.real && card.real.pts, place: card.real && card.real.rank});
    });
    // and a FNCS card still reads the way it always did
    const fncs = PLAYERS.find(p => p.cardSet === 'm2' && p.real && !p.realGf);
    if(fncs){
      const html = playerStatSheetHTML(null, 0, fncs);
      out.fncs = ((html.match(/fut-foot[^>]*>([^<]*real data[^<]*)</i) || [])[1] || '(none)').trim();
    }
  }catch(e){ out.error = String(e && e.stack || e).slice(0, 500); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cardlbl-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=90000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

let bad = 0;
const say = (ok, line) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + line); if(!ok) bad++; };
out.rows.forEach(r => {
  if (r.missing){ say(false, r.stage + ': no card of that stage exists'); return; }
  console.log('  ' + r.stage.padEnd(7) + r.handle.padEnd(18) + '#' + r.place + ', ' + r.pts + ' pts   "' +
              r.title + '" / "' + r.rank + '"');
});
console.log('');
out.rows.filter(r => !r.missing).forEach(r => {
  say(r.title.toLowerCase().indexOf(r.expect.toLowerCase()) === 0,
      r.stage + ' says ' + JSON.stringify(r.title) + ' rather than calling itself a Play-In');
});
say(!out.fncs || /play-in|last chance|grand/i.test(out.fncs), 'a FNCS card still reads the way it did (' + out.fncs + ')');
console.log('\n' + (bad ? bad + ' failing' : 'every card names the stage its numbers come from'));
process.exit(bad ? 1 : 0);
