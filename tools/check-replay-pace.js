// Does the replay actually play, and does it play the boring parts faster?
//
// The pacing rule itself is tested under node in zone-sim-test.js. What cannot
// be tested there is the thing that carries it: play() drives a timer against a
// wall clock, and a tournament awaits its promise before it starts the next
// game — a loop that never reaches the end of the timeline hangs the run for
// ever rather than failing. So this plays two real games in a real browser, one
// paced and one flat, and checks that both finish, that the paced one finishes
// sooner, and that the kill feed printed something on the way.
//
//   node tools/check-replay-pace.js
'use strict';

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// The same synthetic field the node harness uses, so a failure here is the
// browser's and not the lobby's.
const FIELD = `
function fakeField(n){
  var out = [], clamp = function(v){ return Math.max(5, Math.min(99, v)); };
  for(var i=0;i<n;i++){
    var q = 1 - i/(n-1), tilt = (i % 2 ? 1 : -1) * 10, a = 30 + q * 65;
    var t = {name:'T'+i, pow: 82 + q*20, squad:[{},{}],
             attrs:{END: clamp(a-tilt), SUR: clamp(a-tilt*0.6),
                    AIM: clamp(a+tilt), CLU: clamp(a+tilt*0.6)}};
    out.push(t);
  }
  return out;
}
var LAND = [{x:20,y:5,w:12,h:17},{x:34,y:9,w:8,h:14},{x:42,y:9,w:10,h:13},{x:59,y:15,w:10,h:17},
            {x:70,y:18,w:20,h:15},{x:48,y:23,w:11,h:10},{x:26,y:23,w:10,h:12},{x:12,y:29,w:13,h:7},
            {x:54,y:34,w:15,h:10},{x:37,y:35,w:10,h:8},{x:26,y:36,w:7,h:10},{x:11,y:37,w:14,h:9},
            {x:72,y:39,w:18,h:10},{x:32,y:44,w:11,h:11},{x:44,y:45,w:11,h:9},{x:59,y:46,w:5,h:8},
            {x:23,y:47,w:7,h:9},{x:13,y:47,w:9,h:17},{x:77,y:51,w:12,h:10},{x:64,y:51,w:12,h:12},
            {x:53,y:55,w:10,h:7},{x:30,y:57,w:10,h:9},{x:41,y:60,w:8,h:9},{x:71,y:63,w:12,h:20},
            {x:53,y:63,w:12,h:10},{x:66,y:64,w:5,h:5},{x:9,y:65,w:12,h:11},{x:31,y:67,w:10,h:11},
            {x:21,y:67,w:6,h:6},{x:66,y:68,w:5,h:7},{x:51,y:74,w:15,h:20},{x:9,y:77,w:17,h:10},
            {x:27,y:79,w:12,h:9},{x:40,y:79,w:9,h:16},{x:69,y:84,w:16,h:12},{x:9,y:88,w:17,h:6}];
var ASPECT = 970/1100;
function record(seed){
  var rng = ZoneSim.createRng(seed), teams = fakeField(50);
  var spots = LAND.slice();
  for(var i=spots.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var s=spots[i]; spots[i]=spots[j]; spots[j]=s; }
  var picks = teams.map(function(t,k){ return spots[k % spots.length]; });
  var res = ZoneSim.simulateZoneGame(teams, {
    rng: rng, land: LAND, aspect: ASPECT,
    startOf: function(t){ var r = picks[teams.indexOf(t)]; return {x:r.x+r.w/2, y:r.y+r.h/2}; },
    duel: function(a,b){ var wa=Math.pow(a.pow,7), wb=Math.pow(b.pow,7); return rng()*(wa+wb)<wa ? a : b; },
    record: true
  });
  return {timeline: res.timeline, roster: teams.map(function(t,k){ return {name:t.name, you: k===3}; })};
}`;

const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<div id="box"></div><pre id="out" style="display:none"></pre>
<script src="zone-sim.js"><\/script>
<script src="zone-replay.js"><\/script>
<script>
${FIELD}
var FRAME_MS = 90;
function playOnce(handle, game, paced){
  var t0 = performance.now();
  return ZoneReplay.play(handle, game.timeline, {
    frameMs: FRAME_MS, labels: {zone: 'ZONE'}, roster: game.roster,
    pace: paced ? undefined : false
  }).then(function(){ return performance.now() - t0; });
}
(function(){
  var out = {};
  try {
    var game = record(17);
    out.frames = game.timeline.length;
    var handle = ZoneReplay.mount(document.getElementById('box'), '', '1100 / 970', 970/1100);
    ZoneReplay.clearFeed(handle);
    playOnce(handle, game, true).then(function(ms){
      out.pacedMs = Math.round(ms);
      out.feedLines = handle.feed.children.length;
      ZoneReplay.clearFeed(handle);
      return playOnce(handle, game, false);
    }).then(function(ms){
      out.flatMs = Math.round(ms);
      done(out);
    }).catch(function(e){ out.error = String(e && e.message || e); done(out); });
  } catch(e){ out.error = String(e && e.stack || e); done(out); }
  function done(o){
    document.getElementById('out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(o)) + 'END';
  }
})();
<\/script></body>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncspace-'));
for(const f of ['zone-sim.js', 'zone-replay.js'])
  fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
const tmp = path.join(dir, 'pace.html');
fs.writeFileSync(tmp, PAGE);

// Real time, not virtual: the whole measurement is how long the two take.
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--run-all-compositor-stages-before-draw', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if(!m){ console.error('the probe never reported; copy at ' + tmp); process.exit(2); }
const r = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, {recursive: true, force: true});

if(r.error){ console.error('the replay threw: ' + r.error); process.exit(1); }

const fails = [];
if(!(r.pacedMs > 0 && r.flatMs > 0)) fails.push('a replay finished in no time at all, which means it never played');
if(!(r.pacedMs < r.flatMs * 0.8)) fails.push('paced ' + r.pacedMs + 'ms against flat ' + r.flatMs +
  'ms — the pacing is buying less than a fifth of the run');
if(!(r.feedLines > 0)) fails.push('the kill feed printed nothing across a whole game');

console.log('\n  frames        ' + r.frames +
            '\n  paced         ' + r.pacedMs + 'ms' +
            '\n  flat          ' + r.flatMs + 'ms' +
            '\n  saved         ' + (100 - Math.round(100*r.pacedMs/r.flatMs)) + '%' +
            '\n  feed lines    ' + r.feedLines + ' at the end\n');
if(fails.length){ fails.forEach(f => console.error('  FAIL ' + f)); process.exit(1); }
console.log('  the replay plays, finishes, and skips what is worth skipping\n');
