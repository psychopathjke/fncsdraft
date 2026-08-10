// Refresh the copy of the engine that lives inside zone-demo.html.
//
// The demo is one self-contained file — the engine, the replay renderer and the
// map are all inlined, so it opens from disk with no server and no build. That
// is what makes it useful and it is also the catch: the engine inside it is a
// copy, and a copy goes stale the moment zone-sim.js changes. This puts the
// current one back, along with the circle-size table, which is regenerated from
// tools/real-matches.json rather than typed in.
//
// Run: node tools/build-zone-demo.js
//
// It rewrites zone-demo.html in place. Everything else in the page — the layout,
// the controls, the map image — is left exactly as it was.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'zone-demo.html');

if(!fs.existsSync(DEMO)){
  console.error('zone-demo.html is not here. This script refreshes an existing demo\n' +
                'rather than generating one, because the page carries the map image\n' +
                'inlined and nothing else in the repository does.');
  process.exit(1);
}

let html = fs.readFileSync(DEMO, 'utf8');
const before = html;

// Swap an inlined <script> whose body starts with a known first line.
function inline(html, firstLine, file){
  const open = html.indexOf('<script>' + firstLine);
  if(open < 0) throw new Error('cannot find the inlined block starting "' + firstLine + '"');
  const bodyAt = open + '<script>'.length;
  const close = html.indexOf('</script>', bodyAt);
  if(close < 0) throw new Error('unclosed <script> for "' + firstLine + '"');
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\s+$/, '');
  return html.slice(0, bodyAt) + source + '\n' + html.slice(close);
}

html = inline(html, '// Spatial storm simulation', 'zone-sim.js');
html = inline(html, '// Plays a recorded zone timeline', 'zone-replay.js');

// The circle-size table, from the telemetry rather than from memory.
const ref = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/real-matches.json'), 'utf8')).matches[0];
const UNIT = 200000 / 83;                       // game units per world unit
const ISLAND = 83;                              // world units across the island
const shares = ref.zones.map(z => 100 * (z.radius / UNIT) * 2 / ISLAND);
const fmt = v => v.toFixed(v < 10 ? 1 : 0) + '%';

const head = '<thead><tr><th>Zone</th>' +
  ref.zones.map((_, i) => '<th>' + (i + 1) + '</th>').join('') + '</tr></thead>';
html = html.replace(/<thead><tr><th>Zone<\/th>[\s\S]*?<\/tr><\/thead>/, head);

const realRow = '<tr><td>Logged, three Grand Finals</td>' +
  shares.map(s => '<td>' + fmt(s) + '</td>').join('') + '</tr>';
html = html.replace(/<tr><td>(?:Measured off one game|Logged, three Grand Finals)<\/td>[\s\S]*?<\/tr>/, realRow);

// And the script that fills the engine's own row, which used to carry the
// screenshot numbers as a literal.
html = html.replace(/const ISLAND = 83, REAL = \[[^\]]*\];/,
  'const ISLAND = 83, REAL = [' + shares.map(s => +s.toFixed(2)).join(', ') + '];');

// How many zones there are is the engine's business, not the page's. The demo
// had it written down in three places, which is two too many and one of them
// was the headline.
const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine',
               'ten','eleven','twelve','thirteen'];
html = html.replace(/Fifty duos, [a-z]+ circles/, 'Fifty duos, ' + WORDS[ref.zones.length] + ' circles');
html = html.replace(/const byZone = new Array\([^)]*\)\.fill\(0\);/,
  'const byZone = new Array(ZoneSim.PHASES.length).fill(0);');
html = html.replace(/byZone\[Math\.min\([^,]+, \(t\._zoneReached \|\| 1\) - 1\)\]\+\+;/,
  'byZone[Math.min(byZone.length - 1, (t._zoneReached || 1) - 1)]++;');

// Playback. The page used to step one recorded frame at a time, which has two
// faults it cannot see from the inside: the recording keeps every eighth tick,
// so the frames are sixteen game-seconds apart and squads jump between them;
// and it reached for play() to draw each one, which resets the kill feed on
// every call, so the feed was wiped before anybody could read it. It now runs a
// fractional clock, lets the renderer fill in the between, and draws through
// show(), which leaves the feed alone.
html = html.replace(/let TL = \[\], RO = \[\], at = 0, playing = false, timer = (?:null|0)(?:, shown = -1)?;?/,
  'let TL = [], RO = [], at = 0, playing = false, timer = 0, shown = -1;');

html = html.replace(/function frameAt\(pos\)\{[\s\S]*?\n\}\n\n/, '');
html = html.replace(/(\/\/ The recording keeps every eighth tick[\s\S]*?\n)(?=function render)/, '');
html = html.replace(/function render\(\)\{[\s\S]*?\n\}/,
`function frameAt(pos){
  const i = Math.min(Math.floor(pos), TL.length - 1);
  const b = TL[i + 1];
  const fresh = i !== shown;
  shown = i;
  return b ? ZoneReplay.between(TL[i], b, pos - i, fresh) : TL[i];
}

function render(){
  if(!TL.length) return;
  const f = frameAt(at);
  ZoneReplay.show(handle, f, {labels: LABELS, roster: RO});
  document.getElementById('scrub').value = Math.floor(at);
  document.getElementById('tick').textContent = 'zone ' + f.zone + ' \\u00b7 ' + f.alive + ' squads left';
}`);

html = html.replace(/function setPlaying\(on\)\{[\s\S]*?\n\}/,
`function setPlaying(on){
  playing = on;
  document.getElementById('play').textContent = on ? 'Pause' : 'Play';
  // A generation rather than a handle. Cancelling by handle left an older loop
  // running whenever two had been started, and two loops advance the clock
  // twice — the match played through at three times its own speed.
  const mine = ++timer;
  if(!on) return;
  // A timer against a clock, not animation frames: frames stop dead while the
  // page is hidden, and this one starts playing the moment the page loads,
  // which in an embedded viewer can be before it is on screen.
  let last = null;
  (function step(){
    if(!playing || mine !== timer) return;
    const now = performance.now();
    // Capped, so coming back to a tab that was in the background resumes where
    // it left off instead of jumping to the end of the match.
    if(last !== null) at += Math.min(now - last, 200) / 95;
    last = now;
    if(at >= TL.length - 1){ at = TL.length - 1; render(); setPlaying(false); return; }
    render();
    setTimeout(step, 16);
  })();
}`);

// A scrub and a new match both land somewhere the feed was never filled for.
html = html.replace(/document\.getElementById\('scrub'\)\.oninput = function\(e\)\{[^}]*\};/,
  "document.getElementById('scrub').oninput = function(e){\n" +
  "  setPlaying(false); at = +e.target.value; shown = -1;\n" +
  "  ZoneReplay.clearFeed(handle); render();\n};");
html = html.replace(/if\(!playing && at >= TL\.length - 1\)(?: at = 0;|\{[^}]*\})/,
  'if(!playing && at >= TL.length - 1){ at = 0; shown = -1; ZoneReplay.clearFeed(handle); }');
html = html.replace(/TL = res\.timeline; RO = res\.roster; at = 0;/,
  'TL = res.timeline; RO = res.roster; at = 0; shown = -1; ZoneReplay.clearFeed(handle);');

// The map is the whole page here, so it takes the wheel: scroll to zoom, drag
// to pan, double-click back out.
html = html.replace(/ZoneReplay\.mount\(document\.getElementById\('board'\), MAP_SRC, '1100 \/ 970', ASPECT\)(?:, \{zoom: true\})?/,
  "ZoneReplay.mount(document.getElementById('board'), MAP_SRC, '1100 / 970', ASPECT, {zoom: true})");
if(!/id="zoomhint"/.test(html)){
  html = html.replace(/<span class="tick" id="tick">&mdash;<\/span>/,
    '<span class="tick" id="tick">&mdash;</span>\n      ' +
    '<span class="tick" id="zoomhint" style="margin-left:auto;opacity:.7;">' +
    'scroll to zoom · drag to pan · double-click to reset</span>');
}

// The footer described where the numbers came from, and that changed.
html = html.replace(/<footer>[\s\S]*?<\/footer>/,
  '<footer>The engine and the renderer here are the files the game ships, inlined rather than ' +
  'reimplemented. Storm damage and the Storm Surge thresholds are the published competitive ' +
  'values. Everything else &mdash; the radius of every circle, how far the centre drifts between ' +
  'them, how long each phase runs, how fast a squad crosses ground and how close a fight ends ' +
  '&mdash; is read off the telemetry of one real Grand Final. It replaced a set of numbers ' +
  'measured off screenshots, which were sound to about zone 4 and two to three times too wide ' +
  'after it.</footer>');

fs.writeFileSync(DEMO, html);
console.log(before === html
  ? 'zone-demo.html was already current'
  : 'zone-demo.html refreshed — engine ' + require(path.join(ROOT, 'zone-sim.js')).VERSION +
    ', ' + ref.zones.length + ' zones, ' + (fs.statSync(DEMO).size / 1024).toFixed(0) + ' KB');
