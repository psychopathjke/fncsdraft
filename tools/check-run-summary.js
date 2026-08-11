// Does the end-of-run card say whether you are going to the LAN?
//
// A Major is played for a seat, and the summary card listed every stage and
// every payout without ever saying whether the run got one — you had to scroll
// back up to a stage card to find out.
//
//   node tools/check-run-summary.js
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
<pre id="__rs" style="display:none"></pre>
<script>
(function(){
  var out = {checks: [], samples: []};
  var check = function(name, pass, detail){ out.checks.push({name: name, pass: !!pass, detail: detail}); };
  try {
    CARD_MODE = true; CARD_SET = 't3'; squadSize = 3;
    var render = function(){
      var host = document.getElementById('runSummary') ||
                 document.getElementById('majorStages');
      if (!host) { host = document.createElement('div'); host.id = 'runSummary'; document.body.appendChild(host); }
      renderRunSummaryCard();
      return host.textContent || '';
    };

    // A run that took a seat, and one that did not.
    [[true, 'took a seat'], [false, 'missed out']].forEach(function(cfg){
      resetRunRecord();
      recordPlace('Play-In', 12, 150, true, 800);
      recordPlace('Heat 1', 4, 50, true, 300);
      recordPlace('Grand Finals', cfg[0] ? 2 : 19, 33, cfg[0], 420);
      recordEarning('Grand Finals', 25000);
      recordLanSeat(L().lanLyon, cfg[0], L().lanSeatDetail(cfg[0] ? 2 : 19, 4, 'Europe'));
      var text = render();
      out.samples.push({run: cfg[1], text: text.replace(/\\s+/g, ' ').trim().slice(0, 220)});

      check(cfg[1] + ': the card names the LAN',
        text.indexOf('Lyon') >= 0, 'card text does not mention it');
      check(cfg[1] + ': the card says whether the seat was taken',
        text.indexOf(cfg[0] ? L().lanSeatWon : L().lanSeatMissed) >= 0,
        'expected "' + (cfg[0] ? L().lanSeatWon : L().lanSeatMissed) + '"');
      check(cfg[1] + ': the money is still there',
        text.indexOf('25,000') >= 0 || text.indexOf('25 000') >= 0 || text.indexOf('$25') >= 0,
        'the earnings line went missing');
    });

    // A run with no LAN on the line at all must not invent one.
    resetRunRecord();
    recordPlace('Tournament', 7, 50, false, 300);
    var plain = render();
    check('a run with no seat on the line says nothing about one',
      plain.indexOf(L().lanSeatWon) < 0 && plain.indexOf(L().lanSeatMissed) < 0,
      'a LAN line appeared where no seat was at stake');
  } catch (e) { out.error = String(e && e.stack || e); }
  document.getElementById('__rs').textContent =
    'BEGINRS' + encodeURIComponent(JSON.stringify(out)) + 'ENDRS';
})();
<\/script>`;

const tmp = path.join(ROOT, '.probe-run-summary.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(tmp, { force: true });
const m = dom.match(/BEGINRS([\s\S]*?)ENDRS/);
if (!m) { console.error('probe did not run'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.error(out.error); process.exit(2); }

out.samples.forEach(s => console.log(s.run + ':\n  ' + s.text + '\n'));
let bad = 0;
out.checks.forEach(c => {
  if (!c.pass) bad++;
  console.log((c.pass ? '  ok   ' : '  FAIL ') + c.name);
  if (!c.pass) console.log('         ' + c.detail);
});
console.log('\n' + out.checks.length + ' checks, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
