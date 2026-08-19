// Whether a career can find the way out of its own region.
//
// The move lives at the bottom of the shop tab, under the desk, and it is gated:
// ccMoveMatters is false for a career played as a real card, because the ping
// edge it sells only exists on a player who was built. So half the careers open
// the shop, scroll to the end and find nothing — and nothing on the screen says
// why, which reads as a missing feature rather than a rule.
//
//   node tools/check-career-move-visible.js
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
'  var out = {notes: {}, fails: [], err: null};',
'  function done(){ document.title = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND"; }',
'  window.addEventListener("load", function(){',
'    try{',
'      function look(asCard){',
'        localStorage.clear();',
'        careerEntry();',
'        ccPickRegion("EU");',
'        if(asCard){',
'          ccSetMode("card");',
'          var roster = careerRosterNowEU().slice().sort(function(a,b){ return b._ovr-a._ovr; });',
'          ccPickCard(roster[0].handle);',
'        } else {',
'          ccPickRole("roleFRG"); ccPickDiv(5); ccPickCountry("de");',
'          var n=document.getElementById("ccNick");',
'          n.value="Mover"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'        }',
'        if(typeof ccSync==="function") ccSync();',
'        var b=document.getElementById("ccStart");',
'        if(b.disabled) return {started:false};',
'        b.click();',
'        CAREER.career.balance = 50000;',
'        careerTab("shop");',
'        var html = document.getElementById("chBody").innerHTML;',
'        return {started:true, matters: ccMoveMatters(),',
'                tileInShop: html.indexOf("cc-move") >= 0,',
'                saysWhy: html.indexOf(L().ccMoveOnlyBuilt) >= 0,',
'                regions: html.indexOf("careerMoveShowRegion") >= 0,',
'                opensMap: html.indexOf("careerMoveOpen") >= 0,',
'                who: CAREER.player.handle || CAREER.player.nick};',
'      }',
'      out.notes.built = look(false);',
'      out.notes.takenCard = look(true);',
'      if(!out.notes.built.tileInShop) out.fails.push("a built player cannot find the move");',
'      if(!out.notes.takenCard.tileInShop) out.fails.push("a taken card is told nothing at all");',
'      if(!out.notes.takenCard.saysWhy) out.fails.push("a taken card is not told why it cannot move");',
'      if(!out.notes.takenCard.regions) out.fails.push("a taken card is not offered the regions");',
'      // A built player reaches them through the map button, which is where the',
'      // country picker lives too; a taken card has no map, so its regions are open.',
'      if(!out.notes.built.opensMap) out.fails.push("a built player lost the way into the map");',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'move-'));
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
console.log('the move is where the shop says it is');
fs.rmSync(dir, { recursive: true, force: true });
