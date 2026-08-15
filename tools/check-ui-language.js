// Every screen, in English, checked for Russian that reached it.
//
// tools/i18n-check.js compares the two dictionaries and the data-i18n
// attributes, which catches a missing key and nothing else. It cannot see a
// Russian string written straight into the markup, and it cannot see one stored
// in a save and printed back verbatim — both of which render as Russian in an
// English interface while every key in both dictionaries is present and
// correct. That is the blind spot this closes.
//
// So this one renders rather than reads: fourteen screens with the language set
// to English, and any Cyrillic actually visible on them is a hit. Hidden nodes
// are skipped, so a string that exists in the DOM but is not on screen does not
// count.
//
// It does not cover a live tournament — the map, the kill feed and the stage
// cards need a full cup to reach and would put minutes on the run. Those were
// swept once by hand on 14 August 2026 and came back clean.
//
//   node tools/check-ui-language.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

// The page is copied to a temp directory to have the probe appended, which
// breaks every relative path in it. A <base> pointing back at the project fixes
// that; without it the covers and the card art fail to load and the screens
// render half-empty.
const BASE = '<base href="file:///' + ROOT + '/">';

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {screens: {}, err: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const CYR = /[\\u0410-\\u044F\\u0401\\u0451]/;
  // Roster handles are data, not UI, and they carry Cyrillic homoglyphs on
  // purpose. A text that is a known handle (or a team label joining two of
  // them) is a name whatever alphabet it borrowed, and an avatar's two
  // letters are cut from the same handle.
  const HANDLES = new Set(PLAYERS.map(p => String(p.handle || '').trim().toLowerCase()));
  const isName = t => {
    const parts = String(t).split(/\\s*[+&]\\s*/).map(s => s.trim().toLowerCase()).filter(Boolean);
    return parts.length && parts.every(p => HANDLES.has(p));
  };
  function scan(root){
    const found = new Map();
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = (n.textContent || '').trim();
      // "undefined" on screen is a key that was used and never defined. The
      // dictionary check cannot see it — it compares the two dictionaries with
      // each other, not with what the page asks for — so it is caught here,
      // where the text is the text a player reads.
      if (!t || !(CYR.test(t) || /undefined/.test(t))) continue;
      if (isName(t)) continue;
      const el = n.parentElement;
      if (el && el.offsetParent === null && el.tagName !== 'OPTION') continue;
      if (el && /dm-av|x-av/.test(String(el.className || ''))) continue;
      const key = t.slice(0, 70);
      if (!found.has(key)) found.set(key, ((el && el.className) || (el && el.tagName) || '?') + '');
    }
    return [...found.entries()].map(([t, where]) => t + '   <' + where + '>');
  }
  try{
    localStorage.setItem('fncsdraft_lang', 'en');
    setLang('en');
    await wait(60);
    out.screens['menu'] = scan(document.body);

    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:16, source:'rookie', country:'rs', countryPing:26,
        closeRangeEdge:6, region:'EU', ovr:57, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, week:3, division:4, earnings:0, tokens:[], log:[
        {season:1, week:2, div:4, place:63, of:150, pts:388, passed:false,
         games:11, wins:2, elims:30, ovr:57}],
        news:[{season:1, week:2, kind:'good', text:'Rating: 56 -> 57'}]},
      partner:null
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(57, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    await wait(120);
    for (const tab of ['centre','calendar','card','social','log']) {
      careerTab(tab);
      await wait(120);
      out.screens['career:' + tab] = scan(document.getElementById('screen-career-hub'));
    }

    // A career with a club, a partner and an inbox — states the bare save has
    // none of, and each one draws strings the others never touch.
    const rich = JSON.parse(localStorage.getItem('fncsdraft_career'));
    rich.career.division = 1;
    rich.org = {name:'Team Falcons', salary:36000, goal:{type:'place', target:20}, since:1};
    rich.partner = {handle:'Th0masHD', cardRegion:'EU', patience:3};
    localStorage.setItem('fncsdraft_career', JSON.stringify(rich));
    careerEntry();
    await wait(120);
    for (const tab of ['centre','social','log','calendar']) {
      careerTab(tab);
      await wait(150);
      out.screens['rich:' + tab] = scan(document.getElementById('screen-career-hub'));
    }
    // Write to everyone in the duo list, so every reply line is on the page.
    careerTab('social');
    await wait(120);
    for (let i = 0; i < 12; i++) {
      const next = document.querySelector('#chBody .dm-new');
      if (!next) break;
      next.click();
      await wait(60);
    }
    out.screens['rich:dms-written'] = scan(document.getElementById('screen-career-hub'));

    show('screen-career-create');
    await wait(150);
    out.screens['create'] = scan(document.getElementById('screen-career-create'));

    show('screen-mode');
    await wait(120);
    out.screens['mode'] = scan(document.getElementById('screen-mode'));
  } catch(e){ out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uilang-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('probe threw: ' + out.err); process.exit(1); }

let total = 0;
for (const [screen, list] of Object.entries(out.screens)) {
  total += list.length;
  if (list.length) {
    console.log('\n== ' + screen + ' (' + list.length + ') ==');
    list.slice(0, 25).forEach(s => console.log('   ' + s));
  }
}
console.log(Object.keys(out.screens).length + ' screens rendered in English');
if (total) {
  console.error('FAIL — ' + total + ' Russian strings reached an English screen');
  process.exit(1);
}
console.log('PASS — no Russian reached an English screen');
fs.rmSync(dir, { recursive: true, force: true });
