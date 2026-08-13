// A Reload heat is eight games for everybody and the top five on points, and
// nothing else. FNCS still ends a team's night on a Victory Royale.
//
// The two rules live in the same code, so this runs a heat under each and asks:
// did anybody stop early, and did a Victory Royale outside the cut walk through
// a door that should have been shut?
//
//   node tools/check-ewc-heats.js
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
  const out = {runs: [], error: null};
  try{
    CARD_MODE = true; squadSize = 2;
    const heatOf = set => {
      const cards = PLAYERS.filter(p => p.cardSet === set).slice(0, 40);
      const teams = [];
      for(let i = 0; i + 1 < cards.length && teams.length < 20; i += 2){
        const t = buildTeam([cards[i], cards[i+1]]);
        t.name = teamLabel([cards[i], cards[i+1]]);
        teams.push(t);
      }
      return teams;
    };
    [['r1', 8, 5], ['m2', 5, 23]].forEach(([set, games, cut]) => {
      CARD_SET = set;
      const fmt = majorFormat(null, set);
      const stop = fmt.winAdvances !== false;
      const heat = heatOf(set);
      (stop ? simulateGamesStopOnWin : simulateGames)(heat, games, heatsScoreForPlace, 3);
      const played = heat.map(t => (t.stageLog || []).length);
      const ranked = heat.slice().sort(heatsRank);
      const q = heatQualifiers(heat, cut, fmt.winAdvances);
      const winners = heat.filter(t => t.gotVR);
      const winnersOutsideCut = winners.filter(t => ranked.indexOf(t) >= cut);
      out.runs.push({
        set: set, winAdvances: stop, games: games, cut: cut,
        playedMin: Math.min(...played), playedMax: Math.max(...played),
        qualified: q.size,
        topByPoints: ranked.slice(0, cut).every(t => q.has(t)),
        winners: winners.length,
        winnersOutsideCutThrough: winnersOutsideCut.filter(t => q.has(t)).length,
        winnersOutsideCut: winnersOutsideCut.length,
        winnersThrough: winners.filter(t => q.has(t)).length
      });
    });
  }catch(e){ out.error = String(e && e.stack || e).slice(0, 600); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ewcheat-'));
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
out.runs.forEach(r => {
  console.log(r.set + ': ' + r.games + ' games, cut ' + r.cut +
              ', a win ' + (r.winAdvances ? 'qualifies' : 'is just points') +
              ' — games played ' + r.playedMin + '-' + r.playedMax +
              ', through ' + r.qualified + ', winners ' + r.winners);
});
const rl = out.runs.find(r => r.set === 'r1'), fn = out.runs.find(r => r.set === 'm2');
say(rl.playedMin === rl.games && rl.playedMax === rl.games, 'a Reload heat is eight games for everybody, winners included');
say(rl.qualified === rl.cut, 'exactly five come out of a Reload heat');
say(rl.topByPoints, 'and they are the top five on points');
say(rl.winnersOutsideCutThrough === 0, 'a Victory Royale outside the five does not walk through (' +
    rl.winnersOutsideCut + ' such winner' + (rl.winnersOutsideCut === 1 ? '' : 's') + ' in this run)');
say(fn.playedMin < fn.games || fn.winners === 0, 'FNCS still stops a team on its Victory Royale');
say(fn.winners === 0 || fn.winnersThrough === fn.winners, 'and every FNCS winner is through (' + fn.winnersThrough + ' of ' + fn.winners + ')');
console.log('\n' + (bad ? bad + ' failing' : 'each circuit qualifies the way it qualifies'));
process.exit(bad ? 1 : 0);
