// The other direction: what did not change when the language did.
//
// check-ui-language.js looks for Russian on an English screen. That is one half
// of the question, and it cannot see the half that matters more here — an
// English label sitting on a Russian screen, which is what a player who plays in
// Russian actually meets.
//
// So this renders every screen in both languages and lists the visible text that
// came out identical. Identical is not automatically wrong: handles, org names,
// Reload, FNCS and the initials on an avatar read the same either way. It lists
// rather than fails, and a human decides — the alternative is a whitelist that
// goes stale the first time somebody signs for a club with a Latin name.
//
//   node tools/check-language-both.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BASE = '<base href="file:///' + ROOT + '/">';
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {same: [], err: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function textsOf(root){
    const list = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = (n.textContent || '').trim();
      if (!t) continue;
      const el = n.parentElement;
      if (el && el.offsetParent === null) continue;
      list.push(t);
    }
    return list;
  }
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:16, source:'rookie', country:'rs', countryPing:26,
        closeRangeEdge:6, region:'EU', ovr:57, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-18', division:4, earnings:9000, tokens:[], log:[
        {season:1, day:'2026-02-16', div:4, place:63, of:150, pts:388, passed:false,
         games:11, wins:2, elims:30, ovr:57}],
        news:[{season:1, day:'2026-02-16', kind:'good', k:'ccNewsRating', a:[56,57]}]},
      org:{name:'Team Falcons', salary:36000, goal:{type:'place', target:20}, since:1},
      partner:{handle:'Th0masHD', cardRegion:'EU', patience:40}
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(57, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));

    const tabs = ['centre','calendar','card','social','shop','log'];
    // Drawn first, then switched — the path a player takes. Pressing RU is the
    // whole interaction; nothing re-opens the screen afterwards, so if the hub
    // does not redraw itself the body keeps the language it was built in. Both
    // earlier harnesses re-rendered before reading and could never see that.
    const grab = lang => {
      setLang(lang);
      const per = {};
      for (const t of tabs) { careerTab(t); per[t] = textsOf(document.getElementById('screen-career-hub')); }
      return per;
    };
    careerEntry();
    const drawnIn = textsOf(document.getElementById('screen-career-hub')).join('|');
    setLang('ru');
    const afterSwitch = textsOf(document.getElementById('screen-career-hub')).join('|');
    out.redrew = drawnIn !== afterSwitch;
    const en = grab('en');
    await wait(60);
    const ru = grab('ru');

    const LAT = /[A-Za-z]/;
    for (const t of tabs) {
      const a = en[t] || [], b = ru[t] || [];
      const bs = new Set(b);
      const same = a.filter(x => bs.has(x) && LAT.test(x));
      if (same.length) out.same.push({tab: t, lines: [...new Set(same)]});
    }
  } catch(e){ out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rucheck-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,1400','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('threw: ' + out.err); process.exit(1); }
out.same.forEach(g => {
  console.log('\n== ' + g.tab + ' (' + g.lines.length + ') ==');
  g.lines.slice(0, 30).forEach(l => console.log('   ' + l));
});
if (!out.same.length) console.log('nothing reads the same in both');
if (out.redrew === false) {
  console.error('FAIL — switching the language left the hub as it was drawn');
  process.exit(1);
}
console.log('and the hub redraws itself when the language changes');
fs.rmSync(dir, {recursive:true, force:true});
