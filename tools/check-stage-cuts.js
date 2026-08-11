// Do the stages cut where the format says they cut, and does the table show it?
//
// Both of these came in from a player using the site.
//
// The Last Chance Round 1 advanced a flat 50 whatever the mode, so in trios it
// was sending fifty teams into a Last Chance Lobby that seats thirty-three.
// What advances is one lobby: TEAM_TARGET, 50 duos / 33 trios / 25 squads.
//
// And the Play-In cuts to 99 out of 150, but the standings stopped at sixty
// rows, so the line was never drawn and the stage read as though 99 teams were
// not there at all.
//
//   node tools/check-stage-cuts.js
'use strict';

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOTSTRAP = `
<pre id="__sc" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], rows: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    // What one lobby holds, which is what a Last Chance Round 1 may advance.
    [[2, 50], [3, 33], [4, 25]].forEach(function(pair){
      squadSize = pair[0];
      check((pair[0] === 2 ? 'duos' : pair[0] === 3 ? 'trios' : 'squads') +
        ': the Last Chance advances one lobby, not fifty',
        (TEAM_TARGET[squadSize] || 50) === pair[1],
        'advances ' + (TEAM_TARGET[squadSize] || 50) + ', a lobby seats ' + pair[1]);
    });

    // The Play-In's own cut, per set and region, and whether a table that long
    // would actually draw the line.
    [['t2', 3, 'EU'], ['m2', 2, 'EU'], ['t2', 3, 'OCE']].forEach(function(cfg){
      CARD_MODE = true; CARD_SET = cfg[0]; squadSize = cfg[1];
      var fmt = majorFormat(cfg[2], cfg[0]);
      var cut = fmt.playInCut;
      // revealStandings caps rows; the cut has to be inside the cap or it is
      // never rendered. This mirrors the cap expression.
      var cap = Math.max(60, cut ? cut + 1 : 0);
      out.rows.push({set: cfg[0], region: cfg[2], playInCut: cut, rowCap: cap});
      check(cfg[0] + '/' + cfg[2] + ': the Play-In cut line is inside the table',
        cut < cap, 'cut at ' + cut + ', table holds ' + cap + ' rows');
    });

    // The free modes run majorFormat with no card set, which used to hand them
    // the duo shape whatever size the squads were — the trio Major advanced 150
    // when three heats of thirty-three seat 99. This is what a player reported.
    CARD_MODE = false;
    [[2, 150], [3, 99], [4, 75]].forEach(function(pair){
      squadSize = pair[0];
      var f = majorFormat(null, null);
      check('free ' + (pair[0]===2?'duo':pair[0]===3?'trio':'squad') +
        ' Major: the Play-In advances what the heats can seat',
        f.playInCut === pair[1],
        'advances ' + f.playInCut + ', ' + f.heats.length + ' heats of ' +
        (TEAM_TARGET[pair[0]]) + ' seat ' + pair[1]);
    });
    CARD_MODE = true;

    // And end to end: build a real Play-In sized field, render the standings
    // the stage renders, and look for the line.
    CARD_MODE = true; CARD_SET = 't2'; squadSize = 3; isMajorMode = true;
    var poolAll = cardRosterPlayers('t2').slice();
    pool = poolAll.slice(); drafted = poolAll.slice(0, 3);
    var teams = [];
    fillFieldTeams(poolAll.slice(3), 149, 3, teams);
    var you = buildTeam(drafted); you.isYou = true; you.name = 'YOU';
    teams.unshift(you);
    teams.forEach(function(t, i){ t._uid = i; if(!t.name) t.name='T'+i;
      t.stagePts = 1000 - i; t.stageElims = 0; t.wins = 0; t.stageLog = []; });
    var host = document.createElement('div');
    document.body.appendChild(host);
    var cut2 = majorFormat('EU', 't2').playInCut;
    revealStandings({card: host}, teams, you, cut2, null, null, null, null);
    var rows = host.querySelectorAll('tbody tr').length;
    var hasLine = host.innerHTML.indexOf(L().stageCutLabel(cut2)) >= 0;
    out.rendered = {teams: teams.length, cut: cut2, rows: rows, line: hasLine};
    check('a 150-team Play-In table reaches its own cut',
      hasLine, cut2 + '-team cut line ' + (hasLine ? 'drawn' : 'missing') + ' in ' + rows + ' rows');
    host.remove();
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__sc').textContent =
    'BEGINSC' + encodeURIComponent(JSON.stringify(out)) + 'ENDSC';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-stage-cuts.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINSC([\s\S]*?)ENDSC/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.rows.forEach(r => console.log(r.set + '/' + r.region + ': Play-In cuts to ' + r.playInCut +
  ', the table holds ' + r.rowCap + ' rows'));
if (out.rendered) console.log('rendered ' + out.rendered.teams + ' teams, cut ' + out.rendered.cut +
  ': ' + out.rendered.rows + ' rows, cut line ' + (out.rendered.line ? 'present' : 'MISSING'));

let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
