// A qualification belongs to the pair that won it, in the region that gave it.
//
// His tester, 18 August: "if you qual grand finals for example with sky and then
// switch duo to scroll you can play grands with scroll — same with regions, when
// you qual for finals in eu you can play the finals in brazil".
//
// Both halves were the same hole in careerSlotHeld. It listed the Major, the
// LAN, the Reload circuit and the Last Chance, and not the Grand Finals seat all
// of them lead to — so nothing forfeited it. careerDmAccept already gives up
// whatever is held when a new partner signs, and careerMoveRegion now does the
// same when the career crosses an ocean.
//
//   node tools/check-career-seat-keeps.js
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
'  function fresh(){',
'    localStorage.clear();',
'    careerEntry();',
'    ccPickRole("roleFRG"); ccPickDiv(1); ccPickRegion("EU"); ccPickCountry("de");',
'    var n=document.getElementById("ccNick");',
'    n.value="Qualed"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'    if(typeof ccSync==="function") ccSync();',
'    document.getElementById("ccStart").click();',
'    CAREER.career.balance = 99999;',
'  }',
'  // A seat at the Grand Finals, won the way the Summit gives one out.',
'  function qualify(){',
'    CAREER.career.log = [{kind:"summit", stage:"final", place:1, of:40,',
'                          day:careerToday(), season:CAREER.career.season}];',
'  }',
'  function takeAnyone(){',
'    var o = careerDms().filter(function(t){',
'      return t.who && !t.who.org && !t.who.fan && !t.who.hater && !t.who.agent; })[0];',
'    if (o) careerDmAccept(o.id);',
'    return careerPartnerCard();',
'  }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      // ---- the seat exists at all -------------------------------------',
'      fresh(); qualify();',
'      var held = careerSlotHeld();',
'      out.notes.held = held && held.key;',
'      check("a Grand Finals seat is something you hold", !!held && held.key === "globals",',
'            String(held && held.key));',
'',
'      // ---- and it belongs to the pair ---------------------------------',
'      fresh(); qualify();',
'      var first = takeAnyone();',
'      check("there is somebody in the seat to lose", !!first);',
'      check("still holding it with them", !!careerSlotHeld());',
'      var others = careerDms().filter(function(t){ return t.who && !t.who.org && !t.who.fan && !t.who.hater && !t.who.agent && hKey(t.who.handle)!==hKey(first); });',
'      if (others.length) careerDmAccept(others[0].id);',
'      var second = careerPartnerCard();',
'      out.notes.swapped = {from: first && first.handle, to: second && second.handle};',
'      check("swapping partner forfeits the Grand Finals",',
'            careerSlotHeld() === null, String((careerSlotHeld()||{}).key));',
'      check("and it cannot be played with the new one",',
'            careerGlobalsCan({n:1}) === false);',
'',
'      // ---- and it belongs to the region -------------------------------',
'      fresh(); qualify();',
'      check("holding it in Europe", !!careerSlotHeld());',
'      check("the move goes through", careerMoveRegion("BR") === true);',
'      out.notes.afterMove = {region: ccCareerRegion(), held: (careerSlotHeld()||{}).key || null};',
'      check("crossing an ocean forfeits it too", careerSlotHeld() === null,',
'            String((careerSlotHeld()||{}).key));',
'      check("and Brazil will not have you in it",',
'            careerGlobalsCan({n:1}) === false);',
'      check("and it is said out loud",',
'            (CAREER.career.news||[]).some(function(e){ return e.k === "ccNewsSlotRegion"; }),',
'            ((CAREER.career.news||[])[0]||{}).k);',
'',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seat-'));
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
console.log('a seat belongs to the pair that won it, in the region that gave it');
fs.rmSync(dir, { recursive: true, force: true });
