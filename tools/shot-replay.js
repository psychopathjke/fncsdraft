// Screenshots of the replay at a few points of one game, so the map can be
// looked at rather than reasoned about. The names on it are laid out by what
// room they find, and no amount of counting nodes says whether the result is a
// map with names on it or a wall of names with a map behind it.
//
//   node tools/shot-replay.js [alive ...]      default: 50 20 8
//   node tools/shot-replay.js #4               a frame by its number instead
//
// Writes shot-alive-<n>.png beside the repo. Same engine, same renderer and
// same field as replay-preview.html — long handles included, because a field of
// five-character names is not the field the app has.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.env.SHOT_DIR || ROOT;

const WANT = process.argv.slice(2).length ? process.argv.slice(2) : ['50', '20', '8'];

// A seed your own squad survives, because the one name on the map is yours and
// a screenshot of a game you died on landing in shows nothing at all. Seed 7
// takes it to the last frame; SHOT_SEED picks another.
const SEED = Number(process.env.SHOT_SEED) || 7;

const PAGE = (mark) => `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#0b0e18">
<style>:root{--accent:#3f62ca;--lb-line:#2a3350}</style>
<div id="box"></div>
<script src="zone-sim.js"><\/script>
<script src="zone-replay.js"><\/script>
<script src="tools/shot-field.js"><\/script>
<script>
var SEED = ${SEED};
var handle = ZoneReplay.mount(document.getElementById('box'), 'art/map-m2.jpg', '1100 / 970', 970/1100, {});
var res = ShotField.record(SEED);
var tl = res.timeline, cut = ${JSON.stringify(String(mark))}.charAt(0) === '#'
  ? Math.min(tl.length - 1, ${parseInt(String(mark).replace('#', ''), 10) || 0})
  : tl.length - 1;
if(${JSON.stringify(String(mark))}.charAt(0) !== '#')
  for(var i=0;i<tl.length;i++) if(tl[i].alive <= ${parseInt(String(mark).replace('#', ''), 10) || 0}){ cut = i; break; }
ZoneReplay.play(handle, tl.slice(0, cut + 1), {
  frameMs: 12, labels: {zone: 'ZONE'}, roster: res.roster
});
<\/script></body>`;

for(const mark of WANT){
  const tmp = path.join(ROOT, '.shot.html');
  fs.writeFileSync(tmp, PAGE(mark));
  const out = path.join(OUT, 'shot-' + String(mark).replace('#', 'frame-') + '.png');
  try {
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
      '--hide-scrollbars', '--window-size=540,480',
      '--run-all-compositor-stages-before-draw', '--virtual-time-budget=30000',
      '--screenshot=' + out, 'file:///' + tmp.replace(/\\/g, '/')
    ], { stdio: 'ignore' });
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  console.log('  ' + path.relative(ROOT, out) +
    (String(mark).charAt(0) === '#' ? '  at frame ' + String(mark).slice(1)
                                    : '  at ' + mark + ' alive'));
}
