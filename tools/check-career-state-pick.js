// A state is picked for its connection, and the player is still American.
//
// His rule, 20 August, once the North America maps went to states: clicking
// California takes California's milliseconds and nothing else. The country on
// the card, the flag beside the nickname, the rent and the passport are the
// United States, because a state is not a nationality and the mode has nowhere
// to put one.
//
//   node tools/check-career-state-pick.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const done = () => {
    try {
      // ---- the maps carry states at all ---------------------------------
      const naw = CC_REGION_PINGS.NAW.filter(x => x.c.indexOf('us-') === 0);
      const nac = CC_REGION_PINGS.NAC.filter(x => x.c.indexOf('us-') === 0);
      out.notes.states = {onNAW: naw.length, onNAC: nac.length};
      check('the North America maps are drawn by state', naw.length > 30 && nac.length > 30,
            naw.length + ' / ' + nac.length);
      check('and the country itself is no longer one of the shapes',
            !CC_REGION_PINGS.NAW.some(x => x.c === 'us'));

      // ---- a state carries a ping of its own ----------------------------
      const wa = ccPingOf('us-wa', 'NAW'), fl = ccPingOf('us-fl', 'NAW');
      out.notes.spread = {washington: wa, florida: fl};
      check('a state on the coast of the server beats one across the continent',
            wa != null && fl != null && fl > wa + 20, wa + ' vs ' + fl);

      // ---- and it is a ping, not a passport -----------------------------
      check('a state resolves to its country', ccCountryOf('us-ca') === 'us',
            ccCountryOf('us-ca'));
      check('and a country is left alone', ccCountryOf('de') === 'de');
      check('the rent of a state is the rent of its country',
            ccRentOf('us-ca') === ccRentOf('us'), ccRentOf('us-ca') + ' vs ' + ccRentOf('us'));

      // ---- the name is the state's, the flag is the country's -----------
      out.notes.name = ccCountryName('us-ca');
      check('the map names the state', /Калифорн|Californ/.test(ccCountryName('us-ca')),
            ccCountryName('us-ca'));
      const svg = ccBuildMap(null, 'NAW');
      // One flag for the country, not fifty for the states: the shapes are
      // zones you click for their milliseconds, and each carries its number.
      check('the states share the flag of the United States',
            svg.indexOf('flagcdn.com/w320/us.png') >= 0);
      check('and no state flies one of its own',
            svg.indexOf('flagcdn.com/w320/us-') < 0);
      check('with its own number on it', svg.indexOf('data-code="us-ca"') >= 0);

      // ---- a career made on a state --------------------------------------
      // The creation screen's own path: pick the state, then read what a save
      // would be written with.
      // CC is a const binding in the page, so the probe fills it rather than
      // replacing it — the same object the screen itself works on.
      CC.mode='rookie'; CC.region='NAW'; CC.country=null; CC.div=5; CC.photo=null; CC.card=null;
      ccPickCountry('us-ca');
      out.notes.picked = {picked: CC.country, ping: ccPingOf(CC.country, 'NAW'),
                          country: ccCountryOf(CC.country)};
      check('the pick is the state', CC.country === 'us-ca', String(CC.country));
      check('but the career it makes is American', ccCountryOf(CC.country) === 'us',
            ccCountryOf(CC.country));
      check('on the state\\'s own milliseconds',
            ccPingOf('us-ca', 'NAW') !== ccPingOf('us-ny', 'NAW'),
            ccPingOf('us-ca','NAW') + ' vs ' + ccPingOf('us-ny','NAW'));

      // ---- and the card flies a flag -------------------------------------
      // It flew none at all until 20 August: the nationality was looked up by
      // the picked code, no state has an entry there, and a career started in
      // California went out with an empty square where every other career has
      // a flag.
      const card = ccMakePlayer();
      out.notes.nat = {nat: card.nat, flag: flagImg(card.nat, 15)};
      check('a state-born card carries a nationality', !!card.nat, String(card.nat));
      check('and it is the American flag',
            (flagImg(card.nat, 15) || '').indexOf('flagcdn.com/w40/us.png') >= 0,
            flagImg(card.nat, 15));
    } catch (e) { out.err = String(e && e.stack || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccst-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a state is a connection, not a passport');
fs.rmSync(dir, { recursive: true, force: true });
