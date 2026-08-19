// A manager's terms are read off his account, not handed out.
//
// Six of the seven carried CC_AGENT_PLAIN because nobody had written them terms,
// so the list was João and six identical strangers. His call, 18 August: take it
// off their followers — which is the same measure the mode already prices for the
// player in CC_XFOLLOW.
//
// A bigger account opens more doors and gets more on the table, and charges more
// for it, so the trade is real rather than a straight upgrade. A hand-written
// term still wins where one exists.
//
// His ask, 19 August: the account should decide the whole of what a manager is,
// not only what he charges. So it also decides how often he is the one who
// writes — see ccAgentWeight — and the message he opens with, which read the
// ordinary deal and quoted 15% and +2 for everybody but João while the picker
// beside it and the contract underneath it were both priced off his followers.
//
// Then: do all of them honestly. Every count read off x.com the same day, the
// five that had none included, and João's hand-written four removed — so the
// ranking is the accounts and nothing else. The escape hatch is still there and
// still tested, against a literal now that no row uses it.
//
//   node tools/check-agent-terms.js
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
'      // The curve, printed at the anchors so a change to it is visible here.',
'      out.notes.curve = [500, 2500, 10000, 25000].map(function(x){',
'        var t = ccAgentTermsOf({x: x});',
'        return x + ": " + Math.round(t.cut*100) + "% · +" + t.reach + " · +" +',
'               Math.round((t.wage-1)*100) + "%"; });',
'',
'      var small = ccAgentTermsOf({x: 600});',
'      var big = ccAgentTermsOf({x: 20000});',
'      check("a bigger account opens more doors", big.reach > small.reach,',
'            small.reach + " vs " + big.reach);',
'      check("and gets more on the table", big.wage > small.wage,',
'            small.wage + " vs " + big.wage);',
'      check("and charges more for it", big.cut > small.cut,',
'            small.cut + " vs " + big.cut);',
'',
'      // An account nobody has read yet falls back rather than breaking.',
'      var none = ccAgentTermsOf({});',
'      out.notes.unmeasured = Math.round(none.cut*100) + "% · +" + none.reach +',
'                             " · +" + Math.round((none.wage-1)*100) + "%";',
'      check("an unread account gets the ordinary deal",',
'            none.cut === CC_AGENT_PLAIN.cut && none.reach === CC_AGENT_PLAIN.reach,',
'            out.notes.unmeasured);',
'',
'      // The escape hatch still works, though nobody on the list uses it now:',
'      // João was hand-priced on 17 August and read off his account on the 19th,',
'      // so this is checked against a literal rather than against a row.',
'      var byHand = {x: 700, cut: 0.10, reach: 4, wage: 1.25, weight: 3};',
'      var h = ccAgentTermsOf(byHand);',
'      check("a written-in term is not overwritten",',
'            h.cut === 0.10 && h.reach === 4 && h.wage === 1.25,',
'            JSON.stringify(h));',
'',
'      // And how often he is the one who writes, which is the other half of it.',
'      check("a bigger account writes more often",',
'            ccAgentWeight({x: 20000}) > ccAgentWeight({x: 600}),',
'            ccAgentWeight({x: 600}) + " vs " + ccAgentWeight({x: 20000}));',
'      check("an unread account draws the ordinary once",',
'            ccAgentWeight({}) === CC_AGENT_PLAIN.weight, String(ccAgentWeight({})));',
'      check("a written-in weight wins too", ccAgentWeight(byHand) === 3,',
'            String(ccAgentWeight(byHand)));',
'',
'      // Nobody is on the fallback any more — every row carries a real count,',
'      // so who is a catch is decided by the accounts and by nothing else.',
'      var unread = CC_AGENTS.filter(function(a){ return !a.x; });',
'      check("every manager is priced off a real account",',
'            unread.length === 0, unread.map(function(a){ return a.name; }).join(", "));',
'      var handled = CC_AGENTS.filter(function(a){',
'        return a.cut != null || a.reach != null || a.wage != null || a.weight != null; });',
'      check("and none of them is hand-priced on top of it",',
'            handled.length === 0, handled.map(function(a){ return a.name; }).join(", "));',
'',
'      // The one that broke: the terms were priced off the account and the',
'      // message that offers them was not, so every manager but João opened',
'      // with the ordinary deal while the list beside him and the contract he',
'      // signed said something else. Both sides read the same function now.',
'      CC_AGENTS.forEach(function(a){',
'        if (!a.x) return;',
'        var t = ccAgentTermsOf(a);',
'        check(a.name + " is quoted off his account, not the ordinary deal",',
'              !(t.cut === CC_AGENT_PLAIN.cut && t.reach === CC_AGENT_PLAIN.reach &&',
'                t.wage === CC_AGENT_PLAIN.wage));',
'      });',
'',
'      // A thread carries the three numbers it opened with, and signing reads',
'      // them back rather than pricing the man a second time.',
'      var some = CC_AGENTS.filter(function(a){ return a.x; })[0];',
'      if (some) {',
'        var st = ccAgentTermsOf(some);',
'        var back = ccAgentTermsOf({handle: some.name, cut: st.cut, reach: st.reach, wage: st.wage});',
'        check("the thread signs the deal it opened with",',
'              back.cut === st.cut && back.reach === st.reach && back.wage === st.wage,',
'              JSON.stringify(back) + " vs " + JSON.stringify(st));',
'      }',
'',
'      var pool = CC_AGENTS.reduce(function(s, a){ return s + ccAgentWeight(a); }, 0);',
'      out.notes.list = CC_AGENTS.map(function(a){',
'        var t = ccAgentTermsOf(a);',
'        return a.name + " — " + (a.x ? ccFollowers(a.x) : "not read yet") + " — " +',
'               Math.round(t.cut*100) + "% · +" + t.reach + " · +" +',
'               Math.round((t.wage-1)*100) + "% — writes " +',
'               Math.round(ccAgentWeight(a)/pool*100) + "% of seasons"; });',
'      out.notes.measured = CC_AGENTS.filter(function(a){ return a.x; }).length +',
'                           " of " + CC_AGENTS.length;',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'terms-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1200,900',
  '--virtual-time-budget=40000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the account sets the terms and the draw, and a written-in one still wins');
fs.rmSync(dir, { recursive: true, force: true });
