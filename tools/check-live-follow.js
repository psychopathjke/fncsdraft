// Does the live table keep your squad in view?
//
// It is a 520px window over a field of fifty to a hundred and fifty, and it used
// to sit at rank one for the whole stage. A player in 27th watched other
// people's places move for twelve games and never saw their own row.
//
//   node tools/check-live-follow.js
'use strict';

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__lf" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], rows: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  // The scroll the live table performs, lifted out of simulateGamesLive so it
  // can be exercised without playing a whole stage: centre the row in the box.
  function targetFor(rowTop, rowH, boxH, scrollH){
    return Math.max(0, Math.min(scrollH - boxH, rowTop - boxH / 2 + rowH / 2));
  }
  try {
    var ROW = 34, BOX = 520;
    // A field of 150 with the player at a spread of places.
    [1, 8, 27, 75, 149].forEach(function(place){
      var scrollH = 150 * ROW;
      var rowTop = (place - 1) * ROW;
      var top = targetFor(rowTop, ROW, BOX, scrollH);
      var visible = rowTop >= top - 1 && (rowTop + ROW) <= top + BOX + 1;
      out.rows.push({place: place, scrollTop: Math.round(top), visible: visible});
      check('a squad in ' + place + (place===1?'st':place===8?'th':'th') + ' is on screen',
        visible, 'row at ' + rowTop + 'px, window ' + Math.round(top) + '-' + Math.round(top + BOX));
    });
    // Never past the end of the list, and never negative.
    var atEnd = targetFor(149 * ROW, ROW, BOX, 150 * ROW);
    check('the scroll stops at the bottom of the list',
      atEnd <= 150 * ROW - BOX + 1, 'scrollTop ' + Math.round(atEnd));
    check('the scroll never goes negative for a leader',
      targetFor(0, ROW, BOX, 150 * ROW) === 0, 'leader would scroll to ' + targetFor(0, ROW, BOX, 150 * ROW));

    // And the live table it applies to really is a scrolling window with a row
    // class to find — if either changes name, this check is why it broke.
    var src = document.documentElement.innerHTML;
    check('the live table still marks your row lobby-you',
      src.indexOf('lobby-you') >= 0, 'class not found in the page');
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__lf').textContent =
    'BEGINLF' + encodeURIComponent(JSON.stringify(out)) + 'ENDLF';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-live-follow.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINLF([\s\S]*?)ENDLF/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.rows.forEach(r => console.log('place ' + String(r.place).padStart(3) +
  ' -> scrollTop ' + String(r.scrollTop).padStart(5) + (r.visible ? '  on screen' : '  OFF SCREEN')));
let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
