// How often the replay actually puts a new picture up, on a real clock.
//
// "Лагает, типа фпс мало, обрывисто передвигаются игроки" is not a claim about
// where anybody is standing — it is a claim about the rate. Two things set that
// rate and they were not the same number: the camera wrote a transform on every
// timer tick, and the markers were redrawn only once MIN_DRAW_MS had gone by.
// When those disagree the map slides while the arrows step, which is what a low
// frame rate looks like even when nothing is dropping frames.
//
// And there was a second rate entirely, for anybody whose system asks for
// reduced motion: play() took that as licence not to interpolate at all, which
// is one picture per recorded frame — 5.6 a second in the last circles.
//
// Both are measured here, in real time. Virtual time cannot do it: it makes
// requestAnimationFrame and synchronous work both free, which is precisely the
// difference being measured. So the page is served over a socket and reports
// back through it, and the browser is a real one with a real compositor.
//
//   node tools/check-replay-fps.js
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
  function done(o){
    fetch('/done', {method:'POST', body: JSON.stringify(o)});
  }
  // What this screen can actually deliver, so a draw rate can be read against
  // it rather than against an assumed 60.
  var rafGaps = [], rafN = 0, t0 = performance.now();
  requestAnimationFrame(function tick(ts){
    rafGaps.push(ts); if(++rafN < 40) requestAnimationFrame(tick); else start();
  });

  function start(){
    var g = [];
    for(var i=1;i<rafGaps.length;i++) g.push(rafGaps[i]-rafGaps[i-1]);
    out.refreshMs = +pct(g, 0.5).toFixed(2);
    out.rafWorks = out.refreshMs > 0;

    var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var realMatchMedia = window.matchMedia;
    function pretend(reduced){
      window.matchMedia = function(q){
        if(/reduced-motion/.test(q)) return {matches: reduced};
        return realMatchMedia.call(window, q);
      };
    }

    try {
      var game = record(17);
      var handle = ZoneReplay.mount(document.getElementById('box'), '', '1100 / 970', 970/1100);
      out.headlessSaysReduced = REDUCED;

      // Every camera write, as the stage itself reports it: paint() only
      // touches the transform when a move is worth writing, so watching the
      // string is watching what the compositor was actually handed.
      var paintAt = [], lastTransform = null, paintTimer;
      (function watchPaint(){
        var t = handle.stage.style.transform;
        if(t !== lastTransform){ lastTransform = t; paintAt.push(performance.now()); }
        paintTimer = setTimeout(watchPaint, 1);
      })();

      var drawAt = [], lateDrawAt = [];
      function watch(f){
        var t = performance.now();
        drawAt.push(t);
        if(f.zone >= 10) lateDrawAt.push(t);
      }
      function report(a){
        var g = [], i;
        for(i=1;i<a.length;i++) g.push(a[i] - a[i-1]);
        return {n: a.length, mean: +mean(g).toFixed(2),
                p50: +pct(g,0.5).toFixed(2), p90: +pct(g,0.9).toFixed(2),
                max: +pct(g,0.999).toFixed(2),
                fps: g.length ? +(1000/mean(g)).toFixed(1) : 0};
      }
      function once(reduced){
        pretend(reduced);
        drawAt = []; lateDrawAt = []; paintAt = []; lastTransform = null;
        ZoneReplay.clearFeed(handle);
        var t = performance.now();
        return ZoneReplay.play(handle, game.timeline, {
          frameMs: 90, labels: {zone: 'ZONE'}, roster: game.roster, onFrame: watch
        }).then(function(){
          return {draws: report(drawAt), drawsLate: report(lateDrawAt),
                  paints: report(paintAt), tookMs: Math.round(performance.now() - t)};
        });
      }

      once(false).then(function(s){
        out.smooth = s;
        return once(true);
      }).then(function(s){
        out.calm = s;
        clearTimeout(paintTimer);
        done(out);
      }).catch(function(e){ out.error = String(e && e.stack || e); done(out); });
    } catch(e){ out.error = String(e && e.stack || e); done(out); }
  }
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

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsfps-'));

server.listen(0, async () => {
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--user-data-dir=' + profile,
    '--window-size=560,760', '--hide-scrollbars',
    // A real compositor on a real clock. Without this headless has no display
    // to schedule against and requestAnimationFrame never fires at all, which
    // would measure the fallback timer instead of the thing being tested.
    '--enable-gpu-rasterization', '--use-angle=swiftshader',
    url
  ], { stdio: 'ignore' });

  const timeout = setTimeout(() => { settle({error: 'the probe never reported'}); }, 90000);
  const r = await waited;
  clearTimeout(timeout);
  chrome.kill();
  server.close();
  // Chrome has not let go of its profile the instant it is killed, and a
  // measurement is not worth failing over a temp directory.
  try { fs.rmSync(profile, {recursive: true, force: true, maxRetries: 20, retryDelay: 100}); }
  catch(e){ }

  if(r.error){ console.error('the probe threw: ' + r.error); process.exit(1); }

  console.log('\nthis browser refreshes every ' + r.refreshMs + 'ms (' +
              (1000 / r.refreshMs).toFixed(1) + 'Hz), and reports reduced motion: ' +
              r.headlessSaysReduced);

  function line(name, s, refresh){
    console.log('  ' + name.padEnd(22) + String(s.n).padStart(5) + '   ' +
      'mean ' + s.mean.toFixed(1).padStart(6) + 'ms  p50 ' + s.p50.toFixed(1).padStart(6) +
      '  p90 ' + s.p90.toFixed(1).padStart(6) + '  max ' + s.max.toFixed(1).padStart(6) +
      '   = ' + s.fps.toFixed(1) + '/s' +
      (refresh ? '   (' + (s.mean / r.refreshMs).toFixed(2) + ' refreshes each)' : ''));
  }
  for(const [tag, set] of [['reduced motion off', r.smooth], ['reduced motion on', r.calm]]){
    console.log('\n' + tag + ' — gap between one picture and the next (' + set.tookMs + 'ms run):');
    line('draws, whole match', set.draws);
    line('draws, zone 10 on', set.drawsLate, true);
    line('camera writes', set.paints);
  }

  const fails = [];
  for(const [tag, set] of [['reduced motion off', r.smooth], ['reduced motion on', r.calm]]){
    // The markers and the camera have to move on the same schedule. Two rates
    // on one screen is the complaint this file exists for.
    const ratio = set.paints.n ? set.draws.n / set.paints.n : 0;
    if(!(ratio > 0.9)) fails.push(tag + ': ' + set.draws.n + ' draws against ' +
      set.paints.n + ' camera writes — the map is moving oftener than the arrows on it');
    // And the endgame has to get more than a slideshow.
    if(!(set.drawsLate.fps > 40)) fails.push(tag + ': zone 10 on ran at ' +
      set.drawsLate.fps + ' pictures a second');
  }
  if(fails.length){
    console.log('\n' + fails.map(f => '  ' + f).join('\n'));
    process.exit(1);
  }
  console.log('\n  the replay draws on the display\'s own schedule, in both,\n' +
              '  and the last circles get every refresh rather than a slideshow');
});
