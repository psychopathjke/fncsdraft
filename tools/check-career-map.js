// The career watches its games on the map, and stops watching when you die.
//
// Two things are checked, and the first one is checked directly rather than by
// playing a cup and hoping the probe's squad happened to die early:
//
//   A. ZoneReplay.play with a stopWhen predicate ends on the frame the
//      predicate fires on, resolves true, and leaves that frame on the screen
//      rather than jumping to the end of the game. Without the predicate it
//      plays the whole timeline and resolves false. Both playback paths are
//      exercised — the interpolated one and the `smooth:false` one — because
//      the early stop lives in both of their loops.
//
//   B. A career cup mounts a map, and never asks the player where to land.
//      The landing picker belongs to the Heats and the Finals, where the
//      player chose the drop; a career drop is automatic and a picker
//      appearing there would stop the run dead waiting for a click.
//
// Run with --reduced to repeat it with prefers-reduced-motion forced on, which
// is how the app is actually read on at least one machine. That setting does
// not change which loop runs — `smooth` is decided by the frame count and the
// frame length, not by the preference — but it turns the eases off inside it,
// so it is worth having both.
//
// Both are forced explicitly, because headless Chrome does not sit in the
// middle: with no flag at all it reports prefers-reduced-motion: reduce, so a
// harness that passes nothing is only ever testing the calm path while looking
// like it tests the ordinary one.
//
//   node tools/check-career-map.js [--reduced]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REDUCED = process.argv.includes('--reduced');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // A final asks the player where to land. A harness is the player: answer it
  // the moment a picker appears, always the first zone, so the run is the same
  // every time. Without this a probe waits forever on a click nobody makes.
  setInterval(function(){
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    out.steps.push('reduced motion: ' + matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ---- A. the early stop, on a timeline built for the purpose -------------
    //
    // Four squads, forty frames, and squad 1 dies on frame 12. Everything the
    // renderer reads is present; nothing it does not read is invented.
    const FRAMES = 40, DIES_AT = 12, ME = 1;
    const timeline = [];
    for (let i = 0; i < FRAMES; i++) {
      const deadYet = i >= DIES_AT;
      timeline.push({
        zone: 1 + Math.floor(i / 6),
        secondsLeft: (FRAMES - i) * 3,
        alive: 4 - (deadYet ? 1 : 0),
        players: (4 - (deadYet ? 1 : 0)) * 2,
        circle: {cx: 50, cy: 50, radius: 40 - i * 0.6},
        next: {cx: 50, cy: 50, radius: 30 - i * 0.5},
        dots: [0,1,2,3].map(k => {
          const dead = (k === ME) && deadYet;
          return {x: 30 + k * 8 + i * 0.2, y: 40 + k * 5, alive: !dead,
                  a: 45, h: dead ? 0 : 100, e: k, p: dead ? 30 : 0};
        })
      });
    }

    const roster = [0,1,2,3].map(k => ({name: 'SQ' + k, players: ['a' + k, 'b' + k], isYou: k === ME}));
    const host = document.createElement('div');
    document.body.appendChild(host);

    async function run(label, smooth, withStop) {
      const handle = ZoneReplay.mount(host, '', '16 / 9', 9 / 16);
      const seen = [];
      const cutShort = await ZoneReplay.play(handle, timeline, {
        frameMs: 90, smooth: smooth, roster: roster,
        labels: {zone: 'Z', alive: 'A', storm: 'S', surge: 'SU'},
        stopWhen: withStop ? (f => { const d = f.dots[ME]; return !!d && !d.alive; }) : null,
        onFrame: f => seen.push(f)
      });
      ZoneReplay.unmount(handle);
      const last = seen[seen.length - 1];
      // How far into the timeline playback got, which is not the same as how
      // many times it drew: the interpolated loop draws once per display
      // refresh and crosses a timeline frame every few of them. secondsLeft
      // counts down three a frame and is interpolated along with everything
      // else, so it reads the position back out continuously.
      const at = last ? (FRAMES - last.secondsLeft / 3) : null;
      return {label, cutShort, draws: seen.length, at: at,
              lastAlive: last ? last.dots[ME].alive : null,
              lastZone: last ? last.zone : null};
    }

    for (const smooth of [true, false]) {
      const tag = smooth ? 'interpolated' : 'smooth:false';

      const stopped = await run(tag, smooth, true);
      out.steps.push(tag + ' + stopWhen -> cutShort=' + stopped.cutShort +
                     ' stopped at frame ' + stopped.at.toFixed(1) + ' of ' + FRAMES +
                     ' (' + stopped.draws + ' draws) lastAlive=' + stopped.lastAlive);
      if (stopped.cutShort !== true) fail(tag + ': a cut-short replay did not resolve true');
      if (stopped.lastAlive !== false) fail(tag + ': playback did not end on the frame the squad died in');
      // It must stop where it died, not run on and not jump to the end. Two
      // frames of slack: the interpolated loop crosses a frame boundary
      // mid-step, so it is allowed to notice on the next one it lands on.
      if (stopped.at > DIES_AT + 2)
        fail(tag + ': replay reached frame ' + stopped.at.toFixed(1) + ' after a death on frame ' + DIES_AT);

      const whole = await run(tag, smooth, false);
      out.steps.push(tag + ' + no stopWhen -> cutShort=' + whole.cutShort +
                     ' stopped at frame ' + whole.at.toFixed(1) + ' of ' + FRAMES +
                     ' lastZone=' + whole.lastZone);
      if (whole.cutShort !== false) fail(tag + ': an uninterrupted replay claimed it was cut short');
      if (whole.lastZone !== timeline[FRAMES - 1].zone)
        fail(tag + ': an uninterrupted replay did not finish on the last frame');
    }
    host.remove();

    // ---- B. a career cup, on the map and never asking where to land --------
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v: 1,
      player: {nick: 'MapProbe', age: 16, source: 'rookie', country: 'de',
               countryPing: 15, closeRangeEdge: 6, region: 'EU',
               ovr: 54, role: 'roleIGL', attrs: null, ageEdge: 4, photo: null,
               handle: null, cardRegion: null, nat: null},
      career: {season: 1, week: 1, division: 5, earnings: 0, tokens: [], log: []},
      partner: null
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));

    careerEntry();
    const play = document.querySelector('#screen-career-hub .ch-play');
    if (!play || play.disabled) fail('play button is not usable');

    // Watched, not skipped — the point is what happens on the way. A landing
    // picker would block here for ever, so it is looked for on every poll
    // rather than at the end.
    // Mounting a map is not playing on it. Every career event is played in
    // lobbies, and that branch used to score all of them and move on — the
    // replay sat in the branch below, which no career event ever reached, so
    // the island mounted beside the table and never drew a game. Count the
    // playbacks, and count the frames one of them drew.
    let plays = 0, frames = 0;
    const origPlay = ZoneReplay.play;
    ZoneReplay.play = function(rep, timeline, o){
      plays++;
      const inner = o && o.onFrame;
      if (o) o.onFrame = f => { frames++; return inner ? inner(f) : undefined; };
      return origPlay.call(this, rep, timeline, o);
    };

    let sawMap = false, sawPicker = null;
    const watcher = setInterval(() => {
      if (document.querySelector('.zone-replay')) sawMap = true;
      const heads = [...document.querySelectorAll('#majorStages h4')];
      const picker = heads.find(h => h.textContent.indexOf('высадки') >= 0 ||
                                     h.textContent.toLowerCase().indexOf('landing spot') >= 0);
      if (picker && !sawPicker) sawPicker = picker.textContent.trim();
    }, 15);

    play.click();

    let card = null;
    for (let i = 0; i < 12000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(watcher);
    if (!card) fail('no result card after a cup on the map');
    out.steps.push('map mounted during the cup: ' + sawMap);
    out.steps.push('landing picker seen: ' + (sawPicker || 'never'));
    if (!sawMap) fail('the career cup played with no map at all');
    if (sawPicker) fail('a career cup asked where to land: "' + sawPicker + '"');
    ZoneReplay.play = origPlay;
    out.steps.push('games drawn on the map: ' + plays + ', ' + frames + ' frames');
    if (!plays) fail('the map mounted and then drew nothing — the cup was scored off it');
    if (frames < 10) fail('only ' + frames + ' frames were drawn across ' + plays + ' games');
    out.steps.push('result card: ' + card.querySelector('h4').textContent.replace(/\\s+/g, ' ').trim());

    const saved = JSON.parse(localStorage.getItem('fncsdraft_career'));
    const logged = (saved.career.log || []).length;
    out.steps.push('logged runs: ' + logged + ', ovr: ' + saved.player.ovr);
    if (!logged) fail('the cup left nothing in the career log');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsmap-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, HEAD + src + BOOT);
// The map art and the two engine scripts are loaded relative to the page, so
// the copy has to sit beside them rather than in a temp directory of its own.
for (const f of ['zone-sim.js', 'zone-replay.js'])
  fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));

const args = [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=900000', '--dump-dom'
];
args.push(REDUCED ? '--force-prefers-reduced-motion' : '--force-prefers-no-reduced-motion');
args.push('file:///' + tmp.replace(/\\/g, '/'));

const dom = execFileSync(CHROME, args, { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('the career watches its games, and stops watching when you die' + (REDUCED ? ' (reduced motion)' : ''));
fs.rmSync(dir, { recursive: true, force: true });
