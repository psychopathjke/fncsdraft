// Somebody has to sell the audience before anybody buys it.
//
// His distinction, 18 August: a marketing manager is not the social one. The
// social manager grows the audience; this one sells it — "они, я так понимаю,
// договариваются со спонсором о сделке". Before this a brand simply wrote the
// moment the follower count crossed a line, which was the one piece of money in
// the mode nobody had to do anything for.
//
// What has to hold: no manager, no offer and nothing signable; with one, the
// thresholds still apply because a brand is buying an audience; a bigger account
// lands a better rate; and the rate that lands is the rate that was shown.
//
//   node tools/check-career-marketing.js
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
'  function fresh(money, reach){',
'    localStorage.clear();',
'    careerEntry();',
'    ccPickRole("roleFRG"); ccPickDiv(1); ccPickRegion("EU"); ccPickCountry("de");',
'    var n=document.getElementById("ccNick");',
'    n.value="Sold"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'    if(typeof ccSync==="function") ccSync();',
'    document.getElementById("ccStart").click();',
'    CAREER.career.balance = money;',
'    CAREER.career.reach = reach;',
'  }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      out.notes.people = CC_MARKETING.map(function(m){',
'        var t = ccMktTermsOf(m);',
'        return m.name + " @" + m.at + " — $" + t.cost + "/mo · +" +',
'               Math.round((t.rate-1)*100) + "%"; });',
'      check("there are people to choose between", CC_MARKETING.length > 1);',
'',
'      // ---- nobody selling, nothing offered ------------------------------',
'      fresh(50000, 200000);',
'      check("a big audience alone brings nothing", ccSponsorOffer() === null);',
'      check("and nothing can be signed", careerSignSponsor("brand") === false);',
'      check("and the tile says who is missing",',
'            careerMktTileHTML().indexOf(L().ccMktNone) >= 0);',
'',
'      // ---- hire one and the table fills ---------------------------------',
'      var who = CC_MARKETING[0];',
'      check("one can be hired", careerHireMkt(who.id) === true);',
'      check("and is working", !!ccMkt());',
'      check("hiring a second is refused", careerHireMkt(CC_MARKETING[1].id) === false);',
'      var offer = ccSponsorOffer();',
'      out.notes.offer = offer && {id: offer.id, pay: offer.pay};',
'      check("now a brand is on the table", !!offer);',
'      check("and signing takes what was offered", careerSignSponsor(offer.id) === true);',
'      check("at the rate that was shown", ccSponsor() && ccSponsor().pay === offer.pay,',
'            String(ccSponsor() && ccSponsor().pay));',
'',
'      // ---- the audience still has to be there ---------------------------',
'      fresh(50000, 100);',
'      careerHireMkt(who.id);',
'      check("nobody sells an audience that is not there", ccSponsorOffer() === null);',
'',
'      // ---- a bigger account lands a better rate -------------------------',
'      var small = ccMktTermsOf({x: 600});',
'      var big = ccMktTermsOf({x: 20000});',
'      out.notes.curve = {small: small, big: big};',
'      check("a bigger account asks more", big.cost > small.cost, small.cost + " vs " + big.cost);',
'      check("and lands more", big.rate > small.rate, small.rate + " vs " + big.rate);',
'',
'      // ---- and the month runs out ---------------------------------------',
'      fresh(50000, 200000);',
'      careerHireMkt(who.id);',
'      CAREER.career.day = ccAddDays(CAREER.career.day, CC_MKT_DAYS + 1);',
'      check("a month later nobody is selling", ccMkt() === null);',
'      check("and the table is empty again", ccSponsorOffer() === null);',
'',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mkt-'));
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
console.log('a sponsorship is somebody\u2019s work, and the rate shown is the rate signed');
fs.rmSync(dir, { recursive: true, force: true });
