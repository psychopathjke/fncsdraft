// A career can be born anywhere, and the world it wakes up in is local.
//
// Until 19 August only Europe could be built in: ccRegionReady let the other six
// through for a taken card and refused them for a made player, because the
// country picker is a map and only Europe had one. The other six are drawn now
// by tools/build-region-maps.js, so the gate is open — and with it open, three
// written-in 'EU's that never showed suddenly decide who an Oceanian plays.
//
// What has to hold: every region can be created in; the map and the ping table
// that come up belong to that region; the career keeps the region it was made
// in; and the people it meets — real cards, invented ladder players, their
// nationalities — are from there and nowhere else.
//
//   node tools/check-career-regions.js
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
'  function build(reg, code){',
'    localStorage.clear();',
'    careerEntry();',
'    ccSetMode("rookie");',
'    ccPickRegion(reg);',
'    ccPickRole("roleFRG"); ccPickDiv(3);',
'    ccPickCountry(code);',
'    var n=document.getElementById("ccNick");',
'    n.value="Local"+reg; n.dispatchEvent(new Event("input",{bubbles:true}));',
'    if(typeof ccSync==="function") ccSync();',
'    document.getElementById("ccStart").click();',
'  }',
'',
'  window.addEventListener("load", function(){',
'    // The shapes are a separate file now; nothing here can run before it.',
'    ccMapsReady(function(){',
'    try{',
'      out.notes.mapsLoaded = ccMapsHave();',
'      check("the maps arrive when asked for", ccMapsHave());',
'      // ---- the gate ----------------------------------------------------',
'      careerEntry(); ccSetMode("rookie");',
'      var open=CC_REGIONS.filter(function(r){ return ccRegionReady(r); });',
'      out.notes.buildableRegions=open;',
'      check("a player can be built in every region", open.length===CC_REGIONS.length,',
'            open.join(","));',
'',
'      // ---- each region brings its own map and its own milliseconds -------',
'      out.notes.per={};',
'      var euCodes=CC_COUNTRIES.map(function(e){return e.c;}).join(",");',
'      CC_REGIONS.forEach(function(reg){',
'        ccPickRegion(reg);',
'        var tbl=ccCountriesHere(reg), map=ccMapHere(reg);',
'        var codes=tbl.map(function(e){return e.c;});',
'        out.notes.per[reg]={countries:codes.length,',
'          ping:tbl[0].ping+".."+tbl[tbl.length-1].ping,',
'          first:codes.slice(0,4).join(",")};',
'        check(reg+" has a map", !!(map && map.c && Object.keys(map.c).length>4));',
'        check(reg+" has a country table", codes.length>4, String(codes.length));',
'        check(reg+" draws every country it lists",',
'              codes.every(function(c){ return !!map.c[c]; }));',
'        check(reg+" names every country it lists",',
'              codes.every(function(c){ return !!ccCountryName(c) && ccCountryName(c)!==c.toUpperCase(); }));',
'        if(reg!=="EU") check(reg+" is not Europe again", codes.join(",")!==euCodes);',
'        // The map is an SVG that actually renders shapes for this region.',
'        var svg=ccBuildMap(null, reg);',
'        check(reg+" builds an svg", svg.indexOf("<svg")===0 && svg.indexOf("cc-mp")>0);',
'      });',
'',
'      // ---- North America is one continent on two servers ---------------',
'      var nac=ccCountriesHere("NAC"), naw=ccCountriesHere("NAW");',
'      var nacUs=nac.find(function(e){return e.c==="us";});',
'      var nawUs=naw.find(function(e){return e.c==="us";});',
'      var nacCa=nac.find(function(e){return e.c==="ca";});',
'      var nawCa=naw.find(function(e){return e.c==="ca";});',
'      out.notes.northAmerica={usCentral:nacUs&&nacUs.ping, usWest:nawUs&&nawUs.ping,',
'                              caCentral:nacCa&&nacCa.ping, caWest:nawCa&&nawCa.ping};',
'      check("both American servers are local to the States",',
'            nacUs.ping<15 && nawUs.ping<15, nacUs.ping+" / "+nawUs.ping);',
'      check("and Canada is nearer the eastern one",',
'            nacCa.ping<nawCa.ping, nacCa.ping+" vs "+nawCa.ping);',
'      check("the two share their shapes", ccMapHere("NAC")===ccMapHere("NAW"));',
'',
'      // ---- a career built abroad stays abroad ----------------------------',
'      build("OCE","au");',
'      out.notes.oce={region:CAREER.player.region, country:CAREER.player.country,',
'                     ping:CAREER.player._pingMs};',
'      check("the career keeps its region", CAREER.player.region==="OCE",',
'            String(CAREER.player.region));',
'      check("and its country", CAREER.player.country==="au");',
'',
'      // Everybody it meets is Oceanian: the real roster, the invented ladder',
'      // and the nationalities handed to invented people.',
'      var roster=careerRosterNowEU();',
'      out.notes.oceRoster={n:roster.length,',
'        offRegion:roster.filter(function(p){return p.region!=="OCE";}).length};',
'      check("the roster is the region", roster.length>100 &&',
'            roster.every(function(p){ return p.region==="OCE"; }),',
'            out.notes.oceRoster.offRegion+" from elsewhere");',
'',
'      var rnd=careerRng(1234), taken=new Set(), made=[];',
'      for(var i=0;i<40;i++) made.push(careerLadderPlayer(rnd, 60, taken));',
'      out.notes.madeRegions=Array.from(new Set(made.map(function(p){return p.region;}))).join(",");',
'      check("invented players are local", made.every(function(p){ return p.region==="OCE"; }),',
'            out.notes.madeRegions);',
'      var oceNats=new Set(careerRosterNowEU().map(function(p){return p.nat;}));',
'      var madeNats=Array.from(new Set(made.map(function(p){return p.nat;})));',
'      out.notes.madeNats=madeNats.slice(0,6).join(", ");',
'      check("and carry nationalities from the region",',
'            madeNats.every(function(n){ return !n || oceNats.has(n); }), out.notes.madeNats);',
'',
'      // ---- and its ladder is its own -------------------------------------',
'      out.notes.oceBand={d1:ccBand(1), d5:ccBand(5), shift:ccDivShift()};',
'      check("the division band moved with the region", ccBand(1)<CC_DIV_RATING[1],',
'            ccBand(1)+" vs "+CC_DIV_RATING[1]);',
'      var d1=careerRosterNowEU().filter(function(p){',
'        return (p._ovr!=null?p._ovr:attrsFor(p).ovr)>=ccBand(1); }).length;',
'      out.notes.oceDivisionOne=d1;',
'      check("and Oceania has a Division 1 to play in", d1>80, String(d1));',
'',
'      // Europe is untouched by all of it.',
'      build("EU","de");',
'      out.notes.eu={region:CAREER.player.region, band:ccBand(1), ping:CAREER.player._pingMs};',
'      check("Europe still starts at 82", ccBand(1)===82, String(ccBand(1)));',
'      check("and Germany is still one millisecond", ccPingOf("de","EU")===1,',
'            String(ccPingOf("de","EU")));',
'',
'      done();',
'    }catch(e){ out.err = String(e && e.stack || e); done(); }',
'    });',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// Inside the project: the page loads maps.js by a relative path now.
const dir = fs.mkdtempSync(path.join(ROOT, 'probe-regions-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
// The page fetches maps.js beside itself, so the probe needs its own copy.
fs.copyFileSync(path.join(ROOT, 'maps.js'), path.join(dir, 'maps.js'));
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,900',
  '--virtual-time-budget=90000', '--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a career can be born in any region, and the world it wakes up in is local');
fs.rmSync(dir, { recursive: true, force: true });
