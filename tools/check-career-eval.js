// Does the Performance Evaluation play the way its own event page describes it?
//
// Two rounds that score differently: eight games on the ordinary duo ladder at
// one point a kill, the top fifty through, then four games where a Victory
// Royale is 100 points, an elimination is nothing, and the money is $400 a win.
// A simulation that treats the second round as a points cup would be wrong in
// exactly the way that matters, so this runs both and checks the shape.
//
//   node tools/check-career-eval.js
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
  const out = {error: null};
  try{
    CARD_MODE = true; squadSize = 2;
    const mk = (ovr, nick, role) => ({handle: nick, nat: null, region: 'EU', org: null,
      tier: 'ranked', event: 'eval check', placement: null,
      rating: ovr, _targetOvr: ovr, _attrs: ccRookieAttrs(ovr, role)});
    const me = mk(90, 'CHK_YOU', 'roleIGL'), mate = mk(90, 'CHK_MATE', 'roleFRG');
    CAREER = {player: {ovr: 90}, career: {season: 1, week: 3, division: 1, earnings: 0}, partner: null};
    const you = careerTeam([me, mate]);
    you.isYou = true; you.name = 'you';
    const field = [you].concat(careerCupField(CAREER.career, [me, mate]));
    out.field = {teams: field.length, fromDiv1: true};

    // Round 1 — the ordinary ladder, one a kill
    simulateGamesRandomLobbies(field, CC_EVAL_R1_GAMES, 50, pointsForPlace, CC_EVAL_R1_KILL);
    const ranked1 = field.slice().sort((a, b) => b.stagePts - a.stagePts || b.stageElims - a.stageElims);
    out.round1 = {games: Math.max(...field.map(t => (t.stageLog || []).length)),
                  topPts: ranked1[0].stagePts, killPts: CC_EVAL_R1_KILL,
                  winPts: pointsForPlace(1), secondPts: pointsForPlace(2), pts25: pointsForPlace(25),
                  pts26: pointsForPlace(26)};

    // Round 2 — the fifty through, and only a win scores
    const r2 = ranked1.slice(0, CC_EVAL_CUT);
    simulateGames(r2, CC_EVAL_R2_GAMES, evalRound2Points, 0);
    const ranked2 = r2.slice().sort((a, b) => b.stagePts - a.stagePts || (b.wins || 0) - (a.wins || 0));
    out.round2 = {teams: r2.length, games: Math.max(...r2.map(t => (t.stageLog || []).length)),
                  winPts: evalRound2Points(1), secondPts: evalRound2Points(2),
                  topWins: ranked2[0].wins || 0, topPts: ranked2[0].stagePts,
                  everyScoreIsWins: ranked2.every(t => t.stagePts === (t.wins || 0) * CC_EVAL_WIN_PTS),
                  cashTop: (ranked2[0].wins || 0) * CC_EVAL_WIN_CASH,
                  cashMax: CC_EVAL_R2_GAMES * CC_EVAL_WIN_CASH};
  }catch(e){ out.error = String(e && e.stack || e).slice(0, 600); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cceval-'));
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
console.log('round 1: ' + out.field.teams + ' duos, ' + out.round1.games + ' games, ' +
            out.round1.killPts + ' a kill, table ' + out.round1.winPts + '/' + out.round1.secondPts +
            ' … ' + out.round1.pts25 + ' at 25th, ' + out.round1.pts26 + ' past it');
console.log('round 2: ' + out.round2.teams + ' duos, ' + out.round2.games + ' games, a win ' +
            out.round2.winPts + ', second ' + out.round2.secondPts + ' — the winner took ' +
            out.round2.topWins + ' game(s) for $' + out.round2.cashTop + '\n');

say(out.round1.games === 8, 'Round 1 is eight games');
say(out.round1.winPts === 65 && out.round1.secondPts === 56 && out.round1.pts25 === 2 && out.round1.pts26 === 0,
    'Round 1 pays the duo table — 65, 56, down to 2 at twenty-fifth and nothing past it');
say(out.round1.killPts === 1, 'and one point a kill');
say(out.round2.teams === 50, 'fifty come through to Round 2');
say(out.round2.games === 4, 'Round 2 is four games');
say(out.round2.winPts === 100 && out.round2.secondPts === 0, 'only a Victory Royale scores in Round 2');
say(out.round2.everyScoreIsWins, 'every score in Round 2 is wins times a hundred, nothing else');
say(out.round2.cashMax === 1600, 'four wins is $1,600');
console.log('\n' + (bad ? bad + ' failing' : 'the evaluation plays the way its own page describes it'));
process.exit(bad ? 1 : 0);
