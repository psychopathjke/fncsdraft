// Does a Reload cup actually play through, end to end?
//
// Everything else about this circuit is checked a piece at a time — the cards,
// the bracket, the points, the drops. This drives the tournament itself, in the
// app's own runner, and asks the questions that only a whole run can answer:
// did the Play-In seat twenty to a lobby, did the heats send five each through,
// did the final play its eight games, and did anybody's night end on a Victory
// Royale in a circuit that does not qualify one.
//
//   node tools/check-ewc-run.js [set]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SET = process.argv[2] || 'r4';
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
  const out = {error: null, log: []};
  try{
    CARD_MODE = true; squadSize = 2; CARD_SET = '${SET}';
    const FMT = majorFormat(null, '${SET}');
    const pool = PLAYERS.filter(p => p.cardSet === '${SET}' && p.region === 'EU');
    // A field the size the mode fields: duos off the top of the pool.
    const teams = [];
    for (let i = 0; i + 1 < pool.length && teams.length < 150; i += 2){
      const t = buildTeam([pool[i], pool[i+1]]);
      t.name = teamLabel([pool[i], pool[i+1]]);
      teams.push(t);
    }
    // ---- the Play-In, in the lobbies the format says ----
    simulateGamesRandomLobbies(teams, FMT.playInGames || 22, FMT.lobby || 50, playInPointsForPlace, 2);
    teams.sort((a, b) => b.stagePts - a.stagePts);
    const played = teams.map(t => (t.stageLog || []).length);
    out.playIn = {teams: teams.length, games: Math.max(...played),
                  topPts: teams[0].stagePts, lobby: FMT.lobby};

    // ---- the heats ----
    const advanced = teams.slice(0, FMT.playInCut);
    const heats = seedHeats(advanced, FMT.heats.length);
    const through = [];
    heats.forEach((heat, i) => {
      const g = FMT.heats[i].games;
      (FMT.winAdvances === false ? simulateGames : simulateGamesStopOnWin)(heat, g, heatsScoreForPlace, 3);
      const q = heatQualifiers(heat, FMT.heats[i].cut, FMT.winAdvances);
      heat.sort(heatsRank);
      const winnersOut = heat.filter(t => t.gotVR).filter(t => heat.indexOf(t) >= FMT.heats[i].cut);
      out.log.push('heat ' + (i+1) + ': ' + heat.length + ' teams, ' +
                   Math.max(...heat.map(t => (t.stageLog||[]).length)) + ' games, ' + q.size + ' through' +
                   (winnersOut.length ? ', ' + winnersOut.filter(t => q.has(t)).length + ' of ' +
                    winnersOut.length + ' winners outside the cut walked' : ''));
      out.heatSizes = (out.heatSizes || []).concat(heat.length);
      out.heatThrough = (out.heatThrough || []).concat(q.size);
      out.heatWinnersWalked = (out.heatWinnersWalked || 0) + winnersOut.filter(t => q.has(t)).length;
      [...q].forEach(t => through.push(t));
    });

    // ---- the final ----
    const finalists = through.slice(0, 20);
    simulateGames(finalists, FMT.gfGames || 8, pointsForPlace, FMT.gfKill || 4);
    finalists.sort((a, b) => b.stagePts - a.stagePts);
    out.final = {teams: finalists.length,
                 games: Math.max(...finalists.map(t => (t.stageLog||[]).length)),
                 champion: finalists[0].name.replace(/<[^>]*>/g, ''),
                 pts: finalists[0].stagePts,
                 kill: FMT.gfKill || 4,
                 bestGamePts: Math.max(...finalists[0].stageLog.map(g => g.pts))};
  }catch(e){ out.error = String(e && e.stack || e).slice(0, 700); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ewcrun-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(1); }

let bad = 0;
const say = (ok, line) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + line); if(!ok) bad++; };
console.log(SET + ' played end to end');
console.log('  play-in: ' + out.playIn.teams + ' teams, ' + out.playIn.games + ' games, lobbies of ' +
            out.playIn.lobby + ', top ' + out.playIn.topPts + ' points');
out.log.forEach(l => console.log('  ' + l));
console.log('  final: ' + out.final.teams + ' teams, ' + out.final.games + ' games, ' +
            out.final.kill + ' a kill — ' + out.final.champion + ' on ' + out.final.pts + '\n');

say(out.playIn.games === 22, 'the Play-In runs its games');
say(out.heatSizes.every(n => n === 20), 'every heat seats twenty (' + out.heatSizes.join('/') + ')');
say(out.heatThrough.every(n => n === 5), 'five come out of each heat (' + out.heatThrough.join('/') + ')');
say(out.heatWinnersWalked === 0, 'no Victory Royale walked past the cut');
say(out.final.teams === 20, 'the final is twenty teams');
say(out.final.games === 8, 'and eight games');
say(out.final.kill === 3, 'a kill in the final is worth three');
// A win is 60 and a kill 3, so a perfect game is 60 + 3 per elimination: nothing
// can score a placement worth more than sixty.
say(out.final.bestGamePts <= 60 + 3 * 30, 'no game scored more than the table can pay');
console.log('\n' + (bad ? bad + ' failing' : 'a Reload cup plays the way the circuit played it'));
process.exit(bad ? 1 : 0);
