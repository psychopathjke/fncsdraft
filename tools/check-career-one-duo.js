// Nobody is in two duos at once.
//
// A tester's report, 18 August: "с моего дуоса ушёл Sky к Scroll, который уже
// играл с Vox, но сам Scroll присоединился ко мне в пати". Three statements that
// cannot all be true, and the mode was making two of them.
//
// The lobbies were never the problem — careerCupField hands careerRealDuos a
// taken set holding the career's own pair, so a field never seats your partner
// with somebody else. careerWorldDuos, which announces who has teamed up with
// whom in the feed, handed it an empty set: it could announce a duo built out of
// the very person sitting in your party.
//
// So this asks the world the same question the lobby answers: with somebody in
// the seat, does anything anywhere pair them with anybody else.
//
//   node tools/check-career-one-duo.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = [
'<script>',
'(function(){',
'  var out = {fails: [], notes: {}, err: null};',
'  function done(){ document.title = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND"; }',
'  function check(what, ok, saw){ if(!ok) out.fails.push(what + (saw!==undefined ? " — " + saw : "")); }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      localStorage.clear();',
'      careerEntry();',
'      ccPickRole("roleFRG"); ccPickDiv(1); ccPickRegion("EU"); ccPickCountry("de");',
'      var n=document.getElementById("ccNick");',
'      n.value="Solo"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'      if(typeof ccSync==="function") ccSync();',
'      document.getElementById("ccStart").click();',
'',
'      // Somebody real in the seat, taken the way the inbox hands one over.',
'      var offer = careerDms().filter(function(t){',
'        return t.who && !t.who.org && !t.who.fan && !t.who.hater && !t.who.agent; })[0];',
'      if (offer) careerDmAccept(offer.id);',
'      var mate = careerPartnerCard();',
'      if (!mate) { out.err = "no partner to test with"; return done(); }',
'      var mateKey = hKey(mate);',
'      var meKey = hKey(careerCard());',
'      out.notes.partner = mate.handle;',
'',
'      // The feed announcing who has teamed up with whom.',
'      CAREER.career.news = [];',
'      careerWorldDuos({id: CAREER.career.season});',
'      var said = (CAREER.career.news || []).filter(function(e){',
'        return e.k === "ccNewsDuoAnnounce" || e.k === "ccNewsDuoAgain"; });',
'      out.notes.announced = said.map(function(e){',
'        return ((e.by && e.by.name) || "?") + " + " + (e.a && e.a[1]); });',
'      said.forEach(function(e){',
'        var a = hKey((e.by && e.by.name) || "");',
'        var b = String((e.a && e.a[1]) || "").toLowerCase();',
'        if (a === mateKey || b === hKey(mate.handle).replace(/[^a-z0-9_]/g, ""))',
'          out.fails.push("the world announced your own partner in another duo: " + a + " + " + b);',
'        if (a === meKey) out.fails.push("the world announced you in somebody else\\u2019s duo");',
'      });',
'',
'      // And a lobby, which is the place that always knew.',
'      var field = careerCupField(CAREER.career, [careerCard(), mate], 60, "onecheck", false);',
'      var seen = 0;',
'      (field || []).forEach(function(t){',
'        (t.squad || []).forEach(function(p){ if (hKey(p) === mateKey) seen++; });',
'      });',
'      out.notes.partnerSeatsInField = seen;',
'      check("a lobby seats your partner once, beside you", seen <= 1, String(seen));',
'',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oneduo-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,900',
  '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('one person, one duo, in the feed and in the lobby');
fs.rmSync(dir, { recursive: true, force: true });
