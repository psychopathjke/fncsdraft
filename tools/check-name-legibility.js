// Why the name on the map got harder to read once the replay started drawing
// on every refresh.
//
// Two things could do it and they want different fixes.
//
// One is the layer. paint() promotes the stage with will-change while the
// camera is moving and drops it a fifth of a second after it stops, because a
// promoted layer is rasterised once and then stretched — sharp while still,
// soft while moving. That was a trade worth making when the camera moved in
// steps and settled between them. It stops being a trade at all if the camera
// now writes a transform on every single refresh: the settle timer is cleared
// before it can ever fire, the stage never comes back down, and everything on
// it — the island, and the nameplate drawn over it — is a stretched texture for
// the whole endgame.
//
// The other is the placement. The plate is offered the slot it had last frame
// first, so it does not flip from over its arrow to under it as a neighbour
// drifts past. Twice the draws is twice the chances to flip.
//
// This measures both, in a real browser on a real clock.
//
//   node tools/check-name-legibility.js
'use strict';

const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { spawn } = require('child_process');

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
<div id="box" style="width:520px"></div>
<script src="zone-sim.js"><\/script>
<script src="zone-replay.js"><\/script>
<script>
${FIELD}
function pct(a, q){ var s = a.slice().sort(function(x,y){return x-y;}); return s[Math.floor(s.length*q)] || 0; }
function mean(a){ return a.length ? a.reduce(function(p,c){return p+c;},0)/a.length : 0; }

(function(){
  var out = {};
  function done(o){ fetch('/done', {method:'POST', body: JSON.stringify(o)}); }
  try {
    var game = record(17);
    // The real photograph, because the camera's own ceiling is worked out from
    // how many pixels it has: without one, mapPixels is 0 and the camera is
    // allowed all the way to 8x, which is not the zoom anybody is looking at.
    var handle = ZoneReplay.mount(document.getElementById('box'),
      'art/map-m2.jpg', '1100 / 970', 970/1100);
    var MINE = 3;   // the squad flagged as yours in the harness field

    var draws = 0, promoted = 0, lateDraws = 0, latePromoted = 0;
    var flips = 0, lateFlips = 0, lastSlot, scales = [], lateScaleStep = [];
    var lastScale = null, lateFrom = null, lateTo = null;
    // The longest the stage went without ever being allowed to drop back to a
    // sharp raster. This is the number that says whether the trade paint() makes
    // — soft while moving, sharp while still — is still a trade or has quietly
    // become "soft, always".
    var runFrom = null, longestRun = 0, settles = 0, lateSettles = 0;
    // Draws on which the stage itself was a layer — the thing that put the
    // nameplate inside the photograph's texture. Has to stay at zero.
    var stagePromoted = 0;

    function watch(f){
      draws++;
      var late = f.alive <= 12;
      if(late){ lateDraws++; if(lateFrom == null) lateFrom = performance.now(); lateTo = performance.now(); }
      // Whether the stage is a promoted texture right now, read off the style
      // rather than off the flag, so this is what the compositor was told.
      // Two layers, and only one of them may be a stretched texture. The
      // photograph is allowed to be; the stage is not, because the stage holds
      // the SVG and the SVG holds the name.
      var isPromoted = handle.img && handle.img.style.willChange === 'transform';
      if(handle.stage.style.willChange === 'transform') stagePromoted++;
      var t = performance.now();
      if(isPromoted){
        promoted++; if(late) latePromoted++;
        if(runFrom == null) runFrom = t;
        longestRun = Math.max(longestRun, t - runFrom);
      } else if(runFrom != null){
        runFrom = null; settles++; if(late) lateSettles++;
      }
      // How much the camera's scale moved since the last picture. Blur on a
      // promoted layer comes from stretching it, and stretching is what a
      // changing scale is.
      var s = handle.scale || 1;
      if(lastScale != null){
        var step = Math.abs(s - lastScale) / lastScale;
        scales.push(step);
        if(late) lateScaleStep.push(step);
      }
      lastScale = s;
      // Where the map put your name this time. A different slot from last time
      // is the plate jumping to another side of your arrow.
      var slot = handle.slots ? handle.slots[MINE] : undefined;
      if(slot !== undefined && lastSlot !== undefined && slot !== lastSlot){
        flips++; if(late) lateFlips++;
      }
      lastSlot = slot;
    }

    ZoneReplay.clearFeed(handle);
    ZoneReplay.play(handle, game.timeline, {
      frameMs: 90, labels: {zone: 'ZONE'}, roster: game.roster, onFrame: watch
    }).then(function(){
      var lateSec = (lateTo - lateFrom) / 1000;
      out.draws = draws;
      out.promotedShare = +(promoted / draws).toFixed(3);
      out.lateDraws = lateDraws;
      out.latePromotedShare = +(latePromoted / lateDraws).toFixed(3);
      out.lateSeconds = +lateSec.toFixed(2);
      out.flips = flips;
      out.lateFlips = lateFlips;
      out.lateFlipsPerSec = +(lateFlips / lateSec).toFixed(2);
      out.longestPromotedMs = Math.round(longestRun);
      out.stagePromoted = stagePromoted;
      out.settles = settles;
      out.lateSettles = lateSettles;
      out.endScale = +(handle.scale || 1).toFixed(2);
      out.scaleStepMean = +(mean(scales) * 100).toFixed(3);
      out.lateScaleStepMean = +(mean(lateScaleStep) * 100).toFixed(3);
      out.lateScaleStepP90 = +(pct(lateScaleStep, 0.9) * 100).toFixed(3);
      // How long the stage went, at most, without ever being allowed to settle
      // back to a sharp raster. SETTLE_MS is 180.
      out.settleMs = 180;
      done(out);
    }).catch(function(e){ out.error = String(e && e.stack || e); done(out); });
  } catch(e){ out.error = String(e && e.stack || e); done(out); }
})();
<\/script></body>`;

const FILES = {
  '/': [PAGE, 'text/html'],
  '/zone-sim.js': [fs.readFileSync(path.join(ROOT, 'zone-sim.js'), 'utf8'), 'text/javascript'],
  '/zone-replay.js': [fs.readFileSync(path.join(ROOT, 'zone-replay.js'), 'utf8'), 'text/javascript']
};

let settle;
const waited = new Promise(res => { settle = res; });
const server = http.createServer((req, res) => {
  if(req.url === '/art/map-m2.jpg'){
    res.setHeader('content-type', 'image/jpeg');
    res.end(fs.readFileSync(path.join(ROOT, 'art', 'map-m2.jpg')));
    return;
  }
  if(req.url === '/done'){
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => { res.end('ok'); settle(JSON.parse(body)); });
    return;
  }
  const f = FILES[req.url.split('?')[0]];
  if(!f){ res.statusCode = 404; res.end(); return; }
  res.setHeader('content-type', f[1]);
  res.end(f[0]);
});

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsname-'));
server.listen(0, async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--user-data-dir=' + profile,
    '--window-size=560,760', '--hide-scrollbars',
    '--enable-gpu-rasterization', '--use-angle=swiftshader',
    'http://127.0.0.1:' + server.address().port + '/'
  ], { stdio: 'ignore' });

  const timeout = setTimeout(() => settle({error: 'the probe never reported'}), 90000);
  const r = await waited;
  clearTimeout(timeout);
  chrome.kill();
  server.close();
  try { fs.rmSync(profile, {recursive: true, force: true, maxRetries: 20, retryDelay: 100}); } catch(e){}

  if(r.error){ console.error('the probe threw: ' + r.error); process.exit(1); }

  console.log('\nthe layers (camera settles at ' + r.endScale + 'x):');
  console.log('  draws on which the STAGE was a layer, and the name with it  ' +
              r.stagePromoted + '   (must be 0)');
  console.log('  whole match, share of draws with the photo promoted   ' +
              (r.promotedShare * 100).toFixed(1) + '%');
  console.log('  endgame, same                                        ' +
              (r.latePromotedShare * 100).toFixed(1) + '%   (' +
              r.lateSeconds + 's of it)');
  console.log('  longest unbroken stretch promoted                    ' +
              r.longestPromotedMs + 'ms');
  console.log('  times it settled back to a sharp raster              ' +
              r.settles + ' in the match, ' + r.lateSettles + ' in the endgame');
  console.log('  camera scale change between pictures, endgame        mean ' +
              r.lateScaleStepMean + '%   p90 ' + r.lateScaleStepP90 + '%');
  console.log('\nwhere the name is put:');
  console.log('  slot changes, whole match   ' + r.flips);
  console.log('  slot changes in the endgame ' + r.lateFlips +
              '  = ' + r.lateFlipsPerSec + ' a second');

  const fails = [];
  // A stage that is never allowed to settle is a stage that is a stretched
  // texture for the whole endgame, and the name is drawn on it.
  if(r.stagePromoted > 0) fails.push('the stage was promoted on ' + r.stagePromoted +
    ' draws — that puts every marker, every circle and the nameplate inside the ' +
    "photograph's texture, which is what made the name soft at zoom");
  // A plate that changes sides oftener than about once a second is a plate that
  // reads as blinking rather than as a label.
  if(r.lateFlipsPerSec > 1) fails.push('your name changes side of your arrow ' +
    r.lateFlipsPerSec + ' times a second in the endgame');
  if(fails.length){
    console.log('\n' + fails.map(f => '  ' + f).join('\n'));
    process.exit(1);
  }
  console.log('\n  the name sits still and on a layer that is allowed to be sharp');
});
