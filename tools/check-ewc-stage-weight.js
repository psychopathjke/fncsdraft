// Does the final decide what a Reload card is worth?
//
// The circuit is four stages deep and only the last one is the tournament: the
// Opens are a queue, the Play-In a filter, the heats a draw. So a card's stage
// has to dominate its rating — the worst seat in a final should be worth more
// than the best card that never left a heat, and the same downward step should
// hold between every pair of stages.
//
// This reads what the app actually rates, not what the bands say, so the career
// average that lifts a card toward a player's own best result is included: a
// player who is elite in FNCS keeps his number here, and this reports how often
// that happens rather than pretending it does not.
//
//   node tools/check-ewc-stage-weight.js
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
  const out = {stages: {}, base: {}, error: null};
  try{
    const SETS = ['r1','r2','r3','r4'];
    const STEP = ['open','playin','heat','final'];
    const bucket = st => st.indexOf('heat') === 0 ? 'heat' : st;
    const med = a => { const s = a.slice().sort((x,y)=>x-y); return s.length ? s[Math.floor(s.length/2)] : null; };
    const cards = PLAYERS.filter(p => SETS.indexOf(p.cardSet) >= 0);
    STEP.forEach(st => { out.stages[st] = []; out.base[st] = []; });
    out.byRegion = {};
    cards.forEach(p => {
      const st = bucket(p._rStage);
      out.stages[st].push(attrsFor(p).ovr);
      const reg = p.region || "?";
      const rb = (out.byRegion[reg] = out.byRegion[reg] || {});
      (rb[st] = rb[st] || []).push(Math.round(clamp(rBase(p.cardSet, p.region, p._rStage, p._r.entry.rank), 30, 99)));
      // what the stage band alone says, before any career lift
      out.base[st].push(Math.round(clamp(rBase(p.cardSet, p.region, p._rStage, p._r.entry.rank), 30, 99)));
    });
    out.summary = {};
    STEP.forEach(st => {
      const a = out.stages[st], b = out.base[st];
      out.summary[st] = {n: a.length, ovrMed: med(a), ovrMax: Math.max(...a),
                         baseMed: med(b), baseMax: Math.max(...b), baseMin: Math.min(...b)};
    });
    // how many cards read above the floor of the stage above them
    out.leak = {};
    for (let i = 0; i + 1 < STEP.length; i++){
      const below = STEP[i], above = STEP[i+1];
      const floorAbove = Math.min(...out.base[above]);
      out.leak[below + ' over ' + above] = {
        floorAbove: floorAbove,
        byBand: out.base[below].filter(v => v > floorAbove).length,
        byOvr: out.stages[below].filter(v => v > floorAbove).length,
        of: out.base[below].length
      };
    }
  }catch(e){ out.error = String(e && e.stack || e).slice(0, 600); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ewcweight-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

let bad = 0;
const say = (ok, line) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + line); if(!ok) bad++; };
console.log('stage    cards   band low-median-high   card median   card high');
['final', 'heat', 'playin', 'open'].forEach(st => {
  const r = out.summary[st];
  console.log('  ' + st.padEnd(7) + String(r.n).padStart(6) + '   ' +
              (r.baseMin + '-' + r.baseMed + '-' + r.baseMax).padEnd(20) +
              String(r.ovrMed).padStart(9) + String(r.ovrMax).padStart(12));
});
console.log('');
Object.keys(out.leak).forEach(k => {
  const l = out.leak[k];
  console.log('  ' + k.padEnd(18) + 'floor above ' + l.floorAbove + ' — ' + l.byBand + ' of ' + l.of +
              ' beat it on the band, ' + l.byOvr + ' after the career lift');
});
console.log('');
const perRegion = Object.keys(out.byRegion).map(reg => {
  const r = out.byRegion[reg];
  const ok = r.final && r.heat && Math.min(...r.final) > Math.max(...r.heat);
  return {reg, ok, finalLow: r.final ? Math.min(...r.final) : null, heatHigh: r.heat ? Math.max(...r.heat) : null};
});
perRegion.forEach(x => say(x.ok, x.reg + ': the worst seat in its final beats its best heat card (' + x.finalLow + ' vs ' + x.heatHigh + ')'));
say(out.summary.heat.baseMed > out.summary.playin.baseMed, 'a typical heat card outranks a typical Play-In card (' + out.summary.heat.baseMed + ' vs ' + out.summary.playin.baseMed + ')');
say(out.summary.playin.baseMed > out.summary.open.baseMed, 'a Play-In card outranks a typical Opens card');
say(out.summary.final.ovrMed - out.summary.heat.ovrMed >= 10, 'a final card reads at least ten points above a heat card (' +
    out.summary.final.ovrMed + ' vs ' + out.summary.heat.ovrMed + ')');
console.log('\n' + (bad ? bad + ' failing' : 'the final is what a Reload card is worth'));
process.exit(bad ? 1 : 0);
