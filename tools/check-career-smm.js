// Somebody whose job is the audience.
//
// The stream rig raises what one night on stream is worth. This raises what
// everything is worth — a cup win, a promotion, an answer to a viewer, a night on
// stream — because it sits on careerReachAdd, the one funnel every gain goes
// through. His ask, 18 August: "чтоб благодаря нему больше подписчиков
// прибавляло".
//
// Three of them on three prices, so what a month costs and what it is worth are
// read off whoever was hired rather than off a constant.
//
// The thing worth guarding is the exception. Arriving in Division 1 tops a quiet
// career up TO ten thousand rather than BY it, and a figure that is a floor has
// to land exactly on the floor however many people are working on the socials.
//
//   node tools/check-career-smm.js
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
'  function fresh(money, div){',
'    localStorage.clear();',
'    careerEntry();',
'    ccPickRole("roleFRG"); ccPickDiv(div||1); ccPickRegion("EU"); ccPickCountry("de");',
'    var n=document.getElementById("ccNick");',
'    n.value="Poster"; n.dispatchEvent(new Event("input",{bubbles:true}));',
'    if(typeof ccSync==="function") ccSync();',
'    document.getElementById("ccStart").click();',
'    CAREER.career.balance = money;',
'  }',
'  function streamOnce(){',
'    var cr=CAREER.career;',
'    cr.energy=CC_ENERGY_DAY; cr.did={};',
'    var before=careerReach();',
'    careerDoAct("stream");',
'    return careerReach()-before;',
'  }',
'',
'  window.addEventListener("load", function(){',
'    try{',
'      function terms(m){ return ccSmmTermsOf(m); }',
'      var byFee = CC_SMM.slice().sort(function(a,b){ return terms(b).cost-terms(a).cost; });',
'      var DEAR = byFee[0], CHEAP = byFee[byFee.length-1];',
'      out.notes.list = CC_SMM.map(function(m){',
'        var t=terms(m);',
'        return m.name + " " + ccFollowers(m.x) + " $" + t.cost +',
'               " +" + Math.round(t.boost*100) + "%"; });',
'      check("the dear one is the strong one", terms(DEAR).boost > terms(CHEAP).boost,',
'            DEAR.name + " vs " + CHEAP.name);',
'      check("and the dear one is the one with the followers", DEAR.x > CHEAP.x,',
'            DEAR.x + " vs " + CHEAP.x);',
'      check("everybody has a face and an account",',
'            CC_SMM.every(function(m){ return m.photo && m.at && m.x > 0; }));',
'',
'      fresh(3000);',
'      check("a career starts without one", ccSmm() === null);',
'      check("and can hire", careerHireSmm(DEAR.id) === true);',
'      check("who costs his own fee", CAREER.career.balance === 3000 - terms(DEAR).cost,',
'            String(CAREER.career.balance));',
'      check("and is working", !!ccSmm());',
'      check("hiring a second is refused", careerHireSmm(CHEAP.id) === false);',
'      out.notes.who = ccSmm() && ccSmm().name;',
'',
'      CAREER.career.day = ccAddDays(CAREER.career.day, CC_SMM_DAYS + 1);',
'      check("a month later nobody is working", ccSmm() === null);',
'',
'      fresh(3000);',
'      var bare = streamOnce();',
'      fresh(3000);',
'      careerHireSmm(DEAR.id);',
'      var withDear = streamOnce();',
'      fresh(3000);',
'      careerHireSmm(CHEAP.id);',
'      var withCheap = streamOnce();',
'      out.notes.stream = {bare: bare, dear: withDear, cheap: withCheap};',
'      check("a night on stream brings more", withDear > bare, bare + " -> " + withDear);',
'      check("and it is the boost he asks for",',
'            Math.abs(withDear - Math.round(bare*(1+terms(DEAR).boost))) <= 1,',
'            withDear + " vs " + Math.round(bare*(1+terms(DEAR).boost)));',
'      check("the cheap one moves it less", withCheap < withDear,',
'            withCheap + " vs " + withDear);',
'',
'      fresh(3000);',
'      var r0 = careerReach();',
'      careerReachAdd(careerReachResult(1, 150, 1, "cup"));',
'      var plainWin = careerReach() - r0;',
'      fresh(3000);',
'      careerHireSmm(DEAR.id);',
'      var r1 = careerReach();',
'      careerReachAdd(careerReachResult(1, 150, 1, "cup"));',
'      var boostedWin = careerReach() - r1;',
'      out.notes.cupWin = {plain: plainWin, withSmm: boostedWin};',
'      check("and so does winning a cup", boostedWin > plainWin,',
'            plainWin + " -> " + boostedWin);',
'',
'      fresh(3000, 5);',
'      careerHireSmm(DEAR.id);',
'      CAREER.career.reach = 0;',
'      CAREER.career.division = 2;',
'      careerReachPromote(1);',
'      out.notes.d1floor = careerReach();',
'      check("arriving in Division 1 lands on the floor, not past it",',
'            careerReach() === CC_REACH_D1, String(careerReach()));',
'',
'      fresh(3000);',
'      careerHireSmm(DEAR.id);',
'      var bio = careerBioHTML();',
'      check("the bio names them", bio.indexOf(DEAR.name) >= 0, bio.slice(0, 160));',
'      careerEndSmm();',
'      check("and stops naming them when the month ends",',
'            careerBioHTML().indexOf(DEAR.name) < 0);',
'',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smm-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,900',
  '--virtual-time-budget=90000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the socials are a ladder of people, and the Division 1 floor is still a floor');
fs.rmSync(dir, { recursive: true, force: true });
