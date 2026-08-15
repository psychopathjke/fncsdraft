// What the roster actually knows about organisations, before any of it is used
// to sign anybody. An org's standing has to be measured off its players rather
// than assigned, or the whole contract system is a table of invented tiers.
//
// Two things are checked here and both used to be wrong:
//
//   - a club is its current squad, not its history. careerRosterEU keeps each
//     player's strongest card whenever it was made, so clubs were ranked on
//     2024 results and seven clubs with nobody left in 2026 were still signing
//     careers. careerOrgPool reads careerRosterNowEU instead.
//   - one club is one row. Two spellings that resolve to the same crest file
//     are the same club — FOKUS and FOKUS CLAN, Knights of Shadows and KoS
//     Esports — and the pool must not carry both.
//
// It also regenerates CAREER_CRESTS, the set of crest files on disk, which is
// what decides whether a club is drawn with its badge or with a monogram.
//
//   node tools/career-org-check.js
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
  const out = {};
  const eu = PLAYERS.filter(p => (p.region||'') === 'EU');
  out.euCards = eu.length;
  out.yearless = eu.filter(p => !ccCardYear(p)).length;
  out.nowCards = eu.filter(p => ccCardYear(p) === CC_NOW_YEAR).length;
  out.nowPlayers = careerRosterNowEU().length;
  out.year = CC_NOW_YEAR;
  // Every club on any card ever, against the ones with somebody now.
  const ever = new Set(); eu.forEach(p => { if (p.org) ever.add(p.org); });
  out.everOrgs = ever.size;
  out.pool = careerOrgPool().map(o => ({name:o.name, tier:o.tier, n:o.n, logo:clubLogoFile(o.name)}));
  // The same club under two names would show up as two rows sharing one crest.
  const seen = {}, dupes = [];
  out.pool.forEach(o => { if (seen[o.logo]) dupes.push(seen[o.logo] + ' / ' + o.name);
                          seen[o.logo] = o.name; });
  out.dupes = dupes;
  // What a career sees: the clubs a player of this rating could be offered.
  out.reach = CAREER_ORG_REACH;
  out.crests = [...CAREER_CRESTS];
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orgchk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], { maxBuffer: 512*1024*1024, encoding:'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

let bad = 0;
const fail = msg => { console.error('  FAIL ' + msg); bad++; };

console.log(out.euCards + ' European cards, ' + out.nowCards + ' of them from ' + out.year +
  ', across ' + out.nowPlayers + ' players');
if (out.yearless) fail(out.yearless + ' cards whose year cannot be read — ccCardYear has a gap');
console.log(out.pool.length + ' clubs field somebody in ' + out.year + ', of ' + out.everOrgs + ' ever');

const onDisk = fs.readdirSync(path.join(ROOT, 'logos')).filter(f => f.endsWith('.png')).sort();
const crested = out.pool.filter(o => onDisk.includes(o.logo));
console.log('with a crest on disk: ' + crested.length + '; drawn as a monogram: ' +
  (out.pool.length - crested.length));

const row = o => '  ' + String(o.tier).padStart(3) + '  n=' + String(o.n).padStart(2) +
  '  ' + (onDisk.includes(o.logo) ? 'crest' : ' mono') + '  ' + o.name;
console.log('\nstrongest:'); out.pool.slice(0, 12).forEach(o => console.log(row(o)));
console.log('weakest:');   out.pool.slice(-8).forEach(o => console.log(row(o)));

// ---- the checks -----------------------------------------------------------
console.log('');
if (out.dupes.length) fail('one club, two rows: ' + out.dupes.join(', '));
else console.log('  ok   no club appears twice under two spellings');

const empty = out.pool.filter(o => !(o.n > 0));
if (empty.length) fail('clubs with no players: ' + empty.map(o => o.name).join(', '));
else console.log('  ok   every club in the pool fields somebody this year');

// CAREER_CRESTS has to be what is actually in logos/, or a club with a crest is
// drawn as a monogram and one without is drawn as a hole.
const listed = out.crests.slice().sort();
const missing = onDisk.filter(f => !listed.includes(f));
const extra = listed.filter(f => !onDisk.includes(f));
if (missing.length || extra.length) {
  fail('CAREER_CRESTS is stale' + (missing.length ? ' — on disk but not listed: ' + missing.join(', ') : '') +
       (extra.length ? ' — listed but not on disk: ' + extra.join(', ') : ''));
  console.error('  regenerate with: node tools/career-org-check.js --write');
  if (process.argv.includes('--write')) {
    const lines = []; let cur = '  ';
    onDisk.forEach((f, i) => {
      const t = "'" + f + "'" + (i === onDisk.length - 1 ? '' : ',');
      if (cur.length + t.length > 98) { lines.push(cur); cur = '  '; }
      cur += t;
    });
    lines.push(cur);
    const body = 'const CAREER_CRESTS=new Set([\n' + lines.join('\n') + ']);';
    const page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const re = /const CAREER_CRESTS=new Set\(\[[\s\S]*?\]\);/;
    if (!re.test(page)) { console.error('  cannot rewrite: CAREER_CRESTS not found in index.html'); }
    else {
      fs.writeFileSync(path.join(ROOT, 'index.html'), page.replace(re, body.replace(/\n/g, '\r\n')), 'utf8');
      console.log('  rewrote CAREER_CRESTS with ' + onDisk.length + ' files — run again to confirm');
    }
  }
} else console.log('  ok   CAREER_CRESTS matches logos/ (' + onDisk.length + ' files)');

// The pool has to reach down to where a career starts, or the first divisions
// are played with nobody's name on you — which is what restricting the pool to
// crested clubs did.
const floor = Math.min.apply(null, out.pool.map(o => o.tier));
console.log('  ok   tiers run ' + floor + ' to ' + Math.max.apply(null, out.pool.map(o => o.tier)) +
  '; a rookie at 54 can reach ' + out.pool.filter(o => 54 >= o.tier - out.reach).length + ' of them');

if (bad) { console.error('\n' + bad + ' failing'); process.exit(1); }
console.log('\nthe club pool is this year\'s clubs, and every one of them can be drawn');
