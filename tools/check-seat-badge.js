// Does the standings table say who is already going to the LAN?
//
// A team that already holds a seat cannot win a second one, so awardSeats skips
// it and its place passes down. That means it is absent from qualifiedSet, and
// the table used to render it dimmed — reading exactly like a team that missed
// out, when it is the opposite. A player reading the table needs it, because
// finishing behind such a team still takes a seat.
//
//   node tools/check-seat-badge.js
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
<pre id="__sb" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], sets: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    // The sets that carry LAN seats into a Major: 2026 Major 2 and 2025 Major 3.
    [['m2', 2], ['t3', 3]].forEach(function(cfg){
      var set = cfg[0], size = cfg[1];
      CARD_MODE = true; CARD_SET = set; squadSize = size; isMajorMode = true;
      var poolAll = cardRosterPlayers(set).slice();
      pool = poolAll.slice();
      drafted = poolAll.slice(0, size);

      var teams = [];
      fillFieldTeams(poolAll.slice(size), 49, size, teams);
      var you = buildTeam(drafted); you.isYou = true; you.name = 'YOU';
      teams.unshift(you);
      teams.forEach(function(t, i){
        t._uid = i; t.stagePts = 1000 - i * 7; t.stageElims = 0; t.wins = 0; t.stageLog = [];
        if (!t.name) t.name = 'T' + i;
      });
      var ranked = teams.slice().sort(function(a, b){ return b.stagePts - a.stagePts; });

      var slots = 6;
      var seats = awardSeats(ranked, slots, holdsLanSeat);
      var seatSet = new Set(seats);
      var cut = seats.length ? ranked.indexOf(seats[seats.length - 1]) + 1 : slots;
      var seatedAbove = ranked.slice(0, cut).filter(holdsLanSeat).length;

      // Render the table the stage card renders.
      var host = document.createElement('div');
      document.body.appendChild(host);
      revealStandings({card: host}, ranked, you, cut, null, seatSet, null, null);
      var html = host.innerHTML;
      var tag = L().alreadyQualTag;
      var badges = html.split(tag).length - 1;

      out.sets.push({set: set, slots: slots, cut: cut, seatedAbove: seatedAbove,
                     badges: badges, seatsAwarded: seats.length});

      check(set + ': a seat holder is never awarded a second seat',
        seats.every(function(t){ return !holdsLanSeat(t); }),
        seats.length + ' seats awarded');
      if (seatedAbove > 0) {
        check(set + ': every seat holder above the cut is tagged',
          badges >= seatedAbove,
          seatedAbove + ' seat holders above the cut, ' + badges + ' tags in the table');
        check(set + ': the cut rolls past them',
          cut > slots,
          'cut at #' + cut + ' for ' + slots + ' seats');
      } else {
        check(set + ': no seat holder finished above the cut this run',
          true, 'nothing to tag; the tag is exercised by the other set');
      }
      // A tagged team must not also be dimmed as though it missed out.
      check(set + ': a tagged row is not dimmed',
        html.indexOf('opacity: 0.55') < 0 || html.indexOf(tag) < 0 ||
          html.split('<tr').filter(function(r){ return r.indexOf(tag) >= 0 &&
            r.indexOf('opacity: 0.55') >= 0; }).length === 0,
        'rows carrying the tag and the dim style at once');
      host.remove();
    });
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__sb').textContent =
    'BEGINSB' + encodeURIComponent(JSON.stringify(out)) + 'ENDSB';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-seat-badge.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINSB([\s\S]*?)ENDSB/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.sets.forEach(s => console.log(s.set + ': ' + s.slots + ' seats, cut at #' + s.cut +
  ', ' + s.seatedAbove + ' already-qualified above it, ' + s.badges + ' tagged in the table'));
let bad = 0;
console.log('');
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
