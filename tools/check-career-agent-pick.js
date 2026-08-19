// A manager is chosen, not dealt.
//
// One was drawn per season and wrote to you, so the whole decision was yes or no
// to whoever the draw produced — and the terms are per person, which nobody ever
// got to compare. His call, 18 August: "какие менеджеры есть, сделай их на выбор
// как коучей".
//
// What has to hold: the list is all of them, signing one is signing that one and
// his terms, the rating gate still applies, and nobody ends up with two.
//
//   node tools/check-career-agent-pick.js
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
'  function fresh(ovr){',
'    localStorage.clear();',
'    careerEntry();',
'    ccPickRole("roleFRG"); ccPickDiv(1); ccPickRegion("EU"); ccPickCountry("de");',
'    var n=document.getElementById("ccNick");',
'    n.value="Repped"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'    if(typeof ccSync==="function") ccSync();',
'    document.getElementById("ccStart").click();',
'    if (ovr != null) { CAREER.player.ovr = ovr; CAREER.player.ovrExact = ovr; }',
'  }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      out.notes.managers = CC_AGENTS.map(function(a){',
'        var cut = a.cut != null ? a.cut : CC_AGENT_PLAIN.cut;',
'        return a.name + " " + Math.round(cut*100) + "%"; });',
'      check("more than one to choose between", CC_AGENTS.length > 1, String(CC_AGENTS.length));',
'',
'      // The window lists every one of them.',
'      fresh(90);',
'      ccAgentPickOpen();',
'      var body = document.getElementById("agentPickBody").innerHTML;',
'      check("the window lists them all",',
'            CC_AGENTS.every(function(a){ return body.indexOf(a.name) >= 0; }));',
'      ccAgentPickClose();',
'',
'      // Signing one signs that one, on his own terms.',
'      var dear = CC_AGENTS.slice().sort(function(a,b){',
'        return (b.cut!=null?b.cut:CC_AGENT_PLAIN.cut) - (a.cut!=null?a.cut:CC_AGENT_PLAIN.cut); })[0];',
'      var cheap = CC_AGENTS.slice().sort(function(a,b){',
'        return (a.cut!=null?a.cut:CC_AGENT_PLAIN.cut) - (b.cut!=null?b.cut:CC_AGENT_PLAIN.cut); })[0];',
'      fresh(90);',
'      check("the one you pick is the one you get", careerSignAgent(cheap.name) === true);',
'      check("and it is him", careerAgent() && careerAgent().name === cheap.name,',
'            String(careerAgent() && careerAgent().name));',
'      var terms = careerAgentTerms();',
'      out.notes.signed = {who: cheap.name, cut: terms.cut, reach: terms.reach, wage: terms.wage};',
'      check("on his own share", Math.abs(terms.cut - (cheap.cut!=null?cheap.cut:CC_AGENT_PLAIN.cut)) < 1e-9,',
'            String(terms.cut));',
'      check("and a second one is refused", careerSignAgent(dear.name) === false);',
'',
'      // Ending it frees the seat, and a different man can take it.',
'      careerEndAgent();',
'      check("ending it leaves nobody", careerAgent() === null);',
'      check("and somebody else can sign", careerSignAgent(dear.name) === true);',
'      check("with his own share",',
'            Math.abs(careerAgentTerms().cut - (dear.cut!=null?dear.cut:CC_AGENT_PLAIN.cut)) < 1e-9);',
'',
'      // Nobody represents a career nobody is looking at.',
'      fresh(CC_AGENT_FROM - 5);',
'      check("under the line, nobody signs", careerSignAgent(cheap.name) === false);',
'      check("and the window says why",',
'            (ccAgentPickOpen(), document.getElementById("agentPickBody").innerHTML)',
'              .indexOf(String(CC_AGENT_FROM)) >= 0);',
'      ccAgentPickClose();',
'',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-'));
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
console.log('the managers are a list you choose from, and each brings his own terms');
fs.rmSync(dir, { recursive: true, force: true });
