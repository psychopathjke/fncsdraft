// What one drawn frame of the replay costs, in real milliseconds.
//
// check-replay-fps.js runs under a virtual clock, which is what makes its
// scheduling numbers trustworthy and its cost numbers useless — synchronous
// work takes no virtual time at all. This one runs with the real clock and does
// its measuring before the load event, so --dump-dom still catches the answer.
//
// The question it settles: whether the renderer can be asked for a picture on
// every display refresh, or whether the 28ms floor in play() is holding back
// something that genuinely cannot go faster.
//
//   node tools/check-draw-cost.js
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

const FIELD = fs.readFileSync(path.join(__dirname, 'check-replay-pace.js'), 'utf8')
  .match(/const FIELD = `([\s\S]*?)`;/)[1];

const PAGE = `<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#0b0e18">
<style>:root{--accent:#3f62ca;--lb-line:#2a3350}</style>
<div id="box" style="width:520px"></div><pre id="out" style="display:none"></pre>
<script src="zone-sim.js"><\/script>
<script src="zone-replay.js"><\/script>
<script>
${FIELD}
(function(){
  var out = {};
  try {
    var game = record(17);
    var handle = ZoneReplay.mount(document.getElementById('box'), '', '1100 / 970', 970/1100);
    var opts = {labels:{zone:'ZONE'}, roster: game.roster};

    // A frame from each part of the match, since what a draw costs is mostly
    // how many markers and names are on it.
    function pick(test){
      for(var i=0;i<game.timeline.length;i++) if(test(game.timeline[i])) return game.timeline[i];
      return null;
    }
    var wide = game.timeline[0];
    var late = pick(function(f){ return f.alive <= 12; });
    var last = pick(function(f){ return f.alive <= 3; });

    function cost(frame, scale, n){
      if(!frame) return null;
      handle.scale = scale;
      ZoneReplay.show(handle, frame, opts);            // warm, uncounted
      var each = [];
      for(var k=0;k<n;k++){
        var t0 = performance.now();
        ZoneReplay.show(handle, frame, opts);
        each.push(performance.now() - t0);
      }
      each.sort(function(a,b){ return a-b; });
      return {p50: +each[Math.floor(n*0.5)].toFixed(3),
              p95: +each[Math.floor(n*0.95)].toFixed(3),
              max: +each[n-1].toFixed(3)};
    }

    out.wide = cost(wide, 1, 400);
    out.late = cost(late, 6.8, 400);
    out.last = cost(last, 6.8, 400);
    out.aliveLate = late ? late.alive : null;
    out.aliveLast = last ? last.alive : null;
    out.markers = wide.dots.length;
  } catch(e){ out.error = String(e && e.stack || e); }
  document.getElementById('out').textContent =
    'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script></body>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncscost-'));
for(const f of ['zone-sim.js', 'zone-replay.js'])
  fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
const tmp = path.join(dir, 'cost.html');
fs.writeFileSync(tmp, PAGE);

const dom = execFileSync(CHROME, [
  '--headless=new', '--no-sandbox', '--allow-file-access-from-files',
  '--window-size=560,700', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if(!m){ console.error('the probe never reported; copy at ' + tmp); process.exit(2); }
const r = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, {recursive: true, force: true});
if(r.error){ console.error('the probe threw: ' + r.error); process.exit(1); }

function line(name, s){
  if(!s){ console.log('  ' + name.padEnd(30) + 'no such frame'); return; }
  console.log('  ' + name.padEnd(30) + 'p50 ' + s.p50.toFixed(3).padStart(7) +
              'ms   p95 ' + s.p95.toFixed(3).padStart(7) + 'ms   max ' +
              s.max.toFixed(3).padStart(7) + 'ms');
}
console.log('\nwhat one drawn frame costs (real clock, 400 draws each):');
line('full lobby, ' + r.markers + ' squads, 1x', r.wide);
line('endgame, ' + r.aliveLate + ' alive, 6.8x', r.late);
line('last circle, ' + r.aliveLast + ' alive, 6.8x', r.last);
const worst = Math.max(...[r.wide, r.late, r.last].filter(Boolean).map(s => s.p95));
console.log('\na 60Hz refresh gives 16.7ms. The worst draw above takes ' +
            (worst / 16.7 * 100).toFixed(1) + '% of one.');
