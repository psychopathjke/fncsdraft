// Evidence for "с 10 зоны модельки двигаются обрывисто".
//
// Replays a recorded game through the same stepping loop play() runs, and
// measures how far each marker moves on screen between one draw and the next —
// twice. Once for the interpolated position the frame actually carries, and
// once for the position that is drawn, which is that plus the cluster fan.
//
// If the two agree the drawing is honest and the jerk is somewhere else. If the
// drawn one spikes where the carried one does not, the fan is the jerk.
//
//   node tools/check-endgame-jitter.js
'use strict';

const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const ZoneSim = require(path.join(ROOT, 'zone-sim.js'));

// zone-replay.js touches the DOM only inside functions, so it loads under node
// as long as nothing calls them. cluster() and offsetIn() are not exported —
// they are lifted out of the real source here rather than retyped, so this
// measures the code that ships.
const SRC = fs.readFileSync(path.join(ROOT, 'zone-replay.js'), 'utf8');
function lift(name){
  const i = SRC.indexOf('function ' + name + '(');
  if(i < 0) throw new Error('no ' + name + ' in zone-replay.js');
  let depth = 0, j = SRC.indexOf('{', i);
  for(let k = j; k < SRC.length; k++){
    if(SRC[k] === '{') depth++;
    else if(SRC[k] === '}' && --depth === 0) return SRC.slice(i, k + 1);
  }
  throw new Error('unterminated ' + name);
}
const sandbox = {Math: Math, console: console};
vm.createContext(sandbox);
vm.runInContext([
  SRC.match(/var FAN = [^\n]*\n/)[0],
  SRC.match(/var NAME_SEP = [^\n]*\n/)[0],
  SRC.match(/var NAME_ZOOM = [^\n]*\n/)[0],
  SRC.match(/var FAN_EASE_MS = [^\n]*\n/)[0],
  lift('cluster'), lift('offsetIn'), lift('fanTo'), lift('lerp'), lift('lerpCircle'),
  lift('shallowNoEvents'), lift('between')
].join('\n'), sandbox);
const {cluster, offsetIn, fanTo, between, FAN_EASE_MS} = sandbox;

// --- a lobby to watch, the same synthetic one the other harnesses use
const LAND = [{x:20,y:5,w:12,h:17},{x:34,y:9,w:8,h:14},{x:42,y:9,w:10,h:13},{x:59,y:15,w:10,h:17},
  {x:70,y:18,w:20,h:15},{x:48,y:23,w:11,h:10},{x:26,y:23,w:10,h:12},{x:12,y:29,w:13,h:7},
  {x:54,y:34,w:15,h:10},{x:37,y:35,w:10,h:8},{x:26,y:36,w:7,h:10},{x:11,y:37,w:14,h:9},
  {x:72,y:39,w:18,h:10},{x:32,y:44,w:11,h:11},{x:44,y:45,w:11,h:9},{x:59,y:46,w:5,h:8},
  {x:23,y:47,w:7,h:9},{x:13,y:47,w:9,h:17},{x:77,y:51,w:12,h:10},{x:64,y:51,w:12,h:12},
  {x:53,y:55,w:10,h:7},{x:30,y:57,w:10,h:9},{x:41,y:60,w:8,h:9},{x:71,y:63,w:12,h:20},
  {x:53,y:63,w:12,h:10},{x:66,y:64,w:5,h:5},{x:9,y:65,w:12,h:11},{x:31,y:67,w:10,h:11},
  {x:21,y:67,w:6,h:6},{x:66,y:68,w:5,h:7},{x:51,y:74,w:15,h:20},{x:9,y:77,w:17,h:10},
  {x:27,y:79,w:12,h:9},{x:40,y:79,w:9,h:16},{x:69,y:84,w:16,h:12},{x:9,y:88,w:17,h:6}];
const ASPECT = 970/1100;

function fakeField(n){
  const out = [], clamp = v => Math.max(5, Math.min(99, v));
  for(let i=0;i<n;i++){
    const q = 1 - i/(n-1), tilt = (i % 2 ? 1 : -1) * 10, a = 30 + q * 65;
    out.push({name:'T'+i, pow: 82 + q*20, squad:[{},{}],
              attrs:{END: clamp(a-tilt), SUR: clamp(a-tilt*0.6),
                     AIM: clamp(a+tilt), CLU: clamp(a+tilt*0.6)}});
  }
  return out;
}

function record(seed){
  const rng = ZoneSim.createRng(seed), teams = fakeField(50);
  const spots = LAND.slice();
  for(let i=spots.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const s=spots[i]; spots[i]=spots[j]; spots[j]=s; }
  const picks = teams.map((t,k) => spots[k % spots.length]);
  return ZoneSim.simulateZoneGame(teams, {
    rng, land: LAND, aspect: ASPECT,
    startOf: t => { const r = picks[teams.indexOf(t)]; return {x:r.x+r.w/2, y:r.y+r.h/2}; },
    duel: (a,b) => { const wa=Math.pow(a.pow,7), wb=Math.pow(b.pow,7); return rng()*(wa+wb)<wa ? a : b; },
    record: true
  });
}

// --- the stepping loop, as play() runs it
//
// Real numbers where they matter: a 90ms frame, and a draw on every refresh of
// a 60Hz screen, which is what play() does now. The camera is not modelled —
// the endgame sits pinned near the zoom ceiling, so the scale is held at 8, and
// the screen size of a world unit follows from a 520px box.
const FRAME_MS = 90, MIN_DRAW_MS = 0, TIMER_MS = 1000 / 60;
const PACE_CLOSE = 0.5, CLOSE_ZONE = 10;
const SCALE = 8, PX_PER_UNIT = 520 / 100 * SCALE;

// A jerk is not speed, it is a change of speed: how far a marker's step this
// draw is from its step last draw. A squad crossing the screen at a steady rate
// reads as motion however fast it is going; one whose step changes by half its
// own size from draw to draw is what "обрывисто" means.
// Candidate fixes, measured rather than argued about.
//
//   raw    the fan written straight in, as it was before the glide
//   ident  angle from the squad's own index, so joining a group changes the
//          radius and never the angle — rejected: two squads whose indices
//          differ by 21 land 8° apart and print over each other, which is the
//          overlap the fan exists to stop
//   ship   what the file does now: offsetIn() as the target, fanTo() gliding to it
const EASE_MS = FAN_EASE_MS;
function offsetFor(mode, state, k, group, m, scale, dt){
  let want;
  if(mode === 'ident'){
    if(group.length < 2) want = {dx: 0, dy: 0};
    else {
      const r = 2.2 / scale, a = (k * 137.508) * Math.PI / 180;
      want = {dx: Math.cos(a) * r, dy: Math.sin(a) * r};
    }
    return want;
  }
  want = offsetIn(group, m, scale);
  if(mode === 'raw') return want;
  const s = fanTo(state, k, want, dt, EASE_MS);
  return {dx: s.dx, dy: s.dy};
}

function run(timeline, fromZone, mode){
  let at = 0, speed = null, shown = -1, lastDraw = -1e9, now = 0;
  let prev = null, prevStep = null, prevGroups = null;
  const jerkDrawn = [], jerkCarried = [], jerkAtEdge = [], jerkMidFrame = [], regroups = [];
  let draws = 0, lastWhole = -1, drawnAt = -1e9;
  const fanState = {};

  while(true){
    const dt = TIMER_MS;
    now += dt;
    const whole = Math.floor(at);
    const pace = timeline[Math.min(whole, timeline.length-1)].zone >= CLOSE_ZONE ? PACE_CLOSE : 1;
    speed = speed === null ? pace : speed + (pace - speed) * Math.min(1, dt / 220);
    at += dt / FRAME_MS * speed;
    const i = Math.floor(at);
    if(i >= timeline.length - 1) break;
    const fresh = i !== shown;
    if(!(fresh || now - lastDraw >= MIN_DRAW_MS)) continue;
    shown = i; lastDraw = now;
    const frame = between(timeline[i], timeline[i+1], at - i, fresh);
    if(frame.zone < fromZone){ prev = prevStep = prevGroups = null; lastWhole = i; continue; }
    draws++;
    const crossed = i !== lastWhole; lastWhole = i;

    // Where the drawing puts every alive squad, fan and all.
    const sinceDraw = now - drawnAt; drawnAt = now;
    const groups = cluster(frame.dots, SCALE);
    const pos = {}, key = {};
    for(let g=0; g<groups.length; g++){
      for(let m=0; m<groups[g].length; m++){
        const k = groups[g][m], d = frame.dots[k];
        const off = offsetFor(mode, fanState, k, groups[g], m, SCALE, sinceDraw);
        pos[k] = {drawn: {x: d.x + off.dx, y: d.y + off.dy}, carried: {x: d.x, y: d.y}};
        key[k] = groups[g].length + ':' + m;
      }
    }
    const step = {};
    if(prev){
      let churn = 0, seen = 0;
      for(const k in pos){
        if(!prev[k]) continue;
        seen++;
        if(key[k] !== prevGroups[k]) churn++;
        step[k] = {
          drawn: {x: (pos[k].drawn.x - prev[k].drawn.x) * PX_PER_UNIT,
                  y: (pos[k].drawn.y - prev[k].drawn.y) * PX_PER_UNIT},
          carried: {x: (pos[k].carried.x - prev[k].carried.x) * PX_PER_UNIT,
                    y: (pos[k].carried.y - prev[k].carried.y) * PX_PER_UNIT}
        };
        if(prevStep && prevStep[k]){
          const jd = Math.hypot(step[k].drawn.x - prevStep[k].drawn.x,
                                step[k].drawn.y - prevStep[k].drawn.y);
          const jc = Math.hypot(step[k].carried.x - prevStep[k].carried.x,
                                step[k].carried.y - prevStep[k].carried.y);
          jerkDrawn.push(jd); jerkCarried.push(jc);
          (crossed ? jerkAtEdge : jerkMidFrame).push(jc);
        }
      }
      if(seen) regroups.push(churn / seen);
    }
    prev = pos; prevGroups = key; prevStep = step;
  }
  return {jerkDrawn, jerkCarried, jerkAtEdge, jerkMidFrame, regroups, draws};
}

function stat(a){
  if(!a.length) return {n:0};
  const s = a.slice().sort((x,y) => x-y);
  const mean = a.reduce((p,c) => p+c, 0) / a.length;
  return {n: a.length, mean, p50: s[Math.floor(s.length*0.5)],
          p99: s[Math.floor(s.length*0.99)], max: s[s.length-1]};
}

function show(label, a){
  const s = stat(a);
  if(!s.n){ console.log('    ' + label + ': nothing'); return; }
  console.log('    ' + label.padEnd(26) +
              'mean ' + s.mean.toFixed(2).padStart(6) +
              '  p50 ' + s.p50.toFixed(2).padStart(6) +
              '  p99 ' + s.p99.toFixed(2).padStart(6) +
              '  max ' + s.max.toFixed(2).padStart(6));
}

const SEEDS = [11, 22, 33, 44, 55, 66, 77, 88];
const GAMES = SEEDS.map(s => record(s).timeline);
const FROM = 10;

console.log('\nzones ' + FROM + '+, eight games, scale pinned at ' + SCALE +
            ' (where the endgame camera sits)');
console.log('change of a marker\'s step between one draw and the next, screen px:\n');
let carriedOnce = null;
for(const mode of ['raw', 'ident', 'ship']){
  const drawn = [], carried = [], edge = [], mid = [], regroups = [];
  let draws = 0;
  for(const t of GAMES){
    const r = run(t, FROM, mode);
    drawn.push(...r.jerkDrawn); carried.push(...r.jerkCarried);
    edge.push(...r.jerkAtEdge); mid.push(...r.jerkMidFrame);
    regroups.push(...r.regroups);
    draws += r.draws;
  }
  if(!carriedOnce){
    carriedOnce = true;
    show('carried (frame alone)', carried);
    show('  ... at a frame edge', edge);
    show('  ... mid-frame', mid);
    const g = stat(regroups);
    console.log('    markers whose slot in the fan changed, per draw: mean ' +
                (g.mean*100).toFixed(1) + '%\n');
  }
  show('drawn / ' + mode, drawn);
  console.log('      over  4px ' + (drawn.filter(v => v > 4).length / (drawn.length||1) * 100).toFixed(2) +
              '%   over 10px ' + (drawn.filter(v => v > 10).length / (drawn.length||1) * 100).toFixed(2) +
              '%   over 20px ' + (drawn.filter(v => v > 20).length / (drawn.length||1) * 100).toFixed(2) + '%');
}
