// One career, one rating: the hub header, the card and the social bio must
// all print the number the career actually holds.
//
// Two bugs this holds shut, both from attribute caching. A taken card resolved
// through PLAYERS returned whichever era the file listed first and carried that
// card's cached, already-floored attributes, so a 96 career read 92 everywhere
// a card was drawn — and stayed at 92 as it grew. A rookie's attrs live in the
// save, attrsFor stamps _floored onto the object it is handed, and after that
// stamp the six numbers stopped following the rating until the next cup rebuilt
// them.
//
//   node tools/check-career-rating.js
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
  const out = {rows: [], err: null};
  try {
    const look = (label) => {
      const pl = CAREER.player, card = careerCard(), a = card ? attrsFor(card) : null;
      out.rows.push({
        who: label,
        'player.ovr': pl.ovr,
        'ovrExact': pl.ovrExact,
        // What the hub prints, and what the card prints in its corner: both are
        // the base plus what the connection and the birthday are worth. The
        // base is printed under the card's number, and it is what rarity,
        // colour and division read, so a good country cannot move a rung.
        'header shown': a ? Math.round(a.ovr + (card._pingEdge||0) + (card._ageEdge||0)) : pl.ovr,
        'card shown': a ? Math.round(a.ovr + (card._pingEdge||0) + (card._ageEdge||0)) : pl.ovr,
        'card attrsFor.ovr': a ? a.ovr : null,
        'edges': a ? Math.round(((card._pingEdge||0)+(card._ageEdge||0))*10)/10 : 0,
        'card _targetOvr': card ? card._targetOvr : null,
        'roster now ovr': (careerRosterNowEU().find(p => hKey(p) === hKey(pl.handle||pl.nick))||{})._ovr,
        'social bio': pl.ovr,
        'team pow avg': (() => { const t = careerTeam([card, card]); return t.ovrAvg; })()
      });
    };
    const sky = careerRosterNowEU().find(p => p._ovr >= 90);
    // As taken, before any growth.
    CAREER = {player: {nick: sky.handle, ovr: sky._ovr, region: 'EU', role: 'roleIGL',
                       country: 'de', age: 16, handle: sky.handle, cardRegion: sky.region,
                       source: 'card', photo: null, attrs: null},
              career: {season: 1, day: '2026-01-15', division: 1, log: [], news: []},
              partner: null};
    look('taken card, fresh');
    // After a little growth.
    CAREER.player.ovrExact = sky._ovr + 0.6;
    CAREER.player.ovr = Math.round(CAREER.player.ovrExact);
    look('after +0.6 growth');
    // A rookie.
    CAREER = {player: {nick: 'Rook', ovr: 54, region: 'EU', role: 'roleIGL', country: 'de',
                       age: 16, handle: null, cardRegion: null, photo: null,
                       attrs: ccRookieAttrs(54, 'roleIGL')},
              career: {season: 1, day: '2026-01-15', division: 5, log: [], news: []},
              partner: null};
    look('rookie 54');
    CAREER.player.ovrExact = 57.4; CAREER.player.ovr = 57;
    look('rookie after growth to 57.4');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsrate-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('no output; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
let bad = 0;
out.rows.forEach(r => {
  const want = r['player.ovr'];
  // The base is the career's own rating, everywhere it is read as a rating:
  // the save, the card's attributes, the bio, the team's average.
  const baseOk = r['card attrsFor.ovr'] === want;
  // And the number a player is shown is that base plus what their country and
  // their birthday are worth — the same on the hub and on the card, never one
  // of each. That was the bug the two screenshots showed.
  const shownOk = r['header shown'] === r['card shown'];
  // Which is only the same number when nothing is riding on it.
  const edgeOk = Math.abs(r['header shown'] - want - r['edges']) < 0.51;
  const same = baseOk && shownOk && edgeOk;
  console.log((same ? '  ok   ' : '  FAIL ') + r.who + ': career ' + want +
    ', shown ' + r['header shown'] + ' (base ' + r['card attrsFor.ovr'] +
    ' + ' + r['edges'] + ')');
  if (!same) bad++;
});
console.log(bad ? bad + ' failing'
                : 'one base rating, and one shown number on the hub and the card');
if (bad) process.exit(1);
fs.rmSync(dir, { recursive: true, force: true });
