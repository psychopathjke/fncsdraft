// Somewhere to live, bought instead of rented.
//
// His idea, 18 August, tiers and all: студия, однушка, двушка. It fits because
// the rent is already real — CC_RENT is forty-five countries from $300 to
// $1,800, taken every payday, and a month nobody can pay evicts the career and
// takes the duo and the club with it.
//
// A flat does two things. It ends the rent where it was bought, which is what
// the career that moved for a better ping is paying for. And the bigger ones add
// to the energy pool, the way the desk and the chair do, so a career that never
// left home still has a reason to buy one.
//
// What this holds: the price follows the local rent, the rent stops, the rooms
// count, a place bought in Skopje does nothing for a career living in Dublin,
// and a smaller flat cannot replace a bigger one.
//
//   node tools/check-career-flat.js
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
'  function fresh(money, home){',
'    localStorage.clear();',
'    careerEntry();',
'    ccPickRole("roleFRG"); ccPickDiv(1); ccPickRegion("EU"); ccPickCountry(home || "ru");',
'    var n=document.getElementById("ccNick");',
'    n.value="Owner"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'    if(typeof ccSync==="function") ccSync();',
'    document.getElementById("ccStart").click();',
'    CAREER.career.balance = money;',
'  }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      var STUDIO = ccFlatOf("studio"), THREE = ccFlatOf("three");',
'',
'      // Price follows the local rent, so the same flat is a different decision',
'      // in a different country. Russia is $500 a month, Germany $1,000.',
'      fresh(500000, "ru");',
'      var ruPrice = ccFlatPrice(STUDIO);',
'      fresh(500000, "de");',
'      var dePrice = ccFlatPrice(STUDIO);',
'      out.notes.price = {ru: ruPrice, de: dePrice, mult: STUDIO.mult};',
'      check("a flat costs what the place costs", dePrice > ruPrice, ruPrice + " vs " + dePrice);',
'      check("and it is the rent times the multiple", ruPrice === 500 * STUDIO.mult,',
'            String(ruPrice));',
'',
'      // The career that moved is the one paying rent, and the one a flat frees.',
'      fresh(500000, "ru");',
'      careerMoveTo("de");',
'      var rentBefore = ccRentNow();',
'      check("moving abroad starts a rent", rentBefore > 0, String(rentBefore));',
'      check("and the flat is bought", careerFlatBuy("studio") === true);',
'      check("and the rent stops", ccRentNow() === 0, String(ccRentNow()));',
'      out.notes.moved = {rentBefore: rentBefore, rentAfter: ccRentNow(),',
'                         paid: CAREER.flat && CAREER.flat.paid, place: CAREER.flat && CAREER.flat.place};',
'',
'      // It stays where it was bought.',
'      careerMoveTo("gb");',
'      check("a flat in Germany does nothing in Britain", ccRentNow() > 0, String(ccRentNow()));',
'      careerMoveTo("de");',
'      check("and works again on the way back", ccRentNow() === 0, String(ccRentNow()));',
'',
'      // The rooms are worth something to a career that never left.',
'      fresh(500000, "ru");',
'      var bare = careerEnergyMax();',
'      careerFlatBuy("three");',
'      var roomy = careerEnergyMax();',
'      out.notes.energy = {bare: bare, withFlat: roomy, cap: THREE.cap};',
'      check("the rooms add to the store", roomy === bare + THREE.cap,',
'            bare + " -> " + roomy);',
'',
'      // A smaller place is not an upgrade.',
'      check("a studio cannot replace three rooms", careerFlatBuy("studio") === false);',
'      check("and the same one twice is refused", careerFlatBuy("three") === false);',
'',
'      // Every country on the map is on the shelf, and one can be bought before',
'      // the career has moved there — which is the point of buying at all.',
'      fresh(500000, "ru");',
'      var places = ccFlatPlaces();',
'      out.notes.places = {n: places.length, cheapest: places[0].name + " $" + places[0].rent,',
'                          dearest: places[places.length-1].name + " $" + places[places.length-1].rent};',
'      check("every country and region is on the shelf",',
'            places.length === Object.keys(CC_RENT).length + Object.keys(CC_REGION_RENT).length,',
'            String(places.length));',
'      check("and the list starts at the cheapest", places[0].rent <= places[1].rent);',
'',
'      careerFlatPlacePick("de");',
'      check("a flat can be bought where you do not live", careerFlatBuy("studio") === true);',
'      check("and it is bought there", CAREER.flat.place === "de", String(CAREER.flat && CAREER.flat.place));',
'      check("but the rent at home is untouched until you move",',
'            ccFlatHere() === null);',
'      careerMoveTo("de");',
'      check("and moving in stops it", ccRentNow() === 0, String(ccRentNow()));',
'',
'      // And a career with no money is not sold one.',
'      fresh(100, "ru");',
'      check("no money, no flat", careerFlatBuy("studio") === false);',
'',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flat-'));
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
console.log('a place of your own ends the rent where it stands, and the rooms count');
fs.rmSync(dir, { recursive: true, force: true });
